import { expect } from 'chai';
import Utils from './config/utils';
import Store from '../../src/store';
import Constants, { HTTP_ACCEPTED, HTTP_OK } from '../../src/constants';
import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { urls, apiKey, das, MPConfig, testMPID, workspaceCookieName } from './config/constants';

const DefaultConfig = Constants.DefaultConfig,
    setLocalStorage = Utils.setLocalStorage,
    findRequestURL = Utils.findRequestURL,
    findEventFromRequest = Utils.findEventFromRequest,
    findBatch = Utils.findBatch;

const {
    waitForCondition,
    fetchMockSuccess,
    hasIdentifyReturned,
    hasIdentityCallInflightReturned,
    hasConfigurationReturned
} = Utils;

describe('core SDK', function() {
    beforeEach(function() {
        fetchMock.post(urls.events, 200);
        fetchMockSuccess(urls.identify, {
            mpid: testMPID,
            is_logged_in: false,
        });
        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        mParticle._resetForTests(MPConfig);
        fetchMock.restore();
        sinon.restore();
    });

    it('starts new session', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.startNewSession();

        const sessionStartEvent = findEventFromRequest(fetchMock.calls(), 'session_start');

        sessionStartEvent.should.be.ok();
        sessionStartEvent.data.should.have.property('session_uuid');
    });

    it('sessionIds are all capital letters', function(done) {
        const lowercaseLetters = [
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
        const sessionId = mParticle.sessionManager.getSession();
        let lowercaseLetterExists;
        sessionId.split('').forEach(function(letter) {
            if (lowercaseLetters.indexOf(letter) > -1) {
                lowercaseLetterExists = true;
            }
        });

        Should(lowercaseLetterExists).not.be.ok();

        done();
    });

    it('ends existing session with an event that includes SessionLength', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.startNewSession();
        mParticle.endSession();

        const sessionEndEvent = findEventFromRequest(fetchMock.calls(), 'session_end');

        sessionEndEvent.should.be.ok();

        sessionEndEvent.data.should.have.property('session_duration_ms');
    });

    it('creates a new dateLastEventSent when logging an event, and retains the previous one when ending session', async () => {
        await waitForCondition(hasIdentifyReturned);

        const clock = sinon.useFakeTimers();
        mParticle.logEvent('Test Event1');
        const testEvent1 = findEventFromRequest(fetchMock.calls(), 'Test Event1');
        clock.tick(100);

        mParticle.logEvent('Test Event2');
        const testEvent2 = findEventFromRequest(fetchMock.calls(), 'Test Event2');

        mParticle.endSession();
        const sessionEndEvent = findEventFromRequest(fetchMock.calls(), 'session_end');
        Should(testEvent1.data.timestamp_unixtime_ms).not.equal(testEvent2.data.timestamp_unixtime_ms);
        Should(testEvent2.data.timestamp_unixtime_ms).equal(sessionEndEvent.data.timestamp_unixtime_ms);
    });

    it('should process ready queue when initialized', async () => {
        let readyFuncCalled = false;

        mParticle._resetForTests(MPConfig);

        mParticle.ready(function() {
            readyFuncCalled = true;
        });
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentityCallInflightReturned);

        expect(readyFuncCalled).equal(true);
    });

    it('should set app version on the payload', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.setAppVersion('1.0');

        window.mParticle.logEvent('Test Event', mParticle.EventType.Navigation);
        const testEventBatch = findBatch(fetchMock.calls(), 'Test Event');
        testEventBatch.application_info.should.have.property('application_version', '1.0');
    });

    it('should get app version', async () => {
        await waitForCondition(hasIdentityCallInflightReturned);
        mParticle.setAppVersion('2.0');

        const appVersion = mParticle.getAppVersion();
        expect(appVersion).to.equal('2.0');
    });

    it('should get environment setting when set to `production`', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.init(apiKey, {
            ...window.mParticle.config,
            isDevelopmentMode: false,
        });

        mParticle.getEnvironment().should.equal('production');

        done();
    });

    it('should get environment setting when set to `development`', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.init(apiKey, {
            ...window.mParticle.config,
            isDevelopmentMode: true,
        });

        mParticle.getEnvironment().should.equal('development');

        done();
    });

    it('should get app version from config', function(done) {
        mParticle._resetForTests(MPConfig);
        window.mParticle.config.appName = "testAppName";
        mParticle.init(apiKey, window.mParticle.config);

        const appName = mParticle.getAppName();
        appName.should.equal('testAppName');

        done();
    });

    it('should send new appName via event payload', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        }

        mParticle.config.appName = 'newAppName';

        mParticle.init(apiKey, mParticle.config);

        await waitForCondition(() => {
            return (
                window.mParticle.getInstance()?._Store?.identityCallInFlight === false
            );
        });

        window.mParticle.logEvent('Test Event');

        const batch = JSON.parse(fetchMock.lastOptions().body);

        batch.application_info.should.have.property('application_name', 'newAppName');
    });

    it('should allow app name to be changed via setAppName', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle._resetForTests(MPConfig);

        const newConfig = { ...window.mParticle.config, appName: 'OverrideTestName'};
                        
        mParticle.init(apiKey, newConfig);
        await waitForCondition(() => {
            return (
                window.mParticle.getInstance()?._Store?.identityCallInFlight === false
            );
        });

        const appName = mParticle.getAppName();
        appName.should.equal('OverrideTestName');
    })

    it('should set Package Name on Batch Payload', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.config.package = 'my-web-package';

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(() => {
            return (
                window.mParticle.getInstance()?._Store?.identityCallInFlight === false
            );
        });

        window.mParticle.logEvent('Test Event');
        
        const batch = JSON.parse(fetchMock.lastOptions().body);
        
        batch.should.have.property('application_info');
        batch.application_info.should.have.property('package', 'my-web-package');
    });

    it('should sanitize event attributes', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.logEvent('sanitized event', 1, {
            key1: 'value1',
            mydate: new Date(),
            ishouldberemoved: {
                test: 'test',
            },
            ishouldalsoberemoved: ['test'],
            removeme: new Error(),
        });

        const sanitizedEvent = findEventFromRequest(fetchMock.calls(), 'sanitized event');

        sanitizedEvent.data.custom_attributes.should.have.property('key1', 'value1');
        sanitizedEvent.data.custom_attributes.should.have.property('mydate');
        sanitizedEvent.data.custom_attributes.should.not.have.property('ishouldberemoved');
        sanitizedEvent.data.custom_attributes.should.not.have.property('ishouldalsoberemoved');
        sanitizedEvent.data.custom_attributes.should.not.have.property('removeme');
    });

    it('sanitizes attributes when attrs are provided', async () => {
        await waitForCondition(hasIdentifyReturned);

        const attrs = {
            valid: '123',
            invalid: ['123', '345'],
        };

        const product = mParticle.eCommerce.createProduct(
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

        fetchMock.resetHistory();
        mParticle.eCommerce.logCheckout(1, 'visa', attrs);
        const checkoutEvent = findEventFromRequest(fetchMock.calls(), 'checkout');

        checkoutEvent.data.custom_attributes.should.not.have.property('invalid');
        checkoutEvent.data.custom_attributes.should.have.property('valid');

        mParticle.eCommerce.logProductAction(mParticle.ProductActionType.AddToCart, product, attrs);
        const addToCartEvent = findEventFromRequest(fetchMock.calls(), 'add_to_cart');

        addToCartEvent.data.custom_attributes.should.not.have.property('invalid');
        addToCartEvent.data.custom_attributes.should.have.property('valid');

        const transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
            '12345',
            'test-affiliation',
            'coupon-code',
            44334,
            600,
            200
        );

        fetchMock.resetHistory();

        mParticle.eCommerce.logPurchase(
            transactionAttributes,
            product,
            false,
            attrs
        );
        const purchaseEvent = findEventFromRequest(fetchMock.calls(), 'purchase');
        purchaseEvent.data.custom_attributes.should.not.have.property('invalid');
        purchaseEvent.data.custom_attributes.should.have.property('valid');

        const promotion = mParticle.eCommerce.createPromotion(
            'id',
            'creative',
            'name',
            'position'
        );

        fetchMock.resetHistory();

        mParticle.eCommerce.logPromotion(1, promotion, attrs);
        const promotionViewEvent = findEventFromRequest(fetchMock.calls(), 'view');
        promotionViewEvent.data.custom_attributes.should.not.have.property('invalid');
        promotionViewEvent.data.custom_attributes.should.have.property('valid');

        fetchMock.resetHistory();

        mParticle.eCommerce.logRefund(
            transactionAttributes,
            product,
            false,
            attrs
        );
        const refundEvent = findEventFromRequest(fetchMock.calls(), 'refund');

        refundEvent.data.custom_attributes.should.not.have.property('invalid');
        refundEvent.data.custom_attributes.should.have.property('valid');
    });

    it('should not generate a new device ID if a deviceId exists in localStorage', async () => {
        await waitForCondition(hasIdentifyReturned);
            
        mParticle._resetForTests(MPConfig);

        setLocalStorage();
        mParticle.init(apiKey, window.mParticle.config);

        const deviceId = mParticle.getDeviceId();

        deviceId.should.equal(das);
    });

    it('should return the deviceId when requested', function(done) {
        const deviceId = mParticle.getDeviceId();

        Should(deviceId).be.ok();
        deviceId.length.should.equal(36);

        done();
    });

    it('will create a cgid when no previous cgid exists after initializing storage, and no sid', function(done) {
        mParticle._resetForTests(MPConfig);

        mParticle.getInstance()._Store.storageName = Utils.workspaceCookieName;
        mParticle.getInstance()._Persistence.initializeStorage();
        mParticle.getInstance()._Persistence.update();

        const cookieData = mParticle.getInstance()._Persistence.getLocalStorage();

        cookieData.gs.should.have.properties(['cgid']);
        cookieData.gs.should.not.have.property('sid');

        done();
    });

    it('creates a new session when elapsed time between actions is greater than session timeout', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle._resetForTests(MPConfig);
        mParticle.config.sessionTimeout = 1;
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => {
            return (
                window.mParticle.getInstance()?._Store?.identityCallInFlight === false
            );
        });

        const clock = sinon.useFakeTimers();
        clock.tick(100);
        mParticle.logEvent('Test Event');
        const testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');

        clock.tick(70000);

        mParticle.logEvent('Test Event2');
        const testEvent2 = findEventFromRequest(fetchMock.calls(), 'Test Event2');
        testEvent.data.session_uuid.should.not.equal(testEvent2.data.session_uuid);
        mParticle.getInstance()._SessionManager.clearSessionTimeout(); clock.restore();
    });

    it('should end session when last event sent is outside of sessionTimeout', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle._resetForTests(MPConfig);
        mParticle.config.sessionTimeout = 1;
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => {
            return (
                window.mParticle.getInstance()?._Store?.identityCallInFlight === false
            );
        });

        const clock = sinon.useFakeTimers();
        clock.tick(100);
        mParticle.logEvent('Test Event');

        clock.tick(10000);
        mParticle.logEvent('Test Event2');

        clock.tick(120000);
        mParticle.logEvent('Test Event3');

        clock.tick(150000);

        const testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');
        const testEvent2 = findEventFromRequest(fetchMock.calls(), 'Test Event2');
        const testEvent3 = findEventFromRequest(fetchMock.calls(), 'Test Event3');
        
        testEvent2.data.session_uuid.should.equal(testEvent.data.session_uuid);
        testEvent3.data.session_uuid.should.not.equal(testEvent.data.session_uuid);
        clock.restore();
    });

    it('should not end session when end session is called within sessionTimeout timeframe', async () => {
        // This test mimics if another tab is open and events are sent, but previous tab's sessionTimeout is still ongoing
        await waitForCondition(hasIdentifyReturned);

        mParticle._resetForTests(MPConfig);
        mParticle.config.sessionTimeout = 1;
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => {
            return (
                window.mParticle.getInstance()?._Store?.identityCallInFlight === false
            );
        });

        const clock = sinon.useFakeTimers();

        fetchMock.resetHistory();

        clock.tick(100);
        mParticle.logEvent('Test Event');

        // This clock tick initiates a session end event that is successful
        clock.tick(70000);

        let sessionEndEvent = findEventFromRequest(fetchMock.calls(), 'session_end');
        Should(sessionEndEvent).be.ok();

        fetchMock.resetHistory();
        clock.tick(100);

        mParticle.logEvent('Test Event2');

        const sid = mParticle.getInstance()._Persistence.getLocalStorage().gs.sid;

        const new_Persistence = {
            gs: {
                sid: sid,
                ie: 1,
                les: 120000,
            },
        };
        setLocalStorage(workspaceCookieName, new_Persistence);
        // // This clock tick initiates a session end event that is not successful
        clock.tick(70000);
        sessionEndEvent = findEventFromRequest(fetchMock.calls(), 'session_end');

        Should(sessionEndEvent).not.be.ok();
        const testEvent2 = findEventFromRequest(fetchMock.calls(), 'Test Event2');

        mParticle.logEvent('Test Event3');

        const testEvent3 = findEventFromRequest(fetchMock.calls(), 'Test Event3');
        testEvent3.data.session_uuid.should.equal(testEvent2.data.session_uuid);

        clock.restore();
    });

    it('should set the sessionId from memory on the payload', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.logEvent('Test Event');
        const testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');

        const sessionId = mParticle.getInstance()._SessionManager.getSession();

        testEvent.data.session_uuid.should.equal(sessionId);
    });

    it('should set session start date in dto', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.logEvent('Test Event');

        const testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');

        testEvent.data.session_start_unixtime_ms.should.be.above(0);
    });

    it('should update session start date when manually ending session then starting a new one', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.logEvent('Test Event');

        const testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');
        const testEventSessionStartTime = testEvent.data.session_start_unixtime_ms;

        mParticle.endSession();

        const sessionEndEvent = findEventFromRequest(fetchMock.calls(), 'session_end');
        const sessionEndEventSessionStartDate = sessionEndEvent.data.session_start_unixtime_ms;
        sessionEndEventSessionStartDate.should.equal(testEventSessionStartTime);

        mParticle.logEvent('Test Event2');

        const testEvent2 = findEventFromRequest(fetchMock.calls(), 'Test Event2');

        const testEvent2SessionStartDate = testEvent2.data.session_start_unixtime_ms;
        testEvent2SessionStartDate.should.be.above(sessionEndEventSessionStartDate);
    });

    it('should update session start date when session times out, then start a new one', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle._resetForTests(MPConfig);
        mParticle.config.sessionTimeout = 1;

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(() => {
            return (
                window.mParticle.getInstance()?._Store?.identityCallInFlight === false
            );
        });

        const clock = sinon.useFakeTimers();
        clock.tick(10);

        mParticle.logEvent('Test Event');
        const testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');
        const testEventSessionStartDate = testEvent.data.session_start_unixtime_ms;

        // trigger session timeout which ends session automatically
        clock.tick(60000);
        // note to self - session end event not being triggered, could be the same bug
        const sessionEndEvent = findEventFromRequest(fetchMock.calls(), 'session_end');
        const sessionEndEventSessionStartDate = sessionEndEvent.data.session_start_unixtime_ms;
        sessionEndEventSessionStartDate.should.equal(testEventSessionStartDate);

        clock.restore();
        mParticle.logEvent('Test Event2');
        const testEvent2 = findEventFromRequest(fetchMock.calls(), 'Test Event2');

        const testEvent2SessionStartDate = testEvent2.data.session_start_unixtime_ms;
        testEvent2SessionStartDate.should.be.above(sessionEndEventSessionStartDate);
    });

    it('should load SDK with the included api on init and not send events to previous apikey in persistence', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.logEvent('Test Event1');

        const testEvent1URL = findRequestURL(fetchMock.calls(), 'Test Event1');
        testEvent1URL.should.equal(urls.events);

        fetchMock.post(
            'https://jssdks.mparticle.com/v3/JS/new-api-key/events',
            200
        );

        mParticle.init('new-api-key', window.mParticle.config);
        await waitForCondition(() => {
            return (
                window.mParticle.getInstance()?._Store?.identityCallInFlight === false
            );
        });

        mParticle.logEvent('Test Event2');

        const testEvent2URL = findRequestURL(fetchMock.calls(), 'Test Event2');
        testEvent2URL.should.equal(
            'https://jssdks.mparticle.com/v3/JS/new-api-key/events'
        );
    });

    it('should have default options as well as configured options on configuration object, overwriting when appropriate', function(done) {
        const defaults = new Store({}, mParticle.getInstance(), apiKey);
        // all items here should be the default values
        for (const key in DefaultConfig) {
            defaults.SDKConfig.should.have.property(key, DefaultConfig[key]);
        }

        const config = {
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

        const mp = new Store(config, mParticle.getInstance());
        mp.isEnabled.should.equal(true);
        Object.keys(mp.sessionAttributes).length.should.equal(0);
        Object.keys(mp.serverSettings).length.should.equal(0);
        Object.keys(mp.nonCurrentUserMPIDs).length.should.equal(0);
        Object.keys(mp.integrationAttributes).length.should.equal(0);
        Object.keys(mp.cookieSyncDates).length.should.equal(0);
        mp.currentSessionMPIDs.length.should.equal(0);
        mp.isTracking.should.equal(false);
        mp.cartProducts.length.should.equal(0);
        mp.eventQueue.length.should.equal(0);
        mp.identityCallInFlight.should.equal(false);
        mp.identifyCalled.should.equal(false);
        mp.isLoggedIn.should.equal(false);
        mp.requireDelay.should.equal(true);
        mp.activeForwarders.length.should.equal(0);

        (mp.consentState === null).should.equal(true);
        (mp.context === null).should.equal(true);
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

    it('should use custom loggers when provided', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.config.logLevel = 'verbose';
        let errorMessage;
        let warnMessage;
        let infoMessage;

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
        await waitForCondition(() => {
            return (
                window.mParticle.getInstance()?._Store?.identityCallInFlight === false
            );
        });

        infoMessage.should.equal(
            'Batch count: 1'
        );

        mParticle.eCommerce.createProduct();
        errorMessage.should.equal('Name is required when creating a product');

        mParticle.startTrackingLocation();
        warnMessage.should.equal(
            'Warning: Location tracking is triggered, but not including a callback into the `startTrackingLocation` may result in events logged too quickly and not being associated with a location.'
        );
    });

    it('should be able to change logLevel on the fly, postuse custom loggers when provided', async () => {
        const infoMessages = [];

        mParticle.config.logger = {
            verbose: function(msg) {
                infoMessages.push(msg);
            },
        };

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        infoMessages.length.should.equal(0);

        mParticle.setLogLevel('verbose');

        mParticle.logEvent('hi');
        infoMessages[0].should.equal('Starting to log event: hi');
    });

    it("should not log anything to console when logLevel = 'none'", async () => {
        await waitForCondition(hasIdentifyReturned);

        const infoMessages = [];
        const warnMessages = [];
        const errorMessages = [];

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
        await waitForCondition(() => {
            return (
                window.mParticle.getInstance()?._Store?.identityCallInFlight === false
            );
        });

        infoMessages.length.should.equal(0);
        warnMessages.length.should.equal(0);
        errorMessages.length.should.equal(0);

        mParticle.setLogLevel('none');

        mParticle.logEvent('Test Event');

        infoMessages.length.should.equal(0);
        warnMessages.length.should.equal(0);
        errorMessages.length.should.equal(0);

        const testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');
        Should(testEvent).be.ok();
    });

    it('should not error when logger  custom loggers when provided', function(done) {
        /* Previously the Store was initialized before Logger, and since Store contains Logger, and it would throw.
        This no longer throws because Store takes the Logger as an argument, which is now initialized first.
        */
        mParticle.config.logLevel = 'verbose';
        delete mParticle.config.workspaceToken; // no workspace token would previously make the Store fail to Log this fact

        let warnMessage;

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

        mParticle.getInstance()._Store.SDKConfig.v1SecureServiceUrl.should.equal(Constants.DefaultBaseUrls.v1SecureServiceUrl);
        mParticle.getInstance()._Store.SDKConfig.v2SecureServiceUrl.should.equal(Constants.DefaultBaseUrls.v2SecureServiceUrl)
        mParticle.getInstance()._Store.SDKConfig.v3SecureServiceUrl.should.equal(Constants.DefaultBaseUrls.v3SecureServiceUrl)
        mParticle.getInstance()._Store.SDKConfig.configUrl.should.equal(Constants.DefaultBaseUrls.configUrl)
        mParticle.getInstance()._Store.SDKConfig.identityUrl.should.equal(Constants.DefaultBaseUrls.identityUrl)
        mParticle.getInstance()._Store.SDKConfig.aliasUrl.should.equal(Constants.DefaultBaseUrls.aliasUrl)

        done();
    });

    it('should have default urls if no custom urls are set in config object, but use custom urls when they are set', async () => {
        await waitForCondition(hasIdentifyReturned);

        window.mParticle.config.v3SecureServiceUrl =
            'testtesttest-custom-v3secureserviceurl/v3/JS/';
        window.mParticle.config.configUrl =
            'foo-custom-configUrl/v2/JS/';
        window.mParticle.config.identityUrl = 'custom-identityurl/';
        window.mParticle.config.aliasUrl = 'custom-alias/';

        fetchMock.post('https://testtesttest-custom-v3secureserviceurl/v3/JS/test_key/events', HTTP_OK)

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => {
            return (
                window.mParticle.getInstance()?._Store?.identityCallInFlight === false
            );
        });

        mParticle.getInstance()._Store.SDKConfig.v3SecureServiceUrl.should.equal(window.mParticle.config.v3SecureServiceUrl)
        mParticle.getInstance()._Store.SDKConfig.configUrl.should.equal(window.mParticle.config.configUrl)
        mParticle.getInstance()._Store.SDKConfig.identityUrl.should.equal(window.mParticle.config.identityUrl)
        mParticle.getInstance()._Store.SDKConfig.aliasUrl.should.equal(window.mParticle.config.aliasUrl)

        // test events endpoint
        mParticle.logEvent('Test Event');

        const testEventURL = findRequestURL(fetchMock.calls(), 'Test Event');
        testEventURL.should.equal(
            'https://' +
                window.mParticle.config.v3SecureServiceUrl +
                'test_key/events'
        );

        // test Identity endpoint
        fetchMock.resetHistory();
        fetchMockSuccess('https://custom-identityurl/login', {
            mpid: 'loginMPID', is_logged_in: true
        });
        mParticle.Identity.login({ userIdentities: { customerid: 'test1' } });
        
        await waitForCondition(() => {
            return (
                mParticle.Identity.getCurrentUser()?.getMPID() === 'loginMPID'
            );
        });

        fetchMock.calls()[0][0].should.equal('https://' + window.mParticle.config.identityUrl + 'login');
        // test alias endpoint
        // https://go.mparticle.com/work/SQDSDKS-6751
        fetchMock.post('https://custom-alias/test_key/Alias', HTTP_ACCEPTED);

        mParticle.Identity.aliasUsers({
            destinationMpid: 1,
            sourceMpid: 2,
            startTime: 3,
            endTime: 4,
        }, aliasCallback);

        function aliasCallback() {
            const lastFetchCallUrl = fetchMock.lastCall()[0];
            const expectedUrl = `https://${window.mParticle.config.aliasUrl}test_key/Alias`;

            lastFetchCallUrl.should.equal(expectedUrl);
        }
    });

    it('should use configUrl when specified on config object', function (done) {
        // Fetch mock converts the host portion to lowercase
        const expectedConfigUrl = 'https://testconfigurl/test_key/config?env=0';
        mParticle.config.configUrl = 'testConfigUrl/';
        mParticle.config.requestConfig = true;

        fetchMock.get(expectedConfigUrl, 200);
        fetchMock.resetHistory();

        mParticle.init(apiKey, window.mParticle.config);

        fetchMock.lastCall()[0].should.equal(expectedConfigUrl);

        done();
    });

    it('should use custom v3 endpoint when specified on config object', async () => {
        mParticle.config.v3SecureServiceUrl = 'def-v3SecureServiceUrl/v3/JS/';

        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        }

        fetchMock.post(
            'https://def-v3SecureServiceUrl/v3/JS/test_key/events',
            200
        );

        mParticle.init(apiKey, mParticle.config);

        await waitForCondition(hasIdentifyReturned);

        window.mParticle.logEvent('Test Event');

        fetchMock.lastOptions().body.should.be.ok()
    });

    it('should add onCreateBatch to _Store.SDKConfig if onCreateBatch is provide on mParticle.config object', function(done) {
        window.mParticle._resetForTests();
        mParticle.config.onCreateBatch = function(batch) { return batch};
        mParticle.init(apiKey, mParticle.config);
        (typeof mParticle.getInstance()._Store.SDKConfig.onCreateBatch).should.equal('function');

        done();
    });

    it('should not add onCreateBatch to _Store.SDKConfig if it is not a function', function(done) {
        window.mParticle._resetForTests();
        mParticle.config.onCreateBatch = 'not a function';
        mParticle.init(apiKey, mParticle.config);

        (typeof mParticle.getInstance()._Store.SDKConfig.onCreateBatch).should.equal('undefined');

        done();
    });

    it('should hit url with query parameter of env=1 for debug mode for forwarders', function (done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = true;
        mParticle.config.requestConfig = true;
        fetchMock.resetHistory();

        fetchMock.get(
            'https://jssdkcdns.mparticle.com/JS/v2/test_key/config?env=1',
            { status: 200 }
        );

        mParticle.init(apiKey, window.mParticle.config);
        // While config fetch is async, we are only testing what endpoint is hit here, and so we do not need to wait for anything to return
        (fetchMock.calls()[0][0].indexOf('?env=1') > 0).should.equal(
            true
        );
        done();
    });

    it('should hit url with query parameter of env=0 for debug mode for forwarders', function (done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        mParticle.config.requestConfig = true;

        fetchMock.get(urls.config,
            { status: 200 }
        );
        fetchMock.resetHistory();
        mParticle.init(apiKey, window.mParticle.config);

        // rob note - while config fetch is async, we are only testing what endpoint is hit here, and so we do not need to wait for anything to return
        (fetchMock.calls()[0][0].indexOf('?env=0') > 0).should.equal(
            true
        );
        
        done();
    });

    // TODO - there are no actual tests here....what's going on?
    it('should fetch from /config and keep everything properly on the store', async () => {
        mParticle._resetForTests(MPConfig);
        const config = {
            appName: 'appNameTest',
            minWebviewBridgeVersion: 1,
            workspaceToken: 'token1',
        };

        fetchMock.get(urls.config, {
            status: 200,
            body: JSON.stringify({ config }),
        });

        window.mParticle.config.requestConfig = true;
        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasConfigurationReturned);
        mParticle.getInstance()._Store.SDKConfig.appName = config.appName;
        mParticle.getInstance()._Store.SDKConfig.minWebviewBridgeVersion =
            config.minWebviewBridgeVersion;
        mParticle.getInstance()._Store.SDKConfig.workspaceToken = config.workspaceToken;
        localStorage.removeItem(config.workspaceToken);
    });

    it('should initialize and log events even with a failed /config fetch and empty config', async () => {
        // this instance occurs when self hosting and the user only passes an object into init
        mParticle._resetForTests(MPConfig);

        const config = {
            appName: 'appNameTest',
            minWebviewBridgeVersion: 1,
            workspaceToken: 'token1',
        };
        fetchMock.get(urls.config, {
            status: 200,
            body: JSON.stringify({ config }),
        });
        
        fetchMock.config.overwriteRoutes = true;
        fetchMock.post(urls.identify, {status: 400, body: JSON.stringify('')});

        // force config to be only requestConfig = true;
        delete window.mParticle.config.kitConfigs;
        delete window.mParticle.config.isDevelopmentMode;
        delete window.mParticle.config.logLevel;
        delete window.mParticle.config.workspaceToken;
        delete window.mParticle.config.requestConfig;

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasConfigurationReturned);
        // fetching the config is async and we need to wait for it to finish
        mParticle.getInstance()._Store.isInitialized.should.equal(true);

        // have to manually call identify although it was called as part of init because we can only mock the server response once
        fetchMockSuccess(urls.identify, {
            mpid: 'MPID1',
            is_logged_in: false,
        });

        mParticle.Identity.identify({
            userIdentities: { customerid: 'test' },
        });

        await waitForCondition(() => mParticle.Identity.getCurrentUser()?.getMPID() === 'MPID1');

        mParticle.logEvent('Test Event');
        const testEvent = findEventFromRequest(
            fetchMock.calls(),
            'Test Event'
        );

        testEvent.should.be.ok();
    });

    it('should initialize without a config object passed to init', async () => {
        // this instance occurs when self hosting and the user only passes an object into init
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey);
        await waitForCondition(hasIdentityCallInflightReturned);

        mParticle.getInstance()._Store.isInitialized.should.equal(true);
    });

    it('should generate hash both on the mparticle instance and the mparticle instance manager', function(done) {
        const hashValue = -1146196832;
        const hash1 = mParticle.generateHash('TestHash');
        const hash2 = mParticle.getInstance().generateHash('TestHash');

        hash1.should.equal(hashValue);
        hash2.should.equal(hashValue);

        done();
    });

    it('should remove localstorage when calling reset', function(done) {
        mParticle._resetForTests(MPConfig);

        window.mParticle.config.workspaceToken = 'defghi';
        mParticle.init(apiKey, window.mParticle.config)
        let ls = localStorage.getItem('mprtcl-v4_defghi');

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

        let cookie = document.cookie;
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

    it('should set a device id when calling setDeviceId', async () => {
        mParticle._resetForTests(MPConfig);
        
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentityCallInflightReturned);
        // this das should be the SDK auto generated one, which is 36 characters long
        mParticle.getDeviceId().length.should.equal(36);

        mParticle.setDeviceId('foo-guid');
        
        mParticle.getDeviceId().should.equal('foo-guid');
    });

    it('should set a device id when set on mParticle.config', function(done) {
        mParticle._resetForTests(MPConfig);
        window.mParticle.config.deviceId = 'foo-guid';
        mParticle.init(apiKey, window.mParticle.config);

        mParticle.getDeviceId().should.equal('foo-guid');

        done();
    });

    it('should not set the wrapper sdk info in Store when mParticle._setWrapperSDKInfo() method is called if init not called', function(done) {
        mParticle._resetForTests(MPConfig);

        mParticle._setWrapperSDKInfo('flutter', '1.0.3');

        mParticle.getInstance()._Store.wrapperSDKInfo.name.should.equal('none');
        (mParticle.getInstance()._Store.wrapperSDKInfo.version === null).should.equal(true);
        mParticle.getInstance()._Store.wrapperSDKInfo.isInfoSet.should.equal(false);
        
        done();
    });

    it('should have the correct wrapper sdk info default values when init is called', function(done) {
        mParticle._resetForTests(MPConfig);
        
        mParticle.init(apiKey, window.mParticle.config);

        mParticle.getInstance()._Store.wrapperSDKInfo.name.should.equal('none');
        (mParticle.getInstance()._Store.wrapperSDKInfo.version === null).should.equal(true);
        mParticle.getInstance()._Store.wrapperSDKInfo.isInfoSet.should.equal(false);

        done();
    });

    it('should set the wrapper sdk info in Store when mParticle._setWrapperSDKInfo() method is called after init is called', async () => {
        mParticle._resetForTests(MPConfig);

        mParticle._setWrapperSDKInfo('flutter', '1.0.3');

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentityCallInflightReturned);

        mParticle.getInstance()._Store.wrapperSDKInfo.name.should.equal('flutter');
        mParticle.getInstance()._Store.wrapperSDKInfo.version.should.equal('1.0.3');
        mParticle.getInstance()._Store.wrapperSDKInfo.isInfoSet.should.equal(true);
    });

    it('should not set the wrapper sdk info in Store after it has previously been set', async () => {
        mParticle._resetForTests(MPConfig);

        mParticle._setWrapperSDKInfo('flutter', '1.0.3');

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentityCallInflightReturned);

        mParticle._setWrapperSDKInfo('none', '2.0.5');

        mParticle.getInstance()._Store.wrapperSDKInfo.name.should.equal('flutter');
        mParticle.getInstance()._Store.wrapperSDKInfo.version.should.equal('1.0.3');
        mParticle.getInstance()._Store.wrapperSDKInfo.isInfoSet.should.equal(true);
    });

    describe('pod feature flag', function() {
        const endpoints = Constants.DefaultBaseUrls;
        // set up URLs object for each silo
        const URLs = {
            us1: {},
            us2: {},
            eu1: {},
            au1: {},
            st1: {},
            xy1: {} // this is a fake silo used to show that there is no logic that is based on a pre-determined set of silos
        };

        // The below function builds out the above URLs object to have silo-specific urls, ie:
        // URLs.us1.aliasUrl = 'jssdks.us1.mparticle.com/v1/identity/';
        // URLs.us2.aliasUrl = 'jssdks.us2.mparticle.com/v1/identity/';
        // etc, etc for each silo, and each endpoint
        Object.keys(URLs).forEach((key) => {
            for (let endpointKey in endpoints) {
                if (endpointKey === 'configUrl') {
                    // Do not route config url to silo, use the default instead
                    URLs[key][endpointKey] = endpoints[endpointKey];
                }
                const endpointParts = endpoints[endpointKey].split('.');
                URLs[key][endpointKey] = [endpointParts[0], key, ...endpointParts.slice(1)].join('.')
            }
        });

        beforeEach(function() {
            window.mParticle.config.flags = {
                directURLRouting: 'True'
            };
        });

        it('should use US1 endpoints for apiKeys that do not start with a prefix', function(done) {
            const silo = 'us1';
            const apiKey = 'noSiloPrefixApiKey';
            const eventsEndpoint = `https://${URLs[silo].v3SecureServiceUrl}${apiKey}/events`;

            fetchMock.post(eventsEndpoint, 200);

            mParticle.init(apiKey, window.mParticle.config);
            mParticle.getInstance()._Store.SDKConfig.aliasUrl.should.equal(URLs[silo].aliasUrl);
            mParticle.getInstance()._Store.SDKConfig.configUrl.should.equal(Constants.DefaultBaseUrls.configUrl);
            mParticle.getInstance()._Store.SDKConfig.identityUrl.should.equal(URLs[silo].identityUrl);
            mParticle.getInstance()._Store.SDKConfig.v1SecureServiceUrl.should.equal(URLs[silo].v1SecureServiceUrl);
            mParticle.getInstance()._Store.SDKConfig.v2SecureServiceUrl.should.equal(URLs[silo].v2SecureServiceUrl);
            mParticle.getInstance()._Store.SDKConfig.v3SecureServiceUrl.should.equal(URLs[silo].v3SecureServiceUrl);

            done();
        });

        it('should use US1 endpoints for apiKeys with prefix `us1`', function(done) {
            const silo = 'us1';
            const apiKey = 'us1-apiKey';
            const eventsEndpoint = `https://${URLs.us1.v3SecureServiceUrl}${apiKey}/events`;

            fetchMock.post(eventsEndpoint, 200);

            mParticle.init(apiKey, window.mParticle.config);
            mParticle.getInstance()._Store.SDKConfig.aliasUrl.should.equal(URLs[silo].aliasUrl);
            mParticle.getInstance()._Store.SDKConfig.configUrl.should.equal(Constants.DefaultBaseUrls.configUrl);
            mParticle.getInstance()._Store.SDKConfig.identityUrl.should.equal(URLs[silo].identityUrl);
            mParticle.getInstance()._Store.SDKConfig.v1SecureServiceUrl.should.equal(URLs[silo].v1SecureServiceUrl);
            mParticle.getInstance()._Store.SDKConfig.v2SecureServiceUrl.should.equal(URLs[silo].v2SecureServiceUrl);
            mParticle.getInstance()._Store.SDKConfig.v3SecureServiceUrl.should.equal(URLs[silo].v3SecureServiceUrl);

            done();
        });

        it('should use US2 endpoints for apiKeys with prefix `us2`', function(done) {
            const silo = 'us2';
            const apiKey = 'us2-apiKey';
            const eventsEndpoint = `https://${URLs[silo].v3SecureServiceUrl}${apiKey}/events`;

            fetchMock.post(eventsEndpoint, 200);

            mParticle.init(apiKey, window.mParticle.config);
            mParticle.getInstance()._Store.SDKConfig.aliasUrl.should.equal(URLs[silo].aliasUrl);
            mParticle.getInstance()._Store.SDKConfig.configUrl.should.equal(Constants.DefaultBaseUrls.configUrl);
            mParticle.getInstance()._Store.SDKConfig.identityUrl.should.equal(URLs[silo].identityUrl);
            mParticle.getInstance()._Store.SDKConfig.v1SecureServiceUrl.should.equal(URLs[silo].v1SecureServiceUrl);
            mParticle.getInstance()._Store.SDKConfig.v2SecureServiceUrl.should.equal(URLs[silo].v2SecureServiceUrl);
            mParticle.getInstance()._Store.SDKConfig.v3SecureServiceUrl.should.equal(URLs[silo].v3SecureServiceUrl);

            done();
        });

        it('should use EU1 endpoints for apiKeys with prefix `eu1`', function(done) {
            const silo = 'eu1';
            const apiKey = 'eu1-apiKey';
            const eventsEndpoint = `https://${URLs[silo].v3SecureServiceUrl}${apiKey}/events`;

            fetchMock.post(eventsEndpoint, 200);

            mParticle.init(apiKey, window.mParticle.config);
            mParticle.getInstance()._Store.SDKConfig.aliasUrl.should.equal(URLs[silo].aliasUrl);
            mParticle.getInstance()._Store.SDKConfig.configUrl.should.equal(Constants.DefaultBaseUrls.configUrl);
            mParticle.getInstance()._Store.SDKConfig.identityUrl.should.equal(URLs[silo].identityUrl);
            mParticle.getInstance()._Store.SDKConfig.v1SecureServiceUrl.should.equal(URLs[silo].v1SecureServiceUrl);
            mParticle.getInstance()._Store.SDKConfig.v2SecureServiceUrl.should.equal(URLs[silo].v2SecureServiceUrl);
            mParticle.getInstance()._Store.SDKConfig.v3SecureServiceUrl.should.equal(URLs[silo].v3SecureServiceUrl);

            done();
        });

        it('should use AU1 endpoints for apiKeys with prefix `au1`', function(done) {
            const silo = 'au1';
            const apiKey = 'au1-apiKey';
            const eventsEndpoint = `https://${URLs[silo].v3SecureServiceUrl}${apiKey}/events`;

            fetchMock.post(eventsEndpoint, 200);

            mParticle.init(apiKey, window.mParticle.config);
            mParticle.getInstance()._Store.SDKConfig.aliasUrl.should.equal(URLs[silo].aliasUrl);
            mParticle.getInstance()._Store.SDKConfig.configUrl.should.equal(Constants.DefaultBaseUrls.configUrl);
            mParticle.getInstance()._Store.SDKConfig.identityUrl.should.equal(URLs[silo].identityUrl);
            mParticle.getInstance()._Store.SDKConfig.v1SecureServiceUrl.should.equal(URLs[silo].v1SecureServiceUrl);
            mParticle.getInstance()._Store.SDKConfig.v2SecureServiceUrl.should.equal(URLs[silo].v2SecureServiceUrl);
            mParticle.getInstance()._Store.SDKConfig.v3SecureServiceUrl.should.equal(URLs[silo].v3SecureServiceUrl);

            done();
        });

        it('should use ST1 endpoints for apiKeys with prefix `st1`', function(done) {
            const silo = 'st1';
            const apiKey = 'st1-apiKey';
            const eventsEndpoint = `https://${URLs[silo].v3SecureServiceUrl}${apiKey}/events`;

            fetchMock.post(eventsEndpoint, 200);

            mParticle.init(apiKey, window.mParticle.config);
            mParticle.getInstance()._Store.SDKConfig.aliasUrl.should.equal(URLs[silo].aliasUrl);
            mParticle.getInstance()._Store.SDKConfig.configUrl.should.equal(Constants.DefaultBaseUrls.configUrl);
            mParticle.getInstance()._Store.SDKConfig.identityUrl.should.equal(URLs[silo].identityUrl);
            mParticle.getInstance()._Store.SDKConfig.v1SecureServiceUrl.should.equal(URLs[silo].v1SecureServiceUrl);
            mParticle.getInstance()._Store.SDKConfig.v2SecureServiceUrl.should.equal(URLs[silo].v2SecureServiceUrl);
            mParticle.getInstance()._Store.SDKConfig.v3SecureServiceUrl.should.equal(URLs[silo].v3SecureServiceUrl);

            done();
        });

        it('should use xy1 endpoints for apiKeys with prefix `xy1`', function(done) {
            const silo = 'xy1';
            const apiKey = 'xy1-apiKey';
            const eventsEndpoint = `https://${URLs[silo].v3SecureServiceUrl}${apiKey}/events`;

            fetchMock.post(eventsEndpoint, 200);

            mParticle.init(apiKey, window.mParticle.config);
            mParticle.getInstance()._Store.SDKConfig.aliasUrl.should.equal(URLs[silo].aliasUrl);
            mParticle.getInstance()._Store.SDKConfig.configUrl.should.equal(Constants.DefaultBaseUrls.configUrl);
            mParticle.getInstance()._Store.SDKConfig.identityUrl.should.equal(URLs[silo].identityUrl);
            mParticle.getInstance()._Store.SDKConfig.v1SecureServiceUrl.should.equal(URLs[silo].v1SecureServiceUrl);
            mParticle.getInstance()._Store.SDKConfig.v2SecureServiceUrl.should.equal(URLs[silo].v2SecureServiceUrl);
            mParticle.getInstance()._Store.SDKConfig.v3SecureServiceUrl.should.equal(URLs[silo].v3SecureServiceUrl);

            done();
        });

        it('should prioritize configured URLs over direct URL mapping', function(done) {
            window.mParticle.config.v3SecureServiceUrl = 'testtesttest-custom-v3secureserviceurl/v3/JS/';
            window.mParticle.config.configUrl ='foo-custom-configUrl/v2/JS/';
            window.mParticle.config.identityUrl = 'custom-identityUrl/';
            window.mParticle.config.aliasUrl = 'custom-aliasUrl/';

            const {configUrl, v3SecureServiceUrl, identityUrl, aliasUrl} = window.mParticle.config

            const silo = 'us1';
            const apiKey = 'noSiloPrefixApiKey';
            const eventsEndpoint = `https://${v3SecureServiceUrl}${apiKey}/events`;

            fetchMock.post(eventsEndpoint, 200)

            mParticle.init(apiKey, window.mParticle.config);
            mParticle.getInstance()._Store.SDKConfig.aliasUrl.should.equal(aliasUrl);
            mParticle.getInstance()._Store.SDKConfig.configUrl.should.equal(configUrl);
            mParticle.getInstance()._Store.SDKConfig.identityUrl.should.equal(identityUrl);
            mParticle.getInstance()._Store.SDKConfig.v1SecureServiceUrl.should.equal(URLs[silo].v1SecureServiceUrl);
            mParticle.getInstance()._Store.SDKConfig.v2SecureServiceUrl.should.equal(URLs[silo].v2SecureServiceUrl);
            mParticle.getInstance()._Store.SDKConfig.v3SecureServiceUrl.should.equal(v3SecureServiceUrl);

            done();
        });
    });
});