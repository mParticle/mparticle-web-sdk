import { SDKLoggerApi } from '../sdkRuntimeModels';
import { IErrorReportingService, ISDKError } from './types';

// Reports made before any service registers wait for the first one, up to this
// many. Init can report before the forwarders, the Rokt kit's reporting among
// them, have started.
const MAX_PENDING_REPORTS = 10;

export class ErrorReportingDispatcher implements IErrorReportingService {
    private readonly services: IErrorReportingService[] = [];
    private pending: ISDKError[] = [];
    public logger?: SDKLoggerApi;

    public register(service: IErrorReportingService): void {
        this.services.push(service);
        const pending = this.pending;
        this.pending = [];
        pending.forEach(error => this.reportTo(service, error));
    }

    public report(error: ISDKError): void {
        if (!this.services.length) {
            if (this.pending.length < MAX_PENDING_REPORTS) {
                this.pending.push(error);
            }
            return;
        }
        this.services.forEach(s => this.reportTo(s, error));
    }

    private reportTo(service: IErrorReportingService, error: ISDKError): void {
        try {
            service.report(error);
        } catch (e) {
            this.logger?.error('Error in ErrorReportingService: ' + e);
        }
    }
}
