// TODO: Migrate this to Consent.ts when that is created
import { ConsentState, PrivacyConsentState } from '@mparticle/web-sdk';

export interface GDPRConsentObject {
    purpose: string;
}

export interface CCPAConsentObject {
    purpose: string;
}

export interface ConsentJSONObject {
    gdpr?: Partial<GDPRConsentObject>;
    ccpa?: Partial<CCPAConsentObject>;
}

// TODO: Refactor this with Consent Namespace in @types/mparticle-web-sdk
export interface SDKConsentApi {
    createGDPRConsent: (
        consented?: boolean,
        timestamp?: number,
        consentDocument?: string,
        location?: string,
        hardwareId?: string
    ) => PrivacyConsentState | null;
    createCCPAConsent: (
        consented?: boolean,
        timestamp?: number,
        consentDocument?: string,
        location?: string,
        hardwareId?: string
    ) => PrivacyConsentState | null;
    createConsentState: (consentState?: ConsentState) => ConsentState;
    ConsentSerialization: SDKConsentSerialization;
    createPrivacyConsent: (
        consented: boolean,
        timestamp?: number,
        consentDocument?: string,
        location?: string,
        hardwareId?: string
    ) => PrivacyConsentState | null;
}

export interface SDKConsentSerialization {
    toMinifiedJsonObject: (state: ConsentState) => ConsentJSONObject;
    fromMinifiedJsonObject: (json: ConsentJSONObject) => ConsentState;
}

// TODO: Resolve discrepency between ConsentState and SDKConsentState
export interface SDKConsentState
    extends Omit<ConsentState, 'getGDPRConsentState' | 'getCCPAConsentState'> {
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

export interface IPrivacyV2DTO {
    c: boolean; // Consented
    ts: number; // Timestamp
    d: string; // Document
    l: string; // Location
    h: string; // HardwareID
}

export interface IGDPRConsentStateDTO {
    [key: string]: IPrivacyV2DTO;
}

export interface ICCPAConsentStateDTO {
    data_sale_opt_out: IPrivacyV2DTO;
}

export interface IConsentStateDTO {
    gdpr?: IGDPRConsentStateDTO;
    ccpa?: ICCPAConsentStateDTO;
}
