/* eslint-env node, es2021 */

// ReleaseStorage backed by the AWS CLI (`aws s3api`), the same tool the Phase 1
// QA workflow proves live. It adds no npm dependency. Every call sends
// --expected-bucket-owner. Provider output is reduced to an error code and is
// never printed, so bucket names, account IDs and request IDs stay private.
//
// Writes are single-part `s3api put-object` calls only. The high-level
// `aws s3 cp` would switch to multipart above its threshold and complete the
// upload without If-None-Match, which the bucket policy denies for candidates.
// Bodies are capped at MAX_CANDIDATE_FILE_BYTES (100 MiB), far below the 5 GiB
// single-part limit, so multipart is never needed. There is no copy operation:
// the bucket policy makes server-side copies into candidates impossible.
// Buckets use SSE-S3 default encryption, so no encryption headers are sent.

type ObjectHeaders = import('./release-contract').ObjectHeaders;
type ReleaseContract = import('./release-contract').ReleaseContract;
type PutResult = import('./release-storage').PutResult;
type ReleaseStorage = import('./release-storage').ReleaseStorage;
type ReleaseStorageModule = import('./release-storage').ReleaseStorageModule;
type StorageErrorCode = import('./release-storage').StorageErrorCode;
type StorageOperation = import('./release-storage').StorageOperation;
type StoredObject = import('./release-storage').StoredObject;

const childProcess: typeof import('node:child_process') = require('node:child_process');
const fs: typeof import('node:fs') = require('node:fs');
const os: typeof import('node:os') = require('node:os');
const path: typeof import('node:path') = require('node:path');
const {
    MAX_CANDIDATE_FILE_BYTES,
    sha256Base64,
}: ReleaseContract = require('./release-contract.ts');
const {
    ReleaseStorageError,
}: ReleaseStorageModule = require('./release-storage.ts');

export interface AwsCliStorageConfig {
    bucket: string;
    expectedBucketOwner: string;
    awsExecutable?: string;
    timeoutMs?: number;
    env?: NodeJS.ProcessEnv;
}

interface CliResult {
    stdout: string;
}

const DEFAULT_TIMEOUT_MS = 2 * 60 * 1000;
const MAX_CLI_OUTPUT_BYTES = 1024 * 1024;
const ACCOUNT_ID_PATTERN = /^[0-9]{12}$/;
const BUCKET_PATTERN = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;
const AWS_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9.]{0,63}$/;

const CODE_MAP: Record<string, StorageErrorCode> = {
    NoSuchKey: 'NotFound',
    NotFound: 'NotFound',
    '404': 'NotFound',
    AccessDenied: 'AccessDenied',
    Forbidden: 'AccessDenied',
    '403': 'AccessDenied',
    PreconditionFailed: 'PreconditionFailed',
    '412': 'PreconditionFailed',
    ConditionalRequestConflict: 'ConditionalConflict',
    '409': 'ConditionalConflict',
    SlowDown: 'Throttled',
    Throttling: 'Throttled',
    ThrottlingException: 'Throttled',
    RequestLimitExceeded: 'Throttled',
    '503': 'Throttled',
    InternalError: 'Transient',
    ServiceUnavailable: 'Transient',
    RequestTimeout: 'Transient',
    '500': 'Transient',
    '502': 'Transient',
    '504': 'Transient',
    BadDigest: 'BadDigest',
    InvalidDigest: 'BadDigest',
    XAmzContentChecksumMismatch: 'BadDigest',
};

// Extracts only the provider's error code, as the Phase 1 workflow does.
function extractAwsErrorCode(stderr: string): string {
    let code = '';
    try {
        const parsed = JSON.parse(stderr);
        code = String(parsed.Code || parsed.code || '');
    } catch {
        const patterns = [
            /"Code"\s*:\s*"([A-Za-z0-9][A-Za-z0-9.]{0,63})"/,
            /error occurred \(([A-Za-z0-9][A-Za-z0-9.]{0,63})\)/,
            /\b(AccessDenied|Forbidden|PreconditionFailed|NoSuchKey)\b/,
        ];
        for (const pattern of patterns) {
            const match = stderr.match(pattern);
            if (match) {
                code = match[1];
                break;
            }
        }
    }
    return AWS_CODE_PATTERN.test(code) ? code : 'Unknown';
}

function mapAwsErrorCode(awsCode: string): StorageErrorCode {
    return Object.prototype.hasOwnProperty.call(CODE_MAP, awsCode)
        ? CODE_MAP[awsCode]
        : 'Unknown';
}

function parseResponse(stdout: string): Record<string, unknown> {
    try {
        const parsed = JSON.parse(stdout || '{}');
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
        return {};
    }
}

function optionalString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

class AwsCliReleaseStorage implements ReleaseStorage {
    private readonly config: AwsCliStorageConfig;

    constructor(config: AwsCliStorageConfig) {
        if (!BUCKET_PATTERN.test(config.bucket)) {
            throw new Error('The artifact bucket configuration is invalid.');
        }
        if (!ACCOUNT_ID_PATTERN.test(config.expectedBucketOwner)) {
            throw new Error('The expected account configuration is invalid.');
        }
        this.config = config;
    }

    async getObject(key: string, maxBytes: number): Promise<StoredObject> {
        return this.withTemporaryDirectory(async directory => {
            const outputPath = path.join(directory, 'object');
            const { stdout } = await this.run('get', key, [
                'get-object',
                '--bucket',
                this.config.bucket,
                '--key',
                key,
                '--expected-bucket-owner',
                this.config.expectedBucketOwner,
                outputPath,
            ]);
            const size = fs.statSync(outputPath).size;
            if (size > maxBytes) {
                throw new ReleaseStorageError('TooLarge', 'get', key);
            }
            const response = parseResponse(stdout);
            const etag = optionalString(response.ETag);
            if (!etag) {
                throw new ReleaseStorageError('Unknown', 'get', key);
            }
            return {
                bytes: fs.readFileSync(outputPath),
                etag,
                contentType: optionalString(response.ContentType),
                cacheControl: optionalString(response.CacheControl),
                contentEncoding: optionalString(response.ContentEncoding),
            };
        });
    }

    async putObjectIfAbsent(
        key: string,
        bytes: Buffer,
        headers: ObjectHeaders
    ): Promise<PutResult> {
        return this.put('putIfAbsent', key, bytes, headers, [
            '--if-none-match',
            '*',
        ]);
    }

    async putObjectIfMatch(
        key: string,
        bytes: Buffer,
        etag: string,
        headers: ObjectHeaders
    ): Promise<PutResult> {
        return this.put('putIfMatch', key, bytes, headers, [
            '--if-match',
            etag,
        ]);
    }

    private async put(
        operation: StorageOperation,
        key: string,
        bytes: Buffer,
        headers: ObjectHeaders,
        condition: string[]
    ): Promise<PutResult> {
        if (bytes.length > MAX_CANDIDATE_FILE_BYTES) {
            throw new ReleaseStorageError('TooLarge', operation, key);
        }
        return this.withTemporaryDirectory(async directory => {
            const bodyPath = path.join(directory, 'body');
            fs.writeFileSync(bodyPath, bytes, { mode: 0o600 });
            // No --acl, no Content-Encoding, no encryption headers.
            const { stdout } = await this.run(operation, key, [
                'put-object',
                '--bucket',
                this.config.bucket,
                '--key',
                key,
                '--body',
                bodyPath,
                '--content-type',
                headers.contentType,
                '--cache-control',
                headers.cacheControl,
                '--checksum-sha256',
                sha256Base64(bytes),
                ...condition,
                '--expected-bucket-owner',
                this.config.expectedBucketOwner,
            ]);
            const etag = optionalString(parseResponse(stdout).ETag);
            if (!etag) {
                throw new ReleaseStorageError('Unknown', operation, key);
            }
            return { etag };
        });
    }

    private run(
        operation: StorageOperation,
        key: string,
        args: string[]
    ): Promise<CliResult> {
        return new Promise((resolve, reject) => {
            childProcess.execFile(
                this.config.awsExecutable || 'aws',
                ['s3api', ...args, '--output', 'json'],
                {
                    encoding: 'utf8',
                    env: { ...(this.config.env || process.env), AWS_PAGER: '' },
                    maxBuffer: MAX_CLI_OUTPUT_BYTES,
                    timeout: this.config.timeoutMs || DEFAULT_TIMEOUT_MS,
                },
                (error, stdout, stderr) => {
                    if (!error) {
                        resolve({ stdout });
                        return;
                    }
                    const cause = error as NodeJS.ErrnoException & {
                        killed?: boolean;
                    };
                    let code: StorageErrorCode;
                    if (cause.code === 'ENOENT') {
                        code = 'Unavailable';
                    } else if (cause.killed) {
                        code = 'Transient';
                    } else {
                        code = mapAwsErrorCode(
                            extractAwsErrorCode(String(stderr || ''))
                        );
                    }
                    reject(new ReleaseStorageError(code, operation, key));
                }
            );
        });
    }

    private async withTemporaryDirectory<T>(
        callback: (directory: string) => Promise<T>
    ): Promise<T> {
        const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'v3-release-'));
        try {
            return await callback(directory);
        } finally {
            fs.rmSync(directory, { force: true, recursive: true });
        }
    }
}

// Reads configuration from the environment. Messages name the variable but
// never its value.
function awsCliStorageFromEnvironment(
    env: NodeJS.ProcessEnv = process.env
): InstanceType<typeof AwsCliReleaseStorage> {
    // The per-pod bucket name and owning account ID arrive as Environment
    // secrets; nothing here has a default.
    const bucket = env.SDK_ARTIFACT_BUCKET;
    const expectedBucketOwner = env.AWS_ACCOUNT_ID;
    if (!bucket) {
        throw new Error('SDK_ARTIFACT_BUCKET is not set.');
    }
    if (!expectedBucketOwner) {
        throw new Error('AWS_ACCOUNT_ID is not set.');
    }
    return new AwsCliReleaseStorage({
        bucket,
        expectedBucketOwner,
        env,
    });
}

const awsCliReleaseStorage = {
    AwsCliReleaseStorage,
    awsCliStorageFromEnvironment,
    extractAwsErrorCode,
    mapAwsErrorCode,
};

module.exports = awsCliReleaseStorage;

export type AwsCliReleaseStorageModule = typeof awsCliReleaseStorage;
