import { replaceAmpWithAmpersand, replaceMPID } from './utils';
import Constants from './constants';
import { ICookieSyncManager } from './cookieSyncManager.interfaces';
import { MParticleWebSDK } from './sdkRuntimeModels';
import { PixelConfiguration } from './store';
import { Dictionary, MPID } from '@mparticle/web-sdk';
import { IConsentRules } from './consent';

const { Messages } = Constants;
const { InformationMessages } = Messages;

export default function CookieSyncManager(this: ICookieSyncManager, mpInstance: MParticleWebSDK) {
    const self = this;

    // Public
    this.attemptCookieSync = function(previousMPID: MPID, mpid: MPID, mpidIsNotInCookies: boolean) {
        // TODO: These should move inside the for loop
        let pixelConfig: PixelConfiguration;
        let lastSyncDateForModule: number;
        let url: string;
        let redirect: string;
        let urlWithRedirect: string;
        let requiresConsent: boolean;

        // TODO: Make this exit quicker instead of nested
        if (mpid && !mpInstance._Store.webviewBridgeEnabled) {
            mpInstance._Store.pixelConfigurations.forEach(function(
                pixelSettings
            ) {
                // set requiresConsent to false to start each additional pixel configuration
                // set to true only if filteringConsenRuleValues.values.length exists
                requiresConsent = false;

                // TODO: Replace with isEmpty
                if (
                    pixelSettings.filteringConsentRuleValues &&
                    pixelSettings.filteringConsentRuleValues.values &&
                    pixelSettings.filteringConsentRuleValues.values.length
                ) {
                    requiresConsent = true;
                }

                pixelConfig = {
                    // Kit Module ID
                    moduleId: pixelSettings.moduleId,

                    // Tells you how often we should do a cookie sync (in days)
                    frequencyCap: pixelSettings.frequencyCap,

                    // Url for cookie sync pixel
                    pixelUrl: replaceAmpWithAmpersand(pixelSettings.pixelUrl),

                    // TODO: Document requirements for redirectUrl
                    redirectUrl: pixelSettings.redirectUrl
                        ? replaceAmpWithAmpersand(pixelSettings.redirectUrl)
                        : null,

                    // Filtering rules as defined in UI
                    filteringConsentRuleValues:
                        pixelSettings.filteringConsentRuleValues,
                };

                // TODO: combine replaceMPID and replaceAmp into sanitizeUrl function
                url = replaceMPID(pixelConfig.pixelUrl, mpid);
                redirect = pixelConfig.redirectUrl
                    ? replaceMPID(pixelConfig.redirectUrl, mpid)
                    : '';
                urlWithRedirect = url + encodeURIComponent(redirect);


                // TODO: Refactor so that Persistence is only called once
                //       outside of the loop
                var persistence = mpInstance._Persistence.getPersistence();

                // TODO: Is there a historic reason for checking for previousMPID?
                //       it does not appear to be passed in anywhere
                if (previousMPID && previousMPID !== mpid) {
                    if (persistence && persistence[mpid]) {
                        if (!persistence[mpid].csd) {
                            persistence[mpid].csd = {};
                        }
                        self.performCookieSync(
                            urlWithRedirect,
                            pixelConfig.moduleId,
                            mpid,
                            persistence[mpid].csd,
                            pixelConfig.filteringConsentRuleValues,
                            mpidIsNotInCookies,
                            requiresConsent
                        );
                    }
                    return;
                } else {
                    // TODO: Refactor to check for the inverse and exit early
                    //       rather than nesting
                    if (persistence[mpid]) {
                        if (!persistence[mpid].csd) {
                            persistence[mpid].csd = {};
                        }
                        lastSyncDateForModule = persistence[mpid].csd[
                            pixelConfig.moduleId.toString()
                        ]
                            ? persistence[mpid].csd[
                                  pixelConfig.moduleId.toString()
                              ]
                            : null;

                        if (lastSyncDateForModule) {
                            // Check to see if we need to refresh cookieSync
                            if (
                                // TODO: Turn this into a convenience method for readability?
                                //       We use similar comparisons elsewhere in the SDK,
                                //       so perhaps we can make a time comparison convenience method
                                new Date().getTime() >
                                new Date(lastSyncDateForModule).getTime() +
                                    pixelConfig.frequencyCap *
                                        // TODO: Turn these numbers into a constant so
                                        //       we can remember what this number is for
                                        60 *
                                        1000 *
                                        60 *
                                        24
                            ) {
                                self.performCookieSync(
                                    urlWithRedirect,
                                    pixelConfig.moduleId,
                                    mpid,
                                    persistence[mpid].csd,
                                    pixelConfig.filteringConsentRuleValues,
                                    mpidIsNotInCookies,
                                    requiresConsent
                                );
                            }
                        } else {
                            self.performCookieSync(
                                urlWithRedirect,
                                pixelConfig.moduleId,
                                mpid,
                                persistence[mpid].csd,
                                pixelConfig.filteringConsentRuleValues,
                                mpidIsNotInCookies,
                                requiresConsent
                            );
                        }
                    }
                }
            });
        }
    };

    // Private
    this.performCookieSync = function(
        url: string,
        moduleId: number,
        mpid: MPID,
        cookieSyncDates: Dictionary<number>,
        filteringConsentRuleValues: IConsentRules,
        mpidIsNotInCookies: boolean,
        requiresConsent: boolean
    ) {
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
                // TODO: Break this out into a convenience method so we can unit test
                cookieSyncDates[moduleId.toString()] = new Date().getTime();
                mpInstance._Persistence.saveUserCookieSyncDatesToPersistence(
                    mpid,
                    cookieSyncDates
                );
            };
            img.src = url;
        }
    };
}
