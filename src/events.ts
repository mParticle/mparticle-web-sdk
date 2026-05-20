import Types, { EventType, ProductActionType, PromotionActionType } from './types';
import Constants from './constants';
import { IEvents, TrackingCallback } from './events.interfaces';
import { IMParticleWebSDKInstance } from './mp-instance';
import {
    BaseEvent,
    SDKEvent,
    SDKEventCustomFlags,
    SDKImpression,
    SDKProduct,
    SDKProductActionType,
    SDKProductImpression,
    SDKPromotion,
} from './sdkRuntimeModels';
import { SDKEventAttrs, SDKEventOptions, TransactionAttributes } from '@mparticle/web-sdk';
import { valueof } from './utils';

interface DOMHandlerElement extends HTMLElement {
    href?: string;
    target?: string;
    submit?: () => void;
    attachEvent?: (event: string, handler: EventListener) => void;
}

const Messages = Constants.Messages;

export default function Events(
    this: IEvents,
    mpInstance: IMParticleWebSDKInstance
): void {
    this.logEvent = function(event: BaseEvent, options?: SDKEventOptions): void {
        mpInstance.Logger.verbose(
            Messages.InformationMessages.StartingLogEvent + ': ' + event.name
        );
        if (mpInstance._Helpers.canLog()) {
            const uploadObject = mpInstance._ServerModel.createEventObject(event);
            mpInstance._APIClient.sendEventToServer(uploadObject, options);
        } else {
            mpInstance.Logger.verbose(
                Messages.InformationMessages.AbandonLogEvent
            );
        }
    };

    this.startTracking = function(callback: TrackingCallback): void {
        if (mpInstance._Store.isTracking) {
            const position = {
                coords: {
                    latitude: mpInstance._Store.currentPosition.lat,
                    longitude: mpInstance._Store.currentPosition.lng,
                },
            };
            triggerCallback(callback, position);
        } else {
            if ('geolocation' in navigator) {
                mpInstance._Store.watchPositionId = navigator.geolocation.watchPosition(
                    successTracking,
                    errorTracking
                );
            }
        }

        function successTracking(position: GeolocationPosition): void {
            mpInstance._Store.currentPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };

            triggerCallback(callback, position);
            // prevents callback from being fired multiple times
            callback = null;

            mpInstance._Store.isTracking = true;
        }

        function errorTracking(): void {
            triggerCallback(callback);
            // prevents callback from being fired multiple times
            callback = null;
            mpInstance._Store.isTracking = false;
        }

        function triggerCallback(
            callback: TrackingCallback,
            position?: GeolocationPosition | { coords: { latitude: number | string; longitude: number | string } }
        ): void {
            if (callback) {
                try {
                    if (position) {
                        callback(position);
                    } else {
                        callback();
                    }
                } catch (e) {
                    mpInstance.Logger.error(
                        'Error invoking the callback passed to startTrackingLocation.'
                    );
                    mpInstance.Logger.error(e instanceof Error ? e.message : String(e));
                }
            }
        }
    };

    this.stopTracking = function(): void {
        if (mpInstance._Store.isTracking) {
            navigator.geolocation.clearWatch(mpInstance._Store.watchPositionId);
            mpInstance._Store.currentPosition = null;
            mpInstance._Store.isTracking = false;
        }
    };

    this.logOptOut = function(): void {
        mpInstance.Logger.verbose(
            Messages.InformationMessages.StartingLogOptOut
        );

        const event = mpInstance._ServerModel.createEventObject({
            messageType: Types.MessageType.OptOut,
            eventType: Types.EventType.Other,
        });
        mpInstance._APIClient.sendEventToServer(event);
    };

    this.logAST = (): void => {
        this.logEvent({ messageType: Types.MessageType.AppStateTransition });
    };

    this.logCheckoutEvent = (
        step: number,
        option?: string,
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags
    ): void => {
        const event = mpInstance._Ecommerce.createCommerceEventObject(
            customFlags
        );

        if (event) {
            event.EventName += mpInstance._Ecommerce.getProductActionEventName(
                Types.ProductActionType.Checkout
            );
            event.EventCategory = Types.CommerceEventType.ProductCheckout;
            event.ProductAction = {
                ProductActionType: Types.ProductActionType.Checkout,
                CheckoutStep: step,
                CheckoutOptions: option,
                ProductList: [],
            };

            this.logCommerceEvent(event, attrs);
        }
    };

    this.logProductActionEvent = (
        productActionType: valueof<typeof ProductActionType>,
        product: SDKProduct | SDKProduct[],
        customAttrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags,
        transactionAttributes?: TransactionAttributes,
        options?: SDKEventOptions
    ): void => {
        const event = mpInstance._Ecommerce.createCommerceEventObject(
            customFlags,
            options
        );

        const productList: SDKProduct[] = Array.isArray(product) ? product : [product];

        productList.forEach(function(product: SDKProduct) {
            if (product.TotalAmount) {
                product.TotalAmount = mpInstance._Ecommerce.sanitizeAmount(
                    product.TotalAmount,
                    'TotalAmount'
                );
            }
            if (product.Position) {
                product.Position = mpInstance._Ecommerce.sanitizeAmount(
                    product.Position,
                    'Position'
                );
            }
            if (product.Price) {
                product.Price = mpInstance._Ecommerce.sanitizeAmount(
                    product.Price,
                    'Price'
                );
            }
            if (product.Quantity) {
                product.Quantity = mpInstance._Ecommerce.sanitizeAmount(
                    product.Quantity,
                    'Quantity'
                );
            }
        });

        if (event) {
            // TODO(https://go/j/SDKE-1108): Remove `as Function` casts when ecommerce.js is migrated to TS
            event.EventCategory = (mpInstance._Ecommerce.convertProductActionToEventType as Function)(
                productActionType
            );
            event.EventName += mpInstance._Ecommerce.getProductActionEventName(
                productActionType
            );
            event.ProductAction = {
                ProductActionType: productActionType as SDKProductActionType,
                ProductList: productList,
            };

            if (mpInstance._Helpers.isObject(transactionAttributes)) {
                (mpInstance._Ecommerce.convertTransactionAttributesToProductAction as Function)(
                    transactionAttributes,
                    event.ProductAction
                );
            }

            this.logCommerceEvent(event, customAttrs, options);
        }
    };

    this.logPurchaseEvent = (
        transactionAttributes: TransactionAttributes,
        product: SDKProduct | SDKProduct[],
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags
    ): void => {
        const event = mpInstance._Ecommerce.createCommerceEventObject(
            customFlags
        );

        if (event) {
            event.EventName += mpInstance._Ecommerce.getProductActionEventName(
                Types.ProductActionType.Purchase
            );
            event.EventCategory = Types.CommerceEventType.ProductPurchase;
            event.ProductAction = {
                ProductActionType: Types.ProductActionType.Purchase,
            };
            event.ProductAction.ProductList = (mpInstance._Ecommerce.buildProductList as Function)(
                event,
                product
            );

            (mpInstance._Ecommerce.convertTransactionAttributesToProductAction as Function)(
                transactionAttributes,
                event.ProductAction
            );

            this.logCommerceEvent(event, attrs);
        }
    };

    this.logRefundEvent = (
        transactionAttributes: TransactionAttributes,
        product: SDKProduct | SDKProduct[],
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags
    ): void => {
        if (!transactionAttributes) {
            mpInstance.Logger.error(Messages.ErrorMessages.TransactionRequired);
            return;
        }

        const event = mpInstance._Ecommerce.createCommerceEventObject(
            customFlags
        );

        if (event) {
            event.EventName += mpInstance._Ecommerce.getProductActionEventName(
                Types.ProductActionType.Refund
            );
            event.EventCategory = Types.CommerceEventType.ProductRefund;
            event.ProductAction = {
                ProductActionType: Types.ProductActionType.Refund,
            };
            event.ProductAction.ProductList = (mpInstance._Ecommerce.buildProductList as Function)(
                event,
                product
            );

            (mpInstance._Ecommerce.convertTransactionAttributesToProductAction as Function)(
                transactionAttributes,
                event.ProductAction
            );

            this.logCommerceEvent(event, attrs);
        }
    };

    this.logPromotionEvent = (
        promotionType: valueof<typeof PromotionActionType>,
        promotion: SDKPromotion | SDKPromotion[],
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags,
        eventOptions?: SDKEventOptions
    ): void => {
        const event = mpInstance._Ecommerce.createCommerceEventObject(
            customFlags
        );

        if (event) {
            event.EventName += mpInstance._Ecommerce.getPromotionActionEventName(
                promotionType
            );
            event.EventCategory = (mpInstance._Ecommerce.convertPromotionActionToEventType as Function)(
                promotionType
            );
            event.PromotionAction = {
                PromotionActionType: promotionType,
                PromotionList: Array.isArray(promotion)
                    ? promotion
                    : [promotion],
            };

            this.logCommerceEvent(event, attrs, eventOptions);
        }
    };

    this.logImpressionEvent = (
        impression: SDKImpression | SDKImpression[] | SDKProductImpression | SDKProductImpression[],
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags,
        options?: SDKEventOptions
    ): void => {
        const event = mpInstance._Ecommerce.createCommerceEventObject(
            customFlags
        );

        if (event) {
            event.EventName += 'Impression';
            event.EventCategory = Types.CommerceEventType.ProductImpression;
            // https://go/j/SDKE-1199
            const impressionList: (SDKImpression | SDKProductImpression)[] = Array.isArray(impression)
                ? impression
                : [impression];

            event.ProductImpressions = [];

            impressionList.forEach(function(item) {
                if ('Name' in item) {
                    const imp = item as SDKImpression;
                    event.ProductImpressions.push({
                        ProductImpressionList: imp.Name,
                        ProductList: Array.isArray(imp.Product)
                            ? imp.Product
                            : [imp.Product],
                    });
                } else {
                    const imp = item as SDKProductImpression;
                    event.ProductImpressions.push({
                        ProductImpressionList: imp.ProductImpressionList,
                        ProductList: imp.ProductList || [],
                    });
                }
            });

            this.logCommerceEvent(event, attrs, options);
        }
    };

    this.logCommerceEvent = function(
        commerceEvent: SDKEvent,
        attrs?: SDKEventAttrs,
        options?: SDKEventOptions
    ): void {
        mpInstance.Logger.verbose(
            Messages.InformationMessages.StartingLogCommerceEvent
        );

        // If a developer typos the ProductActionType, the event category will be
        // null, resulting in kit forwarding errors on the server.
        // The check for `ProductAction` is required to denote that these are
        // ProductAction events, and not impression or promotions
        if (
            commerceEvent.ProductAction &&
            commerceEvent.EventCategory === null
        ) {
            mpInstance.Logger.error(
                'Commerce event not sent.  The mParticle.ProductActionType you passed was invalid. Re-check your code.'
            );
            return;
        }

        attrs = mpInstance._Helpers.sanitizeAttributes(
            attrs,
            commerceEvent.EventName
        );

        if (mpInstance._Helpers.canLog()) {
            if (mpInstance._Store.webviewBridgeEnabled) {
                // Don't send shopping cart to parent sdks
                commerceEvent.ShoppingCart = {};
            }

            if (attrs) {
                commerceEvent.EventAttributes = attrs as Record<string, string>;
            }

            mpInstance._APIClient.sendEventToServer(commerceEvent, options);

            // https://go.mparticle.com/work/SQDSDKS-6038
            mpInstance._Persistence.update();
        } else {
            mpInstance.Logger.verbose(
                Messages.InformationMessages.AbandonLogEvent
            );
        }
    };

    this.addEventHandler = function(
        domEvent: string,
        selector: string | Node,
        eventName: ((element: HTMLLinkElement | HTMLFormElement) => string) | string,
        data: ((element: HTMLLinkElement | HTMLFormElement) => SDKEventAttrs) | SDKEventAttrs,
        eventType: valueof<typeof EventType>
    ): void {
        let elements: ArrayLike<Element> | Element[] = [];
        let element: DOMHandlerElement;
        let elementIndex: number;
        const handler = (e: Event): void => {
                const timeoutHandler = function(): void {
                    if (element.href) {
                        globalThis.location.href = element.href;
                    } else if (element.submit) {
                        element.submit();
                    }
                };

                mpInstance.Logger.verbose(
                    'DOM event triggered, handling event'
                );

                this.logEvent({
                    messageType: Types.MessageType.PageEvent,
                    name:
                        typeof eventName === 'function'
                            ? eventName(element as HTMLLinkElement)
                            : eventName,
                    data: typeof data === 'function' ? data(element as HTMLLinkElement) : data,
                    eventType: (eventType || Types.EventType.Other) as number,
                });

                // TODO: Handle middle-clicks and special keys (ctrl, alt, etc)
                if (
                    (element.href && element.target !== '_blank') ||
                    element.submit
                ) {
                    // Give xmlhttprequest enough time to execute before navigating a link or submitting form

                    if (e.preventDefault) {
                        e.preventDefault();
                    } else {
                        (e as { returnValue: boolean }).returnValue = false;
                    }

                    setTimeout(
                        timeoutHandler,
                        mpInstance._Store.SDKConfig.timeout
                    );
                }
            };

        if (!selector) {
            mpInstance.Logger.error("Can't bind event, selector is required");
            return;
        }

        // Handle a css selector string or a dom element
        if (typeof selector === 'string') {
            elements = document.querySelectorAll(selector);
        } else if (selector.nodeType) {
            elements = [selector as Element];
        }

        if (elements.length) {
            mpInstance.Logger.verbose(
                'Found ' +
                    elements.length +
                    ' element' +
                    (elements.length > 1 ? 's' : '') +
                    ', attaching event handlers'
            );

            for (elementIndex = 0; elementIndex < elements.length; elementIndex++) {
                element = elements[elementIndex] as DOMHandlerElement;

                if (element.addEventListener) {
                    element.addEventListener(domEvent, handler, false);
                } else if (element.attachEvent) {
                    element.attachEvent('on' + domEvent, handler);
                } else {
                    element['on' + domEvent] = handler;
                }
            }
        } else {
            mpInstance.Logger.verbose('No elements found');
        }
    };
}
