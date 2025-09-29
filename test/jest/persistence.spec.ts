import Store, { IStore } from '../../src/store';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { SDKInitConfig } from '../../src/sdkRuntimeModels';

describe('Persistence', () => {
    let store: IStore;
    let mockMPInstance: IMParticleWebSDKInstance;

    beforeEach(() => {
        mockMPInstance = {
            _Helpers: {
                createMainStorageName: () => 'mprtcl-v4',
            },
            _NativeSdkHelpers: {
                isWebviewEnabled: () => false,
            },
            _Persistence: {
                setCookie: jest.fn(),
                setLocalStorage: jest.fn(() => {
                    window.localStorage.setItem('mprtcl-v4', 'local-storage');
                }),
                update: function () {
                    if (store.webviewBridgeEnabled || store.getNoFunctional()) {
                        return;
                    }
                    if (store.SDKConfig.useCookieStorage) {
                        mockMPInstance._Persistence.setCookie();
                    }
                    mockMPInstance._Persistence.setLocalStorage();
                },
            },
        } as unknown as IMParticleWebSDKInstance;

        store = {} as IStore;
        Store.call(store, {} as SDKInitConfig, mockMPInstance, 'apikey');
        window.localStorage.removeItem('mprtcl-v4');
    });

    describe('#update', () => {
        describe('noFunctional privacy flag set to true', () => {
            beforeEach(() => {
                store.setNoFunctional(true);
                store.webviewBridgeEnabled = false;
            });

            it('should NOT write to cookie and localStorage when useCookieStorage is true', () => {
                store.SDKConfig.useCookieStorage = true;

                mockMPInstance._Persistence.update();

                expect(mockMPInstance._Persistence.setCookie).not.toHaveBeenCalled();
                expect(mockMPInstance._Persistence.setLocalStorage).not.toHaveBeenCalled();
                expect(window.localStorage.getItem('mprtcl-v4')).toBeNull();
            });

            it('should NOT write to localStorage when useCookieStorage is false', () => {
                store.SDKConfig.useCookieStorage = false;

                mockMPInstance._Persistence.update();

                expect(mockMPInstance._Persistence.setCookie).not.toHaveBeenCalled();
                expect(mockMPInstance._Persistence.setLocalStorage).not.toHaveBeenCalled();
                expect(window.localStorage.getItem('mprtcl-v4')).toBeNull();
            });
        });

        describe('noFunctional privacy flag set to false', () => {
            beforeEach(() => {
                store.setNoFunctional(false);
                store.webviewBridgeEnabled = false;
            });

            it('should write to cookie and localStorage when useCookieStorage is true', () => {
                store.SDKConfig.useCookieStorage = true;

                mockMPInstance._Persistence.update();

                expect(mockMPInstance._Persistence.setCookie).toHaveBeenCalled();
                expect(mockMPInstance._Persistence.setLocalStorage).toHaveBeenCalled();
                expect(window.localStorage.getItem('mprtcl-v4')).not.toBeNull();
            });

            it('should write to localStorage when useCookieStorage is false', () => {
                store.SDKConfig.useCookieStorage = false;

                mockMPInstance._Persistence.update();

                expect(mockMPInstance._Persistence.setCookie).not.toHaveBeenCalled();
                expect(mockMPInstance._Persistence.setLocalStorage).toHaveBeenCalled();
                expect(window.localStorage.getItem('mprtcl-v4')).not.toBeNull();
            });
        });

        describe('noFunctional privacy flag set to false by default', () => {
            beforeEach(() => {
                // default is false
                store.webviewBridgeEnabled = false;
            });

            it('should write to cookie and localStorage by default when useCookieStorage is true', () => {
                store.SDKConfig.useCookieStorage = true;

                mockMPInstance._Persistence.update();

                expect(store.getNoFunctional()).toBe(false);
                expect(mockMPInstance._Persistence.setCookie).toHaveBeenCalled();
                expect(mockMPInstance._Persistence.setLocalStorage).toHaveBeenCalled();
                expect(window.localStorage.getItem('mprtcl-v4')).not.toBeNull();
            });

            it('should write to localStorage by default when useCookieStorage is false', () => {
                store.SDKConfig.useCookieStorage = false;

                mockMPInstance._Persistence.update();

                expect(store.getNoFunctional()).toBe(false);
                expect(mockMPInstance._Persistence.setCookie).not.toHaveBeenCalled();
                expect(mockMPInstance._Persistence.setLocalStorage).toHaveBeenCalled();
                expect(window.localStorage.getItem('mprtcl-v4')).not.toBeNull();
            });
        });

        it('should NOT write to storage when webviewBridgeEnabled is true', () => {
            store.setNoFunctional(false);
            store.webviewBridgeEnabled = true;
            store.SDKConfig.useCookieStorage = true;

            mockMPInstance._Persistence.update();

            expect(mockMPInstance._Persistence.setCookie).not.toHaveBeenCalled();
            expect(mockMPInstance._Persistence.setLocalStorage).not.toHaveBeenCalled();
            expect(window.localStorage.getItem('mprtcl-v4')).toBeNull();
        });
    });
});