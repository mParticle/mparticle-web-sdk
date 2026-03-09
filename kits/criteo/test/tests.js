/* eslint-disable no-undef*/
describe('Criteo Integration', function () {
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
        reportService = new ReportingService();

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
        window.criteo_q = [];
        mParticle.forwarder.init({
            apiKey: 'abcde'
        }, reportService, true);
    });

    it('should log view basket event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            EventCategory: mParticle.CommerceEventType.ProductAddToCart,
            EventName: 'Test Add To Cart',
            EventAttributes: {
                label: 'label',
                value: 200,
                category: 'category'
            },
            ProductAction: {
                ProductList: [
                    {
                        Sku: '12345',
                        Price: 400,
                        Quantity: 1
                    },
                    {
                        Sku: '23456',
                        Price: 500,
                        Quantity: 2
                    }
                ]
            }
        });

        criteo_q[0].event.should.equal('setAccount');
        criteo_q[0].account.should.equal('abcde');

        criteo_q[1].event.should.equal('setSiteType');
        criteo_q[1].type.should.equal('d');

        criteo_q[2].event.should.equal('viewBasket');
        criteo_q[2].item[0].id.should.equal('12345');
        criteo_q[2].item[0].price.should.equal(400);
        criteo_q[2].item[0].quantity.should.equal(1);
        criteo_q[2].item[1].id.should.equal('23456');
        criteo_q[2].item[1].price.should.equal(500);
        criteo_q[2].item[1].quantity.should.equal(2);

        criteo_q[3].event.should.equal('setData');
        criteo_q[3].category.should.equal('category');
        criteo_q[3].label.should.equal('label');
        criteo_q[3].value.should.equal(200);

        done();
    });

    it('should log view product event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            EventCategory: mParticle.CommerceEventType.ProductViewDetail,
            EventName: 'Test Product Detail',
            EventAttributes: {
                label: 'label',
                value: 200,
                category: 'category'
            },
            ProductAction: {
                ProductList: [
                    {
                        Sku: '12345',
                        Price: 400,
                        Quantity: 1
                    },
                    {
                        Sku: '23456',
                        Price: 500,
                        Quantity: 2
                    }
                ]
            }
        });

        criteo_q[0].event.should.equal('setAccount');
        criteo_q[0].account.should.equal('abcde');

        criteo_q[1].event.should.equal('setSiteType');
        criteo_q[1].type.should.equal('d');

        criteo_q[2].event.should.equal('viewItem');
        criteo_q[2].item[0].should.equal('12345');
        criteo_q[2].item[1].should.equal('23456');

        criteo_q[3].event.should.equal('setData');
        criteo_q[3].category.should.equal('category');
        criteo_q[3].label.should.equal('label');
        criteo_q[3].value.should.equal(200);

        done();
    });

    it('should log view product list event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            EventCategory: mParticle.CommerceEventType.ProductImpression,
            EventName: 'Test Product Detail',
            EventAttributes: {
                label: 'label',
                value: 200,
                category: 'category'
            },
            ProductImpressions: [
                { ProductList: [
                    {
                        Sku: '12345',
                        Price: 400,
                        Quantity: 1
                    },
                    {
                        Sku: '23456',
                        Price: 500,
                        Quantity: 2
                    }
                ] },
                { ProductList: [
                    {
                        Sku: '34567',
                        Price: 100,
                        Quantity: 1
                    },
                    {
                        Sku: '45678',
                        Price: 500,
                        Quantity: 2
                    }
                ] }
            ]
        });

        criteo_q[0].event.should.equal('setAccount');
        criteo_q[0].account.should.equal('abcde');

        criteo_q[1].event.should.equal('setSiteType');
        criteo_q[1].type.should.equal('d');

        criteo_q[2].event.should.equal('viewList');
        criteo_q[2].item[0].should.equal('12345');
        criteo_q[2].item[1].should.equal('23456');
        criteo_q[2].item[2].should.equal('34567');
        criteo_q[2].item[3].should.equal('45678');

        criteo_q[3].event.should.equal('setData');
        criteo_q[3].category.should.equal('category');
        criteo_q[3].label.should.equal('label');
        criteo_q[3].value.should.equal(200);

        done();
    });

    it('should log track transaction event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            EventCategory: mParticle.CommerceEventType.ProductPurchase,
            EventName: 'Test Product Detail',
            EventAttributes: {
                label: 'label',
                value: 200,
                category: 'category'
            },
            ProductAction: {
                TransactionId: 'id123',
                ProductList: [
                    {
                        Sku: '12345',
                        Price: 400,
                        Quantity: 1
                    },
                    {
                        Sku: '23456',
                        Price: 500,
                        Quantity: 2
                    }
                ]
            }
        });

        criteo_q[0].event.should.equal('setAccount');
        criteo_q[0].account.should.equal('abcde');

        criteo_q[1].event.should.equal('setSiteType');
        criteo_q[1].type.should.equal('d');

        criteo_q[2].event.should.equal('trackTransaction');
        criteo_q[2].item[0].id.should.equal('12345');
        criteo_q[2].item[0].price.should.equal(400);
        criteo_q[2].item[0].quantity.should.equal(1);
        criteo_q[2].item[1].id.should.equal('23456');
        criteo_q[2].item[1].price.should.equal(500);
        criteo_q[2].item[1].quantity.should.equal(2);

        criteo_q[3].event.should.equal('setData');
        criteo_q[3].category.should.equal('category');
        criteo_q[3].label.should.equal('label');
        criteo_q[3].value.should.equal(200);

        done();
    });

    it('should log view home event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageView,
            EventName: 'homepage',
            EventAttributes: {
                label: 'label',
                value: 200,
                category: 'category'
            },
            CustomFlags: {
                CRITEO_VIEW_HOMEPAGE: true
            }
        });

        criteo_q[0].event.should.equal('setAccount');
        criteo_q[0].account.should.equal('abcde');

        criteo_q[1].event.should.equal('setSiteType');
        criteo_q[1].type.should.equal('d');

        criteo_q[2].event.should.equal('viewHome');

        criteo_q[3].event.should.equal('setData');
        criteo_q[3].category.should.equal('category');
        criteo_q[3].label.should.equal('label');
        criteo_q[3].value.should.equal(200);

        done();
    });

    it('should not log a non-homepage event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageView,
            EventName: 'test event',
            EventAttributes: {
                label: 'label',
                value: 200,
                category: 'category'
            }
        });

        criteo_q.length.should.equal(0);

        done();
    });

    it('should set setSiteType of m or t when these are set as event attributes', function(done) {
        mParticle.forwarder.init({
            apiKey: 'abcde'
        }, reportService, true, null, null, null, null, null, {CRITEO_SITETYPE: 'm'});

        mParticle.forwarder.process({
            EventDataType: MessageType.PageView,
            EventName: 'homepage',
            CustomFlags: {
                CRITEO_VIEW_HOMEPAGE: true
            }
        });

        criteo_q[0].event.should.equal('setAccount');
        criteo_q[0].account.should.equal('abcde');

        criteo_q[1].event.should.equal('setSiteType');
        criteo_q[1].type.should.equal('m');

        criteo_q[2].event.should.equal('viewHome');

        criteo_q = [];

        mParticle.forwarder.init({
            apiKey: 'abcde'
        }, reportService, true, null, null, null, null, null, {CRITEO_SITETYPE: 't'});
        mParticle.forwarder.process({
            EventDataType: MessageType.PageView,
            EventName: 'homepage',
            CustomFlags: {
                CRITEO_VIEW_HOMEPAGE: true
            }
        });

        criteo_q[0].event.should.equal('setAccount');
        criteo_q[0].account.should.equal('abcde');

        criteo_q[1].event.should.equal('setSiteType');
        criteo_q[1].type.should.equal('t');

        criteo_q[2].event.should.equal('viewHome');

        done();
    });

    it('should set customer id and customer emails', function(done) {
        mParticle.forwarder.setUserIdentity('customerid', mParticle.IdentityType.CustomerId);
        mParticle.forwarder.setUserIdentity('email@test.com', mParticle.IdentityType.Email);
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            EventCategory: mParticle.CommerceEventType.ProductAddToCart,
            EventName: 'Test Add To Cart',
            EventAttributes: {
                label: 'label',
                value: 200,
                category: 'category'
            },
            ProductAction: {
                ProductList: [
                    {
                        Sku: '12345',
                        Price: 400,
                        Quantity: 1
                    },
                    {
                        Sku: '23456',
                        Price: 500,
                        Quantity: 2
                    }
                ]
            }
        });

        criteo_q[0].event.should.equal('setAccount');
        criteo_q[0].account.should.equal('abcde');

        criteo_q[1].event.should.equal('setSiteType');
        criteo_q[1].type.should.equal('d');

        criteo_q[2].event.should.equal('setEmail');
        criteo_q[2].email.should.equal('email@test.com');

        criteo_q[3].event.should.equal('setCustomerId');
        criteo_q[3].id.should.equal('customerid');

        criteo_q[4].event.should.equal('viewBasket');
        criteo_q[4].item[0].id.should.equal('12345');
        criteo_q[4].item[0].price.should.equal(400);
        criteo_q[4].item[0].quantity.should.equal(1);
        criteo_q[4].item[1].id.should.equal('23456');
        criteo_q[4].item[1].price.should.equal(500);
        criteo_q[4].item[1].quantity.should.equal(2);

        criteo_q[5].event.should.equal('setData');
        criteo_q[5].category.should.equal('category');
        criteo_q[5].label.should.equal('label');
        criteo_q[5].value.should.equal(200);

        done();
    });

    it('should set customer id only', function(done) {
        mParticle.forwarder.setUserIdentity('customerid', mParticle.IdentityType.CustomerId);

        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            EventCategory: mParticle.CommerceEventType.ProductAddToCart,
            EventName: 'Test Add To Cart',
            EventAttributes: {
                label: 'label',
                value: 200,
                category: 'category'
            },
            ProductAction: {
                ProductList: [
                    {
                        Sku: '12345',
                        Price: 400,
                        Quantity: 1
                    },
                    {
                        Sku: '23456',
                        Price: 500,
                        Quantity: 2
                    }
                ]
            }
        });

        criteo_q[0].event.should.equal('setAccount');
        criteo_q[0].account.should.equal('abcde');

        criteo_q[1].event.should.equal('setSiteType');
        criteo_q[1].type.should.equal('d');

        criteo_q[2].event.should.equal('setCustomerId');
        criteo_q[2].id.should.equal('customerid');

        criteo_q[3].event.should.equal('viewBasket');
        criteo_q[3].item[0].id.should.equal('12345');
        criteo_q[3].item[0].price.should.equal(400);
        criteo_q[3].item[0].quantity.should.equal(1);
        criteo_q[3].item[1].id.should.equal('23456');
        criteo_q[3].item[1].price.should.equal(500);
        criteo_q[3].item[1].quantity.should.equal(2);

        criteo_q[4].event.should.equal('setData');
        criteo_q[4].category.should.equal('category');
        criteo_q[4].label.should.equal('label');
        criteo_q[4].value.should.equal(200);

        done();
    });

    it('should set customer email only and have subsequent requests continue to have email', function(done) {
        mParticle.forwarder.setUserIdentity('email@test.com', mParticle.IdentityType.Email);

        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            EventCategory: mParticle.CommerceEventType.ProductAddToCart,
            EventName: 'Test Add To Cart',
            EventAttributes: {
                label: 'label',
                value: 200,
                category: 'category'
            },
            ProductAction: {
                ProductList: [
                    {
                        Sku: '12345',
                        Price: 400,
                        Quantity: 1
                    },
                    {
                        Sku: '23456',
                        Price: 500,
                        Quantity: 2
                    }
                ]
            }
        });

        criteo_q[0].event.should.equal('setAccount');
        criteo_q[0].account.should.equal('abcde');

        criteo_q[1].event.should.equal('setSiteType');
        criteo_q[1].type.should.equal('d');

        criteo_q[2].event.should.equal('setEmail');
        criteo_q[2].email.should.equal('email@test.com');

        criteo_q[3].event.should.equal('viewBasket');
        criteo_q[3].item[0].id.should.equal('12345');
        criteo_q[3].item[0].price.should.equal(400);
        criteo_q[3].item[0].quantity.should.equal(1);
        criteo_q[3].item[1].id.should.equal('23456');
        criteo_q[3].item[1].price.should.equal(500);
        criteo_q[3].item[1].quantity.should.equal(2);

        criteo_q[4].event.should.equal('setData');
        criteo_q[4].category.should.equal('category');
        criteo_q[4].label.should.equal('label');
        criteo_q[4].value.should.equal(200);

        criteo_q = [];

        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            EventCategory: mParticle.CommerceEventType.ProductAddToCart,
            EventName: 'Test Add To Cart',
            EventAttributes: {
                label: 'label',
                value: 200,
                category: 'category'
            },
            ProductAction: {
                ProductList: [
                    {
                        Sku: '12345',
                        Price: 400,
                        Quantity: 1
                    },
                    {
                        Sku: '23456',
                        Price: 500,
                        Quantity: 2
                    }
                ]
            }
        });

        criteo_q[0].event.should.equal('setAccount');
        criteo_q[0].account.should.equal('abcde');

        criteo_q[1].event.should.equal('setSiteType');
        criteo_q[1].type.should.equal('d');

        criteo_q[2].event.should.equal('setEmail');
        criteo_q[2].email.should.equal('email@test.com');

        criteo_q[3].event.should.equal('viewBasket');
        criteo_q[3].item[0].id.should.equal('12345');
        criteo_q[3].item[0].price.should.equal(400);
        criteo_q[3].item[0].quantity.should.equal(1);
        criteo_q[3].item[1].id.should.equal('23456');
        criteo_q[3].item[1].price.should.equal(500);
        criteo_q[3].item[1].quantity.should.equal(2);

        criteo_q[4].event.should.equal('setData');
        criteo_q[4].category.should.equal('category');
        criteo_q[4].label.should.equal('label');
        criteo_q[4].value.should.equal(200);

        done();
    });

    it('should reset setData if previous event had data and next event does not', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            EventCategory: mParticle.CommerceEventType.ProductAddToCart,
            EventName: 'Test Add To Cart',
            EventAttributes: {
                label: 'label',
                value: 200,
                category: 'category'
            },
            ProductAction: {
                ProductList: [
                    {
                        Sku: '12345',
                        Price: 400,
                        Quantity: 1
                    },
                    {
                        Sku: '23456',
                        Price: 500,
                        Quantity: 2
                    }
                ]
            }
        });

        criteo_q[0].event.should.equal('setAccount');
        criteo_q[0].account.should.equal('abcde');

        criteo_q[1].event.should.equal('setSiteType');
        criteo_q[1].type.should.equal('d');

        criteo_q[2].event.should.equal('viewBasket');
        criteo_q[2].item[0].id.should.equal('12345');
        criteo_q[2].item[0].price.should.equal(400);
        criteo_q[2].item[0].quantity.should.equal(1);
        criteo_q[2].item[1].id.should.equal('23456');
        criteo_q[2].item[1].price.should.equal(500);
        criteo_q[2].item[1].quantity.should.equal(2);

        criteo_q[3].event.should.equal('setData');
        criteo_q[3].category.should.equal('category');
        criteo_q[3].label.should.equal('label');
        criteo_q[3].value.should.equal(200);

        criteo_q = [];

        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            EventCategory: mParticle.CommerceEventType.ProductAddToCart,
            EventName: 'Test Add To Cart',
            ProductAction: {
                ProductList: [
                    {
                        Sku: '12345',
                        Price: 400,
                        Quantity: 1
                    },
                    {
                        Sku: '23456',
                        Price: 500,
                        Quantity: 2
                    }
                ]
            }
        });

        criteo_q[0].event.should.equal('setAccount');
        criteo_q[0].account.should.equal('abcde');

        criteo_q[1].event.should.equal('setSiteType');
        criteo_q[1].type.should.equal('d');

        criteo_q[2].event.should.equal('viewBasket');
        criteo_q[2].item[0].id.should.equal('12345');
        criteo_q[2].item[0].price.should.equal(400);
        criteo_q[2].item[0].quantity.should.equal(1);
        criteo_q[2].item[1].id.should.equal('23456');
        criteo_q[2].item[1].price.should.equal(500);
        criteo_q[2].item[1].quantity.should.equal(2);

        Should(criteo_q[3]).not.be.ok();

        done();
    });
});
