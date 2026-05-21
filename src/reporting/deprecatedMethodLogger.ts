import { ErrorCodes, ILoggingService } from './types';

interface DeprecatedMethodLoggerInstance {
    Logger?: {
        warning(message: string): void;
    };
    _LoggingDispatcher?: ILoggingService;
}

interface DeprecatedMethodUsage {
    methodName: string;
    warningMessage: string;
}

export function logDeprecatedMethodUsage(
    mpInstance: DeprecatedMethodLoggerInstance,
    usage: DeprecatedMethodUsage
): void {
    mpInstance.Logger?.warning(usage.warningMessage);
    mpInstance._LoggingDispatcher?.log({
        message: usage.methodName,
        code: ErrorCodes.MP_DEPRECATED_METHOD_USAGE,
    });
}
