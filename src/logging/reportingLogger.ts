import { ErrorCodes } from "./errorCodes";
import { LogRequestBody, WSDKErrorSeverity } from "./logRequest";
import { FetchUploader, IFetchPayload } from "../uploaders";

// QUESTION: Should we collapse the interface with the class?
export interface IReportingLogger {
    error(msg: string, code: ErrorCodes, stackTrace?: string): void;
    warning(msg: string, code: ErrorCodes): void;
}

export class ReportingLogger implements IReportingLogger {
    private readonly isEnabled: boolean;
    private readonly reporter: string = 'mp-wsdk';
    private readonly integration: string = 'mp-wsdk';
    private readonly rateLimiter: IRateLimiter;
    private loggingUrl: string;
    private errorUrl: string;
    private accountId: string;
    private integrationName: string;

    constructor(
        private readonly sdkVersion: string,
        rateLimiter?: IRateLimiter, // QUESTION: Do we need this in the constructor?
        private readonly launcherInstanceGuid?: string,
    ) {
        this.isEnabled = this.isReportingEnabled();
        console.warn('ReportingLogger: isEnabled', this.isEnabled);
        this.rateLimiter = rateLimiter ?? new RateLimiter();
    }

    public setLoggingUrl(url: string) {
        this.loggingUrl = url;
    }

    public setErrorUrl(url: string) {
        this.errorUrl = url;
    }
    
    public setAccountId(accountId: string) {
        this.accountId = accountId;
    }
    
    public setIntegrationName(integrationName: string) {
        this.integrationName = integrationName;
    }

    // TODO: Add an `info` method to the logger for `/v1/log`

    public error(msg: string, code: ErrorCodes, stackTrace?: string) {
        this.sendLog(WSDKErrorSeverity.ERROR, msg, code, stackTrace);
    };

    public warning(msg: string, code: ErrorCodes) { 
        this.sendLog(WSDKErrorSeverity.WARNING, msg, code);
    };
    
    private getVersion(): string {
        return this.integrationName ?? this.sdkVersion;
    }
    
    // QUESTION: Should we split this into `sendError` and `sendLog`?
    private sendLog(
        severity: WSDKErrorSeverity,
        msg: string,
        code: ErrorCodes,
        stackTrace?: string
    ): void {
        if(!this.canSendLog(severity))
            return;

        const logRequest: LogRequestBody = {
            additionalInformation: {
                message: msg,
                version: this.getVersion(),
            },
            severity: severity,
            code: code,
            url: this.getUrl(),
            deviceInfo: this.getUserAgent(),
            stackTrace: stackTrace ?? 'this is my stack trace',
            reporter: this.reporter,
            integration: this.integration,
        };
        
        this.sendLogToServer(logRequest);
    }

    private isReportingEnabled(): boolean {
        // QUESTION: Should isDebugModeEnabled take precedence over
        // isFeatureFlagEnabled and rokt domain present?
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
    
    private canSendLog(severity: WSDKErrorSeverity): boolean {
        return this.isEnabled && !this.isRateLimited(severity);
    }

    private isRateLimited(severity: WSDKErrorSeverity): boolean {
        return this.rateLimiter.incrementAndCheck(severity);
    }

    private getUrl(): string {
        return window.location.href;
    }

    private getUserAgent(): string {
        return window.navigator.userAgent;
    }

    private getLoggingUrl = (): string => `https://${this.loggingUrl}`;
    private getErrorUrl = (): string => `https://${this.errorUrl}`;
    
    private getHeaders(): IFetchPayload['headers'] {
        const headers: Record<string, string> = {
            Accept: 'text/plain;charset=UTF-8',
            'Content-Type': 'application/json',
            'rokt-launcher-instance-guid': this.launcherInstanceGuid,
            'rokt-launcher-version': this.getVersion(),
            'rokt-wsdk-version': 'joint',
        };
        return headers as IFetchPayload['headers'];
    }

    private sendLogToServer(logRequest: LogRequestBody) {
        const uploadUrl = this.getErrorUrl();
        const uploader = new FetchUploader(uploadUrl);
        const payload: IFetchPayload = {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(logRequest),
        };
            
        uploader.upload(payload);
    };
}

export interface IRateLimiter {
    incrementAndCheck(severity: WSDKErrorSeverity): boolean;
}

export class RateLimiter implements IRateLimiter {
    private readonly rateLimits: Map<WSDKErrorSeverity, number> = new Map([
        [WSDKErrorSeverity.ERROR, 10],
        [WSDKErrorSeverity.WARNING, 10],
        [WSDKErrorSeverity.INFO, 10],
    ]);
    private logCount: Map<WSDKErrorSeverity, number> = new Map();

    public incrementAndCheck(severity: WSDKErrorSeverity): boolean {
        const count = this.logCount.get(severity) || 0;
        const limit = this.rateLimits.get(severity) || 10;
        
        const newCount = count + 1;
        this.logCount.set(severity, newCount);
        
        return newCount > limit;
    }
}