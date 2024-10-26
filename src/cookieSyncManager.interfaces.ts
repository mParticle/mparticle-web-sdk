import { MPID } from "@mparticle/web-sdk";
import { Dictionary } from "./utils";
import { IConsentRules } from "./consent";

export interface ICookieSyncManager {
    attemptCookieSync: (previousMPID: MPID, mpid: MPID, mpidIsNotInCookies: boolean) => void;
    performCookieSync: (
        url: string,
        moduleId: number,
        mpid: MPID,
        cookieSyncDates: Dictionary<number>,
        filteringConsentRuleValues: IConsentRules,
        mpidIsNotInCookies: boolean,
        requiresConsent: boolean
    ) => void;
    privatereplaceAmpWithAmpersand: (string: string) => string;
    replaceMPID: (string, mpid: MPID) => string;

    /**
     * @deprecated replaceAmp has been deprecated, use replaceAmpersandWithAmp instead
     */
    replaceAmp: (string: string) => string;
}