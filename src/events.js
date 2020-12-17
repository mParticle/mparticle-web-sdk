import Types from './types';
import Constants from './constants';

var Messages = Constants.Messages;

export default function Events(mpInstance) {
    var self = this;
    this.logEvent = function(event) {
        mpInstance.Logger.verbose(
            Messages.InformationMessages.StartingLogEvent + ': ' + event.name
        );
        if (mpInstance._Helpers.canLog()) {
            var uploadObject = mpInstance._ServerModel.createEventObject(event);
            mpInstance._APIClient.sendEventToServer(uploadObject);
        } else {
            mpInstance.Logger.verbose(
                Messages.InformationMessages.AbandonLogEvent
            );
        }
    };

    this.startTracking = function(callback) {
        if (!mpInstance._Store.isTracking) {
            if ('geolocation' in navigator) {
                mpInstance._Store.watchPositionId = navigator.geolocation.watchPosition(
                    successTracking,
                    errorTracking
                );
            }
        } else {
            var position = {
                coords: {
                    latitude: mpInstance._Store.currentPosition.lat,
                    longitude: mpInstance._Store.currentPosition.lng,
                },
            };
            triggerCallback(callback, position);
        }

        function successTracking(position) {
            mpInstance._Store.currentPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };

            triggerCallback(callback, position);
            // prevents callback from being fired multiple times
            callback = null;

            mpInstance._Store.isTracking = true;
        }

        function errorTracking() {
            triggerCallback(callback);
            // prevents callback from being fired multiple times
            callback = null;
            mpInstance._Store.isTracking = false;
        }

        function triggerCallback(callback, position) {
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
                    mpInstance.Logger.error(e);
                }
            }
        }
    };

    this.stopTracking = function() {
        if (mpInstance._Store.isTracking) {
            navigator.geolocation.clearWatch(mpInstance._Store.watchPositionId);
            mpInstance._Store.currentPosition = null;
            mpInstance._Store.isTracking = false;
        }
    };

    this.logOptOut = function() {
        mpInstance.Logger.verbose(
            Messages.InformationMessages.StartingLogOptOut
        );

        var event = mpInstance._ServerModel.createEventObject({
            messageType: Types.MessageType.OptOut,
            eventType: Types.EventType.Other,
        });
        mpInstance._APIClient.sendEventToServer(event);
    };

    this.logAST = function() {
        self.logEvent({ messageType: Types.MessageType.AppStateTransition });
    };

    this.logCheckoutEvent = function(step, option, attrs, customFlags) {
        var event = mpInstance._Ecommerce.createCommerceEventObject(
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

            self.logCommerceEvent(event, attrs);
        }
    };

    this.logProductActionEvent = function(
        productActionType,
        product,
        customAttrs,
        customFlags,
        transactionAttributes
    ) {
        var event = mpInstance._Ecommerce.createCommerceEventObject(
            customFlags
        );

        var productList = Array.isArray(product) ? product : [product];

        productList.forEach(function(product) {
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
            event.EventCategory = mpInstance._Ecommerce.convertProductActionToEventType(
                productActionType
            );
            event.EventName += mpInstance._Ecommerce.getProductActionEventName(
                productActionType
            );
            event.ProductAction = {
                ProductActionType: productActionType,
                ProductList: productList,
            };

            if (mpInstance._Helpers.isObject(transactionAttributes)) {
                mpInstance._Ecommerce.convertTransactionAttributesToProductAction(
                    transactionAttributes,
                    event.ProductAction
                );
            }

            self.logCommerceEvent(event, customAttrs);
        }
    };

    this.logPurchaseEvent = function(
        transactionAttributes,
        product,
        attrs,
        customFlags
    ) {
        var event = mpInstance._Ecommerce.createCommerceEventObject(
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
            event.ProductAction.ProductList = mpInstance._Ecommerce.buildProductList(
                event,
                product
            );

            mpInstance._Ecommerce.convertTransactionAttributesToProductAction(
                transactionAttributes,
                event.ProductAction
            );

            self.logCommerceEvent(event, attrs);
        }
    };

    this.logRefundEvent = function(
        transactionAttributes,
        product,
        attrs,
        customFlags
    ) {
        if (!transactionAttributes) {
            mpInstance.Logger.error(Messages.ErrorMessages.TransactionRequired);
            return;
        }

        var event = mpInstance._Ecommerce.createCommerceEventObject(
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
            event.ProductAction.ProductList = mpInstance._Ecommerce.buildProductList(
                event,
                product
            );

            mpInstance._Ecommerce.convertTransactionAttributesToProductAction(
                transactionAttributes,
                event.ProductAction
            );

            self.logCommerceEvent(event, attrs);
        }
    };

    this.logPromotionEvent = function(
        promotionType,
        promotion,
        attrs,
        customFlags
    ) {
        var event = mpInstance._Ecommerce.createCommerceEventObject(
            customFlags
        );

        if (event) {
            event.EventName += mpInstance._Ecommerce.getPromotionActionEventName(
                promotionType
            );
            event.EventCategory = mpInstance._Ecommerce.convertPromotionActionToEventType(
                promotionType
            );
            event.PromotionAction = {
                PromotionActionType: promotionType,
                PromotionList: [promotion],
            };

            self.logCommerceEvent(event, attrs);
        }
    };

    this.logImpressionEvent = function(impression, attrs, customFlags) {
        var event = mpInstance._Ecommerce.createCommerceEventObject(
            customFlags
        );

        if (event) {
            event.EventName += 'Impression';
            event.EventCategory = Types.CommerceEventType.ProductImpression;
            if (!Array.isArray(impression)) {
                impression = [impression];
            }

            event.ProductImpressions = [];

            impression.forEach(function(impression) {
                event.ProductImpressions.push({
                    ProductImpressionList: impression.Name,
                    ProductList: Array.isArray(impression.Product)
                        ? impression.Product
                        : [impression.Product],
                });
            });

            self.logCommerceEvent(event, attrs);
        }
    };

    this.logCommerceEvent = function(commerceEvent, attrs) {
        mpInstance.Logger.verbose(
            Messages.InformationMessages.StartingLogCommerceEvent
        );

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
                commerceEvent.EventAttributes = attrs;
            }

            mpInstance._APIClient.sendEventToServer(commerceEvent);
            mpInstance._Persistence.update();
        } else {
            mpInstance.Logger.verbose(
                Messages.InformationMessages.AbandonLogEvent
            );
        }
    };

    this.addEventHandler = function(
        domEvent,
        selector,
        eventName,
        data,
        eventType
    ) {
        var elements = [],
            handler = function(e) {
                var timeoutHandler = function() {
                    if (element.href) {
                        window.location.href = element.href;
                    } else if (element.submit) {
                        element.submit();
                    }
                };

                mpInstance.Logger.verbose(
                    'DOM event triggered, handling event'
                );

                self.logEvent({
                    messageType: Types.MessageType.PageEvent,
                    name:
                        typeof eventName === 'function'
                            ? eventName(element)
                            : eventName,
                    data: typeof data === 'function' ? data(element) : data,
                    eventType: eventType || Types.EventType.Other,
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

                    setTimeout(
                        timeoutHandler,
                        mpInstance._Store.SDKConfig.timeout
                    );
                }
            },
            element,
            i;

        if (!selector) {
            mpInstance.Logger.error("Can't bind event, selector is required");
            return;
        }

        // Handle a css selector string or a dom element
        if (typeof selector === 'string') {
            elements = document.querySelectorAll(selector);
        } else if (selector.nodeType) {
            elements = [selector];
        }

        if (elements.length) {
            mpInstance.Logger.verbose(
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
            mpInstance.Logger.verbose('No elements found');
        }
    };
}
