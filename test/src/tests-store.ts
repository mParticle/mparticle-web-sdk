import { expect } from "chai";
import sinon from 'sinon';
import Store, { IStore } from "../../src/store";
import { MPConfig, apiKey } from './config';

describe('Store', ()=> {
    const now = new Date();
    let sandbox;
    let clock;

    const sampleConfig = {
        appName: 'Store Test',
        appVersion: '1.x',
        package: 'com.mparticle.test',
    };

    beforeEach(function() {
        sandbox = sinon.createSandbox();
        clock = sinon.useFakeTimers(now.getTime());
        console.log('clock', clock);
        // MP Instance is just used because Store requires an mParticle instance
        window.mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        window.mParticle._resetForTests(MPConfig);
        sandbox.restore();
        clock.restore();
    });

	it('should set defaults', () => {
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
        expect(store.context, 'context').to.eq(''); // FIXME: should be null
        expect(store.configurationLoaded, 'configurationLoaded').to.eq(false);
        expect(store.identityCallInFlight, 'identityCallInFlight').to.eq(false);
        expect(store.migratingToIDSyncCookies, 'migratingToIDSyncCookies').to.eq(false);
        expect(store.nonCurrentUserMPIDs, 'nonCurrentUserMPIDs').to.be.ok;
        expect(store.identifyCalled, 'identifyCalled').to.eq(false);
        expect(store.isLoggedIn, 'isLoggedIn').to.eq(false);
        expect(store.cookieSyncDates, 'cookieSyncDates').to.be.ok;
        expect(store.integrationAttributes, 'integrationAttributes').to.be.ok;
        expect(store.requireDelay, 'requireDelay').to.eq(true);
        expect(store.isLocalStorageAvailable, 'isLocalStorageAvailable').to.eq(null);
        expect(store.storageName, 'storageName').to.eq(null);
        expect(store.prodStorageName, 'prodStorageName').to.eq(null);
        expect(store.activeForwarders.length, 'activeForwarders').to.eq(0);
        expect(store.kits, 'kits').to.be.ok;
        expect(store.configuredForwarders, 'configuredForwarders').to.be.ok;
        expect(store.pixelConfigurations.length, 'pixelConfigurations').to.eq(0);
        expect(store.integrationDelayTimeoutStart, 'integrationDelayTimeoutStart').to.eq(clock.now);

        
    });

    describe('SDKConfig', () => {
        it('should set valid defaults', () => {
            const store: IStore = new Store(sampleConfig, window.mParticle);

            console.log('CONFIG', store.SDKConfig);

            expect(store.SDKConfig.appName).to.eq('Store Test');
            expect(store.SDKConfig.isDevelopmentMode, 'isDevelopmentMode').to.eq(false);
            expect(store.SDKConfig.appVersion, 'appVersion').to.eq('1.x');
            expect(store.SDKConfig.package, 'package').to.eq('com.mparticle.test');


            expect(store.SDKConfig.flags.eventBatchingIntervalMillis, 'flags.eventBatchingIntervalMillis').to.eq(0);
            expect(store.SDKConfig.flags.eventsV3, 'flags.eventsV3').to.eq(0);
            expect(store.SDKConfig.flags.reportBatching, 'flags.reportBatching').to.eq(false);
            expect(store.SDKConfig.forceHttps, 'forceHttps').to.eq(true);

            expect(store.SDKConfig.aliasMaxWindow, 'aliasMaxWindow').to.eq(90);
            expect(store.SDKConfig.logLevel, 'logLevel').to.eq(null);
            expect(store.SDKConfig.maxCookieSize, 'maxCookieSize').to.eq(3000);
            expect(store.SDKConfig.maxProducts, 'maxProducts').to.eq(20);
            expect(store.SDKConfig.sessionTimeout, 'sessionTimeout').to.eq(30);
            expect(store.SDKConfig.useCookieStorage, 'useCookieStorage').to.eq(false);
            expect(store.SDKConfig.cookieDomain, 'cookieDomain').to.eq(null);
            expect(store.SDKConfig.minWebviewBridgeVersion, 'minWebviewBridgeVersion').to.eq(1);
            expect(store.SDKConfig.isIOS, 'isIOS').to.eq(false);// ?: boolean;
            expect(store.SDKConfig.integrationDelayTimeout, 'integrationDelayTimeout').to.eq(5000);
            expect(store.SDKConfig.aliasUrl, 'aliasUrl').to.eq('jssdks.mparticle.com/v1/identity/');
            expect(store.SDKConfig.configUrl, 'configUrl').to.eq('jssdkcdns.mparticle.com/JS/v2/');
            expect(store.SDKConfig.identityUrl, 'identityUrl').to.eq('identity.mparticle.com/v1/');

            expect(store.SDKConfig.v1SecureServiceUrl, 'v1SecureServiceUrl').to.eq('jssdks.mparticle.com/v1/JS/');// ?: string;
            expect(store.SDKConfig.v2SecureServiceUrl, 'v2SecureServiceUrl').to.eq('jssdks.mparticle.com/v2/JS/');// ?: string;
            expect(store.SDKConfig.v3SecureServiceUrl, 'v3SecureServiceUrl').to.eq('jssdks.mparticle.com/v3/JS/');// ?: string;


            // expect(store.SDKConfig.customFlags, 'customFlags').to.eq('');// ?: SDKEventCustomFlags;
            // expect(store.SDKConfig.dataPlan, 'dataPlan').to.eq('');// : DataPlanConfig | SDKDataPlan; // FIXME: Resolve kit blocker data plan confusion
            // expect(store.SDKConfig.kitConfigs, 'kitConfigs').to.eq(0);// : any; // FIXME: What type is this?
            // expect(store.SDKConfig.kits, 'kits').to.eq('');// ?: Record<string, any>; // FIXME: Create a Kits Type
            // expect(store.SDKConfig.workspaceToken, 'workspaceToken').to.eq('');// : string;
            // expect(store.SDKConfig.requiredWebviewBridgeName, 'requiredWebviewBridgeName').to.eq('');// : string;
            // expect(store.SDKConfig.identifyRequest, 'identifyRequest').to.eq('');// : IdentifyRequest;
            // expect(store.SDKConfig.identityCallback, 'identityCallback').to.eq('');// : IdentityCallback;
            // expect(store.SDKConfig.requestConfig, 'requestConfig').to.eq('');// : boolean;
            // expect(store.SDKConfig.dataPlanOptions, 'dataPlanOptions').to.eq('');// : KitBlockerOptions; // when the user provides their own data plan
            // expect(store.SDKConfig.dataPlanResult, 'dataPlanResult').to.eq('');// ?: DataPlanResult; // when the data plan comes from the server via /config
            // expect(store.SDKConfig.useNativeSdk, 'useNativeSdk').to.eq('');// ?: boolean;
        });
    });

});