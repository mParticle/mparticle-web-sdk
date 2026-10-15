import { ErrorCodes, IErrorReportingService, WSDKErrorSeverity } from './types';
import { SDKLoggerApi } from '../sdkRuntimeModels';

interface DeprecatedMethodUsage {
    methodName: string;
    warningMessage: string;
}

export function logDeprecatedMethodUsage(
    usage: DeprecatedMethodUsage,
    logger: Pick<SDKLoggerApi, 'warning'>,
    errorReporter: IErrorReportingService | undefined
): void {
    logger.warning(usage.warningMessage);
    errorReporter?.report({
        message: usage.methodName,
        code: ErrorCodes.MP_DEPRECATED_METHOD_USAGE,
        severity: WSDKErrorSeverity.WARNING,
    });
}
