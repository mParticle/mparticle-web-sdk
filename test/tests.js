describe('mParticle Core SDK', function () {
    var server,
        apiKey = 'test_key',
        getRequests = function (path) {
            var requests = [],
                fullPath = '/v1/JS/' + apiKey + '/' + path;

            server.requests.forEach(function (item) {
                if (item.urlParts.path == fullPath) {
                    requests.push(item);
                }
            });

            return requests;
        },
        getEvent = function (eventName, isForwarding) {
            var requests = getRequests(isForwarding ? 'Forwarding' : 'Events'),
                matchedEvent = {};

            requests.forEach(function (item) {
                var data = JSON.parse(item.requestText);

                if (data.n === eventName) {
                    matchedEvent = data;
                }
            });

            return matchedEvent;
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
        MockForwarder = function () {
            var self = this;

            this.id = 1;
            this.initCalled = false;
            this.processCalled = false;
            this.setUserIdentityCalled = false;
            this.setOptOutCalled = false;
            this.setUserAttributeCalled = false;
            this.reportingService = null;
            this.name = 'MockForwarder';
            this.userAttributeFilters = [];
            this.setUserIdentityCalled = false;

            this.init = function (settings, reportingService, id) {
                self.reportingService = reportingService;
                self.initCalled = true;
            };

            this.process = function (event) {
                self.processCalled = true;
                self.reportingService(1, event);
            };

            this.setUserIdentity = function () {
                self.setUserIdentityCalled = true;
            };

            this.settings = {
                PriorityValue: 1
            };

            this.setOptOut = function () {
                this.setOptOutCalled = true;
            };

            this.setUserAttribute = function () {
                this.setUserAttributeCalled = true;
            };

            this.setUserIdentity = function () {
                this.setUserIdentityCalled = true;
            };
        };

    before(function () {
        server = new MockHttpServer();
        server.start();
    });

    beforeEach(function () {
        server.requests = [];
        mParticle.reset();
        mParticle.init(apiKey);
    });

    it('should log an event', function (done) {
        window.mParticle.logEvent('Test Event', mParticle.EventType.Navigation, { mykey: 'myvalue' });
        var data = getEvent('Test Event');

        data.should.have.property('n', 'Test Event');
        data.should.have.property('et', mParticle.EventType.Navigation);
        data.should.have.property('attrs');
        data.attrs.should.have.property('mykey', 'myvalue')

        done();
    });

    it('should log an error', function (done) {
        mParticle.logError('my error');

        var data = getEvent('Error');

        Should(data).be.ok();

        data.should.have.property('n', 'Error');
        data.should.have.property('attrs');
        data.attrs.should.have.property('m', 'my error');

        done();
    });

    it('should log a page view', function (done) {
        mParticle.logPageView();

        var event = getEvent(window.location.pathname);

        Should(event).be.ok();

        event.should.have.property('attrs');
        event.attrs.should.have.property('hostname', window.location.hostname);
        event.attrs.should.have.property('title', window.document.title);

        done();
    });

    it('should create ecommerce product', function (done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400, 2);

        product.should.have.property('Name', 'iPhone');
        product.should.have.property('Sku', '12345');
        product.should.have.property('Price', 400);
        product.should.have.property('Quantity', 2);

        done();
    });

    it('should create transaction attributes', function (done) {
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

    it('should log ecommerce event', function (done) {
        var product = mParticle.eCommerce.createProduct('iPhone',
                '12345',
                400,
                2,
                'Apple',
                'Plus',
                'Phones',
                1,
                'my-coupon-code',
                {customkey: 'customvalue'}),
            transactionAttributes = mParticle.eCommerce.createTransactionAttributes('12345',
            'test-affiliation',
            'coupon-code',
            44334,
            600,
            200);

        mParticle.eCommerce.logPurchase(transactionAttributes, product);
        var data = getEvent(MessageType.Commerce);

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

    it('should create promotion', function (done) {
        var promotion = mParticle.eCommerce.createPromotion('12345', 'my-creative', 'creative-name', 1);

        Should(promotion).be.ok();

        promotion.should.have.property('Id', '12345');
        promotion.should.have.property('Creative', 'my-creative');
        promotion.should.have.property('Name', 'creative-name');
        promotion.should.have.property('Position', 1);

        done();
    });

    it ('should log promotion click', function (done) {
        var promotion = mParticle.eCommerce.createPromotion('12345', 'my-creative', 'creative-name', 1);

        mParticle.eCommerce.logPromotion(mParticle.PromotionType.PromotionClick, promotion);

        var event = getEvent(MessageType.Commerce);

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

    it('should create impression', function (done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400),
            impression = mParticle.eCommerce.createImpression('impression-name', product);

        impression.should.have.property('Name', 'impression-name');
        impression.should.have.property('Product');
        impression.Product.should.have.property('Sku', '12345');

        done();
    });

    it('should log impression event', function (done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400),
            impression = mParticle.eCommerce.createImpression('impression-name', product);

        mParticle.eCommerce.logImpression(impression);

        var event = getEvent(MessageType.Commerce);

        Should(event).be.ok();

        event.should.have.property('pi').with.lengthOf(1);
        event.pi[0].should.have.property('pil', 'impression-name');
        event.pi[0].should.have.property('pl').with.lengthOf(1);
        event.pi[0].pl[0].should.have.property('id', '12345');

        done();
    });

    it('should log ecommerce refund', function (done) {
        var transaction = mParticle.eCommerce.createTransactionAttributes('12345');

        mParticle.eCommerce.logRefund(transaction);

        var event = getEvent(MessageType.Commerce);

        Should(event).be.ok();

        event.should.have.property('pd');
        event.pd.should.have.property('an', ProductActionType.Refund);
        event.pd.should.have.property('ti', '12345');

        done();
    });
    
    it('should add products to cart', function (done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);

        mParticle.eCommerce.Cart.add(product, true);

        var data = getEvent(MessageType.Commerce);

        data.should.have.property('pd');
        data.pd.should.have.property('an', ProductActionType.AddToCart);
        data.pd.should.have.property('pl').with.lengthOf(1);
        data.pd.pl[0].should.have.property('id', '12345');

        done();
    });

    it('should remove products to cart', function (done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);

        mParticle.eCommerce.Cart.add(product);
        mParticle.eCommerce.Cart.remove({ Sku: '12345' }, true);

        var data = getEvent(MessageType.Commerce);

        data.should.have.property('pd');
        data.pd.should.have.property('an', ProductActionType.RemoveFromCart);
        data.pd.should.have.property('pl').with.lengthOf(1);
        data.pd.pl[0].should.have.property('id', '12345');

        done();
    });

    it('should add product to product bag', function (done) {
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

    it('should remove product from product bag', function (done) {
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

    it('should clear product bag', function (done) {
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

    it('should log checkout', function (done) {
        mParticle.eCommerce.logCheckout(1, 'Visa');

        var event = getEvent(MessageType.Commerce);

        Should(event).be.ok();

        event.should.have.property('et', CommerceEventType.ProductCheckout);
        event.should.have.property('pd');

        event.pd.should.have.property('an', ProductActionType.Checkout);
        event.pd.should.have.property('cs', 1);
        event.pd.should.have.property('co', 'Visa');

        done();
    });

    it('should log product action', function (done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);

        mParticle.eCommerce.logProductAction(ProductActionType.ViewDetail, product);

        var event = getEvent(MessageType.Commerce);

        event.should.have.property('et', CommerceEventType.ProductViewDetail);
        event.should.have.property('pd');
        event.pd.should.have.property('an', ProductActionType.ViewDetail);
        event.pd.should.have.property('pl').with.lengthOf(1);
        event.pd.pl[0].should.have.property('id', '12345');

        Should(event).be.ok();

        done();
    });

    it('should add user identities', function (done) {
        mParticle.setUserIdentity('test@mparticle.com', mParticle.IdentityType.CustomerId);

        var identity = mParticle.getUserIdentity('test@mparticle.com');

        identity.should.have.property('Identity', 'test@mparticle.com');
        identity.should.have.property('Type', mParticle.IdentityType.CustomerId);

        done();
    });

    it('should remove user identities', function (done) {
        mParticle.setUserIdentity('test@mparticle.com', mParticle.IdentityType.CustomerId);
        mParticle.removeUserIdentity('test@mparticle.com');
        
        var identity = mParticle.getUserIdentity('test@mparticle.com');

        Should(identity).not.be.ok();

        done();
    });

    it('should invoke forwarder setIdentity', function (done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mParticle.init(apiKey);

        mParticle.setUserIdentity('test@mparticle.com', mParticle.IdentityType.CustomerId);

        mockForwarder.should.have.property('setUserIdentityCalled', true);

        done();
    });

    it('starts new session', function (done) {
        mParticle.startNewSession();

        var data = getEvent(MessageType.SessionStart);

        Should(data).be.ok();
        
        data.should.have.property('sid');

        done();
    });

    it('ends existing session', function (done) {
        mParticle.startNewSession();
        mParticle.endSession();

        var data = getEvent(MessageType.SessionStart);

        Should(data).be.ok();

        done();
    });

    it('initializes forwarder', function (done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mParticle.init(apiKey);

        mockForwarder.should.have.property('initCalled', true);

        done();
    });

    it('sends event to forwarder', function (done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mParticle.init(apiKey);

        mParticle.logEvent('send this event to forwarder');

        mockForwarder.should.have.property('processCalled', true);

        done();
    });

    it('sends forwarding stats', function (done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
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

    it('should log opt out', function (done) {
        mParticle.setOptOut(true);

        var event = getEvent(MessageType.OptOut);

        event.should.have.property('dt', MessageType.OptOut);
        event.should.have.property('o', true);

        done();
    });

    it('should invoke forwarder opt out', function (done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mParticle.init(apiKey);
        mParticle.setOptOut(true);

        mockForwarder.should.have.property('setOptOutCalled', true);

        done();
    });

    it('should add user attribute', function (done) {
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

    it('should remove user attribute', function (done) {
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

    it('should set session attribute', function (done) {
        mParticle.setSessionAttribute('name', 'test');

        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('sa');
        event.sa.should.have.property('name', 'test');

        done();
    });

    it('should remove session attributes when session ends', function (done) {
        mParticle.startNewSession();
        mParticle.setSessionAttribute('name', 'test');
        mParticle.endSession();
        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('sa');
        event.sa.should.not.have.property('name');

        done();
    });

    it('should invoke forwarder setuserattribute', function (done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();

        mParticle.addForwarder(mockForwarder);
        mParticle.init(apiKey);
        mParticle.setUserAttribute('gender', 'male');

        mockForwarder.should.have.property('setUserAttributeCalled', true);

        done();
    });

    it('should set and log position', function (done) {
        mParticle.setPosition(34.134103, -118.321694);
        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('lc');
        event.lc.should.have.property('lat', 34.134103);
        event.lc.should.have.property('lng', -118.321694);

        done();
    });

    it('should set user tag', function (done) {
        mParticle.setUserTag('test');

        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('ua');
        event.ua.should.have.property('test', null);

        done();
    });

    it('should remove user tag', function (done) {
        mParticle.setUserTag('test');
        mParticle.removeUserTag('test');

        mParticle.logEvent('test event');

        var event = getEvent('test event');

        event.should.have.property('ua');
        event.ua.should.not.have.property('test');

        done();
    });

    it('should log legacy ecommerce transaction', function (done) {
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

    after(function () {
        server.stop();
    });
});