import { BooleanStringLowerCase, DataPlanResult, SDKEventCustomFlags, SDKInitConfig } from './sdkRuntimeModels';
import { Dictionary } from './utils';
import { IPixelConfiguration } from './cookieSyncManager';
import { IMParticleWebSDKInstance } from './mp-instance';
export interface IKitConfigs extends IKitFilterSettings {
    name: string;
    suffix?: string;
    moduleId: number;
    isDebug: boolean;
    isVisible: boolean;
    isDebugString: BooleanStringLowerCase;
    hasDebugString: BooleanStringLowerCase;
    settings: Dictionary;
    eventSubscriptionId: number;
    excludeAnonymousUser: boolean;
}
export interface IKitFilterSettings {
    eventTypeFilters: number[];
    eventNameFilters: number[];
    screenNameFilters: number[];
    screenAttributeFilters: number[];
    userIdentityFilters: number[];
    userAttributeFilters: number[];
    attributeFilters: number[];
    filteringEventAttributeValue?: IFilteringEventAttributeValue;
    filteringUserAttributeValue?: IFilteringUserAttributeValue;
    filteringConsentRuleValues?: IFilteringConsentRuleValues;
    consentRegulationFilters: number[];
    consentRegulationPurposeFilters: number[];
    messageTypeFilters: number[];
    messageTypeStateFilters: number[];
}
export interface IFilteringEventAttributeValue {
    eventAttributeName: string;
    eventAttributeValue: string;
    includeOnMatch: boolean;
}
export interface IFilteringUserAttributeValue {
    userAttributeName: string;
    userAttributeValue: string;
    includeOnMatch: boolean;
}
export interface IFilteringConsentRuleValues {
    includeOnMatch: boolean;
    values: IConsentRuleValue[];
}
export interface IConsentRuleValue {
    consentPurpose: string;
    hasConsented: boolean;
}
export interface IConfigResponse {
    appName: string;
    dataPlanResult: DataPlanResult;
    kitConfigs: IKitConfigs[];
    serviceUrl: string;
    secureServiceUrl: string;
    minWebviewBridgeVersion: number;
    workspaceToken: string;
    pixelConfigs: IPixelConfiguration[];
    flags: SDKEventCustomFlags;
}
export interface IConfigAPIClient {
    apiKey: string;
    config: SDKInitConfig;
    mpInstance: IMParticleWebSDKInstance;
    getSDKConfiguration: () => Promise<IConfigResponse>;
}
export default function ConfigAPIClient(this: IConfigAPIClient, apiKey: string, config: SDKInitConfig, mpInstance: IMParticleWebSDKInstance): void;
