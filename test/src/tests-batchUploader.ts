import sinon from 'sinon';
import { urls } from './config';
import { apiKey, MPConfig, testMPID } from './config';
import { BatchUploader } from  '../../src/batchUploader';
import { MParticleWebSDK, SDKEvent, SDKProductActionType } from  '../../src/sdkRuntimeModels';

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
            clock = sinon.useFakeTimers();

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

        it('should trigger beacon on unload events', function(done) {
            window.mParticle._resetForTests(MPConfig);

            var bond = sinon.spy(navigator, 'sendBeacon');
            window.mParticle.init(apiKey, window.mParticle.config);
            window.onbeforeunload({} as PageTransitionEvent);

            bond.called.should.eql(true);
            bond.getCalls()[0].args[0].should.eql(
                'https://jssdks.mparticle.com/v3/JS/test_key/events'
            );

            done();
        });

        it('should trigger beacon on pagehide events', function(done) {
            window.mParticle._resetForTests(MPConfig);

            // override sendBeacon function
            var bond = sinon.spy(navigator, 'sendBeacon');

            window.mParticle.init(apiKey, window.mParticle.config);

            window.onpagehide({} as PageTransitionEvent);

            bond.called.should.eql(true);
            bond.getCalls()[0].args[0].should.eql(
                'https://jssdks.mparticle.com/v3/JS/test_key/events'
            );

            (typeof(bond.getCalls()[0].args[1])).should.eql('object');

            done();
        });
    })
}); 
