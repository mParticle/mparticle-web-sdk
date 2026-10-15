/* eslint-env node, es2021 */

// Decides what a shadow V3 release workflow may do for a completed release
// run, before any credential is used. The run object (a workflow_run event
// payload, or the same object from the REST API for a manual re-run) is
// untrusted: only a workflow_dispatch run of the exact staging workflow in
// this repository, on its expected branch, is accepted. Pointer moves then
// mirror what the release actually did: a channel moves only when every
// branch it shadows points at the release tag's commit, so dry runs, failed
// runs and superseded releases change nothing.
//
// The run must have completed, and automatic mirroring (workflow_run) acts
// only on a run whose conclusion is success, or a Step 1 run that concluded
// failure only because kit publishing or its npm audit failed after the
// release and its shadow package job succeeded (read from the run attempt's
// jobs); anything else is skipped. A manual re-mirror of Step 1
// (workflow_dispatch) accepts any completed run, for example one that
// packaged and tagged the release and then failed a later step. Either way
// the candidate must still pass the tag and npm parity checks.
//
// The shadow package job names its build and artifact after the attempt it
// ran in. Re-running only the failed jobs copies the package job into the new
// attempt without running it again (a copied job keeps its original start and
// end times), so the candidate can carry an earlier attempt's number. The
// candidate is the artifact (--artifacts) created while the attempt's package
// job (--jobs) ran.
//
// node --experimental-strip-types scripts/v3-release/shadow-release-trigger.ts \
//     step1 --run <run.json> --repository <owner/name> --workflow-id <id> \
//     --trigger workflow_run|workflow_dispatch [--jobs <jobs.json>] \
//     [--artifacts <artifacts.json>]
// ... release-step --run <run.json> --repository <owner/name> \
//     --step2-workflow-id <id> --step3-workflow-id <id>
// ... branches --tag <vX.Y.Z> --branch <name> [--branch <name> ...]
// ... pods --list <comma-separated pods>
//
// Each command prints key=value lines for $GITHUB_OUTPUT. Every value is
// validated against a strict pattern, so none can inject another output.

type ReleaseContract = import('./release-contract').ReleaseContract;

const childProcess: typeof import('node:child_process') = require('node:child_process');
const fs: typeof import('node:fs') = require('node:fs');
const contract: ReleaseContract = require('./release-contract.ts');

export interface WorkflowRun {
    id?: unknown;
    run_attempt?: unknown;
    event?: unknown;
    status?: unknown;
    conclusion?: unknown;
    path?: unknown;
    head_branch?: unknown;
    display_title?: unknown;
    workflow_id?: unknown;
    head_repository?: { full_name?: unknown } | null;
    repository?: { full_name?: unknown } | null;
}

// One entry of the jobs API for a run attempt; untrusted like the run.
export interface WorkflowJob {
    run_id?: unknown;
    run_attempt?: unknown;
    name?: unknown;
    status?: unknown;
    conclusion?: unknown;
    started_at?: unknown;
    completed_at?: unknown;
}

// One entry of the artifacts API for a run; untrusted like the run.
export interface WorkflowArtifact {
    name?: unknown;
    expired?: unknown;
    created_at?: unknown;
    workflow_run?: { id?: unknown } | null;
}

export type Trigger = 'workflow_run' | 'workflow_dispatch';

export interface Step1Plan {
    skip: boolean;
    reason: string;
    runId: string;
    runAttempt: string;
    buildId: string;
    artifactName: string;
}

export interface ReleaseStepPlan {
    step: 2 | 3;
    skip: boolean;
    reason: string;
    releaseTag: string;
    releaseVersion: string;
    // Channels to move, in order, and the branches that must already point at
    // the release tag's commit for the move to mirror the release.
    channels: string[];
    branches: string[];
}

export interface BranchCheck {
    tagSha: string;
    matches: boolean;
    mismatched: string[];
}

export type GitRunner = (args: string[]) => string;

const STEP1_PATH = '.github/workflows/staging-step-1.yml';
const STEP2_PATH = '.github/workflows/staging-step-2.yml';
const STEP3_PATH = '.github/workflows/staging-step-3.yml';
const STEP1_BRANCH = 'v3-staging';
// Job names in staging-step-1.yml.
const STEP1_RELEASE_JOB = 'Perform Release';
const STEP1_PACKAGE_JOB = 'Package V3 candidate (shadow)';
const STEP1_KIT_JOBS: readonly string[] = [
    'Publish V3 kits',
    'Audit V3 kits on npm',
];
// Step 1 runs the workflow file on v3-staging, which can predate this one.
// Before kit publishing and its audit were split, both were this one job.
const STEP1_LEGACY_KIT_JOBS: readonly string[] = ['Publish and audit V3 kits'];
const RELEASE_STEP_BRANCHES: readonly string[] = ['main'];
const V3_TRUNK_BRANCH = 'main';
const RELEASE_ORDER_BRANCHES: readonly string[] = [
    'v3-release-order-a',
    'v3-release-order-b',
    'v3-release-order-c',
];
// Every pod the workflows know, in the order they are processed.
const PODS: readonly string[] = ['qa', 'us1', 'us2', 'st1', 'eu1', 'au1'];
const RUN_ID_PATTERN = /^[1-9][0-9]{0,19}$/;
const RUN_ATTEMPT_PATTERN = /^[1-9][0-9]{0,3}$/;
const REPOSITORY_PATTERN = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/;
const STABLE_TAG_PATTERN = /^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const BRANCH_PATTERN = /^[a-z0-9][a-z0-9/-]{0,62}$/;
// run-name of staging-step-2.yml and staging-step-3.yml. The tag and release
// order are the dispatcher's inputs; they are re-validated here and the
// branch check below decides whether anything actually moved.
const STEP2_TITLE_PATTERN = /^Staging Release - Step 2 \[(v[0-9]+\.[0-9]+\.[0-9]+) \u2192 (release-order-[abc])\]$/;
const STEP3_TITLE_PATTERN = /^Staging Release - Step 3 \[(v[0-9]+\.[0-9]+\.[0-9]+)\]$/;
const SHA_PATTERN = /^[0-9a-f]{40}$/;
// The REST API's UTC timestamps, for example 2026-01-02T03:04:05Z.
const TIMESTAMP_PATTERN = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?Z$/;

function fail(message: string): never {
    throw new Error(message);
}

function stringOf(value: unknown): string {
    if (typeof value === 'number' && Number.isSafeInteger(value)) {
        return String(value);
    }
    return typeof value === 'string' ? value : '';
}

function validateRepository(value: string): string {
    if (!REPOSITORY_PATTERN.test(value)) {
        fail('The repository must be an owner/name pair');
    }
    return value;
}

function validateRunId(value: string, description: string): string {
    if (!RUN_ID_PATTERN.test(value)) {
        fail(`${description} must be a positive integer`);
    }
    return value;
}

function requireRunSource(
    run: WorkflowRun,
    repository: string,
    expectedPath: string,
    allowedBranches: readonly string[],
    expectedWorkflowId: string
): void {
    if (run.event !== 'workflow_dispatch') {
        fail('The release run was not started by workflow_dispatch');
    }
    if (run.path !== expectedPath) {
        fail(`The release run is not ${expectedPath}`);
    }
    if (stringOf(run.workflow_id) !== expectedWorkflowId) {
        fail('The release run belongs to a different workflow');
    }
    const headRepository = run.head_repository && run.head_repository.full_name;
    const runRepository = run.repository && run.repository.full_name;
    if (headRepository !== repository || runRepository !== repository) {
        fail('The release run did not come from this repository');
    }
    if (
        typeof run.head_branch !== 'string' ||
        !allowedBranches.includes(run.head_branch)
    ) {
        fail(
            `The release run must be dispatched from ${allowedBranches.join(
                ' or '
            )}`
        );
    }
}

// Returns why the run's outcome rules it out, or '' when it is eligible.
function conclusionProblem(run: WorkflowRun, trigger: Trigger): string {
    if (run.status !== 'completed') {
        return 'The release run has not completed';
    }
    if (trigger === 'workflow_run' && run.conclusion !== 'success') {
        return `The release run concluded ${
            typeof run.conclusion === 'string' &&
            /^[a-z_]{1,32}$/.test(run.conclusion)
                ? run.conclusion
                : 'without success'
        }; only a successful run is mirrored automatically`;
    }
    return '';
}

function requireAttemptJobs(
    jobs: WorkflowJob[],
    runId: string,
    runAttempt: string
): void {
    for (const job of jobs) {
        if (
            stringOf(job.run_id) !== runId ||
            stringOf(job.run_attempt) !== runAttempt
        ) {
            fail('A job belongs to a different run attempt');
        }
    }
}

// True when the attempt's jobs show the release and its shadow package
// succeeded and every failed job is kit publishing or its audit.
function failedOnlyAtKits(jobs: WorkflowJob[]): boolean {
    const succeeded = (name: string) => {
        const matching = jobs.filter(job => job.name === name);
        return matching.length === 1 && matching[0].conclusion === 'success';
    };
    const failed = jobs.filter(
        job =>
            job.status !== 'completed' ||
            (job.conclusion !== 'success' && job.conclusion !== 'skipped')
    );
    return (
        succeeded(STEP1_RELEASE_JOB) &&
        succeeded(STEP1_PACKAGE_JOB) &&
        failed.length > 0 &&
        failed.every(
            job =>
                job.conclusion === 'failure' &&
                typeof job.name === 'string' &&
                (STEP1_KIT_JOBS.includes(job.name) ||
                    STEP1_LEGACY_KIT_JOBS.includes(job.name))
        )
    );
}

// Milliseconds since the epoch for an API timestamp, or NaN.
function timeOf(value: unknown): number {
    return typeof value === 'string' && TIMESTAMP_PATTERN.test(value)
        ? Date.parse(value)
        : NaN;
}

// Infers the attempt whose package job made the run's candidate: the one
// named by the only unexpired v3-candidate-<run>-<attempt> artifact, up to
// this attempt, created while the attempt's package job ran (the API does not
// link an artifact to its job). A package job that ran again in this attempt
// rules out every earlier artifact. Without exactly one such artifact, it
// falls back to this attempt, so a missing candidate is reported as before.
function candidateAttempt(
    artifacts: WorkflowArtifact[],
    jobs: WorkflowJob[],
    runId: string,
    runAttempt: string
): string {
    for (const artifact of artifacts) {
        const artifactRun = artifact.workflow_run && artifact.workflow_run.id;
        if (stringOf(artifactRun) !== runId) {
            fail('An artifact belongs to a different run');
        }
    }
    const packageJobs = jobs.filter(job => job.name === STEP1_PACKAGE_JOB);
    if (packageJobs.length !== 1) {
        return runAttempt;
    }
    const started = timeOf(packageJobs[0].started_at);
    const completed = timeOf(packageJobs[0].completed_at);
    const prefix = `v3-candidate-${runId}-`;
    const attempts: string[] = [];
    for (const artifact of artifacts) {
        if (
            artifact.expired !== false ||
            typeof artifact.name !== 'string' ||
            !artifact.name.startsWith(prefix)
        ) {
            continue;
        }
        const attempt = artifact.name.slice(prefix.length);
        const created = timeOf(artifact.created_at);
        if (
            RUN_ATTEMPT_PATTERN.test(attempt) &&
            Number(attempt) <= Number(runAttempt) &&
            created >= started &&
            created <= completed
        ) {
            attempts.push(attempt);
        }
    }
    return attempts.length === 1 ? attempts[0] : runAttempt;
}

function planStep1(
    run: WorkflowRun,
    repository: string,
    workflowId: string,
    trigger: Trigger,
    jobs?: WorkflowJob[],
    artifacts?: WorkflowArtifact[]
): Step1Plan {
    validateRepository(repository);
    validateRunId(workflowId, 'The Step 1 workflow ID');
    if (trigger !== 'workflow_run' && trigger !== 'workflow_dispatch') {
        fail('The trigger must be workflow_run or workflow_dispatch');
    }
    requireRunSource(run, repository, STEP1_PATH, [STEP1_BRANCH], workflowId);
    const runId = validateRunId(stringOf(run.id), 'The run ID');
    const runAttempt = stringOf(run.run_attempt);
    if (!RUN_ATTEMPT_PATTERN.test(runAttempt)) {
        fail('The run attempt must be a positive integer');
    }
    if (jobs !== undefined) {
        requireAttemptJobs(jobs, runId, runAttempt);
    }
    // The shadow package job names both the build and its artifact this way.
    const buildId = contract.validateBuildId(
        `${runId}-${
            artifacts === undefined || jobs === undefined
                ? runAttempt
                : candidateAttempt(artifacts, jobs, runId, runAttempt)
        }`
    );
    let reason = conclusionProblem(run, trigger);
    if (
        reason !== '' &&
        trigger === 'workflow_run' &&
        run.status === 'completed' &&
        run.conclusion === 'failure' &&
        jobs !== undefined &&
        failedOnlyAtKits(jobs)
    ) {
        reason = '';
    }
    return {
        skip: reason !== '',
        reason,
        runId,
        runAttempt,
        buildId,
        artifactName: `v3-candidate-${buildId}`,
    };
}

function planReleaseStep(
    run: WorkflowRun,
    repository: string,
    step2WorkflowId: string,
    step3WorkflowId: string
): ReleaseStepPlan {
    validateRepository(repository);
    validateRunId(step2WorkflowId, 'The Step 2 workflow ID');
    validateRunId(step3WorkflowId, 'The Step 3 workflow ID');
    const step = run.path === STEP2_PATH ? 2 : run.path === STEP3_PATH ? 3 : 0;
    if (step === 0) {
        return fail('The release run is neither Step 2 nor Step 3');
    }
    requireRunSource(
        run,
        repository,
        step === 2 ? STEP2_PATH : STEP3_PATH,
        RELEASE_STEP_BRANCHES,
        step === 2 ? step2WorkflowId : step3WorkflowId
    );
    const title =
        typeof run.display_title === 'string' ? run.display_title : '';
    const match = (step === 2 ? STEP2_TITLE_PATTERN : STEP3_TITLE_PATTERN).exec(
        title
    );
    const empty = {
        step: step as 2 | 3,
        releaseTag: '',
        releaseVersion: '',
        channels: [],
        branches: [],
    };
    const outcome = conclusionProblem(run, 'workflow_run');
    if (outcome) {
        return { ...empty, skip: true, reason: outcome };
    }
    if (!match || !STABLE_TAG_PATTERN.test(match[1])) {
        return {
            ...empty,
            skip: true,
            reason: 'The run title does not name a stable release tag',
        };
    }
    const releaseTag = match[1];
    const releaseVersion = releaseTag.slice(1);
    if (!releaseVersion.startsWith('3.')) {
        return {
            ...empty,
            skip: true,
            reason: `${releaseTag} is not a V3 release`,
        };
    }
    contract.validateVersion(releaseVersion);
    if (step === 2) {
        const branch = `v3-${match[2]}`;
        return {
            step,
            skip: false,
            reason: '',
            releaseTag,
            releaseVersion,
            channels: [contract.validateChannel(branch)],
            branches: [branch],
        };
    }
    return {
        step,
        skip: false,
        reason: '',
        releaseTag,
        releaseVersion,
        channels: [...contract.RELEASE_ORDER_CHANNELS, contract.GA_CHANNEL],
        branches: [V3_TRUNK_BRANCH, ...RELEASE_ORDER_BRANCHES],
    };
}

function defaultGit(args: string[]): string {
    return childProcess.execFileSync('git', args, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 60 * 1000,
    });
}

// Reads the remote directly, so a stale local clone cannot pass the check.
function checkBranches(
    tag: string,
    branches: string[],
    git: GitRunner = defaultGit
): BranchCheck {
    if (!STABLE_TAG_PATTERN.test(tag)) {
        fail('The release tag must be a stable vX.Y.Z tag');
    }
    if (branches.length === 0) {
        fail('At least one branch is required');
    }
    for (const branch of branches) {
        if (!BRANCH_PATTERN.test(branch)) {
            fail('A branch name is invalid');
        }
    }
    const refs = new Map<string, string>();
    for (const line of git([
        'ls-remote',
        'origin',
        `refs/tags/${tag}`,
        `refs/tags/${tag}^{}`,
        ...branches.map(branch => `refs/heads/${branch}`),
    ]).split('\n')) {
        const [sha, ref] = line.split('\t');
        if (sha && ref && SHA_PATTERN.test(sha)) {
            refs.set(ref, sha);
        }
    }
    // An annotated tag's commit is its peeled ^{} entry.
    const tagSha =
        refs.get(`refs/tags/${tag}^{}`) || refs.get(`refs/tags/${tag}`) || '';
    if (!tagSha) {
        fail(`${tag} does not exist on the remote`);
    }
    const mismatched = branches.filter(
        branch => refs.get(`refs/heads/${branch}`) !== tagSha
    );
    return { tagSha, matches: mismatched.length === 0, mismatched };
}

// Accepts a comma-separated subset of PODS, each at most once, and returns it
// in processing order.
function selectPods(list: string): string[] {
    const requested = list
        .split(',')
        .map(pod => pod.trim())
        .filter(Boolean);
    if (requested.length === 0) {
        fail('No pods are selected');
    }
    for (const pod of requested) {
        if (!PODS.includes(pod)) {
            fail(`Pods must be drawn from: ${PODS.join(', ')}`);
        }
    }
    if (new Set(requested).size !== requested.length) {
        fail('A pod is listed more than once');
    }
    return PODS.filter(pod => requested.includes(pod));
}

function readRun(filePath: string): WorkflowRun {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
    ) {
        fail('The run file must hold a JSON object');
    }
    return parsed as WorkflowRun;
}

function readObjects(filePath: string, description: string): unknown[] {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (
        !Array.isArray(parsed) ||
        !parsed.every(
            entry =>
                typeof entry === 'object' &&
                entry !== null &&
                !Array.isArray(entry)
        )
    ) {
        fail(`The ${description} file must hold a JSON array of objects`);
    }
    return parsed;
}

function parseFlags(args: string[]): Map<string, string[]> {
    const flags = new Map<string, string[]>();
    for (let index = 0; index < args.length; index++) {
        const flag = args[index];
        const value = args[++index];
        if (!flag.startsWith('--') || value === undefined) {
            fail(`${flag} requires a value`);
        }
        flags.set(flag, [...(flags.get(flag) || []), value]);
    }
    return flags;
}

function single(flags: Map<string, string[]>, flag: string): string {
    const values = flags.get(flag) || [];
    if (values.length !== 1) {
        fail(`${flag} is required once`);
    }
    return values[0];
}

function requireOnly(flags: Map<string, string[]>, allowed: string[]): void {
    flags.forEach((_values, flag) => {
        if (!allowed.includes(flag)) {
            fail(`Unknown argument: ${flag}`);
        }
    });
}

function main(args: string[], git: GitRunner = defaultGit): string[] {
    const [command, ...rest] = args;
    const flags = parseFlags(rest);
    if (command === 'step1') {
        requireOnly(flags, [
            '--run',
            '--repository',
            '--workflow-id',
            '--trigger',
            '--jobs',
            '--artifacts',
        ]);
        const plan = planStep1(
            readRun(single(flags, '--run')),
            single(flags, '--repository'),
            single(flags, '--workflow-id'),
            single(flags, '--trigger') as Trigger,
            flags.has('--jobs')
                ? (readObjects(
                      single(flags, '--jobs'),
                      'jobs'
                  ) as WorkflowJob[])
                : undefined,
            flags.has('--artifacts')
                ? (readObjects(
                      single(flags, '--artifacts'),
                      'artifacts'
                  ) as WorkflowArtifact[])
                : undefined
        );
        if (plan.skip) {
            // The reason is built from fixed text, so it is one safe line.
            return ['skip=true', `reason=${plan.reason}`];
        }
        return [
            'skip=false',
            `run_id=${plan.runId}`,
            `run_attempt=${plan.runAttempt}`,
            `build_id=${plan.buildId}`,
            `artifact_name=${plan.artifactName}`,
        ];
    }
    if (command === 'release-step') {
        requireOnly(flags, [
            '--run',
            '--repository',
            '--step2-workflow-id',
            '--step3-workflow-id',
        ]);
        const plan = planReleaseStep(
            readRun(single(flags, '--run')),
            single(flags, '--repository'),
            single(flags, '--step2-workflow-id'),
            single(flags, '--step3-workflow-id')
        );
        if (plan.skip) {
            return [`step=${plan.step}`, 'skip=true', `reason=${plan.reason}`];
        }
        const check = checkBranches(plan.releaseTag, plan.branches, git);
        return [
            `step=${plan.step}`,
            `skip=${check.matches ? 'false' : 'true'}`,
            `release_tag=${plan.releaseTag}`,
            `release_version=${plan.releaseVersion}`,
            `channels=${plan.channels.join(',')}`,
            `branches=${plan.branches.join(',')}`,
            `mismatched=${check.mismatched.join(',')}`,
        ];
    }
    if (command === 'pods') {
        requireOnly(flags, ['--list']);
        const pods = selectPods(single(flags, '--list'));
        return [
            `pods=${pods.join(',')}`,
            ...PODS.map(
                pod => `${pod}=${pods.includes(pod) ? 'true' : 'false'}`
            ),
        ];
    }
    if (command === 'branches') {
        requireOnly(flags, ['--tag', '--branch']);
        const check = checkBranches(
            single(flags, '--tag'),
            flags.get('--branch') || [],
            git
        );
        return [
            `matches=${check.matches ? 'true' : 'false'}`,
            `tag_sha=${check.tagSha}`,
            `mismatched=${check.mismatched.join(',')}`,
        ];
    }
    return fail('Command must be step1, release-step, pods or branches');
}

if (require.main === module) {
    try {
        process.stdout.write(`${main(process.argv.slice(2)).join('\n')}\n`);
    } catch (error) {
        console.error(
            error instanceof Error ? error.message : 'Unknown trigger error'
        );
        process.exitCode = 1;
    }
}

const shadowReleaseTrigger = {
    PODS,
    STEP1_KIT_JOBS,
    STEP1_LEGACY_KIT_JOBS,
    STEP1_PACKAGE_JOB,
    STEP1_RELEASE_JOB,
    checkBranches,
    main,
    planReleaseStep,
    planStep1,
    selectPods,
};

module.exports = shadowReleaseTrigger;

export type ShadowReleaseTrigger = typeof shadowReleaseTrigger;
