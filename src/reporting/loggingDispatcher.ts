import { SDKLoggerApi } from '../sdkRuntimeModels';
import { ILoggingService, ISDKLogEntry } from './types';

export class LoggingDispatcher implements ILoggingService {
    private services: ILoggingService[] = [];
    public logger?: SDKLoggerApi;

    public register(service: ILoggingService): void {
        this.services.push(service);
    }

    public log(entry: ISDKLogEntry): void {
        this.services.forEach(s => {
            try {
                s.log(entry);
            } catch (e) {
                this.logger?.error('Error in LoggingService: ' + e);
            }
        });
    }
}
