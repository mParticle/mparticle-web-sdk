import { ErrorReportingDispatcher } from '../../src/reporting/errorReportingDispatcher';
import { ISDKError, WSDKErrorSeverity } from '../../src/reporting/types';

const report = (message: string): ISDKError => ({ message, severity: WSDKErrorSeverity.WARNING });

describe('ErrorReportingDispatcher', () => {
    it('hands reports made before any service registers to the first one, once', () => {
        const dispatcher = new ErrorReportingDispatcher();
        dispatcher.report(report('early'));
        const first = { report: jest.fn() };
        const second = { report: jest.fn() };

        dispatcher.register(first);
        dispatcher.register(second);

        expect(first.report.mock.calls).toEqual([[report('early')]]);
        expect(second.report).not.toHaveBeenCalled();
    });

    it('holds at most ten reports', () => {
        const dispatcher = new ErrorReportingDispatcher();
        for (let i = 0; i < 12; i++) dispatcher.report(report(String(i)));
        const service = { report: jest.fn() };

        dispatcher.register(service);

        expect(service.report).toHaveBeenCalledTimes(10);
        expect(service.report.mock.calls[9][0].message).toBe('9');
    });

    it('reports to every registered service and logs a service that throws', () => {
        const dispatcher = new ErrorReportingDispatcher();
        dispatcher.logger = { error: jest.fn() } as any;
        const failing = { report: () => { throw new Error('down'); } };
        const working = { report: jest.fn() };
        dispatcher.register(failing);
        dispatcher.register(working);

        dispatcher.report(report('late'));

        expect(working.report).toHaveBeenCalledWith(report('late'));
        expect(dispatcher.logger.error).toHaveBeenCalledWith('Error in ErrorReportingService: Error: down');
    });
});
