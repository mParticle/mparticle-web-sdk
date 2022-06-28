import { expect } from "chai";
import sinon from 'sinon';
import { SDKInitConfig } from "../../src/sdkRuntimeModels";
import Store, { IStore } from "../../src/store";
import { MPConfig, apiKey } from './config';

describe.only('Store', ()=> {
    const now = new Date();
    let sandbox;
    let clock;

    const sampleConfig = {
        appName: 'Foo'
    } as SDKInitConfig;

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
        expect(store.isEnabled).to.eq(true);
        expect(store.isEnabled).to.eq(true);
        expect(store.sessionAttributes).to.be.ok;
        expect(store.currentSessionMPIDs).to.be.ok;
        expect(store.consentState).to.eq(null);
        expect(store.sessionId).to.eq(null);
        expect(store.isFirstRun).to.eq(null);
        expect(store.clientId).to.eq(null);
        expect(store.deviceId).to.eq(null);
        expect(store.devToken).to.eq(null);
        expect(store.migrationData).to.be.ok;
        expect(store.serverSettings).to.be.ok;
        expect(store.dateLastEventSent).to.eq(null);
        expect(store.sessionStartDate).to.eq(null);
        expect(store.currentPosition).to.eq(null);
        expect(store.isTracking).to.eq(false);
        expect(store.watchPositionId).to.eq(null);
        expect(store.cartProducts.length).to.eq(0);
        expect(store.eventQueue.length).to.eq(0);
        expect(store.currencyCode).to.eq(null);
        expect(store.globalTimer).to.eq(null);
        expect(store.context).to.eq(null);
        expect(store.configurationLoaded).to.eq(false);
        expect(store.identityCallInFlight).to.eq(false);
        expect(store.migratingToIDSyncCookies).to.eq(false);
        expect(store.nonCurrentUserMPIDs).to.be.ok;
        expect(store.identifyCalled).to.eq(false);
        expect(store.isLoggedIn).to.eq(false);
        expect(store.cookieSyncDates).to.be.ok;
        expect(store.integrationAttributes).to.be.ok;
        expect(store.requireDelay).to.eq(true);
        expect(store.isLocalStorageAvailable).to.eq(null);
        expect(store.storageName).to.eq(null);
        expect(store.prodStorageName).to.eq(null);
        expect(store.activeForwarders.length).to.eq(0);
        expect(store.kits).to.be.ok;
        expect(store.configuredForwarders).to.be.ok;
        expect(store.pixelConfigurations.length).to.eq(0);
        expect(store.integrationDelayTimeoutStart).to.eq(clock.now);

        
    });

    describe('SDKConfig', () => {
        it('should set valid defaults', () => {
            const store: IStore = new Store(sampleConfig, window.mParticle);
            expect(store.SDKConfig.appName).to.eq('Foo');
        });

    });

});