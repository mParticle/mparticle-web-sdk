import Types from './types';
import filteredMparticleUser from './filteredMparticleUser';

export default function Forwarders(mpInstance, kitBlocker) {
    var self = this;

    const UserAttributeActionTypes = {
        setUserAttribute: 'setUserAttribute',
        removeUserAttribute: 'removeUserAttribute',
    };

    this.initForwarders = function(userIdentities, forwardingStatsCallback) {
        var user = mpInstance.Identity.getCurrentUser();
        if (
            !mpInstance._Store.webviewBridgeEnabled &&
            mpInstance._Store.configuredForwarders
        ) {
            // Some js libraries require that they be loaded first, or last, etc
            mpInstance._Store.configuredForwarders.sort(function(x, y) {
                x.settings.PriorityValue = x.settings.PriorityValue || 0;
                y.settings.PriorityValue = y.settings.PriorityValue || 0;
                return (
                    -1 * (x.settings.PriorityValue - y.settings.PriorityValue)
                );
            });

            mpInstance._Store.activeForwarders = mpInstance._Store.configuredForwarders.filter(
                function(forwarder) {
                    if (
                        !mpInstance._Consent.isEnabledForUserConsent(
                            forwarder.filteringConsentRuleValues,
                            user
                        )
                    ) {
                        return false;
                    }
                    if (
                        !self.isEnabledForUserAttributes(
                            forwarder.filteringUserAttributeValue,
                            user
                        )
                    ) {
                        return false;
                    }
                    if (
                        !self.isEnabledForUnknownUser(
                            forwarder.excludeAnonymousUser,
                            user
                        )
                    ) {
                        return false;
                    }

                    var filteredUserIdentities = mpInstance._Helpers.filterUserIdentities(
                        userIdentities,
                        forwarder.userIdentityFilters
                    );
                    var filteredUserAttributes = mpInstance._Helpers.filterUserAttributes(
                        user ? user.getAllUserAttributes() : {},
                        forwarder.userAttributeFilters
                    );
                    if (!forwarder.initialized) {
                        forwarder.logger = mpInstance.Logger;
                        forwarder.init(
                            forwarder.settings,
                            forwardingStatsCallback,
                            false,
                            null,
                            filteredUserAttributes,
                            filteredUserIdentities,
                            mpInstance._Store.SDKConfig.appVersion,
                            mpInstance._Store.SDKConfig.appName,
                            mpInstance._Store.SDKConfig.customFlags,
                            mpInstance._Store.clientId
                        );
                        forwarder.initialized = true;
                    }

                    return true;
                }
            );
        }
    };

    this.isEnabledForUserAttributes = function(filterObject, user) {
        if (
            !filterObject ||
            !mpInstance._Helpers.isObject(filterObject) ||
            !Object.keys(filterObject).length
        ) {
            return true;
        }

        var attrHash, valueHash, userAttributes;

        if (!user) {
            return false;
        } else {
            userAttributes = user.getAllUserAttributes();
        }

        var isMatch = false;

        try {
            if (
                userAttributes &&
                mpInstance._Helpers.isObject(userAttributes) &&
                Object.keys(userAttributes).length
            ) {
                for (var attrName in userAttributes) {
                    if (userAttributes.hasOwnProperty(attrName)) {
                        attrHash = mpInstance._Helpers
                            .generateHash(attrName)
                            .toString();
                        valueHash = mpInstance._Helpers
                            .generateHash(userAttributes[attrName])
                            .toString();

                        if (
                            attrHash === filterObject.userAttributeName &&
                            valueHash === filterObject.userAttributeValue
                        ) {
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
    };

    this.isEnabledForUnknownUser = function(excludeAnonymousUserBoolean, user) {
        if (!user || !user.isLoggedIn()) {
            if (excludeAnonymousUserBoolean) {
                return false;
            }
        }
        return true;
    };

    this.applyToForwarders = function(functionName, functionArgs) {
        if (mpInstance._Store.activeForwarders.length) {
            mpInstance._Store.activeForwarders.forEach(function(forwarder) {
                var forwarderFunction = forwarder[functionName];
                if (forwarderFunction) {
                    try {
                        var result = forwarder[functionName](functionArgs);

                        if (result) {
                            mpInstance.Logger.verbose(result);
                        }
                    } catch (e) {
                        mpInstance.Logger.verbose(e);
                    }
                }
            });
        }
    };

    this.sendEventToForwarders = function(event) {
        var clonedEvent,
            hashedEventName,
            hashedEventType,
            filterUserIdentities = function(event, filterList) {
                if (event.UserIdentities && event.UserIdentities.length) {
                    event.UserIdentities.forEach(function(userIdentity, i) {
                        if (
                            mpInstance._Helpers.inArray(
                                filterList,
                                userIdentity.Type
                            )
                        ) {
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
                        hash = mpInstance._Helpers.generateHash(
                            event.EventCategory + event.EventName + attrName
                        );

                        if (mpInstance._Helpers.inArray(filterList, hash)) {
                            delete event.EventAttributes[attrName];
                        }
                    }
                }
            },
            inFilteredList = function(filterList, hash) {
                if (filterList && filterList.length) {
                    if (mpInstance._Helpers.inArray(filterList, hash)) {
                        return true;
                    }
                }

                return false;
            },
            forwardingRuleMessageTypes = [
                Types.MessageType.PageEvent,
                Types.MessageType.PageView,
                Types.MessageType.Commerce,
            ];

        if (
            !mpInstance._Store.webviewBridgeEnabled &&
            mpInstance._Store.activeForwarders
        ) {
            hashedEventName = mpInstance._Helpers.generateHash(
                event.EventCategory + event.EventName
            );
            hashedEventType = mpInstance._Helpers.generateHash(
                event.EventCategory
            );

            for (
                var i = 0;
                i < mpInstance._Store.activeForwarders.length;
                i++
            ) {
                // Check attribute forwarding rule. This rule allows users to only forward an event if a
                // specific attribute exists and has a specific value. Alternatively, they can specify
                // that an event not be forwarded if the specified attribute name and value exists.
                // The two cases are controlled by the "includeOnMatch" boolean value.
                // Supported message types for attribute forwarding rules are defined in the forwardingRuleMessageTypes array

                if (
                    forwardingRuleMessageTypes.indexOf(event.EventDataType) >
                        -1 &&
                    mpInstance._Store.activeForwarders[i]
                        .filteringEventAttributeValue &&
                    mpInstance._Store.activeForwarders[i]
                        .filteringEventAttributeValue.eventAttributeName &&
                    mpInstance._Store.activeForwarders[i]
                        .filteringEventAttributeValue.eventAttributeValue
                ) {
                    var foundProp = null;

                    // Attempt to find the attribute in the collection of event attributes
                    if (event.EventAttributes) {
                        for (var prop in event.EventAttributes) {
                            var hashedEventAttributeName;
                            hashedEventAttributeName = mpInstance._Helpers
                                .generateHash(prop)
                                .toString();

                            if (
                                hashedEventAttributeName ===
                                mpInstance._Store.activeForwarders[i]
                                    .filteringEventAttributeValue
                                    .eventAttributeName
                            ) {
                                foundProp = {
                                    name: hashedEventAttributeName,
                                    value: mpInstance._Helpers
                                        .generateHash(
                                            event.EventAttributes[prop]
                                        )
                                        .toString(),
                                };
                            }

                            if (foundProp) {
                                break;
                            }
                        }
                    }

                    var isMatch =
                        foundProp !== null &&
                        foundProp.value ===
                            mpInstance._Store.activeForwarders[i]
                                .filteringEventAttributeValue
                                .eventAttributeValue;

                    var shouldInclude =
                        mpInstance._Store.activeForwarders[i]
                            .filteringEventAttributeValue.includeOnMatch ===
                        true
                            ? isMatch
                            : !isMatch;

                    if (!shouldInclude) {
                        continue;
                    }
                }

                // Clone the event object, as we could be sending different attributes to each forwarder
                clonedEvent = {};
                clonedEvent = mpInstance._Helpers.extend(
                    true,
                    clonedEvent,
                    event
                );
                // Check event filtering rules
                if (
                    event.EventDataType === Types.MessageType.PageEvent &&
                    (inFilteredList(
                        mpInstance._Store.activeForwarders[i].eventNameFilters,
                        hashedEventName
                    ) ||
                        inFilteredList(
                            mpInstance._Store.activeForwarders[i]
                                .eventTypeFilters,
                            hashedEventType
                        ))
                ) {
                    continue;
                } else if (
                    event.EventDataType === Types.MessageType.Commerce &&
                    inFilteredList(
                        mpInstance._Store.activeForwarders[i].eventTypeFilters,
                        hashedEventType
                    )
                ) {
                    continue;
                } else if (
                    event.EventDataType === Types.MessageType.PageView &&
                    inFilteredList(
                        mpInstance._Store.activeForwarders[i].screenNameFilters,
                        hashedEventName
                    )
                ) {
                    continue;
                }

                // Check attribute filtering rules
                if (clonedEvent.EventAttributes) {
                    if (event.EventDataType === Types.MessageType.PageEvent) {
                        filterAttributes(
                            clonedEvent,
                            mpInstance._Store.activeForwarders[i]
                                .attributeFilters
                        );
                    } else if (
                        event.EventDataType === Types.MessageType.PageView
                    ) {
                        filterAttributes(
                            clonedEvent,
                            mpInstance._Store.activeForwarders[i]
                                .screenAttributeFilters
                        );
                    }
                }

                // Check user identity filtering rules
                filterUserIdentities(
                    clonedEvent,
                    mpInstance._Store.activeForwarders[i].userIdentityFilters
                );

                // Check user attribute filtering rules
                clonedEvent.UserAttributes = mpInstance._Helpers.filterUserAttributes(
                    clonedEvent.UserAttributes,
                    mpInstance._Store.activeForwarders[i].userAttributeFilters
                );

                if (mpInstance._Store.activeForwarders[i].process) {
                    mpInstance.Logger.verbose(
                        'Sending message to forwarder: ' +
                            mpInstance._Store.activeForwarders[i].name
                    );
                    var result = mpInstance._Store.activeForwarders[i].process(
                        clonedEvent
                    );

                    if (result) {
                        mpInstance.Logger.verbose(result);
                    }
                }
            }
        }
    };

    this.handleForwarderUserAttributes = function(functionNameKey, key, value) {
        if (
            (kitBlocker && kitBlocker.isAttributeKeyBlocked(key)) ||
            !mpInstance._Store.activeForwarders.length
        ) {
            return;
        }

        mpInstance._Store.activeForwarders.forEach(function(forwarder) {
            const forwarderFunction = forwarder[functionNameKey];
            if (
                !forwarderFunction ||
                mpInstance._Helpers.isFilteredUserAttribute(
                    key,
                    forwarder.userAttributeFilters
                )
            ) {
                return;
            }
            try {
                let result;

                if (
                    functionNameKey ===
                    UserAttributeActionTypes.setUserAttribute
                ) {
                    result = forwarder.setUserAttribute(key, value);
                } else if (
                    functionNameKey ===
                    UserAttributeActionTypes.removeUserAttribute
                ) {
                    result = forwarder.removeUserAttribute(key);
                }

                if (result) {
                    mpInstance.Logger.verbose(result);
                }
            } catch (e) {
                mpInstance.Logger.error(e);
            }
        });
    };

    this.setForwarderUserIdentities = function(userIdentities) {
        mpInstance._Store.activeForwarders.forEach(function(forwarder) {
            var filteredUserIdentities = mpInstance._Helpers.filterUserIdentities(
                userIdentities,
                forwarder.userIdentityFilters
            );
            if (forwarder.setUserIdentity) {
                filteredUserIdentities.forEach(function(identity) {
                    var result = forwarder.setUserIdentity(
                        identity.Identity,
                        identity.Type
                    );
                    if (result) {
                        mpInstance.Logger.verbose(result);
                    }
                });
            }
        });
    };

    this.setForwarderOnUserIdentified = function(user) {
        mpInstance._Store.activeForwarders.forEach(function(forwarder) {
            var filteredUser = filteredMparticleUser(
                user.getMPID(),
                forwarder,
                mpInstance,
                kitBlocker
            );
            if (forwarder.onUserIdentified) {
                var result = forwarder.onUserIdentified(filteredUser);
                if (result) {
                    mpInstance.Logger.verbose(result);
                }
            }
        });
    };

    this.setForwarderOnIdentityComplete = function(user, identityMethod) {
        var result;

        mpInstance._Store.activeForwarders.forEach(function(forwarder) {
            var filteredUser = filteredMparticleUser(
                user.getMPID(),
                forwarder,
                mpInstance,
                kitBlocker
            );
            if (identityMethod === 'identify') {
                if (forwarder.onIdentifyComplete) {
                    result = forwarder.onIdentifyComplete(filteredUser);
                    if (result) {
                        mpInstance.Logger.verbose(result);
                    }
                }
            } else if (identityMethod === 'login') {
                if (forwarder.onLoginComplete) {
                    result = forwarder.onLoginComplete(filteredUser);
                    if (result) {
                        mpInstance.Logger.verbose(result);
                    }
                }
            } else if (identityMethod === 'logout') {
                if (forwarder.onLogoutComplete) {
                    result = forwarder.onLogoutComplete(filteredUser);
                    if (result) {
                        mpInstance.Logger.verbose(result);
                    }
                }
            } else if (identityMethod === 'modify') {
                if (forwarder.onModifyComplete) {
                    result = forwarder.onModifyComplete(filteredUser);
                    if (result) {
                        mpInstance.Logger.verbose(result);
                    }
                }
            }
        });
    };

    this.getForwarderStatsQueue = function() {
        return mpInstance._Persistence.forwardingStatsBatches
            .forwardingStatsEventQueue;
    };

    this.setForwarderStatsQueue = function(queue) {
        mpInstance._Persistence.forwardingStatsBatches.forwardingStatsEventQueue = queue;
    };

    this.configureForwarder = function(configuration) {
        var newForwarder = null,
            config = configuration,
            forwarders = {};

        // if there are kits inside of mpInstance._Store.SDKConfig.kits, then mParticle is self hosted
        if (
            mpInstance._Helpers.isObject(mpInstance._Store.SDKConfig.kits) &&
            Object.keys(mpInstance._Store.SDKConfig.kits).length > 0
        ) {
            forwarders = mpInstance._Store.SDKConfig.kits;
            // otherwise mParticle is loaded via script tag
        } else if (mpInstance._preInit.forwarderConstructors.length > 0) {
            mpInstance._preInit.forwarderConstructors.forEach(function(
                forwarder
            ) {
                forwarders[forwarder.name] = forwarder;
            });
        }

        for (var name in forwarders) {
            if (name === config.name) {
                if (
                    config.isDebug ===
                        mpInstance._Store.SDKConfig.isDevelopmentMode ||
                    config.isSandbox ===
                        mpInstance._Store.SDKConfig.isDevelopmentMode
                ) {
                    newForwarder = this.returnConfiguredKit(
                        forwarders[name],
                        config
                    );

                    mpInstance._Store.configuredForwarders.push(newForwarder);
                    break;
                }
            }
        }
    };

    // kits can be included via mParticle UI, or via sideloaded kit config API
    this.configureSideloadedKit = function(kitConstructor) {
        mpInstance._Store.configuredForwarders.push(
            this.returnConfiguredKit(kitConstructor)
        );
    };

    this.returnConfiguredKit = function(forwarder, config = {}) {
        const newForwarder = new forwarder.constructor();
        newForwarder.id = config.moduleId;

        // TODO: isSandbox, hasSandbox is never used in any kit or in core SDK.
        // isVisibleInvestigate is only used in 1 place. It is always true if
        // it is sent to JS. Investigate further to determine if these can be removed.
        // https://go.mparticle.com/work/SQDSDKS-5156
        newForwarder.isSandbox = config.isDebug || config.isSandbox;
        newForwarder.hasSandbox = config.hasDebugString === 'true';
        newForwarder.isVisible = config.isVisible || true;
        newForwarder.settings = config.settings || {};

        newForwarder.eventNameFilters = config.eventNameFilters || [];
        newForwarder.eventTypeFilters = config.eventTypeFilters || [];
        newForwarder.attributeFilters = config.attributeFilters || [];

        newForwarder.screenNameFilters = config.screenNameFilters || [];
        newForwarder.screenAttributeFilters =
            config.screenAttributeFilters || [];

        newForwarder.userIdentityFilters = config.userIdentityFilters || [];
        newForwarder.userAttributeFilters = config.userAttributeFilters || [];

        newForwarder.filteringEventAttributeValue =
            config.filteringEventAttributeValue || {};
        newForwarder.filteringUserAttributeValue =
            config.filteringUserAttributeValue || {};
        newForwarder.eventSubscriptionId = config.eventSubscriptionId || null;
        newForwarder.filteringConsentRuleValues =
            config.filteringConsentRuleValues || {};
        newForwarder.excludeAnonymousUser =
            config.excludeAnonymousUser || false;

        return newForwarder;
    };

    this.configurePixel = function(settings) {
        if (
            settings.isDebug ===
                mpInstance._Store.SDKConfig.isDevelopmentMode ||
            settings.isProduction !==
                mpInstance._Store.SDKConfig.isDevelopmentMode
        ) {
            mpInstance._Store.pixelConfigurations.push(settings);
        }
    };

    this.processForwarders = function(config, forwardingStatsCallback) {
        if (!config) {
            mpInstance.Logger.warning(
                'No config was passed. Cannot process forwarders'
            );
        } else {
            this.processMpConfiguredKits(config);
            this.processSideloadedKits(config);
            this.processPixelConfigs(config);

            self.initForwarders(
                mpInstance._Store.SDKConfig.identifyRequest.userIdentities,
                forwardingStatsCallback
            );
        }
    };

    this.processMpConfiguredKits = function(config) {
        try {
            if (Array.isArray(config.kitConfigs) && config.kitConfigs.length) {
                config.kitConfigs.forEach(function(kitConfig) {
                    self.configureForwarder(kitConfig);
                });
            }
        } catch (e) {
            mpInstance.Logger.error(
                'MP Kits not configured propertly. Kits may not be initialized. ' +
                    e
            );
        }
    };

    // TODO: Sideloading kits currently requires the use of a register method
    // which requires an object on which to be registered.
    // In the future, when all kits are moved to the config rather than
    // there being a separate process for MP configured kits and
    // sideloaded kits, this will need to be refactored.
    this.processSideloadedKits = function(config) {
        try {
            if (Array.isArray(config.sideloadedKits)) {
                const sideloadedKits = { kits: {} };
                // First register each kit's constructor onto sideloadedKits,
                // which is typed { kits: Dictionary<constructor> }.
                // The constructors are keyed by the name of the kit.
                config.sideloadedKits.forEach(function(sideloadedKit) {
                    sideloadedKit.register(sideloadedKits);
                });

                // Then configure each kit
                for (const registeredKitKey in sideloadedKits.kits) {
                    const kitConstructor =
                        sideloadedKits.kits[registeredKitKey];
                    self.configureSideloadedKit(kitConstructor);
                }
            }
        } catch (e) {
            mpInstance.Logger.error(
                'Sideloaded Kits not configured propertly. Kits may not be initialized. ' +
                    e
            );
        }
    };

    this.processPixelConfigs = function(config) {
        try {
            if (
                Array.isArray(config.pixelConfigs) &&
                config.pixelConfigs.length
            ) {
                config.pixelConfigs.forEach(function(pixelConfig) {
                    self.configurePixel(pixelConfig);
                });
            }
        } catch (e) {
            mpInstance.Logger.error(
                'Cookie Sync configs not configured propertly. Cookie Sync may not be initialized. ' +
                    e
            );
        }
    };
}
