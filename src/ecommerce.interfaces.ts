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
import { valueof } from './utils';
import {
    ProductActionType,
    PromotionActionType,
    CommerceEventType,
    EventType,
} from './types';
import {
    SDKEvent,
    SDKEventCustomFlags,
    SDKImpression,
    SDKProduct,
    SDKProductImpression,
    SDKPromotion,
} from './sdkRuntimeModels';

interface IECommerceShared {
    createProduct(
        name: string,
        sku: string | number,
        price: string | number,
        quantity?: string | number,
        variant?: string,
        category?: string,
        brand?: string,
        position?: number,
        couponCode?: string,
        attributes?: Record<string, string | number>
    ): SDKProduct | null;
    createImpression(name: string, product: Product): SDKImpression | null;
    createPromotion(
        id: string | number,
        creative?: string,
        name?: string,
        position?: string
    ): SDKPromotion | null;
    createTransactionAttributes(
        id: string | number,
        affiliation?: string,
        couponCode?: string,
        revenue?: string | number,
        shipping?: string | number,
        tax?: string | number
    ): TransactionAttributes | null;
    expandCommerceEvent(event: CommerceEvent): SDKEvent[] | null;
}

export interface SDKCart {
    add(product: SDKProduct | SDKProduct[], logEvent?: boolean): void;
    remove(product: SDKProduct | SDKProduct[], logEvent?: boolean): void;
    clear(): void;
}

// Used for the public `eCommerce` namespace
export interface SDKECommerceAPI extends IECommerceShared {
    /*
     * @deprecated
     */
    Cart: SDKCart;

    logCheckout(
        step: number,
        option?: string,
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags
    ): void;
    logImpression(
        impression: SDKProductImpression,
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags,
        eventOptions?: SDKEventOptions
    ): void;
    logProductAction(
        productActionType: valueof<typeof ProductActionType>,
        product: SDKProduct | SDKProduct[],
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags,
        transactionAttributes?: TransactionAttributes,
        eventOptions?: SDKEventOptions
    ): void;
    logPromotion(
        type: valueof<typeof PromotionActionType>,
        promotion: SDKPromotion,
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags,
        eventOptions?: SDKEventOptions
    ): void;
    logPurchase(
        transactionAttributes: TransactionAttributes,
        product: SDKProduct | SDKProduct[],
        clearCart?: boolean,
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags
    ): void;
    logRefund(
        transactionAttributes: TransactionAttributes,
        product: SDKProduct | SDKProduct[],
        clearCart?: boolean,
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags
    ): void;
    setCurrencyCode(code: string): void;
}

// Used for the private `_Ecommerce` namespace
export interface IECommerce extends IECommerceShared {
    buildProductList(event: any, product: Product | Product[]): Product[];
    convertProductActionToEventType(
        productActionType: valueof<typeof ProductActionType>
    ): typeof CommerceEventType | typeof EventType | null;
    convertPromotionActionToEventType(
        promotionActionType: valueof<typeof PromotionActionType>
    ): typeof CommerceEventType | null;
    convertTransactionAttributesToProductAction(
        transactionAttributes: TransactionAttributes,
        productAction: ProductAction
    ): void;
    createCommerceEventObject(
        customFlags: SDKEventCustomFlags,
        options?: SDKEventOptions
    ): SDKEvent | null;
    expandProductAction(commerceEvent: CommerceEvent): SDKEvent[];
    expandProductImpression(commerceEvent: CommerceEvent): SDKEvent[];
    expandPromotionAction(commerceEvent: CommerceEvent): SDKEvent[];
    extractActionAttributes(
        attributes: Record<string, string | number>,
        productAction: ProductAction
    ): void;
    extractProductAttributes(
        attributes: Record<string, string | number>,
        product: Product
    ): void;
    extractPromotionAttributes(
        attributes: Record<string, string | number>,
        promotion: Promotion
    ): void;
    extractTransactionId(
        attributes: Record<string, string | number>,
        productAction: ProductAction
    ): void;
    generateExpandedEcommerceName(eventName: string, plusOne: boolean): string;
    getProductActionEventName(
        productActionType: valueof<typeof ProductActionType>
    ): string;
    getPromotionActionEventName(
        promotionActionType: valueof<typeof PromotionActionType>
    ): string;
    sanitizeAmount(amount: string | number, category: string): number;
}
