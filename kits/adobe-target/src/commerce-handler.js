function CommerceHandler(common) {
    this.common = common || {};
}

CommerceHandler.prototype.logCommerceEvent = function(event) {
    var MBOXNAME = event.CustomFlags['ADOBETARGET.MBOX'];
    var price = event.ProductAction.TotalAmount || 0;
    var productSkus = [];

    if (!MBOXNAME) {
        console.warn(
            'ADOBE.MBOX not passed as custom flag; not forwarding to Adobe Target'
        );
        return;
    }

    if (event.ProductAction && event.ProductAction.ProductList.length) {
        event.ProductAction.ProductList.forEach(function(product) {
            if (product.Sku) {
                productSkus.push(product.Sku);
            }
        });

        switch (event.EventCategory) {
            case mParticle.CommerceEventType.ProductPurchase:
                window.adobe.target.trackEvent({
                    mbox: MBOXNAME,
                    params: {
                        orderId: event.ProductAction.TransactionId,
                        orderTotal: price,
                        productPurchasedId: productSkus.join(', '),
                    },
                });
                break;
            default:
                console.warn(
                    'Only product purchases are mapped to Adobe Target. Event not forwarded.'
                );
        }
    }

    /*
        Sample ecommerce event schema:
        {
            CurrencyCode: 'USD',
            DeviceId:'a80eea1c-57f5-4f84-815e-06fe971b6ef2', // MP generated
            EventAttributes: { key1: 'value1', key2: 'value2' },
            EventType: 16,
            EventCategory: 10, // (This is an add product to cart event, see below for additional ecommerce EventCategories)
            EventName: "eCommerce - AddToCart",
            MPID: "8278431810143183490",
            ProductAction: {
                Affiliation: 'aff1',
                CouponCode: 'coupon',
                ProductActionType: 7,
                ProductList: [
                    {
                        Attributes: { prodKey1: 'prodValue1', prodKey2: 'prodValue2' },
                        Brand: 'Apple',
                        Category: 'phones',
                        CouponCode: 'coupon1',
                        Name: 'iPhone',
                        Price: '600',
                        Quantity: 2,
                        Sku: "SKU123",
                        TotalAmount: 1200,
                        Variant: '64GB'
                    }
                ],
                TransactionId: "tid1",
                ShippingAmount: 10,
                TaxAmount: 5,
                TotalAmount: 1215,
            },
            UserAttributes: { userKey1: 'userValue1', userKey2: 'userValue2' }
            UserIdentities: [
                {
                    Identity: 'test@gmail.com', Type: 7
                }
            ]
        }

        If your SDK has specific ways to log different eCommerce events, see below for
        mParticle's additional ecommerce EventCategory types:

            10: ProductAddToCart, (as shown above)
            11: ProductRemoveFromCart,
            12: ProductCheckout,
            13: ProductCheckoutOption,
            14: ProductClick,
            15: ProductViewDetail,
            16: ProductPurchase,
            17: ProductRefund,
            18: PromotionView,
            19: PromotionClick,
            20: ProductAddToWishlist,
            21: ProductRemoveFromWishlist,
            22: ProductImpression
        */
};

module.exports = CommerceHandler;
