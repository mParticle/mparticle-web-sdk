import { ErrorCodes, LogRequestBody, WSDKErrorSeverity } from "./types";
import { FetchUploader, IFetchPayload } from "../uploaders";
import { IStore, SDKConfig } from "../store";
import { SDKInitConfig } from "../sdkRuntimeModels";

export class ReportingLogger {
    private readonly isEnabled: boolean;
    private readonly reporter: string = 'mp-wsdk';
    private readonly integration: string = 'mp-wsdk';
    private readonly rateLimiter: IRateLimiter;
    private store: IStore | null;
    private readonly loggingUrl: string;
    private readonly errorUrl: string;
    private readonly isWebSdkLoggingEnabled: boolean;

    constructor(
        config: SDKConfig | SDKInitConfig | any,
        private readonly sdkVersion: string,
        store?: IStore,
        private readonly launcherInstanceGuid?: string,
        rateLimiter?: IRateLimiter,
    ) {
        this.loggingUrl = config.loggingUrl || 'jssdkcdns.mparticle.com/v1/JS/logs';
        this.errorUrl = config.errorUrl || 'jssdkcdns.mparticle.com/v1/JS/errors';
        this.isWebSdkLoggingEnabled = config.isWebSdkLoggingEnabled || false;
        this.store = store ?? null;
        this.isEnabled = this.isReportingEnabled();
        this.rateLimiter = rateLimiter ?? new RateLimiter();
    }

    public setStore(store: IStore): void {
        this.store = store;
    }

    public info(msg: string, code?: ErrorCodes) {
        this.sendLog(WSDKErrorSeverity.INFO, msg, code);
    }

    public error(msg: string, code?: ErrorCodes, stackTrace?: string) {
        this.sendError(WSDKErrorSeverity.ERROR, msg, code, stackTrace);
    }

    public warning(msg: string, code?: ErrorCodes) { 
        this.sendError(WSDKErrorSeverity.WARNING, msg, code);
    }
    
    private sendToServer(url: string, severity: WSDKErrorSeverity, msg: string, code?: ErrorCodes, stackTrace?: string): void {
        if(!this.canSendLog(severity))
            return;

        const logRequest = this.buildLogRequest(severity, msg, code, stackTrace);
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
    
    private buildLogRequest(severity: WSDKErrorSeverity, msg: string, code?: ErrorCodes, stackTrace?: string): LogRequestBody {
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
        return this.store?.getIntegrationName?.() ?? `mParticle_wsdkv_${this.sdkVersion}`;
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
        return typeof window !== 'undefined' && Boolean(window['ROKT_DOMAIN']);
    }

    private isFeatureFlagEnabled = (): boolean => this.isWebSdkLoggingEnabled;

    private isDebugModeEnabled(): boolean {
        return (
            typeof window !== 'undefined' &&
            (window.
                location?.
                search?.
                toLowerCase()?.
                includes('mp_enable_logging=true') ?? false)
        );
    }

    private canSendLog(severity: WSDKErrorSeverity): boolean {
        return this.isEnabled && !this.isRateLimited(severity);
    }

    private isRateLimited(severity: WSDKErrorSeverity): boolean {
        return this.rateLimiter.incrementAndCheck(severity);
    }

    private getUrl(): string | undefined {
        return typeof window !== 'undefined' ? window.location?.href : undefined;
    }

    private getUserAgent(): string | undefined {
        return typeof window !== 'undefined' ? window.navigator?.userAgent : undefined;
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

        const accountId = this.store?.getRoktAccountId?.();
        if (accountId) {
            headers['rokt-account-id'] = accountId;
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
