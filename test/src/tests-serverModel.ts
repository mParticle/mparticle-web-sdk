import Types from '../../src/types';
import sinon from 'sinon';
import { urls, testMPID, apiKey } from './config';
import { expect } from 'chai';
import { ServerDTO, UploadObject } from '../../src/serverModel';
import { AllUserAttributes, IdentityApiData } from '@mparticle/web-sdk';
import {
    BaseEvent,
    MParticleUser,
    SDKConsentState,
    SDKEvent,
} from '../../src/sdkRuntimeModels';

let mockServer;
let initialEvent = {};
let testEvent = {};
const mParticle = window.mParticle;
const ServerModel = mParticle.getInstance()._ServerModel;

describe('ServerModel', () => {
    beforeEach(() => {
        initialEvent = {
            messageType: Types.MessageType.PageEvent,
            name: 'foo page',
            data: { 'foo-attr': 'foo-val' },
            eventType: Types.EventType.Navigation,
            customFlags: { 'foo-flag': 'foo-flag-val' },
        };
    });

    describe('#appendUserInfo', () => {
        it('should append User Identities and Attributes to event', () => {
            const user = {
                getUserIdentities: () => {
                    return {
                        userIdentities: {
                            customerid: '1234567',
                            email: 'foo-email',
                            other: 'foo-other',
                            other2: 'foo-other2',
                            other3: 'foo-other3',
                            other4: 'foo-other4',
                        },
                    };
                },
                getAllUserAttributes: () => {
                    return {
                        'foo-user-attr': 'foo-attr-value',
                        'foo-user-attr-list': ['item1', 'item2'],
                    };
                },
                getMPID: () => {
                    return '98765';
                },
                getConsentState: () => {
                    return {
                        gdpr: {
                            'test-purpose': {
                                consented: true,
                                timestamp: 11111,
                                consent_document: 'gdpr-doc',
                                location: 'test-gdpr-location',
                                hardwareId: 'test-gdpr-hardware',
                            },
                        },
                        ccpa: {
                            data_sale_opt_out: {
                                consented: false,
                                timestamp: 22222,
                                consent_document: 'ccpa-doc',
                                location: 'test-ccpa-location',
                                hardwareId: 'test-ccpa-hardware',
                            },
                        },
                    };
                },
            };

            const event: SDKEvent = {
                EventName: 'Test Event',
                MPID: '',
                IsFirstRun: true,
                DeviceId: 'test-device',
                EventCategory: 0,
                SourceMessageId: 'test-source-message-id',
                SDKVersion: 'test-version',
                SessionId: 'test-session-id',
                SessionStartDate: 0,
                Timestamp: 0,
                EventDataType: 0,
                Debug: true,
                CurrencyCode: 'USD',
            };

            ServerModel.appendUserInfo(user, event as SDKEvent);

            expect(event.MPID).to.equal('98765');
            expect(event.ConsentState).to.eql({
                gdpr: {
                    'test-purpose': {
                        consented: true,
                        timestamp: 11111,
                        consent_document: 'gdpr-doc',
                        location: 'test-gdpr-location',
                        hardwareId: 'test-gdpr-hardware',
                    },
                },
                ccpa: {
                    data_sale_opt_out: {
                        consented: false,
                        timestamp: 22222,
                        consent_document: 'ccpa-doc',
                        location: 'test-ccpa-location',
                        hardwareId: 'test-ccpa-hardware',
                    },
                },
            });
            expect(event.UserAttributes).to.eql({
                'foo-user-attr': 'foo-attr-value',
                'foo-user-attr-list': ['item1', 'item2'],
            });
            expect(event.UserIdentities).to.eql([
                { Identity: 'foo-other', Type: 0 },
                { Identity: '1234567', Type: 1 },
                { Identity: 'foo-email', Type: 7 },
                { Identity: 'foo-other2', Type: 10 },
                { Identity: 'foo-other3', Type: 11 },
                { Identity: 'foo-other4', Type: 12 },
            ]);
        });

        it('sets User Attributes and Identities to null if user is empty', () => {
            const event = {} as SDKEvent;

            ServerModel.appendUserInfo(null, event);
            expect(event.MPID).to.eql(null);
            expect(event.ConsentState).to.eql(null);
            expect(event.UserIdentities).to.eql(null);
            expect(event.UserAttributes).to.eql(null);
        });

        it('returns undefined if event is empty', () => {
            expect(ServerModel.appendUserInfo({} as MParticleUser, null)).to.be
                .undefined;
        });

        it('returns early if event MPID matches User MPID', () => {
            const user = {
                getUserIdentities: () => {
                    return { userIdentities: {} };
                },
                getAllUserAttributes: () => {
                    return null;
                },
                getMPID: () => {
                    return '123456';
                },
                getConsentState: () => {
                    return null;
                },
            };

            const event = {
                MPID: '123456',
            };

            ServerModel.appendUserInfo(user, event as SDKEvent);

            expect(event.MPID).to.equal('123456');
        });

        it('updates event MPID with User MPID', () => {
            const user = {
                getUserIdentities: () => {
                    return { userIdentities: {} };
                },
                getAllUserAttributes: () => {
                    return null;
                },
                getMPID: () => {
                    return '123456';
                },
                getConsentState: () => {
                    return null;
                },
            };

            const event = {
                MPID: '555666777',
            };

            ServerModel.appendUserInfo(user, event as SDKEvent);

            expect(event.MPID).to.equal('123456');
        });

        it('returns early if event and user are not valid', () => {
            expect(ServerModel.appendUserInfo(null, null)).to.be.undefined;
        });
    });

    describe('#convertToConsentStateDTO', () => {
        it('should convert Consente State with GDPR to a DTO', () => {
            const consentState = ({
                getGDPRConsentState: () => {
                    return {
                        'test-gdpr-purpose': {
                            Consented: true,
                            Timestamp: 12345,
                            ConsentDocument: 'gdpr-doc',
                            Location: 'test-gdpr-location',
                            HardwareId: 'test-gdpr-hardware-id',
                        },
                    };
                },
                getCCPAConsentState: () => {},
            } as unknown) as SDKConsentState;
            const expectedDTO = {
                gdpr: {
                    'test-gdpr-purpose': {
                        c: true,
                        d: 'gdpr-doc',
                        h: 'test-gdpr-hardware-id',
                        l: 'test-gdpr-location',
                        ts: 12345,
                    },
                },
            };

            expect(ServerModel.convertToConsentStateDTO(consentState)).to.eql(
                expectedDTO
            );
        });

        it('should convert Consente State with CCPA to a DTO', () => {
            const consentState = ({
                getGDPRConsentState: () => {},
                getCCPAConsentState: () => {
                    return {
                        Consented: false,
                        Timestamp: 67890,
                        ConsentDocument: 'ccpa-doc',
                        Location: 'test-ccpa-location',
                        HardwareId: 'test-ccpa-hardware-id',
                    };
                },
            } as unknown) as SDKConsentState;
            const expectedDTO = {
                ccpa: {
                    data_sale_opt_out: {
                        c: false,
                        d: 'ccpa-doc',
                        h: 'test-ccpa-hardware-id',
                        l: 'test-ccpa-location',
                        ts: 67890,
                    },
                },
            };

            expect(ServerModel.convertToConsentStateDTO(consentState)).to.eql(
                expectedDTO
            );
        });

        it('should convert Consente State with both GDPR and CCPA to a DTO', () => {
            const consentState = ({
                getGDPRConsentState: () => {
                    return {
                        'test-gdpr-purpose': {
                            Consented: true,
                            Timestamp: 12345,
                            ConsentDocument: 'gdpr-doc',
                            Location: 'test-gdpr-location',
                            HardwareId: 'test-gdpr-hardware-id',
                        },
                    };
                },
                getCCPAConsentState: () => {
                    return {
                        Consented: false,
                        Timestamp: 67890,
                        ConsentDocument: 'ccpa-doc',
                        Location: 'test-ccpa-location',
                        HardwareId: 'test-ccpa-hardware-id',
                    };
                },
            } as unknown) as SDKConsentState;
            const expectedDTO = {
                gdpr: {
                    'test-gdpr-purpose': {
                        c: true,
                        d: 'gdpr-doc',
                        h: 'test-gdpr-hardware-id',
                        l: 'test-gdpr-location',
                        ts: 12345,
                    },
                },
                ccpa: {
                    data_sale_opt_out: {
                        c: false,
                        d: 'ccpa-doc',
                        h: 'test-ccpa-hardware-id',
                        l: 'test-ccpa-location',
                        ts: 67890,
                    },
                },
            };

            expect(ServerModel.convertToConsentStateDTO(consentState)).to.eql(
                expectedDTO
            );
        });

        it('returns null if Consent State is null', () => {
            expect(ServerModel.convertToConsentStateDTO(null)).to.eql(null);
        });
    });

    describe('#createEventObject', () => {});

    describe('#convertEventToDTO', () => {
        it('should return defaults', () => {
            const uploadObject = ({
                EventName: 'test-name',
                EventCategory: Types.EventType.Navigation,
                EventAttributes: {},
                UserAttributes: {},
                UserIdentities: [],
                IntegrationAttributes: [],
                Store: {},
                SDKVersion: '1.2.3',
                SessionId: 'test-session-id',
                SessionLength: 33000,
                SessionStartDate: 11111,
                EventDataType: Types.MessageType.PageEvent,
                Debug: true,
                Timestamp: 22222,
                Location: {
                    lat: 123445,
                    lng: 323232,
                },
                OptOut: false,
                AppVersion: 'test-app.1235',
                ClientGeneratedId: 'test-client-id',
                DeviceId: 'test-device',
                MPID: 'test-mpid',
                ExpandedEventCount: 0,
                currentSessionMPIDs: ['test-mpids'],
            } as unknown) as UploadObject;

            const actualDTO = ServerModel.convertEventToDTO(uploadObject);

            expect(actualDTO.n, 'event.EventName (n)').to.equal('test-name');
            expect(actualDTO.et, 'event.EventType (et)').to.equal(
                Types.EventType.Navigation
            );
            expect(actualDTO.ua, 'event.UserAttributes (ua)').to.eql({});
            expect(actualDTO.ui, 'event.UserIdentities (ui)').to.eql([]);
            expect(actualDTO.ia, 'event.IntegrationAttributes (ia)').to.eql([]);
            expect(actualDTO.str, 'event.Store (str)').to.eql({});
            expect(actualDTO.attrs, 'event.EventAttributes (attrs)').to.eql({});
            expect(actualDTO.sdk, 'event.SDKVersion (sdk)').to.equal('1.2.3');
            expect(actualDTO.sid, 'event.SessionId (sid)').to.equal(
                'test-session-id'
            );
            expect(actualDTO.sl, 'event.SessionLength (sl)').to.equal(33000);
            expect(actualDTO.ssd, 'event.SessionStartDate (ssd)').to.equal(
                11111
            );
            expect(actualDTO.dt, 'event.EventDataType (dt)').to.equal(
                Types.MessageType.PageEvent
            );
            expect(actualDTO.dbg, 'event.Debug (dbg)').to.equal(true);
            expect(actualDTO.ct, 'event.TimeStamp (ct)').to.equal(22222);
            expect(actualDTO.lc, 'event.Location (lc)').to.eql({
                lat: 123445,
                lng: 323232,
            });
            expect(actualDTO.o, 'event.OptOut (o)').to.equal(false);
            expect(actualDTO.eec, 'event.ExpandedEventCount (eec)').to.equal(0);
            expect(actualDTO.av, 'event.AppVersion (av)').to.equal(
                'test-app.1235'
            );
            expect(actualDTO.cgid, 'event.ClientGeneratedId (cgid)').to.equal(
                'test-client-id'
            );
            expect(actualDTO.das, 'event.DeviceId (das)').to.equal(
                'test-device'
            );
            expect(actualDTO.mpid, 'event.MPID (mpid)').to.equal('test-mpid');
            expect(
                actualDTO.smpids,
                'event.currentSessionMPIDs (smpids)'
            ).to.eql(['test-mpids']);
        });

        it('should add data plan id to DTO', () => {
            const uploadObject = {
                DataPlan: {
                    PlanId: 'test-data-plan',
                    PlanVersion: 3,
                },
            } as UploadObject;

            const actualDTO = ServerModel.convertEventToDTO(uploadObject);

            expect(actualDTO.dp_id, 'event.DataPlan.PlanId (dp_id)').to.equal(
                'test-data-plan'
            );
            expect(
                actualDTO.dp_v,
                'event.DataPlan.PlanVersion (dp_v)'
            ).to.equal(3);
        });

        it('should add consent state to DTO', () => {
            const uploadObject = {
                ConsentState: {
                    getGDPRConsentState: () => {
                        return {
                            'test-gdpr-purpose': {
                                Consented: true,
                                Timestamp: 12345,
                                ConsentDocument: 'gdpr-doc',
                                Location: 'test-gdpr-location',
                                HardwareId: 'test-gdpr-hardware-id',
                            },
                        };
                    },
                    getCCPAConsentState: () => {
                        return {
                            Consented: false,
                            Timestamp: 67890,
                            ConsentDocument: 'ccpa-doc',
                            Location: 'test-ccpa-location',
                            HardwareId: 'test-ccpa-hardware-id',
                        };
                    },
                } as SDKConsentState,
            } as UploadObject;

            const actualDTO = ServerModel.convertEventToDTO(uploadObject);

            expect(actualDTO.con, 'event.ConsentState (con)').to.eql({
                gdpr: {
                    'test-gdpr-purpose': {
                        c: true,
                        d: 'gdpr-doc',
                        h: 'test-gdpr-hardware-id',
                        l: 'test-gdpr-location',
                        ts: 12345,
                    },
                },
                ccpa: {
                    data_sale_opt_out: {
                        c: false,
                        d: 'ccpa-doc',
                        h: 'test-ccpa-hardware-id',
                        l: 'test-ccpa-location',
                        ts: 67890,
                    },
                },
            });
        });

        it('should add AST data to DTO', () => {
            const uploadObject = ({
                EventDataType: Types.MessageType.AppStateTransition,
                IsFirstRun: true,
                LaunchReferral: 'https://mparticle.com/test-referral',
                EventAttributes: {
                    foo: 'bar', // TODO: test will nullify these
                },
            } as unknown) as UploadObject;

            const actualDTO = ServerModel.convertEventToDTO(uploadObject);

            expect(actualDTO.fr, 'event.IsFirstRun (fr)').to.equal(true);

            // TODO: What is IU?
            expect(actualDTO.iu, '(iu)').to.equal(false);
            expect(
                actualDTO.at,
                'event.ApplicationTransitionType.AppInit (at)'
            ).to.equal(Types.ApplicationTransitionType.AppInit);
            expect(actualDTO.lr, 'event.LaunchReferral (lr)').to.equal(
                'https://mparticle.com/test-referral'
            );

            // TODO: Why do we nullify this?
            expect(actualDTO.attrs, 'event.EventAttributes (attrs)').to.eql(
                null
            );
        });

        it('should add custom flags to DTO', () => {
            const uploadObject = {
                CustomFlags: {
                    foo: 'bar',
                    fizz: ['bizz', 'buzz', 37, true],
                    answer: 42,
                    isCustom: false,
                }
            } as unknown as UploadObject;

            const expectedFlags = {
                foo: ['bar'],
                fizz: ['bizz', 'buzz', '37', 'true'],
                answer: ['42'],
                isCustom: ['false'],
            };

            const actualDTO = ServerModel.convertEventToDTO(uploadObject);

            expect(actualDTO.flags).to.eql(expectedFlags);
        });

        it('should add shopping cart to DTO', () => {
            const uploadObject = {
                CurrencyCode: 'USD',
                EventDataType: Types.MessageType.Commerce,
                ShoppingCart: {
                    ProductList: [{
                        Sku: 'SKU-12345',
                        Name: 'Some Item',
                        Price: '42',
                        Quantity: '3',
                        Brand: 'mParticle',
                        Variant: 'blue',
                        Category: 'product',
                        Position: 1,
                        CouponCode: 'FIDDY',
                        TotalAmount: '41.50',
                        Attributes: {
                            foo: 'bar',
                            fizz: 'bizz',
                        }
                    }, {
                        Sku: 'SKU-67890',
                        Name: 'Some Other Item',
                        Price: '37',
                        Quantity: '5',
                        Brand: 'mParticle',
                        Variant: 'red',
                        Category: 'not-product',
                        Position: 2,
                        CouponCode: 'FIDDY',
                        TotalAmount: '36.50',
                        Attributes: {
                            fizz: 'buzz',
                        }
                    }],
                }
            } as unknown as UploadObject;

            const expectedShoppingCart = {
                pl: [{
                    id: 'SKU-12345',
                    nm: 'Some Item',
                    pr: 42,
                    qt: 3,
                    br: 'mParticle',
                    va: 'blue',
                    ca: 'product',
                    ps: 1,
                    cc: 'FIDDY',
                    tpa: 41.5,
                    attrs: {
                        foo: 'bar',
                        fizz: 'bizz',
                    }
                }, {
                    id: 'SKU-67890',
                    nm: 'Some Other Item',
                    pr: 37,
                    qt: 5,
                    br: 'mParticle',
                    va: 'red',
                    ca: 'not-product',
                    ps: 2,
                    cc: 'FIDDY',
                    tpa: 36.5,
                    attrs: {
                        fizz: 'buzz',
                    }
                }]
            };
            const actualDTO = ServerModel.convertEventToDTO(uploadObject)

            expect(actualDTO.cu).to.equal('USD');
            expect(actualDTO.sc).to.eql(expectedShoppingCart);
        });
        it.only('should add empty array to DTO if shopping cart is empty', () => {

            const uploadObject = {
                CurrencyCode: 'USD',
                EventDataType: Types.MessageType.Commerce,
                ShoppingCart: {}
            } as unknown as UploadObject;

            const expectedShoppingCart = {
                pl: []
            };
            const actualDTO = ServerModel.convertEventToDTO(uploadObject)

            expect(actualDTO.cu).to.equal('USD');
            expect(actualDTO.sc).to.eql(expectedShoppingCart);
        });

        it('should add product action to DTO', () => {});

        it('should add promotion action to DTO', () => {});

        it('should add product impression to DTO', () => {});

        it('should add profile to DTO', () => {});
    });

    describe('Integration Tests', function() {
        var event = {
            messageType: Types.MessageType.PageEvent,
            name: 'foo page',
            data: { 'foo-attr': 'foo-val' },
            eventType: Types.EventType.Navigation,
            customFlags: { 'foo-flag': 'foo-flag-val' },
        };

        beforeEach(function() {
            mockServer = sinon.createFakeServer();
            mockServer.respondImmediately = true;

            mockServer.respondWith(urls.eventsV2, [
                200,
                {},
                JSON.stringify({ mpid: testMPID, Store: {} }),
            ]);
            mockServer.respondWith(urls.identify, [
                200,
                {},
                JSON.stringify({ mpid: testMPID, is_logged_in: false }),
            ]);
            mParticle.init(apiKey, mParticle.config);
        });

        afterEach(function() {
            mockServer.restore();
        });

        it('Should not convert data plan object to server DTO when no id or version is set', function(done) {
            let sdkEvent = window.mParticle
                .getInstance()
                ._ServerModel.createEventObject(event);

            let upload = window.mParticle
                .getInstance()
                ._ServerModel.convertEventToDTO(sdkEvent as UploadObject);

            upload.should.not.have.property('dp_id');
            upload.should.not.have.property('dp_v');
            done();
        });

        it('Should convert data plan id to server DTO', function(done) {
            mParticle._resetForTests();
            mParticle.config.dataPlan = {
                planId: 'plan-slug',
            };

            mParticle.init('foo', mParticle.config);
            let sdkEvent = mParticle
                .getInstance()
                ._ServerModel.createEventObject(event);
            let upload = mParticle
                .getInstance()
                ._ServerModel.convertEventToDTO(sdkEvent as UploadObject);

            upload.should.have.property('dp_id', 'plan-slug');
            upload.should.not.have.property('dp_v');
            done();
        });

        it('Should not convert data plan object to server DTO when no id is set', function(done) {
            mParticle._resetForTests();
            mParticle.config.dataPlan = {
                planVersion: 5,
            };

            mParticle.init('foo', mParticle.config);
            let sdkEvent = mParticle
                .getInstance()
                ._ServerModel.createEventObject(event);
            let upload = mParticle
                .getInstance()
                ._ServerModel.convertEventToDTO(sdkEvent as UploadObject);

            upload.should.not.have.property('dp_id');
            upload.should.not.have.property('dp_v');
            done();
        });

        it('Should convert entire data plan object to server DTO', function(done) {
            mParticle._resetForTests();
            mParticle.config.dataPlan = {
                planId: 'plan-slug',
                planVersion: 10,
            };

            mParticle.init('foo', mParticle.config);
            let sdkEvent = mParticle
                .getInstance()
                ._ServerModel.createEventObject(event);
            let upload = mParticle
                .getInstance()
                ._ServerModel.convertEventToDTO(sdkEvent as UploadObject);

            upload.should.have.property('dp_id', 'plan-slug');
            upload.should.have.property('dp_v', 10);
            done();
        });

        it('Should convert complete consent object', function(done) {
            var consentState = mParticle
                .getInstance()
                ._Consent.createConsentState();

            consentState.addGDPRConsentState(
                'foo',
                mParticle
                    .getInstance()
                    ._Consent.createPrivacyConsent(
                        true,
                        10,
                        'foo document',
                        'foo location',
                        'foo hardware id'
                    )
            );

            var consent = mParticle
                .getInstance()
                ._ServerModel.convertToConsentStateDTO(consentState);

            expect(consent).to.be.ok;

            consent.should.have.property('gdpr');
            consent.gdpr.should.have.property('foo');
            consent.gdpr.foo.should.have.property('c', true);
            consent.gdpr.foo.should.have.property('ts', 10);
            consent.gdpr.foo.should.have.property('d', 'foo document');
            consent.gdpr.foo.should.have.property('l', 'foo location');
            consent.gdpr.foo.should.have.property('h', 'foo hardware id');
            done();
        });

        it('Should not append user info when no user exists', function(done) {
            mParticle.getInstance()._Store.should.be.ok;

            let sdkEvent = mParticle
                .getInstance()
                ._ServerModel.createEventObject(event);

            sdkEvent.should.be.ok;
            expect(sdkEvent.UserIdentities).to.eql([]);
            expect(sdkEvent.UserAttributes).to.eql({});
            expect(sdkEvent.ConsentState === null).to.eql(true);
            done();
        });

        it('Should append all user info when user is present', function(done) {
            mParticle.getInstance()._Store.should.be.ok;
            var consentState = mParticle
                .getInstance()
                ._Consent.createConsentState();
            consentState.addGDPRConsentState(
                'foo',
                mParticle
                    .getInstance()
                    ._Consent.createPrivacyConsent(
                        true,
                        10,
                        'foo document',
                        'foo location',
                        'foo hardware id'
                    )
            );

            const expectedUserIdentities = [
                { Identity: 'foo-other', Type: 0 },
                { Identity: '1234567', Type: 1 },
                { Identity: 'foo-email', Type: 7 },
                { Identity: 'foo-other2', Type: 10 },
                { Identity: 'foo-other3', Type: 11 },
                { Identity: 'foo-other4', Type: 12 },
            ];

            const expectedUserAttributes = {
                'foo-user-attr': 'foo-attr-value',
                'foo-user-attr-list': ['item1', 'item2'],
            };

            window.mParticle.getInstance().Identity.getCurrentUser = () => {
                return {
                    getUserIdentities: () => {
                        return {
                            userIdentities: {
                                customerid: '1234567',
                                email: 'foo-email',
                                other: 'foo-other',
                                other2: 'foo-other2',
                                other3: 'foo-other3',
                                other4: 'foo-other4',
                            },
                        };
                    },
                    getAllUserAttributes: () => {
                        return {
                            'foo-user-attr': 'foo-attr-value',
                            'foo-user-attr-list': ['item1', 'item2'],
                        };
                    },
                    getMPID: () => {
                        return '98765';
                    },
                    getConsentState: () => {
                        return consentState;
                    },
                };
            };
            let sdkEvent = mParticle
                .getInstance()
                ._ServerModel.createEventObject(event);

            expect(sdkEvent).to.be.ok;
            expect(sdkEvent.UserIdentities).to.eql(expectedUserIdentities);
            expect(sdkEvent.MPID).to.equal('98765');
            expect(sdkEvent.UserAttributes).to.eql(expectedUserAttributes);
            expect(sdkEvent.ConsentState).to.be.ok;

            done();
        });

        it('Should append identities when user present', function(done) {
            let sdkEvent = mParticle
                .getInstance()
                ._ServerModel.createEventObject(event);

            sdkEvent.should.be.ok;
            expect(sdkEvent.UserIdentities).to.eql([]);

            var user = {
                getUserIdentities: () => {
                    return {
                        userIdentities: {
                            customerid: '1234567',
                            email: 'foo-email',
                            other: 'foo-other',
                            other2: 'foo-other2',
                            other3: 'foo-other3',
                            other4: 'foo-other4',
                            not_a_valid_id: 'foo',
                        },
                    };
                },
                getAllUserAttributes: () => {
                    return null;
                },
                getMPID: () => {
                    return null;
                },
                getConsentState: () => {
                    return null;
                },
            };

            var identityMapping = {};
            identityMapping[Types.IdentityType.CustomerId] = '1234567';
            identityMapping[Types.IdentityType.Email] = 'foo-email';
            identityMapping[Types.IdentityType.Other] = 'foo-other';
            identityMapping[Types.IdentityType.Other2] = 'foo-other2';
            identityMapping[Types.IdentityType.Other3] = 'foo-other3';
            identityMapping[Types.IdentityType.Other4] = 'foo-other4';

            mParticle.getInstance()._ServerModel.appendUserInfo(user, sdkEvent);
            sdkEvent.UserIdentities.should.be.ok;
            sdkEvent.UserIdentities.length.should.equal(6);

            sdkEvent.UserIdentities.forEach(function(id) {
                var type = id.Type;
                var value = id.Identity;
                identityMapping[type].should.equal(value);
            });

            done();
        });

        it('Should append user attributes when user present', function(done) {
            let sdkEvent = mParticle
                .getInstance()
                ._ServerModel.createEventObject(event);

            sdkEvent.should.be.ok;
            expect(sdkEvent.UserAttributes).to.eql({});
            var attributes = { foo: 'bar', 'foo-arr': ['bar1', 'bar2'] };
            var user: MParticleUser = {
                // TODO: Compiler is not happy with this
                getUserIdentities: (): IdentityApiData => {
                    return ({
                        userIdentites: {},
                    } as unknown) as IdentityApiData;
                },
                getAllUserAttributes: (): AllUserAttributes => {
                    return attributes;
                },
                getMPID: () => {
                    return null;
                },
                getConsentState: () => {
                    return null;
                },
            };

            mParticle.getInstance()._ServerModel.appendUserInfo(user, sdkEvent);
            expect(sdkEvent.UserAttributes).to.be.ok;
            expect(sdkEvent.UserAttributes).to.eql(attributes);

            done();
        });

        it('Should update mpid when user info is appended with a new mpid', function(done) {
            let sdkEvent = mParticle
                .getInstance()
                ._ServerModel.createEventObject(event);

            sdkEvent.should.be.ok;

            // By default, all tests instances have 'testMPID'
            expect(sdkEvent.MPID).to.equal('testMPID');

            // TODO: this makes the compiler angry unless we make it hacky
            var user: MParticleUser = {
                getUserIdentities: () => {
                    return ({
                        userIdentites: {},
                    } as unknown) as IdentityApiData;
                },
                getAllUserAttributes: () => {
                    return null;
                },
                getMPID: () => {
                    return '98765';
                },
                getConsentState: () => {
                    return null;
                },
            };
            mParticle.getInstance()._ServerModel.appendUserInfo(user, sdkEvent);
            expect(sdkEvent.MPID).to.equal('98765');
            done();
        });

        it('convertEventToDTO should contain launch referral', function(done) {
            // TODO: Verify if this should be an SDKEvent or UploadObject
            var event = {
                EventName: 10,
                EventAttributes: null,
                SourceMessageId: '7efa0811-c716-4a1d-b8bf-dae90242849c',
                EventDataType: 10,
                CustomFlags: {},
                IsFirstRun: false,
                LaunchReferral: 'http://foo.bar/this/is/a/test',
                CurrencyCode: null,
                MPID: 'testMPID',
                ConsentState: null,
                UserAttributes: {},
                UserIdentities: [],
                Store: {},
                SDKVersion: '2.14.0',
                SessionId: '43E9CB7B-A533-48A0-9D34-A9D51A4986F1',
                SessionStartDate: 1630528189521,
                Debug: false,
                Location: null,
                OptOut: null,
                ExpandedEventCount: 0,
                ClientGeneratedId: 'abbaac60-6356-4cdb-88ab-ac63ffdc7b11',
                DeviceId: 'f0164e59-ffe2-4c01-bd82-b1267096f8a1',
                IntegrationAttributes: {},
                DataPlan: {},
                Timestamp: 1630528218899,
            };

            var upload = mParticle
                .getInstance()
                ._ServerModel.convertEventToDTO(
                    (event as unknown) as UploadObject
                );

            expect(upload.lr).to.equal('http://foo.bar/this/is/a/test');

            done();
        });
    });
});
