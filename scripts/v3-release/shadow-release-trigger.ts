/* eslint-env node, es2021 */

// Decides what a shadow V3 release workflow may do for a completed release
// run, before any credential is used. The run object (a workflow_run event
// payload, or the same object from the REST API for a manual re-run) is
// untrusted: only a workflow_dispatch run of one of the exact release
// workflows in this repository, on its expected branch, is accepted, and a
// Step 1 run must also carry its file's V3 run title. A V3 release step can
// run from either of two files while V3 moves to its own workflows: the
// staging-step-N.yml file both versions shared, which the
// first V3 release after the move still runs, and v3-release-step-N.yml,
// which every later V3 release runs. The shared names can go once a V3
// release has run on the V3 files. Pointer moves then
// mirror what the release actually did: a channel moves only when every
// branch it shadows points at the release tag's commit, so dry runs, failed
// runs and superseded releases change nothing. In Release Please mode
// (--release-please-mode true, from the V3_RELEASE_PLEASE_ENABLED repository
// variable that V3 Step 3 reads), Step 3 pushes only the three release-order
// branches and main can already be past the tag, so a Step 3 move checks only
// those three branches.
//
// Real Step 2 runs have already put the three release-order branches at the
// tag, so in Release Please mode the branch check alone cannot tell a Step 3
// dry run from a real one. A Step 3 move therefore also needs the run
// attempt's jobs (--jobs) to show that the push step, "Atomically synchronize
// all destinations", ran and succeeded. A dry run skips that step and still
// concludes success, and a failed push did not move the branches, so either
// is skipped, in both modes.
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
//     --v3-workflow-id <id> --trigger workflow_run|workflow_dispatch \
//     [--release-gate true|false] [--release-please-mode true|false] \
//     [--release-tag <vX.Y.Z>] \
//     [--jobs <jobs.json>] [--artifacts <artifacts.json>]
// ... release-step --run <run.json> --repository <owner/name> \
//     --step2-workflow-id <id> --step3-workflow-id <id> \
//     --v3-step2-workflow-id <id> --v3-step3-workflow-id <id> \
//     [--release-please-mode true|false] [--jobs <jobs.json>]
// ... branches --tag <vX.Y.Z> --branch <name> [--branch <name> ...]
// ... pods --list <comma-separated pods> [--release-gate true|false]
//
// --workflow-id, --step2-workflow-id and --step3-workflow-id are the IDs of
// staging-step-1.yml, staging-step-2.yml and staging-step-3.yml; the --v3-
// flags are the IDs of v3-release-step-1.yml, v3-release-step-2.yml and
// v3-release-step-3.yml. release-step needs --jobs, the jobs of the run's
// attempt, to plan a Step 3 move.
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
    steps?: unknown;
}

// One step of a job in the jobs API; untrusted like the run.
export interface WorkflowStep {
    name?: unknown;
    status?: unknown;
    conclusion?: unknown;
}

// One entry of the artifacts API for a run; untrusted like the run.
export interface WorkflowArtifact {
    name?: unknown;
    expired?: unknown;
    created_at?: unknown;
    workflow_run?: { id?: unknown } | null;
}

export type Trigger = 'workflow_run' | 'workflow_dispatch';

// The ID GitHub gave each Step 1 file in this repository.
export interface Step1WorkflowIds {
    staging: string;
    v3: string;
}

// The ID GitHub gave each Step 2 and Step 3 file in this repository.
export interface ReleaseStepWorkflowIds {
    step2: string;
    step3: string;
    v3Step2: string;
    v3Step3: string;
}

// A workflow file a release run may come from, and the ID GitHub gave it.
interface WorkflowSource {
    path: string;
    workflowId: string;
}

// A Step 1 file, the ID it is checked against and the run-name it gives a V3
// release run.
interface Step1File {
    path: string;
    idKey: keyof Step1WorkflowIds;
    title: RegExp;
}

// A Step 2 or Step 3 file, the step it runs, the ID it is checked against and
// the run-name it gives each run.
interface ReleaseStepFile {
    path: string;
    step: 2 | 3;
    idKey: keyof ReleaseStepWorkflowIds;
    title: RegExp;
}

export interface Step1Plan {
    skip: boolean;
    reason: string;
    runId: string;
    runAttempt: string;
    buildId: string;
    artifactName: string;
    releaseTag?: string;
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
const V3_STEP1_PATH = '.github/workflows/v3-release-step-1.yml';
const V3_STEP2_PATH = '.github/workflows/v3-release-step-2.yml';
const V3_STEP3_PATH = '.github/workflows/v3-release-step-3.yml';
const STEP1_BRANCH = 'v3-staging';
// Job names in v3-release-step-1.yml, the same as in the shared
// staging-step-1.yml it was split from.
const STEP1_RELEASE_JOB = 'Perform Release';
const STEP1_PACKAGE_JOB = 'Package V3 candidate (shadow)';
const STEP1_KIT_JOBS: readonly string[] = ['Publish V3 kits'];
// Step 1 runs the workflow file on v3-staging, which can predate this one.
// Before kit publishing and its audit were split, both were one job; later
// files ran the npm audit as a job of its own until the release gate's npm
// parity check replaced it.
const STEP1_LEGACY_KIT_JOBS: readonly string[] = [
    'Publish and audit V3 kits',
    'Audit V3 kits on npm',
];
const RELEASE_STEP_BRANCHES: readonly string[] = ['main'];
// The step of both Step 3 files (staging-step-3.yml and v3-release-step-3.yml)
// that pushes the release branches. Each runs it only when dryRun is 'false'.
const STEP3_PUSH_STEP = 'Atomically synchronize all destinations';
const V3_TRUNK_BRANCH = 'main';
const RELEASE_ORDER_BRANCHES: readonly string[] = [
    'v3-release-order-a',
    'v3-release-order-b',
    'v3-release-order-c',
];
// Every pod the workflows know, in the order they are processed, and the
// production subset that a release-gate run must cover.
const PODS: readonly string[] = ['qa', 'us1', 'us2', 'st1', 'eu1', 'au1'];
const PRODUCTION_PODS: readonly string[] = ['us1', 'us2', 'st1', 'eu1', 'au1'];
const RUN_ID_PATTERN = /^[1-9][0-9]{0,19}$/;
const RUN_ATTEMPT_PATTERN = /^[1-9][0-9]{0,3}$/;
const REPOSITORY_PATTERN = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/;
const STABLE_TAG_PATTERN = /^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
// A V3 Step 1 run dispatched from its release tag (Release Please mode) names
// that tag as its head branch.
const STABLE_V3_TAG_PATTERN = /^v3\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const BRANCH_PATTERN = /^[a-z0-9][a-z0-9/-]{0,62}$/;
// run-name of each Step 1 file for a V3 release. The shared file's title names
// the release track, and only its v3 track is mirrored.
const STEP1_TITLE_PATTERN = /^Staging Release - Step 1 \[v3\]$/;
const V3_STEP1_TITLE_PATTERN = /^V3 Release - Step 1$/;
const STEP1_FILES: readonly Step1File[] = [
    { path: STEP1_PATH, idKey: 'staging', title: STEP1_TITLE_PATTERN },
    { path: V3_STEP1_PATH, idKey: 'v3', title: V3_STEP1_TITLE_PATTERN },
];
// run-name of each Step 2 and Step 3 file. The tag and release order are the
// dispatcher's inputs; they are re-validated here and the branch check below
// decides whether anything actually moved.
const STEP2_TITLE_PATTERN = /^Staging Release - Step 2 \[(v[0-9]+\.[0-9]+\.[0-9]+) \u2192 (release-order-[abc])\]$/;
const STEP3_TITLE_PATTERN = /^Staging Release - Step 3 \[(v[0-9]+\.[0-9]+\.[0-9]+)\]$/;
const V3_STEP2_TITLE_PATTERN = /^V3 Release - Step 2 \[(v[0-9]+\.[0-9]+\.[0-9]+) \u2192 (release-order-[abc])\]$/;
const V3_STEP3_TITLE_PATTERN = /^V3 Release - Step 3 \[(v[0-9]+\.[0-9]+\.[0-9]+)\]$/;
const RELEASE_STEP_FILES: readonly ReleaseStepFile[] = [
    { path: STEP2_PATH, step: 2, idKey: 'step2', title: STEP2_TITLE_PATTERN },
    { path: STEP3_PATH, step: 3, idKey: 'step3', title: STEP3_TITLE_PATTERN },
    { path: V3_STEP2_PATH, step: 2, idKey: 'v3Step2', title: V3_STEP2_TITLE_PATTERN },
    { path: V3_STEP3_PATH, step: 3, idKey: 'v3Step3', title: V3_STEP3_TITLE_PATTERN },
];
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

function validateBoolean(value: string, description: string): boolean {
    if (value === 'true') {
        return true;
    }
    if (value === 'false') {
        return false;
    }
    return fail(`${description} must be true or false`);
}

function requireRunSource(
    run: WorkflowRun,
    repository: string,
    sources: readonly WorkflowSource[],
    allowedBranches: readonly string[]
): void {
    if (run.event !== 'workflow_dispatch') {
        fail('The release run was not started by workflow_dispatch');
    }
    const source = sources.find(candidate => candidate.path === run.path);
    if (!source) {
        return fail(
            `The release run is not ${sources
                .map(candidate => candidate.path)
                .join(' or ')}`
        );
    }
    if (stringOf(run.workflow_id) !== source.workflowId) {
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

// The steps named name in every job of the attempt. A job whose steps are not
// a list, and an entry that is not an object, add nothing.
function stepsNamed(jobs: WorkflowJob[], name: string): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    for (const job of jobs) {
        if (!Array.isArray(job.steps)) {
            continue;
        }
        for (const step of job.steps) {
            if (
                typeof step === 'object' &&
                step !== null &&
                (step as WorkflowStep).name === name
            ) {
                steps.push(step as WorkflowStep);
            }
        }
    }
    return steps;
}

// Returns why a Step 3 attempt's jobs rule out a pointer move, or '' when
// they show that its one push step ran and succeeded.
function step3PushProblem(jobs: WorkflowJob[]): string {
    const pushes = stepsNamed(jobs, STEP3_PUSH_STEP);
    if (pushes.length !== 1) {
        return "The Step 3 run's jobs do not show exactly one push step, so no branch moved";
    }
    if (
        pushes[0].status === 'completed' &&
        pushes[0].conclusion === 'success'
    ) {
        return '';
    }
    if (pushes[0].conclusion === 'skipped') {
        return 'The Step 3 run was a dry run: its push step was skipped, so no branch moved';
    }
    return 'The Step 3 push step did not succeed, so no branch moved';
}

// Milliseconds since the epoch for an API timestamp, or NaN.
function timeOf(value: unknown): number {
    return typeof value === 'string' && TIMESTAMP_PATTERN.test(value)
        ? Date.parse(value)
        : NaN;
}

function matchingCandidateAttempts(
    artifacts: WorkflowArtifact[],
    jobs: WorkflowJob[],
    runId: string,
    runAttempt: string
): string[] {
    for (const artifact of artifacts) {
        const artifactRun = artifact.workflow_run && artifact.workflow_run.id;
        if (stringOf(artifactRun) !== runId) {
            fail('An artifact belongs to a different run');
        }
    }
    const packageJobs = jobs.filter(job => job.name === STEP1_PACKAGE_JOB);
    if (packageJobs.length !== 1) {
        return [];
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
    return attempts;
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
    const attempts = matchingCandidateAttempts(
        artifacts,
        jobs,
        runId,
        runAttempt
    );
    return attempts.length === 1 ? attempts[0] : runAttempt;
}

function requireReleaseGateReady(
    run: WorkflowRun,
    jobs: WorkflowJob[] | undefined,
    artifacts: WorkflowArtifact[] | undefined,
    runId: string,
    runAttempt: string
): string {
    if (run.path !== V3_STEP1_PATH) {
        fail('Release-gate mode accepts only .github/workflows/v3-release-step-1.yml');
    }
    if (run.status !== 'in_progress' && run.status !== 'completed') {
        fail('The release run must be in_progress or completed in release-gate mode');
    }
    if (run.status === 'completed' && run.conclusion === 'cancelled') {
        fail('The release run was cancelled');
    }
    if (jobs === undefined || artifacts === undefined) {
        fail('Release-gate mode requires jobs and artifacts');
    }
    const releaseJobs = jobs.filter(job => job.name === STEP1_RELEASE_JOB);
    if (
        releaseJobs.length !== 1 ||
        releaseJobs[0].status !== 'completed' ||
        releaseJobs[0].conclusion !== 'success'
    ) {
        fail('The Step 1 release job has not succeeded');
    }
    const packageJobs = jobs.filter(job => job.name === STEP1_PACKAGE_JOB);
    if (
        packageJobs.length !== 1 ||
        packageJobs[0].status !== 'completed' ||
        packageJobs[0].conclusion !== 'success'
    ) {
        fail('The Step 1 package job has not succeeded');
    }
    const attempts = matchingCandidateAttempts(
        artifacts,
        jobs,
        runId,
        runAttempt
    );
    if (attempts.length !== 1) {
        fail(
            'Release-gate mode requires exactly one unexpired candidate artifact from the package job'
        );
    }
    return attempts[0];
}

function planStep1(
    run: WorkflowRun,
    repository: string,
    workflowIds: Step1WorkflowIds,
    trigger: Trigger,
    jobs?: WorkflowJob[],
    artifacts?: WorkflowArtifact[],
    releaseGate = false,
    releasePleaseMode = false,
    releaseTag?: string
): Step1Plan {
    validateRepository(repository);
    validateRunId(workflowIds.staging, 'The Step 1 workflow ID');
    validateRunId(workflowIds.v3, 'The V3 Step 1 workflow ID');
    if (trigger !== 'workflow_run' && trigger !== 'workflow_dispatch') {
        fail('The trigger must be workflow_run or workflow_dispatch');
    }
    if (releaseGate && trigger !== 'workflow_dispatch') {
        fail('Release-gate mode requires workflow_dispatch');
    }
    // Release-gate mode, and a manual recovery dispatch while
    // V3_RELEASE_PLEASE_ENABLED is true, also take a V3 Step 1 run dispatched
    // from a strict v3.X.Y tag.
    const tagRun =
        (releaseGate ||
            (releasePleaseMode && trigger === 'workflow_dispatch')) &&
        run.path === V3_STEP1_PATH &&
        typeof run.head_branch === 'string' &&
        STABLE_V3_TAG_PATTERN.test(run.head_branch);
    requireRunSource(
        run,
        repository,
        STEP1_FILES.map(file => ({
            path: file.path,
            workflowId: workflowIds[file.idKey],
        })),
        tagRun ? [STEP1_BRANCH, run.head_branch as string] : [STEP1_BRANCH]
    );
    let resolvedReleaseTag: string | undefined;
    if (tagRun) {
        const headBranch = run.head_branch as string;
        if (!releaseTag) {
            process.stderr.write(
                `::warning::release_tag was not passed; caller predates release_tag, using Step 1 head_branch (${headBranch})\n`
            );
            resolvedReleaseTag = headBranch;
        } else if (releaseTag !== headBranch) {
            fail(
                'The candidate release_tag must equal the Step 1 run head_branch'
            );
        } else {
            resolvedReleaseTag = releaseTag;
        }
    } else if (releaseTag) {
        process.stderr.write(
            `::warning::release_tag (${releaseTag}) was passed for a branch-origin Step 1 run (${run.head_branch as string}) and is ignored\n`
        );
    }
    // The source check accepted the path, so it names one of STEP1_FILES.
    const file = STEP1_FILES.find(candidate => candidate.path === run.path);
    if (
        !file ||
        typeof run.display_title !== 'string' ||
        !file.title.test(run.display_title)
    ) {
        fail('The release run title is not the V3 run-name of its Step 1 file');
    }
    const runId = validateRunId(stringOf(run.id), 'The run ID');
    const runAttempt = stringOf(run.run_attempt);
    if (!RUN_ATTEMPT_PATTERN.test(runAttempt)) {
        fail('The run attempt must be a positive integer');
    }
    if (jobs !== undefined) {
        requireAttemptJobs(jobs, runId, runAttempt);
    }
    if (releaseGate) {
        const attempt = requireReleaseGateReady(
            run,
            jobs,
            artifacts,
            runId,
            runAttempt
        );
        const gatedBuildId = contract.validateBuildId(`${runId}-${attempt}`);
        return {
            skip: false,
            reason: '',
            runId,
            runAttempt,
            buildId: gatedBuildId,
            artifactName: `v3-candidate-${gatedBuildId}`,
            ...(resolvedReleaseTag ? { releaseTag: resolvedReleaseTag } : {}),
        };
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
        ...(resolvedReleaseTag ? { releaseTag: resolvedReleaseTag } : {}),
    };
}

function planReleaseStep(
    run: WorkflowRun,
    repository: string,
    workflowIds: ReleaseStepWorkflowIds,
    releasePleaseMode = false,
    jobs?: WorkflowJob[]
): ReleaseStepPlan {
    validateRepository(repository);
    validateRunId(workflowIds.step2, 'The Step 2 workflow ID');
    validateRunId(workflowIds.step3, 'The Step 3 workflow ID');
    validateRunId(workflowIds.v3Step2, 'The V3 Step 2 workflow ID');
    validateRunId(workflowIds.v3Step3, 'The V3 Step 3 workflow ID');
    const file = RELEASE_STEP_FILES.find(
        candidate => candidate.path === run.path
    );
    if (!file) {
        return fail('The release run is neither Step 2 nor Step 3');
    }
    requireRunSource(
        run,
        repository,
        [{ path: file.path, workflowId: workflowIds[file.idKey] }],
        RELEASE_STEP_BRANCHES
    );
    if (jobs !== undefined) {
        const runId = validateRunId(stringOf(run.id), 'The run ID');
        const runAttempt = stringOf(run.run_attempt);
        if (!RUN_ATTEMPT_PATTERN.test(runAttempt)) {
            fail('The run attempt must be a positive integer');
        }
        requireAttemptJobs(jobs, runId, runAttempt);
    }
    const step = file.step;
    const title =
        typeof run.display_title === 'string' ? run.display_title : '';
    const match = file.title.exec(title);
    const empty = {
        step,
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
    // Only the attempt's jobs tell a Step 3 run that pushed from a dry run or
    // a failed push: in Release Please mode real Step 2 runs have already put
    // every branch the check below reads at the tag.
    if (jobs === undefined) {
        fail('A Step 3 run needs the jobs of its run attempt (--jobs)');
    }
    const pushProblem = step3PushProblem(jobs);
    if (pushProblem) {
        return { ...empty, skip: true, reason: pushProblem };
    }
    return {
        step,
        skip: false,
        reason: '',
        releaseTag,
        releaseVersion,
        channels: [...contract.RELEASE_ORDER_CHANNELS, contract.GA_CHANNEL],
        // In Release Please mode, Step 3 leaves main alone: main already holds
        // the release and can move past the tag before Step 3 runs.
        branches: releasePleaseMode
            ? [...RELEASE_ORDER_BRANCHES]
            : [V3_TRUNK_BRANCH, ...RELEASE_ORDER_BRANCHES],
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
// in processing order. Release-gate mode requires every production pod; qa is
// optional and runs in the same matrix only when included in the list.
function selectPods(list: string, releaseGate = false): string[] {
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
    if (releaseGate) {
        const missing = PRODUCTION_PODS.filter(
            pod => !requested.includes(pod)
        );
        if (missing.length > 0) {
            fail(
                `Release-gate mode requires all production pods (${PRODUCTION_PODS.join(
                    ', '
                )}); missing: ${missing.join(', ')}`
            );
        }
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
            '--v3-workflow-id',
            '--trigger',
            '--release-gate',
            '--release-please-mode',
            '--release-tag',
            '--jobs',
            '--artifacts',
        ]);
        const releaseGate = flags.has('--release-gate')
            ? validateBoolean(single(flags, '--release-gate'), '--release-gate')
            : false;
        const releasePleaseMode = flags.has('--release-please-mode')
            ? validateBoolean(
                  single(flags, '--release-please-mode'),
                  '--release-please-mode'
              )
            : false;
        const releaseTag = flags.has('--release-tag')
            ? single(flags, '--release-tag')
            : undefined;
        const plan = planStep1(
            readRun(single(flags, '--run')),
            single(flags, '--repository'),
            {
                staging: single(flags, '--workflow-id'),
                v3: single(flags, '--v3-workflow-id'),
            },
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
                : undefined,
            releaseGate,
            releasePleaseMode,
            releaseTag
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
            ...(plan.releaseTag ? [`release_tag=${plan.releaseTag}`] : []),
        ];
    }
    if (command === 'release-step') {
        requireOnly(flags, [
            '--run',
            '--repository',
            '--step2-workflow-id',
            '--step3-workflow-id',
            '--v3-step2-workflow-id',
            '--v3-step3-workflow-id',
            '--release-please-mode',
            '--jobs',
        ]);
        const releasePleaseMode = flags.has('--release-please-mode')
            ? single(flags, '--release-please-mode')
            : 'false';
        if (releasePleaseMode !== 'true' && releasePleaseMode !== 'false') {
            fail('--release-please-mode must be true or false');
        }
        const plan = planReleaseStep(
            readRun(single(flags, '--run')),
            single(flags, '--repository'),
            {
                step2: single(flags, '--step2-workflow-id'),
                step3: single(flags, '--step3-workflow-id'),
                v3Step2: single(flags, '--v3-step2-workflow-id'),
                v3Step3: single(flags, '--v3-step3-workflow-id'),
            },
            releasePleaseMode === 'true',
            flags.has('--jobs')
                ? (readObjects(
                      single(flags, '--jobs'),
                      'jobs'
                  ) as WorkflowJob[])
                : undefined
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
        requireOnly(flags, ['--list', '--release-gate']);
        const releaseGate = flags.has('--release-gate')
            ? validateBoolean(single(flags, '--release-gate'), '--release-gate')
            : false;
        const pods = selectPods(single(flags, '--list'), releaseGate);
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
    PRODUCTION_PODS,
    STEP1_KIT_JOBS,
    STEP1_LEGACY_KIT_JOBS,
    STEP1_PACKAGE_JOB,
    STEP1_RELEASE_JOB,
    STEP3_PUSH_STEP,
    checkBranches,
    main,
    planReleaseStep,
    planStep1,
    selectPods,
};

module.exports = shadowReleaseTrigger;

export type ShadowReleaseTrigger = typeof shadowReleaseTrigger;
