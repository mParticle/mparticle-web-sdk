/* eslint-disable no-undef*/
describe('ClientSdk Forwarder', function() {
    var expandCommerceEvent = function(event) {
            return [
                {
                    EventName: event.EventName,
                    EventDataType: event.EventDataType,
                    EventAttributes: event.EventAttributes,
                },
            ];
        },
        MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
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
            ProductPurchase: 16,
            getName: function() {
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
            getName: function() {
                return 'CustomerID';
            },
        },
        PromotionActionType = {
            Unknown: 0,
            PromotionView: 1,
            PromotionClick: 2,
        },
        ReportingService = function() {
            var self = this;

            this.id = null;
            this.event = null;

            this.cb = function(forwarder, event) {
                self.id = forwarder.id;
                self.event = event;
            };

            this.reset = function() {
                this.id = null;
                this.event = null;
            };
        },
        MockDynamicYieldSdk = function() {
            var self = this;
            self.addToCartIterations = 0;
            self.dyType = [];
            self.properties = [];
            this.API = function(eventType, data) {
                if (data.name === 'Purchase') {
                    self.dyType.push('purchase-v1');
                    self.properties.push(data.properties);
                } else if (data.name === 'Add to Cart') {
                    self.addToCartIterations++;
                    self.dyType.push('add-to-cart-v1');
                    self.properties.push(data.properties);
                } else if (data.name === 'Add to Wishlist') {
                    self.dyType.push('add-to-wishlist-v1');
                    self.properties.push(data.properties);
                } else if (data.name === 'Remove from Cart') {
                    self.dyType.push('remove-from-cart-v1');
                    self.properties.push(data.properties);
                } else if (data.name === 'Keyword Search') {
                    self.dyType.push('keyword-search-v1');
                    self.properties.push(data.properties);
                } else if (data.name === 'Login') {
                    self.dyType.push('login-v1');
                    self.properties.push(data.properties);
                    self.loginCalled = true;
                }
                // custom event
                else {
                    self.name = data.name;
                    self.properties.push(data.properties);
                }
            };

            this.loginCalled = false;
        };
    describe('not initialized', function() {
        before(function() {
            reportService = new ReportingService();
            mParticle.EventType = EventType;
            mParticle.ProductActionType = ProductActionType;
            mParticle.PromotionType = PromotionActionType;
            mParticle.IdentityType = IdentityType;
            mParticle.CommerceEventType = CommerceEventType;
            mParticle.eCommerce = {};
            mParticle.eCommerce.expandCommerceEvent = expandCommerceEvent;
        });

        it('should not queue events and identities, and process them when initialized', function() {
            window.DY = new MockDynamicYieldSdk();

            mParticle.forwarder.process({
                EventName: 'custom event',
                EventDataType: MessageType.PageEvent,
                EventCategory: EventType.Navigation,
                EventAttributes: {
                    foo1: 'bar1',
                    foo2: 'bar2',
                },
            });

            var mpUser = {
                getUserIdentities: function() {
                    return {
                        userIdentities: { customerid: 'abc' },
                    };
                },
            };
            mParticle.forwarder.onUserIdentified(mpUser);

            window.DY.dyType.length.should.equal(0);
            mParticle.forwarder.init(
                {
                    apiKey: '123456',
                },
                reportService.cb,
                true,
                null,
                {
                    userAttr1: 'value1',
                    userAttr2: 'value2',
                },
                [
                    {
                        Identity: 'customerId',
                        Type: IdentityType.CustomerId,
                    },
                    {
                        Identity: 'email@emailco.com',
                        Type: IdentityType.Email,
                    },
                    {
                        Identity: 'facebookId',
                        Type: IdentityType.Facebook,
                    },
                ],
                '1.1',
                'My App'
            );
        });
    });

    describe('initialized', function() {
        before(function() {
            mParticle.EventType = EventType;
            mParticle.ProductActionType = ProductActionType;
            mParticle.PromotionType = PromotionActionType;
            mParticle.IdentityType = IdentityType;
            mParticle.CommerceEventType = CommerceEventType;
            mParticle.eCommerce = {};
            mParticle.eCommerce.expandCommerceEvent = expandCommerceEvent;
        });

        beforeEach(function() {
            reportService = new ReportingService();
            window.DY = new MockDynamicYieldSdk();
            mParticle.forwarder.init(
                {
                    apiKey: '123456',
                },
                reportService.cb,
                true,
                null,
                {
                    userAttr1: 'value1',
                    userAttr2: 'value2',
                },
                [
                    {
                        Identity: 'customerId',
                        Type: IdentityType.CustomerId,
                    },
                    {
                        Identity: 'email@emailco.com',
                        Type: IdentityType.Email,
                    },
                    {
                        Identity: 'facebookId',
                        Type: IdentityType.Facebook,
                    },
                ],
                '1.1',
                'My App'
            );
        });

        it('should log a purchase event', function(done) {
            mParticle.forwarder.process({
                EventName: 'Test Purchase Event',
                EventDataType: MessageType.Commerce,
                EventCategory: EventType.ProductPurchase,
                EventAttributes: {
                    key1: 'value1',
                    key2: 'value2',
                },
                CurrencyCode: 'USD',
                ProductAction: {
                    TransactionId: '1234',
                    TotalAmount: 150,
                    ProductList: [
                        {
                            Price: 50,
                            Name: 'Prod1',
                            TotalAmount: 50,
                            Quantity: 1,
                            Attributes: { attribute1: 'test' },
                            Sku: '12345',
                        },
                        {
                            Price: 100,
                            Name: 'Prod2',
                            TotalAmount: 100,
                            Quantity: 1,
                            Attributes: { attribute2: 'test2' },
                            Sku: '23456',
                        },
                    ],
                },
            });

            window.DY.dyType[0].should.equal('purchase-v1');
            window.DY.properties[0].uniqueTransactionId.should.equal('1234');
            window.DY.properties[0].value.should.equal(150);
            window.DY.properties[0].currency.should.equal('USD');
            window.DY.properties[0].key1.should.equal('value1');
            window.DY.properties[0].key2.should.equal('value2');

            reportService.event.should.have.property(
                'EventName',
                'Test Purchase Event'
            );

            done();
        });

        it('should log an addToCart event', function(done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - AddToCart',
                EventDataType: MessageType.Commerce,
                EventCategory: CommerceEventType.ProductAddToCart,
                CurrencyCode: 'USD',
                ProductAction: {
                    ProductList: [
                        {
                            Price: 50,
                            Name: 'Prod1',
                            TotalAmount: 50,
                            Quantity: '1',
                            Attributes: { attribute2: 'test2' },
                            Sku: 'Sku2',
                        },
                    ],
                },
                ShoppingCart: {
                    ProductList: [
                        {
                            Price: 100,
                            Name: 'OldProd1',
                            TotalAmount: 200,
                            Quantity: 2,
                            Attributes: { attribute1: 'test1' },
                            Sku: 'Sku1',
                        },
                    ],
                },
            });

            window.DY.dyType[0].should.equal('add-to-cart-v1');
            window.DY.properties[0].value.should.equal(50);
            window.DY.properties[0].currency.should.equal('USD');
            window.DY.properties[0].productId.should.equal('Sku2');
            window.DY.properties[0].quantity.should.equal(1);
            (typeof window.DY.properties[0].quantity).should.equal('number');
            window.DY.properties[0].attribute2.should.equal('test2');

            done();
        });

        it('should log addToCart events properly if more than 1 unique product is added', function(done) {
            var product1 = {
                    Price: 50,
                    Name: 'Prod1',
                    TotalAmount: 50,
                    Quantity: 1,
                    Attributes: { attribute1: 'test1' },
                    Sku: 'Sku1',
                },
                product2 = {
                    Price: 150,
                    Name: 'Prod2',
                    TotalAmount: 150,
                    Quantity: 2,
                    Attributes: { attribute2: 'test2' },
                    Sku: 'Sku2',
                },
                product3 = {
                    Price: 250,
                    Name: 'Prod3',
                    TotalAmount: 250,
                    Quantity: 3,
                    Attributes: { attribute3: 'test3' },
                    Sku: 'Sku3',
                },
                oldProduct = {
                    Price: 100,
                    Name: 'OldProd1',
                    TotalAmount: 400,
                    Quantity: 4,
                    Attributes: { attribute1: 'test' },
                    Sku: 'OldProdSku1',
                };

            mParticle.forwarder.process({
                EventName: 'eCommerce - AddToCart',
                EventDataType: MessageType.Commerce,
                EventCategory: CommerceEventType.ProductAddToCart,
                CurrencyCode: 'USD',
                ProductAction: {
                    ProductList: [product1, product2, product3],
                },
                ShoppingCart: {
                    ProductList: [oldProduct],
                },
            });

            window.DY.dyType[0].should.equal('add-to-cart-v1');
            window.DY.addToCartIterations.should.equal(3);
            // each property is added
            window.DY.properties[0].value.should.equal(
                product1.Quantity * product1.Price
            );
            window.DY.properties[1].value.should.equal(
                product2.Quantity * product2.Price
            );
            window.DY.properties[2].value.should.equal(
                product3.Quantity * product3.Price
            );
            window.DY.properties[0].currency.should.equal('USD');
            window.DY.properties[1].currency.should.equal('USD');
            window.DY.properties[2].currency.should.equal('USD');
            window.DY.properties[0].productId.should.equal(product1.Sku);
            window.DY.properties[1].productId.should.equal(product2.Sku);
            window.DY.properties[2].productId.should.equal(product3.Sku);
            window.DY.properties[0].quantity.should.equal(product1.Quantity);
            window.DY.properties[1].quantity.should.equal(product2.Quantity);
            window.DY.properties[2].quantity.should.equal(product3.Quantity);
            window.DY.properties[0].attribute1.should.equal('test1');
            window.DY.properties[1].attribute2.should.equal('test2');
            window.DY.properties[2].attribute3.should.equal('test3');

            reportService.event.should.have.property(
                'EventName',
                'eCommerce - AddToCart'
            );
            done();
        });

        it('should log a removeFromCart event', function(done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - RemoveFromCart',
                EventDataType: MessageType.Commerce,
                EventCategory: CommerceEventType.ProductRemoveFromCart,
                CurrencyCode: 'USD',
                ProductAction: {
                    ProductList: [
                        {
                            Price: 100,
                            Name: 'OldProd1',
                            TotalAmount: 200,
                            Quantity: '2',
                            Attributes: { attribute1: 'test1' },
                            Sku: 'Sku1',
                        },
                    ],
                },
            });

            window.DY.dyType[0].should.equal('remove-from-cart-v1');
            window.DY.properties[0].value.should.equal(200);
            window.DY.properties[0].currency.should.equal('USD');
            window.DY.properties[0].productId.should.equal('Sku1');
            window.DY.properties[0].quantity.should.equal(2);
            (typeof window.DY.properties[0].quantity).should.equal('number');
            window.DY.properties[0].attribute1.should.equal('test1');
            reportService.event.should.have.property(
                'EventName',
                'eCommerce - RemoveFromCart'
            );
            done();
        });

        it('should log an addToWishlist event', function(done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - AddToWishlist',
                EventDataType: MessageType.Commerce,
                EventCategory: CommerceEventType.ProductAddToWishlist,
                CurrencyCode: 'USD',
                ProductAction: {
                    ProductList: [
                        {
                            Price: 50,
                            Name: 'Prod1',
                            TotalAmount: 50,
                            Quantity: 1,
                            Attributes: { attribute1: 'test' },
                            Sku: 'Sku2',
                        },
                    ],
                },
            });
            reportService.event.should.have.property(
                'EventName',
                'eCommerce - AddToWishlist'
            );
            window.DY.dyType[0].should.equal('add-to-wishlist-v1');
            window.DY.properties[0].productId.should.equal('Sku2');
            window.DY.properties[0].attribute1.should.equal('test');

            done();
        });

        it('should log an search event', function(done) {
            mParticle.forwarder.process({
                EventName: 'test search',
                EventDataType: MessageType.PageEvent,
                EventCategory: EventType.Search,
                CurrencyCode: 'USD',
                EventAttributes: {
                    Keywords: 'search query',
                    attribute1: 'test1',
                },
            });

            reportService.event.should.have.property(
                'EventName',
                'test search'
            );
            window.DY.dyType[0].should.equal('keyword-search-v1');
            window.DY.properties[0].Keywords.should.equal('search query');
            window.DY.properties[0].attribute1.should.equal('test1');

            done();
        });

        it('should log a custom event', function(done) {
            mParticle.forwarder.process({
                EventName: 'custom event',
                EventDataType: MessageType.PageEvent,
                EventCategory: EventType.Navigation,
                EventAttributes: {
                    foo1: 'bar1',
                    foo2: 'bar2',
                },
            });
            reportService.event.should.have.property(
                'EventName',
                'custom event'
            );
            window.DY.name.should.equal('custom event');
            window.DY.properties[0].foo1.should.equal('bar1');
            window.DY.properties[0].foo2.should.equal('bar2');

            done();
        });

        it('should successfully log in with customer id and hashed email', function(done) {
            var mParticleUser = {
                getUserIdentities: function() {
                    return {
                        userIdentities: {
                            customerid: 'testid',
                            email: 'TEST@gmail.com',
                        },
                    };
                },
            };

            mParticle.forwarder.onUserIdentified(mParticleUser);

            // due to promise from hashing an email, we setTimeout so promise is resolved before testing
            setTimeout(function() {
                window.DY.properties[0].dyType.should.equal('login-v1');
                window.DY.properties[0].cuid.should.equal('testid');
                window.DY.properties[0].cuidType.should.equal('customerid');
                window.DY.properties[0].hashedEmail.should.equal(
                    '87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674'
                );
                window.DY.properties[0].cuidType.should.equal('customerid');

                done();
            }, 10);
        });

        it('should not call log in if there is no customer id or email', function(done) {
            var mParticleUser = {
                getUserIdentities: function() {
                    return { userIdentities: {} };
                },
            };

            mParticle.forwarder.onUserIdentified(mParticleUser);

            window.DY.loginCalled.should.equal(false);

            done();
        });
    });
});
