import sinon from 'sinon';
import { urls, apiKey, MPConfig, testMPID } from './config/constants';
import { Batch, CustomEventData } from '@mparticle/event-models';
import Utils from './config/utils';
import { expect } from 'chai';
import _BatchValidator from '../../src/mockBatchCreator';
import fetchMock from 'fetch-mock/esm/client';
import { ProductActionType } from '../../src/types';
import { IMParticleInstanceManager } from '../../src/sdkRuntimeModels';
const { fetchMockSuccess, waitForCondition, hasIdentifyReturned } = Utils;

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
        const fetch = window.fetch;

        beforeEach(() => {
            delete window.fetch;
            window.mParticle.config.flags = {
                eventBatchingIntervalMillis: 1000,
            };
            mockServer = sinon.createFakeServer();
            mockServer.respondImmediately = true;

            mockServer.respondWith(urls.events, [
                200,
                {},
                JSON.stringify({ mpid: testMPID, Store: {} }),
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

        it('should use custom v3 endpoint', function (done) {
            window.mParticle._resetForTests(MPConfig);
            mockServer.requests = [];
            window.mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(hasIdentifyReturned)
                .then(() => {
                    window.mParticle.logEvent('Test Event');

                    mockServer.requests.length.should.equal(1);
                    window.mParticle.upload();
                    // 1st request is /Identity call, 2nd request is /Event call

                    const batch = JSON.parse(
                        mockServer.secondRequest.requestBody,
                    );

                    batch.events[0].event_type.should.equal('session_start');
                    batch.events[1].event_type.should.equal(
                        'application_state_transition',
                    );
                    batch.events[2].event_type.should.equal('custom_event');
                    batch.events[2].data.event_name.should.equal('Test Event');

                    done();
                })
                .catch((e) => {});
        });

        it('should force uploads when using public `upload`', function (done) {
            window.mParticle._resetForTests(MPConfig);

            window.mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(hasIdentifyReturned).then(() => {
                window.mParticle.logEvent('Test Event');

                // The only request to the server should be the identify call
                // Session start, AST, and Test Event are queued.
                mockServer.requests.length.should.equal(1);
                // Upload interval hit, now will send requests

                window.mParticle.upload();
                // 1st request is /Identity call, 2nd request is /Event call
                const batch = JSON.parse(mockServer.secondRequest.requestBody);

                batch.events[0].event_type.should.equal('session_start');
                batch.events[1].event_type.should.equal(
                    'application_state_transition',
                );
                batch.events[2].event_type.should.equal('custom_event');
                batch.events[2].data.event_name.should.equal('Test Event');

                done();
            });
        });

        it('should trigger an upload of batch when a commerce event is called', function (done) {
            window.mParticle._resetForTests(MPConfig);

            window.mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(hasIdentifyReturned).then(() => {
                window.mParticle.logEvent('Test Event');
                // The only request to the server should be the identify call
                // Session start, AST, and Test Event are queued.
                mockServer.requests.length.should.equal(1);

                const product1 = window.mParticle.eCommerce.createProduct(
                    'iphone',
                    'iphoneSKU',
                    999,
                );
                window.mParticle.eCommerce.logProductAction(
                    ProductActionType.AddToCart,
                    product1,
                );
                // 1st request is /Identity call, 2nd request is /Event call
                const batch = JSON.parse(mockServer.secondRequest.requestBody);

                batch.events[0].event_type.should.equal('session_start');
                batch.events[1].event_type.should.equal(
                    'application_state_transition',
                );
                batch.events[2].event_type.should.equal('custom_event');
                batch.events[2].data.event_name.should.equal('Test Event');
                batch.events[3].event_type.should.equal('commerce_event');
                batch.events[3].data.product_action.action.should.equal(
                    'add_to_cart',
                );

                done();
            });
        });

        it('should trigger an upload of batch when a UIC occurs', function (done) {
            window.mParticle._resetForTests(MPConfig);
            // include an identify request so that it creates a UIC
            window.mParticle.config.identifyRequest = {
                userIdentities: {
                    customerid: 'foo-customer-id',
                },
            };

            window.mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(hasIdentifyReturned).then(() => {
                // Requests sent should be identify call, then UIC event
                // Session start, AST, and Test Event are queued, and don't appear
                // in the mockServer.requests
                mockServer.requests.length.should.equal(2);

                // 1st request is /Identity call, 2nd request is events call
                const batch = JSON.parse(mockServer.secondRequest.requestBody);

                batch.events[2].event_type.should.equal('user_identity_change');

                batch.events[0].event_type.should.equal('session_start');
                batch.events[1].event_type.should.equal(
                    'application_state_transition',
                );

                done();
            });
        });

        // Originally, we had the Batch uploader set to force an upload when a UAC event
        // was triggered. This feature was removed and we are including this test to
        // make sure the Web SDK does not regress. This test will be removed in a future
        // Web SDK update
        // TODO: https://go.mparticle.com/work/SQDSDKS-5891
        it('should NOT trigger an upload of batch when a UAC occurs', function (done) {
            window.mParticle._resetForTests(MPConfig);

            window.mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(hasIdentifyReturned).then(() => {
                // Set a user attribute to trigger a UAC event
                window.mParticle.Identity.getCurrentUser().setUserAttribute(
                    'age',
                    25,
                );

                // Requests sent should be identify call
                // Since we no longer force an upload for UAC,
                // This request will contain a /Identity Call
                // a future request will contain session start, AST, and UAC
                mockServer.requests.length.should.equal(1);

                // Verifies that adding a UAC does not trigger an upload
                expect(mockServer.secondRequest).to.equal(null);

                // Manually force an upload
                window.mParticle.upload();

                // Second request has now been made
                expect(mockServer.secondRequest).to.be.ok;

                const batch = JSON.parse(mockServer.secondRequest.requestBody);

                // Batch should now contain the 3 events we expect
                mockServer.requests.length.should.equal(2);
                batch.events[0].event_type.should.equal('session_start');
                batch.events[1].event_type.should.equal(
                    'application_state_transition',
                );
                batch.events[2].event_type.should.equal(
                    'user_attribute_change',
                );

                done();
            });
        });

        it('should return pending uploads if a 500 is returned', function (done) {
            window.mParticle._resetForTests(MPConfig);

            mockServer.respondWith(urls.events, [
                500,
                {},
                JSON.stringify({ mpid: testMPID, Store: {} }),
            ]);

            window.mParticle.init(apiKey, window.mParticle.config);

            waitForCondition(hasIdentifyReturned).then(() => {
                window.mParticle.logEvent('Test Event');

                const pendingEvents =
                    window.mParticle.getInstance()._APIClient.uploader
                        .eventsQueuedForProcessing;

                pendingEvents.length.should.equal(3);
                pendingEvents[0].EventName.should.equal(1);
                pendingEvents[1].EventName.should.equal(10);
                pendingEvents[2].EventName.should.equal('Test Event');

                window.mParticle.upload();

                const nowPendingEvents =
                    window.mParticle.getInstance()._APIClient.uploader
                        .eventsQueuedForProcessing;
                nowPendingEvents.length.should.equal(0);

                const batch = JSON.parse(mockServer.secondRequest.requestBody);
                batch.events[0].event_type.should.equal('session_start');
                batch.events[1].event_type.should.equal(
                    'application_state_transition',
                );
                batch.events[2].event_type.should.equal('custom_event');
                batch.events[2].data.event_name.should.equal('Test Event');
                done();
            });
        });

        it('should add a modified boolean of true to a batch that has been modified via a config.onCreateBatch call', function (done) {
            window.mParticle._resetForTests(MPConfig);

            window.mParticle.config.onCreateBatch = function (batch: Batch) {
                return batch;
            };

            window.mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(hasIdentifyReturned).then(() => {
                window.mParticle.logEvent('Test Event');

                window.mParticle.upload();

                const batch = JSON.parse(mockServer.secondRequest.requestBody);
                batch.modified.should.equal(true);
                done();
            });
        });

        it('should respect rules for the batch modification', function (done) {
            window.mParticle._resetForTests(MPConfig);

            window.mParticle.config.onCreateBatch = function (batch) {
                batch.events.map((event) => {
                    if (event.event_type === 'custom_event') {
                        (event.data as CustomEventData).event_name =
                            'Modified!';
                    }
                });
                return batch;
            };

            window.mParticle.init(apiKey, window.mParticle.config);

            waitForCondition(hasIdentifyReturned).then(() => {
                window.mParticle.logEvent('Test Event');

                window.mParticle.upload();

                const batch = JSON.parse(mockServer.secondRequest.requestBody);
                batch.events.length.should.equal(3);
                batch.events[0].event_type.should.equal('session_start');
                batch.events[1].event_type.should.equal(
                    'application_state_transition',
                );
                batch.events[2].event_type.should.equal('custom_event');
                batch.events[2].data.event_name.should.equal('Modified!');
                done();
            });
        });

        it('should add a modified boolean of true to a batch that has been modified via a config.onCreateBatch call', function (done) {
            window.mParticle._resetForTests(MPConfig);

            window.mParticle.config.onCreateBatch = function (batch: Batch) {
                return undefined;
            };

            window.mParticle.init(apiKey, window.mParticle.config);

            waitForCondition(hasIdentifyReturned).then(() => {
                window.mParticle.logEvent('Test Event');

                window.mParticle.upload();

                (mockServer.secondRequest === null).should.equal(true);
                done();
            });
        });
    });
});
