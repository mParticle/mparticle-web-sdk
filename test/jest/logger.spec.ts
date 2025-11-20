import Logger, { ConsoleLogger } from '../../src/logger';

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
        logger = new Logger({ logLevel: 'verbose' as any });

        logger.verbose('message1');
        logger.warning('message2');
        logger.error('message3');

        expect(mockConsole.info).toHaveBeenCalledWith('message1');
        expect(mockConsole.warn).toHaveBeenCalledWith('message2');
        expect(mockConsole.error).toHaveBeenCalledWith('message3');
    });

    it('should only call warning and error at warning log level', () => {
        logger = new Logger({ logLevel: 'warning' as any });

        logger.verbose('message1');
        logger.warning('message2');
        logger.error('message3');

        expect(mockConsole.info).not.toHaveBeenCalled();
        expect(mockConsole.warn).toHaveBeenCalledWith('message2');
        expect(mockConsole.error).toHaveBeenCalledWith('message3');
    });

    it('should only call error at none log level', () => {
        logger = new Logger({ logLevel: 'none' as any });

        logger.verbose('message1');
        logger.warning('message2');
        logger.error('message3');

        expect(mockConsole.info).not.toHaveBeenCalled();
        expect(mockConsole.warn).not.toHaveBeenCalled();
        expect(mockConsole.error).not.toHaveBeenCalled();
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
