import Constants from './constants';
import Polyfill from './polyfill';
import * as Utils from './utils';
import { IMParticleWebSDKInstance } from './mp-instance';
import { IPersistence, IPersistenceMinified, iForwardingStatsBatches } from './persistence.interfaces';
import { MPID, IdentityApiData } from '@mparticle/web-sdk';
import { CookieSyncDates } from './cookieSyncManager';
import { Dictionary } from './utils';

const Base64 = Polyfill.Base64,
    Messages = Constants.Messages,
    Base64CookieKeys = Constants.Base64CookieKeys,
    SDKv2NonMPIDCookieKeys = Constants.SDKv2NonMPIDCookieKeys,
    StorageNames = Constants.StorageNames;

export default function _Persistence(
    this: IPersistence,
    mpInstance: IMParticleWebSDKInstance
): void {
    const self = this;

    // https://go.mparticle.com/work/SQDSDKS-5022
    this.useLocalStorage = function(): boolean {
        return (
            !mpInstance._Store.SDKConfig.useCookieStorage &&
            mpInstance._Store.isLocalStorageAvailable
        );
    };

    this.initializeStorage = function(): void {
        try {
            let storage: Storage,
                localStorageData = self.getLocalStorage(),
                cookies = self.getCookie(),
                allData: IPersistenceMinified;

            // https://go.mparticle.com/work/SQDSDKS-6045
            // Determine if there is any data in cookies or localStorage to figure out if it is the first time the browser is loading mParticle
            if (!localStorageData && !cookies) {
                mpInstance._Store.isFirstRun = true;
                (mpInstance._Store as Dictionary).mpid = 0;
            } else {
                mpInstance._Store.isFirstRun = false;
            }

            // https://go.mparticle.com/work/SQDSDKS-6045
            if (!mpInstance._Store.isLocalStorageAvailable) {
                mpInstance._Store.SDKConfig.useCookieStorage = true;
            }

            // https://go.mparticle.com/work/SQDSDKS-6046
            if (mpInstance._Store.isLocalStorageAvailable) {
                storage = window.localStorage;
                if (mpInstance._Store.SDKConfig.useCookieStorage) {
                    // For migrating from localStorage to cookies -- If an instance switches from localStorage to cookies, then
                    // no mParticle cookie exists yet and there is localStorage. Get the localStorage, set them to cookies, then delete the localStorage item.
                    if (localStorageData) {
                        if (cookies) {
                            // https://go.mparticle.com/work/SQDSDKS-6047
                            allData = Utils.extend(
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
                            // https://go.mparticle.com/work/SQDSDKS-6047
                            allData = Utils.extend(
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

            // https://go.mparticle.com/work/SQDSDKS-6046
            // Stores all non-current user MPID information into the store
            for (const key in allData) {
                if (allData.hasOwnProperty(key)) {
                    if (!SDKv2NonMPIDCookieKeys[key]) {
                        mpInstance._Store.nonCurrentUserMPIDs[key] =
                            allData[key];
                    }
                }
            }
            self.update();
        } catch (e) {
            // If cookies or local storage is corrupt, we want to remove it
            // so that in the future, initializeStorage will work
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

    this.update = function(): void {
        if (!mpInstance._Store.webviewBridgeEnabled) {
            if (mpInstance._Store.SDKConfig.useCookieStorage) {
                self.setCookie();
            }

            self.setLocalStorage();
        }
    };

    // https://go.mparticle.com/work/SQDSDKS-6045
    this.storeDataInMemory = function(
        obj: IPersistenceMinified,
        currentMPID?: MPID
    ): void {
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
                    (mpInstance._Store as Dictionary).mpid = currentMPID;
                } else {
                    (mpInstance._Store as Dictionary).mpid = obj.cu || 0;
                }

                obj.gs = obj.gs || ({} as IPersistenceMinified['gs']);

                mpInstance._Store.sessionId =
                    obj.gs.sid || mpInstance._Store.sessionId;
                mpInstance._Store.isEnabled =
                    typeof obj.gs.ie !== 'undefined'
                        ? obj.gs.ie
                        : mpInstance._Store.isEnabled;
                mpInstance._Store.sessionAttributes =
                    obj.gs.sa || mpInstance._Store.sessionAttributes;
                mpInstance._Store.localSessionAttributes =
                    obj.gs.lsa || mpInstance._Store.localSessionAttributes;
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

                // For most persistence values, we prioritize localstorage/cookie values over
                // Store. However, we allow device ID to be overriden via a config value and
                // thus the priority of the deviceId value is
                // 1. value passed via config.deviceId
                // 2. previous value in persistence
                // 3. generate new guid
                mpInstance._Store.deviceId =
                    mpInstance._Store.deviceId ||
                    obj.gs.das ||
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

    // https://go.mparticle.com/work/SQDSDKS-5022
    this.determineLocalStorageAvailability = function(
        storage: Storage
    ): boolean {
        let result: boolean;

        if (window.mParticle && (window.mParticle as Dictionary)._forceNoLocalStorage) {
            storage = undefined;
        }

        try {
            storage.setItem('mparticle', 'test');
            result = storage.getItem('mparticle') === 'test';
            storage.removeItem('mparticle');
            return result && !!storage;
        } catch (e) {
            return false;
        }
    };

    // https://go.mparticle.com/work/SQDSDKS-6021
    this.setLocalStorage = function(): void {
        if (!mpInstance._Store.isLocalStorageAvailable) {
            return;
        }

        // Block mprtcl-v4 localStorage when noFunctional is true
        if (mpInstance._CookieConsentManager?.getNoFunctional()) {
            return;
        }

        const key = mpInstance._Store.storageName;
        let localStorageData = self.getLocalStorage() || ({} as IPersistenceMinified);
        const currentUser = mpInstance.Identity.getCurrentUser();
        const mpid = currentUser ? currentUser.getMPID() : null;
        if (!mpInstance._Store.SDKConfig.useCookieStorage) {
            localStorageData.gs = localStorageData.gs || ({} as IPersistenceMinified['gs']);

            (localStorageData as Dictionary).l = mpInstance._Store.isLoggedIn ? 1 : 0;

            if (mpInstance._Store.sessionId) {
                localStorageData.gs.csm = mpInstance._Store.currentSessionMPIDs;
            }

            localStorageData.gs.ie = mpInstance._Store.isEnabled;

            if (mpid) {
                localStorageData.cu = mpid;
            }

            if (Object.keys(mpInstance._Store.nonCurrentUserMPIDs).length) {
                localStorageData = Utils.extend(
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

    function setGlobalStorageAttributes(
        data: IPersistenceMinified
    ): IPersistenceMinified {
        const store = mpInstance._Store;
        data.gs.sid = store.sessionId;
        data.gs.ie = store.isEnabled;
        data.gs.sa = store.sessionAttributes;
        data.gs.lsa = store.localSessionAttributes;
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

    this.getLocalStorage = function(): IPersistenceMinified | null {
        if (!mpInstance._Store.isLocalStorageAvailable) {
            return null;
        }

        const key = mpInstance._Store.storageName;
        const localStorageString = self.decodePersistence(
            window.localStorage.getItem(key)
        );
        const obj: Dictionary = {};

        if (localStorageString) {
            const localStorageData = JSON.parse(localStorageString);
            for (const j in localStorageData) {
                if (localStorageData.hasOwnProperty(j)) {
                    obj[j] = localStorageData[j];
                }
            }
        }

        if (Object.keys(obj).length) {
            return obj as IPersistenceMinified;
        }

        return null;
    };

    function removeLocalStorage(localStorageName: string): void {
        localStorage.removeItem(localStorageName);
    }

    this.expireCookies = function(cookieName: string): void {
        const date = new Date();
        let expires: string;
        let domain: string;
        let cookieDomain: string;

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

    this.getCookie = function(): IPersistenceMinified | null {
        let cookies: string[];
        const key = mpInstance._Store.storageName;
        let i: number;
        let l: number;
        let parts: string[];
        let name: string;
        let cookie: string;
        let result: string | Dictionary = key ? undefined : {};

        mpInstance.Logger.verbose(Messages.InformationMessages.CookieSearch);

        try {
            cookies = window.document.cookie.split('; ');
        } catch (e) {
            mpInstance.Logger.verbose('Unable to parse undefined cookie');
            return null;
        }

        for (i = 0, l = cookies.length; i < l; i++) {
            try {
                parts = cookies[i].split('=');
                name = parts.shift();
                cookie = parts.join('=');
            } catch (e) {
                mpInstance.Logger.verbose(
                    'Unable to parse cookie: ' + name + '. Skipping.'
                );
            }

            if (key && key === name) {
                result = (mpInstance._Helpers as Dictionary).converted(cookie);
                break;
            }

            if (!key) {
                result[name] = (mpInstance._Helpers as Dictionary).converted(cookie);
            }
        }

        if (result) {
            mpInstance.Logger.verbose(Messages.InformationMessages.CookieFound);
            return JSON.parse(self.decodePersistence(result as string));
        } else {
            return null;
        }
    };

    // https://go.mparticle.com/work/SQDSDKS-5022
    // https://go.mparticle.com/work/SQDSDKS-6021
    this.setCookie = function(): void {
        // Block mprtcl-v4 cookies when noFunctional is true
        if (mpInstance._CookieConsentManager?.getNoFunctional()) {
            return;
        }

        let mpid: MPID;
        const currentUser = mpInstance.Identity.getCurrentUser();
        if (currentUser) {
            mpid = currentUser.getMPID();
        }
        const date = new Date();
        const key = mpInstance._Store.storageName;
        let cookies = self.getCookie() || ({} as IPersistenceMinified);
        const expires = new Date(
            date.getTime() +
                (mpInstance._Store.SDKConfig as Dictionary).cookieExpiration *
                    24 *
                    60 *
                    60 *
                    1000
        ).toUTCString();
        let cookieDomain: string;
        let domain: string;
        let encodedCookiesWithExpirationAndPath: string;

        cookieDomain = self.getCookieDomain();

        if (cookieDomain === '') {
            domain = '';
        } else {
            domain = ';domain=' + cookieDomain;
        }

        cookies.gs = cookies.gs || ({} as IPersistenceMinified['gs']);

        if (mpInstance._Store.sessionId) {
            cookies.gs.csm = mpInstance._Store.currentSessionMPIDs;
        }

        if (mpid) {
            cookies.cu = mpid;
        }

        (cookies as Dictionary).l = mpInstance._Store.isLoggedIn ? 1 : 0;

        cookies = setGlobalStorageAttributes(cookies);

        if (Object.keys(mpInstance._Store.nonCurrentUserMPIDs).length) {
            cookies = Utils.extend(
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
        persistence: IPersistenceMinified,
        expires: string,
        domain: string,
        maxCookieSize: number
    ): string {
        let encodedCookiesWithExpirationAndPath: string;
        const currentSessionMPIDs = persistence.gs.csm ? persistence.gs.csm : [];
        // Comment 1 above
        if (!currentSessionMPIDs.length) {
            for (const key in persistence) {
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
            const MPIDsOnCookie: Dictionary<number> = {};
            for (const potentialMPID in persistence) {
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
                for (const mpid in MPIDsOnCookie) {
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
            for (let i = 0; i < currentSessionMPIDs.length; i++) {
                encodedCookiesWithExpirationAndPath = createFullEncodedCookie(
                    persistence,
                    expires,
                    domain
                );
                if (
                    encodedCookiesWithExpirationAndPath.length > maxCookieSize
                ) {
                    const MPIDtoRemove = currentSessionMPIDs[i];
                    if (persistence[MPIDtoRemove]) {
                        mpInstance.Logger.verbose(
                            'Size of new encoded cookie is larger than maxCookieSize setting of ' +
                                maxCookieSize +
                                '. Removing from cookie the earliest logged in MPID containing: ' +
                                JSON.stringify(persistence[MPIDtoRemove], null, 2)
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

    function createFullEncodedCookie(
        persistence: IPersistenceMinified,
        expires: string,
        domain: string
    ): string {
        return (
            self.encodePersistence(JSON.stringify(persistence)) +
            ';expires=' +
            expires +
            ';path=/' +
            domain
        );
    }

    this.findPrevCookiesBasedOnUI = function(
        identityApiData: IdentityApiData
    ): void {
        const persistence = mpInstance._Persistence.getPersistence();
        let matchedUser: string;

        if (identityApiData) {
            for (const requestedIdentityType in identityApiData.userIdentities) {
                if (persistence && Object.keys(persistence).length) {
                    for (const key in persistence) {
                        // any value in persistence that has an MPID key will be an MPID to search through
                        // other keys on the cookie are currentSessionMPIDs and currentMPID which should not be searched
                        if (persistence[key].mpid) {
                            const cookieUIs = persistence[key].ui;
                            for (const cookieUIType in cookieUIs) {
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

    this.encodePersistence = function(persistence: string): string {
        let parsed = JSON.parse(persistence);
        for (const key in parsed.gs) {
            if (parsed.gs.hasOwnProperty(key)) {
                if (Base64CookieKeys[key]) {
                    if (parsed.gs[key]) {
                        // base64 encode any value that is an object or Array in globalSettings
                        if (
                            (Array.isArray(parsed.gs[key]) &&
                                parsed.gs[key].length) ||
                            (mpInstance._Helpers.isObject(
                                parsed.gs[key]
                            ) &&
                                Object.keys(parsed.gs[key]).length)
                        ) {
                            parsed.gs[key] = Base64.encode(
                                JSON.stringify(parsed.gs[key])
                            );
                        } else {
                            delete parsed.gs[key];
                        }
                    } else {
                        delete parsed.gs[key];
                    }
                } else if (key === 'ie') {
                    parsed.gs[key] = parsed.gs[key] ? 1 : 0;
                } else if (!parsed.gs[key]) {
                    delete parsed.gs[key];
                }
            }
        }

        for (const mpid in parsed) {
            if (parsed.hasOwnProperty(mpid)) {
                if (!SDKv2NonMPIDCookieKeys[mpid]) {
                    for (const innerKey in parsed[mpid]) {
                        if (parsed[mpid].hasOwnProperty(innerKey)) {
                            if (Base64CookieKeys[innerKey]) {
                                if (
                                    mpInstance._Helpers.isObject(
                                        parsed[mpid][innerKey]
                                    ) &&
                                    Object.keys(parsed[mpid][innerKey]).length
                                ) {
                                    parsed[mpid][innerKey] = Base64.encode(
                                        JSON.stringify(parsed[mpid][innerKey])
                                    );
                                } else {
                                    delete parsed[mpid][innerKey];
                                }
                            }
                        }
                    }
                }
            }
        }

        return Utils.createCookieString(JSON.stringify(parsed));
    };

    // TODO: This should actually be decodePersistenceString or
    //       we should refactor this to take a string and return an object
    this.decodePersistence = function(persistence: string): string {
        try {
            if (persistence) {
                let parsed = JSON.parse(Utils.revertCookieString(persistence));
                if (
                    mpInstance._Helpers.isObject(parsed) &&
                    Object.keys(parsed).length
                ) {
                    for (const key in parsed.gs) {
                        if (parsed.gs.hasOwnProperty(key)) {
                            if (Base64CookieKeys[key]) {
                                parsed.gs[key] = JSON.parse(
                                    Base64.decode(parsed.gs[key])
                                );
                            } else if (key === 'ie') {
                                parsed.gs[key] = Boolean(
                                    parsed.gs[key]
                                );
                            }
                        }
                    }

                    for (const mpid in parsed) {
                        if (parsed.hasOwnProperty(mpid)) {
                            if (!SDKv2NonMPIDCookieKeys[mpid]) {
                                for (const innerKey in parsed[mpid]) {
                                    if (parsed[mpid].hasOwnProperty(innerKey)) {
                                        if (Base64CookieKeys[innerKey]) {
                                            if (parsed[mpid][innerKey].length) {
                                                parsed[mpid][
                                                    innerKey
                                                ] = JSON.parse(
                                                    Base64.decode(
                                                        parsed[mpid][innerKey]
                                                    )
                                                );
                                            }
                                        }
                                    }
                                }
                            } else if (mpid === 'l') {
                                parsed[mpid] = Boolean(parsed[mpid]);
                            }
                        }
                    }
                }

                return JSON.stringify(parsed);
            }
        } catch (e) {
            mpInstance.Logger.error('Problem with decoding cookie');
        }
        return null;
    };

    this.getCookieDomain = function(): string {
        if (mpInstance._Store.SDKConfig.cookieDomain) {
            return mpInstance._Store.SDKConfig.cookieDomain;
        } else {
            const rootDomain = self.getDomain(document, location.hostname);
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
    this.getDomain = function(
        doc: Document,
        locationHostname: string
    ): string {
        let testParts: string;
        const mpTest = 'mptest=cookie';
        const hostname = locationHostname.split('.');
        for (let i = hostname.length - 1; i >= 0; i--) {
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

    this.saveUserCookieSyncDatesToPersistence = function(
        mpid: MPID,
        csd: CookieSyncDates
    ): void {
        if (csd) {
            const persistence = self.getPersistence();
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

    this.swapCurrentUser = function(
        previousMPID: MPID,
        currentMPID: MPID,
        currentSessionMPIDs: MPID[]
    ): void {
        if (previousMPID && currentMPID && previousMPID !== currentMPID) {
            const persistence = self.getPersistence();
            if (persistence) {
                persistence.cu = currentMPID;
                persistence.gs.csm = currentSessionMPIDs;
                self.savePersistence(persistence);
            }
        }
    };

    // https://go.mparticle.com/work/SQDSDKS-6021
    this.savePersistence = function(
        persistence: IPersistenceMinified
    ): void {
        // Block mprtcl-v4 persistence when noFunctional is true
        if (mpInstance._CookieConsentManager?.getNoFunctional()) {
            return;
        }

        const encodedPersistence = self.encodePersistence(
            JSON.stringify(persistence)
        );
        const date = new Date();
        const key = mpInstance._Store.storageName;
        const expires = new Date(
            date.getTime() +
                (mpInstance._Store.SDKConfig as Dictionary).cookieExpiration *
                    24 *
                    60 *
                    60 *
                    1000
        ).toUTCString();
        const cookieDomain = self.getCookieDomain();
        let domain: string;

        if (cookieDomain === '') {
            domain = '';
        } else {
            domain = ';domain=' + cookieDomain;
        }

        if (mpInstance._Store.SDKConfig.useCookieStorage) {
            const encodedCookiesWithExpirationAndPath = self.reduceAndEncodePersistence(
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

    this.getPersistence = function(): IPersistenceMinified {
        const persistence = this.useLocalStorage()
            ? this.getLocalStorage()
            : this.getCookie();

        return persistence;
    };

    this.getFirstSeenTime = function(mpid: MPID): number | null {
        if (!mpid) {
            return null;
        }
        const persistence = self.getPersistence();
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
    this.setFirstSeenTime = function(mpid: MPID, time?: number): void {
        if (!mpid) {
            return;
        }
        // https://go.mparticle.com/work/SQDSDKS-6329
        if (!time) {
            time = new Date().getTime();
        }
        const persistence = self.getPersistence();
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
    this.getLastSeenTime = function(mpid: MPID): number | null {
        if (!mpid) {
            return null;
        }
        if (mpid === mpInstance.Identity.getCurrentUser().getMPID()) {
            //if the mpid is the current user, its last seen time is the current time
            return new Date().getTime();
        } else {
            const persistence = self.getPersistence();
            if (persistence && persistence[mpid] && persistence[mpid].lst) {
                return persistence[mpid].lst;
            }
            return null;
        }
    };

    this.setLastSeenTime = function(mpid: MPID, time?: number): void {
        if (!mpid) {
            return;
        }
        // https://go.mparticle.com/work/SQDSDKS-6329
        if (!time) {
            time = new Date().getTime();
        }
        const persistence = self.getPersistence();
        if (persistence && persistence[mpid]) {
            persistence[mpid].lst = time;
            self.savePersistence(persistence);
        }
    };

    this.getDeviceId = function(): string {
        return mpInstance._Store.deviceId;
    };

    this.setDeviceId = function(guid: string): void {
        mpInstance._Store.deviceId = guid;
        self.update();
    };

    this.resetPersistence = function(): void {
        localStorage.clear();

        self.expireCookies(StorageNames.cookieName);
        self.expireCookies(StorageNames.cookieNameV2);
        self.expireCookies(StorageNames.cookieNameV3);
        self.expireCookies(StorageNames.cookieNameV4);
        self.expireCookies(mpInstance._Store.storageName);

        if ((window.mParticle as Dictionary)?._isTestEnv) {
            const testWorkspaceToken = 'abcdef';
            removeLocalStorage(
                mpInstance._Helpers.createMainStorageName(testWorkspaceToken)
            );
            self.expireCookies(
                mpInstance._Helpers.createMainStorageName(testWorkspaceToken)
            );
        }
    };

    // https://go.mparticle.com/work/SQDSDKS-6045
    // Forwarder Batching Code
    this.forwardingStatsBatches = {
        uploadsTable: {},
        forwardingStatsEventQueue: [],
    };
}
