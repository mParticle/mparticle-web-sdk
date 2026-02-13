import { IRateLimiter, RateLimiter, ReportingLogger } from '../../src/logging/reportingLogger';
import { WSDKErrorSeverity } from '../../src/logging/logRequest';
import { ErrorCodes } from '../../src/logging/errorCodes';
import { IStore, SDKConfig } from '../../src/store';

describe('ReportingLogger', () => {
    let logger: ReportingLogger;
    const loggingUrl = 'test-url.com/v1/log';
    const errorUrl = 'test-url.com/v1/errors';
    const sdkVersion = '1.2.3';
    let mockFetch: jest.Mock;
    const accountId = '1234567890';
    let mockStore: Partial<IStore>;

    beforeEach(() => {
        mockFetch = jest.fn().mockResolvedValue({ ok: true });
        global.fetch = mockFetch;

        mockStore = {
            getRoktAccountId: jest.fn().mockReturnValue(null),
            getIntegrationName: jest.fn().mockReturnValue(null)
        };

        Object.defineProperty(window, 'location', {
            writable: true,
            value: {
                href: 'https://e.com',
                search: ''
            }
        });

        Object.defineProperty(window, 'navigator', {
            writable: true,
            value: { userAgent: 'ua' }
        });

        Object.defineProperty(window, 'mParticle', {
            writable: true,
            value: { config: { isWebSdkLoggingEnabled: true } }
        });

        Object.defineProperty(window, 'ROKT_DOMAIN', {
            writable: true,
            value: 'set'
        });

        logger = new ReportingLogger(
            { loggingUrl, errorUrl, isWebSdkLoggingEnabled: true } as SDKConfig,
            sdkVersion,
            mockStore as IStore,
            'test-launcher-instance-guid'
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('sends error logs with correct params', () => {
        logger.error('msg', ErrorCodes.UNHANDLED_EXCEPTION, 'stack');
        expect(mockFetch).toHaveBeenCalled();
        const fetchCall = mockFetch.mock.calls[0];
        expect(fetchCall[0]).toContain('/v1/errors');
        const body = JSON.parse(fetchCall[1].body);
        expect(body).toMatchObject({
            severity: WSDKErrorSeverity.ERROR,
            code: ErrorCodes.UNHANDLED_EXCEPTION,
            stackTrace: 'stack'
        });
    });

    it('sends warning logs with correct params', () => {
        mockStore.getRoktAccountId = jest.fn().mockReturnValue(accountId);
        logger.warning('warn');
        expect(mockFetch).toHaveBeenCalled();
        const fetchCall = mockFetch.mock.calls[0];
        expect(fetchCall[0]).toContain('/v1/errors');
        const body = JSON.parse(fetchCall[1].body);
        expect(body).toMatchObject({
            severity: WSDKErrorSeverity.WARNING
        });
        expect(fetchCall[1].headers['rokt-account-id']).toBe(accountId);
    });

    it('does not log if ROKT_DOMAIN missing', () => {
        Object.defineProperty(window, 'ROKT_DOMAIN', {
            writable: true,
            value: undefined
        });
        logger = new ReportingLogger(
            { loggingUrl, errorUrl, isWebSdkLoggingEnabled: true } as SDKConfig,
            sdkVersion,
            mockStore as IStore,
            'test-launcher-instance-guid'
        );
        logger.error('x');
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('does not log if feature flag and debug mode off', () => {
        Object.defineProperty(window, 'mParticle', {
            writable: true,
            value: { config: { isWebSdkLoggingEnabled: false } }
        });
        Object.defineProperty(window, 'location', {
            writable: true,
            value: { href: 'https://e.com', search: '' }
        });
        logger = new ReportingLogger(
            { loggingUrl, errorUrl, isWebSdkLoggingEnabled: false } as SDKConfig,
            sdkVersion,
            mockStore as IStore,
            'test-launcher-instance-guid'
        );
        logger.error('x');
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('logs if debug mode on even if feature flag off', () => {
        Object.defineProperty(window, 'mParticle', {
            writable: true,
            value: { config: { isWebSdkLoggingEnabled: false } }
        });
        Object.defineProperty(window, 'location', {
            writable: true,
            value: { href: 'https://e.com', search: '?mp_enable_logging=true' }
        });
        logger = new ReportingLogger(
            { loggingUrl, errorUrl, isWebSdkLoggingEnabled: false } as SDKConfig,
            sdkVersion,
            mockStore as IStore,
            'test-launcher-instance-guid'
        );
        logger.error('x');
        expect(mockFetch).toHaveBeenCalled();
    });

    it('rate limits after 3 errors', () => {
        let count = 0;
        const mockRateLimiter: IRateLimiter = {
            incrementAndCheck: jest.fn().mockImplementation((severity) => {
                return ++count > 3;
            }),
        };
        logger = new ReportingLogger(
            { loggingUrl, errorUrl, isWebSdkLoggingEnabled: true } as SDKConfig,
            sdkVersion,
            mockStore as IStore,
            'test-launcher-instance-guid',
            mockRateLimiter
        );

        for (let i = 0; i < 5; i++) logger.error('err');
        expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('does not include account id header when account id is not set', () => {
        logger.error('msg');
        expect(mockFetch).toHaveBeenCalled();
        const fetchCall = mockFetch.mock.calls[0];
        expect(fetchCall[1].headers['rokt-account-id']).toBeUndefined();
    });

    it('omits user agent and url fields when navigator/location are undefined', () => {
        Object.defineProperty(window, 'navigator', {
            writable: true,
            value: undefined
        });
        Object.defineProperty(window, 'location', {
            writable: true,
            value: undefined
        });
        logger = new ReportingLogger(
            { loggingUrl, errorUrl, isWebSdkLoggingEnabled: true } as SDKConfig,
            sdkVersion,
            mockStore as IStore,
            'test-launcher-instance-guid'
        );
        logger.error('msg');
        expect(mockFetch).toHaveBeenCalled();
        const fetchCall = mockFetch.mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        // undefined values are omitted from JSON.stringify, so these fields won't be present
        expect(body).not.toHaveProperty('deviceInfo');
        expect(body).not.toHaveProperty('url');
    });

    it('can set store after initialization', () => {
        const loggerWithoutStore = new ReportingLogger(
            { loggingUrl, errorUrl, isWebSdkLoggingEnabled: true } as SDKConfig,
            sdkVersion,
            undefined,
            'test-launcher-instance-guid'
        );

        const newMockStore: Partial<IStore> = {
            getRoktAccountId: jest.fn().mockReturnValue(accountId),
            getIntegrationName: jest.fn().mockReturnValue('custom-integration-name')
        };

        loggerWithoutStore.setStore(newMockStore as IStore);
        loggerWithoutStore.error('test error');

        expect(mockFetch).toHaveBeenCalled();
        const fetchCall = mockFetch.mock.calls[0];
        expect(fetchCall[1].headers['rokt-account-id']).toBe(accountId);
        expect(fetchCall[1].headers['rokt-launcher-version']).toBe('custom-integration-name');
    });
});

describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;
    beforeEach(() => {
        rateLimiter = new RateLimiter();
    });

    it('allows up to 10 error logs then rate limits', () => {
        for (let i = 0; i < 10; i++) {
            expect(rateLimiter.incrementAndCheck(WSDKErrorSeverity.ERROR)).toBe(false);
        }
        expect(rateLimiter.incrementAndCheck(WSDKErrorSeverity.ERROR)).toBe(true);
        expect(rateLimiter.incrementAndCheck(WSDKErrorSeverity.ERROR)).toBe(true);
    });

    it('allows up to 10 warning logs then rate limits', () => {
        for (let i = 0; i < 10; i++) {
            expect(rateLimiter.incrementAndCheck(WSDKErrorSeverity.WARNING)).toBe(false);
        }
        expect(rateLimiter.incrementAndCheck(WSDKErrorSeverity.WARNING)).toBe(true);
        expect(rateLimiter.incrementAndCheck(WSDKErrorSeverity.WARNING)).toBe(true);
    });

    it('allows up to 10 info logs then rate limits', () => {
        for (let i = 0; i < 10; i++) {
            expect(rateLimiter.incrementAndCheck(WSDKErrorSeverity.INFO)).toBe(false);
        }
        expect(rateLimiter.incrementAndCheck(WSDKErrorSeverity.INFO)).toBe(true);
        expect(rateLimiter.incrementAndCheck(WSDKErrorSeverity.INFO)).toBe(true);
    });

    it('tracks rate limits independently per severity', () => {
        for (let i = 0; i < 10; i++) {
            rateLimiter.incrementAndCheck(WSDKErrorSeverity.ERROR);
        }
        expect(rateLimiter.incrementAndCheck(WSDKErrorSeverity.ERROR)).toBe(true);
        expect(rateLimiter.incrementAndCheck(WSDKErrorSeverity.WARNING)).toBe(false);
    });
});
