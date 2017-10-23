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
