import Constants from './constants';
import Polyfill from './polyfill';

var StorageNames = Constants.StorageNames,
    Base64 = Polyfill.Base64,
    CookiesGlobalSettingsKeys = {
        das: 1,
    },
    MPIDKeys = {
        ui: 1,
    };

export default function Migrations(mpInstance) {
    var self = this;
    //  if there is a cookie or localStorage:
    //  1. determine which version it is ('mprtcl-api', 'mprtcl-v2', 'mprtcl-v3', 'mprtcl-v4')
    //  2. return if 'mprtcl-v4', otherwise migrate to mprtclv4 schema
    // 3. if 'mprtcl-api', could be JSSDKv2 or JSSDKv1. JSSDKv2 cookie has a 'globalSettings' key on it
    this.migrate = function() {
        try {
            migrateCookies();
        } catch (e) {
            mpInstance._Persistence.expireCookies(StorageNames.cookieNameV3);
            mpInstance._Persistence.expireCookies(StorageNames.cookieNameV4);
            mpInstance.Logger.error('Error migrating cookie: ' + e);
        }

        if (mpInstance._Store.isLocalStorageAvailable) {
            try {
                migrateLocalStorage();
            } catch (e) {
                localStorage.removeItem(StorageNames.localStorageNameV3);
                localStorage.removeItem(StorageNames.localStorageNameV4);
                mpInstance.Logger.error('Error migrating localStorage: ' + e);
            }
        }
    };

    function migrateCookies() {
        var cookies = window.document.cookie.split('; '),
            foundCookie,
            i,
            l,
            parts,
            name,
            cookie;

        mpInstance.Logger.verbose(
            Constants.Messages.InformationMessages.CookieSearch
        );

        for (i = 0, l = cookies.length; i < l; i++) {
            try {
                parts = cookies[i].split('=');
                name = mpInstance._Helpers.decoded(parts.shift());
                cookie = mpInstance._Helpers.decoded(parts.join('='));
            } catch (e) {
                mpInstance.Logger.verbose(
                    'Unable to parse cookie: ' + name + '. Skipping.'
                );
            }

            //most recent version needs no migration
            if (name === mpInstance._Store.storageName) {
                return;
            }
            if (name === StorageNames.cookieNameV4) {
                // adds cookies to new namespace, removes previous cookie
                finishCookieMigration(cookie, StorageNames.cookieNameV4);
                if (mpInstance._Store.isLocalStorageAvailable) {
                    migrateProductsToNameSpace();
                }
                return;
                // migration path for SDKv1CookiesV3, doesn't need to be encoded
            }
            if (name === StorageNames.cookieNameV3) {
                foundCookie = self.convertSDKv1CookiesV3ToSDKv2CookiesV4(
                    cookie
                );
                finishCookieMigration(foundCookie, StorageNames.cookieNameV3);
                break;
            }
        }
    }

    function finishCookieMigration(cookie, cookieName) {
        var date = new Date(),
            cookieDomain = mpInstance._Persistence.getCookieDomain(),
            expires,
            domain;

        expires = new Date(
            date.getTime() + StorageNames.CookieExpiration * 24 * 60 * 60 * 1000
        ).toGMTString();

        if (cookieDomain === '') {
            domain = '';
        } else {
            domain = ';domain=' + cookieDomain;
        }

        mpInstance.Logger.verbose(
            Constants.Messages.InformationMessages.CookieSet
        );

        window.document.cookie =
            encodeURIComponent(mpInstance._Store.storageName) +
            '=' +
            cookie +
            ';expires=' +
            expires +
            ';path=/' +
            domain;

        mpInstance._Persistence.expireCookies(cookieName);
        mpInstance._Store.migratingToIDSyncCookies = true;
    }

    this.convertSDKv1CookiesV3ToSDKv2CookiesV4 = function(SDKv1CookiesV3) {
        SDKv1CookiesV3 = mpInstance._Persistence.replacePipesWithCommas(
            mpInstance._Persistence.replaceApostrophesWithQuotes(SDKv1CookiesV3)
        );
        var parsedSDKv1CookiesV3 = JSON.parse(SDKv1CookiesV3);
        var parsedCookiesV4 = JSON.parse(restructureToV4Cookie(SDKv1CookiesV3));

        if (parsedSDKv1CookiesV3.mpid) {
            parsedCookiesV4.gs.csm.push(parsedSDKv1CookiesV3.mpid);
            // all other values are already encoded, so we have to encode any new values
            parsedCookiesV4.gs.csm = Base64.encode(
                JSON.stringify(parsedCookiesV4.gs.csm)
            );
            migrateProductsFromSDKv1ToSDKv2CookiesV4(
                parsedSDKv1CookiesV3,
                parsedSDKv1CookiesV3.mpid
            );
        }

        return JSON.stringify(parsedCookiesV4);
    };

    function restructureToV4Cookie(cookies) {
        try {
            var cookiesV4Schema = { gs: { csm: [] } };
            cookies = JSON.parse(cookies);

            for (var key in cookies) {
                if (cookies.hasOwnProperty(key)) {
                    if (CookiesGlobalSettingsKeys[key]) {
                        cookiesV4Schema.gs[key] = cookies[key];
                    } else if (key === 'mpid') {
                        cookiesV4Schema.cu = cookies[key];
                    } else if (cookies.mpid) {
                        cookiesV4Schema[cookies.mpid] =
                            cookiesV4Schema[cookies.mpid] || {};
                        if (MPIDKeys[key]) {
                            cookiesV4Schema[cookies.mpid][key] = cookies[key];
                        }
                    }
                }
            }
            return JSON.stringify(cookiesV4Schema);
        } catch (e) {
            mpInstance.Logger.error(
                'Failed to restructure previous cookie into most current cookie schema'
            );
        }
    }

    function migrateProductsToNameSpace() {
        var lsProdV4Name = StorageNames.localStorageProductsV4;
        var products = localStorage.getItem(
            StorageNames.localStorageProductsV4
        );
        localStorage.setItem(mpInstance._Store.prodStorageName, products);
        localStorage.removeItem(lsProdV4Name);
    }

    function migrateProductsFromSDKv1ToSDKv2CookiesV4(cookies, mpid) {
        if (!mpInstance._Store.isLocalStorageAvailable) {
            return;
        }

        var localStorageProducts = {};
        localStorageProducts[mpid] = {};
        if (cookies.cp) {
            try {
                localStorageProducts[mpid].cp = JSON.parse(
                    Base64.decode(cookies.cp)
                );
            } catch (e) {
                localStorageProducts[mpid].cp = cookies.cp;
            }

            if (!Array.isArray(localStorageProducts[mpid].cp)) {
                localStorageProducts[mpid].cp = [];
            }
        }

        localStorage.setItem(
            mpInstance._Store.prodStorageName,
            Base64.encode(JSON.stringify(localStorageProducts))
        );
    }

    function migrateLocalStorage() {
        var cookies,
            v3LSName = StorageNames.localStorageNameV3,
            v4LSName = StorageNames.localStorageNameV4,
            currentVersionLSData = window.localStorage.getItem(
                mpInstance._Store.storageName
            ),
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
            mpInstance._Store.migratingToIDSyncCookies = true;
            v3LSDataStringCopy = v3LSData.slice();
            v3LSData = JSON.parse(
                mpInstance._Persistence.replacePipesWithCommas(
                    mpInstance._Persistence.replaceApostrophesWithQuotes(
                        v3LSData
                    )
                )
            );
            // localStorage may contain only products, or the full persistence
            // when there is an MPID on the cookie, it is the full persistence
            if (v3LSData.mpid) {
                v3LSData = JSON.parse(
                    self.convertSDKv1CookiesV3ToSDKv2CookiesV4(
                        v3LSDataStringCopy
                    )
                );
                finishLSMigration(JSON.stringify(v3LSData), v3LSName);
                return;
                // if no MPID, it is only the products
            } else if ((v3LSData.cp || v3LSData.pb) && !v3LSData.mpid) {
                cookies = mpInstance._Persistence.getCookie();
                if (cookies) {
                    migrateProductsFromSDKv1ToSDKv2CookiesV4(
                        v3LSData,
                        cookies.cu
                    );
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
                window.localStorage.setItem(
                    encodeURIComponent(mpInstance._Store.storageName),
                    data
                );
            } catch (e) {
                mpInstance.Logger.error(
                    'Error with setting localStorage item.'
                );
            }
            window.localStorage.removeItem(encodeURIComponent(lsName));
        }
    }
}
