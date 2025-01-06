import { Dictionary, isEmpty, replaceAmpWithAmpersand, replaceMPID } from './utils';
import Constants from './constants';
import { MParticleWebSDK } from './sdkRuntimeModels';
import { MPID } from '@mparticle/web-sdk';
import { IConsentRules } from './consent';
const { Messages } = Constants;
const { InformationMessages } = Messages;

export const DAYS_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

export type CookieSyncDates = Dictionary<number>; 


// this is just a partial definition of TCData for the purposes of our implementation. The full schema can be found here:
// https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md#tcdata

type TCData = {
  gdprApplies?: boolean;
  tcString?: string;
};

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
    appendGDPR: (
        url: string
    ) => string
}

const hasFrequencyCapExpired = (
    frequencyCap: number,
    lastSyncDate?: number,
): boolean => {
    if (!lastSyncDate) {
        return true;
    }

    return (
        new Date().getTime() >
        new Date(lastSyncDate).getTime() + frequencyCap * DAYS_IN_MILLISECONDS
    );
}

export default function CookieSyncManager(
    this: ICookieSyncManager,
    mpInstance: MParticleWebSDK
) {
    const self = this;

    // Public
    this.attemptCookieSync = (
        previousMPID: MPID,
        mpid: MPID,
        mpidIsNotInCookies?: boolean
    ): void => {
        debugger;
        console.log('attempting')
        if (!mpid || mpInstance._Store.webviewBridgeEnabled) {
            return;
        }

        const { pixelConfigurations } = mpInstance._Store;
        const persistence = mpInstance._Persistence.getPersistence();

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

            // Kit Module ID
            const moduleId = pixelSettings.moduleId.toString();

            // Tells you how often we should do a cookie sync (in days)
            const frequencyCap = pixelSettings.frequencyCap;

            // Url for cookie sync pixel
            const pixelUrl = replaceAmpWithAmpersand(pixelSettings.pixelUrl);

            const redirectUrl = pixelSettings.redirectUrl
                ? replaceAmpWithAmpersand(pixelSettings.redirectUrl)
                : null;

            let urlWithRedirect = this.combineUrlWithRedirect(
                mpid,
                pixelUrl,
                redirectUrl
            );

            // check for tcfapi function
            urlWithRedirect = this.appendGDPR(urlWithRedirect);

            if (previousMPID && previousMPID !== mpid) {
                if (persistence && persistence[mpid]) {
                    if (!persistence[mpid].csd) {
                        persistence[mpid].csd = {};
                    }
                    self.performCookieSync(
                        urlWithRedirect,
                        moduleId,
                        mpid,
                        persistence[mpid].csd,
                        filteringConsentRuleValues,
                        mpidIsNotInCookies,
                        requiresConsent
                    );
                }
                return;
            } else {
                if (!persistence || !persistence[mpid]) {
                    return;
                }

                if (!persistence[mpid].csd) {
                    persistence[mpid].csd = {};
                }

                const lastSyncDateForModule = persistence[mpid].csd[moduleId] || null;

                // Check to see if we need to refresh cookieSync
                if (hasFrequencyCapExpired(frequencyCap, lastSyncDateForModule)) {
                    self.performCookieSync(
                        urlWithRedirect,
                        moduleId,
                        mpid,
                        persistence[mpid].csd,
                        filteringConsentRuleValues,
                        mpidIsNotInCookies,
                        requiresConsent
                    );
                }
            }
        });
    };

    this.combineUrlWithRedirect = (
        mpid: MPID,
        pixelUrl: string,
        redirectUrl: string,
    ): string => {
        const url = replaceMPID(pixelUrl, mpid);
        const redirect = redirectUrl ? replaceMPID(redirectUrl, mpid) : '';
        return url + encodeURIComponent(redirect);
    };

    // Private
    this.performCookieSync = (
        url: string,
        moduleId: string,
        mpid: MPID,
        cookieSyncDates: CookieSyncDates,
        filteringConsentRuleValues: IConsentRules,
        mpidIsNotInCookies: boolean,
        requiresConsent: boolean
    ): void => {
        // if MPID is new to cookies, we should not try to perform the cookie sync
        // because a cookie sync can only occur once a user either consents or doesn't
        // we should not check if its enabled if the user has a blank consent
        if (requiresConsent && mpidIsNotInCookies) {
            return;
        }
        debugger;
        
        if (
            // https://go.mparticle.com/work/SQDSDKS-5009
            mpInstance._Consent.isEnabledForUserConsent(
                filteringConsentRuleValues,
                mpInstance.Identity.getCurrentUser()
            )
        ) {
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
        }
    };

    this.appendGDPR = (url: string) => {
        let _url: string = url

        if (typeof window.__tcfapi !== 'function' && typeof window.__tcfapi.getInAppTCData !== 'function') {
            return _url;
        }

        function callback(inAppTCData: TCData, success: boolean): void {
            if (success) {
                const gdprApplies = inAppTCData.gdprApplies ? 1 : 0;
                const tcString = inAppTCData.tcString;
                _url = `${_url}&gdpr=${gdprApplies}&gdpr_consent=${tcString}`;

                // now do the cookie sync
            } else {
                console.log('there is no tcdata')
                debugger;
            }
        }

        try {    
            window.__tcfapi('getInAppTCData', 2, callback);
        }
        catch (e) {
            console.log(e);
        }
        return url;
    };
}
