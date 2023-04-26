import Utils from './utils';
import sinon from 'sinon';
import { urls, apiKey, workspaceToken, MPConfig, testMPID, ProductActionType, PromotionActionType } from './config';

var getLocalStorageProducts = Utils.getLocalStorageProducts,
    forwarderDefaultConfiguration = Utils.forwarderDefaultConfiguration,
    findEventFromRequest = Utils.findEventFromRequest,
    MockForwarder = Utils.MockForwarder,
    mockServer;

describe('eCommerce', function() {
    beforeEach(function() {
        mParticle._resetForTests(MPConfig);
        delete mParticle._instances['default_instance'];
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;
        window.fetchMock.post(urls.eventsV3, 200);

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        mockServer.restore();
        window.fetchMock.restore();
        mParticle._resetForTests(MPConfig);
    });

    it('should create ecommerce product', function(done) {
        var product = mParticle.eCommerce.createProduct(
            'iPhone',
            '12345',
            400,
            2
        );

        product.should.have.property('Name', 'iPhone');
        product.should.have.property('Sku', '12345');
        product.should.have.property('Price', 400);
        product.should.have.property('Quantity', 2);

        done();
    });

    it('should create transaction attributes', function(done) {
        var transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
            '12345',
            'test-affiliation',
            'coupon-code',
            44334,
            600,
            200
        );

        transactionAttributes.should.have.property('Id', '12345');
        transactionAttributes.should.have.property(
            'Affiliation',
            'test-affiliation'
        );
        transactionAttributes.should.have.property('CouponCode', 'coupon-code');
        transactionAttributes.should.have.property('Revenue', 44334);
        transactionAttributes.should.have.property('Shipping', 600);
        transactionAttributes.should.have.property('Tax', 200);

        done();
    });

    it('should log ecommerce event', function(done) {
        var product = mParticle.eCommerce.createProduct(
                'iPhone',
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
            transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                '12345',
                'test-affiliation',
                'coupon-code',
                44334,
                600,
                200
            );

        mParticle.eCommerce.logPurchase(transactionAttributes, product);

        var purchaseEvent = findEventFromRequest(window.fetchMock._calls, 'purchase');

        purchaseEvent.data.should.have.property('product_action');
        purchaseEvent.data.product_action.should.have.property('action', 'purchase');
        purchaseEvent.data.product_action.should.have.property('transaction_id', '12345');
        purchaseEvent.data.product_action.should.have.property('affiliation', 'test-affiliation');
        purchaseEvent.data.product_action.should.have.property('coupon_code', 'coupon-code');
        purchaseEvent.data.product_action.should.have.property('total_amount', 44334);
        purchaseEvent.data.product_action.should.have.property('shipping_amount', 600);
        purchaseEvent.data.product_action.should.have.property('tax_amount', 200);
        purchaseEvent.data.product_action.should.have.property('products').with.lengthOf(1);

        purchaseEvent.data.product_action.products[0].should.have.property('id', '12345');
        purchaseEvent.data.product_action.products[0].should.have.property('name', 'iPhone');
        purchaseEvent.data.product_action.products[0].should.have.property('price', 400);
        purchaseEvent.data.product_action.products[0].should.have.property('quantity', 2);
        purchaseEvent.data.product_action.products[0].should.have.property('brand', 'Apple');
        purchaseEvent.data.product_action.products[0].should.have.property('variant', 'Plus');
        purchaseEvent.data.product_action.products[0].should.have.property('category', 'Phones');
        purchaseEvent.data.product_action.products[0].should.have.property('total_product_amount', 800);
        purchaseEvent.data.product_action.products[0].should.have.property('position', 1);
        purchaseEvent.data.product_action.products[0].should.have.property('coupon_code', 'my-coupon-code');
        purchaseEvent.data.product_action.products[0].should.have.property('custom_attributes');

        purchaseEvent.data.product_action.products[0].custom_attributes.should.have.property('customkey', 'customvalue');

        done();
    });

    it('should not log a ecommerce event if there is a typo in the product action type', function(done) {
        // fetchMock calls will have session start and AST events, we want to reset so that we can prove the product action type does not go through (length remains 0 after logging)
        window.fetchMock._calls = [];
        var product = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                '400');

        // At this point, mockServer.requests contains 3 requests - an identity,
        // session start, and AST event. 
        // We empty it in order to prove the following event does not send an event
        mParticle.eCommerce.logProductAction(
            mParticle.ProductActionType.Typo, // <------ will result in a null when converting the product action type as this is not a real value
            [product]
        );
        window.fetchMock._calls.length.should.equal(0);

        done();
    });

    it('should log badly formed ecommerce event', function(done) {
        var product = mParticle.eCommerce.createProduct(
                'iPhone',
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
            transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                '12345',
                'test-affiliation',
                'coupon-code',
                '44334-foo',
                '600-foo',
                '200-foo'
            );

        mParticle.eCommerce.logPurchase(transactionAttributes, product);

        var purchaseEvent = findEventFromRequest(window.fetchMock._calls, 'purchase');
        
        purchaseEvent.data.should.have.property('product_action');
        purchaseEvent.data.product_action.should.have.property('action', 'purchase');
        purchaseEvent.data.product_action.should.have.property('transaction_id', '12345');
        purchaseEvent.data.product_action.should.have.property('affiliation', 'test-affiliation');
        purchaseEvent.data.product_action.should.have.property('coupon_code', 'coupon-code');
        purchaseEvent.data.product_action.should.have.property('total_amount', 0);
        purchaseEvent.data.product_action.should.have.property('shipping_amount', 0);
        purchaseEvent.data.product_action.should.have.property('tax_amount', 0);
        purchaseEvent.data.product_action.should.have.property('products').with.lengthOf(1);

        purchaseEvent.data.product_action.products[0].should.have.property('id', '12345');
        purchaseEvent.data.product_action.products[0].should.have.property('name', 'iPhone');
        purchaseEvent.data.product_action.products[0].should.have.property('price', 0);
        purchaseEvent.data.product_action.products[0].should.have.property('quantity', 0);
        purchaseEvent.data.product_action.products[0].should.have.property('brand', 'Apple');
        purchaseEvent.data.product_action.products[0].should.have.property('variant', 'Plus');
        purchaseEvent.data.product_action.products[0].should.have.property('category', 'Phones');
        purchaseEvent.data.product_action.products[0].should.have.property('position', null);
        purchaseEvent.data.product_action.products[0].should.have.property('coupon_code', 'my-coupon-code');
        purchaseEvent.data.product_action.products[0].should.have.property('total_product_amount', 0);
        purchaseEvent.data.product_action.products[0].should.have.property('custom_attributes');

        purchaseEvent.data.product_action.products[0].custom_attributes.should.have.property('customkey', 'customvalue');

        done();
    });

    it('should log identical events for logPurchase and logProductAction with product action type of `purchase`', function(done) {
        var product = mParticle.eCommerce.createProduct(
                'iPhone',
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
            transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                '12345',
                'test-affiliation',
                'coupon-code',
                44334,
                600,
                200
            );

        mParticle.eCommerce.logPurchase(transactionAttributes, product);
        const purchaseEvent1 = findEventFromRequest(window.fetchMock._calls, 'purchase');

        window.fetchMock._calls = [];

        mParticle.eCommerce.logProductAction(mParticle.ProductActionType.Purchase, product, null, null, transactionAttributes)
        const purchaseEvent2 = findEventFromRequest(window.fetchMock._calls, 'purchase');

        const { product_action: productAction1 } = purchaseEvent1.data;
        const { product_action: productAction2 } = purchaseEvent2.data

        productAction1.action.should.equal(productAction2.action);
        productAction1.transaction_id.should.equal(productAction2.transaction_id);
        productAction1.affiliation.should.equal(productAction2.affiliation);
        productAction1.coupon_code.should.equal(productAction2.coupon_code);
        productAction1.total_amount.should.equal(productAction2.total_amount);
        productAction1.shipping_amount.should.equal(productAction2.shipping_amount);
        productAction1.tax_amount.should.equal(productAction2.tax_amount);
        productAction1.products.length.should.equal(productAction2.products.length);

        productAction1.products[0].name.should.equal(productAction2.products[0].name);
        productAction1.products[0].id.should.equal(productAction2.products[0].id);
        productAction1.products[0].price.should.equal(productAction2.products[0].price);
        productAction1.products[0].quantity.should.equal(productAction2.products[0].quantity);
        productAction1.products[0].brand.should.equal(productAction2.products[0].brand);
        productAction1.products[0].variant.should.equal(productAction2.products[0].variant);
        productAction1.products[0].category.should.equal(productAction2.products[0].category);
        productAction1.products[0].position.should.equal(productAction2.products[0].position);
        
        productAction1.products[0].coupon_code.should.equal(productAction2.products[0].coupon_code);
        productAction1.products[0].total_product_amount.should.equal(productAction2.products[0].total_product_amount);
        productAction1.products[0].custom_attributes.customkey.should.equal(productAction2.products[0].custom_attributes.customkey);

        done();
    });

    it('logPurchase should support array of products', function(done) {
        var product1 = mParticle.eCommerce.createProduct('iPhone', 'SKU1', 1),
            product2 = mParticle.eCommerce.createProduct('Android', 'SKU2', 1),
            transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                '12345'
            );

        mParticle.eCommerce.logPurchase(transactionAttributes, [
            product1,
            product2,
        ]);

        var purchaseEvent = findEventFromRequest(window.fetchMock._calls, 'purchase');

        purchaseEvent.data.should.have.property('product_action');
        purchaseEvent.data.product_action.should.have.property('products').with.lengthOf(2);
        purchaseEvent.data.product_action.products[0].should.have.property('name', 'iPhone');
        purchaseEvent.data.product_action.products[1].should.have.property('name', 'Android');

        done();
    });

    it('logRefund should support array of products', function(done) {
        var product1 = mParticle.eCommerce.createProduct('iPhone', 'SKU1', 1),
            product2 = mParticle.eCommerce.createProduct('Android', 'SKU2', 1),
            transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                '12345'
            );

        mParticle.eCommerce.logRefund(transactionAttributes, [
            product1,
            product2,
        ]);

        var refundEvent = findEventFromRequest(window.fetchMock._calls, 'refund');

        refundEvent.data.should.have.property('product_action');
        refundEvent.data.product_action.should.have.property('products').with.lengthOf(2);
        refundEvent.data.product_action.products[0].should.have.property('name', 'iPhone');
        refundEvent.data.product_action.products[1].should.have.property('name', 'Android');

        done();
    });

    it('should create promotion', function(done) {
        var promotion = mParticle.eCommerce.createPromotion(
            '12345',
            'my-creative',
            'creative-name',
            1
        );

        Should(promotion).be.ok();

        promotion.should.have.property('Id', '12345');
        promotion.should.have.property('Creative', 'my-creative');
        promotion.should.have.property('Name', 'creative-name');
        promotion.should.have.property('Position', 1);

        done();
    });

    it('should log promotion click', function(done) {
        var promotion = mParticle.eCommerce.createPromotion(
            '12345',
            'my-creative',
            'creative-name',
            1
        );

        mParticle.eCommerce.logPromotion(
            mParticle.PromotionType.PromotionClick,
            promotion
        );

        var promotionEvent = findEventFromRequest(window.fetchMock._calls, 'click');

        Should(promotionEvent).be.ok();

        promotionEvent.data.promotion_action.should.have.property('action', PromotionActionType.PromotionClick);
        promotionEvent.data.promotion_action.should.have.property('promotions');
        promotionEvent.data.promotion_action.promotions[0].should.have.property('id', '12345');
        promotionEvent.data.promotion_action.promotions[0].should.have.property('name', 'creative-name');
        promotionEvent.data.promotion_action.promotions[0].should.have.property('creative', 'my-creative');
        promotionEvent.data.promotion_action.promotions[0].should.have.property('position', 1);

        done();
    });

    it('should allow multiple promotions to be logged at once', function(done) {
        var promotion1 = mParticle.eCommerce.createPromotion(
            '12345',
            'my-creative1',
            'creative-name1',
            1
        );

        var promotion2 = mParticle.eCommerce.createPromotion(
            '67890',
            'my-creative2',
            'creative-name2',
            2
        );

        mParticle.eCommerce.logPromotion(
            mParticle.PromotionType.PromotionClick,
            [promotion1, promotion2]
        );

        var promotionEvent = findEventFromRequest(window.fetchMock._calls, 'click');

        Should(promotionEvent).be.ok();

        promotionEvent.data.promotion_action.should.have.property('action', PromotionActionType.PromotionClick);
        promotionEvent.data.promotion_action.should.have.property('promotions');
        promotionEvent.data.promotion_action.promotions.length.should.equal(2);
        promotionEvent.data.promotion_action.promotions[0].should.have.property('id', '12345');
        promotionEvent.data.promotion_action.promotions[0].should.have.property('name', 'creative-name1');
        promotionEvent.data.promotion_action.promotions[0].should.have.property('creative', 'my-creative1');
        promotionEvent.data.promotion_action.promotions[0].should.have.property('position', 1);
        promotionEvent.data.promotion_action.promotions[1].should.have.property('id', '67890');
        promotionEvent.data.promotion_action.promotions[1].should.have.property('name', 'creative-name2');
        promotionEvent.data.promotion_action.promotions[1].should.have.property('creative', 'my-creative2');
        promotionEvent.data.promotion_action.promotions[1].should.have.property('position', 2);

        done();
    });

    it('should allow an promotions to bypass server upload', function (done) {
        var promotion = mParticle.eCommerce.createPromotion(
            '12345',
            'my-creative',
            'creative-name',
            1
        );

        mParticle.eCommerce.logPromotion(
            mParticle.PromotionType.PromotionClick,
            promotion,
            {}, {},
            { shouldUploadEvent: false }
        );

        var promotionEvent = findEventFromRequest(window.fetchMock._calls, 'click');
        Should(promotionEvent).not.be.ok();

        done();
    });

    it('should create impression', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400),
            impression = mParticle.eCommerce.createImpression(
                'impression-name',
                product
            );

        impression.should.have.property('Name', 'impression-name');
        impression.should.have.property('Product');
        impression.Product.should.have.property('Sku', '12345');

        done();
    });

    it('should log impression event', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400),
            impression = mParticle.eCommerce.createImpression(
                'impression-name',
                product
            );

        mParticle.eCommerce.logImpression(impression);
        var impressionEvent = findEventFromRequest(window.fetchMock._calls, 'impression');

        Should(impressionEvent).be.ok();

        impressionEvent.data.should.have.property('product_impressions').with.lengthOf(1);
        impressionEvent.data.product_impressions[0].should.have.property('product_impression_list', 'impression-name');
        impressionEvent.data.product_impressions[0].should.have.property('products').with.lengthOf(1);
        impressionEvent.data.product_impressions[0].products[0].should.have.property('id', '12345');

        done();
    });

    it('should allow an impression to bypass server upload', function (done) {

        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400),
            impression = mParticle.eCommerce.createImpression(
                'impression-name',
                product
            );

        mParticle.eCommerce.logImpression(impression, null, null, { shouldUploadEvent: false });

        var impressionEvent = findEventFromRequest(window.fetchMock._calls, 'impression');

        Should(impressionEvent).not.be.ok();

        done();
    });

    it('should log multiple impression when an array of impressions is passed', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400),
            impression = mParticle.eCommerce.createImpression(
                'impression-name1',
                product
            ),
            product2 = mParticle.eCommerce.createProduct(
                'Android',
                '23456',
                200
            ),
            impression2 = mParticle.eCommerce.createImpression(
                'impression-name2',
                product2
            );

        mParticle.eCommerce.logImpression([impression, impression2]);

        var impressionEvent = findEventFromRequest(window.fetchMock._calls, 'impression');

        Should(impressionEvent).be.ok();

        impressionEvent.data.should.have.property('product_impressions').with.lengthOf(2);

        impressionEvent.data.product_impressions[0].should.have.property('product_impression_list', 'impression-name1');
        impressionEvent.data.product_impressions[0].should.have.property('products').with.lengthOf(1);
        impressionEvent.data.product_impressions[0].products[0].should.have.property('id', '12345');

        impressionEvent.data.product_impressions[1].should.have.property('product_impression_list', 'impression-name2');
        impressionEvent.data.product_impressions[1].should.have.property('products').with.lengthOf(1);
        impressionEvent.data.product_impressions[1].products[0].should.have.property('id', '23456');

        done();
    });

    it('should log ecommerce refund', function(done) {
        var product = mParticle.eCommerce.createProduct(
            'iPhone',
            '12345',
            400,
            2,
            'Apple',
            'Plus',
            'Phones'
        ),
        transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
            '12345',
            'test-affiliation',
            'coupon-code',
            44334,
            600,
            200
        );

        mParticle.eCommerce.logRefund(transactionAttributes, product);


        var refundEvent = findEventFromRequest(window.fetchMock._calls, 'refund');

        Should(refundEvent).be.ok();

        refundEvent.data.should.have.property('product_action');

        refundEvent.data.product_action.should.have.property('action', 'refund');
        refundEvent.data.product_action.should.have.property('transaction_id', '12345');
        refundEvent.data.product_action.should.have.property('affiliation', 'test-affiliation');
        refundEvent.data.product_action.should.have.property('coupon_code', 'coupon-code');
        refundEvent.data.product_action.should.have.property('total_amount', 44334);
        refundEvent.data.product_action.should.have.property('shipping_amount', 600);
        refundEvent.data.product_action.should.have.property('tax_amount', 200);
        refundEvent.data.product_action.products.should.have.length(1);
        refundEvent.data.product_action.products[0].should.have.property('id', '12345')
        refundEvent.data.product_action.products[0].should.have.property('name', 'iPhone')
        refundEvent.data.product_action.products[0].should.have.property('price', 400)
        refundEvent.data.product_action.products[0].should.have.property('quantity', 2)
        refundEvent.data.product_action.products[0].should.have.property('brand', 'Phones')
        refundEvent.data.product_action.products[0].should.have.property('variant', 'Apple')
        refundEvent.data.product_action.products[0].should.have.property('category', 'Plus')
        refundEvent.data.product_action.products[0].should.have.property('total_product_amount', 800)

        done();
    });

    it('should log identical events for logRefund and logProductAction with a product action of `refund`', function(done) {
        var product = mParticle.eCommerce.createProduct(
            'iPhone',
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
        transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
            '12345',
            'test-affiliation',
            'coupon-code',
            44334,
            600,
            200
        );

        mParticle.eCommerce.logRefund(transactionAttributes, product);
        
        var refundEvent1 = findEventFromRequest(window.fetchMock._calls, 'refund');

        window.fetchMock._calls = [];
        
        mParticle.eCommerce.logProductAction(mParticle.ProductActionType.Refund, product, null, null, transactionAttributes)

        var refundEvent2 = findEventFromRequest(window.fetchMock._calls, 'refund');

        Should(refundEvent1).be.ok();
        Should(refundEvent2).be.ok();

        refundEvent1.data.product_action.action.should.equal(refundEvent2.data.product_action.action);
        refundEvent1.data.product_action.transaction_id.should.equal(refundEvent2.data.product_action.transaction_id);
        refundEvent1.data.product_action.affiliation.should.equal(refundEvent2.data.product_action.affiliation);
        refundEvent1.data.product_action.coupon_code.should.equal(refundEvent2.data.product_action.coupon_code);
        refundEvent1.data.product_action.total_amount.should.equal(refundEvent2.data.product_action.total_amount);
        refundEvent1.data.product_action.shipping_amount.should.equal(refundEvent2.data.product_action.shipping_amount);
        refundEvent1.data.product_action.tax_amount.should.equal(refundEvent2.data.product_action.tax_amount);
        refundEvent1.data.product_action.products.length.should.equal(refundEvent2.data.product_action.products.length)

        refundEvent1.data.product_action.products[0].id.should.equal(refundEvent2.data.product_action.products[0].id)
        refundEvent1.data.product_action.products[0].price.should.equal(refundEvent2.data.product_action.products[0].price)
        refundEvent1.data.product_action.products[0].quantity.should.equal(refundEvent2.data.product_action.products[0].quantity)
        refundEvent1.data.product_action.products[0].brand.should.equal(refundEvent2.data.product_action.products[0].brand)
        refundEvent1.data.product_action.products[0].variant.should.equal(refundEvent2.data.product_action.products[0].variant)
        refundEvent1.data.product_action.products[0].category.should.equal(refundEvent2.data.product_action.products[0].category)
        refundEvent1.data.product_action.products[0].position.should.equal(refundEvent2.data.product_action.products[0].position)

        done();
    });

    it('should allow a product action to bypass server upload', function (done) {
        var product = mParticle.eCommerce.createProduct(
            'iPhone',
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
        transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
            '12345',
            'test-affiliation',
            'coupon-code',
            44334,
            600,
            200
        );

        mParticle.eCommerce.logProductAction(
            mParticle.ProductActionType.Purchase,
            product,
            null,
            null,
            transactionAttributes,
            { shouldUploadEvent: false}
        );

        var event = findEventFromRequest(window.fetchMock._calls, 'purchase');

        Should(event).not.be.ok();
        done();
    });

    it('should add products to cart', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);

        mParticle.eCommerce.Cart.add(product, true);

        var addToCartEvent = findEventFromRequest(window.fetchMock._calls, 'add_to_cart');
        
        addToCartEvent.data.should.have.property('product_action');
        addToCartEvent.data.product_action.should.have.property('action', 'add_to_cart');
        addToCartEvent.data.product_action.should.have.property('products').with.lengthOf(1);
        addToCartEvent.data.product_action.products[0].should.have.property('id', '12345');

        done();
    });

    it('should remove products to cart', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);

        mParticle.eCommerce.Cart.add(product);
        mParticle.eCommerce.Cart.remove({ Sku: '12345' }, true);

        var removeFromCartEvent = findEventFromRequest(window.fetchMock._calls, 'remove_from_cart');
        
        removeFromCartEvent.data.should.have.property('product_action');
        removeFromCartEvent.data.product_action.should.have.property('action', 'remove_from_cart');
        removeFromCartEvent.data.product_action.should.have.property('products').with.lengthOf(1);
        removeFromCartEvent.data.product_action.products[0].should.have.property('id', '12345');

        done();
    });

    it('should update cart products in cookies after adding/removing product to/from a cart and clearing cart', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);

        mParticle.eCommerce.Cart.add(product);
        var products1 = getLocalStorageProducts();

        products1[testMPID].cp[0].should.have.properties([
            'Name',
            'Sku',
            'Price',
        ]);

        mParticle.eCommerce.Cart.remove(product);
        var products2 = getLocalStorageProducts();
        products2[testMPID].cp.length.should.equal(0);

        mParticle.eCommerce.Cart.add(product);
        var products3 = getLocalStorageProducts();
        products3[testMPID].cp[0].should.have.properties([
            'Name',
            'Sku',
            'Price',
        ]);

        mParticle.eCommerce.Cart.clear();
        var products4 = getLocalStorageProducts();
        products4[testMPID].cp.length.should.equal(0);

        done();
    });

    it('should not add the (config.maxProducts + 1st) item to cookie cartItems and only send cookie cartProducts when logging', function(done) {
        mParticle.config.maxProducts = 10;
        mParticle.config.workspaceToken = workspaceToken;
        mParticle.init(apiKey, window.mParticle.config);

        var product = mParticle.eCommerce.createProduct(
            'Product',
            '12345',
            400
        );
        for (var i = 0; i < mParticle.config.maxProducts; i++) {
            mParticle.eCommerce.Cart.add(product);
        }

        mParticle.eCommerce.Cart.add(
            mParticle.eCommerce.createProduct('Product11', '12345', 400)
        );
        var products1 = getLocalStorageProducts();

        var foundProductInCookies = products1[testMPID].cp.filter(function(
            product
        ) {
            return product.Name === 'Product11';
        })[0];

        products1[testMPID].cp.length.should.equal(10);
        Should(foundProductInCookies).be.ok();

        done();
    });

    it('should log checkout via deprecated logCheckout method', function(done) {
        var bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

        mParticle.eCommerce.logCheckout(1, 'Visa');

        var checkoutEvent = findEventFromRequest(window.fetchMock._calls, 'checkout');

        Should(checkoutEvent).be.ok();

        bond.called.should.eql(true);
        bond.getCalls()[0].args[0].should.eql(
            'mParticle.logCheckout is deprecated, please use mParticle.logProductAction instead'
        );

        checkoutEvent.should.have.property('event_type', 'commerce_event');
        checkoutEvent.data.should.have.property('product_action');

        checkoutEvent.data.product_action.should.have.property('action', 'checkout');
        checkoutEvent.data.product_action.should.have.property('checkout_step', 1);
        checkoutEvent.data.product_action.should.have.property('checkout_options', 'Visa');

        done();
    });

    it('should log checkout via mParticle.logProductAction method', function(done) {
        var product1 = mParticle.eCommerce.createProduct('iphone', 'iphoneSKU', 999);
        var product2 = mParticle.eCommerce.createProduct('galaxy', 'galaxySKU', 799);

        mParticle.eCommerce.logProductAction(mParticle.ProductActionType.Checkout, [product1, product2], null, null, {Step: 4, Option: 'Visa'});

        var checkoutEvent = findEventFromRequest(window.fetchMock._calls, 'checkout');

        Should(checkoutEvent).be.ok();

        checkoutEvent.should.have.property('event_type', 'commerce_event');
        checkoutEvent.data.should.have.property('product_action');

        checkoutEvent.data.product_action.should.have.property('action', 'checkout');
        checkoutEvent.data.product_action.should.have.property('checkout_step', 4);
        checkoutEvent.data.product_action.should.have.property('checkout_options', 'Visa');
        checkoutEvent.data.product_action.products[0].should.have.property('id', 'iphoneSKU');
        checkoutEvent.data.product_action.products[1].should.have.property('id', 'galaxySKU');

        done();
    });

    it('should log checkout option', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);
        mockServer.requests = [];
        mParticle.eCommerce.logProductAction(
            ProductActionType.CheckoutOption,
            product,
            { color: 'blue' }
        );

        var checkoutOptionEvent = findEventFromRequest(window.fetchMock._calls, 'checkout_option');


        Should(checkoutOptionEvent).be.ok();

        checkoutOptionEvent.should.have.property(
            'event_type',
            'commerce_event'
        );
        checkoutOptionEvent.data.should.have.property('product_action');

        checkoutOptionEvent.data.product_action.should.have.property('action', 'checkout_option');
        checkoutOptionEvent.data.custom_attributes.should.have.property('color', 'blue');
        done();
    });

    it('should log product action', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);

        mParticle.eCommerce.logProductAction(
            ProductActionType.ViewDetail,
            product
        );

        var viewDetailEvent = findEventFromRequest(window.fetchMock._calls, 'view_detail');
        Should(viewDetailEvent).be.ok();
    
        viewDetailEvent.should.have.property('event_type', 'commerce_event');
        viewDetailEvent.data.should.have.property('product_action');
        viewDetailEvent.data.product_action.should.have.property('action', 'view_detail');
        viewDetailEvent.data.product_action.should.have.property('products').with.lengthOf(1);
        viewDetailEvent.data.product_action.products[0].should.have.property('id', '12345');


        done();
    });

    it('should fail to create product if name not a string', function(done) {
        var product = mParticle.eCommerce.createProduct(null);
        var product2 = mParticle.eCommerce.createProduct(undefined);
        var product3 = mParticle.eCommerce.createProduct(['product']);
        var product4 = mParticle.eCommerce.createProduct(123);
        var product5 = mParticle.eCommerce.createProduct({ key: 'value' });

        Should(product).not.be.ok();
        Should(product2).not.be.ok();
        Should(product3).not.be.ok();
        Should(product4).not.be.ok();
        Should(product5).not.be.ok();

        done();
    });

    it('should fail to create product if sku not a string or a number', function(done) {
        var product = mParticle.eCommerce.createProduct('test', null);
        var product2 = mParticle.eCommerce.createProduct('test', {
            key: 'value',
        });
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
        var product = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                400,
                2,
                'Apple',
                'Plus',
                'Phones'
            ),
            transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                '12345',
                'test-affiliation',
                'coupon-code',
                44334,
                600,
                200
            );

        mParticle.eCommerce.logPurchase(transactionAttributes, product);
        var purchaseEvent = findEventFromRequest(window.fetchMock._calls, 'purchase');

        purchaseEvent.data.product_action.products[0].should.not.have.property('position');


        done();
    });

    it('should support array of products when adding to cart', function(done) {
        var product1 = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                400,
                2
            ),
            product2 = mParticle.eCommerce.createProduct(
                'Nexus',
                '67890',
                300,
                1
            );

        mParticle.eCommerce.Cart.add([product1, product2], true);

        var addToCartEvent = findEventFromRequest(window.fetchMock._calls, 'add_to_cart');

        Should(addToCartEvent).be.ok();

        addToCartEvent.data.should.have.property('product_action');
        addToCartEvent.data.product_action.should.have.property('action', 'add_to_cart');
        addToCartEvent.data.product_action.should.have.property('products').with.lengthOf(2);

        addToCartEvent.data.product_action.products[0].should.have.property('id', '12345');
        addToCartEvent.data.product_action.products[0].should.have.property('name', 'iPhone');

        addToCartEvent.data.product_action.products[1].should.have.property('id', '67890');
        addToCartEvent.data.product_action.products[1].should.have.property('name', 'Nexus');

        done();
    });

    it('should support a single product when adding to cart', function(done) {
        var product1 = mParticle.eCommerce.createProduct(
            'iPhone',
            '12345',
            400,
            2
        );

        mParticle.eCommerce.Cart.add(product1, true);

        var addToCartEvent = findEventFromRequest(window.fetchMock._calls, 'add_to_cart');

        Should(addToCartEvent).be.ok();

        addToCartEvent.data.should.have.property('product_action');
        addToCartEvent.data.product_action.should.have.property('action', 'add_to_cart');
        addToCartEvent.data.product_action.should.have.property('products').with.lengthOf(1);

        addToCartEvent.data.product_action.products[0].should.have.property('id', '12345');
        addToCartEvent.data.product_action.products[0].should.have.property('name', 'iPhone');

        done();
    });

    it('expand product purchase commerce event', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.eCommerce.setCurrencyCode('foo-currency');
        var productAttributes = {};
        productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

        var eventAttributes = {};
        eventAttributes['foo-event-attribute-key'] =
            'foo-event-attribute-value';

        var product = mParticle.eCommerce.createProduct(
            'Foo name',
            'Foo sku',
            100.0,
            4,
            'foo-variant',
            'foo-category',
            'foo-brand',
            5,
            'foo-productcouponcode',
            productAttributes
        );

        var transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
            'foo-transaction-id',
            'foo-affiliation',
            'foo-couponcode',
            400,
            10,
            8
        );
        mParticle.eCommerce.logPurchase(
            transactionAttributes,
            product,
            false,
            eventAttributes
        );
        window.MockForwarder1.instance.receivedEvent.should.have.property(
            'ProductAction'
        );
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(
            window.MockForwarder1.instance.receivedEvent
        );
        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(2);

        var plusOneEvent = expandedEvents[0];
        plusOneEvent.should.have.property(
            'EventName',
            'eCommerce - purchase - Total'
        );
        plusOneEvent.should.have.property(
            'EventCategory',
            mParticle.EventType.Transaction
        );
        var attributes = plusOneEvent.EventAttributes;
        attributes.should.have.property('Transaction Id', 'foo-transaction-id');
        attributes.should.have.property('Affiliation', 'foo-affiliation');
        attributes.should.have.property('Coupon Code', 'foo-couponcode');
        attributes.should.have.property('Total Amount', 400);
        attributes.should.have.property('Shipping Amount', 10);
        attributes.should.have.property('Product Count', 1);
        attributes.should.have.property('Tax Amount', 8);
        attributes.should.have.property('Currency Code', 'foo-currency');
        attributes.should.have.property(
            'foo-event-attribute-key',
            'foo-event-attribute-value'
        );

        var productEvent = expandedEvents[1];
        productEvent.should.have.property(
            'EventName',
            'eCommerce - purchase - Item'
        );
        productEvent.should.have.property(
            'EventCategory',
            mParticle.EventType.Transaction
        );
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
        attributes.should.have.property('Item Price', 100.0);
        attributes.should.have.property('Quantity', 4);
        attributes.should.have.property('Position', 5);
        attributes.should.have.property(
            'foo-attribute-key',
            'foo-product-attribute-value'
        );

        done();
    });

    it('expand product refund commerce event', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        var productAttributes = {};
        productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

        var eventAttributes = {};
        eventAttributes['foo-event-attribute-key'] =
            'foo-event-attribute-value';

        var product = mParticle.eCommerce.createProduct(
            'Foo name',
            'Foo sku',
            100.0,
            4,
            'foo-variant',
            'foo-category',
            'foo-brand',
            5,
            'foo-productcouponcode',
            productAttributes
        );

        var transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
            'foo-transaction-id',
            'foo-affiliation',
            'foo-couponcode',
            400,
            10,
            8
        );
        mParticle.eCommerce.logRefund(
            transactionAttributes,
            product,
            false,
            eventAttributes
        );
        window.MockForwarder1.instance.receivedEvent.should.have.property(
            'ProductAction'
        );
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(
            window.MockForwarder1.instance.receivedEvent
        );
        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(2);

        var plusOneEvent = expandedEvents[0];
        plusOneEvent.should.have.property(
            'EventName',
            'eCommerce - refund - Total'
        );
        var attributes = plusOneEvent.EventAttributes;
        attributes.should.have.property('Product Count', 1);

        var productEvent = expandedEvents[1];
        productEvent.should.have.property(
            'EventName',
            'eCommerce - refund - Item'
        );

        done();
    });

    it('expand non-plus-one-product commerce event', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        var productAttributes = {};
        productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

        var eventAttributes = {};
        eventAttributes['foo-event-attribute-key'] =
            'foo-event-attribute-value';

        var product = mParticle.eCommerce.createProduct(
            'Foo name',
            'Foo sku',
            100.0,
            4,
            'foo-variant',
            'foo-category',
            'foo-brand',
            5,
            'foo-productcouponcode',
            productAttributes
        );

        mParticle.eCommerce.logProductAction(
            mParticle.ProductActionType.RemoveFromWishlist,
            product,
            eventAttributes
        );
        window.MockForwarder1.instance.receivedEvent.should.have.property(
            'ProductAction'
        );
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(
            window.MockForwarder1.instance.receivedEvent
        );
        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

        var productEvent = expandedEvents[0];
        productEvent.should.have.property(
            'EventName',
            'eCommerce - remove_from_wishlist - Item'
        );
        productEvent.should.have.property(
            'EventCategory',
            mParticle.EventType.Transaction
        );
        var attributes = productEvent.EventAttributes;

        attributes.should.have.property('Coupon Code', 'foo-productcouponcode');
        attributes.should.have.property('Brand', 'foo-brand');
        attributes.should.have.property('Category', 'foo-category');
        attributes.should.have.property('Name', 'Foo name');
        attributes.should.have.property('Id', 'Foo sku');
        attributes.should.have.property('Item Price', 100.0);
        attributes.should.have.property('Quantity', 4);
        attributes.should.have.property('Position', 5);
        attributes.should.have.property(
            'foo-attribute-key',
            'foo-product-attribute-value'
        );

        done();
    });

    it('expand checkout commerce event', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        var eventAttributes = {};
        eventAttributes['foo-event-attribute-key'] =
            'foo-event-attribute-value';
        eventAttributes['Checkout Step'] = 'foo-step';
        eventAttributes['Checkout Options'] = 'foo-options';

        var productAttributes = {};
        productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

        var product = mParticle.eCommerce.createProduct(
            'Foo name',
            'Foo sku',
            100.0,
            4,
            'foo-variant',
            'foo-category',
            'foo-brand',
            5,
            'foo-productcouponcode',
            productAttributes
        );

        mParticle.eCommerce.Cart.add(product, true);

        mParticle.eCommerce.logProductAction(mParticle.ProductActionType.Checkout, [product], eventAttributes);

        window.MockForwarder1.instance.receivedEvent.should.have.property(
            'ProductAction'
        );

        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(
            window.MockForwarder1.instance.receivedEvent
        );
        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

        var productEvent = expandedEvents[0];
        productEvent.should.have.property(
            'EventName',
            'eCommerce - checkout - Item'
        );
        productEvent.should.have.property(
            'EventCategory',
            mParticle.EventType.Transaction
        );
        var attributes = productEvent.EventAttributes;

        attributes.should.have.property('Checkout Step', 'foo-step');
        attributes.should.have.property('Checkout Options', 'foo-options');
        attributes.should.have.property('Coupon Code', 'foo-productcouponcode');
        attributes.should.have.property('Brand', 'foo-brand');
        attributes.should.have.property('Category', 'foo-category');
        attributes.should.have.property('Name', 'Foo name');
        attributes.should.have.property('Id', 'Foo sku');
        attributes.should.have.property('Item Price', 100.0);
        attributes.should.have.property('Quantity', 4);
        attributes.should.have.property('Position', 5);
        attributes.should.have.property(
            'foo-attribute-key',
            'foo-product-attribute-value'
        );

        done();
    });

    it('expand promotion commerce event', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        var eventAttributes = {};
        eventAttributes['foo-event-attribute-key'] =
            'foo-event-attribute-value';

        var promotion = mParticle.eCommerce.createPromotion(
            'foo-id',
            'foo-creative',
            'foo-name',
            5
        );

        mParticle.eCommerce.logPromotion(
            mParticle.PromotionType.PromotionClick,
            promotion,
            eventAttributes
        );
        window.MockForwarder1.instance.receivedEvent.should.have.property(
            'PromotionAction'
        );
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(
            window.MockForwarder1.instance.receivedEvent
        );

        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

        var promotionEvent = expandedEvents[0];
        promotionEvent.should.have.property(
            'EventName',
            'eCommerce - click - Item'
        );
        promotionEvent.should.have.property(
            'EventCategory',
            mParticle.EventType.Transaction
        );
        var attributes = promotionEvent.EventAttributes;

        attributes.should.have.property('Id', 'foo-id');
        attributes.should.have.property('Creative', 'foo-creative');
        attributes.should.have.property('Name', 'foo-name');
        attributes.should.have.property('Position', 5);
        attributes.should.have.property(
            'foo-event-attribute-key',
            'foo-event-attribute-value'
        );

        done();
    });

    it('expand null commerce event', function(done) {
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(null);
        (expandedEvents == null).should.be.true;

        done();
    });

    it('expand impression commerce event', function(done) {
        mParticle._resetForTests(MPConfig);
        var mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        var config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);

        var productAttributes = {};
        productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

        var eventAttributes = {};
        eventAttributes['foo-event-attribute-key'] =
            'foo-event-attribute-value';

        var product = mParticle.eCommerce.createProduct(
            'Foo name',
            'Foo sku',
            100.0,
            4,
            'foo-variant',
            'foo-category',
            'foo-brand',
            5,
            'foo-productcouponcode',
            productAttributes
        );

        var impression = mParticle.eCommerce.createImpression(
            'suggested products list',
            product
        );

        mParticle.eCommerce.logImpression(impression, eventAttributes);
        window.MockForwarder1.instance.receivedEvent.should.have.property(
            'ProductImpressions'
        );
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(
            window.MockForwarder1.instance.receivedEvent
        );

        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

        var impressionEvent = expandedEvents[0];
        impressionEvent.should.have.property(
            'EventName',
            'eCommerce - Impression - Item'
        );
        impressionEvent.should.have.property(
            'EventCategory',
            mParticle.EventType.Transaction
        );
        var attributes = impressionEvent.EventAttributes;

        attributes.should.have.property(
            'Product Impression List',
            'suggested products list'
        );
        attributes.should.have.property('Coupon Code', 'foo-productcouponcode');
        attributes.should.have.property('Brand', 'foo-brand');
        attributes.should.have.property('Category', 'foo-category');
        attributes.should.have.property('Name', 'Foo name');
        attributes.should.have.property('Id', 'Foo sku');
        attributes.should.have.property('Item Price', 100.0);
        attributes.should.have.property('Quantity', 4);
        attributes.should.have.property('Position', 5);
        attributes.should.have.property(
            'foo-attribute-key',
            'foo-product-attribute-value'
        );
        attributes.should.have.property(
            'foo-event-attribute-key',
            'foo-event-attribute-value'
        );

        done();
    });

    it('should add customFlags to logCheckout events', function(done) {
        mParticle.eCommerce.logCheckout(1, {}, {}, { interactionEvent: true });

        var checkoutEvent = findEventFromRequest(window.fetchMock._calls, 'checkout');
        checkoutEvent.data.custom_flags.interactionEvent.should.equal(true);

        done();
    });

    it('should add customFlags to logProductAction events', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', 'sku1', 499);
        mParticle.eCommerce.logProductAction(
            mParticle.ProductActionType.Unknown,
            product,
            { price: 5 },
            { interactionEvent: true }
        );
        var unknownEvent = findEventFromRequest(window.fetchMock._calls, 'unknown');

        unknownEvent.data.custom_flags.interactionEvent.should.equal(true);

        done();
    });

    it('should add customFlags to logPurchase events', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', 'sku1', 499);
        var transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
            'id1',
            'affil1',
            'couponCode1'
        );
        mParticle.eCommerce.logPurchase(
            transactionAttributes,
            product,
            true,
            { shipping: 5 },
            { interactionEvent: true }
        );

        var purchaseEvent = findEventFromRequest(window.fetchMock._calls, 'purchase');

        purchaseEvent.data.custom_flags.interactionEvent.should.equal(true);

        done();
    });

    it('should add customFlags to logPromotion events', function(done) {
        var promotion = mParticle.eCommerce.createPromotion(
            'id',
            'creative',
            'name'
        );

        mParticle.eCommerce.logPromotion(
            mParticle.PromotionType.Unknown,
            promotion,
            { shipping: 5 },
            { interactionEvent: true }
        );


        var promotionEvent = findEventFromRequest(window.fetchMock._calls, 'click');

        promotionEvent.data.custom_flags.interactionEvent.should.equal(true);

        done();
    });

    it('should add customFlags to logImpression events', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', 'sku1', 499);
        var impression = mParticle.eCommerce.createImpression(
            'iphoneImpressionName',
            product
        );
        mParticle.eCommerce.logImpression(
            impression,
            { shipping: 5 },
            { interactionEvent: true }
        );

        var impressionEvent = findEventFromRequest(window.fetchMock._calls, 'impression');
        impressionEvent.data.custom_flags.interactionEvent.should.equal(true);

        done();
    });

    it('should add customFlags to logRefund events', function(done) {
        var product = mParticle.eCommerce.createProduct('iPhone', 'sku1', 499);
        var transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
            'id1',
            'affil1',
            'couponCode1'
        );
        mParticle.eCommerce.logRefund(
            transactionAttributes,
            product,
            true,
            { shipping: 5 },
            { interactionEvent: true }
        );
        var refundEvent = findEventFromRequest(window.fetchMock._calls, 'refund');

        refundEvent.data.custom_flags.interactionEvent.should.equal(true);

        done();
    });
    describe('Cart', function() {
        afterEach(function() {
            sinon.restore();
        });
        it('should deprecate add', function() {
            var bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

            var product = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                400
            );

            mParticle.eCommerce.Cart.add(product, true);

            bond.called.should.eql(true);
            bond.getCalls()[0].args[0].should.eql(
                'Deprecated function eCommerce.Cart.add() will be removed in future releases'
            );
        });
        it('should deprecate remove', function() {
            var bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

            var product = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                400
            );

            mParticle.eCommerce.Cart.remove(product, true);

            bond.called.should.eql(true);
            bond.getCalls()[0].args[0].should.eql(
                'Deprecated function eCommerce.Cart.remove() will be removed in future releases'
            );
        });

        it('should deprecate clear', function() {
            var bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

            mParticle.eCommerce.Cart.clear();

            bond.called.should.eql(true);
            bond.getCalls()[0].args[0].should.eql(
                'Deprecated function eCommerce.Cart.clear() will be removed in future releases'
            );
        });

        it('should be empty when transactionAttributes is empty', function() {
            var mparticle = mParticle.getInstance()
            var productAction = {}
            mparticle._Ecommerce.convertTransactionAttributesToProductAction({}, productAction)
            Object.keys(productAction).length.should.equal(0);
        });

        it('should sanitize certain ecommerce amounts from strings to 0', function() {
            mParticle.getInstance()._Ecommerce.sanitizeAmount('$42', 'Price').should.equal(0);
            mParticle.getInstance()._Ecommerce.sanitizeAmount('$100', 'TotalAmount').should.equal(0);
            mParticle.getInstance()._Ecommerce.sanitizeAmount('first', 'Position').should.equal(0);
            mParticle.getInstance()._Ecommerce.sanitizeAmount('two', 'Quantity').should.equal(0);
            mParticle.getInstance()._Ecommerce.sanitizeAmount('string', 'Shipping').should.equal(0);
            mParticle.getInstance()._Ecommerce.sanitizeAmount('$5.80', 'Tax').should.equal(0);
        });

        it('should convert transactionAttributes strings to numbers or zero', function() {
            var mparticle = mParticle.getInstance()
            var transactionAttributes = {
                Id: "id",
                Affiliation: "affiliation",
                CouponCode: "couponCode",
                Revenue: "revenue",
                Shipping: "shipping",
                Tax: "tax"
            };

            var productAction = {};
            mparticle._Ecommerce.convertTransactionAttributesToProductAction(transactionAttributes, productAction)
            productAction.TransactionId.should.equal("id")
            productAction.Affiliation.should.equal("affiliation")
            productAction.CouponCode.should.equal("couponCode")

            // convert strings to 0 
            productAction.TotalAmount.should.equal(0)
            productAction.ShippingAmount.should.equal(0)
            productAction.TaxAmount.should.equal(0)
        });
    });
});