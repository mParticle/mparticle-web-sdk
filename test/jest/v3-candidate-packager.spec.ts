import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {execFileSync} from 'child_process';

const {loadReleaseInventory} = require('../../scripts/prepare-kit-release');
const {
    applyCandidateUmask,
    copyBundles,
    createCandidateOutput,
    createCdnArchive,
    createFileInventory,
    expectedBundlePaths,
    expectedKitBundlePaths,
    findGnuTar,
    gzipDeterministic,
    npmExecutable,
    parseArguments,
    requiredNpmBundlePaths,
    resolveCandidateOutput,
    sha256,
    validateBuiltBundles,
    validateCandidateManifests,
    validatePackedBundles,
    validatePackedModes,
    writeMetadata,
} = require('../../scripts/package-v3-candidate');

const repositoryRoot = path.resolve(__dirname, '../..');

function readJson(filePath: string) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function makeTempDirectory(prefix: string): string {
    return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
}

describe('V3 candidate packager', () => {
    it('covers every public package and private build root', () => {
        const inventory = loadReleaseInventory();
        const bundlePaths = expectedBundlePaths(inventory);

        expect(inventory.publishEntries).toHaveLength(33);
        expect(inventory.buildPaths).toHaveLength(31);
        expect(inventory.buildPaths).toContain('kits/adobe');
        expect(inventory.buildPaths).toContain('kits/google-analytics-4');
        // 4 core + 2 adobe private + kit bundles (rokt×6, roktpayplus×6, 31 others without maps)
        expect(bundlePaths).toHaveLength(84);
        expect(bundlePaths).toContain('dist/mparticle.common.js');
        expect(bundlePaths).toContain('dist/mparticle.stub.js');
        // Core production build (ENVIRONMENT=prod) sets sourcemap:false — no maps
        expect(bundlePaths).not.toContain('dist/mparticle.common.js.map');
        expect(bundlePaths).not.toContain('dist/mparticle.stub.js.map');
        expect(bundlePaths).toContain(
            'kits/adobe/HeartbeatKit/dist/AdobeHBKit.iife.js'
        );
        // Adobe sourcemap is gated on V3_CANDIDATE_SOURCEMAPS — no map in release
        expect(bundlePaths).not.toContain(
            'kits/adobe/HeartbeatKit/dist/AdobeHBKit.iife.js.map'
        );
        // Vite-built kits do produce maps
        expect(bundlePaths).toContain('kits/rokt/dist/Rokt-Kit.common.js');
        expect(bundlePaths).toContain('kits/rokt/dist/Rokt-Kit.common.js.map');
        expect(bundlePaths).toContain(
            'kits/roktpayplus/dist/RoktPayPlus-Kit.common.js.map'
        );
    });

    it('derives CommonJS, IIFE, ESM outputs; source maps only when producesMaps is true', () => {
        const entry = {name: '@mparticle/example', local_path: 'kits/example'};
        const manifest = {
            main: 'dist/Example.common.js',
            module: 'dist/Example.esm.js',
        };

        // Default (rollup kits): no source maps
        expect(expectedKitBundlePaths(entry, manifest)).toEqual([
            'kits/example/dist/Example.common.js',
            'kits/example/dist/Example.esm.js',
            'kits/example/dist/Example.iife.js',
        ]);

        // Vite kits (rokt, roktpayplus): source maps included
        expect(expectedKitBundlePaths(entry, manifest, true)).toEqual([
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

    it('accepts version as the first positional argument', () => {
        expect(
            parseArguments([
                '3.6.1',
                '--build-id',
                '12345-2',
                '--output',
                'out/candidate',
            ])
        ).toEqual({
            version: '3.6.1',
            buildId: '12345-2',
            output: 'out/candidate',
        });

        // --output defaults to out/candidate-<version>-<buildId>
        const withDefaults = parseArguments([
            '3.6.1',
            '--build-id',
            '42',
        ]);
        expect(withDefaults.version).toBe('3.6.1');
        expect(withDefaults.buildId).toBe('42');
        expect(withDefaults.output).toBe('out/candidate-3.6.1-42');

        expect(() =>
            parseArguments([
                '3.6.1',
                '--build-id',
                '12345-2',
                '--output',
                'out/candidate',
                '--skip-build',
            ])
        ).toThrow('Unknown argument: --skip-build');
        expect(() => parseArguments([])).toThrow('version is required');
        expect(() =>
            parseArguments([
                '3.6.1',
                '--build-id',
                '../bad',
                '--output',
                'out/candidate',
            ])
        ).toThrow('--build-id must contain only');
        for (const output of [
            '/tmp/candidate',
            'C:\\temp\\candidate',
            '../candidate',
            'out/../candidate',
        ]) {
            expect(() =>
                parseArguments(['3.6.1', '--build-id', '12345-2', '--output', output])
            ).toThrow('--output must be a relative path');
        }
    });

    it('defaults build-id from GITHUB_RUN_ID or a local timestamp', () => {
        const savedRunId = process.env.GITHUB_RUN_ID;
        try {
            process.env.GITHUB_RUN_ID = '987654321';
            const withRunId = parseArguments([
                '3.6.1',
                '--output',
                'out/candidate',
            ]);
            expect(withRunId.buildId).toBe('987654321');

            delete process.env.GITHUB_RUN_ID;
            const before = Date.now();
            const withTimestamp = parseArguments([
                '3.6.1',
                '--output',
                'out/candidate',
            ]);
            const after = Date.now();
            expect(withTimestamp.buildId).toMatch(/^local-\d+$/);
            const ts = parseInt(withTimestamp.buildId.slice('local-'.length), 10);
            expect(ts).toBeGreaterThanOrEqual(before);
            expect(ts).toBeLessThanOrEqual(after);
        } finally {
            if (savedRunId !== undefined) {
                process.env.GITHUB_RUN_ID = savedRunId;
            } else {
                delete process.env.GITHUB_RUN_ID;
            }
        }
    });

    it('rejects output paths through symlinks', () => {
        const tempDirectory = makeTempDirectory('mparticle-candidate-output-');
        const repository = path.join(tempDirectory, 'repository');
        const external = path.join(tempDirectory, 'external');

        try {
            fs.mkdirSync(repository);
            fs.mkdirSync(external);
            fs.mkdirSync(path.join(repository, 'out'));
            fs.mkdirSync(path.join(repository, 'out/internal'));
            fs.symlinkSync(external, path.join(repository, 'out/linked'));
            fs.symlinkSync(
                path.join(repository, 'out/internal'),
                path.join(repository, 'out/alias')
            );

            for (const output of [
                'out/linked/candidate',
                'out/alias/candidate',
            ]) {
                expect(() =>
                    resolveCandidateOutput(output, repository)
                ).toThrow('must be a real directory');
            }
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

            fs.rmSync(path.join(repository, 'out'), {recursive: true});
            fs.symlinkSync(external, path.join(repository, 'out'));
            expect(() =>
                resolveCandidateOutput('out/candidate', repository)
            ).toThrow('must be a real directory');
        } finally {
            fs.rmSync(tempDirectory, {force: true, recursive: true});
        }
    });

    it('creates the candidate output exclusively', () => {
        const repository = makeTempDirectory('mparticle-candidate-create-');

        try {
            const outputPath = createCandidateOutput(
                'out/artifacts/candidate',
                repository
            );
            expect(outputPath).toBe(
                path.join(repository, 'out/artifacts/candidate')
            );
            expect(fs.statSync(outputPath).isDirectory()).toBe(true);
            expect(() =>
                createCandidateOutput('out/artifacts/candidate', repository)
            ).toThrow('Candidate output already exists');
            expect(() =>
                resolveCandidateOutput('out/artifacts/candidate', repository)
            ).toThrow('Candidate output already exists');
        } finally {
            fs.rmSync(repository, {force: true, recursive: true});
        }
    });

    it('validates versions and manifests before packaging', () => {
        const inventory = loadReleaseInventory();
        const coreManifest = readJson(path.join(repositoryRoot, 'package.json'));
        const packageLock = readJson(
            path.join(repositoryRoot, 'package-lock.json')
        );

        expect(
            validateCandidateManifests(inventory, coreManifest, packageLock)
        ).toBe(coreManifest.version);
        expect(() =>
            validateCandidateManifests(
                inventory,
                {...coreManifest, version: `${coreManifest.version}-beta.1`},
                packageLock
            )
        ).toThrow('Expected a stable semantic version');
        expect(() =>
            validateCandidateManifests(inventory, coreManifest, {
                ...packageLock,
                version: '0.0.1',
            })
        ).toThrow('package-lock.json');
        const otherVersion = '999.0.0';
        expect(() =>
            validateCandidateManifests(
                inventory,
                {...coreManifest, version: otherVersion},
                {
                    version: otherVersion,
                    packages: {'': {version: otherVersion}},
                }
            )
        ).toThrow(`expected ${otherVersion}`);
    });

    it('uses the npm that ships with the running Node', () => {
        expect(npmExecutable).toBe(
            path.join(
                path.dirname(process.execPath),
                process.platform === 'win32' ? 'npm.cmd' : 'npm'
            )
        );
    });

    it('creates files with portable modes regardless of the caller umask', () => {
        const tempDirectory = makeTempDirectory('mparticle-candidate-umask-');
        const originalUmask = process.umask(0o077);

        try {
            applyCandidateUmask();
            const filePath = path.join(tempDirectory, 'bundle.js');
            fs.writeFileSync(filePath, 'bundle\n');
            fs.mkdirSync(path.join(tempDirectory, 'dist'));
            expect(fs.statSync(filePath).mode & 0o777).toBe(0o644);
            expect(
                fs.statSync(path.join(tempDirectory, 'dist')).mode & 0o777
            ).toBe(0o755);
        } finally {
            process.umask(originalUmask);
            fs.rmSync(tempDirectory, {force: true, recursive: true});
        }
    });

    it('requires GNU tar', () => {
        expect(() => findGnuTar({TAR: 'tar'})).toThrow(
            'TAR must be an absolute path'
        );
        expect(() => findGnuTar({TAR: process.execPath})).toThrow(
            'is not GNU tar'
        );
        const gnuTar = findGnuTar({});
        expect(
            execFileSync(gnuTar, ['--version'], {encoding: 'utf8'})
        ).toContain('GNU tar');
    });

    it('rejects npm tarballs with non-portable file modes', () => {
        const tempDirectory = makeTempDirectory('mparticle-candidate-modes-');
        const tarballPath = path.join(tempDirectory, 'example.tgz');
        const bundlePath = path.join(tempDirectory, 'package/dist/example.js');

        try {
            fs.mkdirSync(path.dirname(bundlePath), {recursive: true});
            fs.writeFileSync(bundlePath, 'bundle\n');
            const pack = () =>
                execFileSync(findGnuTar({}), [
                    '-czf',
                    tarballPath,
                    '-C',
                    tempDirectory,
                    'package/dist/example.js',
                ]);

            fs.chmodSync(bundlePath, 0o644);
            pack();
            expect(() =>
                validatePackedModes('@mparticle/example', tarballPath)
            ).not.toThrow();

            fs.chmodSync(bundlePath, 0o600);
            pack();
            expect(() =>
                validatePackedModes('@mparticle/example', tarballPath)
            ).toThrow('non-portable entry');
        } finally {
            fs.rmSync(tempDirectory, {force: true, recursive: true});
        }
    });

    it('validates already-built output structure and rejects missing bundles', () => {
        const tempDirectory = makeTempDirectory('mparticle-candidate-built-');

        const coreBundles = [
            'dist/mparticle.common.js',
            'dist/mparticle.esm.js',
            'dist/mparticle.js',
            'dist/mparticle.stub.js',
        ];
        const privateBundles = [
            'kits/adobe/HeartbeatKit/dist/AdobeHBKit.esm.js',
            'kits/adobe/HeartbeatKit/dist/AdobeHBKit.iife.js',
        ];

        // Empty inventory: only core + private bundles are required
        const emptyInventory = {
            buildPaths: [],
            publishEntries: [],
            publishOutputPaths: [],
        };

        try {
            // No dist/ at all → missing all core bundles
            expect(() =>
                validateBuiltBundles(emptyInventory, tempDirectory)
            ).toThrow('Missing candidate bundles');

            // Create all required bundles
            for (const bundle of [...coreBundles, ...privateBundles]) {
                const fullPath = path.join(tempDirectory, bundle);
                fs.mkdirSync(path.dirname(fullPath), {recursive: true});
                fs.writeFileSync(fullPath, 'bundle\n');
            }

            // Complete set → no error
            expect(() =>
                validateBuiltBundles(emptyInventory, tempDirectory)
            ).not.toThrow();

            // Remove one bundle → missing error
            fs.rmSync(path.join(tempDirectory, coreBundles[0]));
            expect(() =>
                validateBuiltBundles(emptyInventory, tempDirectory)
            ).toThrow('Missing candidate bundles: dist/mparticle.common.js');
        } finally {
            fs.rmSync(tempDirectory, {force: true, recursive: true});
        }
    });

    it('rejects unexpected extra bundles in already-built output', () => {
        const tempDirectory = makeTempDirectory('mparticle-candidate-extra-');

        const emptyInventory = {
            buildPaths: [],
            publishEntries: [],
            publishOutputPaths: [],
        };

        try {
            for (const bundle of [
                'dist/mparticle.common.js',
                'dist/mparticle.esm.js',
                'dist/mparticle.js',
                'dist/mparticle.stub.js',
                'kits/adobe/HeartbeatKit/dist/AdobeHBKit.esm.js',
                'kits/adobe/HeartbeatKit/dist/AdobeHBKit.iife.js',
            ]) {
                const fullPath = path.join(tempDirectory, bundle);
                fs.mkdirSync(path.dirname(fullPath), {recursive: true});
                fs.writeFileSync(fullPath, 'bundle\n');
            }

            // Extra unexpected bundle
            const extra = path.join(tempDirectory, 'dist/mparticle.extra.js');
            fs.writeFileSync(extra, 'extra\n');
            expect(() =>
                validateBuiltBundles(emptyInventory, tempDirectory)
            ).toThrow('Unexpected candidate bundles');
        } finally {
            fs.rmSync(tempDirectory, {force: true, recursive: true});
        }
    });

    it('copyBundles stages core bundles under core/ and kit bundles under their original path', () => {
        const tempDirectory = makeTempDirectory('mparticle-candidate-copy-');
        const sourceRoot = path.join(tempDirectory, 'source');
        const candidateRoot = path.join(tempDirectory, 'candidate');

        try {
            const bundles = [
                'dist/mparticle.common.js',
                'kits/example/dist/Example.iife.js',
            ];
            for (const bundle of bundles) {
                const fullPath = path.join(sourceRoot, bundle);
                fs.mkdirSync(path.dirname(fullPath), {recursive: true});
                fs.writeFileSync(fullPath, `content of ${bundle}\n`);
            }
            fs.mkdirSync(candidateRoot);

            copyBundles(bundles, candidateRoot, sourceRoot);

            // Core bundle goes under core/
            expect(
                fs.readFileSync(
                    path.join(candidateRoot, 'core/dist/mparticle.common.js'),
                    'utf8'
                )
            ).toBe('content of dist/mparticle.common.js\n');
            // Kit bundle stays at its original path
            expect(
                fs.readFileSync(
                    path.join(
                        candidateRoot,
                        'kits/example/dist/Example.iife.js'
                    ),
                    'utf8'
                )
            ).toBe('content of kits/example/dist/Example.iife.js\n');
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
            const header = fs.readFileSync(firstArchive).subarray(0, 10);
            expect(header.readUInt32LE(4)).toBe(0);
            expect(header[3]).toBe(0);
            expect(header[9]).toBe(3);
            expect(gzipDeterministic(Buffer.from('bundle'))).toEqual(
                gzipDeterministic(Buffer.from('bundle'))
            );
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
            execFileSync(findGnuTar({}), [
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

            fs.writeFileSync(
                path.join(candidateRoot, 'core/metadata.json'),
                '{}'
            );
            expect(
                createFileInventory(candidateRoot).map(
                    (file: {path: string}) => file.path
                )
            ).toEqual(['core/a.js', 'core/metadata.json', 'npm/z.tgz']);

            fs.writeFileSync(path.join(candidateRoot, 'core/empty.js'), '');
            expect(() => createFileInventory(candidateRoot)).toThrow(
                'Candidate file is empty: core/empty.js'
            );
        } finally {
            fs.rmSync(candidateRoot, {force: true, recursive: true});
        }
    });

    it('validates that CLI version matches the already-built package.json', () => {
        const inventory = loadReleaseInventory();
        const coreManifest = readJson(path.join(repositoryRoot, 'package.json'));
        const packageLock = readJson(
            path.join(repositoryRoot, 'package-lock.json')
        );
        const currentVersion: string = coreManifest.version;

        // Matching version: validateCandidateManifests returns the version
        expect(
            validateCandidateManifests(inventory, coreManifest, packageLock)
        ).toBe(currentVersion);

        // A mismatched version should throw once validateCandidateManifests
        // is used alongside the version check in packageCandidate. We verify
        // validateCandidateManifests returns the manifest version, not the CLI arg.
        const wrongVersion = '0.0.1';
        expect(() =>
            validateCandidateManifests(
                inventory,
                {...coreManifest, version: wrongVersion},
                {...packageLock, version: wrongVersion, packages: {'': {version: wrongVersion}}}
            )
        ).toThrow(`expected ${wrongVersion}`);
    });
});
