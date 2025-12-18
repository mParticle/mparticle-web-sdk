import { ErrorCodes } from "./errorCodes";
import { LogRequestBody, WSDKErrorSeverity } from "./logRequest";
import { FetchUploader, IFetchPayload } from "../uploaders";
import { IStore, SDKConfig } from "../store";

// QUESTION: Should we collapse the interface with the class?
export interface IReportingLogger {
    error(msg: string, code?: ErrorCodes, stackTrace?: string): void;
    warning(msg: string, code?: ErrorCodes): void;
}

export class ReportingLogger implements IReportingLogger {
    private readonly isEnabled: boolean;
    private readonly reporter: string = 'mp-wsdk';
    private readonly integration: string = 'mp-wsdk';
    private readonly rateLimiter: IRateLimiter;
    private integrationName: string;
    private store: IStore;

    constructor(
        private readonly config: SDKConfig,
        private readonly sdkVersion: string,
        private readonly launcherInstanceGuid?: string,
        rateLimiter?: IRateLimiter,
    ) {
        this.isEnabled = this.isReportingEnabled();
        this.rateLimiter = rateLimiter ?? new RateLimiter();
    }

    public setIntegrationName(integrationName: string) {
        this.integrationName = integrationName;
    }
    
    public setStore(store: IStore) {
        this.store = store;
    }

    public info(msg: string, code?: ErrorCodes) {
        this.sendLog(WSDKErrorSeverity.INFO, msg, code);
    }

    public error(msg: string, code?: ErrorCodes, stackTrace?: string) {
        this.sendError(WSDKErrorSeverity.ERROR, msg, code, stackTrace);
    };

    public warning(msg: string, code?: ErrorCodes) { 
        this.sendError(WSDKErrorSeverity.WARNING, msg, code);
    };
    
    private sendToServer(url: string,severity: WSDKErrorSeverity, msg: string, code?: ErrorCodes, stackTrace?: string): void {
        if(!this.canSendLog(severity))
            return;
    
        const logRequest = this.getLogRequest(severity, msg, code, stackTrace);
        const uploader = new FetchUploader(url);
        const payload: IFetchPayload = {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(logRequest),
        };
        uploader.upload(payload);
    }

    private sendLog(severity: WSDKErrorSeverity, msg: string, code?: ErrorCodes, stackTrace?: string): void {
        const url = this.getLoggingUrl();
        this.sendToServer(url, severity, msg, code, stackTrace);
    }
    private sendError(severity: WSDKErrorSeverity, msg: string, code?: ErrorCodes, stackTrace?: string): void {
        const url = this.getErrorUrl();
        this.sendToServer(url, severity, msg, code, stackTrace);
    }
    
    private getLogRequest(severity: WSDKErrorSeverity, msg: string, code?: ErrorCodes, stackTrace?: string): LogRequestBody {
        return {
            additionalInformation: {
                message: msg,
                version: this.getVersion(),
            },
            severity: severity,
            code: code ?? ErrorCodes.UNKNOWN_ERROR,
            url: this.getUrl(),
            deviceInfo: this.getUserAgent(),
            stackTrace: stackTrace ?? '',
            reporter: this.reporter,
            integration: this.integration
        };
    }

    private getVersion(): string {
        return this.integrationName ?? this.sdkVersion;
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
        return this.config.isWebSdkLoggingEnabled;
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

    private getLoggingUrl = (): string => `https://${this.config.loggingUrl}`;
    private getErrorUrl = (): string => `https://${this.config.errorUrl}`;
    
    private getHeaders(): IFetchPayload['headers'] {
        const headers: Record<string, string> = {
            Accept: 'text/plain;charset=UTF-8',
            'Content-Type': 'application/json',
            'rokt-launcher-instance-guid': this.launcherInstanceGuid,
            'rokt-launcher-version': this.getVersion(),
            'rokt-wsdk-version': 'joint',
        };
        
        if (this.store?.getRoktAccountId()) {
            headers['rokt-account-id'] = this.store.getRoktAccountId();
        }

        return headers as IFetchPayload['headers'];
    }
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