/**
 * @jest-environment-options {"url": "http://www.example.com/"}
 */
import Store, { IStore } from '../../src/store';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { SDKInitConfig } from '../../src/sdkRuntimeModels';
import Persistence from '../../src/persistence';
import {
    IPersistence,
    IPersistenceMinified,
} from '../../src/persistence.interfaces';
import Helpers from '../../src/helpers';

describe('Persistence cookie writes on an http: page', () => {
    let store: IStore;
    let persistence: IPersistence;
    let cookieAssignments: jest.SpyInstance;

    beforeEach(() => {
        store = {} as IStore;
        const mpInstance = {
            _Store: store,
            _NativeSdkHelpers: {},
            Identity: {
                getCurrentUser: () => ({ getMPID: () => 'test-mpid' }),
            },
            Logger: {
                verbose: jest.fn(),
                error: jest.fn(),
                warning: jest.fn(),
            },
        } as unknown as IMParticleWebSDKInstance;
        mpInstance._Helpers = new Helpers(mpInstance);
        Store.call(store, {} as SDKInitConfig, mpInstance, 'apikey');
        store.storageName = mpInstance._Helpers.createMainStorageName('abcdef');
        store.SDKConfig.useCookieStorage = true;
        persistence = new Persistence(mpInstance);
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
