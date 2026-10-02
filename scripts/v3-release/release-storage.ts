/* eslint-env node, es2021 */

// The only I/O seam for the uploader and promoter. Implementations normalize
// every failure to a StorageErrorCode and never surface raw provider output,
// bucket names or account identifiers.

type ObjectHeaders = import('./release-contract').ObjectHeaders;

export type StorageErrorCode =
    | 'NotFound'
    | 'AccessDenied'
    | 'PreconditionFailed'
    | 'ConditionalConflict'
    | 'Throttled'
    | 'Transient'
    | 'BadDigest'
    | 'TooLarge'
    | 'Unavailable'
    | 'Unknown';

export type StorageOperation = 'get' | 'putIfAbsent' | 'putIfMatch';

export interface StoredObject {
    bytes: Buffer;
    // Used only as a conditional-write precondition, never for integrity.
    etag: string;
    contentType?: string;
    cacheControl?: string;
    contentEncoding?: string;
}

export interface PutResult {
    etag: string;
}

export interface ReleaseStorage {
    getObject(key: string, maxBytes: number): Promise<StoredObject>;
    // If-None-Match: *
    putObjectIfAbsent(
        key: string,
        bytes: Buffer,
        headers: ObjectHeaders
    ): Promise<PutResult>;
    // If-Match: <etag>
    putObjectIfMatch(
        key: string,
        bytes: Buffer,
        etag: string,
        headers: ObjectHeaders
    ): Promise<PutResult>;
}

class ReleaseStorageError extends Error {
    readonly code: StorageErrorCode;
    readonly operation: StorageOperation;
    readonly key: string;

    constructor(
        code: StorageErrorCode,
        operation: StorageOperation,
        key: string
    ) {
        // Keys are public, fixed-layout paths; nothing else is included.
        super(`${operation} ${key} failed (${code})`);
        // Keeps instanceof working when compiled to ES5 (as Jest does).
        Object.setPrototypeOf(this, ReleaseStorageError.prototype);
        this.name = 'ReleaseStorageError';
        this.code = code;
        this.operation = operation;
        this.key = key;
    }
}

const RETRYABLE_CODES: readonly StorageErrorCode[] = [
    'ConditionalConflict',
    'Throttled',
    'Transient',
];

function isStorageError(
    error: unknown,
    code?: StorageErrorCode
): error is InstanceType<typeof ReleaseStorageError> {
    return (
        error instanceof ReleaseStorageError &&
        (code === undefined || error.code === code)
    );
}

function isRetryable(error: unknown): boolean {
    return isStorageError(error) && RETRYABLE_CODES.includes(error.code);
}

const releaseStorage = {
    RETRYABLE_CODES,
    ReleaseStorageError,
    isRetryable,
    isStorageError,
};

module.exports = releaseStorage;

export type ReleaseStorageModule = typeof releaseStorage;
