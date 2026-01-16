import { IRateLimiter, RateLimiter, ReportingLogger } from '../../src/logging/reportingLogger';
import { WSDKErrorSeverity } from '../../src/logging/logRequest';
import { ErrorCodes } from '../../src/logging/errorCodes';
import { IStore, SDKConfig } from '../../src/store';

describe('ReportingLogger', () => {
    let logger: ReportingLogger;
    const loggingUrl = 'https://test-url.com/v1/log';
    const errorUrl = 'https://test-url.com/v1/errors';
    const sdkVersion = '1.2.3';
    let mockFetch: jest.Mock;
    const accountId = '1234567890';
    const mockStore: IStore = { getRoktAccountId: () => accountId } as IStore;
    let sdkConfig: SDKConfig;
    beforeEach(() => {
        sdkConfig = { 
            loggingUrl: loggingUrl, 
            errorUrl: errorUrl, 
            isWebSdkLoggingEnabled: true,
        } as SDKConfig;
        
        mockFetch = jest.fn().mockResolvedValue({ ok: true });
        global.fetch = mockFetch;
        
        delete (globalThis as any).location;
        (globalThis as any).location = {
            href: 'https://e.com',
            search: ''
        };
        
        Object.assign(globalThis, {
            navigator: { userAgent: 'ua' },
            mParticle: { config: { isWebSdkLoggingEnabled: true } },
            ROKT_DOMAIN: 'set',
            fetch: mockFetch
        });
        logger = new ReportingLogger(
            sdkConfig,
            sdkVersion,
            'test-launcher-instance-guid'
        );
        logger.setStore(mockStore);
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete (window as any).ROKT_DOMAIN;
        delete (window as any).mParticle;
    });

    it('sends error logs with correct params', () => {
        logger.error('msg', ErrorCodes.UNHANDLED_EXCEPTION, 'stack');
        expect(mockFetch).toHaveBeenCalled();
        const fetchCall = mockFetch.mock.calls[0];
        expect(fetchCall[0]).toContain('/v1/error');
        const body = JSON.parse(fetchCall[1].body);
        expect(body).toMatchObject({
            severity: WSDKErrorSeverity.ERROR,
            code: ErrorCodes.UNHANDLED_EXCEPTION,
            stackTrace: 'stack'
        });
    });

    it('sends warning logs with correct params', () => {
        logger.warning('warn');
        expect(mockFetch).toHaveBeenCalled();
        const fetchCall = mockFetch.mock.calls[0];
        expect(fetchCall[0]).toContain('/v1/error');
        const body = JSON.parse(fetchCall[1].body);
        expect(body).toMatchObject({
            severity: WSDKErrorSeverity.WARNING
        });
        expect(fetchCall[1].headers['rokt-account-id']).toBe(accountId);
    });

    it('does not log if ROKT_DOMAIN missing', () => {
        delete (globalThis as any).ROKT_DOMAIN;
        logger = new ReportingLogger(
            sdkConfig,
            sdkVersion,
            'test-launcher-instance-guid'
        );
        logger.error('x');
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('does not log if feature flag and debug mode off', () => {
        sdkConfig.isWebSdkLoggingEnabled = false;
        window.location.search = '';
        logger = new ReportingLogger(
            sdkConfig,
            sdkVersion,
            'test-launcher-instance-guid'
        );
        logger.error('x');
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('logs if debug mode on even if feature flag off', () => {
        sdkConfig.isWebSdkLoggingEnabled = false;
        window.location.search = '?mp_enable_logging=true';
        logger = new ReportingLogger(
            sdkConfig,
            sdkVersion,
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
            sdkConfig,
            sdkVersion,
            'test-launcher-instance-guid',
            mockRateLimiter
        );

        for (let i = 0; i < 5; i++) logger.error('err');
        expect(mockFetch).toHaveBeenCalledTimes(3);
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
