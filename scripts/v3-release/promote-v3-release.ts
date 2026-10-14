/* eslint-env node, es2021 */

// Selects which uploaded candidate a channel serves in one pod's bucket by
// rewriting that channel's active-release.json. The promoter never writes,
// copies or deletes candidate objects. Every change is a conditional write:
// If-Match on the ETag it read, or If-None-Match: * for a channel's first
// pointer, so a concurrent writer makes this run fail instead of being
// overwritten. The ETag is only a concurrency token; integrity is checked with
// bytes, size and SHA-256, and the target candidate is verified in full before
// any pointer is written.
//
// Operations (all mutating ones accept --dry-run):
//   stage --version <v> --build-id <id>              Step 1: point v3-staging
//   promote --from v3-staging --to <release-order> --version <v>
//                                                    Step 2: one release order
//   promote-ga --version <v>                         Step 3: all release orders, then ga
//   rollback --channel <c> --version <v> [--build-id <id>]
//            [--allow-downgrade] [--allow-rebuild] [--allow-upgrade]
//   show --channel <c>                               read-only
//   status [--version <v> [--build-id <id>]]         read-only: every channel
//
// status reads all five pointers in promotion order and verifies each distinct
// candidate once. A channel with no pointer is reported, not an error, unless
// --version is given; then every channel must serve that version (and build,
// with --build-id), as after Step 3. An unreadable or denied pointer, a
// candidate that fails verification or a channel off the expected release is
// reported and makes the run fail after every channel has been read.
//
// Release index: stage, promote and promote-ga record the build they move
// channels to in web-sdk/v3/releases/<version>.json, so a rollback can be
// given just a version. The entry is checked before any pointer is written
// (another build of the version is refused unless --allow-rebuild) and
// written after the pointers: created with If-None-Match: *, or replaced with
// If-Match for a rebuild. A rollback without --build-id takes the build and
// metadata SHA-256 from the entry and still verifies the candidate in full.
// The index is a lookup aid; pointers and candidates stay authoritative.
//
// Stale-run guards, checked against the pointer read immediately before each
// conditional write (whose If-Match makes that read authoritative):
//   - A lower version than the channel serves is refused. Only rollback may
//     move a channel down, and only with --allow-downgrade.
//   - The same version with a different build is refused unless
//     --allow-rebuild, for every operation.
//   - Rollback moves a channel to a newer version only with --allow-upgrade:
//     it bypasses the staging safeguard, so moving forward normally goes
//     through stage, promote or promote-ga.
//   - Each --require-branch-tip <branch> must currently point at the
//     candidate's sourceSha, so a delayed run for an older release cannot
//     move a pointer after the branch it shadows has moved on.
//
// --wait-for-staging <seconds> (promote and promote-ga) re-reads v3-staging
// with backoff while it has no pointer or serves an older version, because a
// release step can finish before the shadow upload has staged its release.
//
// node --experimental-strip-types scripts/v3-release/promote-v3-release.ts \
//     <operation> [flags] [--verify full|required] [--pod <label>] \
//     [--progress-file <file>] [--expected-metadata-sha256 <sha>] \
//     [--require-branch-tip <branch>]... [--allow-rebuild] \
//     [--wait-for-staging <seconds>]

type ActiveReleasePointer = import('./release-contract').ActiveReleasePointer;
type CandidateMetadata = import('./release-contract').CandidateMetadata;
type ReleaseContract = import('./release-contract').ReleaseContract;
type ReleaseIndexEntry = import('./release-contract').ReleaseIndexEntry;
type ChannelTransition = import('./release-progress').ChannelTransition;
type PointerSummary = import('./release-progress').PointerSummary;
type ReleaseProgress = import('./release-progress').ReleaseProgress;
type ReleaseStorage = import('./release-storage').ReleaseStorage;
type ReleaseStorageModule = import('./release-storage').ReleaseStorageModule;
type StoredObject = import('./release-storage').StoredObject;
type AwsCliReleaseStorageModule = import('./aws-cli-release-storage').AwsCliReleaseStorageModule;

const childProcess: typeof import('node:child_process') = require('node:child_process');
const contract: ReleaseContract = require('./release-contract.ts');
const {
    isStorageError,
}: ReleaseStorageModule = require('./release-storage.ts');
const {
    appendProgressRecord,
    validatePod,
}: ReleaseProgress = require('./release-progress.ts');

export type Operation =
    | 'stage'
    | 'promote'
    | 'promote-ga'
    | 'rollback'
    | 'show'
    | 'status';

export type VerifyDepth = 'full' | 'required';

export interface PromoterOptions {
    operation: Operation;
    version?: string;
    buildId?: string;
    channel?: string;
    from?: string;
    to?: string;
    expectedMetadataSha256?: string;
    verify: VerifyDepth;
    dryRun: boolean;
    pod: string;
    progressFile?: string;
    requireBranchTips: string[];
    allowDowngrade: boolean;
    allowRebuild: boolean;
    allowUpgrade: boolean;
    waitForStagingSeconds: number;
}

export interface CurrentPointer {
    channel: string;
    pointer: ActiveReleasePointer | null;
    bytes?: Buffer;
    etag?: string;
    // Set when a pointer exists but the reader would reject it.
    invalid?: string;
    // Set when the read was denied. Without s3:ListBucket, S3 answers a read
    // of a missing key with 403, so this may be a channel's first promotion.
    denied?: boolean;
}

// Resolves branch names to their current commit SHAs on the remote.
export type BranchTipReader = (
    branches: string[]
) => Promise<Record<string, string | undefined>>;

export interface ActivationPolicy {
    rollback: boolean;
    allowDowngrade: boolean;
    allowRebuild: boolean;
    allowUpgrade: boolean;
    requireBranchTips: string[];
    readBranchTips: BranchTipReader;
}

export interface VerifiedCandidate {
    pointer: ActiveReleasePointer;
    metadata: CandidateMetadata;
    objectsVerified: number;
}

export type ReleaseIndexStatus =
    | 'planned'
    | 'created'
    | 'replaced'
    | 'unchanged'
    | 'used';

export interface ReleaseIndexOutcome {
    status: ReleaseIndexStatus;
    entry: ReleaseIndexEntry;
    // What the entry held before: "none", "build <id>" or "unreadable (...)".
    before: string;
}

interface ReleaseIndexPlan {
    write: 'create' | 'replace' | 'none';
    entry: ReleaseIndexEntry;
    before: string;
    bytes: Buffer;
    etag?: string;
}

export interface PromotionResult {
    operation: Operation;
    candidate?: VerifiedCandidate;
    transitions: ChannelTransition[];
    releaseIndex?: ReleaseIndexOutcome;
}

export interface StagingWait {
    sleep: (milliseconds: number) => Promise<void>;
    now: () => number;
    log: (line: string) => void;
}

export interface PromoterDependencies {
    env?: NodeJS.ProcessEnv;
    log?: (line: string) => void;
    createStorage?: (env: NodeJS.ProcessEnv) => ReleaseStorage;
    readBranchTips?: BranchTipReader;
    sleep?: StagingWait['sleep'];
    now?: StagingWait['now'];
}

// The workflow's AWS credentials for a pod last 15 minutes, and a full
// verification and the writes still need several minutes after the wait.
const MAX_STAGING_WAIT_SECONDS = 480;
const STAGING_WAIT_FIRST_DELAY_SECONDS = 15;
const STAGING_WAIT_MAX_DELAY_SECONDS = 120;
// Each re-read during the wait times out after this long, and the last pause
// ends this long before the deadline, so the wait never outlasts its bound.
const STAGING_WAIT_READ_TIMEOUT_SECONDS = 30;
const BRANCH_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/;
const COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/;
// Errors after which a pointer write may have been applied even though no
// success response arrived.
const AMBIGUOUS_WRITE_ERRORS = [
    'Transient',
    'Throttled',
    'ConditionalConflict',
    'Unknown',
] as const;

const OPERATIONS: readonly Operation[] = [
    'stage',
    'promote',
    'promote-ga',
    'rollback',
    'show',
    'status',
];

// Step 3 order: release orders first, then every other workspace.
const GA_PROMOTION_CHANNELS: readonly string[] = [
    ...contract.RELEASE_ORDER_CHANNELS,
    contract.GA_CHANNEL,
];
const STATUS_CHANNELS: readonly string[] = [
    contract.STAGING_CHANNEL,
    ...GA_PROMOTION_CHANNELS,
];

class PromotionError extends Error {
    readonly transitions: ChannelTransition[];
    readonly releaseIndex?: ReleaseIndexOutcome;

    constructor(
        message: string,
        transitions: ChannelTransition[],
        releaseIndex?: ReleaseIndexOutcome
    ) {
        super(message);
        // Keeps instanceof working when compiled to ES5 (as Jest does).
        Object.setPrototypeOf(this, PromotionError.prototype);
        this.name = 'PromotionError';
        this.transitions = transitions;
        this.releaseIndex = releaseIndex;
    }
}

function fail(message: string): never {
    throw new Error(message);
}

function summaryOf(pointer: ActiveReleasePointer): PointerSummary {
    return {
        version: pointer.version,
        buildId: pointer.buildId,
        metadataSha256: pointer.metadataSha256,
    };
}

function beforeOf(current: CurrentPointer): PointerSummary | null | string {
    if (current.invalid !== undefined) {
        return current.invalid;
    }
    if (current.denied) {
        return 'read denied; written create-only';
    }
    return current.pointer ? summaryOf(current.pointer) : null;
}

// A denied read fails unless `allowDenied`: only a pointer write can use it,
// because its create-only fallback cannot overwrite a pointer it failed to
// read. Reads that feed a decision (the staging safeguard, show) fail closed.
async function readCurrentPointer(
    storage: ReleaseStorage,
    channel: string,
    allowDenied = false,
    timeoutMs?: number
): Promise<CurrentPointer> {
    let stored: StoredObject;
    try {
        stored = await storage.getObject(
            contract.pointerKey(channel),
            contract.MAX_POINTER_BYTES,
            timeoutMs
        );
    } catch (error) {
        if (isStorageError(error, 'NotFound')) {
            return { channel, pointer: null };
        }
        if (isStorageError(error, 'AccessDenied')) {
            if (allowDenied) {
                return { channel, pointer: null, denied: true };
            }
            fail(
                `Reading the ${channel} pointer was denied. Without s3:ListBucket a missing pointer reads as denied, so this channel may have no pointer yet.`
            );
        }
        throw error;
    }
    try {
        return {
            channel,
            pointer: contract.parsePointer(stored.bytes, {
                canonical: false,
                expectedChannel: channel,
            }),
            bytes: stored.bytes,
            etag: stored.etag,
        };
    } catch (error) {
        return {
            channel,
            pointer: null,
            bytes: stored.bytes,
            etag: stored.etag,
            invalid:
                error instanceof Error ? error.message : 'unreadable pointer',
        };
    }
}

function assertCandidateHeaders(
    relativePath: string,
    stored: {
        contentType?: string;
        cacheControl?: string;
        contentEncoding?: string;
    }
): void {
    const expected = contract.candidateObjectHeaders(relativePath);
    if (
        stored.contentType !== expected.contentType ||
        stored.cacheControl !== expected.cacheControl ||
        stored.contentEncoding
    ) {
        fail(`Candidate object ${relativePath} has unexpected headers`);
    }
}

// Verifies the candidate a pointer would select, as the reader will: the
// metadata hash, schema and identity, then each file's size and SHA-256.
// "required" checks the reader's required core bundles; "full" checks every
// inventoried file and each npm tarball's integrity.
async function verifyCandidate(
    storage: ReleaseStorage,
    pointer: ActiveReleasePointer,
    depth: VerifyDepth
): Promise<VerifiedCandidate> {
    const metadataKey = `${pointer.candidatePrefix}${contract.METADATA_FILE_NAME}`;
    const stored = await storage.getObject(
        metadataKey,
        contract.MAX_METADATA_BYTES
    );
    if (
        contract.sha256Hex(stored.bytes) !==
        pointer.metadataSha256.toLowerCase()
    ) {
        fail('Candidate metadata.json does not match the expected SHA-256');
    }
    assertCandidateHeaders(contract.METADATA_FILE_NAME, stored);
    const metadata = contract.parseMetadata(stored.bytes);
    contract.validateMetadataIdentity(metadata, pointer);

    const files =
        depth === 'full'
            ? metadata.files
            : metadata.files.filter(file =>
                  contract.REQUIRED_CORE_FILES.includes(file.path)
              );
    const integrity = new Map<string, string>();
    for (const item of metadata.packages) {
        integrity.set(item.path, item.npmIntegrity);
    }
    for (const file of files) {
        const object = await storage.getObject(
            `${pointer.candidatePrefix}${file.path}`,
            file.size
        );
        if (
            object.bytes.length !== file.size ||
            contract.sha256Hex(object.bytes) !== file.sha256
        ) {
            fail(`Candidate file ${file.path} does not match its metadata`);
        }
        assertCandidateHeaders(file.path, object);
        const expectedIntegrity = integrity.get(file.path);
        if (
            depth === 'full' &&
            expectedIntegrity !== undefined &&
            contract.npmIntegrityFor(object.bytes) !== expectedIntegrity
        ) {
            fail(`npm tarball ${file.path} does not match its integrity`);
        }
    }
    return { pointer, metadata, objectsVerified: files.length + 1 };
}

// Resolves and verifies the candidate for an explicit version and build ID.
async function verifyExplicitCandidate(
    storage: ReleaseStorage,
    version: string,
    buildId: string,
    expectedMetadataSha256: string | undefined,
    depth: VerifyDepth,
    expectedFrom = '--expected-metadata-sha256'
): Promise<VerifiedCandidate> {
    const stored = await storage.getObject(
        contract.metadataKey(version, buildId),
        contract.MAX_METADATA_BYTES
    );
    const metadataSha256 = contract.sha256Hex(stored.bytes);
    if (
        expectedMetadataSha256 !== undefined &&
        metadataSha256 !== expectedMetadataSha256
    ) {
        fail(`Candidate metadata.json does not match ${expectedFrom}`);
    }
    return verifyCandidate(
        storage,
        contract.createPointer({ version, buildId }, metadataSha256),
        depth
    );
}

// The staging safeguard: Steps 2 and 3 promote only what v3-staging serves,
// and only when it serves the version the operator approved.
async function readStagingCandidate(
    storage: ReleaseStorage,
    options: PromoterOptions,
    wait: StagingWait
): Promise<ActiveReleasePointer> {
    const version = requireOption(options.version, '--version');
    const started = wait.now();
    const deadline = started + options.waitForStagingSeconds * 1000;
    let current = await readCurrentPointer(storage, contract.STAGING_CHANNEL);
    const readTimeout = STAGING_WAIT_READ_TIMEOUT_SECONDS * 1000;
    let delay = STAGING_WAIT_FIRST_DELAY_SECONDS * 1000;
    for (;;) {
        let serving: string;
        if (current.invalid === undefined && !current.bytes) {
            serving = 'no pointer';
        } else if (
            current.pointer &&
            contract.compareVersions(current.pointer.version, version) < 0
        ) {
            serving = current.pointer.version;
        } else {
            break;
        }
        const pause = Math.min(delay, deadline - readTimeout - wait.now());
        if (pause <= 0) {
            break;
        }
        wait.log(
            `v3-staging serves ${serving}, not yet ${version}; checking again in ${Math.ceil(
                pause / 1000
            )}s (waited ${Math.floor((wait.now() - started) / 1000)}s of ${
                options.waitForStagingSeconds
            }s)`
        );
        await wait.sleep(pause);
        delay = Math.min(delay * 2, STAGING_WAIT_MAX_DELAY_SECONDS * 1000);
        current = await readCurrentPointer(
            storage,
            contract.STAGING_CHANNEL,
            false,
            readTimeout
        );
    }
    if (current.invalid !== undefined || !current.bytes) {
        fail(
            `v3-staging has no valid pointer${
                current.invalid ? ` (${current.invalid})` : ''
            }; refusing to promote`
        );
    }
    const staging = contract.parsePointer(current.bytes);
    if (staging.version !== options.version) {
        fail(
            `v3-staging serves ${staging.version}, not ${options.version}; refusing to promote`
        );
    }
    if (options.buildId !== undefined && staging.buildId !== options.buildId) {
        fail(
            `v3-staging serves build ${staging.buildId}, not ${options.buildId}; refusing to promote`
        );
    }
    if (
        options.expectedMetadataSha256 !== undefined &&
        staging.metadataSha256 !== options.expectedMetadataSha256
    ) {
        fail(
            'v3-staging metadata SHA-256 does not match --expected-metadata-sha256'
        );
    }
    return staging;
}

// Walks the reader's chain from the pointer key after a write.
async function verifyReaderChain(
    storage: ReleaseStorage,
    channel: string,
    expectedBytes: Buffer
): Promise<void> {
    const stored = await storage.getObject(
        contract.pointerKey(channel),
        contract.MAX_POINTER_BYTES
    );
    if (!stored.bytes.equals(expectedBytes)) {
        fail(`Pointer readback for ${channel} does not match what was written`);
    }
    if (!hasPointerHeaders(stored)) {
        fail(`Pointer for ${channel} has unexpected headers`);
    }
    await verifyCandidate(
        storage,
        contract.parsePointer(stored.bytes),
        'required'
    );
}

// Each move away from what a channel serves needs the flag that names it: an
// older version --allow-downgrade (rollback only), a newer one by rollback
// --allow-upgrade, another build of the same version --allow-rebuild. An
// unreadable or absent pointer has no version to compare with.
function assertNoRegression(
    channel: string,
    current: CurrentPointer,
    target: ActiveReleasePointer,
    policy: ActivationPolicy
): void {
    if (!current.pointer) {
        return;
    }
    const order = contract.compareVersions(
        target.version,
        current.pointer.version
    );
    if (order < 0 && !policy.allowDowngrade) {
        fail(
            `${channel} serves ${current.pointer.version}, which is newer than ${target.version}; refusing to move it backwards. Use rollback with --allow-downgrade to do that deliberately.`
        );
    }
    if (order > 0 && policy.rollback && !policy.allowUpgrade) {
        fail(
            `${channel} serves ${current.pointer.version}, which is older than ${target.version}; rollback moves a channel forward only with --allow-upgrade. Prefer stage, promote or promote-ga, which keep the staging safeguard.`
        );
    }
    if (order === 0 && !policy.allowRebuild) {
        fail(
            `${channel} already serves ${current.pointer.version} as build ${current.pointer.buildId}; refusing to replace it with build ${target.buildId} without --allow-rebuild.`
        );
    }
}

// Refuses to write for a release the shadowed branches have moved past.
async function assertBranchTips(
    candidate: VerifiedCandidate,
    policy: ActivationPolicy
): Promise<void> {
    if (policy.requireBranchTips.length === 0) {
        return;
    }
    const tips = await policy.readBranchTips(policy.requireBranchTips);
    for (const branch of policy.requireBranchTips) {
        const tip = tips[branch];
        if (tip === undefined) {
            fail(`Branch ${branch} was not found; refusing to move pointers`);
        }
        if (tip !== candidate.metadata.sourceSha) {
            fail(
                `Branch ${branch} is at ${tip}, not the candidate's source ${candidate.metadata.sourceSha}; a newer release has moved it, so this run will not move pointers.`
            );
        }
    }
}

function hasPointerHeaders(stored: StoredObject): boolean {
    return (
        stored.contentType === contract.POINTER_HEADERS.contentType &&
        stored.cacheControl === contract.POINTER_HEADERS.cacheControl &&
        !stored.contentEncoding
    );
}

// After an ambiguous write error the write may still have been applied.
// Reports whether the key (a pointer or a release index entry, which share
// headers) now holds exactly the target bytes and headers.
async function writeLanded(
    storage: ReleaseStorage,
    key: string,
    targetBytes: Buffer
): Promise<boolean> {
    try {
        const stored = await storage.getObject(key, contract.MAX_POINTER_BYTES);
        return stored.bytes.equals(targetBytes) && hasPointerHeaders(stored);
    } catch {
        return false;
    }
}

// Appends the channel's transition to `transitions` as soon as its outcome is
// known, so a write followed by a failed readback is still reported with the
// pointer it replaced.
async function activateChannel(
    storage: ReleaseStorage,
    channel: string,
    candidate: VerifiedCandidate,
    dryRun: boolean,
    transitions: ChannelTransition[],
    policy: ActivationPolicy
): Promise<void> {
    const target = candidate.pointer;
    const current = await readCurrentPointer(storage, channel, true);
    const targetBytes = contract.serializePointer(target);
    const transition: ChannelTransition = {
        channel,
        before: beforeOf(current),
        after: summaryOf(target),
        status: 'planned',
    };
    if (current.bytes && current.bytes.equals(targetBytes)) {
        transition.status = 'unchanged';
        transitions.push(transition);
        await verifyReaderChain(storage, channel, targetBytes);
        return;
    }
    assertNoRegression(channel, current, target, policy);
    await assertBranchTips(candidate, policy);
    if (dryRun) {
        transitions.push(transition);
        return;
    }
    const key = contract.pointerKey(channel);
    try {
        if (current.bytes && current.etag) {
            await storage.putObjectIfMatch(
                key,
                targetBytes,
                current.etag,
                contract.POINTER_HEADERS
            );
        } else {
            await storage.putObjectIfAbsent(
                key,
                targetBytes,
                contract.POINTER_HEADERS
            );
        }
    } catch (error) {
        // A PreconditionFailed can be the CLI retrying this write after its
        // first attempt landed, so it is only a refusal if the target is absent.
        if (isStorageError(error, 'PreconditionFailed')) {
            if (!(await writeLanded(storage, key, targetBytes))) {
                fail(
                    current.denied
                        ? `The ${channel} pointer exists but reading it was denied; nothing was overwritten. Check the role's read access to the pointer key.`
                        : `The ${channel} pointer changed after it was read and does not name this candidate. Check the channel with "show", then re-run.`
                );
            }
        } else if (
            !AMBIGUOUS_WRITE_ERRORS.some(code => isStorageError(error, code)) ||
            !(await writeLanded(storage, key, targetBytes))
        ) {
            throw error;
        }
    }
    transition.status = 'updated';
    transitions.push(transition);
    await verifyReaderChain(storage, channel, targetBytes);
}

async function activateChannels(
    storage: ReleaseStorage,
    channels: readonly string[],
    candidate: VerifiedCandidate,
    dryRun: boolean,
    policy: ActivationPolicy
): Promise<ChannelTransition[]> {
    const transitions: ChannelTransition[] = [];
    for (const channel of channels) {
        try {
            await activateChannel(
                storage,
                channel,
                candidate,
                dryRun,
                transitions,
                policy
            );
        } catch (error) {
            throw new PromotionError(
                error instanceof Error ? error.message : 'Promotion failed',
                transitions
            );
        }
    }
    return transitions;
}

interface CurrentReleaseIndex {
    entry: ReleaseIndexEntry | null;
    bytes?: Buffer;
    etag?: string;
    invalid?: string;
}

// Fails closed on a denied read, with `deniedHint` saying what to do: unlike
// a pointer, the index is checked before anything moves, so a denied read
// must stop the run rather than fall back to a create-only write later.
async function readReleaseIndex(
    storage: ReleaseStorage,
    version: string,
    deniedHint: string
): Promise<CurrentReleaseIndex> {
    let stored: StoredObject;
    try {
        stored = await storage.getObject(
            contract.releaseIndexKey(version),
            contract.MAX_RELEASE_INDEX_BYTES
        );
    } catch (error) {
        if (isStorageError(error, 'NotFound')) {
            return { entry: null };
        }
        if (isStorageError(error, 'AccessDenied')) {
            fail(
                `Reading the release index entry for ${version} was denied (without s3:ListBucket on the index, a missing entry also reads as denied); ${deniedHint}`
            );
        }
        throw error;
    }
    try {
        return {
            entry: contract.parseReleaseIndexEntry(stored.bytes, version),
            bytes: stored.bytes,
            etag: stored.etag,
        };
    } catch (error) {
        return {
            entry: null,
            bytes: stored.bytes,
            etag: stored.etag,
            invalid:
                error instanceof Error ? error.message : 'unreadable entry',
        };
    }
}

function describeIndexEntry(current: CurrentReleaseIndex): string {
    if (current.invalid !== undefined) {
        return `unreadable (${current.invalid})`;
    }
    return current.entry ? `build ${current.entry.buildId}` : 'none';
}

// Decides the index write for a candidate before any pointer moves, so a
// conflicting entry stops the run while every channel is still untouched.
async function planReleaseIndex(
    storage: ReleaseStorage,
    pointer: ActiveReleasePointer,
    allowRebuild: boolean
): Promise<ReleaseIndexPlan> {
    const entry = contract.createReleaseIndexEntry(pointer);
    const bytes = contract.serializeReleaseIndexEntry(entry);
    const current = await readReleaseIndex(
        storage,
        entry.version,
        "no pointer was moved. Check the role's access to the release index."
    );
    const before = describeIndexEntry(current);
    if (!current.bytes) {
        return { write: 'create', entry, before, bytes };
    }
    if (current.bytes.equals(bytes)) {
        return { write: 'none', entry, before, bytes, etag: current.etag };
    }
    if (!allowRebuild) {
        fail(
            `The release index names ${before} for ${entry.version}, not build ${entry.buildId}; refusing to move pointers to another build of that version without --allow-rebuild.`
        );
    }
    return { write: 'replace', entry, before, bytes, etag: current.etag };
}

async function writeReleaseIndex(
    storage: ReleaseStorage,
    plan: ReleaseIndexPlan
): Promise<ReleaseIndexOutcome> {
    const outcome = (status: ReleaseIndexStatus): ReleaseIndexOutcome => ({
        status,
        entry: plan.entry,
        before: plan.before,
    });
    const key = contract.releaseIndexKey(plan.entry.version);
    try {
        // A matching entry is rewritten too, with If-Match on the ETag read
        // when it was planned: of two runs that planned against one entry
        // (this one and a concurrent rebuild), only one can then succeed.
        // Only a create has no ETag.
        if (plan.etag) {
            await storage.putObjectIfMatch(
                key,
                plan.bytes,
                plan.etag,
                contract.POINTER_HEADERS
            );
        } else {
            await storage.putObjectIfAbsent(
                key,
                plan.bytes,
                contract.POINTER_HEADERS
            );
        }
    } catch (error) {
        if (isStorageError(error, 'PreconditionFailed')) {
            if (!(await writeLanded(storage, key, plan.bytes))) {
                fail(
                    `The release index entry for ${plan.entry.version} changed during this run and does not name build ${plan.entry.buildId}. The pointers have moved; check the entry, then re-run.`
                );
            }
        } else if (
            !AMBIGUOUS_WRITE_ERRORS.some(code => isStorageError(error, code)) ||
            !(await writeLanded(storage, key, plan.bytes))
        ) {
            throw error;
        }
    }
    if (!(await writeLanded(storage, key, plan.bytes))) {
        fail(
            `Release index readback for ${plan.entry.version} does not match what was written`
        );
    }
    return outcome(
        plan.write === 'none'
            ? 'unchanged'
            : plan.write === 'replace'
            ? 'replaced'
            : 'created'
    );
}

// Finds the build a version-only rollback restores. Fails closed: a missing,
// denied or unreadable entry needs an explicit --build-id.
async function resolveIndexedBuild(
    storage: ReleaseStorage,
    version: string
): Promise<ReleaseIndexEntry> {
    const current = await readReleaseIndex(
        storage,
        version,
        'pass --build-id instead.'
    );
    if (current.invalid !== undefined) {
        fail(
            `The release index entry for ${version} is unreadable (${current.invalid}); pass --build-id instead.`
        );
    }
    if (!current.entry) {
        fail(
            `The release index has no entry for ${version}; pass --build-id (the promotion's run summary prints it).`
        );
    }
    return current.entry;
}

function requireOption(value: string | undefined, flag: string): string {
    if (value === undefined) {
        fail(`${flag} is required for this operation`);
    }
    return value;
}

// Reads branch tips with `git ls-remote`, which needs no credentials for a
// public repository and does not depend on the local checkout's refs.
function defaultSleep(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function gitBranchTipReader(cwd: string = process.cwd()): BranchTipReader {
    return async branches => {
        const output = childProcess.execFileSync(
            'git',
            [
                'ls-remote',
                '--heads',
                'origin',
                ...branches.map(branch => `refs/heads/${branch}`),
            ],
            { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
        );
        const tips: Record<string, string> = {};
        for (const line of output.split('\n').filter(Boolean)) {
            const [sha, ref] = line.split('\t');
            if (COMMIT_SHA_PATTERN.test(sha) && ref.startsWith('refs/heads/')) {
                tips[ref.slice('refs/heads/'.length)] = sha;
            }
        }
        return tips;
    };
}

function messageOf(error: unknown): string {
    return error instanceof Error ? error.message : 'unknown error';
}

// expected, when set, is the version (and optionally build) every channel
// must serve, as after Step 3.
async function readStatus(
    storage: ReleaseStorage,
    depth: VerifyDepth,
    expected: { version?: string; buildId?: string }
): Promise<PromotionResult> {
    const transitions: ChannelTransition[] = [];
    const problems: string[] = [];
    // Channels usually share a candidate; each is verified once.
    const verified = new Map<string, string | undefined>();
    for (const channel of STATUS_CHANNELS) {
        let current: CurrentPointer;
        try {
            current = await readCurrentPointer(storage, channel);
        } catch (error) {
            transitions.push({
                channel,
                before: 'read failed',
                after: null,
                status: 'read',
            });
            problems.push(`${channel}: ${messageOf(error)}`);
            continue;
        }
        transitions.push({
            channel,
            before: beforeOf(current),
            after: current.pointer ? summaryOf(current.pointer) : null,
            status: 'read',
        });
        if (current.invalid !== undefined) {
            problems.push(
                `${channel}: unreadable pointer (${current.invalid})`
            );
        }
        if (expected.version !== undefined && current.invalid === undefined) {
            const serves = current.pointer;
            if (
                !serves ||
                serves.version !== expected.version ||
                (expected.buildId !== undefined &&
                    serves.buildId !== expected.buildId)
            ) {
                problems.push(
                    `${channel}: serves ${contract.describePointer(
                        serves
                    )}, expected ${expected.version}${
                        expected.buildId !== undefined
                            ? ` build ${expected.buildId}`
                            : ''
                    }`
                );
            }
        }
        if (!current.pointer) {
            continue;
        }
        const key = `${current.pointer.candidatePrefix}${current.pointer.metadataSha256}`;
        if (!verified.has(key)) {
            try {
                await verifyCandidate(storage, current.pointer, depth);
                verified.set(key, undefined);
            } catch (error) {
                verified.set(key, messageOf(error));
            }
        }
        const failure = verified.get(key);
        if (failure !== undefined) {
            problems.push(
                `${channel}: candidate failed verification: ${failure}`
            );
        }
    }
    if (problems.length > 0) {
        throw new PromotionError(
            `Status found ${problems.length} problem${
                problems.length === 1 ? '' : 's'
            }: ${problems.join('; ')}`,
            transitions
        );
    }
    return { operation: 'status', transitions };
}

async function runOperation(
    storage: ReleaseStorage,
    options: PromoterOptions,
    readBranchTips: BranchTipReader = gitBranchTipReader(),
    wait: StagingWait = {
        sleep: defaultSleep,
        now: Date.now,
        log: () => undefined,
    }
): Promise<PromotionResult> {
    const policy: ActivationPolicy = {
        rollback: options.operation === 'rollback',
        allowDowngrade: options.allowDowngrade,
        allowRebuild: options.allowRebuild,
        allowUpgrade: options.allowUpgrade,
        requireBranchTips: options.requireBranchTips,
        readBranchTips,
    };
    const { operation } = options;
    if (operation === 'show') {
        const channel = requireOption(options.channel, '--channel');
        const current = await readCurrentPointer(storage, channel);
        const transition: ChannelTransition = {
            channel,
            before: beforeOf(current),
            after: current.pointer ? summaryOf(current.pointer) : null,
            status: 'read',
        };
        if (!current.pointer) {
            return { operation, transitions: [transition] };
        }
        try {
            const candidate = await verifyCandidate(
                storage,
                current.pointer,
                options.verify
            );
            return { operation, candidate, transitions: [transition] };
        } catch (error) {
            throw new PromotionError(
                `The ${channel} candidate failed verification: ${
                    error instanceof Error ? error.message : 'unknown error'
                }`,
                [transition]
            );
        }
    }

    if (operation === 'status') {
        return readStatus(storage, options.verify, {
            version: options.version,
            buildId: options.buildId,
        });
    }

    let channels: readonly string[];
    let candidate: VerifiedCandidate;
    let indexPlan: ReleaseIndexPlan | undefined;
    let releaseIndex: ReleaseIndexOutcome | undefined;
    if (operation === 'rollback') {
        channels = [requireOption(options.channel, '--channel')];
        const version = requireOption(options.version, '--version');
        let buildId = options.buildId;
        let expectedMetadataSha256 = options.expectedMetadataSha256;
        let expectedFrom: string | undefined;
        if (buildId === undefined) {
            const entry = await resolveIndexedBuild(storage, version);
            if (
                expectedMetadataSha256 !== undefined &&
                expectedMetadataSha256 !== entry.metadataSha256
            ) {
                fail(
                    `The release index entry for ${version} does not match --expected-metadata-sha256`
                );
            }
            buildId = entry.buildId;
            expectedMetadataSha256 = entry.metadataSha256;
            expectedFrom = `the release index entry for ${version}`;
            releaseIndex = {
                status: 'used',
                entry,
                before: `build ${buildId}`,
            };
        }
        candidate = await verifyExplicitCandidate(
            storage,
            version,
            buildId,
            expectedMetadataSha256,
            options.verify,
            expectedFrom
        );
    } else {
        if (operation === 'stage') {
            channels = [contract.STAGING_CHANNEL];
            candidate = await verifyExplicitCandidate(
                storage,
                requireOption(options.version, '--version'),
                requireOption(options.buildId, '--build-id'),
                options.expectedMetadataSha256,
                options.verify
            );
        } else {
            requireOption(options.version, '--version');
            channels =
                operation === 'promote'
                    ? [requireOption(options.to, '--to')]
                    : GA_PROMOTION_CHANNELS;
            const staging = await readStagingCandidate(storage, options, wait);
            candidate = await verifyCandidate(storage, staging, options.verify);
        }
        indexPlan = await planReleaseIndex(
            storage,
            candidate.pointer,
            options.allowRebuild
        );
        releaseIndex = {
            status: indexPlan.write === 'none' ? 'unchanged' : 'planned',
            entry: indexPlan.entry,
            before: indexPlan.before,
        };
    }
    const transitions = await activateChannels(
        storage,
        channels,
        candidate,
        options.dryRun,
        policy
    );
    if (indexPlan && !options.dryRun) {
        try {
            releaseIndex = await writeReleaseIndex(storage, indexPlan);
        } catch (error) {
            throw new PromotionError(
                error instanceof Error
                    ? error.message
                    : 'Writing the release index failed',
                transitions,
                {
                    status: 'planned',
                    entry: indexPlan.entry,
                    before: indexPlan.before,
                }
            );
        }
    }
    return { operation, candidate, transitions, releaseIndex };
}

function parseArguments(args: string[]): PromoterOptions {
    const operation = args[0] as Operation;
    if (!OPERATIONS.includes(operation)) {
        fail(`Operation must be one of: ${OPERATIONS.join(', ')}`);
    }
    const options: PromoterOptions = {
        operation,
        verify: 'full',
        dryRun: false,
        pod: 'local',
        requireBranchTips: [],
        allowDowngrade: false,
        allowRebuild: false,
        allowUpgrade: false,
        waitForStagingSeconds: 0,
    };
    const switches: Record<
        string,
        'dryRun' | 'allowDowngrade' | 'allowRebuild' | 'allowUpgrade'
    > = {
        '--dry-run': 'dryRun',
        '--allow-downgrade': 'allowDowngrade',
        '--allow-rebuild': 'allowRebuild',
        '--allow-upgrade': 'allowUpgrade',
    };
    for (let index = 1; index < args.length; index++) {
        const argument = args[index];
        if (Object.prototype.hasOwnProperty.call(switches, argument)) {
            options[switches[argument]] = true;
            continue;
        }
        const value = args[++index];
        if (!value) {
            fail(`${argument} requires a value`);
        }
        switch (argument) {
            case '--version':
                options.version = contract.validateVersion(value);
                break;
            case '--build-id':
                options.buildId = contract.validateBuildId(value);
                break;
            case '--channel':
                options.channel = contract.validateChannel(value);
                break;
            case '--from':
                options.from = contract.validateChannel(value);
                break;
            case '--to':
                options.to = contract.validateChannel(value);
                break;
            case '--expected-metadata-sha256':
                options.expectedMetadataSha256 = contract.validateSha256(
                    value,
                    '--expected-metadata-sha256'
                );
                break;
            case '--verify':
                if (value !== 'full' && value !== 'required') {
                    fail('--verify must be full or required');
                }
                options.verify = value;
                break;
            case '--pod':
                options.pod = validatePod(value);
                break;
            case '--progress-file':
                options.progressFile = value;
                break;
            case '--require-branch-tip':
                if (!BRANCH_PATTERN.test(value) || value.includes('..')) {
                    fail('--require-branch-tip must be a branch name');
                }
                if (!options.requireBranchTips.includes(value)) {
                    options.requireBranchTips.push(value);
                }
                break;
            case '--wait-for-staging':
                if (!/^[1-9][0-9]{0,3}$/.test(value)) {
                    fail(
                        '--wait-for-staging must be a whole number of seconds'
                    );
                }
                options.waitForStagingSeconds = Number(value);
                if (options.waitForStagingSeconds > MAX_STAGING_WAIT_SECONDS) {
                    fail(
                        `--wait-for-staging must be at most ${MAX_STAGING_WAIT_SECONDS} seconds`
                    );
                }
                break;
            default:
                fail(`Unknown argument: ${argument}`);
        }
    }
    validateCombination(options);
    return options;
}

function validateCombination(options: PromoterOptions): void {
    const allowed: Record<Operation, string[]> = {
        stage: ['version', 'buildId'],
        promote: ['version', 'buildId', 'from', 'to'],
        'promote-ga': ['version', 'buildId'],
        rollback: ['version', 'buildId', 'channel'],
        show: ['channel'],
        status: ['version', 'buildId'],
    };
    for (const name of ['version', 'buildId', 'channel', 'from', 'to']) {
        if (
            options[name as keyof PromoterOptions] !== undefined &&
            !allowed[options.operation].includes(name)
        ) {
            fail(
                `${options.operation} does not accept --${name.replace(
                    'buildId',
                    'build-id'
                )}`
            );
        }
    }
    const readOnly =
        options.operation === 'show' || options.operation === 'status';
    if (
        options.operation === 'status' &&
        options.buildId !== undefined &&
        options.version === undefined
    ) {
        fail('status --build-id needs --version');
    }
    if (readOnly && options.dryRun) {
        fail(`${options.operation} is read-only and does not accept --dry-run`);
    }
    if (options.allowDowngrade && options.operation !== 'rollback') {
        fail('Only rollback accepts --allow-downgrade');
    }
    if (options.allowUpgrade && options.operation !== 'rollback') {
        fail('Only rollback accepts --allow-upgrade');
    }
    if (options.allowRebuild && readOnly) {
        fail(`${options.operation} does not accept --allow-rebuild`);
    }
    if (
        options.requireBranchTips.length > 0 &&
        (options.operation === 'rollback' || readOnly)
    ) {
        // A rollback moves a channel to an explicit recovery target, whose
        // source is usually no longer a branch tip.
        fail(`${options.operation} does not accept --require-branch-tip`);
    }
    if (
        options.waitForStagingSeconds > 0 &&
        options.operation !== 'promote' &&
        options.operation !== 'promote-ga'
    ) {
        fail(`${options.operation} does not accept --wait-for-staging`);
    }
    if (options.operation === 'promote') {
        // Release orders take no order among themselves: Step 2 may move
        // release-order-a, -b and -c in any order, and this mirrors it. The
        // only source is v3-staging.
        if (options.from !== contract.STAGING_CHANNEL) {
            fail('promote requires --from v3-staging');
        }
        if (
            options.to === undefined ||
            !contract.RELEASE_ORDER_CHANNELS.includes(options.to)
        ) {
            fail(
                `promote --to must be a release order (${contract.RELEASE_ORDER_CHANNELS.join(
                    ', '
                )}); use promote-ga for ga`
            );
        }
    }
}

function describeBefore(value: PointerSummary | null | string): string {
    if (value === null) {
        return 'none';
    }
    if (typeof value === 'string') {
        return `unreadable (${value})`;
    }
    return `${value.version} build ${value.buildId} metadata ${value.metadataSha256}`;
}

function printResult(
    log: (line: string) => void,
    options: PromoterOptions,
    result: {
        candidate?: VerifiedCandidate;
        transitions: ChannelTransition[];
        releaseIndex?: ReleaseIndexOutcome;
    }
): void {
    const index = result.releaseIndex;
    if (index) {
        log(
            index.status === 'used'
                ? `Release index: ${index.entry.version} is build ${index.entry.buildId} metadata ${index.entry.metadataSha256}`
                : `Release index ${index.entry.version}: ${index.before} -> build ${index.entry.buildId} [${index.status}]`
        );
    }
    if (result.candidate) {
        log(
            `Candidate: ${contract.describePointer(
                result.candidate.pointer
            )} (verified ${options.verify}, ${
                result.candidate.objectsVerified
            } objects)`
        );
    }
    for (const transition of result.transitions) {
        log(
            `${transition.channel} before: ${describeBefore(transition.before)}`
        );
        log(
            `${transition.channel} after:  ${describeBefore(
                transition.after
            )} [${transition.status}]`
        );
        const before = transition.before;
        if (
            (transition.status === 'updated' ||
                transition.status === 'planned') &&
            before !== null &&
            typeof before !== 'string' &&
            transition.after !== null
        ) {
            // Names the build, so it works for a version the release index
            // predates. Restoring the previous pointer needs the flag for its
            // direction: older, the same version, or newer (after a rollback).
            const order = contract.compareVersions(
                before.version,
                transition.after.version
            );
            const flag =
                order < 0
                    ? '--allow-downgrade'
                    : order === 0
                    ? '--allow-rebuild'
                    : '--allow-upgrade';
            log(
                `${transition.channel} rollback target: rollback --channel ${transition.channel} --version ${before.version} --build-id ${before.buildId} ${flag} --pod ${options.pod}`
            );
        }
    }
}

async function main(
    args: string[],
    dependencies: PromoterDependencies = {}
): Promise<number> {
    const log = dependencies.log || ((line: string) => console.log(line));
    const options = parseArguments(args);
    const env = dependencies.env || process.env;
    const createStorage =
        dependencies.createStorage ||
        ((environment: NodeJS.ProcessEnv) => {
            const {
                awsCliStorageFromEnvironment,
            }: AwsCliReleaseStorageModule = require('./aws-cli-release-storage.ts');
            return awsCliStorageFromEnvironment(environment);
        });
    log(
        `Operation: ${options.operation} (pod ${options.pod})${
            options.dryRun ? ' dry run: no pointer will be written' : ''
        }`
    );
    if (options.operation === 'rollback') {
        log(
            'Rollback bypasses the staging safeguard; the candidate is still verified.'
        );
    }
    const record = (
        status: 'succeeded' | 'failed' | 'dry-run',
        transitions: ChannelTransition[],
        releaseIndex: ReleaseIndexOutcome | undefined,
        error?: string
    ) => {
        if (options.progressFile) {
            appendProgressRecord(options.progressFile, {
                pod: options.pod,
                operation: options.operation,
                status,
                transitions,
                releaseIndex: releaseIndex && {
                    version: releaseIndex.entry.version,
                    buildId: releaseIndex.entry.buildId,
                    before: releaseIndex.before,
                    status: releaseIndex.status,
                },
                error,
            });
        }
    };
    try {
        const result = await runOperation(
            createStorage(env),
            options,
            dependencies.readBranchTips,
            {
                sleep: dependencies.sleep || defaultSleep,
                now: dependencies.now || Date.now,
                log,
            }
        );
        printResult(log, options, result);
        record(
            options.dryRun ? 'dry-run' : 'succeeded',
            result.transitions,
            result.releaseIndex
        );
        return 0;
    } catch (error) {
        const transitions =
            error instanceof PromotionError ? error.transitions : [];
        const releaseIndex =
            error instanceof PromotionError ? error.releaseIndex : undefined;
        const message =
            error instanceof Error ? error.message : 'Unknown promotion error';
        printResult(log, options, { transitions, releaseIndex });
        record('failed', transitions, releaseIndex, message);
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
                error instanceof Error
                    ? error.message
                    : 'Unknown promotion error'
            );
            process.exitCode = 1;
        }
    );
}

const promoter = {
    GA_PROMOTION_CHANNELS,
    PromotionError,
    STATUS_CHANNELS,
    activateChannel,
    gitBranchTipReader,
    main,
    parseArguments,
    readCurrentPointer,
    runOperation,
    verifyCandidate,
    verifyReaderChain,
};

module.exports = promoter;

export type Promoter = typeof promoter;
