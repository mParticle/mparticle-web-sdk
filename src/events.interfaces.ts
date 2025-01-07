import {
    Callback,
    Dictionary,
    SDKEventAttrs,
    SDKEventOptions,
    TransactionAttributes,
} from '@mparticle/web-sdk';
import {
    BaseEvent,
    SDKEventCustomFlags,
    SDKProduct,
    SDKProductImpression,
    SDKPromotion,
} from './sdkRuntimeModels';
import { valueof } from './utils';
import { EventType, ProductActionType, PromotionActionType } from './types';

type dataFunction = (element: HTMLElement) => Dictionary<string>;
type dataObject = Dictionary<string>;

export interface IEvents {
    addEventHandler(
        domEvent: string,
        selector: string | Node,
        eventName: string,

        // QUESTION: In what cases would data be a function?
        data: dataObject | dataFunction,

        eventType: valueof<typeof EventType>
    ): void;
    logCheckoutEvent(
        step: number,
        option?: SDKEventOptions,
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags
    );
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
    );
    logPromotionEvent(
        promotionType: valueof<typeof PromotionActionType>,
        promotion: SDKPromotion,
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags,
        eventOptions?: SDKEventOptions
    );
    logPurchaseEvent(
        product: SDKProduct,
        transactionAttributes?: TransactionAttributes,
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags
    );
    logRefundEvent(
        transactionAttributes: TransactionAttributes,
        product: SDKProduct,
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags
    );
    startTracking(callback: Callback): void;
    stopTracking(): void;

    
}
