import Constants from './constants';

var Messages = Constants.Messages;

export default function cookieSyncManager(mpInstance) {
    var self = this;
    this.attemptCookieSync = function(previousMPID, mpid, mpidIsNotInCookies) {
        var pixelConfig,
            lastSyncDateForModule,
            url,
            redirect,
            urlWithRedirect,
            requiresConsent;

        if (mpid && !mpInstance._Store.webviewBridgeEnabled) {
            mpInstance._Store.pixelConfigurations.forEach(function(
                pixelSettings
            ) {
                // set requiresConsent to false to start each additional pixel configuration
                // set to true only if filteringConsenRuleValues.values.length exists
                requiresConsent = false;

                if (
                    pixelSettings.filteringConsentRuleValues &&
                    pixelSettings.filteringConsentRuleValues.values &&
                    pixelSettings.filteringConsentRuleValues.values.length
                ) {
                    requiresConsent = true;
                }
                pixelConfig = {
                    moduleId: pixelSettings.moduleId,
                    frequencyCap: pixelSettings.frequencyCap,
                    pixelUrl: self.replaceAmp(pixelSettings.pixelUrl),
                    redirectUrl: pixelSettings.redirectUrl
                        ? self.replaceAmp(pixelSettings.redirectUrl)
                        : null,
                    filteringConsentRuleValues:
                        pixelSettings.filteringConsentRuleValues,
                };

                url = self.replaceMPID(pixelConfig.pixelUrl, mpid);
                redirect = pixelConfig.redirectUrl
                    ? self.replaceMPID(pixelConfig.redirectUrl, mpid)
                    : '';
                urlWithRedirect = url + encodeURIComponent(redirect);
                var persistence = mpInstance._Persistence.getPersistence();

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
                                new Date().getTime() >
                                new Date(lastSyncDateForModule).getTime() +
                                    pixelConfig.frequencyCap *
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

    this.replaceMPID = function(string, mpid) {
        return string.replace('%%mpid%%', mpid);
    };

    this.replaceAmp = function(string) {
        return string.replace(/&amp;/g, '&');
    };

    this.performCookieSync = function(
        url,
        moduleId,
        mpid,
        cookieSyncDates,
        filteringConsentRuleValues,
        mpidIsNotInCookies,
        requiresConsent
    ) {
        // if MPID is new to cookies, we should not try to perform the cookie sync
        // because a cookie sync can only occur once a user either consents or doesn't
        // we should not check if its enabled if the user has a blank consent
        if (requiresConsent && mpidIsNotInCookies) {
            return;
        }
        if (
            mpInstance._Consent.isEnabledForUserConsent(
                filteringConsentRuleValues,
                mpInstance.Identity.getCurrentUser()
            )
        ) {
            var img = document.createElement('img');

            mpInstance.Logger.verbose(Messages.InformationMessages.CookieSync);

            img.src = url;
            cookieSyncDates[moduleId.toString()] = new Date().getTime();
            mpInstance._Persistence.saveUserCookieSyncDatesToPersistence(
                mpid,
                cookieSyncDates
            );
        }
    };
}
