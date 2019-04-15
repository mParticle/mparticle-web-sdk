var Persistence = require('./persistence'),
    Constants = require('./constants'),
    StorageNames = Constants.StorageNames,
    Helpers = require('./helpers'),
    SDKv2NonMPIDCookieKeys = Constants.SDKv2NonMPIDCookieKeys,
    Base64 = require('./polyfill').Base64,
    CookiesGlobalSettingsKeys = {
        das: 1
    },
    MPIDKeys = {
        ui: 1
    };

//  if there is a cookie or localStorage:
//  1. determine which version it is ('mprtcl-api', 'mprtcl-v2', 'mprtcl-v3', 'mprtcl-v4')
//  2. return if 'mprtcl-v4', otherwise migrate to mprtclv4 schema
 // 3. if 'mprtcl-api', could be JSSDKv2 or JSSDKv1. JSSDKv2 cookie has a 'globalSettings' key on it
function migrate() {
    try {
        migrateCookies();
    } catch (e) {
        Persistence.expireCookies(StorageNames.cookieNameV3);
        Persistence.expireCookies(StorageNames.cookieNameV4);
        Helpers.logDebug('Error migrating cookie: ' + e);
    }

    if (mParticle.Store.isLocalStorageAvailable) {
        try {
            migrateLocalStorage();
        } catch (e) {
            localStorage.removeItem(StorageNames.localStorageNameV3);
            localStorage.removeItem(StorageNames.localStorageNameV4);
            Helpers.logDebug('Error migrating localStorage: ' + e);
        }
    }
}

function migrateCookies() {
    var cookies = window.document.cookie.split('; '),
        foundCookie,
        i,
        l,
        parts,
        name,
        cookie;

    Helpers.logDebug(Constants.Messages.InformationMessages.CookieSearch);

    for (i = 0, l = cookies.length; i < l; i++) {
        parts = cookies[i].split('=');
        name = Helpers.decoded(parts.shift());
        cookie = Helpers.decoded(parts.join('=')),
        foundCookie;

        //most recent version needs no migration
        if (name === mParticle.Store.storageName) {
            return;
        }
        if (name === StorageNames.cookieNameV4) {
            // adds cookies to new namespace, removes previous cookie
            finishCookieMigration(cookie, StorageNames.cookieNameV4);
            if (mParticle.Store.isLocalStorageAvailable) {
                migrateProductsToNameSpace();
            }
            return;
        // migration path for SDKv1CookiesV3, doesn't need to be encoded
        }
        if (name === StorageNames.cookieNameV3) {
            foundCookie = convertSDKv1CookiesV3ToSDKv2CookiesV4(cookie);
            finishCookieMigration(foundCookie, StorageNames.cookieNameV3);
            break;
        }
    }
}

function finishCookieMigration(cookie, cookieName) {
    var date = new Date(),
        cookieDomain = Persistence.getCookieDomain(),
        expires,
        domain;

    expires = new Date(date.getTime() +
    (StorageNames.CookieExpiration * 24 * 60 * 60 * 1000)).toGMTString();

    if (cookieDomain === '') {
        domain = '';
    } else {
        domain = ';domain=' + cookieDomain;
    }

    Helpers.logDebug(Constants.Messages.InformationMessages.CookieSet);

    window.document.cookie =
    encodeURIComponent(mParticle.Store.storageName) + '=' + cookie +
    ';expires=' + expires +
    ';path=/' + domain;

    Persistence.expireCookies(cookieName);
    mParticle.Store.migratingToIDSyncCookies = true;
}

function convertSDKv1CookiesV3ToSDKv2CookiesV4(SDKv1CookiesV3) {
    SDKv1CookiesV3 = Persistence.replacePipesWithCommas(Persistence.replaceApostrophesWithQuotes(SDKv1CookiesV3));
    var parsedSDKv1CookiesV3 = JSON.parse(SDKv1CookiesV3);
    var parsedCookiesV4 = JSON.parse(restructureToV4Cookie(SDKv1CookiesV3));

    if (parsedSDKv1CookiesV3.mpid) {
        parsedCookiesV4.gs.csm.push(parsedSDKv1CookiesV3.mpid);
        // all other values are already encoded, so we have to encode any new values
        parsedCookiesV4.gs.csm = Base64.encode(JSON.stringify(parsedCookiesV4.gs.csm));
        migrateProductsFromSDKv1ToSDKv2CookiesV4(parsedSDKv1CookiesV3, parsedSDKv1CookiesV3.mpid);
    }

    return JSON.stringify(parsedCookiesV4);
}

function restructureToV4Cookie(cookies) {
    try {
        var cookiesV4Schema = { gs: {csm: []} };
        cookies = JSON.parse(cookies);

        for (var key in cookies) {
            if (cookies.hasOwnProperty(key)) {
                if (CookiesGlobalSettingsKeys[key]) {
                    cookiesV4Schema.gs[key] = cookies[key];
                } else if (key === 'mpid') {
                    cookiesV4Schema.cu = cookies[key];
                } else if (cookies.mpid) {
                    cookiesV4Schema[cookies.mpid] = cookiesV4Schema[cookies.mpid] || {};
                    if (MPIDKeys[key]) {
                        cookiesV4Schema[cookies.mpid][key] = cookies[key];
                    }
                }
            }
        }
        return JSON.stringify(cookiesV4Schema);
    }
    catch (e) {
        Helpers.logDebug('Failed to restructure previous cookie into most current cookie schema');
    }
}

function migrateProductsToNameSpace() {
    var lsProdV4Name = StorageNames.localStorageProductsV4;
    var products = localStorage.getItem(StorageNames.localStorageProductsV4);
    localStorage.setItem(mParticle.Store.prodStorageName, products);
    localStorage.removeItem(lsProdV4Name);
}

function migrateProductsFromSDKv1ToSDKv2CookiesV4(cookies, mpid) {
    if (!mParticle.Store.isLocalStorageAvailable) {
        return;
    }

    var localStorageProducts = {};
    localStorageProducts[mpid] = {};
    if (cookies.cp) {
        try {
            localStorageProducts[mpid].cp = JSON.parse(Base64.decode(cookies.cp));
        }
        catch (e) {
            localStorageProducts[mpid].cp = cookies.cp;
        }

        if (!Array.isArray(localStorageProducts[mpid].cp)) {
            localStorageProducts[mpid].cp = [];
        }
    }

    localStorage.setItem(mParticle.Store.prodStorageName, Base64.encode(JSON.stringify(localStorageProducts)));
}

function migrateLocalStorage() {
    var cookies,
        v3LSName = StorageNames.localStorageNameV3,
        v4LSName = StorageNames.localStorageNameV4,
        currentVersionLSData = window.localStorage.getItem(mParticle.Store.storageName),
        v4LSData,
        v3LSData,
        v3LSDataStringCopy;

    if (currentVersionLSData) {
        return;
    }

    v4LSData = window.localStorage.getItem(v4LSName);
    if (v4LSData) {
        finishLSMigration(v4LSData, v4LSName);
        migrateProductsToNameSpace();
        return;
    }

    v3LSData = window.localStorage.getItem(v3LSName);
    if (v3LSData) {
        mParticle.Store.migratingToIDSyncCookies = true;
        v3LSDataStringCopy = v3LSData.slice();
        v3LSData = JSON.parse(Persistence.replacePipesWithCommas(Persistence.replaceApostrophesWithQuotes(v3LSData)));
        // localStorage may contain only products, or the full persistence
        // when there is an MPID on the cookie, it is the full persistence
        if (v3LSData.mpid) {
            v3LSData = JSON.parse(convertSDKv1CookiesV3ToSDKv2CookiesV4(v3LSDataStringCopy));
            finishLSMigration(JSON.stringify(v3LSData), v3LSName);
            return;
        // if no MPID, it is only the products
        } else if ((v3LSData.cp || v3LSData.pb) && !v3LSData.mpid) {
            cookies = Persistence.getCookie();
            if (cookies) {
                migrateProductsFromSDKv1ToSDKv2CookiesV4(v3LSData, cookies.cu);
                localStorage.removeItem(StorageNames.localStorageNameV3);
                return;
            } else {
                localStorage.removeItem(StorageNames.localStorageNameV3);
                return;
            }
        }
    }

    function finishLSMigration(data, lsName) {
        try {
            window.localStorage.setItem(encodeURIComponent(mParticle.Store.storageName), data);
        }
        catch (e) {
            Helpers.logDebug('Error with setting localStorage item.');
        }
        window.localStorage.removeItem(encodeURIComponent(lsName));
    }
}

function convertUIFromArrayToObject(cookie) {
    try {
        if (cookie && Helpers.isObject(cookie)) {
            for (var mpid in cookie) {
                if (cookie.hasOwnProperty(mpid)) {
                    if (!SDKv2NonMPIDCookieKeys[mpid]) {
                        if (cookie[mpid].ui && Array.isArray(cookie[mpid].ui)) {
                            cookie[mpid].ui = cookie[mpid].ui.reduce(function(accum, identity) {
                                if (identity.Type && Helpers.Validators.isStringOrNumber(identity.Identity)) {
                                    accum[identity.Type] = identity.Identity;
                                }
                                return accum;
                            }, {});
                        }
                    }
                }
            }
        }

        return cookie;
    }
    catch (e) {
        Helpers.logDebug('An error ocurred when converting the user identities array to an object', e);
    }
}

module.exports = {
    migrate: migrate,
    convertUIFromArrayToObject: convertUIFromArrayToObject,
    convertSDKv1CookiesV3ToSDKv2CookiesV4: convertSDKv1CookiesV3ToSDKv2CookiesV4
};
