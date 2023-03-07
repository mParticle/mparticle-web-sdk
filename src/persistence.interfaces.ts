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

export interface IGlobalStoreV2DTO {
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

export interface IPersistenceV2DTO {
    cu: MPID; // Current User MPID
    gs: IGlobalStoreV2DTO;
    l: false; // IsLoggedIn
}

export interface IPersistence {
    useLocalStorage(): boolean;
    initializeStorage(): void;
    update(): void;
    storeProductsInMemory(products: Product[], mpid: MPID): void;
    storeDataInMemory(obj: IPersistenceV2DTO, currentMPID: MPID): void;
    determineLocalStorageAvailability(storage: Storage): boolean;
    getUserProductsFromLS(mpid: MPID): Product[];
    getAllUserProductsFromLS(): Product[];
    setLocalStorage(): void;
    getLocalStorage(): IPersistenceV2DTO | null;
    expireCookies(cookieName: string): void;
    getCookie(): IPersistenceV2DTO | null;
    setCookie(): void;
    reduceAndEncodePersistence(
        persistence: IPersistenceV2DTO,
        expires: string,
        domain: string,
        maxCookieSize: number
    ): void;
    findPrevCookiesBasedOnUI(identityApiData: IdentityApiData): void;
    encodePersistence(persistance: IPersistenceV2DTO): string;
    decodePersistence(persistance: IPersistenceV2DTO): string;
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
        userIdentities: UserIdentities
    ): void;
    saveUserCookieSyncDatesToPersistence(mpid: MPID, csd: CookieSyncDate): void;
    saveUserConsentStateToCookies(mpid, consentState: ConsentState): void;
    savePersistence(persistance: IPersistenceV2DTO): void;
    getPersistence(): IPersistenceV2DTO;
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
