import {
    Dictionary,
    isEmpty,
    replaceAmpWithAmpersand,
    combineUrlWithRedirect,
} from './utils';
import Constants from './constants';
import { MParticleWebSDK } from './sdkRuntimeModels';
import { MPID } from '@mparticle/web-sdk';
import { IConsentRules } from './consent';

const { Messages } = Constants;
const { InformationMessages } = Messages;

export const DAYS_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

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

const shouldPerformCookieSync = (
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

export default function CookieSyncManager(
    this: ICookieSyncManager,
    mpInstance: MParticleWebSDK
) {
    const self = this;

    // Public
    this.attemptCookieSync = (
        mpid: MPID,
        mpidIsNotInCookies?: boolean
    ): void => {
        if (!mpid || mpInstance._Store.webviewBridgeEnabled) {
            return;
        }

        const persistence = mpInstance._Persistence.getPersistence();

        if (isEmpty(persistence)) {
            return;
        }

        const { pixelConfigurations } = mpInstance._Store;
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
            
            if (!isEmpty(values)) {
                requiresConsent = true;
            }

            // If MPID is new to cookies, we should not try to perform the cookie sync
            // because a cookie sync can only occur once a user either consents or doesn't.
            // we should not check if it's enabled if the user has a blank consent
            if (requiresConsent && mpidIsNotInCookies) {
                return;
            }
            
            if (isEmpty(pixelUrl) && isEmpty(redirectUrl)) {
                return;
            }

            // Url for cookie sync pixel
            const finalPixelUrl = replaceAmpWithAmpersand(pixelUrl);
            const finalDirectUrl = redirectUrl
                ? replaceAmpWithAmpersand(redirectUrl)
                : null;

            const fullUrl = combineUrlWithRedirect(
                mpid,
                finalPixelUrl,
                finalDirectUrl
            );

            const cookieSyncDates: CookieSyncDates = persistence[mpid]?.csd ?? {};

            const lastSyncDateForModule: number = cookieSyncDates[moduleId] || null;

            const { isEnabledForUserConsent } = mpInstance._Consent;
            if (!isEnabledForUserConsent(filteringConsentRuleValues, mpInstance.Identity.getCurrentUser())) {
                return;
            }

            if (!shouldPerformCookieSync(frequencyCap, lastSyncDateForModule)) {
                return;
            }

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
