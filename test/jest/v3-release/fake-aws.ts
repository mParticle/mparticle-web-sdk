import * as fs from 'fs';
import * as path from 'path';

// A PATH shim standing in for the AWS CLI, following the Phase 1 workflow
// tests. It models create-only (If-None-Match) and If-Match writes with
// MD5 ETags, stores the headers it was given, checks the bucket and expected
// owner, and can deny, fail or corrupt calls. Its error output deliberately
// contains the bucket, key and account so tests can prove none of it leaks.

const FAKE_AWS_SCRIPT = `#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = JSON.parse(process.env.FAKE_S3_CONFIG);
const state = process.env.FAKE_S3_STATE;
const args = process.argv.slice(2);
fs.appendFileSync(process.env.FAKE_S3_CALLS, JSON.stringify(args) + '\\n');
const opts = {};
const positional = [];
for (let i = 2; i < args.length; i++) {
    if (args[i].startsWith('--')) {
        opts[args[i].slice(2)] = args[i + 1];
        i++;
    } else {
        positional.push(args[i]);
    }
}
const operation = args[1];
function fail(code) {
    const raw = 'raw stderr ' + opts.bucket + '/' + opts.key + ' ' + opts['expected-bucket-owner'];
    process.stderr.write(
        config.textErrors
            ? '\\nAn error occurred (' + code + ') when calling the ' + operation + ' operation: ' + raw + '\\n'
            : JSON.stringify({ Code: code, Message: raw })
    );
    process.exit(254);
}
if (args[0] !== 's3api') fail('Unsupported');
const owners = config.buckets || { [config.bucket]: config.owner };
if (!Object.prototype.hasOwnProperty.call(owners, opts.bucket) || opts['expected-bucket-owner'] !== owners[opts.bucket]) {
    fail('AccessDenied');
}
const key = opts.key;
const bucketState = path.join(state, encodeURIComponent(opts.bucket));
fs.mkdirSync(bucketState, { recursive: true });
const objectPath = path.join(bucketState, encodeURIComponent(key));
const metaPath = objectPath + '.meta';
const exists = fs.existsSync(objectPath);
const kind = operation === 'get-object' ? 'get' : 'put';
if (config.roles && process.env.FAKE_ASSUMED_ROLE !== config.roles[opts.bucket]) {
    fail('AccessDenied');
}
const bucketDeny = (config.bucketDeny && config.bucketDeny[opts.bucket]) || {};
for (const prefix of ((config.deny && config.deny[kind]) || []).concat(bucketDeny[kind] || [])) {
    if (key.startsWith(prefix)) fail('AccessDenied');
}
const countersPath = path.join(state, '.failures');
const counters = fs.existsSync(countersPath) ? JSON.parse(fs.readFileSync(countersPath, 'utf8')) : {};
let pending = null;
(config.failures || []).forEach((failure, index) => {
    if (pending || failure.operation !== operation || !key.startsWith(failure.keyPrefix || '')) return;
    const used = counters[index] || 0;
    if (used >= (failure.times || 1)) return;
    counters[index] = used + 1;
    fs.writeFileSync(countersPath, JSON.stringify(counters));
    pending = failure;
});
if (pending && !pending.afterApply) fail(pending.code);
switch (operation) {
    case 'put-object': {
        const body = fs.readFileSync(opts.body);
        const sha = crypto.createHash('sha256').update(body).digest('base64');
        if (opts['checksum-sha256'] !== sha) fail('BadDigest');
        if (opts['if-none-match'] !== undefined) {
            if (opts['if-none-match'] !== '*') fail('InvalidArgument');
            if (exists) fail('PreconditionFailed');
        } else if (opts['if-match'] !== undefined) {
            if (!exists) fail('NoSuchKey');
            const current = JSON.parse(fs.readFileSync(metaPath, 'utf8')).etag;
            if (current !== opts['if-match']) fail('PreconditionFailed');
        } else if (!config.allowUnconditionalPut) {
            fail('AccessDenied');
        }
        const etag = '"' + crypto.createHash('md5').update(body).digest('hex') + '"';
        fs.writeFileSync(objectPath, body);
        fs.writeFileSync(metaPath, JSON.stringify({
            etag,
            contentType: opts['content-type'],
            cacheControl: opts['cache-control'],
            contentEncoding: opts['content-encoding'],
        }));
        if (pending) fail(pending.code);
        process.stdout.write(JSON.stringify({ ETag: etag, ChecksumSHA256: sha }));
        break;
    }
    case 'get-object': {
        if (!exists) fail(config.missingObjectCode || 'NoSuchKey');
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        let body = fs.readFileSync(objectPath);
        if ((config.corruptGetPrefixes || []).some(prefix => key.startsWith(prefix))) {
            body = Buffer.concat([body, Buffer.from('corrupted')]);
        }
        const response = { ETag: meta.etag };
        const range = opts.range === undefined || config.ignoreRange ? null : /^bytes=([0-9]+)-([0-9]+)$/.exec(opts.range);
        if (opts.range !== undefined && !config.ignoreRange && !range) fail('InvalidArgument');
        if (range) {
            const start = Number(range[1]);
            if (start >= body.length) fail('InvalidRange');
            const end = Math.min(Number(range[2]), body.length - 1);
            response.ContentRange = 'bytes ' + start + '-' + end + '/' + (config.reportedTotal || body.length);
            body = body.subarray(start, end + 1);
        }
        response.ContentLength = body.length;
        fs.writeFileSync(positional[0], body);
        if (meta.contentType) response.ContentType = meta.contentType;
        if (meta.cacheControl) response.CacheControl = meta.cacheControl;
        if (meta.contentEncoding) response.ContentEncoding = meta.contentEncoding;
        process.stdout.write(JSON.stringify(response));
        break;
    }
    default:
        fail('Unsupported');
}
`;

export const FAKE_BUCKET = 'secret-bucket-name';
export const FAKE_ACCOUNT_ID = '123456789012';

export interface FakeAwsFailure {
    operation: 'put-object' | 'get-object';
    keyPrefix?: string;
    code: string;
    times?: number;
    afterApply?: boolean;
}

export interface FakeAwsConfig {
    bucket?: string;
    owner?: string;
    // bucket name -> expected owner, for several pods sharing one fake.
    buckets?: Record<string, string>;
    // bucket name -> the only role (FAKE_ASSUMED_ROLE) allowed to use it.
    roles?: Record<string, string>;
    bucketDeny?: Record<string, { get?: string[]; put?: string[] }>;
    deny?: { get?: string[]; put?: string[] };
    missingObjectCode?: string;
    failures?: FakeAwsFailure[];
    corruptGetPrefixes?: string[];
    allowUnconditionalPut?: boolean;
    textErrors?: boolean;
    // Return the whole body without a ContentRange, as a server that ignores
    // the Range header would.
    ignoreRange?: boolean;
    // Misreport the object's total size in ContentRange.
    reportedTotal?: number;
}

export interface FakeAws {
    binDirectory: string;
    stateDirectory: string;
    env: Record<string, string>;
    calls(): string[][];
    seed(
        key: string,
        bytes: Buffer,
        headers?: Record<string, string>,
        bucket?: string
    ): void;
    read(key: string, bucket?: string): Buffer | undefined;
    headers(key: string, bucket?: string): Record<string, string> | undefined;
    configure(config: FakeAwsConfig): void;
}

export function installFakeAws(
    directory: string,
    config: FakeAwsConfig = {}
): FakeAws {
    const binDirectory = path.join(directory, 'bin');
    const stateDirectory = path.join(directory, 's3');
    const callsPath = path.join(directory, 'aws-calls');
    fs.mkdirSync(binDirectory, { recursive: true });
    fs.mkdirSync(stateDirectory, { recursive: true });
    fs.writeFileSync(path.join(binDirectory, 'aws'), FAKE_AWS_SCRIPT, {
        mode: 0o755,
    });
    fs.writeFileSync(callsPath, '');
    const env: Record<string, string> = {
        PATH: `${binDirectory}:${process.env.PATH}`,
        FAKE_S3_STATE: stateDirectory,
        FAKE_S3_CALLS: callsPath,
        FAKE_S3_CONFIG: '',
    };
    const objectPath = (key: string, bucket = FAKE_BUCKET) => {
        const bucketState = path.join(
            stateDirectory,
            encodeURIComponent(bucket)
        );
        fs.mkdirSync(bucketState, { recursive: true });
        return path.join(bucketState, encodeURIComponent(key));
    };
    const fake: FakeAws = {
        binDirectory,
        stateDirectory,
        env,
        calls: () =>
            fs
                .readFileSync(callsPath, 'utf8')
                .split('\n')
                .filter(Boolean)
                .map(line => JSON.parse(line)),
        seed(key, bytes, headers = {}, bucket?: string) {
            const target = objectPath(key, bucket);
            fs.writeFileSync(target, bytes);
            const crypto = require('crypto');
            fs.writeFileSync(
                `${target}.meta`,
                JSON.stringify({
                    etag: `"${crypto
                        .createHash('md5')
                        .update(bytes)
                        .digest('hex')}"`,
                    ...headers,
                })
            );
        },
        read(key, bucket?: string) {
            const target = objectPath(key, bucket);
            return fs.existsSync(target) ? fs.readFileSync(target) : undefined;
        },
        headers(key, bucket?: string) {
            const metaPath = `${objectPath(key, bucket)}.meta`;
            return fs.existsSync(metaPath)
                ? JSON.parse(fs.readFileSync(metaPath, 'utf8'))
                : undefined;
        },
        configure(next) {
            env.FAKE_S3_CONFIG = JSON.stringify({
                bucket: FAKE_BUCKET,
                owner: FAKE_ACCOUNT_ID,
                ...next,
            });
        },
    };
    fake.configure(config);
    return fake;
}

export function argValue(call: string[], flag: string): string | undefined {
    const index = call.indexOf(flag);
    return index === -1 ? undefined : call[index + 1];
}
