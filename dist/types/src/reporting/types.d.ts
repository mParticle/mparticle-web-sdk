import { valueof } from '../utils';
export declare const ErrorCodes: {
    readonly UNKNOWN_ERROR: "UNKNOWN_ERROR";
    readonly UNHANDLED_EXCEPTION: "UNHANDLED_EXCEPTION";
    readonly IDENTITY_REQUEST: "IDENTITY_REQUEST";
    readonly IDENTITY_MISMATCH: "IDENTITY_MISMATCH";
    readonly ROKT_KIT_ATTACHED: "ROKT_KIT_ATTACHED";
};
export type ErrorCodes = valueof<typeof ErrorCodes>;
export declare const WSDKErrorSeverity: {
    readonly ERROR: "ERROR";
    readonly INFO: "INFO";
    readonly WARNING: "WARNING";
};
export type WSDKErrorSeverity = (typeof WSDKErrorSeverity)[keyof typeof WSDKErrorSeverity];
/** Structured error object for reporting. */
export interface ISDKError {
    message: string;
    code?: ErrorCodes;
    severity: WSDKErrorSeverity;
    stackTrace?: string;
    additionalInformation?: Record<string, string>;
}
/** Structured log entry for informational logging. */
export interface ISDKLogEntry {
    message: string;
    code?: ErrorCodes;
    additionalInformation?: Record<string, string>;
}
/** Contract for error/warning reporting services. */
export interface IErrorReportingService {
    report(error: ISDKError): void;
}
/** Contract for informational logging services. */
export interface ILoggingService {
    log(entry: ISDKLogEntry): void;
}
