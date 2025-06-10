import { SDKEvent, SDKEventCustomFlags } from './sdkRuntimeModels';
import { Dictionary } from './utils';
import { IKitConfigs, IKitFilterSettings } from './configAPIClient';
import { IdentityApiData, IdentityType } from '@mparticle/web-sdk';
import {
    IMParticleUser,
    ISDKUserIdentity,
    UserAttributes,
} from './identity-user-interfaces';

// TODO: https://go.mparticle.com/work/SQDSDKS-4475
export type MPForwarder = Dictionary;

// The state of the kit when accessed via window.KitName via CDN
// or imported as an NPM package but before it goes through the registration process
// This also applies to sideloaded kits which have not yet been registered
export interface UnregisteredKit {
    constructor: () => void;
    register(config: KitRegistrationConfig): void;
    name: string;

    // Optional Attributes that are not used for sideloaded kits

    // Module ID is used for kits that are provided via CDN or NPM
    moduleId?: number;

    // Suffix is used for kits that are provided via CDN or NPM
    // and is used for version pinning of the SDK
    suffix?: string;
}

// The state of the kit after being added to forwarderConstructors in the CDN
// or after registered to SDKConfig.kits via NPM
// Sideloaded Kits would also be considered registered
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
        clientId: string,
    ): string;
    onIdentifyComplete(
        user: IMParticleUser,
        filteredIdentityRequest: IdentityApiData,
    ): string;
    onLoginComplete(
        user: IMParticleUser,
        filteredIdentityRequest: IdentityApiData,
    ): string;
    onLogoutComplete(
        user: IMParticleUser,
        filteredIdentityRequest: IdentityApiData,
    ): string;
    onModifyComplete(
        user: IMParticleUser,
        filteredIdentityRequest: IdentityApiData,
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
export type UserAttributeFilters = number[];
export type UserIdentityFilters = (typeof IdentityType)[];

export type forwardingStatsCallback = (
    forwarder: ConfiguredKit,
    event: SDKEvent,
) => void;
