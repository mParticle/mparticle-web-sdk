import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const yaml = require('js-yaml');

const REPO_ROOT = path.join(__dirname, '../..');

function read(relativePath: string): string {
    return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

const WORKFLOW = yaml.load(read('.github/workflows/v3-release-please.yml'));
const JOB = WORKFLOW.jobs['release-please'];
const ACTION_STEP = JOB.steps.find(
    (step: any) => step.name === 'Run Release Please'
);
const PR_WORKFLOW = yaml.load(read('.github/workflows/pull-request.yml'));
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
    });

    it('passes values to shell steps through env only', () => {
        for (const step of JOB.steps) {
            expect(step.run || '').not.toContain('${{');
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
