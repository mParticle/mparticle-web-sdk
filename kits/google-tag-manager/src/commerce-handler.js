var ProductActionTypes = {
    AddToCart: 10,
    Click: 14,
    Checkout: 12,
    CheckoutOption: 13,
    Impression: 22,
    Purchase: 16,
    Refund: 17,
    RemoveFromCart: 11,
    ViewDetail: 15
};

var PromotionType = {
    PromotionClick: 19,
    PromotionView: 18
};

function CommerceHandler(common) {
    this.common = common || {};
}
CommerceHandler.prototype.buildAddToCart = function(event) {
    return {
        event: event,
        eventType: 'commerce_event',
        eventPayload: {
            ecommerce: {
                currencyCode: event.CurrencyCode || 'USD',
                add: {
                    products: buildProductsList(event.ProductAction.ProductList)
                }
            }
        }
    };
};
CommerceHandler.prototype.buildCheckout = function(event) {
    return {
        event: event,
        eventType: 'commerce_event',
        eventPayload: {
            ecommerce: {
                checkout: {
                    actionField: {
                        step: event.ProductAction.CheckoutStep,
                        option: event.ProductAction.CheckoutOptions
                    },
                    products: buildProductsList(event.ProductAction.ProductList)
                }
            }
        }
    };
};
CommerceHandler.prototype.buildCheckoutOption = function(event) {
    return {
        event: event,
        eventType: 'commerce_event',
        eventPayload: {
            ecommerce: {
                checkout_option: {
                    actionField: {
                        step: event.ProductAction.CheckoutStep,
                        option: event.ProductAction.CheckoutOptions
                    },
                    products: buildProductsList(event.ProductAction.ProductList)
                }
            }
        }
    };
};
CommerceHandler.prototype.buildRemoveFromCart = function(event) {
    return {
        event: event,
        eventType: 'commerce_event',
        eventPayload: {
            ecommerce: {
                currencyCode: event.CurrencyCode || 'USD',
                remove: {
                    products: buildProductsList(event.ProductAction.ProductList)
                }
            }
        }
    };
};
CommerceHandler.prototype.buildImpression = function(event, impression) {
    return {
        event: event,
        eventType: 'commerce_event',
        eventPayload: {
            ecommerce: {
                currencyCode: event.CurrencyCode || 'USD',
                impressions: buildProductsList(impression.ProductList)
            }
        }
    };
};
CommerceHandler.prototype.buildProductClick = function(event) {
    var actionField = {};

    if (event.EventAttributes && event.EventAttributes.hasOwnProperty('list')) {
        actionField['list'] = event.EventAttributes.list;
    }

    return {
        event: event,
        eventType: 'commerce_event',
        eventPayload: {
            ecommerce: {
                click: {
                    actionField: actionField,
                    products: buildProductsList(event.ProductAction.ProductList)
                }
            }
        }
    };
};
CommerceHandler.prototype.buildProductViewDetail = function(event) {
    var actionField = {};

    if (event.EventAttributes && event.EventAttributes.hasOwnProperty('list')) {
        actionField['list'] = event.EventAttributes.list;
    }

    return {
        event: event,
        eventType: 'commerce_event',
        eventPayload: {
            ecommerce: {
                detail: {
                    actionField: actionField,
                    products: buildProductsList(event.ProductAction.ProductList)
                }
            }
        }
    };
};
CommerceHandler.prototype.buildPromoClick = function(event) {
    return {
        event: event,
        eventType: 'commerce_event',
        eventPayload: {
            ecommerce: {
                promoClick: {
                    promotions: buildPromoList(
                        event.PromotionAction.PromotionList
                    )
                }
            }
        }
    };
};
CommerceHandler.prototype.buildPromoView = function(event) {
    return {
        event: event,
        eventType: 'commerce_event',
        eventPayload: {
            ecommerce: {
                promoView: {
                    promotions: buildPromoList(
                        event.PromotionAction.PromotionList
                    )
                }
            }
        }
    };
};
CommerceHandler.prototype.buildPurchase = function(event) {
    var productAction = event.ProductAction;
    return {
        event: event,
        eventType: 'commerce_event',
        eventPayload: {
            ecommerce: {
                purchase: {
                    actionField: {
                        id: productAction.TransactionId || '',
                        affiliation: productAction.Affiliation || '',
                        revenue: productAction.TotalAmount || '',
                        tax: productAction.TaxAmount || '',
                        shipping: productAction.ShippingAmount || '',
                        coupon: productAction.CouponCode || ''
                    },
                    products: buildProductsList(productAction.ProductList)
                }
            }
        }
    };
};
CommerceHandler.prototype.buildRefund = function(event) {
    // Full refunds don't require a product list on the GTM side
    // Partial refunds would include the specific items being refunded
    return {
        event: event,
        eventType: 'commerce_event',
        eventPayload: {
            ecommerce: {
                refund: {
                    actionField: {
                        id: event.ProductAction.TransactionId || ''
                    },
                    products: buildProductsList(event.ProductAction.ProductList)
                }
            }
        }
    };
};
CommerceHandler.prototype.logCommerceEvent = function(event) {
    var self = this;

    switch (event.EventCategory) {
        case ProductActionTypes.AddToCart:
            var event = self.buildAddToCart(event);
            break;
        case ProductActionTypes.Checkout:
            var event = self.buildCheckout(event);
            break;
        case ProductActionTypes.CheckoutOption:
            var event = self.buildCheckoutOption(event);
            break;
        case ProductActionTypes.Click:
            var event = self.buildProductClick(event);
            break;
        case ProductActionTypes.Impression:
            try {
                event.ProductImpressions.forEach(function(impression) {
                    var impressionEvent = self.buildImpression(
                        event,
                        impression
                    );
                    self.common.send(impressionEvent);
                });
            } catch (error) {
                console.log('error logging impressions', error);
                return false;
            }
            return true;
        case ProductActionTypes.Purchase:
            var event = self.buildPurchase(event);
            break;
        case ProductActionTypes.Refund:
            var event = self.buildRefund(event);
            break;
        case ProductActionTypes.RemoveFromCart:
            var event = self.buildRemoveFromCart(event);
            break;
        case ProductActionTypes.ViewDetail:
            var event = self.buildProductViewDetail(event);
            break;
        case PromotionType.PromotionClick:
            var event = self.buildPromoClick(event);
            break;
        case PromotionType.PromotionView:
            var event = self.buildPromoView(event);
            break;
        default:
            console.error('Unknown Commerce Type', event);
            return false;
    }

    self.common.send(event);
    return true;
};

// Utility function
function toUnderscore(string) {
    return string.split(/(?=[A-Z])/).join('_').toLowerCase();
};

function parseProduct(_product) {
    var product = {};

    for(var key in _product) {
        if (key === 'Sku') {
            product.id = _product.Sku;
        } else {
            product[toUnderscore(key)] = _product[key];
        }
    }

    return product;
}

function parsePromotion(_promotion) {
    var promotion = {};

    for (var key in _promotion) {
        promotion[toUnderscore(key)] = _promotion[key];
    }

    return promotion;
}

function buildProductsList(products) {
    var productsList = [];

    products.forEach(function(product) {
        productsList.push(parseProduct(product));
    });

    return productsList;
}

function buildPromoList(promotions) {
    var promotionsList = [];

    promotions.forEach(function(promotion) {
        promotionsList.push(parsePromotion(promotion));
    });

    return promotionsList;
}

module.exports = CommerceHandler;
