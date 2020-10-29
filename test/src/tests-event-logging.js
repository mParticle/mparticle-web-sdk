import Utils from './utils';
import sinon from 'sinon';
import { urls, apiKey,
    testMPID,
    MPConfig,
    MessageType } from './config';

var getEvent = Utils.getEvent,
    getIdentityEvent = Utils.getIdentityEvent,
    mockServer;

describe('event logging', function() {
    beforeEach(function() {
        mParticle._resetForTests(MPConfig);
        delete mParticle._instances['default_instance'];
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        mockServer.respondWith(urls.eventsV2, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, Store: {}})
        ]);

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
        mParticle.init(apiKey, window.mParticle.config)
    });

    afterEach(function() {
        mockServer.restore();
    });

    it('should log an event', function(done) {
        window.mParticle.logEvent(
            'Test Event',
            mParticle.EventType.Navigation,
            { mykey: 'myvalue' }
        );
        var data = getEvent(mockServer.requests, 'Test Event');

        data.should.have.property('n', 'Test Event');
        data.should.have.property('et', mParticle.EventType.Navigation);
        data.should.have.property('attrs');
        data.should.have.property('mpid', testMPID);
        data.attrs.should.have.property('mykey', 'myvalue');

        done();
    });

    it('should log an error', function(done) {
        mParticle.logError('my error');

        var data = getEvent(mockServer.requests, 'Error');

        Should(data).be.ok();

        data.should.have.property('n', 'Error');
        data.should.have.property('attrs');
        data.attrs.should.have.property('m', 'my error');

        done();
    });

    it('should log an error with name, message, stack', function(done) {
        var error = new Error('my error');
        error.stack = 'my stacktrace';

        mParticle.logError(error);

        var data = getEvent(mockServer.requests, 'Error');

        Should(data).be.ok();

        data.should.have.property('n', 'Error');
        data.should.have.property('attrs');
        data.attrs.should.have.property('m', 'my error');
        data.attrs.should.have.property('s', 'Error');
        data.attrs.should.have.property('t', 'my stacktrace');

        done();
    });

    it('should log an error with custom attrs', function(done) {
        var error = new Error('my error');
        error.stack = 'my stacktrace';

        mParticle.logError(error, { location: 'my path', myData: 'my data' });

        var data = getEvent(mockServer.requests, 'Error');

        Should(data).be.ok();
        data.should.have.property('n', 'Error');
        data.should.have.property('attrs');
        data.attrs.should.have.property('location', 'my path');
        data.attrs.should.have.property('myData', 'my data');

        done();
    });

    it('should sanitize error custom attrs', function(done) {
        mParticle.logError('my error', {
            invalid: ['my invalid attr'],
            valid: 10,
        });

        var data = getEvent(mockServer.requests, 'Error');

        Should(data).be.ok();
        data.should.have.property('n', 'Error');
        data.should.have.property('attrs');
        data.attrs.should.have.property('valid', 10);
        data.attrs.should.not.have.property('invalid');

        done();
    });

    it('should log an AST with firstRun = true when first visiting a page', function(done) {       
        var data = getEvent(mockServer.requests, MessageType.AppStateTransition);
        data.should.have.property('at', 1);
        data.should.have.property('fr', true);
        data.should.have.property('iu', false);
        if (document.referrer && document.referrer.length > 0) {
            data.should.have.property('lr', window.location.href);
        }

        done();
    });

    it('should log an AST on init with firstRun = false when cookies already exist', function(done) {
        // cookies currently exist, mParticle.init called from beforeEach

        mockServer.requests = [];
        // log second AST
        mParticle.init(apiKey, window.mParticle.config);

        var data2 = getEvent(mockServer.requests, MessageType.AppStateTransition);
        data2.should.have.property('fr', false);

        done();
    });

    it('should log a page view', function(done) {
        mParticle.logPageView();

        var event = getEvent(mockServer.requests, 'PageView');

        Should(event).be.ok();

        event.should.have.property('attrs');
        event.attrs.should.have.property('hostname', window.location.hostname);
        event.attrs.should.have.property('title', window.document.title);

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

        var event = getEvent(mockServer.requests, 'My Page View');

        event.should.have.property('attrs');
        event.attrs.should.have.property('testattr', 1);

        event.should.have.property('flags');
        event.flags.should.have.property('MyCustom.Flag', ['Test']);

        done();
    });

    it('should pass custom flags in page views', function(done) {
        mParticle.logPageView('test', null, {
            'MyCustom.Flag': 'Test',
        });

        var event = getEvent(mockServer.requests, 'test');

        Should(event).be.ok();

        event.should.have.property('flags');
        event.flags.should.have.property('MyCustom.Flag', ['Test']);

        done();
    });

    it('should convert custom flag dictionary values to array', function(done) {
        mParticle.logPageView('test', null, {
            'MyCustom.String': 'Test',
            'MyCustom.Number': 1,
            'MyCustom.Boolean': true,
            'MyCustom.Object': {},
            'MyCustom.Array': ['Blah', 'Hello', {}],
        });

        var event = getEvent(mockServer.requests, 'test');

        Should(event).be.ok();

        event.should.have.property('flags');
        event.flags.should.have.property('MyCustom.String', ['Test']);
        event.flags.should.have.property('MyCustom.Number', ['1']);
        event.flags.should.have.property('MyCustom.Boolean', ['true']);
        event.flags.should.not.have.property('MyCustom.Object');
        event.flags.should.have.property('MyCustom.Array', ['Blah', 'Hello']);

        done();
    });

    it('should not log a PageView event if there are invalid attrs', function(done) {
        mParticle.logPageView('test1', 'invalid', null);
        var event2 = getEvent(mockServer.requests, 'test1');

        Should(event2).not.be.ok();

        done();
    });

    it('should not log an event that has an invalid customFlags', function(done) {
        mParticle.logPageView('test', null, 'invalid');
        var event1 = getEvent(mockServer.requests, 'test');
        Should(event1).not.be.ok();

        done();
    });

    it('should log event with name PageView when an invalid event name is passed', function(done) {
        mockServer.requests = [];
        mParticle.logPageView(null);
        mockServer.requests.length.should.equal(1);
        var event1 = getEvent(mockServer.requests, 'PageView');
        event1.n.should.equal('PageView');

        mockServer.requests = [];
        mParticle.logPageView({ test: 'test' });
        mockServer.requests.length.should.equal(1);
        var event2 = getEvent(mockServer.requests, 'PageView');
        event2.n.should.equal('PageView');

        mockServer.requests = [];
        mParticle.logPageView([1, 2, 3]);
        mockServer.requests.length.should.equal(1);
        var event3 = getEvent(mockServer.requests, 'PageView');
        event3.n.should.equal('PageView');

        done();
    });

    it('should log opt out', function(done) {
        mParticle.setOptOut(true);

        var event = getEvent(mockServer.requests, MessageType.OptOut);

        event.should.have.property('dt', MessageType.OptOut);
        event.should.have.property('o', true);

        done();
    });

    it('log event requires name', function(done) {
        mockServer.requests = [];
        mParticle.logEvent();

        Should(mockServer.requests).have.lengthOf(0);

        done();
    });

    it('log event requires valid event type', function(done) {
        mockServer.requests = [];
        mParticle.logEvent('test', 100);

        Should(mockServer.requests).have.lengthOf(0);

        done();
    });

    it('event attributes must be object', function(done) {
        mParticle.logEvent('test', null, 1);

        var data = getEvent(mockServer.requests, 'test');

        data.should.have.property('attrs', null);

        done();
    });

    it('opting out should prevent events being sent', function(done) {
        mParticle.setOptOut(true);
        mockServer.requests = [];

        mParticle.logEvent('test');
        mockServer.requests.should.have.lengthOf(0);

        done();
    });

    it('after logging optout, and reloading, events still should not be sent until opt out is enabled when using local storage', function(done) {
        mParticle.setOptOut(true);
        mockServer.requests = [];

        mParticle.logEvent('test');
        mockServer.requests.should.have.lengthOf(0);
        mParticle.setOptOut(false);

        mParticle.init(apiKey, window.mParticle.config);
        mockServer.requests = [];
        mParticle.logEvent('test');
        mockServer.requests.should.have.lengthOf(1);

        mParticle.setOptOut(true);
        mParticle.init(apiKey, window.mParticle.config);
        mockServer.requests = [];
        mParticle.logEvent('test');
        mockServer.requests.should.have.lengthOf(0);

        done();
    });

    it('after logging optout, and reloading, events still should not be sent until opt out is enabled when using cookie storage', function(done) {
        mParticle.config.useCookieStorage = true;
        mParticle.init(apiKey, window.mParticle.config);
        mParticle.setOptOut(true);
        mockServer.requests = [];

        mParticle.logEvent('test');
        mockServer.requests.should.have.lengthOf(0);
        mParticle.setOptOut(false);

        mParticle.init(apiKey, window.mParticle.config);
        mockServer.requests = [];
        mParticle.logEvent('test');
        mockServer.requests.should.have.lengthOf(1);

        mParticle.setOptOut(true);
        mParticle.init(apiKey, window.mParticle.config);
        mockServer.requests = [];
        mParticle.logEvent('test');
        mockServer.requests.should.have.lengthOf(0);

        done();
    });

    it('should log logout event', function(done) {
        mockServer.respondWith(urls.logout, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
        mParticle.Identity.logout();
        var data = getIdentityEvent(mockServer.requests, 'logout');
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
        var data = getIdentityEvent(mockServer.requests, 'login');
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
        var data = getIdentityEvent(mockServer.requests, 'modify');
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
        var data = getEvent(mockServer.requests, 'Test Event');

        data.should.have.property('das');
        data.das.length.should.equal(36);
        done();
    });

    it('should send consent state with each event logged', function(done) {
        var consentState = mParticle.Consent.createConsentState();
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
        var data = getEvent(mockServer.requests, 'Test Event');

        data.should.have.property('con');
        data.con.should.have.property('gdpr');
        data.con.gdpr.should.have.property('foo purpose');
        var purpose = data.con.gdpr['foo purpose'];
        purpose.should.have.property('ts', 10);
        purpose.should.have.property('d', 'foo document');
        purpose.should.have.property('l', 'foo location');
        purpose.should.have.property('h', 'foo hardwareId');

        mParticle.Identity.getCurrentUser().setConsentState(null);

        window.mParticle.logEvent('Test Event2');
        data = getEvent(mockServer.requests, 'Test Event2');
        data.should.have.not.property('con');

        done();
    });

    it('should log integration attributes with each event', function(done) {
        mParticle.setIntegrationAttribute(128, { MCID: 'abcdefg' });
        mParticle.logEvent('Test Event');
        var data = getEvent(mockServer.requests, 'Test Event');

        data.should.have.property('ia');
        data.ia.should.have.property('128');
        data.ia['128'].should.have.property('MCID', 'abcdefg');

        done();
    });

    it('should run the callback once when tracking succeeds', function(done) {
        var clock = sinon.useFakeTimers();

        mParticle.init(apiKey, window.mParticle.config);

        var successCallbackCalled = false;
        var numberTimesCalled = 0;

        mParticle.startTrackingLocation(function() {
            numberTimesCalled += 1;
            successCallbackCalled = true;
            mParticle.logEvent('test event');
        });

        // mock geo will successfully run after 1 second (geomock.js // navigator.geolocation.delay)
        clock.tick(1000);
        successCallbackCalled.should.equal(true);
        var event = getEvent(mockServer.requests, 'test event');
        event.lc.lat.should.equal(52.5168);
        event.lc.lng.should.equal(13.3889);
        mockServer.requests = [];
        //this will hit the watch position again, but won't call the callback again
        clock.tick(1000);
        numberTimesCalled.should.equal(1);
        event = getEvent(mockServer.requests, 'test event');
        Should(event).not.be.ok();

        clock.restore();

        done();
    });

    it('should run the callback once when tracking fails', function(done) {
        var clock = sinon.useFakeTimers();

        mParticle.init(apiKey, window.mParticle.config);

        var successCallbackCalled = false;
        var numberTimesCalled = 0;

        navigator.geolocation.shouldFail = true;

        mParticle.startTrackingLocation(function() {
            numberTimesCalled += 1;
            successCallbackCalled = true;
            mParticle.logEvent('test event');
        });

        // mock geo will successfully run after 1 second (geomock.js // navigator.geolocation.delay)
        clock.tick(1000);
        successCallbackCalled.should.equal(true);
        var event = getEvent(mockServer.requests, 'test event');
        event.should.have.property('lc', null);
        mockServer.requests = [];

        //this will hit the watch position again, but won't call the callback again
        clock.tick(1000);
        numberTimesCalled.should.equal(1);
        event = getEvent(mockServer.requests, 'test event');
        Should(event).not.be.ok();

        navigator.geolocation.shouldFail = false;

        clock.restore();

        done();
    });

    it('should pass the found or existing position to the callback in startTrackingLocation', function(done) {
        var clock = sinon.useFakeTimers();

        mParticle.init(apiKey, window.mParticle.config);

        var currentPosition;

        function callback(position) {
            currentPosition = position;
        }

        mParticle.startTrackingLocation(callback);

        // mock geo will successfully run after 1 second (geomock.js // navigator.geolocation.delay)
        clock.tick(1000);
        var latitudeResult = 52.5168;
        var longitudeResult = 13.3889;

        currentPosition.coords.latitude.should.equal(latitudeResult);
        currentPosition.coords.longitude.should.equal(longitudeResult);

        clock.restore();

        done();
    });

    it('should run the callback if tracking already exists', function(done) {
        var clock = sinon.useFakeTimers();

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.startTrackingLocation();

        var successCallbackCalled = false;

        function callback() {
            successCallbackCalled = true;
            mParticle.logEvent('test event');
        }

        mParticle.startTrackingLocation(callback);

        // mock geo will successfully run after 1 second (geomock.js // navigator.geolocation.delay)
        clock.tick(1000);
        successCallbackCalled.should.equal(true);
        var event = getEvent(mockServer.requests, 'test event');
        var latitudeResult = 52.5168;
        var longitudeResult = 13.3889;
        event.lc.lat.should.equal(latitudeResult);
        event.lc.lng.should.equal(longitudeResult);

        clock.restore();

        done();
    });

    it('should log appName in the payload on v3 endpoint when set on config prior to init', function (done) {
        mParticle.config.appName = 'a name';
        mParticle.config.flags = {
            eventsV3: '100',
            eventBatchingIntervalMillis: 0,
        }

        mParticle.init(apiKey, mParticle.config);

        window.fetchMock.post(
            'https://jssdks.mparticle.com/v3/JS/test_key/events',
            200
        );

        window.mParticle.logEvent('Test Event');

        var batch = JSON.parse(window.fetchMock.lastOptions().body);
            console.log(batch);
        batch.application_info.should.have.property('application_name', 'a name');

        delete window.mParticle.config.flags

        done();
    });

    it('should log appName in the payload on v3 endpoint when set on config prior to init', function (done) {
        mParticle.config.flags = {
            eventsV3: '100',
            eventBatchingIntervalMillis: 0,
        }

        mParticle.init(apiKey, mParticle.config);
        mParticle.setAppName('another name');

        window.fetchMock.post(
            'https://jssdks.mparticle.com/v3/JS/test_key/events',
            200
        );

        window.mParticle.logEvent('Test Event');

        var batch = JSON.parse(window.fetchMock.lastOptions().body);
        batch.application_info.should.have.property('application_name', 'another name');

        delete window.mParticle.config.flags

        done();
    });

    it('should log a batch to v3 with data planning in the payload', function (done) {
        mParticle.config.logLevel = 'verbose';
        mParticle.config.flags = {
            eventsV3: '100',
            eventBatchingIntervalMillis: 0,
        }
        mParticle.config.dataPlan = {
            planId: 'plan-slug',
            planVersion: 10,
        };

        mParticle.init(apiKey, mParticle.config);

        window.fetchMock.post(
            'https://jssdks.mparticle.com/v3/JS/test_key/events',
            200
        );

        window.mParticle.logEvent('Test Event');

        var batch = JSON.parse(window.fetchMock.lastOptions().body);

        batch.should.have.property('context');
        batch.context.should.have.property('data_plan');
        batch.context.data_plan.should.have.property('plan_version', 10);
        batch.context.data_plan.should.have.property('plan_id', 'plan-slug');

        delete window.mParticle.config.flags

        done();
    });

    it('should log a batch to v3 with no version if no version is passed', function (done) {
        mParticle.config.flags = {
            eventsV3: '100',
            eventBatchingIntervalMillis: 0,
        }
        mParticle.config.dataPlan = {
            planId: 'plan-slug'
        };

        mParticle.init(apiKey, mParticle.config);


        window.fetchMock.post(
            'https://jssdks.mparticle.com/v3/JS/test_key/events',
            200
        );

        window.mParticle.logEvent('Test Event');

        var batch = JSON.parse(window.fetchMock.lastOptions().body);

        batch.should.have.property('context');
        batch.context.should.have.property('data_plan');
        batch.context.data_plan.should.not.have.property('plan_version');
        batch.context.data_plan.should.have.property('plan_id', 'plan-slug');

        delete window.mParticle.config.flags

        done();
    });

    it('should log a batch to v3 with no context if no data plan is passed', function (done) {
        mParticle.config.flags = {
            eventsV3: '100',
            eventBatchingIntervalMillis: 0,
        }
        mParticle.config.dataPlan = {
            planVersion: 10
        };

        window.fetchMock.post(
            'https://jssdks.mparticle.com/v3/JS/test_key/events',
            200
        );

        mParticle.init(apiKey, mParticle.config);

        window.mParticle.logEvent('Test Event');

        var batch = JSON.parse(window.fetchMock.lastOptions().body);

        batch.should.not.have.property('context');

        delete window.mParticle.config.flags

        done();
    });

    it('should log an error if a non slug string is passed as the dataplan planId', function (done) {
        var errorMessage;
        
        mParticle.config.logLevel = 'verbose';
        mParticle.config.logger = {
            error: function(msg) {
                if (!errorMessage) {
                    errorMessage = msg;
                }
            }
        }
        mParticle.config.flags = {
            eventsV3: '100',
            eventBatchingIntervalMillis: 0,
        }
        mParticle.config.dataPlan = {
            planId: '--',
            planVersion: 10,
        };
        
        mParticle.init(apiKey, mParticle.config);
        window.fetchMock.post(
            'https://jssdks.mparticle.com/v3/JS/test_key/events',
            200
        );
            
        window.mParticle.logEvent('Test Event');

        errorMessage.should.equal('Your data plan id must be in a slug format')
        var batch = JSON.parse(window.fetchMock.lastOptions().body);
        batch.should.not.have.property('context');
        delete window.mParticle.config.flags

        done();
    });

    it('should log consent properly to v3 endpoint ', function (done) {
        mParticle.config.flags = {
            eventsV3: '100',
            eventBatchingIntervalMillis: 0,
        }
        mParticle.config.dataPlan = {
            planVersion: 10
        };

        window.fetchMock.post(
            'https://jssdks.mparticle.com/v3/JS/test_key/events',
            200
        );

        mParticle.init(apiKey, mParticle.config);

        var user = mParticle.Identity.getCurrentUser()
        // Add to your consent state
        var consentState = mParticle.Consent.createConsentState();

        var ccpa = mParticle.Consent.createCCPAConsent(
            true,
            Date.now(),
            "doc1",
            "location1",
            "hardwareid"
        );

        consentState.setCCPAConsentState(ccpa);
        var location_collection_consent = mParticle.Consent.createGDPRConsent(
            true,
            Date.now(),
            "doc1",
            "location1",
            "hardwareid"
        );

        // Add to your consent state
        consentState.addGDPRConsentState("My GDPR Purpose", location_collection_consent);
        user.setConsentState(consentState);

        window.mParticle.logEvent('Test Event');

        var batch = JSON.parse(window.fetchMock.lastOptions().body);

        batch.should.have.property('consent_state');
        batch.consent_state.should.have.properties(['gdpr', 'ccpa']);
        batch.consent_state.gdpr.should.have.property('my gdpr purpose');
        batch.consent_state.gdpr['my gdpr purpose'].should.have.property('consented', true);
        batch.consent_state.gdpr['my gdpr purpose'].should.have.property('document', 'doc1');
        batch.consent_state.gdpr['my gdpr purpose'].should.have.property('location', 'location1');
        batch.consent_state.gdpr['my gdpr purpose'].should.have.property('hardware_id', 'hardwareid');
        batch.consent_state.gdpr['my gdpr purpose'].should.have.property('timestamp_unixtime_ms');

        batch.consent_state.ccpa['data_sale_opt_out'].should.have.property('consented', true);
        batch.consent_state.ccpa['data_sale_opt_out'].should.have.property('document', 'doc1');
        batch.consent_state.ccpa['data_sale_opt_out'].should.have.property('location', 'location1');
        batch.consent_state.ccpa['data_sale_opt_out'].should.have.property('hardware_id', 'hardwareid');
        batch.consent_state.ccpa['data_sale_opt_out'].should.have.property('timestamp_unixtime_ms');

        delete window.mParticle.config.flags
        
        done();
    });
});
