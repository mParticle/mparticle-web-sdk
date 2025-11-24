import Constants from "./constants";
import { SDKInitConfig } from "./sdkRuntimeModels";
import { IFeatureFlags, SDKConfig } from "./store";
import { Dictionary, isEmpty, parseNumber, returnConvertedBoolean } from "./utils";

export class SDKConfigManager {
    private sdkConfig: SDKConfig;

    constructor(config: SDKInitConfig, apiKey: string){
        const sdkConfig = {} as SDKConfig;

        for (const prop in Constants.DefaultConfig) {
            if (Constants.DefaultConfig.hasOwnProperty(prop)) {
                config[prop] = Constants.DefaultConfig[prop];
            }
        }
    
        if (config) {
            for (const prop in config) {
                if (config.hasOwnProperty(prop)) {
                    sdkConfig[prop] = config[prop];
                }
            }
        }
    
        for (const prop in Constants.DefaultBaseUrls) {
            sdkConfig[prop] = Constants.DefaultBaseUrls[prop];
        
        }
        
        sdkConfig.flags = this.processFlags(config);
        sdkConfig.deviceId = config.deviceId ?? undefined;
        sdkConfig.isDevelopmentMode = returnConvertedBoolean(config.isDevelopmentMode) ?? false;
        sdkConfig.isWebSdkLoggingEnabled = returnConvertedBoolean(config.isWebSdkLoggingEnabled) ?? false;
        sdkConfig.logLevel = config.logLevel ?? undefined;

        const baseUrls: Dictionary<string> = processBaseUrls(
            config,
            sdkConfig.flags,
            apiKey,
        );
        
        for (const baseUrlKeys in baseUrls) {
            sdkConfig[baseUrlKeys] = baseUrls[baseUrlKeys];
        }

        this.sdkConfig = sdkConfig;
    }

    public getSDKConfig(): SDKConfig {
        return this.sdkConfig;
    }

    private processFlags(config: SDKInitConfig): IFeatureFlags {
        const flags: IFeatureFlags = {};
        const {
            ReportBatching,
            EventBatchingIntervalMillis,
            OfflineStorage,
            DirectUrlRouting,
            CacheIdentity,
            AudienceAPI,
            CaptureIntegrationSpecificIds,
            CaptureIntegrationSpecificIdsV2,
            AstBackgroundEvents
        } = Constants.FeatureFlags;
    
        if (!config.flags) {
            return {};
        }
    
        // https://go.mparticle.com/work/SQDSDKS-6317
        // Passed in config flags take priority over defaults
        flags[ReportBatching] = config.flags[ReportBatching] || false;
        // The server returns stringified numbers, sowe need to parse
        flags[EventBatchingIntervalMillis] =
            parseNumber(config.flags[EventBatchingIntervalMillis]) ||
            Constants.DefaultConfig.uploadInterval;
        flags[OfflineStorage] = config.flags[OfflineStorage] || '0';
        flags[DirectUrlRouting] = config.flags[DirectUrlRouting] === 'True';
        flags[CacheIdentity] = config.flags[CacheIdentity] === 'True';
        flags[AudienceAPI] = config.flags[AudienceAPI] === 'True';
        flags[CaptureIntegrationSpecificIds] = config.flags[CaptureIntegrationSpecificIds] === 'True';
        flags[CaptureIntegrationSpecificIdsV2] = (config.flags[CaptureIntegrationSpecificIdsV2] || 'none');
        flags[AstBackgroundEvents] = config.flags[AstBackgroundEvents] === 'True';
        return flags;
    }
   

}

function processBaseUrls(config: SDKInitConfig, flags: IFeatureFlags, apiKey: string): Dictionary<string> {
    // an API key is not present in a webview only mode. In this case, no baseUrls are needed
    if (!apiKey) {
        return {};
    }

    // When direct URL routing is false, update baseUrls based custom urls
    // passed to the config
    if (flags.directURLRouting) {
        return processDirectBaseUrls(config, apiKey);
    } else {
        return processCustomBaseUrls(config);
    }
}

function processCustomBaseUrls(config: SDKInitConfig): Dictionary<string> {
    const defaultBaseUrls: Dictionary<string> = Constants.DefaultBaseUrls;
    const CNAMEUrlPaths: Dictionary<string> = Constants.CNAMEUrlPaths;

    // newBaseUrls are default if the customer is not using a CNAME
    // If a customer passes either config.domain or config.v3SecureServiceUrl,
    // config.identityUrl, etc, the customer is using a CNAME.
    // config.domain will take priority if a customer passes both.
    const newBaseUrls: Dictionary<string> = {};
    // If config.domain exists, the customer is using a CNAME.  We append the url paths to the provided domain.
    // This flag is set on the Rokt/MP snippet (starting at version 2.6), meaning config.domain will alwys be empty
    // if a customer is using a snippet prior to 2.6.
    if (!isEmpty(config.domain)) {
        for (let pathKey in CNAMEUrlPaths) {
            newBaseUrls[pathKey] = `${config.domain}${CNAMEUrlPaths[pathKey]}`;
        }

        return newBaseUrls;
    }

    for (let baseUrlKey in defaultBaseUrls) {
        newBaseUrls[baseUrlKey] =
            config[baseUrlKey] || defaultBaseUrls[baseUrlKey];
    }

    return newBaseUrls;
}

function processDirectBaseUrls(
    config: SDKInitConfig,
    apiKey: string
): Dictionary {
    const defaultBaseUrls = Constants.DefaultBaseUrls;
    const directBaseUrls: Dictionary<string> = {};
    // When Direct URL Routing is true, we create a new set of baseUrls that
    // include the silo in the urls.  mParticle API keys are prefixed with the
    // silo and a hyphen (ex. "us1-", "us2-", "eu1-").  us1 was the first silo,
    // and before other silos existed, there were no prefixes and all apiKeys
    // were us1. As such, if we split on a '-' and the resulting array length
    // is 1, then it is an older APIkey that should route to us1.
    // When splitKey.length is greater than 1, then splitKey[0] will be
    // us1, us2, eu1, au1, or st1, etc as new silos are added
    const DEFAULT_SILO = 'us1';
    const splitKey: Array<string> = apiKey.split('-');
    const routingPrefix: string =
        splitKey.length <= 1 ? DEFAULT_SILO : splitKey[0];

    for (let baseUrlKey in defaultBaseUrls) {
        // Any custom endpoints passed to mpConfig will take priority over direct
        // mapping to the silo.  The most common use case is a customer provided CNAME.
        if (baseUrlKey === 'configUrl') {
            directBaseUrls[baseUrlKey] =
                config[baseUrlKey] || defaultBaseUrls[baseUrlKey];
            continue;
        }

        if (config.hasOwnProperty(baseUrlKey)) {
            directBaseUrls[baseUrlKey] = config[baseUrlKey];
        } else {
            const urlparts = defaultBaseUrls[baseUrlKey].split('.');

            directBaseUrls[baseUrlKey] = [
                urlparts[0],
                routingPrefix,
                ...urlparts.slice(1),
            ].join('.');
        }
    }

    return directBaseUrls;
}