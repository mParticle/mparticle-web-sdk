import { SDKEvent } from './sdkRuntimeModels';
import { Dictionary } from './utils';
import { IKitConfigs } from './configAPIClient';

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

// The state of the kit aftering being configured. This is what the kit looks like when acted on.
export interface ConfiguredKit
    extends Omit<IKitConfigs, 'isDebugString' | 'hasDebugString'> {
    common: Dictionary;
    init(settings, service, testMode, trackerId, userAttributes, userIdentities, appVersion, appName, customFlags, clientId): string;
    onIdentifyComplete(user, filteredIdentityRequest): string | KitMappedMethodFailure;
    onLoginComplete(user, filteredIdentityRequest): string | KitMappedMethodFailure;
    onLogoutComplete(user, filteredIdentityRequest): string | KitMappedMethodFailure;
    onModifyComplete(user, filteredIdentityRequest): string | KitMappedMethodFailure;
    onUserIdentified(user): string | KitMappedMethodFailure;
    process(event: SDKEvent): string;
    removeUserAttribute(key:string): string;
    setOptOut(isOptingOut: boolean): string | KitMappedMethodFailure;
    setUserAttribute(key: string, value:string): void;

    // TODO: Convert type to enum during Identity migration
    // https://go.mparticle.com/work/SQDSDKS-5218
    setUserIdentity(id: string, type: number): void;

    // TODO: https://go.mparticle.com/work/SQDSDKS-5156
    isSandbox: boolean;  
    hasSandbox: boolean;
}

export interface KitMappedMethodFailure {
    error: string
}