var TestsCore = require('./tests-core'),
    getEvent = TestsCore.getEvent,
    apiKey = TestsCore.apiKey,
    setCookie = TestsCore.setCookie,
    v1CookieKey = TestsCore.v1CookieKey,
    testMPID = TestsCore.testMPID,
    MessageType = TestsCore.MessageType,
    MockForwarder = TestsCore.MockForwarder;

describe('forwarders', function() {
    it('should invoke forwarder setIdentity on initialized forwarders (debug = false)', function(done) {
        mParticle.reset();
        window.mParticle.identifyRequest = {
            userIdentities: {
                google: 'google123'
            }
        };

        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        mockForwarder.configure();

        mParticle.init(apiKey);

        mockForwarder.instance.should.have.property('setUserIdentityCalled', true);

        mockForwarder.instance.userIdentities.should.have.property('4', 'google123');

        window.mParticle.identifyRequest = {};

        done();
    });

    it('does not initialize a forwarder when forwarder\'s isDebug != mParticle.isDevelopment', function(done) {
        mParticle.reset();
        mParticle.isDevelopment = false;
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            id: 1,
            isDebug: true,
            hasDebugString: false,
            isVisible: true
        });

        mParticle.init(apiKey);
        Should(mockForwarder.instance).not.be.ok();

        done();
    });

    it('initializes forwarder with isDebug = false && mParticle.isDevelopment = false', function(done) {
        mParticle.reset();
        mParticle.isDevelopment = false;
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            id: 1,
            isDebug: false,
            hasDebugString: 'false',
            isVisible: true
        });

        mParticle.init(apiKey);

        mockForwarder.instance.should.have.property('initCalled', true);

        done();
    });

    it('creates a forwarder when forwarder\'s isDebug = mParticle.isDevelopmentMode', function(done) {
        mParticle.reset();
        mParticle.isDevelopmentMode = true;
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            id: 1,
            isDebug: true,
            hasDebugString: false,
            isVisible: true
        });

        mParticle.init(apiKey);
        mockForwarder.instance.should.have.property('initCalled', true);

        done();
    });

    it('sends events to forwarder when forwarder\'s isDebug = mParticle.isDevelopmentMode ', function(done) {
        mParticle.reset();
        mParticle.isDevelopmentMode = true;
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            id: 1,
            isDebug: true,
            hasDebugString: false,
            isVisible: true
        });

        mParticle.init(apiKey);
        mParticle.logEvent('send this event to forwarder');
        mockForwarder.instance.should.have.property('processCalled', true);

        done();
    });

    it('sends events to forwarder when mParticle.isDevelopmentMode = config.isDebug = false', function(done) {
        mParticle.reset();
        mParticle.isDevelopmentMode = false;
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);

        mParticle.logEvent('send this event to forwarder');

        mockForwarder.instance.should.have.property('processCalled', true);

        done();
    });

    it('sends forwarding stats', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);

        mParticle.logEvent('send this event to forwarder',
            mParticle.EventType.Navigation,
            { 'my-key': 'my-value' });

        var event = getEvent('send this event to forwarder', true);

        Should(event).should.be.ok();

        event.should.have.property('mid', 1);
        event.should.have.property('n', 'send this event to forwarder');
        event.should.have.property('attrs');
        event.should.have.property('sdk', mParticle.getVersion());
        event.should.have.property('dt', MessageType.PageEvent);
        event.should.have.property('et', mParticle.EventType.Navigation);
        event.should.have.property('dbg', mParticle.isDevelopmentMode);
        event.should.have.property('ct');
        event.should.have.property('eec', 0);

        done();
    });

    it('should not send forwarding stats to invisible forwarders', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);
        mockForwarder.instance.isVisible = false;

        mParticle.logEvent('send this event to forwarder',
            mParticle.EventType.Navigation,
            { 'my-key': 'my-value' });

        var event = getEvent('send this event to forwarder', true);

        Should(event).should.not.have.property('n');

        done();
    });

    it('should invoke forwarder opt out', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);
        mParticle.setOptOut(true);

        mockForwarder.instance.should.have.property('setOptOutCalled', true);

        done();
    });

    it('should invoke forwarder setuserattribute', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');

        mockForwarder.instance.should.have.property('setUserAttributeCalled', true);

        done();
    });

    it('should invoke forwarder setuserattribute when calling setUserAttributeList', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttributeList('gender', ['male']);

        mockForwarder.instance.should.have.property('setUserAttributeCalled', true);

        done();
    });

    it('should invoke forwarder removeuserattribute', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().removeUserAttribute('gender');

        mockForwarder.instance.should.have.property('removeUserAttributeCalled', true);

        done();
    });

    it('should filter user attributes from forwarder', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [mParticle.generateHash('gender')],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true
        });

        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');

        mParticle.logEvent('test event');

        var event = mockForwarder.instance.receivedEvent;
        event.should.have.property('UserAttributes');
        event.UserAttributes.should.not.have.property('gender');

        done();
    });

    it('should filter user identities from forwarder', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            pageViewFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [mParticle.IdentityType.Google],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true
        });
        mParticle.init(apiKey);

        mParticle.Identity.modify({userIdentities: {google: 'test@google.com', customerid: '123'}});
        mParticle.logEvent('test event');
        var event = mockForwarder.instance.receivedEvent;

        Object.keys(event.UserIdentities).length.should.equal(1);
        Should(event.UserIdentities[mParticle.IdentityType.Google]).not.be.ok();

        done();
    });

    it('should filter event names', function(done) {
        mParticle.reset();

        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);

        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [mParticle.generateHash(mParticle.EventType.Navigation + 'test event')],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true
        });

        mParticle.init(apiKey);

        mParticle.startNewSession();
        mockForwarder.instance.receivedEvent = null;

        mParticle.logEvent('test event', mParticle.EventType.Navigation);

        Should(mockForwarder.instance.receivedEvent).not.be.ok();

        mParticle.logEvent('test event 2', mParticle.EventType.Navigation);

        Should(mockForwarder.instance.receivedEvent).be.ok();

        done();
    });

    it('should filter page event names', function(done) {
        mParticle.reset();

        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [mParticle.generateHash(mParticle.EventType.Unknown + 'PageView')],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true
        });

        mParticle.init(apiKey);

        mParticle.startNewSession();
        mockForwarder.instance.receivedEvent = null;

        mParticle.logPageView();

        Should(mockForwarder.instance.receivedEvent).not.be.ok();

        done();
    });

    it('should filter event attributes', function(done) {
        mParticle.reset();

        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [mParticle.generateHash(mParticle.EventType.Navigation + 'test event' + 'test attribute')],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true
        });

        mParticle.init(apiKey);

        mParticle.logEvent('test event', mParticle.EventType.Navigation, {
            'test attribute': 'test value',
            'test attribute 2': 'test value 2'
        });

        var event = mockForwarder.instance.receivedEvent;

        event.EventAttributes.should.not.have.property('test attribute');
        event.EventAttributes.should.have.property('test attribute 2');

        done();
    });

    it('should filter page event attributes', function(done) {
        mParticle.reset();

        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);

        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [mParticle.generateHash(mParticle.EventType.Navigation + 'test event' + 'test attribute')],
            screenNameFilters: [],
            pageViewAttributeFilters: [mParticle.generateHash(mParticle.EventType.Unknown + 'PageView' + 'hostname')],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true
        });

        mParticle.init(apiKey);

        mParticle.logPageView();

        var event = mockForwarder.instance.receivedEvent;

        event.EventAttributes.should.not.have.property('hostname');
        event.EventAttributes.should.have.property('title');

        done();
    });

    it('should call logout on forwarder', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();

        mParticle.init(apiKey);
        mParticle.Identity.logout();

        mockForwarder.instance.should.have.property('logOutCalled', true);

        done();
    });

    it('should pass in app name to forwarder on initialize', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();

        mParticle.setAppName('Unit Tests');
        mParticle.init(apiKey);

        mockForwarder.instance.should.have.property('appName', 'Unit Tests');

        done();
    });

    it('should pass in app version to forwarder on initialize', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();

        mParticle.setAppVersion('3.0');
        mParticle.init(apiKey);

        mockForwarder.instance.should.have.property('appVersion', '3.0');

        done();
    });

    it('should pass in user identities to forwarder on initialize', function(done) {
        mParticle.reset();

        setCookie(v1CookieKey, {
            ui: [{
                Identity: 'testuser@mparticle.com',
                Type: 1
            }],
            mpid: testMPID
        });

        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);

        Object.keys(mockForwarder.instance.userIdentities).length.should.equal(1);

        done();
    });

    it('should pass in user attributes to forwarder on initialize', function(done) {
        mParticle.reset();

        setCookie(v1CookieKey, {
            ua: {
                color: 'blue'
            },
            mpid: testMPID
        });

        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);

        mockForwarder.instance.should.have.property('userAttributes');
        mockForwarder.instance.userAttributes.should.have.property('color', 'blue');

        window.mParticle.identifyRequest = {};

        done();
    });

    it('should not forward event if attribute forwarding rule is set', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true,
            filteringEventAttributeValue: {
                eventAttributeName: mParticle.generateHash('ForwardingRule'),
                eventAttributeValue: mParticle.generateHash('Forward'),
                includeOnMatch: false
            }
        });

        mParticle.init(apiKey);

        mParticle.logEvent('send this event to forwarder', mParticle.EventType.Navigation, {
            ForwardingRule: 'Forward'
        });

        var event = mockForwarder.instance.receivedEvent;

        event.should.not.have.property('EventName', 'send this event to forwarder');

        done();
    });

    it('should forward event if attribute forwarding rule is set', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true,
            filteringEventAttributeValue: {
                eventAttributeName: mParticle.generateHash('ForwardingRule'),
                eventAttributeValue: mParticle.generateHash('Forward'),
                includeOnMatch: true
            }
        });

        mParticle.init(apiKey);

        mParticle.logEvent('send this event to forwarder', mParticle.EventType.Navigation, {
            ForwardingRule: 'Forward'
        });

        var event = mockForwarder.instance.receivedEvent;

        event.should.have.property('EventName', 'send this event to forwarder');

        done();
    });

    it('should not forward event if attribute forwarding true rule is set', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true,
            filteringEventAttributeValue: {
                eventAttributeName: mParticle.generateHash('ForwardingRule'),
                eventAttributeValue: mParticle.generateHash('Forward'),
                includeOnMatch: true
            }
        });

        mParticle.init(apiKey);

        mParticle.logEvent('send this event to forwarder', mParticle.EventType.Navigation, {
            Test: 'Non-Matching'
        });

        var event = mockForwarder.instance.receivedEvent;

        event.should.not.have.property('EventName', 'send this event to forwarder');

        done();
    });

    it('should send event to forwarder if filtering attribute and includingOnMatch is true', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        var filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender'),
            userAttributeValue: mParticle.generateHash('male'),
            includeOnMatch: true
        };

        var forwarder = {
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true
        };

        forwarder.filteringUserAttributeValue = filteringUserAttributeValue;

        mParticle.configureForwarder(forwarder);

        mParticle.init(apiKey);

        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'Male');

        mParticle.logEvent('test event');

        var event = mockForwarder.instance.receivedEvent;
        event.should.have.property('UserAttributes');
        event.UserAttributes.should.have.property('Gender', 'Male');
        event.EventName.should.equal('test event');

        done();
    });

    it('should not send event to forwarder if filtering attribute and includingOnMatch is false', function(done) {
        mParticle.reset();

        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        var filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender'),
            userAttributeValue: mParticle.generateHash('male'),
            includeOnMatch: false
        };

        var forwarder = {
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true
        };

        forwarder.filteringUserAttributeValue = filteringUserAttributeValue;

        mParticle.configureForwarder(forwarder);

        mParticle.init(apiKey);

        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'Male');
        //reset received event, which will have the initial session start event on it
        mockForwarder.instance.receivedEvent = null;

        mParticle.logEvent('test event');
        var event = mockForwarder.instance.receivedEvent;

        Should(event).not.be.ok();

        done();
    });

    it('should send event to forwarder if there are no user attributes on event if includeOnMatch = false', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        var filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender'),
            userAttributeValue: mParticle.generateHash('male'),
            includeOnMatch: false
        };

        var forwarder = {
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true
        };

        forwarder.filteringUserAttributeValue = filteringUserAttributeValue;

        mParticle.configureForwarder(forwarder);

        mParticle.init(apiKey);

        mParticle.logEvent('test event');

        var event = mockForwarder.instance.receivedEvent;
        mockForwarder.instance.receivedEvent.EventName.should.equal('test event');
        Should(event).be.ok();

        done();
    });

    it('should not send event to forwarder if there are no user attributes on event if includeOnMatch = true', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        var filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender'),
            userAttributeValue: mParticle.generateHash('male'),
            includeOnMatch: true
        };

        var forwarder = {
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true
        };

        forwarder.filteringUserAttributeValue = filteringUserAttributeValue;

        mParticle.configureForwarder(forwarder);

        mParticle.init(apiKey);

        mParticle.logEvent('test event');

        var event = mockForwarder.instance.receivedEvent;
        Should(event).not.be.ok();

        done();
    });

    it('should send event to forwarder if there is no match and includeOnMatch = false', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        var filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender'),
            userAttributeValue: mParticle.generateHash('male'),
            includeOnMatch: false
        };

        var forwarder = {
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true
        };

        forwarder.filteringUserAttributeValue = filteringUserAttributeValue;

        mParticle.configureForwarder(forwarder);

        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'female');
        mParticle.logEvent('test event');

        var event = mockForwarder.instance.receivedEvent;
        Should(event).be.ok();
        event.EventName.should.equal('test event');

        done();
    });

    it('should not send event to forwarder if there is no match and includeOnMatch = true', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        var filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender'),
            userAttributeValue: mParticle.generateHash('male'),
            includeOnMatch: true
        };

        var forwarder = {
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true
        };

        forwarder.filteringUserAttributeValue = filteringUserAttributeValue;

        mParticle.configureForwarder(forwarder);

        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'female');
        mParticle.logEvent('test event');

        var event = mockForwarder.instance.receivedEvent;
        Should(event).not.be.ok();

        done();
    });

    it('should send event to forwarder if the filterinUserAttribute object is invalid', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        var filteringUserAttributeValue = undefined;

        var forwarder = {
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true
        };

        forwarder.filteringUserAttributeValue = filteringUserAttributeValue;

        mParticle.configureForwarder(forwarder);

        mParticle.init(apiKey);
        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'Male');

        mParticle.logEvent('test event');
        var event = mockForwarder.instance.receivedEvent;

        Should(event).be.ok();
        mockForwarder.instance.receivedEvent.EventName.should.equal('test event');

        done();
    });
});
