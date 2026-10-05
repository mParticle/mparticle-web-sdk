/**
 * @jest-environment-options {"url": "http://www.example.com/app/page.html"}
 */
import Store, { IStore } from '../../src/store';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { SDKInitConfig } from '../../src/sdkRuntimeModels';
import Persistence from '../../src/persistence';
import { IPersistence } from '../../src/persistence.interfaces';
import Helpers from '../../src/helpers';
import { createCookieString } from '../../src/utils';

const storedMPID = 'storedMPID';
const cookieMPID = 'cookieMPID';

const encodeRecord = (mpid: string, isEnabled: 0 | 1): string =>
    createCookieString(
        JSON.stringify({
            cu: mpid,
            gs: {
                sid: 'SESSION-' + mpid,
                ie: isEnabled,
                les: Date.now(),
                ssd: Date.now(),
                das: 'das-' + mpid,
            },
            l: 0,
            [mpid]: { ui: btoa(JSON.stringify({ 1: 'customer-' + mpid })) },
        })
    );

const valuesThatDoNotDecodeToARecord: Array<[string, string]> = [
    ['a value that is not JSON', 'x'],
    [
        'a record whose ui does not decode',
        createCookieString(
            JSON.stringify({
                cu: cookieMPID,
                [cookieMPID]: { ui: btoa('not json') },
            })
        ),
    ],
    ['an empty value', ''],
    ['a number', '1'],
    ['a string', createCookieString(JSON.stringify('x'))],
    ['true', 'true'],
    ['null', 'null'],
    ['an array', '[]'],
    ['a non-empty array', '[1]'],
    ['an empty object', '{}'],
];

describe('Persistence with a persistence cookie that does not decode', () => {
    const earlierCookiePath = '/app';
    let store: IStore;
    let persistence: IPersistence;
    let getCurrentUser: jest.Mock;
    let logError: jest.Mock;

    const writeCookie = (value: string, path = '/'): void => {
        document.cookie = `${
            store.storageName
        }=${value};path=${path};domain=${persistence.getCookieDomain()}`;
    };
    const expireCookie = (path: string): void => {
        document.cookie = `${
            store.storageName
        }=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${persistence.getCookieDomain()}`;
    };
    const persistenceCookieEntries = (): string[] =>
        document.cookie
            .split('; ')
            .filter(entry => entry.startsWith(store.storageName + '='));

    beforeEach(() => {
        store = {} as IStore;
        getCurrentUser = jest.fn(() => ({ getMPID: () => store.mpid }));
        logError = jest.fn();
        const mpInstance = {
            _Store: store,
            _NativeSdkHelpers: {},
            Identity: { getCurrentUser },
            Logger: {
                verbose: jest.fn(),
                error: logError,
                warning: jest.fn(),
            },
        } as unknown as IMParticleWebSDKInstance;
        mpInstance._Helpers = new Helpers(mpInstance);
        Store.call(store, {} as SDKInitConfig, mpInstance, 'apikey');
        store.storageName = mpInstance._Helpers.createMainStorageName('abcdef');
        store.isLocalStorageAvailable = true;
        store.SDKConfig.useCookieStorage = false;
        store.webviewBridgeEnabled = false;
        persistence = new Persistence(mpInstance);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        localStorage.clear();
        expireCookie(earlierCookiePath);
        expireCookie('/');
    });

    describe('#getCookie', () => {
        it.each(valuesThatDoNotDecodeToARecord)(
            'should return null for %s, and still read a record that decodes',
            (_description, value) => {
                writeCookie(value);
                expect(persistenceCookieEntries(), 'cookie is present').toEqual([
                    `${store.storageName}=${value}`,
                ]);
                expect(persistence.getCookie()).toBeNull();

                writeCookie(encodeRecord(cookieMPID, 1));
                expect(persistence.getCookie()?.cu).toBe(cookieMPID);
            }
        );

        it('should return null when there is no persistence cookie', () => {
            expect(persistenceCookieEntries()).toEqual([]);
            expect(persistence.getCookie()).toBeNull();
        });

        it('should return null when reading document.cookie throws, and read the record once it does not', () => {
            writeCookie(encodeRecord(cookieMPID, 1));
            const cookieGetter = jest
                .spyOn(document, 'cookie', 'get')
                .mockImplementation(() => {
                    throw new Error('cookies are unavailable');
                });

            expect(persistence.getCookie()).toBeNull();

            cookieGetter.mockRestore();
            expect(persistence.getCookie()?.cu).toBe(cookieMPID);
        });

        it('should read a later same-name cookie that decodes when the first one does not', () => {
            const decodableRecord = encodeRecord(cookieMPID, 1);
            writeCookie(decodableRecord, '/');
            writeCookie('x', earlierCookiePath);
            expect(
                persistenceCookieEntries(),
                'the cookie that does not decode is presented first'
            ).toEqual([
                `${store.storageName}=x`,
                `${store.storageName}=${decodableRecord}`,
            ]);

            expect(persistence.getCookie()?.cu).toBe(cookieMPID);
        });

        it('should keep reading the first same-name cookie when both decode', () => {
            writeCookie(encodeRecord(cookieMPID, 1), '/');
            writeCookie(encodeRecord(storedMPID, 1), earlierCookiePath);

            expect(persistence.getCookie()?.cu).toBe(storedMPID);
        });
    });

    describe('#getLocalStorage', () => {
        it.each(valuesThatDoNotDecodeToARecord)(
            'should return null for %s',
            (_description, value) => {
                localStorage.setItem(store.storageName, value);

                expect(persistence.getLocalStorage()).toBeNull();
            }
        );

        it('should read a stored record that decodes', () => {
            localStorage.setItem(store.storageName, encodeRecord(storedMPID, 0));

            expect(persistence.getLocalStorage()?.cu).toBe(storedMPID);
        });

        it('should read a record with a __proto__ key the same way the cookie reader does', () => {
            const value = createCookieString(
                '{"cu":"' + storedMPID + '","__proto__":{"fst":1}}'
            );
            localStorage.setItem(store.storageName, value);
            writeCookie(value);

            const localStorageRecord = persistence.getLocalStorage();
            expect(
                Object.keys(localStorageRecord),
                'the __proto__ key is kept as an own key'
            ).toEqual(['cu', '__proto__']);
            expect(localStorageRecord).toEqual(persistence.getCookie());
        });
    });

    describe('#initializeStorage in localStorage mode', () => {
        beforeEach(() => {
            localStorage.setItem(
                store.storageName,
                encodeRecord(storedMPID, 0)
            );
        });

        it.each(valuesThatDoNotDecodeToARecord)(
            'should load the localStorage record, with its MPID and opt-out, alongside %s',
            (_description, value) => {
                writeCookie(value);

                persistence.initializeStorage();

                expect(
                    logError,
                    'storage initialized without an error'
                ).not.toHaveBeenCalledWith(
                    expect.stringContaining('Error initializing storage')
                );
                expect(store.mpid, 'MPID').toBe(storedMPID);
                expect(store.isEnabled, 'opt-out').toBe(false);
                expect(store.deviceId, 'device stamp').toBe('das-' + storedMPID);

                const localStorageRecord = persistence.getLocalStorage();
                expect(localStorageRecord?.cu, 'stored MPID').toBe(storedMPID);
                expect(localStorageRecord?.gs.ie, 'stored opt-out').toBe(false);
                expect(localStorageRecord?.[storedMPID].ui).toEqual({
                    1: 'customer-' + storedMPID,
                });
            }
        );

        it('should keep the localStorage record over a cookie that decodes and expire the cookie', () => {
            writeCookie(encodeRecord(cookieMPID, 1));

            persistence.initializeStorage();

            const localStorageRecord = persistence.getLocalStorage();
            expect(localStorageRecord?.cu, 'stored MPID').toBe(storedMPID);
            expect(localStorageRecord?.gs.ie, 'stored opt-out').toBe(false);
            expect(
                localStorageRecord?.[cookieMPID],
                'the cookie record was not migrated'
            ).toBeUndefined();
            expect(persistenceCookieEntries(), 'the cookie was expired').toEqual([]);
        });

        it('should keep the localStorage record when loading fails after a cookie was loaded with it', () => {
            const storedValue = localStorage.getItem(store.storageName);
            writeCookie(encodeRecord(cookieMPID, 1));
            getCurrentUser.mockImplementation(() => {
                throw new Error('loading failed');
            });

            persistence.initializeStorage();

            expect(
                logError,
                'the recovery path ran'
            ).toHaveBeenCalledWith(
                expect.stringContaining('Error initializing storage')
            );
            expect(
                localStorage.getItem(store.storageName),
                'the localStorage record is untouched'
            ).toBe(storedValue);
            expect(persistenceCookieEntries(), 'the cookie was expired').toEqual([]);
        });

        it('should still remove the localStorage record when loading fails and no cookie was loaded', () => {
            getCurrentUser.mockImplementation(() => {
                throw new Error('loading failed');
            });

            persistence.initializeStorage();

            expect(
                logError,
                'the recovery path ran'
            ).toHaveBeenCalledWith(
                expect.stringContaining('Error initializing storage')
            );
            expect(localStorage.getItem(store.storageName)).toBeNull();
        });
    });

    describe('#initializeStorage in cookie mode', () => {
        beforeEach(() => {
            store.SDKConfig.useCookieStorage = true;
        });

        it('should still expire the cookie when loading fails', () => {
            writeCookie(encodeRecord(cookieMPID, 1));
            getCurrentUser.mockImplementation(() => {
                throw new Error('loading failed');
            });

            persistence.initializeStorage();

            expect(
                logError,
                'the recovery path ran'
            ).toHaveBeenCalledWith(
                expect.stringContaining('Error initializing storage')
            );
            expect(persistenceCookieEntries()).toEqual([]);
        });

        it('should treat an empty-object cookie as a first run', () => {
            writeCookie('{}');

            persistence.initializeStorage();

            expect(store.isFirstRun).toBe(true);
        });

        it('should start a fresh record over a cookie that does not decode, and read it back', () => {
            writeCookie('x');

            persistence.initializeStorage();

            expect(
                logError,
                'storage initialized without an error'
            ).not.toHaveBeenCalledWith(
                expect.stringContaining('Error initializing storage')
            );
            expect(persistence.getCookie()?.gs.das).toBe(store.deviceId);
        });
    });
});
