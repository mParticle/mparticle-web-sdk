import {
    Dictionary,
    isEmpty,
    createCookieSyncUrl,
} from './utils';
import Constants from './constants';
import { MPID } from '@mparticle/web-sdk';
import { IConsentRules } from './consent';
import { IMParticleWebSDKInstance } from './mp-instance';

const { Messages } = Constants;
const { InformationMessages } = Messages;

export const DAYS_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

// Partner module IDs for cookie sync configurations
export const PARTNER_MODULE_IDS = {
    AdobeEventForwarder: 11,
    DoubleclickDFP: 41,
    AppNexus: 50,
    Lotame: 58,
    TradeDesk: 103,
    VerizonMedia: 155,
} as const;

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
        mpid: MPID,
        mpidIsNotInCookies?: boolean
    ) => void;
    performCookieSync: (
        url: string,
        moduleId: string,
        mpid: MPID,
        cookieSyncDates: CookieSyncDates,
    ) => void;
    combineUrlWithRedirect: (
        mpid: MPID,
        pixelUrl: string,
        redirectUrl: string
    ) => string;
}

export default function CookieSyncManager(
    this: ICookieSyncManager,
    mpInstance: IMParticleWebSDKInstance
) {
    const self = this;

    // Public
    this.attemptCookieSync = (
        mpid: MPID,
        mpidIsNotInCookies?: boolean
    ): void => {
        const { pixelConfigurations, webviewBridgeEnabled } = mpInstance._Store;

        if (!mpid || webviewBridgeEnabled) {
            return;
        }

        const persistence = mpInstance._Persistence.getPersistence();

        if (isEmpty(persistence)) {
            return;
        }

        pixelConfigurations.forEach((pixelSettings: IPixelConfiguration) => {
            // set requiresConsent to false to start each additional pixel configuration
            // set to true only if filteringConsenRuleValues.values.length exists
            let requiresConsent = false;
            // Filtering rules as defined in UI
            const {
                filteringConsentRuleValues,
                pixelUrl,
                redirectUrl,
                moduleId,
                // Tells you how often we should do a cookie sync (in days)
                frequencyCap,
            } = pixelSettings;
            const { values } = filteringConsentRuleValues || {};

            if (isEmpty(pixelUrl)) {
                return;
            }

            if (!isEmpty(values)) {
                requiresConsent = true;
            }

            // If MPID is new to cookies, we should not try to perform the cookie sync
            // because a cookie sync can only occur once a user either consents or doesn't.
            // we should not check if it's enabled if the user has a blank consent
            if (requiresConsent && mpidIsNotInCookies) {
                return;
            }

            const { isEnabledForUserConsent } = mpInstance._Consent;

            if (!isEnabledForUserConsent(filteringConsentRuleValues, mpInstance.Identity.getCurrentUser())) {
                return;
            }

            const cookieSyncDates: CookieSyncDates = persistence[mpid]?.csd ?? {};
            const lastSyncDateForModule: number = cookieSyncDates[moduleId] || null;

            if (!isLastSyncDateExpired(frequencyCap, lastSyncDateForModule)) {
                return;
            }

            // Url for cookie sync pixel
            // Add domain parameter for Trade Desk
            const domain = moduleId === PARTNER_MODULE_IDS.TradeDesk ? window.location.hostname : undefined;
            const fullUrl = createCookieSyncUrl(mpid, pixelUrl, redirectUrl, domain);

            self.performCookieSync(
                fullUrl,
                moduleId.toString(),
                mpid,
                cookieSyncDates
            );
        });
    };

    // Private
    this.performCookieSync = (
        url: string,
        moduleId: string,
        mpid: MPID,
        cookieSyncDates: CookieSyncDates,
    ): void => {
        const img = document.createElement('img');

        mpInstance.Logger.verbose(InformationMessages.CookieSync);
        img.onload = function() {
            cookieSyncDates[moduleId] = new Date().getTime();

            mpInstance._Persistence.saveUserCookieSyncDatesToPersistence(
                mpid,
                cookieSyncDates
            );
        };
        img.src = url;
    };
}

export const isLastSyncDateExpired = (
    frequencyCap: number,
    lastSyncDate?: number
): boolean => {
    // If there is no lastSyncDate, then there is no previous cookie sync, so we should sync the cookie
    if (!lastSyncDate) {
        return true;
    }

    // Otherwise, compare the last sync date to determine if it should do a cookie sync again
    return (
        new Date().getTime() >
        new Date(lastSyncDate).getTime() + frequencyCap * DAYS_IN_MILLISECONDS
    );
};