import { expect } from 'chai';
import sinon from 'sinon';
import { SDKInitConfig } from '../../src/sdkRuntimeModels';
import Store, { IStore } from '../../src/store';
import { MPConfig, apiKey } from './config';

describe('Store', () => {
    const now = new Date();
    let sandbox;
    let clock;

    const sampleConfig = {
        appName: 'Store Test',
        appVersion: '1.x',
        package: 'com.mparticle.test',
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

    it('should initialize Store with defaults', () => {
        // Use sample config to make sure our types are safe
        const store: IStore = new Store(sampleConfig, window.mParticle);

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
        expect(store.migrationData, 'migrationData').to.be.ok;
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
        expect(store.configurationLoaded, 'configurationLoaded').to.eq(false);
        expect(store.identityCallInFlight, 'identityCallInFlight').to.eq(false);
        expect(
            store.migratingToIDSyncCookies,
            'migratingToIDSyncCookies'
        ).to.eq(false);
        expect(store.nonCurrentUserMPIDs, 'nonCurrentUserMPIDs').to.be.ok;
        expect(store.identifyCalled, 'identifyCalled').to.eq(false);
        expect(store.isLoggedIn, 'isLoggedIn').to.eq(false);
        expect(store.cookieSyncDates, 'cookieSyncDates').to.be.ok;
        expect(store.integrationAttributes, 'integrationAttributes').to.be.ok;
        expect(store.requireDelay, 'requireDelay').to.eq(true);
        expect(store.isLocalStorageAvailable, 'isLocalStorageAvailable').to.eq(
            null
        );
        expect(store.storageName, 'storageName').to.eq(null);
        expect(store.prodStorageName, 'prodStorageName').to.eq(null);
        expect(store.activeForwarders.length, 'activeForwarders').to.eq(0);
        expect(store.kits, 'kits').to.be.ok;
        expect(store.configuredForwarders, 'configuredForwarders').to.be.ok;
        expect(store.pixelConfigurations.length, 'pixelConfigurations').to.eq(
            0
        );
        expect(
            store.integrationDelayTimeoutStart,
            'integrationDelayTimeoutStart'
        ).to.eq(clock.now);
    });

    it('should initialize store.SDKConfig with valid defaults', () => {
        const store: IStore = new Store(sampleConfig, window.mParticle);

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
        expect(store.SDKConfig.customFlags, 'customFlags').to.deep.equal({});

        expect(store.SDKConfig.dataPlan, 'dataPlan').to.deep.equal({});
        expect(store.SDKConfig.dataPlanOptions, 'dataPlanOptions').to.be
            .undefined;
        expect(store.SDKConfig.dataPlanResult, 'dataPlanResult').to.be
            .undefined;

        expect(
            store.SDKConfig.flags.eventBatchingIntervalMillis,
            'flags.eventBatchingIntervalMillis'
        ).to.eq(0);
        expect(store.SDKConfig.flags.eventsV3, 'flags.eventsV3').to.eq(0);
        expect(
            store.SDKConfig.flags.reportBatching,
            'flags.reportBatching'
        ).to.eq(false);
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
        expect(store.SDKConfig.isDevelopmentMode, 'isDevelopmentMode').to.eq(
            false
        );
        expect(store.SDKConfig.isIOS, 'isIOS').to.eq(false);

        expect(store.SDKConfig.kits, 'kits').to.deep.equal({});
        expect(store.SDKConfig.logLevel, 'logLevel').to.eq(null);

        expect(store.SDKConfig.maxCookieSize, 'maxCookieSize').to.eq(3000);
        expect(store.SDKConfig.maxProducts, 'maxProducts').to.eq(20);
        expect(
            store.SDKConfig.minWebviewBridgeVersion,
            'minWebviewBridgeVersion'
        ).to.eq(1);

        expect(store.SDKConfig.package, 'package').to.eq('com.mparticle.test');

        expect(store.SDKConfig.sessionTimeout, 'sessionTimeout').to.eq(30);

        expect(store.SDKConfig.useCookieStorage, 'useCookieStorage').to.eq(
            false
        );
        expect(store.SDKConfig.useNativeSdk, 'useNativeSdk').to.eq(false);

        expect(store.SDKConfig.v1SecureServiceUrl, 'v1SecureServiceUrl').to.eq(
            'jssdks.mparticle.com/v1/JS/'
        );
        expect(store.SDKConfig.v2SecureServiceUrl, 'v2SecureServiceUrl').to.eq(
            'jssdks.mparticle.com/v2/JS/'
        );
        expect(store.SDKConfig.v3SecureServiceUrl, 'v3SecureServiceUrl').to.eq(
            'jssdks.mparticle.com/v3/JS/'
        );
    });

    it('should assign expected values to dataPlan', () => {
        const dataPlanConfig = {
            ...sampleConfig,
            dataPlan: {
                planId: 'test-data-plan',
                planVersion: 3,
            },
        };
        const store: IStore = new Store(dataPlanConfig, window.mParticle);

        expect(store.SDKConfig.dataPlan, 'dataPlan').to.deep.equal({
            PlanId: 'test-data-plan',
            PlanVersion: 3,
        });
    });
});
