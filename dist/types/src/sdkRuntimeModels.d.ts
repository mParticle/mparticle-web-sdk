import * as EventsApi from '@mparticle/event-models';
import { DataPlanConfig, KitBlockerDataPlan, KitBlockerOptions, MPConfiguration, MPID, SDKEventAttrs, SDKEventOptions, TrackLocationCallback } from './publicSdkTypes';
import { IntegrationAttribute, IntegrationAttributes, IStore, WrapperSDKTypes } from './store';
import Validators from './validators';
import { AttributeValue, Dictionary, Environment, valueof } from './utils';
import { IKitConfigs } from './configAPIClient';
import { SDKConsentApi, SDKConsentState } from './consent';
import MPSideloadedKit from './sideloadedKit';
import { ISessionManager } from './sessionManager';
import { ConfiguredKit, MPForwarder, UnregisteredKit } from './forwarders.interfaces';
import { SDKIdentityApi, IAliasCallback } from './identity.interfaces';
import { ISDKUserAttributeChangeData, ISDKUserIdentityChanges, IMParticleUser, ISDKUserIdentity, IdentityCallback, ISDKUserAttributes } from './identity-user-interfaces';
import { CommerceEventType, EventType, IdentityType, ProductActionType, PromotionActionType } from './types';
import { IPixelConfiguration } from './cookieSyncManager';
import _BatchValidator from './mockBatchCreator';
import { SDKECommerceAPI } from './ecommerce.interfaces';
import { IErrorLogMessage, IMParticleWebSDKInstance, IntegrationDelays } from './mp-instance';
import RoktManager, { IRoktLauncherOptions } from './roktManager';
import { IConsoleLogger } from './logger';
import { ErrorCodes, IErrorReportingService, ILoggingService } from './reporting/types';
export type { DataPlanConfig, DataPlanResult, KitBlockerDataPlan, KitBlockerOptions, } from './publicSdkTypes';
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
    EventAttributes?: {
        [key: string]: string;
    };
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
    ActiveTimeOnSite: number;
    IsBackgroundAST?: boolean;
    AlreadySentToForwarders?: boolean;
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
    Id: string | number;
    Name?: string;
    Creative?: string;
    Position?: string | number;
}
export interface SDKImpression {
    Name: string;
    Product: SDKProduct | SDKProduct[];
}
export interface SDKProductImpression {
    ProductImpressionList?: string;
    ProductList?: SDKProduct[];
}
export declare enum SDKProductActionType {
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
    RemoveFromWishlist = 10
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
    Sku: string;
    Name: string;
    Price: number;
    Quantity?: number;
    Brand?: string;
    Variant?: string;
    Category?: string;
    Position?: number;
    CouponCode?: string;
    TotalAmount?: number;
    Attributes?: Record<string, unknown>;
}
export interface MParticleWebSDK {
    addForwarder(forwarder: UnregisteredKit): void;
    IdentityType: typeof IdentityType;
    CommerceEventType: typeof CommerceEventType;
    EventType: typeof EventType;
    PromotionType: typeof PromotionActionType;
    ProductActionType: typeof ProductActionType;
    Identity: SDKIdentityApi;
    Logger: SDKLoggerApi;
    Consent: SDKConsentApi;
    _resetForTests(MPConfig?: SDKInitConfig, keepPersistence?: boolean, instance?: IMParticleWebSDKInstance): void;
    configurePixel(config: IPixelConfiguration): void;
    endSession(): void;
    init(apiKey: string, config: SDKInitConfig, instanceName?: string): void;
    _getActiveForwarders(): ConfiguredKit[];
    _getIntegrationDelays(): IntegrationDelays;
    _setIntegrationDelay(module: number, shouldDelayIntegration: boolean): void;
    _setWrapperSDKInfo(name: WrapperSDKTypes, version: string): void;
    getAppName(): string;
    getAppVersion(): string;
    getDeviceId(): string;
    setDeviceId(deviceId: string): void;
    getEnvironment(): Environment;
    setSessionAttribute(key: string, value: AttributeValue): void;
    getVersion(): string;
    upload(): void;
    setLogLevel(logLevel: LogLevelType): void;
    setPosition(lat: number | string, lng: number | string): void;
    startNewSession(): void;
    logEvent(eventName: string, eventType?: valueof<typeof EventType>, attrs?: SDKEventAttrs, customFlags?: SDKEventCustomFlags, eventOptions?: SDKEventOptions): void;
    logBaseEvent(event: BaseEvent, eventOptions?: SDKEventOptions): void;
    logError(error: IErrorLogMessage, attrs?: SDKEventAttrs): void;
    logError(error: string, attrs?: SDKEventAttrs): void;
    logLink(selector: string, eventName: string, eventType?: valueof<typeof EventType>, eventInfo?: SDKEventAttrs): void;
    logForm(selector: string, eventName: string, eventType?: valueof<typeof EventType>, eventInfo?: SDKEventAttrs): void;
    logPageView(eventName?: string, attrs?: SDKEventAttrs, customFlags?: SDKEventCustomFlags, eventOptions?: SDKEventOptions): void;
    setOptOut(isOptingOut: boolean): void;
    eCommerce: SDKECommerceAPI;
    isInitialized(): boolean;
    ready(f: Function): void;
    reset(instance?: IMParticleWebSDKInstance): void;
    setAppName(name: string): void;
    setAppVersion(version: string): void;
    setOptOut(isOptingOut: boolean): void;
    startTrackingLocation(callback?: TrackLocationCallback): void;
    stopTrackingLocation(): void;
    generateHash(value: string): number;
    setIntegrationAttribute(integrationModuleId: number, attrs: IntegrationAttribute): void;
    getIntegrationAttributes(integrationModuleId: number): IntegrationAttribute;
    captureTiming(metricName: string): void;
    _registerErrorReportingService(service: IErrorReportingService): void;
    _registerLoggingService(service: ILoggingService): void;
}
export interface MParticleWebSDKInstance extends MParticleWebSDK {
}
export interface MParticleWebSDKManager extends MParticleWebSDK {
    config: SDKInitConfig;
    isIOS?: boolean;
    MPSideloadedKit: typeof MPSideloadedKit;
    Rokt: RoktManager;
    sessionManager: Pick<ISessionManager, 'getSession'>;
    Store: IStore;
    getInstance(): MParticleWebSDKInstance;
    getInstance(instanceName: string): MParticleWebSDKInstance | null;
}
export interface IMParticleInstanceManager extends MParticleWebSDKManager {
    _BatchValidator: _BatchValidator;
    _instances: Dictionary<IMParticleWebSDKInstance>;
    _isTestEnv?: boolean;
    config: SDKInitConfig;
    isIOS?: boolean;
    MPSideloadedKit: typeof MPSideloadedKit;
    Rokt: RoktManager;
    sessionManager: Pick<ISessionManager, 'getSession'>;
    Store: IStore;
    getInstance(): IMParticleWebSDKInstance;
    getInstance(instanceName: string): IMParticleWebSDKInstance | null;
}
export type BooleanStringLowerCase = 'false' | 'true';
export type BooleanStringTitleCase = 'False' | 'True';
export type LogLevelType = (typeof LogLevelType)[keyof typeof LogLevelType];
export declare const LogLevelType: {
    readonly None: "none";
    readonly Verbose: "verbose";
    readonly Warning: "warning";
    readonly Error: "error";
};
export interface SDKInitConfig extends Omit<MPConfiguration, 'dataPlan' | 'logLevel' | 'identityCallback'> {
    dataPlan?: DataPlanConfig | KitBlockerDataPlan;
    logLevel?: LogLevelType;
    kitConfigs?: IKitConfigs[];
    kits?: Dictionary<UnregisteredKit>;
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
    domain?: string;
    workspaceToken?: string;
    isDevelopmentMode?: boolean;
    identityCallback?: IdentityCallback;
    launcherOptions?: IRoktLauncherOptions;
    isLoggingEnabled?: boolean;
    rq?: Function[] | any[];
    logger?: IConsoleLogger;
}
export interface SDKHelpersApi {
    canLog?(): boolean;
    createMainStorageName?(workspaceToken: string): string;
    createServiceUrl(url: string, devToken?: string): string;
    createXHR?(cb: () => void): XMLHttpRequest;
    extend?(...args: any[]): any;
    findKeyInObject?(obj: any, key: string): string;
    parseNumber?(value: string | number): number;
    generateUniqueId(): any;
    generateHash?(value: string): number;
    getFeatureFlag?(feature: string): boolean | string;
    invokeAliasCallback(aliasCallback: IAliasCallback, number: number, errorMessage: string): void;
    isDelayedByIntegration?(delayedIntegrations: Dictionary<boolean>, timeoutStart: number, now: number): boolean;
    isEventType?(type: valueof<typeof EventType>): boolean;
    isObject?(item: any): any;
    invokeCallback?(callback: IdentityCallback, code: number, body: string, mParticleUser?: IMParticleUser, previousMpid?: MPID): void;
    sanitizeAttributes?(attrs: SDKEventAttrs, name: string): Dictionary | null;
    Validators: typeof Validators;
}
export interface SDKLoggerApi {
    error(msg: string, code?: ErrorCodes): void;
    verbose(msg: string): void;
    warning(msg: string): void;
    isVerbose(): boolean;
    setLogLevel(logLevel: LogLevelType): void;
}
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
    customFlags?: {
        [key: string]: string;
    };
    toEventAPIObject?(): SDKEvent;
    sourceMessageId?: string;
    userAttributeChanges?: ISDKUserAttributeChangeData;
    userIdentityChanges?: ISDKUserIdentityChanges;
}
