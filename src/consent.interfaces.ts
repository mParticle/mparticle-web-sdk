// TODO: Migrate this to Consent.ts when that is created
import { ConsentState, PrivacyConsentState } from '@mparticle/web-sdk';

export interface IGDPRConsentObject {
    purpose: string;
}

export interface ICCPAConsentObject {
    purpose: string;
}

export interface IConsentJSONObject {
    gdpr?: Partial<IGDPRConsentObject>;
    ccpa?: Partial<ICCPAConsentObject>;
}

interface ICreatePrivacyConsentFunction {
    (
        consented: boolean,
        timestamp?: number,
        consentDocument?: string,
        location?: string,
        hardwareId?: string
    ): PrivacyConsentState | null;
}

// TODO: Refactor this with Consent Namespace in @types/mparticle-web-sdk
//       https://go.mparticle.com/work/SQDSDKS-5009
export interface SDKConsentApi {
    createGDPRConsent: ICreatePrivacyConsentFunction;
    createCCPAConsent: ICreatePrivacyConsentFunction;
    createConsentState: (consentState?: ConsentState) => ConsentState;
    ConsentSerialization: IConsentSerialization;
    createPrivacyConsent: ICreatePrivacyConsentFunction;
}

export interface IConsentSerialization {
    toMinifiedJsonObject: (state: ConsentState) => IConsentJSONObject;
    fromMinifiedJsonObject: (json: IConsentJSONObject) => ConsentState;
}

// TODO: Resolve discrepency between ConsentState and SDKConsentState
//       https://go.mparticle.com/work/SQDSDKS-5009
export interface SDKConsentState
    extends Omit<ConsentState, 'getGDPRConsentState' | 'getCCPAConsentState'> {
    getGDPRConsentState(): SDKGDPRConsentState;
    getCCPAConsentState(): SDKCCPAConsentState;
}

export interface SDKGDPRConsentState {
    [key: string]: SDKConsentStateData;
}

// TODO: Resolve discrepency between ConsentState and SDKConsentState
//       https://go.mparticle.com/work/SQDSDKS-5009
//       Specifically PrivacyConsentState, GDPRConsentState and CCPAConsentState
//       Treat all attributes as required, but we had to override this
//       to be optional for a bugfix:
//       https://github.com/mParticle/mparticle-web-sdk/commit/3b11ead79f25b417737442a4fabd6435750f46b8
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
