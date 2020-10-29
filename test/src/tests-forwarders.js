import Utils from './utils';
import sinon from 'sinon';
import { urls } from './config';
import { apiKey, MPConfig, testMPID, MessageType } from './config';

var getEvent = Utils.getEvent,
    getForwarderEvent = Utils.getForwarderEvent,
    setLocalStorage = Utils.setLocalStorage,
    forwarderDefaultConfiguration = Utils.forwarderDefaultConfiguration,
    MockForwarder = Utils.MockForwarder,
    mockServer;

describe('forwarders', function() {
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

        mockServer.respondWith(urls.forwarding, [
            202,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        delete window.MockForwarder1;
        mockServer.restore();
    });

    it('should add forwarders via dynamic script loading via the addForwarder method', function(done) {
        mParticle._resetForTests(MPConfig);

        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        window.mParticle.config.kitConfigs.push(
            forwarderDefaultConfiguration('MockForwarder')
        );

        mParticle.init(apiKey, window.mParticle.config);

        mParticle
            .getInstance()
            ._getActiveForwarders()
            .length.should.equal(1);

        done();
    });

    it('should invoke forwarder setIdentity on initialized forwarders (debug = false)', function(done) {
        mParticle._resetForTests(MPConfig);
        window.mParticle.config.identifyRequest = {
            userIdentities: {
                google: 'google123',
            },
        };

        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        window.mParticle.config.kitConfigs.push(
            forwarderDefaultConfiguration('MockForwarder')
        );

        mParticle.init(apiKey, window.mParticle.config);

        window.MockForwarder1.instance.should.have.property(
            'setUserIdentityCalled',
            true
        );
        window.MockForwarder1.instance.userIdentities.should.have.property(
            '4',
            'google123'
        );

        window.mParticle.identifyRequest = {};

        done();
    });

    it('should permit forwarder if no consent configured.', function(done) {
        mParticle._resetForTests(MPConfig);

        mParticle.config.isDevelopmentMode = false;
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config = forwarderDefaultConfiguration('MockForwarder');
        config.filteringConsentRuleValues = {};
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        var enabled = mParticle
            .getInstance()
            ._Forwarders.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                null
            );
        enabled.should.be.ok();
        done();
    });

    it('should not permit forwarder if consent configured but there is no user.', function(done) {
        var enableForwarder = true;
        var consented = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config = forwarderDefaultConfiguration('MockForwarder');
        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: '123',
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);
        var enabled = mParticle
            .getInstance()
            ._Forwarders.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                null
            );
        enabled.should.not.be.ok();
        done();
    });

    var MockUser = function() {
        var consentState = null;
        return {
            setConsentState: function(state) {
                consentState = state;
            },
            getConsentState: function() {
                return consentState;
            },
        };
    };

    it('should disable forwarder if \'do not forward\' is selected and consent has been rejected', function(done) {
        var enableForwarder = false;   // 'do not forward' chosen in UI, 'includeOnMatch' in config
        var consented = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        var config = forwarderDefaultConfiguration('MockForwarder');

        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(consented)
            );
        var user = MockUser();
        user.setConsentState(consentState);
        var enabled = mParticle
            .getInstance()
            ._Forwarders.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.not.be.ok();
        done();
    });

    it('should disable forwarder if \'do not forward\' is selected and consent has been accepted.', function(done) {
        var enableForwarder = false;   // 'do not forward' chosen in UI, 'includeOnMatch' in config
        var consented = true;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        var config = forwarderDefaultConfiguration('MockForwarder');
        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(consented)
            );
        var user = MockUser();
        user.setConsentState(consentState);
        var enabled = mParticle
            .getInstance()
            ._Forwarders.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.not.be.ok();
        done();
    });

    it('should enable forwarder if \'only forward\' is selected and consent has been rejected.', function(done) {
        var enableForwarder = true;   // 'only forward if' in UI, 'includeOnMatch' in config
        var consented = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config = forwarderDefaultConfiguration('MockForwarder');
        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(consented)
            );
        var user = MockUser();
        user.setConsentState(consentState);
        var enabled = mParticle
            .getInstance()
            ._Forwarders.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.be.ok();
        done();
    });

    it('should enable forwarder if \'only forward if\' is selected and consent has been accepted.', function(done) {
        var enableForwarder = true;   // 'only forward if' in UI, 'includeOnMatch' in config
        var consented = true;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        var config = forwarderDefaultConfiguration('MockForwarder');
        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(true)
            );
        var user = MockUser();
        user.setConsentState(consentState);
        var enabled = mParticle
            .getInstance()
            ._Forwarders.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.be.ok();
        done();
    });

    it('should enable forwarder if \'only forward\' is selected and CCPA data sale opt out is present.', function(done) {
        var enableForwarder = true;   // 'only forward' in UI, 'includeOnMatch' in config
        var consentPresent = true;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        var config = forwarderDefaultConfiguration('MockForwarder');

        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consentPresent,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(consentPresent)
            );
        var user = MockUser();
        user.setConsentState(consentState);

        var enabled = mParticle
            .getInstance()
            ._Forwarders.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.be.ok();
        done();
    });

    it('should enable forwarder if \'only forward\' is selected and CCPA data sale opt out is not present.', function(done) {
        var enableForwarder = true;   // 'only forward' in UI, 'includeOnMatch' in config
        var consentPresent = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        var config = forwarderDefaultConfiguration('MockForwarder');

        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consentPresent,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(consentPresent)
            );
        var user = MockUser();
        user.setConsentState(consentState);

        var enabled = mParticle
            .getInstance()
            ._Forwarders.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.be.ok();
        done();
    });

    it('should disable forwarder if \'do not forward\' is selected and CCPA data sale opt out is present.', function(done) {
        var enableForwarder = false;   // 'do not forward' in UI, 'includeOnMatch' in config
        var consentPresent = true;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        var config = forwarderDefaultConfiguration('MockForwarder');

        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consentPresent,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(consentPresent)
            );
        var user = MockUser();
        user.setConsentState(consentState);

        var enabled = mParticle
            .getInstance()
            ._Forwarders.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.not.be.ok();
        done();
    });

    it('should disable forwarder if \'do not forward\' is selected and CCPA data sale opt out is not present.', function(done) {
        var enableForwarder = false;   // 'do not forward' in UI, 'includeOnMatch' in config
        var consentPresent = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        var config = forwarderDefaultConfiguration('MockForwarder');

        config.filteringConsentRuleValues = {
            includeOnMatch: enableForwarder,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consentPresent,
                },
            ],
        };
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(consentPresent)
            );
        var user = MockUser();
        user.setConsentState(consentState);

        var enabled = mParticle
            .getInstance()
            ._Forwarders.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.not.be.ok();
        done();
    });

    it("does not initialize a forwarder when forwarder's isDebug != mParticle.isDevelopmentMode", function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        var config = forwarderDefaultConfiguration();
        config.isDebug = true;

        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        Should(window.MockForwarder1).not.be.ok();
        mParticle
            .getInstance()
            ._getActiveForwarders()
            .length.should.equal(0);

        done();
    });

    it('initializes a forwarder with isDebug = false && mParticle.config.isDevelopmentMode = false', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config = forwarderDefaultConfiguration();
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        window.MockForwarder1.instance.should.have.property('initCalled', true);
        mParticle
            .getInstance()
            ._getActiveForwarders()
            .length.should.equal(1);
        Should(
            mParticle.getInstance()._Store.configuredForwarders.length
        ).equal(1);

        done();
    });

    it('initializes a forwarder with isDebug = true && mParticle.config.isDevelopmentMode = true', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = true;
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config = forwarderDefaultConfiguration();
        config.isDebug = true;

        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);
        window.MockForwarder1.instance.should.have.property('initCalled', true);
        Should(
            mParticle.getInstance()._Store.configuredForwarders.length
        ).equal(1);

        done();
    });

    it('initializes forwarders when isDebug = mParticle.config.isDevelopmentMode', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.isDebug = true;

        var config2 = forwarderDefaultConfiguration('MockForwarder', 1);

        window.mParticle.config.kitConfigs.push(config1);
        window.mParticle.config.kitConfigs.push(config2);

        mParticle.init(apiKey, window.mParticle.config);
        mParticle
            .getInstance()
            ._getActiveForwarders()
            .length.should.equal(1);
        Should(
            mParticle.getInstance()._Store.configuredForwarders.length
        ).equal(1);

        done();
    });

    it("sends events to forwarder when forwarder's isDebug = mParticle.config.isDevelopmentMode ", function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = true;
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.isDebug = true;
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.logEvent('send this event to forwarder');
        window.MockForwarder1.instance.should.have.property(
            'processCalled',
            true
        );

        done();
    });

    it('sends events to forwarder v1 endpoint when mParticle.config.isDevelopmentMode = config.isDebug = false', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mockServer.requests = [];

        mParticle.logEvent('send this event to forwarder');

        window.MockForwarder1.instance.should.have.property(
            'processCalled',
            true
        );

        mockServer.requests[mockServer.requests.length-1].url.includes('/v1/JS/test_key/Forwarding');

        done();
    });

    it('sends forwarding stats to v2 endpoint when featureFlag setting of batching is true', function(done) {
        mParticle._resetForTests(MPConfig);
        var clock = sinon.useFakeTimers();
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        window.mParticle.config.dataPlan = {
            planVersion: 10,
            planId: 'plan-slug',
        };

        window.mParticle.config.flags = {
            reportBatching: true,
        };
        mParticle.init(apiKey, window.mParticle.config);
        mockServer.requests = [];

        mParticle.logEvent(
            'send this event to forwarder',
            mParticle.EventType.Navigation,
            { 'my-key': 'my-value' }
        );
        clock.tick(5000);
        
        var event = getForwarderEvent(mockServer.requests, 'send this event to forwarder', true);
        Should(event).should.be.ok();

        mockServer.requests[mockServer.requests.length-1].url.includes('/v2/JS/test_key/Forwarding');
        event.should.have.property('mid', 1);
        event.should.have.property('esid', 1234567890);
        event.should.have.property('n', 'send this event to forwarder');
        event.should.have.property('attrs');
        event.should.have.property('dp');
        event.dp.should.have.property('PlanVersion', 10);
        event.dp.should.have.property('PlanId', 'plan-slug');
        event.should.have.property('dp');
        event.should.have.property('sdk', mParticle.getVersion());
        event.should.have.property('dt', MessageType.PageEvent);
        event.should.have.property('et', mParticle.EventType.Navigation);
        event.should.have.property(
            'dbg',
            mParticle.getInstance()._Store.SDKConfig.isDevelopmentMode
        );
        event.should.have.property('ct');
        event.should.have.property('eec', 0);
        clock.restore();

        done();
    });

    it('should not send forwarding stats to invisible forwarders', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        window.MockForwarder1.instance.isVisible = false;

        mParticle.logEvent(
            'send this event to forwarder',
            mParticle.EventType.Navigation,
            { 'my-key': 'my-value' }
        );

        var event = getEvent(mockServer.requests, 'send this event to forwarder', true);

        Should(event).should.not.have.property('n');

        done();
    });

    it('should invoke forwarder opt out', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.setOptOut(true);

        window.MockForwarder1.instance.should.have.property(
            'setOptOutCalled',
            true
        );

        done();
    });

    it('should invoke forwarder setuserattribute', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');

        window.MockForwarder1.instance.should.have.property(
            'setUserAttributeCalled',
            true
        );

        done();
    });

    it('should invoke forwarder setuserattribute when calling setUserAttributeList', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);
        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.getCurrentUser().setUserAttributeList('gender', [
            'male',
        ]);

        window.MockForwarder1.instance.should.have.property(
            'setUserAttributeCalled',
            true
        );

        done();
    });

    it('should invoke forwarder removeuserattribute', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);
        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().removeUserAttribute('gender');

        window.MockForwarder1.instance.should.have.property(
            'removeUserAttributeCalled',
            true
        );

        done();
    });

    it('should filter user attributes from forwarder on log event', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.userAttributeFilters = [mParticle.generateHash('gender')];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');

        mParticle.logEvent('test event');

        var event = window.MockForwarder1.instance.receivedEvent;
        event.should.have.property('UserAttributes');
        event.UserAttributes.should.not.have.property('gender');

        done();
    });

    it('should filter user identities from forwarder on init and bring customerid as first ID', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        mParticle.init(apiKey, window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.userIdentityFilters = [mParticle.IdentityType.Google];
        window.mParticle.config.kitConfigs.push(config1);

        mockServer.respondWith(urls.modify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mParticle.Identity.modify({
            userIdentities: {
                google: 'test@google.com',
                email: 'test@gmail.com',
                customerid: '123',
            },
        });

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.userIdentitiesFilterOnInitTest.length.should.equal(2);
        mParticle.userIdentitiesFilterOnInitTest[0].Type.should.equal(1);
        mParticle.userIdentitiesFilterOnInitTest[0].Identity.should.equal(
            '123'
        );
        mParticle.userIdentitiesFilterOnInitTest[1].Type.should.equal(7);
        mParticle.userIdentitiesFilterOnInitTest[1].Identity.should.equal(
            'test@gmail.com'
        );
        Should(mParticle.userIdentitiesFilterOnInitTest[2]).not.be.ok();

        done();
    });

    it('should filter user identities from forwarder on log event and bring customerid as first ID', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.userIdentityFilters = [mParticle.IdentityType.Google];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mockServer.respondWith(urls.modify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mParticle.Identity.modify({
            userIdentities: {
                google: 'test@google.com',
                email: 'test@gmail.com',
                customerid: '123',
            },
        });
        mParticle.logEvent('test event');
        var event = window.MockForwarder1.instance.receivedEvent;

        Object.keys(event.UserIdentities).length.should.equal(2);
        var googleUserIdentityExits = false;
        event.UserIdentities.forEach(function(identity) {
            if (identity.Type === mParticle.IdentityType.Google) {
                googleUserIdentityExits = true;
            }
        });
        Should(googleUserIdentityExits).not.be.ok();

        event.UserIdentities[0].Type.should.equal(
            mParticle.IdentityType.CustomerId
        );

        done();
    });

    it('should filter user attributes from forwarder on init, and on subsequent set attribute calls', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.userAttributeFilters = [
            mParticle.generateHash('gender'),
            mParticle.generateHash('age'),
        ];
        window.mParticle.config.kitConfigs.push(config1);
        mParticle.init(apiKey, window.mParticle.config);

        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.userAttributesFilterOnInitTest.should.not.have.property(
            'gender'
        );

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.Identity.getCurrentUser().setUserAttribute('age', 32);
        mParticle.Identity.getCurrentUser().setUserAttribute('weight', 150);

        window.MockForwarder1.instance.userAttributes.should.have.property(
            'weight',
            150
        );
        window.MockForwarder1.instance.userAttributes.should.not.have.property(
            'age'
        );

        done();
    });

    it('should filter event names', function(done) {
        mParticle._resetForTests(MPConfig);

        var mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.eventNameFilters = [
            mParticle.generateHash(
                mParticle.EventType.Navigation + 'test event'
            ),
        ];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.startNewSession();
        window.MockForwarder1.instance.receivedEvent = null;

        mParticle.logEvent('test event', mParticle.EventType.Navigation);

        Should(window.MockForwarder1.instance.receivedEvent).not.be.ok();

        mParticle.logEvent('test event 2', mParticle.EventType.Navigation);

        Should(window.MockForwarder1.instance.receivedEvent).be.ok();

        done();
    });

    it('should filter page event names', function(done) {
        mParticle._resetForTests(MPConfig);

        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.screenNameFilters = [
            mParticle.generateHash(mParticle.EventType.Unknown + 'PageView'),
        ];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.startNewSession();
        window.MockForwarder1.instance.receivedEvent = null;

        mParticle.logPageView();

        Should(window.MockForwarder1.instance.receivedEvent).not.be.ok();

        done();
    });

    it('should filter event attributes', function(done) {
        mParticle._resetForTests(MPConfig);

        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.attributeFilters = [
            mParticle.generateHash(
                mParticle.EventType.Navigation + 'test event' + 'test attribute'
            ),
        ];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.logEvent('test event', mParticle.EventType.Navigation, {
            'test attribute': 'test value',
            'test attribute 2': 'test value 2',
        });

        var event = window.MockForwarder1.instance.receivedEvent;

        event.EventAttributes.should.not.have.property('test attribute');
        event.EventAttributes.should.have.property('test attribute 2');

        done();
    });

    it('should filter page event attributes', function(done) {
        mParticle._resetForTests(MPConfig);

        var mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.attributeFilters = [
            mParticle.generateHash(
                mParticle.EventType.Navigation + 'test event' + 'test attribute'
            ),
        ];
        config1.pageViewAttributeFilters = [
            mParticle.generateHash(
                mParticle.EventType.Unknown + 'PageView' + 'hostname'
            ),
        ];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.logPageView();

        var event = window.MockForwarder1.instance.receivedEvent;

        event.EventAttributes.should.not.have.property('hostname');
        event.EventAttributes.should.have.property('title');

        done();
    });

    it('should call logout on forwarder', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.logout();

        window.MockForwarder1.instance.should.have.property(
            'logOutCalled',
            true
        );

        done();
    });

    it('should pass in app name to forwarder on initialize', function(done) {
        mParticle.config.appName = 'Unit Tests';
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        window.MockForwarder1.instance.should.have.property(
            'appName',
            'Unit Tests'
        );

        done();
    });

    it('should pass in app version to forwarder on initialize', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.config.appVersion = '3.0';
        mParticle.init(apiKey, window.mParticle.config);

        window.MockForwarder1.instance.should.have.property(
            'appVersion',
            '3.0'
        );

        done();
    });

    it('should pass in user identities to forwarder on initialize', function(done) {
        mParticle._resetForTests(MPConfig);

        setLocalStorage();

        var mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);
        mParticle.init(apiKey, window.mParticle.config);

        Object.keys(
            window.MockForwarder1.instance.userIdentities
        ).length.should.equal(1);

        done();
    });

    it('should pass in user attributes to forwarder on initialize', function(done) {
        mParticle._resetForTests(MPConfig);

        setLocalStorage();

        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);
        mParticle.init(apiKey, window.mParticle.config);

        window.MockForwarder1.instance.should.have.property('userAttributes');
        window.MockForwarder1.instance.userAttributes.should.have.property(
            'color',
            'blue'
        );

        window.mParticle.identifyRequest = {};

        done();
    });

    it('should not forward event if attribute forwarding rule is set', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringEventAttributeValue = {
            eventAttributeName: mParticle
                .generateHash('ForwardingRule')
                .toString(),
            eventAttributeValue: mParticle.generateHash('Forward').toString(),
            includeOnMatch: false,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.logEvent(
            'send this event to forwarder',
            mParticle.EventType.Navigation,
            {
                ForwardingRule: 'Forward',
            }
        );

        var event = window.MockForwarder1.instance.receivedEvent;

        event.should.not.have.property(
            'EventName',
            'send this event to forwarder'
        );

        done();
    });

    it('should forward event if event attribute forwarding rule is set and includeOnMatch is true', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringEventAttributeValue = {
            eventAttributeName: mParticle
                .generateHash('ForwardingRule')
                .toString(),
            eventAttributeValue: mParticle.generateHash('Forward').toString(),
            includeOnMatch: true,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.logEvent(
            'send this event to forwarder',
            mParticle.EventType.Navigation,
            {
                Foo: 'Bar',
                ForwardingRule: 'Forward',
            }
        );

        var event = window.MockForwarder1.instance.receivedEvent;

        event.should.have.property('EventName', 'send this event to forwarder');

        done();
    });

    it('should not forward event if event attribute forwarding rule is set and includeOnMatch is true but attributes do not match', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringEventAttributeValue = {
            eventAttributeName: mParticle
                .generateHash('ForwardingRule')
                .toString(),
            eventAttributeValue: mParticle.generateHash('Forward').toString(),
            includeOnMatch: true,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.logEvent(
            'send this event to forwarder',
            mParticle.EventType.Navigation,
            {
                Forwarding: 'Non-Matching',
            }
        );

        var event = window.MockForwarder1.instance.receivedEvent;

        event.should.not.have.property(
            'EventName',
            'send this event to forwarder'
        );

        done();
    });

    it('should not forward event if event attribute forwarding rule is set and includeOnMatch is false', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringEventAttributeValue = {
            eventAttributeName: mParticle
                .generateHash('ForwardingRule')
                .toString(),
            eventAttributeValue: mParticle.generateHash('Forward').toString(),
            includeOnMatch: false,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        window.MockForwarder1.instance.receivedEvent.EventName.should.equal(1);
        window.MockForwarder1.instance.receivedEvent = null;

        mParticle.logEvent(
            'send this event to forwarder',
            mParticle.EventType.Navigation,
            {
                ForwardingRule: 'Forward',
            }
        );

        var event = window.MockForwarder1.instance.receivedEvent;

        Should(event).not.be.ok();

        done();
    });

    it('should forward event if event attribute forwarding rule is set and includeOnMatch is false but attributes do not match', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringEventAttributeValue = {
            eventAttributeName: mParticle
                .generateHash('ForwardingRule')
                .toString(),
            eventAttributeValue: mParticle.generateHash('Forward').toString(),
            includeOnMatch: false,
        };

        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        window.MockForwarder1.instance.receivedEvent.EventName.should.equal(1);
        window.MockForwarder1.instance.receivedEvent = null;

        mParticle.logEvent(
            'send this event to forwarder',
            mParticle.EventType.Navigation,
            {
                Test: 'does not match',
            }
        );

        var event = window.MockForwarder1.instance.receivedEvent;

        event.should.have.property('EventName', 'send this event to forwarder');

        done();
    });

    it('should send event to forwarder if filtering attribute and includingOnMatch is true', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender').toString(),
            userAttributeValue: mParticle.generateHash('male').toString(),
            includeOnMatch: true,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'Male');

        mParticle.logEvent('test event');

        var event = window.MockForwarder1.instance.receivedEvent;
        event.should.have.property('UserAttributes');
        event.UserAttributes.should.have.property('Gender', 'Male');
        event.EventName.should.equal('test event');

        done();
    });

    it('should not send event to forwarder if filtering attribute and includingOnMatch is false', function(done) {
        mParticle._resetForTests(MPConfig);

        var mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender').toString(),
            userAttributeValue: mParticle.generateHash('male').toString(),
            includeOnMatch: false,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'Male');
        //reset received event, which will have the initial session start event on it
        window.MockForwarder1.instance.receivedEvent = null;

        mParticle.logEvent('test event');
        var event = window.MockForwarder1.instance.receivedEvent;

        Should(event).not.be.ok();

        done();
    });

    it('should permit forwarder if no user attribute value filters configured', function(done) {
        var enabled = mParticle
            .getInstance()
            ._Forwarders.isEnabledForUserAttributes(null, null);
        enabled.should.be.ok();

        enabled = mParticle
            .getInstance()
            ._Forwarders.isEnabledForUserAttributes({}, null);
        enabled.should.be.ok();
        done();
    });

    it('should send event to forwarder if there are no user attributes on event if includeOnMatch = false', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender').toString(),
            userAttributeValue: mParticle.generateHash('male').toString(),
            includeOnMatch: false,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.logEvent('test event');

        var event = window.MockForwarder1.instance.receivedEvent;
        window.MockForwarder1.instance.receivedEvent.EventName.should.equal(
            'test event'
        );
        Should(event).be.ok();

        done();
    });

    it('should not send event to forwarder if there are no user attributes on event if includeOnMatch = true', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender').toString(),
            userAttributeValue: mParticle.generateHash('male').toString(),
            includeOnMatch: true,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.logEvent('test event');

        var event = window.MockForwarder1.instance.receivedEvent;
        Should(event).not.be.ok();

        done();
    });

    it('should send event to forwarder if there is no match and includeOnMatch = false', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender').toString(),
            userAttributeValue: mParticle.generateHash('male').toString(),
            includeOnMatch: false,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.getCurrentUser().setUserAttribute(
            'gender',
            'female'
        );
        mParticle.logEvent('test event');

        var event = window.MockForwarder1.instance.receivedEvent;
        Should(event).be.ok();
        event.EventName.should.equal('test event');

        done();
    });

    it('should not send event to forwarder if there is no match and includeOnMatch = true', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender').toString(),
            userAttributeValue: mParticle.generateHash('male').toString(),
            includeOnMatch: true,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.getCurrentUser().setUserAttribute(
            'gender',
            'female'
        );
        mParticle.logEvent('test event');

        var event = window.MockForwarder1.instance.receivedEvent;
        Should(event).not.be.ok();

        done();
    });

    it('should reinitialize forwarders when user attribute changes', function(done) {
        mParticle._resetForTests(MPConfig);

        var mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender').toString(),
            userAttributeValue: mParticle.generateHash('male').toString(),
            includeOnMatch: false,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'Male');

        var activeForwarders = mParticle.getInstance()._getActiveForwarders();
        activeForwarders.length.should.equal(0);

        window.MockForwarder1.instance.receivedEvent = null;

        mParticle.logEvent('test event');
        var event = window.MockForwarder1.instance.receivedEvent;

        Should(event).not.be.ok();

        mParticle.Identity.getCurrentUser().setUserAttribute(
            'Gender',
            'famale'
        );

        activeForwarders = mParticle.getInstance()._getActiveForwarders();
        activeForwarders.length.should.equal(1);

        window.MockForwarder1.instance.receivedEvent = null;

        mParticle.logEvent('test event');
        event = window.MockForwarder1.instance.receivedEvent;

        Should(event).be.ok();

        done();
    });

    it('should send event to forwarder if the filterinUserAttribute object is invalid', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringUserAttributeValue = undefined;
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'Male');

        mParticle.logEvent('test event');
        var event = window.MockForwarder1.instance.receivedEvent;

        Should(event).be.ok();
        window.MockForwarder1.instance.receivedEvent.EventName.should.equal(
            'test event'
        );

        done();
    });

    it('should call forwarder onUserIdentified method when identity is returned', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        window.MockForwarder1.instance.should.have.property(
            'onUserIdentifiedCalled',
            true
        );

        done();
    });

    it('should queue forwarder stats reporting and send after 5 seconds if batching feature is true', function(done) {
        var clock = sinon.useFakeTimers();

        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        window.mParticle.config.flags = {
            reportBatching: true,
        };

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.logEvent('not in forwarder');
        var product = mParticle.eCommerce.createProduct(
            'iphone',
            'sku',
            123,
            1
        );
        mParticle.eCommerce.Cart.add(product, true);

        var result = getForwarderEvent(mockServer.requests, 'not in forwarder');

        Should(result).not.be.ok();
        clock.tick(5001);

        result = getForwarderEvent(mockServer.requests, 'not in forwarder');
        result.should.be.ok();
        result = getForwarderEvent(mockServer.requests, 'eCommerce - AddToCart');
        result.should.be.ok();
        clock.restore();

        done();
    });

    it('should initialize forwarders when a user is not logged in and excludeAnonymousUser=false', function(done) {
        mParticle._resetForTests(MPConfig);

        var mockForwarder = new MockForwarder();
        var mockForwarder2 = new MockForwarder('MockForwarder2', 2);

        mockForwarder.register(window.mParticle.config);
        mockForwarder2.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.excludeAnonymousUser = false;

        var config2 = forwarderDefaultConfiguration('MockForwarder', 2);
        config2.excludeAnonymousUser = true;
        window.mParticle.config.kitConfigs.push(config1);
        window.mParticle.config.kitConfigs.push(config2);

        
        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mParticle.init(apiKey, window.mParticle.config);

        var activeForwarders = mParticle.getInstance()._getActiveForwarders();

        activeForwarders.length.should.equal(1);
        mParticle.Identity.getCurrentUser()
            .isLoggedIn()
            .should.equal(false);

        done();
    });

    it('should only initialize forwarders with excludeUnknownUser = false for non-logged-in users', function(done) {
        mParticle._resetForTests(MPConfig);

        var mockForwarder = new MockForwarder();
        var mockForwarder2 = new MockForwarder('MockForwarder2', 2);
        mockForwarder.register(window.mParticle.config);
        mockForwarder2.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.excludeAnonymousUser = false;

        var config2 = forwarderDefaultConfiguration('MockForwarder', 2);
        config2.excludeAnonymousUser = true;

        window.mParticle.config.kitConfigs.push(config1);
        window.mParticle.config.kitConfigs.push(config2);

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mockServer.respondWith(urls.eventsV2, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mParticle.init(apiKey, window.mParticle.config);

        var activeForwarders = mParticle.getInstance()._getActiveForwarders();

        activeForwarders.length.should.equal(1);
        mParticle.Identity.getCurrentUser()
            .isLoggedIn()
            .should.equal(false);

        done();
    });

    it('should initialize all forwarders when a user is logged in and the page reloads', function(done) {
        mParticle._resetForTests(MPConfig);

        var mockForwarder = new MockForwarder();
        var mockForwarder2 = new MockForwarder('MockForwarder2', 2);

        mockForwarder.register(window.mParticle.config);
        mockForwarder2.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.excludeAnonymousUser = false;

        var config2 = forwarderDefaultConfiguration('MockForwarder', 2);
        config2.excludeAnonymousUser = true;

        window.mParticle.config.kitConfigs.push(config1);
        window.mParticle.config.kitConfigs.push(config2);

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.getCurrentUser()
            .isLoggedIn()
            .should.equal(false);
        var user = {
            userIdentities: {
                customerid: 'customerid3',
                email: 'email3@test.com',
            },
        };

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID2', is_logged_in: true }),
        ]);

        mParticle.Identity.login(user);
        mParticle.Identity.getCurrentUser()
            .isLoggedIn()
            .should.equal(true);
        var activeForwarders = mParticle.getInstance()._getActiveForwarders();
        activeForwarders.length.should.equal(2);

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.getCurrentUser()
            .isLoggedIn()
            .should.equal(true);
        var activeForwarders2 = mParticle.getInstance()._getActiveForwarders();
        activeForwarders2.length.should.equal(2);

        done();
    });

    it('should save logged in status of most recent user to cookies when logged in', function(done) {
        mParticle._resetForTests(MPConfig);

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: true }),
        ]);

        mParticle.init(apiKey, window.mParticle.config);
        var ls = mParticle.getInstance()._Persistence.getLocalStorage();
        ls.l.should.equal(true);

        mParticle.init(apiKey, window.mParticle.config);
        var ls2 = mParticle.getInstance()._Persistence.getLocalStorage();
        ls2.hasOwnProperty('l').should.equal(true);

        mockServer.respondWith(urls.logout, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mParticle.Identity.logout();
        var ls3 = mParticle.getInstance()._Persistence.getLocalStorage();
        ls3.l.should.equal(false);

        mParticle.init(apiKey, window.mParticle.config);
        var ls4 = mParticle.getInstance()._Persistence.getLocalStorage();
        ls4.l.should.equal(false);

        done();
    });

    it('should not set integration attributes on forwarders when a non-object attr is passed', function(done) {
        mParticle.setIntegrationAttribute(128, 123);
        var adobeIntegrationAttributes = mParticle.getIntegrationAttributes(
            128
        );
        Object.keys(adobeIntegrationAttributes).length.should.equal(0);

        done();
    });

    it('should set integration attributes on forwarders', function(done) {
        mParticle.setIntegrationAttribute(128, { MCID: 'abcdefg' });
        var adobeIntegrationAttributes = mParticle.getIntegrationAttributes(
            128
        );

        adobeIntegrationAttributes.MCID.should.equal('abcdefg');

        done();
    });

    it('should clear integration attributes when an empty object or a null is passed', function(done) {
        mParticle.setIntegrationAttribute(128, { MCID: 'abcdefg' });
        var adobeIntegrationAttributes = mParticle.getIntegrationAttributes(
            128
        );
        Object.keys(adobeIntegrationAttributes).length.should.equal(1);

        mParticle.setIntegrationAttribute(128, {});
        adobeIntegrationAttributes = mParticle.getIntegrationAttributes(128);
        Object.keys(adobeIntegrationAttributes).length.should.equal(0);

        mParticle.setIntegrationAttribute(128, { MCID: 'abcdefg' });
        adobeIntegrationAttributes = mParticle.getIntegrationAttributes(128);
        Object.keys(adobeIntegrationAttributes).length.should.equal(1);

        mParticle.setIntegrationAttribute(128, null);
        adobeIntegrationAttributes = mParticle.getIntegrationAttributes(128);
        Object.keys(adobeIntegrationAttributes).length.should.equal(0);

        done();
    });

    it('should set only strings as integration attributes', function(done) {
        mParticle.setIntegrationAttribute(128, {
            MCID: 'abcdefg',
            fail: { test: 'false' },
            nullValue: null,
            undefinedValue: undefined,
        });

        var adobeIntegrationAttributes = mParticle.getIntegrationAttributes(
            128
        );
        Object.keys(adobeIntegrationAttributes).length.should.equal(1);

        done();
    });

    it('should add integration delays to the integrationDelays object', function(done) {
        mParticle._setIntegrationDelay(128, true);
        mParticle._setIntegrationDelay(24, false);
        mParticle._setIntegrationDelay(10, true);

        var integrationDelays = mParticle._getIntegrationDelays();

        integrationDelays.should.have.property('128', true);
        integrationDelays.should.have.property('24', false);
        integrationDelays.should.have.property('10', true);

        done();
    });

    it('integration test - should not log events if there are any integrations delaying, then resume logging events once delays are gone', function(done) {
        mParticle._resetForTests(MPConfig);
        // this code will be put in each forwarder as each forwarder is initialized
        mParticle._setIntegrationDelay(128, true);
        mParticle._setIntegrationDelay(24, false);
        mParticle._setIntegrationDelay(10, true);

        mParticle.init(apiKey, window.mParticle.config);
        mockServer.requests = [];
        mParticle.logEvent('test1');
        mockServer.requests.length.should.equal(0);

        mParticle._setIntegrationDelay(10, false);
        mParticle._setIntegrationDelay(128, false);
        mParticle.logEvent('test2');
        mockServer.requests.length.should.equal(4);
        var sessionStartEvent = getEvent(mockServer.requests, 1);
        var astEvent = getEvent(mockServer.requests, 10);
        var test1 = getEvent(mockServer.requests, 'test1');
        var test2 = getEvent(mockServer.requests, 'test2');

        (typeof sessionStartEvent === 'object').should.equal(true);
        (typeof astEvent === 'object').should.equal(true);
        (typeof test1 === 'object').should.equal(true);
        (typeof test2 === 'object').should.equal(true);

        done();
    });

    it('integration test - should send events after a configured delay, or 5 seconds by default if setIntegrationDelays are still true', function(done) {
        // testing default of 5000 ms
        var clock = sinon.useFakeTimers();
        mParticle._resetForTests(MPConfig);
        // this code will be put in each forwarder as each forwarder is initialized
        mParticle._setIntegrationDelay(128, true);
        Should(
            Object.keys(mParticle.getInstance()._preInit.integrationDelays)
                .length
        ).equal(1);
        mParticle._setIntegrationDelay(24, false);
        Should(
            Object.keys(mParticle.getInstance()._preInit.integrationDelays)
                .length
        ).equal(2);
        mParticle._setIntegrationDelay(10, true);
        Should(
            Object.keys(mParticle.getInstance()._preInit.integrationDelays)
                .length
        ).equal(3);
        mParticle.init(apiKey, window.mParticle.config);
        mockServer.requests = [];
        mParticle.logEvent('test1');
        mockServer.requests.length.should.equal(0);

        clock.tick(5001);

        mParticle.logEvent('test2');
        mockServer.requests.length.should.equal(4);
        var sessionStartEvent = getEvent(mockServer.requests, 1);
        var astEvent = getEvent(mockServer.requests, 10);
        var test1 = getEvent(mockServer.requests, 'test1');
        var test2 = getEvent(mockServer.requests, 'test2');

        (typeof sessionStartEvent === 'object').should.equal(true);
        (typeof astEvent === 'object').should.equal(true);
        (typeof test1 === 'object').should.equal(true);
        (typeof test2 === 'object').should.equal(true);
        clock.restore();

        // testing user-configured integrationDelayTimeout
        clock = sinon.useFakeTimers();
        mParticle._resetForTests(MPConfig);
        mParticle.config.integrationDelayTimeout = 1000;
        mParticle._setIntegrationDelay(128, true);
        mParticle._setIntegrationDelay(24, false);
        mParticle._setIntegrationDelay(10, true);
        mParticle.init(apiKey, window.mParticle.config);
        mockServer.requests = [];
        mParticle.logEvent('test1');
        mockServer.requests.length.should.equal(0);

        clock.tick(1001);

        mParticle.logEvent('test2');
        mockServer.requests.length.should.equal(4);
        sessionStartEvent = getEvent(mockServer.requests, 1);
        astEvent = getEvent(mockServer.requests, 10);
        test1 = getEvent(mockServer.requests, 'test1');
        test2 = getEvent(mockServer.requests, 'test2');

        (typeof sessionStartEvent === 'object').should.equal(true);
        (typeof astEvent === 'object').should.equal(true);
        (typeof test1 === 'object').should.equal(true);
        (typeof test2 === 'object').should.equal(true);
        clock.restore();

        done();
    });

    it('parse and capture forwarderConfiguration properly from backend', function(done) {
        mParticle._resetForTests(MPConfig);

        mParticle.config.requestConfig = true;

        var mockForwarder = new MockForwarder('DynamicYield', 128);
        var mockForwarder2 = new MockForwarder('Adobe', 124);

        mockForwarder.register(window.mParticle.config);
        mockForwarder2.register(window.mParticle.config);

        var config = {
            kitConfigs: [
                {
                    name: 'DynamicYield',
                    moduleId: 128,
                    isDebug: false,
                    isVisible: true,
                    isDebugString: false,
                    hasDebugString: true,
                    settings: { siteId: 8769977 },
                    screenNameFilters: [],
                    screenAttributeFilters: [],
                    userIdentityFilters: [],
                    userAttributeFilters: [],
                    eventNameFilters: [],
                    eventTypeFilters: [],
                    attributeFilters: [],
                    githubPath: null,
                    filteringEventAttributeValue: null,
                    filteringUserAttributeValue: null,
                    filteringConsentRuleValues: null,
                    consentRegulationFilters: [],
                    consentRegulationPurposeFilters: [],
                    messageTypeFilters: [],
                    messageTypeStateFilters: [],
                    eventSubscriptionId: 24884,
                    excludeAnonymousUser: false,
                },
                {
                    name: 'Adobe',
                    moduleId: 124,
                    isDebug: false,
                    isVisible: true,
                    isDebugString: false,
                    hasDebugString: true,
                    settings: { siteId: 8769977 },
                    screenNameFilters: [],
                    screenAttributeFilters: [],
                    userIdentityFilters: [],
                    userAttributeFilters: [],
                    eventNameFilters: [],
                    eventTypeFilters: [],
                    attributeFilters: [],
                    githubPath: null,
                    filteringEventAttributeValue: null,
                    filteringUserAttributeValue: null,
                    filteringConsentRuleValues: null,
                    consentRegulationFilters: [],
                    consentRegulationPurposeFilters: [],
                    messageTypeFilters: [],
                    messageTypeStateFilters: [],
                    eventSubscriptionId: 24884,
                    excludeAnonymousUser: false,
                },
            ],
        };

        mockServer.respondWith(urls.config, [
            200,
            {},
            JSON.stringify(config),
        ]);

        mockServer.requests = [];

        mParticle.init(apiKey, window.mParticle.config);

        var activeForwarders = mParticle.getInstance()._getActiveForwarders();
        activeForwarders.length.should.equal(2);
        var moduleIds = [124, 128];
        activeForwarders.forEach(function(forwarder) {
            moduleIds.indexOf(forwarder.id).should.be.greaterThanOrEqual(0);
        });

        done();
    });

    it('configures forwarders before events are logged via identify callback', function(done) {
        mParticle._resetForTests(MPConfig);

        window.mParticle.config.identifyRequest = {
            userIdentities: {
                google: 'google123',
            },
        };

        window.mParticle.config.identityCallback = function() {
            mParticle.logEvent('test event');
        };

        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        window.mParticle.config.kitConfigs.push(
            forwarderDefaultConfiguration('MockForwarder')
        );

        mParticle.init(apiKey, window.mParticle.config);
        window.MockForwarder1.instance.should.have.property(
            'processCalled',
            true
        );

        //mock a page reload which has no configuredForwarders
        mParticle.getInstance()._Store.configuredForwarders = [];
        mParticle.init(apiKey, window.mParticle.config);

        window.MockForwarder1.instance.should.have.property(
            'processCalled',
            true
        );

        done();
    });

    it('should retain preInit.forwarderConstructors, and reinitialize forwarders after calling reset, then init', function(done) {
        mParticle._resetForTests(MPConfig);

        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        window.mParticle.config.kitConfigs.push(
            forwarderDefaultConfiguration('MockForwarder')
        );

        mParticle.init(apiKey, window.mParticle.config);

        mParticle
            .getInstance()
            ._getActiveForwarders()
            .length.should.equal(1);

        // client calls reset
        mParticle.reset();

        // forwarderConstructors are still there
        mParticle
            .getInstance()
            ._preInit.forwarderConstructors
            .length.should.equal(1);

        // client reinitializes mParticle after a reset
        mParticle.init(apiKey, window.mParticle.config);

        // forwarderConstructors are still there
        mParticle
            .getInstance()
            ._getActiveForwarders()
            .length.should.equal(1);

        mParticle.logEvent('send this event to forwarder');
        window.MockForwarder1.instance.should.have.property(
            'processCalled',
            true
        );
        done();
    });
});
