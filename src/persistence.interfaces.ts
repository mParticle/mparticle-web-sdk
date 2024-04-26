import { Context } from '@mparticle/event-models';
import {
    AllUserAttributes,
    ConsentState,
    IdentityApiData,
    MPID,
    Product,
    UserIdentities,
} from '@mparticle/web-sdk';
import { ForwardingStatsData } from './apiClient';
import {
    IntegrationAttributes,
    ServerSettings,
    SessionAttributes,
} from './store';
import { Dictionary } from './utils';
import { IMinifiedConsentJSONObject } from './consent';

export type UploadsTable = Dictionary<any>;
export interface iForwardingStatsBatches {
    uploadsTable: UploadsTable;
    forwardingStatsEventQueue: ForwardingStatsData[];
}

// https://go.mparticle.com/work/SQDSDKS-5196
export type UserAttributes = AllUserAttributes;

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
    csm?: MPID[]; // Current Session MPIDs
    les: number; // Last Event Sent Timestamp
    ssd: number; // Session Start Date
}

export interface IPersistenceMinified extends Dictionary {
    cu: MPID; // Current User MPID
    gs: IGlobalStoreV2MinifiedKeys;

    // Stored as 0 or 1 in device persistence but returned as a
    // boolean when decoding from device persistence via
    // _Persistence.getPersistence and _Persistence.decodePersistence
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

export type CookieSyncDates = Dictionary<number>;

export interface IUserPersistenceMinified extends Dictionary {
    csd: CookieSyncDates; // Cookie Sync Dates // list of timestamps for last cookie sync
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
        maxCookieSize: number
    ): string;
    findPrevCookiesBasedOnUI(identityApiData: IdentityApiData): void;
    encodePersistence(persistence: IPersistenceMinified): string;
    decodePersistence(persistenceString: string): string;
    getCookieDomain(): string;
    getDomain(doc: string, locationHostname: string): string;
    getCartProducts(mpid: MPID): Product[];
    setCartProducts(allProducts: Product[]): void;
    saveUserConsentStateToCookies(mpid, consentState: ConsentState): void;
    savePersistence(persistance: IPersistenceMinified): void;
    getPersistence(): IPersistenceMinified;
    getConsentState(mpid: MPID): ConsentState | null;
    getDeviceId(): string;
    setDeviceId(guid: string): void;
    resetPersistence(): void;
    forwardingStatsBatches: iForwardingStatsBatches;
}
