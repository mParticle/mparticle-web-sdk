import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { makeTempDirectory } from './v3-release/helpers';

const yaml = require('js-yaml');

const REPO_ROOT = path.join(__dirname, '../..');
const CANDIDATE_PATH = '.github/workflows/v3-shadow-candidate.yml';
const PROMOTE_PATH = '.github/workflows/v3-shadow-promote.yml';
const PODS = ['qa', 'us1', 'us2', 'st1', 'eu1', 'au1'];
const AWS_ACTION =
    'aws-actions/configure-aws-credentials@e1253824e5c10ff9df46874f81ed3ec929e19cfd';

function read(workflowPath: string): string {
    return fs.readFileSync(path.join(REPO_ROOT, workflowPath), 'utf8');
}

function load(workflowPath: string): any {
    return yaml.load(read(workflowPath));
}

function stagingName(step: number): string {
    return load(`.github/workflows/staging-step-${step}.yml`).name;
}

const CANDIDATE = load(CANDIDATE_PATH);
const PROMOTE = load(PROMOTE_PATH);
const WORKFLOWS: Array<[string, any]> = [
    [CANDIDATE_PATH, CANDIDATE],
    [PROMOTE_PATH, PROMOTE],
];

function allSteps(workflow: any): Array<[string, any]> {
    return Object.entries(workflow.jobs).flatMap(([jobName, job]: [string, any]) =>
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
            expect(PROMOTE.on.workflow_dispatch.inputs.dry_run.default).toBe(true);
            expect(PROMOTE.on.workflow_dispatch.inputs.operation.default).toBe('show');
        });

        it('does not change the paired staging workflows', () => {
            for (const step of [1, 2, 3]) {
                expect(read(`.github/workflows/staging-step-${step}.yml`)).not.toMatch(
                    /v3-shadow|v3-candidate-upload|v3-release-promote/
                );
            }
        });
    });

    describe.each(WORKFLOWS)('%s', (workflowPath, workflow) => {
        it('denies permissions by default and grants each job only what it uses', () => {
            expect(workflow.permissions).toEqual({});
            for (const [name, job] of Object.entries(workflow.jobs) as Array<[string, any]>) {
                expect(job.permissions).toBeDefined();
                expect(job['timeout-minutes']).toBeGreaterThan(0);
                expect(job['runs-on']).toBe('ubuntu-24.04');
                const granted = Object.entries(job.permissions);
                for (const [scope, level] of granted) {
                    expect(['actions', 'contents', 'id-token']).toContain(scope);
                    expect(level).toBe(scope === 'id-token' ? 'write' : 'read');
                }
                const hasIdToken = job.permissions['id-token'] === 'write';
                expect(hasIdToken).toBe(job.environment !== undefined);
                if (!job.environment) {
                    expect(JSON.stringify(job)).not.toContain('secrets.');
                }
                expect(name).toMatch(/^[a-z-]+$/);
            }
        });

        it('pins every action to a full commit SHA with its version', () => {
            const source = read(workflowPath);
            const uses = source.match(/uses: .+/g) || [];
            expect(uses.length).toBeGreaterThan(0);
            for (const line of uses) {
                expect(line).toMatch(/^uses: [\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d+\.\d+\.\d+$/);
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
            const resolve = workflow.jobs.resolve;
            expect(resolve.if).toContain("github.repository == 'mParticle/mparticle-web-sdk'");
            expect(resolve.environment).toBeUndefined();
            expect(resolve.steps[2].name).toBe('Require the default branch definition');
        });

        it('assumes each pod role with an account guard, scoped to that pod only', () => {
            const source = read(workflowPath);
            expect(source).not.toMatch(/secrets\[/);
            expect(source).not.toMatch(/KMS/i);
            for (const [jobName, job] of Object.entries(workflow.jobs) as Array<[string, any]>) {
                const awsSteps = job.steps.filter((step: any) =>
                    String(step.uses).startsWith('aws-actions/')
                );
                if (awsSteps.length === 0) {
                    continue;
                }
                expect(awsSteps).toHaveLength(PODS.length);
                PODS.forEach((pod, index) => {
                    const upper = pod.toUpperCase();
                    const awsStep = awsSteps[index];
                    expect(awsStep.name).toBe(`Configure AWS credentials (${pod})`);
                    expect(awsStep.uses).toBe(AWS_ACTION);
                    expect(awsStep.if).toContain(`needs.resolve.outputs.${pod} == 'true'`);
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
                expect(jobName).toMatch(/^(upload|stage|promote)$/);
            }
        });
    });

    describe('candidate workflow', () => {
        const jobs = CANDIDATE.jobs;

        it('orders resolve, verify, upload and stage, isolating the two Environments', () => {
            expect(Object.keys(jobs)).toEqual(['resolve', 'verify', 'upload', 'stage']);
            expect(jobs.verify.needs).toBe('resolve');
            expect(jobs.verify.if).toBe("${{ needs.resolve.outputs.found == 'true' }}");
            expect(jobs.verify.environment).toBeUndefined();
            expect(jobs.upload.needs).toEqual(['resolve', 'verify']);
            expect(jobs.upload.if).toBe(
                "${{ needs.verify.outputs.git_parity == 'pass' && needs.verify.outputs.npm_parity != 'fail' }}"
            );
            expect(jobs.upload.environment).toBe('v3-candidate-upload');
            expect(jobs.stage.needs).toEqual(['resolve', 'verify', 'upload']);
            expect(jobs.stage.environment).toBe('v3-release-promote');
            expect(jobs.stage.permissions).toEqual({ contents: 'read', 'id-token': 'write' });
            expect(CANDIDATE.concurrency).toEqual({
                group: 'v3-shadow-candidate',
                'cancel-in-progress': false,
            });
        });

        it('only downloads the artifact of the validated Step 1 run', () => {
            for (const jobName of ['verify', 'upload']) {
                const download = jobs[jobName].steps.find((step: any) =>
                    String(step.uses).startsWith('actions/download-artifact@')
                );
                expect(download.with).toEqual({
                    name: '${{ needs.resolve.outputs.artifact_name }}',
                    'run-id': '${{ needs.resolve.outputs.run_id }}',
                    'github-token': '${{ github.token }}',
                    path: '${{ runner.temp }}/v3-candidate',
                });
            }
        });

        it('uploads create-only, bound to the verified identity, and stages after the branch check', () => {
            const uploads = jobs.upload.steps.filter((step: any) =>
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
            const branch = stepNamed(jobs.stage, 'Require v3-staging at the release tag');
            expect(branch.run).toContain('branches \\\n');
            expect(branch.run).toContain('--branch v3-staging');
            const stages = jobs.stage.steps.filter((step: any) =>
                String(step.name).startsWith('Point v3-staging at the candidate (')
            );
            for (const step of stages) {
                expect(step.if).toContain("steps.branch.outputs.matches == 'true'");
                expect(step.run).toContain('promote-v3-release.ts \\\n');
                expect(step.run).toContain('stage --version "$CANDIDATE_VERSION" --build-id "$BUILD_ID"');
                expect(step.run).toContain('--expected-metadata-sha256 "$METADATA_SHA256"');
            }
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

    describe('promote workflow', () => {
        const jobs = PROMOTE.jobs;

        it('plans without credentials, then promotes in its own Environment', () => {
            expect(Object.keys(jobs)).toEqual(['resolve', 'promote']);
            expect(jobs.promote.needs).toBe('resolve');
            expect(jobs.promote.if).toBe("${{ needs.resolve.outputs.skip == 'false' }}");
            expect(jobs.promote.environment).toBe('v3-release-promote');
            expect(PROMOTE.concurrency).toBeUndefined();
            expect(jobs.promote.concurrency).toBeUndefined();
            const recheck = stepNamed(jobs.promote, 'Re-check the release branches');
            expect(recheck.run).toContain('shadow-release-trigger.ts branches');
            for (const step of jobs.promote.steps.filter((candidate: any) =>
                String(candidate.name).startsWith('Move pointers ('))) {
                expect(step.if).toContain("steps.branch.outputs.matches == 'true'");
                expect(step.run).toMatch(/^bash scripts\/v3-release\/promote-from-workflow\.sh [a-z0-9]+$/);
            }
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
            ])('rejects %s', (_label, overrides) => {
                const result = runScript(script(), {
                    ...inputs,
                    ...overrides,
                    GITHUB_OUTPUT: outputs,
                });
                expect(result.status).not.toBe(0);
                expect(fs.readFileSync(outputs, 'utf8')).toBe('');
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
                const map = (env: Record<string, string>) => {
                    fs.writeFileSync(log, '');
                    const result = runScript('bash scripts/v3-release/promote-from-workflow.sh qa', {
                        PATH: `${bin}:${process.env.PATH}`,
                        RUNNER_TEMP: directory,
                        CHANNEL: '',
                        RELEASE_VERSION: '',
                        BUILD_ID: '',
                        DRY_RUN: 'false',
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
                    map({ OPERATION: 'promote-release-order', CHANNEL: 'v3-release-order-b', RELEASE_VERSION: '3.5.0' })
                ).toBe('promote --from v3-staging --to v3-release-order-b --version 3.5.0');
                expect(map({ OPERATION: 'promote-ga', RELEASE_VERSION: '3.5.0' })).toBe(
                    'promote-ga --version 3.5.0'
                );
                expect(
                    map({ OPERATION: 'rollback', CHANNEL: 'ga', RELEASE_VERSION: '3.4.1', BUILD_ID: '100-1', DRY_RUN: 'true' })
                ).toBe('rollback --channel ga --version 3.4.1 --build-id 100-1 --dry-run');
                expect(map({ OPERATION: 'stage', RELEASE_VERSION: '3.5.0', BUILD_ID: '9-1' })).toBe(
                    'stage --version 3.5.0 --build-id 9-1'
                );
                expect(map({ OPERATION: 'show', CHANNEL: 'ga', DRY_RUN: 'true' })).toBe(
                    'show --channel ga'
                );
                const unknown = runScript('bash scripts/v3-release/promote-from-workflow.sh qa', {
                    PATH: `${bin}:${process.env.PATH}`,
                    OPERATION: 'delete',
                    CHANNEL: '',
                    RELEASE_VERSION: '',
                    BUILD_ID: '',
                    DRY_RUN: 'false',
                });
                expect(unknown.status).toBe(1);
            } finally {
                fs.rmSync(directory, { recursive: true, force: true });
            }
        });
    });
});
