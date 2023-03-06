import sinon from 'sinon';
import { urls } from './config';
import { apiKey, MPConfig, testMPID } from './config';
import {
    BaseEvent,
    MParticleWebSDK,
    SDKEvent,
    SDKProductActionType,
} from '../../src/sdkRuntimeModels';
import { Batch, CustomEventData } from '@mparticle/event-models';
import Utils from './utils';
import { BatchUploader } from '../../src/batchUploader';
import { expect } from 'chai';
import _BatchValidator from '../../src/mockBatchCreator';
import Logger from '../../src/logger.js';
declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        fetchMock: any;
    }
}

describe('batch uploader', () => {
    let mockServer;
    let clock;

    beforeEach(() => {
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
    });

    afterEach(() => {
        mockServer.reset();
    });

    describe('Unit Tests', () => {
        describe('#queueEvent', () => {
            it('should add events to the Pending Events Queue', () => {
                window.mParticle._resetForTests(MPConfig);
                window.mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = window.mParticle.getInstance();

                const uploader = new BatchUploader(mpInstance, 1000);

                const event: SDKEvent = {
                    EventName: 'Test Event',
                    EventAttributes: null,
                    SourceMessageId: 'test-smid',
                    EventDataType: 4,
                    EventCategory: 1,
                    CustomFlags: {},
                    IsFirstRun: false,
                    CurrencyCode: null,
                    MPID: 'testMPID',
                    ConsentState: null,
                    UserAttributes: {},
                    UserIdentities: [],
                    SDKVersion: 'X.XX.XX',
                    SessionId: 'test-session-id',
                    SessionStartDate: 0,
                    Debug: false,
                    DeviceId: 'test-device',
                    Timestamp: 0,
                };

                uploader.queueEvent(event);

                expect(uploader.eventsQueuedForProcessing.length).to.eql(1);
            });

            it('should reject batches without events', () => {
                window.mParticle._resetForTests(MPConfig);
                window.mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = window.mParticle.getInstance();

                const uploader = new BatchUploader(mpInstance, 1000);

                uploader.queueEvent(null);
                uploader.queueEvent({} as unknown as SDKEvent);

                expect(uploader.eventsQueuedForProcessing).to.eql([]);
                expect(uploader.batchesQueuedForProcessing).to.eql([]);
            });

            it('should add events in the order they are received', () => {
                window.mParticle._resetForTests(MPConfig);
                window.mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = window.mParticle.getInstance();

                const uploader = new BatchUploader(mpInstance, 1000);

                const event1: SDKEvent = {
                    EventName: 'Test Event 1',
                    EventAttributes: null,
                    SourceMessageId: 'test-smid-abc',
                    EventDataType: 4,
                    EventCategory: 1,
                    CustomFlags: {},
                    IsFirstRun: false,
                    CurrencyCode: null,
                    MPID: 'testMPID',
                    ConsentState: null,
                    UserAttributes: {},
                    UserIdentities: [],
                    SDKVersion: 'X.XX.XX',
                    SessionId: 'test-session-id',
                    SessionStartDate: 0,
                    Debug: false,
                    DeviceId: 'test-device',
                    Timestamp: 0,
                };

                const event2: SDKEvent = {
                    EventName: 'Test Event 2',
                    EventAttributes: null,
                    SourceMessageId: 'test-smid-132',
                    EventDataType: 4,
                    EventCategory: 1,
                    CustomFlags: {},
                    IsFirstRun: false,
                    CurrencyCode: null,
                    MPID: 'testMPID',
                    ConsentState: null,
                    UserAttributes: {},
                    UserIdentities: [],
                    SDKVersion: 'X.XX.XX',
                    SessionId: 'test-session-id',
                    SessionStartDate: 0,
                    Debug: false,
                    DeviceId: 'test-device',
                    Timestamp: 0,
                };

                const event3: SDKEvent = {
                    EventName: 'Test Event 3',
                    EventAttributes: null,
                    SourceMessageId: 'test-smid-ABCDEFG',
                    EventDataType: 4,
                    EventCategory: 1,
                    CustomFlags: {},
                    IsFirstRun: false,
                    CurrencyCode: null,
                    MPID: 'testMPID',
                    ConsentState: null,
                    UserAttributes: {},
                    UserIdentities: [],
                    SDKVersion: 'X.XX.XX',
                    SessionId: 'test-session-id',
                    SessionStartDate: 0,
                    Debug: false,
                    DeviceId: 'test-device',
                    Timestamp: 0,
                };

                uploader.queueEvent(event1);
                uploader.queueEvent(event2);
                uploader.queueEvent(event3);

                expect(uploader.eventsQueuedForProcessing.length).to.eql(3);
                expect(uploader.eventsQueuedForProcessing[0]).to.eql(event1);
                expect(uploader.eventsQueuedForProcessing[1]).to.eql(event2);
                expect(uploader.eventsQueuedForProcessing[2]).to.eql(event3);
            });
        });

        describe('#uploadBatches', () => {
            beforeEach(() => {
                window.mParticle.config.flags = {
                    eventsV3: '100',
                    eventBatchingIntervalMillis: 1000,
                };

                mockServer = sinon.createFakeServer();
                mockServer.respondImmediately = true;
                window.mParticle._resetForTests(MPConfig);
                window.mParticle.init(apiKey, window.mParticle.config);
            });

            it('should reject batches without events', async () => {
                window.fetchMock.post(
                    'https://jssdks.mparticle.com/v3/JS/test_key/events',
                    200
                );

                const newLogger = new Logger(window.mParticle.config);
                const mpInstance = window.mParticle.getInstance();

                const uploader = new BatchUploader(mpInstance, 1000);

                const batchValidator = new _BatchValidator();
                const baseEvent: BaseEvent = {
                    messageType: 4,
                    name: 'testEvent',
                };

                const actualBatch = batchValidator.returnBatch(baseEvent);
                const eventlessBatch = batchValidator.returnBatch(
                    {} as unknown as BaseEvent
                );

                // HACK: Directly access uploader to Force an upload
                await (<any>uploader).uploadBatches(
                    newLogger,
                    [actualBatch, eventlessBatch],
                    false
                );

                expect(window.fetchMock.calls().length).to.equal(1);

                const actualBatchResult = JSON.parse(
                    window.fetchMock.calls()[0][1].body
                );

                expect(actualBatchResult.events.length).to.equal(1);
                expect(actualBatchResult.events).to.eql(actualBatch.events);
            });

            it('should return batches that fail to upload with 500 errors', async () => {
                window.fetchMock.post(
                    'https://jssdks.mparticle.com/v3/JS/test_key/events',
                    500
                );

                const newLogger = new Logger(window.mParticle.config);
                const mpInstance = window.mParticle.getInstance();

                const uploader = new BatchUploader(mpInstance, 1000);

                const batchValidator = new _BatchValidator();

                const batch1 = batchValidator.returnBatch({
                    messageType: 4,
                    name: 'Test Event 1',
                });

                const batch2 = batchValidator.returnBatch({
                    messageType: 4,
                    name: 'Test Event 2',
                });
                const batch3 = batchValidator.returnBatch({
                    messageType: 4,
                    name: 'Test Event 3',
                });

                // HACK: Directly access uploader to Force an upload
                const batchesNotUploaded = await (<any>uploader).uploadBatches(
                    newLogger,
                    [batch1, batch2, batch3],
                    false
                );

                expect(
                    batchesNotUploaded.length,
                    'Should have 3 uploaded batches'
                ).to.equal(3);

                expect(
                    batchesNotUploaded[0].events[0].data.event_name
                ).to.equal('Test Event 1');
                expect(
                    batchesNotUploaded[1].events[0].data.event_name
                ).to.equal('Test Event 2');
                expect(
                    batchesNotUploaded[2].events[0].data.event_name
                ).to.equal('Test Event 3');
            });

            it('should return batches that fail to upload with 429 errors', async () => {
                window.fetchMock.post(
                    'https://jssdks.mparticle.com/v3/JS/test_key/events',
                    429
                );

                const newLogger = new Logger(window.mParticle.config);
                const mpInstance = window.mParticle.getInstance();

                const uploader = new BatchUploader(mpInstance, 1000);

                const batchValidator = new _BatchValidator();

                const batch1 = batchValidator.returnBatch({
                    messageType: 4,
                    name: 'Test Event 1',
                });

                const batch2 = batchValidator.returnBatch({
                    messageType: 4,
                    name: 'Test Event 2',
                });
                const batch3 = batchValidator.returnBatch({
                    messageType: 4,
                    name: 'Test Event 3',
                });

                // HACK: Directly access uploader to Force an upload
                const batchesNotUploaded = await (<any>uploader).uploadBatches(
                    newLogger,
                    [batch1, batch2, batch3],
                    false
                );

                expect(
                    batchesNotUploaded.length,
                    'Should have 3 uploaded batches'
                ).to.equal(3);

                expect(
                    batchesNotUploaded[0].events[0].data.event_name
                ).to.equal('Test Event 1');
                expect(
                    batchesNotUploaded[1].events[0].data.event_name
                ).to.equal('Test Event 2');
                expect(
                    batchesNotUploaded[2].events[0].data.event_name
                ).to.equal('Test Event 3');
            });

            it('should return null if batches fail to upload with 401 errors', async () => {
                window.fetchMock.post(
                    'https://jssdks.mparticle.com/v3/JS/test_key/events',
                    401
                );

                const newLogger = new Logger(window.mParticle.config);
                const mpInstance = window.mParticle.getInstance();

                const uploader = new BatchUploader(mpInstance, 1000);

                const batchValidator = new _BatchValidator();

                const batch1 = batchValidator.returnBatch({
                    messageType: 4,
                    name: 'Test Event 1',
                });

                const batch2 = batchValidator.returnBatch({
                    messageType: 4,
                    name: 'Test Event 2',
                });
                const batch3 = batchValidator.returnBatch({
                    messageType: 4,
                    name: 'Test Event 3',
                });

                // HACK: Directly access uploader to Force an upload
                const batchesNotUploaded = await (<any>uploader).uploadBatches(
                    newLogger,
                    [batch1, batch2, batch3],
                    false
                );

                expect(batchesNotUploaded === null).to.equal(true);
            });

            it('should return batches that fail to unknown HTTP errors', async () => {
                window.fetchMock.post(
                    'https://jssdks.mparticle.com/v3/JS/test_key/events',
                    400
                );

                const newLogger = new Logger(window.mParticle.config);
                const mpInstance = window.mParticle.getInstance();

                const uploader = new BatchUploader(mpInstance, 1000);

                const batchValidator = new _BatchValidator();

                const batch1 = batchValidator.returnBatch({
                    messageType: 4,
                    name: 'Test Event 1',
                });

                const batch2 = batchValidator.returnBatch({
                    messageType: 4,
                    name: 'Test Event 2',
                });
                const batch3 = batchValidator.returnBatch({
                    messageType: 4,
                    name: 'Test Event 3',
                });

                // HACK: Directly access uploader to Force an upload
                const batchesNotUploaded = await (<any>uploader).uploadBatches(
                    newLogger,
                    [batch1, batch2, batch3],
                    false
                );

                expect(batchesNotUploaded).to.be.ok;

                expect(
                    batchesNotUploaded.length,
                    'Should have 3 uploaded batches'
                ).to.equal(3);

                expect(
                    batchesNotUploaded[0].events[0].data.event_name
                ).to.equal('Test Event 1');
                expect(
                    batchesNotUploaded[1].events[0].data.event_name
                ).to.equal('Test Event 2');
                expect(
                    batchesNotUploaded[2].events[0].data.event_name
                ).to.equal('Test Event 3');
            });
        });
    });

    describe('Upload Workflow', () => {
        beforeEach(() => {
            clock = sinon.useFakeTimers({
                now: new Date().getTime(),
            });
        });

        afterEach(() => {
            window.fetchMock.restore();
            clock.restore();
        });

        it('should organize events in the order they are processed and maintain that order when uploading', (done) => {
            // Batches should be uploaded in the order they were created to prevent
            // any potential corruption.

            window.fetchMock.post(urls.eventsV3, 200);
            window.fetchMock.config.overwriteRoutes = true;

            window.mParticle.config.flags = {
                eventsV3: '100',
                eventBatchingIntervalMillis: 1000,
            };

            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);

            window.mParticle.logEvent('Test Event 0');

            // Manually initiate the upload process - turn event into batches and upload the batch 
            window.mParticle.upload();

            expect(
                window.fetchMock.called(),
                'FetchMock should have been called'
            ).to.equal(true);

            const batch1 = JSON.parse(window.fetchMock._calls[0][1].body);

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

            const batch2 = JSON.parse(window.fetchMock._calls[1][1].body);

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

            const batch3 = JSON.parse(window.fetchMock._calls[2][1].body);

            // Batch 3 should contain two custom events
            expect(batch3.events.length).to.equal(2);
            expect(batch3.events[0].data.event_name).to.equal('Test Event 4');
            expect(batch3.events[1].data.event_name).to.equal('Test Event 5');

            done();
        });

        it('should keep batches in sequence for future retries when an HTTP 500 error occurs', (done) => {
            // If batches cannot upload, they should be added back to the Batch Queue
            // in the order they were created so they can be retransmitted.

            window.fetchMock.post(urls.eventsV3, 500);

            window.mParticle.config.flags = {
                eventsV3: '100',
                eventBatchingIntervalMillis: 1000,
            };

            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);
            // Generates Batch 1 with Session Start + AST

            // Adds a custom event to Batch 1
            window.mParticle.logEvent('Test Event 0');

            // Manually initiate the upload process - turn event into batches and upload the batch 
            window.mParticle.upload();

            expect(
                window.fetchMock.called(),
                'FetchMock should have been called'
            ).to.equal(true);

            const batch1 = JSON.parse(window.fetchMock._calls[0][1].body);

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

        it('should keep and retry batches in sequence if the transmission fails midway', (done) => {
            // First request is successful, subsequent requests fail
            window.fetchMock.post(urls.eventsV3, 200, {
                overwriteRoutes: false,
                repeat: 1,
            });

            window.fetchMock.post(urls.eventsV3, 429, {
                overwriteRoutes: false,
            });

            window.mParticle.config.flags = {
                eventsV3: '100',
                eventBatchingIntervalMillis: 1000,
            };

            // debugger;

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
                expect(window.fetchMock.calls().length).to.equal(3);

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

    describe('batching via window.fetch', () => {
        beforeEach(() => {
            window.fetchMock.post(urls.eventsV3, 200);
            window.fetchMock.config.overwriteRoutes = true;
            clock = sinon.useFakeTimers({now: new Date().getTime()});

            window.mParticle.config.flags = {
                eventsV3: '100',
                eventBatchingIntervalMillis: 1000,
            }
        });

        afterEach(() => {
            window.fetchMock.restore();
            sinon.restore();
            clock.restore();
        });

        it('should use custom v3 endpoint', function(done) {
            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);
    
            window.mParticle.logEvent('Test Event');
            
            // Identity call is via XHR request
            // Session start, AST, and `Test Event` are queued.
            mockServer.requests.length.should.equal(1);

            // Tick forward 1000 ms to hit upload interval and force an upload
            clock.tick(1000);

            const lastCall = window.fetchMock.lastCall();
            const endpoint = lastCall[0];
            var batch = JSON.parse(window.fetchMock.lastCall()[1].body);

            endpoint.should.equal(urls.eventsV3);
            batch.events[0].event_type.should.equal('session_start');
            batch.events[1].event_type.should.equal('application_state_transition');
            batch.events[2].event_type.should.equal('custom_event');
            batch.events[2].data.event_name.should.equal('Test Event');
    
            done();
        });

        it('should have latitude/longitude for location when batching', function(done) {
            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);
    
            window.mParticle.setPosition(100, 100);
            window.mParticle.logEvent('Test Event');
            clock.tick(1000);

            // Tick forward 1000 ms to hit upload interval and force an upload
            const lastCall = window.fetchMock.lastCall();
            const endpoint = lastCall[0];
            var batch = JSON.parse(window.fetchMock.lastCall()[1].body);
            endpoint.should.equal(urls.eventsV3);
            batch.events[2].data.location.should.have.property('latitude', 100)
            batch.events[2].data.location.should.have.property('longitude', 100)
    
            done();
        });

        it('should force uploads when using public `upload`', function(done) {
            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);

            window.mParticle.logEvent('Test Event');

            // Identity call is via XHR request
            // Session start, AST, and `Test Event` are queued.
            mockServer.requests.length.should.equal(1);

            // no calls made to fetch yet
            (window.fetchMock.lastCall() === undefined).should.equal(true)
            
            // force upload, triggering window.fetch
            window.mParticle.upload();

            const lastCall = window.fetchMock.lastCall();
            const endpoint = lastCall[0];
            var batch = JSON.parse(window.fetchMock.lastCall()[1].body);

            endpoint.should.equal(urls.eventsV3);
            batch.events[0].event_type.should.equal('session_start');
            batch.events[1].event_type.should.equal('application_state_transition');
            batch.events[2].event_type.should.equal('custom_event');
            batch.events[2].data.event_name.should.equal('Test Event');

            done();
        });

        it('should force uploads when a commerce event is called', function(done) {
            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);

            window.mParticle.logEvent('Test Event');
            // Identity call is via XHR request
            // Session start, AST, and `Test Event` are queued.
            mockServer.requests.length.should.equal(1);

            var product1 = window.mParticle.eCommerce.createProduct('iphone', 'iphoneSKU', 999);
            window.mParticle.eCommerce.logProductAction(SDKProductActionType.AddToCart, product1);

            const lastCall = window.fetchMock.lastCall();
            const endpoint = lastCall[0];
            var batch = JSON.parse(window.fetchMock.lastCall()[1].body);

            endpoint.should.equal(urls.eventsV3);
            batch.events[0].event_type.should.equal('session_start');
            batch.events[1].event_type.should.equal('application_state_transition');
            batch.events[2].event_type.should.equal('custom_event');
            batch.events[2].data.event_name.should.equal('Test Event');
            batch.events[3].event_type.should.equal('commerce_event');
            batch.events[3].data.product_action.action.should.equal('add_to_cart');

            done();
        });

        it('should return pending uploads if a 500 is returned', function(done) {
            window.mParticle._resetForTests(MPConfig);
            var clock = sinon.useFakeTimers();

            window.fetchMock.post(urls.eventsV3, 500);
            
            window.mParticle.init(apiKey, window.mParticle.config);
            window.mParticle.logEvent('Test Event');

            let pendingEvents = window.mParticle.getInstance()._APIClient.uploader.eventsQueuedForProcessing;

            pendingEvents.length.should.equal(3)
            pendingEvents[0].EventName.should.equal(1);
            pendingEvents[1].EventName.should.equal(10);
            pendingEvents[2].EventName.should.equal('Test Event');

            window.fetchMock.post(urls.eventsV3, 200);
            
            (window.fetchMock.lastCall() === undefined).should.equal(true);
            clock.tick(1000);

            let nowPendingEvents = window.mParticle.getInstance()._APIClient.uploader.eventsQueuedForProcessing;
            nowPendingEvents.length.should.equal(0);

            var batch = JSON.parse(window.fetchMock.lastCall()[1].body);
            batch.events[0].event_type.should.equal('session_start');
            batch.events[1].event_type.should.equal('application_state_transition');
            batch.events[2].event_type.should.equal('custom_event');
            batch.events[2].data.event_name.should.equal('Test Event');

            done();
        });

        it('should send source_message_id with events to v3 endpoint', function(done) {
            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);

            window.mParticle.logEvent('Test Event');

            // Tick forward 1000 ms to hit upload interval and force an upload
            clock.tick(1000);

            const lastCall = window.fetchMock.lastCall();
            const endpoint = lastCall[0];
            var batch = JSON.parse(window.fetchMock.lastCall()[1].body);

            endpoint.should.equal(urls.eventsV3);
            batch.events[0].data.should.have.property('source_message_id')

            done();
        });

        it('should send user-defined SourceMessageId events to v3 endpoint', function(done) {
            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);

            window.mParticle.logBaseEvent({
                messageType: 4,
                name: 'Test Event',
                data: {key: 'value'},
                eventType: 3,
                customFlags: {flagKey: 'flagValue'},
                sourceMessageId: 'abcdefg'
            });

            // Identity call is via XHR request
            // Session start, AST, and `Test Event` are queued.
            mockServer.requests.length.should.equal(1);

            // Tick forward 1000 ms to hit upload interval and force an upload
            clock.tick(1000);

            const lastCall = window.fetchMock.lastCall();
            const endpoint = lastCall[0];
            var batch = JSON.parse(window.fetchMock.lastCall()[1].body);

            endpoint.should.equal(urls.eventsV3);
            // event batch includes session start, ast, then last event is Test Event
            batch.events[batch.events.length-1].data.should.have.property('source_message_id', 'abcdefg')

            done();
        });

        it('should call the identity callback after a session ends if user is returning to the page after a long period of time', function(done) {
            // Background of bug that this test fixes:
            // User navigates away from page and returns after some time
            // and the session should end.  There is a UAC firing inside of
            // config.identityCallback, which would send to our servers with
            // the previous session ID because the identity call back fired
            // before the session logic that determines if a new session should
            // start.

            window.mParticle._resetForTests(MPConfig);
            
            window.mParticle.config.identityCallback = function(result) {
                let currentUser = result.getUser()
                if (currentUser) {
                    // TODO: Investigate if we should update definitely typed typings for
                    // setUserAttribute which only allows strings right now
                    // more context at https://go.mparticle.com/work/SQDSDKS-4576
                    currentUser.setUserAttribute("number", `${Math.floor((Math.random() * 1000) + 1)}`)
                }
            }
            
            var endSessionFunction = window.mParticle.getInstance()._SessionManager.endSession;
            
            window.mParticle.init(apiKey, window.mParticle.config);

            // Mock end session so that the SDK doesn't actually send it. We do this
            // to mimic a return to page behavior, below:
            window.mParticle.getInstance()._SessionManager.endSession = function() {
            }

            // Force 35 minutes to pass, so that when we return to the page, when
            // the SDK initializes it will know to end the session.
            clock.tick(35*60000);

            // Undo mock of end session so that when we initializes, it will end
            // the session for real.
            window.mParticle.getInstance()._SessionManager.endSession = endSessionFunction;

            // Initialize imitates returning to the page
            window.mParticle.init(apiKey, window.mParticle.config);

            // Manually initiate the upload process - turn event into batches and upload the batch 
            window.mParticle.upload();

            // We have to restore the clock in order to use setTimeout below
            clock.restore();

            setTimeout(function() {
                var batch1 = JSON.parse(window.fetchMock._calls[0][1].body);
                var batch2 = JSON.parse(window.fetchMock._calls[1][1].body);
                var batch3 = JSON.parse(window.fetchMock._calls[2][1].body);
                var batch4 = JSON.parse(window.fetchMock._calls[3][1].body);
                var batch5 = JSON.parse(window.fetchMock._calls[4][1].body);

                // UAC event
                expect(batch1.events.length, 'Batch 1: UAC event').to.equal(1);

                // session start, AST
                expect(
                    batch2.events.length,
                    'Batch 2: Session Start, AST'
                ).to.equal(2);

                // session end
                expect(batch3.events.length, 'Batch 3: Session End').to.equal(
                    1
                );

                // UAC event
                expect(
                    batch4.events.length,
                    'Batch 5: Session Start, AST'
                ).to.equal(2);

                // session start, AST
                expect(batch5.events.length, 'Batch 4: UAC event').to.equal(1);

                var batch1UAC = Utils.findEventFromBatch(
                    batch1,
                    'user_attribute_change'
                );
                batch1UAC.should.be.ok();

                var batch2SessionStart = Utils.findEventFromBatch(
                    batch2,
                    'session_start'
                );
                var batch2AST = Utils.findEventFromBatch(
                    batch2,
                    'application_state_transition'
                );

                batch2SessionStart.should.be.ok();
                batch2AST.should.be.ok();

                var batch3SessionEnd = Utils.findEventFromBatch(
                    batch3,
                    'session_end'
                );
                batch3SessionEnd.should.be.ok();

                var batch4SessionStart = Utils.findEventFromBatch(
                    batch4,
                    'session_start'
                );
                var batch4AST = Utils.findEventFromBatch(
                    batch4,
                    'application_state_transition'
                );

                batch4SessionStart.should.be.ok();
                batch4AST.should.be.ok();

                var batch5UAC = Utils.findEventFromBatch(
                    batch5,
                    'user_attribute_change'
                );
                batch5UAC.should.be.ok();

                (typeof batch1.source_request_id).should.equal('string');
                (typeof batch2.source_request_id).should.equal('string');
                (typeof batch3.source_request_id).should.equal('string');
                (typeof batch4.source_request_id).should.equal('string');
                (typeof batch5.source_request_id).should.equal('string');

                batch1.source_request_id.should.not.equal(
                    batch2.source_request_id
                );
                batch1.source_request_id.should.not.equal(
                    batch3.source_request_id
                );
                batch1.source_request_id.should.not.equal(
                    batch4.source_request_id
                );
                batch1.source_request_id.should.not.equal(
                    batch5.source_request_id
                );

                batch2.source_request_id.should.not.equal(
                    batch3.source_request_id
                );
                batch2.source_request_id.should.not.equal(
                    batch4.source_request_id
                );
                batch2.source_request_id.should.not.equal(
                    batch5.source_request_id
                );

                batch3.source_request_id.should.not.equal(
                    batch4.source_request_id
                );
                batch3.source_request_id.should.not.equal(
                    batch5.source_request_id
                );
                batch4.source_request_id.should.not.equal(
                    batch5.source_request_id
                );

                batch1UAC.data.session_uuid.should.equal(
                    batch2AST.data.session_uuid
                );
                batch1UAC.data.session_uuid.should.equal(
                    batch2SessionStart.data.session_uuid
                );
                batch1UAC.data.session_uuid.should.not.equal(
                    batch5UAC.data.session_uuid
                );
                batch1UAC.data.session_uuid.should.not.equal(
                    batch4SessionStart.data.session_uuid
                );
                batch1UAC.data.session_uuid.should.not.equal(
                    batch4AST.data.session_uuid
                );

                batch1UAC.data.session_start_unixtime_ms.should.equal(
                    batch2AST.data.session_start_unixtime_ms
                );
                batch1UAC.data.session_start_unixtime_ms.should.equal(
                    batch2SessionStart.data.session_start_unixtime_ms
                );
                batch1UAC.data.session_start_unixtime_ms.should.not.equal(
                    batch5UAC.data.session_start_unixtime_ms
                );
                batch1UAC.data.session_start_unixtime_ms.should.not.equal(
                    batch4SessionStart.data.session_start_unixtime_ms
                );
                batch1UAC.data.session_start_unixtime_ms.should.not.equal(
                    batch4AST.data.session_start_unixtime_ms
                );

                batch2SessionStart.data.session_uuid.should.equal(
                    batch2AST.data.session_uuid
                );
                batch2SessionStart.data.session_uuid.should.equal(
                    batch3SessionEnd.data.session_uuid
                );
                batch2AST.data.session_uuid.should.equal(
                    batch3SessionEnd.data.session_uuid
                );

                batch2SessionStart.data.session_start_unixtime_ms.should.equal(
                    batch2AST.data.session_start_unixtime_ms
                );
                batch2SessionStart.data.session_start_unixtime_ms.should.equal(
                    batch3SessionEnd.data.session_start_unixtime_ms
                );
                batch2AST.data.session_start_unixtime_ms.should.equal(
                    batch3SessionEnd.data.session_start_unixtime_ms
                );

                batch4AST.data.session_uuid.should.equal(
                    batch5UAC.data.session_uuid
                );
                batch4SessionStart.data.session_uuid.should.equal(
                    batch5UAC.data.session_uuid
                );
                batch4SessionStart.data.session_uuid.should.equal(
                    batch4AST.data.session_uuid
                );

                batch4AST.data.session_start_unixtime_ms.should.equal(
                    batch5UAC.data.session_start_unixtime_ms
                );
                batch4SessionStart.data.session_start_unixtime_ms.should.equal(
                    batch5UAC.data.session_start_unixtime_ms
                );
                batch4SessionStart.data.session_start_unixtime_ms.should.equal(
                    batch4AST.data.session_start_unixtime_ms
                );

                done();

                // wait for more than 1000 milliseconds to force the final upload
            }, 1200);
        });
    });

    describe('batching via XHR for older browsers without window.fetch', () => {
        var fetch = window.fetch;

        beforeEach(() => {
            delete window.fetch
            window.mParticle.config.flags = {
                eventsV3: '100',
                eventBatchingIntervalMillis: 1000,
            }
            mockServer.respondWith(urls.eventsV3, [
                200,
                {},
                JSON.stringify({ mpid: testMPID, Store: {}})
            ]);
            clock = sinon.useFakeTimers();
        });
    
        afterEach(() => {
            window.mParticle._resetForTests(MPConfig);
            window.fetch = fetch;
            sinon.restore();
            clock.restore();
        });

        it('should use custom v3 endpoint', function(done) {
            window.mParticle._resetForTests(MPConfig);

            mockServer.requests = [];
            window.mParticle.init(apiKey, window.mParticle.config);

            window.mParticle.logEvent('Test Event');
            
            // The only request to the server should be the identify call
            // Session start, AST, and Test Event are queued.
            mockServer.requests.length.should.equal(1);
            // Upload interval hit, now will send requests
            clock.tick(1000);

            // 1st request is /Identity call, 2nd request is /Event call
            var batch = JSON.parse(mockServer.secondRequest.requestBody);
            
            batch.events[0].event_type.should.equal('session_start');
            batch.events[1].event_type.should.equal('application_state_transition');
            batch.events[2].event_type.should.equal('custom_event');
            batch.events[2].data.event_name.should.equal('Test Event');

            done();
        });

        it('should force uploads when using public `upload`', function(done) {
            window.mParticle._resetForTests(MPConfig);

            window.mParticle.init(apiKey, window.mParticle.config);

            window.mParticle.logEvent('Test Event');
            
            // The only request to the server should be the identify call
            // Session start, AST, and Test Event are queued.
            mockServer.requests.length.should.equal(1);
            // Upload interval hit, now will send requests
            clock.tick(1000);
            window.mParticle.upload();
            // 1st request is /Identity call, 2nd request is /Event call
            var batch = JSON.parse(mockServer.secondRequest.requestBody);

            batch.events[0].event_type.should.equal('session_start');
            batch.events[1].event_type.should.equal('application_state_transition');
            batch.events[2].event_type.should.equal('custom_event');
            batch.events[2].data.event_name.should.equal('Test Event');

            done();
        });

        it('should trigger an upload of batch when a commerce event is called', function(done) {
            window.mParticle._resetForTests(MPConfig);

            window.mParticle.init(apiKey, window.mParticle.config);

            window.mParticle.logEvent('Test Event');
            // The only request to the server should be the identify call
            // Session start, AST, and Test Event are queued.
            mockServer.requests.length.should.equal(1);

            var product1 = window.mParticle.eCommerce.createProduct('iphone', 'iphoneSKU', 999);
            window.mParticle.eCommerce.logProductAction(SDKProductActionType.AddToCart, product1);
            // 1st request is /Identity call, 2nd request is /Event call
            var batch = JSON.parse(mockServer.secondRequest.requestBody);

            batch.events[0].event_type.should.equal('session_start');
            batch.events[1].event_type.should.equal('application_state_transition');
            batch.events[2].event_type.should.equal('custom_event');
            batch.events[2].data.event_name.should.equal('Test Event');
            batch.events[3].event_type.should.equal('commerce_event');
            batch.events[3].data.product_action.action.should.equal('add_to_cart');

            done();
        });

        it('should trigger an upload of batch when a UIC occurs', function(done) {
            window.mParticle._resetForTests(MPConfig);
            // include an identify request so that it creates a UIC
            window.mParticle.config.identifyRequest = {
                userIdentities: {
                    customerid: 'foo-customer-id'
                }
            };

            window.mParticle.init(apiKey, window.mParticle.config);

            // Requests sent should be identify call, then UIC event
            // Session start, AST, and Test Event are queued, and don't appear
            // in the mockServer.requests
            mockServer.requests.length.should.equal(2);

            // 1st request is /Identity call, 2nd request is UIC call
            var batch = JSON.parse(mockServer.secondRequest.requestBody);
            
            batch.events[0].event_type.should.equal('user_identity_change');

            // force upload of other events
            window.mParticle.upload()
            var batch2 = JSON.parse(mockServer.thirdRequest.requestBody);

            batch2.events[0].event_type.should.equal('session_start');
            batch2.events[1].event_type.should.equal('application_state_transition');

            done();
        });

        it('should trigger an upload of batch when a UAC occurs', function(done) {
            window.mParticle._resetForTests(MPConfig);

            window.mParticle.init(apiKey, window.mParticle.config);

            // Set a user attribute to trigger a UAC event
            window.mParticle.Identity.getCurrentUser().setUserAttribute('age', 25);

            // Requests sent should be identify call, then
            // a request for session start, AST, and UAC
            mockServer.requests.length.should.equal(2);
            // 1st request is /Identity call, 2nd request is UIC call
            var batch = JSON.parse(mockServer.secondRequest.requestBody);
            
            batch.events[0].event_type.should.equal('session_start');
            batch.events[1].event_type.should.equal('application_state_transition');
            batch.events[2].event_type.should.equal('user_attribute_change');

            done();
        });

        it('should return pending uploads if a 500 is returned', function(done) {
            window.mParticle._resetForTests(MPConfig);
            var clock = sinon.useFakeTimers();

            mockServer.respondWith(urls.eventsV3, [
                500,
                {},
                JSON.stringify({ mpid: testMPID, Store: {}})
            ]);

            window.mParticle.init(apiKey, window.mParticle.config);
            window.mParticle.logEvent('Test Event');

            const pendingEvents = window.mParticle.getInstance()._APIClient.uploader.eventsQueuedForProcessing;

            pendingEvents.length.should.equal(3)
            pendingEvents[0].EventName.should.equal(1);
            pendingEvents[1].EventName.should.equal(10);
            pendingEvents[2].EventName.should.equal('Test Event');

            clock.tick(1000);

            const nowPendingEvents = window.mParticle.getInstance()._APIClient.uploader.eventsQueuedForProcessing;
            nowPendingEvents.length.should.equal(0);

            var batch = JSON.parse(mockServer.secondRequest.requestBody);
            batch.events[0].event_type.should.equal('session_start');
            batch.events[1].event_type.should.equal('application_state_transition');
            batch.events[2].event_type.should.equal('custom_event');
            batch.events[2].data.event_name.should.equal('Test Event');
            done();
        });

        it('should add a modified boolean of true to a batch that has been modified via a config.onCreateBatch call', function(done) {
            window.mParticle._resetForTests(MPConfig);
            var clock = sinon.useFakeTimers();

            window.mParticle.config.onCreateBatch = function (batch: Batch) {
                return batch
            };

            window.mParticle.init(apiKey, window.mParticle.config);
            window.mParticle.logEvent('Test Event');
            
            clock.tick(1000);
            
            var batch = JSON.parse(mockServer.secondRequest.requestBody);
            batch.modified.should.equal(true);
            done();
        });

        it('should respect rules for the batch modification', function(done) {
            window.mParticle._resetForTests(MPConfig);
            var clock = sinon.useFakeTimers();

            window.mParticle.config.onCreateBatch = function (batch) {
                batch.events.map(event => {
                    if (event.event_type === "custom_event") {
                        (event.data as CustomEventData).event_name = 'Modified!'
                    }
                });
                return batch;
            };

            window.mParticle.init(apiKey, window.mParticle.config);
            window.mParticle.logEvent('Test Event');
            
            clock.tick(1000);

            var batch = JSON.parse(mockServer.secondRequest.requestBody);
            batch.events.length.should.equal(3);
            batch.events[0].event_type.should.equal('session_start');
            batch.events[1].event_type.should.equal('application_state_transition');
            batch.events[2].event_type.should.equal('custom_event');
            batch.events[2].data.event_name.should.equal('Modified!');
            done();
        });

        it('should add a modified boolean of true to a batch that has been modified via a config.onCreateBatch call', function(done) {
            window.mParticle._resetForTests(MPConfig);
            var clock = sinon.useFakeTimers();

            window.mParticle.config.onCreateBatch = function (batch: Batch) {
                return undefined;
            };

            window.mParticle.init(apiKey, window.mParticle.config);
            window.mParticle.logEvent('Test Event');
            
            clock.tick(1000);
            
            (mockServer.secondRequest === null).should.equal(true);
            done();
        });
    });
});