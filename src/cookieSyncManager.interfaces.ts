import { MPID } from '@mparticle/web-sdk';
import { Dictionary } from './utils';
import { IConsentRules } from './consent';

export type CookieSyncDates = Dictionary<number>; 

export interface IPixelConfiguration {
    name?: string;
    moduleId: number;
    esId?: number;
    isDebug?: boolean;
    isProduction?: boolean;
    settings: Dictionary<string>;
    frequencyCap: number;
    pixelUrl: string;
    redirectUrl: string;
    filteringConsentRuleValues?: IConsentRules;
}
export interface ICookieSyncManager {
    attemptCookieSync: (
        previousMPID: MPID,
        mpid: MPID,
        mpidIsNotInCookies?: boolean
    ) => void;
    performCookieSync: (
        url: string,
        moduleId: string,
        mpid: MPID,
        cookieSyncDates: CookieSyncDates,
        filteringConsentRuleValues: IConsentRules,
        mpidIsNotInCookies: boolean,
        requiresConsent: boolean
    ) => void;
    combineUrlWithRedirect: (
        mpid: MPID,
        pixelUrl: string,
        redirectUrl: string
    ) => string;
}
