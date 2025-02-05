import {
    Callback,
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

// Supports wrapping event handlers functions that will ideally return a specific type
type EventHandlerFunction<T> = (element: HTMLLinkElement | HTMLFormElement) => T;

export interface IEvents {
    addEventHandler(
        domEvent: string,
        selector: string | Node,
        eventName: EventHandlerFunction<string> | string,
        data: EventHandlerFunction<SDKEventAttrs> | SDKEventAttrs,
        eventType: valueof<typeof EventType>
    ): void;
    logAST(): void;
    logCheckoutEvent(
        step: number,

        // User options specified during the checkout process
        // e.g., FedEx, DHL, UPS for delivery options;
        // Visa, MasterCard, AmEx for payment options.
        option?: string,

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
        product: SDKProduct | SDKProduct[],
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
        product: SDKProduct | SDKProduct[],
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags
    ): void;
    logRefundEvent(
        transactionAttributes: TransactionAttributes,
        product: SDKProduct | SDKProduct[],
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags
    ): void;
    startTracking(callback: Callback): void;
    stopTracking(): void;
}
