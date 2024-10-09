import sinon from 'sinon';
import { urls, apiKey, MPConfig, testMPID } from './config/constants';
import {
    BaseEvent,
    MParticleWebSDK,
    SDKEvent,
    SDKProductActionType,
} from '../../src/sdkRuntimeModels';
import { Batch, CustomEventData } from '@mparticle/event-models';
import Utils from './config/utils';
import { BatchUploader } from '../../src/batchUploader';
import { expect } from 'chai';
import _BatchValidator from '../../src/mockBatchCreator';
import Logger from '../../src/logger.js';
import { event0, event1, event2, event3 } from '../fixtures/events';
import fetchMock from 'fetch-mock/esm/client';
const { fetchMockSuccess, waitForCondition, hasIdentifyReturned  } = Utils;

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
    }
}

const enableBatchingConfigFlags = {
    eventBatchingIntervalMillis: 1000,
};

describe('batch uploader', () => {
    let mockServer;
    let clock;

    beforeEach(() => {
        fetchMock.restore();
        fetchMock.config.overwriteRoutes = true;
        fetchMockSuccess(urls.identify, {
            mpid: testMPID,
            is_logged_in: false,
        });
        fetchMock.post(urls.events, 200);
    });

    afterEach(() => {
        fetchMock.restore();
        window.localStorage.clear();
    });

    describe('Upload Workflow', () => {
        beforeEach(() => {
        });

        afterEach(() => {
            fetchMock.restore();
        });

        it('should organize events in the order they are processed and maintain that order when uploading', (done) => {
            // Batches should be uploaded in the order they were created to prevent
            // any potential corruption.
            fetchMock.post(urls.events, 200);
            fetchMock.config.overwriteRoutes = true;

            window.mParticle.config.flags = {
                ...enableBatchingConfigFlags,
            };

            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(hasIdentifyReturned)
            .then(() => {
            window.mParticle.logEvent('Test Event 0');

            // Manually initiate the upload process - turn event into batches and upload the batch
            window.mParticle.upload();

            expect(
                fetchMock.called(),
                'FetchMock should have been called'
            ).to.equal(true);

            const batch1 = JSON.parse(fetchMock.lastCall()[1].body as string);

            // Batch 1 should contain only session start, AST and a single event
            // in this exact order
            expect(batch1.events.length).to.equal(3);
            expect(batch1.events[0].event_type).to.equal('session_start');
            expect(batch1.events[1].event_type).to.equal(
                'application_state_transition'
            );
            expect(batch1.events[2].data.event_name).to.equal('Test Event 0');

            // Log a second batch of events
            window.mParticle.logEvent('Test Event 1');
            window.mParticle.logEvent('Test Event 2');
            window.mParticle.logEvent('Test Event 3');

            // Manually initiate the upload process - turn event into batches and upload the batch 
            window.mParticle.upload();

            const batch2 = JSON.parse(fetchMock.lastCall()[1].body as string);

            // Batch 2 should contain three custom events
            expect(batch2.events.length).to.equal(3);
            expect(batch2.events[0].data.event_name).to.equal('Test Event 1');
            expect(batch2.events[1].data.event_name).to.equal('Test Event 2');
            expect(batch2.events[2].data.event_name).to.equal('Test Event 3');

            // Log a third batch of events
            window.mParticle.logEvent('Test Event 4');
            window.mParticle.logEvent('Test Event 5');

            // Manually initiate the upload process - turn event into batches and upload the batch 
            window.mParticle.upload();

            const batch3 = JSON.parse(fetchMock.lastCall()[1].body as string);

            // Batch 3 should contain two custom events
            expect(batch3.events.length).to.equal(2);
            expect(batch3.events[0].data.event_name).to.equal('Test Event 4');
            expect(batch3.events[1].data.event_name).to.equal('Test Event 5');

            done();

        })
        .catch((e) => {
        })
        });

        // TODO: Investigate workflow with unshift vs push
        // https://go.mparticle.com/work/SQDSDKS-5165
        it.skip('should keep batches in sequence for future retries when an HTTP 500 error occurs', (done) => {
            // If batches cannot upload, they should be added back to the Batch Queue
            // in the order they were created so they can be retransmitted.

            fetchMock.post(urls.events, 500);

            window.mParticle.config.flags = {
                ...enableBatchingConfigFlags,
            };

            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);
            // Generates Batch 1 with Session Start + AST

            // Adds a custom event to Batch 1
            window.mParticle.logEvent('Test Event 0');

            // Manually initiate the upload process - turn event into batches and upload the batch 
            window.mParticle.upload();

            expect(
                fetchMock.called(),
                'FetchMock should have been called'
            ).to.equal(true);

            const batch1 = JSON.parse(fetchMock.calls()[0][1].body as string);

            // Batch 1 should contain only session start, AST and a single event
            // in this exact order
            expect(batch1.events.length).to.equal(3);
            expect(batch1.events[0].event_type).to.equal('session_start');
            expect(batch1.events[1].event_type).to.equal(
                'application_state_transition'
            );
            expect(batch1.events[2].data.event_name).to.equal('Test Event 0');

            // Batch 2
            window.mParticle.logEvent('Test Event 1');
            window.mParticle.logEvent('Test Event 2');
            window.mParticle.logEvent('Test Event 3');

            // Manually initiate the upload process - turn event into batches and upload the batch
            window.mParticle.upload();

            // Batch 3
            window.mParticle.logEvent('Test Event 4');
            window.mParticle.logEvent('Test Event 5');
            window.mParticle.logEvent('Test Event 6');

            // Manually initiate the upload process - turn event into batches and upload the batch
            window.mParticle.upload();

            // Reset clock so that the setTimeout return immediately
            clock.restore();

            setTimeout(() => {
                const batchQueue =
                    window.mParticle.getInstance()._APIClient.uploader
                        .batchesQueuedForProcessing;

                expect(batchQueue.length).to.equal(3);

                expect(batchQueue[0].events[0].event_type).to.equal(
                    'session_start'
                );
                expect(batchQueue[0].events[1].event_type).to.equal(
                    'application_state_transition'
                );
                expect(batchQueue[0].events[2].data.event_name).to.equal('Test Event 0');

                expect(batchQueue[1].events[0].data.event_name).to.equal(
                    'Test Event 1'
                );
                expect(batchQueue[1].events[1].data.event_name).to.equal(
                    'Test Event 2'
                );
                expect(batchQueue[1].events[2].data.event_name).to.equal(
                    'Test Event 3'
                );

                expect(batchQueue[2].events[0].data.event_name).to.equal(
                    'Test Event 4'
                );
                expect(batchQueue[2].events[1].data.event_name).to.equal(
                    'Test Event 5'
                );
                expect(batchQueue[2].events[2].data.event_name).to.equal(
                    'Test Event 6'
                );

                done();
            }, 0);
        });

        // TODO: Investigate workflow with unshift vs push
        // https://go.mparticle.com/work/SQDSDKS-5165
        it.skip('should keep and retry batches in sequence if the transmission fails midway', (done) => {
            // First request is successful, subsequent requests fail
            fetchMock.post(urls.events, 200, {
                overwriteRoutes: false,
                repeat: 1,
            });

            fetchMock.post(urls.events, 429, {
                overwriteRoutes: false,
            });

            window.mParticle.config.flags = {
                ...enableBatchingConfigFlags,
            };

            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);
            // Generates Batch 1 with Session Start + AST

            // Adds a custom event to Batch 1
            window.mParticle.logEvent('Test Event 0');

            // Manually initiate the upload process - turn event into batches and upload the batch 
            window.mParticle.upload();

            // Batch 2
            window.mParticle.logEvent('Test Event 1');
            window.mParticle.logEvent('Test Event 2');
            window.mParticle.logEvent('Test Event 3');

            // Manually initiate the upload process - turn event into batches and upload the batch 
            window.mParticle.upload();

            // Batch 3
            window.mParticle.logEvent('Test Event 4');
            window.mParticle.logEvent('Test Event 5');
            window.mParticle.logEvent('Test Event 6');

            // Manually initiate the upload process - turn event into batches and upload the batch 
            window.mParticle.upload();

            // Reset timer so the setTimeout can trigger
            clock.restore();

            setTimeout(() => {
                // Batch upload should be triggered 3 times, but only
                // 2 should be waiting for retry
                expect(fetchMock.calls().length).to.equal(3);

                const batchQueue =
                    window.mParticle.getInstance()._APIClient.uploader
                        .batchesQueuedForProcessing;

                expect(batchQueue.length).to.equal(2);

                expect(batchQueue[0].events[0].data.event_name).to.equal(
                    'Test Event 1'
                );
                expect(batchQueue[0].events[1].data.event_name).to.equal(
                    'Test Event 2'
                );
                expect(batchQueue[0].events[2].data.event_name).to.equal(
                    'Test Event 3'
                );

                expect(batchQueue[1].events[0].data.event_name).to.equal(
                    'Test Event 4'
                );
                expect(batchQueue[1].events[1].data.event_name).to.equal(
                    'Test Event 5'
                );
                expect(batchQueue[1].events[2].data.event_name).to.equal(
                    'Test Event 6'
                );

                done();
            }, 0);
        });
    });
});