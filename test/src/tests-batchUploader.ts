import sinon from 'sinon';
import { urls } from './config';
import { apiKey, MPConfig, testMPID } from './config';
import { BatchUploader } from  '../../src/batchUploader';
import { MParticleWebSDK, SDKEvent, SDKProductActionType } from  '../../src/sdkRuntimeModels';
import Utils from './utils';

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        // beforeunload: any;
        fetchMock: any;
    }
}

describe('batch uploader', () => {
    var mockServer,
        clock

    beforeEach(function() {
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
    });
    
    afterEach(function() {
        mockServer.reset();
    });
    
    describe('batching via window.fetch', () => {
        beforeEach(function() {
            window.fetchMock.post(urls.eventsV3, 200);
            window.fetchMock.config.overwriteRoutes = true;
            clock = sinon.useFakeTimers({now: new Date().getTime()});

            window.mParticle.config.flags = {
                eventsV3: '100',
                eventBatchingIntervalMillis: 1000,
            }
        });

        afterEach(function() {
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

            let pendingEvents = window.mParticle.getInstance()._APIClient.uploader.pendingEvents

            pendingEvents.length.should.equal(3)
            pendingEvents[0].EventName.should.equal(1);
            pendingEvents[1].EventName.should.equal(10);
            pendingEvents[2].EventName.should.equal('Test Event');

            window.fetchMock.post(urls.eventsV3, 200);
            
            (window.fetchMock.lastCall() === undefined).should.equal(true);
            clock.tick(1000);

            let nowPendingEvents = window.mParticle.getInstance()._APIClient.uploader.pendingEvents
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
                    currentUser.setUserAttribute("number", Math.floor((Math.random() * 1000) + 1))
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
            
            // Force an upload of events
            window.mParticle.upload();
            
            // We have to restore the clock in order to use setTimeout below
            clock.restore();

            // This timeout is required for all batches to be sent due to there being
            // an async/await inside of a foor loop in the batch uploader
            setTimeout(function() {
                var batch1 = JSON.parse(window.fetchMock._calls[0][1].body);

                var batch1SessionStart = Utils.findEventFromBatch(batch1, 'session_start')
                var batch1AST = Utils.findEventFromBatch(batch1, 'application_state_transition')
                var batch1UAC = Utils.findEventFromBatch(batch1, 'user_attribute_change')

                batch1SessionStart.should.be.ok();
                batch1AST.should.be.ok();
                batch1UAC.should.be.ok();
                
                var batch2 = JSON.parse(window.fetchMock._calls[1][1].body);

                batch2.events.length.should.equal(1);
                var batch2SessionEnd = Utils.findEventFromBatch(batch2, 'session_end')
                batch2SessionEnd.should.be.ok();

                var batch3 = JSON.parse(window.fetchMock._calls[2][1].body);

                batch3.events.length.should.equal(3);
                var batch3SessionStart = Utils.findEventFromBatch(batch3, 'session_start')
                var batch3AST = Utils.findEventFromBatch(batch3, 'application_state_transition')
                var batch3UAC = Utils.findEventFromBatch(batch3, 'user_attribute_change')

                batch3SessionStart.should.be.ok();
                batch3AST.should.be.ok();
                batch3UAC.should.be.ok();

                (typeof batch1.source_request_id).should.equal('string');
                (typeof batch2.source_request_id).should.equal('string');
                (typeof batch3.source_request_id).should.equal('string');

                batch1.source_request_id.should.not.equal(batch2.source_request_id);
                batch2.source_request_id.should.not.equal(batch3.source_request_id);
                batch3.source_request_id.should.not.equal(batch1.source_request_id);

                batch1SessionStart.data.session_uuid.should.equal(batch2SessionEnd.data.session_uuid);
                batch1UAC.data.session_uuid.should.not.equal(batch3UAC.data.session_uuid);
                batch1UAC.data.session_start_unixtime_ms.should.not.equal(batch3UAC.data.session_start_unixtime_ms);
    
                done();
                // wait for more than 1000 milliseconds to force the final upload
            }, 1200);
        });
    })

    describe('batching via XHR for older browsers without window.fetch', () => {
        var fetch = window.fetch;

        beforeEach(function() {
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
    
        afterEach(function() {
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

        it('should force uploads when a commerce event is called', function(done) {
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

            let pendingEvents = window.mParticle.getInstance()._APIClient.uploader.pendingEvents

            pendingEvents.length.should.equal(3)
            pendingEvents[0].EventName.should.equal(1);
            pendingEvents[1].EventName.should.equal(10);
            pendingEvents[2].EventName.should.equal('Test Event');

            clock.tick(1000);

            let nowPendingEvents = window.mParticle.getInstance()._APIClient.uploader.pendingEvents
            nowPendingEvents.length.should.equal(0);

            var batch = JSON.parse(mockServer.secondRequest.requestBody);
            batch.events[0].event_type.should.equal('session_start');
            batch.events[1].event_type.should.equal('application_state_transition');
            batch.events[2].event_type.should.equal('custom_event');
            batch.events[2].data.event_name.should.equal('Test Event');
            done();
        });
    })

    describe('upload beacon', ()=> {
        beforeEach(() => {
            window.mParticle.config.flags = {
                eventsV3: '100',
                eventBatchingIntervalMillis: 1000,
            }
        })
        afterEach(() => {
            sinon.restore();
        });

        it('should trigger beacon on page visibilitychange events', function(done) {
            window.mParticle._resetForTests(MPConfig);

            var bond = sinon.spy(navigator, 'sendBeacon');
            window.mParticle.init(apiKey, window.mParticle.config);
            document.dispatchEvent(new Event('visibilitychange'))

            bond.called.should.eql(true);
            bond.getCalls()[0].args[0].should.eql(
                'https://jssdks.mparticle.com/v3/JS/test_key/events'
            );

            done();
        });

        it('should trigger beacon on page beforeunload events', function(done) {
            window.mParticle._resetForTests(MPConfig);

            var bond = sinon.spy(navigator, 'sendBeacon');
            window.mParticle.init(apiKey, window.mParticle.config);

            // karma fails if onbeforeunload is not set to null
            window.onbeforeunload = null
            window.dispatchEvent(new Event('beforeunload'))
            
            bond.called.should.eql(true);
            bond.getCalls()[0].args[0].should.eql(
                'https://jssdks.mparticle.com/v3/JS/test_key/events'
            );
                
            done();
        });

        it('should trigger beacon on pagehide events', function(done) {
            window.mParticle._resetForTests(MPConfig);
            
            var bond = sinon.spy(navigator, 'sendBeacon');
            
            window.mParticle.init(apiKey, window.mParticle.config);
            window.dispatchEvent(new Event('pagehide'))

            bond.called.should.eql(true);
            bond.getCalls()[0].args[0].should.eql(
                'https://jssdks.mparticle.com/v3/JS/test_key/events'
            );

            (typeof(bond.getCalls()[0].args[1])).should.eql('object');

            done();
        });
    });
}); 
