import filteredMparticleUser from './filteredMparticleUser';
import { isEmpty, extend } from './utils';
import KitFilterHelper from './kitFilterHelper';
import Constants from './constants';
import APIClient, { IForwardingStatsData } from './apiClient';
import {
    isBlockedByForwardingRule,
    isBlockedByEventFilter,
    filterEventAttributes,
    filterUserIdentities,
    isBatchEventAllowed,
    filterBatchEventAttributes,
    filterBatchIdentities,
} from './forwarder-utils';
import { IMParticleWebSDKInstance } from './mp-instance';
import { SDKEvent } from './sdkRuntimeModels';
import {
    IForwarders,
    MPForwarder,
    RegisteredKit,
    forwardingStatsCallback as ForwardingStatsCallback,
    ConfiguredKit,
} from './forwarders.interfaces';
import {
    IConfigResponse,
    IKitConfigs,
    IFilteringUserAttributeValue,
    IKitFilterSettings,
} from './configAPIClient';
import { IPixelConfiguration } from './cookieSyncManager';
import { Batch } from '@mparticle/event-models';
import { IMParticleUser, ISDKUserIdentity } from './identity-user-interfaces';
import KitBlocker from './kitBlocking';
import { Dictionary } from './utils';

const { Modify, Identify, Login, Logout } = Constants.IdentityMethods;

export default function Forwarders(
    this: IForwarders,
    mpInstance: IMParticleWebSDKInstance,
    kitBlocker: KitBlocker
): void {
    const self = this;

    this.forwarderStatsUploader = new APIClient(
        mpInstance,
        kitBlocker
    ).initializeForwarderStatsUploader();

    const UserAttributeActionTypes = {
        setUserAttribute: 'setUserAttribute',
        removeUserAttribute: 'removeUserAttribute',
    };

    this.initForwarders = function(
        userIdentities: ISDKUserIdentity[],
        forwardingStatsCallback: ForwardingStatsCallback
    ): void {
        const user = mpInstance.Identity.getCurrentUser();
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
                        !(self.isEnabledForUserAttributes as Function)(
                            forwarder.filteringUserAttributeValue,
                            user
                        )
                    ) {
                        return false;
                    }
                    if (
                        !(self.isEnabledForUnknownUser as Function)(
                            forwarder.excludeAnonymousUser,
                            user
                        )
                    ) {
                        return false;
                    }

                    const filteredUserIdentities = (mpInstance._Helpers.filterUserIdentities as Function)(
                        userIdentities,
                        forwarder.userIdentityFilters
                    );
                    const filteredUserAttributes = KitFilterHelper.filterUserAttributes(
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

    this.isEnabledForUserAttributes = function(
        filterObject: IFilteringUserAttributeValue,
        user: IMParticleUser
    ): boolean {
        if (
            !filterObject ||
            !mpInstance._Helpers.isObject(filterObject) ||
            !Object.keys(filterObject).length
        ) {
            return true;
        }

        let attrHash: string;
        let valueHash: string;
        let userAttributes: Record<string, string>;

        if (!user) {
            return false;
        } else {
            userAttributes = user.getAllUserAttributes();
        }

        let isMatch = false;

        try {
            if (
                userAttributes &&
                mpInstance._Helpers.isObject(userAttributes) &&
                Object.keys(userAttributes).length
            ) {
                for (const attrName in userAttributes) {
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

    this.isEnabledForUnknownUser = function(
        excludeAnonymousUserBoolean: boolean,
        user: IMParticleUser
    ): boolean {
        if (!user || !user.isLoggedIn()) {
            if (excludeAnonymousUserBoolean) {
                return false;
            }
        }
        return true;
    };

    this.applyToForwarders = function(
        functionName: string,
        functionArgs: string[]
    ): void {
        if (mpInstance._Store.activeForwarders.length) {
            mpInstance._Store.activeForwarders.forEach(function(forwarder) {
                const forwarderFunction = forwarder[functionName];
                if (forwarderFunction) {
                    try {
                        const result = forwarder[functionName](functionArgs);

                        if (result) {
                            mpInstance.Logger.verbose(result as string);
                        }
                    } catch (e) {
                        mpInstance.Logger.verbose(e as string);
                    }
                }
            });
        }
    };

    this.sendEventToForwarders = function(event: SDKEvent): void {
        let clonedEvent: SDKEvent;
        let hashedEventName: number;
        let hashedEventType: number;

        if (
            !mpInstance._Store.webviewBridgeEnabled &&
            mpInstance._Store.activeForwarders
        ) {
            hashedEventName = (KitFilterHelper.hashEventName as Function)(
                event.EventName,
                event.EventCategory
            );
            hashedEventType = (KitFilterHelper.hashEventType as Function)(
                event.EventCategory
            );

            for (
                let i = 0;
                i < mpInstance._Store.activeForwarders.length;
                i++
            ) {
                const forwarder = mpInstance._Store.activeForwarders[i];

                if (
                    (isBlockedByForwardingRule as Function)(
                        event.EventDataType,
                        event.EventAttributes,
                        forwarder
                    )
                ) {
                    continue;
                }

                // Clone the event object, as we could be sending different attributes to each forwarder
                clonedEvent = extend(true, {}, event);

                if (
                    (isBlockedByEventFilter as Function)(
                        event.EventDataType,
                        hashedEventName,
                        hashedEventType,
                        forwarder
                    )
                ) {
                    continue;
                }

                clonedEvent.EventAttributes = (filterEventAttributes as Function)(
                    event.EventDataType,
                    event.EventCategory,
                    event.EventName,
                    clonedEvent.EventAttributes,
                    forwarder
                );

                // Check user identity filtering rules
                clonedEvent.UserIdentities = (filterUserIdentities as Function)(
                    clonedEvent.UserIdentities,
                    forwarder.userIdentityFilters
                );

                // Check user attribute filtering rules
                clonedEvent.UserAttributes = (KitFilterHelper.filterUserAttributes as Function)(
                    clonedEvent.UserAttributes,
                    forwarder.userAttributeFilters
                );

                if (forwarder.process) {
                    mpInstance.Logger.verbose(
                        'Sending message to forwarder: ' + forwarder.name
                    );
                    const result = forwarder.process(clonedEvent);

                    if (result) {
                        mpInstance.Logger.verbose(result);
                    }
                }
            }
        }
    };

    this.sendBatchToForwarders = function(batch: Batch): void {
        if (
            mpInstance._Store.webviewBridgeEnabled ||
            !mpInstance._Store.activeForwarders
        ) {
            return;
        }

        for (const forwarder of mpInstance._Store.activeForwarders) {
            if (!forwarder.processBatch) {
                continue;
            }

            try {
                const batchCopy = extend(true, {}, batch);

                if (batchCopy.events) {
                    batchCopy.events = batchCopy.events.filter(function(
                        batchEvent
                    ) {
                        return (isBatchEventAllowed as Function)(batchEvent, forwarder);
                    });

                    batchCopy.events.forEach(function(batchEvent) {
                        (filterBatchEventAttributes as Function)(batchEvent, forwarder);
                    });
                }

                batchCopy.user_identities = (filterBatchIdentities as Function)(
                    batchCopy.user_identities,
                    forwarder.userIdentityFilters
                );

                if (batchCopy.user_attributes) {
                    batchCopy.user_attributes = KitFilterHelper.filterUserAttributes(
                        batchCopy.user_attributes,
                        forwarder.userAttributeFilters
                    );
                }

                if (!batchCopy.events || batchCopy.events.length === 0) {
                    continue;
                }

                const result = forwarder.processBatch(batchCopy);

                if (result) {
                    mpInstance.Logger.verbose(result as string);
                }
            } catch (e) {
                mpInstance.Logger.verbose(e as string);
            }
        }
    };

    this.handleForwarderUserAttributes = function(
        functionNameKey: string,
        key: string,
        value: string
    ): void {
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
                KitFilterHelper.isFilteredUserAttribute(
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
    this.setForwarderUserIdentities = function(
        userIdentities: ISDKUserIdentity[]
    ): void {
        mpInstance._Store.activeForwarders.forEach(function(forwarder) {
            const filteredUserIdentities = (mpInstance._Helpers.filterUserIdentities as Function)(
                userIdentities,
                forwarder.userIdentityFilters
            ) as ISDKUserIdentity[];
            if (forwarder.setUserIdentity) {
                filteredUserIdentities.forEach(function(
                    identity: ISDKUserIdentity
                ) {
                    const result = (forwarder.setUserIdentity as Function)(
                        identity.Identity,
                        identity.Type
                    ) as string;
                    if (result) {
                        mpInstance.Logger.verbose(result);
                    }
                });
            }
        });
    };

    this.setForwarderOnUserIdentified = function(
        user: IMParticleUser
    ): void {
        mpInstance._Store.activeForwarders.forEach(function(forwarder) {
            const filteredUser = filteredMparticleUser(
                user.getMPID(),
                forwarder,
                mpInstance,
                kitBlocker
            );
            if (forwarder.onUserIdentified) {
                const result = forwarder.onUserIdentified(filteredUser);
                if (result) {
                    mpInstance.Logger.verbose(result);
                }
            }
        });
    };

    this.setForwarderOnIdentityComplete = function(
        user: IMParticleUser,
        identityMethod: string
    ): void {
        let result: string;

        mpInstance._Store.activeForwarders.forEach(function(forwarder) {
            const filteredUser = filteredMparticleUser(
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

    this.getForwarderStatsQueue = function(): IForwardingStatsData[] {
        return mpInstance._Persistence.forwardingStatsBatches
            .forwardingStatsEventQueue;
    };

    this.setForwarderStatsQueue = function(
        queue: IForwardingStatsData[]
    ): void {
        mpInstance._Persistence.forwardingStatsBatches.forwardingStatsEventQueue = queue;
    };

    // Processing forwarders is a 2 step process:
    //   1. Configure the kit
    //   2. Initialize the kit
    // There are 2 types of kits:
    //   1. UI-enabled kits
    //   2. Sideloaded kits.
    this.processForwarders = function(
        config: IConfigResponse,
        forwardingStatsCallback: ForwardingStatsCallback
    ): void {
        if (!config) {
            mpInstance.Logger.warning(
                'No config was passed. Cannot process forwarders'
            );
        } else {
            (self.processUIEnabledKits as Function)(config);
            (self.processSideloadedKits as Function)(config);

            (self.initForwarders as Function)(
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
    this.processUIEnabledKits = function(config: IConfigResponse): void {
        const kits = (self.returnKitConstructors as Function)() as Dictionary<RegisteredKit>;

        try {
            if (Array.isArray(config.kitConfigs) && config.kitConfigs.length) {
                config.kitConfigs.forEach(function(kitConfig: IKitConfigs) {
                    (self.configureUIEnabledKit as Function)(kitConfig, kits);
                });
            }
        } catch (e) {
            mpInstance.Logger.error(
                'MP Kits not configured propertly. Kits may not be initialized. ' +
                    e
            );
        }
    };

    this.returnKitConstructors = function(): Dictionary<RegisteredKit> {
        let kits: Dictionary<RegisteredKit> = {};
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
                    kits[kitNameWithConstructorSuffix] = kitConstructor as RegisteredKit;
                } else {
                    kits[kitConstructor.name] = kitConstructor as RegisteredKit;
                }
            });
        }
        return kits;
    };

    this.configureUIEnabledKit = function(
        configuration: IKitConfigs,
        kits: Dictionary<RegisteredKit>
    ): void {
        let newKit: MPForwarder | null = null;
        const config = configuration;

        for (const name in kits) {
            // Configs are returned with suffixes also. We need to consider the
            // config suffix here to match the constructor suffix
            let kitNameWithConfigSuffix: string;
            if (config.suffix) {
                kitNameWithConfigSuffix = `${config.name}-${config.suffix}`;
            }

            if (name === kitNameWithConfigSuffix || name === config.name) {
                if (
                    config.isDebug ===
                        mpInstance._Store.SDKConfig.isDevelopmentMode ||
                    (config as IKitConfigs & { isSandbox?: boolean }).isSandbox ===
                        mpInstance._Store.SDKConfig.isDevelopmentMode
                ) {
                    newKit = (self.returnConfiguredKit as Function)(kits[name], config);

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
    this.processSideloadedKits = function(
        mpConfig: IConfigResponse & { sideloadedKits?: { kitInstance: { register: Function; name: string }; filterDictionary: IKitFilterSettings }[] }
    ): void {
        try {
            if (Array.isArray(mpConfig.sideloadedKits)) {
                const registeredSideloadedKits: { kits: Dictionary<RegisteredKit> } = { kits: {} };
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
                    (self.configureSideloadedKit as Function)(registeredKit);
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
    this.configureSideloadedKit = function(
        kitConstructor: RegisteredKit
    ): void {
        mpInstance._Store.configuredForwarders.push(
            (self.returnConfiguredKit as Function)(kitConstructor, kitConstructor.filters)
        );
    };

    this.returnConfiguredKit = function(
        forwarder: RegisteredKit,
        config: Partial<IKitConfigs & { isSandbox?: boolean }> = {}
    ): MPForwarder {
        const newForwarder = new forwarder.constructor() as MPForwarder;
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

    this.configurePixel = function(settings: IPixelConfiguration): void {
        if (
            settings.isDebug ===
                mpInstance._Store.SDKConfig.isDevelopmentMode ||
            settings.isProduction !==
                mpInstance._Store.SDKConfig.isDevelopmentMode
        ) {
            mpInstance._Store.pixelConfigurations.push(settings);
        }
    };

    this.processPixelConfigs = function(config: IConfigResponse): void {
        try {
            if (!isEmpty(config.pixelConfigs)) {
                config.pixelConfigs.forEach(function(
                    pixelConfig: IPixelConfiguration
                ) {
                    (self.configurePixel as Function)(pixelConfig);
                });
            }
        } catch (e) {
            mpInstance.Logger.error(
                'Cookie Sync configs not configured propertly. Cookie Sync may not be initialized. ' +
                    e
            );
        }
    };

    this.sendSingleForwardingStatsToServer = async (
        forwardingStatsData: IForwardingStatsData
    ): Promise<void> => {
        // https://go.mparticle.com/work/SQDSDKS-6568
        const fetchPayload = {
            method: 'post' as const,
            body: JSON.stringify(forwardingStatsData),
            headers: {
                Accept: 'text/plain;charset=UTF-8',
                'Content-Type': 'text/plain;charset=UTF-8',
            },
        };

        const response = await this.forwarderStatsUploader.upload(fetchPayload);

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
