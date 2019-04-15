var TestsCore = require('./tests-core'),
    getEvent = TestsCore.getEvent,
    getIdentityEvent = TestsCore.getIdentityEvent,
    apiKey = TestsCore.apiKey,
    testMPID = TestsCore.testMPID,
    setLocalStorage = TestsCore.setLocalStorage,
    server = TestsCore.server,
    MPConfig = TestsCore.MPConfig,
    MessageType = TestsCore.MessageType;

describe('event logging', function() {
    it('should log an event', function(done) {
        window.mParticle.logEvent('Test Event', mParticle.EventType.Navigation, { mykey: 'myvalue' });
        var data = getEvent('Test Event');

        data.should.have.property('n', 'Test Event');
        data.should.have.property('et', mParticle.EventType.Navigation);
        data.should.have.property('attrs');
        data.should.have.property('mpid', testMPID);
        data.attrs.should.have.property('mykey', 'myvalue');

        done();
    });

    it('should log an error', function(done) {
        mParticle.logError('my error');

        var data = getEvent('Error');

        Should(data).be.ok();

        data.should.have.property('n', 'Error');
        data.should.have.property('attrs');
        data.attrs.should.have.property('m', 'my error');

        done();
    });

    it('should log an AST with firstRun = true when first visiting a page', function(done) {
        var data = getEvent(MessageType.AppStateTransition);
        data.should.have.property('at', 1);
        data.should.have.property('fr', true);
        data.should.have.property('iu', false);
        if (document.referrer && document.referrer.length > 0) {
            data.should.have.property('lr', window.location.href);
        }

        done();
    });

    it('should log an AST on init with firstRun = false when cookies already exist', function(done) {
        mParticle.reset(MPConfig);
        server.requests = [];

        setLocalStorage();

        mParticle.init(apiKey);

        var data2 = getEvent(MessageType.AppStateTransition);
        data2.should.have.property('fr', false);

        done();
    });

    it('should log a page view', function(done) {
        mParticle.logPageView();

        var event = getEvent('PageView');

        Should(event).be.ok();

        event.should.have.property('attrs');
        event.attrs.should.have.property('hostname', window.location.hostname);
        event.attrs.should.have.property('title', window.document.title);

        done();
    });

    it('should log custom page view', function(done) {
        mParticle.logPageView('My Page View', { testattr: 1 }, {
            'MyCustom.Flag': 'Test'
        });

        var event = getEvent('My Page View');

        event.should.have.property('attrs');
        event.attrs.should.have.property('testattr', 1);

        event.should.have.property('flags');
        event.flags.should.have.property('MyCustom.Flag', ['Test']);

        done();
    });

    it('should pass custom flags in page views', function(done) {
        mParticle.logPageView('test', null, {
            'MyCustom.Flag': 'Test'
        });

        var event = getEvent('test');

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
            'MyCustom.Array': ['Blah', 'Hello', {}]
        });

        var event = getEvent('test');

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
        var event2 = getEvent('test1');

        Should(event2).not.be.ok();

        done();
    });

    it('should not log an event that has an invalid customFlags', function(done) {
        mParticle.logPageView('test', null, 'invalid');
        var event1 = getEvent('test');
        Should(event1).not.be.ok();

        done();
    });

    it('should log event with name PageView when an invalid event name is passed', function(done) {
        server.requests = [];
        mParticle.logPageView(null);
        server.requests.length.should.equal(1);
        var event1 = getEvent('PageView');
        event1.n.should.equal('PageView');

        server.requests = [];
        mParticle.logPageView({test: 'test'});
        server.requests.length.should.equal(1);
        var event2 = getEvent('PageView');
        event2.n.should.equal('PageView');

        server.requests = [];
        mParticle.logPageView([1, 2, 3]);
        server.requests.length.should.equal(1);
        var event3 = getEvent('PageView');
        event3.n.should.equal('PageView');

        done();
    });

    it('should log opt out', function(done) {
        mParticle.setOptOut(true);

        var event = getEvent(MessageType.OptOut);

        event.should.have.property('dt', MessageType.OptOut);
        event.should.have.property('o', true);

        done();
    });

    it('should parse response after logging event', function(done) {
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {
                    testprop: {
                        Expires: new Date(2040, 1, 1),
                        Value: 'blah'
                    }
                }
            }));
        };

        mParticle.logEvent('test event2');
        mParticle.logEvent('test event');
        var event = getEvent('test event');

        event.should.have.property('str');
        event.str.should.have.property('testprop');
        event.str.testprop.should.have.property('Value', 'blah');

        done();
    });

    it('log event requires name', function(done) {
        server.requests = [];
        mParticle.logEvent();

        Should(server.requests).have.lengthOf(0);

        done();
    });

    it('log event requires valid event type', function(done) {
        server.requests = [];
        mParticle.logEvent('test', 100);

        Should(server.requests).have.lengthOf(0);

        done();
    });

    it('event attributes must be object', function(done) {
        mParticle.logEvent('test', null, 1);

        var data = getEvent('test');

        data.should.have.property('attrs', null);

        done();
    });

    it('opting out should prevent events being sent', function(done) {
        mParticle.setOptOut(true);
        server.requests = [];

        mParticle.logEvent('test');
        server.requests.should.have.lengthOf(0);

        done();
    });

    it('after logging optout, and reloading, events still should not be sent until opt out is enabled when using local storage', function(done) {
        mParticle.setOptOut(true);
        server.requests = [];

        mParticle.logEvent('test');
        server.requests.should.have.lengthOf(0);
        mParticle.setOptOut(false);

        mParticle.init(apiKey);
        server.requests = [];
        mParticle.logEvent('test');
        server.requests.should.have.lengthOf(1);

        mParticle.setOptOut(true);
        mParticle.init(apiKey);
        server.requests = [];
        mParticle.logEvent('test');
        server.requests.should.have.lengthOf(0);

        done();
    });

    it('after logging optout, and reloading, events still should not be sent until opt out is enabled when using cookie storage', function(done) {
        mParticle.config.useCookieStorage = true;
        mParticle.init(apiKey);
        mParticle.setOptOut(true);
        server.requests = [];

        mParticle.logEvent('test');
        server.requests.should.have.lengthOf(0);
        mParticle.setOptOut(false);

        mParticle.init(apiKey);
        server.requests = [];
        mParticle.logEvent('test');
        server.requests.should.have.lengthOf(1);

        mParticle.setOptOut(true);
        mParticle.init(apiKey);
        server.requests = [];
        mParticle.logEvent('test');
        server.requests.should.have.lengthOf(0);

        done();
    });

    it('should log logout event', function(done) {
        mParticle.Identity.logout();
        var data = getIdentityEvent('logout');
        data.should.have.properties('client_sdk', 'environment', 'previous_mpid', 'request_id', 'request_timestamp_ms', 'context');

        done();
    });

    it('should log login event', function(done) {
        mParticle.Identity.login();
        var data = getIdentityEvent('login');
        data.should.have.properties('client_sdk', 'environment', 'previous_mpid', 'request_id', 'request_timestamp_ms', 'context');

        done();
    });

    it('should log modify event', function(done) {
        mParticle.Identity.modify();
        var data = getIdentityEvent('modify');
        data.should.have.properties('client_sdk', 'environment', 'identity_changes', 'request_id', 'request_timestamp_ms', 'context');

        done();
    });

    it('should send das with each event logged', function(done) {
        window.mParticle.logEvent('Test Event');
        var data = getEvent('Test Event');

        data.should.have.property('das');
        (data.das.length).should.equal(36);
        done();
    });

    it('should send consent state with each event logged', function(done) {

        var consentState = mParticle.Consent.createConsentState();
        consentState.addGDPRConsentState('foo purpose',
            mParticle.Consent.createGDPRConsent(true, 10, 'foo document', 'foo location', 'foo hardwareId'));
        mParticle.Identity.getCurrentUser().setConsentState(consentState);

        window.mParticle.logEvent('Test Event');
        var data = getEvent('Test Event');

        data.should.have.property('con');
        data.con.should.have.property('gdpr');
        data.con.gdpr.should.have.property('foo purpose');
        var purpose = data.con.gdpr['foo purpose'];
        purpose.should.have.property('ts', 10);
        purpose.should.have.property('d', 'foo document');
        purpose.should.have.property('l', 'foo location');
        purpose.should.have.property('h', 'foo hardwareId');

        mParticle.Identity.getCurrentUser().setConsentState(null);

        window.mParticle.logEvent('Test Event');
        data = getEvent('Test Event');
        data.should.have.not.property('con');

        done();
    });

    it('should log integration attributes with each event', function(done) {
        mParticle.setIntegrationAttribute(128, {MCID: 'abcdefg'});
        mParticle.logEvent('Test Event');
        var data = getEvent('Test Event');

        data.should.have.property('ia');
        data.ia.should.have.property('128');
        data.ia['128'].should.have.property('MCID', 'abcdefg');

        done();
    });

    it('should run the callback once when tracking succeeds', function(done) {
        mParticle.reset(MPConfig);
        var clock = sinon.useFakeTimers();

        mParticle.init(apiKey);

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
        var event = getEvent('test event');
        event.lc.lat.should.equal(52.5168);
        event.lc.lng.should.equal(13.3889);
        server.requests = [];
        //this will hit the watch position again, but won't call the callback again
        clock.tick(1000);
        numberTimesCalled.should.equal(1);
        event = getEvent('test event');
        Should(event).not.be.ok();

        clock.restore();

        done();
    });

    it('should run the callback once when tracking fails', function(done) {
        mParticle.reset(MPConfig);
        var clock = sinon.useFakeTimers();

        mParticle.init(apiKey);

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
        var event = getEvent('test event');
        event.should.have.property('lc', null);
        server.requests = [];

        //this will hit the watch position again, but won't call the callback again
        clock.tick(1000);
        numberTimesCalled.should.equal(1);
        event = getEvent('test event');
        Should(event).not.be.ok();

        navigator.geolocation.shouldFail = false;

        clock.restore();

        done();
    });

    it('should pass the found or existing position to the callback in startTrackingLocation', function(done) {
        mParticle.reset(MPConfig);
        var clock = sinon.useFakeTimers();

        mParticle.init(apiKey);

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
        mParticle.reset(MPConfig);
        var clock = sinon.useFakeTimers();

        mParticle.init(apiKey);

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
        var event = getEvent('test event');
        var latitudeResult = 52.5168;
        var longitudeResult = 13.3889;
        event.lc.lat.should.equal(latitudeResult);
        event.lc.lng.should.equal(longitudeResult);

        clock.restore();

        done();
    });
});
