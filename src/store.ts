import { Batch } from '@mparticle/event-models';
import { Context } from '@mparticle/event-models';
import {
    DataPlanConfig,
    MPID,
    IdentifyRequest,
    IdentityCallback,
    SDKEventCustomFlags,
    UserIdentities,
    ConsentState,
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
    isNumber,
    isDataPlanSlug,
    Dictionary,
    parseNumber,
    isEmpty,
    mergeObjects,
} from './utils';
import { IMinifiedConsentJSONObject, SDKConsentState } from './consent';
import { Kit, MPForwarder } from './forwarders.interfaces';
import {
    CookieSyncDate,
    IGlobalStoreV2MinifiedKeys,
    IPersistenceMinified,
    UserAttributes,
} from './persistence.interfaces';

const { Messages } = Constants;

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
    reportBatching?: string;
    eventBatchingIntervalMillis?: number;
    offlineStorage?: string;
    directURLRouting?: boolean;
    cacheIdentity?: boolean;
}

// Temporary Interface until Store can be refactored as a class
export interface IStore {
    mpid?: MPID;

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

    setAppVersion: (appVersion: string) => void;

    _getFromPersistence?<T>(mpid: MPID, key: string): T;
    _setPersistence?<T>(mpid: MPID, key: string, value: T): void;
    setPersistenceData?(persistenceData: IPersistenceMinified): void;
    getPersistenceData?(): IPersistenceMinified;

    getConsentState?(mpid: MPID): ConsentState;
    setConsentState?(mpid: MPID, consentState: ConsentState): void;

    getFirstSeenTime?(mpid: MPID): number;
    setFirstSeenTime?(mpid: MPID, time?: number): void;
    getLastSeenTime?(mpid: MPID): number;
    setLastSeenTime?(mpid: MPID, time?: number): void;

    getUserIdentities?(mpid: MPID): UserIdentities;
    setUserIdentities?(mpid: MPID, userIdentities: UserIdentities): void;
    getAllUserAttributes?(mpid: MPID): Dictionary;
    setUserAttributes?(mpid: MPID, userAttributes: Dictionary): void;
    setUserCookieSyncDates?(mpid: MPID, cookieSyncDates: Dictionary): void;

    hasCurrentUser?(): boolean;
    hasSession?(): boolean;

    nullifySession?(): void;

    // Originally this took data as a param and mutated. This should actuall
    // return the data and allow the "end user" to mutate a copy.
    getGlobalStorageAttributes?(): IPersistenceMinified;

    getDeviceId?(): string;
    setDeviceId?(guid: string): void;

    swapIdentity?(currentMPID: MPID, currentSessionMPIDs: MPID[]): void;

    storeDataInPersistence?(
        persistenceObject: IPersistenceMinified,
        mpid: MPID
    ): void;
}

// TODO: Merge this with SDKStoreApi in sdkRuntimeModels
export default function Store(
    this: IStore,
    config: SDKInitConfig,
    mpInstance: MParticleWebSDK,
    apiKey?: string
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

        // Placeholder for in-memory persistence model
        persistenceData: {
            cu: null,
            gs: {
                sid: null,
                ie: null,
                sa: null,
                ss: null,
                dt: null,
                av: null,
                cgid: null,
                das: null,
                ia: null,
                c: null,
                csm: null,
                les: null,
                ssd: null,
            },
            l: null,
        },
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

        this.SDKConfig.flags = processFlags(config, this
            .SDKConfig as SDKConfig);

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

    this.setAppVersion = (appVersion: string): void => {
        this.SDKConfig.appVersion = appVersion;
        mpInstance._Persistence.update();
    };

    // TODO: Create an interface for T so we can restrict this method to only
    //       valid keys of T
    this._getFromPersistence = <T>(mpid: MPID, key: string): T | null => {
        if (!mpid) {
            return null;
        }

        const persistence = mpInstance._Persistence.getPersistence();

        this.persistenceData = mergeObjects(this.persistenceData, persistence);

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

    this.getPersistenceData = (): IPersistenceMinified => {
        const persistence = mpInstance._Persistence.getPersistence();

        this.persistenceData = mergeObjects(this.persistenceData, persistence);

        return this.persistenceData;
    };

    this.getFirstSeenTime = (mpid: MPID): number =>
        this._getFromPersistence<number>(mpid, 'fst');
    this.getLastSeenTime = (mpid: MPID): number =>
        this._getFromPersistence<number>(mpid, 'lst');
    this.getUserIdentities = (mpid: MPID): UserIdentities =>
        this._getFromPersistence<UserIdentities>(mpid, 'ui');

    // QUESTION: Can we rename this to getUserAttributes?
    this.getAllUserAttributes = (mpid: MPID): Dictionary =>
        this._getFromPersistence<Dictionary>(mpid, 'ua');
    this.getConsentState = (mpid: MPID): ConsentState => {
        const serializedConsentState = this._getFromPersistence<
            IMinifiedConsentJSONObject
        >(mpid, 'con');

        if (!isEmpty(serializedConsentState)) {
            return mpInstance._Consent.ConsentSerialization.fromMinifiedJsonObject(
                serializedConsentState
            );
        }

        return null;
    };

    this._setPersistence = <T>(mpid: MPID, key: string, value: T): void => {
        if (!mpid) {
            return;
        }

        const persistence: IPersistenceMinified = mpInstance._Persistence.getPersistence();

        this.persistenceData = mergeObjects(this.persistenceData, persistence);

        if (this.persistenceData) {
            if (this.persistenceData[mpid]) {
                this.persistenceData[mpid][key] = value;
            } else {
                this.persistenceData[mpid] = {
                    [key]: value,
                };
            }
            mpInstance._Persistence.savePersistence(this.persistenceData);
        }
    };

    this.setPersistenceData = (persistenceData: IPersistenceMinified): void => {
        const persistence = mpInstance._Persistence.getPersistence();

        this.persistenceData = mergeObjects(
            this.persistenceData,
            persistence,
            persistenceData
        );
    };

    this.setFirstSeenTime = (mpid: MPID, _time: number): void => {
        const time = _time || new Date().getTime();
        this._setPersistence<number>(mpid, 'fst', time);
    };
    this.setLastSeenTime = (mpid: MPID, _time: number): void => {
        const time = _time || new Date().getTime();
        this._setPersistence<number>(mpid, 'lst', time);
    };
    this.setUserIdentities = (
        mpid: MPID,
        userIdentities: UserIdentities
    ): void => {
        this._setPersistence<UserIdentities>(mpid, 'ui', userIdentities);
    };
    this.setUserAttributes = (
        mpid: MPID,
        userAttributes: UserAttributes
    ): void => {
        this._setPersistence<Dictionary>(mpid, 'ua', userAttributes);
    };
    this.setConsentState = (mpid: MPID, consentState: ConsentState): void => {
        const serializedConsentState = mpInstance._Consent.ConsentSerialization.toMinifiedJsonObject(
            consentState
        );

        this._setPersistence<IMinifiedConsentJSONObject>(
            mpid,
            'con',
            serializedConsentState
        );
    };
    this.setUserCookieSyncDates = (
        mpid: MPID,
        cookieSyncDates: CookieSyncDate[]
    ): void => {
        this._setPersistence<CookieSyncDate[]>(mpid, 'csd', cookieSyncDates);
    };

    this.hasCurrentUser = (): boolean => {
        const persistance = this.getPersistenceData();

        return !!persistance.cu;
    };

    this.hasSession = (): boolean => {
        const persistance = this.getPersistenceData();

        return !!(persistance.gs && persistance.gs.sid);
    };

    this.nullifySession = (): void => {
        this.sessionId = null;
        this.dateLastEventSent = null;
        this.sessionAttributes = {};
        mpInstance._Persistence.update();
    };

    this.getGlobalStorageAttributes = (): IPersistenceMinified => {
        const data: Partial<IPersistenceMinified> = {};

        data.gs.sid = this.sessionId;
        data.gs.ie = this.isEnabled;
        data.gs.sa = this.sessionAttributes;
        data.gs.ss = this.serverSettings;
        data.gs.dt = this.devToken;
        data.gs.les = this.dateLastEventSent
            ? this.dateLastEventSent.getTime()
            : null;
        data.gs.av = this.SDKConfig.appVersion;
        data.gs.cgid = this.clientId;
        data.gs.das = this.deviceId;
        data.gs.c = this.context;
        data.gs.ssd = this.sessionStartDate
            ? this.sessionStartDate.getTime()
            : 0;
        data.gs.ia = this.integrationAttributes;

        return data as IPersistenceMinified;
    };

    this.getDeviceId = (): string => this.deviceId;
    this.setDeviceId = (guid: string): void => {
        this.deviceId = guid;

        // https://go.mparticle.com/work/SQDSDKS-6045
        mpInstance._Persistence.update();
    };

    this.swapIdentity = (
        currentMPID: MPID,
        currentSessionMPIDs: MPID[]
    ): void => {
        const persistance = mpInstance._Persistence.getPersistence();

        this.persistenceData = mergeObjects(this.persistenceData, persistance);

        if (this.persistenceData) {
            this.persistenceData.cu = currentMPID;
            this.persistenceData.gs.csm = currentSessionMPIDs;
            mpInstance._Persistence.savePersistence(this.persistenceData);
        }
    };

    this.storeDataInPersistence = (
        persistenceObject: IPersistenceMinified,
        currentMPID: MPID
    ): void => {
        try {
            if (!persistenceObject) {
                mpInstance.Logger.verbose(
                    Messages.InformationMessages.CookieNotFound
                );

                // QUESTION: Can we remove these now that we have store defaults?
                this.clientId =
                    this.clientId || mpInstance._Helpers.generateUniqueId();
                this.deviceId =
                    this.deviceId || mpInstance._Helpers.generateUniqueId();
            } else {
                //         // Set MPID first, then change object to match MPID data
                if (currentMPID) {
                    this.mpid = currentMPID;
                } else {
                    this.mpid = persistenceObject.cu || '';
                }
                persistenceObject.gs =
                    persistenceObject.gs || ({} as IGlobalStoreV2MinifiedKeys);
                this.sessionId = persistenceObject.gs.sid || this.sessionId;
                this.isEnabled =
                    typeof persistenceObject.gs.ie !== 'undefined'
                        ? persistenceObject.gs.ie
                        : this.isEnabled;
                this.sessionAttributes =
                    persistenceObject.gs.sa || this.sessionAttributes;
                this.serverSettings =
                    persistenceObject.gs.ss || this.serverSettings;
                this.devToken = this.devToken || persistenceObject.gs.dt;
                this.SDKConfig.appVersion =
                    this.SDKConfig.appVersion || persistenceObject.gs.av;
                this.clientId =
                    persistenceObject.gs.cgid ||
                    this.clientId ||
                    mpInstance._Helpers.generateUniqueId();
                // For most persistence values, we prioritize localstorage/cookie values over
                // Store. However, we allow device ID to be overriden via a config value and
                // thus the priority of the deviceId value is
                // 1. value passed via config.deviceId
                // 2. previous value in persistence
                // 3. generate new guid
                this.deviceId =
                    this.deviceId ||
                    persistenceObject.gs.das ||
                    mpInstance._Helpers.generateUniqueId();
                this.integrationAttributes = persistenceObject.gs.ia || {};
                this.context = persistenceObject.gs.c || this.context;
                this.currentSessionMPIDs =
                    persistenceObject.gs.csm || this.currentSessionMPIDs;
                this.isLoggedIn = persistenceObject.l === (true as Boolean);
                if (persistenceObject.gs.les) {
                    this.dateLastEventSent = new Date(persistenceObject.gs.les);
                }
                if (persistenceObject.gs.ssd) {
                    this.sessionStartDate = new Date(persistenceObject.gs.ssd);
                } else {
                    this.sessionStartDate = new Date();
                }
                if (currentMPID) {
                    persistenceObject = persistenceObject[currentMPID];
                } else {
                    persistenceObject = persistenceObject[persistenceObject.cu];
                }

                // QUESTION: Should we store this persistence object into persistenceData?
            }
        } catch (error) {
            mpInstance.Logger.error(Messages.ErrorMessages.CookieParseError);
            console.error(error);
        }
    };
}

export function processFlags(
    config: SDKInitConfig,
    SDKConfig: SDKConfig
): IFeatureFlags {
    const flags: IFeatureFlags = {};
    const {
        ReportBatching,
        EventBatchingIntervalMillis,
        OfflineStorage,
        DirectUrlRouting,
        CacheIdentity,
    } = Constants.FeatureFlags;

    if (!config.flags) {
        return {};
    }

    // Passed in config flags take priority over defaults
    flags[ReportBatching] = config.flags[ReportBatching] || false;
    // The server returns stringified numbers, sowe need to parse
    flags[EventBatchingIntervalMillis] =
        parseNumber(config.flags[EventBatchingIntervalMillis]) ||
        Constants.DefaultConfig.uploadInterval;
    flags[OfflineStorage] = config.flags[OfflineStorage] || '0';
    flags[DirectUrlRouting] = config.flags[DirectUrlRouting] === 'True';
    flags[CacheIdentity] = config.flags[CacheIdentity] === 'True';

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
