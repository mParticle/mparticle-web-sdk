import Utils from './config/utils';
import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { urls, apiKey, MPConfig, testMPID, ProductActionType, PromotionActionType } from './config/constants';
const { waitForCondition, fetchMockSuccess, hasIdentifyReturned } = Utils;

const forwarderDefaultConfiguration = Utils.forwarderDefaultConfiguration,
    findEventFromRequest = Utils.findEventFromRequest,
    MockForwarder = Utils.MockForwarder;

describe('eCommerce', function() {
    beforeEach(function() {
        mParticle._resetForTests(MPConfig);
        delete mParticle._instances['default_instance'];
        fetchMock.config.overwriteRoutes = true;
        fetchMock.post(urls.events, 200);
        fetchMockSuccess(urls.identify, {
            mpid: testMPID, is_logged_in: false
        });
        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        fetchMock.restore();
        sinon.restore();
    });

    it('should create ecommerce product', () => {
        const product = mParticle.eCommerce.createProduct(
            'iPhone',
            '12345',
            400,
            2
        );

        product.should.have.property('Name', 'iPhone');
        product.should.have.property('Sku', '12345');
        product.should.have.property('Price', 400);
        product.should.have.property('Quantity', 2);
    });

    it('should create transaction attributes', () => {
        const transactionAttributes = mParticle.eCommerce.createTransactionAttributes(
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
    });


    it('should not log an ecommerce event if there is a typo in the product action type', () => {
        // fetchMock calls will have session start and AST events, we want to reset so that we can prove the product action type does not go through (length remains 0 after logging)
        fetchMock.resetHistory();
        const product = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                '400');

        mParticle.eCommerce.logProductAction(
            mParticle.ProductActionType.Typo, // <------ will result in a null when converting the product action type as this is not a real value
            [product]
        );
        fetchMock.calls().length.should.equal(0);
    });





    it('should create promotion', () => {
        const promotion = mParticle.eCommerce.createPromotion(
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
    });

    it('should log promotion click', async () => {
        const promotion = mParticle.eCommerce.createPromotion(
            '12345',
            'my-creative',
            'creative-name',
            1
        );

        await waitForCondition(hasIdentifyReturned);
        mParticle.eCommerce.logPromotion(
            mParticle.PromotionType.PromotionClick,
            promotion
        );

        const promotionEvent = findEventFromRequest(fetchMock.calls(), 'click');

        Should(promotionEvent).be.ok();

        promotionEvent.data.promotion_action.should.have.property('action', PromotionActionType.PromotionClick);
        promotionEvent.data.promotion_action.should.have.property('promotions');
        promotionEvent.data.promotion_action.promotions[0].should.have.property('id', '12345');
        promotionEvent.data.promotion_action.promotions[0].should.have.property('name', 'creative-name');
        promotionEvent.data.promotion_action.promotions[0].should.have.property('creative', 'my-creative');
        promotionEvent.data.promotion_action.promotions[0].should.have.property('position', 1);
    });

    it('should allow multiple promotions to be logged at once', async () => {
        const promotion1 = mParticle.eCommerce.createPromotion(
            '12345',
            'my-creative1',
            'creative-name1',
            1
        );

        const promotion2 = mParticle.eCommerce.createPromotion(
            '67890',
            'my-creative2',
            'creative-name2',
            2
        );

        await waitForCondition(hasIdentifyReturned);
        mParticle.eCommerce.logPromotion(
            mParticle.PromotionType.PromotionClick,
            [promotion1, promotion2]
        );

        const promotionEvent = findEventFromRequest(fetchMock.calls(), 'click');

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
    });

    it('should allow an promotions to bypass server upload', async () => {
        const promotion = mParticle.eCommerce.createPromotion(
            '12345',
            'my-creative',
            'creative-name',
            1
        );

        await waitForCondition(hasIdentifyReturned);
        mParticle.eCommerce.logPromotion(
            mParticle.PromotionType.PromotionClick,
            promotion,
            {}, {},
            { shouldUploadEvent: false }
        );

        const promotionEvent = findEventFromRequest(fetchMock.calls(), 'click');
        Should(promotionEvent).not.be.ok();
    });

    it('should create impression', () => {
        const product = mParticle.eCommerce.createProduct('iPhone', '12345', 400),
            impression = mParticle.eCommerce.createImpression(
                'impression-name',
                product
            );

        impression.should.have.property('Name', 'impression-name');
        impression.should.have.property('Product');
        impression.Product.should.have.property('Sku', '12345');
    });

    it('should log impression event', async () => {
        const product = mParticle.eCommerce.createProduct('iPhone', '12345', 400),
            impression = mParticle.eCommerce.createImpression(
                'impression-name',
                product
            );

        await waitForCondition(hasIdentifyReturned);
        mParticle.eCommerce.logImpression(impression);
        const impressionEvent = findEventFromRequest(fetchMock.calls(), 'impression');

        Should(impressionEvent).be.ok();

        impressionEvent.data.should.have.property('product_impressions').with.lengthOf(1);
        impressionEvent.data.product_impressions[0].should.have.property('product_impression_list', 'impression-name');
        impressionEvent.data.product_impressions[0].should.have.property('products').with.lengthOf(1);
        impressionEvent.data.product_impressions[0].products[0].should.have.property('id', '12345');
    });

    it('should allow an impression to bypass server upload', async () => {
        await waitForCondition(hasIdentifyReturned);
        const product = mParticle.eCommerce.createProduct('iPhone', '12345', 400),
            impression = mParticle.eCommerce.createImpression(
                'impression-name',
                product
            );

        mParticle.eCommerce.logImpression(impression, null, null, { shouldUploadEvent: false });

        const impressionEvent = findEventFromRequest(fetchMock.calls(), 'impression');

        Should(impressionEvent).not.be.ok();
    });

    it('should log multiple impression when an array of impressions is passed', async () => {
        await waitForCondition(hasIdentifyReturned);
        const product = mParticle.eCommerce.createProduct('iPhone', '12345', 400),
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

        const impressionEvent = findEventFromRequest(fetchMock.calls(), 'impression');

        Should(impressionEvent).be.ok();

        impressionEvent.data.should.have.property('product_impressions').with.lengthOf(2);

        impressionEvent.data.product_impressions[0].should.have.property('product_impression_list', 'impression-name1');
        impressionEvent.data.product_impressions[0].should.have.property('products').with.lengthOf(1);
        impressionEvent.data.product_impressions[0].products[0].should.have.property('id', '12345');

        impressionEvent.data.product_impressions[1].should.have.property('product_impression_list', 'impression-name2');
        impressionEvent.data.product_impressions[1].should.have.property('products').with.lengthOf(1);
        impressionEvent.data.product_impressions[1].products[0].should.have.property('id', '23456');
    });



    it('should allow a product action to bypass server upload', async () => {
        await waitForCondition(hasIdentifyReturned);
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

        const event = findEventFromRequest(fetchMock.calls(), 'purchase');

        Should(event).not.be.ok();
    });


    it('should log checkout via mParticle.logProductAction method', async () => {
        await waitForCondition(hasIdentifyReturned);
        const product1 = mParticle.eCommerce.createProduct('iphone', 'iphoneSKU', 999);
        const product2 = mParticle.eCommerce.createProduct('galaxy', 'galaxySKU', 799);

        mParticle.eCommerce.logProductAction(mParticle.ProductActionType.Checkout, [product1, product2], null, null, {Step: 4, Option: 'Visa'});

        const checkoutEvent = findEventFromRequest(fetchMock.calls(), 'checkout');

        Should(checkoutEvent).be.ok();

        checkoutEvent.should.have.property('event_type', 'commerce_event');
        checkoutEvent.data.should.have.property('product_action');

        checkoutEvent.data.product_action.should.have.property('action', 'checkout');
        checkoutEvent.data.product_action.should.have.property('checkout_step', 4);
        checkoutEvent.data.product_action.should.have.property('checkout_options', 'Visa');
        checkoutEvent.data.product_action.products[0].should.have.property('id', 'iphoneSKU');
        checkoutEvent.data.product_action.products[1].should.have.property('id', 'galaxySKU');
    });

    it('should log checkout option', async () => {
        await waitForCondition(hasIdentifyReturned);
        const product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);

        mParticle.eCommerce.logProductAction(
            ProductActionType.CheckoutOption,
            product,
            { color: 'blue' }
        );

        const checkoutOptionEvent = findEventFromRequest(fetchMock.calls(), 'checkout_option');


        Should(checkoutOptionEvent).be.ok();

        checkoutOptionEvent.should.have.property(
            'event_type',
            'commerce_event'
        );
        checkoutOptionEvent.data.should.have.property('product_action');

        checkoutOptionEvent.data.product_action.should.have.property('action', 'checkout_option');
        checkoutOptionEvent.data.custom_attributes.should.have.property('color', 'blue');
    });

    it('should log product action', async () => {
        await waitForCondition(hasIdentifyReturned);
        const product = mParticle.eCommerce.createProduct('iPhone', '12345', 400);

        mParticle.eCommerce.logProductAction(
            ProductActionType.ViewDetail,
            product
        );

        const viewDetailEvent = findEventFromRequest(fetchMock.calls(), 'view_detail');
        Should(viewDetailEvent).be.ok();
    
        viewDetailEvent.should.have.property('event_type', 'commerce_event');
        viewDetailEvent.data.should.have.property('product_action');
        viewDetailEvent.data.product_action.should.have.property('action', 'view_detail');
        viewDetailEvent.data.product_action.should.have.property('products').with.lengthOf(1);
        viewDetailEvent.data.product_action.products[0].should.have.property('id', '12345');
    });

    it('should fail to create product if name not a string', () => {
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
    });

    it('should fail to create product if sku not a string or a number', () => {
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
    });

    it('should fail to create product if price not a string or number', () => {
        const product = mParticle.eCommerce.createProduct('test', 'sku', null);
        const product2 = mParticle.eCommerce.createProduct('test', 'sku', null);
        const product3 = mParticle.eCommerce.createProduct('test', 'sku', null);
        const product4 = mParticle.eCommerce.createProduct('test', 'sku', null);

        Should(product).not.be.ok();
        Should(product2).not.be.ok();
        Should(product3).not.be.ok();
        Should(product4).not.be.ok();
    });

    it('should fail to create impression if name is not specified', () => {
        const impression = mParticle.eCommerce.createImpression(null);

        Should(impression).not.be.ok();
    });

    it('should fail to create impression if product is not specified', () => {
        const impression = mParticle.eCommerce.createImpression('name', null);

        Should(impression).not.be.ok();
    });


        

    it('expand non-plus-one-product commerce event', async () => {
        await waitForCondition(hasIdentifyReturned);
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);
        
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });
        const productAttributes = {};
        productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

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
        const expandedEvents = mParticle.eCommerce.expandCommerceEvent(
            window.MockForwarder1.instance.receivedEvent
        );
        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

        const productEvent = expandedEvents[0];
        productEvent.should.have.property(
            'EventName',
            'eCommerce - remove_from_wishlist - Item'
        );
        productEvent.should.have.property(
            'EventCategory',
            mParticle.EventType.Transaction
        );
        const attributes = productEvent.EventAttributes;

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
    });

    it('expand checkout commerce event', async () => {
        await waitForCondition(hasIdentifyReturned);
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });

        const eventAttributes = {};
        eventAttributes['foo-event-attribute-key'] =
            'foo-event-attribute-value';
        eventAttributes['Checkout Step'] = 'foo-step';
        eventAttributes['Checkout Options'] = 'foo-options';

        const productAttributes = {};
        productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

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
            productAttributes
        );

        mParticle.eCommerce.Cart.add(product, true);

        mParticle.eCommerce.logProductAction(mParticle.ProductActionType.Checkout, [product], eventAttributes);

        window.MockForwarder1.instance.receivedEvent.should.have.property(
            'ProductAction'
        );

        const expandedEvents = mParticle.eCommerce.expandCommerceEvent(
            window.MockForwarder1.instance.receivedEvent
        );
        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

        const productEvent = expandedEvents[0];
        productEvent.should.have.property(
            'EventName',
            'eCommerce - checkout - Item'
        );
        productEvent.should.have.property(
            'EventCategory',
            mParticle.EventType.Transaction
        );
        const attributes = productEvent.EventAttributes;

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
    });

    it('expand promotion commerce event', async () => {
        await waitForCondition(hasIdentifyReturned);
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);
        
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });

        const eventAttributes = {};
        eventAttributes['foo-event-attribute-key'] =
            'foo-event-attribute-value';

        const promotion = mParticle.eCommerce.createPromotion(
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
        const expandedEvents = mParticle.eCommerce.expandCommerceEvent(
            window.MockForwarder1.instance.receivedEvent
        );

        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

        const promotionEvent = expandedEvents[0];
        promotionEvent.should.have.property(
            'EventName',
            'eCommerce - click - Item'
        );
        promotionEvent.should.have.property(
            'EventCategory',
            mParticle.EventType.Transaction
        );
        const attributes = promotionEvent.EventAttributes;

        attributes.should.have.property('Id', 'foo-id');
        attributes.should.have.property('Creative', 'foo-creative');
        attributes.should.have.property('Name', 'foo-name');
        attributes.should.have.property('Position', 5);
        attributes.should.have.property(
            'foo-event-attribute-key',
            'foo-event-attribute-value'
        );
    });

    it('expand null commerce event', () => {
        const expandedEvents = mParticle.eCommerce.expandCommerceEvent(null);
        (expandedEvents == null).should.be.true;
    });

    it('expand impression commerce event', async () => {
        await waitForCondition(hasIdentifyReturned);
        const mockForwarder = new MockForwarder();
        mockForwarder.register(window.mParticle.config);
        const config1 = forwarderDefaultConfiguration('MockForwarder', 1);
        window.mParticle.config.kitConfigs.push(config1);
        
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });

        const productAttributes = {};
        productAttributes['foo-attribute-key'] = 'foo-product-attribute-value';

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
            productAttributes
        );

        const impression = mParticle.eCommerce.createImpression(
            'suggested products list',
            product
        );

        mParticle.eCommerce.logImpression(impression, eventAttributes);
        window.MockForwarder1.instance.receivedEvent.should.have.property(
            'ProductImpressions'
        );
        const expandedEvents = mParticle.eCommerce.expandCommerceEvent(
            window.MockForwarder1.instance.receivedEvent
        );

        expandedEvents.should.be.instanceof(Array).and.have.lengthOf(1);

        const impressionEvent = expandedEvents[0];
        impressionEvent.should.have.property(
            'EventName',
            'eCommerce - Impression - Item'
        );
        impressionEvent.should.have.property(
            'EventCategory',
            mParticle.EventType.Transaction
        );
        const attributes = impressionEvent.EventAttributes;

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
    });


    it('should add customFlags to logProductAction events', async () => {
        await waitForCondition(hasIdentifyReturned);
        const product = mParticle.eCommerce.createProduct('iPhone', 'sku1', 499);
        mParticle.eCommerce.logProductAction(
            mParticle.ProductActionType.Unknown,
            product,
            { price: 5 },
            { interactionEvent: true }
        );
        const unknownEvent = findEventFromRequest(fetchMock.calls(), 'unknown');

        unknownEvent.data.custom_flags.interactionEvent.should.equal(true);
    });


    it('should add customFlags to logPromotion events', async () => {
        await waitForCondition(hasIdentifyReturned);
        const promotion = mParticle.eCommerce.createPromotion(
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


        const promotionEvent = findEventFromRequest(fetchMock.calls(), 'click');

        promotionEvent.data.custom_flags.interactionEvent.should.equal(true);
    });

    it('should add customFlags to logImpression events', async () => {
        await waitForCondition(hasIdentifyReturned);
        const product = mParticle.eCommerce.createProduct('iPhone', 'sku1', 499);
        const impression = mParticle.eCommerce.createImpression(
            'iphoneImpressionName',
            product
        );
        mParticle.eCommerce.logImpression(
            impression,
            { shipping: 5 },
            { interactionEvent: true }
        );

        const impressionEvent = findEventFromRequest(fetchMock.calls(), 'impression');
        impressionEvent.data.custom_flags.interactionEvent.should.equal(true);
    });

    describe('Cart', function() {
        afterEach(function() {
            sinon.restore();
        });

        it('should deprecate add', async () => {
            await waitForCondition(hasIdentifyReturned);
            mParticle._resetForTests(MPConfig);
            const bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

            const product = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                400
            );

            mParticle.eCommerce.Cart.add(product, true);

            bond.called.should.eql(true);
            bond.getCalls()[0].args[0].should.eql(
                'eCommerce.Cart.add() has been deprecated. Please use the alternate method: eCommerce.logProductAction(). See - https://docs.mparticle.com/developers/sdk/web/commerce-tracking'
            );
        });
        
        it('should deprecate remove', async () => {
            await waitForCondition(hasIdentifyReturned);
            const bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

            const product = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                400
            );

            mParticle.eCommerce.Cart.remove(product, true);

            bond.called.should.eql(true);
            bond.getCalls()[0].args[0].should.eql(
                'eCommerce.Cart.remove() has been deprecated. Please use the alternate method: eCommerce.logProductAction(). See - https://docs.mparticle.com/developers/sdk/web/commerce-tracking'
            );
        });

        it('should deprecate clear', async () => {
            await waitForCondition(hasIdentifyReturned);
            const bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

            mParticle.eCommerce.Cart.clear();

            bond.called.should.eql(true);
            bond.getCalls()[0].args[0].should.eql(
                'eCommerce.Cart.clear() has been deprecated. See - https://docs.mparticle.com/developers/sdk/web/commerce-tracking'
            );
        });

        it('should be empty when transactionAttributes is empty', () => {
            const mparticle = mParticle.getInstance()
            const productAction = {}
            mparticle._Ecommerce.convertTransactionAttributesToProductAction({}, productAction)
            Object.keys(productAction).length.should.equal(0);
        });

        it('should sanitize certain ecommerce amounts from strings to 0', () => {
            mParticle.getInstance()._Ecommerce.sanitizeAmount('$42', 'Price').should.equal(0);
            mParticle.getInstance()._Ecommerce.sanitizeAmount('$100', 'TotalAmount').should.equal(0);
            mParticle.getInstance()._Ecommerce.sanitizeAmount('first', 'Position').should.equal(0);
            mParticle.getInstance()._Ecommerce.sanitizeAmount('two', 'Quantity').should.equal(0);
            mParticle.getInstance()._Ecommerce.sanitizeAmount('string', 'Shipping').should.equal(0);
            mParticle.getInstance()._Ecommerce.sanitizeAmount('$5.80', 'Tax').should.equal(0);
        });

        it('should convert transactionAttributes strings to numbers or zero', () => {
            const mparticle = mParticle.getInstance()
            const transactionAttributes = {
                Id: "id",
                Affiliation: "affiliation",
                CouponCode: "couponCode",
                Revenue: "revenue",
                Shipping: "shipping",
                Tax: "tax"
            };

            const productAction = {};
            mparticle._Ecommerce.convertTransactionAttributesToProductAction(transactionAttributes, productAction)
            productAction.TransactionId.should.equal("id")
            productAction.Affiliation.should.equal("affiliation")
            productAction.CouponCode.should.equal("couponCode")

            // convert strings to 0 
            productAction.TotalAmount.should.equal(0)
            productAction.ShippingAmount.should.equal(0)
            productAction.TaxAmount.should.equal(0)
        });

        it('should allow a user to pass in a source_message_id to a commerce event', async () => {
            await waitForCondition(hasIdentifyReturned);
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
                {
                    sourceMessageId: 'foo-bar'
                }
            );

            const purchaseEvent1 = findEventFromRequest(fetchMock.calls(), 'purchase');
            purchaseEvent1.data.source_message_id.should.equal('foo-bar');
        });
    });
});