var self = this;
function CommerceHandler(common) {
    self.common = this.common = common || {};
}

var ProductActionTypes = {
    Unknown: 0,
    AddToCart: 10,
    Click: 14,
    Checkout: 12,
    CheckoutOption: 13,
    Impression: 22,
    Purchase: 16,
    Refund: 17,
    RemoveFromCart: 11,
    ViewDetail: 15,
    AddToWishlist: 20,
};

var PromotionActionTypes = {
    PromotionClick: 19,
    PromotionView: 18,
};

// Custom Flags
var GA4_COMMERCE_EVENT_TYPE = 'GA4.CommerceEventType',
    GA4_SHIPPING_TIER = 'GA4.ShippingTier',
    GA4_PAYMENT_TYPE = 'GA4.PaymentType';

var ADD_SHIPPING_INFO = 'add_shipping_info',
    ADD_PAYMENT_INFO = 'add_payment_info',
    VIEW_CART = 'view_cart';

CommerceHandler.prototype.logCommerceEvent = function(event) {
    var needsCurrency = true,
        needsValue = true,
        ga4CommerceEventParameters = {},
        isViewCartEvent = false,
        customEventAttributes = event.EventAttributes || {},
        // affiliation potentially lives on any commerce event with items
        affiliation =
            event && event.ProductAction
                ? event.ProductAction.Affiliation
                : null;

    // GA4 has a view_cart event which MP does not support via a ProductActionType
    // In order to log a view_cart event, pass ProductActionType.Unknown along with
    // the proper custom flag
    // Unknown ProductActionTypes without a custom flag will reach the switch statement
    // below and throw an error to the customer
    if (event.EventCategory === ProductActionTypes.Unknown) {
        if (
            event.CustomFlags &&
            event.CustomFlags[GA4_COMMERCE_EVENT_TYPE] === VIEW_CART
        ) {
            isViewCartEvent = true;
            return this.logViewCart(event, affiliation);
        }
    }
    // Handle Impressions
    if (event.EventCategory === ProductActionTypes.Impression) {
        return this.logImpressionEvent(event, affiliation);
        // Handle Promotions
    } else if (
        event.EventCategory === PromotionActionTypes.PromotionClick ||
        event.EventCategory === PromotionActionTypes.PromotionView
    ) {
        return this.logPromotionEvent(event);
    }

    switch (event.EventCategory) {
        case ProductActionTypes.AddToCart:
        case ProductActionTypes.RemoveFromCart:
            ga4CommerceEventParameters = buildAddOrRemoveCartItem(
                event,
                affiliation
            );
            break;
        case ProductActionTypes.Checkout:
            ga4CommerceEventParameters = buildCheckout(event, affiliation);
            break;
        case ProductActionTypes.Click:
            ga4CommerceEventParameters = buildSelectItem(event, affiliation);

            needsCurrency = false;
            needsValue = false;
            break;
        case ProductActionTypes.Purchase:
            ga4CommerceEventParameters = buildPurchase(event, affiliation);
            break;
        case ProductActionTypes.Refund:
            ga4CommerceEventParameters = buildRefund(event, affiliation);
            break;
        case ProductActionTypes.ViewDetail:
            ga4CommerceEventParameters = buildViewItem(event, affiliation);
            break;
        case ProductActionTypes.AddToWishlist:
            ga4CommerceEventParameters = buildAddToWishlist(event, affiliation);
            break;

        case ProductActionTypes.CheckoutOption:
            return this.logCheckoutOptionEvent(event, affiliation);

        default:
            // a view cart event is handled at the beginning of this function
            if (!isViewCartEvent) {
                console.error(
                    'Unsupported Commerce Event. Event not sent.',
                    event
                );
                return false;
            }
    }

    // TODO: https://mparticle-eng.atlassian.net/browse/SQDSDKS-5714
    if (this.common.forwarderSettings.enableDataCleansing) {
        customEventAttributes = this.common.standardizeParameters(
            customEventAttributes
        );
    }

    ga4CommerceEventParameters = this.common.mergeObjects(
        ga4CommerceEventParameters,
        this.common.limitEventAttributes(customEventAttributes)
    );

    // CheckoutOption, Promotions, and Impressions will not make it to this code
    if (needsCurrency) {
        ga4CommerceEventParameters.currency = event.CurrencyCode;
    }

    if (needsValue) {
        ga4CommerceEventParameters.value =
            (event.CustomFlags && event.CustomFlags['GA4.Value']) ||
            event.ProductAction.TotalAmount ||
            null;
    }

    return this.sendCommerceEventToGA4(
        mapGA4EcommerceEventName(event),
        ga4CommerceEventParameters
    );
};

CommerceHandler.prototype.sendCommerceEventToGA4 = function(
    eventName,
    eventAttributes
) {
    if (this.common.forwarderSettings.measurementId) {
        eventAttributes.send_to = this.common.forwarderSettings.measurementId;
    }

    gtag('event', eventName, eventAttributes);

    return true;
};

// Google previously had a CheckoutOption event, and now this has been split into 2 GA4 events - add_shipping_info and add_payment_info
// Since MP still uses CheckoutOption, we must map this to the 2 events using custom flags.  To prevent any data loss from customers
// migrating from UA to GA4, we will set a default `set_checkout_option` which matches Firebase's data model.
CommerceHandler.prototype.logCheckoutOptionEvent = function(
    event,
    affiliation
) {
    try {
        var customFlags = event.CustomFlags,
            GA4CommerceEventType = customFlags[GA4_COMMERCE_EVENT_TYPE],
            ga4CommerceEventParameters;

        // if no custom flags exist or there is no GA4CommerceEventType, the user has not updated their code from using legacy GA which still supports checkout_option
        if (!customFlags || !GA4CommerceEventType) {
            console.error(
                'Your checkout option event for the Google Analytics 4 integration is missing a custom flag for "GA4.CommerceEventType". The event was sent using the deprecated set_checkout_option event.  Review mParticle docs for GA4 for the custom flags to add.'
            );
        }

        switch (GA4CommerceEventType) {
            case ADD_SHIPPING_INFO:
                ga4CommerceEventParameters = buildAddShippingInfo(
                    event,
                    affiliation
                );
                break;
            case ADD_PAYMENT_INFO:
                ga4CommerceEventParameters = buildAddPaymentInfo(
                    event,
                    affiliation
                );
                break;
            default:
                ga4CommerceEventParameters = buildCheckoutOptions(
                    event,
                    affiliation
                );
                break;
        }
    } catch (error) {
        console.error(
            'There is an issue with the custom flags in your CheckoutOption event. The event was not sent.  Plrease review the docs and fix.',
            error
        );
        return false;
    }

    ga4CommerceEventParameters = this.common.mergeObjects(
        ga4CommerceEventParameters,
        this.common.limitEventAttributes(event.EventAttributes)
    );

    return this.sendCommerceEventToGA4(
        mapGA4EcommerceEventName(event),
        ga4CommerceEventParameters
    );
};

CommerceHandler.prototype.logPromotionEvent = function(event) {
    var self = this;
    try {
        var ga4CommerceEventParameters;
        event.PromotionAction.PromotionList.forEach(function(promotion) {
            ga4CommerceEventParameters = buildPromotion(promotion);

            ga4CommerceEventParameters = self.common.mergeObjects(
                ga4CommerceEventParameters,
                self.common.limitEventAttributes(event.EventAttributes)
            );

            self.sendCommerceEventToGA4(
                mapGA4EcommerceEventName(event),
                ga4CommerceEventParameters
            );
        });

        return true;
    } catch (error) {
        console.error(
            'Error logging Promotions to GA4. Promotions not logged.',
            error
        );
        return false;
    }
};

CommerceHandler.prototype.logImpressionEvent = function(event, affiliation) {
    var self = this;
    try {
        var ga4CommerceEventParameters;
        event.ProductImpressions.forEach(function(impression) {
            ga4CommerceEventParameters = parseImpression(
                impression,
                affiliation
            );

            ga4CommerceEventParameters = self.common.mergeObjects(
                ga4CommerceEventParameters,
                self.common.limitEventAttributes(event.EventAttributes)
            );

            self.sendCommerceEventToGA4(
                mapGA4EcommerceEventName(event),
                ga4CommerceEventParameters
            );
        });

        return true;
    } catch (error) {
        console.log(
            'Error logging Impressions to GA4. Impressions not logged',
            error
        );
        return false;
    }
};

CommerceHandler.prototype.logViewCart = function(event, affiliation) {
    var ga4CommerceEventParameters = buildViewCart(event, affiliation);
    ga4CommerceEventParameters = this.common.mergeObjects(
        ga4CommerceEventParameters,
        this.common.limitEventAttributes(event.EventAttributes)
    );
    ga4CommerceEventParameters.currency = event.CurrencyCode;

    ga4CommerceEventParameters.value =
        (event.CustomFlags && event.CustomFlags['GA4.Value']) ||
        event.ProductAction.TotalAmount ||
        null;

    return this.sendCommerceEventToGA4(
        mapGA4EcommerceEventName(event),
        ga4CommerceEventParameters
    );
};

function buildAddOrRemoveCartItem(event, affiliation) {
    return {
        items: buildProductsList(event.ProductAction.ProductList, affiliation),
    };
}

function buildCheckout(event, affiliation) {
    return {
        items: buildProductsList(event.ProductAction.ProductList, affiliation),
        coupon: event.ProductAction ? event.ProductAction.CouponCode : null,
    };
}

function buildCheckoutOptions(event, affiliation) {
    var parameters = event.EventAttributes;
    parameters.items = buildProductsList(
        event.ProductAction.ProductList,
        affiliation
    );
    parameters.coupon = event.ProductAction
        ? event.ProductAction.CouponCode
        : null;

    return parameters;
}

function parseImpression(impression, affiliation) {
    return {
        item_list_id: impression.ProductImpressionList,
        item_list_name: impression.ProductImpressionList,
        items: buildProductsList(impression.ProductList, affiliation),
    };
}

function buildSelectItem(event, affiliation) {
    return {
        items: buildProductsList(event.ProductAction.ProductList, affiliation),
    };
}

function buildViewItem(event, affiliation) {
    return {
        items: buildProductsList(event.ProductAction.ProductList, affiliation),
    };
}

function buildPromotion(promotion) {
    return parsePromotion(promotion);
}

function buildPurchase(event, affiliation) {
    return {
        transaction_id: event.ProductAction.TransactionId,
        value: event.ProductAction.TotalAmount,
        coupon: event.ProductAction.CouponCode,
        shipping: event.ProductAction.ShippingAmount,
        tax: event.ProductAction.TaxAmount,
        items: buildProductsList(event.ProductAction.ProductList, affiliation),
    };
}
function buildRefund(event, affiliation) {
    return {
        transaction_id: event.ProductAction.TransactionId,
        value: event.ProductAction.TotalAmount,
        coupon: event.ProductAction.CouponCode,
        shipping: event.ProductAction.ShippingAmount,
        tax: event.ProductAction.TaxAmount,
        items: buildProductsList(event.ProductAction.ProductList, affiliation),
    };
}
function buildAddToWishlist(event, affiliation) {
    return {
        value: event.ProductAction.TotalAmount,
        items: buildProductsList(event.ProductAction.ProductList, affiliation),
    };
}

function buildAddShippingInfo(event, affiliation) {
    return {
        coupon:
            event.ProductAction && event.ProductAction.CouponCode
                ? event.ProductAction.CouponCode
                : null,
        shipping_tier:
            event.CustomFlags && event.CustomFlags[GA4_SHIPPING_TIER]
                ? event.CustomFlags[GA4_SHIPPING_TIER]
                : null,
        items: buildProductsList(event.ProductAction.ProductList, affiliation),
    };
}

function buildAddPaymentInfo(event, affiliation) {
    return {
        coupon:
            event.ProductAction && event.ProductAction.CouponCode
                ? event.ProductAction.CouponCode
                : null,
        payment_type:
            event.CustomFlags && event.CustomFlags[GA4_PAYMENT_TYPE]
                ? event.CustomFlags[GA4_PAYMENT_TYPE]
                : null,
        items: buildProductsList(event.ProductAction.ProductList, affiliation),
    };
}

// Utility function
function toUnderscore(string) {
    return string
        .split(/(?=[A-Z])/)
        .join('_')
        .toLowerCase();
}

function parseProduct(product, affiliation) {
    // 1. Move key/value pairs from product.Attributes to be at the same level
    // as all keys in product, limiting them to 10 in the process.

    var productWithAllAttributes = {};

    if (affiliation) {
        productWithAllAttributes.affiliation = affiliation;
    }

    productWithAllAttributes = self.common.mergeObjects(
        productWithAllAttributes,
        self.common.limitProductAttributes(product.Attributes)
    );

    // 2. Copy key/value pairs in product
    for (var key in product) {
        switch (key) {
            case 'Sku':
                productWithAllAttributes.item_id = product.Sku;
                break;
            case 'Name':
                productWithAllAttributes.item_name = product.Name;
                break;
            case 'Brand':
                productWithAllAttributes.item_brand = product.Brand;
                break;
            case 'Category':
                productWithAllAttributes.item_category = product.Category;
                break;
            case 'CouponCode':
                productWithAllAttributes.coupon = product.CouponCode;
                break;
            case 'Variant':
                productWithAllAttributes.item_variant = product.Variant;
                break;
            case 'Position':
                productWithAllAttributes.index = product.Position;
                break;
            case 'Attributes':
                break;
            default:
                productWithAllAttributes[toUnderscore(key)] = product[key];
        }
    }

    // TODO: https://mparticle-eng.atlassian.net/browse/SQDSDKS-5716
    if (self.common.forwarderSettings.enableDataCleansing) {
        return self.common.standardizeParameters(productWithAllAttributes);
    } else {
        return productWithAllAttributes;
    }
}

function parsePromotion(_promotion) {
    var promotion = {};

    for (var key in _promotion) {
        switch (key) {
            case 'Id':
                promotion.promotion_id = _promotion.Id;
                break;
            case 'Creative':
                promotion.creative_name = _promotion.Creative;
                break;
            case 'Name':
                promotion.promotion_name = _promotion.Name;
                break;
            case 'Position':
                promotion.creative_slot = _promotion.Position;
                break;
            default:
                promotion[toUnderscore(key)] = _promotion[key];
        }
    }

    if (self.common.forwarderSettings.enableDataCleansing) {
        return self.common.standardizeParameters(promotion);
    } else {
        return promotion;
    }
}

function buildProductsList(products, affiliation) {
    var productsList = [];

    products.forEach(function(product) {
        productsList.push(parseProduct(product, affiliation));
    });

    return productsList;
}

function mapGA4EcommerceEventName(event) {
    switch (event.EventCategory) {
        case ProductActionTypes.AddToCart:
            return 'add_to_cart';
        case ProductActionTypes.AddToWishlist:
            return 'add_to_wishlist';
        case ProductActionTypes.RemoveFromCart:
            return 'remove_from_cart';
        case ProductActionTypes.Purchase:
            return 'purchase';
        case ProductActionTypes.Checkout:
            return 'begin_checkout';
        case ProductActionTypes.CheckoutOption:
            return getCheckoutOptionEventName(event.CustomFlags);
        case ProductActionTypes.Click:
            return 'select_item';
        case ProductActionTypes.Impression:
            return 'view_item_list';
        case ProductActionTypes.Refund:
            return 'refund';
        case ProductActionTypes.ViewDetail:
            return 'view_item';
        case PromotionActionTypes.PromotionClick:
            return 'select_promotion';
        case PromotionActionTypes.PromotionView:
            return 'view_promotion';
        case ProductActionTypes.Unknown:
            if (
                event.CustomFlags &&
                event.CustomFlags[GA4_COMMERCE_EVENT_TYPE] === VIEW_CART
            ) {
                return 'view_cart';
            }
            break;
        default:
            console.error('Product Action Type not supported');
            return null;
    }
}

function getCheckoutOptionEventName(customFlags) {
    switch (customFlags[GA4_COMMERCE_EVENT_TYPE]) {
        case ADD_SHIPPING_INFO:
            return ADD_SHIPPING_INFO;
        case ADD_PAYMENT_INFO:
            return ADD_PAYMENT_INFO;
        default:
            return 'set_checkout_option';
    }
}

function buildViewCart(event, affiliation) {
    return {
        items: buildProductsList(event.ProductAction.ProductList, affiliation),
    };
}

module.exports = CommerceHandler;
