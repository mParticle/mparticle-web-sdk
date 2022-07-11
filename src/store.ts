import { Context } from '@mparticle/event-models';
import { MPID } from '@mparticle/web-sdk';
import Constants from './constants';
import {
    MParticleWebSDK,
    SDKConfig,
    SDKConsentState,
    SDKEvent,
    SDKGeoLocation,
    SDKInitConfig,
    SDKProduct,
} from './sdkRuntimeModels';

function createSDKConfig(config: SDKInitConfig): SDKConfig {
    // FIXME: Refactor to create a default config object
    const sdkConfig = {} as SDKConfig;
    for (var prop in Constants.DefaultConfig) {
        if (Constants.DefaultConfig.hasOwnProperty(prop)) {
            sdkConfig[prop] = Constants.DefaultConfig[prop];
        }
    }

    if (config) {
        for (prop in config) {
            if (config.hasOwnProperty(prop)) {
                sdkConfig[prop] = config[prop];
            }
        }
    }

    for (prop in Constants.DefaultUrls) {
        sdkConfig[prop] = Constants.DefaultUrls[prop];
    }

    return sdkConfig;
}

// TODO: Create Types for the following:
export type MPForwarder = Record<string, any>;
export type PixelConfiguration = Record<string, any>;

// TODO: TEMP interface for Store until we can refactor as class
export interface IStore {
    isEnabled: boolean;
    sessionAttributes: Record<string, any>; // TODO: Can we make this a type?
    currentSessionMPIDs: MPID[];
    consentState: SDKConsentState | null;
    sessionId: string | null;
    isFirstRun: boolean;
    clientId: string;
    deviceId: string;
    devToken: string | null;
    migrationData: Record<string, any>; // TODO: Remove when we archive Web SDK v1
    serverSettings: Record<string, any>; // TODO: Need a valid type
    dateLastEventSent: number | null;
    sessionStartDate: number | null;
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
    SDKConfig: Partial<SDKConfig>; // FIXME: Should be {} as SDKConfig?
    migratingToIDSyncCookies: boolean; // TODO: Remove when we archive Web SDK v1
    nonCurrentUserMPIDs: Record<MPID, Record<string, any>>; // TODO: Need a better shape of this data
    identifyCalled: boolean;
    isLoggedIn: boolean;
    cookieSyncDates: Record<string, number>;
    integrationAttributes: Record<string, Record<string, string>>; // TODO: Can we come up with a better type?
    requireDelay: boolean;
    isLocalStorageAvailable: boolean | null;
    storageName: string | null;
    prodStorageName: string | null;
    activeForwarders: MPForwarder[];
    kits: Record<string, MPForwarder>;
    configuredForwarders: MPForwarder[];
    pixelConfigurations: PixelConfiguration[];
    integrationDelayTimeoutStart: number; // UNIX Timestamp
}

export default function Store(
    this: IStore,
    config: SDKInitConfig,
    mpInstance: MParticleWebSDK
) {
    var defaultStore: Partial<IStore> = {
        isEnabled: true,
        sessionAttributes: {},
        currentSessionMPIDs: [],
        consentState: null,
        sessionId: null,
        isFirstRun: null,
        clientId: null,
        deviceId: null,
        devToken: null,
        migrationData: {},
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
        SDKConfig: {} as SDKConfig,
        migratingToIDSyncCookies: false,
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
        configuredForwarders: [],
        pixelConfigurations: [],
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

        if (config.hasOwnProperty('useNativeSdk')) {
            this.SDKConfig.useNativeSdk = config.useNativeSdk;
        } else {
            this.SDKConfig.useNativeSdk = false;
        }
        if (config.hasOwnProperty('kits')) {
            this.SDKConfig.kits = config.kits;
        }

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
            if (config.dataPlan.hasOwnProperty('planId')) {
                if (typeof config.dataPlan.planId === 'string') {
                    if (mpInstance._Helpers.isSlug(config.dataPlan.planId)) {
                        this.SDKConfig.dataPlan.PlanId = config.dataPlan.planId;
                    } else {
                        mpInstance.Logger.error(
                            'Your data plan id must be in a slug format'
                        );
                    }
                } else {
                    mpInstance.Logger.error(
                        'Your data plan id must be a string'
                    );
                }
            }

            if (config.dataPlan.hasOwnProperty('planVersion')) {
                if (typeof config.dataPlan.planVersion === 'number') {
                    this.SDKConfig.dataPlan.PlanVersion =
                        config.dataPlan.planVersion;
                } else {
                    mpInstance.Logger.error(
                        'Your data plan version must be a number'
                    );
                }
            }
        }

        if (config.hasOwnProperty('forceHttps')) {
            this.SDKConfig.forceHttps = config.forceHttps;
        } else {
            this.SDKConfig.forceHttps = true;
        }

        // Some forwarders require custom flags on initialization, so allow them to be set using config object
        if (config.hasOwnProperty('customFlags')) {
            this.SDKConfig.customFlags = config.customFlags;
        }

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
                Constants.FeatureFlags.EventsV3
            )
        ) {
            this.SDKConfig.flags[Constants.FeatureFlags.EventsV3] = 0;
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
    }
}
