import CookieSyncManager, {
    DAYS_IN_MILLISECONDS,
    IPixelConfiguration,
    CookieSyncDates,
    isLastSyncDateExpired,
    PARTNER_MODULE_IDS
} from '../../src/cookieSyncManager';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import CookieConsentManager from '../../src/cookieConsentManager';
import { testMPID } from '../src/config/constants';

const pixelSettings: IPixelConfiguration = {
    name: 'TestPixel',
    moduleId: 5,
    esId: 24053,
    isDebug: true,
    isProduction: true,
    settings: {},
    frequencyCap: 14,
    pixelUrl: 'https://test.com',
    redirectUrl: '?redirect=https://redirect.com&mpid=%%mpid%%',
};

const roktPixelSettings: IPixelConfiguration = {
    name: 'Rokt',
    moduleId: PARTNER_MODULE_IDS.Rokt,
    pixelUrl: 'https://rokt.com/pixel',
    redirectUrl: '?redirect=https://redirect.com&mpid=%%mpid%%',
    frequencyCap: 14,
    settings: {},
} as IPixelConfiguration;

const pixelUrlAndRedirectUrl = 'https://test.com%3Fredirect%3Dhttps%3A%2F%2Fredirect.com%26mpid%3DtestMPID';

describe('CookieSyncManager', () => {
    describe('#attemptCookieSync', () => {
        // https://go.mparticle.com/work/SQDSDKS-6915
        it('should perform a cookie sync with defaults', () => {
            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
                _Persistence: {
                    getPersistence: () => ({testMPID: {
                        csd: {}
                    }}),
                },
                _Consent: {
                    isEnabledForUserConsent: jest.fn().mockReturnValue(true),
                },
                Identity: {
                    getCurrentUser: jest.fn().mockReturnValue({
                        getMPID: () => testMPID,
                    }),
                },
            } as unknown) as IMParticleWebSDKInstance;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                pixelUrlAndRedirectUrl,
                '5',
                testMPID,
                {},
            );            
        });

        it('should not call performCookieSync if pixelURL is empty', () => {
            const pixelSettingsWithoutPixelUrl = {...pixelSettings, pixelUrl: ''}
            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettingsWithoutPixelUrl],
                },
                _Persistence: {
                    getPersistence: () => ({testMPID: {
                        csd: {}
                    }}),
                },
                _Consent: {
                    isEnabledForUserConsent: jest.fn().mockReturnValue(true),
                },
                Identity: {
                    getCurrentUser: jest.fn().mockReturnValue({
                        getMPID: () => testMPID,
                    }),
                },
            } as unknown) as IMParticleWebSDKInstance;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(testMPID, true);

            expect(cookieSyncManager.performCookieSync).not.toHaveBeenCalled();
        });

        it('should not call performCookieSync if mpid is not defined', () => {
            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
                _Persistence: {
                    getPersistence: () => ({testMPID: {
                        csd: {}
                    }}),
                },
            } as unknown) as IMParticleWebSDKInstance;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(null, true);

            expect(cookieSyncManager.performCookieSync).not.toHaveBeenCalled();
        });

        it('should not call performCookieSync if webviewBridgeEnabled is true', () => {
            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: true,
                    pixelConfigurations: [pixelSettings],
                },
                _Persistence: {
                    getPersistence: () => ({testMPID: {
                        csd: {}
                    }}),
                },
            } as unknown) as IMParticleWebSDKInstance;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(testMPID, true);

            expect(cookieSyncManager.performCookieSync).not.toHaveBeenCalled();
        });

        it('should call performCookieSync when there are filteringConsentRuleValues and mpidIsNotInCookies = false', () => {
            const myPixelSettings: IPixelConfiguration = {
                pixelUrl: 'https://test.com',
                moduleId: 5,
                redirectUrl: '?redirect=https://redirect.com&mpid=%%mpid%%',
                filteringConsentRuleValues: {
                    values: ['test'],
                },
            } as unknown as IPixelConfiguration;

            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [myPixelSettings],
                },
                _Persistence: {
                    getPersistence: () => ({testMPID: {
                        csd: {}
                    }}),
                },
                Identity: {
                    getCurrentUser: jest.fn().mockReturnValue({
                        getMPID: () => testMPID,
                    }),
                },
                _Consent: {
                    isEnabledForUserConsent: jest.fn().mockReturnValue(true),
                },
            } as unknown) as IMParticleWebSDKInstance;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(testMPID, false);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                pixelUrlAndRedirectUrl,
                '5',
                testMPID,
                {},
            );
        });

        it('should update the cookie sync url if a redirectUrl is defined', () => {
            const myPixelSettings: IPixelConfiguration = {
                pixelUrl: 'https://test.com',
                redirectUrl: '?redirect=https://redirect.com&mpid=%%mpid%%',
            } as unknown as IPixelConfiguration;

            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [{...pixelSettings, ...myPixelSettings}],
                },
                _Persistence: {
                    getPersistence: () => ({testMPID: {
                        csd: {}
                    }}),
                },
                _Consent: {
                    isEnabledForUserConsent: jest.fn().mockReturnValue(true),
                },
                Identity: {
                    getCurrentUser: jest.fn().mockReturnValue({
                        getMPID: () => testMPID,
                    }),
                },
            } as unknown) as IMParticleWebSDKInstance;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                pixelUrlAndRedirectUrl,
                '5',
                testMPID,
                {},
            );
        });

        it('should call performCookieSync if lastSyncDateForModule is null', () => {
            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
                _Persistence: {
                    getPersistence: () => ({testMPID: {}}),
                },
                _Consent: {
                    isEnabledForUserConsent: jest.fn().mockReturnValue(true),
                },
                Identity: {
                    getCurrentUser: jest.fn().mockReturnValue({
                        getMPID: () => testMPID,
                    }),
                },
            } as unknown) as IMParticleWebSDKInstance;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                pixelUrlAndRedirectUrl,
                '5',
                testMPID,
                {},
            );
        });

        it('should call performCookieSync if lastSyncDateForModule has passed the frequency cap', () => {
            const now = new Date().getTime();

            // Rev the date by one
            const cookieSyncDateInPast = now - ( pixelSettings.frequencyCap  + 1 ) * DAYS_IN_MILLISECONDS;

            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
                _Persistence: {
                    getPersistence: () => ({testMPID: {
                        csd: { 5: cookieSyncDateInPast }
                    }}),
                },
                _Consent: {
                    isEnabledForUserConsent: jest.fn().mockReturnValue(true),
                },
                Identity: {
                    getCurrentUser: jest.fn().mockReturnValue({
                        getMPID: () => testMPID,
                    }),
                },
            } as unknown) as IMParticleWebSDKInstance;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                pixelUrlAndRedirectUrl,
                '5',
                testMPID,
                {
                    5: cookieSyncDateInPast 
                },
            );
        });

        it('should call performCookieSync when there was not a previous cookie-sync', () => {
            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
                _Persistence: {
                    getPersistence: () => ({testMPID: {}}),
                },
                _Consent: {
                    isEnabledForUserConsent: jest.fn().mockReturnValue(true),
                },
                Identity: {
                    getCurrentUser: jest.fn().mockReturnValue({
                        getMPID: () => testMPID,
                    }),
                },
                Logger: {
                    verbose: jest.fn(),
                },
            } as unknown) as IMParticleWebSDKInstance;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                pixelUrlAndRedirectUrl,
                '5',
                testMPID, 
                {},
            );
        });

        it('should not call performCookieSync if persistence is empty', () => {
            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
                _Persistence: {
                    getPersistence: () => ({}),
                },
            } as unknown) as IMParticleWebSDKInstance;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(testMPID, true);

            expect(cookieSyncManager.performCookieSync).not.toHaveBeenCalled();
        });

        it('should not call performCookieSync if the user has not consented to the cookie sync', () => {
            const loggerSpy = jest.fn();
            const myPixelSettings: IPixelConfiguration = {
                pixelUrl: 'https://test.com',
                redirectUrl: '?redirect=https://redirect.com&mpid=%%mpid%%',
                filteringConsentRuleValues: {
                    values: ['test'],
                },
            } as unknown as IPixelConfiguration;   

            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [myPixelSettings],
                },
                _Persistence: {
                    getPersistence: () => ({testMPID: {
                        csd: {}
                    }}),
                },
                _Consent: {
                    isEnabledForUserConsent: jest.fn().mockReturnValue(false),
                },
                Identity: {
                    getCurrentUser: jest.fn().mockReturnValue({
                        getMPID: () => '123',
                    }),
                },
                Logger: {
                    verbose: loggerSpy,
                },
            } as unknown) as IMParticleWebSDKInstance;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(
                '123',
                false,
            );

            expect(cookieSyncManager.performCookieSync).not.toHaveBeenCalled();
        });

        describe('Rokt noTargeting privacy flag', () => {
            it('should block cookie sync when noTargeting is true', () => {
                const mockMPInstance = ({
                    _Store: {
                        webviewBridgeEnabled: false,
                        pixelConfigurations: [roktPixelSettings],
                    },
                    _Persistence: {
                        getPersistence: () => ({ testMPID: { csd: {} } }),
                    },
                    _Consent: {
                        isEnabledForUserConsent: jest.fn().mockReturnValue(true),
                    },
                    _CookieConsentManager: {
                        getNoTargeting: jest.fn().mockReturnValue(true),
                    },
                    Identity: {
                        getCurrentUser: jest.fn().mockReturnValue({ getMPID: () => testMPID }),
                    },
                } as unknown) as IMParticleWebSDKInstance;

                const cookieSyncManager = new CookieSyncManager(mockMPInstance);
                cookieSyncManager.performCookieSync = jest.fn();

                cookieSyncManager.attemptCookieSync(testMPID, true);

                expect(mockMPInstance._CookieConsentManager.getNoTargeting).toHaveBeenCalled();
                expect(cookieSyncManager.performCookieSync).not.toHaveBeenCalled();
            });

            it('should allow cookie sync when noTargeting is false', () => {
                const mockMPInstance = ({
                    _Store: {
                        webviewBridgeEnabled: false,
                        pixelConfigurations: [roktPixelSettings],
                    },
                    _Persistence: {
                        getPersistence: () => ({ testMPID: { csd: {} } }),
                    },
                    _Consent: {
                        isEnabledForUserConsent: jest.fn().mockReturnValue(true),
                    },
                    _CookieConsentManager: {
                        getNoTargeting: jest.fn().mockReturnValue(false),
                    },
                    Identity: {
                        getCurrentUser: jest.fn().mockReturnValue({ getMPID: () => testMPID }),
                    },
                } as unknown) as IMParticleWebSDKInstance;

                const cookieSyncManager = new CookieSyncManager(mockMPInstance);
                cookieSyncManager.performCookieSync = jest.fn();

                cookieSyncManager.attemptCookieSync(testMPID, true);

                expect(mockMPInstance._CookieConsentManager.getNoTargeting).toHaveBeenCalled();
                expect(cookieSyncManager.performCookieSync).toHaveBeenCalled();
            });

            it('should allow cookie sync when noTargeting is false by default', () => {
                const cookieConsentManager = new CookieConsentManager({ noTargeting: undefined, noFunctional: undefined }); // Defaults to noTargeting: false

                const mockMPInstance = ({
                    _Store: {
                        webviewBridgeEnabled: false,
                        pixelConfigurations: [roktPixelSettings],
                    },
                    _Persistence: {
                        getPersistence: () => ({ testMPID: { csd: {} } }),
                    },
                    _Consent: {
                        isEnabledForUserConsent: jest.fn().mockReturnValue(true),
                    },
                    _CookieConsentManager: cookieConsentManager,
                    Identity: {
                        getCurrentUser: jest.fn().mockReturnValue({ getMPID: () => testMPID }),
                    },
                } as unknown) as IMParticleWebSDKInstance;

                const cookieSyncManager = new CookieSyncManager(mockMPInstance);
                cookieSyncManager.performCookieSync = jest.fn();

                cookieSyncManager.attemptCookieSync(testMPID, true);

                // Default noTargeting is false, so cookie sync should be allowed
                expect(cookieConsentManager.getNoTargeting()).toBe(false);
                expect(cookieSyncManager.performCookieSync).toHaveBeenCalled();
            });

            it('should not check noTargeting for non-Rokt partners', () => {
                const mockMPInstance = ({
                    _Store: {
                        webviewBridgeEnabled: false,
                        pixelConfigurations: [pixelSettings], // Uses non-Rokt pixelSettings (moduleId: 5)
                    },
                    _Persistence: {
                        getPersistence: () => ({ testMPID: { csd: {} } }),
                    },
                    _Consent: {
                        isEnabledForUserConsent: jest.fn().mockReturnValue(true),
                    },
                    _CookieConsentManager: {
                        getNoTargeting: jest.fn().mockReturnValue(true),
                    },
                    Identity: {
                        getCurrentUser: jest.fn().mockReturnValue({ getMPID: () => testMPID }),
                    },
                } as unknown) as IMParticleWebSDKInstance;

                const cookieSyncManager = new CookieSyncManager(mockMPInstance);
                cookieSyncManager.performCookieSync = jest.fn();

                cookieSyncManager.attemptCookieSync(testMPID, true);

                // Should not check noTargeting for non-Rokt partners
                expect(mockMPInstance._CookieConsentManager.getNoTargeting).not.toHaveBeenCalled();
                // Should still perform cookie sync
                expect(cookieSyncManager.performCookieSync).toHaveBeenCalled();
            });
        });

        it('should return early if requiresConsent and mpidIsNotInCookies are both true', () => {
            const myPixelSettings: IPixelConfiguration = {
                pixelUrl: 'https://test.com',
                redirectUrl: '?redirect=https://redirect.com&mpid=%%mpid%%',
                filteringConsentRuleValues: {
                    values: ['test'],
                },
            } as unknown as IPixelConfiguration;            const loggerSpy = jest.fn();

            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [myPixelSettings], // empty values will make require consent to be true
                },
                _Persistence: {
                    getPersistence: () => ({testMPID: {
                        csd: {}
                    }}),
                },
                _Consent: {
                    isEnabledForUserConsent: jest.fn().mockReturnValue(true),
                },
                Identity: {
                    getCurrentUser: jest.fn().mockReturnValue({
                        getMPID: () => '123',
                    }),
                },
                Logger: {
                    verbose: loggerSpy,
                },
            } as unknown) as IMParticleWebSDKInstance;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(
                '123',
                true
            );

            expect(cookieSyncManager.performCookieSync).not.toHaveBeenCalled();
        });

        describe('Trade Desk domain parameter', () => {
            const originalLocation = window.location;

            beforeEach(() => {
                // Mock window.location.hostname
                delete (window as any).location;
                (window as any).location = { ...originalLocation, hostname: 'example.com' };
            });

            afterEach(() => {
                (window as any).location = originalLocation;
            });

            it('should add domain parameter for Trade Desk (module ID 103)', () => {
                const tradeDeskPixelSettings: IPixelConfiguration = {
                    ...pixelSettings,
                    moduleId: PARTNER_MODULE_IDS.TradeDesk, // 103
                    pixelUrl: 'https://insight.adsrvr.org/track/up?adv=abc123',
                    redirectUrl: '',
                };

                const mockMPInstance = ({
                    _Store: {
                        webviewBridgeEnabled: false,
                        pixelConfigurations: [tradeDeskPixelSettings],
                    },
                    _Persistence: {
                        getPersistence: () => ({testMPID: {
                            csd: {}
                        }}),
                    },
                    _Consent: {
                        isEnabledForUserConsent: jest.fn().mockReturnValue(true),
                    },
                    Identity: {
                        getCurrentUser: jest.fn().mockReturnValue({
                            getMPID: () => testMPID,
                        }),
                    },
                } as unknown) as IMParticleWebSDKInstance;

                const cookieSyncManager = new CookieSyncManager(mockMPInstance);
                cookieSyncManager.performCookieSync = jest.fn();

                cookieSyncManager.attemptCookieSync(testMPID, true);

                expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                    'https://insight.adsrvr.org/track/up?adv=abc123&domain=example.com',
                    '103',
                    testMPID,
                    {},
                );
            });

            it('should not add domain parameter for non-Trade Desk partners', () => {
                const nonTradeDeskPixelSettings: IPixelConfiguration = {
                    ...pixelSettings,
                    moduleId: PARTNER_MODULE_IDS.AppNexus, // 50
                    pixelUrl: 'https://ib.adnxs.com/cookie_sync?adv=abc123',
                    redirectUrl: '',
                };

                const mockMPInstance = ({
                    _Store: {
                        webviewBridgeEnabled: false,
                        pixelConfigurations: [nonTradeDeskPixelSettings],
                    },
                    _Persistence: {
                        getPersistence: () => ({testMPID: {
                            csd: {}
                        }}),
                    },
                    _Consent: {
                        isEnabledForUserConsent: jest.fn().mockReturnValue(true),
                    },
                    Identity: {
                        getCurrentUser: jest.fn().mockReturnValue({
                            getMPID: () => testMPID,
                        }),
                    },
                } as unknown) as IMParticleWebSDKInstance;

                const cookieSyncManager = new CookieSyncManager(mockMPInstance);
                cookieSyncManager.performCookieSync = jest.fn();

                cookieSyncManager.attemptCookieSync(testMPID, true);

                expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                    'https://ib.adnxs.com/cookie_sync?adv=abc123',
                    '50',
                    testMPID,
                    {},
                );
            });

            it('should handle multiple pixel configurations with mixed Trade Desk and non-Trade Desk', () => {
                const tradeDeskPixelSettings: IPixelConfiguration = {
                    ...pixelSettings,
                    moduleId: PARTNER_MODULE_IDS.TradeDesk,
                    pixelUrl: 'https://insight.adsrvr.org/track/up?adv=ttd123',
                    redirectUrl: '',
                };

                const appNexusPixelSettings: IPixelConfiguration = {
                    ...pixelSettings,
                    moduleId: PARTNER_MODULE_IDS.AppNexus,
                    pixelUrl: 'https://ib.adnxs.com/cookie_sync?adv=anx123',
                    redirectUrl: '',
                };

                const mockMPInstance = ({
                    _Store: {
                        webviewBridgeEnabled: false,
                        pixelConfigurations: [tradeDeskPixelSettings, appNexusPixelSettings],
                    },
                    _Persistence: {
                        getPersistence: () => ({testMPID: {
                            csd: {}
                        }}),
                    },
                    _Consent: {
                        isEnabledForUserConsent: jest.fn().mockReturnValue(true),
                    },
                    Identity: {
                        getCurrentUser: jest.fn().mockReturnValue({
                            getMPID: () => testMPID,
                        }),
                    },
                } as unknown) as IMParticleWebSDKInstance;

                const cookieSyncManager = new CookieSyncManager(mockMPInstance);
                cookieSyncManager.performCookieSync = jest.fn();

                cookieSyncManager.attemptCookieSync(testMPID, true);

                expect(cookieSyncManager.performCookieSync).toHaveBeenCalledTimes(2);
                
                // Check Trade Desk call (with domain)
                expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                    'https://insight.adsrvr.org/track/up?adv=ttd123&domain=example.com',
                    '103',
                    testMPID,
                    {},
                );

                // Check AppNexus call (without domain)
                expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                    'https://ib.adnxs.com/cookie_sync?adv=anx123',
                    '50',
                    testMPID,
                    {},
                );
            });

            it('should handle domain parameter with hyphens and subdomains', () => {
                // Mock a hostname with hyphens and subdomains
                delete (window as any).location;
                (window as any).location = { ...originalLocation, hostname: 'sub-domain.example.com' };

                const tradeDeskPixelSettings: IPixelConfiguration = {
                    ...pixelSettings,
                    moduleId: PARTNER_MODULE_IDS.TradeDesk,
                    pixelUrl: 'https://insight.adsrvr.org/track/up',
                    redirectUrl: '',
                };

                const mockMPInstance = ({
                    _Store: {
                        webviewBridgeEnabled: false,
                        pixelConfigurations: [tradeDeskPixelSettings],
                    },
                    _Persistence: {
                        getPersistence: () => ({testMPID: {
                            csd: {}
                        }}),
                    },
                    _Consent: {
                        isEnabledForUserConsent: jest.fn().mockReturnValue(true),
                    },
                    Identity: {
                        getCurrentUser: jest.fn().mockReturnValue({
                            getMPID: () => testMPID,
                        }),
                    },
                } as unknown) as IMParticleWebSDKInstance;

                const cookieSyncManager = new CookieSyncManager(mockMPInstance);
                cookieSyncManager.performCookieSync = jest.fn();

                cookieSyncManager.attemptCookieSync(testMPID, true);

                expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                    'https://insight.adsrvr.org/track/up?domain=sub-domain.example.com',
                    '103',
                    testMPID,
                    {},
                );
            });
        });
    });

    describe('PARTNER_MODULE_IDS', () => {
        it('should contain all expected partner module IDs', () => {
            expect(PARTNER_MODULE_IDS.AdobeEventForwarder).toBe(11);
            expect(PARTNER_MODULE_IDS.DoubleclickDFP).toBe(41);
            expect(PARTNER_MODULE_IDS.AppNexus).toBe(50);
            expect(PARTNER_MODULE_IDS.Lotame).toBe(58);
            expect(PARTNER_MODULE_IDS.TradeDesk).toBe(103);
            expect(PARTNER_MODULE_IDS.VerizonMedia).toBe(155);
        });
    });

    describe('#performCookieSync', () => {
        it('should add cookie sync data to a tracking pixel', () => {
            const mockImage = {
                onload: jest.fn(),
                src: '',
            };
            jest.spyOn(document, 'createElement').mockReturnValue(
                (mockImage as unknown) as HTMLImageElement
            );

            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
                _Persistence: {
                    getPersistence: jest.fn(),
                    saveUserCookieSyncDatesToPersistence: jest.fn(),
                },
                _Consent: {
                    isEnabledForUserConsent: jest.fn().mockReturnValue(true),
                },
                Identity: {
                    getCurrentUser: jest.fn().mockReturnValue({
                        getMPID: () => '123',
                    }),
                },
                Logger: {
                    verbose: jest.fn(),
                },
            } as unknown) as IMParticleWebSDKInstance;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);

            jest.useFakeTimers();

            // Mock the Date constructor
            const OriginalDate = global.Date;
            class MockDate extends OriginalDate {
                constructor() {
                    super(100); // Always return 100 as the date
                }
            }

            // Override global Date
            global.Date = MockDate as unknown as DateConstructor;

            let cookieSyncDates: CookieSyncDates  = {};
            cookieSyncManager.performCookieSync(
                'https://test.com',
                42,
                '1234',
                cookieSyncDates,
            );

            // Simulate image load
            mockImage.onload();

            expect(mockImage.src).toBe('https://test.com');
            expect(cookieSyncDates[42]).toBeDefined();
            expect(cookieSyncDates[42]).toBe(100)

            expect(mockMPInstance._Persistence.saveUserCookieSyncDatesToPersistence).toBeCalledWith(
                '1234', {42: 100}
            );

            global.Date = OriginalDate;
            jest.useRealTimers();
        });

        it('should log a verbose message when a cookie sync is performed', () => {
            const loggerSpy = jest.fn();

            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
                _Persistence: {
                    getPersistence: () => ({testMPID: {
                        csd: {}
                    }}),
                },
                _Consent: {
                    isEnabledForUserConsent: jest.fn().mockReturnValue(true),
                },
                Identity: {
                    getCurrentUser: jest.fn().mockReturnValue({
                        getMPID: () => '123',
                    }),
                },
                Logger: {
                    verbose: loggerSpy,
                },
            } as unknown) as IMParticleWebSDKInstance;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);

            let cookieSyncDates = {};
            cookieSyncManager.performCookieSync(
                'https://test.com',
                42,
                '1234',
                cookieSyncDates,
            );

            expect(loggerSpy).toHaveBeenCalledWith('Performing cookie sync');
        });
    });

    describe('#isLastSyncDateExpired', () => {
        const frequencyCap = 14; // days
        it('should return true if there is no last sync date', () => {
            expect(isLastSyncDateExpired(frequencyCap, null)).toBe(true);
        });

        it('should return true if lastSyncDate is beyond the frequencyCap', () => {
            const lastSyncDate = 0;  // beginning of time
            expect(isLastSyncDateExpired(frequencyCap, lastSyncDate)).toBe(true);
        });

        it('should return false if lastSyncDate is beyond the frequencyCap', () => {
            const lastSyncDate = new Date().getTime();  // now
            expect(isLastSyncDateExpired(frequencyCap, lastSyncDate)).toBe(false);
        });
    });
});
