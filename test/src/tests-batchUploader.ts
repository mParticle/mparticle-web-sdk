import sinon from 'sinon';
import { urls, apiKey, MPConfig, testMPID } from './config/constants';
import {
    BaseEvent,
    IMParticleInstanceManager,
    SDKEvent,
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
        mParticle: IMParticleInstanceManager;
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

    describe('Unit Tests', () => {
        describe('#queueEvent', () => {
            it('should add events to the Pending Events Queue', () => {
                window.mParticle._resetForTests(MPConfig);
                window.mParticle.init(apiKey, window.mParticle.config);
                
                waitForCondition(hasIdentifyReturned)
                .then(() => {
                const mpInstance = window.mParticle.getInstance();

                const uploader = new BatchUploader(mpInstance, 1000);

                const event: SDKEvent = {
                    EventName: 'Test Event',
                    EventAttributes: null,
                    SourceMessageId: 'test-smid',
                    EventDataType: 4,
                    EventCategory: 1,
                    ExpandedEventCount: 0,
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
                })
            });

            it('should reject batches without events', () => {
                window.mParticle._resetForTests(MPConfig);

                window.mParticle.init(apiKey, window.mParticle.config);
                waitForCondition(hasIdentifyReturned)
                .then(() => {

                const mpInstance = window.mParticle.getInstance();

                const uploader = new BatchUploader(mpInstance, 1000);

                uploader.queueEvent(null);
                uploader.queueEvent({} as unknown as SDKEvent);

                expect(uploader.eventsQueuedForProcessing).to.eql([]);
                expect(uploader.batchesQueuedForProcessing).to.eql([]);
                })
            });

            it('should add events in the order they are received', () => {
                window.mParticle._resetForTests(MPConfig);
                window.mParticle.init(apiKey, window.mParticle.config);
                waitForCondition(hasIdentifyReturned)
                .then(() => {

                const mpInstance = window.mParticle.getInstance();

                const uploader = new BatchUploader(mpInstance, 1000);

                uploader.queueEvent(event1);
                uploader.queueEvent(event2);
                uploader.queueEvent(event3);

                expect(uploader.eventsQueuedForProcessing.length).to.eql(3);
                expect(uploader.eventsQueuedForProcessing[0]).to.eql(event1);
                expect(uploader.eventsQueuedForProcessing[1]).to.eql(event2);
                expect(uploader.eventsQueuedForProcessing[2]).to.eql(event3);
                })
            });
        });

        describe('#uploadBatches', () => {
            beforeEach(() => {
                window.mParticle.config.flags = {
                    eventBatchingIntervalMillis: 1000,
                };
                fetchMock.post(urls.events, 200);
            });
            afterEach(() => {
                fetchMock.restore();
            });

            it('should reject batches without events', (done) => {
                window.mParticle.init(apiKey, window.mParticle.config);

                waitForCondition(hasIdentifyReturned)
                .then(async () => {
                fetchMock.post(urls.events, 200);

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

                fetchMock.resetHistory();
                // HACK: Directly access uploader to Force an upload
                await (<any>uploader).uploadBatches(
                    newLogger,
                    [actualBatch, eventlessBatch],
                    false
                );

                expect(fetchMock.calls().length).to.equal(1);

                const actualBatchResult = JSON.parse(
                    fetchMock.calls()[0][1].body as string
                );

                expect(actualBatchResult.events.length).to.equal(1);
                expect(actualBatchResult.events).to.eql(actualBatch.events);

                done();
                })
                .catch((e) => {
                });
            });

            it('should return batches that fail to upload with 500 errors', () => {
                window.mParticle.init(apiKey, window.mParticle.config);

                waitForCondition(hasIdentifyReturned)
                .then(async () => {

                fetchMock.post(urls.events, 500);

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
                })
                .catch((e) => {
                });
            });

            it('should return batches that fail to upload with 429 errors', async () => {
                window.mParticle.init(apiKey, window.mParticle.config);

                waitForCondition(hasIdentifyReturned)
                .then(async () => {
                fetchMock.post(urls.events,  429);

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
                })
            });

            it('should return null if batches fail to upload with 401 errors', async () => {
                window.mParticle.init(apiKey, window.mParticle.config);

                waitForCondition(hasIdentifyReturned)
                .then(async () => {
                fetchMock.post(urls.events, 401);

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
                })
            });

            it('should not throw an error when upload is called while storage has not been created yet', async () => {
                window.localStorage.clear();
                window.sessionStorage.clear();

                window.mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = window.mParticle.getInstance();
                const uploader = mpInstance._APIClient.uploader;

                expect(uploader).to.equal(null)

                expect(() => { window.mParticle.upload() }).to.not.throw(TypeError, /Cannot read properties of null \(reading 'prepareAndUpload'\)/)
            });

            it('should return batches that fail to unknown HTTP errors', async () => {
                window.mParticle.init(apiKey, window.mParticle.config);

                waitForCondition(hasIdentifyReturned)
                .then(async () => {
                fetchMock.post(urls.events, 400);

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
                })
                .catch((e) => {
                });
            });
        });
    });

    describe('Offline Storage Feature Flag', () => {
        beforeEach(() => {
            fetchMockSuccess(urls.identify, {
                mpid: testMPID,
                is_logged_in: false,
            });

            window.localStorage.clear();
            window.sessionStorage.clear();
        });
        afterEach(() => {
            sinon.restore();
            fetchMock.restore();

            window.localStorage.clear();
            window.sessionStorage.clear();
        });

        it('should use local storage when enabled', (done) => {
            window.mParticle.config.flags = {
                offlineStorage: '100',
            };
            window.mParticle._resetForTests(MPConfig);

            window.mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(hasIdentifyReturned)
            .then(() => {
            const getItemSpy = sinon.spy(Storage.prototype, 'getItem');
            const setItemSpy = sinon.spy(Storage.prototype, 'setItem');

            const mpInstance = window.mParticle.getInstance();

            const uploader = new BatchUploader(mpInstance, 1000);

            const event: SDKEvent = {
                EventName: 'Test Event',
                EventAttributes: null,
                SourceMessageId: 'test-smid',
                EventDataType: 4,
                EventCategory: 1,
                ExpandedEventCount: 0,
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

            const expectedEvent = [event];

            uploader.queueEvent(event);

            expect(uploader.eventsQueuedForProcessing.length).to.eql(1);

            expect(setItemSpy.called).to.eq(true);
            expect(setItemSpy.getCall(0).lastArg).to.equal(
                JSON.stringify(expectedEvent)
            );

            expect(getItemSpy.called).to.eq(true);
            expect(getItemSpy.getCall(0).lastArg).to.equal(
                'mprtcl-v4_abcdef-events'
            );

            done();
            })
            .catch((e) => {
            });
        });

        it('should not use local storage when disabled', () => {
            window.mParticle.config.flags = {
                // offlineStorage: '0', // Defaults to 0, but test if not included, just in case
            };

            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(hasIdentifyReturned)
            .then( () => {

            const getItemSpy = sinon.spy(Storage.prototype, 'getItem');
            const setItemSpy = sinon.spy(Storage.prototype, 'setItem');

            const mpInstance = window.mParticle.getInstance();

            const uploader = new BatchUploader(mpInstance, 1000);

            const event: SDKEvent = {
                EventName: 'Test Event',
                EventAttributes: null,
                SourceMessageId: 'test-smid',
                EventDataType: 4,
                EventCategory: 1,
                ExpandedEventCount: 0,
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
            expect(uploader.eventsQueuedForProcessing[0]).to.eql(event);

            expect(setItemSpy.called).to.eq(false);
            expect(getItemSpy.called).to.eq(false);

            expect(
                window.localStorage.getItem('mprtcl-v4_abcdef-events')
            ).to.equal(null);
            })
            .catch((e) => {
            });
        });
    });

    describe('Offline Storage Disabled', () => {
        beforeEach(() => {
            window.mParticle.config.flags = {
                offlineStorage: '0',
                ...enableBatchingConfigFlags,
            };

            window.localStorage.clear();
        });

        afterEach(() => {
            window.localStorage.clear();
            fetchMock.restore();
        });

        it('should not save events or batches in local storage', done => {
            const eventStorageKey = 'mprtcl-v4_abcdef-events';
            const batchStorageKey = 'mprtcl-v4_abcdef-batches';

            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);

            waitForCondition(hasIdentifyReturned)
            .then(() => {
            const mpInstance = window.mParticle.getInstance();
            const uploader = mpInstance._APIClient.uploader;

            // Init will fire a Session Start and AST. We are adding event0
            // to show that manually queued events will also be grouped
            // into a batch
            uploader.queueEvent(event0);

            const eventQueue: SDKEvent[] = uploader.eventsQueuedForProcessing;

            expect(eventQueue.length).to.equal(3);

            expect(
                window.localStorage.getItem(eventStorageKey),
                'Local Storage Events should be empty'
            ).to.equal(null);

            const batchQueue: Batch[] = uploader.batchesQueuedForProcessing;

            // Manually initiate the upload process - turn event into batches and upload the batch
            window.mParticle.upload();

            expect(batchQueue.length).to.equal(2);

            expect(
                window.localStorage.getItem(batchStorageKey),
                'Local Storage Batches should be empty'
            ).to.equal(null);

            done();
            })
            .catch((e) => {
            });
        });
    });

    describe('Offline Storage Enabled', () => {
        beforeEach(() => {
            window.mParticle.config.flags = {
                offlineStorage: '100',
                ...enableBatchingConfigFlags,
            };

            fetchMock.restore();
            fetchMockSuccess(urls.identify, {
                mpid: testMPID,
                is_logged_in: false,
            });

            window.sessionStorage.clear();
            window.localStorage.clear();
        });

        afterEach(() => {
            sinon.restore();
            fetchMock.restore();
        });

        it('should store events in Session Storage in order of creation', done => {
            const eventStorageKey = 'mprtcl-v4_abcdef-events';

            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(hasIdentifyReturned)
            .then(() => {
            const mpInstance = window.mParticle.getInstance();
            const uploader = mpInstance._APIClient.uploader;

            // Init will fire a Session Start and AST. We are adding event0
            // to show that manually queued events will also be grouped
            // into a batch
            uploader.queueEvent(event0);

            const eventQueue: SDKEvent[] = uploader.eventsQueuedForProcessing;

            expect(eventQueue.length).to.equal(3);

            const storedEvents: SDKEvent[] = JSON.parse(
                window.sessionStorage.getItem(eventStorageKey)
            );

            expect(storedEvents.length, 'Local Storage Events').to.equal(3);

            expect(storedEvents[0], 'Local Storage: Session Start').to.eql(
                eventQueue[0]
            );
            expect(storedEvents[1], 'Local Storage: AST').to.eql(eventQueue[1]);
            expect(storedEvents[2], 'Local Storage: Test Event 0').to.eql(
                eventQueue[2]
            );

            done();
            })
            .catch((e) => {
        })

        });

        it('should purge events from Session Storage upon Batch Creation', async () => {
            const eventStorageKey = 'mprtcl-v4_abcdef-events';

            fetchMock.post(urls.events, 200);

            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(hasIdentifyReturned)
            .then(async () => {
            const mpInstance = window.mParticle.getInstance();
            const uploader = mpInstance._APIClient.uploader;

            // Init will fire a Session Start and AST. We are adding event0
            // to show that manually queued events will also be grouped
            // into a batch
            uploader.queueEvent(event0);

            expect(uploader.eventsQueuedForProcessing.length).to.equal(3);
            expect(uploader.batchesQueuedForProcessing.length).to.equal(0);

            expect(
                window.sessionStorage.getItem(eventStorageKey),
                'Queued Events should appear in Session Storage'
            ).to.be.ok;
            expect(
                JSON.parse(window.sessionStorage.getItem(eventStorageKey))
                    .length
            ).to.equal(3);

            // Manually initiate the upload process - turn event into batches and upload the batch
            await window.mParticle.getInstance()._APIClient.uploader.prepareAndUpload();

            // If Session Storage is purged, it should return an empty string
            expect(window.sessionStorage.getItem(eventStorageKey)).to.equal('');
            expect(uploader.eventsQueuedForProcessing.length).to.equal(0);

            // Batch Queue should be empty because batch successfully uploaded
            expect(uploader.batchesQueuedForProcessing.length).to.equal(0);
            clock.restore();
            // done();
            })
            .catch((e) => {
        })
        });

        it('should save batches in sequence to Local Storage when an HTTP 500 error is encountered', async () => {
            const batchStorageKey = 'mprtcl-v4_abcdef-batches';

            fetchMock.post(urls.events, 500);

            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(hasIdentifyReturned)
            .then(async() =>  {

            const mpInstance = window.mParticle.getInstance();
            const uploader = mpInstance._APIClient.uploader;

            // Init will fire a Session Start and AST. We are adding event0
            // to show that manually queued events will also be grouped
            // into a batch
            uploader.queueEvent(event0);

            // Manually initiate the upload process - turn event into batches and upload the batch
            await window.mParticle.getInstance()._APIClient.uploader.prepareAndUpload();

            expect(window.localStorage.getItem(batchStorageKey)).to.be.ok;

            const storedBatches: Batch[] = JSON.parse(
                window.localStorage.getItem(batchStorageKey)
            );

            // Note: Events are usually are groupd together into a single batch
            // However, in this case, since we are mocking a custom event (event0)
            // our batching logic is grouping event0 into a separate batch from
            // the Session Start + AST event from init as they have a different
            // SessionID
            expect(storedBatches.length).to.equal(2);
            expect(
                storedBatches[0].events[0].event_type,
                'Batch 1: Session Start'
            ).to.equal('session_start');
            expect(
                storedBatches[0].events[1].event_type,
                'Batch 1: AST'
            ).to.equal('application_state_transition');

            expect(
                storedBatches[1].events[0].event_type,
                'Batch 2: Custom Event Type'
            ).to.equal('custom_event');
            expect(
                (storedBatches[1].events[0].data as CustomEventData)
                    .event_name,
                'Batch 2: Custom Event Name'
            ).to.equal('Test Event 0');
            })
            .catch((e) => {
        })
        });

        it('should save batches in sequence to Local Storage when an HTTP 429 error is encountered', () => {
            const batchStorageKey = 'mprtcl-v4_abcdef-batches';

            fetchMock.post(urls.events, 429);

            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(hasIdentifyReturned)
            .then(async () => {
            const mpInstance = window.mParticle.getInstance();
            const uploader = mpInstance._APIClient.uploader;

            // Init will fire a Session Start and AST. We are adding event0
            // to show that manually queued events will also be grouped
            // into a batch
            uploader.queueEvent(event0);

            // Manually initiate the upload process - turn event into batches and upload the batch
            await window.mParticle.getInstance()._APIClient.uploader.prepareAndUpload();

            clock.restore();

            expect(window.localStorage.getItem(batchStorageKey)).to.be.ok;

            const storedBatches: Batch[] = JSON.parse(
                window.localStorage.getItem(batchStorageKey)
            );

            expect(storedBatches.length).to.equal(2);
            expect(
                storedBatches[0].events[0].event_type,
                'Batch 1: Session Start'
            ).to.equal('session_start');
            expect(
                storedBatches[0].events[1].event_type,
                'Batch 1: AST'
            ).to.equal('application_state_transition');

            expect(
                storedBatches[1].events[0].event_type,
                'Batch 2: Custom Event Type'
            ).to.equal('custom_event');
            expect(
                (storedBatches[1].events[0].data as CustomEventData)
                    .event_name,
                'Batch 2: Custom Event Name'
            ).to.equal('Test Event 0');
            })
            .catch((e) => {
        })
        });

        it('should NOT save any batches to Local Storage when an HTTP 401 error is encountered', (done) => {
            // When a 401 is encountered, we assume that the batch is bad so we clear those
            // batches from the Upload Queue. Therefore, there should not be anything in
            // Offline Storage afterwards
            const batchStorageKey = 'mprtcl-v4_abcdef-batches';

            fetchMock.post(urls.events, 401);

            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(hasIdentifyReturned)
            .then(async () => {
                const mpInstance = window.mParticle.getInstance();
            const uploader = mpInstance._APIClient.uploader;

            // Init will fire a Session Start and AST. We are adding event0
            // to show that manually queued events will also be grouped
            // into a batch
            uploader.queueEvent(event0);

            // Manually initiate the upload process - turn event into batches and upload the batch
            await window.mParticle.getInstance()._APIClient.uploader.prepareAndUpload();

            expect(window.localStorage.getItem(batchStorageKey)).to.equal(
                ''
            );
            done();
            })
            .catch((e) => {
        })
        });

        it('should save batches in sequence to Local Storage when upload is interrupted', async () => {
            // Interruption in this context means that the first upload is successful, but
            // the next upload in sequence is not. For example, on a mobile device on the
            // subway or if a connection is rate limited. In this case, we should save
            // batches in the order they were created for a future upload attempt

            const batchStorageKey = 'mprtcl-v4_abcdef-batches';

            // First upload is successful
            fetchMock.post(urls.events, 200, {
                overwriteRoutes: false,
                repeat: 1,
            });

            // Second upload is rate limited
            fetchMock.post(urls.events, 429, {
                overwriteRoutes: false,
            });
            // Set up SDK and Uploader
            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(hasIdentifyReturned)
            .then(async () => {
            const mpInstance = window.mParticle.getInstance();
            const uploader = mpInstance._APIClient.uploader;

            const batchValidator = new _BatchValidator();

            // Create sample batches for testing
            const batch1 = batchValidator.returnBatch([
                {
                    messageType: 4,
                    name: 'Test Event 1',
                },
                {
                    messageType: 4,
                    name: 'Test Event 2',
                },
            ]);

            const batch2 = batchValidator.returnBatch([
                {
                    messageType: 4,
                    name: 'Test Event 3',
                },
                {
                    messageType: 4,
                    name: 'Test Event 4',
                },
            ]);

            const batch3 = batchValidator.returnBatch([
                {
                    messageType: 4,
                    name: 'Test Event 5',
                },
                {
                    messageType: 4,
                    name: 'Test Event 6',
                },
            ]);

            // Init will generate a batch with Session Start and AST which normally comes first
            // but for testing purposes the Session Start + AST batches will be the last batches
            // as we are manually queueing additional batches to verify sequence
            uploader.batchesQueuedForProcessing.push(batch1);
            uploader.batchesQueuedForProcessing.push(batch2);
            uploader.batchesQueuedForProcessing.push(batch3);

            // Manually initiate the upload process
            // This will also turn the SessionStart + AST events into a batch and add it to the end of the queue
            await window.mParticle.getInstance()._APIClient.uploader.prepareAndUpload();

            expect(window.localStorage.getItem(batchStorageKey)).to.be.ok;

            const storedBatches: Batch[] = JSON.parse(
                window.localStorage.getItem(batchStorageKey)
            );

            // We tried to upload 4 batches (3 unique batches + Session Start/AST from init)
            expect(storedBatches.length).to.equal(3);

            // The following assertions should verify the sequence presented below
            // - Batch 1: Test Event 1 and 2 - Should have been uploaded - No Longer in Offline Storage
            // - Batch 2: Test Event 3 and 4 - Failed Upload - Saved to Offline Storage
            // - Batch 3: Test Event 5 and 6 - Upload suspended - Saved to Offline Storage
            // - Batch 4: Session Start and AST - Upload suspended - Saved to Offline Storage
            // Because Batch 2 failed to upload, subsequent Batches should be suspended until Batch 2 succeeds
            expect(
                storedBatches[0].events[0].event_type,
                'Batch 2: Test Event 3 Event Type'
            ).to.equal('custom_event');
            expect(
                (storedBatches[0].events[0].data as CustomEventData)
                    .event_name,
                'Batch 2: Test Event 3 Event Name'
            ).to.equal('Test Event 3');

            expect(
                storedBatches[0].events[1].event_type,
                'Batch 2: Test Event 4 Event Type'
            ).to.equal('custom_event');
            expect(
                (storedBatches[0].events[1].data as CustomEventData)
                    .event_name,
                'Batch 2: Test Event 4 Event Name'
            ).to.equal('Test Event 4');

            expect(
                storedBatches[1].events[0].event_type,
                'Batch 3: Test Event 5 Event Type'
            ).to.equal('custom_event');
            expect(
                (storedBatches[1].events[0].data as CustomEventData)
                    .event_name,
                'Batch 3: Test Event 5 Event Name'
            ).to.equal('Test Event 5');

            expect(
                storedBatches[1].events[1].event_type,
                'Batch 3: Test Event 6 Event Type'
            ).to.equal('custom_event');
            expect(
                (storedBatches[1].events[1].data as CustomEventData)
                    .event_name,
                'Batch 3: Test Event 6 Event Name'
            ).to.equal('Test Event 6');

            // These are the events that are generated by mParticle.init. Usually they
            // come before any queued events, but we manually queued the previous
            // batches increase the number of attempted uploads to verify that batches
            // are retained in Offline Storage in order of creation
            expect(
                storedBatches[2].events[0].event_type,
                'Batch 4: Session Start'
            ).to.equal('session_start');
            expect(
                storedBatches[2].events[1].event_type,
                'Batch 4: AST'
            ).to.equal('application_state_transition');
            })
            .catch((e) => {
            console.log('should save batches in sequence to Local Storage when upload is interrupted')
        })
        });

        it('should attempt to upload batches from Offline Storage before new batches', () => {
            // This test should verify that batches read from Offline Storage are prepended
            // to the upload queue before newly created batches.

            const batchStorageKey = 'mprtcl-v4_abcdef-batches';

            fetchMock.post(urls.events, 200);

            // Set up SDK and Uploader
            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(hasIdentifyReturned)
            .then(async () => {

            const mpInstance = window.mParticle.getInstance();
            const uploader = mpInstance._APIClient.uploader;

            const batchValidator = new _BatchValidator();

            // Create sample batches for testing
            const batch1 = batchValidator.returnBatch([
                {
                    messageType: 4,
                    name: 'Test Event 1',
                },
                {
                    messageType: 4,
                    name: 'Test Event 2',
                },
            ]);

            const batch2 = batchValidator.returnBatch([
                {
                    messageType: 4,
                    name: 'Test Event 3',
                },
                {
                    messageType: 4,
                    name: 'Test Event 4',
                },
            ]);

            const batch3 = batchValidator.returnBatch([
                {
                    messageType: 4,
                    name: 'Test Event 5',
                },
                {
                    messageType: 4,
                    name: 'Test Event 6',
                },
            ]);

            // Write batches to Offline Storage before queuing new events or batches
            window.localStorage.setItem(
                batchStorageKey,
                JSON.stringify([batch1, batch2, batch3])
            );

            // Batch Queue should be empty before we upload
            expect(uploader.batchesQueuedForProcessing.length).to.equal(0);

            // Manually initiate the upload process - turn event into batches and upload the batch
            await window.mParticle.getInstance()._APIClient.uploader.prepareAndUpload();

            expect(
                window.localStorage.getItem(batchStorageKey),
                'Offline Batch Storage should be empty'
            ).to.equal('');

            // To verify the sequence, we should look at what has been uploaded
            // as the upload queue and Offline Storage should be empty
            expect(fetchMock.calls().length).to.equal(4);

            const uploadedBatch1: Batch = JSON.parse(
                fetchMock.calls()[0][1].body as string
            );
            const uploadedBatch2: Batch = JSON.parse(
                fetchMock.calls()[1][1].body as string
            );
            const uploadedBatch3: Batch = JSON.parse(
                fetchMock.calls()[2][1].body as string
            );
            const uploadedBatch4: Batch = JSON.parse(
                fetchMock.calls()[3][1].body as string
            );

            // The following assertions should verify the sequence presented below
            // - Batch 1: Test Event 1 and 2 - Read from Offline Storage
            // - Batch 2: Test Event 3 and 4 - Read from Offline Storage
            // - Batch 3: Test Event 5 and 6 - Read from Offline Storage
            // - Batch 4: Session Start and AST - (new) Created by Init

            expect(
                (uploadedBatch1.events[0].data as CustomEventData)
                    .event_name,
                'Batch 1: Test Event 1 '
            ).to.equal('Test Event 1');
            expect(
                (uploadedBatch1.events[1].data as CustomEventData)
                    .event_name,
                'Batch 1: Test Event 2'
            ).to.equal('Test Event 2');

            expect(
                (uploadedBatch2.events[0].data as CustomEventData)
                    .event_name,
                'Batch 2: Test Event 3 Event Name'
            ).to.equal('Test Event 3');
            expect(
                (uploadedBatch2.events[1].data as CustomEventData)
                    .event_name,
                'Batch 2: Test Event 4 Event Name'
            ).to.equal('Test Event 4');

            expect(
                (uploadedBatch3.events[0].data as CustomEventData)
                    .event_name,
                'Batch 2: Test Event 5 Event Name'
            ).to.equal('Test Event 5');
            expect(
                (uploadedBatch3.events[1].data as CustomEventData)
                    .event_name,
                'Batch 2: Test Event 6 Event Name'
            ).to.equal('Test Event 6');

            // These are the events that are generated by mParticle.init. Usually they
            // come before any queued events, but we manually queued the previous
            // batches increase the number of attempted uploads to verify that batches
            // are retained in Offline Storage in order of creation
            expect(
                uploadedBatch4.events[0].event_type,
                'Batch 4: Session Start'
            ).to.equal('session_start');
            expect(
                uploadedBatch4.events[1].event_type,
                'Batch 4: AST'
            ).to.equal('application_state_transition');
        })
        .catch((e) => {
        })
        });
    });
});