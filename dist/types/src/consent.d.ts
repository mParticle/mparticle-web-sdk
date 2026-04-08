import { ConsentState, PrivacyConsentState } from '@mparticle/web-sdk';
import { Dictionary } from './utils';
import { IMParticleUser } from './identity-user-interfaces';
import { IMParticleWebSDKInstance } from './mp-instance';
declare const CCPAPurpose: "data_sale_opt_out";
export interface IMinifiedConsentJSONObject {
    gdpr?: Dictionary<IPrivacyV2DTO>;
    ccpa?: {
        [CCPAPurpose]: IPrivacyV2DTO;
    };
}
export interface ICreatePrivacyConsentFunction {
    (consented: boolean, timestamp?: number, consentDocument?: string, location?: string, hardwareId?: string): PrivacyConsentState | null;
}
export interface SDKConsentApi {
    createGDPRConsent: ICreatePrivacyConsentFunction;
    createCCPAConsent: ICreatePrivacyConsentFunction;
    createConsentState: (consentState?: ConsentState) => ConsentState;
}
export interface IConsentSerialization {
    toMinifiedJsonObject: (state: ConsentState) => IMinifiedConsentJSONObject;
    fromMinifiedJsonObject: (json: IMinifiedConsentJSONObject) => ConsentState;
}
export interface SDKConsentState extends Omit<ConsentState, 'getGDPRConsentState' | 'getCCPAConsentState'> {
    getGDPRConsentState(): SDKGDPRConsentState;
    getCCPAConsentState(): SDKCCPAConsentState;
}
export interface SDKConsentStateData {
    Consented: boolean;
    Timestamp?: number;
    ConsentDocument?: string;
    Location?: string;
    HardwareId?: string;
}
export type SDKGDPRConsentState = Dictionary<SDKConsentStateData>;
export interface SDKCCPAConsentState extends SDKConsentStateData {
}
export interface IPrivacyV2DTO {
    c: boolean;
    ts: number;
    d: string;
    l: string;
    h: string;
}
export type IGDPRConsentStateV2DTO = Dictionary<IPrivacyV2DTO>;
export interface ICCPAConsentStateV2DTO {
    [CCPAPurpose]: IPrivacyV2DTO;
}
export interface IConsentStateV2DTO {
    gdpr?: IGDPRConsentStateV2DTO;
    ccpa?: ICCPAConsentStateV2DTO;
}
export interface IConsentRulesValues {
    consentPurpose: string;
    hasConsented: boolean;
}
export interface IConsentRules {
    includeOnMatch: boolean;
    values: IConsentRulesValues[];
}
export interface IConsentState extends ConsentState {
    removeCCPAState: () => ConsentState;
}
export interface IConsent {
    isEnabledForUserConsent: (consentRules: IConsentRules, user: IMParticleUser) => boolean;
    createPrivacyConsent: ICreatePrivacyConsentFunction;
    createConsentState: (consentState?: ConsentState) => ConsentState;
    ConsentSerialization: IConsentSerialization;
}
export default function Consent(this: IConsent, mpInstance: IMParticleWebSDKInstance): void;
export {};
