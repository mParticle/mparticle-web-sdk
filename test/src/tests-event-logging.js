var TestsCore = require('./tests-core'),
    getEvent = TestsCore.getEvent,
    getIdentityEvent = TestsCore.getIdentityEvent,
    apiKey = TestsCore.apiKey,
    testMPID = TestsCore.testMPID,
    setLocalStorage = TestsCore.setLocalStorage,
    server = TestsCore.server,
    v1localStorageKey = TestsCore.v1localStorageKey,
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
        mParticle.reset();
        server.requests = [];

        setLocalStorage(v1localStorageKey, {cookie: 'test'});

        mParticle.init(apiKey);

        var data2 = getEvent(MessageType.AppStateTransition);
        data2.should.have.property('fr', false);

        done();
    });

    it('should log a page view', function(done) {
        mParticle.logPageView();

        var event = getEvent(window.location.pathname);

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
});
