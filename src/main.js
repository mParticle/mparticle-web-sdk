//
//  Copyright 2017 mParticle, Inc.
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//
//  Uses portions of code from jQuery
//  jQuery v1.10.2 | (c) 2005, 2013 jQuery Foundation, Inc. | jquery.org/license

import Polyfill from './polyfill';
import Types from './types';
import Constants from './constants';
import Helpers from './helpers';
import NativeSdkHelpers from './nativeSdkHelpers';
import CookieSyncManager from './cookieSyncManager';
import SessionManager from './sessionManager';
import Ecommerce from './ecommerce';
import Store from './store';
import Logger from './logger';
import Persistence from './persistence';
import Events from './events';
import Migrations from './migrations';
import Forwarders from './forwarders';
import startForwardingStatsTimer from './forwardingStatsUploader';
import Identity from './identity';
import ApiClient from './apiClient';
import Consent from './consent';

var getDeviceId = Persistence.getDeviceId,
    Messages = Constants.Messages,
    Validators = Helpers.Validators,
    mParticleUser = Identity.mParticleUser,
    IdentityAPI = Identity.IdentityAPI,
    mParticleUserCart = Identity.mParticleUserCart,
    HTTPCodes = Constants.HTTPCodes;

if (!Array.prototype.forEach) {
    Array.prototype.forEach = Polyfill.forEach;
}

if (!Array.prototype.map) {
    Array.prototype.map = Polyfill.map;
}

if (!Array.prototype.filter) {
    Array.prototype.filter = Polyfill.filter;
}

if (!Array.isArray) {
    Array.prototype.isArray = Polyfill.isArray;
}

/**
 * Invoke these methods on the mParticle object.
 * Example: mParticle.endSession()
 *
 * @class mParticle
 */

var mParticle = {
    config: window.mParticle ? window.mParticle.config : {},
    Store: {},
    getDeviceId: getDeviceId,
    generateHash: Helpers.generateHash,
    sessionManager: SessionManager,
    cookieSyncManager: CookieSyncManager,
    persistence: Persistence,
    isIOS:
        window.mParticle && window.mParticle.isIOS
            ? window.mParticle.isIOS
            : false,
    Identity: IdentityAPI,
    Validators: Validators,
    _Identity: Identity,
    _IdentityRequest: Identity.IdentityRequest,
    IdentityType: Types.IdentityType,
    EventType: Types.EventType,
    CommerceEventType: Types.CommerceEventType,
    PromotionType: Types.PromotionActionType,
    ProductActionType: Types.ProductActionType,
    /**
     * Initializes the mParticle SDK
     *
     * @method init
     * @param {String} apiKey your mParticle assigned API key
     * @param {Object} [options] an options object for additional configuration
     */
    init: function(apiKey, config) {
        if (!config && window.mParticle.config) {
            window.console.warn(
                'You did not pass a config object to mParticle.init(). Attempting to use the window.mParticle.config if it exists. Please note that in a future release, this may not work and mParticle will not initialize properly'
            );
            config = window.mParticle.config;
        }

        runPreConfigFetchInitialization(apiKey, config);

        // /config code - Fetch config when requestConfig = true, otherwise, proceed with SDKInitialization
        // Since fetching the configuration is asynchronous, we must pass completeSDKInitialization
        // to it for it to be run after fetched
        if (config) {
            if (
                !config.hasOwnProperty('requestConfig') ||
                config.requestConfig
            ) {
                ApiClient.getSDKConfiguration(
                    apiKey,
                    config,
                    completeSDKInitialization
                );
            } else {
                completeSDKInitialization(apiKey, config);
            }
        } else {
            window.console.error(
                'No config available on the window, please pass a config object to mParticle.init()'
            );
            return;
        }
    },
    setLogLevel: function(newLogLevel) {
        mParticle.Logger.setLogLevel(newLogLevel);
    },
    /**
     * Completely resets the state of the SDK. mParticle.init(apiKey, window.mParticle.config) will need to be called again.
     * @method reset
     * @param {Boolean} keepPersistence if passed as true, this method will only reset the in-memory SDK state.
     */
    reset: function(config, keepPersistence) {
        if (mParticle.Store) {
            delete mParticle.Store;
        }
        mParticle.Store = new Store(config);
        mParticle.Store.isLocalStorageAvailable = Persistence.determineLocalStorageAvailability(
            window.localStorage
        );
        Events.stopTracking();
        if (!keepPersistence) {
            Persistence.resetPersistence();
        }
        Persistence.forwardingStatsBatches.uploadsTable = {};
        Persistence.forwardingStatsBatches.forwardingStatsEventQueue = [];
        mParticle.preInit = {
            readyQueue: [],
            pixelConfigurations: [],
            integrationDelays: {},
            forwarderConstructors: [],
            isDevelopmentMode: false,
        };
    },
    ready: function(f) {
        if (mParticle.Store.isInitialized && typeof f === 'function') {
            f();
        } else {
            mParticle.preInit.readyQueue.push(f);
        }
    },
    /**
     * Returns the mParticle SDK version number
     * @method getVersion
     * @return {String} mParticle SDK version number
     */
    getVersion: function() {
        return Constants.sdkVersion;
    },
    /**
     * Sets the app version
     * @method setAppVersion
     * @param {String} version version number
     */
    setAppVersion: function(version) {
        mParticle.Store.SDKConfig.appVersion = version;
        Persistence.update();
    },
    /**
     * Gets the app name
     * @method getAppName
     * @return {String} App name
     */
    getAppName: function() {
        return mParticle.Store.SDKConfig.appName;
    },
    /**
     * Sets the app name
     * @method setAppName
     * @param {String} name App Name
     */
    setAppName: function(name) {
        mParticle.Store.SDKConfig.appName = name;
    },
    /**
     * Gets the app version
     * @method getAppVersion
     * @return {String} App version
     */
    getAppVersion: function() {
        return mParticle.Store.SDKConfig.appVersion;
    },
    /**
     * Stops tracking the location of the user
     * @method stopTrackingLocation
     */
    stopTrackingLocation: function() {
        SessionManager.resetSessionTimer();
        Events.stopTracking();
    },
    /**
     * Starts tracking the location of the user
     * @method startTrackingLocation
     * @param {Function} [callback] A callback function that is called when the location is either allowed or rejected by the user. A position object of schema {coords: {latitude: number, longitude: number}} is passed to the callback
     */
    startTrackingLocation: function(callback) {
        if (!Validators.isFunction(callback)) {
            mParticle.Logger.warning(
                'Warning: Location tracking is triggered, but not including a callback into the `startTrackingLocation` may result in events logged too quickly and not being associated with a location.'
            );
        }

        SessionManager.resetSessionTimer();
        Events.startTracking(callback);
    },
    /**
     * Sets the position of the user
     * @method setPosition
     * @param {Number} lattitude lattitude digit
     * @param {Number} longitude longitude digit
     */
    setPosition: function(lat, lng) {
        SessionManager.resetSessionTimer();
        if (typeof lat === 'number' && typeof lng === 'number') {
            mParticle.Store.currentPosition = {
                lat: lat,
                lng: lng,
            };
        } else {
            mParticle.Logger.error(
                'Position latitude and/or longitude must both be of type number'
            );
        }
    },
    /**
     * Starts a new session
     * @method startNewSession
     */
    startNewSession: function() {
        SessionManager.startNewSession();
    },
    /**
     * Ends the current session
     * @method endSession
     */
    endSession: function() {
        // Sends true as an over ride vs when endSession is called from the setInterval
        SessionManager.endSession(true);
    },

    /**
     * Logs a Base Event to mParticle's servers
     * @param {Object} event Base Event Object
     */
    logBaseEvent: function(event) {
        SessionManager.resetSessionTimer();
        if (typeof event.name !== 'string') {
            mParticle.Logger.error(Messages.ErrorMessages.EventNameInvalidType);
            return;
        }

        if (!event.eventType) {
            event.eventType = Types.EventType.Unknown;
        }

        if (!Helpers.canLog()) {
            mParticle.Logger.error(Messages.ErrorMessages.LoggingDisabled);
            return;
        }

        Events.logEvent(event);
    },
    /**
     * Logs an event to mParticle's servers
     * @method logEvent
     * @param {String} eventName The name of the event
     * @param {Number} [eventType] The eventType as seen [here](http://docs.mparticle.com/developers/sdk/web/event-tracking#event-type)
     * @param {Object} [eventInfo] Attributes for the event
     * @param {Object} [customFlags] Additional customFlags
     */
    logEvent: function(eventName, eventType, eventInfo, customFlags) {
        SessionManager.resetSessionTimer();
        if (typeof eventName !== 'string') {
            mParticle.Logger.error(Messages.ErrorMessages.EventNameInvalidType);
            return;
        }

        if (!eventType) {
            eventType = Types.EventType.Unknown;
        }

        if (!Helpers.isEventType(eventType)) {
            mParticle.Logger.error(
                'Invalid event type: ' +
                    eventType +
                    ', must be one of: \n' +
                    JSON.stringify(Types.EventType)
            );
            return;
        }

        if (!Helpers.canLog()) {
            mParticle.Logger.error(Messages.ErrorMessages.LoggingDisabled);
            return;
        }

        Events.logEvent({
            messageType: Types.MessageType.PageEvent,
            name: eventName,
            data: eventInfo,
            eventType: eventType,
            customFlags: customFlags,
        });
    },
    /**
     * Used to log custom errors
     *
     * @method logError
     * @param {String or Object} error The name of the error (string), or an object formed as follows {name: 'exampleName', message: 'exampleMessage', stack: 'exampleStack'}
     * @param {Object} [attrs] Custom attrs to be passed along with the error event; values must be string, number, or boolean
     */
    logError: function(error, attrs) {
        SessionManager.resetSessionTimer();
        if (!error) {
            return;
        }

        if (typeof error === 'string') {
            error = {
                message: error,
            };
        }

        var data = {
            m: error.message ? error.message : error,
            s: 'Error',
            t: error.stack,
        };

        if (attrs) {
            var sanitized = Helpers.sanitizeAttributes(attrs);
            for (var prop in sanitized) {
                data[prop] = sanitized[prop];
            }
        }

        Events.logEvent({
            messageType: Types.MessageType.CrashReport,
            name: error.name ? error.name : 'Error',
            data: data,
            eventType: Types.EventType.Other,
        });
    },
    /**
     * Logs `click` events
     * @method logLink
     * @param {String} selector The selector to add a 'click' event to (ex. #purchase-event)
     * @param {String} [eventName] The name of the event
     * @param {Number} [eventType] The eventType as seen [here](http://docs.mparticle.com/developers/sdk/javascript/event-tracking#event-type)
     * @param {Object} [eventInfo] Attributes for the event
     */
    logLink: function(selector, eventName, eventType, eventInfo) {
        SessionManager.resetSessionTimer();
        Events.addEventHandler(
            'click',
            selector,
            eventName,
            eventInfo,
            eventType
        );
    },
    /**
     * Logs `submit` events
     * @method logForm
     * @param {String} selector The selector to add the event handler to (ex. #search-event)
     * @param {String} [eventName] The name of the event
     * @param {Number} [eventType] The eventType as seen [here](http://docs.mparticle.com/developers/sdk/javascript/event-tracking#event-type)
     * @param {Object} [eventInfo] Attributes for the event
     */
    logForm: function(selector, eventName, eventType, eventInfo) {
        SessionManager.resetSessionTimer();
        Events.addEventHandler(
            'submit',
            selector,
            eventName,
            eventInfo,
            eventType
        );
    },
    /**
     * Logs a page view
     * @method logPageView
     * @param {String} eventName The name of the event. Defaults to 'PageView'.
     * @param {Object} [attrs] Attributes for the event
     * @param {Object} [customFlags] Custom flags for the event
     */
    logPageView: function(eventName, attrs, customFlags) {
        SessionManager.resetSessionTimer();

        if (Helpers.canLog()) {
            if (!Validators.isStringOrNumber(eventName)) {
                eventName = 'PageView';
            }
            if (!attrs) {
                attrs = {
                    hostname: window.location.hostname,
                    title: window.document.title,
                };
            } else if (!Helpers.isObject(attrs)) {
                mParticle.Logger.error(
                    'The attributes argument must be an object. A ' +
                        typeof attrs +
                        ' was entered. Please correct and retry.'
                );
                return;
            }
            if (customFlags && !Helpers.isObject(customFlags)) {
                mParticle.Logger.error(
                    'The customFlags argument must be an object. A ' +
                        typeof customFlags +
                        ' was entered. Please correct and retry.'
                );
                return;
            }
        }

        Events.logEvent({
            messageType: Types.MessageType.PageView,
            name: eventName,
            data: attrs,
            eventType: Types.EventType.Unknown,
            customFlags: customFlags,
        });
    },
    Consent: {
        createGDPRConsent: Consent.createGDPRConsent,
        createConsentState: Consent.createConsentState,
    },
    /**
     * Invoke these methods on the mParticle.eCommerce object.
     * Example: mParticle.eCommerce.createImpresion(...)
     * @class mParticle.eCommerce
     */
    eCommerce: {
        /**
         * Invoke these methods on the mParticle.eCommerce.Cart object.
         * Example: mParticle.eCommerce.Cart.add(...)
         * @class mParticle.eCommerce.Cart
         */
        Cart: {
            /**
             * Adds a product to the cart
             * @method add
             * @param {Object} product The product you want to add to the cart
             * @param {Boolean} [logEventBoolean] Option to log the event to mParticle's servers. If blank, no logging occurs.
             */
            add: function(product, logEventBoolean) {
                var mpid,
                    currentUser = mParticle.Identity.getCurrentUser();
                if (currentUser) {
                    mpid = currentUser.getMPID();
                }
                mParticleUserCart(mpid).add(product, logEventBoolean);
            },
            /**
             * Removes a product from the cart
             * @method remove
             * @param {Object} product The product you want to add to the cart
             * @param {Boolean} [logEventBoolean] Option to log the event to mParticle's servers. If blank, no logging occurs.
             */
            remove: function(product, logEventBoolean) {
                var mpid,
                    currentUser = mParticle.Identity.getCurrentUser();
                if (currentUser) {
                    mpid = currentUser.getMPID();
                }
                mParticleUserCart(mpid).remove(product, logEventBoolean);
            },
            /**
             * Clears the cart
             * @method clear
             */
            clear: function() {
                var mpid,
                    currentUser = mParticle.Identity.getCurrentUser();
                if (currentUser) {
                    mpid = currentUser.getMPID();
                }
                mParticleUserCart(mpid).clear();
            },
        },
        /**
         * Sets the currency code
         * @for mParticle.eCommerce
         * @method setCurrencyCode
         * @param {String} code The currency code
         */
        setCurrencyCode: function(code) {
            if (typeof code !== 'string') {
                mParticle.Logger.error('Code must be a string');
                return;
            }
            SessionManager.resetSessionTimer();
            mParticle.Store.currencyCode = code;
        },
        /**
         * Creates a product
         * @for mParticle.eCommerce
         * @method createProduct
         * @param {String} name product name
         * @param {String} sku product sku
         * @param {Number} price product price
         * @param {Number} [quantity] product quantity. If blank, defaults to 1.
         * @param {String} [variant] product variant
         * @param {String} [category] product category
         * @param {String} [brand] product brand
         * @param {Number} [position] product position
         * @param {String} [coupon] product coupon
         * @param {Object} [attributes] product attributes
         */
        createProduct: function(
            name,
            sku,
            price,
            quantity,
            variant,
            category,
            brand,
            position,
            coupon,
            attributes
        ) {
            SessionManager.resetSessionTimer();
            return Ecommerce.createProduct(
                name,
                sku,
                price,
                quantity,
                variant,
                category,
                brand,
                position,
                coupon,
                attributes
            );
        },
        /**
         * Creates a promotion
         * @for mParticle.eCommerce
         * @method createPromotion
         * @param {String} id a unique promotion id
         * @param {String} [creative] promotion creative
         * @param {String} [name] promotion name
         * @param {Number} [position] promotion position
         */
        createPromotion: function(id, creative, name, position) {
            SessionManager.resetSessionTimer();
            return Ecommerce.createPromotion(id, creative, name, position);
        },
        /**
         * Creates a product impression
         * @for mParticle.eCommerce
         * @method createImpression
         * @param {String} name impression name
         * @param {Object} product the product for which an impression is being created
         */
        createImpression: function(name, product) {
            SessionManager.resetSessionTimer();
            return Ecommerce.createImpression(name, product);
        },
        /**
         * Creates a transaction attributes object to be used with a checkout
         * @for mParticle.eCommerce
         * @method createTransactionAttributes
         * @param {String or Number} id a unique transaction id
         * @param {String} [affiliation] affilliation
         * @param {String} [couponCode] the coupon code for which you are creating transaction attributes
         * @param {Number} [revenue] total revenue for the product being purchased
         * @param {String} [shipping] the shipping method
         * @param {Number} [tax] the tax amount
         */
        createTransactionAttributes: function(
            id,
            affiliation,
            couponCode,
            revenue,
            shipping,
            tax
        ) {
            SessionManager.resetSessionTimer();
            return Ecommerce.createTransactionAttributes(
                id,
                affiliation,
                couponCode,
                revenue,
                shipping,
                tax
            );
        },
        /**
         * Logs a checkout action
         * @for mParticle.eCommerce
         * @method logCheckout
         * @param {Number} step checkout step number
         * @param {Object} options
         * @param {Object} attrs
         * @param {Object} [customFlags] Custom flags for the event
         */
        logCheckout: function(step, options, attrs, customFlags) {
            SessionManager.resetSessionTimer();
            Events.logCheckoutEvent(step, options, attrs, customFlags);
        },
        /**
         * Logs a product action
         * @for mParticle.eCommerce
         * @method logProductAction
         * @param {Number} productActionType product action type as found [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/src/types.js#L206-L218)
         * @param {Object} product the product for which you are creating the product action
         * @param {Object} [attrs] attributes related to the product action
         * @param {Object} [customFlags] Custom flags for the event
         */
        logProductAction: function(
            productActionType,
            product,
            attrs,
            customFlags
        ) {
            SessionManager.resetSessionTimer();
            Events.logProductActionEvent(
                productActionType,
                product,
                attrs,
                customFlags
            );
        },
        /**
         * Logs a product purchase
         * @for mParticle.eCommerce
         * @method logPurchase
         * @param {Object} transactionAttributes transactionAttributes object
         * @param {Object} product the product being purchased
         * @param {Boolean} [clearCart] boolean to clear the cart after logging or not. Defaults to false
         * @param {Object} [attrs] other attributes related to the product purchase
         * @param {Object} [customFlags] Custom flags for the event
         */
        logPurchase: function(
            transactionAttributes,
            product,
            clearCart,
            attrs,
            customFlags
        ) {
            if (!transactionAttributes || !product) {
                mParticle.Logger.error(Messages.ErrorMessages.BadLogPurchase);
                return;
            }
            SessionManager.resetSessionTimer();
            Events.logPurchaseEvent(
                transactionAttributes,
                product,
                attrs,
                customFlags
            );

            if (clearCart === true) {
                mParticle.eCommerce.Cart.clear();
            }
        },
        /**
         * Logs a product promotion
         * @for mParticle.eCommerce
         * @method logPromotion
         * @param {Number} type the promotion type as found [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/src/types.js#L275-L279)
         * @param {Object} promotion promotion object
         * @param {Object} [attrs] boolean to clear the cart after logging or not
         * @param {Object} [customFlags] Custom flags for the event
         */
        logPromotion: function(type, promotion, attrs, customFlags) {
            SessionManager.resetSessionTimer();
            Events.logPromotionEvent(type, promotion, attrs, customFlags);
        },
        /**
         * Logs a product impression
         * @for mParticle.eCommerce
         * @method logImpression
         * @param {Object} impression product impression object
         * @param {Object} attrs attributes related to the impression log
         * @param {Object} [customFlags] Custom flags for the event
         */
        logImpression: function(impression, attrs, customFlags) {
            SessionManager.resetSessionTimer();
            Events.logImpressionEvent(impression, attrs, customFlags);
        },
        /**
         * Logs a refund
         * @for mParticle.eCommerce
         * @method logRefund
         * @param {Object} transactionAttributes transaction attributes related to the refund
         * @param {Object} product product being refunded
         * @param {Boolean} [clearCart] boolean to clear the cart after refund is logged. Defaults to false.
         * @param {Object} [attrs] attributes related to the refund
         * @param {Object} [customFlags] Custom flags for the event
         */
        logRefund: function(
            transactionAttributes,
            product,
            clearCart,
            attrs,
            customFlags
        ) {
            SessionManager.resetSessionTimer();
            Events.logRefundEvent(
                transactionAttributes,
                product,
                attrs,
                customFlags
            );

            if (clearCart === true) {
                mParticle.eCommerce.Cart.clear();
            }
        },
        expandCommerceEvent: function(event) {
            SessionManager.resetSessionTimer();
            return Ecommerce.expandCommerceEvent(event);
        },
    },
    /**
     * Sets a session attribute
     * @for mParticle
     * @method setSessionAttribute
     * @param {String} key key for session attribute
     * @param {String or Number} value value for session attribute
     */
    setSessionAttribute: function(key, value) {
        SessionManager.resetSessionTimer();
        // Logs to cookie
        // And logs to in-memory object
        // Example: mParticle.setSessionAttribute('location', '33431');
        if (Helpers.canLog()) {
            if (!Validators.isValidAttributeValue(value)) {
                mParticle.Logger.error(Messages.ErrorMessages.BadAttribute);
                return;
            }

            if (!Validators.isValidKeyValue(key)) {
                mParticle.Logger.error(Messages.ErrorMessages.BadKey);
                return;
            }

            if (mParticle.Store.webviewBridgeEnabled) {
                NativeSdkHelpers.sendToNative(
                    Constants.NativeSdkPaths.SetSessionAttribute,
                    JSON.stringify({ key: key, value: value })
                );
            } else {
                var existingProp = Helpers.findKeyInObject(
                    mParticle.Store.sessionAttributes,
                    key
                );

                if (existingProp) {
                    key = existingProp;
                }

                mParticle.Store.sessionAttributes[key] = value;
                Persistence.update();

                Forwarders.applyToForwarders('setSessionAttribute', [
                    key,
                    value,
                ]);
            }
        }
    },
    /**
     * Set opt out of logging
     * @for mParticle
     * @method setOptOut
     * @param {Boolean} isOptingOut boolean to opt out or not. When set to true, opt out of logging.
     */
    setOptOut: function(isOptingOut) {
        SessionManager.resetSessionTimer();
        mParticle.Store.isEnabled = !isOptingOut;

        Events.logOptOut();
        Persistence.update();

        if (mParticle.Store.activeForwarders.length) {
            mParticle.Store.activeForwarders.forEach(function(forwarder) {
                if (forwarder.setOptOut) {
                    var result = forwarder.setOptOut(isOptingOut);

                    if (result) {
                        mParticle.Logger.verbose(result);
                    }
                }
            });
        }
    },
    /**
     * Set or remove the integration attributes for a given integration ID.
     * Integration attributes are keys and values specific to a given integration. For example,
     * many integrations have their own internal user/device ID. mParticle will store integration attributes
     * for a given device, and will be able to use these values for server-to-server communication to services.
     * This is often useful when used in combination with a server-to-server feed, allowing the feed to be enriched
     * with the necessary integration attributes to be properly forwarded to the given integration.
     * @for mParticle
     * @method setIntegrationAttribute
     * @param {Number} integrationId mParticle integration ID
     * @param {Object} attrs a map of attributes that will replace any current attributes. The keys are predefined by mParticle.
     * Please consult with the mParticle docs or your solutions consultant for the correct value. You may
     * also pass a null or empty map here to remove all of the attributes.
     */
    setIntegrationAttribute: function(integrationId, attrs) {
        if (typeof integrationId !== 'number') {
            mParticle.Logger.error('integrationId must be a number');
            return;
        }
        if (attrs === null) {
            mParticle.Store.integrationAttributes[integrationId] = {};
        } else if (Helpers.isObject(attrs)) {
            if (Object.keys(attrs).length === 0) {
                mParticle.Store.integrationAttributes[integrationId] = {};
            } else {
                for (var key in attrs) {
                    if (typeof key === 'string') {
                        if (typeof attrs[key] === 'string') {
                            if (
                                Helpers.isObject(
                                    mParticle.Store.integrationAttributes[
                                        integrationId
                                    ]
                                )
                            ) {
                                mParticle.Store.integrationAttributes[
                                    integrationId
                                ][key] = attrs[key];
                            } else {
                                mParticle.Store.integrationAttributes[
                                    integrationId
                                ] = {};
                                mParticle.Store.integrationAttributes[
                                    integrationId
                                ][key] = attrs[key];
                            }
                        } else {
                            mParticle.Logger.error(
                                'Values for integration attributes must be strings. You entered a ' +
                                    typeof attrs[key]
                            );
                            continue;
                        }
                    } else {
                        mParticle.Logger.error(
                            'Keys must be strings, you entered a ' + typeof key
                        );
                        continue;
                    }
                }
            }
        } else {
            mParticle.Logger.error(
                'Attrs must be an object with keys and values. You entered a ' +
                    typeof attrs
            );
            return;
        }
        Persistence.update();
    },
    /**
     * Get integration attributes for a given integration ID.
     * @method getIntegrationAttributes
     * @param {Number} integrationId mParticle integration ID
     * @return {Object} an object map of the integrationId's attributes
     */
    getIntegrationAttributes: function(integrationId) {
        if (mParticle.Store.integrationAttributes[integrationId]) {
            return mParticle.Store.integrationAttributes[integrationId];
        } else {
            return {};
        }
    },
    addForwarder: function(forwarder) {
        mParticle.preInit.forwarderConstructors.push(forwarder);
    },
    configurePixel: function(settings) {
        Forwarders.configurePixel(settings);
    },
    _getActiveForwarders: function() {
        return mParticle.Store.activeForwarders;
    },
    _getIntegrationDelays: function() {
        return mParticle.preInit.integrationDelays;
    },
    _setIntegrationDelay: function(module, boolean) {
        mParticle.preInit.integrationDelays[module] = boolean;
    },
};

function completeSDKInitialization(apiKey, config) {
    mParticle.Store.configurationLoaded = true;
    if (mParticle.Store.webviewBridgeEnabled) {
        NativeSdkHelpers.sendToNative(
            Constants.NativeSdkPaths.SetSessionAttribute,
            JSON.stringify({ key: '$src_env', value: 'webview' })
        );
        if (apiKey) {
            NativeSdkHelpers.sendToNative(
                Constants.NativeSdkPaths.SetSessionAttribute,
                JSON.stringify({ key: '$src_key', value: apiKey })
            );
        }
    } else {
        var currentUser;

        // If no initialIdentityRequest is passed in, we set the user identities to what is currently in cookies for the identify request
        if (
            (Helpers.isObject(mParticle.Store.SDKConfig.identifyRequest) &&
                Helpers.isObject(
                    mParticle.Store.SDKConfig.identifyRequest.userIdentities
                ) &&
                Object.keys(
                    mParticle.Store.SDKConfig.identifyRequest.userIdentities
                ).length === 0) ||
            !mParticle.Store.SDKConfig.identifyRequest
        ) {
            var modifiedUIforIdentityRequest = {};

            currentUser = mParticle.Identity.getCurrentUser();
            if (currentUser) {
                var identities =
                    currentUser.getUserIdentities().userIdentities || {};
                for (var identityKey in identities) {
                    if (identities.hasOwnProperty(identityKey)) {
                        modifiedUIforIdentityRequest[identityKey] =
                            identities[identityKey];
                    }
                }
            }

            mParticle.Store.SDKConfig.identifyRequest = {
                userIdentities: modifiedUIforIdentityRequest,
            };
        }

        // If migrating from pre-IDSync to IDSync, a sessionID will exist and an identify request will not have been fired, so we need this check
        if (mParticle.Store.migratingToIDSyncCookies) {
            IdentityAPI.identify(
                mParticle.Store.SDKConfig.identifyRequest,
                mParticle.Store.SDKConfig.identityCallback
            );
            mParticle.Store.migratingToIDSyncCookies = false;
        }

        currentUser = IdentityAPI.getCurrentUser();

        if (Helpers.getFeatureFlag(Constants.FeatureFlags.ReportBatching)) {
            startForwardingStatsTimer();
        }

        Forwarders.processForwarders(config, ApiClient.prepareForwardingStats);

        // Call mParticle.Store.SDKConfig.identityCallback when identify was not called due to a reload or a sessionId already existing
        if (
            !mParticle.Store.identifyCalled &&
            mParticle.Store.SDKConfig.identityCallback &&
            currentUser &&
            currentUser.getMPID()
        ) {
            mParticle.Store.SDKConfig.identityCallback({
                httpCode: HTTPCodes.activeSession,
                getUser: function() {
                    return mParticleUser(currentUser.getMPID());
                },
                getPreviousUser: function() {
                    var users = mParticle.Identity.getUsers();
                    var mostRecentUser = users.shift();
                    if (
                        mostRecentUser &&
                        currentUser &&
                        mostRecentUser.getMPID() === currentUser.getMPID()
                    ) {
                        mostRecentUser = users.shift();
                    }
                    return mostRecentUser || null;
                },
                body: {
                    mpid: currentUser.getMPID(),
                    is_logged_in: mParticle.Store.isLoggedIn,
                    matched_identities: currentUser.getUserIdentities()
                        .userIdentities,
                    context: null,
                    is_ephemeral: false,
                },
            });
        }

        mParticle.sessionManager.initialize();
        Events.logAST();
    }
    // Call any functions that are waiting for the library to be initialized
    if (mParticle.preInit.readyQueue && mParticle.preInit.readyQueue.length) {
        mParticle.preInit.readyQueue.forEach(function(readyQueueItem) {
            if (Validators.isFunction(readyQueueItem)) {
                readyQueueItem();
            } else if (Array.isArray(readyQueueItem)) {
                processPreloadedItem(readyQueueItem);
            }
        });

        mParticle.preInit.readyQueue = [];
    }
    mParticle.Store.isInitialized = true;

    if (mParticle.Store.isFirstRun) {
        mParticle.Store.isFirstRun = false;
    }
}

function runPreConfigFetchInitialization(apiKey, config) {
    mParticle.Logger = new Logger(config);
    mParticle.Store = new Store(config, mParticle.Logger);
    mParticle.Store.devToken = apiKey || null;
    mParticle.Logger.verbose(
        Messages.InformationMessages.StartingInitialization
    );

    //check to see if localStorage is available for migrating purposes
    mParticle.Store.isLocalStorageAvailable = Persistence.determineLocalStorageAvailability(
        window.localStorage
    );

    mParticle.Store.webviewBridgeEnabled = NativeSdkHelpers.isWebviewEnabled(
        mParticle.Store.SDKConfig.requiredWebviewBridgeName,
        mParticle.Store.SDKConfig.minWebviewBridgeVersion
    );

    if (!mParticle.Store.webviewBridgeEnabled) {
        // Migrate any cookies from previous versions to current cookie version
        Migrations.migrate();

        // Load any settings/identities/attributes from cookie or localStorage
        Persistence.initializeStorage();
    }
}

function processPreloadedItem(readyQueueItem) {
    var args = readyQueueItem,
        method = args.splice(0, 1)[0];
    // if the first argument is a method on the base mParticle object, run it
    if (mParticle[args[0]]) {
        mParticle[method].apply(this, args);
        // otherwise, the method is on either eCommerce or Identity objects, ie. "eCommerce.setCurrencyCode", "Identity.login"
    } else {
        var methodArray = method.split('.');
        try {
            var computedMPFunction = mParticle;
            for (var i = 0; i < methodArray.length; i++) {
                var currentMethod = methodArray[i];
                computedMPFunction = computedMPFunction[currentMethod];
            }
            computedMPFunction.apply(this, args);
        } catch (e) {
            mParticle.Logger.verbose(
                'Unable to compute proper mParticle function ' + e
            );
        }
    }
}

mParticle.preInit = {
    readyQueue: [],
    integrationDelays: {},
    forwarderConstructors: [],
};

if (window.mParticle && window.mParticle.config) {
    if (window.mParticle.config.hasOwnProperty('rq')) {
        mParticle.preInit.readyQueue = window.mParticle.config.rq;
    }
}

window.mParticle = mParticle;

export default mParticle;
