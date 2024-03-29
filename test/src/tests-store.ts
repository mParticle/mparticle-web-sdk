import { expect } from 'chai';
import sinon from 'sinon';
import { SDKInitConfig } from '../../src/sdkRuntimeModels';
import Store, {
    IStore,
    SDKConfig,
    processFlags,
    processBaseUrls,
    IFeatureFlags,
} from '../../src/store';
import { MPConfig, apiKey } from './config/constants';
import Utils from './config/utils';
import { Dictionary } from '../../src/utils';
import Constants from '../../src/constants';
import { IGlobalStoreV2MinifiedKeys } from '../../src/persistence.interfaces';
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
                store.SDKConfig.flags?.eventBatchingIntervalMillis,
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

    describe('#nullifySessionData', () => {
        it('should nullify session data', () => {
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

    describe('#processFlags', () => {
        it('should return an empty object if no featureFlags are passed', () => {
            const flags = processFlags({} as SDKInitConfig, {} as SDKConfig);
            expect(Object.keys(flags).length).to.equal(0);
        });

        it('should return default featureFlags if no featureFlags are passed', () => {
            const flags = processFlags(
                { flags: {} } as SDKInitConfig,
                {} as SDKConfig
            );
            const expectedResult = {
                reportBatching: false,
                eventBatchingIntervalMillis: 0,
                offlineStorage: '0',
                directURLRouting: false,
                cacheIdentity: false,
            };

            expect(flags).to.deep.equal(expectedResult);
        });

        it('should return featureFlags if featureFlags are passed in', () => {
            const cutomizedFlags = {
                reportBatching: true,
                eventBatchingIntervalMillis: 5000,
                offlineStorage: '100',
                directURLRouting: 'True',
                cacheIdentity: 'True',
            };

            const flags = processFlags(
                ({ flags: cutomizedFlags } as unknown) as SDKInitConfig,
                {} as SDKConfig
            );

            const expectedResult = {
                reportBatching: true,
                eventBatchingIntervalMillis: 5000,
                offlineStorage: '100',
                directURLRouting: true,
                cacheIdentity: true,
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
                    aliasUrl: 'foo-alias.customer.mp.com/',
                    v1SecureServiceUrl: 'jssdks.us1.mparticle.com/v1/JS/',
                    v2SecureServiceUrl: 'jssdks.us1.mparticle.com/v2/JS/',
                };

                expect(result).to.deep.equal(expectedResult);
            });
        });
    });
});
