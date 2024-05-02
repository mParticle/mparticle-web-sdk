import Utils from './config/utils';
import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import {
    urls,
    apiKey,
    testMPID,
    MPConfig,
    MessageType,
} from './config/constants';

const getIdentityEvent = Utils.getIdentityEvent,
    findEventFromRequest = Utils.findEventFromRequest,
    findBatch = Utils.findBatch;
let mockServer;

describe('event logging', function() {
    beforeEach(function() {
        mParticle._resetForTests(MPConfig);
        fetchMock.post(urls.events, 200);
        delete mParticle._instances['default_instance'];
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        mockServer.restore();
        fetchMock.restore();
        mParticle._resetForTests(MPConfig);
    });

    it('should log an event', function(done) {
        window.mParticle.logEvent(
            'Test Event',
            mParticle.EventType.Navigation,
            { mykey: 'myvalue' }
        );
        const testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');
        const testEventBatch = findBatch(fetchMock.calls(), 'Test Event');

        testEvent.data.should.have.property('event_name', 'Test Event');
        testEvent.data.should.have.property('custom_event_type', 'navigation');
        testEvent.data.should.have.property('custom_attributes');
        testEvent.data.custom_attributes.should.have.property(
            'mykey',
            'myvalue'
        );

        testEventBatch.should.have.property('mpid', testMPID);

        done();
    });

    it('should log an event with new device id when set on setDeviceId', function(done) {
        window.mParticle.logEvent(
            'Test Event',
            mParticle.EventType.Navigation,
            { mykey: 'myvalue' }
        );

        const testEventBatch = findBatch(fetchMock.calls(), 'Test Event');
        // this das should be the SDK auto generated one, which is 36 characters long
        testEventBatch.mp_deviceid.should.have.length(36);

        mParticle.setDeviceId('foo-guid');

        window.mParticle.logEvent('Test Event2');
        const testEvent2Batch = findBatch(fetchMock.calls(), 'Test Event2');

        // das should be the one passed to setDeviceId()
        testEvent2Batch.should.have.property('mp_deviceid', 'foo-guid');

        done();
    });

    it('should log an event with new device id when set via mParticle.config', function(done) {
        mParticle._resetForTests(MPConfig);

        window.mParticle.config.deviceId = 'foo-guid';
        mParticle.init(apiKey, window.mParticle.config);

        window.mParticle.logEvent('Test Event');
        const testEventBatch = findBatch(fetchMock.calls(), 'Test Event');

        // this das should be the SDK auto generated one
        testEventBatch.should.have.property('mp_deviceid', 'foo-guid');

        done();
    });

    it('should allow an event to bypass server upload', function(done) {
        window.mParticle.logEvent(
            'Test Standard Upload',
            mParticle.EventType.Navigation,
            { mykey: 'myvalue' },
            {},
            {
                shouldUploadEvent: true,
            }
        );

        window.mParticle.logEvent(
            'Test Upload Bypass',
            mParticle.EventType.Navigation,
            { mykey: 'myvalue' },
            {},
            {
                shouldUploadEvent: false,
            }
        );

        const uploadEvent = findEventFromRequest(
            fetchMock.calls(),
            'Test Standard Upload'
        );
        const uploadEventBatch = findBatch(
            fetchMock.calls(),
            'Test Standard Upload'
        );

        const bypassedEvent = findEventFromRequest(
            fetchMock.calls(),
            'Test Upload Bypass'
        );

        uploadEvent.should.be.ok();
        uploadEvent.data.should.have.property(
            'event_name',
            'Test Standard Upload'
        );
        uploadEvent.data.should.have.property(
            'custom_event_type',
            'navigation'
        );
        uploadEvent.data.should.have.property('custom_attributes');
        uploadEvent.data.custom_attributes.should.have.property(
            'mykey',
            'myvalue'
        );
        uploadEventBatch.should.have.property('mpid', testMPID);

        Should(bypassedEvent).not.be.ok();

        done();
    });

    it('should allow an event to bypass server upload via logBaseEvent', function(done) {
        window.mParticle.logBaseEvent(
            {
                name: 'Test Standard Upload',
                messageType: MessageType.PageEvent,
                eventType: mParticle.EventType.Navigation,
                data: { mykey: 'myvalue' },
                customFlags: {},
            },
            {
                shouldUploadEvent: true,
            }
        );

        window.mParticle.logBaseEvent(
            {
                name: 'Test Upload Bypass',
                messageType: MessageType.PageEvent,
                eventType: mParticle.EventType.Navigation,
                data: { mykey: 'myvalue' },
                customFlags: {},
            },
            {
                shouldUploadEvent: false,
            }
        );

        const uploadEvent = findEventFromRequest(
            fetchMock.calls(),
            'Test Standard Upload'
        );
        const uploadEventBatch = findBatch(
            fetchMock.calls(),
            'Test Standard Upload'
        );

        const bypassedEvent = findEventFromRequest(
            fetchMock.calls(),
            'Test Upload Bypass'
        );

        uploadEvent.should.be.ok();

        uploadEvent.data.should.have.property(
            'event_name',
            'Test Standard Upload'
        );
        uploadEvent.data.should.have.property(
            'custom_event_type',
            'navigation'
        );
        uploadEvent.data.should.have.property('custom_attributes');
        uploadEvent.data.custom_attributes.should.have.property(
            'mykey',
            'myvalue'
        );
        uploadEventBatch.should.have.property('mpid', testMPID);

        Should(bypassedEvent).not.be.ok();

        done();
    });

    it('should log an error', function(done) {
        mParticle.logError('my error');

        const errorEvent = findEventFromRequest(fetchMock.calls(), 'my error');

        Should(errorEvent).be.ok();

        errorEvent.data.should.have.property('message', 'Error');
        errorEvent.data.should.have.property('custom_attributes');
        errorEvent.data.custom_attributes.should.have.property('m', 'my error');

        done();
    });

    it('should log an error with name, message, stack', function(done) {
        const error = new Error('my error');
        error.stack = 'my stacktrace';

        mParticle.logError(error);

        const errorEvent = findEventFromRequest(fetchMock.calls(), 'my error');

        Should(errorEvent).be.ok();

        errorEvent.data.should.have.property('message', 'Error');
        errorEvent.data.should.have.property('custom_attributes');
        errorEvent.data.custom_attributes.should.have.property('m', 'my error');
        errorEvent.data.custom_attributes.should.have.property('s', 'Error');
        errorEvent.data.custom_attributes.should.have.property(
            't',
            'my stacktrace'
        );

        done();
    });

    it('should log an error with custom attrs', function(done) {
        const error = new Error('my error');
        error.stack = 'my stacktrace';

        mParticle.logError(error, { location: 'my path', myData: 'my data' });

        const errorEvent = findEventFromRequest(fetchMock.calls(), 'my error');

        Should(errorEvent).be.ok();
        errorEvent.data.should.have.property('message', 'Error');
        errorEvent.data.should.have.property('custom_attributes');
        errorEvent.data.custom_attributes.should.have.property(
            'location',
            'my path'
        );
        errorEvent.data.custom_attributes.should.have.property(
            'myData',
            'my data'
        );

        done();
    });

    it('should sanitize error custom attrs', function(done) {
        const bond = sinon.spy(mParticle.getInstance().Logger, 'warning');
        mParticle.logError('my error', {
            invalid: ['my invalid attr'],
            valid: 10,
        });

        const errorEvent = findEventFromRequest(fetchMock.calls(), 'my error');

        Should(errorEvent).be.ok();
        errorEvent.data.should.have.property('message', 'Error');
        errorEvent.data.should.have.property('custom_attributes');
        errorEvent.data.custom_attributes.should.have.property('valid', 10);
        errorEvent.data.custom_attributes.should.not.have.property('invalid');

        bond.called.should.eql(true);
        bond.callCount.should.equal(1);

        bond.getCalls()[0].args[0].should.eql(
            "For 'my error', the corresponding attribute value of 'invalid' must be a string, number, boolean, or null."
        );

        done();
    });

    it('should log an AST with firstRun = true when first visiting a page, and firstRun = false when reloading the page', function(done) {
        const astEvent = findEventFromRequest(
            fetchMock.calls(),
            'application_state_transition'
        );

        astEvent.data.should.have.property(
            'application_transition_type',
            'application_initialized'
        );
        astEvent.data.should.have.property('is_first_run', true);
        astEvent.data.should.have.property('is_upgrade', false);

        if (document.referrer && document.referrer.length > 0) {
            astEvent.data.should.have.property(
                'launch_referral',
                window.location.href
            );
        }

        fetchMock.resetHistory();

        mParticle.init(apiKey, window.mParticle.config);
        const astEvent2 = findEventFromRequest(
            fetchMock.calls(),
            'application_state_transition'
        );

        astEvent2.data.should.have.property('is_first_run', false);

        done();
    });

    it('should log an AST on init with firstRun = false when cookies already exist', function(done) {
        // cookies currently exist, mParticle.init called from beforeEach
        fetchMock.resetHistory();
        // log second AST
        mParticle.init(apiKey, window.mParticle.config);

        const astEvent = findEventFromRequest(
            fetchMock.calls(),
            'application_state_transition'
        );
        astEvent.data.should.have.property('is_first_run', false);

        done();
    });

    it('should log a page view', function(done) {
        mParticle.logPageView();

        const pageViewEvent = findEventFromRequest(
            fetchMock.calls(),
            'screen_view'
        );

        Should(pageViewEvent).be.ok();

        pageViewEvent.data.should.have.property('custom_attributes');
        pageViewEvent.data.custom_attributes.should.have.property(
            'hostname',
            window.location.hostname
        );
        pageViewEvent.data.custom_attributes.should.have.property(
            'title',
            window.document.title
        );

        done();
    });

    it('should log custom page view', function(done) {
        mParticle.logPageView(
            'My Page View',
            { testattr: 1 },
            {
                'MyCustom.Flag': 'Test',
            }
        );

        const pageViewEvent = findEventFromRequest(
            fetchMock.calls(),
            'screen_view'
        );

        Should(pageViewEvent).be.ok();

        pageViewEvent.data.should.have.property('custom_attributes');
        pageViewEvent.data.should.have.property('screen_name', 'My Page View');
        pageViewEvent.data.custom_attributes.should.have.property(
            'testattr',
            1
        );
        pageViewEvent.data.custom_flags.should.have.property(
            'MyCustom.Flag',
            'Test'
        );

        done();
    });

    it('should pass custom flags in page views', function(done) {
        mParticle.logPageView('test', null, {
            'MyCustom.Flag': 'Test',
        });

        const pageViewEvent = findEventFromRequest(
            fetchMock.calls(),
            'screen_view'
        );

        Should(pageViewEvent).be.ok();

        pageViewEvent.data.should.have.property('custom_flags');
        pageViewEvent.data.custom_flags.should.have.property(
            'MyCustom.Flag',
            'Test'
        );

        done();
    });

    it('should allow a page view to bypass server upload', function(done) {
        mParticle.logPageView('test bypass', null, null, {
            shouldUploadEvent: false,
        });

        const pageViewEvent = findEventFromRequest(
            fetchMock.calls(),
            'screen_view'
        );

        Should(pageViewEvent).not.be.ok();
        done();
    });

    it('should not log a PageView event if there are invalid attrs', function(done) {
        mParticle.logPageView('test1', 'invalid', null);
        const pageViewEvent = findEventFromRequest(
            fetchMock.calls(),
            'screen_view'
        );

        Should(pageViewEvent).not.be.ok();

        done();
    });

    it('should not log an event that has an invalid customFlags', function(done) {
        mParticle.logPageView('test', null, 'invalid');

        const pageViewEvent = findEventFromRequest(
            fetchMock.calls(),
            'screen_view'
        );
        Should(pageViewEvent).not.be.ok();

        done();
    });

    it('should log event with name PageView when an invalid event name is passed', function(done) {
        fetchMock.resetHistory();

        mParticle.logPageView(null);
        fetchMock.calls().length.should.equal(1);
        const pageViewEvent = findEventFromRequest(
            fetchMock.calls(),
            'screen_view'
        );
        pageViewEvent.data.screen_name.should.equal('PageView');

        fetchMock.resetHistory();
        mParticle.logPageView({ test: 'test' });
        fetchMock.calls().length.should.equal(1);
        const pageViewEvent2 = findEventFromRequest(
            fetchMock.calls(),
            'screen_view'
        );
        pageViewEvent2.data.screen_name.should.equal('PageView');

        fetchMock.resetHistory();
        mParticle.logPageView([1, 2, 3]);
        fetchMock.calls().length.should.equal(1);
        const pageViewEvent3 = findEventFromRequest(
            fetchMock.calls(),
            'screen_view'
        );
        pageViewEvent3.data.screen_name.should.equal('PageView');

        done();
    });

    it('should log opt out', function(done) {
        mParticle.setOptOut(true);

        const optOutEvent = findEventFromRequest(fetchMock.calls(), 'opt_out');

        optOutEvent.event_type.should.equal('opt_out');
        optOutEvent.data.should.have.property('is_opted_out', true);

        done();
    });

    it('log event requires name', function(done) {
        fetchMock.resetHistory();
        mParticle.logEvent();

        fetchMock.calls().should.have.lengthOf(0);

        done();
    });

    it('log event requires valid event type', function(done) {
        fetchMock.resetHistory();

        mParticle.logEvent('test', 100);

        fetchMock.calls().should.have.lengthOf(0);

        done();
    });

    it('event attributes must be object', function(done) {
        mParticle.logEvent('Test Event', null, 1);

        const testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');

        testEvent.data.should.have.property('custom_attributes', null);

        done();
    });

    it('opting out should prevent events being sent', function(done) {
        mParticle.setOptOut(true);
        fetchMock.resetHistory();

        mParticle.logEvent('test');
        fetchMock.calls().should.have.lengthOf(0);

        done();
    });

    it('after logging optout, and reloading, events still should not be sent until opt out is enabled when using local storage', function(done) {
        mParticle.setOptOut(true);
        fetchMock.resetHistory();

        mParticle.logEvent('test');
        fetchMock.calls().should.have.lengthOf(0);

        mParticle.setOptOut(false);

        mParticle.init(apiKey, window.mParticle.config);
        fetchMock.resetHistory();

        mParticle.logEvent('test');
        fetchMock.calls().should.have.lengthOf(1);

        mParticle.setOptOut(true);
        mParticle.init(apiKey, window.mParticle.config);
        fetchMock.resetHistory();

        mParticle.logEvent('test');
        fetchMock.calls().should.have.lengthOf(0);

        done();
    });

    it('after logging optout, and reloading, events still should not be sent until opt out is enabled when using cookie storage', function(done) {
        mParticle.config.useCookieStorage = true;
        mParticle.init(apiKey, window.mParticle.config);
        mParticle.setOptOut(true);
        fetchMock.resetHistory();

        mParticle.logEvent('test');
        fetchMock.calls().should.have.lengthOf(0);

        mParticle.setOptOut(false);

        mParticle.init(apiKey, window.mParticle.config);
        fetchMock.resetHistory();
        mParticle.logEvent('test');
        fetchMock.calls().should.have.lengthOf(1);

        mParticle.setOptOut(true);
        mParticle.init(apiKey, window.mParticle.config);
        fetchMock.resetHistory();
        mParticle.logEvent('test');
        fetchMock.calls().should.have.lengthOf(0);

        done();
    });

    it('should log logout event', function(done) {
        mockServer.respondWith(urls.logout, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
        mParticle.Identity.logout();
        const data = getIdentityEvent(mockServer.requests, 'logout');
        data.should.have.properties(
            'client_sdk',
            'environment',
            'previous_mpid',
            'request_id',
            'request_timestamp_ms',
            'context'
        );

        done();
    });

    it('should log login event', function(done) {
        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mParticle.Identity.login();
        const data = getIdentityEvent(mockServer.requests, 'login');
        data.should.have.properties(
            'client_sdk',
            'environment',
            'previous_mpid',
            'request_id',
            'request_timestamp_ms',
            'context'
        );

        done();
    });

    it('should log modify event', function(done) {
        mockServer.respondWith(urls.modify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
        mParticle.Identity.modify();
        const data = getIdentityEvent(mockServer.requests, 'modify');
        data.should.have.properties(
            'client_sdk',
            'environment',
            'identity_changes',
            'request_id',
            'request_timestamp_ms',
            'context'
        );

        done();
    });

    it('should send das with each event logged', function(done) {
        window.mParticle.logEvent('Test Event');
        const testEventBatch = findBatch(fetchMock.calls(), 'Test Event');

        testEventBatch.should.have.property('mp_deviceid');
        testEventBatch.mp_deviceid.length.should.equal(36);
        done();
    });

    it('should send consent state with each event logged', function(done) {
        const consentState = mParticle.Consent.createConsentState();
        consentState.addGDPRConsentState(
            'foo purpose',
            mParticle.Consent.createGDPRConsent(
                true,
                10,
                'foo document',
                'foo location',
                'foo hardwareId'
            )
        );
        mParticle.Identity.getCurrentUser().setConsentState(consentState);

        window.mParticle.logEvent('Test Event');
        const testEvent = findBatch(fetchMock.calls(), 'Test Event');

        testEvent.should.have.property('consent_state');
        testEvent.consent_state.should.have.property('gdpr');
        testEvent.consent_state.gdpr.should.have.property('foo purpose');

        const purpose = testEvent.consent_state.gdpr['foo purpose'];
        purpose.should.have.property('timestamp_unixtime_ms', 10);
        purpose.should.have.property('document', 'foo document');
        purpose.should.have.property('location', 'foo location');
        purpose.should.have.property('hardware_id', 'foo hardwareId');

        mParticle.Identity.getCurrentUser().setConsentState(null);

        window.mParticle.logEvent('Test Event2');
        const testEvent2 = findBatch(fetchMock.calls(), 'Test Event2');

        testEvent2.should.have.property('consent_state', null);

        done();
    });

    it('should log integration attributes with each event', function(done) {
        mParticle.setIntegrationAttribute(128, { MCID: 'abcdefg' });
        mParticle.logEvent('Test Event');
        const testEvent = findBatch(fetchMock.calls(), 'Test Event');

        testEvent.should.have.property('integration_attributes');
        testEvent.integration_attributes.should.have.property('128');
        testEvent.integration_attributes['128'].should.have.property(
            'MCID',
            'abcdefg'
        );

        done();
    });

    it('should run the callback once when tracking succeeds', function(done) {
        const clock = sinon.useFakeTimers();

        mParticle.init(apiKey, window.mParticle.config);

        let successCallbackCalled = false;
        let numberTimesCalled = 0;

        mParticle.startTrackingLocation(function() {
            numberTimesCalled += 1;
            successCallbackCalled = true;
            mParticle.logEvent('Test Event');
        });

        // mock geo will successfully run after 1 second (geomock.js // navigator.geolocation.delay)
        clock.tick(1000);
        successCallbackCalled.should.equal(true);
        let testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');

        testEvent.data.location.latitude.should.equal(52.5168);
        testEvent.data.location.longitude.should.equal(13.3889);
        fetchMock.resetHistory();

        //this will hit the watch position again, but won't call the callback again
        clock.tick(1000);
        numberTimesCalled.should.equal(1);

        testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');

        Should(testEvent).not.be.ok();

        clock.restore();

        done();
    });

    it('should run the callback once when tracking fails', function(done) {
        const clock = sinon.useFakeTimers();

        mParticle.init(apiKey, window.mParticle.config);

        let successCallbackCalled = false;
        let numberTimesCalled = 0;

        navigator.geolocation.shouldFail = true;

        mParticle.startTrackingLocation(function() {
            numberTimesCalled += 1;
            successCallbackCalled = true;
            mParticle.logEvent('Test Event');
        });

        // mock geo will successfully run after 1 second (geomock.js // navigator.geolocation.delay)
        clock.tick(1000);
        successCallbackCalled.should.equal(true);

        let testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');

        testEvent.data.should.have.property('location', null);
        fetchMock.resetHistory();

        //this will hit the watch position again, but won't call the callback again
        clock.tick(1000);
        numberTimesCalled.should.equal(1);
        testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');
        Should(testEvent).not.be.ok();

        navigator.geolocation.shouldFail = false;

        clock.restore();

        done();
    });

    it('should pass the found or existing position to the callback in startTrackingLocation', function(done) {
        const clock = sinon.useFakeTimers();

        mParticle.init(apiKey, window.mParticle.config);

        let currentPosition;

        function callback(position) {
            currentPosition = position;
        }

        mParticle.startTrackingLocation(callback);

        // mock geo will successfully run after 1 second (geomock.js // navigator.geolocation.delay)
        clock.tick(1000);
        const latitudeResult = 52.5168;
        const longitudeResult = 13.3889;

        currentPosition.coords.latitude.should.equal(latitudeResult);
        currentPosition.coords.longitude.should.equal(longitudeResult);

        clock.restore();

        done();
    });

    it('should run the callback if tracking already exists', function(done) {
        const clock = sinon.useFakeTimers();

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.startTrackingLocation();

        let successCallbackCalled = false;

        function callback() {
            successCallbackCalled = true;
            mParticle.logEvent('Test Event');
        }

        mParticle.startTrackingLocation(callback);

        // mock geo will successfully run after 1 second (geomock.js // navigator.geolocation.delay)
        clock.tick(1000);
        successCallbackCalled.should.equal(true);
        const testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');

        const latitudeResult = 52.5168;
        const longitudeResult = 13.3889;
        testEvent.data.location.latitude.should.equal(latitudeResult);
        testEvent.data.location.longitude.should.equal(longitudeResult);

        clock.restore();

        done();
    });

    it('should log appName in the payload on v3 endpoint when set on config prior to init', function(done) {
        mParticle.config.appName = 'a name';
        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        };

        mParticle.init(apiKey, mParticle.config);

        window.mParticle.logEvent('Test Event');

        const batch = JSON.parse(fetchMock.lastOptions().body);

        batch.application_info.should.have.property(
            'application_name',
            'a name'
        );

        delete window.mParticle.config.flags;

        done();
    });

    it('should log AST first_run as true on new page loads, and false for when a page has previously been loaded', function(done) {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, mParticle.config);

        const batch = JSON.parse(fetchMock.lastOptions().body);
        batch.events[0].data.should.have.property('is_first_run', true);

        mParticle.init(apiKey, mParticle.config);
        const batch2 = JSON.parse(fetchMock.lastOptions().body);
        batch2.events[0].data.should.have.property('is_first_run', false);

        delete window.mParticle.config.flags;

        done();
    });

    it('should log AST with launch_referral with a url', function(done) {
        mParticle._resetForTests(MPConfig);

        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        };

        mParticle.init(apiKey, mParticle.config);

        const batch = JSON.parse(fetchMock.lastOptions().body);
        batch.events[0].data.should.have.property('launch_referral');
        batch.events[0].data.launch_referral.should.startWith(
            'http://localhost'
        );

        delete window.mParticle.config.flags;

        done();
    });

    it('should log appName in the payload on v3 endpoint when set on config prior to init', function(done) {
        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        };

        mParticle.init(apiKey, mParticle.config);
        mParticle.setAppName('another name');

        window.mParticle.logEvent('Test Event');

        const batch = JSON.parse(fetchMock.lastOptions().body);
        batch.application_info.should.have.property(
            'application_name',
            'another name'
        );

        delete window.mParticle.config.flags;

        done();
    });

    it('should log a batch to v3 with data planning in the payload', function(done) {
        mParticle.config.logLevel = 'verbose';
        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        };
        mParticle.config.dataPlan = {
            planId: 'plan_slug',
            planVersion: 10,
        };

        mParticle.init(apiKey, mParticle.config);

        window.mParticle.logEvent('Test Event');

        const batch = JSON.parse(fetchMock.lastOptions().body);

        batch.should.have.property('context');
        batch.context.should.have.property('data_plan');
        batch.context.data_plan.should.have.property('plan_version', 10);
        batch.context.data_plan.should.have.property('plan_id', 'plan_slug');

        delete window.mParticle.config.flags;

        done();
    });

    it('should log a batch to v3 with no version if no version is passed', function(done) {
        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        };
        mParticle.config.dataPlan = {
            planId: 'plan_slug',
        };

        mParticle.init(apiKey, mParticle.config);

        window.mParticle.logEvent('Test Event');

        const batch = JSON.parse(fetchMock.lastOptions().body);

        batch.should.have.property('context');
        batch.context.should.have.property('data_plan');
        batch.context.data_plan.should.not.have.property('plan_version');
        batch.context.data_plan.should.have.property('plan_id', 'plan_slug');

        delete window.mParticle.config.flags;

        done();
    });

    it('should log a batch to v3 with no context if no data plan is passed', function(done) {
        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        };
        mParticle.config.dataPlan = {
            planVersion: 10,
        };

        mParticle.init(apiKey, mParticle.config);

        window.mParticle.logEvent('Test Event');

        const batch = JSON.parse(fetchMock.lastOptions().body);

        batch.should.not.have.property('context');

        delete window.mParticle.config.flags;

        done();
    });

    it('should log an error if a non slug string is passed as the dataplan planId', function(done) {
        let errorMessage;

        mParticle.config.logLevel = 'verbose';
        mParticle.config.logger = {
            error: function(msg) {
                if (!errorMessage) {
                    errorMessage = msg;
                }
            },
        };
        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        };
        mParticle.config.dataPlan = {
            planId: 'not a slug',
            planVersion: 10,
        };

        mParticle.init(apiKey, mParticle.config);

        window.mParticle.logEvent('Test Event');

        errorMessage.should.equal(
            'Your data plan id must be a string and match the data plan slug format (i.e. under_case_slug)'
        );
        const batch = JSON.parse(fetchMock.lastOptions().body);
        batch.should.not.have.property('context');
        delete window.mParticle.config.flags;

        done();
    });

    it('should log consent properly to v3 endpoint ', function(done) {
        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        };
        mParticle.config.dataPlan = {
            planVersion: 10,
        };

        mParticle.init(apiKey, mParticle.config);

        const user = mParticle.Identity.getCurrentUser();
        // Add to your consent state
        const consentState = mParticle.Consent.createConsentState();

        const ccpa = mParticle.Consent.createCCPAConsent(
            true,
            Date.now(),
            'doc1',
            'location1',
            'hardwareid'
        );

        consentState.setCCPAConsentState(ccpa);
        const location_collection_consent = mParticle.Consent.createGDPRConsent(
            true,
            Date.now(),
            'doc1',
            'location1',
            'hardwareid'
        );

        // Add to your consent state
        consentState.addGDPRConsentState(
            'My GDPR Purpose',
            location_collection_consent
        );
        user.setConsentState(consentState);

        window.mParticle.logEvent('Test Event');

        const batch = JSON.parse(fetchMock.lastOptions().body);

        batch.should.have.property('consent_state');
        batch.consent_state.should.have.properties(['gdpr', 'ccpa']);
        batch.consent_state.gdpr.should.have.property('my gdpr purpose');
        batch.consent_state.gdpr['my gdpr purpose'].should.have.property(
            'consented',
            true
        );
        batch.consent_state.gdpr['my gdpr purpose'].should.have.property(
            'document',
            'doc1'
        );
        batch.consent_state.gdpr['my gdpr purpose'].should.have.property(
            'location',
            'location1'
        );
        batch.consent_state.gdpr['my gdpr purpose'].should.have.property(
            'hardware_id',
            'hardwareid'
        );
        batch.consent_state.gdpr['my gdpr purpose'].should.have.property(
            'timestamp_unixtime_ms'
        );

        batch.consent_state.ccpa['data_sale_opt_out'].should.have.property(
            'consented',
            true
        );
        batch.consent_state.ccpa['data_sale_opt_out'].should.have.property(
            'document',
            'doc1'
        );
        batch.consent_state.ccpa['data_sale_opt_out'].should.have.property(
            'location',
            'location1'
        );
        batch.consent_state.ccpa['data_sale_opt_out'].should.have.property(
            'hardware_id',
            'hardwareid'
        );
        batch.consent_state.ccpa['data_sale_opt_out'].should.have.property(
            'timestamp_unixtime_ms'
        );

        delete window.mParticle.config.flags;

        done();
    });

    it('should sanitize transaction attributes in the payload on v3 endpoint', function(done) {
        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        };

        mParticle.init(apiKey, mParticle.config);

        const product1 = mParticle.eCommerce.createProduct(
            'iphone',
            'iphoneSKU',
            999,
            1
        );
        const product2 = mParticle.eCommerce.createProduct(
            'galaxy',
            'galaxySKU',
            799,
            1
        );

        const transactionAttributes = {
            Id: 'foo-transaction-id',
            Revenue: 'string',
            Tax: 'string',
            Shipping: 'string',
        };

        const customAttributes = { sale: true };
        const customFlags = { 'Google.Category': 'travel' };

        mParticle.eCommerce.logProductAction(
            mParticle.ProductActionType.Purchase,
            [product1, product2],
            customAttributes,
            customFlags,
            transactionAttributes
        );

        const batch = JSON.parse(fetchMock.lastOptions().body);

        batch.events[0].data.product_action.total_amount.should.equal(0);
        batch.events[0].data.product_action.shipping_amount.should.equal(0);
        batch.events[0].data.product_action.tax_amount.should.equal(0);

        delete window.mParticle.config.flags;

        done();
    });

    it('should sanitize product attributes in the payload on v3 endpoint', function(done) {
        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        };

        mParticle.init(apiKey, mParticle.config);

        const product1 = mParticle.eCommerce.createProduct(
            'iphone',
            'iphoneSKU',
            'string',
            'string',
            'variant',
            'category',
            'brand',
            'string',
            'coupon'
        );
        const product2 = mParticle.eCommerce.createProduct(
            'galaxy',
            'galaxySKU',
            'string',
            'string',
            'variant',
            'category',
            'brand',
            'string',
            'coupon'
        );

        const transactionAttributes = {
            Id: 'foo-transaction-id',
            Revenue: 'string',
            Tax: 'string',
            Shipping: 'string',
        };

        const customAttributes = { sale: true };
        const customFlags = { 'Google.Category': 'travel' };
        mParticle.eCommerce.logProductAction(
            mParticle.ProductActionType.Purchase,
            [product1, product2],
            customAttributes,
            customFlags,
            transactionAttributes
        );

        const batch = JSON.parse(fetchMock.lastOptions().body);
        (
            batch.events[0].data.product_action.products[0].position === null
        ).should.equal(true);
        batch.events[0].data.product_action.products[0].price.should.equal(0);
        batch.events[0].data.product_action.products[0].quantity.should.equal(
            0
        );
        batch.events[0].data.product_action.products[0].total_product_amount.should.equal(
            0
        );

        (
            batch.events[0].data.product_action.products[1].position === null
        ).should.equal(true);
        batch.events[0].data.product_action.products[1].price.should.equal(0);
        batch.events[0].data.product_action.products[1].quantity.should.equal(
            0
        );
        batch.events[0].data.product_action.products[1].total_product_amount.should.equal(
            0
        );

        delete window.mParticle.config.flags;

        done();
    });
});
