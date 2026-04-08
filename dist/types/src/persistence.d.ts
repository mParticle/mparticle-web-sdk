export default function _Persistence(mpInstance: any): void;
export default class _Persistence {
    constructor(mpInstance: any);
    useLocalStorage: () => any;
    initializeStorage: () => void;
    update: () => void;
    storeDataInMemory: (obj: any, currentMPID: any) => void;
    determineLocalStorageAvailability: (storage: any) => any;
    setLocalStorage: () => void;
    getLocalStorage: () => {};
    expireCookies: (cookieName: any) => void;
    getCookie: () => any;
    setCookie: () => void;
    reduceAndEncodePersistence: (persistence: any, expires: any, domain: any, maxCookieSize: any) => string;
    findPrevCookiesBasedOnUI: (identityApiData: any) => void;
    encodePersistence: (persistence: any) => string;
    decodePersistence: (persistence: any) => string;
    getCookieDomain: () => any;
    getDomain: (doc: any, locationHostname: any) => any;
    saveUserCookieSyncDatesToPersistence: (mpid: any, csd: any) => void;
    swapCurrentUser: (previousMPID: any, currentMPID: any, currentSessionMPIDs: any) => void;
    savePersistence: (persistence: any) => void;
    getPersistence: () => any;
    getFirstSeenTime: (mpid: any) => any;
    /**
     * set the "first seen" time for a user. the time will only be set once for a given
     * mpid after which subsequent calls will be ignored
     */
    setFirstSeenTime: (mpid: any, time: any) => void;
    /**
     * returns the "last seen" time for a user. If the mpid represents the current user, the
     * return value will always be the current time, otherwise it will be to stored "last seen"
     * time
     */
    getLastSeenTime: (mpid: any) => any;
    setLastSeenTime: (mpid: any, time: any) => void;
    getDeviceId: () => any;
    setDeviceId: (guid: any) => void;
    resetPersistence: () => void;
    forwardingStatsBatches: {
        uploadsTable: {};
        forwardingStatsEventQueue: any[];
    };
}
