import CookieSyncManager, {
    DAYS_IN_MILLISECONDS,
    IPixelConfiguration,
    CookieSyncDates
} from '../../src/cookieSyncManager';
import { MParticleWebSDK } from '../../src/sdkRuntimeModels';
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
            } as unknown) as MParticleWebSDK;

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
            } as unknown) as MParticleWebSDK;

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
            } as unknown) as MParticleWebSDK;

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
            } as unknown) as MParticleWebSDK;

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
            } as unknown) as MParticleWebSDK;

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
            } as unknown) as MParticleWebSDK;

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
            } as unknown) as MParticleWebSDK;

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
            } as unknown) as MParticleWebSDK;

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
            } as unknown) as MParticleWebSDK;

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
            } as unknown) as MParticleWebSDK;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(
                '123',
                false,
            );

            expect(cookieSyncManager.performCookieSync).not.toHaveBeenCalled();
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
            } as unknown) as MParticleWebSDK;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(
                '123',
                true
            );

            expect(cookieSyncManager.performCookieSync).not.toHaveBeenCalled();
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
                    // FIXME: why is this here?  it doesn't exist in the SDK (it is used elsewhere too)
                    setCookieSyncDates: jest.fn(),
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
            } as unknown) as MParticleWebSDK;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);

            jest.useFakeTimers();

            // Mock the Date constructor
            // const mockDate = new Date(0); // Epoch time: 0
            const OriginalDate = global.Date;
            class MockDate extends OriginalDate {
                constructor() {
                    super(100); // Always return 100 as the date
                }
            }

            // Override global Date
            global.Date = MockDate as unknown as DateConstructor;

            // Mock Date.now to always return 0
            MockDate.now = jest.fn(() => 100);

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
            } as unknown) as MParticleWebSDK;

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
});
