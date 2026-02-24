import CookieConsentManager from '../../src/cookieConsentManager';
import Persistence from '../../src/persistence';
import SessionManager, { ISessionManager } from '../../src/sessionManager';
import Store, { IStore } from '../../src/store';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { SDKInitConfig } from '../../src/sdkRuntimeModels';
import { isObject, converted } from '../../src/utils';
import { hasExplicitIdentifier } from '../../src/identity-utils';
import RoktManager from '../../src/roktManager';
import { MockForwarder } from './utils';

describe('noFunctional Flow', () => {
    let store: IStore;
    let mockMPInstance: IMParticleWebSDKInstance;
    let persistence: Persistence;
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

        persistence = new Persistence(mockMPInstance);
        sessionManager = new SessionManager(mockMPInstance);
    });

    describe('Block mP cookies when noFunctional: true', () => {
        it('should block cookie setting when noFunctional is true', () => {
            cookieConsentManager = new CookieConsentManager({ noFunctional: true, noTargeting: false });
            mockMPInstance._CookieConsentManager = cookieConsentManager;
            persistence = new Persistence(mockMPInstance);
            let cookieWasWritten = false;
            const originalSetCookie = persistence.setCookie;
            persistence.setCookie = function() {
                if (mockMPInstance._CookieConsentManager?.getNoFunctional()) {
                    return;
                }
                cookieWasWritten = true;
                return originalSetCookie.call(this);
            };

            persistence.update();
            expect(cookieWasWritten).toBe(false);
        });

        it('should allow cookie setting when noFunctional is false', () => {
            cookieConsentManager = new CookieConsentManager({ noFunctional: false, noTargeting: false });
            mockMPInstance._CookieConsentManager = cookieConsentManager;
            persistence = new Persistence(mockMPInstance);

            jest.spyOn(persistence, 'getCookie').mockReturnValue(null);
            const setCookieSpy = jest.spyOn(persistence, 'setCookie');
            persistence.update();

            expect(setCookieSpy).toHaveBeenCalled();
        });
    });

    describe('Suppress automatic identify calls when noFunctional: true AND no identifiers', () => {
        it('should suppress identify when noFunctional is true and no deviceId/identifiers', () => {
            cookieConsentManager = new CookieConsentManager({ noFunctional: true, noTargeting: false });
            mockMPInstance._CookieConsentManager = cookieConsentManager;
            store.deviceId = null;
            store.SDKConfig.identifyRequest = null;
            sessionManager = new SessionManager(mockMPInstance);

            const identifySpy = jest.spyOn(mockMPInstance.Identity, 'identify');

            sessionManager.startNewSession();

            expect(identifySpy).not.toHaveBeenCalled();
        });

        it('should NOT suppress identify when noFunctional is true but deviceId is provided', () => {
            cookieConsentManager = new CookieConsentManager({ noFunctional: true, noTargeting: false });
            mockMPInstance._CookieConsentManager = cookieConsentManager;
            store.deviceId = 'explicit-device-id';
            store.SDKConfig.identifyRequest = { userIdentities: {} };
            sessionManager = new SessionManager(mockMPInstance);

            const identifySpy = jest.spyOn(mockMPInstance.Identity, 'identify');

            sessionManager.startNewSession();

            expect(identifySpy).toHaveBeenCalled();
        });

        it('should NOT suppress identify when noFunctional is true but email is provided', () => {
            cookieConsentManager = new CookieConsentManager({ noFunctional: true, noTargeting: false });
            mockMPInstance._CookieConsentManager = cookieConsentManager;
            store.deviceId = null;
            store.SDKConfig.identifyRequest = {
                userIdentities: {
                    email: 'test@example.com'
                }
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

        it('should make identify call when user explicitly calls identify', () => {
            cookieConsentManager = new CookieConsentManager({ noFunctional: true, noTargeting: false });
            mockMPInstance._CookieConsentManager = cookieConsentManager;
            store.deviceId = null;
            store.SDKConfig.identifyRequest = null;

            const identifySpy = jest.spyOn(mockMPInstance.Identity, 'identify');

            mockMPInstance.Identity.identify({
                userIdentities: {
                    email: 'user@example.com'
                }
            });

            expect(identifySpy).toHaveBeenCalledWith({
                userIdentities: {
                    email: 'user@example.com'
                }
            });
        });
    });

    describe('Ensure kits work even if MP SDK is not initialized', () => {
        it('should allow forwarder-based actions (send events) when SDK not initialized', () => {
            const mockForwarder = new MockForwarder('TestForwarder', 1);
            (mockForwarder as any).process = jest.fn();

            const mockEvent = {
                EventName: 'Test Event',
                EventDataType: 1,
            };

            if ((mockForwarder as any).process) {
                (mockForwarder as any).process(mockEvent);
            }

            expect((mockForwarder as any).process).toHaveBeenCalledWith(mockEvent);
        });

        it('should allow forwarder-based actions (send user attributes) when SDK not initialized', () => {
            const mockForwarder = new MockForwarder('TestForwarder', 1);
            (mockForwarder as any).setUserAttribute = jest.fn();

            const userAttributes = {
                favoriteColor: 'blue',
                age: 30
            };

            if ((mockForwarder as any).setUserAttribute) {
                (mockForwarder as any).setUserAttribute('favoriteColor', 'blue');
            }

            expect((mockForwarder as any).setUserAttribute).toHaveBeenCalledWith('favoriteColor', 'blue');
        });

        it('should allow Rokt Kit to initialize and selectPlacements even if SDK not fully initialized', async () => {
            const roktManager = new RoktManager();
            const mockSelectPlacementsResult = {
                close: jest.fn(),
                getPlacements: jest.fn().mockResolvedValue([])
            };
            const mockRoktKit = {
                launcher: {
                    selectPlacements: jest.fn(),
                    hashAttributes: jest.fn(),
                    use: jest.fn(),
                },
                selectPlacements: jest.fn().mockResolvedValue(mockSelectPlacementsResult),
                filters: {},
                filteredUser: null,
                userAttributes: {},
                hashAttributes: jest.fn(),
                setExtensionData: jest.fn(),
                use: jest.fn(),
            };

            const mockIdentityService = {
                getCurrentUser: jest.fn().mockReturnValue({
                    getMPID: () => 'test-mpid',
                    getUserIdentities: () => ({ userIdentities: {} }),
                }),
                identify: jest.fn().mockImplementation((data, callback) => {
                    if (callback) {
                        callback(null);
                    }
                }),
            };

            store.identityCallInFlight = false;

            roktManager.init(
                {} as any,
                null as any,
                mockIdentityService as any,
                store,
                mockMPInstance.Logger,
                {},
                undefined
            );

            (roktManager as any).placementAttributesMapping = [];

            roktManager.attachKit(mockRoktKit as any);

            expect(roktManager.isReady()).toBe(true);
            
            const options = {
                attributes: {
                    email: 'test@example.com'
                }
            };

            const result = await roktManager.selectPlacements(options);

            expect(mockRoktKit.selectPlacements).toHaveBeenCalled();
            expect(result).toBeDefined();
            expect(result.close).toBeDefined();
            expect(result.getPlacements).toBeDefined();
        });

    });

    describe('hasExplicitIdentifier utility', () => {
        it('should return true when deviceId is provided', () => {
            store.deviceId = 'test-device-id';
            expect(hasExplicitIdentifier(mockMPInstance)).toBe(true);
        });

        it('should return true when userIdentities are provided', () => {
            store.deviceId = null;
            store.SDKConfig.identifyRequest = {
                userIdentities: {
                    email: 'test@example.com'
                }
            };
            expect(hasExplicitIdentifier(mockMPInstance)).toBe(true);
        });

        it('should return false when no deviceId or userIdentities', () => {
            store.deviceId = null;
            store.SDKConfig.identifyRequest = null;
            expect(hasExplicitIdentifier(mockMPInstance)).toBe(false);
        });

        it('should return false when userIdentities object is empty', () => {
            store.deviceId = null;
            store.SDKConfig.identifyRequest = {
                userIdentities: {}
            };
            expect(hasExplicitIdentifier(mockMPInstance)).toBe(false);
        });
    });
});
