var Constants = require('./constants'),
    Persistence = require('./persistence'),
    Messages = Constants.Messages;

var cookieSyncManager = {
    attemptCookieSync: function(previousMPID, mpid) {
        var pixelConfig, lastSyncDateForModule, url, redirect, urlWithRedirect;
        if (mpid && !mParticle.Store.webviewBridgeEnabled) {
            mParticle.preInit.pixelConfigurations.forEach(function(pixelSettings) {
                pixelConfig = {
                    moduleId: pixelSettings.moduleId,
                    frequencyCap: pixelSettings.frequencyCap,
                    pixelUrl: cookieSyncManager.replaceAmp(pixelSettings.pixelUrl),
                    redirectUrl: pixelSettings.redirectUrl ? cookieSyncManager.replaceAmp(pixelSettings.redirectUrl) : null
                };

                url = cookieSyncManager.replaceMPID(pixelConfig.pixelUrl, mpid);
                redirect = pixelConfig.redirectUrl ? cookieSyncManager.replaceMPID(pixelConfig.redirectUrl, mpid) : '';
                urlWithRedirect = url + encodeURIComponent(redirect);
                var cookies = Persistence.getPersistence();

                if (previousMPID && previousMPID !== mpid) {
                    if (cookies && cookies[mpid]) {
                        if (!cookies[mpid].csd) {
                            cookies[mpid].csd = {};
                        }
                        cookieSyncManager.performCookieSync(urlWithRedirect, pixelConfig.moduleId, mpid, cookies[mpid].csd);
                    }
                    return;
                } else {
                    if (cookies[mpid]) {
                        if (!cookies[mpid].csd) {
                            cookies[mpid].csd = {};
                        }
                        lastSyncDateForModule = cookies[mpid].csd[(pixelConfig.moduleId).toString()] ? cookies[mpid].csd[(pixelConfig.moduleId).toString()] : null;

                        if (lastSyncDateForModule) {
                            // Check to see if we need to refresh cookieSync
                            if ((new Date()).getTime() > (new Date(lastSyncDateForModule).getTime() + (pixelConfig.frequencyCap * 60 * 1000 * 60 * 24))) {
                                cookieSyncManager.performCookieSync(urlWithRedirect, pixelConfig.moduleId, mpid, cookies[mpid].csd);
                            }
                        } else {
                            cookieSyncManager.performCookieSync(urlWithRedirect, pixelConfig.moduleId, mpid, cookies[mpid].csd);
                        }
                    }
                }
            });
        }
    },

    performCookieSync: function(url, moduleId, mpid, cookieSyncDates) {
        var img = document.createElement('img');

        mParticle.Logger.verbose(Messages.InformationMessages.CookieSync);

        img.src = url;
        cookieSyncDates[moduleId.toString()] = (new Date()).getTime();
        Persistence.saveUserCookieSyncDatesToCookies(mpid, cookieSyncDates);
    },

    replaceMPID: function(string, mpid) {
        return string.replace('%%mpid%%', mpid);
    },

    replaceAmp: function(string) {
        return string.replace(/&amp;/g, '&');
    }
};

module.exports = cookieSyncManager;
