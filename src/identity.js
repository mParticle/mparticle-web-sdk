var Helpers = require('./helpers'),
    Constants = require('./constants'),
    ServerModel = require('./serverModel'),
    Forwarders = require('./forwarders'),
    Persistence = require('./persistence'),
    Types = require('./types'),
    Messages = Constants.Messages,
    MP = require('./mp'),
    Validators = Helpers.Validators,
    sendIdentityRequest = require('./apiClient').sendIdentityRequest,
    CookieSyncManager = require('./cookieSyncManager'),
    sendEventToServer = require('./apiClient').sendEventToServer,
    HTTPCodes = Constants.HTTPCodes,
    Events = require('./events'),
    sendEventToForwarders = require('./forwarders').sendEventToForwarders;

var Identity = {
    checkIdentitySwap: function(previousMPID, currentMPID) {
        if (previousMPID && currentMPID && previousMPID !== currentMPID) {
            var cookies = Persistence.useLocalStorage() ? Persistence.getLocalStorage() : Persistence.getCookie();
            Persistence.storeDataInMemory(cookies, currentMPID);
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
            var error = 'The optional callback must be a function. You tried entering a(n) ' + typeof callback;
            Helpers.logDebug(error);
            return {
                valid: false,
                error: error
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
                    old_value: previousIdentities[Types.IdentityType.getIdentityType(key)] || null,
                    new_value: newIdentities[key],
                    identity_type: key
                });
            }
        }

        return identityChanges;
    },

    modifyUserIdentities: function(previousUserIdentities, newUserIdentities) {
        var modifiedUserIdentities = {};

        for (var key in newUserIdentities) {
            modifiedUserIdentities[Types.IdentityType.getIdentityType(key)] = newUserIdentities[key];
        }

        for (key in previousUserIdentities) {
            if (!modifiedUserIdentities[key]) {
                modifiedUserIdentities[key] = previousUserIdentities[key];
            }
        }

        return modifiedUserIdentities;
    },

    convertToNative: function(identityApiData) {
        var nativeIdentityRequest = [];
        if (identityApiData && identityApiData.userIdentities) {
            for (var key in identityApiData.userIdentities) {
                if (identityApiData.userIdentities.hasOwnProperty(key)) {
                    nativeIdentityRequest.push({
                        Type: Types.IdentityType.getIdentityType(key),
                        Identity: identityApiData.userIdentities[key]
                    });
                }
            }

            return {
                UserIdentities: nativeIdentityRequest
            };
        }
    }
};
/**
* Invoke these methods on the mParticle.Identity object.
* Example: mParticle.Identity.getCurrentUser().
* @class mParticle.Identity
*/
var IdentityAPI = {
    HTTPCodes: HTTPCodes,
    /**
    * Initiate a logout request to the mParticle server
    * @method identify
    * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
    * @param {Function} [callback] A callback function that is called when the identify request completes
    */
    identify: function(identityApiData, callback) {
        var preProcessResult = IdentityRequest.preProcessIdentityRequest(identityApiData, callback, 'identify');

        if (preProcessResult.valid) {
            var identityApiRequest = IdentityRequest.createIdentityRequest(identityApiData, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, MP.deviceId, MP.context, MP.mpid);

            if (Helpers.canLog()) {
                if (Helpers.shouldUseNativeSdk()) {
                    Helpers.sendToNative(Constants.NativeSdkPaths.Identify, JSON.stringify(IdentityRequest.convertToNative(identityApiData)));
                    Helpers.invokeCallback(callback, HTTPCodes.nativeIdentityRequest, 'Identify request sent to native sdk');
                } else {
                    sendIdentityRequest(identityApiRequest, 'identify', callback, identityApiData, parseIdentityResponse);
                }
            }
            else {
                Helpers.invokeCallback(callback, HTTPCodes.loggingDisabledOrMissingAPIKey, Messages.InformationMessages.AbandonLogEvent);
                Helpers.logDebug(Messages.InformationMessages.AbandonLogEvent);
            }
        } else {
            Helpers.invokeCallback(callback, HTTPCodes.validationIssue, preProcessResult.error);
            Helpers.logDebug(preProcessResult);
        }
    },
    /**
    * Initiate a logout request to the mParticle server
    * @method logout
    * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
    * @param {Function} [callback] A callback function that is called when the logout request completes
    */
    logout: function(identityApiData, callback) {
        var preProcessResult = IdentityRequest.preProcessIdentityRequest(identityApiData, callback, 'logout');

        if (preProcessResult.valid) {
            var evt,
                identityApiRequest = IdentityRequest.createIdentityRequest(identityApiData, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, MP.deviceId, MP.context, MP.mpid);

            if (Helpers.canLog()) {
                if (Helpers.shouldUseNativeSdk()) {
                    Helpers.sendToNative(Constants.NativeSdkPaths.Logout, JSON.stringify(IdentityRequest.convertToNative(identityApiData)));
                    Helpers.invokeCallback(callback, HTTPCodes.nativeIdentityRequest, 'Logout request sent to native sdk');
                } else {
                    sendIdentityRequest(identityApiRequest, 'logout', callback, identityApiData, parseIdentityResponse);
                    evt = ServerModel.createEventObject(Types.MessageType.Profile);
                    evt.ProfileMessageType = Types.ProfileMessageType.Logout;
                    if (MP.activeForwarders.length) {
                        MP.activeForwarders.forEach(function(forwarder) {
                            if (forwarder.logOut) {
                                forwarder.logOut(evt);
                            }
                        });
                    }
                }
            }
            else {
                Helpers.invokeCallback(callback, HTTPCodes.loggingDisabledOrMissingAPIKey, Messages.InformationMessages.AbandonLogEvent);
                Helpers.logDebug(Messages.InformationMessages.AbandonLogEvent);
            }
        } else {
            Helpers.invokeCallback(callback, HTTPCodes.validationIssue, preProcessResult.error);
            Helpers.logDebug(preProcessResult);
        }
    },
    /**
    * Initiate a login request to the mParticle server
    * @method login
    * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
    * @param {Function} [callback] A callback function that is called when the login request completes
    */
    login: function(identityApiData, callback) {
        var preProcessResult = IdentityRequest.preProcessIdentityRequest(identityApiData, callback, 'login');

        if (preProcessResult.valid) {
            var identityApiRequest = IdentityRequest.createIdentityRequest(identityApiData, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, MP.deviceId, MP.context, MP.mpid);

            if (Helpers.canLog()) {
                if (Helpers.shouldUseNativeSdk()) {
                    Helpers.sendToNative(Constants.NativeSdkPaths.Login, JSON.stringify(IdentityRequest.convertToNative(identityApiData)));
                    Helpers.invokeCallback(callback, HTTPCodes.nativeIdentityRequest, 'Login request sent to native sdk');
                } else {
                    sendIdentityRequest(identityApiRequest, 'login', callback, identityApiData, parseIdentityResponse);
                }
            }
            else {
                Helpers.invokeCallback(callback, HTTPCodes.loggingDisabledOrMissingAPIKey, Messages.InformationMessages.AbandonLogEvent);
                Helpers.logDebug(Messages.InformationMessages.AbandonLogEvent);
            }
        } else {
            Helpers.invokeCallback(callback, HTTPCodes.validationIssue, preProcessResult.error);
            Helpers.logDebug(preProcessResult);
        }
    },
    /**
    * Initiate a modify request to the mParticle server
    * @method modify
    * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
    * @param {Function} [callback] A callback function that is called when the modify request completes
    */
    modify: function(identityApiData, callback) {
        var newUserIdentities = (identityApiData && identityApiData.userIdentities) ? identityApiData.userIdentities : {};
        var preProcessResult = IdentityRequest.preProcessIdentityRequest(identityApiData, callback, 'modify');
        if (preProcessResult.valid) {
            var identityApiRequest = IdentityRequest.createModifyIdentityRequest(MP.userIdentities, newUserIdentities, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, MP.context);

            if (Helpers.canLog()) {
                if (Helpers.shouldUseNativeSdk()) {
                    Helpers.sendToNative(Constants.NativeSdkPaths.Modify, JSON.stringify(IdentityRequest.convertToNative(identityApiData)));
                    Helpers.invokeCallback(callback, HTTPCodes.nativeIdentityRequest, 'Modify request sent to native sdk');
                } else {
                    sendIdentityRequest(identityApiRequest, 'modify', callback, identityApiData, parseIdentityResponse);
                }
            }
            else {
                Helpers.invokeCallback(callback, HTTPCodes.loggingDisabledOrMissingAPIKey, Messages.InformationMessages.AbandonLogEvent);
                Helpers.logDebug(Messages.InformationMessages.AbandonLogEvent);
            }
        } else {
            Helpers.invokeCallback(callback, HTTPCodes.validationIssue, preProcessResult.error);
            Helpers.logDebug(preProcessResult);
        }
    },
    /**
    * Returns a user object with methods to interact with the current user
    * @method getCurrentUser
    * @return {Object} the current user object
    */
    getCurrentUser: function() {
        var mpid = MP.mpid;
        if (mpid) {
            mpid = MP.mpid.slice();
            return mParticleUser(mpid);
        } else if (Helpers.shouldUseNativeSdk()) {
            return mParticleUser();
        } else {
            return null;
        }
    },

    /**
    * Returns a the user object associated with the mpid parameter or 'null' if no such
    * user exists
    * @method getUser
    * @param {String} mpid of the desired user
    * @return {Object} the user for  mpid
    */
    getUser: function(mpid) {
        var cookies = Persistence.getPersistence();
        if (cookies) {
            if (cookies[mpid] && !Constants.SDKv2NonMPIDCookieKeys.hasOwnProperty(mpid)) {
                return mParticleUser(mpid);
            } else {
                return null;
            }
        } else {
            return null;
        }
    },

    /**
    * Returns all users, including the current user and all previous users that are stored on the device.
    * @method getUsers
    * @return {Array} array of users
    */
    getUsers: function() {
        var cookies = Persistence.getPersistence();
        var users = [];
        if (cookies) {
            for (var key in cookies) {
                if (!Constants.SDKv2NonMPIDCookieKeys.hasOwnProperty(key)) {
                    users.push(mParticleUser(key));
                }
            }
        }
        return users;
    }
};

/**
* Invoke these methods on the mParticle.Identity.getCurrentUser() object.
* Example: mParticle.Identity.getCurrentUser().getAllUserAttributes()
* @class mParticle.Identity.getCurrentUser()
*/
function mParticleUser(mpid) {
    return {
        /**
        * Get user identities for current user
        * @method getUserIdentities
        * @return {Object} an object with userIdentities as its key
        */
        getUserIdentities: function() {
            var currentUserIdentities = {};

            var identities = Persistence.getUserIdentities(mpid);

            for (var identityType in identities) {
                if (identities.hasOwnProperty(identityType)) {
                    currentUserIdentities[Types.IdentityType.getIdentityName(Helpers.parseNumber(identityType))] = identities[identityType];
                }
            }

            return {
                userIdentities: currentUserIdentities
            };
        },
        /**
        * Get the MPID of the current user
        * @method getMPID
        * @return {String} the current user MPID as a string
        */
        getMPID: function() {
            return mpid;
        },
        /**
        * Sets a user tag
        * @method setUserTag
        * @param {String} tagName
        */
        setUserTag: function(tagName) {
            if (!Validators.isValidKeyValue(tagName)) {
                Helpers.logDebug(Messages.ErrorMessages.BadKey);
                return;
            }

            this.setUserAttribute(tagName, null);
        },
        /**
        * Removes a user tag
        * @method removeUserTag
        * @param {String} tagName
        */
        removeUserTag: function(tagName) {
            if (!Validators.isValidKeyValue(tagName)) {
                Helpers.logDebug(Messages.ErrorMessages.BadKey);
                return;
            }

            this.removeUserAttribute(tagName);
        },
        /**
        * Sets a user attribute
        * @method setUserAttribute
        * @param {String} key
        * @param {String} value
        */
        setUserAttribute: function(key, value) {
            var cookies,
                userAttributes;

            mParticle.sessionManager.resetSessionTimer();

            if (Helpers.canLog()) {
                if (!Validators.isValidAttributeValue(value)) {
                    Helpers.logDebug(Messages.ErrorMessages.BadAttribute);
                    return;
                }

                if (!Validators.isValidKeyValue(key)) {
                    Helpers.logDebug(Messages.ErrorMessages.BadKey);
                    return;
                }
                if (Helpers.shouldUseNativeSdk()) {
                    Helpers.sendToNative(Constants.NativeSdkPaths.SetUserAttribute, JSON.stringify({ key: key, value: value }));
                } else {
                    cookies = Persistence.getPersistence();

                    userAttributes = this.getAllUserAttributes();

                    var existingProp = Helpers.findKeyInObject(userAttributes, key);

                    if (existingProp) {
                        delete userAttributes[existingProp];
                    }

                    userAttributes[key] = value;
                    if (cookies && cookies[mpid]) {
                        cookies[mpid].ua = userAttributes;
                        Persistence.updateOnlyCookieUserAttributes(cookies, mpid);
                        Persistence.storeDataInMemory(cookies, mpid);
                    }

                    Forwarders.initForwarders(mParticle.Identity.getCurrentUser().getUserIdentities());
                    Forwarders.callSetUserAttributeOnForwarders(key, value);
                }
            }
        },
        /**
        * Set multiple user attributes
        * @method setUserAttributes
        * @param {Object} user attribute object with keys of the attribute type, and value of the attribute value
        */
        setUserAttributes: function(userAttributes) {
            mParticle.sessionManager.resetSessionTimer();
            if (Helpers.isObject(userAttributes)) {
                if (Helpers.canLog()) {
                    for (var key in userAttributes) {
                        if (userAttributes.hasOwnProperty(key)) {
                            this.setUserAttribute(key, userAttributes[key]);
                        }
                    }
                }
            } else {
                Helpers.debug('Must pass an object into setUserAttributes. You passed a ' + typeof userAttributes);
            }
        },
        /**
        * Removes a specific user attribute
        * @method removeUserAttribute
        * @param {String} key
        */
        removeUserAttribute: function(key) {
            var cookies, userAttributes;
            mParticle.sessionManager.resetSessionTimer();

            if (!Validators.isValidKeyValue(key)) {
                Helpers.logDebug(Messages.ErrorMessages.BadKey);
                return;
            }

            if (Helpers.shouldUseNativeSdk()) {
                Helpers.sendToNative(Constants.NativeSdkPaths.RemoveUserAttribute, JSON.stringify({ key: key, value: null }));
            } else {
                cookies = Persistence.getPersistence();

                userAttributes = this.getAllUserAttributes();

                var existingProp = Helpers.findKeyInObject(userAttributes, key);

                if (existingProp) {
                    key = existingProp;
                }

                delete userAttributes[key];

                if (cookies && cookies[mpid]) {
                    cookies[mpid].ua = userAttributes;
                    Persistence.updateOnlyCookieUserAttributes(cookies, mpid);
                    Persistence.storeDataInMemory(cookies, mpid);
                }

                Forwarders.initForwarders(mParticle.Identity.getCurrentUser().getUserIdentities());
                Forwarders.applyToForwarders('removeUserAttribute', key);
            }
        },
        /**
        * Sets a list of user attributes
        * @method setUserAttributeList
        * @param {String} key
        * @param {Array} value an array of values
        */
        setUserAttributeList: function(key, value) {
            var cookies, userAttributes;

            mParticle.sessionManager.resetSessionTimer();

            if (!Validators.isValidKeyValue(key)) {
                Helpers.logDebug(Messages.ErrorMessages.BadKey);
                return;
            }

            if (!Array.isArray(value)) {
                Helpers.logDebug('The value you passed in to setUserAttributeList must be an array. You passed in a ' + typeof value);
                return;
            }

            var arrayCopy = value.slice();

            if (Helpers.shouldUseNativeSdk()) {
                Helpers.sendToNative(Constants.NativeSdkPaths.SetUserAttributeList, JSON.stringify({ key: key, value: arrayCopy }));
            } else {
                cookies = Persistence.getPersistence();

                userAttributes = this.getAllUserAttributes();

                var existingProp = Helpers.findKeyInObject(userAttributes, key);

                if (existingProp) {
                    delete userAttributes[existingProp];
                }

                userAttributes[key] = arrayCopy;
                if (cookies && cookies[mpid]) {
                    cookies[mpid].ua = userAttributes;
                    Persistence.updateOnlyCookieUserAttributes(cookies, mpid);
                    Persistence.storeDataInMemory(cookies, mpid);
                }

                Forwarders.initForwarders(mParticle.Identity.getCurrentUser().getUserIdentities());
                Forwarders.callSetUserAttributeOnForwarders(key, arrayCopy);
            }
        },
        /**
        * Removes all user attributes
        * @method removeAllUserAttributes
        */
        removeAllUserAttributes: function() {
            var cookies, userAttributes;

            mParticle.sessionManager.resetSessionTimer();

            if (Helpers.shouldUseNativeSdk()) {
                Helpers.sendToNative(Constants.NativeSdkPaths.RemoveAllUserAttributes);
            } else {
                cookies = Persistence.getPersistence();

                userAttributes = this.getAllUserAttributes();

                Forwarders.initForwarders(mParticle.Identity.getCurrentUser().getUserIdentities());
                if (userAttributes) {
                    for (var prop in userAttributes) {
                        if (userAttributes.hasOwnProperty(prop)) {
                            Forwarders.applyToForwarders('removeUserAttribute', prop);
                        }
                    }
                }

                if (cookies && cookies[mpid]) {
                    cookies[mpid].ua = {};
                    Persistence.updateOnlyCookieUserAttributes(cookies, mpid);
                    Persistence.storeDataInMemory(cookies, mpid);
                }
            }
        },
        /**
        * Returns all user attribute keys that have values that are arrays
        * @method getUserAttributesLists
        * @return {Object} an object of only keys with array values. Example: { attr1: [1, 2, 3], attr2: ['a', 'b', 'c'] }
        */
        getUserAttributesLists: function() {
            var userAttributes,
                userAttributesLists = {};

            userAttributes = this.getAllUserAttributes();
            for (var key in userAttributes) {
                if (userAttributes.hasOwnProperty(key) && Array.isArray(userAttributes[key])) {
                    userAttributesLists[key] = userAttributes[key].slice();
                }
            }

            return userAttributesLists;
        },
        /**
        * Returns all user attributes
        * @method getAllUserAttributes
        * @return {Object} an object of all user attributes. Example: { attr1: 'value1', attr2: ['a', 'b', 'c'] }
        */
        getAllUserAttributes: function() {
            var userAttributesCopy = {};
            var userAttributes = Persistence.getAllUserAttributes(mpid);

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
        },
        /**
        * Returns the cart object for the current user
        * @method getCart
        * @return a cart object
        */
        getCart: function() {
            return mParticleUserCart(mpid);
        },

        /**
        * Returns the Consent State stored locally for this user.
        * @method getConsentState
        * @return a ConsentState object
        */
        getConsentState: function() {
            return Persistence.getConsentState(mpid);
        },
        /**
        * Sets the Consent State stored locally for this user.
        * @method setConsentState
        * @param {Object} consent state
        */
        setConsentState: function(state) {
            Persistence.setConsentState(mpid, state);
            if (MP.mpid === this.getMPID()) {
                Forwarders.initForwarders(this.getUserIdentities().userIdentities);
            }
        }
    };
}

/**
* Invoke these methods on the mParticle.Identity.getCurrentUser().getCart() object.
* Example: mParticle.Identity.getCurrentUser().getCart().add(...);
* @class mParticle.Identity.getCurrentUser().getCart()
*/
function mParticleUserCart(mpid){
    return {
        /**
        * Adds a cart product to the user cart
        * @method add
        * @param {Object} product the product
        * @param {Boolean} [logEvent] a boolean to log adding of the cart object. If blank, no logging occurs.
        */
        add: function(product, logEvent) {
            var allProducts,
                userProducts,
                arrayCopy;

            if (Helpers.shouldUseNativeSdk()) {
                Helpers.sendToNative(Constants.NativeSdkPaths.AddToCart, JSON.stringify(arrayCopy));
            } else {
                mParticle.sessionManager.resetSessionTimer();

                product.Attributes = Helpers.sanitizeAttributes(product.Attributes);
                arrayCopy = Array.isArray(product) ? product.slice() : [product];


                allProducts = JSON.parse(Persistence.getLocalStorageProducts());

                if (allProducts && !allProducts[mpid]) {
                    allProducts[mpid] = {};
                }

                if (allProducts[mpid].cp) {
                    userProducts = allProducts[mpid].cp;
                } else {
                    userProducts = [];
                }

                userProducts = userProducts.concat(arrayCopy);

                if (logEvent === true) {
                    Events.logProductActionEvent(Types.ProductActionType.AddToCart, arrayCopy);
                }

                var productsForMemory = {};
                productsForMemory[mpid] = {cp: userProducts};
                if (mpid === MP.mpid) {
                    Persistence.storeProductsInMemory(productsForMemory, mpid);
                }

                if (userProducts.length > mParticle.maxProducts) {
                    Helpers.logDebug('The cart contains ' + userProducts.length + ' items. Only mParticle.maxProducts = ' + mParticle.maxProducts + ' can currently be saved in cookies.');
                    userProducts = userProducts.slice(0, mParticle.maxProducts);
                }

                allProducts[mpid].cp = userProducts;

                Persistence.setCartProducts(allProducts);
            }
        },
        /**
        * Removes a cart product from the current user cart
        * @method remove
        * @param {Object} product the product
        * @param {Boolean} [logEvent] a boolean to log adding of the cart object. If blank, no logging occurs.
        */
        remove: function(product, logEvent) {
            var allProducts,
                userProducts,
                cartIndex = -1,
                cartItem = null;

            if (Helpers.shouldUseNativeSdk()) {
                Helpers.sendToNative(Constants.NativeSdkPaths.RemoveFromCart, JSON.stringify(cartItem));
            } else {
                mParticle.sessionManager.resetSessionTimer();

                allProducts = JSON.parse(Persistence.getLocalStorageProducts());

                if (allProducts && allProducts[mpid].cp) {
                    userProducts = allProducts[mpid].cp;
                } else {
                    userProducts = [];
                }

                if (userProducts) {
                    userProducts.forEach(function(cartProduct, i) {
                        if (cartProduct.Sku === product.Sku) {
                            cartIndex = i;
                            cartItem = cartProduct;
                        }
                    });

                    if (cartIndex > -1) {
                        userProducts.splice(cartIndex, 1);

                        if (logEvent === true) {
                            Events.logProductActionEvent(Types.ProductActionType.RemoveFromCart, cartItem);
                        }
                    }
                }

                var productsForMemory = {};
                productsForMemory[mpid] = {cp: userProducts};
                if (mpid === MP.mpid) {
                    Persistence.storeProductsInMemory(productsForMemory, mpid);
                }

                allProducts[mpid].cp = userProducts;

                Persistence.setCartProducts(allProducts);
            }
        },
        /**
        * Clears the user's cart
        * @method clear
        */
        clear: function() {
            var allProducts;

            if (Helpers.shouldUseNativeSdk()) {
                Helpers.sendToNative(Constants.NativeSdkPaths.ClearCart);
            } else {
                mParticle.sessionManager.resetSessionTimer();
                allProducts = JSON.parse(Persistence.getLocalStorageProducts());

                if (allProducts && allProducts[mpid].cp) {
                    allProducts[mpid].cp = [];

                    allProducts[mpid].cp = [];
                    if (mpid === MP.mpid) {
                        Persistence.storeProductsInMemory(allProducts, mpid);
                    }

                    Persistence.setCartProducts(allProducts);
                }
            }
        },
        /**
        * Returns all cart products
        * @method getCartProducts
        * @return {Array} array of cart products
        */
        getCartProducts: function() {
            return Persistence.getCartProducts(mpid);
        }
    };
}

function parseIdentityResponse(xhr, previousMPID, callback, identityApiData, method) {
    var prevUser,
        newUser,
        identityApiResult,
        indexOfMPID;
    if (MP.mpid) {
        prevUser = mParticle.Identity.getCurrentUser();
    }

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

                    checkCookieForMPID(MP.mpid);
                }

                indexOfMPID = MP.currentSessionMPIDs.indexOf(MP.mpid);

                if (MP.sessionId && MP.mpid && previousMPID !== MP.mpid && indexOfMPID < 0) {
                    MP.currentSessionMPIDs.push(MP.mpid);
                    // need to update currentSessionMPIDs in memory before checkingIdentitySwap otherwise previous obj.currentSessionMPIDs is used in checkIdentitySwap's Persistence.update()
                    Persistence.update();
                }

                if (indexOfMPID > -1) {
                    MP.currentSessionMPIDs = (MP.currentSessionMPIDs.slice(0, indexOfMPID)).concat(MP.currentSessionMPIDs.slice(indexOfMPID + 1, MP.currentSessionMPIDs.length));
                    MP.currentSessionMPIDs.push(MP.mpid);
                    Persistence.update();
                }

                CookieSyncManager.attemptCookieSync(previousMPID, MP.mpid);

                Identity.checkIdentitySwap(previousMPID, MP.mpid);

                // events exist in the eventQueue because they were triggered when the identityAPI request was in flight
                // once API request returns and there is an MPID, eventQueue items are reassigned with the returned MPID and flushed
                if (MP.eventQueue.length && MP.mpid) {
                    var localQueueCopy = MP.eventQueue;
                    MP.eventQueue = [];
                    localQueueCopy.forEach(function(event) {
                        event.MPID = MP.mpid;
                        sendEventToServer(event, sendEventToForwarders, Events.parseEventResponse);
                    });
                }

                //if there is any previous migration data
                if (Object.keys(MP.migrationData).length) {
                    MP.userIdentities = MP.migrationData.userIdentities || {};
                    MP.userAttributes = MP.migrationData.userAttributes || {};
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

            newUser = mParticle.Identity.getCurrentUser();

            if (identityApiData && identityApiData.onUserAlias && Helpers.Validators.isFunction(identityApiData.onUserAlias)) {
                try {
                    identityApiData.onUserAlias(prevUser, newUser);
                }
                catch (e) {
                    Helpers.logDebug('There was an error with your onUserAlias function - ' + e);
                }
            }
            var cookies = Persistence.getCookie() || Persistence.getLocalStorage();

            if (newUser) {
                Persistence.storeDataInMemory(cookies, newUser.getMPID());
                if (!prevUser || newUser.getMPID() !== prevUser.getMPID()) {
                    Forwarders.initForwarders(newUser.getUserIdentities().userIdentities);
                }
                Forwarders.setForwarderUserIdentities(newUser.getUserIdentities().userIdentities);
                Forwarders.setForwarderOnUserIdentified(newUser);
            }
        }

        if (callback) {
            Helpers.invokeCallback(callback, xhr.status, identityApiResult || null, newUser);
        } else {
            if (identityApiResult && identityApiResult.errors && identityApiResult.errors.length) {
                Helpers.logDebug('Received HTTP response code of ' + xhr.status + ' - ' + identityApiResult.errors[0].message);
            }
        }
    }
    catch (e) {
        if (callback) {
            Helpers.invokeCallback(callback, xhr.status, identityApiResult || null);
        }
        Helpers.logDebug('Error parsing JSON response from Identity server: ' + e);
    }
}

function checkCookieForMPID(currentMPID) {
    var cookies = Persistence.getCookie() || Persistence.getLocalStorage();
    if (cookies && !cookies[currentMPID]) {
        Persistence.storeDataInMemory(null, currentMPID);
        MP.cartProducts = [];
    } else if (cookies) {
        var products = Persistence.decodeProducts();
        if (products && products[currentMPID]) {
            MP.cartProducts = products[currentMPID].cp;
        }
        MP.userIdentities = cookies[currentMPID].ui || {};
        MP.userAttributes = cookies[currentMPID].ua || {};
        MP.cookieSyncDates = cookies[currentMPID].csd || {};
        MP.consentState = cookies[currentMPID].con;
    }
}

module.exports = {
    IdentityAPI: IdentityAPI,
    Identity: Identity,
    IdentityRequest: IdentityRequest,
    mParticleUser: mParticleUser,
    mParticleUserCart: mParticleUserCart
};
