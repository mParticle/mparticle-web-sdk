import Types from './types';
import Constants from './constants';
import * as utils from './utils';
import Validators from './validators';

var StorageNames = Constants.StorageNames;

export default function Helpers(mpInstance) {
    var self = this;
    this.canLog = function() {
        if (
            mpInstance._Store.isEnabled &&
            (mpInstance._Store.devToken ||
                mpInstance._Store.webviewBridgeEnabled)
        ) {
            return true;
        }

        return false;
    };

    this.getFeatureFlag = function(feature) {
        if (mpInstance._Store.SDKConfig.flags.hasOwnProperty(feature)) {
            return mpInstance._Store.SDKConfig.flags[feature];
        }
        return null;
    };

    /**
     * Returns a value between 1-100 inclusive.
     */
    this.getRampNumber = function(deviceId) {
        if (!deviceId) {
            return 100;
        }
        var hash = self.generateHash(deviceId);
        return Math.abs(hash % 100) + 1;
    };

    this.invokeCallback = function(
        callback,
        code,
        body,
        mParticleUser,
        previousMpid
    ) {
        if (!callback) {
            mpInstance.Logger.warning('There is no callback provided');
        }
        try {
            if (self.Validators.isFunction(callback)) {
                callback({
                    httpCode: code,
                    body: body,
                    getUser: function() {
                        if (mParticleUser) {
                            return mParticleUser;
                        } else {
                            return mpInstance.Identity.getCurrentUser();
                        }
                    },
                    getPreviousUser: function() {
                        if (!previousMpid) {
                            var users = mpInstance.Identity.getUsers();
                            var mostRecentUser = users.shift();
                            var currentUser =
                                mParticleUser ||
                                mpInstance.Identity.getCurrentUser();
                            if (
                                mostRecentUser &&
                                currentUser &&
                                mostRecentUser.getMPID() ===
                                    currentUser.getMPID()
                            ) {
                                mostRecentUser = users.shift();
                            }
                            return mostRecentUser || null;
                        } else {
                            return mpInstance.Identity.getUser(previousMpid);
                        }
                    },
                });
            }
        } catch (e) {
            mpInstance.Logger.error(
                'There was an error with your callback: ' + e
            );
        }
    };

    this.invokeAliasCallback = function(callback, code, message) {
        if (!callback) {
            mpInstance.Logger.warning('There is no callback provided');
        }
        try {
            if (self.Validators.isFunction(callback)) {
                var callbackMessage = {
                    httpCode: code,
                };
                if (message) {
                    callbackMessage.message = message;
                }
                callback(callbackMessage);
            }
        } catch (e) {
            mpInstance.Logger.error(
                'There was an error with your callback: ' + e
            );
        }
    };

    // Standalone version of jQuery.extend, from https://github.com/dansdom/extend
    this.extend = function() {
        var options,
            name,
            src,
            copy,
            copyIsArray,
            clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false,
            // helper which replicates the jquery internal functions
            objectHelper = {
                hasOwn: Object.prototype.hasOwnProperty,
                class2type: {},
                type: function(obj) {
                    return obj == null
                        ? String(obj)
                        : objectHelper.class2type[
                              Object.prototype.toString.call(obj)
                          ] || 'object';
                },
                isPlainObject: function(obj) {
                    if (
                        !obj ||
                        objectHelper.type(obj) !== 'object' ||
                        obj.nodeType ||
                        objectHelper.isWindow(obj)
                    ) {
                        return false;
                    }

                    try {
                        if (
                            obj.constructor &&
                            !objectHelper.hasOwn.call(obj, 'constructor') &&
                            !objectHelper.hasOwn.call(
                                obj.constructor.prototype,
                                'isPrototypeOf'
                            )
                        ) {
                            return false;
                        }
                    } catch (e) {
                        return false;
                    }

                    var key;
                    for (key in obj) {
                    } // eslint-disable-line no-empty

                    return (
                        key === undefined || objectHelper.hasOwn.call(obj, key)
                    );
                },
                isArray:
                    Array.isArray ||
                    function(obj) {
                        return objectHelper.type(obj) === 'array';
                    },
                isFunction: function(obj) {
                    return objectHelper.type(obj) === 'function';
                },
                isWindow: function(obj) {
                    return obj != null && obj == obj.window;
                },
            }; // end of objectHelper

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
                    if (
                        deep &&
                        copy &&
                        (objectHelper.isPlainObject(copy) ||
                            (copyIsArray = objectHelper.isArray(copy)))
                    ) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && objectHelper.isArray(src) ? src : [];
                        } else {
                            clone =
                                src && objectHelper.isPlainObject(src)
                                    ? src
                                    : {};
                        }

                        // Never move original objects, clone them
                        target[name] = self.extend(deep, clone, copy);

                        // Don't bring in undefined values
                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }

        // Return the modified object
        return target;
    };

    this.createServiceUrl = function(secureServiceUrl, devToken) {
        var serviceScheme =
            window.mParticle && mpInstance._Store.SDKConfig.forceHttps
                ? 'https://'
                : window.location.protocol + '//';
        var baseUrl;
        if (mpInstance._Store.SDKConfig.forceHttps) {
            baseUrl = 'https://' + secureServiceUrl;
        } else {
            baseUrl = serviceScheme + secureServiceUrl;
        }
        if (devToken) {
            baseUrl = baseUrl + devToken;
        }
        return baseUrl;
    };

    this.createXHR = function(cb) {
        var xhr;

        try {
            xhr = new window.XMLHttpRequest();
        } catch (e) {
            mpInstance.Logger.error('Error creating XMLHttpRequest object.');
        }

        if (xhr && cb && 'withCredentials' in xhr) {
            xhr.onreadystatechange = cb;
        } else if (typeof window.XDomainRequest !== 'undefined') {
            mpInstance.Logger.verbose('Creating XDomainRequest object');

            try {
                xhr = new window.XDomainRequest();
                xhr.onload = cb;
            } catch (e) {
                mpInstance.Logger.error('Error creating XDomainRequest object');
            }
        }

        return xhr;
    };

    function generateRandomValue(a) {
        var randomValue;
        if (window.crypto && window.crypto.getRandomValues) {
            randomValue = window.crypto.getRandomValues(new Uint8Array(1)); // eslint-disable-line no-undef
        }
        if (randomValue) {
            return (a ^ (randomValue[0] % 16 >> (a / 4))).toString(16);
        }

        return (a ^ ((Math.random() * 16) >> (a / 4))).toString(16);
    }

    this.generateUniqueId = function(a) {
        // https://gist.github.com/jed/982883
        // Added support for crypto for better random

        return a // if the placeholder was passed, return
            ? generateRandomValue(a) // a random number
            : // or otherwise a concatenated string:
              (
                  [1e7] + // 10000000 +
                  -1e3 + // -1000 +
                  -4e3 + // -4000 +
                  -8e3 + // -80000000 +
                  -1e11
              ) // -100000000000,
                  .replace(
                      // replacing
                      /[018]/g, // zeroes, ones, and eights with
                      self.generateUniqueId // random hex digits
                  );
    };

    this.filterUserIdentities = function(userIdentitiesObject, filterList) {
        var filteredUserIdentities = [];

        if (userIdentitiesObject && Object.keys(userIdentitiesObject).length) {
            for (var userIdentityName in userIdentitiesObject) {
                if (userIdentitiesObject.hasOwnProperty(userIdentityName)) {
                    var userIdentityType = Types.IdentityType.getIdentityType(
                        userIdentityName
                    );
                    if (!self.inArray(filterList, userIdentityType)) {
                        var identity = {
                            Type: userIdentityType,
                            Identity: userIdentitiesObject[userIdentityName],
                        };
                        if (
                            userIdentityType === Types.IdentityType.CustomerId
                        ) {
                            filteredUserIdentities.unshift(identity);
                        } else {
                            filteredUserIdentities.push(identity);
                        }
                    }
                }
            }
        }

        return filteredUserIdentities;
    };

    this.filterUserIdentitiesForForwarders = function(
        userIdentitiesObject,
        filterList
    ) {
        var filteredUserIdentities = {};

        if (userIdentitiesObject && Object.keys(userIdentitiesObject).length) {
            for (var userIdentityName in userIdentitiesObject) {
                if (userIdentitiesObject.hasOwnProperty(userIdentityName)) {
                    var userIdentityType = Types.IdentityType.getIdentityType(
                        userIdentityName
                    );
                    if (!self.inArray(filterList, userIdentityType)) {
                        filteredUserIdentities[userIdentityName] =
                            userIdentitiesObject[userIdentityName];
                    }
                }
            }
        }

        return filteredUserIdentities;
    };

    this.filterUserAttributes = function(userAttributes, filterList) {
        var filteredUserAttributes = {};

        if (userAttributes && Object.keys(userAttributes).length) {
            for (var userAttribute in userAttributes) {
                if (userAttributes.hasOwnProperty(userAttribute)) {
                    var hashedUserAttribute = self.generateHash(userAttribute);
                    if (!self.inArray(filterList, hashedUserAttribute)) {
                        filteredUserAttributes[userAttribute] =
                            userAttributes[userAttribute];
                    }
                }
            }
        }

        return filteredUserAttributes;
    };

    this.isEventType = function(type) {
        for (var prop in Types.EventType) {
            if (Types.EventType.hasOwnProperty(prop)) {
                if (Types.EventType[prop] === type) {
                    return true;
                }
            }
        }
        return false;
    };

    this.generateHash = function(name) {
        var hash = 0,
            i = 0,
            character;

        if (name === undefined || name === null) {
            return 0;
        }

        name = name.toString().toLowerCase();

        if (Array.prototype.reduce) {
            return name.split('').reduce(function(a, b) {
                a = (a << 5) - a + b.charCodeAt(0);
                return a & a;
            }, 0);
        }

        if (name.length === 0) {
            return hash;
        }

        for (i = 0; i < name.length; i++) {
            character = name.charCodeAt(i);
            hash = (hash << 5) - hash + character;
            hash = hash & hash;
        }

        return hash;
    };

    this.sanitizeAttributes = function(attrs, name) {
        if (!attrs || !self.isObject(attrs)) {
            return null;
        }

        var sanitizedAttrs = {};

        for (var prop in attrs) {
            // Make sure that attribute values are not objects or arrays, which are not valid
            if (
                attrs.hasOwnProperty(prop) &&
                self.Validators.isValidAttributeValue(attrs[prop])
            ) {
                sanitizedAttrs[prop] = attrs[prop];
            } else {
                mpInstance.Logger.warning(
                    "For '" +
                        name +
                        "', the corresponding attribute value of '" +
                        prop +
                        "' must be a string, number, boolean, or null."
                );
            }
        }

        return sanitizedAttrs;
    };

    this.isDelayedByIntegration = function(
        delayedIntegrations,
        timeoutStart,
        now
    ) {
        if (
            now - timeoutStart >
            mpInstance._Store.SDKConfig.integrationDelayTimeout
        ) {
            return false;
        }
        for (var integration in delayedIntegrations) {
            if (delayedIntegrations[integration] === true) {
                return true;
            } else {
                continue;
            }
        }
        return false;
    };

    this.createMainStorageName = function(workspaceToken) {
        if (workspaceToken) {
            return StorageNames.currentStorageName + '_' + workspaceToken;
        } else {
            return StorageNames.currentStorageName;
        }
    };

    this.createProductStorageName = function(workspaceToken) {
        if (workspaceToken) {
            return (
                StorageNames.currentStorageProductsName + '_' + workspaceToken
            );
        } else {
            return StorageNames.currentStorageProductsName;
        }
    };

    // Utility Functions
    this.converted = utils.converted;
    this.findKeyInObject = utils.findKeyInObject;
    this.parseNumber = utils.parseNumber;
    this.inArray = utils.inArray;
    this.isObject = utils.isObject;
    this.decoded = utils.decoded;
    this.returnConvertedBoolean = utils.returnConvertedBoolean;
    this.parseStringOrNumber = utils.parseStringOrNumber;

    // Imported Validators
    this.Validators = Validators;
}
