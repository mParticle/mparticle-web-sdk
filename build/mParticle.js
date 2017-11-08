(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var serviceUrl = 'jssdk.mparticle.com/v2/JS/',
    secureServiceUrl = 'jssdks.mparticle.com/v2/JS/',
    identityUrl = 'https://identity.mparticle.com/v1/', //prod
    sdkVersion = '2.0.13',
    sdkVendor = 'mparticle',
    platform = 'web',
    METHOD_NAME = '$MethodName',
    LOG_LTV = 'LogLTVIncrease',
    RESERVED_KEY_LTV = '$Amount',
    Messages = {
        ErrorMessages: {
            NoToken: 'A token must be specified.',
            EventNameInvalidType: 'Event name must be a valid string value.',
            EventDataInvalidType: 'Event data must be a valid object hash.',
            LoggingDisabled: 'Event logging is currently disabled.',
            CookieParseError: 'Could not parse cookie',
            EventEmpty: 'Event object is null or undefined, cancelling send',
            APIRequestEmpty: 'APIRequest is null or undefined, cancelling send',
            NoEventType: 'Event type must be specified.',
            TransactionIdRequired: 'Transaction ID is required',
            TransactionRequired: 'A transaction attributes object is required',
            PromotionIdRequired: 'Promotion ID is required',
            BadAttribute: 'Attribute value cannot be object or array',
            BadKey: 'Key value cannot be object or array',
            BadLogPurchase: 'Transaction attributes and a product are both required to log a purchase, https://docs.mparticle.com/?javascript#measuring-transactions'
        },

        InformationMessages: {
            CookieSearch: 'Searching for cookie',
            CookieFound: 'Cookie found, parsing values',
            CookieNotFound: 'Cookies not found',
            CookieSet: 'Setting cookie',
            CookieSync: 'Performing cookie sync',
            SendBegin: 'Starting to send event',
            SendIdentityBegin: 'Starting to send event to identity server',
            SendWindowsPhone: 'Sending event to Windows Phone container',
            SendIOS: 'Calling iOS path: ',
            SendAndroid: 'Calling Android JS interface method: ',
            SendHttp: 'Sending event to mParticle HTTP service',
            SendIdentityHttp: 'Sending event to mParticle HTTP service',
            StartingNewSession: 'Starting new Session',
            StartingLogEvent: 'Starting to log event',
            StartingLogOptOut: 'Starting to log user opt in/out',
            StartingEndSession: 'Starting to end session',
            StartingInitialization: 'Starting to initialize',
            StartingLogCommerceEvent: 'Starting to log commerce event',
            LoadingConfig: 'Loading configuration options',
            AbandonLogEvent: 'Cannot log event, logging disabled or developer token not set',
            AbandonStartSession: 'Cannot start session, logging disabled or developer token not set',
            AbandonEndSession: 'Cannot end session, logging disabled or developer token not set',
            NoSessionToEnd: 'Cannot end session, no active session found'
        }
    },

    NativeSdkPaths = {
        LogEvent: 'logEvent',
        SetUserTag: 'setUserTag',
        RemoveUserTag: 'removeUserTag',
        SetUserAttribute: 'setUserAttribute',
        RemoveUserAttribute: 'removeUserAttribute',
        SetSessionAttribute: 'setSessionAttribute',
        AddToProductBag: 'addToProductBag',
        RemoveFromProductBag: 'removeFromProductBag',
        ClearProductBag: 'clearProductBag',
        AddToCart: 'addToCart',
        RemoveFromCart: 'removeFromCart',
        ClearCart: 'clearCart',
        LogOut: 'logOut',
        SetUserAttributeList: 'setUserAttributeList',
        RemoveAllUserAttributes: 'removeAllUserAttributes',
        GetUserAttributesLists: 'getUserAttributesLists',
        GetAllUserAttributes: 'getAllUserAttributes',
        Identify: 'identify',
        Logout: 'logout',
        Login: 'login',
        Modify: 'modify'
    },

    DefaultConfig = {
        LocalStorageName: 'mprtcl-api', // Name of the mP localstorage data stored on the user's machine
        CookieName: 'mprtcl-api',       // Name of the cookie stored on the user's machine
        CookieDomain: null, 			// If null, defaults to current location.host
        Debug: false,					// If true, will print debug messages to browser console
        CookieExpiration: 365,			// Cookie expiration time in days
        Verbose: false,					// Whether the server will return verbose responses
        IncludeReferrer: true,			// Include user's referrer
        IncludeGoogleAdwords: true,		// Include utm_source and utm_properties
        Timeout: 300,					// Timeout in milliseconds for logging functions
        SessionTimeout: 30,				// Session timeout in minutes
        Sandbox: false,                 // Events are marked as debug and only forwarded to debug forwarders,
        Version: null,                  // The version of this website/app
        MaxProducts: 20                 // Number of products persisted in
    };

module.exports = {
    serviceUrl: serviceUrl,
    secureServiceUrl: secureServiceUrl,
    identityUrl: identityUrl,
    sdkVersion: sdkVersion,
    sdkVendor: sdkVendor,
    platform: platform,
    METHOD_NAME: METHOD_NAME,
    LOG_LTV: LOG_LTV,
    RESERVED_KEY_LTV: RESERVED_KEY_LTV,
    Messages: Messages,
    NativeSdkPaths: NativeSdkPaths,
    DefaultConfig: DefaultConfig
};

},{}],2:[function(require,module,exports){
var Helpers = require('./helpers'),
    Constants = require('./constants'),
    Persistence = require('./persistence'),
    Messages = Constants.Messages,
    MP = require('./mp');

var cookieSyncManager = {
    attemptCookieSync: function(previousMPID, mpid) {
        var pixelConfig, lastSyncDateForModule, url, redirect, urlWithRedirect;
        if (mpid && !Helpers.isWebViewEmbedded()) {
            MP.pixelConfigurations.forEach(function(pixelSettings) {
                pixelConfig = {
                    moduleId: pixelSettings.moduleId,
                    frequencyCap: pixelSettings.frequencyCap,
                    pixelUrl: cookieSyncManager.replaceAmp(pixelSettings.pixelUrl),
                    redirectUrl: pixelSettings.redirectUrl ? cookieSyncManager.replaceAmp(pixelSettings.redirectUrl) : null
                };

                url = cookieSyncManager.replaceMPID(pixelConfig.pixelUrl, mpid);
                redirect = pixelConfig.redirectUrl ? cookieSyncManager.replaceMPID(pixelConfig.redirectUrl, mpid) : '';
                urlWithRedirect = url + encodeURIComponent(redirect);

                if (previousMPID && previousMPID !== mpid) {
                    cookieSyncManager.performCookieSync(urlWithRedirect, pixelConfig.moduleId);
                    return;
                } else {
                    lastSyncDateForModule = MP.cookieSyncDates[(pixelConfig.moduleId).toString()] ? MP.cookieSyncDates[(pixelConfig.moduleId).toString()] : null;

                    if (lastSyncDateForModule) {
                        // Check to see if we need to refresh cookieSync
                        if ((new Date()).getTime() > (new Date(lastSyncDateForModule).getTime() + (pixelConfig.frequencyCap * 60 * 1000 * 60 * 24))) {
                            cookieSyncManager.performCookieSync(urlWithRedirect, pixelConfig.moduleId);
                        }
                    } else {
                        cookieSyncManager.performCookieSync(urlWithRedirect, pixelConfig.moduleId);
                    }
                }
            });
        }
    },

    performCookieSync: function(url, moduleId) {
        var img = document.createElement('img');

        Helpers.logDebug(Messages.InformationMessages.CookieSync);

        img.src = url;
        MP.cookieSyncDates[moduleId.toString()] = (new Date()).getTime();
        Persistence.update();
    },

    replaceMPID: function(string, mpid) {
        return string.replace('%%mpid%%', mpid);
    },

    replaceAmp: function(string) {
        return string.replace(/&amp;/g, '&');
    }
};

module.exports = cookieSyncManager;

},{"./constants":1,"./helpers":6,"./mp":9,"./persistence":10}],3:[function(require,module,exports){
var Types = require('./types'),
    Helpers = require('./helpers'),
    Validators = Helpers.Validators,
    Messages = require('./constants').Messages,
    MP = require('./mp'),
    ServerModel = require('./serverModel');

function convertTransactionAttributesToProductAction(transactionAttributes, productAction) {
    productAction.TransactionId = transactionAttributes.Id;
    productAction.Affiliation = transactionAttributes.Affiliation;
    productAction.CouponCode = transactionAttributes.CouponCode;
    productAction.TotalAmount = transactionAttributes.Revenue;
    productAction.ShippingAmount = transactionAttributes.Shipping;
    productAction.TaxAmount = transactionAttributes.Tax;
}

function getProductActionEventName(productActionType) {
    switch (productActionType) {
        case Types.ProductActionType.AddToCart:
            return 'AddToCart';
        case Types.ProductActionType.AddToWishlist:
            return 'AddToWishlist';
        case Types.ProductActionType.Checkout:
            return 'Checkout';
        case Types.ProductActionType.Click:
            return 'Click';
        case Types.ProductActionType.Purchase:
            return 'Purchase';
        case Types.ProductActionType.Refund:
            return 'Refund';
        case Types.ProductActionType.RemoveFromCart:
            return 'RemoveFromCart';
        case Types.ProductActionType.RemoveFromWishlist:
            return 'RemoveFromWishlist';
        case Types.ProductActionType.ViewDetail:
            return 'ViewDetail';
        case Types.ProductActionType.Unknown:
        default:
            return 'Unknown';
    }
}

function getPromotionActionEventName(promotionActionType) {
    switch (promotionActionType) {
        case Types.PromotionActionType.PromotionClick:
            return 'PromotionClick';
        case Types.PromotionActionType.PromotionView:
            return 'PromotionView';
        default:
            return 'Unknown';
    }
}

function convertProductActionToEventType(productActionType) {
    switch (productActionType) {
        case Types.ProductActionType.AddToCart:
            return Types.CommerceEventType.ProductAddToCart;
        case Types.ProductActionType.AddToWishlist:
            return Types.CommerceEventType.ProductAddToWishlist;
        case Types.ProductActionType.Checkout:
            return Types.CommerceEventType.ProductCheckout;
        case Types.ProductActionType.Click:
            return Types.CommerceEventType.ProductClick;
        case Types.ProductActionType.Purchase:
            return Types.CommerceEventType.ProductPurchase;
        case Types.ProductActionType.Refund:
            return Types.CommerceEventType.ProductRefund;
        case Types.ProductActionType.RemoveFromCart:
            return Types.CommerceEventType.ProductRemoveFromCart;
        case Types.ProductActionType.RemoveFromWishlist:
            return Types.CommerceEventType.ProductRemoveFromWishlist;
        case Types.ProductActionType.Unknown:
            return Types.EventType.Unknown;
        case Types.ProductActionType.ViewDetail:
            return Types.CommerceEventType.ProductViewDetail;
        default:
            Helpers.logDebug('Could not convert product action type ' + productActionType + ' to event type');
            return null;
    }
}

function convertPromotionActionToEventType(promotionActionType) {
    switch (promotionActionType) {
        case Types.PromotionActionType.PromotionClick:
            return Types.CommerceEventType.PromotionClick;
        case Types.PromotionActionType.PromotionView:
            return Types.CommerceEventType.PromotionView;
        default:
            Helpers.logDebug('Could not convert promotion action type ' + promotionActionType + ' to event type');
            return null;
    }
}

function generateExpandedEcommerceName(eventName, plusOne) {
    return 'eCommerce - ' + eventName + ' - ' + (plusOne ? 'Total' : 'Item');
}

function extractProductAttributes(attributes, product) {
    if (product.CouponCode) {
        attributes['Coupon Code'] = product.CouponCode;
    }
    if (product.Brand) {
        attributes['Brand'] = product.Brand;
    }
    if (product.Category) {
        attributes['Category'] = product.Category;
    }
    if (product.Name) {
        attributes['Name'] = product.Name;
    }
    if (product.Sku) {
        attributes['Id'] = product.Sku;
    }
    if (product.Price) {
        attributes['Item Price'] = product.Price;
    }
    if (product.Quantity) {
        attributes['Quantity'] = product.Quantity;
    }
    if (product.Position) {
        attributes['Position'] = product.Position;
    }
    if (product.Variant) {
        attributes['Variant'] = product.Variant;
    }
    attributes['Total Product Amount'] = product.TotalAmount || 0;

}

function extractTransactionId(attributes, productAction) {
    if (productAction.TransactionId) {
        attributes['Transaction Id'] = productAction.TransactionId;
    }
}

function extractActionAttributes(attributes, productAction) {
    extractTransactionId(attributes, productAction);

    if (productAction.Affiliation) {
        attributes['Affiliation'] = productAction.Affiliation;
    }

    if (productAction.CouponCode) {
        attributes['Coupon Code'] = productAction.CouponCode;
    }

    if (productAction.TotalAmount) {
        attributes['Total Amount'] = productAction.TotalAmount;
    }

    if (productAction.ShippingAmount) {
        attributes['Shipping Amount'] = productAction.ShippingAmount;
    }

    if (productAction.TaxAmount) {
        attributes['Tax Amount'] = productAction.TaxAmount;
    }

    if (productAction.CheckoutOptions) {
        attributes['Checkout Options'] = productAction.CheckoutOptions;
    }

    if (productAction.CheckoutStep) {
        attributes['Checkout Step'] = productAction.CheckoutStep;
    }
}

function extractPromotionAttributes(attributes, promotion) {
    if (promotion.Id) {
        attributes['Id'] = promotion.Id;
    }

    if (promotion.Creative) {
        attributes['Creative'] = promotion.Creative;
    }

    if (promotion.Name) {
        attributes['Name'] = promotion.Name;
    }

    if (promotion.Position) {
        attributes['Position'] = promotion.Position;
    }
}

function buildProductList(event, product) {
    if (product) {
        if (Array.isArray(product)) {
            return product;
        }

        return [product];
    }

    return event.ShoppingCart.ProductList;
}

function createProduct(name,
    sku,
    price,
    quantity,
    brand,
    variant,
    category,
    position,
    couponCode,
    attributes) {

    if (typeof name !== 'string') {
        Helpers.logDebug('Name is required when creating a product');
        return null;
    }

    if (!Validators.isStringOrNumber(sku)) {
        Helpers.logDebug('SKU is required when creating a product, and must be a string or a number');
        return null;
    }

    if (!Validators.isStringOrNumber(price)) {
        Helpers.logDebug('Price is required when creating a product, and must be a string or a number');
        return null;
    }

    if (!quantity) {
        quantity = 1;
    }

    return {
        Name: name,
        Sku: sku,
        Price: price,
        Quantity: quantity,
        Brand: brand,
        Variant: variant,
        Category: category,
        Position: position,
        CouponCode: couponCode,
        TotalAmount: quantity * price,
        Attributes: attributes
    };
}

function createPromotion(id, creative, name, position) {
    if (!Validators.isStringOrNumber(id)) {
        Helpers.logDebug(Messages.ErrorMessages.PromotionIdRequired);
        return null;
    }

    return {
        Id: id,
        Creative: creative,
        Name: name,
        Position: position
    };
}

function createImpression(name, product) {
    if (typeof name !== 'string') {
        Helpers.logDebug('Name is required when creating an impression.');
        return null;
    }

    if (!product) {
        Helpers.logDebug('Product is required when creating an impression.');
        return null;
    }

    return {
        Name: name,
        Product: product
    };
}

function createTransactionAttributes(id,
    affiliation,
    couponCode,
    revenue,
    shipping,
    tax) {

    if (!Validators.isStringOrNumber(id)) {
        Helpers.logDebug(Messages.ErrorMessages.TransactionIdRequired);
        return null;
    }

    return {
        Id: id,
        Affiliation: affiliation,
        CouponCode: couponCode,
        Revenue: revenue,
        Shipping: shipping,
        Tax: tax
    };
}

function expandProductImpression(commerceEvent) {
    var appEvents = [];
    if (!commerceEvent.ProductImpressions) {
        return appEvents;
    }
    commerceEvent.ProductImpressions.forEach(function(productImpression) {
        if (productImpression.ProductList) {
            productImpression.ProductList.forEach(function(product) {
                var attributes = Helpers.extend(false, {}, commerceEvent.EventAttributes);
                if (product.Attributes) {
                    for (var attribute in product.Attributes) {
                        attributes[attribute] = product.Attributes[attribute];
                    }
                }
                extractProductAttributes(attributes, product);
                if (productImpression.ProductImpressionList) {
                    attributes['Product Impression List'] = productImpression.ProductImpressionList;
                }
                var appEvent = ServerModel.createEventObject(Types.MessageType.PageEvent,
                        generateExpandedEcommerceName('Impression'),
                        attributes,
                        Types.EventType.Transaction
                    );
                appEvents.push(appEvent);
            });
        }
    });

    return appEvents;
}

function expandCommerceEvent(event) {
    if (!event) {
        return null;
    }
    return expandProductAction(event)
        .concat(expandPromotionAction(event))
        .concat(expandProductImpression(event));
}

function expandPromotionAction(commerceEvent) {
    var appEvents = [];
    if (!commerceEvent.PromotionAction) {
        return appEvents;
    }
    var promotions = commerceEvent.PromotionAction.PromotionList;
    promotions.forEach(function(promotion) {
        var attributes = Helpers.extend(false, {}, commerceEvent.EventAttributes);
        extractPromotionAttributes(attributes, promotion);

        var appEvent = ServerModel.createEventObject(Types.MessageType.PageEvent,
                generateExpandedEcommerceName(Types.PromotionActionType.getExpansionName(commerceEvent.PromotionAction.PromotionActionType)),
                attributes,
                Types.EventType.Transaction
            );
        appEvents.push(appEvent);
    });
    return appEvents;
}

function expandProductAction(commerceEvent) {
    var appEvents = [];
    if (!commerceEvent.ProductAction) {
        return appEvents;
    }
    var shouldExtractActionAttributes = false;
    if (commerceEvent.ProductAction.ProductActionType === Types.ProductActionType.Purchase ||
        commerceEvent.ProductAction.ProductActionType === Types.ProductActionType.Refund) {
        var attributes = Helpers.extend(false, {}, commerceEvent.EventAttributes);
        attributes['Product Count'] = commerceEvent.ProductAction.ProductList ? commerceEvent.ProductAction.ProductList.length : 0;
        extractActionAttributes(attributes, commerceEvent.ProductAction);
        if (commerceEvent.CurrencyCode) {
            attributes['Currency Code'] = commerceEvent.CurrencyCode;
        }
        var plusOneEvent = ServerModel.createEventObject(Types.MessageType.PageEvent,
            generateExpandedEcommerceName(Types.ProductActionType.getExpansionName(commerceEvent.ProductAction.ProductActionType), true),
            attributes,
            Types.EventType.Transaction
        );
        appEvents.push(plusOneEvent);
    }
    else {
        shouldExtractActionAttributes = true;
    }

    var products = commerceEvent.ProductAction.ProductList;

    if (!products) {
        return appEvents;
    }

    products.forEach(function(product) {
        var attributes = Helpers.extend(false, commerceEvent.EventAttributes, product.Attributes);
        if (shouldExtractActionAttributes) {
            extractActionAttributes(attributes, commerceEvent.ProductAction);
        }
        else {
            extractTransactionId(attributes, commerceEvent.ProductAction);
        }
        extractProductAttributes(attributes, product);

        var productEvent = ServerModel.createEventObject(Types.MessageType.PageEvent,
            generateExpandedEcommerceName(Types.ProductActionType.getExpansionName(commerceEvent.ProductAction.ProductActionType)),
            attributes,
            Types.EventType.Transaction
        );
        appEvents.push(productEvent);
    });

    return appEvents;
}

function createCommerceEventObject() {
    var baseEvent;

    Helpers.logDebug(Messages.InformationMessages.StartingLogCommerceEvent);

    if (Helpers.canLog()) {
        baseEvent = ServerModel.createEventObject(Types.MessageType.Commerce);
        baseEvent.EventName = 'eCommerce - ';
        baseEvent.CurrencyCode = MP.currencyCode;
        baseEvent.ShoppingCart = {
            ProductList: MP.cartProducts
        };

        return baseEvent;
    }
    else {
        Helpers.logDebug(Messages.InformationMessages.AbandonLogEvent);
    }

    return null;
}

module.exports = {
    convertTransactionAttributesToProductAction: convertTransactionAttributesToProductAction,
    getProductActionEventName: getProductActionEventName,
    getPromotionActionEventName: getPromotionActionEventName,
    convertProductActionToEventType: convertProductActionToEventType,
    convertPromotionActionToEventType: convertPromotionActionToEventType,
    generateExpandedEcommerceName: generateExpandedEcommerceName,
    extractProductAttributes: extractProductAttributes,
    extractActionAttributes: extractActionAttributes,
    extractPromotionAttributes: extractPromotionAttributes,
    extractTransactionId: extractTransactionId,
    buildProductList: buildProductList,
    createProduct: createProduct,
    createPromotion: createPromotion,
    createImpression: createImpression,
    createTransactionAttributes: createTransactionAttributes,
    expandCommerceEvent: expandCommerceEvent,
    createCommerceEventObject: createCommerceEventObject
};

},{"./constants":1,"./helpers":6,"./mp":9,"./serverModel":12,"./types":14}],4:[function(require,module,exports){
var Types = require('./types'),
    Constants = require('./constants'),
    Helpers = require('./helpers'),
    Ecommerce = require('./ecommerce'),
    ServerModel = require('./serverModel'),
    MP = require('./mp'),
    Persistence = require('./persistence'),
    Messages = Constants.Messages,
    Forwarders = require('./forwarders');

function logEvent(type, name, data, category, cflags) {
    Helpers.logDebug(Messages.InformationMessages.StartingLogEvent + ': ' + name);

    if (Helpers.canLog()) {
        if (!MP.sessionId) {
            mParticle.startNewSession();
        }

        if (data) {
            data = Helpers.sanitizeAttributes(data);
        }

        send(ServerModel.createEventObject(type, name, data, category, cflags));
        Persistence.update();
    }
    else {
        Helpers.logDebug(Messages.InformationMessages.AbandonLogEvent);
    }
}

function send(event) {
    var xhr,
        xhrCallback = function() {
            if (xhr.readyState === 4) {
                Helpers.logDebug('Received ' + xhr.statusText + ' from server');

                parseResponse(xhr.responseText);
            }
        };

    Helpers.logDebug(Messages.InformationMessages.SendBegin);

    var validUserIdentities = [];

    // convert userIdentities which are strings to their number counterpart for DTO and event forwarding
    if (Helpers.isObject(event.UserIdentities) && Object.keys(event.UserIdentities).length) {
        for (var key in event.UserIdentities) {
            var userIdentity = {};
            userIdentity.Type = Types.IdentityType.getIdentityType(key);
            userIdentity.Identity = event.UserIdentities[key];
            validUserIdentities.push(userIdentity);
        }
        event.UserIdentities = validUserIdentities;
    } else {
        event.UserIdentities = [];
    }

    // When MPID = 0, we queue events until we have a valid MPID
    if (MP.mpid === 0) {
        Helpers.logDebug('Event was added to eventQueue. eventQueue will be processed once a valid MPID is returned');
        MP.eventQueue.push(event);
    } else {
        if (!event) {
            Helpers.logDebug(Messages.ErrorMessages.EventEmpty);
            return;
        }

        if (!Helpers.tryNativeSdk(Constants.NativeSdkPaths.LogEvent, JSON.stringify(event))) {
            Helpers.logDebug(Messages.InformationMessages.SendHttp);

            xhr = Helpers.createXHR(xhrCallback);

            if (xhr) {
                try {
                    xhr.open('post', Helpers.createServiceUrl(Constants.secureServiceUrl, Constants.serviceUrl, MP.devToken) + '/Events');
                    xhr.send(JSON.stringify(ServerModel.convertEventToDTO(event, MP.isFirstRun, MP.productsBags, MP.currencyCode)));

                    if (event.EventName !== Types.MessageType.AppStateTransition) {
                        Forwarders.sendEventToForwarders(event);
                    }
                }
                catch (e) {
                    Helpers.logDebug('Error sending event to mParticle servers. ' + e);
                }
            }
        }
    }
}

function parseResponse(responseText) {
    var now = new Date(),
        settings,
        prop,
        fullProp;

    if (!responseText) {
        return;
    }

    try {
        Helpers.logDebug('Parsing response from server');
        settings = JSON.parse(responseText);

        if (settings && settings.Store) {
            Helpers.logDebug('Parsed store from response, updating local settings');

            if (!MP.serverSettings) {
                MP.serverSettings = {};
            }

            for (prop in settings.Store) {
                if (!settings.Store.hasOwnProperty(prop)) {
                    continue;
                }

                fullProp = settings.Store[prop];

                if (!fullProp.Value || new Date(fullProp.Expires) < now) {
                    // This setting should be deleted from the local store if it exists

                    if (MP.serverSettings.hasOwnProperty(prop)) {
                        delete MP.serverSettings[prop];
                    }
                }
                else {
                    // This is a valid setting
                    MP.serverSettings[prop] = fullProp;
                }
            }

            Persistence.update();
        }
    }
    catch (e) {
        Helpers.logDebug('Error parsing JSON response from server: ' + e.name);
    }
}

function startTracking() {
    if (!MP.isTracking) {
        if ('geolocation' in navigator) {
            MP.watchPositionId = navigator.geolocation.watchPosition(function(position) {
                MP.currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
            });

            MP.isTracking = true;
        }
    }
}

function stopTracking() {
    if (MP.isTracking) {
        navigator.geolocation.clearWatch(MP.watchPositionId);
        MP.currentPosition = null;
        MP.isTracking = false;
    }
}

function logOptOut() {
    Helpers.logDebug(Messages.InformationMessages.StartingLogOptOut);

    send(ServerModel.createEventObject(Types.MessageType.OptOut, null, null, Types.EventType.Other));
}

function logAST() {
    logEvent(Types.MessageType.AppStateTransition);
}

function logCheckoutEvent(step, options, attrs) {
    var event = Ecommerce.createCommerceEventObject();

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

function logProductActionEvent(productActionType, product, attrs) {
    var event = Ecommerce.createCommerceEventObject();

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

function logPurchaseEvent(transactionAttributes, product, attrs) {
    var event = Ecommerce.createCommerceEventObject();

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

function logRefundEvent(transactionAttributes, product, attrs) {
    if (!transactionAttributes) {
        Helpers.logDebug(Messages.ErrorMessages.TransactionRequired);
        return;
    }

    var event = Ecommerce.createCommerceEventObject();

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

function logPromotionEvent(promotionType, promotion, attrs) {
    var event = Ecommerce.createCommerceEventObject();

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

function logImpressionEvent(impression, attrs) {
    var event = Ecommerce.createCommerceEventObject();

    if (event) {
        event.EventName += 'Impression';
        event.EventCategory = Types.CommerceEventType.ProductImpression;
        event.ProductImpressions = [{
            ProductImpressionList: impression.Name,
            ProductList: [impression.Product]
        }];

        logCommerceEvent(event, attrs);
    }
}

function logCommerceEvent(commerceEvent, attrs) {
    Helpers.logDebug(Messages.InformationMessages.StartingLogCommerceEvent);

    if (Helpers.canLog()) {
        if (Helpers.isWebViewEmbedded()) {
            // Don't send shopping cart or product bags to parent sdks
            commerceEvent.ShoppingCart = {};
            commerceEvent.ProductBags = {};
        }

        if (attrs) {
            commerceEvent.EventAttributes = attrs;
        }

        send(commerceEvent);
        Persistence.update();
    }
    else {
        Helpers.logDebug(Messages.InformationMessages.AbandonLogEvent);
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

            Helpers.logDebug('DOM event triggered, handling event');

            logEvent(Types.MessageType.PageEvent,
                typeof eventName === 'function' ? eventName(element) : eventName,
                typeof data === 'function' ? data(element) : data,
                eventType || Types.EventType.Other);

            // TODO: Handle middle-clicks and special keys (ctrl, alt, etc)
            if ((element.href && element.target !== '_blank') || element.submit) {
                // Give xmlhttprequest enough time to execute before navigating a link or submitting form

                if (e.preventDefault) {
                    e.preventDefault();
                }
                else {
                    e.returnValue = false;
                }

                setTimeout(timeoutHandler, MP.Config.Timeout);
            }
        },
        element,
        i;

    if (!selector) {
        Helpers.logDebug('Can\'t bind event, selector is required');
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
        Helpers.logDebug('Found ' +
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
        Helpers.logDebug('No elements found');
    }
}

module.exports = {
    send: send,
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
    logCommerceEvent: logCommerceEvent,
    addEventHandler: addEventHandler
};

},{"./constants":1,"./ecommerce":3,"./forwarders":5,"./helpers":6,"./mp":9,"./persistence":10,"./serverModel":12,"./types":14}],5:[function(require,module,exports){
var Helpers = require('./helpers'),
    Constants = require('./constants'),
    Types = require('./types'),
    MP = require('./mp');

function sendForwardingStats(forwarder, event) {
    var xhr,
        forwardingStat;

    if (forwarder && forwarder.isVisible) {
        xhr = Helpers.createXHR();
        forwardingStat = JSON.stringify({
            mid: forwarder.id,
            n: event.EventName,
            attrs: event.EventAttributes,
            sdk: event.SDKVersion,
            dt: event.EventDataType,
            et: event.EventCategory,
            dbg: event.Debug,
            ct: event.Timestamp,
            eec: event.ExpandedEventCount
        });

        if (xhr) {
            try {
                xhr.open('post', Helpers.createServiceUrl(Constants.secureServiceUrl, Constants.serviceUrl, MP.devToken) + '/Forwarding');
                xhr.send(forwardingStat);
            }
            catch (e) {
                Helpers.logDebug('Error sending forwarding stats to mParticle servers.');
            }
        }
    }
}

function initForwarders(identifyRequest) {
    if (!Helpers.isWebViewEmbedded() && MP.forwarders) {
        // Some js libraries require that they be loaded first, or last, etc
        MP.forwarders.sort(function(x, y) {
            x.settings.PriorityValue = x.settings.PriorityValue || 0;
            y.settings.PriorityValue = y.settings.PriorityValue || 0;
            return -1 * (x.settings.PriorityValue - y.settings.PriorityValue);
        });

        MP.forwarders.forEach(function(forwarder) {
            var filteredUserIdentities = Helpers.filterUserIdentities(identifyRequest.userIdentities, forwarder.userIdentityFilters);

            forwarder.init(forwarder.settings,
                sendForwardingStats,
                false,
                null,
                MP.userAttributes,
                filteredUserIdentities,
                MP.appVersion,
                MP.appName,
                MP.customFlags,
                MP.clientId);
        });
    }
}

function applyToForwarders(functionName, functionArgs) {
    if (MP.forwarders.length) {
        MP.forwarders.forEach(function(forwarder) {
            var forwarderFunction = forwarder[functionName];
            if (forwarderFunction) {
                try {
                    var result = forwarder[functionName](forwarder, functionArgs);

                    if (result) {
                        Helpers.logDebug(result);
                    }
                }
                catch (e) {
                    Helpers.logDebug(e);
                }
            }
        });
    }
}

function sendEventToForwarders(event) {
    var clonedEvent,
        hashedName,
        hashedType,
        filterUserAttributes = function(event, filterList) {
            var hash;

            if (event.UserAttributes) {
                for (var attrName in event.UserAttributes) {
                    if (event.UserAttributes.hasOwnProperty(attrName)) {
                        hash = Helpers.generateHash(attrName);

                        if (Helpers.inArray(filterList, hash)) {
                            delete event.UserAttributes[attrName];
                        }
                    }
                }
            }
        },
        filterUserAttributeValues = function(event, filterObject) {
            var attrHash,
                valueHash,
                match = false;

            try {
                if (event.UserAttributes && Helpers.isObject(event.UserAttributes) && Object.keys(event.UserAttributes).length) {
                    if (filterObject && Helpers.isObject(filterObject) && Object.keys(filterObject).length) {
                        for (var attrName in event.UserAttributes) {
                            if (event.UserAttributes.hasOwnProperty(attrName)) {
                                attrHash = Helpers.generateHash(attrName);
                                valueHash = Helpers.generateHash(event.UserAttributes[attrName]);

                                if ((attrHash === filterObject.userAttributeName) && (valueHash === filterObject.userAttributeValue)) {
                                    match = true;
                                    break;
                                }
                            }
                        }
                    }
                }

                if (match) {
                    if (filterObject.includeOnMatch) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    if (filterObject.includeOnMatch) {
                        return false;
                    } else {
                        return true;
                    }
                }
            } catch (e) {
                // in any error scenario, err on side of returning true and forwarding event
                return true;
            }
        },
        filterUserIdentities = function(event, filterList) {
            if (event.UserIdentities && event.UserIdentities.length) {
                event.UserIdentities.forEach(function(userIdentity, i) {
                    if (Helpers.inArray(filterList, userIdentity.Type)) {
                        event.UserIdentities.splice(i, 1);

                        if (i > 0) {
                            i--;
                        }
                    }
                });
            }
        },

        filterAttributes = function(event, filterList) {
            var hash;

            if (!filterList) {
                return;
            }

            for (var attrName in event.EventAttributes) {
                if (event.EventAttributes.hasOwnProperty(attrName)) {
                    hash = Helpers.generateHash(event.EventCategory + event.EventName + attrName);

                    if (Helpers.inArray(filterList, hash)) {
                        delete event.EventAttributes[attrName];
                    }
                }
            }
        },
        inFilteredList = function(filterList, hash) {
            if (filterList && filterList.length) {
                if (Helpers.inArray(filterList, hash)) {
                    return true;
                }
            }

            return false;
        },
        forwardingRuleMessageTypes = [
            Types.MessageType.PageEvent,
            Types.MessageType.PageView,
            Types.MessageType.Commerce
        ];

    if (!Helpers.isWebViewEmbedded() && MP.forwarders) {
        hashedName = Helpers.generateHash(event.EventCategory + event.EventName);
        hashedType = Helpers.generateHash(event.EventCategory);

        for (var i = 0; i < MP.forwarders.length; i++) {
            // Check attribute forwarding rule. This rule allows users to only forward an event if a
            // specific attribute exists and has a specific value. Alternatively, they can specify
            // that an event not be forwarded if the specified attribute name and value exists.
            // The two cases are controlled by the "includeOnMatch" boolean value.
            // Supported message types for attribute forwarding rules are defined in the forwardingRuleMessageTypes array

            if (forwardingRuleMessageTypes.indexOf(event.EventDataType) > -1
                && MP.forwarders[i].filteringEventAttributeValue
                && MP.forwarders[i].filteringEventAttributeValue.eventAttributeName
                && MP.forwarders[i].filteringEventAttributeValue.eventAttributeValue) {

                var foundProp = null;

                // Attempt to find the attribute in the collection of event attributes
                if (event.EventAttributes) {
                    for (var prop in event.EventAttributes) {
                        hashedName = Helpers.generateHash(prop);

                        if (hashedName === MP.forwarders[i].filteringEventAttributeValue.eventAttributeName) {
                            foundProp = {
                                name: hashedName,
                                value: Helpers.generateHash(event.EventAttributes[prop])
                            };
                        }

                        break;
                    }
                }

                var isMatch = foundProp !== null && foundProp.value === MP.forwarders[i].filteringEventAttributeValue.eventAttributeValue;

                var shouldInclude = MP.forwarders[i].filteringEventAttributeValue.includeOnMatch === true ? isMatch : !isMatch;

                if (!shouldInclude) {
                    continue;
                }
            }

            // Clone the event object, as we could be sending different attributes to each forwarder
            clonedEvent = {};
            clonedEvent = Helpers.extend(true, clonedEvent, event);
            // Check event filtering rules
            if (event.EventDataType === Types.MessageType.PageEvent
                && (inFilteredList(MP.forwarders[i].eventNameFilters, hashedName)
                    || inFilteredList(MP.forwarders[i].eventTypeFilters, hashedType))) {
                continue;
            }
            else if (event.EventDataType === Types.MessageType.Commerce && inFilteredList(MP.forwarders[i].eventTypeFilters, hashedType)) {
                continue;
            }
            else if (event.EventDataType === Types.MessageType.PageView && inFilteredList(MP.forwarders[i].screenNameFilters, hashedName)) {
                continue;
            }

            // Check attribute filtering rules
            if (clonedEvent.EventAttributes) {
                if (event.EventDataType === Types.MessageType.PageEvent) {
                    filterAttributes(clonedEvent, MP.forwarders[i].attributeFilters);
                }
                else if (event.EventDataType === Types.MessageType.PageView) {
                    filterAttributes(clonedEvent, MP.forwarders[i].pageViewAttributeFilters);
                }
            }

            // Check user identity filtering rules
            filterUserIdentities(clonedEvent, MP.forwarders[i].userIdentityFilters);

            // Check user attribute filtering rules
            filterUserAttributes(clonedEvent, MP.forwarders[i].userAttributeFilters);

            // Check user attribute value filtering rules
            if (MP.forwarders[i].filteringUserAttributeValue && Object.keys(MP.forwarders[i].filteringUserAttributeValue).length) {
                if (!filterUserAttributeValues(clonedEvent, MP.forwarders[i].filteringUserAttributeValue)) {
                    break;
                }
            }

            Helpers.logDebug('Sending message to forwarder: ' + MP.forwarders[i].name);
            var result = MP.forwarders[i].process(clonedEvent);

            if (result) {
                Helpers.logDebug(result);
            }
        }
    }
}

function callSetUserAttributeOnForwarders(key, value) {
    if (MP.forwarders.length) {
        MP.forwarders.forEach(function(forwarder) {
            if (forwarder.setUserAttribute &&
                forwarder.userAttributeFilters &&
                !Helpers.inArray(forwarder.userAttributeFilters, Helpers.generateHash(key))) {

                try {
                    var result = forwarder.setUserAttribute(key, value);

                    if (result) {
                        Helpers.logDebug(result);
                    }
                }
                catch (e) {
                    Helpers.logDebug(e);
                }
            }
        });
    }
}

function setForwarderUserIdentities(userIdentities) {
    MP.forwarders.forEach(function(forwarder) {
        var filteredUserIdentities = Helpers.filterUserIdentities(userIdentities, forwarder.userIdentityFilters);
        if (forwarder.setUserIdentity) {
            filteredUserIdentities.forEach(function(identity) {
                var result = forwarder.setUserIdentity(identity.Identity, identity.Type);
                if (result) {
                    Helpers.logDebug(result);
                }
            });
        }
    });
}

module.exports = {
    initForwarders: initForwarders,
    applyToForwarders: applyToForwarders,
    sendEventToForwarders: sendEventToForwarders,
    callSetUserAttributeOnForwarders: callSetUserAttributeOnForwarders,
    setForwarderUserIdentities: setForwarderUserIdentities
};

},{"./constants":1,"./helpers":6,"./mp":9,"./types":14}],6:[function(require,module,exports){
var Types = require('./types'),
    Constants = require('./constants'),
    Messages = Constants.Messages,
    MP = require('./mp'),
    pluses = /\+/g,
    serviceScheme = window.location.protocol + '//';

function logDebug(msg) {
    if (mParticle.isDevelopmentMode && window.console && window.console.log) {
        window.console.log(msg);
    }
}

function isUIWebView() {
    return /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent);
}

function canLog() {
    if (MP.isEnabled && (MP.devToken || isWebViewEmbedded())) {
        return true;
    }

    return false;
}

// Standalone version of jQuery.extend, from https://github.com/dansdom/extend
function extend() {
    var options, name, src, copy, copyIsArray, clone,
        target = arguments[0] || {},
        i = 1,
        length = arguments.length,
        deep = false,
        // helper which replicates the jquery internal functions
        objectHelper = {
            hasOwn: Object.prototype.hasOwnProperty,
            class2type: {},
            type: function(obj) {
                return obj == null ?
                    String(obj) :
                    objectHelper.class2type[Object.prototype.toString.call(obj)] || 'object';
            },
            isPlainObject: function(obj) {
                if (!obj || objectHelper.type(obj) !== 'object' || obj.nodeType || objectHelper.isWindow(obj)) {
                    return false;
                }

                try {
                    if (obj.constructor &&
                        !objectHelper.hasOwn.call(obj, 'constructor') &&
                        !objectHelper.hasOwn.call(obj.constructor.prototype, 'isPrototypeOf')) {
                        return false;
                    }
                } catch (e) {
                    return false;
                }

                var key;
                for (key in obj) { } // eslint-disable-line no-empty

                return key === undefined || objectHelper.hasOwn.call(obj, key);
            },
            isArray: Array.isArray || function(obj) {
                return objectHelper.type(obj) === 'array';
            },
            isFunction: function(obj) {
                return objectHelper.type(obj) === 'function';
            },
            isWindow: function(obj) {
                return obj != null && obj == obj.window;
            }
        };  // end of objectHelper

    // Handle a deep copy situation
    if (typeof target === 'boolean') {
        deep = target;
        target = arguments[1] || {};
        // skip the boolean and the target
        i = 2;
    }

    // Handle case when target is a string or something (possible in deep copy)
    if (typeof target !== 'object' && !objectHelper.isFunction(target)) {
        target = {};
    }

    // If no second argument is used then this can extend an object that is using this method
    if (length === i) {
        target = this;
        --i;
    }

    for (; i < length; i++) {
        // Only deal with non-null/undefined values
        if ((options = arguments[i]) != null) {
            // Extend the base object
            for (name in options) {
                src = target[name];
                copy = options[name];

                // Prevent never-ending loop
                if (target === copy) {
                    continue;
                }

                // Recurse if we're merging plain objects or arrays
                if (deep && copy && (objectHelper.isPlainObject(copy) || (copyIsArray = objectHelper.isArray(copy)))) {
                    if (copyIsArray) {
                        copyIsArray = false;
                        clone = src && objectHelper.isArray(src) ? src : [];

                    } else {
                        clone = src && objectHelper.isPlainObject(src) ? src : {};
                    }

                    // Never move original objects, clone them
                    target[name] = extend(deep, clone, copy);

                    // Don't bring in undefined values
                } else if (copy !== undefined) {
                    target[name] = copy;
                }
            }
        }
    }

    // Return the modified object
    return target;
}

function isObject(value) {
    var objType = Object.prototype.toString.call(value);

    return objType === '[object Object]'
        || objType === '[object Error]';
}

function inArray(items, name) {
    var i = 0;

    if (Array.prototype.indexOf) {
        return items.indexOf(name, 0) >= 0;
    }
    else {
        for (var n = items.length; i < n; i++) {
            if (i in items && items[i] === name) {
                return true;
            }
        }
    }
}

function tryNativeSdk(path, value) {
    if (!mParticle.useNativeSdk) {
        return false;
    }
    if (window.mParticleAndroid && window.mParticleAndroid.hasOwnProperty(path)) {
        logDebug(Messages.InformationMessages.SendAndroid + path);
        window.mParticleAndroid[path](value);

        return true;
    }
    else if (window.mParticle.isIOS || isUIWebView()) {
        logDebug(Messages.InformationMessages.SendIOS + path);
        var iframe = document.createElement('IFRAME');
        iframe.setAttribute('src', 'mp-sdk://' + path + '/' + value);
        document.documentElement.appendChild(iframe);
        iframe.parentNode.removeChild(iframe);
        iframe = null;

        return true;
    }

    return false;
}

function createServiceUrl(secureServiceUrl, serviceUrl, devToken) {
    return serviceScheme + ((window.location.protocol === 'https:') ? secureServiceUrl : serviceUrl) + devToken;
}

function isWebViewEmbedded() {
    if (!mParticle.useNativeSdk) {
        return false;
    }
    if (window.mParticleAndroid
        || isUIWebView()
        || window.mParticle.isIOS) {
        return true;
    }

    return false;
}

function createXHR(cb) {
    var xhr;

    try {
        xhr = new window.XMLHttpRequest();
    }
    catch (e) {
        logDebug('Error creating XMLHttpRequest object.');
    }

    if (xhr && cb && 'withCredentials' in xhr) {
        xhr.onreadystatechange = cb;
    }
    else if (typeof window.XDomainRequest !== 'undefined') {
        logDebug('Creating XDomainRequest object');

        try {
            xhr = new window.XDomainRequest();
            xhr.onload = cb;
        }
        catch (e) {
            logDebug('Error creating XDomainRequest object');
        }
    }

    return xhr;
}

function generateRandomValue(a) {
    if (window.crypto && window.crypto.getRandomValues) {
        return (a ^ window.crypto.getRandomValues(new Uint8Array(1))[0] % 16 >> a/4).toString(16); // eslint-disable-line no-undef
    }

    return (a ^ Math.random() * 16 >> a/4).toString(16);
}

function generateUniqueId(a) {
    // https://gist.github.com/jed/982883
    // Added support for crypto for better random

    return a                            // if the placeholder was passed, return
            ? generateRandomValue(a)    // a random number
            : (                         // or otherwise a concatenated string:
            [1e7] +                     // 10000000 +
            -1e3 +                      // -1000 +
            -4e3 +                      // -4000 +
            -8e3 +                      // -80000000 +
            -1e11                       // -100000000000,
            ).replace(                  // replacing
                /[018]/g,               // zeroes, ones, and eights with
                generateUniqueId        // random hex digits
            );
}

function filterUserIdentities(userIdentitiesObject, filterList) {
    var filteredUserIdentities = [];

    if (userIdentitiesObject && Object.keys(userIdentitiesObject).length) {
        for (var userIdentityName in userIdentitiesObject) {
            if (userIdentitiesObject.hasOwnProperty(userIdentityName)) {
                var userIdentityType = Types.IdentityType.getIdentityType(userIdentityName);
                if (!inArray(filterList, userIdentityType)) {
                    filteredUserIdentities.push({
                        Type: userIdentityType,
                        Identity: userIdentitiesObject[userIdentityName]
                    });
                }
            }
        }
    }

    return filteredUserIdentities;
}

function findKeyInObject(obj, key) {
    if (key && obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop) && prop.toLowerCase() === key.toLowerCase()) {
                return prop;
            }
        }
    }

    return null;
}

function decoded(s) {
    return decodeURIComponent(s.replace(pluses, ' '));
}

function converted(s) {
    if (s.indexOf('"') === 0) {
        s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }

    return s;
}

function isEventType(type) {
    for (var prop in Types.EventType) {
        if (Types.EventType.hasOwnProperty(prop)) {
            if (Types.EventType[prop] === type) {
                return true;
            }
        }
    }
    return false;
}

function parseNumber(value) {
    if (isNaN(value) || !isFinite(value)) {
        return 0;
    }
    var floatValue = parseFloat(value);
    return isNaN(floatValue) ? 0 : floatValue;
}

function generateHash(name) {
    var hash = 0,
        i = 0,
        character;

    if (!name) {
        return null;
    }

    name = name.toString().toLowerCase();

    if (Array.prototype.reduce) {
        return name.split('').reduce(function(a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
    }

    if (name.length === 0) {
        return hash;
    }

    for (i = 0; i < name.length; i++) {
        character = name.charCodeAt(i);
        hash = ((hash << 5) - hash) + character;
        hash = hash & hash;
    }

    return hash;
}

function sanitizeAttributes(attrs) {
    if (!attrs || !isObject(attrs)) {
        return null;
    }

    var sanitizedAttrs = {};

    for (var prop in attrs) {
        // Make sure that attribute values are not objects or arrays, which are not valid
        if (attrs.hasOwnProperty(prop) && Validators.isValidAttributeValue(attrs[prop])) {
            sanitizedAttrs[prop] = attrs[prop];
        }
    }

    return sanitizedAttrs;
}

function mergeConfig(config) {
    logDebug(Messages.InformationMessages.LoadingConfig);

    for (var prop in Constants.DefaultConfig) {
        if (Constants.DefaultConfig.hasOwnProperty(prop)) {
            MP.Config[prop] = Constants.DefaultConfig[prop];
        }

        if (config.hasOwnProperty(prop)) {
            MP.Config[prop] = config[prop];
        }
    }
}

var Validators = {
    isValidAttributeValue: function(value) {
        return value !== undefined && !isObject(value) && !Array.isArray(value);
    },

    // Neither null nor undefined can be a valid Key
    isValidKeyValue: function(key) {
        return Boolean(key && !isObject(key) && !Array.isArray(key));
    },

    isStringOrNumber: function(value) {
        return (typeof value === 'string' || typeof value === 'number');
    },

    isFunction: function(fn) {
        return typeof fn === 'function';
    },

    validateIdentities: function(identityApiData, method) {
        if (identityApiData) {
            if (method === 'modify') {
                if (isObject(identityApiData.userIdentities) && !Object.keys(identityApiData.userIdentities).length || !isObject(identityApiData.userIdentities)) {
                    return {
                        valid: false,
                        error: 'identityRequests to modify require userIdentities to be present. Request not sent to server. Please fix and try again.'
                    };
                } else {
                    return {
                        valid: true
                    };
                }
            }
            for (var key in identityApiData) {
                if (identityApiData.hasOwnProperty(key)) {
                    if (!(key === 'userIdentities' || key === 'copyUserAttributes')) {
                        return {
                            valid: false,
                            error: 'There is an invalid key on your identityRequest object. It can only contain a userIdentities object and copyUserAttributes boolean. Request not sent to server. Please fix and try again.'
                        };
                    }
                }
            }
            if (Object.keys(identityApiData).length === 0) {
                return {
                    valid: true
                };
            } else {
                if (!isObject(identityApiData.userIdentities)) {
                    return {
                        valid: false,
                        error: 'The userIdentities key must be an object with keys of identityTypes and values of strings. Request not sent to server. Please fix and try again.'
                    };
                }
                if (isObject(identityApiData.userIdentities) && Object.keys(identityApiData.userIdentities).length) {
                    for (var identityType in identityApiData.userIdentities) {
                        if (identityApiData.userIdentities.hasOwnProperty(identityType)) {
                            if (Types.IdentityType.getIdentityType(identityType) === false) {
                                return {
                                    valid: false,
                                    error: 'There is an invalid identity key on your `userIdentities` object within the identityRequest. Request not sent to server. Please fix and try again.'
                                };
                            }
                            if (!(typeof identityApiData.userIdentities[identityType] === 'string' || identityApiData.userIdentities[identityType] === null)) {
                                return {
                                    valid: false,
                                    error: 'All user identity values must be strings or null. Request not sent to server. Please fix and try again.'
                                };
                            }
                        }
                    }
                }
                if (!identityApiData.hasOwnProperty('copyUserAttributes')) {
                    return {
                        valid: true,
                        warning: 'By default, user attributes will not be copied when a new identity is returned. If you\'d like user attributes to be copied, include `copyUserAttributes = true` on the identifyRequest object. Request sent to server.'
                    };
                }
            }
        }
        return {
            valid: true
        };
    }
};

module.exports = {
    logDebug: logDebug,
    canLog: canLog,
    extend: extend,
    isObject: isObject,
    inArray: inArray,
    tryNativeSdk: tryNativeSdk,
    createServiceUrl: createServiceUrl,
    isWebViewEmbedded: isWebViewEmbedded,
    createXHR: createXHR,
    generateUniqueId: generateUniqueId,
    filterUserIdentities: filterUserIdentities,
    findKeyInObject: findKeyInObject,
    decoded: decoded,
    converted: converted,
    isEventType: isEventType,
    parseNumber: parseNumber,
    generateHash: generateHash,
    sanitizeAttributes: sanitizeAttributes,
    mergeConfig:mergeConfig,
    Validators: Validators
};

},{"./constants":1,"./mp":9,"./types":14}],7:[function(require,module,exports){
var Helpers = require('./helpers'),
    Constants = require('./constants'),
    ServerModel = require('./serverModel'),
    Forwarders = require('./forwarders'),
    Persistence = require('./persistence'),
    Types = require('./types'),
    Messages = Constants.Messages,
    MP = require('./mp'),
    Validators = Helpers.Validators,
    send = require('./events').send,
    CookieSyncManager = require('./cookieSyncManager');

var Identity = {
    checkIdentitySwap: function(previousMPID, currentMPID) {
        if (previousMPID && currentMPID && previousMPID !== currentMPID) {
            var cookies = Persistence.useLocalStorage() ? Persistence.getLocalStorage() : Persistence.getCookie();
            Persistence.storeDataInMemory(cookies, currentMPID);
            Persistence.update();
        }
    },
    migrate: function(isFirstRun) {
        var cookies = Persistence.useLocalStorage ? Persistence.getLocalStorage() : Persistence.getCookie();
        // migration occurs when it is not the first run and there is no currentUserMPID on the cookie
        if (!isFirstRun && cookies && !cookies.currentUserMPID) {
            if (Persistence.useLocalStorage) {
                Persistence.removeLocalStorage();
            } else {
                Persistence.expireCookies();
            }
            Persistence.update();
        }
    }
};

var IdentityRequest = {
    createKnownIdentities: function(identityApiData, deviceId) {
        var identitiesResult = {};

        if (identityApiData && identityApiData.userIdentities && Helpers.isObject(identityApiData.userIdentities)) {
            for (var identity in identityApiData.userIdentities) {
                identitiesResult[identity] = identityApiData.userIdentities[identity];
            }
        }
        identitiesResult.device_application_stamp = deviceId;

        return identitiesResult;
    },

    preProcessIdentityRequest: function(identityApiData, callback, method) {
        Helpers.logDebug(Messages.InformationMessages.StartingLogEvent + ': ' + method);

        var identityValidationResult = Validators.validateIdentities(identityApiData, method);

        if (!identityValidationResult.valid) {
            Helpers.logDebug('ERROR: ' + identityValidationResult.error);
            return {
                valid: false,
                error: identityValidationResult.error
            };
        }

        if (callback && !Validators.isFunction(callback)) {
            Helpers.logDebug('The optional callback must be a function. You tried entering a(n) ' + typeof fn);
            return {
                valid: false,
                error: 'The optional callback must be a function. You tried entering a(n) ' + typeof fn
            };
        }

        if (identityValidationResult.warning) {
            Helpers.logDebug('WARNING:' + identityValidationResult.warning);
            return {
                valid: true,
                error: identityValidationResult.warning
            };
        }

        return {
            valid: true
        };
    },

    createIdentityRequest: function(identityApiData, platform, sdkVendor, sdkVersion, deviceId, context, mpid) {
        var APIRequest = {
            client_sdk: {
                platform: platform,
                sdk_vendor: sdkVendor,
                sdk_version: sdkVersion
            },
            context: context,
            environment: mParticle.isDevelopmentMode ? 'development' : 'production',
            request_id: Helpers.generateUniqueId(),
            request_timestamp_ms: new Date().getTime(),
            previous_mpid: mpid || null,
            known_identities: this.createKnownIdentities(identityApiData, deviceId)
        };

        return APIRequest;
    },

    createModifyIdentityRequest: function(currentUserIdentities, newUserIdentities, platform, sdkVendor, sdkVersion, context) {
        return {
            client_sdk: {
                platform: platform,
                sdk_vendor: sdkVendor,
                sdk_version: sdkVersion
            },
            context: context,
            environment: mParticle.isDevelopmentMode ? 'development' : 'production',
            request_id: Helpers.generateUniqueId(),
            request_timestamp_ms: new Date().getTime(),
            identity_changes: this.createIdentityChanges(currentUserIdentities, newUserIdentities)
        };
    },

    createIdentityChanges: function(previousIdentities, newIdentities) {
        var identityChanges = [];
        var key;
        if (newIdentities && Helpers.isObject(newIdentities) && previousIdentities && Helpers.isObject(previousIdentities)) {
            for (key in newIdentities) {
                identityChanges.push({
                    old_value: previousIdentities[key] || null,
                    new_value: newIdentities[key],
                    identity_type: key
                });
            }
        }

        return identityChanges;
    },

    returnCopyAttributes: function(identityApiData) {
        return (identityApiData && identityApiData.copyUserAttributes);
    },

    modifyUserIdentities: function(previousUserIdentities, newUserIdentities) {
        var modifiedUserIdentities = {};

        for (var key in newUserIdentities) {
            modifiedUserIdentities[key] = newUserIdentities[key];
        }

        for (key in previousUserIdentities) {
            if (!modifiedUserIdentities[key]) {
                modifiedUserIdentities[key] = previousUserIdentities[key];
            }
        }

        return modifiedUserIdentities;
    }
};

var IdentityAPI = {
    logout: function(identityApiData, callback) {
        var preProcessResult = IdentityRequest.preProcessIdentityRequest(identityApiData, callback, 'logout');

        if (preProcessResult.valid) {
            var evt,
                identityApiRequest = IdentityRequest.createIdentityRequest(identityApiData, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, MP.deviceId, MP.context, MP.mpid),
                copyAttributes = IdentityRequest.returnCopyAttributes(identityApiData);

            if (Helpers.canLog()) {
                if (!Helpers.tryNativeSdk(Constants.NativeSdkPaths.Logout)) {
                    sendIdentityRequest(identityApiRequest, 'logout', callback, copyAttributes, identityApiData);
                    evt = ServerModel.createEventObject(Types.MessageType.Profile);
                    evt.ProfileMessageType = Types.ProfileMessageType.Logout;

                    if (MP.forwarders.length) {
                        MP.forwarders.forEach(function(forwarder) {
                            if (forwarder.logOut) {
                                forwarder.logOut(evt);
                            }
                        });
                    }
                }
            }
            else {
                Helpers.logDebug(Messages.InformationMessages.AbandonLogEvent);
            }
        } else {
            if (Validators.isFunction(callback)) {
                callback(preProcessResult);
            } else {
                Helpers.logDebug(preProcessResult);
            }
        }
    },
    login: function(identityApiData, callback) {
        var preProcessResult = IdentityRequest.preProcessIdentityRequest(identityApiData, callback, 'login');

        if (preProcessResult.valid) {
            var identityApiRequest = IdentityRequest.createIdentityRequest(identityApiData, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, MP.deviceId, MP.context, MP.mpid),
                copyAttributes = IdentityRequest.returnCopyAttributes(identityApiData);

            if (Helpers.canLog()) {
                if (!Helpers.tryNativeSdk(Constants.NativeSdkPaths.Login)) {
                    sendIdentityRequest(identityApiRequest, 'login', callback, copyAttributes, identityApiData);
                }
            }
            else {
                Helpers.logDebug(Messages.InformationMessages.AbandonLogEvent);
            }
        } else {
            if (Validators.isFunction(callback)) {
                callback(preProcessResult);
            } else {
                Helpers.logDebug(preProcessResult);
            }
        }
    },
    modify: function(identityApiData, callback) {
        var newUserIdentities = (identityApiData && identityApiData.userIdentities) ? identityApiData.userIdentities : {};
        var preProcessResult = IdentityRequest.preProcessIdentityRequest(identityApiData, callback, 'modify');
        if (preProcessResult.valid) {
            var identityApiRequest = IdentityRequest.createModifyIdentityRequest(MP.userIdentities, newUserIdentities, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, MP.context);

            if (Helpers.canLog()) {
                if (!Helpers.tryNativeSdk(Constants.NativeSdkPaths.Modify)) {
                    sendIdentityRequest(identityApiRequest, 'modify', callback, null, identityApiData);
                }
            }
            else {
                Helpers.logDebug(Messages.InformationMessages.AbandonLogEvent);
            }
        } else {
            if (Validators.isFunction(callback)) {
                callback(preProcessResult);
            } else {
                Helpers.logDebug(preProcessResult);
            }
        }
    },
    getCurrentUser: function() {
        return mParticleUser;
    }
};

var mParticleUser = {
    getUserIdentities: function() {
        var currentUserIdentities = {};
        if (Array.isArray(MP.userIdentities)) {
            MP.userIdentities.map(function(identity) {
                currentUserIdentities[identity.type] = identity.id;
            });
        } else {
            currentUserIdentities = MP.userIdentities;
        }
        return {
            userIdentities: currentUserIdentities
        };
    },
    getMPID: function() {
        return MP.mpid;
    },
    setUserTag: function(tagName) {
        mParticle.sessionManager.resetSessionTimer();

        if (!Validators.isValidKeyValue(tagName)) {
            Helpers.logDebug(Messages.ErrorMessages.BadKey);
            return;
        }

        window.mParticle.Identity.getCurrentUser().setUserAttribute(tagName, null);
    },
    removeUserTag: function(tagName) {
        mParticle.sessionManager.resetSessionTimer();

        if (!Validators.isValidKeyValue(tagName)) {
            Helpers.logDebug(Messages.ErrorMessages.BadKey);
            return;
        }

        window.mParticle.Identity.getCurrentUser().removeUserAttribute(tagName);
    },
    setUserAttribute: function(key, value) {
        mParticle.sessionManager.resetSessionTimer();
        // Logs to cookie
        // And logs to in-memory object
        // Example: mParticle.Identity.getCurrentUser.setUserAttribute('email', 'tbreffni@mparticle.com');
        if (Helpers.canLog()) {
            if (!Validators.isValidAttributeValue(value)) {
                Helpers.logDebug(Messages.ErrorMessages.BadAttribute);
                return;
            }

            if (!Validators.isValidKeyValue(key)) {
                Helpers.logDebug(Messages.ErrorMessages.BadKey);
                return;
            }

            var existingProp = Helpers.findKeyInObject(MP.userAttributes, key);

            if (existingProp) {
                delete MP.userAttributes[existingProp];
            }

            MP.userAttributes[key] = value;
            Persistence.update();

            if (!Helpers.tryNativeSdk(Constants.NativeSdkPaths.SetUserAttribute, JSON.stringify({ key: key, value: value }))) {
                Forwarders.callSetUserAttributeOnForwarders(key, value);
            }
        }
    },
    removeUserAttribute: function(key) {
        mParticle.sessionManager.resetSessionTimer();

        if (!Validators.isValidKeyValue(key)) {
            Helpers.logDebug(Messages.ErrorMessages.BadKey);
            return;
        }

        var existingProp = Helpers.findKeyInObject(MP.userAttributes, key);

        if (existingProp) {
            key = existingProp;
        }

        delete MP.userAttributes[key];

        if (!Helpers.tryNativeSdk(Constants.NativeSdkPaths.RemoveUserAttribute, JSON.stringify({ key: key, value: null }))) {
            Forwarders.applyToForwarders('removeUserAttribute', key);
        }

        Persistence.update();
    },
    setUserAttributeList: function(key, value) {
        mParticle.sessionManager.resetSessionTimer();

        if (!Validators.isValidKeyValue(key)) {
            Helpers.logDebug(Messages.ErrorMessages.BadKey);
            return;
        }

        if (Array.isArray(value)) {
            var arrayCopy = value.slice();

            var existingProp = Helpers.findKeyInObject(MP.userAttributes, key);

            if (existingProp) {
                delete MP.userAttributes[existingProp];
            }

            MP.userAttributes[key] = arrayCopy;
            Persistence.update();

            if (!Helpers.tryNativeSdk(Constants.NativeSdkPaths.SetUserAttributeList, JSON.stringify({ key: key, value: arrayCopy }))) {
                Forwarders.callSetUserAttributeOnForwarders(key, arrayCopy);
            }
        }
    },
    removeAllUserAttributes: function() {
        mParticle.sessionManager.resetSessionTimer();
        if (!Helpers.tryNativeSdk(Constants.NativeSdkPaths.RemoveAllUserAttributes)) {
            if (MP.userAttributes) {
                for (var prop in MP.userAttributes) {
                    if (MP.userAttributes.hasOwnProperty(prop)) {
                        Forwarders.applyToForwarders('removeUserAttribute', MP.userAttributes[prop]);
                    }
                }
            }
        }

        MP.userAttributes = {};
        Persistence.update();
    },
    getUserAttributesLists: function() {
        var userAttributeLists = {};

        for (var key in MP.userAttributes) {
            if (MP.userAttributes.hasOwnProperty(key) && Array.isArray(MP.userAttributes[key])) {
                userAttributeLists[key] = MP.userAttributes[key].slice();
            }
        }

        return userAttributeLists;
    },
    getAllUserAttributes: function() {
        var userAttributesCopy = {};

        if (MP.userAttributes) {
            for (var prop in MP.userAttributes) {
                if (MP.userAttributes.hasOwnProperty(prop)) {
                    if (Array.isArray(MP.userAttributes[prop])) {
                        userAttributesCopy[prop] = MP.userAttributes[prop].slice();
                    }
                    else {
                        userAttributesCopy[prop] = MP.userAttributes[prop];
                    }
                }
            }
        }

        return userAttributesCopy;
    }
};

function identify(identityApiData) {
    var preProcessResult = IdentityRequest.preProcessIdentityRequest(identityApiData, MP.identityCallback, 'identify');
    if (preProcessResult.valid) {
        var identityApiRequest = IdentityRequest.createIdentityRequest(identityApiData, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, MP.deviceId, MP.context, MP.mpid),
            copyAttributes = IdentityRequest.returnCopyAttributes(identityApiData);

        sendIdentityRequest(identityApiRequest, 'identify', MP.identityCallback, copyAttributes, identityApiData);
    } else {
        if (MP.identityCallback) {
            MP.identityCallback(preProcessResult);
        }
    }
}

function sendIdentityRequest(identityApiRequest, method, callback, copyAttributes, originalIdentityApiData) {
    var xhr, previousMPID,
        xhrCallback = function() {
            if (xhr.readyState === 4) {
                Helpers.logDebug('Received ' + xhr.statusText + ' from server');
                parseIdentityResponse(xhr, copyAttributes, previousMPID, callback, originalIdentityApiData, method);
            }
        };

    Helpers.logDebug(Messages.InformationMessages.SendIdentityBegin);

    if (!identityApiRequest) {
        Helpers.logDebug(Messages.ErrorMessages.APIRequestEmpty);
        return;
    }

    Helpers.logDebug(Messages.InformationMessages.SendIdentityHttp);
    xhr = Helpers.createXHR(xhrCallback);

    if (xhr) {
        try {
            if (!MP.identityCallInFlight) {
                previousMPID = (!MP.isFirstRun && MP.mpid) ? MP.mpid : null;
                if (method === 'modify') {
                    xhr.open('post', Constants.identityUrl + MP.mpid + '/' + method);
                } else {
                    xhr.open('post', Constants.identityUrl + method);
                }
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('x-mp-key', MP.devToken);
                MP.identityCallInFlight = true;
                xhr.send(JSON.stringify(identityApiRequest));
            } else {
                callback({httpCode: -2, body: 'There is currently an AJAX request processing. Please wait for this to return before requesting again'});
            }
        }
        catch (e) {
            MP.identityCallInFlight = false;
            if (callback) {
                callback({httpCode: -1, body: e});
            }
            Helpers.logDebug('Error sending identity request to servers with status code . ' + xhr.status + ' - ' + e);
        }
    }
}

function parseIdentityResponse(xhr, copyAttributes, previousMPID, callback, identityApiData, method) {
    var identityApiResult;
    MP.identityCallInFlight = false;

    try {
        Helpers.logDebug('Parsing identity response from server');
        if (xhr.responseText) {
            identityApiResult = JSON.parse(xhr.responseText);
        }

        if (xhr.status === 200) {
            if (method === 'modify') {
                MP.userIdentities = IdentityRequest.modifyUserIdentities(MP.userIdentities, identityApiData.userIdentities);
                Persistence.update();
            } else {
                identityApiResult = JSON.parse(xhr.responseText);

                Helpers.logDebug('Successfully parsed Identity Response');
                if (identityApiResult.mpid && identityApiResult.mpid !== MP.mpid) {
                    MP.mpid = identityApiResult.mpid;
                    if (!copyAttributes) {
                        MP.userAttributes = {};
                    } else {
                        for (var key in MP.userAttributes) {
                            if (MP.userAttributes.hasOwnProperty(key)) {
                                IdentityAPI.getCurrentUser().setUserAttribute(key, MP.userAttributes[key]);
                            }
                        }
                    }
                }

                checkCookieForMPID(MP.mpid);

                if (MP.sessionId && MP.mpid && previousMPID !== MP.mpid && MP.currentSessionMPIDs.indexOf(MP.mpid) < 0) {
                    MP.currentSessionMPIDs.push(MP.mpid);
                    // need to update currentSessionMPIDs in memory before checkingIdentitySwap otherwise previous obj.currentSessionMPIDs is used in checkIdentitySwap's Persistence.update()
                    Persistence.update();
                }

                CookieSyncManager.attemptCookieSync(previousMPID, MP.mpid);

                Identity.checkIdentitySwap(previousMPID, MP.mpid);

                // events exist in the eventQueue because they were triggered when the identityAPI request was in flight
                // once API request returns, eventQueue items are reassigned with the returned MPID and flushed
                if (MP.eventQueue.length && MP.mpid !==0) {
                    MP.eventQueue.forEach(function(event) {
                        event.MPID = MP.mpid;
                        send(event);
                    });
                    MP.eventQueue = [];
                }

                //if there is any previous migration data
                if (Object.keys(MP.migrationData).length) {
                    MP.userIdentities = MP.migrationData.userIdentities || {};
                    MP.userAttributes = MP.migrationData.userAttributes || {};
                    MP.cartProducts = MP.migrationData.cartProducts || [];
                    MP.productsBags = MP.migrationData.productsBags || {};
                    MP.cookieSyncDates = MP.migrationData.cookieSyncDates || {};
                } else {
                    if (identityApiData && identityApiData.userIdentities && Object.keys(identityApiData.userIdentities).length) {
                        MP.userIdentities = IdentityRequest.modifyUserIdentities(MP.userIdentities, identityApiData.userIdentities);
                    }
                }
                Persistence.update();
                Persistence.findPrevCookiesBasedOnUI(identityApiData);

                MP.context = identityApiResult.context || MP.context;
            }

            Forwarders.setForwarderUserIdentities(identityApiData.userIdentities);
        }

        if (callback) {
            callback({httpCode: xhr.status, body: identityApiResult || null});
        } else {
            if (identityApiResult && identityApiResult.errors && identityApiResult.errors.length) {
                Helpers.logDebug('Received HTTP response code of ' + xhr.status + ' - ' + identityApiResult.errors[0].message);
            }
        }
    }
    catch (e) {
        if (callback) {
            callback({httpCode: xhr.status, body: identityApiResult});
        }
        Helpers.logDebug('Error parsing JSON response from Identity server: ' + e);
    }
}

function checkCookieForMPID(currentMPID) {
    var cookies = Persistence.getCookie() || Persistence.getLocalStorage();
    if (cookies && !cookies[currentMPID]) {
        Persistence.storeDataInMemory(null, currentMPID);
    } else if (cookies) {
        MP.userIdentities = cookies[currentMPID].ui ? cookies[currentMPID].ui : MP.userIdentities;
        MP.userAttributes = cookies[currentMPID].ua ? cookies[currentMPID].ua : MP.userAttributes;
        MP.cartProducts = cookies[currentMPID].cp ? cookies[currentMPID].cp : MP.cartProducts;
        MP.productsBags = cookies[currentMPID].pb ? cookies[currentMPID].pb : MP.productsBags;
        MP.cookieSyncDates = cookies[currentMPID].csd ? cookies[currentMPID].csd : MP.cookieSyncDates;
    }
}

module.exports = {
    identify: identify,
    IdentityAPI: IdentityAPI,
    Identity: Identity,
    IdentityRequest: IdentityRequest
};

},{"./constants":1,"./cookieSyncManager":2,"./events":4,"./forwarders":5,"./helpers":6,"./mp":9,"./persistence":10,"./serverModel":12,"./types":14}],8:[function(require,module,exports){
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
    Forwarders = require('./forwarders'),
    IdentityRequest = require('./identity').IdentityRequest,
    Identity = require('./identity').Identity,
    IdentityAPI = require('./identity').IdentityAPI;


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
            // Determine if there is any data in cookies or localStorage to figure out if it is the first time the browser is loading mParticle
            if (!Persistence.getCookie() && !Persistence.getLocalStorage()) {
                MP.isFirstRun = true;
                MP.mpid = 0;
            } else {
                MP.isFirstRun = false;
            }

            // Load any settings/identities/attributes from cookie or localStorage
            Persistence.initializeStorage();
            /* Previous cookies only contained data from 1 MPID. New schema now holds multiple MPIDs and keys in memory data off latest MPID
            Previous cookie schema: { ui: [], ua: {} ...}
            Current cookie schema: {
                currentUserMPID: 'mpid1',
                mpid1: {
                    ui: [],
                    ua: {},
                    ...
                },
                mpid2: {
                    ui: [],
                    ua: {},
                    ...
                },
            }
            */
            MP.deviceId = Persistence.retrieveDeviceId();

            // If no identity is passed in, we set the user identities to what is currently in cookies for the identify request
            if ((Helpers.isObject(mParticle.identifyRequest) && Object.keys(mParticle.identifyRequest).length === 0) || !mParticle.identifyRequest) {
                MP.initialIdentifyRequest = {
                    userIdentities: MP.userIdentities
                };
            } else {
                MP.initialIdentifyRequest = mParticle.identifyRequest;
            }

            Forwarders.initForwarders(MP.initialIdentifyRequest);
            Identity.migrate(MP.isFirstRun);

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
            MP.productsBags = {};
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
            MP.identityCallInFlight = false,
            MP.initialIdentifyRequest = null,

            Persistence.expireCookies();
            if (Persistence.isLocalStorageAvailable) {
                localStorage.removeItem('mprtcl-api');
            }
            mParticle.sessionManager.resetSessionTimer();

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
                    if (!MP.productsBags[productBagName]) {
                        MP.productsBags[productBagName] = [];
                    }

                    MP.productsBags[productBagName].push(product);

                    if (MP.productsBags[productBagName].length > mParticle.maxProducts) {
                        Helpers.logDebug(productBagName + ' contains ' + MP.productsBags[productBagName].length + ' items. Only mParticle.maxProducts = ' + mParticle.maxProducts + ' can currently be saved in cookies.');
                    }
                    Persistence.update();

                    Helpers.tryNativeSdk(Constants.NativeSdkPaths.AddToProductBag, JSON.stringify(product));
                },
                remove: function(productBagName, product) {
                    mParticle.sessionManager.resetSessionTimer();
                    var productIndex = -1;

                    if (MP.productsBags[productBagName]) {
                        MP.productsBags[productBagName].forEach(function(productBagItem, i) {
                            if (productBagItem.sku === product.sku) {
                                productIndex = i;
                            }
                        });

                        if (productIndex > -1) {
                            MP.productsBags[productBagName].splice(productIndex, 1);
                        }
                        Persistence.update();
                    }
                    Helpers.tryNativeSdk(Constants.NativeSdkPaths.RemoveFromProductBag, JSON.stringify(product));
                },
                clear: function(productBagName) {
                    mParticle.sessionManager.resetSessionTimer();
                    MP.productsBags[productBagName] = [];
                    Persistence.update();

                    Helpers.tryNativeSdk(Constants.NativeSdkPaths.ClearProductBag, productBagName);
                }
            },
            Cart: {
                add: function(product, logEvent) {
                    mParticle.sessionManager.resetSessionTimer();
                    var arrayCopy;

                    arrayCopy = Array.isArray(product) ? product.slice() : [product];

                    MP.cartProducts = MP.cartProducts.concat(arrayCopy);

                    if (MP.cartProducts.length > mParticle.maxProducts) {
                        Helpers.logDebug('The cart contains ' + MP.cartProducts.length + ' items. Only mParticle.maxProducts = ' + mParticle.maxProducts + ' can currently be saved in cookies.');
                    }

                    if (Helpers.isWebViewEmbedded()) {
                        Helpers.tryNativeSdk(Constants.NativeSdkPaths.AddToCart, JSON.stringify(arrayCopy));
                    }
                    else if (logEvent === true) {
                        Events.logProductActionEvent(Types.ProductActionType.AddToCart, arrayCopy);
                    }
                    Persistence.update();
                },
                remove: function(product, logEvent) {
                    mParticle.sessionManager.resetSessionTimer();
                    var cartIndex = -1,
                        cartItem = null;

                    if (MP.cartProducts) {
                        MP.cartProducts.forEach(function(cartProduct, i) {
                            if (cartProduct.Sku === product.Sku) {
                                cartIndex = i;
                                cartItem = cartProduct;
                            }
                        });

                        if (cartIndex > -1) {
                            MP.cartProducts.splice(cartIndex, 1);

                            if (Helpers.isWebViewEmbedded()) {
                                Helpers.tryNativeSdk(Constants.NativeSdkPaths.RemoveFromCart, JSON.stringify(cartItem));
                            }
                            else if (logEvent === true) {
                                Events.logProductActionEvent(Types.ProductActionType.RemoveFromCart, cartItem);
                            }
                        }
                    }
                    Persistence.update();
                },
                clear: function() {
                    mParticle.sessionManager.resetSessionTimer();
                    MP.cartProducts = [];
                    Helpers.tryNativeSdk(Constants.NativeSdkPaths.ClearCart);
                    Persistence.update();
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

},{"./constants":1,"./cookieSyncManager":2,"./ecommerce":3,"./events":4,"./forwarders":5,"./helpers":6,"./identity":7,"./mp":9,"./persistence":10,"./polyfill":11,"./sessionManager":13,"./types":14}],9:[function(require,module,exports){
module.exports = {
    isEnabled: true,
    sessionAttributes: {},
    currentSessionMPIDs: [],
    userAttributes: {},
    userIdentities: {},
    forwarderConstructors: [],
    forwarders: [],
    sessionId: null,
    isFirstRun: null,
    clientId: null,
    deviceId: null,
    mpid: null,
    devToken: null,
    migrationData: {},
    pixelConfigurations: [],
    serverSettings: null,
    dateLastEventSent: null,
    cookieSyncDates: {},
    currentPosition: null,
    isTracking: false,
    watchPositionId: null,
    readyQueue: [],
    isInitialized: false,
    productsBags: {},
    cartProducts: [],
    eventQueue: [],
    currencyCode: null,
    appVersion: null,
    appName: null,
    customFlags: null,
    globalTimer: null,
    identityCallback: null,
    context: '',
    identityCallInFlight: false,
    initialIdentifyRequest: null,
    Config: {}
};

},{}],10:[function(require,module,exports){
var Helpers = require('./helpers'),
    Constants = require('./constants'),
    Types = require('./types'),
    Messages = Constants.Messages,
    MP = require('./mp');

function useLocalStorage() {
    return (!mParticle.useCookieStorage && this.isLocalStorageAvailable);
}

function initializeStorage() {
    var cookies,
        localStorageData;
    // Check to see if localStorage is available and if not, always use cookies
    this.isLocalStorageAvailable = this.determineLocalStorageAvailability();

    if (this.isLocalStorageAvailable) {
        if (mParticle.useCookieStorage) {
            // For migrating from localStorage to cookies -- If an instance switches from localStorage to cookies, then
            // no mParticle cookie exists yet and there is localStorage. Get the localStorage, set them to cookies, then delete the localStorage item.
            localStorageData = this.getLocalStorage();
            if (localStorageData) {
                this.storeDataInMemory(localStorageData);
                this.removeLocalStorage();
                this.update();
            } else {
                this.storeDataInMemory(this.getCookie());
            }
        }
        else {
            cookies = this.getCookie();
            // For migrating from cookie to localStorage -- If an instance is newly switching from cookies to localStorage, then
            // no mParticle localStorage exists yet and there are cookies. Get the cookies, set them to localStorage, then delete the cookies.
            if (cookies) {
                this.storeDataInMemory(cookies);
                this.expireCookies();
                this.update();
            } else {
                this.storeDataInMemory(this.getLocalStorage());
            }
        }
    } else {
        this.storeDataInMemory(this.getCookie());
    }
}

function update() {
    if (mParticle.useCookieStorage || !this.isLocalStorageAvailable) {
        this.setCookie();
    } else {
        this.setLocalStorage();
    }
}

function storeDataInMemory(result, currentMPID) {
    var obj;

    try {
        obj = typeof result === 'string' ? JSON.parse(result) : result;

        if (!obj) {
            Helpers.logDebug(Messages.InformationMessages.CookieNotFound);
            MP.clientId = Helpers.generateUniqueId();
            MP.userAttributes = {};
            MP.userIdentities = {};
            MP.cartProducts = [];
            MP.productsBags = {};
            MP.cookieSyncDates = {};
        } else {
            // Set MPID first, then change object to match MPID data
            if (currentMPID) {
                MP.mpid = currentMPID;
            } else {
                MP.mpid = obj.mpid || obj.currentUserMPID || 0;
            }

            // Longer names are for backwards compatibility
            // obj with no globalSettings are for migration purposes, setting globalSettings default of {} for migration purposes
            obj.globalSettings = obj.globalSettings || {};

            MP.sessionId = obj.globalSettings.sid || obj.sid || obj.SessionId || MP.sessionId;
            MP.isEnabled = (typeof obj.ie !== 'undefined' || typeof obj.globalSettings.ie !== 'undefined') ? (obj.ie || obj.globalSettings.ie) : obj.IsEnabled;
            MP.sessionAttributes = obj.globalSettings.sa || obj.sa || obj.SessionAttributes || MP.sessionAttributes;
            MP.serverSettings = obj.globalSettings.ss || obj.ss || obj.ServerSettings || MP.serverSettings;
            MP.devToken = obj.globalSettings.dt || obj.dt || obj.DeveloperToken || MP.devToken;
            MP.clientId = obj.globalSettings.cgid || obj.cgid || MP.clientId || Helpers.generateUniqueId();
            MP.deviceId = obj.globalSettings.das || obj.das || MP.deviceId || Helpers.generateUniqueId();
            // context and currentSessionMPIDs are new to version 2 and don't need migrating
            MP.context = obj.globalSettings.c || '';
            MP.currentSessionMPIDs = obj.globalSettings.currentSessionMPIDs || MP.currentSessionMPIDs;

            if (obj.les || obj.globalSettings.les) {
                MP.dateLastEventSent = new Date(obj.globalSettings.les);
            }
            else if (obj.LastEventSent || obj.globalSettings.LastEventSent) {
                MP.dateLastEventSent = new Date(obj.globalSettings.LastEventSent);
            }

            if (currentMPID) {
                obj = obj[currentMPID] ? obj[currentMPID] : obj;
            } else {
                obj = obj[obj.currentUserMPID] ? obj[obj.currentUserMPID] : obj;
            }
            MP.userAttributes = obj.ua || obj.UserAttributes || MP.userAttributes;
            MP.userIdentities = obj.ui || obj.UserIdentities || MP.userIdentities;
            MP.cartProducts = obj.cp || [];
            MP.productsBags = obj.pb || {};

            if (obj.csd) {
                MP.cookieSyncDates = obj.csd;
            }
            // Migrate from v1 where userIdentities was an array to v2 where it is an object
            if (Array.isArray(MP.userIdentities)) {
                var arrayToObjectUIMigration = {};
                MP.userIdentities = MP.userIdentities.filter(function(ui) {
                    return ui.hasOwnProperty('Identity') && (typeof(ui.Identity) === 'string' || typeof(ui.Identity) === 'number');
                });
                MP.userIdentities.forEach(function(identity) {
                    if (typeof identity.Identity === 'number') {
                        // convert to string
                        identity.Identity = '' + identity.Identity;
                    }
                    arrayToObjectUIMigration[Types.IdentityType.getIdentityName(identity.Type)] = identity.Identity;
                });
                MP.userIdentities = arrayToObjectUIMigration;

                MP.migrationData = {
                    userIdentities: arrayToObjectUIMigration,
                    userAttributes: MP.userAttributes,
                    cartProducts: MP.cartProducts,
                    productsBags: MP.productsBags,
                    cookieSyncDates: MP.cookieSyncDates
                };
            }


        }
        if (MP.isEnabled !== false || MP.isEnabled !== true) {
            MP.isEnabled = true;
        }
    }
    catch (e) {
        Helpers.logDebug(Messages.ErrorMessages.CookieParseError);
    }
}

function determineLocalStorageAvailability() {
    var storage, result;

    try {
        (storage = window.localStorage).setItem('mparticle', 'test');
        result = storage.getItem('mparticle') === 'test';
        storage.removeItem('mparticle');

        if (result && storage) {
            return true;
        } else {
            return false;
        }
    }
    catch (e) {
        return false;
    }
}

function convertInMemoryDataToPersistence() {
    var mpidData = {
        ua: MP.userAttributes,
        ui: MP.userIdentities,
        csd: MP.cookieSyncDates,
        mpid: MP.mpid,
        cp: MP.cartProducts.length <= mParticle.maxProducts ? MP.cartProducts : MP.cartProducts.slice(0, mParticle.maxProducts),
        pb: {}
    };

    for (var bag in MP.productsBags) {
        if (MP.productsBags[bag].length > mParticle.maxProducts) {
            mpidData.pb[bag] = MP.productsBags[bag].slice(0, mParticle.maxProducts);
        } else {
            mpidData.pb[bag] = MP.productsBags[bag];
        }
    }

    return mpidData;
}

function setLocalStorage() {
    var key = MP.Config.LocalStorageName,
        currentMPIDData = this.convertInMemoryDataToPersistence(),
        localStorageData = this.getLocalStorage() || {};

    localStorageData.globalSettings = localStorageData.globalSettings || {};

    if (MP.sessionId) {
        localStorageData.globalSettings.currentSessionMPIDs = MP.currentSessionMPIDs;
    }

    if (MP.mpid) {
        localStorageData[MP.mpid] = currentMPIDData;
        localStorageData.currentUserMPID = MP.mpid;
    }

    localStorageData = this.setGlobalStorageAttributes(localStorageData);

    try {
        window.localStorage.setItem(encodeURIComponent(key), encodeURIComponent(JSON.stringify(localStorageData)));
    }
    catch (e) {
        Helpers.logDebug('Error with setting localStorage item.');
    }
}

function setGlobalStorageAttributes(data) {
    data.globalSettings.sid = MP.sessionId;
    data.globalSettings.ie = MP.isEnabled;
    data.globalSettings.sa = MP.sessionAttributes;
    data.globalSettings.ss = MP.serverSettings;
    data.globalSettings.dt = MP.devToken;
    data.globalSettings.les = MP.dateLastEventSent ? MP.dateLastEventSent.getTime() : null;
    data.globalSettings.av = MP.appVersion;
    data.globalSettings.cgid = MP.clientId;
    data.globalSettings.das = MP.deviceId;
    data.globalSettings.c = MP.context;

    return data;
}

function getLocalStorage() {
    var key = MP.Config.LocalStorageName,
        localStorageData = JSON.parse(decodeURIComponent(window.localStorage.getItem(encodeURIComponent(key)))),
        obj = {},
        j;

    for (j in localStorageData) {
        if (localStorageData.hasOwnProperty(j)) {
            obj[j] = localStorageData[j];
        }
    }

    if (Object.keys(obj).length) {
        return obj;
    }

    return null;
}

function removeLocalStorage() {
    localStorage.removeItem(Constants.DefaultConfig.LocalStorageName);
}

function retrieveDeviceId() {
    if (MP.deviceId) {
        return MP.deviceId;
    } else {
        return this.parseDeviceId(MP.serverSettings);
    }
}

function parseDeviceId(serverSettings) {
    try {
        var paramsObj = {},
            parts;

        if (serverSettings && serverSettings.uid && serverSettings.uid.Value) {
            serverSettings.uid.Value.split('&').forEach(function(param) {
                parts = param.split('=');
                paramsObj[parts[0]] = parts[1];
            });

            if (paramsObj['g']) {
                return paramsObj['g'];
            }
        }

        return Helpers.generateUniqueId();
    }
    catch (e) {
        return Helpers.generateUniqueId();
    }
}

function expireCookies() {
    var date = new Date(),
        expires;

    date.setTime(date.getTime() - (24 * 60 * 60 * 1000));
    expires = '; expires=' + date.toUTCString();
    document.cookie = Constants.DefaultConfig.CookieName + '=' + '' + expires + '; path=/';
}

function getCookie() {
    var cookies = window.document.cookie.split('; '),
        key = MP.Config.CookieName,
        i,
        l,
        parts,
        name,
        cookie,
        result = key ? undefined : {};

    Helpers.logDebug(Messages.InformationMessages.CookieSearch);

    for (i = 0, l = cookies.length; i < l; i++) {
        parts = cookies[i].split('=');
        name = Helpers.decoded(parts.shift());
        cookie = Helpers.decoded(parts.join('='));

        if (key && key === name) {
            result = Helpers.converted(cookie);
            break;
        }

        if (!key) {
            result[name] = Helpers.converted(cookie);
        }
    }

    if (result) {
        Helpers.logDebug(Messages.InformationMessages.CookieFound);
        return JSON.parse(result);
    } else {
        return null;
    }
}

function setCookie() {
    var date = new Date(),
        key = MP.Config.CookieName,
        currentMPIDData = this.convertInMemoryDataToPersistence(),
        expires = new Date(date.getTime() +
            (MP.Config.CookieExpiration * 24 * 60 * 60 * 1000)).toGMTString(),
        domain = MP.Config.CookieDomain ? ';domain=' + MP.Config.CookieDomain : '',
        cookies = this.getCookie() || {};

    cookies.globalSettings = cookies.globalSettings || {};

    if (MP.sessionId) {
        cookies.globalSettings.currentSessionMPIDs = MP.currentSessionMPIDs;
    }

    if (MP.mpid) {
        cookies[MP.mpid] = currentMPIDData;
        cookies.currentUserMPID = MP.mpid;
    }

    cookies = this.setGlobalStorageAttributes(cookies);

    Helpers.logDebug(Messages.InformationMessages.CookieSet);

    window.document.cookie =
        encodeURIComponent(key) + '=' + encodeURIComponent(JSON.stringify(cookies)) +
        ';expires=' + expires +
        ';path=/' +
        domain;
}

function findPrevCookiesBasedOnUI(identityApiData) {
    var cookies = this.getCookie() || this.getLocalStorage();
    var matchedUser;

    if (identityApiData) {
        for (var requestedIdentityType in identityApiData.userIdentities) {
            if (Object.keys(cookies).length) {
                for (var key in cookies) {
                    // any value in cookies that has an MPID key will be an MPID to search through - other keys on the cookie are currentSessionMPIDs and currentMPID which should not be searched
                    if (cookies[key].mpid) {
                        var cookieUIs = cookies[key].ui;
                        for (var cookieUIType in cookieUIs) {
                            if (requestedIdentityType === cookieUIType && identityApiData.userIdentities[requestedIdentityType] === cookieUIs[cookieUIType]) {
                                matchedUser = key;
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    if (matchedUser) {
        this.storeDataInMemory(cookies, matchedUser);
    }
}

module.exports = {
    useLocalStorage: useLocalStorage,
    isLocalStorageAvailable: null,
    initializeStorage: initializeStorage,
    update: update,
    determineLocalStorageAvailability: determineLocalStorageAvailability,
    convertInMemoryDataToPersistence: convertInMemoryDataToPersistence,
    setLocalStorage: setLocalStorage,
    setGlobalStorageAttributes: setGlobalStorageAttributes,
    getLocalStorage: getLocalStorage,
    removeLocalStorage: removeLocalStorage,
    storeDataInMemory: storeDataInMemory,
    retrieveDeviceId: retrieveDeviceId,
    parseDeviceId: parseDeviceId,
    expireCookies: expireCookies,
    getCookie: getCookie,
    setCookie: setCookie,
    findPrevCookiesBasedOnUI: findPrevCookiesBasedOnUI
};

},{"./constants":1,"./helpers":6,"./mp":9,"./types":14}],11:[function(require,module,exports){
module.exports = {
    // forEach polyfill
    // Production steps of ECMA-262, Edition 5, 15.4.4.18
    // Reference: http://es5.github.io/#x15.4.4.18
    forEach: function(callback, thisArg) {
        var T, k;

        if (this == null) {
            throw new TypeError(' this is null or not defined');
        }

        var O = Object(this);
        var len = O.length >>> 0;

        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }

        if (arguments.length > 1) {
            T = thisArg;
        }

        k = 0;

        while (k < len) {
            var kValue;
            if (k in O) {
                kValue = O[k];
                callback.call(T, kValue, k, O);
            }
            k++;
        }
    },

    // map polyfill
    // Production steps of ECMA-262, Edition 5, 15.4.4.19
    // Reference: http://es5.github.io/#x15.4.4.19
    map: function(callback, thisArg) {
        var T, A, k;

        if (this === null) {
            throw new TypeError(' this is null or not defined');
        }

        var O = Object(this);
        var len = O.length >>> 0;

        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }

        if (arguments.length > 1) {
            T = thisArg;
        }

        A = new Array(len);

        k = 0;

        while (k < len) {
            var kValue, mappedValue;
            if (k in O) {
                kValue = O[k];
                mappedValue = callback.call(T, kValue, k, O);
                A[k] = mappedValue;
            }
            k++;
        }

        return A;
    },

    // filter polyfill
    // Prodcution steps of ECMA-262, Edition 5
    // Reference: http://es5.github.io/#x15.4.4.20
    filter: function(fun/*, thisArg*/) {
        'use strict';

        if (this === void 0 || this === null) {
            throw new TypeError();
        }

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun !== 'function') {
            throw new TypeError();
        }

        var res = [];
        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++) {
            if (i in t) {
                var val = t[i];
                if (fun.call(thisArg, val, i, t)) {
                    res.push(val);
                }
            }
        }

        return res;
    },

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
    isArray: function (arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
    }
};

},{}],12:[function(require,module,exports){
var Types = require('./types'),
    MessageType = Types.MessageType,
    ApplicationTransitionType = Types.ApplicationTransitionType,
    Constants = require('./constants'),
    MP = require('./mp'),
    parseNumber = require('./helpers').parseNumber,
    isWebViewEmbedded = require('./helpers').isWebViewEmbedded;

function convertCustomFlags(event, dto) {
    var valueArray = [];
    dto.flags = {};

    for (var prop in event.CustomFlags) {
        valueArray = [];

        if (event.CustomFlags.hasOwnProperty(prop)) {
            if (Array.isArray(event.CustomFlags[prop])) {
                event.CustomFlags[prop].forEach(function(customFlagProperty) {
                    if (typeof customFlagProperty === 'number'
                    || typeof customFlagProperty === 'string'
                    || typeof customFlagProperty === 'boolean') {
                        valueArray.push(customFlagProperty.toString());
                    }
                });
            }
            else if (typeof event.CustomFlags[prop] === 'number'
            || typeof event.CustomFlags[prop] === 'string'
            || typeof event.CustomFlags[prop] === 'boolean') {
                valueArray.push(event.CustomFlags[prop].toString());
            }

            if (valueArray.length) {
                dto.flags[prop] = valueArray;
            }
        }
    }
}

function convertProductListToDTO(productList) {
    if (!productList) {
        return [];
    }

    return productList.map(function(product) {
        return convertProductToDTO(product);
    });
}

function convertProductToDTO(product) {
    return {
        id: product.Sku,
        nm: product.Name,
        pr: parseNumber(product.Price),
        qt: parseNumber(product.Quantity),
        br: product.Brand,
        va: product.Variant,
        ca: product.Category,
        ps: parseNumber(product.Position),
        cc: product.CouponCode,
        tpa: parseNumber(product.TotalAmount),
        attrs: product.Attributes
    };
}

function convertProductBagToDTO(productsBags) {
    var convertedBag = {},
        list;

    for (var prop in productsBags) {
        if (!productsBags.hasOwnProperty(prop)) {
            continue;
        }

        list = productsBags[prop].map(function(item) {
            return convertProductToDTO(item);
        });

        if (isWebViewEmbedded()) {
            convertedBag[prop] = {
                ProductList: list
            };
        }
        else {
            convertedBag[prop] = {
                pl: list
            };
        }
    }

    return convertedBag;
}

function createEventObject(messageType, name, data, eventType, customFlags) {
    var eventObject,
        optOut = (messageType === Types.MessageType.OptOut ? !MP.isEnabled : null);

    if (MP.sessionId || messageType == Types.MessageType.OptOut) {
        if (messageType !== Types.MessageType.SessionEnd) {
            MP.dateLastEventSent = new Date();
        }
        eventObject = {
            EventName: name || messageType,
            EventCategory: eventType,
            UserAttributes: MP.userAttributes,
            SessionAttributes: MP.sessionAttributes,
            UserIdentities: MP.userIdentities,
            Store: MP.serverSettings,
            EventAttributes: data,
            SDKVersion: Constants.sdkVersion,
            SessionId: MP.sessionId,
            EventDataType: messageType,
            Debug: mParticle.isDevelopmentMode,
            Location: MP.currentPosition,
            OptOut: optOut,
            ProductBags: MP.productsBags,
            ExpandedEventCount: 0,
            CustomFlags: customFlags,
            AppVersion: MP.appVersion,
            ClientGeneratedId: MP.clientId,
            DeviceId: MP.deviceId,
            MPID: MP.mpid
        };

        if (messageType === Types.MessageType.SessionEnd) {
            eventObject.SessionLength = new Date().getTime() - MP.dateLastEventSent.getTime();
            eventObject.currentSessionMPIDs = MP.currentSessionMPIDs;
            MP.currentSessionMPIDs = [];
        }

        eventObject.Timestamp = MP.dateLastEventSent.getTime();

        return eventObject;
    }

    return null;
}

function convertEventToDTO(event, isFirstRun, productsBags, currencyCode) {
    var dto = {
        n: event.EventName,
        et: event.EventCategory,
        ua: event.UserAttributes,
        sa: event.SessionAttributes,
        ui: event.UserIdentities,
        str: event.Store,
        attrs: event.EventAttributes,
        sdk: event.SDKVersion,
        sid: event.SessionId,
        sl: event.SessionLength,
        dt: event.EventDataType,
        dbg: event.Debug,
        ct: event.Timestamp,
        lc: event.Location,
        o: event.OptOut,
        eec: event.ExpandedEventCount,
        av: event.AppVersion,
        cgid: event.ClientGeneratedId,
        das: event.DeviceId,
        mpid: event.MPID,
        smpids: event.currentSessionMPIDs
    };

    if (event.EventDataType === MessageType.AppStateTransition) {
        dto.fr = isFirstRun;
        dto.iu = false;
        dto.at = ApplicationTransitionType.AppInit;
        dto.lr = document.referrer || null;
        dto.attrs = null;
    }

    if (event.CustomFlags) {
        convertCustomFlags(event, dto);
    }

    dto.pb = convertProductBagToDTO(productsBags);

    if (event.EventDataType === MessageType.Commerce) {
        dto.cu = currencyCode;

        if (event.ShoppingCart) {
            dto.sc = {
                pl: convertProductListToDTO(event.ShoppingCart.ProductList)
            };
        }

        if (event.ProductAction) {
            dto.pd = {
                an: event.ProductAction.ProductActionType,
                cs: parseNumber(event.ProductAction.CheckoutStep),
                co: event.ProductAction.CheckoutOptions,
                pl: convertProductListToDTO(event.ProductAction.ProductList),
                ti: event.ProductAction.TransactionId,
                ta: event.ProductAction.Affiliation,
                tcc: event.ProductAction.CouponCode,
                tr: parseNumber(event.ProductAction.TotalAmount),
                ts: parseNumber(event.ProductAction.ShippingAmount),
                tt: parseNumber(event.ProductAction.TaxAmount)
            };
        }
        else if (event.PromotionAction) {
            dto.pm = {
                an: event.PromotionAction.PromotionActionType,
                pl: event.PromotionAction.PromotionList.map(function(promotion) {
                    return {
                        id: promotion.Id,
                        nm: promotion.Name,
                        cr: promotion.Creative,
                        ps: promotion.Position ? promotion.Position : 0
                    };
                })
            };
        }
        else if (event.ProductImpressions) {
            dto.pi = event.ProductImpressions.map(function(impression) {
                return {
                    pil: impression.ProductImpressionList,
                    pl: convertProductListToDTO(impression.ProductList)
                };
            });
        }
    }
    else if (event.EventDataType === MessageType.Profile) {
        dto.pet = event.ProfileMessageType;
    }

    return dto;
}

module.exports = {
    createEventObject: createEventObject,
    convertEventToDTO: convertEventToDTO
};

},{"./constants":1,"./helpers":6,"./mp":9,"./types":14}],13:[function(require,module,exports){
var Helpers = require('./helpers'),
    Messages = require('./constants').Messages,
    Types = require('./types'),
    identify = require('./identity').identify,
    Persistence = require('./persistence'),
    MP = require('./mp'),
    logEvent = require('./events').logEvent;

function initialize() {
    if (MP.sessionId) {
        var sessionTimeoutInSeconds = MP.Config.SessionTimeout * 60000;

        if (new Date() > new Date(MP.dateLastEventSent.getTime() + sessionTimeoutInSeconds)) {
            this.endSession();
            this.startNewSession();
        }
    } else {
        this.startNewSession();
    }
}

function getSession() {
    return MP.sessionId;
}

function startNewSession() {
    Helpers.logDebug(Messages.InformationMessages.StartingNewSession);

    if (Helpers.canLog()) {
        identify(MP.initialIdentifyRequest);
        MP.sessionId = Helpers.generateUniqueId();
        if (MP.mpid) {
            MP.currentSessionMPIDs = [MP.mpid];
        }

        if (!MP.dateLastEventSent) {
            MP.dateLastEventSent = new Date();
        }

        mParticle.sessionManager.setSessionTimer();

        logEvent(Types.MessageType.SessionStart);
    }
    else {
        Helpers.logDebug(Messages.InformationMessages.AbandonStartSession);
    }
}

function endSession() {
    Helpers.logDebug(Messages.InformationMessages.StartingEndSession);

    if (Helpers.canLog()) {
        if (!MP.sessionId) {
            Helpers.logDebug(Messages.InformationMessages.NoSessionToEnd);
            return;
        }

        logEvent(Types.MessageType.SessionEnd);

        MP.sessionId = null;
        MP.dateLastEventSent = null;
        MP.sessionAttributes = {};
        Persistence.update();
    }
    else {
        Helpers.logDebug(Messages.InformationMessages.AbandonEndSession);
    }
}

function setSessionTimer() {
    var sessionTimeoutInSeconds = MP.Config.SessionTimeout * 60000;

    MP.globalTimer = window.setTimeout(function() {
        mParticle.sessionManager.endSession();
    }, sessionTimeoutInSeconds);
}

function resetSessionTimer() {
    if (!MP.sessionId) {
        startNewSession();
    }
    clearSessionTimeout();
    setSessionTimer();
}

function clearSessionTimeout() {
    clearTimeout(MP.globalTimer);
}

module.exports = {
    initialize: initialize,
    getSession: getSession,
    startNewSession: startNewSession,
    endSession: endSession,
    setSessionTimer: setSessionTimer,
    resetSessionTimer: resetSessionTimer,
    clearSessionTimeout: clearSessionTimeout
};

},{"./constants":1,"./events":4,"./helpers":6,"./identity":7,"./mp":9,"./persistence":10,"./types":14}],14:[function(require,module,exports){
var MessageType = {
    SessionStart: 1,
    SessionEnd: 2,
    PageView: 3,
    PageEvent: 4,
    CrashReport: 5,
    OptOut: 6,
    AppStateTransition: 10,
    Profile: 14,
    Commerce: 16
};

var EventType = {
    Unknown: 0,
    Navigation: 1,
    Location: 2,
    Search: 3,
    Transaction: 4,
    UserContent: 5,
    UserPreference: 6,
    Social: 7,
    Other: 8,
    getName: function(id) {
        switch (id) {
            case EventType.Navigation:
                return 'Navigation';
            case EventType.Location:
                return 'Location';
            case EventType.Search:
                return 'Search';
            case EventType.Transaction:
                return 'Transaction';
            case EventType.UserContent:
                return 'User Content';
            case EventType.UserPreference:
                return 'User Preference';
            case EventType.Social:
                return 'Social';
            case CommerceEventType.ProductAddToCart:
                return 'Product Added to Cart';
            case CommerceEventType.ProductAddToWishlist:
                return 'Product Added to Wishlist';
            case CommerceEventType.ProductCheckout:
                return 'Product Checkout';
            case CommerceEventType.ProductCheckoutOption:
                return 'Product Checkout Options';
            case CommerceEventType.ProductClick:
                return 'Product Click';
            case CommerceEventType.ProductImpression:
                return 'Product Impression';
            case CommerceEventType.ProductPurchase:
                return 'Product Purchased';
            case CommerceEventType.ProductRefund:
                return 'Product Refunded';
            case CommerceEventType.ProductRemoveFromCart:
                return 'Product Removed From Cart';
            case CommerceEventType.ProductRemoveFromWishlist:
                return 'Product Removed from Wishlist';
            case CommerceEventType.ProductViewDetail:
                return 'Product View Details';
            case CommerceEventType.PromotionClick:
                return 'Promotion Click';
            case CommerceEventType.PromotionView:
                return 'Promotion View';
            default:
                return 'Other';
        }
    }
};

// Continuation of enum above, but in seperate object since we don't expose these to end user
var CommerceEventType = {
    ProductAddToCart: 10,
    ProductRemoveFromCart: 11,
    ProductCheckout: 12,
    ProductCheckoutOption: 13,
    ProductClick: 14,
    ProductViewDetail: 15,
    ProductPurchase: 16,
    ProductRefund: 17,
    PromotionView: 18,
    PromotionClick: 19,
    ProductAddToWishlist: 20,
    ProductRemoveFromWishlist: 21,
    ProductImpression: 22
};

var IdentityType = {
    Other: 0,
    CustomerId: 1,
    Facebook: 2,
    Twitter: 3,
    Google: 4,
    Microsoft: 5,
    Yahoo: 6,
    Email: 7,
    FacebookCustomAudienceId: 9,
    // TODO: Change when we finalize the 'other' pattern
    Other1: 10,
    Other2: 11,
    Other3: 12,
    Other4: 13
};

IdentityType.isValid = function(identityType) {
    if (typeof identityType === 'number') {
        for (var prop in IdentityType) {
            if (IdentityType.hasOwnProperty(prop)) {
                if (IdentityType[prop] === identityType) {
                    return true;
                }
            }
        }
    }

    return false;
};

IdentityType.getName = function(identityType) {
    switch (identityType) {
        case window.mParticle.IdentityType.CustomerId:
            return 'Customer ID';
        case window.mParticle.IdentityType.Facebook:
            return 'Facebook ID';
        case window.mParticle.IdentityType.Twitter:
            return 'Twitter ID';
        case window.mParticle.IdentityType.Google:
            return 'Google ID';
        case window.mParticle.IdentityType.Microsoft:
            return 'Microsoft ID';
        case window.mParticle.IdentityType.Yahoo:
            return 'Yahoo ID';
        case window.mParticle.IdentityType.Email:
            return 'Email';
        case window.mParticle.IdentityType.FacebookCustomAudienceId:
            return 'Facebook App User ID';
        default:
            return 'Other ID';
    }
};

IdentityType.getIdentityType = function(identityName) {
    switch (identityName) {
        case 'other':
            return IdentityType.Other;
        case 'customerid':
            return IdentityType.CustomerId;
        case 'facebook':
            return IdentityType.Facebook;
        case 'twitter':
            return IdentityType.Twitter;
        case 'google':
            return IdentityType.Google;
        case 'microsoft':
            return IdentityType.Microsoft;
        case 'yahoo':
            return IdentityType.Yahoo;
        case 'email':
            return IdentityType.Email;
        case 'facebookcustomaudienceid':
            return IdentityType.FacebookCustomAudienceId;
        case 'other1':
            return IdentityType.Other1;
        case 'other2':
            return IdentityType.Other2;
        case 'other3':
            return IdentityType.Other3;
        case 'other4':
            return IdentityType.Other4;
        default:
            return false;
    }
};

IdentityType.getIdentityName = function(identityType) {
    switch (identityType) {
        case IdentityType.Other:
            return 'other';
        case IdentityType.CustomerId:
            return 'customerid';
        case IdentityType.Facebook:
            return 'facebook';
        case IdentityType.Twitter:
            return 'twitter';
        case IdentityType.Google:
            return 'google';
        case IdentityType.Microsoft:
            return 'microsoft';
        case IdentityType.Yahoo:
            return 'yahoo';
        case IdentityType.Email:
            return 'email';
        case IdentityType.FacebookCustomAudienceId:
            return 'facebookcustomaudienceid';
        case IdentityType.Other1:
            return 'other1';
        case IdentityType.Other2:
            return 'other2';
        case IdentityType.Other3:
            return 'other3';
        case IdentityType.Other4:
            return 'other4';
    }
};

var ProductActionType = {
    Unknown: 0,
    AddToCart: 1,
    RemoveFromCart: 2,
    Checkout: 3,
    CheckoutOption: 4,
    Click: 5,
    ViewDetail: 6,
    Purchase: 7,
    Refund: 8,
    AddToWishlist: 9,
    RemoveFromWishlist: 10
};

ProductActionType.getName = function(id) {
    switch (id) {
        case ProductActionType.AddToCart:
            return 'Add to Cart';
        case ProductActionType.RemoveFromCart:
            return 'Remove from Cart';
        case ProductActionType.Checkout:
            return 'Checkout';
        case ProductActionType.CheckoutOption:
            return 'Checkout Option';
        case ProductActionType.Click:
            return 'Click';
        case ProductActionType.ViewDetail:
            return 'View Detail';
        case ProductActionType.Purchase:
            return 'Purchase';
        case ProductActionType.Refund:
            return 'Refund';
        case ProductActionType.AddToWishlist:
            return 'Add to Wishlist';
        case ProductActionType.RemoveFromWishlist:
            return 'Remove from Wishlist';
        default:
            return 'Unknown';
    }
};

// these are the action names used by server and mobile SDKs when expanding a CommerceEvent
ProductActionType.getExpansionName = function(id) {
    switch (id) {
        case ProductActionType.AddToCart:
            return 'AddToCart';
        case ProductActionType.RemoveFromCart:
            return 'RemoveFromCart';
        case ProductActionType.Checkout:
            return 'Checkout';
        case ProductActionType.CheckoutOption:
            return 'CheckoutOption';
        case ProductActionType.Click:
            return 'Click';
        case ProductActionType.ViewDetail:
            return 'ViewDetail';
        case ProductActionType.Purchase:
            return 'Purchase';
        case ProductActionType.Refund:
            return 'Refund';
        case ProductActionType.AddToWishlist:
            return 'AddToWishlist';
        case ProductActionType.RemoveFromWishlist:
            return 'RemoveFromWishlist';
        default:
            return 'Unknown';
    }
};

var PromotionActionType = {
    Unknown: 0,
    PromotionView: 1,
    PromotionClick: 2
};

PromotionActionType.getName = function(id) {
    switch (id) {
        case PromotionActionType.PromotionView:
            return 'Promotion View';
        case PromotionActionType.PromotionClick:
            return 'Promotion Click';
        default:
            return 'Unknown';
    }
};

// these are the names that the server and mobile SDKs use while expanding CommerceEvent
PromotionActionType.getExpansionName = function(id) {
    switch (id) {
        case PromotionActionType.PromotionView:
            return 'view';
        case PromotionActionType.PromotionClick:
            return 'click';
        default:
            return 'Unknown';
    }
};

var ProfileMessageType = {
    Logout: 3
};
var ApplicationTransitionType = {
    AppInit: 1
};

module.exports = {
    MessageType: MessageType,
    EventType: EventType,
    CommerceEventType: CommerceEventType,
    IdentityType: IdentityType,
    ProfileMessageType: ProfileMessageType,
    ApplicationTransitionType: ApplicationTransitionType,
    ProductActionType:ProductActionType,
    PromotionActionType:PromotionActionType
};

},{}]},{},[8]);
