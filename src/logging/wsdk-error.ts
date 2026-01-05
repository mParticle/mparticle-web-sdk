import { ErrorCodes } from "./errorCodes";

export type WSDKErrorSeverity = (typeof WSDKErrorSeverity)[keyof typeof WSDKErrorSeverity];
export const WSDKErrorSeverity = {
  ERROR: 'ERROR',
  INFO: 'INFO',
  WARNING: 'WARNING',
} as const;

export interface IWSDKError {
  name: string;
  message: string;
  stack?: string;
  code?: ErrorCodes;
  reporter?: string;
  integration?: string;
  severity?: WSDKErrorSeverity;
  additionalInformation?: Record<string, string>;
  handled?: boolean;
}