import { expect } from 'chai';
import sinon from 'sinon';
import { SDKInitConfig } from '../../src/sdkRuntimeModels';
import Store, {
    IStore,
    processFlags,
    processBaseUrls,
    IFeatureFlags,
} from '../../src/store';
import {
    MPConfig,
    apiKey,
    testMPID,
    workspaceCookieName,
} from './config/constants';
import Utils from './config/utils';
import { Dictionary } from '../../src/utils';
import Constants from '../../src/constants';
import { IGlobalStoreV2MinifiedKeys } from '../../src/persistence.interfaces';
import { IMinifiedConsentJSONObject } from '../../src/consent';
const MockSideloadedKit = Utils.MockSideloadedKit;

describe('Store', () => {
    const now = new Date();
    let sandbox;
    let clock;

    const sampleConfig = {
        appName: 'Store Test',
        appVersion: '1.x',
        package: 'com.mparticle.test',
        flags: {},
    } as SDKInitConfig;

    type ConsentStateSample = Dictionary<IMinifiedConsentJSONObject>;

    const sampleConsentState: ConsentStateSample = {
        con: {
            gdpr: {
                analytics: {
                    c: true,
                    d: 'foo gdpr document',
                    h: 'foo gdpr hardware id',
                    l: 'foo gdpr location',
                    ts: 10,
                },
            },
            ccpa: {
                data_sale_opt_out: {
                    c: false,
                    d: 'foo ccpa document',
                    h: 'foo ccpa hardware id',
                    l: 'foo ccpa location',
                    ts: 42,
                },
            },
        },
    };

    const sampleConsentStateFromStore: ConsentStateSample = {
        con: {
            gdpr: {
                analytics: {
                    c: false,
                    d: 'foo gdpr document from store',
                    h: 'foo gdpr hardware id from store',
                    l: 'foo gdpr location from store',
                    ts: 101,
                },
            },
            ccpa: {
                data_sale_opt_out: {
                    c: true,
                    d: 'foo ccpa document from store',
                    h: 'foo ccpa hardware id from store',
                    l: 'foo ccpa location from store',
                    ts: 24,
                },
            },
        },
    };

    const sampleConsentStateFromPersistence: ConsentStateSample = {
        con: {
            gdpr: {
                analytics: {
                    c: false,
                    d: 'foo gdpr document from persistence',
                    h: 'foo gdpr hardware id from persistence',
                    l: 'foo gdpr location from persistence',
                    ts: 101,
                },
            },
            ccpa: {
                data_sale_opt_out: {
                    c: true,
                    d: 'foo ccpa document from persistence',
                    h: 'foo ccpa hardware id from persistence',
                    l: 'foo ccpa location from persistence',
                    ts: 24,
                },
            },
        },
    };

    beforeEach(function() {
        sandbox = sinon.createSandbox();
        clock = sinon.useFakeTimers(now.getTime());
        // MP Instance is just used because Store requires an mParticle instance
        window.mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        window.mParticle._resetForTests(MPConfig);
        sandbox.restore();
        clock.restore();
    });

    describe('initialization', () => {
        it('should initialize Store with defaults', () => {
            // Use sample config to make sure our types are safe
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );
            expect(store).to.be.ok;
            expect(store.isEnabled, 'isEnabled').to.eq(true);
            expect(store.sessionAttributes, 'sessionAttributes').to.be.ok;
            expect(store.currentSessionMPIDs, 'currentSessionMPIDs').to.be.ok;
            expect(store.consentState, 'consentState').to.eq(null);
            expect(store.sessionId, 'sessionId').to.eq(null);
            expect(store.isFirstRun, 'isFirstRun').to.eq(null);
            expect(store.clientId, 'clientId').to.eq(null);
            expect(store.deviceId, 'deviceId').to.eq(null);
            expect(store.devToken, 'devToken').to.eq(null);
            expect(store.serverSettings, 'serverSettings').to.be.ok;
            expect(store.dateLastEventSent, 'dateLastEventSent').to.eq(null);
            expect(store.sessionStartDate, 'sessionStartDate').to.eq(null);
            expect(store.currentPosition, 'currentPosition').to.eq(null);
            expect(store.isTracking, 'isTracking').to.eq(false);
            expect(store.watchPositionId, 'watchPositionId').to.eq(null);
            expect(store.cartProducts.length, 'cartProducts').to.eq(0);
            expect(store.eventQueue.length, 'eventQueue').to.eq(0);
            expect(store.currencyCode, 'currencyCode').to.eq(null);
            expect(store.globalTimer, 'globalTimer').to.eq(null);
            expect(store.context, 'context').to.eq(null);
            expect(store.configurationLoaded, 'configurationLoaded').to.eq(
                false
            );
            expect(store.identityCallInFlight, 'identityCallInFlight').to.eq(
                false
            );
            expect(store.nonCurrentUserMPIDs, 'nonCurrentUserMPIDs').to.be.ok;
            expect(store.identifyCalled, 'identifyCalled').to.eq(false);
            expect(store.isLoggedIn, 'isLoggedIn').to.eq(false);
            expect(store.cookieSyncDates, 'cookieSyncDates').to.be.ok;
            expect(store.integrationAttributes, 'integrationAttributes').to.be
                .ok;
            expect(store.requireDelay, 'requireDelay').to.eq(true);
            expect(
                store.isLocalStorageAvailable,
                'isLocalStorageAvailable'
            ).to.eq(null);
            expect(store.storageName, 'storageName').to.eq(null);
            expect(store.prodStorageName, 'prodStorageName').to.eq(null);
            expect(store.activeForwarders.length, 'activeForwarders').to.eq(0);
            expect(store.kits, 'kits').to.be.ok;
            expect(store.sideloadedKits, 'sideloaded kits').to.be.ok;
            expect(store.configuredForwarders, 'configuredForwarders').to.be.ok;
            expect(
                store.pixelConfigurations.length,
                'pixelConfigurations'
            ).to.eq(0);
            expect(
                store.integrationDelayTimeoutStart,
                'integrationDelayTimeoutStart'
            ).to.eq(clock.now);
        });

        it('should initialize store.SDKConfig with valid defaults', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            expect(store.SDKConfig.aliasMaxWindow, 'aliasMaxWindow').to.eq(90);
            expect(store.SDKConfig.aliasUrl, 'aliasUrl').to.eq(
                'jssdks.mparticle.com/v1/identity/'
            );
            expect(store.SDKConfig.appName).to.eq('Store Test');
            expect(store.SDKConfig.appVersion, 'appVersion').to.eq('1.x');

            expect(store.SDKConfig.cookieDomain, 'cookieDomain').to.eq(null);
            expect(store.SDKConfig.configUrl, 'configUrl').to.eq(
                'jssdkcdns.mparticle.com/JS/v2/'
            );
            expect(store.SDKConfig.customFlags, 'customFlags').to.deep.equal(
                {}
            );

            expect(store.SDKConfig.dataPlan, 'dataPlan').to.deep.equal({});
            expect(store.SDKConfig.dataPlanOptions, 'dataPlanOptions').to.be
                .undefined;
            expect(store.SDKConfig.dataPlanResult, 'dataPlanResult').to.be
                .undefined;

            expect(
                store.SDKConfig.flags.eventBatchingIntervalMillis,
                'flags.eventBatchingIntervalMillis'
            ).to.eq(0);
            expect(store.SDKConfig.forceHttps, 'forceHttps').to.eq(true);

            expect(store.SDKConfig.identityCallback, 'identityCallback').to.be
                .undefined;
            expect(store.SDKConfig.identityUrl, 'identityUrl').to.eq(
                'identity.mparticle.com/v1/'
            );
            expect(store.SDKConfig.identifyRequest, 'identifyRequest').to.be
                .undefined;
            expect(
                store.SDKConfig.integrationDelayTimeout,
                'integrationDelayTimeout'
            ).to.eq(5000);
            expect(
                store.SDKConfig.isDevelopmentMode,
                'isDevelopmentMode'
            ).to.eq(false);
            expect(store.SDKConfig.isIOS, 'isIOS').to.eq(false);

            expect(store.SDKConfig.kits, 'kits').to.deep.equal({});
            expect(store.SDKConfig.sideloadedKits, 'kits').to.deep.equal([]);
            expect(store.SDKConfig.logLevel, 'logLevel').to.eq(null);

            expect(store.SDKConfig.maxCookieSize, 'maxCookieSize').to.eq(3000);
            expect(store.SDKConfig.maxProducts, 'maxProducts').to.eq(20);
            expect(
                store.SDKConfig.minWebviewBridgeVersion,
                'minWebviewBridgeVersion'
            ).to.eq(1);

            expect(store.SDKConfig.package, 'package').to.eq(
                'com.mparticle.test'
            );

            expect(store.SDKConfig.sessionTimeout, 'sessionTimeout').to.eq(30);

            expect(store.SDKConfig.useCookieStorage, 'useCookieStorage').to.eq(
                false
            );
            expect(store.SDKConfig.useNativeSdk, 'useNativeSdk').to.eq(false);

            expect(
                store.SDKConfig.v1SecureServiceUrl,
                'v1SecureServiceUrl'
            ).to.eq('jssdks.mparticle.com/v1/JS/');
            expect(
                store.SDKConfig.v2SecureServiceUrl,
                'v2SecureServiceUrl'
            ).to.eq('jssdks.mparticle.com/v2/JS/');
            expect(
                store.SDKConfig.v3SecureServiceUrl,
                'v3SecureServiceUrl'
            ).to.eq('jssdks.mparticle.com/v3/JS/');
        });

        it('should assign expected values to dataPlan', () => {
            const dataPlanConfig = {
                ...sampleConfig,
                dataPlan: {
                    planId: 'test_data_plan',
                    planVersion: 3,
                },
            };
            const store: IStore = new Store(
                dataPlanConfig,
                window.mParticle.getInstance()
            );

            expect(store.SDKConfig.dataPlan, 'dataPlan').to.deep.equal({
                PlanId: 'test_data_plan',
                PlanVersion: 3,
            });
        });

        it('should assign expected values to side loaded kits', () => {
            const sideloadedKit1 = new MockSideloadedKit();
            const sideloadedKit2 = new MockSideloadedKit();
            const sideloadedKits = [sideloadedKit1, sideloadedKit2];

            const config = {
                ...sampleConfig,
                sideloadedKits,
            };
            const store: IStore = new Store(
                config,
                window.mParticle.getInstance()
            );

            expect(
                store.SDKConfig.sideloadedKits.length,
                'side loaded kits'
            ).to.equal(sideloadedKits.length);
            expect(
                store.SDKConfig.sideloadedKits[0],
                'side loaded kits'
            ).to.deep.equal(sideloadedKit1);
            expect(
                store.SDKConfig.sideloadedKits[1],
                'side loaded kits'
            ).to.deep.equal(sideloadedKit2);
        });

        it('should assign apiKey to devToken property', () => {
            const config = {
                ...sampleConfig,
            };

            const store: IStore = new Store(
                config,
                window.mParticle.getInstance(),
                apiKey
            );

            expect(store.devToken, 'devToken').to.equal(apiKey);
        });
    });

    describe('#getConsentState', () => {
        it('should return a consent state object from the store', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.persistenceData[testMPID] = sampleConsentState;

            expect(store.getConsentState(testMPID)).to.be.ok;
            expect(store.getConsentState(testMPID)).to.haveOwnProperty(
                'getGDPRConsentState'
            );
            expect(store.getConsentState(testMPID)).to.haveOwnProperty(
                'getCCPAConsentState'
            );

            expect(
                store.getConsentState(testMPID).getGDPRConsentState()
            ).to.deep.equal({
                analytics: {
                    Consented: true,
                    ConsentDocument: 'foo gdpr document',
                    HardwareId: 'foo gdpr hardware id',
                    Location: 'foo gdpr location',
                    Timestamp: 10,
                },
            });

            expect(
                store.getConsentState(testMPID).getCCPAConsentState()
            ).to.deep.equal({
                Consented: false,
                ConsentDocument: 'foo ccpa document',
                HardwareId: 'foo ccpa hardware id',
                Location: 'foo ccpa location',
                Timestamp: 42,
            });
        });

        it('should return null if no consent state is found', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            expect(store.getConsentState(testMPID)).to.deep.equal(null);
        });

        it('should return in-memory consent state if persistence is empty', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.persistenceData[testMPID] = sampleConsentStateFromStore;

            localStorage.setItem(workspaceCookieName, '');

            expect(store.getConsentState(testMPID)).to.be.ok;

            expect(store.getConsentState(testMPID)).to.haveOwnProperty(
                'getGDPRConsentState'
            );
            expect(
                store.getConsentState(testMPID).getGDPRConsentState()
            ).to.deep.equal({
                analytics: {
                    Consented: false,
                    ConsentDocument: 'foo gdpr document from store',
                    HardwareId: 'foo gdpr hardware id from store',
                    Location: 'foo gdpr location from store',
                    Timestamp: 101,
                },
            });

            expect(store.getConsentState(testMPID)).to.haveOwnProperty(
                'getCCPAConsentState'
            );

            expect(
                store.getConsentState(testMPID).getCCPAConsentState()
            ).to.deep.equal({
                Consented: true,
                ConsentDocument: 'foo ccpa document from store',
                HardwareId: 'foo ccpa hardware id from store',
                Location: 'foo ccpa location from store',
                Timestamp: 24,
            });
        });
    });

    describe('#setConsentState', () => {
        it('should set consent state as a minified object in the store', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            const consentState = window.mParticle.Consent.createConsentState();

            const gdprConsent = window.mParticle
                .getInstance()
                .Consent.createGDPRConsent(
                    true,
                    10,
                    'foo gdpr document',
                    'foo gdpr location',
                    'foo gdpr hardware id'
                );

            const ccpaConsent = window.mParticle
                .getInstance()
                .Consent.createCCPAConsent(
                    false,
                    42,
                    'foo ccpa document',
                    'foo ccpa location',
                    'foo ccpa hardware id'
                );

            const expectedConsentState = sampleConsentState.con;

            consentState.addGDPRConsentState('analytics', gdprConsent);
            consentState.setCCPAConsentState(ccpaConsent);

            store.setConsentState(testMPID, consentState);

            expect(store.persistenceData[testMPID].con).to.be.ok;

            expect(store.persistenceData[testMPID].con.gdpr).to.be.ok;
            expect(store.persistenceData[testMPID].con.gdpr).to.deep.equal(
                expectedConsentState.gdpr
            );

            expect(store.persistenceData[testMPID].con.ccpa).to.be.ok;
            expect(store.persistenceData[testMPID].con.ccpa).to.deep.equal(
                expectedConsentState.ccpa
            );
        });

        it('should set consent state as a minified object in persistence', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            const consentState = window.mParticle.Consent.createConsentState();

            const gdprConsent = window.mParticle
                .getInstance()
                .Consent.createGDPRConsent(
                    true,
                    10,
                    'foo gdpr document',
                    'foo gdpr location',
                    'foo gdpr hardware id'
                );

            const ccpaConsent = window.mParticle
                .getInstance()
                .Consent.createCCPAConsent(
                    false,
                    42,
                    'foo ccpa document',
                    'foo ccpa location',
                    'foo ccpa hardware id'
                );

            const expectedConsentState = sampleConsentState.con;

            consentState.addGDPRConsentState('analytics', gdprConsent);
            consentState.setCCPAConsentState(ccpaConsent);

            store.setConsentState(testMPID, consentState);

            const fromPersistence = window.mParticle
                .getInstance()
                ._Persistence.getPersistence();

            expect(fromPersistence[testMPID]).to.be.ok;
            expect(fromPersistence[testMPID].con).to.be.ok;

            expect(fromPersistence[testMPID].con.gdpr).to.be.ok;
            expect(fromPersistence[testMPID].con.gdpr).to.deep.equal(
                expectedConsentState.gdpr
            );

            expect(fromPersistence[testMPID].con.ccpa).to.be.ok;
            expect(fromPersistence[testMPID].con.ccpa).to.deep.equal(
                expectedConsentState.ccpa
            );
        });

        it('should override persistence with store values', () => {
            const consentState = window.mParticle.Consent.createConsentState();

            const analyticsGdprConsent = window.mParticle
                .getInstance()
                .Consent.createGDPRConsent(
                    false,
                    101,
                    'analytics gdpr document from store',
                    'analytics gdpr location from store',
                    'analytics gdpr hardware id from store'
                );

            const marketingGdprConsent = window.mParticle
                .getInstance()
                .Consent.createGDPRConsent(
                    true,
                    202,
                    'marketing gdpr document from store',
                    'marketing gdpr location from store',
                    'marketing gdpr hardware id from store'
                );

            const ccpaConsent = window.mParticle
                .getInstance()
                .Consent.createCCPAConsent(
                    true,
                    24,
                    'foo ccpa document from store',
                    'foo ccpa location from store',
                    'foo ccpa hardware id from store'
                );

            const expectedConsentState = sampleConsentStateFromStore.con;

            consentState.addGDPRConsentState('analytics', analyticsGdprConsent);
            consentState.setCCPAConsentState(ccpaConsent);

            const persistenceValue = JSON.stringify({
                testMPID: {
                    con: sampleConsentStateFromPersistence.con,
                },
            });

            localStorage.setItem(workspaceCookieName, persistenceValue);

            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.setConsentState(testMPID, consentState);

            const fromPersistence = window.mParticle
                .getInstance()
                ._Persistence.getPersistence();

            expect(fromPersistence[testMPID]).to.be.ok;
            expect(fromPersistence[testMPID].con).to.be.ok;
            expect(fromPersistence[testMPID].con.gdpr).to.be.ok;
            expect(fromPersistence[testMPID].con.ccpa).to.be.ok;

            expect(fromPersistence[testMPID].con.gdpr).to.deep.equal({
                analytics: {
                    c: false,
                    ts: 101,
                    d: 'analytics gdpr document from store',
                    h: 'analytics gdpr hardware id from store',
                    l: 'analytics gdpr location from store',
                },
            });

            expect(fromPersistence[testMPID].con.ccpa).to.deep.equal(
                expectedConsentState.ccpa
            );

            consentState.addGDPRConsentState('marketing', marketingGdprConsent);
            store.setConsentState(testMPID, consentState);

            const retrieveFromPersistence = window.mParticle
                .getInstance()
                ._Persistence.getPersistence();

            expect(retrieveFromPersistence[testMPID].con.gdpr).to.deep.equal({
                analytics: {
                    c: false,
                    ts: 101,
                    d: 'analytics gdpr document from store',
                    h: 'analytics gdpr hardware id from store',
                    l: 'analytics gdpr location from store',
                },
                marketing: {
                    c: true,
                    ts: 202,
                    d: 'marketing gdpr document from store',
                    h: 'marketing gdpr hardware id from store',
                    l: 'marketing gdpr location from store',
                },
            });
        });

        it('should not set consent state if consent state is null', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            const expectedConsentState = sampleConsentState;

            store.persistenceData[testMPID] = expectedConsentState;

            store.setConsentState(testMPID, null);

            expect(store.persistenceData[testMPID]).to.deep.equal(
                expectedConsentState
            );
        });
    });

    describe('#getDeviceId', () => {
        it('should return the deviceId from the store', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.deviceId = 'foo';

            expect(store.getDeviceId()).to.equal('foo');
        });
    });

    describe('#getUserAttributes', () => {
        it('should return user attributes from the store', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.persistenceData[testMPID] = {
                ua: { foo: 'bar' },
            };

            expect(store.getUserAttributes(testMPID)).to.deep.equal({
                foo: 'bar',
            });
        });

        it('should return an empty object if mpid is null', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            expect(store.getUserAttributes(null)).to.deep.equal({});
        });

        it('should return an empty object if no user attributes are found', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            expect(store.getUserAttributes(testMPID)).to.deep.equal({});
        });
    });

    describe('#setUserAttributes', () => {
        it('should set user attributes in the store', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.setUserAttributes(testMPID, { foo: 'bar' });
            expect(store.persistenceData[testMPID].ua).to.deep.equal({
                foo: 'bar',
            });

            store.setUserAttributes(testMPID, { fiz: 'buzz' });
            expect(store.persistenceData[testMPID].ua).to.deep.equal({
                fiz: 'buzz',
            });
        });

        it('should set user attributes in persistence', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.setUserAttributes(testMPID, { foo: 'bar' });
            const fromPersistence = window.mParticle
                .getInstance()
                ._Persistence.getPersistence();

            expect(fromPersistence[testMPID]).to.be.ok;
            expect(fromPersistence[testMPID].ua).to.be.ok;
            expect(fromPersistence[testMPID].ua).to.deep.equal({
                foo: 'bar',
            });
        });

        it('should override persistence with store values', () => {
            const persistenceValue = JSON.stringify({
                gs: {
                    sid: 'sid',
                    les: new Date().getTime(),
                },
                testMPID: {
                    ua: { foo: 'bar' },
                },
                cu: testMPID,
            });

            localStorage.setItem(workspaceCookieName, persistenceValue);

            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.setUserAttributes(testMPID, { fizz: 'buzz' });
            const fromPersistence = window.mParticle
                .getInstance()
                ._Persistence.getPersistence();

            expect(fromPersistence[testMPID]).to.be.ok;
            expect(fromPersistence[testMPID].ua).to.be.ok;
            expect(fromPersistence[testMPID].ua).to.deep.equal({
                fizz: 'buzz',
            });
        });
    });

    describe('#setDeviceId', () => {
        it('should set the deviceId in the store', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.setDeviceId('foo');
            expect(store.deviceId).to.equal('foo');
        });

        it('should set the deviceId in persistence', () => {
            const store = window.mParticle.getInstance()._Store;

            store.setDeviceId('foo');
            const fromPersistence = window.mParticle
                .getInstance()
                ._Persistence.getPersistence();

            expect(fromPersistence.gs.das).to.equal('foo');
            expect(store.persistenceData.gs.das).to.equal('foo');
        });
    });

    describe('#getFirstSeenTime', () => {
        it('should return the firstSeenTime from the store', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );
            store.persistenceData[testMPID] = {
                fst: 12345,
            };
            expect(store.getFirstSeenTime(testMPID)).to.equal(12345);
        });

        it('should return null if mpid is null', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            expect(store.getFirstSeenTime(null)).to.equal(null);
        });

        it('should return null if no firstSeenTime is found', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );
            expect(store.getFirstSeenTime(testMPID)).to.equal(null);
        });
    });

    describe('#setFirstSeenTime', () => {
        it('should set the firstSeenTime in the store', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.setFirstSeenTime(testMPID, 12345);
            expect(store.persistenceData[testMPID].fst).to.equal(12345);
        });

        it('should return undefined if mpid is null', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            expect(store.setFirstSeenTime(null, 12345)).to.equal(undefined);
        });

        it('should set the firstSeenTime in persistence', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.setFirstSeenTime(testMPID, 12345);
            const fromPersistence = window.mParticle
                .getInstance()
                ._Persistence.getPersistence();

            expect(fromPersistence[testMPID]).to.be.ok;
            expect(fromPersistence[testMPID].fst).to.be.ok;
            expect(fromPersistence[testMPID].fst).to.equal(12345);
        });

        it('should override persistence with store values', () => {
            const persistenceValue = JSON.stringify({
                testMPID: {
                    fst: 12345,
                },
            });

            localStorage.setItem(workspaceCookieName, persistenceValue);

            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.setFirstSeenTime(testMPID, 54321);
            const fromPersistence = window.mParticle
                .getInstance()
                ._Persistence.getPersistence();

            expect(fromPersistence[testMPID]).to.be.ok;
            expect(fromPersistence[testMPID].fst).to.be.ok;
            expect(fromPersistence[testMPID].fst).to.equal(54321);
        });
    });

    describe('#getLastSeenTime', () => {
        it('should return the lastSeenTime from the store', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.persistenceData[testMPID] = {
                lst: 12345,
            };

            expect(store.getLastSeenTime(testMPID)).to.equal(12345);
        });

        it('should return null if no lastSeenTime is found', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            expect(store.getLastSeenTime(testMPID)).to.equal(null);
        });

        it('should return null if mpid is null', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            expect(store.getLastSeenTime(null)).to.equal(null);
        });

        it('should return the current time if mpid matches current user', () => {
            const userSpy = sinon.stub(
                window.mParticle.getInstance().Identity,
                'getCurrentUser'
            );
            userSpy.returns({
                getMPID: () => 'testMPID',
            });

            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            expect(store.getLastSeenTime(testMPID)).to.equal(now.getTime());
        });
    });

    describe('#setLastSeenTime', () => {
        it('should set the lastSeenTime in the store', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.setLastSeenTime(testMPID, 12345);
            expect(store.persistenceData[testMPID].lst).to.equal(12345);
        });

        it('should set the lastSeenTime in persistence', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.setLastSeenTime(testMPID, 12345);
            const fromPersistence = window.mParticle
                .getInstance()
                ._Persistence.getPersistence();

            expect(fromPersistence[testMPID]).to.be.ok;
            expect(fromPersistence[testMPID].lst).to.be.ok;
            expect(fromPersistence[testMPID].lst).to.equal(12345);
        });

        it('should override persistence with store values', () => {
            const persistenceValue = JSON.stringify({
                testMPID: {
                    lst: 12345,
                },
            });

            localStorage.setItem(workspaceCookieName, persistenceValue);

            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.setLastSeenTime(testMPID, 54321);
            const fromPersistence = window.mParticle
                .getInstance()
                ._Persistence.getPersistence();

            expect(fromPersistence[testMPID]).to.be.ok;
            expect(fromPersistence[testMPID].lst).to.be.ok;
            expect(fromPersistence[testMPID].lst).to.equal(54321);
        });
    });

    describe('#getUserIdentities', () => {
        it('should return the userIdentities from the store', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.persistenceData[testMPID] = {
                ui: { customerid: '12345' },
            };

            expect(store.getUserIdentities(testMPID)).to.deep.equal({
                customerid: '12345',
            });
        });

        it('should return an empty object if mpid is null', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            expect(store.getUserIdentities(null)).to.deep.equal({});
        });

        it('should return an empty object if no userIdentities are found', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            expect(store.getUserIdentities(testMPID)).to.deep.equal({});
        });
    });

    describe('#setUserIdentities', () => {
        it('should set userIdentities in the store', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.setUserIdentities(testMPID, { customerid: '12345' });
            expect(store.persistenceData[testMPID].ui).to.deep.equal({
                customerid: '12345',
            });
        });

        it('should set userIdentities in persistence', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.setUserIdentities(testMPID, { customerid: '12345' });
            const fromPersistence = window.mParticle
                .getInstance()
                ._Persistence.getPersistence();

            expect(fromPersistence[testMPID]).to.be.ok;
            expect(fromPersistence[testMPID].ui).to.be.ok;
            expect(fromPersistence[testMPID].ui).to.deep.equal({
                customerid: '12345',
            });
        });

        it('should override persistence with store values', () => {
            const persistenceValue = JSON.stringify({
                testMPID: {
                    ui: { customerid: '12345' },
                },
            });

            localStorage.setItem(workspaceCookieName, persistenceValue);

            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.setUserIdentities(testMPID, { customerid: '54321' });
            const fromPersistence = window.mParticle
                .getInstance()
                ._Persistence.getPersistence();

            expect(fromPersistence[testMPID]).to.be.ok;
            expect(fromPersistence[testMPID].ui).to.be.ok;
            expect(fromPersistence[testMPID].ui).to.deep.equal({
                customerid: '54321',
            });
        });
    });
   
    describe('#nullifySessionData', () => {
        it('should nullify session data on the store', () => {
            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.sessionId = '123';
            store.dateLastEventSent = new Date();
            store.sessionAttributes = { foo: 'bar' };

            store.nullifySession();

            expect(store.sessionId).to.be.null;
            expect(store.dateLastEventSent).to.be.null;
            expect(store.sessionAttributes).to.deep.equal({});
        });

        it('should nullify session data in persistence', () => {
            const persistenceData = {
                gs: {
                    csm: ['mpid3'],
                    sid: 'abcd',
                    ie: true,
                    dt: apiKey,
                    cgid: 'cgid1',
                    das: 'das1',
                    les: 1234567890,
                    sa: { foo: 'bar' },
                    ss: {},
                    av: '1.0',
                    ia: {},
                    c: null,
                    ssd: 8675309,
                } as IGlobalStoreV2MinifiedKeys,
                cu: 'mpid3',
                l: false,
                mpid1: {
                    ua: {
                        gender: 'female',
                        age: 29,
                        height: '65',
                        color: 'blue',
                        id: 'abcdefghijklmnopqrstuvwxyz',
                    },
                    ui: { 1: 'customerid123', 2: 'facebookid123' },
                },
                mpid2: {
                    ua: { gender: 'male', age: 20, height: '68', color: 'red' },
                    ui: {
                        1: 'customerid234',
                        2: 'facebookid234',
                        id: 'abcdefghijklmnopqrstuvwxyz',
                    },
                },
                mpid3: {
                    ua: { gender: 'male', age: 20, height: '68', color: 'red' },
                    ui: {
                        1: 'customerid234',
                        2: 'facebookid234',
                        id: 'abcdefghijklmnopqrstuvwxyz',
                    },
                },
            };

            window.mParticle
                .getInstance()
                ._Persistence.savePersistence(persistenceData);

            let fromPersistence = window.mParticle
                .getInstance()
                ._Persistence.getPersistence();

            expect(fromPersistence.gs).to.be.ok;
            expect(fromPersistence.gs.sid).to.equal('abcd');
            expect(fromPersistence.gs.les).to.equal(1234567890);
            expect(fromPersistence.gs.sa).to.deep.equal({ foo: 'bar' });

            // Grab the store directly from mPInstance to make sure they share scope
            window.mParticle.getInstance()._Store.nullifySession();

            fromPersistence = window.mParticle
                .getInstance()
                ._Persistence.getPersistence();

            expect(fromPersistence.gs).to.be.ok;
            expect(fromPersistence.gs.sid).to.be.undefined;
            expect(fromPersistence.gs.les).to.be.undefined;
            expect(fromPersistence.gs.sa).to.be.undefined;
        });
    });

    describe('#processConfig', () => {
        it('should process feature flags', () => {
            const config = {
                ...sampleConfig,
                // https://go.mparticle.com/work/SQDSDKS-6317
                flags: {
                    reportBatching: false, // This should be a string
                    eventBatchingIntervalMillis: '42000',
                    offlineStorage: '42',
                    directURLRouting: 'False',
                    cacheIdentity: 'False',
                    audienceAPI: 'False',
                },
            };

            const store: IStore = new Store(
                config,
                window.mParticle.getInstance()
            );

            store.processConfig(config);

            const expectedResult = {
                reportBatching: false,
                eventBatchingIntervalMillis: 42000,
                offlineStorage: '42',
                directURLRouting: false,
                cacheIdentity: false,
                audienceAPI: false,
            };

            expect(store.SDKConfig.flags).to.deep.equal(expectedResult);
        });

        it('should process storage names', () => {
            const config = {
                ...sampleConfig,
                workspaceToken: 'foo',
            };

            const store: IStore = new Store(
                config,
                window.mParticle.getInstance()
            );

            store.processConfig(config);

            expect(store.storageName, 'storageName').to.equal('mprtcl-v4_foo');
            expect(store.prodStorageName, 'prodStorageName').to.equal(
                'mprtcl-prodv4_foo'
            );
            expect(store.SDKConfig.workspaceToken, 'workspace token').to.equal(
                'foo'
            );
        });

        it('should warn if workspace token is missing', () => {
            const config = {
                ...sampleConfig,
            };

            const store: IStore = new Store(
                config,
                window.mParticle.getInstance()
            );

            const warnSpy = sinon.spy(
                window.mParticle.getInstance().Logger,
                'warning'
            );

            store.processConfig(config);

            expect(warnSpy.calledOnce, 'should call Logger.warn').to.be.true;
            expect(warnSpy.getCall(0).firstArg).to.equal(
                'You should have a workspaceToken on your config object for security purposes.'
            );
        });

        it('should use a Web View Bridge Name if requiredWebviewBridgeName is present', () => {
            const config = {
                ...sampleConfig,
                requiredWebviewBridgeName: 'my-webview-bridge-name',
                workspaceToken: 'my-workspace-token',
            };

            const store: IStore = new Store(
                config,
                window.mParticle.getInstance()
            );

            store.processConfig(config);

            expect(
                store.SDKConfig.requiredWebviewBridgeName,
                'webviewBridgeName'
            ).to.equal('my-webview-bridge-name');
        });

        it('should use a workspace token as the Web View Bridge Name if requiredWebviewBridgeName is not present ', () => {
            const config = {
                ...sampleConfig,
                workspaceToken: 'my-workspace-token',
            };

            const store: IStore = new Store(
                config,
                window.mParticle.getInstance()
            );

            store.processConfig(config);

            expect(
                store.SDKConfig.requiredWebviewBridgeName,
                'webviewBridgeName'
            ).to.equal('my-workspace-token');
        });

        it('should enable WebviewBridge if requiredWebviewBridgeName is present', () => {
            const config = {
                ...sampleConfig,
                requiredWebviewBridgeName: 'my-webview-bridge-name',
            };

            const store: IStore = new Store(
                config,
                window.mParticle.getInstance()
            );

            // Webview bridge requires a bridge name set on the global mParticle object
            // @ts-ignore
            window.mParticle.uiwebviewBridgeName =
                'mParticle_my-webview-bridge-name_v2';

            store.processConfig(config);

            expect(store.webviewBridgeEnabled, 'webviewBridgeEnabled').to.be
                .true;
        });

        it('should set configurationLoaded to true if config is successfully processed', () => {
            const config = {
                ...sampleConfig,
            };

            const store: IStore = new Store(
                config,
                window.mParticle.getInstance()
            );

            store.processConfig(config);

            expect(store.configurationLoaded, 'configurationLoaded').to.be.true;
        });
    });

    describe('#syncPersistenceData', () => {
        it('should sync store with persistence values', () => {
            const persistenceValue = JSON.stringify({
                testMPID: {
                    lst: 12345,
                    fst: 54321,
                    con: sampleConsentStateFromPersistence.con,
                },
            });

            localStorage.setItem(workspaceCookieName, persistenceValue);

            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.syncPersistenceData();

            expect(store.persistenceData[testMPID].lst).to.equal(12345);
            expect(store.persistenceData[testMPID].fst).to.equal(54321);
            expect(store.persistenceData[testMPID].con).to.deep.equal(
                sampleConsentStateFromPersistence.con
            );
        });

        it('should override store with persistence data', () => {
            const persistenceValue = JSON.stringify({
                testMPID: {
                    lst: 12345,
                    fst: 54321,
                    con: sampleConsentStateFromPersistence.con,
                },
            });

            localStorage.setItem(workspaceCookieName, persistenceValue);

            const store: IStore = new Store(
                sampleConfig,
                window.mParticle.getInstance()
            );

            store.persistenceData[testMPID] = {
                lst: 99999,
                fst: 88888,
                con: sampleConsentStateFromStore.con,
            };

            store.syncPersistenceData();

            expect(store.persistenceData[testMPID].lst).to.equal(12345);
            expect(store.persistenceData[testMPID].fst).to.equal(54321);
            expect(store.persistenceData[testMPID].con).to.deep.equal(
                sampleConsentStateFromPersistence.con
            );
        });
    });

    describe('#processFlags', () => {
        it('should return an empty object if no featureFlags are passed', () => {
            const flags = processFlags({} as SDKInitConfig);
            expect(Object.keys(flags).length).to.equal(0);
        });

        it('should return default featureFlags if no featureFlags are passed', () => {
            const flags = processFlags({ flags: {} } as SDKInitConfig);
            const expectedResult = {
                reportBatching: false, // This should be a string
                eventBatchingIntervalMillis: 0,
                offlineStorage: '0',
                directURLRouting: false,
                cacheIdentity: false,
                audienceAPI: false,
            };

            expect(flags).to.deep.equal(expectedResult);
        });

        it('should return featureFlags if featureFlags are passed in', () => {
            const cutomizedFlags = {
                reportBatching: true, // This should be a string
                eventBatchingIntervalMillis: '5000',
                offlineStorage: '100',
                directURLRouting: 'True',
                cacheIdentity: 'True',
                audienceAPI: 'True',
            };

            const flags = processFlags(
                ({ flags: cutomizedFlags } as unknown) as SDKInitConfig
            );

            const expectedResult = {
                reportBatching: true,
                eventBatchingIntervalMillis: 5000,
                offlineStorage: '100',
                directURLRouting: true,
                cacheIdentity: true,
                audienceAPI: true,
            };

            expect(flags).to.deep.equal(expectedResult);
        });
    });

    describe('#processBaseUrls', () => {
        describe('directURLRouting === false', () => {
            const featureFlags = { directURLRouting: false };

            it('should return default baseUrls if no baseUrls are passed', () => {
                const baseUrls: Dictionary = Constants.DefaultBaseUrls;

                const result = processBaseUrls(
                    ({} as unknown) as SDKInitConfig,
                    (featureFlags as unknown) as IFeatureFlags,
                    'apikey'
                );

                expect(result).to.deep.equal(baseUrls);
            });

            it('should return non-default baseUrls for custom baseUrls that are passed', () => {
                const config = {
                    v3SecureServiceUrl: 'foo.customer.mp.com/v3/JS/',
                    configUrl: 'foo-configUrl.customer.mp.com/v2/JS/',
                    identityUrl: 'foo-identity.customer.mp.com/',
                    aliasUrl: 'foo-alias.customer.mp.com/',
                    userAudienceUrl: 'foo-user-segment.customer.mp.com/',
                };

                const result = processBaseUrls(
                    (config as unknown) as SDKInitConfig,
                    (featureFlags as unknown) as IFeatureFlags,
                    'apikey'
                );

                const expectedResult = {
                    v3SecureServiceUrl: 'foo.customer.mp.com/v3/JS/',
                    configUrl: 'foo-configUrl.customer.mp.com/v2/JS/',
                    identityUrl: 'foo-identity.customer.mp.com/',
                    userAudienceUrl: 'foo-user-segment.customer.mp.com/',
                    aliasUrl: 'foo-alias.customer.mp.com/',
                    v1SecureServiceUrl: 'jssdks.mparticle.com/v1/JS/',
                    v2SecureServiceUrl: 'jssdks.mparticle.com/v2/JS/',
                };

                expect(result).to.deep.equal(expectedResult);
            });
        });

        describe('directURLRouting === true', () => {
            it('should return direct urls when no baseUrls are passed ', () => {
                const featureFlags = { directURLRouting: true };

                const result = processBaseUrls(
                    ({} as unknown) as SDKInitConfig,
                    (featureFlags as unknown) as IFeatureFlags,
                    'apikey'
                );

                const expectedResult = {
                    configUrl: Constants.DefaultBaseUrls.configUrl,
                    aliasUrl: 'jssdks.us1.mparticle.com/v1/identity/',
                    identityUrl: 'identity.us1.mparticle.com/v1/',
                    v1SecureServiceUrl: 'jssdks.us1.mparticle.com/v1/JS/',
                    v2SecureServiceUrl: 'jssdks.us1.mparticle.com/v2/JS/',
                    v3SecureServiceUrl: 'jssdks.us1.mparticle.com/v3/JS/',
                };

                expect(result.aliasUrl).to.equal(expectedResult.aliasUrl);
                expect(result.configUrl).to.equal(expectedResult.configUrl);
                expect(result.identityUrl).to.equal(expectedResult.identityUrl);
                expect(result.v1SecureServiceUrl).to.equal(
                    expectedResult.v1SecureServiceUrl
                );
                expect(result.v2SecureServiceUrl).to.equal(
                    expectedResult.v2SecureServiceUrl
                );
                expect(result.v3SecureServiceUrl).to.equal(
                    expectedResult.v3SecureServiceUrl
                );
            });

            it('should prioritize passed in baseUrls over direct urls', () => {
                const featureFlags = { directURLRouting: true };

                const config = {
                    v3SecureServiceUrl: 'foo.customer.mp.com/v3/JS/',
                    configUrl: 'foo-configUrl.customer.mp.com/v2/JS/',
                    identityUrl: 'foo-identity.customer.mp.com/',
                    userAudienceUrl: 'foo-user-segment.customer.mp.com/',
                    aliasUrl: 'foo-alias.customer.mp.com/',
                };

                const result = processBaseUrls(
                    (config as unknown) as SDKInitConfig,
                    (featureFlags as unknown) as IFeatureFlags,
                    'apikey'
                );

                const expectedResult = {
                    v3SecureServiceUrl: 'foo.customer.mp.com/v3/JS/',
                    configUrl: 'foo-configUrl.customer.mp.com/v2/JS/',
                    identityUrl: 'foo-identity.customer.mp.com/',
                    userAudienceUrl: 'foo-user-segment.customer.mp.com/',
                    aliasUrl: 'foo-alias.customer.mp.com/',
                    v1SecureServiceUrl: 'jssdks.us1.mparticle.com/v1/JS/',
                    v2SecureServiceUrl: 'jssdks.us1.mparticle.com/v2/JS/',
                };

                expect(result).to.deep.equal(expectedResult);
            });
        });
    });
});