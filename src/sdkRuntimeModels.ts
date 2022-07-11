import * as EventsApi from '@mparticle/event-models';
import { DataPlanVersion } from '@mparticle/data-planning-models';
import Validators from './validators';

export interface SDKEvent {
    DeviceId: string;
    IsFirstRun: boolean;
    EventName: string;
    EventCategory: number;
    UserAttributes?: { [key: string]: string | string[] | null };
    UserIdentities?: SDKUserIdentity[];
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
    CustomFlags?: { [key: string]: string };
    AppVersion?: string;
    AppName?: string;
    Package?: string;
    ConsentState?: SDKConsentState;
    IntegrationAttributes?: { [key: string]: { [key: string]: string } };
    ProductAction?: SDKProductAction;
    PromotionAction?: SDKPromotionAction;
    ProductImpressions?: SDKProductImpression[];
    ShoppingCart?: SDKShoppingCart;
    UserIdentityChanges?: SDKUserIdentityChangeData;
    UserAttributeChanges?: SDKUserAttributeChangeData;
    CurrencyCode: string;
    DataPlan?: SDKDataPlan;
    LaunchReferral?: string;
}

export interface SDKGeoLocation {
    lat: number | string;
    lng: number | string;
}

export interface SDKDataPlan {
    PlanVersion?: number | null;
    PlanId?: string | null;
}

export interface SDKUserIdentity {
    Identity?: string;
    Type: number;
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

export interface MParticleWebSDK {
    addForwarder(mockForwarder: any);
    Identity: SDKIdentityApi;
    Logger: SDKLoggerApi;
    _Store: SDKStoreApi;
    _Helpers: SDKHelpersApi;
    config: SDKConfig;
    _resetForTests(MPConfig: SDKConfig): void;
    init(apiKey: string, config: SDKConfig): void;
    getInstance();
    ServerModel();
    upload();
    setPosition(lat: number | string, lng: number | string): void;
    logEvent(eventName: string, eventType?: number, attrs?: { [key: string]: string }): void;
    logBaseEvent(event: any): void;
    eCommerce: any;
    logLevel: string;
    ProductActionType: SDKProductActionType;
    generateHash(value: string);
    isIOS?: boolean;
}

// TODO: Export this to a better location
export interface SDKConfig {
    isDevelopmentMode?: boolean;
    logger: {
        error?(msg);
        warning?(msg) 
        verbose?(msg) 
    };
    onCreateBatch(batch: EventsApi.Batch): EventsApi.Batch;
    customFlags?: Record<string, string>;
    dataPlan: SDKDataPlan;
    appVersion?: string;
    package?: string;
    flags?: { [key: string]: string | number | false };
    forceHttps?: boolean;
    kitConfigs: any; // FIXME: What type is this?
    kits?: Record<string, any>; // FIXME: Create a Kits Type
    appName?: string;
    aliasMaxWindow: number;
    logLevel?: LogLevelType;
    maxCookieSize: number;
    maxProducts: number;
    sessionTimeout?: number;
    useCookieStorage?: boolean;
    cookieDomain?: string;
    workspaceToken: string;
    requiredWebviewBridgeName: string;
    minWebviewBridgeVersion: number;
    isIOS?: boolean;
    identifyRequest: { [key: string]: { [key: string]: string } }; // FIXME: Should this be a function or record?
    identityCallback: (result) => void;
    integrationDelayTimeout: number;
    requestConfig: boolean;
    dataPlanOptions: KitBlockerOptions; // when the user provides their own data plan
    dataPlanResult?: DataPlanResult; // when the data plan comes from the server via /config
    aliasUrl?: string;
    configUrl?: string;
    identityUrl?: string;
    useNativeSdk?: boolean;
    v1SecureServiceUrl?: string;
    v2SecureServiceUrl?: string;
    v3SecureServiceUrl?: string;
}

export type LogLevelType = 'none' | 'verbose' | 'warning' | 'error';

// FIXME: Monkey patched SDK Config Interface
// export type SDKInitConfig = SDKConfig;
export interface SDKInitConfig {
    aliasMaxWindow: number;
    appName?: string;
    appVersion?: string;
    customFlags?: Record<string, string>;
    dataPlan?: DataPlanConfig;
    dataPlanOptions?: KitBlockerOptions;
    deviceId?: string;
    forceHttps?: boolean;
    isDevelopmentMode?: boolean;
    aliasUrl?: string;
    configUrl?: string;
    identifyRequest: { [key: string]: { [key: string]: string } }; // FIXME: Should this be a function or record?
    identityCallback: (result) => void;
    identityUrl?: string;
    integrationDelayTimeout: number;
    isIOS?: boolean;
    kits?: Record<string, any>; // FIXME: Create a Kits Type
    logLevel?: LogLevelType;
    maxCookieSize: number;
    maxProducts: number;
    minWebviewBridgeVersion: number;
    package?: string;
    sessionTimeout?: number;
    useNativeSdk?: boolean;
    useCookieStorage?: boolean;
    v1SecureServiceUrl?: string;
    v2SecureServiceUrl?: string;
    v3SecureServiceUrl?: string;

    onCreateBatch(batch: EventsApi.Batch): EventsApi.Batch;
}

export interface DataPlanConfig {
    planId?: string;
    planVersion?: number;
    document?: DataPlanResult  // when the data plan comes from the server via /mparticle.js
}

export interface SDKIdentityApi {
    getCurrentUser();
    IdentityAPI;
    identify;
    login;
    logout;
    modify;
}

export interface SDKHelpersApi {
    createServiceUrl(arg0: string, arg1: string): void;
    parseNumber(value: number);
    generateUniqueId();
    isFunction(fn: any): boolean;
    isObject(item: any): boolean;
    isSlug(str: string): string;
    returnConvertedBoolean(data: string | boolean | number): boolean;
    Validators: typeof Validators;
}

export interface SDKLoggerApi {
    error(arg0: string): void;
    verbose(arg0: string): void;
    warning(arg0: string): void;
}

export interface SDKStoreApi {
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
    onCreateBatch(batch: EventsApi.Batch): EventsApi.Batch
}
export interface MParticleUser {
    getMPID(): string;
}

export interface SDKConsentState {
    getGDPRConsentState(): SDKGDPRConsentState;
    getCCPAConsentState(): SDKCCPAConsentState;
}

export interface SDKGDPRConsentState {
    [key: string]: SDKConsentStateData;
}

export interface SDKConsentStateData {
    Consented: boolean;
    Timestamp?: number;
    ConsentDocument?: string;
    Location?: string;
    HardwareId?: string;
}

export interface SDKCCPAConsentState extends SDKConsentStateData {}

export interface SDKUserIdentityChangeData {
    New: Identity;
    Old: Identity;
}

export interface Identity {
    IdentityType: SDKIdentityTypeEnum;
    Identity: string;
    Timestamp: number;
    CreatedThisBatch: boolean;
}

export interface SDKUserAttributeChangeData {
    UserAttributeName: string;
    New: string;
    Old: string;
    Deleted: boolean;
    IsNewAttribute: boolean;
}

export interface BaseEvent {
    messageType: number;
    name: string;
    eventType?: number;
    data?: { [key: string]: string };
    customFlags?: { [key: string]: string };
}

// TODO: Should this be renamed to DataPlanOptions?
export interface KitBlockerOptions {
    dataPlanVersion: DataPlanVersion;
    blockUserAttributes: boolean;
    blockEventAttributes: boolean;
    blockEvents: boolean;
    blockUserIdentities: boolean;
}

export interface KitBlockerDataPlan {
    document: DataPlanResult
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
    error_message?: string
}

export enum SDKIdentityTypeEnum {
    other = "other",
    customerId = "customerid",
    facebook = "facebook",
    twitter = "twitter",
    google = "google",
    microsoft = "microsoft",
    yahoo = "yahoo",
    email = "email",
    alias = "alias",
    facebookCustomAudienceId = "facebookcustomaudienceid",
    otherId2 = "other2",
    otherId3 = "other3",
    otherId4 = "other4",
    otherId5 = "other5",
    otherId6 = "other6",
    otherId7 = "other7",
    otherId8 = "other8",
    otherId9 = "other9",
    otherId10 = "other10",
    mobileNumber = "mobile_number",
    phoneNumber2 = "phone_number_2",
    phoneNumber3 = "phone_number_3"
}