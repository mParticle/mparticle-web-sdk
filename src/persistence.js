var Helpers = require('./helpers'),
    Constants = require('./constants'),
    Base64 = require('./polyfill').Base64,
    Messages = Constants.Messages,
    MP = require('./mp'),
    Base64CookieKeys = Constants.Base64CookieKeys,
    SDKv2NonMPIDCookieKeys = Constants.SDKv2NonMPIDCookieKeys;

function useLocalStorage() {
    return (!mParticle.useCookieStorage && determineLocalStorageAvailability());
}

function initializeStorage() {
    var storage,
        localStorageData = this.getLocalStorage(),
        cookies = this.getCookie(),
        allData;

    // Determine if there is any data in cookies or localStorage to figure out if it is the first time the browser is loading mParticle
    if (!localStorageData && !cookies) {
        MP.isFirstRun = true;
        MP.mpid = 0;
    } else {
        MP.isFirstRun = false;
    }

    // Check to see if localStorage is available and if not, always use cookies
    this.isLocalStorageAvailable = this.determineLocalStorageAvailability();

    if (!this.isLocalStorageAvailable) {
        mParticle.useCookieStorage = true;
    }

    if (this.isLocalStorageAvailable) {
        storage = window.localStorage;
        if (mParticle.useCookieStorage) {
            // For migrating from localStorage to cookies -- If an instance switches from localStorage to cookies, then
            // no mParticle cookie exists yet and there is localStorage. Get the localStorage, set them to cookies, then delete the localStorage item.
            if (localStorageData) {
                if (cookies) {
                    allData = Helpers.extend(false, localStorageData, cookies);
                } else {
                    allData = localStorageData;
                }
                storage.removeItem(MP.Config.LocalStorageNameV4);
            } else if (cookies) {
                allData = cookies;
            }
            this.storeDataInMemory(allData);
        }
        else {
            // For migrating from cookie to localStorage -- If an instance is newly switching from cookies to localStorage, then
            // no mParticle localStorage exists yet and there are cookies. Get the cookies, set them to localStorage, then delete the cookies.
            if (cookies) {
                if (localStorageData) {
                    allData = Helpers.extend(false, localStorageData, cookies);
                } else {
                    allData = cookies;
                }
                this.storeDataInMemory(allData);
                this.expireCookies(MP.Config.CookieNameV4);
            } else {
                this.storeDataInMemory(localStorageData);
            }
        }
    } else {
        this.storeDataInMemory(cookies);
    }

    var encodedProducts = localStorage.getItem(MP.Config.LocalStorageProductsV4);

    if (encodedProducts) {
        var decodedProducts = JSON.parse(Base64.decode(encodedProducts));
    }

    if (MP.mpid) {
        storeProductsInMemory(decodedProducts, MP.mpid);
    }

    this.update();
}

function update() {
    if (mParticle.useCookieStorage) {
        this.setCookie();
    }

    this.setLocalStorage();
}

function storeProductsInMemory(products, mpid) {
    try {
        MP.cartProducts = products[mpid] && products[mpid].cp ? products[mpid].cp : [];
    }
    catch(e) {
        Helpers.logDebug(Messages.ErrorMessages.CookieParseError);
    }
}

function storeDataInMemory(obj, currentMPID) {
    try {
        if (!obj) {
            Helpers.logDebug(Messages.InformationMessages.CookieNotFound);
            MP.clientId = MP.clientId || Helpers.generateUniqueId();
            MP.deviceId = MP.deviceId || Helpers.generateUniqueId();
            MP.userAttributes = {};
            MP.userIdentities = {};
            MP.cookieSyncDates = {};
        } else {
            // Set MPID first, then change object to match MPID data
            if (currentMPID) {
                MP.mpid = currentMPID;
            } else {
                MP.mpid = obj.cu || 0;
            }

            obj.gs = obj.gs || {};

            MP.sessionId = obj.gs.sid || MP.sessionId;
            MP.isEnabled = (typeof obj.gs.ie !== 'undefined') ? obj.gs.ie : MP.isEnabled;
            MP.sessionAttributes = obj.gs.sa || MP.sessionAttributes;
            MP.serverSettings = obj.gs.ss || MP.serverSettings;
            MP.devToken = obj.gs.dt || MP.devToken;
            MP.appVersion = obj.gs.av || MP.appVersion;
            MP.clientId = obj.gs.cgid || MP.clientId || Helpers.generateUniqueId();
            MP.deviceId = obj.gs.das || MP.deviceId || Helpers.generateUniqueId();
            MP.context = obj.gs.c || MP.context;
            MP.currentSessionMPIDs = obj.gs.csm || MP.currentSessionMPIDs;

            if (obj.gs.les) {
                MP.dateLastEventSent = new Date(obj.gs.les);
            }

            if (obj.gs.ssd) {
                MP.sessionStartDate = new Date(obj.gs.ssd);
            } else {
                MP.sessionStartDate = new Date();
            }

            if (currentMPID) {
                obj = obj[currentMPID];
            } else {
                obj = obj[obj.cu];
            }

            MP.userAttributes = obj.ua || MP.userAttributes;
            MP.userIdentities = obj.ui || MP.userIdentities;

            if (obj.csd) {
                MP.cookieSyncDates = obj.csd;
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

function convertInMemoryDataForCookies() {
    var mpidData = {
        ua: MP.userAttributes,
        ui: MP.userIdentities,
        csd: MP.cookieSyncDates
    };

    return mpidData;
}

function convertProductsForLocalStorage() {
    var inMemoryDataForLocalStorage = {
        cp: MP.cartProducts ? MP.cartProducts.length <= mParticle.maxProducts ? MP.cartProducts : MP.cartProducts.slice(0, mParticle.maxProducts) : []
    };

    return inMemoryDataForLocalStorage;
}

function getLocalStorageProducts() {
    var products = localStorage.getItem(MP.Config.LocalStorageProductsV4);
    if (products) {
        return Base64.decode(products);
    }
    return products;
}

function setLocalStorage() {
    var key = MP.Config.LocalStorageNameV4,
        localStorageProducts = getLocalStorageProducts(),
        currentUserProducts = this.convertProductsForLocalStorage(),
        localStorageData = this.getLocalStorage() || {},
        currentMPIDData;

    if (MP.mpid) {
        localStorageProducts = localStorageProducts ? JSON.parse(localStorageProducts) : {};
        localStorageProducts[MP.mpid] = currentUserProducts;
        try {
            window.localStorage.setItem(encodeURIComponent(MP.Config.LocalStorageProductsV4), Base64.encode(JSON.stringify(localStorageProducts)));
        }
        catch (e) {
            Helpers.logDebug('Error with setting products on localStorage.');
        }
    }


    if (!mParticle.useCookieStorage) {
        currentMPIDData = this.convertInMemoryDataForCookies();
        localStorageData.gs = localStorageData.gs || {};

        if (MP.sessionId) {
            localStorageData.gs.csm = MP.currentSessionMPIDs;
        }

        if (MP.mpid) {
            localStorageData[MP.mpid] = currentMPIDData;
            localStorageData.cu = MP.mpid;
        }
        localStorageData = this.setGlobalStorageAttributes(localStorageData);

        try {
            window.localStorage.setItem(encodeURIComponent(key), encodeCookies(JSON.stringify(localStorageData)));
        }
        catch (e) {
            Helpers.logDebug('Error with setting localStorage item.');
        }
    }
}

function setGlobalStorageAttributes(data) {
    data.gs.sid = MP.sessionId;
    data.gs.ie = MP.isEnabled;
    data.gs.sa = MP.sessionAttributes;
    data.gs.ss = MP.serverSettings;
    data.gs.dt = MP.devToken;
    data.gs.les = MP.dateLastEventSent ? MP.dateLastEventSent.getTime() : null;
    data.gs.av = MP.appVersion;
    data.gs.cgid = MP.clientId;
    data.gs.das = MP.deviceId;
    data.gs.c = MP.context;
    data.gs.ssd = MP.sessionStartDate ? MP.sessionStartDate.getTime() : null;

    return data;
}

function getLocalStorage() {
    var key = MP.Config.LocalStorageNameV4,
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

    date.setTime(date.getTime() - (24 * 60 * 60 * 1000));
    expires = '; expires=' + date.toUTCString();
    document.cookie = cookieName + '=' + '' + expires + '; path=/' + domain;
}

function getCookie() {
    var cookies = window.document.cookie.split('; '),
        key = MP.Config.CookieNameV4,
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
        return JSON.parse(decodeCookies(result));
    } else {
        return null;
    }
}

function setCookie() {
    var date = new Date(),
        key = MP.Config.CookieNameV4,
        currentMPIDData = this.convertInMemoryDataForCookies(),
        expires = new Date(date.getTime() +
            (MP.Config.CookieExpiration * 24 * 60 * 60 * 1000)).toGMTString(),
        cookieDomain,
        domain,
        cookies = this.getCookie() || {},
        encodedCookiesWithExpirationAndPath;

    cookieDomain = getCookieDomain();

    if (cookieDomain === '') {
        domain = '';
    } else {
        domain = ';domain=' + cookieDomain;
    }

    cookies.gs = cookies.gs || {};

    if (MP.sessionId) {
        cookies.gs.csm = MP.currentSessionMPIDs;
    }

    if (MP.mpid) {
        cookies[MP.mpid] = currentMPIDData;
        cookies.cu = MP.mpid;
    }

    cookies = this.setGlobalStorageAttributes(cookies);

    encodedCookiesWithExpirationAndPath = reduceAndEncodeCookies(cookies, expires, domain);

    Helpers.logDebug(Messages.InformationMessages.CookieSet);

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
function reduceAndEncodeCookies(cookies, expires, domain) {
    var encodedCookiesWithExpirationAndPath,
        currentSessionMPIDs = cookies.gs.csm ? cookies.gs.csm : [];
    // Comment 1 above
    if (!currentSessionMPIDs.length) {
        for (var key in cookies) {
            if (cookies.hasOwnProperty(key)) {
                encodedCookiesWithExpirationAndPath = createFullEncodedCookie(cookies, expires, domain);
                if (encodedCookiesWithExpirationAndPath.length > mParticle.maxCookieSize) {
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
                if (!SDKv2NonMPIDCookieKeys[potentialMPID] && potentialMPID !==cookies.cu) {
                    MPIDsOnCookie[potentialMPID] = 1;
                }
            }
        }
        // Comment 2a above
        if (Object.keys(MPIDsOnCookie).length) {
            for (var mpid in MPIDsOnCookie) {
                encodedCookiesWithExpirationAndPath = createFullEncodedCookie(cookies, expires, domain);
                if (encodedCookiesWithExpirationAndPath.length > mParticle.maxCookieSize) {
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
            encodedCookiesWithExpirationAndPath = createFullEncodedCookie(cookies, expires, domain);
            if (encodedCookiesWithExpirationAndPath.length > mParticle.maxCookieSize) {
                var MPIDtoRemove = currentSessionMPIDs[i];
                if (cookies[MPIDtoRemove]) {
                    Helpers.logDebug('Size of new encoded cookie is larger than maxCookieSize setting of ' + mParticle.maxCookieSize + '. Removing from cookie the earliest logged in MPID containing: ' + JSON.stringify(cookies[MPIDtoRemove], 0, 2));
                    delete cookies[MPIDtoRemove];
                } else {
                    Helpers.logDebug('Unable to save MPID data to cookies because the resulting encoded cookie is larger than the maxCookieSize setting of ' + mParticle.maxCookieSize + '. We recommend using a maxCookieSize of 1500.');
                }
            } else {
                break;
            }
        }
    }

    return encodedCookiesWithExpirationAndPath;
}

function createFullEncodedCookie(cookies, expires, domain) {
    return encodeCookies(JSON.stringify(cookies)) + ';expires=' + expires +';path=/' + domain;
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

function encodeCookies(cookie) {
    cookie = JSON.parse(cookie);
    for (var key in cookie.gs) {
        if (cookie.gs.hasOwnProperty(key)) {
            // base64 encode any value that is an object or Array in globalSettings first
            if (Base64CookieKeys[key]) {
                if (cookie.gs[key]) {
                    if (Array.isArray(cookie.gs[key]) && cookie.gs[key].length) {
                        cookie.gs[key] = Base64.encode(JSON.stringify(cookie.gs[key]));
                    } else if (Helpers.isObject(cookie.gs[key]) && Object.keys(cookie.gs[key]).length) {
                        cookie.gs[key] = Base64.encode(JSON.stringify(cookie.gs[key]));
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
                            if (Helpers.isObject(cookie[mpid][key]) && Object.keys(cookie[mpid][key]).length) {
                                cookie[mpid][key] = Base64.encode(JSON.stringify(cookie[mpid][key]));
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
                            cookie.gs[key] = JSON.parse(Base64.decode(cookie.gs[key]));
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
                                            cookie[mpid][key] = JSON.parse(Base64.decode(cookie[mpid][key]));
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return JSON.stringify(cookie);
        }
    } catch (e) {
        Helpers.logDebug('Problem with decoding cookie', e);
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
    return string.replace(/\"/g, '\'');
}

function createCookieString(string) {
    return replaceCommasWithPipes(replaceQuotesWithApostrophes(string));
}

function revertCookieString(string) {
    return replacePipesWithCommas(replaceApostrophesWithQuotes(string));
}

function getCookieDomain() {
    if (MP.Config.CookieDomain) {
        return MP.Config.CookieDomain;
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
        if (doc.cookie.indexOf(mpTest) > -1){
            doc.cookie = mpTest.split('=')[0] + '=;domain=.' + testParts + ';expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            return testParts;
        }
    }
    return '';
}

function decodeProducts() {
    return JSON.parse(Base64.decode(localStorage.getItem(Constants.DefaultConfig.LocalStorageProductsV4)));
}

function getUserIdentities(mpid) {
    var cookies;
    if (mpid === MP.mpid) {
        return MP.userIdentities;
    } else {
        cookies = getPersistence();

        if (cookies && cookies[mpid] && cookies[mpid].ui) {
            return cookies[mpid].ui;
        } else {
            return {};
        }
    }
}

function getAllUserAttributes(mpid) {
    var cookies;
    if (mpid === MP.mpid) {
        return MP.userAttributes;
    } else {
        cookies = getPersistence();

        if (cookies && cookies[mpid] && cookies[mpid].ua) {
            return cookies[mpid].ua;
        } else {
            return {};
        }
    }
}

function getCartProducts(mpid) {
    if (mpid === MP.mpid) {
        return MP.cartProducts;
    } else {
        var allCartProducts = JSON.parse(Base64.decode(localStorage.getItem(MP.Config.LocalStorageProductsV4)));
        if (allCartProducts && allCartProducts[mpid] && allCartProducts[mpid].cp) {
            return allCartProducts[mpid].cp;
        } else {
            return [];
        }
    }
}

function setCartProducts(allProducts) {
    try {
        window.localStorage.setItem(encodeURIComponent(MP.Config.LocalStorageProductsV4), Base64.encode(JSON.stringify(allProducts)));
    }
    catch (e) {
        Helpers.logDebug('Error with setting products on localStorage.');
    }
}

function updateOnlyCookieUserAttributes(cookies) {
    var encodedCookies = encodeCookies(JSON.stringify(cookies)),
        date = new Date(),
        key = MP.Config.CookieNameV4,
        expires = new Date(date.getTime() +
        (MP.Config.CookieExpiration * 24 * 60 * 60 * 1000)).toGMTString(),
        cookieDomain = getCookieDomain(),
        domain;

    if (cookieDomain === '') {
        domain = '';
    } else {
        domain = ';domain=' + cookieDomain;
    }


    if (mParticle.useCookieStorage) {
        var encodedCookiesWithExpirationAndPath = reduceAndEncodeCookies(cookies, expires, domain);
        window.document.cookie =
            encodeURIComponent(key) + '=' + encodedCookiesWithExpirationAndPath;
    } else {
        localStorage.setItem(MP.Config.LocalStorageNameV4, encodedCookies);
    }
}

function getPersistence() {
    var cookies;
    if (mParticle.useCookieStorage) {
        cookies = getCookie();
    } else {
        cookies = getLocalStorage();
    }

    return cookies;
}

function getDeviceId() {
    return MP.deviceId;
}

function resetPersistence(){
    removeLocalStorage(MP.Config.LocalStorageName);
    removeLocalStorage(MP.Config.LocalStorageNameV3);
    removeLocalStorage(MP.Config.LocalStorageNameV4);
    removeLocalStorage(MP.Config.LocalStorageProductsV4);

    expireCookies(MP.Config.CookieName);
    expireCookies(MP.Config.CookieNameV2);
    expireCookies(MP.Config.CookieNameV3);
    expireCookies(MP.Config.CookieNameV4);
}

module.exports = {
    useLocalStorage: useLocalStorage,
    isLocalStorageAvailable: null,
    initializeStorage: initializeStorage,
    update: update,
    determineLocalStorageAvailability: determineLocalStorageAvailability,
    convertInMemoryDataForCookies: convertInMemoryDataForCookies,
    convertProductsForLocalStorage: convertProductsForLocalStorage,
    getLocalStorageProducts: getLocalStorageProducts,
    storeProductsInMemory: storeProductsInMemory,
    setLocalStorage: setLocalStorage,
    setGlobalStorageAttributes: setGlobalStorageAttributes,
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
    encodeCookies: encodeCookies,
    decodeCookies: decodeCookies,
    getCookieDomain: getCookieDomain,
    decodeProducts: decodeProducts,
    getUserIdentities: getUserIdentities,
    getAllUserAttributes: getAllUserAttributes,
    getCartProducts: getCartProducts,
    setCartProducts: setCartProducts,
    updateOnlyCookieUserAttributes: updateOnlyCookieUserAttributes,
    getPersistence: getPersistence,
    getDeviceId: getDeviceId,
    resetPersistence: resetPersistence
};
