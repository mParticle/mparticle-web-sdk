/* eslint-env node, es2021 */

const fs = require('node:fs');
const path = require('node:path');

const stableVersionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const supportedBumps = new Set(['major', 'minor', 'patch']);

function parseStableVersion(version) {
    if (typeof version !== 'string') {
        throw new Error(
            `Expected a stable semantic version, received: ${version}`
        );
    }

    const match = stableVersionPattern.exec(version);
    if (!match) {
        throw new Error(
            `Expected a stable semantic version, received: ${version}`
        );
    }

    const parts = match.slice(1).map(Number);
    if (parts.some(part => !Number.isSafeInteger(part))) {
        throw new Error(`Semantic version component is too large: ${version}`);
    }

    return {
        major: parts[0],
        minor: parts[1],
        patch: parts[2],
        version,
    };
}

function incrementSafely(value, version) {
    if (value === Number.MAX_SAFE_INTEGER) {
        throw new Error(`Cannot increment semantic version safely: ${version}`);
    }
    return value + 1;
}

function calculateNextVersion(currentVersion, bump) {
    const parsed = parseStableVersion(currentVersion);
    if (!supportedBumps.has(bump)) {
        throw new Error(
            `Expected release bump to be major, minor, or patch, received: ${bump}`
        );
    }

    if (bump === 'major') {
        return `${incrementSafely(parsed.major, currentVersion)}.0.0`;
    }
    if (bump === 'minor') {
        return `${parsed.major}.${incrementSafely(
            parsed.minor,
            currentVersion
        )}.0`;
    }
    return `${parsed.major}.${parsed.minor}.${incrementSafely(
        parsed.patch,
        currentVersion
    )}`;
}

function readVersionFile(repositoryRoot) {
    const versionPath = path.join(repositoryRoot, 'VERSION');
    const version = fs.readFileSync(versionPath, 'utf8').trim();
    return parseStableVersion(version).version;
}

module.exports = {
    calculateNextVersion,
    parseStableVersion,
    readVersionFile,
};
