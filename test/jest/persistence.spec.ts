import Store, { IStore } from '../../src/store';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { SDKInitConfig } from '../../src/sdkRuntimeModels';

describe('Persistence writers', () => {
    let store: IStore;
    let mockMPInstance: IMParticleWebSDKInstance;

    beforeEach(() => {
        mockMPInstance = {
            _Helpers: {
                createMainStorageName: () => 'mprtcl-v4_ws',
                createProductStorageName: () => 'mprtcl-prodv4_ws',
                Validators: { isFunction: () => true },
                extend: Object.assign,
            },
            _NativeSdkHelpers: {
                isWebviewEnabled: () => false,
            },
            _Persistence: {
                setCookie: jest.fn(),
                setLocalStorage: jest.fn(),
                setProductStorage: jest.fn(),
                update: function () {
                    if (store.webviewBridgeEnabled) {
                        return;
                    }
                    if (store.getNoFunctional()) {
                        mockMPInstance._Persistence.setProductStorage();
                        return;
                    }
                    if (store.SDKConfig.useCookieStorage) {
                        mockMPInstance._Persistence.setCookie();
                    }
                    mockMPInstance._Persistence.setLocalStorage();
                },
            },
            Logger: {
                verbose: () => {},
                warning: () => {},
                error: () => {},
            },
            Identity: {
                getCurrentUser: () => ({ getMPID: () => 'mpid' }),
            },
        } as unknown as IMParticleWebSDKInstance;

        store = {} as IStore;
        Store.call(store, {} as SDKInitConfig, mockMPInstance, 'apikey');
    });

    describe('#noFunctional', () => {
        describe('true', () => {
            beforeEach(() => {
                store.setNoFunctional(true);
                store.webviewBridgeEnabled = false;
            });

            it('should NOT write to cookie when useCookieStorage = true', () => {
                store.SDKConfig.useCookieStorage = true;
                jest.clearAllMocks();

                mockMPInstance._Persistence.update();

                expect(mockMPInstance._Persistence.setCookie).not.toHaveBeenCalled();
                expect(mockMPInstance._Persistence.setLocalStorage).not.toHaveBeenCalled();
                expect(mockMPInstance._Persistence.setProductStorage).toHaveBeenCalled();
            });

            it('should NOT write to localStorage when useCookieStorage = false', () => {
                store.SDKConfig.useCookieStorage = false;
                jest.clearAllMocks();

                mockMPInstance._Persistence.update();

                expect(mockMPInstance._Persistence.setCookie).not.toHaveBeenCalled();
                expect(mockMPInstance._Persistence.setLocalStorage).not.toHaveBeenCalled();
                expect(mockMPInstance._Persistence.setProductStorage).toHaveBeenCalled();
            });
        });

        describe('false', () => {
            beforeEach(() => {
                store.setNoFunctional(false);
                store.webviewBridgeEnabled = false;
            });

            it('should write to cookie when useCookieStorage = true', () => {
                store.SDKConfig.useCookieStorage = true;
                jest.clearAllMocks();

                mockMPInstance._Persistence.update();

                expect(mockMPInstance._Persistence.setCookie).toHaveBeenCalled();
                expect(mockMPInstance._Persistence.setLocalStorage).toHaveBeenCalled();
                expect(mockMPInstance._Persistence.setProductStorage).not.toHaveBeenCalled();
            });

            it('should write to localStorage when useCookieStorage = false', () => {
                store.SDKConfig.useCookieStorage = false;
                jest.clearAllMocks();

                mockMPInstance._Persistence.update();

                expect(mockMPInstance._Persistence.setCookie).not.toHaveBeenCalled();
                expect(mockMPInstance._Persistence.setLocalStorage).toHaveBeenCalled();
                expect(mockMPInstance._Persistence.setProductStorage).not.toHaveBeenCalled();
            });
        });

        describe('default (false)', () => {
            beforeEach(() => {
                // default is false
                store.webviewBridgeEnabled = false;
            });

            it('should write to cookie by default when useCookieStorage = true', () => {
                store.SDKConfig.useCookieStorage = true;
                jest.clearAllMocks();

                mockMPInstance._Persistence.update();

                expect(store.getNoFunctional()).toBe(false);
                expect(mockMPInstance._Persistence.setCookie).toHaveBeenCalled();
                expect(mockMPInstance._Persistence.setLocalStorage).toHaveBeenCalled();
                expect(mockMPInstance._Persistence.setProductStorage).not.toHaveBeenCalled();
            });

            it('should write to localStorage by default when useCookieStorage = false', () => {
                store.SDKConfig.useCookieStorage = false;
                jest.clearAllMocks();

                mockMPInstance._Persistence.update();

                expect(store.getNoFunctional()).toBe(false);
                expect(mockMPInstance._Persistence.setCookie).not.toHaveBeenCalled();
                expect(mockMPInstance._Persistence.setLocalStorage).toHaveBeenCalled();
                expect(mockMPInstance._Persistence.setProductStorage).not.toHaveBeenCalled();
            });
        });

        it('should NOT write to storage when webviewBridgeEnabled = true', () => {
            store.setNoFunctional(false);
            store.webviewBridgeEnabled = true;
            store.SDKConfig.useCookieStorage = true;
            jest.clearAllMocks();

            mockMPInstance._Persistence.update();

            expect(mockMPInstance._Persistence.setCookie).not.toHaveBeenCalled();
            expect(mockMPInstance._Persistence.setLocalStorage).not.toHaveBeenCalled();
            expect(mockMPInstance._Persistence.setProductStorage).not.toHaveBeenCalled();
        });
    });
});