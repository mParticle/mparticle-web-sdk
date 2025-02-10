import Utils from './config/utils';
import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import {
    urls,
    apiKey,
    workspaceToken,
    MPConfig,
    testMPID,
    ProductActionType,
    PromotionActionType,
} from './config/constants';
const { waitForCondition, fetchMockSuccess, hasIdentifyReturned } = Utils;

const getLocalStorageProducts = Utils.getLocalStorageProducts,
    forwarderDefaultConfiguration = Utils.forwarderDefaultConfiguration,
    findEventFromRequest = Utils.findEventFromRequest,
    MockForwarder = Utils.MockForwarder;

describe('eCommerce', function() {
    beforeEach(function() {
        mParticle._resetForTests(MPConfig);
        delete mParticle._instances['default_instance'];
        fetchMock.post(urls.events, 200);

        fetchMockSuccess(urls.identify, {
            mpid: testMPID,
            is_logged_in: false,
        });

        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        fetchMock.restore();
        mParticle._resetForTests(MPConfig);
    });

    it('should create ecommerce product', function(done) {
        const product = mParticle.eCommerce.createProduct(
            'iPhone',
            '12345',
            400,
            2,
        );

        product.should.have.property('Name', 'iPhone');
        product.should.have.property('Sku', '12345');
        product.should.have.property('Price', 400);
        product.should.have.property('Quantity', 2);

        done();
    });

    it('should create transaction attributes', function(done) {
        const transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
            '12345',
            'test-affiliation',
            'coupon-code',
            44334,
            600,
            200,
        );

        transactionAttributes.should.have.property('Id', '12345');
        transactionAttributes.should.have.property(
            'Affiliation',
            'test-affiliation',
        );
        transactionAttributes.should.have.property('CouponCode', 'coupon-code');
        transactionAttributes.should.have.property('Revenue', 44334);
        transactionAttributes.should.have.property('Shipping', 600);
        transactionAttributes.should.have.property('Tax', 200);

        done();
    });

    it('should log ecommerce event', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            const product = mParticle.eCommerce.createProduct(
                    'iPhone',
                    '12345',
                    '400',
                    2,
                    'Plus',
                    'Phones',
                    'Apple',
                    1,
                    'my-coupon-code',
                    { customkey: 'customvalue' },
                ),
                transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                    '12345',
                    'test-affiliation',
                    'coupon-code',
                    44334,
                    600,
                    200,
                );

            mParticle.eCommerce.logPurchase(transactionAttributes, product);

            const purchaseEvent = findEventFromRequest(
                fetchMock.calls(),
                'purchase',
            );

            purchaseEvent.data.should.have.property('product_action');
            purchaseEvent.data.product_action.should.have.property(
                'action',
                'purchase',
            );
            purchaseEvent.data.product_action.should.have.property(
                'transaction_id',
                '12345',
            );
            purchaseEvent.data.product_action.should.have.property(
                'affiliation',
                'test-affiliation',
            );
            purchaseEvent.data.product_action.should.have.property(
                'coupon_code',
                'coupon-code',
            );
            purchaseEvent.data.product_action.should.have.property(
                'total_amount',
                44334,
            );
            purchaseEvent.data.product_action.should.have.property(
                'shipping_amount',
                600,
            );
            purchaseEvent.data.product_action.should.have.property(
                'tax_amount',
                200,
            );
            purchaseEvent.data.product_action.should.have
                .property('products')
                .with.lengthOf(1);

            purchaseEvent.data.product_action.products[0].should.have.property(
                'id',
                '12345',
            );
            purchaseEvent.data.product_action.products[0].should.have.property(
                'name',
                'iPhone',
            );
            purchaseEvent.data.product_action.products[0].should.have.property(
                'price',
                400,
            );
            purchaseEvent.data.product_action.products[0].should.have.property(
                'quantity',
                2,
            );
            purchaseEvent.data.product_action.products[0].should.have.property(
                'brand',
                'Apple',
            );
            purchaseEvent.data.product_action.products[0].should.have.property(
                'variant',
                'Plus',
            );
            purchaseEvent.data.product_action.products[0].should.have.property(
                'category',
                'Phones',
            );
            purchaseEvent.data.product_action.products[0].should.have.property(
                'total_product_amount',
                800,
            );
            purchaseEvent.data.product_action.products[0].should.have.property(
                'position',
                1,
            );
            purchaseEvent.data.product_action.products[0].should.have.property(
                'coupon_code',
                'my-coupon-code',
            );
            purchaseEvent.data.product_action.products[0].should.have.property(
                'custom_attributes',
            );

            purchaseEvent.data.product_action.products[0].custom_attributes.should.have.property(
                'customkey',
                'customvalue',
            );

            done();
        });
    });

    it('should not log an ecommerce event if there is a typo in the product action type', function(done) {
        // fetchMock calls will have session start and AST events, we want to reset so that we can prove the product action type does not go through (length remains 0 after logging)
        fetchMock.resetHistory();
        const product = mParticle.eCommerce.createProduct(
            'iPhone',
            '12345',
            '400',
        );

        mParticle.eCommerce.logProductAction(
            mParticle.ProductActionType.Typo, // <------ will result in a null when converting the product action type as this is not a real value
            [product],
        );
        fetchMock.calls().length.should.equal(0);

        done();
    });

    it('should log badly formed ecommerce event', function(done) {
        const product = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                Infinity,
                '2-foo',
                'Plus',
                'Phones',
                'Apple',
                '1-foo',
                'my-coupon-code',
                { customkey: 'customvalue' },
            ),
            transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                '12345',
                'test-affiliation',
                'coupon-code',
                '44334-foo',
                '600-foo',
                '200-foo',
            );

        waitForCondition(hasIdentifyReturned).then(() => {
            mParticle.eCommerce.logPurchase(transactionAttributes, product);

            const purchaseEvent = findEventFromRequest(
                fetchMock.calls(),
                'purchase',
            );

            purchaseEvent.data.should.have.property('product_action');
            purchaseEvent.data.product_action.should.have.property(
                'action',
                'purchase',
            );
            purchaseEvent.data.product_action.should.have.property(
                'transaction_id',
                '12345',
            );
            purchaseEvent.data.product_action.should.have.property(
                'affiliation',
                'test-affiliation',
            );
            purchaseEvent.data.product_action.should.have.property(
                'coupon_code',
                'coupon-code',
            );
            purchaseEvent.data.product_action.should.have.property(
                'total_amount',
                0,
            );
            purchaseEvent.data.product_action.should.have.property(
                'shipping_amount',
                0,
            );
            purchaseEvent.data.product_action.should.have.property(
                'tax_amount',
                0,
            );
            purchaseEvent.data.product_action.should.have
                .property('products')
                .with.lengthOf(1);

            purchaseEvent.data.product_action.products[0].should.have.property(
                'id',
                '12345',
            );
            purchaseEvent.data.product_action.products[0].should.have.property(
                'name',
                'iPhone',
            );
            purchaseEvent.data.product_action.products[0].should.have.property(
                'price',
                0,
            );
            purchaseEvent.data.product_action.products[0].should.have.property(
                'quantity',
                0,
            );
            purchaseEvent.data.product_action.products[0].should.have.property(
                'brand',
                'Apple',
            );
            purchaseEvent.data.product_action.products[0].should.have.property(
                'variant',
                'Plus',
            );
            purchaseEvent.data.product_action.products[0].should.have.property(
                'category',
                'Phones',
            );
            purchaseEvent.data.product_action.products[0].should.have.property(
                'position',
                null,
            );
            purchaseEvent.data.product_action.products[0].should.have.property(
                'coupon_code',
                'my-coupon-code',
            );
            purchaseEvent.data.product_action.products[0].should.have.property(
                'total_product_amount',
                0,
            );
            purchaseEvent.data.product_action.products[0].should.have.property(
                'custom_attributes',
            );

            purchaseEvent.data.product_action.products[0].custom_attributes.should.have.property(
                'customkey',
                'customvalue',
            );

            done();
        });
    });

    it('should log identical events for logPurchase and logProductAction with product action type of `purchase`', function(done) {
        const product = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                '400',
                2,
                'Plus',
                'Phones',
                'Apple',
                1,
                'my-coupon-code',
                { customkey: 'customvalue' },
            ),
            transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                '12345',
                'test-affiliation',
                'coupon-code',
                44334,
                600,
                200,
            );

        waitForCondition(hasIdentifyReturned).then(() => {
            mParticle.eCommerce.logPurchase(transactionAttributes, product);
            const purchaseEvent1 = findEventFromRequest(
                fetchMock.calls(),
                'purchase',
            );

            fetchMock.resetHistory();

            mParticle.eCommerce.logProductAction(
                mParticle.ProductActionType.Purchase,
                product,
                null,
                null,
                transactionAttributes,
            );
            const purchaseEvent2 = findEventFromRequest(
                fetchMock.calls(),
                'purchase',
            );

            const { product_action: productAction1 } = purchaseEvent1.data;
            const { product_action: productAction2 } = purchaseEvent2.data;

            productAction1.action.should.equal(productAction2.action);
            productAction1.transaction_id.should.equal(
                productAction2.transaction_id,
            );
            productAction1.affiliation.should.equal(productAction2.affiliation);
            productAction1.coupon_code.should.equal(productAction2.coupon_code);
            productAction1.total_amount.should.equal(
                productAction2.total_amount,
            );
            productAction1.shipping_amount.should.equal(
                productAction2.shipping_amount,
            );
            productAction1.tax_amount.should.equal(productAction2.tax_amount);
            productAction1.products.length.should.equal(
                productAction2.products.length,
            );

            productAction1.products[0].name.should.equal(
                productAction2.products[0].name,
            );
            productAction1.products[0].id.should.equal(
                productAction2.products[0].id,
            );
            productAction1.products[0].price.should.equal(
                productAction2.products[0].price,
            );
            productAction1.products[0].quantity.should.equal(
                productAction2.products[0].quantity,
            );
            productAction1.products[0].brand.should.equal(
                productAction2.products[0].brand,
            );
            productAction1.products[0].variant.should.equal(
                productAction2.products[0].variant,
            );
            productAction1.products[0].category.should.equal(
                productAction2.products[0].category,
            );
            productAction1.products[0].position.should.equal(
                productAction2.products[0].position,
            );

            productAction1.products[0].coupon_code.should.equal(
                productAction2.products[0].coupon_code,
            );
            productAction1.products[0].total_product_amount.should.equal(
                productAction2.products[0].total_product_amount,
            );
            productAction1.products[0].custom_attributes.customkey.should.equal(
                productAction2.products[0].custom_attributes.customkey,
            );

            done();
        });
    });

    it('logPurchase should support array of products', function(done) {
        const product1 = mParticle.eCommerce.createProduct('iPhone', 'SKU1', 1),
            product2 = mParticle.eCommerce.createProduct('Android', 'SKU2', 1),
            transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                '12345',
            );

        waitForCondition(hasIdentifyReturned).then(() => {
            mParticle.eCommerce.logPurchase(transactionAttributes, [
                product1,
                product2,
            ]);

            const purchaseEvent = findEventFromRequest(
                fetchMock.calls(),
                'purchase',
            );

            purchaseEvent.data.should.have.property('product_action');
            purchaseEvent.data.product_action.should.have
                .property('products')
                .with.lengthOf(2);
            purchaseEvent.data.product_action.products[0].should.have.property(
                'name',
                'iPhone',
            );
            purchaseEvent.data.product_action.products[1].should.have.property(
                'name',
                'Android',
            );

            done();
        });
    });

    it('logRefund should support array of products', function(done) {
        const product1 = mParticle.eCommerce.createProduct('iPhone', 'SKU1', 1),
            product2 = mParticle.eCommerce.createProduct('Android', 'SKU2', 1),
            transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                '12345',
            );

        waitForCondition(hasIdentifyReturned).then(() => {
            mParticle.eCommerce.logRefund(transactionAttributes, [
                product1,
                product2,
            ]);

            const refundEvent = findEventFromRequest(
                fetchMock.calls(),
                'refund',
            );

            refundEvent.data.should.have.property('product_action');
            refundEvent.data.product_action.should.have
                .property('products')
                .with.lengthOf(2);
            refundEvent.data.product_action.products[0].should.have.property(
                'name',
                'iPhone',
            );
            refundEvent.data.product_action.products[1].should.have.property(
                'name',
                'Android',
            );

            done();
        });
    });

    it('should create promotion', function(done) {
        const promotion = mParticle.eCommerce.createPromotion(
            '12345',
            'my-creative',
            'creative-name',
            1,
        );

        Should(promotion).be.ok();

        promotion.should.have.property('Id', '12345');
        promotion.should.have.property('Creative', 'my-creative');
        promotion.should.have.property('Name', 'creative-name');
        promotion.should.have.property('Position', 1);

        done();
    });

    it('should log promotion click', function(done) {
        const promotion = mParticle.eCommerce.createPromotion(
            '12345',
            'my-creative',
            'creative-name',
            1,
        );

        waitForCondition(hasIdentifyReturned).then(() => {
            mParticle.eCommerce.logPromotion(
                mParticle.PromotionType.PromotionClick,
                promotion,
            );

            const promotionEvent = findEventFromRequest(
                fetchMock.calls(),
                'click',
            );

            Should(promotionEvent).be.ok();

            promotionEvent.data.promotion_action.should.have.property(
                'action',
                PromotionActionType.PromotionClick,
            );
            promotionEvent.data.promotion_action.should.have.property(
                'promotions',
            );
            promotionEvent.data.promotion_action.promotions[0].should.have.property(
                'id',
                '12345',
            );
            promotionEvent.data.promotion_action.promotions[0].should.have.property(
                'name',
                'creative-name',
            );
            promotionEvent.data.promotion_action.promotions[0].should.have.property(
                'creative',
                'my-creative',
            );
            promotionEvent.data.promotion_action.promotions[0].should.have.property(
                'position',
                1,
            );

            done();
        });
    });

    it('should allow multiple promotions to be logged at once', function(done) {
        const promotion1 = mParticle.eCommerce.createPromotion(
            '12345',
            'my-creative1',
            'creative-name1',
            1,
        );

        const promotion2 = mParticle.eCommerce.createPromotion(
            '67890',
            'my-creative2',
            'creative-name2',
            2,
        );

        waitForCondition(hasIdentifyReturned).then(() => {
            mParticle.eCommerce.logPromotion(
                mParticle.PromotionType.PromotionClick,
                [promotion1, promotion2],
            );

            const promotionEvent = findEventFromRequest(
                fetchMock.calls(),
                'click',
            );

            Should(promotionEvent).be.ok();

            promotionEvent.data.promotion_action.should.have.property(
                'action',
                PromotionActionType.PromotionClick,
            );
            promotionEvent.data.promotion_action.should.have.property(
                'promotions',
            );
            promotionEvent.data.promotion_action.promotions.length.should.equal(
                2,
            );
            promotionEvent.data.promotion_action.promotions[0].should.have.property(
                'id',
                '12345',
            );
            promotionEvent.data.promotion_action.promotions[0].should.have.property(
                'name',
                'creative-name1',
            );
            promotionEvent.data.promotion_action.promotions[0].should.have.property(
                'creative',
                'my-creative1',
            );
            promotionEvent.data.promotion_action.promotions[0].should.have.property(
                'position',
                1,
            );
            promotionEvent.data.promotion_action.promotions[1].should.have.property(
                'id',
                '67890',
            );
            promotionEvent.data.promotion_action.promotions[1].should.have.property(
                'name',
                'creative-name2',
            );
            promotionEvent.data.promotion_action.promotions[1].should.have.property(
                'creative',
                'my-creative2',
            );
            promotionEvent.data.promotion_action.promotions[1].should.have.property(
                'position',
                2,
            );

            done();
        });
    });

    it('should allow an promotions to bypass server upload', function(done) {
        const promotion = mParticle.eCommerce.createPromotion(
            '12345',
            'my-creative',
            'creative-name',
            1,
        );

        waitForCondition(hasIdentifyReturned).then(() => {
            mParticle.eCommerce.logPromotion(
                mParticle.PromotionType.PromotionClick,
                promotion,
                {},
                {},
                { shouldUploadEvent: false },
            );

            const promotionEvent = findEventFromRequest(
                fetchMock.calls(),
                'click',
            );
            Should(promotionEvent).not.be.ok();

            done();
        });
    });

    it('should create impression', function(done) {
        const product = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                400,
            ),
            impression = mParticle.eCommerce.createImpression(
                'impression-name',
                product,
            );

        impression.should.have.property('Name', 'impression-name');
        impression.should.have.property('Product');
        impression.Product.should.have.property('Sku', '12345');

        done();
    });

    it('should log impression event', function(done) {
        const product = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                400,
            ),
            impression = mParticle.eCommerce.createImpression(
                'impression-name',
                product,
            );

        waitForCondition(hasIdentifyReturned).then(() => {
            mParticle.eCommerce.logImpression(impression);
            const impressionEvent = findEventFromRequest(
                fetchMock.calls(),
                'impression',
            );

            Should(impressionEvent).be.ok();

            impressionEvent.data.should.have
                .property('product_impressions')
                .with.lengthOf(1);
            impressionEvent.data.product_impressions[0].should.have.property(
                'product_impression_list',
                'impression-name',
            );
            impressionEvent.data.product_impressions[0].should.have
                .property('products')
                .with.lengthOf(1);
            impressionEvent.data.product_impressions[0].products[0].should.have.property(
                'id',
                '12345',
            );

            done();
        });
    });

    it('should allow an impression to bypass server upload', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            const product = mParticle.eCommerce.createProduct(
                    'iPhone',
                    '12345',
                    400,
                ),
                impression = mParticle.eCommerce.createImpression(
                    'impression-name',
                    product,
                );

            mParticle.eCommerce.logImpression(impression, null, null, {
                shouldUploadEvent: false,
            });

            const impressionEvent = findEventFromRequest(
                fetchMock.calls(),
                'impression',
            );

            Should(impressionEvent).not.be.ok();

            done();
        });
    });

    it('should log multiple impression when an array of impressions is passed', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            const product = mParticle.eCommerce.createProduct(
                    'iPhone',
                    '12345',
                    400,
                ),
                impression = mParticle.eCommerce.createImpression(
                    'impression-name1',
                    product,
                ),
                product2 = mParticle.eCommerce.createProduct(
                    'Android',
                    '23456',
                    200,
                ),
                impression2 = mParticle.eCommerce.createImpression(
                    'impression-name2',
                    product2,
                );

            mParticle.eCommerce.logImpression([impression, impression2]);

            const impressionEvent = findEventFromRequest(
                fetchMock.calls(),
                'impression',
            );

            Should(impressionEvent).be.ok();

            impressionEvent.data.should.have
                .property('product_impressions')
                .with.lengthOf(2);

            impressionEvent.data.product_impressions[0].should.have.property(
                'product_impression_list',
                'impression-name1',
            );
            impressionEvent.data.product_impressions[0].should.have
                .property('products')
                .with.lengthOf(1);
            impressionEvent.data.product_impressions[0].products[0].should.have.property(
                'id',
                '12345',
            );

            impressionEvent.data.product_impressions[1].should.have.property(
                'product_impression_list',
                'impression-name2',
            );
            impressionEvent.data.product_impressions[1].should.have
                .property('products')
                .with.lengthOf(1);
            impressionEvent.data.product_impressions[1].products[0].should.have.property(
                'id',
                '23456',
            );

            done();
        });
    });

    it('should log ecommerce refund', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            const product = mParticle.eCommerce.createProduct(
                    'iPhone',
                    '12345',
                    400,
                    2,
                    'Apple',
                    'Plus',
                    'Phones',
                ),
                transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                    '12345',
                    'test-affiliation',
                    'coupon-code',
                    44334,
                    600,
                    200,
                );

            mParticle.eCommerce.logRefund(transactionAttributes, product);

            const refundEvent = findEventFromRequest(
                fetchMock.calls(),
                'refund',
            );

            Should(refundEvent).be.ok();

            refundEvent.data.should.have.property('product_action');

            refundEvent.data.product_action.should.have.property(
                'action',
                'refund',
            );
            refundEvent.data.product_action.should.have.property(
                'transaction_id',
                '12345',
            );
            refundEvent.data.product_action.should.have.property(
                'affiliation',
                'test-affiliation',
            );
            refundEvent.data.product_action.should.have.property(
                'coupon_code',
                'coupon-code',
            );
            refundEvent.data.product_action.should.have.property(
                'total_amount',
                44334,
            );
            refundEvent.data.product_action.should.have.property(
                'shipping_amount',
                600,
            );
            refundEvent.data.product_action.should.have.property(
                'tax_amount',
                200,
            );
            refundEvent.data.product_action.products.should.have.length(1);
            refundEvent.data.product_action.products[0].should.have.property(
                'id',
                '12345',
            );
            refundEvent.data.product_action.products[0].should.have.property(
                'name',
                'iPhone',
            );
            refundEvent.data.product_action.products[0].should.have.property(
                'price',
                400,
            );
            refundEvent.data.product_action.products[0].should.have.property(
                'quantity',
                2,
            );
            refundEvent.data.product_action.products[0].should.have.property(
                'brand',
                'Phones',
            );
            refundEvent.data.product_action.products[0].should.have.property(
                'variant',
                'Apple',
            );
            refundEvent.data.product_action.products[0].should.have.property(
                'category',
                'Plus',
            );
            refundEvent.data.product_action.products[0].should.have.property(
                'total_product_amount',
                800,
            );

            done();
        });
    });

    it('should log identical events for logRefund and logProductAction with a product action of `refund`', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            const product = mParticle.eCommerce.createProduct(
                    'iPhone',
                    '12345',
                    '400',
                    2,
                    'Plus',
                    'Phones',
                    'Apple',
                    1,
                    'my-coupon-code',
                    { customkey: 'customvalue' },
                ),
                transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                    '12345',
                    'test-affiliation',
                    'coupon-code',
                    44334,
                    600,
                    200,
                );

            mParticle.eCommerce.logRefund(transactionAttributes, product);

            const refundEvent1 = findEventFromRequest(
                fetchMock.calls(),
                'refund',
            );

            fetchMock.resetHistory();

            mParticle.eCommerce.logProductAction(
                mParticle.ProductActionType.Refund,
                product,
                null,
                null,
                transactionAttributes,
            );

            const refundEvent2 = findEventFromRequest(
                fetchMock.calls(),
                'refund',
            );

            Should(refundEvent1).be.ok();
            Should(refundEvent2).be.ok();

            refundEvent1.data.product_action.action.should.equal(
                refundEvent2.data.product_action.action,
            );
            refundEvent1.data.product_action.transaction_id.should.equal(
                refundEvent2.data.product_action.transaction_id,
            );
            refundEvent1.data.product_action.affiliation.should.equal(
                refundEvent2.data.product_action.affiliation,
            );
            refundEvent1.data.product_action.coupon_code.should.equal(
                refundEvent2.data.product_action.coupon_code,
            );
            refundEvent1.data.product_action.total_amount.should.equal(
                refundEvent2.data.product_action.total_amount,
            );
            refundEvent1.data.product_action.shipping_amount.should.equal(
                refundEvent2.data.product_action.shipping_amount,
            );
            refundEvent1.data.product_action.tax_amount.should.equal(
                refundEvent2.data.product_action.tax_amount,
            );
            refundEvent1.data.product_action.products.length.should.equal(
                refundEvent2.data.product_action.products.length,
            );

            refundEvent1.data.product_action.products[0].id.should.equal(
                refundEvent2.data.product_action.products[0].id,
            );
            refundEvent1.data.product_action.products[0].price.should.equal(
                refundEvent2.data.product_action.products[0].price,
            );
            refundEvent1.data.product_action.products[0].quantity.should.equal(
                refundEvent2.data.product_action.products[0].quantity,
            );
            refundEvent1.data.product_action.products[0].brand.should.equal(
                refundEvent2.data.product_action.products[0].brand,
            );
            refundEvent1.data.product_action.products[0].variant.should.equal(
                refundEvent2.data.product_action.products[0].variant,
            );
            refundEvent1.data.product_action.products[0].category.should.equal(
                refundEvent2.data.product_action.products[0].category,
            );
            refundEvent1.data.product_action.products[0].position.should.equal(
                refundEvent2.data.product_action.products[0].position,
            );

            done();
        });
    });

    it('should allow a product action to bypass server upload', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            const product = mParticle.eCommerce.createProduct(
                    'iPhone',
                    '12345',
                    '400',
                    2,
                    'Plus',
                    'Phones',
                    'Apple',
                    1,
                    'my-coupon-code',
                    { customkey: 'customvalue' },
                ),
                transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                    '12345',
                    'test-affiliation',
                    'coupon-code',
                    44334,
                    600,
                    200,
                );

            mParticle.eCommerce.logProductAction(
                mParticle.ProductActionType.Purchase,
                product,
                null,
                null,
                transactionAttributes,
                { shouldUploadEvent: false },
            );

            const event = findEventFromRequest(fetchMock.calls(), 'purchase');

            Should(event).not.be.ok();
            done();
        });
    });

    it('should add products to cart', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            const product = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                400,
            );

            mParticle.eCommerce.Cart.add(product, true);

            const addToCartEvent = findEventFromRequest(
                fetchMock.calls(),
                'add_to_cart',
            );

            addToCartEvent.data.should.have.property('product_action');
            addToCartEvent.data.product_action.should.have.property(
                'action',
                'add_to_cart',
            );
            addToCartEvent.data.product_action.should.have
                .property('products')
                .with.lengthOf(1);
            addToCartEvent.data.product_action.products[0].should.have.property(
                'id',
                '12345',
            );

            done();
        });
    });

    it('should remove products to cart', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            const product = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                400,
            );

            mParticle.eCommerce.Cart.add(product);
            mParticle.eCommerce.Cart.remove({ Sku: '12345' }, true);

            const removeFromCartEvent = findEventFromRequest(
                fetchMock.calls(),
                'remove_from_cart',
            );

            removeFromCartEvent.data.should.have.property('product_action');
            removeFromCartEvent.data.product_action.should.have.property(
                'action',
                'remove_from_cart',
            );
            removeFromCartEvent.data.product_action.should.have
                .property('products')
                .with.lengthOf(1);
            removeFromCartEvent.data.product_action.products[0].should.have.property(
                'id',
                '12345',
            );

            done();
        });
    });

    it('should update cart products in cookies after adding/removing product to/from a cart and clearing cart', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            const product = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                400,
            );

            mParticle.eCommerce.Cart.add(product);
            const products1 = getLocalStorageProducts();

            products1[testMPID].cp[0].should.have.properties([
                'Name',
                'Sku',
                'Price',
            ]);

            mParticle.eCommerce.Cart.remove(product);
            const products2 = getLocalStorageProducts();
            products2[testMPID].cp.length.should.equal(0);

            mParticle.eCommerce.Cart.add(product);
            const products3 = getLocalStorageProducts();
            products3[testMPID].cp[0].should.have.properties([
                'Name',
                'Sku',
                'Price',
            ]);

            mParticle.eCommerce.Cart.clear();
            const products4 = getLocalStorageProducts();
            products4[testMPID].cp.length.should.equal(0);

            done();
        });
    });

    it('should not add the (config.maxProducts + 1st) item to cookie cartItems and only send cookie cartProducts when logging', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            mParticle.config.maxProducts = 10;
            mParticle.config.workspaceToken = workspaceToken;
            mParticle.init(apiKey, window.mParticle.config);

            const product = mParticle.eCommerce.createProduct(
                'Product',
                '12345',
                400,
            );
            for (let i = 0; i < mParticle.config.maxProducts; i++) {
                mParticle.eCommerce.Cart.add(product);
            }

            mParticle.eCommerce.Cart.add(
                mParticle.eCommerce.createProduct('Product11', '12345', 400),
            );
            const products1 = getLocalStorageProducts();

            const foundProductInCookies = products1[testMPID].cp.filter(
                function(product) {
                    return product.Name === 'Product11';
                },
            )[0];

            products1[testMPID].cp.length.should.equal(10);
            Should(foundProductInCookies).be.ok();

            done();
        });
    });

    it('should log checkout via deprecated logCheckout method', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            const bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

            mParticle.eCommerce.logCheckout(1, 'Visa');

            const checkoutEvent = findEventFromRequest(
                fetchMock.calls(),
                'checkout',
            );

            Should(checkoutEvent).be.ok();

            bond.called.should.eql(true);
            bond.getCalls()[0].args[0].should.eql(
                'mParticle.logCheckout is deprecated, please use mParticle.logProductAction instead',
            );

            checkoutEvent.should.have.property('event_type', 'commerce_event');
            checkoutEvent.data.should.have.property('product_action');

            checkoutEvent.data.product_action.should.have.property(
                'action',
                'checkout',
            );
            checkoutEvent.data.product_action.should.have.property(
                'checkout_step',
                1,
            );
            checkoutEvent.data.product_action.should.have.property(
                'checkout_options',
                'Visa',
            );

            done();
        });
    });

    it('should log checkout via mParticle.logProductAction method', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            const product1 = mParticle.eCommerce.createProduct(
                'iphone',
                'iphoneSKU',
                999,
            );
            const product2 = mParticle.eCommerce.createProduct(
                'galaxy',
                'galaxySKU',
                799,
            );

            mParticle.eCommerce.logProductAction(
                mParticle.ProductActionType.Checkout,
                [product1, product2],
                null,
                null,
                { Step: 4, Option: 'Visa' },
            );

            const checkoutEvent = findEventFromRequest(
                fetchMock.calls(),
                'checkout',
            );

            Should(checkoutEvent).be.ok();

            checkoutEvent.should.have.property('event_type', 'commerce_event');
            checkoutEvent.data.should.have.property('product_action');

            checkoutEvent.data.product_action.should.have.property(
                'action',
                'checkout',
            );
            checkoutEvent.data.product_action.should.have.property(
                'checkout_step',
                4,
            );
            checkoutEvent.data.product_action.should.have.property(
                'checkout_options',
                'Visa',
            );
            checkoutEvent.data.product_action.products[0].should.have.property(
                'id',
                'iphoneSKU',
            );
            checkoutEvent.data.product_action.products[1].should.have.property(
                'id',
                'galaxySKU',
            );

            done();
        });
    });

    it('should log checkout option', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            const product = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                400,
            );

            mParticle.eCommerce.logProductAction(
                ProductActionType.CheckoutOption,
                product,
                { color: 'blue' },
            );

            const checkoutOptionEvent = findEventFromRequest(
                fetchMock.calls(),
                'checkout_option',
            );

            Should(checkoutOptionEvent).be.ok();

            checkoutOptionEvent.should.have.property(
                'event_type',
                'commerce_event',
            );
            checkoutOptionEvent.data.should.have.property('product_action');

            checkoutOptionEvent.data.product_action.should.have.property(
                'action',
                'checkout_option',
            );
            checkoutOptionEvent.data.custom_attributes.should.have.property(
                'color',
                'blue',
            );
            done();
        });
    });

    it('should log product action', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            const product = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                400,
            );

            mParticle.eCommerce.logProductAction(
                ProductActionType.ViewDetail,
                product,
            );

            const viewDetailEvent = findEventFromRequest(
                fetchMock.calls(),
                'view_detail',
            );
            Should(viewDetailEvent).be.ok();

            viewDetailEvent.should.have.property(
                'event_type',
                'commerce_event',
            );
            viewDetailEvent.data.should.have.property('product_action');
            viewDetailEvent.data.product_action.should.have.property(
                'action',
                'view_detail',
            );
            viewDetailEvent.data.product_action.should.have
                .property('products')
                .with.lengthOf(1);
            viewDetailEvent.data.product_action.products[0].should.have.property(
                'id',
                '12345',
            );

            done();
        });
    });

    it('should fail to create product if name not a string', function(done) {
        const product = mParticle.eCommerce.createProduct(null);
        const product2 = mParticle.eCommerce.createProduct(undefined);
        const product3 = mParticle.eCommerce.createProduct(['product']);
        const product4 = mParticle.eCommerce.createProduct(123);
        const product5 = mParticle.eCommerce.createProduct({ key: 'value' });

        Should(product).not.be.ok();
        Should(product2).not.be.ok();
        Should(product3).not.be.ok();
        Should(product4).not.be.ok();
        Should(product5).not.be.ok();

        done();
    });

    it('should fail to create product if sku not a string or a number', function(done) {
        const product = mParticle.eCommerce.createProduct('test', null);
        const product2 = mParticle.eCommerce.createProduct('test', {
            key: 'value',
        });
        const product3 = mParticle.eCommerce.createProduct('test', []);
        const product4 = mParticle.eCommerce.createProduct('test', undefined);

        Should(product).not.be.ok();
        Should(product2).not.be.ok();
        Should(product3).not.be.ok();
        Should(product4).not.be.ok();

        done();
    });

    it('should fail to create product if price not a string or number', function(done) {
        const product = mParticle.eCommerce.createProduct('test', 'sku', null);
        const product2 = mParticle.eCommerce.createProduct('test', 'sku', null);
        const product3 = mParticle.eCommerce.createProduct('test', 'sku', null);
        const product4 = mParticle.eCommerce.createProduct('test', 'sku', null);

        Should(product).not.be.ok();
        Should(product2).not.be.ok();
        Should(product3).not.be.ok();
        Should(product4).not.be.ok();

        done();
    });

    it('should fail to create impression if name is not specified', function(done) {
        const impression = mParticle.eCommerce.createImpression(null);

        Should(impression).not.be.ok();

        done();
    });

    it('should fail to create impression if product is not specified', function(done) {
        const impression = mParticle.eCommerce.createImpression('name', null);

        Should(impression).not.be.ok();

        done();
    });

    it('should set product position to 0 if null', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            const product = mParticle.eCommerce.createProduct(
                    'iPhone',
                    '12345',
                    400,
                    2,
                    'Apple',
                    'Plus',
                    'Phones',
                ),
                transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                    '12345',
                    'test-affiliation',
                    'coupon-code',
                    44334,
                    600,
                    200,
                );

            mParticle.eCommerce.logPurchase(transactionAttributes, product);
            const purchaseEvent = findEventFromRequest(
                fetchMock.calls(),
                'purchase',
            );

            purchaseEvent.data.product_action.products[0].should.not.have.property(
                'position',
            );

            done();
        });
    });

    it('should support array of products when adding to cart', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            const product1 = mParticle.eCommerce.createProduct(
                    'iPhone',
                    '12345',
                    400,
                    2,
                ),
                product2 = mParticle.eCommerce.createProduct(
                    'Nexus',
                    '67890',
                    300,
                    1,
                );

            mParticle.eCommerce.Cart.add([product1, product2], true);

            const addToCartEvent = findEventFromRequest(
                fetchMock.calls(),
                'add_to_cart',
            );

            Should(addToCartEvent).be.ok();

            addToCartEvent.data.should.have.property('product_action');
            addToCartEvent.data.product_action.should.have.property(
                'action',
                'add_to_cart',
            );
            addToCartEvent.data.product_action.should.have
                .property('products')
                .with.lengthOf(2);

            addToCartEvent.data.product_action.products[0].should.have.property(
                'id',
                '12345',
            );
            addToCartEvent.data.product_action.products[0].should.have.property(
                'name',
                'iPhone',
            );

            addToCartEvent.data.product_action.products[1].should.have.property(
                'id',
                '67890',
            );
            addToCartEvent.data.product_action.products[1].should.have.property(
                'name',
                'Nexus',
            );

            done();
        });
    });

    it('should support a single product when adding to cart', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            const product1 = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                400,
                2,
            );

            mParticle.eCommerce.Cart.add(product1, true);

            const addToCartEvent = findEventFromRequest(
                fetchMock.calls(),
                'add_to_cart',
            );

            Should(addToCartEvent).be.ok();

            addToCartEvent.data.should.have.property('product_action');
            addToCartEvent.data.product_action.should.have.property(
                'action',
                'add_to_cart',
            );
            addToCartEvent.data.product_action.should.have
                .property('products')
                .with.lengthOf(1);

            addToCartEvent.data.product_action.products[0].should.have.property(
                'id',
                '12345',
            );
            addToCartEvent.data.product_action.products[0].should.have.property(
                'name',
                'iPhone',
            );

            done();
        });
    });

    it('expand product purchase commerce event', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            mParticle._resetForTests(MPConfig);
            const mockForwarder = new MockForwarder();
            mockForwarder.register(window.mParticle.config);
            const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
            window.mParticle.config.kitConfigs.push(config1);

            mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(() => {
                return (
                    mParticle.getInstance()._Store.identityCallInFlight ===
                    false
                );
            }).then(() => {
                mParticle.eCommerce.setCurrencyCode('foo-currency');
                const productAttributes = {};
                productAttributes['foo-attribute-key'] =
                    'foo-product-attribute-value';

                const eventAttributes = {};
                eventAttributes['foo-event-attribute-key'] =
                    'foo-event-attribute-value';

                const product = mParticle.eCommerce.createProduct(
                    'Foo name',
                    'Foo sku',
                    100.0,
                    4,
                    'foo-variant',
                    'foo-category',
                    'foo-brand',
                    5,
                    'foo-productcouponcode',
                    productAttributes,
                );

                const transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                    'foo-transaction-id',
                    'foo-affiliation',
                    'foo-couponcode',
                    400,
                    10,
                    8,
                );
                mParticle.eCommerce.logPurchase(
                    transactionAttributes,
                    product,
                    false,
                    eventAttributes,
                );
                window.MockForwarder1.instance.receivedEvent.should.have.property(
                    'ProductAction',
                );
                const expandedEvents = mParticle.eCommerce.expandCommerceEvent(
                    window.MockForwarder1.instance.receivedEvent,
                );
                expandedEvents.should.be.instanceof(Array).and.have.lengthOf(2);

                const plusOneEvent = expandedEvents[0];
                plusOneEvent.should.have.property(
                    'EventName',
                    'eCommerce - purchase - Total',
                );
                plusOneEvent.should.have.property(
                    'EventCategory',
                    mParticle.EventType.Transaction,
                );
                let attributes = plusOneEvent.EventAttributes;
                attributes.should.have.property(
                    'Transaction Id',
                    'foo-transaction-id',
                );
                attributes.should.have.property(
                    'Affiliation',
                    'foo-affiliation',
                );
                attributes.should.have.property(
                    'Coupon Code',
                    'foo-couponcode',
                );
                attributes.should.have.property('Total Amount', 400);
                attributes.should.have.property('Shipping Amount', 10);
                attributes.should.have.property('Product Count', 1);
                attributes.should.have.property('Tax Amount', 8);
                attributes.should.have.property(
                    'Currency Code',
                    'foo-currency',
                );
                attributes.should.have.property(
                    'foo-event-attribute-key',
                    'foo-event-attribute-value',
                );

                const productEvent = expandedEvents[1];
                productEvent.should.have.property(
                    'EventName',
                    'eCommerce - purchase - Item',
                );
                productEvent.should.have.property(
                    'EventCategory',
                    mParticle.EventType.Transaction,
                );
                attributes = productEvent.EventAttributes;
                attributes.should.not.have.property('Affiliation');
                attributes.should.not.have.property('Total Amount');
                attributes.should.not.have.property('Shipping Amount');
                attributes.should.not.have.property('Tax Amount');
                attributes.should.have.property('foo-event-attribute-key');
                attributes.should.have.property(
                    'Coupon Code',
                    'foo-productcouponcode',
                );
                attributes.should.have.property('Brand', 'foo-brand');
                attributes.should.have.property('Category', 'foo-category');
                attributes.should.have.property('Name', 'Foo name');
                attributes.should.have.property('Id', 'Foo sku');
                attributes.should.have.property('Item Price', 100.0);
                attributes.should.have.property('Quantity', 4);
                attributes.should.have.property('Position', 5);
                attributes.should.have.property(
                    'foo-attribute-key',
                    'foo-product-attribute-value',
                );

                done();
            });
        });
    });

    it('expand product refund commerce event', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            mParticle._resetForTests(MPConfig);
            const mockForwarder = new MockForwarder();
            mockForwarder.register(window.mParticle.config);
            const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
            window.mParticle.config.kitConfigs.push(config1);

            mParticle.init(apiKey, window.mParticle.config);

            waitForCondition(() => {
                return (
                    mParticle.getInstance()._Store.identityCallInFlight ===
                    false
                );
            }).then(() => {
                const productAttributes = {};
                productAttributes['foo-attribute-key'] =
                    'foo-product-attribute-value';

                const eventAttributes = {};
                eventAttributes['foo-event-attribute-key'] =
                    'foo-event-attribute-value';

                const product = mParticle.eCommerce.createProduct(
                    'Foo name',
                    'Foo sku',
                    100.0,
                    4,
                    'foo-variant',
                    'foo-category',
                    'foo-brand',
                    5,
                    'foo-productcouponcode',
                    productAttributes,
                );

                const transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                    'foo-transaction-id',
                    'foo-affiliation',
                    'foo-couponcode',
                    400,
                    10,
                    8,
                );
                mParticle.eCommerce.logRefund(
                    transactionAttributes,
                    product,
                    false,
                    eventAttributes,
                );
                window.MockForwarder1.instance.receivedEvent.should.have.property(
                    'ProductAction',
                );
                const expandedEvents = mParticle.eCommerce.expandCommerceEvent(
                    window.MockForwarder1.instance.receivedEvent,
                );
                expandedEvents.should.be.instanceof(Array).and.have.lengthOf(2);

                const plusOneEvent = expandedEvents[0];
                plusOneEvent.should.have.property(
                    'EventName',
                    'eCommerce - refund - Total',
                );
                const attributes = plusOneEvent.EventAttributes;
                attributes.should.have.property('Product Count', 1);

                const productEvent = expandedEvents[1];
                productEvent.should.have.property(
                    'EventName',
                    'eCommerce - refund - Item',
                );

                done();
            });
        });
    });

    it('expand non-plus-one-product commerce event', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            mParticle._resetForTests(MPConfig);
            const mockForwarder = new MockForwarder();
            mockForwarder.register(window.mParticle.config);
            const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
            window.mParticle.config.kitConfigs.push(config1);

            mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(() => {
                return (
                    mParticle.getInstance()._Store.identityCallInFlight ===
                    false
                );
            }).then(() => {
                const productAttributes = {};
                productAttributes['foo-attribute-key'] =
                    'foo-product-attribute-value';

                const eventAttributes = {};
                eventAttributes['foo-event-attribute-key'] =
                    'foo-event-attribute-value';

                const product = mParticle.eCommerce.createProduct(
                    'Foo name',
                    'Foo sku',
                    100.0,
                    4,
                    'foo-variant',
                    'foo-category',
                    'foo-brand',
                    5,
                    'foo-productcouponcode',
                    productAttributes,
                );

                mParticle.eCommerce.logProductAction(
                    mParticle.ProductActionType.RemoveFromWishlist,
                    product,
                    eventAttributes,
                );
                window.MockForwarder1.instance.receivedEvent.should.have.property(
                    'ProductAction',
                );
                const expandedEvents = mParticle.eCommerce.expandCommerceEvent(
                    window.MockForwarder1.instance.receivedEvent,
                );
                expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

                const productEvent = expandedEvents[0];
                productEvent.should.have.property(
                    'EventName',
                    'eCommerce - remove_from_wishlist - Item',
                );
                productEvent.should.have.property(
                    'EventCategory',
                    mParticle.EventType.Transaction,
                );
                const attributes = productEvent.EventAttributes;

                attributes.should.have.property(
                    'Coupon Code',
                    'foo-productcouponcode',
                );
                attributes.should.have.property('Brand', 'foo-brand');
                attributes.should.have.property('Category', 'foo-category');
                attributes.should.have.property('Name', 'Foo name');
                attributes.should.have.property('Id', 'Foo sku');
                attributes.should.have.property('Item Price', 100.0);
                attributes.should.have.property('Quantity', 4);
                attributes.should.have.property('Position', 5);
                attributes.should.have.property(
                    'foo-attribute-key',
                    'foo-product-attribute-value',
                );

                done();
            });
        });
    });

    it('expand checkout commerce event', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            mParticle._resetForTests(MPConfig);
            const mockForwarder = new MockForwarder();
            mockForwarder.register(window.mParticle.config);
            const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
            window.mParticle.config.kitConfigs.push(config1);

            mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(() => {
                return (
                    mParticle.getInstance()._Store.identityCallInFlight ===
                    false
                );
            }).then(() => {
                const eventAttributes = {};
                eventAttributes['foo-event-attribute-key'] =
                    'foo-event-attribute-value';
                eventAttributes['Checkout Step'] = 'foo-step';
                eventAttributes['Checkout Options'] = 'foo-options';

                const productAttributes = {};
                productAttributes['foo-attribute-key'] =
                    'foo-product-attribute-value';

                const product = mParticle.eCommerce.createProduct(
                    'Foo name',
                    'Foo sku',
                    100.0,
                    4,
                    'foo-variant',
                    'foo-category',
                    'foo-brand',
                    5,
                    'foo-productcouponcode',
                    productAttributes,
                );

                mParticle.eCommerce.Cart.add(product, true);

                mParticle.eCommerce.logProductAction(
                    mParticle.ProductActionType.Checkout,
                    [product],
                    eventAttributes,
                );

                window.MockForwarder1.instance.receivedEvent.should.have.property(
                    'ProductAction',
                );

                const expandedEvents = mParticle.eCommerce.expandCommerceEvent(
                    window.MockForwarder1.instance.receivedEvent,
                );
                expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

                const productEvent = expandedEvents[0];
                productEvent.should.have.property(
                    'EventName',
                    'eCommerce - checkout - Item',
                );
                productEvent.should.have.property(
                    'EventCategory',
                    mParticle.EventType.Transaction,
                );
                const attributes = productEvent.EventAttributes;

                attributes.should.have.property('Checkout Step', 'foo-step');
                attributes.should.have.property(
                    'Checkout Options',
                    'foo-options',
                );
                attributes.should.have.property(
                    'Coupon Code',
                    'foo-productcouponcode',
                );
                attributes.should.have.property('Brand', 'foo-brand');
                attributes.should.have.property('Category', 'foo-category');
                attributes.should.have.property('Name', 'Foo name');
                attributes.should.have.property('Id', 'Foo sku');
                attributes.should.have.property('Item Price', 100.0);
                attributes.should.have.property('Quantity', 4);
                attributes.should.have.property('Position', 5);
                attributes.should.have.property(
                    'foo-attribute-key',
                    'foo-product-attribute-value',
                );

                done();
            });
        });
    });

    it('expand promotion commerce event', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            mParticle._resetForTests(MPConfig);
            const mockForwarder = new MockForwarder();
            mockForwarder.register(window.mParticle.config);
            const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
            window.mParticle.config.kitConfigs.push(config1);

            mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(() => {
                return (
                    mParticle.getInstance()._Store.identityCallInFlight ===
                    false
                );
            }).then(() => {
                const eventAttributes = {};
                eventAttributes['foo-event-attribute-key'] =
                    'foo-event-attribute-value';

                const promotion = mParticle.eCommerce.createPromotion(
                    'foo-id',
                    'foo-creative',
                    'foo-name',
                    5,
                );

                mParticle.eCommerce.logPromotion(
                    mParticle.PromotionType.PromotionClick,
                    promotion,
                    eventAttributes,
                );
                window.MockForwarder1.instance.receivedEvent.should.have.property(
                    'PromotionAction',
                );
                const expandedEvents = mParticle.eCommerce.expandCommerceEvent(
                    window.MockForwarder1.instance.receivedEvent,
                );

                expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

                const promotionEvent = expandedEvents[0];
                promotionEvent.should.have.property(
                    'EventName',
                    'eCommerce - click - Item',
                );
                promotionEvent.should.have.property(
                    'EventCategory',
                    mParticle.EventType.Transaction,
                );
                const attributes = promotionEvent.EventAttributes;

                attributes.should.have.property('Id', 'foo-id');
                attributes.should.have.property('Creative', 'foo-creative');
                attributes.should.have.property('Name', 'foo-name');
                attributes.should.have.property('Position', 5);
                attributes.should.have.property(
                    'foo-event-attribute-key',
                    'foo-event-attribute-value',
                );

                done();
            });
        });
    });

    it('expand null commerce event', function(done) {
        const expandedEvents = mParticle.eCommerce.expandCommerceEvent(null);
        (expandedEvents == null).should.be.true;

        done();
    });

    it('expand impression commerce event', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            mParticle._resetForTests(MPConfig);
            const mockForwarder = new MockForwarder();
            mockForwarder.register(window.mParticle.config);
            const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
            window.mParticle.config.kitConfigs.push(config1);

            mParticle.init(apiKey, window.mParticle.config);
            waitForCondition(() => {
                return (
                    mParticle.getInstance()._Store.identityCallInFlight ===
                    false
                );
            }).then(() => {
                const productAttributes = {};
                productAttributes['foo-attribute-key'] =
                    'foo-product-attribute-value';

                const eventAttributes = {};
                eventAttributes['foo-event-attribute-key'] =
                    'foo-event-attribute-value';

                const product = mParticle.eCommerce.createProduct(
                    'Foo name',
                    'Foo sku',
                    100.0,
                    4,
                    'foo-variant',
                    'foo-category',
                    'foo-brand',
                    5,
                    'foo-productcouponcode',
                    productAttributes,
                );

                const impression = mParticle.eCommerce.createImpression(
                    'suggested products list',
                    product,
                );

                mParticle.eCommerce.logImpression(impression, eventAttributes);
                window.MockForwarder1.instance.receivedEvent.should.have.property(
                    'ProductImpressions',
                );
                const expandedEvents = mParticle.eCommerce.expandCommerceEvent(
                    window.MockForwarder1.instance.receivedEvent,
                );

                expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

                const impressionEvent = expandedEvents[0];
                impressionEvent.should.have.property(
                    'EventName',
                    'eCommerce - Impression - Item',
                );
                impressionEvent.should.have.property(
                    'EventCategory',
                    mParticle.EventType.Transaction,
                );
                const attributes = impressionEvent.EventAttributes;

                attributes.should.have.property(
                    'Product Impression List',
                    'suggested products list',
                );
                attributes.should.have.property(
                    'Coupon Code',
                    'foo-productcouponcode',
                );
                attributes.should.have.property('Brand', 'foo-brand');
                attributes.should.have.property('Category', 'foo-category');
                attributes.should.have.property('Name', 'Foo name');
                attributes.should.have.property('Id', 'Foo sku');
                attributes.should.have.property('Item Price', 100.0);
                attributes.should.have.property('Quantity', 4);
                attributes.should.have.property('Position', 5);
                attributes.should.have.property(
                    'foo-attribute-key',
                    'foo-product-attribute-value',
                );
                attributes.should.have.property(
                    'foo-event-attribute-key',
                    'foo-event-attribute-value',
                );

                done();
            });
        });
    });

    it('should add customFlags to logCheckout events', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            mParticle.eCommerce.logCheckout(
                1,
                {},
                {},
                { interactionEvent: true },
            );

            const checkoutEvent = findEventFromRequest(
                fetchMock.calls(),
                'checkout',
            );
            checkoutEvent.data.custom_flags.interactionEvent.should.equal(true);

            done();
        });
    });

    it('should add customFlags to logProductAction events', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            const product = mParticle.eCommerce.createProduct(
                'iPhone',
                'sku1',
                499,
            );
            mParticle.eCommerce.logProductAction(
                mParticle.ProductActionType.Unknown,
                product,
                { price: 5 },
                { interactionEvent: true },
            );
            const unknownEvent = findEventFromRequest(
                fetchMock.calls(),
                'unknown',
            );

            unknownEvent.data.custom_flags.interactionEvent.should.equal(true);

            done();
        });
    });

    it('should add customFlags to logPurchase events', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            const product = mParticle.eCommerce.createProduct(
                'iPhone',
                'sku1',
                499,
            );
            const transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                'id1',
                'affil1',
                'couponCode1',
            );
            mParticle.eCommerce.logPurchase(
                transactionAttributes,
                product,
                true,
                { shipping: 5 },
                { interactionEvent: true },
            );

            const purchaseEvent = findEventFromRequest(
                fetchMock.calls(),
                'purchase',
            );

            purchaseEvent.data.custom_flags.interactionEvent.should.equal(true);

            done();
        });
    });

    it('should add customFlags to logPromotion events', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            const promotion = mParticle.eCommerce.createPromotion(
                'id',
                'creative',
                'name',
            );

            mParticle.eCommerce.logPromotion(
                mParticle.PromotionType.Unknown,
                promotion,
                { shipping: 5 },
                { interactionEvent: true },
            );

            const promotionEvent = findEventFromRequest(
                fetchMock.calls(),
                'click',
            );

            promotionEvent.data.custom_flags.interactionEvent.should.equal(
                true,
            );

            done();
        });
    });

    it('should add customFlags to logImpression events', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            const product = mParticle.eCommerce.createProduct(
                'iPhone',
                'sku1',
                499,
            );
            const impression = mParticle.eCommerce.createImpression(
                'iphoneImpressionName',
                product,
            );
            mParticle.eCommerce.logImpression(
                impression,
                { shipping: 5 },
                { interactionEvent: true },
            );

            const impressionEvent = findEventFromRequest(
                fetchMock.calls(),
                'impression',
            );
            impressionEvent.data.custom_flags.interactionEvent.should.equal(
                true,
            );

            done();
        });
    });

    it('should add customFlags to logRefund events', function(done) {
        waitForCondition(hasIdentifyReturned).then(() => {
            const product = mParticle.eCommerce.createProduct(
                'iPhone',
                'sku1',
                499,
            );
            const transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                'id1',
                'affil1',
                'couponCode1',
            );
            mParticle.eCommerce.logRefund(
                transactionAttributes,
                product,
                true,
                { shipping: 5 },
                { interactionEvent: true },
            );
            const refundEvent = findEventFromRequest(
                fetchMock.calls(),
                'refund',
            );

            refundEvent.data.custom_flags.interactionEvent.should.equal(true);

            done();
        });
    });
    describe('Cart', function() {
        afterEach(function() {
            sinon.restore();
        });

        it('should deprecate add', function() {
            waitForCondition(hasIdentifyReturned).then(() => {
                const bond = sinon.spy(
                    mParticle.getInstance().Logger,
                    'warning',
                );

                const product = mParticle.eCommerce.createProduct(
                    'iPhone',
                    '12345',
                    400,
                );

                mParticle.eCommerce.Cart.add(product, true);

                bond.called.should.eql(true);
                bond.getCalls()[0].args[0].should.eql(
                    'Deprecated function eCommerce.Cart.add() will be removed in future releases',
                );
            });
        });
        it('should deprecate remove', function() {
            waitForCondition(hasIdentifyReturned).then(() => {
                const bond = sinon.spy(
                    mParticle.getInstance().Logger,
                    'warning',
                );

                const product = mParticle.eCommerce.createProduct(
                    'iPhone',
                    '12345',
                    400,
                );

                mParticle.eCommerce.Cart.remove(product, true);

                bond.called.should.eql(true);
                bond.getCalls()[0].args[0].should.eql(
                    'Deprecated function eCommerce.Cart.remove() will be removed in future releases',
                );
            });
        });

        it('should deprecate clear', function() {
            waitForCondition(hasIdentifyReturned).then(() => {
                const bond = sinon.spy(
                    mParticle.getInstance().Logger,
                    'warning',
                );

                mParticle.eCommerce.Cart.clear();

                bond.called.should.eql(true);
                bond.getCalls()[0].args[0].should.eql(
                    'Deprecated function eCommerce.Cart.clear() will be removed in future releases',
                );
            });
        });

        it('should be empty when transactionAttributes is empty', function() {
            const mparticle = mParticle.getInstance();
            const productAction = {};
            mparticle._Ecommerce.convertTransactionAttributesToProductAction(
                {},
                productAction,
            );
            Object.keys(productAction).length.should.equal(0);
        });

        it('should sanitize certain ecommerce amounts from strings to 0', function() {
            mParticle
                .getInstance()
                ._Ecommerce.sanitizeAmount('$42', 'Price')
                .should.equal(0);
            mParticle
                .getInstance()
                ._Ecommerce.sanitizeAmount('$100', 'TotalAmount')
                .should.equal(0);
            mParticle
                .getInstance()
                ._Ecommerce.sanitizeAmount('first', 'Position')
                .should.equal(0);
            mParticle
                .getInstance()
                ._Ecommerce.sanitizeAmount('two', 'Quantity')
                .should.equal(0);
            mParticle
                .getInstance()
                ._Ecommerce.sanitizeAmount('string', 'Shipping')
                .should.equal(0);
            mParticle
                .getInstance()
                ._Ecommerce.sanitizeAmount('$5.80', 'Tax')
                .should.equal(0);
        });

        it('should convert transactionAttributes strings to numbers or zero', function() {
            const mparticle = mParticle.getInstance();
            const transactionAttributes = {
                Id: 'id',
                Affiliation: 'affiliation',
                CouponCode: 'couponCode',
                Revenue: 'revenue',
                Shipping: 'shipping',
                Tax: 'tax',
            };

            const productAction = {};
            mparticle._Ecommerce.convertTransactionAttributesToProductAction(
                transactionAttributes,
                productAction,
            );
            productAction.TransactionId.should.equal('id');
            productAction.Affiliation.should.equal('affiliation');
            productAction.CouponCode.should.equal('couponCode');

            // convert strings to 0
            productAction.TotalAmount.should.equal(0);
            productAction.ShippingAmount.should.equal(0);
            productAction.TaxAmount.should.equal(0);
        });

        it('should allow a user to pass in a source_message_id to a commerce event', function() {
            waitForCondition(hasIdentifyReturned).then(() => {
                const product = mParticle.eCommerce.createProduct(
                        'iPhone',
                        '12345',
                        '400',
                        2,
                        'Plus',
                        'Phones',
                        'Apple',
                        1,
                        'my-coupon-code',
                        { customkey: 'customvalue' },
                    ),
                    transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
                        '12345',
                        'test-affiliation',
                        'coupon-code',
                        44334,
                        600,
                        200,
                    );

                mParticle.eCommerce.logProductAction(
                    mParticle.ProductActionType.Purchase,
                    product,
                    null,
                    null,
                    transactionAttributes,
                    {
                        sourceMessageId: 'foo-bar',
                    },
                );

                const purchaseEvent1 = findEventFromRequest(
                    fetchMock.calls(),
                    'purchase',
                );
                purchaseEvent1.data.source_message_id.should.equal('foo-bar');
            });
        });
    });
});
