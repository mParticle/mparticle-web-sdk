var TestsCore = require('./tests-core'),
    v1localStorageKey = TestsCore.v1localStorageKey,
    findCookie = TestsCore.findCookie,
    setLocalStorage = TestsCore.setLocalStorage,
    getEvent = TestsCore.getEvent,
    apiKey = TestsCore.apiKey,
    MessageType = TestsCore.MessageType;

describe('core SDK', function() {
    it('starts new session', function(done) {
        mParticle.startNewSession();

        var data = getEvent(MessageType.SessionStart);

        Should(data).be.ok();

        data.should.have.property('sid');

        done();
    });

    it('ends existing session with an event that includes SessionLength', function(done) {
        mParticle.startNewSession();
        mParticle.endSession();

        var data = getEvent(MessageType.SessionEnd);

        Should(data).be.ok();
        data.should.have.property('sl');

        done();
    });

    it('creates a new dateLastEventSent when logging an event, and retains the previous one when ending session', function(done) {
        mParticle.logEvent('Test Event1');
        var data1 = getEvent('Test Event1');

        setTimeout(function() {
            mParticle.logEvent('Test Event2');
            var data2 = getEvent('Test Event2');

            mParticle.endSession();
            var data3 = getEvent(MessageType.SessionEnd);

            var result1 = data1.ct === data2.ct;
            var result2 = data2.ct === data3.ct;

            Should(result1).not.be.ok();
            Should(result2).be.ok();

            done();
        }, 5);
    });

    it('should process ready queue when initialized', function(done) {
        var readyFuncCalled = false;

        mParticle.reset();
        mParticle.ready(function() { readyFuncCalled = true; });
        mParticle.init(apiKey);

        Should(readyFuncCalled).equal(true);

        done();
    });

    it('should set app version', function(done) {
        mParticle.setAppVersion('1.0');

        window.mParticle.logEvent('Test Event', mParticle.EventType.Navigation);
        var data = getEvent('Test Event');

        data.should.have.property('av', '1.0');

        done();
    });

    it('should get app version', function(done) {
        mParticle.setAppVersion('2.0');

        var appVersion = mParticle.getAppVersion();

        appVersion.should.equal('2.0');

        done();
    });

    it('should pass custom flags in page views', function(done) {
        mParticle.logPageView({
            'MyCustom.Flag': 'Test'
        });

        var event = getEvent(window.location.pathname);

        Should(event).be.ok();

        event.should.have.property('flags');
        event.flags.should.have.property('MyCustom.Flag', ['Test']);

        done();
    });

    it('should convert custom flag dictionary values to array', function(done) {
        mParticle.logPageView({
            'MyCustom.String': 'Test',
            'MyCustom.Number': 1,
            'MyCustom.Boolean': true,
            'MyCustom.Object': {},
            'MyCustom.Array': ['Blah', 'Hello', {}]
        });

        var event = getEvent(window.location.pathname);

        Should(event).be.ok();

        event.should.have.property('flags');
        event.flags.should.have.property('MyCustom.String', ['Test']);
        event.flags.should.have.property('MyCustom.Number', ['1']);
        event.flags.should.have.property('MyCustom.Boolean', ['true']);
        event.flags.should.not.have.property('MyCustom.Object');
        event.flags.should.have.property('MyCustom.Array', ['Blah', 'Hello']);

        done();
    });

    it('should set client id', function(done) {
        window.mParticle.logEvent('Test Event', mParticle.EventType.Navigation);
        var data = getEvent('Test Event');

        data.should.have.property('cgid').with.lengthOf(36);

        done();
    });

    it('should sanitize event attributes', function(done) {
        mParticle.logEvent('sanitized event', 1, {
            key1: 'value1',
            mydate: new Date(),
            ishouldberemoved: {
                test: 'test'
            },
            ishouldalsoberemoved: ['test'],
            removeme: new Error()
        });

        var event = getEvent('sanitized event');

        event.attrs.should.have.property('key1', 'value1');
        event.attrs.should.have.property('mydate');
        event.attrs.should.not.have.property('ishouldberemoved');
        event.attrs.should.not.have.property('ishouldalsoberemoved');
        event.attrs.should.not.have.property('removeme');

        done();
    });

    it('should return the deviceId when provided with serverSettings', function(done) {
        var serverSettings = {
            uid: {
                Expires: '2027-05-09T02:03:06.368056Z',
                Value: 'u=6100647832327797727&cr=3869403&g=7b0a8d4e-b144-4259-b491-1b3cf76af453&ls=3870112&lbe=3870112'
            }
        };

        var deviceId = mParticle.persistence.parseDeviceId(serverSettings);
        deviceId.should.equal('7b0a8d4e-b144-4259-b491-1b3cf76af453');

        done();
    });

    it('should create a deviceId when there are no serverSettings', function(done) {
        var serverSettings = null;

        var deviceId = mParticle.persistence.parseDeviceId(serverSettings);

        Should(deviceId).be.ok();

        done();
    });

    it('should not generate a new device ID if a deviceId exists in localStorage', function(done) {
        mParticle.reset();

        var guid = '7b0a8d4e-b144-4259-b491-1b3cf76af453';
        setLocalStorage(v1localStorageKey, {das: guid});

        mParticle.init(apiKey);

        var deviceId = mParticle.getDeviceId();

        deviceId.should.equal(guid);
        done();
    });

    it('should return the deviceId when requested', function(done) {
        var deviceId = mParticle.getDeviceId();

        Should(deviceId).be.ok();
        deviceId.length.should.equal(36);

        done();
    });

    it('will create a cgid when no previous cgid exists after initializing storage, and no sid', function(done) {
        mParticle.reset();
        window.mParticle.useCookieStorage = true;

        mParticle.persistence.initializeStorage();
        mParticle.persistence.update();

        var cookieData = findCookie();

        cookieData.gs.should.have.properties(['cgid']);
        cookieData.gs.should.not.have.property('sid');

        done();
    });

    it('creates a new session when elapsed time between actions is greater than session timeout', function(done) {
        mParticle.reset();
        mParticle.init(apiKey, {SessionTimeout: .0000001});
        mParticle.logEvent('Test Event');
        var data = getEvent('Test Event');

        setTimeout(function() {
            mParticle.logEvent('Test Event2');
            data2 = getEvent('Test Event2');
            data.sid.should.not.equal(data2.sid);
            mParticle.sessionManager.clearSessionTimeout();
            done();
        }, 10);
    });

    it('should get sessionId', function(done) {
        mParticle.logEvent('Test Event');
        var data = getEvent('Test Event');

        var sessionId = mParticle.sessionManager.getSession();

        data.sid.should.equal(sessionId);

        done();
    });
});
