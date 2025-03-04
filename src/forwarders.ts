import { EventType, IdentityType, MessageType } from './types';
import filteredMparticleUser from './filteredMparticleUser';
import { inArray, isEmpty, valueof } from './utils';
import KitFilterHelper from './kitFilterHelper';
import Constants from './constants';
import APIClient from './apiClient';
import { IMPForwarder, KitRegistrationConfig, UserAttributeFilters, UserIdentityFilters } from './forwarders.interfaces';
import { IMParticleWebSDKInstance } from './mp-instance';
import KitBlocker from './kitBlocking';
import { IFilteringUserAttributeValue, IKitConfigs } from './configAPIClient';
import { IMParticleUser, ISDKUserAttributes, ISDKUserIdentity, UserAttributes } from './identity-user-interfaces';
import { SDKEvent } from './sdkRuntimeModels';
import { Callback, UserIdentities } from '@mparticle/web-sdk';

const { Modify, Identify, Login, Logout } = Constants.IdentityMethods;

export default function Forwarders(this: IMPForwarder,  mpInstance: IMParticleWebSDKInstance, kitBlocker: KitBlocker) {
    var self = this;
    this.forwarderStatsUploader = new APIClient(
        mpInstance,
        kitBlocker
    ).initializeForwarderStatsUploader();

    const UserAttributeActionTypes = {
        setUserAttribute: 'setUserAttribute',
        removeUserAttribute: 'removeUserAttribute',
    };

    this.initForwarders = (userIdentities: UserIdentities, forwardingStatsCallback: Callback) => {
        const user: IMParticleUser = mpInstance.Identity.getCurrentUser();
        const {
            webviewBridgeEnabled,
            configuredForwarders,
        } = mpInstance._Store;

        const { filterUserAttributes, filterUserIdentities } = mpInstance._Helpers;
        const { isEnabledForUserConsent } = mpInstance._Consent;
        if (!webviewBridgeEnabled && configuredForwarders) {
            // Some js libraries require that they be loaded first, or last, etc
            configuredForwarders.sort(function(x, y) {
                // https://go.mparticle.com/work/SQDSDKS-7113
                x.settings.PriorityValue = x.settings.PriorityValue || 0;
                y.settings.PriorityValue = y.settings.PriorityValue || 0;
                return (
                    -1 * (x.settings.PriorityValue - y.settings.PriorityValue)
                );
            });

            mpInstance._Store.activeForwarders = configuredForwarders.filter((forwarder: IMPForwarder) => {
                if (
                    !isEnabledForUserConsent(
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

                const filteredUserIdentities: ISDKUserIdentity[] = filterUserIdentities(
                    userIdentities,
                    forwarder.userIdentityFilters
                );
                const filteredUserAttributes: ISDKUserAttributes = filterUserAttributes(
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
            });
        }
    };

    this.isEnabledForUserAttributes = (filterObject: IFilteringUserAttributeValue, user: IMParticleUser) => {
        const { hashAttributeConditionalForwarding } = KitFilterHelper;
        if (isEmpty(filterObject)) {
            return true;
        }

        let attrHash: string;
        let valueHash: string;
        let userAttributes: UserAttributes;

        if (!user) {
            return false;
        } else {
            userAttributes = user.getAllUserAttributes();
        }

        const {
            userAttributeName,
            userAttributeValue,
            includeOnMatch
        } = filterObject;

        let isMatch = false;

        try {
            if (!isEmpty(userAttributes)) {
                for (const attrName in userAttributes) {
                    if (userAttributes.hasOwnProperty(attrName)) {
                        attrHash = hashAttributeConditionalForwarding(attrName);
                        valueHash = hashAttributeConditionalForwarding(userAttributes[attrName] as string);

                        if (attrHash === userAttributeName && valueHash === userAttributeValue) {
                            isMatch = true;
                            break;
                        }
                    }
                }
            }

            return filterObject ? includeOnMatch === isMatch : true;
        } catch (e) {
            // in any error scenario, err on side of returning true and forwarding event
            return true;
        }
    };

    this.isEnabledForUnknownUser = (excludeAnonymousUserBoolean: boolean, user: IMParticleUser) => {
        if (!user || !user.isLoggedIn()) {
            if (excludeAnonymousUserBoolean) {
                return false;
            }
        }
        return true;
    };

    this.applyToForwarders = (functionName: string, functionArgs: any[]) => {
        const activeForwarders: IMPForwarder[] = mpInstance._Store.activeForwarders;

        if (!activeForwarders) {
            return;
        }
        activeForwarders.forEach(function(forwarder) {
            const forwarderFunction: IMPForwarder = forwarder[functionName];
            if (forwarderFunction) {
                try {
                    const result: string = forwarder[functionName](functionArgs);

                    if (result) {
                        mpInstance.Logger.verbose(result);
                    }
                } catch (e) {
                    mpInstance.Logger.verbose(e as string);
                }
            }
        });
    };

    this.sendEventToForwarders = (event: SDKEvent) => {
        const { webviewBridgeEnabled, activeForwarders } = mpInstance._Store;

        let clonedEvent: SDKEvent;
        let hashedEventName: number;
        let hashedEventType: number;

        const { hashUserIdentity } = KitFilterHelper;

        const filterUserIdentities = (event: SDKEvent, filterList: UserIdentityFilters) => {
            if (isEmpty(event.UserIdentities)) {
                return;
            }
            event.UserIdentities.forEach(function(userIdentity: typeof IdentityType, index: number) {
                const hash: number = hashUserIdentity(userIdentity.Type);
                if (inArray(filterList, hash)) {
                    event.UserIdentities.splice(index, 1);

                    if (index > 0) {
                        index--;
                    }
                }
            });
        };

        const filterAttributes = (event: SDKEvent, filterList: UserAttributeFilters) => {
            let hash: number;

            if (isEmpty(filterList)) {
                return;
            }

            for (const attrName in event.EventAttributes) {
                if (event.EventAttributes.hasOwnProperty(attrName)) {
                    hash = KitFilterHelper.hashEventAttributeKey(
                        event.EventCategory as valueof<typeof EventType>,
                        event.EventName,
                        attrName
                    );

                    if (inArray(filterList, hash)) {
                        delete event.EventAttributes[attrName];
                    }
                }
            }
        };

        const inFilteredList = (filterList: UserAttributeFilters, hash: number) => !isEmpty(filterList) && inArray(filterList, hash);

        const forwardingRuleMessageTypes = [
            MessageType.PageEvent,
            MessageType.PageView,
            MessageType.Commerce,
        ];

        if (!webviewBridgeEnabled && activeForwarders) {
            const { hashEventName, hashEventType, hashAttributeConditionalForwarding } = KitFilterHelper;
            hashedEventName = hashEventName(
                event.EventName,

                // FIXME: Set up union of EventType and EventCategory
                event.EventCategory as valueof<typeof EventType>
            );
            hashedEventType = hashEventType(
                // FIXME: Set up union of EventType and EventCategory
                event.EventCategory as valueof<typeof EventType>
            );

            for (let i = 0; i < activeForwarders.length; i++) {
                // Check attribute forwarding rule. This rule allows users to only forward an event if a
                // specific attribute exists and has a specific value. Alternatively, they can specify
                // that an event not be forwarded if the specified attribute name and value exists.
                // The two cases are controlled by the "includeOnMatch" boolean value.
                // Supported message types for attribute forwarding rules are defined in the forwardingRuleMessageTypes array

                const { filteringEventAttributeValue } = activeForwarders[i];

                if (
                    // FIXME:
                    // @ts-expect-error
                    forwardingRuleMessageTypes.indexOf(event.EventDataType) >
                        -1 &&
                    filteringEventAttributeValue &&
                    filteringEventAttributeValue.eventAttributeName &&
                    filteringEventAttributeValue.eventAttributeValue
                ) {
                    let foundProp = null;

                    // Attempt to find the attribute in the collection of event attributes
                    if (event.EventAttributes) {
                        for (const prop in event.EventAttributes) {
                            const hashedEventAttributeName = hashAttributeConditionalForwarding(prop);

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

                    const isMatch = foundProp !== null && foundProp.value === activeForwarders[i].filteringEventAttributeValue.eventAttributeValue;

                    const shouldInclude = activeForwarders[i].filteringEventAttributeValue.includeOnMatch === true
                        ? isMatch
                        : !isMatch;

                    if (!shouldInclude) {
                        continue;
                    }
                }

                // Clone the event object, as we could be sending different attributes to each forwarder
                clonedEvent = {} as SDKEvent;
                clonedEvent = mpInstance._Helpers.extend(
                    true,
                    clonedEvent,
                    event
                );
                // Check event filtering rules
                if (
                    event.EventDataType === MessageType.PageEvent &&
                    (inFilteredList(
                        activeForwarders[i].eventNameFilters,
                        hashedEventName
                    ) ||
                        inFilteredList(
                            activeForwarders[i]
                                .eventTypeFilters,
                            hashedEventType
                        ))
                ) {
                    continue;
                } else if (
                    event.EventDataType === MessageType.Commerce &&
                    inFilteredList(
                        mpInstance._Store.activeForwarders[i].eventTypeFilters,
                        hashedEventType
                    )
                ) {
                    continue;
                } else if (
                    event.EventDataType === MessageType.PageView &&
                    inFilteredList(
                        mpInstance._Store.activeForwarders[i].screenNameFilters,
                        hashedEventName
                    )
                ) {
                    continue;
                }

                // Check attribute filtering rules
                if (clonedEvent.EventAttributes) {
                    if (event.EventDataType === MessageType.PageEvent) {
                        filterAttributes(
                            clonedEvent,
                            mpInstance._Store.activeForwarders[i]
                                .attributeFilters
                        );
                    } else if (
                        event.EventDataType === MessageType.PageView
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
                    activeForwarders[i].userIdentityFilters
                );

                // Check user attribute filtering rules
                clonedEvent.UserAttributes = mpInstance._Helpers.filterUserAttributes(
                    clonedEvent.UserAttributes,
                    activeForwarders[i].userAttributeFilters
                );

                if (activeForwarders[i].process) {
                    mpInstance.Logger.verbose(
                        'Sending message to forwarder: ' +
                            activeForwarders[i].name
                    );
                    const result = activeForwarders[i].process(clonedEvent);

                    if (result) {
                        mpInstance.Logger.verbose(result);
                    }
                }
            }
        }
    };

    this.handleForwarderUserAttributes = (functionNameKey: string, key: string, value: string | string[]) => {
        if (
            (kitBlocker && kitBlocker.isAttributeKeyBlocked(key)) ||
            !mpInstance._Store.activeForwarders.length
        ) {
            return;
        }

        mpInstance._Store.activeForwarders.forEach(function(forwarder) {
            const forwarderFunction: IMPForwarder = forwarder[functionNameKey];
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
                let result: string;

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
                mpInstance.Logger.error(e as string);
            }
        });
    };

    // TODO: https://go.mparticle.com/work/SQDSDKS-6036
    // @deprecated
    this.setForwarderUserIdentities = (userIdentities: UserIdentities) => {
        mpInstance._Store.activeForwarders.forEach((forwarder) => {
            const filteredUserIdentities: ISDKUserIdentity[] = mpInstance._Helpers.filterUserIdentities(
                userIdentities,
                forwarder.userIdentityFilters
            );
            if (forwarder.setUserIdentity) {
                filteredUserIdentities.forEach((identity) => {
                    const result: string = forwarder.setUserIdentity(
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

    this.setForwarderOnUserIdentified = (user: IMParticleUser) => {
        mpInstance._Store.activeForwarders.forEach((forwarder) => {
            const filteredUser = filteredMparticleUser(
                user.getMPID(),
                forwarder,
                mpInstance,
                kitBlocker
            );
            if (forwarder.onUserIdentified) {
                const result: string = forwarder.onUserIdentified(filteredUser);
                if (result) {
                    mpInstance.Logger.verbose(result);
                }
            }
        });
    };

    this.setForwarderOnIdentityComplete = (user: IMParticleUser, identityMethod: IdentityAPIMethod) => {
        let result: string;

        mpInstance._Store.activeForwarders.forEach((forwarder: IMPForwarder) => {
            const filteredUser: IMParticleUser = filteredMparticleUser(
                user.getMPID(),
                forwarder,
                mpInstance,
                kitBlocker
            );

            const filteredUserIdentities: IdentityApiData  = filteredUser.getUserIdentities();

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

    this.getForwarderStatsQueue = () =>
        mpInstance._Persistence.forwardingStatsBatches.forwardingStatsEventQueue;

    this.setForwarderStatsQueue = (queue: IForwardingStatsData[]) =>
        mpInstance._Persistence.forwardingStatsBatches.forwardingStatsEventQueue = queue;

    // Processing forwarders is a 2 step process:
    //   1. Configure the kit
    //   2. Initialize the kit
    // There are 2 types of kits:
    //   1. UI-enabled kits
    //   2. Sideloaded kits.
    this.processForwarders = (config: SDKInitConfig, forwardingStatsCallback: Callback) => {
        if (!config) {
            mpInstance.Logger.warning(
                'No config was passed. Cannot process forwarders'
            );
            return;
        }

        this.processUIEnabledKits(config);
        this.processSideloadedKits(config);

        self.initForwarders(
            mpInstance._Store.SDKConfig.identifyRequest.userIdentities,
            forwardingStatsCallback
        );
    };

    // These are kits that are enabled via the mParticle UI.
    // A kit that is UI-enabled will have a kit configuration that returns from
    // the server, or in rare cases, is passed in by the developer.
    // The kit configuration will be compared with the kit constructors to determine
    // if there is a match before being initialized.
    // Only kits that are configured properly can be active and used for kit forwarding.
    this.processUIEnabledKits = (config: SDKInitConfig) => {
        const kits: Dictionary<RegisteredKit> = this.returnKitConstructors();

        try {
            if (Array.isArray(config.kitConfigs) && !isEmpty(config.kitConfigs)) {
                config.kitConfigs.forEach((kitConfig) => self.configureUIEnabledKit(kitConfig, kits));
            }
        } catch (e) {
            mpInstance.Logger.error(
                'MP Kits not configured propertly. Kits may not be initialized. ' +
                    e
            );
        }
    };

    this.returnKitConstructors = () => {
        // FIXME: Try to set this up with registered kits or something similar
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

    this.configureUIEnabledKit = (config: IKitConfigs, kits: Dictionary<RegisteredKit>) => {
        let newKit: IMPForwarder | null = null;
        const { SDKConfig } = mpInstance._Store;

        for (let kitName in kits) {
            const { suffix, name, isDebug, isSandbox } = config;

            // Configs are returned with suffixes also. We need to consider the
            // config suffix here to match the constructor suffix
            const kitNameWithConfigSuffix: string = suffix ? `${name}-${suffix}` : undefined;

            const isDevelopmentMode: boolean = 
                isDebug === SDKConfig.isDevelopmentMode || 
                isSandbox === SDKConfig.isDevelopmentMode;

            if (kitName === kitNameWithConfigSuffix || kitName === name) {
                if (isDevelopmentMode) {
                    newKit = this.returnConfiguredKit(kits[kitName], config);

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
    // FIXME: Fix types here
    this.processSideloadedKits = (mpConfig: SDKInitConfig) => {
        try {
            if (Array.isArray(mpConfig.sideloadedKits)) {
                const registeredSideloadedKits: KitRegistrationConfig = { kits: {} };

                // FIXME: Expected type causes error
                const unregisteredSideloadedKits = mpConfig.sideloadedKits;

                // FIXME: Define type
                unregisteredSideloadedKits.forEach((unregisteredKit) => {
                    try {
                        // Register each sideloaded kit, which adds a key of the sideloaded kit name
                        // and a value of the sideloaded kit constructor.
                        unregisteredKit.kitInstance.register(
                            registeredSideloadedKits
                        );
                        const kitName: string = unregisteredKit.kitInstance.name;
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
    this.configureSideloadedKit = (kitConstructor: RegisteredKit) => {
        mpInstance._Store.configuredForwarders.push(
            // FIXME: Figure out why filters should be typed as IKitConfigs
            this.returnConfiguredKit(kitConstructor, kitConstructor.filters as IKitConfigs)
        );
    };

    this.returnConfiguredKit = function(forwarder, config = {} as IKitConfigs) {
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

    this.configurePixel = (settings: IPixelConfiguration) => {
        const { SDKConfig } = mpInstance._Store;

        if (
            settings.isDebug === SDKConfig.isDevelopmentMode ||
            settings.isProduction !== SDKConfig.isDevelopmentMode
        ) {
            mpInstance._Store.pixelConfigurations.push(settings);
        }
    };

    this.processPixelConfigs = (config: SDKInitConfig) => {
        try {
            if (!isEmpty(config.pixelConfigs)) {
                config.pixelConfigs.forEach((pixelConfig: IPixelConfiguration) => {
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

    this.sendSingleForwardingStatsToServer = async (forwardingStatsData: IForwardingStatsData) => {
        // https://go.mparticle.com/work/SQDSDKS-6568
        const fetchPayload: IFetchPayload = {
            method: 'post',
            body: JSON.stringify(forwardingStatsData),
            headers: {
                Accept: 'text/plain;charset=UTF-8',
                'Content-Type': 'text/plain;charset=UTF-8',
            },
        };

        const response: Response = await this.forwarderStatsUploader.upload(fetchPayload);

        let message: string;
        // This is a fire and forget, so we only need to log the response based on the code, and not return any response body
        if (response.status === 202) {
            // https://go.mparticle.com/work/SQDSDKS-6670
            message = 'Successfully sent forwarding stats to mParticle Servers';
        } else {
            message =
                'Issue with forwarding stats to mParticle Servers, received HTTP Code of ' +
                response.statusText;
        }

        mpInstance?.Logger?.verbose(message);
    };
}
