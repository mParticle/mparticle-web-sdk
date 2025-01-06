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
        mpidIsNotInCookies: boolean,
        requiresConsent: boolean
    ) => void;
    combineUrlWithRedirect: (
        mpid: MPID,
        pixelUrl: string,
        redirectUrl: string
    ) => string;
}

const hasFrequencyCapExpired = (
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
            const { filteringConsentRuleValues } = pixelSettings;
            const { values } = filteringConsentRuleValues || {};

            if (!isEmpty(values)) {
                requiresConsent = true;
            }

            // if MPID is new to cookies, we should not try to perform the cookie sync
            // because a cookie sync can only occur once a user either consents or doesn't
            // we should not check if its enabled if the user has a blank consent
            if (requiresConsent && mpidIsNotInCookies) {
                return;
            }

            if (isEmpty(pixelSettings.pixelUrl) && isEmpty(pixelSettings.redirectUrl)) {
                return;
            }

            // Kit Module ID
            const moduleId = pixelSettings.moduleId.toString();

            // Tells you how often we should do a cookie sync (in days)
            const frequencyCap = pixelSettings.frequencyCap;

            // Url for cookie sync pixel
            const pixelUrl = replaceAmpWithAmpersand(pixelSettings.pixelUrl);

            const redirectUrl = pixelSettings.redirectUrl
                ? replaceAmpWithAmpersand(pixelSettings.redirectUrl)
                : null;

            const urlWithRedirect = combineUrlWithRedirect(
                mpid,
                pixelUrl,
                redirectUrl
            );

            // set up csd object if it doesn't exist
            if (persistence && persistence[mpid]) {
                if (!persistence[mpid].csd) {
                    persistence[mpid].csd = {};
                }
            }

            const lastSyncDateForModule = persistence[mpid].csd[moduleId] || null;

            const { isEnabledForUserConsent } = mpInstance._Consent;
            if (!isEnabledForUserConsent(filteringConsentRuleValues, mpInstance.Identity.getCurrentUser())) {
                return;
            }

            if (!hasFrequencyCapExpired(frequencyCap, lastSyncDateForModule)) {
                return;
            }

            self.performCookieSync(
                urlWithRedirect,
                moduleId,
                mpid,
                persistence[mpid].csd,
                mpidIsNotInCookies,
                requiresConsent
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
