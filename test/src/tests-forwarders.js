import Utils from './config/utils';
import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';

import { urls, apiKey, MPConfig, testMPID, MessageType } from './config/constants';
import { expect } from 'chai';

const findEventFromRequest = Utils.findEventFromRequest,
    getForwarderEvent = Utils.getForwarderEvent,
    setLocalStorage = Utils.setLocalStorage,
    forwarderDefaultConfiguration = Utils.forwarderDefaultConfiguration,
    MockForwarder = Utils.MockForwarder,
    MockSideloadedKit = Utils.MockSideloadedKit;
let mockServer;

describe('forwarders', function() {
    beforeEach(function() {
        mParticle._resetForTests(MPConfig);
        delete mParticle._instances['default_instance'];
        fetchMock.post(urls.events, 200);
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mockServer.respondWith(urls.logout, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mockServer.respondWith(urls.modify, [
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
        fetchMock.restore();
        delete window.MockForwarder1;
        mockServer.restore();
    });

    it('should add forwarders via dynamic script loading via the addForwarder method', function(done) {
        mParticle._resetForTests(MPConfig);

        const mockForwarder = new MockForwarder();
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

        const mockForwarder = new MockForwarder();
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
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config = forwarderDefaultConfiguration('MockForwarder');
        config.filteringConsentRuleValues = {};
        window.mParticle.config.kitConfigs.push(config);

        mParticle.init(apiKey, window.mParticle.config);

        const enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                null
            );
        enabled.should.be.ok();
        done();
    });

    it('should not permit forwarder if consent configured but there is no user.', function(done) {
        const enableForwarder = true;
        const consented = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config = forwarderDefaultConfiguration('MockForwarder');
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
        const enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                null
            );
        enabled.should.not.be.ok();
        done();
    });

    const MockUser = function() {
        let consentState = null;
        return {
            setConsentState: function(state) {
                consentState = state;
            },
            getConsentState: function() {
                return consentState;
            },
        };
    };

    it('should disable forwarder if \'Do Not Forward\' when \'Consent Rejected\' is selected and user consent has been rejected', function(done) {
        const enableForwarder = false;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = false;
        const userConsent = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');

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

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        const user = MockUser();
        user.setConsentState(consentState);
        const enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.not.be.ok();

        done();
    });

    it('should disable forwarder if \'Do Not Forward\' when \'Consent Accepted\' is selected and consent has been accepted', function(done) {
        const enableForwarder = false;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = true;
        const userConsent = true;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');
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

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        const user = MockUser();
        user.setConsentState(consentState);
        const enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.not.be.ok();

        done();
    });

    it('should enable forwarder if \'Only Forward\' when \'Consent Rejected\' is selected and consent has been rejected', function(done) {
        const enableForwarder = true;   // 'Only Forward' chosen in UI, 'includeOnMatch' in config
        const consented = false;
        const userConsent = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config = forwarderDefaultConfiguration('MockForwarder');
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

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        const user = MockUser();
        user.setConsentState(consentState);
        const enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.be.ok();

        done();
    });

    it('should enable forwarder if \'Only Forward\' when \'Consent Accepted\' is selected and consent has been accepted', function(done) {
        const enableForwarder = true;   // 'Only Forward' chosen in UI, 'includeOnMatch' in config
        const consented = true;
        const userConsent = true;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');
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

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        const user = MockUser();
        user.setConsentState(consentState);
        const enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.be.ok();

        done();
    });

    it('should disable forwarder if \'Only Forward\' when \'Consent Accepted\' is selected and consent has been rejected', function(done) {
        const enableForwarder = true;   // 'Only Forward' chosen in UI, 'includeOnMatch' in config
        const consented = true;
        const userConsent = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');
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

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        const user = MockUser();
        user.setConsentState(consentState);
        const enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.not.be.ok();

        done();
    });

    it('should enable forwarder if \'Do Not Forward\' when \'Consent Rejected\' is selected and consent has been accepted', function(done) {
        const enableForwarder = false;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = false;
        const userConsent = true;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');
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

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        const user = MockUser();
        user.setConsentState(consentState);
        const enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.be.ok();

        done();
    });

    it('should enable forwarder if \'Do Not Forward\' when \'Consent Accepted\' is selected and consent has been rejected', function(done) {
        const enableForwarder = false;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = true;
        const userConsent = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');
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

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        const user = MockUser();
        user.setConsentState(consentState);
        const enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.be.ok();

        done();
    });

    it('should enable forwarder if \'Do Not Forward\' when \'Consent Rejected\' is selected and consent has been accepted', function(done) {
        const enableForwarder = false;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consented = false;
        const userConsent = true;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');
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

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        const user = MockUser();
        user.setConsentState(consentState);
        const enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.be.ok();

        done();
    });

    it('should disable forwarder if \'Do Not Forward\' when CCPA is \'Not Present\' is selected and user CCPA is not present', function(done) {
        const enableForwarder = false;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consentPresent = false;
        const userConsentPresent = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');

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

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(userConsentPresent)
            );
        const user = MockUser();
        user.setConsentState(consentState);

        const enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.not.be.ok();

        done();
    });

    it('should disable forwarder if \'Do Not Forward\' when CCPA is \'Present\' is selected and user CCPA is present', function(done) {
        const enableForwarder = false;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consentPresent = true;
        const userConsentPresent = true;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');

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

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(userConsentPresent)
            );
        const user = MockUser();
        user.setConsentState(consentState);

        const enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.not.be.ok();

        done();
    });

    it('should enable forwarder if \'Only Forward\' when CCPA is \'Not Present\' is selected and user CCPA is not present', function(done) {
        const enableForwarder = true;   // 'Only Forward' chosen in UI, 'includeOnMatch' in config
        const consentPresent = false;
        const userConsentPresent = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');

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

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(userConsentPresent)
            );
        const user = MockUser();
        user.setConsentState(consentState);

        const enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );

        enabled.should.be.ok();

        done();
    });

    it('should enable forwarder if \'Only Forward\' when CCPA data sale opt out is present is selected and user CCPA is present.', function(done) {
        const enableForwarder = true;   // 'Only Forward' chosen in UI, 'includeOnMatch' in config
        const consentPresent = true;
        const userConsentPresent = true;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');

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

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(userConsentPresent)
            );
        const user = MockUser();
        user.setConsentState(consentState);

        const enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.be.ok();

        done();
    });

    it('should disable forwarder if \'Only Forward\' when CCPA is \'Present\' is selected and user CCPA is not present', function(done) {
        const enableForwarder = true;   // 'Only Forward' chosen in UI, 'includeOnMatch' in config
        const consentPresent = true;
        const userConsentPresent = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');

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

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(userConsentPresent)
            );
        const user = MockUser();
        user.setConsentState(consentState);

        const enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.not.be.ok();

        done();
    });

    it('should enable forwarder if \'Do Not Forward\' when CCPA is \'Not Present\' is selected and user CCPA is present', function(done) {
        const enableForwarder = false;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consentPresent = false;
        const userConsentPresent = true;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');

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

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(userConsentPresent)
            );
        const user = MockUser();
        user.setConsentState(consentState);

        const enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.be.ok();

        done();
    });

    it('should enable forwarder if \'Do Not Forward\' when CCPA is \'Present\' is selected and user CCPA is not present', function(done) {
        const enableForwarder = false;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        const consentPresent = true;
        const userConsentPresent = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration('MockForwarder');

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

        const consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(userConsentPresent)
            );
        const user = MockUser();
        user.setConsentState(consentState);

        const enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                window.MockForwarder1.instance.filteringConsentRuleValues,
                user
            );
        enabled.should.be.ok();

        done();
    });

    it("does not initialize a forwarder when forwarder's isDebug != mParticle.isDevelopmentMode", function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config = forwarderDefaultConfiguration();
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
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config = forwarderDefaultConfiguration();
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
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config = forwarderDefaultConfiguration();
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
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.isDebug = true;

        const config2 = forwarderDefaultConfiguration('MockForwarder', 1);

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
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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
        const clock = sinon.useFakeTimers();
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        window.mParticle.config.dataPlan = {
            planVersion: 10,
            planId: 'plan_slug',
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
        
        const event = getForwarderEvent(mockServer.requests, 'send this event to forwarder', true);
        Should(event).should.be.ok();

        mockServer.requests[mockServer.requests.length-1].url.includes('/v2/JS/test_key/Forwarding');
        event.should.have.property('mid', 1);
        event.should.have.property('esid', 1234567890);
        event.should.have.property('n', 'send this event to forwarder');
        event.should.have.property('attrs');
        event.should.have.property('dp');
        event.dp.should.have.property('PlanVersion', 10);
        event.dp.should.have.property('PlanId', 'plan_slug');
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
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        window.MockForwarder1.instance.isVisible = false;

        mParticle.logEvent(
            'send this event to forwarder',
            mParticle.EventType.Navigation,
            { 'my-key': 'my-value' }
        );

        const event = findEventFromRequest(fetchMock.calls(), 'send this event to forwarder', true);

        Should(event).should.not.have.property('n');

        done();
    });

    it('should invoke forwarder opt out', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.userAttributeFilters = [mParticle.generateHash('gender')];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');

        mParticle.logEvent('test event');

        const event = window.MockForwarder1.instance.receivedEvent;
        event.should.have.property('UserAttributes');
        event.UserAttributes.should.not.have.property('gender');

        done();
    });

    it('should filter user identities from forwarder on init and bring customerid as first ID', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        mParticle.init(apiKey, window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.userIdentityFilters = [mParticle.IdentityType.Google];
        window.mParticle.config.kitConfigs.push(config1);

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
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.userIdentityFilters = [mParticle.IdentityType.Google];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.Identity.modify({
            userIdentities: {
                google: 'test@google.com',
                email: 'test@gmail.com',
                customerid: '123',
            },
        });
        mParticle.logEvent('test event');
        const event = window.MockForwarder1.instance.receivedEvent;

        Object.keys(event.UserIdentities).length.should.equal(2);
        let googleUserIdentityExits = false;
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
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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

    it('should filter user attributes from forwarder on init, and on subsequent remove attribute calls', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);

        // filtered User Attributes that should should not call removeUserAttribute
        config1.userAttributeFilters = [
            mParticle.generateHash('weight'),
            mParticle.generateHash('age'),
        ];

        window.mParticle.config.kitConfigs.push(config1);
        mParticle.init(apiKey, window.mParticle.config);

        // force filtered UA in mock forwarder (due to filtering affecting setUserAttribute) and test init
        window.MockForwarder1.instance.userAttributes['weight'] = 150
        mParticle.Identity.getCurrentUser().removeUserAttribute('weight');
        window.MockForwarder1.instance.removeUserAttributeCalled.should.equal(false);
        mParticle.userAttributesFilterOnInitTest.should.have.property(
            'weight'
        );

        mParticle.init(apiKey, window.mParticle.config);

        const dummyUserAttributes = {
            'gender': 'male',
            'age': 20,
        }

        // force filtered UA in mock forwarder (due to filtering affecting setUserAttribute) and non filtered UA
        for (let key of Object.keys(dummyUserAttributes)) {
            window.MockForwarder1.instance.userAttributes[key] = dummyUserAttributes[key]
        }

        // "age" is filtered and should not call removeUserAttribute on forwarder
        mParticle.Identity.getCurrentUser().removeUserAttribute('age');
        window.MockForwarder1.instance.removeUserAttributeCalled.should.equal(false);
        window.MockForwarder1.instance.userAttributes.should.have.property(
            'age',
            20
        );

        // "gender" is not filtered and should call removeUserAttribute on forwarder
        mParticle.Identity.getCurrentUser().removeUserAttribute('gender');
        window.MockForwarder1.instance.removeUserAttributeCalled.should.equal(true);
        window.MockForwarder1.instance.userAttributes.should.not.have.property(
            'gender'
        );

        done();
    });

    it('should filter event names', function(done) {
        mParticle._resetForTests(MPConfig);

        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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

        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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

        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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

        const event = window.MockForwarder1.instance.receivedEvent;

        event.EventAttributes.should.not.have.property('test attribute');
        event.EventAttributes.should.have.property('test attribute 2');

        done();
    });

    it('should filter pageview attributes', function(done) {
        mParticle._resetForTests(MPConfig);

        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.attributeFilters = [
            mParticle.generateHash(
                mParticle.EventType.Navigation + 'test event' + 'test attribute'
            ),
        ];
        config1.screenAttributeFilters = [
            mParticle.generateHash(mParticle.EventType.Unknown + 'ScreenA' + 'filteredScreenAttribute'),
        ];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.logPageView('ScreenA', {
            'filteredScreenAttribute': 'this will be filtered',
            'unfilteredScreenAttribute': 'this will not be filtered'
        });

        const event = window.MockForwarder1.instance.receivedEvent;

        event.EventAttributes.should.not.have.property('filteredScreenAttribute');
        event.EventAttributes.should.have.property('unfilteredScreenAttribute','this will not be filtered');

        done();
    });

    it('should call logout on forwarder', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.logout();

        window.MockForwarder1.instance.should.have.property(
            'logOutCalled',
            true
        );

        window.MockForwarder1.instance.should.have.property(
            'onLogoutCompleteCalled',
            true
        );

        done();
    });

    it('should pass in app name to forwarder on initialize', function(done) {
        mParticle.config.appName = 'Unit Tests';
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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

        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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

        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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

    it('should pass filteredUser and filteredUserIdentities to onIdentifyComplete methods', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);

        // This removes the Google User Identity
        config1.userIdentityFilters = [mParticle.IdentityType.Google];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.Identity.identify({
            userIdentities: {
                google: 'test@google.com',
                email: 'test@gmail.com',
                customerid: '123',
            },
        });

        expect(window.MockForwarder1.instance.onIdentifyCompleteCalled).to.eq(
            true
        );
        expect(window.MockForwarder1.instance.onIdentifyCompleteUser).to.be.ok;
        expect(
            window.MockForwarder1.instance
                .onIdentifyCompleteFilteredUserIdentities
        ).to.deep.equal({
            userIdentities: {
                // Filtered Identity should no longer have `google` as an identity
                email: 'test@gmail.com',
                customerid: '123',
            },
        });

        done();
    });

    it('should pass filteredUser and filteredUserIdentities to onLoginComplete methods', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);

        // This removes the Google User Identity
        config1.userIdentityFilters = [mParticle.IdentityType.Google];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.Identity.login({
            userIdentities: {
                google: 'test@google.com',
                email: 'test@gmail.com',
                customerid: '123',
            },
        });

        expect(window.MockForwarder1.instance.onLoginCompleteCalled).to.eq(
            true
        );
        expect(window.MockForwarder1.instance.onLoginCompleteUser).to.be.ok;
        expect(
            window.MockForwarder1.instance.onLoginCompleteFilteredUserIdentities
        ).to.deep.equal({
            userIdentities: {
                // Filtered Identity should no longer have `google` as an identity
                email: 'test@gmail.com',
                customerid: '123',
            },
        });

        done();
    });

    it('should pass filteredUser and filteredUserIdentities to onLogoutComplete methods', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);

        // This removes the Google User Identity
        config1.userIdentityFilters = [mParticle.IdentityType.Google];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.Identity.logout({
            userIdentities: {
                google: 'test@google.com',
                email: 'test@gmail.com',
                customerid: '123',
            },
        });

        expect(window.MockForwarder1.instance.onLogoutCompleteCalled).to.eq(
            true
        );
        expect(window.MockForwarder1.instance.onLogoutCompleteUser).to.be.ok;
        expect(
            window.MockForwarder1.instance
                .onLogoutCompleteFilteredUserIdentities
        ).to.deep.equal({
            userIdentities: {
                // Filtered Identity should no longer have `google` as an identity
                email: 'test@gmail.com',
                customerid: '123',
            },
        });

        done();
    });

    it('should pass filteredUser and filteredUserIdentities to onModifyComplete methods', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);

        // This removes the Google User Identity
        config1.userIdentityFilters = [mParticle.IdentityType.Google];
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.Identity.modify({
            userIdentities: {
                google: 'test@google.com',
                email: 'test@gmail.com',
                customerid: '123',
            },
        });

        expect(window.MockForwarder1.instance.onModifyCompleteCalled).to.eq(
            true
        );
        expect(window.MockForwarder1.instance.onModifyCompleteUser).to.be.ok;
        expect(
            window.MockForwarder1.instance
                .onModifyCompleteFilteredUserIdentities
        ).to.deep.equal({
            userIdentities: {
                // Filtered Identity should no longer have `google` as an identity
                email: 'test@gmail.com',
                customerid: '123',
            },
        });

        done();
    });

    it('should not forward event if attribute forwarding rule is set', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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

        const event = window.MockForwarder1.instance.receivedEvent;

        event.should.not.have.property(
            'EventName',
            'send this event to forwarder'
        );

        done();
    });

    it('should forward event if event attribute forwarding rule is set and includeOnMatch is true', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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

        const event = window.MockForwarder1.instance.receivedEvent;

        event.should.have.property('EventName', 'send this event to forwarder');

        done();
    });

    it('should not forward event if event attribute forwarding rule is set and includeOnMatch is true but attributes do not match', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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

        const event = window.MockForwarder1.instance.receivedEvent;

        event.should.not.have.property(
            'EventName',
            'send this event to forwarder'
        );

        done();
    });

    it('should not forward event if event attribute forwarding rule is set and includeOnMatch is false', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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

        const event = window.MockForwarder1.instance.receivedEvent;

        Should(event).not.be.ok();

        done();
    });

    it('should forward event if event attribute forwarding rule is set and includeOnMatch is false but attributes do not match', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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

        const event = window.MockForwarder1.instance.receivedEvent;

        event.should.have.property('EventName', 'send this event to forwarder');

        done();
    });

    it('should send event to forwarder if filtering attribute and includingOnMatch is true', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender').toString(),
            userAttributeValue: mParticle.generateHash('male').toString(),
            includeOnMatch: true,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'Male');

        mParticle.logEvent('test event');

        const event = window.MockForwarder1.instance.receivedEvent;
        event.should.have.property('UserAttributes');
        event.UserAttributes.should.have.property('Gender', 'Male');
        event.EventName.should.equal('test event');

        done();
    });

    it('should not send event to forwarder if filtering attribute and includingOnMatch is false', function(done) {
        mParticle._resetForTests(MPConfig);

        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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
        const event = window.MockForwarder1.instance.receivedEvent;

        Should(event).not.be.ok();

        done();
    });

    it('should permit forwarder if no user attribute value filters configured', function(done) {
         let enabled = mParticle
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
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender').toString(),
            userAttributeValue: mParticle.generateHash('male').toString(),
            includeOnMatch: false,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.logEvent('test event');

        const event = window.MockForwarder1.instance.receivedEvent;
        window.MockForwarder1.instance.receivedEvent.EventName.should.equal(
            'test event'
        );
        Should(event).be.ok();

        done();
    });

    it('should not send event to forwarder if there are no user attributes on event if includeOnMatch = true', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender').toString(),
            userAttributeValue: mParticle.generateHash('male').toString(),
            includeOnMatch: true,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.logEvent('test event');

        const event = window.MockForwarder1.instance.receivedEvent;
        Should(event).not.be.ok();

        done();
    });

    it('should send event to forwarder if there is no match and includeOnMatch = false', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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

        const event = window.MockForwarder1.instance.receivedEvent;
        Should(event).be.ok();
        event.EventName.should.equal('test event');

        done();
    });

    it('should not send event to forwarder if there is no match and includeOnMatch = true', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
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

        const event = window.MockForwarder1.instance.receivedEvent;
        Should(event).not.be.ok();

        done();
    });

    it('should reinitialize forwarders when user attribute changes', function(done) {
        mParticle._resetForTests(MPConfig);

        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringUserAttributeValue = {
            userAttributeName: mParticle.generateHash('gender').toString(),
            userAttributeValue: mParticle.generateHash('male').toString(),
            includeOnMatch: false,
        };
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'Male');

        let activeForwarders = mParticle.getInstance()._getActiveForwarders();
        activeForwarders.length.should.equal(0);

        window.MockForwarder1.instance.receivedEvent = null;

        mParticle.logEvent('test event');
        let event = window.MockForwarder1.instance.receivedEvent;

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
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.filteringUserAttributeValue = undefined;
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.getCurrentUser().setUserAttribute('Gender', 'Male');

        mParticle.logEvent('test event');
        const event = window.MockForwarder1.instance.receivedEvent;

        Should(event).be.ok();
        window.MockForwarder1.instance.receivedEvent.EventName.should.equal(
            'test event'
        );

        done();
    });

    it('should call forwarder onUserIdentified method when identity is returned', function(done) {
        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        window.MockForwarder1.instance.should.have.property(
            'onUserIdentifiedCalled',
            true
        );

        done();
    });

    it('should queue forwarder stats reporting and send after 5 seconds if batching feature is true', function(done) {
        const clock = sinon.useFakeTimers();

        mParticle._resetForTests(MPConfig);
        const mockForwarder = new MockForwarder();

        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        window.mParticle.config.flags = {
            reportBatching: true,
        };

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.logEvent('not in forwarder');
        const product = mParticle.eCommerce.createProduct(
            'iphone',
            'sku',
            123,
            1
        );
        mParticle.eCommerce.Cart.add(product, true);

        let result = getForwarderEvent(mockServer.requests, 'not in forwarder');

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

        const mockForwarder = new MockForwarder();
        const mockForwarder2 = new MockForwarder('MockForwarder2', 2);

        mockForwarder.register(window.mParticle.config);
        mockForwarder2.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.excludeAnonymousUser = false;

        const config2 = forwarderDefaultConfiguration('MockForwarder', 2);
        config2.excludeAnonymousUser = true;
        window.mParticle.config.kitConfigs.push(config1);
        window.mParticle.config.kitConfigs.push(config2);

        
        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mParticle.init(apiKey, window.mParticle.config);

        const activeForwarders = mParticle.getInstance()._getActiveForwarders();

        activeForwarders.length.should.equal(1);
        mParticle.Identity.getCurrentUser()
            .isLoggedIn()
            .should.equal(false);

        done();
    });

    it('should only initialize forwarders with excludeUnknownUser = false for non-logged-in users', function(done) {
        mParticle._resetForTests(MPConfig);

        const mockForwarder = new MockForwarder();
        const mockForwarder2 = new MockForwarder('MockForwarder2', 2);
        mockForwarder.register(window.mParticle.config);
        mockForwarder2.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.excludeAnonymousUser = false;

        const config2 = forwarderDefaultConfiguration('MockForwarder', 2);
        config2.excludeAnonymousUser = true;

        window.mParticle.config.kitConfigs.push(config1);
        window.mParticle.config.kitConfigs.push(config2);

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mParticle.init(apiKey, window.mParticle.config);

        const activeForwarders = mParticle.getInstance()._getActiveForwarders();

        activeForwarders.length.should.equal(1);
        mParticle.Identity.getCurrentUser()
            .isLoggedIn()
            .should.equal(false);

        done();
    });

    it('should initialize all forwarders when a user is logged in and the page reloads', function(done) {
        mParticle._resetForTests(MPConfig);

        const mockForwarder = new MockForwarder();
        const mockForwarder2 = new MockForwarder('MockForwarder2', 2);

        mockForwarder.register(window.mParticle.config);
        mockForwarder2.register(window.mParticle.config);

        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        config1.excludeAnonymousUser = false;

        const config2 = forwarderDefaultConfiguration('MockForwarder', 2);
        config2.excludeAnonymousUser = true;

        window.mParticle.config.kitConfigs.push(config1);
        window.mParticle.config.kitConfigs.push(config2);

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.getCurrentUser()
            .isLoggedIn()
            .should.equal(false);
        const user = {
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
        const activeForwarders = mParticle.getInstance()._getActiveForwarders();
        activeForwarders.length.should.equal(2);

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.getCurrentUser()
            .isLoggedIn()
            .should.equal(true);
        const activeForwarders2 = mParticle.getInstance()._getActiveForwarders();
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
        const ls = mParticle.getInstance()._Persistence.getLocalStorage();
        ls.l.should.equal(true);

        mParticle.init(apiKey, window.mParticle.config);
        const ls2 = mParticle.getInstance()._Persistence.getLocalStorage();
        ls2.hasOwnProperty('l').should.equal(true);

        mockServer.respondWith(urls.logout, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mParticle.Identity.logout();
        const ls3 = mParticle.getInstance()._Persistence.getLocalStorage();
        ls3.l.should.equal(false);

        mParticle.init(apiKey, window.mParticle.config);
        const ls4 = mParticle.getInstance()._Persistence.getLocalStorage();
        ls4.l.should.equal(false);

        done();
    });

    it('should not set integration attributes on forwarders when a non-object attr is passed', function(done) {
        mParticle.setIntegrationAttribute(128, 123);
        const adobeIntegrationAttributes = mParticle.getIntegrationAttributes(
            128
        );
        Object.keys(adobeIntegrationAttributes).length.should.equal(0);

        done();
    });

    it('should set integration attributes on forwarders', function(done) {
        mParticle.setIntegrationAttribute(128, { MCID: 'abcdefg' });
        const adobeIntegrationAttributes = mParticle.getIntegrationAttributes(
            128
        );

        adobeIntegrationAttributes.MCID.should.equal('abcdefg');

        done();
    });

    it('should clear integration attributes when an empty object or a null is passed', function(done) {
        mParticle.setIntegrationAttribute(128, { MCID: 'abcdefg' });
        let adobeIntegrationAttributes = mParticle.getIntegrationAttributes(
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

        const adobeIntegrationAttributes = mParticle.getIntegrationAttributes(
            128
        );
        Object.keys(adobeIntegrationAttributes).length.should.equal(1);

        done();
    });

    it('should add integration delays to the integrationDelays object', function(done) {
        mParticle._setIntegrationDelay(128, true);
        mParticle._setIntegrationDelay(24, false);
        mParticle._setIntegrationDelay(10, true);

        const integrationDelays = mParticle._getIntegrationDelays();

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
        fetchMock.resetHistory();
        mParticle.logEvent('Test Event1');
        fetchMock.calls().length.should.equal(0);

        mParticle._setIntegrationDelay(10, false);
        mParticle._setIntegrationDelay(128, false);
        mParticle.logEvent('Test Event2');
        fetchMock.calls().length.should.equal(4);

        const sessionStartEvent = findEventFromRequest(fetchMock.calls(), 'session_start');
        const ASTEvent = findEventFromRequest(fetchMock.calls(), 'application_state_transition');
        const testEvent1 = findEventFromRequest(fetchMock.calls(), 'Test Event1');
        const testEvent2 = findEventFromRequest(fetchMock.calls(), 'Test Event2');

        sessionStartEvent.should.be.ok();
        ASTEvent.should.be.ok();
        testEvent1.should.be.ok();
        testEvent2.should.be.ok();

        done();
    });

    it('integration test - should send events after a configured delay, or 5 seconds by default if setIntegrationDelays are still true', function(done) {
        // testing default of 5000 ms
        let clock = sinon.useFakeTimers();
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
        fetchMock.resetHistory();
        mParticle.logEvent('Test Event1');
        fetchMock.calls().length.should.equal(0);

        clock.tick(5001);

        mParticle.logEvent('Test Event2');
        fetchMock.calls().length.should.equal(4);

        const sessionStartEvent = findEventFromRequest(fetchMock.calls(), 'session_start');
        const ASTEvent = findEventFromRequest(fetchMock.calls(), 'application_state_transition');
        const testEvent1 = findEventFromRequest(fetchMock.calls(), 'Test Event1');
        const testEvent2 = findEventFromRequest(fetchMock.calls(), 'Test Event2');

        sessionStartEvent.should.be.ok();
        ASTEvent.should.be.ok();
        testEvent1.should.be.ok();
        testEvent2.should.be.ok();
        clock.restore();

        // testing user-configured integrationDelayTimeout
        clock = sinon.useFakeTimers();
        mParticle._resetForTests(MPConfig);
        mParticle.config.integrationDelayTimeout = 1000;
        mParticle._setIntegrationDelay(128, true);
        mParticle._setIntegrationDelay(24, false);
        mParticle._setIntegrationDelay(10, true);
        mParticle.init(apiKey, window.mParticle.config);
        fetchMock.resetHistory();
        mParticle.logEvent('Test Event3');
        fetchMock.calls().length.should.equal(0);

        clock.tick(1001);

        mParticle.logEvent('Test Event4');
        fetchMock.calls().length.should.equal(4);

        const sessionStartEvent2 = findEventFromRequest(fetchMock.calls(), 'session_start');
        const ASTEvent2 = findEventFromRequest(fetchMock.calls(), 'application_state_transition');
        const testEvent3 = findEventFromRequest(fetchMock.calls(), 'Test Event3');
        const testEvent4 = findEventFromRequest(fetchMock.calls(), 'Test Event4');

        sessionStartEvent2.should.be.ok();
        ASTEvent2.should.be.ok();
        testEvent3.should.be.ok();
        testEvent4.should.be.ok();
        clock.restore();

        done();
    });

    it('integration test - after an integration delay is set to false, should fire an event after the event timeout', function(done) {
        const clock = sinon.useFakeTimers();
        mParticle._resetForTests(MPConfig);
        // this code will be put in each forwarder as each forwarder is initialized
        mParticle._setIntegrationDelay(128, true);
        mParticle._setIntegrationDelay(24, false);
        mParticle.init(apiKey, window.mParticle.config);
        fetchMock.resetHistory();
        mParticle.logEvent('test1');
        fetchMock.calls().length.should.equal(0);
        // now that we set all integrations to false, the SDK should process queued events
        mParticle._setIntegrationDelay(128, false);

        clock.tick(5001);

        fetchMock.calls().length.should.equal(3);
        clock.restore();

        done();
    });

    it('parse and capture forwarderConfiguration properly from backend', function(done) {
        mParticle._resetForTests(MPConfig);

        mParticle.config.requestConfig = true;

        const mockForwarder = new MockForwarder('DynamicYield', 128);
        const mockForwarder2 = new MockForwarder('Adobe', 124);

        mockForwarder.register(window.mParticle.config);
        mockForwarder2.register(window.mParticle.config);

        const config = {
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

        const activeForwarders = mParticle.getInstance()._getActiveForwarders();
        activeForwarders.length.should.equal(2);
        const moduleIds = [124, 128];
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

        const mockForwarder = new MockForwarder();
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

        const mockForwarder = new MockForwarder();
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

    it('should send SourceMessageId as part of event sent to forwarders', function(done) {
        mParticle._resetForTests(MPConfig);

        const mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        window.mParticle.config.kitConfigs.push(
            forwarderDefaultConfiguration('MockForwarder')
        );

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.logEvent('Test Event');
        window.MockForwarder1.instance.receivedEvent.should.have.property(
            'SourceMessageId'
        );
        done();
    });

    it('should send user-defined SourceMessageId as part of event sent to forwarders via baseEvent', function(done) {
        mParticle._resetForTests(MPConfig);

        const mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        window.mParticle.config.kitConfigs.push(
            forwarderDefaultConfiguration('MockForwarder')
        );

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.logBaseEvent({
            messageType: 4,
            name: 'Test Event',
            data: {key: 'value'},
            eventType: mParticle.EventType.Navigation,
            customFlags: {flagKey: 'flagValue'},
            sourceMessageId: 'abcdefg'
        });

        window.MockForwarder1.instance.receivedEvent.should.have.property(
            'SourceMessageId',
            'abcdefg'
        );
        done();
    });

    it('should add a logger to forwarders', function(done) {
        mParticle._resetForTests(MPConfig);

        const mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        window.mParticle.config.kitConfigs.push(
            forwarderDefaultConfiguration('MockForwarder')
        );

        window.mParticle.config.logLevel = 'verbose';
        let infoMessage;

        window.mParticle.config.logger = {
            verbose: function(msg) {
                infoMessage = msg;
            },
        };
        mParticle.init(apiKey, window.mParticle.config);

        mParticle.logEvent('Test Event');

        infoMessage.should.equal('Test Event sent');

        done();
    });

    describe('kits with suffixes', function() {
        it('should add forwarders with suffixes and initialize them accordingly if there is a coresponding kit config with the same suffix', function(done) {
            mParticle._resetForTests(MPConfig);

            const mockForwarder = new MockForwarder('ForwarderWithSuffixV3', 1, 'v3');
            const mockForwarder2 = new MockForwarder('ForwarderWithSuffixV4', 1, 'v4');
            mParticle.addForwarder(mockForwarder);
            mParticle.addForwarder(mockForwarder2);

            window.mParticle.config.kitConfigs.push(
                forwarderDefaultConfiguration('ForwarderWithSuffixV3', 1, 'v3')
            );
            window.mParticle.config.kitConfigs.push(
                forwarderDefaultConfiguration('ForwarderWithSuffixV4', 1, 'v4')
            );

            mParticle.init(apiKey, window.mParticle.config);

            mParticle
                .getInstance()
                ._getActiveForwarders()
                .length.should.equal(2);

            done();
        });

        it('should not add a forwarder with suffix if there is not a corresponding kit config with the same suffix', function(done) {
            mParticle._resetForTests(MPConfig);

            const mockForwarder = new MockForwarder('ForwarderWithSuffix', 1, 'v3');
            mParticle.addForwarder(mockForwarder);

            window.mParticle.config.kitConfigs.push(
                forwarderDefaultConfiguration('ForwarderWithSuffix', 1, 'v4')
            );

            mParticle.init(apiKey, window.mParticle.config);

            mParticle
                .getInstance()
                ._getActiveForwarders()
                .length.should.equal(0);

            done();
        });
    })

    describe('side loaded kits', function() {
        describe('initialization', function() {
            beforeEach(function() {
                mParticle._resetForTests(MPConfig);
                delete mParticle._instances['default_instance'];
            });

            afterEach(function() {
                delete window.MockForwarder1;
                mockServer.restore();
            });

            it('should add sideloaded kits to the active forwarders', function() {
                const sideloadedKit1 = new MockSideloadedKit('SideloadedKit1', 1);
                const sideloadedKit2 = new MockSideloadedKit('SideloadedKit2', 2);

                const mpSideloadedKit1 = new mParticle.MPSideloadedKit(sideloadedKit1);
                const mpSideloadedKit2 = new mParticle.MPSideloadedKit(sideloadedKit2);

                const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];
                window.mParticle.config.sideloadedKits = sideloadedKits;

                mParticle.init(apiKey, window.mParticle.config);
                const activeForwarders = mParticle.getInstance()._getActiveForwarders();
                expect(activeForwarders.length, 'active forwarders length').to.equal(sideloadedKits.length);
                expect(activeForwarders[0].name, '1st active forwarder ').to.deep.equal(sideloadedKit1.name);
                expect(activeForwarders[1].name, '2nd active forwarder').to.deep.equal(sideloadedKit2.name);
            });

            it('should add sideloaded kits along with configured forwarders from server to the active forwarders', function() {
                const sideloadedKit1 = new MockSideloadedKit('SideloadedKit1', 1);
                const sideloadedKit2 = new MockSideloadedKit('SideloadedKit2', 2);

                const mpSideloadedKit1 = new mParticle.MPSideloadedKit(sideloadedKit1);
                const mpSideloadedKit2 = new mParticle.MPSideloadedKit(sideloadedKit2);
                
                const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                window.mParticle.config.sideloadedKits = sideloadedKits;

                // This mockForwarder simulates a server configured forwarder
                const mockForwarder = new MockForwarder('fooForwarder', 1);
                mParticle.addForwarder(mockForwarder);

                window.mParticle.config.kitConfigs.push(
                    forwarderDefaultConfiguration('fooForwarder', 1)
                );
                
                mParticle.init(apiKey, window.mParticle.config);
                const activeForwarders = mParticle.getInstance()._getActiveForwarders();

                expect(activeForwarders.length, 'active forwarders length').to.equal(sideloadedKits.length +1);
                expect(activeForwarders[0].name, '1st active forwarder name').to.equal('fooForwarder');
                expect(activeForwarders[1].name, '2nd active forwarder ').to.deep.equal(sideloadedKit1.name);
                expect(activeForwarders[2].name, '3rd active forwarder').to.deep.equal(sideloadedKit2.name);
            });

            it('should add a flag in batches for reporting if sideloaded kits are used', function() {
                const sideloadedKit1 = new MockSideloadedKit(
                    'SideloadedKit1',
                    1
                );
                const sideloadedKit2 = new MockSideloadedKit(
                    'SideloadedKit2',
                    2
                );

                const mpSideloadedKit1 = new mParticle.MPSideloadedKit(
                    sideloadedKit1
                );
                const mpSideloadedKit2 = new mParticle.MPSideloadedKit(
                    sideloadedKit2
                );

                const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                window.mParticle.config.sideloadedKits = sideloadedKits;

                // This mockForwarder simulates a server configured forwarder
                const mockForwarder = new MockForwarder('fooForwarder', 1);
                mParticle.addForwarder(mockForwarder);

                window.mParticle.config.kitConfigs.push(
                    forwarderDefaultConfiguration('fooForwarder', 1)
                );

                mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = window.mParticle.getInstance();

                expect(mpInstance._Store.sideloadedKitsCount).to.equal(2);

                mParticle.logEvent('foo', mParticle.EventType.Navigation);

                const batch = JSON.parse(fetchMock.lastCall()[1].body);

                expect(batch).to.have.property('application_info');
                expect(batch.application_info).to.have.property(
                    'sideloaded_kits_count'
                , 2);
            });

            it('should NOT add a flag in batches for reporting if sideloaded kits are not used', function() {
                mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = window.mParticle.getInstance();

                expect(mpInstance._Store.isUsingSideloadedKits).to.be.undefined;

                mParticle.logEvent('foo', mParticle.EventType.Navigation);

                const batch = JSON.parse(fetchMock.lastCall()[1].body);

                expect(batch).to.have.property('application_info');
                expect(batch.application_info).not.to.have.property(
                    'sideloaded_kits_count'
                );
            });

            describe('filter dictionary integration tests', function() {
                let sideloadedKit1;
                let sideloadedKit2;
                let mpSideloadedKit1;
                let mpSideloadedKit2;
                
                beforeEach(function() {
                    sideloadedKit1 = new MockSideloadedKit(
                        'SideloadedKit1',
                        1
                    );
                    sideloadedKit2 = new MockSideloadedKit(
                        'SideloadedKit2',
                        2
                    );
    
                    mpSideloadedKit1 = new mParticle.MPSideloadedKit(
                        sideloadedKit1
                    );
                    mpSideloadedKit2 = new mParticle.MPSideloadedKit(
                        sideloadedKit2
                    );
                    mParticle._resetForTests(MPConfig);
                    delete mParticle._instances['default_instance'];
                });

                afterEach(function() {
                    delete window.MockForwarder1;
                    mockServer.restore();
                });

                it('should filter event names out properly when set', function() {
                    mpSideloadedKit1.addEventNameFilter(mParticle.EventType.Unknown, 'Test Event');
                    mpSideloadedKit2.addEventNameFilter(mParticle.EventType.Unknown, 'Test Event2');

                    const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                    window.mParticle.config.sideloadedKits = sideloadedKits;

                    mParticle.init(apiKey, window.mParticle.config);
                    mParticle.logEvent('Test Event');

                    // The received event gets replaced by the last event sent to the forwarder
                    // SideloadedKit11 has received the session start event, but not the Test Event
                    // SideloadedKit22 will receive the Test Event
                    window.SideloadedKit11.instance.receivedEvent.EventName.should.not.equal('Test Event');
                    window.SideloadedKit22.instance.receivedEvent.EventName.should.equal('Test Event');

                    mParticle.logEvent('Test Event2');

                    // SideloadedKit11 receives Test Event2, but SideloadedKit22 does not
                    window.SideloadedKit11.instance.receivedEvent.EventName.should.equal('Test Event2');
                    window.SideloadedKit22.instance.receivedEvent.EventName.should.not.equal('Test Event2');
                });

                it('should filter event types out properly when set', function() {
                    mpSideloadedKit1.addEventTypeFilter(mParticle.EventType.Unknown);
                    mpSideloadedKit2.addEventTypeFilter(mParticle.EventType.Navigation);

                    const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                    window.mParticle.config.sideloadedKits = sideloadedKits;

                    mParticle.init(apiKey, window.mParticle.config);
                    mParticle.logEvent('Test Event', mParticle.EventType.Unknown);

                    // The received event gets replaced by the last event sent to the forwarder
                    // SideloadedKit11 has received the session start event, but not the Test Event of EventType.Unknown 
                    // SideloadedKit22 will receive the Test Event of EventType.Unknown 
                    window.SideloadedKit11.instance.receivedEvent.EventName.should.not.equal('Test Event');
                    window.SideloadedKit22.instance.receivedEvent.EventName.should.equal('Test Event');

                    mParticle.logEvent('Test Event2', mParticle.EventType.Navigation);

                    // SideloadedKit11 receives the Navigation Event, SideloadedKit22 does not
                    window.SideloadedKit11.instance.receivedEvent.EventName.should.equal('Test Event2');
                    window.SideloadedKit22.instance.receivedEvent.EventName.should.not.equal('Test Event2');
                });

                it('should filter event attributes out properly when set', function() {
                    mpSideloadedKit1.addEventAttributeFilter(mParticle.EventType.Navigation, 'Test Event', 'testAttr1');
                    mpSideloadedKit2.addEventAttributeFilter(mParticle.EventType.Navigation, 'Test Event', 'testAttr2');

                    const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                    window.mParticle.config.sideloadedKits = sideloadedKits;

                    mParticle.init(apiKey, window.mParticle.config);

                    const attrs = {
                        testAttr1: 'foo',
                        testAttr2: 'bar'
                    }

                    mParticle.logEvent('Test Event', mParticle.EventType.Navigation, attrs);

                    window.SideloadedKit11.instance.receivedEvent.EventAttributes.should.have.property('testAttr2', 'bar');
                    window.SideloadedKit11.instance.receivedEvent.EventAttributes.should.not.property('testAttr1');

                    window.SideloadedKit22.instance.receivedEvent.EventAttributes.should.have.property('testAttr1', 'foo');
                    window.SideloadedKit22.instance.receivedEvent.EventAttributes.should.not.property('testAttr2');
                });

                it('should filter screen names out properly when set', function() {
                    mpSideloadedKit1.addScreenNameFilter('Test Screen Name 1');
                    mpSideloadedKit2.addScreenNameFilter('Test Screen Name 2');

                    const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                    window.mParticle.config.sideloadedKits = sideloadedKits;

                    mParticle.init(apiKey, window.mParticle.config);

                    mParticle.logPageView('Test Screen Name 1')

                    // The received event gets replaced by the last event sent to the forwarder
                    // SideloadedKit11 has received the session start event, but not the Test Screen Name 1 event
                    // SideloadedKit22 does receive it
                    window.SideloadedKit11.instance.receivedEvent.EventName.should.not.equal('Test Screen Name 1');
                    window.SideloadedKit22.instance.receivedEvent.EventName.should.equal('Test Screen Name 1');

                    mParticle.logPageView('Test Screen Name 2')

                    // SideloadedKit11 will receive Test Screen Name 2, but SideloadedKit22 does not
                    window.SideloadedKit11.instance.receivedEvent.EventName.should.equal('Test Screen Name 2');
                    window.SideloadedKit22.instance.receivedEvent.EventName.should.not.equal('Test Screen Name 2');
                });

                it('should filter screen name attribute out properly when set', function() {
                    mpSideloadedKit1.addScreenAttributeFilter('Test Screen Name 1', 'testAttr1');
                    mpSideloadedKit2.addScreenAttributeFilter('Test Screen Name 1', 'testAttr2');

                    const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                    window.mParticle.config.sideloadedKits = sideloadedKits;

                    mParticle.init(apiKey, window.mParticle.config);

                    const attrs = {
                        testAttr1: 'foo',
                        testAttr2: 'bar'
                    }

                    mParticle.logPageView('Test Screen Name 1', attrs)

                    window.SideloadedKit11.instance.receivedEvent.EventAttributes.should.have.property('testAttr2', 'bar');
                    window.SideloadedKit11.instance.receivedEvent.EventAttributes.should.not.property('testAttr1');
                    window.SideloadedKit22.instance.receivedEvent.EventAttributes.should.have.property('testAttr1', 'foo');
                    window.SideloadedKit22.instance.receivedEvent.EventAttributes.should.not.property('testAttr2');
                });

                it('should filter user identities out properly when set', function() {
                    mpSideloadedKit1.addUserIdentityFilter(mParticle.IdentityType.Email);
                    mpSideloadedKit2.addUserIdentityFilter(mParticle.IdentityType.Other);

                    const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                    window.mParticle.config.sideloadedKits = sideloadedKits;

                    mParticle.init(apiKey, window.mParticle.config);

                    mParticle.Identity.login({
                        userIdentities: {
                            email: 'test@gmail.com',
                            other: 'test'
                        }
                    });

                    mParticle.logPageView('Test Screen Name 1');

                    // SideloadedKit11 will receive an event with only an Other identity type
                    window.SideloadedKit11.instance.receivedEvent.UserIdentities.length.should.equal(1)
                    window.SideloadedKit11.instance.receivedEvent.UserIdentities[0].Type.should.equal(mParticle.IdentityType.Other)
                    window.SideloadedKit11.instance.receivedEvent.UserIdentities[0].Identity.should.equal('test')
                    // SideloadedKit22 will receive an event with only an Email identity type
                    window.SideloadedKit22.instance.receivedEvent.UserIdentities.length.should.equal(1)
                    window.SideloadedKit22.instance.receivedEvent.UserIdentities[0].Type.should.equal(mParticle.IdentityType.Email)
                    window.SideloadedKit22.instance.receivedEvent.UserIdentities[0].Identity.should.equal('test@gmail.com')
                });

                it('should filter user attributes out properly when set', function() {
                    mpSideloadedKit1.addUserAttributeFilter('testAttr1');
                    mpSideloadedKit2.addUserAttributeFilter('testAttr2');

                    const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                    window.mParticle.config.sideloadedKits = sideloadedKits;

                    mParticle.init(apiKey, window.mParticle.config);

                    mParticle.Identity.getCurrentUser().setUserAttribute('testAttr1', 'foo');
                    mParticle.Identity.getCurrentUser().setUserAttribute('testAttr2', 'bar');

                    mParticle.logPageView('Test Screen Name 1');

                    window.SideloadedKit11.instance.receivedEvent.UserAttributes.should.have.property('testAttr2', 'bar');
                    window.SideloadedKit11.instance.receivedEvent.UserAttributes.should.not.have.property('testAttr1');

                    window.SideloadedKit22.instance.receivedEvent.UserAttributes.should.have.property('testAttr1', 'foo');
                    window.SideloadedKit22.instance.receivedEvent.UserAttributes.should.not.have.property('testAttr2');
                });
            });
        });

        describe('forwarding', function() {
            beforeEach(function() {
                mParticle._resetForTests(MPConfig);
                delete mParticle._instances['default_instance'];
            });

            afterEach(function() {
                delete window.MockForwarder1;
                mockServer.restore();
            });

            it('should send event to sideloaded kits', function() {
                const sideloadedKit1 = new MockSideloadedKit('SideloadedKit1', 1);
                const sideloadedKit2 = new MockSideloadedKit('SideloadedKit2', 2);

                const mpSideloadedKit1 = new mParticle.MPSideloadedKit(sideloadedKit1);
                const mpSideloadedKit2 = new mParticle.MPSideloadedKit(sideloadedKit2);
                
                const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];
                
                window.mParticle.config.sideloadedKits = sideloadedKits;
                mParticle.init(apiKey, window.mParticle.config);

                mParticle.logEvent('foo', mParticle.EventType.Navigation);
                const sideloadedKit1Event = window.SideloadedKit11.instance.receivedEvent;
                const sideloadedKit2Event = window.SideloadedKit22.instance.receivedEvent;

                sideloadedKit1Event.should.have.property('EventName', 'foo');
                sideloadedKit2Event.should.have.property('EventName', 'foo');
            });

            it('should invoke sideloaded identify call', function() {
                const sideloadedKit1 = new MockSideloadedKit('SideloadedKit1', 1);
                const sideloadedKit2 = new MockSideloadedKit('SideloadedKit2', 2);
                
                const mpSideloadedKit1 = new mParticle.MPSideloadedKit(sideloadedKit1);
                const mpSideloadedKit2 = new mParticle.MPSideloadedKit(sideloadedKit2);
                
                const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];
                
                window.mParticle.config.identifyRequest = {
                    userIdentities: {
                        google: 'google123',
                    },
                };

                window.mParticle.config.sideloadedKits = sideloadedKits;

                mParticle.init(apiKey, window.mParticle.config);
                window.SideloadedKit11.instance.should.have.property('setUserIdentityCalled', true);
                window.SideloadedKit22.instance.should.have.property('setUserIdentityCalled', true);

                window.SideloadedKit11.instance.should.have.property('onUserIdentifiedCalled', true);
                window.SideloadedKit22.instance.should.have.property('onUserIdentifiedCalled', true);
            });

            it('should invoke sideloaded set/removeUserAttribute call', function() {
                const sideloadedKit1 = new MockSideloadedKit('SideloadedKit1', 1);
                const sideloadedKit2 = new MockSideloadedKit('SideloadedKit2', 2);
                
                const mpSideloadedKit1 = new mParticle.MPSideloadedKit(sideloadedKit1);
                const mpSideloadedKit2 = new mParticle.MPSideloadedKit(sideloadedKit2);
                
                const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                window.mParticle.config.sideloadedKits = sideloadedKits;

                mParticle.init(apiKey, window.mParticle.config);
                mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
                mParticle.Identity.getCurrentUser().removeUserAttribute('gender');

                window.SideloadedKit11.instance.should.have.property('setUserAttributeCalled', true);
                window.SideloadedKit22.instance.should.have.property('setUserAttributeCalled', true);

                window.SideloadedKit11.instance.should.have.property('removeUserAttributeCalled', true);
                window.SideloadedKit22.instance.should.have.property('removeUserAttributeCalled', true);
            });

            it('should invoke sideloaded logout call', function() {
                const sideloadedKit1 = new MockSideloadedKit('SideloadedKit1', 1);
                const sideloadedKit2 = new MockSideloadedKit('SideloadedKit2', 2);
                
                const mpSideloadedKit1 = new mParticle.MPSideloadedKit(sideloadedKit1);
                const mpSideloadedKit2 = new mParticle.MPSideloadedKit(sideloadedKit2);
                
                const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                window.mParticle.config.sideloadedKits = sideloadedKits;

                mParticle.init(apiKey, window.mParticle.config);
                mParticle.Identity.logout();

                window.SideloadedKit11.instance.should.have.property('onLogoutCompleteCalled', true);
                window.SideloadedKit22.instance.should.have.property('onLogoutCompleteCalled', true);
            });

            it('should invoke sideloaded login call', function() {
                const sideloadedKit1 = new MockSideloadedKit('SideloadedKit1', 1);
                const sideloadedKit2 = new MockSideloadedKit('SideloadedKit2', 2);
                
                const mpSideloadedKit1 = new mParticle.MPSideloadedKit(sideloadedKit1);
                const mpSideloadedKit2 = new mParticle.MPSideloadedKit(sideloadedKit2);
                
                const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                window.mParticle.config.sideloadedKits = sideloadedKits;

                mParticle.init(apiKey, window.mParticle.config);
                mParticle.Identity.login({userIdentities: {customerid: 'abc'}});

                window.SideloadedKit11.instance.should.have.property('onLoginCompleteCalled', true);
                window.SideloadedKit22.instance.should.have.property('onLoginCompleteCalled', true);
            });

            it('should invoke sideloaded modify call', function() {
                const sideloadedKit1 = new MockSideloadedKit('SideloadedKit1', 1);
                const sideloadedKit2 = new MockSideloadedKit('SideloadedKit2', 2);
                
                const mpSideloadedKit1 = new mParticle.MPSideloadedKit(sideloadedKit1);
                const mpSideloadedKit2 = new mParticle.MPSideloadedKit(sideloadedKit2);
                
                const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                window.mParticle.config.sideloadedKits = sideloadedKits;

                mParticle.init(apiKey, window.mParticle.config);
                mParticle.Identity.modify({userIdentities: {customerid: 'abc'}});

                window.SideloadedKit11.instance.should.have.property('onModifyCompleteCalled', true);
                window.SideloadedKit22.instance.should.have.property('onModifyCompleteCalled', true);
            });

            it('should invoke sideloaded modify call', function() {
                const sideloadedKit1 = new MockSideloadedKit('SideloadedKit1', 1);
                const sideloadedKit2 = new MockSideloadedKit('SideloadedKit2', 2);
                
                const mpSideloadedKit1 = new mParticle.MPSideloadedKit(sideloadedKit1);
                const mpSideloadedKit2 = new mParticle.MPSideloadedKit(sideloadedKit2);
                
                const sideloadedKits = [mpSideloadedKit1, mpSideloadedKit2];

                window.mParticle.config.sideloadedKits = sideloadedKits;

                mParticle.init(apiKey, window.mParticle.config);
                        mParticle.setOptOut(true);


                window.SideloadedKit11.instance.should.have.property('setOptOutCalled', true);
                window.SideloadedKit22.instance.should.have.property('setOptOutCalled', true);
            });
        });
    });
});