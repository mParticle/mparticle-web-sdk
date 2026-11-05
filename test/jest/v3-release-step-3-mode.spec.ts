import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const yaml = require('js-yaml');
const trigger = require('../../scripts/v3-release/shadow-release-trigger.ts');

const PROMOTE = yaml.load(
    fs.readFileSync(
        path.join(__dirname, '../../.github/workflows/v3-shadow-promote.yml'),
        'utf8'
    )
);
const WORKFLOW = yaml.load(
    fs.readFileSync(
        path.join(__dirname, '../../.github/workflows/v3-release-step-3.yml'),
        'utf8'
    )
);
const JOB = WORKFLOW.jobs['synchronize-branches'];
const STEPS: any[] = JOB.steps;
const RELEASE_TOKEN_ON_REAL_RUNS =
    "${{ github.event.inputs.dryRun == 'false' && secrets.MP_SEMANTIC_RELEASE_BOT || github.token }}";

const RELEASE_TAG = 'v3.30.0';
const RELEASE_ORDER_BRANCHES = [
    'v3-release-order-a',
    'v3-release-order-b',
    'v3-release-order-c',
];
const ALL_BRANCHES = [
    'v3-development',
    'main',
    'v3-staging',
    ...RELEASE_ORDER_BRANCHES,
];

const GIT_ENV = {
    GIT_AUTHOR_NAME: 'Release Test',
    GIT_AUTHOR_EMAIL: 'release-test@example.com',
    GIT_COMMITTER_NAME: 'Release Test',
    GIT_COMMITTER_EMAIL: 'release-test@example.com',
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
};

function script(stepName: string): string {
    const step = STEPS.find(candidate => candidate.name === stepName);
    expect(step).toBeDefined();
    return step.run;
}

function run(
    command: string,
    args: string[],
    cwd: string,
    env: Record<string, string> = {}
) {
    const result = spawnSync(command, args, {
        cwd,
        encoding: 'utf8',
        env: { ...process.env, ...GIT_ENV, ...env },
    });
    return {
        status: result.status,
        output: `${result.stdout}${result.stderr}`,
        stdout: result.stdout,
    };
}

function git(cwd: string, ...args: string[]): string {
    const result = run('git', ['-c', 'commit.gpgsign=false', ...args], cwd);
    if (result.status !== 0) {
        throw new Error(`git ${args.join(' ')} failed: ${result.output}`);
    }
    return result.stdout.trim();
}

function commit(cwd: string, version: string): string {
    fs.writeFileSync(
        path.join(cwd, 'package.json'),
        `${JSON.stringify({ name: 'release-test', version })}\n`
    );
    git(cwd, 'add', 'package.json');
    git(cwd, 'commit', '-q', '-m', `release ${version}`);
    return git(cwd, 'rev-parse', 'HEAD');
}

// An origin where every destination sits on 3.29.0, and v3.30.0 is tagged on
// the next commit with v3-staging at it, as Step 1 leaves them. When
// tagOnMain is true, main already holds the tag, as Release Please leaves it.
// When annotated is true, the tag is an annotated tag object, so ls-remote
// lists both the tag object and its peeled commit (the ^{} line).
function setUp(tagOnMain: boolean, annotated = false) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'v3-step-3-mode-'));
    const origin = path.join(root, 'origin.git');
    const seed = path.join(root, 'seed');
    const checkout = path.join(root, 'checkout');
    git(root, 'init', '-q', '--bare', origin);
    git(root, 'init', '-q', seed);
    const base = commit(seed, '3.29.0');
    const release = commit(seed, '3.30.0');
    if (annotated) {
        git(seed, 'tag', '-a', '-m', `Release ${RELEASE_TAG}`, RELEASE_TAG, release);
    } else {
        git(seed, 'tag', RELEASE_TAG, release);
    }
    git(seed, 'remote', 'add', 'origin', origin);
    for (const branch of ALL_BRANCHES) {
        git(seed, 'push', '-q', 'origin', `${base}:refs/heads/${branch}`);
    }
    git(seed, 'push', '-q', '-f', 'origin', `${release}:refs/heads/v3-staging`);
    if (tagOnMain) {
        git(seed, 'push', '-q', '-f', 'origin', `${release}:refs/heads/main`);
    }
    git(seed, 'push', '-q', 'origin', `refs/tags/${RELEASE_TAG}`);
    git(root, 'clone', '-q', origin, checkout);
    return { root, origin, seed, checkout, base, release };
}

function heads(origin: string): Record<string, string> {
    const refs: Record<string, string> = {};
    const listing = git(
        origin,
        'for-each-ref',
        '--format=%(refname:short) %(objectname)',
        'refs/heads'
    );
    for (const line of listing.split('\n')) {
        const [name, sha] = line.split(' ');
        refs[name] = sha;
    }
    return refs;
}

function runStep(
    stepName: string,
    cwd: string,
    env: Record<string, string>
) {
    return run(
        'bash',
        ['--noprofile', '--norc', '-eo', 'pipefail', '-c', script(stepName)],
        cwd,
        env
    );
}

function synchronize(
    checkout: string,
    root: string,
    enabled: string,
    beforePush: () => void = () => {}
) {
    const outputFile = path.join(root, 'github-output');
    fs.writeFileSync(outputFile, '');
    const candidate = runStep('Resolve and preflight release candidate', checkout, {
        RELEASE_TAG,
        RELEASE_PLEASE_ENABLED: enabled,
        GITHUB_OUTPUT: outputFile,
    });
    const outputs: Record<string, string> = {};
    for (const line of fs.readFileSync(outputFile, 'utf8').split('\n')) {
        const separator = line.indexOf('=');
        if (separator > 0) {
            outputs[line.slice(0, separator)] = line.slice(separator + 1);
        }
    }
    if (candidate.status !== 0) {
        return { candidate, outputs, push: undefined };
    }
    beforePush();
    const push = runStep('Atomically synchronize all destinations', checkout, {
        RELEASE_TAG,
        CANDIDATE_SHA: outputs.candidate_sha,
        RELEASE_PLEASE_MODE: outputs.release_please_mode,
        DEVELOPMENT_BRANCH: outputs.development_branch,
        TRUNK_BRANCH: outputs.trunk_branch,
        RELEASE_ORDER_A_BRANCH: outputs.release_order_a_branch,
        RELEASE_ORDER_B_BRANCH: outputs.release_order_b_branch,
        RELEASE_ORDER_C_BRANCH: outputs.release_order_c_branch,
    });
    return { candidate, outputs, push };
}

// Plans the shadow promoter's pointer move for a successful V3 Step 3 run of
// RELEASE_TAG, reading the branch tips from the checkout's origin, as
// v3-shadow-promote.yml does. mode is the --release-please-mode value, or
// undefined to leave the flag out.
function shadowPlan(root: string, checkout: string, mode?: string): string[] {
    const runFile = path.join(root, 'step-3-run.json');
    fs.writeFileSync(
        runFile,
        JSON.stringify({
            id: 36621677032,
            run_attempt: 1,
            event: 'workflow_dispatch',
            status: 'completed',
            conclusion: 'success',
            path: '.github/workflows/v3-release-step-3.yml',
            head_branch: 'main',
            display_title: `V3 Release - Step 3 [${RELEASE_TAG}]`,
            workflow_id: 313,
            head_repository: { full_name: 'example-org/example-repo' },
            repository: { full_name: 'example-org/example-repo' },
        })
    );
    return trigger.main(
        [
            'release-step',
            '--run',
            runFile,
            '--repository',
            'example-org/example-repo',
            '--step2-workflow-id',
            '202',
            '--step3-workflow-id',
            '303',
            '--v3-step2-workflow-id',
            '212',
            '--v3-step3-workflow-id',
            '313',
            ...(mode === undefined ? [] : ['--release-please-mode', mode]),
        ],
        (args: string[]) => git(checkout, ...args)
    );
}

describe('V3 Step 3 Release Please mode', () => {
    const roots: string[] = [];

    afterEach(() => {
        for (const root of roots.splice(0)) {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });

    it('reads the mode from the V3_RELEASE_PLEASE_ENABLED repository variable', () => {
        const candidate = STEPS.find(
            step => step.name === 'Resolve and preflight release candidate'
        );
        expect(candidate.env.RELEASE_PLEASE_ENABLED).toBe(
            '${{ vars.V3_RELEASE_PLEASE_ENABLED }}'
        );
        const push = STEPS.find(
            step => step.name === 'Atomically synchronize all destinations'
        );
        expect(push.env.RELEASE_PLEASE_MODE).toBe(
            '${{ steps.candidate.outputs.release_please_mode }}'
        );
    });

    it('loads the release token only for a real run', () => {
        const checkout = STEPS.find(step => step.name === 'Checkout repository');
        expect(checkout.with.token).toBe(RELEASE_TOKEN_ON_REAL_RUNS);
        expect(JOB.env.GITHUB_TOKEN).toBe(RELEASE_TOKEN_ON_REAL_RUNS);
        expect(JOB.permissions).toEqual({ contents: 'read' });
        expect(JSON.stringify(WORKFLOW).match(/secrets\./g)).toHaveLength(3);
        const push = STEPS.find(
            step => step.name === 'Atomically synchronize all destinations'
        );
        expect(push.if).toBe("${{ github.event.inputs.dryRun == 'false' }}");
    });

    it('checks the release token first on a real run, and never on a dry run', () => {
        const check = STEPS[0];
        expect(check.name).toBe('Check the release token on a real run');
        expect(check.if).toBe("${{ github.event.inputs.dryRun == 'false' }}");
        expect(check.env).toEqual({
            RELEASE_TOKEN: '${{ secrets.MP_SEMANTIC_RELEASE_BOT }}',
        });
        expect(check.run).not.toContain('${{');
        expect(STEPS[1].name).toBe('Checkout repository');
    });

    it.each([['empty'], ['unset']])(
        'fails at the start of a real run when the release token is %s',
        state => {
            const env: Record<string, string> =
                state === 'empty' ? { RELEASE_TOKEN: '' } : {};
            const root = fs.mkdtempSync(
                path.join(os.tmpdir(), 'v3-step-3-token-')
            );
            roots.push(root);
            const check = runStep(
                'Check the release token on a real run',
                root,
                env
            );

            expect(check.status).not.toBe(0);
            expect(check.output).toContain(
                '::error title=Release token missing::MP_SEMANTIC_RELEASE_BOT is empty or not available to this workflow.'
            );
            expect(check.output).toContain('Nothing was checked out or pushed.');
        }
    );

    it('passes the token check when the release token is set', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'v3-step-3-token-'));
        roots.push(root);
        const check = runStep('Check the release token on a real run', root, {
            RELEASE_TOKEN: 'release-token-for-test',
        });

        expect(check.status).toBe(0);
        expect(check.output).toBe('');
    });

    it('passes the tag and the checked candidate to the push step', () => {
        const push = STEPS.find(
            step => step.name === 'Atomically synchronize all destinations'
        );
        expect(push.env.RELEASE_TAG).toBe('${{ inputs.releaseTag }}');
        expect(push.env.CANDIDATE_SHA).toBe(
            '${{ steps.candidate.outputs.candidate_sha }}'
        );
        expect(push.run).not.toContain('${{');
        expect(push.run.indexOf('git ls-remote --exit-code --tags origin')).toBeLessThan(
            push.run.indexOf('git push --atomic origin')
        );
    });

    it.each([['true'], ['false']])(
        'stops before the push when the tag moved after the preflight (Release Please mode %s)',
        enabled => {
            const { root, origin, checkout, base, release } = setUp(
                enabled === 'true'
            );
            roots.push(root);
            const before = heads(origin);

            const { candidate, outputs, push } = synchronize(
                checkout,
                root,
                enabled,
                () => git(origin, 'update-ref', `refs/tags/${RELEASE_TAG}`, base)
            );

            expect(candidate.status).toBe(0);
            expect(outputs.candidate_sha).toBe(release);
            expect(push.status).not.toBe(0);
            expect(push.output).toContain(
                `${RELEASE_TAG} now resolves to ${base} on origin, not the checked candidate ${release}; nothing was pushed`
            );
            expect(heads(origin)).toEqual(before);
        }
    );

    it('stops before the push when the tag is gone from origin', () => {
        const { root, origin, checkout } = setUp(true);
        roots.push(root);
        const before = heads(origin);

        const { candidate, push } = synchronize(checkout, root, 'true', () =>
            git(origin, 'update-ref', '-d', `refs/tags/${RELEASE_TAG}`)
        );

        expect(candidate.status).toBe(0);
        expect(push.status).not.toBe(0);
        expect(push.output).toContain(
            `${RELEASE_TAG} is no longer on origin; nothing was pushed`
        );
        expect(heads(origin)).toEqual(before);
    });

    it.each([['true'], ['false']])(
        'pushes with an annotated tag by its peeled commit (Release Please mode %s)',
        enabled => {
            const { root, origin, checkout, release } = setUp(
                enabled === 'true',
                true
            );
            roots.push(root);
            // The tag ref names a tag object, not the commit, so only the
            // ls-remote ^{} line matches the candidate.
            expect(git(origin, 'cat-file', '-t', `refs/tags/${RELEASE_TAG}`)).toBe(
                'tag'
            );
            expect(git(origin, 'rev-parse', `refs/tags/${RELEASE_TAG}`)).not.toBe(
                release
            );
            const listing = git(
                root,
                'ls-remote',
                '--tags',
                origin,
                `refs/tags/${RELEASE_TAG}`,
                `refs/tags/${RELEASE_TAG}^{}`
            );
            expect(listing).toContain(`${release}\trefs/tags/${RELEASE_TAG}^{}`);

            const { candidate, outputs, push } = synchronize(
                checkout,
                root,
                enabled
            );

            expect(candidate.status).toBe(0);
            expect(outputs.candidate_sha).toBe(release);
            expect(push.status).toBe(0);
            const after = heads(origin);
            for (const branch of RELEASE_ORDER_BRANCHES) {
                expect(after[branch]).toBe(release);
            }
        }
    );

    it('stops before the push when an annotated tag moved after the preflight', () => {
        const { root, origin, seed, checkout, base, release } = setUp(true, true);
        roots.push(root);
        const before = heads(origin);

        const { candidate, outputs, push } = synchronize(
            checkout,
            root,
            'true',
            () => {
                git(seed, 'tag', '-f', '-a', '-m', 'moved', RELEASE_TAG, base);
                git(seed, 'push', '-q', '-f', 'origin', `refs/tags/${RELEASE_TAG}`);
            }
        );

        expect(candidate.status).toBe(0);
        expect(outputs.candidate_sha).toBe(release);
        expect(push.status).not.toBe(0);
        // The message names the peeled commit, not the new tag object.
        expect(push.output).toContain(
            `${RELEASE_TAG} now resolves to ${base} on origin, not the checked candidate ${release}; nothing was pushed`
        );
        expect(heads(origin)).toEqual(before);
    });

    it.each([[''], ['false']])(
        'pushes all five branches when the variable is %j, as before',
        enabled => {
            const { root, origin, checkout, base, release } = setUp(false);
            roots.push(root);

            const { candidate, outputs, push } = synchronize(
                checkout,
                root,
                enabled
            );

            expect(candidate.status).toBe(0);
            expect(outputs.release_please_mode).toBe('false');
            expect(push.status).toBe(0);
            const after = heads(origin);
            for (const branch of ALL_BRANCHES) {
                expect(after[branch]).toBe(release);
            }
            expect(base).not.toBe(release);
        }
    );

    it('pushes only the release-order branches in Release Please mode', () => {
        const { root, origin, checkout, base, release } = setUp(true);
        roots.push(root);

        const { candidate, outputs, push } = synchronize(
            checkout,
            root,
            'true'
        );

        expect(candidate.status).toBe(0);
        expect(outputs.release_please_mode).toBe('true');
        expect(push.status).toBe(0);
        const after = heads(origin);
        for (const branch of RELEASE_ORDER_BRANCHES) {
            expect(after[branch]).toBe(release);
        }
        expect(after['v3-development']).toBe(base);
        expect(after.main).toBe(release);
    });

    it('passes the same repository variable to the shadow promoter plan', () => {
        const plan = PROMOTE.jobs.resolve.steps.find(
            (step: any) =>
                step.name === 'Plan from the release run or the dispatch inputs'
        );
        expect(plan.env.RELEASE_PLEASE_ENABLED).toBe(
            '${{ vars.V3_RELEASE_PLEASE_ENABLED }}'
        );
        expect(plan.run).toContain(
            '--release-please-mode "$RELEASE_PLEASE_MODE"'
        );
        expect(plan.run).not.toContain('${{');
    });

    it('lets the shadow promoter move ga and the release orders when main is past the tag in Release Please mode', () => {
        const { root, origin, seed, checkout, base, release } = setUp(true);
        roots.push(root);
        // Release Please keeps merging to main after it cuts the tag.
        fs.writeFileSync(path.join(seed, 'CHANGELOG.md'), 'next change\n');
        git(seed, 'add', 'CHANGELOG.md');
        git(seed, 'commit', '-q', '-m', 'next change');
        const ahead = git(seed, 'rev-parse', 'HEAD');
        git(seed, 'push', '-q', 'origin', `${ahead}:refs/heads/main`);

        const { candidate, push } = synchronize(checkout, root, 'true');

        expect(candidate.status).toBe(0);
        expect(push.status).toBe(0);
        const after = heads(origin);
        for (const branch of RELEASE_ORDER_BRANCHES) {
            expect(after[branch]).toBe(release);
        }
        expect(after.main).toBe(ahead);
        expect(after['v3-development']).toBe(base);

        expect(shadowPlan(root, checkout, 'true')).toEqual([
            'step=3',
            'skip=false',
            `release_tag=${RELEASE_TAG}`,
            'release_version=3.30.0',
            'channels=v3-release-order-a,v3-release-order-b,v3-release-order-c,ga',
            'branches=v3-release-order-a,v3-release-order-b,v3-release-order-c',
            'mismatched=',
        ]);
        // Outside Release Please mode the plan still checks main, as before.
        for (const mode of ['false', undefined]) {
            const plan = shadowPlan(root, checkout, mode);
            expect(plan).toContain('skip=true');
            expect(plan).toContain(
                'branches=main,v3-release-order-a,v3-release-order-b,v3-release-order-c'
            );
            expect(plan).toContain('mismatched=main');
        }
    });

    it('plans all five branches outside Release Please mode, as before', () => {
        const { root, checkout, release } = setUp(false);
        roots.push(root);

        const { candidate, push } = synchronize(checkout, root, 'false');

        expect(candidate.status).toBe(0);
        expect(push.status).toBe(0);
        expect(git(checkout, 'ls-remote', 'origin', 'refs/heads/main')).toContain(
            release
        );
        expect(shadowPlan(root, checkout, 'false')).toContain('skip=false');
        expect(shadowPlan(root, checkout)).toContain(
            'branches=main,v3-release-order-a,v3-release-order-b,v3-release-order-c'
        );
    });

    it('rejects a Release Please mode that is not true or false', () => {
        const { root, checkout } = setUp(true);
        roots.push(root);

        expect(() => shadowPlan(root, checkout, 'yes')).toThrow(
            '--release-please-mode must be true or false'
        );
    });

    it('refuses a tag that is not on main in Release Please mode', () => {
        const { root, origin, checkout, base } = setUp(false);
        roots.push(root);

        const { candidate, push } = synchronize(checkout, root, 'true');

        expect(candidate.status).not.toBe(0);
        expect(candidate.output).toContain(
            `${RELEASE_TAG} is not on origin/main; Release Please cuts V3 tags from main`
        );
        expect(push).toBeUndefined();
        const after = heads(origin);
        for (const branch of [
            ...RELEASE_ORDER_BRANCHES,
            'main',
            'v3-development',
        ]) {
            expect(after[branch]).toBe(base);
        }
    });
});
