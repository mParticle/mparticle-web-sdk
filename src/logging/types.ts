import { valueof } from '../utils';

export const ErrorCodes = {
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    UNHANDLED_EXCEPTION: 'UNHANDLED_EXCEPTION',
    IDENTITY_REQUEST: 'IDENTITY_REQUEST',
} as const;

export type ErrorCodes = valueof<typeof ErrorCodes>;

export type ErrorCode = ErrorCodes | string;

export const WSDKErrorSeverity = {
    ERROR: 'ERROR',
    INFO: 'INFO',
    WARNING: 'WARNING',
} as const;

export type WSDKErrorSeverity = (typeof WSDKErrorSeverity)[keyof typeof WSDKErrorSeverity];

export type ErrorsRequestBody = {
    additionalInformation?: Record<string, string>;
    code: ErrorCode;
    severity: WSDKErrorSeverity;
    stackTrace?: string;
    deviceInfo?: string;
    integration?: string;
    reporter?: string;
    url?: string;
};

export type LogRequestBody = ErrorsRequestBody;
