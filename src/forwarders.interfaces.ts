import { SDKEvent, SDKEventCustomFlags, SDKInitConfig } from './sdkRuntimeModels';
import { Dictionary } from './utils';
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

// TODO: https://go.mparticle.com/work/SQDSDKS-6035
export interface Kit {
    // constructor?: new () => IMPForwarder;
    constructor: () => any;
    name: string;
    getId: () => number, // Should this be optional?
    suffix?: string,
};

// TODO: Get rid of this
export type MPForwarder = Dictionary;

// The state of the kit when accessed via window.KitName via CDN
// or imported as an NPM package
export interface UnregisteredKit{
    // FIXME: Consider renaming config to kit config?
    register(config): void;
    name: string;
}

// The state of the kit after being added to forwarderConstructors in the CDN
// or after registered to SDKConfig.kits via NPM
export interface RegisteredKit {
    constructor(): void;
    // suffix?: string;
    name: string;
    getId(): number;
    filters: IKitFilterSettings;
}

// The state of the kit after being configured. This is what the kit looks like when acted on.
export interface ConfiguredKit
    extends Omit<IKitConfigs, 'isDebugString' | 'hasDebugString'> {
    common: Dictionary<unknown>;
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
    ): string | KitMappedMethodFailure;
    onLoginComplete(
        user: IMParticleUser,
        filteredIdentityRequest: IdentityApiData
    ): string | KitMappedMethodFailure;
    onLogoutComplete(
        user: IMParticleUser,
        filteredIdentityRequest: IdentityApiData
    ): string | KitMappedMethodFailure;
    onModifyComplete(
        user: IMParticleUser,
        filteredIdentityRequest: IdentityApiData
    ): string | KitMappedMethodFailure;
    onUserIdentified(user: IMParticleUser): string | KitMappedMethodFailure;
    process(event: SDKEvent): string;
    setOptOut(isOptingOut: boolean): string | KitMappedMethodFailure;
    removeUserAttribute(key: string): string;
    setUserAttribute(key: string, value: string): string;
    setUserIdentity(id: UserIdentityId, type: UserIdentityType): void;

    // TODO: https://go.mparticle.com/work/SQDSDKS-5156
    isSandbox: boolean;
    hasSandbox: boolean;
}
export interface KitMappedMethodFailure {
    error: string;
}

export type UserIdentityId = string;
export type UserIdentityType = number;

export type forwardingStatsCallback = (
    forwarder: ConfiguredKit,
    event: SDKEvent
) => void;


export type UserIdentityFilters = typeof IdentityType[];
export type UserAttributeFilters = string[];

interface ForwarderSettings {
    PriorityValue?: number;
}

export interface IMPForwarder {

    // @deprecated
    setForwarderUserIdentities: (userIdentities: UserIdentities) => void;

    setForwarderOnUserIdentified: (user: IMParticleUser) => void;
    setForwarderOnIdentityComplete: (user: IMParticleUser, identityMethod: IdentityAPIMethod) => void;
    handleForwarderUserAttributes: (functionNameKey: string, key: string, value: string) => void;
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


    // Side loaded kit functioanlity in Forwarder methods
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

    process?: (event: SDKEvent) => string | void;
    name?: string;
    setUserAttribute?: (key: string, value: string) => string | void;
    removeUserAttribute?: (key: string) => string | void;
    setUserIdentity?: (identity: string, type: number) => string | void;

    // Techically these do not return a value, but we sometimes
    // debug message as a string
    onUserIdentified?: (user: IMParticleUser, identityApiData?: IdentityApiData) => string;
    onIdentifyComplete?: (user: IMParticleUser, identityApiData: IdentityApiData) => string;
    onLoginComplete?: (user: IMParticleUser, identityApiData: IdentityApiData) => string;
    onLogoutComplete?: (user: IMParticleUser, identityApiData: IdentityApiData) => string;
    onModifyComplete?: (user: IMParticleUser, identityApiData: IdentityApiData) => string;
    setOptOut: (optOut: boolean) => string;

    getForwarderStatsQueue: () => IForwardingStatsData[];
    setForwarderStatsQueue: (queue: IForwardingStatsData[]) => void;
    processForwarders: (config: SDKInitConfig, forwardingStatsCallback: Callback) => void;
    processUIEnabledKits: (config: SDKInitConfig) => void;
    returnKitConstructors: () =>  Dictionary<RegisteredKit>;
    configureUIEnabledKit: (config: IKitConfigs, kitConstructor: Dictionary<RegisteredKit>) => void;
    
    getKitConstructors: () => RegisteredKit[];
    getKitInstance: (kitName: string) => UnregisteredKit;
    getKitInstanceByConstructor: (kitConstructor: RegisteredKit) => UnregisteredKit;
    getKitInstanceByConstructorName: (kitConstructorName: string) => UnregisteredKit;
    getKitInstanceByConstructorSuffix: (kitConstructorSuffix: string) => UnregisteredKit;
}