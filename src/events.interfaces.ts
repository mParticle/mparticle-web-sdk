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
    startTracking(callback: Callback): void;
    stopTracking(): void;
}
