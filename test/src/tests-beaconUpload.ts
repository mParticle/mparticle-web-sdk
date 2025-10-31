import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { expect } from 'chai';
import { urls, apiKey, MPConfig, testMPID } from './config/constants';
import { event0 } from '../fixtures/events';
import { batch1, batch2, batch3 } from '../fixtures/batches';
import _BatchValidator from '../../src/mockBatchCreator';
import Utils from './config/utils';
import { IMParticleInstanceManager } from '../../src/sdkRuntimeModels';
const { waitForCondition, fetchMockSuccess, hasIdentifyReturned, triggerVisibilityHidden } = Utils;

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
        fetchMock: any;
    }
}

const enableBatchingConfigFlags = {
    eventBatchingIntervalMillis: 1000,
};


describe('Beacon Upload', () => {
    beforeEach(() => {
        window.mParticle._resetForTests(MPConfig);
        fetchMock.config.overwriteRoutes = true; 

        fetchMockSuccess(urls.identify, {
            mpid: testMPID,
            is_logged_in: false,
        });

        fetchMockSuccess(urls.events);
        window.mParticle.config.flags = {
            eventBatchingIntervalMillis: 1000,
        };
    });

    afterEach(() => {
        sinon.restore();
        fetchMock.restore();
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    it('should trigger beacon on page visibilitychange events', async () => {
        const bond = sinon.spy(navigator, 'sendBeacon');
        window.mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        triggerVisibilityHidden();

        expect(bond.called).to.be.true;
        expect(bond.lastCall.args[0]).to.equal(urls.events);
    });

    it('should trigger beacon on page beforeunload events', async () => {
        const bond = sinon.spy(navigator, 'sendBeacon');
        window.mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        window.onbeforeunload = null;
        window.dispatchEvent(new Event('beforeunload'));

        expect(bond.called).to.be.true;
        expect(bond.firstCall.args[0]).to.equal(urls.events);
    });

    it('should trigger beacon on pagehide events', async () => {
        const bond = sinon.spy(navigator, 'sendBeacon');
        window.mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        window.dispatchEvent(new Event('pagehide'));

        expect(bond.called).to.be.true;
        expect(bond.firstCall.args[0]).to.equal(urls.events);
        expect(bond.firstCall.args[1]).to.be.instanceof(Blob);
    });

    describe('Offline Storage Enabled', () => {
        beforeEach(() => {
            window.mParticle.config.flags = {
                offlineStorage: '100',
                ...enableBatchingConfigFlags,
            };
        });

        it('`visibilitychange` should purge events and batches from Offline Storage after dispatch', async () => {
            const eventStorageKey = 'mprtcl-v4_abcdef-events';
            const batchStorageKey = 'mprtcl-v4_abcdef-batches';

            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);

            const mpInstance = window.mParticle.getInstance();
            const uploader = mpInstance._APIClient.uploader;

            // Add batches to queue so we can confirm they are purged later
            uploader.batchesQueuedForProcessing.push(batch1, batch2, batch3);
            uploader.queueEvent(event0);

            expect(window.sessionStorage.getItem(eventStorageKey), 'Stored Events should exist').to.be.ok;
            expect(JSON.parse(window.sessionStorage.getItem(eventStorageKey)).length, 'Events should be populated before dispatch').to.equal(3);
            expect(uploader.batchesQueuedForProcessing.length, 'Batch Queue should be populated before dispatch').to.equal(3);

            triggerVisibilityHidden();

            expect(window.sessionStorage.getItem(eventStorageKey), 'Events should be empty after dispatch').to.equal('');
            expect(window.localStorage.getItem(batchStorageKey), 'Batches should be empty after dispatch').to.equal(null);
            expect(uploader.batchesQueuedForProcessing.length, 'Batch Queue should be empty after dispatch').to.equal(0);
        });

        it('`beforeunload` should purge events and batches from Offline Storage after dispatch', async () => {
            const eventStorageKey = 'mprtcl-v4_abcdef-events';
            const batchStorageKey = 'mprtcl-v4_abcdef-batches';

            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);
            
            const mpInstance = window.mParticle.getInstance();
            const uploader = mpInstance._APIClient.uploader;

            // Add batches to queue so we can confirm they are purged later
            uploader.batchesQueuedForProcessing.push(batch1, batch2, batch3);
            uploader.queueEvent(event0);

            expect(window.sessionStorage.getItem(eventStorageKey), 'Stored Events should exist').to.be.ok;
            expect(JSON.parse(window.sessionStorage.getItem(eventStorageKey)).length, 'Events should be populated before dispatch').to.equal(3);
            expect(uploader.batchesQueuedForProcessing.length, 'Batch Queue should be populated before dispatch').to.equal(3);
            
            window.onbeforeunload = null;
            window.dispatchEvent(new Event('beforeunload'));

            expect(window.sessionStorage.getItem(eventStorageKey), 'Events should be empty after dispatch').to.equal('');
            expect(window.localStorage.getItem(batchStorageKey), 'Batches should be empty after dispatch').to.equal(null);
            expect(uploader.batchesQueuedForProcessing.length, 'Batch Queue should be empty after dispatch').to.equal(0);
        });

        it('`pagehide` should purge events and batches from Offline Storage after dispatch', async () => {
            const eventStorageKey = 'mprtcl-v4_abcdef-events';
            const batchStorageKey = 'mprtcl-v4_abcdef-batches';

            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);

            const mpInstance = window.mParticle.getInstance();
            const uploader = mpInstance._APIClient.uploader;

            // Add batches to queue so we can confirm they are purged later
            uploader.batchesQueuedForProcessing.push(batch1, batch2, batch3);
            uploader.queueEvent(event0);

            expect(window.sessionStorage.getItem(eventStorageKey), 'Stored Events should exist').to.be.ok;
            expect(JSON.parse(window.sessionStorage.getItem(eventStorageKey)).length, 'Events should be populated before dispatch').to.equal(3);
            expect(uploader.batchesQueuedForProcessing.length, 'Batch Queue should be populated before dispatch').to.equal(3);

            window.dispatchEvent(new Event('pagehide'));

            expect(window.sessionStorage.getItem(eventStorageKey), 'Events should be empty after dispatch').to.equal('');
            expect(window.localStorage.getItem(batchStorageKey), 'Batches should be empty after dispatch').to.equal(null);
            expect(uploader.batchesQueuedForProcessing.length, 'Batch Queue should be empty after dispatch').to.equal(0);
        });
    });
});