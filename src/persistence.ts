import Constants from './constants';
import Polyfill from './polyfill';
import * as Utils from './utils';
import { IMParticleWebSDKInstance } from './mp-instance';
import { IPersistence, IPersistenceMinified } from './persistence.interfaces';
import { IdentityApiData, MPID } from '@mparticle/web-sdk';
import { CookieSyncDates } from './cookieSyncManager';
import { Dictionary } from './utils';
import { IMParticleInstanceManager } from './sdkRuntimeModels';

const Base64 = Polyfill.Base64,
    Messages = Constants.Messages,
    Base64CookieKeys = Constants.Base64CookieKeys,
    SDKv2NonMPIDCookieKeys = Constants.SDKv2NonMPIDCookieKeys,
    StorageNames = Constants.StorageNames;

function getMParticleManager(): IMParticleInstanceManager | undefined {
    return (window as { mParticle?: IMParticleInstanceManager }).mParticle;
}

export default function _Persistence(
    this: IPersistence,
    mpInstance: IMParticleWebSDKInstance
) {
    const self = this;

    // https://go.mparticle.com/work/SQDSDKS-5022
    this.useLocalStorage = function(): boolean {
        return (
            !mpInstance._Store.SDKConfig.useCookieStorage &&
            mpInstance._Store.isLocalStorageAvailable
        );
    };

    function setFirstRunFromExistingData(
        localStorageData: IPersistenceMinified | null,
        cookies: IPersistenceMinified | null
    ): void {
        if (!localStorageData && !cookies) {
            mpInstance._Store.isFirstRun = true;
            (mpInstance._Store as Dictionary).mpid = 0;
            return;
        }
        mpInstance._Store.isFirstRun = false;
    }

    function mergeStorageSources(
        localStorageData: IPersistenceMinified | null,
        cookies: IPersistenceMinified | null
    ) {
        if (localStorageData && cookies) {
            // https://go.mparticle.com/work/SQDSDKS-6047
            return Utils.extend(false, localStorageData, cookies);
        }
        return localStorageData || cookies;
    }

    // For migrating from localStorage to cookies -- If an instance switches from
    // localStorage to cookies, then no mParticle cookie exists yet and there is
    // localStorage. Get the localStorage, set them to cookies, then delete the
    // localStorage item.
    function migrateLocalStorageToCookies(
        storage: Storage,
        localStorageData: IPersistenceMinified | null,
        cookies: IPersistenceMinified | null
    ) {
        let allData;
        if (localStorageData) {
            allData = mergeStorageSources(localStorageData, cookies);
            storage.removeItem(mpInstance._Store.storageName);
        } else if (cookies) {
            allData = cookies;
        }
        self.storeDataInMemory(allData);
        return allData;
    }

    // For migrating from cookie to localStorage -- If an instance is newly
    // switching from cookies to localStorage, then no mParticle localStorage
    // exists yet and there are cookies. Get the cookies, set them to
    // localStorage, then delete the cookies.
    function migrateCookiesToLocalStorage(
        localStorageData: IPersistenceMinified | null,
        cookies: IPersistenceMinified | null
    ) {
        if (!cookies) {
            self.storeDataInMemory(localStorageData);
            return;
        }
        const allData = mergeStorageSources(localStorageData, cookies);
        self.storeDataInMemory(allData);
        self.expireCookies(mpInstance._Store.storageName);
        return allData;
    }

    function loadPersistenceIntoMemory(
        localStorageData: IPersistenceMinified | null,
        cookies: IPersistenceMinified | null
    ) {
        if (!mpInstance._Store.isLocalStorageAvailable) {
            self.storeDataInMemory(cookies);
            return;
        }
        if (mpInstance._Store.SDKConfig.useCookieStorage) {
            return migrateLocalStorageToCookies(
                window.localStorage,
                localStorageData,
                cookies
            );
        }
        return migrateCookiesToLocalStorage(localStorageData, cookies);
    }

    function copyNonCurrentUserMpids(allData: IPersistenceMinified): void {
        for (let key in allData) {
            if (
                allData.hasOwnProperty(key) &&
                !SDKv2NonMPIDCookieKeys[key]
            ) {
                mpInstance._Store.nonCurrentUserMPIDs[key] = allData[key];
            }
        }
    }

    function clearCorruptStorage(): void {
        if (
            self.useLocalStorage() &&
            mpInstance._Store.isLocalStorageAvailable
        ) {
            localStorage.removeItem(mpInstance._Store.storageName);
            return;
        }
        self.expireCookies(mpInstance._Store.storageName);
    }

    this.initializeStorage = function(): void {
        try {
            const localStorageData = self.getLocalStorage();
            const cookies = self.getCookie();

            // https://go.mparticle.com/work/SQDSDKS-6045
            setFirstRunFromExistingData(localStorageData, cookies);

            // https://go.mparticle.com/work/SQDSDKS-6045
            if (!mpInstance._Store.isLocalStorageAvailable) {
                mpInstance._Store.SDKConfig.useCookieStorage = true;
            }

            // https://go.mparticle.com/work/SQDSDKS-6046
            const allData = loadPersistenceIntoMemory(
                localStorageData,
                cookies
            );
            copyNonCurrentUserMpids(allData);
            self.update();
        } catch (e) {
            // If cookies or local storage is corrupt, we want to remove it
            // so that in the future, initializeStorage will work
            clearCorruptStorage();
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

    function applyEmptyPersistenceDefaults(): void {
        mpInstance.Logger.verbose(
            Messages.InformationMessages.CookieNotFound
        );
        mpInstance._Store.clientId =
            mpInstance._Store.clientId ||
            mpInstance._Helpers.generateUniqueId();
        mpInstance._Store.deviceId =
            mpInstance._Store.deviceId ||
            mpInstance._Helpers.generateUniqueId();
    }

    function hydrateStoreFromPersistence(
        obj: IPersistenceMinified,
        currentMPID?: MPID
    ): void {
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
        mpInstance._Store.context = obj.gs.c || mpInstance._Store.context;
        mpInstance._Store.currentSessionMPIDs =
            obj.gs.csm || mpInstance._Store.currentSessionMPIDs;

        mpInstance._Store.isLoggedIn = obj.l === true;

        if (obj.gs.les) {
            mpInstance._Store.dateLastEventSent = new Date(obj.gs.les);
        }

        mpInstance._Store.sessionStartDate = obj.gs.ssd
            ? new Date(obj.gs.ssd)
            : new Date();

        if (currentMPID) {
            obj = obj[currentMPID];
        } else {
            obj = obj[obj.cu];
        }
    }

    // https://go.mparticle.com/work/SQDSDKS-6045
    this.storeDataInMemory = function(obj: IPersistenceMinified, currentMPID?: MPID): void {
        try {
            if (!obj) {
                applyEmptyPersistenceDefaults();
                return;
            }
            hydrateStoreFromPersistence(obj, currentMPID);
        } catch (e) {
            mpInstance.Logger.error(Messages.ErrorMessages.CookieParseError);
        }
    };

    // https://go.mparticle.com/work/SQDSDKS-5022
    this.determineLocalStorageAvailability = function(
        storage?: Storage
    ): boolean {
        const mParticleManager = getMParticleManager();
        if (mParticleManager?._forceNoLocalStorage) {
            return false;
        }

        try {
            storage.setItem('mparticle', 'test');
            const result = storage.getItem('mparticle') === 'test';
            storage.removeItem('mparticle');
            return Boolean(result && storage);
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

        let key = mpInstance._Store.storageName,
            localStorageData = self.getLocalStorage() || ({} as IPersistenceMinified),
            currentUser = mpInstance.Identity.getCurrentUser(),
            mpid = currentUser ? currentUser.getMPID() : null;
        if (!mpInstance._Store.SDKConfig.useCookieStorage) {
            localStorageData.gs = localStorageData.gs || ({} as IPersistenceMinified['gs']);

            localStorageData.l = mpInstance._Store.isLoggedIn ? 1 : 0;

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

    function setGlobalStorageAttributes(data: IPersistenceMinified): IPersistenceMinified {
        let store = mpInstance._Store;
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
        const decodedPersistence = self.decodePersistence(
            window.localStorage.getItem(key)
        );

        if (!decodedPersistence) {
            return null;
        }

        const parsedPersistence = JSON.parse(
            decodedPersistence
        ) as IPersistenceMinified;
        const obj: IPersistenceMinified = {} as IPersistenceMinified;

        for (const key in parsedPersistence) {
            if (parsedPersistence.hasOwnProperty(key)) {
                obj[key] = parsedPersistence[key];
            }
        }

        if (Object.keys(obj).length) {
            return obj;
        }

        return null;
    };

    this.expireCookies = function(cookieName: string): void {
        let date = new Date(),
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

    this.getCookie = function(): IPersistenceMinified | null {
        let cookies,
            key = mpInstance._Store.storageName,
            i,
            l,
            parts,
            name,
            cookie,
            result: string | Dictionary<string> | undefined = key
                ? undefined
                : {};

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
                (result as Dictionary<string>)[name as string] = (
                    mpInstance._Helpers as Dictionary
                ).converted(cookie);
            }
        }

        if (result) {
            mpInstance.Logger.verbose(Messages.InformationMessages.CookieFound);
            return JSON.parse(
                self.decodePersistence(result as string) as string
            );
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

        let mpid,
            currentUser = mpInstance.Identity.getCurrentUser();
        if (currentUser) {
            mpid = currentUser.getMPID();
        }
        let date = new Date(),
            key = mpInstance._Store.storageName,
            cookies = self.getCookie() || ({} as IPersistenceMinified),
            expires = new Date(
                date.getTime() +
                    mpInstance._Store.SDKConfig.cookieExpiration *
                        24 *
                        60 *
                        60 *
                        1000
            ).toUTCString(),
            cookieDomain,
            domain,
            encodedCookiesWithExpirationAndPath;

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

        cookies.l = mpInstance._Store.isLoggedIn ? 1 : 0;

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
    function isEncodedCookieTooLarge(
        encoded: string,
        maxCookieSize: number
    ): boolean {
        return encoded.length > maxCookieSize;
    }

    function removeUnsessionedMpidsWhenOversized(
        persistence: IPersistenceMinified,
        expires: string,
        domain: string,
        maxCookieSize: number
    ): string {
        let encodedCookiesWithExpirationAndPath;
        for (let key in persistence) {
            if (!persistence.hasOwnProperty(key)) {
                continue;
            }
            encodedCookiesWithExpirationAndPath = createFullEncodedCookie(
                persistence,
                expires,
                domain
            );
            if (
                !isEncodedCookieTooLarge(
                    encodedCookiesWithExpirationAndPath,
                    maxCookieSize
                )
            ) {
                continue;
            }
            if (SDKv2NonMPIDCookieKeys[key] || key === persistence.cu) {
                continue;
            }
            delete persistence[key];
        }
        return encodedCookiesWithExpirationAndPath;
    }

    function collectRemovableMpids(
        persistence: IPersistenceMinified
    ): Dictionary {
        const MPIDsOnCookie: Dictionary = {};
        for (let potentialMPID in persistence) {
            if (!persistence.hasOwnProperty(potentialMPID)) {
                continue;
            }
            if (
                SDKv2NonMPIDCookieKeys[potentialMPID] ||
                potentialMPID === persistence.cu
            ) {
                continue;
            }
            MPIDsOnCookie[potentialMPID] = 1;
        }
        return MPIDsOnCookie;
    }

    function removeMpidsNotInCurrentSession(
        persistence: IPersistenceMinified,
        MPIDsOnCookie: Dictionary,
        currentSessionMPIDs: MPID[],
        expires: string,
        domain: string,
        maxCookieSize: number
    ): string {
        let encodedCookiesWithExpirationAndPath;
        for (let mpid in MPIDsOnCookie) {
            encodedCookiesWithExpirationAndPath = createFullEncodedCookie(
                persistence,
                expires,
                domain
            );
            if (
                !isEncodedCookieTooLarge(
                    encodedCookiesWithExpirationAndPath,
                    maxCookieSize
                )
            ) {
                continue;
            }
            if (!MPIDsOnCookie.hasOwnProperty(mpid)) {
                continue;
            }
            if (currentSessionMPIDs.indexOf(mpid) === -1) {
                delete persistence[mpid];
            }
        }
        return encodedCookiesWithExpirationAndPath;
    }

    function logAndRemoveOversizedMpid(
        persistence: IPersistenceMinified,
        MPIDtoRemove: MPID,
        maxCookieSize: number
    ): void {
        if (persistence[MPIDtoRemove]) {
            mpInstance.Logger.verbose(
                'Size of new encoded cookie is larger than maxCookieSize setting of ' +
                    maxCookieSize +
                    '. Removing from cookie the earliest logged in MPID containing: ' +
                    JSON.stringify(persistence[MPIDtoRemove], null, 2)
            );
            delete persistence[MPIDtoRemove];
            return;
        }
        mpInstance.Logger.error(
            'Unable to save MPID data to cookies because the resulting encoded cookie is larger than the maxCookieSize setting of ' +
                maxCookieSize +
                '. We recommend using a maxCookieSize of 1500.'
        );
    }

    function removeCurrentSessionMpidsByAge(
        persistence: IPersistenceMinified,
        currentSessionMPIDs: MPID[],
        expires: string,
        domain: string,
        maxCookieSize: number
    ): string {
        let encodedCookiesWithExpirationAndPath;
        for (let i = 0; i < currentSessionMPIDs.length; i++) {
            encodedCookiesWithExpirationAndPath = createFullEncodedCookie(
                persistence,
                expires,
                domain
            );
            if (
                !isEncodedCookieTooLarge(
                    encodedCookiesWithExpirationAndPath,
                    maxCookieSize
                )
            ) {
                break;
            }
            logAndRemoveOversizedMpid(
                persistence,
                currentSessionMPIDs[i],
                maxCookieSize
            );
        }
        return encodedCookiesWithExpirationAndPath;
    }

    this.reduceAndEncodePersistence = function(
        persistence: IPersistenceMinified,
        expires: string,
        domain: string,
        maxCookieSize: number
    ): string {
        const currentSessionMPIDs = persistence.gs.csm
            ? persistence.gs.csm
            : [];
        if (!currentSessionMPIDs.length) {
            return removeUnsessionedMpidsWhenOversized(
                persistence,
                expires,
                domain,
                maxCookieSize
            );
        }

        const MPIDsOnCookie = collectRemovableMpids(persistence);
        if (Object.keys(MPIDsOnCookie).length) {
            removeMpidsNotInCurrentSession(
                persistence,
                MPIDsOnCookie,
                currentSessionMPIDs,
                expires,
                domain,
                maxCookieSize
            );
        }
        return removeCurrentSessionMpidsByAge(
            persistence,
            currentSessionMPIDs,
            expires,
            domain,
            maxCookieSize
        );
    };

    function createFullEncodedCookie(persistence: IPersistenceMinified, expires: string, domain: string): string {
        return (
            self.encodePersistence(JSON.stringify(persistence)) +
            ';expires=' +
            expires +
            ';path=/' +
            domain
        );
    }

    function cookieUiMatchesRequestedIdentity(
        cookieUIs,
        requestedIdentityType: string,
        requestedValue
    ): boolean {
        for (let cookieUIType in cookieUIs) {
            if (
                requestedIdentityType === cookieUIType &&
                requestedValue === cookieUIs[cookieUIType]
            ) {
                return true;
            }
        }
        return false;
    }

    function findMpidForRequestedIdentity(
        persistence: IPersistenceMinified,
        requestedIdentityType: string,
        requestedValue
    ) {
        let matchedUser;
        for (let key in persistence) {
            // any value in persistence that has an MPID key will be an MPID to search through
            // other keys on the cookie are currentSessionMPIDs and currentMPID which should not be searched
            if (!persistence[key].mpid) {
                continue;
            }
            if (
                cookieUiMatchesRequestedIdentity(
                    persistence[key].ui,
                    requestedIdentityType,
                    requestedValue
                )
            ) {
                matchedUser = key;
            }
        }
        return matchedUser;
    }

    function findMpidMatchingIdentities(
        persistence: IPersistenceMinified | null,
        identityApiData: IdentityApiData
    ) {
        let matchedUser;
        for (let requestedIdentityType in identityApiData.userIdentities) {
            if (!persistence || !Object.keys(persistence).length) {
                continue;
            }
            const match = findMpidForRequestedIdentity(
                persistence,
                requestedIdentityType,
                identityApiData.userIdentities[requestedIdentityType]
            );
            if (match) {
                matchedUser = match;
            }
        }
        return matchedUser;
    }

    this.findPrevCookiesBasedOnUI = function(identityApiData: IdentityApiData): void {
        const persistence = mpInstance._Persistence.getPersistence();
        if (!identityApiData) {
            return;
        }
        const matchedUser = findMpidMatchingIdentities(
            persistence,
            identityApiData
        );
        if (matchedUser) {
            self.storeDataInMemory(persistence, matchedUser);
        }
    };

    function isNonEmptyArrayOrObject(value): boolean {
        if (Array.isArray(value)) {
            return value.length > 0;
        }
        if (!mpInstance._Helpers.isObject(value)) {
            return false;
        }
        return Object.keys(value).length > 0;
    }

    function encodeGsBase64Field(gs, key: string): void {
        if (!gs[key] || !isNonEmptyArrayOrObject(gs[key])) {
            delete gs[key];
            return;
        }
        gs[key] = Base64.encode(JSON.stringify(gs[key]));
    }

    function encodeGlobalSettings(gs): void {
        for (let key in gs) {
            if (!gs.hasOwnProperty(key)) {
                continue;
            }
            if (Base64CookieKeys[key]) {
                encodeGsBase64Field(gs, key);
                continue;
            }
            if (key === 'ie') {
                gs[key] = gs[key] ? 1 : 0;
                continue;
            }
            if (!gs[key]) {
                delete gs[key];
            }
        }
    }

    function encodeMpidBase64Field(container, key: string): void {
        const value = container[key];
        if (
            mpInstance._Helpers.isObject(value) &&
            Object.keys(value).length
        ) {
            container[key] = Base64.encode(JSON.stringify(value));
            return;
        }
        delete container[key];
    }

    function encodeMpidRecord(record): void {
        for (let key in record) {
            if (!record.hasOwnProperty(key)) {
                continue;
            }
            if (Base64CookieKeys[key]) {
                encodeMpidBase64Field(record, key);
            }
        }
    }

    function encodeMpidRecords(persistence): void {
        for (let mpid in persistence) {
            if (!persistence.hasOwnProperty(mpid)) {
                continue;
            }
            if (SDKv2NonMPIDCookieKeys[mpid]) {
                continue;
            }
            encodeMpidRecord(persistence[mpid]);
        }
    }

    this.encodePersistence = function(persistenceString: string): string {
        const persistence = JSON.parse(
            persistenceString
        ) as IPersistenceMinified;
        encodeGlobalSettings(persistence.gs);
        encodeMpidRecords(persistence);
        return Utils.createCookieString(JSON.stringify(persistence));
    };

    function decodeGlobalSettings(gs): void {
        for (let key in gs) {
            if (!gs.hasOwnProperty(key)) {
                continue;
            }
            if (Base64CookieKeys[key]) {
                gs[key] = JSON.parse(Base64.decode(gs[key]));
                continue;
            }
            if (key === 'ie') {
                gs[key] = Boolean(gs[key]);
            }
        }
    }

    function decodeMpidRecord(record): void {
        for (let key in record) {
            if (!record.hasOwnProperty(key)) {
                continue;
            }
            if (!Base64CookieKeys[key]) {
                continue;
            }
            if (record[key].length) {
                record[key] = JSON.parse(Base64.decode(record[key]));
            }
        }
    }

    function decodeMpidRecords(persistence): void {
        for (let mpid in persistence) {
            if (!persistence.hasOwnProperty(mpid)) {
                continue;
            }
            if (!SDKv2NonMPIDCookieKeys[mpid]) {
                decodeMpidRecord(persistence[mpid]);
                continue;
            }
            if (mpid === 'l') {
                persistence[mpid] = Boolean(persistence[mpid]);
            }
        }
    }

    // TODO: This should actually be decodePersistenceString or
    //       we should refactor this to take a string and return an object
    this.decodePersistence = function(
        persistenceString: string | null
    ): string | void {
        try {
            if (!persistenceString) {
                return;
            }
            const persistence = JSON.parse(
                Utils.revertCookieString(persistenceString)
            ) as IPersistenceMinified;
            if (
                mpInstance._Helpers.isObject(persistence) &&
                Object.keys(persistence).length
            ) {
                decodeGlobalSettings(persistence.gs);
                decodeMpidRecords(persistence);
            }
            return JSON.stringify(persistence);
        } catch (e) {
            mpInstance.Logger.error('Problem with decoding cookie');
        }
    };

    this.getCookieDomain = function(): string {
        if (mpInstance._Store.SDKConfig.cookieDomain) {
            return mpInstance._Store.SDKConfig.cookieDomain;
        } else {
            let rootDomain = self.getDomain(document, location.hostname);
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
    this.getDomain = function(doc: Document, locationHostname: string): string {
        let i,
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

    this.saveUserCookieSyncDatesToPersistence = function(mpid: MPID, csd: CookieSyncDates): void {
        if (csd) {
            let persistence = self.getPersistence();
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
        currentSessionMPIDs?: MPID[]
    ): void {
        if (previousMPID && currentMPID && previousMPID !== currentMPID) {
            let persistence = self.getPersistence();
            if (persistence) {
                persistence.cu = currentMPID;
                persistence.gs.csm = currentSessionMPIDs;
                self.savePersistence(persistence);
            }
        }
    };

    // https://go.mparticle.com/work/SQDSDKS-6021
    this.savePersistence = function(persistence: IPersistenceMinified): void {
        // Block mprtcl-v4 persistence when noFunctional is true
        if (mpInstance._CookieConsentManager?.getNoFunctional()) {
            return;
        }

        let encodedPersistence = self.encodePersistence(
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
            ).toUTCString(),
            cookieDomain = self.getCookieDomain(),
            domain;

        if (cookieDomain === '') {
            domain = '';
        } else {
            domain = ';domain=' + cookieDomain;
        }

        if (mpInstance._Store.SDKConfig.useCookieStorage) {
            let encodedCookiesWithExpirationAndPath = self.reduceAndEncodePersistence(
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
                try {
                    localStorage.setItem(
                        mpInstance._Store.storageName,
                        encodedPersistence
                    );
                } catch (e) {
                    mpInstance.Logger.error(
                        'Error saving persistence to localStorage.'
                    );
                }
            }
        }
    };

    this.getPersistence = function(): IPersistenceMinified | null {
        let persistence = this.useLocalStorage()
            ? this.getLocalStorage()
            : this.getCookie();

        return persistence;
    };

    this.getFirstSeenTime = function(mpid: MPID): number | null {
        if (!mpid) {
            return null;
        }
        let persistence = self.getPersistence();
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
        let persistence = self.getPersistence();
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
            let persistence = self.getPersistence();
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
        let persistence = self.getPersistence();
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

        const mParticleManager = getMParticleManager();
        if (mParticleManager?._isTestEnv) {
            let testWorkspaceToken = 'abcdef';
            localStorage.removeItem(
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
