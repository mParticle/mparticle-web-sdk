import { LogLevelType, SDKInitConfig, SDKLoggerApi } from './sdkRuntimeModels';
export type ILoggerConfig = Pick<SDKInitConfig, 'logLevel' | 'logger'>;
export type IConsoleLogger = Partial<Pick<SDKLoggerApi, 'error' | 'warning' | 'verbose'>>;
export declare class Logger {
    private logLevel;
    private logger;
    constructor(config: ILoggerConfig);
    verbose(msg: string): void;
    warning(msg: string): void;
    error(msg: string): void;
    isVerbose(): boolean;
    setLogLevel(newLogLevel: LogLevelType): void;
}
export declare class ConsoleLogger implements IConsoleLogger {
    verbose(msg: string): void;
    error(msg: string): void;
    warning(msg: string): void;
}
