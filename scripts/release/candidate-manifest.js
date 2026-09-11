/* eslint-env node, es2021 */

const crypto = require('node:crypto');
const { parseStableVersion } = require('./version');

const gitShaPattern = /^[0-9a-f]{40}$/;
const sha256Pattern = /^[0-9a-f]{64}$/;

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function isPlainObject(value) {
    if (value === null || typeof value !== 'object') {
        return false;
    }
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

function canonicalize(value) {
    if (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'boolean'
    ) {
        return value;
    }
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
            throw new Error(
                'Canonical JSON does not support non-finite numbers'
            );
        }
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(canonicalize);
    }
    if (!isPlainObject(value)) {
        throw new Error('Canonical JSON supports only plain JSON values');
    }

    return Object.keys(value)
        .sort()
        .reduce((result, key) => {
            if (value[key] === undefined) {
                throw new Error(
                    `Canonical JSON does not support undefined at ${key}`
                );
            }
            result[key] = canonicalize(value[key]);
            return result;
        }, {});
}

function canonicalJson(value) {
    return `${JSON.stringify(canonicalize(value))}\n`;
}

function sha256Canonical(value) {
    return crypto
        .createHash('sha256')
        .update(canonicalJson(value))
        .digest('hex');
}

function assertGitSha(value, fieldName) {
    if (typeof value !== 'string' || !gitShaPattern.test(value)) {
        throw new Error(`Expected ${fieldName} to be a full lowercase Git SHA`);
    }
}

function assertSha256(value, fieldName) {
    if (typeof value !== 'string' || !sha256Pattern.test(value)) {
        throw new Error(
            `Expected ${fieldName} to be a lowercase SHA-256 digest`
        );
    }
}

function validatePackageArtifact(pkg, index, version) {
    if (!isPlainObject(pkg)) {
        throw new Error(`Invalid package artifact at index ${index}`);
    }
    if (
        !isNonEmptyString(pkg.name) ||
        !isNonEmptyString(pkg.path) ||
        !isNonEmptyString(pkg.tarball) ||
        !isNonEmptyString(pkg.integrity)
    ) {
        throw new Error(`Incomplete package artifact at index ${index}`);
    }
    if (pkg.version !== version) {
        throw new Error(
            `Package ${pkg.name} has version ${pkg.version}; expected ${version}`
        );
    }
    assertSha256(pkg.sha256, `packages[${index}].sha256`);
    if (!Number.isSafeInteger(pkg.size) || pkg.size < 0) {
        throw new Error(`Invalid package size at index ${index}`);
    }

    return {
        integrity: pkg.integrity,
        name: pkg.name,
        path: pkg.path,
        sha256: pkg.sha256,
        size: pkg.size,
        tarball: pkg.tarball,
        version: pkg.version,
    };
}

function createCandidateManifest({
    version,
    source_sha,
    packages,
    release_notes,
    build,
}) {
    parseStableVersion(version);
    assertGitSha(source_sha, 'source_sha');
    if (!Array.isArray(packages) || packages.length === 0) {
        throw new Error('Candidate manifest requires package artifacts');
    }
    if (
        !isPlainObject(release_notes) ||
        release_notes.path !== 'release-notes.md'
    ) {
        throw new Error('Candidate manifest requires release-notes.md');
    }
    assertSha256(release_notes.sha256, 'release_notes.sha256');
    if (!Number.isSafeInteger(release_notes.size) || release_notes.size < 0) {
        throw new Error('Candidate manifest has an invalid release-notes size');
    }
    if (
        !isPlainObject(build) ||
        !isNonEmptyString(build.node) ||
        !isNonEmptyString(build.npm)
    ) {
        throw new Error('Candidate manifest requires build tool versions');
    }

    const validatedPackages = packages.map((pkg, index) =>
        validatePackageArtifact(pkg, index, version)
    );
    ['name', 'path', 'tarball'].forEach(field => {
        const values = new Set();
        validatedPackages.forEach(pkg => {
            if (values.has(pkg[field])) {
                throw new Error(
                    `Duplicate package artifact ${field}: ${pkg[field]}`
                );
            }
            values.add(pkg[field]);
        });
    });

    return {
        build: {
            node: build.node,
            npm: build.npm,
        },
        packages: validatedPackages,
        release_notes: {
            path: release_notes.path,
            sha256: release_notes.sha256,
            size: release_notes.size,
        },
        schema_version: 1,
        source_sha,
        version,
    };
}

function createReleaseEnvelope({
    manifest_sha256,
    candidate_sha,
    version,
    source_sha,
    stable_tag,
    deployment_id,
    cycle_id,
    cycle_deployment_id,
    caller_workflow,
    attestation_signer,
    artifact_subjects,
    actions_artifacts,
}) {
    assertSha256(manifest_sha256, 'manifest_sha256');
    assertGitSha(candidate_sha, 'candidate_sha');
    assertGitSha(source_sha, 'source_sha');
    parseStableVersion(version);
    if (stable_tag !== `v${version}`) {
        throw new Error(`Expected stable_tag to be v${version}`);
    }
    if (!Number.isSafeInteger(deployment_id) || deployment_id <= 0) {
        throw new Error('Release envelope requires a deployment ID');
    }
    if (
        !/^[0-9a-f]{64}$/.test(cycle_id) ||
        !Number.isSafeInteger(cycle_deployment_id) ||
        cycle_deployment_id <= 0
    ) {
        throw new Error(
            'Release envelope requires exact release-cycle identity'
        );
    }
    if (
        !isPlainObject(caller_workflow) ||
        !isNonEmptyString(caller_workflow.repository) ||
        !isNonEmptyString(caller_workflow.workflow_ref) ||
        !Number.isSafeInteger(caller_workflow.run_id) ||
        caller_workflow.run_id <= 0 ||
        !Number.isSafeInteger(caller_workflow.run_attempt) ||
        caller_workflow.run_attempt <= 0
    ) {
        throw new Error(
            'Release envelope requires complete caller workflow identity'
        );
    }
    if (
        !isPlainObject(attestation_signer) ||
        !isNonEmptyString(attestation_signer.repository) ||
        !isNonEmptyString(attestation_signer.workflow) ||
        !isNonEmptyString(attestation_signer.digest)
    ) {
        throw new Error(
            'Release envelope requires complete attestation signer identity'
        );
    }
    assertGitSha(attestation_signer.digest, 'attestation_signer.digest');
    if (!Array.isArray(artifact_subjects) || artifact_subjects.length === 0) {
        throw new Error('Release envelope requires artifact subjects');
    }
    if (!Array.isArray(actions_artifacts) || actions_artifacts.length === 0) {
        throw new Error('Release envelope requires Actions artifacts');
    }
    const artifactIds = new Set();
    const validatedArtifacts = actions_artifacts.map((artifact, index) => {
        if (
            !isPlainObject(artifact) ||
            !Number.isSafeInteger(artifact.id) ||
            artifact.id <= 0 ||
            artifactIds.has(artifact.id) ||
            !isNonEmptyString(artifact.name) ||
            !isNonEmptyString(artifact.created_at) ||
            !isNonEmptyString(artifact.expires_at)
        ) {
            throw new Error(`Invalid Actions artifact at index ${index}`);
        }
        artifactIds.add(artifact.id);
        assertSha256(artifact.digest, `actions_artifacts[${index}].digest`);
        const createdAt = Date.parse(artifact.created_at);
        const expiresAt = Date.parse(artifact.expires_at);
        if (
            !Number.isFinite(createdAt) ||
            !Number.isFinite(expiresAt) ||
            expiresAt <= createdAt
        ) {
            throw new Error('Actions artifact has an invalid lifetime');
        }
        return {
            created_at: artifact.created_at,
            digest: artifact.digest,
            expires_at: artifact.expires_at,
            id: artifact.id,
            name: artifact.name,
        };
    });

    return {
        actions_artifacts: validatedArtifacts,
        artifact_subjects: artifact_subjects.map((subject, index) => {
            if (!isPlainObject(subject) || !isNonEmptyString(subject.name)) {
                throw new Error(`Invalid artifact subject at index ${index}`);
            }
            assertSha256(subject.sha256, `artifact_subjects[${index}].sha256`);
            return {
                name: subject.name,
                sha256: subject.sha256,
            };
        }),
        candidate_sha,
        cycle_deployment_id,
        cycle_id,
        deployment_id,
        manifest_sha256,
        originating_run: {
            repository: caller_workflow.repository,
            run_attempt: caller_workflow.run_attempt,
            run_id: caller_workflow.run_id,
            workflow_ref: caller_workflow.workflow_ref,
        },
        schema_version: 2,
        source_sha,
        stable_tag,
        version,
        attestation_signer: {
            digest: attestation_signer.digest,
            repository: attestation_signer.repository,
            workflow: attestation_signer.workflow,
        },
        caller_workflow: {
            repository: caller_workflow.repository,
            run_attempt: caller_workflow.run_attempt,
            run_id: caller_workflow.run_id,
            workflow_ref: caller_workflow.workflow_ref,
        },
    };
}

module.exports = {
    canonicalJson,
    createCandidateManifest,
    createReleaseEnvelope,
    sha256Canonical,
};
