// If we are testing this in a browser runner, sinon is loaded via script tag
if (typeof require !== 'undefined') {
    var sinon = require('sinon');
}

/* eslint-disable no-undef*/
describe('Google Analytics 4 Event', function () {
    // -------------------DO NOT EDIT ANYTHING BELOW THIS LINE-----------------------
    var MessageType = {
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
            Unknown: 0,
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
            ProductImpression: 22,
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
            RemoveFromWishlist: 10,
        },
        PromotionActionType = {
            Unknown: 0,
            PromotionClick: 1,
            PromotionView: 2,
        },
        IdentityType = {
            Other: 0,
            CustomerId: 1,
            Facebook: 2,
            Twitter: 3,
            Google: 4,
            Microsoft: 5,
            Yahoo: 6,
            Email: 7,
            Alias: 8,
            FacebookCustomAudienceId: 9,
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
                                functionality_consent: {
                                    Consented: false,
                                    Timestamp: 1,
                                    Document: 'functionality_consent',
                                },
                                personalization_consent: {
                                    Consented: false,
                                    Timestamp: 1,
                                    Document: 'personalization_consent',
                                },
                                security_consent: {
                                    Consented: false,
                                    Timestamp: 1,
                                    Document: 'security_consent',
                                },
                            };
                        },
                    };
                },
            };
        },
    };
    // -------------------START EDITING BELOW:-----------------------
    var mockGA4EventForwarder = function () {
        var self = this;

        // create properties for each type of event you want tracked, see below for examples
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
        this.initialize = function (appId, apiKey) {
            self.initializeCalled = true;
            self.apiKey = apiKey;
            self.appId = appId;
        };

        this.stubbedTrackingMethod = function (name, eventProperties) {
            self.trackCustomEventCalled = true;
            self.trackCustomName = name;
            self.eventProperties.push(eventProperties);
            // Return true to indicate event should be reported
            return true;
        };

        this.stubbedUserAttributeSettingMethod = function (userAttributes) {
            self.userId = id;
            userAttributes = userAttributes || {};
            if (Object.keys(userAttributes).length) {
                for (var key in userAttributes) {
                    if (userAttributes[key] === null) {
                        delete self.userAttributes[key];
                    } else {
                        self.userAttributes[key] = userAttributes[key];
                    }
                }
            }
        };

        this.stubbedUserLoginMethod = function (id) {
            self.userId = id;
        };
    };

    var kitSettings = {
        clientKey: '123456',
        appId: 'abcde',
        externalUserIdentityType: 'customerId',
        measurementId: 'testMeasurementId',
    };

    describe('initialization', function () {
        it('should initialize gtag and the dataLayer', function (done) {
            (typeof window.gtag === 'undefined').should.be.true();
            (typeof window.dataLayer === 'undefined').should.be.true();
            window.mockGA4EventForwarder = new mockGA4EventForwarder();
            // Include any specific settings that is required for initializing your SDK here
            mParticle.forwarder.init(kitSettings, reportService.cb, true);

            window.gtag.should.be.ok();
            window.dataLayer.should.be.ok();

            done();
        });

        it('should initialize with a measurement id as `client_id`', function (done) {
            window.mockGA4EventForwarder = new mockGA4EventForwarder();
            mParticle.forwarder.init(kitSettings, reportService.cb, true);

            window.gtag.should.be.ok();
            window.dataLayer.should.be.ok();
            window.dataLayer[2][0].should.eql('get');
            window.dataLayer[2][1].should.eql('testMeasurementId');
            window.dataLayer[2][2].should.eql('client_id');

            done();
        });

        it('should set the measurement ID as an Integration Attribute', function (done) {
            var sandbox = sinon.createSandbox();
            var mPStub = sinon.stub(window.mParticle);

            // Kit init requires checking SDK version, which in turn requires
            // the SDK to be initialized. The actual version number is not
            // relevant to capturing measurment ID.
            mPStub.getVersion.returns('X.XX.X');

            window.mockGA4EventForwarder = new mockGA4EventForwarder();

            mParticle.forwarder.init(kitSettings, reportService.cb, true);

            // GTAG will normally trigger every callback in the DataLayer
            // asynchronously. However, since we are mocking GTAG within our tests,
            // we need to manually trigger the callback directly to verify that
            // mParticle.setIntegrationAttribute is eventually called with
            // clientID via GTAG.
            // The specific 'get' request is index 2, and the callback is
            // index 3. We are manually passing a string into the callback
            // as GTAG seems to hash the id internally.
            dataLayer[2][3]('test-client-id');

            // Verify that data later triggers setClientId
            mPStub.setIntegrationAttribute.calledWith(160, {
                client_id: 'test-client-id',
            });

            // Set Integration Delay should be called twice upon init
            // First, as true, then false after client ID is registered
            mPStub._setIntegrationDelay.getCall(0).calledWith(160, true);
            mPStub._setIntegrationDelay.getCall(1).calledWith(160, false);

            sandbox.restore();
            done();
        });
    });

    describe('forwarder mapping', function () {
        beforeEach(function () {
            window.dataLayer = [];
            window.mockGA4EventForwarder = new mockGA4EventForwarder();
            mParticle.forwarder.init(kitSettings, reportService.cb, true, null);
            window.gtag = function () {
                window.dataLayer.push(Array.prototype.slice.call(arguments));
            };
            window.dataLayer = [];
        });

        it('should set user attribute', function (done) {
            mParticle.forwarder.setUserAttribute('foo', 'bar');
            var result = ['set', 'user_properties', { foo: 'bar' }];
            window.dataLayer[0].should.eql(result);

            done();
        });

        it('should remove user attribute', function (done) {
            mParticle.forwarder.removeUserAttribute('bar');
            var result = ['set', 'user_properties', { bar: null }];
            window.dataLayer[0].should.eql(result);

            done();
        });

        describe('ecommerce mapping', function () {
            var result;
            beforeEach(function () {
                result = [
                    'event',
                    'event_type_to_be_updated',
                    {
                        currency: 'USD',
                        value: 100,
                        items: [
                            {
                                coupon: 'coupon',
                                item_brand: 'brand',
                                item_category: 'category',
                                item_id: 'iphoneSKU',
                                item_name: 'iphone',
                                item_variant: 'variant',
                                index: 1,
                                price: 999,
                                quantity: 1,
                                total_amount: 999,
                                eventMetric1: 'metric2',
                                journeyType: 'testjourneytype1',
                            },
                            {
                                eventMetric1: 'metric1',
                                journeyType: 'testjourneytype2',
                                coupon: 'coupon',
                                item_brand: 'brand',
                                item_category: 'category',
                                item_id: 'iphoneSKU',
                                item_name: 'iphone',
                                item_variant: 'variant',
                                index: 1,
                                price: 999,
                                quantity: 1,
                                total_amount: 999,
                            },
                        ],
                        send_to: 'testMeasurementId',
                    },
                ];

                window.dataLayer = [];
            });

            it('should map MP AddToCart commerce event to GA4 add_to_cart event', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test Purchase Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.ProductAddToCart,
                    CustomFlags: { 'GA4.Value': 100 },
                    ProductAction: {
                        ProductActionType: ProductActionType.AddToCart,
                        ProductList: [
                            {
                                Attributes: {
                                    eventMetric1: 'metric2',
                                    journeyType: 'testjourneytype1',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                            {
                                Attributes: {
                                    eventMetric1: 'metric1',
                                    journeyType: 'testjourneytype2',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                        ],
                        TaxAmount: 40,
                        ShippingAmount: 10,
                        CouponCode: 'coupon',
                    },
                });

                result[1] = 'add_to_cart';
                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should map MP RemoveFromCart commerce event to GA4 remove_from_cart event', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test Purchase Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.ProductRemoveFromCart,
                    CustomFlags: { 'GA4.Value': 100 },
                    ProductAction: {
                        ProductActionType: ProductActionType.RemoveFromCart,
                        ProductList: [
                            {
                                Attributes: {
                                    eventMetric1: 'metric2',
                                    journeyType: 'testjourneytype1',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                            {
                                Attributes: {
                                    eventMetric1: 'metric1',
                                    journeyType: 'testjourneytype2',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                        ],
                        TotalAmount: 450,
                        TaxAmount: 40,
                        ShippingAmount: 10,
                        CouponCode: 'couponCode',
                    },
                });

                result[1] = 'remove_from_cart';
                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should map MP Checkout commerce event to GA4 begin_checkout event', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test Purchase Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.ProductCheckout,
                    CustomFlags: { 'GA4.Value': 100 },
                    ProductAction: {
                        ProductActionType: ProductActionType.ProductCheckout,
                        ProductList: [
                            {
                                Attributes: {
                                    eventMetric1: 'metric2',
                                    journeyType: 'testjourneytype1',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                            {
                                Attributes: {
                                    eventMetric1: 'metric1',
                                    journeyType: 'testjourneytype2',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                        ],
                        TotalAmount: 450,
                        TaxAmount: 40,
                        ShippingAmount: 10,
                        CouponCode: 'couponCode',
                    },
                });

                result[1] = 'begin_checkout';
                result[2].coupon = 'couponCode';
                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should map MP Purchase commerce event to GA4 purchase event', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test Purchase Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.ProductPurchase,
                    ProductAction: {
                        ProductActionType: ProductActionType.ProductPurchase,
                        ProductList: [
                            {
                                Attributes: {
                                    eventMetric1: 'metric2',
                                    journeyType: 'testjourneytype1',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                            {
                                Attributes: {
                                    eventMetric1: 'metric1',
                                    journeyType: 'testjourneytype2',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                        ],
                        Affiliation: 'foo-affiliation-id',
                        TransactionId: 'foo-transaction-id',
                        TotalAmount: 450,
                        TaxAmount: 40,
                        ShippingAmount: 10,
                        CouponCode: 'couponCode',
                    },
                });

                result[1] = 'purchase';
                result[2].coupon = 'couponCode';
                result[2].transaction_id = 'foo-transaction-id';
                result[2].items[0].affiliation = 'foo-affiliation-id';
                result[2].items[1].affiliation = 'foo-affiliation-id';
                result[2].shipping = 10;
                result[2].tax = 40;
                result[2].value = 450;
                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should map MP Refund commerce event to GA4 refund event', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test Purchase Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.ProductRefund,
                    ProductAction: {
                        ProductActionType: ProductActionType.ProductRefund,
                        ProductList: [
                            {
                                Attributes: {
                                    eventMetric1: 'metric2',
                                    journeyType: 'testjourneytype1',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                            {
                                Attributes: {
                                    eventMetric1: 'metric1',
                                    journeyType: 'testjourneytype2',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                        ],
                        Affiliation: 'foo-affiliation-id',
                        TransactionId: 'foo-transaction-id',
                        TotalAmount: 450,
                        TaxAmount: 40,
                        ShippingAmount: 10,
                        CouponCode: 'couponCode',
                    },
                });

                result[1] = 'refund';
                result[2].coupon = 'couponCode';
                result[2].transaction_id = 'foo-transaction-id';
                result[2].items[0].affiliation = 'foo-affiliation-id';
                result[2].items[1].affiliation = 'foo-affiliation-id';
                result[2].shipping = 10;
                result[2].tax = 40;
                result[2].value = 450;
                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should map MP AddToWishlist commerce event to GA4 add_to_wishlist event', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test Purchase Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.ProductAddToWishlist,
                    ProductAction: {
                        ProductActionType: ProductActionType.AddToWishlist,
                        ProductList: [
                            {
                                Attributes: {
                                    eventMetric1: 'metric2',
                                    journeyType: 'testjourneytype1',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                            {
                                Attributes: {
                                    eventMetric1: 'metric1',
                                    journeyType: 'testjourneytype2',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                        ],
                        TotalAmount: 450,
                        TaxAmount: 40,
                        ShippingAmount: 10,
                        CouponCode: 'couponCode',
                    },
                });

                result[1] = 'add_to_wishlist';
                result[2].value = 450;
                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should map MP ViewDetail commerce event to GA4 view_item event', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test Purchase Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.ProductViewDetail,
                    CustomFlags: { 'GA4.Value': 100 },
                    ProductAction: {
                        ProductActionType: ProductActionType.ViewDetail,
                        ProductList: [
                            {
                                Attributes: {
                                    eventMetric1: 'metric2',
                                    journeyType: 'testjourneytype1',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                            {
                                Attributes: {
                                    eventMetric1: 'metric1',
                                    journeyType: 'testjourneytype2',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                        ],
                        TaxAmount: 40,
                        ShippingAmount: 10,
                        CouponCode: 'couponCode',
                    },
                });

                result[1] = 'view_item';
                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should map MP ProductImpression commerce event to GA4 view_item_list event', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test Purchase Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.ProductImpression,
                    ProductImpressions: [
                        {
                            // TODO: Does this map to the name or id of the impression?
                            ProductImpressionList: 'Related Products',
                            ProductList: [
                                {
                                    Attributes: {
                                        eventMetric1: 'metric2',
                                        journeyType: 'testjourneytype1',
                                    },
                                    Brand: 'brand',
                                    Category: 'category',
                                    CouponCode: 'coupon',
                                    Name: 'iphone',
                                    Position: 1,
                                    Price: 999,
                                    Quantity: 1,
                                    Sku: 'iphoneSKU',
                                    TotalAmount: 999,
                                    Variant: 'variant',
                                },
                                {
                                    Attributes: {
                                        eventMetric1: 'metric1',
                                        journeyType: 'testjourneytype2',
                                    },
                                    Brand: 'brand',
                                    Category: 'category',
                                    CouponCode: 'coupon',
                                    Name: 'iphone',
                                    Position: 1,
                                    Price: 999,
                                    Quantity: 1,
                                    Sku: 'iphoneSKU',
                                    TotalAmount: 999,
                                    Variant: 'variant',
                                },
                            ],
                            TaxAmount: 40,
                            ShippingAmount: 10,
                            CouponCode: 'couponCode',
                        },
                    ],
                });

                result = [
                    'event',
                    'view_item_list',
                    {
                        item_list_id: 'Related Products',
                        item_list_name: 'Related Products',
                        items: [
                            {
                                eventMetric1: 'metric2',
                                journeyType: 'testjourneytype1',
                                coupon: 'coupon',
                                item_brand: 'brand',
                                item_category: 'category',
                                item_id: 'iphoneSKU',
                                item_name: 'iphone',
                                item_variant: 'variant',
                                index: 1,
                                price: 999,
                                quantity: 1,
                                total_amount: 999,
                            },
                            {
                                eventMetric1: 'metric1',
                                journeyType: 'testjourneytype2',
                                coupon: 'coupon',
                                item_brand: 'brand',
                                item_category: 'category',
                                item_id: 'iphoneSKU',
                                item_name: 'iphone',
                                item_variant: 'variant',
                                index: 1,
                                price: 999,
                                quantity: 1,
                                total_amount: 999,
                            },
                        ],
                        send_to: 'testMeasurementId',
                    },
                ];

                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should map MP Click commerce event to GA4 select_item event', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test Purchase Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.ProductClick,
                    ProductAction: {
                        ProductActionType: ProductActionType.Click,
                        ProductList: [
                            {
                                Attributes: {
                                    eventMetric1: 'metric2',
                                    journeyType: 'testjourneytype1',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                            {
                                Attributes: {
                                    eventMetric1: 'metric1',
                                    journeyType: 'testjourneytype2',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                        ],
                        TotalAmount: 450,
                        TaxAmount: 40,
                        ShippingAmount: 10,
                        CouponCode: 'couponCode',
                    },
                });

                result[1] = 'select_item';
                // select items do not include currency of value, which is by default on the result
                delete result[2]['currency'];
                delete result[2]['value'];
                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should map MP PromotionView commerce event to GA4 view_promotion event', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test Promotion Action Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.PromotionView,
                    PromotionAction: {
                        PromotionActionType: PromotionActionType.PromotionView,
                        PromotionList: [
                            {
                                Id: 'P_12345',
                                Name: 'Summer Sale Banner',
                                Creative: 'Summer Sale',
                                Position: 'featured_app_1',
                            },
                            {
                                Id: 'P_78901',
                                Name: 'Winter Sale Banner',
                                Creative: 'Winter Sale',
                                Position: 'featured_app_2',
                            },
                        ],
                    },
                });

                var promotionResult1 = [
                    'event',
                    'view_promotion',
                    {
                        promotion_id: 'P_12345',
                        promotion_name: 'Summer Sale Banner',
                        creative_name: 'Summer Sale',
                        creative_slot: 'featured_app_1',
                        send_to: 'testMeasurementId',
                    },
                ];

                var promotionResult2 = [
                    'event',
                    'view_promotion',
                    {
                        promotion_id: 'P_78901',
                        promotion_name: 'Winter Sale Banner',
                        creative_name: 'Winter Sale',
                        creative_slot: 'featured_app_2',
                        send_to: 'testMeasurementId',
                    },
                ];
                window.dataLayer[0].should.eql(promotionResult1);
                window.dataLayer[1].should.eql(promotionResult2);

                done();
            });

            it('should map MP PromotionClick commerce event to GA4 select_promotion event', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test Purchase Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.PromotionClick,
                    PromotionAction: {
                        PromotionActionType: PromotionActionType.PromotionClick,
                        PromotionList: [
                            {
                                Id: 'P_12345',
                                Name: 'Summer Sale Banner',
                                Creative: 'Summer Sale',
                                Position: 'featured_app_1',
                            },
                            {
                                Id: 'P_78901',
                                Name: 'Winter Sale Banner',
                                Creative: 'Winter Sale',
                                Position: 'featured_app_2',
                            },
                        ],
                    },
                });

                var promotionResult1 = [
                    'event',
                    'select_promotion',
                    {
                        promotion_id: 'P_12345',
                        promotion_name: 'Summer Sale Banner',
                        creative_name: 'Summer Sale',
                        creative_slot: 'featured_app_1',
                        send_to: 'testMeasurementId',
                    },
                ];

                var promotionResult2 = [
                    'event',
                    'select_promotion',
                    {
                        promotion_id: 'P_78901',
                        promotion_name: 'Winter Sale Banner',
                        creative_name: 'Winter Sale',
                        creative_slot: 'featured_app_2',
                        send_to: 'testMeasurementId',
                    },
                ];

                window.dataLayer[0].should.eql(promotionResult1);
                window.dataLayer[1].should.eql(promotionResult2);

                done();
            });

            it('should map MP CheckoutOption commerce event with add_payment_info custom flag to GA4 add_payment_info event', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test add_payment_info Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.ProductCheckoutOption,
                    CustomFlags: {
                        'GA4.CommerceEventType': 'add_payment_info',
                        'GA4.PaymentType': 'credit-card',
                    },
                    ProductAction: {
                        ProductActionType: ProductActionType.Click,
                        ProductList: [
                            {
                                Attributes: {
                                    eventMetric1: 'metric2',
                                    journeyType: 'testjourneytype1',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                            {
                                Attributes: {
                                    eventMetric1: 'metric1',
                                    journeyType: 'testjourneytype2',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                        ],
                        TotalAmount: 450,
                        TaxAmount: 40,
                        ShippingAmount: 10,
                        CouponCode: 'couponCode',
                    },
                });

                result = [
                    'event',
                    'add_payment_info',
                    {
                        payment_type: 'credit-card',
                        coupon: 'couponCode',
                        items: [
                            {
                                eventMetric1: 'metric2',
                                journeyType: 'testjourneytype1',
                                coupon: 'coupon',
                                item_brand: 'brand',
                                item_category: 'category',
                                item_id: 'iphoneSKU',
                                item_name: 'iphone',
                                item_variant: 'variant',
                                index: 1,
                                price: 999,
                                quantity: 1,
                                total_amount: 999,
                            },
                            {
                                eventMetric1: 'metric1',
                                journeyType: 'testjourneytype2',
                                coupon: 'coupon',
                                item_brand: 'brand',
                                item_category: 'category',
                                item_id: 'iphoneSKU',
                                item_name: 'iphone',
                                item_variant: 'variant',
                                index: 1,
                                price: 999,
                                quantity: 1,
                                total_amount: 999,
                            },
                        ],
                        send_to: 'testMeasurementId',
                    },
                ];

                window.dataLayer[0].should.match(result);

                done();
            });

            it('should map MP CheckoutOption commerce event with add_shipping_info custom flag to GA4 add_shipping_info event', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test add_shipping_info Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.ProductCheckoutOption,
                    CustomFlags: {
                        'GA4.CommerceEventType': 'add_shipping_info',
                        'GA4.ShippingTier': 'ground',
                    },
                    ProductAction: {
                        ProductActionType: ProductActionType.Click,
                        ProductList: [
                            {
                                Attributes: {
                                    eventMetric1: 'metric2',
                                    journeyType: 'testjourneytype1',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                            {
                                Attributes: {
                                    eventMetric1: 'metric1',
                                    journeyType: 'testjourneytype2',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                        ],
                        TotalAmount: 450,
                        TaxAmount: 40,
                        ShippingAmount: 10,
                        CouponCode: 'couponCode',
                    },
                });

                result = [
                    'event',
                    'add_shipping_info',
                    {
                        shipping_tier: 'ground',
                        coupon: 'couponCode',
                        items: [
                            {
                                eventMetric1: 'metric2',
                                journeyType: 'testjourneytype1',
                                coupon: 'coupon',
                                item_brand: 'brand',
                                item_category: 'category',
                                item_id: 'iphoneSKU',
                                item_name: 'iphone',
                                item_variant: 'variant',
                                index: 1,
                                price: 999,
                                quantity: 1,
                                total_amount: 999,
                            },
                            {
                                eventMetric1: 'metric1',
                                journeyType: 'testjourneytype2',
                                coupon: 'coupon',
                                item_brand: 'brand',
                                item_category: 'category',
                                item_id: 'iphoneSKU',
                                item_name: 'iphone',
                                item_variant: 'variant',
                                index: 1,
                                price: 999,
                                quantity: 1,
                                total_amount: 999,
                            },
                        ],
                        send_to: 'testMeasurementId',
                    },
                ];

                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should log a `set_checkout_option` event if a CheckoutOption is sent without a custom flag for GA4.CommerceEventType', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test add_payment_info Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.ProductCheckoutOption,
                    EventAttributes: {
                        foo: 'bar',
                    },
                    CustomFlags: {},
                    ProductAction: {
                        ProductActionType: ProductActionType.Click,
                        ProductList: [],
                    },
                });

                result = [
                    'event',
                    'set_checkout_option',
                    {
                        items: [],
                        foo: 'bar',
                    },
                ];
                window.dataLayer.length.should.eql(1);

                done();
            });

            it('should log an event if a CheckoutOption is sent with GA4.CommerceEventType but without GA4.ShippingTier', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test add_payment_info Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.ProductCheckoutOption,
                    CustomFlags: {
                        'GA4.CommerceEventType': 'add_shipping_info',
                    },
                    ProductAction: {
                        ProductActionType: ProductActionType.Click,
                        ProductList: [],
                    },
                });

                result = [
                    'event',
                    'add_shipping_info',
                    {
                        shipping_tier: null,
                        coupon: null,
                        items: [],
                        send_to: 'testMeasurementId',
                    },
                ];
                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should log an event if a CheckoutOption is sent on with GA4.CommerceEventType but without GA4.PaymentType', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test add_payment_info Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.ProductCheckoutOption,
                    CustomFlags: {
                        'GA4.CommerceEventType': 'add_payment_info',
                    },
                    ProductAction: {
                        ProductActionType: ProductActionType.Click,
                        ProductList: [],
                    },
                });

                result = [
                    'event',
                    'add_payment_info',
                    {
                        payment_type: null,
                        coupon: null,
                        items: [],
                        send_to: 'testMeasurementId',
                    },
                ];
                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should include EventAttributes on GA4 add_shipping_info event when CheckoutOption has GA4.CommerceEventType add_shipping_info', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test add_shipping_info Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.ProductCheckoutOption,
                    EventAttributes: {
                        page_url: 'https://example.com/checkout',
                        page_path: '/checkout',
                        mpID: '123',
                        SessionID: 'session-abc',
                        foo: 'bar',
                    },
                    CustomFlags: {
                        'GA4.CommerceEventType': 'add_shipping_info',
                        'GA4.ShippingTier': 'ground',
                    },
                    ProductAction: {
                        ProductActionType: ProductActionType.Click,
                        ProductList: [],
                    },
                });

                result = [
                    'event',
                    'add_shipping_info',
                    {
                        shipping_tier: 'ground',
                        coupon: null,
                        items: [],
                        page_url: 'https://example.com/checkout',
                        page_path: '/checkout',
                        mpID: '123',
                        SessionID: 'session-abc',
                        foo: 'bar',
                        send_to: 'testMeasurementId',
                    },
                ];
                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should include EventAttributes on GA4 add_payment_info event when CheckoutOption has GA4.CommerceEventType add_payment_info', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test add_payment_info Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.ProductCheckoutOption,
                    EventAttributes: {
                        page_url: 'https://example.com/checkout',
                        page_path: '/checkout',
                        mpID: '123',
                        SessionID: 'session-abc',
                        foo: 'bar',
                    },
                    CustomFlags: {
                        'GA4.CommerceEventType': 'add_payment_info',
                        'GA4.PaymentType': 'credit-card',
                    },
                    ProductAction: {
                        ProductActionType: ProductActionType.Click,
                        ProductList: [],
                    },
                });

                result = [
                    'event',
                    'add_payment_info',
                    {
                        payment_type: 'credit-card',
                        coupon: null,
                        items: [],
                        page_url: 'https://example.com/checkout',
                        page_path: '/checkout',
                        mpID: '123',
                        SessionID: 'session-abc',
                        foo: 'bar',
                        send_to: 'testMeasurementId',
                    },
                ];
                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should log a view_cart event using ProductActionType.Unknown and a custom flag', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Unknown Test',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.Unknown,
                    CustomFlags: {
                        'GA4.CommerceEventType': 'view_cart',
                        'GA4.Value': 100,
                    },
                    ProductAction: {
                        ProductActionType: ProductActionType.Unknown,
                        ProductList: [
                            {
                                Attributes: {
                                    eventMetric1: 'metric2',
                                    journeyType: 'testjourneytype1',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                            {
                                Attributes: {
                                    eventMetric1: 'metric1',
                                    journeyType: 'testjourneytype2',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                        ],
                    },
                });

                result = [
                    'event',
                    'view_cart',
                    {
                        value: 100,
                        currency: 'USD',
                        items: [
                            {
                                eventMetric1: 'metric2',
                                journeyType: 'testjourneytype1',
                                coupon: 'coupon',
                                item_brand: 'brand',
                                item_category: 'category',
                                item_id: 'iphoneSKU',
                                item_name: 'iphone',
                                item_variant: 'variant',
                                index: 1,
                                price: 999,
                                quantity: 1,
                                total_amount: 999,
                            },
                            {
                                eventMetric1: 'metric1',
                                journeyType: 'testjourneytype2',
                                coupon: 'coupon',
                                item_brand: 'brand',
                                item_category: 'category',
                                item_id: 'iphoneSKU',
                                item_name: 'iphone',
                                item_variant: 'variant',
                                index: 1,
                                price: 999,
                                quantity: 1,
                                total_amount: 999,
                            },
                        ],
                        send_to: 'testMeasurementId',
                    },
                ];

                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should not log an Unknown Product Action Type with no custom flags', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Unknown Test',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.Unknown,
                    CustomFlags: {},
                });

                window.dataLayer.length.should.eql(0);

                done();
            });

            it('should prioritize affiliation for an item over event level affiliation', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test Purchase Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.ProductAddToCart,
                    CustomFlags: { 'GA4.Value': 100 },
                    ProductAction: {
                        ProductActionType: ProductActionType.AddToCart,
                        ProductList: [
                            {
                                Attributes: {
                                    eventMetric1: 'metric2',
                                    journeyType: 'testjourneytype1',
                                    affiliation: 'product-level-affiliation',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                            {
                                Attributes: {
                                    eventMetric1: 'metric1',
                                    journeyType: 'testjourneytype2',
                                },
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                        ],
                        Affiliation: 'event-level-affiliation',
                        TaxAmount: 40,
                        ShippingAmount: 10,
                        CouponCode: 'coupon',
                    },
                });

                result[1] = 'add_to_cart';
                result[2].items[0].affiliation = 'product-level-affiliation';
                result[2].items[1].affiliation = 'event-level-affiliation';
                window.dataLayer[0].should.eql(result);

                done();
            });
        });

        describe('event mapping', function () {
            beforeEach(function () {
                window.dataLayer = [];
            });

            it('should log the event without attributes', function (done) {
                mParticle.forwarder.process({
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    EventName: 'Unmapped Event Name',
                    EventAttributes: {},
                });

                var result = ['event', 'Unmapped Event Name', { send_to: 'testMeasurementId', }];
                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should log the event when attributes are null', function (done) {
                mParticle.forwarder.process({
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    EventName: 'Unmapped Event Name',
                    EventAttributes: null,
                });

                var result = ['event', 'Unmapped Event Name', { send_to: 'testMeasurementId', }];
                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should log the event name and event attributes of the page event', function (done) {
                mParticle.forwarder.process({
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    EventName: 'Unmapped Event Name',
                    EventAttributes: {
                        foo: 'bar',
                    },
                });

                var result = ['event', 'Unmapped Event Name', { foo: 'bar', send_to: 'testMeasurementId', }];
                window.dataLayer[0].should.eql(result);

                done();
            });

            // this test will fail when opened in index.html but not when run in the command line due to the location.href
            it('should log page view ', function (done) {
                // Mocking page title for headless tests
                document.title = 'Mocha Tests';

                mParticle.forwarder.process({
                    EventDataType: MessageType.PageView,
                    EventName: 'test name',
                    EventAttributes: {},
                    CustomFlags: {},
                });

                var result = [
                    'event',
                    'page_view',
                    {
                        page_title: 'Mocha Tests',
                        page_location: location.href,
                        page_referrer: document.referrer,
                        send_to: 'testMeasurementId',
                    },
                ];
                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should log page view with event attributes', function (done) {
                mParticle.forwarder.process({
                    EventDataType: MessageType.PageView,
                    EventName: 'test name',
                    EventAttributes: {
                        eventKey1: 'test1',
                        eventKey2: 'test2',
                    },
                    CustomFlags: {
                        'GA4.Title': 'Foo Page Title',
                        'GA4.Location': '/foo',
                        'GA4.Referrer': 'Foo Page Referrer'
                    },
                });

                var result = [
                    'event',
                    'page_view',
                    {
                        page_title: 'Foo Page Title',
                        page_location: '/foo',
                        page_referrer: 'Foo Page Referrer',
                        eventKey1: 'test1',
                        eventKey2: 'test2',
                        send_to: 'testMeasurementId',
                    },
                ];
                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should truncate long event attributes keys and values', function (done) {
                mParticle.forwarder.process({
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    EventName:
                        'This is a very long event name that should be truncated at some point',
                    EventAttributes: {
                        foo: 'bar',
                        superLongEventAttributeNameThatShouldBeTruncatedWhenItsTooLong:
                            'Super Long Event Attribute value that should be truncated because we do not want super long attribute names that would upset Google',
                    },
                });

                var expectedEventName =
                    'This is a very long event name that shou';

                var expectedEventAttributes = {
                    foo: 'bar',
                    superLongEventAttributeNameThatShouldBeT:
                        'Super Long Event Attribute value that should be truncated because we do not want super long attribut',
                    send_to: 'testMeasurementId',
                };

                window.dataLayer[0][1].should.eql(expectedEventName);
                window.dataLayer[0][2].should.eql(expectedEventAttributes);
                done();
            });

            it('should truncate long user attribute keys and values', function (done) {
                mParticle.forwarder.setUserAttribute(
                    'superLongUserAttributeNameThatShouldBeTruncated',
                    'Super Long User Attribute Value That Should Be Truncated'
                );

                window.dataLayer[0][2].should.eql({
                    superLongUserAttributeNa:
                        'Super Long User Attribute Value That',
                });

                done();
            });

            it('should not standardize event names and event attributes if data cleansing is not enabled', function (done) {
                mParticle.forwarder.process({
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    EventName: '2?Test Event ?Standardization',
                    EventAttributes: {
                        foo: 'bar',
                        '1?test4ever!!!': 'tester',
                    },
                });

                var expectedEventName = '2?Test Event ?Standardization';

                var expectedEventAttributes = {
                    foo: 'bar',
                    '1?test4ever!!!': 'tester',
                    send_to: 'testMeasurementId',
                };

                window.dataLayer[0][1].should.eql(expectedEventName);
                window.dataLayer[0][2].should.eql(expectedEventAttributes);
                done();
            });

            // This test exist for backwards compatibility of custom flags carried
            // over from legacy Google Analytics - Google.Title and Google.Location
            it('should log page view with legacy GA custom flags', function (done) {
                mParticle.forwarder.process({
                    EventDataType: MessageType.PageView,
                    EventName: 'test name',
                    EventAttributes: {},
                    CustomFlags: {
                        'Google.Title': 'Foo Page Title',
                        'Google.Location': '/foo',
                        'Google.DocumentReferrer': 'Foo Page Referrer'
                    },
                });
                var result = [
                    'event',
                    'page_view',
                    {
                        page_title: 'Foo Page Title',
                        page_location: '/foo',
                        page_referrer: 'Foo Page Referrer',
                        send_to: 'testMeasurementId',
                    },
                ];

                window.dataLayer[0].should.eql(result);
                done();
            });

            it('should log page view with new GA custom flags', function (done) {
                mParticle.forwarder.process({
                    EventDataType: MessageType.PageView,
                    EventName: 'test name',
                    EventAttributes: {},
                    CustomFlags: {
                        'GA4.Title': 'Foo Page Title',
                        'GA4.Location': '/foo',
                        'GA4.Referrer': 'Foo Page Referrer'
                    },
                });

                var result = [
                    'event',
                    'page_view',
                    {
                        page_title: 'Foo Page Title',
                        page_location: '/foo',
                        page_referrer: 'Foo Page Referrer',
                        send_to: 'testMeasurementId',
                    },
                ];
                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should log page view with truncated GA custom flags', function (done) {
                function generateValue(length) {
                    var value = ''
                    for (let i = 0; i < length; i++) {
                        value += 'a'
                    }
                    return value
                }

                mParticle.forwarder.process({
                    EventDataType: MessageType.PageView,
                    EventName: 'test name',
                    EventAttributes: {},
                    CustomFlags: {
                        'GA4.Title': generateValue(305), // Max page_title length is 300 for GA4
                        'GA4.Location': generateValue(1005), // Max page_location length is 1000 for GA4
                        'GA4.Referrer': generateValue(425) // Max page_referrer length is 420 for GA4
                    },
                });

                var result = [
                    'event',
                    'page_view',
                    {
                        page_title: generateValue(300),
                        page_location: generateValue(1000),
                        page_referrer: generateValue(420),
                        send_to: 'testMeasurementId',
                    },
                ];

                window.dataLayer[0].should.eql(result);

                done();
            }) 

            describe('limit event attributes', function () {
                // 101 event attribute keys because the limit is 100
                var eventAttributeKeys101 = [
                    'aa',
                    'ab',
                    'ac',
                    'ad',
                    'ae',
                    'af',
                    'ag',
                    'ah',
                    'ai',
                    'aj',
                    'ak',
                    'al',
                    'am',
                    'an',
                    'ao',
                    'ap',
                    'aq',
                    'ar',
                    'as',
                    'at',
                    'au',
                    'av',
                    'aw',
                    'ax',
                    'ay',
                    'az',
                    'ba',
                    'bb',
                    'bc',
                    'bd',
                    'be',
                    'bf',
                    'bg',
                    'bh',
                    'bi',
                    'bj',
                    'bk',
                    'bl',
                    'bm',
                    'bn',
                    'bo',
                    'bp',
                    'bq',
                    'br',
                    'bs',
                    'bt',
                    'bu',
                    'bv',
                    'bw',
                    'bx',
                    'by',
                    'bz',
                    'ca',
                    'cb',
                    'cc',
                    'cd',
                    'ce',
                    'cf',
                    'cg',
                    'ch',
                    'ci',
                    'cj',
                    'ck',
                    'cl',
                    'cm',
                    'cn',
                    'co',
                    'cp',
                    'cq',
                    'cr',
                    'cs',
                    'ct',
                    'cu',
                    'cv',
                    'cw',
                    'cx',
                    'cy',
                    'cz',
                    'da',
                    'db',
                    'dc',
                    'dd',
                    'de',
                    'df',
                    'dg',
                    'dh',
                    'di',
                    'dj',
                    'dk',
                    'dl',
                    'dm',
                    'dn',
                    'do',
                    'dp',
                    'dq',
                    'dr',
                    'ds',
                    'dt',
                    'du',
                    'dv',
                    'dw'
                ];

                it('should limit the number of event attribute keys', function (done) {
                    var event = {
                        CurrencyCode: 'USD',
                        EventName: 'Test Purchase Event',
                        EventDataType: MessageType.PageEvent,
                        EventCategory: CommerceEventType.ProductImpression,
                        EventAttributes: {},
                    };
                    // add on 101 event attributes
                    eventAttributeKeys101.forEach(function (key) {
                        event.EventAttributes[key] = key;
                    });
                    mParticle.forwarder.process(event);

                    var resultEventAttributeKeys = Object.keys(dataLayer[0][2]);
                    // confirm measurmentId as part of GA4 parameters
                    resultEventAttributeKeys.includes('send_to').should.equal(true);
                    // remove send_to to test the 100 event attribute limit since send_to is a reserved GA4 param
                    delete (dataLayer[0][2]).send_to

                    // re-assign resultEventAttributeKeys after removing send_to from batch to only count for non-reserved params
                    resultEventAttributeKeys = Object.keys(dataLayer[0][2]);
                    resultEventAttributeKeys.length.should.eql(100);
                    // dw is the 101st item.  The limit is 100, so
                    resultEventAttributeKeys.should.not.have.property('dw');

                    done();
                });

                it('should limit the number of event attribute keys on GA4 view cart commerce events', function (done) {
                    var event = {
                        CurrencyCode: 'USD',
                        EventName: 'Unknown Test',
                        EventDataType: MessageType.Commerce,
                        EventAttributes: {},
                        EventCategory: CommerceEventType.Unknown,
                        CustomFlags: {
                            'GA4.CommerceEventType': 'view_cart',
                            'GA4.Value': 100,
                        },
                        ProductAction: {
                            ProductActionType: ProductActionType.Unknown,
                            ProductList: [],
                        },
                    };

                    // add on 101 event attributes
                    eventAttributeKeys101.forEach(function (key) {
                        event.EventAttributes[key] = key;
                    });
                    mParticle.forwarder.process(event);
                    var resultEventAttributeKeys = Object.keys(dataLayer[0][2]);
                    // confirm measurmentId as part of GA4 parameters
                    resultEventAttributeKeys.includes('send_to').should.equal(true);
                    // remove send_to to test the 100 event attribute limit since send_to is a reserved GA4 param
                    delete (dataLayer[0][2]).send_to

                    // re-assign resultEventAttributeKeys after removing send_to from batch to only count for non-reserved params
                    resultEventAttributeKeys = Object.keys(dataLayer[0][2]);
                    // confirm event attribuets have been successfully set
                    resultEventAttributeKeys.includes('aa').should.equal(true);
                    // dw is the 101st item.  The limit is 100, so
                    resultEventAttributeKeys.includes('dw').should.equal(false);

                    done();
                });

                it('should limit the number of event attribute keys on product action commerce events', function (done) {
                    var event = {
                        CurrencyCode: 'USD',
                        EventName: 'eCommerce - AddToCart',
                        EventDataType: MessageType.Commerce,
                        EventAttributes: {},
                        EventCategory: CommerceEventType.ProductAddToCart,
                        ProductAction: {
                            ProductActionType: ProductActionType.Unknown,
                            ProductList: [],
                        },
                    };

                    // add on 101 event attributes
                    eventAttributeKeys101.forEach(function (key) {
                        event.EventAttributes[key] = key;
                    });

                    mParticle.forwarder.process(event);

                    var resultEventAttributeKeys = Object.keys(dataLayer[0][2]);
                    // confirm measurmentId as part of GA4 parameters
                    resultEventAttributeKeys.includes('send_to').should.equal(true);
                    // remove send_to to test the 100 event attribute limit since send_to is a reserved GA4 param
                    delete (dataLayer[0][2]).send_to

                    // re-assign resultEventAttributeKeys after removing send_to from batch to only count for non-reserved params
                    resultEventAttributeKeys = Object.keys(dataLayer[0][2]);
                    // confirm event attribuets have been successfully set
                    resultEventAttributeKeys.includes('aa').should.equal(true);
                    // dw is the 101st item.  The limit is 100, so
                    resultEventAttributeKeys.includes('dw').should.equal(false);

                    done();
                });

                it('should limit the number of event attribute keys on items to 10', function (done) {
                    var event = {
                        CurrencyCode: 'USD',
                        EventName: 'eCommerce - AddToCart',
                        EventDataType: MessageType.Commerce,
                        EventAttributes: {},
                        EventCategory: CommerceEventType.ProductAddToCart,
                        ProductAction: {
                            ProductActionType: ProductActionType.Unknown,
                            ProductList: [
                                {
                                    Attributes: {
                                        item_category2: 'testjourneytype1',
                                        a: 'foo',
                                        b: 'foo',
                                        c: 'foo',
                                        d: 'foo',
                                        e: 'foo',
                                        f: 'foo',
                                        g: 'foo',
                                        h: 'foo',
                                        i: 'foo',
                                        j: 'foo',
                                        k: 'foo',
                                    },
                                    Brand: 'brand',
                                    Category: 'category',
                                    Name: 'iphone',
                                    Position: 1,
                                    Price: 999,
                                    Quantity: 1,
                                    Sku: 'iphoneSKU',
                                    TotalAmount: 999,
                                    Variant: 'variant',
                                },
                            ],
                        },
                    };

                    mParticle.forwarder.process(event);

                    // We filter out k from the attributes because it is the 11th item
                    // while retaining item_category2 since this is a reserved key
                    var item1 = {
                        item_category2: 'testjourneytype1',
                        a: 'foo',
                        b: 'foo',
                        c: 'foo',
                        d: 'foo',
                        e: 'foo',
                        f: 'foo',
                        g: 'foo',
                        h: 'foo',
                        i: 'foo',
                        j: 'foo',
                        item_brand: 'brand',
                        item_category: 'category',
                        item_id: 'iphoneSKU',
                        item_name: 'iphone',
                        item_variant: 'variant',
                        index: 1,
                        price: 999,
                        quantity: 1,
                        total_amount: 999,
                    };

                    // Ths 1st item shoudl match the result above, removing `k`
                    window.dataLayer[0][2].items[0].should.match(item1);

                    done();
                });
            });
        });
    });

    describe('identity', function () {
        var mParticleUser = {
            getMPID: function () {
                return 'testMPID';
            },
            getUserIdentities: function () {
                return {
                    userIdentities: {
                        customerid: 'testCustomerId',
                        other: 'other1',
                    },
                };
            },
        };

        it('should handle onUserIdentified with customerid', function (done) {
            kitSettings.externalUserIdentityType = 'CustomerId';
            mParticle.forwarder.init(kitSettings, reportService.cb, true, null);
            window.dataLayer = [];
            mParticle.forwarder.onUserIdentified(mParticleUser);

            var result = [
                'config',
                'testMeasurementId',
                { send_page_view: false, user_id: 'testCustomerId' },
            ];

            window.dataLayer[0].should.match(result);

            done();
        });

        it('should handle onUserIdentified with other1', function (done) {
            kitSettings.externalUserIdentityType = 'Other';
            mParticle.forwarder.init(kitSettings, reportService.cb, true, null);
            window.dataLayer = [];

            mParticle.forwarder.onUserIdentified(mParticleUser);

            var result = [
                'config',
                'testMeasurementId',
                { send_page_view: false, user_id: 'other1' },
            ];
            window.dataLayer[0].should.match(result);

            done();
        });

        it('should handle onUserIdentified with mpid', function (done) {
            kitSettings.externalUserIdentityType = 'mpid';
            mParticle.forwarder.init(kitSettings, reportService.cb, true, null);
            window.dataLayer = [];

            mParticle.forwarder.onUserIdentified(mParticleUser);

            var result = [
                'config',
                'testMeasurementId',
                { send_page_view: false, user_id: 'testMPID' },
            ];
            window.dataLayer[0].should.match(result);

            done();
        });
    });

    describe('set enable mobile cleansing = true', function () {
        beforeEach(function () {
            var kitSettings = {
                clientKey: '123456',
                appId: 'abcde',
                externalUserIdentityType: 'customerId',
                measurementId: 'testMeasurementId',
                enableDataCleansing: 'True',
            };
            mParticle.forwarder.init(kitSettings, reportService.cb, true);
            // This forces the dataLayer to have a type array to make testing easier
            // Without this, it is an array-like object of arguments
            window.gtag = function () {
                window.dataLayer.push(Array.prototype.slice.call(arguments));
            };

            window.dataLayer = [];
        });

        afterEach(function () {
            window.gtag = undefined;
            window.dataLayer = undefined;
        });

        describe('standardizing event names and attribute keys', function () {
            it('should standardize event names and attributes keys', function (done) {
                mParticle.forwarder.process({
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    EventName: '2?Test Event ?Standardization',
                    EventAttributes: {
                        foo: 'bar',
                        '1?test4ever!!!': 'tester',
                    },
                });

                var expectedEventName = 'Test_Event__Standardization';

                var expectedEventAttributes = {
                    foo: 'bar',
                    test4ever___: 'tester',
                    send_to: 'testMeasurementId',
                };

                window.dataLayer[0][1].should.eql(expectedEventName);
                window.dataLayer[0][2].should.eql(expectedEventAttributes);
                done();
            });

            it('should standardize event names and attributes keys using user provided cleansing callback first, and then our standardization', function (done) {
                window.GoogleAnalytics4Kit.setCustomNameStandardization =
                    function (str) {
                        return str.slice(0, str.length - 1);
                    };

                mParticle.forwarder.process({
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    EventName: '2?Test Event ?Standardization',
                    EventAttributes: {
                        foo: 'bar',
                        '1?test4ever!!!': 'tester',
                    },
                });

                var expectedEventName = 'Test_Event__Standardizatio';

                var expectedEventAttributes = {
                    fo: 'bar',
                    test4ever__: 'tester',
                    send_to: 'testMeasurementId',
                };

                window.dataLayer[0][1].should.eql(expectedEventName);
                window.dataLayer[0][2].should.eql(expectedEventAttributes);

                // remove this function so that it doesn't affect other tests
                delete window.GoogleAnalytics4Kit.setCustomNameStandardization;

                done();
            });

            it('should remove forbidden prefixes', function (done) {
                mParticle.forwarder.process({
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    EventName: '123___google_$$google_test_event',
                });

                var expectedEventName = 'test_event';

                window.dataLayer[0][1].should.eql(expectedEventName);
                window.dataLayer = [];

                mParticle.forwarder.process({
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    EventName: 'firebase_$$$test_event',
                });

                window.dataLayer[0][1].should.eql(expectedEventName);
                window.dataLayer = [];

                mParticle.forwarder.process({
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    EventName: 'ga_$$$test_event',
                });

                window.dataLayer[0][1].should.eql(expectedEventName);
                window.dataLayer = [];

                done();
            });

            it('should standardize attribute keys for ecommerce events', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test Purchase Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.ProductAddToWishlist,
                    ProductAction: {
                        ProductActionType: ProductActionType.AddToWishlist,
                        ProductList: [
                            {
                                Attributes: {
                                    eventMetric1: 'metric2',
                                    journeyType: 'testjourneytype1',
                                },
                                '1?test4ever!!!': 'tester',
                                Brand: 'brand',
                                Category: 'category',
                                $$CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                            {
                                Attributes: {
                                    eventMetric1: 'metric1',
                                    journeyType: 'testjourneytype2',
                                },
                                '1?test4ever!!!': 'tester',
                                Brand: 'brand',
                                Category: 'category',
                                CouponCode: 'coupon',
                                Name: 'iphone',
                                Position: 1,
                                Price: 999,
                                Quantity: 1,
                                Sku: 'iphoneSKU',
                                TotalAmount: 999,
                                Variant: 'variant',
                            },
                        ],
                        TotalAmount: 450,
                        TaxAmount: 40,
                        ShippingAmount: 10,
                        CouponCode: 'couponCode',
                    },
                });

                var result = [
                    'event',
                    'add_to_wishlist',
                    {
                        value: 450,
                        items: [
                            {
                                eventMetric1: 'metric2',
                                journeyType: 'testjourneytype1',
                                coupon_code: 'coupon',
                                item_brand: 'brand',
                                item_category: 'category',
                                item_id: 'iphoneSKU',
                                item_name: 'iphone',
                                item_variant: 'variant',
                                index: 1,
                                price: 999,
                                quantity: 1,
                                test4ever___: 'tester',
                                total_amount: 999,
                            },
                            {
                                eventMetric1: 'metric1',
                                journeyType: 'testjourneytype2',
                                test4ever___: 'tester',
                                coupon: 'coupon',
                                item_brand: 'brand',
                                item_category: 'category',
                                item_id: 'iphoneSKU',
                                item_name: 'iphone',
                                item_variant: 'variant',
                                index: 1,
                                price: 999,
                                quantity: 1,
                                total_amount: 999,
                            },
                        ],
                        currency: 'USD',
                        send_to: 'testMeasurementId',
                    },
                ];

                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should map MP ProductImpression commerce event to GA4 view_item_list event', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test Purchase Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.ProductImpression,
                    ProductImpressions: [
                        {
                            // TODO: Does this map to the name or id of the impression?
                            ProductImpressionList: 'Related Products',
                            ProductList: [
                                {
                                    Attributes: {
                                        eventMetric1: 'metric2',
                                        journeyType: 'testjourneytype1',
                                    },
                                    Brand: 'brand',
                                    Category: 'category',
                                    CouponCode: 'coupon',
                                    Name: 'iphone',
                                    Position: 1,
                                    Price: 999,
                                    Quantity: 1,
                                    Sku: 'iphoneSKU',
                                    TotalAmount: 999,
                                    Variant: 'variant',
                                    'test 1': 'test1',
                                    'test??2': 'test2',
                                    '3!test 3': 'test3',
                                },
                                {
                                    Attributes: {
                                        eventMetric1: 'metric1',
                                        journeyType: 'testjourneytype2',
                                    },
                                    Brand: 'brand',
                                    Category: 'category',
                                    CouponCode: 'coupon',
                                    Name: 'iphone',
                                    Position: 1,
                                    Price: 999,
                                    Quantity: 1,
                                    Sku: 'iphoneSKU',
                                    TotalAmount: 999,
                                    Variant: 'variant',
                                },
                            ],
                            TaxAmount: 40,
                            ShippingAmount: 10,
                            CouponCode: 'couponCode',
                        },
                    ],
                });

                var result = [
                    'event',
                    'view_item_list',
                    {
                        item_list_id: 'Related Products',
                        item_list_name: 'Related Products',
                        items: [
                            {
                                eventMetric1: 'metric2',
                                journeyType: 'testjourneytype1',
                                coupon: 'coupon',
                                item_brand: 'brand',
                                item_category: 'category',
                                item_id: 'iphoneSKU',
                                item_name: 'iphone',
                                item_variant: 'variant',
                                index: 1,
                                price: 999,
                                quantity: 1,
                                total_amount: 999,
                                test_1: 'test1',
                                test__2: 'test2',
                                test_3: 'test3',
                            },
                            {
                                eventMetric1: 'metric1',
                                journeyType: 'testjourneytype2',
                                coupon: 'coupon',
                                item_brand: 'brand',
                                item_category: 'category',
                                item_id: 'iphoneSKU',
                                item_name: 'iphone',
                                item_variant: 'variant',
                                index: 1,
                                price: 999,
                                quantity: 1,
                                total_amount: 999,
                            },
                        ],
                        send_to: 'testMeasurementId'
                    },
                ];

                window.dataLayer[0].should.eql(result);

                done();
            });

            it('should include impression event custom attributes on GA4 view_item_list event', function(done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test Purchase Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.ProductImpression,
                    EventAttributes: {"foo": "bar"},
                    ProductImpressions: [
                        {
                            ProductImpressionList: 'Related Products',
                            ProductList: [
                                {
                                    Attributes: {
                                        eventMetric1: 'metric2',
                                        journeyType: 'testjourneytype1',
                                    },
                                    Brand: 'brand',
                                    Category: 'category',
                                    CouponCode: 'coupon',
                                    Name: 'iphone',
                                    Position: 1,
                                    Price: 999,
                                    Quantity: 1,
                                    Sku: 'iphoneSKU',
                                    TotalAmount: 999,
                                    Variant: 'variant',
                                    'test 1': 'test1',
                                    'test??2': 'test2',
                                    '3!test 3': 'test3',
                                },
                                {
                                    Attributes: {
                                        eventMetric1: 'metric1',
                                        journeyType: 'testjourneytype2',
                                    },
                                    Brand: 'brand',
                                    Category: 'category',
                                    CouponCode: 'coupon',
                                    Name: 'iphone',
                                    Position: 1,
                                    Price: 999,
                                    Quantity: 1,
                                    Sku: 'iphoneSKU',
                                    TotalAmount: 999,
                                    Variant: 'variant',
                                },
                            ],
                            TaxAmount: 40,
                            ShippingAmount: 10,
                            CouponCode: 'couponCode',
                        },
                    ],
                });

                var result = [
                    'event',
                    'view_item_list',
                    {
                        item_list_id: 'Related Products',
                        item_list_name: 'Related Products',
                        items: [
                            {
                                eventMetric1: 'metric2',
                                journeyType: 'testjourneytype1',
                                coupon: 'coupon',
                                item_brand: 'brand',
                                item_category: 'category',
                                item_id: 'iphoneSKU',
                                item_name: 'iphone',
                                item_variant: 'variant',
                                index: 1,
                                price: 999,
                                quantity: 1,
                                total_amount: 999,
                                test_1: 'test1',
                                test__2: 'test2',
                                test_3: 'test3',
                            },
                            {
                                eventMetric1: 'metric1',
                                journeyType: 'testjourneytype2',
                                coupon: 'coupon',
                                item_brand: 'brand',
                                item_category: 'category',
                                item_id: 'iphoneSKU',
                                item_name: 'iphone',
                                item_variant: 'variant',
                                index: 1,
                                price: 999,
                                quantity: 1,
                                total_amount: 999,
                            },
                        ],
                        foo: "bar",
                        send_to: 'testMeasurementId'
                    },
                ];

                window.dataLayer[0].should.eql(result);

                done();
            })

            it('should include promotion click event custom attributes on GA4 select_promotion event', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test Purchase Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.PromotionClick,
                    EventAttributes: {"foo": "bar"},
                    PromotionAction: {
                        PromotionActionType: PromotionActionType.PromotionClick,
                        PromotionList: [
                            {
                                Id: 'P_12345',
                                Name: 'Summer Sale Banner',
                                Creative: 'Summer Sale',
                                Position: 'featured_app_1',
                            }
                        ],
                    },
                });

                var promotionResult = [
                    'event',
                    'select_promotion',
                    {
                        promotion_id: 'P_12345',
                        promotion_name: 'Summer Sale Banner',
                        creative_name: 'Summer Sale',
                        creative_slot: 'featured_app_1',
                        foo: 'bar',
                        send_to: 'testMeasurementId',
                    },
                ];

                window.dataLayer[0].should.eql(promotionResult);

                done();
            });

            it('should include promotion view event custom attributes on GA4 view_promotion event', function (done) {
                mParticle.forwarder.process({
                    CurrencyCode: 'USD',
                    EventName: 'Test Promotion Action Event',
                    EventDataType: MessageType.Commerce,
                    EventCategory: CommerceEventType.PromotionView,
                    EventAttributes: {"foo": "bar"},
                    PromotionAction: {
                        PromotionActionType: PromotionActionType.PromotionView,
                        PromotionList: [
                            {
                                Id: 'P_12345',
                                Name: 'Summer Sale Banner',
                                Creative: 'Summer Sale',
                                Position: 'featured_app_1',
                            }
                        ],
                    },
                });

                var promotionResult = [
                    'event',
                    'view_promotion',
                    {
                        promotion_id: 'P_12345',
                        promotion_name: 'Summer Sale Banner',
                        creative_name: 'Summer Sale',
                        creative_slot: 'featured_app_1',
                        foo: 'bar',
                        send_to: 'testMeasurementId',
                    },
                ];

                window.dataLayer[0].should.eql(promotionResult);

                done();
            });
        });
    });

    describe('Consent State', () => {
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
            {
                jsmap: null,
                map: 'Functionality_consent',
                maptype: 'ConsentPurposes',
                value: 'functionality_storage',
            },
            {
                jsmap: null,
                map: 'Personalization_consent',
                maptype: 'ConsentPurposes',
                value: 'personalization_storage',
            },
            {
                jsmap: null,
                map: 'Security_consent',
                maptype: 'ConsentPurposes',
                value: 'security_storage',
            },
        ];

        beforeEach(function () {
            window.dataLayer = [];
        });

        it('should construct a Default Consent State Payload from Mappings', (done) => {
            mParticle.forwarder.init(
                {
                    conversionId: 'AW-123123123',
                    consentMappingSDK:
                        '[{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Some_consent&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;ad_user_data&quot;},{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Storage_consent&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;analytics_storage&quot;},{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Other_test_consent&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;ad_storage&quot;},{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Test_consent&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;ad_personalization&quot;},{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Functionality_consent&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;functionality_storage&quot;},{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Personalization_consent&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;personalization_storage&quot;},{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Security_consent&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;security_storage&quot;}]',
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
                    functionality_storage: 'denied',
                    personalization_storage: 'denied',
                    security_storage: 'denied',
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
                    consentMappingSDK: JSON.stringify(consentMap),
                    defaultAdUserDataConsentSDK: 'Granted', // Will be overriden by User Consent State
                    defaultAdPersonalizationConsentSDK: 'Granted', // Will be overriden by User Consent State
                    defaultAdStorageConsentSDK: 'Granted',
                    defaultAnalyticsStorageConsentSDK: 'Granted',
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
                    functionality_storage: 'denied', // From User Consent State
                    personalization_storage: 'denied', // From User Consent State
                    security_storage: 'denied', // From User Consent State
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
                    consentMappingSDK: JSON.stringify(consentMap),
                    defaultAdUserDataConsentSDK: 'Unspecified',
                    defaultAdPersonalizationConsentSDK: 'Unspecified', // Will be overriden by User Consent State
                    defaultAdStorageConsentSDK: 'Unspecified', // Will be overriden by User Consent State
                    defaultAnalyticsStorageConsentSDK: 'Unspecified',
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
                    functionality_storage: 'denied', // From User Consent State
                    personalization_storage: 'denied', // From User Consent State
                    security_storage: 'denied', // From User Consent State
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
                    consentMappingSDK: JSON.stringify(consentMap),
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
                    functionality_storage: 'denied',
                    personalization_storage: 'denied',
                    security_storage: 'denied',
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
                EventDataType: MessageType.PageEvent,
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
            // Event is index 5
            window.dataLayer.length.should.eql(6);
            window.dataLayer[4][0].should.equal('consent');
            window.dataLayer[4][1].should.equal('update');
            window.dataLayer[4][2].should.deepEqual(expectedDataLayerAfter[2]);

            mParticle.forwarder.process({
                EventName: 'Homepage',
                EventDataType: MessageType.PageEvent,
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
            // Event is index 5
            // Consent Update #2 is index 6
            // Event #2 is index 7
            window.dataLayer.length.should.eql(8);
            window.dataLayer[6][0].should.equal('consent');
            window.dataLayer[6][1].should.equal('update');
            window.dataLayer[6][2].should.deepEqual(expectedDataLayerFinal[2]);

            done();
        });

        it('should construct a Consent State Update Payload with Consent Setting Defaults when consent changes', (done) => {
            mParticle.forwarder.init(
                {
                    conversionId: 'AW-123123123',
                    enableGtag: 'True',
                    consentMappingSDK: JSON.stringify(consentMap),
                    defaultAdUserDataConsentSDK: 'Granted', // Will be overriden by User Consent State
                    defaultAdPersonalizationConsentSDK: 'Granted', // Will be overriden by User Consent State
                    defaultAdStorageConsentSDK: 'Granted',
                    defaultAnalyticsStorageConsentSDK: 'Granted',
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
                    functionality_storage: 'denied', // From User Consent State
                    personalization_storage: 'denied', // From User Consent State
                    security_storage: 'denied', // From User Consent State
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
                EventName: 'Homepage',
                EventDataType: MessageType.PageEvent,
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
            // Event is index 6
            window.dataLayer.length.should.eql(7);
            window.dataLayer[5][0].should.equal('consent');
            window.dataLayer[5][1].should.equal('update');
            window.dataLayer[5][2].should.deepEqual(expectedDataLayerAfter[2]);

            mParticle.forwarder.process({
                EventName: 'Homepage',
                EventDataType: MessageType.PageEvent,
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
            // Event is index 6
            // Consent Update #3 is index 7
            // Event #2 is index 8
            window.dataLayer.length.should.eql(9);
            window.dataLayer[7][0].should.equal('consent');
            window.dataLayer[7][1].should.equal('update');
            window.dataLayer[7][2].should.deepEqual(expectedDataLayerFinal[2]);
            done();
        });

        it('should NOT construct a Consent State Update Payload if consent DOES NOT change', (done) => {
            mParticle.forwarder.init(
                {
                    conversionId: 'AW-123123123',
                    enableGtag: 'True',
                    consentMappingSDK: JSON.stringify(consentMap),
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
                    functionality_storage: 'denied',
                    personalization_storage: 'denied',
                    security_storage: 'denied',
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
                EventDataType: MessageType.PageEvent,
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
                            functionality_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'functionality_consent',
                            },
                            personalization_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'personalization_consent',
                            },
                            security_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'security_consent',
                            },
                        };
                    },
                },
            });

            // Last Element of data layer should only contain actual event
            window.dataLayer.length.should.eql(5);
            window.dataLayer[4][0].should.equal('event');
            window.dataLayer[4][1].should.equal('Homepage');

            done();
        });

        it('should NOT construct any Consent State Payload if consent mappings and settings are undefined', (done) => {
            mParticle.forwarder.init(
                {
                    conversionId: 'AW-123123123',
                    enableGtag: 'True',
                },
                reportService.cb,
                true
            );

            // Initial elements of Data Layer are setup for gtag.
            // Consent state should be on the bottom
            window.dataLayer.length.should.eql(3);

            mParticle.forwarder.process({
                EventName: 'Homepage',
                EventDataType: MessageType.PageEvent,
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
            // The last element of data layer should only contain actual event
            window.dataLayer.length.should.eql(4);
            window.dataLayer[3][0].should.equal('event');

            done();
        });

        it('should construct Consent State Payloads if consent mappings is undefined but settings defaults are defined', (done) => {
            mParticle.forwarder.init(
                {
                    conversionId: 'AW-123123123',
                    enableGtag: 'True',
                    defaultAdUserDataConsentSDK: 'Granted',
                    defaultAdPersonalizationConsentSDK: 'Denied',
                    defaultAdStorageConsentSDK: 'Granted',
                    defaultAnalyticsStorageConsentSDK: 'Denied',
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
                EventDataType: MessageType.PageEvent,
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
            // The last element of data layer should only contain actual event
            window.dataLayer.length.should.eql(5);
            window.dataLayer[3][0].should.equal('consent');
            window.dataLayer[3][1].should.equal('default');
            window.dataLayer[3][2].should.deepEqual(expectedDataLayerBefore[2]);

            window.dataLayer[4][0].should.equal('event');

            done();
        });
    });
});
