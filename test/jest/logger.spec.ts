import { Logger, ConsoleLogger } from '../../src/logger';
import { LogLevelType } from '../../src/sdkRuntimeModels';

describe('Logger', () => {
    let mockConsole: any;
    let logger: Logger;

    beforeEach(() => {
        mockConsole = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };
        (global as any).console = mockConsole;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should call verbose, warning, and error methods on ConsoleLogger at correct log levels', () => {
        logger = new Logger({ logLevel: LogLevelType.Verbose });

        logger.verbose('message1');
        logger.warning('message2');
        logger.error('message3');

        expect(mockConsole.info).toHaveBeenCalledWith('message1');
        expect(mockConsole.warn).toHaveBeenCalledWith('message2');
        expect(mockConsole.error).toHaveBeenCalledWith('message3');
    });

    it('should only call warning and error at warning log level', () => {
        logger = new Logger({ logLevel: LogLevelType.Warning });

        logger.verbose('message1');
        logger.warning('message2');
        logger.error('message3');

        expect(mockConsole.info).not.toHaveBeenCalled();
        expect(mockConsole.warn).toHaveBeenCalledWith('message2');
        expect(mockConsole.error).toHaveBeenCalledWith('message3');
    });

    it('should not call any log methods at none log level', () => {
        logger = new Logger({ logLevel: LogLevelType.None });

        logger.verbose('message1');
        logger.warning('message2');
        logger.error('message3');

        expect(mockConsole.info).not.toHaveBeenCalled();
        expect(mockConsole.warn).not.toHaveBeenCalled();
        expect(mockConsole.error).not.toHaveBeenCalled();
    });

    it('should only call error at error log level', () => {  
        logger = new Logger({ logLevel: LogLevelType.Error });  
    
        logger.verbose('message1');  
        logger.warning('message2');  
        logger.error('message3');  
    
        expect(mockConsole.info).not.toHaveBeenCalled();  
        expect(mockConsole.warn).not.toHaveBeenCalled();  
        expect(mockConsole.error).toHaveBeenCalledWith('message3');  
    });

    it('should allow providing a custom logger', () => {
        const customLogger = {
            verbose: jest.fn(),
            warning: jest.fn(),
            error: jest.fn()
        };

        logger = new Logger({ logLevel: 'verbose' as any, logger: customLogger });

        logger.verbose('test-verbose');
        logger.warning('test-warning');
        logger.error('test-error');

        expect(customLogger.verbose).toHaveBeenCalledWith('test-verbose');
        expect(customLogger.warning).toHaveBeenCalledWith('test-warning');
        expect(customLogger.error).toHaveBeenCalledWith('test-error');
    });

    it('should change log level with setLogLevel', () => {
        logger = new Logger({ logLevel: 'none' as any });

        logger.verbose('one');
        logger.warning('two');
        logger.error('three');
        expect(mockConsole.info).not.toHaveBeenCalled();
        expect(mockConsole.warn).not.toHaveBeenCalled();
        expect(mockConsole.error).not.toHaveBeenCalled();

        logger.setLogLevel('verbose' as any);

        logger.verbose('a');
        logger.warning('b');
        logger.error('c');
        expect(mockConsole.info).toHaveBeenCalledWith('a');
        expect(mockConsole.warn).toHaveBeenCalledWith('b');
        expect(mockConsole.error).toHaveBeenCalledWith('c');
    });

    it('should return current log level from getLogLevel', () => {
        logger = new Logger({ logLevel: LogLevelType.Warning });
        expect(logger.getLogLevel()).toBe(LogLevelType.Warning);

        logger.setLogLevel(LogLevelType.Debug);
        expect(logger.getLogLevel()).toBe(LogLevelType.Debug);

        logger.setLogLevel(LogLevelType.Verbose);
        expect(logger.getLogLevel()).toBe(LogLevelType.Verbose);

        logger.setLogLevel(LogLevelType.None);
        expect(logger.getLogLevel()).toBe(LogLevelType.None);
    });

    it('should call verbose and warning at debug log level (same as verbose, for raw payload option)', () => {
        logger = new Logger({ logLevel: LogLevelType.Debug });

        logger.verbose('debug-verbose');
        logger.warning('debug-warning');
        logger.error('debug-error');

        expect(mockConsole.info).toHaveBeenCalledWith('debug-verbose');
        expect(mockConsole.warn).toHaveBeenCalledWith('debug-warning');
        expect(mockConsole.error).toHaveBeenCalledWith('debug-error');
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
