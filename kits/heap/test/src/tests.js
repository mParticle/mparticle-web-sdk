/* eslint-disable no-undef*/
describe('Heap Forwarder', function () {
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
            Impression: 22,
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
            };
        },
    };
    // -------------------START EDITING BELOW:-----------------------
    var MockHeapForwarder = function () {
        var self = this;

        // create properties for each type of event you want tracked, see below for examples
        this.trackCalled = false;
        this.logPurchaseEventCalled = false;
        this.addUserPropertiesCalled = false;
        this.loadCalled = false;
        this.identifyCalled = false;
        this.initializeCalled = false;

        this.trackCustomName = null;
        this.logPurchaseName = null;
        this.identity = null;
        this.userAttributes = {};
        this.userIdField = null;

        this.events = [];
        this.eventProperties = [];
        this.purchaseEventProperties = [];

        // stub your different methods to ensure they are being called properly
        this.initialize = function (appId, apiKey) {
            self.initializeCalled = true;
            self.apiKey = apiKey;
        };

        this.identify = function (identity) {
            self.identity = identity;
            self.identifyCalled = true;
        };

        this.getIdentity = function () {
            return self.identity;
        }

        this.resetIdentity = function () {
            self.identity = null;
        }

        this.addUserProperties = function (properties) {
            self.addUserPropertiesCalled = true;
            self.userAttributes = properties;
        };

        this.track = function (eventName, eventAttributes) {
            this.trackCalled = true;
            this.events.push(eventName);
            this.eventProperties.push(eventAttributes);
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

    before(function () {});

    beforeEach(function () {
        window.MockHeapForwarder = new MockHeapForwarder();
        // Include any specific settings that is required for initializing your SDK here
        var sdkSettings = {
            clientKey: '123456',
            applicationId: 'test-app-id',
            userIdentificationType: 'customerid',
            forwardWebRequestsServerSide: false,
        };

        // You may require userAttributes or userIdentities to be passed into initialization
        var userAttributes = {
            color: 'green',
        };
        var userIdentities = [
            {
                Identity: 'customerId',
                Type: IdentityType.CustomerId,
            },
            {
                Identity: 'email',
                Type: IdentityType.Email,
            },
            {
                Identity: 'facebook',
                Type: IdentityType.Facebook,
            },
        ];

        // The third argument here is a boolean to indicate that the integration is in test mode to avoid loading any third party scripts. Do not change this value.
        mParticle.forwarder.init(
            sdkSettings,
            reportService.cb,
            true,
            null,
            userAttributes,
            userIdentities
        );
    });

    it('should initialize Heap', function (done) {
        mParticle.forwarder.init({
            applicationId: 'test-app-id',
            forwardWebRequestsServerSide: false,
        });

        window.heap.should.be.ok;
        window.heap.track.should.be.ok;
        // The Heap SDK initializes with a stubbed object that contains
        //  `envId: <app-id>` but will be replaced by `applicationId: <app-id>` once
        //  Heap fully initializes. For the purposes of our test framework,
        // we test to make sure the stubbed methods are initialized.
        window.heap.envId.should.equal('test-app-id');
        done();
    });

    describe('UserIdentification', function () {
        it('should log the correct identity to heap based on the forwarder settings', function (done) {
            window.heap = new MockHeapForwarder();

            mParticle.forwarder.init({
                applicationId: 'test-app-id',
                userIdentificationType: 'customerid',
            });

            var user = {
                getUserIdentities: function () {
                    return {
                        userIdentities: {
                            customerid: 'cid123',
                        },
                    };
                },
            };
            mParticle.forwarder.onUserIdentified(user);

            window.heap.getIdentity.should.be.ok;
            window.heap.getIdentity().should.equal('cid123');
            done();
        });

        it('should return a null identity on logout', function (done) {
            mParticle.forwarder.init({
                applicationId: 'test-app-id',
                userIdentificationType: 'customerid',
            });

            var user = {
                getUserIdentities: function () {
                    return {
                        userIdentities: {
                            customerid: 'cid123',
                        },
                    };
                },
            };
            mParticle.forwarder.onUserIdentified(user);

            window.heap.should.be.ok;
            window.heap.getIdentity().should.equal('cid123');

            mParticle.forwarder.onLogoutComplete();

            expect(window.heap.getIdentity()).to.be.null
            done();
        });
    });

    describe('UserAttributeProcessing', function () {
        it('should log all user attributes when one is added', function (done) {
            mParticle.forwarder.setUserAttribute('newKey', 'newValue');

            window.heap.addUserPropertiesCalled.should.equal(true);
            done();
        });

        it('should log user attributes when one is removed', function (done) {
            mParticle.forwarder.setUserAttribute('newKey2', 'newValue2');

            window.heap.userAttributes.newKey2.should.exist;
            window.heap.userAttributes.newKey.should.exist;

            mParticle.forwarder.removeUserAttribute('newKey');

            Object.keys(window.heap.userAttributes).length.should.equal(1);
            window.heap.addUserPropertiesCalled.should.equal(true);
            done();
        });
    });

    describe('CustomEventProcessing', function () {
        it('should log event', function (done) {
            window.heap = new MockHeapForwarder();
            mParticle.forwarder.init({
                applicationId: 'test-app-id',
            });

            mParticle.forwarder.process({
                EventDataType: MessageType.PageEvent,
                EventName: 'Test Event',
                EventAttributes: {
                    label: 'label',
                    value: 200,
                    category: 'category',
                },
            });

            window.heap.trackCalled.should.equal(true);
            window.heap.events.length.should.equal(1);
            window.heap.events[0].should.equal('Test Event');
            window.heap.eventProperties[0].label.should.equal('label');
            window.heap.eventProperties[0].value.should.equal(200);
            window.heap.eventProperties[0].category.should.equal('category');
            done();
        });
    });

    describe('CommerceEventProcessing', function () {
        var product = {
            Name: 'galaxy',
            Sku: 'galaxySKU',
            Price: 799,
            Quantity: 1,
            Brand: 'brand',
            Variant: 'variant',
            Category: 'category',
            Position: 1,
            CouponCode: 'coupon',
            TotalAmount: 799,
            Attributes: {
                prod2AttrKey1: 'value1',
                prod2AttrKey2: 'value2',
            },
        };

        var purchaseEvent =  {
            EventName: 'Test Purchase Event',
            EventDataType: MessageType.Commerce,
            EventCategory: EventType.ProductPurchase,
            ProductAction: {
                ProductActionType: ProductActionType.Purchase,
                ProductList: [
                    product,
                    product,
                ],
                TransactionId: 123,
                Affiliation: 'my-affiliation',
                TotalAmount: 450,
                TaxAmount: 40,
                ShippingAmount: 10,
                CouponCode: null
            }
        };

        var impressionEvent =  {
            EventName: 'eCommerce - Impression',
            EventDataType: 16,
            EventCategory: 22,
            ProductImpressions: [
                {
                    ProductImpressionList: 'Suggested Products List1',
                    ProductList: [
                        product,
                        product,
                    ],
                },
                {
                    ProductImpressionList: 'Suggested Products List2',
                    ProductList: [
                        product,
                        product,
                    ],
                },
            ],
        };

        var promotionEvent = {
            EventName: 'eCommerce - PromotionClick',
            EventDataType: 16,
            CurrencyCode: null,
            EventCategory: 19,
            PromotionAction: {
                PromotionActionType: 2,
                PromotionList: [
                    {
                        Id: 'my_promo_1',
                        Creative: 'sale_banner_1',
                        Position: 'top'
                    },
                    {
                        Id: 'my_promo_2',
                        Creative: 'sale_banner_2',
                        Position: 'bottom',
                    },
                ],
            },
        };

        var validatedProductProperties = {
            prod2AttrKey1: 'value1',
            prod2AttrKey2: 'value2',
            product_name: 'galaxy',
            product_brand: 'brand',
            product_category: 'category',
            product_id: 'galaxySKU',
            product_price: 799,
            product_quantity: 1,
        };

        it('should process a product purchase commerce event', function (done) {
            window.heap = new MockHeapForwarder();

            mParticle.forwarder.init({
                applicationId: 'test-app-id',
                userIdentificationType: 'customerid',
            });

            mParticle.forwarder.process(purchaseEvent);

            window.heap.trackCalled.should.equal(true);

            // An mParticle Product Action Events map to n+1
            // events in Heap based on the number of associated
            // products.
            window.heap.events.length.should.equal(3);

            for (var i = 0; i < window.heap.events.length; i++) {
                var eventName = window.heap.events[i];
                var properties = window.heap.eventProperties[i];

                if (eventName === 'Item') {
                    properties.should.deep.equal(validatedProductProperties);
                }

                if (eventName.includes('Action')) {
                    properties.skus.length.should.equal(2);
                    eventName.includes('Purchase').should.be.ok;
                }
            }

            done();
        });

        it('should process a product impression event', function (done) {
            window.heap = new MockHeapForwarder();

            mParticle.forwarder.init({
                applicationId: 'test-app-id',
                userIdentificationType: 'customerid',
            });

            mParticle.forwarder.process(impressionEvent);

            window.heap.trackCalled.should.equal(true);

            // Each mParticle Impression Event will map
            // to n+1 events in Heap for each impression
            // based on the number of associated products.
            window.heap.events.length.should.equal(6);

            for (var i = 0; i < window.heap.events.length; i++) {
                var eventName = window.heap.events[i];
                var properties = window.heap.eventProperties[i];

                if (eventName === 'Item') {
                    properties.should.deep.equal(validatedProductProperties);
                }

                if (eventName.includes('Action')) {
                    properties.skus.length.should.equal(2);
                }
            }
            done();
        });

        it('should process a promotion event', function (done) {
            window.heap = new MockHeapForwarder();

            mParticle.forwarder.init({
                applicationId: 'test-app-id',
                userIdentificationType: 'customerid',
            });

            mParticle.forwarder.process(promotionEvent);

            for (var i = 0; i < window.heap.events.length; i++) {
                var eventName = window.heap.events[i];
                var properties = window.heap.eventProperties[i];

                if (eventName === 'Item') {
                    properties.creative.should.be.ok;
                    properties.id.should.be.ok;
                    properties.position.should.be.ok;
                }

                if (eventName.includes('Promotion')) {
                    properties.skus.length.should.equal(2);
                    eventName.includes('Click').should.be.ok;
                }
            }
            done();
        });
    });

    it('should log page view', function (done) {
        // mParticle.forwarder.process({
        //     EventDataType: MessageType.PageView,
        //     EventName: 'test name',
        //     EventAttributes: {
        //         attr1: 'test1',
        //         attr2: 'test2'
        //     }
        // });
        //
        // window.MockXYZForwarder.trackCustomEventCalled.should.equal(true);
        // window.MockXYZForwarder.trackCustomName.should.equal('test name');
        // window.MockXYZForwarder.eventProperties[0].attr1.should.equal('test1');
        // window.MockXYZForwarder.eventProperties[0].attr2.should.equal('test2');

        done();
    });

    it('should log a product purchase commerce event', function (done) {
        // mParticle.forwarder.process({
        //     EventName: 'Test Purchase Event',
        //     EventDataType: MessageType.Commerce,
        //     EventCategory: EventType.ProductPurchase,
        //     ProductAction: {
        //         ProductActionType: ProductActionType.Purchase,
        //         ProductList: [
        //             {
        //                 Sku: '12345',
        //                 Name: 'iPhone 6',
        //                 Category: 'Phones',
        //                 Brand: 'iPhone',
        //                 Variant: '6',
        //                 Price: 400,
        //                 TotalAmount: 400,
        //                 CouponCode: 'coupon-code',
        //                 Quantity: 1
        //             }
        //         ],
        //         TransactionId: 123,
        //         Affiliation: 'my-affiliation',
        //         TotalAmount: 450,
        //         TaxAmount: 40,
        //         ShippingAmount: 10,
        //         CouponCode: null
        //     }
        // });
        //
        // window.MockXYZForwarder.trackCustomEventCalled.should.equal(true);
        // window.MockXYZForwarder.trackCustomName.should.equal('Purchase');
        //
        // window.MockXYZForwarder.eventProperties[0].Sku.should.equal('12345');
        // window.MockXYZForwarder.eventProperties[0].Name.should.equal('iPhone 6');
        // window.MockXYZForwarder.eventProperties[0].Category.should.equal('Phones');
        // window.MockXYZForwarder.eventProperties[0].Brand.should.equal('iPhone');
        // window.MockXYZForwarder.eventProperties[0].Variant.should.equal('6');
        // window.MockXYZForwarder.eventProperties[0].Price.should.equal(400);
        // window.MockXYZForwarder.eventProperties[0].TotalAmount.should.equal(400);
        // window.MockXYZForwarder.eventProperties[0].CouponCode.should.equal('coupon-code');
        // window.MockXYZForwarder.eventProperties[0].Quantity.should.equal(1);

        done();
    });

    it('should set customer id user identity on user identity change', function (done) {
        // var fakeUserStub = {
        //     getUserIdentities: function() {
        //         return {
        //             userIdentities: {
        //                 customerid: '123'
        //             }
        //         };
        //     },
        //     getMPID: function() {
        //         return 'testMPID';
        //     },
        //     setUserAttribute: function() {
        //
        //     },
        //     removeUserAttribute: function() {
        //
        //     }
        // };
        //
        // mParticle.forwarder.onUserIdentified(fakeUserStub);
        //
        // window.MockXYZForwarder.userId.should.equal('123');

        done();
    });
});
