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
    Ecommerce = require('./ecommerce'),
    ServerModel = require('./serverModel'),
    MP = require('./mp'),
    Messages = Constants.Messages,
    Validators = Helpers.Validators,
    _IdentityRequest = require('./identity')._IdentityRequest;

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

    function checkCookieForMPID(currentMPID) {
        var cookies = persistence.getCookie() || persistence.getLocalStorage();
        if (cookies && !cookies[currentMPID]) {
            persistence.storeDataInMemory(null, currentMPID);
        } else if (cookies) {
            MP.userIdentities = cookies[currentMPID].ui ? cookies[currentMPID].ui : MP.userIdentities;
            MP.userAttributes = cookies[currentMPID].ua ? cookies[currentMPID].ua : MP.userAttributes;
            MP.cartProducts = cookies[currentMPID].cp ? cookies[currentMPID].cp : MP.cartProducts;
            MP.productsBags = cookies[currentMPID].pb ? cookies[currentMPID].pb : MP.productsBags;
            MP.cookieSyncDates = cookies[currentMPID].csd ? cookies[currentMPID].csd : MP.cookieSyncDates;
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
                    MP.userIdentities = _IdentityRequest.modifyUserIdentities(MP.userIdentities, identityApiData.userIdentities);
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
                        // need to update currentSessionMPIDs in memory before checkingIdentitySwap otherwise previous obj.currentSessionMPIDs is used in checkIdentitySwap's persistence.update()
                        persistence.update();
                    }

                    cookieSyncManager.attemptCookieSync(previousMPID, MP.mpid);

                    _Identity.checkIdentitySwap(previousMPID, MP.mpid);

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
                            MP.userIdentities = _IdentityRequest.modifyUserIdentities(MP.userIdentities, identityApiData.userIdentities);
                        }
                    }
                    persistence.update();
                    persistence.findPrevCookiesBasedOnUI(identityApiData);

                    MP.context = identityApiResult.context || MP.context;
                }

                _Identity.setForwarderUserIdentities(identityApiData.userIdentities);
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

    function identify(identityApiData) {
        var preProcessResult = _IdentityRequest.preProcessIdentityRequest(identityApiData, MP.identityCallback, 'identify');
        if (preProcessResult.valid) {
            var identityApiRequest = _IdentityRequest.createIdentityRequest(identityApiData, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, MP.deviceId, MP.context, MP.mpid),
                copyAttributes = _IdentityRequest.returnCopyAttributes(identityApiData);

            sendIdentityRequest(identityApiRequest, 'identify', MP.identityCallback, copyAttributes, identityApiData);
        } else {
            if (MP.identityCallback) {
                MP.identityCallback(preProcessResult);
            }
        }
    }

    var IdentityAPI = {
        logout: function(identityApiData, callback) {
            var preProcessResult = _IdentityRequest.preProcessIdentityRequest(identityApiData, callback, 'logout');

            if (preProcessResult.valid) {
                var evt,
                    identityApiRequest = _IdentityRequest.createIdentityRequest(identityApiData, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, MP.deviceId, MP.context, MP.mpid),
                    copyAttributes = _IdentityRequest.returnCopyAttributes(identityApiData);

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
            var preProcessResult = _IdentityRequest.preProcessIdentityRequest(identityApiData, callback, 'login');

            if (preProcessResult.valid) {
                var identityApiRequest = _IdentityRequest.createIdentityRequest(identityApiData, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, MP.deviceId, MP.context, MP.mpid),
                    copyAttributes = _IdentityRequest.returnCopyAttributes(identityApiData);

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
            var preProcessResult = _IdentityRequest.preProcessIdentityRequest(identityApiData, callback, 'modify');
            if (preProcessResult.valid) {
                var identityApiRequest = _IdentityRequest.createModifyIdentityRequest(MP.userIdentities, newUserIdentities, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, MP.context);

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
                persistence.update();

                if (!Helpers.tryNativeSdk(Constants.NativeSdkPaths.SetUserAttribute, JSON.stringify({ key: key, value: value }))) {
                    callSetUserAttributeOnForwarders(key, value);
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
                applyToForwarders('removeUserAttribute', key);
            }

            persistence.update();
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
                persistence.update();

                if (!Helpers.tryNativeSdk(Constants.NativeSdkPaths.SetUserAttributeList, JSON.stringify({ key: key, value: arrayCopy }))) {
                    callSetUserAttributeOnForwarders(key, arrayCopy);
                }
            }
        },
        removeAllUserAttributes: function() {
            mParticle.sessionManager.resetSessionTimer();
            if (!Helpers.tryNativeSdk(Constants.NativeSdkPaths.RemoveAllUserAttributes)) {
                if (MP.userAttributes) {
                    for (var prop in MP.userAttributes) {
                        if (MP.userAttributes.hasOwnProperty(prop)) {
                            applyToForwarders('removeUserAttribute', MP.userAttributes[prop]);
                        }
                    }
                }
            }

            MP.userAttributes = {};
            persistence.update();
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
        },

        setLocalStorage: function() {
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
        },

        setGlobalStorageAttributes: function(data) {
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
        },

        getLocalStorage: function() {
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
        },

        removeLocalStorage: function() {
            localStorage.removeItem(Constants.DefaultConfig.LocalStorageName);
        },

        storeDataInMemory: function(result, currentMPID) {
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
        },

        retrieveDeviceId: function() {
            if (MP.deviceId) {
                return MP.deviceId;
            } else {
                return this.parseDeviceId(MP.serverSettings);
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

                return Helpers.generateUniqueId();
            }
            catch (e) {
                return Helpers.generateUniqueId();
            }
        },

        expireCookies: function() {
            var date = new Date(),
                expires;

            date.setTime(date.getTime() - (24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
            document.cookie = Constants.DefaultConfig.CookieName + '=' + '' + expires + '; path=/';
        },

        getCookie: function() {
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
        },

        setCookie: function() {
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
        },

        findPrevCookiesBasedOnUI: function(identityApiData) {
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
                persistence.storeDataInMemory(cookies, matchedUser);
            }
        }
    };

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
                            sendEventToForwarders(event);
                        }
                    }
                    catch (e) {
                        Helpers.logDebug('Error sending event to mParticle servers. ' + e);
                    }
                }
            }
        }
    }

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

                Helpers.logDebug('Sending message to forwarder: ' + MP.forwarders[i].name);
                var result = MP.forwarders[i].process(clonedEvent);

                if (result) {
                    Helpers.logDebug(result);
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

                persistence.update();
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

    function logOptOut() {
        Helpers.logDebug(Messages.InformationMessages.StartingLogOptOut);

        send(ServerModel.createEventObject(Types.MessageType.OptOut, null, null, Types.EventType.Other));
    }

    function logAST() {
        logEvent(Types.MessageType.AppStateTransition);
    }

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
            persistence.update();
        }
        else {
            Helpers.logDebug(Messages.InformationMessages.AbandonLogEvent);
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
            persistence.update();
        }
        else {
            Helpers.logDebug(Messages.InformationMessages.AbandonLogEvent);
        }
    }

    function mergeConfig(config) {
        Helpers.logDebug(Messages.InformationMessages.LoadingConfig);

        for (var prop in Constants.DefaultConfig) {
            if (Constants.DefaultConfig.hasOwnProperty(prop)) {
                MP.Config[prop] = Constants.DefaultConfig[prop];
            }

            if (config.hasOwnProperty(prop)) {
                MP.Config[prop] = config[prop];
            }
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

    var _Identity = {
        checkIdentitySwap: function(previousMPID, currentMPID) {
            if (previousMPID && currentMPID && previousMPID !== currentMPID) {
                var cookies = persistence.useLocalStorage() ? persistence.getLocalStorage() : persistence.getCookie();
                persistence.storeDataInMemory(cookies, currentMPID);
                persistence.update();
            }
        },
        migrate: function(isFirstRun) {
            var cookies = persistence.useLocalStorage ? persistence.getLocalStorage() : persistence.getCookie();
            // migration occurs when it is not the first run and there is no currentUserMPID on the cookie
            if (!isFirstRun && cookies && !cookies.currentUserMPID) {
                if (persistence.useLocalStorage) {
                    persistence.removeLocalStorage();
                } else {
                    persistence.expireCookies();
                }
                persistence.update();
            }
        },
        setForwarderUserIdentities: function(userIdentities) {
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
    };

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
            persistence.update();
        },

        replaceMPID: function(string, mpid) {
            return string.replace('%%mpid%%', mpid);
        },

        replaceAmp: function(string) {
            return string.replace(/&amp;/g, '&');
        }
    };

    var sessionManager = {
        initialize: function() {
            if (MP.sessionId) {
                var sessionTimeoutInSeconds = MP.Config.SessionTimeout * 60000;

                if (new Date() > new Date(MP.dateLastEventSent.getTime() + sessionTimeoutInSeconds)) {
                    this.endSession();
                    this.startNewSession();
                }
            } else {
                this.startNewSession();
            }
        },
        getSession: function() {
            return MP.sessionId;
        },
        startNewSession: function() {
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
        },
        endSession: function() {
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
                persistence.update();
            }
            else {
                Helpers.logDebug(Messages.InformationMessages.AbandonEndSession);
            }
        },
        setSessionTimer: function() {
            var sessionTimeoutInSeconds = MP.Config.SessionTimeout * 60000;

            MP.globalTimer = window.setTimeout(function() {
                mParticle.sessionManager.endSession();
            }, sessionTimeoutInSeconds);
        },

        resetSessionTimer: function() {
            if (!MP.sessionId) {
                this.startNewSession();
            }
            this.clearSessionTimeout();
            this.setSessionTimer();
        },

        clearSessionTimeout: function() {
            clearTimeout(MP.globalTimer);
        }
    };

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
        sessionManager: sessionManager,
        cookieSyncManager: cookieSyncManager,
        persistence: persistence,
        Identity: IdentityAPI,
        Validators: Validators,
        _Identity: _Identity,
        _IdentityRequest: _IdentityRequest,
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
            mergeConfig({});
            // Determine if there is any data in cookies or localStorage to figure out if it is the first time the browser is loading mParticle
            if (!persistence.getCookie() && !persistence.getLocalStorage()) {
                MP.isFirstRun = true;
                MP.mpid = 0;
            } else {
                MP.isFirstRun = false;
            }

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
            MP.deviceId = persistence.retrieveDeviceId();

            // If no identity is passed in, we set the user identities to what is currently in cookies for the identify request
            if ((Helpers.isObject(mParticle.identifyRequest) && Object.keys(mParticle.identifyRequest).length === 0) || !mParticle.identifyRequest) {
                MP.initialIdentifyRequest = {
                    userIdentities: MP.userIdentities
                };
            } else {
                MP.initialIdentifyRequest = mParticle.identifyRequest;
            }

            initForwarders(MP.initialIdentifyRequest);
            _Identity.migrate(MP.isFirstRun);

            if (arguments && arguments.length) {
                if (arguments.length > 1 && typeof arguments[1] === 'object') {
                    config = arguments[1];
                }
                if (config) {
                    mergeConfig(config);
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

            logAST();
            MP.isInitialized = true;
        },
        reset: function() {
            // Completely resets the state of the SDK. mParticle.init() will need to be called again.
            MP.sessionAttributes = {};
            MP.isEnabled = true;
            MP.isFirstRun = null;
            stopTracking();
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
            mergeConfig({});
            MP.migrationData = {};
            MP.identityCallInFlight = false,
            MP.initialIdentifyRequest = null,

            persistence.expireCookies();
            if (persistence.isLocalStorageAvailable) {
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
            persistence.update();
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
            stopTracking();
        },
        startTrackingLocation: function() {
            mParticle.sessionManager.resetSessionTimer();
            startTracking();
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
            sessionManager.startNewSession();
        },
        endSession: function() {
            sessionManager.endSession();
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

            logEvent(Types.MessageType.PageEvent, eventName, eventInfo, eventType, customFlags);
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

            logEvent(Types.MessageType.CrashReport,
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

                logEvent(Types.MessageType.PageView, eventName, attrs, Types.EventType.Unknown, flags);
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
                    persistence.update();

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
                        persistence.update();
                    }
                    Helpers.tryNativeSdk(Constants.NativeSdkPaths.RemoveFromProductBag, JSON.stringify(product));
                },
                clear: function(productBagName) {
                    mParticle.sessionManager.resetSessionTimer();
                    MP.productsBags[productBagName] = [];
                    persistence.update();

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
                        logProductActionEvent(Types.ProductActionType.AddToCart, arrayCopy);
                    }
                    persistence.update();
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
                                logProductActionEvent(Types.ProductActionType.RemoveFromCart, cartItem);
                            }
                        }
                    }
                    persistence.update();
                },
                clear: function() {
                    mParticle.sessionManager.resetSessionTimer();
                    MP.cartProducts = [];
                    Helpers.tryNativeSdk(Constants.NativeSdkPaths.ClearCart);
                    persistence.update();
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
                logCheckoutEvent(step, paymentMethod, attrs);
            },
            logProductAction: function(productActionType, product, attrs) {
                mParticle.sessionManager.resetSessionTimer();
                logProductActionEvent(productActionType, product, attrs);
            },
            logPurchase: function(transactionAttributes, product, clearCart, attrs) {
                if (!transactionAttributes || !product) {
                    Helpers.logDebug(Messages.ErrorMessages.BadLogPurchase);
                    return;
                }
                mParticle.sessionManager.resetSessionTimer();
                logPurchaseEvent(transactionAttributes, product, attrs);

                if (clearCart === true) {
                    mParticle.Ecommerce.Cart.clear();
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

            logEvent(Types.MessageType.PageEvent,
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
                persistence.update();
                if (!Helpers.tryNativeSdk(Constants.NativeSdkPaths.SetSessionAttribute, JSON.stringify({ key: key, value: value }))) {
                    applyToForwarders('setSessionAttribute', [key, value]);
                }
            }
        },
        setOptOut: function(isOptingOut) {
            mParticle.sessionManager.resetSessionTimer();
            MP.isEnabled = !isOptingOut;

            logOptOut();
            persistence.update();

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
