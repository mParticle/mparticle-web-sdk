import Types from './types';
import filteredMparticleUser from './filteredMparticleUser';
import { isEmpty } from './utils';
import KitFilterHelper from './kitFilterHelper';
import Constants from './constants';
import APIClient from './apiClient';

const { Modify, Identify, Login, Logout } = Constants.IdentityMethods;

export default function Forwarders(mpInstance, kitBlocker) {
    var self = this;
    this.forwarderStatsUploader = new APIClient(
        mpInstance,
        kitBlocker
    ).initializeForwarderStatsUploader();

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
                        attrHash = KitFilterHelper.hashAttributeConditionalForwarding(
                            attrName
                        );
                        valueHash = KitFilterHelper.hashAttributeConditionalForwarding(
                            userAttributes[attrName]
                        );

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
                                KitFilterHelper.hashUserIdentity(
                                    userIdentity.Type
                                )
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
                        hash = KitFilterHelper.hashEventAttributeKey(
                            event.EventCategory,
                            event.EventName,
                            attrName
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
            hashedEventName = KitFilterHelper.hashEventName(
                event.EventName,
                event.EventCategory
            );
            hashedEventType = KitFilterHelper.hashEventType(
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
                            hashedEventAttributeName = KitFilterHelper.hashAttributeConditionalForwarding(
                                prop
                            );

                            if (
                                hashedEventAttributeName ===
                                mpInstance._Store.activeForwarders[i]
                                    .filteringEventAttributeValue
                                    .eventAttributeName
                            ) {
                                foundProp = {
                                    name: hashedEventAttributeName,
                                    value: KitFilterHelper.hashAttributeConditionalForwarding(
                                        event.EventAttributes[prop]
                                    ),
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

    // TODO: https://go.mparticle.com/work/SQDSDKS-6036
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

            const filteredUserIdentities = filteredUser.getUserIdentities();

            if (identityMethod === Identify) {
                if (forwarder.onIdentifyComplete) {
                    result = forwarder.onIdentifyComplete(
                        filteredUser,
                        filteredUserIdentities
                    );
                    if (result) {
                        mpInstance.Logger.verbose(result);
                    }
                }
            } else if (identityMethod === Login) {
                if (forwarder.onLoginComplete) {
                    result = forwarder.onLoginComplete(
                        filteredUser,
                        filteredUserIdentities
                    );
                    if (result) {
                        mpInstance.Logger.verbose(result);
                    }
                }
            } else if (identityMethod === Logout) {
                if (forwarder.onLogoutComplete) {
                    result = forwarder.onLogoutComplete(
                        filteredUser,
                        filteredUserIdentities
                    );
                    if (result) {
                        mpInstance.Logger.verbose(result);
                    }
                }
            } else if (identityMethod === Modify) {
                if (forwarder.onModifyComplete) {
                    result = forwarder.onModifyComplete(
                        filteredUser,
                        filteredUserIdentities
                    );
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

    // Processing forwarders is a 2 step process:
    //   1. Configure the kit
    //   2. Initialize the kit
    // There are 2 types of kits:
    //   1. UI-enabled kits
    //   2. Sideloaded kits.
    this.processForwarders = function(config, forwardingStatsCallback) {
        if (!config) {
            mpInstance.Logger.warning(
                'No config was passed. Cannot process forwarders'
            );
        } else {
            this.processUIEnabledKits(config);
            this.processSideloadedKits(config);

            self.initForwarders(
                mpInstance._Store.SDKConfig.identifyRequest.userIdentities,
                forwardingStatsCallback
            );
        }
    };

    // These are kits that are enabled via the mParticle UI.
    // A kit that is UI-enabled will have a kit configuration that returns from
    // the server, or in rare cases, is passed in by the developer.
    // The kit configuration will be compared with the kit constructors to determine
    // if there is a match before being initialized.
    // Only kits that are configured properly can be active and used for kit forwarding.
    this.processUIEnabledKits = function(config) {
        let kits = this.returnKitConstructors();

        try {
            if (Array.isArray(config.kitConfigs) && config.kitConfigs.length) {
                config.kitConfigs.forEach(function(kitConfig) {
                    self.configureUIEnabledKit(kitConfig, kits);
                });
            }
        } catch (e) {
            mpInstance.Logger.error(
                'MP Kits not configured propertly. Kits may not be initialized. ' +
                    e
            );
        }
    };

    this.returnKitConstructors = function() {
        let kits = {};
        // If there are kits inside of mpInstance._Store.SDKConfig.kits, then mParticle is self hosted
        if (!isEmpty(mpInstance._Store.SDKConfig.kits)) {
            kits = mpInstance._Store.SDKConfig.kits;
            // otherwise mParticle is loaded via script tag
        } else if (!isEmpty(mpInstance._preInit.forwarderConstructors)) {
            mpInstance._preInit.forwarderConstructors.forEach(function(
                kitConstructor
            ) {
                // A suffix is added to a kitConstructor and kit config if there are multiple different
                // versions of a client kit.  This matches the suffix in the DB.  As an example
                // the GA4 kit has a client kit and a server side kit which has a client side
                // component.  They share the same name/module ID in the DB, so we include a
                // suffix to distinguish them in the kits object.
                // If a customer wanted simultaneous GA4 client and server connections,
                // a suffix allows the SDK to distinguish the two.
                if (kitConstructor.suffix) {
                    const kitNameWithConstructorSuffix = `${kitConstructor.name}-${kitConstructor.suffix}`;
                    kits[kitNameWithConstructorSuffix] = kitConstructor;
                } else {
                    kits[kitConstructor.name] = kitConstructor;
                }
            });
        }
        return kits;
    };

    this.configureUIEnabledKit = function(configuration, kits) {
        let newKit = null;
        const config = configuration;

        for (let name in kits) {
            // Configs are returned with suffixes also. We need to consider the
            // config suffix here to match the constructor suffix
            let kitNameWithConfigSuffix;
            if (config.suffix) {
                kitNameWithConfigSuffix = `${config.name}-${config.suffix}`;
            }

            if (name === kitNameWithConfigSuffix || name === config.name) {
                if (
                    config.isDebug ===
                        mpInstance._Store.SDKConfig.isDevelopmentMode ||
                    config.isSandbox ===
                        mpInstance._Store.SDKConfig.isDevelopmentMode
                ) {
                    newKit = this.returnConfiguredKit(kits[name], config);

                    mpInstance._Store.configuredForwarders.push(newKit);
                    break;
                }
            }
        }
    };

    // Unlike UI enabled kits, sideloaded kits are always added to active forwarders.

    // TODO: Sideloading kits currently require the use of a register method
    // which requires an object on which to be registered.
    // In the future, when all kits are moved to the mpConfig rather than
    // there being a separate process for MP configured kits and
    // sideloaded kits, this will need to be refactored.
    this.processSideloadedKits = function(mpConfig) {
        try {
            if (Array.isArray(mpConfig.sideloadedKits)) {
                const registeredSideloadedKits = { kits: {} };
                const unregisteredSideloadedKits = mpConfig.sideloadedKits;

                unregisteredSideloadedKits.forEach(function(unregisteredKit) {
                    try {
                        // Register each sideloaded kit, which adds a key of the sideloaded kit name
                        // and a value of the sideloaded kit constructor.
                        unregisteredKit.kitInstance.register(
                            registeredSideloadedKits
                        );
                        const kitName = unregisteredKit.kitInstance.name;
                        // Then add the kit filters to each registered kit.
                        registeredSideloadedKits.kits[kitName].filters =
                            unregisteredKit.filterDictionary;
                    } catch (e) {
                        console.error(
                            'Error registering sideloaded kit ' +
                                unregisteredKit.kitInstance.name
                        );
                    }
                });

                // Then configure each registered kit
                for (const registeredKitKey in registeredSideloadedKits.kits) {
                    const registeredKit =
                        registeredSideloadedKits.kits[registeredKitKey];
                    self.configureSideloadedKit(registeredKit);
                }

                // If Sideloaded Kits are successfully registered,
                // record this in the Store.
                if (!isEmpty(registeredSideloadedKits.kits)) {
                    const kitKeys = Object.keys(registeredSideloadedKits.kits);
                    mpInstance._Store.sideloadedKitsCount = kitKeys.length;
                }
            }
        } catch (e) {
            mpInstance.Logger.error(
                'Sideloaded Kits not configured propertly. Kits may not be initialized. ' +
                    e
            );
        }
    };

    // kits can be included via mParticle UI, or via sideloaded kit config API
    this.configureSideloadedKit = function(kitConstructor) {
        mpInstance._Store.configuredForwarders.push(
            this.returnConfiguredKit(kitConstructor, kitConstructor.filters)
        );
    };

    this.returnConfiguredKit = function(forwarder, config = {}) {
        const newForwarder = new forwarder.constructor();
        newForwarder.id = config.moduleId;

        // TODO: isSandbox, hasSandbox is never used in any kit or in core SDK.
        // isVisible.  Investigate is only used in 1 place. It is always true if
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

    this.processPixelConfigs = function(config) {
        try {
            if (!isEmpty(config.pixelConfigs)) {
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

    this.sendSingleForwardingStatsToServer = async forwardingStatsData => {
        const fetchPayload = {
            method: 'post',
            body: JSON.stringify(forwardingStatsData),
            headers: {
                Accept: 'text/plain;charset=UTF-8',
                'Content-Type': 'text/plain;charset=UTF-8',
            },
        };

        const response = await this.forwarderStatsUploader.upload(fetchPayload);

        // This is a fire and forget, so we only need to log the response based on the code, and not return any response body
        if (response.status === 202) {
            mpInstance?.Logger?.verbose(
                'Successfully sent forwarding stats to mParticle Servers'
            );
        } else {
            mpInstance?.Logger?.verbose(
                'Issue with forwarding stats to mParticle Servers, received HTTP Code of ' +
                    response.statusText
            );
        }
    };
}
