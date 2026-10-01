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
//   rollback --channel <c> --version <v> --build-id <id> [--allow-downgrade]
//   show --channel <c>                               read-only
//
// Stale-run guards, checked against the pointer read immediately before each
// conditional write (whose If-Match makes that read authoritative):
//   - A lower version than the channel serves is refused. Only rollback may
//     move a channel down, and only with --allow-downgrade.
//   - The same version with a different build is refused unless
//     --allow-rebuild (stage, promote, promote-ga) or --allow-downgrade.
//   - Each --require-branch-tip <branch> must currently point at the
//     candidate's sourceSha, so a delayed run for an older release cannot
//     move a pointer after the branch it shadows has moved on.
//
// node --experimental-strip-types scripts/v3-release/promote-v3-release.ts \
//     <operation> [flags] [--verify full|required] [--pod <label>] \
//     [--progress-file <file>] [--expected-metadata-sha256 <sha>] \
//     [--require-branch-tip <branch>]... [--allow-rebuild]

type ActiveReleasePointer = import('./release-contract').ActiveReleasePointer;
type CandidateMetadata = import('./release-contract').CandidateMetadata;
type ReleaseContract = import('./release-contract').ReleaseContract;
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
    | 'show';

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
    allowDowngrade: boolean;
    allowRebuild: boolean;
    requireBranchTips: string[];
    readBranchTips: BranchTipReader;
}

export interface VerifiedCandidate {
    pointer: ActiveReleasePointer;
    metadata: CandidateMetadata;
    objectsVerified: number;
}

export interface PromotionResult {
    operation: Operation;
    candidate?: VerifiedCandidate;
    transitions: ChannelTransition[];
}

export interface PromoterDependencies {
    env?: NodeJS.ProcessEnv;
    log?: (line: string) => void;
    createStorage?: (env: NodeJS.ProcessEnv) => ReleaseStorage;
    readBranchTips?: BranchTipReader;
}

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
];

// Step 3 order: release orders first, then every other workspace.
const GA_PROMOTION_CHANNELS: readonly string[] = [
    ...contract.RELEASE_ORDER_CHANNELS,
    contract.GA_CHANNEL,
];

class PromotionError extends Error {
    readonly transitions: ChannelTransition[];

    constructor(message: string, transitions: ChannelTransition[]) {
        super(message);
        // Keeps instanceof working when compiled to ES5 (as Jest does).
        Object.setPrototypeOf(this, PromotionError.prototype);
        this.name = 'PromotionError';
        this.transitions = transitions;
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
    allowDenied = false
): Promise<CurrentPointer> {
    let stored: StoredObject;
    try {
        stored = await storage.getObject(
            contract.pointerKey(channel),
            contract.MAX_POINTER_BYTES
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
    depth: VerifyDepth
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
        fail(
            'Candidate metadata.json does not match --expected-metadata-sha256'
        );
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
    options: PromoterOptions
): Promise<ActiveReleasePointer> {
    const current = await readCurrentPointer(storage, contract.STAGING_CHANNEL);
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

// Refuses to move a channel backwards. An unreadable or absent pointer has no
// version to regress from.
function assertNoRegression(
    channel: string,
    current: CurrentPointer,
    target: ActiveReleasePointer,
    policy: ActivationPolicy
): void {
    if (!current.pointer || policy.allowDowngrade) {
        return;
    }
    const order = contract.compareVersions(
        target.version,
        current.pointer.version
    );
    if (order < 0) {
        fail(
            `${channel} serves ${current.pointer.version}, which is newer than ${target.version}; refusing to move it backwards. Use rollback with --allow-downgrade to do that deliberately.`
        );
    }
    if (order === 0 && !policy.allowRebuild) {
        fail(
            `${channel} already serves ${current.pointer.version} as build ${current.pointer.buildId}; refusing to replace it with build ${target.buildId} without --allow-rebuild (or, for rollback, --allow-downgrade).`
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
// Reports whether the pointer now holds exactly the target bytes and headers.
async function writeLanded(
    storage: ReleaseStorage,
    channel: string,
    targetBytes: Buffer
): Promise<boolean> {
    try {
        const stored = await storage.getObject(
            contract.pointerKey(channel),
            contract.MAX_POINTER_BYTES
        );
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
            if (!(await writeLanded(storage, channel, targetBytes))) {
                fail(
                    current.denied
                        ? `The ${channel} pointer exists but reading it was denied; nothing was overwritten. Check the role's read access to the pointer key.`
                        : `The ${channel} pointer changed after it was read and does not name this candidate. Check the channel with "show", then re-run.`
                );
            }
        } else if (
            !AMBIGUOUS_WRITE_ERRORS.some(code => isStorageError(error, code)) ||
            !(await writeLanded(storage, channel, targetBytes))
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

function requireOption(value: string | undefined, flag: string): string {
    if (value === undefined) {
        fail(`${flag} is required for this operation`);
    }
    return value;
}

// Reads branch tips with `git ls-remote`, which needs no credentials for a
// public repository and does not depend on the local checkout's refs.
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

async function runOperation(
    storage: ReleaseStorage,
    options: PromoterOptions,
    readBranchTips: BranchTipReader = gitBranchTipReader()
): Promise<PromotionResult> {
    const policy: ActivationPolicy = {
        allowDowngrade: options.allowDowngrade,
        allowRebuild: options.allowRebuild,
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

    let channels: readonly string[];
    let candidate: VerifiedCandidate;
    if (operation === 'stage' || operation === 'rollback') {
        channels = [
            operation === 'stage'
                ? contract.STAGING_CHANNEL
                : requireOption(options.channel, '--channel'),
        ];
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
        const staging = await readStagingCandidate(storage, options);
        candidate = await verifyCandidate(storage, staging, options.verify);
    }
    const transitions = await activateChannels(
        storage,
        channels,
        candidate,
        options.dryRun,
        policy
    );
    return { operation, candidate, transitions };
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
    };
    const switches: Record<
        string,
        'dryRun' | 'allowDowngrade' | 'allowRebuild'
    > = {
        '--dry-run': 'dryRun',
        '--allow-downgrade': 'allowDowngrade',
        '--allow-rebuild': 'allowRebuild',
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
    if (options.operation === 'show' && options.dryRun) {
        fail('show is read-only and does not accept --dry-run');
    }
    if (options.allowDowngrade && options.operation !== 'rollback') {
        fail('Only rollback accepts --allow-downgrade');
    }
    if (
        options.allowRebuild &&
        (options.operation === 'rollback' || options.operation === 'show')
    ) {
        fail(`${options.operation} does not accept --allow-rebuild`);
    }
    if (
        options.requireBranchTips.length > 0 &&
        (options.operation === 'rollback' || options.operation === 'show')
    ) {
        // A rollback restores an older release, whose source is by definition
        // no longer a branch tip.
        fail(`${options.operation} does not accept --require-branch-tip`);
    }
    if (options.operation === 'promote') {
        // TODO: promotion-order checks beyond the staging safeguard are an
        // open question; only v3-staging can be a source for now.
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
    result: { candidate?: VerifiedCandidate; transitions: ChannelTransition[] }
): void {
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
            typeof before !== 'string'
        ) {
            // No versions/ index exists, so the run summary is the rollback
            // record. Restoring the previous pointer is a downgrade or a
            // same-version rebuild, both of which rollback refuses without
            // --allow-downgrade.
            log(
                `${transition.channel} rollback target: rollback --channel ${transition.channel} --version ${before.version} --build-id ${before.buildId} --allow-downgrade --pod ${options.pod}`
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
        error?: string
    ) => {
        if (options.progressFile) {
            appendProgressRecord(options.progressFile, {
                pod: options.pod,
                operation: options.operation,
                status,
                transitions,
                error,
            });
        }
    };
    try {
        const result = await runOperation(
            createStorage(env),
            options,
            dependencies.readBranchTips
        );
        printResult(log, options, result);
        record(options.dryRun ? 'dry-run' : 'succeeded', result.transitions);
        return 0;
    } catch (error) {
        const transitions =
            error instanceof PromotionError ? error.transitions : [];
        const message =
            error instanceof Error ? error.message : 'Unknown promotion error';
        printResult(log, options, { transitions });
        record('failed', transitions, message);
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
