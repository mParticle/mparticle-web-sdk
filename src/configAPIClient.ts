import { DataPlanConfig } from '@mparticle/web-sdk';
import {
    BooleanStringLowerCase,
    DataPlanResult,
    SDKEventCustomFlags,
    SDKInitConfig,
} from './sdkRuntimeModels';
import { Dictionary } from './utils';
import {
    AsyncUploader,
    IFetchPayload,
    FetchUploader,
    XHRUploader,
} from './uploaders';
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

const buildUrl = (
    configUrl: string,
    apiKey: string,
    dataPlanConfig?: DataPlanConfig | null,
    isDevelopmentMode?: boolean | null,
): string => {
    const url = configUrl + apiKey + '/config';
    const env = isDevelopmentMode ? '1' : '0';
    const queryParams = [`env=${env}`];

    const { planId, planVersion } = dataPlanConfig || {};

    if (planId) {
        queryParams.push(`plan_id=${planId}`);
    }

    if (planVersion) {
        queryParams.push(`plan_version=${planVersion}`);
    }

    return `${url}?${queryParams.join('&')}`;
};

export default function ConfigAPIClient(
    this: IConfigAPIClient,
    apiKey: string,
    config: SDKInitConfig,
    mpInstance: IMParticleWebSDKInstance,
): void {
    const baseUrl = 'https://' + mpInstance._Store.SDKConfig.configUrl;
    const { isDevelopmentMode } = config;
    const dataPlan = config.dataPlan as DataPlanConfig;
    const uploadUrl = buildUrl(baseUrl, apiKey, dataPlan, isDevelopmentMode);
    const uploader: AsyncUploader = window.fetch
        ? new FetchUploader(uploadUrl)
        : new XHRUploader(uploadUrl);

    this.getSDKConfiguration = async (): Promise<IConfigResponse> => {
        let configResponse: IConfigResponse;
        const fetchPayload: IFetchPayload = {
            method: 'get',
            headers: {
                Accept: 'text/plain;charset=UTF-8',
                'Content-Type': 'text/plain;charset=UTF-8',
            },
            body: null,
        };

        try {
            const response = await uploader.upload(fetchPayload);
            if (response.status === 200) {
                mpInstance?.Logger?.verbose(
                    'Successfully received configuration from server',
                );

                // https://go.mparticle.com/work/SQDSDKS-6568
                // FetchUploader returns the response as a JSON object that we have to await
                if (response.json) {
                    configResponse = await response.json();
                    return configResponse;
                } else {
                    // https://go.mparticle.com/work/SQDSDKS-6568
                    // XHRUploader returns the response as a string that we need to parse
                    const xhrResponse = response as unknown as XMLHttpRequest;
                    configResponse = JSON.parse(xhrResponse.responseText);
                    return configResponse;
                }
            }

            mpInstance?.Logger?.verbose(
                'Issue with receiving configuration from server, received HTTP Code of ' +
                    response.statusText,
            );
        } catch (e) {
            mpInstance?.Logger?.error(
                'Error getting forwarder configuration from mParticle servers.',
            );
        }

        // Returns the original config object if we cannot retrieve the remote config
        return config as IConfigResponse;
    };
}
