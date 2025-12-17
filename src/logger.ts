import { LogLevelType, SDKInitConfig, SDKLoggerApi } from './sdkRuntimeModels';
import { IReportingLogger } from './logging/reportingLogger';
import { ErrorCodes } from './logging/errorCodes';

export type ILoggerConfig = Pick<SDKInitConfig, 'logLevel' | 'logger'>;
export type IConsoleLogger = Partial<Pick<SDKLoggerApi, 'error' | 'warning' | 'verbose'>>;

export class Logger {
    private logLevel: LogLevelType;
    private logger: IConsoleLogger;
    private reportingLogger: IReportingLogger;

    constructor(config: ILoggerConfig,
        reportingLogger?: IReportingLogger,
    ) {
        this.logLevel = config.logLevel ?? LogLevelType.Warning;
        this.logger = config.logger ?? new ConsoleLogger();
        this.reportingLogger = reportingLogger;
    }

    public verbose(msg: string): void {
        if(this.logLevel === LogLevelType.None) 
            return;

        if (this.logger.verbose && this.logLevel === LogLevelType.Verbose) {
            this.logger.verbose(msg);
        }
    }

    public warning(msg: string, code?: ErrorCodes): void {
        if(this.logLevel === LogLevelType.None) 
            return;

        if (this.logger.warning && 
            (this.logLevel === LogLevelType.Verbose || this.logLevel === LogLevelType.Warning)) {
            this.logger.warning(msg);
            this.reportingLogger.warning(msg, code);
        }
    }

    public error(msg: string, code?: ErrorCodes): void {
        if(this.logLevel === LogLevelType.None) 
            return;

        if (this.logger.error) {
            this.logger.error(msg);
            this.reportingLogger.error(msg, code);
        }
    }

    public setLogLevel(newLogLevel: LogLevelType): void {
        this.logLevel = newLogLevel;
    }
}

export class ConsoleLogger implements IConsoleLogger {
    public verbose(msg: string): void {
        if (console && console.info) {
            console.info(msg);
        }
    }

    public error(msg: string): void {
        if (console && console.error) {
            console.error(msg);
        }
    }

    public warning(msg: string): void {
        if (console && console.warn) {
            console.warn(msg);
        }
    }
}