import { valueof } from '../utils';

export const ErrorCodes = {
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    UNHANDLED_EXCEPTION: 'UNHANDLED_EXCEPTION',
    IDENTITY_REQUEST: 'IDENTITY_REQUEST',
    IDENTITY_MISMATCH: 'IDENTITY_MISMATCH',
    ROKT_KIT_ATTACHED: 'ROKT_KIT_ATTACHED',
} as const;

export type ErrorCodes = valueof<typeof ErrorCodes>;

export type ErrorCode = ErrorCodes | string;

export const WSDKErrorSeverity = {
    ERROR: 'ERROR',
    INFO: 'INFO',
    WARNING: 'WARNING',
} as const;

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
