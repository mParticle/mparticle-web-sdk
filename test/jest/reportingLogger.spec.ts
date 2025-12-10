import { IRateLimiter, RateLimiter, ReportingLogger } from '../../src/logging/reportingLogger';
import { LogRequestSeverity } from '../../src/logging/logRequest';
import { ErrorCodes } from '../../src/logging/errorCodes';

describe('ReportingLogger', () => {
    let logger: ReportingLogger;
    const baseUrl = 'https://test-url.com';
    const sdkVersion = '1.2.3';
    let mockFetch: jest.Mock;
    const accountId = '1234567890';
    beforeEach(() => {
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
        logger = new ReportingLogger(baseUrl, sdkVersion, accountId);
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
        expect(fetchCall[0]).toContain('/v1/log');
        const body = JSON.parse(fetchCall[1].body);
        expect(body).toMatchObject({
            severity: LogRequestSeverity.Error,
            code: ErrorCodes.UNHANDLED_EXCEPTION,
            stackTrace: 'stack'
        });
    });

    it('sends warning logs with correct params', () => {
        logger.warning('warn');
        expect(mockFetch).toHaveBeenCalled();
        const fetchCall = mockFetch.mock.calls[0];
        expect(fetchCall[0]).toContain('/v1/log');
        const body = JSON.parse(fetchCall[1].body);
        expect(body).toMatchObject({
            severity: LogRequestSeverity.Warning
        });
        expect(fetchCall[1].headers['rokt-account-id']).toBe(accountId);
    });

    it('does not log if ROKT_DOMAIN missing', () => {
        delete (globalThis as any).ROKT_DOMAIN;
        logger = new ReportingLogger(baseUrl, sdkVersion, accountId);
        logger.error('x');
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('does not log if feature flag and debug mode off', () => {
        window.mParticle.config.isWebSdkLoggingEnabled = false;
        window.location.search = '';
        logger = new ReportingLogger(baseUrl, sdkVersion, accountId);
        logger.error('x');
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('logs if debug mode on even if feature flag off', () => {
        window.mParticle.config.isWebSdkLoggingEnabled = false;
        window.location.search = '?mp_enable_logging=true';
        logger = new ReportingLogger(baseUrl, sdkVersion, accountId);
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
        logger = new ReportingLogger(baseUrl, sdkVersion, accountId, mockRateLimiter);

        for (let i = 0; i < 5; i++) logger.error('err');
        expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('uses default account id when accountId is empty', () => {
        logger = new ReportingLogger(baseUrl, sdkVersion, undefined);
        logger.error('msg');
        expect(mockFetch).toHaveBeenCalled();
        const fetchCall = mockFetch.mock.calls[0];
        expect(fetchCall[1].headers['rokt-account-id']).toBe('0');
    });

    it('uses default user agent when user agent is empty', () => {
        logger = new ReportingLogger(baseUrl, sdkVersion, accountId);
        delete (globalThis as any).navigator;
        delete (globalThis as any).location;
        logger.error('msg');
        expect(mockFetch).toHaveBeenCalled();
        const fetchCall = mockFetch.mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        expect(body).toMatchObject({ deviceInfo: 'no-user-agent-set', url: 'no-url-set' });
    });
});

describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;
    beforeEach(() => {
        rateLimiter = new RateLimiter();
    });

    it('allows up to 10 error logs then rate limits', () => {
        for (let i = 0; i < 10; i++) {
            expect(rateLimiter.incrementAndCheck(LogRequestSeverity.Error)).toBe(false);
        }
        expect(rateLimiter.incrementAndCheck(LogRequestSeverity.Error)).toBe(true);
        expect(rateLimiter.incrementAndCheck(LogRequestSeverity.Error)).toBe(true);
    });

    it('allows up to 10 warning logs then rate limits', () => {
        for (let i = 0; i < 10; i++) {
            expect(rateLimiter.incrementAndCheck(LogRequestSeverity.Warning)).toBe(false);
        }
        expect(rateLimiter.incrementAndCheck(LogRequestSeverity.Warning)).toBe(true);
        expect(rateLimiter.incrementAndCheck(LogRequestSeverity.Warning)).toBe(true);
    });

    it('allows up to 10 info logs then rate limits', () => {
        for (let i = 0; i < 10; i++) {
            expect(rateLimiter.incrementAndCheck(LogRequestSeverity.Info)).toBe(false);
        }
        expect(rateLimiter.incrementAndCheck(LogRequestSeverity.Info)).toBe(true);
        expect(rateLimiter.incrementAndCheck(LogRequestSeverity.Info)).toBe(true);
    });

    it('tracks rate limits independently per severity', () => {
        for (let i = 0; i < 10; i++) {
            rateLimiter.incrementAndCheck(LogRequestSeverity.Error);
        }
        expect(rateLimiter.incrementAndCheck(LogRequestSeverity.Error)).toBe(true);
        expect(rateLimiter.incrementAndCheck(LogRequestSeverity.Warning)).toBe(false);
    });
});
