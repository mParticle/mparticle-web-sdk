import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const {
    loadReleaseInventory,
    serializeBuildPaths,
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
        expect(inventory.buildPaths).toHaveLength(32);
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
