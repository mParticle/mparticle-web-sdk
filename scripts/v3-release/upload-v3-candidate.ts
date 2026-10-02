/* eslint-env node, es2021 */

// Uploads one packaged V3 candidate directory (the packager's output, handed
// over as a workflow artifact) to one pod's bucket. It never builds or
// packages: the directory is untrusted input and is validated completely
// against its metadata.json before any credential is used.
//
// Every object is written create-only (If-None-Match: *) in inventory order
// and read back; metadata.json is written last, so a candidate without it is
// incomplete and can never be promoted. A re-run of the same build ID is
// idempotent: when an object already exists (412), it is read and must hold
// identical bytes and headers, otherwise the upload fails. Nothing is ever
// copied server-side, overwritten or deleted. The uploader has no pointer
// authority: it never writes, reads or lists channels/.
//
// node --experimental-strip-types scripts/v3-release/upload-v3-candidate.ts \
//     --candidate <dir> [--expected-version <v>] [--expected-build-id <id>] \
//     [--expected-metadata-sha256 <sha>] [--expected-source-sha <sha>] \
//     [--dry-run] [--pod <label>] [--progress-file <file>]

type CandidateMetadata = import('./release-contract').CandidateMetadata;
type ReleaseContract = import('./release-contract').ReleaseContract;
type ReleaseProgress = import('./release-progress').ReleaseProgress;
type UploadSummary = import('./release-progress').UploadSummary;
type ReleaseStorage = import('./release-storage').ReleaseStorage;
type ReleaseStorageModule = import('./release-storage').ReleaseStorageModule;
type AwsCliReleaseStorageModule = import('./aws-cli-release-storage').AwsCliReleaseStorageModule;

const fs: typeof import('node:fs') = require('node:fs');
const path: typeof import('node:path') = require('node:path');
const contract: ReleaseContract = require('./release-contract.ts');
const {
    isRetryable,
    isStorageError,
}: ReleaseStorageModule = require('./release-storage.ts');
const {
    appendProgressRecord,
    validatePod,
}: ReleaseProgress = require('./release-progress.ts');

export interface LocalCandidate {
    directory: string;
    metadata: CandidateMetadata;
    metadataBytes: Buffer;
    metadataSha256: string;
}

export interface ExpectedCandidate {
    version?: string;
    buildId?: string;
    metadataSha256?: string;
    sourceSha?: string;
}

export interface UploadPlanEntry {
    path: string;
    key: string;
    size: number;
    sha256: string;
    contentType: string;
    cacheControl: string;
}

export interface UploadOptions {
    log?: (line: string) => void;
    maxAttempts?: number;
    retryDelayMs?: number;
    sleep?: (milliseconds: number) => Promise<void>;
}

export interface UploadDependencies {
    env?: NodeJS.ProcessEnv;
    log?: (line: string) => void;
    createStorage?: (env: NodeJS.ProcessEnv) => ReleaseStorage;
    upload?: UploadOptions;
}

interface CliOptions {
    candidate: string;
    expected: ExpectedCandidate;
    dryRun: boolean;
    pod: string;
    progressFile?: string;
}

function fail(message: string): never {
    throw new Error(message);
}

function listCandidateFiles(directory: string): string[] {
    const files: string[] = [];
    function visit(relativeDirectory: string): void {
        const absolute = path.join(directory, relativeDirectory);
        for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
            const relativePath = relativeDirectory
                ? `${relativeDirectory}/${entry.name}`
                : entry.name;
            if (entry.isDirectory()) {
                visit(relativePath);
            } else if (entry.isFile()) {
                files.push(relativePath);
            } else {
                fail(
                    `Candidate entry is not a regular file or directory: ${relativePath}`
                );
            }
        }
    }
    visit('');
    return files.sort(contract.compareStrings);
}

// Validates the local candidate completely before any credentials are used.
function validateLocalCandidate(
    directory: string,
    expected: ExpectedCandidate = {}
): LocalCandidate {
    const stat = fs.lstatSync(directory, { throwIfNoEntry: false });
    if (!stat || stat.isSymbolicLink() || !stat.isDirectory()) {
        fail('Candidate must be a real directory, not a symlink or file');
    }
    const metadataPath = path.join(directory, contract.METADATA_FILE_NAME);
    const metadataStat = fs.lstatSync(metadataPath, { throwIfNoEntry: false });
    if (!metadataStat || !metadataStat.isFile()) {
        fail('Candidate metadata.json is missing; the candidate is incomplete');
    }
    const metadataBytes = fs.readFileSync(metadataPath);
    const metadata = contract.parseMetadata(metadataBytes);
    const metadataSha256 = contract.sha256Hex(metadataBytes);
    if (
        expected.version !== undefined &&
        metadata.version !== expected.version
    ) {
        fail('Candidate version does not match the expected version');
    }
    if (
        expected.buildId !== undefined &&
        metadata.buildId !== expected.buildId
    ) {
        fail('Candidate build ID does not match the expected build ID');
    }
    if (
        expected.metadataSha256 !== undefined &&
        metadataSha256 !== expected.metadataSha256
    ) {
        fail('Candidate metadata.json does not match the expected SHA-256');
    }
    if (
        expected.sourceSha !== undefined &&
        metadata.sourceSha !== expected.sourceSha
    ) {
        fail('Candidate source SHA does not match the expected release commit');
    }

    const listed = metadata.files.map(file => file.path);
    const listedSet = new Set(listed);
    const actual = listCandidateFiles(directory).filter(
        filePath => filePath !== contract.METADATA_FILE_NAME
    );
    const actualSet = new Set(actual);
    const missing = listed.filter(filePath => !actualSet.has(filePath));
    const unlisted = actual.filter(filePath => !listedSet.has(filePath));
    if (missing.length || unlisted.length) {
        fail(
            [
                missing.length ? `Missing files: ${missing.join(', ')}` : '',
                unlisted.length ? `Unlisted files: ${unlisted.join(', ')}` : '',
            ]
                .filter(Boolean)
                .join('\n')
        );
    }

    for (const file of metadata.files) {
        contract.candidateObjectHeaders(file.path);
        const bytes = fs.readFileSync(path.join(directory, file.path));
        if (bytes.length !== file.size) {
            fail(`Candidate file size does not match metadata: ${file.path}`);
        }
        if (contract.sha256Hex(bytes) !== file.sha256) {
            fail(
                `Candidate file SHA-256 does not match metadata: ${file.path}`
            );
        }
    }
    for (const item of metadata.packages) {
        const bytes = fs.readFileSync(path.join(directory, item.path));
        if (contract.npmIntegrityFor(bytes) !== item.npmIntegrity) {
            fail(`npm tarball integrity does not match metadata: ${item.path}`);
        }
    }
    return { directory, metadata, metadataBytes, metadataSha256 };
}

function buildUploadPlan(candidate: LocalCandidate): UploadPlanEntry[] {
    const { metadata } = candidate;
    const entries = metadata.files.map(file => ({
        path: file.path,
        key: contract.candidateKey(
            metadata.version,
            metadata.buildId,
            file.path
        ),
        size: file.size,
        sha256: file.sha256,
        ...contract.candidateObjectHeaders(file.path),
    }));
    entries.push({
        path: contract.METADATA_FILE_NAME,
        key: contract.metadataKey(metadata.version, metadata.buildId),
        size: candidate.metadataBytes.length,
        sha256: candidate.metadataSha256,
        ...contract.candidateObjectHeaders(contract.METADATA_FILE_NAME),
    });
    const prefix = contract.candidatePrefix(metadata.version, metadata.buildId);
    for (const entry of entries) {
        if (
            !entry.key.startsWith(prefix) ||
            !contract.isCandidateKey(entry.key) ||
            contract.isPointerKey(entry.key)
        ) {
            fail(
                `Upload plan key is outside the candidate prefix: ${entry.key}`
            );
        }
    }
    return entries;
}

function defaultSleep(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function withRetries<T>(
    options: UploadOptions,
    action: () => Promise<T>
): Promise<T> {
    const maxAttempts = options.maxAttempts || 4;
    const sleep = options.sleep || defaultSleep;
    for (let attempt = 1; ; attempt++) {
        try {
            return await action();
        } catch (error) {
            const badDigestRetry =
                isStorageError(error, 'BadDigest') && attempt === 1;
            if (
                attempt >= maxAttempts ||
                !(isRetryable(error) || badDigestRetry)
            ) {
                throw error;
            }
            await sleep(
                (options.retryDelayMs === undefined
                    ? 500
                    : options.retryDelayMs) * Math.pow(2, attempt - 1)
            );
        }
    }
}

async function verifyReadback(
    storage: ReleaseStorage,
    entry: UploadPlanEntry,
    bytes: Buffer,
    options: UploadOptions
): Promise<void> {
    const stored = await withRetries(options, () =>
        storage.getObject(entry.key, entry.size)
    );
    if (
        stored.bytes.length !== entry.size ||
        contract.sha256Hex(stored.bytes) !== entry.sha256 ||
        !stored.bytes.equals(bytes)
    ) {
        fail(`Readback of ${entry.path} did not match the uploaded bytes`);
    }
    if (
        stored.contentType !== entry.contentType ||
        stored.cacheControl !== entry.cacheControl ||
        stored.contentEncoding
    ) {
        fail(
            `Readback of ${entry.path} has unexpected object headers; stored headers are immutable, so use a new build ID`
        );
    }
}

// Returns true when this run created the object and false when an identical
// object was already present (an idempotent re-run, or a write whose response
// was lost). Existing objects are never overwritten.
async function putCreateOnly(
    storage: ReleaseStorage,
    entry: UploadPlanEntry,
    bytes: Buffer,
    options: UploadOptions
): Promise<boolean> {
    try {
        await withRetries(options, () =>
            storage.putObjectIfAbsent(entry.key, bytes, {
                contentType: entry.contentType,
                cacheControl: entry.cacheControl,
            })
        );
        return true;
    } catch (error) {
        if (!isStorageError(error, 'PreconditionFailed')) {
            throw error;
        }
    }
    const existing = await withRetries(options, () =>
        storage.getObject(entry.key, contract.MAX_CANDIDATE_FILE_BYTES)
    );
    if (!existing.bytes.equals(bytes)) {
        fail(
            `Candidate collision: ${entry.path} already exists with different bytes. Candidates are never overwritten; package again with a new build ID.`
        );
    }
    return false;
}

async function uploadCandidate(
    candidate: LocalCandidate,
    storage: ReleaseStorage,
    options: UploadOptions = {}
): Promise<UploadSummary> {
    const log = options.log || (() => undefined);
    const plan = buildUploadPlan(candidate);
    let created = 0;
    let bytesTotal = 0;
    for (let index = 0; index < plan.length; index++) {
        const entry = plan[index];
        const bytes =
            entry.path === contract.METADATA_FILE_NAME
                ? candidate.metadataBytes
                : fs.readFileSync(path.join(candidate.directory, entry.path));
        if (contract.sha256Hex(bytes) !== entry.sha256) {
            fail(`Candidate file changed after validation: ${entry.path}`);
        }
        const wasCreated = await putCreateOnly(storage, entry, bytes, options);
        await verifyReadback(storage, entry, bytes, options);
        created += wasCreated ? 1 : 0;
        bytesTotal += bytes.length;
        log(
            `${index + 1}/${plan.length} ${
                wasCreated ? 'uploaded' : 'already present'
            } ${entry.path}`
        );
    }
    return summaryFor(candidate, plan.length, created, bytesTotal);
}

function summaryFor(
    candidate: LocalCandidate,
    objects: number,
    created: number,
    bytes: number
): UploadSummary {
    const { metadata } = candidate;
    return {
        version: metadata.version,
        buildId: metadata.buildId,
        candidatePrefix: contract.candidatePrefix(
            metadata.version,
            metadata.buildId
        ),
        metadataSha256: candidate.metadataSha256,
        objects,
        created,
        alreadyPresent: objects - created,
        bytes,
    };
}

function parseArguments(args: string[]): CliOptions {
    const options: CliOptions = {
        candidate: '',
        expected: {},
        dryRun: false,
        pod: 'local',
    };
    for (let index = 0; index < args.length; index++) {
        const argument = args[index];
        if (argument === '--dry-run') {
            options.dryRun = true;
            continue;
        }
        const value = args[++index];
        if (!value) {
            fail(`${argument} requires a value`);
        }
        if (argument === '--candidate') {
            options.candidate = value;
        } else if (argument === '--expected-version') {
            options.expected.version = contract.validateVersion(value);
        } else if (argument === '--expected-build-id') {
            options.expected.buildId = contract.validateBuildId(value);
        } else if (argument === '--expected-metadata-sha256') {
            options.expected.metadataSha256 = contract.validateSha256(
                value,
                '--expected-metadata-sha256'
            );
        } else if (argument === '--expected-source-sha') {
            if (!/^[0-9a-f]{40}$/.test(value)) {
                fail(
                    '--expected-source-sha must be a full lowercase commit SHA'
                );
            }
            options.expected.sourceSha = value;
        } else if (argument === '--pod') {
            options.pod = validatePod(value);
        } else if (argument === '--progress-file') {
            options.progressFile = value;
        } else {
            fail(`Unknown argument: ${argument}`);
        }
    }
    if (!options.candidate) {
        fail('--candidate is required');
    }
    return options;
}

function printSummary(
    log: (line: string) => void,
    summary: UploadSummary,
    pod: string,
    dryRun = false
): void {
    log(`V3 candidate ${summary.version} build ${summary.buildId} (${pod})`);
    log(`Candidate prefix: ${summary.candidatePrefix}`);
    log(`metadata.json SHA-256: ${summary.metadataSha256}`);
    log(
        dryRun
            ? `Objects: ${summary.objects} planned (storage not checked), ${summary.bytes} bytes`
            : `Objects: ${summary.objects} (${summary.created} created, ${summary.alreadyPresent} already present), ${summary.bytes} bytes`
    );
}

async function main(
    args: string[],
    dependencies: UploadDependencies = {}
): Promise<number> {
    const log = dependencies.log || ((line: string) => console.log(line));
    const options = parseArguments(args);
    const candidate = validateLocalCandidate(
        path.resolve(options.candidate),
        options.expected
    );
    const plan = buildUploadPlan(candidate);

    if (options.dryRun) {
        log(
            `Dry run: no credentials used and nothing written. ${plan.length} objects, metadata.json last.`
        );
        plan.forEach((entry, index) =>
            log(
                `${index + 1}/${plan.length} ${entry.path} ${
                    entry.size
                } bytes ${entry.contentType}`
            )
        );
        const summary = summaryFor(
            candidate,
            plan.length,
            0,
            plan.reduce((total, entry) => total + entry.size, 0)
        );
        // A dry run never reads storage, so neither count is known.
        summary.alreadyPresent = 0;
        printSummary(log, summary, options.pod, true);
        if (options.progressFile) {
            appendProgressRecord(options.progressFile, {
                pod: options.pod,
                operation: 'upload',
                status: 'dry-run',
                upload: summary,
            });
        }
        return 0;
    }

    const env = dependencies.env || process.env;
    const createStorage =
        dependencies.createStorage ||
        ((environment: NodeJS.ProcessEnv) => {
            const {
                awsCliStorageFromEnvironment,
            }: AwsCliReleaseStorageModule = require('./aws-cli-release-storage.ts');
            return awsCliStorageFromEnvironment(environment);
        });
    try {
        const summary = await uploadCandidate(candidate, createStorage(env), {
            ...dependencies.upload,
            log,
        });
        printSummary(log, summary, options.pod);
        if (options.progressFile) {
            appendProgressRecord(options.progressFile, {
                pod: options.pod,
                operation: 'upload',
                status: 'succeeded',
                upload: summary,
            });
        }
        return 0;
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Unknown upload error';
        if (options.progressFile) {
            appendProgressRecord(options.progressFile, {
                pod: options.pod,
                operation: 'upload',
                status: 'failed',
                error: message,
            });
        }
        throw error;
    }
}

if (require.main === module) {
    main(process.argv.slice(2)).then(
        code => {
            process.exitCode = code;
        },
        error => {
            console.error(
                error instanceof Error ? error.message : 'Unknown upload error'
            );
            process.exitCode = 1;
        }
    );
}

const uploader = {
    buildUploadPlan,
    main,
    parseArguments,
    uploadCandidate,
    validateLocalCandidate,
};

module.exports = uploader;

export type Uploader = typeof uploader;
