import Types from './types';
import Constants from './constants';

var Messages = Constants.Messages;

export default function Ecommerce(mpInstance) {
    var self = this;
    this.convertTransactionAttributesToProductAction = function(
        transactionAttributes,
        productAction
    ) {
        productAction.TransactionId = transactionAttributes.Id;
        productAction.Affiliation = transactionAttributes.Affiliation;
        productAction.CouponCode = transactionAttributes.CouponCode;
        productAction.TotalAmount = transactionAttributes.Revenue;
        productAction.ShippingAmount = transactionAttributes.Shipping;
        productAction.TaxAmount = transactionAttributes.Tax;
    };

    this.getProductActionEventName = function(productActionType) {
        switch (productActionType) {
            case Types.ProductActionType.AddToCart:
                return 'AddToCart';
            case Types.ProductActionType.AddToWishlist:
                return 'AddToWishlist';
            case Types.ProductActionType.Checkout:
                return 'Checkout';
            case Types.ProductActionType.CheckoutOption:
                return 'CheckoutOption';
            case Types.ProductActionType.Click:
                return 'Click';
            case Types.ProductActionType.Purchase:
                return 'Purchase';
            case Types.ProductActionType.Refund:
                return 'Refund';
            case Types.ProductActionType.RemoveFromCart:
                return 'RemoveFromCart';
            case Types.ProductActionType.RemoveFromWishlist:
                return 'RemoveFromWishlist';
            case Types.ProductActionType.ViewDetail:
                return 'ViewDetail';
            case Types.ProductActionType.Unknown:
            default:
                return 'Unknown';
        }
    };

    this.getPromotionActionEventName = function(promotionActionType) {
        switch (promotionActionType) {
            case Types.PromotionActionType.PromotionClick:
                return 'PromotionClick';
            case Types.PromotionActionType.PromotionView:
                return 'PromotionView';
            default:
                return 'Unknown';
        }
    };

    this.convertProductActionToEventType = function(productActionType) {
        switch (productActionType) {
            case Types.ProductActionType.AddToCart:
                return Types.CommerceEventType.ProductAddToCart;
            case Types.ProductActionType.AddToWishlist:
                return Types.CommerceEventType.ProductAddToWishlist;
            case Types.ProductActionType.Checkout:
                return Types.CommerceEventType.ProductCheckout;
            case Types.ProductActionType.CheckoutOption:
                return Types.CommerceEventType.ProductCheckoutOption;
            case Types.ProductActionType.Click:
                return Types.CommerceEventType.ProductClick;
            case Types.ProductActionType.Purchase:
                return Types.CommerceEventType.ProductPurchase;
            case Types.ProductActionType.Refund:
                return Types.CommerceEventType.ProductRefund;
            case Types.ProductActionType.RemoveFromCart:
                return Types.CommerceEventType.ProductRemoveFromCart;
            case Types.ProductActionType.RemoveFromWishlist:
                return Types.CommerceEventType.ProductRemoveFromWishlist;
            case Types.ProductActionType.Unknown:
                return Types.EventType.Unknown;
            case Types.ProductActionType.ViewDetail:
                return Types.CommerceEventType.ProductViewDetail;
            default:
                mpInstance.Logger.error(
                    'Could not convert product action type ' +
                        productActionType +
                        ' to event type'
                );
                return null;
        }
    };

    this.convertPromotionActionToEventType = function(promotionActionType) {
        switch (promotionActionType) {
            case Types.PromotionActionType.PromotionClick:
                return Types.CommerceEventType.PromotionClick;
            case Types.PromotionActionType.PromotionView:
                return Types.CommerceEventType.PromotionView;
            default:
                mpInstance.Logger.error(
                    'Could not convert promotion action type ' +
                        promotionActionType +
                        ' to event type'
                );
                return null;
        }
    };

    this.generateExpandedEcommerceName = function(eventName, plusOne) {
        return (
            'eCommerce - ' + eventName + ' - ' + (plusOne ? 'Total' : 'Item')
        );
    };

    this.extractProductAttributes = function(attributes, product) {
        if (product.CouponCode) {
            attributes['Coupon Code'] = product.CouponCode;
        }
        if (product.Brand) {
            attributes['Brand'] = product.Brand;
        }
        if (product.Category) {
            attributes['Category'] = product.Category;
        }
        if (product.Name) {
            attributes['Name'] = product.Name;
        }
        if (product.Sku) {
            attributes['Id'] = product.Sku;
        }
        if (product.Price) {
            attributes['Item Price'] = product.Price;
        }
        if (product.Quantity) {
            attributes['Quantity'] = product.Quantity;
        }
        if (product.Position) {
            attributes['Position'] = product.Position;
        }
        if (product.Variant) {
            attributes['Variant'] = product.Variant;
        }
        attributes['Total Product Amount'] = product.TotalAmount || 0;
    };

    this.extractTransactionId = function(attributes, productAction) {
        if (productAction.TransactionId) {
            attributes['Transaction Id'] = productAction.TransactionId;
        }
    };

    this.extractActionAttributes = function(attributes, productAction) {
        self.extractTransactionId(attributes, productAction);

        if (productAction.Affiliation) {
            attributes['Affiliation'] = productAction.Affiliation;
        }

        if (productAction.CouponCode) {
            attributes['Coupon Code'] = productAction.CouponCode;
        }

        if (productAction.TotalAmount) {
            attributes['Total Amount'] = productAction.TotalAmount;
        }

        if (productAction.ShippingAmount) {
            attributes['Shipping Amount'] = productAction.ShippingAmount;
        }

        if (productAction.TaxAmount) {
            attributes['Tax Amount'] = productAction.TaxAmount;
        }

        if (productAction.CheckoutOptions) {
            attributes['Checkout Options'] = productAction.CheckoutOptions;
        }

        if (productAction.CheckoutStep) {
            attributes['Checkout Step'] = productAction.CheckoutStep;
        }
    };

    this.extractPromotionAttributes = function(attributes, promotion) {
        if (promotion.Id) {
            attributes['Id'] = promotion.Id;
        }

        if (promotion.Creative) {
            attributes['Creative'] = promotion.Creative;
        }

        if (promotion.Name) {
            attributes['Name'] = promotion.Name;
        }

        if (promotion.Position) {
            attributes['Position'] = promotion.Position;
        }
    };

    this.buildProductList = function(event, product) {
        if (product) {
            if (Array.isArray(product)) {
                return product;
            }

            return [product];
        }

        return event.ShoppingCart.ProductList;
    };

    this.createProduct = function(
        name,
        sku,
        price,
        quantity,
        variant,
        category,
        brand,
        position,
        couponCode,
        attributes
    ) {
        attributes = mpInstance._Helpers.sanitizeAttributes(attributes);

        if (typeof name !== 'string') {
            mpInstance.Logger.error('Name is required when creating a product');
            return null;
        }

        if (!mpInstance._Helpers.Validators.isStringOrNumber(sku)) {
            mpInstance.Logger.error(
                'SKU is required when creating a product, and must be a string or a number'
            );
            return null;
        }

        if (!mpInstance._Helpers.Validators.isStringOrNumber(price)) {
            mpInstance.Logger.error(
                'Price is required when creating a product, and must be a string or a number'
            );
            return null;
        }

        if (position && !mpInstance._Helpers.Validators.isNumber(position)) {
            mpInstance.Logger.error(
                'Position must be a number, it will be set to null.'
            );
            position = null;
        }

        if (!quantity) {
            quantity = 1;
        }

        return {
            Name: name,
            Sku: sku,
            Price: price,
            Quantity: quantity,
            Brand: brand,
            Variant: variant,
            Category: category,
            Position: position,
            CouponCode: couponCode,
            TotalAmount: quantity * price,
            Attributes: attributes,
        };
    };

    this.createPromotion = function(id, creative, name, position) {
        if (!mpInstance._Helpers.Validators.isStringOrNumber(id)) {
            mpInstance.Logger.error(Messages.ErrorMessages.PromotionIdRequired);
            return null;
        }

        return {
            Id: id,
            Creative: creative,
            Name: name,
            Position: position,
        };
    };

    this.createImpression = function(name, product) {
        if (typeof name !== 'string') {
            mpInstance.Logger.error(
                'Name is required when creating an impression.'
            );
            return null;
        }

        if (!product) {
            mpInstance.Logger.error(
                'Product is required when creating an impression.'
            );
            return null;
        }

        return {
            Name: name,
            Product: product,
        };
    };

    this.createTransactionAttributes = function(
        id,
        affiliation,
        couponCode,
        revenue,
        shipping,
        tax
    ) {
        if (!mpInstance._Helpers.Validators.isStringOrNumber(id)) {
            mpInstance.Logger.error(
                Messages.ErrorMessages.TransactionIdRequired
            );
            return null;
        }

        return {
            Id: id,
            Affiliation: affiliation,
            CouponCode: couponCode,
            Revenue: revenue,
            Shipping: shipping,
            Tax: tax,
        };
    };

    this.expandProductImpression = function(commerceEvent) {
        var appEvents = [];
        if (!commerceEvent.ProductImpressions) {
            return appEvents;
        }
        commerceEvent.ProductImpressions.forEach(function(productImpression) {
            if (productImpression.ProductList) {
                productImpression.ProductList.forEach(function(product) {
                    var attributes = mpInstance._Helpers.extend(
                        false,
                        {},
                        commerceEvent.EventAttributes
                    );
                    if (product.Attributes) {
                        for (var attribute in product.Attributes) {
                            attributes[attribute] =
                                product.Attributes[attribute];
                        }
                    }
                    self.extractProductAttributes(attributes, product);
                    if (productImpression.ProductImpressionList) {
                        attributes['Product Impression List'] =
                            productImpression.ProductImpressionList;
                    }
                    var appEvent = mpInstance._ServerModel.createEventObject({
                        messageType: Types.MessageType.PageEvent,
                        name: self.generateExpandedEcommerceName('Impression'),
                        data: attributes,
                        eventType: Types.EventType.Transaction,
                    });
                    appEvents.push(appEvent);
                });
            }
        });

        return appEvents;
    };

    this.expandCommerceEvent = function(event) {
        if (!event) {
            return null;
        }
        return self
            .expandProductAction(event)
            .concat(self.expandPromotionAction(event))
            .concat(self.expandProductImpression(event));
    };

    this.expandPromotionAction = function(commerceEvent) {
        var appEvents = [];
        if (!commerceEvent.PromotionAction) {
            return appEvents;
        }
        var promotions = commerceEvent.PromotionAction.PromotionList;
        promotions.forEach(function(promotion) {
            var attributes = mpInstance._Helpers.extend(
                false,
                {},
                commerceEvent.EventAttributes
            );
            self.extractPromotionAttributes(attributes, promotion);

            var appEvent = mpInstance._ServerModel.createEventObject({
                messageType: Types.MessageType.PageEvent,
                name: self.generateExpandedEcommerceName(
                    Types.PromotionActionType.getExpansionName(
                        commerceEvent.PromotionAction.PromotionActionType
                    )
                ),
                data: attributes,
                eventType: Types.EventType.Transaction,
            });
            appEvents.push(appEvent);
        });
        return appEvents;
    };

    this.expandProductAction = function(commerceEvent) {
        var appEvents = [];
        if (!commerceEvent.ProductAction) {
            return appEvents;
        }
        var shouldExtractActionAttributes = false;
        if (
            commerceEvent.ProductAction.ProductActionType ===
                Types.ProductActionType.Purchase ||
            commerceEvent.ProductAction.ProductActionType ===
                Types.ProductActionType.Refund
        ) {
            var attributes = mpInstance._Helpers.extend(
                false,
                {},
                commerceEvent.EventAttributes
            );
            attributes['Product Count'] = commerceEvent.ProductAction
                .ProductList
                ? commerceEvent.ProductAction.ProductList.length
                : 0;
            self.extractActionAttributes(
                attributes,
                commerceEvent.ProductAction
            );
            if (commerceEvent.CurrencyCode) {
                attributes['Currency Code'] = commerceEvent.CurrencyCode;
            }
            var plusOneEvent = mpInstance._ServerModel.createEventObject({
                messageType: Types.MessageType.PageEvent,
                name: self.generateExpandedEcommerceName(
                    Types.ProductActionType.getExpansionName(
                        commerceEvent.ProductAction.ProductActionType
                    ),
                    true
                ),
                data: attributes,
                eventType: Types.EventType.Transaction,
            });
            appEvents.push(plusOneEvent);
        } else {
            shouldExtractActionAttributes = true;
        }

        var products = commerceEvent.ProductAction.ProductList;

        if (!products) {
            return appEvents;
        }

        products.forEach(function(product) {
            var attributes = mpInstance._Helpers.extend(
                false,
                commerceEvent.EventAttributes,
                product.Attributes
            );
            if (shouldExtractActionAttributes) {
                self.extractActionAttributes(
                    attributes,
                    commerceEvent.ProductAction
                );
            } else {
                self.extractTransactionId(
                    attributes,
                    commerceEvent.ProductAction
                );
            }
            self.extractProductAttributes(attributes, product);

            var productEvent = mpInstance._ServerModel.createEventObject({
                messageType: Types.MessageType.PageEvent,
                name: self.generateExpandedEcommerceName(
                    Types.ProductActionType.getExpansionName(
                        commerceEvent.ProductAction.ProductActionType
                    )
                ),
                data: attributes,
                eventType: Types.EventType.Transaction,
            });
            appEvents.push(productEvent);
        });

        return appEvents;
    };

    this.createCommerceEventObject = function(customFlags) {
        var baseEvent;

        mpInstance.Logger.verbose(
            Messages.InformationMessages.StartingLogCommerceEvent
        );

        if (mpInstance._Helpers.canLog()) {
            baseEvent = mpInstance._ServerModel.createEventObject({
                messageType: Types.MessageType.Commerce,
            });
            baseEvent.EventName = 'eCommerce - ';

            baseEvent.CurrencyCode = mpInstance._Store.currencyCode;
            baseEvent.ShoppingCart = [];
            baseEvent.CustomFlags = customFlags;

            return baseEvent;
        } else {
            mpInstance.Logger.verbose(
                Messages.InformationMessages.AbandonLogEvent
            );
        }

        return null;
    };
}
