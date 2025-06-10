import { Context } from '@mparticle/event-models';
import {
    IdentityApiData,
    MPID,
    Product,
    UserIdentities,
} from '@mparticle/web-sdk';
import { IForwardingStatsData } from './apiClient';
import {
    IntegrationAttributes,
    ServerSettings,
    SessionAttributes,
} from './store';
import { Dictionary } from './utils';
import { IMinifiedConsentJSONObject } from './consent';
import { UserAttributes } from './identity-user-interfaces';
import { CookieSyncDates } from './cookieSyncManager';

export type UploadsTable = Dictionary<any>;
export interface iForwardingStatsBatches {
    uploadsTable: UploadsTable;
    forwardingStatsEventQueue: IForwardingStatsData[];
}

export interface IGlobalStoreV2MinifiedKeys {
    sid: string; // Session ID
    ie: boolean; // Is Enabled
    sa: SessionAttributes;
    ss: ServerSettings;
    dt: string; // Dev Token
    av: string; // App Version
    cgid: string; // Client Generated ID
    das: string; // Device ID/ Device Application String
    ia: IntegrationAttributes;
    c: Context;
    csm: MPID[]; // Current Session MPIDs
    les: number; // Last Event Sent Timestamp
    ssd: number; // Session Start Date
}

export interface IPersistenceMinified extends Dictionary {
    cu: MPID; // Current User MPID
    gs: IGlobalStoreV2MinifiedKeys;
    l: boolean; // IsLoggedIn

    // Persistence Minified can also store optional dictionaries with
    // an idex of MPID
    // [mpid: MPID]: Dictionary<IUserPersistenceMinified>;

    // For Example:
    // {
    //     cu: '123345',
    //     gs: {
    //         sid: '123',
    //         ie: false,
    //         sa: {},
    //         ss: {},
    //         dt: '',
    //         av: '',
    //         cgid: '123',
    //         das: 'das',
    //         ia: {},
    //         c: null,
    //         csm: ['123'],
    //         les: 0,
    //         ssd: 0,
    //     },
    //     l: false,
    //     MPID1: {
    //         csd: {
    //             [moduleid]: 1234567890,
    //         },
    //         ui: {
    //             customerid: '12346',
    //         },
    //         ua: {
    //             age '42',
    //         },
    //     },
    // };
}

export interface IUserPersistenceMinified extends Dictionary {
    csd: CookieSyncDates; // list of timestamps for last cookie sync per module
    con: IMinifiedConsentJSONObject; // Consent State
    ui: UserIdentities; // User Identities
    ua: UserAttributes; // User Attributes

    // https://go.mparticle.com/work/SQDSDKS-6048
    cp: Product[]; // Cart Products

    fst: number; // First Seen Time
    lst: number; // Last Seen Time
}

export interface IPersistence {
    useLocalStorage(): boolean;
    initializeStorage(): void;
    update(): void;
    storeProductsInMemory(products: Product[], mpid: MPID): void;
    storeDataInMemory(obj: IPersistenceMinified, currentMPID: MPID): void;
    determineLocalStorageAvailability(storage: Storage): boolean;
    getUserProductsFromLS(mpid: MPID): Product[];
    getAllUserProductsFromLS(): Product[];
    setLocalStorage(): void;
    getLocalStorage(): IPersistenceMinified | null;
    expireCookies(cookieName: string): void;
    getCookie(): IPersistenceMinified | null;
    setCookie(): void;
    reduceAndEncodePersistence(
        persistence: IPersistenceMinified,
        expires: string,
        domain: string,
        maxCookieSize: number,
    ): string;
    findPrevCookiesBasedOnUI(identityApiData: IdentityApiData): void;
    encodePersistence(persistence: IPersistenceMinified): string;
    decodePersistence(persistenceString: string): string;
    getCookieDomain(): string;
    getDomain(doc: string, locationHostname: string): string;
    getCartProducts(mpid: MPID): Product[];
    setCartProducts(allProducts: Product[]): void;
    saveUserCookieSyncDatesToPersistence(
        mpid: MPID,
        csd: CookieSyncDates,
    ): void;
    savePersistence(persistance: IPersistenceMinified): void;
    getPersistence(): IPersistenceMinified;
    getFirstSeenTime(mpid: MPID): string | null;
    setFirstSeenTime(mpid: MPID, time: number): void;
    getLastSeenTime(mpid: MPID): number | null;
    setLastSeenTime(mpid: MPID, time: number): void;
    getDeviceId(): string;
    setDeviceId(guid: string): void;
    resetPersistence(): void;
    swapCurrentUser(
        previousMPID: MPID,
        currentMPID: MPID,
        currentSessionMPIDs?: MPID[],
    ): void;
    forwardingStatsBatches: iForwardingStatsBatches;
}
