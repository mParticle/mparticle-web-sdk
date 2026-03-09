/* eslint-disable no-undef*/
describe('DoubleClick', function () {
    // -------------------DO NOT EDIT ANYTHING BELOW THIS LINE-----------------------
    var MessageTypes = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            AppStateTransition: 10,
            Profile: 14,
            Commerce: 16,
        },
        EventType = {
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
            getName: function () {
                return 'blahblah';
            },
        },
        CommerceEventType = {
            ProductAddToCart: 10,
            ProductRemoveFromCart: 11,
            ProductCheckout: 12,
            ProductCheckoutOption: 13,
            ProductClick: 14,
            ProductViewDetail: 15,
            ProductPurchase: 16,
            ProductRefund: 17,
            PromotionView: 18,
            PromotionClick: 19,
            ProductAddToWishlist: 20,
            ProductRemoveFromWishlist: 21,
            ProductImpression: 22
        },
        ReportingService = function () {
            var self = this;

            this.id = null;
            this.event = null;

            this.cb = function (forwarder, event) {
                self.id = forwarder.id;
                self.event = event;
            };

            this.reset = function () {
                this.id = null;
                this.event = null;
            };
        },
        reportService = new ReportingService();

    // -------------------DO NOT EDIT ANYTHING ABOVE THIS LINE-----------------------
    // -------------------START EDITING BELOW:-----------------------
    // -------------------mParticle stubs - Add any additional stubbing to our methods as needed-----------------------
    mParticle.Identity = {
        getCurrentUser: function () {
            return {
                getMPID: function () {
                    return '123';
                },
                getAllUserAttributes: function () {
                    return {};
                },
                getUserIdentities: function () {
                    return {
                        userIdentities: {
                            customerid: 'abc',
                        },
                    };
                },
                getConsentState: function () {
                    return {
                        getGDPRConsentState: function () {
                            return {
                                some_consent: {
                                    Consented: false,
                                    Timestamp: 1,
                                    Document: 'some_consent',
                                },
                                test_consent: {
                                    Consented: false,
                                    Timestamp: 1,
                                    Document: 'test_consent',
                                },
                            };
                        },
                    };
                },
            };
        },
    };

    // -------------------DO NOT EDIT ANYTHING ABOVE THIS LINE-----------------------
    // -------------------START EDITING BELOW:-----------------------
    var DoubleClickMockForwarder = function () {
        var self = this;

        this.trackCustomEventCalled = false;
        this.logPurchaseEventCalled = false;
        this.initializeCalled = false;

        this.trackCustomName = null;
        this.logPurchaseName = null;
        this.apiKey = null;
        this.appId = null;
        this.userId = null;
        this.userAttributes = {};
        this.userIdField = null;

        this.eventProperties = [];
        this.purchaseEventProperties = [];

        // stub your different methods to ensure they are being called properly
        this.initialize = function(appId, apiKey) {
            self.initializeCalled = true;
            self.apiKey = apiKey;
            self.appId = appId;
        };

        this.stubbedUserAttributeSettingMethod = function(userAttributes) {
            self.userId = id;
            userAttributes = userAttributes || {};
            if (Object.keys(userAttributes).length) {
                for (var key in userAttributes) {
                    if (userAttributes[key] === null) {
                        delete self.userAttributes[key];
                    }
                    else {
                        self.userAttributes[key] = userAttributes[key];
                    }
                }
            }
        };

        this.stubbedUserLoginMethod = function(id) {
            self.userId = id;
        };
    };

    before(function () {
        mParticle.init('test');
        mParticle.CommerceEventType = CommerceEventType;

        window.mParticle.isTestEnvironment = true;
    });

    beforeEach(function() {
        window.DoubleClickMockForwarder = new DoubleClickMockForwarder();
        // Include any specific settings that is required for initializing your SDK here
        var sdkSettings = {
            advertiserId: '123456',
            customVariables: '[{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Total Amount&quot;,&quot;maptype&quot;:&quot;EventAttributeClass.Name&quot;,&quot;value&quot;:&quot;u1&quot;},{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;color&quot;,&quot;maptype&quot;:&quot;EventAttributeClass.Name&quot;,&quot;value&quot;:&quot;u2&quot;}]',
            customParams: '[{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;product_id&quot;,&quot;maptype&quot;:&quot;EventAttributeClass.Name&quot;,&quot;value&quot;:&quot;dc_product_id&quot;},{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;category&quot;,&quot;maptype&quot;:&quot;EventAttributeClass.Name&quot;,&quot;value&quot;:&quot;dc_category&quot;}]',
            eventMapping: '[{&quot;jsmap&quot;:&quot;-1978027768&quot;,&quot;map&quot;:&quot;-1711833867978608722&quot;,&quot;maptype&quot;:&quot;EventClass.Id&quot;,&quot;value&quot;:&quot;group tag2;activity tag2&quot;},{&quot;jsmap&quot;:&quot;-1107730368&quot;,&quot;map&quot;:&quot;-3234618101041058100&quot;,&quot;maptype&quot;:&quot;EventClass.Id&quot;,&quot;value&quot;:&quot;group tag3;activity tag3&quot;},{&quot;jsmap&quot;:&quot;-1592184962&quot;,&quot;map&quot;:&quot;-4153695833896571372&quot;,&quot;maptype&quot;:&quot;EventClassDetails.Id&quot;,&quot;value&quot;:&quot;group tag4;activity tag4&quot;}]'
        };
        // You may require userAttributes or userIdentities to be passed into initialization
        var userAttributes = {
            color: 'green'
        };
        var userIdentities = [{
            Identity: 'customerId',
            Type: mParticle.IdentityType.CustomerId
        }, {
            Identity: 'email',
            Type: mParticle.IdentityType.Email
        }, {
            Identity: 'facebook',
            Type: mParticle.IdentityType.Facebook
        }];

        mParticle.forwarder.init(sdkSettings, reportService.cb, true, null, userAttributes, userIdentities);
    });

    it('should initialize properly', function(done) {
        window.dataLayer[0][0].should.equal('js');
        (typeof window.dataLayer[0][1]).should.equal('object');

        window.dataLayer[1][0].should.equal('allow_custom_scripts');
        window.dataLayer[1][1].should.equal(true);
        window.dataLayer[2][0].should.equal('config');
        window.dataLayer[2][1].should.equal('123456');

        window.dataLayer = [];
        mParticle.forwarder.process({
            EventDataType: MessageTypes.PageEvent,
            EventCategory: mParticle.EventType.Unknown,
            EventName: 'Test Event',
            CustomFlags: {
                'DoubleClick.Counter': 'unique'
            }
        });
        window.dataLayer[0][2].should.have.property('send_to', 'DC-123456/group tag2/activity tag2+unique');

        window.dataLayer = [];
        mParticle.forwarder.process({
            EventDataType: MessageTypes.PageEvent,
            EventCategory: mParticle.EventType.Unknown,
            EventName: 'Test Event',
            CustomFlags: {
                'DoubleClick.Counter': 'per_session'
            }
        });
        window.dataLayer[0][0].should.equal('event');
        window.dataLayer[0][1].should.equal('conversion');
        window.dataLayer[0][2].should.have.property('send_to', 'DC-123456/group tag2/activity tag2+per_session');

        done();
    });

    it('should log event that has the appropriate custom flags', function(done) {
        window.dataLayer = [];
        mParticle.forwarder.process({
            EventDataType: MessageTypes.PageEvent,
            EventCategory: mParticle.EventType.Unknown,
            EventName: 'Test Event',
            EventAttributes: {
                'Total Amount': 123,
                color: 'blue'
            },
            CustomFlags: {
                'DoubleClick.Counter': 'standard'
            }
        });
        window.dataLayer[0][0].should.equal('event');
        window.dataLayer[0][1].should.equal('conversion');
        window.dataLayer[0][2].should.have.property('u1', 123);
        window.dataLayer[0][2].should.have.property('u2', 'blue');
        window.dataLayer[0][2].should.have.property('send_to', 'DC-123456/group tag2/activity tag2+standard');

        window.dataLayer = [];
        mParticle.forwarder.process({
            EventDataType: MessageTypes.PageEvent,
            EventCategory: mParticle.EventType.Unknown,
            EventName: 'Test Event',
            CustomFlags: {
                'DoubleClick.Counter': 'unique'
            }
        });
        window.dataLayer[0][2].should.have.property('send_to', 'DC-123456/group tag2/activity tag2+unique');

        window.dataLayer = [];
        mParticle.forwarder.process({
            EventDataType: MessageTypes.PageEvent,
            EventCategory: mParticle.EventType.Unknown,
            EventName: 'Test Event',
            CustomFlags: {
                'DoubleClick.Counter': 'per_session'
            }
        });
        window.dataLayer[0][0].should.equal('event');
        window.dataLayer[0][1].should.equal('conversion');
        window.dataLayer[0][2].should.have.property('send_to', 'DC-123456/group tag2/activity tag2+per_session');

        done();
    });

    it('should not log an event that has no custom flag, or an incorrect custom flag', function(done) {
        window.dataLayer = [];

        mParticle.forwarder.process({
            EventDataType: MessageTypes.PageEvent,
            EventCategory: mParticle.EventType.Unknown,
            EventName: 'Test Event'
        });

        mParticle.forwarder.process({
            EventDataType: MessageTypes.PageEvent,
            EventCategory: mParticle.EventType.Unknown,
            EventName: 'Test Event',
            CustomFlags: {
                'DoubleClick.Counter': 'invalidCounter'
            }
        });

        window.dataLayer.length.should.equal(0);

        done();
    });

    it('should log a product purchase commerce event with custom flag of transactions', function(done) {
        window.dataLayer = [];

        mParticle.forwarder.process({
            EventName: 'eCommerce - Purchase',
            EventDataType: MessageTypes.Commerce,
            EventCategory: mParticle.CommerceEventType.ProductPurchase,
            ProductAction: {
                ProductActionType: mParticle.ProductActionType.Purchase,
                ProductList: [
                    {
                        Sku: '12345',
                        Name: 'iPhone 6',
                        Category: 'Phones',
                        Brand: 'iPhone',
                        Variant: '6',
                        Price: 400,
                        TotalAmount: 400,
                        CouponCode: 'coupon-code',
                        Quantity: 1
                    },
                    {
                        Sku: '12345',
                        Name: 'iPhone 6',
                        Category: 'Phones',
                        Brand: 'iPhone',
                        Variant: '6',
                        Price: 400,
                        TotalAmount: 400,
                        CouponCode: 'coupon-code',
                        Quantity: 1
                    }
                ],
                TransactionId: 'tid123',
                Affiliation: 'my-affiliation',
                TotalAmount: 850,
                TaxAmount: 40,
                ShippingAmount: 10,
                CouponCode: null
            },
            CustomFlags: {
                'DoubleClick.Counter': 'transactions'
            }
        });
        window.dataLayer[0][0].should.equal('event');
        window.dataLayer[0][1].should.equal('purchase');
        window.dataLayer[0][2].should.have.property('value', '850');
        window.dataLayer[0][2].should.have.property('transaction_id', 'tid123');
        window.dataLayer[0][2].should.not.have.property('quantity');

        done();
    });

    it('should log a product purchase commerce event with custom flag of items_sold', function(done) {
        window.dataLayer = [];

        mParticle.forwarder.process({
            EventName: 'eCommerce - Purchase',
            EventDataType: MessageTypes.Commerce,
            EventCategory: mParticle.CommerceEventType.ProductPurchase,
            ProductAction: {
                ProductActionType: mParticle.ProductActionType.Purchase,
                ProductList: [
                    {
                        Sku: '12345',
                        Name: 'iPhone 6',
                        Category: 'Phones',
                        Brand: 'iPhone',
                        Variant: '6',
                        Price: 400,
                        TotalAmount: 400,
                        CouponCode: 'coupon-code',
                        Quantity: 1
                    },
                    {
                        Sku: '12345',
                        Name: 'iPhone 6',
                        Category: 'Phones',
                        Brand: 'iPhone',
                        Variant: '6',
                        Price: 400,
                        TotalAmount: 400,
                        CouponCode: 'coupon-code',
                        Quantity: 1
                    }
                ],
                TransactionId: 'tid123',
                Affiliation: 'my-affiliation',
                TotalAmount: 850,
                TaxAmount: 40,
                ShippingAmount: 10,
                CouponCode: null
            },
            CustomFlags: {
                'DoubleClick.Counter': 'items_sold'
            }
        });
        window.dataLayer[0][0].should.equal('event');
        window.dataLayer[0][1].should.equal('purchase');
        window.dataLayer[0][2].should.have.property('value', '850');
        window.dataLayer[0][2].should.have.property('transaction_id', 'tid123');
        window.dataLayer[0][2].should.have.property('quantity', '2');

        done();
    });

    it('should not log an event that is not mapped', function(done) {
        window.dataLayer = [];
        var result = mParticle.forwarder.process({
            EventDataType: MessageTypes.PageEvent,
            EventCategory: mParticle.EventType.Unknown,
            EventName: 'abcdef',
            EventAttributes: {
                'Total Amount': 123,
                color: 'blue',
            },
            CustomFlags: {
                'DoubleClick.Counter': 'standard',
            },
        });

        result.should.equal(
            'Error logging event or event type not supported on forwarder DoubleclickDFP'
        );

        done();
    });

    it('should not log a product purchase commerce event without a custom flag or with an incorrect custom flag', function(done) {
        window.dataLayer = [];

        mParticle.forwarder.process({
            EventName: 'eCommerce - Purchase',
            EventDataType: MessageTypes.Commerce,
            EventCategory: mParticle.CommerceEventType.ProductPurchase,
            ProductAction: {
                ProductActionType: mParticle.ProductActionType.Purchase,
                ProductList: [
                    {
                        Sku: '12345',
                        Name: 'iPhone 6',
                        Category: 'Phones',
                        Brand: 'iPhone',
                        Variant: '6',
                        Price: 400,
                        TotalAmount: 400,
                        CouponCode: 'coupon-code',
                        Quantity: 1
                    },
                    {
                        Sku: '12345',
                        Name: 'iPhone 6',
                        Category: 'Phones',
                        Brand: 'iPhone',
                        Variant: '6',
                        Price: 400,
                        TotalAmount: 400,
                        CouponCode: 'coupon-code',
                        Quantity: 1
                    }
                ],
                TransactionId: 'tid123',
                Affiliation: 'my-affiliation',
                TotalAmount: 850,
                TaxAmount: 40,
                ShippingAmount: 10,
                CouponCode: null
            },
            CustomFlags: {
                'DoubleClick.Counter': 'invalidCounter'
            }
        });

        mParticle.forwarder.process({
            EventName: 'eCommerce - Purchase',
            EventDataType: MessageTypes.Commerce,
            EventCategory: mParticle.CommerceEventType.ProductPurchase,
            ProductAction: {
                ProductActionType: mParticle.ProductActionType.Purchase,
                ProductList: [
                    {
                        Sku: '12345',
                        Name: 'iPhone 6',
                        Category: 'Phones',
                        Brand: 'iPhone',
                        Variant: '6',
                        Price: 400,
                        TotalAmount: 400,
                        CouponCode: 'coupon-code',
                        Quantity: 1
                    },
                    {
                        Sku: '12345',
                        Name: 'iPhone 6',
                        Category: 'Phones',
                        Brand: 'iPhone',
                        Variant: '6',
                        Price: 400,
                        TotalAmount: 400,
                        CouponCode: 'coupon-code',
                        Quantity: 1
                    }
                ],
                TransactionId: 'tid123',
                Affiliation: 'my-affiliation',
                TotalAmount: 850,
                TaxAmount: 40,
                ShippingAmount: 10,
                CouponCode: null
            }
        });

        window.dataLayer.length.should.equal(0);

        done();
    });

    it('should log event with custom field mappings', function(done) {
        window.dataLayer = [];
        mParticle.forwarder.process({
            EventDataType: MessageTypes.PageEvent,
            EventCategory: mParticle.EventType.Unknown,
            EventName: 'Test Event',
            EventAttributes: {
                'product_id': '12345',
                'category': 'electronics',
                'Total Amount': 123,
                'color': 'blue'
            },
            CustomFlags: {
                'DoubleClick.Counter': 'standard'
            }
        });
        window.dataLayer[0][0].should.equal('event');
        window.dataLayer[0][1].should.equal('conversion');
        window.dataLayer[0][2].should.have.property('u1', 123);
        window.dataLayer[0][2].should.have.property('u2', 'blue');
        window.dataLayer[0][2].should.have.property('dc_custom_params');
        window.dataLayer[0][2].dc_custom_params.should.have.property('dc_product_id', '12345');
        window.dataLayer[0][2].dc_custom_params.should.have.property('dc_category', 'electronics');
        window.dataLayer[0][2].should.have.property('send_to', 'DC-123456/group tag2/activity tag2+standard');

        done();
    });

    describe('Consent State', function () {
        var consentMap = [
            {
                jsmap: null,
                map: 'Some_consent',
                maptype: 'ConsentPurposes',
                value: 'ad_user_data',
            },
            {
                jsmap: null,
                map: 'Storage_consent',
                maptype: 'ConsentPurposes',
                value: 'analytics_storage',
            },
            {
                jsmap: null,
                map: 'Other_test_consent',
                maptype: 'ConsentPurposes',
                value: 'ad_storage',
            },
            {
                jsmap: null,
                map: 'Test_consent',
                maptype: 'ConsentPurposes',
                value: 'ad_personalization',
            },
        ];

        beforeEach(function () {
            window.dataLayer = [];
        });

        it('should construct a Default Consent State Payload from Mappings', function (done) {
            mParticle.forwarder.init(
                {
                    conversionId: 'AW-123123123',
                    consentMappingWeb:
                        '[{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Some_consent&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;ad_user_data&quot;},{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Storage_consent&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;analytics_storage&quot;},{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Other_test_consent&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;ad_storage&quot;},{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Test_consent&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;ad_personalization&quot;}]',
                    eventMapping: '[]',
                    customVariables: '[]',
                    customParams: '[]',
                },
                reportService.cb,
                true
            );

            var expectedDataLayer = [
                'consent',
                'default',
                {
                    ad_user_data: 'denied',
                    ad_personalization: 'denied',
                },
            ];

            // Initial elements of Data Layer are setup for gtag.
            // Consent state should be on the bottom
            window.dataLayer.length.should.eql(4);
            window.dataLayer[3][0].should.equal('consent');
            window.dataLayer[3][1].should.equal('default');
            window.dataLayer[3][2].should.deepEqual(expectedDataLayer[2]);
            done();
        });

        it('should construct a Default Consent State Payload from Default Settings and construct an Update Consent State Payload from Mappings', (done) => {
            mParticle.forwarder.init(
                {
                    conversionId: 'AW-123123123',
                    enableGtag: 'True',
                    consentMappingWeb: JSON.stringify(consentMap),
                    defaultAdUserDataConsent: 'Granted', // Will be overriden by User Consent State
                    defaultAdPersonalizationConsent: 'Granted', // Will be overriden by User Consent State
                    defaultAdStorageConsentWeb: 'Granted',
                    defaultAnalyticsStorageConsentWeb: 'Granted',
                    eventMapping: '[]',
                    customVariables: '[]',
                    customParams: '[]',
                },
                reportService.cb,
                true
            );

            var expectedDataLayer1 = [
                'consent',
                'default',
                {
                    ad_personalization: 'granted', // From Consent Settings
                    ad_user_data: 'granted', // From Consent Settings
                    ad_storage: 'granted', // From Consent Settings
                    analytics_storage: 'granted', // From Consent Settings
                },
            ];

            var expectedDataLayer2 = [
                'consent',
                'update',
                {
                    ad_personalization: 'denied', // From User Consent State
                    ad_user_data: 'denied', // From User Consent State
                    ad_storage: 'granted', // From Consent Settings
                    analytics_storage: 'granted', // From Consent Settings
                },
            ];

            // Initial elements of Data Layer are setup for gtag.
            // Consent state should be on the bottom
            window.dataLayer.length.should.eql(5);
            window.dataLayer[3][0].should.equal('consent');
            window.dataLayer[3][1].should.equal('default');
            window.dataLayer[3][2].should.deepEqual(expectedDataLayer1[2]);
            window.dataLayer[4][0].should.equal('consent');
            window.dataLayer[4][1].should.equal('update');
            window.dataLayer[4][2].should.deepEqual(expectedDataLayer2[2]);

            done();
        });

        it('should ignore Unspecified Consent Settings if NOT explicitely defined in Consent State', (done) => {
            mParticle.forwarder.init(
                {
                    conversionId: 'AW-123123123',
                    enableGtag: 'True',
                    consentMappingWeb: JSON.stringify(consentMap),
                    defaultAdUserDataConsent: 'Unspecified',
                    defaultAdPersonalizationConsent: 'Unspecified', // Will be overriden by User Consent State
                    defaultAdStorageConsentWeb: 'Unspecified', // Will be overriden by User Consent State
                    defaultAnalyticsStorageConsentWeb: 'Unspecified',
                    eventMapping: '[]',
                    customVariables: '[]',
                    customParams: '[]',
                },
                reportService.cb,
                true
            );

            var expectedDataLayer = [
                'consent',
                'default',
                {
                    ad_personalization: 'denied', // From User Consent State
                    ad_user_data: 'denied', // From User Consent State
                },
            ];

            // Initial elements of Data Layer are setup for gtag.
            // Consent state should be on the bottom
            window.dataLayer.length.should.eql(4);
            window.dataLayer[3][0].should.equal('consent');
            window.dataLayer[3][1].should.equal('default');
            window.dataLayer[3][2].should.deepEqual(expectedDataLayer[2]);

            done();
        });

        it('should construct a Consent State Update Payload when consent changes', (done) => {
            mParticle.forwarder.init(
                {
                    conversionId: 'AW-123123123',
                    enableGtag: 'True',
                    consentMappingWeb: JSON.stringify(consentMap),
                    eventMapping: '[]',
                    customVariables: '[]',
                    customParams: '[]',
                },
                reportService.cb,
                true
            );

            var expectedDataLayerBefore = [
                'consent',
                'update',
                {
                    ad_user_data: 'denied',
                    ad_personalization: 'denied',
                },
            ];

            // Initial elements of Data Layer are setup for gtag.
            // Consent state should be on the bottom
            window.dataLayer.length.should.eql(4);
            window.dataLayer[3][0].should.equal('consent');
            window.dataLayer[3][1].should.equal('default');
            window.dataLayer[3][2].should.deepEqual(expectedDataLayerBefore[2]);

            mParticle.forwarder.process({
                EventName: 'Test Event',
                EventDataType: MessageTypes.PageEvent,
                EventCategory: mParticle.EventType.Unknown,
                EventAttributes: {},
                ConsentState: {
                    getGDPRConsentState: function () {
                        return {
                            some_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'some_consent',
                            },
                            ignored_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'ignored_consent',
                            },
                            test_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'test_consent',
                            },
                        };
                    },

                    getCCPAConsentState: function () {
                        return {
                            data_sale_opt_out: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'some_consent',
                            },
                        };
                    },
                },
            });

            var expectedDataLayerAfter = [
                'consent',
                'update',
                {
                    ad_user_data: 'granted',
                    ad_personalization: 'granted',
                },
            ];

            // Initial elements of Data Layer are setup for gtag.
            // Consent Default is index 3
            // Consent Update is index 4
            window.dataLayer.length.should.eql(5);
            window.dataLayer[4][0].should.equal('consent');
            window.dataLayer[4][1].should.equal('update');
            window.dataLayer[4][2].should.deepEqual(expectedDataLayerAfter[2]);

            mParticle.forwarder.process({
                EventName: 'Test Event',
                EventDataType: MessageTypes.PageEvent,
                EventCategory: mParticle.EventType.Unknown,
                EventAttributes: {
                    showcase: 'something',
                    test: 'thisoneshouldgetmapped',
                    mp: 'rock',
                },
                CustomFlags: {
                    'DoubleClick.Counter': 'per_session',
                },
                ConsentState: {
                    getGDPRConsentState: function () {
                        return {
                            some_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'some_consent',
                            },
                            ignored_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'ignored_consent',
                            },
                            test_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'test_consent',
                            },
                            other_test_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'other_test_consent',
                            },
                            storage_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'storage_consent',
                            },
                        };
                    },

                    getCCPAConsentState: function () {
                        return {
                            data_sale_opt_out: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'data_sale_opt_out',
                            },
                        };
                    },
                },
            });

            var expectedDataLayerFinal = [
                'consent',
                'update',
                {
                    ad_personalization: 'granted',
                    ad_storage: 'granted',
                    ad_user_data: 'granted',
                    analytics_storage: 'denied',
                },
            ];

            // Initial elements of Data Layer are setup for gtag.
            // Consent Default is index 3
            // Consent Update is index 4
            // Consent Update #2 is index 5
            window.dataLayer.length.should.eql(6);
            window.dataLayer[5][0].should.equal('consent');
            window.dataLayer[5][1].should.equal('update');
            window.dataLayer[5][2].should.deepEqual(expectedDataLayerFinal[2]);

            done();
        });

        it('should construct a Consent State Update Payload with Consent Setting Defaults when consent changes', (done) => {
            mParticle.forwarder.init(
                {
                    conversionId: 'AW-123123123',
                    enableGtag: 'True',
                    consentMappingWeb: JSON.stringify(consentMap),
                    defaultAdUserDataConsent: 'Granted', // Will be overriden by User Consent State
                    defaultAdPersonalizationConsent: 'Granted', // Will be overriden by User Consent State
                    defaultAdStorageConsentWeb: 'Granted',
                    defaultAnalyticsStorageConsentWeb: 'Granted',
                    eventMapping: '[]',
                    customVariables: '[]',
                    customParams: '[]',
                },
                reportService.cb,
                true
            );

            var expectedDataLayerBefore1 = [
                'consent',
                'default',
                {
                    ad_personalization: 'granted', // From Consent Settings
                    ad_user_data: 'granted', // From Consent Settings
                    ad_storage: 'granted', // From Consent Settings
                    analytics_storage: 'granted', // From Consent Settings
                },
            ];

            var expectedDataLayerBefore2 = [
                'consent',
                'update',
                {
                    ad_personalization: 'denied', // From User Consent State
                    ad_user_data: 'denied', // From User Consent State
                    ad_storage: 'granted', // From Consent Settings
                    analytics_storage: 'granted', // From Consent Settings
                },
            ];

            // Initial elements of Data Layer are setup for gtag.
            // Default Consent payload from default settings should be index 3
            // Update Consent payload from mappings should be on the bottom (index 4)
            window.dataLayer.length.should.eql(5);
            window.dataLayer[3][0].should.equal('consent');
            window.dataLayer[3][1].should.equal('default');
            window.dataLayer[3][2].should.deepEqual(expectedDataLayerBefore1[2]);
            window.dataLayer[4][0].should.equal('consent');
            window.dataLayer[4][1].should.equal('update');
            window.dataLayer[4][2].should.deepEqual(expectedDataLayerBefore2[2]);

            mParticle.forwarder.process({
                EventName: 'Test Event',
                EventDataType: MessageTypes.PageEvent,
                EventCategory: mParticle.EventType.Unknown,
                EventAttributes: {},
                ConsentState: {
                    getGDPRConsentState: function () {
                        return {
                            some_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'some_consent',
                            },
                            ignored_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'ignored_consent',
                            },
                            test_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'test_consent',
                            },
                        };
                    },

                    getCCPAConsentState: function () {
                        return {
                            data_sale_opt_out: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'data_sale_opt_out',
                            },
                        };
                    },
                },
            });

            var expectedDataLayerAfter = [
                'consent',
                'update',
                {
                    ad_personalization: 'granted', // From Event Consent State Change
                    ad_user_data: 'granted', // From Event Consent State Change
                    ad_storage: 'granted', // From Consent Settings
                    analytics_storage: 'granted', // From Consent Settings
                },
            ];

            // Initial elements of Data Layer are setup for gtag.
            // Consent Default is index 3
            // Initial Consent Update from mappings is index 4
            // Consent Update #2 is index 5
            window.dataLayer.length.should.eql(6);
            window.dataLayer[5][0].should.equal('consent');
            window.dataLayer[5][1].should.equal('update');
            window.dataLayer[5][2].should.deepEqual(expectedDataLayerAfter[2]);

            mParticle.forwarder.process({
                EventName: 'Test Event',
                EventDataType: MessageTypes.PageEvent,
                EventCategory: mParticle.EventType.Unknown,
                EventAttributes: {
                    showcase: 'something',
                    test: 'thisoneshouldgetmapped',
                    mp: 'rock',
                },
                CustomFlags: {
                    'DoubleClick.Counter': 'per_session',
                },
                ConsentState: {
                    getGDPRConsentState: function () {
                        return {
                            some_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'some_consent',
                            },
                            ignored_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'ignored_consent',
                            },
                            test_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'test_consent',
                            },
                            other_test_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'other_test_consent',
                            },
                            storage_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'storage_consent',
                            },
                        };
                    },

                    getCCPAConsentState: function () {
                        return {
                            data_sale_opt_out: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'data_sale_opt_out',
                            },
                        };
                    },
                },
            });

            var expectedDataLayerFinal = [
                'consent',
                'update',
                {
                    ad_personalization: 'granted', // From Previous Event State Change
                    ad_storage: 'granted', // From Previous Event State Change
                    ad_user_data: 'granted', // From Consent Settings
                    analytics_storage: 'denied', // From FinalEvent Consent State Change
                },
            ];
            // Initial elements of Data Layer are setup for gtag.
            // Consent Default is index 3
            // Initial Consent Update from mappings is index 4
            // Consent Update #2 is index 5
            // Consent Update #3 is index 6
            window.dataLayer.length.should.eql(7);
            window.dataLayer[6][0].should.equal('consent');
            window.dataLayer[6][1].should.equal('update');
            window.dataLayer[6][2].should.deepEqual(expectedDataLayerFinal[2]);
            done();
        });

        it('should NOT construct a Consent State Update Payload if consent DOES NOT change', (done) => {
            mParticle.forwarder.init(
                {
                    conversionId: 'AW-123123123',
                    enableGtag: 'True',
                    consentMappingWeb: JSON.stringify(consentMap),
                    eventMapping: '[]',
                    customVariables: '[]',
                    customParams: '[]',
                },
                reportService.cb,
                true
            );

            var expectedDataLayerBefore = [
                'consent',
                'update',
                {
                    ad_user_data: 'denied',
                    ad_personalization: 'denied',
                },
            ];

            // Initial elements of Data Layer are setup for gtag.
            // Consent state should be on the bottom
            window.dataLayer.length.should.eql(4);
            window.dataLayer[3][0].should.equal('consent');
            window.dataLayer[3][1].should.equal('default');
            window.dataLayer[3][2].should.deepEqual(expectedDataLayerBefore[2]);

            mParticle.forwarder.process({
                EventName: 'Homepage',
                EventDataType: MessageTypes.PageEvent,
                EventCategory: EventType.Navigation,
                EventAttributes: {
                    showcase: 'something',
                    test: 'thisoneshouldgetmapped',
                    mp: 'rock',
                },
                ConsentState: {
                    getGDPRConsentState: function () {
                        return {
                            some_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'some_consent',
                            },
                            test_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'test_consent',
                            },
                        };
                    },
                },
            });

            // There should be no additional consent update events
            window.dataLayer.length.should.eql(4);
            window.dataLayer[3][0].should.equal('consent');
            window.dataLayer[3][1].should.equal('default');
            window.dataLayer[3][2].should.deepEqual(expectedDataLayerBefore[2]);

            done();
        });

        it('should NOT construct any Consent State Payload if consent mappings and settings are undefined', (done) => {
            mParticle.forwarder.init(
                {
                    conversionId: 'AW-123123123',
                    enableGtag: 'True',
                    eventMapping: '[]',
                    customVariables: '[]',
                    customParams: '[]',
                },
                reportService.cb,
                true
            );

            // Initial elements of Data Layer are setup for gtag.
            // Consent state should be on the bottom
            window.dataLayer.length.should.eql(3);

            mParticle.forwarder.process({
                EventName: 'Homepage',
                EventDataType: MessageTypes.PageEvent,
                EventCategory: EventType.Navigation,
                EventAttributes: {
                    showcase: 'something',
                    test: 'thisoneshouldgetmapped',
                    mp: 'rock',
                },
                ConsentState: {
                    getGDPRConsentState: function () {
                        return {
                            some_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'some_consent',
                            },
                            ignored_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'ignored_consent',
                            },
                            test_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'test_consent',
                            },
                            other_test_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'other_test_consent',
                            },
                            storage_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'storage_consent',
                            },
                        };
                    },

                    getCCPAConsentState: function () {
                        return {
                            data_sale_opt_out: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'data_sale_opt_out',
                            },
                        };
                    },
                },
            });

            // There should be no additional consent update events
            // as the consent state is not mapped to any gtag consent settings
            window.dataLayer.length.should.eql(3);

            done();
        });

        it('should construct Consent State Payloads if consent mappings is undefined but settings defaults are defined', (done) => {
            mParticle.forwarder.init(
                {
                    conversionId: 'AW-123123123',
                    enableGtag: 'True',
                    defaultAdUserDataConsent: 'Granted',
                    defaultAdPersonalizationConsent: 'Denied',
                    defaultAdStorageConsentWeb: 'Granted',
                    defaultAnalyticsStorageConsentWeb: 'Denied',
                    eventMapping: '[]',
                    customVariables: '[]',
                    customParams: '[]',
                },
                reportService.cb,
                true
            );

            var expectedDataLayerBefore = [
                'consent',
                'default',
                {
                    ad_user_data: 'granted',
                    ad_personalization: 'denied',
                    ad_storage: 'granted',
                    analytics_storage: 'denied',
                },
            ];

            // Initial elements of Data Layer are setup for gtag.
            // Consent state should be on the bottom
            window.dataLayer.length.should.eql(4);
            window.dataLayer[3][0].should.equal('consent');
            window.dataLayer[3][1].should.equal('default');
            window.dataLayer[3][2].should.deepEqual(expectedDataLayerBefore[2]);

            mParticle.forwarder.process({
                EventName: 'Homepage',
                EventDataType: MessageTypes.PageEvent,
                EventCategory: EventType.Navigation,
                EventAttributes: {
                    showcase: 'something',
                    test: 'thisoneshouldgetmapped',
                    mp: 'rock',
                },
                ConsentState: {
                    getGDPRConsentState: function () {
                        return {
                            some_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'some_consent',
                            },
                            ignored_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'ignored_consent',
                            },
                            test_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'test_consent',
                            },
                        };
                    },

                    getCCPAConsentState: function () {
                        return {
                            data_sale_opt_out: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'data_sale_opt_out',
                            },
                        };
                    },
                },
            });

            // There should be no additional consent update events
            // as the consent state is not mapped to any gtag consent settings
            window.dataLayer.length.should.eql(4);
            window.dataLayer[3][0].should.equal('consent');
            window.dataLayer[3][1].should.equal('default');
            window.dataLayer[3][2].should.deepEqual(expectedDataLayerBefore[2]);

            done();
        });
    });

    describe('Parse Settings String', function () {
        it('should treat falsy settings as empty mappings', function (done) {
            mParticle.forwarder.init(
                {
                    advertiserId: '123456',
                    eventMapping: null,
                    customVariables: null,
                    customParams: null,
                },
                reportService.cb,
                true
            );

            window.dataLayer = [];

            const result = mParticle.forwarder.process({
                EventDataType: MessageTypes.PageEvent,
                EventCategory: mParticle.EventType.Unknown,
                EventName: 'Test Event',
                CustomFlags: { 'DoubleClick.Counter': 'standard' },
            });

            result.should.equal(
                'Error logging event or event type not supported on forwarder DoubleclickDFP'
            );
            window.dataLayer.length.should.equal(0);
            done();
        });

        it('should parse arrays with &quot', function (done) {
            mParticle.forwarder.init(
                {
                    advertiserId: '123456',
                    eventMapping:
                        '[{&quot;jsmap&quot;:&quot;-1978027768&quot;,&quot;map&quot;:&quot;x&quot;,&quot;maptype&quot;:&quot;EventClass.Id&quot;,&quot;value&quot;:&quot;g;a&quot;}]',
                    customVariables: '[]',
                    customParams: '[]',
                },
                reportService.cb,
                true
            );

            window.dataLayer = [];

            mParticle.forwarder.process({
                EventDataType: MessageTypes.PageEvent,
                EventCategory: mParticle.EventType.Unknown,
                EventName: 'Test Event',
                CustomFlags: { 'DoubleClick.Counter': 'standard' },
            });

            window.dataLayer[0][0].should.equal('event');
            window.dataLayer[0][1].should.equal('conversion');
            window.dataLayer[0][2].should.have.property(
                'send_to',
                'DC-123456/g/a+standard'
            );
            done();
        });
    });
});
