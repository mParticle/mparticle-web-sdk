/* eslint-env node, es2021 */

const fs = require('node:fs');
const crypto = require('node:crypto');
const https = require('node:https');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const {
    auditPackages,
    loadCanonicalJson,
    sha256File,
    verifyRelease,
} = require('./exact-release');
const { loadV3PackageInventory } = require('./package-inventory');
const { canonicalJson } = require('./candidate-manifest');
const { parseStableVersion } = require('./version');

const gitShaPattern = /^[0-9a-f]{40}$/;
const sha256Pattern = /^[0-9a-f]{64}$/;
const trustedCallerWorkflow =
    'mParticle/mparticle-web-sdk/.github/workflows/' +
    'staging-step-1.yml@refs/heads/main';
const trustedSignerWorkflow =
    'github.com/mParticle/mparticle-web-sdk/.github/workflows/' +
    'reusable-v3-staging-step-1.yml';
const releaseOrderBranches = Object.freeze([
    'v3-release-order-a',
    'v3-release-order-b',
    'v3-release-order-c',
]);
const finalBranches = Object.freeze(['main', ...releaseOrderBranches]);
const forbiddenBranches = new Set([
    'master',
    'development',
    'staging',
    'v3-development',
    'v3-staging',
]);

function assertGitSha(value, name) {
    if (typeof value !== 'string' || !gitShaPattern.test(value)) {
        throw new Error(`${name} must be a full lowercase Git SHA`);
    }
    return value;
}

function assertStableTag(value) {
    if (typeof value !== 'string' || !value.startsWith('v')) {
        throw new Error('release tag must be a stable semantic-version tag');
    }
    try {
        parseStableVersion(value.slice(1));
    } catch {
        throw new Error('release tag must be a stable semantic-version tag');
    }
    return value;
}

function assertBranch(value, allowlist) {
    if (
        typeof value !== 'string' ||
        !allowlist.includes(value) ||
        forbiddenBranches.has(value) ||
        value.startsWith('refs/')
    ) {
        throw new Error(`Forbidden promotion branch: ${value}`);
    }
    return value;
}

function createMutationPlan({
    candidateSha,
    destinations,
    allowedBranches,
    isAncestor,
}) {
    assertGitSha(candidateSha, 'candidate_sha');
    if (
        !Array.isArray(destinations) ||
        destinations.length === 0 ||
        typeof isAncestor !== 'function'
    ) {
        throw new Error(
            'Promotion requires destinations and an ancestry check'
        );
    }

    const seen = new Set();
    return destinations.map(destination => {
        if (!destination || typeof destination !== 'object') {
            throw new Error('Invalid promotion destination');
        }
        const branch = assertBranch(destination.branch, allowedBranches);
        if (seen.has(branch)) {
            throw new Error(`Duplicate promotion branch: ${branch}`);
        }
        seen.add(branch);
        const expectedSha = assertGitSha(
            destination.expectedSha,
            `${branch} expected_sha`
        );
        const currentSha = assertGitSha(
            destination.currentSha,
            `${branch} current_sha`
        );
        if (currentSha !== expectedSha) {
            throw new Error(
                `Stale expected SHA for ${branch}: ${currentSha} != ${expectedSha}`
            );
        }
        if (
            currentSha !== candidateSha &&
            !isAncestor(currentSha, candidateSha)
        ) {
            throw new Error(`${branch} cannot fast-forward to candidate`);
        }
        return { branch, expectedSha };
    });
}

function createStep2Plan(options) {
    const plan = createMutationPlan({
        ...options,
        allowedBranches: releaseOrderBranches,
    });
    if (plan.length !== 1) {
        throw new Error('Step 2 must update exactly one release-order branch');
    }
    return plan;
}

function createStep3Plan(options) {
    const plan = createMutationPlan({
        ...options,
        allowedBranches: finalBranches,
    });
    if (
        plan.length !== finalBranches.length ||
        plan.some((entry, index) => entry.branch !== finalBranches[index])
    ) {
        throw new Error(
            'Step 3 must update main and all three release-order branches'
        );
    }
    return plan;
}

function createStep3Execution({
    candidateSha,
    destinations,
    isAncestor,
    sourceSha,
}) {
    assertGitSha(sourceSha, 'source_sha');
    if (
        destinations.length === finalBranches.length &&
        destinations.every(
            (destination, index) =>
                destination.branch === finalBranches[index] &&
                destination.currentSha === candidateSha
        )
    ) {
        return { mode: 'recovery', plan: [] };
    }
    const main = destinations.find(
        destination => destination.branch === 'main'
    );
    if (
        destinations.some(
            destination => destination.currentSha === candidateSha
        )
    ) {
        throw new Error('Step 3 rejects mixed promotion state');
    }
    if (
        !main ||
        main.currentSha !== sourceSha ||
        main.expectedSha !== sourceSha
    ) {
        throw new Error('Fresh Step 3 requires main at source_sha');
    }
    return {
        mode: 'fresh',
        plan: createStep3Plan({ candidateSha, destinations, isAncestor }),
    };
}

function buildPushArguments(candidateSha, plan, atomic) {
    assertGitSha(candidateSha, 'candidate_sha');
    if (!Array.isArray(plan) || plan.length === 0) {
        throw new Error('Cannot push an empty promotion plan');
    }
    const arguments_ = ['push'];
    if (atomic) {
        arguments_.push('--atomic');
    }
    const seen = new Set();
    for (const entry of plan) {
        assertBranch(entry.branch, finalBranches);
        if (seen.has(entry.branch)) {
            throw new Error(`Duplicate promotion branch: ${entry.branch}`);
        }
        seen.add(entry.branch);
        assertGitSha(entry.expectedSha, `${entry.branch} expected_sha`);
        arguments_.push(
            `--force-with-lease=refs/heads/${entry.branch}:${entry.expectedSha}`
        );
    }
    arguments_.push('origin');
    for (const entry of plan) {
        arguments_.push(`${candidateSha}:refs/heads/${entry.branch}`);
    }
    return arguments_;
}

function executePush(candidateSha, plan, atomic, execute = execFileSync) {
    if (plan.mode === 'recovery') {
        return [];
    }
    if (plan.mode === 'fresh') {
        plan = plan.plan;
    }
    const args = buildPushArguments(candidateSha, plan, atomic);
    execute('git', args, { stdio: 'inherit' });
    return args;
}

function validateReleaseMetadata(release, tag, recordDirectory) {
    if (
        !release ||
        release.tag_name !== tag ||
        release.name !== tag ||
        release.draft !== false ||
        release.prerelease !== false
    ) {
        throw new Error('GitHub Release does not match the stable release');
    }
    const requiredAssets = ['candidate-manifest.json', 'release-envelope.json'];
    for (const name of requiredAssets) {
        const matches = (release.assets || []).filter(
            asset => asset.name === name
        );
        const expectedDigest = `sha256:${sha256File(
            path.join(recordDirectory, name)
        )}`;
        if (matches.length !== 1 || matches[0].digest !== expectedDigest) {
            throw new Error(`GitHub Release asset mismatch: ${name}`);
        }
    }
}

function expectedIdentityFromEnvelope(envelope) {
    const packageArtifact = envelope.actions_artifacts?.[0];
    if (
        !envelope ||
        envelope.schema_version !== 2 ||
        envelope.caller_workflow?.repository !==
            'mParticle/mparticle-web-sdk' ||
        envelope.caller_workflow?.workflow_ref !== trustedCallerWorkflow ||
        envelope.attestation_signer?.repository !==
            'mParticle/mparticle-web-sdk' ||
        envelope.attestation_signer?.workflow !== trustedSignerWorkflow ||
        envelope.originating_run?.repository !==
            'mParticle/mparticle-web-sdk' ||
        envelope.originating_run?.workflow_ref !== trustedCallerWorkflow ||
        envelope.originating_run?.run_id !== envelope.caller_workflow?.run_id ||
        !Number.isSafeInteger(envelope.deployment_id) ||
        envelope.deployment_id <= 0 ||
        !sha256Pattern.test(envelope.cycle_id) ||
        !Number.isSafeInteger(envelope.cycle_deployment_id) ||
        envelope.cycle_deployment_id <= 0 ||
        !Number.isSafeInteger(packageArtifact?.id) ||
        packageArtifact.id <= 0 ||
        !sha256Pattern.test(packageArtifact?.digest) ||
        !sha256Pattern.test(envelope.manifest_sha256)
    ) {
        throw new Error(
            'Trusted release record has an invalid schema or signer'
        );
    }
    assertGitSha(envelope.candidate_sha, 'candidate_sha');
    assertGitSha(envelope.source_sha, 'source_sha');
    assertGitSha(envelope.attestation_signer.digest, 'signer_digest');
    assertStableTag(envelope.stable_tag);
    if (envelope.stable_tag !== `v${envelope.version}`) {
        throw new Error('Trusted release record tag/version mismatch');
    }
    return {
        artifactCreatedAt: packageArtifact.created_at,
        artifactDigest: packageArtifact.digest,
        artifactExpiresAt: packageArtifact.expires_at,
        artifactId: packageArtifact.id,
        candidateSha: envelope.candidate_sha,
        cycleDeploymentId: envelope.cycle_deployment_id,
        cycleId: envelope.cycle_id,
        deploymentId: envelope.deployment_id,
        repository: envelope.originating_run.repository,
        runAttempt: envelope.originating_run.run_attempt,
        runId: envelope.originating_run.run_id,
        manifestSha256: envelope.manifest_sha256,
        signerDigest: envelope.attestation_signer.digest,
        signerWorkflow: envelope.attestation_signer.workflow,
        sourceSha: envelope.source_sha,
        version: envelope.version,
        workflowRef: envelope.caller_workflow.workflow_ref,
    };
}

async function verifyPublishedRelease({
    artifactDirectory,
    recordDirectory,
    release,
    repositoryRoot,
    tag,
    audit = auditPackages,
}) {
    assertStableTag(tag);
    const envelopePath = path.join(recordDirectory, 'release-envelope.json');
    const envelope = loadCanonicalJson(envelopePath);
    const expected = expectedIdentityFromEnvelope(envelope);
    if (
        envelope.stable_tag !== tag ||
        tag !== `v${expected.version}` ||
        expected.signerDigest !== expected.sourceSha
    ) {
        throw new Error('Trusted release record identity mismatch');
    }
    validateReleaseMetadata(release, tag, recordDirectory);
    const manifest = verifyRelease({
        artifactDirectory,
        envelopePath,
        expected,
        repositoryRoot,
    });
    if (
        typeof release.body !== 'string' ||
        release.body.trimEnd() !==
            fs
                .readFileSync(
                    path.join(artifactDirectory, manifest.release_notes.path),
                    'utf8'
                )
                .trimEnd()
    ) {
        throw new Error('GitHub Release notes do not match exact artifacts');
    }
    const inventory = loadV3PackageInventory(repositoryRoot);
    if (inventory.length !== 34 || manifest.packages.length !== 34) {
        throw new Error('Published release must contain exactly 34 packages');
    }
    const audited = await audit(manifest);
    if (audited !== 34) {
        throw new Error('npm release audit did not verify all 34 packages');
    }
    return { envelope, expected, manifest };
}

function validateDownstreamReceipt(receipt, identity) {
    const allowedKeys = [
        'candidate_sha',
        'manifest_sha256',
        'request_id',
        'schema_version',
        'source_sha',
        'status',
        'validated_at',
        'validator',
        'version',
    ];
    const validatedAt = Date.parse(receipt?.validated_at);
    const now = identity.now ? identity.now() : Date.now();
    if (
        !receipt ||
        Object.keys(receipt)
            .sort()
            .join(',') !== allowedKeys.sort().join(',') ||
        receipt.schema_version !== 1 ||
        receipt.status !== 'validated' ||
        receipt.validator !== identity.validator ||
        receipt.request_id !== identity.requestId ||
        receipt.version !== identity.version ||
        receipt.candidate_sha !== identity.candidateSha ||
        receipt.source_sha !== identity.sourceSha ||
        receipt.manifest_sha256 !== identity.manifestSha256 ||
        typeof receipt.validated_at !== 'string' ||
        !Number.isFinite(validatedAt) ||
        validatedAt > now + 60_000 ||
        now - validatedAt > identity.maxReceiptAgeMs
    ) {
        throw new Error(
            'Downstream validation receipt does not match release identity'
        );
    }
    return receipt;
}

function downstreamRequestId(identity) {
    return crypto
        .createHash('sha256')
        .update(
            canonicalJson({
                candidate_sha: identity.candidateSha,
                manifest_sha256: identity.manifestSha256,
                version: identity.version,
            })
        )
        .digest('hex');
}

function requestOnce({
    endpoint,
    identity,
    maxResponseBytes,
    request,
    timeoutMs,
    token,
}) {
    let url;
    try {
        url = new URL(endpoint);
    } catch {
        throw new Error('Downstream validation endpoint must be a valid URL');
    }
    if (
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        url.hash ||
        typeof token !== 'string' ||
        token.length === 0
    ) {
        throw new Error(
            'Downstream validation contract is not securely configured'
        );
    }
    const body = canonicalJson({
        candidate_sha: identity.candidateSha,
        request_id: identity.requestId,
        manifest_sha256: identity.manifestSha256,
        source_sha: identity.sourceSha,
        version: identity.version,
    });
    return new Promise((resolve, reject) => {
        const operation = request(
            url,
            {
                headers: {
                    accept: 'application/json',
                    authorization: `Bearer ${token}`,
                    'content-length': Buffer.byteLength(body),
                    'content-type': 'application/json',
                    'idempotency-key': identity.requestId,
                },
                method: 'POST',
                timeout: timeoutMs,
            },
            response => {
                const chunks = [];
                let responseBytes = 0;
                const contentType = `${response.headers?.['content-type'] ||
                    ''}`;
                if (
                    response.statusCode === 200 &&
                    !/^application\/json(?:;|$)/i.test(contentType)
                ) {
                    response.resume?.();
                    reject(new Error('Downstream response is not JSON'));
                    return;
                }
                response.setEncoding('utf8');
                response.on('data', chunk => {
                    responseBytes += Buffer.byteLength(chunk);
                    if (responseBytes > maxResponseBytes) {
                        response.destroy?.();
                        reject(
                            new Error('Downstream response exceeds size limit')
                        );
                        return;
                    }
                    chunks.push(chunk);
                });
                response.on('end', () => {
                    if (response.statusCode !== 200) {
                        reject(
                            new Error(
                                `Downstream validation failed: HTTP ${response.statusCode}`
                            )
                        );
                        return;
                    }
                    try {
                        resolve(
                            validateDownstreamReceipt(
                                JSON.parse(chunks.join('')),
                                identity
                            )
                        );
                    } catch (error) {
                        reject(error);
                    }
                });
            }
        );
        operation.on('error', reject);
        operation.on('timeout', () => {
            operation.destroy(new Error('Downstream validation timed out'));
        });
        operation.end(body);
    });
}

function retryable(error) {
    return (
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        /timed out|HTTP (408|429|5\d\d)$/.test(error.message)
    );
}

async function requestDownstreamValidation({
    endpoint,
    identity,
    maxAttempts = 3,
    maxResponseBytes = 1024 * 1024,
    request = https.request,
    sleep = milliseconds =>
        new Promise(resolve => setTimeout(resolve, milliseconds)),
    timeoutMs = 15_000,
    token,
    validator = 'mparticle-v3-production-validator',
}) {
    const completeIdentity = {
        ...identity,
        maxReceiptAgeMs: 5 * 60_000,
        now: identity.now || (() => Date.now()),
        requestId: downstreamRequestId(identity),
        validator,
    };
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await requestOnce({
                endpoint,
                identity: completeIdentity,
                maxResponseBytes,
                request,
                timeoutMs,
                token,
            });
        } catch (error) {
            lastError = error;
            if (!retryable(error) || attempt === maxAttempts) {
                throw error;
            }
            await sleep(250 * 2 ** (attempt - 1));
        }
    }
    throw lastError;
}

function parseArguments(argv) {
    const [command, ...args] = argv;
    const values = {};
    for (let index = 0; index < args.length; index += 2) {
        if (!args[index]?.startsWith('--') || args[index + 1] === undefined) {
            throw new Error(`Invalid argument: ${args[index] || ''}`);
        }
        values[args[index].slice(2)] = args[index + 1];
    }
    return { command, values };
}

function required(values, name) {
    if (!values[name]) {
        throw new Error(`Missing --${name}`);
    }
    return values[name];
}

function writeOutput(name, value) {
    if (!process.env.GITHUB_OUTPUT) {
        process.stdout.write(`${name}=${value}\n`);
        return;
    }
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

async function runCli(argv) {
    const { command, values } = parseArguments(argv);
    if (command === 'resolve') {
        const recordDirectory = required(values, 'record-directory');
        const envelope = loadCanonicalJson(
            path.join(recordDirectory, 'release-envelope.json')
        );
        const expected = expectedIdentityFromEnvelope(envelope);
        assertStableTag(required(values, 'tag'));
        if (
            envelope.stable_tag !== values.tag ||
            envelope.manifest_sha256 !==
                sha256File(
                    path.join(recordDirectory, 'candidate-manifest.json')
                )
        ) {
            throw new Error('Trusted release record identity mismatch');
        }
        Object.entries({
            artifact_digest: expected.artifactDigest,
            artifact_id: expected.artifactId,
            candidate_sha: expected.candidateSha,
            cycle_deployment_id: expected.cycleDeploymentId,
            cycle_id: expected.cycleId,
            deployment_id: expected.deploymentId,
            manifest_sha256: expected.manifestSha256,
            origin_repository: expected.repository,
            origin_run_attempt: expected.runAttempt,
            origin_run_id: expected.runId,
            signer_digest: expected.signerDigest,
            signer_workflow: expected.signerWorkflow,
            source_sha: expected.sourceSha,
            version: expected.version,
            workflow_ref: expected.workflowRef,
        }).forEach(([name, value]) => writeOutput(name, value));
        return;
    }
    if (command === 'verify-published') {
        const result = await verifyPublishedRelease({
            artifactDirectory: required(values, 'artifact-directory'),
            recordDirectory: required(values, 'record-directory'),
            release: JSON.parse(
                fs.readFileSync(required(values, 'release-json'), 'utf8')
            ),
            repositoryRoot: required(values, 'repository-root'),
            tag: required(values, 'tag'),
        });
        writeOutput('candidate_sha', result.expected.candidateSha);
        writeOutput('source_sha', result.expected.sourceSha);
        writeOutput('manifest_sha256', result.expected.manifestSha256);
        writeOutput('version', result.expected.version);
        return;
    }
    if (command === 'push-plan') {
        const candidateSha = required(values, 'candidate-sha');
        const plan = JSON.parse(
            fs.readFileSync(required(values, 'plan'), 'utf8')
        );
        executePush(candidateSha, plan, values.atomic === 'true');
        return;
    }
    if (command === 'validate-downstream') {
        const receipt = JSON.parse(
            fs.readFileSync(required(values, 'receipt'), 'utf8')
        );
        validateDownstreamReceipt(receipt, {
            candidateSha: required(values, 'candidate-sha'),
            manifestSha256: required(values, 'manifest-sha256'),
            sourceSha: required(values, 'source-sha'),
            version: required(values, 'version'),
        });
        return;
    }
    if (command === 'request-downstream') {
        await requestDownstreamValidation({
            endpoint: required(values, 'endpoint'),
            identity: {
                candidateSha: required(values, 'candidate-sha'),
                manifestSha256: required(values, 'manifest-sha256'),
                sourceSha: required(values, 'source-sha'),
                version: required(values, 'version'),
            },
            token: required(values, 'token'),
        });
        return;
    }
    throw new Error(`Unsupported command: ${command}`);
}

if (require.main === module) {
    runCli(process.argv.slice(2)).catch(error => {
        console.error(error.message);
        process.exit(1);
    });
}

module.exports = {
    assertBranch,
    assertGitSha,
    assertStableTag,
    buildPushArguments,
    createMutationPlan,
    createStep2Plan,
    createStep3Execution,
    createStep3Plan,
    downstreamRequestId,
    executePush,
    expectedIdentityFromEnvelope,
    finalBranches,
    forbiddenBranches,
    releaseOrderBranches,
    requestDownstreamValidation,
    runCli,
    validateDownstreamReceipt,
    validateReleaseMetadata,
    verifyPublishedRelease,
};
