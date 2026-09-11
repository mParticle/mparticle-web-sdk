/* eslint-env jest, node, es2021 */
/* eslint-disable no-undef */

import {execFileSync} from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const {load} = require('js-yaml');
const {
    createIntentPlan,
    intentIdentity,
    validateVersionOnlyDiff,
} = require('../../scripts/release/release-intent');
const {
    completeCycle,
    createSourceUpdateRequest,
    cycleId,
    effectiveSourceSha,
    planCycleCreation,
    validateMergedIntent,
} = require('../../scripts/release/release-cycle');
const {
    releaseFixIdentity,
    validateFreezePullRequest,
} = require('../../scripts/release/freeze-policy');
const {
    authorizeCandidateOperation,
    appendRejectionStatus,
    createDeploymentRequest,
    createLifecycleStatusRequest,
    lifecyclePayload,
    states: lifecycleStates,
} = require('../../scripts/release/lifecycle-record');
const {
    assertStableTag,
    createStep3Execution,
} = require('../../scripts/release/promotion');

const repositoryRoot = path.resolve(__dirname, '../..');
const sourceSha = '1'.repeat(40);
const candidateSha = '2'.repeat(40);
const headSha = '3'.repeat(40);
const manifestSha = '4'.repeat(64);
const releaseCycleId = cycleId({sourceSha, version: '3.2.0'});

function status(description: string, state: string) {
    return {
        creator: {login: 'github-actions[bot]'},
        description,
        state,
    };
}

function tree(paths: string[], sha = '9'.repeat(40)) {
    return {
        sha,
        tree: paths.map((path_, index) => ({
            mode: '100644',
            path: path_,
            sha: `${index + 1}`.repeat(40).slice(0, 40),
            type: 'blob',
        })),
        truncated: false,
    };
}

function gitBlobSha(contents: string) {
    return require('crypto')
        .createHash('sha1')
        .update(`blob ${Buffer.byteLength(contents)}\0${contents}`)
        .digest('hex');
}

function versionTree(version: string, sha: string) {
    const contents = `${version}\n`;
    return {
        sha,
        tree: [
            {
                mode: '100644',
                path: 'VERSION',
                sha: gitBlobSha(contents),
                type: 'blob',
            },
        ],
        truncated: false,
    };
}

function releaseFixTree(version: string, sha: string) {
    const result = versionTree(version, sha);
    result.tree.push({
        mode: '100644',
        path: 'src/fix.js',
        sha: '8'.repeat(40),
        type: 'blob',
    });
    return result;
}

function activeCycle(id = 81) {
    return {
        creator: {login: 'github-actions[bot]'},
        environment: 'v3-release-cycle',
        id,
        payload: {
            cycle_id: releaseCycleId,
            intent_pull_number: 44,
            schema_version: 1,
            source_sha: sourceSha,
            version: '3.2.0',
        },
        ref: sourceSha,
        repository: {full_name: 'mParticle/mparticle-web-sdk'},
        repository_url:
            'https://api.github.com/repos/mParticle/mparticle-web-sdk',
    };
}

function lifecycleDeployment() {
    const workflow = {
        repository: 'mParticle/mparticle-web-sdk',
        run_attempt: 1,
        run_id: 123,
        workflow_ref:
            'mParticle/mparticle-web-sdk/.github/workflows/' +
            'staging-step-1.yml@refs/heads/main',
    };
    return {
        creator: {login: 'github-actions[bot]'},
        environment: 'v3-release-lifecycle',
        id: 77,
        payload: lifecyclePayload({
            actionsArtifacts: [{digest: '5'.repeat(64), id: 456}],
            callerWorkflow: workflow,
            candidateSha,
            cycleDeploymentId: 81,
            cycleId: releaseCycleId,
            manifestSha256: manifestSha,
            originatingRun: workflow,
            signerWorkflow: {
                digest: sourceSha,
                repository: 'mParticle/mparticle-web-sdk',
                workflow:
                    'github.com/mParticle/mparticle-web-sdk/.github/' +
                    'workflows/reusable-v3-staging-step-1.yml',
            },
            sourceSha,
            version: '3.2.0',
        }),
        ref: candidateSha,
        repository_url:
            'https://api.github.com/repos/mParticle/mparticle-web-sdk',
    };
}

function lifecycleOptions(statuses: unknown[]) {
    return {
        candidateSha,
        cycleDeploymentId: 81,
        cycleId: releaseCycleId,
        deployment: lifecycleDeployment(),
        manifestSha256: manifestSha,
        repository: 'mParticle/mparticle-web-sdk',
        statuses,
        version: '3.2.0',
    };
}

describe('VERSION-driven release intent', () => {
    it.each([
        ['patch', '3.1.10'],
        ['minor', '3.2.0'],
        ['major', '4.0.0'],
    ])('calculates a %s intent from exact main', (bump, expected) => {
        const plan = createIntentPlan({
            bump,
            currentVersion: '3.1.9',
            mainSha: sourceSha,
        });
        expect(plan.targetVersion).toBe(expected);
        expect(plan.sourceSha).toBe(sourceSha);
        expect(plan.pushArguments[1]).toBe(
            `--force-with-lease=refs/heads/${plan.branch}:`
        );
    });

    it('accepts only an exact one-line VERSION replacement', () => {
        expect(
            validateVersionOnlyDiff(
                [
                    {
                        additions: 1,
                        changes: 2,
                        deletions: 1,
                        filename: 'VERSION',
                        status: 'modified',
                    },
                ],
                '3.1.0',
                '3.1.1'
            )
        ).toBe(true);
        expect(() =>
            validateVersionOnlyDiff(
                [
                    {
                        additions: 1,
                        changes: 2,
                        deletions: 1,
                        filename: 'VERSION',
                        status: 'modified',
                    },
                    {filename: 'dist/mparticle.js', status: 'modified'},
                ],
                '3.1.0',
                '3.1.1'
            )
        ).toThrow('VERSION-only');
    });

    it('rejects duplicate intent PRs and active cycles', () => {
        const pull = {
            base: {ref: 'main'},
            body: intentIdentity({
                sourceSha,
                targetVersion: '3.1.1',
            }),
            labels: [{name: 'v3-release-intent'}],
            number: 42,
            state: 'open',
        };
        expect(() =>
            createIntentPlan({
                bump: 'patch',
                currentVersion: '3.1.0',
                mainSha: sourceSha,
                openPulls: [pull],
            })
        ).toThrow('already exists');
        expect(() =>
            createIntentPlan({
                activeDeployments: [activeCycle()],
                bump: 'patch',
                currentVersion: '3.1.0',
                mainSha: sourceSha,
                statusesByDeployment: {
                    81: [
                        status('v3-cycle:active;schema=1', 'in_progress'),
                    ],
                },
            })
        ).toThrow('already active');
    });

    it('reuses only the exact authenticated intent PR after a partial retry', () => {
        const basePlan = createIntentPlan({
            bump: 'patch',
            currentVersion: '3.1.0',
            mainSha: sourceSha,
        });
        const pull = {
            base: {
                ref: 'main',
                repo: {full_name: 'mParticle/mparticle-web-sdk'},
                sha: sourceSha,
            },
            body: basePlan.body,
            head: {
                ref: basePlan.branch,
                repo: {full_name: 'mParticle/mparticle-web-sdk'},
            },
            labels: [{name: 'v3-release-intent'}],
            number: 42,
            state: 'open',
            title: basePlan.title,
            user: {login: 'github-actions[bot]'},
        };
        expect(
            createIntentPlan({
                bump: 'patch',
                currentVersion: '3.1.0',
                mainSha: sourceSha,
                openPulls: [pull],
            })
        ).toMatchObject({existingPullNumber: 42, idempotent: true});
        expect(() =>
            createIntentPlan({
                bump: 'patch',
                currentVersion: '3.1.0',
                mainSha: sourceSha,
                openPulls: [{...pull, body: `${pull.body}\nforged`}],
            })
        ).toThrow('mismatched');
    });

    it('fails a create-only branch lease after a competing push', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'v3-intent-race-'));
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
            fs.writeFileSync(path.join(work, 'VERSION'), '3.1.0\n');
            git('add', 'VERSION');
            git('commit', '-m', 'base');
            const main = git('rev-parse', 'HEAD');
            const plan = createIntentPlan({
                bump: 'patch',
                currentVersion: '3.1.0',
                mainSha: main,
            });
            git('push', 'origin', `HEAD:refs/heads/${plan.branch}`);
            fs.writeFileSync(path.join(work, 'VERSION'), '3.1.1\n');
            git('commit', '-am', 'intent');
            expect(() =>
                execFileSync('git', plan.pushArguments, {
                    cwd: work,
                    stdio: 'pipe',
                })
            ).toThrow();
        } finally {
            fs.rmSync(root, {force: true, recursive: true});
        }
    });
});

describe('durable cycle and freeze', () => {
    it('authenticates the merged intent and creates one idempotent cycle', () => {
        const plan = createIntentPlan({
            bump: 'minor',
            currentVersion: '3.1.0',
            mainSha: headSha,
        });
        const baseTree = versionTree('3.1.0', 'a'.repeat(40));
        const resultTree = versionTree('3.2.0', 'b'.repeat(40));
        const pull = {
            base: {
                ref: 'main',
                repo: {full_name: 'mParticle/mparticle-web-sdk'},
                sha: headSha,
            },
            body: plan.body,
            head: {
                ref: 'release/v3-version-3.2.0',
                repo: {full_name: 'mParticle/mparticle-web-sdk'},
                sha: '6'.repeat(40),
            },
            labels: [{name: 'v3-release-intent'}],
            merge_commit_sha: sourceSha,
            merged: true,
            state: 'closed',
            user: {login: 'github-actions[bot]', type: 'Bot'},
        };
        const headCommit = {
            commit: {
                author: {
                    email: 'developers@mparticle.com',
                    name: 'mparticle-automation',
                },
                tree: {sha: resultTree.sha},
            },
            sha: pull.head.sha,
        };
        const baseCommit = {
            commit: {tree: {sha: baseTree.sha}},
            sha: headSha,
        };
        const mainCommit = {
            commit: {tree: {sha: resultTree.sha}},
            parents: [{sha: headSha}],
            sha: sourceSha,
        };
        const files = [
            {
                additions: 1,
                changes: 2,
                deletions: 1,
                filename: 'VERSION',
                status: 'modified',
            },
        ];
        expect(
            validateMergedIntent({
                baseCommit,
                baseIsAncestorOfHead: true,
                baseTree,
                baseVersionContents: '3.1.0\n',
                baseVersion: '3.1.0',
                changedFiles: files,
                headCommit,
                headTree: resultTree,
                headVersionContents: '3.2.0\n',
                mainSha: sourceSha,
                mainCommit,
                pull,
                repository: 'mParticle/mparticle-web-sdk',
                resultTree,
                resultVersionContents: '3.2.0\n',
                version: '3.2.0',
            })
        ).toBe(true);
        const first = planCycleCreation({
            deployments: [],
            intentPullNumber: 44,
            repository: 'mParticle/mparticle-web-sdk',
            sourceSha,
            statusesByDeployment: {},
            version: '3.2.0',
        });
        expect(first.idempotent).toBe(false);
        expect(first.request.payload.cycle_id).toBe(releaseCycleId);
        const replay = planCycleCreation({
            deployments: [activeCycle()],
            intentPullNumber: 44,
            repository: 'mParticle/mparticle-web-sdk',
            sourceSha,
            statusesByDeployment: {
                81: [status('v3-cycle:active;schema=1', 'in_progress')],
            },
            version: '3.2.0',
        });
        expect(replay).toMatchObject({
            cycleId: releaseCycleId,
            deploymentId: 81,
            idempotent: true,
        });
    });

    it('authenticates a real one-parent squash and rejects forged trees', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'v3-squash-'));
        try {
            const git = (...args: string[]) =>
                execFileSync('git', args, {
                    cwd: root,
                    encoding: 'utf8',
                }).trim();
            git('init');
            git('config', 'user.name', 'mparticle-automation');
            git('config', 'user.email', 'developers@mparticle.com');
            fs.writeFileSync(path.join(root, 'VERSION'), '3.1.0\n');
            git('add', 'VERSION');
            git('commit', '-m', 'base');
            const base = git('rev-parse', 'HEAD');
            git('switch', '-c', 'release/v3-version-3.2.0');
            fs.writeFileSync(path.join(root, 'VERSION'), '3.2.0\n');
            git('commit', '-am', 'chore(release): set version to 3.2.0');
            const head = git('rev-parse', 'HEAD');
            git('switch', '--detach', base);
            git('merge', '--squash', head);
            git('commit', '-m', 'squash release intent');
            const result = git('rev-parse', 'HEAD');
            const commit = (sha: string) => {
                const parts = git('rev-list', '--parents', '-n', '1', sha).split(
                    ' '
                );
                return {
                    commit: {
                        author: {
                            email: git('show', '-s', '--format=%ae', sha),
                            name: git('show', '-s', '--format=%an', sha),
                        },
                        tree: {sha: git('show', '-s', '--format=%T', sha)},
                    },
                    parents: parts.slice(1).map(parent => ({sha: parent})),
                    sha,
                };
            };
            const gitTree = (sha: string) => {
                const commitValue = commit(sha);
                return {
                    sha: commitValue.commit.tree.sha,
                    tree: git('ls-tree', '-r', sha)
                        .split('\n')
                        .map(line => {
                            const match =
                                /^([0-9]+) ([^ ]+) ([0-9a-f]{40})\t(.+)$/.exec(
                                    line
                                )!;
                            return {
                                mode: match[1],
                                path: match[4],
                                sha: match[3],
                                type: match[2],
                            };
                        }),
                    truncated: false,
                };
            };
            const plan = createIntentPlan({
                bump: 'minor',
                currentVersion: '3.1.0',
                mainSha: base,
            });
            const pull = {
                base: {
                    ref: 'main',
                    repo: {full_name: 'mParticle/mparticle-web-sdk'},
                    sha: base,
                },
                body: plan.body,
                head: {
                    ref: plan.branch,
                    repo: {full_name: 'mParticle/mparticle-web-sdk'},
                    sha: head,
                },
                labels: [{name: 'v3-release-intent'}],
                merge_commit_sha: result,
                merged: true,
                state: 'closed',
                user: {login: 'github-actions[bot]', type: 'Bot'},
            };
            const options = {
                baseCommit: commit(base),
                baseIsAncestorOfHead: true,
                baseTree: gitTree(base),
                baseVersion: '3.1.0',
                baseVersionContents: '3.1.0\n',
                changedFiles: [
                    {
                        additions: 1,
                        changes: 2,
                        deletions: 1,
                        filename: 'VERSION',
                        status: 'modified',
                    },
                ],
                headCommit: commit(head),
                headTree: gitTree(head),
                headVersionContents: '3.2.0\n',
                mainCommit: commit(result),
                mainSha: result,
                pull,
                repository: 'mParticle/mparticle-web-sdk',
                resultTree: gitTree(result),
                resultVersionContents: '3.2.0\n',
                version: '3.2.0',
            };
            expect(validateMergedIntent(options)).toBe(true);
            expect(() =>
                validateMergedIntent({
                    ...options,
                    baseIsAncestorOfHead: false,
                })
            ).toThrow('topology');
            expect(() =>
                validateMergedIntent({
                    ...options,
                    resultVersionContents: '3.2.1\n',
                })
            ).toThrow('VERSION blob');
            expect(() =>
                validateMergedIntent({
                    ...options,
                    resultTree: {
                        ...options.resultTree,
                        sha: 'f'.repeat(40),
                    },
                })
            ).toThrow('tree identity');
        } finally {
            fs.rmSync(root, {force: true, recursive: true});
        }
    });

    it('blocks normal PRs and accepts only exact reviewed safe release fixes', () => {
        const normal = {
            base: {
                ref: 'main',
                repo: {full_name: 'mParticle/mparticle-web-sdk'},
                sha: sourceSha,
            },
            body: 'normal',
            head: {
                repo: {full_name: 'mParticle/mparticle-web-sdk'},
                sha: headSha,
            },
            labels: [],
            state: 'open',
        };
        expect(() =>
            validateFreezePullRequest({
                activeCycle: activeCycle(),
                baseVersion: '3.2.0',
                files: [{filename: 'src/events.js', status: 'modified'}],
                headVersion: '3.2.0',
                pull: normal,
                requestedBaseSha: sourceSha,
                requestedHeadSha: headSha,
                repository: 'mParticle/mparticle-web-sdk',
                reviews: [],
            })
        ).toThrow('Normal PR merges are blocked');

        const releaseFix = {
            ...normal,
            body: releaseFixIdentity,
            labels: [{name: 'v3-release-fix'}],
        };
        const options = {
            activeCycle: activeCycle(),
            baseVersion: '3.2.0',
            files: [
                {filename: 'src/events.js', status: 'modified'},
                {filename: 'test/src/tests-events.ts', status: 'modified'},
            ],
            baseTree: tree(['src/events.js', 'test/src/tests-events.ts']),
            baseTreeSha: '9'.repeat(40),
            headTree: tree(
                ['src/events.js', 'test/src/tests-events.ts'],
                '8'.repeat(40)
            ),
            headTreeSha: '8'.repeat(40),
            headVersion: '3.2.0',
            pull: releaseFix,
            requestedBaseSha: sourceSha,
            requestedHeadSha: headSha,
            repository: 'mParticle/mparticle-web-sdk',
            reviews: [
                {
                    commit_id: headSha,
                    state: 'APPROVED',
                    user: {login: 'reviewer'},
                },
            ],
        };
        expect(validateFreezePullRequest(options)).toEqual({
            allowed: true,
            reason: 'reviewed-release-fix',
            type: 'release-fix',
        });
        expect(() =>
            validateFreezePullRequest({...options, headVersion: '3.2.1'})
        ).toThrow('VERSION unchanged');
        expect(() =>
            validateFreezePullRequest({
                ...options,
                pull: {
                    ...releaseFix,
                    body: 'edited after approval',
                },
            })
        ).toThrow('Normal PR merges are blocked');
        expect(() =>
            validateFreezePullRequest({
                ...options,
                pull: {
                    ...releaseFix,
                    head: {
                        ...releaseFix.head,
                        repo: {full_name: 'fork/web-sdk'},
                    },
                },
            })
        ).toThrow('forked');
        expect(() =>
            validateFreezePullRequest({
                ...options,
                files: [
                    {
                        filename: 'kits/google/dist/index.js',
                        status: 'modified',
                    },
                ],
            })
        ).toThrow('path is not allowed');
    });

    it('rejects rename, copy, symlink, and gitlink freeze bypasses', () => {
        const pull = {
            base: {
                ref: 'main',
                repo: {full_name: 'mParticle/mparticle-web-sdk'},
                sha: sourceSha,
            },
            body: releaseFixIdentity,
            head: {
                repo: {full_name: 'mParticle/mparticle-web-sdk'},
                sha: headSha,
            },
            labels: [{name: 'v3-release-fix'}],
            state: 'open',
        };
        const common = {
            activeCycle: activeCycle(),
            baseVersion: '3.2.0',
            baseTreeSha: '9'.repeat(40),
            headTreeSha: '9'.repeat(40),
            headVersion: '3.2.0',
            pull,
            requestedBaseSha: sourceSha,
            requestedHeadSha: headSha,
            repository: 'mParticle/mparticle-web-sdk',
            reviews: [
                {
                    commit_id: headSha,
                    state: 'APPROVED',
                    user: {login: 'reviewer'},
                },
            ],
        };
        expect(() =>
            validateFreezePullRequest({
                ...common,
                baseTree: tree(['scripts/release/unsafe.js']),
                files: [
                    {
                        filename: 'src/safe.js',
                        previous_filename: 'scripts/release/unsafe.js',
                        status: 'renamed',
                    },
                ],
                headTree: tree(['src/safe.js']),
            })
        ).toThrow('path is not allowed');
        expect(() =>
            validateFreezePullRequest({
                ...common,
                baseTree: tree([]),
                files: [{filename: 'src/copied.js', status: 'copied'}],
                headTree: tree(['src/copied.js']),
            })
        ).toThrow('status is not allowed');
        for (const [mode, type] of [
            ['120000', 'blob'],
            ['160000', 'commit'],
        ]) {
            const unsafe = tree(['src/unsafe.js']);
            unsafe.tree[0].mode = mode;
            unsafe.tree[0].type = type;
            expect(() =>
                validateFreezePullRequest({
                    ...common,
                    baseTree: unsafe,
                    files: [{filename: 'src/unsafe.js', status: 'modified'}],
                    headTree: unsafe,
                })
            ).toThrow('regular blob');
        }
    });

    it('records an authenticated source correction and rejects stale identity', () => {
        const newSourceSha = '6'.repeat(40);
        const releaseFixHead = '7'.repeat(40);
        const files = [{filename: 'src/fix.js', status: 'modified'}];
        const baseTree = releaseFixTree('3.2.0', '9'.repeat(40));
        const resultTree = releaseFixTree('3.2.0', '8'.repeat(40));
        const pull = {
            base: {
                ref: 'main',
                repo: {full_name: 'mParticle/mparticle-web-sdk'},
                sha: sourceSha,
            },
            baseTree,
            baseTreeSha: '9'.repeat(40),
            body: releaseFixIdentity,
            head: {
                repo: {full_name: 'mParticle/mparticle-web-sdk'},
                sha: releaseFixHead,
            },
            headTree: resultTree,
            headTreeSha: '8'.repeat(40),
            labels: [{name: 'v3-release-fix'}],
            merge_commit_sha: newSourceSha,
            merged: true,
            number: 91,
            reviews: [
                {
                    commit_id: releaseFixHead,
                    state: 'APPROVED',
                    user: {login: 'reviewer'},
                },
            ],
            state: 'closed',
            workflow_run: {
                actor: {login: 'release-operator'},
                id: 500,
                path: '.github/workflows/v3-release-source-update.yml',
            },
        };
        const options = {
            actor: 'release-operator',
            candidateDeployments: [
                {
                    ...lifecycleDeployment(),
                    statuses: [
                        status(
                            'v3-release:rejected;schema=2;actor=reviewer;run=12;reason=failed',
                            'failure'
                        ),
                        status(
                            'v3-release:awaiting_approval;schema=1',
                            'pending'
                        ),
                        status('v3-release:prepared;schema=1', 'queued'),
                    ],
                },
            ],
            deployment: activeCycle(),
            files,
            baseCommit: {
                commit: {tree: {sha: baseTree.sha}},
                sha: sourceSha,
            },
            baseIsAncestorOfHead: true,
            baseTree,
            baseVersionContents: '3.2.0\n',
            headCommit: {
                commit: {tree: {sha: resultTree.sha}},
                sha: releaseFixHead,
            },
            headTree: resultTree,
            headVersionContents: '3.2.0\n',
            headVersion: '3.2.0',
            mainCommit: {
                commit: {tree: {sha: resultTree.sha}},
                parents: [{sha: sourceSha}],
                sha: newSourceSha,
            },
            resultTree,
            resultVersionContents: '3.2.0\n',
            pull,
            repository: 'mParticle/mparticle-web-sdk',
            runId: 500,
            statuses: [
                status('v3-cycle:active;schema=1', 'in_progress'),
            ],
        };
        const update = createSourceUpdateRequest(options);
        expect(update.effectiveSourceSha).toBe(newSourceSha);
        expect(
            createSourceUpdateRequest({
                ...options,
                candidateDeployments: [],
            }).effectiveSourceSha
        ).toBe(newSourceSha);
        const updatedCycleStatuses = [
            status(update.description, 'in_progress'),
            ...options.statuses,
        ];
        expect(
            effectiveSourceSha(options.deployment, updatedCycleStatuses)
        ).toBe(newSourceSha);

        const correctedCandidateSha = 'a'.repeat(40);
        const corrected = lifecycleDeployment();
        corrected.ref = correctedCandidateSha;
        corrected.payload = lifecyclePayload({
            actionsArtifacts: [{digest: '5'.repeat(64), id: 456}],
            callerWorkflow: corrected.payload.caller_workflow,
            candidateSha: correctedCandidateSha,
            cycleDeploymentId: 81,
            cycleId: releaseCycleId,
            manifestSha256: manifestSha,
            originatingRun: corrected.payload.originating_run,
            signerWorkflow: {
                ...corrected.payload.signer_workflow,
                digest: newSourceSha,
            },
            sourceSha: newSourceSha,
            version: '3.2.0',
        });
        const correctedOptions = {
            candidateSha: correctedCandidateSha,
            cycleDeploymentId: 81,
            cycleId: releaseCycleId,
            deployment: corrected,
            manifestSha256: manifestSha,
            repository: 'mParticle/mparticle-web-sdk',
            version: '3.2.0',
        };
        const lifecycleStates: Array<[string, string]> = [
            ['prepared', 'queued'],
            ['awaiting_approval', 'pending'],
            ['approved', 'success'],
            ['publishing', 'in_progress'],
            ['published', 'success'],
        ];
        let correctedStatuses: unknown[] = [];
        for (const [stateName, apiState] of lifecycleStates) {
            expect(
                createLifecycleStatusRequest({
                    ...correctedOptions,
                    state: stateName,
                    statuses: correctedStatuses,
                }).logicalState
            ).toBe(stateName);
            correctedStatuses = [
                status(`v3-release:${stateName};schema=1`, apiState),
                ...correctedStatuses,
            ];
        }
        expect(() =>
            createSourceUpdateRequest({
                ...options,
                pull: {...pull, base: {...pull.base, sha: headSha}},
            })
        ).toThrow();
        expect(() =>
            createSourceUpdateRequest({
                ...options,
                candidateDeployments: [{logicalState: 'prepared'}],
            })
        ).toThrow('ordering');
    });
});

describe('candidate rejection and cycle completion', () => {
    const prepared = [
        status('v3-release:prepared;schema=1', 'queued'),
    ];
    const awaitingApproval = [
        status('v3-release:awaiting_approval;schema=1', 'pending'),
        ...prepared,
    ];

    it('uses the exact durable lifecycle and Deployment API mapping', () => {
        expect(lifecycleStates).toEqual({
            prepared: {
                description: 'v3-release:prepared;schema=1',
                state: 'queued',
            },
            awaiting_approval: {
                description: 'v3-release:awaiting_approval;schema=1',
                state: 'pending',
            },
            approved: {
                description: 'v3-release:approved;schema=1',
                state: 'success',
            },
            publishing: {
                description: 'v3-release:publishing;schema=1',
                state: 'in_progress',
            },
            published: {
                description: 'v3-release:published;schema=1',
                state: 'success',
            },
            promoted: {
                description: 'v3-release:promoted;schema=1',
                state: 'success',
            },
            rejected: {
                description: 'v3-release:rejected;schema=1',
                state: 'failure',
            },
        });
    });

    it('binds candidate lifecycle identity to the active cycle', () => {
        expect(lifecycleDeployment().payload).toMatchObject({
            candidate_sha: candidateSha,
            cycle_deployment_id: 81,
            cycle_id: releaseCycleId,
            source_sha: sourceSha,
            version: '3.2.0',
        });
    });

    describe('candidate operation authorization', () => {
        const authorization = {
            cycleDeploymentId: 81,
            cycleId: releaseCycleId,
            repository: 'mParticle/mparticle-web-sdk',
            sourceSha,
            version: '3.2.0',
        };
        const preparedStatus = status(
            'v3-release:prepared;schema=1',
            'queued'
        );
        const awaitingStatus = status(
            'v3-release:awaiting_approval;schema=1',
            'pending'
        );
        const rejectedStatus = status(
            'v3-release:rejected;schema=2;actor=reviewer;run=12;reason=failed',
            'failure'
        );

        it('allows a first candidate and recreation after exact rejection', () => {
            expect(
                authorizeCandidateOperation({
                    ...authorization,
                    candidateDeployments: [],
                    mode: 'fresh',
                })
            ).toMatchObject({candidateCount: 0, mode: 'fresh'});
            expect(
                authorizeCandidateOperation({
                    ...authorization,
                    candidateDeployments: [
                        {
                            ...lifecycleDeployment(),
                            statuses: [
                                rejectedStatus,
                                awaitingStatus,
                                preparedStatus,
                            ],
                        },
                    ],
                    mode: 'fresh',
                })
            ).toMatchObject({candidateCount: 1, mode: 'fresh'});
        });

        it.each([
            ['awaiting', [awaitingStatus, preparedStatus]],
            [
                'cancelled',
                [
                    status(
                        'v3-release:cancelled;schema=1',
                        'inactive'
                    ),
                    awaitingStatus,
                    preparedStatus,
                ],
            ],
            [
                'failed',
                [
                    status('v3-release:failed;schema=1', 'error'),
                    awaitingStatus,
                    preparedStatus,
                ],
            ],
            ['statusless', []],
            [
                'approved',
                [
                    status('v3-release:approved;schema=1', 'success'),
                    awaitingStatus,
                    preparedStatus,
                ],
            ],
            [
                'publishing',
                [
                    status('v3-release:publishing;schema=1', 'in_progress'),
                    status('v3-release:approved;schema=1', 'success'),
                    awaitingStatus,
                    preparedStatus,
                ],
            ],
            [
                'published',
                [
                    status('v3-release:published;schema=1', 'success'),
                    status('v3-release:publishing;schema=1', 'in_progress'),
                    status('v3-release:approved;schema=1', 'success'),
                    awaitingStatus,
                    preparedStatus,
                ],
            ],
            [
                'promoted',
                [
                    status('v3-release:promoted;schema=1', 'success'),
                    status('v3-release:published;schema=1', 'success'),
                    status('v3-release:publishing;schema=1', 'in_progress'),
                    status('v3-release:approved;schema=1', 'success'),
                    awaitingStatus,
                    preparedStatus,
                ],
            ],
        ])('blocks a %s prior candidate', (_name, statuses) => {
            expect(() =>
                authorizeCandidateOperation({
                    ...authorization,
                    candidateDeployments: [
                        {...lifecycleDeployment(), statuses},
                    ],
                    mode: 'fresh',
                })
            ).toThrow();
        });

        it('blocks a foreign candidate claiming the active cycle', () => {
            expect(() =>
                authorizeCandidateOperation({
                    ...authorization,
                    candidateDeployments: [
                        {
                            ...lifecycleDeployment(),
                            repository_url:
                                'https://api.github.com/repos/foreign/repo',
                            statuses: [
                                rejectedStatus,
                                awaitingStatus,
                                preparedStatus,
                            ],
                        },
                    ],
                    mode: 'fresh',
                })
            ).toThrow('exact active cycle');
        });

        it('recovers only the exact recorded candidate', () => {
            const deployment = {
                ...lifecycleDeployment(),
                statuses: [
                    status('v3-release:approved;schema=1', 'success'),
                    awaitingStatus,
                    preparedStatus,
                ],
            };
            expect(
                authorizeCandidateOperation({
                    ...authorization,
                    candidateDeployments: [deployment],
                    mode: 'recovery',
                    recoveryCandidateSha: candidateSha,
                    recoveryDeploymentId: deployment.id,
                })
            ).toMatchObject({deploymentId: deployment.id, mode: 'recovery'});
            expect(() =>
                authorizeCandidateOperation({
                    ...authorization,
                    candidateDeployments: [deployment],
                    mode: 'recovery',
                    recoveryCandidateSha: 'a'.repeat(40),
                    recoveryDeploymentId: deployment.id,
                })
            ).toThrow('exact recorded candidate');
        });
    });

    it('records terminal rejection once and prohibits later transitions', () => {
        const calls: string[][] = [];
        const rejected = appendRejectionStatus(
            {
                ...lifecycleOptions(awaitingApproval),
                actor: 'reviewer',
                reason: 'playground validation failed',
                runId: 9001,
                stableTagAbsent: true,
                npmPublicationAbsent: true,
            },
            (_command: string, args: string[]) => calls.push(args)
        );
        expect(rejected.logicalState).toBe('rejected');
        expect(calls[0].join(' ')).toContain('actor=reviewer');
        const rejectedStatus = status(
            calls[0].find(argument => argument.startsWith('description='))!
                .slice('description='.length),
            'failure'
        );
        const replay = appendRejectionStatus({
            ...lifecycleOptions([rejectedStatus, ...awaitingApproval]),
            actor: 'reviewer',
            reason: 'playground validation failed',
            runId: 9001,
            stableTagAbsent: true,
            npmPublicationAbsent: true,
        });
        expect(replay.idempotent).toBe(true);
        expect(() =>
            createLifecycleStatusRequest({
                ...lifecycleOptions([rejectedStatus, ...awaitingApproval]),
                state: 'approved',
            })
        ).toThrow();
    });

    it('allows rejection only while awaiting approval with absence evidence', () => {
        expect(() =>
            appendRejectionStatus({
                ...lifecycleOptions([
                    status('v3-release:approved;schema=1', 'success'),
                    ...awaitingApproval,
                ]),
                actor: 'reviewer',
                npmPublicationAbsent: true,
                reason: 'cancelled',
                runId: 11,
                stableTagAbsent: true,
            })
        ).toThrow('awaiting_approval');
        expect(() =>
            appendRejectionStatus({
                ...lifecycleOptions(awaitingApproval),
                actor: 'reviewer',
                npmPublicationAbsent: true,
                reason: 'cancelled',
                runId: 11,
                stableTagAbsent: false,
            })
        ).toThrow('absence');
    });

    it('recovers exactly one statusless matching cycle record', () => {
        expect(
            planCycleCreation({
                deployments: [activeCycle()],
                intentPullNumber: 44,
                repository: 'mParticle/mparticle-web-sdk',
                sourceSha,
                statusesByDeployment: {81: []},
                version: '3.2.0',
            })
        ).toMatchObject({
            deploymentId: 81,
            idempotent: false,
            initialStatusRequired: true,
        });
        expect(() =>
            planCycleCreation({
                deployments: [
                    activeCycle(),
                    {...activeCycle(82), ref: headSha},
                ],
                intentPullNumber: 44,
                repository: 'mParticle/mparticle-web-sdk',
                sourceSha,
                statusesByDeployment: {81: [], 82: []},
                version: '3.2.0',
            })
        ).toThrow('Statusless');
    });

    it('normalizes paginated histories and uses typed API fields', () => {
        const request = createLifecycleStatusRequest({
            ...lifecycleOptions([[...awaitingApproval]]),
            state: 'approved',
        });
        expect(request.args).toContain('-F');
        expect(request.args[request.args.indexOf('-F') + 1]).toBe(
            'auto_inactive=false'
        );
        const deploymentRequest = createDeploymentRequest({
            identity: {
                actionsArtifacts: [{digest: '5'.repeat(64), id: 456}],
                callerWorkflow: lifecycleDeployment().payload.caller_workflow,
                candidateSha,
                cycleDeploymentId: 81,
                cycleId: releaseCycleId,
                manifestSha256: manifestSha,
                originatingRun:
                    lifecycleDeployment().payload.originating_run,
                signerWorkflow:
                    lifecycleDeployment().payload.signer_workflow,
                sourceSha,
                version: '4.0.0',
            },
            repository: 'mParticle/mparticle-web-sdk',
        });
        expect(deploymentRequest.args).toContain('-F');
    });

    it('supports a 4.0.0 lifecycle and v4 promotion on v3 topology', () => {
        expect(() => assertStableTag('v4.0.0')).not.toThrow();
        const execution = createStep3Execution({
            candidateSha,
            destinations: [
                ['main', sourceSha],
                ['v3-release-order-a', sourceSha],
                ['v3-release-order-b', sourceSha],
                ['v3-release-order-c', sourceSha],
            ].map(([branch, sha]) => ({
                branch,
                currentSha: sha,
                expectedSha: sha,
            })),
            isAncestor: () => true,
            sourceSha,
        });
        expect(execution.mode).toBe('fresh');
    });

    it('completes cycle idempotently only from active', () => {
        const deployment = activeCycle();
        const active = [status('v3-cycle:active;schema=1', 'in_progress')];
        const calls: string[][] = [];
        expect(
            completeCycle(
                {deployment, statuses: active},
                (_command: string, args: string[]) => calls.push(args)
            ).logicalState
        ).toBe('completed');
        expect(calls).toHaveLength(1);
        expect(
            completeCycle({
                deployment,
                statuses: [
                    status('v3-cycle:completed;schema=1', 'success'),
                    ...active,
                ],
            }).idempotent
        ).toBe(true);
    });

    it('orders Step 3 validation promotion and cycle completion', () => {
        const workflow = load(
            fs.readFileSync(
                path.join(
                    repositoryRoot,
                    '.github/workflows/reusable-v3-staging-step-3.yml'
                ),
                'utf8'
            )
        );
        const names = workflow.jobs['promote-final-destinations'].steps.map(
            (step: {name: string}) => step.name
        );
        expect(names.indexOf('Require downstream exact served-artifact validation'))
            .toBeLessThan(
                names.indexOf('Append promoted only after downstream validation')
            );
        expect(
            names.indexOf('Append promoted only after downstream validation')
        ).toBeLessThan(
            names.indexOf('Complete durable cycle after candidate promotion')
        );
    });
});

describe('reusable workflow surface', () => {
    it.each([
        'reusable-v3-release-intent.yml',
        'reusable-v3-release-cycle.yml',
        'reusable-v3-freeze-check.yml',
    ])('keeps %s workflow_call-only', filename => {
        const workflow = load(
            fs.readFileSync(
                path.join(repositoryRoot, '.github/workflows', filename),
                'utf8'
            )
        );
        expect(Object.keys(workflow.on)).toEqual(['workflow_call']);
    });

    it('keeps release intent free of release side effects', () => {
        const source = fs.readFileSync(
            path.join(
                repositoryRoot,
                '.github/workflows/reusable-v3-release-intent.yml'
            ),
            'utf8'
        );
        expect(source).not.toMatch(
            /npm (?:publish|pack|view)|npm run build|\bgit tag\b|gh release/
        );
        expect(source).not.toContain('v3-staging');
        expect(source).not.toContain('release-order');
        expect(source).toContain(
            '--force-with-lease="refs/heads/${BRANCH}:"'
        );
    });

    it('requires active cycle identity in Step 1', () => {
        const workflow = load(
            fs.readFileSync(
                path.join(
                    repositoryRoot,
                    '.github/workflows/reusable-v3-staging-step-1.yml'
                ),
                'utf8'
            )
        );
        expect(workflow.on.workflow_call.inputs).toMatchObject({
            cycle_deployment_id: {required: true, type: 'number'},
            cycle_id: {required: true, type: 'string'},
        });
        expect(
            workflow.jobs.validate.steps.some((step: {name: string}) =>
                step.name.includes('exact active release cycle')
            )
        ).toBe(true);
    });

    it('reconstructs cycle identity on every execution path', () => {
        for (const filename of [
            'reusable-v3-staging-step-1.yml',
            'reusable-v3-staging-step-2.yml',
            'reusable-v3-staging-step-3.yml',
        ]) {
            const source = fs.readFileSync(
                path.join(repositoryRoot, '.github/workflows', filename),
                'utf8'
            );
            expect(source).toContain('cycle_deployment_id');
            expect(source).toContain('cycle_id');
            expect(source).toContain('validateCycleDeployment');
            expect(source).toContain('gh api --paginate --slurp');
        }
    });

    it('keeps expressions out of release shell command construction', () => {
        for (const filename of fs
            .readdirSync(path.join(repositoryRoot, '.github/workflows'))
            .filter(name => name.startsWith('reusable-v3-'))) {
            const workflow = load(
                fs.readFileSync(
                    path.join(repositoryRoot, '.github/workflows', filename),
                    'utf8'
                )
            );
            for (const job of Object.values(workflow.jobs) as Array<{
                steps?: Array<{run?: string}>;
            }>) {
                for (const step of job.steps || []) {
                    expect(step.run || '').not.toContain('${{');
                    expect(step.run || '').not.toMatch(
                        /(?:eval|COMMON_ARGS="|\\$COMMON_ARGS)/
                    );
                }
            }
        }
    });

    it('uses typed GitHub API fields for booleans', () => {
        const sources = [
            ...fs
                .readdirSync(path.join(repositoryRoot, 'scripts/release'))
                .filter(name => name.endsWith('.js'))
                .map(name =>
                    fs.readFileSync(
                        path.join(repositoryRoot, 'scripts/release', name),
                        'utf8'
                    )
                ),
            ...fs
                .readdirSync(path.join(repositoryRoot, '.github/workflows'))
                .filter(name => name.startsWith('reusable-v3-'))
                .map(name =>
                    fs.readFileSync(
                        path.join(repositoryRoot, '.github/workflows', name),
                        'utf8'
                    )
                ),
        ].join('\n');
        expect(sources).not.toMatch(
            /(?:'-f'|"-f"|-f)\s*,?\s*(?:'|")?(?:auto_merge|auto_inactive)=(?:true|false)/
        );
    });
});
