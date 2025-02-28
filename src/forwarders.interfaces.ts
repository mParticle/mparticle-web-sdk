import { SDKEvent, SDKEventCustomFlags, SDKInitConfig } from './sdkRuntimeModels';
import { Dictionary } from './utils';
import { IKitConfigs, IKitFilterSettings } from './configAPIClient';
import { IdentityApiData } from '@mparticle/web-sdk';
import { IFilteringConsentRuleValues, IFilteringEventAttributeValue, IFilteringUserAttributeValue, IKitConfigs, IKitFilterSettings } from './configAPIClient';
import { Callback, IdentityApiData, Logger, UserIdentities } from '@mparticle/web-sdk';
import {
    IMParticleUser,
    ISDKUserAttributes,
    ISDKUserIdentity,
    UserAttributes,
} from './identity-user-interfaces';
import { IForwardingStatsData } from './apiClient';
import { IPixelConfiguration } from './cookieSyncManager';
import { IdentityAPIMethod } from './identity.interfaces';
import { AsyncUploader } from './uploaders';
import { IdentityType } from './types';

// The state of the kit when accessed via window.KitName via CDN
// or imported as an NPM package
export interface UnregisteredKit {
    constructor: () => void;
    register(config: KitRegistrationConfig): void;
    name: string;
    suffix?: string;
}

// The state of the kit after being added to forwarderConstructors in the CDN
// or after registered to SDKConfig.kits via NPM
export interface RegisteredKit {
    constructor: () => void;

    // Applies to sideloaded kits only
    filters?: IKitFilterSettings;
}

// This is the subset of the SDKConfig.kits object that is used to register kits.
export interface KitRegistrationConfig {
    kits: Dictionary<RegisteredKit>;
}

// The state of the kit after being configured. This is what the kit looks like when acted on.
export interface ConfiguredKit
    extends Omit<IKitConfigs, 'isDebugString' | 'hasDebugString'> {
    common: Dictionary<unknown>;
    id: number;
    init(
        settings: Dictionary<unknown>,
        service: forwardingStatsCallback,
        testMode: boolean,
        trackerId: string | null,
        userAttributes: UserAttributes,
        userIdentities: ISDKUserIdentity,
        appVersion: string,
        appName: string,
        customFlags: SDKEventCustomFlags,
        clientId: string
    ): string;
    onIdentifyComplete(
        user: IMParticleUser,
        filteredIdentityRequest: IdentityApiData
    ): string;
    onLoginComplete(
        user: IMParticleUser,
        filteredIdentityRequest: IdentityApiData
    ): string;
    onLogoutComplete(
        user: IMParticleUser,
        filteredIdentityRequest: IdentityApiData
    ): string;
    onModifyComplete(
        user: IMParticleUser,
        filteredIdentityRequest: IdentityApiData
    ): string;
    onUserIdentified(user: IMParticleUser): string;
    process(event: SDKEvent): string;
    setOptOut(isOptingOut: boolean): string;
    removeUserAttribute(key: string): string;
    setUserAttribute(key: string, value: string): string;
    setUserIdentity(id: UserIdentityId, type: UserIdentityType): void;

    // TODO: https://go.mparticle.com/work/SQDSDKS-5156
    isSandbox: boolean;
    hasSandbox: boolean;
}

export type UserIdentityId = string;
export type UserIdentityType = number;

export type forwardingStatsCallback = (
    forwarder: ConfiguredKit,
    event: SDKEvent
) => void;


export type UserIdentityFilters = typeof IdentityType[];
export type UserAttributeFilters = number[];

// FIXME: Remove in favor of IKitConfigs.settings
// https://go.mparticle.com/work/SQDSDKS-7113
interface ForwarderSettings {
    PriorityValue?: number;
}

export interface IMPForwarder {
    // @deprecated
    setForwarderUserIdentities: (userIdentities: UserIdentities) => void;

    setForwarderOnUserIdentified: (user: IMParticleUser) => void;
    setForwarderOnIdentityComplete: (user: IMParticleUser, identityMethod: IdentityAPIMethod) => void;
    handleForwarderUserAttributes: (functionNameKey: string, key: string, value: string | string[]) => void;
    id: number;
    settings: ForwarderSettings;
    forwarderStatsUploader: AsyncUploader;
    isInitialized: boolean;
    filteringConsentRuleValues: IFilteringConsentRuleValues;
    filteringUserAttributeValue: IFilteringUserAttributeValue;
    filteringEventAttributeValue: IFilteringEventAttributeValue;
    excludeAnonymousUser: boolean;
    userIdentityFilters: UserIdentityFilters;
    userAttributeFilters: UserAttributeFilters;
    initialized: boolean;
    logger: Logger;

    suffix?: string;

    eventSubscriptionId: number;

    eventNameFilters: number[];
    eventTypeFilters: number[];
    attributeFilters: number[];

    screenNameFilters: number[];
    screenAttributeFilters: number[];


    // Side loaded kit functionality in Forwarder methods
    kitInstance: UnregisteredKit;

    // https://go.mparticle.com/work/SQDSDKS-5156
    isSandbox?: boolean;
    hasSandbox?: boolean;
    isVisible?: boolean;

    configureSideloadedKit: (kitConstructor: RegisteredKit) => void;

    sendSingleForwardingStatsToServer: (forwardingStatsData: IForwardingStatsData) => void;
    applyToForwarders: (functionName: string, functionArgs: any[]) => void;
    sendEventToForwarders: (event: SDKEvent) => void;
    processPixelConfigs: (pixelConfigs: SDKInitConfig) => void;
    configurePixel: (pixelConfig: IPixelConfiguration) => void;
    returnConfiguredKit: (forwarder: RegisteredKit, config: IKitConfigs) => IMPForwarder;

    processSideloadedKits: (mpConfig: SDKInitConfig) => void;

    init: (
        setting: ForwarderSettings,
        forwarderSettingsCallback: Callback, 
        testMode: boolean,
        trackerId: string | number | null,
        filteredUserAttributes: ISDKUserAttributes,
        filteredUserIdentities: ISDKUserIdentity[],
        appVersion: string,
        appName: string,
        customFlags: SDKEventCustomFlags,
        clientId: string
    ) => void;

    initForwarders: (userIdentities: UserIdentities, forwarderStatsCallback: Callback) => void;
    isEnabledForUserAttributes: (filterObject?: IFilteringUserAttributeValue, user?: IMParticleUser) => boolean;
    isEnabledForUnknownUser: (excludeAnonymousUserBoolean: boolean, user: IMParticleUser) => boolean;

    name?: string;
    
    // Techically these do not return a value, but we sometimes use a string as a debug message
    onUserIdentified?: (user: IMParticleUser, identityApiData?: IdentityApiData) => string;
    onIdentifyComplete?: (user: IMParticleUser, identityApiData: IdentityApiData) => string;
    onLoginComplete?: (user: IMParticleUser, identityApiData: IdentityApiData) => string;
    onLogoutComplete?: (user: IMParticleUser, identityApiData: IdentityApiData) => string;
    onModifyComplete?: (user: IMParticleUser, identityApiData: IdentityApiData) => string;
    setOptOut: (optOut: boolean) => string;
    setUserAttribute?: (key: string, value: string | string[]) => string;
    removeUserAttribute?: (key: string) => string;
    process?: (event: SDKEvent) => string;
    setUserIdentity?: (identity: string, type: number) => string;

    getForwarderStatsQueue: () => IForwardingStatsData[];
    setForwarderStatsQueue: (queue: IForwardingStatsData[]) => void;
    processForwarders: (config: SDKInitConfig, forwardingStatsCallback: Callback) => void;
    processUIEnabledKits: (config: SDKInitConfig) => void;
    returnKitConstructors: () =>  Dictionary<RegisteredKit>;
    configureUIEnabledKit: (config: IKitConfigs, kitConstructor: Dictionary<RegisteredKit>) => void;
}