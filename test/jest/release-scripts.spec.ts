import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const {
    cleanPublishOutputs,
    discoverPublicKitPackages,
    loadReleaseInventory,
    resolveKitPath,
    serializeBuildPaths,
    validateBuildPath,
    validatePublishMatrixCompleteness,
    validatePublicPackageName,
    validateVersion,
} = require('../../scripts/prepare-kit-release');
const {
    appendCoreRecoverySummary,
    appendRecoverySummary,
    assertDistTagWillNotMoveBackward,
    compareStableVersions,
    packPackage,
    preflightKitArtifacts,
    publishKitArtifacts,
    validatePackageManifest,
    verifyCurrentReleaseComplete,
    verifyPublishedCore,
    waitForPublishedCore,
    waitForRemotePackages,
} = require('../../scripts/publish-kits');
const {
    previewKitRelease,
} = require('../../scripts/preview-kit-release');

describe('kit release scripts', () => {
    it('uses the immutable release tag as the recovery authority', () => {
        const workflow = fs.readFileSync(
            path.join(
                __dirname,
                '../../.github/workflows/staging-step-1.yml'
            ),
            'utf8'
        );

        expect(workflow).toContain(
            'git rev-parse "${RESUME_KIT_RELEASE_TAG}^{commit}"'
        );
        expect(workflow).toContain(
            'if [ "$CHECKED_OUT_SHA" != "$CANDIDATE_SHA" ]; then'
        );
        expect(workflow).toContain(
            "if: ${{ inputs.resumeKitReleaseTag == '' }}"
        );
        expect(workflow).not.toContain(
            'NEXT_RELEASE_VERSION_FILE: ${{ runner.temp }}'
        );
        expect(workflow).toContain(
            'NEXT_RELEASE_VERSION_FILE=$RUNNER_TEMP/next-release-version'
        );
        expect(workflow).toContain(
            'if [ -z "${RELEASE_TAG:-}" ] || [ -z "${RELEASE_SHA:-}" ]; then'
        );
    });

    it('loads a unique, complete publish inventory', () => {
        const inventory = loadReleaseInventory();
        const packageNames = inventory.publishEntries.map(
            (entry: {name: string}) => entry.name
        );

        expect(inventory.publishEntries).toHaveLength(33);
        expect(new Set(packageNames).size).toBe(packageNames.length);
        expect(inventory.manifestPaths).toHaveLength(35);
        expect(inventory.buildPaths).toHaveLength(31);
        expect(inventory.buildPaths).toContain('kits/google-analytics-4');
        expect(inventory.buildPaths).not.toContain(
            'kits/google-analytics-4/packages/GA4Client'
        );
        expect(inventory.buildPaths).not.toContain(
            'kits/google-analytics-4/packages/GA4Server'
        );
        expect(inventory.publishOutputPaths).toContain(
            'kits/adobe/packages/AdobeClient/dist'
        );
        expect(inventory.publishOutputPaths).toContain(
            'kits/adobe/packages/AdobeServer/dist'
        );
        expect(packageNames.slice(0, 2)).toEqual([
            '@mparticle/web-rokt-kit',
            '@mparticle/web-rokt-pay-plus-kit',
        ]);

        const discoveredPackages = discoverPublicKitPackages();
        expect(discoveredPackages).toHaveLength(33);
        expect(
            discoveredPackages.map((entry: {name: string}) => entry.name).sort()
        ).toEqual([...packageNames].sort());
        expect(() =>
            validatePublishMatrixCompleteness(
                inventory.publishEntries.slice(1)
            )
        ).toThrow('Public packages missing from publish matrix');
    });

    it('rejects an incomplete publish matrix while loading the release inventory', () => {
        const publishMatrixPath = path.join(
            __dirname,
            '../../kits/publish-matrix.json'
        );
        const readFileSync = fs.readFileSync;
        const [omittedEntry, ...incompleteEntries] = JSON.parse(
            readFileSync(publishMatrixPath, 'utf8')
        );
        const readFileSyncSpy = jest
            .spyOn(fs, 'readFileSync')
            .mockImplementation(((filePath: fs.PathOrFileDescriptor, options) =>
                path.resolve(String(filePath)) ===
                path.resolve(publishMatrixPath)
                    ? JSON.stringify(incompleteEntries)
                    : readFileSync(filePath, options)) as typeof fs.readFileSync);

        try {
            expect(() => loadReleaseInventory()).toThrow(
                `Public packages missing from publish matrix: ${omittedEntry.name} at ${omittedEntry.local_path}`
            );
        } finally {
            readFileSyncSpy.mockRestore();
        }
    });

    describe('with a fixture kits directory', () => {
        let fixtureRoot: string;
        let outsideDirectory: string;

        const writePackage = (relativePath: string, manifest: object) => {
            const directory = path.join(fixtureRoot, relativePath);
            fs.mkdirSync(directory, {recursive: true});
            fs.writeFileSync(
                path.join(directory, 'package.json'),
                JSON.stringify(manifest)
            );
        };

        beforeEach(() => {
            fixtureRoot = fs.mkdtempSync(
                path.join(os.tmpdir(), 'mparticle-kit-discovery-')
            );
            outsideDirectory = fs.mkdtempSync(
                path.join(os.tmpdir(), 'mparticle-kit-outside-')
            );
            writePackage('kits/alpha', {name: '@mparticle/alpha'});
            writePackage('kits/alpha/node_modules/dependency', {
                name: 'dependency',
            });
            writePackage('kits/alpha/dist', {name: 'dist-package'});
            writePackage('kits/group', {private: true});
            writePackage('kits/group/packages/nested', {
                name: '@mparticle/nested',
            });
            writePackage('kits/truthy-private', {
                name: '@mparticle/truthy-private',
                private: 'true',
            });
        });

        afterEach(() => {
            fs.rmSync(fixtureRoot, {force: true, recursive: true});
            fs.rmSync(outsideDirectory, {force: true, recursive: true});
        });

        it('discovers nested public packages and skips private and generated directories', () => {
            expect(discoverPublicKitPackages(fixtureRoot)).toEqual([
                {name: '@mparticle/alpha', local_path: 'kits/alpha'},
                {
                    name: '@mparticle/nested',
                    local_path: 'kits/group/packages/nested',
                },
            ]);
        });

        it('rejects a discovered public package without a name', () => {
            writePackage('kits/group/packages/nameless', {});

            expect(() => discoverPublicKitPackages(fixtureRoot)).toThrow(
                'Public package manifest kits/group/packages/nameless/package.json requires a non-empty name'
            );
        });

        it('rejects symlinked directories during discovery', () => {
            fs.symlinkSync(
                outsideDirectory,
                path.join(fixtureRoot, 'kits/group/linked'),
                'dir'
            );

            expect(() => discoverPublicKitPackages(fixtureRoot)).toThrow(
                'Symlinked directory kits/group/linked is not allowed in kits/'
            );
        });

        it('refuses to build or clean paths that resolve outside kits', () => {
            fs.writeFileSync(
                path.join(outsideDirectory, 'package.json'),
                JSON.stringify({
                    name: '@mparticle/linked',
                    scripts: {build: 'echo build'},
                })
            );
            fs.writeFileSync(
                path.join(outsideDirectory, 'package-lock.json'),
                '{}'
            );
            fs.mkdirSync(path.join(outsideDirectory, 'dist'));
            fs.symlinkSync(
                outsideDirectory,
                path.join(fixtureRoot, 'kits/linked'),
                'dir'
            );

            expect(() => resolveKitPath('kits/linked', fixtureRoot)).toThrow(
                'Kit path kits/linked resolves outside kits/ through a symlink'
            );
            expect(() =>
                validateBuildPath(
                    {name: '@mparticle/linked', local_path: 'kits/linked'},
                    fixtureRoot
                )
            ).toThrow(
                'Kit path kits/linked resolves outside kits/ through a symlink'
            );
            expect(() =>
                cleanPublishOutputs(
                    {publishOutputPaths: ['kits/linked/dist']},
                    fixtureRoot
                )
            ).toThrow(
                'Kit path kits/linked/dist resolves outside kits/ through a symlink'
            );
            expect(fs.existsSync(path.join(outsideDirectory, 'dist'))).toBe(
                true
            );
        });

        it('cleans publish outputs contained in kits', () => {
            fs.mkdirSync(path.join(fixtureRoot, 'kits/alpha/dist/nested'), {
                recursive: true,
            });

            cleanPublishOutputs(
                {publishOutputPaths: ['kits/alpha/dist', 'kits/missing/dist']},
                fixtureRoot
            );

            expect(fs.existsSync(path.join(fixtureRoot, 'kits/alpha/dist'))).toBe(
                false
            );
        });
    });

    it('reports unexpected publish matrix entries', () => {
        const publishEntries = loadReleaseInventory().publishEntries;

        expect(() =>
            validatePublishMatrixCompleteness([
                ...publishEntries,
                {
                    name: '@mparticle/unexpected-kit',
                    local_path: 'kits/unexpected',
                },
            ])
        ).toThrow(
            'Publish matrix entries without public packages: @mparticle/unexpected-kit at kits/unexpected'
        );
    });

    it.each([undefined, '', '   '])(
        'rejects a public package manifest with name %p',
        (name) => {
            expect(() =>
                validatePublicPackageName({name}, 'kits/example')
            ).toThrow(
                'Public package manifest kits/example/package.json requires a non-empty name'
            );
        }
    );

    it('allows a private build root without a package name', () => {
        expect(() =>
            validatePublicPackageName({private: true}, 'kits/private-root')
        ).not.toThrow();
    });

    it('validates effective build roots before release execution', () => {
        expect(() =>
            validateBuildPath({
                name: '@mparticle/web-adobe-client-kit',
                local_path: 'kits/adobe/packages/AdobeClient',
                build_path: 'kits/adobe',
            })
        ).not.toThrow();
        expect(() =>
            validateBuildPath({
                name: '@mparticle/web-google-analytics-4-client-kit',
                local_path: 'kits/google-analytics-4/packages/GA4Client',
                build_path: 'kits/google-analytics-4',
            })
        ).not.toThrow();

        expect(() =>
            validateBuildPath({
                name: '@mparticle/example',
                local_path: 'kits/google-analytics-4/packages/GA4Client',
                build_path: 'kits/adobe',
            })
        ).toThrow(
            'Build path kits/adobe must equal or be an ancestor of publish path kits/google-analytics-4/packages/GA4Client'
        );
        expect(() =>
            validateBuildPath({
                name: '@mparticle/example',
                local_path: 'kits/not-a-kit',
            })
        ).toThrow(
            'Build path kits/not-a-kit must be an existing directory under kits'
        );
        expect(() =>
            validateBuildPath({
                name: '@mparticle/web-rokt-kit',
                local_path: 'kits/rokt',
                build_path: '',
            })
        ).toThrow(
            'build_path for @mparticle/web-rokt-kit must be a non-empty string when set'
        );
        expect(() =>
            validateBuildPath({
                name: '@mparticle/example',
                local_path: 'kits/adobe/AdobeSDKs',
            })
        ).toThrow('Build path kits/adobe/AdobeSDKs requires package.json');
        expect(() =>
            validateBuildPath({
                name: '@mparticle/web-adobe-client-kit',
                local_path: 'kits/adobe/packages/AdobeClient',
            })
        ).toThrow(
            'Build path kits/adobe/packages/AdobeClient/package.json requires a non-empty scripts.build command'
        );
    });

    it('requires a package lock for npm ci build roots', () => {
        const packageLockPath = path.join(
            __dirname,
            '../../kits/rokt/package-lock.json'
        );
        const existsSync = fs.existsSync;
        const existsSyncSpy = jest
            .spyOn(fs, 'existsSync')
            .mockImplementation((filePath) =>
                path.resolve(String(filePath)) === path.resolve(packageLockPath)
                    ? false
                    : existsSync(filePath)
            );

        try {
            expect(() =>
                validateBuildPath({
                    name: '@mparticle/web-rokt-kit',
                    local_path: 'kits/rokt',
                })
            ).toThrow(
                'Build path kits/rokt requires package-lock.json for npm ci --prefix'
            );
        } finally {
            existsSyncSpy.mockRestore();
        }
    });

    it('derives every runtime kit version from its package manifest', () => {
        const sourceFiles: string[] = [];
        const excludedDirectories = new Set(['dist', 'node_modules', 'test']);
        const visitSourceDirectory = (directory: string): void => {
            for (const entry of fs.readdirSync(directory, {
                withFileTypes: true,
            })) {
                if (excludedDirectories.has(entry.name)) {
                    continue;
                }

                const entryPath = path.join(directory, entry.name);
                if (entry.isDirectory()) {
                    visitSourceDirectory(entryPath);
                } else if (/\.(?:js|ts)$/.test(entry.name)) {
                    sourceFiles.push(entryPath);
                }
            }
        };

        visitSourceDirectory(path.join(__dirname, '../../kits'));

        const versionSurfacePattern =
            /(?:getVersion\s*:\s*function|const kitVersion\s*=)/;
        const runtimeVersionFiles = sourceFiles
            .filter((filePath) =>
                versionSurfacePattern.test(fs.readFileSync(filePath, 'utf8'))
            )
            .map((filePath) =>
                path.relative(path.join(__dirname, '../..'), filePath)
            )
            .sort();
        const expectedRuntimeVersionFiles = [
            'kits/braze/braze-3/src/BrazeKit-dev.js',
            'kits/braze/braze-4/src/BrazeKit-dev.js',
            'kits/braze/braze-5/src/BrazeKit-dev.js',
            'kits/braze/braze-6/src/BrazeKit-dev.js',
            'kits/rokt/src/Rokt-Kit.ts',
        ];

        expect(runtimeVersionFiles).toEqual(expectedRuntimeVersionFiles);

        for (const filePath of runtimeVersionFiles) {
            const source = fs.readFileSync(
                path.join(__dirname, '../..', filePath),
                'utf8'
            );
            expect(source).toContain('process.env.PACKAGE_VERSION');
        }

        const versionBuildConfigs = [
            'kits/braze/braze-3/rollup.config.js',
            'kits/braze/braze-4/rollup.config.js',
            'kits/braze/braze-5/rollup.config.js',
            'kits/braze/braze-6/rollup.config.js',
            'kits/rokt/vite.config.ts',
        ];
        for (const configPath of versionBuildConfigs) {
            const config = fs.readFileSync(
                path.join(__dirname, '../..', configPath),
                'utf8'
            );
            expect(config).toContain('process.env.npm_package_version');
            expect(config).toContain('process.env.PACKAGE_VERSION');
            if (configPath.includes('/braze/')) {
                expect(config).toContain('if (!packageVersion)');
            }
        }
    });

    it('terminates every serialized kit build path with a newline', () => {
        const buildPaths = loadReleaseInventory().buildPaths;
        const serializedBuildPaths = serializeBuildPaths(buildPaths);

        expect(serializedBuildPaths.endsWith('\n')).toBe(true);
        expect(serializedBuildPaths.trimEnd().split('\n')).toEqual(buildPaths);
        expect(buildPaths.slice(0, 2)).toEqual([
            'kits/rokt',
            'kits/roktpayplus',
        ]);
        expect(buildPaths[buildPaths.length - 1]).toBe('kits/adobe');
    });

    it('requires a stable semantic version', () => {
        expect(() => validateVersion('3.1.2')).not.toThrow();
        expect(() => validateVersion('v3.1.2')).toThrow();
        expect(() => validateVersion('3.1.2-beta.1')).toThrow();
    });

    it('prevents npm dist-tags from moving backward', () => {
        expect(compareStableVersions('3.0.10', '3.0.2')).toBe(1);
        expect(compareStableVersions('3.0.1', '3.0.1')).toBe(0);
        expect(compareStableVersions('2.99.0', '3.0.0')).toBe(-1);
        expect(() =>
            assertDistTagWillNotMoveBackward(
                '@mparticle/example',
                '3.0.2',
                '3.0.1',
                'next'
            )
        ).toThrow('refusing to move it backward');
        expect(() =>
            assertDistTagWillNotMoveBackward(
                '@mparticle/example',
                '3.0.0',
                '3.0.1',
                'next'
            )
        ).not.toThrow();
        expect(() =>
            assertDistTagWillNotMoveBackward(
                '@mparticle/example',
                '3.1.0-rc.1',
                '3.1.0',
                'next'
            )
        ).toThrow(
            '@mparticle/example dist-tag next must point to a stable semantic version'
        );
    });

    it('blocks a new V3 release until every kit matches core next', () => {
        const matchingView = () => '3.0.0';
        expect(
            verifyCurrentReleaseComplete(
                '@mparticle/web-sdk',
                'next',
                matchingView
            )
        ).toBe('3.0.0');

        const bootstrapView = (packageName: string) =>
            packageName === '@mparticle/web-sdk' ? '3.0.0' : null;
        expect(
            verifyCurrentReleaseComplete(
                '@mparticle/web-sdk',
                'next',
                bootstrapView
            )
        ).toBe('3.0.0');

        const incompleteView = (packageName: string) =>
            packageName === '@mparticle/web-adobe-target-kit'
                ? '2.9.0'
                : '3.0.0';
        expect(() =>
            verifyCurrentReleaseComplete(
                '@mparticle/web-sdk',
                'next',
                incompleteView
            )
        ).toThrow('recover it before starting a newer release');

        const missingFutureBaseline = (packageName: string) =>
            packageName === '@mparticle/web-sdk' ? '3.0.1' : null;
        expect(() =>
            verifyCurrentReleaseComplete(
                '@mparticle/web-sdk',
                'next',
                missingFutureBaseline
            )
        ).toThrow('recover it before starting a newer release');
    });

    it('restricts target artifact preflight to the V3 next channel', () => {
        expect(() => preflightKitArtifacts('3.0.1', 'latest')).toThrow(
            'requires a 3.x version and npm dist-tag next'
        );
    });

    it('distinguishes a missing core package during tag recovery', () => {
        try {
            verifyPublishedCore(
                {
                    name: '@mparticle/web-sdk',
                    integrity: 'sha512-local',
                },
                '3.0.1',
                'next',
                {
                    isRecovery: true,
                    npmView: () => null,
                    verifyRemotePackage: jest.fn(),
                }
            );
            throw new Error('Expected missing core recovery to fail');
        } catch (error) {
            const recoveryError = error as Error & {code?: string};
            expect(recoveryError.code).toBe('CORE_NOT_PUBLISHED');
            expect(recoveryError.message).toContain(
                'generated staging commit and orphan tag'
            );
        }
    });

    it('retries missing core during recovery before reporting CORE_NOT_PUBLISHED', () => {
        const wait = jest.fn();
        const npmView = jest.fn(() => null);

        try {
            waitForPublishedCore(
                {
                    name: '@mparticle/web-sdk',
                    integrity: 'sha512-local',
                },
                '3.0.1',
                'next',
                {
                    isRecovery: true,
                    npmView,
                    wait,
                    maxAttempts: 3,
                    delayMs: 1,
                }
            );
            throw new Error('Expected missing core recovery to fail');
        } catch (error) {
            const recoveryError = error as Error & {code?: string};
            expect(recoveryError.code).toBe('CORE_NOT_PUBLISHED');
            expect(npmView).toHaveBeenCalledTimes(3);
            expect(wait).toHaveBeenCalledTimes(2);
        }
    });

    it('publishes nothing when any kit preflight conflicts', () => {
        const artifacts = Array.from({length: 33}, (_, index) => ({
            name: `kit-${index + 1}`,
        }));
        const preflight = jest.fn((packageInfo: {name: string}) => {
            if (packageInfo.name === 'kit-17') {
                throw new Error('integrity mismatch');
            }
            return 'missing';
        });
        const publish = jest.fn(() => 'published');

        expect(() =>
            publishKitArtifacts(artifacts, '3.0.1', 'next', {
                preflightTarball: preflight,
                publishTarball: publish,
            })
        ).toThrow('integrity mismatch');
        expect(preflight).toHaveBeenCalledTimes(17);
        expect(publish).not.toHaveBeenCalled();
    });

    it('skips identical kits and publishes only missing kits during recovery', () => {
        const artifacts = Array.from({length: 33}, (_, index) => ({
            name: `kit-${index + 1}`,
        }));
        const existingNames = new Set(
            artifacts.slice(0, 10).map(artifact => artifact.name)
        );
        const preflight = jest.fn((packageInfo: {name: string}) =>
            existingNames.has(packageInfo.name) ? 'existing' : 'missing'
        );
        const publish = jest.fn(() => 'published');

        const results = publishKitArtifacts(artifacts, '3.0.1', 'next', {
            preflightTarball: preflight,
            publishTarball: publish,
        });

        expect(preflight).toHaveBeenCalledTimes(33);
        expect(publish).toHaveBeenCalledTimes(23);
        expect(results.slice(0, 10)).toEqual(
            artifacts.slice(0, 10).map(artifact => ({
                name: artifact.name,
                result: 'skipped (identical)',
            }))
        );
        expect(results.slice(10)).toEqual(
            artifacts.slice(10).map(artifact => ({
                name: artifact.name,
                result: 'published',
            }))
        );
    });

    it('waits for core npm visibility before treating the package as missing', () => {
        const coreArtifact = {
            name: '@mparticle/web-sdk',
            integrity: 'sha512-local',
        };
        let attempts = 0;
        const verifyPublishedCoreFn = jest.fn(() => {
            if (++attempts < 3) {
                throw new Error(
                    'Core @mparticle/web-sdk@3.0.1 is not yet visible on npm'
                );
            }
        });
        const wait = jest.fn();

        waitForPublishedCore(coreArtifact, '3.0.1', 'next', {
            verifyPublishedCore: verifyPublishedCoreFn,
            wait,
            maxAttempts: 3,
            delayMs: 1,
        });

        expect(verifyPublishedCoreFn).toHaveBeenCalledTimes(3);
        expect(wait).toHaveBeenCalledTimes(2);
    });

    it('fails immediately when published core integrity does not match', () => {
        const wait = jest.fn();

        expect(() =>
            waitForPublishedCore(
                {
                    name: '@mparticle/web-sdk',
                    integrity: 'sha512-local',
                },
                '3.0.1',
                'next',
                {
                    npmView: () => 'sha512-remote',
                    wait,
                    maxAttempts: 3,
                    delayMs: 1,
                }
            )
        ).toThrow('integrity mismatch');
        expect(wait).not.toHaveBeenCalled();
    });

    it('retries when a nested core lookup returns no integrity yet', () => {
        const wait = jest.fn();
        let nestedAttempts = 0;
        const verifyRemotePackage = jest.fn(() => {
            if (++nestedAttempts < 3) {
                throw new Error(
                    '@mparticle/web-sdk@3.0.1 integrity mismatch: expected sha512-local, received null'
                );
            }
        });

        waitForPublishedCore(
            {
                name: '@mparticle/web-sdk',
                integrity: 'sha512-local',
            },
            '3.0.1',
            'next',
            {
                npmView: () => 'sha512-local',
                verifyRemotePackage,
                wait,
                maxAttempts: 3,
                delayMs: 1,
            }
        );

        expect(verifyRemotePackage).toHaveBeenCalledTimes(3);
        expect(wait).toHaveBeenCalledTimes(2);
    });

    it('retries one final audit only for packages not yet visible', () => {
        const artifacts = [
            {name: 'available-kit'},
            {name: 'delayed-kit'},
        ];
        let delayedAttempts = 0;
        const verifyRemotePackage = jest.fn(
            (packageInfo: {name: string}) => {
                if (
                    packageInfo.name === 'delayed-kit' &&
                    ++delayedAttempts < 3
                ) {
                    throw new Error('package is not yet visible');
                }
            }
        );
        const wait = jest.fn();

        waitForRemotePackages(artifacts, '3.0.1', 'next', {
            verifyRemotePackage,
            wait,
            maxAttempts: 3,
            delayMs: 1,
        });

        expect(
            verifyRemotePackage.mock.calls.map(
                ([packageInfo]: [{name: string}]) => packageInfo.name
            )
        ).toEqual([
            'available-kit',
            'delayed-kit',
            'delayed-kit',
            'delayed-kit',
        ]);
        expect(wait).toHaveBeenCalledTimes(2);
    });

    it('writes actionable recovery instructions for a partial release', () => {
        const tempDirectory = fs.mkdtempSync(
            path.join(os.tmpdir(), 'mparticle-recovery-summary-')
        );
        const summaryPath = path.join(tempDirectory, 'summary.md');
        const previousSummaryPath = process.env.GITHUB_STEP_SUMMARY;

        try {
            process.env.GITHUB_STEP_SUMMARY = summaryPath;
            appendRecoverySummary('3.0.1', [
                '@mparticle/web-example-kit',
            ]);

            const summary = fs.readFileSync(summaryPath, 'utf8');
            expect(summary).toContain(
                'Do not start a newer release or run Step 2 or Step 3'
            );
            expect(summary).toContain('resumeKitReleaseTag=v3.0.1');
            expect(summary).toContain('core and all 33 kits');
            expect(summary).toContain('@mparticle/web-example-kit');
        } finally {
            if (previousSummaryPath === undefined) {
                delete process.env.GITHUB_STEP_SUMMARY;
            } else {
                process.env.GITHUB_STEP_SUMMARY = previousSummaryPath;
            }
            fs.rmSync(tempDirectory, {force: true, recursive: true});
        }
    });

    it('writes controlled reconciliation steps when core is missing', () => {
        const tempDirectory = fs.mkdtempSync(
            path.join(os.tmpdir(), 'mparticle-core-recovery-summary-')
        );
        const summaryPath = path.join(tempDirectory, 'summary.md');
        const previousSummaryPath = process.env.GITHUB_STEP_SUMMARY;

        try {
            process.env.GITHUB_STEP_SUMMARY = summaryPath;
            appendCoreRecoverySummary('3.0.1');

            const summary = fs.readFileSync(summaryPath, 'utf8');
            expect(summary).toContain(
                'Do not continue kit recovery, start a newer release'
            );
            expect(summary).toContain('restore `v3-staging`');
            expect(summary).toContain('delete the automation-created orphan tag');
            expect(summary).toContain('resumeKitReleaseTag` empty');
        } finally {
            if (previousSummaryPath === undefined) {
                delete process.env.GITHUB_STEP_SUMMARY;
            } else {
                process.env.GITHUB_STEP_SUMMARY = previousSummaryPath;
            }
            fs.rmSync(tempDirectory, {force: true, recursive: true});
        }
    });

    it('only previews kits on the V3 next channel', () => {
        expect(() => previewKitRelease('3.0.1', 'latest')).toThrow(
            'V3 kit previews require npm dist-tag next'
        );
    });

    it('validates every publishable package at the core version', () => {
        const inventory = loadReleaseInventory();
        const version = require('../../package.json').version;

        for (const entry of inventory.publishEntries) {
            expect(() => validatePackageManifest(entry, version)).not.toThrow();
        }
    });

    it('points every publishable package at its monorepo directory', () => {
        const inventory = loadReleaseInventory();

        for (const entry of inventory.publishEntries) {
            const manifest = require(`../../${entry.local_path}/package.json`);
            expect(manifest.repository).toEqual({
                type: 'git',
                url: 'https://github.com/mParticle/mparticle-web-sdk',
                directory: entry.local_path,
            });
        }
    });

    it('allowlists the Adobe package build outputs', () => {
        const clientManifest = require('../../kits/adobe/packages/AdobeClient/package.json');
        const serverManifest = require('../../kits/adobe/packages/AdobeServer/package.json');

        expect(clientManifest.files).toEqual([
            'dist/AdobeClientSideKit.common.js',
            'dist/AdobeClientSideKit.iife.js',
        ]);
        expect(serverManifest.files).toEqual([
            'dist/AdobeServerSideKit.common.js',
            'dist/AdobeServerSideKit.iife.js',
        ]);
    });

    it('packs a deterministic artifact with integrity metadata', () => {
        const tempDirectory = fs.mkdtempSync(
            path.join(os.tmpdir(), 'mparticle-pack-test-')
        );

        try {
            const firstPack = packPackage(
                'kits/adobe-target',
                tempDirectory
            );
            fs.unlinkSync(firstPack.tarballPath);
            const secondPack = packPackage(
                'kits/adobe-target',
                tempDirectory
            );

            expect(firstPack.integrity).toBe(secondPack.integrity);
        } finally {
            fs.rmSync(tempDirectory, {force: true, recursive: true});
        }
    });
});
