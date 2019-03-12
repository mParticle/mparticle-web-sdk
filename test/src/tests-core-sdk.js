var TestsCore = require('./tests-core'),
    setLocalStorage = TestsCore.setLocalStorage,
    das = TestsCore.das,
    getEvent = TestsCore.getEvent,
    apiKey = TestsCore.apiKey,
    server = TestsCore.server,
    workspaceCookieName = TestsCore.workspaceCookieName,
    MessageType = TestsCore.MessageType;

describe('core SDK', function() {
    it('starts new session', function(done) {
        mParticle.startNewSession();

        var data = getEvent(MessageType.SessionStart);

        Should(data).be.ok();

        data.should.have.property('sid');

        done();
    });

    it('sessionIds are all capital letters', function(done) {
        var lowercaseLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

        var sessionId = mParticle.sessionManager.getSession();
        var lowercaseLetterExists;
        sessionId.split('').forEach(function(letter) {
            if (lowercaseLetters.indexOf(letter) > -1) {
                lowercaseLetterExists = true;
            }
        });

        Should(lowercaseLetterExists).not.be.ok();

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

    it('sanitizes attributes when attrs are provided', function(done) {
        var attrs = {
            valid: '123',
            invalid: ['123', '345']
        };

        var product = mParticle.eCommerce.createProduct('name', 'sku', 100, 1, 'variant', 'category', 'brand', 'position', 'coupon', attrs);
        product.Attributes.should.not.have.property('invalid');
        product.Attributes.should.have.property('valid');

        mParticle.eCommerce.logCheckout(1, 'visa', attrs);
        var event = getEvent('eCommerce - Checkout');
        event.attrs.should.not.have.property('invalid');
        event.attrs.should.have.property('valid');

        server.requests = [];
        mParticle.eCommerce.logProductAction(1, product, attrs);
        event = getEvent('eCommerce - AddToCart');
        event.attrs.should.not.have.property('invalid');
        event.attrs.should.have.property('valid');

        var transactionAttributes = mParticle.eCommerce.createTransactionAttributes('12345',
            'test-affiliation',
            'coupon-code',
            44334,
            600,
            200);

        server.requests = [];
        mParticle.eCommerce.logPurchase(transactionAttributes, product, false, attrs);
        event = getEvent('eCommerce - Purchase');
        event.attrs.should.not.have.property('invalid');
        event.attrs.should.have.property('valid');

        var promotion = mParticle.eCommerce.createPromotion('id', 'creative', 'name', 'position');

        server.requests = [];
        mParticle.eCommerce.logPromotion(1, promotion, attrs);
        event = getEvent('eCommerce - PromotionView');
        event.attrs.should.not.have.property('invalid');
        event.attrs.should.have.property('valid');

        server.requests = [];
        mParticle.eCommerce.logRefund(transactionAttributes, product, false, attrs);
        event = getEvent('eCommerce - Refund');
        event.attrs.should.not.have.property('invalid');
        event.attrs.should.have.property('valid');

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

        setLocalStorage();

        mParticle.init(apiKey);

        var deviceId = mParticle.getDeviceId();

        deviceId.should.equal(das);
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

        var cookieData = mParticle.persistence.getCookie();

        cookieData.gs.should.have.properties(['cgid']);
        cookieData.gs.should.not.have.property('sid');

        done();
    });

    it('creates a new session when elapsed time between actions is greater than session timeout', function(done) {
        mParticle.reset();
        var clock = sinon.useFakeTimers();
        mParticle.init(apiKey, {SessionTimeout: 1});
        clock.tick(100);
        mParticle.logEvent('Test Event');
        var data = getEvent('Test Event');

        clock.tick(70000);

        mParticle.logEvent('Test Event2');
        var data2 = getEvent('Test Event2');
        data.sid.should.not.equal(data2.sid);
        mParticle.sessionManager.clearSessionTimeout();
        clock.restore();

        done();
    });

    it('should end session when last event sent is outside of sessionTimeout', function(done) {
        mParticle.reset();
        var clock = sinon.useFakeTimers();

        mParticle.init(apiKey, {SessionTimeout: 1});
        clock.tick(100);
        mParticle.logEvent('Test Event');

        clock.tick(10000);
        mParticle.logEvent('Test Event2');

        clock.tick(120000);
        mParticle.logEvent('Test Event3');

        clock.tick(150000);

        var data1 = getEvent('Test Event');
        var data2 = getEvent('Test Event2');
        var data3 = getEvent('Test Event3');

        data2.sid.should.equal(data1.sid);
        data3.sid.should.not.equal(data1.sid);
        clock.restore();
        done();
    });

    it('should not end session when end session is called within sessionTimeout timeframe', function(done) {
        // This test mimics if another tab is open and events are sent, but previous tab's sessionTimeout is still ongoing
        mParticle.reset();
        var clock = sinon.useFakeTimers();
        mParticle.init(apiKey, {SessionTimeout: 1});

        server.requests = [];
        clock.tick(100);
        mParticle.logEvent('Test Event');

        // This clock tick initiates a session end event that is successful
        clock.tick(70000);

        var data1 = getEvent(2);
        Should(data1).be.ok();

        server.requests = [];

        clock.tick(100);
        mParticle.logEvent('Test Event2');

        var sid = mParticle.persistence.getLocalStorage().gs.sid;

        var newPersistence = {
            gs: {
                sid: sid,
                ie: 1,
                les: 120000
            }
        };
        setLocalStorage(workspaceCookieName, newPersistence);
        // This clock tick initiates a session end event that is not successful
        clock.tick(70000);
        var noData = getEvent(2);
        Should(noData).not.be.ok();
        var data2 = getEvent('Test Event2');

        mParticle.logEvent('Test Event3');

        var data3 = getEvent('Test Event3');
        data3.sid.should.equal(data2.sid);

        clock.restore();
        done();
    });

    it('should get sessionId', function(done) {
        mParticle.logEvent('Test Event');
        var data = getEvent('Test Event');

        var sessionId = mParticle.sessionManager.getSession();

        data.sid.should.equal(sessionId);

        done();
    });

    it('should use http when mParticle.forceHttps is false', function(done) {
        mParticle.forceHttps = false;
        server.requests = [];
        mParticle.logEvent('Test Event');
        server.requests[0].url.should.equal('http://jssdk.mparticle.com/v2/JS/test_key/Events');

        done();
    });

    it('should load SDK with the included api on init and not send events to previous apikey in persistence', function(done) {
        server.requests = [];
        mParticle.logEvent('Test Event');
        server.requests[0].url.should.equal('https://jssdks.mparticle.com/v2/JS/test_key/Events');

        mParticle.init('test');
        server.requests = [];
        mParticle.logEvent('test another');
        server.requests[0].url.should.equal('https://jssdks.mparticle.com/v2/JS/test/Events');

        done();
    });
});
