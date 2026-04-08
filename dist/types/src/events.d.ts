export default function Events(mpInstance: any): void;
export default class Events {
    constructor(mpInstance: any);
    logEvent: (event: any, options: any) => void;
    startTracking: (callback: any) => void;
    stopTracking: () => void;
    logOptOut: () => void;
    logAST: () => void;
    logCheckoutEvent: (step: any, option: any, attrs: any, customFlags: any) => void;
    logProductActionEvent: (productActionType: any, product: any, customAttrs: any, customFlags: any, transactionAttributes: any, options: any) => void;
    logPurchaseEvent: (transactionAttributes: any, product: any, attrs: any, customFlags: any) => void;
    logRefundEvent: (transactionAttributes: any, product: any, attrs: any, customFlags: any) => void;
    logPromotionEvent: (promotionType: any, promotion: any, attrs: any, customFlags: any, eventOptions: any) => void;
    logImpressionEvent: (impression: any, attrs: any, customFlags: any, options: any) => void;
    logCommerceEvent: (commerceEvent: any, attrs: any, options: any) => void;
    addEventHandler: (domEvent: any, selector: any, eventName: any, data: any, eventType: any) => void;
}
