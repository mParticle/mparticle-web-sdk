import TestsCore from './tests-core';

var apiKey = TestsCore.apiKey,
    testMPID = TestsCore.testMPID,
    getLocalStorageProducts = TestsCore.getLocalStorageProducts,
    MPConfig = TestsCore.MPConfig,
    forwarderDefaultConfiguration = TestsCore.forwarderDefaultConfiguration,
    ProductActionType = TestsCore.ProductActionType,
    PromotionActionType = TestsCore.PromotionActionType,
    getEvent = TestsCore.getEvent,
    workspaceToken = TestsCore.workspaceToken,
    CommerceEventType = TestsCore.CommerceEventType,
    MockForwarder = TestsCore.MockForwarder,
    server = TestsCore.server;

describe('eCommerce', function() {
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
                '400',
                2,
                'Plus',
                'Phones',
                'Apple',
                1,
                'my-coupon-code',
                { customkey: 'customvalue' }
            ),
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

    it('should log badly formed ecommerce event', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone',
                '12345',
                Infinity,
                '2-foo',
                'Plus',
                'Phones',
                'Apple',
                '1-foo',
                'my-coupon-code',
                { customkey: 'customvalue' }
            ),
            transactionAttributes = mParticle.eCommerce.createTransactionAttributes('12345',
                'test-affiliation',
                'coupon-code',
                '44334-foo',
                '600-foo',
                '200-foo');

        mParticle.eCommerce.logPurchase(transactionAttributes, product);
        var data = getEvent('eCommerce - Purchase');

        data.should.have.property('pd');
        data.pd.should.have.property('an', ProductActionType.Purchase);
        data.pd.should.have.property('ti', '12345');
        data.pd.should.have.property('ta', 'test-affiliation');
        data.pd.should.have.property('tcc', 'coupon-code');
        data.pd.should.have.property('tr', 0);
        data.pd.should.have.property('ts', 0);
        data.pd.should.have.property('tt', 0);
        data.pd.should.have.property('pl').with.lengthOf(1);

        data.pd.pl[0].should.have.property('id', '12345');
        data.pd.pl[0].should.have.property('nm', 'iPhone');
        data.pd.pl[0].should.have.property('pr', 0);
        data.pd.pl[0].should.have.property('qt', 0);
        data.pd.pl[0].should.have.property('br', 'Apple');
        data.pd.pl[0].should.have.property('va', 'Plus');
        data.pd.pl[0].should.have.property('ca', 'Phones');
        data.pd.pl[0].should.have.property('ps', 0);
        data.pd.pl[0].should.have.property('cc', 'my-coupon-code');
        data.pd.pl[0].should.have.property('tpa', 0);
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

    it('should log multiple impression when an array of impressions is passed', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400),
            impression = mParticle.eCommerce.createImpression('impression-name1', product),
            product2 = mParticle.eCommerce.createProduct('Android', '23456', 200),
            impression2 = mParticle.eCommerce.createImpression('impression-name2', product2);

        mParticle.eCommerce.logImpression([impression, impression2]);

        var event1 = getEvent('eCommerce - Impression');

        event1.should.have.property('pi').with.lengthOf(2);
        event1.pi[0].should.have.property('pil', 'impression-name1');
        event1.pi[0].should.have.property('pl').with.lengthOf(1);
        event1.pi[0].pl[0].should.have.property('id', '12345');

        event1.pi[1].should.have.property('pil', 'impression-name2');
        event1.pi[1].should.have.property('pl').with.lengthOf(1);
        event1.pi[1].pl[0].should.have.property('id', '23456');

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

    it('should update cart products in cookies after adding/removing product to/from a cart and clearing cart', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);

        mParticle.eCommerce.Cart.add(product);
        var products1 = getLocalStorageProducts();

        products1[testMPID].cp[0].should.have.properties(['Name', 'Sku', 'Price']);

        mParticle.eCommerce.Cart.remove(product);
        var products2 = getLocalStorageProducts();
        products2[testMPID].cp.length.should.equal(0);

        mParticle.eCommerce.Cart.add(product);
        var products3 = getLocalStorageProducts();
        products3[testMPID].cp[0].should.have.properties(['Name', 'Sku', 'Price']);

        mParticle.eCommerce.Cart.clear();
        var products4 = getLocalStorageProducts();
        products4[testMPID].cp.length.should.equal(0);

        done();
    });

    it('should not add the (config.maxProducts + 1st) item to cookie cartItems and only send cookie cartProducts when logging', function(done) {
        mParticle.config.maxProducts = 10;
        mParticle.config.workspaceToken = workspaceToken;
        mParticle.init(apiKey, window.mParticle.config);

        var product = mParticle.eCommerce.createProduct('Product', '12345', 400);
        for (var i = 0; i < mParticle.config.maxProducts; i++) {
            mParticle.eCommerce.Cart.add(product);
        }

        mParticle.eCommerce.Cart.add(mParticle.eCommerce.createProduct('Product11', '12345', 400));
        var products1 = getLocalStorageProducts();

        var foundProductInCookies = products1[testMPID].cp.filter(function(product) {
            return product.Name === 'Product11';
        })[0];

        products1[testMPID].cp.length.should.equal(10);
        Should(foundProductInCookies).be.ok();

        // Events log with in memory data, so product bag has 21 and product is found in memory
        mParticle.eCommerce.logCheckout();
        var event = getEvent('eCommerce - Checkout');
        var product11 = event.pd.pl.filter(function(product) {
            return product.nm === 'Product11';
        })[0];

        event.pd.pl.length.should.equal(10);
        product11.nm.should.equal('Product11');

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

    it('should log checkout option', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);
        server.requests = [];
        mParticle.eCommerce.logProductAction(ProductActionType.CheckoutOption, product, {color: 'blue'});

        var event = getEvent('eCommerce - CheckoutOption');

        Should(event).be.ok();

        event.should.have.property('et', CommerceEventType.ProductCheckoutOption);
        event.should.have.property('pd');

        event.pd.should.have.property('an', ProductActionType.CheckoutOption);
        event.attrs.should.have.property('color', 'blue');
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

    it('should fail to create product if name not a string', function(done) {
        var product = mParticle.eCommerce.createProduct(null);
        var product2 = mParticle.eCommerce.createProduct(undefined);
        var product3 = mParticle.eCommerce.createProduct(['product']);
        var product4 = mParticle.eCommerce.createProduct(123);
        var product5 = mParticle.eCommerce.createProduct({key: 'value'});

        Should(product).not.be.ok();
        Should(product2).not.be.ok();
        Should(product3).not.be.ok();
        Should(product4).not.be.ok();
        Should(product5).not.be.ok();

        done();
    });

    it('should fail to create product if sku not a string or a number', function(done) {
        var product = mParticle.eCommerce.createProduct('test', null);
        var product2 = mParticle.eCommerce.createProduct('test', {key: 'value'});
        var product3 = mParticle.eCommerce.createProduct('test', []);
        var product4 = mParticle.eCommerce.createProduct('test', undefined);

        Should(product).not.be.ok();
        Should(product2).not.be.ok();
        Should(product3).not.be.ok();
        Should(product4).not.be.ok();

        done();
    });

    it('should fail to create product if price not a string or number', function(done) {
        var product = mParticle.eCommerce.createProduct('test', 'sku', null);
        var product2 = mParticle.eCommerce.createProduct('test', 'sku', null);
        var product3 = mParticle.eCommerce.createProduct('test', 'sku', null);
        var product4 = mParticle.eCommerce.createProduct('test', 'sku', null);

        Should(product).not.be.ok();
        Should(product2).not.be.ok();
        Should(product3).not.be.ok();
        Should(product4).not.be.ok();

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

    it('should support array of products when adding to cart', function(done) {
        mParticle.reset(MPConfig);
        mParticle.init(apiKey, window.mParticle.config);

        var product1 = mParticle.eCommerce.createProduct('iPhone', '12345', 400, 2),
            product2 = mParticle.eCommerce.createProduct('Nexus', '67890', 300, 1);

        mParticle.eCommerce.Cart.add([product1, product2], true);

        var event = getEvent('eCommerce - AddToCart');

        Should(event).be.ok();

        event.should.have.property('pd');
        event.pd.should.have.property('an', ProductActionType.AddToCart);
        event.pd.should.have.property('pl').with.lengthOf(2);

        event.pd.pl[0].should.have.property('id', '12345');
        event.pd.pl[0].should.have.property('nm', 'iPhone');

        event.pd.pl[1].should.have.property('id', '67890');
        event.pd.pl[1].should.have.property('nm', 'Nexus');

        done();
    });

    it('should support a single product when adding to cart', function(done) {
        mParticle.reset(MPConfig);
        mParticle.init(apiKey, window.mParticle.config);

        var product1 = mParticle.eCommerce.createProduct('iPhone', '12345', 400, 2);

        mParticle.eCommerce.Cart.add(product1, true);

        var event = getEvent('eCommerce - AddToCart');

        Should(event).be.ok();

        event.should.have.property('pd');
        event.pd.should.have.property('an', ProductActionType.AddToCart);
        event.pd.should.have.property('pl').with.lengthOf(1);

        event.pd.pl[0].should.have.property('id', '12345');
        event.pd.pl[0].should.have.property('nm', 'iPhone');

        done();
    });

    it('expand product purchase commerce event', function(done) {
        mParticle.reset(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);
        
        mParticle.init(apiKey, window.mParticle.config);
        mParticle.eCommerce.setCurrencyCode('foo-currency');
        var productAttributes = {};
        productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

        var eventAttributes = {};
        eventAttributes['foo-event-attribute-key'] = 'foo-event-attribute-value';

        var product = mParticle.eCommerce.createProduct('Foo name',
            'Foo sku',
            100.00,
            4, 'foo-variant', 'foo-category', 'foo-brand', 5, 'foo-productcouponcode', productAttributes);

        var transactionAttributes = mParticle.eCommerce.createTransactionAttributes('foo-transaction-id', 'foo-affiliation', 'foo-couponcode', 400, 10, 8);
        mParticle.eCommerce.logPurchase(transactionAttributes, product, false, eventAttributes);
        window.MockForwarder1.instance.receivedEvent.should.have.property('ProductAction');
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(window.MockForwarder1.instance.receivedEvent);
        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(2);

        var plusOneEvent = expandedEvents[0];
        plusOneEvent.should.have.property('EventName', 'eCommerce - purchase - Total');
        plusOneEvent.should.have.property('EventCategory', mParticle.EventType.Transaction);
        var attributes = plusOneEvent.EventAttributes;
        attributes.should.have.property('Transaction Id', 'foo-transaction-id');
        attributes.should.have.property('Affiliation', 'foo-affiliation');
        attributes.should.have.property('Coupon Code', 'foo-couponcode');
        attributes.should.have.property('Total Amount', 400);
        attributes.should.have.property('Shipping Amount', 10);
        attributes.should.have.property('Product Count', 1);
        attributes.should.have.property('Tax Amount', 8);
        attributes.should.have.property('Currency Code', 'foo-currency');
        attributes.should.have.property('foo-event-attribute-key', 'foo-event-attribute-value');

        var productEvent = expandedEvents[1];
        productEvent.should.have.property('EventName', 'eCommerce - purchase - Item');
        productEvent.should.have.property('EventCategory', mParticle.EventType.Transaction);
        attributes = productEvent.EventAttributes;
        attributes.should.not.have.property('Affiliation');
        attributes.should.not.have.property('Total Amount');
        attributes.should.not.have.property('Shipping Amount');
        attributes.should.not.have.property('Tax Amount');
        attributes.should.have.property('foo-event-attribute-key');
        attributes.should.have.property('Coupon Code', 'foo-productcouponcode');
        attributes.should.have.property('Brand', 'foo-brand');
        attributes.should.have.property('Category', 'foo-category');
        attributes.should.have.property('Name', 'Foo name');
        attributes.should.have.property('Id', 'Foo sku');
        attributes.should.have.property('Item Price', 100.00);
        attributes.should.have.property('Quantity', 4);
        attributes.should.have.property('Position', 5);
        attributes.should.have.property('foo-attribute-key', 'foo-product-attribute-value');

        done();
    });

    it('expand product refund commerce event', function(done) {
        mParticle.reset(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        var productAttributes = {};
        productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

        var eventAttributes = {};
        eventAttributes['foo-event-attribute-key'] = 'foo-event-attribute-value';

        var product = mParticle.eCommerce.createProduct('Foo name',
            'Foo sku',
            100.00,
            4, 'foo-variant', 'foo-category', 'foo-brand', 5, 'foo-productcouponcode', productAttributes);

        var transactionAttributes = mParticle.eCommerce.createTransactionAttributes('foo-transaction-id', 'foo-affiliation', 'foo-couponcode', 400, 10, 8);
        mParticle.eCommerce.logRefund(transactionAttributes, product, false, eventAttributes);
        window.MockForwarder1.instance.receivedEvent.should.have.property('ProductAction');
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(window.MockForwarder1.instance.receivedEvent);
        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(2);

        var plusOneEvent = expandedEvents[0];
        plusOneEvent.should.have.property('EventName', 'eCommerce - refund - Total');
        var attributes = plusOneEvent.EventAttributes;
        attributes.should.have.property('Product Count', 1);

        var productEvent = expandedEvents[1];
        productEvent.should.have.property('EventName', 'eCommerce - refund - Item');

        done();
    });

    it('expand non-plus-one-product commerce event', function(done) {
        mParticle.reset(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        var productAttributes = {};
        productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

        var eventAttributes = {};
        eventAttributes['foo-event-attribute-key'] = 'foo-event-attribute-value';

        var product = mParticle.eCommerce.createProduct('Foo name',
            'Foo sku',
            100.00,
            4, 'foo-variant', 'foo-category', 'foo-brand', 5, 'foo-productcouponcode', productAttributes);

        mParticle.eCommerce.logProductAction(mParticle.ProductActionType.RemoveFromWishlist, product, eventAttributes);
        window.MockForwarder1.instance.receivedEvent.should.have.property('ProductAction');
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(window.MockForwarder1.instance.receivedEvent);
        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

        var productEvent = expandedEvents[0];
        productEvent.should.have.property('EventName', 'eCommerce - remove_from_wishlist - Item');
        productEvent.should.have.property('EventCategory', mParticle.EventType.Transaction);
        var attributes = productEvent.EventAttributes;

        attributes.should.have.property('Coupon Code', 'foo-productcouponcode');
        attributes.should.have.property('Brand', 'foo-brand');
        attributes.should.have.property('Category', 'foo-category');
        attributes.should.have.property('Name', 'Foo name');
        attributes.should.have.property('Id', 'Foo sku');
        attributes.should.have.property('Item Price', 100.00);
        attributes.should.have.property('Quantity', 4);
        attributes.should.have.property('Position', 5);
        attributes.should.have.property('foo-attribute-key', 'foo-product-attribute-value');

        done();
    });

    it('expand checkout commerce event', function(done) {
        mParticle.reset(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        var eventAttributes = {};
        eventAttributes['foo-event-attribute-key'] = 'foo-event-attribute-value';

        var productAttributes = {};
        productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

        var product = mParticle.eCommerce.createProduct('Foo name',
            'Foo sku',
            100.00,
            4, 'foo-variant', 'foo-category', 'foo-brand', 5, 'foo-productcouponcode', productAttributes);

        mParticle.eCommerce.Cart.add(product, true);
        mParticle.eCommerce.logCheckout('foo-step', 'foo-options', eventAttributes);
        window.MockForwarder1.instance.receivedEvent.should.have.property('ProductAction');
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(window.MockForwarder1.instance.receivedEvent);
        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

        var productEvent = expandedEvents[0];
        productEvent.should.have.property('EventName', 'eCommerce - checkout - Item');
        productEvent.should.have.property('EventCategory', mParticle.EventType.Transaction);
        var attributes = productEvent.EventAttributes;

        attributes.should.have.property('Checkout Step', 'foo-step');
        attributes.should.have.property('Checkout Options', 'foo-options');
        attributes.should.have.property('Coupon Code', 'foo-productcouponcode');
        attributes.should.have.property('Brand', 'foo-brand');
        attributes.should.have.property('Category', 'foo-category');
        attributes.should.have.property('Name', 'Foo name');
        attributes.should.have.property('Id', 'Foo sku');
        attributes.should.have.property('Item Price', 100.00);
        attributes.should.have.property('Quantity', 4);
        attributes.should.have.property('Position', 5);
        attributes.should.have.property('foo-attribute-key', 'foo-product-attribute-value');

        done();
    });

    it('expand promotion commerce event', function(done) {
        mParticle.reset(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);
        
        mParticle.init(apiKey, window.mParticle.config);

        var eventAttributes = {};
        eventAttributes['foo-event-attribute-key'] = 'foo-event-attribute-value';

        var promotion = mParticle.eCommerce.createPromotion('foo-id', 'foo-creative', 'foo-name', 5);
        mParticle.eCommerce.logPromotion(mParticle.PromotionType.PromotionClick, promotion, eventAttributes);
        window.MockForwarder1.instance.receivedEvent.should.have.property('PromotionAction');
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(window.MockForwarder1.instance.receivedEvent);
        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

        var promotionEvent = expandedEvents[0];
        promotionEvent.should.have.property('EventName', 'eCommerce - click - Item');
        promotionEvent.should.have.property('EventCategory', mParticle.EventType.Transaction);
        var attributes = promotionEvent.EventAttributes;

        attributes.should.have.property('Id', 'foo-id');
        attributes.should.have.property('Creative', 'foo-creative');
        attributes.should.have.property('Name', 'foo-name');
        attributes.should.have.property('Position', 5);
        attributes.should.have.property('foo-event-attribute-key', 'foo-event-attribute-value');

        done();
    });


    it('expand null commerce event', function(done) {
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(null);
        (expandedEvents == null).should.be.true;

        done();
    });

    it('expand impression commerce event', function(done) {
        mParticle.reset(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);
        
        mParticle.init(apiKey, window.mParticle.config);

        var productAttributes = {};
        productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

        var eventAttributes = {};
        eventAttributes['foo-event-attribute-key'] = 'foo-event-attribute-value';

        var product = mParticle.eCommerce.createProduct('Foo name',
            'Foo sku',
            100.00,
            4, 'foo-variant', 'foo-category', 'foo-brand', 5, 'foo-productcouponcode', productAttributes);

        var impression = mParticle.eCommerce.createImpression('suggested products list', product);

        mParticle.eCommerce.logImpression(impression, eventAttributes);
        window.MockForwarder1.instance.receivedEvent.should.have.property('ProductImpressions');
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(window.MockForwarder1.instance.receivedEvent);

        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

        var impressionEvent = expandedEvents[0];
        impressionEvent.should.have.property('EventName', 'eCommerce - Impression - Item');
        impressionEvent.should.have.property('EventCategory', mParticle.EventType.Transaction);
        var attributes = impressionEvent.EventAttributes;

        attributes.should.have.property('Product Impression List', 'suggested products list');
        attributes.should.have.property('Coupon Code', 'foo-productcouponcode');
        attributes.should.have.property('Brand', 'foo-brand');
        attributes.should.have.property('Category', 'foo-category');
        attributes.should.have.property('Name', 'Foo name');
        attributes.should.have.property('Id', 'Foo sku');
        attributes.should.have.property('Item Price', 100.00);
        attributes.should.have.property('Quantity', 4);
        attributes.should.have.property('Position', 5);
        attributes.should.have.property('foo-attribute-key', 'foo-product-attribute-value');
        attributes.should.have.property('foo-event-attribute-key', 'foo-event-attribute-value');

        done();
    });

    it('should add customFlags to logCheckout events', function(done) {
        mParticle.eCommerce.logCheckout(1, {}, {}, {interactionEvent: true});
        var event = getEvent('eCommerce - Checkout');
        Array.isArray(event.flags.interactionEvent).should.equal(true);
        event.flags.interactionEvent[0].should.equal('true');

        done();
    });

    it('should add customFlags to logProductAction events', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', 'sku1', 499);
        mParticle.eCommerce.logProductAction(0, product, {price: 5}, {interactionEvent: true});

        var event = getEvent('eCommerce - Unknown');
        Array.isArray(event.flags.interactionEvent).should.equal(true);
        event.flags.interactionEvent[0].should.equal('true');

        done();
    });

    it('should add customFlags to logPurchase events', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', 'sku1', 499);
        var transactionAttributes = mParticle.eCommerce.createTransactionAttributes('id1', 'affil1', 'couponCode1');
        mParticle.eCommerce.logPurchase(transactionAttributes, product, true, {shipping: 5}, {interactionEvent: true});
        var event = getEvent('eCommerce - Purchase');
        Array.isArray(event.flags.interactionEvent).should.equal(true);
        event.flags.interactionEvent[0].should.equal('true');

        done();
    });

    it('should add customFlags to logPromotion events', function(done) {
        var promotion = mParticle.eCommerce.createPromotion('id', 'creative', 'name');
        mParticle.eCommerce.logPromotion(0, promotion, {shipping: 5}, {interactionEvent: true});
        var event = getEvent('eCommerce - Unknown');
        Array.isArray(event.flags.interactionEvent).should.equal(true);
        event.flags.interactionEvent[0].should.equal('true');

        done();
    });

    it('should add customFlags to logImpression events', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', 'sku1', 499);
        var impression = mParticle.eCommerce.createImpression('iphoneImpressionName', product);
        mParticle.eCommerce.logImpression(impression, {shipping: 5}, {interactionEvent: true});
        var event = getEvent('eCommerce - Impression');
        Array.isArray(event.flags.interactionEvent).should.equal(true);
        event.flags.interactionEvent[0].should.equal('true');

        done();
    });

    it('should add customFlags to logRefund events', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', 'sku1', 499);
        var transactionAttributes = mParticle.eCommerce.createTransactionAttributes('id1', 'affil1', 'couponCode1');
        mParticle.eCommerce.logRefund(transactionAttributes, product, true, {shipping: 5}, {interactionEvent: true});
        var event = getEvent('eCommerce - Refund');
        Array.isArray(event.flags.interactionEvent).should.equal(true);
        event.flags.interactionEvent[0].should.equal('true');

        done();
    });
});
