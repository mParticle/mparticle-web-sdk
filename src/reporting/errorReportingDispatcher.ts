import { IErrorReportingService, ISDKError } from './types';

export class ErrorReportingDispatcher implements IErrorReportingService {
    private services: IErrorReportingService[] = [];

    public register(service: IErrorReportingService): void {
        this.services.push(service);
    }

    public report(error: ISDKError): void {
        this.services.forEach(s => {
            try {
                s.report(error);
            } catch (e) {
                // Prevent one service from breaking others
            }
        });
    }
}
