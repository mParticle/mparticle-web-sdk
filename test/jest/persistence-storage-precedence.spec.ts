/**
 * @jest-environment-options {"url": "http://www.example.com/"}
 */
import { IStore } from '../../src/store';
import { IPersistence } from '../../src/persistence.interfaces';
import { buildPersistenceHarness, encodePersistenceRecord } from './utils';

const storedMPID = 'storedMPID';
const cookieMPID = 'cookieMPID';
const cookieOnlyMPID = 'cookieOnlyMPID';

const cookieValue = encodePersistenceRecord(cookieMPID, 1, {
    [cookieOnlyMPID]: { ui: btoa(JSON.stringify({ 1: 'customer-' + cookieOnlyMPID })) },
});

describe('Persistence with a localStorage record and a persistence cookie', () => {
    let store: IStore;
    let persistence: IPersistence;

    const writeCookie = (value: string): void => {
        document.cookie = `${store.storageName}=${value};path=/;domain=${persistence.getCookieDomain()}`;
    };
    const hasPersistenceCookie = (): boolean =>
        document.cookie
            .split('; ')
            .some(entry => entry.startsWith(store.storageName + '='));

    beforeEach(() => {
        ({ store, persistence } = buildPersistenceHarness({
            isLocalStorageAvailable: true,
        }));
    });

    afterEach(() => {
        localStorage.clear();
        document.cookie = `${store.storageName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${persistence.getCookieDomain()}`;
    });

    it('in localStorage mode, should load the localStorage record, keep the cookie records out of it and expire the cookie', () => {
        store.SDKConfig.useCookieStorage = false;
        localStorage.setItem(store.storageName, encodePersistenceRecord(storedMPID, 0));
        writeCookie(cookieValue);
        expect(persistence.getCookie()?.cu, 'cookie readable before init').toBe(cookieMPID);

        persistence.initializeStorage();

        expect(store.mpid, 'MPID').toBe(storedMPID);
        expect(store.deviceId, 'device stamp').toBe('das-' + storedMPID);
        expect(store.isEnabled, 'opt-out').toBe(false);

        const localStorageRecord = persistence.getLocalStorage();
        expect(localStorageRecord?.cu).toBe(storedMPID);
        expect(localStorageRecord?.[storedMPID].ui).toEqual({ 1: 'customer-' + storedMPID });
        expect(localStorageRecord).not.toHaveProperty(cookieMPID);
        expect(localStorageRecord).not.toHaveProperty(cookieOnlyMPID);
        expect(hasPersistenceCookie(), 'cookie expired').toBe(false);
    });

    it('in localStorage mode with a localStorage record and no cookie, should load the record and write no cookie', () => {
        store.SDKConfig.useCookieStorage = false;
        localStorage.setItem(store.storageName, encodePersistenceRecord(storedMPID, 0));
        expect(hasPersistenceCookie(), 'no cookie before init').toBe(false);

        persistence.initializeStorage();

        expect(store.mpid, 'MPID').toBe(storedMPID);
        expect(store.deviceId, 'device stamp').toBe('das-' + storedMPID);
        expect(store.isEnabled, 'opt-out').toBe(false);

        const localStorageRecord = persistence.getLocalStorage();
        expect(localStorageRecord?.cu).toBe(storedMPID);
        expect(localStorageRecord?.[storedMPID].ui).toEqual({ 1: 'customer-' + storedMPID });
        expect(hasPersistenceCookie(), 'no cookie written').toBe(false);

        writeCookie(cookieValue);
        expect(hasPersistenceCookie(), 'a written cookie is detected').toBe(true);
    });

    it('in localStorage mode with no localStorage record, should migrate the cookie and expire it', () => {
        store.SDKConfig.useCookieStorage = false;
        writeCookie(cookieValue);

        persistence.initializeStorage();

        expect(store.mpid, 'MPID').toBe(cookieMPID);
        expect(store.deviceId, 'device stamp').toBe('das-' + cookieMPID);

        const localStorageRecord = persistence.getLocalStorage();
        expect(localStorageRecord?.cu).toBe(cookieMPID);
        expect(localStorageRecord?.[cookieOnlyMPID].ui).toEqual({ 1: 'customer-' + cookieOnlyMPID });
        expect(hasPersistenceCookie(), 'cookie expired').toBe(false);
    });

    it('in cookie mode, should merge the localStorage record under the cookie and remove the localStorage record', () => {
        store.SDKConfig.useCookieStorage = true;
        localStorage.setItem(store.storageName, encodePersistenceRecord(storedMPID, 0));
        writeCookie(cookieValue);

        persistence.initializeStorage();

        expect(store.mpid, 'MPID').toBe(cookieMPID);
        expect(store.deviceId, 'device stamp').toBe('das-' + cookieMPID);

        const cookieRecord = persistence.getCookie();
        expect(cookieRecord?.cu).toBe(cookieMPID);
        expect(cookieRecord?.[cookieOnlyMPID].ui).toEqual({ 1: 'customer-' + cookieOnlyMPID });
        expect(cookieRecord?.[storedMPID].ui).toEqual({ 1: 'customer-' + storedMPID });
        expect(localStorage.getItem(store.storageName)).toBeNull();
    });
});
