import CookieConsentManager from '../../src/cookieConsentManager';
import Store, { IStore } from '../../src/store';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { SDKInitConfig } from '../../src/sdkRuntimeModels';
import Persistence from '../../src/persistence';
import { IPersistence } from '../../src/persistence.interfaces';
import { createCookieString, isObject } from '../../src/utils';
import Polyfill from '../../src/polyfill';

describe('Persistence', () => {
    let store: IStore;
    let mockMPInstance: IMParticleWebSDKInstance;
    let persistence: IPersistence;

    beforeEach(() => {
        store = {} as IStore;
        mockMPInstance = {
            _Helpers: {
                isObject,
            },
            _NativeSdkHelpers: {},
            _Store: store,
            Identity: {
                getCurrentUser: jest.fn().mockReturnValue({
                    getMPID: () => 'test-mpid',
                }),
            },
            Logger: {
                verbose: jest.fn(),
                error: jest.fn(),
                warning: jest.fn(),
            },
        } as unknown as IMParticleWebSDKInstance;

        Store.call(store, {} as SDKInitConfig, mockMPInstance, 'apikey');
        
        store.isLocalStorageAvailable = true;
        store.SDKConfig.useCookieStorage = true;
        store.webviewBridgeEnabled = false;

        persistence = new Persistence(mockMPInstance);
    });

    describe('#update', () => {
        it('should write to cookie and localStorage by default when useCookieStorage is true', () => {
            store.SDKConfig.useCookieStorage = true;

            jest.spyOn(persistence, 'getCookie').mockReturnValue(null);

            const setCookieSpy = jest.spyOn(persistence, 'setCookie');
            const setLocalStorageSpy = jest.spyOn(persistence, 'setLocalStorage');

            persistence.update();

            expect(setCookieSpy).toHaveBeenCalled();
            expect(setLocalStorageSpy).toHaveBeenCalled();
        });

        it('should write to localStorage by default when useCookieStorage is false', () => {
            store.SDKConfig.useCookieStorage = false;

            const setCookieSpy = jest.spyOn(persistence, 'setCookie');
            const setLocalStorageSpy = jest.spyOn(persistence, 'setLocalStorage');

            persistence.update();

            expect(setCookieSpy).not.toHaveBeenCalled();
            expect(setLocalStorageSpy).toHaveBeenCalled();
        });

        it('should NOT write to storage when webviewBridgeEnabled is true', () => {
            store.webviewBridgeEnabled = true;
            store.SDKConfig.useCookieStorage = true;

            const setCookieSpy = jest.spyOn(persistence, 'setCookie');
            const setLocalStorageSpy = jest.spyOn(persistence, 'setLocalStorage');

            persistence.update();

            expect(setCookieSpy).not.toHaveBeenCalled();
            expect(setLocalStorageSpy).not.toHaveBeenCalled();
        });
    });

    describe('noFunctional (block mprtcl-v4 cookies)', () => {
        it('should not write cookie when noFunctional is true', () => {
            mockMPInstance._CookieConsentManager = new CookieConsentManager({
                noFunctional: true,
                noTargeting: false,
            });
            persistence = new Persistence(mockMPInstance);

            const getCookieDomainSpy = jest.spyOn(persistence, 'getCookieDomain');
            persistence.setCookie();

            expect(getCookieDomainSpy).not.toHaveBeenCalled();
        });

        it('should write cookie when noFunctional is false', () => {
            mockMPInstance._CookieConsentManager = new CookieConsentManager({
                noFunctional: false,
                noTargeting: false,
            });
            persistence = new Persistence(mockMPInstance);

            jest.spyOn(persistence, 'getCookie').mockReturnValue(null);
            const setCookieSpy = jest.spyOn(persistence, 'setCookie');
            persistence.update();

            expect(setCookieSpy).toHaveBeenCalled();
        });
    });

    describe('#decodePersistence record shapes', () => {
        const encodeAsPersistedField = (value: any): string =>
            Polyfill.Base64.encode(JSON.stringify(value));

        // `decodePersistence` swallows its own errors and returns undefined, so
        // a fixture that failed to decode would satisfy every absence assertion.
        const decode = (value: object): any => {
            const decoded = persistence.decodePersistence(
                createCookieString(JSON.stringify(value))
            );
            expect(mockMPInstance.Logger.error).not.toHaveBeenCalled();
            expect(decoded).toBeTruthy();
            return JSON.parse(decoded as string);
        };

        it.each([
            { label: 'object', value: { a: 1 } },
            { label: 'string', value: 'notAnArray' },
            { label: 'number', value: 1234567890123 },
        ])('should drop a csm that decodes to a $label', ({ value }) => {
            const malformed = decode({
                gs: { csm: encodeAsPersistedField(value) },
                cu: 'mpid1',
                l: 0,
            });

            expect(malformed.gs).not.toHaveProperty('csm');
        });

        it('should keep a well formed csm array', () => {
            const wellFormed = decode({
                gs: { csm: encodeAsPersistedField(['mpid1', 'mpid2']) },
                cu: 'mpid1',
                l: 0,
            });

            expect(wellFormed.gs.csm).toEqual(['mpid1', 'mpid2']);
        });

        it('should leave the other Base64 global settings fields alone', () => {
            const decoded = decode({
                gs: {
                    csm: encodeAsPersistedField({ a: 1 }),
                    sa: encodeAsPersistedField({ sessionAttr: 'value' }),
                    ia: encodeAsPersistedField({ 128: { MCID: 'integration' } }),
                },
                cu: 'mpid1',
                l: 0,
            });

            expect(decoded.gs).not.toHaveProperty('csm');
            expect(decoded.gs.sa).toEqual({ sessionAttr: 'value' });
            expect(decoded.gs.ia).toEqual({ 128: { MCID: 'integration' } });
        });

        it('should drop top level records that are not objects, and keep a well formed record', () => {
            const decoded = decode({
                gs: { csm: encodeAsPersistedField(['mpid1']) },
                cu: 'mpid1',
                l: 0,
                mpid1: { ui: encodeAsPersistedField({ '1': 'customer-1' }) },
                nullRecord: null,
                stringRecord: 'not-a-record',
                numberRecord: 7,
                arrayRecord: ['not', 'a', 'record'],
            });

            expect(decoded).not.toHaveProperty('nullRecord');
            expect(decoded).not.toHaveProperty('stringRecord');
            expect(decoded).not.toHaveProperty('numberRecord');
            expect(decoded).not.toHaveProperty('arrayRecord');

            expect(decoded.mpid1.ui).toEqual({ '1': 'customer-1' });
            expect(decoded.cu).toEqual('mpid1');
            expect(decoded.l).toEqual(false);
            expect(decoded.gs.csm).toEqual(['mpid1']);
        });
    });

    describe('#findPrevCookiesBasedOnUI record shape guard', () => {
        // Not a persisted record shape: `IUserPersistenceMinified` has no `mpid`
        // and a persisted `ui` is keyed by identity type, not name.
        const syntheticMatcherEligibleCandidate = (mpid: string): any => ({
            mpid,
            ui: { customerid: 'match-me' },
        });

        beforeEach(() => {
            mockMPInstance._Persistence = persistence;
        });

        it('should skip a record that is not an object and still reach the matcher-eligible record after it', () => {
            const storedPersistence: any = {
                gs: {},
                cu: 'mpid1',
                l: 0,
                // First, so a guard that bailed out rather than continuing fails.
                brokenRecord: null,
                mpid1: syntheticMatcherEligibleCandidate('mpid1'),
            };

            jest.spyOn(persistence, 'getPersistence').mockReturnValue(
                storedPersistence
            );
            const storeDataInMemorySpy = jest
                .spyOn(persistence, 'storeDataInMemory')
                .mockImplementation(() => undefined);

            expect(() =>
                persistence.findPrevCookiesBasedOnUI({
                    userIdentities: { customerid: 'match-me' },
                })
            ).not.toThrow();

            expect(storeDataInMemorySpy).toHaveBeenCalledWith(
                storedPersistence,
                'mpid1'
            );
        });

        it('should not select a candidate with no mpid, and still select the one that has it', () => {
            const storedPersistence: any = {
                gs: {},
                cu: 'mpid1',
                l: 0,
                // Qualifying candidate first: the loop keeps the LAST match, so
                // dropping the `mpid` check lets the next one overwrite it.
                mpid1: syntheticMatcherEligibleCandidate('mpid1'),
                noMpidCandidate: { ui: { customerid: 'match-me' } },
            };

            jest.spyOn(persistence, 'getPersistence').mockReturnValue(
                storedPersistence
            );
            const storeDataInMemorySpy = jest
                .spyOn(persistence, 'storeDataInMemory')
                .mockImplementation(() => undefined);

            persistence.findPrevCookiesBasedOnUI({
                userIdentities: { customerid: 'match-me' },
            });

            expect(storeDataInMemorySpy).toHaveBeenCalledWith(
                storedPersistence,
                'mpid1'
            );
            expect(storeDataInMemorySpy).not.toHaveBeenCalledWith(
                storedPersistence,
                'noMpidCandidate'
            );
        });
    });
});