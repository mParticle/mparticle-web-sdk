import { SDKLoggerApi } from '../sdkRuntimeModels';
import { ILoggingService, ISDKLogEntry } from './types';
export declare class LoggingDispatcher implements ILoggingService {
    private readonly services;
    logger?: SDKLoggerApi;
    register(service: ILoggingService): void;
    log(entry: ISDKLogEntry): void;
}
