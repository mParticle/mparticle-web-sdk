import CookieSyncManager from '../../src/cookieSyncManager';
import { MParticleWebSDK } from '../../src/sdkRuntimeModels';
import { PixelConfiguration } from '../../src/store';
import { testMPID } from '../src/config/constants';

const pixelSettings: PixelConfiguration = {
    name: 'TestPixel',
    moduleId: 5,
    esId: 24053,
    isDebug: true,
    isProduction: true,
    settings: {},
    frequencyCap: 14,
    pixelUrl: '',
    redirectUrl: '',
};

describe('CookieSyncManager', () => {
    describe('#attemptCookieSync', () => {
        it('should perform a cookie sync with defaults', () => {
            const mockSDK = ({
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

            const cookieSyncManager = new CookieSyncManager(mockSDK);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(null, testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                '',
                5,
                testMPID,
                {},
                undefined,
                true,
                false, 
            );
        });

        it('should toggle requiresConsent value if filtering filteringConsentRuleValues are defined', () => {
            const myPixelSettings: PixelConfiguration = {
                filteringConsentRuleValues: {
                    values: ['test'],
                },
            };

            const mockSDK = ({
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

            const cookieSyncManager = new CookieSyncManager(mockSDK);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(null, testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                '',
                5,
                testMPID,
                {},
                { values: ['test'] },
                true,
                true, 
            );
        });

        it('should update the urlWithRedirect if a redirectUrl is defined', () => {
            const myPixelSettings: PixelConfiguration = {
                pixelUrl: 'https://test.com',
                redirectUrl: '?redirect=https://redirect.com&mpid=%%mpid%%',
            };

            const mockSDK = ({
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

            const cookieSyncManager = new CookieSyncManager(mockSDK);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(null, testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                'https://test.com%3Fredirect%3Dhttps%3A%2F%2Fredirect.com%26mpid%3DtestMPID',
                5,
                testMPID,
                {},
                undefined,
                true,
                false, 
            );
        });

        // QUESTION: What is the purpose of this code path?
        it('should call performCookieSync with mpid if previousMpid and mpid do not match', () => {
            const mockSDK = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
                _Persistence: {
                    getPersistence: () => ({testMPID: {
                    }}),
                },
            } as unknown) as MParticleWebSDK;

            const cookieSyncManager = new CookieSyncManager(mockSDK);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync('other-mpid', testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                '',
                5,
                testMPID,
                {},
                undefined,
                true,
                false, 
            );
        });

        it('should call performCookieSync with mpid and csd if previousMpid and mpid do not match', () => {
            const mockSDK = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
                _Persistence: {
                    getPersistence: () => ({testMPID: {
                        csd: { 5: 1234567890 }
                    }}),
                },
            } as unknown) as MParticleWebSDK;

            const cookieSyncManager = new CookieSyncManager(mockSDK);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync('other-mpid', testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                '',
                5,
                testMPID,
                {
                    5: 1234567890
                },
                undefined,
                true,
                false, 
            );
        });

        // QUESTION: What is the purpose of this code path?
        it('should call performCookieSync with mpid if previousMpid and mpid match', () => {
            const mockSDK = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
                _Persistence: {
                    getPersistence: () => ({testMPID: {
                    }}),
                },
            } as unknown) as MParticleWebSDK;

            const cookieSyncManager = new CookieSyncManager(mockSDK);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(testMPID, testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                '',
                5,
                testMPID,
                {},
                undefined,
                true,
                false, 
            ); 
        });

        it('should perform a cookie sync if lastSyncDateForModule is passed the frequency cap', () => {
            const now = new Date().getTime();

            // Rev the date by one
            const cookieSyncDateInPast = now - ( pixelSettings.frequencyCap  + 1 ) * 60 * 60 * 24 * 1000;

            const mockSDK = ({
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

            const cookieSyncManager = new CookieSyncManager(mockSDK);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(null, testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                '',
                5,
                testMPID,
                {
                    5: cookieSyncDateInPast 
                },
                undefined,
                true,
                false, 
            );
        });

        it('should perform a cookie sync if lastSyncDateForModule is past the frequency cap even if csd is empty', () => {
            const now = new Date().getTime();

            const mockSDK = ({
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

            const cookieSyncManager = new CookieSyncManager(mockSDK);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(null, testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                '',
                5,
                testMPID,
                {},
                undefined,
                true,
                false, 
            );
        });

        it('should sync cookies when there was not a previous cookie-sync', () => {
            const mockSDK = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
                _Persistence: {
                    getPersistence: () => ({}),
                },
            } as unknown) as MParticleWebSDK;

            const cookieSyncManager = new CookieSyncManager(mockSDK);

            cookieSyncManager.attemptCookieSync(null, '456', true);
            expect(mockSDK._Store.pixelConfigurations.length).toBe(1);
            expect(mockSDK._Store.pixelConfigurations[0].moduleId).toBe(5);
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

            const mockSDK = ({
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
                    verbose: jest.fn(),
                },
            } as unknown) as MParticleWebSDK;

            const cookieSyncManager = new CookieSyncManager(mockSDK);

            let cookieSyncDates = [];
            cookieSyncManager.performCookieSync(
                'https://test.com',
                42,
                '1234',
                cookieSyncDates,
                null,
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

            const mockSDK = ({
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

            const cookieSyncManager = new CookieSyncManager(mockSDK);

            let cookieSyncDates = [];
            cookieSyncManager.performCookieSync(
                'https://test.com',
                42,
                '1234',
                cookieSyncDates,
                null,
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

            const mockSDK = ({
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

            const cookieSyncManager = new CookieSyncManager(mockSDK);

            let cookieSyncDates = [];
            cookieSyncManager.performCookieSync(
                'https://test.com',
                42,
                '1234',
                cookieSyncDates,
                null,
                true,
                true
            );

            // Simulate image load
            mockImage.onload();

            expect(mockImage.src).toBe('');
            expect(cookieSyncDates[42]).toBeUndefined();
        });
    });
});
