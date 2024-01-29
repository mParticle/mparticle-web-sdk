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
    MParticleUser,
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
    generateUniqueId,
    isEmpty,
} from './utils';
import { IMinifiedConsentJSONObject, SDKConsentState } from './consent';
import { Kit, MPForwarder } from './forwarders.interfaces';
import {
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
    isIOS?: boolean;
    maxProducts: number;
    requestConfig?: boolean;
    sessionTimeout?: number;
    useNativeSdk?: boolean;
    usePersistence?: boolean;
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

    mpid?: MPID;

    persistenceData?: IPersistenceMinified;
    initializePersistence?(): void;
    storeDataInMemory?(obj: IPersistenceMinified, currentMPID: MPID): void;
    updatePersistence?(): void;
    getPersistence?(): IPersistenceMinified;
    getGlobalStorageAttributes?: () => IGlobalStoreV2MinifiedKeys;
    savePersistence?(persistence: IPersistenceMinified): void;
    getConsentState?(mpid: MPID): ConsentState; // TODO: Make sure this is the correct type
    setConsentState?(mpid, consentState: ConsentState): void;

    userAttributes?: Dictionary<UserAttributes>;
    getUserAttributes?(mpid: MPID): UserAttributes;

    // QUESTION: Is there a difference between this and currentUserIdentities?
    userIdentities?: UserIdentities;
    setUserIdentities?(mpid: MPID, identities: UserIdentities): void;
    getUserIdentities?(mpid: MPID): UserIdentities;

    getFirstSeenTime?(mpid: MPID): number;
    setFirstSeenTime?(mpid: MPID, time?: number): void;
    getLastSeenTime?(mpid: MPID): number;
    setLastSeenTime?(mpid: MPID, time?: number): void;

    getDeviceId(): string;
    setDeviceId(deviceId: string): void;

    nullifySession?(): void;
}

// TODO: Merge this with SDKStoreApi in sdkRuntimeModels
export default function Store(
    this: IStore,
    config: SDKInitConfig,
    mpInstance: MParticleWebSDK,
    apiKey?: string
) {
    const defaultStore: Partial<IStore> = {
        mpid: null,
        isEnabled: true,
        sessionAttributes: {},
        currentSessionMPIDs: [],
        consentState: null,
        sessionId: null,
        isFirstRun: true,
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
        userIdentities: {},
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

    this.clientId = generateUniqueId();
    this.deviceId = generateUniqueId();

    // Set configuration to default settings
    this.SDKConfig = createSDKConfig(config);

    if (config) {
        if (!config.hasOwnProperty('flags')) {
            this.SDKConfig.flags = {};
        }

        this.SDKConfig.flags = processFlags(
            config,
            this.SDKConfig as SDKConfig
        );

        if (config.deviceId) {
            this.deviceId = config.deviceId;
        }
        if (config.hasOwnProperty('isDevelopmentMode')) {
            this.SDKConfig.isDevelopmentMode =
                mpInstance._Helpers.returnConvertedBoolean(
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

        if (config.hasOwnProperty('usePersistence')) {
            this.SDKConfig.usePersistence = config.usePersistence;
        } else {
            this.SDKConfig.usePersistence = true;
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

    this.getUserAttributes = (mpid: MPID): UserAttributes => {
        return { ...this.persistenceData[mpid]?.ua };
    };

    this.getFirstSeenTime = (mpid: MPID): number => {
        return this.persistenceData[mpid]?.fst || null;
    };

    this.setFirstSeenTime = (mpid: MPID, time?: number): void => {
        if (!mpid) {
            return null;
        }

        if (!time) {
            time = new Date().getTime();
        }

        if (isEmpty(this.persistenceData[mpid])) {
            this.persistenceData[mpid] = {};
        }
        if (!this.persistenceData[mpid].fst) {
            this.persistenceData[mpid].fst = time;
        }
    };

    this.getLastSeenTime = (mpid: MPID): number => {
        return this.persistenceData[mpid]?.lst || null;
    };

    this.setLastSeenTime = (mpid: MPID, time?: number): void => {
        if (!mpid) {
            return null;
        }

        if (!time) {
            time = new Date().getTime();
        }

        if (isEmpty(this.persistenceData[mpid])) {
            this.persistenceData[mpid] = {};
        }
        if (!this.persistenceData[mpid].lst) {
            this.persistenceData[mpid].lst = time;
        }
    };

    this.setUserIdentities = (mpid: MPID, identities: UserIdentities): void => {
        if (isEmpty(identities)) {
            return;
        }

        if (this.persistenceData[mpid]?.ui) {
            this.persistenceData[mpid].ui = identities;
        } else {
            this.persistenceData[mpid] = {
                ui: identities,
            };
        }
    };

    this.getUserIdentities = (mpid: MPID) => {
        return { ...this.persistenceData[mpid]?.ui };
    };

    // QUESTION: Should we just use get/set instead?
    this.getDeviceId = (): string => this.deviceId;
    this.setDeviceId = (deviceId: string): void => {
        // TODO: This should update persistence
        this.deviceId = deviceId;
        mpInstance._Persistence.update();
    };

    this.getConsentState = (mpid: MPID): ConsentState => {
        const consentState = this.persistenceData[mpid]?.con;
        if (isEmpty(consentState)) {
            return null;
        }

        return mpInstance._Consent.ConsentSerialization.fromMinifiedJsonObject(
            consentState
        );
    };

    this.setConsentState = (mpid: MPID, consentState: ConsentState) => {
        // QUESTION: What is the context here?
        // it's currently not supported to set persistence
        // for any MPID that's not the current one.
        if (isEmpty(consentState)) {
            const minifiedConsentState: IMinifiedConsentJSONObject =
                mpInstance._Consent.ConsentSerialization.toMinifiedJsonObject(
                    consentState
                );
            if (this.persistenceData[mpid] && this.persistenceData[mpid].con) {
                this.persistenceData[mpid].con = minifiedConsentState;
            } else {
                this.persistenceData[mpid] = {
                    con: minifiedConsentState,
                };
            }
        }
    };

    this.nullifySession = (): void => {
        this.sessionId = null;
        this.dateLastEventSent = null;
        this.sessionAttributes = {};
        this.sessionStartDate = null;
    };

    this.storeDataInMemory = (obj: IPersistenceMinified, currentMPID: MPID) => {
        if (currentMPID) {
            this.mpid = currentMPID;
        } else {
            this.mpid = obj.cu || '';
        }

        this.sessionId = obj?.gs?.sid || this.sessionId;
        this.isEnabled =
            typeof obj?.gs?.ie !== 'undefined' ? obj.gs.ie : this.isEnabled;
        this.sessionAttributes = obj?.gs?.sa || this.sessionAttributes;
        this.serverSettings = obj?.gs?.ss || this.serverSettings;
        this.devToken = this.devToken || obj?.gs?.dt;

        // FIXME: We should not be mutating this setting
        this.SDKConfig.appVersion = this.SDKConfig.appVersion || obj?.gs?.av;
        this.clientId = obj?.gs?.cgid || this.clientId;

        // For most persistence values, we prioritize localstorage/cookie values over
        // Store. However, we allow device ID to be overriden via a config value and
        // thus the priority of the deviceId value is
        // 1. value passed via config.deviceId
        // 2. previous value in persistence
        // 3. generate new guid
        this.deviceId = this.deviceId || obj?.gs?.das;

        this.integrationAttributes = obj?.gs?.ia || {};
        this.context = obj?.gs?.c || this.context;
        this.currentSessionMPIDs = obj?.gs?.csm || this.currentSessionMPIDs;

        // QUESTION: What is the intention behind this?
        // this.isLoggedIn = obj.l === true;
        this.isLoggedIn = obj?.l || false;

        if (obj?.gs?.les) {
            this.dateLastEventSent = new Date(obj.gs.les);
        }

        // QUESTION: Can we just move this to session start?
        if (obj?.gs?.ssd) {
            this.sessionStartDate = new Date(obj.gs.ssd);
        } else {
            this.sessionStartDate = new Date();
        }

        if (this.mpid) {
            this.persistenceData[this.mpid] = obj;
        }
    };

    this.initializePersistence = () => {
        const persistenceData: Partial<IPersistenceMinified> = {};

        // TODO: should be in defaults
        this.isFirstRun = true;
        this.mpid = null; // QUESTION Should this be null, empty string or 0?

        // Populates "persistence" with defaults
        this.storeDataInMemory(persistenceData as IPersistenceMinified, null);

        // QUESTION: Is this redundant?
        this.updatePersistence();
    };

    // QUESTION: Is this still necessary?
    this.updatePersistence = (): void => {
        const currentUser: MParticleUser =
            mpInstance.Identity?.getCurrentUser();
        const mpid: MPID = currentUser?.getMPID() || null;
        const persistenceData: IPersistenceMinified = this.getPersistence();

        // Moving this up so that we can have a "base" GS
        // Mirrors Set Local Storage
        persistenceData.gs = this.getGlobalStorageAttributes();

        persistenceData.l = this.isLoggedIn;
        if (this.sessionId) {
            // QUESTION: What's the difference between sessionId and "Current Session ID?"
            persistenceData.gs.csm = this.currentSessionMPIDs;
        }
        if (mpid) {
            persistenceData.cu = mpid;
        }

        // TODO: Understand what is really being copied here
        if (!isEmpty(this.nonCurrentUserMPIDs)) {
            console.log('persistenceData', persistenceData);
            console.log(this.nonCurrentUserMPIDs);
        }

        // TODO: Should we "save" this?
        this.storeDataInMemory(persistenceData, mpid);
    };

    this.getPersistence = (): IPersistenceMinified => {
        // TODO: Do we need to create a copy of this data?
        return { ...this.persistenceData };
    };

    this.savePersistence = (persistence: IPersistenceMinified) => {
        // TODO: Should we do a "deep copy"
        this.persistenceData = { ...this.persistenceData, persistence };
    };

    this.getGlobalStorageAttributes = (): IGlobalStoreV2MinifiedKeys => ({
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
        csm: this.currentSessionMPIDs,
    });
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
