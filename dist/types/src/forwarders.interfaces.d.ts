import { SDKEvent, SDKEventCustomFlags, SDKInitConfig, SDKLoggerApi } from './sdkRuntimeModels';
import { Dictionary } from './utils';
import { IKitConfigs, IKitFilterSettings, IFilteringUserAttributeValue } from './configAPIClient';
import { IdentityApiData, IdentityType, UserIdentities } from '@mparticle/web-sdk';
import { Batch } from '@mparticle/event-models';
import { IForwardingStatsData } from './apiClient';
import { AsyncUploader } from './uploaders';
import { IPixelConfiguration } from './cookieSyncManager';
import { IMParticleUser, ISDKUserIdentity, UserAttributes } from './identity-user-interfaces';
import type { IFilteredMparticleUser } from './filteredMparticleUser';
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
    init(settings: Dictionary<unknown>, service: forwardingStatsCallback, testMode: boolean, trackerId: string | null, userAttributes: UserAttributes, userIdentities: ISDKUserIdentity[], appVersion: string, appName: string, customFlags: SDKEventCustomFlags, clientId: string): string;
    onIdentifyComplete(user: IFilteredMparticleUser, filteredIdentityRequest: IdentityApiData): string;
    onLoginComplete(user: IFilteredMparticleUser, filteredIdentityRequest: IdentityApiData): string;
    onLogoutComplete(user: IFilteredMparticleUser, filteredIdentityRequest: IdentityApiData): string;
    onModifyComplete(user: IFilteredMparticleUser, filteredIdentityRequest: IdentityApiData): string;
    onUserIdentified(user: IFilteredMparticleUser): string;
    process(event: SDKEvent): string;
    setOptOut(isOptingOut: boolean): string;
    removeUserAttribute(key: string): string;
    setUserAttribute(key: string, value: string): string;
    setUserIdentity(id: UserIdentityId, type: UserIdentityType): string | void;
    logOut?(evt: SDKEvent): void;
    isSandbox: boolean;
    hasSandbox: boolean;
    initialized?: boolean;
    logger?: SDKLoggerApi;
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
export interface IForwarders {
    forwarderStatsUploader: AsyncUploader;
    initForwarders(userIdentities: UserIdentities, forwardingStatsCallback: forwardingStatsCallback): void;
    isEnabledForUserAttributes(filterObject: Partial<IFilteringUserAttributeValue>, user: IMParticleUser): boolean;
    isEnabledForUnknownUser(excludeAnonymousUserBoolean: boolean, user: IMParticleUser): boolean;
    applyToForwarders(functionName: string, functionArgs: unknown): void;
    sendEventToForwarders(event: SDKEvent): void;
    handleForwarderUserAttributes(functionNameKey: string, key: string, value: string): void;
    setForwarderUserIdentities(userIdentities: UserIdentities): void;
    setForwarderOnUserIdentified(user: IMParticleUser): void;
    setForwarderOnIdentityComplete(user: IMParticleUser, identityMethod: string): void;
    getForwarderStatsQueue(): IForwardingStatsData[];
    setForwarderStatsQueue(queue: IForwardingStatsData[]): void;
    processForwarders(config: SDKInitConfig, forwardingStatsCallback: forwardingStatsCallback): void;
    processUIEnabledKits(config: SDKInitConfig): void;
    returnKitConstructors(): Dictionary<RegisteredKit>;
    configureUIEnabledKit(configuration: IKitConfigs, kits: Dictionary<RegisteredKit>): void;
    processSideloadedKits(mpConfig: SDKInitConfig): void;
    configureSideloadedKit(kitConstructor: RegisteredKit): void;
    returnConfiguredKit(forwarder: RegisteredKit, config?: Partial<IKitConfigs>): ConfiguredKit;
    configurePixel(settings: IPixelConfiguration): void;
    processPixelConfigs(config: SDKInitConfig): void;
    sendSingleForwardingStatsToServer(forwardingStatsData: IForwardingStatsData): Promise<void>;
}
