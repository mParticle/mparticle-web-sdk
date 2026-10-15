import CookieConsentManager from '../../src/cookieConsentManager';
import SessionManager, { ISessionManager } from '../../src/sessionManager';
import Store, { IStore } from '../../src/store';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { SDKInitConfig } from '../../src/sdkRuntimeModels';
import { isObject, converted } from '../../src/utils';

describe('SessionManager', () => {
    let store: IStore;
    let mockMPInstance: IMParticleWebSDKInstance;
    let sessionManager: ISessionManager;
    let cookieConsentManager: CookieConsentManager;

    beforeEach(() => {
        document.cookie.split(';').forEach(cookie => {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        });
        localStorage.clear();

        store = {} as IStore;
        cookieConsentManager = new CookieConsentManager({ noFunctional: false, noTargeting: false });

        mockMPInstance = {
            _Helpers: {
                isObject,
                converted,
                canLog: jest.fn().mockReturnValue(true),
                generateUniqueId: jest.fn().mockReturnValue('test-session-id'),
                extend: jest.fn((target, source) => ({ ...target, ...source })),
            },
            _NativeSdkHelpers: {},
            _Store: store,
            _CookieConsentManager: cookieConsentManager,
            Identity: {
                getCurrentUser: jest.fn().mockReturnValue({
                    getMPID: () => 'test-mpid',
                    getUserIdentities: () => ({ userIdentities: {} }),
                }),
                identify: jest.fn(),
            },
            Logger: {
                verbose: jest.fn(),
                error: jest.fn(),
                warning: jest.fn(),
            },
            _Events: {
                logEvent: jest.fn(),
            },
        } as unknown as IMParticleWebSDKInstance;

        Store.call(store, {} as SDKInitConfig, mockMPInstance, 'apikey');
        store.isLocalStorageAvailable = true;
        store.SDKConfig.useCookieStorage = true;
        store.webviewBridgeEnabled = false;
        (store.SDKConfig as any).cookieExpiration = 365;
        store.SDKConfig.sessionTimeout = 30;
        store.identifyCalled = false;
        store.SDKConfig.identifyRequest = null;
        store.SDKConfig.identityCallback = null;
        store.deviceId = null;
        store.identityCallInFlight = false;

        sessionManager = new SessionManager(mockMPInstance);
    });

    describe('when noFunctional is true AND no identifiers', () => {
        it('should suppress automatic identify when no deviceId/userIdentities passed in', () => {
            cookieConsentManager = new CookieConsentManager({ noFunctional: true, noTargeting: false });
            mockMPInstance._CookieConsentManager = cookieConsentManager;
            store.deviceId = null;
            store.SDKConfig.identifyRequest = null;
            sessionManager = new SessionManager(mockMPInstance);

            const identifySpy = jest.spyOn(mockMPInstance.Identity, 'identify');
            sessionManager.startNewSession();

            expect(identifySpy).not.toHaveBeenCalled();
        });

        it('should NOT suppress identify when deviceId is provided', () => {
            cookieConsentManager = new CookieConsentManager({ noFunctional: true, noTargeting: false });
            mockMPInstance._CookieConsentManager = cookieConsentManager;
            store.SDKConfig.deviceId = 'explicit-device-id';
            store.SDKConfig.identifyRequest = { userIdentities: {} };
            sessionManager = new SessionManager(mockMPInstance);

            const identifySpy = jest.spyOn(mockMPInstance.Identity, 'identify');
            sessionManager.startNewSession();

            expect(identifySpy).toHaveBeenCalled();
        });

        it('should NOT suppress identify when userIdentities (e.g. email) are provided', () => {
            cookieConsentManager = new CookieConsentManager({ noFunctional: true, noTargeting: false });
            mockMPInstance._CookieConsentManager = cookieConsentManager;
            store.deviceId = null;
            store.SDKConfig.identifyRequest = {
                userIdentities: { email: 'test@example.com' },
            };
            sessionManager = new SessionManager(mockMPInstance);

            const identifySpy = jest.spyOn(mockMPInstance.Identity, 'identify');
            sessionManager.startNewSession();

            expect(identifySpy).toHaveBeenCalled();
        });

        it('should NOT suppress identify when noFunctional is false', () => {
            cookieConsentManager = new CookieConsentManager({ noFunctional: false, noTargeting: false });
            mockMPInstance._CookieConsentManager = cookieConsentManager;
            store.deviceId = null;
            store.SDKConfig.identifyRequest = null;
            sessionManager = new SessionManager(mockMPInstance);

            const identifySpy = jest.spyOn(mockMPInstance.Identity, 'identify');
            sessionManager.startNewSession();

            expect(identifySpy).toHaveBeenCalled();
        });

        it('should allow explicit identify call by user even when noFunctional is true', () => {
            cookieConsentManager = new CookieConsentManager({ noFunctional: true, noTargeting: false });
            mockMPInstance._CookieConsentManager = cookieConsentManager;
            store.deviceId = null;
            store.SDKConfig.identifyRequest = null;

            const identifySpy = jest.spyOn(mockMPInstance.Identity, 'identify');
            mockMPInstance.Identity.identify({
                userIdentities: { email: 'user@example.com' },
            });

            expect(identifySpy).toHaveBeenCalledWith({
                userIdentities: { email: 'user@example.com' },
            });
        });
    });
});
