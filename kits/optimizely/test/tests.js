/* eslint-disable no-undef*/
describe('Optimizely Forwarder', function () {
    // -------------------DO NOT EDIT ANYTHING BELOW THIS LINE-----------------------
    var MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            Commerce: 16
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
            ProductPurchase: 16,
            getName: function () {
                return 'blahblah';
            }
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
            getName: function () {return 'CustomerID';}
        },
        PromotionActionType = {
            Unknown: 0,
            PromotionView: 1,
            PromotionClick: 2
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
        reportService = new ReportingService(),

// -------------------DO NOT EDIT ANYTHING ABOVE THIS LINE-----------------------
// -------------------START EDITING BELOW:-----------------------
        OptimizelyMockForwarder = function() {
            var self = this;
            this.eventQueue = [];
            this.push = function(event) {
                self.eventQueue.push(event);
            };
            this.get = function() {
                return {
                    pages: {
                        123: {apiName: 'test name', id: 123}},
                    events: {
                        234: {apiName: 'Test Event', id: 234},
                        345: {apiName: 'RevenueTestEventName', id: 345},
                        456: {apiName: 'eCommerce - purchase - Total', id: 456},
                        567: {apiName: 'eCommerce - purchase - Item', id: 567},
                        789: {apiName: 'eCommerce - add_to_cart - Item', id: 789},
                        890: {apiName: 'eCommerce - click - Item', id: 890}
                    }
                };
            };
        },
        // We mock Identity in Full Stack only because FS includes Identity Calls, whereas Web X doesn't
        OptimizelyFullStackMockForwarder = function() {
            window.fullStackEventQueue = [];
            window.mParticle.Identity = {
                getCurrentUser: function() {
                    return {
                        getUserIdentities: function() {
                           return {userIdentities: {other3: '123456'}};
                        },
                        getAllUserAttributes: function() {
                            return {};
                        },
                        getMPID: function() {
                            return '';
                        },
                        getConsentState: function() {
                            return {};
                        }
                    }
                 }
            },
            this.track = function(eventKey, userId, attributes, eventTags) {
                var optimizelyFSTrackedEvent = {
                    eventKey: eventKey,
                    userId: userId,
                    userAttributes: attributes,
                    eventTags: eventTags
                };
                window.fullStackEventQueue.push(optimizelyFSTrackedEvent);
            };
        };        

    before(function () {
        mParticle.init('fake-api-key', {workspaceToken: 'faketoken', requestConfig: false});
        mParticle.EventType = EventType;
        mParticle.ProductActionType = ProductActionType;
        mParticle.PromotionType = PromotionActionType;
        mParticle.IdentityType = IdentityType;
        mParticle.CommerceEventType = CommerceEventType;
    });

    describe('X Web', function () {

        beforeEach(function() {
            window.optimizely = new OptimizelyMockForwarder();
            // Include any specific settings that is required for initializing your SDK here
            var sdkSettings = {
                projectId: '123456',
                useFullStack: false
            };
            // You may require userAttributes or userIdentities to be passed into initialization
            var userAttributes = {
                color: 'green'
            };
            var userIdentities = [{
                Identity: 'customerId',
                Type: IdentityType.CustomerId
            }, {
                Identity: 'email',
                Type: IdentityType.Email
            }, {
                Identity: 'facebook',
                Type: IdentityType.Facebook
            }];

            mParticle.forwarder.init(sdkSettings, reportService.cb, true, null, userAttributes, userIdentities);
        });

        it('should log a custom event', function(done) {
            mParticle.forwarder.process({
                EventDataType: MessageType.PageEvent,
                EventName: 'Test Event',
                EventAttributes: {
                    label: 'label',
                    value: 200,
                    category: 'category'
                }
            });

            window.optimizely.eventQueue.length.should.equal(1);
            window.optimizely.eventQueue[0].type.should.equal('event');
            window.optimizely.eventQueue[0].eventName.should.equal('Test Event');
            window.optimizely.eventQueue[0].tags.label.should.equal('label');
            window.optimizely.eventQueue[0].tags.value.should.equal(200);
            window.optimizely.eventQueue[0].tags.category.should.equal('category');

            done();
        });

        it('should log page view', function(done) {
            mParticle.forwarder.process({
                EventDataType: MessageType.PageView,
                EventName: 'test name',
                EventAttributes: {
                    attr1: 'test1',
                    attr2: 'test2'
                }
            });

            window.optimizely.eventQueue.length.should.equal(1);
            window.optimizely.eventQueue[0].type.should.equal('page');
            window.optimizely.eventQueue[0].pageName.should.equal('test name');
            window.optimizely.eventQueue[0].tags.attr1.should.equal('test1');
            window.optimizely.eventQueue[0].tags.attr2.should.equal('test2');

            done();
        });

        it('should log a standard commerce event as default mParticle event name if no customFlags are passed', function(done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - Purchase',
                EventDataType: MessageType.Commerce,
                EventCategory: CommerceEventType.ProductPurchase,
                ProductAction: {
                    ProductActionType: ProductActionType.Purchase,
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
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450,
                    TaxAmount: 40,
                    ShippingAmount: 10,
                    CouponCode: null
                }
            });

            window.optimizely.eventQueue.length.should.equal(2);
            window.optimizely.eventQueue[0].eventName.should.equal('eCommerce - purchase - Total');
            window.optimizely.eventQueue[0].type.should.equal('event');
            window.optimizely.eventQueue[0].tags.revenue.should.equal(45000);
            window.optimizely.eventQueue = [];

            mParticle.forwarder.process({
                EventName: 'eCommerce - AddToCart',
                EventDataType: MessageType.Commerce,
                EventCategory: CommerceEventType.ProductPurchase,
                ProductAction: {
                    ProductActionType: ProductActionType.AddToCart,
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
                    ]
                }
            });

            window.optimizely.eventQueue.length.should.equal(2);
            window.optimizely.eventQueue[0].eventName.should.equal('eCommerce - add_to_cart - Item');
            window.optimizely.eventQueue[0].type.should.equal('event');
            Should(window.optimizely.eventQueue[0].tags.revenue).not.be.ok();

            done();
        });

        it('should log a product purchase commerce with custom name if customFlag of Optimizely.EventName is passed', function(done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - Purchase',
                CustomFlags: {
                    'Optimizely.EventName': 'RevenueTestEventName'
                },
                EventDataType: MessageType.Commerce,
                EventCategory: CommerceEventType.ProductPurchase,
                ProductAction: {
                    ProductActionType: ProductActionType.Purchase,
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
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450,
                    TaxAmount: 40,
                    ShippingAmount: 10,
                    CouponCode: null
                }
            });
            window.optimizely.eventQueue.length.should.equal(2);
            window.optimizely.eventQueue[0].eventName.should.equal('RevenueTestEventName');
            window.optimizely.eventQueue[0].type.should.equal('event');
            window.optimizely.eventQueue[0].tags.revenue.should.equal(45000);
            window.optimizely.eventQueue[1].eventName.should.equal('eCommerce - purchase - Item');
            window.optimizely.eventQueue[1].type.should.equal('event');
            window.optimizely.eventQueue[1].tags.Id.should.equal('12345');
            window.optimizely.eventQueue[1].tags.Name.should.equal('iPhone 6');
            window.optimizely.eventQueue[1].tags.Variant.should.equal('6');
            Should(window.optimizely.eventQueue[1].tags.revenue).not.be.ok();

            done();
        });

        it('should log non-product purchases using mParticle default expanded commerce event name', function(done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - PromotionClick',
                EventDataType: MessageType.Commerce,
                EventCategory: mParticle.CommerceEventType.PromotionClick,
                PromotionAction: {
                    PromotionActionType: mParticle.PromotionType.PromotionClick,
                    PromotionList: [{
                        Creative: 'creative',
                        Id: 'id',
                        Name: 'promotion1'}]
                }
            });
            window.optimizely.eventQueue.length.should.equal(1);
            window.optimizely.eventQueue[0].eventName.should.equal('eCommerce - click - Item');
            window.optimizely.eventQueue[0].type.should.equal('event');
            window.optimizely.eventQueue[0].tags.Creative.should.equal('creative');
            window.optimizely.eventQueue[0].tags.Id.should.equal('id');
            window.optimizely.eventQueue[0].tags.Name.should.equal('promotion1');

            window.optimizely.eventQueue = [];


            done();
        });

        it('should log a value event to Optimizely', function(done) {
            mParticle.forwarder.process({
                CustomFlags: {
                    'Optimizely.Value': 5
                },
                EventDataType: MessageType.PageEvent,
                EventName: 'Test Event',
                EventAttributes: {
                    label: 'label',
                    category: 'category'
                }
            });

            window.optimizely.eventQueue.length.should.equal(1);
            window.optimizely.eventQueue[0].type.should.equal('event');
            window.optimizely.eventQueue[0].eventName.should.equal('Test Event');
            window.optimizely.eventQueue[0].tags.label.should.equal('label');
            window.optimizely.eventQueue[0].tags.value.should.equal(5);
            window.optimizely.eventQueue[0].tags.category.should.equal('category');

            done();
        });

        it('should set and remove user attributes properly', function(done) {
            mParticle.forwarder.setUserAttribute('key', 'value');

            window.optimizely.eventQueue.length.should.equal(1);
            window.optimizely.eventQueue[0].type.should.equal('user');
            window.optimizely.eventQueue[0].attributes.key.should.equal('value');

            mParticle.forwarder.removeUserAttribute('key');

            window.optimizely.eventQueue.length.should.equal(2);
            window.optimizely.eventQueue[1].type.should.equal('user');
            (window.optimizely.eventQueue[1].attributes.key === null).should.equal(true);

            done();
        });

});

    // Optimizely Full Stack Tests
    describe('Full Stack', function () {
        beforeEach(function() {
            window.optimizelyFSTrackedEvent = {};
            window.optimizelyClientInstance = new OptimizelyFullStackMockForwarder();
            // Mock Optimizely Full Stack Datafile
            window.optimizelyDatafile =
            {
                'version': '4',
                'projectId': '18390990327',
                'variables': [],
                'featureFlags': [
                  {
                    'experimentIds': [],
                    'rolloutId': '18375930463',
                    'variables': [
                      {
                        'defaultValue': '',
                        'type': 'string',
                        'id': '18375860245',
                        'key': 'f2variable1'
                      }
                    ],
                    'id': '18360310384',
                    'key': 'featurename2'
                  },
                  {
                    'experimentIds': [],
                    'rolloutId': '18389000125',
                    'variables': [
                      {
                        'defaultValue': '',
                        'type': 'string',
                        'id': '18358530123',
                        'key': 'f1variable1'
                      }
                    ],
                    'id': '18381870404',
                    'key': 'featurename1'
                  }
                ],
                'experiments': [],
                'accountId': '7015510640',
                'events': [
                  {
                    'experimentIds': [],
                    'id': '18356890341',
                    'key': 'eventKey2'
                  },
                  {
                    'experimentIds': [],
                    'id': '18391220198',
                    'key': 'eventKey1'
                  },
                   {
                        'experimentIds': [],
                        'id': 'anotherid',
                        'key': 'eCommerce - purchase - Total',
                    },
                   {
                        'experimentIds': [],
                        'id': 'anotherid2',
                        'key': 'eCommerce - purchase - Item',
                    },
                ]
              }
            // Include any specific settings that are required for initializing your SDK here
            var sdkSettings = {
                projectId: 'LYLgZJqZzFKd5SaNLcQRc',
                useFullStack: 'True',
                userIdField: 'other3',
            };
            // You may require userAttributes or userIdentities to be passed into initialization
            var userAttributes = {
                color: 'green'
            };
            var userIdentities = [{
                Identity: 'customerId',
                Type: IdentityType.CustomerId
            }, {
                Identity: 'email',
                Type: IdentityType.Email
            }, {
                Identity: 'facebook',
                Type: IdentityType.Facebook
            }];

            mParticle.forwarder.init(sdkSettings, reportService.cb, true, null, userAttributes, userIdentities);
        });

        it('should track a custom event that exists in the dataFile', function(done) {
            mParticle.forwarder.process({
                EventDataType: MessageType.PageEvent,
                EventName: 'eventKey1',
                EventAttributes: {
                    value: 200,
                    category: 'category'
                },
            });

            window.fullStackEventQueue[0].eventKey.should.equal('eventKey1');
            window.fullStackEventQueue[0].eventTags.value.should.equal(200);
            window.fullStackEventQueue[0].eventTags.category.should.equal('category');
            window.fullStackEventQueue[0].userAttributes.color.should.equal('green');
            window.fullStackEventQueue[0].userId.should.equal('123456');
            done();
        });

        it('should not track a custom event if it does not exist in the dataFile', function(done) {
            mParticle.forwarder.process({
                EventDataType: MessageType.PageEvent,
                EventName: 'invalidEventKey',
                EventAttributes: {
                    value: 200,
                    category: 'category'
                },
            });

            window.fullStackEventQueue.length.should.equal(0);
            done();
        });

        it('should track a value event to Optimizely Full Stack', function(done) {
            mParticle.forwarder.process({
                CustomFlags: {
                    'OptimizelyFullStack.Value': 5
                },
                EventDataType: MessageType.PageEvent,
                EventName: 'eventKey1',
                EventAttributes: {
                    label: 'label',
                    category: 'category'
                }
            });

            window.fullStackEventQueue[0].eventKey.should.equal('eventKey1');
            window.fullStackEventQueue[0].eventTags.label.should.equal('label');
            window.fullStackEventQueue[0].eventTags.value.should.equal(5);
            window.fullStackEventQueue[0].eventTags.category.should.equal('category');
            done();
        });

        it('should set and remove user attributes properly', function(done) {

            mParticle.forwarder.setUserAttribute('key', 'value');

            mParticle.forwarder.process({
                EventDataType: MessageType.PageEvent,
                EventName: 'eventKey1',
                EventAttributes: {
                    label: 'label',
                    category: 'category'
                }
            });

            window.fullStackEventQueue.length.should.equal(1);
            window.fullStackEventQueue[0].userAttributes.key.should.equal('value');

            mParticle.forwarder.removeUserAttribute('key');

            (window.fullStackEventQueue[0].userAttributes.key === undefined).should.equal(true);
            done();
        });

        it('should set userId to deviceId on an event if userId doesnt exist', function(done) {
            var sdkSettings = {
                projectId: 'LYLgZJqZzFKd5SaNLcQRc',
                useFullStack: 'True',
            };
            var userAttributes = {
                color: 'green'
            };
            var userIdentities = [{
                Identity: 'customerId',
                Type: IdentityType.CustomerId
            }, {
                Identity: 'email',
                Type: IdentityType.Email
            }, {
                Identity: 'facebook',
                Type: IdentityType.Facebook
            }];            

            mParticle.forwarder.init(sdkSettings, reportService.cb, true, null, userAttributes, userIdentities);

            mParticle.forwarder.process({
                EventDataType: MessageType.PageEvent,
                EventName: 'eventKey1',
                EventAttributes: {
                    label: 'label',
                    category: 'category'
                }
            });

            window.fullStackEventQueue[0].eventKey.should.equal('eventKey1');
            window.fullStackEventQueue[0].userId.should.equal(window.mParticle.getDeviceId());
            done();
        });

        it('should track a product purchase commerce event with custom name if customFlag of OptimizelyFullStack.EventName is passed', function(done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - Purchase',
                CustomFlags: {
                    'OptimizelyFullStack.EventName': 'eventKey2'
                },
                EventDataType: MessageType.Commerce,
                EventCategory: CommerceEventType.ProductPurchase,
                ProductAction: {
                    ProductActionType: ProductActionType.Purchase,
                    ProductList: [
                        {
                            Sku: '12345',
                            Category: 'Phones',
                            Brand: 'iPhone 6',
                            Variant: '6',
                            Price: 400,
                            TotalAmount: 400,
                            CouponCode: 'coupon-code',
                            Quantity: 1
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450,
                    TaxAmount: 40,
                    ShippingAmount: 10,
                    CouponCode: null
                }
            });

            window.fullStackEventQueue[0].eventKey.should.equal('eventKey2');
            window.fullStackEventQueue[0].eventTags.revenue.should.equal(45000);
            window.fullStackEventQueue[1].eventTags.Id.should.equal('12345');
            window.fullStackEventQueue[1].eventTags.Brand.should.equal('iPhone 6');
            window.fullStackEventQueue[1].eventTags.Variant.should.equal('6');
            Should(window.fullStackEventQueue[1].eventTags.revenue).not.be.ok();
            done();
        });

        it('should track commerce events if the eventKeys are named after mParticle commerce event names in the dataFile and no custom flags are passed', function(done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - Purchase',
                CustomFlags: {},
                EventDataType: MessageType.Commerce,
                EventCategory: CommerceEventType.ProductPurchase,
                ProductAction: {
                    ProductActionType: ProductActionType.Purchase,
                    ProductList: [
                        {
                            Sku: '12345',
                            Category: 'Phones',
                            Brand: 'iPhone 6',
                            Variant: '6',
                            Price: 400,
                            TotalAmount: 400,
                            CouponCode: 'coupon-code',
                            Quantity: 1,
                        },
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450,
                    TaxAmount: 40,
                    ShippingAmount: 10,
                    CouponCode: null,
                },
            });

            window.fullStackEventQueue[0].eventKey.should.equal('eCommerce - purchase - Total');
            window.fullStackEventQueue[0].eventTags.revenue.should.equal(45000);
            window.fullStackEventQueue[1].eventKey.should.equal('eCommerce - purchase - Item');
            window.fullStackEventQueue[1].eventTags.Id.should.equal('12345');
            window.fullStackEventQueue[1].eventTags.Brand.should.equal(
                'iPhone 6'
            );
            window.fullStackEventQueue[1].eventTags.Variant.should.equal('6');
            Should(window.fullStackEventQueue[1].eventTags.revenue).not.be.ok();
            done();
        });

        it('should not track a commerce event that is not part of the dataFile', function(done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - AddToCart',
                CustomFlags: {},
                EventDataType: MessageType.Commerce,
                EventCategory: CommerceEventType.AddToCart,
                ProductAction: {
                    ProductActionType: ProductActionType.AddToCart,
                    ProductList: [
                        {
                            Sku: '12345',
                            Category: 'Phones',
                            Brand: 'iPhone 6',
                            Variant: '6',
                            Price: 400,
                            TotalAmount: 400,
                            CouponCode: 'coupon-code',
                            Quantity: 1,
                        },
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450,
                    TaxAmount: 40,
                    ShippingAmount: 10,
                    CouponCode: null,
                },
            });

            window.fullStackEventQueue.length.should.equal(0);

            done();
        });
    });
});
