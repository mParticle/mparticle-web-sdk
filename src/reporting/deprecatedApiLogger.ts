import { ErrorCodes, ILoggingService } from './types';

interface DeprecatedApiLoggerInstance {
    Logger?: {
        warning(message: string): void;
    };
    _LoggingDispatcher?: ILoggingService;
}

interface DeprecatedApiUsage {
    methodName: string;
    warningMessage: string;
}

export function logDeprecatedApiUsage(
    mpInstance: DeprecatedApiLoggerInstance,
    usage: DeprecatedApiUsage
): void {
    mpInstance.Logger?.warning(usage.warningMessage);
    mpInstance._LoggingDispatcher?.log({
        message: usage.methodName,
        code: ErrorCodes.MP_DEPRECATED_METHOD_USAGE,
    });
}
