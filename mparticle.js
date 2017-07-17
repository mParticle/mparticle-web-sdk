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

(function(window) {
    var serviceUrl = function(version) {
            return 'jssdk.mparticle.com/' + version + '/JS/';
        },
        secureServiceUrl = function(version) {
            return 'jssdks.mparticle.com/' + version + '/JS/';
        },
        // TODO: Update this when final http api is done
        identityUrl = 'https://identity.qa.corp.mparticle.com/v1/',
        serviceScheme = window.location.protocol + '//',
        sdkVersion = '2.0.0',
        sdkVendor = 'mparticle',
        platform = 'web',
        isEnabled = true,
        pluses = /\+/g,
        sessionAttributes = {},
        currentSessionMPIDs = [],
        userAttributes = {},
        userIdentities = {},
        forwarderConstructors = [],
        forwarders = [],
        sessionId,
        isFirstRun,
        clientId,
        deviceId,
        mpid,
        devToken,
        pixelConfigurations = [],
        serverSettings = null,
        dateLastEventSent,
        cookieSyncDates = {},
        currentPosition,
        isTracking = false,
        watchPositionId,
        readyQueue = [],
        isInitialized = false,
        productsBags = {},
        cartProducts = [],
        eventQueue = [],
        currencyCode = null,
        appVersion = null,
        appName = null,
        customFlags = null,
        globalTimer,
        identityCallback,
        context = '',
        METHOD_NAME = '$MethodName',
        LOG_LTV = 'LogLTVIncrease',
        RESERVED_KEY_LTV = '$Amount';

    // forEach polyfill
    // Production steps of ECMA-262, Edition 5, 15.4.4.18
    // Reference: http://es5.github.io/#x15.4.4.18

    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function(callback, thisArg) {
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
        };
    }

    // map polyfill
    // Production steps of ECMA-262, Edition 5, 15.4.4.19
    // Reference: http://es5.github.io/#x15.4.4.19
    if (!Array.prototype.map) {
        Array.prototype.map = function(callback, thisArg) {
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
        };
    }

    // filter polyfill
    // Prodcution steps of ECMA-262, Edition 5
    // Reference: http://es5.github.io/#x15.4.4.20
    if (!Array.prototype.filter) {
        Array.prototype.filter = function(fun/*, thisArg*/) {
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
        };
    }

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
    if (!Array.isArray) {
        Array.prototype.isArray = function (arg) {
            return Object.prototype.toString.call(arg) === '[object Array]';
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

    function createServiceUrl(version) {
        return serviceScheme + ((window.location.protocol === 'https:') ? secureServiceUrl(version) : serviceUrl(version)) + devToken;
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
        if (!mParticle.useNativeSdk) {
            return false;
        }
        if (window.mParticleAndroid && window.mParticleAndroid.hasOwnProperty(path)) {
            logDebug(InformationMessages.SendAndroid + path);
            window.mParticleAndroid[path](value);

            return true;
        }
        else if (window.mParticle.isIOS || isUIWebView()) {
            logDebug(InformationMessages.SendIOS + path);
            var iframe = document.createElement('IFRAME');
            iframe.setAttribute('src', 'mp-sdk://' + path + '/' + value);
            document.documentElement.appendChild(iframe);
            iframe.parentNode.removeChild(iframe);
            iframe = null;

            return true;
        }

        return false;
    }

    var _IdentityRequest = {
        createKnownIdentities: function(identityApiData) {
            if (identityApiData) {
                var identitiesResult = {};
                for (var identity in identityApiData.userIdentities) {
                    identitiesResult[this.getIdentityName(parseFloat(identity))] = identityApiData.userIdentities[identity];
                }
                return identitiesResult;
            }
        },

        getIdentityName: function(identityType) {
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
        },

        createIdentityRequest: function(identityApiData) {
            var APIRequest = {
                client_sdk: {
                    platform: platform,
                    sdk_vendor: sdkVendor,
                    sdk_version: sdkVersion
                },
                context: context,
                environment: mParticle.isDevelopmentMode ? 'development' : 'production',
                request_id: generateUniqueId(),
                request_timestamp_ms: new Date().getTime(),
                previous_mpid: mpid || null,
                known_identities: this.createKnownIdentities(identityApiData)
            };

            return APIRequest;
        },

        createModifyIdentityRequest: function(currentUserIdentities, newUserIdentities) {
            return {
                client_sdk: {
                    platform: platform,
                    sdk_vendor: sdkVendor,
                    sdk_version: sdkVersion
                },
                context: context,
                environment: mParticle.isDevelopmentMode ? 'development' : 'production',
                request_id: generateUniqueId(),
                request_timestamp_ms: new Date().getTime(),
                identity_changes: this.createIdentityChanges(currentUserIdentities, newUserIdentities)
            };
        },

        createIdentityChanges: function(previousIdentities, newIdentities) {
            var identityChanges = [];
            var key;
            for (key in newIdentities) {
                identityChanges.push({
                    old_value: previousIdentities[key] || null,
                    new_value: newIdentities[key] || null,
                    identity_type: this.getIdentityName(parseFloat(key))
                });
            }

            for (key in previousIdentities) {
                if (!newIdentities[key]) {
                    identityChanges.push({
                        old_value: previousIdentities[key] || null,
                        new_value: null,
                        identity_type: this.getIdentityName(parseFloat(key))
                    });
                }
            }

            return identityChanges;
        },

        parseIdentityResponse: function(xhr, copyAttributes, previousMPID, callback) {
            try {
                logDebug('Parsing identity response from server');

                var identityApiResult = JSON.parse(xhr.responseText);
                if (identityApiResult && identityApiResult.mpid) {
                    logDebug('Successfully parsed Identity Response');

                    if (identityApiResult.mpid !== mpid) {
                        mpid = identityApiResult.mpid;
                        if (!copyAttributes) {
                            userAttributes = {};
                        }
                    }

                    if (sessionId && mpid && previousMPID !== mpid && currentSessionMPIDs.indexOf(mpid) < 0) {
                        currentSessionMPIDs.push(mpid);
                        // need to update currentSessionMPIDs in memory before checkingIdentitySwap otherwise previous obj.currentSessionMPIDs is used in checkIdentitySwap's persistence.update()
                        persistence.update();
                    }

                    cookieSyncManager.attemptCookieSync(previousMPID, mpid);

                    _Identity.checkIdentitySwap(previousMPID, mpid);

                    if (callback) {
                        callback(null, identityApiResult);
                    }

                    context = identityApiResult.context || context;
                    // events exist in the eventQueue because they were triggered when the identityAPI request was in flight
                    // once API request returns, eventQueue items are reassigned with the returned MPID and flushed
                    if (eventQueue.length && mpid !==0) {
                        eventQueue.forEach(function(event) {
                            event.MPID = mpid;
                            send(event);
                        });
                    }

                    persistence.update();
                }
                else {
                    logDebug('Received HTTP response code of ' + xhr.status);
                    if (callback) {
                        callback(identityApiResult);
                    }
                }
            }
            catch (e) {
                if (callback) {
                    callback(e);
                }
                logDebug('Error parsing JSON response from Identity server: ' + e);
            }
        },
        returnCopyAttributes: function(identityApiData) {
            return (identityApiData && identityApiData.copyUserAttributes);
        }
    };

    function sendIdentityRequest(identityApiRequest, method, callback, copyAttributes) {
        var xhr, previousMPID,
            xhrCallback = function() {
                if (xhr.readyState === 4) {
                    logDebug('Received ' + xhr.statusText + ' from server');

                    _IdentityRequest.parseIdentityResponse(xhr, copyAttributes, previousMPID, callback);
                }
            };

        logDebug(InformationMessages.SendIdentityBegin);

        if (!identityApiRequest) {
            logDebug(ErrorMessages.APIRequestEmpty);
            return;
        }

        logDebug(InformationMessages.SendIdentityHttp);
        xhr = createXHR(xhrCallback);

        if (xhr) {
            try {
                if (!isFirstRun && mpid) {
                    previousMPID = mpid;
                }
                // Set MPID = 0 when Identity request is in flight
                mpid = 0;
                xhr.open('post', identityUrl + method);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('x-mp-key', devToken);
                xhr.send(JSON.stringify(identityApiRequest));
            }
            catch (e) {
                if (callback) {
                    callback(e);
                }
                logDebug('Error sending identity request to servers. ' + e);
            }
        }
    }

    function identify(identityApiData) {
        logDebug('Initiating identify request');
        var identityApiRequest = _IdentityRequest.createIdentityRequest(identityApiData),
            copyAttributes = _IdentityRequest.returnCopyAttributes(identityApiData);

        sendIdentityRequest(identityApiRequest, 'identify', identityCallback, copyAttributes);
    }

    var IdentityAPI = {
        logout: function(identityApiData, callback) {
            if (callback && !Validators.isFunction(callback)) {
                logDebug('The optional callback must be a function. You tried entering a ' + typeof fn);
            }

            var evt,
                identityApiRequest = _IdentityRequest.createIdentityRequest(identityApiData),
                copyAttributes = _IdentityRequest.returnCopyAttributes(identityApiData);

            logDebug(InformationMessages.StartingLogEvent + ': logout');
            mParticle.sessionManager.resetSessionTimer();

            if (canLog()) {
                if (!tryNativeSdk(NativeSdkPaths.Logout, JSON.stringify(event))) {
                    sendIdentityRequest(identityApiRequest, 'logout', callback, copyAttributes);
                    evt = createEventObject(MessageType.Profile);
                    evt.ProfileMessageType = ProfileMessageType.Logout;

                    if (forwarders.length) {
                        forwarders.forEach(function(forwarder) {
                            if (forwarder.logOut) {
                                forwarder.logOut(evt);
                            }
                        });
                    }
                }
            }
            else {
                logDebug(InformationMessages.AbandonLogEvent);
            }
        },
        login: function(identityApiData, callback) {
            if (callback && !Validators.isFunction(callback)) {
                logDebug('The optional callback must be a function. You tried entering a ' + typeof fn);
            }

            var identityApiRequest = _IdentityRequest.createIdentityRequest(identityApiData),
                copyAttributes = _IdentityRequest.returnCopyAttributes(identityApiData);

            logDebug(InformationMessages.StartingLogEvent + ': login');
            mParticle.sessionManager.resetSessionTimer();

            if (canLog()) {
                if (!tryNativeSdk(NativeSdkPaths.Login, JSON.stringify(event))) {
                    sendIdentityRequest(identityApiRequest, 'login', callback, copyAttributes);
                }
            }
            else {
                logDebug(InformationMessages.AbandonLogEvent);
            }
        },
        modify: function(identityApiData, callback) {
            if (callback && !Validators.isFunction(callback)) {
                logDebug('The optional callback must be a function. You tried entering a ' + typeof fn);
            }

            mParticle.sessionManager.resetSessionTimer();
            logDebug(InformationMessages.StartingLogEvent + ': modify');

            var identityApiRequest = _IdentityRequest.createModifyIdentityRequest(userIdentities, identityApiData);

            if (canLog()) {
                if (!tryNativeSdk(NativeSdkPaths.Modify, JSON.stringify(event))) {
                    sendIdentityRequest(identityApiRequest, 'modify', callback);
                }
            }
            else {
                logDebug(InformationMessages.AbandonLogEvent);
            }
        },
        // optional callback for when there is an identity update/failure
        setIdentityCallback: function(fn) {
            if (typeof fn !== 'function') {
                logDebug('The IdentityCallback must be a function. You tried entering a ' + typeof fn);
            } else {
                identityCallback = fn;
            }
        },
        getCurrentUser: function() {
            return mParticleUser;
        }
    };

    var mParticleUser = {
        getUserIdentities: function() {
            var currentUserIdentities = {};
            if (Array.isArray(userIdentities)) {
                userIdentities.map(function(identity) {
                    currentUserIdentities[identity.type] = identity.id;
                });
            } else {
                currentUserIdentities = userIdentities;
            }
            return {
                userIdentities: currentUserIdentities
            };
        },
        getMPID: function() {
            return mpid;
        },
        setUserTag: function(tagName) {
            mParticle.sessionManager.resetSessionTimer();

            if (!Validators.isValidKeyValue(tagName)) {
                logDebug(ErrorMessages.BadKey);
                return;
            }

            window.mParticle.Identity.getCurrentUser().setUserAttribute(tagName, null);
        },
        removeUserTag: function(tagName) {
            mParticle.sessionManager.resetSessionTimer();

            if (!Validators.isValidKeyValue(tagName)) {
                logDebug(ErrorMessages.BadKey);
                return;
            }

            window.mParticle.Identity.getCurrentUser().removeUserAttribute(tagName);
        },
        setUserAttribute: function(key, value) {
            mParticle.sessionManager.resetSessionTimer();
            // Logs to cookie
            // And logs to in-memory object
            // Example: mParticle.Identity.getCurrentUser.setUserAttribute('email', 'tbreffni@mparticle.com');
            if (canLog()) {
                if (!Validators.isValidAttributeValue(value)) {
                    logDebug(ErrorMessages.BadAttribute);
                    return;
                }

                if (!Validators.isValidKeyValue(key)) {
                    logDebug(ErrorMessages.BadKey);
                    return;
                }

                var existingProp = findKeyInObject(userAttributes, key);

                if (existingProp) {
                    key = existingProp;
                }

                userAttributes[key] = value;
                persistence.update();

                if (!tryNativeSdk(NativeSdkPaths.SetUserAttribute, JSON.stringify({ key: key, value: value }))) {
                    callSetUserAttributeOnForwarders(key, value);
                }
            }
        },
        removeUserAttribute: function(key) {
            mParticle.sessionManager.resetSessionTimer();

            if (!Validators.isValidKeyValue(key)) {
                logDebug(ErrorMessages.BadKey);
                return;
            }

            var existingProp = findKeyInObject(userAttributes, key);

            if (existingProp) {
                key = existingProp;
            }

            delete userAttributes[key];

            if (!tryNativeSdk(NativeSdkPaths.RemoveUserAttribute, JSON.stringify({ key: key, value: null }))) {
                applyToForwarders('removeUserAttribute', key);
            }

            persistence.update();
        },
        setUserAttributeList: function(key, value) {
            mParticle.sessionManager.resetSessionTimer();

            if (!Validators.isValidKeyValue(key)) {
                logDebug(ErrorMessages.BadKey);
                return;
            }

            if (Array.isArray(value)) {
                var arrayCopy = value.slice();

                var existingProp = findKeyInObject(userAttributes, key);

                if (existingProp) {
                    key = existingProp;
                }

                userAttributes[key] = arrayCopy;
                persistence.update();

                if (!tryNativeSdk(NativeSdkPaths.SetUserAttributeList, JSON.stringify({ key: key, value: arrayCopy }))) {
                    callSetUserAttributeOnForwarders(key, arrayCopy);
                }
            }
        },
        removeAllUserAttributes: function() {
            mParticle.sessionManager.resetSessionTimer();
            if (!tryNativeSdk(NativeSdkPaths.RemoveAllUserAttributes)) {
                if (userAttributes) {
                    for (var prop in userAttributes) {
                        if (userAttributes.hasOwnProperty(prop)) {
                            applyToForwarders('removeUserAttribute', userAttributes[prop]);
                        }
                    }
                }
            }

            userAttributes = {};
            persistence.update();
        },
        getUserAttributesLists: function() {
            var userAttributeLists = {};

            for (var key in userAttributes) {
                if (userAttributes.hasOwnProperty(key) && Array.isArray(userAttributes[key])) {
                    userAttributeLists[key] = userAttributes[key].slice();
                }
            }

            return userAttributeLists;
        },
        getAllUserAttributes: function() {
            var userAttributesCopy = {};

            if (userAttributes) {
                for (var prop in userAttributes) {
                    if (userAttributes.hasOwnProperty(prop)) {
                        if (Array.isArray(userAttributes[prop])) {
                            userAttributesCopy[prop] = userAttributes[prop].slice();
                        }
                        else {
                            userAttributesCopy[prop] = userAttributes[prop];
                        }
                    }
                }
            }

            return userAttributesCopy;
        }
    };

    var persistence = {
        useLocalStorage: function() {
            return (!mParticle.useCookieStorage && persistence.isLocalStorageAvailable);
        },

        isLocalStorageAvailable: null,

        initializeStorage: function() {
            var cookies,
                localStorageData;
            // Check to see if localStorage is available and if not, always use cookies
            this.isLocalStorageAvailable = persistence.determineLocalStorageAvailability();

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
        },

        update: function() {
            if (mParticle.useCookieStorage || !this.isLocalStorageAvailable) {
                this.setCookie();
            } else {
                this.setLocalStorage();
            }
        },

        determineLocalStorageAvailability: function() {
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
        },

        convertInMemoryDataToPersistence: function() {
            var mpidData = {
                sid: sessionId,
                ie: isEnabled,
                sa: sessionAttributes,
                ua: userAttributes,
                ui: userIdentities,
                ss: serverSettings,
                dt: devToken,
                les: dateLastEventSent ? dateLastEventSent.getTime() : null,
                av: appVersion,
                cgid: clientId,
                das: deviceId,
                csd: cookieSyncDates,
                mpid: mpid,
                cp: cartProducts.length <= mParticle.maxProducts ? cartProducts : cartProducts.slice(0, mParticle.maxProducts),
                pb: {},
                c: context
            };

            for (var bag in productsBags) {
                if (productsBags[bag].length > mParticle.maxProducts) {
                    mpidData.pb[bag] = productsBags[bag].slice(0, mParticle.maxProducts);
                } else {
                    mpidData.pb[bag] = productsBags[bag];
                }
            }

            return mpidData;
        },

        setLocalStorage: function() {
            var key = Config.LocalStorageName,
                currentMPIDData = this.convertInMemoryDataToPersistence(),
                localStorageData = this.getLocalStorage() || {};
            if (sessionId) {
                localStorageData.currentSessionMPIDs = currentSessionMPIDs;
            }

            if (mpid) {
                localStorageData[mpid] = currentMPIDData;
                localStorageData.currentUserMPID = mpid;
            }

            try {
                window.localStorage.setItem(encodeURIComponent(key), encodeURIComponent(JSON.stringify(localStorageData)));
            }
            catch (e) {
                logDebug('Error with setting localStorage item.');
            }
        },

        getLocalStorage: function() {
            var key = Config.LocalStorageName,
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
        },

        removeLocalStorage: function() {
            localStorage.removeItem(DefaultConfig.LocalStorageName);
        },

        storeDataInMemory: function(result, newMPID) {
            var obj;

            try {
                obj = typeof result === 'string' ? JSON.parse(result) : result;

                if (!obj) {
                    clientId = generateUniqueId();
                    logDebug(InformationMessages.CookieNotFound);
                } else {
                    // Set MPID first, then change object to match MPID data
                    if (newMPID) {
                        mpid = newMPID;
                    } else {
                        mpid = obj.currentUserMPID || null;
                    }

                    currentSessionMPIDs = obj.currentSessionMPIDs || [];

                    obj = obj.currentUserMPID ? obj[obj.currentUserMPID] : obj;

                    // Longer names are for backwards compatibility
                    sessionId = obj.sid || obj.SessionId || sessionId;
                    isEnabled = (typeof obj.ie !== 'undefined') ? obj.ie : obj.IsEnabled;
                    sessionAttributes = obj.sa || obj.SessionAttributes || sessionAttributes;
                    userAttributes = obj.ua || obj.UserAttributes || userAttributes;
                    userIdentities = obj.ui || obj.UserIdentities || userIdentities;

                    // Migrate from v1 where userIdentities was an array to v2 where it is an object
                    if (Array.isArray(userIdentities)) {
                        var arrayToObjectUIMigration = {};
                        userIdentities = userIdentities.filter(function(ui) {
                            return ui.hasOwnProperty('Identity') && (typeof(ui.Identity) === 'string' || typeof(ui.Identity) === 'number');
                        });
                        userIdentities.forEach(function(identity) {
                            arrayToObjectUIMigration[identity.Type] = identity.Identity;
                        });

                        userIdentities = arrayToObjectUIMigration;
                    }

                    serverSettings = obj.ss || obj.ServerSettings || serverSettings;
                    devToken = obj.dt || obj.DeveloperToken || devToken;
                    clientId = obj.cgid || generateUniqueId();
                    deviceId = obj.das || null;
                    cartProducts = obj.cp || [];
                    productsBags = obj.pb || {};
                    context = obj.c || '';

                    if (obj.les) {
                        dateLastEventSent = new Date(obj.les);
                    }
                    else if (obj.LastEventSent) {
                        dateLastEventSent = new Date(obj.LastEventSent);
                    }
                    if (obj.csd) {
                        cookieSyncDates = obj.csd;
                    }
                }
                if (isEnabled !== false || isEnabled !== true) {
                    isEnabled = true;
                }
            }
            catch (e) {
                logDebug(ErrorMessages.CookieParseError);
            }
        },

        retrieveDeviceId: function() {
            if (deviceId) {
                return deviceId;
            } else {
                return this.parseDeviceId(serverSettings);
            }
        },

        parseDeviceId: function(serverSettings) {
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

                return generateUniqueId();
            }
            catch (e) {
                return generateUniqueId();
            }
        },

        expireCookies: function() {
            var date = new Date(),
                expires;

            date.setTime(date.getTime() - (24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
            document.cookie = DefaultConfig.CookieName + '=' + '' + expires + '; path=/';
        },

        getCookie: function() {
            var cookies = window.document.cookie.split('; '),
                key = Config.CookieName,
                i,
                l,
                parts,
                name,
                cookie,
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
                return result;
            } else {
                return null;
            }
        },

        setCookie: function() {
            var date = new Date(),
                key = Config.CookieName,
                currentMPIDData = this.convertInMemoryDataToPersistence(),
                expires = new Date(date.getTime() +
                    (Config.CookieExpiration * 24 * 60 * 60 * 1000)).toGMTString(),
                domain = Config.CookieDomain ? ';domain=' + Config.CookieDomain : '',
                cookies = JSON.parse(this.getCookie()) || {};

            if (sessionId) {
                cookies.currentSessionMPIDs = currentSessionMPIDs;
            }

            if (mpid) {
                cookies[mpid] = currentMPIDData;
                cookies.currentUserMPID = mpid;
            }

            logDebug(InformationMessages.CookieSet);

            window.document.cookie =
                encodeURIComponent(key) + '=' + encodeURIComponent(JSON.stringify(cookies)) +
                ';expires=' + expires +
                ';path=/' +
                domain;
        }
    };

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

    function send(event) {
        var xhr,
            xhrCallback = function() {
                if (xhr.readyState === 4) {
                    logDebug('Received ' + xhr.statusText + ' from server');

                    parseResponse(xhr.responseText);
                }
            };

        logDebug(InformationMessages.SendBegin);

        // When MPID = 0, identity request is in flight and has not returned an MPID yet
        if (mpid === 0) {
            eventQueue.push(event);
        } else {
            if (!event) {
                logDebug(ErrorMessages.EventEmpty);
                return;
            }

            if (!tryNativeSdk(NativeSdkPaths.LogEvent, JSON.stringify(event))) {
                logDebug(InformationMessages.SendHttp);

                xhr = createXHR(xhrCallback);

                if (xhr) {
                    try {
                        xhr.open('post', createServiceUrl('v2') + '/Events');
                        xhr.send(JSON.stringify(convertEventToDTO(event)));

                        if (event.EventName !== MessageType.AppStateTransition) {
                            sendEventToForwarders(event);
                        }
                    }
                    catch (e) {
                        logDebug('Error sending event to mParticle servers. ' + e);
                    }
                }
            }
        }
    }

    function sendForwardingStats(forwarder, event) {
        var xhr,
            forwardingStat;

        if (forwarder && forwarder.isVisible) {
            xhr = createXHR();
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
                    xhr.open('post', createServiceUrl('v1') + '/Forwarding');
                    xhr.send(forwardingStat);
                }
                catch (e) {
                    logDebug('Error sending forwarding stats to mParticle servers.');
                }
            }
        }
    }

    function applyToForwarders(functionName, functionArgs) {
        if (forwarders.length) {
            forwarders.forEach(function(forwarder) {
                var forwarderFunction = forwarder[functionName];
                if (forwarderFunction) {
                    try {
                        var result = forwarder[functionName](forwarder, functionArgs);

                        if (result) {
                            logDebug(result);
                        }
                    }
                    catch (e) {
                        logDebug(e);
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
                            hash = generateHash(attrName);

                            if (inArray(filterList, hash)) {
                                delete event.UserAttributes[attrName];
                            }
                        }
                    }
                }
            },
            filterUserIdentities = function(event, filterList) {
                if (event.UserIdentities && event.UserIdentities.length) {
                    event.UserIdentities.forEach(function(userIdentity, i) {
                        if (inArray(filterList, userIdentity.Type)) {
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
                        hash = generateHash(event.EventCategory + event.EventName + attrName);

                        if (inArray(filterList, hash)) {
                            delete event.EventAttributes[attrName];
                        }
                    }
                }
            },
            inFilteredList = function(filterList, hash) {
                if (filterList && filterList.length) {
                    if (inArray(filterList, hash)) {
                        return true;
                    }
                }

                return false;
            },
            forwardingRuleMessageTypes = [
                MessageType.PageEvent,
                MessageType.PageView,
                MessageType.Commerce
            ];

        if (!isWebViewEmbedded() && forwarders) {
            hashedName = generateHash(event.EventCategory + event.EventName);
            hashedType = generateHash(event.EventCategory);

            for (var i = 0; i < forwarders.length; i++) {
                // Check attribute forwarding rule. This rule allows users to only forward an event if a
                // specific attribute exists and has a specific value. Alternatively, they can specify
                // that an event not be forwarded if the specified attribute name and value exists.
                // The two cases are controlled by the "includeOnMatch" boolean value.
                // Supported message types for attribute forwarding rules are defined in the forwardingRuleMessageTypes array

                if (forwardingRuleMessageTypes.indexOf(event.EventDataType) > -1
                    && forwarders[i].filteringEventAttributeValue
                    && forwarders[i].filteringEventAttributeValue.eventAttributeName
                    && forwarders[i].filteringEventAttributeValue.eventAttributeValue) {

                    var foundProp = null;

                    // Attempt to find the attribute in the collection of event attributes
                    if (event.EventAttributes) {
                        for (var prop in event.EventAttributes) {
                            hashedName = generateHash(prop);

                            if (hashedName === forwarders[i].filteringEventAttributeValue.eventAttributeName) {
                                foundProp = {
                                    name: hashedName,
                                    value: generateHash(event.EventAttributes[prop])
                                };
                            }

                            break;
                        }
                    }

                    var isMatch = foundProp !== null && foundProp.value === forwarders[i].filteringEventAttributeValue.eventAttributeValue;

                    var shouldInclude = forwarders[i].filteringEventAttributeValue.includeOnMatch === true ? isMatch : !isMatch;

                    if (!shouldInclude) {
                        continue;
                    }
                }

                // Clone the event object, as we could be sending different attributes to each forwarder
                clonedEvent = {};
                clonedEvent = extend(true, clonedEvent, event);

                // Check event filtering rules
                if (event.EventDataType === MessageType.PageEvent
                    && (inFilteredList(forwarders[i].eventNameFilters, hashedName)
                        || inFilteredList(forwarders[i].eventTypeFilters, hashedType))) {
                    continue;
                }
                else if (event.EventDataType === MessageType.Commerce && inFilteredList(forwarders[i].eventTypeFilters, hashedType)) {
                    continue;
                }
                else if (event.EventDataType === MessageType.PageView && inFilteredList(forwarders[i].pageViewFilters, hashedName)) {
                    continue;
                }

                // Check attribute filtering rules
                if (clonedEvent.EventAttributes) {
                    if (event.EventDataType === MessageType.PageEvent) {
                        filterAttributes(clonedEvent, forwarders[i].attributeFilters);
                    }
                    else if (event.EventDataType === MessageType.PageView) {
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
            forwarders.sort(function(x, y) {
                x.settings.PriorityValue = x.settings.PriorityValue || 0;
                y.settings.PriorityValue = y.settings.PriorityValue || 0;
                return -1 * (x.settings.PriorityValue - y.settings.PriorityValue);
            });

            forwarders.forEach(function(forwarder) {
                forwarder.init(forwarder.settings,
                    sendForwardingStats,
                    false,
                    null,
                    userAttributes,
                    userIdentities,
                    appVersion,
                    appName,
                    customFlags,
                    clientId);
            });
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

                if (!serverSettings) {
                    serverSettings = {};
                }

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

                persistence.update();
            }
        }
        catch (e) {
            logDebug('Error parsing JSON response from server: ' + e.name);
        }
    }

    function startTracking() {
        if (!isTracking) {
            if ('geolocation' in navigator) {
                watchPositionId = navigator.geolocation.watchPosition(function(position) {
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

    function convertEventToDTO(event) {
        var validUserIdentities;
        if (event.UserIdentities.length) {
            validUserIdentities = event.UserIdentities.map(function(userIdentity) {
                if (!IdentityType.isValid(userIdentity.Type)) {
                    logDebug('IdentityType is not valid. Please ensure you are using a valid IdentityType from http://docs.mparticle.com/#user-identity');
                } else {
                    return userIdentity;
                }
            });
        }

        var dto = {
            n: event.EventName,
            et: event.EventCategory,
            ua: event.UserAttributes,
            sa: event.SessionAttributes,
            ui: validUserIdentities,
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

        dto.pb = convertProductBagToDTO();

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

    function parseNumber(value) {
        if (isNaN(value) || !isFinite(value)) {
            return 0;
        }
        var floatValue = parseFloat(value);
        return isNaN(floatValue) ? 0 : floatValue;
    }

    function convertProductBagToDTO() {
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

    function convertTransactionAttributesToProductAction(transactionAttributes, productAction) {
        productAction.TransactionId = transactionAttributes.Id;
        productAction.Affiliation = transactionAttributes.Affiliation;
        productAction.CouponCode = transactionAttributes.CouponCode;
        productAction.TotalAmount = transactionAttributes.Revenue;
        productAction.ShippingAmount = transactionAttributes.Shipping;
        productAction.TaxAmount = transactionAttributes.Tax;
    }

    function createEventObject(messageType, name, data, eventType, customFlags) {
        var eventObject,
            optOut = (messageType === MessageType.OptOut ? !isEnabled : null);

        if (sessionId || messageType == MessageType.OptOut) {
            if (messageType !== MessageType.SessionEnd) {
                dateLastEventSent = new Date();
            }
            eventObject = {
                EventName: name || messageType,
                EventCategory: eventType,
                UserAttributes: userAttributes,
                SessionAttributes: sessionAttributes,
                UserIdentities: userIdentities,
                Store: serverSettings,
                EventAttributes: data,
                SDKVersion: sdkVersion,
                SessionId: sessionId,
                EventDataType: messageType,
                Debug: mParticle.isDevelopmentMode,
                Location: currentPosition,
                OptOut: optOut,
                ProductBags: productsBags,
                ExpandedEventCount: 0,
                CustomFlags: customFlags,
                AppVersion: appVersion,
                ClientGeneratedId: clientId,
                DeviceId: deviceId,
                MPID: mpid
            };

            if (messageType === MessageType.SessionEnd) {
                eventObject.SessionLength = new Date().getTime() - dateLastEventSent.getTime();
                eventObject.currentSessionMPIDs = currentSessionMPIDs;
                currentSessionMPIDs = [];
            }

            eventObject.Timestamp = dateLastEventSent.getTime();

            return eventObject;
        }

        return null;
    }

    function getProductActionEventName(productActionType) {
        switch (productActionType) {
            case ProductActionType.AddToCart:
                return 'AddToCart';
            case ProductActionType.AddToWishlist:
                return 'AddToWishlist';
            case ProductActionType.Checkout:
                return 'Checkout';
            case ProductActionType.Click:
                return 'Click';
            case ProductActionType.Purchase:
                return 'Purchase';
            case ProductActionType.Refund:
                return 'Refund';
            case ProductActionType.RemoveFromCart:
                return 'RemoveFromCart';
            case ProductActionType.RemoveFromWishlist:
                return 'RemoveFromWishlist';
            case ProductActionType.ViewDetail:
                return 'ViewDetail';
            case ProductActionType.Unknown:
            default:
                return 'Unknown';
        }
    }

    function getPromotionActionEventName(promotionActionType) {
        switch (promotionActionType) {
            case PromotionActionType.PromotionClick:
                return 'PromotionClick';
            case PromotionActionType.PromotionView:
                return 'PromotionView';
            default:
                return 'Unknown';
        }
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

    function expandProductAction(commerceEvent) {
        var appEvents = [];
        if (!commerceEvent.ProductAction) {
            return appEvents;
        }
        var shouldExtractActionAttributes = false;
        if (commerceEvent.ProductAction.ProductActionType === ProductActionType.Purchase ||
            commerceEvent.ProductAction.ProductActionType === ProductActionType.Refund) {
            var attributes = extend(false, {}, commerceEvent.EventAttributes);
            extractActionAttributes(attributes, commerceEvent.ProductAction);
            if (commerceEvent.CurrencyCode) {
                attributes['Currency Code'] = commerceEvent.CurrencyCode;
            }
            var plusOneEvent = createEventObject(MessageType.PageEvent,
                generateExpandedEcommerceName(ProductActionType.getExpansionName(commerceEvent.ProductAction.ProductActionType), true),
                attributes,
                EventType.Transaction
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
            var attributes = extend(false, commerceEvent.EventAttributes, product.Attributes);
            if (shouldExtractActionAttributes) {
                extractActionAttributes(attributes, commerceEvent.ProductAction);
            }
            else {
                extractTransactionId(attributes, commerceEvent.ProductAction);
            }
            extractProductAttributes(attributes, product);

            var productEvent = createEventObject(MessageType.PageEvent,
                generateExpandedEcommerceName(ProductActionType.getExpansionName(commerceEvent.ProductAction.ProductActionType)),
                attributes,
                EventType.Transaction
            );
            appEvents.push(productEvent);
        });

        return appEvents;
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

    function expandPromotionAction(commerceEvent) {
        var appEvents = [];
        if (!commerceEvent.PromotionAction) {
            return appEvents;
        }
        var promotions = commerceEvent.PromotionAction.PromotionList;
        promotions.forEach(function(promotion) {
            var attributes = extend(false, {}, commerceEvent.EventAttributes);
            extractPromotionAttributes(attributes, promotion);

            var appEvent = createEventObject(MessageType.PageEvent,
                    generateExpandedEcommerceName(PromotionActionType.getExpansionName(commerceEvent.PromotionAction.PromotionActionType)),
                    attributes,
                    EventType.Transaction
                );
            appEvents.push(appEvent);
        });
        return appEvents;
    }

    function generateExpandedEcommerceName(eventName, plusOne) {
        return 'eCommerce - ' + eventName + ' - ' + (plusOne ? 'Total' : 'Item');
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

    function expandProductImpression(commerceEvent) {
        var appEvents = [];
        if (!commerceEvent.ProductImpressions) {
            return appEvents;
        }
        commerceEvent.ProductImpressions.forEach(function(productImpression) {
            if (productImpression.ProductList) {
                productImpression.ProductList.forEach(function(product) {
                    var attributes = extend(false, {}, commerceEvent.EventAttributes);
                    if (product.Attributes) {
                        for (var attribute in product.Attributes) {
                            attributes[attribute] = product.Attributes[attribute];
                        }
                    }
                    extractProductAttributes(attributes, product);
                    if (productImpression.ProductImpressionList) {
                        attributes['Product Impression List'] = productImpression.ProductImpressionList;
                    }
                    var appEvent = createEventObject(MessageType.PageEvent,
                            generateExpandedEcommerceName('Impression'),
                            attributes,
                            EventType.Transaction
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

    function createCommerceEventObject() {
        var baseEvent;

        logDebug(InformationMessages.StartingLogCommerceEvent);

        if (canLog()) {

            baseEvent = createEventObject(MessageType.Commerce);
            baseEvent.EventName = 'eCommerce - ';
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
    }

    function logCheckoutEvent(step, options, attrs) {
        var event = createCommerceEventObject();

        if (event) {
            event.EventName += getProductActionEventName(ProductActionType.Checkout);
            event.EventCategory = CommerceEventType.ProductCheckout;
            event.ProductAction = {
                ProductActionType: ProductActionType.Checkout,
                CheckoutStep: step,
                CheckoutOptions: options,
                ProductList: event.ShoppingCart.ProductList
            };

            logCommerceEvent(event, attrs);
        }
    }

    function logProductActionEvent(productActionType, product, attrs) {
        var event = createCommerceEventObject();

        if (event) {
            event.EventCategory = convertProductActionToEventType(productActionType);
            event.EventName += getProductActionEventName(productActionType);
            event.ProductAction = {
                ProductActionType: productActionType,
                ProductList: Array.isArray(product) ? product : [product]
            };

            logCommerceEvent(event, attrs);
        }
    }

    function logPurchaseEvent(transactionAttributes, product, attrs) {
        var event = createCommerceEventObject();

        if (event) {
            event.EventName += getProductActionEventName(ProductActionType.Purchase);
            event.EventCategory = CommerceEventType.ProductPurchase;
            event.ProductAction = {
                ProductActionType: ProductActionType.Purchase
            };
            event.ProductAction.ProductList = buildProductList(event, product);

            convertTransactionAttributesToProductAction(transactionAttributes, event.ProductAction);

            logCommerceEvent(event, attrs);
        }
    }

    function logRefundEvent(transactionAttributes, product, attrs) {
        if (!transactionAttributes) {
            logDebug(ErrorMessages.TransactionRequired);
            return;
        }

        var event = createCommerceEventObject();

        if (event) {
            event.EventName += getProductActionEventName(ProductActionType.Refund);
            event.EventCategory = CommerceEventType.ProductRefund;
            event.ProductAction = {
                ProductActionType: ProductActionType.Refund
            };
            event.ProductAction.ProductList = buildProductList(event, product);

            convertTransactionAttributesToProductAction(transactionAttributes, event.ProductAction);

            logCommerceEvent(event, attrs);
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

    function logPromotionEvent(promotionType, promotion, attrs) {
        var event = createCommerceEventObject();

        if (event) {
            event.EventName += getPromotionActionEventName(promotionType);
            event.EventCategory = convertPromotionActionToEventType(promotionType);
            event.PromotionAction = {
                PromotionActionType: promotionType,
                PromotionList: [promotion]
            };

            logCommerceEvent(event, attrs);
        }
    }

    function logImpressionEvent(impression, attrs) {
        var event = createCommerceEventObject();

        if (event) {
            event.EventName += 'Impression';
            event.EventCategory = CommerceEventType.ProductImpression;
            event.ProductImpressions = [{
                ProductImpressionList: impression.Name,
                ProductList: [impression.Product]
            }];

            logCommerceEvent(event, attrs);
        }
    }

    function logOptOut() {
        logDebug(InformationMessages.StartingLogOptOut);

        send(createEventObject(MessageType.OptOut, null, null, EventType.Other));
    }

    function logAST() {
        logEvent(MessageType.AppStateTransition);
    }

    function logEvent(type, name, data, category, cflags) {
        logDebug(InformationMessages.StartingLogEvent + ': ' + name);

        if (canLog()) {
            if (!sessionId) {
                mParticle.startNewSession();
            }

            if (data) {
                data = sanitizeAttributes(data);
            }

            send(createEventObject(type, name, data, category, cflags));
            persistence.update();
        }
        else {
            logDebug(InformationMessages.AbandonLogEvent);
        }
    }

    function logCommerceEvent(commerceEvent, attrs) {
        logDebug(InformationMessages.StartingLogCommerceEvent);

        if (canLog()) {
            if (isWebViewEmbedded()) {
                // Don't send shopping cart or product bags to parent sdks
                commerceEvent.ShoppingCart = {};
                commerceEvent.ProductBags = {};
            }

            if (attrs) {
                commerceEvent.EventAttributes = attrs;
            }

            send(commerceEvent);
            persistence.update();
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

    function logDebug(msg) {
        if (mParticle.isDevelopmentMode && window.console && window.console.log) {
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
        var objType = Object.prototype.toString.call(value);

        return objType === '[object Object]'
            || objType === '[object Error]';
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

                logDebug('DOM event triggered, handling event');

                logEvent(MessageType.PageEvent,
                    typeof eventName === 'function' ? eventName(element) : eventName,
                    typeof data === 'function' ? data(element) : data,
                    eventType || EventType.Other);

                // TODO: Handle middle-clicks and special keys (ctrl, alt, etc)
                if ((element.href && element.target !== '_blank') || element.submit) {
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

        if (elements.length) {
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
            logDebug('Name is required when creating a product');
            return null;
        }

        if (!Validators.isStringOrNumber(sku)) {
            logDebug('SKU is required when creating a product, and must be a string or a number');
            return null;
        }

        if (!Validators.isStringOrNumber(price)) {
            logDebug('Price is required when creating a product, and must be a string or a number');
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
            logDebug(ErrorMessages.PromotionIdRequired);
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
            logDebug('Name is required when creating an impression.');
            return null;
        }

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

        if (!Validators.isStringOrNumber(id)) {
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

    function callSetUserAttributeOnForwarders(key, value) {
        if (forwarders.length) {
            forwarders.forEach(function(forwarder) {
                if (forwarder.setUserAttribute &&
                    forwarder.userAttributeFilters &&
                    !inArray(forwarder.userAttributeFilters, generateHash(key))) {

                    try {
                        var result = forwarder.setUserAttribute(key, value);

                        if (result) {
                            logDebug(result);
                        }
                    }
                    catch (e) {
                        logDebug(e);
                    }
                }
            });
        }
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
        Media: 9
    };

    var ProfileMessageType = {
        Logout: 3
    };

    var ApplicationTransitionType = {
        AppInit: 1
    };

    EventType.getName = function(id) {
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

    var _Identity = {
        checkIdentitySwap: function(previousMPID, currentMPID) {
            if (previousMPID && currentMPID && previousMPID !== currentMPID) {
                var cookies = (persistence.isLocalStorageAvailable && !mParticle.useCookieStorage) ? persistence.getLocalStorage() : persistence.getCookie();
                persistence.storeDataInMemory(cookies, currentMPID);
                persistence.update();
            }
        },
        migrate: function(isFirstRun) {
            var cookies = persistence.useLocalStorage ? persistence.getLocalStorage() : JSON.parse(persistence.getCookie());
            // migration occurs when it is not the first run and there is no currentUserMPID on the cookie
            if (!isFirstRun && cookies && !cookies.currentUserMPID) {
                if (persistence.useLocalStorage) {
                    persistence.removeLocalStorage();
                } else {
                    persistence.expireCookies();
                }
                persistence.update();
            }
        }
    };

    var DefaultConfig = {
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

    var Config = {};

    var ErrorMessages = {
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
    };

    var InformationMessages = {
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
    };

    var NativeSdkPaths = {
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
                return 'add_to_cart';
            case ProductActionType.RemoveFromCart:
                return 'remove_from_cart';
            case ProductActionType.Checkout:
                return 'checkout';
            case ProductActionType.CheckoutOption:
                return 'checkout_option';
            case ProductActionType.Click:
                return 'click';
            case ProductActionType.ViewDetail:
                return 'view_detail';
            case ProductActionType.Purchase:
                return 'purchase';
            case ProductActionType.Refund:
                return 'refund';
            case ProductActionType.AddToWishlist:
                return 'add_to_wishlist';
            case ProductActionType.RemoveFromWishlist:
                return 'remove_from_wishlist';
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

    var cookieSyncManager = {
        attemptCookieSync: function(previousMPID, mpid) {
            var pixelConfig, lastSyncDateForModule, url, redirect, urlWithRedirect;
            if (mpid && !isWebViewEmbedded()) {
                pixelConfigurations.forEach(function(pixelSettings) {
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
                        lastSyncDateForModule = cookieSyncDates[(pixelConfig.moduleId).toString()] ? cookieSyncDates[(pixelConfig.moduleId).toString()] : null;

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

            logDebug(InformationMessages.CookieSync);

            img.src = url;
            cookieSyncDates[moduleId.toString()] = (new Date()).getTime();
            persistence.update();
        },

        replaceMPID: function(string, mpid) {
            return string.replace('%%mpid%%', mpid);
        },

        replaceAmp: function(string) {
            return string.replace(/&amp;/g, '&');
        }
    };

    var Validators = {
        // Null can be a valid attribute while undefined cannot
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
            return typeof fn !== 'function';
        },

        validateOptions: function(options) {
            if (options) {
                if (options.apiKey) {
                    devToken = options.apiKey;
                } else {
                    return {
                        valid: false,
                        error: 'The options object requires the key, \'apiKey\''
                    };
                }
                if (options.initialIdentity) {
                    if (options.initialIdentity.userIdentities) {
                        for (var key in options.initialIdentity.userIdentities) {
                            // test key for if it is a non number string, and keys that are stringified numbers must be passed to IdentityType.isValid as a number
                            if (isNaN(key) || !IdentityType.isValid(parseFloat(key))) {
                                return {
                                    valid: false,
                                    error: 'IdentityType key on initialIdentity is not valid. Please ensure you are using a valid IdentityType from http://docs.mparticle.com/#user-identity'
                                };
                            }
                        }
                    } else {
                        return {
                            valid: false,
                            error: 'When including an `initialIdentity` object within options, a `userIdentities` object within `initialIdentity` containing keys from http://docs.mparticle.com/#user-identity and the associated ID as the value is required.'
                        };
                    }
                    if (!options.initialIdentity.hasOwnProperty('copyUserAttributes')) {
                        return {
                            valid: true,
                            warning: 'Warning: By default, user attributes will not be copied when a new identity is returned. If you\'d like user attributes to be copied, include `copyUserAttributes = true` on the initialIdentity object'
                        };
                    }
                }

                return {
                    valid: true
                };
            }
            else {
                logDebug('Initializiation failed. You must pass an options object into mParticle.init()');
                return;
            }
        }
    };

    var sessionManager = {
        initialize: function() {
            if (sessionId) {
                var sessionTimeoutInSeconds = Config.SessionTimeout * 60000;

                if (new Date() > new Date(dateLastEventSent.getTime() + sessionTimeoutInSeconds)) {
                    this.endSession();
                    this.startNewSession();
                }
            } else {
                this.startNewSession();
            }
        },
        getSession: function() {
            return sessionId;
        },
        startNewSession: function() {
            logDebug(InformationMessages.StartingNewSession);

            if (canLog()) {
                sessionId = generateUniqueId();

                if (!dateLastEventSent) {
                    dateLastEventSent = new Date();
                }

                mParticle.sessionManager.setSessionTimer();

                logEvent(MessageType.SessionStart);
            }
            else {
                logDebug(InformationMessages.AbandonStartSession);
            }
        },
        endSession: function() {
            logDebug(InformationMessages.StartingEndSession);

            if (canLog()) {
                if (!sessionId) {
                    logDebug(InformationMessages.NoSessionToEnd);
                    return;
                }

                logEvent(MessageType.SessionEnd);

                sessionId = null;
                dateLastEventSent = null;
                sessionAttributes = {};
                persistence.update();
            }
            else {
                logDebug(InformationMessages.AbandonEndSession);
            }
        },
        setSessionTimer: function() {
            var sessionTimeoutInSeconds = Config.SessionTimeout * 60000;

            globalTimer = window.setTimeout(function() {
                mParticle.sessionManager.endSession();
            }, sessionTimeoutInSeconds);
        },

        resetSessionTimer: function() {
            if (!sessionId) {
                this.startNewSession();
            }
            this.clearSessionTimeout();
            this.setSessionTimer();
        },

        clearSessionTimeout: function() {
            clearTimeout(globalTimer);
        }
    };

    function getDeviceId() {
        return deviceId;
    }

    var mParticle = {
        useNativeSdk: true,
        isIOS: false,
        isDevelopmentMode: false,
        useCookieStorage: false,
        maxProducts: DefaultConfig.MaxProducts,
        getDeviceId: getDeviceId,
        generateHash: generateHash,
        sessionManager: sessionManager,
        cookieSyncManager: cookieSyncManager,
        persistence: persistence,
        Identity: IdentityAPI,
        Validators: Validators,
        _Identity: _Identity,
        _IdentityRequest: _IdentityRequest,
        IdentityType: IdentityType,
        EventType: EventType,
        CommerceEventType: CommerceEventType,
        PromotionType: PromotionActionType,
        ProductActionType: ProductActionType,
        init: function(options) {
            var config,
                initialIdentity,
                validatedOptions = Validators.validateOptions(options);

            if (validatedOptions) {
                if (!validatedOptions.valid) {
                    logDebug(validatedOptions.error);
                } else if (validatedOptions.warning) {
                    logDebug(validatedOptions.warning);
                }
                devToken = options.apiKey || null;
            }

            logDebug(InformationMessages.StartingInitialization);

            // Set configuration to default settings
            mergeConfig({});
            // Determine if there is any data in cookies or localStorage to figure out if it is the first time the browser is loading mParticle
            if (!persistence.getCookie() && !persistence.getLocalStorage()) {
                isFirstRun = true;
            } else {
                isFirstRun = false;
            }
            initialIdentity = options ? options.initialIdentity : Object.keys(userIdentities).length ? userIdentities : null;
            // Load any settings/identities/attributes from cookie or localStorage
            persistence.initializeStorage();

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
            _Identity.migrate(isFirstRun);
            identify(initialIdentity);

            deviceId = persistence.retrieveDeviceId();

            initForwarders();

            if (options && options.config) {
                config = options.config;
                mergeConfig(config);
            }

            mParticle.sessionManager.initialize();
            // Call any functions that are waiting for the library to be initialized
            if (readyQueue && readyQueue.length) {
                readyQueue.forEach(function(readyQueueItem) {
                    if (typeof readyQueueItem === 'function') {
                        readyQueueItem();
                    }
                });

                readyQueue = [];
            }

            logAST();
            persistence.update();
            isInitialized = true;
        },
        reset: function() {
            // Completely resets the state of the SDK. mParticle.init() will need to be called again.
            isEnabled = true;
            isFirstRun = null;
            stopTracking();
            devToken = null;
            sessionId = null;
            appName = null;
            appVersion = null;
            currentSessionMPIDs = [],
            eventQueue = [];
            identityCallback = null,
            context = null,
            sessionAttributes = {};
            userAttributes = {};
            userIdentities = [];
            cookieSyncDates = {};
            forwarders = [];
            forwarderConstructors = [];
            pixelConfigurations = [];
            productsBags = {};
            cartProducts = [];
            serverSettings = null;
            mergeConfig({});
            persistence.update();
            mParticle.sessionManager.resetSessionTimer();

            isInitialized = false;
        },
        ready: function(f) {
            if (isInitialized && typeof f === 'function') {
                f();
            }
            else {
                readyQueue.push(f);
            }
        },
        getVersion: function() {
            return sdkVersion;
        },
        setAppVersion: function(version) {
            appVersion = version;
            persistence.update();
        },
        getAppName: function() {
            return appName;
        },
        setAppName: function(name) {
            appName = name;
        },
        getAppVersion: function() {
            return appVersion;
        },
        stopTrackingLocation: function() {
            mParticle.sessionManager.resetSessionTimer();
            stopTracking();
        },
        startTrackingLocation: function() {
            mParticle.sessionManager.resetSessionTimer();
            startTracking();
        },
        setPosition: function(lat, lng) {
            mParticle.sessionManager.resetSessionTimer();
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
        startNewSession: function() {
            sessionManager.startNewSession();
        },
        endSession: function() {
            sessionManager.endSession();
        },
        logEvent: function(eventName, eventType, eventInfo, customFlags) {
            mParticle.sessionManager.resetSessionTimer();
            if (typeof (eventName) !== 'string') {
                logDebug(ErrorMessages.EventNameInvalidType);
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

            logEvent(MessageType.PageEvent, eventName, eventInfo, eventType, customFlags);
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

            logEvent(MessageType.CrashReport,
                error.name ? error.name : 'Error',
                {
                    m: error.message ? error.message : error,
                    s: 'Error',
                    t: error.stack
                },
                EventType.Other);
        },
        logLink: function(selector, eventName, eventType, eventInfo) {
            mParticle.sessionManager.resetSessionTimer();
            addEventHandler('click', selector, eventName, eventInfo, eventType);
        },
        logForm: function(selector, eventName, eventType, eventInfo) {
            mParticle.sessionManager.resetSessionTimer();
            addEventHandler('submit', selector, eventName, eventInfo, eventType);
        },
        logPageView: function() {
            mParticle.sessionManager.resetSessionTimer();
            var eventName = null,
                attrs = null,
                flags = null;

            if (canLog()) {
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

                logEvent(MessageType.PageView, eventName, attrs, EventType.Unknown, flags);
            }
        },
        eCommerce: {
            ProductBags: {
                add: function(productBagName, product) {
                    if (!Validators.isStringOrNumber(productBagName)) {
                        logDebug('ProductBagName is required and must be a string or number');
                        return;
                    }
                    mParticle.sessionManager.resetSessionTimer();
                    if (!productsBags[productBagName]) {
                        productsBags[productBagName] = [];
                    }

                    productsBags[productBagName].push(product);

                    if (productsBags[productBagName].length > mParticle.maxProducts) {
                        logDebug(productBagName + ' contains ' + productsBags[productBagName].length + ' items. Only mParticle.maxProducts = ' + mParticle.maxProducts + ' can currently be saved in cookies.');
                    }
                    persistence.update();

                    tryNativeSdk(NativeSdkPaths.AddToProductBag, JSON.stringify(product));
                },
                remove: function(productBagName, product) {
                    mParticle.sessionManager.resetSessionTimer();
                    var productIndex = -1;

                    if (productsBags[productBagName]) {
                        productsBags[productBagName].forEach(function(productBagItem, i) {
                            if (productBagItem.sku === product.sku) {
                                productIndex = i;
                            }
                        });

                        if (productIndex > -1) {
                            productsBags[productBagName].splice(productIndex, 1);
                        }
                        persistence.update();
                    }
                    tryNativeSdk(NativeSdkPaths.RemoveFromProductBag, JSON.stringify(product));
                },
                clear: function(productBagName) {
                    mParticle.sessionManager.resetSessionTimer();
                    productsBags[productBagName] = [];
                    persistence.update();

                    tryNativeSdk(NativeSdkPaths.ClearProductBag, productBagName);
                }
            },
            Cart: {
                add: function(product, logEvent) {
                    mParticle.sessionManager.resetSessionTimer();
                    var arrayCopy;

                    arrayCopy = Array.isArray(product) ? product.slice() : [product];

                    cartProducts = cartProducts.concat(arrayCopy);

                    if (cartProducts.length > mParticle.maxProducts) {
                        logDebug('The cart contains ' + cartProducts.length + ' items. Only mParticle.maxProducts = ' + mParticle.maxProducts + ' can currently be saved in cookies.');
                    }

                    if (isWebViewEmbedded()) {
                        tryNativeSdk(NativeSdkPaths.AddToCart, JSON.stringify(arrayCopy));
                    }
                    else if (logEvent === true) {
                        logProductActionEvent(ProductActionType.AddToCart, arrayCopy);
                    }
                    persistence.update();
                },
                remove: function(product, logEvent) {
                    mParticle.sessionManager.resetSessionTimer();
                    var cartIndex = -1,
                        cartItem = null;

                    if (cartProducts) {
                        cartProducts.forEach(function(cartProduct, i) {
                            if (cartProduct.Sku === product.Sku) {
                                cartIndex = i;
                                cartItem = cartProduct;
                            }
                        });

                        if (cartIndex > -1) {
                            cartProducts.splice(cartIndex, 1);

                            if (isWebViewEmbedded()) {
                                tryNativeSdk(NativeSdkPaths.RemoveFromCart, JSON.stringify(cartItem));
                            }
                            else if (logEvent === true) {
                                logProductActionEvent(ProductActionType.RemoveFromCart, cartItem);
                            }
                        }
                    }
                    persistence.update();
                },
                clear: function() {
                    mParticle.sessionManager.resetSessionTimer();
                    cartProducts = [];
                    tryNativeSdk(NativeSdkPaths.ClearCart);
                    persistence.update();
                }
            },
            setCurrencyCode: function(code) {
                if (typeof code !== 'string') {
                    logDebug('Code must be a string');
                    return;
                }
                mParticle.sessionManager.resetSessionTimer();
                currencyCode = code;
            },
            createProduct: function(name, sku, price, quantity, variant, category, brand, position, coupon, attributes) {
                mParticle.sessionManager.resetSessionTimer();
                return createProduct(name, sku, price, quantity, variant, category, brand, position, coupon, attributes);
            },
            createPromotion: function(id, creative, name, position) {
                mParticle.sessionManager.resetSessionTimer();
                return createPromotion(id, creative, name, position);
            },
            createImpression: function(name, product) {
                mParticle.sessionManager.resetSessionTimer();
                return createImpression(name, product);
            },
            createTransactionAttributes: function(id, affiliation, couponCode, revenue, shipping, tax) {
                mParticle.sessionManager.resetSessionTimer();
                return createTransactionAttributes(id, affiliation, couponCode, revenue, shipping, tax);
            },
            logCheckout: function(step, paymentMethod, attrs) {
                mParticle.sessionManager.resetSessionTimer();
                logCheckoutEvent(step, paymentMethod, attrs);
            },
            logProductAction: function(productActionType, product, attrs) {
                mParticle.sessionManager.resetSessionTimer();
                logProductActionEvent(productActionType, product, attrs);
            },
            logPurchase: function(transactionAttributes, product, clearCart, attrs) {
                if (!transactionAttributes || !product) {
                    logDebug(ErrorMessages.BadLogPurchase);
                    return;
                }
                mParticle.sessionManager.resetSessionTimer();
                logPurchaseEvent(transactionAttributes, product, attrs);

                if (clearCart === true) {
                    mParticle.eCommerce.Cart.clear();
                }
            },
            logPromotion: function(type, promotion, attrs) {
                mParticle.sessionManager.resetSessionTimer();
                logPromotionEvent(type, promotion, attrs);
            },
            logImpression: function(impression, attrs) {
                mParticle.sessionManager.resetSessionTimer();
                logImpressionEvent(impression, attrs);
            },
            logRefund: function(transactionAttributes, product, clearCart, attrs) {
                mParticle.sessionManager.resetSessionTimer();
                logRefundEvent(transactionAttributes, product, attrs);

                if (clearCart === true) {
                    mParticle.eCommerce.Cart.clear();
                }
            },
            expandCommerceEvent: function(event) {
                mParticle.sessionManager.resetSessionTimer();
                return expandCommerceEvent(event);
            }
        },
        logLTVIncrease: function(amount, eventName, attributes) {
            mParticle.sessionManager.resetSessionTimer();

            if (typeof amount !== 'number') {
                logDebug('A valid amount must be passed to logLTVIncrease.');
                return;
            }

            if (!attributes) {
                attributes = {};
            }

            attributes[RESERVED_KEY_LTV] = amount;
            attributes[METHOD_NAME] = LOG_LTV;

            logEvent(MessageType.PageEvent,
                eventName || 'Increase LTV',
                attributes,
                EventType.Transaction);
        },
        setSessionAttribute: function(key, value) {
            mParticle.sessionManager.resetSessionTimer();
            // Logs to cookie
            // And logs to in-memory object
            // Example: mParticle.setSessionAttribute('location', '33431');
            if (canLog()) {
                if (!Validators.isValidAttributeValue(value)) {
                    logDebug(ErrorMessages.BadAttribute);
                    return;
                }

                if (!Validators.isValidKeyValue(key)) {
                    logDebug(ErrorMessages.BadKey);
                    return;
                }

                var existingProp = findKeyInObject(sessionAttributes, key);

                if (existingProp) {
                    key = existingProp;
                }

                sessionAttributes[key] = value;
                persistence.update();
                if (!tryNativeSdk(NativeSdkPaths.SetSessionAttribute, JSON.stringify({ key: key, value: value }))) {
                    applyToForwarders('setSessionAttribute', [key, value]);
                }
            }
        },
        setOptOut: function(isOptingOut) {
            mParticle.sessionManager.resetSessionTimer();
            isEnabled = !isOptingOut;

            logOptOut();
            persistence.update();

            if (forwarders.length) {
                forwarders.forEach(function(forwarder) {
                    if (forwarder.setOptOut) {
                        var result = forwarder.setOptOut(isOptingOut);

                        if (result) {
                            logDebug(result);
                        }
                    }
                });
            }
        },
        addForwarder: function(forwarderProcessor) {
            forwarderConstructors.push(forwarderProcessor);
        },
        configureForwarder: function(configuration) {
            var newForwarder = null,
                config = configuration;

            for (var i = 0; i < forwarderConstructors.length; i++) {
                if (forwarderConstructors[i].name === config.name) {
                    if (config.isDebug === mParticle.isDevelopmentMode || config.isSandbox === mParticle.isDevelopmentMode) {
                        newForwarder = new forwarderConstructors[i].constructor();

                        newForwarder.id = config.moduleId;
                        newForwarder.isSandbox = config.isDebug || config.isSandbox;
                        newForwarder.hasSandbox = config.hasDebugString === 'true';
                        newForwarder.isVisible = config.isVisible;
                        newForwarder.settings = config.settings;

                        newForwarder.eventNameFilters = config.eventNameFilters;
                        newForwarder.eventTypeFilters = config.eventTypeFilters;
                        newForwarder.attributeFilters = config.attributeFilters;

                        newForwarder.pageViewFilters = config.pageViewFilters;
                        newForwarder.pageViewAttributeFilters = config.pageViewAttributeFilters;

                        newForwarder.userIdentityFilters = config.userIdentityFilters;
                        newForwarder.userAttributeFilters = config.userAttributeFilters;

                        newForwarder.filteringEventAttributeValue = config.filteringEventAttributeValue;

                        forwarders.push(newForwarder);
                        break;
                    }
                }
            }
        },
        configurePixel: function(settings) {
            if (settings.isDebug === mParticle.isDevelopmentMode || settings.isProduction !== mParticle.isDevelopmentMode) {
                pixelConfigurations.push(settings);
            }
        }
    };

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
            appName = window.mParticle.config.appName;
        }

        if (window.mParticle.config.hasOwnProperty('appVersion')) {
            appVersion = window.mParticle.config.appVersion;
        }

        if (window.mParticle.config.hasOwnProperty('sessionTimeout')) {
            Config.SessionTimeout = window.mParticle.config.sessionTimeout;
        }

        // Some forwarders require custom flags on initialization, so allow them to be set using config object
        if (window.mParticle.config.hasOwnProperty('customFlags')) {
            customFlags = window.mParticle.config.customFlags;
        }
    }

    window.mParticle = mParticle;
})(window);
