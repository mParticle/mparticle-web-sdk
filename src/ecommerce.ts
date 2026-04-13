import Types from './types';
import Constants from './constants';
import { extend } from './utils';
import { IECommerce } from './ecommerce.interfaces';
import { IMParticleWebSDKInstance } from './mp-instance';
import {
    ProductAction,
    Product,
    Promotion,
    CommerceEvent,
} from '@mparticle/event-models';
import {
    SDKEventAttrs,
    SDKEventOptions,
    TransactionAttributes,
} from '@mparticle/web-sdk';
import {
    SDKEvent,
    SDKEventCustomFlags,
    SDKProduct,
    SDKProductAction,
    SDKProductImpression,
    SDKPromotion,
    SDKShoppingCart,
} from './sdkRuntimeModels';
import { valueof } from './utils';
import { ProductActionType, PromotionActionType } from './types';

const Messages = Constants.Messages;

export default function Ecommerce(
    this: IECommerce,
    mpInstance: IMParticleWebSDKInstance
): void {
    const self = this;
    const _self = self as { [K in keyof IECommerce]: Function };

    // https://go.mparticle.com/work/SQDSDKS-4801
    _self.convertTransactionAttributesToProductAction = function(
        this: IECommerce,
        transactionAttributes: TransactionAttributes & { Step?: number; Option?: string },
        productAction: ProductAction & SDKProductAction
    ): void {
        if (transactionAttributes.hasOwnProperty('Id')) {
            productAction.TransactionId = transactionAttributes.Id as string;
        }
        if (transactionAttributes.hasOwnProperty('Affiliation')) {
            productAction.Affiliation = transactionAttributes.Affiliation;
        }
        if (transactionAttributes.hasOwnProperty('CouponCode')) {
            productAction.CouponCode = transactionAttributes.CouponCode;
        }
        if (transactionAttributes.hasOwnProperty('Revenue')) {
            productAction.TotalAmount = this.sanitizeAmount(
                transactionAttributes.Revenue as number,
                'Revenue'
            );
        }
        if (transactionAttributes.hasOwnProperty('Shipping')) {
            productAction.ShippingAmount = this.sanitizeAmount(
                transactionAttributes.Shipping as string,
                'Shipping'
            );
        }
        if (transactionAttributes.hasOwnProperty('Tax')) {
            productAction.TaxAmount = this.sanitizeAmount(
                transactionAttributes.Tax as number,
                'Tax'
            );
        }
        if (transactionAttributes.hasOwnProperty('Step')) {
            productAction.CheckoutStep = transactionAttributes.Step;
        }
        if (transactionAttributes.hasOwnProperty('Option')) {
            productAction.CheckoutOptions = transactionAttributes.Option;
        }
    };

    this.getProductActionEventName = function(
        productActionType: valueof<typeof ProductActionType>
    ): string {
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

    this.getPromotionActionEventName = function(
        promotionActionType: valueof<typeof PromotionActionType>
    ): string {
        switch (promotionActionType) {
            case Types.PromotionActionType.PromotionClick:
                return 'PromotionClick';
            case Types.PromotionActionType.PromotionView:
                return 'PromotionView';
            default:
                return 'Unknown';
        }
    };

    _self.convertProductActionToEventType = function(
        productActionType: valueof<typeof ProductActionType>
    ): number | null {
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

            // https://go.mparticle.com/work/SQDSDKS-4801
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

    _self.convertPromotionActionToEventType = function(
        promotionActionType: valueof<typeof PromotionActionType>
    ): number | null {
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

    this.generateExpandedEcommerceName = function(
        eventName: string,
        plusOne: boolean
    ): string {
        return (
            'eCommerce - ' + eventName + ' - ' + (plusOne ? 'Total' : 'Item')
        );
    };

    // https://go.mparticle.com/work/SQDSDKS-4801
    _self.extractProductAttributes = function(
        attributes: Record<string, string | number>,
        product: Product & SDKProduct
    ): void {
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

    // https://go.mparticle.com/work/SQDSDKS-4801
    _self.extractTransactionId = function(
        attributes: Record<string, string | number>,
        productAction: ProductAction & SDKProductAction
    ): void {
        if (productAction.TransactionId) {
            attributes['Transaction Id'] = productAction.TransactionId;
        }
    };

    // https://go.mparticle.com/work/SQDSDKS-4801
    _self.extractActionAttributes = function(
        attributes: Record<string, string | number>,
        productAction: ProductAction & SDKProductAction
    ): void {
        (self.extractTransactionId as Function)(attributes, productAction);

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

    // https://go.mparticle.com/work/SQDSDKS-4801
    _self.extractPromotionAttributes = function(
        attributes: Record<string, string | number>,
        promotion: Promotion & SDKPromotion
    ): void {
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

    _self.buildProductList = function(
        event: SDKEvent,
        product: (Product & SDKProduct) | (Product & SDKProduct)[]
    ): (Product & SDKProduct)[] {
        if (product) {
            if (Array.isArray(product)) {
                return product;
            }

            return [product];
        }

        return event.ShoppingCart.ProductList as (Product & SDKProduct)[];
    };

    this.createProduct = function(
        name: string,
        sku: string | number,
        price: string | number,
        quantity?: string | number,
        variant?: string,
        category?: string,
        brand?: string,
        position?: number,
        couponCode?: string,
        attributes?: SDKEventAttrs
    ): SDKProduct | null {
        attributes = mpInstance._Helpers.sanitizeAttributes(attributes, name);

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
        } else {
            price = mpInstance._Helpers.parseNumber(price);
        }

        if (position && !mpInstance._Helpers.Validators.isNumber(position)) {
            mpInstance.Logger.error(
                'Position must be a number, it will be set to null.'
            );
            position = null;
        }

        if (!mpInstance._Helpers.Validators.isStringOrNumber(quantity)) {
            quantity = 1;
        } else {
            quantity = mpInstance._Helpers.parseNumber(quantity);
        }

        return {
            Name: name,
            Sku: sku as string,
            Price: price as number,
            Quantity: quantity as number,
            Brand: brand,
            Variant: variant,
            Category: category,
            Position: position,
            CouponCode: couponCode,
            TotalAmount: (quantity as number) * (price as number),
            Attributes: attributes,
        };
    };

    _self.createPromotion = function(
        id: string | number,
        creative?: string,
        name?: string,
        position?: number
    ) {
        if (!mpInstance._Helpers.Validators.isStringOrNumber(id)) {
            mpInstance.Logger.error(Messages.ErrorMessages.PromotionIdRequired);
            return null;
        }

        return {
            Id: id as string,
            Creative: creative,
            Name: name,
            Position: position,
        };
    };

    _self.createImpression = function(
        name: string,
        product: Product
    ): { Name: string; Product: Product } | null {
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
        id: string | number,
        affiliation?: string,
        couponCode?: string,
        revenue?: string | number,
        shipping?: string | number,
        tax?: number
    ): TransactionAttributes | null {
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
            Revenue: revenue as number,
            Shipping: shipping as string,
            Tax: tax,
        };
    };

    _self.expandProductImpression = function(
        commerceEvent: CommerceEvent & SDKEvent
    ): SDKEvent[] {
        const appEvents: SDKEvent[] = [];
        if (!commerceEvent.ProductImpressions) {
            return appEvents;
        }
        commerceEvent.ProductImpressions.forEach(function(
            productImpression: SDKProductImpression
        ) {
            if (productImpression.ProductList) {
                productImpression.ProductList.forEach(function(
                    product: SDKProduct
                ) {
                    let attributes = extend(
                        false,
                        {},
                        commerceEvent.EventAttributes
                    );
                    if (product.Attributes) {
                        for (const attribute in product.Attributes) {
                            attributes[attribute] =
                                product.Attributes[attribute];
                        }
                    }
                    (self.extractProductAttributes as Function)(
                        attributes,
                        product
                    );
                    if (productImpression.ProductImpressionList) {
                        attributes['Product Impression List'] =
                            productImpression.ProductImpressionList;
                    }
                    const appEvent = mpInstance._ServerModel.createEventObject({
                        messageType: Types.MessageType.PageEvent,
                        name: (self.generateExpandedEcommerceName as Function)(
                            'Impression'
                        ),
                        data: attributes,
                        eventType: Types.EventType.Transaction,
                    });
                    appEvents.push(appEvent);
                });
            }
        });

        return appEvents;
    };

    _self.expandCommerceEvent = function(
        event: CommerceEvent & SDKEvent
    ): SDKEvent[] | null {
        if (!event) {
            return null;
        }
        return (self.expandProductAction as Function)(event)
            .concat((self.expandPromotionAction as Function)(event))
            .concat((self.expandProductImpression as Function)(event));
    };

    _self.expandPromotionAction = function(
        commerceEvent: CommerceEvent & SDKEvent
    ): SDKEvent[] {
        const appEvents: SDKEvent[] = [];
        if (!commerceEvent.PromotionAction) {
            return appEvents;
        }
        const promotions = commerceEvent.PromotionAction.PromotionList;
        promotions.forEach(function(promotion: SDKPromotion) {
            let attributes = extend(false, {}, commerceEvent.EventAttributes);
            (self.extractPromotionAttributes as Function)(
                attributes,
                promotion
            );

            const appEvent = mpInstance._ServerModel.createEventObject({
                messageType: Types.MessageType.PageEvent,
                name: (self.generateExpandedEcommerceName as Function)(
                    (Types.PromotionActionType.getExpansionName as Function)(
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

    _self.expandProductAction = function(
        commerceEvent: CommerceEvent & SDKEvent
    ): SDKEvent[] {
        const appEvents: SDKEvent[] = [];
        if (!commerceEvent.ProductAction) {
            return appEvents;
        }
        let shouldExtractActionAttributes = false;
        if (
            commerceEvent.ProductAction.ProductActionType ===
                Types.ProductActionType.Purchase ||
            commerceEvent.ProductAction.ProductActionType ===
                Types.ProductActionType.Refund
        ) {
            let attributes = extend(false, {}, commerceEvent.EventAttributes);
            attributes['Product Count'] = commerceEvent.ProductAction
                .ProductList
                ? commerceEvent.ProductAction.ProductList.length
                : 0;
            (self.extractActionAttributes as Function)(
                attributes,
                commerceEvent.ProductAction
            );
            if (commerceEvent.CurrencyCode) {
                attributes['Currency Code'] = commerceEvent.CurrencyCode;
            }
            const plusOneEvent = mpInstance._ServerModel.createEventObject({
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

        const products = commerceEvent.ProductAction.ProductList;

        if (!products) {
            return appEvents;
        }

        products.forEach(function(product: SDKProduct) {
            let attributes = extend(
                false,
                commerceEvent.EventAttributes,
                product.Attributes
            );
            if (shouldExtractActionAttributes) {
                (self.extractActionAttributes as Function)(
                    attributes,
                    commerceEvent.ProductAction
                );
            } else {
                (self.extractTransactionId as Function)(
                    attributes,
                    commerceEvent.ProductAction
                );
            }
            (self.extractProductAttributes as Function)(attributes, product);

            const productEvent = mpInstance._ServerModel.createEventObject({
                messageType: Types.MessageType.PageEvent,
                name: (self.generateExpandedEcommerceName as Function)(
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

    this.createCommerceEventObject = function(
        customFlags: SDKEventCustomFlags,
        options?: SDKEventOptions
    ): SDKEvent | null {
        let baseEvent: SDKEvent;
        // https://go.mparticle.com/work/SQDSDKS-4801
        const { extend } = mpInstance._Helpers;

        mpInstance.Logger.verbose(
            Messages.InformationMessages.StartingLogCommerceEvent
        );

        if (mpInstance._Helpers.canLog()) {
            baseEvent = mpInstance._ServerModel.createEventObject({
                messageType: Types.MessageType.Commerce,
                sourceMessageId: (options as { sourceMessageId?: string })
                    ?.sourceMessageId,
            });
            baseEvent.EventName = 'eCommerce - ';

            baseEvent.CurrencyCode = mpInstance._Store.currencyCode;
            baseEvent.ShoppingCart = {} as SDKShoppingCart;
            baseEvent.CustomFlags = extend(baseEvent.CustomFlags, customFlags);

            return baseEvent;
        } else {
            mpInstance.Logger.verbose(
                Messages.InformationMessages.AbandonLogEvent
            );
        }

        return null;
    };

    // sanitizes any non number, non string value to 0
    this.sanitizeAmount = function(
        amount: string | number,
        category: string
    ): number {
        if (!mpInstance._Helpers.Validators.isStringOrNumber(amount)) {
            const message = [
                category,
                'must be of type number. A',
                typeof amount,
                'was passed. Converting to 0',
            ].join(' ');

            mpInstance.Logger.warning(message);
            return 0;
        }

        // if amount is a string, it will be parsed into a number if possible, or set to 0
        return mpInstance._Helpers.parseNumber(amount);
    };
}
