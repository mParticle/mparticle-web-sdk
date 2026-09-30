import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const readWorkflow = (name: string) =>
    fs.readFileSync(
        path.join(__dirname, `../../.github/workflows/${name}`),
        'utf8'
    );

const stepBlock = (workflow: string, stepName: string) => {
    const start = workflow.indexOf(`- name: ${stepName}\n`);
    expect(start).toBeGreaterThan(-1);
    const lineStart = workflow.lastIndexOf('\n', start) + 1;
    const indent = start - lineStart;
    const [first, ...rest] = workflow.slice(lineStart).split('\n');
    const block = [first];
    for (const line of rest) {
        if (line !== '' && line.search(/\S/) <= indent) {
            break;
        }
        block.push(line);
    }
    return block.join('\n');
};

const stepScript = (workflow: string, stepName: string) => {
    const step = stepBlock(workflow, stepName);
    const lines = step
        .slice(step.indexOf('run: |\n') + 'run: |\n'.length)
        .split('\n');
    const indent = lines[0].match(/^ */)[0];
    const body = [];
    for (const line of lines) {
        if (line !== '' && !line.startsWith(indent)) {
            break;
        }
        body.push(line.slice(indent.length));
    }
    return body.join('\n');
};

const runBash = (script: string, cwd: string, env: Record<string, string>) => {
    const result = spawnSync(
        'bash',
        ['--noprofile', '--norc', '-eo', 'pipefail', '-c', script],
        { cwd, encoding: 'utf8', env: { ...process.env, ...env } }
    );
    return {
        status: result.status,
        output: `${result.stdout}${result.stderr}`,
    };
};

describe('staging release Steps 2 and 3 per-track dispatch rule', () => {
    const cases: Array<[string, string, string, number, string]> = [
        ['v3.12.0', 'refs/heads/main', 'V3 from main', 0, ''],
        [
            'v3.12.0',
            'refs/heads/master',
            'V3 from master',
            1,
            'V3 releases are promoted from main; re-run this workflow from main\n',
        ],
        ['v2.81.1', 'refs/heads/master', 'V2 from master', 0, ''],
        [
            'v2.81.1',
            'refs/heads/main',
            'V2 from main',
            1,
            'V2 releases are promoted from master; re-run this workflow from master\n',
        ],
        [
            'v3.12.0',
            'refs/heads/v3-staging',
            'a non-trunk ref',
            1,
            'Release workflows require source ref refs/heads/master or refs/heads/main; received refs/heads/v3-staging\n',
        ],
        [
            'v4.0.0',
            'refs/heads/main',
            'an unsupported major',
            1,
            'Invalid stable release tag: v4.0.0\n',
        ],
        [
            'v3.1.0-rc.1',
            'refs/heads/main',
            'a prerelease tag',
            1,
            'Invalid stable release tag: v3.1.0-rc.1\n',
        ],
        [
            'v3.1.0\nv2.1.0',
            'refs/heads/main',
            'a multi-line tag',
            1,
            'Invalid stable release tag: v3.1.0\nv2.1.0\n',
        ],
        [
            'v30.1.0',
            'refs/heads/main',
            'a major that only starts with 3',
            1,
            'Invalid stable release tag: v30.1.0\n',
        ],
    ];

    for (const file of ['staging-step-2.yml', 'staging-step-3.yml']) {
        describe(file, () => {
            const workflow = readWorkflow(file);
            const validateStep = stepBlock(
                workflow,
                'Validate workflow source'
            );
            const validate = stepScript(workflow, 'Validate workflow source');

            it('no longer compares the master and main copies', () => {
                expect(workflow).not.toContain('refs/remotes/origin/master:');
                expect(workflow).not.toContain('refs/remotes/origin/main:');
                expect(workflow).not.toContain('differs between origin/master');
            });

            it('applies the rule to dry runs as well as real runs', () => {
                expect(validateStep).not.toContain('DRY_RUN');
                expect(validateStep).not.toContain('dryRun');
                expect(validateStep).toContain(
                    'RELEASE_TAG: ${{ inputs.releaseTag }}'
                );
                expect(validate).not.toContain('${{');
                expect(
                    workflow.indexOf('- name: Validate workflow source')
                ).toBeLessThan(workflow.indexOf('- name: Setup Node.js'));
            });

            for (const [tag, ref, label, status, output] of cases) {
                it(`${status === 0 ? 'accepts' : 'rejects'} ${label}`, () => {
                    expect(
                        runBash(validate, os.tmpdir(), {
                            RELEASE_TAG: tag,
                            SOURCE_REF: ref,
                        })
                    ).toEqual({ status, output });
                });
            }
        });
    }
});

describe('staging release Step 1 workflow source validation', () => {
    const workflow = readWorkflow('staging-step-1.yml');
    const validate = stepScript(workflow, 'Validate workflow source');
    const stepOne = '.github/workflows/staging-step-1.yml';
    const stepTwo = '.github/workflows/staging-step-2.yml';

    const withRepository = (
        branches: Record<string, string>,
        dispatchBranch: string,
        test: (checkout: string, summary: string) => void
    ) => {
        const root = fs.realpathSync(
            fs.mkdtempSync(path.join(os.tmpdir(), 'mparticle-step-one-'))
        );
        const git = (cwd: string, ...args: string[]) => {
            const result = spawnSync(
                'git',
                [
                    '-c',
                    'user.name=test',
                    '-c',
                    'user.email=test@example.com',
                    '-c',
                    'commit.gpgsign=false',
                    '-c',
                    'init.defaultBranch=seed',
                    ...args,
                ],
                { cwd, encoding: 'utf8' }
            );
            expect(result.status).toBe(0);
        };
        const origin = path.join(root, 'origin.git');
        const work = path.join(root, 'work');
        const checkout = path.join(root, 'checkout');
        try {
            git(root, 'init', '-q', '--bare', origin);
            git(root, 'init', '-q', work);
            fs.writeFileSync(path.join(work, 'seed'), 'seed');
            git(work, 'add', 'seed');
            git(work, 'commit', '-q', '-m', 'seed');
            for (const [branch, content] of Object.entries(branches)) {
                git(work, 'checkout', '-q', '-B', branch, 'seed');
                fs.mkdirSync(path.join(work, '.github/workflows'), {
                    recursive: true,
                });
                fs.writeFileSync(path.join(work, stepOne), content);
                fs.writeFileSync(path.join(work, stepTwo), `${branch}\n`);
                git(work, 'add', '.github');
                git(work, 'commit', '-q', '-m', branch);
                git(work, 'push', '-q', origin, `${branch}:${branch}`);
            }
            git(root, 'clone', '-q', '-b', dispatchBranch, origin, checkout);
            test(checkout, path.join(root, 'summary.md'));
        } finally {
            fs.rmSync(root, { force: true, recursive: true });
        }
    };

    const run = (
        checkout: string,
        summary: string,
        env: Record<string, string>
    ) =>
        runBash(validate, checkout, {
            RESUME_KIT_RELEASE_TAG: '',
            GITHUB_STEP_SUMMARY: summary,
            ...env,
        });

    it('no longer compares the master and main copies', () => {
        expect(validate).not.toContain('refs/remotes/origin/master:');
        expect(validate).not.toContain('refs/remotes/origin/main:');
        expect(validate).not.toContain('differs between origin/master');
        expect(validate).not.toContain(stepTwo);
        expect(validate).not.toContain('staging-step-3.yml');
    });

    it('keeps the dispatch-ref and staging-vs-trunk checks', () => {
        expect(validate).toContain(
            '"v2|refs/heads/staging"|"v3|refs/heads/v3-staging") ;;'
        );
        expect(validate).toContain('v2) APPROVED_BRANCH="master" ;;');
        expect(validate).toContain('v3) APPROVED_BRANCH="main" ;;');
        expect(validate).toContain('"HEAD:${STEP_ONE_WORKFLOW}"');
    });

    it('releases V2 when staging matches master, whatever main carries', () => {
        withRepository(
            { master: 'v2\n', main: 'v3\n', staging: 'v2\n' },
            'staging',
            (checkout, summary) => {
                expect(
                    run(checkout, summary, {
                        TRACK: 'v2',
                        SOURCE_REF: 'refs/heads/staging',
                        DRY_RUN: 'false',
                    }).status
                ).toBe(0);
            }
        );
    });

    it('releases V3 when v3-staging matches main, whatever master carries', () => {
        withRepository(
            { master: 'v2\n', main: 'v3\n', 'v3-staging': 'v3\n' },
            'v3-staging',
            (checkout, summary) => {
                expect(
                    run(checkout, summary, {
                        TRACK: 'v3',
                        SOURCE_REF: 'refs/heads/v3-staging',
                        DRY_RUN: 'false',
                    }).status
                ).toBe(0);
            }
        );
    });

    it('rejects a staging copy that differs from its own trunk', () => {
        withRepository(
            { master: 'v2\n', main: 'v2\n', staging: 'edited\n' },
            'staging',
            (checkout, summary) => {
                const env = { TRACK: 'v2', SOURCE_REF: 'refs/heads/staging' };
                expect(
                    run(checkout, summary, { ...env, DRY_RUN: 'false' })
                ).toEqual({
                    status: 1,
                    output: `${stepOne} on refs/heads/staging differs from refs/remotes/origin/master\nSynchronize the staging branch from its approved trunk before releasing\n`,
                });
                expect(
                    run(checkout, summary, { ...env, DRY_RUN: 'true' }).status
                ).toBe(0);
            }
        );
        withRepository(
            { master: 'v3\n', main: 'v3-main\n', 'v3-staging': 'v3\n' },
            'v3-staging',
            (checkout, summary) => {
                expect(
                    run(checkout, summary, {
                        TRACK: 'v3',
                        SOURCE_REF: 'refs/heads/v3-staging',
                        DRY_RUN: 'false',
                    })
                ).toEqual({
                    status: 1,
                    output: `${stepOne} on refs/heads/v3-staging differs from refs/remotes/origin/main\nSynchronize the staging branch from its approved trunk before releasing\n`,
                });
            }
        );
    });

    it('holds V3 kit recovery to the same staging-vs-trunk check', () => {
        const recovery = {
            TRACK: 'v3',
            SOURCE_REF: 'refs/heads/v3-staging',
            DRY_RUN: 'false',
            RESUME_KIT_RELEASE_TAG: 'v3.12.0',
        };
        withRepository(
            { master: 'v2\n', main: 'old\n', 'v3-staging': 'new\n' },
            'v3-staging',
            (checkout, summary) => {
                expect(run(checkout, summary, recovery)).toEqual({
                    status: 1,
                    output: `${stepOne} on refs/heads/v3-staging differs from refs/remotes/origin/main\nSynchronize the staging branch from its approved trunk before releasing\n`,
                });
            }
        );
        withRepository(
            { master: 'v2\n', main: 'new\n', 'v3-staging': 'new\n' },
            'v3-staging',
            (checkout, summary) => {
                expect(run(checkout, summary, recovery).status).toBe(0);
                expect(
                    run(checkout, summary, { ...recovery, DRY_RUN: 'true' })
                ).toEqual({
                    status: 1,
                    output: 'Kit recovery requires track=v3 and dryRun=false\n',
                });
            }
        );
    });

    it('rejects a track dispatched from the other staging branch', () => {
        withRepository(
            { master: 'same\n', main: 'same\n', staging: 'same\n' },
            'staging',
            (checkout, summary) => {
                expect(
                    run(checkout, summary, {
                        TRACK: 'v3',
                        SOURCE_REF: 'refs/heads/staging',
                        DRY_RUN: 'true',
                    })
                ).toEqual({
                    status: 1,
                    output:
                        'Track v3 must dispatch from its staging branch; received refs/heads/staging\n',
                });
            }
        );
    });

    it('prints Step 2 and 3 preview commands for the track trunk', () => {
        const report = stepBlock(
            workflow,
            'Verify and report release candidate'
        );
        expect(report).toContain('v2) PROMOTION_REF="master" ;;');
        expect(report).toContain('v3) PROMOTION_REF="main" ;;');
        expect(report).toContain(
            'printf \'gh workflow run staging-step-2.yml --ref %s -f releaseTag=%s -f releaseOrderBranch=release-order-a -f dryRun=true\\n\' "$PROMOTION_REF" "$RELEASE_TAG"'
        );
        expect(report).toContain(
            'printf \'gh workflow run staging-step-3.yml --ref %s -f releaseTag=%s\\n\' "$PROMOTION_REF" "$RELEASE_TAG"'
        );
    });
});
