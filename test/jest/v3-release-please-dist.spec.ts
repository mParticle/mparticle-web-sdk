import * as fs from 'fs';
import * as path from 'path';

const yaml = require('js-yaml');

const REPO_ROOT = path.join(__dirname, '../..');
const DIST_PATH = '.github/workflows/v3-release-please-dist.yml';
const CHECK_PATH = '.github/workflows/v3-release-dist-check.yml';
const STEP_ONE_PATH = '.github/workflows/v3-release-step-1.yml';
const RELEASE_BRANCHES = [
    'release-please--branches--main',
    'release-please--branches--main--components--**',
];
const PINNED_USES = /^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/;
const RELEASE_ENVIRONMENT = 'v3-release-machine-user';

function read(workflowPath: string): string {
    return fs.readFileSync(path.join(REPO_ROOT, workflowPath), 'utf8');
}

function load(workflowPath: string): any {
    return yaml.load(read(workflowPath));
}

const DIST = load(DIST_PATH);
const CHECK = load(CHECK_PATH);
const BUILD_JOB = DIST.jobs['build-dist'];
const COMMIT_JOB = DIST.jobs['commit-dist'];
const CHECK_JOB = CHECK.jobs['dist-matches-version'];

function steps(job: any): any[] {
    return job.steps;
}

function step(job: any, name: string): any {
    const found = steps(job).find((candidate: any) => candidate.name === name);
    expect(found).toBeDefined();
    return found;
}

function runText(job: any): string {
    return steps(job)
        .map((candidate: any) => candidate.run || '')
        .join('\n');
}

describe('V3 Release Please bundle commit workflow', () => {
    it('runs only on pushes to the Release Please branch for main', () => {
        expect(DIST.on).toEqual({ push: { branches: RELEASE_BRANCHES } });
    });

    it('lets a newer push to the release branch supersede a build', () => {
        expect(DIST.concurrency).toEqual({
            group: 'v3-release-please-dist-${{ github.ref_name }}',
            'cancel-in-progress': true,
        });
    });

    it('builds without secrets and commits without running npm', () => {
        const buildCheckout = step(BUILD_JOB, 'Checkout the release branch head');
        const commitText = runText(COMMIT_JOB);

        expect(buildCheckout.with).toEqual({
            ref: '${{ github.sha }}',
            'persist-credentials': false,
        });
        expect(read(DIST_PATH).match(/secrets\./g)).toHaveLength(6);
        expect(JSON.stringify(BUILD_JOB)).not.toContain('secrets.');
        expect(commitText).not.toMatch(/\bnpm\b|\bnode\b|\.\/scripts\//);
        expect(COMMIT_JOB.needs).toBe('build-dist');
        expect(COMMIT_JOB.if).toBe(
            "${{ needs.build-dist.outputs.changed == 'true' }}"
        );
    });

    it('checks out with the machine user token so its push runs the PR checks', () => {
        const checkout = step(COMMIT_JOB, 'Checkout the release branch head');

        expect(checkout.with.token).toBe(
            '${{ secrets.MP_SEMANTIC_RELEASE_BOT }}'
        );
        expect(checkout.with.ref).toBe('${{ github.sha }}');
        expect(DIST.permissions).toEqual({});
        expect(BUILD_JOB.permissions).toEqual({ contents: 'read' });
        expect(COMMIT_JOB.permissions).toEqual({ contents: 'read' });
    });

    it('builds only while Release Please is on, in mParticle repositories', () => {
        expect(BUILD_JOB.if).toContain("github.repository_owner == 'mParticle'");
        expect(BUILD_JOB.if).toContain(
            "vars.V3_RELEASE_PLEASE_ENABLED == 'true'"
        );
    });

    it('reads the machine user token and GPG key only in the release Environment', () => {
        expect(COMMIT_JOB.environment).toBe(RELEASE_ENVIRONMENT);
        expect(BUILD_JOB.environment).toBeUndefined();
        expect(CHECK_JOB.environment).toBeUndefined();
        for (const name of [
            'MP_SEMANTIC_RELEASE_BOT',
            'GPG_PRIVATE_KEY',
            'GPG_PASSPHRASE',
        ]) {
            expect(JSON.stringify(COMMIT_JOB)).toContain(`secrets.${name}`);
        }
    });

    it('fails first, with a clear message, when the token, GPG key or passphrase is empty', () => {
        const check = step(COMMIT_JOB, 'Check the release secrets are set');

        expect(steps(COMMIT_JOB)[0]).toBe(check);
        expect(check.env).toEqual({
            RELEASE_TOKEN: '${{ secrets.MP_SEMANTIC_RELEASE_BOT }}',
            RELEASE_GPG_KEY: '${{ secrets.GPG_PRIVATE_KEY }}',
            RELEASE_GPG_PASSPHRASE: '${{ secrets.GPG_PASSPHRASE }}',
        });
        expect(check.if).toBeUndefined();
        expect(check.run).toContain('if [ -z "${RELEASE_TOKEN:-}" ]; then');
        expect(check.run).toContain('if [ -z "${RELEASE_GPG_KEY:-}" ]; then');
        expect(check.run).toContain(
            'if [ -z "${RELEASE_GPG_PASSPHRASE:-}" ]; then'
        );
        expect(check.run).toContain('MISSING="${MISSING} GPG_PASSPHRASE"');
        expect(check.run).toContain('::error title=Release secrets missing::');
        expect(check.run).toContain('v3-release-machine-user Environment');
        expect(check.run).toContain('exit 1');
    });

    it('builds with the Step 1 build script and stages only the bundles', () => {
        const text = runText(BUILD_JOB);
        const stage = step(BUILD_JOB, 'Stage the release bundles').run;

        expect(text).toContain('sh ./scripts/build-v3-release.sh "$VERSION"');
        expect(text).toContain('git add -f -- dist');
        expect(text).toContain(
            "find kits -type d -name dist -not -path '*/node_modules/*'"
        );
        // Every change under kits is staged before the outside-bundle check,
        // so a removed kit dist and a new file outside dist both show.
        expect(stage.indexOf('git add -A -- kits')).toBeGreaterThan(-1);
        expect(stage.indexOf('git add -A -- kits')).toBeLessThan(
            stage.indexOf('OTHER=')
        );
        expect(text).toContain(
            "':(exclude)dist' ':(exclude,glob)kits/**/dist/**'"
        );
    });

    it('signs the commit with the same GPG import as Step 1', () => {
        const stepOne = load(STEP_ONE_PATH);
        const stepOneImport = stepOne.jobs.release.steps.find(
            (candidate: any) => candidate.name === 'Import GPG Key'
        );
        const gpg = step(COMMIT_JOB, 'Import GPG Key');

        expect(gpg.uses).toBe(stepOneImport.uses);
        expect(gpg.with).toEqual(stepOneImport.with);
    });

    it('commits only when the bundles changed, and never with [skip ci]', () => {
        const commit = step(COMMIT_JOB, 'Commit and push the release bundles');
        const apply = step(COMMIT_JOB, 'Apply the bundle patch');

        expect(apply.run).toContain(
            'git apply --index --binary "$RUNNER_TEMP/bundles/bundles.patch"'
        );
        expect(commit.run).toContain(
            'git commit -m "chore(build): generate V3 release bundles for ${VERSION}"'
        );
        expect(read(DIST_PATH)).not.toContain('[skip ci]');
        expect(BUILD_JOB.if).toContain(
            "!startsWith(github.event.head_commit.message, 'chore(build): generate V3 release bundles')"
        );
    });

    it('pushes only when the branch has not moved since the build started', () => {
        const commit = step(COMMIT_JOB, 'Commit and push the release bundles');

        expect(commit.run).toContain('if [ "$REMOTE_SHA" != "$BUILT_SHA" ]; then');
        expect(commit.run).toContain(
            'git push origin "HEAD:refs/heads/${BRANCH}"'
        );
    });
});

describe('V3 release bundle check', () => {
    it('runs on every pull request to main', () => {
        expect(CHECK.on).toEqual({ pull_request: { branches: ['main'] } });
    });

    it('keeps a stable check name and never reports as skipped', () => {
        expect(Object.keys(CHECK.jobs)).toEqual(['dist-matches-version']);
        expect(CHECK_JOB.name).toBe('V3 release bundles match version');
        expect(CHECK_JOB.if).toBeUndefined();
        expect(step(CHECK_JOB, 'Find the release branch').if).toBeUndefined();
    });

    it('checks only the same-repository Release Please branch', () => {
        const scope = step(CHECK_JOB, 'Find the release branch');

        expect(scope.run).toContain(
            'release-please--branches--main|release-please--branches--main--components--*)'
        );
        expect(scope.run).toContain(
            'if [ "$HEAD_REPOSITORY" = "$BASE_REPOSITORY" ]; then'
        );
    });

    it('builds the pull request head read-only and fails on any difference', () => {
        const checkout = step(CHECK_JOB, 'Checkout the pull request head');
        const compare = step(
            CHECK_JOB,
            'Compare the build with the committed bundles'
        );

        expect(checkout.with).toEqual({
            ref: '${{ github.event.pull_request.head.sha }}',
            'persist-credentials': false,
        });
        expect(CHECK.permissions).toEqual({});
        expect(CHECK_JOB.permissions).toEqual({ contents: 'read' });
        expect(runText(CHECK_JOB)).toContain(
            'sh ./scripts/build-v3-release.sh "$VERSION"'
        );
        expect(compare.run).toContain(
            'CHANGED="$(git status --porcelain --untracked-files=no)"'
        );
        expect(compare.run.indexOf('git add -A -- kits')).toBeGreaterThan(-1);
        expect(compare.run.indexOf('git add -A -- kits')).toBeLessThan(
            compare.run.indexOf('CHANGED=')
        );
        expect(compare.run).not.toContain('git commit');
        expect(compare.run).not.toContain('git push');
    });
});

describe('V3 Release Please workflows', () => {
    it.each([
        ['build-dist', BUILD_JOB],
        ['commit-dist', COMMIT_JOB],
        ['dist-matches-version', CHECK_JOB],
    ])('%s pins every action to a commit SHA', (_jobName, job) => {
        for (const candidate of steps(job)) {
            if (candidate.uses) {
                expect(candidate.uses).toMatch(PINNED_USES);
            }
        }
    });

    it.each([
        ['build-dist', BUILD_JOB],
        ['commit-dist', COMMIT_JOB],
        ['dist-matches-version', CHECK_JOB],
    ])('%s passes values to shell steps through env only', (_jobName, job) => {
        expect(runText(job)).not.toContain('${{');
    });
});
