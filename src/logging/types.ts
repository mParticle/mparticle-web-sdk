import { valueof } from '../utils';

export const ErrorCodes = {
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    UNHANDLED_EXCEPTION: 'UNHANDLED_EXCEPTION',
    IDENTITY_REQUEST: 'IDENTITY_REQUEST',
    ROKT_IDENTITY_MISMATCH: 'ROKT_IDENTITY_MISMATCH',
    ROKT_HASHING_FAILED: 'ROKT_HASHING_FAILED',
    ROKT_PLACEMENT_MAPPING_FAILED: 'ROKT_PLACEMENT_MAPPING_FAILED',
    ROKT_IDENTITY_FALLBACK_FAILED: 'ROKT_IDENTITY_FALLBACK_FAILED',
    USER_ATTRIBUTE_ERROR: 'USER_ATTRIBUTE_ERROR',
    ROKT_QUEUE_PROCESSING_FAILED: 'ROKT_QUEUE_PROCESSING_FAILED',
    ROKT_SELECT_PLACEMENTS_FAILED: 'ROKT_SELECT_PLACEMENTS_FAILED',
    ROKT_SET_EXTENSION_DATA_FAILED: 'ROKT_SET_EXTENSION_DATA_FAILED',
    ROKT_USE_EXTENSION_FAILED: 'ROKT_USE_EXTENSION_FAILED',
    DEPRECATED_METHOD: 'DEPRECATED_METHOD',
    AUDIENCE_API_NOT_ENABLED: 'AUDIENCE_API_NOT_ENABLED',
    ROKT_KIT_ATTACHED: 'ROKT_KIT_ATTACHED',
} as const;

export type ErrorCodes = valueof<typeof ErrorCodes>;

export type ErrorCode = ErrorCodes | string;

export const WSDKErrorSeverity = {
    ERROR: 'ERROR',
    INFO: 'INFO',
    WARNING: 'WARNING',
} as const;

export type WSDKErrorSeverity = (typeof WSDKErrorSeverity)[keyof typeof WSDKErrorSeverity];

export type ErrorsRequestBody = {
    additionalInformation?: Record<string, string>;
    code: ErrorCode;
    severity: WSDKErrorSeverity;
    stackTrace?: string;
    deviceInfo?: string;
    integration?: string;
    reporter?: string;
    url?: string;
};

export type LogRequestBody = ErrorsRequestBody;
