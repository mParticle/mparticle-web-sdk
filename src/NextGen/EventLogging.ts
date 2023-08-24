import {
    BaseEvent,
    SDKEvent,
    SDKEventCustomFlags,
    SDKPromotion,
} from '../sdkRuntimeModels';
import Mediator from './Mediator';
import Constants from '../constants';
import { IComponent } from './Component';
import { IStore } from '../store';
import {
    Impression,
    Logger,
    Product,
    PromotionType,
    TransactionAttributes,
} from '@mparticle/web-sdk';
import {
    MessageType,
    EventTypeEnum,
    ProductActionType,
    CommerceEventType,
    PromotionActionType,
} from '../types.interfaces';
import { Dictionary, isObject } from '../utils';
import { Promotion } from '@mparticle/event-models';

const { Messages } = Constants;

// TODO: We should rename/revise BaseEvent into MPEvent
export interface MPEvent extends BaseEvent {}
export interface CommerceEvent extends SDKEvent {}

// FIXME: Add TotalAmount to Product
interface IProduct extends Product {
    TotalAmount?: number;
}

// TODO: Do we have something similar to this?
export type CustomAttributes = Dictionary<string>;

export interface EventOptions {}

type TrackingCallback = (
    callback: PositionCallback,
    position?: GeolocationPosition
) => void;

export interface IEventLogging extends IComponent {
    logEvent(event: MPEvent, options?: EventOptions): void;
}

export default class EventLogging implements IEventLogging {
    // TODO: Can we use the mediator instead?
    public mediator: Mediator;

    private store: IStore;
    private logger: Logger;

    constructor(mediator: Mediator) {
        this.mediator = mediator;
        this.store = mediator.store;
        this.logger = mediator.logger;
    }

    logEvent(event: BaseEvent, options?: EventOptions): void {
        const { serverModel, eventApiClient } = this.mediator;

        this?.logger?.verbose(
            `${Messages.InformationMessages.StartingLogEvent}: ${event.name}`
        );

        if (this.store.canLog()) {
            const uploadObject = serverModel.createEventObject(event);
            eventApiClient.sendEventToServer(uploadObject, options);
        } else {
            this?.logger?.verbose(Messages.InformationMessages.AbandonLogEvent);
        }
    }

    logOptOut(): void {
        this.logger.verbose(Messages.InformationMessages.StartingLogOptOut);

        // TODO: Should we Refactor to use logEvent or create a new wrapper for
        //       non-tracking events?

        const event = this.mediator.serverModel.createEventObject({
            // FIXME: Name is required
            name: 'Opt Out Event',
            messageType: MessageType.OptOut,
            eventType: EventTypeEnum.Other,
        });
        this.mediator.eventApiClient.sendEventToServer(event);
    }

    logAST(): void {
        this.logEvent({
            // FIXME: Name is required
            name: 'Application State Transition',
            messageType: MessageType.AppStateTransition,
        });
    }

    logCommerceEvent(
        commerceEvent: CommerceEvent,
        attrs?: CustomAttributes,
        options?: EventOptions
    ): void {
        this.logger.verbose(
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
            this.logger.error(
                'Commerce event not sent.  The mParticle.ProductActionType you passed was invalid. Re-check your code.'
            );
            return;
        }

        attrs = this.mediator.mPInstance._Helpers.sanitizeAttributes(
            attrs,
            commerceEvent.EventName
        );

        if (this.store.canLog()) {
            if (this.store.webviewBridgeEnabled) {
                // Don't send shopping cart to parent sdks
                commerceEvent.ShoppingCart = {};
            }

            if (attrs) {
                commerceEvent.EventAttributes = attrs;
            }

            this.mediator.eventApiClient.sendEventToServer(
                commerceEvent,
                options
            );
            this.mediator.mPInstance._Persistence.update();
        } else {
            this.logger.verbose(Messages.InformationMessages.AbandonLogEvent);
        }
    }

    // FIXME: Can we make this signature more consistent with the others?
    logCheckoutEvent(
        step: string,
        option: EventOptions, // FIXME: Is this the correct type?
        attrs: CustomAttributes,
        customFlags: SDKEventCustomFlags
    ): void {
        // TODO: Define Commerce Event Object
        const event = this.mediator.mPInstance.eCommerce.createCommerceEventObject(
            customFlags
        );

        if (event) {
            event.EventName += this.mediator.mPInstance.eCommerce.getProductActionEventName(
                ProductActionType.Checkout
            );
            event.EventCategory = CommerceEventType.ProductCheckout;
            event.ProductAction = {
                ProductActionType: ProductActionType.Checkout,
                CheckoutStep: step,
                CheckoutOptions: option,
                ProductList: [],
            };

            this.logCommerceEvent(event, attrs);
        }
    }

    // FIXME: Can we make this signature more consistent with the others?
    logProductActionEvent(
        productActionType: ProductActionType,
        product: Product,
        customAttrs: CustomAttributes,
        customFlags: SDKEventCustomFlags,
        transactionAttributes: TransactionAttributes,
        options?: EventOptions
    ): void {
        const { eCommerce } = this.mediator.mPInstance;
        const event = eCommerce.createCommerceEventObject(customFlags);

        // FIXME: Update this once Product has the correct interface
        const productList: IProduct[] = Array.isArray(product)
            ? (product as IProduct[])
            : [product as IProduct];

        productList.forEach(function (product) {
            if (product.TotalAmount) {
                product.TotalAmount = eCommerce.sanitizeAmount(
                    product.TotalAmount,
                    'TotalAmount'
                );
            }
            if (product.Position) {
                product.Position = eCommerce.sanitizeAmount(
                    product.Position,
                    'Position'
                );
            }
            if (product.Price) {
                product.Price = eCommerce.sanitizeAmount(
                    product.Price,
                    'Price'
                );
            }
            if (product.Quantity) {
                product.Quantity = eCommerce.sanitizeAmount(
                    product.Quantity,
                    'Quantity'
                );
            }
        });

        if (event) {
            event.EventCategory = eCommerce.convertProductActionToEventType(
                productActionType
            );
            event.EventName += eCommerce.getProductActionEventName(
                productActionType
            );
            event.ProductAction = {
                ProductActionType: productActionType,
                ProductList: productList,
            };

            if (isObject(transactionAttributes)) {
                eCommerce.convertTransactionAttributesToProductAction(
                    transactionAttributes,
                    event.ProductAction
                );
            }

            this.logCommerceEvent(event, customAttrs, options);
        }
    }

    logPurchaseEvent(
        transactionAttributes: TransactionAttributes,
        product: Product,
        attrs?: CustomAttributes,
        customFlags?: SDKEventCustomFlags
    ): void {
        const { eCommerce } = this.mediator.mPInstance;
        var event = eCommerce.createCommerceEventObject(customFlags);

        if (event) {
            event.EventName += eCommerce.getProductActionEventName(
                ProductActionType.Purchase
            );
            event.EventCategory = CommerceEventType.ProductPurchase;
            event.ProductAction = {
                ProductActionType: ProductActionType.Purchase,
            };
            event.ProductAction.ProductList = eCommerce.buildProductList(
                event,
                product
            );

            eCommerce.convertTransactionAttributesToProductAction(
                transactionAttributes,
                event.ProductAction
            );

            this.logCommerceEvent(event, attrs);
        }
    }

    logRefundEvent(
        transactionAttributes: TransactionAttributes,
        product: Product,
        attrs?: CustomAttributes,
        customFlags?: SDKEventCustomFlags
    ): void {
        const { eCommerce } = this.mediator.mPInstance;

        if (!transactionAttributes) {
            this.logger.error(Messages.ErrorMessages.TransactionRequired);
            return;
        }

        const event = eCommerce.createCommerceEventObject(customFlags);

        if (event) {
            event.EventName += eCommerce.getProductActionEventName(
                ProductActionType.Refund
            );
            event.EventCategory = CommerceEventType.ProductRefund;
            event.ProductAction = {
                ProductActionType: ProductActionType.Refund,
            };
            event.ProductAction.ProductList = eCommerce.buildProductList(
                event,
                product
            );

            eCommerce.convertTransactionAttributesToProductAction(
                transactionAttributes,
                event.ProductAction
            );

            this.logCommerceEvent(event, attrs);
        }
    }

    logPromotionEvent(
        promotionType: string,
        promotion: SDKPromotion,
        attrs?: CustomAttributes,
        customFlags?: SDKEventCustomFlags,
        eventOptions?: EventOptions
    ): void {
        const { _Ecommerce: eCommerce } = this.mediator.mPInstance;

        debugger;

        const event = eCommerce.createCommerceEventObject(customFlags);

        if (event) {
            event.EventName += eCommerce.getPromotionActionEventName(
                promotionType
            );
            event.EventCategory = eCommerce.convertPromotionActionToEventType(
                promotionType
            );
            debugger;
            event.PromotionAction = {
                PromotionActionType: (promotionType as unknown) as string,
                PromotionList: Array.isArray(promotion)
                    ? promotion
                    : [promotion],
            };

            this.logCommerceEvent(event, attrs, eventOptions);
        }
    }

    logImpressionEvent(
        impression: Impression | Impression[],
        attrs?: CustomAttributes,
        customFlags?: SDKEventCustomFlags,
        options?: EventOptions
    ): void {
        const event = this.mediator.mPInstance.eCommerce.createCommerceEventObject(
            customFlags
        );

        if (event) {
            event.EventName += 'Impression';
            event.EventCategory = CommerceEventType.ProductImpression;

            const impressionList: Impression[] = Array.isArray(impression)
                ? impression
                : [impression];

            event.ProductImpressions = [];

            impressionList.forEach(function (impression) {
                event.ProductImpressions.push({
                    ProductImpressionList: impression.Name,
                    ProductList: Array.isArray(impression.Product)
                        ? impression.Product
                        : [impression.Product],
                });
            });

            this.logCommerceEvent(event, attrs, options);
        }
    }

    startTracking(callback: PositionCallback): void {
        const triggerCallback: TrackingCallback = (
            callback: PositionCallback,
            position?: GeolocationPosition
        ) => {
            if (callback) {
                try {
                    if (position) {
                        callback(position);
                    } else {
                        // @ts-ignore: Executes callback as async function
                        callback();
                    }
                } catch (e) {
                    this.logger.error(
                        'Error invoking the callback passed to startTrackingLocation.'
                    );
                    this.logger.error(e as string);
                }
            }
        };

        const successTracking: PositionCallback = (
            position: GeolocationPosition
        ) => {
            this.store.currentPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };

            triggerCallback(callback, position);

            // prevents callback from being fired multiple times
            callback = null;

            this.store.isTracking = true;
        };

        const errorTracking: PositionErrorCallback = () => {
            triggerCallback(callback);
            // prevents callback from being fired multiple times
            callback = null;
            this.store.isTracking = false;
        };

        if (!this.store.isTracking) {
            if ('geolocation' in navigator) {
                this.store.watchPositionId = navigator.geolocation.watchPosition(
                    successTracking,
                    errorTracking
                );
            }
        } else {
            const position: GeolocationPosition = {
                // FIXME: Timestamp is required
                timestamp: null,
                coords: {
                    latitude: this.store.currentPosition.lat,
                    longitude: this.store.currentPosition.lng,
                    // FIXME: GeolocationCoordinates requires lat/long as numbers
                } as GeolocationCoordinates,
            };
            triggerCallback(callback, position);
        }
    }

    stopTracking(): void {
        if (this.store.isTracking) {
            navigator.geolocation.clearWatch(this.store.watchPositionId);
            this.store.currentPosition = null;
            this.store.isTracking = false;
        }
    }

    addEventHandler(
        // QUESTION: are these the right types?
        domEvent: keyof HTMLElementEventMap,
        selector: HTMLElement,
        eventName: string | ((string) => string), // FIXME: Why is this both a function or a string?
        data: Dictionary<string> | ((any) => Dictionary<string>), // FIXME: Should this be a different type?
        eventType: EventTypeEnum
    ): void {
        const self = this;
        let elements: HTMLElement[];
        let handler = function (e) {
                var timeoutHandler = function () {
                    if (element.href) {
                        window.location.href = element.href;
                    } else if (element.submit) {
                        element.submit();
                    }
                };

                self.logger.verbose('DOM event triggered, handling event');

                // FIXME: When would EventName or Data be a function?
                self.logEvent({
                    messageType: MessageType.PageEvent,
                    name:
                        typeof eventName === 'function'
                            ? eventName(element)
                            : eventName,
                    data: typeof data === 'function' ? data(element) : data,
                    eventType: eventType || EventTypeEnum.Other,
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
                        e.returnValue = false;
                    }

                    // @ts-ignore // FIXME: Should we add this to SDK Config?
                    setTimeout(timeoutHandler, self.store.SDKConfig.timeout);
                }
            },
            element,
            i;

        if (!selector) {
            this.logger.error("Can't bind event, selector is required");
            return;
        }

        // Handle a css selector string or a dom element
        if (typeof selector === 'string') {
            elements = (document.querySelectorAll(
                selector
            ) as unknown) as HTMLInputElement[];
        } else if (selector.nodeType) {
            elements = [selector];
        }

        if (elements.length) {
            this.logger.verbose(
                'Found ' +
                    elements.length +
                    ' element' +
                    (elements.length > 1 ? 's' : '') +
                    ', attaching event handlers'
            );

            for (i = 0; i < elements.length; i++) {
                element = elements[i];

                if (element.addEventListener) {
                    element.addEventListener(domEvent, handler, false);
                } else if (element.attachEvent) {
                    element.attachEvent('on' + domEvent, handler);
                } else {
                    element['on' + domEvent] = handler;
                }
            }
        } else {
            this.logger.verbose('No elements found');
        }
    }
}
