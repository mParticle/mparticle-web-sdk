/* eslint-env node, es2021 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const {
    loadReleaseInventory,
    validateVersion,
} = require('./prepare-kit-release');

const repositoryRoot = path.resolve(__dirname, '..');
const registry = 'https://registry.npmjs.org';
const initialV3CoreVersion = '3.0.0';
const npmExecutable = path.join(
    path.dirname(process.execPath),
    process.platform === 'win32' ? 'npm.cmd' : 'npm'
);

function runNpm(args, options = {}) {
    return execFileSync(npmExecutable, args, {
        cwd: repositoryRoot,
        encoding: 'utf8',
        stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
    }).trim();
}

function npmView(spec, field) {
    const result = spawnSync(
        npmExecutable,
        ['view', spec, field, '--json', `--registry=${registry}`],
        {
            cwd: repositoryRoot,
            encoding: 'utf8',
        }
    );

    if (result.status !== 0) {
        const errorOutput = `${result.stdout || ''}\n${result.stderr || ''}`;
        if (errorOutput.includes('E404')) {
            return null;
        }
        throw new Error(
            `npm view failed for ${spec} ${field}:\n${errorOutput.trim()}`
        );
    }

    const output = result.stdout.trim();
    return output ? JSON.parse(output) : null;
}

function compareStableVersions(left, right) {
    validateVersion(left);
    validateVersion(right);
    const leftParts = left.split('.').map(Number);
    const rightParts = right.split('.').map(Number);

    for (let index = 0; index < leftParts.length; index++) {
        if (leftParts[index] !== rightParts[index]) {
            return leftParts[index] > rightParts[index] ? 1 : -1;
        }
    }
    return 0;
}

function validateStableDistTagVersion(packageName, version, distTag) {
    try {
        validateVersion(version);
    } catch {
        throw new Error(
            `${packageName} dist-tag ${distTag} must point to a stable semantic version, received ${version}`
        );
    }
}

function assertDistTagWillNotMoveBackward(
    packageName,
    currentVersion,
    targetVersion,
    distTag
) {
    if (currentVersion) {
        validateStableDistTagVersion(packageName, currentVersion, distTag);
    }
    if (
        currentVersion &&
        compareStableVersions(currentVersion, targetVersion) > 0
    ) {
        throw new Error(
            `${packageName} dist-tag ${distTag} already points to ${currentVersion}; refusing to move it backward to ${targetVersion}`
        );
    }
}

function preflightReleaseDistTags(version, distTag, track) {
    validateVersion(version);
    const expectedDistTag = track === 'v2' ? 'latest' : 'next';
    const expectedMajor = track === 'v2' ? 2 : 3;
    if (
        !['v2', 'v3'].includes(track) ||
        Number(version.split('.')[0]) !== expectedMajor ||
        distTag !== expectedDistTag
    ) {
        throw new Error(
            `Release channel mismatch: ${track} ${version} must use npm dist-tag ${expectedDistTag}`
        );
    }

    const coreManifest = JSON.parse(
        fs.readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
    );
    const packageNames = [coreManifest.name];
    if (track === 'v3') {
        verifyCurrentReleaseComplete(coreManifest.name, distTag);
        packageNames.push(
            ...loadReleaseInventory().publishEntries.map(entry => entry.name)
        );
    }

    for (const packageName of packageNames) {
        const currentVersion = npmView(packageName, `dist-tags.${distTag}`);
        assertDistTagWillNotMoveBackward(
            packageName,
            currentVersion,
            version,
            distTag
        );
    }
}

function verifyCurrentReleaseComplete(
    corePackageName,
    distTag,
    viewPackage = npmView
) {
    const currentCoreVersion = viewPackage(
        corePackageName,
        `dist-tags.${distTag}`
    );
    if (!currentCoreVersion) {
        throw new Error(
            `${corePackageName} has no ${distTag} version to use as the current V3 release baseline`
        );
    }
    validateStableDistTagVersion(corePackageName, currentCoreVersion, distTag);

    const incompletePackages = [];
    let kitsWithCurrentVersion = 0;
    for (const entry of loadReleaseInventory().publishEntries) {
        const currentKitVersion = viewPackage(
            entry.name,
            `dist-tags.${distTag}`
        );
        if (currentKitVersion) {
            kitsWithCurrentVersion++;
        }
        if (currentKitVersion !== currentCoreVersion) {
            incompletePackages.push(
                `${entry.name}=${currentKitVersion || 'missing'}`
            );
        }
    }
    if (
        kitsWithCurrentVersion === 0 &&
        currentCoreVersion === initialV3CoreVersion
    ) {
        console.log(
            `No kits currently use npm dist-tag ${distTag}; allowing the first synchronized V3 kit release`
        );
        return currentCoreVersion;
    }
    if (incompletePackages.length > 0) {
        throw new Error(
            `Current V3 release ${currentCoreVersion} is incomplete on npm; recover it before starting a newer release: ${incompletePackages.join(
                ', '
            )}`
        );
    }
    return currentCoreVersion;
}

function packPackage(packagePath, destination) {
    const output = runNpm([
        'pack',
        path.resolve(repositoryRoot, packagePath),
        '--json',
        '--ignore-scripts',
        '--pack-destination',
        destination,
    ]);
    const results = JSON.parse(output);
    if (
        !Array.isArray(results) ||
        results.length !== 1 ||
        !results[0].filename ||
        !results[0].integrity
    ) {
        throw new Error(`Unexpected npm pack output for ${packagePath}`);
    }

    return {
        integrity: results[0].integrity,
        tarballPath: path.join(destination, results[0].filename),
    };
}

function validatePackageContents(packagePath, packageJson) {
    const requiredPaths = [
        packageJson.main,
        packageJson.module,
        packageJson.types,
        ...(Array.isArray(packageJson.files) ? packageJson.files : []),
    ].filter(Boolean);

    for (const requiredPath of requiredPaths) {
        if (/[*?[\]{}]/.test(requiredPath)) {
            throw new Error(
                `${packageJson.name} uses an unsupported files glob: ${requiredPath}`
            );
        }
        if (
            !fs.existsSync(path.join(repositoryRoot, packagePath, requiredPath))
        ) {
            throw new Error(
                `${packageJson.name} release artifact is missing: ${requiredPath}`
            );
        }
    }
}

function validatePackageManifest(entry, version) {
    const packageJsonPath = path.join(
        repositoryRoot,
        entry.local_path,
        'package.json'
    );
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.name !== entry.name) {
        throw new Error(
            `${entry.local_path}/package.json is ${packageJson.name}, expected ${entry.name}`
        );
    }
    if (packageJson.version !== version) {
        throw new Error(
            `${entry.name} is ${packageJson.version}, expected ${version}`
        );
    }
    validatePackageContents(entry.local_path, packageJson);
}

function packKitArtifacts(inventory, version, destination) {
    const packageArtifacts = [];
    for (const entry of inventory.publishEntries) {
        validatePackageManifest(entry, version);
        packageArtifacts.push({
            name: entry.name,
            ...packPackage(entry.local_path, destination),
        });
    }
    return packageArtifacts;
}

function verifyRemotePackage(packageInfo, version, distTag) {
    const spec = `${packageInfo.name}@${version}`;
    const remoteIntegrity = npmView(spec, 'dist.integrity');
    if (remoteIntegrity !== packageInfo.integrity) {
        throw new Error(
            `${spec} integrity mismatch: expected ${packageInfo.integrity}, received ${remoteIntegrity}`
        );
    }

    const taggedVersion = npmView(packageInfo.name, `dist-tags.${distTag}`);
    if (taggedVersion !== version) {
        throw new Error(
            `${packageInfo.name} dist-tag ${distTag} points to ${taggedVersion}, expected ${version}`
        );
    }
}

function verifyPublishedCore(packageInfo, version, distTag, options = {}) {
    const viewPackage = options.npmView || npmView;
    const verifyPackage = options.verifyRemotePackage || verifyRemotePackage;
    const spec = `${packageInfo.name}@${version}`;
    const remoteIntegrity = viewPackage(spec, 'dist.integrity');

    if (!remoteIntegrity) {
        if (options.isRecovery) {
            const error = new Error(
                `Core ${spec} is missing from npm although its Step 1 tag exists; stop kit recovery and reconcile the generated staging commit and orphan tag before rerunning a normal release`
            );
            error.code = 'CORE_NOT_PUBLISHED';
            throw error;
        }
        throw new Error(
            `Core ${spec} is not yet visible on npm; do not publish kits until core availability is confirmed`
        );
    }
    if (remoteIntegrity !== packageInfo.integrity) {
        throw new Error(
            `Core ${spec} integrity mismatch: expected ${packageInfo.integrity}, received ${remoteIntegrity}`
        );
    }
    verifyPackage(packageInfo, version, distTag);
}

function waitForRemotePackage(packageInfo, version, distTag) {
    let lastError;
    for (let attempt = 1; attempt <= 12; attempt++) {
        try {
            verifyRemotePackage(packageInfo, version, distTag);
            return;
        } catch (error) {
            lastError = error;
            if (attempt < 12) {
                Atomics.wait(
                    new Int32Array(new SharedArrayBuffer(4)),
                    0,
                    0,
                    5000
                );
            }
        }
    }
    throw lastError;
}

function preflightTarball(packageInfo, version, distTag) {
    const spec = `${packageInfo.name}@${version}`;
    const remoteIntegrity = npmView(spec, 'dist.integrity');
    if (!remoteIntegrity) {
        return 'missing';
    }
    if (remoteIntegrity !== packageInfo.integrity) {
        throw new Error(
            `${spec} already exists with integrity ${remoteIntegrity}; local artifact is ${packageInfo.integrity}`
        );
    }
    verifyRemotePackage(packageInfo, version, distTag);
    return 'existing';
}

function preflightKitArtifacts(version, distTag) {
    validateVersion(version);
    if (Number(version.split('.')[0]) !== 3 || distTag !== 'next') {
        throw new Error(
            `V3 kit artifact preflight requires a 3.x version and npm dist-tag next`
        );
    }

    const tempDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), 'mparticle-kit-preflight-')
    );
    try {
        const inventory = loadReleaseInventory();
        const packageArtifacts = packKitArtifacts(
            inventory,
            version,
            tempDirectory
        );
        for (const packageInfo of packageArtifacts) {
            const status = preflightTarball(packageInfo, version, distTag);
            console.log(`${packageInfo.name}: ${status}`);
        }
        console.log(
            `Preflighted ${packageArtifacts.length} kit artifacts at ${version}`
        );
    } finally {
        fs.rmSync(tempDirectory, { force: true, recursive: true });
    }
}

function publishTarball(packageInfo, version, distTag) {
    const spec = `${packageInfo.name}@${version}`;
    const remoteIntegrity = npmView(spec, 'dist.integrity');
    if (remoteIntegrity) {
        if (remoteIntegrity !== packageInfo.integrity) {
            throw new Error(
                `${spec} already exists with integrity ${remoteIntegrity}; local artifact is ${packageInfo.integrity}`
            );
        }
        verifyRemotePackage(packageInfo, version, distTag);
        return 'skipped';
    }

    execFileSync(
        npmExecutable,
        [
            'publish',
            packageInfo.tarballPath,
            '--provenance',
            '--access',
            'public',
            '--tag',
            distTag,
            `--registry=${registry}`,
        ],
        {
            cwd: repositoryRoot,
            stdio: 'inherit',
        }
    );
    waitForRemotePackage(packageInfo, version, distTag);
    return 'published';
}

function publishKitArtifacts(packageArtifacts, version, distTag, options = {}) {
    const preflight = options.preflightTarball || preflightTarball;
    const publish = options.publishTarball || publishTarball;
    const existingPackages = new Set();

    for (const packageInfo of packageArtifacts) {
        if (preflight(packageInfo, version, distTag) === 'existing') {
            existingPackages.add(packageInfo.name);
        }
    }

    const results = options.results || [];
    for (const packageInfo of packageArtifacts) {
        if (existingPackages.has(packageInfo.name)) {
            results.push({
                name: packageInfo.name,
                result: 'skipped (identical)',
            });
        } else {
            results.push({
                name: packageInfo.name,
                result: publish(packageInfo, version, distTag),
            });
        }
    }
    return results;
}

function appendSummary(version, distTag, results) {
    if (!process.env.GITHUB_STEP_SUMMARY) {
        return;
    }

    const lines = [
        '## npm package audit',
        '',
        `- Version: \`${version}\``,
        `- npm dist-tag: \`${distTag}\``,
        `- Packages audited: \`${results.length}\``,
        '',
        '| Package | Result |',
        '| --- | --- |',
        ...results.map(result => {
            const safeResult = result.result.replace(/[|\r\n]/g, ' ');
            return `| \`${result.name}\` | ${safeResult} |`;
        }),
        '',
    ];
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
}

function appendRecoverySummary(version, remainingPackageNames = []) {
    if (!process.env.GITHUB_STEP_SUMMARY) {
        return;
    }

    const releaseTag = `v${version}`;
    const lines = [
        '## V3 kit release recovery required',
        '',
        '**Do not start a newer release or run Step 2 or Step 3 until recovery succeeds.**',
        '',
        `1. Use the failed Step 1 release tag \`${releaseTag}\`.`,
        '2. Correct the reported npm or trusted-publisher failure.',
        '3. Dispatch **Staging Release - Step 1** from `v3-staging` with:',
        '   - `track=v3`',
        '   - `dryRun=false`',
        `   - \`resumeKitReleaseTag=${releaseTag}\``,
        '4. Wait for the recovery run to verify core and all 33 kits on `next`.',
        '5. Only after recovery is green, continue with Step 2 or Step 3.',
        '',
        remainingPackageNames.length > 0
            ? `Kits not yet recorded successful: ${remainingPackageNames
                  .map(packageName => `\`${packageName}\``)
                  .join(', ')}`
            : 'All kits were attempted; use the failure above and final npm audit to identify the package requiring repair.',
        '',
        'Recovery verifies existing artifact integrity, skips identical packages, and publishes only missing kits.',
        '',
    ];
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
}

function appendCoreRecoverySummary(version) {
    if (!process.env.GITHUB_STEP_SUMMARY) {
        return;
    }

    const releaseTag = `v${version}`;
    const lines = [
        '## Core release reconciliation required',
        '',
        '**Do not continue kit recovery, start a newer release, or run Step 2 or Step 3.**',
        '',
        `The generated staging commit and tag \`${releaseTag}\` exist, but core \`@mparticle/web-sdk@${version}\` is not visible on npm.`,
        '',
        '1. Wait for npm propagation, then confirm whether the core version exists.',
        '2. If core appears, rerun the documented kit recovery with the same tag.',
        '3. If core is confirmed absent, use the controlled maintainer procedure to restore `v3-staging` to the parent of the generated release commit and delete the automation-created orphan tag.',
        '4. Rerun a normal Step 1 release with `resumeKitReleaseTag` empty.',
        '',
        'Do not delete or move the tag until npm absence is confirmed; a timed-out publish can still succeed server-side.',
        '',
    ];
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
}

function main() {
    const version = process.env.RELEASE_VERSION;
    const distTag = process.env.NPM_DIST_TAG;
    validateVersion(version);
    if (!distTag || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(distTag)) {
        throw new Error(`Invalid npm dist-tag: ${distTag}`);
    }

    const inventory = loadReleaseInventory();
    const tempDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), 'mparticle-kit-release-')
    );
    const results = [];

    try {
        const coreManifest = JSON.parse(
            fs.readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
        );
        if (coreManifest.version !== version) {
            throw new Error(
                `Core SDK is ${coreManifest.version}, expected ${version}`
            );
        }
        validatePackageContents('.', coreManifest);

        const coreArtifact = packPackage('.', tempDirectory);
        const packageArtifacts = [
            {
                name: coreManifest.name,
                ...coreArtifact,
            },
        ];

        packageArtifacts.push(
            ...packKitArtifacts(inventory, version, tempDirectory)
        );

        for (const packageInfo of packageArtifacts) {
            const currentVersion = npmView(
                packageInfo.name,
                `dist-tags.${distTag}`
            );
            assertDistTagWillNotMoveBackward(
                packageInfo.name,
                currentVersion,
                version,
                distTag
            );
        }

        verifyPublishedCore(packageArtifacts[0], version, distTag, {
            isRecovery: process.env.KIT_RELEASE_RECOVERY === 'true',
        });
        results.push({ name: packageArtifacts[0].name, result: 'verified' });

        publishKitArtifacts(packageArtifacts.slice(1), version, distTag, {
            results,
        });

        for (const packageInfo of packageArtifacts) {
            verifyRemotePackage(packageInfo, version, distTag);
        }

        appendSummary(version, distTag, results);
        console.log(
            `Verified ${packageArtifacts.length} packages at ${version} with dist-tag ${distTag}`
        );
    } catch (error) {
        results.push({
            name: 'Release stopped',
            result: `failed: ${error.message.split('\n')[0]}`,
        });
        appendSummary(version, distTag, results);
        if (error.code === 'CORE_NOT_PUBLISHED') {
            appendCoreRecoverySummary(version);
        } else {
            const completedPackageNames = new Set(
                results.map(result => result.name)
            );
            appendRecoverySummary(
                version,
                inventory.publishEntries
                    .map(entry => entry.name)
                    .filter(
                        packageName => !completedPackageNames.has(packageName)
                    )
            );
        }
        throw error;
    } finally {
        fs.rmSync(tempDirectory, { force: true, recursive: true });
    }
}

if (require.main === module) {
    try {
        if (process.argv[2] === '--preflight-tags') {
            preflightReleaseDistTags(
                process.argv[3],
                process.env.NPM_DIST_TAG,
                process.env.TRACK
            );
            if (process.env.NEXT_RELEASE_VERSION_FILE) {
                fs.writeFileSync(
                    process.env.NEXT_RELEASE_VERSION_FILE,
                    `${process.argv[3]}\n`
                );
            }
        } else if (process.argv[2] === '--preflight-artifacts') {
            if (process.env.TRACK === 'v3') {
                preflightKitArtifacts(
                    process.argv[3],
                    process.env.NPM_DIST_TAG
                );
            }
        } else {
            main();
        }
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

module.exports = {
    appendCoreRecoverySummary,
    appendRecoverySummary,
    assertDistTagWillNotMoveBackward,
    compareStableVersions,
    npmView,
    packKitArtifacts,
    packPackage,
    preflightKitArtifacts,
    preflightReleaseDistTags,
    preflightTarball,
    publishKitArtifacts,
    publishTarball,
    validatePackageContents,
    validatePackageManifest,
    verifyCurrentReleaseComplete,
    verifyPublishedCore,
    verifyRemotePackage,
    waitForRemotePackage,
};
