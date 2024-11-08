import * as EventsApi from '@mparticle/event-models';
import { DataPlanVersion } from '@mparticle/data-planning-models';
import {
    MPConfiguration,
    MPID,
    IdentityApiData,
} from '@mparticle/web-sdk';
import { IStore } from './store';
import Validators from './validators';
import { Dictionary } from './utils';
import { IServerModel } from './serverModel';
import { IKitConfigs } from './configAPIClient';
import { SDKConsentApi, SDKConsentState } from './consent';
import { IPersistence } from './persistence.interfaces';
import { IMPSideloadedKit } from './sideloadedKit';
import { ISessionManager } from './sessionManager';
import { Kit, MPForwarder } from './forwarders.interfaces';
import {
    IIdentity,
    SDKIdentityApi,
    IAliasCallback,
} from './identity.interfaces';
import {
    ISDKUserAttributeChangeData,
    ISDKUserIdentityChanges,
    IMParticleUser,
    ISDKUserIdentity,
    IdentityCallback,
    ISDKUserAttributes,
} from './identity-user-interfaces';
import { IIdentityType } from './types.interfaces';
import IntegrationCapture from './integrationCapture';
import { INativeSdkHelpers } from './nativeSdkHelpers.interfaces';
import { ICookieSyncManager, IPixelConfiguration } from './cookieSyncManager.interfaces';

// TODO: Resolve this with version in @mparticle/web-sdk
export type SDKEventCustomFlags = Dictionary<any>;

export interface SDKEvent {
    DeviceId: string;
    IsFirstRun: boolean;
    EventName: string;
    EventCategory: number;
    UserAttributes?: ISDKUserAttributes;
    UserIdentities?: ISDKUserIdentity[];
    SourceMessageId: string;
    MPID: string;
    EventAttributes?: { [key: string]: string };
    SDKVersion: string;
    SessionId: string;
    SessionStartDate: number;
    SessionLength?: number;
    currentSessionMPIDs?: string[];
    Timestamp: number;
    EventDataType: number;
    Debug: boolean;
    Location?: SDKGeoLocation;
    OptOut?: boolean;
    CustomFlags?: SDKEventCustomFlags;
    AppVersion?: string;
    AppName?: string;
    Package?: string;
    ConsentState?: SDKConsentState;
    IntegrationAttributes?: { [key: string]: { [key: string]: string } };
    ProductAction?: SDKProductAction;
    PromotionAction?: SDKPromotionAction;
    ProductImpressions?: SDKProductImpression[];
    ShoppingCart?: SDKShoppingCart;
    UserIdentityChanges?: ISDKUserIdentityChanges;
    UserAttributeChanges?: ISDKUserAttributeChangeData;
    CurrencyCode: string;
    DataPlan?: SDKDataPlan;
    LaunchReferral?: string;
    ExpandedEventCount: number;
}
export interface SDKGeoLocation {
    lat: number | string;
    lng: number | string;
}

export interface SDKDataPlan {
    PlanVersion?: number | null;
    PlanId?: string | null;
}

export interface SDKShoppingCart {
    ProductList?: SDKProduct[];
}

export interface SDKPromotionAction {
    PromotionActionType: string;
    PromotionList?: SDKPromotion[];
}

export interface SDKPromotion {
    Id?: string;
    Name?: string;
    Creative?: string;
    Position?: string;
}

export interface SDKProductImpression {
    ProductImpressionList?: string;
    ProductList?: SDKProduct[];
}

export enum SDKProductActionType {
    Unknown = 0,
    AddToCart = 1,
    RemoveFromCart = 2,
    Checkout = 3,
    CheckoutOption = 4,
    Click = 5,
    ViewDetail = 6,
    Purchase = 7,
    Refund = 8,
    AddToWishlist = 9,
    RemoveFromWishlist = 10,
}

export interface SDKProductAction {
    ProductActionType: SDKProductActionType;
    CheckoutStep?: number;
    CheckoutOptions?: string;
    ProductList?: SDKProduct[];
    TransactionId?: string;
    Affiliation?: string;
    CouponCode?: string;
    TotalAmount?: number;
    ShippingAmount?: number;
    TaxAmount?: number;
}

export interface SDKProduct {
    Sku?: string;
    Name?: string;
    Price?: number;
    Quantity?: number;
    Brand?: string;
    Variant?: string;
    Category?: string;
    Position?: number;
    CouponCode?: string;
    TotalAmount?: number;
    Attributes?: { [key: string]: string };
}

// Temporary Interfaces for Events Module
interface IEvents {
    logEvent?(event: BaseEvent): void;
}

export interface MParticleWebSDK {
    addForwarder(mockForwarder: MPForwarder): void;
    _IntegrationCapture: IntegrationCapture;
    IdentityType: IIdentityType;
    _Identity: IIdentity;
    Identity: SDKIdentityApi;
    Logger: SDKLoggerApi;
    MPSideloadedKit: IMPSideloadedKit;
    _APIClient: any; // TODO: Set up API Client
    _CookieSyncManager: ICookieSyncManager;
    _Store: IStore;
    _Forwarders: any;
    _Helpers: SDKHelpersApi;
    _Events: IEvents;
    config: SDKInitConfig;
    _ServerModel: IServerModel;
    _SessionManager: ISessionManager;
    _Consent: SDKConsentApi;
    Consent: SDKConsentApi;
    _NativeSdkHelpers: INativeSdkHelpers;
    _Persistence: IPersistence;
    _preInit: any; // TODO: Set up API
    _instances?: Dictionary<MParticleWebSDK>;
    _isTestEnv?: boolean;
    _resetForTests(
        MPConfig?: SDKInitConfig,
        keepPersistence?: boolean,
        instance?: MParticleWebSDK
    ): void;
    endSession(): void;
    identifyRequest: IdentityApiData;
    init(apiKey: string, config: SDKInitConfig, instanceName?: string): void;
    _getActiveForwarders(): MPForwarder[];
    getAppName(): string;
    getAppVersion(): string;
    getDeviceId(): string;
    setDeviceId(deviceId: string): void;
    setSessionAttribute(key: string, value: string): void;
    getInstance(): MParticleWebSDK; // TODO: Create a new type for MParticleWebSDKInstance
    ServerModel();
    upload();
    setLogLevel(logLevel: LogLevelType): void;
    setPosition(lat: number | string, lng: number | string): void;
    startNewSession(): void;
    logEvent(
        eventName: string,
        eventType?: number,
        attrs?: { [key: string]: string },
        customFlags?: SDKEventCustomFlags
    ): void;
    logBaseEvent(event: any): void;
    eCommerce: any;
    logLevel: string;
    ProductActionType: SDKProductActionType;
    generateHash(value: string): string;
    isIOS?: boolean;
}

// Used in cases where server requires booleans as strings
export type BooleanStringLowerCase = 'false' | 'true';
export type BooleanStringTitleCase = 'False' | 'True';

export type LogLevelType = 'none' | 'verbose' | 'warning' | 'error';

// TODO: This should eventually be moved into wherever init logic lives
// TODO: Replace/Merge this with MPConfiguration in @types/mparticle__web-sdk
// SDK Init Config represents the config that is passed into mParticle.init when
// the sdk is initialized.
// Currently, this extends MPConfiguration in @types/mparticle__web-sdk
// and the two will be merged in once the Store module is refactored
export interface SDKInitConfig
    extends Omit<MPConfiguration, 'dataPlan' | 'logLevel'> {
    dataPlan?: DataPlanConfig | KitBlockerDataPlan; // TODO: These should be eventually split into two different attributes
    logLevel?: LogLevelType;

    kitConfigs?: IKitConfigs[];
    kits?: Dictionary<Kit>;
    sideloadedKits?: MPForwarder[];
    dataPlanOptions?: KitBlockerOptions;
    flags?: Dictionary;
    pixelConfigs?: IPixelConfiguration[];

    aliasMaxWindow?: number;
    deviceId?: string;
    forceHttps?: boolean;
    aliasUrl?: string;
    configUrl?: string;
    identityUrl?: string;
    integrationDelayTimeout?: number;
    isIOS?: boolean;
    maxProducts?: number;
    requestConfig?: boolean;
    sessionTimeout?: number;
    useNativeSdk?: boolean;
    useCookieStorage?: boolean;
    v1SecureServiceUrl?: string;
    v2SecureServiceUrl?: string;
    v3SecureServiceUrl?: string;

    workspaceToken?: string;
    isDevelopmentMode?: boolean;

    // https://go.mparticle.com/work/SQDSDKS-6460
    identityCallback?: IdentityCallback;
}

export interface DataPlanConfig {
    planId?: string;
    planVersion?: number;
    document?: DataPlanResult; // when the data plan comes from the server via /mparticle.js
}

export interface SDKHelpersApi {
    canLog?(): boolean;
    createMainStorageName?(workspaceToken: string): string;
    createProductStorageName?(workspaceToken: string): string;
    createServiceUrl(url: string, devToken?: string): string;
    createXHR?(cb: () => void): XMLHttpRequest;
    extend?(...args: any[]);
    parseNumber?(value: string | number): number;
    generateUniqueId();
    generateHash?(value: string): string;
    // https://go.mparticle.com/work/SQDSDKS-6317
    getFeatureFlag?(feature: string): boolean | string; // TODO: Feature Constants should be converted to enum
    invokeAliasCallback(
        aliasCallback: IAliasCallback,
        number: number,
        errorMessage: string
    ): void;
    isDelayedByIntegration?(
        delayedIntegrations: Dictionary<boolean>,
        timeoutStart: number,
        now: number
    ): boolean;
    isObject?(item: any);
    invokeCallback?(
        callback: IdentityCallback,
        code: number,
        body: string,
        mParticleUser?: IMParticleUser,
        previousMpid?: MPID
    ): void;
    sanitizeAttributes?(
        attrs: Dictionary<string>,
        name: string
    ): Dictionary<string> | null;
    Validators: typeof Validators;
}

export interface SDKLoggerApi {
    error(arg0: string): void;
    verbose(arg0: string): void;
    warning(arg0: string): void;
}

// TODO: Merge this with IStore in store.ts
export interface SDKStoreApi {
    isEnabled: boolean;
    isFirstRun: boolean;
    devToken: string;
    SDKConfig: SDKConfigApi;
    sessionId?: string;
    deviceId?: string;
}

export interface SDKConfigApi {
    v3SecureServiceUrl?: string;
    isDevelopmentMode: boolean;
    appVersion?: string;
    onCreateBatch(batch: EventsApi.Batch): EventsApi.Batch;
}

export interface BaseEvent {
    messageType: number;
    name?: string;
    eventType?: number;
    data?: { [key: string]: string };
    customFlags?: { [key: string]: string };
    toEventAPIObject?(): SDKEvent;
    sourceMessageId?: string;
    userAttributeChanges?: ISDKUserAttributeChangeData;
    userIdentityChanges?: ISDKUserIdentityChanges;
}

export interface KitBlockerOptions {
    dataPlanVersion: DataPlanVersion;
    blockUserAttributes: boolean;
    blockEventAttributes: boolean;
    blockEvents: boolean;
    blockUserIdentities: boolean;
}

export interface KitBlockerDataPlan {
    document: DataPlanResult;
}

export interface DataPlanResult {
    dtpn?: {
        vers: DataPlanVersion;
        blok: {
            ev: boolean;
            ea: boolean;
            ua: boolean;
            id: boolean;
        };
    };
    error_message?: string;
}
