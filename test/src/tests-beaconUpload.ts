import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { expect } from 'chai';
import { urls, apiKey, MPConfig, testMPID } from './config/constants';
import { event0 } from '../fixtures/events';
import { batch1, batch2, batch3 } from '../fixtures/batches';
import _BatchValidator from '../../src/mockBatchCreator';
import Utils from './config/utils';
import { IMParticleInstanceManager } from '../../src/sdkRuntimeModels';
const {
    findEventFromRequest,
    findBatch,
    waitForCondition,
    fetchMockSuccess,
    hasIdentifyReturned,
} = Utils;

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
    before(function () {
        fetchMock.restore();
        sinon.restore();
    });

    beforeEach(function () {
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

    it('should trigger beacon on page visibilitychange events', function (done) {
        window.mParticle._resetForTests(MPConfig);

        const bond = sinon.spy(navigator, 'sendBeacon');
        window.mParticle.init(apiKey, window.mParticle.config);

        waitForCondition(hasIdentifyReturned).then(() => {
            // visibility change is a document property, not window
            document.dispatchEvent(new Event('visibilitychange'));

            bond.called.should.eql(true);
            bond.lastCall.args[0].should.eql(urls.events);

            done();
        });
    });

    it('should trigger beacon on page beforeunload events', function (done) {
        window.mParticle._resetForTests(MPConfig);

        const bond = sinon.spy(navigator, 'sendBeacon');
        window.mParticle.init(apiKey, window.mParticle.config);

        waitForCondition(hasIdentifyReturned).then(() => {
            // karma fails if onbeforeunload is not set to null
            window.onbeforeunload = null;
            window.dispatchEvent(new Event('beforeunload'));

            bond.called.should.eql(true);
            bond.getCalls()[0].args[0].should.eql(urls.events);

            done();
        });
    });

    it('should trigger beacon on pagehide events', function (done) {
        window.mParticle._resetForTests(MPConfig);

        const bond = sinon.spy(navigator, 'sendBeacon');
        window.mParticle.init(apiKey, window.mParticle.config);

        waitForCondition(hasIdentifyReturned).then(() => {
            window.dispatchEvent(new Event('pagehide'));

            bond.called.should.eql(true);
            bond.getCalls()[0].args[0].should.eql(urls.events);

            (typeof bond.getCalls()[0].args[1]).should.eql('object');

            done();
        });
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

        it('`visibilitychange` should purge events and batches from Offline Storage after dispatch', function (done) {
            const eventStorageKey = 'mprtcl-v4_abcdef-events';
            const batchStorageKey = 'mprtcl-v4_abcdef-batches';
            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(hasIdentifyReturned).then(() => {
                const mpInstance = window.mParticle.getInstance();
                const uploader = mpInstance._APIClient.uploader;

                // Add batches to queue so we can confirm they are purged later
                uploader.batchesQueuedForProcessing.push(batch1);
                uploader.batchesQueuedForProcessing.push(batch2);
                uploader.batchesQueuedForProcessing.push(batch3);
                uploader.queueEvent(event0);

                expect(
                    window.sessionStorage.getItem(eventStorageKey),
                    'Stored Events should exist',
                ).to.be.ok;

                expect(
                    JSON.parse(window.sessionStorage.getItem(eventStorageKey))
                        .length,
                    'Events should be populated before Before Dispatch',
                ).to.equal(3);

                expect(
                    uploader.batchesQueuedForProcessing.length,
                    'Batch Queue be populated before dispatch',
                ).to.equal(3);

                // Dispatching event will trigger upload process
                // visibility change is a document property, not window
                document.dispatchEvent(new Event('visibilitychange'));

                expect(
                    window.sessionStorage.getItem(eventStorageKey),
                    'Events should be empty after dispatch',
                ).to.equal('');

                expect(
                    window.localStorage.getItem(batchStorageKey),
                    'Batches should be empty after dispatch',
                ).to.equal(null);

                expect(
                    uploader.batchesQueuedForProcessing.length,
                    'Batch Queue should be empty after dispatch',
                ).to.equal(0);

                done();
            });
        });

        it('`beforeunload` should purge events and batches from Offline Storage after dispatch', function (done) {
            const eventStorageKey = 'mprtcl-v4_abcdef-events';
            const batchStorageKey = 'mprtcl-v4_abcdef-batches';

            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(hasIdentifyReturned).then(() => {
                const mpInstance = window.mParticle.getInstance();
                const uploader = mpInstance._APIClient.uploader;

                // Add batches to queue so we can confirm they are purged later
                uploader.batchesQueuedForProcessing.push(batch1);
                uploader.batchesQueuedForProcessing.push(batch2);
                uploader.batchesQueuedForProcessing.push(batch3);

                uploader.queueEvent(event0);

                expect(
                    window.sessionStorage.getItem(eventStorageKey),
                    'Stored Events should exist',
                ).to.be.ok;

                expect(
                    JSON.parse(window.sessionStorage.getItem(eventStorageKey))
                        .length,
                    'Events should be populated before Before Dispatch',
                ).to.equal(3);

                expect(
                    uploader.batchesQueuedForProcessing.length,
                    'Batch Queue be populated before dispatch',
                ).to.equal(3);

                // Dispatching event will trigger upload process
                window.dispatchEvent(new Event('beforeunload'));

                expect(
                    window.sessionStorage.getItem(eventStorageKey),
                    'Events should be empty after dispatch',
                ).to.equal('');

                expect(
                    window.localStorage.getItem(batchStorageKey),
                    'Batches should be empty after dispatch',
                ).to.equal(null);

                expect(
                    uploader.batchesQueuedForProcessing.length,
                    'Batch Queue should be empty after dispatch',
                ).to.equal(0);

                done();
            });
        });

        it('`pagehide` should purge events and batches from Offline Storage after dispatch', function (done) {
            const eventStorageKey = 'mprtcl-v4_abcdef-events';
            const batchStorageKey = 'mprtcl-v4_abcdef-batches';

            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(hasIdentifyReturned).then(() => {
                const mpInstance = window.mParticle.getInstance();
                const uploader = mpInstance._APIClient.uploader;

                // Add batches to queue so we can confirm they are purged later
                uploader.batchesQueuedForProcessing.push(batch1);
                uploader.batchesQueuedForProcessing.push(batch2);
                uploader.batchesQueuedForProcessing.push(batch3);

                uploader.queueEvent(event0);

                expect(
                    window.sessionStorage.getItem(eventStorageKey),
                    'Stored Events should exist',
                ).to.be.ok;

                expect(
                    JSON.parse(window.sessionStorage.getItem(eventStorageKey))
                        .length,
                    'Events should be populated before Before Dispatch',
                ).to.equal(3);

                expect(
                    uploader.batchesQueuedForProcessing.length,
                    'Batch Queue be populated before dispatch',
                ).to.equal(3);

                // Dispatching event will trigger upload process
                window.dispatchEvent(new Event('pagehide'));

                expect(
                    window.sessionStorage.getItem(eventStorageKey),
                    'Events should be empty after dispatch',
                ).to.equal('');

                expect(
                    window.localStorage.getItem(batchStorageKey),
                    'Batches should be empty after dispatch',
                ).to.equal(null);

                expect(
                    uploader.batchesQueuedForProcessing.length,
                    'Batch Queue should be empty after dispatch',
                ).to.equal(0);

                done();
            });
        });
    });
});
