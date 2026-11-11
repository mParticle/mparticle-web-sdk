import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const yaml = require('js-yaml');

const REPO_ROOT = path.join(__dirname, '../..');

function read(relativePath: string): string {
    return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

const WORKFLOW = yaml.load(read('.github/workflows/v3-release-please.yml'));
const JOB = WORKFLOW.jobs['release-please'];
const DISPATCH_JOB = WORKFLOW.jobs['dispatch-step-1'];
const ACTION_STEP = JOB.steps.find(
    (step: any) => step.name === 'Run Release Please'
);
const DISPATCH_STEP = DISPATCH_JOB.steps.find(
    (step: any) => step.name === 'Dispatch V3 Release - Step 1'
);
const PR_WORKFLOW = yaml.load(read('.github/workflows/pull-request.yml'));

function runDispatchStep(env: Record<string, string>) {
    const root = fs.realpathSync(
        fs.mkdtempSync(path.join(os.tmpdir(), 'mparticle-rp-dispatch-'))
    );
    const bin = path.join(root, 'bin');
    const callsFile = path.join(root, 'gh-calls.txt');
    const summaryFile = path.join(root, 'summary.md');
    fs.mkdirSync(bin);
    fs.writeFileSync(
        path.join(bin, 'gh'),
        `#!/bin/sh\nprintf '%s|%s|%s\\n' "\${GH_TOKEN:-}" "\${GH_REPO:-}" "$*" >> '${callsFile}'\n`,
        { mode: 0o755 }
    );
    try {
        const result = spawnSync(
            'bash',
            ['--noprofile', '--norc', '-eo', 'pipefail', '-c', DISPATCH_STEP.run],
            {
                cwd: root,
                encoding: 'utf8',
                env: {
                    ...process.env,
                    PATH: `${bin}:${process.env.PATH}`,
                    GH_TOKEN: 'ghs_builtin_token',
                    GH_REPO: 'mParticle/mparticle-web-sdk',
                    GITHUB_STEP_SUMMARY: summaryFile,
                    ...env,
                },
            }
        );
        return {
            status: result.status,
            output: `${result.stdout}${result.stderr}`,
            calls: fs.existsSync(callsFile)
                ? fs.readFileSync(callsFile, 'utf8').trim().split('\n')
                : [],
            summary: fs.existsSync(summaryFile)
                ? fs.readFileSync(summaryFile, 'utf8')
                : '',
        };
    } finally {
        fs.rmSync(root, { force: true, recursive: true });
    }
}
const REQUIRED_UPSTREAM_JOBS = [
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

describe('V3 Release Please on main', () => {
    it('runs on pushes to main behind the kill switch', () => {
        expect(WORKFLOW.on).toEqual({ push: { branches: ['main'] } });
        expect(JOB.if).toContain("vars.V3_RELEASE_PLEASE_ENABLED == 'true'");
        expect(WORKFLOW.concurrency).toEqual({
            group: 'v3-release-please',
            'cancel-in-progress': false,
        });
    });

    it('runs a pinned Release Please action as the release machine user', () => {
        expect(ACTION_STEP.uses).toMatch(
            /^googleapis\/release-please-action@[0-9a-f]{40}$/
        );
        expect(ACTION_STEP.with).toEqual({
            token: '${{ secrets.MP_SEMANTIC_RELEASE_BOT }}',
            'target-branch': 'main',
            'config-file': 'release-please-config.json',
            'manifest-file': '.release-please-manifest.json',
        });
        expect(WORKFLOW.permissions).toEqual({});
        expect(JOB.permissions).toEqual({ contents: 'read' });
        expect(JOB.steps).toHaveLength(1);
        expect(JOB.outputs).toEqual({
            release_created: '${{ steps.release.outputs.release_created }}',
            tag_name: '${{ steps.release.outputs.tag_name }}',
        });
    });

    it('dispatches V3 Step 1 in a separate least-privilege job with the built-in token only when a strict v3.X.Y release was created while enabled', () => {
        expect(DISPATCH_JOB).toBeDefined();
        expect(DISPATCH_JOB.needs).toBe('release-please');
        expect(DISPATCH_JOB.permissions).toEqual({ actions: 'write' });
        expect(DISPATCH_STEP).toBeDefined();
        const condition = String(DISPATCH_JOB.if).replace(/\s+/g, ' ');
        expect(condition).toContain("github.repository_owner == 'mParticle'");
        expect(condition).toContain("vars.V3_RELEASE_PLEASE_ENABLED == 'true'");
        expect(condition).toContain(
            "needs.release-please.outputs.release_created == 'true'"
        );
        expect(condition).toContain(
            "startsWith(needs.release-please.outputs.tag_name, 'v3.')"
        );
        expect(DISPATCH_STEP.env).toEqual({
            GH_TOKEN: '${{ github.token }}',
            GH_REPO: '${{ github.repository }}',
            RELEASE_PLEASE_ENABLED: '${{ vars.V3_RELEASE_PLEASE_ENABLED }}',
            RELEASE_CREATED:
                '${{ needs.release-please.outputs.release_created }}',
            TAG_NAME: '${{ needs.release-please.outputs.tag_name }}',
        });

        for (const tag of ['v3.0.0', 'v3.32.0', 'v3.32.1']) {
            const run = runDispatchStep({
                RELEASE_PLEASE_ENABLED: 'true',
                RELEASE_CREATED: 'true',
                TAG_NAME: tag,
            });
            expect(run.status).toBe(0);
            expect(run.calls).toEqual([
                `ghs_builtin_token|mParticle/mparticle-web-sdk|workflow run v3-release-step-1.yml --ref ${tag} -f dryRun=false`,
            ]);
            expect(run.summary).toContain(`- Tag: \`${tag}\``);
            expect(run.summary).toContain(
                `gh workflow run v3-release-step-1.yml --ref ${tag} -f dryRun=false`
            );
            expect(run.summary).toContain('v3-release-publish');
        }

        for (const enabled of ['', 'false', 'TRUE', '1']) {
            const run = runDispatchStep({
                RELEASE_PLEASE_ENABLED: enabled,
                RELEASE_CREATED: 'true',
                TAG_NAME: 'v3.32.0',
            });
            expect(run.status).toBe(1);
            expect(run.calls).toEqual([]);
        }

        for (const created of ['', 'false', 'TRUE']) {
            const run = runDispatchStep({
                RELEASE_PLEASE_ENABLED: 'true',
                RELEASE_CREATED: created,
                TAG_NAME: 'v3.32.0',
            });
            expect(run.status).toBe(1);
            expect(run.calls).toEqual([]);
        }

        for (const badTag of [
            '',
            'v3.32.0-rc.1',
            'v3.032.0',
            'v3.32.00',
            'v3.32',
            'v4.0.0',
            'v2.1.0',
            '3.32.0',
            'v3.32.0\nv3.33.0',
        ]) {
            const run = runDispatchStep({
                RELEASE_PLEASE_ENABLED: 'true',
                RELEASE_CREATED: 'true',
                TAG_NAME: badTag,
            });
            expect(run.status).toBe(1);
            expect(run.calls).toEqual([]);
        }
    });

    it('passes values to shell steps through env only', () => {
        for (const job of Object.values(WORKFLOW.jobs) as any[]) {
            for (const step of job.steps) {
                expect(step.run || '').not.toContain('${{');
            }
        }
    });

    it('points every Dependabot update at main', () => {
        const dependabot = yaml.load(read('.github/dependabot.yml'));

        for (const update of dependabot.updates) {
            if (update['target-branch'] !== undefined) {
                expect(update['target-branch']).toBe('main');
            }
        }
        expect(read('.github/dependabot.yml')).not.toContain('v3-development');
    });

    it('decouples stub and integration PR checks from optional kit tests and aggregates required checks', () => {
        expect(PR_WORKFLOW.on).toBe('pull_request');

        for (const jobName of REQUIRED_UPSTREAM_JOBS.slice(3)) {
            expect(PR_WORKFLOW.jobs[jobName].needs).toEqual([
                'test-core',
                'test-jest',
                'build-bundle',
            ]);
        }
        expect(PR_WORKFLOW.jobs['cdn-minifier-check'].needs).toContain(
            'run-kit-tests'
        );

        const aggregator = PR_WORKFLOW.jobs['required-checks'];
        expect(aggregator).toBeDefined();
        expect(aggregator.name).toBe('Required checks');
        expect(aggregator.if).toBe('always()');
        expect(aggregator['runs-on']).toBe('ubuntu-latest');
        expect(aggregator['timeout-minutes']).toBe(5);
        expect(aggregator.permissions).toEqual({});
        expect(aggregator.needs).toEqual(REQUIRED_UPSTREAM_JOBS);

        const integrationJobs = Object.keys(PR_WORKFLOW.jobs).filter(jobName =>
            jobName.startsWith('test-integrations-')
        );
        expect(integrationJobs.length).toBeGreaterThan(0);

        const gatedJobs = ['test-core', 'test-stub', ...integrationJobs];
        const assertRecursiveNeedsCovered = (
            jobs: Record<string, any>,
            aggregatorNeeds: string[]
        ) => {
            const queue = [...gatedJobs];
            const visited = new Set<string>();
            const upstreamNeeds: string[] = [];

            while (queue.length > 0) {
                const jobName = queue.shift() as string;
                if (visited.has(jobName)) {
                    continue;
                }
                visited.add(jobName);
                expect(aggregatorNeeds).toContain(jobName);

                const rawNeeds = jobs[jobName]?.needs;
                const jobNeeds = Array.isArray(rawNeeds)
                    ? rawNeeds
                    : rawNeeds
                    ? [rawNeeds]
                    : [];
                // Optional kit tests stay out of required-checks; fail if a gated job needs run-kit-tests.
                expect(jobNeeds).not.toContain('run-kit-tests');
                const requiredJobNeeds = jobNeeds;
                if (gatedJobs.includes(jobName)) {
                    expect(requiredJobNeeds.length).toBeGreaterThan(0);
                }
                for (const upstream of requiredJobNeeds) {
                    expect(aggregatorNeeds).toContain(upstream);
                    upstreamNeeds.push(upstream);
                    if (!visited.has(upstream)) {
                        queue.push(upstream);
                    }
                }
            }
            expect(upstreamNeeds.length).toBeGreaterThan(0);
            expect(aggregatorNeeds).not.toContain('run-kit-tests');
        };

        assertRecursiveNeedsCovered(PR_WORKFLOW.jobs, aggregator.needs);
        expect(() =>
            assertRecursiveNeedsCovered(
                {
                    ...PR_WORKFLOW.jobs,
                    'test-jest': {
                        ...PR_WORKFLOW.jobs['test-jest'],
                        needs: ['unlisted-upstream'],
                    },
                },
                aggregator.needs
            )
        ).toThrow('unlisted-upstream');

        const step = aggregator.steps[0];
        expect(step.env).toEqual({ NEEDS_JSON: '${{ toJson(needs) }}' });
        expect(step.run).not.toContain('${{');

        const allSuccess = Object.fromEntries(
            REQUIRED_UPSTREAM_JOBS.map(jobName => [
                jobName,
                { result: 'success' },
            ])
        );
        const passRun = spawnSync('bash', ['-c', step.run], {
            env: {
                ...process.env,
                NEEDS_JSON: JSON.stringify(allSuccess),
            },
            encoding: 'utf8',
        });
        expect(passRun.status).toBe(0);

        for (const jobName of REQUIRED_UPSTREAM_JOBS) {
            for (const nonSuccess of ['skipped', 'failure', 'cancelled', '']) {
                const needsPayload = {
                    ...allSuccess,
                    [jobName]: { result: nonSuccess },
                };
                const failRun = spawnSync('bash', ['-c', step.run], {
                    env: {
                        ...process.env,
                        NEEDS_JSON: JSON.stringify(needsPayload),
                    },
                    encoding: 'utf8',
                });
                expect(failRun.status).toBe(1);
                expect(failRun.stderr).toContain(jobName);
            }
        }
    });
});
