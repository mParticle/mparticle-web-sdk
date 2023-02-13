import Constants from './constants';

var Messages = Constants.Messages;

export default function cookieSyncManager(mpInstance) {
    var self = this;

    // Public
    this.attemptCookieSync = function(previousMPID, mpid, mpidIsNotInCookies) {
        // TODO: These should move inside the for loop
        var pixelConfig,
            lastSyncDateForModule,
            url,
            redirect,
            urlWithRedirect,
            requiresConsent;

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
                    pixelUrl: self.replaceAmp(pixelSettings.pixelUrl),

                    // TODO: Document requirements for redirectUrl
                    redirectUrl: pixelSettings.redirectUrl
                        ? self.replaceAmp(pixelSettings.redirectUrl)
                        : null,

                    // Filtering rules as defined in UI
                    filteringConsentRuleValues:
                        pixelSettings.filteringConsentRuleValues,
                };

                // TODO: combine replaceMPID and replaceAmp into sanitizeUrl function
                url = self.replaceMPID(pixelConfig.pixelUrl, mpid);
                redirect = pixelConfig.redirectUrl
                    ? self.replaceMPID(pixelConfig.redirectUrl, mpid)
                    : '';
                urlWithRedirect = url + encodeURIComponent(redirect);

                // TODO: Do we need to fetch persistence during every loop,
                //       or can we fetch once and cache?
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
                    // TODO: can we check for the inverse and exit early
                    //       rather than nesting?
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
                                // Can this be turned into a convenience method for readability?
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

    // Private
    this.replaceMPID = function(string, mpid) {
        return string.replace('%%mpid%%', mpid);
    };

    // Private
    // TODO: Rename function to replaceAmpWithAmpersand
    this.replaceAmp = function(string) {
        return string.replace(/&amp;/g, '&');
    };

    // Private
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

        // TODO: attemptCookieSync is called as a loop and therefore this function
        //       polls the user object and consent multiple times.
        //       Could we factor this out or cache the boolean so that it
        //       only gets called once per cookie sync attempt per module?
        if (
            mpInstance._Consent.isEnabledForUserConsent(
                filteringConsentRuleValues,
                mpInstance.Identity.getCurrentUser()
            )
        ) {
            var img = document.createElement('img');

            mpInstance.Logger.verbose(Messages.InformationMessages.CookieSync);
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
