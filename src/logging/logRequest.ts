import { ErrorCodes } from "./errorCodes";
export type ErrorCode = ErrorCodes | string;

export type WSDKErrorSeverity = (typeof WSDKErrorSeverity)[keyof typeof WSDKErrorSeverity];
export const WSDKErrorSeverity = {
  ERROR: 'ERROR',
  INFO: 'INFO',
  WARNING: 'WARNING',
} as const;


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