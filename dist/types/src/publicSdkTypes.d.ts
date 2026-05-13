import { Batch } from '@mparticle/event-models';
import { DataPlanVersion } from '@mparticle/data-planning-models';
export type Dictionary<V = any> = Record<string, V>;
export type MPID = string;
export type SDKEventAttrTypes = string | number | boolean | null | undefined;
export interface SDKEventAttrs {
    [key: string]: SDKEventAttrTypes;
}
export interface SDKEventCustomFlags {
    [key: string]: number | string | boolean | unknown[] | Record<string, unknown>;
}
export interface SDKEventOptions {
    shouldUploadEvent?: boolean;
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
export interface IdentityApiData {
    userIdentities?: UserIdentities;
    onUserAlias?: string;
    copyUserAttributes?: boolean;
}
export interface IdentifyRequest extends IdentityApiData {
    userIdentities: UserIdentities;
}
export interface UserIdentities {
    customerid?: string;
    email?: string;
    other?: string;
    other2?: string;
    other3?: string;
    other4?: string;
    other5?: string;
    other6?: string;
    other7?: string;
    other8?: string;
    other9?: string;
    other10?: string;
    mobile_number?: string;
    phone_number_2?: string;
    phone_number_3?: string;
    facebook?: string;
    facebookcustomaudienceid?: string;
    google?: string;
    twitter?: string;
    microsoft?: string;
    yahoo?: string;
}
export type UserAttributesValue = string | number | boolean | null;
export type AllUserAttributes = Record<string, UserAttributesValue | UserAttributesValue[]>;
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
    addGDPRConsentState(purpose: string, gdprConsent: PrivacyConsentState): ConsentState;
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
    Product: Product;
}
export interface Promotion {
    Id: string;
    Creative?: string;
    Name?: string;
    Position?: string;
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
    getUserIdentities(): IdentityApiData;
    getMPID(): MPID;
    setUserTag(tag: string, value?: any): void;
    removeUserTag(tag: string): void;
    setUserAttribute(key: string, value: UserAttributesValue | UserAttributesValue[] | unknown): void;
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
    (result: {
        httpCode: number;
        message: string;
    }): void;
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
export interface MPConfiguration {
    isDevelopmentMode?: boolean;
    identifyRequest?: IdentifyRequest;
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
}
