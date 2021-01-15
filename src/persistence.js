import Constants from './constants';
import Polyfill from './polyfill';

var Base64 = Polyfill.Base64,
    Messages = Constants.Messages,
    Base64CookieKeys = Constants.Base64CookieKeys,
    SDKv2NonMPIDCookieKeys = Constants.SDKv2NonMPIDCookieKeys,
    StorageNames = Constants.StorageNames;

export default function _Persistence(mpInstance) {
    var self = this;
    this.useLocalStorage = function() {
        return (
            !mpInstance._Store.SDKConfig.useCookieStorage &&
            mpInstance._Store.isLocalStorageAvailable
        );
    };

    this.initializeStorage = function() {
        try {
            var storage,
                localStorageData = self.getLocalStorage(),
                cookies = self.getCookie(),
                allData;

            // Determine if there is any data in cookies or localStorage to figure out if it is the first time the browser is loading mParticle
            if (!localStorageData && !cookies) {
                mpInstance._Store.isFirstRun = true;
                mpInstance._Store.mpid = 0;
            } else {
                mpInstance._Store.isFirstRun = false;
            }

            if (!mpInstance._Store.isLocalStorageAvailable) {
                mpInstance._Store.SDKConfig.useCookieStorage = true;
            }

            if (mpInstance._Store.isLocalStorageAvailable) {
                storage = window.localStorage;
                if (mpInstance._Store.SDKConfig.useCookieStorage) {
                    // For migrating from localStorage to cookies -- If an instance switches from localStorage to cookies, then
                    // no mParticle cookie exists yet and there is localStorage. Get the localStorage, set them to cookies, then delete the localStorage item.
                    if (localStorageData) {
                        if (cookies) {
                            allData = mpInstance._Helpers.extend(
                                false,
                                localStorageData,
                                cookies
                            );
                        } else {
                            allData = localStorageData;
                        }
                        storage.removeItem(mpInstance._Store.storageName);
                    } else if (cookies) {
                        allData = cookies;
                    }
                    self.storeDataInMemory(allData);
                } else {
                    // For migrating from cookie to localStorage -- If an instance is newly switching from cookies to localStorage, then
                    // no mParticle localStorage exists yet and there are cookies. Get the cookies, set them to localStorage, then delete the cookies.
                    if (cookies) {
                        if (localStorageData) {
                            allData = mpInstance._Helpers.extend(
                                false,
                                localStorageData,
                                cookies
                            );
                        } else {
                            allData = cookies;
                        }
                        self.storeDataInMemory(allData);
                        self.expireCookies(mpInstance._Store.storageName);
                    } else {
                        self.storeDataInMemory(localStorageData);
                    }
                }
            } else {
                self.storeDataInMemory(cookies);
            }

            try {
                if (mpInstance._Store.isLocalStorageAvailable) {
                    var encodedProducts = localStorage.getItem(
                        mpInstance._Store.prodStorageName
                    );

                    if (encodedProducts) {
                        var decodedProducts = JSON.parse(
                            Base64.decode(encodedProducts)
                        );
                    }
                    if (mpInstance._Store.mpid) {
                        self.storeProductsInMemory(
                            decodedProducts,
                            mpInstance._Store.mpid
                        );
                    }
                }
            } catch (e) {
                if (mpInstance._Store.isLocalStorageAvailable) {
                    localStorage.removeItem(mpInstance._Store.prodStorageName);
                }
                mpInstance._Store.cartProducts = [];
                mpInstance.Logger.error(
                    'Error loading products in initialization: ' + e
                );
            }

            for (var key in allData) {
                if (allData.hasOwnProperty(key)) {
                    if (!SDKv2NonMPIDCookieKeys[key]) {
                        mpInstance._Store.nonCurrentUserMPIDs[key] =
                            allData[key];
                    }
                }
            }
            self.update();
        } catch (e) {
            if (
                self.useLocalStorage() &&
                mpInstance._Store.isLocalStorageAvailable
            ) {
                localStorage.removeItem(mpInstance._Store.storageName);
            } else {
                self.expireCookies(mpInstance._Store.storageName);
            }
            mpInstance.Logger.error('Error initializing storage: ' + e);
        }
    };

    this.update = function() {
        if (!mpInstance._Store.webviewBridgeEnabled) {
            if (mpInstance._Store.SDKConfig.useCookieStorage) {
                self.setCookie();
            }

            self.setLocalStorage();
        }
    };

    this.storeProductsInMemory = function(products, mpid) {
        if (products) {
            try {
                mpInstance._Store.cartProducts =
                    products[mpid] && products[mpid].cp
                        ? products[mpid].cp
                        : [];
            } catch (e) {
                mpInstance.Logger.error(
                    Messages.ErrorMessages.CookieParseError
                );
            }
        }
    };

    this.storeDataInMemory = function(obj, currentMPID) {
        try {
            if (!obj) {
                mpInstance.Logger.verbose(
                    Messages.InformationMessages.CookieNotFound
                );
                mpInstance._Store.clientId =
                    mpInstance._Store.clientId ||
                    mpInstance._Helpers.generateUniqueId();
                mpInstance._Store.deviceId =
                    mpInstance._Store.deviceId ||
                    mpInstance._Helpers.generateUniqueId();
            } else {
                // Set MPID first, then change object to match MPID data
                if (currentMPID) {
                    mpInstance._Store.mpid = currentMPID;
                } else {
                    mpInstance._Store.mpid = obj.cu || 0;
                }

                obj.gs = obj.gs || {};

                mpInstance._Store.sessionId =
                    obj.gs.sid || mpInstance._Store.sessionId;
                mpInstance._Store.isEnabled =
                    typeof obj.gs.ie !== 'undefined'
                        ? obj.gs.ie
                        : mpInstance._Store.isEnabled;
                mpInstance._Store.sessionAttributes =
                    obj.gs.sa || mpInstance._Store.sessionAttributes;
                mpInstance._Store.serverSettings =
                    obj.gs.ss || mpInstance._Store.serverSettings;
                mpInstance._Store.devToken =
                    mpInstance._Store.devToken || obj.gs.dt;
                mpInstance._Store.SDKConfig.appVersion =
                    mpInstance._Store.SDKConfig.appVersion || obj.gs.av;
                mpInstance._Store.clientId =
                    obj.gs.cgid ||
                    mpInstance._Store.clientId ||
                    mpInstance._Helpers.generateUniqueId();
                mpInstance._Store.deviceId =
                    obj.gs.das ||
                    mpInstance._Store.deviceId ||
                    mpInstance._Helpers.generateUniqueId();
                mpInstance._Store.integrationAttributes = obj.gs.ia || {};
                mpInstance._Store.context =
                    obj.gs.c || mpInstance._Store.context;
                mpInstance._Store.currentSessionMPIDs =
                    obj.gs.csm || mpInstance._Store.currentSessionMPIDs;

                mpInstance._Store.isLoggedIn = obj.l === true;

                if (obj.gs.les) {
                    mpInstance._Store.dateLastEventSent = new Date(obj.gs.les);
                }

                if (obj.gs.ssd) {
                    mpInstance._Store.sessionStartDate = new Date(obj.gs.ssd);
                } else {
                    mpInstance._Store.sessionStartDate = new Date();
                }

                if (currentMPID) {
                    obj = obj[currentMPID];
                } else {
                    obj = obj[obj.cu];
                }
            }
        } catch (e) {
            mpInstance.Logger.error(Messages.ErrorMessages.CookieParseError);
        }
    };

    this.determineLocalStorageAvailability = function(storage) {
        var result;

        if (window.mParticle && window.mParticle._forceNoLocalStorage) {
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
    };

    this.getUserProductsFromLS = function(mpid) {
        if (!mpInstance._Store.isLocalStorageAvailable) {
            return [];
        }

        var decodedProducts,
            userProducts,
            parsedProducts,
            encodedProducts = localStorage.getItem(
                mpInstance._Store.prodStorageName
            );
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
    };

    this.getAllUserProductsFromLS = function() {
        var decodedProducts,
            encodedProducts = localStorage.getItem(
                mpInstance._Store.prodStorageName
            ),
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
    };

    this.setLocalStorage = function() {
        if (!mpInstance._Store.isLocalStorageAvailable) {
            return;
        }

        var key = mpInstance._Store.storageName,
            allLocalStorageProducts = self.getAllUserProductsFromLS(),
            localStorageData = self.getLocalStorage() || {},
            currentUser = mpInstance.Identity.getCurrentUser(),
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
                    encodeURIComponent(mpInstance._Store.prodStorageName),
                    Base64.encode(JSON.stringify(allLocalStorageProducts))
                );
            } catch (e) {
                mpInstance.Logger.error(
                    'Error with setting products on localStorage.'
                );
            }
        }

        if (!mpInstance._Store.SDKConfig.useCookieStorage) {
            localStorageData.gs = localStorageData.gs || {};

            localStorageData.l = mpInstance._Store.isLoggedIn ? 1 : 0;

            if (mpInstance._Store.sessionId) {
                localStorageData.gs.csm = mpInstance._Store.currentSessionMPIDs;
            }

            localStorageData.gs.ie = mpInstance._Store.isEnabled;

            if (mpid) {
                localStorageData.cu = mpid;
            }

            if (Object.keys(mpInstance._Store.nonCurrentUserMPIDs).length) {
                localStorageData = mpInstance._Helpers.extend(
                    {},
                    localStorageData,
                    mpInstance._Store.nonCurrentUserMPIDs
                );
                mpInstance._Store.nonCurrentUserMPIDs = {};
            }

            localStorageData = setGlobalStorageAttributes(localStorageData);

            try {
                window.localStorage.setItem(
                    encodeURIComponent(key),
                    self.encodePersistence(JSON.stringify(localStorageData))
                );
            } catch (e) {
                mpInstance.Logger.error(
                    'Error with setting localStorage item.'
                );
            }
        }
    };

    function setGlobalStorageAttributes(data) {
        var store = mpInstance._Store;
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
            : 0;
        data.gs.ia = store.integrationAttributes;

        return data;
    }

    this.getLocalStorage = function() {
        if (!mpInstance._Store.isLocalStorageAvailable) {
            return null;
        }

        var key = mpInstance._Store.storageName,
            localStorageData = self.decodePersistence(
                window.localStorage.getItem(key)
            ),
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
    };

    function removeLocalStorage(localStorageName) {
        localStorage.removeItem(localStorageName);
    }

    this.expireCookies = function(cookieName) {
        var date = new Date(),
            expires,
            domain,
            cookieDomain;

        cookieDomain = self.getCookieDomain();

        if (cookieDomain === '') {
            domain = '';
        } else {
            domain = ';domain=' + cookieDomain;
        }

        date.setTime(date.getTime() - 24 * 60 * 60 * 1000);
        expires = '; expires=' + date.toUTCString();
        document.cookie = cookieName + '=' + '' + expires + '; path=/' + domain;
    };

    this.getCookie = function() {
        var cookies = window.document.cookie.split('; '),
            key = mpInstance._Store.storageName,
            i,
            l,
            parts,
            name,
            cookie,
            result = key ? undefined : {};

        mpInstance.Logger.verbose(Messages.InformationMessages.CookieSearch);

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

            if (key && key === name) {
                result = mpInstance._Helpers.converted(cookie);
                break;
            }

            if (!key) {
                result[name] = mpInstance._Helpers.converted(cookie);
            }
        }

        if (result) {
            mpInstance.Logger.verbose(Messages.InformationMessages.CookieFound);
            return JSON.parse(self.decodePersistence(result));
        } else {
            return null;
        }
    };

    // only used in persistence
    this.setCookie = function() {
        var mpid,
            currentUser = mpInstance.Identity.getCurrentUser();
        if (currentUser) {
            mpid = currentUser.getMPID();
        }
        var date = new Date(),
            key = mpInstance._Store.storageName,
            cookies = self.getCookie() || {},
            expires = new Date(
                date.getTime() +
                    mpInstance._Store.SDKConfig.cookieExpiration *
                        24 *
                        60 *
                        60 *
                        1000
            ).toGMTString(),
            cookieDomain,
            domain,
            encodedCookiesWithExpirationAndPath;

        cookieDomain = self.getCookieDomain();

        if (cookieDomain === '') {
            domain = '';
        } else {
            domain = ';domain=' + cookieDomain;
        }

        cookies.gs = cookies.gs || {};

        if (mpInstance._Store.sessionId) {
            cookies.gs.csm = mpInstance._Store.currentSessionMPIDs;
        }

        if (mpid) {
            cookies.cu = mpid;
        }

        cookies.l = mpInstance._Store.isLoggedIn ? 1 : 0;

        cookies = setGlobalStorageAttributes(cookies);

        if (Object.keys(mpInstance._Store.nonCurrentUserMPIDs).length) {
            cookies = mpInstance._Helpers.extend(
                {},
                cookies,
                mpInstance._Store.nonCurrentUserMPIDs
            );
            mpInstance._Store.nonCurrentUserMPIDs = {};
        }

        encodedCookiesWithExpirationAndPath = self.reduceAndEncodePersistence(
            cookies,
            expires,
            domain,
            mpInstance._Store.SDKConfig.maxCookieSize
        );

        mpInstance.Logger.verbose(Messages.InformationMessages.CookieSet);

        window.document.cookie =
            encodeURIComponent(key) + '=' + encodedCookiesWithExpirationAndPath;
    };

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
    this.reduceAndEncodePersistence = function(
        persistence,
        expires,
        domain,
        maxCookieSize
    ) {
        var encodedCookiesWithExpirationAndPath,
            currentSessionMPIDs = persistence.gs.csm ? persistence.gs.csm : [];
        // Comment 1 above
        if (!currentSessionMPIDs.length) {
            for (var key in persistence) {
                if (persistence.hasOwnProperty(key)) {
                    encodedCookiesWithExpirationAndPath = createFullEncodedCookie(
                        persistence,
                        expires,
                        domain
                    );
                    if (
                        encodedCookiesWithExpirationAndPath.length >
                        maxCookieSize
                    ) {
                        if (
                            !SDKv2NonMPIDCookieKeys[key] &&
                            key !== persistence.cu
                        ) {
                            delete persistence[key];
                        }
                    }
                }
            }
        } else {
            // Comment 2 above - First create an object of all MPIDs on the cookie
            var MPIDsOnCookie = {};
            for (var potentialMPID in persistence) {
                if (persistence.hasOwnProperty(potentialMPID)) {
                    if (
                        !SDKv2NonMPIDCookieKeys[potentialMPID] &&
                        potentialMPID !== persistence.cu
                    ) {
                        MPIDsOnCookie[potentialMPID] = 1;
                    }
                }
            }
            // Comment 2a above
            if (Object.keys(MPIDsOnCookie).length) {
                for (var mpid in MPIDsOnCookie) {
                    encodedCookiesWithExpirationAndPath = createFullEncodedCookie(
                        persistence,
                        expires,
                        domain
                    );
                    if (
                        encodedCookiesWithExpirationAndPath.length >
                        maxCookieSize
                    ) {
                        if (MPIDsOnCookie.hasOwnProperty(mpid)) {
                            if (currentSessionMPIDs.indexOf(mpid) === -1) {
                                delete persistence[mpid];
                            }
                        }
                    }
                }
            }
            // Comment 2b above
            for (var i = 0; i < currentSessionMPIDs.length; i++) {
                encodedCookiesWithExpirationAndPath = createFullEncodedCookie(
                    persistence,
                    expires,
                    domain
                );
                if (
                    encodedCookiesWithExpirationAndPath.length > maxCookieSize
                ) {
                    var MPIDtoRemove = currentSessionMPIDs[i];
                    if (persistence[MPIDtoRemove]) {
                        mpInstance.Logger.verbose(
                            'Size of new encoded cookie is larger than maxCookieSize setting of ' +
                                maxCookieSize +
                                '. Removing from cookie the earliest logged in MPID containing: ' +
                                JSON.stringify(persistence[MPIDtoRemove], 0, 2)
                        );
                        delete persistence[MPIDtoRemove];
                    } else {
                        mpInstance.Logger.error(
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
    };

    function createFullEncodedCookie(persistence, expires, domain) {
        return (
            self.encodePersistence(JSON.stringify(persistence)) +
            ';expires=' +
            expires +
            ';path=/' +
            domain
        );
    }

    this.findPrevCookiesBasedOnUI = function(identityApiData) {
        var persistence = mpInstance._Persistence.getPersistence();
        var matchedUser;

        if (identityApiData) {
            for (var requestedIdentityType in identityApiData.userIdentities) {
                if (persistence && Object.keys(persistence).length) {
                    for (var key in persistence) {
                        // any value in persistence that has an MPID key will be an MPID to search through
                        // other keys on the cookie are currentSessionMPIDs and currentMPID which should not be searched
                        if (persistence[key].mpid) {
                            var cookieUIs = persistence[key].ui;
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
            self.storeDataInMemory(persistence, matchedUser);
        }
    };

    this.encodePersistence = function(persistence) {
        persistence = JSON.parse(persistence);
        for (var key in persistence.gs) {
            if (persistence.gs.hasOwnProperty(key)) {
                if (Base64CookieKeys[key]) {
                    if (persistence.gs[key]) {
                        // base64 encode any value that is an object or Array in globalSettings
                        if (
                            (Array.isArray(persistence.gs[key]) &&
                                persistence.gs[key].length) ||
                            (mpInstance._Helpers.isObject(
                                persistence.gs[key]
                            ) &&
                                Object.keys(persistence.gs[key]).length)
                        ) {
                            persistence.gs[key] = Base64.encode(
                                JSON.stringify(persistence.gs[key])
                            );
                        } else {
                            delete persistence.gs[key];
                        }
                    } else {
                        delete persistence.gs[key];
                    }
                } else if (key === 'ie') {
                    persistence.gs[key] = persistence.gs[key] ? 1 : 0;
                } else if (!persistence.gs[key]) {
                    delete persistence.gs[key];
                }
            }
        }

        for (var mpid in persistence) {
            if (persistence.hasOwnProperty(mpid)) {
                if (!SDKv2NonMPIDCookieKeys[mpid]) {
                    for (key in persistence[mpid]) {
                        if (persistence[mpid].hasOwnProperty(key)) {
                            if (Base64CookieKeys[key]) {
                                if (
                                    mpInstance._Helpers.isObject(
                                        persistence[mpid][key]
                                    ) &&
                                    Object.keys(persistence[mpid][key]).length
                                ) {
                                    persistence[mpid][key] = Base64.encode(
                                        JSON.stringify(persistence[mpid][key])
                                    );
                                } else {
                                    delete persistence[mpid][key];
                                }
                            }
                        }
                    }
                }
            }
        }

        return self.createCookieString(JSON.stringify(persistence));
    };

    this.decodePersistence = function(persistence) {
        try {
            if (persistence) {
                persistence = JSON.parse(self.revertCookieString(persistence));
                if (
                    mpInstance._Helpers.isObject(persistence) &&
                    Object.keys(persistence).length
                ) {
                    for (var key in persistence.gs) {
                        if (persistence.gs.hasOwnProperty(key)) {
                            if (Base64CookieKeys[key]) {
                                persistence.gs[key] = JSON.parse(
                                    Base64.decode(persistence.gs[key])
                                );
                            } else if (key === 'ie') {
                                persistence.gs[key] = Boolean(
                                    persistence.gs[key]
                                );
                            }
                        }
                    }

                    for (var mpid in persistence) {
                        if (persistence.hasOwnProperty(mpid)) {
                            if (!SDKv2NonMPIDCookieKeys[mpid]) {
                                for (key in persistence[mpid]) {
                                    if (persistence[mpid].hasOwnProperty(key)) {
                                        if (Base64CookieKeys[key]) {
                                            if (persistence[mpid][key].length) {
                                                persistence[mpid][
                                                    key
                                                ] = JSON.parse(
                                                    Base64.decode(
                                                        persistence[mpid][key]
                                                    )
                                                );
                                            }
                                        }
                                    }
                                }
                            } else if (mpid === 'l') {
                                persistence[mpid] = Boolean(persistence[mpid]);
                            }
                        }
                    }
                }

                return JSON.stringify(persistence);
            }
        } catch (e) {
            mpInstance.Logger.error('Problem with decoding cookie', e);
        }
    };

    this.replaceCommasWithPipes = function(string) {
        return string.replace(/,/g, '|');
    };

    this.replacePipesWithCommas = function(string) {
        return string.replace(/\|/g, ',');
    };

    this.replaceApostrophesWithQuotes = function(string) {
        return string.replace(/\'/g, '"');
    };

    this.replaceQuotesWithApostrophes = function(string) {
        return string.replace(/\"/g, "'");
    };

    this.createCookieString = function(string) {
        return self.replaceCommasWithPipes(
            self.replaceQuotesWithApostrophes(string)
        );
    };

    this.revertCookieString = function(string) {
        return self.replacePipesWithCommas(
            self.replaceApostrophesWithQuotes(string)
        );
    };

    this.getCookieDomain = function() {
        if (mpInstance._Store.SDKConfig.cookieDomain) {
            return mpInstance._Store.SDKConfig.cookieDomain;
        } else {
            var rootDomain = self.getDomain(document, location.hostname);
            if (rootDomain === '') {
                return '';
            } else {
                return '.' + rootDomain;
            }
        }
    };

    // This function loops through the parts of a full hostname, attempting to set a cookie on that domain. It will set a cookie at the highest level possible.
    // For example subdomain.domain.co.uk would try the following combinations:
    // "co.uk" -> fail
    // "domain.co.uk" -> success, return
    // "subdomain.domain.co.uk" -> skipped, because already found
    this.getDomain = function(doc, locationHostname) {
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
    };

    this.getUserIdentities = function(mpid) {
        var persistence = self.getPersistence();

        if (persistence && persistence[mpid] && persistence[mpid].ui) {
            return persistence[mpid].ui;
        } else {
            return {};
        }
    };

    this.getAllUserAttributes = function(mpid) {
        var persistence = self.getPersistence();

        if (persistence && persistence[mpid] && persistence[mpid].ua) {
            return persistence[mpid].ua;
        } else {
            return {};
        }
    };

    this.getCartProducts = function(mpid) {
        var allCartProducts,
            cartProductsString = localStorage.getItem(
                mpInstance._Store.prodStorageName
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
    };

    this.setCartProducts = function(allProducts) {
        if (!mpInstance._Store.isLocalStorageAvailable) {
            return;
        }

        try {
            window.localStorage.setItem(
                encodeURIComponent(mpInstance._Store.prodStorageName),
                Base64.encode(JSON.stringify(allProducts))
            );
        } catch (e) {
            mpInstance.Logger.error(
                'Error with setting products on localStorage.'
            );
        }
    };
    this.saveUserIdentitiesToPersistence = function(mpid, userIdentities) {
        if (userIdentities) {
            var persistence = self.getPersistence();
            if (persistence) {
                if (persistence[mpid]) {
                    persistence[mpid].ui = userIdentities;
                } else {
                    persistence[mpid] = {
                        ui: userIdentities,
                    };
                }
                self.savePersistence(persistence);
            }
        }
    };

    this.saveUserAttributesToPersistence = function(mpid, userAttributes) {
        var persistence = self.getPersistence();
        if (userAttributes) {
            if (persistence) {
                if (persistence[mpid]) {
                    persistence[mpid].ui = userAttributes;
                } else {
                    persistence[mpid] = {
                        ui: userAttributes,
                    };
                }
            }
            self.savePersistence(persistence);
        }
    };

    this.saveUserCookieSyncDatesToPersistence = function(mpid, csd) {
        if (csd) {
            var persistence = self.getPersistence();
            if (persistence) {
                if (persistence[mpid]) {
                    persistence[mpid].csd = csd;
                } else {
                    persistence[mpid] = {
                        csd: csd,
                    };
                }
            }
            self.savePersistence(persistence);
        }
    };

    this.saveUserConsentStateToCookies = function(mpid, consentState) {
        //it's currently not supported to set persistence
        //for any MPID that's not the current one.
        if (consentState || consentState === null) {
            var persistence = self.getPersistence();
            if (persistence) {
                if (persistence[mpid]) {
                    persistence[
                        mpid
                    ].con = mpInstance._Consent.ConsentSerialization.toMinifiedJsonObject(
                        consentState
                    );
                } else {
                    persistence[mpid] = {
                        con: mpInstance._Consent.ConsentSerialization.toMinifiedJsonObject(
                            consentState
                        ),
                    };
                }
                self.savePersistence(persistence);
            }
        }
    };

    this.savePersistence = function(persistence) {
        var encodedPersistence = self.encodePersistence(
                JSON.stringify(persistence)
            ),
            date = new Date(),
            key = mpInstance._Store.storageName,
            expires = new Date(
                date.getTime() +
                    mpInstance._Store.SDKConfig.cookieExpiration *
                        24 *
                        60 *
                        60 *
                        1000
            ).toGMTString(),
            cookieDomain = self.getCookieDomain(),
            domain;

        if (cookieDomain === '') {
            domain = '';
        } else {
            domain = ';domain=' + cookieDomain;
        }

        if (mpInstance._Store.SDKConfig.useCookieStorage) {
            var encodedCookiesWithExpirationAndPath = self.reduceAndEncodePersistence(
                persistence,
                expires,
                domain,
                mpInstance._Store.SDKConfig.maxCookieSize
            );
            window.document.cookie =
                encodeURIComponent(key) +
                '=' +
                encodedCookiesWithExpirationAndPath;
        } else {
            if (mpInstance._Store.isLocalStorageAvailable) {
                localStorage.setItem(
                    mpInstance._Store.storageName,
                    encodedPersistence
                );
            }
        }
    };

    this.getPersistence = function() {
        var persistence = this.useLocalStorage()
            ? this.getLocalStorage()
            : this.getCookie();

        return persistence;
    };

    this.getConsentState = function(mpid) {
        var persistence = self.getPersistence();

        if (persistence && persistence[mpid] && persistence[mpid].con) {
            return mpInstance._Consent.ConsentSerialization.fromMinifiedJsonObject(
                persistence[mpid].con
            );
        } else {
            return null;
        }
    };

    this.getFirstSeenTime = function(mpid) {
        if (!mpid) {
            return null;
        }
        var persistence = self.getPersistence();
        if (persistence && persistence[mpid] && persistence[mpid].fst) {
            return persistence[mpid].fst;
        } else {
            return null;
        }
    };

    /**
     * set the "first seen" time for a user. the time will only be set once for a given
     * mpid after which subsequent calls will be ignored
     */
    this.setFirstSeenTime = function(mpid, time) {
        if (!mpid) {
            return;
        }
        if (!time) {
            time = new Date().getTime();
        }
        var persistence = self.getPersistence();
        if (persistence) {
            if (!persistence[mpid]) {
                persistence[mpid] = {};
            }
            if (!persistence[mpid].fst) {
                persistence[mpid].fst = time;
                self.savePersistence(persistence);
            }
        }
    };

    /**
     * returns the "last seen" time for a user. If the mpid represents the current user, the
     * return value will always be the current time, otherwise it will be to stored "last seen"
     * time
     */
    this.getLastSeenTime = function(mpid) {
        if (!mpid) {
            return null;
        }
        if (mpid === mpInstance.Identity.getCurrentUser().getMPID()) {
            //if the mpid is the current user, its last seen time is the current time
            return new Date().getTime();
        } else {
            var persistence = self.getPersistence();
            if (persistence && persistence[mpid] && persistence[mpid].lst) {
                return persistence[mpid].lst;
            }
            return null;
        }
    };

    this.setLastSeenTime = function(mpid, time) {
        if (!mpid) {
            return;
        }
        if (!time) {
            time = new Date().getTime();
        }
        var persistence = self.getPersistence();
        if (persistence && persistence[mpid]) {
            persistence[mpid].lst = time;
            self.savePersistence(persistence);
        }
    };

    this.getDeviceId = function() {
        return mpInstance._Store.deviceId;
    };

    this.resetPersistence = function() {
        removeLocalStorage(StorageNames.localStorageName);
        removeLocalStorage(StorageNames.localStorageNameV3);
        removeLocalStorage(StorageNames.localStorageNameV4);
        removeLocalStorage(mpInstance._Store.prodStorageName);
        removeLocalStorage(mpInstance._Store.storageName);
        removeLocalStorage(StorageNames.localStorageProductsV4);

        self.expireCookies(StorageNames.cookieName);
        self.expireCookies(StorageNames.cookieNameV2);
        self.expireCookies(StorageNames.cookieNameV3);
        self.expireCookies(StorageNames.cookieNameV4);
        self.expireCookies(mpInstance._Store.prodStorageName);
        self.expireCookies(mpInstance._Store.storageName);

        if (mParticle._isTestEnv) {
            var testWorkspaceToken = 'abcdef';
            removeLocalStorage(
                mpInstance._Helpers.createMainStorageName(testWorkspaceToken)
            );
            self.expireCookies(
                mpInstance._Helpers.createMainStorageName(testWorkspaceToken)
            );
            removeLocalStorage(
                mpInstance._Helpers.createProductStorageName(testWorkspaceToken)
            );
        }
    };

    // Forwarder Batching Code
    this.forwardingStatsBatches = {
        uploadsTable: {},
        forwardingStatsEventQueue: [],
    };
}
