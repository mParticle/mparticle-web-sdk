var TestsCore = require('./tests-core'),
    apiKey = TestsCore.apiKey,
    MessageType = TestsCore.MessageType,
    testMPID = TestsCore.testMPID,
    ProductBag = TestsCore.ProductBag,
    getLocalStorageProducts = TestsCore.getLocalStorageProducts,
    ProductActionType = TestsCore.ProductActionType,
    PromotionActionType = TestsCore.PromotionActionType,
    getEvent = TestsCore.getEvent,
    CommerceEventType = TestsCore.CommerceEventType,
    MockForwarder = TestsCore.MockForwarder,
    mParticleAndroid = TestsCore.mParticleAndroid;

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

    it('should log badly formed ecommerce event', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone',
            '12345',
            Infinity,
            '2-foo',
            'Apple',
            'Plus',
            'Phones',
            '1-foo',
            'my-coupon-code',
            { customkey: 'customvalue' }),
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

        mParticle.eCommerce.Cart.clear(ProductBag);
        var products4 = getLocalStorageProducts();
        products4[testMPID].cp.length.should.equal(0);

        done();
    });

    it('should not add the (mParticle.maxProducts + 1st) item to cookie cartItems, but still persist all items in memory for logging', function(done) {
        var product = mParticle.eCommerce.createProduct('Product', '12345', 400);
        for (var i = 0; i < mParticle.maxProducts; i++) {
            mParticle.eCommerce.Cart.add(product);
        }

        mParticle.eCommerce.Cart.add(mParticle.eCommerce.createProduct('Product21', '12345', 400));
        var products1 = getLocalStorageProducts();

        var foundProductInCookies = products1[testMPID].cp.filter(function(product) {
            return product.Name === 'Product1';
        })[0];

        products1[testMPID].cp.length.should.equal(20);
        Should(foundProductInCookies).not.be.ok();

        // Events log with in memory data, so product bag has 21 and product is found in memory
        mParticle.eCommerce.logCheckout();
        var event = getEvent('eCommerce - Checkout');
        var foundProductInMemory = event.pd.pl.filter(function(product) {
            return product.nm === 'Product21';
        })[0];

        event.pd.pl.length.should.equal(21);
        foundProductInMemory.nm.should.equal('Product21');

        done();
    });

    it('should add product to product bag', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);

        mParticle.eCommerce.ProductBags.add(ProductBag, product);

        mParticle.logEvent('my event');

        var event = getEvent('my event');

        Should(event).be.ok();

        event.should.have.property('pb');

        event.pb.should.have.property(ProductBag);
        event.pb[ProductBag].should.have.property('pl').with.lengthOf(1);
        event.pb[ProductBag].pl[0].should.have.property('id', '12345');

        done();
    });

    it('should remove product from product bag', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);
        mParticle.eCommerce.ProductBags.add(ProductBag, product);
        mParticle.eCommerce.ProductBags.remove(ProductBag, product);

        mParticle.logEvent('my event');

        var event = getEvent('my event');

        Should(event).be.ok();

        event.should.have.property('pb');

        event.pb.should.have.property(ProductBag);
        event.pb[ProductBag].should.have.property('pl').with.lengthOf(0);

        done();
    });

    it('should clear product bag', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);
        mParticle.eCommerce.ProductBags.add(ProductBag, product);
        mParticle.eCommerce.ProductBags.clear(ProductBag);

        mParticle.logEvent('my event');

        var event = getEvent('my event');

        Should(event).be.ok();

        event.should.have.property('pb');

        event.pb.should.have.property(ProductBag);
        event.pb[ProductBag].should.have.property('pl').with.lengthOf(0);

        done();
    });

    it('should update product bags in storage after adding/removing product to/from a product bag and clearing product bag', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);
        mParticle.eCommerce.ProductBags.add(ProductBag, product);
        var products1 = getLocalStorageProducts();
        products1[testMPID].pb[ProductBag][0].should.have.properties(['Name', 'Sku', 'Price']);

        mParticle.eCommerce.ProductBags.remove(ProductBag, product);
        var products2 = getLocalStorageProducts();
        Object.keys(products2[testMPID].pb[ProductBag]).length.should.equal(0);

        mParticle.eCommerce.ProductBags.add(ProductBag, product);
        var products3 = getLocalStorageProducts();
        products3[testMPID].pb[ProductBag][0].should.have.properties(['Name', 'Sku', 'Price']);

        mParticle.eCommerce.ProductBags.clear(ProductBag);
        var products4 = getLocalStorageProducts();
        Object.keys(products4[testMPID].pb[ProductBag]).length.should.equal(0);

        done();
    });

    it('should not add the (mParticle.maxProducts + 1st) item to productBags, but still persist all items in memory for logging', function(done) {
        var product = mParticle.eCommerce.createProduct('Product', '12345', 400);
        for (var i = 0; i < mParticle.maxProducts; i++) {
            mParticle.eCommerce.ProductBags.add(ProductBag, product);
        }
        mParticle.eCommerce.ProductBags.add(ProductBag, mParticle.eCommerce.createProduct('Product21', '54321', 100));
        var products1 = getLocalStorageProducts();

        var foundProductInCookies = products1[testMPID].pb[ProductBag].filter(function(product) {
            return product.Name === 'Product1';
        })[0];

        products1[testMPID].pb[ProductBag].length.should.equal(20);
        Should(foundProductInCookies).not.be.ok();

        // Events log with in memory data, so in memory productBag should have 21 and product is found in memory
        mParticle.eCommerce.logCheckout();
        var event = getEvent('eCommerce - Checkout');
        var foundProductInMemory = event.pb[ProductBag].pl.filter(function(product) {
            return product.nm === 'Product21';
        })[0];

        event.pb[ProductBag].pl.length.should.equal(21);
        foundProductInMemory.nm.should.equal('Product21');

        done();
    });

    it('should not add products to invalid productBags', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);
        mParticle.eCommerce.ProductBags.add(null, product);
        mParticle.eCommerce.ProductBags.add(undefined, product);
        mParticle.eCommerce.ProductBags.add({key: 'value'}, product);
        mParticle.eCommerce.ProductBags.add([1, 2, 3], product);

        mParticle.logEvent('my event');

        var event = getEvent('my event');

        Should(event).be.ok();

        event.should.have.property('pb');
        Object.keys(event.pb).length.should.equal(0);

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

    it('should invoke native sdk method addToCart', function(done) {
        mParticle.reset();
        window.mParticleAndroid = new mParticleAndroid();
        mParticle.init(apiKey);

        mParticle.eCommerce.Cart.add({});

        window.mParticleAndroid.should.have.property('addToCartCalled', true);

        done();
    });

    it('should invoke native sdk method removeFromCart', function(done) {
        mParticle.reset();
        window.mParticleAndroid = new mParticleAndroid();
        mParticle.init(apiKey);

        mParticle.eCommerce.Cart.add({ Sku: '12345' });
        mParticle.eCommerce.Cart.remove({ Sku: '12345' });

        window.mParticleAndroid.should.have.property('removeFromCartCalled', true);

        done();
    });

    it('should invoke native sdk method clearCart', function(done) {
        mParticle.reset();
        window.mParticleAndroid = new mParticleAndroid();
        mParticle.init(apiKey);

        mParticle.eCommerce.Cart.clear();

        window.mParticleAndroid.should.have.property('clearCartCalled', true);

        done();
    });

    it('should invoke native sdk method addToProductBag', function(done) {
        mParticle.reset();
        window.mParticleAndroid = new mParticleAndroid();

        mParticle.eCommerce.ProductBags.add(ProductBag, {});

        window.mParticleAndroid.should.have.property('addToProductBagCalled', true);

        done();
    });

    it('should invoke native sdk method removeFromProductBag', function(done) {
        mParticle.reset();
        window.mParticleAndroid = new mParticleAndroid();

        mParticle.eCommerce.ProductBags.remove(ProductBag, {});

        window.mParticleAndroid.should.have.property('removeFromProductBagCalled', true);

        done();
    });

    it('should invoke native sdk method clearProductBag', function(done) {
        mParticle.reset();
        window.mParticleAndroid = new mParticleAndroid();

        mParticle.eCommerce.ProductBags.clear(ProductBag);

        window.mParticleAndroid.should.have.property('clearProductBagCalled', true);

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

    it('should not logLTVIncrease when no amount or an invalid amount is passed', function(done) {
        mParticle.logLTVIncrease();
        var event = getEvent('Increase LTV');

        mParticle.logLTVIncrease('error');
        var event2 = getEvent('Increase LTV');

        Should(event).not.be.ok();
        Should(event2).not.be.ok();

        done();
    });

    it('should support array of products when adding to cart', function(done) {
        mParticle.reset();
        mParticle.init(apiKey);

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
        mParticle.reset();
        mParticle.init(apiKey);

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
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure({
            name: 'MockCommerceForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true
        });
        mParticle.init(apiKey);
        mParticle.eCommerce.setCurrencyCode('foo-currency');
        var productAttributes = {};
        productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

        var eventAttributes = {};
        eventAttributes['foo-event-attribute-key'] = 'foo-event-attribute-value';

        var product = mParticle.eCommerce.createProduct('Foo name',
                    'Foo sku',
                    100.00,
                    4, 'foo-brand', 'foo-variant', 'foo-category', 'foo-position', 'foo-productcouponcode', productAttributes);

        var transactionAttributes = mParticle.eCommerce.createTransactionAttributes('foo-transaction-id', 'foo-affiliation', 'foo-couponcode', 400, 10, 8);
        mParticle.eCommerce.logPurchase(transactionAttributes, product, false, eventAttributes);
        mockForwarder.instance.receivedEvent.should.have.property('ProductAction');
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(mockForwarder.instance.receivedEvent);
        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(2);

        var plusOneEvent = expandedEvents[0];
        plusOneEvent.should.have.property('EventName', 'eCommerce - Purchase - Total');
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
        productEvent.should.have.property('EventName', 'eCommerce - Purchase - Item');
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
        attributes.should.have.property('Position', 'foo-position');
        attributes.should.have.property('foo-attribute-key', 'foo-product-attribute-value');

        done();
    });

    it('expand product refund commerce event', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure({
            name: 'MockCommerceForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true
        });
        mParticle.init(apiKey);

        var productAttributes = {};
        productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

        var eventAttributes = {};
        eventAttributes['foo-event-attribute-key'] = 'foo-event-attribute-value';

        var product = mParticle.eCommerce.createProduct('Foo name',
                    'Foo sku',
                    100.00,
                    4, 'foo-brand', 'foo-variant', 'foo-category', 'foo-position', 'foo-productcouponcode', productAttributes);

        var transactionAttributes = mParticle.eCommerce.createTransactionAttributes('foo-transaction-id', 'foo-affiliation', 'foo-couponcode', 400, 10, 8);
        mParticle.eCommerce.logRefund(transactionAttributes, product, false, eventAttributes);
        mockForwarder.instance.receivedEvent.should.have.property('ProductAction');
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(mockForwarder.instance.receivedEvent);
        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(2);

        var plusOneEvent = expandedEvents[0];
        plusOneEvent.should.have.property('EventName', 'eCommerce - Refund - Total');
        var attributes = plusOneEvent.EventAttributes;
        attributes.should.have.property('Product Count', 1);

        var productEvent = expandedEvents[1];
        productEvent.should.have.property('EventName', 'eCommerce - Refund - Item');

        done();
    });

    it('expand non-plus-one-product commerce event', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure({
            name: 'MockCommerceForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true
        });
        mParticle.init(apiKey);
        var productAttributes = {};
        productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

        var eventAttributes = {};
        eventAttributes['foo-event-attribute-key'] = 'foo-event-attribute-value';

        var product = mParticle.eCommerce.createProduct('Foo name',
                    'Foo sku',
                    100.00,
                    4, 'foo-brand', 'foo-variant', 'foo-category', 'foo-position', 'foo-productcouponcode', productAttributes);

        mParticle.eCommerce.logProductAction(mParticle.ProductActionType.RemoveFromWishlist, product, eventAttributes);
        mockForwarder.instance.receivedEvent.should.have.property('ProductAction');
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(mockForwarder.instance.receivedEvent);
        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

        var productEvent = expandedEvents[0];
        productEvent.should.have.property('EventName', 'eCommerce - RemoveFromWishlist - Item');
        productEvent.should.have.property('EventCategory', mParticle.EventType.Transaction);
        var attributes = productEvent.EventAttributes;

        attributes.should.have.property('Coupon Code', 'foo-productcouponcode');
        attributes.should.have.property('Brand', 'foo-brand');
        attributes.should.have.property('Category', 'foo-category');
        attributes.should.have.property('Name', 'Foo name');
        attributes.should.have.property('Id', 'Foo sku');
        attributes.should.have.property('Item Price', 100.00);
        attributes.should.have.property('Quantity', 4);
        attributes.should.have.property('Position', 'foo-position');
        attributes.should.have.property('foo-attribute-key', 'foo-product-attribute-value');

        done();
    });

    it('expand checkout commerce event', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure({
            name: 'MockCommerceForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true
        });
        mParticle.init(apiKey);

        var eventAttributes = {};
        eventAttributes['foo-event-attribute-key'] = 'foo-event-attribute-value';

        var productAttributes = {};
        productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

        var product = mParticle.eCommerce.createProduct('Foo name',
                    'Foo sku',
                    100.00,
                    4, 'foo-brand', 'foo-variant', 'foo-category', 'foo-position', 'foo-productcouponcode', productAttributes);

        mParticle.eCommerce.Cart.add(product, true);
        mParticle.eCommerce.logCheckout('foo-step', 'foo-options', eventAttributes);
        mockForwarder.instance.receivedEvent.should.have.property('ProductAction');
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(mockForwarder.instance.receivedEvent);
        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

        var productEvent = expandedEvents[0];
        productEvent.should.have.property('EventName', 'eCommerce - Checkout - Item');
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
        attributes.should.have.property('Position', 'foo-position');
        attributes.should.have.property('foo-attribute-key', 'foo-product-attribute-value');

        done();
    });

    it('expand promotion commerce event', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure({
            name: 'MockCommerceForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true
        });
        mParticle.init(apiKey);

        var eventAttributes = {};
        eventAttributes['foo-event-attribute-key'] = 'foo-event-attribute-value';

        var promotion = mParticle.eCommerce.createPromotion('foo-id', 'foo-creative', 'foo-name', 'foo-position');
        mParticle.eCommerce.logPromotion(mParticle.PromotionType.PromotionClick, promotion, eventAttributes);
        mockForwarder.instance.receivedEvent.should.have.property('PromotionAction');
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(mockForwarder.instance.receivedEvent);
        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

        var promotionEvent = expandedEvents[0];
        promotionEvent.should.have.property('EventName', 'eCommerce - click - Item');
        promotionEvent.should.have.property('EventCategory', mParticle.EventType.Transaction);
        var attributes = promotionEvent.EventAttributes;

        attributes.should.have.property('Id', 'foo-id');
        attributes.should.have.property('Creative', 'foo-creative');
        attributes.should.have.property('Name', 'foo-name');
        attributes.should.have.property('Position', 'foo-position');
        attributes.should.have.property('foo-event-attribute-key', 'foo-event-attribute-value');

        done();
    });


    it('expand null commerce event', function(done) {
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(null);
        (expandedEvents == null).should.be.true;

        done();
    });

    it('expand impression commerce event', function(done) {
        mParticle.reset();
        var mockForwarder = new MockForwarder();
        mParticle.addForwarder(mockForwarder);
        mockForwarder.configure({
            name: 'MockCommerceForwarder',
            settings: {},
            eventNameFilters: [],
            eventTypeFilters: [],
            attributeFilters: [],
            screenNameFilters: [],
            pageViewAttributeFilters: [],
            userIdentityFilters: [],
            userAttributeFilters: [],
            moduleId: 1,
            isDebug: false,
            HasDebugString: 'false',
            isVisible: true
        });
        mParticle.init(apiKey);

        var productAttributes = {};
        productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

        var eventAttributes = {};
        eventAttributes['foo-event-attribute-key'] = 'foo-event-attribute-value';

        var product = mParticle.eCommerce.createProduct('Foo name',
                    'Foo sku',
                    100.00,
                    4, 'foo-brand', 'foo-variant', 'foo-category', 'foo-position', 'foo-productcouponcode', productAttributes);

        var impression = mParticle.eCommerce.createImpression('suggested products list', product);

        mParticle.eCommerce.logImpression(impression, eventAttributes);
        mockForwarder.instance.receivedEvent.should.have.property('ProductImpressions');
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(mockForwarder.instance.receivedEvent);

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
        attributes.should.have.property('Position', 'foo-position');
        attributes.should.have.property('foo-attribute-key', 'foo-product-attribute-value');
        attributes.should.have.property('foo-event-attribute-key', 'foo-event-attribute-value');

        done();
    });
});
