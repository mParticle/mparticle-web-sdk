import * as EventsApi from '@mparticle/event-models';
import { Batch } from '@mparticle/event-models';
import { DataPlanVersion, DataPlan } from '@mparticle/data-planning-models';
import { MPConfiguration, IdentityApiData } from '@mparticle/web-sdk';
import { IStore, SDKConfig } from './store';
import Validators from './validators';
import { Dictionary } from './utils';
import { IServerModel } from './serverModel';


// TODO: Resolve this with version in @mparticle/web-sdk
export type SDKEventCustomFlags = Dictionary<any>;

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
    addForwarder(mockForwarder: MPForwarder): void;
    Identity: SDKIdentityApi;
    Logger: SDKLoggerApi;
    _APIClient: any; // TODO: Set up API Client
    _Store: IStore;
    _Helpers: SDKHelpersApi;
    config: SDKInitConfig;
    _ServerModel: IServerModel;
    _SessionManager: any; // TODO: Set up Session Manager
    _Consent: any; // TODO: Set up Consent SDK
    _resetForTests(MPConfig?: SDKConfig): void;
    init(apiKey: string, config: SDKInitConfig, instanceName?: string): void;
    getAppName(): string;
    getAppVersion(): string;
    getInstance(): MParticleWebSDK; // TODO: Create a new type for MParticleWebSDKInstance
    ServerModel();
    upload();
    setPosition(lat: number | string, lng: number | string): void;
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
    generateHash(value: string);
    isIOS?: boolean;
}

export type LogLevelType = 'none' | 'verbose' | 'warning' | 'error';

// TODO: Create true types for Kits and Kit Configs
export type KitConfigs = Dictionary;
export type Kit = Dictionary;
export type MPForwarder = Dictionary;

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

    kitConfigs?: KitConfigs[];
    kits?: Dictionary<Kit>;
    dataPlanOptions?: KitBlockerOptions;
    flags?: Dictionary;

    aliasMaxWindow: number;
    deviceId?: string;
    forceHttps?: boolean;
    aliasUrl?: string;
    configUrl?: string;
    identityUrl?: string;
    integrationDelayTimeout: number;
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

export interface DataPlanConfig {
    planId?: string;
    planVersion?: number;
    document?: DataPlanResult; // when the data plan comes from the server via /mparticle.js
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
    extend(...args: any[]);
    parseNumber(value: string | number): number;
    generateUniqueId();
    isObject(item: any);
    returnConvertedBoolean(data: string | boolean | number): boolean;
    sanitizeAttributes(attrs: Dictionary<string>, name: string): Dictionary<string> | null;
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
export interface MParticleUser {
    getMPID(): string;
    getConsentState(): any; // FIXME:
    getAllUserAttributes(): any; // FIXME;
    getUserIdentities(): IdentityApiData; // FIXME: Is this correct?
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
    toEventAPIObject?(): SDKEvent;
    sourceMessageId?: string;
    userAttributeChanges?: SDKUserAttributeChangeData;
    userIdentityChanges?: SDKUserIdentityChangeData;
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

export enum SDKIdentityTypeEnum {
    other = 'other',
    customerId = 'customerid',
    facebook = 'facebook',
    twitter = 'twitter',
    google = 'google',
    microsoft = 'microsoft',
    yahoo = 'yahoo',
    email = 'email',
    alias = 'alias',
    facebookCustomAudienceId = 'facebookcustomaudienceid',
    otherId2 = 'other2',
    otherId3 = 'other3',
    otherId4 = 'other4',
    otherId5 = 'other5',
    otherId6 = 'other6',
    otherId7 = 'other7',
    otherId8 = 'other8',
    otherId9 = 'other9',
    otherId10 = 'other10',
    mobileNumber = 'mobile_number',
    phoneNumber2 = 'phone_number_2',
    phoneNumber3 = 'phone_number_3',
}
