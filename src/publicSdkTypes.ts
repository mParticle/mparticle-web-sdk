import { Batch } from '@mparticle/event-models';

export type Dictionary<V = any> = Record<string, V>;

export type MPID = string;

export type SDKEventAttrTypes = string | number | boolean | null | undefined;

export interface SDKEventAttrs {
    [key: string]: SDKEventAttrTypes;
}

export interface SDKEventCustomFlags {
    [key: string]:
        | number
        | string
        | boolean
        | unknown[]
        | Record<string, unknown>;
}

export interface SDKEventOptions {
    shouldUploadEvent?: boolean;
    sourceMessageId?: string;
}

export interface Logger {
    error?: (error: string) => void;
    warning?: (warning: string) => void;
    verbose?: (message: string) => void;
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

export interface DataPlanVersion {
    version?: number;
    data_plan_id?: string;
    last_modified_on?: string;
    version_document?: Dictionary;
}

export interface DataPlanConfig {
    planId?: string;
    planVersion?: number;
    document?: DataPlanResult;
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

export type MPForwarder = Dictionary;

export type OnUserAlias = (previousUser: User, newUser: User) => void;

export interface IdentityApiData {
    userIdentities?: UserIdentities | null;
    onUserAlias?: OnUserAlias | null;
    copyUserAttributes?: boolean;
}

export interface IdentifyRequest extends IdentityApiData {
    userIdentities: UserIdentities;
}

export type UserIdentityValue = string | null;

export interface UserIdentities {
    customerid?: UserIdentityValue;
    email?: UserIdentityValue;
    other?: UserIdentityValue;
    other2?: UserIdentityValue;
    other3?: UserIdentityValue;
    other4?: UserIdentityValue;
    other5?: UserIdentityValue;
    other6?: UserIdentityValue;
    other7?: UserIdentityValue;
    other8?: UserIdentityValue;
    other9?: UserIdentityValue;
    other10?: UserIdentityValue;
    mobile_number?: UserIdentityValue;
    phone_number_2?: UserIdentityValue;
    phone_number_3?: UserIdentityValue;
    facebook?: UserIdentityValue;
    facebookcustomaudienceid?: UserIdentityValue;
    google?: UserIdentityValue;
    twitter?: UserIdentityValue;
    microsoft?: UserIdentityValue;
    yahoo?: UserIdentityValue;
    email_sha256?: UserIdentityValue;
    mobile_sha256?: UserIdentityValue;
}

export type UserAttributesValue = string | number | boolean | null;

export type AllUserAttributes = Record<
    string,
    UserAttributesValue | UserAttributesValue[]
>;

export interface PrivacyConsentState {
    Consented: boolean;
    Timestamp?: number;
    ConsentDocument?: string;
    Location?: string;
    HardwareId?: string;
}

export interface GDPRConsentState {
    [key: string]: PrivacyConsentState;
}

export type CCPAConsentState = PrivacyConsentState;

export interface ConsentState {
    setGDPRConsentState(gdprConsentState: GDPRConsentState): ConsentState;
    setCCPAConsentState(ccpaConsentState: CCPAConsentState): ConsentState;
    addGDPRConsentState(
        purpose: string,
        gdprConsent: PrivacyConsentState
    ): ConsentState;
    getGDPRConsentState(): GDPRConsentState;
    getCCPAConsentState(): CCPAConsentState;
    removeGDPRConsentState(purpose: string): ConsentState;
    removeCCPAConsentState(): ConsentState;
    removeCCPAState(): ConsentState;
}

export interface Product {
    Name: string;
    Sku: string;
    Price: number;
    Quantity?: number;
    Variant?: string;
    Category?: string;
    Brand?: string;
    Position?: number;
    Coupon?: string;
    CouponCode?: string;
    TotalAmount?: number;
    Attributes?: Record<string, unknown>;
}

export interface TransactionAttributes {
    Id: string | number;
    Affiliation?: string;
    CouponCode?: string;
    Revenue?: string | number;
    Shipping?: string | number;
    Tax?: number;
}

export interface Impression {
    Name: string;
    Product: Product | Product[];
}

export interface Promotion {
    Id: string | number;
    Creative?: string;
    Name?: string;
    Position?: string | number;
}

export interface Cart {
    /**
     * @deprecated Cart persistence in mParticle has been deprecated.
     */
    add(product: Product | Product[], logEventBoolean?: boolean): void;
    /**
     * @deprecated Cart persistence in mParticle has been deprecated.
     */
    remove(product: Product | Product[], logEventBoolean?: boolean): void;
    /**
     * @deprecated Cart persistence in mParticle has been deprecated.
     */
    clear(): void;
}

export interface User {
    getUserIdentities(): IdentifyRequest;
    getMPID(): MPID;
    setUserTag(tag: string, value?: any): void;
    removeUserTag(tag: string): void;
    setUserAttribute(
        key: string,
        value: UserAttributesValue | UserAttributesValue[] | unknown
    ): void;
    setUserAttributes(attributeObject: Record<string, unknown>): void;
    removeUserAttribute(key: string): void;
    setUserAttributeList(key: string, value: UserAttributesValue[]): void;
    removeAllUserAttributes(): void;
    getUserAttributesLists(): Record<string, UserAttributesValue[]>;
    getAllUserAttributes(): AllUserAttributes;
    /**
     * @deprecated Cart persistence in mParticle has been deprecated.
     */
    getCart(): Cart;
    getConsentState(): ConsentState;
    setConsentState(consentState: ConsentState): void;
    isLoggedIn(): boolean;
    getLastSeenTime(): number;
    getFirstSeenTime(): number;
    getUserAudiences?(callback?: IdentityCallback): void;
}

export interface IdentityResultBody {
    context: string | null;
    is_ephemeral: boolean;
    is_logged_in: boolean;
    matched_identities: Record<string, unknown>;
    mpid?: MPID;
}

export interface IdentityModifyResultBody {
    change_results?: {
        identity_type: string;
        modified_mpid: MPID;
    };
}

export interface IdentityResult {
    httpCode: number;
    getPreviousUser(): User;
    getUser(): User;
    body: IdentityResultBody | IdentityModifyResultBody;
}

export interface IdentityCallback {
    (result: IdentityResult): void;
}

export type AliasRequestScope = 'device' | 'mpid';

export interface UserAliasRequest {
    destinationMpid: MPID;
    sourceMpid: MPID;
    startTime: number;
    endTime: number;
    scope?: AliasRequestScope;
}

export interface AliasUsersCallback {
    (result: { httpCode: number; message: string }): void;
}

export interface Callback {
    (): void;
}

export interface Location {
    coords: {
        latitude: number;
        longitude: number;
    };
    timestamp: number;
}

export interface TrackLocationCallback {
    (location: Location): void;
}

export interface OnCreateBatch {
    (batch: Batch): Batch;
}

export type onCreateBatch = OnCreateBatch;

export type LogLevel = 'verbose' | 'warning' | 'error' | 'none';

export interface LauncherOptions {
    noTargeting?: boolean;
    noFunctional?: boolean;
    [key: string]: unknown;
}

export interface MPConfiguration {
    isDevelopmentMode?: boolean;
    identifyRequest?: IdentityApiData;
    identityCallback?: IdentityCallback;
    dataPlan?: DataPlanConfig;
    appVersion?: string;
    appName?: string;
    package?: string;
    logLevel?: LogLevel;
    logger?: Logger;
    sessionTimeout?: number;
    deviceId?: string;
    onCreateBatch?: OnCreateBatch;
    useCookieStorage?: boolean;
    maxCookieSize?: number;
    cookieDomain?: string;
    customFlags?: SDKEventCustomFlags;
    sideloadedKits?: MPForwarder[];
    workspaceToken?: string;
    requiredWebviewBridgeName?: string;
    minWebviewBridgeVersion?: 1 | 2;
    aliasUrl?: string;
    configUrl?: string;
    forceHttps?: boolean;
    identityUrl?: string;
    integrationDelayTimeout?: number;
    isIOS?: boolean;
    maxProducts?: number;
    requestConfig?: boolean;
    useNativeSdk?: boolean;
    v1SecureServiceUrl?: string;
    v2SecureServiceUrl?: string;
    v3SecureServiceUrl?: string;
    domain?: string;
    launcherOptions?: LauncherOptions;
}
