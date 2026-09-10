/* eslint-env jest, node, es2021 */
/* eslint-disable no-undef */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {execFileSync} from 'child_process';
import {EventEmitter} from 'events';

const {load} = require('js-yaml');
const {canonicalJson, createReleaseEnvelope} = require(
    '../../scripts/release/candidate-manifest'
);
const {loadV3PackageInventory} = require(
    '../../scripts/release/package-inventory'
);
const {
    buildPushArguments,
    createStep2Plan,
    createStep3Execution,
    createStep3Plan,
    downstreamRequestId,
    requestDownstreamValidation,
    validateDownstreamReceipt,
    verifyPublishedRelease,
} = require('../../scripts/release/promotion');
const {appendLifecycleStatus, createLifecycleStatusRequest} = require(
    '../../scripts/release/lifecycle-record'
);

type Step = {name?: string; run?: string; uses?: string};
type Job = {
    permissions?: Record<string, string>;
    steps: Step[];
};
type Workflow = {
    on: Record<string, {inputs?: Record<string, unknown>}>;
    permissions: Record<string, string>;
    jobs: Record<string, Job>;
};

const repositoryRoot = path.resolve(__dirname, '../..');
const sourceSha = '1'.repeat(40);
const candidateSha = '2'.repeat(40);
const manifestSha = '3'.repeat(64);
const cycleSha = '7'.repeat(64);
const branchShas = {
    main: sourceSha,
    'v3-release-order-a': 'a'.repeat(40),
    'v3-release-order-b': 'b'.repeat(40),
    'v3-release-order-c': 'c'.repeat(40),
};

function workflow(name: string) {
    const filename = `.github/workflows/reusable-v3-staging-step-${name}.yml`;
    const source = fs.readFileSync(path.join(repositoryRoot, filename), 'utf8');
    return {source, value: load(source) as Workflow};
}

function allRunText(value: Workflow) {
    return Object.values(value.jobs)
        .flatMap(job => job.steps)
        .map(step => step.run || '')
        .join('\n');
}

function lifecycleOptions(statuses: unknown[], deploymentOverrides = {}) {
    const workflowIdentity = {
        repository: 'mParticle/mparticle-web-sdk',
        run_attempt: 1,
        run_id: 123,
        workflow_ref:
            'mParticle/mparticle-web-sdk/.github/workflows/' +
            'staging-step-1.yml@refs/heads/main',
    };
    return {
        candidateSha,
        cycleDeploymentId: 81,
        cycleId: cycleSha,
        deployment: {
            creator: {login: 'github-actions[bot]'},
            environment: 'v3-release-lifecycle',
            id: 77,
            payload: {
                actions_artifacts: [{digest: '6'.repeat(64), id: 456}],
                caller_workflow: workflowIdentity,
                candidate_sha: candidateSha,
                cycle_deployment_id: 81,
                cycle_id: cycleSha,
                manifest_sha256: manifestSha,
                originating_run: workflowIdentity,
                schema_version: 1,
                signer_workflow: {
                    digest: sourceSha,
                    repository: 'mParticle/mparticle-web-sdk',
                    workflow:
                        'github.com/mParticle/mparticle-web-sdk/.github/' +
                        'workflows/reusable-v3-staging-step-1.yml',
                },
                source_sha: sourceSha,
                stable_tag: 'v3.1.0',
                version: '3.1.0',
            },
            ref: candidateSha,
            repository_url:
                'https://api.github.com/repos/mParticle/mparticle-web-sdk',
            ...deploymentOverrides,
        },
        manifestSha256: manifestSha,
        repository: 'mParticle/mparticle-web-sdk',
        state: 'promoted',
        statuses,
        version: '3.1.0',
    };
}

describe('shared v3 promotion mutation primitives', () => {
    it.each([
        'v3-release-order-a',
        'v3-release-order-b',
        'v3-release-order-c',
    ])('allows Step 2 target %s', target => {
        expect(
            createStep2Plan({
                candidateSha,
                destinations: [
                    {
                        branch: target,
                        currentSha: branchShas[target],
                        expectedSha: branchShas[target],
                    },
                ],
                isAncestor: () => true,
            })
        ).toEqual([{branch: target, expectedSha: branchShas[target]}]);
    });

    it.each(['main', 'v3-staging', 'v3-development', 'release-order-a'])(
        'rejects forbidden Step 2 target %s',
        target => {
            expect(() =>
                createStep2Plan({
                    candidateSha,
                    destinations: [
                        {
                            branch: target,
                            currentSha: sourceSha,
                            expectedSha: sourceSha,
                        },
                    ],
                    isAncestor: () => true,
                })
            ).toThrow('Forbidden promotion branch');
        }
    );

    it('rejects stale leases and non-fast-forward destinations', () => {
        expect(() =>
            createStep2Plan({
                candidateSha,
                destinations: [
                    {
                        branch: 'v3-release-order-a',
                        currentSha: '4'.repeat(40),
                        expectedSha: '5'.repeat(40),
                    },
                ],
                isAncestor: () => true,
            })
        ).toThrow('Stale expected SHA');
        expect(() =>
            createStep2Plan({
                candidateSha,
                destinations: [
                    {
                        branch: 'v3-release-order-a',
                        currentSha: branchShas['v3-release-order-a'],
                        expectedSha: branchShas['v3-release-order-a'],
                    },
                ],
                isAncestor: () => false,
            })
        ).toThrow('cannot fast-forward');
    });

    it('constructs one leased Step 2 refspec without a shell', () => {
        const plan = createStep2Plan({
            candidateSha,
            destinations: [
                {
                    branch: 'v3-release-order-b',
                    currentSha: branchShas['v3-release-order-b'],
                    expectedSha: branchShas['v3-release-order-b'],
                },
            ],
            isAncestor: () => true,
        });
        expect(buildPushArguments(candidateSha, plan, false)).toEqual([
            'push',
            `--force-with-lease=refs/heads/v3-release-order-b:${
                branchShas['v3-release-order-b']
            }`,
            'origin',
            `${candidateSha}:refs/heads/v3-release-order-b`,
        ]);
    });

    it('constructs exactly four atomic Step 3 leases and refspecs', () => {
        const destinations = Object.entries(branchShas).map(
            ([branch, expectedSha]) => ({
                branch,
                currentSha: expectedSha,
                expectedSha,
            })
        );
        const plan = createStep3Plan({
            candidateSha,
            destinations,
            isAncestor: () => true,
        });
        const args = buildPushArguments(candidateSha, plan, true);
        expect(plan.map((entry: {branch: string}) => entry.branch)).toEqual([
            'main',
            'v3-release-order-a',
            'v3-release-order-b',
            'v3-release-order-c',
        ]);
        expect(args[1]).toBe('--atomic');
        expect(args.filter((arg: string) => arg.startsWith('--force-with-lease')))
            .toHaveLength(4);
        expect(args.filter((arg: string) => arg.includes(':refs/heads/')))
            .toHaveLength(4);
        expect(args.join(' ')).not.toMatch(/v3-(?:development|staging)/);
    });

    it('rejects duplicate or incomplete Step 3 destinations', () => {
        expect(() =>
            createStep3Plan({
                candidateSha,
                destinations: [
                    {
                        branch: 'main',
                        currentSha: sourceSha,
                        expectedSha: sourceSha,
                    },
                    {
                        branch: 'main',
                        currentSha: sourceSha,
                        expectedSha: sourceSha,
                    },
                ],
                isAncestor: () => true,
            })
        ).toThrow('Duplicate promotion branch');
    });

    it('classifies only fully converged Step 3 as recovery', () => {
        const converged = Object.keys(branchShas).map(branch => ({
            branch,
            currentSha: candidateSha,
            expectedSha: branchShas[branch],
        }));
        expect(
            createStep3Execution({
                candidateSha,
                destinations: converged,
                isAncestor: () => true,
                sourceSha,
            })
        ).toEqual({mode: 'recovery', plan: []});
        converged[1].currentSha = branchShas['v3-release-order-a'];
        expect(() =>
            createStep3Execution({
                candidateSha,
                destinations: converged,
                isAncestor: () => true,
                sourceSha,
            })
        ).toThrow('mixed promotion state');
    });

    it('rejects stale one-ref leases against a local bare remote', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'v3-lease-'));
        try {
            const remote = path.join(root, 'remote.git');
            const work = path.join(root, 'work');
            execFileSync('git', ['init', '--bare', remote]);
            execFileSync('git', ['init', work]);
            const git = (...args: string[]) =>
                execFileSync('git', args, {cwd: work, encoding: 'utf8'}).trim();
            git('config', 'user.email', 'test@example.com');
            git('config', 'user.name', 'test');
            git('remote', 'add', 'origin', remote);
            fs.writeFileSync(path.join(work, 'file'), 'base');
            git('add', 'file');
            git('commit', '-m', 'base');
            const base = git('rev-parse', 'HEAD');
            git('branch', 'v3-release-order-a');
            fs.writeFileSync(path.join(work, 'file'), 'candidate');
            git('commit', '-am', 'candidate');
            const candidate = git('rev-parse', 'HEAD');
            git('push', 'origin', `${base}:refs/heads/v3-release-order-a`);
            git('checkout', '-b', 'racer', base);
            fs.writeFileSync(path.join(work, 'race'), 'race');
            git('add', 'race');
            git('commit', '-m', 'race');
            const raced = git('rev-parse', 'HEAD');
            git('push', 'origin', `${raced}:refs/heads/v3-release-order-a`);
            const args = buildPushArguments(
                candidate,
                [{branch: 'v3-release-order-a', expectedSha: base}],
                false
            );
            expect(() =>
                execFileSync('git', args, {cwd: work, stdio: 'pipe'})
            ).toThrow();
            expect(
                execFileSync(
                    'git',
                    ['--git-dir', remote, 'rev-parse', 'v3-release-order-a'],
                    {encoding: 'utf8'}
                ).trim()
            ).toBe(raced);
        } finally {
            fs.rmSync(root, {force: true, recursive: true});
        }
    });

    it('rejects an atomic stale lease without partial ref updates', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'v3-atomic-'));
        try {
            const remote = path.join(root, 'remote.git');
            const work = path.join(root, 'work');
            execFileSync('git', ['init', '--bare', remote]);
            execFileSync('git', ['init', work]);
            const git = (...args: string[]) =>
                execFileSync('git', args, {cwd: work, encoding: 'utf8'}).trim();
            git('config', 'user.email', 'test@example.com');
            git('config', 'user.name', 'test');
            git('remote', 'add', 'origin', remote);
            fs.writeFileSync(path.join(work, 'file'), 'base');
            git('add', 'file');
            git('commit', '-m', 'base');
            const base = git('rev-parse', 'HEAD');
            fs.writeFileSync(path.join(work, 'file'), 'candidate');
            git('commit', '-am', 'candidate');
            const candidate = git('rev-parse', 'HEAD');
            Object.keys(branchShas).forEach(branch =>
                git('push', 'origin', `${base}:refs/heads/${branch}`)
            );
            git('checkout', '-b', 'racer', base);
            fs.writeFileSync(path.join(work, 'race'), 'race');
            git('add', 'race');
            git('commit', '-m', 'race');
            const raced = git('rev-parse', 'HEAD');
            git('push', 'origin', `${raced}:refs/heads/v3-release-order-b`);
            const plan = Object.keys(branchShas).map(branch => ({
                branch,
                expectedSha: base,
            }));
            expect(() =>
                execFileSync(
                    'git',
                    buildPushArguments(candidate, plan, true),
                    {cwd: work, stdio: 'pipe'}
                )
            ).toThrow();
            Object.keys(branchShas).forEach(branch => {
                const actual = execFileSync(
                    'git',
                    ['--git-dir', remote, 'rev-parse', branch],
                    {encoding: 'utf8'}
                ).trim();
                expect(actual).toBe(
                    branch === 'v3-release-order-b' ? raced : base
                );
            });
        } finally {
            fs.rmSync(root, {force: true, recursive: true});
        }
    });
});

describe('published release and lifecycle contracts', () => {
    let root: string;
    let artifacts: string;
    let records: string;
    let release: Record<string, unknown>;

    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'v3-promotion-'));
        artifacts = path.join(root, 'artifacts');
        records = path.join(root, 'records');
        fs.mkdirSync(artifacts);
        fs.mkdirSync(records);
        const packages = loadV3PackageInventory(repositoryRoot).map(
            (pkg: {name: string; path: string}, index: number) => {
                const tarball = `package-${index}.tgz`;
                const body = `package-${index}`;
                fs.writeFileSync(path.join(artifacts, tarball), body);
                return {
                    integrity: `sha512-${Buffer.from(`${index}`).toString(
                        'base64'
                    )}`,
                    name: pkg.name,
                    path: pkg.path,
                    sha256: require('node:crypto')
                        .createHash('sha256')
                        .update(body)
                        .digest('hex'),
                    size: Buffer.byteLength(body),
                    tarball,
                    version: '3.1.0',
                };
            }
        );
        fs.writeFileSync(path.join(artifacts, 'release-notes.md'), 'notes\n');
        const notesSha = require('node:crypto')
            .createHash('sha256')
            .update('notes\n')
            .digest('hex');
        const manifest = {
            build: {node: 'v24.19.0', npm: '11.6.2'},
            packages,
            release_notes: {
                path: 'release-notes.md',
                sha256: notesSha,
                size: 6,
            },
            schema_version: 1,
            source_sha: sourceSha,
            version: '3.1.0',
        };
        const manifestText = canonicalJson(manifest);
        fs.writeFileSync(
            path.join(artifacts, 'candidate-manifest.json'),
            manifestText
        );
        fs.writeFileSync(
            path.join(records, 'candidate-manifest.json'),
            manifestText
        );
        const actualManifestSha = require('node:crypto')
            .createHash('sha256')
            .update(manifestText)
            .digest('hex');
        const envelope = createReleaseEnvelope({
            actions_artifacts: [{
                created_at: '2026-09-10T12:00:00Z',
                digest: '6'.repeat(64),
                expires_at: '2026-10-10T12:00:00Z',
                id: 456,
                name: `v3-3.1.0-${sourceSha}`,
            }],
            artifact_subjects: [
                ...packages.map((pkg: {tarball: string; sha256: string}) => ({
                    name: pkg.tarball,
                    sha256: pkg.sha256,
                })),
                {
                    name: 'candidate-manifest.json',
                    sha256: actualManifestSha,
                },
                {name: 'release-notes.md', sha256: notesSha},
            ],
            attestation_signer: {
                digest: sourceSha,
                repository: 'mParticle/mparticle-web-sdk',
                workflow:
                    'github.com/mParticle/mparticle-web-sdk/.github/workflows/' +
                    'reusable-v3-staging-step-1.yml',
            },
            caller_workflow: {
                repository: 'mParticle/mparticle-web-sdk',
                run_attempt: 1,
                run_id: 123,
                workflow_ref:
                    'mParticle/mparticle-web-sdk/.github/workflows/' +
                    'staging-step-1.yml@refs/heads/main',
            },
            candidate_sha: candidateSha,
            cycle_deployment_id: 81,
            cycle_id: cycleSha,
            deployment_id: 77,
            manifest_sha256: actualManifestSha,
            source_sha: sourceSha,
            stable_tag: 'v3.1.0',
            version: '3.1.0',
        });
        fs.writeFileSync(
            path.join(records, 'release-envelope.json'),
            canonicalJson(envelope)
        );
        const digest = (name: string) =>
            `sha256:${require('../../scripts/release/exact-release').sha256File(
                path.join(records, name)
            )}`;
        release = {
            assets: [
                {
                    digest: digest('candidate-manifest.json'),
                    name: 'candidate-manifest.json',
                },
                {
                    digest: digest('release-envelope.json'),
                    name: 'release-envelope.json',
                },
            ],
            body: 'notes',
            draft: false,
            name: 'v3.1.0',
            prerelease: false,
            tag_name: 'v3.1.0',
        };
    });

    afterEach(() => fs.rmSync(root, {force: true, recursive: true}));

    it('accepts only a complete 34-package published identity', async () => {
        const result = await verifyPublishedRelease({
            artifactDirectory: artifacts,
            audit: async (manifest: {packages: unknown[]}) =>
                manifest.packages.length,
            recordDirectory: records,
            release,
            repositoryRoot,
            tag: 'v3.1.0',
        });
        expect(result.expected.candidateSha).toBe(candidateSha);
        expect(result.manifest.packages).toHaveLength(34);
    });

    it('fails identity, release, and npm completeness mismatches', async () => {
        await expect(
            verifyPublishedRelease({
                artifactDirectory: artifacts,
                audit: async () => 33,
                recordDirectory: records,
                release,
                repositoryRoot,
                tag: 'v3.1.0',
            })
        ).rejects.toThrow('did not verify all 34');
        await expect(
            verifyPublishedRelease({
                artifactDirectory: artifacts,
                audit: async () => 34,
                recordDirectory: records,
                release: {...release, draft: true},
                repositoryRoot,
                tag: 'v3.1.0',
            })
        ).rejects.toThrow('GitHub Release does not match');
        await expect(
            verifyPublishedRelease({
                artifactDirectory: artifacts,
                audit: async () => 34,
                recordDirectory: records,
                release,
                repositoryRoot,
                tag: 'v3.1.1',
            })
        ).rejects.toThrow('Trusted release record identity mismatch');
    });

    it('rejects a cross-run ID that does not match caller identity', async () => {
        const envelopePath = path.join(records, 'release-envelope.json');
        const envelope = JSON.parse(fs.readFileSync(envelopePath, 'utf8'));
        envelope.originating_run.run_id = 999;
        fs.writeFileSync(envelopePath, canonicalJson(envelope));
        (release.assets as Array<{digest: string;name: string}>).find(
            asset => asset.name === 'release-envelope.json'
        )!.digest = `sha256:${
            require('../../scripts/release/exact-release').sha256File(
                envelopePath
            )
        }`;
        await expect(
            verifyPublishedRelease({
                artifactDirectory: artifacts,
                audit: async () => 34,
                recordDirectory: records,
                release,
                repositoryRoot,
                tag: 'v3.1.0',
            })
        ).rejects.toThrow('invalid schema or signer');
    });

    it('prevents promoted state for a mismatched downstream receipt', () => {
        expect(() =>
            validateDownstreamReceipt(
                {
                    candidate_sha: '9'.repeat(40),
                    manifest_sha256: manifestSha,
                    schema_version: 1,
                    source_sha: sourceSha,
                    status: 'validated',
                    validated_at: '2026-09-10T12:00:00Z',
                    version: '3.1.0',
                },
                {
                    candidateSha,
                    manifestSha256: manifestSha,
                    sourceSha,
                    version: '3.1.0',
                }
            )
        ).toThrow('does not match release identity');
    });

    it('builds a promoted deployment status only for exact identity', () => {
        const request = createLifecycleStatusRequest({
            candidateSha,
            cycleDeploymentId: 81,
            cycleId: cycleSha,
            deployment: {
                creator: {login: 'github-actions[bot]'},
                environment: 'v3-release-lifecycle',
                id: 77,
                payload: {
                    actions_artifacts: [{digest: '6'.repeat(64), id: 456}],
                    caller_workflow: {
                        repository: 'mParticle/mparticle-web-sdk',
                        run_attempt: 1,
                        run_id: 123,
                        workflow_ref:
                            'mParticle/mparticle-web-sdk/.github/workflows/' +
                            'staging-step-1.yml@refs/heads/main',
                    },
                    candidate_sha: candidateSha,
                    cycle_deployment_id: 81,
                    cycle_id: cycleSha,
                    manifest_sha256: manifestSha,
                    originating_run: {
                        repository: 'mParticle/mparticle-web-sdk',
                        run_attempt: 1,
                        run_id: 123,
                        workflow_ref:
                            'mParticle/mparticle-web-sdk/.github/workflows/' +
                            'staging-step-1.yml@refs/heads/main',
                    },
                    schema_version: 1,
                    signer_workflow: {
                        digest: sourceSha,
                        repository: 'mParticle/mparticle-web-sdk',
                        workflow:
                            'github.com/mParticle/mparticle-web-sdk/' +
                            '.github/workflows/reusable-v3-staging-step-1.yml',
                    },
                    source_sha: sourceSha,
                    stable_tag: 'v3.1.0',
                    version: '3.1.0',
                },
                ref: candidateSha,
                repository_url:
                    'https://api.github.com/repos/mParticle/mparticle-web-sdk',
            },
            manifestSha256: manifestSha,
            repository: 'mParticle/mparticle-web-sdk',
            state: 'promoted',
            statuses: [
                {
                    creator: {login: 'github-actions[bot]'},
                    description: 'v3-release:published;schema=1',
                    state: 'success',
                },
                {
                    creator: {login: 'github-actions[bot]'},
                    description: 'v3-release:publishing;schema=1',
                    state: 'in_progress',
                },
                {
                    creator: {login: 'github-actions[bot]'},
                    description: 'v3-release:approved;schema=1',
                    state: 'success',
                },
                {
                    creator: {login: 'github-actions[bot]'},
                    description:
                        'v3-release:awaiting_approval;schema=1',
                    state: 'pending',
                },
                {
                    creator: {login: 'github-actions[bot]'},
                    description: 'v3-release:prepared;schema=1',
                    state: 'queued',
                },
            ],
            version: '3.1.0',
        });
        expect(request.logicalState).toBe('promoted');
        expect(request.args).toContain('state=success');
    });

    it('authenticates lifecycle creators and appends promoted once', () => {
        const status = (name: string, state: string) => ({
            creator: {login: 'github-actions[bot]'},
            description: `v3-release:${name};schema=1`,
            state,
        });
        const published = [
            status('published', 'success'),
            status('publishing', 'in_progress'),
            status('approved', 'success'),
            status('awaiting_approval', 'pending'),
            status('prepared', 'queued'),
        ];
        const calls: string[][] = [];
        appendLifecycleStatus(
            lifecycleOptions(published),
            (_command: string, args: string[]) => calls.push(args)
        );
        expect(calls).toHaveLength(1);

        const promoted = [status('promoted', 'success'), ...published];
        const replayCalls: string[][] = [];
        const replay = appendLifecycleStatus(
            lifecycleOptions(promoted),
            (_command: string, args: string[]) => replayCalls.push(args)
        );
        expect(replay.idempotent).toBe(true);
        expect(replayCalls).toHaveLength(0);

        expect(() =>
            createLifecycleStatusRequest(
                lifecycleOptions(published, {creator: {login: 'attacker'}})
            )
        ).toThrow('does not match exact release identity');
        expect(() =>
            createLifecycleStatusRequest({
                ...lifecycleOptions(published),
                statuses: [
                    {...published[0], creator: {login: 'attacker'}},
                    ...published.slice(1),
                ],
            })
        ).toThrow('creator is not GitHub Actions');
    });
});

describe('bounded downstream validation', () => {
    const now = Date.parse('2026-09-10T12:00:00Z');
    const identity = {
        candidateSha,
        manifestSha256: manifestSha,
        sourceSha,
        version: '3.1.0',
        now: () => now,
    };
    const requestId = downstreamRequestId(identity);
    const validReceipt = {
        candidate_sha: candidateSha,
        manifest_sha256: manifestSha,
        request_id: requestId,
        schema_version: 1,
        source_sha: sourceSha,
        status: 'validated',
        validated_at: '2026-09-10T11:59:59Z',
        validator: 'mparticle-v3-production-validator',
        version: '3.1.0',
    };

    function mockedRequest(
        responses: Array<{body: string;status: number}>,
        calls: Array<Record<string, unknown>>
    ) {
        return (
            _url: URL,
            options: Record<string, unknown>,
            callback: (response: EventEmitter) => void
        ) => {
            const operation = new EventEmitter() as EventEmitter & {
                destroy: (error: Error) => void;
                end: (body: string) => void;
            };
            operation.destroy = error => operation.emit('error', error);
            operation.end = body => {
                calls.push({body, options});
                const next = responses.shift()!;
                const response = new EventEmitter() as EventEmitter & {
                    headers: Record<string, string>;
                    setEncoding: () => void;
                    statusCode: number;
                };
                response.statusCode = next.status;
                response.headers = {'content-type': 'application/json'};
                response.setEncoding = () => undefined;
                callback(response);
                response.emit('data', next.body);
                response.emit('end');
            };
            return operation;
        };
    }

    it('retries only retryable responses with one deterministic ID', async () => {
        const calls: Array<Record<string, unknown>> = [];
        await expect(
            requestDownstreamValidation({
                endpoint: 'https://validator.example/release',
                identity,
                request: mockedRequest(
                    [
                        {body: '{}', status: 500},
                        {body: '{}', status: 429},
                        {body: JSON.stringify(validReceipt), status: 200},
                    ],
                    calls
                ),
                sleep: async () => undefined,
                token: 'secret',
            })
        ).resolves.toEqual(validReceipt);
        expect(calls).toHaveLength(3);
        calls.forEach(call => {
            expect(call.body).toContain(requestId);
            expect(
                ((call.options as Record<string, unknown>).headers as Record<
                    string,
                    string
                >)[
                    'idempotency-key'
                ]
            ).toBe(requestId);
        });
    });

    it('fails closed on timeout without unbounded retries', async () => {
        let attempts = 0;
        const request = (...requestArguments: unknown[]) => {
            expect(requestArguments).toHaveLength(3);
            attempts++;
            const operation = new EventEmitter() as EventEmitter & {
                destroy: (error: Error) => void;
                end: () => void;
            };
            operation.destroy = error => operation.emit('error', error);
            operation.end = () => operation.emit('timeout');
            return operation;
        };
        await expect(
            requestDownstreamValidation({
                endpoint: 'https://validator.example/release',
                identity,
                maxAttempts: 2,
                request,
                sleep: async () => undefined,
                token: 'secret',
            })
        ).rejects.toThrow('timed out');
        expect(attempts).toBe(2);
    });

    it.each([
        ['malformed', '{'],
        [
            'wrong identity',
            JSON.stringify({...validReceipt, candidate_sha: '9'.repeat(40)}),
        ],
        [
            'stale',
            JSON.stringify({
                ...validReceipt,
                validated_at: '2026-09-10T11:00:00Z',
            }),
        ],
    ])('rejects %s validator responses', async (_name, body) => {
        await expect(
            requestDownstreamValidation({
                endpoint: 'https://validator.example/release',
                identity,
                request: mockedRequest([{body, status: 200}], []),
                token: 'secret',
            })
        ).rejects.toThrow();
    });

    it('rejects response bodies over one MiB', async () => {
        await expect(
            requestDownstreamValidation({
                endpoint: 'https://validator.example/release',
                identity,
                maxResponseBytes: 32,
                request: mockedRequest(
                    [{body: JSON.stringify(validReceipt), status: 200}],
                    []
                ),
                token: 'secret',
            })
        ).rejects.toThrow('exceeds size limit');
    });
});

describe('reusable promotion workflows', () => {
    it.each(['2', '3'])('keeps Step %s workflow_call-only and statically connected', name => {
        const reusable = workflow(name);
        expect(Object.keys(reusable.value.on)).toEqual(['workflow_call']);
        const caller = fs.readFileSync(
            path.join(
                repositoryRoot,
                `.github/workflows/staging-step-${name}.yml`
            ),
            'utf8'
        );
        expect(caller).toContain(
            `reusable-v3-staging-step-${name}.yml`
        );
    });

    it('models Step 2 as one allowlisted leased mutation', () => {
        const {source, value} = workflow('2');
        const text = allRunText(value);
        expect(
            Object.keys(value.on.workflow_call.inputs || {}).sort()
        ).toEqual([
            'cycle_deployment_id',
            'cycle_id',
            'expected_target_sha',
            'release_tag',
            'target_branch',
        ]);
        expect(text).toContain('createStep2Plan');
        expect(text).toContain('--atomic false');
        expect(source).not.toContain('id-token');
        expect(text).not.toContain('refs/heads/main:');
    });

    it('orders Step 3 atomic push, downstream validation, then promoted state', () => {
        const {source, value} = workflow('3');
        const steps = value.jobs['promote-final-destinations'].steps;
        const atomic = steps.findIndex(step =>
            step.name?.includes('Fresh atomic push')
        );
        const downstream = steps.findIndex(step =>
            step.name?.includes('downstream exact')
        );
        const promoted = steps.findIndex(step =>
            step.name?.includes('Append promoted')
        );
        expect(atomic).toBeGreaterThan(-1);
        expect(atomic).toBeLessThan(downstream);
        expect(downstream).toBeLessThan(promoted);
        expect(allRunText(value)).toContain('--atomic true');
        expect(source).not.toContain('id-token');
        expect(source).not.toContain('v3-development');
        expect(source).not.toContain('refs/heads/v3-staging');
        expect(source).toContain('Freeze-ruleset removal remains an external');
    });

    it.each(['2', '3'])(
        'verifies exact records without publication tag or build commands in Step %s',
        name => {
            const {source, value} = workflow(name);
            const text = allRunText(value);
            expect(text).toContain('gh attestation verify');
            expect(text).toContain('verify-published');
            expect(text).toContain('releases/tags/${RELEASE_TAG}');
            expect(text).not.toMatch(
                /npm publish|npm pack|npm (?:run )?build|\bgit tag\b|gh release create/
            );
            expect(source).not.toMatch(
                /uses:\s+actions\/(?:checkout|setup-node|download-artifact)@v\d/
            );
        }
    );
});
