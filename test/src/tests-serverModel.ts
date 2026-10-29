import fetchMock from 'fetch-mock/esm/client';
import Types from '../../src/types';
import { urls, testMPID, apiKey, MPConfig } from './config/constants';
import { expect } from 'chai';
import { IUploadObject } from '../../src/serverModel';
import { IdentityApiData } from '@mparticle/web-sdk';
import { BaseEvent, SDKEvent } from '../../src/sdkRuntimeModels';
import Constants from '../../src/constants';
import { IMParticleUser, ISDKUserAttributes } from '../../src/identity-user-interfaces';
import Utils from './config/utils';
import { appendUserInfo } from '../../src/user-utils';
const { hasIdentifyReturned, waitForCondition, fetchMockSuccess } = Utils;

let initialEvent = {};

const mParticle = window.mParticle;
const ServerModel = mParticle.getInstance()._ServerModel;

describe('ServerModel', () => {
    beforeEach(() => {
        mParticle._resetForTests(MPConfig);
        fetchMock.config.overwriteRoutes = true;
        initialEvent = {
            messageType: Types.MessageType.PageEvent,
            name: 'foo page',
            data: { 'foo-attr': 'foo-val' },
            eventType: Types.EventType.Navigation,
            customFlags: { 'foo-flag': 'foo-flag-val' },
        };
    });

    afterEach(() => {
        fetchMock.restore();
    });

    describe('#createEventObject', () => {
        beforeEach(() => {
            // TODO: Create Event Object is tightly coupled with mp Init and Store
            // This should be refactored to make the function more pure
            fetchMockSuccess(urls.identify, {
                mpid: testMPID, is_logged_in: false
            });

            mParticle.init(apiKey, mParticle.config);
        });

        it('should create an event object without a user', () => {
            const mPStore = mParticle.getInstance()._Store;

            const event: BaseEvent = {
                name: 'Test Event',
                messageType: Types.MessageType.PageEvent,
                eventType: Types.EventType.Navigation,
                data: {
                    foo: 'bar',
                    bizz: 'bazz',
                },
                sourceMessageId: 'test-source-message-id',
                customFlags: {
                    custom: 'flag',
                },
                userAttributeChanges: {
                    UserAttributeName: '$Age',
                    New: '42',
                    Old: '37',
                    Deleted: false,
                    IsNewAttribute: false,
                },
                userIdentityChanges: {
                    New: {
                        IdentityType: Types.IdentityType.Other2,
                        Identity: 'new_identity',
                        Timestamp: 1668194307,
                        CreatedThisBatch: false,
                    },
                    Old: {
                        IdentityType: Types.IdentityType.Other,
                        Identity: 'old_identity',
                        Timestamp: 1668193307,
                        CreatedThisBatch: false,
                    },
                },
            };

            const actualEventObject = mParticle
                .getInstance()
                ._ServerModel.createEventObject(event) as IUploadObject;

            expect(actualEventObject.EventName, 'EventName').to.equal(
                'Test Event'
            );
            expect(actualEventObject.EventCategory, 'EventCategory').to.equal(
                Types.EventType.Navigation
            );
            expect(actualEventObject.EventAttributes, 'EventCategory').to.eql({
                foo: 'bar',
                bizz: 'bazz',
            });
            expect(actualEventObject.EventDataType, 'EventDataType').to.equal(
                Types.MessageType.PageEvent
            );
            expect(actualEventObject.CustomFlags, 'CustomFlags').to.eql({
                custom: 'flag',
            });
            expect(
                actualEventObject.UserAttributeChanges,
                'UserAttributeChanges'
            ).to.eql({
                UserAttributeName: '$Age',
                New: '42',
                Old: '37',
                Deleted: false,
                IsNewAttribute: false,
            });

            expect(
                actualEventObject.UserIdentityChanges,
                'UserrIdentityChanges'
            ).to.eql({
                New: {
                    IdentityType: Types.IdentityType.Other2,
                    Identity: 'new_identity',
                    Timestamp: 1668194307,
                    CreatedThisBatch: false,
                },
                Old: {
                    IdentityType: Types.IdentityType.Other,
                    Identity: 'old_identity',
                    Timestamp: 1668193307,
                    CreatedThisBatch: false,
                },
            });
            expect(actualEventObject.Store, 'Store').to.eql({});
            expect(actualEventObject.SDKVersion, 'SDKVersion').to.equal(
                Constants.sdkVersion
            );
            expect(actualEventObject.SessionId, 'SessionId').to.equal(
                mPStore.sessionId
            );
            expect(
                actualEventObject.SessionStartDate,
                'SessionStartDate'
            ).to.equal(mPStore.sessionStartDate.getTime());
            expect(actualEventObject.Debug, 'Debug').to.equal(false);
            expect(actualEventObject.Location, 'Location').to.equal(null);
            expect(actualEventObject.OptOut, 'OptOut').to.equal(null);
            expect(
                actualEventObject.ExpandedEventCount,
                'ExpandedEventCount'
            ).to.equal(0);
            expect(actualEventObject.AppVersion, 'AppVersion').to.equal(
                undefined
            );
            expect(actualEventObject.AppName, 'AppName').to.equal(undefined);
            expect(actualEventObject.Package, 'Package').to.equal(undefined);
            expect(
                actualEventObject.ClientGeneratedId,
                'ClientGeneratedId'
            ).to.equal(mPStore.clientId);
            expect(actualEventObject.DeviceId, 'DeviceId').to.equal(
                mPStore.deviceId
            );
            expect(
                actualEventObject.IntegrationAttributes,
                'IntegrationAttributes'
            ).to.eql({});

            // TODO: Should this default to USD?
            expect(actualEventObject.CurrencyCode, 'CurrencyCode').to.equal(
                null
            );
            expect(actualEventObject.DataPlan, 'DataPlan').to.eql({});
            expect(actualEventObject.Timestamp, 'Timestamp').to.equal(
                mPStore.dateLastEventSent.getTime()
            );
        });

        it('should capture window.location.href as PageUrl', () => {
            const event: BaseEvent = {
                name: 'Test Event',
                messageType: Types.MessageType.PageEvent,
                eventType: Types.EventType.Navigation,
                data: { foo: 'bar' },
                sourceMessageId: 'test-source-message-id',
                customFlags: {},
            };

            const actualEventObject = mParticle
                .getInstance()
                ._ServerModel.createEventObject(event) as IUploadObject;

            expect(actualEventObject.PageUrl, 'PageUrl').to.equal(
                window.location.href
            );
        });

        it('should send a cleaned PageUrl', () => {
            const original = window.location.href;
            window.history.replaceState(
                null,
                '',
                '/checkout?email=a%40b.com&utm_source=google&code=abc#/pay'
            );

            try {
                const event: BaseEvent = {
                    name: 'Test Event',
                    messageType: Types.MessageType.PageEvent,
                    eventType: Types.EventType.Navigation,
                    data: { foo: 'bar' },
                };

                const actualEventObject = mParticle
                    .getInstance()
                    ._ServerModel.createEventObject(event) as IUploadObject;

                expect(actualEventObject.PageUrl, 'PageUrl').to.equal(
                    window.location.origin + '/checkout?utm_source=google#/pay'
                );
            } finally {
                window.history.replaceState(null, '', original);
            }
        });

        it('should create an event object with a user', () => {
            const event: BaseEvent = {
                name: 'Test Event',
                messageType: Types.MessageType.PageEvent,
                eventType: Types.EventType.Navigation,
                data: {
                    foo: 'bar',
                    bizz: 'bazz',
                },
                sourceMessageId: 'test-source-message-id',
                customFlags: {
                    custom: 'flag',
                },
                userAttributeChanges: {
                    UserAttributeName: '$Age',
                    New: '42',
                    Old: '37',
                    Deleted: false,
                    IsNewAttribute: false,
                },
                userIdentityChanges: {
                    New: {
                        IdentityType: Types.IdentityType.Other2,
                        Identity: 'new_identity',
                        Timestamp: 1668194307,
                        CreatedThisBatch: false,
                    },
                    Old: {
                        IdentityType: Types.IdentityType.Other,
                        Identity: 'old_identity',
                        Timestamp: 1668193307,
                        CreatedThisBatch: false,
                    },
                },
            };

            const user = ({
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
            } as unknown) as IMParticleUser;

            const actualEventObject = mParticle
                .getInstance()
                ._ServerModel.createEventObject(event, user) as IUploadObject;

            expect(actualEventObject.MPID, 'MPID').to.equal('98765');
            expect(actualEventObject.ConsentState, 'ConsentState').to.eql({
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
            expect(actualEventObject.UserAttributes).to.eql({
                'foo-user-attr': 'foo-attr-value',
                'foo-user-attr-list': ['item1', 'item2'],
            });
            expect(actualEventObject.UserIdentities).to.eql([
                { Identity: 'foo-other', Type: 0 },
                { Identity: '1234567', Type: 1 },
                { Identity: 'foo-email', Type: 7 },
                { Identity: 'foo-other2', Type: 10 },
                { Identity: 'foo-other3', Type: 11 },
                { Identity: 'foo-other4', Type: 12 },
            ]);
        });

        it('should set necessary attributes if MessageType is SessionEnd', async () => {    
            await waitForCondition(hasIdentifyReturned);

            const mPStore = mParticle.getInstance()._Store;
            
            mPStore.sessionAttributes = {
                fooSessionAttr: 'session-foo',
                barSessionAttr: 'session-bar',
            };

            const event: BaseEvent = {
                name: 'Test Event',
                messageType: Types.MessageType.SessionEnd,
                eventType: Types.EventType.Other,
                data: {
                    fooEventAttr: 'bar',
                    barEventAttr: 'bazz',
                },
            };

            const actualEventObject = mParticle
            .getInstance()
            ._ServerModel.createEventObject(event) as IUploadObject;

            expect(
                actualEventObject.currentSessionMPIDs,
                'currentSessionMPIDs'
            ).to.eql(['testMPID']);

            // A SessionEnd event appends SessionLength
            expect(actualEventObject).to.have.property('SessionLength');

            // A SessionEnd event should ignore Event Attributes and use Session Attributes instead
            expect(actualEventObject.EventAttributes, 'EventAttributes').to.eql(
                { fooSessionAttr: 'session-foo', barSessionAttr: 'session-bar' }
            );
            expect(
                actualEventObject.EventAttributes,
                'EventAttributes'
            ).to.not.have.property('fooEventAttr');
            expect(
                actualEventObject.EventAttributes,
                'EventAttributes'
            ).to.not.have.property('barEventAttr');

            // A SessionEnd event resets currentSessionMPIDs and sessionStartDate.  When a new session starts, these are filled again
            expect(mPStore.currentSessionMPIDs).to.eql([]);
            expect(mPStore.sessionStartDate).to.eql(null);
        });

        describe('EventName coercion for lifecycle events with no name', () => {
            beforeEach(async () => {
                await waitForCondition(hasIdentifyReturned);
            });

            it('should produce a string EventName for SessionStart', () => {
                const event: BaseEvent = {
                    messageType: Types.MessageType.SessionStart,
                    eventType: Types.EventType.Other,
                };

                const actualEventObject = mParticle
                    .getInstance()
                    ._ServerModel.createEventObject(event) as IUploadObject;

                expect(typeof actualEventObject.EventName).to.equal('string');
                expect(actualEventObject.EventName).to.equal('1');
            });

            it('should produce a string EventName for SessionEnd', () => {
                const event: BaseEvent = {
                    messageType: Types.MessageType.SessionEnd,
                    eventType: Types.EventType.Other,
                };

                const actualEventObject = mParticle
                    .getInstance()
                    ._ServerModel.createEventObject(event) as IUploadObject;

                expect(typeof actualEventObject.EventName).to.equal('string');
                expect(actualEventObject.EventName).to.equal('2');
            });

            it('should produce a string EventName for AppStateTransition', () => {
                const event: BaseEvent = {
                    messageType: Types.MessageType.AppStateTransition,
                    eventType: Types.EventType.Other,
                };

                const actualEventObject = mParticle
                    .getInstance()
                    ._ServerModel.createEventObject(event) as IUploadObject;

                expect(typeof actualEventObject.EventName).to.equal('string');
                expect(actualEventObject.EventName).to.equal('10');
            });

            it('should use the event name when provided, not the messageType', () => {
                const event: BaseEvent = {
                    name: 'My Custom Event',
                    messageType: Types.MessageType.PageEvent,
                    eventType: Types.EventType.Navigation,
                };

                const actualEventObject = mParticle
                    .getInstance()
                    ._ServerModel.createEventObject(event) as IUploadObject;

                expect(actualEventObject.EventName).to.equal('My Custom Event');
            });
        });

        it('should set necessary attributes if MessageType is AppStateTransition', () => {
            const event: BaseEvent = {
                name: 'Test Event',
                messageType: Types.MessageType.AppStateTransition,
                eventType: Types.EventType.Other,
            };

            const actualEventObject = mParticle
                .getInstance()
                ._ServerModel.createEventObject(event) as IUploadObject;

            expect(actualEventObject.IsFirstRun, 'IsFirstRun').to.eql(false);
            expect(actualEventObject.LaunchReferral, 'LaunchRefferral').to.eql(
                window.location.href
            );
        });

        it('should send a cleaned LaunchReferral', () => {
            const original = window.location.href;
            window.history.replaceState(
                null,
                '',
                '/landing?token=abc&utm_campaign=fall#section'
            );

            try {
                const event: BaseEvent = {
                    name: 'Test Event',
                    messageType: Types.MessageType.AppStateTransition,
                    eventType: Types.EventType.Other,
                };

                const actualEventObject = mParticle
                    .getInstance()
                    ._ServerModel.createEventObject(event) as IUploadObject;

                expect(
                    actualEventObject.LaunchReferral,
                    'LaunchReferral'
                ).to.equal(
                    window.location.origin +
                        '/landing?utm_campaign=fall#section'
                );
            } finally {
                window.history.replaceState(null, '', original);
            }
        });

        it('should generate a sourceMessageId if one is not provided', () => {
            const event: BaseEvent = {
                name: 'Test Event',
                sourceMessageId: null,
                messageType: Types.MessageType.PageEvent,
                eventType: Types.EventType.Other,
            };

            const actualEventObject = mParticle
                .getInstance()
                ._ServerModel.createEventObject(event) as IUploadObject;

            expect(
                actualEventObject.SourceMessageId,
                'SourceMessageId'
            ).to.not.equal(null);
        });

        it('returns null if _Store does not have a sessionId', () => {
            const mPStore = mParticle.getInstance()._Store;
            mPStore.sessionId = null;

            const event: BaseEvent = {
                name: 'Test Opt Out Event',
                messageType: Types.MessageType.PageEvent,
            };

            const actualEventObject = mParticle
                .getInstance()
                ._ServerModel.createEventObject(event) as IUploadObject;

            expect(actualEventObject).to.equal(null);
        });

        it('returns null if _Store has Webview Bridge Disabled', () => {
            const mPStore = mParticle.getInstance()._Store;

            mPStore.sessionId = null;
            mPStore.webviewBridgeEnabled = false;

            const event: BaseEvent = {
                name: 'Test Opt Out Event',
                messageType: Types.MessageType.PageEvent,
            };

            const actualEventObject = mParticle
                .getInstance()
                ._ServerModel.createEventObject(event) as IUploadObject;

            expect(actualEventObject).to.equal(null);
        });

        it('returns null if event is invalid', () => {
            const event: BaseEvent = ({} as unknown) as BaseEvent;

            expect(ServerModel.createEventObject(event)).to.eql(null);
        });

        it('should support toEventAPIObject', () => {
            const eventAPIObject = {
                EventName: 'Test Event Object Override',
                EventCategory: Types.EventType.Media,
                EventDataType: Types.MessageType.Media,
            };

            const event = {
                name: 'Test Event Object',
                messageType: Types.MessageType.PageEvent,
                eventType: Types.EventType.Other,
                toEventAPIObject: () => eventAPIObject,
            } as BaseEvent;

            const actualEventObject = mParticle
                .getInstance()
                ._ServerModel.createEventObject(event);

            expect(actualEventObject.EventName, 'EventName').to.equal(
                'Test Event Object Override'
            );
            expect(actualEventObject.EventCategory, 'EventCategory').to.equal(
                Types.EventType.Media
            );
            expect(actualEventObject.EventDataType, 'EventDataType').to.equal(
                Types.MessageType.Media
            );
        });
    });

    describe('Integration Tests', function() {
        const event = {
            messageType: Types.MessageType.PageEvent,
            name: 'foo page',
            data: { 'foo-attr': 'foo-val' },
            eventType: Types.EventType.Navigation,
            customFlags: { 'foo-flag': 'foo-flag-val' },
        };

        beforeEach(function() {
            fetchMockSuccess(urls.identify, {
                mpid: testMPID, is_logged_in: false
            });

            mParticle.init(apiKey, mParticle.config);
        });

        it('Should not append user info when no user exists', async () => {
            await waitForCondition(hasIdentifyReturned);
            mParticle.getInstance()._Store.should.be.ok;

            let sdkEvent = mParticle
            .getInstance()
            ._ServerModel.createEventObject(event);

            sdkEvent.should.be.ok;
            expect(sdkEvent.UserIdentities).to.eql([]);
            expect(sdkEvent.UserAttributes).to.eql({});
            expect(sdkEvent.ConsentState === null).to.eql(true);
        });

        it('Should append all user info when user is present', () => {
            mParticle.getInstance()._Store.should.be.ok;
            const consentState = mParticle
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
                } as IMParticleUser;
            };
            let sdkEvent = mParticle
                .getInstance()
                ._ServerModel.createEventObject(event);

            expect(sdkEvent).to.be.ok;
            expect(sdkEvent.UserIdentities).to.eql(expectedUserIdentities);
            expect(sdkEvent.MPID).to.equal('98765');
            expect(sdkEvent.UserAttributes).to.eql(expectedUserAttributes);
            expect(sdkEvent.ConsentState).to.be.ok;
        });

        it('Should append identities when user is present', async () => {
            await waitForCondition(hasIdentifyReturned);
            let sdkEvent = mParticle
            .getInstance()
            ._ServerModel.createEventObject(event);

            sdkEvent.should.be.ok;
            expect(sdkEvent.UserIdentities).to.eql([]);

            const user: IMParticleUser = ({
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
            } as unknown) as IMParticleUser;

            const identityMapping = {};
            identityMapping[Types.IdentityType.CustomerId] = '1234567';
            identityMapping[Types.IdentityType.Email] = 'foo-email';
            identityMapping[Types.IdentityType.Other] = 'foo-other';
            identityMapping[Types.IdentityType.Other2] = 'foo-other2';
            identityMapping[Types.IdentityType.Other3] = 'foo-other3';
            identityMapping[Types.IdentityType.Other4] = 'foo-other4';

            appendUserInfo(user, sdkEvent);
            sdkEvent.UserIdentities.should.be.ok;
            sdkEvent.UserIdentities.length.should.equal(6);

            sdkEvent.UserIdentities.forEach(function(id) {
                const type = id.Type;
                const value = id.Identity;
                identityMapping[type].should.equal(value);
            });
        });

        it('Should append user attributes when user present', async () => {
            await waitForCondition(hasIdentifyReturned);
            let sdkEvent = mParticle
            .getInstance()
            ._ServerModel.createEventObject(event);

            sdkEvent.should.be.ok;
            expect(sdkEvent.UserAttributes).to.eql({});
            const attributes = { foo: 'bar', 'foo-arr': ['bar1', 'bar2'] };
            const user: IMParticleUser = {
                getUserIdentities: (): IdentityApiData => ({
                    userIdentities: {},
                }),
                getAllUserAttributes: (): ISDKUserAttributes => {
                    return attributes;
                },
                getMPID: () => {
                    return null;
                },
                getConsentState: () => {
                    return null;
                },
            } as IMParticleUser;

            appendUserInfo(user, sdkEvent);
            expect(sdkEvent.UserAttributes).to.be.ok;
            expect(sdkEvent.UserAttributes).to.eql(attributes);
        });

        it('Should update mpid when user info is appended with a new mpid', async () => {
            await waitForCondition(hasIdentifyReturned);
            let sdkEvent = mParticle
                .getInstance()
                ._ServerModel.createEventObject(event);

            sdkEvent.should.be.ok;

            // By default, all tests instances have 'testMPID'
            expect(sdkEvent.MPID).to.equal('testMPID');

            const user: IMParticleUser = {
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
            } as IMParticleUser;
            appendUserInfo(user, sdkEvent);
            expect(sdkEvent.MPID).to.equal('98765');
        });
    });
});