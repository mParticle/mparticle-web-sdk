import { Context } from '@mparticle/event-models';
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
    c: Context;
    csm: MPID[];
    les: number;
    ssd: number;
}
export interface IPersistenceMinified extends Dictionary {
    cu: MPID;
    gs: IGlobalStoreV2MinifiedKeys;
    l: boolean;
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
    storeDataInMemory(obj: IPersistenceMinified, currentMPID: MPID): void;
    determineLocalStorageAvailability(storage: Storage): boolean;
    setLocalStorage(): void;
    getLocalStorage(): IPersistenceMinified | null;
    expireCookies(cookieName: string): void;
    getCookie(): IPersistenceMinified | null;
    setCookie(): void;
    reduceAndEncodePersistence(persistence: IPersistenceMinified, expires: string, domain: string, maxCookieSize: number): string;
    findPrevCookiesBasedOnUI(identityApiData: IdentityApiData): void;
    encodePersistence(persistence: IPersistenceMinified): string;
    decodePersistence(persistenceString: string): string;
    getCookieDomain(): string;
    getDomain(doc: string, locationHostname: string): string;
    saveUserCookieSyncDatesToPersistence(mpid: MPID, csd: CookieSyncDates): void;
    savePersistence(persistance: IPersistenceMinified): void;
    getPersistence(): IPersistenceMinified;
    getFirstSeenTime(mpid: MPID): string | null;
    setFirstSeenTime(mpid: MPID, time: number): void;
    getLastSeenTime(mpid: MPID): number | null;
    setLastSeenTime(mpid: MPID, time: number): void;
    getDeviceId(): string;
    setDeviceId(guid: string): void;
    resetPersistence(): void;
    swapCurrentUser(previousMPID: MPID, currentMPID: MPID, currentSessionMPIDs?: MPID[]): void;
    forwardingStatsBatches: iForwardingStatsBatches;
}
