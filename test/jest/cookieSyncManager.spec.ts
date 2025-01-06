import CookieSyncManager, {
    DAYS_IN_MILLISECONDS,
    IPixelConfiguration,
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

const pixelUrlAndReidrectUrl = 'https://test.com%3Fredirect%3Dhttps%3A%2F%2Fredirect.com%26mpid%3DtestMPID';

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
            } as unknown) as MParticleWebSDK;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                pixelUrlAndReidrectUrl,
                '5',
                testMPID,
                {},
                true,
                false, 
            );
        });

        it('should return early if mpid is not defined', () => {
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

        it('should return early if webviewBridgeEnabled is true', () => {
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

        it('should toggle requiresConsent value if filtering filteringConsentRuleValues are defined', () => {
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
                    pixelConfigurations: [{...pixelSettings, ...myPixelSettings}],
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

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                pixelUrlAndReidrectUrl,
                '5',
                testMPID,
                {},
                true,
                true, 
            );
        });

        it('should update the urlWithRedirect if a redirectUrl is defined', () => {
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
            } as unknown) as MParticleWebSDK;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                pixelUrlAndReidrectUrl,
                '5',
                testMPID,
                {},
                true,
                false, 
            );
        });

        it('should perform a cookie sync if lastSyncDateForModule is null', () => {
            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
                _Persistence: {
                    getPersistence: () => ({testMPID: {}}),
                },
            } as unknown) as MParticleWebSDK;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                pixelUrlAndReidrectUrl,
                '5',
                testMPID,
                {},
                true,
                false, 
            );
        });

        it('should perform a cookie sync if lastSyncDateForModule has passed the frequency cap', () => {
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
            } as unknown) as MParticleWebSDK;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                pixelUrlAndReidrectUrl,
                '5',
                testMPID,
                {
                    5: cookieSyncDateInPast 
                },
                true,
                false, 
            );
        });

        it('should perform a cookie sync if lastSyncDateForModule is past the frequency cap even if csd is empty', () => {
            const now = new Date().getTime();

            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
                _Persistence: {
                    // This will make lastSyncDateForModule undefined, which bypasses the
                    // actual time check, but still performs a cookie sync
                    getPersistence: () => ({testMPID: {}}),
                },
            } as unknown) as MParticleWebSDK;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                pixelUrlAndReidrectUrl,
                '5',
                testMPID,
                {},
                true,
                false, 
            );
        });

        it.only('should sync cookies when there was not a previous cookie-sync', () => {
            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
                _Persistence: {
                    setCookieSyncDates: jest.fn(),
                    getPersistence: () => ({testMPID: {}}),
                    saveUserCookieSyncDatesToPersistence: jest.fn(),
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
            expect(mockMPInstance._Store.pixelConfigurations.length).toBe(1);
            expect(mockMPInstance._Store.pixelConfigurations[0].moduleId).toBe(5);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                pixelUrlAndReidrectUrl,
                '5',
                testMPID,
                {},
                true,
                false, 
            );
        });

        it('should not perform a cookie sync if persistence is empty', () => {
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
    });

    describe('#performCookieSync', () => {
        it('should add cookie sync dates to a tracking pixel', () => {
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

            let cookieSyncDates = [];
            cookieSyncManager.performCookieSync(
                'https://test.com',
                42,
                '1234',
                cookieSyncDates,
                false,
                false
            );

            // Simulate image load
            mockImage.onload();

            expect(mockImage.src).toBe('https://test.com');
            expect(cookieSyncDates[42]).toBeDefined();
            expect(cookieSyncDates[42]).toBeGreaterThan(0);
        });

        it('should log a verbose message when a cookie sync is performed', () => {
            const mockImage = {
                onload: jest.fn(),
                src: '',
            };
            jest.spyOn(document, 'createElement').mockReturnValue(
                (mockImage as unknown) as HTMLImageElement
            );

            const loggerSpy = jest.fn();

            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
                _Persistence: {
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
                    verbose: loggerSpy,
                },
            } as unknown) as MParticleWebSDK;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);

            let cookieSyncDates = [];
            cookieSyncManager.performCookieSync(
                'https://test.com',
                42,
                '1234',
                cookieSyncDates,
                false,
                false
            );

            // Simulate image load
            mockImage.onload();

            expect(loggerSpy).toHaveBeenCalledWith('Performing cookie sync');
        });

        it('should return early if the user has not consented to the cookie sync', () => {
            const mockImage = {
                onload: jest.fn(),
                src: '',
            };
            jest.spyOn(document, 'createElement').mockReturnValue(
                (mockImage as unknown) as HTMLImageElement
            );

            const loggerSpy = jest.fn();

            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
                _Persistence: {
                    setCookieSyncDates: jest.fn(),
                    getPersistence: jest.fn(),
                    saveUserCookieSyncDatesToPersistence: jest.fn(),
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

            let cookieSyncDates = [];
            cookieSyncManager.performCookieSync(
                'https://test.com',
                42,
                '1234',
                cookieSyncDates,
                null,
                false,
                false, 
            );

            // Simulate image load
            mockImage.onload();

            expect(mockImage.src).toBe('');
            expect(cookieSyncDates[42]).toBeUndefined();
        });

        it('should return early if requiresConsent and mpidIsNotInCookies are both true', () => {
            const mockImage = {
                onload: jest.fn(),
                src: '',
            };
            jest.spyOn(document, 'createElement').mockReturnValue(
                (mockImage as unknown) as HTMLImageElement
            );

            const loggerSpy = jest.fn();

            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
                _Persistence: {
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
                    verbose: loggerSpy,
                },
            } as unknown) as MParticleWebSDK;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);

            let cookieSyncDates = [];
            cookieSyncManager.performCookieSync(
                'https://test.com',
                42,
                '1234',
                cookieSyncDates,
                true,
                true, 
            );

            // Simulate image load
            mockImage.onload();

            expect(mockImage.src).toBe('');
            expect(cookieSyncDates[42]).toBeUndefined();
        });
    });
});
