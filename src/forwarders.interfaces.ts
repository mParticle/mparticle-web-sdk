import { SDKEvent, SDKEventCustomFlags } from './sdkRuntimeModels';
import { Dictionary } from './utils';
import { IKitConfigs } from './configAPIClient';
import { IdentityApiData } from '@mparticle/web-sdk';
import {
    IMParticleUser,
    ISDKUserIdentity,
    UserAttributes,
} from './identity-user-interfaces';

// TODO: https://go.mparticle.com/work/SQDSDKS-6035
export type Kit = Dictionary;
export type MPForwarder = Dictionary;

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
