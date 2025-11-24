import { RateLimiter, ReportingLogger } from '../../src/logging/reportingLogger';
import { LogRequestSeverity } from '../../src/logging/logRequest';
import { ErrorCodes } from '../../src/logging/errorCodes';

describe('ReportingLogger', () => {
    let apiClient: any;
    let logger: ReportingLogger;
    const sdkVersion = '1.2.3';

    beforeEach(() => {
        apiClient = { sendLogToServer: jest.fn() };
        
        // Mock location object to allow modifying search property
        delete (window as any).location;
        (window as any).location = {
            href: 'https://e.com',
            search: ''
        };
        
        Object.assign(window, {
            navigator: { userAgent: 'ua' },
            mParticle: { config: { isWebSdkLoggingEnabled: true } },
            ROKT_DOMAIN: 'set'
        });
        logger = new ReportingLogger(apiClient, sdkVersion);
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete (window as any).ROKT_DOMAIN;
        delete (window as any).mParticle;
    });

    it('sends error logs with correct params', () => {
        logger.error('msg', ErrorCodes.UNHANDLED_EXCEPTION, 'stack');
        expect(apiClient.sendLogToServer).toHaveBeenCalledWith(expect.objectContaining({
            severity: LogRequestSeverity.Error,
            code: ErrorCodes.UNHANDLED_EXCEPTION,
            stackTrace: 'stack'
        }));
    });

    it('sends warning logs with correct params', () => {
        logger.warning('warn');
        expect(apiClient.sendLogToServer).toHaveBeenCalledWith(expect.objectContaining({
            severity: LogRequestSeverity.Warning
        }));
    });

    it('does not log if ROKT_DOMAIN missing', () => {
        delete (window as any).ROKT_DOMAIN;
        logger = new ReportingLogger(apiClient, sdkVersion);
        logger.error('x');
        expect(apiClient.sendLogToServer).not.toHaveBeenCalled();
    });

    it('does not log if feature flag and debug mode off', () => {
        window.mParticle.config.isWebSdkLoggingEnabled = false;
        window.location.search = '';
        logger = new ReportingLogger(apiClient, sdkVersion);
        logger.error('x');
        expect(apiClient.sendLogToServer).not.toHaveBeenCalled();
    });

    it('logs if debug mode on even if feature flag off', () => {
        window.mParticle.config.isWebSdkLoggingEnabled = false;
        window.location.search = '?mp_enable_logging=true';
        logger = new ReportingLogger(apiClient, sdkVersion);
        logger.error('x');
        expect(apiClient.sendLogToServer).toHaveBeenCalled();
    });

    it('rate limits after 10 errors', () => {
        for (let i = 0; i < 12; i++) logger.error('err');
        expect(apiClient.sendLogToServer).toHaveBeenCalledTimes(10);
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
