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
        const spawnSync = jest
            .fn()
            .mockReturnValueOnce({status: 0, stdout: '"sha512-x"\n', stderr: ''})
            .mockReturnValueOnce({status: 1, stdout: '', stderr: 'npm error code ETIMEDOUT'});
        jest.isolateModules(() => {
            jest.doMock('node:child_process', () => ({
                ...jest.requireActual('node:child_process'),
                spawnSync,
            }));
            const {npmView} = require('../../scripts/publish-kits');

            expect(npmView('example-kit@3.0.1', 'dist.integrity')).toBe(
                'sha512-x'
            );
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
        });
        jest.dontMock('node:child_process');
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
                '| `@mparticle/web-late-kit` | not yet visible (warning): not   yet |'
            );
            expect(summary).toContain(
                '| `@mparticle/web-bad-kit` | failed: integrity mismatch |'
            );
            expect(summary).toContain('does not fail the release');
            expect(summary).toContain('resumeKitReleaseTag=v3.0.1');

            fs.writeFileSync(summaryPath, '');
            appendAuditSummary('3.0.1', 'next', {
                verified: ['@mparticle/web-sdk'],
                lagging: [],
                mismatched: [],
            });
            expect(fs.readFileSync(summaryPath, 'utf8')).not.toContain(
                'Packages npm does not show yet'
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
