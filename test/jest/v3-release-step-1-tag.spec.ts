import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const yaml = require('js-yaml');
const { loadReleaseInventory } = require('../../scripts/prepare-kit-release');
const {
    publishCore,
    verifyCurrentReleaseComplete,
} = require('../../scripts/publish-kits');

// V3 Step 1 dispatched from a stable v3.X.Y tag (Release Please mode): the
// source checks, the tag mapping, a tag dispatch run through the whole source
// job, the bundle comparison, the core publish, the v3-staging fast-forward
// and a second dispatch after a partial kit publish. The semantic-release
// path from v3-staging keeps its own tests in
// staging-release-source-rules.spec.ts.

const STEP1_PATH = path.join(
    __dirname,
    '../../.github/workflows/v3-release-step-1.yml'
);
const workflow = yaml.load(fs.readFileSync(STEP1_PATH, 'utf8'));
const RELEASE_REPOSITORY = "github.repository == 'mParticle/mparticle-web-sdk'";
const TAG_MODE = "needs.confirm-staging-branch.outputs.release_mode == 'tag'";
const SEMANTIC_RELEASE_MODE =
    "needs.confirm-staging-branch.outputs.release_mode == 'semantic-release'";

const stepNamed = (jobName: string, stepName: string) => {
    const step = workflow.jobs[jobName].steps.find(
        (candidate: { name?: string }) => candidate.name === stepName
    );
    expect(step).toBeDefined();
    return step;
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
            'tag.gpgsign=false',
            '-c',
            'init.defaultBranch=main',
            ...args,
        ],
        { cwd, encoding: 'utf8' }
    );
    expect(result.status).toBe(0);
    return result.stdout.trim();
};

interface Origin {
    root: string;
    origin: string;
    staging: string;
    release: string;
    later: string;
    offMain: string;
}

// An origin whose main runs staging -> release (tag v3.29.1) -> later, with
// v3-staging at the first commit, v3-development at the last, and a tag
// v3.29.9 on a commit that is not on main.
const withOrigin = (test: (origin: Origin) => void) => {
    const root = fs.realpathSync(
        fs.mkdtempSync(path.join(os.tmpdir(), 'mparticle-step1-tag-'))
    );
    const origin = path.join(root, 'origin.git');
    const work = path.join(root, 'work');
    const commit = (name: string) => {
        fs.writeFileSync(path.join(work, 'file'), `${name}\n`);
        git(work, 'add', 'file');
        git(work, 'commit', '-q', '-m', name);
        return git(work, 'rev-parse', 'HEAD');
    };
    try {
        git(root, 'init', '-q', '--bare', origin);
        git(root, 'init', '-q', work);
        const staging = commit('staging');
        const release = commit('release');
        git(work, 'tag', 'v3.29.1');
        const later = commit('later');
        git(work, 'branch', 'v3-staging', staging);
        git(work, 'branch', 'v3-development', 'main');
        git(work, 'checkout', '-q', '-b', 'side', staging);
        const offMain = commit('off main');
        git(work, 'tag', 'v3.29.9');
        git(
            work,
            'push',
            '-q',
            origin,
            'main',
            'v3-staging',
            'v3-development',
            'v3.29.1',
            'v3.29.9'
        );
        test({ root, origin, staging, release, later, offMain });
    } finally {
        fs.rmSync(root, { force: true, recursive: true });
    }
};

// Each call clones into a new empty directory, so one test can clone twice.
const clone = (origin: Origin, name: string, ref: string) => {
    const checkout = fs.mkdtempSync(path.join(origin.root, `${name}-`));
    git(origin.root, 'clone', '-q', origin.origin, checkout);
    git(checkout, 'checkout', '-q', ref);
    return checkout;
};

const lsRemote = (origin: Origin, ref: string) =>
    git(origin.root, 'ls-remote', origin.origin, ref).split('\t')[0];

describe('V3 Step 1 from a release tag: workflow source', () => {
    const validate = stepNamed('confirm-staging-branch', 'Validate workflow source');
    const run = (cwd: string, env: Record<string, string>) =>
        runBash(validate.run, cwd, {
            TRACK: 'v3',
            DRY_RUN: 'false',
            RESUME_KIT_RELEASE_TAG: '',
            RELEASE_PLEASE_ENABLED: '',
            GITHUB_STEP_SUMMARY: path.join(cwd, '..', 'summary.md'),
            ...env,
        });

    it('reads the kill switch from the repository variable', () => {
        expect(validate.env.RELEASE_PLEASE_ENABLED).toBe(
            '${{ vars.V3_RELEASE_PLEASE_ENABLED }}'
        );
    });

    it('accepts a stable tag on main, in a real run and a dry run', () => {
        withOrigin(origin => {
            const checkout = clone(origin, 'checkout', 'v3.29.1');
            for (const dryRun of ['false', 'true']) {
                expect(
                    run(checkout, {
                        SOURCE_REF: 'refs/tags/v3.29.1',
                        DRY_RUN: dryRun,
                        RELEASE_PLEASE_ENABLED: 'true',
                    }).status
                ).toBe(0);
            }
        });
    });

    it('runs a tag release only while V3_RELEASE_PLEASE_ENABLED is true', () => {
        withOrigin(origin => {
            const checkout = clone(origin, 'checkout', 'v3.29.1');
            for (const dryRun of ['false', 'true']) {
                for (const enabled of ['', 'false', 'TRUE']) {
                    expect(
                        run(checkout, {
                            SOURCE_REF: 'refs/tags/v3.29.1',
                            DRY_RUN: dryRun,
                            RELEASE_PLEASE_ENABLED: enabled,
                        })
                    ).toEqual({
                        status: 1,
                        output:
                            "A Step 1 run from a release tag needs V3_RELEASE_PLEASE_ENABLED set to 'true'\n",
                    });
                }
            }
        });
    });

    it('rejects a tag whose commit is not on main', () => {
        withOrigin(origin => {
            const checkout = clone(origin, 'checkout', 'v3.29.9');
            for (const dryRun of ['false', 'true']) {
                const result = run(checkout, {
                    SOURCE_REF: 'refs/tags/v3.29.9',
                    DRY_RUN: dryRun,
                    RELEASE_PLEASE_ENABLED: 'true',
                });
                expect(result.status).toBe(1);
                expect(result.output).toContain(
                    'refs/tags/v3.29.9 is not on main\n'
                );
            }
        });
    });

    it('rejects a tag that is not a stable v3 release', () => {
        withOrigin(origin => {
            const checkout = clone(origin, 'checkout', 'v3.29.1');
            for (const ref of [
                'refs/tags/v3.29.1-beta.1',
                'refs/tags/v3.029.1',
                'refs/tags/v3.29',
            ]) {
                expect(run(checkout, { SOURCE_REF: ref })).toEqual({
                    status: 1,
                    output: `Track v3 releases only a stable v3 tag; received ${ref}\n`,
                });
            }
            expect(run(checkout, { SOURCE_REF: 'refs/tags/v4.0.0' })).toEqual({
                status: 1,
                output:
                    'Track v3 must dispatch from its staging branch; received refs/tags/v4.0.0\n',
            });
        });
    });

    it('sends kit recovery for a tag release back to the tag', () => {
        withOrigin(origin => {
            const checkout = clone(origin, 'checkout', 'v3.29.1');
            expect(
                run(checkout, {
                    SOURCE_REF: 'refs/tags/v3.29.1',
                    RESUME_KIT_RELEASE_TAG: 'v3.29.1',
                })
            ).toEqual({
                status: 1,
                output:
                    'Kit recovery runs from v3-staging; to finish a tag release, dispatch Step 1 from the same tag again\n',
            });
        });
    });

    it('stops a semantic-release run from v3-staging once Release Please is on', () => {
        withOrigin(origin => {
            const checkout = clone(origin, 'checkout', 'v3-staging');
            expect(
                run(checkout, {
                    SOURCE_REF: 'refs/heads/v3-staging',
                    DRY_RUN: 'true',
                    RELEASE_PLEASE_ENABLED: 'true',
                })
            ).toEqual({
                status: 1,
                output:
                    'Release Please cuts V3 releases; dispatch Step 1 from the release tag\n',
            });
            expect(
                run(checkout, {
                    SOURCE_REF: 'refs/heads/v3-staging',
                    DRY_RUN: 'true',
                }).status
            ).toBe(0);
        });
    });
});

describe('V3 Step 1 from a release tag: branch mapping', () => {
    const resolve = stepNamed(
        'confirm-staging-branch',
        'Resolve exact branch mapping'
    );
    const guard = stepNamed(
        'confirm-staging-branch',
        'Validate track mapping and checkout'
    );
    const outputs = (file: string) => {
        const values: Record<string, string> = {};
        for (const line of fs
            .readFileSync(file, 'utf8')
            .trim()
            .split('\n')) {
            values[line.slice(0, line.indexOf('='))] = line.slice(
                line.indexOf('=') + 1
            );
        }
        return values;
    };

    it('exports the mode and the tag to every job', () => {
        const jobOutputs = workflow.jobs['confirm-staging-branch'].outputs;
        expect(jobOutputs.release_mode).toBe(
            '${{ steps.resolve.outputs.release_mode }}'
        );
        expect(jobOutputs.release_tag).toBe(
            '${{ steps.resolve.outputs.release_tag }}'
        );
    });

    it('freezes the tag commit, with main as the development branch and no release branch', () => {
        withOrigin(origin => {
            const checkout = clone(origin, 'checkout', 'v3.29.1');
            const output = path.join(origin.root, 'output');
            const result = runBash(resolve.run, checkout, {
                TRACK: 'v3',
                RESUME_KIT_RELEASE_TAG: '',
                SOURCE_REF: 'refs/tags/v3.29.1',
                SOURCE_SHA: origin.release,
                GITHUB_RUN_ID: '123',
                GITHUB_OUTPUT: output,
            });
            expect(result.status).toBe(0);
            expect(outputs(output)).toEqual({
                development_branch: 'main',
                candidate_sha: origin.release,
                staging_branch: 'v3-staging',
                release_branch: '',
                npm_dist_tag: 'next',
                release_mode: 'tag',
                release_tag: 'v3.29.1',
            });
        });
    });

    it('stops when the tag no longer holds the dispatched commit', () => {
        withOrigin(origin => {
            const checkout = clone(origin, 'checkout', 'v3.29.1');
            const result = runBash(resolve.run, checkout, {
                TRACK: 'v3',
                RESUME_KIT_RELEASE_TAG: '',
                SOURCE_REF: 'refs/tags/v3.29.1',
                SOURCE_SHA: origin.staging,
                GITHUB_RUN_ID: '123',
                GITHUB_OUTPUT: path.join(origin.root, 'output'),
            });
            expect(result.status).toBe(1);
            expect(result.output).toContain(
                `v3.29.1 resolves to ${origin.release}, but the dispatch ran ${origin.staging}\n`
            );
        });
    });

    it('keeps the semantic-release mapping for a v3-staging dispatch', () => {
        withOrigin(origin => {
            const checkout = clone(origin, 'checkout', 'v3-staging');
            const output = path.join(origin.root, 'output');
            const result = runBash(resolve.run, checkout, {
                TRACK: 'v3',
                RESUME_KIT_RELEASE_TAG: '',
                SOURCE_REF: 'refs/heads/v3-staging',
                SOURCE_SHA: origin.staging,
                GITHUB_RUN_ID: '123',
                GITHUB_OUTPUT: output,
            });
            expect(result.status).toBe(0);
            expect(outputs(output)).toMatchObject({
                development_branch: 'v3-development',
                candidate_sha: lsRemote(origin, 'refs/heads/v3-development'),
                release_branch: 'v3-release/step1-123',
                release_mode: 'semantic-release',
                release_tag: '',
            });
        });
    });

    const runGuard = (
        origin: Origin,
        overrides: Record<string, string> = {}
    ) => {
        const checkout = clone(origin, 'guard', 'v3-staging');
        fs.writeFileSync(
            path.join(checkout, 'release.config.js'),
            "module.exports = { branches: ['main'] };\n"
        );
        return runBash(guard.run, checkout, {
            TRACK: 'v3',
            DEVELOPMENT_BRANCH: 'main',
            STAGING_BRANCH: 'v3-staging',
            RELEASE_BRANCH: '',
            NPM_DIST_TAG: 'next',
            CANDIDATE_SHA: origin.release,
            RESUME_KIT_RELEASE_TAG: '',
            RELEASE_MODE: 'tag',
            RELEASE_TAG: 'v3.29.1',
            GITHUB_RUN_ID: '123',
            GITHUB_STEP_SUMMARY: path.join(origin.root, 'summary.md'),
            ...overrides,
        });
    };

    it('accepts the tag mapping when v3-staging fast-forwards to the tag', () => {
        withOrigin(origin => {
            expect(runGuard(origin).status).toBe(0);
        });
    });

    it('rejects a tag v3-staging cannot fast-forward to', () => {
        withOrigin(origin => {
            git(
                origin.origin,
                'update-ref',
                'refs/heads/v3-staging',
                origin.later
            );
            const result = runGuard(origin);
            expect(result.status).toBe(1);
            expect(result.output).toContain(
                'The release source must fast-forward from staging to the tested candidate'
            );
        });
    });

    it('rejects a tag run with the semantic-release mapping', () => {
        withOrigin(origin => {
            expect(
                runGuard(origin, {
                    DEVELOPMENT_BRANCH: 'v3-development',
                    RELEASE_BRANCH: 'v3-release/step1-123',
                }).status
            ).toBe(1);
            expect(runGuard(origin, { RELEASE_MODE: 'other' }).status).toBe(1);
        });
    });
});

// The command V3 Release Please prints when it cuts a release, run through
// every step of Step 1's first job in order, as GitHub runs them. Each step's
// env and if come from the workflow's own expressions, each checkout checks
// out the ref the workflow names, and one step's outputs feed the steps after
// it. A step or an expression this runner cannot read fails the test, so a
// change to the job is read here too.
describe('V3 Step 1 from a release tag: a tag dispatch through the source job', () => {
    const job = workflow.jobs['confirm-staging-branch'];
    const stepNames: string[] = job.steps.map(
        (step: { name: string }) => step.name
    );
    const RELEASE_PLEASE_COMMAND =
        'gh workflow run v3-release-step-1.yml --ref v3.31.0 -f dryRun=false';

    interface ReleaseOrigin {
        root: string;
        origin: string;
        previous: string;
        release: string;
    }

    // main runs v3.30.0 (the last semantic-release release, where v3-staging
    // still is) -> a feature -> the release commit Release Please tagged
    // v3.31.0. Every commit holds a release.config.js, as the repository does.
    const withReleaseOrigin = (test: (origin: ReleaseOrigin) => void) => {
        const root = fs.realpathSync(
            fs.mkdtempSync(path.join(os.tmpdir(), 'mparticle-step1-dispatch-'))
        );
        const origin = path.join(root, 'origin.git');
        const work = path.join(root, 'work');
        const commit = (name: string) => {
            fs.writeFileSync(path.join(work, 'file'), `${name}\n`);
            git(work, 'add', 'file', 'release.config.js');
            git(work, 'commit', '-q', '-m', name);
            return git(work, 'rev-parse', 'HEAD');
        };
        try {
            git(root, 'init', '-q', '--bare', origin);
            git(root, 'init', '-q', work);
            fs.writeFileSync(
                path.join(work, 'release.config.js'),
                "module.exports = { branches: ['main'] };\n"
            );
            const previous = commit('chore(release): 3.30.0');
            git(work, 'tag', 'v3.30.0');
            commit('feat: a change for the next release');
            const release = commit('chore(main): release 3.31.0');
            git(work, 'tag', 'v3.31.0');
            git(work, 'branch', 'v3-staging', previous);
            git(
                work,
                'push',
                '-q',
                origin,
                'main',
                'v3-staging',
                'v3.30.0',
                'v3.31.0'
            );
            test({ root, origin, previous, release });
        } finally {
            fs.rmSync(root, { force: true, recursive: true });
        }
    };

    // What GitHub gives a run of `gh workflow run FILE --ref NAME -f KEY=VALUE`:
    // github.ref is the one branch or tag NAME names on origin, github.sha its
    // commit, and an input the command does not set takes its default.
    const dispatch = (
        origin: ReleaseOrigin,
        command: string,
        variables: Record<string, string>
    ) => {
        const words = command.split(' ');
        expect(words.slice(0, 4)).toEqual([
            'gh',
            'workflow',
            'run',
            'v3-release-step-1.yml',
        ]);
        const inputs: Record<string, string> = {};
        for (const [key, input] of Object.entries(
            workflow.on.workflow_dispatch.inputs
        ) as [string, any][]) {
            inputs[key] = String(input.default);
        }
        let name = '';
        for (let index = 4; index < words.length; index += 2) {
            const [option, value] = words.slice(index, index + 2);
            const key = String(value).split('=')[0];
            if (option === '--ref') {
                name = value;
            } else if (option === '-f' && key in inputs) {
                inputs[key] = value.slice(value.indexOf('=') + 1);
            } else {
                throw new Error(`The dispatch reader takes no ${option} ${value}`);
            }
        }
        const refs = [`refs/heads/${name}`, `refs/tags/${name}`].filter(
            ref => git(origin.root, 'ls-remote', origin.origin, ref) !== ''
        );
        expect(refs).toHaveLength(1);
        const context: Record<string, string> = {
            'github.ref': refs[0],
            'github.sha': git(origin.origin, 'rev-parse', `${refs[0]}^{commit}`),
        };
        for (const [key, value] of Object.entries(inputs)) {
            context[`inputs.${key}`] = value;
            context[`github.event.inputs.${key}`] = value;
        }
        for (const [key, value] of Object.entries(variables)) {
            context[`vars.${key}`] = value;
        }
        return context;
    };

    // A repository variable that is not set reads as an empty string.
    const evaluate = (value: unknown, context: Record<string, string>) => {
        const text = String(value);
        const match = /^\$\{\{\s*([\w.-]+)\s*\}\}$/.exec(text);
        if (match === null && !text.includes('${{')) {
            return text;
        }
        if (match !== null && /^vars\./.test(match[1])) {
            return context[match[1]] || '';
        }
        if (match === null || !(match[1] in context)) {
            throw new Error(`The job runner cannot read ${text}`);
        }
        return context[match[1]];
    };

    const runsStep = (step: any, context: Record<string, string>) => {
        if (step.if === undefined) {
            return true;
        }
        const match = /^\$\{\{\s*([\w.-]+)\s*==\s*'([^']*)'\s*\}\}$/.exec(
            String(step.if)
        );
        if (match === null || !(match[1] in context)) {
            throw new Error(`The job runner cannot read if: ${step.if}`);
        }
        return context[match[1]] === match[2];
    };

    const readOutputs = (file: string) => {
        const values: Record<string, string> = {};
        for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
            if (line === '') {
                continue;
            }
            const equals = line.indexOf('=');
            if (equals < 1) {
                throw new Error(`The job runner cannot read the output ${line}`);
            }
            values[line.slice(0, equals)] = line.slice(equals + 1);
        }
        return values;
    };

    interface JobRun {
        ran: string[];
        failed: string;
        output: string;
        outputs: Record<string, string>;
        summary: string;
    }

    const runJob = (
        origin: ReleaseOrigin,
        context: Record<string, string>
    ): JobRun => {
        const runner = fs.mkdtempSync(path.join(origin.root, 'runner-'));
        const workspace = path.join(runner, 'workspace');
        const summary = path.join(runner, 'summary.md');
        const run: JobRun = {
            ran: [],
            failed: '',
            output: '',
            outputs: {},
            summary: '',
        };
        for (let index = 0; index < job.steps.length; index++) {
            const step = job.steps[index];
            if (!runsStep(step, context)) {
                continue;
            }
            run.ran.push(step.name);
            if (step.uses !== undefined) {
                expect(step.uses).toMatch(/^actions\/checkout@[0-9a-f]{40}$/);
                const ref =
                    step.with && step.with.ref !== undefined
                        ? evaluate(step.with.ref, context)
                        : context['github.ref'];
                if (fs.existsSync(workspace)) {
                    git(workspace, 'fetch', '-q', '--force', '--tags', 'origin');
                } else {
                    git(runner, 'clone', '-q', origin.origin, workspace);
                }
                git(
                    workspace,
                    'checkout',
                    '-q',
                    ref.replace(/^refs\/(?:heads|tags)\//, '')
                );
                continue;
            }
            const output = path.join(runner, `output-${index}`);
            fs.writeFileSync(output, '');
            const env: Record<string, string> = {
                GITHUB_RUN_ID: '4242',
                GITHUB_OUTPUT: output,
                GITHUB_STEP_SUMMARY: summary,
            };
            for (const [key, value] of Object.entries(step.env || {})) {
                env[key] = evaluate(value, context);
            }
            const result = runBash(step.run, workspace, env);
            if (result.status !== 0) {
                run.failed = step.name;
                run.output = result.output;
                break;
            }
            if (step.id !== undefined) {
                for (const [key, value] of Object.entries(readOutputs(output))) {
                    context[`steps.${step.id}.outputs.${key}`] = value;
                }
            }
        }
        if (run.failed === '') {
            for (const [key, value] of Object.entries(job.outputs)) {
                run.outputs[key] = evaluate(value, context);
            }
        }
        if (fs.existsSync(summary)) {
            run.summary = fs.readFileSync(summary, 'utf8');
        }
        return run;
    };

    it('runs the command Release Please prints through every step of the job, in a real run and a dry run', () => {
        withReleaseOrigin(origin => {
            for (const dryRun of ['false', 'true']) {
                const run = runJob(
                    origin,
                    dispatch(
                        origin,
                        RELEASE_PLEASE_COMMAND.replace(
                            'dryRun=false',
                            `dryRun=${dryRun}`
                        ),
                        { V3_RELEASE_PLEASE_ENABLED: 'true' }
                    )
                );
                expect({ failed: run.failed, output: run.output }).toEqual({
                    failed: '',
                    output: '',
                });
                expect(run.ran).toEqual(stepNames);
                expect(run.outputs).toEqual({
                    development_branch: 'main',
                    candidate_sha: origin.release,
                    staging_branch: 'v3-staging',
                    release_branch: '',
                    npm_dist_tag: 'next',
                    release_mode: 'tag',
                    release_tag: 'v3.31.0',
                });
                for (const line of [
                    '- Source ref: `refs/tags/v3.31.0`',
                    '- Release mode: `tag`',
                    `- Dry run: \`${dryRun}\``,
                    '- Release tag: `v3.31.0`',
                    `- Candidate SHA: \`${origin.release}\``,
                    '- Highest reachable stable tag: `v3.30.0`',
                ]) {
                    expect(run.summary).toContain(line);
                }
            }
        });
    });

    it('stops a dispatch from any branch but v3-staging at the source check', () => {
        withReleaseOrigin(origin => {
            const run = runJob(
                origin,
                dispatch(
                    origin,
                    'gh workflow run v3-release-step-1.yml --ref main -f dryRun=true',
                    { V3_RELEASE_PLEASE_ENABLED: 'true' }
                )
            );
            expect(run).toMatchObject({
                ran: ['Checkout workflow source', 'Validate workflow source'],
                failed: 'Validate workflow source',
                output:
                    'Track v3 must dispatch from its staging branch; received refs/heads/main\n',
            });
        });
    });

    it('stops the command Release Please prints at the source check while V3_RELEASE_PLEASE_ENABLED is off', () => {
        withReleaseOrigin(origin => {
            const switchedOff: Record<string, string>[] = [
                {},
                { V3_RELEASE_PLEASE_ENABLED: 'false' },
            ];
            for (const variables of switchedOff) {
                const run = runJob(
                    origin,
                    dispatch(origin, RELEASE_PLEASE_COMMAND, variables)
                );
                expect(run).toMatchObject({
                    ran: ['Checkout workflow source', 'Validate workflow source'],
                    failed: 'Validate workflow source',
                    output:
                        "A Step 1 run from a release tag needs V3_RELEASE_PLEASE_ENABLED set to 'true'\n",
                });
            }
        });
    });
});

describe('V3 Step 1 from a release tag: release jobs', () => {
    const releaseStep = (name: string) => stepNamed('release', name);

    it('runs the semantic-release steps only for a v3-staging dispatch', () => {
        for (const name of [
            'Import GPG Key',
            'Merge frozen candidate into staging preview',
            'Merge release branch into staging branch',
            'Release --dry-run',
            'Preview V3 kit release',
            'Snapshot existing stable release tags',
            'Release',
            'Push automated release commits to release branch',
        ]) {
            expect(releaseStep(name).if).toContain(SEMANTIC_RELEASE_MODE);
        }
        const createBranch = workflow.jobs['create-release-branch'].steps;
        for (const step of createBranch) {
            expect(step.if).toContain(SEMANTIC_RELEASE_MODE);
        }
    });

    const inOrder = (jobName: string, expected: string[]) => {
        const names = workflow.jobs[jobName].steps.map(
            (step: { name?: string }) => step.name
        );
        const order = expected.map(name => names.indexOf(name));
        expect(order.every(index => index >= 0)).toBe(true);
        expect([...order].sort((a, b) => a - b)).toEqual(order);
    };

    it('builds and compares the tag commit in its own job, then publishes it in tag mode', () => {
        const CANDIDATE =
            '${{ needs.confirm-staging-branch.outputs.candidate_sha }}';
        const checkout = releaseStep('Checkout the release tag');
        expect(checkout.if).toContain(TAG_MODE);
        expect(checkout.with.ref).toBe(CANDIDATE);
        expect(
            stepNamed('build-release-tag', 'Checkout the release tag').with.ref
        ).toBe(CANDIDATE);
        expect(
            stepNamed('build-release-tag', 'Build core and kits at the release tag')
                .run
        ).toBe('sh ./scripts/build-v3-release.sh "$RELEASE_VERSION"');
        inOrder('build-release-tag', [
            'Check the release tag\'s version',
            'Install dependencies',
            'Build core and kits at the release tag',
            'Compare the build with the tag\'s bundles',
        ]);
        inOrder('release', [
            'Check the release tag\'s version',
            'Check npm before publishing',
            'Publish core from the release tag',
            'Verify and report release candidate',
        ]);
        const names = workflow.jobs.release.steps.map(
            (step: { name?: string }) => step.name
        );
        expect(names).not.toContain('Build core and kits at the release tag');
        expect(names).not.toContain('Compare the build with the tag\'s bundles');
    });

    it('keeps the machine user token out of the release job in tag mode', () => {
        expect(workflow.jobs.release.env.GITHUB_TOKEN).toBe(
            '${{ ' +
                TAG_MODE +
                ' && github.token || secrets.MP_SEMANTIC_RELEASE_BOT }}'
        );
    });

    it('publishes core for real only from mParticle/mparticle-web-sdk, never in a dry run', () => {
        const publish = releaseStep('Publish core from the release tag');
        expect(publish.run.trim().split('\n').pop()).toBe(
            'node scripts/publish-kits.js --publish-core'
        );
        expect(publish.env).toEqual({
            RELEASE_TAG: '${{ needs.confirm-staging-branch.outputs.release_tag }}',
            CANDIDATE_SHA:
                '${{ needs.confirm-staging-branch.outputs.candidate_sha }}',
        });
        expect(publish.if).toContain(TAG_MODE);
        expect(publish.if).toContain("github.event.inputs.dryRun == 'false'");
        expect(publish.if).toContain(RELEASE_REPOSITORY);
        const pack = releaseStep('Pack core without publishing');
        expect(pack.run).toBe('npm pack --dry-run --json --ignore-scripts');
        expect(pack.if).toContain("github.event.inputs.dryRun == 'true'");
        expect(pack.if).toContain(
            "github.repository != 'mParticle/mparticle-web-sdk'"
        );
        const kits = stepNamed('publish-kits', 'Publish kits concurrently');
        expect(kits.if).toContain(RELEASE_REPOSITORY);
    });

    it('keeps expressions out of the tag mode run scripts', () => {
        for (const [job, name] of [
            ['confirm-staging-branch', 'Validate workflow source'],
            ['confirm-staging-branch', 'Resolve exact branch mapping'],
            ['confirm-staging-branch', 'Validate track mapping and checkout'],
            ['build-release-tag', 'Check the release tag\'s version'],
            ['build-release-tag', 'Compare the build with the tag\'s bundles'],
            ['release', 'Check the release tag\'s version'],
            ['release', 'Check npm before publishing'],
            ['release', 'Publish core from the release tag'],
            ['release', 'Verify and report release candidate'],
            ['advance-staging', 'Fast-forward v3-staging'],
        ]) {
            expect(stepNamed(job, name).run).not.toContain('${{');
        }
    });

    it('fast-forwards v3-staging once core and the kits are on npm and the candidate is packaged, before uploading and staging the candidate', () => {
        const job = workflow.jobs['advance-staging'];
        expect(job.needs).toEqual([
            'confirm-staging-branch',
            'release',
            'package-v3-candidate',
            'publish-kits',
        ]);
        const condition = job.if.replace(/\s+/g, ' ');
        for (const part of [
            TAG_MODE,
            "github.repository == 'mParticle/mparticle-web-sdk'",
            "github.event.inputs.dryRun == 'false'",
            "needs.confirm-staging-branch.result == 'success'",
            "needs.release.result == 'success'",
            "needs.package-v3-candidate.result == 'success'",
            "needs.publish-kits.result == 'success'",
        ]) {
            expect(condition).toContain(part);
        }
        expect(condition).not.toContain('upload-v3-candidate');
        expect(job.permissions).toEqual({ contents: 'read' });
        const script = stepNamed('advance-staging', 'Fast-forward v3-staging')
            .run;
        expect(script).not.toMatch(/--force|\+\$\{?RELEASE_SHA|npm /);
        expect(script).toContain(
            'git push origin "${RELEASE_SHA}:refs/heads/${STAGING_BRANCH}"'
        );
        expect(script).toContain(
            'Wait for Upload and stage V3 candidate to succeed before running Steps 2 and 3 for this tag.'
        );
        expect(script).not.toContain('Steps 2 and 3 can run for this tag.');

        const evaluateAdvanceStagingIf = (overrides: {
            repository?: string;
            dryRun?: string;
            releaseMode?: string;
            confirmResult?: string;
            releaseResult?: string;
            packageResult?: string;
            publishKitsResult?: string;
        } = {}): boolean => {
            const expression = job.if
                .replace(/^\s*\$\{\{|\}\}\s*$/g, '')
                .replace(/\bneeds\.([a-z0-9-]+)\b/g, "needs['$1']");
            const evaluate = new Function(
                'always',
                'cancelled',
                'needs',
                'github',
                `return Boolean(${expression});`
            );
            return evaluate(
                () => true,
                () => false,
                {
                    'confirm-staging-branch': {
                        result: overrides.confirmResult ?? 'success',
                        outputs: {
                            release_mode: overrides.releaseMode ?? 'tag',
                        },
                    },
                    release: {
                        result: overrides.releaseResult ?? 'success',
                    },
                    'package-v3-candidate': {
                        result: overrides.packageResult ?? 'success',
                    },
                    'publish-kits': {
                        result: overrides.publishKitsResult ?? 'success',
                    },
                },
                {
                    repository:
                        overrides.repository ?? 'mParticle/mparticle-web-sdk',
                    event: {
                        inputs: { dryRun: overrides.dryRun ?? 'false' },
                    },
                }
            );
        };
        expect(evaluateAdvanceStagingIf()).toBe(true);
        expect(
            evaluateAdvanceStagingIf({
                repository: 'mParticle/web-sdk-release-testing',
            })
        ).toBe(false);
        expect(evaluateAdvanceStagingIf({ confirmResult: 'failure' })).toBe(
            false
        );
        expect(evaluateAdvanceStagingIf({ confirmResult: 'skipped' })).toBe(
            false
        );
        expect(evaluateAdvanceStagingIf({ releaseResult: 'failure' })).toBe(
            false
        );
        expect(evaluateAdvanceStagingIf({ releaseResult: 'skipped' })).toBe(
            false
        );
        expect(evaluateAdvanceStagingIf({ packageResult: 'failure' })).toBe(
            false
        );
        expect(evaluateAdvanceStagingIf({ packageResult: 'skipped' })).toBe(
            false
        );
        expect(evaluateAdvanceStagingIf({ publishKitsResult: 'failure' })).toBe(
            false
        );
        expect(evaluateAdvanceStagingIf({ publishKitsResult: 'skipped' })).toBe(
            false
        );
        expect(
            evaluateAdvanceStagingIf({ releaseMode: 'semantic-release' })
        ).toBe(false);
        expect(evaluateAdvanceStagingIf({ dryRun: 'true' })).toBe(false);

        const upload = workflow.jobs['upload-v3-candidate'];
        expect(upload.needs).toEqual([
            'confirm-staging-branch',
            'release',
            'package-v3-candidate',
            'publish-kits',
            'advance-staging',
        ]);
        expect(upload.if.replace(/\s+/g, ' ')).toContain(
            "( needs.confirm-staging-branch.outputs.release_mode != 'tag' || needs.advance-staging.result == 'success' )"
        );

        const evaluateUploadIf = (
            releaseMode: string,
            advanceStagingResult: string,
            repository = 'mParticle/mparticle-web-sdk'
        ): boolean => {
            const expression = upload.if
                .replace(/^\s*\$\{\{|\}\}\s*$/g, '')
                .replace(/\bneeds\.([a-z0-9-]+)\b/g, "needs['$1']");
            const evaluate = new Function(
                'always',
                'cancelled',
                'needs',
                'github',
                `return Boolean(${expression});`
            );
            return evaluate(
                () => true,
                () => false,
                {
                    'confirm-staging-branch': {
                        result: 'success',
                        outputs: { release_mode: releaseMode },
                    },
                    release: {
                        result: 'success',
                        outputs: { release_tag: 'v3.32.0' },
                    },
                    'package-v3-candidate': { result: 'success' },
                    'publish-kits': { result: 'success' },
                    'advance-staging': { result: advanceStagingResult },
                },
                {
                    repository,
                    event: { inputs: { dryRun: 'false' } },
                }
            );
        };
        expect(evaluateUploadIf('tag', 'success')).toBe(true);
        expect(evaluateUploadIf('tag', 'failure')).toBe(false);
        expect(evaluateUploadIf('tag', 'skipped')).toBe(false);
        expect(evaluateUploadIf('semantic-release', 'skipped')).toBe(true);
        expect(
            evaluateUploadIf(
                'tag',
                'success',
                'mParticle/web-sdk-release-testing'
            )
        ).toBe(false);
    });

    it('gates release publishing jobs behind create-release-branch after the build, bundle check and tests pass with no Environment', () => {
        const gateJob = workflow.jobs['create-release-branch'];
        expect(gateJob.environment).toBeUndefined();
        expect(gateJob.needs).toEqual([
            'build-bundle',
            'build-release-tag',
            'test-jest',
            'test-core',
            'test-stub',
            'test-integrations-common-js-browserfy',
            'test-integrations-common-js-webpack',
            'test-integrations-common-js-rollup',
            'test-integrations-module-js-webpack',
            'test-integrations-module-js-rollup',
            'test-integrations-require-js',
            'load-kit-matrix',
            'run-kit-tests',
            'confirm-staging-branch',
        ]);
        const gateCondition = gateJob.if.replace(/\s+/g, ' ');
        for (const part of [
            "needs.confirm-staging-branch.result == 'success'",
            "needs.build-bundle.result == 'success'",
            "( needs.confirm-staging-branch.outputs.release_mode != 'tag' || needs.build-release-tag.result == 'success' )",
            "needs.test-jest.result == 'success'",
            "needs.test-core.result == 'success'",
            "needs.test-stub.result == 'success'",
            "needs.load-kit-matrix.result == 'success'",
            "needs.run-kit-tests.result == 'success'",
        ]) {
            expect(gateCondition).toContain(part);
        }

        const jobsWithEnvironment = Object.entries(workflow.jobs)
            .filter(([, job]: [string, any]) => job.environment !== undefined)
            .map(([name]) => name);
        expect(jobsWithEnvironment).toEqual([]);

        expect(workflow.jobs.release.needs).toContain('create-release-branch');
        expect(workflow.jobs.release.if.replace(/\s+/g, ' ')).toContain(
            "needs.create-release-branch.result == 'success'"
        );
        for (const downstream of [
            'publish-kits',
            'advance-staging',
            'package-v3-candidate',
            'upload-v3-candidate',
        ]) {
            const needs = workflow.jobs[downstream].needs;
            expect(Array.isArray(needs) ? needs : [needs]).toContain('release');
        }
    });
});

// npm ci and npm install run the lifecycle scripts of every dependency, so
// they run only where no credential is: no secret, no id-token and no write
// scope on GITHUB_TOKEN. A tag run installs and builds in Build and check the
// release tag; the jobs that sign, push or publish install nothing. The
// semantic-release run from v3-staging builds inside semantic-release in
// Perform Release, so it still installs there, with no install scripts.
// npm publish runs the package's own lifecycle scripts, so a job that holds a
// credential and publishes sets npm_config_ignore_scripts to 'true' (Perform
// Release and Publish V3 kits), or its npm publish passes --ignore-scripts.
describe('V3 Step 1: no dependency install or lifecycle script with a credential', () => {
    const INSTALL =
        /\b(?:npm|pnpm)\s+(?:ci|install|i|add)\b|\byarn(?:\s+(?:install|add))?\b/;
    const INSTALLING_SCRIPT = /scripts\/(?:build-v3-release|release)\.sh/;
    const holdsCredential = (job: any) =>
        JSON.stringify(job).includes('secrets.') ||
        Object.values(job.permissions || {}).includes('write');
    const credentialedJobs = Object.entries(workflow.jobs).filter(([, job]) =>
        holdsCredential(job)
    ) as [string, any][];
    const installSteps = (job: any) =>
        (job.steps || []).filter(
            (step: { run?: string }) =>
                typeof step.run === 'string' &&
                (INSTALL.test(step.run) || INSTALLING_SCRIPT.test(step.run))
        );

    it('reads an install in a run script, and nothing else, as an install', () => {
        for (const run of [
            'npm ci',
            'npm ci --ignore-scripts',
            'npm install',
            'npm i -g semantic-release',
            'set -eu\nnpm install --prefix kits/rokt',
            'yarn install',
            'pnpm i',
        ]) {
            expect(INSTALL.test(run)).toBe(true);
        }
        for (const run of [
            'npm pack --dry-run --json --ignore-scripts',
            'npm --version',
            'npm config get tag',
            'node scripts/publish-kits.js --publish-core',
            'npx semantic-release --branches "$STAGING_BRANCH"',
        ]) {
            expect(INSTALL.test(run)).toBe(false);
        }
        expect(
            INSTALLING_SCRIPT.test('sh ./scripts/build-v3-release.sh "$V"')
        ).toBe(true);
    });

    it('finds the jobs that sign, push or publish', () => {
        expect(credentialedJobs.map(([name]) => name).sort()).toEqual(
            [
                'advance-staging',
                'create-release-branch',
                'publish-kits',
                'release',
                'upload-v3-candidate',
            ].sort()
        );
    });

    it('installs and builds a tag release in a job with no secret, no id-token and no stored token', () => {
        const job = workflow.jobs['build-release-tag'];
        expect(job.if).toBe('${{ ' + TAG_MODE + ' }}');
        expect(job.permissions).toEqual({ contents: 'read' });
        expect(JSON.stringify(job)).not.toMatch(
            /secrets\.|github\.token|id-token/
        );
        expect(job.env).toBeUndefined();
        expect(
            stepNamed('build-release-tag', 'Checkout the release tag').with[
                'persist-credentials'
            ]
        ).toBe(false);
        expect(stepNamed('build-release-tag', 'Install dependencies').run).toBe(
            'npm ci --ignore-scripts'
        );
        expect(
            stepNamed('build-release-tag', 'Build core and kits at the release tag')
                .env
        ).toEqual({ npm_config_ignore_scripts: 'true' });
    });

    it('runs no npm ci or npm install in a credentialed job in a tag run', () => {
        for (const [name, job] of credentialedJobs) {
            const reachable = installSteps(job).filter(
                (step: { if?: string }) =>
                    !String(step.if || '').includes(SEMANTIC_RELEASE_MODE)
            );
            expect({ job: name, steps: reachable }).toEqual({
                job: name,
                steps: [],
            });
        }
    });

    it('installs in a credentialed job only for a semantic-release run, without install scripts', () => {
        const installs = credentialedJobs.flatMap(([name, job]) =>
            installSteps(job).map((step: { name?: string }) => [name, step.name])
        );
        expect(installs).toEqual([['release', 'Install dependencies']]);
        const install = stepNamed('release', 'Install dependencies');
        expect(install.if).toBe('${{ ' + SEMANTIC_RELEASE_MODE + ' }}');
        expect(install.run).toBe('npm ci --ignore-scripts');
        expect(workflow.jobs.release.env.npm_config_ignore_scripts).toBe('true');
    });

    // A publish is npm publish itself, a run of scripts/publish-kits.js (npm
    // publish for core and the kits; a kit recovery runs an older tag's copy,
    // which can ignore its flags) or semantic-release (its publishCmd is npm
    // publish). Shell comment lines are not commands.
    const PUBLISH =
        /\bnpm\s+publish\b|scripts\/publish-kits\.js|\bnpx\s+semantic-release\b/;
    const IGNORE_SCRIPTS_FLAG = /\bnpm\s+publish\b.*\s--ignore-scripts\b/;
    const publishLines = (step: any) =>
        typeof step.run === 'string'
            ? step.run
                  .split('\n')
                  .filter(
                      (line: string) => !/^\s*#/.test(line) && PUBLISH.test(line)
                  )
            : [];
    // The step's env wins over the job's, and the job's over the workflow's.
    const ignoresScripts = (wf: any, job: any, step: any) => {
        const setting = [step.env, job.env, wf.env]
            .map(env => (env || {}).npm_config_ignore_scripts)
            .find(value => value !== undefined);
        return (
            String(setting) === 'true' ||
            publishLines(step).every((line: string) =>
                IGNORE_SCRIPTS_FLAG.test(line)
            )
        );
    };
    const credentialedPublishes = (wf: any) =>
        (Object.entries(wf.jobs) as [string, any][])
            .filter(([, job]) => holdsCredential(job))
            .flatMap(([name, job]) =>
                (job.steps || [])
                    .filter((step: any) => publishLines(step).length > 0)
                    .map((step: any) => ({
                        job: name,
                        step: step.name,
                        ignoresScripts: ignoresScripts(wf, job, step),
                    }))
            );
    const publishesWithScripts = (wf: any) =>
        credentialedPublishes(wf)
            .filter(publish => !publish.ignoresScripts)
            .map(publish => [publish.job, publish.step]);

    it('reads npm publish, publish-kits.js and semantic-release in a run script as a publish', () => {
        for (const run of [
            'npm publish ./core.tgz --provenance',
            'node scripts/publish-kits.js',
            'node scripts/publish-kits.js --publish-core',
            'npx semantic-release --branches "$STAGING_BRANCH"',
        ]) {
            expect(publishLines({ run })).toEqual([run]);
        }
        for (const run of [
            'npm pack --dry-run --json --ignore-scripts',
            'npm config get tag',
            '# npm publish runs in the next step',
            'echo "Kits publish to npm only from mParticle/mparticle-web-sdk"',
            'case "$RELEASE_MODE" in semantic-release) ;; esac',
        ]) {
            expect(publishLines({ run })).toEqual([]);
        }
    });

    it('finds every step of a credentialed job that publishes', () => {
        expect(
            credentialedPublishes(workflow).map(publish => [
                publish.job,
                publish.step,
            ])
        ).toEqual([
            ['release', 'Check npm before publishing'],
            ['release', 'Publish core from the release tag'],
            ['release', 'Release --dry-run'],
            ['release', 'Release'],
            ['publish-kits', 'Publish kits concurrently'],
        ]);
    });

    it('publishes from a credentialed job only with lifecycle scripts off', () => {
        expect(publishesWithScripts(workflow)).toEqual([]);
        expect(
            workflow.jobs['publish-kits'].env.npm_config_ignore_scripts
        ).toBe('true');
    });

    it('fails a credentialed publish that leaves lifecycle scripts on', () => {
        const withoutSetting = JSON.parse(JSON.stringify(workflow));
        delete withoutSetting.jobs['publish-kits'].env.npm_config_ignore_scripts;
        expect(publishesWithScripts(withoutSetting)).toEqual([
            ['publish-kits', 'Publish kits concurrently'],
        ]);

        const stepTurnsScriptsOn = JSON.parse(JSON.stringify(workflow));
        stepTurnsScriptsOn.jobs.release.steps.find(
            (step: { name?: string }) => step.name === 'Release'
        ).env.npm_config_ignore_scripts = 'false';
        expect(publishesWithScripts(stepTurnsScriptsOn)).toEqual([
            ['release', 'Release'],
        ]);

        const publishJob = (run: string) => ({
            jobs: {
                publish: {
                    permissions: { contents: 'read', 'id-token': 'write' },
                    steps: [{ name: 'Publish', run }],
                },
            },
        });
        expect(
            publishesWithScripts(publishJob('npm publish ./core.tgz --provenance'))
        ).toEqual([['publish', 'Publish']]);
        expect(
            publishesWithScripts(
                publishJob('npm publish ./core.tgz --provenance --ignore-scripts')
            )
        ).toEqual([]);
    });

    it('publishes a tag release only once the build check has passed', () => {
        const release = workflow.jobs.release;
        expect(release.needs).toContain('build-release-tag');
        expect(release.if.replace(/\s+/g, ' ')).toContain(
            "( needs.confirm-staging-branch.outputs.release_mode != 'tag' || needs.build-release-tag.result == 'success' )"
        );
        expect(workflow.jobs['publish-kits'].needs).toContain('release');
    });
});

describe('V3 Step 1 from a release tag: bundle comparison', () => {
    const compare = stepNamed(
        'build-release-tag',
        'Compare the build with the tag\'s bundles'
    );

    const withBundles = (test: (work: string) => void) => {
        const work = fs.realpathSync(
            fs.mkdtempSync(path.join(os.tmpdir(), 'mparticle-step1-bundles-'))
        );
        try {
            git(work, 'init', '-q');
            fs.mkdirSync(path.join(work, 'dist'));
            fs.mkdirSync(path.join(work, 'kits/example/dist'), {
                recursive: true,
            });
            fs.writeFileSync(path.join(work, 'dist/core.js'), 'core\n');
            fs.writeFileSync(
                path.join(work, 'kits/example/dist/kit.js'),
                'kit\n'
            );
            fs.writeFileSync(path.join(work, '.gitignore'), 'dist/\n');
            git(work, 'add', '-f', '.gitignore', 'dist', 'kits');
            git(work, 'commit', '-q', '-m', 'release');
            test(work);
        } finally {
            fs.rmSync(work, { force: true, recursive: true });
        }
    };
    const run = (work: string) =>
        runBash(compare.run, work, {
            RELEASE_VERSION: '3.29.2',
            RELEASE_TAG: 'v3.29.2',
        });

    it('passes when the build equals the committed bundles', () => {
        withBundles(work => {
            fs.mkdirSync(path.join(work, 'kits/example/node_modules/dep/dist'), {
                recursive: true,
            });
            fs.writeFileSync(
                path.join(work, 'kits/example/node_modules/dep/dist/dep.js'),
                'dependency\n'
            );
            expect(run(work)).toEqual({
                status: 0,
                output:
                    'dist/ and kits/**/dist at v3.29.2 match a build at 3.29.2.\n',
            });
        });
    });

    it('fails on a changed or a new bundle file', () => {
        withBundles(work => {
            fs.writeFileSync(path.join(work, 'dist/core.js'), 'changed\n');
            const changed = run(work);
            expect(changed.status).toBe(1);
            expect(changed.output).toContain('dist/core.js');
        });
        withBundles(work => {
            fs.writeFileSync(
                path.join(work, 'kits/example/dist/new.js'),
                'new\n'
            );
            const added = run(work);
            expect(added.status).toBe(1);
            expect(added.output).toContain('kits/example/dist/new.js');
        });
    });
});

describe('V3 Step 1 from a release tag: core publish', () => {
    const publish = stepNamed('release', 'Publish core from the release tag');

    // A stand-in node records its arguments instead of publishing.
    const run = (origin: Origin, checkout: string, candidate: string) => {
        const bin = fs.mkdtempSync(path.join(origin.root, 'bin-'));
        const calls = path.join(bin, 'calls');
        fs.writeFileSync(
            path.join(bin, 'node'),
            `#!/bin/sh\nprintf '%s\\n' "$*" >> '${calls}'\n`,
            { mode: 0o755 }
        );
        const result = runBash(publish.run, checkout, {
            PATH: `${bin}:${process.env.PATH}`,
            RELEASE_TAG: 'v3.29.1',
            CANDIDATE_SHA: candidate,
        });
        return {
            ...result,
            calls: fs.existsSync(calls) ? fs.readFileSync(calls, 'utf8') : '',
        };
    };

    it('publishes core when the tag on origin still names the checked-out candidate', () => {
        withOrigin(origin => {
            const checkout = clone(origin, 'checkout', 'v3.29.1');
            const result = run(origin, checkout, origin.release);
            expect(result.status).toBe(0);
            expect(result.calls).toBe('scripts/publish-kits.js --publish-core\n');
        });
    });

    it('publishes nothing when the tag moved or is gone after the checkout', () => {
        withOrigin(origin => {
            const checkout = clone(origin, 'checkout', 'v3.29.1');
            git(origin.origin, 'update-ref', 'refs/tags/v3.29.1', origin.later);
            const moved = run(origin, checkout, origin.release);
            expect(moved.status).toBe(1);
            expect(moved.output).toContain(
                `v3.29.1 on origin (${origin.later}) or this checkout is not the candidate ${origin.release}; core was not published`
            );
            expect(moved.calls).toBe('');

            git(origin.origin, 'update-ref', '-d', 'refs/tags/v3.29.1');
            const gone = run(origin, checkout, origin.release);
            expect(gone.status).toBe(1);
            expect(gone.output).toContain(
                'v3.29.1 is no longer on origin; core was not published'
            );
            expect(gone.calls).toBe('');
        });
    });

    it('publishes nothing when the checkout is not the candidate', () => {
        withOrigin(origin => {
            const checkout = clone(origin, 'checkout', 'main');
            const result = run(origin, checkout, origin.release);
            expect(result.status).toBe(1);
            expect(result.output).toContain('core was not published');
            expect(result.calls).toBe('');
        });
    });
});

describe('V3 Step 1 from a release tag: v3-staging fast-forward', () => {
    const fastForward = stepNamed('advance-staging', 'Fast-forward v3-staging');
    const run = (origin: Origin, checkout: string, releaseSha: string) =>
        runBash(fastForward.run, checkout, {
            STAGING_BRANCH: 'v3-staging',
            RELEASE_TAG: 'v3.29.1',
            RELEASE_SHA: releaseSha,
            GITHUB_STEP_SUMMARY: path.join(origin.root, 'summary.md'),
        });

    it('moves v3-staging forward to the tag commit, once', () => {
        withOrigin(origin => {
            const checkout = clone(origin, 'checkout', 'v3-staging');
            expect(run(origin, checkout, origin.release).status).toBe(0);
            expect(lsRemote(origin, 'refs/heads/v3-staging')).toBe(
                origin.release
            );
            expect(
                fs.readFileSync(path.join(origin.root, 'summary.md'), 'utf8')
            ).toContain(
                'Wait for Upload and stage V3 candidate to succeed before running Steps 2 and 3 for this tag.'
            );
            const again = run(origin, checkout, origin.release);
            expect(again.status).toBe(0);
            expect(again.output).toContain(
                'origin/v3-staging is already at v3.29.1.'
            );
        });
    });

    it('never moves v3-staging off its line or to another commit', () => {
        withOrigin(origin => {
            const checkout = clone(origin, 'checkout', 'v3-staging');
            git(
                origin.origin,
                'update-ref',
                'refs/heads/v3-staging',
                origin.offMain
            );
            const diverged = run(origin, checkout, origin.release);
            expect(diverged.status).toBe(1);
            expect(diverged.output).toContain(
                `origin/v3-staging at ${origin.offMain} is not an ancestor of v3.29.1`
            );
            expect(lsRemote(origin, 'refs/heads/v3-staging')).toBe(
                origin.offMain
            );

            const moved = run(origin, checkout, origin.staging);
            expect(moved.status).toBe(1);
            expect(moved.output).toContain(
                `Remote tag v3.29.1 does not resolve to ${origin.staging}`
            );
        });
    });
});

describe('publishCore', () => {
    const manifest = { name: '@mparticle/web-sdk', version: '3.29.2' };
    const artifact = { integrity: 'sha512-local', tarballPath: '/core.tgz' };
    const options = (overrides: Record<string, unknown> = {}) => ({
        coreManifest: manifest,
        validatePackageContents: () => undefined,
        packPackage: () => artifact,
        waitForPublishedCore: jest.fn(),
        ...overrides,
    });

    it('refuses a tag whose package.json holds another version', async () => {
        await expect(
            publishCore('3.29.3', 'next', options())
        ).rejects.toThrow('Core SDK is 3.29.2, expected 3.29.3');
    });

    it('publishes the packed tarball with the dist-tag', async () => {
        const publishTarball = jest.fn(() => Promise.resolve('published'));
        await expect(
            publishCore('3.29.2', 'next', options({ publishTarball }))
        ).resolves.toEqual({ name: manifest.name, result: 'published' });
        expect(publishTarball).toHaveBeenCalledWith(
            { name: manifest.name, ...artifact },
            '3.29.2',
            'next'
        );
    });

    it('counts a version npm holds with the same integrity as done', async () => {
        await expect(
            publishCore(
                '3.29.2',
                'next',
                options({ publishTarball: () => 'skipped' })
            )
        ).resolves.toEqual({
            name: manifest.name,
            result: 'already on npm with the same integrity',
        });
    });

    it('fails when npm holds the version with other bytes', async () => {
        const mismatch = new Error(
            '@mparticle/web-sdk@3.29.2 already exists with integrity sha512-other; local artifact is sha512-local'
        );
        const waitForPublishedCore = jest.fn();
        await expect(
            publishCore(
                '3.29.2',
                'next',
                options({
                    publishTarball: () => {
                        throw mismatch;
                    },
                    waitForPublishedCore,
                })
            )
        ).rejects.toBe(mismatch);
        expect(waitForPublishedCore).not.toHaveBeenCalled();
    });

    it('reads npm after a publish npm reported as failed', async () => {
        const ambiguous = Object.assign(new Error('npm publish failed'), {
            code: 'PUBLISH_AMBIGUOUS',
        });
        const waitForPublishedCore = jest.fn();
        await expect(
            publishCore(
                '3.29.2',
                'next',
                options({
                    publishTarball: () => Promise.reject(ambiguous),
                    waitForPublishedCore,
                })
            )
        ).resolves.toEqual({
            name: manifest.name,
            result: 'published after npm reported an error',
        });
        expect(waitForPublishedCore).toHaveBeenCalledWith(
            { name: manifest.name, ...artifact },
            '3.29.2',
            'next'
        );
    });
});

// A first dispatch from the release tag published core and some kits, then
// stopped: npm has core and those kits on next at the tag's version, and the
// other kits still on the version before it. A second dispatch from the same
// tag runs the release job's npm check and core publish, then Publish V3
// kits, with npm stood in for at the child process.
describe('V3 Step 1 from a release tag: a second dispatch after a partial kit publish', () => {
    // Release Please versions core and every kit together.
    const { name: CORE, version } = require('../../package.json');
    const [major, minor, patch] = version.split('.').map(Number);
    const earlier =
        patch > 0 ? `${major}.${minor}.${patch - 1}` : `${major}.${minor - 1}.0`;
    const newer = `${major}.${minor + 1}.0`;
    const kits: string[] = loadReleaseInventory().publishEntries.map(
        (entry: { name: string }) => entry.name
    );
    const kitsOnNpm = kits.slice(0, 12);
    const missingKits = kits.slice(12);
    const integrityOf = (name: string) => `sha512-${name}@${version}`;

    // npm as the first run left it. The scripts' npm view, npm pack and
    // npm publish read it and add to it.
    const partialNpm = () => {
        const distTags: Record<string, string> = { [CORE]: version };
        const integrities: Record<string, string> = {
            [`${CORE}@${version}`]: integrityOf(CORE),
        };
        for (const kit of kitsOnNpm) {
            distTags[kit] = version;
            integrities[`${kit}@${version}`] = integrityOf(kit);
        }
        for (const kit of missingKits) {
            distTags[kit] = earlier;
        }
        const tarballs = new Map<string, string>();
        const published: string[] = [];
        const childProcess = {
            // npm view SPEC FIELD --json ...
            spawnSync: jest.fn((command: string, [, spec, field]: string[]) => {
                const value =
                    field === 'dist.integrity'
                        ? integrities[spec]
                        : distTags[spec];
                return value
                    ? { status: 0, stdout: `${JSON.stringify(value)}\n`, stderr: '' }
                    : { status: 1, stdout: '', stderr: 'npm error code E404' };
            }),
            // npm pack DIRECTORY --json --ignore-scripts --pack-destination DIR
            execFileSync: jest.fn((command: string, [, directory]: string[]) => {
                const { name } = JSON.parse(
                    fs.readFileSync(path.join(directory, 'package.json'), 'utf8')
                );
                const filename = `${name.replace(/[@/]/g, '-')}.tgz`;
                tarballs.set(filename, name);
                return JSON.stringify([
                    { filename, integrity: integrityOf(name) },
                ]);
            }),
            // npm publish TARBALL --provenance --access public --tag next ...
            spawn: jest.fn((command: string, args: string[]) => {
                const name = tarballs.get(path.basename(args[1]));
                published.push(name);
                integrities[`${name}@${version}`] = integrityOf(name);
                if (args[args.indexOf('--tag') + 1] === 'next') {
                    distTags[name] = version;
                }
                const { EventEmitter } = require('events');
                const child = new EventEmitter();
                child.stdout = new EventEmitter();
                child.stderr = new EventEmitter();
                child.stdout.setEncoding = () => undefined;
                child.stderr.setEncoding = () => undefined;
                setTimeout(() => child.emit('close', 0, null), 0);
                return child;
            }),
        };
        return { distTags, published, childProcess };
    };

    // Loads the scripts against that npm, with the publish-kits job's
    // environment for a tag dispatch.
    const withScripts = async (
        npm: ReturnType<typeof partialNpm>,
        test: (scripts: any, summary: string) => Promise<void> | void
    ) => {
        const root = fs.mkdtempSync(
            path.join(os.tmpdir(), 'mparticle-step1-recovery-')
        );
        const env: Record<string, string> = {
            RELEASE_VERSION: version,
            NPM_DIST_TAG: 'next',
            KIT_RELEASE_RECOVERY: 'false',
            GITHUB_STEP_SUMMARY: path.join(root, 'summary.md'),
        };
        const saved = Object.keys(env).map(key => [key, process.env[key]]);
        const log = jest
            .spyOn(console, 'log')
            .mockImplementation(() => undefined);
        const write = jest
            .spyOn(process.stdout, 'write')
            .mockImplementation(() => true);
        try {
            Object.assign(process.env, env);
            let scripts: any;
            jest.isolateModules(() => {
                jest.doMock('node:child_process', () => ({
                    ...jest.requireActual('node:child_process'),
                    ...npm.childProcess,
                }));
                scripts = require('../../scripts/publish-kits');
            });
            await test(scripts, env.GITHUB_STEP_SUMMARY);
        } finally {
            for (const [key, value] of saved) {
                if (value === undefined) {
                    delete process.env[key];
                } else {
                    process.env[key] = value;
                }
            }
            log.mockRestore();
            write.mockRestore();
            jest.dontMock('node:child_process');
            fs.rmSync(root, { force: true, recursive: true });
        }
    };

    it('passes the npm check, leaves core as it is and publishes only the kits npm lacks', async () => {
        const npm = partialNpm();
        await withScripts(npm, async (scripts, summary) => {
            // Check npm before publishing. Before the fix, the first call
            // threw "Current V3 release ... is incomplete on npm".
            scripts.preflightReleaseDistTags(version, 'next', 'v3');
            scripts.preflightKitArtifacts(version, 'next');

            // Publish core from the release tag
            await expect(scripts.publishCore(version, 'next')).resolves.toEqual(
                {
                    name: CORE,
                    result: 'already on npm with the same integrity',
                }
            );
            expect(npm.published).toEqual([]);

            // Publish V3 kits
            await scripts.main();
            expect([...npm.published].sort()).toEqual([...missingKits].sort());
            for (const name of [CORE, ...kits]) {
                expect(npm.distTags[name]).toBe(version);
            }
            const table = fs.readFileSync(summary, 'utf8');
            expect(table).toContain(`| \`${CORE}\` | verified |`);
            for (const kit of kitsOnNpm) {
                expect(table).toContain(`| \`${kit}\` | skipped (identical) |`);
            }
            for (const kit of missingKits) {
                expect(table).toContain(`| \`${kit}\` | published |`);
            }
        });
    });

    it('still refuses to start a newer release on the same npm', async () => {
        const npm = partialNpm();
        await withScripts(npm, scripts => {
            expect(() =>
                scripts.preflightReleaseDistTags(newer, 'next', 'v3')
            ).toThrow(
                `Current V3 release ${version} is incomplete on npm; recover it before starting a newer release`
            );
        });
        expect(npm.published).toEqual([]);
        expect(npm.childProcess.spawn).not.toHaveBeenCalled();
    });

    it('recovers only when the kits not on the version are all on one earlier version', () => {
        const coreOn3310 = (kitVersion: (index: number) => string | null) => (
            packageName: string
        ) =>
            packageName === CORE
                ? '3.31.0'
                : kitVersion(kits.indexOf(packageName));
        const log = jest
            .spyOn(console, 'log')
            .mockImplementation(() => undefined);
        try {
            // The review's reproduction: core on 3.31.0, every kit on 3.30.0.
            expect(
                verifyCurrentReleaseComplete(
                    CORE,
                    'next',
                    coreOn3310(() => '3.30.0'),
                    '3.31.0'
                )
            ).toBe('3.31.0');
            expect(
                verifyCurrentReleaseComplete(
                    CORE,
                    'next',
                    coreOn3310(index => (index < 12 ? '3.31.0' : '3.30.0')),
                    '3.31.0'
                )
            ).toBe('3.31.0');

            for (const kitVersion of [
                // Two earlier versions
                (index: number) => (index === 0 ? '3.29.0' : '3.30.0'),
                // A kit with no next
                (index: number) => (index === 0 ? null : '3.31.0'),
                // A kit ahead of core
                (index: number) => (index === 0 ? '3.32.0' : '3.31.0'),
            ]) {
                expect(() =>
                    verifyCurrentReleaseComplete(
                        CORE,
                        'next',
                        coreOn3310(kitVersion),
                        '3.31.0'
                    )
                ).toThrow('Cannot recover V3 release 3.31.0 on npm');
            }

            expect(() =>
                verifyCurrentReleaseComplete(
                    CORE,
                    'next',
                    coreOn3310(() => '3.30.0'),
                    '3.32.0'
                )
            ).toThrow(
                'Current V3 release 3.31.0 is incomplete on npm; recover it before starting a newer release'
            );
        } finally {
            log.mockRestore();
        }
    });
});
