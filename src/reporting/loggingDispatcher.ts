import { ILoggingService, ISDKLogEntry } from './types';

export class LoggingDispatcher implements ILoggingService {
    private services: ILoggingService[] = [];

    public register(service: ILoggingService): void {
        this.services.push(service);
    }

    public log(entry: ISDKLogEntry): void {
        this.services.forEach(s => s.log(entry));
    }
}
