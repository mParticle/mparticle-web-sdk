import sinon from 'sinon';
import { urls, apiKey, MPConfig, testMPID } from './config/constants';
import {
    IMParticleInstanceManager,
    SDKProduct,
} from '../../src/sdkRuntimeModels';
import Utils from './config/utils';
import { expect } from 'chai';
import _BatchValidator from '../../src/mockBatchCreator';
import fetchMock from 'fetch-mock/esm/client';
import { ProductActionType } from '../../src/types';
const { fetchMockSuccess, waitForCondition, hasIdentifyReturned } = Utils;

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
    }
}

describe.only('Quick Batch', () => {
    let clock;
    let beaconSpy;

    beforeEach(() => {
        fetchMock.restore();
        fetchMock.config.overwriteRoutes = true;
        fetchMockSuccess(urls.identify, {
            mpid: testMPID,
            is_logged_in: false,
        });
        fetchMock.post(urls.events, 200);

        clock = sinon.useFakeTimers({
            now: new Date().getTime(),
            shouldAdvanceTime: true,
        });

        beaconSpy = sinon.spy(navigator, 'sendBeacon');
    });

    afterEach(() => {
        window.localStorage.clear();
        fetchMock.restore();
        clock.restore();
        sinon.restore();
    });

    describe('Feature Flag Configuration', () => {
        it('should respect quickBatch feature flag enabled/disabled');
        it('should use configured quickBatchIntervalMillis');
        it('should fall back to default interval when not configured');
    });

    describe('Timer Behavior', () => {
        it('should fire quick batch after configured delay', async () => {
            window.mParticle._resetForTests(MPConfig);
            fetchMock.resetHistory();

            window.mParticle.config.flags = {
                quickBatchIntervalMillis: 2000,
                eventBatchingIntervalMillis: 5000,
            };

            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned)
            
            window.mParticle.logEvent('Test Event');
            
            let uploads = fetchMock.calls(urls.events);
            expect(uploads.length, 'No uploads should have been made yet').to.equal(0);

            // Advance time by a second to ensure the quick batch has NOT been fired yet
            clock.tick(1000);
            
            // First call should be the identify call, but should not have any events
            expect(fetchMock.calls().length, 'Identify call should have been made').to.equal(1);
            const firstCall = JSON.parse(fetchMock.calls()[0][1].body as string);
            // console.log('firstCall:', firstCall);
            expect(firstCall, 'First call should be to identify').to.have.property('known_identities');

            
            // Advance time by the configured quick batch delay to ensure the quick batch has been fired
            clock.tick(2000);

            console.log('t-2000 fetchMock.calls:', fetchMock.calls());

            
            // Second call should now have an AST, Session Start and the test event
            expect(fetchMock.calls().length, 'Quick Batch should have fired').to.equal(2);
            const batch = JSON.parse(fetchMock.calls()[1][1].body as string);
            expect(batch).to.have.property('events');
            
            expect(batch.events.length).to.equal(3);
            
            // Verify the uploaded batch contains our test event
            expect(batch.events[2].event_type).to.equal('custom_event');
            expect(batch.events[2].data.event_name).to.equal('Test Event');
        });
        
        it('should only fire once per BatchUploader instance', async () => {
            window.mParticle._resetForTests(MPConfig);
            fetchMock.resetHistory();

            window.mParticle.config.flags = {
                quickBatchIntervalMillis: 1000,
                eventBatchingIntervalMillis: 5000,
            };

            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned)
            
            window.mParticle.logEvent('Test Event');
            
            // Verify no uploads yet
            let uploads = fetchMock.calls(urls.events);
            expect(uploads.length, 'No uploads should have been made yet').to.equal(0);

            // Wait for quick batch to fire (1000ms)
            clock.tick(1000);
            
            // Should have identify call + quick batch call
            expect(fetchMock.calls().length, 'Quick batch should have fired').to.equal(2);
            const quickBatchCall = JSON.parse(fetchMock.calls()[1][1].body as string);
            expect(quickBatchCall).to.have.property('events');
            expect(quickBatchCall.events.length).to.equal(3); // AST, Session Start, Test Event

            // Wait another 2 seconds (total 3000ms) - should NOT trigger another quick batch
            clock.tick(2000);
            
            // Should still only have 2 calls (identify + quick batch)
            expect(fetchMock.calls().length, 'No additional quick batch should have fired').to.equal(2);

            // Add another event to test regular batch functionality
            window.mParticle.logEvent('Second Event');

            // Wait for regular batch interval to fire (total 5000ms)
            clock.tick(5000);
            
            // Should now have 3 calls (identify + quick batch + regular batch)
            expect(fetchMock.calls().length, 'Regular batch should have fired').to.equal(3);
            
            const regularBatchCall = JSON.parse(fetchMock.calls()[2][1].body as string);
            expect(regularBatchCall).to.have.property('events');
            expect(regularBatchCall.events.length).to.equal(1);
            expect(regularBatchCall.events[0].event_type).to.equal('custom_event');
            expect(regularBatchCall.events[0].data.event_name).to.equal('Second Event');
        });

        it('should NOT fire when uploadInterval is less than quickBatchInterval', async () => {
            window.mParticle._resetForTests(MPConfig);
            fetchMock.resetHistory();

            window.mParticle.config.flags = {
                quickBatchIntervalMillis: 5000,
                eventBatchingIntervalMillis: 3000,
            };

            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned)
            
            window.mParticle.logEvent('Test Event');
            
            // Verify no uploads yet
            let uploads = fetchMock.calls(urls.events);
            expect(uploads.length, 'No uploads should have been made yet').to.equal(0);

            // Wait for regular batch to fire (3000ms) - should fire before quick batch
            clock.tick(3000);
            
            // Should have identify call + regular batch call (no quick batch)
            expect(fetchMock.calls().length, 'Regular batch should have fired').to.equal(2);
            const regularBatchCall = JSON.parse(fetchMock.calls()[1][1].body as string);
           
            console.log('regularBatchCall:', regularBatchCall.events.map(event => event.data.event_name));

            expect(regularBatchCall).to.have.property('events');
            expect(regularBatchCall.events.length).to.equal(3);
            expect(regularBatchCall.events[0].event_type).to.equal('session_start');
            expect(regularBatchCall.events[1].event_type).to.equal('application_state_transition');
            expect(regularBatchCall.events[2].event_type).to.equal('custom_event');
            expect(regularBatchCall.events[2].data.event_name).to.equal('Test Event');

           
            // Log another event to confirm it is not fired during the quick batch
            window.mParticle.logEvent('Second Event');

            // Wait longer than quick batch interval (5000ms total) - should still only have 2 calls
            clock.tick(5000);
            
            // Should still only have 2 calls (identify + regular batch, no quick batch)
            expect(fetchMock.calls().length, 'Quick batch should not have fired again').to.equal(2);
        });
    });

    describe('AST Event Integration', () => {
        it('should include AST event in quick batch when astBackgroundEvents enabled', async () => {
            window.mParticle._resetForTests(MPConfig);
            fetchMock.resetHistory();

            window.mParticle.config.flags = {
                quickBatchIntervalMillis: 2000,
                eventBatchingIntervalMillis: 5000,
                astBackgroundEvents: 'True',
            };

            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned)
            
            window.mParticle.logEvent('Test Event');
            
            // Verify no uploads yet
            let uploads = fetchMock.calls(urls.events);
            expect(uploads.length, 'No uploads should have been made yet').to.equal(0);

            // Wait for quick batch to fire (2000ms)
            clock.tick(2000);
            
            // Should have identify call + quick batch call
            expect(fetchMock.calls().length, 'Quick batch should have fired').to.equal(2);
            const quickBatchCall = JSON.parse(fetchMock.calls()[1][1].body as string);
            expect(quickBatchCall).to.have.property('events');
            
            // console.log('quickBatchCall:', quickBatchCall.events.map(event => event.event_type));

            // Should have 4 events: AST Background, Session Start, Application State Transition, Test Event
            expect(quickBatchCall.events.length).to.equal(4);
            
            const batch1 = quickBatchCall.events[0];
            const batch2 = quickBatchCall.events[1];
            const batch3 = quickBatchCall.events[2];
            const batch4 = quickBatchCall.events[3];
            
            console.log('batch1:', batch1);
            console.log('batch2:', batch2);
            console.log('batch3:', batch3);
            console.log('batch4:', batch4);
            
            // Verify Session Start is included
            expect(batch1.event_type).to.equal('session_start');
            
            // Verify Application State Transition is included
            expect(batch2.event_type).to.equal('application_state_transition');
            expect(batch2.data.application_transition_type).to.equal('application_initialized');
            
            // Verify Test Event is included
            expect(batch3.event_type).to.equal('custom_event');
            expect(batch3.data.event_name).to.equal('Test Event');

            // Verify AST Background event is the last event
            expect(batch4.event_type).to.equal('application_state_transition');
            expect(batch4.data.application_transition_type).to.equal('application_background');
            
        });

        it('should not include AST event when astBackgroundEvents disabled', async () => {
            window.mParticle._resetForTests(MPConfig);
            fetchMock.resetHistory();

            window.mParticle.config.flags = {
                quickBatchIntervalMillis: 2000,
                eventBatchingIntervalMillis: 5000,
                astBackgroundEvents: 'False',
            };

            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned)
            
            window.mParticle.logEvent('Test Event');
            
            // Verify no uploads yet
            let uploads = fetchMock.calls(urls.events);
            expect(uploads.length, 'No uploads should have been made yet').to.equal(0);

            // Wait for quick batch to fire (2000ms)
            clock.tick(2000);
            
            // Should have identify call + quick batch call
            expect(fetchMock.calls().length, 'Quick batch should have fired').to.equal(2);
            const quickBatchCall = JSON.parse(fetchMock.calls()[1][1].body as string);
            expect(quickBatchCall).to.have.property('events');
            
            // Should have 3 events: Session Start, Application State Transition, Test Event
            expect(quickBatchCall.events.length).to.equal(3);

            const batch1 = quickBatchCall.events[0];
            const batch2 = quickBatchCall.events[1];
            const batch3 = quickBatchCall.events[2];
            
            console.log('batch1:', batch1);
            console.log('batch2:', batch2);
            console.log('batch3:', batch3);
            
            // Verify Session Start is included
            expect(batch1.event_type).to.equal('session_start');
            
            // Verify Application State Transition is included
            expect(batch2.event_type).to.equal('application_state_transition');
            expect(batch2.data.application_transition_type).to.equal('application_initialized');
            
            // Verify Test Event is included
            expect(batch3.event_type).to.equal('custom_event');
            expect(batch3.data.event_name).to.equal('Test Event');

            // Verify AST Background event is not included
            expect(quickBatchCall.events.find(event => event.event_type === 'application_state_transition' && event.data.application_transition_type === 'application_background')).to.be.undefined;
        });
    });

    describe('Priority Event Interaction', () => {
        it.only('should fire quick batch independently of priority event when Commerce event triggers during quick batch window', async () => {
            window.mParticle._resetForTests(MPConfig);
            fetchMock.resetHistory();

            window.mParticle.config.flags = {
                quickBatchIntervalMillis: 2000,
                eventBatchingIntervalMillis: 5000,
                astBackgroundEvents: 'True',
            };

            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned)
            
            window.mParticle.logEvent('Test Event');
            
            // Verify no uploads yet
            let uploads = fetchMock.calls(urls.events);
            expect(uploads.length, 'No uploads should have been made yet').to.equal(0);

            // Trigger Commerce event (priority event) during quick batch window
            const product: SDKProduct = window.mParticle.eCommerce.createProduct('Test Product', 'test-sku', 100);
            window.mParticle.eCommerce.logProductAction(
                ProductActionType.Purchase,
                product,
                null, // attrs
                null, // customFlags
                {
                    Id: 'test-transaction',
                    Revenue: 100,
                }
            );
            
            // Should have identify call + priority batch call (Commerce event triggered immediate upload)
            expect(fetchMock.calls().length, 'Priority batch should have fired').to.equal(2);
            const priorityBatchCall = JSON.parse(fetchMock.calls()[1][1].body as string);
            expect(priorityBatchCall).to.have.property('events');
            
            console.log('priorityBatchCall:', priorityBatchCall.events.map(event => event.event_type));
            
            // Should have multiple events including AST Background event
            expect(priorityBatchCall.events.length).to.equal(4);
            
            const batch1 = priorityBatchCall.events[0];
            const batch2 = priorityBatchCall.events[1];
            const batch3 = priorityBatchCall.events[2];
            const batch4 = priorityBatchCall.events[3];
            
            // Verify Session Start is included
            expect(batch1.event_type).to.equal('session_start');
            
            // Verify Application State Transition is included
            expect(batch2.event_type).to.equal('application_state_transition');
            expect(batch2.data.application_transition_type).to.equal('application_initialized');
            
            // Verify Test Event is included
            expect(batch3.event_type).to.equal('custom_event');
            expect(batch3.data.event_name).to.equal('Test Event');
            
            // Verify Purchase Event is included
            expect(batch4.event_type).to.equal('commerce_event');
            expect(batch4.data).to.have.property('product_action');
            
            // Verify AST Background event is NOT included in priority batch
            const astBackgroundEvent = priorityBatchCall.events.find(event => 
                event.event_type === 'application_state_transition' && 
                event.data.application_transition_type === 'application_background'
            );
            expect(astBackgroundEvent, 'AST Background event should NOT be included in priority batch').to.be.undefined;
            
            // Wait 2 seconds (within quick batch window)
            clock.tick(2000);

            // Should have identify call + quick batch call
            expect(fetchMock.calls().length, 'Quick batch should have fired after priority event').to.equal(3);
            
            // Verify AST Background event is included in quick batch
            const quickBatchCall = JSON.parse(fetchMock.calls()[2][1].body as string);
            expect(quickBatchCall).to.have.property('events');
            expect(quickBatchCall.events.length).to.equal(1);
            
            expect(quickBatchCall.events[0].event_type).to.equal('application_state_transition');
            expect(quickBatchCall.events[0].data.application_transition_type).to.equal('application_background');
        });

        it('should fire quick batch independently of priority event when UserIdentityChange triggers during quick batch window');
        it('should clear quick batch timer after priority event injection');
        it('should not duplicate AST events in subsequent batches');
    });

    describe('Background State Handling', () => {
        it('should clear quick batch timer on visibilitychange to hidden');
        it('should clear quick batch timer on beforeunload');
        it('should clear quick batch timer on pagehide');
        it('should not execute quick batch after timer cleared by background event');
    });

    describe('Error Handling', () => {
        it('should handle quick batch upload failures gracefully');
        it('should continue normal batch processing after quick batch failure');
        it('should handle invalid configuration gracefully');
    });
});