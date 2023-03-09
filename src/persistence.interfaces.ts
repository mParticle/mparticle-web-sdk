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

export type CookieSyncDate = Dictionary<string>;
export type UploadsTable = Dictionary<any>;
export interface iForwardingStatsBatches {
    uploadsTable: UploadsTable;
    forwardingStatsEventQueue: ForwardingStatsData[];
}

// TODO: Migrate this to @types/mparticle__web-sdk
//       https://go.mparticle.com/work/SQDSDKS-5196
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
    csm: MPID[]; // Current Session MPIDs
    les: number; // Last Event Sent Timestamp
    ssd: number; // Session Start Date
}

export interface IPersistenceMinified extends Dictionary {
    cu: MPID; // Current User MPID
    gs: IGlobalStoreV2MinifiedKeys;
    l: false; // IsLoggedIn

    // Persistence Minified can also store optional dictionaries with
    // an idex of MPID
    // [mpid: MPID]: Dictionary<any>;

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
    //         csd: [],
    //         ui: {
    //             customerid: '12346',
    //         },
    //     },
    // };
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
    ): void;
    findPrevCookiesBasedOnUI(identityApiData: IdentityApiData): void;
    encodePersistence(persistance: IPersistenceMinified): string;
    decodePersistence(persistance: IPersistenceMinified): string;
    replaceCommasWithPipes(string: string): string;
    replacePipesWithCommas(string: string): string;
    replaceApostrophesWithQuotes(string: string): string;
    replaceQuotesWithApostrophes(string: string): string;
    createCookieString(string: string): string;
    revertCookieString(string: string): string;
    getCookieDomain(): string;
    getDomain(doc: string, locationHostname: string): string;
    getUserIdentities(mpid: MPID): UserIdentities;
    getAllUserAttributes(mpid: MPID): AllUserAttributes;
    getCartProducts(mpid: MPID): Product[];
    setCartProducts(allProducts: Product[]): void;
    saveUserIdentitiesToPersistence(
        mpid: MPID,
        userIdentities: UserIdentities
    ): void;
    saveUserAttributesToPersistence(
        mpid: MPID,
        userAttributes: UserAttributes
    ): void;
    saveUserCookieSyncDatesToPersistence(mpid: MPID, csd: CookieSyncDate): void;
    saveUserConsentStateToCookies(mpid, consentState: ConsentState): void;
    savePersistence(persistance: IPersistenceMinified): void;
    getPersistence(): IPersistenceMinified;
    getConsentState(mpid: MPID): ConsentState | null;
    getFirstSeenTime(mpid: MPID): string | null;
    setFirstSeenTime(mpid: MPID, time: number): void;
    getLastSeenTime(mpid: MPID): number | null;
    setLastSeenTime(mpid: MPID, time: number): void;
    getDeviceId(): string;
    setDeviceId(guid: string): void;
    resetPersistence(): void;
    forwardingStatsBatches: iForwardingStatsBatches;
}
