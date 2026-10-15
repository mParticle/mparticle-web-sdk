import * as fs from 'fs';
import * as path from 'path';
import { makeTempDirectory } from './v3-release/helpers';

const yaml = require('js-yaml');
const trigger = require('../../scripts/v3-release/shadow-release-trigger.ts');

const REPOSITORY = 'example-org/example-repo';
const STEP1_ID = '101';
const STEP2_ID = '202';
const STEP3_ID = '303';
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
            expect(trigger.planStep1(step1Run(), REPOSITORY, STEP1_ID, 'workflow_run')).toEqual({
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
                trigger.planStep1(step1Run(overrides), REPOSITORY, STEP1_ID, 'workflow_run')
            ).toThrow(pattern);
        });

        it.each([
            ['failure', { conclusion: 'failure' }, /concluded failure; only a successful run is mirrored automatically/],
            ['cancellation', { conclusion: 'cancelled' }, /concluded cancelled/],
            ['a missing conclusion', { conclusion: null }, /concluded without success/],
            ['an unsafe conclusion', { conclusion: 'x\nskip=false' }, /concluded without success/],
            ['an unfinished run', { status: 'in_progress', conclusion: null }, /has not completed/],
        ])('skips automatic mirroring after %s', (_label, overrides, reason) => {
            const plan = trigger.planStep1(step1Run(overrides), REPOSITORY, STEP1_ID, 'workflow_run');
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
                    STEP1_ID,
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
                STEP1_ID,
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
                trigger.planStep1(step1Run({ conclusion: 'failure' }), REPOSITORY, STEP1_ID, 'workflow_run', jobs)
            ).toMatchObject({ skip: false, reason: '' });
            jobs.push({ ...jobs[0], name: 'Publish and audit V3 kits', conclusion: 'cancelled' });
            expect(
                trigger.planStep1(step1Run({ conclusion: 'failure' }), REPOSITORY, STEP1_ID, 'workflow_run', jobs).skip
            ).toBe(true);
        });

        it('skips a run with two package jobs of the same name', () => {
            const jobs = step1Jobs();
            jobs.push({ ...jobs[2], conclusion: 'failure' });
            expect(
                trigger.planStep1(step1Run({ conclusion: 'failure' }), REPOSITORY, STEP1_ID, 'workflow_run', jobs).skip
            ).toBe(true);
        });

        it('still skips a cancelled run, whatever its jobs show', () => {
            expect(
                trigger.planStep1(
                    step1Run({ conclusion: 'cancelled' }),
                    REPOSITORY,
                    STEP1_ID,
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
                trigger.planStep1(step1Run({ conclusion: 'failure' }), REPOSITORY, STEP1_ID, 'workflow_run', jobs)
            ).toThrow(/different run attempt/);
        });

        it('still validates the run source before reading its jobs', () => {
            expect(() =>
                trigger.planStep1(
                    step1Run({ conclusion: 'failure', head_branch: 'main' }),
                    REPOSITORY,
                    STEP1_ID,
                    'workflow_run',
                    step1Jobs()
                )
            ).toThrow(/v3-staging/);
        });

        it('names jobs that exist in the Step 1 workflow', () => {
            const workflow = yaml.load(
                fs.readFileSync(path.join(__dirname, '../../.github/workflows/staging-step-1.yml'), 'utf8')
            );
            const names = Object.values(workflow.jobs).map((job: any) => job.name);
            for (const name of [trigger.STEP1_RELEASE_JOB, trigger.STEP1_PACKAGE_JOB, ...trigger.STEP1_KIT_JOBS]) {
                expect(names.filter(candidate => candidate === name)).toHaveLength(1);
            }
            expect(workflow.jobs['package-v3-candidate'].needs).toBe('release');
            expect(trigger.STEP1_KIT_JOBS).toEqual([workflow.jobs['publish-kits'].name, workflow.jobs['audit-kits'].name]);
            for (const name of trigger.STEP1_LEGACY_KIT_JOBS) {
                expect(names).not.toContain(name);
            }
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
            ) => trigger.planStep1(step1Run(overrides), REPOSITORY, STEP1_ID, 'workflow_run', jobs, artifacts);

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
                    trigger.planStep1(step1Run(), REPOSITORY, STEP1_ID, 'workflow_run', undefined, artifacts).buildId
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
                        STEP1_ID,
                        'workflow_run',
                        failedAtKits,
                        artifacts
                    )
                ).toMatchObject({ skip: false, buildId: '36618522123-1' });
                expect(
                    trigger.planStep1(step1Run(), REPOSITORY, STEP1_ID, 'workflow_dispatch', jobsWith(), artifacts)
                ).toMatchObject({ skip: false, buildId: '36618522123-1' });
            });
        });

        it('lets a manual dispatch re-mirror any completed run, but not an unfinished one', () => {
            for (const conclusion of ['success', 'failure', 'cancelled']) {
                expect(
                    trigger.planStep1(step1Run({ conclusion }), REPOSITORY, STEP1_ID, 'workflow_dispatch').skip
                ).toBe(false);
            }
            expect(
                trigger.planStep1(
                    step1Run({ status: 'queued', conclusion: null }),
                    REPOSITORY,
                    STEP1_ID,
                    'workflow_dispatch'
                )
            ).toMatchObject({ skip: true, reason: 'The release run has not completed' });
            expect(() =>
                trigger.planStep1(step1Run(), REPOSITORY, STEP1_ID, 'push')
            ).toThrow(/trigger must be/);
        });

        it('rejects malformed repository and workflow IDs', () => {
            expect(() => trigger.planStep1(step1Run(), 'no-slash', STEP1_ID, 'workflow_run')).toThrow(
                /owner\/name/
            );
            expect(() => trigger.planStep1(step1Run(), REPOSITORY, '', 'workflow_run')).toThrow(
                /workflow ID/
            );
        });
    });

    describe('Step 2 and Step 3 runs', () => {
        it('maps a Step 2 run to its V3 release order', () => {
            expect(
                trigger.planReleaseStep(
                    releaseRun(2, 'Staging Release - Step 2 [v3.11.1 \u2192 release-order-c]'),
                    REPOSITORY,
                    STEP2_ID,
                    STEP3_ID
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
                    STEP2_ID,
                    STEP3_ID
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
                STEP2_ID,
                STEP3_ID
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
                STEP2_ID,
                STEP3_ID
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
                    STEP2_ID,
                    STEP3_ID
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
                    STEP2_ID,
                    STEP3_ID
                )
            ).toThrow(pattern);
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
        ])('rejects %j', (args, pattern) => {
            expect(() => trigger.main(args)).toThrow(pattern);
        });
    });
});
