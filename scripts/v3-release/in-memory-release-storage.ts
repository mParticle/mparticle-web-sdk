/* eslint-env node, es2021 */

// Test double for ReleaseStorage with S3 conditional-write semantics:
// If-None-Match: * fails with PreconditionFailed when the key exists, and
// If-Match fails unless the current ETag matches. It also models permission
// denials, lost responses, corrupted reads and races between read and write.

type ObjectHeaders = import('./release-contract').ObjectHeaders;
type ReleaseContract = import('./release-contract').ReleaseContract;
type PutResult = import('./release-storage').PutResult;
type ReleaseStorage = import('./release-storage').ReleaseStorage;
type ReleaseStorageModule = import('./release-storage').ReleaseStorageModule;
type StorageErrorCode = import('./release-storage').StorageErrorCode;
type StorageOperation = import('./release-storage').StorageOperation;
type StoredObject = import('./release-storage').StoredObject;

const nodeCrypto: typeof import('node:crypto') = require('node:crypto');
const {
    MAX_CANDIDATE_FILE_BYTES,
}: ReleaseContract = require('./release-contract.ts');
const {
    ReleaseStorageError,
}: ReleaseStorageModule = require('./release-storage.ts');

export interface StorageCall {
    operation: StorageOperation;
    key: string;
    etag?: string;
    headers?: ObjectHeaders;
}

export interface StorageFault {
    operation?: StorageOperation;
    key?: string | RegExp;
    code: StorageErrorCode;
    // Number of matching calls to fail; defaults to 1.
    times?: number;
    // Apply the write, then report the failure (a lost response).
    afterApply?: boolean;
}

export interface InMemoryStorageOptions {
    // S3 returns 403 instead of 404 for a missing key without s3:ListBucket.
    missingObjectCode?: 'NotFound' | 'AccessDenied';
    deny?: (operation: StorageOperation, key: string) => boolean;
    // Runs before a conditional write is evaluated, to simulate a concurrent
    // writer between this writer's read and its write.
    beforeWrite?: (
        operation: StorageOperation,
        key: string,
        storage: InMemoryReleaseStorage
    ) => void;
    corruptRead?: (key: string, bytes: Buffer) => Buffer;
}

interface StoredEntry {
    bytes: Buffer;
    etag: string;
    headers: ObjectHeaders;
    contentEncoding?: string;
}

function keyMatches(pattern: string | RegExp | undefined, key: string) {
    return (
        pattern === undefined ||
        (typeof pattern === 'string' ? pattern === key : pattern.test(key))
    );
}

// S3 single-part ETags are the quoted MD5 of the content, so rewriting
// identical bytes yields the same ETag.
function etagFor(bytes: Buffer): string {
    return `"${nodeCrypto
        .createHash('md5')
        .update(bytes)
        .digest('hex')}"`;
}

class InMemoryReleaseStorage implements ReleaseStorage {
    readonly objects = new Map<string, StoredEntry>();
    readonly calls: StorageCall[] = [];
    options: InMemoryStorageOptions;
    private faults: Array<StorageFault & { remaining: number }> = [];

    constructor(options: InMemoryStorageOptions = {}) {
        this.options = options;
    }

    seed(
        key: string,
        bytes: Buffer,
        headers: ObjectHeaders = {
            contentType: 'application/octet-stream',
            cacheControl: '',
        },
        contentEncoding?: string
    ): void {
        this.objects.set(key, {
            bytes: Buffer.from(bytes),
            etag: etagFor(bytes),
            headers,
            contentEncoding,
        });
    }

    injectFault(fault: StorageFault): void {
        this.faults.push({
            ...fault,
            remaining: fault.times === undefined ? 1 : fault.times,
        });
    }

    bytesOf(key: string): Buffer | undefined {
        const entry = this.objects.get(key);
        return entry && entry.bytes;
    }

    writes(): StorageCall[] {
        return this.calls.filter(call => call.operation !== 'get');
    }

    private takeFault(
        operation: StorageOperation,
        key: string
    ): (StorageFault & { remaining: number }) | undefined {
        const fault = this.faults.find(
            candidate =>
                candidate.remaining > 0 &&
                (candidate.operation === undefined ||
                    candidate.operation === operation) &&
                keyMatches(candidate.key, key)
        );
        if (fault) {
            fault.remaining--;
        }
        return fault;
    }

    private guard(
        operation: StorageOperation,
        key: string
    ): (StorageFault & { remaining: number }) | undefined {
        if (this.options.deny && this.options.deny(operation, key)) {
            throw new ReleaseStorageError('AccessDenied', operation, key);
        }
        const fault = this.takeFault(operation, key);
        if (fault && !fault.afterApply) {
            throw new ReleaseStorageError(fault.code, operation, key);
        }
        return fault;
    }

    async getObject(key: string, maxBytes: number): Promise<StoredObject> {
        this.calls.push({ operation: 'get', key });
        this.guard('get', key);
        const entry = this.objects.get(key);
        if (!entry) {
            throw new ReleaseStorageError(
                this.options.missingObjectCode || 'NotFound',
                'get',
                key
            );
        }
        const bytes = this.options.corruptRead
            ? this.options.corruptRead(key, Buffer.from(entry.bytes))
            : Buffer.from(entry.bytes);
        if (bytes.length > maxBytes) {
            throw new ReleaseStorageError('TooLarge', 'get', key);
        }
        return {
            bytes,
            etag: entry.etag,
            contentType: entry.headers.contentType,
            cacheControl: entry.headers.cacheControl,
            contentEncoding: entry.contentEncoding,
        };
    }

    async putObjectIfAbsent(
        key: string,
        bytes: Buffer,
        headers: ObjectHeaders
    ): Promise<PutResult> {
        return this.put('putIfAbsent', key, bytes, headers);
    }

    async putObjectIfMatch(
        key: string,
        bytes: Buffer,
        etag: string,
        headers: ObjectHeaders
    ): Promise<PutResult> {
        return this.put('putIfMatch', key, bytes, headers, etag);
    }

    private put(
        operation: 'putIfAbsent' | 'putIfMatch',
        key: string,
        bytes: Buffer,
        headers: ObjectHeaders,
        etag?: string
    ): PutResult {
        this.calls.push({ operation, key, etag, headers });
        if (bytes.length > MAX_CANDIDATE_FILE_BYTES) {
            throw new ReleaseStorageError('TooLarge', operation, key);
        }
        const fault = this.guard(operation, key);
        if (this.options.beforeWrite) {
            this.options.beforeWrite(operation, key, this);
        }
        const existing = this.objects.get(key);
        if (operation === 'putIfMatch' && !existing) {
            throw new ReleaseStorageError('NotFound', operation, key);
        }
        const conflict =
            operation === 'putIfAbsent'
                ? existing !== undefined
                : existing !== undefined && existing.etag !== etag;
        if (conflict) {
            throw new ReleaseStorageError('PreconditionFailed', operation, key);
        }
        const entry = {
            bytes: Buffer.from(bytes),
            etag: etagFor(bytes),
            headers: { ...headers },
        };
        this.objects.set(key, entry);
        if (fault) {
            throw new ReleaseStorageError(fault.code, operation, key);
        }
        return { etag: entry.etag };
    }
}

const inMemoryReleaseStorage = { InMemoryReleaseStorage, etagFor };

module.exports = inMemoryReleaseStorage;

export type InMemoryReleaseStorageModule = typeof inMemoryReleaseStorage;
