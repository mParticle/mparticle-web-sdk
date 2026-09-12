/* eslint-disable no-undef*/

describe('Taplytics Forwarder', function () {
    var expandCommerceEvent = function(event) {
            return [{
                EventName: event.EventName,
                EventDataType: event.EventDataType,
                EventAttributes: event.EventAttributes
            }];
        },
        MessageType = {
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

        MockTaplytics = function() {
            var self = this;

            this.identifyCalled = false;

            this.appId = null;
            this.userId = null;
            this.userIdField = null;
            this.src = '';

            this.events = [];
            this.attributes = {};

            this.track = function(name, value, attributes) {
                this.events.push({name, value, attributes});
            };

            this.page = function (name, attributes) {
                this.events.push({name, attributes});
            };

            this.identify = function(attributes) {
                this.attributes = attributes;
                this.identifyCalled = true;
            };
        };

        var settings = {
            clientKey: '123456',
            appId: 'abcde',
            userIdField: 'customerId',
            apiKey: 'apiKey',
            taplyticsOptionCookieDomain: 'www.taplytics.com',
            taplyticsOptionTimeout: 4,
            taplyticsOptionUserBucketing: 'True'
        };

    before(function () {
        mParticle.EventType = EventType;
        mParticle.ProductActionType = ProductActionType;
        mParticle.PromotionType = PromotionActionType;
        mParticle.IdentityType = IdentityType;
        mParticle.CommerceEventType = CommerceEventType;
        mParticle.eCommerce = {};
        mParticle.eCommerce.expandCommerceEvent = expandCommerceEvent;
    });

    beforeEach(function() {
        window.Taplytics = new MockTaplytics();
        mParticle.forwarder.init(settings, reportService.cb, true, null, {
            gender: 'm'
        }, [{
            Identity: 'customerId',
            Type: IdentityType.CustomerId
        }, {
            Identity: 'email',
            Type: IdentityType.Email
        }, {
            Identity: 'facebook',
            Type: IdentityType.Facebook
        }], '1.1', 'My App');
    });

    it('should build the source link correctly', function(done) {
        var link = window.Taplytics.src;
        var splitLink = link.split('?');
        var host = splitLink[0];
        var query = splitLink[1];
        var params = query.split('&');

        host.should.equal('https://js.taplytics.com/jssdk/apiKey.min.js')

        var timeoutParam, cookieDomainParam, userBucketingParam;
        timeoutParam = params[0].split('=');
        cookieDomainParam = params[1].split('=');
        userBucketingParam = params[2].split('=');

        timeoutParam[1].should.equal('4');
        cookieDomainParam[1].should.equal('www.taplytics.com');
        userBucketingParam[1].should.equal('true');

        done();
    });

    it('should log page event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageView,
            EventName: 'Taplytics Page Event',
        });

        window.Taplytics.events[0].name.should.equal('Taplytics Page Event');

        done();
    });

    it('should log page event with attributes if they exist', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageView,
            EventName: 'Taplytics Page Event With Attributes',
            EventAttributes: {
                label: 'numValue',
                value: 10,
                category: 'category'
            }
        });

        window.Taplytics.events[0].name.should.equal('Taplytics Page Event With Attributes');
        window.Taplytics.events[0].attributes.label.should.equal('numValue');
        window.Taplytics.events[0].attributes.value.should.equal(10);
        window.Taplytics.events[0].attributes.category.should.equal('category');

        done();
    });

    it('should log a product purchase commerce event', function(done) {
        mParticle.forwarder.process({
            EventName: 'Test Purchase Event',
            EventDataType: MessageType.Commerce,
            EventCategory: EventType.ProductPurchase,
            ProductAction: {
                ProductActionType: ProductActionType.Purchase,
                ProductList: [
                    {
                        Sku: '12345',
                        Name: 'iPhone 6',
                        Category: 'Phones',
                        Price: 400,
                        TotalAmount: 400
                    },
                    {
                        Sku: '09876',
                        Name: 'iPhone Xs Max',
                        Variant: 'Xs Max',
                        Price: 1000,
                        TotalAmount: 1000,
                        Attributes: {"size": "huge", "notch": true}
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

        var events = window.Taplytics.events;

        events.length.should.equal(2);

        events[0].name.should.equal('Test Purchase Event');
        events[0].value.should.equal(400);
        events[0].attributes.ProductAttributes.Sku.should.equal('12345');
        events[0].attributes.ProductAttributes.Category.should.equal('Phones');

        events[1].name.should.equal('Test Purchase Event');
        events[1].value.should.equal(1000);
        events[1].attributes.ProductAttributes.size.should.equal('huge');
        events[1].attributes.ProductAttributes.notch.should.equal(true);
        events[1].attributes.ProductAttributes.Sku.should.equal('09876');
        events[1].attributes.ProductAttributes.Variant.should.equal('Xs Max');

        done();
    });

    it('should log add to cart events', function(done) {
        mParticle.forwarder.process({
            EventName: 'Test Add to Cart Event',
            EventDataType: MessageType.Commerce,
            EventCategory: CommerceEventType.ProductAddToCart,
            EventAttributes: {
                label: 'new product',
                value: 2,
                category: 'category'
            },
            ShoppingCart: {
                ProductList: [
                    'product 1',
                    'product 2'
                ]
            },
            ProductAction: {
                ProductList: [
                    'product 2'
                ]
            },
            CurrencyCode: "yen",
            EventIgnoreAttribute: 'some attribute'
        });

        var events = window.Taplytics.events;
        events.length.should.equal(1);

        events[0].name.should.equal('Test Add to Cart Event');
        (events[0].value === null).should.equal(true);
        events[0].attributes.ShoppingCart.length.should.equal(2);
        events[0].attributes.ProductAttributes.should.equal('product 2');
        events[0].attributes.EventAttributes.label.should.equal('new product');
        events[0].attributes.EventAttributes.value.should.equal(2);
        events[0].attributes.EventAttributes.category.should.equal('category');
        events[0].attributes.CurrencyCode.should.equal('yen');
        (events[0].attributes.EventIgnoreAttribute === undefined).should.equal(true);

        done();
    });

    it('should log remove from cart events', function(done) {
        mParticle.forwarder.process({
            EventName: 'Test Remove from Cart Event',
            EventDataType: MessageType.Commerce,
            EventCategory: CommerceEventType.ProductRemoveFromCart,
            EventAttributes: {
                label: 'new product',
                value: 2,
                category: 'category'
            },
            ShoppingCart: {
                ProductList: [
                    'product 1',
                ]
            },
            ProductAction: {
                ProductList: [
                    'product 2'
                ]
            },
            EventIgnoreAttribute: 'some attribute',
            CurrencyCode: 'cad'
        });

        var events = window.Taplytics.events;
        events.length.should.equal(1);

        events[0].name.should.equal('Test Remove from Cart Event');
        (events[0].value === null).should.equal(true);
        events[0].attributes.ShoppingCart.length.should.equal(1);
        events[0].attributes.ProductAttributes.should.equal('product 2');
        events[0].attributes.EventAttributes.label.should.equal('new product');
        events[0].attributes.EventAttributes.value.should.equal(2);
        events[0].attributes.EventAttributes.category.should.equal('category');
        events[0].attributes.CurrencyCode.should.equal('cad');
        (events[0].attributes.EventIgnoreAttribute === undefined).should.equal(true);

        done();
    });

    it('should log promotion click events', function(done) {
        mParticle.forwarder.process({
            EventName: 'Test Promotion Click Event',
            EventDataType: MessageType.Commerce,
            EventCategory: CommerceEventType.PromotionClick,
            EventAttributes: {
                'promotionID': 'id'
            },
            PromotionAction: {
                PromotionList: [
                    {
                        Creative: 'sale_banner',
                        Id: '74348',
                        Name: 'promotion for yuge sales'
                    }
                ]
            },
            EventIgnoreAttribute: 'some attribute',
            CurrencyCode: 'bison bucks'
        });

        var events = window.Taplytics.events;
        events.length.should.equal(1);

        events[0].name.should.equal('Test Promotion Click Event');
        (events[0].value === null).should.equal(true);
        events[0].attributes.Promotion.should.not.equal(null);
        events[0].attributes.Promotion.Creative.should.equal('sale_banner');
        events[0].attributes.Promotion.Name.should.equal('promotion for yuge sales');
        events[0].attributes.Promotion.Id.should.equal('74348');
        events[0].attributes.CurrencyCode.should.equal('bison bucks');
        events[0].attributes.EventAttributes.promotionID.should.equal('id');
        (events[0].attributes.EventIgnoreAttribute === undefined).should.equal(true);

        done();
    });

    it('should log product impression events', function(done) {
        mParticle.forwarder.process({
            EventName: 'Test Product Impression Event',
            EventDataType: MessageType.Commerce,
            EventCategory: CommerceEventType.ProductImpression,
            EventAttributes: {
                'impression': 'good'
            },
            ProductImpressions: [
                {
                    ProductImpressionList: 'suggested products list',
                    ProductList: [
                        'product 1',
                        'product 2'
                    ]
                }
            ],
            EventIgnoreAttribute: 'some attribute',
            CurrencyCode: 'bison bucks'
        });

        var events = window.Taplytics.events;
        events.length.should.equal(2);
        

        events[0].name.should.equal('Test Product Impression Event');
        (events[0].value === null).should.equal(true);
        events[0].attributes.ProductImpression.should.equal('suggested products list');
        events[0].attributes.ProductImpressionProduct.should.equal('product 1');
        events[0].attributes.CurrencyCode.should.equal('bison bucks');
        events[0].attributes.EventAttributes.impression.should.equal('good');
        (events[0].attributes.EventIgnoreAttribute === undefined).should.equal(true);

        events[1].name.should.equal('Test Product Impression Event');
        (events[1].value === null).should.equal(true);
        events[1].attributes.ProductImpression.should.equal('suggested products list');
        events[1].attributes.ProductImpressionProduct.should.equal('product 2');
        events[1].attributes.CurrencyCode.should.equal('bison bucks');
        events[1].attributes.EventAttributes.impression.should.equal('good');
        (events[1].attributes.EventIgnoreAttribute === undefined).should.equal(true);

        done();
    });

    it('should log other eCommerce events', function(done) {
        mParticle.forwarder.process({
            EventName: 'Test Refund Event',
            EventDataType: MessageType.Commerce,
            EventCategory: CommerceEventType.ProductRefund,
            EventAttributes: {
                'reason': 'i hate it'
            },
            ProductAction: {
                ProductList: [
                    'product 1'
                ]
            },
            EventIgnoreAttribute: 'some attribute',
            CurrencyCode: 'pennies'
        });

        var events = window.Taplytics.events;
        events.length.should.equal(1);

        events[0].name.should.equal('Test Refund Event');
        (events[0].value === null).should.equal(true);
        events[0].attributes.EventAttributes.reason.should.equal('i hate it');
        events[0].attributes.ProductAttributes.should.equal('product 1');
        events[0].attributes.CurrencyCode.should.equal('pennies');
        (events[0].attributes.EventIgnoreAttribute === undefined).should.equal(true);

        done();
    });

    it('should log page event', function(done) {
        mParticle.forwarder.process({
            EventName: 'Test Event',
            EventDataType: MessageType.PageEvent
        });

        var event = window.Taplytics.events;
        
        event.length.should.equal(1);
        event[0].name.should.equal('Test Event');

        done();
    });

    it('should log page event with attributes', function(done) {
        mParticle.forwarder.process({
            EventName: 'Test Event',
            EventDataType: MessageType.PageEvent,
            EventAttributes: {
                key: "value"
            }
        });

        var event = window.Taplytics.events;
        
        event.length.should.equal(1);
        event[0].name.should.equal('Test Event');
        event[0].attributes.key.should.equal('value');

        done();
    });

    it('should set user identity (user_id) when directly called', function(done) {

        mParticle.forwarder.setUserIdentity('100035', IdentityType.CustomerId);

        window.Taplytics.attributes.user_id.should.equal('100035')

        done();
    });

    it('should set user identity (email) when directly called', function(done) {
        mParticle.forwarder.setUserIdentity('abc@def.com', IdentityType.Email);

        window.Taplytics.attributes.email.should.equal('abc@def.com')

        done();
    });

    it('should not set user identity (others) when directly called', function(done) {
        mParticle.forwarder.setUserIdentity('other', IdentityType.Other);
        mParticle.forwarder.setUserIdentity('fb_id', IdentityType.Facebook);
        mParticle.forwarder.setUserIdentity('@twitter', IdentityType.Twitter);
        mParticle.forwarder.setUserIdentity('google', IdentityType.Google);
        mParticle.forwarder.setUserIdentity('microsoft', IdentityType.Microsoft);
        mParticle.forwarder.setUserIdentity('bruh@yahoo.ca', IdentityType.Yahoo);
        mParticle.forwarder.setUserIdentity('ali.as', IdentityType.Alias);

        window.Taplytics.identifyCalled.should.equal(false);

        done();
    });

    it('should set user attributes when directly called', function(done) {
        mParticle.forwarder.setUserAttribute('custom', 'value');
        window.Taplytics.attributes.custom.should.equal('value');
        window.Taplytics.identifyCalled.should.equal(true);

        done();
    });

    it('should remove user attributes', function(done) {

        mParticle.forwarder.removeUserAttribute('name');
        (window.Taplytics.attributes.name === null).should.equal(true);

        done();
    });

    it('should call identify if mpUser has email', function(done) {
        var mParticleUser = {
            getUserIdentities: function() {return {
                userIdentities: {
                    email: 'test@email.com'
                }
            }}
        };

        mParticle.forwarder.onUserIdentified(mParticleUser);
        window.Taplytics.identifyCalled.should.equal(true);
        window.Taplytics.attributes.email.should.equal('test@email.com')

        done();
    });

    it('should call identify if mpUser has customerId', function(done) {
        var mParticleUser = {
            getUserIdentities: function() {return {
                userIdentities: {
                    customerid: 'custyid'
                }
            }}
        };

        mParticle.forwarder.onUserIdentified(mParticleUser);
        window.Taplytics.identifyCalled.should.equal(true);
        window.Taplytics.attributes.user_id.should.equal('custyid')
        
        done();
    });

    it('should call identify if mpUser has customerId and email', function(done) {
        var mParticleUser = {
            getUserIdentities: function() {return {
                userIdentities: {
                    customerid: 'custyid',
                    email: 'test@email.com'
                }
            }}
        };

        mParticle.forwarder.onUserIdentified(mParticleUser);
        window.Taplytics.identifyCalled.should.equal(true);
        window.Taplytics.attributes.user_id.should.equal('custyid')
        window.Taplytics.attributes.email.should.equal('test@email.com')
        
        done();
    });

    it('should not call identify if mpUser is empty', function(done) {
        var mParticleUser = {
            getUserIdentities: function() {return {
                userIdentities: {
                }
            }}
        };

        mParticle.forwarder.onUserIdentified(mParticleUser);
        window.Taplytics.identifyCalled.should.equal(false);
        
        done();
    });

});
