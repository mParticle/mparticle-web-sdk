
import { ErrorCodes } from "./errorCodes";
import { IWSDKError, WSDKErrorSeverity } from "./wsdk-error";
import { FetchUploader, XHRUploader } from "../uploaders";

export interface IReportingLogger {
    error(msg: string, code?: ErrorCodes, stackTrace?: string): void;
    warning(msg: string, code?: ErrorCodes): void;
}

export class ReportingLogger implements IReportingLogger {
    private readonly isEnabled: boolean;
    private readonly reporter: string = 'mp-wsdk';
    private readonly integration: string = 'mp-wsdk';
    private readonly rateLimiter: IRateLimiter;
    
    constructor(
        private baseUrl: string,
        private readonly sdkVersion: string,
        private readonly accountId: string,
        private readonly roktLauncherInstanceGuid: string,
        rateLimiter?: IRateLimiter,
    ) {
        this.isEnabled = this.isReportingEnabled();
        this.rateLimiter = rateLimiter ?? new RateLimiter();
    }

    public error(msg: string, code: ErrorCodes, stackTrace?: string) {
        this.sendLog(WSDKErrorSeverity.ERROR, msg, code, stackTrace);
    };

    public warning(msg: string, code: ErrorCodes) { 
        this.sendLog(WSDKErrorSeverity.WARNING, msg, code);
    };
    
    private sendLog(
        severity: WSDKErrorSeverity,
        msg: string,
        code: ErrorCodes,
        stackTrace?: string
    ): void {
        if(!this.canSendLog(severity))
            return;

        const wsdkError: IWSDKError = {
            additionalInformation: {
                message: msg,
                version: this.sdkVersion,
            },
            severity: severity,
            code: code,
            url: window?.location?.href,
            deviceInfo: window?.navigator?.userAgent,
            stackTrace: stackTrace ?? '',
            reporter: this.reporter,
            integration: this.integration,
        };
        
        this.sendLogToServer(wsdkError);
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
    
    private canSendLog(severity: WSDKErrorSeverity): boolean {
        return this.isEnabled && !this.isRateLimited(severity);
    }

    private isRateLimited(severity: WSDKErrorSeverity): boolean {
        return this.rateLimiter.incrementAndCheck(severity);
    }

    private sendLogToServer(wsdkError: IWSDKError) {
        const uploadUrl = `${this.baseUrl}/v1/log`;
        const uploader = window.fetch
            ? new FetchUploader(uploadUrl)
            : new XHRUploader(uploadUrl);

        const headers = {
            Accept: 'text/plain;charset=UTF-8',
            'Content-Type': 'text/plain;charset=UTF-8',
            'rokt-launcher-instance-guid': this.roktLauncherInstanceGuid,
        };

        if (this.accountId) {
            headers['rokt-account-id'] = this.accountId;
        }

        uploader.upload({
            headers: headers,
            method: 'POST',
            body: JSON.stringify(wsdkError),
        });
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