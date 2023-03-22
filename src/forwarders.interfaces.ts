import { MParticleUser, SDKEvent, SDKEventCustomFlags, SDKUserIdentity } from './sdkRuntimeModels';
import { Dictionary } from './utils';
import { IKitConfigs } from './configAPIClient';
import { UserAttributes } from './persistence.interfaces';
import { IdentityApiData } from '@mparticle/web-sdk';

// The state of the kit when accessed via window.KitName via CDN
// or imported as an NPM package
export interface UnregisteredKit {
    register(config): void;
}

// The state of the kit after being added to forwarderConstructors in the CDN 
// or after registered to SDKConfig.kits via NPM
export interface RegisteredKit {
    constructor(): void;
    name: string;
    getId(): number;
}

// The state of the kit after being configured. This is what the kit looks like when acted on.
export interface ConfiguredKit
    extends Omit<IKitConfigs, 'isDebugString' | 'hasDebugString'> {
    common: Dictionary<unknown>;
    init(
        settings: Dictionary<unknown>,
        service: prepareForwardingStats,
        testMode: boolean,
        trackerId: string,
        userAttributes: UserAttributes,
        userIdentities: SDKUserIdentity,
        appVersion: string,
        appName:string,
        customFlags:SDKEventCustomFlags,
        clientId:string): string;
    onIdentifyComplete(user: MParticleUser, filteredIdentityRequest: IdentityApiData): string | KitMappedMethodFailure;
    onLoginComplete(user: MParticleUser, filteredIdentityRequest: IdentityApiData): string | KitMappedMethodFailure;
    onLogoutComplete(user: MParticleUser, filteredIdentityRequest: IdentityApiData): string | KitMappedMethodFailure;
    onModifyComplete(user: MParticleUser, filteredIdentityRequest: IdentityApiData): string | KitMappedMethodFailure;
    onUserIdentified(user: MParticleUser): string | KitMappedMethodFailure;
    process(event: SDKEvent): string;
    setOptOut(isOptingOut: boolean): string | KitMappedMethodFailure;
    removeUserAttribute(key:string): string;
    setUserAttribute(key: string, value:string): string;

    // TODO: Convert type to enum during Identity migration
    // https://go.mparticle.com/work/SQDSDKS-5218
    setUserIdentity(id: UserIdentityId, type: UserIdentityType): void;

    // TODO: https://go.mparticle.com/work/SQDSDKS-5156
    isSandbox: boolean;  
    hasSandbox: boolean;
}
export interface KitMappedMethodFailure {
    error: string
}

export type UserIdentityId = string;
export type UserIdentityType = number;

export type prepareForwardingStats = (forwarder: ConfiguredKit, event: SDKEvent) => void;