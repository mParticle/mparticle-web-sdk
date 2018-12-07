var Helpers = require('./helpers'),
    Types = require('./types'),
    Constants = require('./constants'),
    MParticleUser = require('./mParticleUser'),
    ApiClient = require('./apiClient'),
    Persistence = require('./persistence'),
    MP = require('./mp');

function initForwarders(userIdentities) {
    var user = mParticle.Identity.getCurrentUser();
    if (!Helpers.shouldUseNativeSdk() && MP.configuredForwarders) {
        // Some js libraries require that they be loaded first, or last, etc
        MP.configuredForwarders.sort(function(x, y) {
            x.settings.PriorityValue = x.settings.PriorityValue || 0;
            y.settings.PriorityValue = y.settings.PriorityValue || 0;
            return -1 * (x.settings.PriorityValue - y.settings.PriorityValue);
        });

        MP.activeForwarders = MP.configuredForwarders.filter(function(forwarder) {
            if (!isEnabledForUserConsent(forwarder.filteringConsentRuleValues, user)) {
                return false;
            }
            if (!isEnabledForUserAttributes(forwarder.filteringUserAttributeValue, user)) {
                return false;
            }
            if (!isEnabledForUnknownUser(forwarder.excludeAnonymousUser, user)) {
                return false;
            }

            var filteredUserIdentities = Helpers.filterUserIdentities(userIdentities, forwarder.userIdentityFilters);
            var filteredUserAttributes = Helpers.filterUserAttributes(MP.userAttributes, forwarder.userAttributeFilters);

            if (!forwarder.initialized) {
                forwarder.init(forwarder.settings,
                    prepareForwardingStats,
                    false,
                    null,
                    filteredUserAttributes,
                    filteredUserIdentities,
                    MP.appVersion,
                    MP.appName,
                    MP.customFlags,
                    MP.clientId);
                forwarder.initialized = true;
            }

            return true;
        });
    }
}

function isEnabledForUserConsent(consentRules, user) {
    if (!consentRules
        || !consentRules.values
        || !consentRules.values.length) {
        return true;
    }
    if (!user) {
        return false;
    }
    var purposeHashes = {};
    var GDPRConsentHashPrefix = '1';
    var consentState = user.getConsentState();
    if (consentState) {
        var gdprConsentState = consentState.getGDPRConsentState();
        if (gdprConsentState) {
            for (var purpose in gdprConsentState) {
                if (gdprConsentState.hasOwnProperty(purpose)) {
                    var purposeHash = Helpers.generateHash(GDPRConsentHashPrefix + purpose).toString();
                    purposeHashes[purposeHash] = gdprConsentState[purpose].Consented;
                }
            }
        }
    }
    var isMatch = false;
    consentRules.values.forEach(function(consentRule) {
        if (!isMatch) {
            var purposeHash = consentRule.consentPurpose;
            var hasConsented = consentRule.hasConsented;
            if (purposeHashes.hasOwnProperty(purposeHash)
                && purposeHashes[purposeHash] === hasConsented) {
                isMatch = true;
            }
        }
    });

    return consentRules.includeOnMatch === isMatch;
}

function isEnabledForUserAttributes(filterObject, user) {
    if (!filterObject ||
        !Helpers.isObject(filterObject) ||
        !Object.keys(filterObject).length) {
        return true;
    }

    var attrHash,
        valueHash,
        userAttributes;

    if (!user) {
        return false;
    } else {
        userAttributes = user.getAllUserAttributes();
    }

    var isMatch = false;

    try {
        if (userAttributes && Helpers.isObject(userAttributes) && Object.keys(userAttributes).length) {
            for (var attrName in userAttributes) {
                if (userAttributes.hasOwnProperty(attrName)) {
                    attrHash = Helpers.generateHash(attrName).toString();
                    valueHash = Helpers.generateHash(userAttributes[attrName]).toString();

                    if ((attrHash === filterObject.userAttributeName) && (valueHash === filterObject.userAttributeValue)) {
                        isMatch = true;
                        break;
                    }
                }
            }
        }

        if (filterObject) {
            return filterObject.includeOnMatch === isMatch;
        } else {
            return true;
        }
    } catch (e) {
        // in any error scenario, err on side of returning true and forwarding event
        return true;
    }
}

function isEnabledForUnknownUser(excludeAnonymousUserBoolean, user) {
    if (!user || !user.isLoggedIn()) {
        if (excludeAnonymousUserBoolean) {
            return false;
        }
    }
    return true;
}

function applyToForwarders(functionName, functionArgs) {
    if (MP.activeForwarders.length) {
        MP.activeForwarders.forEach(function(forwarder) {
            var forwarderFunction = forwarder[functionName];
            if (forwarderFunction) {
                try {
                    var result = forwarder[functionName](functionArgs);

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
        hashedEventName,
        hashedEventType,
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

    if (!Helpers.shouldUseNativeSdk() && MP.activeForwarders) {
        hashedEventName = Helpers.generateHash(event.EventCategory + event.EventName);
        hashedEventType = Helpers.generateHash(event.EventCategory);

        for (var i = 0; i < MP.activeForwarders.length; i++) {
            // Check attribute forwarding rule. This rule allows users to only forward an event if a
            // specific attribute exists and has a specific value. Alternatively, they can specify
            // that an event not be forwarded if the specified attribute name and value exists.
            // The two cases are controlled by the "includeOnMatch" boolean value.
            // Supported message types for attribute forwarding rules are defined in the forwardingRuleMessageTypes array

            if (forwardingRuleMessageTypes.indexOf(event.EventDataType) > -1
                && MP.activeForwarders[i].filteringEventAttributeValue
                && MP.activeForwarders[i].filteringEventAttributeValue.eventAttributeName
                && MP.activeForwarders[i].filteringEventAttributeValue.eventAttributeValue) {

                var foundProp = null;

                // Attempt to find the attribute in the collection of event attributes
                if (event.EventAttributes) {
                    for (var prop in event.EventAttributes) {
                        var hashedEventAttributeName;
                        hashedEventAttributeName = Helpers.generateHash(prop).toString();

                        if (hashedEventAttributeName === MP.activeForwarders[i].filteringEventAttributeValue.eventAttributeName) {
                            foundProp = {
                                name: hashedEventAttributeName,
                                value: Helpers.generateHash(event.EventAttributes[prop]).toString()
                            };
                        }

                        break;
                    }
                }

                var isMatch = foundProp !== null && foundProp.value === MP.activeForwarders[i].filteringEventAttributeValue.eventAttributeValue;

                var shouldInclude = MP.activeForwarders[i].filteringEventAttributeValue.includeOnMatch === true ? isMatch : !isMatch;

                if (!shouldInclude) {
                    continue;
                }
            }

            // Clone the event object, as we could be sending different attributes to each forwarder
            clonedEvent = {};
            clonedEvent = Helpers.extend(true, clonedEvent, event);
            // Check event filtering rules
            if (event.EventDataType === Types.MessageType.PageEvent
                && (inFilteredList(MP.activeForwarders[i].eventNameFilters, hashedEventName)
                    || inFilteredList(MP.activeForwarders[i].eventTypeFilters, hashedEventType))) {
                continue;
            }
            else if (event.EventDataType === Types.MessageType.Commerce && inFilteredList(MP.activeForwarders[i].eventTypeFilters, hashedEventType)) {
                continue;
            }
            else if (event.EventDataType === Types.MessageType.PageView && inFilteredList(MP.activeForwarders[i].screenNameFilters, hashedEventName)) {
                continue;
            }

            // Check attribute filtering rules
            if (clonedEvent.EventAttributes) {
                if (event.EventDataType === Types.MessageType.PageEvent) {
                    filterAttributes(clonedEvent, MP.activeForwarders[i].attributeFilters);
                }
                else if (event.EventDataType === Types.MessageType.PageView) {
                    filterAttributes(clonedEvent, MP.activeForwarders[i].pageViewAttributeFilters);
                }
            }

            // Check user identity filtering rules
            filterUserIdentities(clonedEvent, MP.activeForwarders[i].userIdentityFilters);

            // Check user attribute filtering rules
            clonedEvent.UserAttributes = Helpers.filterUserAttributes(clonedEvent.UserAttributes, MP.activeForwarders[i].userAttributeFilters);

            Helpers.logDebug('Sending message to forwarder: ' + MP.activeForwarders[i].name);

            if (MP.activeForwarders[i].process) {
                var result = MP.activeForwarders[i].process(clonedEvent);

                if (result) {
                    Helpers.logDebug(result);
                }
            }

        }
    }
}

function callSetUserAttributeOnForwarders(key, value) {
    if (MP.activeForwarders.length) {
        MP.activeForwarders.forEach(function(forwarder) {
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
    MP.activeForwarders.forEach(function(forwarder) {
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

function setForwarderOnUserIdentified(user) {
    MP.activeForwarders.forEach(function(forwarder) {
        var filteredUser = MParticleUser.getFilteredMparticleUser(user.getMPID(), forwarder);
        if (forwarder.onUserIdentified) {
            var result = forwarder.onUserIdentified(filteredUser);
            if (result) {
                Helpers.logDebug(result);
            }
        }
    });
}

function setForwarderOnIdentityComplete(user, identityMethod) {
    var result;

    MP.activeForwarders.forEach(function(forwarder) {
        var filteredUser = MParticleUser.getFilteredMparticleUser(user.getMPID(), forwarder);
        if (identityMethod === 'identify') {
            if (forwarder.onIdentifyComplete) {
                result = forwarder.onIdentifyComplete(filteredUser);
                if (result) {
                    Helpers.logDebug(result);
                }
            }
        }
        else if (identityMethod === 'login') {
            if (forwarder.onLoginComplete) {
                result = forwarder.onLoginComplete(filteredUser);
                if (result) {
                    Helpers.logDebug(result);
                }
            }
        } else if (identityMethod === 'logout') {
            if (forwarder.onLogoutComplete) {
                result = forwarder.onLogoutComplete(filteredUser);
                if (result) {
                    Helpers.logDebug(result);
                }
            }
        } else if (identityMethod === 'modify') {
            if (forwarder.onModifyComplete) {
                result = forwarder.onModifyComplete(filteredUser);
                if (result) {
                    Helpers.logDebug(result);
                }
            }
        }
    });
}

function prepareForwardingStats(forwarder, event) {
    var forwardingStatsData,
        queue = getForwarderStatsQueue();

    if (forwarder && forwarder.isVisible) {
        forwardingStatsData = {
            mid: forwarder.id,
            esid: forwarder.eventSubscriptionId,
            n: event.EventName,
            attrs: event.EventAttributes,
            sdk: event.SDKVersion,
            dt: event.EventDataType,
            et: event.EventCategory,
            dbg: event.Debug,
            ct: event.Timestamp,
            eec: event.ExpandedEventCount
        };

        if (Helpers.hasFeatureFlag(Constants.Features.Batching)) {
            queue.push(forwardingStatsData);
            setForwarderStatsQueue(queue);
        } else {
            ApiClient.sendSingleForwardingStatsToServer(forwardingStatsData);
        }
    }
}

function getForwarderStatsQueue() {
    return Persistence.forwardingStatsBatches.forwardingStatsEventQueue;
}

function setForwarderStatsQueue(queue) {
    Persistence.forwardingStatsBatches.forwardingStatsEventQueue = queue;
}

module.exports = {
    initForwarders: initForwarders,
    applyToForwarders: applyToForwarders,
    sendEventToForwarders: sendEventToForwarders,
    callSetUserAttributeOnForwarders: callSetUserAttributeOnForwarders,
    setForwarderUserIdentities: setForwarderUserIdentities,
    setForwarderOnUserIdentified: setForwarderOnUserIdentified,
    setForwarderOnIdentityComplete: setForwarderOnIdentityComplete,
    prepareForwardingStats: prepareForwardingStats,
    getForwarderStatsQueue: getForwarderStatsQueue,
    setForwarderStatsQueue: setForwarderStatsQueue,
    isEnabledForUserConsent: isEnabledForUserConsent,
    isEnabledForUserAttributes: isEnabledForUserAttributes
};
