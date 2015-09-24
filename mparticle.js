/*
	mParticle Javascript API
	(c) Copyright 2015 mParticle Inc. All Rights Reserved.

    Uses portions of code from jQuery
    jQuery v1.10.2 | (c) 2005, 2013 jQuery Foundation, Inc. | jquery.org/license
*/

(function (window) {
    var serviceUrl = "jssdk.mparticle.com/v1/JS/",
        secureServiceUrl = "jssdks.mparticle.com/v1/JS/",
        serviceScheme = window.location.protocol + '//',
        sdkVersion = '1.3.0',
        isEnabled = true,
        pluses = /\+/g,
        sessionAttributes = {},
        userAttributes = {},
        userIdentities = [],
        forwarderConstructors = [],
        forwarders = [],
        sessionId,
        devToken,
        serverSettings = {},
        lastEventSent,
        currentPosition,
        isTracking = false,
        watchPositionId,
        readyQueue = [],
        isInitialized = false,
        productsBags = {},
        cartProducts = [],
        currencyCode = null,
        MockHttpRequest = null;

    // forEach polyfill
    // Production steps of ECMA-262, Edition 5, 15.4.4.18
    // Reference: http://es5.github.io/#x15.4.4.18
    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function (callback, thisArg) {
            var T, k;

            if (this == null) {
                throw new TypeError(' this is null or not defined');
            }

            var O = Object(this);
            var len = O.length >>> 0;

            if (typeof callback !== "function") {
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
        };
    }

    // Production steps of ECMA-262, Edition 5, 15.4.4.19
    // Reference: http://es5.github.io/#x15.4.4.19
    if (!Array.prototype.map) {
        Array.prototype.map = function (callback, thisArg) {
            var T, A, k;

            if (this === null) {
                throw new TypeError(" this is null or not defined");
            }

            var O = Object(this);
            var len = O.length >>> 0;

            if (typeof callback !== "function") {
                throw new TypeError(callback + " is not a function");
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
        };
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
                type: function (obj) {
                    return obj == null ?
                    String(obj) :
                    objectHelper.class2type[Object.prototype.toString.call(obj)] || "object";
                },
                isPlainObject: function (obj) {
                    if (!obj || objectHelper.type(obj) !== "object" || obj.nodeType || objectHelper.isWindow(obj)) {
                        return false;
                    }

                    try {
                        if (obj.constructor &&
                        !objectHelper.hasOwn.call(obj, "constructor") &&
                        !objectHelper.hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
                            return false;
                        }
                    } catch (e) {
                        return false;
                    }

                    var key;
                    for (key in obj) { }

                    return key === undefined || objectHelper.hasOwn.call(obj, key);
                },
                isArray: Array.isArray || function (obj) {
                    return objectHelper.type(obj) === "array";
                },
                isFunction: function (obj) {
                    return objectHelper.type(obj) === "function";
                },
                isWindow: function (obj) {
                    return obj != null && obj == obj.window;
                }
            };  // end of objectHelper

        // Handle a deep copy situation
        if (typeof target === "boolean") {
            deep = target;
            target = arguments[1] || {};
            // skip the boolean and the target
            i = 2;
        }

        // Handle case when target is a string or something (possible in deep copy)
        if (typeof target !== "object" && !objectHelper.isFunction(target)) {
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

    function createXHR(cb) {
        var xhr;

        try {
            xhr = new window.XMLHttpRequest();
        }
        catch (e) {
            logDebug('Error creating XMLHttpRequest object.');
        }

        if (xhr && cb && "withCredentials" in xhr) {
            xhr.onreadystatechange = cb;
        }
        else if (typeof window.XDomainRequest != 'undefined') {
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

    function createServiceUrl() {
        return serviceScheme + ((window.location.protocol === 'https:') ? secureServiceUrl : serviceUrl) + devToken;
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

    function isUIWebView() {
        return /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent);
    }

    function tryNativeSdk(path, value) {
        if (window.mParticleAndroid) {
            logDebug(InformationMessages.SendAndroid + path);
            window.mParticleAndroid[path](value);
            return true;
        }
        else if (window.mParticle.isIOS || isUIWebView()) {
            logDebug(InformationMessages.SendIOS + path);
            var iframe = document.createElement("IFRAME");
            iframe.setAttribute("src", 'mp-sdk://' + path + '/' + value);
            document.documentElement.appendChild(iframe);
            iframe.parentNode.removeChild(iframe);
            iframe = null;
            return true;
        }
        return false;
    }

    function getCookie() {
        var cookies = window.document.cookie.split('; '),
            key = Config.CookieName,
            i,
            l,
            parts,
            name,
            cookie,
            obj,
            result = key ? undefined : {};

        logDebug(InformationMessages.CookieSearch);

        for (i = 0, l = cookies.length; i < l; i++) {
            parts = cookies[i].split('=');
            name = decoded(parts.shift());
            cookie = decoded(parts.join('='));

            if (key && key === name) {
                result = converted(cookie);
                break;
            }

            if (!key) {
                result[name] = converted(cookie);
            }
        }

        if (result) {
            logDebug(InformationMessages.CookieFound);

            try {
                obj = JSON.parse(result);

                // Longer names are for backwards compatibility
                sessionId = obj.sid || obj.SessionId;
                isEnabled = (typeof obj.ie != 'undefined') ? obj.ie : obj.IsEnabled;
                sessionAttributes = obj.sa || obj.SessionAttributes;
                userAttributes = obj.ua || obj.UserAttributes;
                userIdentities = obj.ui || obj.UserIdentities;
                serverSettings = obj.ss || obj.ServerSettings;
                devToken = obj.dt || obj.DeveloperToken;

                if (obj.les) {
                    lastEventSent = new Date(obj.les);
                }
                else if (obj.LastEventSent) {
                    lastEventSent = new Date(obj.LastEventSent);
                }
            }
            catch (e) {
                logDebug(ErrorMessages.CookieParseError);
            }
        }
    }

    function setCookie() {
        var date = new Date(),
            key = Config.CookieName,
            value = {
                sid: sessionId,
                ie: isEnabled,
                sa: sessionAttributes,
                ua: userAttributes,
                ui: userIdentities,
                ss: serverSettings,
                dt: devToken,
                les: lastEventSent ? lastEventSent.getTime() : null
            },
            expires = new Date(date.getTime() +
            (Config.CookieExpiration * 24 * 60 * 60 * 1000)).toGMTString(),
            domain = Config.CookieDomain ? ';domain=' + Config.CookieDomain : '';

        logDebug(InformationMessages.CookieSet);

        window.document.cookie =
            encodeURIComponent(key) + '=' + encodeURIComponent(JSON.stringify(value)) +
            ';expires=' + expires +
            ';path=/' +
            domain;
    }

    function isWebViewEmbedded() {
        if ((window.external && typeof (window.external.Notify) === 'unknown')
            || window.mParticleAndroid
            || isUIWebView()
            || window.mParticle.isIOS) {
            return true;
        }

        return false;
    }

    function send(event) {
        var xhr,
            xhrCallback = function () {
                if (xhr.readyState === 4) {
                    logDebug('Received ' + xhr.statusText + ' from server');

                    parseResponse(xhr.responseText);
                }
            };

        logDebug(InformationMessages.SendBegin);

        if (!event) {
            logDebug(ErrorMessages.EventEmpty);
            return;
        }

        if (!tryNativeSdk(NativeSdkPaths.LogEvent, JSON.stringify(event))) {
            logDebug(InformationMessages.SendHttp);

            xhr = createXHR(xhrCallback);

            if (xhr) {
                try {
                    xhr.open('post', createServiceUrl() + '/Events');
                    xhr.send(JSON.stringify(convertEventToDTO(event)));

                    sendEventToForwarders(event);
                }
                catch (e) {
                    logDebug('Error sending event to mParticle servers.');
                }
            }
        }
    }

    function sendForwardingStats(id, event) {
        var xhr = createXHR(),
            forwardingStat = JSON.stringify({
                mid: id,
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
                xhr.open('post', createServiceUrl() + '/Forwarding');
                xhr.send(forwardingStat);
            }
            catch (e) {
                logDebug('Error sending forwarding stats to mParticle servers.');
            }
        }
    }

    function applyToForwarders(functionName, functionArgs) {
        if (forwarders) {
            for (var i = 0; i < forwarders.length; i++) {
                var forwarderFunction = forwarders[i][functionName];
                if (forwarderFunction) {
                    var result = forwarderFunction.apply(forwarders[i], functionArgs);

                    if (result) {
                        logDebug(result);
                    }
                }
            }
        }
    }

    function sendEventToForwarders(event) {
        var clonedEvent,
            hashedName,
            hashedType,
            filterUserAttributes = function (event, filterList) {
                var hash;

                if (event.UserAttributes) {
                    for (var attrName in event.UserAttributes) {
                        if (event.UserAttributes.hasOwnProperty(attrName)) {
                            hash = generateHash(attrName);

                            if (inArray(filterList, hash)) {
                                delete event.UserAttributes[attrName];
                            }
                        }
                    }
                }
            },
            filterUserIdentities = function (event, filterList) {
                if (event.UserIdentities && event.UserIdentities.length > 0) {
                    for (var i = 0; i < event.UserIdentities.length; i++) {
                        if (inArray(filterList, event.UserIdentities[i].Type)) {
                            event.UserIdentities.splice(i, 1);

                            if (i > 0) {
                                i--;
                            }
                        }
                    }
                }
            },
            filterAttributes = function (event, filterList) {
                var hash;

                if (!filterList) {
                    return;
                }

                for (var attrName in event.EventAttributes) {
                    if (event.EventAttributes.hasOwnProperty(attrName)) {
                        hash = generateHash(event.EventCategory + event.EventName + attrName);

                        if (inArray(filterList, hash)) {
                            delete event.EventAttributes[attrName];
                        }
                    }
                }
            },
            inFilteredList = function (filterList, hash) {
                if (filterList && filterList.length > 0) {
                    if (inArray(filterList, hash)) {
                        return true;
                    }
                }

                return false;
            };

        if (!isWebViewEmbedded() && forwarders) {
            hashedName = generateHash(event.EventCategory + event.EventName);
            hashedType = generateHash(event.EventCategory);

            for (var i = 0; i < forwarders.length; i++) {
                if (event.Debug === true && forwarders[i].isSandbox === false && forwarders[i].hasSandbox === true) {
                    continue;
                }
                else if (event.Debug === false && forwarders[i].isSandbox === true) {
                    continue;
                }

                // Clone the event object, as we could be sending different attributes to each forwarder
                clonedEvent = {};
                clonedEvent = extend(true, clonedEvent, event);

                // Check event filtering rules
                if (event.EventDataType == MessageType.PageEvent
                    && (inFilteredList(forwarders[i].eventNameFilters, hashedName)
                        || inFilteredList(forwarders[i].eventTypeFilters, hashedType))) {
                    continue;
                }
                else if (event.EventDataType == MessageType.PageView && inFilteredList(forwarders[i].pageViewFilters, hashedName)) {
                    continue;
                }

                // Check attribute filtering rules
                if (clonedEvent.EventAttributes) {
                    if (event.EventDataType == MessageType.PageEvent) {
                        filterAttributes(clonedEvent, forwarders[i].attributeFilters);
                    }
                    else if (event.EventDataType == MessageType.PageView) {
                        filterAttributes(clonedEvent, forwarders[i].pageViewAttributeFilters);
                    }
                }

                // Check user identity filtering rules
                filterUserIdentities(clonedEvent, forwarders[i].userIdentityFilters);

                // Check user attribute filtering rules
                filterUserAttributes(clonedEvent, forwarders[i].userAttributeFilters);

                logDebug('Sending message to forwarder: ' + forwarders[i].name);
                var result = forwarders[i].process(clonedEvent);

                if (result) {
                    logDebug(result);
                }
            }
        }
    }

    function initForwarders() {
        if (!isWebViewEmbedded() && forwarders) {

            // Some js libraries require that they be loaded first, or last, etc
            forwarders.sort(function (x, y) {
                x.settings.PriorityValue = x.settings.PriorityValue || 0;
                y.settings.PriorityValue = y.settings.PriorityValue || 0;
                return -1 * (x.settings.PriorityValue - y.settings.PriorityValue);
            });

            for (var i = 0; i < forwarders.length; i++) {
                if (forwarders.isSandbox === mParticle.isSandbox) {
                    forwarders[i].init(forwarders[i].settings, sendForwardingStats, forwarders[i].id);
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
            logDebug('Parsing response from server');

            settings = JSON.parse(responseText);

            if (settings && settings.Store) {
                logDebug('Parsed store from response, updating local settings');

                for (prop in settings.Store) {
                    if (!settings.Store.hasOwnProperty(prop)) {
                        continue;
                    }

                    fullProp = settings.Store[prop];

                    if (!fullProp.Value || new Date(fullProp.Expires) < now) {
                        // This setting should be deleted from the local store if it exists

                        if (serverSettings.hasOwnProperty(prop)) {
                            delete serverSettings[prop];
                        }
                    }
                    else {
                        // This is a valid setting

                        serverSettings[prop] = fullProp;
                    }
                }
            }
        }
        catch (e) {
            logDebug("Error parsing JSON response from server: " + e.name);
        }
    }

    function startTracking() {
        if (!isTracking) {
            if ("geolocation" in navigator) {
                watchPositionId = navigator.geolocation.watchPosition(function (position) {
                    currentPosition = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                });

                isTracking = true;
            }
        }
    }

    function stopTracking() {
        if (isTracking) {
            navigator.geolocation.clearWatch(watchPositionId);
            currentPosition = null;
            isTracking = false;
        }
    }

    function convertEventToDTO(event) {
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
            dt: event.EventDataType,
            dbg: event.Debug,
            ct: event.Timestamp,
            lc: event.Location,
            o: event.OptOut,
            pb: event.ProductBags,
            eec: event.ExpandedEventCount
        };

        if (event.EventDataType == MessageType.Commerce) {
            dto.cu = currencyCode;

            if (event.ShoppingCart) {
                dto.sc = {
                    pl: convertProductListToDTO(event.ShoppingCart.ProductList)
                }
            }

            if (event.ProductAction) {
                dto.pd = {
                    an: event.ProductAction.ProductActionType,
                    cs: event.ProductAction.CheckoutStep,
                    co: event.ProductAction.CheckoutOptions,
                    pl: convertProductListToDTO(event.ProductAction.ProductList),
                    ti: event.ProductAction.TransactionId,
                    ta: event.ProductAction.Affiliation,
                    tcc: event.ProductAction.CouponCode,
                    tr: event.ProductAction.TotalAmount,
                    ts: event.ProductAction.ShippingAmount,
                    tt: event.ProductAction.TaxAmount
                };

                if (event.ProductAction.ProductList) {
                    dto.pd.pl = convertProductListToDTO(event.ProductAction.ProductList);
                }
            }
            else if (event.PromotionAction) {
                dto.pm = {
                    an: event.PromotionAction.PromotionActionType,
                    pl: event.PromotionAction.PromotionList.map(function (promotion) {
                        return {
                            id: promotion.Id,
                            nm: promotion.Name,
                            cr: promotion.Creative,
                            ps: promotion.Position
                        };
                    })
                };
            }
            else if (event.ProductImpressions) {
                dto.pi = event.ProductImpressions.map(function (impression) {
                    return {
                        pil: impression.ProductImpressionList,
                        pl: convertProductListToDTO(impression.ProductList)
                    }
                });
            }
        }

        return dto;
    }

    function convertProductListToDTO(productList) {
        if (!productList) {
            return [];
        }

        return productList.map(function (product) {
            return convertProductToDTO(product);
        });
    }

    function convertProductToDTO(product) {
        return {
            id: product.Sku,
            nm: product.Name,
            pr: product.Price,
            qt: product.Quantity,
            br: product.Brand,
            va: product.Variant,
            ca: product.Category,
            ps: product.Position,
            cc: product.CouponCode,
            tpa: product.TotalAmount,
            attrs: product.Attributes
        };
    }

    function convertProductBagToDTO() {
        var convertedBag = {},
            list;

        for (prop in productsBags) {
            if (!productsBags.hasOwnProperty(prop)) {
                continue;
            }

            list = productsBags[prop].map(function (item) {
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

    function convertTransactionAttributesToProductAction(transactionAttributes, productAction) {
        productAction.TransactionId = transactionAttributes.Id;
        productAction.Affiliation = transactionAttributes.Affiliation;
        productAction.CouponCode = transactionAttributes.CouponCode;
        productAction.TotalAmount = transactionAttributes.Revenue;
        productAction.ShippingAmount = transactionAttributes.Shipping;
        productAction.TaxAmount = transactionAttributes.Tax;
    }

    function createEventObject(messageType, name, data, eventType) {
        var optOut = (messageType == MessageType.OptOut ? !isEnabled : null);

        if (sessionId || messageType == MessageType.OptOut) {
            lastEventSent = new Date();

            return {
                EventName: name ? name : messageType,
                EventCategory: eventType,
                UserAttributes: userAttributes,
                SessionAttributes: sessionAttributes,
                UserIdentities: userIdentities,
                Store: serverSettings,
                EventAttributes: data,
                SDKVersion: sdkVersion,
                SessionId: sessionId,
                EventDataType: messageType,
                Debug: mParticle.isSandbox,
                Timestamp: lastEventSent.getTime(),
                Location: currentPosition,
                OptOut: optOut,
                ProductBags: convertProductBagToDTO(),
                ExpandedEventCount: 0
            };
        }

        return null;
    }

    function convertProductActionToEventType(productActionType) {
        switch (productActionType) {
            case ProductActionType.AddToCart:
                return CommerceEventType.ProductAddToCart;
            case ProductActionType.AddToWishlist:
                return CommerceEventType.ProductAddToWishlist;
            case ProductActionType.Checkout:
                return CommerceEventType.ProductCheckout;
            case ProductActionType.Click:
                return CommerceEventType.ProductClick;
            case ProductActionType.Purchase:
                return CommerceEventType.ProductPurchase;
            case ProductActionType.Refund:
                return CommerceEventType.ProductRefund;
            case ProductActionType.RemoveFromCart:
                return CommerceEventType.ProductRemoveFromCart;
            case ProductActionType.RemoveFromWishlist:
                return CommerceEventType.ProductRemoveFromWishlist;
            case ProductActionType.Unknown:
                return EventType.Unknown;
            case ProductActionType.ViewDetail:
                return CommerceEventType.ProductViewDetail;
            default:
                logDebug('Could not convert product action type ' + productActionType + ' to event type');
                return null;
        }
    }

    function convertPromotionActionToEventType(promotionActionType) {
        switch (promotionActionType) {
            case PromotionActionType.PromotionClick:
                return CommerceEventType.PromotionClick;
            case PromotionActionType.PromotionView:
                return CommerceEventType.PromotionView;
            default:
                logDebug('Could not convert promotion action type ' + promotionActionType + ' to event type');
                return null;
        }
    }

    function createCommerceEventObject() {
        var baseEvent;

        logDebug(InformationMessages.StartingLogCommerceEvent);

        if (canLog()) {
            if (!sessionId) {
                mParticle.startNewSession();
            }

            baseEvent = createEventObject(MessageType.Commerce);

            baseEvent.CurrencyCode = currencyCode;
            baseEvent.ShoppingCart = {
                ProductList: cartProducts
            };

            return baseEvent;
        }
        else {
            logDebug(InformationMessages.AbandonLogEvent);
        }

        return null;
    };

    function logCheckoutEvent(step, options) {
        var event = createCommerceEventObject();

        if (event) {
            event.EventCategory = CommerceEventType.ProductCheckout;
            event.ProductAction = {
                ProductActionType: ProductActionType.Checkout,
                CheckoutStep: step,
                CheckoutOptions: options,
                ProductList: event.ShoppingCart.ProductList
            };

            logCommerceEvent(event);
        }
    }

    function logProductActionEvent(productActionType, product) {
        var event = createCommerceEventObject();

        if (event) {
            event.EventCategory = convertProductActionToEventType(productActionType);
            event.ProductAction = {
                ProductActionType: productActionType,
                ProductList: [product]
            };

            logCommerceEvent(event);
        }
    }

    function logPurchaseEvent(transactionAttributes, product) {
        var event = createCommerceEventObject();

        if (event) {
            event.EventCategory = CommerceEventType.ProductPurchase;
            event.ProductAction = {
                ProductActionType: ProductActionType.Purchase
            };

            convertTransactionAttributesToProductAction(transactionAttributes, event.ProductAction);

            if (product) {
                event.ProductAction.ProductList = [product];
            }
            else {
                event.ProductAction.ProductList = event.ShoppingCart.ProductList;
            }

            logCommerceEvent(event);
        }
    };

    function logRefundEvent(transactionAttributes, product) {
        if (transactionAttributes == null || typeof transactionAttributes == 'undefined') {
            logDebug(ErrorMessages.TransactionRequired);
            return;
        }

        var event = createCommerceEventObject();

        if (event) {
            event.EventCategory = CommerceEventType.ProductRefund;
            event.ProductAction = {
                ProductActionType: ProductActionType.Refund
            };

            convertTransactionAttributesToProductAction(transactionAttributes, event.ProductAction);

            if (product) {
                event.ProductAction.ProductList = [product];
            }
            else {
                event.ProductAction.ProductList = event.ShoppingCart.ProductList;
            }

            logCommerceEvent(event);
        }
    }

    function logPromotionEvent(promotionType, promotion) {
        var event = createCommerceEventObject();

        if (event) {
            event.EventCategory = convertPromotionActionToEventType(promotionType);
            event.PromotionAction = {
                PromotionActionType: promotionType,
                PromotionList: [promotion]
            };

            logCommerceEvent(event);
        }
    }

    function logImpressionEvent(impression) {
        var event = createCommerceEventObject();

        if (event) {
            event.EventCategory = CommerceEventType.ProductImpression;
            event.ProductImpressions = [{
                ProductImpressionList: impression.Name,
                ProductList: [impression.Product]
            }];

            logCommerceEvent(event);
        }
    }

    function logOptOut() {
        logDebug(InformationMessages.StartingLogOptOut);

        send(createEventObject(MessageType.OptOut, null, null, EventType.Other));
    }

    function logEvent(type, name, data, category) {
        logDebug(InformationMessages.StartingLogEvent + ': ' + name);

        if (canLog()) {
            if (!sessionId) {
                mParticle.startNewSession();
            }

            send(createEventObject(type, name, data, category));
            setCookie();
        }
        else {
            logDebug(InformationMessages.AbandonLogEvent);
        }
    }

    function logCommerceEvent(commerceEvent) {
        logDebug(InformationMessages.StartingLogCommerceEvent);

        if (canLog()) {
            if (!sessionId) {
                mParticle.startNewSession();
            }

            send(commerceEvent);
            setCookie();
        }
        else {
            logDebug(InformationMessages.AbandonLogEvent);
        }
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

    function generateUniqueId() {
        // See http://stackoverflow.com/a/2117523/637 for details
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function logDebug(msg) {
        if (mParticle.isDebug && window.console && window.console.log) {
            window.console.log(msg);
        }
    }

    function isEventType(type) {
        for (var prop in EventType) {
            if (EventType.hasOwnProperty(prop)) {
                if (EventType[prop] === type) {
                    return true;
                }
            }
        }
        return false;
    }

    function mergeConfig(config) {
        logDebug(InformationMessages.LoadingConfig);

        for (var prop in DefaultConfig) {
            if (DefaultConfig.hasOwnProperty(prop)) {
                Config[prop] = DefaultConfig[prop];
            }

            if (config.hasOwnProperty(prop)) {
                Config[prop] = config[prop];
            }
        }
    }

    function canLog() {
        if (isEnabled && (devToken || isWebViewEmbedded())) {
            return true;
        }

        return false;
    }

    function isObject(value) {
        return Object.prototype.toString.call(value) === "[object Object]";
    }

    function addEventHandler(domEvent, selector, eventName, data, eventType) {
        var elements = [],
            handler = function (e) {
                var timeoutHandler = function () {
                    if (element.href) {
                        window.location.href = element.href;
                    }
                    else if (element.submit) {
                        element.submit();
                    }
                };

                logDebug('DOM event triggered, handling event');

                logEvent(MessageType.PageEvent,
                    typeof eventName === 'function' ? eventName(element) : eventName,
                    typeof data === 'function' ? data(element) : data,
                    eventType ? eventType : EventType.Other);

                // TODO: Handle middle-clicks and special keys (ctrl, alt, etc)
                if ((element.href && element.target != '_blank') || element.submit) {
                    // Give xmlhttprequest enough time to execute before navigating a link or submitting form

                    if (e.preventDefault) {
                        e.preventDefault();
                    }
                    else {
                        e.returnValue = false;
                    }

                    setTimeout(timeoutHandler, Config.Timeout);
                }
            },
            element,
            i;

        if (!selector) {
            logDebug('Can\'t bind event, selector is required');
            return;
        }

        // Handle a css selector string or a dom element
        if (typeof selector === 'string') {
            elements = document.querySelectorAll(selector);
        }
        else if (selector.nodeType) {
            elements = [selector];
        }

        if (elements.length > 0) {
            logDebug('Found ' +
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
            logDebug('No elements found');
        }
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
            return name.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
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

        if (!name) {
            logDebug('Name is required when creating a product');
            return null;
        }

        if (!sku) {
            logDebug('SKU is required when creating a product');
            return null;
        }

        if (price !== price || price === null) {
            logDebug('Price is required when creating a product');
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
        return {
            Id: id,
            Creative: creative,
            Name: name,
            Position: position
        };
    }

    function createImpression(name, product) {
        if (!product) {
            logDebug('Product is required when creating an impression.');
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

        if (id === null || typeof id == 'undefined') {
            logDebug(ErrorMessages.TransactionIdRequired);
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

    var MessageType = {
        SessionStart: 1,
        SessionEnd: 2,
        PageView: 3,
        PageEvent: 4,
        CrashReport: 5,
        OptOut: 6,
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
        Media: 9
    };

    EventType.getName = function (id) {
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
            case EventType.Media:
                return 'Media';
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
        Alias: 8,
        FacebookCustomAudienceId: 9
    };

    IdentityType.getName = function (identityType) {
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
            case window.mParticle.IdentityType.Alias:
                return 'Alias ID';
            case window.mParticle.IdentityType.FacebookCustomAudienceId:
                return 'Facebook App User ID';
            default:
                return 'Other ID';
        }
    };

    var DefaultConfig = {
        CookieName: 'mprtcl-api',		// Name of the cookie stored on the user's machine
        CookieDomain: null,				// If null, defaults to current location.host
        Debug: false,					// If true, will print debug messages to browser console
        CookieExpiration: 365,			// Cookie expiration time in days
        Verbose: false,					// Whether the server will return verbose responses
        IncludeReferrer: true,			// Include user's referrer
        IncludeGoogleAdwords: true,		// Include utm_source and utm_properties
        Timeout: 300,					// Timeout in milliseconds for logging functions
        SessionTimeout: 30,				// Session timeout in minutes
        Sandbox: false                  // Events are marked as debug and only forwarded to debug forwarders
    };

    var Config = {};

    var ErrorMessages = {
        NoToken: 'A token must be specified.',
        EventNameInvalidType: 'Event name must be a valid string value.',
        EventDataInvalidType: 'Event data must be a valid object hash.',
        LoggingDisabled: 'Event logging is currently disabled.',
        CookieParseError: 'Could not parse cookie',
        EventEmpty: 'Event object is null or undefined, cancelling send',
        NoEventType: 'Event type must be specified.',
        TransactionIdRequired: 'Transaction ID is required',
        TransactionRequired: 'A transaction attributes object is required'
    };

    var InformationMessages = {
        CookieSearch: 'Searching for cookie',
        CookieFound: 'Cookie found, parsing values',
        CookieSet: 'Setting cookie',
        SendBegin: 'Starting to send event',
        SendWindowsPhone: 'Sending event to Windows Phone container',
        SendIOS: 'Calling iOS path: ',
        SendAndroid: 'Calling Android JS interface method: ',
        SendHttp: 'Sending event to mParticle HTTP service',
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
    };

    var NativeSdkPaths = {
        LogEvent: 'logEvent',
        SetUserIdentity: 'setUserIdentity',
        RemoveUserIdentity: 'removeUserIdentity',
        SetUserTag: 'setUserTag',
        RemoveUserTag: 'removeUserTag',
        SetUserAttribute: 'setUserAttribute',
        RemoveUserAttribute: 'removeUserAttribute',
        SetSessionAttribute: 'setSessionAttribute'
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

    ProductActionType.getName = function (id) {
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

    var PromotionActionType = {
        Unknown: 0,
        PromotionView: 1,
        PromotionClick: 2,
    };

    PromotionActionType.getName = function (id) {
        switch (id) {
            case PromotionActionType.PromotionView:
                return 'Promotion View';
            case PromotionActionType.PromotionClick:
                return 'Promotion Click';
            default:
                return 'Unknown';
        }
    };

    var mParticle = {
        isIOS: false,
        isDebug: false,
        isSandbox: false,
        generateHash: generateHash,
        IdentityType: IdentityType,
        EventType: EventType,
        CommerceEventType: CommerceEventType,
        PromotionType: PromotionActionType,
        ProductActionType: ProductActionType,
        init: function () {
            var token,
                config;

            logDebug(InformationMessages.StartingInitialization);

            if (arguments && arguments.length > 0) {
                if (typeof arguments[0] == 'string') {
                    // This is the dev token
                    token = arguments[0];

                    if (devToken !== token) {
                        mParticle.endSession();
                        devToken = token;
                    }

                    initForwarders();
                }

                if (typeof arguments[0] == 'object') {
                    config = arguments[0];
                }
                else if (arguments.length > 1 && typeof arguments[1] == 'object') {
                    config = arguments[1];
                }

                if (config) {
                    mergeConfig(config);
                }
            }

            // Call any functions that are waiting for the library to be initialized
            if (readyQueue && readyQueue.length) {
                for (var i = 0; i < readyQueue.length; i++) {
                    if (typeof readyQueue[i] == 'function') {
                        readyQueue[i]();
                    }
                }

                readyQueue = [];
            }

            setCookie();
            isInitialized = true;
        },
        reset: function () {
            // Completely resets the state of the SDK. mParticle.init() will need to be called again.

            isEnabled = true;
            stopTracking();
            devToken = null;
            sessionId = null;
            sessionAttributes = {};
            userAttributes = {};
            userIdentities = [];
            forwarders = [];
            productsBags = {};
            cartProducts = [];
            serverSettings = {};
            mergeConfig({});
            setCookie();

            isInitialized = false;
        },
        ready: function (f) {
            if (isInitialized && typeof f == 'function') {
                f();
            }
            else {
                readyQueue.push(f);
            }
        },
        getVersion: function () {
            return sdkVersion;
        },
        stopTrackingLocation: function () {
            stopTracking();
        },
        startTrackingLocation: function () {
            startTracking();
        },
        setPosition: function (lat, lng) {
            if (typeof lat === 'number' && typeof lng === 'number') {
                currentPosition = {
                    lat: lat,
                    lng: lng
                };
            }
            else {
                logDebug('Position latitude and/or longitude are invalid');
            }
        },
        setUserIdentity: function (id, type) {
            if (canLog()) {
                userIdentity = {
                    Identity: id,
                    Type: type
                };

                userIdentities.push(userIdentity);

                if (!tryNativeSdk(NativeSdkPaths.SetUserIdentity, JSON.stringify(userIdentity))) {
                    if (forwarders) {
                        for (var i = 0; i < forwarders.length; i++) {
                            if (forwarders[i].setUserIdentity &&
                                (!forwarders[i].userIdentityFilters ||
                                !inArray(forwarders[i].userIdentityFilters, type))) {

                                var result = forwarders[i].setUserIdentity(id, type);

                                if (result) {
                                    logDebug(result);
                                }
                            }
                        }
                    }
                }

                setCookie();
            }
        },
        getUserIdentity: function (id) {
            var foundIdentity = null;

            userIdentities.forEach(function (identity) {
                if (identity.Identity === id) {
                    foundIdentity = identity;
                }
            });

            return foundIdentity;
        },
        removeUserIdentity: function (id) {
            var i = 0;

            // Bug: duplicate identities were being saved, so clean them up
            for (i = 0; i < userIdentities.length; i++) {
                if (userIdentities[i].Identity === id) {
                    userIdentities.splice(i, 1);
                    i--;
                }
            }

            tryNativeSdk(NativeSdkPaths.RemoveUserIdentity, id);

            setCookie();
        },
        startNewSession: function () {
            // Ends the current session if one is in progress

            logDebug(InformationMessages.StartingNewSession);

            if (canLog()) {
                mParticle.endSession();
                sessionId = generateUniqueId();

                if (!lastEventSent) {
                    lastEventSent = new Date();
                }

                logEvent(MessageType.SessionStart);
            }
            else {
                logDebug(InformationMessages.AbandonStartSession);
            }
        },
        endSession: function () {
            logDebug(InformationMessages.StartingEndSession);

            // Ends the current session.
            if (canLog()) {
                if (!sessionId) {
                    logDebug(InformationMessages.NoSessionToEnd);
                    return;
                }

                logEvent(MessageType.SessionEnd);

                sessionId = null;
                sessionAttributes = {};
            }
            else {
                logDebug(InformationMessages.AbandonEndSession);
            }
        },
        logEvent: function (eventName, eventType, eventInfo) {
            if (typeof (eventName) != 'string') {
                logDebug(ErrorMessages.EventNameInvalidType);
                return;
            }

            if (eventInfo && !isObject(eventInfo)) {
                logDebug(ErrorMessages.EventDataInvalidType);
                return;
            }

            if (!eventType) {
                eventType = EventType.Unknown;
            }

            if (!isEventType(eventType)) {
                logDebug('Invalid event type: ' + eventType + ', must be one of: \n' + JSON.stringify(EventType));
                return;
            }

            if (!canLog()) {
                logDebug(ErrorMessages.LoggingDisabled);
                return;
            }

            if (!lastEventSent) {
                lastEventSent = new Date();
            }
            else if (new Date() > new Date(lastEventSent.getTime() + Config.SessionTimeout * 60000)) {
                // Session has timed out, start a new one
                mParticle.startNewSession();
            }

            logEvent(MessageType.PageEvent, eventName, eventInfo, eventType);
        },
        logError: function (error) {
            if (!error) {
                return;
            }

            if (typeof error == 'string') {
                error = {
                    message: error
                };
            }

            logEvent(MessageType.CrashReport,
                error.name ? error.name : 'Error',
                {
                    m: error.message ? error.message : error,
                    s: 'Error',
                    t: error.stack
                },
                EventType.Other);
        },
        logLink: function (selector, eventName, eventType, eventInfo) {
            addEventHandler('click', selector, eventName, eventInfo, eventType);
        },
        logForm: function (selector, eventName, eventType, eventInfo) {
            addEventHandler('submit', selector, eventName, eventInfo, eventType);
        },
        logPageView: function () {
            if (canLog()) {
                logEvent(MessageType.PageView,
                    window.location.pathname, {
                        hostname: window.location.hostname,
                        title: window.document.title
                    }, EventType.Unknown);
            }
        },
        eCommerce: {
            ProductBags: {
                add: function (productBagName, product) {
                    if (!productsBags[productBagName]) {
                        productsBags[productBagName] = [];
                    }

                    productsBags[productBagName].push(product);
                },
                remove: function (productBagName, product) {
                    var productIndex = -1;

                    if (productsBags[productBagName]) {
                        productsBags[productBagName].forEach(function (item, index) {
                            if (item.sku === product.sku) {
                                productIndex = index;
                            }
                        });

                        if (productIndex > -1) {
                            productsBags[productBagName].splice(productIndex, 1);
                        }
                    }
                },
                clear: function (productBagName) {
                    productsBags[productBagName] = [];
                }
            },
            Cart: {
                add: function (product, logEvent) {
                    cartProducts.push(product);

                    if (logEvent === true) {
                        logProductActionEvent(ProductActionType.AddToCart, product);
                    }
                },
                remove: function (product, logEvent) {
                    var cartIndex = -1,
                        cartItem = null;

                    if (cartProducts) {
                        cartProducts.forEach(function (item, index) {
                            if (item.Sku === product.Sku) {
                                cartIndex = index;
                                cartItem = item;
                            }
                        });

                        if (cartIndex > -1) {
                            cartProducts.splice(cartIndex, 1);

                            if (logEvent === true) {
                                logProductActionEvent(ProductActionType.RemoveFromCart, cartItem);
                            }
                        }
                    }
                },
                clear: function () {
                    cartProducts = [];
                }
            },
            setCurrencyCode: function (code) {
                currencyCode = code;
            },
            createProduct: function (name, sku, price, quantity, variant, category, brand, position, coupon, attributes) {
                return createProduct(name, sku, price, quantity, variant, category, brand, position, coupon, attributes);
            },
            createPromotion: function (id, creative, name, position) {
                return createPromotion(id, creative, name, position);
            },
            createImpression: function (name, product) {
                return createImpression(name, product);
            },
            createTransactionAttributes: function (id, affiliation, couponCode, revenue, shipping, tax) {
                return createTransactionAttributes(id, affiliation, couponCode, revenue, shipping, tax);
            },
            logCheckout: function (step, paymentMethod) {
                logCheckoutEvent(step, paymentMethod);
            },
            logProductAction: function (productActionType, product) {
                logProductActionEvent(productActionType, product);
            },
            logPurchase: function (transactionAttributes, product, clearCart) {
                logPurchaseEvent(transactionAttributes, product);

                if (clearCart === true) {
                    mParticle.eCommerce.Cart.clear();
                }
            },
            logPromotion: function (type, promotion) {
                logPromotionEvent(type, promotion);
            },
            logImpression: function (impression) {
                logImpressionEvent(impression);
            },
            logRefund: function (transactionAttributes, product, clearCart) {
                logRefundEvent(transactionAttributes, product);

                if (clearCart === true) {
                    mParticle.eCommerce.Cart.clear();
                }
            }
        },
        logEcommerceTransaction: function (productName,
            productSKU,
            productUnitPrice,
            productQuantity,
            productCategory,
            revenueAmount,
            taxAmount,
            shippingAmount,
            currencyCode,
            affiliation,
            transactionId) {

            attributes = {};
            attributes.$MethodName = 'LogEcommerceTransaction';

            attributes.ProductName = productName ? productName : '';
            attributes.ProductSKU = productSKU ? productSKU : '';
            attributes.ProductUnitPrice = productUnitPrice ? productUnitPrice : 0;
            attributes.ProductQuantity = productQuantity ? productQuantity : 0;
            attributes.ProductCategory = productCategory ? productCategory : '';
            attributes.RevenueAmount = revenueAmount ? revenueAmount : 0;
            attributes.TaxAmount = taxAmount ? taxAmount : 0;
            attributes.ShippingAmount = shippingAmount ? shippingAmount : 0;
            attributes.CurrencyCode = currencyCode ? currencyCode : 'USD';
            attributes.TransactionAffiliation = affiliation ? affiliation : '';
            attributes.TransactionID = transactionId ? transactionId : generateUniqueId();

            logEvent(MessageType.PageEvent, 'Ecommerce', attributes, EventType.Transaction);
        },
        setUserTag: function (tagName) {
            window.mParticle.setUserAttribute(tagName, null);
        },
        removeUserTag: function (tagName) {
            delete userAttributes[tagName];
            tryNativeSdk(NativeSdkPaths.RemoveUserTag, JSON.stringify({ key: tagName, value: null }));
            setCookie();
        },
        setUserAttribute: function (key, value) {
            // Logs to cookie
            // And logs to in-memory object
            // Example: mParticle.setUserAttribute('email', 'tbreffni@mparticle.com');
            if (canLog()) {
                userAttributes[key] = value;
                setCookie();
                if (!tryNativeSdk(NativeSdkPaths.SetUserAttribute, JSON.stringify({ key: key, value: value }))) {
                    if (forwarders) {
                        for (var i = 0; i < forwarders.length; i++) {
                            if (forwarders[i].setUserAttribute &&
                                forwarders[i].userAttributeFilters &&
                                !inArray(forwarders[i].userAttributeFilters, generateHash(key))) {
                                var result = forwarders[i].setUserAttribute(key, value);

                                if (result) {
                                    logDebug(result);
                                }
                            }
                        }
                    }
                }
            }
        },
        removeUserAttribute: function (key) {
            delete userAttributes[key];
            tryNativeSdk(NativeSdkPaths.RemoveUserAttribute, JSON.stringify({ key: key, value: null }));
            setCookie();
        },
        setSessionAttribute: function (key, value) {
            // Logs to cookie
            // And logs to in-memory object
            // Example: mParticle.setSessionAttribute('location', '33431');
            if (canLog()) {
                sessionAttributes[key] = value;
                setCookie();
                if (!tryNativeSdk(NativeSdkPaths.SetSessionAttribute, JSON.stringify({ key: key, value: value }))) {
                    applyToForwarders('setSessionAttribute', [key, value]);
                }
            }
        },
        setOptOut: function (isOptingOut) {
            isEnabled = !isOptingOut;

            logOptOut();
            setCookie();

            if (forwarders) {
                for (var i = 0; i < forwarders.length; i++) {
                    if (forwarders[i].setOptOut) {
                        var result = forwarders[i].setOptOut(isOptingOut);

                        if (result) {
                            logDebug(result);
                        }
                    }
                }
            }
        },
        addForwarder: function (forwarderProcessor) {
            forwarderConstructors.push(forwarderProcessor);
        },
        configureForwarder: function (name,
            settings,
            eventNameFilters,
            eventTypeFilters,
            attributeFilters,
            pageViewFilters,
            pageViewAttributeFilters,
            userIdentityFilters,
            userAttributeFilters,
            id,
            isSandbox,
            hasSandbox) {

            var newForwarder = null;

            for (var i = 0; i < forwarderConstructors.length; i++) {
                if (forwarderConstructors[i].name == name) {
                    newForwarder = new forwarderConstructors[i].constructor();

                    newForwarder.id = id;
                    newForwarder.isSandbox = isSandbox;
                    newForwarder.hasSandbox = hasSandbox;
                    newForwarder.settings = settings;

                    newForwarder.eventNameFilters = eventNameFilters;
                    newForwarder.eventTypeFilters = eventTypeFilters;
                    newForwarder.attributeFilters = attributeFilters;

                    newForwarder.pageViewFilters = pageViewFilters;
                    newForwarder.pageViewAttributeFilters = pageViewAttributeFilters;

                    newForwarder.userIdentityFilters = userIdentityFilters;
                    newForwarder.userAttributeFilters = userAttributeFilters;

                    forwarders.push(newForwarder);

                    break;
                }
            }
        }
    };

    getCookie();

    // Read existing configuration if present
    if (window.mParticle && window.mParticle.config) {
        if (window.mParticle.config.serviceUrl) {
            serviceUrl = window.mParticle.config.serviceUrl;
        }

        if (window.mParticle.config.secureServiceUrl) {
            secureServiceUrl = window.mParticle.config.secureServiceUrl;
        }

        // Check for any functions queued
        if (window.mParticle.config.rq) {
            readyQueue = window.mParticle.config.rq;
        }

        if (window.mParticle.config.hasOwnProperty('isDebug')) {
            window.mParticle.isDebug = window.mParticle.config.isDebug;
        }

        if (window.mParticle.config.hasOwnProperty('isSandbox')) {
            window.mParticle.isSandbox = window.mParticle.config.isSandbox;
        }
    }

    window.mParticle = mParticle;
})(window);
