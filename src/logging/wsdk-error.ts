import { ErrorCodes } from "./errorCodes";

export type WSDKErrorSeverity = (typeof WSDKErrorSeverity)[keyof typeof WSDKErrorSeverity];
export const WSDKErrorSeverity = {
  ERROR: 'ERROR',
  INFO: 'INFO',
  WARNING: 'WARNING',
} as const;

export interface IWSDKError {
    additionalInformation: {
        message: string;
        version: string;
    };
    severity: WSDKErrorSeverity;
    code: ErrorCodes;
    url: string;
    deviceInfo: string;
    stackTrace: string;
    reporter: string;
    integration: string;
}