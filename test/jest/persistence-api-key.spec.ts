/**
 * @jest-environment-options {"url": "http://www.example.com/"}
 */
import { IStore } from '../../src/store';
import { IPersistence } from '../../src/persistence.interfaces';
import { createCookieString } from '../../src/utils';
import { buildPersistenceHarness } from './utils';

const storedMPID = 'storedMPID';

// A persistence record as the SDK writes it, holding an API key in gs.dt.
const recordWithKey = (devToken: string): string =>
    createCookieString(
        JSON.stringify({
            cu: storedMPID,
            gs: {
                sid: 'SESSION-' + storedMPID,
                ie: 1,
                das: 'das-' + storedMPID,
                dt: devToken,
            },
            l: 0,
            [storedMPID]: {
                ui: btoa(JSON.stringify({ 1: 'customer-' + storedMPID })),
            },
        })
    );

describe('Persistence and the API key', () => {
    let store: IStore;
    let persistence: IPersistence;

    const writeCookie = (value: string): void => {
        document.cookie = `${store.storageName}=${value};path=/;domain=${persistence.getCookieDomain()}`;
    };

    beforeEach(() => {
        ({ store, persistence } = buildPersistenceHarness({
            isLocalStorageAvailable: true,
        }));
    });

    afterEach(() => {
        localStorage.clear();
        document.cookie = `${store.storageName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${persistence.getCookieDomain()}`;
    });

    it('should not take an API key from the persistence cookie when init was given none, while preserving gs.dt in storage', () => {
        store.SDKConfig.useCookieStorage = true;
        store.devToken = null;
        writeCookie(recordWithKey('stored-key'));

        persistence.initializeStorage();
        persistence.update();

        expect(store.mpid, 'the stored record was loaded').toBe(storedMPID);
        expect(store.devToken).toBeNull();
        expect(persistence.getCookie()?.gs.dt).toBe('stored-key');
    });

    it('should not take an API key from localStorage when init was given none, while preserving gs.dt in storage', () => {
        store.SDKConfig.useCookieStorage = false;
        store.devToken = null;
        localStorage.setItem(store.storageName, recordWithKey('stored-key'));

        persistence.initializeStorage();
        persistence.update();

        expect(store.mpid, 'the stored record was loaded').toBe(storedMPID);
        expect(store.devToken).toBeNull();
        expect(persistence.getLocalStorage()?.gs.dt).toBe('stored-key');
    });

    it('should keep the API key init was given, and write it to storage as before', () => {
        store.SDKConfig.useCookieStorage = true;
        writeCookie(recordWithKey('stored-key'));

        persistence.initializeStorage();
        persistence.update();

        expect(store.devToken).toBe('apikey');
        expect(persistence.getCookie()?.gs.dt).toBe('apikey');
    });
});
