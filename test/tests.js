describe('mParticle Core SDK', function() {
    var server,
        apiKey = 'test_key',
        getRequests = function(path) {
            var requests = [],
                fullPath = '/v1/JS/' + apiKey + '/' + path;

            server.requests.forEach(function(item) {
                if (item.urlParts.path == fullPath) {
                    requests.push(item);
                }
            });

            return requests;
        },
        setCookie = function(data) {
            var date = new Date(),
                key = 'mprtcl-api',
                value = data,
                expires = new Date(date.getTime() +
                    (365 * 24 * 60 * 60 * 1000)).toGMTString();

            window.document.cookie =
                encodeURIComponent(key) + '=' + encodeURIComponent(JSON.stringify(value)) +
                ';expires=' + expires +
                ';path=/';
        },
        getEvent = function(eventName, isForwarding) {
            var requests = getRequests(isForwarding ? 'Forwarding' : 'Events'),
                matchedEvent = null;

            requests.forEach(function(item) {
                var data = JSON.parse(item.requestText);

                if (data.n === eventName) {
                    matchedEvent = data;
                }
            });

            return matchedEvent;
        },
        ProfileMessageType = {
            Logout: 3
        },
        MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            Profile: 14,
            Commerce: 16
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
            PromotionView: 1,
            PromotionClick: 2,
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
        MockForwarder = function() {
            var mockforwarder = this;

            var constructor = function() {
                var self = this;

                this.id = 1;
                this.isDebug = false;
                this.isSandbox = false;
                this.initCalled = false;
                this.processCalled = false;
                this.setUserIdentityCalled = false;
                this.setOptOutCalled = false;
                this.setUserAttributeCalled = false;
                this.reportingService = null;
                this.name = 'MockForwarder';
                this.userAttributeFilters = [];
                this.setUserIdentityCalled = false;
                this.receivedEvent = null;
                this.isVisible = false;
                this.logOutCalled = false;

                this.trackerId = null
                this.userAttributes = null;
                this.userIdentities = null;
                this.appVersion = null;
                this.appName = null;

                this.logOut = function() {
                    this.logOutCalled = true;
                };

                this.init = function(settings, reportingService, testMode, id, userAttributes, userIdentities, appVersion, appName) {
                    self.reportingService = reportingService;
                    self.initCalled = true;

                    self.trackerId = id;
                    self.userAttributes = userAttributes;
                    self.userIdentities = userIdentities;
                    self.appVersion = appVersion;
                    self.appName = appName;
                };

                this.process = function(event) {
                    self.processCalled = true;
                    this.receivedEvent = event;
                    self.reportingService(self, event);
                };

                this.setUserIdentity = function() {
                    self.setUserIdentityCalled = true;
                };

                this.settings = {
                    PriorityValue: 1
                };

                this.setOptOut = function() {
                    this.setOptOutCalled = true;
                };

                this.setUserAttribute = function() {
                    this.setUserAttributeCalled = true;
                };

                this.setUserIdentity = function() {
                    this.setUserIdentityCalled = true;
                };

                mockforwarder.instance = this;
            };

            this.name = 'MockForwarder';
            this.constructor = constructor;

            this.configureDebugAndSandbox = function(isDebug, isSandbox) {
                mParticle.configureForwarder();
            };

            this.configure = function(filteringEventAttributeRule) {
                var config = {
                    name: 'MockForwarder',
                    settings: {},
                    eventNameFilters: [],
                    eventTypeFilters: [],
                    attributeFilters: [],
                    pageViewFilters: [],
                    pageViewAttributeFilters: [],
                    userIdentityFilters: [],
                    userAttributeFilters: [],
                    moduleId: 1,
                    isSandbox: false,
                    hasSandbox: false,
                    isVisible: true,
                    filteringEventAttributeRule: filteringEventAttributeRule
                };

                mParticle.configureForwarder(config);
            };
        },
        mParticleAndroid = function() {
            var self = this;

            this.logEventCalled = false;
            this.setUserIdentityCalled = false;
            this.removeUserIdentityCalled = false;
            this.setUserTagCalled = false;
            this.removeUserTagCalled = false;
            this.setUserAttributeCalled = false;
            this.removeUserAttributeCalled = false;
            this.setSessionAttributeCalled = false;
            this.addToProductBagCalled = false;
            this.removeFromProductBagCalled = false;
            this.clearProductBagCalled = false;
            this.addToCartCalled = false;
            this.removeFromCartCalled = false;
            this.clearCartCalled = false;

            this.logEvent = function() {
                self.logEventCalled = true;
            };
            this.setUserIdentity = function() {
                self.setUserIdentityCalled = true;
            };
            this.removeUserIdentity = function() {
                self.removeUserIdentityCalled = true;
            };
            this.setUserTag = function() {
                self.setUserTagCalled = true;
            };
            this.removeUserTag = function() {
                self.removeUserTagCalled = true;
            };
            this.setUserAttribute = function() {
                self.setUserAttributeCalled = true;
            };
            this.removeUserAttribute = function() {
                self.removeUserAttributeCalled = true;
            };
            this.setSessionAttribute = function() {
                self.setSessionAttributeCalled = true;
            };
            this.addToProductBag = function() {
                self.addToProductBagCalled = true;
            };
            this.removeFromProductBag = function() {
                self.removeFromProductBagCalled = true;
            };
            this.clearProductBag = function() {
                self.clearProductBagCalled = true;
            };
            this.addToCart = function() {
                self.addToCartCalled = true;
            };
            this.removeFromCart = function() {
                self.removeFromCartCalled = true;
            };
            this.clearCart = function() {
                self.clearCartCalled = true;
            };
        };

    before(function() {
        server = new MockHttpServer();
        server.start();
    });

    beforeEach(function() {
        server.requests = [];
        server.handle = function() { };
        mParticle.reset();
        mParticle.init(apiKey);
        window.mParticleAndroid = null;
    });

    it('should log an event', function(done) {
        window.mParticle.logEvent('Test Event', mParticle.EventType.Navigation, { mykey: 'myvalue' });
        var data = getEvent('Test Event');

        data.should.have.property('n', 'Test Event');
        data.should.have.property('et', mParticle.EventType.Navigation);
        data.should.have.property('attrs');
        data.attrs.should.have.property('mykey', 'myvalue')

        done();
    });

    it('should log an error', function(done) {
        mParticle.logError('my error');

        var data = getEvent('Error');

        Should(data).be.ok();

        data.should.have.property('n', 'Error');
        data.should.have.property('attrs');
        data.attrs.should.have.property('m', 'my error');

        done();
    });


    it('should log a page view', function(done) {
        mParticle.logPageView();

        var event = getEvent(window.location.pathname);

        Should(event).be.ok();

        event.should.have.property('attrs');
        event.attrs.should.have.property('hostname', window.location.hostname);
        event.attrs.should.have.property('title', window.document.title);

        done();
    });

    it('should create ecommerce product', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400, 2);

        product.should.have.property('Name', 'iPhone');
        product.should.have.property('Sku', '12345');
        product.should.have.property('Price', 400);
        product.should.have.property('Quantity', 2);

        done();
    });

    it('should create transaction attributes', function(done) {
        var transactionAttributes = mParticle.eCommerce.createTransactionAttributes('12345',
            'test-affiliation',
            'coupon-code',
            44334,
            600,
            200);

        transactionAttributes.should.have.property('Id', '12345');
        transactionAttributes.should.have.property('Affiliation', 'test-affiliation');
        transactionAttributes.should.have.property('CouponCode', 'coupon-code');
        transactionAttributes.should.have.property('Revenue', 44334);
        transactionAttributes.should.have.property('Shipping', 600);
        transactionAttributes.should.have.property('Tax', 200);

        done();
    });

    it('should log ecommerce event', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone',
            '12345',
            400,
            2,
            'Apple',
            'Plus',
            'Phones',
            1,
            'my-coupon-code',
            { customkey: 'customvalue' }),
            transactionAttributes = mParticle.eCommerce.createTransactionAttributes('12345',
                'test-affiliation',
                'coupon-code',
                44334,
                600,
                200);

        mParticle.eCommerce.logPurchase(transactionAttributes, product);
        var data = getEvent('eCommerce - Purchase');

        data.should.have.property('pd');
        data.pd.should.have.property('an', ProductActionType.Purchase);
        data.pd.should.have.property('ti', '12345');
        data.pd.should.have.property('ta', 'test-affiliation');
        data.pd.should.have.property('tcc', 'coupon-code');
        data.pd.should.have.property('tr', 44334);
        data.pd.should.have.property('ts', 600);
        data.pd.should.have.property('tt', 200);
        data.pd.should.have.property('pl').with.lengthOf(1);

        data.pd.pl[0].should.have.property('id', '12345');
        data.pd.pl[0].should.have.property('nm', 'iPhone');
        data.pd.pl[0].should.have.property('pr', 400);
        data.pd.pl[0].should.have.property('qt', 2);
        data.pd.pl[0].should.have.property('br', 'Apple');
        data.pd.pl[0].should.have.property('va', 'Plus');
        data.pd.pl[0].should.have.property('ca', 'Phones');
        data.pd.pl[0].should.have.property('ps', 1);
        data.pd.pl[0].should.have.property('cc', 'my-coupon-code');
        data.pd.pl[0].should.have.property('tpa', 800);
        data.pd.pl[0].should.have.property('attrs');

        data.pd.pl[0].attrs.should.have.property('customkey', 'customvalue');

        done();
    });
    
    it('logPurchase should support array of products', function(done) {
        var product1 = mParticle.eCommerce.createProduct('iPhone', 'SKU1', 1),
            product2 = mParticle.eCommerce.createProduct('Android', 'SKU2', 1),
            transactionAttributes = mParticle.eCommerce.createTransactionAttributes('12345');

        mParticle.eCommerce.logPurchase(transactionAttributes, [product1, product2]);
        var data = getEvent('eCommerce - Purchase');
        
        data.should.have.property('pd');
        data.pd.should.have.property('pl').with.lengthOf(2);
        data.pd.pl[0].should.have.property('nm', 'iPhone');
        data.pd.pl[1].should.have.property('nm', 'Android');
        
        done(); 
    });
    
    it('logRefund should support array of products', function(done) {
        var product1 = mParticle.eCommerce.createProduct('iPhone', 'SKU1', 1),
            product2 = mParticle.eCommerce.createProduct('Android', 'SKU2', 1),
            transactionAttributes = mParticle.eCommerce.createTransactionAttributes('12345');

        mParticle.eCommerce.logRefund(transactionAttributes, [product1, product2]);
        var data = getEvent('eCommerce - Refund');
        
        data.should.have.property('pd');
        data.pd.should.have.property('an', ProductActionType.Refund);
        data.pd.should.have.property('pl').with.lengthOf(2);
        data.pd.pl[0].should.have.property('nm', 'iPhone');
        data.pd.pl[1].should.have.property('nm', 'Android');
        
        done(); 
    });

    it('should create promotion', function(done) {
        var promotion = mParticle.eCommerce.createPromotion('12345', 'my-creative', 'creative-name', 1);

        Should(promotion).be.ok();

        promotion.should.have.property('Id', '12345');
        promotion.should.have.property('Creative', 'my-creative');
        promotion.should.have.property('Name', 'creative-name');
        promotion.should.have.property('Position', 1);

        done();
    });

    it('should log promotion click', function(done) {
        var promotion = mParticle.eCommerce.createPromotion('12345', 'my-creative', 'creative-name', 1);

        mParticle.eCommerce.logPromotion(mParticle.PromotionType.PromotionClick, promotion);

        var event = getEvent('eCommerce - PromotionClick');

        Should(event).be.ok();

        event.should.have.property('et', CommerceEventType.PromotionClick);
        event.should.have.property('pm');
        event.pm.should.have.property('an', PromotionActionType.PromotionClick);
        event.pm.should.have.property('pl');
        event.pm.pl[0].should.have.property('id', '12345');
        event.pm.pl[0].should.have.property('nm', 'creative-name');
        event.pm.pl[0].should.have.property('cr', 'my-creative');
        event.pm.pl[0].should.have.property('ps', 1);

        done();
    });

    it('should create impression', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400),
            impression = mParticle.eCommerce.createImpression('impression-name', product);

        impression.should.have.property('Name', 'impression-name');
        impression.should.have.property('Product');
        impression.Product.should.have.property('Sku', '12345');

        done();
    });

    it('should log impression event', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400),
            impression = mParticle.eCommerce.createImpression('impression-name', product);

        mParticle.eCommerce.logImpression(impression);

        var event = getEvent('eCommerce - Impression');

        Should(event).be.ok();

        event.should.have.property('pi').with.lengthOf(1);
        event.pi[0].should.have.property('pil', 'impression-name');
        event.pi[0].should.have.property('pl').with.lengthOf(1);
        event.pi[0].pl[0].should.have.property('id', '12345');

        done();
    });

    it('should log ecommerce refund', function(done) {
        var transaction = mParticle.eCommerce.createTransactionAttributes('12345');

        mParticle.eCommerce.logRefund(transaction);

        var event = getEvent('eCommerce - Refund');

        Should(event).be.ok();

        event.should.have.property('pd');
        event.pd.should.have.property('an', ProductActionType.Refund);
        event.pd.should.have.property('ti', '12345');

        done();
    });

    it('should add products to cart', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);

        mParticle.eCommerce.Cart.add(product, true);

        var data = getEvent('eCommerce - AddToCart');

        data.should.have.property('pd');
        data.pd.should.have.property('an', ProductActionType.AddToCart);
        data.pd.should.have.property('pl').with.lengthOf(1);
        data.pd.pl[0].should.have.property('id', '12345');

        done();
    });

    it('should remove products to cart', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);

        mParticle.eCommerce.Cart.add(product);
        mParticle.eCommerce.Cart.remove({ Sku: '12345' }, true);

        var data = getEvent('eCommerce - RemoveFromCart');

        data.should.have.property('pd');
        data.pd.should.have.property('an', ProductActionType.RemoveFromCart);
        data.pd.should.have.property('pl').with.lengthOf(1);
        data.pd.pl[0].should.have.property('id', '12345');

        done();
    });

    it('should add product to product bag', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);

        mParticle.eCommerce.ProductBags.add('my bag', product);

        mParticle.logEvent('my event');

        var event = getEvent('my event');

        Should(event).be.ok();

        event.should.have.property('pb');

        event.pb.should.have.property('my bag');
        event.pb['my bag'].should.have.property('pl').with.lengthOf(1);
        event.pb['my bag'].pl[0].should.have.property('id', '12345');

        done();
    });

    it('should remove product from product bag', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);
        mParticle.eCommerce.ProductBags.add('my bag', product);
        mParticle.eCommerce.ProductBags.remove('my bag', product);

        mParticle.logEvent('my event');

        var event = getEvent('my event');

        Should(event).be.ok();

        event.should.have.property('pb');

        event.pb.should.have.property('my bag');
        event.pb['my bag'].should.have.property('pl').with.lengthOf(0);

        done();
    });

    it('should clear product bag', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);
        mParticle.eCommerce.ProductBags.add('my bag', product);
        mParticle.eCommerce.ProductBags.clear('my bag');

        mParticle.logEvent('my event');

        var event = getEvent('my event');

        Should(event).be.ok();

        event.should.have.property('pb');

        event.pb.should.have.property('my bag');
        event.pb['my bag'].should.have.property('pl').with.lengthOf(0);

        done();
    });

    it('should log checkout', function(done) {
        mParticle.eCommerce.logCheckout(1, 'Visa');

        var event = getEvent('eCommerce - Checkout');

        Should(event).be.ok();

        event.should.have.property('et', CommerceEventType.ProductCheckout);
        event.should.have.property('pd');

        event.pd.should.have.property('an', ProductActionType.Checkout);
        event.pd.should.have.property('cs', 1);
        event.pd.should.have.property('co', 'Visa');

        done();
    });

    it('should log product action', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);

        mParticle.eCommerce.logProductAction(ProductActionType.ViewDetail, product);

        var event = getEvent('eCommerce - ViewDetail');

        event.should.have.property('et', CommerceEventType.ProductViewDetail);
        event.should.have.property('pd');
        event.pd.should.have.property('an', ProductActionType.ViewDetail);
        event.pd.should.have.property('pl').with.lengthOf(1);
        event.pd.pl[0].should.have.property('id', '12345');

        Should(event).be.ok();

        done();
    });

    it('should add user identities', function(done) {
        mParticle.setUserIdentity('test@mparticle.com', mParticle.IdentityType.CustomerId);

        var identity = mParticle.getUserIdentity('test@mparticle.com');

        identity.should.have.property('Identity', 'test@mparticle.com');
        identity.should.have.property('Type', mParticle.IdentityType.CustomerId);

        done();
    });

    it('should remove user identities', function(done) {
        mParticle.setUserIdentity('test@mparticle.com', mParticle.IdentityType.CustomerId);
        mParticle.removeUserIdentity('test@mparticle.com');

        var identity = mParticle.getUserIdentity('test@mparticle.com');

        Should(identity).not.be.ok();

        done();
    });

    it('should invoke forwarder setIdentity', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);

        mParticle.setUserIdentity('test@mparticle.com', mParticle.IdentityType.CustomerId);

        mockForwarder.instance.should.have.property('setUserIdentityCalled', true);

        done();
    });

    it('starts new session', function(done) {
        mParticle.startNewSession();

        var data = getEvent(MessageType.SessionStart);

        Should(data).be.ok();

        data.should.have.property('sid');

        done();
    });

    it('ends existing session', function(done) {
        mParticle.startNewSession();
        mParticle.endSession();

        var data = getEvent(MessageType.SessionStart);

        Should(data).be.ok();

        done();
    });

    it('initializes forwarder', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            pageViewFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            id: 1,
            isSandbox: false,
            hasSandbox: false,
            isVisible: true
        });

        mParticle.init(apiKey);

        mockForwarder.instance.should.have.property('initCalled', true);

        done();
    });

    it('sends event to forwarder', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);

        mParticle.logEvent('send this event to forwarder');

        mockForwarder.instance.should.have.property('processCalled', true);

        done();
    });

    it('sends forwarding stats', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);

        mParticle.logEvent('send this event to forwarder',
            mParticle.EventType.Navigation,
            { 'my-key': 'my-value' });

        var event = getEvent('send this event to forwarder', true);

        Should(event).should.be.ok();

        event.should.have.property('mid', 1);
        event.should.have.property('n', 'send this event to forwarder');
        event.should.have.property('attrs');
        event.should.have.property('sdk', mParticle.getVersion());
        event.should.have.property('dt', MessageType.PageEvent);
        event.should.have.property('et', mParticle.EventType.Navigation);
        event.should.have.property('dbg', mParticle.isSandbox);
        event.should.have.property('ct');
        event.should.have.property('eec', 0);

        done();
    });

    it('should not send forwarding stats to invisible forwarders', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);
        mockForwarder.instance.isVisible = false;

        mParticle.logEvent('send this event to forwarder',
            mParticle.EventType.Navigation,
            { 'my-key': 'my-value' });

        var event = getEvent('send this event to forwarder', true);

        Should(event).should.not.have.property('n');

        done();
    });

    it('should log opt out', function(done) {
        mParticle.setOptOut(true);

        var event = getEvent(MessageType.OptOut);

        event.should.have.property('dt', MessageType.OptOut);
        event.should.have.property('o', true);

        done();
    });

    it('should invoke forwarder opt out', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);
        mParticle.setOptOut(true);

        mockForwarder.instance.should.have.property('setOptOutCalled', true);

        done();
    });

    it('should add user attribute', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mParticle.init(apiKey);
        mParticle.setUserAttribute('gender', 'male');

        mParticle.logEvent('test user attributes');

        var event = getEvent('test user attributes');

        event.should.have.property('ua');
        event.ua.should.have.property('gender', 'male');

        done();
    });

    it('should remove user attribute', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mParticle.init(apiKey);
        mParticle.setUserAttribute('gender', 'male');
        mParticle.removeUserAttribute('gender');

        mParticle.logEvent('test user attributes');

        var event = getEvent('test user attributes');
        event.should.not.have.property('gender');

        done();
    });

    it('should set session attribute', function(done) {
        mParticle.setSessionAttribute('name', 'test');

        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('sa');
        event.sa.should.have.property('name', 'test');

        done();
    });

    it('should remove session attributes when session ends', function(done) {
        mParticle.startNewSession();
        mParticle.setSessionAttribute('name', 'test');
        mParticle.endSession();
        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('sa');
        event.sa.should.not.have.property('name');

        done();
    });

    it('should invoke forwarder setuserattribute', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);
        mParticle.setUserAttribute('gender', 'male');

        mockForwarder.instance.should.have.property('setUserAttributeCalled', true);

        done();
    });

    it('should set and log position', function(done) {
        mParticle.setPosition(34.134103, -118.321694);
        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('lc');
        event.lc.should.have.property('lat', 34.134103);
        event.lc.should.have.property('lng', -118.321694);

        done();
    });

    it('should set user tag', function(done) {
        mParticle.setUserTag('test');

        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('ua');
        event.ua.should.have.property('test', null);

        done();
    });

    it('should remove user tag', function(done) {
        mParticle.setUserTag('test');
        mParticle.removeUserTag('test');

        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('ua');
        event.ua.should.not.have.property('test');

        done();
    });

    it('should log legacy ecommerce transaction', function(done) {
        mParticle.logEcommerceTransaction('iPhone',
            '12345',
            400,
            1,
            'Phone',
            500,
            50,
            50,
            'USD',
            'affiliation',
            '11223344');

        var event = getEvent('Ecommerce');

        event.should.have.property('dt', MessageType.PageEvent);
        event.should.have.property('et', mParticle.EventType.Transaction);

        event.attrs.should.have.property('$MethodName', 'LogEcommerceTransaction');
        event.attrs.should.have.property('ProductName', 'iPhone');
        event.attrs.should.have.property('ProductSKU', '12345');
        event.attrs.should.have.property('ProductUnitPrice', 400);
        event.attrs.should.have.property('ProductQuantity', 1);
        event.attrs.should.have.property('ProductCategory', 'Phone');
        event.attrs.should.have.property('RevenueAmount', 500);
        event.attrs.should.have.property('TaxAmount', 50);
        event.attrs.should.have.property('ShippingAmount', 50);
        event.attrs.should.have.property('CurrencyCode', 'USD');
        event.attrs.should.have.property('TransactionAffiliation', 'affiliation');
        event.attrs.should.have.property('TransactionID', '11223344');

        done();
    });

    it('should parse response after logging event', function(done) {
        server.handle = function(request) {
            request.setResponseHeader("Content-Type", "application/json");
            request.receive(200, JSON.stringify({
                Store: {
                    testprop: {
                        Expires: new Date(2040, 1, 1),
                        Value: "blah"
                    }
                }
            }));
        };

        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('str');
        event.str.should.have.property('testprop');
        event.str.testprop.should.have.property('Value', 'blah');

        done();
    });

    it('should filter user attributes from forwarder', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            pageViewFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [mParticle.generateHash('gender')],
            moduleId: 1,
            isSandbox: false,
            hasSandbox: false,
            isVisible: true
        });

        mParticle.init(apiKey);
        mParticle.setUserAttribute('gender', 'male');

        mParticle.logEvent('test event');

        var event = mockForwarder.instance.receivedEvent;
        event.should.have.property('UserAttributes');
        event.UserAttributes.should.not.have.property('gender');

        done();
    });

    it('should filter user identities from forwarder', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            pageViewFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [mParticle.IdentityType.Google],
            userAttributeFilters: [],
            moduleId: 1,
            isSandbox: false,
            hasSandbox: false,
            isVisible: true
        });

        mParticle.init(apiKey);
        mParticle.setUserIdentity('test@gmail.com', mParticle.IdentityType.Google);

        mParticle.logEvent('test event');

        var event = mockForwarder.instance.receivedEvent;
        event.should.have.property('UserIdentities').with.lengthOf(0);

        done();
    });

    it('should filter event names', function(done) {
        mParticle.reset();

        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);

        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [mParticle.generateHash(mParticle.EventType.Navigation + 'test event')],
            eventTypeFilters: [],
            attributeFilters: [],
            pageViewFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isSandbox: false,
            hasSandbox: false,
            isVisible: true
        });

        mParticle.init(apiKey);

        mParticle.startNewSession();
        mockForwarder.instance.receivedEvent = null;

        mParticle.logEvent('test event', mParticle.EventType.Navigation);

        Should(mockForwarder.instance.receivedEvent).not.be.ok();

        mParticle.logEvent('test event 2', mParticle.EventType.Navigation);

        Should(mockForwarder.instance.receivedEvent).be.ok();

        done();
    });

    it('should filter page event names', function(done) {
        mParticle.reset();

        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            pageViewFilters: [mParticle.generateHash(mParticle.EventType.Unknown + '/test/index.html')],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isSandbox: false,
            hasSandbox: false,
            isVisible: true
        });

        mParticle.init(apiKey);

        mParticle.startNewSession();
        mockForwarder.instance.receivedEvent = null;

        mParticle.logPageView();

        Should(mockForwarder.instance.receivedEvent).not.be.ok();

        done();
    });

    it('should filter event attributes', function(done) {
        mParticle.reset();

        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [mParticle.generateHash(mParticle.EventType.Navigation + 'test event' + 'test attribute')],
            pageViewFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isSandbox: false,
            hasSandbox: false,
            isVisible: true
        });

        mParticle.init(apiKey);

        mParticle.logEvent('test event', mParticle.EventType.Navigation, {
            'test attribute': 'test value',
            'test attribute 2': 'test value 2'
        });

        var event = mockForwarder.instance.receivedEvent;

        event.EventAttributes.should.not.have.property('test attribute');
        event.EventAttributes.should.have.property('test attribute 2');

        done();
    });

    it('should filter page event attributes', function(done) {
        mParticle.reset();

        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);

        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [mParticle.generateHash(mParticle.EventType.Navigation + 'test event' + 'test attribute')],
            pageViewFilters: [],
            pageViewAttributeFilters: [mParticle.generateHash(mParticle.EventType.Unknown + '/test/index.html' + 'hostname')],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isSandbox: false,
            hasSandbox: false,
            isVisible: true
        });

        mParticle.init(apiKey);

        mParticle.logPageView();

        var event = mockForwarder.instance.receivedEvent;

        event.EventAttributes.should.not.have.property('hostname');
        event.EventAttributes.should.have.property('title');

        done();
    });

    it('should invoke native sdk method addToCart', function(done) {
        mParticle.reset();
        window.mParticleAndroid = new mParticleAndroid();

        mParticle.eCommerce.Cart.add({});

        window.mParticleAndroid.should.have.property('addToCartCalled', true);

        done();
    });

    it('should invoke native sdk method removeFromCart', function(done) {
        mParticle.reset();
        window.mParticleAndroid = new mParticleAndroid();

        mParticle.eCommerce.Cart.add({ Sku: '12345' });
        mParticle.eCommerce.Cart.remove({ Sku: '12345' });

        window.mParticleAndroid.should.have.property('removeFromCartCalled', true);

        done();
    });

    it('should invoke native sdk method clearCart', function(done) {
        mParticle.reset();
        window.mParticleAndroid = new mParticleAndroid();

        mParticle.eCommerce.Cart.clear();

        window.mParticleAndroid.should.have.property('clearCartCalled', true);

        done();
    });

    it('should invoke native sdk method addToProductBag', function(done) {
        mParticle.reset();
        window.mParticleAndroid = new mParticleAndroid();

        mParticle.eCommerce.ProductBags.add('my bag', {});

        window.mParticleAndroid.should.have.property('addToProductBagCalled', true);

        done();
    });

    it('should invoke native sdk method removeFromProductBag', function(done) {
        mParticle.reset();
        window.mParticleAndroid = new mParticleAndroid();

        mParticle.eCommerce.ProductBags.remove('my bag', {});

        window.mParticleAndroid.should.have.property('removeFromProductBagCalled', true);

        done();
    });

    it('should invoke native sdk method clearProductBag', function(done) {
        mParticle.reset();
        window.mParticleAndroid = new mParticleAndroid();

        mParticle.eCommerce.ProductBags.clear('my bag');

        window.mParticleAndroid.should.have.property('clearProductBagCalled', true);

        done();
    });

    it('should fail to create product if name not specified', function(done) {
        var product = mParticle.eCommerce.createProduct(null);

        Should(product).not.be.ok();

        done();
    });

    it('should fail to create product if sku not specified', function(done) {
        var product = mParticle.eCommerce.createProduct('test', null);

        Should(product).not.be.ok();

        done();
    });

    it('should fail to create product if price not specified', function(done) {
        var product = mParticle.eCommerce.createProduct('test', 'sku', null);

        Should(product).not.be.ok();

        done();
    });

    it('should fail to create impression if name is not specified', function(done) {
        var impression = mParticle.eCommerce.createImpression(null);

        Should(impression).not.be.ok();

        done();
    });

    it('should fail to create impression if product is not specified', function(done) {
        var impression = mParticle.eCommerce.createImpression('name', null);

        Should(impression).not.be.ok();

        done();
    });

    /*
    it('should not send non debug events to debug forwarders', function (done) {
        mParticle.reset();

        var mockForwarder = new MockForwarder();
        mockForwarder.isDebug = true;
        mParticle.addForwarder(mockForwarder);
        mParticle.init(apiKey);

        mParticle.logEvent('Test');

        var event = mockForwarder.instance.receivedEvent;
        Should(event).not.be.ok();

        done();
    });

    it('should not send debug events to non debug forwarders', function (done) {
        mParticle.reset();

        var mockForwarder = new MockForwarder();
        mockForwarder.isDebug = false;
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);
        mParticle.isSandbox = true;

        mParticle.logEvent('Test');

        var event = mockForwarder.instance.receivedEvent;
        Should(event).not.be.ok();

        done();
    });*/

    it('event type should return name', function(done) {
        mParticle.EventType.getName(mParticle.EventType.Navigation).should.equal('Navigation');
        mParticle.EventType.getName(mParticle.EventType.Location).should.equal('Location');
        mParticle.EventType.getName(mParticle.EventType.Search).should.equal('Search');
        mParticle.EventType.getName(mParticle.EventType.Transaction).should.equal('Transaction');
        mParticle.EventType.getName(mParticle.EventType.UserContent).should.equal('User Content');
        mParticle.EventType.getName(mParticle.EventType.UserPreference).should.equal('User Preference');
        mParticle.EventType.getName(mParticle.EventType.Social).should.equal('Social');
        mParticle.EventType.getName(mParticle.EventType.Media).should.equal('Media');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductAddToCart).should.equal('Product Added to Cart');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductAddToWishlist).should.equal('Product Added to Wishlist');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductCheckout).should.equal('Product Checkout');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductCheckoutOption).should.equal('Product Checkout Options');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductClick).should.equal('Product Click');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductImpression).should.equal('Product Impression');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductPurchase).should.equal('Product Purchased');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductRefund).should.equal('Product Refunded');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductRemoveFromCart).should.equal('Product Removed From Cart');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductRemoveFromWishlist).should.equal('Product Removed from Wishlist');
        mParticle.EventType.getName(mParticle.CommerceEventType.ProductViewDetail).should.equal('Product View Details');
        mParticle.EventType.getName(mParticle.CommerceEventType.PromotionClick).should.equal('Promotion Click');
        mParticle.EventType.getName(mParticle.CommerceEventType.PromotionView).should.equal('Promotion View');
        mParticle.EventType.getName(null).should.equal('Other');

        done();
    });

    it('identity type should return name', function(done) {
        mParticle.IdentityType.getName(mParticle.IdentityType.CustomerId).should.equal('Customer ID');
        mParticle.IdentityType.getName(mParticle.IdentityType.Facebook).should.equal('Facebook ID');
        mParticle.IdentityType.getName(mParticle.IdentityType.Twitter).should.equal('Twitter ID');
        mParticle.IdentityType.getName(mParticle.IdentityType.Google).should.equal('Google ID');
        mParticle.IdentityType.getName(mParticle.IdentityType.Microsoft).should.equal('Microsoft ID');
        mParticle.IdentityType.getName(mParticle.IdentityType.Yahoo).should.equal('Yahoo ID');
        mParticle.IdentityType.getName(mParticle.IdentityType.Email).should.equal('Email');
        mParticle.IdentityType.getName(mParticle.IdentityType.Alias).should.equal('Alias ID');
        mParticle.IdentityType.getName(mParticle.IdentityType.FacebookCustomAudienceId).should.equal('Facebook App User ID');
        mParticle.IdentityType.getName(null).should.equal('Other ID');

        done();
    });

    it('product action type should return name', function(done) {
        mParticle.ProductActionType.getName(mParticle.ProductActionType.AddToCart).should.equal('Add to Cart');
        mParticle.ProductActionType.getName(mParticle.ProductActionType.RemoveFromCart).should.equal('Remove from Cart');
        mParticle.ProductActionType.getName(mParticle.ProductActionType.Checkout).should.equal('Checkout');
        mParticle.ProductActionType.getName(mParticle.ProductActionType.CheckoutOption).should.equal('Checkout Option');
        mParticle.ProductActionType.getName(mParticle.ProductActionType.Click).should.equal('Click');
        mParticle.ProductActionType.getName(mParticle.ProductActionType.ViewDetail).should.equal('View Detail');
        mParticle.ProductActionType.getName(mParticle.ProductActionType.Purchase).should.equal('Purchase');
        mParticle.ProductActionType.getName(mParticle.ProductActionType.Refund).should.equal('Refund');
        mParticle.ProductActionType.getName(mParticle.ProductActionType.AddToWishlist).should.equal('Add to Wishlist');
        mParticle.ProductActionType.getName(mParticle.ProductActionType.RemoveFromWishlist).should.equal('Remove from Wishlist');
        mParticle.ProductActionType.getName(null).should.equal('Unknown');

        done();
    });

    it('promotion action type should return name', function(done) {
        mParticle.PromotionType.getName(mParticle.PromotionType.PromotionView).should.equal('Promotion View');
        mParticle.PromotionType.getName(mParticle.PromotionType.PromotionClick).should.equal('Promotion Click');
        mParticle.PromotionType.getName(null).should.equal('Unknown');

        done();
    });

    it('should process ready queue when initialized', function(done) {
        var readyFuncCalled = false;

        mParticle.reset();
        mParticle.ready(function() { readyFuncCalled = true; });
        mParticle.init();

        Should(readyFuncCalled).equal(true);

        done();
    });

    it('log event requires name', function(done) {
        mParticle.logEvent();

        Should(server.requests).have.lengthOf(0);

        done();
    });

    it('log event requires valid event type', function(done) {
        mParticle.logEvent('test', 100);

        Should(server.requests).have.lengthOf(0);

        done();
    });

    it('event attributes must be object', function(done) {
        mParticle.logEvent('test', null, 1);

        Should(server.requests).have.lengthOf(0);

        done();
    });

    it('opting out should prevent events being sent', function(done) {
        mParticle.setOptOut(true);
        server.requests = [];

        mParticle.logEvent('test')
        server.requests.should.have.lengthOf(0);

        done();
    });

    it('should set app version', function(done) {
        mParticle.setAppVersion('1.0');

        window.mParticle.logEvent('Test Event', mParticle.EventType.Navigation);
        var data = getEvent('Test Event');

        data.should.have.property('av', '1.0');

        done();
    });

    it('should get app version', function(done) {
        mParticle.setAppVersion('2.0')

        var appVersion = mParticle.getAppVersion();

        appVersion.should.equal('2.0');

        done();
    });

    it('should log log out event', function(done) {
        mParticle.logOut();

        var data = getEvent(MessageType.Profile);

        data.should.have.property('dt', MessageType.Profile);
        data.should.have.property('pet', ProfileMessageType.Logout);

        done();
    });

    it('should call logout on forwarder', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();

        mParticle.init(apiKey);
        mParticle.logOut();

        mockForwarder.instance.should.have.property('logOutCalled', true);

        done();
    });

    it('should pass in app name to forwarder on initialize', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();

        mParticle.setAppName('Unit Tests');
        mParticle.init(apiKey);

        mockForwarder.instance.should.have.property('appName', 'Unit Tests');

        done();
    });

    it('should pass in app version to forwarder on initialize', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();

        mParticle.setAppVersion('3.0');
        mParticle.init(apiKey);

        mockForwarder.instance.should.have.property('appVersion', '3.0');

        done();
    });

    it('should load cookie in initialize', function(done) {
        mParticle.reset();

        done();
    });

    it('should pass in user identities to forwarder on initialize', function(done) {
        mParticle.reset();

        setCookie({
            ui: [{
                Identity: 'testuser@mparticle.com',
                Type: 1
            }]
        });

        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);

        mockForwarder.instance.should.have.property('userIdentities').with.lengthOf(1);

        done();
    });

    it('should pass in user attributes to forwarder on initialize', function(done) {
        mParticle.reset();

        setCookie({
            ua: {
                color: 'blue'
            }
        });

        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure();
        mParticle.init(apiKey);

        mockForwarder.instance.should.have.property('userAttributes');
        mockForwarder.instance.userAttributes.should.have.property('color', 'blue');

        done();
    });

    it('should pass custom flags in page views', function(done) {
        mParticle.logPageView({
            'MyCustom.Flag': 'Test'
        });

        var event = getEvent(window.location.pathname);

        Should(event).be.ok();

        event.should.have.property('flags');
        event.flags.should.have.property('MyCustom.Flag', ['Test']);

        done();
    });

    it('should convert custom flag dictionary values to array', function(done) {
        mParticle.logPageView({
            'MyCustom.String': 'Test',
            'MyCustom.Number': 1,
            'MyCustom.Boolean': true,
            'MyCustom.Object': {},
            'MyCustom.Array': ['Blah', 'Hello', {}]
        });

        var event = getEvent(window.location.pathname);

        Should(event).be.ok();

        event.should.have.property('flags');
        event.flags.should.have.property('MyCustom.String', ['Test']);
        event.flags.should.have.property('MyCustom.Number', ['1']);
        event.flags.should.have.property('MyCustom.Boolean', ['true']);
        event.flags.should.not.have.property('MyCustom.Object');
        event.flags.should.have.property('MyCustom.Array', ['Blah', 'Hello']);

        done();
    });

    it('should set product position to 0 if null', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone',
            '12345',
            400,
            2,
            'Apple',
            'Plus',
            'Phones'),
            transactionAttributes = mParticle.eCommerce.createTransactionAttributes('12345',
                'test-affiliation',
                'coupon-code',
                44334,
                600,
                200);

        mParticle.eCommerce.logPurchase(transactionAttributes, product);
        var data = getEvent('eCommerce - Purchase');

        data.pd.pl[0].should.have.property('ps', 0);

        done();
    });

    it('should not forward event if attribute forwarding rule is set', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            pageViewFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isSandbox: false,
            hasSandbox: false,
            isVisible: true,
            filteringEventAttributeValue: {
                eventAttributeName: mParticle.generateHash('ForwardingRule'),
                eventAttributeValue: mParticle.generateHash('Forward'),
                includeOnMatch: false
            }
        });

        mParticle.init(apiKey);

        mParticle.logEvent('send this event to forwarder', mParticle.EventType.Navigation, {
            "ForwardingRule": "Forward"
        });

        var event = mockForwarder.instance.receivedEvent;

        event.should.not.have.property('EventName', 'send this event to forwarder');

        done();
    });

    it('should forward event if attribute forwarding rule is set', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            pageViewFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isSandbox: false,
            hasSandbox: false,
            isVisible: true,
            filteringEventAttributeValue: {
                eventAttributeName: mParticle.generateHash('ForwardingRule'),
                eventAttributeValue: mParticle.generateHash('Forward'),
                includeOnMatch: true
            }
        });

        mParticle.init(apiKey);

        mParticle.logEvent('send this event to forwarder', mParticle.EventType.Navigation, {
            "ForwardingRule": "Forward"
        });

        var event = mockForwarder.instance.receivedEvent;

        event.should.have.property('EventName', 'send this event to forwarder');

        done();
    });

    it('should not forward event if attribute forwarding true rule is set', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);

        mParticle.configureForwarder({
            name: 'MockForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            pageViewFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isSandbox: false,
            hasSandbox: false,
            isVisible: true,
            filteringEventAttributeValue: {
                eventAttributeName: mParticle.generateHash('ForwardingRule'),
                eventAttributeValue: mParticle.generateHash('Forward'),
                includeOnMatch: true
            }
        });

        mParticle.init(apiKey);

        mParticle.logEvent('send this event to forwarder', mParticle.EventType.Navigation, {
            "Test": "Non-Matching"
        });

        var event = mockForwarder.instance.receivedEvent;

        event.should.not.have.property('EventName', 'send this event to forwarder');

        done();
    });
    
    it('should support old configureForwarder function signature', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mParticle.configureForwarder('MockForwarder', {}, [], [], [], [], [], [], [mParticle.generateHash('gender')], 1, false, false);
        mParticle.init(apiKey);
        mParticle.setUserAttribute('gender', 'male');

        mParticle.logEvent('test event');

        var event = mockForwarder.instance.receivedEvent;
        event.should.have.property('UserAttributes');
        event.UserAttributes.should.not.have.property('gender');

        done(); 
    });
    
    it('should support logLTVIncrease function', function(done) {
        mParticle.logLTVIncrease(100, 'Bought Something');

        var event = getEvent('Bought Something');

        Should(event).be.ok();

        event.should.have.property('dt', MessageType.PageEvent);
        event.should.have.property('et', mParticle.EventType.Transaction);
        
        event.should.have.property('attrs');
        event.attrs.should.have.property('$Amount', 100);
        event.attrs.should.have.property('$MethodName', 'LogLTVIncrease');

        done();
    });
    
    it('should default logLTVIncrease event name', function(done) {
        mParticle.logLTVIncrease(100);

        var event = getEvent('Increase LTV');

        Should(event).be.ok();
        
        event.should.have.property('attrs');
        event.attrs.should.have.property('$Amount', 100);

        done();
    });
    
    it('should not logLTVIncrease when no amount is passed', function(done) {
        mParticle.logLTVIncrease();

        var event = getEvent('Increase LTV');

        Should(event).not.be.ok();
        
        done(); 
    });

    after(function() {
        server.stop();
    });
});
