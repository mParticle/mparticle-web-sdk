import { ErrorCodes, ILoggingService } from './types';
import { SDKLoggerApi } from '../sdkRuntimeModels';

interface DeprecatedMethodUsage {
    methodName: string;
    warningMessage: string;
}

export function logDeprecatedMethodUsage(
    usage: DeprecatedMethodUsage,
    logger: Pick<SDKLoggerApi, 'warning'>,
    loggingDispatcher: ILoggingService | undefined
): void {
    logger.warning(usage.warningMessage);
    loggingDispatcher?.log({
        message: usage.methodName,
        code: ErrorCodes.MP_DEPRECATED_METHOD_USAGE,
    });
}
