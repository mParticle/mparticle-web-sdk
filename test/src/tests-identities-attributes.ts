import { expect } from 'chai';
import fetchMock from 'fetch-mock/esm/client';
import {
    urls,
    apiKey,
    testMPID,
    MPConfig,
} from './config/constants';
import Utils from './config/utils';
import { AllUserAttributes, UserAttributesValue } from '@mparticle/web-sdk';
import { UserAttributes } from '../../src/identity-user-interfaces';
import { Batch, CustomEvent, UserAttributeChangeEvent } from '@mparticle/event-models';
import { IMParticleInstanceManager, SDKProduct } from '../../src/sdkRuntimeModels';
const {
    waitForCondition,
    fetchMockSuccess,
    hasIdentifyReturned, 
    hasIdentityCallInflightReturned,
    findEventFromRequest,
    findBatch,
    getLocalStorage,
    MockForwarder,
    getIdentityEvent
} = Utils;

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
    }
}

const mParticle = window.mParticle as IMParticleInstanceManager;

const BAD_SESSION_ATTRIBUTE_KEY_AS_OBJECT = ({
    key: 'value',
} as unknown) as string;

const BAD_SESSION_ATTRIBUTE_KEY_AS_ARRAY = (['key'] as unknown) as string;

const BAD_SESSION_ATTRIBUTE_VALUE_AS_OBJECT = ({
    bad: 'bad',
} as unknown) as string;

const BAD_USER_ATTRIBUTE_KEY_AS_OBJECT = ({
    bad: 'bad',
} as unknown) as string;

const BAD_USER_ATTRIBUTE_KEY_AS_ARRAY = ([
    'bad',
    'bad',
    'bad',
] as unknown) as string;

const BAD_USER_ATTRIBUTE_LIST_VALUE = (1234 as unknown) as UserAttributesValue[];

describe('identities and attributes', function() {
    let beforeEachCallbackCalled = false;
    let hasBeforeEachCallbackReturned;

    beforeEach(function() {
        fetchMockSuccess(urls.identify, {
            mpid: testMPID, is_logged_in: false
        });

        fetchMock.post(urls.events, 200);

        mParticle.config.identityCallback = function() {
            // There are some tests that need to verify that the initial init
            // call within the beforeEach method has completed before they
            // can introduce a new identityCallback for their specific assertions.
            beforeEachCallbackCalled = true;
        };

        mParticle.init(apiKey, window.mParticle.config);

        hasBeforeEachCallbackReturned = () => beforeEachCallbackCalled;
    });

    afterEach(function() {
        beforeEachCallbackCalled = false;
        fetchMock.restore();
    });

    it('should set user attribute', async () => {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned);

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');

        mParticle.logEvent('test user attributes');

        const event = findBatch(fetchMock.calls(), 'test user attributes');

        expect(event).to.have.property('user_attributes');
        expect(event.user_attributes).to.have.property('gender', 'male');

        const cookies = getLocalStorage();
        expect(cookies[testMPID].ua).to.have.property('gender', 'male');
    });

    it('should set user attribute be case insensitive', async () => {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned);
        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'male');
        mParticle.Identity.getCurrentUser().setUserAttribute(
            'gender',
            'female'
        );

        mParticle.logEvent('test user attributes');

        const event = findBatch(fetchMock.calls(), 'test user attributes');

        let cookies = getLocalStorage();
        expect(cookies[testMPID].ua).to.have.property('gender', 'female');

        expect(event).to.have.property('user_attributes');
        expect(event.user_attributes).to.have.property('gender', 'female');
        expect(event.user_attributes).to.not.have.property('Gender');

        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'male');

        mParticle.logEvent('test user attributes2');
        const event2 = findBatch(fetchMock.calls(), 'test user attributes2');
        expect(event2.user_attributes).to.have.property('Gender', 'male');
        expect(event2.user_attributes).to.not.have.property('gender');

        cookies = getLocalStorage();
        expect(cookies[testMPID].ua).to.have.property('Gender', 'male');
    });

    it('should set multiple user attributes with setUserAttributes', async () => {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        mParticle.Identity.getCurrentUser().setUserAttributes({
            gender: 'male',
            age: 21,
        });

        mParticle.logEvent('test user attributes');

        const event = findBatch(fetchMock.calls(), 'test user attributes');

        const cookies = getLocalStorage();
        expect(cookies[testMPID].ua).to.have.property('gender', 'male');
        expect(cookies[testMPID].ua).to.have.property('age', 21);

        expect(event).to.have.property('user_attributes');
        expect(event.user_attributes).to.have.property('gender', 'male');
        expect(event.user_attributes).to.have.property('age', 21);
    });

    it('should remove user attribute', async () => {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().removeUserAttribute('gender');

        mParticle.logEvent('test user attributes');
        const event = findBatch(fetchMock.calls(), 'test user attributes');
        expect(event.user_attributes).to.not.have.property('gender');

        const cookies = getLocalStorage();
        expect(cookies[testMPID].ua).to.not.be.ok;
    });

    it('should remove user attribute case insensitive', async () => {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'male');
        mParticle.Identity.getCurrentUser().removeUserAttribute('gender');

        mParticle.logEvent('test user attributes');

        const event = findBatch(fetchMock.calls(), 'test user attributes');
        expect(event.user_attributes).to.not.have.property('Gender');

        const cookies = getLocalStorage();
        expect(cookies[testMPID].ua).to.not.be.ok;
    });

    it('should set session attribute', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.setSessionAttribute('name', 'test');

        mParticle.logEvent('test event');

        const event = findEventFromRequest(fetchMock.calls(), 'test event');

        expect(event.data.custom_attributes).to.equal(null);

        mParticle.endSession();
        const sessionEndEvent = findEventFromRequest(
            fetchMock.calls(),
            'session_end'
        );

        expect(sessionEndEvent.data.custom_attributes).to.have.property(
            'name',
            'test'
        );
    });

    it('should set session attribute case insensitive', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.setSessionAttribute('name', 'test');
        mParticle.setSessionAttribute('Name', 'test1');

        mParticle.endSession();

        const sessionEndEvent = findEventFromRequest(
            fetchMock.calls(),
            'session_end'
        );

        expect(sessionEndEvent.data.custom_attributes).to.have.property(
            'name',
            'test1'
        );
        expect(sessionEndEvent.data.custom_attributes).to.not.have.property(
            'Name'
        );
    });

    it("should not set a session attribute's key as an object or array)", async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.setSessionAttribute(
            BAD_SESSION_ATTRIBUTE_KEY_AS_OBJECT,
            'test'
        );
        mParticle.endSession();
        const sessionEndEvent1 = findEventFromRequest(
            fetchMock.calls(),
            'session_end'
        );

        mParticle.startNewSession();
        fetchMock.resetHistory();
        mParticle.setSessionAttribute(
            BAD_SESSION_ATTRIBUTE_KEY_AS_ARRAY,
            'test'
        );
        mParticle.endSession();
        const sessionEndEvent2 = findEventFromRequest(
            fetchMock.calls(),
            'session_end'
        );

        expect(
            Object.keys(sessionEndEvent1.data.custom_attributes).length
        ).to.equal(0);
        expect(
            Object.keys(sessionEndEvent2.data.custom_attributes).length
        ).to.equal(0);
    });

    it('should remove session attributes when session ends', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.startNewSession();
        mParticle.setSessionAttribute('name', 'test');
        mParticle.endSession();

        fetchMock.resetHistory();
        mParticle.startNewSession();
        mParticle.endSession();

        const sessionEndEvent = findEventFromRequest(
            fetchMock.calls(),
            'session_end'
        );

        expect(sessionEndEvent.data.custom_attributes).to.not.have.property(
            'name'
        );
    });

    it('should set and log position', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.setPosition(34.134103, -118.321694);
        mParticle.logEvent('Test Event');

        const event = findEventFromRequest(fetchMock.calls(), 'Test Event');

        expect(event.data).to.have.property('location');
        expect(event.data.location).to.have.property('latitude', 34.134103);
        expect(event.data.location).to.have.property('longitude', -118.321694);
    });

    it('should set user tag', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.Identity.getCurrentUser().setUserTag('test');

        mParticle.logEvent('Test Event');

        const event = findBatch(fetchMock.calls(), 'Test Event');

        expect(event).to.have.property('user_attributes');
        expect(event.user_attributes).to.have.property('test', null);

        const cookies = getLocalStorage();
        expect(cookies[testMPID].ua).to.have.property('test');
    });

    it('should set user tag case insensitive', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.Identity.getCurrentUser().setUserTag('Test');
        mParticle.Identity.getCurrentUser().setUserTag('test');

        mParticle.logEvent('Test Event');

        const event = findBatch(fetchMock.calls(), 'Test Event');

        expect(event).to.have.property('user_attributes');
        expect(event.user_attributes).to.not.have.property('Test');
        expect(event.user_attributes).to.have.property('test');

        const cookies = getLocalStorage();
        expect(cookies[testMPID].ua).to.have.property('test');
    });

    it('should remove user tag', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.Identity.getCurrentUser().setUserTag('test');
        mParticle.Identity.getCurrentUser().removeUserTag('test');

        mParticle.logEvent('test event');

        const event = findBatch(fetchMock.calls(), 'test event');

        expect(event).to.have.property('user_attributes');
        expect(event.user_attributes).to.not.have.property('test');

        const cookies = getLocalStorage();
        expect(cookies[testMPID].ua).to.not.be.ok;
    });

    it('should remove user tag case insensitive', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.Identity.getCurrentUser().setUserTag('Test');
        mParticle.Identity.getCurrentUser().removeUserTag('test');

        mParticle.logEvent('test event');

        const event = findBatch(fetchMock.calls(), 'test event');

        expect(event).to.have.property('user_attributes');
        expect(event.user_attributes).to.not.have.property('Test');

        const cookies = getLocalStorage();
        expect(cookies[testMPID].ua).to.not.be.ok;
    });

    it('should set user attribute list', async () => {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [
            1,
            2,
            3,
            4,
            5,
        ]);

        mParticle.logEvent('test user attributes');

        const event = findBatch(fetchMock.calls(), 'test user attributes');

        expect(event).to.have.property('user_attributes');
        expect(event.user_attributes)
            .to.have.property('numbers')
            .to.deep.equal([1, 2, 3, 4, 5]);

        const cookies = getLocalStorage();
        expect(cookies[testMPID].ua.numbers.length).to.equal(5);
    });

    it('should set user attribute list case insensitive', async () => {
        mParticle._resetForTests(MPConfig);
        
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
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

        expect(event).to.have.property('user_attributes');
        expect(event.user_attributes)
            .to.have.property('Numbers')
            .to.deep.equal([1, 2, 3, 4, 5, 6]);
        expect(event.user_attributes).to.not.have.property('numbers');
        expect(cookies[testMPID].ua.Numbers.length).to.equal(6);

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

        expect(event2.user_attributes)
            .to.have.property('numbers')
            .to.deep.equal([1, 2, 3, 4, 5]);
        expect(event2.user_attributes).to.not.have.property('Numbers');
        expect(cookies3[testMPID].ua.numbers.length).to.equal(5);
    });

    it('should make a copy of user attribute list', async () => {
        const list = [1, 2, 3, 4, 5];

        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned);
        mParticle.Identity.getCurrentUser().setUserAttributeList(
            'numbers',
            list
        );

        list.push(6);

        mParticle.logEvent('test user attributes');

        const event = findBatch(fetchMock.calls(), 'test user attributes');

        const cookies = getLocalStorage();
        expect(cookies[testMPID].ua.numbers.length).to.equal(5);

        expect(event).to.have.property('user_attributes');
        expect(event.user_attributes)
            .to.have.property('numbers')
            .with.lengthOf(5);
    });

    it('should remove all user attributes', async () => {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
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

        expect(event).to.have.property('user_attributes');
        expect(event.user_attributes).to.deep.equal({});
        expect(cookies[testMPID].ua).to.not.be.ok;
    });

    it('should get user attribute lists', async () => {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned);

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().setUserAttributeList('numbers', [
            1,
            2,
            3,
            4,
            5,
        ]);

        const userAttributes = mParticle.Identity.getCurrentUser().getUserAttributesLists();

        expect(userAttributes).to.have.property('numbers');
        expect(userAttributes).to.not.have.property('gender');
    });

    it('should copy when calling get user attribute lists', async () => {
        mParticle._resetForTests(MPConfig);
        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned);
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
        expect(userAttributes1['numbers']).to.have.lengthOf(5);
    });

    it('should copy when calling get user attributes', async () => {
        mParticle._resetForTests(MPConfig);
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
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

        expect(userAttributes1['numbers']).to.have.lengthOf(5);
        expect(userAttributes1).to.not.have.property('blah');
    });

    it('should get all user attributes', async () => {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        mParticle.Identity.getCurrentUser().setUserAttribute('test', '123');
        mParticle.Identity.getCurrentUser().setUserAttribute(
            'another test',
            'blah'
        );

        const attrs = mParticle.Identity.getCurrentUser().getAllUserAttributes();

        expect(attrs).to.have.property('test', '123');
        expect(attrs).to.have.property('another test', 'blah');
    });

    it('should not set user attribute list if value is not array', async () => {
        mParticle._resetForTests(MPConfig);
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        mParticle.Identity.getCurrentUser().setUserAttributeList(
            'mykey',
            BAD_USER_ATTRIBUTE_LIST_VALUE
        );

        const attrs = mParticle.Identity.getCurrentUser().getAllUserAttributes();

        expect(attrs).to.not.have.property('mykey');
    });

    it('should not set bad session attribute value', async () => {
        await waitForCondition(hasIdentifyReturned);
        mParticle.setSessionAttribute(
            'name',
            BAD_SESSION_ATTRIBUTE_VALUE_AS_OBJECT
        );

        mParticle.endSession();

        const sessionEndEvent = findEventFromRequest(
            fetchMock.calls(),
            'session_end'
        );

        expect(sessionEndEvent.data.custom_attributes).to.not.have.property(
            'name'
        );
    });

    it('should not set a bad user attribute key or value', async () => {
        await waitForCondition(hasIdentifyReturned);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', {
            bad: 'bad',
        });
        mParticle.logEvent('test bad user attributes1');
        const event1 = findBatch(
            fetchMock.calls(),
            'test bad user attributes1'
        );

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', [
            'bad',
            'bad',
            'bad',
        ]);
        mParticle.logEvent('test bad user attributes2');
        const event2 = findBatch(
            fetchMock.calls(),
            'test bad user attributes2'
        );

        mParticle.Identity.getCurrentUser().setUserAttribute(
            BAD_USER_ATTRIBUTE_KEY_AS_OBJECT,
            'male'
        );
        mParticle.logEvent('test bad user attributes3');
        const event3 = findBatch(
            fetchMock.calls(),
            'test bad user attributes3'
        );

        mParticle.Identity.getCurrentUser().setUserAttribute(
            BAD_USER_ATTRIBUTE_KEY_AS_ARRAY,
            'female'
        );
        mParticle.logEvent('test bad user attributes4');
        const event4 = findBatch(
            fetchMock.calls(),
            'test bad user attributes4'
        );

        mParticle.Identity.getCurrentUser().setUserAttribute(null, 'female');
        mParticle.logEvent('test bad user attributes5');
        const event5 = findBatch(
            fetchMock.calls(),
            'test bad user attributes5'
        );

        mParticle.Identity.getCurrentUser().setUserAttribute(
            undefined,
            'female'
        );
        mParticle.logEvent('test bad user attributes6');
        const event6 = findBatch(
            fetchMock.calls(),
            'test bad user attributes6'
        );

        expect(event1).to.have.property('user_attributes');
        expect(event1.user_attributes).to.not.have.property('gender');

        expect(event2).to.have.property('user_attributes');
        expect(event2.user_attributes).to.not.have.property('gender');

        expect(event3).to.have.property('user_attributes');
        expect(event3.user_attributes).to.not.have.property('gender');

        expect(event4).to.have.property('user_attributes');
        expect(event4.user_attributes).to.not.have.property('gender');

        expect(event5).to.have.property('user_attributes');
        expect(event5.user_attributes).to.not.have.property('gender');

        expect(event6).to.have.property('user_attributes');
        expect(event6.user_attributes).to.not.have.property('gender');
    });

    it('should send user attribute change requests when setting new attributes', async () => {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        // set a new attribute, age
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute('age', '25');

        // `fetchMock.lastOptions().body` is technically an object, but
        // our server actually returns this as a string.
        // In this case, we are going to parse the string and coerce it
        // into an AllUserAttributes object so we can have type safety
        // for the remainder of this test and to ensure that the
        // exracted event data conforms to a UserAttributeChangeEvent
        let body: AllUserAttributes = JSON.parse(
            `${fetchMock.lastOptions().body}`
        );
        expect(body.user_attributes).to.have.property('age', '25');

        let event: UserAttributeChangeEvent = body.events[0];
        expect(event).to.be.ok;
        expect(event.event_type).to.equal('user_attribute_change');
        expect(event.data.new).to.equal('25');
        expect(event.data.old === null).to.equal(true);
        expect(event.data.user_attribute_name).to.equal('age');
        expect(event.data.deleted).to.equal(false);
        expect(event.data.is_new_attribute).to.equal(true);

        // change age attribute
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute('age', '30');
        body = JSON.parse(`${fetchMock.lastOptions().body}`);
        expect(body.user_attributes).to.have.property('age', '30');
        event = body.events[0];
        expect(event.event_type).to.equal('user_attribute_change');
        expect(event.data.new).to.equal('30');
        expect(event.data.old).to.equal('25');
        expect(event.data.user_attribute_name).to.equal('age');
        expect(event.data.deleted).to.equal(false);
        expect(event.data.is_new_attribute).to.equal(false);

        // removes age attribute
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().removeUserAttribute('age');
        body = JSON.parse(`${fetchMock.lastOptions().body}`);
        expect(body.user_attributes).to.not.have.property('age');
        event = body.events[0];
        expect(event.event_type).to.equal('user_attribute_change');
        expect(event.data.new === null).to.equal(true);
        expect(event.data.old).to.equal('30');
        expect(event.data.user_attribute_name).to.equal('age');
        expect(event.data.deleted).to.equal(true);
        expect(event.data.is_new_attribute).to.equal(false);

        // set a user attribute list
        fetchMock.resetHistory();

        mParticle.Identity.getCurrentUser().setUserAttributeList('age', [
            'test1',
            'test2',
        ]);
        body = JSON.parse(`${fetchMock.lastOptions().body}`);

        expect(body.user_attributes['age'][0]).to.equal('test1');
        expect(body.user_attributes['age'][1]).to.equal('test2');
        event = body.events[0];
        expect(event.event_type).to.equal('user_attribute_change');
        let obj = {
            test1: true,
            test2: true,
        };

        // In this case, the expectation is that the user attributes are an array of strings
        (event.data.new as string[]).forEach(function(userAttr) {
            expect(obj[userAttr]).to.equal(true);
        });
        expect(event.data.old === null).to.equal(true);
        expect(event.data.user_attribute_name).to.equal('age');
        expect(event.data.deleted).to.equal(false);
        expect(event.data.is_new_attribute).to.equal(true);

        // changes ordering of above attribute list
        fetchMock.resetHistory();

        mParticle.Identity.getCurrentUser().setUserAttributeList('age', [
            'test2',
            'test1',
        ]);
        body = JSON.parse(`${fetchMock.lastOptions().body}`);
        expect(body.user_attributes['age'][0]).to.equal('test2');
        expect(body.user_attributes['age'][1]).to.equal('test1');

        event = JSON.parse(`${fetchMock.lastOptions().body}`).events[0];
        expect(event.event_type).to.equal('user_attribute_change');
        obj = {
            test1: true,
            test2: true,
        };

        // In this case, the expectation is that the user attributes are an array of strings
        (event.data.new as string[]).forEach(function(userAttr) {
            expect(obj[userAttr]).to.equal(true);
        });

        expect(event.data.old[0] === 'test1').to.equal(true);
        expect(event.data.old[1] === 'test2').to.equal(true);
        expect(event.data.user_attribute_name).to.equal('age');
        expect(event.data.deleted).to.equal(false);
        expect(event.data.is_new_attribute).to.equal(false);

        delete window.mParticle.config.flags;
    });

    it('should send user attribute change requests for the MPID it is being set on', async () => {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        mParticle.Identity.getCurrentUser().setUserAttribute('age', '25');
        const testMPID = mParticle.Identity.getCurrentUser().getMPID();
        let body: UserAttributes = JSON.parse(
            `${`${fetchMock.lastOptions().body}`}`
        );
        expect(body.mpid).to.equal(testMPID);
        let event: UserAttributeChangeEvent = body.events[0];
        expect(event.event_type).to.equal('user_attribute_change');
        expect(event.data.new).to.equal('25');
        expect(event.data.old).to.equal(null);
        expect(event.data.user_attribute_name).to.equal('age');
        expect(event.data.deleted).to.equal(false);
        expect(event.data.is_new_attribute).to.equal(true);

        // new user logs in
        const loginUser = {
            userIdentities: {
                customerid: 'customerid1',
            },
        };

        fetchMockSuccess(urls.login, {
            mpid: 'anotherMPID', is_logged_in: true
        });
    
        mParticle.Identity.login(loginUser);

        await waitForCondition(() => {
            return (
                mParticle.Identity.getCurrentUser()?.getMPID() === 'anotherMPID'
            );
        });
        const users = mParticle.Identity.getUsers();
        expect(users.length).to.equal(2);

        const anotherMPIDUser = users[0];
        const testMPIDUser = users[1];

        expect(anotherMPIDUser.getMPID()).to.equal('anotherMPID');
        expect(testMPIDUser.getMPID()).to.equal('testMPID');

        anotherMPIDUser.setUserAttribute('age', '30');
        body = JSON.parse(`${`${fetchMock.lastOptions().body}`}`);
        event = body.events[0];
        expect(body.mpid).to.equal(anotherMPIDUser.getMPID());
        expect(event.event_type).to.equal('user_attribute_change');
        expect(event.data.new).to.equal('30');
        expect(event.data.old).to.equal(null);
        expect(event.data.user_attribute_name).to.equal('age');
        expect(event.data.deleted).to.equal(false);
        expect(event.data.is_new_attribute).to.equal(true);

        testMPIDUser.setUserAttribute('age', '20');
        body = JSON.parse(`${fetchMock.lastOptions().body}`);
        expect(body.mpid).to.equal(testMPIDUser.getMPID());
        event = body.events[0];
        expect(event.event_type).to.equal('user_attribute_change');
        expect(event.data.new).to.equal('20');
        expect(event.data.old).to.equal('25');
        expect(event.data.user_attribute_name).to.equal('age');
        expect(event.data.deleted).to.equal(false);
        expect(event.data.is_new_attribute).to.equal(false);

        // remove user attribute
        anotherMPIDUser.removeUserAttribute('age');
        body = JSON.parse(`${fetchMock.lastOptions().body}`);
        expect(body.mpid).to.equal(anotherMPIDUser.getMPID());
        event = body.events[0];
        expect(event.event_type).to.equal('user_attribute_change');
        expect(event.data.new).to.equal(null);
        expect(event.data.old).to.equal('30');
        expect(event.data.user_attribute_name).to.equal('age');
        expect(event.data.deleted).to.equal(true);
        expect(event.data.is_new_attribute).to.equal(false);

        testMPIDUser.removeUserAttribute('age');
        body = JSON.parse(`${fetchMock.lastOptions().body}`);
        expect(body.mpid).to.equal(testMPIDUser.getMPID());
        event = body.events[0];
        expect(event.event_type).to.equal('user_attribute_change');
        expect(event.data.new).to.equal(null);
        expect(event.data.old).to.equal('20');
        expect(event.data.user_attribute_name).to.equal('age');
        expect(event.data.deleted).to.equal(true);
        expect(event.data.is_new_attribute).to.equal(false);

        delete window.mParticle.config.flags;
    });

    it('should send user identity change requests when setting new identities on new users', async () => {
        mParticle._resetForTests(MPConfig);

        fetchMock.resetHistory();

        window.mParticle.config.identifyRequest = {
            userIdentities: {
                email: 'initial@gmail.com',
            },
        };
        mParticle.config.flags.eventBatchingIntervalMillis = 5000
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        mParticle.upload();
        expect(
            JSON.parse(`${fetchMock.lastOptions().body}`).user_identities
        ).to.have.property('email', 'initial@gmail.com');
        
        mParticle.logEvent('testAfterInit');
        mParticle.upload();
        
        expect(
            JSON.parse(`${fetchMock.lastOptions().body}`).user_identities
        ).to.have.property('email', 'initial@gmail.com');

        fetchMockSuccess(urls.login, {
            mpid: 'anotherMPID', is_logged_in: false
        });
        
        fetchMock.resetHistory();
        
        // anonymous user is in storage, new user logs in
        const loginUser = {
            userIdentities: {
                customerid: 'customerid1',
            },
        };
        mParticle.Identity.login(loginUser);
        await waitForCondition(() => {
            return (
                mParticle.Identity.getCurrentUser()?.getMPID() === 'anotherMPID'
            );
        });
        let body = JSON.parse(`${fetchMock.lastOptions().body}`);

        // should be the new MPID
        expect(body.mpid).to.equal('anotherMPID');
        expect(body.user_identities).to.have.property(
            'customer_id',
            'customerid1'
        );
        expect(body.user_identities).to.not.have.property('email');

        const event = body.events[0];
        expect(event).to.be.ok;
        expect(event.event_type).to.equal('user_identity_change');
        expect(event.data.new.identity_type).to.equal('customer_id');
        expect(event.data.new.identity).to.equal('customerid1');
        expect(typeof event.data.new.timestamp_unixtime_ms).to.equal('number');
        expect(event.data.new.created_this_batch).to.equal(true);
        expect(event.data.old.identity_type).to.equal('customer_id');
        expect(event.data.old.identity === null).to.equal(true);
        expect(typeof event.data.old.timestamp_unixtime_ms).to.equal('number');
        expect(event.data.old.created_this_batch).to.equal(false);

        mParticle.logEvent('testAfterLogin');
        mParticle.upload();
        body = JSON.parse(`${fetchMock.lastOptions().body}`);

        expect(body.user_identities).to.have.property(
            'customer_id',
            'customerid1'
        );
        expect(body.user_identities).to.not.have.property('email');
        
        // change customerid creates an identity change event
        const modifyUser = {
            userIdentities: {
                customerid: 'customerid2',
            },
        };

            fetchMockSuccess('https://identity.mparticle.com/v1/anotherMPID/modify', {
                mpid: 'anotherMPID', is_logged_in: true
            });
            
        mParticle.Identity.modify(modifyUser);
            await waitForCondition(() => {
                return (
                        mParticle.getInstance()._Store.identityCallInFlight === false
                    );
            });
        const body2 = JSON.parse(`${fetchMock.lastOptions().body}`);
        expect(body2.mpid).to.equal('anotherMPID');
        expect(body2.user_identities).to.have.property(
            'customer_id',
            'customerid2'
        );
        expect(body2.user_identities).to.not.have.property('email');

        const event2 = body2.events[0];
        expect(event2).to.be.ok;
        expect(event2.event_type).to.equal('user_identity_change');
        expect(event2.data.new.identity_type).to.equal('customer_id');
        expect(event2.data.new.identity).to.equal('customerid2');
        expect(typeof event2.data.new.timestamp_unixtime_ms).to.equal('number');
        expect(event2.data.new.created_this_batch).to.equal(false);
        expect(event2.data.old.identity_type).to.equal('customer_id');
        expect(event2.data.old.identity).to.equal('customerid1');
        expect(typeof event2.data.old.timestamp_unixtime_ms).to.equal('number');
        expect(event2.data.old.created_this_batch).to.equal(false);

        // Adding a new identity to the current user will create an identity change event
        const modifyUser2 = {
            userIdentities: {
                customerid: 'customerid2',
                email: 'test@test.com',
            },
        };

        fetchMock.resetHistory();

        mParticle.Identity.modify(modifyUser2);
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });
        const body3 = JSON.parse(`${fetchMock.lastOptions().body}`);
        expect(body3.mpid).to.equal('anotherMPID');

        const event3 = body3.events[0];
        expect(event3).to.be.ok;
        expect(event3.event_type).to.equal('user_identity_change');
        expect(event3.data.new.identity_type).to.equal('email');
        expect(event3.data.new.identity).to.equal('test@test.com');
        expect(typeof event3.data.new.timestamp_unixtime_ms).to.equal('number');
        expect(event3.data.new.created_this_batch).to.equal(true);

        expect(event3.data.old.identity_type).to.equal('email');
        expect(event3.data.old.identity === null).to.equal(true);
        expect(typeof event3.data.old.timestamp_unixtime_ms).to.equal('number');
        expect(event3.data.old.created_this_batch).to.equal(false);

        // logout with an other will create only a change event for the other
        const logoutUser = {
            userIdentities: {
                other: 'other1',
            },
        };
        fetchMock.resetHistory();

        fetchMockSuccess(urls.logout, {
            mpid: 'mpid2', is_logged_in: false
        });

        mParticle.Identity.logout(logoutUser);
        await waitForCondition(() => {
            return (
                mParticle.Identity.getCurrentUser()?.getMPID() === 'mpid2'
            );
        });
        // Calls are for logout and UIC
        expect(fetchMock.calls().length).to.equal(2);
        const body4 = JSON.parse(`${fetchMock.lastOptions().body}`);
        expect(body4.mpid).to.equal('mpid2');

        const event4 = body4.events[0];
        expect(event4).to.be.ok;
        expect(event4.event_type).to.equal('user_identity_change');
        expect(event4.data.new.identity_type).to.equal('other');
        expect(event4.data.new.identity).to.equal('other1');
        expect(typeof event4.data.new.timestamp_unixtime_ms).to.equal('number');
        expect(event4.data.new.created_this_batch).to.equal(true);

        expect(event4.data.old.identity_type).to.equal('other');
        expect(event4.data.old.identity === null).to.equal(true);
        expect(typeof event4.data.old.timestamp_unixtime_ms).to.equal('number');
        expect(event4.data.old.created_this_batch).to.equal(false);

        mParticle.logEvent('testAfterLogout');

        const body5 = JSON.parse(`${fetchMock.lastOptions().body}`);
        expect(body5.mpid).to.equal('mpid2');
        expect(Object.keys(body5.user_identities).length).to.equal(1);
        expect(body5.user_identities).to.have.property('other', 'other1');
    });

    it('should order user identity change events before logging any events', async () => {
        mParticle._resetForTests(MPConfig);
        fetchMock.resetHistory();

        // Clear out before each init call
        await waitForCondition(hasBeforeEachCallbackReturned);

        window.mParticle.config.identifyRequest = {
            userIdentities: {
                email: 'initial@gmail.com',
            },
        };

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentityCallInflightReturned);

        mParticle.logEvent('Test Event 1');
        mParticle.logEvent('Test Event 2');
        mParticle.logEvent('Test Event 3');

        expect(fetchMock.calls().length).to.equal(7);

        const firstCall = fetchMock.calls()[0];
        expect(firstCall[0].split('/')[4]).to.equal('identify', 'First Call');

        const secondCall = fetchMock.calls()[1];
        expect(secondCall[0].split('/')[6]).to.equal('events');
        const secondCallBody = JSON.parse(secondCall[1].body as unknown as string) as Batch;
        expect(secondCallBody.events[0].event_type).to.equal('session_start', 'Second Call');

        const thirdCall = fetchMock.calls()[2];
        expect(thirdCall[0].split('/')[6]).to.equal('events');
        const thirdCallBody = JSON.parse(thirdCall[1].body as unknown as string) as Batch;
        expect(thirdCallBody.events[0].event_type).to.equal('application_state_transition', 'Third Call');

        const fourthCall = fetchMock.calls()[3];
        expect(fourthCall[0].split('/')[6]).to.equal('events');
        const fourthCallBody = JSON.parse(fourthCall[1].body as unknown as string) as Batch;
        expect(fourthCallBody.events[0].event_type).to.equal('user_identity_change', 'Fourth Call');

        const fifthCall = fetchMock.calls()[4];
        expect(fifthCall[0].split('/')[6]).to.equal('events');
        const fifthCallBody = JSON.parse(fifthCall[1].body as unknown as string) as Batch;
        const fifthCallEvent = fifthCallBody.events[0] as CustomEvent;
        expect(fifthCallEvent.event_type).to.equal('custom_event', 'Fifth Call');
        expect(fifthCallEvent.data.event_name).to.equal('Test Event 1', 'Fifth Call');

        const sixthCall = fetchMock.calls()[5];
        expect(sixthCall[0].split('/')[6]).to.equal('events');
        const sixthCallBody = JSON.parse(sixthCall[1].body as unknown as string) as Batch;
        const sixthCallEvent = sixthCallBody.events[0] as CustomEvent;
        expect(sixthCallBody.events[0].event_type).to.equal('custom_event', 'Sixth Call');
        expect(sixthCallEvent.data.event_name).to.equal('Test Event 2', 'Sixth Call');

        const seventhEvent = fetchMock.calls()[6];
        expect(seventhEvent[0].split('/')[6]).to.equal('events');
        const seventhEventBody = JSON.parse(seventhEvent[1].body as unknown as string) as Batch;
        const seventhEventEvent = seventhEventBody.events[0] as CustomEvent;
        expect(seventhEventBody.events[0].event_type).to.equal('custom_event', 'Seventh Call');
        expect(seventhEventEvent.data.event_name).to.equal('Test Event 3', 'Seventh Call');
    });

    it('should order user identity change events before logging any events that are in the ready queue', async () => {

        mParticle._resetForTests(MPConfig);
        fetchMock.resetHistory();

        // Clear out before each init call
        await waitForCondition(hasBeforeEachCallbackReturned);

        window.mParticle.config.identifyRequest = {
            userIdentities: {
                email: 'initial@gmail.com',
            },
        };

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.logEvent('Test Event 1');
        mParticle.logEvent('Test Event 2');
        mParticle.logEvent('Test Event 3');

        expect(mParticle.getInstance()._preInit.readyQueue.length).to.equal(3);

        await waitForCondition(hasIdentityCallInflightReturned);

        expect(fetchMock.calls().length).to.equal(7);

        const firstCall = fetchMock.calls()[0];
        expect(firstCall[0].split('/')[4]).to.equal('identify', 'First Call');

        const secondCall = fetchMock.calls()[1];
        expect(secondCall[0].split('/')[6]).to.equal('events');
        const secondCallBody = JSON.parse(secondCall[1].body as unknown as string) as Batch;
        expect(secondCallBody.events[0].event_type).to.equal('session_start', 'Second Call');

        const thirdCall = fetchMock.calls()[2];
        expect(thirdCall[0].split('/')[6]).to.equal('events');
        const thirdCallBody = JSON.parse(thirdCall[1].body as unknown as string) as Batch;
        expect(thirdCallBody.events[0].event_type).to.equal('application_state_transition', 'Third Call');

        const fourthCall = fetchMock.calls()[3];
        expect(fourthCall[0].split('/')[6]).to.equal('events');
        const fourthCallBody = JSON.parse(fourthCall[1].body as unknown as string) as Batch;
        expect(fourthCallBody.events[0].event_type).to.equal('user_identity_change', 'Fourth Call');

        const fifthCall = fetchMock.calls()[4];
        expect(fifthCall[0].split('/')[6]).to.equal('events');
        const fifthCallBody = JSON.parse(fifthCall[1].body as unknown as string) as Batch;
        const fifthCallEvent = fifthCallBody.events[0] as CustomEvent;
        expect(fifthCallEvent.event_type).to.equal('custom_event', 'Fifth Call');
        expect(fifthCallEvent.data.event_name).to.equal('Test Event 1', 'Fifth Call');

        const sixthCall = fetchMock.calls()[5];
        expect(sixthCall[0].split('/')[6]).to.equal('events');
        const sixthCallBody = JSON.parse(sixthCall[1].body as unknown as string) as Batch;
        const sixthCallEvent = sixthCallBody.events[0] as CustomEvent;
        expect(sixthCallBody.events[0].event_type).to.equal('custom_event', 'Sixth Call');
        expect(sixthCallEvent.data.event_name).to.equal('Test Event 2', 'Sixth Call');

        const seventhEvent = fetchMock.calls()[6];
        expect(seventhEvent[0].split('/')[6]).to.equal('events');
        const seventhEventBody = JSON.parse(seventhEvent[1].body as unknown as string) as Batch;
        const seventhEventEvent = seventhEventBody.events[0] as CustomEvent;
        expect(seventhEventBody.events[0].event_type).to.equal('custom_event', 'Seventh Call');
        expect(seventhEventEvent.data.event_name).to.equal('Test Event 3', 'Seventh Call');
    });

    it('should send historical UIs on batches when MPID changes', async () => {
        mParticle._resetForTests(MPConfig);

        window.mParticle.config.identifyRequest = {
            userIdentities: {
                email: 'initial@gmail.com',
            },
        };

        
        window.mParticle.config.flags = {
            EventBatchingIntervalMillis: 0,
        }

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned);
        fetchMockSuccess(urls.login, {
            mpid: 'testMPID', is_logged_in: true
        });
        // on identity strategy where MPID remains the same from anonymous to login
        const loginUser = {
            userIdentities: {
                customerid: 'customerid1',
            },
        };

        mParticle.Identity.login(loginUser);
        
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });
        let batch = JSON.parse(`${fetchMock.lastOptions().body}`);
        expect(batch.mpid).to.equal(testMPID);
        expect(batch.user_identities).to.have.property(
            'email',
            'initial@gmail.com'
        );
        expect(batch.user_identities).to.have.property(
            'customer_id',
            'customerid1'
        );

        const logoutUser = {
            userIdentities: {
                other: 'other1',
            },
        };

        fetchMockSuccess(urls.logout, {
            mpid: 'mpid2', is_logged_in: false
        });

        mParticle.Identity.logout(logoutUser);

        await waitForCondition(() => {
            return (
                mParticle.Identity.getCurrentUser()?.getMPID() === 'mpid2'
            );
        });
        batch = JSON.parse(`${fetchMock.lastOptions().body}`);
        expect(batch.mpid).to.equal('mpid2');
        expect(batch.user_identities).to.have.property('other', 'other1');
        expect(batch.user_identities).to.not.have.property('email');
        expect(batch.user_identities).to.not.have.property('customer_id');

        fetchMock.resetHistory();
        // log back in with previous MPID, but with only a single UI, all UIs should be on batch

        fetchMockSuccess(urls.login, {
            mpid: 'testMPID', is_logged_in: true
        });
        
        mParticle.Identity.login(loginUser);

        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });
        // switching back to logged in user should not result in any UIC events
        expect(fetchMock.calls().length).to.equal(1);

        const data = getIdentityEvent(fetchMock.calls(), 'login');

        expect(data).to.be.ok;
        
        mParticle.logEvent('event after logging back in');
        batch = JSON.parse(`${fetchMock.lastOptions().body}`);
        expect(batch.mpid).to.equal(testMPID);
        expect(batch.user_identities).to.have.property(
            'email',
            'initial@gmail.com'
        );
        expect(batch.user_identities).to.have.property(
            'customer_id',
            'customerid1'
        );
    });
    
    it('should not send user attribute change requests when user attribute already set with same value with false values', async () => {
        mParticle._resetForTests(MPConfig);

        window.mParticle.config.flags = {
            EventBatchingIntervalMillis: 0,
        };

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned);
        // set a new attribute, age
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute('age', '25');
        const body1 = JSON.parse(`${fetchMock.lastOptions().body}`);
        expect(body1.user_attributes).to.have.property('age', '25');
        const event1 = body1.events[0];
        expect(event1).to.be.ok;
        expect(event1.event_type).to.equal('user_attribute_change');
        expect(event1.data.new).to.equal('25');
        expect(event1.data.old).to.equal(null);
        expect(event1.data.user_attribute_name).to.equal('age');
        expect(event1.data.deleted).to.equal(false);
        expect(event1.data.is_new_attribute).to.equal(true);

        // test setting attributes with 'false' values (i.e false, 0 and '')

        // check for UAC event for testFalse: fasle when set for first time
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute(
            'testFalse',
            false
        );
        const body2 = JSON.parse(`${fetchMock.lastOptions().body}`);
        expect(body2.user_attributes).to.have.property('testFalse', false);
        const event2 = body2.events[0];
        expect(event2).to.be.ok;
        expect(event2.event_type).to.equal('user_attribute_change');
        expect(event2.data.new).to.equal(false);
        expect(event2.data.old).to.equal(null);
        expect(event2.data.user_attribute_name).to.equal('testFalse');
        expect(event2.data.deleted).to.equal(false);
        expect(event2.data.is_new_attribute).to.equal(true);

        // check for UAC event for testEmptyString: '' when set for first time
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute(
            'testEmptyString',
            ''
        );
        const body3 = JSON.parse(`${fetchMock.lastOptions().body}`);
        expect(body3.user_attributes).to.have.property('testEmptyString', '');
        const event3 = body3.events[0];
        expect(event3).to.be.ok;
        expect(event3.event_type).to.equal('user_attribute_change');
        expect(event3.data.new).to.equal('');
        expect(event3.data.old).to.equal(null);
        expect(event3.data.user_attribute_name).to.equal('testEmptyString');
        expect(event3.data.deleted).to.equal(false);
        expect(event3.data.is_new_attribute).to.equal(true);

        // check for UAC event for testZero: 0 when set for first time
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute('testZero', 0);
        const body4 = JSON.parse(`${fetchMock.lastOptions().body}`);
        expect(body4.user_attributes).to.have.property('testZero', 0);
        const event4 = body4.events[0];
        expect(event4).to.be.ok;
        expect(event4.event_type).to.equal('user_attribute_change');
        expect(event4.data.new).to.equal(0);
        expect(event4.data.old).to.equal(null);
        expect(event4.data.user_attribute_name).to.equal('testZero');
        expect(event4.data.deleted).to.equal(false);
        expect(event4.data.is_new_attribute).to.equal(true);

        // confirm user attributes previously set already exist for user
        const userAttributes = mParticle.Identity.getCurrentUser().getAllUserAttributes();
        expect(userAttributes).to.have.property('age');
        expect(userAttributes).to.have.property('testFalse');
        expect(userAttributes).to.have.property('testEmptyString');
        expect(userAttributes).to.have.property('testZero');

        // re-set all previous attributes with the same values
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute('age', '25');
        mParticle.Identity.getCurrentUser().setUserAttribute(
            'testFalse',
            false
        );
        mParticle.Identity.getCurrentUser().setUserAttribute(
            'testEmptyString',
            ''
        );
        mParticle.Identity.getCurrentUser().setUserAttribute('testZero', 0);
        expect(fetchMock.lastOptions()).to.equal(undefined);
        expect(fetchMock.calls().length).to.equal(0);
    });

    it('should send user attribute change event when setting different falsey values', async () => {
        mParticle._resetForTests(MPConfig);

        window.mParticle.config.flags = {
            EventBatchingIntervalMillis: 0,
        };

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasIdentifyReturned);
        // set initial test attribute with 'falsey' value to 0
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute('testFalsey', 0);
        const body1 = JSON.parse(`${fetchMock.lastOptions().body}`);
        expect(body1.user_attributes).to.have.property('testFalsey', 0);
        const event1 = body1.events[0];
        expect(event1).to.be.ok;
        expect(event1.event_type).to.equal('user_attribute_change');
        expect(event1.data.new).to.equal(0);
        expect(event1.data.old).to.equal(null);
        expect(event1.data.user_attribute_name).to.equal('testFalsey');
        expect(event1.data.deleted).to.equal(false);
        expect(event1.data.is_new_attribute).to.equal(true);

        // re-set same test attribute with 'falsey' value to ''
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute('testFalsey', '');
        const body2 = JSON.parse(`${fetchMock.lastOptions().body}`);
        expect(body2.user_attributes).to.have.property('testFalsey', '');
        const event2 = body2.events[0];
        expect(event2).to.be.ok;
        expect(event2.event_type).to.equal('user_attribute_change');
        expect(event2.data.new).to.equal('');
        expect(event2.data.old).to.equal(0);
        expect(event2.data.user_attribute_name).to.equal('testFalsey');
        expect(event2.data.deleted).to.equal(false);
        expect(event2.data.is_new_attribute).to.equal(false);

        // re-set same test attribute with 'falsey' value to false
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute(
            'testFalsey',
            false
        );
        const body3 = JSON.parse(`${fetchMock.lastOptions().body}`);
        expect(body3.user_attributes).to.have.property('testFalsey', false);
        const event3 = body3.events[0];
        expect(event3).to.be.ok;
        expect(event3.event_type).to.equal('user_attribute_change');
        expect(event3.data.new).to.equal(false);
        expect(event3.data.old).to.equal('');
        expect(event3.data.user_attribute_name).to.equal('testFalsey');
        expect(event3.data.deleted).to.equal(false);
        expect(event3.data.is_new_attribute).to.equal(false);

        // re-set same test attribute with 'falsey' value to original value 0
        fetchMock.resetHistory();
        mParticle.Identity.getCurrentUser().setUserAttribute('testFalsey', 0);
        const body4 = JSON.parse(`${fetchMock.lastOptions().body}`);
        expect(body4.user_attributes).to.have.property('testFalsey', 0);
        const event4 = body4.events[0];
        expect(event4).to.be.ok;
        expect(event4.event_type).to.equal('user_attribute_change');
        expect(event4.data.new).to.equal(0);
        expect(event4.data.old).to.equal(false);
        expect(event4.data.user_attribute_name).to.equal('testFalsey');
        expect(event4.data.deleted).to.equal(false);
        expect(event4.data.is_new_attribute).to.equal(false);
    });
});