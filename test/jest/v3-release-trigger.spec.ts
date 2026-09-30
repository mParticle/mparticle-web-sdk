import * as fs from 'fs';
import * as path from 'path';
import { makeTempDirectory } from './v3-release/helpers';

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
                    releaseRun(3, 'Staging Release - Step 3 [v3.12.0]', {
                        head_branch: 'master',
                    }),
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
            ['a staging branch', { head_branch: 'v3-staging' }, /main or master/],
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
