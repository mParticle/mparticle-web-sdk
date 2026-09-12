import { SDKEventAttrs, SDKEventOptions, TransactionAttributes } from '@mparticle/web-sdk';
import { valueof } from './utils';
import { ProductActionType, PromotionActionType } from './types';
import { SDKEvent, SDKEventCustomFlags, SDKImpression, SDKProduct, SDKProductAction, SDKPromotion } from './sdkRuntimeModels';
interface IECommerceShared {
    createProduct(name: string, sku: string | number, price: string | number, quantity?: string | number, variant?: string, category?: string, brand?: string, position?: number, couponCode?: string, attributes?: SDKEventAttrs): SDKProduct | null;
    createImpression(name: string, product: SDKProduct): SDKImpression | null;
    createPromotion(id: string | number, creative?: string, name?: string, position?: number): SDKPromotion | null;
    createTransactionAttributes(id: string | number, affiliation?: string, couponCode?: string, revenue?: string | number, shipping?: string | number, tax?: number): TransactionAttributes | null;
    expandCommerceEvent(event: SDKEvent): SDKEvent[] | null;
}
export interface SDKECommerceAPI extends IECommerceShared {
    logImpression(impression: SDKImpression | SDKImpression[], attrs?: SDKEventAttrs, customFlags?: SDKEventCustomFlags, eventOptions?: SDKEventOptions): void;
    logProductAction(productActionType: valueof<typeof ProductActionType>, product: SDKProduct | SDKProduct[], attrs?: SDKEventAttrs, customFlags?: SDKEventCustomFlags, transactionAttributes?: TransactionAttributes, eventOptions?: SDKEventOptions): void;
    logPromotion(type: valueof<typeof PromotionActionType>, promotion: SDKPromotion | SDKPromotion[], attrs?: SDKEventAttrs, customFlags?: SDKEventCustomFlags, eventOptions?: SDKEventOptions): void;
    setCurrencyCode(code: string): void;
    /**
     * @deprecated Use `logProductAction` with `ProductActionType.Purchase` instead.
     */
    logPurchase(transactionAttributes: TransactionAttributes, product: SDKProduct | SDKProduct[], clearCart?: boolean, attrs?: SDKEventAttrs, customFlags?: SDKEventCustomFlags): void;
}
interface ExtractedActionAttributes {
    Affiliation?: string;
    'Coupon Code'?: string;
    'Total Amount'?: number;
    'Shipping Amount'?: number;
    'Tax Amount'?: number;
    'Checkout Option'?: string;
    'Checkout Step'?: number;
    'Transaction ID'?: string;
}
interface ExtractedProductAttributes {
    'Coupon Code'?: string;
    Brand?: string;
    Category?: string;
    Name?: string;
    Id?: string;
    'Item Price'?: number;
    Quantity?: number;
    Position?: number;
    Variant?: string;
    'Total Product Amount': number;
}
interface ExtractedPromotionAttributes {
    Id?: string;
    Creative?: string;
    Name?: string;
    Position?: number;
}
interface ExtractedTransactionId {
    'Transaction ID'?: string;
}
export interface IECommerce extends IECommerceShared {
    convertProductActionToEventType(productActionType: valueof<typeof ProductActionType>): // https://go.mparticle.com/work/SQDSDKS-4801
    number | null;
    convertPromotionActionToEventType(promotionActionType: valueof<typeof PromotionActionType>): number | null;
    calculateProductActionTotalAmount(productAction: SDKProductAction): SDKProductAction;
    convertTransactionAttributesToProductAction(transactionAttributes: TransactionAttributes, productAction: SDKProductAction): void;
    createCommerceEventObject(customFlags: SDKEventCustomFlags, options?: SDKEventOptions): SDKEvent | null;
    expandProductAction(commerceEvent: SDKEvent): SDKEvent[];
    expandProductImpression(commerceEvent: SDKEvent): SDKEvent[];
    expandPromotionAction(commerceEvent: SDKEvent): SDKEvent[];
    extractActionAttributes(attributes: ExtractedActionAttributes, productAction: SDKProductAction): void;
    extractProductAttributes(attributes: ExtractedProductAttributes, product: SDKProduct): void;
    extractPromotionAttributes(attributes: ExtractedPromotionAttributes, promotion: SDKPromotion): void;
    extractTransactionId(attributes: ExtractedTransactionId, productAction: SDKProductAction): void;
    generateExpandedEcommerceName(eventName: string, plusOne?: boolean): string;
    getProductActionEventName(productActionType: valueof<typeof ProductActionType>): string;
    getPromotionActionEventName(promotionActionType: valueof<typeof PromotionActionType>): string;
    sanitizeAmount(amount: string | number, category: string): number;
}
export {};
