export type ErrorCodes = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export const ErrorCodes = {
    UNHANDLED_EXCEPTION: 'UNHANDLED_EXCEPTION',
} as const;