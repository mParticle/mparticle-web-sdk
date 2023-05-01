import Utils from './utils';
import sinon from 'sinon';
import { urls, testMPID, MPConfig, v4LSKey, apiKey } from './config';

var setLocalStorage = Utils.setLocalStorage,
    MockForwarder = Utils.MockForwarder,
    getLocalStorage = Utils.getLocalStorage,
    mockServer;

// single pixel to load
var pixelUrl = 'https://i.imgur.com/fvfcfpZ_d.webp';

describe('cookie syncing', function() {
    this.timeout(10000);
    const timeout = 2000;
    beforeEach(function() {
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        mockServer.respondWith(urls.eventsV2, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, Store: {}})
        ])
        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        mockServer.restore();
        mParticle._resetForTests(MPConfig);
    });

    it('should sync cookies when there was not a previous cookie-sync', function(done) {
        mParticle._resetForTests(MPConfig);
        var pixelSettings = {
            name: 'TestPixel',
            moduleId: 5,
            esId: 24053,
            isDebug: true,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl: pixelUrl,
            redirectUrl: '',
        };

        window.mParticle.config.pixelConfigs = [pixelSettings];
        mParticle.init(apiKey, window.mParticle.config);
        setTimeout(function() {
            Should(mParticle.getInstance()._Store.pixelConfigurations.length).equal(1);
            var data = mParticle.getInstance()._Persistence.getLocalStorage();
            data[testMPID].csd.should.have.property('5');

            done();        
        }, timeout);
        
    });

    it('should sync cookies when current date is beyond the frequency cap and the MPID has not changed', function(done) {
        mParticle._resetForTests(MPConfig);
        var pixelSettings = {
            name: 'TestPixel',
            moduleId: 5,
            esId: 24053,
            isDebug: true,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl: pixelUrl,
            redirectUrl: '',
        };
        window.mParticle.config.pixelConfigs = [pixelSettings];

        setLocalStorage(v4LSKey, {
            cu: testMPID,
            testMPID: {
                csd: { 5: new Date(500).getTime() },
            },
            ie: true,
        });
        mParticle.init(apiKey, window.mParticle.config);

        setTimeout(function() {
            Should(mParticle.getInstance()._Store.pixelConfigurations.length).equal(1);
    
            var data = mParticle.getInstance()._Persistence.getLocalStorage();
            var updated = data[testMPID].csd['5'] > 500;
    
            Should(updated).be.ok();
    
            done();
        }, timeout);
    });

    it('should not sync cookies when last date is within frequencyCap', function(done) {
        mParticle._resetForTests(MPConfig);
        var pixelSettings = {
            name: 'TestPixel',
            moduleId: 5,
            esId: 24053,
            isDebug: true,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl: pixelUrl,
            redirectUrl: '',
        };
        window.mParticle.config.pixelConfigs = [pixelSettings];

        setLocalStorage();
        mParticle.init(apiKey, window.mParticle.config);
        setTimeout(function() {
            mockServer.requests = [];
    
            var data = mParticle.getInstance()._Persistence.getLocalStorage();
    
            
            data[testMPID].csd.should.have.property(
                5,
                mParticle.getInstance()._Persistence.getLocalStorage().testMPID.csd[
                    '5'
                ]
            );
            Should(mParticle.getInstance()._Store.pixelConfigurations.length).equal(
                1
            );
    
            done();
        }, timeout);
    });

    it('should sync cookies when mpid changes', function(done) {
        var pixelSettings = {
            name: 'TestPixel',
            moduleId: 5,
            esId: 24053,
            isDebug: true,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl: pixelUrl,
            redirectUrl: '',
        };
        mParticle._resetForTests(MPConfig);
        window.mParticle.config.pixelConfigs = [pixelSettings];

        mParticle.init(apiKey, window.mParticle.config);
        setTimeout(function() {
            var data1 = mParticle.getInstance()._Persistence.getLocalStorage();

            mockServer.respondWith(urls.login, [
                200,
                {},
                JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
            ]);

            mParticle.Identity.login();
            setTimeout(function() {
                var data2 = mParticle.getInstance()._Persistence.getLocalStorage();
                data1[testMPID].csd[5].should.be.ok();
                data2['otherMPID'].csd[5].should.be.ok();
                Should(mParticle.getInstance()._Store.pixelConfigurations.length).equal(
                    1
                );
        
                done();
            }, timeout);
        }, timeout);
    });

    it('should not sync cookies when pixelSettings.isDebug is false, pixelSettings.isProduction is true, and mParticle.config.isDevelopmentMode is true', function(done) {
        var pixelSettings = {
            name: 'TestPixel',
            moduleId: 5,
            esId: 24053,
            isDebug: false,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl: pixelUrl,
            redirectUrl: '',
        };
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = true;
        window.mParticle.config.pixelConfigs = [pixelSettings];

        mParticle.init(apiKey, window.mParticle.config);

        setTimeout(function() {
            var data1 = mParticle.getInstance()._Persistence.getLocalStorage();

            Object.keys(data1[testMPID]).should.not.have.property('csd');
            Should(mParticle.getInstance()._Store.pixelConfigurations.length).equal(
                0
            );

            done();
        },500 )
    });

    it('should not sync cookies when pixelSettings.isDebug is true, pixelSettings.isProduction is false, and mParticle.config.isDevelopmentMode is false', function(done) {
        var pixelSettings = {
            name: 'TestPixel',
            moduleId: 5,
            esId: 24053,
            isDebug: true,
            isProduction: false,
            settings: {},
            frequencyCap: 14,
            pixelUrl: pixelUrl,
            redirectUrl: '',
        };
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        window.mParticle.config.pixelConfigs = [pixelSettings];

        mParticle.init(apiKey, window.mParticle.config);

        setTimeout(function() {
            var data1 = mParticle.getInstance()._Persistence.getLocalStorage();
            data1[testMPID].should.not.have.property('csd');
            Should(mParticle.getInstance()._Store.pixelConfigurations.length).equal(
                0
            );

            done();
        }, timeout);
    });

    it('should replace mpID properly', function(done) {
        var result = mParticle
            .getInstance()
            ._CookieSyncManager.replaceMPID(
                'www.google.com?mpid=%%mpid%%?foo=bar',
                123
            );

        result.should.equal('www.google.com?mpid=123?foo=bar');

        done();
    });

    it("should remove 'amp;' from the URLs", function(done) {
        var result = mParticle
            .getInstance()
            ._CookieSyncManager.replaceAmp(
                'www.google.com?mpid=%%mpid%%&amp;foo=bar'
            );

        result.should.equal('www.google.com?mpid=%%mpid%%&foo=bar');

        done();
    });

    it('parse and capture pixel settings properly from backend', function(done) {
        mParticle._resetForTests(MPConfig);
        window.mParticle.config.requestConfig = true;
        // create some cookies
        mParticle.init(apiKey, window.mParticle.config);

        var mockForwarder = new MockForwarder('DynamicYield', 128);
        var mockForwarder2 = new MockForwarder('Adobe', 124);

        mockForwarder.register(window.mParticle.config);
        mockForwarder2.register(window.mParticle.config);

        var forwarderConfigurationResult = {
            pixelConfigs: [
                {
                    name: 'TestPixel',
                    moduleId: 5,
                    esId: 24053,
                    isDebug: false,
                    isProduction: true,
                    settings: {},
                    frequencyCap: 14,
                    pixelUrl: pixelUrl,
                    redirectUrl: '',
                },
            ],
        };

        mockServer.respondWith(urls.config, [
            200,
            {},
            JSON.stringify(forwarderConfigurationResult),
        ]);

        mockServer.requests = [];
        // add pixels to preInitConfig
        mParticle.init(apiKey, window.mParticle.config);

        setTimeout(function() {
            mParticle
            .getInstance()
            ._Store.pixelConfigurations.length.should.equal(1);

            mockServer.respondWith(urls.login, [
                200,
                {},
                JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
            ]);

            // force the preInit cookie configurations to fire
            mParticle.Identity.login({ userIdentities: { customerid: 'abc' } });
            
            setTimeout(function() {
                var cookies = getLocalStorage();
                Object.keys(cookies['MPID1'].csd).length.should.equal(1);

                done();

            }, timeout);
        }, timeout);
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

    it('should perform a cookiesync when consent is not configured on the cookiesync setting', function(done) {
        mParticle._resetForTests(MPConfig);

        var pixelSettings = {
            name: 'TestPixel',
            moduleId: 5,
            esId: 24053,
            isDebug: true,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl: pixelUrl,
            redirectUrl: '',
        };

        pixelSettings.filteringConsentRuleValues = {};
        window.mParticle.config.pixelConfigs = [pixelSettings];

        mParticle.init(apiKey, window.mParticle.config);

        setTimeout(function() {
            Should(mParticle.getInstance()._Store.pixelConfigurations.length).equal(1);
            var data = mParticle.getInstance()._Persistence.getLocalStorage();
            data[testMPID].csd.should.have.property('5');

            done();
        }, timeout);
    });

    it('should return false for isEnabledForUserConsent when consent is configured but no user is passed', function(done) {
        mParticle._resetForTests(MPConfig);
        
        var enableCookieSync = true;
        var consented = false;

        var filteringConsentRuleValues = {
            includeOnMatch: enableCookieSync,
            values: [
                {
                    consentPurpose: '123',
                    hasConsented: consented,
                },
            ],
        };

        var enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(filteringConsentRuleValues, null);

        enabled.should.not.be.ok();

        done();
    });

    it('should disable cookie sync if \'Do Not Forward\' when \'Consent Rejected\' is selected and user consent is rejected', function(done) {
        var includeOnMatch = false;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        var consented = false;
        var userConsent = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;

        var filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        var user = MockUser();
        user.setConsentState(consentState);
        var enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                filteringConsentRuleValues,
                user
            );
        enabled.should.not.be.ok();
        done();
    });

    it('should disable cookie sync if \'Do Not Forward\' when \'Consent Accepted\' is selected and user consent is given', function(done) {
        var includeOnMatch = false;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        var consented = true;
        var userConsent = true;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        var filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        var user = MockUser();
        user.setConsentState(consentState);
        var enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                filteringConsentRuleValues,
                user
            );

        enabled.should.not.be.ok();

        done();
    });

    it('should enable cookie sync if \'Only Forward\' when \'Consent Rejected\' is selected and user consent is rejected', function(done) {
        var includeOnMatch = true;   // 'Only Forward' chosen in UI, 'includeOnMatch' in config
        var consented = false;
        var userConsent = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;

        var filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        var user = MockUser();
        user.setConsentState(consentState);

        var enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                filteringConsentRuleValues,
                user
            );
        enabled.should.be.ok();

        done();
    });

    it('should enable cookie sync if \'Only Forward\' when \'Consent Given\'is selected and user consent is given', function(done) {
        var includeOnMatch = true;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        var consented = true;
        var userConsent = true;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;

        var filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsent)
            );
        var user = MockUser();
        user.setConsentState(consentState);
        var enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                filteringConsentRuleValues,
                user
            );
        enabled.should.be.ok();

        done();
    });

    it('should disable cookie sync if \'Only Forward\' on \'Consent Given\' is selected and user consent is not given', function(done) {
        var includeOnMatch = true;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        var consented = true;
        var userConsented = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;

        var filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsented)
            );
        var user = MockUser();
        user.setConsentState(consentState);
        var enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                filteringConsentRuleValues,
                user
            );
        enabled.should.not.be.ok();

        done();
    });

    it('should perform a cookie sync if \'Do Not Forward\' when \'Consent Rejected\' is selected and user consent is given', function(done) {
        var includeOnMatch = false;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        var consented = false;
        var userConsented = true;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;

        var filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsented)
            );
        var user = MockUser();
        user.setConsentState(consentState);
        var enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                filteringConsentRuleValues,
                user
            );
        enabled.should.be.ok();

        done();
    });

    it('should perform a cookie sync if \'Do Not Forward\' when \'Consent Given\' is selected and user consent is rejected', function(done) {
        var includeOnMatch = false;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        var consented = true;
        var userConsented = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;

        var filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsented)
            );
        var user = MockUser();
        user.setConsentState(consentState);
        var enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                filteringConsentRuleValues,
                user
            );
        enabled.should.be.ok();

        done();
    });

    it('should perform a cookie sync if \'Do Not Forward\' when \'Consent Rejected\' is selected and user consent is given', function(done) {
        var includeOnMatch = false;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        var consented = false;
        var userConsented = true;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;

        var filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(userConsented)
            );
        var user = MockUser();
        user.setConsentState(consentState);
        var enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                filteringConsentRuleValues,
                user
            );
        enabled.should.be.ok();

        done();
    });






    it('should not perform a cookie sync if \'Do Not Forward\' if CCPA is \'Not Present\' is selected and user CCPA is not present', function(done) {
        var includeOnMatch = false;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        var consented = false;
        var ccpaPresent = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;

        var filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(ccpaPresent)
        );
        var user = MockUser();
        user.setConsentState(consentState);
        var enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                filteringConsentRuleValues,
                user
            );
        enabled.should.not.be.ok();

        done();
    });

    it('should not perform a cookie sync if \'Do Not Forward\' if CCPA is \'Present\' is selected and user CCPA is present', function(done) {
        var includeOnMatch = false;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        var consented = true;
        var ccpaPresent = true;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;

        var filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(ccpaPresent)
        );
        var user = MockUser();
        user.setConsentState(consentState);
        var enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                filteringConsentRuleValues,
                user
            );
        enabled.should.not.be.ok();

        done();
    });

    it('should perform a cookie sync if \'Only Forward\' if CCPA is \'Not Present\' is selected and user CCPA is not present', function(done) {
        var includeOnMatch = true;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        var consented = false;
        var ccpaPresent = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;

        var filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(ccpaPresent)
        );
        var user = MockUser();
        user.setConsentState(consentState);
        var enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                filteringConsentRuleValues,
                user
            );
        enabled.should.be.ok();

        done();
    });

    it('should perform a cookie sync if \'Only Forward\' when CCPA is \'Present\' is selected and user CCPA is present', function(done) {
        var includeOnMatch = true;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        var consented = true;
        var ccpaPresent = true;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;

        var filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(ccpaPresent)
        );
        var user = MockUser();
        user.setConsentState(consentState);
        var enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                filteringConsentRuleValues,
                user
            );
        enabled.should.be.ok();

        done();
    });

    it('should not perform a cookie sync if \'Only Forward\' when CCPA is \'Present\' is selected and CCPA is not present', function(done) {
        var includeOnMatch = true;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        var consented = true;
        var ccpaPresent = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;

        var filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(ccpaPresent)
        );
        var user = MockUser();
        user.setConsentState(consentState);
        var enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                filteringConsentRuleValues,
                user
            );
        enabled.should.not.be.ok();

        done();
    });

    it('should perform a cookie sync if \'Do Not Forward\' if CCPA is \'Present\' is selected and user CCPA is not present', function(done) {
        var includeOnMatch = false;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        var consented = true;
        var ccpaPresent = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;

        var filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(ccpaPresent)
        );
        var user = MockUser();
        user.setConsentState(consentState);
        var enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                filteringConsentRuleValues,
                user
            );
        enabled.should.be.ok();

        done();
    });

    it('should perform a cookie sync if \'Do Not Forward\' if CCPA is \'Not Present\' is selected and user CCPA is present', function(done) {
        var includeOnMatch = false;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        var consented = false;
        var ccpaPresent = true;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;

        var filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        var consentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .setCCPAConsentState(
                mParticle.getInstance().Consent.createCCPAConsent(ccpaPresent)
        );
        var user = MockUser();
        user.setConsentState(consentState);
        var enabled = mParticle.getInstance()._Consent.isEnabledForUserConsent(
                filteringConsentRuleValues,
                user
            );
        enabled.should.be.ok();

        done();
    });

    it('should perform a cookie sync only after GDPR consent is given when consent is required - perform a cookie sync when accepting consent is required', function(done) {
        var includeOnMatch = true;   // 'Only Forward' chosen in UI, 'includeOnMatch' in config
        var consented = true;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;

        var pixelSettings = {
            name: 'TestPixel',
            moduleId: 5,
            esId: 24053,
            isDebug: true,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl: pixelUrl,
            redirectUrl: '',
        };

        pixelSettings.filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.pixelConfigs = [pixelSettings];

        mParticle.init(apiKey, window.mParticle.config);

        setTimeout(function() {
            var localStorage = mParticle.getInstance()._Persistence.getLocalStorage();
            localStorage.testMPID.should.not.have.property('csd')
    
            var falseConsentState = mParticle
                .getInstance()
                .Consent.createConsentState()
                .addGDPRConsentState(
                    'foo purpose 1',
                    mParticle.getInstance().Consent.createGDPRConsent(false)
                );
        
            mParticle.Identity.getCurrentUser().setConsentState(falseConsentState);
            setTimeout(function() {
                var noCookieSyncLS = mParticle.getInstance()._Persistence.getLocalStorage();
                noCookieSyncLS.testMPID.should.not.have.property('csd');
        
                var trueConsentState = mParticle
                    .getInstance()
                    .Consent.createConsentState()
                    .addGDPRConsentState(
                        'foo purpose 1',
                        mParticle.getInstance().Consent.createGDPRConsent(true)
                    );
            
                mParticle.Identity.getCurrentUser().setConsentState(trueConsentState);
        
                setTimeout(function() {
                    var cookieSyncLS = mParticle.getInstance()._Persistence.getLocalStorage();
                    cookieSyncLS.testMPID.should.have.property('csd');
                    cookieSyncLS.testMPID.csd.should.have.property(5);
            
                    done();
                }, timeout);
            }, timeout);
    
        }, timeout);
    });

    it('should perform a cookie sync only after GDPR consent is given when consent is required - perform a cookie sync when consent is rejected', function(done) {
        var includeOnMatch = false;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        var consented = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;

        var pixelSettings = {
            name: 'TestPixel',
            moduleId: 5,
            esId: 24053,
            isDebug: true,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl: pixelUrl,
            redirectUrl: '',
        };

        pixelSettings.filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '1' + 'foo purpose 1'
                    ),
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.pixelConfigs = [pixelSettings];

        mParticle.init(apiKey, window.mParticle.config);

        setTimeout(function() {
            var localStorage = mParticle.getInstance()._Persistence.getLocalStorage();
            localStorage.testMPID.should.not.have.property('csd')
            var falseConsentState = mParticle
            .getInstance()
            .Consent.createConsentState()
            .addGDPRConsentState(
                'foo purpose 1',
                mParticle.getInstance().Consent.createGDPRConsent(false)
            );
    
            mParticle.Identity.getCurrentUser().setConsentState(falseConsentState);

            setTimeout(function() {
                var newLocalStorage = mParticle.getInstance()._Persistence.getLocalStorage();
                newLocalStorage.testMPID.should.not.have.property('csd')

                var trueConsentState = mParticle
                    .getInstance()
                    .Consent.createConsentState()
                    .addGDPRConsentState(
                        'foo purpose 1',
                        mParticle.getInstance().Consent.createGDPRConsent(true)
                    );
            
                mParticle.Identity.getCurrentUser().setConsentState(trueConsentState);
                setTimeout(function() {
                    newLocalStorage = mParticle.getInstance()._Persistence.getLocalStorage();
                    newLocalStorage.testMPID.should.have.property('csd')
                    newLocalStorage.testMPID.csd.should.have.property(5)
                    done();
                }, timeout);
            }, timeout);
        }, timeout);
    });

    it('should perform a cookie sync only after CCPA consent is given when consent is required - perform a cookie sync when accepting consent is required', function(done) {
        var includeOnMatch = true;   // 'Only Forward' chosen in UI, 'includeOnMatch' in config
        var consented = true;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;

        var pixelSettings = {
            name: 'TestPixel',
            moduleId: 5,
            esId: 24053,
            isDebug: true,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl: pixelUrl,
            redirectUrl: '',
        };

        pixelSettings.filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.pixelConfigs = [pixelSettings];

        mParticle.init(apiKey, window.mParticle.config);

        setTimeout(function() {
            var localStorage = mParticle.getInstance()._Persistence.getLocalStorage();
            localStorage.testMPID.should.not.have.property('csd')
            var falseConsentState = mParticle
                .getInstance()
                .Consent.createConsentState()
                .setCCPAConsentState(
                    // false to show that it doesn't perform a cookie sync
                    mParticle.getInstance().Consent.createCCPAConsent(false)
            );
        
            mParticle.Identity.getCurrentUser().setConsentState(falseConsentState);

            setTimeout(function() {
                var noCookieSyncLS = mParticle.getInstance()._Persistence.getLocalStorage();
                noCookieSyncLS.testMPID.should.not.have.property('csd');
    
                var trueConsentState = mParticle
                    .getInstance()
                    .Consent.createConsentState()
                    .setCCPAConsentState(
                        // false to show that it doesn't perform a cookie sync
                        mParticle.getInstance().Consent.createCCPAConsent(true)
                );
            
                mParticle.Identity.getCurrentUser().setConsentState(trueConsentState);

                setTimeout(function() {
                    var cookieSyncLS = mParticle.getInstance()._Persistence.getLocalStorage();
                    cookieSyncLS.testMPID.should.have.property('csd');
                    cookieSyncLS.testMPID.csd.should.have.property(5);
        
                    done();
                }, timeout);
            }, timeout);
        }, timeout);
    });

    it('should perform a cookie sync only after CCPA consent is given when consent is required - perform a cookie sync when consent is rejected', function(done) {
        var includeOnMatch = false;   // 'Do Not Forward' chosen in UI, 'includeOnMatch' in config
        var consented = false;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;

        var pixelSettings = {
            name: 'TestPixel',
            moduleId: 5,
            esId: 24053,
            isDebug: true,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl: pixelUrl,
            redirectUrl: '',
        };

        pixelSettings.filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consented,
                },
            ],
        };
        window.mParticle.config.pixelConfigs = [pixelSettings];

        mParticle.init(apiKey, window.mParticle.config);
        setTimeout(function() {
            var localStorage = mParticle.getInstance()._Persistence.getLocalStorage();
            localStorage.testMPID.should.not.have.property('csd')
            var falseConsentState = mParticle
                .getInstance()
                .Consent.createConsentState()
                .setCCPAConsentState(
                    mParticle.getInstance().Consent.createCCPAConsent(false)
            );
        
            mParticle.Identity.getCurrentUser().setConsentState(falseConsentState);

            setTimeout(function() {
                var newLocalStorage = mParticle.getInstance()._Persistence.getLocalStorage();
                newLocalStorage.testMPID.should.not.have.property('csd')
                
                var trueConsentState = mParticle
                .getInstance()
                .Consent.createConsentState()
                    .setCCPAConsentState(
                        mParticle.getInstance().Consent.createCCPAConsent(true)
                );
            
                mParticle.Identity.getCurrentUser().setConsentState(trueConsentState);

                setTimeout(function() {
                    newLocalStorage = mParticle.getInstance()._Persistence.getLocalStorage();
                    newLocalStorage.testMPID.should.have.property('csd')
                    newLocalStorage.testMPID.csd.should.have.property(5)
            
                    done();
                }, timeout);
            }, timeout);
        }, timeout);
    });

    it('should allow some cookie syncs to occur and others to not occur if there are multiple pixels with varying consent levels', function(done) {
        // This test has 2 pixelSettings. pixelSettings1 requires consent pixelSettings2 does not.  When mparticle initializes, the pixelSettings2 should fire and pixelSettings1 shouldn't.
        // After the appropriate consent is saved to the huser, pixelSettings1 will fire.

        var includeOnMatch = true;   // 'Only Forward' chosen in UI, 'includeOnMatch' in config
        var consented = true;
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;

        //  pixelSetting1 has consent required, and so should only perform a cookiesync after consent is saved to the user
        var pixelSettings1 = {
            name: 'TestPixel',
            moduleId: 1,
            esId: 24053,
            isDebug: true,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl: pixelUrl,
            redirectUrl: '',
        };

        pixelSettings1.filteringConsentRuleValues = {
            includeOnMatch: includeOnMatch,
            values: [
                {
                    consentPurpose: mParticle.generateHash(
                        '2' + 'data_sale_opt_out'
                    ),
                    hasConsented: consented,
                },
            ],
        };

        //  pixelSetting2 does not have any consent required, and so should always perform a cookiesync
        var pixelSettings2 = {
            name: 'TestPixel2',
            moduleId: 2,
            esId: 24053,
            isDebug: true,
            isProduction: true,
            settings: {},
            frequencyCap: 14,
            pixelUrl: pixelUrl,
            redirectUrl: '',
        };

        window.mParticle.config.pixelConfigs = [pixelSettings1, pixelSettings2];

        mParticle.init(apiKey, window.mParticle.config);

        setTimeout(function() {
            var localStorage = mParticle.getInstance()._Persistence.getLocalStorage();
            localStorage.testMPID.should.have.property('csd')
    
            // Performs a cookie sync for 2 but not 1
            localStorage.testMPID.csd.should.not.have.property(1);
            localStorage.testMPID.csd.should.have.property(2);
    
            var trueConsentState = mParticle
                .getInstance()
                .Consent.createConsentState()
                .setCCPAConsentState(
                    mParticle.getInstance().Consent.createCCPAConsent(true)
            );
        
            mParticle.Identity.getCurrentUser().setConsentState(trueConsentState);
            setTimeout(function() {
                var newLocalStorage = mParticle.getInstance()._Persistence.getLocalStorage();
                newLocalStorage.testMPID.should.have.property('csd')
                // Now has both cookie syncs because the appropriate consent was added
                newLocalStorage.testMPID.csd.should.have.property(2)
                newLocalStorage.testMPID.csd.should.have.property(1)
        
                done();
            }, timeout);
        }, timeout);
    });
});