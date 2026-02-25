import CookieConsentManager from '../../src/cookieConsentManager';
import Store, { IStore } from '../../src/store';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { SDKInitConfig } from '../../src/sdkRuntimeModels';
import Persistence from '../../src/persistence';
import { isObject } from '../../src/utils';

describe('Persistence', () => {
    let store: IStore;
    let mockMPInstance: IMParticleWebSDKInstance;
    let persistence: Persistence;

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
});