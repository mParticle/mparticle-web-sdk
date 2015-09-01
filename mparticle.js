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
        currencyCode = null;

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
            },
            isSecure = window.location.protocol === 'https:',
            eventJson = JSON.stringify(event);

        logDebug(InformationMessages.SendBegin);

        if (!event) {
            logDebug(ErrorMessages.EventEmpty);
            return;
        }

        if (window.external && typeof (window.external.Notify) === 'unknown') {
            // Inside a Windows Phone WebBrowser control
            logDebug(InformationMessages.SendWindowsPhone);
            window.external.Notify(JSON.stringify(event));
        }
        else if (!tryNativeSdk(NativeSdkPaths.LogEvent, JSON.stringify(event))) {
            logDebug(InformationMessages.SendHttp);

            try {
                xhr = new window.XMLHttpRequest();
            } catch (e) {
                logDebug('Error creating XMLHttpRequest object.');
            }

            if (xhr && "withCredentials" in xhr) {
                xhr.onreadystatechange = xhrCallback;
            }
            else if (typeof window.XDomainRequest != 'undefined') {
                logDebug('Creating XDomainRequest object');

                try {
                    xhr = new window.XDomainRequest();
                    xhr.onload = xhrCallback;
                }
                catch (e) {
                    logDebug('Error creating XDomainRequest object');
                }
            }

            if (xhr) {
                try {
                    xhr.open('post',
                    serviceScheme +
                    (isSecure ? secureServiceUrl : serviceUrl) +
                    devToken +
                    '/' +
                    'Events');
                    xhr.send(eventJson);
                    sendEventToForwarders(event);
                }
                catch (e) {
                    logDebug('Error sending event to mParticle servers.');
                }
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

                if (event.ua) {
                    for (var attrName in event.ua) {
                        if (event.ua.hasOwnProperty(attrName)) {
                            hash = generateHash(attrName);

                            if (inArray(filterList, hash)) {
                                delete event.ua[attrName];
                            }
                        }
                    }
                }
            },
            filterUserIdentities = function (event, filterList) {
                if (event.ui && event.ui.length > 0) {
                    for (var i = 0; i < event.ui.length; i++) {
                        if (inArray(filterList, event.ui[i].Type)) {
                            event.ui.splice(i, 1);

                            if (i > 0) {
                                i--;
                            }
                        }
                    }
                }
            },
            filterAttributes = function (event, filterList) {
                var hash;

                for (var attrName in event.attrs) {
                    if (event.attrs.hasOwnProperty(attrName)) {
                        hash = generateHash(event.et + event.n + attrName);

                        if (inArray(filterList, hash)) {
                            delete event.attrs[attrName];
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
            hashedName = generateHash(event.et + event.n);
            hashedType = generateHash(event.et);

            for (var i = 0; i < forwarders.length; i++) {
                // Clone the event object, as we could be sending different attributes to each forwarder
                clonedEvent = {};
                clonedEvent = extend(true, clonedEvent, event);

                // Check event filtering rules
                if (event.dt == MessageType.PageEvent
                    && (inFilteredList(forwarders[i].eventNameFilters, hashedName)
                        || inFilteredList(forwarders[i].eventTypeFilters, hashedType))) {
                    continue;
                }
                else if (event.dt == MessageType.PageView && inFilteredList(forwarders[i].pageViewFilters, hashedName)) {
                    continue;
                }

                // Check attribute filtering rules
                if (clonedEvent.attrs) {
                    if (event.dt == MessageType.PageEvent) {
                        filterAttributes(clonedEvent, forwarders[i].attributeFilters);
                    }
                    else if (event.dt == MessageType.PageView) {
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

            //some js libraries require that they be loaded first, or last, etc
            forwarders.sort(function (x, y) {
                x.settings.PriorityValue = x.settings.PriorityValue || 0;
                y.settings.PriorityValue = y.settings.PriorityValue || 0;
                return -1 * (x.settings.PriorityValue - y.settings.PriorityValue);
            });

            for (var i = 0; i < forwarders.length; i++) {
                forwarders[i].init(forwarders[i].settings);
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

    function convertProductToDTO(product) {
        return {
            id: product.sku,
            nm: product.name,
            pr: product.price,
            qt: product.quantity,
            br: product.brand,
            va: product.variant,
            ca: product.category,
            ps: product.position,
            cc: product.couponCode,
            tpa: product.totalAmount
        };
    }

    function convertCartProductsToDTO() {
        return cartProducts.map(function (item) {
            return convertProductToDTO(item);
        });
    }

    function convertProductBagToDTO() {
        var convertedBag = {};

        for (prop in productsBags) {
            if (!productsBags.hasOwnProperty(prop)) {
                continue;
            }

            convertedBag[prop] = {
                pl: productsBags[prop].map(function (item) {
                    return convertProductToDTO(item);
                })
            };
        }

        return convertedBag;
    }

    function createEventObject(messageType, name, data, eventType) {
        var optOut = (messageType == MessageType.OptOut ? isEnabled : null);

        if (sessionId) {
            lastEventSent = new Date();

            if (isWebViewEmbedded()) {
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
                    ProductBags: convertProductBagToDTO()
                };
            }
            else {
                return {
                    n: name ? name : messageType,	// Event Name
                    et: eventType,					// Event type
                    ua: userAttributes,				// User Attributes
                    sa: sessionAttributes,			// Session Attributes
                    ui: userIdentities,				// User Identities
                    str: serverSettings,			// Server Settings
                    attrs: data,					// Event Attributes
                    sdk: sdkVersion,				// SDK Version
                    sid: sessionId,					// Session Id
                    dt: messageType,				// Event Message Type
                    dbg: mParticle.isSandbox,		// Sandbox Mode
                    ct: lastEventSent.getTime(),	// Timestamp
                    lc: currentPosition,		    // Location
                    o: optOut,                      // Opt-Out
                    pb: convertProductBagToDTO()    // Product Bags
                };
            }
        }

        return null;
    }

    function createCommerceEventObject() {
        logDebug(InformationMessages.StartingLogCommerceEvent);

        if (canLog()) {
            if (!sessionId) {
                mParticle.startNewSession();
            }

            var baseEvent = createEventObject(MessageType.Commerce);

            baseEvent.cu = currencyCode;
            baseEvent.sc = {
                pl: convertCartProductsToDTO(cartProducts)
            };

            return baseEvent;
        }
        else {
            logDebug(InformationMessages.AbandonLogEvent);
        }

        return null;
    };

    function logAddToCart(product) {
        var event = createCommerceEventObject();

        if (event) {
            event.pd = {
                an: ProductActionType.AddToCart,
                pl: [convertProductToDTO(product)]
            };

            logCommerceEvent(event);
        }
    }

    function logCheckoutEvent(step, options) {
        var event = createCommerceEventObject();

        if (event) {
            event.pd = {
                an: ProductActionType.Checkout,
                cs: step,
                co: options
            };

            logCommerceEvent(event);
        }
    }

    function logPurchaseEvent(transactionAttributes, product) {
        var event = createCommerceEventObject();

        if (event) {
            event.pd = {
                an: ProductActionType.Purchase,
                ti: transactionAttributes.id,
                ta: transactionAttributes.affiliation,
                tcc: transactionAttributes.couponCode,
                tr: transactionAttributes.revenue,
                ts: transactionAttributes.shipping,
                tt: transactionAttributes.tax
            };

            if (product) {
                event.pd.pl = [convertProductToDTO(product)];
            }
            else {
                event.pd.pl = event.sc.pl;
            }

            logCommerceEvent(event);
        }
    };

    function logPromotionEvent(promotionType, promotion) {
        var event = createCommerceEventObject();

        if (event) {
            event.pm = {
                an: promotionType,
                pl: [{
                    id: promotion.id,
                    nm: promotion.name,
                    cr: promotion.creative,
                    ps: promotion.position
                }]
            };

            logCommerceEvent(event);
        }
    }

    function logImpressionEvent(impression) {
        var event = createCommerceEventObject();

        if (event) {
            event.pi = [{
                pil: impression.name,
                pl: [convertProductToDTO(impression.product)]
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

        for (var prop in Config) {
            if (Config.hasOwnProperty(prop) && config.hasOwnProperty(prop)) {
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
        totalAmount) {

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

        return {
            name: name,
            sku: sku,
            price: price,
            quantity: quantity,
            brand: brand,
            variant: variant,
            category: category,
            position: position,
            couponCode: couponCode,
            totalAmount: totalAmount
        };
    }

    function createPromotion(id, creative, name, position) {
        return {
            id: id,
            creative: creative,
            name: name,
            position: position
        };
    }

    function createImpression(name, product) {
        if (!product) {
            logDebug('Product is required when creating an impression.');
            return null;
        }

        return {
            name: name,
            product: product
        };
    }

    function createTransactionAttributes(affiliation,
        couponCode,
        id,
        revenue,
        shipping,
        tax) {

        return {
            id: id,
            affiliation: affiliation,
            couponCode: couponCode,
            revenue: revenue,
            shipping: shipping,
            tax: tax
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
        Navigation: 1,
        Location: 2,
        Search: 3,
        Transaction: 4,
        UserContent: 5,
        UserPreference: 6,
        Social: 7,
        Other: 8
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

    var Config = {
        CookieName: 'mprtcl-api',		// Name of the cookie stored on the user's machine
        CookieDomain: null,				// If null, defaults to current location.host
        Debug: false,					// If true, will print debug messages to browser console
        CookieExpiration: 365,			// Cookie expiration time in days
        Verbose: false,					// Whether the server will return verbose responses
        IncludeReferrer: true,			// Include user's referrer
        IncludeGoogleAdwords: true,		// Include utm_source and utm_properties
        Timeout: 300,					// Timeout in milliseconds for logging functions
        SessionTimeout: 30				// Session timeout in minutes
    };

    var ErrorMessages = {
        NoToken: 'A token must be specified.',
        EventNameInvalidType: 'Event name must be a valid string value.',
        EventDataInvalidType: 'Event data must be a valid object hash.',
        LoggingDisabled: 'Event logging is currently disabled.',
        CookieParseError: 'Could not parse cookie',
        EventEmpty: 'Event object is null or undefined, cancelling send',
        NoEventType: 'Event type must be specified.'
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
        RemoveFromWishlist: 10,
    };

    var PromotionActionType = {
        Unknown: 0,
        PromotionView: 1,
        PromotionClick: 2,
    };

    var mParticle = {
        isIOS: false,
        isDebug: false,
        isSandbox: false,
        generateHash: generateHash,
        IdentityType: IdentityType,
        EventType: EventType,
        PromotionType: PromotionActionType,
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
        ready: function (f) {
            if (isInitialized && typeof f == 'function') {
                f();
            }
            else {
                readyQueue.push(f);
            }
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
                // There was a bug in setUserIdentity which resulted in duplicate identities being saved.
                // removeUserIdentity is being called here to ensure all duplicates are cleaned up before saving.

                mParticle.removeUserIdentity(id);

                userIdentity = {
                    Identity: id,
                    Type: type
                };

                userIdentities.push(userIdentity);

                if (!tryNativeSdk(NativeSdkPaths.SetUserIdentity, JSON.stringify(userIdentity))) {
                    if (forwarders) {
                        for (var i = 0; i < forwarders.length; i++) {
                            if (forwarders[i].setUserIdentity &&
                                !inArray(forwarders[i].userIdentityFilters, type)) {
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
            // Example: mParticle.logEvent('Purchase', { price: 9.99 });

            if (typeof (eventName) != 'string') {
                logDebug(ErrorMessages.EventNameInvalidType);
                return;
            }

            if (eventInfo && !isObject(eventInfo)) {
                logDebug(ErrorMessages.EventDataInvalidType);
                return;
            }

            if (!eventType) {
                logDebug(ErrorMessages.NoEventType);
                return;
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
            // Example: mParticle.logPageView();

            if (canLog()) {
                logEvent(MessageType.PageView,
                    window.location.pathname, {
                        hostname: window.location.hostname,
                        title: window.document.title
                    }, 0); // Event type 0 = Unknown
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
                },
                remove: function (product) {
                    var cartIndex = -1;

                    if (cartProducts) {
                        cartProducts.forEach(function (item, index) {
                            if (item.sku === product.sku) {
                                cartIndex = index;
                            }
                        });

                        if (cartIndex > -1) {
                            cartProducts.splice(cartIndex, 1);
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
            createProduct: function (name, sku, price, quantity) {
                return createProduct(name, sku, price, quantity);
            },
            createPromotion: function (id, creative, name, position) {
                return createPromotion(id, creative, name, position);
            },
            createImpression: function (name, product) {
                return createImpression(name, product);
            },
            createTransactionAttributes: function (id, affiliation, couponCode, revenue, shipping, tax) {
                return createTransactionAttributes(affiliation, couponCode, id, revenue, shipping, tax);
            },
            logCheckout: function (step, paymentMethod) {
                logCheckoutEvent(step, paymentMethod);
            },
            logPurchase: function (transactionAttributes, product) {
                logPurchaseEvent(transactionAttributes, product);
            },
            logPromotion: function (type, promotion) {
                logPromotionEvent(type, promotion);
            },
            logImpression: function (impression) {
                logImpressionEvent(impression);
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
            logOptOut();

            isEnabled = !isOptingOut;
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
            forwarders.push(forwarderProcessor);
        },
        configureForwarder: function (name,
            settings,
            eventNameFilters,
            eventTypeFilters,
            attributeFilters,
            pageViewFilters,
            pageViewAttributeFilters,
            userIdentityFilters,
            userAttributeFilters) {

            for (var i = 0; i < forwarders.length; i++) {
                if (forwarders[i].name == name) {
                    forwarders[i].settings = settings;

                    forwarders[i].eventNameFilters = eventNameFilters;
                    forwarders[i].eventTypeFilters = eventTypeFilters;
                    forwarders[i].attributeFilters = attributeFilters;

                    forwarders[i].pageViewFilters = pageViewFilters;
                    forwarders[i].pageViewAttributeFilters = pageViewAttributeFilters;

                    forwarders[i].userIdentityFilters = userIdentityFilters;
                    forwarders[i].userAttributeFilters = userAttributeFilters;
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
    }

    window.mParticle = mParticle;
})(window);
