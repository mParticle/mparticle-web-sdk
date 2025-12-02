import { Logger, ConsoleLogger } from '../../src/logger';
import { LogLevelType } from '../../src/sdkRuntimeModels';
import { IReportingLogger } from '../../src/logging/reportingLogger';
import { ErrorCodes } from '../../src/logging/errorCodes';

describe('Logger', () => {
    let mockConsole: any;
    let logger: Logger;
    let mockReportingLogger: IReportingLogger;

    beforeEach(() => {
        mockConsole = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };
        (global as any).console = mockConsole;
        
        mockReportingLogger = {
            error: jest.fn(),
            warning: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should call verbose, warning, and error methods on ConsoleLogger at correct log levels', () => {
        logger = new Logger({ logLevel: LogLevelType.Verbose }, mockReportingLogger);

        logger.verbose('message1');
        logger.warning('message2', ErrorCodes.UNHANDLED_EXCEPTION);
        logger.error('message3', ErrorCodes.API_CLIENT_ERROR);

        expect(mockConsole.info).toHaveBeenCalledWith('message1');
        expect(mockConsole.warn).toHaveBeenCalledWith('message2');
        expect(mockConsole.error).toHaveBeenCalledWith('message3');
        expect(mockReportingLogger.warning).toHaveBeenCalledWith('message2', ErrorCodes.UNHANDLED_EXCEPTION);
        expect(mockReportingLogger.error).toHaveBeenCalledWith('message3', ErrorCodes.API_CLIENT_ERROR);
    });

    it('should only call warning and error at warning log level', () => {
        logger = new Logger({ logLevel: LogLevelType.Warning }, mockReportingLogger);

        logger.verbose('message1');
        logger.warning('message2', ErrorCodes.IDENTITY_ERROR);
        logger.error('message3', ErrorCodes.BATCH_UPLOADER_ERROR);

        expect(mockConsole.info).not.toHaveBeenCalled();
        expect(mockConsole.warn).toHaveBeenCalledWith('message2');
        expect(mockConsole.error).toHaveBeenCalledWith('message3');
        expect(mockReportingLogger.warning).toHaveBeenCalledWith('message2', ErrorCodes.IDENTITY_ERROR);
        expect(mockReportingLogger.error).toHaveBeenCalledWith('message3', ErrorCodes.BATCH_UPLOADER_ERROR);
    });

    it('should not call any log methods at none log level', () => {
        logger = new Logger({ logLevel: LogLevelType.None }, mockReportingLogger);

        logger.verbose('message1');
        logger.warning('message2');
        logger.error('message3');

        expect(mockConsole.info).not.toHaveBeenCalled();
        expect(mockConsole.warn).not.toHaveBeenCalled();
        expect(mockConsole.error).not.toHaveBeenCalled();
        expect(mockReportingLogger.warning).not.toHaveBeenCalled();
        expect(mockReportingLogger.error).not.toHaveBeenCalled();
    });

    it('should only call error at error log level', () => {  
        logger = new Logger({ logLevel: LogLevelType.Error }, mockReportingLogger);  
    
        logger.verbose('message1');  
        logger.warning('message2', ErrorCodes.CONSENT_ERROR);  
        logger.error('message3', ErrorCodes.PERSISTENCE_ERROR);  
    
        expect(mockConsole.info).not.toHaveBeenCalled();  
        expect(mockConsole.warn).not.toHaveBeenCalled();  
        expect(mockConsole.error).toHaveBeenCalledWith('message3');
        expect(mockReportingLogger.warning).not.toHaveBeenCalled();
        expect(mockReportingLogger.error).toHaveBeenCalledWith('message3', ErrorCodes.PERSISTENCE_ERROR);
    });

    it('should allow providing a custom logger', () => {
        const customLogger = {
            verbose: jest.fn(),
            warning: jest.fn(),
            error: jest.fn()
        };

        logger = new Logger({ logLevel: 'verbose' as any, logger: customLogger }, mockReportingLogger);

        logger.verbose('test-verbose');
        logger.warning('test-warning', ErrorCodes.ECOMMERCE_ERROR);
        logger.error('test-error', ErrorCodes.EVENTS_ERROR);

        expect(customLogger.verbose).toHaveBeenCalledWith('test-verbose');
        expect(customLogger.warning).toHaveBeenCalledWith('test-warning');
        expect(customLogger.error).toHaveBeenCalledWith('test-error');
        expect(mockReportingLogger.warning).toHaveBeenCalledWith('test-warning', ErrorCodes.ECOMMERCE_ERROR);
        expect(mockReportingLogger.error).toHaveBeenCalledWith('test-error', ErrorCodes.EVENTS_ERROR);
    });

    it('should change log level with setLogLevel', () => {
        logger = new Logger({ logLevel: 'none' as any }, mockReportingLogger);

        logger.verbose('one');
        logger.warning('two', ErrorCodes.FORWARDERS_ERROR);
        logger.error('three', ErrorCodes.HELPERS_CALLBACK_ERROR);
        expect(mockConsole.info).not.toHaveBeenCalled();
        expect(mockConsole.warn).not.toHaveBeenCalled();
        expect(mockConsole.error).not.toHaveBeenCalled();
        expect(mockReportingLogger.warning).not.toHaveBeenCalled();
        expect(mockReportingLogger.error).not.toHaveBeenCalled();

        logger.setLogLevel('verbose' as any);

        logger.verbose('a');
        logger.warning('b', ErrorCodes.STORE);
        logger.error('c', ErrorCodes.VAULT_ERROR);
        expect(mockConsole.info).toHaveBeenCalledWith('a');
        expect(mockConsole.warn).toHaveBeenCalledWith('b');
        expect(mockConsole.error).toHaveBeenCalledWith('c');
        expect(mockReportingLogger.warning).toHaveBeenCalledWith('b', ErrorCodes.STORE);
        expect(mockReportingLogger.error).toHaveBeenCalledWith('c', ErrorCodes.VAULT_ERROR);
    });
});

describe('ConsoleLogger', () => {
    let mockConsole: any;
    let consoleLogger: ConsoleLogger;

    beforeEach(() => {
        mockConsole = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };
        (global as any).console = mockConsole;
        consoleLogger = new ConsoleLogger();
    });

    it('should use console.info for verbose', () => {
        consoleLogger.verbose('hi');
        expect(mockConsole.info).toHaveBeenCalledWith('hi');
    });

    it('should use console.warn for warning', () => {
        consoleLogger.warning('warn msg');
        expect(mockConsole.warn).toHaveBeenCalledWith('warn msg');
    });

    it('should use console.error for error', () => {
        consoleLogger.error('err');
        expect(mockConsole.error).toHaveBeenCalledWith('err');
    });
});
