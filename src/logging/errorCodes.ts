import { valueof } from '../utils';

export type ErrorCodes = valueof<typeof ErrorCodes>;

export const ErrorCodes = {
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    UNHANDLED_EXCEPTION: 'UNHANDLED_EXCEPTION',
} as const;