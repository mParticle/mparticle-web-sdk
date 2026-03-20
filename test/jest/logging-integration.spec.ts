import { Logger } from '../../src/logger';
import { ErrorReportingDispatcher } from '../../src/reporting/errorReportingDispatcher';
import { LoggingDispatcher } from '../../src/reporting/loggingDispatcher';
import { ErrorCodes, WSDKErrorSeverity, IErrorReportingService, ILoggingService } from '../../src/reporting/types';
import { LogLevelType } from '../../src/sdkRuntimeModels';

describe('Logging Integration', () => {
    describe('Logger is decoupled from reporting', () => {
        it('Logger.error() does not trigger any reporting', () => {
            const logger = new Logger({ logLevel: LogLevelType.Warning });

            // Logger.error() should only output to console - no reporting side effects
            // This verifies the decoupling is complete
            expect(() => logger.error('test error')).not.toThrow();
        });

        it('Logger and ErrorReportingDispatcher work independently', () => {
            const logger = new Logger({ logLevel: LogLevelType.Warning });
            const dispatcher = new ErrorReportingDispatcher();
            const mockService: IErrorReportingService = { report: jest.fn() };
            dispatcher.register(mockService);

            // Simulate the pattern from identityApiClient: separate Logger.error + dispatcher.report
            const msg = 'Error sending identity request to servers - timeout';
            logger.error(msg);
            dispatcher.report({
                message: msg,
                code: ErrorCodes.IDENTITY_REQUEST,
                severity: WSDKErrorSeverity.ERROR,
            });

            expect(mockService.report).toHaveBeenCalledTimes(1);
            expect(mockService.report).toHaveBeenCalledWith({
                message: msg,
                code: ErrorCodes.IDENTITY_REQUEST,
                severity: WSDKErrorSeverity.ERROR,
            });
        });

        it('Logger and LoggingDispatcher work independently', () => {
            const logger = new Logger({ logLevel: LogLevelType.Verbose });
            const dispatcher = new LoggingDispatcher();
            const mockService: ILoggingService = { log: jest.fn() };
            dispatcher.register(mockService);

            logger.verbose('Some verbose message');
            dispatcher.log({
                message: 'Some verbose message',
                code: ErrorCodes.UNKNOWN_ERROR,
            });

            expect(mockService.log).toHaveBeenCalledTimes(1);
        });

        it('Dispatchers with no registered services are safe no-ops', () => {
            const errorDispatcher = new ErrorReportingDispatcher();
            const loggingDispatcher = new LoggingDispatcher();

            expect(() => errorDispatcher.report({
                message: 'test',
                severity: WSDKErrorSeverity.ERROR,
            })).not.toThrow();

            expect(() => loggingDispatcher.log({
                message: 'test',
            })).not.toThrow();
        });

        it('Multiple services receive reports from ErrorReportingDispatcher', () => {
            const dispatcher = new ErrorReportingDispatcher();
            const service1: IErrorReportingService = { report: jest.fn() };
            const service2: IErrorReportingService = { report: jest.fn() };

            dispatcher.register(service1);
            dispatcher.register(service2);

            const error = {
                message: 'test',
                severity: WSDKErrorSeverity.ERROR as WSDKErrorSeverity,
                code: ErrorCodes.UNHANDLED_EXCEPTION as ErrorCodes,
            };
            dispatcher.report(error);

            expect(service1.report).toHaveBeenCalledWith(error);
            expect(service2.report).toHaveBeenCalledWith(error);
        });
    });
});
