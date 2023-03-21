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
    init(settings, service, testMode, trackerId, userAttributes, userIdentities, appVersion, appName, customFlags, clientId): void;
    onIdentifyComplete(user, filteredIdentityRequest): void;
    onLoginComplete(user, filteredIdentityRequest): void;
    onLogoutComplete(user, filteredIdentityRequest): void;
    onModifyComplete(user, filteredIdentityRequest): void;
    onUserIdentifiedComplete(user, filteredIdentityRequest): void;
    process(event: SDKEvent): string;
    removeUserAttribute(key:string): void;
    setOptOut(isOptingOut: boolean): void;
    setUserAttribute(key: string, value:string): void;

    // TODO: Convert type to enum during Identity migration
    // https://go.mparticle.com/work/SQDSDKS-5218
    setUserIdentity(id: string, type: number): void;

    // TODO: https://go.mparticle.com/work/SQDSDKS-5156
    isSandbox: boolean;  
    hasSandbox: boolean;
}