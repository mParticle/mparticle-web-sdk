import CookieSyncManager, { DAYS_IN_MILLISECONDS } from '../../src/cookieSyncManager';
import { IPixelConfiguration } from '../../src/cookieSyncManager.interfaces';
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
    pixelUrl: '',
    redirectUrl: '',
};

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

            cookieSyncManager.attemptCookieSync(null, testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                '',
                '5',
                testMPID,
                {},
                undefined,
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

            cookieSyncManager.attemptCookieSync(null, null, true);

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

            cookieSyncManager.attemptCookieSync(null, testMPID, true);

            expect(cookieSyncManager.performCookieSync).not.toHaveBeenCalled();
        });

        it('should toggle requiresConsent value if filtering filteringConsentRuleValues are defined', () => {
            const myPixelSettings: IPixelConfiguration = {
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

            cookieSyncManager.attemptCookieSync(null, testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                '',
                '5',
                testMPID,
                {},
                { values: ['test'] },
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

            cookieSyncManager.attemptCookieSync(null, testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                'https://test.com%3Fredirect%3Dhttps%3A%2F%2Fredirect.com%26mpid%3DtestMPID',
                '5',
                testMPID,
                {},
                undefined,
                true,
                false, 
            );
        });

        // https://go.mparticle.com/work/SQDSDKS-6915
        it('should call performCookieSync with mpid if previousMpid and mpid do not match', () => {
            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
                _Persistence: {
                    getPersistence: () => ({testMPID: {
                    }}),
                },
            } as unknown) as MParticleWebSDK;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync('other-mpid', testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                '',
                '5',
                testMPID,
                {},
                undefined,
                true,
                false, 
            );
        });

        it('should include mpid AND csd when calling performCookieSync if previousMpid and mpid do not match', () => {
            const mockMPInstance = ({
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

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync('other-mpid', testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                '',
                '5',
                testMPID,
                {
                    5: 1234567890
                },
                undefined,
                true,
                false, 
            );
        });

        it('should call performCookieSync with mpid if previousMpid and mpid match', () => {
            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
                _Persistence: {
                    getPersistence: () => ({testMPID: {
                    }}),
                },
            } as unknown) as MParticleWebSDK;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);
            cookieSyncManager.performCookieSync = jest.fn();

            cookieSyncManager.attemptCookieSync(testMPID, testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                '',
                '5',
                testMPID,
                {},
                undefined,
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

            cookieSyncManager.attemptCookieSync(null, testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                '',
                '5',
                testMPID,
                {},
                undefined,
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

            cookieSyncManager.attemptCookieSync(null, testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                '',
                '5',
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

            cookieSyncManager.attemptCookieSync(null, testMPID, true);

            expect(cookieSyncManager.performCookieSync).toHaveBeenCalledWith(
                '',
                '5',
                testMPID,
                {},
                undefined,
                true,
                false, 
            );
        });

        it('should sync cookies when there was not a previous cookie-sync', () => {
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

            cookieSyncManager.attemptCookieSync(null, '456', true);
            expect(mockMPInstance._Store.pixelConfigurations.length).toBe(1);
            expect(mockMPInstance._Store.pixelConfigurations[0].moduleId).toBe(5);
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

            cookieSyncManager.attemptCookieSync(null, testMPID, true);

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
                null,
                true,
                true, 
            );

            // Simulate image load
            mockImage.onload();

            expect(mockImage.src).toBe('');
            expect(cookieSyncDates[42]).toBeUndefined();
        });
    });

    describe('#combineUrlWithRedirect', () => {
        it('should combine a pixelUrl with a redirectUrl', () => {
            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
            } as unknown) as MParticleWebSDK;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);

            // Note: We expect that the input of the pixelUrl will include a `?`
            // (ideally at the end of the string)
            // so that the redirectUrl can be processed by the backend correctly
            const result = cookieSyncManager.combineUrlWithRedirect(
                '1234',
                'https://test.com/some/path?',
                'https://redirect.mparticle.com/v1/sync?esid=1234&amp;MPID=%%mpid%%&amp;ID=$UID&amp;Key=testMPID&amp;env=2'
            );

            expect(result).toBe('https://test.com/some/path?https%3A%2F%2Fredirect.mparticle.com%2Fv1%2Fsync%3Fesid%3D1234%26amp%3BMPID%3D1234%26amp%3BID%3D%24UID%26amp%3BKey%3DtestMPID%26amp%3Benv%3D2');
        });

        it('should return the pixelUrl if no redirectUrl is defined', () => {
            const mockMPInstance = ({
                _Store: {
                    webviewBridgeEnabled: false,
                    pixelConfigurations: [pixelSettings],
                },
            } as unknown) as MParticleWebSDK;

            const cookieSyncManager = new CookieSyncManager(mockMPInstance);

            const result = cookieSyncManager.combineUrlWithRedirect(
                '1234',
                'https://test.com',
            );

            expect(result).toBe('https://test.com');
        });
    });
});
