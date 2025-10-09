import sinon from 'sinon';
import { urls, apiKey, MPConfig, testMPID } from './config/constants';
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

    describe('batching via window.fetch', () => {
        beforeEach(() => {
            fetchMock.post(urls.events, 200);
            fetchMock.config.overwriteRoutes = true;
            window.mParticle.config.flags.eventBatchingIntervalMillis = 1000;
        });

        afterEach(() => {
            fetchMock.restore();
            window.mParticle.config.flags.eventBatchingIntervalMillis = 0;
        });

        it('should use custom v3 endpoint', async () => {
            window.mParticle._resetForTests(MPConfig);
            fetchMock.resetHistory();
            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);
            
            window.mParticle.logEvent('Test Event');
            
            window.mParticle.upload();

            const lastCall = fetchMock.lastCall();
            const endpoint = lastCall[0];
            const batch = JSON.parse(fetchMock.lastCall()[1].body as string);

            endpoint.should.equal(urls.events);
            batch.events[0].event_type.should.equal('session_start');
            batch.events[1].event_type.should.equal('application_state_transition');
            batch.events[2].event_type.should.equal('custom_event');
            batch.events[2].data.event_name.should.equal('Test Event');
        });

        it('should have latitude/longitude for location when batching', async () => {
            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);
            
            window.mParticle.setPosition(100, 100);
            window.mParticle.logEvent('Test Event');
            window.mParticle.upload();
            const lastCall = fetchMock.lastCall();
            const endpoint = lastCall[0];
            const batch = JSON.parse(fetchMock.lastCall()[1].body as string);
            endpoint.should.equal(urls.events);
            batch.events[2].data.location.should.have.property('latitude', 100)
            batch.events[2].data.location.should.have.property('longitude', 100)
        });

        it('should force uploads when using public `upload`', async () => {
            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);
            
            window.mParticle.logEvent('Test Event');
            // Identity call
            // Session start, AST, and `Test Event` are queued.
            fetchMock.calls().length.should.equal(1);
            (fetchMock.lastCall()[0].endsWith('identify')).should.equal(true)
            
            // force upload, triggering window.fetch
            window.mParticle.upload();

            const lastCall = fetchMock.lastCall();
            const endpoint = lastCall[0];
            const batch = JSON.parse(fetchMock.lastCall()[1].body as string);

            endpoint.should.equal(urls.events);
            batch.events[0].event_type.should.equal('session_start');
            batch.events[1].event_type.should.equal('application_state_transition');
            batch.events[2].event_type.should.equal('custom_event');
            batch.events[2].data.event_name.should.equal('Test Event');
        });

        it('should force uploads when a commerce event is called', async () => {
            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);

            await waitForCondition(hasIdentifyReturned);
            
            window.mParticle.logEvent('Test Event');

            var product1 = window.mParticle.eCommerce.createProduct('iphone', 'iphoneSKU', 999);
            window.mParticle.eCommerce.logProductAction(ProductActionType.AddToCart, product1);

            const lastCall = fetchMock.lastCall();
            const endpoint = lastCall[0];
            const batch = JSON.parse(fetchMock.lastCall()[1].body as string);

            endpoint.should.equal(urls.events);
            batch.events[0].event_type.should.equal('session_start');
            batch.events[1].event_type.should.equal('application_state_transition');
            batch.events[2].event_type.should.equal('custom_event');
            batch.events[2].data.event_name.should.equal('Test Event');
            batch.events[3].event_type.should.equal('commerce_event');
            batch.events[3].data.product_action.action.should.equal('add_to_cart');
        });

        it('should return pending uploads if a 500 is returned', async function() {
            window.mParticle._resetForTests(MPConfig);

            fetchMock.post(urls.events, 500);
            
            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);

            window.mParticle.logEvent('Test Event');

            let pendingEvents = window.mParticle.getInstance()._APIClient.uploader.eventsQueuedForProcessing;

            pendingEvents.length.should.equal(3);
            pendingEvents[0].EventName.should.equal(1);
            pendingEvents[1].EventName.should.equal(10);
            pendingEvents[2].EventName.should.equal('Test Event');

            fetchMock.post(urls.events, 200);
            
            // First fetch call is an identify call
            (fetchMock.lastCall()[0].endsWith('identify')).should.equal(true);
            window.mParticle.upload();

            let nowPendingEvents = window.mParticle.getInstance()._APIClient.uploader.eventsQueuedForProcessing;
            nowPendingEvents.length.should.equal(0);

            const batch = JSON.parse(fetchMock.lastCall()[1].body as string);
            batch.events[0].event_type.should.equal('session_start');
            batch.events[1].event_type.should.equal('application_state_transition');
            batch.events[2].event_type.should.equal('custom_event');
            batch.events[2].data.event_name.should.equal('Test Event');
        });

        it('should send source_message_id with events to v3 endpoint', async () => {
            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);

            await waitForCondition(hasIdentifyReturned);
            
            window.mParticle.logEvent('Test Event');

            window.mParticle.upload();

            const lastCall = fetchMock.lastCall();
            const endpoint = lastCall[0];
            const batch = JSON.parse(fetchMock.lastCall()[1].body as string);

            endpoint.should.equal(urls.events);
            batch.events[0].data.should.have.property('source_message_id')
        });

        it('should send user-defined SourceMessageId events to v3 endpoint', async () => {
            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);
            
            window.mParticle.logBaseEvent({
                messageType: 4,
                name: 'Test Event',
                data: {key: 'value'},
                eventType: 3,
                customFlags: {flagKey: 'flagValue'},
                sourceMessageId: 'abcdefg'
            });

            window.mParticle.upload();

            const lastCall = fetchMock.lastCall();
            const endpoint = lastCall[0];
            const batch = JSON.parse(fetchMock.lastCall()[1].body as string);

            endpoint.should.equal(urls.events);
            // event batch includes session start, ast, then last event is Test Event
            batch.events[batch.events.length-1].data.should.have.property('source_message_id', 'abcdefg')
        });
        
        // http://go/j-SDKE-301
        it('should call the identity callback after a session ends if user is returning to the page after a long period of time', async () => {
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
            await waitForCondition(() => {
                return (
                    window.mParticle.getInstance()._Store?.identityCallInFlight === false
                );
            });
            
            // Mock end session so that the SDK doesn't actually send it. We do this
            // to mimic a return to page behavior, below:
            window.mParticle.getInstance()._SessionManager.endSession = function() {}
            clock = sinon.useFakeTimers({now: new Date().getTime()});

            // Force 35 minutes to pass, so that when we return to the page, when
            // the SDK initializes it will know to end the session.
            clock.tick(35*60000);

            // Undo mock of end session so that when we initializes, it will end
            // the session for real.
            window.mParticle.getInstance()._SessionManager.endSession = endSessionFunction;
            clock.restore();

            // Initialize imitates returning to the page
            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(() => {
                return (
                    window.mParticle.getInstance()?._Store?.identityCallInFlight === false
                );
            });
            
            // Manually initiate the upload process - turn event into batches and upload the batch 
            await window.mParticle.getInstance()._APIClient.uploader.prepareAndUpload();

            const batch1 = JSON.parse(fetchMock.calls()[0][1].body as string);
            const batch2 = JSON.parse(fetchMock.calls()[1][1].body as string);
            const batch3 = JSON.parse(fetchMock.calls()[2][1].body as string);

            // UAC, session start, AST
            expect(
                batch1.events.length,
                'Batch 1: UAC Event, Session Start, AST'
            ).to.equal(3);

            // session end
            expect(batch2.events.length, 'Batch 2: Session End').to.equal(
                1
            );

            // UAC, session start, AST
            expect(
                batch3.events.length,
                'Batch 3: UAC, Session Start, AST'
            ).to.equal(3);

            const batch1UAC = Utils.findEventFromBatch(
                batch1,
                'user_attribute_change'
            );
            const batch1SessionStart = Utils.findEventFromBatch(
                batch1,
                'session_start'
            );
            const batch1AST = Utils.findEventFromBatch(
                batch1,
                'application_state_transition'
            );

            batch1UAC.should.be.ok();
            batch1SessionStart.should.be.ok();
            batch1AST.should.be.ok();

            const batch2SessionEnd = Utils.findEventFromBatch(
                batch2,
                'session_end'
            );
            batch2SessionEnd.should.be.ok();

            const batch3UAC = Utils.findEventFromBatch(
                batch3,
                'user_attribute_change'
            );
            const batch3SessionStart = Utils.findEventFromBatch(
                batch3,
                'session_start'
            );
            const batch3AST = Utils.findEventFromBatch(
                batch3,
                'application_state_transition'
            );

            batch3UAC.should.be.ok();
            batch3SessionStart.should.be.ok();
            batch3AST.should.be.ok();


            (typeof batch1.source_request_id).should.equal('string');
            (typeof batch2.source_request_id).should.equal('string');
            (typeof batch3.source_request_id).should.equal('string');

            batch1.source_request_id.should.not.equal(
                batch2.source_request_id
            );
            batch1.source_request_id.should.not.equal(
                batch3.source_request_id
            );
            batch2.source_request_id.should.not.equal(
                batch3.source_request_id
            );

            batch1UAC.data.session_uuid.should.equal(
                batch1AST.data.session_uuid
            );
            batch1UAC.data.session_uuid.should.equal(
                batch1SessionStart.data.session_uuid
            );
            batch1UAC.data.session_uuid.should.not.equal(
                batch3UAC.data.session_uuid
            );
            batch1UAC.data.session_uuid.should.not.equal(
                batch3SessionStart.data.session_uuid
            );
            batch1UAC.data.session_uuid.should.not.equal(
                batch3AST.data.session_uuid
            );

            batch1UAC.data.session_start_unixtime_ms.should.equal(
                batch1AST.data.session_start_unixtime_ms
            );
            batch1UAC.data.session_start_unixtime_ms.should.equal(
                batch1SessionStart.data.session_start_unixtime_ms
            );
            batch1UAC.data.session_start_unixtime_ms.should.not.equal(
                batch3UAC.data.session_start_unixtime_ms
            );
            batch1UAC.data.session_start_unixtime_ms.should.not.equal(
                batch3SessionStart.data.session_start_unixtime_ms
            );
            batch1UAC.data.session_start_unixtime_ms.should.not.equal(
                batch3AST.data.session_start_unixtime_ms
            );

            batch1SessionStart.data.session_uuid.should.equal(
                batch1AST.data.session_uuid
            );
            batch1SessionStart.data.session_uuid.should.equal(
                batch2SessionEnd.data.session_uuid
            );
            batch1AST.data.session_uuid.should.equal(
                batch2SessionEnd.data.session_uuid
            );

            batch1SessionStart.data.session_start_unixtime_ms.should.equal(
                batch1AST.data.session_start_unixtime_ms
            );
            batch1SessionStart.data.session_start_unixtime_ms.should.equal(
                batch2SessionEnd.data.session_start_unixtime_ms
            );
            batch1AST.data.session_start_unixtime_ms.should.equal(
                batch2SessionEnd.data.session_start_unixtime_ms
            );

            batch3AST.data.session_uuid.should.equal(
                batch3UAC.data.session_uuid
            );
            batch3SessionStart.data.session_uuid.should.equal(
                batch3UAC.data.session_uuid
            );
            batch3SessionStart.data.session_uuid.should.equal(
                batch3AST.data.session_uuid
            );

            batch3AST.data.session_start_unixtime_ms.should.equal(
                batch3UAC.data.session_start_unixtime_ms
            );
            batch3SessionStart.data.session_start_unixtime_ms.should.equal(
                batch3UAC.data.session_start_unixtime_ms
            );
            batch3SessionStart.data.session_start_unixtime_ms.should.equal(
                batch3AST.data.session_start_unixtime_ms
            );
        });
    });
});