import Types from './types';
import Constants from './constants';
import Helpers from './helpers';
import Ecommerce from './ecommerce';
import ServerModel from './serverModel';
import Persistence from './persistence';
import ApiClient from './apiClient';

var Messages = Constants.Messages,
    sendEventToServer = ApiClient.sendEventToServer;


function logEvent(event) {
    mParticle.Logger.verbose(Messages.InformationMessages.StartingLogEvent + ': ' + event.name);
    if (Helpers.canLog()) {
        if (event.data) {
            event.data = Helpers.sanitizeAttributes(event.data);
        }
        var uploadObject = ServerModel.createEventObject(event);
        sendEventToServer(uploadObject);
        Persistence.update();
    }
    else {
        mParticle.Logger.verbose(Messages.InformationMessages.AbandonLogEvent);
    }
}

function startTracking(callback) {
    if (!mParticle.Store.isTracking) {
        if ('geolocation' in navigator) {
            mParticle.Store.watchPositionId = navigator.geolocation.watchPosition(successTracking, errorTracking);
        }
    } else {
        var position = {
            coords: {
                latitude: mParticle.Store.currentPosition.lat,
                longitude: mParticle.Store.currentPosition.lng
            }
        };
        triggerCallback(callback, position);
    }

    function successTracking(position) {
        mParticle.Store.currentPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        triggerCallback(callback, position);
        // prevents callback from being fired multiple times
        callback = null;

        mParticle.Store.isTracking = true;
    }

    function errorTracking() {
        triggerCallback(callback);
        // prevents callback from being fired multiple times
        callback = null;
        mParticle.Store.isTracking = false;
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
                mParticle.Logger.error('Error invoking the callback passed to startTrackingLocation.');
                mParticle.Logger.error(e);
            }
        }
    }
}

function stopTracking() {
    if (mParticle.Store.isTracking) {
        navigator.geolocation.clearWatch(mParticle.Store.watchPositionId);
        mParticle.Store.currentPosition = null;
        mParticle.Store.isTracking = false;
    }
}

function logOptOut() {
    mParticle.Logger.verbose(Messages.InformationMessages.StartingLogOptOut);

    var event = ServerModel.createEventObject({
        messageType: Types.MessageType.OptOut,
        eventType: Types.EventType.Other
    });
    sendEventToServer(event);
}

function logAST() {
    logEvent({ messageType: Types.MessageType.AppStateTransition });
}

function logCheckoutEvent(step, options, attrs, customFlags) {
    var event = Ecommerce.createCommerceEventObject(customFlags);

    if (event) {
        event.EventName += Ecommerce.getProductActionEventName(Types.ProductActionType.Checkout);
        event.EventCategory = Types.CommerceEventType.ProductCheckout;
        event.ProductAction = {
            ProductActionType: Types.ProductActionType.Checkout,
            CheckoutStep: step,
            CheckoutOptions: options,
            ProductList: event.ShoppingCart.ProductList
        };

        logCommerceEvent(event, attrs);
    }
}

function logProductActionEvent(productActionType, product, attrs, customFlags) {
    var event = Ecommerce.createCommerceEventObject(customFlags);

    if (event) {
        event.EventCategory = Ecommerce.convertProductActionToEventType(productActionType);
        event.EventName += Ecommerce.getProductActionEventName(productActionType);
        event.ProductAction = {
            ProductActionType: productActionType,
            ProductList: Array.isArray(product) ? product : [product]
        };

        logCommerceEvent(event, attrs);
    }
}

function logPurchaseEvent(transactionAttributes, product, attrs, customFlags) {
    var event = Ecommerce.createCommerceEventObject(customFlags);

    if (event) {
        event.EventName += Ecommerce.getProductActionEventName(Types.ProductActionType.Purchase);
        event.EventCategory = Types.CommerceEventType.ProductPurchase;
        event.ProductAction = {
            ProductActionType: Types.ProductActionType.Purchase
        };
        event.ProductAction.ProductList = Ecommerce.buildProductList(event, product);

        Ecommerce.convertTransactionAttributesToProductAction(transactionAttributes, event.ProductAction);

        logCommerceEvent(event, attrs);
    }
}

function logRefundEvent(transactionAttributes, product, attrs, customFlags) {
    if (!transactionAttributes) {
        mParticle.Logger.error(Messages.ErrorMessages.TransactionRequired);
        return;
    }

    var event = Ecommerce.createCommerceEventObject(customFlags);

    if (event) {
        event.EventName += Ecommerce.getProductActionEventName(Types.ProductActionType.Refund);
        event.EventCategory = Types.CommerceEventType.ProductRefund;
        event.ProductAction = {
            ProductActionType: Types.ProductActionType.Refund
        };
        event.ProductAction.ProductList = Ecommerce.buildProductList(event, product);

        Ecommerce.convertTransactionAttributesToProductAction(transactionAttributes, event.ProductAction);

        logCommerceEvent(event, attrs);
    }
}

function logPromotionEvent(promotionType, promotion, attrs, customFlags) {
    var event = Ecommerce.createCommerceEventObject(customFlags);

    if (event) {
        event.EventName += Ecommerce.getPromotionActionEventName(promotionType);
        event.EventCategory = Ecommerce.convertPromotionActionToEventType(promotionType);
        event.PromotionAction = {
            PromotionActionType: promotionType,
            PromotionList: [promotion]
        };

        logCommerceEvent(event, attrs);
    }
}

function logImpressionEvent(impression, attrs, customFlags) {
    var event = Ecommerce.createCommerceEventObject(customFlags);

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
                ProductList: Array.isArray(impression.Product) ? impression.Product : [impression.Product]
            });
        });

        logCommerceEvent(event, attrs);
    }
}


function logCommerceEvent(commerceEvent, attrs) {
    mParticle.Logger.verbose(Messages.InformationMessages.StartingLogCommerceEvent);

    attrs = Helpers.sanitizeAttributes(attrs);

    if (Helpers.canLog()) {
        if (mParticle.Store.webviewBridgeEnabled) {
            // Don't send shopping cart to parent sdks
            commerceEvent.ShoppingCart = {};
        }

        if (attrs) {
            commerceEvent.EventAttributes = attrs;
        }

        sendEventToServer(commerceEvent);
        Persistence.update();
    }
    else {
        mParticle.Logger.verbose(Messages.InformationMessages.AbandonLogEvent);
    }
}

function addEventHandler(domEvent, selector, eventName, data, eventType) {
    var elements = [],
        handler = function(e) {
            var timeoutHandler = function() {
                if (element.href) {
                    window.location.href = element.href;
                }
                else if (element.submit) {
                    element.submit();
                }
            };

            mParticle.Logger.verbose('DOM event triggered, handling event');

            logEvent({
                messageType: Types.MessageType.PageEvent,
                name: typeof eventName === 'function' ? eventName(element) : eventName,
                data: typeof data === 'function' ? data(element) : data,
                eventType: eventType || Types.EventType.Other
            });

            // TODO: Handle middle-clicks and special keys (ctrl, alt, etc)
            if ((element.href && element.target !== '_blank') || element.submit) {
                // Give xmlhttprequest enough time to execute before navigating a link or submitting form

                if (e.preventDefault) {
                    e.preventDefault();
                }
                else {
                    e.returnValue = false;
                }

                setTimeout(timeoutHandler, mParticle.Store.SDKConfig.timeout);
            }
        },
        element,
        i;

    if (!selector) {
        mParticle.Logger.error('Can\'t bind event, selector is required');
        return;
    }

    // Handle a css selector string or a dom element
    if (typeof selector === 'string') {
        elements = document.querySelectorAll(selector);
    }
    else if (selector.nodeType) {
        elements = [selector];
    }

    if (elements.length) {
        mParticle.Logger.verbose('Found ' +
            elements.length +
            ' element' +
            (elements.length > 1 ? 's' : '') +
            ', attaching event handlers');

        for (i = 0; i < elements.length; i++) {
            element = elements[i];

            if (element.addEventListener) {
                element.addEventListener(domEvent, handler, false);
            }
            else if (element.attachEvent) {
                element.attachEvent('on' + domEvent, handler);
            }
            else {
                element['on' + domEvent] = handler;
            }
        }
    }
    else {
        mParticle.Logger.verbose('No elements found');
    }
}

export default {
    logEvent: logEvent,
    startTracking: startTracking,
    stopTracking: stopTracking,
    logCheckoutEvent: logCheckoutEvent,
    logProductActionEvent: logProductActionEvent,
    logPurchaseEvent: logPurchaseEvent,
    logRefundEvent: logRefundEvent,
    logPromotionEvent: logPromotionEvent,
    logImpressionEvent: logImpressionEvent,
    logOptOut: logOptOut,
    logAST: logAST,
    addEventHandler: addEventHandler
};