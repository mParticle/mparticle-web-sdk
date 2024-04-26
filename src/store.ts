import { Batch, Context } from '@mparticle/event-models';
import {
    DataPlanConfig,
    MPID,
    IdentifyRequest,
    IdentityCallback,
    SDKEventCustomFlags,
    ConsentState,
    UserIdentities,
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
import {
    Dictionary,
    isDataPlanSlug,
    isEmpty,
    isNumber,
    isObject,
    moveElementToEnd,
    parseNumber,
    returnConvertedBoolean,
} from './utils';
import { IMinifiedConsentJSONObject, SDKConsentState } from './consent';
import { Kit, MPForwarder } from './forwarders.interfaces';
import {
    CookieSyncDates,
    IGlobalStoreV2MinifiedKeys,
    IPersistenceMinified,
    UserAttributes,
} from './persistence.interfaces';

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
    flags?: IFeatureFlags;
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
    userAudienceUrl?: string;
    isIOS?: boolean;
    maxProducts: number;
    requestConfig?: boolean;
    sessionTimeout?: number;
    useNativeSdk?: boolean;
    useCookieStorage?: boolean;
    v1SecureServiceUrl?: string;
    v2SecureServiceUrl?: string;
    v3SecureServiceUrl?: string;
    webviewBridgeName?: string;
    workspaceToken?: string;
    requiredWebviewBridgeName?: string;
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

    for (const prop in Constants.DefaultBaseUrls) {
        sdkConfig[prop] = Constants.DefaultBaseUrls[prop];
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

// https://go.mparticle.com/work/SQDSDKS-5954
export interface IFeatureFlags {
    reportBatching?: boolean;
    eventBatchingIntervalMillis?: number;
    offlineStorage?: string;
    directURLRouting?: boolean;
    cacheIdentity?: boolean;
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

    persistenceData?: IPersistenceMinified;

    getCookieSyncDates?(mpid: MPID): CookieSyncDates;
    setCookieSyncDates?(mpid: MPID, cookieSyncDates: CookieSyncDates): void;
    getConsentState?(mpid: MPID): ConsentState | null;
    setConsentState?(mpid: MPID, consentState: ConsentState): void;

    _getFromPersistence?<T>(mpid: MPID, key: string): T;
    _setPersistence?<T>(mpid: MPID, key: string, value: T): void;

    getDeviceId?(): string;
    setDeviceId?(deviceId: string): void;
    getFirstSeenTime?(mpid: MPID): number;
    setFirstSeenTime?(mpid: MPID, time?: number): void;
    getLastSeenTime?(mpid: MPID): number;
    setLastSeenTime?(mpid: MPID, time?: number): void;
    getUserAttributes?(mpid: MPID): UserAttributes;
    setUserAttributes?(mpid: MPID, attributes: UserAttributes): void;
    getUserIdentities?(mpid: MPID): UserIdentities;
    setUserIdentities?(mpid: MPID, userIdentities: UserIdentities): void;

    addMpidToSessionHistory?(mpid: MPID, previousMpid?: MPID): void;
    getGlobalStorageAttributes?(): IGlobalStoreV2MinifiedKeys;
    hasInvalidIdentifyRequest?: () => boolean;
    nullifySession?: () => void;
    processConfig(config: SDKInitConfig): void;
    syncPersistenceData?: () => void;
}

// TODO: Merge this with SDKStoreApi in sdkRuntimeModels
export default function Store(
    this: IStore,
    config: SDKInitConfig,
    mpInstance: MParticleWebSDK,
    apiKey?: string
) {
    const {
        createMainStorageName,
        createProductStorageName,
    } = mpInstance._Helpers;

    const { isWebviewEnabled } = mpInstance._NativeSdkHelpers;

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

        // Placeholder for in-memory persistence model
        persistenceData: {
            gs: {} as IGlobalStoreV2MinifiedKeys,
        } as IPersistenceMinified,
    };

    for (var key in defaultStore) {
        this[key] = defaultStore[key];
    }
    this.devToken = apiKey || null;

    this.integrationDelayTimeoutStart = Date.now();

    // Set configuration to default settings
    this.SDKConfig = createSDKConfig(config);

    if (config) {
        if (!config.hasOwnProperty('flags')) {
            this.SDKConfig.flags = {};
        }

        // We process the initial config that is passed via the SDK init
        // and then we will reprocess the config within the processConfig
        // function when the config is updated from the server
        // https://go.mparticle.com/work/SQDSDKS-6317
        this.SDKConfig.flags = processFlags(config);

        if (config.deviceId) {
            this.deviceId = config.deviceId;
        }
        if (config.hasOwnProperty('isDevelopmentMode')) {
            this.SDKConfig.isDevelopmentMode = returnConvertedBoolean(
                config.isDevelopmentMode
            );
        } else {
            this.SDKConfig.isDevelopmentMode = false;
        }

        const baseUrls: Dictionary<string> = processBaseUrls(
            config,
            this.SDKConfig.flags,
            apiKey
        );

        for (const baseUrlKeys in baseUrls) {
            this.SDKConfig[baseUrlKeys] = baseUrls[baseUrlKeys];
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
    }

    this._getFromPersistence = <T>(mpid: MPID, key: string): T | null => {
        if (!mpid) {
            return null;
        }

        this.syncPersistenceData();

        if (
            this.persistenceData &&
            this.persistenceData[mpid] &&
            this.persistenceData[mpid][key]
        ) {
            return this.persistenceData[mpid][key] as T;
        } else {
            return null;
        }
    };

    this._setPersistence = <T>(mpid: MPID, key: string, value: T): void => {
        if (!mpid) {
            return;
        }

        this.syncPersistenceData();

        if (this.persistenceData) {
            if (this.persistenceData[mpid]) {
                this.persistenceData[mpid][key] = value;
            } else {
                this.persistenceData[mpid] = {
                    [key]: value,
                };
            }

            // Clear out persistence attributes that are empty
            // so that we don't upload empty or undefined values
            if (
                isObject(this.persistenceData[mpid][key]) &&
                isEmpty(this.persistenceData[mpid][key])
            ) {
                delete this.persistenceData[mpid][key];
            }

            mpInstance._Persistence.savePersistence(this.persistenceData);
        }
    };

    this.getGlobalStorageAttributes = () => ({
        sid: this.sessionId,
        ie: this.isEnabled,
        sa: this.sessionAttributes,
        ss: this.serverSettings,
        dt: this.devToken,
        les: this.dateLastEventSent ? this.dateLastEventSent.getTime() : null,
        av: this.SDKConfig.appVersion,
        cgid: this.clientId,
        das: this.deviceId,
        c: this.context,
        ssd: this.sessionStartDate ? this.sessionStartDate.getTime() : 0,
        ia: this.integrationAttributes,

        csm: this.sessionId ? this.currentSessionMPIDs : undefined,
    });

    this.hasInvalidIdentifyRequest = (): boolean => {
        const { identifyRequest } = this.SDKConfig;
        return (
            (isObject(identifyRequest) &&
                isObject(identifyRequest.userIdentities) &&
                isEmpty(identifyRequest.userIdentities)) ||
            !identifyRequest
        );
    };

    this.getCookieSyncDates = (mpid: MPID): CookieSyncDates =>
        this._getFromPersistence<CookieSyncDates>(mpid, 'csd') || {};

    this.setCookieSyncDates = (mpid: MPID, cookieSyncDates: CookieSyncDates) => 
        this._setPersistence<CookieSyncDates>(mpid, 'csd', cookieSyncDates);

    this.getConsentState = (mpid: MPID): ConsentState => {
        const {
            fromMinifiedJsonObject,
        } = mpInstance._Consent.ConsentSerialization;

        const serializedConsentState = this._getFromPersistence<
            IMinifiedConsentJSONObject
        >(mpid, 'con');

        if (!isEmpty(serializedConsentState)) {
            return fromMinifiedJsonObject(serializedConsentState);
        }

        return null;
    };

    this.setConsentState = (mpid: MPID, consentState: ConsentState) => {
        const {
            toMinifiedJsonObject,
        } = mpInstance._Consent.ConsentSerialization;

        // If ConsentState is null, we assume the intent is to clear out the consent state
        if (consentState || consentState === null) {
            this._setPersistence(
                mpid,
                'con',
                toMinifiedJsonObject(consentState)
            );
        }
    };

    this.getDeviceId = () => this.deviceId;
    this.setDeviceId = (deviceId: string) => {
        this.deviceId = deviceId;
        this.persistenceData.gs.das = deviceId;
        mpInstance._Persistence.update();
    };


    this.getFirstSeenTime = (mpid: MPID) =>
        this._getFromPersistence<number>(mpid, 'fst');

     // set the "first seen" time for a user. the time will only be set once for a given
     // mpid after which subsequent calls will be ignored
    this.setFirstSeenTime = (mpid: MPID, _time?: number) => {
        if (!mpid) {
            return;
        }

        const time = _time || new Date().getTime();

        this.syncPersistenceData();

        if(!this.persistenceData[mpid]) {
            this.persistenceData[mpid] = {};
        }
        if(!this.persistenceData[mpid].fst) {
            this.persistenceData[mpid].fst = time;
            this._setPersistence(mpid, 'fst', time);
        }
    };

    this.getLastSeenTime = (mpid: MPID): number => {
        if (!mpid) {
            return null;
        }
        // https://go.mparticle.com/work/SQDSDKS-6315
        const currentUser = mpInstance.Identity.getCurrentUser();
        if (mpid === currentUser?.getMPID()) {
            // if the mpid is the current user, its last seen time is the current time
            return new Date().getTime();
        }
        return this._getFromPersistence<number>(mpid, 'lst');
    };

    this.setLastSeenTime = (mpid: MPID, _time?: number) => {
        if (!mpid) {
            return;
        }

        const time = _time || new Date().getTime();

        this._setPersistence(mpid, 'lst', time);
    };

    this.syncPersistenceData = () => {
        const persistenceData = mpInstance._Persistence.getPersistence();

        this.persistenceData = mpInstance._Helpers.extend(
            {},
            this.persistenceData,
            persistenceData,
        );
    };

    this.getUserIdentities = (mpid: MPID): UserIdentities =>
        this._getFromPersistence(mpid, 'ui') || {};

    this.setUserIdentities = (mpid: MPID, userIdentities: UserIdentities) => {
        this._setPersistence(mpid, 'ui', userIdentities);
    }

    this.getUserAttributes = (mpid: MPID): UserAttributes =>
        this._getFromPersistence(mpid, 'ua') || {};

    this.setUserAttributes = (
        mpid: MPID,
        userAttributes: UserAttributes
    ): void => this._setPersistence(mpid, 'ua', userAttributes);

    this.addMpidToSessionHistory = (mpid: MPID, previousMPID?: MPID): void => {
        const indexOfMPID = this.currentSessionMPIDs.indexOf(mpid);

        if (mpid && previousMPID !== mpid && indexOfMPID < 0) {
            this.currentSessionMPIDs.push(mpid);
            return;
        }

        if (indexOfMPID >= 0) {
            this.currentSessionMPIDs = moveElementToEnd(
                this.currentSessionMPIDs,
                indexOfMPID
            );
        }
    };

    this.nullifySession = (): void => {
        this.sessionId = null;
        this.dateLastEventSent = null;
        this.sessionAttributes = {};
        mpInstance._Persistence.update();
    };

    this.processConfig = (config: SDKInitConfig) => {
        const { workspaceToken, requiredWebviewBridgeName } = config;

        // We should reprocess the flags in case they have changed when we request an updated config
        // such as if the SDK is being self-hosted and the flags are different on the server config
        // https://go.mparticle.com/work/SQDSDKS-6317
        this.SDKConfig.flags = processFlags(config);

        if (workspaceToken) {
            this.SDKConfig.workspaceToken = workspaceToken;
        } else {
            mpInstance.Logger.warning(
                'You should have a workspaceToken on your config object for security purposes.'
            );
        }
        // add a new function to apply items to the store that require config to be returned
        this.storageName = createMainStorageName(workspaceToken);
        this.prodStorageName = createProductStorageName(workspaceToken);

        this.SDKConfig.requiredWebviewBridgeName =
            requiredWebviewBridgeName || workspaceToken;

        this.webviewBridgeEnabled = isWebviewEnabled(
            this.SDKConfig.requiredWebviewBridgeName,
            this.SDKConfig.minWebviewBridgeVersion
        );

        this.configurationLoaded = true;
    };
}

// https://go.mparticle.com/work/SQDSDKS-6317
export function processFlags(config: SDKInitConfig): IFeatureFlags {
    const flags: IFeatureFlags = {};
    const {
        ReportBatching,
        EventBatchingIntervalMillis,
        OfflineStorage,
        DirectUrlRouting,
        CacheIdentity,
        AudienceAPI,
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

    return flags;
}

export function processBaseUrls(
    config: SDKInitConfig,
    flags: IFeatureFlags,
    apiKey?: string
): Dictionary<string> {
    // an API key is not present in a webview only mode. In this case, no baseUrls are needed
    if (!apiKey) {
        return {};
    }

    // Set default baseUrls
    let baseUrls: Dictionary<string>;

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
    const newBaseUrls: Dictionary<string> = {};

    // If there is no custo base url, we use the default base url
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
