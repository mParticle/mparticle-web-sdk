/* eslint-env node, es2021 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawn, spawnSync } = require('node:child_process');
const {
    loadReleaseInventory,
    validateVersion,
} = require('./prepare-kit-release');

const repositoryRoot = path.resolve(__dirname, '..');
const registry = 'https://registry.npmjs.org';
const initialV3CoreVersion = '3.0.0';
const remoteAuditAttempts = 60;
const remoteAuditDelayMs = 5000;
const npmViewTimeoutMs = 60000;
const kitPublishConcurrency = 6;
const npmExecutable = path.join(
    path.dirname(process.execPath),
    process.platform === 'win32' ? 'npm.cmd' : 'npm'
);

function runNpm(args, options = {}) {
    const executeOptions = {
        cwd: repositoryRoot,
        encoding: 'utf8',
        stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
        timeout: options.timeout,
    };
    if (options.maxBuffer) {
        executeOptions.maxBuffer = options.maxBuffer;
    }
    try {
        return execFileSync(
            options.npmExecutable || npmExecutable,
            args,
            executeOptions
        ).trim();
    } catch (error) {
        const reason =
            [
                error.code,
                error.signal && `signal ${error.signal}`,
                typeof error.status === 'number' && `exit ${error.status}`,
            ]
                .filter(Boolean)
                .join(', ') || 'unknown error';
        // execFileSync already appends stderr to the message on a non-zero exit.
        const summary = String(error.message).split('\n')[0];
        const stderr = String(error.stderr || '').trim();
        const wrapped = new Error(
            `npm ${args[0]} failed (${reason}): ${summary}${
                stderr ? `\n${stderr}` : ''
            }`
        );
        wrapped.cause = error;
        throw wrapped;
    }
}

function npmView(spec, field, timeoutMs = npmViewTimeoutMs) {
    const result = spawnSync(
        npmExecutable,
        // A cached registry response can still report a version just
        // published as missing (E404) for several minutes.
        [
            'view',
            spec,
            field,
            '--json',
            '--prefer-online',
            `--registry=${registry}`,
        ],
        {
            cwd: repositoryRoot,
            encoding: 'utf8',
            timeout: timeoutMs,
        }
    );

    if (result.status !== 0) {
        const errorOutput = `${result.stdout || ''}\n${result.stderr || ''}`;
        if (errorOutput.includes('E404')) {
            return null;
        }
        const error = new Error(
            result.error && result.error.code === 'ETIMEDOUT'
                ? `npm view timed out after ${timeoutMs}ms for ${spec} ${field}`
                : `npm view failed for ${spec} ${field}:\n${errorOutput.trim()}`
        );
        error.code = 'NPM_VIEW_FAILED';
        throw error;
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

function packPackage(packagePath, destination, options = {}) {
    const output = runNpm(
        [
            'pack',
            path.resolve(repositoryRoot, packagePath),
            '--json',
            '--ignore-scripts',
            '--pack-destination',
            destination,
        ],
        options
    );
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

function verifyRemotePackage(
    packageInfo,
    version,
    distTag,
    viewPackage = npmView
) {
    const spec = `${packageInfo.name}@${version}`;
    const remoteIntegrity = viewPackage(spec, 'dist.integrity');
    if (!remoteIntegrity) {
        const error = new Error(`${spec} is not yet visible on npm`);
        error.code = 'NOT_VISIBLE';
        throw error;
    }
    if (remoteIntegrity !== packageInfo.integrity) {
        throw new Error(
            `${spec} integrity mismatch: expected ${packageInfo.integrity}, received ${remoteIntegrity}`
        );
    }

    const taggedVersion = viewPackage(packageInfo.name, `dist-tags.${distTag}`);
    if (taggedVersion !== version) {
        const error = new Error(
            `${packageInfo.name} dist-tag ${distTag} points to ${taggedVersion}, expected ${version}`
        );
        if (!taggedVersion || isOlderStableVersion(taggedVersion, version)) {
            error.code = 'DIST_TAG_BEHIND';
        }
        throw error;
    }
}

function isOlderStableVersion(candidate, version) {
    try {
        return compareStableVersions(candidate, version) < 0;
    } catch {
        return false;
    }
}

function defaultWait(delayMs) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delayMs);
}

function isIntegrityMismatchError(error) {
    if (
        !error ||
        typeof error.message !== 'string' ||
        !error.message.includes('integrity mismatch')
    ) {
        return false;
    }

    const received = /received (\S+)$/.exec(error.message);
    if (!received) {
        return true;
    }

    return received[1] !== 'null' && received[1] !== 'undefined';
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

function waitForPublishedCore(packageInfo, version, distTag, options = {}) {
    const verifyCore = options.verifyPublishedCore || verifyPublishedCore;
    const wait = options.wait || defaultWait;
    const maxAttempts = options.maxAttempts || remoteAuditAttempts;
    const delayMs = options.delayMs || remoteAuditDelayMs;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            verifyCore(packageInfo, version, distTag, options);
            return;
        } catch (error) {
            lastError = error;
            if (isIntegrityMismatchError(error) || attempt === maxAttempts) {
                break;
            }
            console.log(
                `Core ${
                    packageInfo.name
                }@${version} is not yet confirmed on npm; retrying in ${delayMs /
                    1000}s (attempt ${attempt}/${maxAttempts})`
            );
            wait(delayMs);
        }
    }

    if (
        lastError &&
        !isIntegrityMismatchError(lastError) &&
        lastError.code !== 'CORE_NOT_PUBLISHED'
    ) {
        throw new Error(
            `Core ${packageInfo.name}@${version} did not become visible on npm within five minutes: ${lastError.message}`
        );
    }
    throw lastError;
}

function isVisibilityLag(error) {
    return (
        !!error &&
        ['NOT_VISIBLE', 'DIST_TAG_BEHIND', 'NPM_VIEW_FAILED'].includes(
            error.code
        )
    );
}

// Retries packages npm has not confirmed yet, then sorts every package into
// verified, lagging (npm did not show it, or `npm view` failed or was not run,
// by the deadline) or mismatched (npm shows something other than this
// release's artifact or dist-tag). Each `npm view` gets only the time left
// before the deadline, so a slow registry cannot hold the audit past it.
function auditRemotePackages(packageInfos, version, distTag, options = {}) {
    const wait = options.wait || defaultWait;
    const now = options.now || Date.now;
    const maxAttempts = options.maxAttempts || remoteAuditAttempts;
    const delayMs = options.delayMs || remoteAuditDelayMs;
    const deadline =
        now() +
        (options.durationMs || remoteAuditAttempts * remoteAuditDelayMs);
    const viewPackage = options.viewPackage || npmView;
    const verifyPackage =
        options.verifyRemotePackage ||
        ((packageInfo, packageVersion, packageDistTag) =>
            verifyRemotePackage(
                packageInfo,
                packageVersion,
                packageDistTag,
                (spec, field) =>
                    viewPackage(
                        spec,
                        field,
                        Math.max(
                            1,
                            Math.min(npmViewTimeoutMs, deadline - now())
                        )
                    )
            ));
    const verified = [];
    const mismatched = [];
    let lagging = packageInfos.map(packageInfo => ({
        packageInfo,
        message: 'not checked before the audit deadline',
    }));

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const pending = lagging;
        lagging = [];
        for (const item of pending) {
            if (now() >= deadline) {
                lagging.push(item);
                continue;
            }
            try {
                verifyPackage(item.packageInfo, version, distTag);
                verified.push(item.packageInfo.name);
            } catch (error) {
                (isVisibilityLag(error) ? lagging : mismatched).push({
                    packageInfo: item.packageInfo,
                    message: error.message.split('\n')[0],
                });
            }
        }

        if (lagging.length === 0 || now() + delayMs >= deadline) {
            break;
        }
        if (attempt < maxAttempts) {
            wait(delayMs);
        }
    }

    const describe = items =>
        items.map(({ packageInfo, message }) => ({
            name: packageInfo.name,
            message,
        }));
    return {
        verified,
        lagging: describe(lagging),
        mismatched: describe(mismatched),
    };
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

    return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        let settled = false;
        const child = spawn(
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
                stdio: ['ignore', 'pipe', 'pipe'],
            }
        );
        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');
        child.stdout.on('data', data => {
            stdout += data;
        });
        child.stderr.on('data', data => {
            stderr += data;
        });

        const settle = callback => {
            if (settled) {
                return;
            }
            settled = true;
            // One stdout write keeps npm's stderr inside the log group;
            // GitHub can reorder lines across separate streams.
            const output = [stdout, stderr]
                .filter(Boolean)
                .map(text => (text.endsWith('\n') ? text : `${text}\n`))
                .join('');
            process.stdout.write(
                `::group::npm publish ${spec}\n${output}::endgroup::\n`
            );
            callback();
        };

        child.on('error', error => settle(() => reject(error)));
        child.on('close', (code, signal) => {
            settle(() => {
                if (code === 0) {
                    resolve('published');
                    return;
                }
                reject(
                    new Error(
                        signal
                            ? `npm publish failed for ${spec} with signal ${signal}`
                            : `npm publish failed for ${spec} with exit code ${code}`
                    )
                );
            });
        });
    });
}

function formatConcurrentErrors(items, failures) {
    const described = failures
        .sort((left, right) => left.index - right.index)
        .map(({ index, error }) => {
            const item = items[index];
            const itemName =
                item && item.name ? item.name : `item ${index + 1}`;
            const message =
                error && error.message ? error.message : String(error);
            return { itemName, message };
        });
    // The release summary keeps only the first line, so it must name every
    // failed kit; multi-line npm output follows as detail.
    const summary = described
        .map(
            ({ itemName, message }) => `${itemName}: ${message.split('\n')[0]}`
        )
        .join('; ');
    const details = described
        .filter(({ message }) => message.includes('\n'))
        .map(({ itemName, message }) => `${itemName}: ${message}`);
    return details.length > 0
        ? `${summary}\n\n${details.join('\n\n')}`
        : summary;
}

function resolvePublishConcurrency(concurrency) {
    const resolved = concurrency == null ? kitPublishConcurrency : concurrency;
    if (!Number.isInteger(resolved) || resolved < 1) {
        throw new Error(
            `Kit publish concurrency must be a positive integer, received ${concurrency}`
        );
    }
    return resolved;
}

async function runWithBoundedConcurrency(items, concurrency, workerFn) {
    if (items.length === 0) {
        return;
    }

    let nextIndex = 0;
    const failures = [];

    async function worker() {
        for (
            let index = nextIndex++;
            index < items.length;
            index = nextIndex++
        ) {
            try {
                await workerFn(items[index], index);
            } catch (error) {
                failures.push({ index, error });
            }
        }
    }

    await Promise.all(
        Array.from({ length: Math.min(concurrency, items.length) }, () =>
            worker()
        )
    );
    if (failures.length > 0) {
        throw new Error(
            `${failures.length} kit publish${
                failures.length === 1 ? '' : 'es'
            } failed: ${formatConcurrentErrors(items, failures)}`
        );
    }
}

async function publishKitArtifacts(
    packageArtifacts,
    version,
    distTag,
    options = {}
) {
    const preflight = options.preflightTarball || preflightTarball;
    const publish = options.publishTarball || publishTarball;
    const concurrency = resolvePublishConcurrency(options.concurrency);
    const existingPackages = new Set();

    for (const packageInfo of packageArtifacts) {
        if (preflight(packageInfo, version, distTag) === 'existing') {
            existingPackages.add(packageInfo.name);
        }
    }

    const results = options.results || [];
    const publishedResults = new Map();
    const pendingPackages = packageArtifacts.filter(
        packageInfo => !existingPackages.has(packageInfo.name)
    );

    try {
        await runWithBoundedConcurrency(
            pendingPackages,
            concurrency,
            async packageInfo => {
                const result = await Promise.resolve(
                    publish(packageInfo, version, distTag)
                );
                publishedResults.set(packageInfo.name, result);
            }
        );
    } finally {
        for (const packageInfo of packageArtifacts) {
            if (existingPackages.has(packageInfo.name)) {
                results.push({
                    name: packageInfo.name,
                    result: 'skipped (identical)',
                });
            } else if (publishedResults.has(packageInfo.name)) {
                results.push({
                    name: packageInfo.name,
                    result: publishedResults.get(packageInfo.name),
                });
            }
        }
    }

    return results;
}

function appendSummary(version, distTag, results, title = 'npm kit publish') {
    if (!process.env.GITHUB_STEP_SUMMARY) {
        return;
    }

    const lines = [
        `## ${title}`,
        '',
        `- Version: \`${version}\``,
        `- npm dist-tag: \`${distTag}\``,
        `- Packages: \`${results.length}\``,
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
            : 'All kits were attempted; use the failure above to identify the package requiring repair.',
        '',
        'Recovery verifies existing artifact integrity, skips identical packages, and publishes only missing kits.',
        '',
    ];
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
}

function appendAuditSummary(version, distTag, audit) {
    appendSummary(
        version,
        distTag,
        [
            ...audit.verified.map(name => ({ name, result: 'verified' })),
            ...audit.lagging.map(({ name, message }) => ({
                name,
                result: `not confirmed yet (warning): ${message}`,
            })),
            ...audit.mismatched.map(({ name, message }) => ({
                name,
                result: `failed: ${message}`,
            })),
        ],
        'npm package audit'
    );
    if (!process.env.GITHUB_STEP_SUMMARY || audit.lagging.length === 0) {
        return;
    }

    const lines = [
        '### Packages npm has not confirmed yet',
        '',
        `npm accepted these packages, but within five minutes it did not confirm \`${version}\` on \`${distTag}\`: it did not show them yet, or \`npm view\` failed or timed out. That is usually propagation lag, but a failed \`npm view\` can also mean npm itself is having problems. Neither fails the release.`,
        '',
        `1. Later, confirm each one: \`npm view <package>@${version} dist.integrity --prefer-online\` and \`npm view <package> dist-tags.${distTag} --prefer-online\`.`,
        `2. If a package is still missing, run kit recovery from \`v3-staging\` with \`resumeKitReleaseTag=v${version}\`; it skips identical packages and publishes only missing ones.`,
        '',
        `The next Step 1 refuses to start a newer release until every kit's \`${distTag}\` matches core.`,
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

function readReleaseEnvironment() {
    const version = process.env.RELEASE_VERSION;
    const distTag = process.env.NPM_DIST_TAG;
    validateVersion(version);
    if (!distTag || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(distTag)) {
        throw new Error(`Invalid npm dist-tag: ${distTag}`);
    }
    return { version, distTag };
}

function packReleaseArtifacts(inventory, version, destination) {
    const coreManifest = JSON.parse(
        fs.readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
    );
    if (coreManifest.version !== version) {
        throw new Error(
            `Core SDK is ${coreManifest.version}, expected ${version}`
        );
    }
    validatePackageContents('.', coreManifest);

    const coreArtifact = packPackage('.', destination);
    return [
        {
            name: coreManifest.name,
            ...coreArtifact,
        },
        ...packKitArtifacts(inventory, version, destination),
    ];
}

async function main() {
    const { version, distTag } = readReleaseEnvironment();
    const inventory = loadReleaseInventory();
    const tempDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), 'mparticle-kit-release-')
    );
    const results = [];

    try {
        const packageArtifacts = packReleaseArtifacts(
            inventory,
            version,
            tempDirectory
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

        waitForPublishedCore(packageArtifacts[0], version, distTag, {
            isRecovery: process.env.KIT_RELEASE_RECOVERY === 'true',
        });
        results.push({ name: packageArtifacts[0].name, result: 'verified' });

        await publishKitArtifacts(packageArtifacts.slice(1), version, distTag, {
            results,
        });

        appendSummary(version, distTag, results);
        console.log(
            `Published every kit at ${version} with dist-tag ${distTag}`
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

// Only a mismatch fails: a package npm has not confirmed yet is reported as a
// warning, because the publish itself already succeeded.
function auditMain() {
    const { version, distTag } = readReleaseEnvironment();
    const inventory = loadReleaseInventory();
    const tempDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), 'mparticle-kit-audit-')
    );

    try {
        const packageArtifacts = packReleaseArtifacts(
            inventory,
            version,
            tempDirectory
        );
        const audit = auditRemotePackages(packageArtifacts, version, distTag);
        appendAuditSummary(version, distTag, audit);
        for (const { name, message } of audit.lagging) {
            console.log(
                `::warning::npm has not confirmed ${name} yet: ${message}`
            );
        }
        if (audit.mismatched.length > 0) {
            throw new Error(
                `npm audit found ${
                    audit.mismatched.length
                } mismatched package(s): ${audit.mismatched
                    .map(({ name, message }) => `${name}: ${message}`)
                    .join('; ')}`
            );
        }
        console.log(
            `Verified ${audit.verified.length} of ${packageArtifacts.length} packages at ${version} with dist-tag ${distTag}`
        );
    } finally {
        fs.rmSync(tempDirectory, { force: true, recursive: true });
    }
}

if (require.main === module) {
    const run = async () => {
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
            return;
        }
        if (process.argv[2] === '--preflight-artifacts') {
            if (process.env.TRACK === 'v3') {
                preflightKitArtifacts(
                    process.argv[3],
                    process.env.NPM_DIST_TAG
                );
            }
            return;
        }
        if (process.argv[2] === '--audit') {
            auditMain();
            return;
        }
        await main();
    };

    run().catch(error => {
        console.error(error.message);
        process.exit(1);
    });
}

module.exports = {
    appendAuditSummary,
    appendCoreRecoverySummary,
    appendRecoverySummary,
    assertDistTagWillNotMoveBackward,
    auditRemotePackages,
    compareStableVersions,
    kitPublishConcurrency,
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
    waitForPublishedCore,
};
