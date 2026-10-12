/**
 * @jest-environment-options {"url": "http://www.example.com/"}
 */
import { IStore } from '../../src/store';
import {
    IPersistence,
    IPersistenceMinified,
} from '../../src/persistence.interfaces';
import { buildPersistenceHarness } from './utils';

describe('Persistence cookie writes on an http: page', () => {
    let store: IStore;
    let persistence: IPersistence;
    let cookieAssignments: jest.SpyInstance;

    beforeEach(() => {
        ({ store, persistence } = buildPersistenceHarness({
            useCookieStorage: true,
            getCurrentUser: () => ({ getMPID: () => 'test-mpid' }),
        }));
        cookieAssignments = jest.spyOn(document, 'cookie', 'set');
    });

    afterEach(() => {
        jest.restoreAllMocks();
        document.cookie = `${
            store.storageName
        }=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${persistence.getCookieDomain()}`;
    });

    function persistenceCookieAssignments(): string[] {
        return cookieAssignments.mock.calls
            .map(([assignment]) => assignment)
            .filter(assignment =>
                assignment.startsWith(store.storageName + '=')
            );
    }

    it('setCookie should write the persistence cookie without Secure, and it should read back', () => {
        persistence.setCookie();

        expect(persistenceCookieAssignments()).toEqual([
            expect.not.stringContaining('Secure'),
        ]);
        expect(persistence.getCookie()?.cu).toBe('test-mpid');
    });

    it('savePersistence should write the persistence cookie without Secure, and it should read back', () => {
        persistence.savePersistence({
            gs: {},
            cu: 'saved-mpid',
        } as IPersistenceMinified);

        expect(persistenceCookieAssignments()).toEqual([
            expect.not.stringContaining('Secure'),
        ]);
        expect(persistence.getCookie()?.cu).toBe('saved-mpid');
    });

    it('expireCookies should write its expiry without Secure and clear the persistence cookie', () => {
        persistence.setCookie();
        expect(persistence.getCookie()?.cu, 'written before expiry').toBe(
            'test-mpid'
        );
        cookieAssignments.mockClear();

        persistence.expireCookies(store.storageName);

        expect(persistenceCookieAssignments()).toEqual([
            expect.not.stringContaining('Secure'),
        ]);
        expect(persistence.getCookie()).toBeNull();
    });
});
