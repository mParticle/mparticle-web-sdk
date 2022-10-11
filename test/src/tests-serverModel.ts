import Types from '../../src/types';
import sinon from 'sinon';
import { urls, testMPID, apiKey } from './config';
import { expect } from 'chai';
import { UploadObject } from '../../src/serverModel';
import { AllUserAttributes, IdentityApiData } from '@mparticle/web-sdk';
import { MParticleUser } from '../../src/sdkRuntimeModels';

let mockServer;
const mParticle = window.mParticle;

describe.only('Server Model', function() {
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
        debugger;
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
                return ({ userIdentites: {} } as unknown) as IdentityApiData;
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
                return ({ userIdentites: {} } as unknown) as IdentityApiData;
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
            ._ServerModel.convertEventToDTO((event as unknown) as UploadObject);

        expect(upload.lr).to.equal('http://foo.bar/this/is/a/test');

        done();
    });
});
