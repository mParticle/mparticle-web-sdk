import { Logger, ConsoleLogger } from '../../src/logger';
import { LogLevelType } from '../../src/sdkRuntimeModels';
import { ReportingLogger } from '../../src/logging/reportingLogger';
import { ErrorCodes } from '../../src/logging/types';

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

    it('should call verbose, warning, info, and error methods on ConsoleLogger at correct log levels', () => {
        logger = new Logger({ logLevel: LogLevelType.Verbose });

        logger.verbose('message1');
        logger.warning('message2');
        logger.error('message3');
        logger.info('message4');

        expect(mockConsole.info).toHaveBeenCalledWith('message1');
        expect(mockConsole.warn).toHaveBeenCalledWith('message2');
        expect(mockConsole.error).toHaveBeenCalledWith('message3');
        expect(mockConsole.info).toHaveBeenCalledWith('message4');
    });

    it('should only call warning, info, and error at warning log level', () => {
        logger = new Logger({ logLevel: LogLevelType.Warning });

        logger.verbose('message1');
        logger.warning('message2');
        logger.error('message3');
        logger.info('message4');

        expect(mockConsole.info).not.toHaveBeenCalledWith('message1');
        expect(mockConsole.warn).toHaveBeenCalledWith('message2');
        expect(mockConsole.error).toHaveBeenCalledWith('message3');
        expect(mockConsole.info).toHaveBeenCalledWith('message4');
    });

    it('should not call any log methods at none log level', () => {
        logger = new Logger({ logLevel: LogLevelType.None });

        logger.verbose('message1');
        logger.warning('message2');
        logger.error('message3');
        logger.info('message4');

        expect(mockConsole.info).not.toHaveBeenCalled();
        expect(mockConsole.warn).not.toHaveBeenCalled();
        expect(mockConsole.error).not.toHaveBeenCalled();
    });

    it('should only call error at error log level', () => {  
        logger = new Logger({ logLevel: LogLevelType.Error });  
    
        logger.verbose('message1');  
        logger.warning('message2');  
        logger.error('message3');  
        logger.info('message4');
    
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

    describe('ReportingLogger integration', () => {
        let mockReportingLogger: jest.Mocked<ReportingLogger>;

        beforeEach(() => {
            mockReportingLogger = {
                error: jest.fn(),
                warning: jest.fn(),
                info: jest.fn(),
                setStore: jest.fn(),
            } as any;
        });

        it('should call reportingLogger.error when error is called with error code', () => {
            logger = new Logger({ logLevel: LogLevelType.Verbose }, mockReportingLogger);

            logger.error('test error', ErrorCodes.UNHANDLED_EXCEPTION);

            expect(mockConsole.error).toHaveBeenCalledWith('test error');
            expect(mockReportingLogger.error).toHaveBeenCalledWith('test error', ErrorCodes.UNHANDLED_EXCEPTION);
        });

        it('should NOT call reportingLogger.error when error is called without error code', () => {
            logger = new Logger({ logLevel: LogLevelType.Verbose }, mockReportingLogger);

            logger.error('test error');

            expect(mockConsole.error).toHaveBeenCalledWith('test error');
            expect(mockReportingLogger.error).not.toHaveBeenCalled();
        });

        it('should NOT call reportingLogger.warning when warning is called without error code', () => {
            logger = new Logger({ logLevel: LogLevelType.Verbose }, mockReportingLogger);

            logger.warning('test warning');

            expect(mockConsole.warn).toHaveBeenCalledWith('test warning');
            expect(mockReportingLogger.warning).not.toHaveBeenCalled();
        });

        it('should call reportingLogger.warning when warning is called with error code', () => {
            logger = new Logger({ logLevel: LogLevelType.Verbose }, mockReportingLogger);

            logger.warning('test warning', ErrorCodes.IDENTITY_REQUEST);

            expect(mockConsole.warn).toHaveBeenCalledWith('test warning');
            expect(mockReportingLogger.warning).toHaveBeenCalledWith('test warning', ErrorCodes.IDENTITY_REQUEST);
        });

        it('should NOT call reportingLogger.warning when log level is None', () => {
            logger = new Logger({ logLevel: LogLevelType.None }, mockReportingLogger);

            logger.warning('test warning', ErrorCodes.IDENTITY_REQUEST);

            expect(mockConsole.warn).not.toHaveBeenCalled();
            expect(mockReportingLogger.warning).not.toHaveBeenCalled();
        });

        it('should call reportingLogger.warning at Warning log level', () => {
            logger = new Logger({ logLevel: LogLevelType.Warning }, mockReportingLogger);

            logger.warning('test warning', ErrorCodes.USER_ATTRIBUTE_ERROR);

            expect(mockConsole.warn).toHaveBeenCalledWith('test warning');
            expect(mockReportingLogger.warning).toHaveBeenCalledWith('test warning', ErrorCodes.USER_ATTRIBUTE_ERROR);
        });

        it('should call reportingLogger.info when info is called with error code', () => {
            logger = new Logger({ logLevel: LogLevelType.Verbose }, mockReportingLogger);

            logger.info('test info', ErrorCodes.ROKT_KIT_ATTACHED);

            expect(mockConsole.info).toHaveBeenCalledWith('test info');
            expect(mockReportingLogger.info).toHaveBeenCalledWith('test info', ErrorCodes.ROKT_KIT_ATTACHED);
        });

        it('should NOT call reportingLogger.info when info is called without error code', () => {
            logger = new Logger({ logLevel: LogLevelType.Verbose }, mockReportingLogger);

            logger.info('test info');

            expect(mockConsole.info).toHaveBeenCalledWith('test info');
            expect(mockReportingLogger.info).not.toHaveBeenCalled();
        });

        it('should NOT call reportingLogger.info when log level is None', () => {
            logger = new Logger({ logLevel: LogLevelType.None }, mockReportingLogger);

            logger.info('test info', ErrorCodes.ROKT_KIT_ATTACHED);

            expect(mockConsole.info).not.toHaveBeenCalledWith('test info');
            expect(mockReportingLogger.info).not.toHaveBeenCalled();
        });

        it('should call reportingLogger.info at Warning log level', () => {
            logger = new Logger({ logLevel: LogLevelType.Warning }, mockReportingLogger);

            logger.info('test info', ErrorCodes.ROKT_KIT_ATTACHED);

            expect(mockConsole.info).toHaveBeenCalledWith('test info');
            expect(mockReportingLogger.info).toHaveBeenCalledWith('test info', ErrorCodes.ROKT_KIT_ATTACHED);
        });

        it('should handle error() when ReportingLogger is missing', () => {
            logger = new Logger({ logLevel: LogLevelType.Verbose });

            expect(() => logger.error('test', ErrorCodes.UNKNOWN_ERROR)).not.toThrow();
            expect(mockConsole.error).toHaveBeenCalledWith('test');
        });

        it('should handle warning() when ReportingLogger is missing', () => {
            logger = new Logger({ logLevel: LogLevelType.Verbose });

            expect(() => logger.warning('test', ErrorCodes.IDENTITY_REQUEST)).not.toThrow();
            expect(mockConsole.warn).toHaveBeenCalledWith('test');
        });

        it('should handle info() gracefully when ReportingLogger is missing', () => {
            logger = new Logger({ logLevel: LogLevelType.Verbose });

            expect(() => logger.info('test', ErrorCodes.ROKT_KIT_ATTACHED)).not.toThrow();
            expect(mockConsole.info).toHaveBeenCalledWith('test');
        });

        it('should log warning if ReportingLogger.error() throws an error', () => {
            const throwingReportingLogger = {
                error: jest.fn().mockImplementation(() => { throw new Error('remote error'); }),
                warning: jest.fn(),
                info: jest.fn(),
                setStore: jest.fn(),
            } as any;
            logger = new Logger({ logLevel: LogLevelType.Verbose }, throwingReportingLogger);

            expect(() => logger.error('test error', ErrorCodes.UNKNOWN_ERROR)).not.toThrow();
            expect(mockConsole.error).toHaveBeenCalledWith('test error');
            expect(mockConsole.warn).toHaveBeenCalledWith(
                'ReportingLogger: Failed to send error log',
                expect.any(Error)
            );
        });

        it('should log warning if ReportingLogger.warning() throws an error', () => {
            const throwingReportingLogger = {
                error: jest.fn(),
                warning: jest.fn().mockImplementation(() => { throw new Error('remote warning'); }),
                info: jest.fn(),
                setStore: jest.fn(),
            } as any;
            logger = new Logger({ logLevel: LogLevelType.Verbose }, throwingReportingLogger);

            expect(() => logger.warning('test warning', ErrorCodes.IDENTITY_REQUEST)).not.toThrow();
            expect(mockConsole.warn).toHaveBeenCalledWith('test warning');
            expect(mockConsole.warn).toHaveBeenCalledWith(
                'ReportingLogger: Failed to send warning log',
                expect.any(Error)
            );
        });

        it('should log warning if ReportingLogger.info() throws an error', () => {
            const throwingReportingLogger = {
                error: jest.fn(),
                warning: jest.fn(),
                info: jest.fn().mockImplementation(() => { throw new Error('remote info'); }),
                setStore: jest.fn(),
            } as any;
            logger = new Logger({ logLevel: LogLevelType.Verbose }, throwingReportingLogger);

            expect(() => logger.info('test info', ErrorCodes.ROKT_KIT_ATTACHED)).not.toThrow();
            expect(mockConsole.info).toHaveBeenCalledWith('test info');
            expect(mockConsole.warn).toHaveBeenCalledWith(
                'ReportingLogger: Failed to send info log',
                expect.any(Error)
            );
        });
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

    it('should use console.info for info', () => {
        consoleLogger.info('info msg');
        expect(mockConsole.info).toHaveBeenCalledWith('info msg');
    });
});
