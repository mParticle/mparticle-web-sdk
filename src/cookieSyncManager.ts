import { isEmpty, replaceAmpWithAmpersand, replaceMPID } from './utils';
import Constants from './constants';
import { ICookieSyncManager } from './cookieSyncManager.interfaces';
import { MParticleWebSDK } from './sdkRuntimeModels';
import { Dictionary, MPID } from '@mparticle/web-sdk';
import { IConsentRules } from './consent';

const { Messages } = Constants;
const { InformationMessages } = Messages;

interface PixelConfig {
    moduleId: string;
    frequencyCap: number;
    pixelUrl: string;
    redirectUrl: string;
    filteringConsentRuleValues: IConsentRules;
}

const DAYS_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

const hasFrequencyCapExpired = (
    lastSyncDate: number,
    frequencyCap: number
): boolean => {
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
        mpidIsNotInCookies: boolean
    ): void => {
        if (!mpid || mpInstance._Store.webviewBridgeEnabled) {
            return;
        }

        const { pixelConfigurations } = mpInstance._Store;
        const persistence = mpInstance._Persistence.getPersistence();

        pixelConfigurations.forEach(pixelSettings => {
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

            // TODO: Document requirements for redirectUrl
            const redirectUrl = pixelSettings.redirectUrl
                ? replaceAmpWithAmpersand(pixelSettings.redirectUrl)
                : null;

            const urlWithRedirect = this.combineUrlWithRedirect(
                mpid,
                pixelUrl,
                redirectUrl
            );

            // TODO: Is there a historic reason for checking for previousMPID?
            //       it does not appear to be passed in anywhere
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

                const lastSyncDateForModule = persistence[mpid].csd[moduleId]
                    ? persistence[mpid].csd[moduleId]
                    : null;

                // Check to see if we need to refresh cookieSync
                if (hasFrequencyCapExpired(lastSyncDateForModule, frequencyCap)) {
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
        redirectUrl
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
        cookieSyncDates: Dictionary<number>,
        filteringConsentRuleValues: IConsentRules,
        mpidIsNotInCookies: boolean,
        requiresConsent: boolean
    ): void => {
        // if MPID is new to cookies, we should not try to perform the cookie sync
        // because a cookie sync can only occur once a user either consents or doesn't
        // we should not check if its enabled if the user has a blank consent
        // TODO: We should do this check outside of this function
        if (requiresConsent && mpidIsNotInCookies) {
            return;
        }

        // TODO: Refactor so that check is made outside of the function.
        //       Cache or store the boolean so that it only gets called once per
        //       cookie sync attempt per module.
        //       Currently, attemptCookieSync is called as a loop and therefore this
        //       function polls the user object and consent multiple times.
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
}
