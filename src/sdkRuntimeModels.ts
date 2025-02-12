import * as EventsApi from '@mparticle/event-models';
import { DataPlanVersion } from '@mparticle/data-planning-models';
import {
    MPConfiguration,
    MPID,
    SDKEventOptions,
    SDKEventAttrs,
    Callback,
} from '@mparticle/web-sdk';
import { IntegrationAttribute, IntegrationAttributes, IStore, WrapperSDKTypes } from './store';
import Validators from './validators';
import { Dictionary, valueof } from './utils';
import { IKitConfigs } from './configAPIClient';
import { SDKConsentApi, SDKConsentState } from './consent';
import MPSideloadedKit from './sideloadedKit';
import { ISessionManager } from './sessionManager';
import { Kit, MPForwarder } from './forwarders.interfaces';
import {
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
import {
    CommerceEventType,
    EventType,
    IdentityType,
    ProductActionType,
    PromotionActionType,
} from './types';
import { IPixelConfiguration } from './cookieSyncManager';
import _BatchValidator from './mockBatchCreator';
import {  SDKECommerceAPI } from './ecommerce.interfaces';
import { IErrorLogMessage, IMParticleWebSDKInstance, IntegrationDelays } from './mp-instance';
import Constants from './constants';

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
    IntegrationAttributes?: IntegrationAttributes;
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

export interface SDKImpression {
    Name: string;
    Product: SDKProduct;
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

    // https://go.mparticle.com/work/SQDSDKS-4801
    Attributes?: Record<string, unknown> | null;
}

// https://go.mparticle.com/work/SQDSDKS-6949
export interface MParticleWebSDK {
    addForwarder(mockForwarder: MPForwarder): void;
    IdentityType: typeof IdentityType;
    CommerceEventType: typeof CommerceEventType;
    EventType: typeof EventType;
    PromotionType: typeof PromotionActionType;
    ProductActionType: typeof ProductActionType;
    Identity: SDKIdentityApi;
    Logger: SDKLoggerApi;
    Consent: SDKConsentApi;
    _resetForTests(
        MPConfig?: SDKInitConfig,
        keepPersistence?: boolean,
        instance?: IMParticleWebSDKInstance,
    ): void;
    configurePixel(config: IPixelConfiguration): void;
    endSession(): void;
    init(apiKey: string, config: SDKInitConfig, instanceName?: string): void;
    _getActiveForwarders(): MPForwarder[];
    _getIntegrationDelays(): IntegrationDelays;
    _setIntegrationDelay(module: number, shouldDelayIntegration: boolean): void;
    _setWrapperSDKInfo(name: WrapperSDKTypes, version: string): void;
    getAppName(): string;
    getAppVersion(): string;
    getDeviceId(): string;
    setDeviceId(deviceId: string): void;
    getEnvironment(): valueof<typeof Constants.Environment>;
    setSessionAttribute(key: string, value: string): void;
    getVersion(): string;
    upload(): void;
    setLogLevel(logLevel: LogLevelType): void;
    setPosition(lat: number | string, lng: number | string): void;
    startNewSession(): void;
    logEvent(
        eventName: string,
        eventType?: valueof<typeof EventType>,
        attrs?: SDKEventAttrs,
        customFlags?: SDKEventCustomFlags,
        eventOptions?: SDKEventOptions
    ): void;
    logBaseEvent(event: BaseEvent, eventOptions?: SDKEventOptions): void;
    logError(error: IErrorLogMessage, attrs?: SDKEventAttrs): void;
    logLink(selector: string, eventName: string, eventType: valueof<typeof EventType>, eventInfo: SDKEventAttrs): void;
    logForm(selector: string, eventName: string, eventType: valueof<typeof EventType>, eventInfo: SDKEventAttrs): void;
    logPageView(eventName?: string, attrs?: SDKEventAttrs, customFlags?: SDKEventCustomFlags, eventOptions?: SDKEventOptions): void;
    setOptOut(isOptingOut: boolean): void;
    eCommerce: SDKECommerceAPI;
    isInitialized(): boolean;
    ready(f: Function): void;

    // https://go.mparticle.com/work/SQDSDKS-7072
    reset(instance?: IMParticleWebSDKInstance): void;

    setAppName(name: string): void;
    setAppVersion(version: string): void;
    setOptOut(isOptingOut: boolean): void;

    // https://go.mparticle.com/work/SQDSDKS-7063
    startTrackingLocation(callback?: Callback): void;

    stopTrackingLocation(): void;
    generateHash(value: string): string;
    setIntegrationAttribute(integrationModuleId: number, attrs: IntegrationAttribute): void;
    getIntegrationAttributes(integrationModuleId: number): IntegrationAttribute;
}

// https://go.mparticle.com/work/SQDSDKS-4805

// https://go.mparticle.com/work/SQDSDKS-6949
export interface IMParticleInstanceManager extends MParticleWebSDK {
    // https://go.mparticle.com/work/SQDSDKS-5053
    // Private Properties
    _BatchValidator: _BatchValidator;
    _instances: Dictionary<IMParticleWebSDKInstance>;
    _isTestEnv?: boolean;

    // Public Properties
    config: SDKInitConfig;
    isIOS?: boolean;
    MPSideloadedKit: typeof MPSideloadedKit;
    // https://go.mparticle.com/work/SQDSDKS-7060
    sessionManager: Pick<ISessionManager, 'getSession'>; 
    Store: IStore;

    // Public Methods
    getInstance(instanceName?: string): IMParticleWebSDKInstance;
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

    rq?: Function[] | any[];
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
    findKeyInObject?(obj: any, key: string): string;
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
    isEventType?(type: valueof<typeof EventType>): boolean;
    isObject?(item: any);
    invokeCallback?(
        callback: IdentityCallback,
        code: number,
        body: string,
        mParticleUser?: IMParticleUser,
        previousMpid?: MPID
    ): void;
    sanitizeAttributes?(
        attrs: SDKEventAttrs,
        name: string
    ): Dictionary<string> | null;
    Validators: typeof Validators;
}

export interface SDKLoggerApi {
    error(arg0: string): void;
    verbose(arg0: string): void;
    warning(arg0: string): void;
    setLogLevel(logLevel: LogLevelType): void;
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
    data?: SDKEventAttrs;
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
