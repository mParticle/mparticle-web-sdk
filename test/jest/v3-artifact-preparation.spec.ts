/* eslint-env jest, node, es2021 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const {
    parseCliArguments,
    prepareReleaseArtifacts,
    resolveReleasePath,
} = require('../../scripts/release/prepare-artifacts');

const sourceSha = 'a'.repeat(40);

function createFixture(version = '3.2.0') {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'v3-artifacts-root-'));
    const releaseDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), 'v3-artifacts-output-')
    );
    const inventory = [
        {name: '@test/core', path: '.', type: 'core'},
        {name: '@test/kit', path: 'kits/kit', type: 'kit'},
    ];

    fs.writeFileSync(path.join(root, 'VERSION'), `${version}\n`);
    fs.mkdirSync(path.join(root, '.release'));
    fs.writeFileSync(
        path.join(root, '.release/release-notes.md'),
        'Release notes\n'
    );
    fs.mkdirSync(path.join(root, 'kits/kit'), {recursive: true});
    inventory.forEach(entry => {
        fs.writeFileSync(
            path.join(root, entry.path, 'package.json'),
            JSON.stringify({name: entry.name, version})
        );
    });

    return {inventory, releaseDirectory, root, version};
}

function createPack(
    calls: string[],
    overrides: Record<string, Partial<{filename: string; name: string; version: string}>> = {}
) {
    return ({
        entry,
        outputDirectory,
    }: {
        entry: {name: string; path: string; type: string};
        outputDirectory: string;
    }) => {
        calls.push(entry.name);
        const filename = `${entry.name.split('/').pop()}-3.2.0.tgz`;
        const result = {
            filename,
            name: entry.name,
            version: '3.2.0',
            ...overrides[entry.name],
        };
        const tarballPath = path.resolve(outputDirectory, result.filename!);
        if (result.filename === path.basename(result.filename)) {
            fs.writeFileSync(tarballPath, `packed:${entry.name}`);
        }
        return result;
    };
}

describe('v3 exact-artifact preparation', () => {
    const roots: string[] = [];

    afterEach(() => {
        roots.splice(0).forEach(root =>
            fs.rmSync(root, {force: true, recursive: true})
        );
    });

    function fixture(version?: string) {
        const result = createFixture(version);
        roots.push(result.root, result.releaseDirectory);
        return result;
    }

    it('packs each package once in authoritative inventory order', () => {
        const {inventory, releaseDirectory, root} = fixture();
        const calls: string[] = [];

        const result = prepareReleaseArtifacts({
            inventory,
            packPackage: createPack(calls),
            releaseDirectory,
            repositoryRoot: root,
            sourceSha,
        });

        expect(calls).toEqual(['@test/core', '@test/kit']);
        expect(result.artifacts.map((artifact: {name: string}) => artifact.name))
            .toEqual(calls);
        expect(fs.readdirSync(releaseDirectory).sort()).toEqual([
            'candidate-manifest.json',
            'core-3.2.0.tgz',
            'kit-3.2.0.tgz',
            'release-notes.md',
        ]);
    });

    it('writes exact canonical metadata calculated from each tarball', () => {
        const {inventory, releaseDirectory, root, version} = fixture();
        const calls: string[] = [];

        const {manifest, manifestPath} = prepareReleaseArtifacts({
            inventory,
            packPackage: createPack(calls),
            releaseDirectory,
            repositoryRoot: root,
            sourceSha,
        });
        const bytes = Buffer.from('packed:@test/core');
        const expectedCore = {
            integrity: `sha512-${crypto
                .createHash('sha512')
                .update(bytes)
                .digest('base64')}`,
            name: '@test/core',
            path: '.',
            sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
            size: bytes.length,
            tarball: 'core-3.2.0.tgz',
            version,
        };

        expect(manifest).toEqual({
            build: expect.objectContaining({
                node: expect.any(String),
                npm: expect.any(String),
            }),
            packages: [
                expectedCore,
                expect.objectContaining({
                    name: '@test/kit',
                    path: 'kits/kit',
                }),
            ],
            release_notes: {
                path: 'release-notes.md',
                sha256: crypto
                    .createHash('sha256')
                    .update('Release notes\n')
                    .digest('hex'),
                size: Buffer.byteLength('Release notes\n'),
            },
            schema_version: 1,
            source_sha: sourceSha,
            version,
        });
        expect(fs.readFileSync(manifestPath, 'utf8')).toBe(
            `${JSON.stringify(manifest)}\n`
        );
    });

    it.each(['short', 'A'.repeat(40)])(
        'rejects invalid source SHA %p before packing',
        invalidSourceSha => {
            const {inventory, releaseDirectory, root} = fixture();
            const packPackage = jest.fn();

            expect(() =>
                prepareReleaseArtifacts({
                    inventory,
                    packPackage,
                    releaseDirectory,
                    repositoryRoot: root,
                    sourceSha: invalidSourceSha,
                })
            ).toThrow('full lowercase Git SHA');
            expect(packPackage).not.toHaveBeenCalled();
        }
    );

    it('rejects an invalid VERSION before packing', () => {
        const {inventory, releaseDirectory, root} = fixture('3.2.0-rc.1');
        const packPackage = jest.fn();

        expect(() =>
            prepareReleaseArtifacts({
                inventory,
                packPackage,
                releaseDirectory,
                repositoryRoot: root,
                sourceSha,
            })
        ).toThrow('Expected a stable semantic version');
        expect(packPackage).not.toHaveBeenCalled();
    });

    it('rejects package manifests that do not match inventory', () => {
        const {inventory, releaseDirectory, root} = fixture();
        const packPackage = jest.fn();
        fs.writeFileSync(
            path.join(root, 'kits/kit/package.json'),
            JSON.stringify({name: '@test/other', version: '3.2.0'})
        );

        expect(() =>
            prepareReleaseArtifacts({
                inventory,
                packPackage,
                releaseDirectory,
                repositoryRoot: root,
                sourceSha,
            })
        ).toThrow('Package name mismatch');
        expect(packPackage).not.toHaveBeenCalled();
    });

    it('rejects packed metadata that does not match the manifest', () => {
        const {inventory, releaseDirectory, root} = fixture();
        const calls: string[] = [];

        expect(() =>
            prepareReleaseArtifacts({
                inventory,
                packPackage: createPack(calls, {
                    '@test/kit': {version: '9.9.9'},
                }),
                releaseDirectory,
                repositoryRoot: root,
                sourceSha,
            })
        ).toThrow('Packed package metadata mismatch');
        expect(calls).toEqual(['@test/core', '@test/kit']);
    });

    it.each(['../outside.tgz', 'nested/package.tgz', '/tmp/outside.tgz'])(
        'rejects unsafe tarball path %p',
        filename => {
            const {inventory, releaseDirectory, root} = fixture();
            const calls: string[] = [];

            expect(() =>
                prepareReleaseArtifacts({
                    inventory,
                    packPackage: createPack(calls, {
                        '@test/core': {filename},
                    }),
                    releaseDirectory,
                    repositoryRoot: root,
                    sourceSha,
                })
            ).toThrow('Unsafe tarball path');
        }
    );

    it('rejects duplicate tarball paths', () => {
        const {inventory, releaseDirectory, root} = fixture();
        const calls: string[] = [];

        expect(() =>
            prepareReleaseArtifacts({
                inventory,
                packPackage: createPack(calls, {
                    '@test/core': {filename: 'same.tgz'},
                    '@test/kit': {filename: 'same.tgz'},
                }),
                releaseDirectory,
                repositoryRoot: root,
                sourceSha,
            })
        ).toThrow('Duplicate tarball path');
    });

    it('cleans only its temporary output after pack failure', () => {
        const {inventory, releaseDirectory, root} = fixture();
        const sibling = path.join(path.dirname(releaseDirectory), 'keep-me');
        roots.push(sibling);
        fs.mkdirSync(sibling);
        fs.writeFileSync(path.join(sibling, 'sentinel'), 'keep');
        fs.writeFileSync(path.join(releaseDirectory, 'sentinel'), 'keep');

        expect(() =>
            prepareReleaseArtifacts({
                inventory,
                packPackage: () => {
                    throw new Error('pack failed');
                },
                releaseDirectory,
                repositoryRoot: root,
                sourceSha,
            })
        ).toThrow('pack failed');

        expect(fs.readFileSync(path.join(sibling, 'sentinel'), 'utf8')).toBe(
            'keep'
        );
        expect(fs.readdirSync(releaseDirectory)).toEqual(['sentinel']);
    });

    it('refuses dangerous cleanup roots and escaping output paths', () => {
        expect(() => resolveReleasePath('/tmp/release', '../outside')).toThrow(
            'escapes directory'
        );

        const {inventory, root} = fixture();
        expect(() =>
            prepareReleaseArtifacts({
                inventory,
                packPackage: jest.fn(),
                releaseDirectory: process.cwd(),
                repositoryRoot: root,
                sourceSha,
            })
        ).toThrow('Refusing dangerous release directory');
    });

    it('requires one value for every named CLI option', () => {
        expect(
            parseCliArguments([
                '--repository-root',
                '/repo',
                '--release-directory',
                '/release',
                '--release-notes',
                '/notes',
                '--source-sha',
                sourceSha,
            ])
        ).toEqual({
            '--release-directory': '/release',
            '--release-notes': '/notes',
            '--repository-root': '/repo',
            '--source-sha': sourceSha,
        });
        expect(() =>
            parseCliArguments(['--repository-root', '/repo'])
        ).toThrow('Usage:');
        expect(() =>
            parseCliArguments([
                '--repository-root',
                '/repo',
                '--repository-root',
                '/other',
                '--release-notes',
                '/notes',
                '--source-sha',
                sourceSha,
            ])
        ).toThrow('Duplicate CLI option');
    });
});
