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

// A stand-in origin with base-branch at the base commit, and the commits each
// case adds as the pull request head. The guard runs in a clone that holds
// only base-branch, as the base commit checkout does, so the head commits
// reach it only through the fetch step. A stand-in gh answers the
// verification lookup from a file of verified SHAs.
function setUp() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'v3-dist-guard-'));
    const repo = path.join(root, 'repo');
    const runner = path.join(root, 'runner');
    const bin = path.join(root, 'bin');
    const verified = path.join(root, 'verified');
    fs.mkdirSync(bin);
    fs.writeFileSync(verified, '');
    fs.writeFileSync(
        path.join(bin, 'gh'),
        '#!/bin/sh\n' +
            'sha="${2##*/}"\n' +
            'if grep -qx "$sha" "$VERIFIED_FILE"; then echo true; else echo false; fi\n',
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
    fs.mkdirSync(repo);
    git(PERSON, 'init', '-q');
    // GitHub serves a reachable commit by its SHA; the stand-in origin does too.
    git(PERSON, 'config', 'uploadpack.allowReachableSHA1InWant', 'true');
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
        isVerified: boolean
    ) => {
        fs.mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
        fs.writeFileSync(path.join(repo, file), text);
        git(env, 'add', '-f', file);
        git(env, 'commit', '-q', '-m', `change ${file}`);
        const sha = git(env, 'rev-parse', 'HEAD');
        if (isVerified) {
            fs.appendFileSync(verified, `${sha}\n`);
        }
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
        if (isVerified) {
            fs.appendFileSync(verified, `${sha}\n`);
        }
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
        headSha = git(PERSON, 'rev-parse', 'HEAD')
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
            { HEAD_SHA: headSha }
        );
        if (fetched.status !== 0) {
            return fetched;
        }
        return runStep('Check every bundle change', runner, {
            PATH: `${bin}:${process.env.PATH}`,
            VERIFIED_FILE: verified,
            BASE_SHA: base,
            HEAD_SHA: headSha,
            HEAD_REF: headRef,
            HEAD_REPOSITORY: headRepo,
            BASE_REPOSITORY: REPOSITORY,
            RELEASE_IDENTITY: `${RELEASE_NAME} <${RELEASE_EMAIL}>`,
        });
    };
    return { root, runner, base, change, addDistEntry, guard };
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
        expect(step('Check every bundle change').env.RELEASE_IDENTITY).toBe(
            `${RELEASE_NAME} <${RELEASE_EMAIL}>`
        );
        expect(step('Checkout the base commit').with).toEqual({
            ref: '${{ github.event.pull_request.base.sha }}',
            'fetch-depth': 0,
            'persist-credentials': false,
        });
        expect(step('Fetch the pull request head as data').env).toEqual({
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
            '0123456789abcdef0123456789abcdef01234567'
        );

        expect(result.status).not.toBe(0);
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

    it('passes the release branch when every bundle commit is a verified release commit', () => {
        const { change, guard } = fresh();
        change(PERSON, 'src/index.js', 'two\n', false);
        change(RELEASE, 'dist/mparticle.js', 'built\n', true);
        change(RELEASE, 'kits/rokt/dist/Rokt-Kit.iife.js', 'built\n', true);

        const result = guard(`${RELEASE_BRANCH}--components--web-sdk`);

        expect(result.status).toBe(0);
        expect(result.output).toContain('Every bundle change is a signed release commit');
    });

    const BAD_COMMITS: Array<[string, Record<string, string>, boolean]> = [
        ['another author', PERSON, true],
        ['an unverified signature', RELEASE, false],
    ];

    it.each(BAD_COMMITS)(
        'fails the release branch when a bundle commit has %s',
        (_case, env, isVerified) => {
            const { change, guard } = fresh();
            change(RELEASE, 'dist/mparticle.js', 'built\n', true);
            const bad = change(
                env,
                'kits/rokt/dist/Rokt-Kit.iife.js',
                'edited\n',
                isVerified
            );

            const result = guard(RELEASE_BRANCH);

            expect(result.status).toBe(1);
            expect(result.output).toContain(bad);
        }
    );
});
