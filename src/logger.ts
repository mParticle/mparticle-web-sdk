import { LogLevelType, SDKInitConfig, SDKLoggerApi } from './sdkRuntimeModels';
import { ReportingLogger } from './logging/reportingLogger';
import { ErrorCodes } from './logging/types';

export type ILoggerConfig = Pick<SDKInitConfig, 'logLevel' | 'logger'>;
export type IConsoleLogger = Partial<Pick<SDKLoggerApi, 'error' | 'warning' | 'verbose' | 'info'>>;

export class Logger {
    private logLevel: LogLevelType;
    private logger: IConsoleLogger;
    private reportingLogger: ReportingLogger;

    constructor(config: ILoggerConfig,
        reportingLogger?: ReportingLogger,
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

    public warning(msg: string, codeForReporting?: ErrorCodes): void {
        if(this.logLevel === LogLevelType.None)
            return;

        if (this.logger.warning &&
            (this.logLevel === LogLevelType.Verbose || this.logLevel === LogLevelType.Warning)) {
            this.logger.warning(msg);
            if (codeForReporting) {
                try {
                    this.reportingLogger?.warning(msg, codeForReporting);
                } catch (e) {
                    console.warn('ReportingLogger: Failed to send warning log', e);
                }
            }
        }
    }

    public info(msg: string, codeForReporting?: ErrorCodes): void {
        if(this.logLevel === LogLevelType.None)
            return;

        if (this.logger.info &&
            (this.logLevel === LogLevelType.Verbose || this.logLevel === LogLevelType.Warning)) {
            this.logger.info(msg);
            if (codeForReporting) {
                try {
                    this.reportingLogger?.info(msg, codeForReporting);
                } catch (e) {
                    console.warn('ReportingLogger: Failed to send info log', e);
                }
            }
        }
    }

    public error(msg: string, codeForReporting?: ErrorCodes): void {
        if(this.logLevel === LogLevelType.None)
            return;

        if (this.logger.error) {
            this.logger.error(msg);
            if (codeForReporting) {
                try {
                    this.reportingLogger?.error(msg, codeForReporting);
                } catch (e) {
                    console.warn('ReportingLogger: Failed to send error log', e);
                }
            }
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

    public info(msg: string): void {
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
