import sinon from 'sinon';
import { expect } from 'chai';
import { urls } from './config';
import { apiKey, MPConfig, testMPID } from './config';
import { MParticleWebSDK } from '../../src/sdkRuntimeModels';
import { event0 } from '../fixtures/events';
import { batch1, batch2, batch3 } from '../fixtures/batches';
import _BatchValidator from '../../src/mockBatchCreator';

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        fetchMock: any;
    }
}

const enableBatchingConfigFlags = {
    eventBatchingIntervalMillis: 1000,
};

let clock;

describe('Beacon Upload', () => {
    let mockServer;
    before(function() {
        window.fetchMock.restore();
        sinon.restore();
    });

    beforeEach(function() {
        window.fetchMock.restore();
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        window.mParticle.config.flags = {
            eventBatchingIntervalMillis: 1000,
        };
    });

    afterEach(() => {
        sinon.restore();
        mockServer.reset();
        window.fetchMock.restore();
    });

    it('should trigger beacon on page visibilitychange events', function(done) {
        window.mParticle._resetForTests(MPConfig);

        const bond = sinon.spy(navigator, 'sendBeacon');
        window.mParticle.init(apiKey, window.mParticle.config);

        // visibility change is a document property, not window
        document.dispatchEvent(new Event('visibilitychange'));

        bond.called.should.eql(true);
        bond.lastCall.args[0].should.eql(urls.events);

        done();
    });

    it('should trigger beacon on page beforeunload events', function(done) {
        window.mParticle._resetForTests(MPConfig);

        const bond = sinon.spy(navigator, 'sendBeacon');
        window.mParticle.init(apiKey, window.mParticle.config);

        // karma fails if onbeforeunload is not set to null
        window.onbeforeunload = null;
        window.dispatchEvent(new Event('beforeunload'));

        bond.called.should.eql(true);
        bond.getCalls()[0].args[0].should.eql(urls.events);

        done();
    });

    it('should trigger beacon on pagehide events', function(done) {
        window.mParticle._resetForTests(MPConfig);

        const bond = sinon.spy(navigator, 'sendBeacon');
        window.mParticle.init(apiKey, window.mParticle.config);

        window.dispatchEvent(new Event('pagehide'));

        bond.called.should.eql(true);
        bond.getCalls()[0].args[0].should.eql(urls.events);

        (typeof bond.getCalls()[0].args[1]).should.eql('object');

        done();
    });

    describe('Offline Storage Enabled', () => {
        beforeEach(() => {
            window.mParticle.config.flags = {
                offlineStorage: '100',
                ...enableBatchingConfigFlags,
            };

            clock = sinon.useFakeTimers({
                now: new Date().getTime(),
            });
            window.fetchMock.restore();

            window.sessionStorage.clear();
            window.localStorage.clear();
        });

        afterEach(() => {
            sinon.restore();
            window.fetchMock.restore();
            clock.restore();
        });

        it('`visibilitychange` should purge events and batches from Offline Storage after dispatch', function(done) {
            const eventStorageKey = 'mprtcl-v4_abcdef-events';
            const batchStorageKey = 'mprtcl-v4_abcdef-batches';

            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);

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

            expect(
                JSON.parse(window.sessionStorage.getItem(eventStorageKey))
                    .length,
                'Events should be populated before Before Dispatch'
            ).to.equal(3);

            expect(
                uploader.batchesQueuedForProcessing.length,
                'Batch Queue be populated before dispatch'
            ).to.equal(3);

            // Dispatching event will trigger upload process
            // visibility change is a document property, not window
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

            done();
        });

        it('`beforeunload` should purge events and batches from Offline Storage after dispatch', function(done) {
            const eventStorageKey = 'mprtcl-v4_abcdef-events';
            const batchStorageKey = 'mprtcl-v4_abcdef-batches';

            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);

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

            expect(
                JSON.parse(window.sessionStorage.getItem(eventStorageKey))
                    .length,
                'Events should be populated before Before Dispatch'
            ).to.equal(3);

            expect(
                uploader.batchesQueuedForProcessing.length,
                'Batch Queue be populated before dispatch'
            ).to.equal(3);

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

            done();
        });

        it('`pagehide` should purge events and batches from Offline Storage after dispatch', function(done) {
            const eventStorageKey = 'mprtcl-v4_abcdef-events';
            const batchStorageKey = 'mprtcl-v4_abcdef-batches';

            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);

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

            expect(
                JSON.parse(window.sessionStorage.getItem(eventStorageKey))
                    .length,
                'Events should be populated before Before Dispatch'
            ).to.equal(3);

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

            done();
        });
    });
});
