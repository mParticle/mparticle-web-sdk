import {
    Dictionary,
    isEmpty,
    createInitialCookieSyncUrl,
    isFunction,
} from './utils';
import Constants from './constants';
import { MParticleWebSDK } from './sdkRuntimeModels';
import { Logger, MPID } from '@mparticle/web-sdk';
import { IConsentRules } from './consent';
import { IPersistenceMinified } from './persistence.interfaces';

const { Messages } = Constants;
const { InformationMessages } = Messages;

export const DAYS_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

export type CookieSyncDates = Dictionary<number>; 

declare global {
    interface Window {
        __tcfapi: any;
    }
}

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
    processPixelConfig: (
        pixelSettings: IPixelConfiguration,
        persistence: IPersistenceMinified,
        mpid: string,
        mpidIsNotInCookies: boolean,
    ) => void
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
        const { pixelConfigurations, webviewBridgeEnabled } = mpInstance._Store;

        if (!mpid || webviewBridgeEnabled) {
            return;
        }

        const persistence = mpInstance._Persistence.getPersistence();

        if (isEmpty(persistence)) {
            return;
        }

        pixelConfigurations.forEach((pixelSetting: IPixelConfiguration) => 
            self.processPixelConfig(
                pixelSetting,
                persistence,
                mpid,
                mpidIsNotInCookies,
            )
        );
    };

    this.processPixelConfig = async (
        pixelSettings: IPixelConfiguration,
        persistence: IPersistenceMinified,
        mpid: string,
        mpidIsNotInCookies: boolean,
    ): Promise<void> => {
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
        const initialCookieSyncUrl = createInitialCookieSyncUrl(mpid, pixelUrl, redirectUrl);
        const moduleIdString = moduleId.toString();

        // The IAB Europe Transparency & Consent Framework requires adding certain query parameters to
        // a cookie sync url when using GDPR
        // fullUrl will be the initialCookieSyncUrl if an error is thrown, or there if TcfApi is not available.
        // Otherwise, it will include the GdprConsent parameters that TCF requires
        let fullUrl: string;
        try {
            fullUrl = isTcfApiAvailable() ? await appendGdprConsentUrl(initialCookieSyncUrl) : initialCookieSyncUrl;
        } catch (error) {
            fullUrl = initialCookieSyncUrl;
            const errorMessage = (error as Error).message || error.toString();
            mpInstance.Logger.error(errorMessage);
        }

        self.performCookieSync(
            fullUrl,
            moduleIdString,
            mpid,
            cookieSyncDates
        );
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

export const isTcfApiAvailable = (): boolean => isFunction(window.__tcfapi);

// This is just a partial definition of TCData for the purposes of our implementation. The full schema can be found here:
// https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md#tcdata
type TCData = {
  gdprApplies?: boolean;
  tcString?: string;
};

export async function appendGdprConsentUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const tcfAPICallBack = (inAppTCData: TCData, success: boolean) => {
                if (success && inAppTCData) {
                    // gdprApplies is a boolean, but the query parameter is 1 for true, or 0 for false
                    const gdprApplies: number = inAppTCData.gdprApplies ? 1 : 0;
                    const tcString = inAppTCData.tcString;
                    resolve(`${url}&gdpr=${gdprApplies}&gdpr_consent=${tcString}`);
                } else {
                    resolve(url); // No GDPR data; fallback to original URL
                }
            }

            window.__tcfapi(
                'getInAppTCData',   // function name that requests the TCData
                2,                  // version of TCF (2.2 as of 1/22/2025)
                tcfAPICallBack
            );
        } catch (error) {
            reject(error);
        }
    });
}