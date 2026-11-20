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

// Steps 2 and 3 release V2 only, from master, dry runs included.
const TRUNK = 'refs/heads/master';
const refRule = (ref: string) =>
    `V2 release workflows require source ref ${TRUNK}; received ${ref}\n`;
const tagRule = (tag: string) => `Invalid stable V2 release tag: ${tag}\n`;

const dispatchCases: Array<[string, string, string, number, string]> = [
    ['v2.81.1', TRUNK, 'V2 from master', 0, ''],
    ...[
        'refs/heads/main',
        'refs/heads/staging',
        'refs/heads/development',
        'refs/heads/v3-staging',
        'refs/tags/v2.81.1',
        '',
    ].map((ref): [string, string, string, number, string] => [
        'v2.81.1',
        ref,
        `source ref ${ref || '(empty)'}`,
        1,
        refRule(ref),
    ]),
    ['v3.12.0', TRUNK, 'a V3 tag', 1, tagRule('v3.12.0')],
    ['v4.0.0', TRUNK, 'an unsupported major', 1, tagRule('v4.0.0')],
    ['v2.1.0-rc.1', TRUNK, 'a prerelease tag', 1, tagRule('v2.1.0-rc.1')],
    [
        'v2.01.0',
        TRUNK,
        'a minor version with a leading zero',
        1,
        tagRule('v2.01.0'),
    ],
    [
        'v2.1.00',
        TRUNK,
        'a patch version with a leading zero',
        1,
        tagRule('v2.1.00'),
    ],
    [
        'v2.1.0\nv3.1.0',
        TRUNK,
        'a multi-line tag',
        1,
        tagRule('v2.1.0\nv3.1.0'),
    ],
    [
        'v20.1.0',
        TRUNK,
        'a major that only starts with 2',
        1,
        tagRule('v20.1.0'),
    ],
];

describe('V2 release Steps 2 and 3 dispatch rule', () => {
    const files: Array<[string, string]> = [
        [
            'staging-step-2.yml',
            "name: 'V2 Release - Step 2: Publish SDK Release to Release Order Branch'\n",
        ],
        [
            'staging-step-3.yml',
            'name: "V2 Release - Step 3: Release to CDN and Synchronize Branches"\n',
        ],
    ];
    for (const [file, nameLine] of files) {
        describe(file, () => {
            const workflow = readWorkflow(file);
            const validateStep = stepBlock(
                workflow,
                'Validate workflow source'
            );
            const validate = stepScript(workflow, 'Validate workflow source');

            it('carries the V2 display name and no V3 branch mapping', () => {
                expect(workflow.startsWith(nameLine)).toBe(true);
                expect(workflow).not.toContain('Staging Release');
                expect(workflow).not.toContain('v3-staging');
                expect(workflow).not.toContain('v3-release-order');
                expect(workflow).not.toContain('v3-development');
                expect(workflow).not.toContain('refs/heads/main');
                expect(workflow).toContain(
                    'GITHUB_TOKEN: ${{ secrets.MP_SEMANTIC_RELEASE_BOT }}'
                );
            });

            it('does not compare the master and main copies', () => {
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

            for (const [tag, ref, label, status, output] of dispatchCases) {
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

describe('V2 Step 1 (staging-step-1.yml) workflow source validation', () => {
    const workflow = readWorkflow('staging-step-1.yml');
    const validate = stepScript(workflow, 'Validate workflow source');
    const stepOne = '.github/workflows/staging-step-1.yml';
    const stepTwo = '.github/workflows/staging-step-2.yml';
    const differs = `${stepOne} on refs/heads/staging differs from refs/remotes/origin/master\nSynchronize the staging branch from its approved trunk before releasing\n`;

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
            GITHUB_STEP_SUMMARY: summary,
            ...env,
        });

    it('keeps the trusted-publisher filename but takes only dryRun as input', () => {
        expect(
            workflow.startsWith(
                "name: 'V2 Release - Step 1: Prepare CDN Pre-Release, Publish NPM'\nrun-name: 'V2 Release - Step 1 [v2]'\n"
            )
        ).toBe(true);
        expect(workflow).not.toContain('Staging Release');
        expect(workflow).not.toContain('inputs.track');
        expect(workflow).not.toContain('resumeKitReleaseTag');
        expect(workflow).not.toMatch(/v3|V3/);
        const inputs = workflow.slice(
            workflow.indexOf('        inputs:\n'),
            workflow.indexOf('concurrency:\n')
        );
        expect(inputs.match(/^ {12}\S+:$/gm)).toEqual(['            dryRun:']);
        expect(validate).toContain(`STEP_ONE_WORKFLOW="${stepOne}"`);
        expect(validate).toContain('APPROVED_BRANCH="master"');
        expect(validate).toContain('"HEAD:${STEP_ONE_WORKFLOW}"');
        expect(validate).not.toContain(stepTwo);
        expect(validate).not.toContain('staging-step-3.yml');
    });

    for (const dryRun of ['true', 'false']) {
        it(`accepts staging when it matches master (dryRun=${dryRun}), independently of main`, () => {
            withRepository(
                { master: 'v2\n', main: 'v3\n', staging: 'v2\n' },
                'staging',
                (checkout, summary) => {
                    expect(
                        run(checkout, summary, {
                            SOURCE_REF: 'refs/heads/staging',
                            DRY_RUN: dryRun,
                        }).status
                    ).toBe(0);
                    expect(fs.readFileSync(summary, 'utf8')).toContain(
                        '- Source ref: `refs/heads/staging`'
                    );
                }
            );
        });

        for (const ref of [
            'refs/heads/main',
            'refs/heads/master',
            'refs/heads/v3-staging',
            'refs/heads/development',
            'refs/tags/v2.12.0',
            '',
        ]) {
            it(`rejects ${
                ref || 'an empty ref'
            } before git or summary writes (dryRun=${dryRun})`, () => {
                // There is no repository or summary here: a wrong ref must fail
                // before fetching approved source, even for a real release.
                expect(
                    runBash(validate, os.tmpdir(), {
                        SOURCE_REF: ref,
                        DRY_RUN: dryRun,
                        GITHUB_STEP_SUMMARY: '',
                    })
                ).toEqual({
                    status: 1,
                    output: `V2 Step 1 requires source ref refs/heads/staging; received ${ref}\n`,
                });
            });
        }
    }

    it('rejects a real release when staging differs from master, even when main matches', () => {
        withRepository(
            { master: 'approved\n', main: 'edited\n', staging: 'edited\n' },
            'staging',
            (checkout, summary) => {
                const env = { SOURCE_REF: 'refs/heads/staging' };
                expect(
                    run(checkout, summary, { ...env, DRY_RUN: 'false' })
                ).toEqual({ status: 1, output: differs });
                expect(fs.existsSync(summary)).toBe(false);
                expect(
                    run(checkout, summary, { ...env, DRY_RUN: 'true' }).status
                ).toBe(0);
            }
        );
    });

    it('fails closed for a real release without an approved master copy', () => {
        withRepository(
            { main: 'same\n', staging: 'same\n' },
            'staging',
            (checkout, summary) => {
                expect(
                    run(checkout, summary, {
                        SOURCE_REF: 'refs/heads/staging',
                        DRY_RUN: 'false',
                    }).status
                ).not.toBe(0);
                expect(fs.existsSync(summary)).toBe(false);
            }
        );
    });

    it('fixes the V2 branch and npm mapping and freezes development before tests', () => {
        const resolve = stepScript(workflow, 'Resolve exact branch mapping');
        for (const setting of [
            'DEVELOPMENT_BRANCH="development"',
            'STAGING_BRANCH="staging"',
            'RELEASE_BRANCH="release/${GITHUB_RUN_NUMBER}"',
            'NPM_DIST_TAG="latest"',
            'git rev-parse "refs/remotes/origin/${DEVELOPMENT_BRANCH}^{commit}"',
            'echo "candidate_sha=${CANDIDATE_SHA}"',
        ]) {
            expect(resolve).toContain(setting);
        }
        const mapping = stepScript(
            workflow,
            'Validate V2 mapping and checkout'
        );
        expect(mapping).toContain(
            '"development|staging|release/${GITHUB_RUN_NUMBER}|latest") ;;'
        );
        expect(mapping).toContain('git merge-base --is-ancestor');
        expect(mapping).toContain('"$CHECKED_OUT_SHA" != "$EXPECTED_SHA"');
        const baseline = stepScript(
            workflow,
            'Validate reachable release tag major'
        );
        expect(baseline).toContain('EXPECTED_MAJOR=2');
        expect(baseline).toContain('"$FOUND_MAJOR" != "$EXPECTED_MAJOR"');
    });

    it('retains every core and integration gate and removes every kit job', () => {
        const gates = [
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
        ];
        // Job keys are the only mappings at one indent level under jobs.
        const jobs = workflow
            .slice(workflow.indexOf('\njobs:\n'))
            .match(/^ {4}[a-z][a-z0-9-]*:$/gm)
            .map((line) => line.trim().slice(0, -1));
        expect(jobs).toEqual([...gates, 'create-release-branch', 'release']);

        const create = workflow.slice(
            workflow.indexOf('\n    create-release-branch:\n'),
            workflow.indexOf('\n    release:\n')
        );
        expect(create).toContain('!cancelled()');
        for (const gate of gates) {
            expect(create).toContain(`needs.${gate}.result == 'success'`);
            expect(create).toContain(`            - ${gate}\n`);
        }

        const release = workflow.slice(workflow.indexOf('\n    release:\n'));
        expect(release).toContain(
            "needs.create-release-branch.result == 'success'"
        );
        expect(release).toContain(
            'GITHUB_TOKEN: ${{ secrets.MP_SEMANTIC_RELEASE_BOT }}'
        );
        expect(release).toContain('id-token: write');
        expect(release).toContain(
            'npx semantic-release --branches "$STAGING_BRANCH"'
        );
        expect(workflow).toContain(
            'concurrency:\n    group: mparticle-web-sdk-release-publish\n    cancel-in-progress: false\n'
        );
    });

    it('prints only the V2 Step 2 and 3 preview commands from master', () => {
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
