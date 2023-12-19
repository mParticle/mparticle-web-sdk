import { Batch } from '@mparticle/event-models';
import { Context } from '@mparticle/event-models';
import {
    DataPlanConfig,
    MPID,
    IdentifyRequest,
    IdentityCallback,
    SDKEventCustomFlags,
} from '@mparticle/web-sdk';
import { IKitConfigs } from './configAPIClient';
import Constants from './constants';
import {
    DataPlanResult,
    KitBlockerOptions,
    LogLevelType,
    MParticleWebSDK,
    SDKDataPlan,
    SDKEvent,
    SDKGeoLocation,
    SDKInitConfig,
    SDKProduct,
} from './sdkRuntimeModels';
import { isNumber, isDataPlanSlug, Dictionary } from './utils';
import { SDKConsentState } from './consent';
import { Kit, MPForwarder } from './forwarders.interfaces';

// This represents the runtime configuration of the SDK AFTER
// initialization has been complete and all settings and
// configurations have been stitched together.
export interface SDKConfig {
    isDevelopmentMode?: boolean;
    logger: {
        error?(msg);
        warning?(msg);
        verbose?(msg);
    };
    onCreateBatch(batch: Batch): Batch;
    customFlags?: SDKEventCustomFlags;
    dataPlan: SDKDataPlan;
    dataPlanOptions: KitBlockerOptions; // when the user provides their own data plan
    dataPlanResult?: DataPlanResult; // when the data plan comes from the server via /config

    appName?: string;
    appVersion?: string;
    package?: string;
    flags?: { [key: string]: string | number | boolean };
    kitConfigs: IKitConfigs[];
    kits: Dictionary<Kit>;
    logLevel?: LogLevelType;
    cookieDomain?: string;
    maxCookieSize?: number | undefined;
    minWebviewBridgeVersion: 1 | 2 | undefined;
    identifyRequest: IdentifyRequest;
    identityCallback: IdentityCallback;
    integrationDelayTimeout: number;
    sideloadedKits: MPForwarder[];
    aliasMaxWindow: number;
    deviceId?: string;
    forceHttps?: boolean;
    aliasUrl?: string;
    configUrl?: string;
    identityUrl?: string;
    isIOS?: boolean;
    maxProducts: number;
    requestConfig?: boolean;
    sessionTimeout?: number;
    useNativeSdk?: boolean;
    useCookieStorage?: boolean;
    v1SecureServiceUrl?: string;
    v2SecureServiceUrl?: string;
    v3SecureServiceUrl?: string;
}

function createSDKConfig(config: SDKInitConfig): SDKConfig {
    // TODO: Refactor to create a default config object
    const sdkConfig = {} as SDKConfig;

    for (const prop in Constants.DefaultConfig) {
        if (Constants.DefaultConfig.hasOwnProperty(prop)) {
            sdkConfig[prop] = Constants.DefaultConfig[prop];
        }
    }

    if (config) {
        for (const prop in config) {
            if (config.hasOwnProperty(prop)) {
                sdkConfig[prop] = config[prop];
            }
        }
    }

    for (const prop in Constants.DefaultUrls) {
        sdkConfig[prop] = Constants.DefaultUrls[prop];
    }

    return sdkConfig;
}

// TODO: Placeholder Types to be filled in as we migrate more modules
//       to TypeScript
export type PixelConfiguration = Dictionary;
export type ServerSettings = Dictionary;
export type SessionAttributes = Dictionary;
export type IntegrationAttributes = Dictionary<Dictionary<string>>;

type WrapperSDKTypes = 'flutter' | 'none';
interface WrapperSDKInfo {
    name: WrapperSDKTypes;
    version: string | null;
    isInfoSet: boolean;
}

// Temporary Interface until Store can be refactored as a class
export interface IStore {
    isEnabled: boolean;
    sessionAttributes: SessionAttributes;
    currentSessionMPIDs: MPID[];
    consentState: SDKConsentState | null;
    sessionId: string | null;
    isFirstRun: boolean;
    clientId: string;
    deviceId: string;
    devToken: string | null;
    serverSettings: ServerSettings;
    dateLastEventSent: Date;
    sessionStartDate: Date;
    currentPosition: SDKGeoLocation | null;
    isTracking: boolean;
    watchPositionId: number | null;
    cartProducts: SDKProduct[];
    eventQueue: SDKEvent[];
    currencyCode: string | null;
    globalTimer: number | null;
    context: Context | null;
    configurationLoaded: boolean;
    identityCallInFlight: boolean;
    SDKConfig: Partial<SDKConfig>;
    nonCurrentUserMPIDs: Record<MPID, Dictionary>;
    identifyCalled: boolean;
    isLoggedIn: boolean;
    sideloadedKitsCount?: number;
    cookieSyncDates: Dictionary<number>;
    integrationAttributes: IntegrationAttributes;
    requireDelay: boolean;
    isLocalStorageAvailable: boolean | null;
    storageName: string | null;
    prodStorageName: string | null;
    activeForwarders: MPForwarder[];
    kits: Dictionary<MPForwarder>;
    sideloadedKits: MPForwarder[];
    configuredForwarders: MPForwarder[];
    pixelConfigurations: PixelConfiguration[];
    integrationDelayTimeoutStart: number; // UNIX Timestamp
    webviewBridgeEnabled?: boolean;
    wrapperSDKInfo: WrapperSDKInfo;
}

// TODO: Merge this with SDKStoreApi in sdkRuntimeModels
export default function Store(
    this: IStore,
    config: SDKInitConfig,
    mpInstance: MParticleWebSDK
) {
    const defaultStore: Partial<IStore> = {
        isEnabled: true,
        sessionAttributes: {},
        currentSessionMPIDs: [],
        consentState: null,
        sessionId: null,
        isFirstRun: null,
        clientId: null,
        deviceId: null,
        devToken: null,
        serverSettings: {},
        dateLastEventSent: null,
        sessionStartDate: null,
        currentPosition: null,
        isTracking: false,
        watchPositionId: null,
        cartProducts: [],
        eventQueue: [],
        currencyCode: null,
        globalTimer: null,
        context: null,
        configurationLoaded: false,
        identityCallInFlight: false,
        SDKConfig: {},
        nonCurrentUserMPIDs: {},
        identifyCalled: false,
        isLoggedIn: false,
        cookieSyncDates: {},
        integrationAttributes: {},
        requireDelay: true,
        isLocalStorageAvailable: null,
        storageName: null,
        prodStorageName: null,
        activeForwarders: [],
        kits: {},
        sideloadedKits: [],
        configuredForwarders: [],
        pixelConfigurations: [],
        wrapperSDKInfo: {
            name: 'none',
            version: null,
            isInfoSet: false,
        },
    };

    for (var key in defaultStore) {
        this[key] = defaultStore[key];
    }

    this.integrationDelayTimeoutStart = Date.now();

    this.SDKConfig = createSDKConfig(config);
    // Set configuration to default settings
    if (config) {
        if (config.deviceId) {
            this.deviceId = config.deviceId;
        }
        if (config.hasOwnProperty('isDevelopmentMode')) {
            this.SDKConfig.isDevelopmentMode = mpInstance._Helpers.returnConvertedBoolean(
                config.isDevelopmentMode
            );
        } else {
            this.SDKConfig.isDevelopmentMode = false;
        }

        if (config.hasOwnProperty('v1SecureServiceUrl')) {
            this.SDKConfig.v1SecureServiceUrl = config.v1SecureServiceUrl;
        }

        if (config.hasOwnProperty('v2SecureServiceUrl')) {
            this.SDKConfig.v2SecureServiceUrl = config.v2SecureServiceUrl;
        }

        if (config.hasOwnProperty('v3SecureServiceUrl')) {
            this.SDKConfig.v3SecureServiceUrl = config.v3SecureServiceUrl;
        }

        if (config.hasOwnProperty('identityUrl')) {
            this.SDKConfig.identityUrl = config.identityUrl;
        }

        if (config.hasOwnProperty('aliasUrl')) {
            this.SDKConfig.aliasUrl = config.aliasUrl;
        }

        if (config.hasOwnProperty('configUrl')) {
            this.SDKConfig.configUrl = config.configUrl;
        }

        if (config.hasOwnProperty('logLevel')) {
            this.SDKConfig.logLevel = config.logLevel;
        }

        this.SDKConfig.useNativeSdk = !!config.useNativeSdk;

        this.SDKConfig.kits = config.kits || {};

        this.SDKConfig.sideloadedKits = config.sideloadedKits || [];

        if (config.hasOwnProperty('isIOS')) {
            this.SDKConfig.isIOS = config.isIOS;
        } else {
            this.SDKConfig.isIOS =
                window.mParticle && window.mParticle.isIOS
                    ? window.mParticle.isIOS
                    : false;
        }

        if (config.hasOwnProperty('useCookieStorage')) {
            this.SDKConfig.useCookieStorage = config.useCookieStorage;
        } else {
            this.SDKConfig.useCookieStorage = false;
        }

        if (config.hasOwnProperty('maxProducts')) {
            this.SDKConfig.maxProducts = config.maxProducts;
        } else {
            this.SDKConfig.maxProducts = Constants.DefaultConfig.maxProducts;
        }

        if (config.hasOwnProperty('maxCookieSize')) {
            this.SDKConfig.maxCookieSize = config.maxCookieSize;
        } else {
            this.SDKConfig.maxCookieSize =
                Constants.DefaultConfig.maxCookieSize;
        }

        if (config.hasOwnProperty('appName')) {
            this.SDKConfig.appName = config.appName;
        }

        if (config.hasOwnProperty('package')) {
            this.SDKConfig.package = config.package;
        }

        if (config.hasOwnProperty('integrationDelayTimeout')) {
            this.SDKConfig.integrationDelayTimeout =
                config.integrationDelayTimeout;
        } else {
            this.SDKConfig.integrationDelayTimeout =
                Constants.DefaultConfig.integrationDelayTimeout;
        }

        if (config.hasOwnProperty('identifyRequest')) {
            this.SDKConfig.identifyRequest = config.identifyRequest;
        }

        if (config.hasOwnProperty('identityCallback')) {
            var callback = config.identityCallback;
            if (mpInstance._Helpers.Validators.isFunction(callback)) {
                this.SDKConfig.identityCallback = config.identityCallback;
            } else {
                mpInstance.Logger.warning(
                    'The optional callback must be a function. You tried entering a(n) ' +
                        typeof callback +
                        ' . Callback not set. Please set your callback again.'
                );
            }
        }

        if (config.hasOwnProperty('appVersion')) {
            this.SDKConfig.appVersion = config.appVersion;
        }

        if (config.hasOwnProperty('appName')) {
            this.SDKConfig.appName = config.appName;
        }

        if (config.hasOwnProperty('sessionTimeout')) {
            this.SDKConfig.sessionTimeout = config.sessionTimeout;
        }

        if (config.hasOwnProperty('dataPlan')) {
            this.SDKConfig.dataPlan = {
                PlanVersion: null,
                PlanId: null,
            };

            const dataPlan = config.dataPlan as DataPlanConfig;
            if (dataPlan.planId) {
                if (isDataPlanSlug(dataPlan.planId)) {
                    this.SDKConfig.dataPlan.PlanId = dataPlan.planId;
                } else {
                    mpInstance.Logger.error(
                        'Your data plan id must be a string and match the data plan slug format (i.e. under_case_slug)'
                    );
                }
            }

            if (dataPlan.planVersion) {
                if (isNumber(dataPlan.planVersion)) {
                    this.SDKConfig.dataPlan.PlanVersion = dataPlan.planVersion;
                } else {
                    mpInstance.Logger.error(
                        'Your data plan version must be a number'
                    );
                }
            }
        } else {
            this.SDKConfig.dataPlan = {};
        }

        if (config.hasOwnProperty('forceHttps')) {
            this.SDKConfig.forceHttps = config.forceHttps;
        } else {
            this.SDKConfig.forceHttps = true;
        }

        // Some forwarders require custom flags on initialization, so allow them to be set using config object
        this.SDKConfig.customFlags = config.customFlags || {};

        if (config.hasOwnProperty('minWebviewBridgeVersion')) {
            this.SDKConfig.minWebviewBridgeVersion =
                config.minWebviewBridgeVersion;
        } else {
            this.SDKConfig.minWebviewBridgeVersion = 1;
        }

        if (config.hasOwnProperty('aliasMaxWindow')) {
            this.SDKConfig.aliasMaxWindow = config.aliasMaxWindow;
        } else {
            this.SDKConfig.aliasMaxWindow =
                Constants.DefaultConfig.aliasMaxWindow;
        }

        if (config.hasOwnProperty('dataPlanOptions')) {
            const dataPlanOptions = config.dataPlanOptions;
            if (
                !dataPlanOptions.hasOwnProperty('dataPlanVersion') ||
                !dataPlanOptions.hasOwnProperty('blockUserAttributes') ||
                !dataPlanOptions.hasOwnProperty('blockEventAttributes') ||
                !dataPlanOptions.hasOwnProperty('blockEvents') ||
                !dataPlanOptions.hasOwnProperty('blockUserIdentities')
            ) {
                mpInstance.Logger.error(
                    'Ensure your config.dataPlanOptions object has the following keys: a "dataPlanVersion" object, and "blockUserAttributes", "blockEventAttributes", "blockEvents", "blockUserIdentities" booleans'
                );
            }
        }

        if (config.hasOwnProperty('onCreateBatch')) {
            if (typeof config.onCreateBatch === 'function') {
                this.SDKConfig.onCreateBatch = config.onCreateBatch;
            } else {
                mpInstance.Logger.error(
                    'config.onCreateBatch must be a function'
                );
                // set to undefined because all items are set on createSDKConfig
                this.SDKConfig.onCreateBatch = undefined;
            }
        }

        if (!config.hasOwnProperty('flags')) {
            this.SDKConfig.flags = {};
        }
        if (
            !this.SDKConfig.flags.hasOwnProperty(
                Constants.FeatureFlags.EventBatchingIntervalMillis
            )
        ) {
            this.SDKConfig.flags[
                Constants.FeatureFlags.EventBatchingIntervalMillis
            ] = Constants.DefaultConfig.uploadInterval;
        }
        if (
            !this.SDKConfig.flags.hasOwnProperty(
                Constants.FeatureFlags.ReportBatching
            )
        ) {
            this.SDKConfig.flags[Constants.FeatureFlags.ReportBatching] = false;
        }
        if (
            !this.SDKConfig.flags.hasOwnProperty(
                Constants.FeatureFlags.OfflineStorage
            )
        ) {
            this.SDKConfig.flags[Constants.FeatureFlags.OfflineStorage] = 0;
        }
    }
}
