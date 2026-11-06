import * as fs from 'fs';
import * as path from 'path';
import { makeTempDirectory } from './v3-release/helpers';

const yaml = require('js-yaml');
const trigger = require('../../scripts/v3-release/shadow-release-trigger.ts');

const REPOSITORY = 'example-org/example-repo';
const STEP1_ID = '101';
const STEP2_ID = '202';
const STEP3_ID = '303';
const V3_STEP1_ID = '111';
const V3_STEP2_ID = '212';
const V3_STEP3_ID = '313';
const STEP1_IDS = { staging: STEP1_ID, v3: V3_STEP1_ID };
const RELEASE_STEP_IDS = {
    step2: STEP2_ID,
    step3: STEP3_ID,
    v3Step2: V3_STEP2_ID,
    v3Step3: V3_STEP3_ID,
};
const V3_STEP1_PATH = '.github/workflows/v3-release-step-1.yml';
const TAG_SHA = 'a'.repeat(40);
const OTHER_SHA = 'b'.repeat(40);

function step1Run(overrides: Record<string, unknown> = {}) {
    return {
        id: 36618522123,
        run_attempt: 2,
        event: 'workflow_dispatch',
        status: 'completed',
        conclusion: 'success',
        path: '.github/workflows/staging-step-1.yml',
        head_branch: 'v3-staging',
        display_title: 'Staging Release - Step 1 [v3]',
        workflow_id: 101,
        head_repository: { full_name: REPOSITORY },
        repository: { full_name: REPOSITORY },
        ...overrides,
    };
}

// The jobs API response for step1Run(): the release and its shadow package
// succeeded and only kit publishing failed, so the audit was skipped.
function step1Jobs(conclusions: Record<string, string | null> = {}) {
    return Object.entries({
        'Test Jest (18.x)': 'success',
        'Perform Release': 'success',
        'Package V3 candidate (shadow)': 'success',
        'Publish V3 kits': 'failure',
        'Audit V3 kits on npm': 'skipped',
        ...conclusions,
    })
        .filter(([, conclusion]) => conclusion !== null)
        .map(([name, conclusion]) => ({
            run_id: 36618522123,
            run_attempt: 2,
            name,
            status: 'completed',
            conclusion,
        }));
}

// The artifacts API response for step1Run(), one entry per name.
function step1Artifacts(names: string[], overrides: Record<string, unknown> = {}) {
    return names.map(name => ({
        name,
        expired: false,
        workflow_run: { id: 36618522123 },
        ...overrides,
    }));
}

function releaseRun(step: 2 | 3, title: string, overrides = {}) {
    return {
        id: 36621677032,
        run_attempt: 1,
        event: 'workflow_dispatch',
        status: 'completed',
        conclusion: 'success',
        path: `.github/workflows/staging-step-${step}.yml`,
        head_branch: 'main',
        display_title: title,
        workflow_id: step === 2 ? 202 : 303,
        head_repository: { full_name: REPOSITORY },
        repository: { full_name: REPOSITORY },
        ...overrides,
    };
}

// A V3 Step 3 run, from v3-release-step-3.yml.
function v3Step3Run(title = 'V3 Release - Step 3 [v3.12.0]', overrides = {}) {
    return {
        ...releaseRun(3, title),
        path: '.github/workflows/v3-release-step-3.yml',
        workflow_id: 313,
        ...overrides,
    };
}

// The jobs API response for a Step 3 releaseRun(): its one job, whose push
// step concluded pushConclusion (null leaves the push step out). A dry run
// skips the push step and the job still succeeds; a failed push fails it and
// skips the step after it.
function step3Jobs(
    pushConclusion: string | null,
    overrides: Record<string, unknown> = {}
) {
    const failed = pushConclusion === 'failure';
    return [
        {
            run_id: 36621677032,
            run_attempt: 1,
            name: 'Synchronize exact candidate v3.12.0',
            status: 'completed',
            conclusion: failed ? 'failure' : 'success',
            steps: [
                { name: 'Set up job', status: 'completed', conclusion: 'success' },
                {
                    name: 'Resolve and preflight release candidate',
                    status: 'completed',
                    conclusion: 'success',
                },
                ...(pushConclusion === null
                    ? []
                    : [
                          {
                              name: 'Atomically synchronize all destinations',
                              status: 'completed',
                              conclusion: pushConclusion,
                          },
                      ]),
                {
                    name: 'Report synchronized release',
                    status: 'completed',
                    conclusion: failed ? 'skipped' : 'success',
                },
            ],
            ...overrides,
        },
    ];
}

// A fake `git ls-remote origin ...` that knows the given refs.
function fakeGit(refs: Record<string, string>) {
    const calls: string[][] = [];
    const git = (args: string[]) => {
        calls.push(args);
        expect(args.slice(0, 2)).toEqual(['ls-remote', 'origin']);
        return args
            .slice(2)
            .filter(ref => refs[ref])
            .map(ref => `${refs[ref]}\t${ref}`)
            .join('\n');
    };
    return { git, calls };
}

describe('V3 shadow release trigger', () => {
    describe('Step 1 runs', () => {
        it('derives the build ID and artifact name the shadow package job uses', () => {
            expect(trigger.planStep1(step1Run(), REPOSITORY, STEP1_IDS, 'workflow_run')).toEqual({
                skip: false,
                reason: '',
                runId: '36618522123',
                runAttempt: '2',
                buildId: '36618522123-2',
                artifactName: 'v3-candidate-36618522123-2',
            });
        });

        it.each([
            ['a pull_request run', { event: 'pull_request' }, /workflow_dispatch/],
            ['a workflow_run chain', { event: 'workflow_run' }, /workflow_dispatch/],
            ['another workflow file', { path: '.github/workflows/evil.yml' }, /staging-step-1.yml/],
            [
                'a same-named workflow elsewhere',
                { workflow_id: 999 },
                /different workflow/,
            ],
            [
                'a fork',
                { head_repository: { full_name: 'someone/example-repo' } },
                /this repository/,
            ],
            ['a missing head repository', { head_repository: null }, /this repository/],
            ['the V2 staging branch', { head_branch: 'staging' }, /v3-staging/],
            ['a dispatch from main', { head_branch: 'main' }, /v3-staging/],
            ['a non-numeric run ID', { id: '1;rm' }, /run ID/],
            ['a zero attempt', { run_attempt: 0 }, /attempt/],
            ['a fractional attempt', { run_attempt: 1.5 }, /attempt/],
        ])('rejects %s', (_label, overrides, pattern) => {
            expect(() =>
                trigger.planStep1(step1Run(overrides), REPOSITORY, STEP1_IDS, 'workflow_run')
            ).toThrow(pattern);
        });

        it.each([
            ['failure', { conclusion: 'failure' }, /concluded failure; only a successful run is mirrored automatically/],
            ['cancellation', { conclusion: 'cancelled' }, /concluded cancelled/],
            ['a missing conclusion', { conclusion: null }, /concluded without success/],
            ['an unsafe conclusion', { conclusion: 'x\nskip=false' }, /concluded without success/],
            ['an unfinished run', { status: 'in_progress', conclusion: null }, /has not completed/],
        ])('skips automatic mirroring after %s', (_label, overrides, reason) => {
            const plan = trigger.planStep1(step1Run(overrides), REPOSITORY, STEP1_IDS, 'workflow_run');
            expect(plan.skip).toBe(true);
            expect(plan.reason).toMatch(reason);
        });

        it.each([
            ['kit publishing failed', {}],
            ['only the npm audit failed', { 'Publish V3 kits': 'success', 'Audit V3 kits on npm': 'failure' }],
        ])('mirrors a failed run automatically when %s after the release', (_label, conclusions) => {
            expect(
                trigger.planStep1(
                    step1Run({ conclusion: 'failure' }),
                    REPOSITORY,
                    STEP1_IDS,
                    'workflow_run',
                    step1Jobs(conclusions)
                )
            ).toMatchObject({ skip: false, reason: '', buildId: '36618522123-2' });
        });

        it.each([
            ['the release failed', { 'Perform Release': 'failure', 'Publish V3 kits': 'skipped' }],
            ['the release was skipped', { 'Perform Release': 'skipped', 'Publish V3 kits': 'skipped' }],
            ['the package job failed', { 'Package V3 candidate (shadow)': 'failure' }],
            ['the package job is missing', { 'Package V3 candidate (shadow)': null }],
            ['another job also failed', { 'Test Jest (18.x)': 'failure' }],
            ['a kit job was cancelled', { 'Publish V3 kits': 'cancelled' }],
            ['no job failed', { 'Publish V3 kits': 'success' }],
        ])('skips a failed run when %s', (_label, conclusions) => {
            const plan = trigger.planStep1(
                step1Run({ conclusion: 'failure' }),
                REPOSITORY,
                STEP1_IDS,
                'workflow_run',
                step1Jobs(conclusions)
            );
            expect(plan).toMatchObject({
                skip: true,
                reason: 'The release run concluded failure; only a successful run is mirrored automatically',
            });
        });

        it('mirrors a failed run whose Step 1 file still has the single kit job', () => {
            const jobs = step1Jobs({
                'Publish V3 kits': null,
                'Audit V3 kits on npm': null,
                'Publish and audit V3 kits': 'failure',
            });
            expect(
                trigger.planStep1(step1Run({ conclusion: 'failure' }), REPOSITORY, STEP1_IDS, 'workflow_run', jobs)
            ).toMatchObject({ skip: false, reason: '' });
            jobs.push({ ...jobs[0], name: 'Publish and audit V3 kits', conclusion: 'cancelled' });
            expect(
                trigger.planStep1(step1Run({ conclusion: 'failure' }), REPOSITORY, STEP1_IDS, 'workflow_run', jobs).skip
            ).toBe(true);
        });

        it('skips a run with two package jobs of the same name', () => {
            const jobs = step1Jobs();
            jobs.push({ ...jobs[2], conclusion: 'failure' });
            expect(
                trigger.planStep1(step1Run({ conclusion: 'failure' }), REPOSITORY, STEP1_IDS, 'workflow_run', jobs).skip
            ).toBe(true);
        });

        it('still skips a cancelled run, whatever its jobs show', () => {
            expect(
                trigger.planStep1(
                    step1Run({ conclusion: 'cancelled' }),
                    REPOSITORY,
                    STEP1_IDS,
                    'workflow_run',
                    step1Jobs()
                ).skip
            ).toBe(true);
        });

        it.each([
            ['another run', { run_id: 1 }],
            ['another attempt', { run_attempt: 1 }],
        ])('rejects jobs from %s', (_label, override) => {
            const jobs = step1Jobs();
            jobs[1] = { ...jobs[1], ...override };
            expect(() =>
                trigger.planStep1(step1Run({ conclusion: 'failure' }), REPOSITORY, STEP1_IDS, 'workflow_run', jobs)
            ).toThrow(/different run attempt/);
        });

        it('still validates the run source before reading its jobs', () => {
            expect(() =>
                trigger.planStep1(
                    step1Run({ conclusion: 'failure', head_branch: 'main' }),
                    REPOSITORY,
                    STEP1_IDS,
                    'workflow_run',
                    step1Jobs()
                )
            ).toThrow(/v3-staging/);
        });

        it('accepts a run of the V3 Step 1 file under its own workflow ID', () => {
            expect(
                trigger.planStep1(
                    step1Run({ path: V3_STEP1_PATH, workflow_id: 111, display_title: 'V3 Release - Step 1' }),
                    REPOSITORY,
                    STEP1_IDS,
                    'workflow_run'
                )
            ).toEqual({
                skip: false,
                reason: '',
                runId: '36618522123',
                runAttempt: '2',
                buildId: '36618522123-2',
                artifactName: 'v3-candidate-36618522123-2',
            });
        });

        it.each([
            ['the shared file under the V3 file ID', { workflow_id: 111 }],
            ['the V3 file under the shared file ID', { path: V3_STEP1_PATH, workflow_id: 101 }],
        ])('rejects %s', (_label, overrides) => {
            expect(() =>
                trigger.planStep1(step1Run(overrides), REPOSITORY, STEP1_IDS, 'workflow_run')
            ).toThrow(/different workflow/);
        });

        describe('run title', () => {
            const STAGING_STEP1_TITLE = 'Staging Release - Step 1 [v3]';
            const V3_STEP1_TITLE = 'V3 Release - Step 1';
            const staging = { workflow_id: 101 };
            const v3 = { path: V3_STEP1_PATH, workflow_id: 111 };

            it.each([
                ['the shared file', staging, STAGING_STEP1_TITLE],
                ['the V3 file', v3, V3_STEP1_TITLE],
            ])('accepts %s with its own title', (_label, source, title) => {
                for (const runTrigger of ['workflow_run', 'workflow_dispatch']) {
                    expect(
                        trigger.planStep1(step1Run({ ...source, display_title: title }), REPOSITORY, STEP1_IDS, runTrigger)
                    ).toMatchObject({ skip: false, reason: '', buildId: '36618522123-2' });
                }
            });

            it('accepts the title the V3 Step 1 file gives its runs', () => {
                const workflow = yaml.load(
                    fs.readFileSync(path.join(__dirname, '../../.github/workflows/v3-release-step-1.yml'), 'utf8')
                );
                expect(
                    trigger.planStep1(
                        step1Run({ ...v3, display_title: workflow['run-name'] }),
                        REPOSITORY,
                        STEP1_IDS,
                        'workflow_run'
                    ).skip
                ).toBe(false);
            });

            const stagingStep1Title = (track: string) => {
                const workflow = yaml.load(
                    fs.readFileSync(path.join(__dirname, '../../.github/workflows/staging-step-1.yml'), 'utf8')
                );
                return workflow['run-name'].replace('${{ inputs.track }}', track);
            };

            it('accepts the title the shared Step 1 file gives its runs on the v3 track', () => {
                const title = stagingStep1Title('v3');
                expect(title).toBe(STAGING_STEP1_TITLE);
                expect(
                    trigger.planStep1(
                        step1Run({ ...staging, display_title: title }),
                        REPOSITORY,
                        STEP1_IDS,
                        'workflow_run'
                    ).skip
                ).toBe(false);
            });

            it('rejects the title the shared Step 1 file gives its runs on the v2 track', () => {
                expect(() =>
                    trigger.planStep1(
                        step1Run({ ...staging, display_title: stagingStep1Title('v2') }),
                        REPOSITORY,
                        STEP1_IDS,
                        'workflow_run'
                    )
                ).toThrow(/run title is not the V3 run-name of its Step 1 file/);
            });

            it.each([
                ['the shared file with the V3 file\'s title', staging, V3_STEP1_TITLE],
                ['the V3 file with the shared file\'s title', v3, STAGING_STEP1_TITLE],
                ['the shared file on the V2 track', staging, 'Staging Release - Step 1 [v2]'],
                ['the shared file with an unrelated title', staging, 'Deploy documentation'],
                ['the V3 file with an unrelated title', v3, 'Deploy documentation'],
                ['the V3 file with a Step 2 title', v3, 'V3 Release - Step 2 [v3.1.0 \u2192 release-order-a]'],
                ['the V3 file with text after its title', v3, `${V3_STEP1_TITLE} [v3]`],
                ['the V3 file with an injected newline', v3, `${V3_STEP1_TITLE}\nskip=false`],
                ['the shared file with no title', staging, undefined],
                ['the V3 file with a non-string title', v3, 1],
            ])('rejects %s', (_label, source, title) => {
                for (const runTrigger of ['workflow_run', 'workflow_dispatch']) {
                    expect(() =>
                        trigger.planStep1(step1Run({ ...source, display_title: title }), REPOSITORY, STEP1_IDS, runTrigger)
                    ).toThrow(/run title is not the V3 run-name of its Step 1 file/);
                }
            });

            it('checks the title with the run source, before the run outcome', () => {
                expect(() =>
                    trigger.planStep1(
                        step1Run({ display_title: 'Staging Release - Step 1 [v2]', conclusion: 'failure' }),
                        REPOSITORY,
                        STEP1_IDS,
                        'workflow_run',
                        step1Jobs()
                    )
                ).toThrow(/run title/);
            });
        });

        it('names jobs that exist in the Step 1 workflow', () => {
            const workflow = yaml.load(
                fs.readFileSync(path.join(__dirname, '../../.github/workflows/v3-release-step-1.yml'), 'utf8')
            );
            const names = Object.values(workflow.jobs).map((job: any) => job.name);
            for (const name of [trigger.STEP1_RELEASE_JOB, trigger.STEP1_PACKAGE_JOB, ...trigger.STEP1_KIT_JOBS]) {
                expect(names.filter(candidate => candidate === name)).toHaveLength(1);
            }
            expect(workflow.jobs['package-v3-candidate'].needs).toBe('release');
            expect(workflow.jobs['upload-v3-candidate'].needs).toEqual([
                'release',
                'package-v3-candidate',
                'publish-kits',
                'audit-kits',
            ]);
            expect(trigger.STEP1_KIT_JOBS).toEqual([workflow.jobs['publish-kits'].name, workflow.jobs['audit-kits'].name]);
            for (const name of trigger.STEP1_LEGACY_KIT_JOBS) {
                expect(names).not.toContain(name);
            }
        });

        describe('release-gate mode', () => {
            const packagedAt = {
                started_at: '2026-01-02T10:00:00Z',
                completed_at: '2026-01-02T10:01:00Z',
            };
            const v3InProgressRun = (overrides: Record<string, unknown> = {}) =>
                step1Run({
                    path: V3_STEP1_PATH,
                    workflow_id: 111,
                    display_title: 'V3 Release - Step 1',
                    status: 'in_progress',
                    conclusion: null,
                    ...overrides,
                });
            const gateJobs = (
                overrides: Record<string, Partial<Record<string, unknown>> | null> = {}
            ) =>
                step1Jobs({ 'Publish V3 kits': 'success' })
                    .map(job =>
                        job.name === 'Package V3 candidate (shadow)'
                            ? { ...job, ...packagedAt }
                            : job
                    )
                    .filter(job => overrides[job.name] !== null)
                    .map(job =>
                        overrides[job.name]
                            ? { ...job, ...overrides[job.name] }
                            : job
                    );
            const gateArtifact = (
                attempt = 2,
                createdAt = '2026-01-02T10:00:30Z',
                overrides: Record<string, unknown> = {}
            ) => ({
                ...step1Artifacts([`v3-candidate-36618522123-${attempt}`])[0],
                created_at: createdAt,
                ...overrides,
            });

            it('accepts an in_progress V3 Step 1 run once release, package and its unexpired artifact exist', () => {
                expect(
                    trigger.planStep1(
                        v3InProgressRun(),
                        REPOSITORY,
                        STEP1_IDS,
                        'workflow_dispatch',
                        gateJobs(),
                        [gateArtifact(1)],
                        true
                    )
                ).toEqual({
                    skip: false,
                    reason: '',
                    runId: '36618522123',
                    runAttempt: '2',
                    buildId: '36618522123-1',
                    artifactName: 'v3-candidate-36618522123-1',
                });
            });

            it('accepts a completed non-cancelled V3 Step 1 run on a re-run in release-gate mode', () => {
                expect(
                    trigger.planStep1(
                        v3InProgressRun({ status: 'completed', conclusion: 'failure' }),
                        REPOSITORY,
                        STEP1_IDS,
                        'workflow_dispatch',
                        gateJobs(),
                        [gateArtifact(2)],
                        true
                    )
                ).toMatchObject({
                    skip: false,
                    buildId: '36618522123-2',
                    artifactName: 'v3-candidate-36618522123-2',
                });
            });

            it('accepts a V3 Step 1 run dispatched from a stable v3 tag in release-gate mode only', () => {
                expect(
                    trigger.planStep1(
                        v3InProgressRun({ head_branch: 'v3.29.1' }),
                        REPOSITORY,
                        STEP1_IDS,
                        'workflow_dispatch',
                        gateJobs(),
                        [gateArtifact(1)],
                        true
                    )
                ).toMatchObject({ skip: false, buildId: '36618522123-1' });

                for (const headBranch of ['v3.29.1-rc.1', 'v4.0.0', 'v3.029.1', 'main']) {
                    expect(() =>
                        trigger.planStep1(
                            v3InProgressRun({ head_branch: headBranch }),
                            REPOSITORY,
                            STEP1_IDS,
                            'workflow_dispatch',
                            gateJobs(),
                            [gateArtifact(1)],
                            true
                        )
                    ).toThrow(/must be dispatched from v3-staging$/);
                }

                expect(() =>
                    trigger.planStep1(
                        step1Run({ head_branch: 'v3.29.1' }),
                        REPOSITORY,
                        STEP1_IDS,
                        'workflow_run'
                    )
                ).toThrow(/must be dispatched from v3-staging$/);
            });

            it('rejects a staging-step-1.yml parent in release-gate mode while keeping non-gate behaviour', () => {
                expect(() =>
                    trigger.planStep1(
                        step1Run({ status: 'in_progress', conclusion: null }),
                        REPOSITORY,
                        STEP1_IDS,
                        'workflow_dispatch',
                        gateJobs(),
                        [gateArtifact(2)],
                        true
                    )
                ).toThrow(/Release-gate mode accepts only \.github\/workflows\/v3-release-step-1\.yml/);

                expect(
                    trigger.planStep1(
                        step1Run(),
                        REPOSITORY,
                        STEP1_IDS,
                        'workflow_run',
                        gateJobs(),
                        [gateArtifact(2)],
                        false
                    )
                ).toMatchObject({ skip: false, buildId: '36618522123-2' });
            });

            it.each([
                [
                    'workflow_run trigger',
                    () =>
                        trigger.planStep1(
                            v3InProgressRun(),
                            REPOSITORY,
                            STEP1_IDS,
                            'workflow_run',
                            gateJobs(),
                            [gateArtifact()],
                            true
                        ),
                    /Release-gate mode requires workflow_dispatch/,
                ],
                [
                    'queued run status',
                    () =>
                        trigger.planStep1(
                            v3InProgressRun({ status: 'queued' }),
                            REPOSITORY,
                            STEP1_IDS,
                            'workflow_dispatch',
                            gateJobs(),
                            [gateArtifact()],
                            true
                        ),
                    /in_progress or completed/,
                ],
                [
                    'cancelled run',
                    () =>
                        trigger.planStep1(
                            v3InProgressRun({ status: 'completed', conclusion: 'cancelled' }),
                            REPOSITORY,
                            STEP1_IDS,
                            'workflow_dispatch',
                            gateJobs(),
                            [gateArtifact()],
                            true
                        ),
                    /was cancelled/,
                ],
                [
                    'missing jobs or artifacts',
                    () =>
                        trigger.planStep1(
                            v3InProgressRun(),
                            REPOSITORY,
                            STEP1_IDS,
                            'workflow_dispatch',
                            undefined,
                            undefined,
                            true
                        ),
                    /requires jobs and artifacts/,
                ],
                [
                    'unsuccessful Perform Release job',
                    () =>
                        trigger.planStep1(
                            v3InProgressRun(),
                            REPOSITORY,
                            STEP1_IDS,
                            'workflow_dispatch',
                            gateJobs({ 'Perform Release': { conclusion: 'failure' } }),
                            [gateArtifact()],
                            true
                        ),
                    /release job has not succeeded/,
                ],
                [
                    'in-progress package job',
                    () =>
                        trigger.planStep1(
                            v3InProgressRun(),
                            REPOSITORY,
                            STEP1_IDS,
                            'workflow_dispatch',
                            gateJobs({
                                'Package V3 candidate (shadow)': {
                                    status: 'in_progress',
                                    conclusion: null,
                                },
                            }),
                            [gateArtifact()],
                            true
                        ),
                    /package job has not succeeded/,
                ],
                [
                    'failed package job',
                    () =>
                        trigger.planStep1(
                            v3InProgressRun(),
                            REPOSITORY,
                            STEP1_IDS,
                            'workflow_dispatch',
                            gateJobs({
                                'Package V3 candidate (shadow)': {
                                    conclusion: 'failure',
                                },
                            }),
                            [gateArtifact()],
                            true
                        ),
                    /package job has not succeeded/,
                ],
                [
                    'missing package job',
                    () =>
                        trigger.planStep1(
                            v3InProgressRun(),
                            REPOSITORY,
                            STEP1_IDS,
                            'workflow_dispatch',
                            gateJobs({ 'Package V3 candidate (shadow)': null }),
                            [gateArtifact()],
                            true
                        ),
                    /package job has not succeeded/,
                ],
                [
                    'missing candidate artifact',
                    () =>
                        trigger.planStep1(
                            v3InProgressRun(),
                            REPOSITORY,
                            STEP1_IDS,
                            'workflow_dispatch',
                            gateJobs(),
                            [],
                            true
                        ),
                    /exactly one unexpired candidate artifact/,
                ],
                [
                    'expired candidate artifact',
                    () =>
                        trigger.planStep1(
                            v3InProgressRun(),
                            REPOSITORY,
                            STEP1_IDS,
                            'workflow_dispatch',
                            gateJobs(),
                            [gateArtifact(2, '2026-01-02T10:00:30Z', { expired: true })],
                            true
                        ),
                    /exactly one unexpired candidate artifact/,
                ],
                [
                    'two candidate artifacts in the package window',
                    () =>
                        trigger.planStep1(
                            v3InProgressRun(),
                            REPOSITORY,
                            STEP1_IDS,
                            'workflow_dispatch',
                            gateJobs(),
                            [
                                gateArtifact(1, '2026-01-02T10:00:10Z'),
                                gateArtifact(2, '2026-01-02T10:00:20Z'),
                            ],
                            true
                        ),
                    /exactly one unexpired candidate artifact/,
                ],
            ])('fails closed on %s', (_label, call, pattern) => {
                expect(call).toThrow(pattern);
            });
        });

        describe('candidate attempt', () => {
            // Attempt 1 packaged from 10:00 to 10:01; attempt 2 re-ran only
            // the kit job, so its package job is attempt 1's, copied.
            const packagedAt = { started_at: '2026-01-02T10:00:00Z', completed_at: '2026-01-02T10:01:00Z' };
            const jobsWith = (packageJob: Record<string, unknown> = packagedAt) =>
                step1Jobs({ 'Publish V3 kits': 'success' }).map(job =>
                    job.name === 'Package V3 candidate (shadow)' ? { ...job, ...packageJob } : job
                );
            const candidate = (attempt: number, createdAt: string, overrides: Record<string, unknown> = {}) => ({
                ...step1Artifacts([`v3-candidate-36618522123-${attempt}`])[0],
                created_at: createdAt,
                ...overrides,
            });
            const plan = (
                artifacts: unknown[],
                jobs: unknown[] = jobsWith(),
                overrides: Record<string, unknown> = {}
            ) => trigger.planStep1(step1Run(overrides), REPOSITORY, STEP1_IDS, 'workflow_run', jobs, artifacts);

            it('keeps the candidate of a package job copied from an earlier attempt', () => {
                expect(
                    plan([
                        { ...step1Artifacts(['npm-logs-publish-kits'])[0], created_at: '2026-01-02T10:02:00Z' },
                        candidate(1, '2026-01-02T10:00:59Z'),
                    ])
                ).toMatchObject({
                    skip: false,
                    runAttempt: '2',
                    buildId: '36618522123-1',
                    artifactName: 'v3-candidate-36618522123-1',
                });
            });

            it('takes the candidate made while the package job ran, inclusive of its start and end', () => {
                const artifacts = [
                    candidate(1, '2026-01-02T10:00:00Z'),
                    candidate(2, '2026-01-02T11:00:30Z'),
                ];
                expect(plan(artifacts).buildId).toBe('36618522123-1');
                expect(
                    plan(artifacts, jobsWith({ started_at: '2026-01-02T11:00:00Z', completed_at: '2026-01-02T11:00:30Z' }))
                        .buildId
                ).toBe('36618522123-2');
                expect(
                    plan(
                        [candidate(1, '2026-01-02T10:00:00Z'), candidate(3, '2026-01-02T12:00:30Z')],
                        jobsWith({ started_at: '2026-01-02T12:00:00Z', completed_at: '2026-01-02T12:01:00Z' }).map(
                            job => ({ ...job, run_attempt: 3 })
                        ),
                        { run_attempt: 3 }
                    ).buildId
                ).toBe('36618522123-3');
            });

            it('does not fall back to an earlier candidate when the package job ran again without one', () => {
                // Re-run all jobs: attempt 2 packaged from 11:00 but uploaded nothing.
                expect(
                    plan(
                        [candidate(1, '2026-01-02T10:00:30Z')],
                        jobsWith({ started_at: '2026-01-02T11:00:00Z', completed_at: '2026-01-02T11:01:00Z' })
                    )
                ).toMatchObject({ buildId: '36618522123-2', artifactName: 'v3-candidate-36618522123-2' });
            });

            it.each([
                ['no artifacts', [], jobsWith()],
                ['only an expired candidate', [candidate(1, '2026-01-02T10:00:30Z', { expired: true })], jobsWith()],
                ['a candidate with no expiry state', [candidate(1, '2026-01-02T10:00:30Z', { expired: undefined })], jobsWith()],
                ['a candidate made before the package job', [candidate(1, '2026-01-02T09:59:59Z')], jobsWith()],
                ['a candidate made after the package job', [candidate(1, '2026-01-02T10:01:01Z')], jobsWith()],
                ['a candidate with no creation time', [candidate(1, 'yesterday')], jobsWith()],
                ['a later attempt\'s candidate', [candidate(3, '2026-01-02T10:00:30Z')], jobsWith()],
                ['another run\'s name', [{ ...candidate(1, '2026-01-02T10:00:30Z'), name: 'v3-candidate-36618522124-1' }], jobsWith()],
                [
                    'malformed attempts',
                    ['0', '01', '1x', '1-1', ''].map(suffix => ({
                        ...candidate(1, '2026-01-02T10:00:30Z'),
                        name: `v3-candidate-36618522123-${suffix}`,
                    })),
                    jobsWith(),
                ],
                [
                    'two candidates in the window',
                    [candidate(1, '2026-01-02T10:00:10Z'), candidate(2, '2026-01-02T10:00:20Z')],
                    jobsWith(),
                ],
                ['no package job', [candidate(1, '2026-01-02T10:00:30Z')], jobsWith().filter(job => job.name !== 'Package V3 candidate (shadow)')],
                [
                    'two package jobs',
                    [candidate(1, '2026-01-02T10:00:30Z')],
                    [...jobsWith(), jobsWith().find(job => job.name === 'Package V3 candidate (shadow)')],
                ],
                ['a package job with no times', [candidate(1, '2026-01-02T10:00:30Z')], jobsWith({ started_at: null, completed_at: null })],
            ])('falls back to this attempt with %s', (_label, artifacts, jobs) => {
                expect(plan(artifacts, jobs)).toMatchObject({
                    buildId: '36618522123-2',
                    artifactName: 'v3-candidate-36618522123-2',
                });
            });

            it('falls back to this attempt without both lists', () => {
                const artifacts = [candidate(1, '2026-01-02T10:00:30Z')];
                expect(
                    trigger.planStep1(step1Run(), REPOSITORY, STEP1_IDS, 'workflow_run', undefined, artifacts).buildId
                ).toBe('36618522123-2');
                expect(plan(undefined as unknown as unknown[]).buildId).toBe('36618522123-2');
            });

            it.each([
                ['another run', { workflow_run: { id: 1 } }],
                ['no run', { workflow_run: null }],
            ])('rejects an artifact from %s', (_label, override) => {
                expect(() => plan([candidate(1, '2026-01-02T10:00:30Z', override)])).toThrow(/different run/);
            });

            it('rejects jobs from another attempt even for a successful run', () => {
                const jobs = jobsWith().map(job => ({ ...job, run_attempt: 1 }));
                expect(() => plan([candidate(1, '2026-01-02T10:00:30Z')], jobs)).toThrow(/different run attempt/);
            });

            it('applies to a failed run that only failed at kits, and to a manual dispatch', () => {
                const artifacts = [candidate(1, '2026-01-02T10:00:30Z')];
                const failedAtKits = step1Jobs().map(job =>
                    job.name === 'Package V3 candidate (shadow)' ? { ...job, ...packagedAt } : job
                );
                expect(
                    trigger.planStep1(
                        step1Run({ conclusion: 'failure' }),
                        REPOSITORY,
                        STEP1_IDS,
                        'workflow_run',
                        failedAtKits,
                        artifacts
                    )
                ).toMatchObject({ skip: false, buildId: '36618522123-1' });
                expect(
                    trigger.planStep1(step1Run(), REPOSITORY, STEP1_IDS, 'workflow_dispatch', jobsWith(), artifacts)
                ).toMatchObject({ skip: false, buildId: '36618522123-1' });
            });
        });

        it('lets a manual dispatch re-mirror any completed run, but not an unfinished one', () => {
            for (const conclusion of ['success', 'failure', 'cancelled']) {
                expect(
                    trigger.planStep1(step1Run({ conclusion }), REPOSITORY, STEP1_IDS, 'workflow_dispatch').skip
                ).toBe(false);
            }
            expect(
                trigger.planStep1(
                    step1Run({ status: 'queued', conclusion: null }),
                    REPOSITORY,
                    STEP1_IDS,
                    'workflow_dispatch'
                )
            ).toMatchObject({ skip: true, reason: 'The release run has not completed' });
            expect(() =>
                trigger.planStep1(step1Run(), REPOSITORY, STEP1_IDS, 'push')
            ).toThrow(/trigger must be/);
        });

        it('rejects malformed repository and workflow IDs', () => {
            expect(() => trigger.planStep1(step1Run(), 'no-slash', STEP1_IDS, 'workflow_run')).toThrow(
                /owner\/name/
            );
            expect(() =>
                trigger.planStep1(step1Run(), REPOSITORY, { ...STEP1_IDS, staging: '' }, 'workflow_run')
            ).toThrow(/Step 1 workflow ID/);
            expect(() =>
                trigger.planStep1(step1Run(), REPOSITORY, { ...STEP1_IDS, v3: '' }, 'workflow_run')
            ).toThrow(/V3 Step 1 workflow ID/);
        });
    });

    describe('Step 2 and Step 3 runs', () => {
        it('maps a Step 2 run to its V3 release order', () => {
            expect(
                trigger.planReleaseStep(
                    releaseRun(2, 'Staging Release - Step 2 [v3.11.1 \u2192 release-order-c]'),
                    REPOSITORY,
                    RELEASE_STEP_IDS
                )
            ).toEqual({
                step: 2,
                skip: false,
                reason: '',
                releaseTag: 'v3.11.1',
                releaseVersion: '3.11.1',
                channels: ['v3-release-order-c'],
                branches: ['v3-release-order-c'],
            });
        });

        it('maps a Step 3 run to every release order, then ga', () => {
            expect(
                trigger.planReleaseStep(
                    releaseRun(3, 'Staging Release - Step 3 [v3.12.0]'),
                    REPOSITORY,
                    RELEASE_STEP_IDS,
                    false,
                    step3Jobs('success')
                )
            ).toMatchObject({
                step: 3,
                skip: false,
                releaseVersion: '3.12.0',
                channels: [
                    'v3-release-order-a',
                    'v3-release-order-b',
                    'v3-release-order-c',
                    'ga',
                ],
                branches: [
                    'main',
                    'v3-release-order-a',
                    'v3-release-order-b',
                    'v3-release-order-c',
                ],
            });
        });

        it.each([
            ['a V2 release', 'Staging Release - Step 3 [v2.80.0]', /not a V3 release/],
            ['a leading zero', 'Staging Release - Step 3 [v3.01.0]', /stable release tag/],
            ['a prerelease', 'Staging Release - Step 3 [v3.1.0-rc.1]', /stable release tag/],
            ['an injected newline', 'Staging Release - Step 3 [v3.1.0]\nskip=false', /stable release tag/],
        ])('skips %s', (_label, title, reason) => {
            const plan = trigger.planReleaseStep(
                releaseRun(3, title),
                REPOSITORY,
                RELEASE_STEP_IDS
            );
            expect(plan.skip).toBe(true);
            expect(plan.reason).toMatch(reason);
            expect(plan.channels).toEqual([]);
        });

        it.each([
            ['failure', { conclusion: 'failure' }, /concluded failure/],
            ['cancellation', { conclusion: 'cancelled' }, /concluded cancelled/],
            ['an unfinished run', { status: 'in_progress', conclusion: null }, /has not completed/],
        ])('skips a release step after %s', (_label, overrides, reason) => {
            const plan = trigger.planReleaseStep(
                releaseRun(2, 'Staging Release - Step 2 [v3.1.0 \u2192 release-order-a]', overrides),
                REPOSITORY,
                RELEASE_STEP_IDS
            );
            expect(plan).toMatchObject({ skip: true, channels: [], branches: [] });
            expect(plan.reason).toMatch(reason);
        });

        it.each([
            ['a Step 2 title on Step 3', 3, 'Staging Release - Step 2 [v3.1.0 \u2192 release-order-a]'],
            ['an unknown release order', 2, 'Staging Release - Step 2 [v3.1.0 \u2192 release-order-d]'],
            ['an ASCII arrow', 2, 'Staging Release - Step 2 [v3.1.0 -> release-order-a]'],
        ])('skips %s', (_label, step, title) => {
            expect(
                trigger.planReleaseStep(
                    releaseRun(step as 2 | 3, title),
                    REPOSITORY,
                    RELEASE_STEP_IDS
                ).skip
            ).toBe(true);
        });

        it.each([
            ['Step 1', { path: '.github/workflows/staging-step-1.yml' }, /neither Step 2 nor Step 3/],
            ['a push', { event: 'push' }, /workflow_dispatch/],
            ['a staging branch', { head_branch: 'v3-staging' }, /must be dispatched from main$/],
            ['the V2 trunk', { head_branch: 'master' }, /must be dispatched from main$/],
            ['the Step 3 workflow ID', { workflow_id: 303 }, /different workflow/],
        ])('rejects %s', (_label, overrides, pattern) => {
            expect(() =>
                trigger.planReleaseStep(
                    releaseRun(2, 'Staging Release - Step 2 [v3.1.0 \u2192 release-order-a]', overrides),
                    REPOSITORY,
                    RELEASE_STEP_IDS
                )
            ).toThrow(pattern);
        });

        it('maps a V3 Step 2 run to its V3 release order', () => {
            expect(
                trigger.planReleaseStep(
                    {
                        ...releaseRun(2, 'V3 Release - Step 2 [v3.11.1 \u2192 release-order-c]'),
                        path: '.github/workflows/v3-release-step-2.yml',
                        workflow_id: 212,
                    },
                    REPOSITORY,
                    RELEASE_STEP_IDS
                )
            ).toEqual({
                step: 2,
                skip: false,
                reason: '',
                releaseTag: 'v3.11.1',
                releaseVersion: '3.11.1',
                channels: ['v3-release-order-c'],
                branches: ['v3-release-order-c'],
            });
        });

        it('maps a V3 Step 3 run to every release order, then ga', () => {
            expect(
                trigger.planReleaseStep(
                    v3Step3Run(),
                    REPOSITORY,
                    RELEASE_STEP_IDS,
                    false,
                    step3Jobs('success')
                )
            ).toMatchObject({
                step: 3,
                skip: false,
                releaseVersion: '3.12.0',
                channels: [
                    'v3-release-order-a',
                    'v3-release-order-b',
                    'v3-release-order-c',
                    'ga',
                ],
                branches: [
                    'main',
                    'v3-release-order-a',
                    'v3-release-order-b',
                    'v3-release-order-c',
                ],
            });
        });

        it.each([
            ['a shared title on the V3 file', 2, 'Staging Release - Step 2 [v3.1.0 \u2192 release-order-a]', 'v3-release-step-2.yml', 212],
            ['a V3 title on the shared file', 2, 'V3 Release - Step 2 [v3.1.0 \u2192 release-order-a]', 'staging-step-2.yml', 202],
            ['a V3 Step 2 title on the V3 Step 3 file', 3, 'V3 Release - Step 2 [v3.1.0 \u2192 release-order-a]', 'v3-release-step-3.yml', 313],
        ])('skips %s', (_label, step, title, file, workflowId) => {
            expect(
                trigger.planReleaseStep(
                    {
                        ...releaseRun(step as 2 | 3, title as string),
                        path: `.github/workflows/${file}`,
                        workflow_id: workflowId,
                    },
                    REPOSITORY,
                    RELEASE_STEP_IDS
                ).skip
            ).toBe(true);
        });

        it.each([
            ['the V3 Step 2 file under the shared Step 2 ID', 'v3-release-step-2.yml', 202],
            ['the shared Step 2 file under the V3 Step 2 ID', 'staging-step-2.yml', 212],
            ['the V3 Step 2 file under the V3 Step 3 ID', 'v3-release-step-2.yml', 313],
        ])('rejects %s', (_label, file, workflowId) => {
            expect(() =>
                trigger.planReleaseStep(
                    {
                        ...releaseRun(2, 'V3 Release - Step 2 [v3.1.0 \u2192 release-order-a]'),
                        path: `.github/workflows/${file}`,
                        workflow_id: workflowId,
                    },
                    REPOSITORY,
                    RELEASE_STEP_IDS
                )
            ).toThrow(/different workflow/);
        });

        it('rejects a malformed V3 workflow ID', () => {
            expect(() =>
                trigger.planReleaseStep(
                    releaseRun(3, 'Staging Release - Step 3 [v3.12.0]'),
                    REPOSITORY,
                    { ...RELEASE_STEP_IDS, v3Step3: '0' }
                )
            ).toThrow(/V3 Step 3 workflow ID/);
        });

        it.each([
            ['outside Release Please mode', false],
            ['in Release Please mode', true],
        ])('skips a Step 3 dry run, whose push step was skipped, %s', (_label, releasePleaseMode) => {
            for (const run of [
                v3Step3Run(),
                releaseRun(3, 'Staging Release - Step 3 [v3.12.0]'),
            ]) {
                const plan = trigger.planReleaseStep(
                    run,
                    REPOSITORY,
                    RELEASE_STEP_IDS,
                    releasePleaseMode,
                    step3Jobs('skipped')
                );
                expect(plan).toEqual({
                    step: 3,
                    skip: true,
                    reason: 'The Step 3 run was a dry run: its push step was skipped, so no branch moved',
                    releaseTag: '',
                    releaseVersion: '',
                    channels: [],
                    branches: [],
                });
            }
        });

        it.each([
            ['failed', 'failure'],
            ['was cancelled', 'cancelled'],
        ])('skips a Step 3 run whose push step %s, even where the run reads success', (_label, conclusion) => {
            for (const releasePleaseMode of [false, true]) {
                const plan = trigger.planReleaseStep(
                    v3Step3Run(),
                    REPOSITORY,
                    RELEASE_STEP_IDS,
                    releasePleaseMode,
                    step3Jobs(conclusion)
                );
                expect(plan).toMatchObject({ step: 3, skip: true, channels: [], branches: [] });
                expect(plan.reason).toBe('The Step 3 push step did not succeed, so no branch moved');
            }
        });

        it('skips a Step 3 run whose push step has not completed', () => {
            const jobs = step3Jobs('success', {
                status: 'in_progress',
                conclusion: null,
                steps: [
                    {
                        name: 'Atomically synchronize all destinations',
                        status: 'in_progress',
                        conclusion: null,
                    },
                ],
            });
            const plan = trigger.planReleaseStep(v3Step3Run(), REPOSITORY, RELEASE_STEP_IDS, true, jobs);
            expect(plan.skip).toBe(true);
            expect(plan.reason).toBe('The Step 3 push step did not succeed, so no branch moved');
        });

        it.each([
            ['no push step', step3Jobs(null)],
            ['two push steps', [...step3Jobs('success'), { ...step3Jobs('success')[0], name: 'Another job' }]],
            ['steps that are not a list', step3Jobs('success', { steps: { name: 'Atomically synchronize all destinations' } })],
            ['no steps', step3Jobs('success', { steps: undefined })],
            ['no jobs', []],
        ])('skips a Step 3 run whose jobs show %s', (_label, jobs) => {
            const plan = trigger.planReleaseStep(v3Step3Run(), REPOSITORY, RELEASE_STEP_IDS, true, jobs);
            expect(plan).toMatchObject({ step: 3, skip: true, channels: [], branches: [] });
            expect(plan.reason).toBe("The Step 3 run's jobs do not show exactly one push step, so no branch moved");
        });

        it('rejects a Step 3 run planned without its jobs', () => {
            for (const releasePleaseMode of [false, true]) {
                expect(() =>
                    trigger.planReleaseStep(v3Step3Run(), REPOSITORY, RELEASE_STEP_IDS, releasePleaseMode)
                ).toThrow('A Step 3 run needs the jobs of its run attempt (--jobs)');
            }
        });

        it.each([
            ['another run', { run_id: 36621677033 }],
            ['another attempt', { run_attempt: 2 }],
        ])('rejects Step 3 jobs from %s', (_label, overrides) => {
            expect(() =>
                trigger.planReleaseStep(
                    v3Step3Run(),
                    REPOSITORY,
                    RELEASE_STEP_IDS,
                    true,
                    step3Jobs('success', overrides)
                )
            ).toThrow(/different run attempt/);
        });

        it('plans a Step 2 run with or without its jobs, which it does not need', () => {
            const run = releaseRun(2, 'Staging Release - Step 2 [v3.11.1 \u2192 release-order-c]');
            const expected = trigger.planReleaseStep(run, REPOSITORY, RELEASE_STEP_IDS);
            expect(expected.skip).toBe(false);
            expect(
                trigger.planReleaseStep(run, REPOSITORY, RELEASE_STEP_IDS, true, step3Jobs('skipped'))
            ).toEqual(expected);
        });
    });

    describe('branch check', () => {
        it('matches when every branch points at the peeled tag commit', () => {
            const { git, calls } = fakeGit({
                'refs/tags/v3.1.0': OTHER_SHA,
                'refs/tags/v3.1.0^{}': TAG_SHA,
                'refs/heads/main': TAG_SHA,
                'refs/heads/v3-release-order-a': TAG_SHA,
            });
            expect(
                trigger.checkBranches('v3.1.0', ['main', 'v3-release-order-a'], git)
            ).toEqual({ tagSha: TAG_SHA, matches: true, mismatched: [] });
            expect(calls).toEqual([
                [
                    'ls-remote',
                    'origin',
                    'refs/tags/v3.1.0',
                    'refs/tags/v3.1.0^{}',
                    'refs/heads/main',
                    'refs/heads/v3-release-order-a',
                ],
            ]);
        });

        it('reports branches that have not moved, or moved past the tag', () => {
            const { git } = fakeGit({
                'refs/tags/v3.1.0': TAG_SHA,
                'refs/heads/main': TAG_SHA,
                'refs/heads/v3-release-order-a': OTHER_SHA,
            });
            expect(
                trigger.checkBranches(
                    'v3.1.0',
                    ['main', 'v3-release-order-a', 'v3-release-order-b'],
                    git
                )
            ).toEqual({
                tagSha: TAG_SHA,
                matches: false,
                mismatched: ['v3-release-order-a', 'v3-release-order-b'],
            });
        });

        it('fails when the tag does not exist or inputs are unsafe', () => {
            const { git } = fakeGit({ 'refs/heads/main': TAG_SHA });
            expect(() => trigger.checkBranches('v3.1.0', ['main'], git)).toThrow(
                /does not exist/
            );
            expect(() => trigger.checkBranches('v3.1', ['main'], git)).toThrow(/stable/);
            expect(() =>
                trigger.checkBranches('v3.1.0', ['main --upload-pack=x'], git)
            ).toThrow(/branch name/);
            expect(() => trigger.checkBranches('v3.1.0', [], git)).toThrow(/At least one/);
        });
    });

    describe('pods', () => {
        it('selects known pods once each, in processing order', () => {
            expect(trigger.selectPods(' us1,qa ')).toEqual(['qa', 'us1']);
            expect(trigger.main(['pods', '--list', 'eu1,qa'])).toEqual([
                'pods=qa,eu1',
                'qa=true',
                'us1=false',
                'us2=false',
                'st1=false',
                'eu1=true',
                'au1=false',
            ]);
        });

        it.each([[''], [','], ['qa,qa'], ['QA'], ['qa,prod'], ['qa\nus1=true']])(
            'rejects %j',
            list => {
                expect(() => trigger.selectPods(list)).toThrow();
            }
        );

        it('requires every production pod in release-gate mode while keeping qa optional', () => {
            expect(trigger.PRODUCTION_PODS).toEqual(['us1', 'us2', 'st1', 'eu1', 'au1']);
            expect(
                trigger.selectPods('au1,eu1,st1,us2,us1', true)
            ).toEqual(['us1', 'us2', 'st1', 'eu1', 'au1']);
            expect(
                trigger.selectPods('us1,us2,st1,eu1,au1,qa', true)
            ).toEqual(['qa', 'us1', 'us2', 'st1', 'eu1', 'au1']);
            expect(
                trigger.main([
                    'pods',
                    '--list',
                    'us1,us2,st1,eu1,au1',
                    '--release-gate',
                    'true',
                ])
            ).toEqual([
                'pods=us1,us2,st1,eu1,au1',
                'qa=false',
                'us1=true',
                'us2=true',
                'st1=true',
                'eu1=true',
                'au1=true',
            ]);
            expect(() => trigger.selectPods('qa', true)).toThrow(
                /Release-gate mode requires all production pods \(us1, us2, st1, eu1, au1\); missing: us1, us2, st1, eu1, au1/
            );
            expect(() =>
                trigger.selectPods('qa,us1,us2,st1,eu1', true)
            ).toThrow(/missing: au1$/);
        });
    });

    describe('command line', () => {
        let directory: string;

        beforeEach(() => {
            directory = makeTempDirectory('v3-release-trigger-');
        });

        afterEach(() => {
            fs.rmSync(directory, { recursive: true, force: true });
        });

        function runFile(run: unknown): string {
            const file = path.join(directory, 'run.json');
            fs.writeFileSync(file, JSON.stringify(run));
            return file;
        }

        it('prints Step 1 outputs', () => {
            expect(
                trigger.main([
                    'step1',
                    '--run',
                    runFile(step1Run()),
                    '--repository',
                    REPOSITORY,
                    '--workflow-id',
                    STEP1_ID,
                    '--v3-workflow-id',
                    V3_STEP1_ID,
                    '--trigger',
                    'workflow_run',
                ])
            ).toEqual([
                'skip=false',
                'run_id=36618522123',
                'run_attempt=2',
                'build_id=36618522123-2',
                'artifact_name=v3-candidate-36618522123-2',
            ]);
        });

        it('plans a release step and skips when its branch has not moved', () => {
            const args = [
                'release-step',
                '--run',
                runFile(
                    releaseRun(2, 'Staging Release - Step 2 [v3.1.0 \u2192 release-order-b]')
                ),
                '--repository',
                REPOSITORY,
                '--step2-workflow-id',
                STEP2_ID,
                '--step3-workflow-id',
                STEP3_ID,
                '--v3-step2-workflow-id',
                V3_STEP2_ID,
                '--v3-step3-workflow-id',
                V3_STEP3_ID,
            ];
            const moved = fakeGit({
                'refs/tags/v3.1.0': TAG_SHA,
                'refs/heads/v3-release-order-b': TAG_SHA,
            });
            expect(trigger.main(args, moved.git)).toEqual([
                'step=2',
                'skip=false',
                'release_tag=v3.1.0',
                'release_version=3.1.0',
                'channels=v3-release-order-b',
                'branches=v3-release-order-b',
                'mismatched=',
            ]);
            const dryRun = fakeGit({
                'refs/tags/v3.1.0': TAG_SHA,
                'refs/heads/v3-release-order-b': OTHER_SHA,
            });
            expect(trigger.main(args, dryRun.git)).toContain('skip=true');
        });

        it('skips a V2 release without reading git', () => {
            const { git, calls } = fakeGit({});
            expect(
                trigger.main(
                    [
                        'release-step',
                        '--run',
                        runFile(releaseRun(3, 'Staging Release - Step 3 [v2.80.0]')),
                        '--repository',
                        REPOSITORY,
                        '--step2-workflow-id',
                        STEP2_ID,
                        '--step3-workflow-id',
                        STEP3_ID,
                        '--v3-step2-workflow-id',
                        V3_STEP2_ID,
                        '--v3-step3-workflow-id',
                        V3_STEP3_ID,
                    ],
                    git
                )
            ).toEqual(['step=3', 'skip=true', 'reason=v2.80.0 is not a V3 release']);
            expect(calls).toEqual([]);
        });

        it('prints only a skip for an unsuccessful Step 1 run', () => {
            expect(
                trigger.main([
                    'step1',
                    '--run',
                    runFile(step1Run({ conclusion: 'failure' })),
                    '--repository',
                    REPOSITORY,
                    '--workflow-id',
                    STEP1_ID,
                    '--v3-workflow-id',
                    V3_STEP1_ID,
                    '--trigger',
                    'workflow_run',
                ])
            ).toEqual([
                'skip=true',
                'reason=The release run concluded failure; only a successful run is mirrored automatically',
            ]);
        });

        it('reads the jobs file for an automatic Step 1 run', () => {
            const args = (jobs: unknown) => {
                const jobsFile = path.join(directory, 'jobs.json');
                fs.writeFileSync(jobsFile, JSON.stringify(jobs));
                return [
                    'step1',
                    '--run',
                    runFile(step1Run({ conclusion: 'failure' })),
                    '--repository',
                    REPOSITORY,
                    '--workflow-id',
                    STEP1_ID,
                    '--v3-workflow-id',
                    V3_STEP1_ID,
                    '--trigger',
                    'workflow_run',
                    '--jobs',
                    jobsFile,
                ];
            };
            expect(trigger.main(args(step1Jobs()))).toContain('skip=false');
            expect(trigger.main(args(step1Jobs({ 'Perform Release': 'failure' })))).toContain('skip=true');
            expect(() => trigger.main(args({ jobs: step1Jobs() }))).toThrow(/JSON array of objects/);
            expect(() => trigger.main(args([null]))).toThrow(/JSON array of objects/);
        });

        it('reads the artifacts and jobs files for a Step 1 run', () => {
            const args = (artifacts: unknown, jobs: unknown = []) => {
                const artifactsFile = path.join(directory, 'artifacts.json');
                const jobsFile = path.join(directory, 'jobs.json');
                fs.writeFileSync(artifactsFile, JSON.stringify(artifacts));
                fs.writeFileSync(jobsFile, JSON.stringify(jobs));
                return [
                    'step1',
                    '--run',
                    runFile(step1Run()),
                    '--repository',
                    REPOSITORY,
                    '--workflow-id',
                    STEP1_ID,
                    '--v3-workflow-id',
                    V3_STEP1_ID,
                    '--trigger',
                    'workflow_run',
                    '--artifacts',
                    artifactsFile,
                    '--jobs',
                    jobsFile,
                ];
            };
            const jobs = step1Jobs({ 'Publish V3 kits': 'success' }).map(job =>
                job.name === 'Package V3 candidate (shadow)'
                    ? { ...job, started_at: '2026-01-02T10:00:00Z', completed_at: '2026-01-02T10:01:00Z' }
                    : job
            );
            const artifacts = step1Artifacts(['v3-candidate-36618522123-1'], { created_at: '2026-01-02T10:00:30Z' });
            expect(trigger.main(args(artifacts, jobs))).toEqual([
                'skip=false',
                'run_id=36618522123',
                'run_attempt=2',
                'build_id=36618522123-1',
                'artifact_name=v3-candidate-36618522123-1',
            ]);
            expect(() => trigger.main(args({ artifacts: [] }))).toThrow(/artifacts file must hold a JSON array of objects/);
            expect(() => trigger.main(args(['x']))).toThrow(/artifacts file must hold a JSON array of objects/);
        });

        it('plans a V3 release step', () => {
            const { git } = fakeGit({
                'refs/tags/v3.1.0': TAG_SHA,
                'refs/heads/v3-release-order-a': TAG_SHA,
            });
            expect(
                trigger.main(
                    [
                        'release-step',
                        '--run',
                        runFile({
                            ...releaseRun(2, 'V3 Release - Step 2 [v3.1.0 \u2192 release-order-a]'),
                            path: '.github/workflows/v3-release-step-2.yml',
                            workflow_id: 212,
                        }),
                        '--repository',
                        REPOSITORY,
                        '--step2-workflow-id',
                        STEP2_ID,
                        '--step3-workflow-id',
                        STEP3_ID,
                        '--v3-step2-workflow-id',
                        V3_STEP2_ID,
                        '--v3-step3-workflow-id',
                        V3_STEP3_ID,
                    ],
                    git
                )
            ).toEqual([
                'step=2',
                'skip=false',
                'release_tag=v3.1.0',
                'release_version=3.1.0',
                'channels=v3-release-order-a',
                'branches=v3-release-order-a',
                'mismatched=',
            ]);
        });

        it('reads the jobs file for a Step 3 run, and skips a dry run or a failed push without reading git', () => {
            const args = (jobs: unknown, mode = 'true') => {
                const jobsFile = path.join(directory, 'jobs.json');
                fs.writeFileSync(jobsFile, JSON.stringify(jobs));
                return [
                    'release-step',
                    '--run',
                    runFile(v3Step3Run('V3 Release - Step 3 [v3.1.0]')),
                    '--repository',
                    REPOSITORY,
                    '--step2-workflow-id',
                    STEP2_ID,
                    '--step3-workflow-id',
                    STEP3_ID,
                    '--v3-step2-workflow-id',
                    V3_STEP2_ID,
                    '--v3-step3-workflow-id',
                    V3_STEP3_ID,
                    '--release-please-mode',
                    mode,
                    '--jobs',
                    jobsFile,
                ];
            };
            // Real Step 2 runs left every release order at the tag.
            const atTag = {
                'refs/tags/v3.1.0': TAG_SHA,
                'refs/heads/v3-release-order-a': TAG_SHA,
                'refs/heads/v3-release-order-b': TAG_SHA,
                'refs/heads/v3-release-order-c': TAG_SHA,
            };

            const dryRun = fakeGit(atTag);
            expect(trigger.main(args(step3Jobs('skipped')), dryRun.git)).toEqual([
                'step=3',
                'skip=true',
                'reason=The Step 3 run was a dry run: its push step was skipped, so no branch moved',
            ]);
            expect(dryRun.calls).toEqual([]);

            const failedPush = fakeGit(atTag);
            expect(trigger.main(args(step3Jobs('failure')), failedPush.git)).toEqual([
                'step=3',
                'skip=true',
                'reason=The Step 3 push step did not succeed, so no branch moved',
            ]);
            expect(failedPush.calls).toEqual([]);

            const pushed = fakeGit(atTag);
            expect(trigger.main(args(step3Jobs('success')), pushed.git)).toEqual([
                'step=3',
                'skip=false',
                'release_tag=v3.1.0',
                'release_version=3.1.0',
                'channels=v3-release-order-a,v3-release-order-b,v3-release-order-c,ga',
                'branches=v3-release-order-a,v3-release-order-b,v3-release-order-c',
                'mismatched=',
            ]);
            expect(pushed.calls).toHaveLength(1);

            // Outside Release Please mode a dry run is skipped the same way.
            const dryRunOutside = fakeGit({ ...atTag, 'refs/heads/main': TAG_SHA });
            expect(trigger.main(args(step3Jobs('skipped'), 'false'), dryRunOutside.git)).toContain('skip=true');
            expect(dryRunOutside.calls).toEqual([]);

            expect(() => trigger.main(args({ jobs: step3Jobs('success') }))).toThrow(
                /jobs file must hold a JSON array of objects/
            );
        });

        it('requires the jobs file for a Step 3 run', () => {
            const { git, calls } = fakeGit({});
            expect(() =>
                trigger.main(
                    [
                        'release-step',
                        '--run',
                        runFile(v3Step3Run('V3 Release - Step 3 [v3.1.0]')),
                        '--repository',
                        REPOSITORY,
                        '--step2-workflow-id',
                        STEP2_ID,
                        '--step3-workflow-id',
                        STEP3_ID,
                        '--v3-step2-workflow-id',
                        V3_STEP2_ID,
                        '--v3-step3-workflow-id',
                        V3_STEP3_ID,
                        '--release-please-mode',
                        'true',
                    ],
                    git
                )
            ).toThrow('A Step 3 run needs the jobs of its run attempt (--jobs)');
            expect(calls).toEqual([]);
        });

        it('requires the ID of every release workflow file', () => {
            expect(() =>
                trigger.main([
                    'step1',
                    '--run',
                    runFile(step1Run()),
                    '--repository',
                    REPOSITORY,
                    '--workflow-id',
                    STEP1_ID,
                    '--trigger',
                    'workflow_run',
                ])
            ).toThrow(/--v3-workflow-id is required once/);
            expect(() =>
                trigger.main([
                    'release-step',
                    '--run',
                    runFile(releaseRun(3, 'Staging Release - Step 3 [v3.1.0]')),
                    '--repository',
                    REPOSITORY,
                    '--step2-workflow-id',
                    STEP2_ID,
                    '--step3-workflow-id',
                    STEP3_ID,
                    '--v3-step2-workflow-id',
                    V3_STEP2_ID,
                ])
            ).toThrow(/--v3-step3-workflow-id is required once/);
        });

        it('checks explicit branches', () => {
            const { git } = fakeGit({
                'refs/tags/v3.1.0': TAG_SHA,
                'refs/heads/v3-staging': TAG_SHA,
            });
            expect(
                trigger.main(['branches', '--tag', 'v3.1.0', '--branch', 'v3-staging'], git)
            ).toEqual(['matches=true', `tag_sha=${TAG_SHA}`, 'mismatched=']);
        });

        it.each([
            [['unknown'], /Command must be/],
            [['step1', '--run'], /requires a value/],
            [['pods', '--list', 'qa', '--list', 'us1'], /required once/],
            [['pods', '--list', 'qa', '--extra', 'x'], /Unknown argument/],
            [['pods', '--list', 'us1,us2,st1,eu1,au1', '--release-gate', 'yes'], /--release-gate must be true or false/],
        ])('rejects %j', (args, pattern) => {
            expect(() => trigger.main(args)).toThrow(pattern);
        });
    });
});
