var Persistence = require('./persistence'),
    Constants = require('./constants'),
    Types = require('./types'),
    Helpers = require('./helpers'),
    MP = require('./mp'),
    Config = MP.Config,
    SDKv2NonMPIDCookieKeys = Constants.SDKv2NonMPIDCookieKeys,
    Base64 = require('./polyfill').Base64,
    CookiesGlobalSettingsKeys = {
        currentSessionMPIDs: 1,
        csm: 1,
        sid: 1,
        isEnabled: 1,
        ie: 1,
        sa: 1,
        ss: 1,
        dt: 1,
        les: 1,
        av: 1,
        cgid: 1,
        das: 1,
        c: 1
    },
    MPIDKeys = {
        ui: 1,
        ua: 1,
        csd: 1
    };

//  if there is a cookie or localStorage:
//  1. determine which version it is ('mprtcl-api', 'mprtcl-v2', 'mprtcl-v3', 'mprtcl-v4')
//  2. return if 'mprtcl-v4', otherwise migrate to mprtclv4 schema
 // 3. if 'mprtcl-api', could be JSSDKv2 or JSSDKv1. JSSDKv2 cookie has a 'globalSettings' key on it
function migrate() {
    try {
        migrateCookies();
    } catch (e) {
        Persistence.expireCookies(Config.CookieNameV3);
        Persistence.expireCookies(Config.CookieNameV4);
        Helpers.logDebug('Error migrating cookie: ' + e);
    }

    if (MP.isLocalStorageAvailable) {
        try {
            migrateLocalStorage();
        } catch (e) {
            localStorage.removeItem(Config.LocalStorageNameV3);
            localStorage.removeItem(Config.LocalStorageNameV4);
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
        if (name === Config.CookieNameV4) {
            break;
        // migration path for SDKv1CookiesV3, doesn't need to be encoded
        } else if (name === Config.CookieNameV3) {
            foundCookie = convertSDKv1CookiesV3ToSDKv2CookiesV4(cookie);
            finishCookieMigration(foundCookie, Config.CookieNameV3);
            break;
        // migration path for SDKv1CookiesV2, needs to be encoded
        } else if (name === Config.CookieNameV2) {
            foundCookie = convertSDKv1CookiesV2ToSDKv2CookiesV4(Helpers.converted(cookie));
            finishCookieMigration(Persistence.encodeCookies(foundCookie), Config.CookieNameV2);
            break;
        // migration path for v1, needs to be encoded
        } else if (name === Config.CookieName) {
            foundCookie = Helpers.converted(cookie);
            if (JSON.parse(foundCookie).globalSettings) {
                // CookieV1 from SDKv2
                foundCookie = convertSDKv2CookiesV1ToSDKv2DecodedCookiesV4(foundCookie);
            } else {
                // CookieV1 from SDKv1
                foundCookie = convertSDKv1CookiesV1ToSDKv2CookiesV4(foundCookie);
            }
            finishCookieMigration(Persistence.encodeCookies(foundCookie), Config.CookieName);
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
    (Config.CookieExpiration * 24 * 60 * 60 * 1000)).toGMTString();

    if (cookieDomain === '') {
        domain = '';
    } else {
        domain = ';domain=' + cookieDomain;
    }

    Helpers.logDebug(Constants.Messages.InformationMessages.CookieSet);

    window.document.cookie =
    encodeURIComponent(Config.CookieNameV4) + '=' + cookie +
    ';expires=' + expires +
    ';path=/' + domain;

    Persistence.expireCookies(cookieName);
    MP.migratingToIDSyncCookies = true;
}

function convertSDKv1CookiesV1ToSDKv2CookiesV4(SDKv1CookiesV1) {
    var parsedCookiesV4 = JSON.parse(restructureToV4Cookie(decodeURIComponent(SDKv1CookiesV1))),
        parsedSDKv1CookiesV1 = JSON.parse(decodeURIComponent(SDKv1CookiesV1));

    // UI was stored as an array previously, we need to convert to an object
    parsedCookiesV4 = convertUIFromArrayToObject(parsedCookiesV4);

    if (parsedSDKv1CookiesV1.mpid) {
        parsedCookiesV4.gs.csm.push(parsedSDKv1CookiesV1.mpid);
        migrateProductsFromSDKv1ToSDKv2CookiesV4(parsedSDKv1CookiesV1, parsedSDKv1CookiesV1.mpid);
    }

    return JSON.stringify(parsedCookiesV4);
}

function convertSDKv1CookiesV2ToSDKv2CookiesV4(SDKv1CookiesV2) {
    // structure of SDKv1CookiesV2 is identital to SDKv1CookiesV1
    return convertSDKv1CookiesV1ToSDKv2CookiesV4(SDKv1CookiesV2);
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

function convertSDKv2CookiesV1ToSDKv2DecodedCookiesV4(SDKv2CookiesV1) {
    try {
        var cookiesV4 = { gs: {}},
            localStorageProducts = {};

        SDKv2CookiesV1 = JSON.parse(SDKv2CookiesV1);
        cookiesV4 = setGlobalSettings(cookiesV4, SDKv2CookiesV1);

        // set each MPID's respective persistence
        for (var mpid in SDKv2CookiesV1) {
            if (!SDKv2NonMPIDCookieKeys[mpid]) {
                cookiesV4[mpid] = {};
                for (var mpidKey in SDKv2CookiesV1[mpid]) {
                    if (SDKv2CookiesV1[mpid].hasOwnProperty(mpidKey)) {
                        if (MPIDKeys[mpidKey]) {
                            if (Helpers.isObject(SDKv2CookiesV1[mpid][mpidKey]) && Object.keys(SDKv2CookiesV1[mpid][mpidKey]).length) {
                                if (mpidKey === 'ui') {
                                    cookiesV4[mpid].ui = {};
                                    for (var typeName in SDKv2CookiesV1[mpid][mpidKey]) {
                                        if (SDKv2CookiesV1[mpid][mpidKey].hasOwnProperty(typeName)) {
                                            cookiesV4[mpid].ui[Types.IdentityType.getIdentityType(typeName)] = SDKv2CookiesV1[mpid][mpidKey][typeName];
                                        }
                                    }
                                } else {
                                    cookiesV4[mpid][mpidKey] = SDKv2CookiesV1[mpid][mpidKey];
                                }
                            }
                        }
                    }
                }

                localStorageProducts[mpid] = {
                    cp: SDKv2CookiesV1[mpid].cp
                };
            }
        }
        if (MP.isLocalStorageAvailable) {
            localStorage.setItem(Config.LocalStorageProductsV4, Base64.encode(JSON.stringify(localStorageProducts)));
        }

        if (SDKv2CookiesV1.currentUserMPID) {
            cookiesV4.cu = SDKv2CookiesV1.currentUserMPID;
        }

        return JSON.stringify(cookiesV4);
    }
    catch (e) {
        Helpers.logDebug('Failed to convert cookies from SDKv2 cookies v1 to SDKv2 cookies v4');
    }
}

// migrate from object containing globalSettings to gs to reduce cookie size
function setGlobalSettings(cookies, SDKv2CookiesV1) {
    if (SDKv2CookiesV1 && SDKv2CookiesV1.globalSettings) {
        for (var key in SDKv2CookiesV1.globalSettings) {
            if (SDKv2CookiesV1.globalSettings.hasOwnProperty(key)) {
                if (key === 'currentSessionMPIDs') {
                    cookies.gs.csm = SDKv2CookiesV1.globalSettings[key];
                } else if (key === 'isEnabled') {
                    cookies.gs.ie = SDKv2CookiesV1.globalSettings[key];
                } else {
                    cookies.gs[key] = SDKv2CookiesV1.globalSettings[key];
                }
            }
        }
    }

    return cookies;
}

function restructureToV4Cookie(cookies) {
    try {
        var cookiesV4Schema = { gs: {csm: []} };
        cookies = JSON.parse(cookies);

        for (var key in cookies) {
            if (cookies.hasOwnProperty(key)) {
                if (CookiesGlobalSettingsKeys[key]) {
                    if (key === 'isEnabled') {
                        cookiesV4Schema.gs.ie = cookies[key];
                    } else {
                        cookiesV4Schema.gs[key] = cookies[key];
                    }
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

function migrateProductsFromSDKv1ToSDKv2CookiesV4(cookies, mpid) {
    if (!MP.isLocalStorageAvailable) {
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

    localStorage.setItem(Config.LocalStorageProductsV4, Base64.encode(JSON.stringify(localStorageProducts)));
}

function migrateLocalStorage() {
    var currentVersionLSName = Config.LocalStorageNameV4,
        cookies,
        v1LSName = Config.LocalStorageName,
        v3LSName = Config.LocalStorageNameV3,
        currentVersionLSData = window.localStorage.getItem(currentVersionLSName),
        v1LSData,
        v3LSData,
        v3LSDataStringCopy;

    if (!currentVersionLSData) {
        v3LSData = window.localStorage.getItem(v3LSName);
        if (v3LSData) {
            MP.migratingToIDSyncCookies = true;
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
                    localStorage.removeItem(Config.LocalStorageNameV3);
                    return;
                } else {
                    localStorage.removeItem(Config.LocalStorageNameV3);
                    return;
                }
            }
        } else {
            v1LSData = JSON.parse(decodeURIComponent(window.localStorage.getItem(v1LSName)));
            if (v1LSData) {
                MP.migratingToIDSyncCookies = true;
                // SDKv2
                if (v1LSData.globalSettings || v1LSData.currentUserMPID) {
                    v1LSData = JSON.parse(convertSDKv2CookiesV1ToSDKv2DecodedCookiesV4(JSON.stringify(v1LSData)));
                    // SDKv1
                    // only products, not full persistence
                } else if ((v1LSData.cp || v1LSData.pb) && !v1LSData.mpid) {
                    cookies = Persistence.getCookie();
                    if (cookies) {
                        migrateProductsFromSDKv1ToSDKv2CookiesV4(v1LSData, cookies.cu);
                        window.localStorage.removeItem(v1LSName);
                        return;
                    } else {
                        window.localStorage.removeItem(v1LSName);
                        return;
                    }
                } else {
                    v1LSData = JSON.parse(convertSDKv1CookiesV1ToSDKv2CookiesV4(JSON.stringify(v1LSData)));
                }

                if (Helpers.isObject(v1LSData) && Object.keys(v1LSData).length) {
                    v1LSData = Persistence.encodeCookies(JSON.stringify(v1LSData));
                    finishLSMigration(v1LSData, v1LSName);
                    return;
                }
            }
        }
    }

    function finishLSMigration(data, lsName) {
        try {
            window.localStorage.setItem(encodeURIComponent(Config.LocalStorageNameV4), data);
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
    convertSDKv1CookiesV1ToSDKv2CookiesV4: convertSDKv1CookiesV1ToSDKv2CookiesV4,
    convertSDKv1CookiesV2ToSDKv2CookiesV4: convertSDKv1CookiesV2ToSDKv2CookiesV4,
    convertSDKv1CookiesV3ToSDKv2CookiesV4: convertSDKv1CookiesV3ToSDKv2CookiesV4,
    convertSDKv2CookiesV1ToSDKv2DecodedCookiesV4: convertSDKv2CookiesV1ToSDKv2DecodedCookiesV4
};
