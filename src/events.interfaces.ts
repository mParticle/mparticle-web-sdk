import {
    Callback,
    Dictionary,
    SDKEventAttrs,
    SDKEventOptions,
    TransactionAttributes,
} from '@mparticle/web-sdk';
import {
    BaseEvent,
    SDKEvent,
    SDKEventCustomFlags,
    SDKProduct,
    SDKProductImpression,
    SDKPromotion,
} from './sdkRuntimeModels';
import { valueof } from './utils';
import { EventType, ProductActionType, PromotionActionType } from './types';
import { CommonEventData } from '@mparticle/event-models';

// Supports wrapping event handlers functions that will ideally return a specific type
interface eventHandlerFunction<T>{
    (element: HTMLLinkElement | HTMLFormElement): T;
}

// User options specified during the checkout process
// e.g., FedEx, DHL, UPS for delivery options;
// Visa, MasterCard, AmEx for payment options.
type checkoutOption = string;

export interface IEvents {
    addEventHandler(
        domEvent: string,
        selector: string | Node,
        eventName: eventHandlerFunction<string> | string,
        data: eventHandlerFunction<CommonEventData> | CommonEventData,
        eventType: valueof<typeof EventType>
    ): void;
    logAST(): void;
    logCheckoutEvent(
        step: number,
        option?: checkoutOption,
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags
    ): void;
    logCommerceEvent(
        commerceEvent: SDKEvent,
        attrs?: SDKEventAttrs,
        options?: SDKEventOptions
    ): void;
    logEvent(event: BaseEvent, eventOptions?: SDKEventOptions): void;
    logImpressionEvent(
        impression: SDKProductImpression,
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags,
        eventOptions?: SDKEventOptions
    );
    logOptOut(): void;
    logProductActionEvent(
        productActionType: valueof<typeof ProductActionType>,
        product: SDKProduct,
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags,
        transactionAttributes?: TransactionAttributes,
        eventOptions?: SDKEventOptions
    ): void;
    logPromotionEvent(
        promotionType: valueof<typeof PromotionActionType>,
        promotion: SDKPromotion,
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags,
        eventOptions?: SDKEventOptions
    ): void;
    logPurchaseEvent(
        transactionAttributes: TransactionAttributes,
        product: SDKProduct,
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags
    ): void;
    logRefundEvent(
        transactionAttributes: TransactionAttributes,
        product: SDKProduct,
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags
    ): void;
    startTracking(callback: Callback): void;
    stopTracking(): void;
}
