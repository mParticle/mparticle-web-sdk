import * as EventsApi from './eventsApiModels';

export interface SDKEvent {
    DeviceId: string;
    IsFirstRun: boolean;
    EventName: string;
    EventCategory: number;
    UserAttributes?: { [key: string]: string | string[] | null };
    UserIdentities?: SDKUserIdentity[];
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
    Location?: { latitude: number | string; longitude: number | string };
    OptOut?: boolean;
    CustomFlags?: { [key: string]: string };
    AppVersion?: string;
    AppName?: string;
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
    Identity: SDKIdentityApi;
    Logger: SDKLoggerApi;
    _Store: SDKStoreApi;
    _Helpers: SDKHelpersApi;
    config: SDKConfig;
    reset(MPConfig: SDKConfig): void;
    init(apiKey: string, config: SDKConfig): void;
    getInstance();
    ServerModel();
}

export interface SDKConfig {
    isDevelopmentMode?: boolean;
    appVersion?: string;
    appName?: string;
    logLevel?: string;
    sessionTimeout?: number;
    useCookieStorage?: boolean;
    cookieDomain?: string;
    workspaceToken: string;
    requiredWebviewBridgeName: string;
    minWebviewBridgeVersion: number;
    isIOS?: boolean;
}

export interface SDKIdentityApi {
    getCurrentUser();
    IdentityAPI;
}

export interface SDKHelpersApi {
    createServiceUrl(arg0: string, arg1: string): void;
    generateUniqueId();
}

export interface SDKLoggerApi {
    error(arg0: string): void;
    verbose(arg0: string): void;
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
}
export interface MParticleUser {
    getMPID(): string;
}

export interface SDKConsentState {
    getGDPRConsentState(): { [key: string]: SDKGDPRConsentState };
    getCCPAConsentState(): { [key: string]: SDKCCPAConsentState };
}

export interface SDKGDPRConsentState {
    Consented: boolean;
    Timestamp?: number;
    ConsentDocument?: string;
    Location?: string;
    HardwareId?: string;
}

export interface SDKCCPAConsentState extends SDKGDPRConsentState {}

export interface SDKUserIdentityChangeData {
    New: Identity;
    Old: Identity;
}

export interface Identity {
    IdentityType: EventsApi.identityType;
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
