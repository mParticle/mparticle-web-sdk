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
        // beforeunload: any;
        fetchMock: any;
    }
}

describe('upload beacon', () => {
    let mockServer;
    let mockLS;

    beforeEach(() => {
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        // Stub Local Storage response because it causes beacon to not fire in
        // repeated tests
        // mockLS = sinon.stub(window.localStorage, 'getItem');
        // mockLS.withArgs('mprtcl-v4_abcdef-events').returns(
        //     JSON.stringify({
        //         'b56a0cdf-91b8-4d86-96a8-57d8886d3b7a': {
        //             EventName: 10,
        //             EventAttributes: null,
        //             SourceMessageId: 'b56a0cdf-91b8-4d86-96a8-57d8886d3b7a',
        //             EventDataType: 10,
        //             CustomFlags: {},
        //             IsFirstRun: true,
        //             LaunchReferral: 'http://localhost:9876/debug.html',
        //             CurrencyCode: null,
        //             MPID: 'testMPID',
        //             ConsentState: null,
        //             UserAttributes: {},
        //             UserIdentities: [],
        //             Store: {},
        //             SDKVersion: '2.18.0',
        //             SessionId: '0D63646B-EA93-4AD1-8378-FAD7A71A333B',
        //             SessionStartDate: 1671576752819,
        //             Debug: false,
        //             Location: null,
        //             OptOut: null,
        //             ExpandedEventCount: 0,
        //             ClientGeneratedId: '95a0d3e4-f16c-4bd4-a86a-60bfd1ed353f',
        //             DeviceId: '062e7536-cf85-4430-a177-282dd0bbb31f',
        //             IntegrationAttributes: {},
        //             DataPlan: {},
        //             Timestamp: 1671576752827,
        //         },
        //     })
        // );

        window.mParticle.config.flags = {
            eventsV3: '100',
            eventBatchingIntervalMillis: 1000,
        };
    });

    afterEach(() => {
        sinon.restore();
        mockServer.reset();
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

    describe('Unit Tests', () => {
        describe('#upload', () => {
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

                expect(uploader.pendingEvents.length).to.eql(1);
            });

            it('should reject batches without events', () => {
                window.mParticle._resetForTests(MPConfig);
                window.mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = window.mParticle.getInstance();

                const uploader = new BatchUploader(mpInstance, 1000);

                uploader.queueEvent(null);
                uploader.queueEvent(({} as unknown) as SDKEvent);

                expect(uploader.pendingEvents).to.eql([]);
                expect(uploader.pendingUploads).to.eql([]);
            });
        });
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
            
            // Force an upload of events
            window.mParticle.upload();
            
            // We have to restore the clock in order to use setTimeout below
            clock.restore();

            // This timeout is required for all batches to be sent due to there being
            // an async/await inside of a for loop in the batch uploader
            setTimeout(function() {
                var batch1 = JSON.parse(window.fetchMock._calls[0][1].body);
                var batch2 = JSON.parse(window.fetchMock._calls[1][1].body);
                var batch3 = JSON.parse(window.fetchMock._calls[2][1].body);
                var batch4 = JSON.parse(window.fetchMock._calls[3][1].body);
                var batch5 = JSON.parse(window.fetchMock._calls[4][1].body);

                // UAC event
                batch1.events.length.should.equal(1);

                // session start, AST
                batch2.events.length.should.equal(2);

                // session end
                batch3.events.length.should.equal(1);

                // session start, AST
                batch4.events.length.should.equal(2);

                // UAC event
                batch5.events.length.should.equal(1);

                var batch1UAC = Utils.findEventFromBatch(batch1, 'user_attribute_change');
                batch1UAC.should.be.ok();

                var batch2SessionStart = Utils.findEventFromBatch(batch2, 'session_start');
                var batch2AST = Utils.findEventFromBatch(batch2, 'application_state_transition');

                batch2SessionStart.should.be.ok();
                batch2AST.should.be.ok();

                var batch3SessionEnd = Utils.findEventFromBatch(batch3, 'session_end');
                batch3SessionEnd.should.be.ok();

                var batch4SessionStart = Utils.findEventFromBatch(batch4, 'session_start');
                var batch4AST = Utils.findEventFromBatch(batch4, 'application_state_transition');

                batch4SessionStart.should.be.ok();
                batch4AST.should.be.ok();
                
                var batch5UAC = Utils.findEventFromBatch(batch5, 'user_attribute_change');
                batch5UAC.should.be.ok();

                (typeof batch1.source_request_id).should.equal('string');
                (typeof batch2.source_request_id).should.equal('string');
                (typeof batch3.source_request_id).should.equal('string');
                (typeof batch4.source_request_id).should.equal('string');
                (typeof batch5.source_request_id).should.equal('string');

                batch1.source_request_id.should.not.equal(batch2.source_request_id);
                batch1.source_request_id.should.not.equal(batch3.source_request_id);
                batch1.source_request_id.should.not.equal(batch4.source_request_id);
                batch1.source_request_id.should.not.equal(batch5.source_request_id);
                batch2.source_request_id.should.not.equal(batch3.source_request_id);
                batch2.source_request_id.should.not.equal(batch4.source_request_id);
                batch2.source_request_id.should.not.equal(batch5.source_request_id);

                batch3.source_request_id.should.not.equal(batch4.source_request_id);
                batch3.source_request_id.should.not.equal(batch5.source_request_id);
                batch4.source_request_id.should.not.equal(batch5.source_request_id);

                batch1UAC.data.session_uuid.should.equal(batch2AST.data.session_uuid);
                batch1UAC.data.session_uuid.should.equal(batch2SessionStart.data.session_uuid);
                batch1UAC.data.session_uuid.should.not.equal(batch4SessionStart.data.session_uuid);
                batch1UAC.data.session_uuid.should.not.equal(batch4AST.data.session_uuid);
                batch1UAC.data.session_uuid.should.not.equal(batch5UAC.data.session_uuid);
                
                batch1UAC.data.session_start_unixtime_ms.should.equal(batch2AST.data.session_start_unixtime_ms);
                batch1UAC.data.session_start_unixtime_ms.should.equal(batch2SessionStart.data.session_start_unixtime_ms);
                batch1UAC.data.session_start_unixtime_ms.should.not.equal(batch4SessionStart.data.session_start_unixtime_ms);
                batch1UAC.data.session_start_unixtime_ms.should.not.equal(batch4AST.data.session_start_unixtime_ms);
                batch1UAC.data.session_start_unixtime_ms.should.not.equal(batch5UAC.data.session_start_unixtime_ms);

                batch2SessionStart.data.session_uuid.should.equal(batch2AST.data.session_uuid);
                batch2SessionStart.data.session_uuid.should.equal(batch3SessionEnd.data.session_uuid);
                batch2AST.data.session_uuid.should.equal(batch3SessionEnd.data.session_uuid);

                batch2SessionStart.data.session_start_unixtime_ms.should.equal(batch2AST.data.session_start_unixtime_ms);
                batch2SessionStart.data.session_start_unixtime_ms.should.equal(batch3SessionEnd.data.session_start_unixtime_ms);
                batch2AST.data.session_start_unixtime_ms.should.equal(batch3SessionEnd.data.session_start_unixtime_ms);

                batch4SessionStart.data.session_uuid.should.equal(batch4AST.data.session_uuid);
                batch4SessionStart.data.session_uuid.should.equal(batch5UAC.data.session_uuid);
                batch4AST.data.session_uuid.should.equal(batch5UAC.data.session_uuid);

                batch4SessionStart.data.session_start_unixtime_ms.should.equal(batch4AST.data.session_start_unixtime_ms);
                batch4SessionStart.data.session_start_unixtime_ms.should.equal(batch5UAC.data.session_start_unixtime_ms);
                batch4AST.data.session_start_unixtime_ms.should.equal(batch5UAC.data.session_start_unixtime_ms);
                
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

    describe('handling eventless batches', () => {
        it('should reject batches without events', async () => {
            window.mParticle.config.flags = {
                eventsV3: '100',
                eventBatchingIntervalMillis: 1000,
            };

            mockServer = sinon.createFakeServer();
            mockServer.respondImmediately = true;

            mockServer.respondWith(urls.identify, [
                200,
                {},
                JSON.stringify({ mpid: testMPID, is_logged_in: false }),
            ]);

            window.mParticle._resetForTests(MPConfig);
            window.mParticle.init(apiKey, window.mParticle.config);

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
                ({} as unknown) as BaseEvent
            );
            const testBatches = [actualBatch, eventlessBatch];

            // HACK: Directly access uploader to Force an upload
            await (<any>uploader).upload(newLogger, testBatches, false);

            expect(window.fetchMock.calls().length).to.equal(1);

            const actualBatchResult = JSON.parse(
                window.fetchMock.calls()[0][1].body
            );

            expect(actualBatchResult.events.length).to.equal(1);
            expect(actualBatchResult.events).to.eql(actualBatch.events);
        });
    });
});
