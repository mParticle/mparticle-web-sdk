import Helpers from './helpers';
import Constants from './constants';
import Polyfill from './polyfill';
import Consent from './consent';

var Base64 = Polyfill.Base64,
    Messages = Constants.Messages,
    Base64CookieKeys = Constants.Base64CookieKeys,
    SDKv2NonMPIDCookieKeys = Constants.SDKv2NonMPIDCookieKeys,
    StorageNames = Constants.StorageNames;

function useLocalStorage() {
    return (
        !mParticle.Store.SDKConfig.useCookieStorage &&
        mParticle.Store.isLocalStorageAvailable
    );
}

function initializeStorage() {
    try {
        var storage,
            localStorageData = getLocalStorage(),
            cookies = getCookie(),
            allData;

        // Determine if there is any data in cookies or localStorage to figure out if it is the first time the browser is loading mParticle
        if (!localStorageData && !cookies) {
            mParticle.Store.isFirstRun = true;
            mParticle.Store.mpid = 0;
        } else {
            mParticle.Store.isFirstRun = false;
        }

        if (!mParticle.Store.isLocalStorageAvailable) {
            mParticle.Store.SDKConfig.useCookieStorage = true;
        }

        if (mParticle.Store.isLocalStorageAvailable) {
            storage = window.localStorage;
            if (mParticle.Store.SDKConfig.useCookieStorage) {
                // For migrating from localStorage to cookies -- If an instance switches from localStorage to cookies, then
                // no mParticle cookie exists yet and there is localStorage. Get the localStorage, set them to cookies, then delete the localStorage item.
                if (localStorageData) {
                    if (cookies) {
                        allData = Helpers.extend(
                            false,
                            localStorageData,
                            cookies
                        );
                    } else {
                        allData = localStorageData;
                    }
                    storage.removeItem(mParticle.Store.storageName);
                } else if (cookies) {
                    allData = cookies;
                }
                storeDataInMemory(allData);
            } else {
                // For migrating from cookie to localStorage -- If an instance is newly switching from cookies to localStorage, then
                // no mParticle localStorage exists yet and there are cookies. Get the cookies, set them to localStorage, then delete the cookies.
                if (cookies) {
                    if (localStorageData) {
                        allData = Helpers.extend(
                            false,
                            localStorageData,
                            cookies
                        );
                    } else {
                        allData = cookies;
                    }
                    storeDataInMemory(allData);
                    expireCookies(mParticle.Store.storageName);
                } else {
                    storeDataInMemory(localStorageData);
                }
            }
        } else {
            storeDataInMemory(cookies);
        }

        try {
            if (mParticle.Store.isLocalStorageAvailable) {
                var encodedProducts = localStorage.getItem(
                    mParticle.Store.prodStorageName
                );

                if (encodedProducts) {
                    var decodedProducts = JSON.parse(
                        Base64.decode(encodedProducts)
                    );
                }
                if (mParticle.Store.mpid) {
                    storeProductsInMemory(
                        decodedProducts,
                        mParticle.Store.mpid
                    );
                }
            }
        } catch (e) {
            if (mParticle.Store.isLocalStorageAvailable) {
                localStorage.removeItem(mParticle.Store.prodStorageName);
            }
            mParticle.Store.cartProducts = [];
            mParticle.Logger.error(
                'Error loading products in initialization: ' + e
            );
        }

        for (var key in allData) {
            if (allData.hasOwnProperty(key)) {
                if (!SDKv2NonMPIDCookieKeys[key]) {
                    mParticle.Store.nonCurrentUserMPIDs[key] = allData[key];
                }
            }
        }
        update();
    } catch (e) {
        if (useLocalStorage() && mParticle.Store.isLocalStorageAvailable) {
            localStorage.removeItem(mParticle.Store.storageName);
        } else {
            expireCookies(mParticle.Store.storageName);
        }
        mParticle.Logger.error('Error initializing storage: ' + e);
    }
}

function update() {
    if (!mParticle.Store.webviewBridgeEnabled) {
        if (mParticle.Store.SDKConfig.useCookieStorage) {
            setCookie();
        }

        setLocalStorage();
    }
}

function storeProductsInMemory(products, mpid) {
    if (products) {
        try {
            mParticle.Store.cartProducts =
                products[mpid] && products[mpid].cp ? products[mpid].cp : [];
        } catch (e) {
            mParticle.Logger.error(Messages.ErrorMessages.CookieParseError);
        }
    }
}

function storeDataInMemory(obj, currentMPID) {
    try {
        if (!obj) {
            mParticle.Logger.verbose(
                Messages.InformationMessages.CookieNotFound
            );
            mParticle.Store.clientId =
                mParticle.Store.clientId || Helpers.generateUniqueId();
            mParticle.Store.deviceId =
                mParticle.Store.deviceId || Helpers.generateUniqueId();
        } else {
            // Set MPID first, then change object to match MPID data
            if (currentMPID) {
                mParticle.Store.mpid = currentMPID;
            } else {
                mParticle.Store.mpid = obj.cu || 0;
            }

            obj.gs = obj.gs || {};

            mParticle.Store.sessionId = obj.gs.sid || mParticle.Store.sessionId;
            mParticle.Store.isEnabled =
                typeof obj.gs.ie !== 'undefined'
                    ? obj.gs.ie
                    : mParticle.Store.isEnabled;
            mParticle.Store.sessionAttributes =
                obj.gs.sa || mParticle.Store.sessionAttributes;
            mParticle.Store.serverSettings =
                obj.gs.ss || mParticle.Store.serverSettings;
            mParticle.Store.devToken = mParticle.Store.devToken || obj.gs.dt;
            mParticle.Store.SDKConfig.appVersion =
                mParticle.Store.SDKConfig.appVersion || obj.gs.av;
            mParticle.Store.clientId =
                obj.gs.cgid ||
                mParticle.Store.clientId ||
                Helpers.generateUniqueId();
            mParticle.Store.deviceId =
                obj.gs.das ||
                mParticle.Store.deviceId ||
                Helpers.generateUniqueId();
            mParticle.Store.integrationAttributes = obj.gs.ia || {};
            mParticle.Store.context = obj.gs.c || mParticle.Store.context;
            mParticle.Store.currentSessionMPIDs =
                obj.gs.csm || mParticle.Store.currentSessionMPIDs;

            mParticle.Store.isLoggedIn = obj.l === true;

            if (obj.gs.les) {
                mParticle.Store.dateLastEventSent = new Date(obj.gs.les);
            }

            if (obj.gs.ssd) {
                mParticle.Store.sessionStartDate = new Date(obj.gs.ssd);
            } else {
                mParticle.Store.sessionStartDate = new Date();
            }

            if (currentMPID) {
                obj = obj[currentMPID];
            } else {
                obj = obj[obj.cu];
            }
        }
    } catch (e) {
        mParticle.Logger.error(Messages.ErrorMessages.CookieParseError);
    }
}

function determineLocalStorageAvailability(storage) {
    var result;

    if (mParticle._forceNoLocalStorage) {
        storage = undefined;
    }

    try {
        storage.setItem('mparticle', 'test');
        result = storage.getItem('mparticle') === 'test';
        storage.removeItem('mparticle');
        return result && storage;
    } catch (e) {
        return false;
    }
}

function getUserProductsFromLS(mpid) {
    if (!mParticle.Store.isLocalStorageAvailable) {
        return [];
    }

    var decodedProducts,
        userProducts,
        parsedProducts,
        encodedProducts = localStorage.getItem(mParticle.Store.prodStorageName);
    if (encodedProducts) {
        decodedProducts = Base64.decode(encodedProducts);
    }
    // if there is an MPID, we are retrieving the user's products, which is an array
    if (mpid) {
        try {
            if (decodedProducts) {
                parsedProducts = JSON.parse(decodedProducts);
            }
            if (
                decodedProducts &&
                parsedProducts[mpid] &&
                parsedProducts[mpid].cp &&
                Array.isArray(parsedProducts[mpid].cp)
            ) {
                userProducts = parsedProducts[mpid].cp;
            } else {
                userProducts = [];
            }
            return userProducts;
        } catch (e) {
            return [];
        }
    } else {
        return [];
    }
}

function getAllUserProductsFromLS() {
    var decodedProducts,
        encodedProducts = localStorage.getItem(mParticle.Store.prodStorageName),
        parsedDecodedProducts;
    if (encodedProducts) {
        decodedProducts = Base64.decode(encodedProducts);
    }
    // returns an object with keys of MPID and values of array of products
    try {
        parsedDecodedProducts = JSON.parse(decodedProducts);
    } catch (e) {
        parsedDecodedProducts = {};
    }

    return parsedDecodedProducts;
}

function setLocalStorage() {
    if (!mParticle.Store.isLocalStorageAvailable) {
        return;
    }

    var key = mParticle.Store.storageName,
        allLocalStorageProducts = getAllUserProductsFromLS(),
        localStorageData = getLocalStorage() || {},
        currentUser = mParticle.Identity.getCurrentUser(),
        mpid = currentUser ? currentUser.getMPID() : null,
        currentUserProducts = {
            cp: allLocalStorageProducts[mpid]
                ? allLocalStorageProducts[mpid].cp
                : [],
        };
    if (mpid) {
        allLocalStorageProducts = allLocalStorageProducts || {};
        allLocalStorageProducts[mpid] = currentUserProducts;
        try {
            window.localStorage.setItem(
                encodeURIComponent(mParticle.Store.prodStorageName),
                Base64.encode(JSON.stringify(allLocalStorageProducts))
            );
        } catch (e) {
            mParticle.Logger.error(
                'Error with setting products on localStorage.'
            );
        }
    }

    if (!mParticle.Store.SDKConfig.useCookieStorage) {
        localStorageData.gs = localStorageData.gs || {};

        localStorageData.l = mParticle.Store.isLoggedIn ? 1 : 0;

        if (mParticle.Store.sessionId) {
            localStorageData.gs.csm = mParticle.Store.currentSessionMPIDs;
        }

        localStorageData.gs.ie = mParticle.Store.isEnabled;

        if (mpid) {
            localStorageData.cu = mpid;
        }

        if (Object.keys(mParticle.Store.nonCurrentUserMPIDs).length) {
            localStorageData = Helpers.extend(
                {},
                localStorageData,
                mParticle.Store.nonCurrentUserMPIDs
            );
            mParticle.Store.nonCurrentUserMPIDs = {};
        }

        localStorageData = setGlobalStorageAttributes(localStorageData);

        try {
            window.localStorage.setItem(
                encodeURIComponent(key),
                encodeCookies(JSON.stringify(localStorageData))
            );
        } catch (e) {
            mParticle.Logger.error('Error with setting localStorage item.');
        }
    }
}

function setGlobalStorageAttributes(data) {
    var store = mParticle.Store;
    data.gs.sid = store.sessionId;
    data.gs.ie = store.isEnabled;
    data.gs.sa = store.sessionAttributes;
    data.gs.ss = store.serverSettings;
    data.gs.dt = store.devToken;
    data.gs.les = store.dateLastEventSent
        ? store.dateLastEventSent.getTime()
        : null;
    data.gs.av = store.SDKConfig.appVersion;
    data.gs.cgid = store.clientId;
    data.gs.das = store.deviceId;
    data.gs.c = store.context;
    data.gs.ssd = store.sessionStartDate
        ? store.sessionStartDate.getTime()
        : null;
    data.gs.ia = store.integrationAttributes;

    return data;
}

function getLocalStorage() {
    if (!mParticle.Store.isLocalStorageAvailable) {
        return null;
    }

    var key = mParticle.Store.storageName,
        localStorageData = decodeCookies(window.localStorage.getItem(key)),
        obj = {},
        j;
    if (localStorageData) {
        localStorageData = JSON.parse(localStorageData);
        for (j in localStorageData) {
            if (localStorageData.hasOwnProperty(j)) {
                obj[j] = localStorageData[j];
            }
        }
    }

    if (Object.keys(obj).length) {
        return obj;
    }

    return null;
}

function removeLocalStorage(localStorageName) {
    localStorage.removeItem(localStorageName);
}

function retrieveDeviceId() {
    if (mParticle.Store.deviceId) {
        return mParticle.Store.deviceId;
    } else {
        return parseDeviceId(mParticle.Store.serverSettings);
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
    } catch (e) {
        return Helpers.generateUniqueId();
    }
}

function expireCookies(cookieName) {
    var date = new Date(),
        expires,
        domain,
        cookieDomain;

    cookieDomain = getCookieDomain();

    if (cookieDomain === '') {
        domain = '';
    } else {
        domain = ';domain=' + cookieDomain;
    }

    date.setTime(date.getTime() - 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
    document.cookie = cookieName + '=' + '' + expires + '; path=/' + domain;
}

function getCookie() {
    var cookies = window.document.cookie.split('; '),
        key = mParticle.Store.storageName,
        i,
        l,
        parts,
        name,
        cookie,
        result = key ? undefined : {};

    mParticle.Logger.verbose(Messages.InformationMessages.CookieSearch);

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
        mParticle.Logger.verbose(Messages.InformationMessages.CookieFound);
        return JSON.parse(decodeCookies(result));
    } else {
        return null;
    }
}

function setCookie() {
    var mpid,
        currentUser = mParticle.Identity.getCurrentUser();
    if (currentUser) {
        mpid = currentUser.getMPID();
    }
    var date = new Date(),
        key = mParticle.Store.storageName,
        cookies = getCookie() || {},
        expires = new Date(
            date.getTime() +
                mParticle.Store.SDKConfig.cookieExpiration * 24 * 60 * 60 * 1000
        ).toGMTString(),
        cookieDomain,
        domain,
        encodedCookiesWithExpirationAndPath;

    cookieDomain = getCookieDomain();

    if (cookieDomain === '') {
        domain = '';
    } else {
        domain = ';domain=' + cookieDomain;
    }

    cookies.gs = cookies.gs || {};

    if (mParticle.Store.sessionId) {
        cookies.gs.csm = mParticle.Store.currentSessionMPIDs;
    }

    if (mpid) {
        cookies.cu = mpid;
    }

    cookies.l = mParticle.Store.isLoggedIn ? 1 : 0;

    cookies = setGlobalStorageAttributes(cookies);

    if (Object.keys(mParticle.Store.nonCurrentUserMPIDs).length) {
        cookies = Helpers.extend(
            {},
            cookies,
            mParticle.Store.nonCurrentUserMPIDs
        );
        mParticle.Store.nonCurrentUserMPIDs = {};
    }

    encodedCookiesWithExpirationAndPath = reduceAndEncodeCookies(
        cookies,
        expires,
        domain,
        mParticle.Store.SDKConfig.maxCookieSize
    );

    mParticle.Logger.verbose(Messages.InformationMessages.CookieSet);

    window.document.cookie =
        encodeURIComponent(key) + '=' + encodedCookiesWithExpirationAndPath;
}

/*  This function determines if a cookie is greater than the configured maxCookieSize.
        - If it is, we remove an MPID and its associated UI/UA/CSD from the cookie.
        - Once removed, check size, and repeat.
        - Never remove the currentUser's MPID from the cookie.

    MPID removal priority:
    1. If there are no currentSessionMPIDs, remove a random MPID from the the cookie.
    2. If there are currentSessionMPIDs:
        a. Remove at random MPIDs on the cookie that are not part of the currentSessionMPIDs
        b. Then remove MPIDs based on order in currentSessionMPIDs array, which
        stores MPIDs based on earliest login.
*/
function reduceAndEncodeCookies(cookies, expires, domain, maxCookieSize) {
    var encodedCookiesWithExpirationAndPath,
        currentSessionMPIDs = cookies.gs.csm ? cookies.gs.csm : [];
    // Comment 1 above
    if (!currentSessionMPIDs.length) {
        for (var key in cookies) {
            if (cookies.hasOwnProperty(key)) {
                encodedCookiesWithExpirationAndPath = createFullEncodedCookie(
                    cookies,
                    expires,
                    domain
                );
                if (
                    encodedCookiesWithExpirationAndPath.length > maxCookieSize
                ) {
                    if (!SDKv2NonMPIDCookieKeys[key] && key !== cookies.cu) {
                        delete cookies[key];
                    }
                }
            }
        }
    } else {
        // Comment 2 above - First create an object of all MPIDs on the cookie
        var MPIDsOnCookie = {};
        for (var potentialMPID in cookies) {
            if (cookies.hasOwnProperty(potentialMPID)) {
                if (
                    !SDKv2NonMPIDCookieKeys[potentialMPID] &&
                    potentialMPID !== cookies.cu
                ) {
                    MPIDsOnCookie[potentialMPID] = 1;
                }
            }
        }
        // Comment 2a above
        if (Object.keys(MPIDsOnCookie).length) {
            for (var mpid in MPIDsOnCookie) {
                encodedCookiesWithExpirationAndPath = createFullEncodedCookie(
                    cookies,
                    expires,
                    domain
                );
                if (
                    encodedCookiesWithExpirationAndPath.length > maxCookieSize
                ) {
                    if (MPIDsOnCookie.hasOwnProperty(mpid)) {
                        if (currentSessionMPIDs.indexOf(mpid) === -1) {
                            delete cookies[mpid];
                        }
                    }
                }
            }
        }
        // Comment 2b above
        for (var i = 0; i < currentSessionMPIDs.length; i++) {
            encodedCookiesWithExpirationAndPath = createFullEncodedCookie(
                cookies,
                expires,
                domain
            );
            if (encodedCookiesWithExpirationAndPath.length > maxCookieSize) {
                var MPIDtoRemove = currentSessionMPIDs[i];
                if (cookies[MPIDtoRemove]) {
                    mParticle.Logger.verbose(
                        'Size of new encoded cookie is larger than maxCookieSize setting of ' +
                            maxCookieSize +
                            '. Removing from cookie the earliest logged in MPID containing: ' +
                            JSON.stringify(cookies[MPIDtoRemove], 0, 2)
                    );
                    delete cookies[MPIDtoRemove];
                } else {
                    mParticle.Logger.error(
                        'Unable to save MPID data to cookies because the resulting encoded cookie is larger than the maxCookieSize setting of ' +
                            maxCookieSize +
                            '. We recommend using a maxCookieSize of 1500.'
                    );
                }
            } else {
                break;
            }
        }
    }

    return encodedCookiesWithExpirationAndPath;
}

function createFullEncodedCookie(cookies, expires, domain) {
    return (
        encodeCookies(JSON.stringify(cookies)) +
        ';expires=' +
        expires +
        ';path=/' +
        domain
    );
}

function findPrevCookiesBasedOnUI(identityApiData) {
    var cookies = getCookie() || getLocalStorage();
    var matchedUser;

    if (identityApiData) {
        for (var requestedIdentityType in identityApiData.userIdentities) {
            if (cookies && Object.keys(cookies).length) {
                for (var key in cookies) {
                    // any value in cookies that has an MPID key will be an MPID to search through
                    // other keys on the cookie are currentSessionMPIDs and currentMPID which should not be searched
                    if (cookies[key].mpid) {
                        var cookieUIs = cookies[key].ui;
                        for (var cookieUIType in cookieUIs) {
                            if (
                                requestedIdentityType === cookieUIType &&
                                identityApiData.userIdentities[
                                    requestedIdentityType
                                ] === cookieUIs[cookieUIType]
                            ) {
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
        storeDataInMemory(cookies, matchedUser);
    }
}

function encodeCookies(cookie) {
    cookie = JSON.parse(cookie);
    for (var key in cookie.gs) {
        if (cookie.gs.hasOwnProperty(key)) {
            if (Base64CookieKeys[key]) {
                if (cookie.gs[key]) {
                    // base64 encode any value that is an object or Array in globalSettings
                    if (
                        (Array.isArray(cookie.gs[key]) &&
                            cookie.gs[key].length) ||
                        (Helpers.isObject(cookie.gs[key]) &&
                            Object.keys(cookie.gs[key]).length)
                    ) {
                        cookie.gs[key] = Base64.encode(
                            JSON.stringify(cookie.gs[key])
                        );
                    } else {
                        delete cookie.gs[key];
                    }
                } else {
                    delete cookie.gs[key];
                }
            } else if (key === 'ie') {
                cookie.gs[key] = cookie.gs[key] ? 1 : 0;
            } else if (!cookie.gs[key]) {
                delete cookie.gs[key];
            }
        }
    }

    for (var mpid in cookie) {
        if (cookie.hasOwnProperty(mpid)) {
            if (!SDKv2NonMPIDCookieKeys[mpid]) {
                for (key in cookie[mpid]) {
                    if (cookie[mpid].hasOwnProperty(key)) {
                        if (Base64CookieKeys[key]) {
                            if (
                                Helpers.isObject(cookie[mpid][key]) &&
                                Object.keys(cookie[mpid][key]).length
                            ) {
                                cookie[mpid][key] = Base64.encode(
                                    JSON.stringify(cookie[mpid][key])
                                );
                            } else {
                                delete cookie[mpid][key];
                            }
                        }
                    }
                }
            }
        }
    }

    return createCookieString(JSON.stringify(cookie));
}

function decodeCookies(cookie) {
    try {
        if (cookie) {
            cookie = JSON.parse(revertCookieString(cookie));
            if (Helpers.isObject(cookie) && Object.keys(cookie).length) {
                for (var key in cookie.gs) {
                    if (cookie.gs.hasOwnProperty(key)) {
                        if (Base64CookieKeys[key]) {
                            cookie.gs[key] = JSON.parse(
                                Base64.decode(cookie.gs[key])
                            );
                        } else if (key === 'ie') {
                            cookie.gs[key] = Boolean(cookie.gs[key]);
                        }
                    }
                }

                for (var mpid in cookie) {
                    if (cookie.hasOwnProperty(mpid)) {
                        if (!SDKv2NonMPIDCookieKeys[mpid]) {
                            for (key in cookie[mpid]) {
                                if (cookie[mpid].hasOwnProperty(key)) {
                                    if (Base64CookieKeys[key]) {
                                        if (cookie[mpid][key].length) {
                                            cookie[mpid][key] = JSON.parse(
                                                Base64.decode(cookie[mpid][key])
                                            );
                                        }
                                    }
                                }
                            }
                        } else if (mpid === 'l') {
                            cookie[mpid] = Boolean(cookie[mpid]);
                        }
                    }
                }
            }

            return JSON.stringify(cookie);
        }
    } catch (e) {
        mParticle.Logger.error('Problem with decoding cookie', e);
    }
}

function replaceCommasWithPipes(string) {
    return string.replace(/,/g, '|');
}

function replacePipesWithCommas(string) {
    return string.replace(/\|/g, ',');
}

function replaceApostrophesWithQuotes(string) {
    return string.replace(/\'/g, '"');
}

function replaceQuotesWithApostrophes(string) {
    return string.replace(/\"/g, "'");
}

function createCookieString(string) {
    return replaceCommasWithPipes(replaceQuotesWithApostrophes(string));
}

function revertCookieString(string) {
    return replacePipesWithCommas(replaceApostrophesWithQuotes(string));
}

function getCookieDomain() {
    if (mParticle.Store.SDKConfig.cookieDomain) {
        return mParticle.Store.SDKConfig.cookieDomain;
    } else {
        var rootDomain = getDomain(document, location.hostname);
        if (rootDomain === '') {
            return '';
        } else {
            return '.' + rootDomain;
        }
    }
}

// This function loops through the parts of a full hostname, attempting to set a cookie on that domain. It will set a cookie at the highest level possible.
// For example subdomain.domain.co.uk would try the following combinations:
// "co.uk" -> fail
// "domain.co.uk" -> success, return
// "subdomain.domain.co.uk" -> skipped, because already found
function getDomain(doc, locationHostname) {
    var i,
        testParts,
        mpTest = 'mptest=cookie',
        hostname = locationHostname.split('.');
    for (i = hostname.length - 1; i >= 0; i--) {
        testParts = hostname.slice(i).join('.');
        doc.cookie = mpTest + ';domain=.' + testParts + ';';
        if (doc.cookie.indexOf(mpTest) > -1) {
            doc.cookie =
                mpTest.split('=')[0] +
                '=;domain=.' +
                testParts +
                ';expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            return testParts;
        }
    }
    return '';
}

function getUserIdentities(mpid) {
    var cookies = getPersistence();

    if (cookies && cookies[mpid] && cookies[mpid].ui) {
        return cookies[mpid].ui;
    } else {
        return {};
    }
}

function getAllUserAttributes(mpid) {
    var cookies = getPersistence();

    if (cookies && cookies[mpid] && cookies[mpid].ua) {
        return cookies[mpid].ua;
    } else {
        return {};
    }
}

function getCartProducts(mpid) {
    var allCartProducts,
        cartProductsString = localStorage.getItem(
            mParticle.Store.prodStorageName
        );
    if (cartProductsString) {
        allCartProducts = JSON.parse(Base64.decode(cartProductsString));
        if (
            allCartProducts &&
            allCartProducts[mpid] &&
            allCartProducts[mpid].cp
        ) {
            return allCartProducts[mpid].cp;
        }
    }

    return [];
}

function setCartProducts(allProducts) {
    if (!mParticle.Store.isLocalStorageAvailable) {
        return;
    }

    try {
        window.localStorage.setItem(
            encodeURIComponent(mParticle.Store.prodStorageName),
            Base64.encode(JSON.stringify(allProducts))
        );
    } catch (e) {
        mParticle.Logger.error('Error with setting products on localStorage.');
    }
}
function saveUserIdentitiesToCookies(mpid, userIdentities) {
    if (userIdentities) {
        var cookies = getPersistence();
        if (cookies) {
            if (cookies[mpid]) {
                cookies[mpid].ui = userIdentities;
            } else {
                cookies[mpid] = {
                    ui: userIdentities,
                };
            }
            saveCookies(cookies);
        }
    }
}

function saveUserAttributesToCookies(mpid, userAttributes) {
    var cookies = getPersistence();
    if (userAttributes) {
        if (cookies) {
            if (cookies[mpid]) {
                cookies[mpid].ui = userAttributes;
            } else {
                cookies[mpid] = {
                    ui: userAttributes,
                };
            }
        }
        saveCookies(cookies);
    }
}

function saveUserCookieSyncDatesToCookies(mpid, csd) {
    if (csd) {
        var cookies = getPersistence();
        if (cookies) {
            if (cookies[mpid]) {
                cookies[mpid].csd = csd;
            } else {
                cookies[mpid] = {
                    csd: csd,
                };
            }
        }
        saveCookies(cookies);
    }
}

function saveUserConsentStateToCookies(mpid, consentState) {
    //it's currently not supported to set persistence
    //for any MPID that's not the current one.
    if (consentState || consentState === null) {
        var cookies = getPersistence();
        if (cookies) {
            if (cookies[mpid]) {
                cookies[mpid].con = Consent.Serialization.toMinifiedJsonObject(
                    consentState
                );
            } else {
                cookies[mpid] = {
                    con: Consent.Serialization.toMinifiedJsonObject(
                        consentState
                    ),
                };
            }
            saveCookies(cookies);
        }
    }
}

function saveCookies(cookies) {
    var encodedCookies = encodeCookies(JSON.stringify(cookies)),
        date = new Date(),
        key = mParticle.Store.storageName,
        expires = new Date(
            date.getTime() +
                mParticle.Store.SDKConfig.cookieExpiration * 24 * 60 * 60 * 1000
        ).toGMTString(),
        cookieDomain = getCookieDomain(),
        domain;

    if (cookieDomain === '') {
        domain = '';
    } else {
        domain = ';domain=' + cookieDomain;
    }

    if (mParticle.Store.SDKConfig.useCookieStorage) {
        var encodedCookiesWithExpirationAndPath = reduceAndEncodeCookies(
            cookies,
            expires,
            domain,
            mParticle.Store.SDKConfig.maxCookieSize
        );
        window.document.cookie =
            encodeURIComponent(key) + '=' + encodedCookiesWithExpirationAndPath;
    } else {
        if (mParticle.Store.isLocalStorageAvailable) {
            localStorage.setItem(mParticle.Store.storageName, encodedCookies);
        }
    }
}

function getPersistence() {
    var cookies;
    if (mParticle.Store.SDKConfig.useCookieStorage) {
        cookies = getCookie();
    } else {
        cookies = getLocalStorage();
    }

    return cookies;
}

function getConsentState(mpid) {
    var cookies = getPersistence();

    if (cookies && cookies[mpid] && cookies[mpid].con) {
        return Consent.Serialization.fromMinifiedJsonObject(cookies[mpid].con);
    } else {
        return null;
    }
}

function getFirstSeenTime(mpid) {
    if (!mpid) {
        return null;
    }
    var cookies = getPersistence();
    if (cookies && cookies[mpid] && cookies[mpid].fst) {
        return cookies[mpid].fst;
    } else {
        return null;
    }
}

/**
 * set the "first seen" time for a user. the time will only be set once for a given
 * mpid after which subsequent calls will be ignored
 */
function setFirstSeenTime(mpid, time) {
    if (!mpid) {
        return;
    }
    if (!time) {
        time = new Date().getTime();
    }
    var cookies = getPersistence();
    if (cookies) {
        if (!cookies[mpid]) {
            cookies[mpid] = {};
        }
        if (!cookies[mpid].fst) {
            cookies[mpid].fst = time;
            saveCookies(cookies);
        }
    }
}

/**
 * returns the "last seen" time for a user. If the mpid represents the current user, the
 * return value will always be the current time, otherwise it will be to stored "last seen"
 * time
 */
function getLastSeenTime(mpid) {
    if (!mpid) {
        return null;
    }
    if (mpid === mParticle.Identity.getCurrentUser().getMPID()) {
        //if the mpid is the current user, its last seen time is the current time
        return new Date().getTime();
    } else {
        var cookies = getPersistence();
        if (cookies && cookies[mpid] && cookies[mpid].lst) {
            return cookies[mpid].lst;
        }
        return null;
    }
}

function setLastSeenTime(mpid, time) {
    if (!mpid) {
        return;
    }
    if (!time) {
        time = new Date().getTime();
    }
    var cookies = getPersistence();
    if (cookies && cookies[mpid]) {
        cookies[mpid].lst = time;
        saveCookies(cookies);
    }
}

function getDeviceId() {
    return mParticle.Store.deviceId;
}

function resetPersistence() {
    removeLocalStorage(StorageNames.localStorageName);
    removeLocalStorage(StorageNames.localStorageNameV3);
    removeLocalStorage(StorageNames.localStorageNameV4);
    removeLocalStorage(mParticle.Store.prodStorageName);
    removeLocalStorage(StorageNames.localStorageProductsV4);

    expireCookies(StorageNames.cookieName);
    expireCookies(StorageNames.cookieNameV2);
    expireCookies(StorageNames.cookieNameV3);
    expireCookies(StorageNames.cookieNameV4);
    if (mParticle._isTestEnv) {
        var testWorkspaceToken = 'abcdef';
        removeLocalStorage(Helpers.createMainStorageName(testWorkspaceToken));
        expireCookies(Helpers.createMainStorageName(testWorkspaceToken));
        removeLocalStorage(
            Helpers.createProductStorageName(testWorkspaceToken)
        );
    }
}

// Forwarder Batching Code
var forwardingStatsBatches = {
    uploadsTable: {},
    forwardingStatsEventQueue: [],
};

export default {
    useLocalStorage: useLocalStorage,
    initializeStorage: initializeStorage,
    update: update,
    determineLocalStorageAvailability: determineLocalStorageAvailability,
    getUserProductsFromLS: getUserProductsFromLS,
    getAllUserProductsFromLS: getAllUserProductsFromLS,
    setLocalStorage: setLocalStorage,
    getLocalStorage: getLocalStorage,
    storeDataInMemory: storeDataInMemory,
    retrieveDeviceId: retrieveDeviceId,
    parseDeviceId: parseDeviceId,
    expireCookies: expireCookies,
    getCookie: getCookie,
    setCookie: setCookie,
    reduceAndEncodeCookies: reduceAndEncodeCookies,
    findPrevCookiesBasedOnUI: findPrevCookiesBasedOnUI,
    replaceCommasWithPipes: replaceCommasWithPipes,
    replacePipesWithCommas: replacePipesWithCommas,
    replaceApostrophesWithQuotes: replaceApostrophesWithQuotes,
    replaceQuotesWithApostrophes: replaceQuotesWithApostrophes,
    createCookieString: createCookieString,
    revertCookieString: revertCookieString,
    decodeCookies: decodeCookies,
    getCookieDomain: getCookieDomain,
    getUserIdentities: getUserIdentities,
    getAllUserAttributes: getAllUserAttributes,
    getCartProducts: getCartProducts,
    setCartProducts: setCartProducts,
    saveCookies: saveCookies,
    saveUserIdentitiesToCookies: saveUserIdentitiesToCookies,
    saveUserAttributesToCookies: saveUserAttributesToCookies,
    saveUserCookieSyncDatesToCookies: saveUserCookieSyncDatesToCookies,
    saveUserConsentStateToCookies: saveUserConsentStateToCookies,
    getPersistence: getPersistence,
    getDeviceId: getDeviceId,
    resetPersistence: resetPersistence,
    getConsentState: getConsentState,
    forwardingStatsBatches: forwardingStatsBatches,
    getFirstSeenTime: getFirstSeenTime,
    getLastSeenTime: getLastSeenTime,
    setFirstSeenTime: setFirstSeenTime,
    setLastSeenTime: setLastSeenTime,
};
