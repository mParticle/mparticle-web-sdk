import { ErrorCodes } from "./errorCodes";

export enum LogRequestSeverity {
    Error = 'error',
    Warning = 'warning',
    Info = 'info',
}

export interface LogRequest {
    additionalInformation: {
        message: string;
        version: string;
    };
    severity: LogRequestSeverity;
    code: ErrorCodes;
    url: string;
    deviceInfo: string;
    stackTrace: string;
    reporter: string;
    integration: string;
}