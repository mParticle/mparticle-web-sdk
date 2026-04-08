import { SDKLoggerApi } from '../sdkRuntimeModels';
import { IErrorReportingService, ISDKError } from './types';
export declare class ErrorReportingDispatcher implements IErrorReportingService {
    private readonly services;
    logger?: SDKLoggerApi;
    register(service: IErrorReportingService): void;
    report(error: ISDKError): void;
}
