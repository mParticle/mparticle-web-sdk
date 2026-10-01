import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import {
    buildCandidate,
    makeTempDirectory,
    writeCandidateDirectory,
} from './v3-release/helpers';

const yaml = require('js-yaml');

const REPO_ROOT = path.join(__dirname, '../..');
const WORKFLOW_DIRECTORY = '.github/workflows';
const CANDIDATE_PATH = `${WORKFLOW_DIRECTORY}/v3-shadow-candidate.yml`;
const PROMOTE_PATH = `${WORKFLOW_DIRECTORY}/v3-shadow-promote.yml`;
const UPLOAD_JOB_PATH = `${WORKFLOW_DIRECTORY}/v3-shadow-upload-job.yml`;
const POINTER_JOB_PATH = `${WORKFLOW_DIRECTORY}/v3-shadow-pointer-job.yml`;
const PODS = ['qa', 'us1', 'us2', 'st1', 'eu1', 'au1'];
const AWS_ACTION =
    'aws-actions/configure-aws-credentials@e1253824e5c10ff9df46874f81ed3ec929e19cfd';
const REUSABLE_USES = /^uses: \.\/\.github\/workflows\/v3-shadow-(upload|pointer)-job\.yml # zizmor: ignore\[self-repository\] -- .+$/;

function read(workflowPath: string): string {
    return fs.readFileSync(path.join(REPO_ROOT, workflowPath), 'utf8');
}

function load(workflowPath: string): any {
    return yaml.load(read(workflowPath));
}

function stagingName(step: number): string {
    return load(`${WORKFLOW_DIRECTORY}/staging-step-${step}.yml`).name;
}

const CANDIDATE = load(CANDIDATE_PATH);
const PROMOTE = load(PROMOTE_PATH);
const UPLOAD_JOB = load(UPLOAD_JOB_PATH);
const POINTER_JOB = load(POINTER_JOB_PATH);
const WORKFLOWS: Array<[string, any]> = [
    [CANDIDATE_PATH, CANDIDATE],
    [PROMOTE_PATH, PROMOTE],
    [UPLOAD_JOB_PATH, UPLOAD_JOB],
    [POINTER_JOB_PATH, POINTER_JOB],
];

// Every workflow in the repository that parses, keyed by path.
function repositoryWorkflows(): Array<[string, any]> {
    return fs
        .readdirSync(path.join(REPO_ROOT, WORKFLOW_DIRECTORY))
        .filter(name => /\.ya?ml$/.test(name))
        .map(name => `${WORKFLOW_DIRECTORY}/${name}`)
        .map(workflowPath => {
            try {
                return [workflowPath, load(workflowPath)] as [string, any];
            } catch {
                return [workflowPath, undefined] as [string, any];
            }
        })
        .filter(([, workflow]) => workflow && workflow.jobs);
}

function runnerJobs(workflow: any): Array<[string, any]> {
    return (Object.entries(workflow.jobs) as Array<[string, any]>).filter(
        ([, job]) => job.uses === undefined
    );
}

function allSteps(workflow: any): Array<[string, any]> {
    return runnerJobs(workflow).flatMap(([jobName, job]) =>
        job.steps.map((step: any) => [jobName, step] as [string, any])
    );
}

function stepNamed(job: any, name: string): any {
    const step = job.steps.find((candidate: any) => candidate.name === name);
    expect(step).toBeDefined();
    return step;
}

function runScript(
    script: string,
    env: Record<string, string>,
    cwd = REPO_ROOT
): { status: number | null; output: string } {
    const result = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', '-c', script], {
        cwd,
        encoding: 'utf8',
        env: { ...process.env, ...env },
    });
    return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

describe('V3 shadow release workflows', () => {
    describe('triggers', () => {
        it('runs the candidate workflow after Step 1 on v3-staging only', () => {
            expect(CANDIDATE.on.workflow_run).toEqual({
                workflows: [stagingName(1)],
                types: ['completed'],
                branches: ['v3-staging'],
            });
            expect(Object.keys(CANDIDATE.on).sort()).toEqual([
                'workflow_dispatch',
                'workflow_run',
            ]);
            expect(Object.keys(CANDIDATE.on.workflow_dispatch.inputs)).toEqual([
                'step1_run_id',
            ]);
        });

        it('runs the promote workflow after Steps 2 and 3 from their trunks', () => {
            expect(PROMOTE.on.workflow_run).toEqual({
                workflows: [stagingName(2), stagingName(3)],
                types: ['completed'],
                branches: ['main', 'master'],
            });
            expect(Object.keys(PROMOTE.on).sort()).toEqual([
                'workflow_dispatch',
                'workflow_run',
            ]);
            const inputs = PROMOTE.on.workflow_dispatch.inputs;
            expect(inputs.dry_run.default).toBe(true);
            expect(inputs.operation.default).toBe('show');
            expect(inputs.allow_downgrade).toMatchObject({ type: 'boolean', default: false });
            expect(inputs.allow_rebuild).toMatchObject({ type: 'boolean', default: false });
            expect(inputs.channel).toMatchObject({
                type: 'choice',
                default: 'choose-a-channel',
                options: [
                    'choose-a-channel',
                    'v3-release-order-a',
                    'v3-release-order-b',
                    'v3-release-order-c',
                    'v3-staging',
                    'ga',
                ],
            });
            expect(inputs.pods).toMatchObject({
                type: 'choice',
                default: 'qa',
                options: ['qa', 'all-production', 'us1', 'us2', 'st1', 'eu1', 'au1'],
            });
        });

        it('makes the credentialed workflows callable only, never dispatchable', () => {
            for (const workflow of [UPLOAD_JOB, POINTER_JOB]) {
                expect(Object.keys(workflow.on)).toEqual(['workflow_call']);
                expect(workflow.on.workflow_call.secrets).toBeUndefined();
            }
        });

        it('does not change the paired staging workflows', () => {
            for (const step of [1, 2, 3]) {
                expect(read(`${WORKFLOW_DIRECTORY}/staging-step-${step}.yml`)).not.toMatch(
                    /v3-shadow|v3-candidate-upload|v3-release-promote/
                );
            }
        });
    });

    describe('OIDC trust boundary', () => {
        const ENVIRONMENT_JOBS: Record<string, string> = {
            'v3-candidate-upload': `${UPLOAD_JOB_PATH}#upload`,
            'v3-release-promote': `${POINTER_JOB_PATH}#pointers`,
        };

        it('declares each Environment in exactly one job, inside its reusable workflow', () => {
            const found: Record<string, string[]> = {};
            for (const [workflowPath, workflow] of repositoryWorkflows()) {
                for (const [jobName, job] of Object.entries(workflow.jobs) as Array<[string, any]>) {
                    const environment =
                        job.environment && typeof job.environment === 'object'
                            ? job.environment.name
                            : job.environment;
                    if (environment in ENVIRONMENT_JOBS) {
                        found[environment] = [...(found[environment] || []), `${workflowPath}#${jobName}`];
                    }
                }
            }
            for (const [environment, job] of Object.entries(ENVIRONMENT_JOBS)) {
                expect(found[environment]).toEqual([job]);
            }
        });

        it('calls each reusable workflow only through a local uses from the shadow callers', () => {
            const callers: Record<string, string[]> = {};
            for (const [workflowPath, workflow] of repositoryWorkflows()) {
                for (const [jobName, job] of Object.entries(workflow.jobs) as Array<[string, any]>) {
                    if (typeof job.uses === 'string' && job.uses.includes('v3-shadow-')) {
                        callers[job.uses] = [...(callers[job.uses] || []), `${workflowPath}#${jobName}`];
                    }
                }
            }
            expect(callers).toEqual({
                './.github/workflows/v3-shadow-upload-job.yml': [`${CANDIDATE_PATH}#upload`],
                './.github/workflows/v3-shadow-pointer-job.yml': [
                    `${CANDIDATE_PATH}#stage`,
                    `${PROMOTE_PATH}#promote`,
                ],
            });
        });

        it('names the pinned trust values in the caller header', () => {
            const header = read(CANDIDATE_PATH);
            for (const value of [
                'repo:mParticle/mparticle-web-sdk:environment:v3-candidate-upload',
                'repo:mParticle/mparticle-web-sdk:environment:v3-release-promote',
                'mParticle/mparticle-web-sdk/.github/workflows/v3-shadow-upload-job.yml@refs/heads/main',
                'mParticle/mparticle-web-sdk/.github/workflows/v3-shadow-pointer-job.yml@refs/heads/main',
            ]) {
                expect(header).toContain(value);
            }
        });
    });

    describe.each(WORKFLOWS)('%s', (workflowPath, workflow) => {
        it('denies permissions by default and grants each job only what it uses', () => {
            expect(workflow.permissions).toEqual({});
            for (const [name, job] of Object.entries(workflow.jobs) as Array<[string, any]>) {
                expect(job.permissions).toBeDefined();
                for (const [scope, level] of Object.entries(job.permissions)) {
                    expect(['actions', 'contents', 'id-token']).toContain(scope);
                    expect(level).toBe(scope === 'id-token' ? 'write' : 'read');
                }
                const hasIdToken = job.permissions['id-token'] === 'write';
                if (job.uses !== undefined) {
                    // A caller job only sets the ceiling for its called job,
                    // and passes no secrets: the called job reads its own
                    // Environment's secrets.
                    expect(job.uses).toMatch(/^\.\/\.github\/workflows\/v3-shadow-(upload|pointer)-job\.yml$/);
                    expect(job.environment).toBeUndefined();
                    expect(job.secrets).toBeUndefined();
                    expect(job.steps).toBeUndefined();
                    expect(hasIdToken).toBe(true);
                } else {
                    expect(job['timeout-minutes']).toBeGreaterThan(0);
                    expect(job['runs-on']).toBe('ubuntu-24.04');
                    expect(hasIdToken).toBe(job.environment !== undefined);
                    if (!job.environment) {
                        expect(JSON.stringify(job)).not.toContain('secrets.');
                    }
                }
                expect(name).toMatch(/^[a-z-]+$/);
            }
        });

        it('pins every action to a full commit SHA with its version', () => {
            const source = read(workflowPath);
            const uses = source.match(/uses: .+/g) || [];
            expect(uses.length).toBeGreaterThan(0);
            for (const line of uses) {
                if (!REUSABLE_USES.test(line)) {
                    expect(line).toMatch(/^uses: [\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d+\.\d+\.\d+$/);
                }
            }
        });

        it('never checks out code from the triggering run or persists credentials', () => {
            for (const [, step] of allSteps(workflow)) {
                if (String(step.uses).startsWith('actions/checkout@')) {
                    expect(step.with).toEqual({
                        'persist-credentials': false,
                        'fetch-depth': 1,
                        ref: '${{ github.sha }}',
                    });
                }
            }
            expect(read(workflowPath)).not.toMatch(
                /github\.event\.workflow_run\.(head_sha|head_branch|head_commit|pull_requests)/
            );
        });

        it('keeps expressions out of run scripts', () => {
            for (const [, step] of allSteps(workflow)) {
                if (step.run !== undefined) {
                    expect(step.run).not.toContain('${{');
                }
            }
        });

        it('requires the default-branch definition before any other work', () => {
            for (const [, job] of runnerJobs(workflow)) {
                if (job.environment !== undefined || workflow.jobs.resolve === job) {
                    expect(job.steps[2].name).toBe('Require the default branch definition');
                }
            }
            if (workflow.jobs.resolve) {
                expect(workflow.jobs.resolve.if).toContain(
                    "github.repository == 'mParticle/mparticle-web-sdk'"
                );
                expect(workflow.jobs.resolve.environment).toBeUndefined();
            }
        });

        it('assumes each pod role with an account guard, scoped to that pod only', () => {
            const source = read(workflowPath);
            expect(source).not.toMatch(/secrets\[/);
            expect(source).not.toMatch(/KMS/i);
            for (const [jobName, job] of runnerJobs(workflow)) {
                const awsSteps = job.steps.filter((step: any) =>
                    String(step.uses).startsWith('aws-actions/')
                );
                if (awsSteps.length === 0) {
                    continue;
                }
                expect(workflow.on.workflow_call).toBeDefined();
                expect(jobName).toMatch(/^(upload|pointers)$/);
                expect(awsSteps).toHaveLength(PODS.length);
                PODS.forEach((pod, index) => {
                    const upper = pod.toUpperCase();
                    const awsStep = awsSteps[index];
                    expect(awsStep.name).toBe(`Configure AWS credentials (${pod})`);
                    expect(awsStep.uses).toBe(AWS_ACTION);
                    expect(awsStep.if).toContain(`steps.pods.outputs.${pod} == 'true'`);
                    expect(awsStep.with).toEqual({
                        'role-to-assume': `\${{ secrets.AWS_ROLE_ARN_${upper} }}`,
                        'role-session-name': expect.stringMatching(
                            new RegExp(`^v3-shadow-[a-z]+-${pod}-\\$\\{\\{ github.run_id \\}\\}-\\$\\{\\{ github.run_attempt \\}\\}$`)
                        ),
                        'aws-region': `\${{ secrets.AWS_REGION_${upper} }}`,
                        'role-duration-seconds': 900,
                        'allowed-account-ids': `\${{ secrets.AWS_ACCOUNT_ID_${upper} }}`,
                        'mask-aws-account-id': true,
                        'unset-current-credentials': true,
                    });
                    const next = job.steps[job.steps.indexOf(awsStep) + 1];
                    expect(next.if).toBe(awsStep.if);
                    expect(next.env).toEqual({
                        AWS_ACCOUNT_ID: `\${{ secrets.AWS_ACCOUNT_ID_${upper} }}`,
                        SDK_ARTIFACT_BUCKET: `\${{ secrets.SDK_ARTIFACT_BUCKET_${upper} }}`,
                    });
                    expect(next.run).toContain(pod);
                    const otherPods = PODS.filter(other => other !== pod);
                    const scoped = JSON.stringify([awsStep, next]);
                    for (const other of otherPods) {
                        expect(scoped).not.toContain(`_${other.toUpperCase()} `);
                    }
                });
                // Pods are re-selected inside the credentialed job, before
                // any credential step.
                const pods = stepNamed(job, 'Select pods');
                expect(pods.env).toEqual({ POD_LIST: '${{ inputs.pods }}' });
                expect(job.steps.indexOf(pods)).toBeLessThan(job.steps.indexOf(awsSteps[0]));
            }
        });
    });

    describe('candidate workflow', () => {
        const jobs = CANDIDATE.jobs;

        it('orders resolve, verify, upload and stage, with credentials only in called jobs', () => {
            expect(Object.keys(jobs)).toEqual(['resolve', 'verify', 'upload', 'stage']);
            expect(jobs.verify.needs).toBe('resolve');
            expect(jobs.verify.if).toBe("${{ needs.resolve.outputs.found == 'true' }}");
            expect(jobs.verify.environment).toBeUndefined();
            expect(jobs.upload.needs).toEqual(['resolve', 'verify']);
            expect(jobs.upload.if).toBe(
                "${{ needs.verify.outputs.git_parity == 'pass' && needs.verify.outputs.npm_parity != 'fail' }}"
            );
            expect(jobs.upload.permissions).toEqual({
                actions: 'read',
                contents: 'read',
                'id-token': 'write',
            });
            expect(jobs.stage.needs).toEqual(['resolve', 'verify', 'upload']);
            expect(jobs.stage.permissions).toEqual({ contents: 'read', 'id-token': 'write' });
            expect(CANDIDATE.concurrency).toEqual({
                group: 'v3-shadow-candidate',
                'cancel-in-progress': false,
            });
        });

        it('passes the verified identity to the upload job', () => {
            expect(jobs.upload.with).toEqual({
                run_id: '${{ needs.resolve.outputs.run_id }}',
                artifact_name: '${{ needs.resolve.outputs.artifact_name }}',
                build_id: '${{ needs.resolve.outputs.build_id }}',
                version: '${{ needs.verify.outputs.version }}',
                metadata_sha256: '${{ needs.verify.outputs.metadata_sha256 }}',
                source_sha: '${{ needs.verify.outputs.source_sha }}',
                pods: '${{ needs.resolve.outputs.pods }}',
            });
            expect(Object.keys(UPLOAD_JOB.on.workflow_call.inputs).sort()).toEqual(
                Object.keys(jobs.upload.with).sort()
            );
        });

        it('stages through the pointer job, guarded by the v3-staging tip', () => {
            expect(jobs.stage.with).toEqual({
                operation: 'stage',
                version: '${{ needs.verify.outputs.version }}',
                build_id: '${{ needs.resolve.outputs.build_id }}',
                expected_metadata_sha256: '${{ needs.verify.outputs.metadata_sha256 }}',
                release_tag: '${{ needs.verify.outputs.release_tag }}',
                branches: 'v3-staging',
                pods: '${{ needs.resolve.outputs.pods }}',
                dry_run: false,
            });
        });

        it('only downloads the artifact of the validated Step 1 run', () => {
            const download = (job: any) =>
                job.steps.find((step: any) => String(step.uses).startsWith('actions/download-artifact@'));
            expect(download(jobs.verify).with).toEqual({
                name: '${{ needs.resolve.outputs.artifact_name }}',
                'run-id': '${{ needs.resolve.outputs.run_id }}',
                'github-token': '${{ github.token }}',
                path: '${{ runner.temp }}/v3-candidate',
            });
            expect(download(UPLOAD_JOB.jobs.upload).with).toEqual({
                name: '${{ inputs.artifact_name }}',
                'run-id': '${{ inputs.run_id }}',
                'github-token': '${{ github.token }}',
                path: '${{ runner.temp }}/v3-candidate',
            });
        });

        it('passes the trigger to the Step 1 check and skips an ineligible run', () => {
            const validate = stepNamed(jobs.resolve, 'Validate the Step 1 run');
            expect(validate.run).toContain('--trigger "$GITHUB_EVENT_NAME"');
            expect(stepNamed(jobs.resolve, 'Find the shadow candidate').if).toBe(
                "${{ steps.run.outputs.skip == 'false' }}"
            );
        });

        it('checks parity with git and npm before any credential is issued', () => {
            const parity = stepNamed(jobs.verify, 'Check parity with git and npm');
            expect(parity.run).toContain('check-release-parity.ts');
            expect(parity.run).toContain('--npm');
            expect(parity.run).toContain('--summary "$GITHUB_STEP_SUMMARY"');
            expect(stepNamed(jobs.verify, 'Fetch the release tag').run).toContain(
                'git fetch --no-tags --depth=1 origin "+refs/tags/${RELEASE_TAG}:refs/tags/${RELEASE_TAG}"'
            );
        });

        it('runs the independent checker on the validated candidate before the parity check', () => {
            const names = jobs.verify.steps.map((step: any) => step.name);
            const check = stepNamed(jobs.verify, 'Check the candidate independently');
            expect(names.indexOf('Check the candidate independently')).toBe(
                names.indexOf('Validate the candidate') + 1
            );
            expect(names.indexOf('Check the candidate independently')).toBeLessThan(
                names.indexOf('Check parity with git and npm')
            );
            expect(check.env).toEqual({
                VERSION: '${{ steps.candidate.outputs.version }}',
                BUILD_ID: '${{ needs.resolve.outputs.build_id }}',
            });
            expect(check.run).toContain('scripts/check-v3-candidate.ts');
            expect(check.run).toContain('"$RUNNER_TEMP/v3-candidate"');
            expect(check.run).toContain('--version "$VERSION"');
            expect(check.run).toContain('--build-id "$BUILD_ID"');
        });

        it('fails the verify job on a candidate the uploader accepts but the checker rejects', () => {
            const directory = makeTempDirectory('v3-shadow-check-');
            try {
                const candidate = buildCandidate();
                writeCandidateDirectory(path.join(directory, 'v3-candidate'), candidate);
                const script = stepNamed(jobs.verify, 'Check the candidate independently').run;
                const result = runScript(script, {
                    RUNNER_TEMP: directory,
                    VERSION: candidate.version,
                    BUILD_ID: candidate.buildId,
                });
                expect(result.status).toBe(1);
                expect(result.output).toContain('V3 candidate check failed');
            } finally {
                fs.rmSync(directory, { recursive: true, force: true });
            }
        });

        it.each([['1\n2'], ['0'], ['12a'], ['']])(
            'rejects the dispatch run ID %j before calling GitHub',
            runId => {
                const script = stepNamed(jobs.resolve, 'Validate the Step 1 run').run;
                const result = runScript(script, {
                    GITHUB_EVENT_NAME: 'workflow_dispatch',
                    STEP1_RUN_ID: runId,
                    RUNNER_TEMP: '/nonexistent',
                    PATH: '/usr/bin:/bin',
                });
                expect(result.status).toBe(1);
                expect(result.output).toContain('step1_run_id must be a workflow run ID.');
            }
        );

        it('finds the artifact by exact name and skips cleanly when it is absent', () => {
            const directory = makeTempDirectory('v3-shadow-artifact-');
            try {
                const bin = path.join(directory, 'bin');
                fs.mkdirSync(bin);
                const artifacts = path.join(directory, 'artifacts.json');
                fs.writeFileSync(
                    path.join(bin, 'gh'),
                    `#!/bin/sh\ncat "${artifacts}"\n`,
                    { mode: 0o755 }
                );
                const script = stepNamed(jobs.resolve, 'Find the shadow candidate').run;
                const outputs = path.join(directory, 'outputs');
                const find = (list: unknown[]) => {
                    fs.writeFileSync(artifacts, JSON.stringify({ artifacts: list }));
                    fs.writeFileSync(outputs, '');
                    const result = runScript(script, {
                        PATH: `${bin}:${process.env.PATH}`,
                        GITHUB_OUTPUT: outputs,
                        GITHUB_REPOSITORY: 'example-org/example-repo',
                        RUN_ID: '1',
                        ARTIFACT_NAME: 'v3-candidate-1-1',
                    });
                    expect(result.status).toBe(0);
                    return fs.readFileSync(outputs, 'utf8');
                };
                expect(find([{ name: 'v3-candidate-1-1', expired: false }])).toBe('found=true\n');
                expect(find([{ name: 'v3-candidate-1-1', expired: true }])).toBe('found=false\n');
                expect(find([{ name: 'v3-candidate-1-2', expired: false }])).toBe('found=false\n');
                expect(find([])).toBe('found=false\n');
            } finally {
                fs.rmSync(directory, { recursive: true, force: true });
            }
        });
    });

    describe('upload job', () => {
        const job = UPLOAD_JOB.jobs.upload;

        it('uploads create-only, bound to the verified identity, in its own Environment', () => {
            expect(Object.keys(UPLOAD_JOB.jobs)).toEqual(['upload']);
            expect(job.environment).toBe('v3-candidate-upload');
            expect(job.env).toMatchObject({
                BUILD_ID: '${{ inputs.build_id }}',
                CANDIDATE_VERSION: '${{ inputs.version }}',
                METADATA_SHA256: '${{ inputs.metadata_sha256 }}',
                SOURCE_SHA: '${{ inputs.source_sha }}',
            });
            const uploads = job.steps.filter((step: any) =>
                String(step.name).startsWith('Upload the candidate (')
            );
            expect(uploads).toHaveLength(PODS.length);
            for (const step of uploads) {
                for (const flag of [
                    '--expected-version "$CANDIDATE_VERSION"',
                    '--expected-build-id "$BUILD_ID"',
                    '--expected-metadata-sha256 "$METADATA_SHA256"',
                    '--expected-source-sha "$SOURCE_SHA"',
                ]) {
                    expect(step.run).toContain(flag);
                }
                expect(step.run).not.toContain('--dry-run');
            }
        });
    });

    describe('pointer job', () => {
        const job = POINTER_JOB.jobs.pointers;

        it('moves pointers in its own Environment after re-checking the release branches', () => {
            expect(Object.keys(POINTER_JOB.jobs)).toEqual(['pointers']);
            expect(job.environment).toBe('v3-release-promote');
            expect(job.concurrency).toBeUndefined();
            const recheck = stepNamed(job, 'Re-check the release branches');
            expect(recheck.run).toContain('shadow-release-trigger.ts branches');
            const moves = job.steps.filter((step: any) => String(step.name).startsWith('Move pointers ('));
            expect(moves).toHaveLength(PODS.length);
            for (const step of moves) {
                expect(step.if).toContain("steps.branch.outputs.matches == 'true'");
                expect(step.run).toMatch(/^bash scripts\/v3-release\/promote-from-workflow\.sh [a-z0-9]+$/);
            }
        });

        it('requires the branch tips only for a release-driven move', () => {
            expect(job.env).toMatchObject({
                OPERATION: '${{ inputs.operation }}',
                EXPECTED_METADATA_SHA256: '${{ inputs.expected_metadata_sha256 }}',
                REQUIRE_BRANCH_TIPS: "${{ inputs.release_tag != '' && inputs.branches || '' }}",
                DRY_RUN: '${{ inputs.dry_run }}',
                ALLOW_DOWNGRADE: '${{ inputs.allow_downgrade }}',
                ALLOW_REBUILD: '${{ inputs.allow_rebuild }}',
            });
            const inputs = POINTER_JOB.on.workflow_call.inputs;
            expect(inputs.dry_run).toEqual({ required: true, type: 'boolean' });
            expect(inputs.allow_downgrade).toMatchObject({ type: 'boolean', default: false });
            expect(inputs.allow_rebuild).toMatchObject({ type: 'boolean', default: false });
        });
    });

    describe('promote workflow', () => {
        const jobs = PROMOTE.jobs;

        it('plans without credentials, then moves every pointer through the pointer job', () => {
            expect(Object.keys(jobs)).toEqual(['resolve', 'promote']);
            expect(jobs.promote.needs).toBe('resolve');
            expect(jobs.promote.if).toBe("${{ needs.resolve.outputs.skip == 'false' }}");
            expect(jobs.promote.permissions).toEqual({ contents: 'read', 'id-token': 'write' });
            expect(PROMOTE.concurrency).toBeUndefined();
            expect(jobs.promote.with).toEqual({
                operation: '${{ needs.resolve.outputs.operation }}',
                channel: '${{ needs.resolve.outputs.channel }}',
                version: '${{ needs.resolve.outputs.version }}',
                build_id: '${{ needs.resolve.outputs.build_id }}',
                release_tag: '${{ needs.resolve.outputs.release_tag }}',
                branches: '${{ needs.resolve.outputs.branches }}',
                pods: '${{ needs.resolve.outputs.pods }}',
                dry_run: "${{ needs.resolve.outputs.dry_run == 'true' }}",
                allow_downgrade: "${{ needs.resolve.outputs.allow_downgrade == 'true' }}",
                allow_rebuild: "${{ needs.resolve.outputs.allow_rebuild == 'true' }}",
            });
        });

        describe('dispatch plan', () => {
            let directory: string;
            let outputs: string;
            const script = () =>
                stepNamed(jobs.resolve, 'Plan from the release run or the dispatch inputs').run;
            const inputs = {
                GITHUB_EVENT_NAME: 'workflow_dispatch',
                INPUT_OPERATION: 'rollback',
                INPUT_CHANNEL: 'ga',
                INPUT_VERSION: '3.4.1',
                INPUT_BUILD_ID: '100-1',
                INPUT_DRY_RUN: 'true',
                INPUT_ALLOW_DOWNGRADE: 'true',
                INPUT_ALLOW_REBUILD: 'false',
            };

            beforeEach(() => {
                directory = makeTempDirectory('v3-shadow-plan-');
                outputs = path.join(directory, 'outputs');
                fs.writeFileSync(outputs, '');
            });

            afterEach(() => {
                fs.rmSync(directory, { recursive: true, force: true });
            });

            it('passes validated inputs through', () => {
                const result = runScript(script(), { ...inputs, GITHUB_OUTPUT: outputs });
                expect(result.status).toBe(0);
                expect(fs.readFileSync(outputs, 'utf8')).toBe(
                    [
                        'skip=false',
                        'operation=rollback',
                        'channel=ga',
                        'version=3.4.1',
                        'build_id=100-1',
                        'dry_run=true',
                        'allow_downgrade=true',
                        'allow_rebuild=false',
                        'release_tag=',
                        'branches=',
                        '',
                    ].join('\n')
                );
            });

            it.each([
                ['an unknown operation', { INPUT_OPERATION: 'delete' }],
                ['an unknown channel', { INPUT_CHANNEL: 'production' }],
                ['a V2 version', { INPUT_VERSION: '2.30.0' }],
                ['an injected version', { INPUT_VERSION: '3.4.1\nskip=false' }],
                ['an unsafe build ID', { INPUT_BUILD_ID: '../1' }],
                ['a non-boolean dry run', { INPUT_DRY_RUN: 'yes' }],
                ['a non-boolean allow_downgrade', { INPUT_ALLOW_DOWNGRADE: '1' }],
                ['allow_downgrade outside rollback', { INPUT_OPERATION: 'promote-ga' }],
                ['allow_rebuild on rollback', { INPUT_ALLOW_REBUILD: 'true' }],
                ['allow_rebuild on show', { INPUT_OPERATION: 'show', INPUT_ALLOW_DOWNGRADE: 'false', INPUT_ALLOW_REBUILD: 'true' }],
            ])('rejects %s', (_label, overrides) => {
                const result = runScript(script(), {
                    ...inputs,
                    ...overrides,
                    GITHUB_OUTPUT: outputs,
                });
                expect(result.status).not.toBe(0);
                expect(fs.readFileSync(outputs, 'utf8')).toBe('');
            });

            it.each([['show'], ['promote-release-order'], ['rollback']])(
                'rejects %s while the channel placeholder is selected',
                operation => {
                    const result = runScript(script(), {
                        ...inputs,
                        INPUT_OPERATION: operation,
                        INPUT_CHANNEL: 'choose-a-channel',
                        INPUT_ALLOW_DOWNGRADE: operation === 'rollback' ? 'true' : 'false',
                        GITHUB_OUTPUT: outputs,
                    });
                    expect(result.status).toBe(1);
                    expect(result.output).toContain(
                        `${operation} needs a channel: choose one in the channel input.`
                    );
                    expect(fs.readFileSync(outputs, 'utf8')).toBe('');
                }
            );

            it.each([['stage'], ['promote-ga']])(
                'ignores the channel input for %s',
                operation => {
                    for (const channel of ['choose-a-channel', 'ga']) {
                        fs.writeFileSync(outputs, '');
                        const result = runScript(script(), {
                            ...inputs,
                            INPUT_OPERATION: operation,
                            INPUT_CHANNEL: channel,
                            INPUT_ALLOW_DOWNGRADE: 'false',
                            GITHUB_OUTPUT: outputs,
                        });
                        expect(result.status).toBe(0);
                        const lines = fs.readFileSync(outputs, 'utf8').split('\n');
                        expect(lines).toContain(`operation=${operation}`);
                        expect(lines).toContain('channel=');
                    }
                }
            );
        });

        describe('pod selection', () => {
            let directory: string;
            let outputs: string;
            const select = (event: string, podList: string) => {
                fs.writeFileSync(outputs, '');
                const result = runScript(stepNamed(jobs.resolve, 'Select pods').run, {
                    GITHUB_EVENT_NAME: event,
                    POD_LIST: podList,
                    GITHUB_OUTPUT: outputs,
                });
                return { status: result.status, outputs: fs.readFileSync(outputs, 'utf8') };
            };

            beforeEach(() => {
                directory = makeTempDirectory('v3-shadow-pods-');
                outputs = path.join(directory, 'outputs');
            });

            afterEach(() => {
                fs.rmSync(directory, { recursive: true, force: true });
            });

            it('reads the dispatch input, or the repository variable for a release run', () => {
                expect(stepNamed(jobs.resolve, 'Select pods').env).toEqual({
                    POD_LIST: "${{ github.event_name == 'workflow_dispatch' && inputs.pods || vars.V3_SHADOW_PODS }}",
                });
            });

            it('expands all-production to every production pod on dispatch', () => {
                expect(select('workflow_dispatch', 'all-production')).toEqual({
                    status: 0,
                    outputs: [
                        'pods=us1,us2,st1,eu1,au1',
                        'qa=false',
                        ...PODS.filter(pod => pod !== 'qa').map(pod => `${pod}=true`),
                        '',
                    ].join('\n'),
                });
            });

            it.each([['qa'], ['us1'], ['au1']])('selects the single dispatched pod %s', pod => {
                const result = select('workflow_dispatch', pod);
                expect(result.status).toBe(0);
                expect(result.outputs.split('\n')[0]).toBe(`pods=${pod}`);
            });

            it('keeps the release-run pod list as it was, with no all-production alias', () => {
                const result = select('workflow_run', 'qa,us1');
                expect(result.status).toBe(0);
                expect(result.outputs.split('\n')[0]).toBe('pods=qa,us1');
                expect(select('workflow_run', 'all-production')).toEqual({ status: 1, outputs: '' });
            });
        });

        it('maps each operation onto the promoter', () => {
            const directory = makeTempDirectory('v3-shadow-map-');
            try {
                const bin = path.join(directory, 'bin');
                const log = path.join(directory, 'node.log');
                fs.mkdirSync(bin);
                fs.writeFileSync(path.join(bin, 'node'), `#!/bin/sh\necho "$*" >> "${log}"\n`, {
                    mode: 0o755,
                });
                const base = {
                    PATH: `${bin}:${process.env.PATH}`,
                    RUNNER_TEMP: directory,
                    CHANNEL: '',
                    RELEASE_VERSION: '',
                    BUILD_ID: '',
                    EXPECTED_METADATA_SHA256: '',
                    REQUIRE_BRANCH_TIPS: '',
                    ALLOW_DOWNGRADE: 'false',
                    ALLOW_REBUILD: 'false',
                    DRY_RUN: 'false',
                };
                const map = (env: Record<string, string>) => {
                    fs.writeFileSync(log, '');
                    const result = runScript('bash scripts/v3-release/promote-from-workflow.sh qa', {
                        ...base,
                        ...env,
                    });
                    expect(result.status).toBe(0);
                    return fs
                        .readFileSync(log, 'utf8')
                        .trim()
                        .replace('--experimental-strip-types scripts/v3-release/promote-v3-release.ts ', '')
                        .replace(` --pod qa --progress-file ${directory}/v3-release-progress.jsonl`, '');
                };
                expect(
                    map({
                        OPERATION: 'promote-release-order',
                        CHANNEL: 'v3-release-order-b',
                        RELEASE_VERSION: '3.5.0',
                        REQUIRE_BRANCH_TIPS: 'v3-release-order-b',
                    })
                ).toBe(
                    'promote --from v3-staging --to v3-release-order-b --version 3.5.0 --require-branch-tip v3-release-order-b'
                );
                expect(
                    map({
                        OPERATION: 'promote-ga',
                        RELEASE_VERSION: '3.5.0',
                        REQUIRE_BRANCH_TIPS: 'main,v3-release-order-a',
                    })
                ).toBe('promote-ga --version 3.5.0 --require-branch-tip main --require-branch-tip v3-release-order-a');
                expect(
                    map({
                        OPERATION: 'rollback',
                        CHANNEL: 'ga',
                        RELEASE_VERSION: '3.4.1',
                        BUILD_ID: '100-1',
                        ALLOW_DOWNGRADE: 'true',
                        DRY_RUN: 'true',
                    })
                ).toBe('rollback --channel ga --version 3.4.1 --build-id 100-1 --allow-downgrade --dry-run');
                expect(
                    map({
                        OPERATION: 'stage',
                        RELEASE_VERSION: '3.5.0',
                        BUILD_ID: '9-1',
                        EXPECTED_METADATA_SHA256: 'a'.repeat(64),
                        REQUIRE_BRANCH_TIPS: 'v3-staging',
                        ALLOW_REBUILD: 'true',
                    })
                ).toBe(
                    `stage --version 3.5.0 --build-id 9-1 --expected-metadata-sha256 ${'a'.repeat(64)} --require-branch-tip v3-staging --allow-rebuild`
                );
                expect(map({ OPERATION: 'show', CHANNEL: 'ga', DRY_RUN: 'true' })).toBe(
                    'show --channel ga'
                );
                const unknown = runScript('bash scripts/v3-release/promote-from-workflow.sh qa', {
                    ...base,
                    OPERATION: 'delete',
                });
                expect(unknown.status).toBe(1);
            } finally {
                fs.rmSync(directory, { recursive: true, force: true });
            }
        });
    });
});
