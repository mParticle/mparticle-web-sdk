import sinon from 'sinon';
import { urls, apiKey, MPConfig, testMPID } from './config/constants';
import { Batch, CustomEventData } from '@mparticle/event-models';
import Utils from './config/utils';
import { expect } from 'chai';
import _BatchValidator from '../../src/mockBatchCreator';
import fetchMock from 'fetch-mock/esm/client';
import { ProductActionType } from '../../src/types';
import { IMParticleInstanceManager } from '../../src/sdkRuntimeModels';
const { fetchMockSuccess, waitForCondition, hasIdentifyReturned  } = Utils;

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
    }
}

describe('batch uploader', () => {
    let mockServer;

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

    describe('batching via XHR for older browsers without window.fetch', () => {
        var fetch = window.fetch;

        beforeEach(() => {
            delete window.fetch
            window.mParticle.config.flags = {
                eventBatchingIntervalMillis: 1000,
            }
            mockServer = sinon.createFakeServer();
            mockServer.respondImmediately = true;

            mockServer.respondWith(urls.events, [
                200,
                {},
                JSON.stringify({ mpid: testMPID, Store: {}})
            ]);
            mockServer.respondWith(urls.identify, [
                200,
                {},
                JSON.stringify({ mpid: testMPID, is_logged_in: false }),
            ]);
        });
    
        afterEach(() => {
            window.mParticle._resetForTests(MPConfig);
            window.fetch = fetch;
            sinon.restore();
        });

        it('should use custom v3 endpoint', async () => {
            window.mParticle._resetForTests(MPConfig);
            mockServer.requests = [];
            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);
            window.mParticle.logEvent('Test Event');
            window.mParticle.upload()
            
            mockServer.requests.length.should.equal(3);
            // 1st request is /Identity call
            // 2nd request is /Event (session start and AST) call
            // 3rd request is /Event (custom event) call`

            const batch1 = JSON.parse(mockServer.secondRequest.requestBody);
            const batch2 = JSON.parse(mockServer.thirdRequest.requestBody);

            expect(batch1.events).to.have.length(2);
            expect(batch2.events).to.have.length(1);

            expect(batch1.events[0].event_type).to.equal('session_start');
            expect(batch1.events[1].event_type).to.equal('application_state_transition');

            expect(batch2.events[0].event_type).to.equal('custom_event');
            expect(batch2.events[0].data.event_name).to.equal('Test Event');
        });

        it('should force uploads when using public `upload`', async () => {
            window.mParticle._resetForTests(MPConfig);

            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);

            window.mParticle.logEvent('Test Event');
    
            // The only request to the server should be
            // 1. the identify call
            // 2. the session start and AST call (priority event)
            // Test Event should be queued.
            mockServer.requests.length.should.equal(2);
            
            const batch1 = JSON.parse(mockServer.secondRequest.requestBody);
            expect(batch1.events[0].event_type).to.equal('session_start');
            expect(batch1.events[1].event_type).to.equal('application_state_transition');

            // Force manual upload
            window.mParticle.upload();

            const batch2 = JSON.parse(mockServer.thirdRequest.requestBody);

            expect(batch2.events[0].event_type).to.equal('custom_event');
            expect(batch2.events[0].data.event_name).to.equal('Test Event');
        });
 
        it('should trigger an upload of batch when an appliication state transition event is called', async () => {
            window.mParticle._resetForTests(MPConfig);
            
            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);

            window.mParticle.logEvent('Test Event');

            // The only request to the server should be
            // 1. the identify call
            // 2. the session start and AST call (priority event)
            // Test Event should be queued.
            mockServer.requests.length.should.equal(2);
 
            const batch1 = JSON.parse(mockServer.secondRequest.requestBody);
            expect(batch1.events[0].event_type).to.equal('session_start');
            expect(batch1.events[1].event_type).to.equal('application_state_transition');
        });

        it('should trigger an upload of batch when a commerce event is called', async () => {
            window.mParticle._resetForTests(MPConfig);

            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned)

            window.mParticle.logEvent('Test Event');
            // The only request to the server should be
            // 1. the identify call
            // 2. the session start and AST call (priority event)
            // Test Event should be queued.
            mockServer.requests.length.should.equal(2);

            var product1 = window.mParticle.eCommerce.createProduct('iphone', 'iphoneSKU', 999);
            window.mParticle.eCommerce.logProductAction(ProductActionType.AddToCart, product1);
            // 1st request is /Identity call, 2nd request is /Event call

            const batch1 = JSON.parse(mockServer.secondRequest.requestBody);
            const batch2 = JSON.parse(mockServer.thirdRequest.requestBody);

            expect(batch1.events[0].event_type).to.equal('session_start');
            expect(batch1.events[1].event_type).to.equal('application_state_transition');

            expect(batch2.events[0].event_type).to.equal('custom_event');
            expect(batch2.events[0].data.event_name).to.equal('Test Event');
            expect(batch2.events[1].event_type).to.equal('commerce_event');
            expect(batch2.events[1].data.product_action.action).to.equal('add_to_cart');
        });

        it('should trigger an upload of batch when a UIC occurs', async () => {
            window.mParticle._resetForTests(MPConfig);
            // include an identify request so that it creates a UIC
            window.mParticle.config.identifyRequest = {
                userIdentities: {
                    customerid: 'foo-customer-id'
                }
            };

            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);

            window.mParticle.logEvent('Test Event');

            // Requests sent should be
            // 1. the identify call
            // 2. the session start and AST call (priority event)
            // 3. the UIC event
            // Test Event should be queued.
            expect(mockServer.requests.length).to.equal(3);

            // 1st request is /Identity call, 2nd request is events call
            const batch1 = JSON.parse(mockServer.secondRequest.requestBody);
            const batch2 = JSON.parse(mockServer.thirdRequest.requestBody);

            expect(batch1.events[0].event_type).to.equal('session_start');
            expect(batch1.events[1].event_type).to.equal('application_state_transition');
 
            expect(batch2.events[0].event_type).to.equal('user_identity_change');

            // Test Event should be queued, not uploaded
            expect(batch2.events.length).to.equal(1);
        });

        it('should return pending uploads if a 500 is returned', async () => {
            window.mParticle._resetForTests(MPConfig);

            mockServer.respondWith(urls.events, [
                500,
                {},
                JSON.stringify({ mpid: testMPID, Store: {}})
            ]);

            window.mParticle.init(apiKey, window.mParticle.config);

            await waitForCondition(hasIdentifyReturned);

            window.mParticle.logEvent('Test Event');

            const pendingEvents = window.mParticle.getInstance()._APIClient.uploader.eventsQueuedForProcessing;

            expect(pendingEvents.length).to.equal(1)
            expect(pendingEvents[0].EventName).to.equal('Test Event');

            window.mParticle.upload();

            const nowPendingEvents = window.mParticle.getInstance()._APIClient.uploader.eventsQueuedForProcessing;
            expect(nowPendingEvents.length).to.equal(0);

            const batch = JSON.parse(mockServer.lastRequest.requestBody);
            batch.events[0].event_type.should.equal('session_start');
            batch.events[1].event_type.should.equal('application_state_transition');
        });

        it('should add a modified boolean of true to a batch that has been modified via a config.onCreateBatch call', async () => {
            window.mParticle._resetForTests(MPConfig);

            window.mParticle.config.onCreateBatch = function (batch: Batch) {
                return batch
            };

            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);
            window.mParticle.logEvent('Test Event');
            
            window.mParticle.upload()
            
            const batch = JSON.parse(mockServer.secondRequest.requestBody);
            batch.modified.should.equal(true);

        });

        it('should respect rules for the batch modification', async () => {
            window.mParticle._resetForTests(MPConfig);

            window.mParticle.config.onCreateBatch = function (batch) {
                batch.events.map(event => {
                    if (event.event_type === "custom_event") {
                        (event.data as CustomEventData).event_name = 'Modified!'
                    }
                });
                return batch;
            };

            window.mParticle.init(apiKey, window.mParticle.config);

            await waitForCondition(hasIdentifyReturned);
            window.mParticle.logEvent('Test Event');
            
            window.mParticle.upload();

            const batch1 = JSON.parse(mockServer.secondRequest.requestBody);
            const batch2 = JSON.parse(mockServer.thirdRequest.requestBody);

            batch1.events.length.should.equal(2);
            batch2.events.length.should.equal(1);

            batch1.events[0].event_type.should.equal('session_start');
            batch1.events[1].event_type.should.equal('application_state_transition');

            batch2.events[0].event_type.should.equal('custom_event');
            batch2.events[0].data.event_name.should.equal('Modified!');
        });

        it('should add a modified boolean of true to a batch that has been modified via a config.onCreateBatch call', async () => {
            window.mParticle._resetForTests(MPConfig);

            window.mParticle.config.onCreateBatch = function (batch: Batch) {
                return undefined;
            };

            window.mParticle.init(apiKey, window.mParticle.config);

            await waitForCondition(hasIdentifyReturned);
            window.mParticle.logEvent('Test Event');
            
            window.mParticle.upload();
            
            // Should only have one request, the identify call
            expect(mockServer.requests.length).to.equal(1);

            expect(mockServer.secondRequest).to.be.null;
            expect(mockServer.thirdRequest).to.be.null;
        });
    });
});