import { ErrorCodes, LogRequestBody, WSDKErrorSeverity } from "./types";
import { FetchUploader, IFetchPayload } from "../uploaders";
import { IStore, SDKConfig } from "../store";
import { SDKInitConfig } from "../sdkRuntimeModels";
import Constants from "../constants";

// Header key constants
const HEADER_ACCEPT = 'Accept' as const;
const HEADER_CONTENT_TYPE = 'Content-Type' as const;
const HEADER_ROKT_LAUNCHER_VERSION = 'rokt-launcher-version' as const;
const HEADER_ROKT_LAUNCHER_INSTANCE_GUID = 'rokt-launcher-instance-guid' as const;
const HEADER_ROKT_WSDK_VERSION = 'rokt-wsdk-version' as const;

interface IReportingLoggerPayload extends IFetchPayload {
    headers: IFetchPayload['headers'] & {
        [HEADER_ROKT_LAUNCHER_INSTANCE_GUID]?: string;
        [HEADER_ROKT_LAUNCHER_VERSION]: string;
        [HEADER_ROKT_WSDK_VERSION]: string;
    };
    body: string;
}

export class ReportingLogger {
    private readonly isEnabled: boolean;
    private readonly reporter: string = 'mp-wsdk';
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
        this.loggingUrl = `https://${config.loggingUrl || Constants.DefaultBaseUrls.loggingUrl}`;
        this.errorUrl = `https://${config.errorUrl || Constants.DefaultBaseUrls.errorUrl}`;
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
        if (!this.canSendLog(severity))
            return;

        try {
            const logRequest = this.buildLogRequest(severity, msg, code, stackTrace);
            const uploader = new FetchUploader(url);
            const payload: IReportingLoggerPayload = {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(logRequest),
            };
            uploader.upload(payload).catch((error) => {
                console.error('ReportingLogger: Failed to send log', error);
            });
        } catch (error) {
            console.error('ReportingLogger: Failed to send log', error);
        }
    }

    private sendLog(severity: WSDKErrorSeverity, msg: string, code?: ErrorCodes, stackTrace?: string): void {
        this.sendToServer(this.loggingUrl, severity, msg, code, stackTrace);
    }

    private sendError(severity: WSDKErrorSeverity, msg: string, code?: ErrorCodes, stackTrace?: string): void {
        this.sendToServer(this.errorUrl, severity, msg, code, stackTrace);
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
            stackTrace: stackTrace,
            reporter: this.reporter,
            // Integration will be set to integrationName once the kit connects via RoktManager.attachKit()
            integration: this.store?.getIntegrationName() ?? 'mp-wsdk'
        };
    }

    private getVersion(): string {
        return this.store?.getIntegrationName?.() ?? `mParticle_wsdkv_${this.sdkVersion}`;
    }
    
    private isReportingEnabled(): boolean {
        return this.isDebugModeEnabled() ||
               (this.isRoktDomainPresent() && this.isFeatureFlagEnabled());
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

    private getHeaders(): IReportingLoggerPayload['headers'] {
        const headers: IReportingLoggerPayload['headers'] = {
            [HEADER_ACCEPT]: 'text/plain;charset=UTF-8',
            [HEADER_CONTENT_TYPE]: 'application/json',
            [HEADER_ROKT_LAUNCHER_VERSION]: this.getVersion(),
            [HEADER_ROKT_WSDK_VERSION]: 'joint',
        };

        if (this.launcherInstanceGuid) {
            headers[HEADER_ROKT_LAUNCHER_INSTANCE_GUID] = this.launcherInstanceGuid;
        }

        const accountId = this.store?.getRoktAccountId?.();
        if (accountId) {
            headers['rokt-account-id'] = accountId;
        }

        return headers;
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
