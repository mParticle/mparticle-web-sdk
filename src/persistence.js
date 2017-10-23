var Helpers = require('./helpers'),
    Constants = require('./constants'),
    Types = require('./types'),
    Messages = Constants.Messages,
    MP = require('./mp');

function useLocalStorage() {
    return (!mParticle.useCookieStorage && this.isLocalStorageAvailable);
}

function initializeStorage() {
    var cookies,
        localStorageData;
    // Check to see if localStorage is available and if not, always use cookies
    this.isLocalStorageAvailable = this.determineLocalStorageAvailability();

    if (this.isLocalStorageAvailable) {
        if (mParticle.useCookieStorage) {
            // For migrating from localStorage to cookies -- If an instance switches from localStorage to cookies, then
            // no mParticle cookie exists yet and there is localStorage. Get the localStorage, set them to cookies, then delete the localStorage item.
            localStorageData = this.getLocalStorage();
            if (localStorageData) {
                this.storeDataInMemory(localStorageData);
                this.removeLocalStorage();
                this.update();
            } else {
                this.storeDataInMemory(this.getCookie());
            }
        }
        else {
            cookies = this.getCookie();
            // For migrating from cookie to localStorage -- If an instance is newly switching from cookies to localStorage, then
            // no mParticle localStorage exists yet and there are cookies. Get the cookies, set them to localStorage, then delete the cookies.
            if (cookies) {
                this.storeDataInMemory(cookies);
                this.expireCookies();
                this.update();
            } else {
                this.storeDataInMemory(this.getLocalStorage());
            }
        }
    } else {
        this.storeDataInMemory(this.getCookie());
    }
}

function update() {
    if (mParticle.useCookieStorage || !this.isLocalStorageAvailable) {
        this.setCookie();
    } else {
        this.setLocalStorage();
    }
}

function storeDataInMemory(result, currentMPID) {
    var obj;

    try {
        obj = typeof result === 'string' ? JSON.parse(result) : result;

        if (!obj) {
            Helpers.logDebug(Messages.InformationMessages.CookieNotFound);
            MP.clientId = Helpers.generateUniqueId();
            MP.userAttributes = {};
            MP.userIdentities = {};
            MP.cartProducts = [];
            MP.productsBags = {};
            MP.cookieSyncDates = {};
        } else {
            // Set MPID first, then change object to match MPID data
            if (currentMPID) {
                MP.mpid = currentMPID;
            } else {
                MP.mpid = obj.mpid || obj.currentUserMPID || 0;
            }

            // Longer names are for backwards compatibility
            // obj with no globalSettings are for migration purposes, setting globalSettings default of {} for migration purposes
            obj.globalSettings = obj.globalSettings || {};

            MP.sessionId = obj.globalSettings.sid || obj.sid || obj.SessionId || MP.sessionId;
            MP.isEnabled = (typeof obj.ie !== 'undefined' || typeof obj.globalSettings.ie !== 'undefined') ? (obj.ie || obj.globalSettings.ie) : obj.IsEnabled;
            MP.sessionAttributes = obj.globalSettings.sa || obj.sa || obj.SessionAttributes || MP.sessionAttributes;
            MP.serverSettings = obj.globalSettings.ss || obj.ss || obj.ServerSettings || MP.serverSettings;
            MP.devToken = obj.globalSettings.dt || obj.dt || obj.DeveloperToken || MP.devToken;
            MP.clientId = obj.globalSettings.cgid || obj.cgid || MP.clientId || Helpers.generateUniqueId();
            MP.deviceId = obj.globalSettings.das || obj.das || MP.deviceId || Helpers.generateUniqueId();
            // context and currentSessionMPIDs are new to version 2 and don't need migrating
            MP.context = obj.globalSettings.c || '';
            MP.currentSessionMPIDs = obj.globalSettings.currentSessionMPIDs || MP.currentSessionMPIDs;

            if (obj.les || obj.globalSettings.les) {
                MP.dateLastEventSent = new Date(obj.globalSettings.les);
            }
            else if (obj.LastEventSent || obj.globalSettings.LastEventSent) {
                MP.dateLastEventSent = new Date(obj.globalSettings.LastEventSent);
            }

            if (currentMPID) {
                obj = obj[currentMPID] ? obj[currentMPID] : obj;
            } else {
                obj = obj[obj.currentUserMPID] ? obj[obj.currentUserMPID] : obj;
            }
            MP.userAttributes = obj.ua || obj.UserAttributes || MP.userAttributes;
            MP.userIdentities = obj.ui || obj.UserIdentities || MP.userIdentities;
            MP.cartProducts = obj.cp || [];
            MP.productsBags = obj.pb || {};

            if (obj.csd) {
                MP.cookieSyncDates = obj.csd;
            }
            // Migrate from v1 where userIdentities was an array to v2 where it is an object
            if (Array.isArray(MP.userIdentities)) {
                var arrayToObjectUIMigration = {};
                MP.userIdentities = MP.userIdentities.filter(function(ui) {
                    return ui.hasOwnProperty('Identity') && (typeof(ui.Identity) === 'string' || typeof(ui.Identity) === 'number');
                });
                MP.userIdentities.forEach(function(identity) {
                    if (typeof identity.Identity === 'number') {
                        // convert to string
                        identity.Identity = '' + identity.Identity;
                    }
                    arrayToObjectUIMigration[Types.IdentityType.getIdentityName(identity.Type)] = identity.Identity;
                });
                MP.userIdentities = arrayToObjectUIMigration;

                MP.migrationData = {
                    userIdentities: arrayToObjectUIMigration,
                    userAttributes: MP.userAttributes,
                    cartProducts: MP.cartProducts,
                    productsBags: MP.productsBags,
                    cookieSyncDates: MP.cookieSyncDates
                };
            }


        }
        if (MP.isEnabled !== false || MP.isEnabled !== true) {
            MP.isEnabled = true;
        }
    }
    catch (e) {
        Helpers.logDebug(Messages.ErrorMessages.CookieParseError);
    }
}

function determineLocalStorageAvailability() {
    var storage, result;

    try {
        (storage = window.localStorage).setItem('mparticle', 'test');
        result = storage.getItem('mparticle') === 'test';
        storage.removeItem('mparticle');

        if (result && storage) {
            return true;
        } else {
            return false;
        }
    }
    catch (e) {
        return false;
    }
}

function convertInMemoryDataToPersistence() {
    var mpidData = {
        ua: MP.userAttributes,
        ui: MP.userIdentities,
        csd: MP.cookieSyncDates,
        mpid: MP.mpid,
        cp: MP.cartProducts.length <= mParticle.maxProducts ? MP.cartProducts : MP.cartProducts.slice(0, mParticle.maxProducts),
        pb: {}
    };

    for (var bag in MP.productsBags) {
        if (MP.productsBags[bag].length > mParticle.maxProducts) {
            mpidData.pb[bag] = MP.productsBags[bag].slice(0, mParticle.maxProducts);
        } else {
            mpidData.pb[bag] = MP.productsBags[bag];
        }
    }

    return mpidData;
}

function setLocalStorage() {
    var key = MP.Config.LocalStorageName,
        currentMPIDData = this.convertInMemoryDataToPersistence(),
        localStorageData = this.getLocalStorage() || {};

    localStorageData.globalSettings = localStorageData.globalSettings || {};

    if (MP.sessionId) {
        localStorageData.globalSettings.currentSessionMPIDs = MP.currentSessionMPIDs;
    }

    if (MP.mpid) {
        localStorageData[MP.mpid] = currentMPIDData;
        localStorageData.currentUserMPID = MP.mpid;
    }

    localStorageData = this.setGlobalStorageAttributes(localStorageData);

    try {
        window.localStorage.setItem(encodeURIComponent(key), encodeURIComponent(JSON.stringify(localStorageData)));
    }
    catch (e) {
        Helpers.logDebug('Error with setting localStorage item.');
    }
}

function setGlobalStorageAttributes(data) {
    data.globalSettings.sid = MP.sessionId;
    data.globalSettings.ie = MP.isEnabled;
    data.globalSettings.sa = MP.sessionAttributes;
    data.globalSettings.ss = MP.serverSettings;
    data.globalSettings.dt = MP.devToken;
    data.globalSettings.les = MP.dateLastEventSent ? MP.dateLastEventSent.getTime() : null;
    data.globalSettings.av = MP.appVersion;
    data.globalSettings.cgid = MP.clientId;
    data.globalSettings.das = MP.deviceId;
    data.globalSettings.c = MP.context;

    return data;
}

function getLocalStorage() {
    var key = MP.Config.LocalStorageName,
        localStorageData = JSON.parse(decodeURIComponent(window.localStorage.getItem(encodeURIComponent(key)))),
        obj = {},
        j;

    for (j in localStorageData) {
        if (localStorageData.hasOwnProperty(j)) {
            obj[j] = localStorageData[j];
        }
    }

    if (Object.keys(obj).length) {
        return obj;
    }

    return null;
}

function removeLocalStorage() {
    localStorage.removeItem(Constants.DefaultConfig.LocalStorageName);
}

function retrieveDeviceId() {
    if (MP.deviceId) {
        return MP.deviceId;
    } else {
        return this.parseDeviceId(MP.serverSettings);
    }
}

function parseDeviceId(serverSettings) {
    try {
        var paramsObj = {},
            parts;

        if (serverSettings && serverSettings.uid && serverSettings.uid.Value) {
            serverSettings.uid.Value.split('&').forEach(function(param) {
                parts = param.split('=');
                paramsObj[parts[0]] = parts[1];
            });

            if (paramsObj['g']) {
                return paramsObj['g'];
            }
        }

        return Helpers.generateUniqueId();
    }
    catch (e) {
        return Helpers.generateUniqueId();
    }
}

function expireCookies() {
    var date = new Date(),
        expires;

    date.setTime(date.getTime() - (24 * 60 * 60 * 1000));
    expires = '; expires=' + date.toUTCString();
    document.cookie = Constants.DefaultConfig.CookieName + '=' + '' + expires + '; path=/';
}

function getCookie() {
    var cookies = window.document.cookie.split('; '),
        key = MP.Config.CookieName,
        i,
        l,
        parts,
        name,
        cookie,
        result = key ? undefined : {};

    Helpers.logDebug(Messages.InformationMessages.CookieSearch);

    for (i = 0, l = cookies.length; i < l; i++) {
        parts = cookies[i].split('=');
        name = Helpers.decoded(parts.shift());
        cookie = Helpers.decoded(parts.join('='));

        if (key && key === name) {
            result = Helpers.converted(cookie);
            break;
        }

        if (!key) {
            result[name] = Helpers.converted(cookie);
        }
    }

    if (result) {
        Helpers.logDebug(Messages.InformationMessages.CookieFound);
        return JSON.parse(result);
    } else {
        return null;
    }
}

function setCookie() {
    var date = new Date(),
        key = MP.Config.CookieName,
        currentMPIDData = this.convertInMemoryDataToPersistence(),
        expires = new Date(date.getTime() +
            (MP.Config.CookieExpiration * 24 * 60 * 60 * 1000)).toGMTString(),
        domain = MP.Config.CookieDomain ? ';domain=' + MP.Config.CookieDomain : '',
        cookies = this.getCookie() || {};

    cookies.globalSettings = cookies.globalSettings || {};

    if (MP.sessionId) {
        cookies.globalSettings.currentSessionMPIDs = MP.currentSessionMPIDs;
    }

    if (MP.mpid) {
        cookies[MP.mpid] = currentMPIDData;
        cookies.currentUserMPID = MP.mpid;
    }

    cookies = this.setGlobalStorageAttributes(cookies);

    Helpers.logDebug(Messages.InformationMessages.CookieSet);

    window.document.cookie =
        encodeURIComponent(key) + '=' + encodeURIComponent(JSON.stringify(cookies)) +
        ';expires=' + expires +
        ';path=/' +
        domain;
}

function findPrevCookiesBasedOnUI(identityApiData) {
    var cookies = this.getCookie() || this.getLocalStorage();
    var matchedUser;

    if (identityApiData) {
        for (var requestedIdentityType in identityApiData.userIdentities) {
            if (Object.keys(cookies).length) {
                for (var key in cookies) {
                    // any value in cookies that has an MPID key will be an MPID to search through - other keys on the cookie are currentSessionMPIDs and currentMPID which should not be searched
                    if (cookies[key].mpid) {
                        var cookieUIs = cookies[key].ui;
                        for (var cookieUIType in cookieUIs) {
                            if (requestedIdentityType === cookieUIType && identityApiData.userIdentities[requestedIdentityType] === cookieUIs[cookieUIType]) {
                                matchedUser = key;
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    if (matchedUser) {
        this.storeDataInMemory(cookies, matchedUser);
    }
}

module.exports = {
    useLocalStorage: useLocalStorage,
    isLocalStorageAvailable: null,
    initializeStorage: initializeStorage,
    update: update,
    determineLocalStorageAvailability: determineLocalStorageAvailability,
    convertInMemoryDataToPersistence: convertInMemoryDataToPersistence,
    setLocalStorage: setLocalStorage,
    setGlobalStorageAttributes: setGlobalStorageAttributes,
    getLocalStorage: getLocalStorage,
    removeLocalStorage: removeLocalStorage,
    storeDataInMemory: storeDataInMemory,
    retrieveDeviceId: retrieveDeviceId,
    parseDeviceId: parseDeviceId,
    expireCookies: expireCookies,
    getCookie: getCookie,
    setCookie: setCookie,
    findPrevCookiesBasedOnUI: findPrevCookiesBasedOnUI
};
