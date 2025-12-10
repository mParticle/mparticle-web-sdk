import { valueof } from '../utils';

export type ErrorCodes = valueof<typeof ErrorCodes>;

export const ErrorCodes = {
    UNHANDLED_EXCEPTION: 'UNHANDLED_EXCEPTION',
} as const;