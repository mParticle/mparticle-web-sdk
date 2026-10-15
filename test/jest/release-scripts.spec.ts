import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {spawnSync} from 'child_process';

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
    appendAuditSummary,
    appendCoreRecoverySummary,
    appendRecoverySummary,
    assertDistTagWillNotMoveBackward,
    auditRemotePackages,
    compareStableVersions,
    packPackage,
    preflightKitArtifacts,
    publishKitArtifacts,
    reconcileAmbiguousPublishes,
    validatePackageManifest,
    verifyCurrentReleaseComplete,
    verifyPublishedCore,
    verifyRemotePackage,
    waitForPublishedCore,
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
        expect(workflow).toContain('- name: Publish kits concurrently\n');
        expect(workflow).not.toContain(
            'Publish kits sequentially and audit all packages'
        );
    });

    it('audits npm in its own job that nothing waits for', () => {
        const yaml = require('js-yaml');
        const jobs = yaml.load(
            fs.readFileSync(
                path.join(
                    __dirname,
                    '../../.github/workflows/staging-step-1.yml'
                ),
                'utf8'
            )
        ).jobs;
        const audit = jobs['audit-kits'];

        expect(jobs['publish-kits'].name).toBe('Publish V3 kits');
        expect(jobs['publish-kits'].outputs).toEqual({
            release_sha: '${{ steps.source.outputs.release_sha }}',
            release_version: '${{ steps.source.outputs.release_version }}',
        });
        expect(
            jobs['publish-kits'].steps.map((step: {run?: string}) => step.run)
        ).toContain('node scripts/publish-kits.js');
        expect(audit.name).toBe('Audit V3 kits on npm');
        expect(audit.needs).toEqual(['confirm-staging-branch', 'publish-kits']);
        expect(audit.if).toContain("needs.publish-kits.result == 'success'");
        expect(audit.permissions).toEqual({contents: 'read'});
        expect(audit.env.RELEASE_VERSION).toBe(
            '${{ needs.publish-kits.outputs.release_version }}'
        );
        expect(audit.steps[0].with).toEqual({
            ref: '${{ needs.publish-kits.outputs.release_sha }}',
            'persist-credentials': false,
        });
        expect(audit.steps[audit.steps.length - 1].run).toBe(
            'node scripts/publish-kits.js --audit'
        );
        for (const job of Object.values(jobs) as Array<{
            needs?: string | string[];
        }>) {
            expect(([] as string[]).concat(job.needs || [])).not.toContain(
                'audit-kits'
            );
        }
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

    it('refuses a kits root that is a symlink outside the repository', () => {
        const fixtureRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'mparticle-kits-root-')
        );
        const outsideKits = fs.mkdtempSync(
            path.join(os.tmpdir(), 'mparticle-kits-outside-')
        );
        const outsideKit = path.join(outsideKits, 'alpha');
        fs.mkdirSync(path.join(outsideKit, 'dist'), {recursive: true});
        fs.writeFileSync(
            path.join(outsideKit, 'package.json'),
            JSON.stringify({
                name: '@mparticle/alpha',
                scripts: {build: 'echo build'},
            })
        );
        fs.writeFileSync(path.join(outsideKit, 'package-lock.json'), '{}');
        fs.symlinkSync(outsideKits, path.join(fixtureRoot, 'kits'), 'dir');
        const error = 'kits/ must be a directory, not a symlink';

        try {
            expect(() => discoverPublicKitPackages(fixtureRoot)).toThrow(
                error
            );
            expect(() => resolveKitPath('kits/alpha', fixtureRoot)).toThrow(
                error
            );
            expect(() =>
                validateBuildPath(
                    {name: '@mparticle/alpha', local_path: 'kits/alpha'},
                    fixtureRoot
                )
            ).toThrow(error);
            expect(() =>
                cleanPublishOutputs(
                    {publishOutputPaths: ['kits/alpha/dist']},
                    fixtureRoot
                )
            ).toThrow(error);
            expect(fs.existsSync(path.join(outsideKit, 'dist'))).toBe(true);
            expect(fs.readdirSync(outsideKit).sort()).toEqual([
                'dist',
                'package-lock.json',
                'package.json',
            ]);
        } finally {
            fs.rmSync(fixtureRoot, {force: true, recursive: true});
            fs.rmSync(outsideKits, {force: true, recursive: true});
        }
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

    it('publishes nothing when any kit preflight conflicts', async () => {
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

        await expect(
            publishKitArtifacts(artifacts, '3.0.1', 'next', {
                preflightTarball: preflight,
                publishTarball: publish,
            })
        ).rejects.toThrow('integrity mismatch');
        expect(preflight).toHaveBeenCalledTimes(17);
        expect(publish).not.toHaveBeenCalled();
    });

    it('skips identical kits and publishes only missing kits during recovery', async () => {
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

        const results = await publishKitArtifacts(artifacts, '3.0.1', 'next', {
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

    it('publishes missing kits concurrently up to the configured limit', async () => {
        const artifacts = Array.from({length: 6}, (_, index) => ({
            name: `kit-${index + 1}`,
        }));
        let inFlight = 0;
        let maxInFlight = 0;
        const publish = jest.fn(async () => {
            inFlight += 1;
            maxInFlight = Math.max(maxInFlight, inFlight);
            await new Promise(resolve => setTimeout(resolve, 0));
            inFlight -= 1;
            return 'published';
        });

        const results = await publishKitArtifacts(artifacts, '3.0.1', 'next', {
            preflightTarball: () => 'missing',
            publishTarball: publish,
            concurrency: 3,
        });

        expect(publish).toHaveBeenCalledTimes(6);
        expect(maxInFlight).toBe(3);
        expect(results).toEqual(
            artifacts.map(artifact => ({
                name: artifact.name,
                result: 'published',
            }))
        );
    });

    it('attempts every kit and reports all publish failures', async () => {
        const artifacts = Array.from({length: 8}, (_, index) => ({
            name: `kit-${index + 1}`,
        }));
        const started: string[] = [];
        const publish = jest.fn(async (packageInfo: {name: string}) => {
            started.push(packageInfo.name);
            await new Promise(resolve => setTimeout(resolve, 0));
            if (
                packageInfo.name === 'kit-1' ||
                packageInfo.name === 'kit-5'
            ) {
                throw new Error(`npm publish failed for ${packageInfo.name}`);
            }
            return 'published';
        });
        const results: Array<{name: string; result: string}> = [];

        const pending = publishKitArtifacts(artifacts, '3.0.1', 'next', {
            preflightTarball: () => 'missing',
            publishTarball: publish,
            concurrency: 3,
            results,
        });

        await expect(pending).rejects.toThrow(
            '2 kit publishes failed: kit-1: npm publish failed for kit-1; kit-5: npm publish failed for kit-5'
        );

        expect(started).toEqual(artifacts.map(artifact => artifact.name));
        expect(results.map(result => result.name)).toEqual([
            'kit-2',
            'kit-3',
            'kit-4',
            'kit-6',
            'kit-7',
            'kit-8',
        ]);
    });

    it('names every failed kit on the first line when npm errors span lines', async () => {
        const artifacts = Array.from({length: 5}, (_, index) => ({
            name: `kit-${index + 1}`,
        }));
        const publish = jest.fn((packageInfo: {name: string}) => {
            if (packageInfo.name === 'kit-1') {
                return Promise.reject(
                    new Error(
                        'npm view failed for kit-1@3.0.1 dist.integrity:\nnpm error code E500'
                    )
                );
            }
            if (packageInfo.name === 'kit-3') {
                throw new Error(
                    'kit-3@3.0.1 already exists with integrity sha512-remote; local artifact is sha512-local'
                );
            }
            return Promise.resolve('published');
        });
        const results: Array<{name: string; result: string}> = [];
        let failure: Error | undefined;

        try {
            await publishKitArtifacts(artifacts, '3.0.1', 'next', {
                preflightTarball: (packageInfo: {name: string}) =>
                    packageInfo.name === 'kit-2' ? 'existing' : 'missing',
                publishTarball: publish,
                concurrency: 2,
                results,
            });
        } catch (error) {
            failure = error as Error;
        }

        expect(failure).toBeDefined();
        const [firstLine] = failure!.message.split('\n');
        expect(firstLine).toBe(
            '2 kit publishes failed: kit-1: npm view failed for kit-1@3.0.1 dist.integrity:; kit-3: kit-3@3.0.1 already exists with integrity sha512-remote; local artifact is sha512-local'
        );
        expect(failure!.message).toContain(
            '\n\nkit-1: npm view failed for kit-1@3.0.1 dist.integrity:\nnpm error code E500'
        );
        expect(publish.mock.calls.map(([packageInfo]) => packageInfo.name)).toEqual([
            'kit-1',
            'kit-3',
            'kit-4',
            'kit-5',
        ]);
        expect(results).toEqual([
            {name: 'kit-2', result: 'skipped (identical)'},
            {name: 'kit-4', result: 'published'},
            {name: 'kit-5', result: 'published'},
        ]);
    });

    it('exits non-zero when the async release entrypoint fails', () => {
        const result = spawnSync(
            process.execPath,
            [path.join(__dirname, '../../scripts/publish-kits.js')],
            {
                encoding: 'utf8',
                env: {...process.env, RELEASE_VERSION: 'not-a-version'},
            }
        );

        expect(result.status).toBe(1);
        // An unhandled rejection would also exit 1 but print a stack trace.
        expect(result.stderr).toBe(
            'Expected a stable semantic version, received: not-a-version\n'
        );
    });

    it.each([0, -1, 1.5, NaN, '3'])(
        'rejects invalid kit publish concurrency %p before preflight',
        async concurrency => {
            const preflight = jest.fn(() => 'missing');

            await expect(
                publishKitArtifacts([], '3.0.1', 'next', {
                    preflightTarball: preflight,
                    concurrency,
                })
            ).rejects.toThrow(
                `Kit publish concurrency must be a positive integer, received ${concurrency}`
            );
            expect(preflight).not.toHaveBeenCalled();
        }
    );

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

    it('retries while the core dist-tag is behind', () => {
        const wait = jest.fn();
        let tagAttempts = 0;
        const verifyDistTag = jest.fn(() => {
            if (++tagAttempts < 3) {
                throw Object.assign(
                    new Error('@mparticle/web-sdk dist-tag next points to 3.0.0, expected 3.0.1'),
                    {code: 'DIST_TAG_BEHIND'}
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
                verifyDistTag,
                wait,
                maxAttempts: 3,
                delayMs: 1,
            }
        );

        expect(verifyDistTag).toHaveBeenCalledTimes(3);
        expect(wait).toHaveBeenCalledTimes(2);
    });

    it('reads the core integrity once, then only its dist-tag', () => {
        const npmView = jest
            .fn()
            .mockReturnValueOnce('sha512-local')
            .mockReturnValueOnce('3.0.1');
        verifyPublishedCore({name: '@mparticle/web-sdk', integrity: 'sha512-local'}, '3.0.1', 'next', {npmView});
        expect(npmView.mock.calls.map(([spec, field]) => `${spec} ${field}`)).toEqual([
            '@mparticle/web-sdk@3.0.1 dist.integrity',
            '@mparticle/web-sdk dist-tags.next',
        ]);
    });

    it('stops waiting for core at its deadline, however slow each lookup is', () => {
        let time = 0;
        const verifyCore = jest.fn((_packageInfo: unknown, _version: string, _tag: string, options: {npmView: unknown}) => {
            // Each check takes 100 s; the wait allows 60 x 5 s = 300 s in total.
            expect(typeof options.npmView).toBe('function');
            time += 100000;
            throw new Error('Core @mparticle/web-sdk@3.0.1 is not yet visible on npm');
        });
        const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
        expect(() =>
            waitForPublishedCore({name: '@mparticle/web-sdk', integrity: 'sha512-local'}, '3.0.1', 'next', {
                verifyPublishedCore: verifyCore,
                now: () => time,
                wait: (delayMs: number) => {
                    time += delayMs;
                },
            })
        ).toThrow('did not become visible on npm within five minutes');
        log.mockRestore();
        expect(verifyCore).toHaveBeenCalledTimes(3);
        expect(time).toBeLessThanOrEqual(310000);
    });

    function codedError(message: string, code: string) {
        return Object.assign(new Error(message), {code});
    }

    it('retries only packages npm does not show yet, then reports them as lagging', () => {
        const artifacts = [
            {name: 'available-kit'},
            {name: 'delayed-kit'},
            {name: 'stale-tag-kit'},
            {name: 'missing-kit'},
        ];
        let delayedAttempts = 0;
        const verifyRemotePackage = jest.fn(
            (packageInfo: {name: string}) => {
                if (
                    packageInfo.name === 'delayed-kit' &&
                    ++delayedAttempts < 3
                ) {
                    throw codedError('not yet visible', 'NOT_VISIBLE');
                }
                if (packageInfo.name === 'stale-tag-kit') {
                    throw codedError(
                        'dist-tag next points to 3.0.0',
                        'DIST_TAG_BEHIND'
                    );
                }
                if (packageInfo.name === 'missing-kit') {
                    throw codedError(
                        'missing-kit@3.0.1 is not yet visible on npm\ndetail',
                        'NOT_VISIBLE'
                    );
                }
            }
        );
        const wait = jest.fn();

        expect(
            auditRemotePackages(artifacts, '3.0.1', 'next', {
                verifyRemotePackage,
                wait,
                maxAttempts: 4,
                delayMs: 1,
            })
        ).toEqual({
            verified: ['available-kit', 'delayed-kit'],
            lagging: [
                {
                    name: 'stale-tag-kit',
                    message: 'dist-tag next points to 3.0.0',
                },
                {
                    name: 'missing-kit',
                    message: 'missing-kit@3.0.1 is not yet visible on npm',
                },
            ],
            mismatched: [],
        });
        expect(
            verifyRemotePackage.mock.calls.filter(
                ([packageInfo]: [{name: string}]) =>
                    packageInfo.name === 'available-kit'
            )
        ).toHaveLength(1);
        expect(wait).toHaveBeenCalledTimes(3);
    });

    it('reports a mismatched package at once and does not retry it', () => {
        const verifyRemotePackage = jest.fn(
            (packageInfo: {name: string}) => {
                if (packageInfo.name === 'bad-kit') {
                    throw new Error('bad-kit@3.0.1 integrity mismatch');
                }
            }
        );
        const wait = jest.fn();

        expect(
            auditRemotePackages(
                [{name: 'good-kit'}, {name: 'bad-kit'}],
                '3.0.1',
                'next',
                {verifyRemotePackage, wait, maxAttempts: 3, delayMs: 1}
            )
        ).toEqual({
            verified: ['good-kit'],
            lagging: [],
            mismatched: [
                {name: 'bad-kit', message: 'bad-kit@3.0.1 integrity mismatch'},
            ],
        });
        expect(verifyRemotePackage).toHaveBeenCalledTimes(2);
        expect(wait).not.toHaveBeenCalled();
    });

    it('stops checking at the audit deadline and reports the rest as lagging', () => {
        let clock = 0;
        const verifyRemotePackage = jest.fn(() => {
            clock += 60000;
            throw codedError('not yet visible', 'NOT_VISIBLE');
        });
        const wait = jest.fn((delayMs: number) => {
            clock += delayMs;
        });

        const audit = auditRemotePackages(
            [{name: 'kit-1'}, {name: 'kit-2'}, {name: 'kit-3'}],
            '3.0.1',
            'next',
            {
                verifyRemotePackage,
                wait,
                now: () => clock,
                durationMs: 150000,
                delayMs: 5000,
            }
        );

        expect(verifyRemotePackage).toHaveBeenCalledTimes(3);
        expect(wait).not.toHaveBeenCalled();
        expect(audit).toEqual({
            verified: [],
            lagging: [
                {name: 'kit-1', message: 'not yet visible'},
                {name: 'kit-2', message: 'not yet visible'},
                {name: 'kit-3', message: 'not yet visible'},
            ],
            mismatched: [],
        });

        clock = 0;
        verifyRemotePackage.mockClear();
        expect(
            auditRemotePackages(
                [{name: 'kit-1'}, {name: 'kit-2'}, {name: 'kit-3'}],
                '3.0.1',
                'next',
                {
                    verifyRemotePackage,
                    wait,
                    now: () => clock,
                    durationMs: 90000,
                }
            ).lagging
        ).toEqual([
            {name: 'kit-1', message: 'not yet visible'},
            {name: 'kit-2', message: 'not yet visible'},
            {name: 'kit-3', message: 'not checked before the audit deadline'},
        ]);
        expect(verifyRemotePackage).toHaveBeenCalledTimes(2);
    });

    it('gives each npm view only the time left before the audit deadline', () => {
        let clock = 0;
        const timeouts: number[] = [];
        const viewPackage = jest.fn(
            (_spec: string, field: string, timeoutMs: number) => {
                timeouts.push(timeoutMs);
                clock += timeoutMs;
                if (field === 'dist.integrity') {
                    return 'sha512-local';
                }
                throw codedError('npm view timed out', 'NPM_VIEW_FAILED');
            }
        );

        const audit = auditRemotePackages(
            [{name: 'kit-1', integrity: 'sha512-local'}],
            '3.0.1',
            'next',
            {
                viewPackage,
                wait: jest.fn(),
                now: () => clock,
                durationMs: 90000,
                delayMs: 5000,
            }
        );

        expect(timeouts).toEqual([60000, 30000]);
        expect(clock).toBe(90000);
        expect(audit.lagging).toEqual([
            {name: 'kit-1', message: 'npm view timed out'},
        ]);
    });

    describe('remote package classification', () => {
        const packageInfo = {name: 'example-kit', integrity: 'sha512-local'};
        const view = (integrity: string | null, tagged: string | null) => (
            _spec: string,
            field: string
        ) => (field === 'dist.integrity' ? integrity : tagged);
        const errorOf = (viewPackage: ReturnType<typeof view>) => {
            try {
                verifyRemotePackage(packageInfo, '3.0.1', 'next', viewPackage);
            } catch (error) {
                return error as Error & {code?: string};
            }
            throw new Error('Expected verification to fail');
        };

        it('accepts the published artifact on its dist-tag', () => {
            expect(() =>
                verifyRemotePackage(
                    packageInfo,
                    '3.0.1',
                    'next',
                    view('sha512-local', '3.0.1')
                )
            ).not.toThrow();
        });

        it.each([
            ['a version npm does not show', null, '3.0.0', 'NOT_VISIBLE'],
            ['a dist-tag still on the previous release', 'sha512-local', '3.0.0', 'DIST_TAG_BEHIND'],
            ['a missing dist-tag', 'sha512-local', null, 'DIST_TAG_BEHIND'],
        ])('treats %s as visibility lag', (_label, integrity, tagged, code) => {
            const error = errorOf(view(integrity, tagged));
            expect(error.code).toBe(code);
        });

        it.each([
            ['a different artifact', 'sha512-other', '3.0.1', /integrity mismatch/],
            ['a dist-tag on a newer release', 'sha512-local', '3.0.2', /points to 3.0.2/],
            ['a dist-tag on a non-release version', 'sha512-local', '3.0.1-beta.1', /points to 3.0.1-beta.1/],
        ])('treats %s as a mismatch', (_label, integrity, tagged, message) => {
            const error = errorOf(view(integrity, tagged));
            expect(error.message).toMatch(message);
            expect(error.code).toBeUndefined();
        });
    });

    it('asks npm to revalidate its cache and tags a failed lookup', () => {
        const timedOut = {
            status: null,
            stdout: '',
            stderr: '',
            error: Object.assign(new Error('spawnSync npm ETIMEDOUT'), {code: 'ETIMEDOUT'}),
        };
        const spawnSync = jest
            .fn()
            .mockReturnValueOnce({status: 0, stdout: '"sha512-x"\n', stderr: ''})
            // The default budget allows one retry of a failed lookup.
            .mockReturnValueOnce({status: 1, stdout: '', stderr: 'npm error code ETIMEDOUT'})
            .mockReturnValueOnce({status: 1, stdout: '', stderr: 'npm error code ETIMEDOUT'})
            // A budget too small for a retry gets one attempt.
            .mockReturnValueOnce(timedOut);
        jest.isolateModules(() => {
            jest.doMock('node:child_process', () => ({
                ...jest.requireActual('node:child_process'),
                spawnSync,
            }));
            const {npmView} = require('../../scripts/publish-kits');

            expect(npmView('example-kit@3.0.1', 'dist.integrity')).toBe(
                'sha512-x'
            );
            // A timed-out lookup is killed outright, so it cannot outlive its deadline.
            expect(spawnSync.mock.calls[0][2]).toMatchObject({timeout: 60000, killSignal: 'SIGKILL'});
            expect(spawnSync.mock.calls[0][1]).toEqual([
                'view',
                'example-kit@3.0.1',
                'dist.integrity',
                '--json',
                '--prefer-online',
                '--registry=https://registry.npmjs.org',
            ]);
            expect(() => npmView('example-kit', 'dist-tags.next')).toThrow(
                expect.objectContaining({code: 'NPM_VIEW_FAILED'})
            );
            expect(spawnSync).toHaveBeenCalledTimes(3);
            expect(spawnSync.mock.calls[1][2]).toMatchObject({timeout: 60000});
            // The first attempt failed at once, so the retry may still use a
            // full 60 s; it never gets more than what is left of the 90 s budget.
            expect(spawnSync.mock.calls[2][2]).toMatchObject({timeout: 60000});
            expect(() => npmView('example-kit', 'dist-tags.next', 1500)).toThrow(
                expect.objectContaining({
                    code: 'NPM_VIEW_FAILED',
                    message: 'npm view timed out after 1500ms for example-kit dist-tags.next',
                })
            );
            expect(spawnSync).toHaveBeenCalledTimes(4);
            expect(spawnSync.mock.calls[3][2]).toMatchObject({timeout: 1500});
        });
        jest.dontMock('node:child_process');
    });

    it('gives the retry only what is left of the lookup budget', () => {
        const spawnSync = jest
            .fn()
            .mockReturnValue({status: 1, stdout: '', stderr: 'npm error code ETIMEDOUT'});
        jest.isolateModules(() => {
            jest.doMock('node:child_process', () => ({
                ...jest.requireActual('node:child_process'),
                spawnSync,
            }));
            const {npmView} = require('../../scripts/publish-kits');
            let time = 0;
            const clock = {
                now: () => time,
                wait: jest.fn((delayMs: number) => {
                    time += delayMs;
                }),
            };
            spawnSync.mockImplementationOnce(() => {
                time += 60000;
                return {status: 1, stdout: '', stderr: 'npm error code ETIMEDOUT'};
            });

            expect(() => npmView('example-kit', 'dist-tags.next', 90000, clock)).toThrow(
                expect.objectContaining({code: 'NPM_VIEW_FAILED'})
            );
            expect(clock.wait).toHaveBeenCalledWith(1000);
            expect(spawnSync.mock.calls[0][2]).toMatchObject({timeout: 60000});
            expect(spawnSync.mock.calls[1][2]).toMatchObject({timeout: 29000});

            // Too little left for a retry: one attempt only.
            spawnSync.mockClear();
            spawnSync.mockImplementationOnce(() => {
                time += 60000;
                return {status: 1, stdout: '', stderr: 'npm error code ETIMEDOUT'};
            });
            expect(() => npmView('example-kit', 'dist-tags.next', 64000, clock)).toThrow(
                expect.objectContaining({code: 'NPM_VIEW_FAILED'})
            );
            expect(spawnSync).toHaveBeenCalledTimes(1);
        });
        jest.dontMock('node:child_process');
    });

    it('returns a retried lookup that succeeds and never retries a missing version', () => {
        const spawnSync = jest
            .fn()
            .mockReturnValueOnce({status: 1, stdout: '', stderr: 'npm error code ECONNRESET'})
            .mockReturnValueOnce({status: 0, stdout: '"3.0.1"\n', stderr: ''})
            .mockReturnValueOnce({status: 1, stdout: '', stderr: 'npm error code E404'});
        jest.isolateModules(() => {
            jest.doMock('node:child_process', () => ({
                ...jest.requireActual('node:child_process'),
                spawnSync,
            }));
            const {npmView} = require('../../scripts/publish-kits');

            expect(npmView('example-kit', 'dist-tags.next')).toBe('3.0.1');
            expect(npmView('example-kit@3.0.2', 'dist.integrity')).toBeNull();
            expect(spawnSync).toHaveBeenCalledTimes(3);
        });
        jest.dontMock('node:child_process');
    });

    describe('npm publish that reports an error', () => {
        const fakeChild = (code: number | null, signal: string | null, stderr: string) => {
            const {EventEmitter} = require('events');
            const child = new EventEmitter();
            child.stdout = new EventEmitter();
            child.stderr = new EventEmitter();
            child.stdout.setEncoding = () => undefined;
            child.stderr.setEncoding = () => undefined;
            setTimeout(() => {
                child.stderr.emit('data', stderr);
                child.emit('close', code, signal);
            }, 0);
            return child;
        };

        const notOnNpm = () => ({status: 1, stdout: '', stderr: 'npm error code E404'});
        const publishWith = async (
            child: () => unknown,
            options = {},
            view: (...args: unknown[]) => unknown = jest.fn(notOnNpm)
        ) => {
            let failure: (Error & {code?: string}) | undefined;
            const write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
            await new Promise<void>(resolve => {
                jest.isolateModules(() => {
                    jest.doMock('node:child_process', () => ({
                        ...jest.requireActual('node:child_process'),
                        spawn: jest.fn(child),
                        spawnSync: view,
                    }));
                    const {publishTarball} = require('../../scripts/publish-kits');
                    // Some refusals throw before a Promise exists.
                    Promise.resolve()
                        .then(() =>
                            publishTarball(
                                {name: 'kit-a', integrity: 'sha512-local', tarballPath: '/tmp/kit-a.tgz'},
                                '3.0.1',
                                'next',
                                options
                            )
                        )
                        .catch(error => {
                            failure = error;
                        })
                        .then(() => resolve());
                });
            });
            write.mockRestore();
            jest.dontMock('node:child_process');
            return failure;
        };

        it('marks a non-zero exit as ambiguous and keeps the first npm error', async () => {
            const failure = await publishWith(() =>
                fakeChild(
                    1,
                    null,
                    'npm error code E401\nnpm error 401 Unauthorized - PUT https://registry.npmjs.org/kit-a - token is invalid\nnpm error A complete log of this run can be found in: /tmp/x.log\n'
                )
            );
            expect(failure).toMatchObject({
                code: 'PUBLISH_AMBIGUOUS',
                message:
                    'npm publish failed for kit-a@3.0.1 with exit code 1: 401 Unauthorized - PUT https://registry.npmjs.org/kit-a - token is invalid',
            });
        });

        it('marks a killed publish as ambiguous', async () => {
            const failure = await publishWith(() => fakeChild(null, 'SIGTERM', ''));
            expect(failure).toMatchObject({
                code: 'PUBLISH_AMBIGUOUS',
                message: 'npm publish failed for kit-a@3.0.1 with signal SIGTERM',
            });
        });

        const stubbornChild = (exitOn: string | null, kill: jest.Mock) => {
            const {EventEmitter} = require('events');
            const child = new EventEmitter();
            child.stdout = new EventEmitter();
            child.stderr = new EventEmitter();
            child.stdout.setEncoding = () => undefined;
            child.stderr.setEncoding = () => undefined;
            child.stdout.destroy = jest.fn();
            child.stderr.destroy = jest.fn();
            child.unref = jest.fn();
            child.kill = jest.fn((signal: string) => {
                kill(signal);
                if (signal === 'SIGTERM') {
                    // A failed kill reports an error, which must not settle early.
                    setTimeout(() => child.emit('error', new Error('kill EPERM')), 0);
                }
                if (signal === exitOn) {
                    setTimeout(() => child.emit('close', null, signal), 0);
                }
                return true;
            });
            return child;
        };
        const fastTimeouts = {timeoutMs: 20, killGraceMs: 20, exitGraceMs: 20};

        it('settles a timed-out publish only after npm exits on SIGTERM', async () => {
            const kill = jest.fn();
            const failure = await publishWith(() => stubbornChild('SIGTERM', kill), fastTimeouts);
            expect(kill.mock.calls).toEqual([['SIGTERM']]);
            expect(failure).toMatchObject({
                code: 'PUBLISH_AMBIGUOUS',
                message: 'npm publish failed for kit-a@3.0.1: stopped after 0.02s',
            });
            expect((failure as {unterminated?: boolean}).unterminated).toBeUndefined();
        });

        it('escalates to SIGKILL when npm ignores SIGTERM', async () => {
            const kill = jest.fn();
            const failure = await publishWith(() => stubbornChild('SIGKILL', kill), fastTimeouts);
            expect(kill.mock.calls).toEqual([['SIGTERM'], ['SIGKILL']]);
            expect(failure).toMatchObject({code: 'PUBLISH_AMBIGUOUS', message: expect.stringContaining('stopped after')});
        });

        it('marks a publish that never exits so it is never published again, and detaches it', async () => {
            const kill = jest.fn();
            let child: ReturnType<typeof stubbornChild> | undefined;
            const failure = await publishWith(() => (child = stubbornChild(null, kill)), fastTimeouts);
            expect(kill.mock.calls).toEqual([['SIGTERM'], ['SIGKILL']]);
            expect(failure).toMatchObject({
                code: 'PUBLISH_AMBIGUOUS',
                unterminated: true,
                message: 'npm publish failed for kit-a@3.0.1: it did not exit after SIGKILL',
            });
            // Nothing left referenced can keep the job running.
            expect(child.stdout.destroy).toHaveBeenCalled();
            expect(child.stderr.destroy).toHaveBeenCalled();
            expect(child.unref).toHaveBeenCalled();
        });

        describe('against the publish deadline', () => {
            let time: number;
            beforeEach(() => {
                time = 1_000_000;
                jest.spyOn(Date, 'now').mockImplementation(() => time);
            });
            afterEach(() => {
                jest.restoreAllMocks();
            });
            const onNpm = (value: string) => ({status: 0, stdout: `${JSON.stringify(value)}\n`, stderr: ''});

            it('refuses to start with less than a minute left, before any lookup', async () => {
                const child = jest.fn();
                const view = jest.fn(notOnNpm);
                const failure = await publishWith(child, {deadline: time + 59000}, view);
                expect(failure).toMatchObject({code: 'PUBLISH_NOT_STARTED'});
                expect(view).not.toHaveBeenCalled();
                expect(child).not.toHaveBeenCalled();
            });

            it('refuses to start npm when a slow lookup leaves too little time', async () => {
                const child = jest.fn();
                const view = jest.fn(() => {
                    time += 50000;
                    return notOnNpm();
                });
                const failure = await publishWith(child, {deadline: time + 100000}, view);
                expect(failure).toMatchObject({code: 'PUBLISH_NOT_STARTED'});
                expect(view).toHaveBeenCalledTimes(1);
                expect(child).not.toHaveBeenCalled();
            });

            it('gives npm only what is left after both kill grace periods', async () => {
                const delays: number[] = [];
                const realSetTimeout = global.setTimeout;
                jest.spyOn(global, 'setTimeout').mockImplementation(((callback: () => void, delay?: number) => {
                    delays.push(delay || 0);
                    return realSetTimeout(callback, delay);
                }) as typeof setTimeout);
                const failure = await publishWith(() => fakeChild(0, null, ''), {deadline: time + 100000});
                expect(failure).toBeUndefined();
                // 100 s left, less 15 s each for SIGTERM and SIGKILL.
                expect(delays).toContain(70000);
            });

            it('checks only the dist-tag of a package already on npm, within the deadline', async () => {
                const child = jest.fn();
                const view = jest
                    .fn()
                    .mockImplementationOnce(() => {
                        time += 50000;
                        return onNpm('sha512-local');
                    })
                    .mockImplementationOnce(() => onNpm('3.0.1'));
                const failure = await publishWith(child, {deadline: time + 70000}, view);
                expect(failure).toBeUndefined();
                expect(child).not.toHaveBeenCalled();
                expect(view).toHaveBeenCalledTimes(2);
                expect(view.mock.calls[1][1]).toContain('dist-tags.next');
                expect(view.mock.calls[1][2]).toMatchObject({timeout: 20000});
            });

            it('does not read the dist-tag once the deadline has all but passed', async () => {
                const view = jest.fn(() => {
                    time += 66000;
                    return onNpm('sha512-local');
                });
                const failure = await publishWith(jest.fn(), {deadline: time + 70000}, view);
                expect(failure).toMatchObject({code: 'NPM_VIEW_FAILED'});
                expect(view).toHaveBeenCalledTimes(1);
            });
        });

        it('does not mark a publish npm could not start as ambiguous', async () => {
            const {EventEmitter} = require('events');
            const failure = await publishWith(() => {
                const child = new EventEmitter();
                child.stdout = new EventEmitter();
                child.stderr = new EventEmitter();
                child.stdout.setEncoding = () => undefined;
                child.stderr.setEncoding = () => undefined;
                setTimeout(() => child.emit('error', Object.assign(new Error('spawn npm ENOENT'), {code: 'ENOENT'})), 0);
                return child;
            });
            expect(failure).toMatchObject({code: 'ENOENT'});
        });
    });

    describe('reconciling a publish npm reported as failed', () => {
        const local = 'sha512-local';
        const ambiguous = (name: string) =>
            Object.assign(new Error(`npm publish failed for ${name}@3.0.1 with exit code 1: 401 Unauthorized`), {
                code: 'PUBLISH_AMBIGUOUS',
            });
        // A registry whose answers per package change as reads happen.
        const registry = (states: Record<string, Array<[string | null, string | null] | 'fail'>>) => {
            // One check reads the integrity, then the dist-tag, of the same state.
            const reads: Record<string, number> = {};
            const current: Record<string, [string | null, string | null] | 'fail'> = {};
            const viewPackage = jest.fn((spec: string, field: string) => {
                const name = spec.includes('@3.0.1') ? spec.replace('@3.0.1', '') : spec;
                if (field === 'dist.integrity') {
                    const sequence = states[name];
                    const read = reads[name] || 0;
                    current[name] = sequence[Math.min(read, sequence.length - 1)];
                    reads[name] = read + 1;
                }
                const state = current[name];
                if (state === 'fail') {
                    throw Object.assign(new Error(`npm view timed out for ${spec}`), {code: 'NPM_VIEW_FAILED'});
                }
                return field === 'dist.integrity' ? state[0] : state[1];
            });
            return viewPackage;
        };
        const clock = () => {
            let time = 0;
            return {
                now: () => time,
                wait: jest.fn((delayMs: number) => {
                    time += delayMs;
                }),
            };
        };
        const run = async (
            names: string[],
            states: Parameters<typeof registry>[0],
            retry: (packageInfo: {name: string}) => unknown = () => 'published',
            durationMs = 60000
        ) => {
            const artifacts = names.map(name => ({name, integrity: local}));
            const {now, wait} = clock();
            const viewPackage = registry(states);
            const attempts: Record<string, number> = {};
            const publish = jest.fn((packageInfo: {name: string}) => {
                attempts[packageInfo.name] = (attempts[packageInfo.name] || 0) + 1;
                if (attempts[packageInfo.name] === 1) {
                    return Promise.reject(ambiguous(packageInfo.name));
                }
                return retry(packageInfo);
            });
            const results: Array<{name: string; result: string}> = [];
            let failure: Error | undefined;
            const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
            try {
                await publishKitArtifacts(artifacts, '3.0.1', 'next', {
                    preflightTarball: () => 'missing',
                    publishTarball: publish,
                    results,
                    reconcileOptions: {viewPackage, now, wait, durationMs},
                });
            } catch (error) {
                failure = error as Error;
            } finally {
                log.mockRestore();
            }
            return {failure, results, publish, viewPackage, wait};
        };

        it('accepts a package npm shows with this integrity on the dist-tag', async () => {
            const {failure, results, publish} = await run(['kit-a'], {'kit-a': [[local, '3.0.1']]});
            expect(failure).toBeUndefined();
            expect(results).toEqual([
                {name: 'kit-a', result: 'published (npm reported an error; verified on npm)'},
            ]);
            expect(publish).toHaveBeenCalledTimes(1);
        });

        it('waits for npm to show the package and its dist-tag before accepting it', async () => {
            const {failure, results, wait} = await run(['kit-a'], {
                'kit-a': [
                    [null, '3.0.0'],
                    [local, '3.0.0'],
                    [local, '3.0.1'],
                ],
            });
            expect(failure).toBeUndefined();
            expect(results[0].result).toBe('published (npm reported an error; verified on npm)');
            expect(wait.mock.calls.map(([delay]) => delay)).toEqual([5000, 10000]);
        });

        it('fails without republishing when npm holds a different artifact', async () => {
            const {failure, results, publish} = await run(['kit-a'], {'kit-a': [['sha512-other', '3.0.1']]});
            expect(failure!.message).toContain('kit-a@3.0.1 integrity mismatch');
            expect(results).toEqual([]);
            expect(publish).toHaveBeenCalledTimes(1);
        });

        it('fails without republishing when the dist-tag is on a newer release', async () => {
            const {failure, publish} = await run(['kit-a'], {'kit-a': [[local, '3.0.2']]});
            expect(failure!.message).toContain('kit-a dist-tag next points to 3.0.2');
            expect(publish).toHaveBeenCalledTimes(1);
        });

        it('never republishes an artifact npm shows whose dist-tag stays behind', async () => {
            const {failure, publish} = await run(['kit-a'], {'kit-a': [[local, '3.0.0']]});
            expect(failure!.message).toContain(
                'kit-a: npm publish failed for kit-a@3.0.1 with exit code 1: 401 Unauthorized; not confirmed on npm: kit-a dist-tag next points to 3.0.0'
            );
            expect(publish).toHaveBeenCalledTimes(1);
        });

        it('never republishes when npm cannot be read', async () => {
            const {failure, publish} = await run(['kit-a'], {'kit-a': ['fail']});
            expect(failure!.message).toContain('not confirmed on npm: npm view timed out');
            expect(publish).toHaveBeenCalledTimes(1);
        });

        it('does not count absence mixed with failed reads as absent', async () => {
            const {failure, publish} = await run(['kit-a'], {'kit-a': [[null, null], 'fail', [null, null]]});
            expect(failure).toBeDefined();
            expect(publish).toHaveBeenCalledTimes(1);
        });

        it('publishes once more a package npm keeps reporting as absent', async () => {
            const states: Parameters<typeof registry>[0] = {'kit-a': [[null, null]]};
            const {failure, results, publish} = await run(['kit-a'], states, () => {
                states['kit-a'] = [[local, '3.0.1']];
                return 'published';
            });
            expect(failure).toBeUndefined();
            expect(publish).toHaveBeenCalledTimes(2);
            expect(results).toEqual([{name: 'kit-a', result: 'published on retry (verified on npm)'}]);
        });

        it('lets npm decide after a retry that reports an error', async () => {
            const states: Parameters<typeof registry>[0] = {'kit-a': [[null, null]]};
            const {failure, results, publish} = await run(['kit-a'], states, () => {
                states['kit-a'] = [[local, '3.0.1']];
                return Promise.reject(new Error('npm error code E403 cannot publish over the previously published versions'));
            });
            expect(failure).toBeUndefined();
            expect(publish).toHaveBeenCalledTimes(2);
            expect(results[0].result).toBe('published on retry (npm reported an error; verified on npm)');
        });

        it('fails when the retry leaves the package absent, and retries only once', async () => {
            const {failure, publish} = await run(['kit-a'], {'kit-a': [[null, null]]}, () =>
                Promise.reject(new Error('npm error code E403 forbidden'))
            );
            expect(failure!.message).toContain('retry failed (npm error code E403 forbidden) and not confirmed on npm');
            expect(publish).toHaveBeenCalledTimes(2);
        });

        it('never republishes a package whose first publish may still be running', async () => {
            const {now, wait} = clock();
            const publish = jest.fn();
            const outcome = await reconcileAmbiguousPublishes(
                [
                    {
                        packageInfo: {name: 'kit-a', integrity: local},
                        error: Object.assign(ambiguous('kit-a'), {unterminated: true}),
                    },
                ],
                '3.0.1',
                'next',
                {publishTarball: publish, viewPackage: registry({'kit-a': [[null, null]]}), now, wait, durationMs: 60000}
            );
            expect(publish).not.toHaveBeenCalled();
            expect(outcome.failures).toEqual([
                expect.objectContaining({
                    name: 'kit-a',
                    message: expect.stringContaining('npm publish may still be running'),
                }),
            ]);
        });

        it('fails a publish that never exited even when npm shows the right package', async () => {
            const {now, wait} = clock();
            const outcome = await reconcileAmbiguousPublishes(
                [
                    {
                        packageInfo: {name: 'kit-a', integrity: local},
                        error: Object.assign(ambiguous('kit-a'), {unterminated: true}),
                    },
                ],
                '3.0.1',
                'next',
                {publishTarball: jest.fn(), viewPackage: registry({'kit-a': [[local, '3.0.1']]}), now, wait}
            );
            expect(outcome.published).toEqual([]);
            expect(outcome.failures).toEqual([
                {
                    name: 'kit-a',
                    message: 'verified on npm, but npm publish did not exit and may still be running',
                },
            ]);
        });

        it('bounds the retry phase and records kits it had no time to retry', async () => {
            const time = {value: 0};
            const now = () => time.value;
            const wait = (delayMs: number) => {
                time.value += delayMs;
            };
            const names = ['kit-a', 'kit-b', 'kit-c', 'kit-d', 'kit-e', 'kit-f', 'kit-g'];
            const states: Parameters<typeof registry>[0] = {};
            names.forEach(name => {
                states[name] = [[null, null]];
            });
            const publish = jest.fn((_packageInfo: unknown, _version: string, _tag: string, options: {timeoutMs: number; deadline: number}) => {
                // Each retry uses its whole timeout.
                time.value += options.timeoutMs;
                return Promise.reject(new Error('npm publish failed: stopped'));
            });
            const outcome = await reconcileAmbiguousPublishes(
                names.map(name => ({packageInfo: {name, integrity: local}, error: ambiguous(name)})),
                '3.0.1',
                'next',
                {publishTarball: publish, viewPackage: registry(states), now, wait, durationMs: 60000}
            );
            // 15 minutes of retry budget at 3 minutes each: five retries.
            expect(publish).toHaveBeenCalledTimes(5);
            expect(publish.mock.calls.every(([, , , options]) => options.timeoutMs <= 180000)).toBe(true);
            // Every retry shares one absolute deadline.
            expect(new Set(publish.mock.calls.map(([, , , options]) => options.deadline)).size).toBe(1);
            expect(
                outcome.failures.filter(failure => failure.message.includes('retry time ran out')).map(failure => failure.name)
            ).toEqual(['kit-f', 'kit-g']);
            expect(outcome.failures).toHaveLength(7);
        });

        it('checks several packages against one shared deadline', async () => {
            const {failure, wait} = await run(
                ['kit-a', 'kit-b', 'kit-c'],
                {'kit-a': [[local, '3.0.0']], 'kit-b': [[local, '3.0.0']], 'kit-c': [[local, '3.0.0']]},
                () => 'published',
                60000
            );
            expect(failure!.message).toMatch(/^3 kit publishes failed: kit-a: .*; kit-b: .*; kit-c: /);
            const waited = wait.mock.calls.reduce((total, [delay]) => total + delay, 0);
            expect(waited).toBeLessThan(60000);
        });

        it('starts the shared publish deadline only after every preflight has passed', async () => {
            const artifacts = ['kit-a', 'kit-b', 'kit-c'].map(name => ({name, integrity: local}));
            let time = 1000;
            // Each preflight takes 4 minutes.
            const preflight = jest.fn(() => {
                time += 4 * 60 * 1000;
                return 'missing';
            });
            const publish = jest.fn(() => Promise.resolve('published'));
            await publishKitArtifacts(artifacts, '3.0.1', 'next', {
                preflightTarball: preflight,
                publishTarball: publish,
                now: () => time,
            });
            const preflightDeadline = {deadline: 1000 + 15 * 60 * 1000};
            expect(preflight.mock.calls.map(call => (call as unknown[])[3])).toEqual([
                preflightDeadline,
                preflightDeadline,
                preflightDeadline,
            ]);
            // The full hour is still available to publish after 12 minutes of preflight.
            const publishDeadline = {deadline: 1000 + 12 * 60 * 1000 + 60 * 60 * 1000};
            expect(publish.mock.calls.map(call => (call as unknown[])[3])).toEqual([
                publishDeadline,
                publishDeadline,
                publishDeadline,
            ]);
        });

        it('fails a retry that never exited even when npm then shows the right package', async () => {
            const {now, wait} = clock();
            const states: Parameters<typeof registry>[0] = {'kit-a': [[null, null]]};
            const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
            const outcome = await reconcileAmbiguousPublishes(
                [{packageInfo: {name: 'kit-a', integrity: local}, error: ambiguous('kit-a')}],
                '3.0.1',
                'next',
                {
                    publishTarball: () => {
                        states['kit-a'] = [[local, '3.0.1']];
                        return Promise.reject(
                            Object.assign(new Error('npm publish failed for kit-a@3.0.1: it did not exit after SIGKILL'), {
                                code: 'PUBLISH_AMBIGUOUS',
                                unterminated: true,
                            })
                        );
                    },
                    viewPackage: registry(states),
                    now,
                    wait,
                    durationMs: 60000,
                }
            );
            log.mockRestore();
            expect(outcome.published).toEqual([]);
            expect(outcome.failures).toEqual([
                {
                    name: 'kit-a',
                    message: 'verified on npm after retry, but npm publish did not exit and may still be running',
                },
            ]);
        });

        it('succeeds without publishing or reconciling when every kit is already on npm', async () => {
            const artifacts = ['kit-a', 'kit-b'].map(name => ({name, integrity: local}));
            const publish = jest.fn();
            const reconcile = jest.fn();
            const results = await publishKitArtifacts(artifacts, '3.0.1', 'next', {
                preflightTarball: () => 'existing',
                publishTarball: publish,
                reconcile,
            });
            expect(publish).not.toHaveBeenCalled();
            expect(reconcile).not.toHaveBeenCalled();
            expect(results).toEqual([
                {name: 'kit-a', result: 'skipped (identical)'},
                {name: 'kit-b', result: 'skipped (identical)'},
            ]);
        });

        it('reports a definite failure alongside a reconciled package', async () => {
            const artifacts = ['kit-a', 'kit-b'].map(name => ({name, integrity: local}));
            const {now, wait} = clock();
            const results: Array<{name: string; result: string}> = [];
            const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
            await expect(
                publishKitArtifacts(artifacts, '3.0.1', 'next', {
                    preflightTarball: () => 'missing',
                    publishTarball: (packageInfo: {name: string}) =>
                        packageInfo.name === 'kit-a'
                            ? Promise.reject(ambiguous('kit-a'))
                            : Promise.reject(new Error('kit-b@3.0.1 already exists with integrity sha512-remote')),
                    results,
                    reconcileOptions: {viewPackage: registry({'kit-a': [[local, '3.0.1']]}), now, wait},
                })
            ).rejects.toThrow('1 kit publish failed: kit-b: kit-b@3.0.1 already exists with integrity sha512-remote');
            log.mockRestore();
            expect(results).toEqual([
                {name: 'kit-a', result: 'published (npm reported an error; verified on npm)'},
            ]);
        });
    });

    it('summarizes the audit and explains how to follow up on a lagging package', () => {
        const tempDirectory = fs.mkdtempSync(
            path.join(os.tmpdir(), 'mparticle-audit-summary-')
        );
        const summaryPath = path.join(tempDirectory, 'summary.md');
        const previousSummaryPath = process.env.GITHUB_STEP_SUMMARY;

        try {
            process.env.GITHUB_STEP_SUMMARY = summaryPath;
            appendAuditSummary('3.0.1', 'next', {
                verified: ['@mparticle/web-sdk'],
                lagging: [
                    {name: '@mparticle/web-late-kit', message: 'not | yet'},
                ],
                mismatched: [
                    {name: '@mparticle/web-bad-kit', message: 'integrity mismatch'},
                ],
            });
            const summary = fs.readFileSync(summaryPath, 'utf8');
            expect(summary).toContain('## npm package audit');
            expect(summary).toContain('| `@mparticle/web-sdk` | verified |');
            expect(summary).toContain(
                '| `@mparticle/web-late-kit` | not confirmed yet (warning): not   yet |'
            );
            expect(summary).toContain(
                '| `@mparticle/web-bad-kit` | failed: integrity mismatch |'
            );
            expect(summary).toContain('### Packages npm has not confirmed yet');
            expect(summary).toContain('npm itself is having problems');
            expect(summary).toContain('Neither fails the release');
            expect(summary).toContain('resumeKitReleaseTag=v3.0.1');

            fs.writeFileSync(summaryPath, '');
            appendAuditSummary('3.0.1', 'next', {
                verified: ['@mparticle/web-sdk'],
                lagging: [],
                mismatched: [],
            });
            expect(fs.readFileSync(summaryPath, 'utf8')).not.toContain(
                'Packages npm has not confirmed yet'
            );
        } finally {
            if (previousSummaryPath === undefined) {
                delete process.env.GITHUB_STEP_SUMMARY;
            } else {
                process.env.GITHUB_STEP_SUMMARY = previousSummaryPath;
            }
            fs.rmSync(tempDirectory, {force: true, recursive: true});
        }
    });

    it('runs the audit, not a publish, from the command line', () => {
        const tempDirectory = fs.mkdtempSync(
            path.join(os.tmpdir(), 'mparticle-audit-cli-')
        );
        const summaryPath = path.join(tempDirectory, 'summary.md');
        const coreVersion = JSON.parse(
            fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8')
        ).version;

        try {
            const result = spawnSync(
                process.execPath,
                [
                    path.join(__dirname, '../../scripts/publish-kits.js'),
                    '--audit',
                ],
                {
                    encoding: 'utf8',
                    env: {
                        ...process.env,
                        RELEASE_VERSION: '3.999.0',
                        NPM_DIST_TAG: 'next',
                        GITHUB_STEP_SUMMARY: summaryPath,
                    },
                }
            );

            expect(result.status).toBe(1);
            expect(result.stderr).toBe(
                `Core SDK is ${coreVersion}, expected 3.999.0\n`
            );
            // A publish that stops writes recovery steps; the audit does not.
            expect(fs.existsSync(summaryPath)).toBe(false);
        } finally {
            fs.rmSync(tempDirectory, {force: true, recursive: true});
        }
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

    it('forwards npm pack buffer and timeout options and reports failures', () => {
        const tempDirectory = fs.mkdtempSync(
            path.join(os.tmpdir(), 'mparticle-pack-options-')
        );
        const writeFakeNpm = (name: string, body: string) => {
            const scriptPath = path.join(tempDirectory, name);
            fs.writeFileSync(scriptPath, `#!/bin/sh\n${body}\n`, {
                mode: 0o755,
            });
            return scriptPath;
        };
        const padding = 'a'.repeat(4096);
        const largeOutputNpm = writeFakeNpm(
            'large-npm',
            `echo '[{"filename":"example.tgz","integrity":"sha512-example","padding":"${padding}"}]'`
        );
        const slowNpm = writeFakeNpm('slow-npm', 'sleep 5');
        const failingNpm = writeFakeNpm(
            'failing-npm',
            'echo "pack exploded" >&2\nexit 7'
        );

        try {
            expect(
                packPackage('kits/adobe-target', tempDirectory, {
                    npmExecutable: largeOutputNpm,
                })
            ).toEqual({
                integrity: 'sha512-example',
                tarballPath: path.join(tempDirectory, 'example.tgz'),
            });
            expect(() =>
                packPackage('kits/adobe-target', tempDirectory, {
                    npmExecutable: largeOutputNpm,
                    maxBuffer: 1024,
                })
            ).toThrow(/npm pack failed \(ENOBUFS/);
            expect(() =>
                packPackage('kits/adobe-target', tempDirectory, {
                    npmExecutable: slowNpm,
                    timeout: 100,
                })
            ).toThrow(/npm pack failed \(ETIMEDOUT, signal SIGTERM/);

            let failure: Error | undefined;
            try {
                packPackage('kits/adobe-target', tempDirectory, {
                    npmExecutable: failingNpm,
                });
            } catch (error) {
                failure = error as Error;
            }
            expect(failure && failure.message).toMatch(
                /^npm pack failed \(exit 7\): Command failed: .*failing-npm pack/
            );
            expect(failure && failure.message).toContain('\npack exploded');
        } finally {
            fs.rmSync(tempDirectory, {force: true, recursive: true});
        }
    });
});
