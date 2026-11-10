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
// A failed or timed-out `npm view` is retried once inside this total budget.
const npmViewBudgetMs = 90000;
const npmViewRetryPauseMs = 1000;
const npmViewMinRetryMs = 5000;
const kitPublishConcurrency = 6;
// After `npm publish` reports an error, npm is checked for the package for up
// to this long per observation window, backing off between rounds. A package
// published once more gets a second window.
const publishReconcileWindowMs = 5 * 60 * 1000;
// An `npm publish` still running after this long is stopped (SIGTERM, then
// SIGKILL after the grace period) and its outcome decided by reading npm.
const npmPublishTimeoutMs = 5 * 60 * 1000;
const npmPublishKillGraceMs = 15000;
// After SIGKILL, how long to wait for npm to exit before giving up on it.
const npmPublishExitGraceMs = 15000;
// Packages published once more after reconciliation share this budget, and
// each attempt is stopped after the shorter retry timeout.
const publishRetryPhaseMs = 15 * 60 * 1000;
const publishRetryTimeoutMs = 3 * 60 * 1000;
// The first round of kit publishes shares this budget. Each publish is charged
// its npm lookup, its timeout and both kill grace periods against it, and none
// starts with less than the minimum left, so the job stays bounded.
const publishPhaseMs = 60 * 60 * 1000;
// Preflight has its own deadline, so slow lookups cannot eat the publish time;
// it fails before anything is published.
const publishPreflightPhaseMs = 15 * 60 * 1000;
// The dist-tag scans before publishing read one tag per package; they share a
// deadline so a slow registry cannot hold the job for long.
const distTagScanPhaseMs = 15 * 60 * 1000;
const publishMinStartMs = 60 * 1000;
const publishReconcileBackoffMs = [5000, 10000, 20000, 30000];
const npmExecutable = path.join(path.dirname(process.execPath), 'npm');

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

function npmViewOnce(spec, field, timeoutMs) {
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
            // A lookup is read-only, so a timed-out one is killed outright:
            // spawnSync waits for the child to exit, and npm could ignore SIGTERM.
            killSignal: 'SIGKILL',
        }
    );

    if (result.status !== 0) {
        const errorOutput = `${result.stdout || ''}\n${result.stderr || ''}`;
        if (errorOutput.includes('E404')) {
            return null;
        }
        let message;
        if (result.error && result.error.code === 'ETIMEDOUT') {
            message = `npm view timed out after ${timeoutMs}ms for ${spec} ${field}`;
        } else if (result.error) {
            const detail = [result.error.code, result.error.message]
                .filter(Boolean)
                .join(': ');
            message = `npm view failed for ${spec} ${field} (${npmExecutable}: ${detail})${
                errorOutput.trim() ? `:\n${errorOutput.trim()}` : ''
            }`;
        } else {
            message = `npm view failed for ${spec} ${field}:\n${errorOutput.trim()}`;
        }
        const error = new Error(message);
        error.code = 'NPM_VIEW_FAILED';
        throw error;
    }

    const output = result.stdout.trim();
    return output ? JSON.parse(output) : null;
}

// A lookup is read-only, so a failed or timed-out one is retried once, as long
// as enough of the total budget is left. A missing version (E404) is an
// answer, not a failure, and is never retried here.
function npmView(spec, field, budgetMs = npmViewBudgetMs, clock = {}) {
    const now = clock.now || Date.now;
    const wait = clock.wait || defaultWait;
    const started = now();
    try {
        return npmViewOnce(spec, field, Math.min(npmViewTimeoutMs, budgetMs));
    } catch (error) {
        const remaining = budgetMs - (now() - started) - npmViewRetryPauseMs;
        if (error.code !== 'NPM_VIEW_FAILED' || remaining < npmViewMinRetryMs) {
            throw error;
        }
        wait(npmViewRetryPauseMs);
        return npmViewOnce(spec, field, Math.min(npmViewTimeoutMs, remaining));
    }
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
    // The completeness check and the scan below share one deadline.
    const viewTag = deadlineView(Date.now() + distTagScanPhaseMs);
    if (track === 'v3') {
        verifyCurrentReleaseComplete(
            coreManifest.name,
            distTag,
            viewTag,
            version
        );
        packageNames.push(
            ...loadReleaseInventory().publishEntries.map(entry => entry.name)
        );
    }

    for (const packageName of packageNames) {
        const currentVersion = viewTag(packageName, `dist-tags.${distTag}`);
        assertDistTagWillNotMoveBackward(
            packageName,
            currentVersion,
            version,
            distTag
        );
    }
}

// Core already on the target version means an earlier run published core at
// that version and stopped before every kit had it, so this run recovers it:
// the kits not yet on it must all be on one earlier version. Otherwise a kit
// that does not match core stops the release, so no newer release starts
// while the current one is incomplete.
function verifyCurrentReleaseComplete(
    corePackageName,
    distTag,
    viewPackage = npmView,
    targetVersion = null
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
    const incompleteVersions = [];
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
            incompleteVersions.push(currentKitVersion);
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
    if (incompletePackages.length > 0 && currentCoreVersion === targetVersion) {
        const [earlierVersion] = incompleteVersions;
        if (
            !isOlderStableVersion(earlierVersion, targetVersion) ||
            incompleteVersions.some(kitVersion => kitVersion !== earlierVersion)
        ) {
            throw new Error(
                `Cannot recover V3 release ${targetVersion} on npm: core is on it, but the kits not on it are not all on one earlier version: ${incompletePackages.join(
                    ', '
                )}`
            );
        }
        console.log(
            `Core is already on ${targetVersion}, so this run recovers it; the kits still on ${earlierVersion} publish next`
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

    verifyDistTag(packageInfo, version, distTag, viewPackage);
}

function verifyDistTag(packageInfo, version, distTag, viewPackage = npmView) {
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

// An npm lookup that never runs past an absolute deadline: each lookup gets only
// what is left of it, and none starts with too little left to finish.
function deadlineView(deadline, now = Date.now) {
    return (spec, field) => {
        const remainingMs = deadline - now();
        if (remainingMs < npmViewMinRetryMs) {
            const error = new Error(
                `npm view for ${spec} ${field} was not run: the time for it ran out`
            );
            error.code = 'NPM_VIEW_FAILED';
            throw error;
        }
        return npmView(spec, field, Math.min(npmViewBudgetMs, remainingMs));
    };
}

function verifyPublishedCore(packageInfo, version, distTag, options = {}) {
    const viewPackage = options.npmView || npmView;
    const verifyTag = options.verifyDistTag || verifyDistTag;
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
    verifyTag(packageInfo, version, distTag, viewPackage);
}

function waitForPublishedCore(packageInfo, version, distTag, options = {}) {
    const verifyCore = options.verifyPublishedCore || verifyPublishedCore;
    const wait = options.wait || defaultWait;
    const now = options.now || Date.now;
    const maxAttempts = options.maxAttempts || remoteAuditAttempts;
    const delayMs = options.delayMs || remoteAuditDelayMs;
    // Every lookup shares one deadline, so slow lookups cannot stretch the wait.
    const deadline = now() + maxAttempts * delayMs;
    const coreOptions = {
        ...options,
        npmView: options.npmView || deadlineView(deadline, now),
    };
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            verifyCore(packageInfo, version, distTag, coreOptions);
            return;
        } catch (error) {
            lastError = error;
            if (
                isIntegrityMismatchError(error) ||
                attempt === maxAttempts ||
                now() + delayMs >= deadline
            ) {
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

function preflightTarball(packageInfo, version, distTag, options = {}) {
    const viewPackage = options.deadline
        ? deadlineView(options.deadline)
        : npmView;
    const spec = `${packageInfo.name}@${version}`;
    const remoteIntegrity = viewPackage(spec, 'dist.integrity');
    if (!remoteIntegrity) {
        return 'missing';
    }
    if (remoteIntegrity !== packageInfo.integrity) {
        throw new Error(
            `${spec} already exists with integrity ${remoteIntegrity}; local artifact is ${packageInfo.integrity}`
        );
    }
    verifyDistTag(packageInfo, version, distTag, viewPackage);
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
        const deadline = Date.now() + publishPreflightPhaseMs;
        for (const packageInfo of packageArtifacts) {
            const status = preflightTarball(packageInfo, version, distTag, {
                deadline,
            });
            console.log(`${packageInfo.name}: ${status}`);
        }
        console.log(
            `Preflighted ${packageArtifacts.length} kit artifacts at ${version}`
        );
    } finally {
        fs.rmSync(tempDirectory, { force: true, recursive: true });
    }
}

function publishTarball(packageInfo, version, distTag, options = {}) {
    const killGraceMs = options.killGraceMs || npmPublishKillGraceMs;
    const exitGraceMs = options.exitGraceMs || npmPublishExitGraceMs;
    const deadline =
        options.deadline || Date.now() + npmViewBudgetMs + npmPublishTimeoutMs;
    const spec = `${packageInfo.name}@${version}`;
    const notStarted = () => {
        const error = new Error(
            `${spec} was not published: the publish time ran out before it started`
        );
        error.code = 'PUBLISH_NOT_STARTED';
        return error;
    };
    if (deadline - Date.now() < publishMinStartMs) {
        throw notStarted();
    }
    const remoteIntegrity = npmView(
        spec,
        'dist.integrity',
        Math.min(npmViewBudgetMs, deadline - Date.now() - publishMinStartMs / 2)
    );
    if (remoteIntegrity) {
        if (remoteIntegrity !== packageInfo.integrity) {
            throw new Error(
                `${spec} already exists with integrity ${remoteIntegrity}; local artifact is ${packageInfo.integrity}`
            );
        }
        // The integrity already matched, so only the dist-tag is left to
        // check, within what is left of the deadline.
        verifyDistTag(packageInfo, version, distTag, deadlineView(deadline));
        return 'skipped';
    }
    // Whatever the lookup left, less the kill grace periods.
    const availableMs = deadline - Date.now() - killGraceMs - exitGraceMs;
    if (availableMs < publishMinStartMs / 2) {
        throw notStarted();
    }
    const timeoutMs = Math.min(
        options.timeoutMs || npmPublishTimeoutMs,
        availableMs
    );

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
        // A timed-out publish settles once npm has exited, so it cannot still
        // be uploading when npm is read. One that will not exit is flagged
        // (unterminated), detached so it cannot keep this job alive, and
        // never published again.
        let timedOut = false;
        const timers = [];
        const after = (delayMs, callback) =>
            timers.push(setTimeout(callback, delayMs));
        after(timeoutMs, () => {
            timedOut = true;
            child.kill('SIGTERM');
            after(killGraceMs, () => {
                child.kill('SIGKILL');
                after(exitGraceMs, () =>
                    settle(() => {
                        const error = new Error(
                            `npm publish failed for ${spec}: it did not exit after SIGKILL`
                        );
                        error.code = 'PUBLISH_AMBIGUOUS';
                        // It may still be running, so it is never published again.
                        error.unterminated = true;
                        child.stdout.destroy();
                        child.stderr.destroy();
                        child.unref();
                        reject(error);
                    })
                );
            });
        });
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
            timers.forEach(clearTimeout);
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

        // npm could not be started, so nothing reached the registry. After a
        // timeout, an error (a failed kill) waits for npm to exit instead.
        child.on('error', error => {
            if (!timedOut) {
                settle(() => reject(error));
            }
        });
        child.on('close', (code, signal) => {
            settle(() => {
                if (timedOut) {
                    const error = new Error(
                        `npm publish failed for ${spec}: stopped after ${timeoutMs /
                            1000}s`
                    );
                    error.code = 'PUBLISH_AMBIGUOUS';
                    reject(error);
                    return;
                }
                if (code === 0) {
                    resolve('published');
                    return;
                }
                // npm can report an error after the registry accepted the
                // package, so the outcome is decided by reading npm afterwards.
                const npmError = firstNpmError(`${stdout}\n${stderr}`);
                const error = new Error(
                    `${
                        signal
                            ? `npm publish failed for ${spec} with signal ${signal}`
                            : `npm publish failed for ${spec} with exit code ${code}`
                    }${npmError ? `: ${npmError}` : ''}`
                );
                error.code = 'PUBLISH_AMBIGUOUS';
                reject(error);
            });
        });
    });
}

// The first npm error line that says what went wrong, skipping npm's error
// code and log-file pointer lines.
function firstNpmError(output) {
    const line = output
        .split('\n')
        .map(text => text.trim())
        .find(
            text =>
                /^npm (error|ERR!) /.test(text) &&
                !/^npm (error|ERR!) (code |A complete log)/.test(text)
        );
    return line ? line.replace(/^npm (error|ERR!) /, '') : '';
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
        return [];
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
    return failures;
}

function publishFailureError(items, failures) {
    return new Error(
        `${failures.length} kit publish${
            failures.length === 1 ? '' : 'es'
        } failed: ${formatConcurrentErrors(items, failures)}`
    );
}

// Reads npm for each package until it confirms this release's artifact on the
// dist-tag, finds something else there, or the shared deadline passes. A
// package is "absent" only if every read said the version does not exist: a
// failed read or an artifact whose dist-tag lags never counts as absence.
function observeRegistry(packageInfos, version, distTag, options = {}) {
    const wait = options.wait || defaultWait;
    const now = options.now || Date.now;
    const backoffMs = options.backoffMs || publishReconcileBackoffMs;
    const deadline = now() + (options.durationMs || publishReconcileWindowMs);
    const viewPackage = options.viewPackage || npmView;
    const verified = [];
    const mismatched = [];
    let pending = packageInfos.map(packageInfo => ({
        packageInfo,
        absentReads: 0,
        sawArtifact: false,
        sawReadFailure: false,
        message: 'not checked before the deadline',
    }));

    for (let round = 0; pending.length > 0 && now() < deadline; round++) {
        const stillPending = [];
        for (const item of pending) {
            // A read the window can no longer fit is skipped rather than
            // counted as a failed read, which would rule out a retry.
            if (deadline - now() < npmViewMinRetryMs) {
                stillPending.push(item);
                continue;
            }
            try {
                verifyRemotePackage(
                    item.packageInfo,
                    version,
                    distTag,
                    (spec, field) => {
                        const remainingMs = deadline - now();
                        if (remainingMs < npmViewMinRetryMs) {
                            const error = new Error(
                                `${spec} ${field} was not read before the deadline`
                            );
                            error.code = 'OUT_OF_TIME';
                            throw error;
                        }
                        const value = viewPackage(spec, field, remainingMs);
                        // Any artifact npm shows counts as seen at once, so a
                        // skipped tag read can never leave it looking absent.
                        if (field === 'dist.integrity' && value) {
                            item.sawArtifact = true;
                        }
                        return value;
                    }
                );
                verified.push(item.packageInfo.name);
                continue;
            } catch (error) {
                if (error.code === 'OUT_OF_TIME') {
                    if (item.sawArtifact) {
                        item.message = `${item.packageInfo.name}@${version} is on npm, but its dist-tag was not read before the deadline`;
                    }
                    stillPending.push(item);
                    continue;
                }
                item.message = error.message.split('\n')[0];
                if (error.code === 'NOT_VISIBLE') {
                    item.absentReads++;
                } else if (error.code === 'DIST_TAG_BEHIND') {
                    item.sawArtifact = true;
                } else if (error.code === 'NPM_VIEW_FAILED') {
                    item.sawReadFailure = true;
                } else {
                    mismatched.push({
                        name: item.packageInfo.name,
                        message: item.message,
                    });
                    continue;
                }
            }
            stillPending.push(item);
        }
        pending = stillPending;
        if (pending.length === 0) {
            break;
        }
        const delayMs = backoffMs[Math.min(round, backoffMs.length - 1)];
        if (now() + delayMs >= deadline) {
            break;
        }
        console.log(
            `npm has not confirmed ${pending
                .map(item => item.packageInfo.name)
                .join(', ')} at ${version}; checking again in ${delayMs /
                1000}s`
        );
        wait(delayMs);
    }

    return {
        verified,
        mismatched,
        unresolved: pending.map(item => ({
            packageInfo: item.packageInfo,
            absent:
                item.absentReads >= 2 &&
                !item.sawArtifact &&
                !item.sawReadFailure,
            message: item.message,
        })),
    };
}

// Decides packages whose `npm publish` reported an error. A package npm shows
// with this release's integrity on the dist-tag is published. A package npm
// repeatedly reports as absent is published once more, after which npm decides
// again; nothing else is retried, because a version can be published only once.
async function reconcileAmbiguousPublishes(
    ambiguousItems,
    version,
    distTag,
    options = {}
) {
    const publish = options.publishTarball || publishTarball;
    const now = options.now || Date.now;
    const retryPhaseMs = options.retryPhaseMs || publishRetryPhaseMs;
    const retryTimeoutMs = options.retryTimeoutMs || publishRetryTimeoutMs;
    const unterminated = new Set(
        ambiguousItems
            .filter(item => item.error && item.error.unterminated)
            .map(item => item.packageInfo.name)
    );
    const published = [];
    const failures = [];
    const describeUnresolved = (item, prefix) => ({
        name: item.packageInfo.name,
        message: `${prefix}: ${item.message}`,
    });

    const first = observeRegistry(
        ambiguousItems.map(item => item.packageInfo),
        version,
        distTag,
        options
    );
    for (const name of first.verified) {
        // npm shows the right package, but a publish that would not exit is
        // still running somewhere, so the release does not count as clean.
        if (unterminated.has(name)) {
            failures.push({
                name,
                message:
                    'verified on npm, but npm publish did not exit and may still be running',
            });
        } else {
            published.push({
                name,
                result: 'published (npm reported an error; verified on npm)',
            });
        }
    }
    failures.push(...first.mismatched);

    const retry = [];
    for (const item of first.unresolved) {
        if (item.absent && !unterminated.has(item.packageInfo.name)) {
            retry.push(item.packageInfo);
        } else {
            failures.push(
                describeUnresolved(
                    item,
                    unterminated.has(item.packageInfo.name)
                        ? 'not confirmed on npm, and npm publish may still be running'
                        : 'not confirmed on npm'
                )
            );
        }
    }

    const retryErrors = new Map();
    const retried = [];
    const retryDeadline = now() + retryPhaseMs;
    for (const packageInfo of retry) {
        const remaining = retryDeadline - now();
        if (remaining < publishMinStartMs) {
            failures.push({
                name: packageInfo.name,
                message:
                    'not confirmed on npm and not retried: retry time ran out',
            });
            continue;
        }
        console.log(
            `npm still shows no ${packageInfo.name}@${version}; publishing it once more`
        );
        retried.push(packageInfo);
        try {
            await Promise.resolve(
                publish(packageInfo, version, distTag, {
                    deadline: retryDeadline,
                    timeoutMs: retryTimeoutMs,
                })
            );
        } catch (error) {
            retryErrors.set(packageInfo.name, error.message.split('\n')[0]);
            if (error.unterminated) {
                unterminated.add(packageInfo.name);
            }
        }
    }

    if (retried.length > 0) {
        const second = observeRegistry(retried, version, distTag, options);
        for (const name of second.verified) {
            if (unterminated.has(name)) {
                failures.push({
                    name,
                    message:
                        'verified on npm after retry, but npm publish did not exit and may still be running',
                });
            } else {
                published.push({
                    name,
                    result: retryErrors.has(name)
                        ? 'published on retry (npm reported an error; verified on npm)'
                        : 'published on retry (verified on npm)',
                });
            }
        }
        failures.push(
            ...second.mismatched,
            ...second.unresolved.map(item =>
                describeUnresolved(
                    item,
                    retryErrors.has(item.packageInfo.name)
                        ? `retry failed (${retryErrors.get(
                              item.packageInfo.name
                          )}) and not confirmed on npm`
                        : 'not confirmed on npm after retry'
                )
            )
        );
    }

    return { published, failures };
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
    const now = options.now || Date.now;
    const preflightDeadline =
        now() + (options.preflightPhaseMs || publishPreflightPhaseMs);

    for (const packageInfo of packageArtifacts) {
        if (
            preflight(packageInfo, version, distTag, {
                deadline: preflightDeadline,
            }) === 'existing'
        ) {
            existingPackages.add(packageInfo.name);
        }
    }

    // The publish time starts only once every preflight has passed.
    const publishDeadline = now() + (options.publishPhaseMs || publishPhaseMs);

    const reconcile = options.reconcile || reconcileAmbiguousPublishes;
    const results = options.results || [];
    const publishedResults = new Map();
    const pendingPackages = packageArtifacts.filter(
        packageInfo => !existingPackages.has(packageInfo.name)
    );
    const ambiguous = [];

    try {
        const failures = await runWithBoundedConcurrency(
            pendingPackages,
            concurrency,
            async packageInfo => {
                try {
                    const result = await Promise.resolve(
                        publish(packageInfo, version, distTag, {
                            deadline: publishDeadline,
                        })
                    );
                    publishedResults.set(packageInfo.name, result);
                } catch (error) {
                    if (error && error.code === 'PUBLISH_AMBIGUOUS') {
                        ambiguous.push({ packageInfo, error });
                        return;
                    }
                    throw error;
                }
            }
        );

        // Every publish has settled. One that would not exit is detached,
        // never retried and always reported as failed.
        if (ambiguous.length > 0) {
            const outcome = await reconcile(ambiguous, version, distTag, {
                ...options.reconcileOptions,
                publishTarball: publish,
            });
            for (const { name, result } of outcome.published) {
                publishedResults.set(name, result);
            }
            const indexByName = new Map(
                pendingPackages.map((packageInfo, index) => [
                    packageInfo.name,
                    index,
                ])
            );
            const ambiguousErrors = new Map(
                ambiguous.map(item => [
                    item.packageInfo.name,
                    item.error.message.split('\n')[0],
                ])
            );
            for (const { name, message } of outcome.failures) {
                failures.push({
                    index: indexByName.get(name),
                    error: new Error(
                        `${ambiguousErrors.get(name)}; ${message}`
                    ),
                });
            }
        }

        if (failures.length > 0) {
            throw publishFailureError(pendingPackages, failures);
        }
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
        '3. Recover the failed Step 1 run for its release mode:',
        `   - **Tag mode (Release Please, dispatched from \`${releaseTag}\`)**: use **Re-run failed jobs** on the original **V3 Release - Step 1** run (which keeps the successful package job and its \`\${GITHUB_RUN_ID}-\${GITHUB_RUN_ATTEMPT}\` build ID; never start a fresh Step 1 run or use **Re-run all jobs**).`,
        '   - **Branch mode (dispatched from `v3-staging` before Release Please)**: dispatch **V3 Release - Step 1** from `v3-staging` with:',
        '     - `dryRun=false`',
        `     - \`resumeKitReleaseTag=${releaseTag}\``,
        '     If `main` has no `v3-release-step-1.yml` yet (the first V3 release after the V2/V3 split), dispatch **Staging Release - Step 1** from `v3-staging` instead, with `track=v3` and the same two inputs.',
        '4. Wait for the recovery run to publish any missing kits and verify core and all 33 kits on `next` (`publish-kits.js` runs its integrated strict npm audit at the end of **Publish V3 kits**).',
        '5. Complete candidate upload and staging for the mode used:',
        `   - **Tag mode**: **Re-run failed jobs** on the original Step 1 run re-runs \`advance-staging\` and \`upload-v3-candidate\` using the original run's packaged candidate (or, if \`v3-staging\` already moved and only candidate upload or stage failed, dispatch **V3 shadow release: upload candidate** (\`v3-shadow-candidate.yml\`) on \`main\` with \`step1_run_id\` set to the original Step 1 run's ID, \`release_gate=true\`, and \`release_tag=${releaseTag}\` within the candidate's 7-day retention window).`,
        "   - **Branch mode**: because `resumeKitReleaseTag` skips packaging and upload, dispatch **V3 shadow release: upload candidate** (`v3-shadow-candidate.yml`) on `main` with `step1_run_id` set to the original failed Step 1 run's ID and `release_gate=true` within the candidate's 7 days.",
        '6. Only after the recovery run and candidate upload are green, continue with Step 2 or Step 3.',
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

function appendAuditSummary(version, distTag, audit, options = {}) {
    const strict =
        options === true || Boolean(options && options.strict === true);
    appendSummary(
        version,
        distTag,
        [
            ...audit.verified.map(name => ({ name, result: 'verified' })),
            ...audit.lagging.map(({ name, message }) => ({
                name,
                result: strict
                    ? `not confirmed yet (failed in strict mode): ${message}`
                    : `not confirmed yet (warning): ${message}`,
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
        strict
            ? `npm accepted these packages, or they are still missing, and within five minutes it did not confirm \`${version}\` on \`${distTag}\`: it did not show them yet, or \`npm view\` failed or timed out. That can be propagation lag, a missing package, or an \`npm view\` failure. Under \`--audit --strict\`, any unconfirmed package fails the audit and fails the release recovery run.`
            : `npm accepted these packages, but within five minutes it did not confirm \`${version}\` on \`${distTag}\`: it did not show them yet, or \`npm view\` failed or timed out. That is usually propagation lag, but a failed \`npm view\` can also mean npm itself is having problems. Neither fails the release.`,
        '',
        `1. Later, confirm each one: \`npm view <package>@${version} dist.integrity --prefer-online\` and \`npm view <package> dist-tags.${distTag} --prefer-online\`.`,
        `2. If a package is still missing, recover the release (in tag mode, use **Re-run failed jobs** on the original Step 1 run; in branch mode, run kit recovery from \`v3-staging\` with \`resumeKitReleaseTag=v${version}\`); it skips identical packages and publishes only missing ones.`,
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

// Publishes core from a checkout of its release tag, for a Step 1 run
// dispatched from that tag (Release Please mode). A version npm already holds
// with the same integrity is left as it is, so a second run from the same tag
// finishes a stopped release; a different integrity fails. When npm reports an
// error after the upload, npm is read until core shows the local integrity.
async function publishCore(version, distTag, options = {}) {
    const pack = options.packPackage || packPackage;
    const publish = options.publishTarball || publishTarball;
    const waitForCore = options.waitForPublishedCore || waitForPublishedCore;
    const validateContents =
        options.validatePackageContents || validatePackageContents;
    const coreManifest =
        options.coreManifest ||
        JSON.parse(
            fs.readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
        );
    if (coreManifest.version !== version) {
        throw new Error(
            `Core SDK is ${coreManifest.version}, expected ${version}`
        );
    }
    validateContents('.', coreManifest);

    const destination = fs.mkdtempSync(
        path.join(os.tmpdir(), 'mparticle-core-release-')
    );
    try {
        const packageInfo = {
            name: coreManifest.name,
            ...pack('.', destination),
        };
        try {
            const result = await publish(packageInfo, version, distTag);
            if (result === 'skipped') {
                return {
                    name: packageInfo.name,
                    result: 'already on npm with the same integrity',
                };
            }
            return { name: packageInfo.name, result };
        } catch (error) {
            if (error.code !== 'PUBLISH_AMBIGUOUS') {
                throw error;
            }
            console.log(
                `${error.message}; reading npm for ${packageInfo.name}@${version}`
            );
            waitForCore(packageInfo, version, distTag);
            return {
                name: packageInfo.name,
                result: 'published after npm reported an error',
            };
        }
    } finally {
        fs.rmSync(destination, { force: true, recursive: true });
    }
}

async function publishCoreMain() {
    const { version, distTag } = readReleaseEnvironment();
    const result = await publishCore(version, distTag);
    appendSummary(version, distTag, [result], 'npm core publish');
    console.log(`${result.name}@${version}: ${result.result}`);
}

function runPackageAudit(packageArtifacts, version, distTag, options = {}) {
    const strict = options.strict === true;
    const auditPackages = options.auditRemotePackages || auditRemotePackages;
    const audit = auditPackages(
        packageArtifacts,
        version,
        distTag,
        options.auditOptions
    );
    if (
        typeof options.beforeAuditSummary === 'function' &&
        audit.mismatched.length === 0 &&
        (!strict || audit.lagging.length === 0)
    ) {
        options.beforeAuditSummary();
    }
    appendAuditSummary(version, distTag, audit, { strict });
    for (const { name, message } of audit.lagging) {
        console.log(`::warning::npm has not confirmed ${name} yet: ${message}`);
    }
    const failures = strict
        ? [...audit.mismatched, ...audit.lagging]
        : audit.mismatched;
    if (failures.length > 0) {
        const kind = strict ? 'unverified' : 'mismatched';
        const list = failures.map(f => `${f.name}: ${f.message}`).join('; ');
        const error = new Error(
            `npm audit found ${failures.length} ${kind} package(s): ${list}`
        );
        error.failedPackageNames = new Set(failures.map(({ name }) => name));
        throw error;
    }
    console.log(
        `Verified ${audit.verified.length} of ${packageArtifacts.length} packages at ${version} with dist-tag ${distTag}`
    );
    return audit;
}

async function main(options = {}) {
    const { version, distTag } = readReleaseEnvironment();
    const inventory = options.inventory || loadReleaseInventory();
    const packArtifacts = options.packReleaseArtifacts || packReleaseArtifacts;
    const waitForCore = options.waitForPublishedCore || waitForPublishedCore;
    const publishKits = options.publishKitArtifacts || publishKitArtifacts;
    const tempDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), 'mparticle-kit-release-')
    );
    const results = [];

    try {
        const packageArtifacts = packArtifacts(
            inventory,
            version,
            tempDirectory
        );

        const viewTag =
            options.viewTag || deadlineView(Date.now() + distTagScanPhaseMs);
        for (const packageInfo of packageArtifacts) {
            const currentVersion = viewTag(
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

        waitForCore(packageArtifacts[0], version, distTag, {
            isRecovery: process.env.KIT_RELEASE_RECOVERY === 'true',
            ...options.coreOptions,
        });
        results.push({ name: packageArtifacts[0].name, result: 'verified' });

        await publishKits(packageArtifacts.slice(1), version, distTag, {
            results,
            ...options.publishOptions,
        });
        console.log(
            `Published every kit at ${version} with dist-tag ${distTag}`
        );

        runPackageAudit(packageArtifacts, version, distTag, {
            ...options,
            strict: true,
            beforeAuditSummary: () => appendSummary(version, distTag, results),
        });
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
            const failedPackageNames =
                error && error.failedPackageNames instanceof Set
                    ? error.failedPackageNames
                    : new Set();
            appendRecoverySummary(
                version,
                inventory.publishEntries
                    .map(entry => entry.name)
                    .filter(
                        packageName =>
                            !completedPackageNames.has(packageName) ||
                            failedPackageNames.has(packageName)
                    )
            );
        }
        throw error;
    } finally {
        fs.rmSync(tempDirectory, { force: true, recursive: true });
    }
}

// By default only a mismatch fails: a package npm has not confirmed yet is
// reported as a warning, because the publish itself already succeeded. With
// strict: true (used at the end of main() and under --audit --strict), any
// unconfirmed or missing package also fails.
function auditMain(options = {}) {
    const strict = options.strict === true;
    const { version, distTag } = readReleaseEnvironment();
    const inventory = options.inventory || loadReleaseInventory();
    const packArtifacts = options.packReleaseArtifacts || packReleaseArtifacts;
    const tempDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), 'mparticle-kit-audit-')
    );

    try {
        const packageArtifacts = packArtifacts(
            inventory,
            version,
            tempDirectory
        );
        return runPackageAudit(packageArtifacts, version, distTag, {
            ...options,
            strict,
        });
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
            if (
                process.argv.length > 3 &&
                (process.argv.length > 4 || process.argv[3] !== '--strict')
            ) {
                throw new Error(`Unknown option: ${process.argv[3]}`);
            }
            auditMain({ strict: process.argv[3] === '--strict' });
            return;
        }
        if (process.argv[2] === '--publish-core') {
            await publishCoreMain();
            return;
        }
        // An option this script does not know, such as a typo, stops here
        // rather than falling through to the publish.
        if (process.argv.length > 2) {
            throw new Error(`Unknown option: ${process.argv[2]}`);
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
    auditMain,
    auditRemotePackages,
    compareStableVersions,
    kitPublishConcurrency,
    main,
    npmView,
    observeRegistry,
    packKitArtifacts,
    packPackage,
    preflightKitArtifacts,
    preflightReleaseDistTags,
    preflightTarball,
    publishCore,
    publishKitArtifacts,
    publishTarball,
    reconcileAmbiguousPublishes,
    validatePackageContents,
    validatePackageManifest,
    verifyCurrentReleaseComplete,
    verifyPublishedCore,
    verifyRemotePackage,
    waitForPublishedCore,
};
