import Constants from './constants';
import Types from './types';

var Messages = Constants.Messages,
    HTTPCodes = Constants.HTTPCodes;

export default function Identity(mpInstance) {
    var self = this;
    this.checkIdentitySwap = function(
        previousMPID,
        currentMPID,
        currentSessionMPIDs
    ) {
        if (previousMPID && currentMPID && previousMPID !== currentMPID) {
            var persistence = mpInstance._Persistence.getPersistence();
            if (persistence) {
                persistence.cu = currentMPID;
                persistence.gs.csm = currentSessionMPIDs;
                mpInstance._Persistence.savePersistence(persistence);
            }
        }
    };

    this.IdentityRequest = {
        createKnownIdentities: function(identityApiData, deviceId) {
            var identitiesResult = {};

            if (
                identityApiData &&
                identityApiData.userIdentities &&
                mpInstance._Helpers.isObject(identityApiData.userIdentities)
            ) {
                for (var identity in identityApiData.userIdentities) {
                    identitiesResult[identity] =
                        identityApiData.userIdentities[identity];
                }
            }
            identitiesResult.device_application_stamp = deviceId;

            return identitiesResult;
        },

        preProcessIdentityRequest: function(identityApiData, callback, method) {
            mpInstance.Logger.verbose(
                Messages.InformationMessages.StartingLogEvent + ': ' + method
            );

            var identityValidationResult = mpInstance._Helpers.Validators.validateIdentities(
                identityApiData,
                method
            );

            if (!identityValidationResult.valid) {
                mpInstance.Logger.error(
                    'ERROR: ' + identityValidationResult.error
                );
                return {
                    valid: false,
                    error: identityValidationResult.error,
                };
            }

            if (
                callback &&
                !mpInstance._Helpers.Validators.isFunction(callback)
            ) {
                var error =
                    'The optional callback must be a function. You tried entering a(n) ' +
                    typeof callback;
                mpInstance.Logger.error(error);
                return {
                    valid: false,
                    error: error,
                };
            }

            return {
                valid: true,
            };
        },

        createIdentityRequest: function(
            identityApiData,
            platform,
            sdkVendor,
            sdkVersion,
            deviceId,
            context,
            mpid
        ) {
            var APIRequest = {
                client_sdk: {
                    platform: platform,
                    sdk_vendor: sdkVendor,
                    sdk_version: sdkVersion,
                },
                context: context,
                environment: mpInstance._Store.SDKConfig.isDevelopmentMode
                    ? 'development'
                    : 'production',
                request_id: mpInstance._Helpers.generateUniqueId(),
                request_timestamp_ms: new Date().getTime(),
                previous_mpid: mpid || null,
                known_identities: this.createKnownIdentities(
                    identityApiData,
                    deviceId
                ),
            };

            return APIRequest;
        },

        createModifyIdentityRequest: function(
            currentUserIdentities,
            newUserIdentities,
            platform,
            sdkVendor,
            sdkVersion,
            context
        ) {
            return {
                client_sdk: {
                    platform: platform,
                    sdk_vendor: sdkVendor,
                    sdk_version: sdkVersion,
                },
                context: context,
                environment: mpInstance._Store.SDKConfig.isDevelopmentMode
                    ? 'development'
                    : 'production',
                request_id: mpInstance._Helpers.generateUniqueId(),
                request_timestamp_ms: new Date().getTime(),
                identity_changes: this.createIdentityChanges(
                    currentUserIdentities,
                    newUserIdentities
                ),
            };
        },

        createIdentityChanges: function(previousIdentities, newIdentities) {
            var identityChanges = [];
            var key;
            if (
                newIdentities &&
                mpInstance._Helpers.isObject(newIdentities) &&
                previousIdentities &&
                mpInstance._Helpers.isObject(previousIdentities)
            ) {
                for (key in newIdentities) {
                    identityChanges.push({
                        old_value: previousIdentities[key] || null,
                        new_value: newIdentities[key],
                        identity_type: key,
                    });
                }
            }

            return identityChanges;
        },

        // takes 2 UI objects keyed by name, combines them, returns them keyed by type
        combineUserIdentities: function(previousUIByName, newUIByName) {
            var combinedUIByType = {};

            var combinedUIByName = mpInstance._Helpers.extend(
                previousUIByName,
                newUIByName
            );

            for (var key in combinedUIByName) {
                var type = Types.IdentityType.getIdentityType(key);
                // this check removes anything that is not whitelisted as an identity type
                if (type !== false && type >= 0) {
                    combinedUIByType[Types.IdentityType.getIdentityType(key)] =
                        combinedUIByName[key];
                }
            }

            return combinedUIByType;
        },

        createAliasNetworkRequest: function(aliasRequest) {
            return {
                request_id: mpInstance._Helpers.generateUniqueId(),
                request_type: 'alias',
                environment: mpInstance._Store.SDKConfig.isDevelopmentMode
                    ? 'development'
                    : 'production',
                api_key: mpInstance._Store.devToken,
                data: {
                    destination_mpid: aliasRequest.destinationMpid,
                    source_mpid: aliasRequest.sourceMpid,
                    start_unixtime_ms: aliasRequest.startTime,
                    end_unixtime_ms: aliasRequest.endTime,
                    device_application_stamp: mpInstance._Store.deviceId,
                },
            };
        },

        convertAliasToNative: function(aliasRequest) {
            return {
                DestinationMpid: aliasRequest.destinationMpid,
                SourceMpid: aliasRequest.sourceMpid,
                StartUnixtimeMs: aliasRequest.startTime,
                EndUnixtimeMs: aliasRequest.endTime,
            };
        },

        convertToNative: function(identityApiData) {
            var nativeIdentityRequest = [];
            if (identityApiData && identityApiData.userIdentities) {
                for (var key in identityApiData.userIdentities) {
                    if (identityApiData.userIdentities.hasOwnProperty(key)) {
                        nativeIdentityRequest.push({
                            Type: Types.IdentityType.getIdentityType(key),
                            Identity: identityApiData.userIdentities[key],
                        });
                    }
                }

                return {
                    UserIdentities: nativeIdentityRequest,
                };
            }
        },
    };
    /**
     * Invoke these methods on the mParticle.Identity object.
     * Example: mParticle.Identity.getCurrentUser().
     * @class mParticle.Identity
     */
    this.IdentityAPI = {
        HTTPCodes: HTTPCodes,
        /**
         * Initiate a logout request to the mParticle server
         * @method identify
         * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
         * @param {Function} [callback] A callback function that is called when the identify request completes
         */
        identify: function(identityApiData, callback) {
            var mpid,
                currentUser = mpInstance.Identity.getCurrentUser(),
                preProcessResult = mpInstance._Identity.IdentityRequest.preProcessIdentityRequest(
                    identityApiData,
                    callback,
                    'identify'
                );
            if (currentUser) {
                mpid = currentUser.getMPID();
            }

            if (preProcessResult.valid) {
                var identityApiRequest = mpInstance._Identity.IdentityRequest.createIdentityRequest(
                    identityApiData,
                    Constants.platform,
                    Constants.sdkVendor,
                    Constants.sdkVersion,
                    mpInstance._Store.deviceId,
                    mpInstance._Store.context,
                    mpid
                );

                if (mpInstance._Helpers.canLog()) {
                    if (mpInstance._Store.webviewBridgeEnabled) {
                        mpInstance._NativeSdkHelpers.sendToNative(
                            Constants.NativeSdkPaths.Identify,
                            JSON.stringify(
                                mpInstance._Identity.IdentityRequest.convertToNative(
                                    identityApiData
                                )
                            )
                        );
                        mpInstance._Helpers.invokeCallback(
                            callback,
                            HTTPCodes.nativeIdentityRequest,
                            'Identify request sent to native sdk'
                        );
                    } else {
                        mpInstance._IdentityAPIClient.sendIdentityRequest(
                            identityApiRequest,
                            'identify',
                            callback,
                            identityApiData,
                            self.parseIdentityResponse,
                            mpid
                        );
                    }
                } else {
                    mpInstance._Helpers.invokeCallback(
                        callback,
                        HTTPCodes.loggingDisabledOrMissingAPIKey,
                        Messages.InformationMessages.AbandonLogEvent
                    );
                    mpInstance.Logger.verbose(
                        Messages.InformationMessages.AbandonLogEvent
                    );
                }
            } else {
                mpInstance._Helpers.invokeCallback(
                    callback,
                    HTTPCodes.validationIssue,
                    preProcessResult.error
                );
                mpInstance.Logger.verbose(preProcessResult);
            }
        },
        /**
         * Initiate a logout request to the mParticle server
         * @method logout
         * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
         * @param {Function} [callback] A callback function that is called when the logout request completes
         */
        logout: function(identityApiData, callback) {
            var mpid,
                currentUser = mpInstance.Identity.getCurrentUser(),
                preProcessResult = mpInstance._Identity.IdentityRequest.preProcessIdentityRequest(
                    identityApiData,
                    callback,
                    'logout'
                );
            if (currentUser) {
                mpid = currentUser.getMPID();
            }

            if (preProcessResult.valid) {
                var evt,
                    identityApiRequest = mpInstance._Identity.IdentityRequest.createIdentityRequest(
                        identityApiData,
                        Constants.platform,
                        Constants.sdkVendor,
                        Constants.sdkVersion,
                        mpInstance._Store.deviceId,
                        mpInstance._Store.context,
                        mpid
                    );

                if (mpInstance._Helpers.canLog()) {
                    if (mpInstance._Store.webviewBridgeEnabled) {
                        mpInstance._NativeSdkHelpers.sendToNative(
                            Constants.NativeSdkPaths.Logout,
                            JSON.stringify(
                                mpInstance._Identity.IdentityRequest.convertToNative(
                                    identityApiData
                                )
                            )
                        );
                        mpInstance._Helpers.invokeCallback(
                            callback,
                            HTTPCodes.nativeIdentityRequest,
                            'Logout request sent to native sdk'
                        );
                    } else {
                        mpInstance._IdentityAPIClient.sendIdentityRequest(
                            identityApiRequest,
                            'logout',
                            callback,
                            identityApiData,
                            self.parseIdentityResponse,
                            mpid
                        );
                        evt = mpInstance._ServerModel.createEventObject({
                            messageType: Types.MessageType.Profile,
                        });

                        evt.ProfileMessageType =
                            Types.ProfileMessageType.Logout;
                        if (mpInstance._Store.activeForwarders.length) {
                            mpInstance._Store.activeForwarders.forEach(function(
                                forwarder
                            ) {
                                if (forwarder.logOut) {
                                    forwarder.logOut(evt);
                                }
                            });
                        }
                    }
                } else {
                    mpInstance._Helpers.invokeCallback(
                        callback,
                        HTTPCodes.loggingDisabledOrMissingAPIKey,
                        Messages.InformationMessages.AbandonLogEvent
                    );
                    mpInstance.Logger.verbose(
                        Messages.InformationMessages.AbandonLogEvent
                    );
                }
            } else {
                mpInstance._Helpers.invokeCallback(
                    callback,
                    HTTPCodes.validationIssue,
                    preProcessResult.error
                );
                mpInstance.Logger.verbose(preProcessResult);
            }
        },
        /**
         * Initiate a login request to the mParticle server
         * @method login
         * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
         * @param {Function} [callback] A callback function that is called when the login request completes
         */
        login: function(identityApiData, callback) {
            var mpid,
                currentUser = mpInstance.Identity.getCurrentUser(),
                preProcessResult = mpInstance._Identity.IdentityRequest.preProcessIdentityRequest(
                    identityApiData,
                    callback,
                    'login'
                );
            if (currentUser) {
                mpid = currentUser.getMPID();
            }

            if (preProcessResult.valid) {
                var identityApiRequest = mpInstance._Identity.IdentityRequest.createIdentityRequest(
                    identityApiData,
                    Constants.platform,
                    Constants.sdkVendor,
                    Constants.sdkVersion,
                    mpInstance._Store.deviceId,
                    mpInstance._Store.context,
                    mpid
                );

                if (mpInstance._Helpers.canLog()) {
                    if (mpInstance._Store.webviewBridgeEnabled) {
                        mpInstance._NativeSdkHelpers.sendToNative(
                            Constants.NativeSdkPaths.Login,
                            JSON.stringify(
                                mpInstance._Identity.IdentityRequest.convertToNative(
                                    identityApiData
                                )
                            )
                        );
                        mpInstance._Helpers.invokeCallback(
                            callback,
                            HTTPCodes.nativeIdentityRequest,
                            'Login request sent to native sdk'
                        );
                    } else {
                        mpInstance._IdentityAPIClient.sendIdentityRequest(
                            identityApiRequest,
                            'login',
                            callback,
                            identityApiData,
                            self.parseIdentityResponse,
                            mpid
                        );
                    }
                } else {
                    mpInstance._Helpers.invokeCallback(
                        callback,
                        HTTPCodes.loggingDisabledOrMissingAPIKey,
                        Messages.InformationMessages.AbandonLogEvent
                    );
                    mpInstance.Logger.verbose(
                        Messages.InformationMessages.AbandonLogEvent
                    );
                }
            } else {
                mpInstance._Helpers.invokeCallback(
                    callback,
                    HTTPCodes.validationIssue,
                    preProcessResult.error
                );
                mpInstance.Logger.verbose(preProcessResult);
            }
        },
        /**
         * Initiate a modify request to the mParticle server
         * @method modify
         * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
         * @param {Function} [callback] A callback function that is called when the modify request completes
         */
        modify: function(identityApiData, callback) {
            var mpid,
                currentUser = mpInstance.Identity.getCurrentUser(),
                preProcessResult = mpInstance._Identity.IdentityRequest.preProcessIdentityRequest(
                    identityApiData,
                    callback,
                    'modify'
                );
            if (currentUser) {
                mpid = currentUser.getMPID();
            }
            var newUserIdentities =
                identityApiData && identityApiData.userIdentities
                    ? identityApiData.userIdentities
                    : {};
            if (preProcessResult.valid) {
                var identityApiRequest = mpInstance._Identity.IdentityRequest.createModifyIdentityRequest(
                    currentUser
                        ? currentUser.getUserIdentities().userIdentities
                        : {},
                    newUserIdentities,
                    Constants.platform,
                    Constants.sdkVendor,
                    Constants.sdkVersion,
                    mpInstance._Store.context
                );

                if (mpInstance._Helpers.canLog()) {
                    if (mpInstance._Store.webviewBridgeEnabled) {
                        mpInstance._NativeSdkHelpers.sendToNative(
                            Constants.NativeSdkPaths.Modify,
                            JSON.stringify(
                                mpInstance._Identity.IdentityRequest.convertToNative(
                                    identityApiData
                                )
                            )
                        );
                        mpInstance._Helpers.invokeCallback(
                            callback,
                            HTTPCodes.nativeIdentityRequest,
                            'Modify request sent to native sdk'
                        );
                    } else {
                        mpInstance._IdentityAPIClient.sendIdentityRequest(
                            identityApiRequest,
                            'modify',
                            callback,
                            identityApiData,
                            self.parseIdentityResponse,
                            mpid
                        );
                    }
                } else {
                    mpInstance._Helpers.invokeCallback(
                        callback,
                        HTTPCodes.loggingDisabledOrMissingAPIKey,
                        Messages.InformationMessages.AbandonLogEvent
                    );
                    mpInstance.Logger.verbose(
                        Messages.InformationMessages.AbandonLogEvent
                    );
                }
            } else {
                mpInstance._Helpers.invokeCallback(
                    callback,
                    HTTPCodes.validationIssue,
                    preProcessResult.error
                );
                mpInstance.Logger.verbose(preProcessResult);
            }
        },
        /**
         * Returns a user object with methods to interact with the current user
         * @method getCurrentUser
         * @return {Object} the current user object
         */
        getCurrentUser: function() {
            var mpid;
            if (mpInstance._Store) {
                mpid = mpInstance._Store.mpid;
                if (mpid) {
                    mpid = mpInstance._Store.mpid.slice();
                    return self.mParticleUser(
                        mpid,
                        mpInstance._Store.isLoggedIn
                    );
                } else if (mpInstance._Store.webviewBridgeEnabled) {
                    return self.mParticleUser();
                } else {
                    return null;
                }
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
            var persistence = mpInstance._Persistence.getPersistence();
            if (persistence) {
                if (
                    persistence[mpid] &&
                    !Constants.SDKv2NonMPIDCookieKeys.hasOwnProperty(mpid)
                ) {
                    return self.mParticleUser(mpid);
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
            var persistence = mpInstance._Persistence.getPersistence();
            var users = [];
            if (persistence) {
                for (var key in persistence) {
                    if (!Constants.SDKv2NonMPIDCookieKeys.hasOwnProperty(key)) {
                        users.push(self.mParticleUser(key));
                    }
                }
            }
            users.sort(function(a, b) {
                var aLastSeen = a.getLastSeenTime() || 0;
                var bLastSeen = b.getLastSeenTime() || 0;
                if (aLastSeen > bLastSeen) {
                    return -1;
                } else {
                    return 1;
                }
            });
            return users;
        },

        /**
         * Initiate an alias request to the mParticle server
         * @method aliasUsers
         * @param {Object} aliasRequest  object representing an AliasRequest
         * @param {Function} [callback] A callback function that is called when the aliasUsers request completes
         */
        aliasUsers: function(aliasRequest, callback) {
            var message;
            if (!aliasRequest.destinationMpid || !aliasRequest.sourceMpid) {
                message = Messages.ValidationMessages.AliasMissingMpid;
            }
            if (aliasRequest.destinationMpid === aliasRequest.sourceMpid) {
                message = Messages.ValidationMessages.AliasNonUniqueMpid;
            }
            if (!aliasRequest.startTime || !aliasRequest.endTime) {
                message = Messages.ValidationMessages.AliasMissingTime;
            }
            if (aliasRequest.startTime > aliasRequest.endTime) {
                message = Messages.ValidationMessages.AliasStartBeforeEndTime;
            }
            if (message) {
                mpInstance.Logger.warning(message);
                mpInstance._Helpers.invokeAliasCallback(
                    callback,
                    HTTPCodes.validationIssue,
                    message
                );
                return;
            }
            if (mpInstance._Helpers.canLog()) {
                if (mpInstance._Store.webviewBridgeEnabled) {
                    mpInstance._NativeSdkHelpers.sendToNative(
                        Constants.NativeSdkPaths.Alias,
                        JSON.stringify(
                            mpInstance._Identity.IdentityRequest.convertAliasToNative(
                                aliasRequest
                            )
                        )
                    );
                    mpInstance._Helpers.invokeAliasCallback(
                        callback,
                        HTTPCodes.nativeIdentityRequest,
                        'Alias request sent to native sdk'
                    );
                } else {
                    mpInstance.Logger.verbose(
                        Messages.InformationMessages.StartingAliasRequest +
                            ': ' +
                            aliasRequest.sourceMpid +
                            ' -> ' +
                            aliasRequest.destinationMpid
                    );
                    var aliasRequestMessage = mpInstance._Identity.IdentityRequest.createAliasNetworkRequest(
                        aliasRequest
                    );
                    mpInstance._IdentityAPIClient.sendAliasRequest(
                        aliasRequestMessage,
                        callback
                    );
                }
            } else {
                mpInstance._Helpers.invokeAliasCallback(
                    callback,
                    HTTPCodes.loggingDisabledOrMissingAPIKey,
                    Messages.InformationMessages.AbandonAliasUsers
                );
                mpInstance.Logger.verbose(
                    Messages.InformationMessages.AbandonAliasUsers
                );
            }
        },

        /**
         Create a default AliasRequest for 2 MParticleUsers. This will construct the request
        using the sourceUser's firstSeenTime as the startTime, and its lastSeenTime as the endTime.
        
        In the unlikely scenario that the sourceUser does not have a firstSeenTime, which will only
        be the case if they have not been the current user since this functionality was added, the 
        startTime will be populated with the earliest firstSeenTime out of any stored user. Similarly,
        if the sourceUser does not have a lastSeenTime, the endTime will be populated with the current time
        
        There is a limit to how old the startTime can be, represented by the config field 'aliasMaxWindow', in days.
        If the startTime falls before the limit, it will be adjusted to the oldest allowed startTime. 
        In rare cases, where the sourceUser's lastSeenTime also falls outside of the aliasMaxWindow limit, 
        after applying this adjustment it will be impossible to create an aliasRequest passes the aliasUsers() 
        validation that the startTime must be less than the endTime 
        */
        createAliasRequest: function(sourceUser, destinationUser) {
            try {
                if (!destinationUser || !sourceUser) {
                    mpInstance.Logger.error(
                        "'destinationUser' and 'sourceUser' must both be present"
                    );
                    return null;
                }
                var startTime = sourceUser.getFirstSeenTime();
                if (!startTime) {
                    mpInstance.Identity.getUsers().forEach(function(user) {
                        if (
                            user.getFirstSeenTime() &&
                            (!startTime || user.getFirstSeenTime() < startTime)
                        ) {
                            startTime = user.getFirstSeenTime();
                        }
                    });
                }
                var minFirstSeenTimeMs =
                    new Date().getTime() -
                    mpInstance._Store.SDKConfig.aliasMaxWindow *
                        24 *
                        60 *
                        60 *
                        1000;
                var endTime =
                    sourceUser.getLastSeenTime() || new Date().getTime();
                //if the startTime is greater than $maxAliasWindow ago, adjust the startTime to the earliest allowed
                if (startTime < minFirstSeenTimeMs) {
                    startTime = minFirstSeenTimeMs;
                    if (endTime < startTime) {
                        mpInstance.Logger.warning(
                            'Source User has not been seen in the last ' +
                                mpInstance._Store.SDKConfig.maxAliasWindow +
                                ' days, Alias Request will likely fail'
                        );
                    }
                }
                return {
                    destinationMpid: destinationUser.getMPID(),
                    sourceMpid: sourceUser.getMPID(),
                    startTime: startTime,
                    endTime: endTime,
                };
            } catch (e) {
                mpInstance.Logger.error(
                    'There was a problem with creating an alias request: ' + e
                );
                return null;
            }
        },
    };

    /**
     * Invoke these methods on the mParticle.Identity.getCurrentUser() object.
     * Example: mParticle.Identity.getCurrentUser().getAllUserAttributes()
     * @class mParticle.Identity.getCurrentUser()
     */
    this.mParticleUser = function(mpid, isLoggedIn) {
        var self = this;
        return {
            /**
             * Get user identities for current user
             * @method getUserIdentities
             * @return {Object} an object with userIdentities as its key
             */
            getUserIdentities: function() {
                var currentUserIdentities = {};

                var identities = mpInstance._Persistence.getUserIdentities(
                    mpid
                );

                for (var identityType in identities) {
                    if (identities.hasOwnProperty(identityType)) {
                        currentUserIdentities[
                            Types.IdentityType.getIdentityName(
                                mpInstance._Helpers.parseNumber(identityType)
                            )
                        ] = identities[identityType];
                    }
                }

                return {
                    userIdentities: currentUserIdentities,
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
                if (!mpInstance._Helpers.Validators.isValidKeyValue(tagName)) {
                    mpInstance.Logger.error(Messages.ErrorMessages.BadKey);
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
                if (!mpInstance._Helpers.Validators.isValidKeyValue(tagName)) {
                    mpInstance.Logger.error(Messages.ErrorMessages.BadKey);
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
            setUserAttribute: function(key, newValue) {
                var cookies,
                    userAttributes,
                    previousUserAttributeValue,
                    isNewAttribute;

                mpInstance._SessionManager.resetSessionTimer();

                if (mpInstance._Helpers.canLog()) {
                    if (
                        !mpInstance._Helpers.Validators.isValidAttributeValue(
                            newValue
                        )
                    ) {
                        mpInstance.Logger.error(
                            Messages.ErrorMessages.BadAttribute
                        );
                        return;
                    }

                    if (!mpInstance._Helpers.Validators.isValidKeyValue(key)) {
                        mpInstance.Logger.error(Messages.ErrorMessages.BadKey);
                        return;
                    }
                    if (mpInstance._Store.webviewBridgeEnabled) {
                        mpInstance._NativeSdkHelpers.sendToNative(
                            Constants.NativeSdkPaths.SetUserAttribute,
                            JSON.stringify({ key: key, value: newValue })
                        );
                    } else {
                        cookies = mpInstance._Persistence.getPersistence();

                        userAttributes = this.getAllUserAttributes();

                        var existingProp = mpInstance._Helpers.findKeyInObject(
                            userAttributes,
                            key
                        );

                        if (existingProp) {
                            isNewAttribute = false;
                            previousUserAttributeValue =
                                userAttributes[existingProp];
                            delete userAttributes[existingProp];
                        } else {
                            isNewAttribute = true;
                        }

                        userAttributes[key] = newValue;
                        if (cookies && cookies[mpid]) {
                            cookies[mpid].ua = userAttributes;
                            mpInstance._Persistence.savePersistence(
                                cookies,
                                mpid
                            );
                        }

                        self.sendUserAttributeChangeEvent(
                            key,
                            newValue,
                            previousUserAttributeValue,
                            isNewAttribute,
                            false,
                            this
                        );

                        mpInstance._Forwarders.initForwarders(
                            self.IdentityAPI.getCurrentUser().getUserIdentities(),
                            mpInstance._APIClient.prepareForwardingStats
                        );
                        mpInstance._Forwarders.callSetUserAttributeOnForwarders(
                            key,
                            newValue
                        );
                    }
                }
            },
            /**
             * Set multiple user attributes
             * @method setUserAttributes
             * @param {Object} user attribute object with keys of the attribute type, and value of the attribute value
             */
            setUserAttributes: function(userAttributes) {
                mpInstance._SessionManager.resetSessionTimer();
                if (mpInstance._Helpers.isObject(userAttributes)) {
                    if (mpInstance._Helpers.canLog()) {
                        for (var key in userAttributes) {
                            if (userAttributes.hasOwnProperty(key)) {
                                this.setUserAttribute(key, userAttributes[key]);
                            }
                        }
                    }
                } else {
                    mpInstance.Logger.error(
                        'Must pass an object into setUserAttributes. You passed a ' +
                            typeof userAttributes
                    );
                }
            },
            /**
             * Removes a specific user attribute
             * @method removeUserAttribute
             * @param {String} key
             */
            removeUserAttribute: function(key) {
                var cookies, userAttributes;
                mpInstance._SessionManager.resetSessionTimer();

                if (!mpInstance._Helpers.Validators.isValidKeyValue(key)) {
                    mpInstance.Logger.error(Messages.ErrorMessages.BadKey);
                    return;
                }

                if (mpInstance._Store.webviewBridgeEnabled) {
                    mpInstance._NativeSdkHelpers.sendToNative(
                        Constants.NativeSdkPaths.RemoveUserAttribute,
                        JSON.stringify({ key: key, value: null })
                    );
                } else {
                    cookies = mpInstance._Persistence.getPersistence();

                    userAttributes = this.getAllUserAttributes();

                    var existingProp = mpInstance._Helpers.findKeyInObject(
                        userAttributes,
                        key
                    );

                    if (existingProp) {
                        key = existingProp;
                    }

                    var deletedUAKeyCopy = userAttributes[key]
                        ? userAttributes[key].toString()
                        : null;

                    delete userAttributes[key];

                    if (cookies && cookies[mpid]) {
                        cookies[mpid].ua = userAttributes;
                        mpInstance._Persistence.savePersistence(cookies, mpid);
                    }

                    self.sendUserAttributeChangeEvent(
                        key,
                        null,
                        deletedUAKeyCopy,
                        false,
                        true,
                        this
                    );

                    mpInstance._Forwarders.initForwarders(
                        self.IdentityAPI.getCurrentUser().getUserIdentities(),
                        mpInstance._APIClient.prepareForwardingStats
                    );
                    mpInstance._Forwarders.applyToForwarders(
                        'removeUserAttribute',
                        key
                    );
                }
            },
            /**
             * Sets a list of user attributes
             * @method setUserAttributeList
             * @param {String} key
             * @param {Array} value an array of values
             */
            setUserAttributeList: function(key, newValue) {
                var cookies,
                    userAttributes,
                    previousUserAttributeValue,
                    isNewAttribute,
                    userAttributeChange;

                mpInstance._SessionManager.resetSessionTimer();

                if (!mpInstance._Helpers.Validators.isValidKeyValue(key)) {
                    mpInstance.Logger.error(Messages.ErrorMessages.BadKey);
                    return;
                }

                if (!Array.isArray(newValue)) {
                    mpInstance.Logger.error(
                        'The value you passed in to setUserAttributeList must be an array. You passed in a ' +
                            typeof value
                    );
                    return;
                }

                var arrayCopy = newValue.slice();

                if (mpInstance._Store.webviewBridgeEnabled) {
                    mpInstance._NativeSdkHelpers.sendToNative(
                        Constants.NativeSdkPaths.SetUserAttributeList,
                        JSON.stringify({ key: key, value: arrayCopy })
                    );
                } else {
                    cookies = mpInstance._Persistence.getPersistence();

                    userAttributes = this.getAllUserAttributes();

                    var existingProp = mpInstance._Helpers.findKeyInObject(
                        userAttributes,
                        key
                    );

                    if (existingProp) {
                        isNewAttribute = false;
                        previousUserAttributeValue =
                            userAttributes[existingProp];
                        delete userAttributes[existingProp];
                    } else {
                        isNewAttribute = true;
                    }

                    userAttributes[key] = arrayCopy;
                    if (cookies && cookies[mpid]) {
                        cookies[mpid].ua = userAttributes;
                        mpInstance._Persistence.savePersistence(cookies, mpid);
                    }

                    if (mpInstance._APIClient.shouldEnableBatching()) {
                        // If the new attributeList length is different previous, then there is a change event.
                        // Loop through new attributes list, see if they are all in the same index as previous user attributes list
                        // If there are any changes, break, and immediately send a userAttributeChangeEvent with full array as a value
                        if (
                            !previousUserAttributeValue ||
                            !Array.isArray(previousUserAttributeValue)
                        ) {
                            userAttributeChange = true;
                        } else if (
                            newValue.length !==
                            previousUserAttributeValue.length
                        ) {
                            userAttributeChange = true;
                        } else {
                            for (var i = 0; i < newValue.length; i++) {
                                if (
                                    previousUserAttributeValue[i] !==
                                    newValue[i]
                                ) {
                                    userAttributeChange = true;
                                    break;
                                }
                            }
                        }

                        if (userAttributeChange) {
                            self.sendUserAttributeChangeEvent(
                                key,
                                newValue,
                                previousUserAttributeValue,
                                isNewAttribute,
                                false,
                                this
                            );
                        }
                    }

                    mpInstance._Forwarders.initForwarders(
                        self.IdentityAPI.getCurrentUser().getUserIdentities(),
                        mpInstance._APIClient.prepareForwardingStats
                    );
                    mpInstance._Forwarders.callSetUserAttributeOnForwarders(
                        key,
                        arrayCopy
                    );
                }
            },
            /**
             * Removes all user attributes
             * @method removeAllUserAttributes
             */
            removeAllUserAttributes: function() {
                var userAttributes;

                mpInstance._SessionManager.resetSessionTimer();

                if (mpInstance._Store.webviewBridgeEnabled) {
                    mpInstance._NativeSdkHelpers.sendToNative(
                        Constants.NativeSdkPaths.RemoveAllUserAttributes
                    );
                } else {
                    userAttributes = this.getAllUserAttributes();

                    mpInstance._Forwarders.initForwarders(
                        self.IdentityAPI.getCurrentUser().getUserIdentities(),
                        mpInstance._APIClient.prepareForwardingStats
                    );
                    if (userAttributes) {
                        for (var prop in userAttributes) {
                            if (userAttributes.hasOwnProperty(prop)) {
                                mpInstance._Forwarders.applyToForwarders(
                                    'removeUserAttribute',
                                    prop
                                );
                            }
                            this.removeUserAttribute(prop);
                        }
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
                    if (
                        userAttributes.hasOwnProperty(key) &&
                        Array.isArray(userAttributes[key])
                    ) {
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
                var userAttributes = mpInstance._Persistence.getAllUserAttributes(
                    mpid
                );

                if (userAttributes) {
                    for (var prop in userAttributes) {
                        if (userAttributes.hasOwnProperty(prop)) {
                            if (Array.isArray(userAttributes[prop])) {
                                userAttributesCopy[prop] = userAttributes[
                                    prop
                                ].slice();
                            } else {
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
                mpInstance.Logger.warning(
                    'Deprecated function Identity.getCurrentUser().getCart() will be removed in future releases'
                );
                return self.mParticleUserCart(mpid);
            },

            /**
             * Returns the Consent State stored locally for this user.
             * @method getConsentState
             * @return a ConsentState object
             */
            getConsentState: function() {
                return mpInstance._Persistence.getConsentState(mpid);
            },
            /**
             * Sets the Consent State stored locally for this user.
             * @method setConsentState
             * @param {Object} consent state
             */
            setConsentState: function(state) {
                mpInstance._Persistence.saveUserConsentStateToCookies(
                    mpid,
                    state
                );
                mpInstance._Forwarders.initForwarders(
                    this.getUserIdentities().userIdentities,
                    mpInstance._APIClient.prepareForwardingStats
                );
                mpInstance._CookieSyncManager.attemptCookieSync(
                    null,
                    this.getMPID()
                );
            },
            isLoggedIn: function() {
                return isLoggedIn;
            },
            getLastSeenTime: function() {
                return mpInstance._Persistence.getLastSeenTime(mpid);
            },
            getFirstSeenTime: function() {
                return mpInstance._Persistence.getFirstSeenTime(mpid);
            },
        };
    };

    /**
     * Invoke these methods on the mParticle.Identity.getCurrentUser().getCart() object.
     * Example: mParticle.Identity.getCurrentUser().getCart().add(...);
     * @class mParticle.Identity.getCurrentUser().getCart()
     * @deprecated
     */
    this.mParticleUserCart = function(mpid) {
        return {
            /**
             * Adds a cart product to the user cart
             * @method add
             * @param {Object} product the product
             * @param {Boolean} [logEvent] a boolean to log adding of the cart object. If blank, no logging occurs.
             * @deprecated
             */
            add: function(product, logEvent) {
                mpInstance.Logger.warning(
                    'Deprecated function Identity.getCurrentUser().getCart().add() will be removed in future releases'
                );
                var allProducts, userProducts, arrayCopy;

                arrayCopy = Array.isArray(product)
                    ? product.slice()
                    : [product];
                arrayCopy.forEach(function(product) {
                    product.Attributes = mpInstance._Helpers.sanitizeAttributes(
                        product.Attributes
                    );
                });

                if (mpInstance._Store.webviewBridgeEnabled) {
                    mpInstance._NativeSdkHelpers.sendToNative(
                        Constants.NativeSdkPaths.AddToCart,
                        JSON.stringify(arrayCopy)
                    );
                } else {
                    mpInstance._SessionManager.resetSessionTimer();

                    userProducts = mpInstance._Persistence.getUserProductsFromLS(
                        mpid
                    );

                    userProducts = userProducts.concat(arrayCopy);

                    if (logEvent === true) {
                        mpInstance._Events.logProductActionEvent(
                            Types.ProductActionType.AddToCart,
                            arrayCopy
                        );
                    }

                    var productsForMemory = {};
                    productsForMemory[mpid] = { cp: userProducts };

                    if (
                        userProducts.length >
                        mpInstance._Store.SDKConfig.maxProducts
                    ) {
                        mpInstance.Logger.verbose(
                            'The cart contains ' +
                                userProducts.length +
                                ' items. Only ' +
                                mpInstance._Store.SDKConfig.maxProducts +
                                ' can currently be saved in cookies.'
                        );
                        userProducts = userProducts.slice(
                            -mpInstance._Store.SDKConfig.maxProducts
                        );
                    }

                    allProducts = mpInstance._Persistence.getAllUserProductsFromLS();
                    allProducts[mpid].cp = userProducts;

                    mpInstance._Persistence.setCartProducts(allProducts);
                }
            },
            /**
             * Removes a cart product from the current user cart
             * @method remove
             * @param {Object} product the product
             * @param {Boolean} [logEvent] a boolean to log adding of the cart object. If blank, no logging occurs.
             * @deprecated
             */
            remove: function(product, logEvent) {
                mpInstance.Logger.warning(
                    'Deprecated function Identity.getCurrentUser().getCart().remove() will be removed in future releases'
                );
                var allProducts,
                    userProducts,
                    cartIndex = -1,
                    cartItem = null;

                if (mpInstance._Store.webviewBridgeEnabled) {
                    mpInstance._NativeSdkHelpers.sendToNative(
                        Constants.NativeSdkPaths.RemoveFromCart,
                        JSON.stringify(product)
                    );
                } else {
                    mpInstance._SessionManager.resetSessionTimer();

                    userProducts = mpInstance._Persistence.getUserProductsFromLS(
                        mpid
                    );

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
                                mpInstance._Events.logProductActionEvent(
                                    Types.ProductActionType.RemoveFromCart,
                                    cartItem
                                );
                            }
                        }
                    }

                    var productsForMemory = {};
                    productsForMemory[mpid] = { cp: userProducts };

                    allProducts = mpInstance._Persistence.getAllUserProductsFromLS();

                    allProducts[mpid].cp = userProducts;

                    mpInstance._Persistence.setCartProducts(allProducts);
                }
            },
            /**
             * Clears the user's cart
             * @method clear
             * @deprecated
             */
            clear: function() {
                mpInstance.Logger.warning(
                    'Deprecated function Identity.getCurrentUser().getCart().clear() will be removed in future releases'
                );

                var allProducts;

                if (mpInstance._Store.webviewBridgeEnabled) {
                    mpInstance._NativeSdkHelpers.sendToNative(
                        Constants.NativeSdkPaths.ClearCart
                    );
                } else {
                    mpInstance._SessionManager.resetSessionTimer();
                    allProducts = mpInstance._Persistence.getAllUserProductsFromLS();

                    if (
                        allProducts &&
                        allProducts[mpid] &&
                        allProducts[mpid].cp
                    ) {
                        allProducts[mpid].cp = [];

                        allProducts[mpid].cp = [];

                        mpInstance._Persistence.setCartProducts(allProducts);
                    }
                }
            },
            /**
             * Returns all cart products
             * @method getCartProducts
             * @return {Array} array of cart products
             * @deprecated
             */
            getCartProducts: function() {
                mpInstance.Logger.warning(
                    'Deprecated function Identity.getCurrentUser().getCart().getCartProducts() will be removed in future releases'
                );
                return mpInstance._Persistence.getCartProducts(mpid);
            },
        };
    };

    this.parseIdentityResponse = function(
        xhr,
        previousMPID,
        callback,
        identityApiData,
        method
    ) {
        var prevUser = mpInstance.Identity.getUser(previousMPID),
            newUser,
            mpidIsNotInCookies,
            identityApiResult,
            indexOfMPID,
            newIdentitiesByType = {},
            previousUIByName = prevUser
                ? prevUser.getUserIdentities().userIdentities
                : {},
            previousUIByNameCopy = mpInstance._Helpers.extend(
                {},
                previousUIByName
            );
        mpInstance._Store.identityCallInFlight = false;

        try {
            mpInstance.Logger.verbose(
                'Parsing "' + method + '" identity response from server'
            );
            if (xhr.responseText) {
                identityApiResult = JSON.parse(xhr.responseText);

                if (identityApiResult.hasOwnProperty('is_logged_in')) {
                    mpInstance._Store.isLoggedIn =
                        identityApiResult.is_logged_in;
                }
            }

            // set currentUser
            if (
                !prevUser ||
                (prevUser.getMPID() &&
                    identityApiResult.mpid &&
                    identityApiResult.mpid !== prevUser.getMPID())
            ) {
                mpInstance._Store.mpid = identityApiResult.mpid;

                if (prevUser) {
                    mpInstance._Persistence.setLastSeenTime(previousMPID);
                }

                if (
                    !mpInstance._Persistence.getFirstSeenTime(
                        identityApiResult.mpid
                    )
                )
                    mpidIsNotInCookies = true;
                mpInstance._Persistence.setFirstSeenTime(
                    identityApiResult.mpid
                );
            }

            if (xhr.status === 200) {
                if (method === 'modify') {
                    newIdentitiesByType = mpInstance._Identity.IdentityRequest.combineUserIdentities(
                        previousUIByName,
                        identityApiData.userIdentities
                    );

                    mpInstance._Persistence.saveUserIdentitiesToPersistence(
                        previousMPID,
                        newIdentitiesByType
                    );
                } else {
                    var incomingUser = self.IdentityAPI.getUser(
                        identityApiResult.mpid
                    );

                    var incomingMpidUIByName = incomingUser
                        ? incomingUser.getUserIdentities().userIdentities
                        : {};

                    var incomingMpidUIByNameCopy = mpInstance._Helpers.extend(
                        {},
                        incomingMpidUIByName
                    );
                    mpInstance.Logger.verbose(
                        'Successfully parsed Identity Response'
                    );

                    //this covers an edge case where, users stored before "firstSeenTime" was introduced
                    //will not have a value for "fst" until the current MPID changes, and in some cases,
                    //the current MPID will never change
                    if (
                        method === 'identify' &&
                        prevUser &&
                        identityApiResult.mpid === prevUser.getMPID()
                    ) {
                        mpInstance._Persistence.setFirstSeenTime(
                            identityApiResult.mpid
                        );
                    }

                    indexOfMPID = mpInstance._Store.currentSessionMPIDs.indexOf(
                        identityApiResult.mpid
                    );

                    if (
                        mpInstance._Store.sessionId &&
                        identityApiResult.mpid &&
                        previousMPID !== identityApiResult.mpid &&
                        indexOfMPID < 0
                    ) {
                        mpInstance._Store.currentSessionMPIDs.push(
                            identityApiResult.mpid
                        );
                    }

                    if (indexOfMPID > -1) {
                        mpInstance._Store.currentSessionMPIDs = mpInstance._Store.currentSessionMPIDs
                            .slice(0, indexOfMPID)
                            .concat(
                                mpInstance._Store.currentSessionMPIDs.slice(
                                    indexOfMPID + 1,
                                    mpInstance._Store.currentSessionMPIDs.length
                                )
                            );
                        mpInstance._Store.currentSessionMPIDs.push(
                            identityApiResult.mpid
                        );
                    }

                    mpInstance._CookieSyncManager.attemptCookieSync(
                        previousMPID,
                        identityApiResult.mpid,
                        mpidIsNotInCookies
                    );

                    self.checkIdentitySwap(
                        previousMPID,
                        identityApiResult.mpid,
                        mpInstance._Store.currentSessionMPIDs
                    );

                    //if there is any previous migration data
                    if (Object.keys(mpInstance._Store.migrationData).length) {
                        newIdentitiesByType =
                            mpInstance._Store.migrationData.userIdentities ||
                            {};
                        var userAttributes =
                            mpInstance._Store.migrationData.userAttributes ||
                            {};
                        mpInstance._Persistence.saveUserAttributesToPersistence(
                            identityApiResult.mpid,
                            userAttributes
                        );
                    } else {
                        if (
                            identityApiData &&
                            identityApiData.userIdentities &&
                            Object.keys(identityApiData.userIdentities).length
                        ) {
                            newIdentitiesByType = self.IdentityRequest.combineUserIdentities(
                                incomingMpidUIByName,
                                identityApiData.userIdentities
                            );
                        }
                    }

                    mpInstance._Persistence.saveUserIdentitiesToPersistence(
                        identityApiResult.mpid,
                        newIdentitiesByType
                    );
                    mpInstance._Persistence.update();

                    mpInstance._Persistence.findPrevCookiesBasedOnUI(
                        identityApiData
                    );

                    mpInstance._Store.context =
                        identityApiResult.context || mpInstance._Store.context;
                }

                newUser = mpInstance.Identity.getCurrentUser();

                if (
                    identityApiData &&
                    identityApiData.onUserAlias &&
                    mpInstance._Helpers.Validators.isFunction(
                        identityApiData.onUserAlias
                    )
                ) {
                    try {
                        mpInstance.Logger.warning(
                            'Deprecated function onUserAlias will be removed in future releases'
                        );
                        identityApiData.onUserAlias(prevUser, newUser);
                    } catch (e) {
                        mpInstance.Logger.error(
                            'There was an error with your onUserAlias function - ' +
                                e
                        );
                    }
                }
                var persistence = mpInstance._Persistence.getPersistence();

                if (newUser) {
                    mpInstance._Persistence.storeDataInMemory(
                        persistence,
                        newUser.getMPID()
                    );
                    if (
                        !prevUser ||
                        newUser.getMPID() !== prevUser.getMPID() ||
                        prevUser.isLoggedIn() !== newUser.isLoggedIn()
                    ) {
                        mpInstance._Forwarders.initForwarders(
                            newUser.getUserIdentities().userIdentities,
                            mpInstance._APIClient.prepareForwardingStats
                        );
                    }
                    mpInstance._Forwarders.setForwarderUserIdentities(
                        newUser.getUserIdentities().userIdentities
                    );
                    mpInstance._Forwarders.setForwarderOnIdentityComplete(
                        newUser,
                        method
                    );
                    mpInstance._Forwarders.setForwarderOnUserIdentified(
                        newUser,
                        method
                    );
                }
                var newIdentitiesByName = {};

                for (var key in newIdentitiesByType) {
                    newIdentitiesByName[
                        Types.IdentityType.getIdentityName(
                            mpInstance._Helpers.parseNumber(key)
                        )
                    ] = newIdentitiesByType[key];
                }

                self.sendUserIdentityChangeEvent(
                    newIdentitiesByName,
                    method,
                    identityApiResult.mpid,
                    method === 'modify'
                        ? previousUIByNameCopy
                        : incomingMpidUIByNameCopy
                );
            }

            if (callback) {
                if (xhr.status === 0) {
                    mpInstance._Helpers.invokeCallback(
                        callback,
                        HTTPCodes.noHttpCoverage,
                        identityApiResult || null,
                        newUser
                    );
                } else {
                    mpInstance._Helpers.invokeCallback(
                        callback,
                        xhr.status,
                        identityApiResult || null,
                        newUser
                    );
                }
            } else {
                if (
                    identityApiResult &&
                    identityApiResult.errors &&
                    identityApiResult.errors.length
                ) {
                    mpInstance.Logger.error(
                        'Received HTTP response code of ' +
                            xhr.status +
                            ' - ' +
                            identityApiResult.errors[0].message
                    );
                }
            }

            mpInstance._APIClient.processQueuedEvents();
        } catch (e) {
            if (callback) {
                mpInstance._Helpers.invokeCallback(
                    callback,
                    xhr.status,
                    identityApiResult || null
                );
            }
            mpInstance.Logger.error(
                'Error parsing JSON response from Identity server: ' + e
            );
        }
    };

    // send a user identity change request on identify, login, logout, modify when any values change.
    // compare what identities exist vs what is previously was for the specific user if they were in memory before.
    // if it's the first time the user is logging in, send a user identity change request with

    this.sendUserIdentityChangeEvent = function(
        newUserIdentities,
        method,
        mpid,
        prevUserIdentities
    ) {
        var currentUserInMemory, userIdentityChangeEvent;

        if (!mpInstance._APIClient.shouldEnableBatching()) {
            return;
        }

        if (!mpid) {
            if (method !== 'modify') {
                return;
            }
        }

        currentUserInMemory = this.IdentityAPI.getUser(mpid);

        for (var identityType in newUserIdentities) {
            if (
                prevUserIdentities[identityType] !==
                newUserIdentities[identityType]
            ) {
                var isNewUserIdentityType = !prevUserIdentities[identityType];
                userIdentityChangeEvent = self.createUserIdentityChange(
                    identityType,
                    newUserIdentities[identityType],
                    prevUserIdentities[identityType],
                    isNewUserIdentityType,
                    currentUserInMemory
                );
                mpInstance._APIClient.sendEventToServer(
                    userIdentityChangeEvent
                );
            }
        }
    };

    this.createUserIdentityChange = function(
        identityType,
        newIdentity,
        oldIdentity,
        newCreatedThisBatch,
        userInMemory
    ) {
        var userIdentityChangeEvent;

        userIdentityChangeEvent = mpInstance._ServerModel.createEventObject({
            messageType: Types.MessageType.UserIdentityChange,
            userIdentityChanges: {
                New: {
                    IdentityType: identityType,
                    Identity: newIdentity,
                    CreatedThisBatch: newCreatedThisBatch,
                },
                Old: {
                    IdentityType: identityType,
                    Identity: oldIdentity,
                    CreatedThisBatch: false,
                },
            },
            userInMemory,
        });

        return userIdentityChangeEvent;
    };

    this.sendUserAttributeChangeEvent = function(
        attributeKey,
        newUserAttributeValue,
        previousUserAttributeValue,
        isNewAttribute,
        deleted,
        user
    ) {
        if (!mpInstance._APIClient.shouldEnableBatching()) {
            return;
        }
        var userAttributeChangeEvent = self.createUserAttributeChange(
            attributeKey,
            newUserAttributeValue,
            previousUserAttributeValue,
            isNewAttribute,
            deleted,
            user
        );
        if (userAttributeChangeEvent) {
            mpInstance._APIClient.sendEventToServer(userAttributeChangeEvent);
        }
    };

    this.createUserAttributeChange = function(
        key,
        newValue,
        previousUserAttributeValue,
        isNewAttribute,
        deleted,
        user
    ) {
        if (!previousUserAttributeValue) {
            previousUserAttributeValue = null;
        }
        var userAttributeChangeEvent;
        if (newValue !== previousUserAttributeValue) {
            userAttributeChangeEvent = mpInstance._ServerModel.createEventObject(
                {
                    messageType: Types.MessageType.UserAttributeChange,
                    userAttributeChanges: {
                        UserAttributeName: key,
                        New: newValue,
                        Old: previousUserAttributeValue || null,
                        Deleted: deleted,
                        IsNewAttribute: isNewAttribute,
                    },
                },
                user
            );
        }
        return userAttributeChangeEvent;
    };
}
