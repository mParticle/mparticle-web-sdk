/* eslint-disable no-undef*/
var server = new MockHttpServer();
window.mParticle.isTestEnvironment = true;

describe('AdobeEventForwarder Forwarder', function () {
    var EventType = {
            Unknown: 0,
            Navigation: 1,
            Location: 2,
            Search: 3,
            Transaction: 4,
            UserContent: 5,
            UserPreference: 6,
            Social: 7,
            Other: 8,
            Media: 9,
            ProductPurchase: 16,
            getName: function () {
                return 'TestName';
            }
        },
        ProductActionType = {
            Unknown: 0,
            AddToCart: 1,
            RemoveFromCart: 2,
            Checkout: 3,
            CheckoutOption: 4,
            Click: 5,
            ViewDetail: 6,
            Purchase: 7,
            Refund: 8,
            AddToWishlist: 9,
            RemoveFromWishlist: 10
        },
        MockVisitorInstance = function() {
            this.visitorInstance = null;
            this.orgId = null;
            this.getInstanceCalled = false;
            this.userId = null;

            this.setCustomerIDs = function(userIdObject) {
                this.userId = userIdObject;
            };
            this.getCustomerIDs = function() {
                return this.userId;
            };
        },

        Visitor = {
            getInstance: function(orgId, options) {
                var instance = new MockVisitorInstance;
                instance.orgId = orgId;
                this.options = options;
                instance.getInstanceCalled = true;
                instance.getMarketingCloudVisitorID = function(cb) {
                    cb('MCID test');
                };
                return instance;
            },
            AuthState: {
                AUTHENTICATED: 1,
                LOGGED_OUT: 2,
                UNKNOWN: 0
            }
        },

        MockAppMeasurement= function() {
            var self = this;

            this.products = null;
            this.events = null;
            this.contextData = {};
            this.tCalled = false;
            this.tlCalled = false;
            this.trackCustomEventCalled = false;
            this.logPurchaseEventCalled = false;
            this.initializeCalled = false;
            self.exitLinkBoolean = null;
            self.linkType = null;
            self.linkName = null;

            this.t = function() {
                self.tCalled = true;
            };

            this.tl = function(exitLinkBoolean, linkType, linkName) {
                self.tlCalled = true;
                self.exitLinkBoolean = exitLinkBoolean;
                self.linkType = linkType;
                self.linkName = linkName;
            };

            this.clearVarsCalled = false;

            this.clearVars = function() {
                //only call clearVars after s.t() is called
                if (self.tCalled || self.tlCalled) {
                    self.clearVarsCalled = true;
                }
            };
        },
        MockMediaHeartbeat = function () {
            this.trackPlay = function () {
                window.trackPlayCalled = true;
                return true;
            };
        };

    var MockMediaHeartbeatConfig = function () { };
    var MockMediaHeartbeatDelegate = function () { };

    var settings;

    function configureAdobeForwarderAndReInit(timestampOption, setGlobalObject, enablePageNamedBoolean, audienceManagerServer) {
        settings.setGlobalObject = setGlobalObject;
        settings.timestampOption = timestampOption;
        settings.enablePageName = enablePageNamedBoolean || false;
        settings.audienceManagerServer = audienceManagerServer;

        mParticle.config = {
            requestConfig: false,
            logLevel: 'none',
            workspaceToken: 'testworkspacetoken',
            kitConfigs: [
                {
                    name: 'Adobe',
                    settings: settings,
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
                }
            ]
        };
        mParticle.init('apikey', mParticle.config);
    }

    window.s_gi = function(reportSuiteID) {
        if (!window.mockInstances.hasOwnProperty(reportSuiteID)) {
            window.mockInstances[reportSuiteID] = new MockAppMeasurement;
        }
        return window.mockInstances[reportSuiteID];
    };

    beforeAll(function () {
        server.start();
        server.requests = [];
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'testMPID'
            }));
        };
        window.Visitor = Visitor;
        window.AppMeasurement = MockAppMeasurement;
        window.ADB = {
            va: {
                MediaHeartbeat: MockMediaHeartbeat,
                MediaHeartbeatConfig: MockMediaHeartbeatConfig,
                MediaHeartbeatDelegate: MockMediaHeartbeatDelegate
            }
        };
        mParticle.generateHash = function (name) {
            var hash = 0,
                i = 0,
                character;

            if (!name) {
                return null;
            }

            name = name.toString().toLowerCase();

            if (Array.prototype.reduce) {
                return name.split('').reduce(function(a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
            }

            if (name.length === 0) {
                return hash;
            }

            for (i = 0; i < name.length; i++) {
                character = name.charCodeAt(i);
                hash = ((hash << 5) - hash) + character;
                hash = hash & hash;
            }
            return hash;
        };
    });

    beforeEach(function() {
        settings = require('./settings.json'),
        window.s = null;
        window.mockInstances = {};
        server.requests = [];
        window.mParticleAndroid = null;
        window.mParticle.isIOS = null;
        window.mParticle.useCookieStorage = false;
        mParticle.isDevelopmentMode = false;
        configureAdobeForwarderAndReInit('optional');
        mParticle.eCommerce.Cart.clear();
    });

    test('should initialize properly', function(done) {
        configureAdobeForwarderAndReInit('notallowed');
        expect(s_gi('testReportSuiteId')).toBeDefined();
        expect(s_gi('testReportSuiteId').visitor).toBeDefined();
        expect(s_gi('testReportSuiteId').visitor.orgId).toBe('abcde');
        expect(s_gi('testReportSuiteId').trackingServer).toBe('trackingServer.com');
        
        expect(window.s).toBeFalsy();
        expect(window.appMeasurement).toBeFalsy();

        configureAdobeForwarderAndReInit('notallowed', 'True');
        expect(s_gi('testReportSuiteId')).toBeDefined();
        expect(s_gi('testReportSuiteId').visitor).toBeDefined();
        expect(s_gi('testReportSuiteId').visitor.orgId).toBe('abcde');

        expect(window.s).toBeDefined();

        done();
    });

    test('should set the customerId properly', function(done) {
        var appMeasurementInstance = s_gi('testReportSuiteId');
        mParticle.Identity.login({ userIdentities: { customerid: '123' } }, function() { return; });
        expect(appMeasurementInstance.visitor.userId.customerid.id).toBe('123');
        
        mParticle.Identity.modify({userIdentities: {customerid: '234', email: 'test@gmail.com'}});
        expect(appMeasurementInstance.visitor.userId.customerid.id).toBe('234');
        expect(appMeasurementInstance.visitor.userId.email.id).toBe('test@gmail.com');

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'loggedOut'
            }));
        };

        mParticle.Identity.logout();
        expect(appMeasurementInstance.visitor.userId.customerid).toBeFalsy();
        expect(appMeasurementInstance.visitor.userId.email).toBeFalsy();

        done();
    });

    test('should set the timestamp when timestamp === \'optional\' or \'required\' and not set it when it is \'notallowed\'', function(done) {
        configureAdobeForwarderAndReInit('optional');
        var appMeasurementInstance = s_gi('testReportSuiteId');
        mParticle.logEvent('Button 1', EventType.Navigation);
        expect(appMeasurementInstance.timestamp).toBeDefined();

        appMeasurementInstance.timestamp = null;

        configureAdobeForwarderAndReInit('notallowed');

        mParticle.logEvent('Button 1', EventType.Navigation);
        expect(appMeasurementInstance.timestamp).toBeFalsy();

        configureAdobeForwarderAndReInit('required');

        mParticle.logEvent('Button 1', EventType.Navigation);
        expect(appMeasurementInstance.timestamp).toBeDefined();

        done();
    });

    test('should log page view', function(done) {
        var appMeasurementInstance = s_gi('testReportSuiteId');
        var contextDataMock = {};
        // have to add a setter because appMeasurement.contextData is set to {} after each event is logged now, which removes it from appMeasurement
        Object.defineProperty(
            appMeasurementInstance.contextData,
            'contextTestValue',
            {
                set: function(name) {
                    contextDataMock['contextTestValue'] = name;
                }
            }
        );
        mParticle.logPageView('log page view test', {color: 'green', gender: 'female', c1: 'c1testValue', linkName: 'test'});

        expect(appMeasurementInstance.pageName).toBe('log page view test');
        expect(appMeasurementInstance.eVar1).toBe('green');
        expect(appMeasurementInstance.prop2).toBe('female');
        expect(appMeasurementInstance.hier1).toBe('test');
        expect(contextDataMock.contextTestValue).toBe('c1testValue');
        expect(appMeasurementInstance.contextData).toStrictEqual({});
        expect(appMeasurementInstance.tCalled).toBe(true);
        expect(appMeasurementInstance.tlCalled).toBe(false);
        expect(appMeasurementInstance.clearVarsCalled).toBe(true);

        done();
    });

    test('should log page view with page name of custom flag if custom flag is passed in', function(done) {
        var customFlags = { 'Adobe.PageName': 'test page name' };

        mParticle.logPageView('log page view test', {}, customFlags);

        var appMeasurementInstance = s_gi('testReportSuiteId');
        expect(appMeasurementInstance.pageName).toBe('test page name');

        done();
    });

    test('should log an event when trying to log a mapped page view value', function(done) {
        var appMeasurementInstance = s_gi('testReportSuiteId');
        var contextDataMock = {};
        // have to add a setter because appMeasurement.contextData is set to {} after each event is logged now, which removes it from appMeasurement
        Object.defineProperty(appMeasurementInstance.contextData, 'contextTestValue', {
            set: function(name) {
                contextDataMock['contextTestValue'] = name;
            }
        });

        configureAdobeForwarderAndReInit('notallowed', 'True', 'True');
        window.document.title = 'test';
        mParticle.logPageView('Find Ticket', {color: 'green', gender: 'female', c1: 'c1testValue', linkName: 'test'});
        expect(appMeasurementInstance.pageName).toBe(window.document.title);
        expect(appMeasurementInstance.events).toBe('event1');
        expect(appMeasurementInstance.eVar1).toBe('green');
        expect(appMeasurementInstance.prop2).toBe('female');
        expect(appMeasurementInstance.hier1).toBe('test');
        expect(contextDataMock.contextTestValue).toBe('c1testValue');
        expect(appMeasurementInstance.contextData).toStrictEqual({});
        expect(appMeasurementInstance.tlCalled).toBe(true);
        expect(appMeasurementInstance.tCalled).toBe(false);
        expect(appMeasurementInstance.clearVarsCalled).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('eVar1') >= 0).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('prop2') >= 0).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('prop3') >= 0).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('hier1') >= 0).toBe(true);
        expect(
            appMeasurementInstance.linkTrackVars.indexOf('contextData.contextTestValue') >= 0
        ).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('events') >= 0).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('events') >= 0).toBe(true);

        done();
    });

    test('should log an event with pageName when enabledPageName is True', function(done) {
        configureAdobeForwarderAndReInit('optional', 'False', 'True');
        mParticle.logPageView('Find Ticket', {color: 'green', gender: 'female', c1: 'c1testValue', linkName: 'test'});

        var appMeasurementInstance = s_gi('testReportSuiteId');

        expect(appMeasurementInstance.linkTrackVars.indexOf('pageName') >= 0).toBe(true);

        done();
    });

    test('should log an event with a page name of custom flag if custom flag is provided', function(done) {
        var customFlags = { 'Adobe.PageName': 'test page name' };

        configureAdobeForwarderAndReInit('optional', 'False', 'True');
        mParticle.logPageView('Find Ticket', {color: 'green', gender: 'female', c1: 'c1testValue', linkName: 'test'}, customFlags);

        var appMeasurementInstance = s_gi('testReportSuiteId');

        expect(appMeasurementInstance.pageName).toBe('test page name');

        done();
    });

    test('should not log event that is not mapped', function(done) {
        mParticle.logEvent('blah', mParticle.EventType.Unknown, {color: 'green', gender: 'female', c1: 'c1testValue', linkName: 'test'});

        var appMeasurementInstance = s_gi('testReportSuiteId');
        expect(appMeasurementInstance.tlCalled).toBe(false);
        expect(appMeasurementInstance.tCalled).toBe(false);
        expect(appMeasurementInstance.pageName).toBeFalsy();
        expect(appMeasurementInstance.events).toBeFalsy();
        expect(appMeasurementInstance.eVar1).toBeFalsy();
        expect(appMeasurementInstance.prop2).toBeFalsy();
        expect(appMeasurementInstance.hier1).toBeFalsy();
        expect(Object.keys(appMeasurementInstance.contextData).length).toBe(0);
        expect(appMeasurementInstance.clearVarsCalled).toBe(false);

        expect(appMeasurementInstance.linkTrackVars).toBe('None');

        done();
    });

    test('should properly log linkName when custom flag is provided', function(done) {
        var customFlags = {'Adobe.LinkName': 'testLinkName'};
        mParticle.logEvent('Button 1', EventType.Navigation, {}, customFlags);

        var appMeasurementInstance = s_gi('testReportSuiteId');
        expect(appMeasurementInstance.tlCalled).toBe(true);

        expect(appMeasurementInstance.linkName).toBe(customFlags['Adobe.LinkName']);

        done();
    });

    test('should log pageName if custom flag is provided and enablePageName boolean is "True"', function(done) {
        configureAdobeForwarderAndReInit('optional', 'False', 'True');

        var customFlags = { 'Adobe.PageName': 'test page name' };
        mParticle.logEvent('Button 1', EventType.Navigation, {}, customFlags);

        var appMeasurementInstance = s_gi('testReportSuiteId');
        expect(appMeasurementInstance.tlCalled).toBe(true);

        expect(appMeasurementInstance.pageName).toBe(
            customFlags['Adobe.PageName']
        );

        done();
    });

    test('should not log pageName if custom flag is provided and enablePageName boolean is "False"', function(done) {
        configureAdobeForwarderAndReInit('optional', 'False', 'False');

        var customFlags = { 'Adobe.PageName': 'test page name' };
        mParticle.logEvent('Button 1', EventType.Navigation, {}, customFlags);

        var appMeasurementInstance = s_gi('testReportSuiteId');
        expect(appMeasurementInstance.tlCalled).toBe(true);

        expect(appMeasurementInstance.pageName).toBe(undefined);

        done();
    });

    test('should log a product purchase with proper events, product merchandising events, and produdt incrementor events', function(done) {
        var product1 = mParticle.eCommerce.createProduct('nokia', '1234', 123, 1, null, null, null, null, null, {PI1: 'bob', PI2: 'tim', PM1: 'sneakers', PM2: 'shirt'});
        var product2 = mParticle.eCommerce.createProduct('apple', '2345', 234, 2, null, null, null, null, null, {PI1: 'Jones', PM2: 'abc', availability: true});
        var ta = mParticle.eCommerce.createTransactionAttributes('tID123', 'aff1', 'coupon', 456, 10, 5);

        mParticle.eCommerce.logPurchase(ta, [product1, product2], true, {gender: 'male', color: 'blue', discount: 20});

        var appMeasurementInstance = s_gi('testReportSuiteId');
        expect(appMeasurementInstance.products).toBe(
            ';nokia;1234;1;123;event2=bob|event6=tim;eVar2=sneakers|eVar3=shirt,;apple;2345;2;234;event2=Jones;eVar3=abc'
        );
        expect(appMeasurementInstance.events).toBe('purchase,event7=20,event2,event6');
        expect(appMeasurementInstance.purchaseID).toBe('tID123');
        expect(appMeasurementInstance.prop2).toBe('male');
        expect(appMeasurementInstance.prop3).toBe('blue');
        expect(appMeasurementInstance.eVar1).toBe('blue');
        expect(appMeasurementInstance.tlCalled).toBe(true);
        expect(appMeasurementInstance.tCalled).toBe(false);
        expect(appMeasurementInstance.clearVarsCalled).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('events') >= 0).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('products') >= 0).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('prop2') >= 0).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('prop3') >= 0).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('eVar1') >= 0).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('transactionID') >= 0).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('purchaseID') >= 0).toBe(true);

        done();
    });

    test('should log a product purchase wih pageName when enabledPageName is True', function(done) {
        configureAdobeForwarderAndReInit('optional', 'True', 'True');

        var product1 = mParticle.eCommerce.createProduct('nokia', '1234', 123, 1, null, null, null, null, null, {PI1: 'bob', PI2: 'tim', PM1: 'sneakers', PM2: 'shirt'});
        var product2 = mParticle.eCommerce.createProduct('apple', '2345', 234, 2, null, null, null, null, null, {PI1: 'Jones', PM2: 'abc', availability: true});
        var ta = mParticle.eCommerce.createTransactionAttributes('tID123', 'aff1', 'coupon', 456, 10, 5);

        mParticle.eCommerce.logPurchase(ta, [product1, product2], true, {gender: 'male', color: 'blue', discount: 20});

        var appMeasurementInstance = s_gi('testReportSuiteId');
        expect(appMeasurementInstance.linkTrackVars.indexOf('pageName') >= 0).toBe(true);

        done();
    });

    test('should not log a product purchase wih pageName if there is a pageName but enabledPageName is false', function(done) {
        var customFlags = { 'Adobe.PageName': 'test page name' };

        configureAdobeForwarderAndReInit('optional', 'True', 'False');

        var product1 = mParticle.eCommerce.createProduct('nokia', '1234', 123, 1, null, null, null, null, null, {PI1: 'bob', PI2: 'tim', PM1: 'sneakers', PM2: 'shirt'});
        var product2 = mParticle.eCommerce.createProduct('apple', '2345', 234, 2, null, null, null, null, null, {PI1: 'Jones', PM2: 'abc', availability: true});
        var ta = mParticle.eCommerce.createTransactionAttributes('tID123', 'aff1', 'coupon', 456, 10, 5);

        mParticle.eCommerce.logPurchase(ta, [product1, product2], true, {gender: 'male', color: 'blue', discount: 20}, customFlags);

        var appMeasurementInstance = s_gi('testReportSuiteId');
        expect(appMeasurementInstance.pageName).toBe(undefined);

        done();
    });

    test('should log a commerce event with LinkName when custom flag is provided', function(done) {
        var customFlags = { 'Adobe.LinkName': 'testLinkName' };
        configureAdobeForwarderAndReInit('optional', 'True', 'True');

        var product1 = mParticle.eCommerce.createProduct('nokia', '1234', 123, 1, null, null, null, null, null, {PI1: 'bob', PI2: 'tim', PM1: 'sneakers', PM2: 'shirt'});
        var product2 = mParticle.eCommerce.createProduct('apple', '2345', 234, 2, null, null, null, null, null, {PI1: 'Jones', PM2: 'abc', availability: true});
        var ta = mParticle.eCommerce.createTransactionAttributes('tID123', 'aff1', 'coupon', 456, 10, 5);

        mParticle.eCommerce.logPurchase(ta, [product1, product2], true, {gender: 'male', color: 'blue', discount: 20}, customFlags);

        var appMeasurementInstance = s_gi('testReportSuiteId');
        expect(appMeasurementInstance.linkName).toBe(customFlags['Adobe.LinkName']);

        done();
    });

    test('should log a commerce event with a specified PageName is custom flag is provided', function(done) {
        var customFlags = { 'Adobe.PageName': 'test page name' };
        configureAdobeForwarderAndReInit('optional', 'True', 'True');

        var product1 = mParticle.eCommerce.createProduct('nokia', '1234', 123, 1, null, null, null, null, null, {PI1: 'bob', PI2: 'tim', PM1: 'sneakers', PM2: 'shirt'});
        var product2 = mParticle.eCommerce.createProduct('apple', '2345', 234, 2, null, null, null, null, null, {PI1: 'Jones', PM2: 'abc', availability: true});
        var ta = mParticle.eCommerce.createTransactionAttributes('tID123', 'aff1', 'coupon', 456, 10, 5);

        mParticle.eCommerce.logPurchase(ta, [product1, product2], true, {gender: 'male', color: 'blue', discount: 20}, customFlags);

        var appMeasurementInstance = s_gi('testReportSuiteId');
        expect(appMeasurementInstance.pageName).toBe(customFlags['Adobe.PageName']);

        done();
    });

    test('should not log a commerce event with a specified PageName is custom flag is provided but enablePageName is false', function(done) {
        var customFlags = { 'Adobe.PageName': 'test page name' };
        configureAdobeForwarderAndReInit('optional', 'True', 'False');

        var product1 = mParticle.eCommerce.createProduct('nokia', '1234', 123, 1, null, null, null, null, null, {PI1: 'bob', PI2: 'tim', PM1: 'sneakers', PM2: 'shirt'});
        var product2 = mParticle.eCommerce.createProduct('apple', '2345', 234, 2, null, null, null, null, null, {PI1: 'Jones', PM2: 'abc', availability: true});
        var ta = mParticle.eCommerce.createTransactionAttributes('tID123', 'aff1', 'coupon', 456, 10, 5);

        mParticle.eCommerce.logPurchase(ta, [product1, product2], true, {gender: 'male', color: 'blue', discount: 20}, customFlags);

        var appMeasurementInstance = s_gi('testReportSuiteId');
        expect(appMeasurementInstance.pageName).toBe(undefined);

        done();
    });

    test('should log a commerce event the curent page name if no custom flag is provided', function(done) {
        configureAdobeForwarderAndReInit('optional', 'True', 'True');

        var product1 = mParticle.eCommerce.createProduct('nokia', '1234', 123, 1, null, null, null, null, null, {PI1: 'bob', PI2: 'tim', PM1: 'sneakers', PM2: 'shirt'});
        var product2 = mParticle.eCommerce.createProduct('apple', '2345', 234, 2, null, null, null, null, null, {PI1: 'Jones', PM2: 'abc', availability: true});
        var ta = mParticle.eCommerce.createTransactionAttributes('tID123', 'aff1', 'coupon', 456, 10, 5);

        // in a jest testing environment, there is not title, so we will set one
        window.document.title = 'test';
        mParticle.eCommerce.logPurchase(ta, [product1, product2], true, {gender: 'male', color: 'blue', discount: 20});

        var appMeasurementInstance = s_gi('testReportSuiteId');

        expect(appMeasurementInstance.pageName).toBe(window.document.title);

        done();
    });

    test('should log a product add to cart', function(done) {
        var product1 = mParticle.eCommerce.createProduct('nokia', '1234', 123, 1, null, null, null, null, null, {PI1: 'bob', PI2: 'tim', PM1: 'sneakers', PM2: 'shirt'});
        var product2 = mParticle.eCommerce.createProduct('apple', '2345', 234, 2, null, null, null, null, null, {PI1: 'Jones', PM2: 'abc', availability: true});
        mParticle.eCommerce.Cart.add([product1, product2], true);

        var appMeasurementInstance = s_gi('testReportSuiteId');
        expect(appMeasurementInstance.products).toBe(
            ';nokia;1234;1;123;event2=bob|event6=tim;eVar2=sneakers|eVar3=shirt,;apple;2345;2;234;event2=Jones;eVar3=abc'
        );
        expect(appMeasurementInstance.events).toBe('scAdd,event2,event6');
        expect(appMeasurementInstance.tlCalled).toBe(true);
        expect(appMeasurementInstance.tCalled).toBe(false);
        expect(appMeasurementInstance.clearVarsCalled).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('events') >= 0).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('products') >= 0).toBe(true);

        done();
    });

    test('should log a product remove from cart', function(done) {
        var product1 = mParticle.eCommerce.createProduct('nokia', '1234', 123, 1, null, null, null, null, null, {PI1: 'bob', PI2: 'tim', PM1: 'sneakers', PM2: 'shirt'});
        var product2 = mParticle.eCommerce.createProduct('apple', '2345', 234, 2, null, null, null, null, null, {PI1: 'Jones', PM2: 'abc', availability: true});
        mParticle.eCommerce.Cart.add([product1, product2], true);

        mParticle.eCommerce.Cart.remove(product1, true);

        var appMeasurementInstance = s_gi('testReportSuiteId');
        expect(appMeasurementInstance.products).toBe(';nokia;1234;1;123;event2=bob|event6=tim;eVar2=sneakers|eVar3=shirt');
        expect(appMeasurementInstance.events).toBe('scRemove,event2,event6');
        expect(appMeasurementInstance.tlCalled).toBe(true);
        expect(appMeasurementInstance.tCalled).toBe(false);
        expect(appMeasurementInstance.clearVarsCalled).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('events') >= 0).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('products') >= 0).toBe(true);

        done();
    });

    test('should log a product view', function(done) {
        var product1 = mParticle.eCommerce.createProduct('nokia', '1234', 123, 1, null, null, null, null, null, {PI1: 'bob', PI2: 'tim', PM1: 'sneakers', PM2: 'shirt'});
        mParticle.eCommerce.logProductAction(ProductActionType.ViewDetail, product1, {gender: 'male', color: 'blue'});

        var appMeasurementInstance = s_gi('testReportSuiteId');
        expect(appMeasurementInstance.products).toBe(';nokia;1234;1;123;event2=bob|event6=tim;eVar2=sneakers|eVar3=shirt');
        expect(appMeasurementInstance.events).toBe('prodView,event2,event6');
        expect(appMeasurementInstance.prop2).toBe('male');
        expect(appMeasurementInstance.prop3).toBe('blue');
        expect(appMeasurementInstance.eVar1).toBe('blue');
        expect(appMeasurementInstance.tlCalled).toBe(true);
        expect(appMeasurementInstance.tCalled).toBe(false);
        expect(appMeasurementInstance.clearVarsCalled).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('events') >= 0).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('products') >= 0).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('prop2') >= 0).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('prop3') >= 0).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('eVar1') >= 0).toBe(true);

        done();
    });

    test('should log a product checkout', function(done) {
        mParticle.eCommerce.logCheckout(1, {}, {gender: 'male', color: 'blue'});

        var appMeasurementInstance = s_gi('testReportSuiteId');
        expect(appMeasurementInstance.events).toBe('scCheckout');
        expect(appMeasurementInstance.prop2).toBe('male');
        expect(appMeasurementInstance.prop3).toBe('blue');
        expect(appMeasurementInstance.eVar1).toBe('blue');
        expect(appMeasurementInstance.tlCalled).toBe(true);
        expect(appMeasurementInstance.tCalled).toBe(false);
        expect(appMeasurementInstance.clearVarsCalled).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('events') >= 0).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('products') >= 0).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('prop2') >= 0).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('prop3') >= 0).toBe(true);
        expect(appMeasurementInstance.linkTrackVars.indexOf('eVar1') >= 0).toBe(true);

        done();
    });

    test('should call setIntegrationAttribute properly', function(done) {
        expect(mParticle.getIntegrationAttributes(124).mid).toBe('MCID test');
        expect(mParticle._getIntegrationDelays()[124]).toBe(false);

        done();
    });

    test('should call heartbeat play', function(done) {
        settings.mediaTrackingServer = 'test';
        configureAdobeForwarderAndReInit('optional', 'True', 'True');
        mParticle.logBaseEvent({ name: 'play event', messageType: 20, eventType: 23 });
        expect(window.trackPlayCalled).toBe(true);

        done();
    });

    test('should initialize with a custom audience manager server if', function(done) {
        var customDemDex = 'custom.demdex.net';
        configureAdobeForwarderAndReInit(
            'optional',
            'True',
            'True',
            customDemDex
        );
        expect(Visitor.options.audienceManagerServer).toBe(customDemDex);

        done();
    });
});
