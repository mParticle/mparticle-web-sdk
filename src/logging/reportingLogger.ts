import { IAPIClient } from "../apiClient";
import { ErrorCodes } from "./errorCodes";
import { LogRequest, LogRequestSeverity } from "./logRequest";

export interface IReportingLogger {
    error(msg: string, code?: ErrorCodes, stackTrace?: string): void;
    warning(msg: string, code?: ErrorCodes): void;
}

export class ReportingLogger implements IReportingLogger {
    private readonly isEnabled: boolean;
    private readonly apiClient: IAPIClient;
    private readonly reporter: string = 'mp-wsdk';
    private readonly integration: string = 'mp-wsdk';
    private readonly rateLimiter: IRateLimiter;

    constructor(
        apiClient: IAPIClient,
        private readonly sdkVersion: string,
        rateLimiter?: IRateLimiter,
    ) {
        this.isEnabled = this.isReportingEnabled();
        this.apiClient = apiClient;
        this.rateLimiter = rateLimiter ?? new RateLimiter();
    }

    public error(msg: string, code?: ErrorCodes, stackTrace?: string) {
        this.sendLog(LogRequestSeverity.Error, msg, code ?? ErrorCodes.UNHANDLED_EXCEPTION, stackTrace);
    };

    public warning(msg: string, code?: ErrorCodes) { 
        this.sendLog(LogRequestSeverity.Warning, msg, code ?? ErrorCodes.UNHANDLED_EXCEPTION);
    };
    
    private sendLog(
        severity: LogRequestSeverity,
        msg: string,
        code: ErrorCodes,
        stackTrace?: string
    ): void {
        if(!this.canSendLog(severity))
            return;

        const logRequest: LogRequest = {
            additionalInformation: {
                message: msg,
                version: this.sdkVersion,
            },
            severity: severity,
            code: code,
            url: this.getUrl(),
            deviceInfo: this.getUserAgent(),
            stackTrace: stackTrace ?? '',
            reporter: this.reporter,
            integration: this.integration,
        };
        
        this.apiClient.sendLogToServer(logRequest);
    }

    private isReportingEnabled(): boolean {
        return (
            this.isRoktDomainPresent() && 
            (this.isFeatureFlagEnabled() ||
            this.isDebugModeEnabled())
        );
    }

    private isRoktDomainPresent(): boolean {
        return Boolean(window['ROKT_DOMAIN']);
    }

    private isFeatureFlagEnabled(): boolean {
        return window.
                mParticle?.
                config?.
                isWebSdkLoggingEnabled ?? false;
    }

    private isDebugModeEnabled(): boolean {
        return (
            window.
                location?.
                search?.
                toLowerCase()?.
                includes('mp_enable_logging=true') ?? false
        );
    }
    
    private canSendLog(severity: LogRequestSeverity): boolean {
        return this.isEnabled && !this.isRateLimited(severity);
    }

    private isRateLimited(severity: LogRequestSeverity): boolean {
        return this.rateLimiter.incrementAndCheck(severity);
    }

    private getUrl(): string {
        return window.location.href;
    }

    private getUserAgent(): string {
        return window.navigator.userAgent;
    }
}

export interface IRateLimiter {
    incrementAndCheck(severity: LogRequestSeverity): boolean;
}

export class RateLimiter implements IRateLimiter {
    private readonly rateLimits: Map<LogRequestSeverity, number> = new Map([
        [LogRequestSeverity.Error, 10],
        [LogRequestSeverity.Warning, 10],
        [LogRequestSeverity.Info, 10],
    ]);
    private logCount: Map<LogRequestSeverity, number> = new Map();

    public incrementAndCheck(severity: LogRequestSeverity): boolean {
        const count = this.logCount.get(severity) || 0;
        const limit = this.rateLimits.get(severity) || 10;
        
        const newCount = count + 1;
        this.logCount.set(severity, newCount);
        
        return newCount > limit;
    }
}