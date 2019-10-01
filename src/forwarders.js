import Helpers from './helpers';
import Types from './types';
import getFilteredMparticleUser from './mParticleUser';
import Persistence from './persistence';

function initForwarders(userIdentities, forwardingStatsCallback) {
    var user = mParticle.Identity.getCurrentUser();
    if (!mParticle.Store.webviewBridgeEnabled && mParticle.Store.configuredForwarders) {
        // Some js libraries require that they be loaded first, or last, etc
        mParticle.Store.configuredForwarders.sort(function(x, y) {
            x.settings.PriorityValue = x.settings.PriorityValue || 0;
            y.settings.PriorityValue = y.settings.PriorityValue || 0;
            return -1 * (x.settings.PriorityValue - y.settings.PriorityValue);
        });

        mParticle.Store.activeForwarders = mParticle.Store.configuredForwarders.filter(function(forwarder) {
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
            var filteredUserAttributes = Helpers.filterUserAttributes(user ? user.getAllUserAttributes() : {}, forwarder.userAttributeFilters);

            if (!forwarder.initialized) {
                forwarder.init(forwarder.settings,
                    forwardingStatsCallback,
                    false,
                    null,
                    filteredUserAttributes,
                    filteredUserIdentities,
                    mParticle.Store.SDKConfig.appVersion,
                    mParticle.Store.SDKConfig.appName,
                    mParticle.Store.SDKConfig.customFlags,
                    mParticle.Store.clientId);
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
    if (mParticle.Store.activeForwarders.length) {
        mParticle.Store.activeForwarders.forEach(function(forwarder) {
            var forwarderFunction = forwarder[functionName];
            if (forwarderFunction) {
                try {
                    var result = forwarder[functionName](functionArgs);

                    if (result) {
                        mParticle.Logger.verbose(result);
                    }
                }
                catch (e) {
                    mParticle.Logger.verbose(e);
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

    if (!mParticle.Store.webviewBridgeEnabled && mParticle.Store.activeForwarders) {
        hashedEventName = Helpers.generateHash(event.EventCategory + event.EventName);
        hashedEventType = Helpers.generateHash(event.EventCategory);

        for (var i = 0; i < mParticle.Store.activeForwarders.length; i++) {
            // Check attribute forwarding rule. This rule allows users to only forward an event if a
            // specific attribute exists and has a specific value. Alternatively, they can specify
            // that an event not be forwarded if the specified attribute name and value exists.
            // The two cases are controlled by the "includeOnMatch" boolean value.
            // Supported message types for attribute forwarding rules are defined in the forwardingRuleMessageTypes array

            if (forwardingRuleMessageTypes.indexOf(event.EventDataType) > -1
                && mParticle.Store.activeForwarders[i].filteringEventAttributeValue
                && mParticle.Store.activeForwarders[i].filteringEventAttributeValue.eventAttributeName
                && mParticle.Store.activeForwarders[i].filteringEventAttributeValue.eventAttributeValue) {

                var foundProp = null;

                // Attempt to find the attribute in the collection of event attributes
                if (event.EventAttributes) {
                    for (var prop in event.EventAttributes) {
                        var hashedEventAttributeName;
                        hashedEventAttributeName = Helpers.generateHash(prop).toString();

                        if (hashedEventAttributeName === mParticle.Store.activeForwarders[i].filteringEventAttributeValue.eventAttributeName) {
                            foundProp = {
                                name: hashedEventAttributeName,
                                value: Helpers.generateHash(event.EventAttributes[prop]).toString()
                            };
                        }
                        
                        if (foundProp) {
                            break;
                        }
                    }
                }

                var isMatch = foundProp !== null && foundProp.value === mParticle.Store.activeForwarders[i].filteringEventAttributeValue.eventAttributeValue;

                var shouldInclude = mParticle.Store.activeForwarders[i].filteringEventAttributeValue.includeOnMatch === true ? isMatch : !isMatch;

                if (!shouldInclude) {
                    continue;
                }
            }

            // Clone the event object, as we could be sending different attributes to each forwarder
            clonedEvent = {};
            clonedEvent = Helpers.extend(true, clonedEvent, event);
            // Check event filtering rules
            if (event.EventDataType === Types.MessageType.PageEvent
                && (inFilteredList(mParticle.Store.activeForwarders[i].eventNameFilters, hashedEventName)
                    || inFilteredList(mParticle.Store.activeForwarders[i].eventTypeFilters, hashedEventType))) {
                continue;
            }
            else if (event.EventDataType === Types.MessageType.Commerce && inFilteredList(mParticle.Store.activeForwarders[i].eventTypeFilters, hashedEventType)) {
                continue;
            }
            else if (event.EventDataType === Types.MessageType.PageView && inFilteredList(mParticle.Store.activeForwarders[i].screenNameFilters, hashedEventName)) {
                continue;
            }

            // Check attribute filtering rules
            if (clonedEvent.EventAttributes) {
                if (event.EventDataType === Types.MessageType.PageEvent) {
                    filterAttributes(clonedEvent, mParticle.Store.activeForwarders[i].attributeFilters);
                }
                else if (event.EventDataType === Types.MessageType.PageView) {
                    filterAttributes(clonedEvent, mParticle.Store.activeForwarders[i].pageViewAttributeFilters);
                }
            }

            // Check user identity filtering rules
            filterUserIdentities(clonedEvent, mParticle.Store.activeForwarders[i].userIdentityFilters);

            // Check user attribute filtering rules
            clonedEvent.UserAttributes = Helpers.filterUserAttributes(clonedEvent.UserAttributes, mParticle.Store.activeForwarders[i].userAttributeFilters);

            mParticle.Logger.verbose('Sending message to forwarder: ' + mParticle.Store.activeForwarders[i].name);

            if (mParticle.Store.activeForwarders[i].process) {
                var result = mParticle.Store.activeForwarders[i].process(clonedEvent);

                if (result) {
                    mParticle.Logger.verbose(result);
                }
            }

        }
    }
}

function callSetUserAttributeOnForwarders(key, value) {
    if (mParticle.Store.activeForwarders.length) {
        mParticle.Store.activeForwarders.forEach(function(forwarder) {
            if (forwarder.setUserAttribute &&
                forwarder.userAttributeFilters &&
                !Helpers.inArray(forwarder.userAttributeFilters, Helpers.generateHash(key))) {

                try {
                    var result = forwarder.setUserAttribute(key, value);

                    if (result) {
                        mParticle.Logger.verbose(result);
                    }
                }
                catch (e) {
                    mParticle.Logger.error(e);
                }
            }
        });
    }
}

function setForwarderUserIdentities(userIdentities) {
    mParticle.Store.activeForwarders.forEach(function(forwarder) {
        var filteredUserIdentities = Helpers.filterUserIdentities(userIdentities, forwarder.userIdentityFilters);
        if (forwarder.setUserIdentity) {
            filteredUserIdentities.forEach(function(identity) {
                var result = forwarder.setUserIdentity(identity.Identity, identity.Type);
                if (result) {
                    mParticle.Logger.verbose(result);
                }
            });
        }
    });
}

function setForwarderOnUserIdentified(user) {
    mParticle.Store.activeForwarders.forEach(function(forwarder) {
        var filteredUser = getFilteredMparticleUser(user.getMPID(), forwarder);
        if (forwarder.onUserIdentified) {
            var result = forwarder.onUserIdentified(filteredUser);
            if (result) {
                mParticle.Logger.verbose(result);
            }
        }
    });
}

function setForwarderOnIdentityComplete(user, identityMethod) {
    var result;

    mParticle.Store.activeForwarders.forEach(function(forwarder) {
        var filteredUser = getFilteredMparticleUser(user.getMPID(), forwarder);
        if (identityMethod === 'identify') {
            if (forwarder.onIdentifyComplete) {
                result = forwarder.onIdentifyComplete(filteredUser);
                if (result) {
                    mParticle.Logger.verbose(result);
                }
            }
        }
        else if (identityMethod === 'login') {
            if (forwarder.onLoginComplete) {
                result = forwarder.onLoginComplete(filteredUser);
                if (result) {
                    mParticle.Logger.verbose(result);
                }
            }
        } else if (identityMethod === 'logout') {
            if (forwarder.onLogoutComplete) {
                result = forwarder.onLogoutComplete(filteredUser);
                if (result) {
                    mParticle.Logger.verbose(result);
                }
            }
        } else if (identityMethod === 'modify') {
            if (forwarder.onModifyComplete) {
                result = forwarder.onModifyComplete(filteredUser);
                if (result) {
                    mParticle.Logger.verbose(result);
                }
            }
        }
    });
}

function getForwarderStatsQueue() {
    return Persistence.forwardingStatsBatches.forwardingStatsEventQueue;
}

function setForwarderStatsQueue(queue) {
    Persistence.forwardingStatsBatches.forwardingStatsEventQueue = queue;
}

function configureForwarder(configuration) {
    var newForwarder = null,
        config = configuration,
        forwarders = {};

    // if there are kits inside of mParticle.Store.SDKConfig.kits, then mParticle is self hosted
    if (Helpers.isObject(mParticle.Store.SDKConfig.kits) && Object.keys(mParticle.Store.SDKConfig.kits).length > 0) {
        forwarders = mParticle.Store.SDKConfig.kits;
    // otherwise mParticle is loaded via script tag
    } else if (mParticle.preInit.forwarderConstructors.length > 0) {
        mParticle.preInit.forwarderConstructors.forEach(function (forwarder) {
            forwarders[forwarder.name] = forwarder;
        });
    }

    for (var name in forwarders) {
        if (name === config.name) {
            if (config.isDebug === mParticle.Store.SDKConfig.isDevelopmentMode || config.isSandbox === mParticle.Store.SDKConfig.isDevelopmentMode) {
                newForwarder = new (forwarders[name]).constructor();

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
                newForwarder.eventSubscriptionId = config.eventSubscriptionId;
                newForwarder.filteringConsentRuleValues = config.filteringConsentRuleValues;
                newForwarder.excludeAnonymousUser = config.excludeAnonymousUser;

                mParticle.Store.configuredForwarders.push(newForwarder);
                break;
            }
        }
    }
}

function configurePixel(settings) {
    if (settings.isDebug === mParticle.Store.SDKConfig.isDevelopmentMode || settings.isProduction !== mParticle.Store.SDKConfig.isDevelopmentMode) {
        mParticle.Store.pixelConfigurations.push(settings);
    }
}

function processForwarders(config, forwardingStatsCallback) {
    if (!config) {
        mParticle.Logger.warning('No config was passed. Cannot process forwarders');
    } else {
        try {
            if (Array.isArray(config.kitConfigs) && config.kitConfigs.length) {
                config.kitConfigs.forEach(function(kitConfig) {
                    configureForwarder(kitConfig);
                });
            }

            if (Array.isArray(config.pixelConfigs) && config.pixelConfigs.length) {
                config.pixelConfigs.forEach(function(pixelConfig) {
                    configurePixel(pixelConfig);
                });
            }
            initForwarders(mParticle.Store.SDKConfig.identifyRequest.userIdentities, forwardingStatsCallback);
        } catch (e) {
            mParticle.Logger.error('Config was not parsed propertly. Forwarders may not be initialized.');
        }
    }
}

export default {
    initForwarders: initForwarders,
    applyToForwarders: applyToForwarders,
    sendEventToForwarders: sendEventToForwarders,
    callSetUserAttributeOnForwarders: callSetUserAttributeOnForwarders,
    setForwarderUserIdentities: setForwarderUserIdentities,
    setForwarderOnUserIdentified: setForwarderOnUserIdentified,
    setForwarderOnIdentityComplete: setForwarderOnIdentityComplete,
    getForwarderStatsQueue: getForwarderStatsQueue,
    setForwarderStatsQueue: setForwarderStatsQueue,
    isEnabledForUserConsent: isEnabledForUserConsent,
    isEnabledForUserAttributes: isEnabledForUserAttributes,
    configurePixel: configurePixel,
    processForwarders: processForwarders
};