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

var Polyfill = require('./polyfill'),
    Types = require('./types'),
    Constants = require('./constants'),
    Helpers = require('./helpers'),
    CookieSyncManager = require('./cookieSyncManager'),
    SessionManager = require('./sessionManager'),
    Ecommerce = require('./ecommerce'),
    MP = require('./mp'),
    Persistence = require('./persistence'),
    Events = require('./events'),
    Messages = Constants.Messages,
    Validators = Helpers.Validators,
    Migrations = require('./migrations'),
    Forwarders = require('./forwarders'),
    identify = require('./identity').identify,
    IdentityRequest = require('./identity').IdentityRequest,
    Identity = require('./identity').Identity,
    IdentityAPI = require('./identity').IdentityAPI,
    mParticleUserCart = require('./identity').mParticleUserCart;

(function(window) {
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

    function getDeviceId() {
        return MP.deviceId;
    }

    var mParticle = {
        useNativeSdk: true,
        isIOS: false,
        isDevelopmentMode: false,
        useCookieStorage: false,
        maxProducts: Constants.DefaultConfig.MaxProducts,
        identifyRequest: {},
        getDeviceId: getDeviceId,
        generateHash: Helpers.generateHash,
        sessionManager: SessionManager,
        cookieSyncManager: CookieSyncManager,
        persistence: Persistence,
        migrations: Migrations,
        Identity: IdentityAPI,
        Validators: Validators,
        _Identity: Identity,
        _IdentityRequest: IdentityRequest,
        IdentityType: Types.IdentityType,
        EventType: Types.EventType,
        CommerceEventType: Types.CommerceEventType,
        PromotionType: Types.PromotionActionType,
        ProductActionType: Types.ProductActionType,
        init: function(apiKey) {
            var config;
            MP.initialIdentifyRequest = mParticle.identifyRequest;
            MP.devToken = apiKey || null;
            Helpers.logDebug(Messages.InformationMessages.StartingInitialization);

            // Set configuration to default settings
            Helpers.mergeConfig({});

            // Migrate any cookies from previous versions to current cookie version
            Migrations.migrate();

            // Load any settings/identities/attributes from cookie or localStorage
            Persistence.initializeStorage();

            MP.deviceId = Persistence.retrieveDeviceId();
            // If no identity is passed in, we set the user identities to what is currently in cookies for the identify request
            if ((Helpers.isObject(mParticle.identifyRequest) && Object.keys(mParticle.identifyRequest).length === 0) || !mParticle.identifyRequest) {
                var modifiedUIforIdentityRequest = {};
                for (var identityType in MP.userIdentities) {
                    if (MP.userIdentities.hasOwnProperty(identityType)) {
                        modifiedUIforIdentityRequest[Types.IdentityType.getIdentityName(Helpers.parseNumber(identityType))] = MP.userIdentities[identityType];
                    }
                }

                MP.initialIdentifyRequest = {
                    userIdentities: modifiedUIforIdentityRequest
                };
            } else {
                MP.initialIdentifyRequest = mParticle.identifyRequest;
            }

            if (MP.migrate) {
                identify(MP.initialIdentifyRequest);
                MP.migrate = false;
            }

            Forwarders.initForwarders(MP.initialIdentifyRequest);

            if (arguments && arguments.length) {
                if (arguments.length > 1 && typeof arguments[1] === 'object') {
                    config = arguments[1];
                }
                if (config) {
                    Helpers.mergeConfig(config);
                }
            }

            mParticle.sessionManager.initialize();
            // Call any functions that are waiting for the library to be initialized
            if (MP.readyQueue && MP.readyQueue.length) {
                MP.readyQueue.forEach(function(readyQueueItem) {
                    if (typeof readyQueueItem === 'function') {
                        readyQueueItem();
                    }
                });

                MP.readyQueue = [];
            }

            Events.logAST();
            MP.isInitialized = true;
        },
        reset: function() {
            // Completely resets the state of the SDK. mParticle.init() will need to be called again.
            MP.sessionAttributes = {};
            MP.isEnabled = true;
            MP.isFirstRun = null;
            Events.stopTracking();
            MP.devToken = null;
            MP.sessionId = null;
            MP.appName = null;
            MP.appVersion = null;
            MP.currentSessionMPIDs = [],
            MP.eventQueue = [];
            MP.identityCallback = null;
            MP.context = null;
            MP.userAttributes = {};
            MP.userIdentities = {};
            MP.cookieSyncDates = {};
            MP.forwarders = [];
            MP.forwarderConstructors = [];
            MP.pixelConfigurations = [];
            MP.productBags = {};
            MP.cartProducts = [];
            MP.serverSettings = null;
            MP.mpid = null;
            MP.customFlags = null;
            MP.currencyCode;
            MP.clientId = null;
            MP.deviceId = null;
            MP.dateLastEventSent = null;
            MP.watchPositionId = null;
            MP.readyQueue = [];
            Helpers.mergeConfig({});
            MP.migrationData = {};
            MP.identityCallInFlight = false;
            MP.initialIdentifyRequest = null;
            mParticle.sessionManager.resetSessionTimer();
            Persistence.resetPersistence();

            MP.isInitialized = false;
        },
        ready: function(f) {
            if (MP.isInitialized && typeof f === 'function') {
                f();
            }
            else {
                MP.readyQueue.push(f);
            }
        },
        getVersion: function() {
            return Constants.sdkVersion;
        },
        setAppVersion: function(version) {
            MP.appVersion = version;
            Persistence.update();
        },
        getAppName: function() {
            return MP.appName;
        },
        setAppName: function(name) {
            MP.appName = name;
        },
        getAppVersion: function() {
            return MP.appVersion;
        },
        stopTrackingLocation: function() {
            mParticle.sessionManager.resetSessionTimer();
            Events.stopTracking();
        },
        startTrackingLocation: function() {
            mParticle.sessionManager.resetSessionTimer();
            Events.startTracking();
        },
        setPosition: function(lat, lng) {
            mParticle.sessionManager.resetSessionTimer();
            if (typeof lat === 'number' && typeof lng === 'number') {
                MP.currentPosition = {
                    lat: lat,
                    lng: lng
                };
            }
            else {
                Helpers.logDebug('Position latitude and/or longitude are invalid');
            }
        },
        startNewSession: function() {
            SessionManager.startNewSession();
        },
        endSession: function() {
            SessionManager.endSession();
        },
        logEvent: function(eventName, eventType, eventInfo, customFlags) {
            mParticle.sessionManager.resetSessionTimer();
            if (typeof (eventName) !== 'string') {
                Helpers.logDebug(Messages.ErrorMessages.EventNameInvalidType);
                return;
            }

            if (!eventType) {
                eventType = Types.EventType.Unknown;
            }

            if (!Helpers.isEventType(eventType)) {
                Helpers.logDebug('Invalid event type: ' + eventType + ', must be one of: \n' + JSON.stringify(Types.EventType));
                return;
            }

            if (!Helpers.canLog()) {
                Helpers.logDebug(Messages.ErrorMessages.LoggingDisabled);
                return;
            }

            Events.logEvent(Types.MessageType.PageEvent, eventName, eventInfo, eventType, customFlags);
        },
        logError: function(error) {
            mParticle.sessionManager.resetSessionTimer();
            if (!error) {
                return;
            }

            if (typeof error === 'string') {
                error = {
                    message: error
                };
            }

            Events.logEvent(Types.MessageType.CrashReport,
                error.name ? error.name : 'Error',
                {
                    m: error.message ? error.message : error,
                    s: 'Error',
                    t: error.stack
                },
                Types.EventType.Other);
        },
        logLink: function(selector, eventName, eventType, eventInfo) {
            mParticle.sessionManager.resetSessionTimer();
            Events.addEventHandler('click', selector, eventName, eventInfo, eventType);
        },
        logForm: function(selector, eventName, eventType, eventInfo) {
            mParticle.sessionManager.resetSessionTimer();
            Events.addEventHandler('submit', selector, eventName, eventInfo, eventType);
        },
        logPageView: function() {
            mParticle.sessionManager.resetSessionTimer();
            var eventName = null,
                attrs = null,
                flags = null;

            if (Helpers.canLog()) {
                if (arguments.length <= 1) {
                    // Handle original function signature
                    eventName = window.location.pathname;
                    attrs = {
                        hostname: window.location.hostname,
                        title: window.document.title
                    };

                    if (arguments.length === 1) {
                        flags = arguments[0];
                    }
                }
                else if (arguments.length > 1) {
                    eventName = arguments[0];
                    attrs = arguments[1];

                    if (arguments.length === 3) {
                        flags = arguments[2];
                    }
                }

                Events.logEvent(Types.MessageType.PageView, eventName, attrs, Types.EventType.Unknown, flags);
            }
        },

        eCommerce: {
            ProductBags: {
                add: function(productBagName, product) {
                    if (!Validators.isStringOrNumber(productBagName)) {
                        Helpers.logDebug('ProductBagName is required and must be a string or number');
                        return;
                    }
                    mParticle.sessionManager.resetSessionTimer();
                    if (!MP.productBags[productBagName]) {
                        MP.productBags[productBagName] = [];
                    }

                    MP.productBags[productBagName].push(product);

                    if (MP.productBags[productBagName].length > mParticle.maxProducts) {
                        Helpers.logDebug(productBagName + ' contains ' + MP.productBags[productBagName].length + ' items. Only mParticle.maxProducts = ' + mParticle.maxProducts + ' can currently be saved in cookies.');
                    }
                    Persistence.update();

                    Helpers.tryNativeSdk(Constants.NativeSdkPaths.AddToProductBag, JSON.stringify(product));
                },
                remove: function(productBagName, product) {
                    mParticle.sessionManager.resetSessionTimer();
                    var productIndex = -1;

                    if (MP.productBags[productBagName]) {
                        MP.productBags[productBagName].forEach(function(productBagItem, i) {
                            if (productBagItem.sku === product.sku) {
                                productIndex = i;
                            }
                        });

                        if (productIndex > -1) {
                            MP.productBags[productBagName].splice(productIndex, 1);
                        }
                        Persistence.update();
                    }
                    Helpers.tryNativeSdk(Constants.NativeSdkPaths.RemoveFromProductBag, JSON.stringify(product));
                },
                clear: function(productBagName) {
                    mParticle.sessionManager.resetSessionTimer();
                    MP.productBags[productBagName] = [];
                    Persistence.update();

                    Helpers.tryNativeSdk(Constants.NativeSdkPaths.ClearProductBag, productBagName);
                }
            },
            Cart: {
                add: function(product, logEvent) {
                    mParticleUserCart(MP.mpid).add(product, logEvent);
                },
                remove: function(product, logEvent) {
                    mParticleUserCart(MP.mpid).remove(product, logEvent);
                },
                clear: function() {
                    mParticleUserCart(MP.mpid).clear();
                }
            },
            setCurrencyCode: function(code) {
                if (typeof code !== 'string') {
                    Helpers.logDebug('Code must be a string');
                    return;
                }
                mParticle.sessionManager.resetSessionTimer();
                MP.currencyCode = code;
            },
            createProduct: function(name, sku, price, quantity, variant, category, brand, position, coupon, attributes) {
                mParticle.sessionManager.resetSessionTimer();
                return Ecommerce.createProduct(name, sku, price, quantity, variant, category, brand, position, coupon, attributes);
            },
            createPromotion: function(id, creative, name, position) {
                mParticle.sessionManager.resetSessionTimer();
                return Ecommerce.createPromotion(id, creative, name, position);
            },
            createImpression: function(name, product) {
                mParticle.sessionManager.resetSessionTimer();
                return Ecommerce.createImpression(name, product);
            },
            createTransactionAttributes: function(id, affiliation, couponCode, revenue, shipping, tax) {
                mParticle.sessionManager.resetSessionTimer();
                return Ecommerce.createTransactionAttributes(id, affiliation, couponCode, revenue, shipping, tax);
            },
            logCheckout: function(step, paymentMethod, attrs) {
                mParticle.sessionManager.resetSessionTimer();
                Events.logCheckoutEvent(step, paymentMethod, attrs);
            },
            logProductAction: function(productActionType, product, attrs) {
                mParticle.sessionManager.resetSessionTimer();
                Events.logProductActionEvent(productActionType, product, attrs);
            },
            logPurchase: function(transactionAttributes, product, clearCart, attrs) {
                if (!transactionAttributes || !product) {
                    Helpers.logDebug(Messages.ErrorMessages.BadLogPurchase);
                    return;
                }
                mParticle.sessionManager.resetSessionTimer();
                Events.logPurchaseEvent(transactionAttributes, product, attrs);

                if (clearCart === true) {
                    mParticle.Ecommerce.Cart.clear();
                }
            },
            logPromotion: function(type, promotion, attrs) {
                mParticle.sessionManager.resetSessionTimer();
                Events.logPromotionEvent(type, promotion, attrs);
            },
            logImpression: function(impression, attrs) {
                mParticle.sessionManager.resetSessionTimer();
                Events.logImpressionEvent(impression, attrs);
            },
            logRefund: function(transactionAttributes, product, clearCart, attrs) {
                mParticle.sessionManager.resetSessionTimer();
                Events.logRefundEvent(transactionAttributes, product, attrs);

                if (clearCart === true) {
                    mParticle.Ecommerce.Cart.clear();
                }
            },
            expandCommerceEvent: function(event) {
                mParticle.sessionManager.resetSessionTimer();
                return Ecommerce.expandCommerceEvent(event);
            }
        },
        logLTVIncrease: function(amount, eventName, attributes) {
            mParticle.sessionManager.resetSessionTimer();

            if (typeof amount !== 'number') {
                Helpers.logDebug('A valid amount must be passed to logLTVIncrease.');
                return;
            }

            if (!attributes) {
                attributes = {};
            }

            attributes[Constants.RESERVED_KEY_LTV] = amount;
            attributes[Constants.METHOD_NAME] = Constants.LOG_LTV;

            Events.logEvent(Types.MessageType.PageEvent,
                eventName || 'Increase LTV',
                attributes,
                Types.EventType.Transaction);
        },
        setSessionAttribute: function(key, value) {
            mParticle.sessionManager.resetSessionTimer();
            // Logs to cookie
            // And logs to in-memory object
            // Example: mParticle.setSessionAttribute('location', '33431');
            if (Helpers.canLog()) {
                if (!Validators.isValidAttributeValue(value)) {
                    Helpers.logDebug(Messages.ErrorMessages.BadAttribute);
                    return;
                }

                if (!Validators.isValidKeyValue(key)) {
                    Helpers.logDebug(Messages.ErrorMessages.BadKey);
                    return;
                }

                var existingProp = Helpers.findKeyInObject(MP.sessionAttributes, key);

                if (existingProp) {
                    key = existingProp;
                }

                MP.sessionAttributes[key] = value;
                Persistence.update();
                if (!Helpers.tryNativeSdk(Constants.NativeSdkPaths.SetSessionAttribute, JSON.stringify({ key: key, value: value }))) {
                    Forwarders.applyToForwarders('setSessionAttribute', [key, value]);
                }
            }
        },
        setOptOut: function(isOptingOut) {
            mParticle.sessionManager.resetSessionTimer();
            MP.isEnabled = !isOptingOut;

            Events.logOptOut();
            Persistence.update();

            if (MP.forwarders.length) {
                MP.forwarders.forEach(function(forwarder) {
                    if (forwarder.setOptOut) {
                        var result = forwarder.setOptOut(isOptingOut);

                        if (result) {
                            Helpers.logDebug(result);
                        }
                    }
                });
            }
        },
        addForwarder: function(forwarderProcessor) {
            MP.forwarderConstructors.push(forwarderProcessor);
        },
        configureForwarder: function(configuration) {
            var newForwarder = null,
                config = configuration;

            for (var i = 0; i < MP.forwarderConstructors.length; i++) {
                if (MP.forwarderConstructors[i].name === config.name) {
                    if (config.isDebug === mParticle.isDevelopmentMode || config.isSandbox === mParticle.isDevelopmentMode) {
                        newForwarder = new MP.forwarderConstructors[i].constructor();

                        newForwarder.id = config.moduleId;
                        newForwarder.isSandbox = config.isDebug || config.isSandbox;
                        newForwarder.hasSandbox = config.hasDebugString === 'true';
                        newForwarder.isVisible = config.isVisible;
                        newForwarder.settings = config.settings;

                        newForwarder.eventNameFilters = config.eventNameFilters;
                        newForwarder.eventTypeFilters = config.eventTypeFilters;
                        newForwarder.attributeFilters = config.attributeFilters;

                        newForwarder.screenNameFilters = config.screenNameFilters;
                        newForwarder.screenNameFilters = config.screenNameFilters;
                        newForwarder.pageViewAttributeFilters = config.pageViewAttributeFilters;

                        newForwarder.userIdentityFilters = config.userIdentityFilters;
                        newForwarder.userAttributeFilters = config.userAttributeFilters;

                        newForwarder.filteringEventAttributeValue = config.filteringEventAttributeValue;
                        newForwarder.filteringUserAttributeValue = config.filteringUserAttributeValue;

                        MP.forwarders.push(newForwarder);
                        break;
                    }
                }
            }
        },
        configurePixel: function(settings) {
            if (settings.isDebug === mParticle.isDevelopmentMode || settings.isProduction !== mParticle.isDevelopmentMode) {
                MP.pixelConfigurations.push(settings);
            }
        }
    };

    // Read existing configuration if present
    if (window.mParticle && window.mParticle.config) {
        if (window.mParticle.config.serviceUrl) {
            Constants.serviceUrl = window.mParticle.config.serviceUrl;
        }

        if (window.mParticle.config.secureServiceUrl) {
            Constants.secureServiceUrl = window.mParticle.config.secureServiceUrl;
        }

        // Check for any functions queued
        if (window.mParticle.config.rq) {
            MP.readyQueue = window.mParticle.config.rq;
        }

        if (window.mParticle.config.hasOwnProperty('isDevelopmentMode')) {
            mParticle.isDevelopmentMode = window.mParticle.config.isDevelopmentMode;
        }

        if (window.mParticle.config.hasOwnProperty('useNativeSdk')) {
            mParticle.useNativeSdk = window.mParticle.config.useNativeSdk;
        }

        if (window.mParticle.config.hasOwnProperty('useCookieStorage')) {
            mParticle.useCookieStorage = window.mParticle.config.useCookieStorage;
        }

        if (window.mParticle.config.hasOwnProperty('maxProducts')) {
            mParticle.maxProducts = window.mParticle.config.maxProducts;
        }

        if (window.mParticle.config.hasOwnProperty('appName')) {
            MP.appName = window.mParticle.config.appName;
        }

        if (window.mParticle.config.hasOwnProperty('identifyRequest')) {
            mParticle.identifyRequest = window.mParticle.config.identifyRequest;
        }

        if (window.mParticle.config.hasOwnProperty('identityCallback')) {
            var callback = window.mParticle.config.identityCallback;
            if (callback && !Validators.isFunction(callback)) {
                Helpers.logDebug('The optional callback must be a function. You tried entering a(n) ' + typeof fn, ' . Callback not set. Please set your callback again.');
            } else {
                MP.identityCallback = window.mParticle.config.identityCallback;
            }
        }

        if (window.mParticle.config.hasOwnProperty('appVersion')) {
            MP.appVersion = window.mParticle.config.appVersion;
        }

        if (window.mParticle.config.hasOwnProperty('sessionTimeout')) {
            MP.Config.SessionTimeout = window.mParticle.config.sessionTimeout;
        }

        // Some forwarders require custom flags on initialization, so allow them to be set using config object
        if (window.mParticle.config.hasOwnProperty('customFlags')) {
            MP.customFlags = window.mParticle.config.customFlags;
        }
    }

    window.mParticle = mParticle;
})(window);
