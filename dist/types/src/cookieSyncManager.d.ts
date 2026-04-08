import { Dictionary } from './utils';
import { MPID } from '@mparticle/web-sdk';
import { IConsentRules } from './consent';
import { IMParticleWebSDKInstance } from './mp-instance';
export declare const DAYS_IN_MILLISECONDS: number;
export declare const PARTNER_MODULE_IDS: {
    readonly AdobeEventForwarder: 11;
    readonly DoubleclickDFP: 41;
    readonly AppNexus: 50;
    readonly Lotame: 58;
    readonly TradeDesk: 103;
    readonly VerizonMedia: 155;
    readonly Rokt: 1277;
};
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
    attemptCookieSync: (mpid: MPID, mpidIsNotInCookies?: boolean) => void;
    performCookieSync: (url: string, moduleId: string, mpid: MPID, cookieSyncDates: CookieSyncDates) => void;
    combineUrlWithRedirect: (mpid: MPID, pixelUrl: string, redirectUrl: string) => string;
}
export default function CookieSyncManager(this: ICookieSyncManager, mpInstance: IMParticleWebSDKInstance): void;
export declare const isLastSyncDateExpired: (frequencyCap: number, lastSyncDate?: number) => boolean;
