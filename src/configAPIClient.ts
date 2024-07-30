import { DataPlanConfig } from '@mparticle/web-sdk';
import {
    BooleanStringLowerCase,
    DataPlanResult,
    MParticleWebSDK,
    SDKEventCustomFlags,
    SDKInitConfig,
} from './sdkRuntimeModels';
import { Dictionary } from './utils';
import {
    AsyncUploader,
    fetchPayload,
    FetchUploader,
    XHRUploader,
} from './uploaders';
import Constants from './constants';

export type SDKCompleteInitCallback = (
    apiKey: string,
    config: SDKInitConfig,
    mpInstance: MParticleWebSDK
) => void;

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
    apiKey: string;
    config: SDKInitConfig;
    mpInstance: MParticleWebSDK;
    getSDKConfiguration: () => Promise<IConfigResponse>;
}

// QUESTION: Should the uploader care about building urls?
const buildUrl = (
    configUrl: string,
    apiKey: string,
    dataPlanConfig?: DataPlanConfig | null,
    isDevelopmentMode?: boolean | null
): string => {
    let url = configUrl + apiKey + '/config';

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
    mpInstance: MParticleWebSDK
): void {
    console.log('ConfigAPIClient initialized');

    // const { SDKConfig } = mpInstance._Store;
    // TODO: Replace with service URL
    // const baseUrl = 'https://' + mpInstance._Store.SDKConfig.configUrl;
    const baseUrl = 'https://' + Constants.DefaultBaseUrls.configUrl;
    const { isDevelopmentMode } = config;
    const dataPlan = config.dataPlan as DataPlanConfig;
    const uploadUrl = buildUrl(baseUrl, apiKey, dataPlan, isDevelopmentMode);
    const uploader = window.fetch
        ? new FetchUploader(uploadUrl)
        : new XHRUploader(uploadUrl);

    this.getSDKConfiguration = async (): Promise<IConfigResponse> => {
        console.log('what is config', config);

        const url: string = buildUrl(
            baseUrl,
            apiKey,
            dataPlan,
            isDevelopmentMode
        );

        // try {
        const fetchPayload: fetchPayload = {
            method: 'get',
            headers: {
                Accept: 'text/plain;charset=UTF-8',
                'Content-Type': 'application/json',
            },
            body: null,
        };

        const xhr = new XHRUploader(url);

        try {
            const response = await xhr.upload(fetchPayload);

            console.log('response', response);
            console.log('response.status', response.status);

            // TODO: Does fetch also return responseText?
            //@ts-ignore
            console.log('response.responseText', response.responseText);
            if (response.status === 200) {
                console.log(
                    'Config API Client - returning successful response'
                );
                mpInstance?.Logger?.verbose(
                    'Successfully received configuration from server'
                );

                return JSON.parse(
                    // @ts-ignore
                    response.responseText
                ) as IConfigResponse;
            }

            mpInstance?.Logger?.verbose(
                'Issue with receiving configuration from server, received HTTP Code of ' +
                    response.statusText
            );
            console.log('Config API Client - returning original config');
        } catch (e) {
            mpInstance?.Logger?.error(
                'Error getting forwarder configuration from mParticle servers.'
            );
        }

        return config as IConfigResponse;
    };
}
