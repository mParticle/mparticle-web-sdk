import Utils from './config/utils';
import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { urls, apiKey,
    testMPID,
    MPConfig } from './config/constants';

const findEventFromRequest = Utils.findEventFromRequest,
    findBatch = Utils.findBatch,
    getLocalStorage = Utils.getLocalStorage, 
    MockForwarder = Utils.MockForwarder;
let mockServer;

describe('identities and attributes', function() {
    beforeEach(function() {
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        fetchMock.post(urls.events, 200);
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
    });

    it('should set user attribute', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');

        mParticle.logEvent('test user attributes');

        const event = findBatch(fetchMock.calls(), 'test user attributes');

        event.should.have.property('user_attributes');
        event.user_attributes.should.have.property('gender', 'male');

        const cookies = getLocalStorage();
        cookies[testMPID].ua.should.have.property('gender', 'male');

        done();
    });

    it('should set user attribute be case insensitive', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'male');
        mParticle.Identity.getCurrentUser().setUserAttribute(
            'gender',
            'female'
        );

        mParticle.logEvent('test user attributes');

        const event = findBatch(fetchMock.calls(), 'test user attributes');

        let cookies = getLocalStorage();
        cookies[testMPID].ua.should.have.property('gender', 'female');

        event.should.have.property('user_attributes');
        event.user_attributes.should.have.property('gender', 'female');
        event.user_attributes.should.not.have.property('Gender');

        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'male');

        mParticle.logEvent('test user attributes2');
        const event2 = findBatch(fetchMock.calls(), 'test user attributes2');
        event2.user_attributes.should.have.property('Gender', 'male');
        event2.user_attributes.should.not.have.property('gender');

        cookies = getLocalStorage();
        cookies[testMPID].ua.should.have.property('Gender', 'male');

        done();
    });

    it('should set multiple user attributes with setUserAttributes', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.getCurrentUser().setUserAttributes({
            gender: 'male',
            age: 21,
        });

        mParticle.logEvent('test user attributes');

        const event = findBatch(fetchMock.calls(), 'test user attributes');

        const cookies = getLocalStorage();
        cookies[testMPID].ua.should.have.property('gender', 'male');
        cookies[testMPID].ua.should.have.property('age', 21);

        event.should.have.property('user_attributes');
        event.user_attributes.should.have.property('gender', 'male');
        event.user_attributes.should.have.property('age', 21);

        done();
    });

    it('should remove user attribute', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().removeUserAttribute('gender');

        mParticle.logEvent('test user attributes');

        const event = findBatch(fetchMock.calls(), 'test user attributes');
        event.user_attributes.should.not.have.property('gender');

        const cookies = getLocalStorage();
        Should(cookies[testMPID].ua).not.be.ok();

        done();
    });

    it('should remove user attribute case insensitive', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'male');
        mParticle.Identity.getCurrentUser().removeUserAttribute('gender');

        mParticle.logEvent('test user attributes');

        const event = findBatch(fetchMock.calls(), 'test user attributes');
        event.user_attributes.should.not.have.property('Gender');

        const cookies = getLocalStorage();
        Should(cookies[testMPID].ua).not.be.ok();

        done();
    });

    it('should set session attribute', function(done) {
        mParticle.setSessionAttribute('name', 'test');

        mParticle.logEvent('test event');

        const event = findEventFromRequest(fetchMock.calls(), 'test event');

        Should(event.data.custom_attributes).equal(null);

        mParticle.endSession();
        const sessionEndEvent = findEventFromRequest(fetchMock.calls(), 'session_end');

        sessionEndEvent.data.custom_attributes.should.have.property('name', 'test');

        done();
    });

    it('should set session attribute case insensitive', function(done) {
        mParticle.setSessionAttribute('name', 'test');
        mParticle.setSessionAttribute('Name', 'test1');

        mParticle.endSession();

        const sessionEndEvent = findEventFromRequest(fetchMock.calls(), 'session_end');

        sessionEndEvent.data.custom_attributes.should.have.property('name', 'test1');
        sessionEndEvent.data.custom_attributes.should.not.have.property('Name');

        done();
    });

    it("should not set a session attribute's key as an object or array)", function(done) {
        mParticle.setSessionAttribute({ key: 'value' }, 'test');
        mParticle.endSession();
        const sessionEndEvent1 = findEventFromRequest(fetchMock.calls(), 'session_end');

        mParticle.startNewSession();
        fetchMock.resetHistory();
        mParticle.setSessionAttribute(['test'], 'test');
        mParticle.endSession();
        const sessionEndEvent2 = findEventFromRequest(fetchMock.calls(), 'session_end');

        Object.keys(sessionEndEvent1.data.custom_attributes).length.should.equal(0);
        Object.keys(sessionEndEvent2.data.custom_attributes).length.should.equal(0);

        done();
    });

    it('should remove session attributes when session ends', function(done) {
        mParticle.startNewSession();
        mParticle.setSessionAttribute('name', 'test');
        mParticle.endSession();

        fetchMock.resetHistory();
        mParticle.startNewSession();
        mParticle.endSession();

        const sessionEndEvent = findEventFromRequest(fetchMock.calls(), 'session_end');

        sessionEndEvent.data.custom_attributes.should.not.have.property('name');

        done();
    });

    it('should set and log position', function(done) {
        mParticle.setPosition(34.134103, -118.321694);
        mParticle.logEvent('Test Event');

        const event = findEventFromRequest(fetchMock.calls(), 'Test Event');

        event.data.should.have.property('location');
        event.data.location.should.have.property('latitude', 34.134103);
        event.data.location.should.have.property('longitude', -118.321694);

        done();
    });

    it('should set user tag', function(done) {
        mParticle.Identity.getCurrentUser().setUserTag('test');

        mParticle.logEvent('Test Event');

        const event = findBatch(fetchMock.calls(), 'Test Event');

        event.should.have.property('user_attributes');
        event.user_attributes.should.have.property('test', null);

        const cookies = getLocalStorage();
        cookies[testMPID].ua.should.have.property('test');

        done();
    });

    it('should set user tag case insensitive', function(done) {
        mParticle.Identity.getCurrentUser().setUserTag('Test');
        mParticle.Identity.getCurrentUser().setUserTag('test');

        mParticle.logEvent('Test Event');

        const event = findBatch(fetchMock.calls(), 'Test Event');

        event.should.have.property('user_attributes');
        event.user_attributes.should.not.have.property('Test');
        event.user_attributes.should.have.property('test');

        const cookies = getLocalStorage();
        cookies[testMPID].ua.should.have.property('test');

        done();
    });

    it('should remove user tag', function(done) {
        mParticle.Identity.getCurrentUser().setUserTag('test');
        mParticle.Identity.getCurrentUser().removeUserTag('test');

        mParticle.logEvent('test event');

        const event = findBatch(fetchMock.calls(), 'test event');

        event.should.have.property('user_attributes');
        event.user_attributes.should.not.have.property('test');

        const cookies = getLocalStorage();
        Should(cookies[testMPID].ua).not.be.ok();

        done();
    });

    it('should remove user tag case insensitive', function(done) {
        mParticle.Identity.getCurrentUser().setUserTag('Test');
        mParticle.Identity.getCurrentUser().removeUserTag('test');

        mParticle.logEvent('test event');

        const event = findBatch(fetchMock.calls(), 'test event');

        event.should.have.property('user_attributes');
        event.user_attributes.should.not.have.property('Test');

        const cookies = getLocalStorage();
        Should(cookies[testMPID].ua).not.be.ok();

        done();
    });

    it('should set user attribute list', function(done) {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [
            1,
            2,
            3,
            4,
            5,
        ]);

        mParticle.logEvent('test user attributes');

        const event = findBatch(fetchMock.calls(), 'test user attributes');

        event.should.have.property('user_attributes');
        event.user_attributes.should.have.property('numbers', [1, 2, 3, 4, 5]);

        const cookies = getLocalStorage();
        cookies[testMPID].ua.numbers.length.should.equal(5);

        done();
    });

    it('should set user attribute list case insensitive', function(done) {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [
            1,
            2,
            3,
            4,
            5,
        ]);
        mParticle.Identity.getCurrentUser().setUserAttributeList('Numbers', [
            1,
            2,
            3,
            4,
            5,
            6,
        ]);

        mParticle.logEvent('test user attributes');

        const event = findBatch(fetchMock.calls(), 'test user attributes');
        const cookies = getLocalStorage();

        event.should.have.property('user_attributes');
        event.user_attributes.should.have.property('Numbers', [1, 2, 3, 4, 5, 6]);
        event.user_attributes.should.not.have.property('numbers');
        cookies[testMPID].ua.Numbers.length.should.equal(6);

        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [
            1,
            2,
            3,
            4,
            5,
        ]);

        mParticle.logEvent('test user attributes2');
        const event2 = findBatch(fetchMock.calls(), 'test user attributes2');
        const cookies3 = getLocalStorage();

        event2.user_attributes.should.have.property('numbers', [1, 2, 3, 4, 5]);
        event2.user_attributes.should.not.have.property('Numbers');
        cookies3[testMPID].ua.numbers.length.should.equal(5);

        done();
    });

    it('should make a copy of user attribute list', function(done) {
        const list = [1, 2, 3, 4, 5];

        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.Identity.getCurrentUser().setUserAttributeList(
            'numbers',
            list
        );

        list.push(6);

        mParticle.logEvent('test user attributes');

        const event = findBatch(fetchMock.calls(), 'test user attributes');

        const cookies = getLocalStorage();

        cookies[testMPID].ua.numbers.length.should.equal(5);

        event.should.have.property('user_attributes');
        event.user_attributes.should.have.property('numbers').with.lengthOf(5);

        done();
    });

    it('should remove all user attributes', function(done) {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [
            1,
            2,
            3,
            4,
            5,
        ]);
        mParticle.Identity.getCurrentUser().removeAllUserAttributes();

        mParticle.logEvent('test user attributes');

        const event = findBatch(fetchMock.calls(), 'test user attributes');
        const cookies = getLocalStorage();

        event.should.have.property('user_attributes', {});
        Should(cookies[testMPID].ua).not.be.ok();

        done();
    });

    it('should get user attribute lists', function(done) {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [
            1,
            2,
            3,
            4,
            5,
        ]);

        const userAttributes = mParticle.Identity.getCurrentUser().getUserAttributesLists();

        userAttributes.should.have.property('numbers');
        userAttributes.should.not.have.property('gender');

        done();
    });

    it('should copy when calling get user attribute lists', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.init(apiKey, window.mParticle.config);

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [
            1,
            2,
            3,
            4,
            5,
        ]);

        const userAttributes = mParticle.Identity.getCurrentUser().getUserAttributesLists();

        userAttributes['numbers'].push(6);

        const userAttributes1 = mParticle.Identity.getCurrentUser().getUserAttributesLists();
        userAttributes1['numbers'].should.have.lengthOf(5);

        done();
    });

    it('should copy when calling get user attributes', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.init(apiKey, window.mParticle.config);

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [
            1,
            2,
            3,
            4,
            5,
        ]);

        const userAttributes = mParticle.Identity.getCurrentUser().getAllUserAttributes();

        userAttributes.blah = 'test';
        userAttributes['numbers'].push(6);

        const userAttributes1 = mParticle.Identity.getCurrentUser().getAllUserAttributes();

        userAttributes1['numbers'].should.have.lengthOf(5);
        userAttributes1.should.not.have.property('blah');

        done();
    });

    it('should get all user attributes', function(done) {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.Identity.getCurrentUser().setUserAttribute('test', '123');
        mParticle.Identity.getCurrentUser().setUserAttribute(
            'another test',
            'blah'
        );

        const attrs = mParticle.Identity.getCurrentUser().getAllUserAttributes();

        attrs.should.have.property('test', '123');
        attrs.should.have.property('another test', 'blah');

        done();
    });

    it('should not set user attribute list if value is not array', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.init(apiKey, window.mParticle.config);

        mParticle.Identity.getCurrentUser().setUserAttributeList('mykey', 1234);

        const attrs = mParticle.Identity.getCurrentUser().getAllUserAttributes();

        attrs.should.not.have.property('mykey');

        done();
    });

    it('should not set bad session attribute value', function(done) {
        mParticle.setSessionAttribute('name', { bad: 'bad' });

        mParticle.endSession();

        const sessionEndEvent = findEventFromRequest(fetchMock.calls(), 'session_end');

        sessionEndEvent.data.custom_attributes.should.not.have.property('name');

        done();
    });

    it('should not set a bad user attribute key or value', function(done) {
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', {
            bad: 'bad',
        });
        mParticle.logEvent('test bad user attributes1');
        const event1 = findBatch(fetchMock.calls(), 'test bad user attributes1');

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', [
            'bad',
            'bad',
            'bad',
        ]);
        mParticle.logEvent('test bad user attributes2');
        const event2 = findBatch(fetchMock.calls(), 'test bad user attributes2');

        mParticle.Identity.getCurrentUser().setUserAttribute(
            { bad: 'bad' },
            'male'
        );
        mParticle.logEvent('test bad user attributes3');
        const event3 = findBatch(fetchMock.calls(), 'test bad user attributes3');

        mParticle.Identity.getCurrentUser().setUserAttribute(
            ['bad', 'bad', 'bad'],
            'female'
        );
        mParticle.logEvent('test bad user attributes4');
        const event4 = findBatch(fetchMock.calls(), 'test bad user attributes4');

        mParticle.Identity.getCurrentUser().setUserAttribute(null, 'female');
        mParticle.logEvent('test bad user attributes5');
        const event5 = findBatch(fetchMock.calls(), 'test bad user attributes5');

        mParticle.Identity.getCurrentUser().setUserAttribute(
            undefined,
            'female'
        );
        mParticle.logEvent('test bad user attributes6');
        const event6 = findBatch(fetchMock.calls(), 'test bad user attributes6');

        event1.should.have.property('user_attributes');
        event1.user_attributes.should.not.have.property('gender');

        event2.should.have.property('user_attributes');
        event2.user_attributes.should.not.have.property('gender');

        event3.should.have.property('user_attributes');
        event3.user_attributes.should.not.have.property('gender');

        event4.should.have.property('user_attributes');
        event4.user_attributes.should.not.have.property('gender');

        event5.should.have.property('user_attributes');
        event5.user_attributes.should.not.have.property('gender');

        event6.should.have.property('user_attributes');
        event6.user_attributes.should.not.have.property('gender');

        done();
    });

    it('should get cart products', function(done) {
        const product1 = mParticle.eCommerce.createProduct('iPhone', 'SKU1', 1),
            product2 = mParticle.eCommerce.createProduct('Android', 'SKU2', 1);

        mParticle.eCommerce.Cart.add([product1, product2]);

        const cartProducts = mParticle.Identity.getCurrentUser()
            .getCart()
            .getCartProducts();

        cartProducts.length.should.equal(2);
        JSON.stringify(cartProducts[0]).should.equal(JSON.stringify(product1));
        JSON.stringify(cartProducts[1]).should.equal(JSON.stringify(product2));

        done();
    });

    it('should send user attribute change requests when setting new attributes', function(done) {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);

        // set a new attribute, age
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute('age', '25');

        let body = JSON.parse(fetchMock.lastOptions().body)
        body.user_attributes.should.have.property('age', '25')
        let event = body.events[0];
        event.should.be.ok();
        event.event_type.should.equal('user_attribute_change');
        event.data.new.should.equal('25');
        (event.data.old === null).should.equal(true);
        event.data.user_attribute_name.should.equal('age');
        event.data.deleted.should.equal(false);
        event.data.is_new_attribute.should.equal(true);

        // change age attribute
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute('age', '30');
        body = JSON.parse(fetchMock.lastOptions().body);
        body.user_attributes.should.have.property('age', '30')
        event = body.events[0];
        event.event_type.should.equal('user_attribute_change');
        event.data.new.should.equal('30');
        event.data.old.should.equal('25');
        event.data.user_attribute_name.should.equal('age');
        event.data.deleted.should.equal(false);
        event.data.is_new_attribute.should.equal(false);

        // removes age attribute
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().removeUserAttribute('age');
        body = JSON.parse(fetchMock.lastOptions().body);
        body.user_attributes.should.not.have.property('age');
        event = body.events[0];
        event.event_type.should.equal('user_attribute_change');
        (event.data.new === null).should.equal(true);
        event.data.old.should.equal('30');
        event.data.user_attribute_name.should.equal('age');
        event.data.deleted.should.equal(true);
        event.data.is_new_attribute.should.equal(false);

        // set a user attribute list
        fetchMock.resetHistory();

        mParticle.Identity.getCurrentUser().setUserAttributeList('age', [
            'test1',
            'test2',
        ]);
        body = JSON.parse(fetchMock.lastOptions().body);

        body.user_attributes.age[0].should.equal('test1');
        body.user_attributes.age[1].should.equal('test2');
        event = body.events[0];
        event.event_type.should.equal('user_attribute_change');
        let obj = {
            test1: true,
            test2: true,
        };
        event.data.new.forEach(function(userAttr) {
            obj[userAttr].should.equal(true);
        });
        (event.data.old === null).should.equal(true);
        event.data.user_attribute_name.should.equal('age');
        event.data.deleted.should.equal(false);
        event.data.is_new_attribute.should.equal(true);

        // changes ordering of above attribute list
        fetchMock.resetHistory();

        mParticle.Identity.getCurrentUser().setUserAttributeList('age', [
            'test2',
            'test1',
        ]);
        body = JSON.parse(fetchMock.lastOptions().body);
        body.user_attributes.age[0].should.equal('test2');
        body.user_attributes.age[1].should.equal('test1');

        event = JSON.parse(fetchMock.lastOptions().body).events[0];
        event.event_type.should.equal('user_attribute_change');
        obj = {
            test1: true,
            test2: true,
        };
        event.data.new.forEach(function(userAttr) {
            obj[userAttr].should.equal(true);
        });

        (event.data.old[0] === 'test1').should.equal(true);
        (event.data.old[1] === 'test2').should.equal(true);
        event.data.user_attribute_name.should.equal('age');
        event.data.deleted.should.equal(false);
        event.data.is_new_attribute.should.equal(false);

        delete window.mParticle.config.flags
        done();
    });

    it('should send user attribute change requests for the MPID it is being set on', function(done) {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.Identity.getCurrentUser().setUserAttribute('age', '25');
        const testMPID = mParticle.Identity.getCurrentUser().getMPID();
        let body = JSON.parse(fetchMock.lastOptions().body)
        body.mpid.should.equal(testMPID);
        let event = body.events[0]
        event.event_type.should.equal('user_attribute_change');
        event.data.new.should.equal('25');
        Should(event.data.old).equal(null);
        event.data.user_attribute_name.should.equal('age');
        event.data.deleted.should.equal(false);
        event.data.is_new_attribute.should.equal(true);


        // new user logs in
        const loginUser = {
            userIdentities: {
                customerid: 'customerid1',
            },
        };

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'anotherMPID', is_logged_in: true }),
        ]);

        mParticle.Identity.login(loginUser);

        const users = mParticle.Identity.getUsers();
        users.length.should.equal(2);

        const anotherMPIDUser = users[0];
        const testMPIDUser = users[1];

        anotherMPIDUser.getMPID().should.equal('anotherMPID');
        testMPIDUser.getMPID().should.equal('testMPID');

        anotherMPIDUser.setUserAttribute('age', '30');
        body = JSON.parse(fetchMock.lastOptions().body)
        event = body.events[0];
        body.mpid.should.equal(anotherMPIDUser.getMPID());
        event.event_type.should.equal('user_attribute_change');
        event.data.new.should.equal('30');
        Should(event.data.old).equal(null);
        event.data.user_attribute_name.should.equal('age');
        event.data.deleted.should.equal(false);
        event.data.is_new_attribute.should.equal(true);

        testMPIDUser.setUserAttribute('age', '20');
        body = JSON.parse(fetchMock.lastOptions().body)
        body.mpid.should.equal(testMPIDUser.getMPID());
        event = body.events[0];
        event.event_type.should.equal('user_attribute_change');
        event.data.new.should.equal('20');
        event.data.old.should.equal('25');
        event.data.user_attribute_name.should.equal('age');
        event.data.deleted.should.equal(false);
        event.data.is_new_attribute.should.equal(false);

        // remove user attribute 
        anotherMPIDUser.removeUserAttribute('age');
        body = JSON.parse(fetchMock.lastOptions().body)
        body.mpid.should.equal(anotherMPIDUser.getMPID());
        event = body.events[0];
        event.event_type.should.equal('user_attribute_change');
        Should(event.data.new).equal(null);
        event.data.old.should.equal('30');
        event.data.user_attribute_name.should.equal('age');
        event.data.deleted.should.equal(true);
        event.data.is_new_attribute.should.equal(false);


        testMPIDUser.removeUserAttribute('age');
        body = JSON.parse(fetchMock.lastOptions().body)
        body.mpid.should.equal(testMPIDUser.getMPID());
        event = body.events[0];
        event.event_type.should.equal('user_attribute_change');
        Should(event.data.new).equal(null);
        event.data.old.should.equal('20');
        event.data.user_attribute_name.should.equal('age');
        event.data.deleted.should.equal(true);
        event.data.is_new_attribute.should.equal(false);

        
        delete window.mParticle.config.flags
        done();
    });

    it('should send user identity change requests when setting new identities on new users', function(done) {
        mParticle._resetForTests(MPConfig);

        fetchMock.resetHistory();

        window.mParticle.config.identifyRequest = {
            userIdentities: {
                email: 'initial@gmail.com'
            }
        };

        mParticle.init(apiKey, window.mParticle.config);

        JSON.parse(fetchMock.lastOptions().body).user_identities.should.have.property(
            'email',
            'initial@gmail.com'
        );

        mParticle.logEvent('testAfterInit');

        JSON.parse(fetchMock.lastOptions().body).user_identities.should.have.property('email', 'initial@gmail.com');

        fetchMock.calls().forEach(call => {
            JSON.parse(call[1].body).user_identities.should.have.property('email', 'initial@gmail.com')
        });

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'anotherMPID', is_logged_in: true }),
        ]);

        fetchMock.resetHistory();

        // anonymous user is in storage, new user logs in
        const loginUser = {
            userIdentities: {
                customerid: 'customerid1',
            },
        };
        mParticle.Identity.login(loginUser);
        
        let body = JSON.parse(fetchMock.lastOptions().body);
        // should be the new MPID

        body.mpid.should.equal('anotherMPID');
        body.user_identities.should.have.property('customer_id', 'customerid1');
        body.user_identities.should.not.have.property('email');

        const event = body.events[0];
        event.should.be.ok();
        event.event_type.should.equal('user_identity_change');
        event.data.new.identity_type.should.equal('customer_id');
        event.data.new.identity.should.equal('customerid1');
        (typeof event.data.new.timestamp_unixtime_ms).should.equal('number');
        event.data.new.created_this_batch.should.equal(true);
        event.data.old.identity_type.should.equal('customer_id');
        (event.data.old.identity === null).should.equal(true);
        (typeof event.data.old.timestamp_unixtime_ms).should.equal('number');
        event.data.old.created_this_batch.should.equal(false);

        mParticle.logEvent('testAfterLogin');
        body = JSON.parse(fetchMock.lastOptions().body);

        body.user_identities.should.have.property('customer_id', 'customerid1');
        body.user_identities.should.not.have.property('email');

        // change customerid creates an identity change event
        const modifyUser = {
            userIdentities: {
                customerid: 'customerid2',
            },
        };
        mockServer.respondWith('https://identity.mparticle.com/v1/anotherMPID/modify', [
            200,
            {},
            JSON.stringify({ mpid: 'anotherMPID', is_logged_in: true }),
        ]);

        mParticle.Identity.modify(modifyUser);
        const body2 = JSON.parse(fetchMock.lastOptions().body);
        body2.mpid.should.equal('anotherMPID');
        body2.user_identities.should.have.property('customer_id', 'customerid2');
        body2.user_identities.should.not.have.property('email');

        const event2 = body2.events[0];
        event2.should.be.ok();
        event2.event_type.should.equal('user_identity_change');
        event2.data.new.identity_type.should.equal('customer_id');
        event2.data.new.identity.should.equal('customerid2');
        (typeof event2.data.new.timestamp_unixtime_ms).should.equal('number');
        event2.data.new.created_this_batch.should.equal(false);
        event2.data.old.identity_type.should.equal('customer_id');
        event2.data.old.identity.should.equal('customerid1');
        (typeof event2.data.old.timestamp_unixtime_ms).should.equal('number');
        event2.data.old.created_this_batch.should.equal(false);

        // Adding a new identity to the current user will create an identity change event
        const modifyUser2 = {
            userIdentities: {
                customerid: 'customerid2',
                email: 'test@test.com',
            },
        };

        fetchMock.resetHistory();

        mParticle.Identity.modify(modifyUser2);

        const body3 = JSON.parse(fetchMock.lastOptions().body);
        body3.mpid.should.equal('anotherMPID');

        const event3 = body3.events[0];
        event3.should.be.ok();
        event3.event_type.should.equal('user_identity_change');
        event3.data.new.identity_type.should.equal('email');
        event3.data.new.identity.should.equal('test@test.com');
        (typeof event3.data.new.timestamp_unixtime_ms).should.equal('number');
        event3.data.new.created_this_batch.should.equal(true);

        event3.data.old.identity_type.should.equal('email');
        (event3.data.old.identity === null).should.equal(true);
        (typeof event3.data.old.timestamp_unixtime_ms).should.equal('number');
        event3.data.old.created_this_batch.should.equal(false);

        // logout with an other will create only a change event for the other
        const logoutUser = {
            userIdentities: {
                other: 'other1',
            },
        };
        fetchMock.resetHistory();

        mockServer.respondWith(urls.logout, [
            200,
            {},
            JSON.stringify({ mpid: 'mpid2', is_logged_in: false }),
        ]);

        mParticle.Identity.logout(logoutUser);
        //only call is for `other` change event, not for previous ID types of email and customerid
        fetchMock.calls().length.should.equal(1);
        const body4 = JSON.parse(fetchMock.lastOptions().body);
        body4.mpid.should.equal('mpid2');

        const event4 = body4.events[0];
        event4.should.be.ok();
        event4.event_type.should.equal('user_identity_change');
        event4.data.new.identity_type.should.equal('other');
        event4.data.new.identity.should.equal('other1');
        (typeof event4.data.new.timestamp_unixtime_ms).should.equal('number');
        event4.data.new.created_this_batch.should.equal(true);

        event4.data.old.identity_type.should.equal('other');
        (event4.data.old.identity === null).should.equal(true);
        (typeof event4.data.old.timestamp_unixtime_ms).should.equal('number');
        event4.data.old.created_this_batch.should.equal(false);

        mParticle.logEvent('testAfterLogout');

        const body5 = JSON.parse(fetchMock.lastOptions().body);
        body5.mpid.should.equal('mpid2');
        Object.keys(body5.user_identities).length.should.equal(1);
        body5.user_identities.should.have.property('other', 'other1');

        done();
    });

    it('should send historical UIs on batches when MPID changes', function(done) {
        mParticle._resetForTests(MPConfig);

        window.mParticle.config.identifyRequest = {
            userIdentities: {
                email: 'initial@gmail.com'
            }
        };

        window.mParticle.config.flags = {
            EventBatchingIntervalMillis: 0,
        };

        mParticle.init(apiKey, window.mParticle.config);

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: true }),
        ]);

        // on identity strategy where MPID remains the same from anonymous to login
        const loginUser = {
            userIdentities: {
                customerid: 'customerid1',
            },
        };

        mParticle.Identity.login(loginUser);

        let batch = JSON.parse(fetchMock.lastOptions().body);
        batch.mpid.should.equal(testMPID);
        batch.user_identities.should.have.property('email', 'initial@gmail.com');
        batch.user_identities.should.have.property('customer_id', 'customerid1');

        const logoutUser = {
            userIdentities: {
                other: 'other1',
            },
        };

        mockServer.respondWith(urls.logout, [
            200,
            {},
            JSON.stringify({ mpid: 'mpid2', is_logged_in: false }),
        ]);

        mParticle.Identity.logout(logoutUser);

        batch = JSON.parse(fetchMock.lastOptions().body);
        batch.mpid.should.equal('mpid2');
        batch.user_identities.should.have.property('other', 'other1');
        batch.user_identities.should.not.have.property('email');
        batch.user_identities.should.not.have.property('customer_id');

        fetchMock.resetHistory();
        // log back in with previous MPID, but with only a single UI, all UIs should be on batch
        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: true }),
        ]);

        mParticle.Identity.login(loginUser);

        // switching back to logged in user shoudl not result in any UIC events
        Should(fetchMock.lastOptions()).not.be.ok()

        mParticle.logEvent('event after logging back in')
        batch = JSON.parse(fetchMock.lastOptions().body);
        batch.mpid.should.equal(testMPID);
        batch.user_identities.should.have.property('email', 'initial@gmail.com');
        batch.user_identities.should.have.property('customer_id', 'customerid1');

        done();
    });

    it('should not send user attribute change requests when user attribute already set with same value with false values', function(done) {
        mParticle._resetForTests(MPConfig);

        window.mParticle.config.flags = {
            EventBatchingIntervalMillis: 0,
        };

        mParticle.init(apiKey, window.mParticle.config);

        // set a new attribute, age
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute('age', '25');
        const body1 = JSON.parse(fetchMock.lastOptions().body)
        body1.user_attributes.should.have.property('age', '25')
        const event1 = body1.events[0];
        event1.should.be.ok();
        event1.event_type.should.equal('user_attribute_change');
        event1.data.new.should.equal('25');
        (event1.data.old === null).should.equal(true);
        event1.data.user_attribute_name.should.equal('age');
        event1.data.deleted.should.equal(false);
        event1.data.is_new_attribute.should.equal(true);

        // test setting attributes with 'false' values (i.e false, 0 and '')

        // check for UAC event for testFalse: fasle when set for first time
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute('testFalse', false);
        const body2 = JSON.parse(fetchMock.lastOptions().body)
        body2.user_attributes.should.have.property('testFalse', false)
        const event2 = body2.events[0];
        event2.should.be.ok();
        event2.event_type.should.equal('user_attribute_change');
        event2.data.new.should.equal(false);
        (event2.data.old === null).should.equal(true);
        event2.data.user_attribute_name.should.equal('testFalse');
        event2.data.deleted.should.equal(false);
        event2.data.is_new_attribute.should.equal(true);

        // check for UAC event for testEmptyString: '' when set for first time
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute('testEmptyString', '');
        const body3 = JSON.parse(fetchMock.lastOptions().body)
        body3.user_attributes.should.have.property('testEmptyString', '')
        const event3 = body3.events[0];
        event3.should.be.ok();
        event3.event_type.should.equal('user_attribute_change');
        event3.data.new.should.equal('');
        (event3.data.old === null).should.equal(true);
        event3.data.user_attribute_name.should.equal('testEmptyString');
        event3.data.deleted.should.equal(false);
        event3.data.is_new_attribute.should.equal(true);

        // check for UAC event for testZero: 0 when set for first time
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute('testZero', 0);
        const body4 = JSON.parse(fetchMock.lastOptions().body)
        body4.user_attributes.should.have.property('testZero', 0)
        const event4 = body4.events[0];
        event4.should.be.ok();
        event4.event_type.should.equal('user_attribute_change');
        event4.data.new.should.equal(0);
        (event4.data.old === null).should.equal(true);
        event4.data.user_attribute_name.should.equal('testZero');
        event4.data.deleted.should.equal(false);
        event4.data.is_new_attribute.should.equal(true);
        
        // confirm user attributes previously set already exist for user
        const userAttributes = mParticle.Identity.getCurrentUser().getAllUserAttributes();
        userAttributes.should.have.property('age');
        userAttributes.should.have.property('testFalse');
        userAttributes.should.have.property('testEmptyString');
        userAttributes.should.have.property('testZero');

        // re-set all previous attributes with the same values
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute('age', '25');
        mParticle.Identity.getCurrentUser().setUserAttribute('testFalse', false);
        mParticle.Identity.getCurrentUser().setUserAttribute('testEmptyString', '');
        mParticle.Identity.getCurrentUser().setUserAttribute('testZero', 0);
        (fetchMock.lastOptions() === undefined).should.equal(true);
        (fetchMock.calls().length === 0).should.equal(true);

        done()
    });

    it('should send user attribute change event when setting different falsey values', function(done) {
        mParticle._resetForTests(MPConfig);

        window.mParticle.config.flags = {
            EventBatchingIntervalMillis: 0,
        };

        mParticle.init(apiKey, window.mParticle.config);

        // set initial test attribute with 'falsey' value to 0 
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute('testFalsey', 0);
        const body1 = JSON.parse(fetchMock.lastOptions().body)
        body1.user_attributes.should.have.property('testFalsey', 0)
        const event1 = body1.events[0];
        event1.should.be.ok();
        event1.event_type.should.equal('user_attribute_change');
        event1.data.new.should.equal(0);
        (event1.data.old === null).should.equal(true);
        event1.data.user_attribute_name.should.equal('testFalsey');
        event1.data.deleted.should.equal(false);
        event1.data.is_new_attribute.should.equal(true);

        // re-set same test attribute with 'falsey' value to ''
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute('testFalsey', '');
        const body2 = JSON.parse(fetchMock.lastOptions().body)
        body2.user_attributes.should.have.property('testFalsey', '')
        const event2 = body2.events[0];
        event2.should.be.ok();
        event2.event_type.should.equal('user_attribute_change');
        event2.data.new.should.equal('');
        event2.data.old.should.equal(0);
        event2.data.user_attribute_name.should.equal('testFalsey');
        event2.data.deleted.should.equal(false);
        event2.data.is_new_attribute.should.equal(false);

        // re-set same test attribute with 'falsey' value to false
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute('testFalsey', false);
        const body3 = JSON.parse(fetchMock.lastOptions().body)
        body3.user_attributes.should.have.property('testFalsey', false)
        const event3 = body3.events[0];
        event3.should.be.ok();
        event3.event_type.should.equal('user_attribute_change');
        event3.data.new.should.equal(false);
        event3.data.old.should.equal('');
        event3.data.user_attribute_name.should.equal('testFalsey');
        event3.data.deleted.should.equal(false);
        event3.data.is_new_attribute.should.equal(false);

        // re-set same test attribute with 'falsey' value to original value 0
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute('testFalsey', 0);
        const body4 = JSON.parse(fetchMock.lastOptions().body)
        body4.user_attributes.should.have.property('testFalsey', 0)
        const event4 = body4.events[0];
        event4.should.be.ok();
        event4.event_type.should.equal('user_attribute_change');
        event4.data.new.should.equal(0);
        event4.data.old.should.equal(false);
        event4.data.user_attribute_name.should.equal('testFalsey');
        event4.data.deleted.should.equal(false);
        event4.data.is_new_attribute.should.equal(false);

        done()
    });

});