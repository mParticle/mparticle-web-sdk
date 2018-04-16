var TestsCore = require('./tests-core'),
    apiKey = TestsCore.apiKey,
    getEvent = TestsCore.getEvent,
    getLocalStorage = TestsCore.getLocalStorage,
    testMPID = TestsCore.testMPID,
    server = TestsCore.server,
    MockForwarder = TestsCore.MockForwarder;

describe('identities and attributes', function() {
    it('should set user attribute', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');

        mParticle.logEvent('test user attributes');

        var event = getEvent('test user attributes');

        event.should.have.property('ua');
        event.ua.should.have.property('gender', 'male');

        var cookies = getLocalStorage();
        cookies[testMPID].ua.should.have.property('gender', 'male');

        done();
    });

    it('should set user attribute be case insensitive', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'male');
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'female');

        mParticle.logEvent('test user attributes');

        var event = getEvent('test user attributes');

        var cookies = getLocalStorage();
        cookies[testMPID].ua.should.have.property('gender', 'female');

        event.should.have.property('ua');
        event.ua.should.have.property('gender', 'female');
        event.ua.should.not.have.property('Gender');

        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'male');

        mParticle.logEvent('test user attributes2');
        var event2 = getEvent('test user attributes2');
        event2.ua.should.have.property('Gender', 'male');
        event2.ua.should.not.have.property('gender');

        cookies = getLocalStorage();
        cookies[testMPID].ua.should.have.property('Gender', 'male');

        done();
    });

    it('should remove user attribute', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().removeUserAttribute('gender');

        mParticle.logEvent('test user attributes');

        var event = getEvent('test user attributes');
        event.should.not.have.property('gender');

        var cookies = getLocalStorage();
        Should(cookies[testMPID].ua).not.be.ok();

        done();
    });

    it('should remove user attribute case insensitive', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'male');
        mParticle.Identity.getCurrentUser().removeUserAttribute('gender');

        mParticle.logEvent('test user attributes');

        var event = getEvent('test user attributes');
        event.should.not.have.property('Gender');

        var cookies = getLocalStorage();
        Should(cookies[testMPID].ua).not.be.ok();

        done();
    });

    it('should set session attribute', function(done) {
        mParticle.setSessionAttribute('name', 'test');

        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.not.have.property('sa');

        mParticle.endSession();
        var sessionEndEvent = getEvent(2);

        sessionEndEvent.attrs.should.have.property('name', 'test');

        done();
    });

    it('should set session attribute case insensitive', function(done) {
        mParticle.setSessionAttribute('name', 'test');
        mParticle.setSessionAttribute('Name', 'test1');

        mParticle.endSession();

        var sessionEndEvent = getEvent(2);

        sessionEndEvent.attrs.should.have.property('name', 'test1');
        sessionEndEvent.attrs.should.not.have.property('Name');

        done();
    });

    it('should not set a session attribute\'s key as an object or array)', function(done) {
        mParticle.setSessionAttribute({key: 'value'}, 'test');
        mParticle.endSession();
        var sessionEndEvent1 = getEvent(2);

        mParticle.startNewSession();
        server.requests = [];
        mParticle.setSessionAttribute(['test'], 'test');
        mParticle.endSession();
        var sessionEndEvent2 = getEvent(2);

        Object.keys(sessionEndEvent1.attrs).length.should.equal(0);
        Object.keys(sessionEndEvent2.attrs).length.should.equal(0);

        done();
    });

    it('should remove session attributes when session ends', function(done) {
        mParticle.startNewSession();
        mParticle.setSessionAttribute('name', 'test');
        mParticle.endSession();

        server.requests = [];
        mParticle.startNewSession();
        mParticle.endSession();

        var sessionEndEvent = getEvent(2);

        sessionEndEvent.attrs.should.not.have.property('name');

        done();
    });

    it('should set and log position', function(done) {
        mParticle.setPosition(34.134103, -118.321694);
        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('lc');
        event.lc.should.have.property('lat', 34.134103);
        event.lc.should.have.property('lng', -118.321694);

        done();
    });

    it('should set user tag', function(done) {
        mParticle.Identity.getCurrentUser().setUserTag('test');

        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('ua');
        event.ua.should.have.property('test', null);

        var cookies = getLocalStorage();
        cookies[testMPID].ua.should.have.property('test');

        done();
    });

    it('should set user tag case insensitive', function(done) {
        mParticle.Identity.getCurrentUser().setUserTag('Test');
        mParticle.Identity.getCurrentUser().setUserTag('test');

        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('ua');
        event.ua.should.not.have.property('Test');
        event.ua.should.have.property('test');

        var cookies = getLocalStorage();
        cookies[testMPID].ua.should.have.property('test');

        done();
    });

    it('should remove user tag', function(done) {
        mParticle.Identity.getCurrentUser().setUserTag('test');
        mParticle.Identity.getCurrentUser().removeUserTag('test');

        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('ua');
        event.ua.should.not.have.property('test');

        var cookies = getLocalStorage();
        Should(cookies[testMPID].ua).not.be.ok();

        done();
    });

    it('should remove user tag case insensitive', function(done) {
        mParticle.Identity.getCurrentUser().setUserTag('Test');
        mParticle.Identity.getCurrentUser().removeUserTag('test');

        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('ua');
        event.ua.should.not.have.property('Test');

        var cookies = getLocalStorage();
        Should(cookies[testMPID].ua).not.be.ok();

        done();
    });

    it('should set user attribute list', function(done) {
        mParticle.reset();

        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [1, 2, 3, 4, 5]);

        mParticle.logEvent('test user attributes');

        var event = getEvent('test user attributes');

        event.should.have.property('ua');
        event.ua.should.have.property('numbers', [1, 2, 3, 4, 5]);

        var cookies = getLocalStorage();
        cookies[testMPID].ua.numbers.length.should.equal(5);

        done();
    });

    it('should set user attribute list case insensitive', function(done) {
        mParticle.reset();

        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [1, 2, 3, 4, 5]);
        mParticle.Identity.getCurrentUser().setUserAttributeList('Numbers', [1, 2, 3, 4, 5, 6]);

        mParticle.logEvent('test user attributes');

        var event = getEvent('test user attributes');
        var cookies = getLocalStorage();

        event.should.have.property('ua');
        event.ua.should.have.property('Numbers', [1, 2, 3, 4, 5, 6]);
        event.ua.should.not.have.property('numbers');
        cookies[testMPID].ua.Numbers.length.should.equal(6);

        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [1, 2, 3, 4, 5]);

        mParticle.logEvent('test user attributes2');
        var event2 = getEvent('test user attributes2');
        var cookies3 = getLocalStorage();

        event2.ua.should.have.property('numbers', [1, 2, 3, 4, 5]);
        event2.ua.should.not.have.property('Numbers');
        cookies3[testMPID].ua.numbers.length.should.equal(5);

        done();
    });

    it('should make a copy of user attribute list', function (done) {
        var list = [1, 2, 3, 4, 5];

        mParticle.reset();

        mParticle.init(apiKey);

        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', list);

        list.push(6);

        mParticle.logEvent('test user attributes');

        var event = getEvent('test user attributes');

        var cookies = getLocalStorage();

        cookies[testMPID].ua.numbers.length.should.equal(5);

        event.should.have.property('ua');
        event.ua.should.have.property('numbers').with.lengthOf(5);

        done();
    });

    it('should remove all user attributes', function(done) {
        mParticle.reset();

        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [1, 2, 3, 4, 5]);
        mParticle.Identity.getCurrentUser().removeAllUserAttributes();

        mParticle.logEvent('test user attributes');

        var event = getEvent('test user attributes');
        var cookies = getLocalStorage();

        event.should.have.property('ua', {});
        Should(cookies[testMPID].ua).not.be.ok();

        done();
    });

    it('should get user attribute lists', function(done) {
        mParticle.reset();

        mParticle.init(apiKey);

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [1, 2, 3, 4, 5]);

        var userAttributes = mParticle.Identity.getCurrentUser().getUserAttributesLists();

        userAttributes.should.have.property('numbers');
        userAttributes.should.not.have.property('gender');

        done();
    });

    it('should copy when calling get user attribute lists', function(done) {
        mParticle.reset();
        mParticle.init(apiKey);

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [1, 2, 3, 4, 5]);

        var userAttributes = mParticle.Identity.getCurrentUser().getUserAttributesLists();

        userAttributes['numbers'].push(6);

        var userAttributes1 = mParticle.Identity.getCurrentUser().getUserAttributesLists();
        userAttributes1['numbers'].should.have.lengthOf(5);

        done();
    });

    it('should copy when calling get user attributes', function(done) {
        mParticle.reset();
        mParticle.init(apiKey);

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [1, 2, 3, 4, 5]);

        var userAttributes = mParticle.Identity.getCurrentUser().getAllUserAttributes();

        userAttributes.blah = 'test';
        userAttributes['numbers'].push(6);

        var userAttributes1 = mParticle.Identity.getCurrentUser().getAllUserAttributes();

        userAttributes1['numbers'].should.have.lengthOf(5);
        userAttributes1.should.not.have.property('blah');

        done();
    });

    it('should get all user attributes', function(done) {
        mParticle.reset();

        mParticle.init(apiKey);

        mParticle.Identity.getCurrentUser().setUserAttribute('test', '123');
        mParticle.Identity.getCurrentUser().setUserAttribute('another test', 'blah');

        var attrs = mParticle.Identity.getCurrentUser().getAllUserAttributes();

        attrs.should.have.property('test', '123');
        attrs.should.have.property('another test', 'blah');

        done();
    });

    it('should not set user attribute list if value is not array', function(done) {
        mParticle.reset();
        mParticle.init(apiKey);

        mParticle.Identity.getCurrentUser().setUserAttributeList('mykey', 1234);

        var attrs = mParticle.Identity.getCurrentUser().getAllUserAttributes();

        attrs.should.not.have.property('mykey');

        done();
    });

    it('should not set bad session attribute value', function(done) {
        mParticle.setSessionAttribute('name', { bad: 'bad' });

        mParticle.endSession();

        var sessionEndEvent = getEvent(2);

        sessionEndEvent.attrs.should.not.have.property('name');

        done();
    });

    it('should not set a bad user attribute key or value', function(done) {
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', { bad: 'bad' });
        mParticle.logEvent('test bad user attributes1');
        var event1 = getEvent('test bad user attributes1');

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', ['bad', 'bad', 'bad']);
        mParticle.logEvent('test bad user attributes2');
        var event2 = getEvent('test bad user attributes2');

        mParticle.Identity.getCurrentUser().setUserAttribute({ bad: 'bad' }, 'male');
        mParticle.logEvent('test bad user attributes3');
        var event3 = getEvent('test bad user attributes3');

        mParticle.Identity.getCurrentUser().setUserAttribute(['bad', 'bad', 'bad'], 'female');
        mParticle.logEvent('test bad user attributes4');
        var event4 = getEvent('test bad user attributes4');

        mParticle.Identity.getCurrentUser().setUserAttribute(null, 'female');
        mParticle.logEvent('test bad user attributes5');
        var event5 = getEvent('test bad user attributes5');

        mParticle.Identity.getCurrentUser().setUserAttribute(undefined, 'female');
        mParticle.logEvent('test bad user attributes6');
        var event6 = getEvent('test bad user attributes6');

        event1.should.have.property('ua');
        event1.ua.should.not.have.property('gender');

        event2.should.have.property('ua');
        event2.ua.should.not.have.property('gender');

        event3.should.have.property('ua');
        event3.ua.should.not.have.property('gender');

        event4.should.have.property('ua');
        event4.ua.should.not.have.property('gender');

        event5.should.have.property('ua');
        event5.ua.should.not.have.property('gender');

        event6.should.have.property('ua');
        event6.ua.should.not.have.property('gender');

        done();
    });

    it('should get cart products', function(done) {
        var product1 = mParticle.eCommerce.createProduct('iPhone', 'SKU1', 1),
            product2 = mParticle.eCommerce.createProduct('Android', 'SKU2', 1);

        mParticle.eCommerce.Cart.add([product1, product2]);

        var cartProducts = mParticle.Identity.getCurrentUser().getCart().getCartProducts();

        cartProducts.length.should.equal(2);
        JSON.stringify(cartProducts[0]).should.equal(JSON.stringify(product1));
        JSON.stringify(cartProducts[1]).should.equal(JSON.stringify(product2));

        done();
    });
});
