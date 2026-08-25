import { IdentityApiData, MPID, Product, UserIdentities } from '@mparticle/web-sdk';
import { IForwardingStatsData } from './apiClient';
import { IntegrationAttributes, ServerSettings, SessionAttributes, LocalSessionAttributes } from './store';
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
    sid: string;
    ie: boolean;
    sa: SessionAttributes;
    lsa?: LocalSessionAttributes;
    ss: ServerSettings;
    dt: string;
    av: string;
    cgid: string;
    das: string;
    ia: IntegrationAttributes;
    c: string | null;
    csm: MPID[];
    les: number;
    ssd: number;
}
export interface IPersistenceMinified extends Dictionary {
    cu: MPID;
    gs: IGlobalStoreV2MinifiedKeys;
    l: boolean | 0 | 1;
}
export interface IUserPersistenceMinified extends Dictionary {
    csd: CookieSyncDates;
    con: IMinifiedConsentJSONObject;
    ui: UserIdentities;
    ua: UserAttributes;
    cp: Product[];
    fst: number;
    lst: number;
}
export interface IPersistence {
    useLocalStorage(): boolean;
    initializeStorage(): void;
    update(): void;
    storeDataInMemory(obj: IPersistenceMinified, currentMPID?: MPID): void;
    determineLocalStorageAvailability(storage?: Storage): boolean;
    setLocalStorage(): void;
    getLocalStorage(): IPersistenceMinified | null;
    expireCookies(cookieName: string): void;
    getCookie(): IPersistenceMinified | null;
    setCookie(): void;
    reduceAndEncodePersistence(persistence: IPersistenceMinified, expires: string, domain: string, maxCookieSize: number): string;
    findPrevCookiesBasedOnUI(identityApiData: IdentityApiData): void;
    encodePersistence(persistence: string): string;
    decodePersistence(persistenceString: string | null): string | void;
    getCookieDomain(): string;
    getDomain(doc: Document, locationHostname: string): string;
    saveUserCookieSyncDatesToPersistence(mpid: MPID, csd: CookieSyncDates): void;
    savePersistence(persistence: IPersistenceMinified): void;
    getPersistence(): IPersistenceMinified | null;
    getFirstSeenTime(mpid: MPID): number | null;
    setFirstSeenTime(mpid: MPID, time?: number): void;
    getLastSeenTime(mpid: MPID): number | null;
    setLastSeenTime(mpid: MPID, time?: number): void;
    getDeviceId(): string;
    setDeviceId(guid: string): void;
    resetPersistence(): void;
    swapCurrentUser(previousMPID: MPID, currentMPID: MPID, currentSessionMPIDs?: MPID[]): void;
    forwardingStatsBatches: iForwardingStatsBatches;
}
