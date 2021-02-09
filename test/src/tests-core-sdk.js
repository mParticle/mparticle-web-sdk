import Utils from './utils';
import Store from '../../src/store';
import Constants from '../../src/constants';
import sinon from 'sinon';
import { urls } from './config';
import { apiKey, das, MPConfig, testMPID, workspaceCookieName, MessageType } from './config';

var DefaultConfig = Constants.DefaultConfig,
    setLocalStorage = Utils.setLocalStorage,
    getEvent = Utils.getEvent,
    findRequest = Utils.findRequest,
    mockServer;

describe('core SDK', function() {
    beforeEach(function() {
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
        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        mockServer.reset();
        mParticle._resetForTests(MPConfig);
    });

    it('starts new session', function(done) {
        mParticle.startNewSession();

        var data = getEvent(mockServer.requests, MessageType.SessionStart);

        data.should.be.ok();

        data.should.have.property('sid');

        done();
    });

    it('sessionIds are all capital letters', function(done) {
        var lowercaseLetters = [
            'a',
            'b',
            'c',
            'd',
            'e',
            'f',
            'g',
            'h',
            'i',
            'j',
            'k',
            'l',
            'n',
            'o',
            'p',
            'q',
            'r',
            's',
            't',
            'u',
            'v',
            'w',
            'x',
            'y',
            'z',
        ];
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

        var data = getEvent(mockServer.requests, MessageType.SessionEnd);

        Should(data).be.ok();
        data.should.have.property('sl');

        done();
    });

    it('creates a new dateLastEventSent when logging an event, and retains the previous one when ending session', function(done) {
        mParticle.logEvent('Test Event1');
        var data1 = getEvent(mockServer.requests, 'Test Event1');

        setTimeout(function() {
            mParticle.logEvent('Test Event2');
            var data2 = getEvent(mockServer.requests, 'Test Event2');

            mParticle.endSession();
            var data3 = getEvent(mockServer.requests, MessageType.SessionEnd);

            var result1 = data1.ct === data2.ct;
            var result2 = data2.ct === data3.ct;

            Should(result1).not.be.ok();
            Should(result2).be.ok();

            done();
        }, 5);
    });

    it('should process ready queue when initialized', function(done) {
        var readyFuncCalled = false;

        mParticle._resetForTests(MPConfig);

        mParticle.ready(function() {
            readyFuncCalled = true;
        });
        mParticle.init(apiKey, window.mParticle.config);

        Should(readyFuncCalled).equal(true);

        done();
    });

    it('should set app version', function(done) {
        mParticle.setAppVersion('1.0');

        window.mParticle.logEvent('Test Event', mParticle.EventType.Navigation);
        var data = getEvent(mockServer.requests, 'Test Event');

        data.should.have.property('av', '1.0');

        done();
    });

    it('should get app version', function(done) {
        mParticle.setAppVersion('2.0');

        var appVersion = mParticle.getAppVersion();

        appVersion.should.equal('2.0');

        done();
    });

    it('should get app version from config', function(done) {
        mParticle._resetForTests(MPConfig);
        window.mParticle.config.appName = "testAppName";
        mParticle.init(apiKey, window.mParticle.config);

        var appName = mParticle.getAppName();
        appName.should.equal('testAppName');

        done();
    });

    it('should send new appName via event payload', function (done) {
        mParticle.config.flags = {
            eventsV3: '100',
            eventBatchingIntervalMillis: 0,
        }

        mParticle.config.appName = 'newAppName';

        mParticle.init(apiKey, mParticle.config);

        window.fetchMock.post(
            'https://jssdks.mparticle.com/v3/JS/test_key/events',
            200
        );

        window.mParticle.logEvent('Test Event');

        var batch = JSON.parse(window.fetchMock.lastOptions().body);

        batch.application_info.should.have.property('application_name', 'newAppName');
        
        done();
    });

    it('should allow app name to be changed via setAppName', function (done) {
        mParticle._resetForTests(MPConfig);

        const newConfig = { ...window.mParticle.config, appName: 'OverrideTestName'};

        mParticle.init(apiKey, newConfig);

        var appName = mParticle.getAppName();
        appName.should.equal('OverrideTestName');


        done();
    })

    it('should set client id', function(done) {
        window.mParticle.logEvent('Test Event', mParticle.EventType.Navigation);
        var data = getEvent(mockServer.requests, 'Test Event');

        data.should.have.property('cgid').with.lengthOf(36);

        done();
    });

    it('should sanitize event attributes', function(done) {
        mParticle.logEvent('sanitized event', 1, {
            key1: 'value1',
            mydate: new Date(),
            ishouldberemoved: {
                test: 'test',
            },
            ishouldalsoberemoved: ['test'],
            removeme: new Error(),
        });

        var event = getEvent(mockServer.requests, 'sanitized event');

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
            invalid: ['123', '345'],
        };

        var product = mParticle.eCommerce.createProduct(
            'name',
            'sku',
            100,
            1,
            'variant',
            'category',
            'brand',
            'position',
            'coupon',
            attrs
        );
        product.Attributes.should.not.have.property('invalid');
        product.Attributes.should.have.property('valid');

        mParticle.eCommerce.logCheckout(1, 'visa', attrs);
        var event = getEvent(mockServer.requests, 'eCommerce - Checkout');
        event.attrs.should.not.have.property('invalid');
        event.attrs.should.have.property('valid');

        mockServer.requests = [];
        mParticle.eCommerce.logProductAction(1, product, attrs);
        event = getEvent(mockServer.requests, 'eCommerce - AddToCart');
        event.attrs.should.not.have.property('invalid');
        event.attrs.should.have.property('valid');

        var transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
            '12345',
            'test-affiliation',
            'coupon-code',
            44334,
            600,
            200
        );

        mockServer.requests = [];
        mParticle.eCommerce.logPurchase(
            transactionAttributes,
            product,
            false,
            attrs
        );
        event = getEvent(mockServer.requests, 'eCommerce - Purchase');
        event.attrs.should.not.have.property('invalid');
        event.attrs.should.have.property('valid');

        var promotion = mParticle.eCommerce.createPromotion(
            'id',
            'creative',
            'name',
            'position'
        );

        mockServer.requests = [];
        mParticle.eCommerce.logPromotion(1, promotion, attrs);
        event = getEvent(mockServer.requests, 'eCommerce - PromotionView');
        event.attrs.should.not.have.property('invalid');
        event.attrs.should.have.property('valid');

        mockServer.requests = [];
        mParticle.eCommerce.logRefund(
            transactionAttributes,
            product,
            false,
            attrs
        );
        event = getEvent(mockServer.requests, 'eCommerce - Refund');
        event.attrs.should.not.have.property('invalid');
        event.attrs.should.have.property('valid');

        done();
    });

    it('should not generate a new device ID if a deviceId exists in localStorage', function(done) {
        mParticle._resetForTests(MPConfig);

        setLocalStorage();
        mParticle.init(apiKey, window.mParticle.config);

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
        mParticle._resetForTests(MPConfig);

        mParticle.getInstance()._Store.storageName = Utils.workspaceCookieName;
        mParticle.getInstance()._Persistence.initializeStorage();
        mParticle.getInstance()._Persistence.update();

        var cookieData = mParticle.getInstance()._Persistence.getLocalStorage();

        cookieData.gs.should.have.properties(['cgid']);
        cookieData.gs.should.not.have.property('sid');

        done();
    });

    it('creates a new session when elapsed time between actions is greater than session timeout', function(done) {
        mParticle._resetForTests(MPConfig);
        var clock = sinon.useFakeTimers();
        mParticle.config.sessionTimeout = 1;
        mParticle.init(apiKey, window.mParticle.config);
        clock.tick(100);
        mParticle.logEvent('Test Event');
        var data = getEvent(mockServer.requests, 'Test Event');

        clock.tick(70000);

        mParticle.logEvent('Test Event2');
        var data2 = getEvent(mockServer.requests, 'Test Event2');
        data.sid.should.not.equal(data2.sid);
        mParticle.getInstance()._SessionManager.clearSessionTimeout();
        clock.restore();

        done();
    });

    it('should end session when last event sent is outside of sessionTimeout', function(done) {
        mParticle._resetForTests(MPConfig);
        var clock = sinon.useFakeTimers();
        mParticle.config.sessionTimeout = 1;
        mParticle.init(apiKey, window.mParticle.config);
        clock.tick(100);
        mParticle.logEvent('Test Event');

        clock.tick(10000);
        mParticle.logEvent('Test Event2');

        clock.tick(120000);
        mParticle.logEvent('Test Event3');

        clock.tick(150000);

        var data1 = getEvent(mockServer.requests, 'Test Event');
        var data2 = getEvent(mockServer.requests, 'Test Event2');
        var data3 = getEvent(mockServer.requests, 'Test Event3');

        data2.sid.should.equal(data1.sid);
        data3.sid.should.not.equal(data1.sid);
        clock.restore();
        done();
    });

    it('should not end session when end session is called within sessionTimeout timeframe', function(done) {
        // This test mimics if another tab is open and events are sent, but previous tab's sessionTimeout is still ongoing
        mParticle._resetForTests(MPConfig);
        var clock = sinon.useFakeTimers();
        mParticle.config.sessionTimeout = 1;
        mParticle.init(apiKey, window.mParticle.config);

        mockServer.requests = [];
        clock.tick(100);
        mParticle.logEvent('Test Event');

        // This clock tick initiates a session end event that is successful
        clock.tick(70000);

        var data1 = getEvent(mockServer.requests, 2);
        Should(data1).be.ok();

        mockServer.requests = [];

        // clock.tick(100);
        mParticle.logEvent('Test Event2');

        var sid = mParticle.getInstance()._Persistence.getLocalStorage().gs.sid;

        var new_Persistence = {
            gs: {
                sid: sid,
                ie: 1,
                les: 120000,
            },
        };
        setLocalStorage(workspaceCookieName, new_Persistence);
        // // This clock tick initiates a session end event that is not successful
        clock.tick(70000);
        var noData = getEvent(mockServer.requests, 2);
        Should(noData).not.be.ok();
        var data2 = getEvent(mockServer.requests, 'Test Event2');

        mParticle.logEvent('Test Event3');

        var data3 = getEvent(mockServer.requests, 'Test Event3');
        data3.sid.should.equal(data2.sid);

        clock.restore();
        done();
    });

    it('should get sessionId', function(done) {
        mParticle.logEvent('Test Event');
        var data = getEvent(mockServer.requests, 'Test Event');

        var sessionId = mParticle.getInstance()._SessionManager.getSession();

        data.sid.should.equal(sessionId);

        done();
    });

    it('should set session start date in dto', function(done) {
        mParticle.logEvent('Test Event');

        var data = getEvent(mockServer.requests, 'Test Event');

        data.ssd.should.be.above(0);

        done();
    });

    it('should update session start date when manually ending session then starting a new one', function(done) {
        mParticle.logEvent('Test Event');

        var firstSessionStartDate = getEvent(mockServer.requests, 'Test Event').ssd;

        mParticle.endSession();
        var sessionEndEventSessionStartDate = getEvent(mockServer.requests, 2).ssd;
        sessionEndEventSessionStartDate.should.equal(firstSessionStartDate);

        mParticle.logEvent('Another Test');
        var newSessionStartDate = getEvent(mockServer.requests, 'Another Test').ssd;
        newSessionStartDate.should.be.above(sessionEndEventSessionStartDate);

        done();
    });

    it('should update session start date when session times out,then starting a new one', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.sessionTimeout = 1;

        var clock = sinon.useFakeTimers();
        mParticle.init(apiKey, mParticle.config);

        clock.tick(10);

        mParticle.logEvent('Test Event');
        var firstSessionStartDate = getEvent(mockServer.requests, 'Test Event').ssd;

        // trigger session timeout which ends session automatically
        clock.tick(60000);

        var sessionEndEventSessionStartDate = getEvent(mockServer.requests, 2).ssd;
        sessionEndEventSessionStartDate.should.equal(firstSessionStartDate);

        clock.tick(100);

        mParticle.logEvent('Another Test');
        var newSessionStartDate = getEvent(mockServer.requests, 'Another Test').ssd;
        newSessionStartDate.should.be.above(sessionEndEventSessionStartDate);

        clock.restore();

        done();
    });

    it('should load SDK with the included api on init and not send events to previous apikey in persistence', function(done) {
        mParticle.logEvent('Test Event1');

        var event1 = findRequest(mockServer.requests, 'Test Event1');
        event1.url.should.equal(
            urls.eventsV2
        );

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.logEvent('Test Event2');
        var event2 = findRequest(mockServer.requests, 'Test Event2')
        event2.url.should.equal(
            urls.eventsV2
        );

        done();
    });

    it('should have default options as well as configured options on configuration object, overwriting when appropriate', function(done) {
        var defaults = new Store({}, mParticle.getInstance());
        // all items here should be the default values
        for (var key in DefaultConfig) {
            defaults.SDKConfig.should.have.property(key, DefaultConfig[key]);
        }

        var config = {
            useCookieStorage: true,
            logLevel: 'abc',
            useNativeSdk: true,
            isIOS: true,
            maxProducts: 10,
            maxCookieSize: 2000,
            appName: 'testApp',
            integrationDelayTimeout: 100,
            identifyRequest: {
                userIdentities: {
                    customerid: 'test',
                },
            },
            identityCallback: function() {
                return 'identityCallback';
            },
            appVersion: 'v2.0.0',
            sessionTimeout: 3000,
            forceHttps: false,
            customFlags: { flag1: 'attr1' },
            workspaceToken: 'abcdef',
            requiredWebviewBridgeName: 'exampleWebviewBridgeName',
            minWebviewBridgeVersion: 2,
            aliasMaxWindow: 3,
        };

        var mp = new Store(config, mParticle.getInstance());
        mp.isEnabled.should.equal(true);
        Object.keys(mp.sessionAttributes).length.should.equal(0);
        Object.keys(mp.migrationData).length.should.equal(0);
        Object.keys(mp.serverSettings).length.should.equal(0);
        Object.keys(mp.nonCurrentUserMPIDs).length.should.equal(0);
        Object.keys(mp.integrationAttributes).length.should.equal(0);
        Object.keys(mp.cookieSyncDates).length.should.equal(0);
        mp.currentSessionMPIDs.length.should.equal(0);
        mp.isTracking.should.equal(false);
        mp.cartProducts.length.should.equal(0);
        mp.eventQueue.length.should.equal(0);
        mp.context.should.equal('');
        mp.identityCallInFlight.should.equal(false);
        mp.migratingToIDSyncCookies.should.equal(false);
        mp.identifyCalled.should.equal(false);
        mp.isLoggedIn.should.equal(false);
        mp.requireDelay.should.equal(true);
        mp.activeForwarders.length.should.equal(0);

        (mp.consentState === null).should.equal(true);
        (mp.sessionId === null).should.equal(true);
        (mp.isFirstRun === null).should.equal(true);
        (mp.clientId === null).should.equal(true);
        (mp.deviceId === null).should.equal(true);
        (mp.devToken === null).should.equal(true);
        (mp.dateLastEventSent === null).should.equal(true);
        (mp.sessionStartDate === null).should.equal(true);
        (mp.currentPosition === null).should.equal(true);
        (mp.watchPositionId === null).should.equal(true);
        (mp.currencyCode === null).should.equal(true);
        (mp.globalTimer === null).should.equal(true);
        (mp.isLocalStorageAvailable === null).should.equal(true);

        // all items here should be the overwritten values
        mp.SDKConfig.useCookieStorage.should.equal(config.useCookieStorage);
        mp.SDKConfig.useNativeSdk.should.equal(config.useNativeSdk);
        mp.SDKConfig.isIOS.should.equal(config.isIOS);
        mp.SDKConfig.maxProducts.should.equal(config.maxProducts);
        mp.SDKConfig.maxCookieSize.should.equal(config.maxCookieSize);
        mp.SDKConfig.appName.should.equal(config.appName);
        mp.SDKConfig.integrationDelayTimeout.should.equal(
            config.integrationDelayTimeout
        );
        JSON.stringify(mp.SDKConfig.identifyRequest).should.equal(
            JSON.stringify(config.identifyRequest)
        );
        mp.SDKConfig.identityCallback().should.equal(config.identityCallback());
        mp.SDKConfig.appVersion.should.equal(config.appVersion);
        mp.SDKConfig.sessionTimeout.should.equal(3000);
        mp.SDKConfig.forceHttps.should.equal(config.forceHttps);
        mp.SDKConfig.customFlags.should.equal(config.customFlags);
        mp.SDKConfig.workspaceToken.should.equal(config.workspaceToken);
        mp.SDKConfig.requiredWebviewBridgeName.should.equal(
            config.requiredWebviewBridgeName
        );
        mp.SDKConfig.minWebviewBridgeVersion.should.equal(
            config.minWebviewBridgeVersion
        );
        mp.SDKConfig.aliasMaxWindow.should.equal(config.aliasMaxWindow);

        mParticle._resetForTests(MPConfig);

        done();
    });

    it('should use custom loggers when provided', function(done) {
        mParticle.config.logLevel = 'verbose';
        var errorMessage;
        var warnMessage;
        var infoMessage;

        mParticle.config.logger = {
            error: function(msg) {
                errorMessage = msg;
            },
            warning: function(msg) {
                warnMessage = msg;
            },
            verbose: function(msg) {
                infoMessage = msg;
            },
        };

        mParticle.init(apiKey, window.mParticle.config);
        infoMessage.should.equal(
            'Received OK from server'
        );

        mParticle.eCommerce.createProduct();
        errorMessage.should.equal('Name is required when creating a product');

        mParticle.startTrackingLocation();
        warnMessage.should.equal(
            'Warning: Location tracking is triggered, but not including a callback into the `startTrackingLocation` may result in events logged too quickly and not being associated with a location.'
        );

        done();
    });

    it('should be able to change logLevel on the fly, postuse custom loggers when provided', function(done) {
        var infoMessages = [];

        mParticle.config.logger = {
            verbose: function(msg) {
                infoMessages.push(msg);
            },
        };

        mParticle.init(apiKey, window.mParticle.config);

        infoMessages.length.should.equal(0);

        mParticle.setLogLevel('verbose');

        mParticle.logEvent('hi');
        infoMessages[0].should.equal('Starting to log event: hi');

        done();
    });

    it("should not log anything to console when logLevel = 'none'", function(done) {
        var infoMessages = [];
        var warnMessages = [];
        var errorMessages = [];

        mParticle.config.logger = {
            error: function(msg) {
                errorMessages.push(msg);
            },
            warning: function(msg) {
                warnMessages.push(msg);
            },
            verbose: function(msg) {
                infoMessages.push(msg);
            },
        };

        mParticle.init(apiKey, window.mParticle.config);

        infoMessages.length.should.equal(0);
        warnMessages.length.should.equal(0);
        errorMessages.length.should.equal(0);

        mParticle.setLogLevel('none');

        mParticle.logEvent('hi');

        infoMessages.length.should.equal(0);
        warnMessages.length.should.equal(0);
        errorMessages.length.should.equal(0);

        var data = getEvent(mockServer.requests, 'hi');
        Should(data).be.ok();

        done();
    });

    it('should not error when logger  custom loggers when provided', function(done) {
        /* Previously the Store was initialized before Logger, and since Store contains Logger, and it would throw.
        This no longer throws because Store takes the Logger as an argument, which is now initialized first.
        */
        mParticle.config.logLevel = 'verbose';
        delete mParticle.config.workspaceToken; // no workspace token would previously make the Store fail to Log this fact

        var warnMessage;

        mParticle.config.logger = {
            warning: function(msg) {
                warnMessage = msg;
            },
        };

        mParticle.init(apiKey, window.mParticle.config);

        warnMessage.should.equal(
            'You should have a workspaceToken on your config object for security purposes.'
        );

        done();
    });

    it('should use default urls if no custom urls are set in config object', function(done) {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.getInstance()._Store.SDKConfig.v1SecureServiceUrl.should.equal(Constants.DefaultUrls.v1SecureServiceUrl);
        mParticle.getInstance()._Store.SDKConfig.v2SecureServiceUrl.should.equal(Constants.DefaultUrls.v2SecureServiceUrl)
        mParticle.getInstance()._Store.SDKConfig.v3SecureServiceUrl.should.equal(Constants.DefaultUrls.v3SecureServiceUrl)
        mParticle.getInstance()._Store.SDKConfig.configUrl.should.equal(Constants.DefaultUrls.configUrl)
        mParticle.getInstance()._Store.SDKConfig.identityUrl.should.equal(Constants.DefaultUrls.identityUrl)
        mParticle.getInstance()._Store.SDKConfig.aliasUrl.should.equal(Constants.DefaultUrls.aliasUrl)

        done();
    });

    it('should have default urls if no custom urls are set in config object, but use custom urls when they are set', function(done) {
        window.mParticle.config.v1SecureServiceUrl =
            'custom-v1SecureServiceUrl/';
        window.mParticle.config.v2SecureServiceUrl =
            'custom-v2SecureServiceUrl/v2/JS/';
        window.mParticle.config.v3SecureServiceUrl =
            'custom-v3SecureServiceUrl/v3/JS/';
        window.mParticle.config.configUrl =
            'custom-configUrl/v2/JS/';
        window.mParticle.config.identityUrl = 'custom-identityUrl/';
        window.mParticle.config.aliasUrl = 'custom-aliasUrl/';

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.getInstance()._Store.SDKConfig.v1SecureServiceUrl.should.equal(window.mParticle.config.v1SecureServiceUrl)
        mParticle.getInstance()._Store.SDKConfig.v2SecureServiceUrl.should.equal(window.mParticle.config.v2SecureServiceUrl)
        mParticle.getInstance()._Store.SDKConfig.v3SecureServiceUrl.should.equal(window.mParticle.config.v3SecureServiceUrl)
        mParticle.getInstance()._Store.SDKConfig.configUrl.should.equal(window.mParticle.config.configUrl)
        mParticle.getInstance()._Store.SDKConfig.identityUrl.should.equal(window.mParticle.config.identityUrl)
        mParticle.getInstance()._Store.SDKConfig.aliasUrl.should.equal(window.mParticle.config.aliasUrl)

        // test events endpoint
        mockServer.requests = [];
        mParticle.logEvent('test');
        mockServer.requests[0].url.should.equal(
            'https://' +
                window.mParticle.config.v2SecureServiceUrl +
                'test_key/Events'
        );

        // test Identity endpoint
        mockServer.requests = [];
        mParticle.Identity.login({ userIdentities: { customerid: 'test1' } });
        mockServer.requests[0].url.should.equal(
            'https://' + window.mParticle.config.identityUrl + 'login'
        );

        // test alias endpoint
        mockServer.requests = [];
        mParticle.Identity.aliasUsers({
            destinationMpid: 1,
            sourceMpid: 2,
            startTime: 3,
            endTime: 4,
        });

        mockServer.requests[0].url.should.equal(
            'https://' + window.mParticle.config.aliasUrl + 'test_key/Alias'
        );

        done();
    });

    it('should use configUrl when specified on config object', function(done) {
        mParticle.config.configUrl = 'testConfigUrl/';
        mParticle.config.requestConfig = true;

        mockServer.requests = [];
        mParticle.init(apiKey, window.mParticle.config);

        mockServer.requests[0].url.should.equal(
            'https://testConfigUrl/test_key/config?env=0'
        );

        done();
    });

    it('should use custom v3 endpoint when specified on config object', function(done) {
        mParticle.config.v3SecureServiceUrl = 'custom-v3SecureServiceUrl/v3/JS/';

        mParticle.config.flags = {
            eventsV3: '100',
            eventBatchingIntervalMillis: 0,
        }

        window.fetchMock.post(
            'https://custom-v3SecureServiceUrl/v3/JS/test_key/events',
            200
        );

        mParticle.init(apiKey, mParticle.config);

        mockServer.requests = [];
        mParticle.init(apiKey, window.mParticle.config);

        window.mParticle.logEvent('Test Event');

        window.fetchMock.lastOptions().body.should.be.ok()

        done();
    });

    const configOptions = [
        'v1SecureServiceUrl',
        'v2SecureServiceUrl',
        'v3SecureServiceUrl',
        'identityUrl',
        'aliasUrl',
        'configUrl',
        'logLevel',
        'useNativeSdk',
        'kits',
        'isIOS',
        'useCookieStorage',
        'maxProducts',
        'maxCookieSize',
        'appName',
        'integrationDelayTimeout',
        'identifyRequest',
        'appVersion',
        'appName',
        'sessionTimeout',
        'forceHttps',
        'customFlags',
        'minWebviewBridgeVersion',
        'aliasMaxWindow'
    ];
    configOptions.forEach(option => {
        it('Store should configure SDKConfig itself with ' + option, done => {
            mParticle._resetForTests();
            const config = {}
            config[option] = 'custom-' + option;
            mParticle.init(apiKey, config);
            mParticle.getInstance()._Store.SDKConfig[option].should.equal('custom-' + option);
            done();
        });
    });

    it('should hit url with query parameter of env=1 for debug mode for forwarders', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = true;
        mParticle.config.requestConfig = true;
        mockServer.requests = [];

        mParticle.init(apiKey, window.mParticle.config);

        (mockServer.requests[0].url.indexOf('?env=1') > 0).should.equal(true);

        mockServer.requests = [];
        mParticle.config.requestConfig = true;
        mParticle.config.isDevelopmentMode = false;
        mParticle.init(apiKey, window.mParticle.config);

        (mockServer.requests[0].url.indexOf('?env=0') > 0).should.equal(true);
        done();
    });

    // TODO - there are no actual tests here....what's going on?
    it('should fetch from /config and keep everything properly on the store', function(done) {
        mParticle._resetForTests(MPConfig);
        var config = {
            appName: 'appNameTest',
            minWebviewBridgeVersion: 1,
            workspaceToken: 'token1',
        };

        mockServer.respondWith(urls.config, [
            200,
            {},
            JSON.stringify(config),
        ]);

        window.mParticle.config.requestConfig = true;
        mParticle.init(apiKey, window.mParticle.config);

        mParticle.getInstance()._Store.SDKConfig.appName = config.appName;
        mParticle.getInstance()._Store.SDKConfig.minWebviewBridgeVersion =
            config.minWebviewBridgeVersion;
        mParticle.getInstance()._Store.SDKConfig.workspaceToken = config.workspaceToken;
        localStorage.removeItem(config.workspaceToken);

        done();
    });

    it('should initialize and log events even with a failed /config fetch and empty config', function(done) {
        // this instance occurs when self hosting and the user only passes an object into init
        mParticle._resetForTests(MPConfig);

        mockServer.respondWith(urls.identify, [
            400,
            {},
            JSON.stringify(''),
        ]);

        // force config to be only requestConfig = true;
        delete window.mParticle.config.kitConfigs;
        delete window.mParticle.config.isDevelopmentMode;
        delete window.mParticle.config.logLevel;
        delete window.mParticle.config.workspaceToken;
        delete window.mParticle.config.requestConfig;

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.getInstance()._Store.isInitialized.should.equal(true);

        // have to manually call identify although it was called as part of init because we can only mock the server response once
        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({mpid: 'MPID1'}),
        ]);

        mParticle.Identity.identify({ userIdentities: { customerid: 'test' } });
        mockServer.requests = [];
        mParticle.logEvent('test');
        mockServer.requests.length.should.equal(1);

        done();
    });

    it('should initialize without a config object passed to init', function(done) {
        // this instance occurs when self hosting and the user only passes an object into init
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey);

        mParticle.getInstance()._Store.isInitialized.should.equal(true);

        done();
    });

    it('should generate hash both on the mparticle instance and the mparticle instance manager', function(done) {
        var hashValue = -1146196832;
        var hash1 = mParticle.generateHash('TestHash');
        var hash2 = mParticle.getInstance().generateHash('TestHash');

        hash1.should.equal(hashValue);
        hash2.should.equal(hashValue);

        done();
    });

    it('should remove localstorage when calling reset', function(done) {
        mParticle._resetForTests(MPConfig);

        window.mParticle.config.workspaceToken = 'defghi';
        mParticle.init(apiKey, window.mParticle.config)
        var ls = localStorage.getItem('mprtcl-v4_defghi');

        ls.should.be.ok();
        mParticle.reset();
        
        ls = localStorage.getItem('mprtcl-v4_defghi');
        (ls === null).should.equal(true)
        
        done();
    });
    
    it('should remove cookies when calling reset', function(done) {
        mParticle._resetForTests(MPConfig);

        window.mParticle.config.useCookieStorage = true;
        window.mParticle.config.workspaceToken = 'defghi';
        mParticle.init(apiKey, window.mParticle.config)

        var cookie = document.cookie;
        cookie.includes('mprtcl-v4_defghi').should.equal(true);
        mParticle.reset();

        cookie = document.cookie;
        
        cookie.includes('mprtcl-v4_defghi').should.equal(false);
        
        window.mParticle.config.useCookieStorage = false;
        done();
    });

    it('should queue setCurrencyCode successfully when SDK is not yet initialized, and then later initialized', function(done) {
        mParticle._resetForTests(MPConfig);
        // mock a non-initialized state
        mParticle.getInstance()._Store.isInitialized = false;

        // when SDK is not yet initialized, this will add to the ready queue
        mParticle.eCommerce.setCurrencyCode('USD');

        // initializing SDK will flush the ready queue and setCurrencyCode should not throw an error
        mParticle.init(apiKey, window.mParticle.config)

        done();
    });
});