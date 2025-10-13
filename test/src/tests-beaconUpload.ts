import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { expect } from 'chai';
import { urls, apiKey, MPConfig, testMPID } from './config/constants';
import { event0 } from '../fixtures/events';
import { batch1, batch2, batch3 } from '../fixtures/batches';
import _BatchValidator from '../../src/mockBatchCreator';
import Utils from './config/utils';
import { IMParticleInstanceManager } from '../../src/sdkRuntimeModels';
const { waitForCondition, fetchMockSuccess, hasIdentifyReturned } = Utils;

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
    before(function() {
        fetchMock.restore();
        sinon.restore();
    });

    beforeEach(function() {
        fetchMock.restore();
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
    });

    it('should trigger beacon on page visibilitychange events', async () => {
        window.mParticle._resetForTests(MPConfig);

        const bond = sinon.spy(navigator, 'sendBeacon');
        window.mParticle.init(apiKey, window.mParticle.config);

        window.mParticle.logEvent('Test Event');

        await waitForCondition(hasIdentifyReturned)

        // visibility change is a document property, not window
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            get: () => 'hidden'
        })
        document.dispatchEvent(new Event('visibilitychange'));

        expect(bond.called).to.be.true;
        expect(bond.lastCall.args[0]).to.eql(urls.events);
    });

    it('should trigger beacon on page beforeunload events', async () => {
        window.mParticle._resetForTests(MPConfig);

        const bond = sinon.spy(navigator, 'sendBeacon');
        window.mParticle.init(apiKey, window.mParticle.config);

        window.mParticle.logEvent('Test Event');

        await waitForCondition(hasIdentifyReturned)

        // karma fails if onbeforeunload is not set to null
        window.onbeforeunload = null;
        window.dispatchEvent(new Event('beforeunload'));

        expect(bond.called).to.be.true;
        expect(bond.lastCall.args[0]).to.eql(urls.events);
    });

    it('should trigger beacon on pagehide events', async () => {
        window.mParticle._resetForTests(MPConfig);

        const bond = sinon.spy(navigator, 'sendBeacon');
        window.mParticle.init(apiKey, window.mParticle.config);

        window.mParticle.logEvent('Test Event');

        await waitForCondition(hasIdentifyReturned)

        // Create event listener that prevents default
        const preventUnload = (e) => {
            e.preventDefault();
            return (e.returnValue = '');
        };
        window.addEventListener('pagehide', preventUnload)

        // Trigger pagehide
        const pagehideEvent = new Event('pagehide', { cancelable: true });
        window.dispatchEvent(pagehideEvent);

        bond.called.should.eql(true);
        bond.getCalls()[0].args[0].should.eql(urls.events);

        (typeof bond.getCalls()[0].args[1]).should.eql('object');
    });

    describe('Offline Storage Enabled', () => {
        beforeEach(() => {
            window.mParticle.config.flags = {
                offlineStorage: '100',
                ...enableBatchingConfigFlags,
            };

            fetchMockSuccess(urls.identify, {
                mpid: testMPID,
                is_logged_in: false,
            });

            window.sessionStorage.clear();
            window.localStorage.clear();
        });

        afterEach(() => {
            fetchMock.restore();
        });

        it('`visibilitychange` should purge events and batches from Offline Storage after dispatch', async () => {
            fetchMock.resetHistory();

            const eventStorageKey = 'mprtcl-v4_abcdef-events';
            const batchStorageKey = 'mprtcl-v4_abcdef-batches';
            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);

            await waitForCondition(hasIdentifyReturned)

            const mpInstance = window.mParticle.getInstance();
            const uploader = mpInstance._APIClient.uploader;

            // Add batches to queue so we can confirm they are purged later
            uploader.batchesQueuedForProcessing.push(batch1);
            uploader.batchesQueuedForProcessing.push(batch2);
            uploader.batchesQueuedForProcessing.push(batch3);
            uploader.queueEvent(event0);

            expect(
                window.sessionStorage.getItem(eventStorageKey),
                'Stored Events should exist'
            ).to.be.ok;

            const storedEvents = JSON.parse(window.sessionStorage.getItem(eventStorageKey));

            expect(
                storedEvents
                    .length,
                'Events should be populated before Before Dispatch'
            ).to.equal(1);
            expect(storedEvents[0].EventName).to.equal(event0.EventName);

            expect(
                uploader.batchesQueuedForProcessing.length,
                'Batch Queue be populated before dispatch'
            ).to.equal(3);

            // Dispatching event will trigger upload process
            // visibility change is a document property, not window
            Object.defineProperty(document, 'visibilityState', {
                configurable: true,
                get: () => 'hidden'
            })
            document.dispatchEvent(new Event('visibilitychange'));

            expect(
                window.sessionStorage.getItem(eventStorageKey),
                'Events should be empty after dispatch'
            ).to.equal('');

            expect(
                window.localStorage.getItem(batchStorageKey),
                'Batches should be empty after dispatch'
            ).to.equal(null);

            expect(
                uploader.batchesQueuedForProcessing.length,
                'Batch Queue should be empty after dispatch'
            ).to.equal(0);

        });

        it('`beforeunload` should purge events and batches from Offline Storage after dispatch', async () => {
            fetchMock.resetHistory();

            const eventStorageKey = 'mprtcl-v4_abcdef-events';
            const batchStorageKey = 'mprtcl-v4_abcdef-batches';

            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);

            await waitForCondition(hasIdentifyReturned)
            
            const mpInstance = window.mParticle.getInstance();
            const uploader = mpInstance._APIClient.uploader;

            // Add batches to queue so we can confirm they are purged later
            uploader.batchesQueuedForProcessing.push(batch1);
            uploader.batchesQueuedForProcessing.push(batch2);
            uploader.batchesQueuedForProcessing.push(batch3);

            uploader.queueEvent(event0);

            expect(
                window.sessionStorage.getItem(eventStorageKey),
                'Stored Events should exist'
            ).to.be.ok;

            const storedEvents = JSON.parse(window.sessionStorage.getItem(eventStorageKey));
            expect(
                storedEvents
                    .length,
                'Events should be populated before Before Dispatch'
            ).to.equal(1);
            expect(storedEvents[0].EventName).to.equal(event0.EventName);

            expect(
                uploader.batchesQueuedForProcessing.length,
                'Batch Queue be populated before dispatch'
            ).to.equal(3);

            // karma fails if onbeforeunload is not set to null
            window.onbeforeunload = null;
            // Dispatching event will trigger upload process
            window.dispatchEvent(new Event('beforeunload'));

            expect(
                window.sessionStorage.getItem(eventStorageKey),
                'Events should be empty after dispatch'
            ).to.equal('');

            expect(
                window.localStorage.getItem(batchStorageKey),
                'Batches should be empty after dispatch'
            ).to.equal(null);

            expect(
                uploader.batchesQueuedForProcessing.length,
                'Batch Queue should be empty after dispatch'
            ).to.equal(0);
        });

        it('`pagehide` should purge events and batches from Offline Storage after dispatch', async () => {
            fetchMock.resetHistory();

            const eventStorageKey = 'mprtcl-v4_abcdef-events';
            const batchStorageKey = 'mprtcl-v4_abcdef-batches';

            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);

            await waitForCondition(hasIdentifyReturned)

            const mpInstance = window.mParticle.getInstance();
            const uploader = mpInstance._APIClient.uploader;

            // Add batches to queue so we can confirm they are purged later
            uploader.batchesQueuedForProcessing.push(batch1);
            uploader.batchesQueuedForProcessing.push(batch2);
            uploader.batchesQueuedForProcessing.push(batch3);

            uploader.queueEvent(event0);

            expect(
                window.sessionStorage.getItem(eventStorageKey),
                'Stored Events should exist'
            ).to.be.ok;

            const storedEvents = JSON.parse(window.sessionStorage.getItem(eventStorageKey));
            expect(
                storedEvents
                    .length,
                'Events should be populated before Before Dispatch'
            ).to.equal(1);

            expect(
                uploader.batchesQueuedForProcessing.length,
                'Batch Queue be populated before dispatch'
            ).to.equal(3);

            // Dispatching event will trigger upload process
            window.dispatchEvent(new Event('pagehide'));

            expect(
                window.sessionStorage.getItem(eventStorageKey),
                'Events should be empty after dispatch'
            ).to.equal('');

            expect(
                window.localStorage.getItem(batchStorageKey),
                'Batches should be empty after dispatch'
            ).to.equal(null);

            expect(
                uploader.batchesQueuedForProcessing.length,
                'Batch Queue should be empty after dispatch'
            ).to.equal(0);
        });
    });
});