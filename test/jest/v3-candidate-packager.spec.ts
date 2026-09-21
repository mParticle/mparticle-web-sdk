import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {execFileSync} from 'child_process';

const {loadReleaseInventory} = require('../../scripts/prepare-kit-release');
const {
    assertCleanSource,
    createCdnArchive,
    createFileInventory,
    expectedBundlePaths,
    expectedKitBundlePaths,
    parseArguments,
    requiredNpmBundlePaths,
    resolveCandidateOutput,
    sha256,
    validatePackedBundles,
    writeMetadata,
} = require('../../scripts/package-v3-candidate');

describe('V3 candidate packager', () => {
    it('covers every public package and private build root', () => {
        const inventory = loadReleaseInventory();
        const bundlePaths = expectedBundlePaths(inventory);

        expect(inventory.publishEntries).toHaveLength(33);
        expect(inventory.buildPaths).toHaveLength(31);
        expect(inventory.buildPaths).toContain('kits/adobe');
        expect(inventory.buildPaths).toContain('kits/google-analytics-4');
        expect(bundlePaths).toHaveLength(154);
        expect(bundlePaths).toContain('dist/mparticle.common.js');
        expect(bundlePaths).toContain('dist/mparticle.common.js.map');
        expect(bundlePaths).toContain(
            'kits/adobe/HeartbeatKit/dist/AdobeHBKit.iife.js'
        );
        expect(bundlePaths).toContain(
            'kits/adobe/HeartbeatKit/dist/AdobeHBKit.iife.js.map'
        );
    });

    it('derives CommonJS, IIFE, ESM, and source-map outputs', () => {
        expect(
            expectedKitBundlePaths(
                {name: '@mparticle/example', local_path: 'kits/example'},
                {
                    main: 'dist/Example.common.js',
                    module: 'dist/Example.esm.js',
                }
            )
        ).toEqual([
            'kits/example/dist/Example.common.js',
            'kits/example/dist/Example.common.js.map',
            'kits/example/dist/Example.esm.js',
            'kits/example/dist/Example.esm.js.map',
            'kits/example/dist/Example.iife.js',
            'kits/example/dist/Example.iife.js.map',
        ]);

        expect(
            requiredNpmBundlePaths({
                main: 'dist/Example.common.js',
                module: 'dist/Example.esm.js',
                browser: 'dist/Example.common.js',
                files: [
                    'dist/Example.common.js',
                    'dist/Example.esm.js',
                    'dist/Example.iife.js',
                    'dist/Example.d.ts',
                ],
            })
        ).toEqual([
            'dist/Example.common.js',
            'dist/Example.esm.js',
            'dist/Example.iife.js',
        ]);
        expect(
            requiredNpmBundlePaths({
                main: 'dist/Example.common.js',
                files: ['dist/Example.common.js'],
            })
        ).toEqual(['dist/Example.common.js']);
    });

    it('rejects package manifests that cannot define a complete inventory', () => {
        expect(() =>
            expectedKitBundlePaths(
                {name: '@mparticle/example', local_path: 'kits/example'},
                {main: 'index.js'}
            )
        ).toThrow('main must identify a dist/*.common.js bundle');
        expect(() =>
            expectedKitBundlePaths(
                {name: '@mparticle/example', local_path: 'kits/example'},
                {
                    main: 'dist/Example.common.js',
                    module: 'dist/Example.js',
                }
            )
        ).toThrow('module must identify a dist/*.esm.js bundle');
    });

    it('requires explicit safe build and output identities', () => {
        expect(
            parseArguments([
                '--build-id',
                '12345-2',
                '--output',
                'out/candidate',
            ])
        ).toEqual({
            buildId: '12345-2',
            output: 'out/candidate',
        });
        expect(() =>
            parseArguments([
                '--build-id',
                '12345-2',
                '--output',
                'out/candidate',
                '--skip-build',
            ])
        ).toThrow('Unknown argument: --skip-build');
        expect(() =>
            parseArguments([
                '--build-id',
                '../candidate',
                '--output',
                'out/candidate',
            ])
        ).toThrow('--build-id must contain only');
        expect(() => parseArguments(['--build-id', '12345-2'])).toThrow(
            '--output is required'
        );
        for (const output of [
            '/tmp/candidate',
            'C:\\temp\\candidate',
            '../candidate',
            'out/../candidate',
        ]) {
            expect(() =>
                parseArguments([
                    '--build-id',
                    '12345-2',
                    '--output',
                    output,
                ])
            ).toThrow('--output must be a relative path');
        }
    });

    it('rejects output paths through external symlinks', () => {
        const tempDirectory = fs.mkdtempSync(
            path.join(os.tmpdir(), 'mparticle-candidate-output-')
        );
        const repository = path.join(tempDirectory, 'repository');
        const external = path.join(tempDirectory, 'external');

        try {
            fs.mkdirSync(repository);
            fs.mkdirSync(external);
            fs.mkdirSync(path.join(repository, 'out'));
            fs.symlinkSync(external, path.join(repository, 'out/linked'));

            expect(() =>
                resolveCandidateOutput('out/linked/candidate', repository)
            ).toThrow('symlink that leaves the repository');
            expect(
                resolveCandidateOutput('out/artifacts/candidate', repository)
            ).toBe(path.join(repository, 'out/artifacts/candidate'));
            for (const output of [
                'src/candidate',
                'dist/candidate',
                'kits/example/candidate',
            ]) {
                expect(() =>
                    resolveCandidateOutput(output, repository)
                ).toThrow('must be inside the repository out/ directory');
            }
        } finally {
            fs.rmSync(tempDirectory, {force: true, recursive: true});
        }
    });

    it('rejects untracked files that would not match the source SHA', () => {
        const tempDirectory = fs.mkdtempSync(
            path.join(os.tmpdir(), 'mparticle-candidate-source-')
        );

        try {
            execFileSync('git', ['init', '--quiet'], {cwd: tempDirectory});
            execFileSync('git', ['config', 'user.email', 'test@example.com'], {
                cwd: tempDirectory,
            });
            execFileSync('git', ['config', 'user.name', 'Candidate Test'], {
                cwd: tempDirectory,
            });
            fs.writeFileSync(path.join(tempDirectory, 'tracked.js'), 'tracked\n');
            execFileSync('git', ['add', 'tracked.js'], {cwd: tempDirectory});
            execFileSync('git', ['commit', '--quiet', '-m', 'test source'], {
                cwd: tempDirectory,
            });

            expect(() => assertCleanSource(tempDirectory)).not.toThrow();
            fs.writeFileSync(
                path.join(tempDirectory, 'untracked.js'),
                'untracked\n'
            );
            expect(() => assertCleanSource(tempDirectory)).toThrow(
                'untracked.js'
            );
        } finally {
            fs.rmSync(tempDirectory, {force: true, recursive: true});
        }
    });

    it('creates a deterministic CDN archive with an exact file inventory', () => {
        const tempDirectory = fs.mkdtempSync(
            path.join(os.tmpdir(), 'mparticle-candidate-archive-')
        );
        const firstRoot = path.join(tempDirectory, 'first');
        const secondRoot = path.join(tempDirectory, 'second');

        try {
            for (const candidateRoot of [firstRoot, secondRoot]) {
                fs.mkdirSync(path.join(candidateRoot, 'core/dist'), {
                    recursive: true,
                });
                fs.mkdirSync(path.join(candidateRoot, 'kits/example/dist'), {
                    recursive: true,
                });
                fs.writeFileSync(
                    path.join(candidateRoot, 'core/dist/core.js'),
                    'core\n'
                );
                fs.writeFileSync(
                    path.join(candidateRoot, 'kits/example/dist/kit.js'),
                    'kit\n'
                );
            }
            const oldTime = new Date(1000);
            const newTime = new Date(2000);
            fs.utimesSync(
                path.join(firstRoot, 'core/dist/core.js'),
                oldTime,
                oldTime
            );
            fs.utimesSync(
                path.join(secondRoot, 'core/dist/core.js'),
                newTime,
                newTime
            );
            fs.chmodSync(path.join(firstRoot, 'core/dist/core.js'), 0o600);
            fs.chmodSync(path.join(secondRoot, 'core/dist/core.js'), 0o755);
            fs.chmodSync(path.join(firstRoot, 'kits/example/dist'), 0o700);
            fs.chmodSync(path.join(secondRoot, 'kits/example/dist'), 0o777);

            const firstArchive = createCdnArchive(firstRoot);
            const secondArchive = createCdnArchive(secondRoot);

            expect(sha256(firstArchive)).toBe(sha256(secondArchive));
        } finally {
            fs.rmSync(tempDirectory, {force: true, recursive: true});
        }
    });

    it('requires npm and CDN bundles to have identical bytes', () => {
        const tempDirectory = fs.mkdtempSync(
            path.join(os.tmpdir(), 'mparticle-candidate-package-')
        );
        const packageRoot = path.join(tempDirectory, 'package');
        const candidateRoot = path.join(tempDirectory, 'candidate');
        const relativeBundlePath = 'dist/example.common.js';
        const relativeIifePath = 'dist/example.iife.js';
        const tarballPath = path.join(tempDirectory, 'example.tgz');

        try {
            for (const root of [packageRoot, candidateRoot]) {
                fs.mkdirSync(path.join(root, 'dist'), {recursive: true});
                fs.writeFileSync(
                    path.join(root, relativeBundlePath),
                    'matching bundle\n'
                );
                fs.writeFileSync(
                    path.join(root, relativeIifePath),
                    'matching iife bundle\n'
                );
            }
            execFileSync('tar', [
                '-czf',
                tarballPath,
                '-C',
                tempDirectory,
                'package',
            ]);

            expect(() =>
                validatePackedBundles(
                    '@mparticle/example',
                    tarballPath,
                    candidateRoot,
                    [relativeBundlePath, relativeIifePath]
                )
            ).not.toThrow();
            expect(() =>
                validatePackedBundles(
                    '@mparticle/example',
                    tarballPath,
                    candidateRoot,
                    ['dist/missing.js']
                )
            ).toThrow('npm tarball is missing required bundle');

            fs.writeFileSync(
                path.join(candidateRoot, relativeBundlePath),
                'different bundle\n'
            );
            expect(() =>
                validatePackedBundles(
                    '@mparticle/example',
                    tarballPath,
                    candidateRoot,
                    [relativeBundlePath]
                )
            ).toThrow('npm and CDN bundles differ');
        } finally {
            fs.rmSync(tempDirectory, {force: true, recursive: true});
        }
    });

    it('writes sorted SHA-256 metadata last', () => {
        const candidateRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'mparticle-candidate-metadata-')
        );

        try {
            fs.mkdirSync(path.join(candidateRoot, 'npm'), {recursive: true});
            fs.mkdirSync(path.join(candidateRoot, 'core'), {recursive: true});
            fs.writeFileSync(path.join(candidateRoot, 'npm/z.tgz'), 'z');
            fs.writeFileSync(path.join(candidateRoot, 'core/a.js'), 'a');

            const files = createFileInventory(candidateRoot);
            expect(files.map((file: {path: string}) => file.path)).toEqual([
                'core/a.js',
                'npm/z.tgz',
            ]);
            expect(files[0]).toEqual({
                path: 'core/a.js',
                size: 1,
                sha256:
                    'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
            });

            const metadata = writeMetadata(
                candidateRoot,
                {
                    version: '3.6.1',
                    sourceSha: 'a'.repeat(40),
                    buildId: '12345-1',
                },
                [
                    {
                        name: '@mparticle/web-sdk',
                        path: 'npm/z.tgz',
                        npmIntegrity: 'sha512-example',
                    },
                ]
            );
            expect(metadata.files).toEqual(files);
            expect(
                fs.readFileSync(
                    path.join(candidateRoot, 'metadata.json'),
                    'utf8'
                )
            ).toBe(`${JSON.stringify(metadata, null, 4)}\n`);
        } finally {
            fs.rmSync(candidateRoot, {force: true, recursive: true});
        }
    });
});
