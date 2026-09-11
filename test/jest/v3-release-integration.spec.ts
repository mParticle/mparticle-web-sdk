/* eslint-env jest, node, es2021 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const {load} = require('js-yaml');
const root = path.resolve(__dirname, '../..');
const workflows = path.join(root, '.github/workflows');
const fixtures = path.join(root, 'test/fixtures/release-workflows-v2');
const fixtureBaseCommit = '976050345d730d4a571ba9792592dcf3559212c8';

function source(name: string) {
    return fs.readFileSync(path.join(workflows, name), 'utf8');
}

function yaml(name: string) {
    return load(source(name));
}

function fixture(name: string) {
    return fs.readFileSync(path.join(fixtures, name), 'utf8');
}

function allRunText(workflow: any) {
    return Object.values(workflow.jobs)
        .flatMap((job: any) => job.steps || [])
        .map((step: any) => step.run || '')
        .join('\n');
}

describe('v2 extraction compatibility contract', () => {
    it.each(['1', '2', '3'])(
        'preserves Step %s jobs, topology, commands, and permissions',
        step => {
            const filename = `staging-step-${step}.yml`;
            const before = load(fixture(filename));
            const after = yaml(`reusable-v2-${filename}`);
            expect(Object.keys(after.on)).toEqual(['workflow_call']);
            expect(Object.keys(after.jobs)).toEqual(Object.keys(before.jobs));
            expect(after.on.workflow_call.inputs).not.toHaveProperty('version');
            expect(source(`reusable-v2-${filename}`)).not.toContain(
                '< VERSION'
            );

            for (const [name, originalJob] of Object.entries(before.jobs)) {
                const extractedJob = after.jobs[name];
                for (const field of [
                    'needs',
                    'if',
                    'permissions',
                    'uses',
                    'with',
                    'environment',
                    'strategy',
                    'outputs',
                ]) {
                    expect(extractedJob[field]).toEqual((originalJob as any)[field]);
                }
            }

            expect(Object.keys(after.on.workflow_call.inputs)).toEqual(
                Object.keys(before.on.workflow_dispatch.inputs)
            );
            for (const [name, input] of Object.entries(
                before.on.workflow_dispatch.inputs
            )) {
                expect(after.on.workflow_call.inputs[name].required).toBe(
                    (input as any).required
                );
                if ((input as any).default !== undefined) {
                    expect(after.on.workflow_call.inputs[name].default).toBe(
                        (input as any).default
                    );
                }
            }

            const requiredCommands: Record<string, string[]> = {
                '1': [
                    'npm ci',
                    'npm run lint',
                    'npm run prettier',
                    'npm run build:iife',
                    'npm run test:jest',
                    'npx semantic-release --branches "$STAGING_BRANCH"',
                    'git push origin "HEAD:${RELEASE_BRANCH}"',
                ],
                '2': [
                    'git fetch --no-tags --force origin',
                    'git checkout --detach "$CANDIDATE_SHA"',
                    'git push origin "HEAD:refs/heads/${TARGET_BRANCH}"',
                ],
                '3': [
                    'git checkout --detach "$CANDIDATE_SHA"',
                    'git push --atomic origin',
                    'HEAD:refs/heads/${DEVELOPMENT_BRANCH}',
                    'HEAD:refs/heads/${TRUNK_BRANCH}',
                ],
            };
            const originalCommands = allRunText(before);
            const extractedCommands = allRunText(after);
            requiredCommands[step].forEach(command => {
                expect(originalCommands).toContain(command);
                expect(extractedCommands).toContain(command);
            });
        }
    );

    it('pins fixtures to the explicit pre-extraction main commit', () => {
        const expectedHashes: Record<string, string> = {
            '1': '7d113b60dbefa02541fe530972e9fccf37e784d288f7dc318dfa96ee437ac0e6',
            '2': '0409c9d89905510c14d09bf60bbfba25b9646da1bfef8f6d0fc5a6c3a22d9859',
            '3': '8939c9018c6f0b52c7efbd32cb8b8d3ee2f1a2c47d5d9f1840946bb5c308fe4b',
        };
        for (const step of ['1', '2', '3']) {
            const contents = fixture(`staging-step-${step}.yml`);
            expect(
                crypto.createHash('sha256').update(contents).digest('hex')
            ).toBe(expectedHashes[step]);
            expect(contents).toBe(
                require('child_process').execFileSync(
                    'git',
                    [
                        'show',
                        `${fixtureBaseCommit}:.github/workflows/staging-step-${step}.yml`,
                    ],
                    {cwd: root, encoding: 'utf8'}
                )
            );
        }
    });

    it('retains semantic-release, latest, and the five-ref v2 topology', () => {
        const one = source('reusable-v2-staging-step-1.yml');
        const three = source('reusable-v2-staging-step-3.yml');
        expect(one).toContain('npx semantic-release');
        expect(one).toContain('NPM_DIST_TAG="latest"');
        expect(one).toContain('DEVELOPMENT_BRANCH="development"');
        expect(three).toContain('"v2|staging|development|master|release-order-a|release-order-b|release-order-c"');
        expect(three).toContain('HEAD:refs/heads/${DEVELOPMENT_BRANCH}');
    });
});

describe('stable static dispatch surface', () => {
    it.each(['1', '2', '3'])('uses only explicit static Step %s calls', step => {
        const workflow = yaml(`staging-step-${step}.yml`);
        const reusableJobs = Object.values(workflow.jobs).filter(
            (job: any) => job.uses
        ) as any[];
        expect(reusableJobs).toHaveLength(2);
        expect(reusableJobs.map(job => job.uses).sort()).toEqual([
            `./.github/workflows/reusable-v2-staging-step-${step}.yml`,
            `./.github/workflows/reusable-v3-staging-step-${step}.yml`,
        ]);
        reusableJobs.forEach(job => {
            expect(job.uses).not.toContain('${{');
            expect(job.if).toBeTruthy();
        });
    });

    it('keeps v2 and v3 routes mutually exclusive', () => {
        const one = yaml('staging-step-1.yml');
        expect(one.jobs.v2.if).toBe("inputs.track == 'v2'");
        expect(one.jobs.v3.if).toContain("inputs.track == 'v3'");
        for (const step of ['2', '3']) {
            const workflow = yaml(`staging-step-${step}.yml`);
            expect(workflow.jobs.v2.if).toContain("startsWith(inputs.releaseTag, 'v2.')");
            expect(workflow.jobs.v3.if).toContain("!startsWith(inputs.releaseTag, 'v2.')");
        }
    });

    it('retains trusted publisher filename and isolates permissions', () => {
        const one = yaml('staging-step-1.yml');
        expect(path.basename(path.join(workflows, 'staging-step-1.yml'))).toBe(
            'staging-step-1.yml'
        );
        expect(one.jobs.v3.permissions).toMatchObject({
            attestations: 'write',
            contents: 'write',
            'id-token': 'write',
            packages: 'write',
        });
        expect(one.jobs.v2.permissions).not.toHaveProperty('attestations');
        expect(one.jobs.v2.permissions).not.toHaveProperty('packages');
        expect(source('staging-step-2.yml')).not.toContain('id-token');
        expect(source('staging-step-3.yml')).not.toContain('id-token');
        expect(source('staging-step-1.yml')).not.toContain('secrets: inherit');
    });

    it('routes v3 only through protected main and never v3-development', () => {
        for (const name of [
            'staging-step-1.yml',
            'staging-step-2.yml',
            'staging-step-3.yml',
        ]) {
            const text = source(name);
            expect(text).toContain('refs/heads/main');
            expect(text).not.toContain('v3-development');
            expect(text).toContain('GITHUB_WORKFLOW_REF');
        }
    });
});

describe('trusted caller, freeze, rejection, and concurrency contracts', () => {
    it('authenticates exact top-level callers in every reusable workflow', () => {
        const names = fs
            .readdirSync(workflows)
            .filter(name => /^reusable-v[23]-.*\.yml$/.test(name));
        for (const name of names) {
            const text = source(name);
            expect(text).toContain('GITHUB_REPOSITORY');
            expect(text).toContain('GITHUB_WORKFLOW_REF');
            expect(text).toContain('GITHUB_EVENT_NAME');
        }
    });

    it('runs freeze policy from trusted base code without executing PR head', () => {
        const top = yaml('v3-freeze-check.yml');
        expect(Object.keys(top.on).sort()).toEqual([
            'pull_request_review',
            'pull_request_target',
        ]);
        expect(top.on.pull_request_target.types).toEqual(
            expect.arrayContaining(['edited', 'labeled', 'unlabeled'])
        );
        expect(top.on.pull_request_review.types).toEqual(
            expect.arrayContaining(['edited', 'dismissed', 'submitted'])
        );
        const reusable = yaml('reusable-v3-freeze-check.yml');
        const checkouts = reusable.jobs['validate-freeze'].steps.filter(
            (step: any) => step.uses?.startsWith('actions/checkout@')
        );
        expect(checkouts).toHaveLength(1);
        expect(checkouts[0].with.ref).toBe('${{ inputs.base_sha }}');
        expect(allRunText(reusable)).not.toMatch(
            /(?:node|npm|bash|sh)\s+.*HEAD_SHA/
        );
        expect(allRunText(reusable)).toContain(
            'refs/pull/${PR_NUMBER}/merge'
        );
        expect(allRunText(reusable)).toContain(
            '.head.repo.full_name == env.GITHUB_REPOSITORY'
        );
    });

    it('uses explicit authenticated rejection because denial evidence is unavailable', () => {
        const rejection = source('reusable-v3-reject.yml');
        expect(rejection).toContain('do not expose a reliable');
        expect(rejection).toContain('lifecycle-record.js reject');
        expect(rejection).toContain('actions/runs/${ORIGIN_RUN_ID}');
        expect(rejection).toContain('candidate-manifest.json');
        expect(rejection).not.toContain('workflow_run');
        expect(source('reusable-v3-staging-step-1.yml')).toContain(
            'workflow failure is never interpreted as rejection'
        );
    });

    it('keeps v2 runs independent and shares immutable v3 concurrency', () => {
        const groups = ['1', '2', '3'].map(
            step => yaml(`staging-step-${step}.yml`).concurrency.group
        );
        expect(groups).toEqual([
            "${{ inputs.track == 'v2' && format('mparticle-web-sdk-v2-step-1-run-{0}', github.run_id) || format('mparticle-web-sdk-v3-release-v{0}', inputs.version) }}",
            "${{ startsWith(inputs.releaseTag, 'v2.') && format('mparticle-web-sdk-v2-step-2-run-{0}', github.run_id) || format('mparticle-web-sdk-v3-release-{0}', inputs.releaseTag) }}",
            "${{ startsWith(inputs.releaseTag, 'v2.') && format('mparticle-web-sdk-v2-step-3-run-{0}', github.run_id) || format('mparticle-web-sdk-v3-release-{0}', inputs.releaseTag) }}",
        ]);
        groups.forEach((group, index) => {
            expect(group).toContain(
                `mparticle-web-sdk-v2-step-${index + 1}-run-{0}`
            );
            expect(group).toContain('github.run_id');
        });
        expect(new Set([101, 102].map(run => `v2-step-2-run-${run}`)).size)
            .toBe(2);
        expect(groups[0]).toContain('mparticle-web-sdk-v3-release-v{0}');
        expect(groups[1]).toContain('mparticle-web-sdk-v3-release-{0}');
        expect(groups[2]).toContain('mparticle-web-sdk-v3-release-{0}');
        expect(yaml('v3-release-reject.yml').concurrency.group).toContain(
            'mparticle-web-sdk-v3-release-v'
        );
    });

    it('prevents caller/callee concurrency collisions for every reusable call', () => {
        for (const callerName of fs
            .readdirSync(workflows)
            .filter(name => !name.startsWith('reusable-') && name.endsWith('.yml'))) {
            const caller = yaml(callerName);
            for (const job of Object.values(caller.jobs || {}) as any[]) {
                if (!job.uses?.startsWith('./.github/workflows/reusable-')) {
                    continue;
                }
                const calleeName = path.basename(job.uses);
                const callee = yaml(calleeName);
                if (caller.concurrency?.group && callee.concurrency?.group) {
                    expect(callee.concurrency.group).not.toBe(
                        caller.concurrency.group
                    );
                }
                if (calleeName === 'reusable-v2-staging-step-1.yml') {
                    expect(callee.concurrency).toBeUndefined();
                    expect(caller.concurrency.group).toBe(
                        "${{ inputs.track == 'v2' && format('mparticle-web-sdk-v2-step-1-run-{0}', github.run_id) || format('mparticle-web-sdk-v3-release-v{0}', inputs.version) }}"
                    );
                }
            }
        }
    });

    it('supplies reusable inputs, secrets, and permissions explicitly', () => {
        for (const callerName of fs
            .readdirSync(workflows)
            .filter(name => !name.startsWith('reusable-') && name.endsWith('.yml'))) {
            const caller = yaml(callerName);
            for (const job of Object.values(caller.jobs || {}) as any[]) {
                if (!job.uses?.startsWith('./.github/workflows/reusable-')) {
                    continue;
                }
                const callee = yaml(path.basename(job.uses));
                for (const [name, input] of Object.entries(
                    callee.on.workflow_call.inputs || {}
                ) as Array<[string, any]>) {
                    if (input.required) {
                        expect(job.with).toHaveProperty(name);
                    }
                }
                for (const [name, secret] of Object.entries(
                    callee.on.workflow_call.secrets || {}
                ) as Array<[string, any]>) {
                    if (secret.required) {
                        expect(job.secrets).toHaveProperty(name);
                    }
                }
                expect(job.secrets).not.toBe('inherit');
                const rank: Record<string, number> = {
                    none: 0,
                    read: 1,
                    write: 2,
                };
                for (const [permission, level] of Object.entries(
                    callee.permissions || {}
                )) {
                    expect(rank[job.permissions?.[permission] || 'none']).toBeGreaterThanOrEqual(
                        rank[level as string]
                    );
                }
            }
        }
    });

    it('places activation gates before every mutating v3 entry point', () => {
        const entries: Array<[string, string]> = [
            ['v3-release-intent.yml', 'authenticate'],
            ['v3-release-cycle.yml', 'authenticate'],
            ['v3-release-source-update.yml', 'authenticate'],
            ['v3-release-reject.yml', 'reject'],
            ['reusable-v3-release-intent.yml', 'create-intent'],
            ['reusable-v3-release-cycle.yml', 'start-cycle'],
            ['reusable-v3-release-source-update.yml', 'record-source-update'],
            ['reusable-v3-reject.yml', 'reject'],
            ['reusable-v3-staging-step-1.yml', 'validate-contract'],
            ['reusable-v3-staging-step-2.yml', 'promote-one-release-order'],
            ['reusable-v3-staging-step-3.yml', 'promote-final-destinations'],
        ];
        for (const [name, firstJob] of entries) {
            expect(yaml(name).jobs[firstJob].if).toContain(
                "vars.V3_RELEASE_ACTIVATED == 'true'"
            );
        }
        for (const step of ['1', '2', '3']) {
            const text = source(`staging-step-${step}.yml`);
            expect(text.indexOf('V3_RELEASE_ACTIVATED')).toBeLessThan(
                text.indexOf('uses: ./.github/workflows/reusable-v3-')
            );
        }
        const freeze = yaml('v3-freeze-check.yml');
        expect(freeze.jobs.disabled.if).toContain(
            "vars.V3_RELEASE_ACTIVATED != 'true'"
        );
        expect(allRunText(freeze)).toContain('freeze is a no-op');
    });

    it('keeps exact-artifact and downstream completion invariants', () => {
        const two = source('reusable-v3-staging-step-2.yml');
        const three = source('reusable-v3-staging-step-3.yml');
        expect(two).not.toMatch(/npm publish|npm pack|refs\/heads\/main:/);
        expect(three).not.toContain('v3-development');
        expect(three).toContain('--atomic true');
        expect(three).toContain(
            'Require downstream exact served-artifact validation'
        );
        expect(three.indexOf('Require downstream exact served-artifact validation'))
            .toBeLessThan(three.indexOf('Complete durable cycle'));
        expect(three).toContain(
            'Freeze-ruleset removal remains an external operation'
        );
    });
});
