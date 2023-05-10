import { DataPlanConfig } from '@mparticle/web-sdk';
import {
    BooleanStringLowerCase,
    DataPlanResult,
    MParticleWebSDK,
    SDKEventCustomFlags,
    SDKInitConfig,
} from './sdkRuntimeModels';
import { Dictionary } from './utils';

export type SDKCompleteInitCallback = (
    apiKey: string,
    config: SDKInitConfig,
    mpInstance: MParticleWebSDK
) => void;

export interface IKitConfigs {
    name: string;
    moduleId: number;
    isDebug: boolean;
    isVisible: boolean;
    isDebugString: BooleanStringLowerCase;
    hasDebugString: BooleanStringLowerCase;
    settings: Dictionary;
    screenNameFilters: number[];
    screenAttributeFilters: number[];
    userIdentityFilters: number[];
    userAttributeFilters: number[];
    eventNameFilters: number[];
    eventTypeFilters: number[];
    attributeFilters: number[];
    filteringEventAttributeValue: IFilteringEventAttributeValue;
    filteringUserAttributeValue: IFilteringUserAttributeValue;
    filteringConsentRuleValues: IFilteringConsentRuleValues;
    consentRegulationFilters: number[];
    consentRegulationPurposeFilters: number[];
    messageTypeFilters: number[];
    messageTypeStateFilters: number[];
    eventSubscriptionId: number;
    excludeAnonymousUser: boolean;
}

export interface IFilteringEventAttributeValue {
    eventAttributeName: string;
    eventAttributeValue: string;
    includeOnMatch: boolean
}

export interface IFilteringUserAttributeValue {
    userAttributeName: string;
    userAttributeValue: string;
    includeOnMatch: boolean
}
export interface IFilteringConsentRuleValues {
    includeOnMatch: boolean;
    values: IConsentRuleValue[];
}

export interface IConsentRuleValue {
    consentPurpose: string;
    hasConsented: boolean
}


export interface IPixelConfig {
    name: string;
    moduleId: number;
    esId: number;
    isDebug: boolean;
    isProduction: boolean;
    settings: Dictionary;
    frequencyCap: number;
    pixelUrl: string;
    redirectUrl: string;
}

export interface IConfigResponse {
    appName: string;
    dataPlanResult: DataPlanResult;
    kitConfigs: IKitConfigs[];
    serviceUrl: string;
    secureServiceUrl: string;
    minWebviewBridgeVersion: number;
    workspaceToken: string;
    pixelConfigs: IPixelConfig[];
    flags: SDKEventCustomFlags;
}

export interface IConfigAPIClient {
    getSDKConfiguration: (
        apiKey: string,
        config: SDKInitConfig,
        completeSDKInitialization: SDKCompleteInitCallback,
        mpInstance: MParticleWebSDK
    ) => void;
}

export default function ConfigAPIClient(this: IConfigAPIClient) {
    this.getSDKConfiguration = (
        apiKey,
        config,
        completeSDKInitialization,
        mpInstance
    ): void => {
        let url: string;
        try {
            const xhrCallback = function() {
                if (xhr.readyState === 4) {
                    // when a 200 returns, merge current config with what comes back from config, prioritizing user inputted config
                    if (xhr.status === 200) {
                        config = mpInstance._Helpers.extend(
                            {},
                            config,
                            JSON.parse(xhr.responseText)
                        );
                        completeSDKInitialization(apiKey, config, mpInstance);
                        mpInstance.Logger.verbose(
                            'Successfully received configuration from server'
                        );
                    } else {
                        // if for some reason a 200 doesn't return, then we initialize with the just the passed through config
                        completeSDKInitialization(apiKey, config, mpInstance);
                        mpInstance.Logger.verbose(
                            'Issue with receiving configuration from server, received HTTP Code of ' +
                                xhr.status
                        );
                    }
                }
            };

            const xhr = mpInstance._Helpers.createXHR(xhrCallback);
            url =
                'https://' +
                mpInstance._Store.SDKConfig.configUrl +
                apiKey +
                '/config?env=';
            if (config.isDevelopmentMode) {
                url = url + '1';
            } else {
                url = url + '0';
            }

            const dataPlan = config.dataPlan as DataPlanConfig;
            if (dataPlan) {
                if (dataPlan.planId) {
                    url = url + '&plan_id=' + dataPlan.planId || '';
                }
                if (dataPlan.planVersion) {
                    url = url + '&plan_version=' + dataPlan.planVersion || '';
                }
            }

            if (xhr) {
                xhr.open('get', url);
                xhr.send(null);
            }
        } catch (e) {
            completeSDKInitialization(apiKey, config, mpInstance);
            mpInstance.Logger.error(
                'Error getting forwarder configuration from mParticle servers.'
            );
        }
    };
}
