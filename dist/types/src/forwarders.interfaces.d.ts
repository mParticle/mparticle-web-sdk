import { SDKEvent, SDKEventCustomFlags } from './sdkRuntimeModels';
import { Dictionary } from './utils';
import { IKitConfigs, IKitFilterSettings } from './configAPIClient';
import { IdentityApiData, IdentityType } from '@mparticle/web-sdk';
import { Batch } from '@mparticle/event-models';
import { IMParticleUser, ISDKUserIdentity, UserAttributes } from './identity-user-interfaces';
export type MPForwarder = Dictionary;
export interface UnregisteredKit {
    constructor: () => void;
    register(config: KitRegistrationConfig): void;
    name: string;
    moduleId?: number;
    suffix?: string;
}
export interface RegisteredKit {
    constructor: () => void;
    filters?: IKitFilterSettings;
}
export interface KitRegistrationConfig {
    kits: Dictionary<RegisteredKit>;
}
export interface ConfiguredKit extends Omit<IKitConfigs, 'isDebugString' | 'hasDebugString'> {
    common: Dictionary<unknown>;
    id: number;
    init(settings: Dictionary<unknown>, service: forwardingStatsCallback, testMode: boolean, trackerId: string | null, userAttributes: UserAttributes, userIdentities: ISDKUserIdentity, appVersion: string, appName: string, customFlags: SDKEventCustomFlags, clientId: string): string;
    onIdentifyComplete(user: IMParticleUser, filteredIdentityRequest: IdentityApiData): string;
    onLoginComplete(user: IMParticleUser, filteredIdentityRequest: IdentityApiData): string;
    onLogoutComplete(user: IMParticleUser, filteredIdentityRequest: IdentityApiData): string;
    onModifyComplete(user: IMParticleUser, filteredIdentityRequest: IdentityApiData): string;
    onUserIdentified(user: IMParticleUser): string;
    process(event: SDKEvent): string;
    setOptOut(isOptingOut: boolean): string;
    removeUserAttribute(key: string): string;
    setUserAttribute(key: string, value: string): string;
    setUserIdentity(id: UserIdentityId, type: UserIdentityType): void;
    isSandbox: boolean;
    hasSandbox: boolean;
}
export interface KitInterface {
    id: number;
    name: string;
    init(settings: Dictionary<unknown>, service: forwardingStatsCallback, testMode?: boolean, trackerId?: string | null, userAttributes?: UserAttributes, userIdentities?: ISDKUserIdentity, appVersion?: string, appName?: string, customFlags?: SDKEventCustomFlags, clientId?: string): string;
    onIdentifyComplete?(user: IMParticleUser, filteredIdentityRequest: IdentityApiData): string;
    onLoginComplete?(user: IMParticleUser, filteredIdentityRequest: IdentityApiData): string;
    onLogoutComplete?(user: IMParticleUser, filteredIdentityRequest: IdentityApiData): string;
    onModifyComplete?(user: IMParticleUser, filteredIdentityRequest: IdentityApiData): string;
    onUserIdentified?(user: IMParticleUser): string;
    process?(event: SDKEvent): string;
    processBatch?(batch: Batch): string;
    setOptOut?(isOptingOut: boolean): string;
    removeUserAttribute?(key: string): string;
    setUserAttribute?(key: string, value: string): string;
    setUserIdentity?(id: UserIdentityId, type: UserIdentityType): void;
}
export type UserIdentityId = string;
export type UserIdentityType = number;
export type UserAttributeFilters = number[];
export type UserIdentityFilters = typeof IdentityType[];
export type forwardingStatsCallback = (forwarder: ConfiguredKit, event: SDKEvent) => void;
