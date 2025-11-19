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
        // describe('noFunctional privacy flag set to true', () => {
        //     beforeEach(() => {
        //         store.setNoFunctional(true);
        //         store.webviewBridgeEnabled = false;
        //     });
        // });

        describe('noFunctional privacy flag set to false', () => {
            beforeEach(() => {
                store.setNoFunctional(false);
                store.webviewBridgeEnabled = false;
            });

            it('should write to cookie and localStorage when useCookieStorage is true', () => {
                store.SDKConfig.useCookieStorage = true;

                jest.spyOn(persistence, 'getCookie').mockReturnValue(null);

                const setCookieSpy = jest.spyOn(persistence, 'setCookie');
                const setLocalStorageSpy = jest.spyOn(persistence, 'setLocalStorage');

                persistence.update();

                expect(setCookieSpy).toHaveBeenCalled();
                expect(setLocalStorageSpy).toHaveBeenCalled();
            });

            it('should write to localStorage when useCookieStorage is false', () => {
                store.SDKConfig.useCookieStorage = false;

                const setCookieSpy = jest.spyOn(persistence, 'setCookie');
                const setLocalStorageSpy = jest.spyOn(persistence, 'setLocalStorage');

                persistence.update();

                expect(setCookieSpy).not.toHaveBeenCalled();
                expect(setLocalStorageSpy).toHaveBeenCalled();
            });
        });

        describe('noFunctional privacy flag set to false by default', () => {
            beforeEach(() => {
                // default is false
                store.webviewBridgeEnabled = false;
            });

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
        });

        it('should NOT write to storage when webviewBridgeEnabled is true', () => {
            store.setNoFunctional(false);
            store.webviewBridgeEnabled = true;
            store.SDKConfig.useCookieStorage = true;

            const setCookieSpy = jest.spyOn(persistence, 'setCookie');
            const setLocalStorageSpy = jest.spyOn(persistence, 'setLocalStorage');

            persistence.update();

            expect(setCookieSpy).not.toHaveBeenCalled();
            expect(setLocalStorageSpy).not.toHaveBeenCalled();
        });
    });
});