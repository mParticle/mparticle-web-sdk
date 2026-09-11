/* eslint-env jest, node, es2021 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const {
    calculateNextVersion,
    parseStableVersion,
    readVersionFile,
} = require('../../scripts/release/version');
const {
    assertExactKitInventory,
    discoverPublishableKitManifests,
    loadV3PackageInventory,
    validatePackageInventory,
} = require('../../scripts/release/package-inventory');
const {
    canonicalJson,
    createCandidateManifest,
    createReleaseEnvelope,
    sha256Canonical,
} = require('../../scripts/release/candidate-manifest');

const repositoryRoot = path.resolve(__dirname, '../..');
const sourceSha = '1'.repeat(40);
const candidateSha = '2'.repeat(40);
const artifactSha = '3'.repeat(64);
const manifestSha = '4'.repeat(64);
const cycleSha = '7'.repeat(64);
const releaseNotes = {
    path: 'release-notes.md',
    sha256: '5'.repeat(64),
    size: 42,
};
const buildTools = {node: 'v24.19.0', npm: '11.6.2'};
const actionsArtifact = {
    created_at: '2026-09-10T12:00:00Z',
    digest: '6'.repeat(64),
    expires_at: '2026-10-10T12:00:00Z',
    id: 456,
    name: 'v3-release-artifacts',
};
const attestationSigner = {
    digest: sourceSha,
    repository: 'mParticle/mparticle-web-sdk',
    workflow:
        'github.com/mParticle/mparticle-web-sdk/.github/workflows/' +
        'reusable-v3-staging-step-1.yml',
};

describe('v3 release foundations', () => {
    describe('VERSION', () => {
        it('starts from the current v3 package version', () => {
            const manifest = JSON.parse(
                fs.readFileSync(
                    path.join(repositoryRoot, 'package.json'),
                    'utf8'
                )
            );

            expect(readVersionFile(repositoryRoot)).toBe('3.1.0');
            expect(readVersionFile(repositoryRoot)).toBe(manifest.version);
        });

        it.each([
            '1.2.3-alpha.1',
            'v1.2.3',
            '01.2.3',
            '1.2',
            '1.2.3.4',
            '',
        ])('rejects non-stable version %p', version => {
            expect(() => parseStableVersion(version)).toThrow(
                'Expected a stable semantic version'
            );
        });

        it('calculates each supported release bump', () => {
            expect(calculateNextVersion('3.1.9', 'patch')).toBe('3.1.10');
            expect(calculateNextVersion('3.1.9', 'minor')).toBe('3.2.0');
            expect(calculateNextVersion('3.1.9', 'major')).toBe('4.0.0');
            expect(() => calculateNextVersion('3.1.9', 'prerelease')).toThrow(
                'Expected release bump'
            );
        });
    });

    describe('package inventory', () => {
        it('contains the core package followed by every kit once', () => {
            const matrix = JSON.parse(
                fs.readFileSync(
                    path.join(repositoryRoot, 'kits/publish-matrix.json'),
                    'utf8'
                )
            );
            const inventory = loadV3PackageInventory(repositoryRoot);

            expect(inventory).toHaveLength(34);
            expect(inventory[0]).toEqual({
                name: '@mparticle/web-sdk',
                path: '.',
                type: 'core',
            });
            expect(inventory.slice(1).map(entry => entry.name)).toEqual(
                matrix.map(entry => entry.name)
            );
            expect(new Set(inventory.map(entry => entry.name)).size).toBe(34);
            expect(new Set(inventory.map(entry => entry.path)).size).toBe(34);
        });

        it('rejects duplicate names', () => {
            const root = fs.mkdtempSync(
                path.join(os.tmpdir(), 'v3-package-inventory-')
            );
            fs.mkdirSync(path.join(root, 'one'));
            fs.writeFileSync(
                path.join(root, 'one/package.json'),
                JSON.stringify({name: '@test/one'})
            );

            const duplicate = [
                {name: '@test/one', path: 'one'},
                {name: '@test/one', path: 'one'},
            ];
            expect(() => validatePackageInventory(duplicate, root)).toThrow(
                'Duplicate package name'
            );
        });

        it('rejects duplicate paths with distinct package names', () => {
            const root = fs.mkdtempSync(
                path.join(os.tmpdir(), 'v3-package-inventory-')
            );
            fs.mkdirSync(path.join(root, 'one'));
            fs.writeFileSync(
                path.join(root, 'one/package.json'),
                JSON.stringify({name: '@test/one'})
            );

            const duplicate = [
                {name: '@test/one', path: 'one'},
                {name: '@test/two', path: 'one'},
            ];
            expect(() => validatePackageInventory(duplicate, root)).toThrow(
                'Duplicate package path'
            );
        });

        it('allows package basenames beginning with two dots', () => {
            const root = fs.mkdtempSync(
                path.join(os.tmpdir(), 'v3-package-inventory-')
            );
            fs.mkdirSync(path.join(root, '..package'));
            fs.writeFileSync(
                path.join(root, '..package/package.json'),
                JSON.stringify({name: '@test/dot-package'})
            );

            expect(
                validatePackageInventory(
                    [{name: '@test/dot-package', path: '..package'}],
                    root
                )
            ).toEqual([
                {
                    name: '@test/dot-package',
                    path: '..package',
                    type: 'core',
                },
            ]);
        });

        it.each(['', path.resolve(repositoryRoot, 'kits')])(
            'rejects invalid package path %p',
            packagePath => {
                expect(() =>
                    validatePackageInventory(
                        [{name: '@test/invalid', path: packagePath}],
                        repositoryRoot
                    )
                ).toThrow('Invalid package path');
            }
        );

        it('rejects paths outside the repository', () => {
            expect(() =>
                validatePackageInventory(
                    [{name: '@test/escape', path: '../escape'}],
                    repositoryRoot
                )
            ).toThrow('Package path escapes repository root');
        });

        it('independently discovers omitted non-private kit manifests', () => {
            const root = fs.mkdtempSync(
                path.join(os.tmpdir(), 'v3-package-discovery-')
            );
            fs.mkdirSync(path.join(root, 'kits', 'listed'), {recursive: true});
            fs.mkdirSync(path.join(root, 'kits', 'omitted'), {recursive: true});
            fs.writeFileSync(
                path.join(root, 'kits/listed/package.json'),
                JSON.stringify({name: '@test/listed'})
            );
            fs.writeFileSync(
                path.join(root, 'kits/omitted/package.json'),
                JSON.stringify({name: '@test/omitted'})
            );
            const discovered = discoverPublishableKitManifests(root);

            expect(() =>
                assertExactKitInventory(
                    [{name: '@test/listed', path: 'kits/listed'}],
                    discovered
                )
            ).toThrow('does not exactly match');
            fs.rmSync(root, {force: true, recursive: true});
        });
    });

    describe('candidate identity', () => {
        const packages = [
            {
                integrity: 'sha512-example',
                name: '@mparticle/web-sdk',
                path: '.',
                sha256: artifactSha,
                size: 123,
                tarball: 'mparticle-web-sdk-3.1.0.tgz',
                version: '3.1.0',
            },
        ];

        it('serializes and hashes JSON independently of object key order', () => {
            const first = {z: 1, nested: {b: 2, a: 1}};
            const second = {nested: {a: 1, b: 2}, z: 1};

            expect(canonicalJson(first)).toBe(
                '{"nested":{"a":1,"b":2},"z":1}\n'
            );
            expect(sha256Canonical(first)).toBe(sha256Canonical(second));
        });

        it('keeps candidate_sha out of the committed manifest', () => {
            const manifest = createCandidateManifest({
                build: buildTools,
                packages,
                release_notes: releaseNotes,
                source_sha: sourceSha,
                version: '3.1.0',
            });

            expect(manifest).toEqual({
                build: buildTools,
                packages,
                release_notes: releaseNotes,
                schema_version: 1,
                source_sha: sourceSha,
                version: '3.1.0',
            });
            expect(manifest).not.toHaveProperty('candidate_sha');
        });

        it.each(['name', 'path', 'tarball', 'integrity'])(
            'rejects an empty package artifact %s',
            field => {
                expect(() =>
                    createCandidateManifest({
                        build: buildTools,
                        packages: [{...packages[0], [field]: '   '}],
                        release_notes: releaseNotes,
                        source_sha: sourceSha,
                        version: '3.1.0',
                    })
                ).toThrow('Incomplete package artifact');
            }
        );

        it.each(['name', 'path', 'tarball'])(
            'rejects duplicate package artifact %s values',
            field => {
                const secondPackage = {
                    ...packages[0],
                    name: '@mparticle/second',
                    path: 'kits/second',
                    tarball: 'mparticle-second-3.1.0.tgz',
                    [field]: packages[0][field],
                };

                expect(() =>
                    createCandidateManifest({
                        build: buildTools,
                        packages: [packages[0], secondPackage],
                        release_notes: releaseNotes,
                        source_sha: sourceSha,
                        version: '3.1.0',
                    })
                ).toThrow(`Duplicate package artifact ${field}`);
            }
        );

        it('binds the candidate commit to the manifest and artifacts later', () => {
            const envelope = createReleaseEnvelope({
                actions_artifacts: [actionsArtifact],
                attestation_signer: attestationSigner,
                artifact_subjects: [
                    {name: 'release-packages', sha256: artifactSha},
                ],
                candidate_sha: candidateSha,
                cycle_deployment_id: 81,
                cycle_id: cycleSha,
                deployment_id: 77,
                manifest_sha256: manifestSha,
                source_sha: sourceSha,
                stable_tag: 'v3.1.0',
                version: '3.1.0',
                caller_workflow: {
                    repository: 'mParticle/mparticle-web-sdk',
                    run_attempt: 1,
                    run_id: 123,
                    workflow_ref:
                        'mParticle/mparticle-web-sdk/.github/workflows/' +
                        'staging-step-1.yml@refs/heads/main',
                },
            });

            expect(envelope.candidate_sha).toBe(candidateSha);
            expect(envelope.manifest_sha256).toBe(manifestSha);
            expect(envelope.caller_workflow.workflow_ref).toContain(
                'staging-step-1.yml'
            );
            expect(envelope.attestation_signer).toEqual(attestationSigner);
            expect(envelope).not.toHaveProperty('workflow');
            expect(envelope.artifact_subjects).toEqual([
                {name: 'release-packages', sha256: artifactSha},
            ]);
        });

        it.each(['repository', 'workflow_ref'])(
            'rejects an empty workflow %s',
            field => {
                expect(() =>
                    createReleaseEnvelope({
                        actions_artifacts: [actionsArtifact],
                        attestation_signer: attestationSigner,
                        artifact_subjects: [
                            {name: 'release-packages', sha256: artifactSha},
                        ],
                        candidate_sha: candidateSha,
                        cycle_deployment_id: 81,
                        cycle_id: cycleSha,
                        deployment_id: 77,
                        manifest_sha256: manifestSha,
                        source_sha: sourceSha,
                        stable_tag: 'v3.1.0',
                        version: '3.1.0',
                        caller_workflow: {
                            repository: 'mParticle/mparticle-web-sdk',
                            run_attempt: 1,
                            run_id: 123,
                            workflow_ref: 'workflow-ref',
                            [field]: ' ',
                        },
                    })
                ).toThrow('complete caller workflow identity');
            }
        );

        it.each([
            ['run_id', 0],
            ['run_id', -1],
            ['run_id', Number.MAX_SAFE_INTEGER + 1],
            ['run_attempt', 0],
            ['run_attempt', -1],
            ['run_attempt', Number.MAX_SAFE_INTEGER + 1],
        ])('rejects invalid workflow %s value %p', (field, value) => {
            expect(() =>
                createReleaseEnvelope({
                    actions_artifacts: [actionsArtifact],
                    attestation_signer: attestationSigner,
                    artifact_subjects: [
                        {name: 'release-packages', sha256: artifactSha},
                    ],
                    candidate_sha: candidateSha,
                    cycle_deployment_id: 81,
                    cycle_id: cycleSha,
                    deployment_id: 77,
                    manifest_sha256: manifestSha,
                    source_sha: sourceSha,
                    stable_tag: 'v3.1.0',
                    version: '3.1.0',
                    caller_workflow: {
                        repository: 'mParticle/mparticle-web-sdk',
                        run_attempt: 1,
                        run_id: 123,
                        workflow_ref: 'workflow-ref',
                        [field]: value,
                    },
                })
            ).toThrow('complete caller workflow identity');
        });

        it('rejects an empty artifact subject name', () => {
            expect(() =>
                createReleaseEnvelope({
                    actions_artifacts: [actionsArtifact],
                    attestation_signer: attestationSigner,
                    artifact_subjects: [{name: ' ', sha256: artifactSha}],
                    candidate_sha: candidateSha,
                    cycle_deployment_id: 81,
                    cycle_id: cycleSha,
                    deployment_id: 77,
                    manifest_sha256: manifestSha,
                    source_sha: sourceSha,
                    stable_tag: 'v3.1.0',
                    version: '3.1.0',
                    caller_workflow: {
                        repository: 'mParticle/mparticle-web-sdk',
                        run_attempt: 1,
                        run_id: 123,
                        workflow_ref: 'workflow-ref',
                    },
                })
            ).toThrow('Invalid artifact subject');
        });
    });
});
