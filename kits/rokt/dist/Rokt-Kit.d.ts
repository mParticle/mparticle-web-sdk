declare interface ErrorReport {
    message: string;
    code?: string;
    severity?: string;
    stackTrace?: string;
}

declare interface LogEntry {
    message: string;
    code?: string;
}

export declare class LoggingService {
    private _transport;
    private _loggingUrl;
    private _errorReportingService;
    constructor(config: ReportingConfig, errorReportingService: {
        report: (e: ErrorReport) => void;
    }, integrationName: string | null | undefined, launcherInstanceGuid?: string, accountId?: string | null, rateLimiter?: RateLimiter);
    log(entry: LogEntry | null | undefined): void;
}

declare class RateLimiter {
    private _logCount;
    incrementAndCheck(severity: string): boolean;
}

export declare function register(config: {
    kits?: Record<string, unknown>;
}): void;

declare interface ReportingConfig {
    loggingUrl?: string;
    errorUrl?: string;
    integrationDomain?: string;
    isLoggingEnabled: boolean;
}

export { }


declare global {
    interface Window {
        Rokt?: RoktGlobal;
        __rokt_li_guid__?: string;
        optimizely?: OptimizelyGlobal;
        mParticle: any;
    }
}

