import { ILoggingService } from './types';
import { SDKLoggerApi } from '../sdkRuntimeModels';
interface DeprecatedMethodUsage {
    methodName: string;
    warningMessage: string;
}
export declare function logDeprecatedMethodUsage(usage: DeprecatedMethodUsage, logger: Pick<SDKLoggerApi, 'warning'>, loggingDispatcher: ILoggingService | undefined): void;
export {};
