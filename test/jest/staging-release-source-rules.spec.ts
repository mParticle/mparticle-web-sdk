import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const yaml = require('js-yaml');

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

// Steps 2 and 3 of each version, and that version's tag major and trunk.
const RELEASE_STEP_FILES: Array<[string, 2 | 3]> = [
    ['staging-step-2.yml', 2],
    ['staging-step-3.yml', 2],
    ['v3-release-step-2.yml', 3],
    ['v3-release-step-3.yml', 3],
];

const dispatchCases = (major: 2 | 3) => {
    const name = `V${major}`;
    const otherMajor = major === 2 ? 3 : 2;
    const trunk = major === 2 ? 'refs/heads/master' : 'refs/heads/main';
    const otherTrunk = major === 2 ? 'refs/heads/main' : 'refs/heads/master';
    const refRule = (ref: string) =>
        `${name} release workflows require source ref ${trunk}; received ${ref}\n`;
    const tagRule = (tag: string) =>
        `Invalid stable ${name} release tag: ${tag}\n`;
    const cases: Array<[string, string, string, number, string]> = [
        [`v${major}.12.0`, trunk, `${name} from its trunk`, 0, ''],
        [
            `v${major}.12.0`,
            otherTrunk,
            `${name} from the other trunk`,
            1,
            refRule(otherTrunk),
        ],
        [
            `v${otherMajor}.12.0`,
            trunk,
            `a V${otherMajor} tag`,
            1,
            tagRule(`v${otherMajor}.12.0`),
        ],
        [
            `v${major}.12.0`,
            'refs/heads/v3-staging',
            'a non-trunk ref',
            1,
            refRule('refs/heads/v3-staging'),
        ],
        ['v4.0.0', trunk, 'an unsupported major', 1, tagRule('v4.0.0')],
        [
            `v${major}.1.0-rc.1`,
            trunk,
            'a prerelease tag',
            1,
            tagRule(`v${major}.1.0-rc.1`),
        ],
        [
            `v${major}.01.0`,
            trunk,
            'a minor version with a leading zero',
            1,
            tagRule(`v${major}.01.0`),
        ],
        [
            `v${major}.1.00`,
            trunk,
            'a patch version with a leading zero',
            1,
            tagRule(`v${major}.1.00`),
        ],
        [
            `v${major}.1.0\nv${otherMajor}.1.0`,
            trunk,
            'a multi-line tag',
            1,
            tagRule(`v${major}.1.0\nv${otherMajor}.1.0`),
        ],
        [
            `v${major}0.1.0`,
            trunk,
            `a major that only starts with ${major}`,
            1,
            tagRule(`v${major}0.1.0`),
        ],
    ];
    return cases;
};

describe('release Steps 2 and 3 per-version dispatch rule', () => {
    for (const [file, major] of RELEASE_STEP_FILES) {
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

            for (const [tag, ref, label, status, output] of dispatchCases(
                major
            )) {
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

const STEP_TWO = '.github/workflows/staging-step-2.yml';

// Runs test in a clone of a repository whose branches each hold the given
// content at stepOne, checked out at dispatchBranch.
const withRepository = (
    stepOne: string,
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
            fs.writeFileSync(path.join(work, STEP_TWO), `${branch}\n`);
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

const differsOutput = (stepOne: string, ref: string, trunk: string) =>
    `${stepOne} on ${ref} differs from refs/remotes/origin/${trunk}\nSynchronize the staging branch from its approved trunk before releasing\n`;

describe('V2 Step 1 (staging-step-1.yml) workflow source validation', () => {
    const workflow = readWorkflow('staging-step-1.yml');
    const parsed = yaml.load(workflow);
    const validate = stepScript(workflow, 'Validate workflow source');
    const stepOne = '.github/workflows/staging-step-1.yml';
    const run = (
        checkout: string,
        summary: string,
        env: Record<string, string>
    ) =>
        runBash(validate, checkout, {
            GITHUB_STEP_SUMMARY: summary,
            ...env,
        });

    it('keeps the track input with v2 as its only option', () => {
        const inputs = parsed.on.workflow_dispatch.inputs;
        expect(Object.keys(inputs)).toEqual(['track', 'dryRun']);
        expect(inputs.track.options).toEqual(['v2']);
        expect(inputs.track.default).toBe('v2');
    });

    it('runs no V3 kit job', () => {
        for (const job of [
            'load-kit-matrix',
            'run-kit-tests',
            'publish-kits',
            'audit-kits',
            'package-v3-candidate',
        ]) {
            expect(Object.keys(parsed.jobs)).not.toContain(job);
        }
        expect(workflow).not.toContain('resumeKitReleaseTag');
        expect(workflow).not.toContain('v3-staging');
    });

    it('compares only its own copy with master', () => {
        expect(validate).not.toContain('refs/remotes/origin/main:');
        expect(validate).not.toContain(STEP_TWO);
        expect(validate).not.toContain('staging-step-3.yml');
        expect(validate).toContain('"v2|refs/heads/staging") ;;');
        expect(validate).toContain('v2) APPROVED_BRANCH="master" ;;');
        expect(validate).not.toContain('APPROVED_BRANCH="main"');
        expect(validate).toContain(`STEP_ONE_WORKFLOW="${stepOne}"`);
        expect(validate).toContain('"HEAD:${STEP_ONE_WORKFLOW}"');
    });

    it('releases V2 when staging matches master, whatever main carries', () => {
        withRepository(
            stepOne,
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

    it('rejects a staging copy that differs from master', () => {
        withRepository(
            stepOne,
            { master: 'v2\n', main: 'v2\n', staging: 'edited\n' },
            'staging',
            (checkout, summary) => {
                const env = { TRACK: 'v2', SOURCE_REF: 'refs/heads/staging' };
                expect(
                    run(checkout, summary, { ...env, DRY_RUN: 'false' })
                ).toEqual({
                    status: 1,
                    output: differsOutput(
                        stepOne,
                        'refs/heads/staging',
                        'master'
                    ),
                });
                expect(
                    run(checkout, summary, { ...env, DRY_RUN: 'true' }).status
                ).toBe(0);
            }
        );
    });

    it('no longer releases V3', () => {
        withRepository(
            stepOne,
            { main: 'same\n', 'v3-staging': 'same\n' },
            'v3-staging',
            (checkout, summary) => {
                for (const track of ['v2', 'v3']) {
                    expect(
                        run(checkout, summary, {
                            TRACK: track,
                            SOURCE_REF: 'refs/heads/v3-staging',
                            DRY_RUN: 'true',
                        })
                    ).toEqual({
                        status: 1,
                        output: `Track ${track} must dispatch from its staging branch; received refs/heads/v3-staging\n`,
                    });
                }
            }
        );
    });

    it('prints Step 2 and 3 preview commands for master', () => {
        const report = stepBlock(
            workflow,
            'Verify and report release candidate'
        );
        expect(report).toContain('PROMOTION_REF="master"');
        expect(report).not.toContain('PROMOTION_REF="main"');
        expect(report).toContain(
            'printf \'gh workflow run staging-step-2.yml --ref %s -f releaseTag=%s -f releaseOrderBranch=release-order-a -f dryRun=true\\n\' "$PROMOTION_REF" "$RELEASE_TAG"'
        );
        expect(report).toContain(
            'printf \'gh workflow run staging-step-3.yml --ref %s -f releaseTag=%s\\n\' "$PROMOTION_REF" "$RELEASE_TAG"'
        );
    });
});

describe('V3 Step 1 (v3-release-step-1.yml) workflow source validation', () => {
    const workflow = readWorkflow('v3-release-step-1.yml');
    const parsed = yaml.load(workflow);
    const validate = stepScript(workflow, 'Validate workflow source');
    const stepOne = '.github/workflows/v3-release-step-1.yml';
    const run = (
        checkout: string,
        summary: string,
        env: Record<string, string>
    ) =>
        runBash(validate, checkout, {
            TRACK: 'v3',
            RESUME_KIT_RELEASE_TAG: '',
            GITHUB_STEP_SUMMARY: summary,
            ...env,
        });

    it('takes no track input and fixes the track to v3', () => {
        expect(Object.keys(parsed.on.workflow_dispatch.inputs)).toEqual([
            'dryRun',
            'resumeKitReleaseTag',
        ]);
        expect(workflow).not.toContain('inputs.track');
        const validateStep = parsed.jobs['confirm-staging-branch'].steps.find(
            (step: { name?: string }) => step.name === 'Validate workflow source'
        );
        expect(validateStep.env.TRACK).toBe('v3');
    });

    it('keeps every job of the shared Step 1, the V3 kit jobs included', () => {
        expect(Object.keys(parsed.jobs)).toEqual([
            'confirm-staging-branch',
            'build-bundle',
            'test-jest',
            'test-core',
            'test-stub',
            'test-integrations-require-js',
            'test-integrations-common-js-browserfy',
            'test-integrations-common-js-webpack',
            'test-integrations-common-js-rollup',
            'test-integrations-module-js-webpack',
            'test-integrations-module-js-rollup',
            'load-kit-matrix',
            'run-kit-tests',
            'create-release-branch',
            'release',
            'publish-kits',
            'audit-kits',
            'package-v3-candidate',
        ]);
    });

    it('shares the publish concurrency group with V2 Step 1', () => {
        expect(parsed.concurrency).toEqual(
            yaml.load(readWorkflow('staging-step-1.yml')).concurrency
        );
    });

    it('compares only its own copy with main', () => {
        expect(validate).not.toContain('refs/remotes/origin/master:');
        expect(validate).not.toContain(STEP_TWO);
        expect(validate).toContain('"v3|refs/heads/v3-staging") ;;');
        expect(validate).toContain('v3) APPROVED_BRANCH="main" ;;');
        expect(validate).not.toContain('APPROVED_BRANCH="master"');
        expect(validate).toContain(`STEP_ONE_WORKFLOW="${stepOne}"`);
        expect(validate).toContain('"HEAD:${STEP_ONE_WORKFLOW}"');
    });

    it('releases V3 when v3-staging matches main, whatever master carries', () => {
        withRepository(
            stepOne,
            { master: 'v2\n', main: 'v3\n', 'v3-staging': 'v3\n' },
            'v3-staging',
            (checkout, summary) => {
                expect(
                    run(checkout, summary, {
                        SOURCE_REF: 'refs/heads/v3-staging',
                        DRY_RUN: 'false',
                    }).status
                ).toBe(0);
            }
        );
    });

    it('rejects a v3-staging copy that differs from main', () => {
        withRepository(
            stepOne,
            { master: 'v3\n', main: 'v3-main\n', 'v3-staging': 'v3\n' },
            'v3-staging',
            (checkout, summary) => {
                expect(
                    run(checkout, summary, {
                        SOURCE_REF: 'refs/heads/v3-staging',
                        DRY_RUN: 'false',
                    })
                ).toEqual({
                    status: 1,
                    output: differsOutput(
                        stepOne,
                        'refs/heads/v3-staging',
                        'main'
                    ),
                });
            }
        );
    });

    it('holds kit recovery to the same v3-staging-vs-main check', () => {
        const recovery = {
            SOURCE_REF: 'refs/heads/v3-staging',
            DRY_RUN: 'false',
            RESUME_KIT_RELEASE_TAG: 'v3.12.0',
        };
        withRepository(
            stepOne,
            { master: 'v2\n', main: 'old\n', 'v3-staging': 'new\n' },
            'v3-staging',
            (checkout, summary) => {
                expect(run(checkout, summary, recovery)).toEqual({
                    status: 1,
                    output: differsOutput(
                        stepOne,
                        'refs/heads/v3-staging',
                        'main'
                    ),
                });
            }
        );
        withRepository(
            stepOne,
            { master: 'v2\n', main: 'new\n', 'v3-staging': 'new\n' },
            'v3-staging',
            (checkout, summary) => {
                expect(run(checkout, summary, recovery).status).toBe(0);
                expect(
                    run(checkout, summary, { ...recovery, DRY_RUN: 'true' })
                ).toEqual({
                    status: 1,
                    output: 'Kit recovery requires dryRun=false\n',
                });
            }
        );
    });

    it('rejects a dispatch from the V2 staging branch', () => {
        withRepository(
            stepOne,
            { master: 'same\n', main: 'same\n', staging: 'same\n' },
            'staging',
            (checkout, summary) => {
                expect(
                    run(checkout, summary, {
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

    it('prints V3 Step 2 and 3 preview commands for main', () => {
        const report = stepBlock(
            workflow,
            'Verify and report release candidate'
        );
        expect(report).toContain('PROMOTION_REF="main"');
        expect(report).not.toContain('PROMOTION_REF="master"');
        expect(report).toContain(
            'printf \'gh workflow run v3-release-step-2.yml --ref %s -f releaseTag=%s -f releaseOrderBranch=release-order-a -f dryRun=true\\n\' "$PROMOTION_REF" "$RELEASE_TAG"'
        );
        expect(report).toContain(
            'printf \'gh workflow run v3-release-step-3.yml --ref %s -f releaseTag=%s\\n\' "$PROMOTION_REF" "$RELEASE_TAG"'
        );
    });
});
