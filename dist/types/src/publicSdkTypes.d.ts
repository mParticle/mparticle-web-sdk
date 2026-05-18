/**
 * Native public SDK types that used to come from @types/mparticle__web-sdk.
 *
 * Keeping these in the SDK source lets monorepo packages type-check against
 * the local SDK before the next SDK version has been published to npm.
 */
export type MPID = string;
export type SDKEventAttrValue = string | number | boolean | null | undefined | string[] | number[] | boolean[];
export interface SDKEventAttrs {
    [key: string]: any;
}
export interface SDKEventOptions {
    [key: string]: any;
}
export interface TransactionAttributes {
    Id?: string | number;
    Affiliation?: string;
    CouponCode?: string;
    Revenue?: string | number;
    Shipping?: string | number;
    Tax?: string | number;
    [key: string]: any;
}
export type Callback = (...args: unknown[]) => void;
export interface UserIdentities {
    [key: string]: string | null | undefined;
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
export interface UserIdentityMap {
    userIdentities: UserIdentities;
}
export interface AllUserAttributes {
    [key: string]: any;
}
export interface User {
    getMPID(): MPID;
    getUserIdentities(): UserIdentityMap;
    getAllUserAttributes(): AllUserAttributes;
    getConsentState(): ConsentState;
    isLoggedIn(): boolean;
    removeUserAttribute(key: string): void;
    setUserAttribute(key: string, value: any): void;
    setUserAttributes(attributes: AllUserAttributes): void;
}
export interface IdentityApiData {
    [key: string]: any;
    userIdentities?: UserIdentities;
    userAttributes?: AllUserAttributes;
}
export interface IdentifyRequest extends IdentityApiData {
}
export interface ConsentState {
    addGDPRConsentState(purpose: string, gdprConsent: PrivacyConsentState): ConsentState;
    setGDPRConsentState(gdprConsentState: GDPRConsentState): ConsentState;
    getGDPRConsentState(): GDPRConsentState;
    removeGDPRConsentState(purpose: string): ConsentState;
    setCCPAConsentState(ccpaConsent: CCPAConsentState): ConsentState;
    getCCPAConsentState(): CCPAConsentState;
    removeCCPAConsentState(): ConsentState;
}
export interface PrivacyConsentState {
    Consented: boolean;
    Timestamp?: number;
    ConsentDocument?: string;
    Location?: string;
    HardwareId?: string;
}
export type GDPRConsentState = Record<string, PrivacyConsentState>;
export interface CCPAConsentState extends PrivacyConsentState {
}
export interface Product {
    [key: string]: any;
}
export interface MPConfiguration {
    [key: string]: any;
}
export type RoktAttributeValueArray = Array<string | number | boolean>;
export type RoktAttributeValueType = string | number | boolean | undefined | null;
export type RoktAttributeValue = RoktAttributeValueType | RoktAttributeValueArray;
export type RoktAttributes = Record<string, RoktAttributeValue>;
export interface RoktSelection {
    context?: {
        sessionId?: Promise<string>;
    };
    then?: (callback: (selection: RoktSelection) => void) => Promise<void>;
    catch?: (callback: () => void) => void;
}
