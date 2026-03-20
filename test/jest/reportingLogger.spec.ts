import { ErrorReportingDispatcher } from '../../src/reporting/errorReportingDispatcher';
import { LoggingDispatcher } from '../../src/reporting/loggingDispatcher';
import { IErrorReportingService, ILoggingService, ISDKError, ISDKLogEntry, WSDKErrorSeverity, ErrorCodes } from '../../src/reporting/types';

describe('ErrorReportingDispatcher', () => {
    let dispatcher: ErrorReportingDispatcher;

    beforeEach(() => {
        dispatcher = new ErrorReportingDispatcher();
    });

    it('report() is a no-op when no services are registered', () => {
        // Should not throw
        dispatcher.report({
            message: 'test',
            severity: WSDKErrorSeverity.ERROR,
        });
    });

    it('register() adds a service and report() fans out to it', () => {
        const mockService: IErrorReportingService = {
            report: jest.fn(),
        };

        dispatcher.register(mockService);

        const error: ISDKError = {
            message: 'test error',
            code: ErrorCodes.UNHANDLED_EXCEPTION,
            severity: WSDKErrorSeverity.ERROR,
            stackTrace: 'stack',
        };

        dispatcher.report(error);

        expect(mockService.report).toHaveBeenCalledTimes(1);
        expect(mockService.report).toHaveBeenCalledWith(error);
    });

    it('report() fans out to all registered services', () => {
        const service1: IErrorReportingService = { report: jest.fn() };
        const service2: IErrorReportingService = { report: jest.fn() };
        const service3: IErrorReportingService = { report: jest.fn() };

        dispatcher.register(service1);
        dispatcher.register(service2);
        dispatcher.register(service3);

        const error: ISDKError = {
            message: 'broadcast error',
            severity: WSDKErrorSeverity.WARNING,
        };

        dispatcher.report(error);

        expect(service1.report).toHaveBeenCalledWith(error);
        expect(service2.report).toHaveBeenCalledWith(error);
        expect(service3.report).toHaveBeenCalledWith(error);
    });

    it('passes additionalInformation through to services', () => {
        const mockService: IErrorReportingService = { report: jest.fn() };
        dispatcher.register(mockService);

        const error: ISDKError = {
            message: 'test',
            severity: WSDKErrorSeverity.ERROR,
            additionalInformation: { key: 'value' },
        };

        dispatcher.report(error);

        expect(mockService.report).toHaveBeenCalledWith(error);
    });
});

describe('LoggingDispatcher', () => {
    let dispatcher: LoggingDispatcher;

    beforeEach(() => {
        dispatcher = new LoggingDispatcher();
    });

    it('log() is a no-op when no services are registered', () => {
        // Should not throw
        dispatcher.log({
            message: 'test',
        });
    });

    it('register() adds a service and log() fans out to it', () => {
        const mockService: ILoggingService = {
            log: jest.fn(),
        };

        dispatcher.register(mockService);

        const entry: ISDKLogEntry = {
            message: 'test log',
            code: ErrorCodes.IDENTITY_REQUEST,
        };

        dispatcher.log(entry);

        expect(mockService.log).toHaveBeenCalledTimes(1);
        expect(mockService.log).toHaveBeenCalledWith(entry);
    });

    it('log() fans out to all registered services', () => {
        const service1: ILoggingService = { log: jest.fn() };
        const service2: ILoggingService = { log: jest.fn() };

        dispatcher.register(service1);
        dispatcher.register(service2);

        const entry: ISDKLogEntry = {
            message: 'broadcast log',
            additionalInformation: { detail: 'info' },
        };

        dispatcher.log(entry);

        expect(service1.log).toHaveBeenCalledWith(entry);
        expect(service2.log).toHaveBeenCalledWith(entry);
    });
});
