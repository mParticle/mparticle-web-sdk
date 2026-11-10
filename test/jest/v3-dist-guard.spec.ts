import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const yaml = require('js-yaml');

const WORKFLOW_PATH = path.join(
    __dirname,
    '../../.github/workflows/v3-dist-guard.yml'
);
const WORKFLOW = yaml.load(fs.readFileSync(WORKFLOW_PATH, 'utf8'));
const JOB = WORKFLOW.jobs['dist-guard'];
const RELEASE_NAME = 'mparticle-automation';
const RELEASE_EMAIL = 'developers@mparticle.com';
const RELEASE_BRANCH = 'release-please--branches--main';
const REPOSITORY = 'mParticle/mparticle-web-sdk';

function step(name: string): any {
    const found = JOB.steps.find((candidate: any) => candidate.name === name);
    expect(found).toBeDefined();
    return found;
}

function run(
    command: string,
    args: string[],
    cwd: string,
    env: Record<string, string>
) {
    const result = spawnSync(command, args, {
        cwd,
        encoding: 'utf8',
        env: {
            ...process.env,
            GIT_CONFIG_GLOBAL: '/dev/null',
            GIT_CONFIG_NOSYSTEM: '1',
            ...env,
        },
    });
    return {
        status: result.status,
        output: `${result.stdout}${result.stderr}`,
        stdout: result.stdout,
    };
}

function identity(name: string, email: string): Record<string, string> {
    return {
        GIT_AUTHOR_NAME: name,
        GIT_AUTHOR_EMAIL: email,
        GIT_COMMITTER_NAME: name,
        GIT_COMMITTER_EMAIL: email,
    };
}

const RELEASE = identity(RELEASE_NAME, RELEASE_EMAIL);
const PERSON = identity('Contributor', 'contributor@example.com');
const PR_NUMBER = '42';

interface CommitApiRecord {
    verified?: boolean;
    authorLogin?: string;
    committerLogin?: string;
}

// A stand-in origin with base-branch at the base commit, and the commits each
// case adds on refs/pull/<number>/head as the pull request head. The guard
// runs in a clone that holds only base-branch, as the base commit checkout
// does, so the head commits reach it only through the refs/pull/<number>/head
// fetch step. A stand-in gh answers the commit lookup from a TSV of SHAs.
function setUp() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'v3-dist-guard-'));
    const repo = path.join(root, 'repo');
    const runner = path.join(root, 'runner');
    const bin = path.join(root, 'bin');
    const commitsFile = path.join(root, 'commits');
    fs.mkdirSync(bin);
    fs.writeFileSync(commitsFile, '');
    fs.writeFileSync(
        path.join(bin, 'gh'),
        '#!/bin/sh\n' +
            'sha="${2##*/}"\n' +
            'line="$(grep "^${sha}\t" "$COMMITS_FILE" | tail -n 1)"\n' +
            'if [ -n "$line" ]; then\n' +
            '    printf "%s\\n" "$line" | cut -f2-4\n' +
            'else\n' +
            '    printf "false\\tnone\\tnone\\n"\n' +
            'fi\n',
        { mode: 0o755 }
    );
    const git = (env: Record<string, string>, ...args: string[]) => {
        const result = run(
            'git',
            ['-c', 'commit.gpgsign=false', ...args],
            repo,
            env
        );
        if (result.status !== 0) {
            throw new Error(`git ${args.join(' ')}: ${result.output}`);
        }
        return result.stdout.trim();
    };
    const recordCommit = (
        sha: string,
        env: Record<string, string>,
        api: CommitApiRecord
    ) => {
        const defaultLogin =
            env.GIT_AUTHOR_NAME === RELEASE_NAME ? RELEASE_NAME : 'contributor';
        const defaultCommitter =
            env.GIT_COMMITTER_NAME === RELEASE_NAME
                ? RELEASE_NAME
                : 'contributor';
        const verified = api.verified ? 'true' : 'false';
        const authorLogin = api.authorLogin ?? defaultLogin;
        const committerLogin = api.committerLogin ?? defaultCommitter;
        fs.appendFileSync(
            commitsFile,
            `${sha}\t${verified}\t${authorLogin}\t${committerLogin}\n`
        );
    };
    fs.mkdirSync(repo);
    git(PERSON, 'init', '-q');
    fs.mkdirSync(path.join(repo, 'src'));
    fs.writeFileSync(path.join(repo, 'src', 'index.js'), 'one\n');
    git(PERSON, 'add', '.');
    git(PERSON, 'commit', '-q', '-m', 'base');
    const base = git(PERSON, 'rev-parse', 'HEAD');
    git(PERSON, 'branch', 'base-branch');
    const change = (
        env: Record<string, string>,
        file: string,
        text: string,
        isVerified: boolean,
        api: Omit<CommitApiRecord, 'verified'> = {}
    ) => {
        fs.mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
        fs.writeFileSync(path.join(repo, file), text);
        git(env, 'add', '-f', file);
        git(env, 'commit', '-q', '-m', `change ${file}`);
        const sha = git(env, 'rev-parse', 'HEAD');
        recordCommit(sha, env, { verified: isVerified, ...api });
        return sha;
    };
    // Adds a dist that is itself a file or a symlink, not a directory.
    const addDistEntry = (
        env: Record<string, string>,
        file: string,
        kind: 'file' | 'symlink',
        isVerified: boolean
    ) => {
        fs.mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
        if (kind === 'symlink') {
            fs.symlinkSync('../../src', path.join(repo, file));
        } else {
            fs.writeFileSync(path.join(repo, file), 'not a directory\n');
        }
        git(env, 'add', '-f', file);
        git(env, 'commit', '-q', '-m', `add ${file}`);
        const sha = git(env, 'rev-parse', 'HEAD');
        recordCommit(sha, env, { verified: isVerified });
        return sha;
    };
    const runStep = (name: string, cwd: string, env: Record<string, string>) =>
        run(
            'bash',
            ['--noprofile', '--norc', '-eo', 'pipefail', '-c', step(name).run],
            cwd,
            env
        );
    const guard = (
        headRef: string,
        enabled = 'true',
        headRepo = REPOSITORY,
        headSha = git(PERSON, 'rev-parse', 'HEAD'),
        prAuthor = RELEASE_NAME,
        pullRefSha: string | null = headSha
    ) => {
        const outputFile = path.join(root, 'github-output');
        fs.writeFileSync(outputFile, '');
        const switchResult = runStep('Read the guard switch', root, {
            GUARD_ENABLED: enabled,
            GITHUB_OUTPUT: outputFile,
        });
        expect(switchResult.status).toBe(0);
        if (!fs.readFileSync(outputFile, 'utf8').includes('enabled=true')) {
            return switchResult;
        }
        if (pullRefSha) {
            git(
                PERSON,
                'update-ref',
                `refs/pull/${PR_NUMBER}/head`,
                pullRefSha
            );
        }
        fs.rmSync(runner, { recursive: true, force: true });
        git(
            PERSON,
            'clone',
            '-q',
            '--no-local',
            '--single-branch',
            '--branch',
            'base-branch',
            repo,
            runner
        );
        const fetched = runStep(
            'Fetch the pull request head as data',
            runner,
            { PR_NUMBER, HEAD_SHA: headSha }
        );
        if (fetched.status !== 0) {
            return fetched;
        }
        return runStep('Check every bundle change', runner, {
            PATH: `${bin}:${process.env.PATH}`,
            COMMITS_FILE: commitsFile,
            BASE_SHA: base,
            HEAD_SHA: headSha,
            HEAD_REF: headRef,
            HEAD_REPOSITORY: headRepo,
            BASE_REPOSITORY: REPOSITORY,
            PR_AUTHOR: prAuthor,
            RELEASE_BOT_LOGIN: RELEASE_NAME,
            RELEASE_IDENTITY: `${RELEASE_NAME} <${RELEASE_EMAIL}>`,
        });
    };
    return {
        root,
        runner,
        bin,
        base,
        git,
        recordCommit,
        change,
        addDistEntry,
        guard,
    };
}

describe('V3 bundle change guard', () => {
    const roots: string[] = [];

    afterEach(() => {
        for (const root of roots.splice(0)) {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });

    function fresh() {
        const repo = setUp();
        roots.push(repo.root);
        return repo;
    }

    it('runs on every pull request to main with a stable name and never skips', () => {
        expect(WORKFLOW.on).toEqual({
            pull_request_target: { branches: ['main'] },
        });
        expect(Object.keys(WORKFLOW.jobs)).toEqual(['dist-guard']);
        expect(JOB.name).toBe('V3 bundles change only in release PRs');
        expect(JOB.if).toBeUndefined();
        expect(step('Read the guard switch').if).toBeUndefined();
        expect(WORKFLOW.permissions).toEqual({});
        expect(JOB.permissions).toEqual({ contents: 'read' });
    });

    it('reads the switch and the release identity from fixed sources', () => {
        expect(step('Read the guard switch').env.GUARD_ENABLED).toBe(
            '${{ vars.V3_DIST_GUARD_ENABLED }}'
        );
        expect(step('Check every bundle change').env.PR_AUTHOR).toBe(
            '${{ github.event.pull_request.user.login }}'
        );
        expect(step('Check every bundle change').env.RELEASE_BOT_LOGIN).toBe(
            RELEASE_NAME
        );
        expect(step('Check every bundle change').env.RELEASE_IDENTITY).toBe(
            `${RELEASE_NAME} <${RELEASE_EMAIL}>`
        );
        expect(step('Checkout the base commit').with).toEqual({
            ref: '${{ github.event.pull_request.base.sha }}',
            'fetch-depth': 0,
            'persist-credentials': false,
        });
        expect(step('Fetch the pull request head as data').env).toEqual({
            PR_NUMBER: '${{ github.event.pull_request.number }}',
            HEAD_SHA: '${{ github.event.pull_request.head.sha }}',
        });
    });

    // pull_request_target runs this file from main, so a pull request that
    // edits the guard cannot change what its own check runs. These cases hold
    // the rest of that: the pull request's code is never checked out or run.
    it('never checks out or runs pull request code, and uses no secrets', () => {
        const actions = JOB.steps
            .filter((candidate: any) => candidate.uses)
            .map((candidate: any) => candidate.uses.split('@')[0]);
        expect(actions).toEqual(['actions/checkout']);
        for (const candidate of JOB.steps) {
            expect(JSON.stringify(candidate.with || {})).not.toContain(
                'pull_request.head'
            );
            expect(candidate.run || '').not.toMatch(
                /\bgit\s+(checkout|switch|reset|restore|merge|rebase|pull|worktree|cherry-pick|am|apply|stash)(?![\w-])/
            );
        }
        expect(fs.readFileSync(WORKFLOW_PATH, 'utf8')).not.toMatch(
            /\$\{\{[^}]*\bsecrets\./
        );
    });

    it('checks a pull request that rewrites the guard with the base copy and keeps the base commit checked out', () => {
        const { runner, base, change, guard } = fresh();
        const rewritten = JSON.parse(JSON.stringify(WORKFLOW));
        for (const candidate of rewritten.jobs['dist-guard'].steps) {
            if (candidate.run) {
                candidate.run = 'exit 0\n';
            }
        }
        change(
            PERSON,
            '.github/workflows/v3-dist-guard.yml',
            yaml.dump(rewritten),
            false
        );
        change(PERSON, 'dist/mparticle.js', 'edited\n', false);

        const result = guard('feature');

        expect(result.status).toBe(1);
        expect(result.output).toContain('dist/mparticle.js');
        const head = run('git', ['rev-parse', 'HEAD'], runner, {});
        expect(head.stdout.trim()).toBe(base);
        expect(
            fs.existsSync(
                path.join(runner, '.github/workflows/v3-dist-guard.yml')
            )
        ).toBe(false);
    });

    it('fails closed when the head commit cannot be fetched', () => {
        const { change, guard } = fresh();
        change(PERSON, 'dist/mparticle.js', 'edited\n', false);

        const result = guard(
            'feature',
            'true',
            REPOSITORY,
            '0123456789abcdef0123456789abcdef01234567',
            RELEASE_NAME,
            null
        );

        expect(result.status).not.toBe(0);
    });

    it('fetches refs/pull/<number>/head for a fork pull request and fails when it differs from HEAD_SHA', () => {
        const { base, change, guard } = fresh();
        const headSha = change(PERSON, 'src/index.js', 'from-fork\n', false);

        const forkResult = guard(
            'feature',
            'true',
            'someone/mparticle-web-sdk',
            headSha,
            'contributor',
            headSha
        );
        expect(forkResult.status).toBe(0);
        expect(forkResult.output).toContain('changes no release bundle');

        const mismatchResult = guard(
            'feature',
            'true',
            'someone/mparticle-web-sdk',
            headSha,
            'contributor',
            base
        );
        expect(mismatchResult.status).toBe(1);
        expect(mismatchResult.output).toContain(
            `refs/pull/${PR_NUMBER}/head resolved to ${base}, expected ${headSha}`
        );
    });

    it('passes values to shell steps through env only, with pinned actions', () => {
        for (const candidate of JOB.steps) {
            expect(candidate.run || '').not.toContain('${{');
            if (candidate.uses) {
                expect(candidate.uses).toMatch(/^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/);
            }
        }
    });

    it('passes everything while the switch is off', () => {
        const { change, guard } = fresh();
        change(PERSON, 'dist/mparticle.js', 'edited\n', false);

        const result = guard('feature', 'false');

        expect(result.status).toBe(0);
        expect(result.output).toContain('The bundle guard is off');
    });

    it('passes a pull request that changes no bundle', () => {
        const { change, guard } = fresh();
        change(PERSON, 'src/index.js', 'two\n', false);

        const result = guard('feature');

        expect(result.status).toBe(0);
        expect(result.output).toContain('changes no release bundle');
    });

    it.each([
        ['dist/mparticle.js'],
        ['kits/rokt/dist/Rokt-Kit.iife.js'],
        ['kits/google-analytics-4/packages/GA4Client/dist/GA4Client.js'],
    ])('fails a feature pull request that changes %s', file => {
        const { change, guard } = fresh();
        change(PERSON, file, 'edited\n', false);

        const result = guard('feature');

        expect(result.status).toBe(1);
        expect(result.output).toContain(file);
    });

    it('names a dist that is a file or a symlink in both pathspecs', () => {
        const script = step('Check every bundle change').run;
        const pathspec = "dist ':(glob)kits/**/dist' ':(glob)kits/**/dist/**'";
        expect(script.split(pathspec)).toHaveLength(3);
    });

    it.each([
        ['kits/rokt/dist', 'file'],
        ['kits/rokt/dist', 'symlink'],
        ['kits/google-analytics-4/packages/GA4Client/dist', 'symlink'],
    ] as Array<[string, 'file' | 'symlink']>)(
        'fails a feature pull request that adds %s as a %s',
        (file, kind) => {
            const { addDistEntry, guard } = fresh();
            addDistEntry(PERSON, file, kind, false);

            const result = guard('feature');

            expect(result.status).toBe(1);
            expect(result.output).toContain(file);
        }
    );

    it('fails the release branch when a person adds a kit dist symlink', () => {
        const { change, addDistEntry, guard } = fresh();
        change(RELEASE, 'dist/mparticle.js', 'built\n', true);
        const bad = addDistEntry(PERSON, 'kits/rokt/dist', 'symlink', true);

        const result = guard(RELEASE_BRANCH);

        expect(result.status).toBe(1);
        expect(result.output).toContain(bad);
    });

    it('fails a release branch from a fork', () => {
        const { change, guard } = fresh();
        change(RELEASE, 'dist/mparticle.js', 'built\n', true);

        const result = guard(RELEASE_BRANCH, 'true', 'someone/mparticle-web-sdk');

        expect(result.status).toBe(1);
    });

    it('fails a same-repository release branch opened by another pull request author', () => {
        const { change, guard } = fresh();
        const headSha = change(RELEASE, 'dist/mparticle.js', 'built\n', true);

        const result = guard(
            RELEASE_BRANCH,
            'true',
            REPOSITORY,
            headSha,
            'contributor'
        );

        expect(result.status).toBe(1);
        expect(result.output).toContain('dist/mparticle.js');
    });

    it('passes the release branch when every bundle commit is a verified release commit', () => {
        const { change, guard } = fresh();
        change(PERSON, 'src/index.js', 'two\n', false);
        change(RELEASE, 'dist/mparticle.js', 'built\n', true);
        change(RELEASE, 'kits/rokt/dist/Rokt-Kit.iife.js', 'built\n', true);

        const result = guard(`${RELEASE_BRANCH}--components--web-sdk`);

        expect(result.status).toBe(0);
        expect(result.output).toContain('Every bundle change is a signed release commit');
    });

    it('checks merge commits and side-branch commits on the release branch with --full-history', () => {
        expect(step('Check every bundle change').run).toContain(
            'SHAS="$(git rev-list --full-history "${MERGE_BASE}..${HEAD_SHA}" --'
        );
        const { base, git, recordCommit, change, guard } = fresh();
        // A verified release commit changes the bundle on a side branch, then a
        // person merges that side branch into the release branch. The merge is
        // TREESAME to the side branch on dist/, so git rev-list without
        // --full-history simplifies the merge away and checks only the side
        // branch commit. With --full-history the merge commit is checked too.
        git(PERSON, 'checkout', '-q', '-b', 'side', base);
        change(RELEASE, 'dist/mparticle.js', 'built\n', true);
        git(PERSON, 'checkout', '-q', '-b', 'release-line', base);
        change(PERSON, 'src/index.js', 'two\n', false);
        git(PERSON, 'merge', '-q', '--no-ff', 'side', '-m', 'merge side');
        const mergeSha = git(PERSON, 'rev-parse', 'HEAD');
        recordCommit(mergeSha, PERSON, { verified: true });

        const result = guard(RELEASE_BRANCH);

        expect(result.status).toBe(1);
        expect(result.output).toContain(mergeSha);
    });

    it('fails when a verified release merge commit brings in an unsigned side-branch bundle commit', () => {
        const { base, git, recordCommit, change, guard } = fresh();
        git(PERSON, 'checkout', '-q', '-b', 'unsigned-side', base);
        const sideSha = change(
            RELEASE,
            'dist/mparticle.js',
            'unsigned-side\n',
            false
        );
        git(PERSON, 'checkout', '-q', '-b', 'release-merge', base);
        change(PERSON, 'src/index.js', 'two\n', false);
        git(
            RELEASE,
            'merge',
            '-q',
            '--no-ff',
            'unsigned-side',
            '-m',
            'merge unsigned side'
        );
        const mergeSha = git(RELEASE, 'rev-parse', 'HEAD');
        recordCommit(mergeSha, RELEASE, { verified: true });

        const result = guard(RELEASE_BRANCH);

        expect(result.status).toBe(1);
        expect(result.output).toContain(sideSha);
    });

    it('fails closed when git rev-list fails', () => {
        const { bin, change, guard } = fresh();
        change(RELEASE, 'dist/mparticle.js', 'built\n', true);
        const realGit = run('which', ['git'], bin, {}).stdout.trim();
        fs.writeFileSync(
            path.join(bin, 'git'),
            '#!/bin/sh\n' +
                'if [ "$1" = "rev-list" ]; then\n' +
                '    echo "fatal: simulated rev-list failure" >&2\n' +
                '    exit 128\n' +
                'fi\n' +
                `exec "${realGit}" "$@"\n`,
            { mode: 0o755 }
        );

        const result = guard(RELEASE_BRANCH);

        expect(result.status).toBe(128);
        expect(result.output).toContain('simulated rev-list failure');
    });

    const BAD_COMMITS: Array<
        [string, Record<string, string>, boolean, Omit<CommitApiRecord, 'verified'>]
    > = [
        ['another git author', PERSON, true, {}],
        ['an unverified signature', RELEASE, false, {}],
        [
            'another GitHub API author login',
            RELEASE,
            true,
            { authorLogin: 'contributor' },
        ],
        [
            'another GitHub API committer login',
            RELEASE,
            true,
            { committerLogin: 'contributor' },
        ],
    ];

    it.each(BAD_COMMITS)(
        'fails the release branch when a bundle commit has %s',
        (_case, env, isVerified, api) => {
            const { change, guard } = fresh();
            change(RELEASE, 'dist/mparticle.js', 'built\n', true);
            const bad = change(
                env,
                'kits/rokt/dist/Rokt-Kit.iife.js',
                'edited\n',
                isVerified,
                api
            );

            const result = guard(RELEASE_BRANCH);

            expect(result.status).toBe(1);
            expect(result.output).toContain(bad);
        }
    );
});
