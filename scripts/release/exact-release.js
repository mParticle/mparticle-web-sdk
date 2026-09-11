/* eslint-env node, es2021 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const {
    canonicalJson,
    createReleaseEnvelope,
} = require('./candidate-manifest');
const { loadV3PackageInventory } = require('./package-inventory');
const { parseStableVersion } = require('./version');

const registry = 'https://registry.npmjs.org';
const expectedRepository = 'https://github.com/mParticle/mparticle-web-sdk';
const expectedCallerWorkflow = '/.github/workflows/staging-step-1.yml';
const npmExecutable = path.join(
    path.dirname(process.execPath),
    process.platform === 'win32' ? 'npm.cmd' : 'npm'
);

function sha256File(filePath) {
    return crypto
        .createHash('sha256')
        .update(fs.readFileSync(filePath))
        .digest('hex');
}

function loadCanonicalJson(filePath) {
    const source = fs.readFileSync(filePath, 'utf8');
    const value = JSON.parse(source);
    if (source !== canonicalJson(value)) {
        throw new Error(`Expected canonical JSON: ${filePath}`);
    }
    return value;
}

function expectedSubjects(manifest, manifestPath) {
    return [
        ...manifest.packages.map(pkg => ({
            name: pkg.tarball,
            sha256: pkg.sha256,
        })),
        {
            name: path.basename(manifestPath),
            sha256: sha256File(manifestPath),
        },
        {
            name: manifest.release_notes.path,
            sha256: manifest.release_notes.sha256,
        },
    ];
}

function createEnvelope({
    actionsArtifacts,
    attestationSigner,
    callerWorkflow,
    candidateSha,
    cycleDeploymentId,
    cycleId,
    deploymentId,
    manifestPath,
    outputPath,
}) {
    const manifest = loadCanonicalJson(manifestPath);
    const envelope = createReleaseEnvelope({
        actions_artifacts: actionsArtifacts,
        artifact_subjects: expectedSubjects(manifest, manifestPath),
        candidate_sha: candidateSha,
        cycle_deployment_id: cycleDeploymentId,
        cycle_id: cycleId,
        deployment_id: deploymentId,
        manifest_sha256: sha256File(manifestPath),
        source_sha: manifest.source_sha,
        stable_tag: `v${manifest.version}`,
        version: manifest.version,
        attestation_signer: attestationSigner,
        caller_workflow: callerWorkflow,
    });
    fs.writeFileSync(outputPath, canonicalJson(envelope));
    return envelope;
}

function assertIdentity({ envelope, manifest, expected }) {
    const packageArtifact = envelope.actions_artifacts?.find(
        artifact => artifact.id === expected.artifactId
    );
    const checks = [
        ['version', manifest.version, expected.version],
        ['source_sha', manifest.source_sha, expected.sourceSha],
        ['candidate_sha', envelope.candidate_sha, expected.candidateSha],
        ['cycle_id', envelope.cycle_id, expected.cycleId],
        [
            'cycle_deployment_id',
            envelope.cycle_deployment_id,
            expected.cycleDeploymentId,
        ],
        ['stable_tag', envelope.stable_tag, `v${expected.version}`],
        [
            'caller_workflow_ref',
            envelope.caller_workflow.workflow_ref,
            expected.workflowRef,
        ],
        [
            'caller_repository',
            envelope.caller_workflow.repository,
            expected.repository,
        ],
        [
            'originating_run_id',
            envelope.originating_run?.run_id,
            expected.runId,
        ],
        [
            'originating_repository',
            envelope.originating_run?.repository,
            expected.repository,
        ],
        [
            'originating_workflow_ref',
            envelope.originating_run?.workflow_ref,
            expected.workflowRef,
        ],
        ['deployment_id', envelope.deployment_id, expected.deploymentId],
        ['schema_version', envelope.schema_version, 2],
        [
            'attestation_signer_repository',
            envelope.attestation_signer.repository,
            'mParticle/mparticle-web-sdk',
        ],
        [
            'attestation_signer_workflow',
            envelope.attestation_signer.workflow,
            expected.signerWorkflow,
        ],
        [
            'attestation_signer_digest',
            envelope.attestation_signer.digest,
            expected.signerDigest,
        ],
    ];
    checks.forEach(([name, actual, wanted]) => {
        if (actual !== wanted) {
            throw new Error(
                `Release identity mismatch for ${name}: ${actual} != ${wanted}`
            );
        }
    });
    if (
        envelope.manifest_sha256 !== expected.manifestSha256 ||
        !packageArtifact ||
        packageArtifact.digest !== expected.artifactDigest ||
        packageArtifact.name !==
            `v3-${expected.version}-${expected.sourceSha}` ||
        packageArtifact.created_at !== expected.artifactCreatedAt ||
        packageArtifact.expires_at !== expected.artifactExpiresAt
    ) {
        throw new Error('Release envelope artifact identity mismatch');
    }
}

function verifyRelease({
    artifactDirectory,
    envelopePath,
    expected,
    repositoryRoot,
}) {
    const manifestPath = path.join(
        artifactDirectory,
        'candidate-manifest.json'
    );
    const manifest = loadCanonicalJson(manifestPath);
    const envelope = loadCanonicalJson(envelopePath);
    parseStableVersion(manifest.version);
    assertIdentity({ envelope, manifest, expected });

    const inventory = loadV3PackageInventory(repositoryRoot);
    if (
        manifest.packages.length !== inventory.length ||
        manifest.packages.some(
            (pkg, index) =>
                pkg.name !== inventory[index].name ||
                pkg.path !== inventory[index].path
        )
    ) {
        throw new Error('Candidate manifest package inventory mismatch');
    }

    manifest.packages.forEach(pkg => {
        const tarballPath = path.join(artifactDirectory, pkg.tarball);
        const stat = fs.statSync(tarballPath);
        if (stat.size !== pkg.size || sha256File(tarballPath) !== pkg.sha256) {
            throw new Error(`Artifact digest mismatch: ${pkg.tarball}`);
        }
    });
    const releaseNotesPath = path.join(
        artifactDirectory,
        manifest.release_notes.path
    );
    if (
        fs.statSync(releaseNotesPath).size !== manifest.release_notes.size ||
        sha256File(releaseNotesPath) !== manifest.release_notes.sha256
    ) {
        throw new Error('Release notes digest mismatch');
    }
    if (
        canonicalJson(envelope.artifact_subjects) !==
        canonicalJson(expectedSubjects(manifest, manifestPath))
    ) {
        throw new Error('Release envelope subject inventory mismatch');
    }
    return manifest;
}

function npmView(spec, field) {
    const result = spawnSync(
        npmExecutable,
        ['view', spec, field, '--json', `--registry=${registry}`],
        { encoding: 'utf8' }
    );
    if (result.status !== 0) {
        if (`${result.stdout}\n${result.stderr}`.includes('E404')) {
            return null;
        }
        throw new Error(`npm view failed for ${spec} ${field}`);
    }
    return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}

function publicationPlan(manifest, mode, view = npmView) {
    if (!['fresh', 'recovery'].includes(mode)) {
        throw new Error(`Unsupported publication mode: ${mode}`);
    }
    return manifest.packages.map(pkg => {
        const spec = `${pkg.name}@${manifest.version}`;
        const integrity = view(spec, 'dist.integrity');
        if (mode === 'fresh' && integrity) {
            throw new Error(`${spec} already exists on npm`);
        }
        if (mode === 'recovery' && integrity && integrity !== pkg.integrity) {
            throw new Error(
                `${spec} registry integrity does not match recorded tarball`
            );
        }
        return { ...pkg, published: integrity === pkg.integrity };
    });
}

function preflightPackages(manifest, view = npmView) {
    return publicationPlan(manifest, 'fresh', view);
}

function publishPackages(
    manifest,
    artifactDirectory,
    mode = 'fresh',
    view = npmView,
    publish = tarballPath =>
        execFileSync(
            npmExecutable,
            [
                'publish',
                tarballPath,
                '--provenance',
                '--access',
                'public',
                '--tag',
                'next',
                `--registry=${registry}`,
            ],
            { stdio: 'inherit' }
        )
) {
    const plan = publicationPlan(manifest, mode, view);
    plan.filter(pkg => !pkg.published).forEach(pkg => {
        publish(path.join(artifactDirectory, pkg.tarball), pkg);
    });
    return plan.filter(pkg => !pkg.published).map(pkg => pkg.name);
}

function integrityToSha512(integrity) {
    const match = /^sha512-(.+)$/.exec(integrity);
    if (!match) {
        throw new Error(`Unsupported npm integrity: ${integrity}`);
    }
    return Buffer.from(match[1], 'base64').toString('hex');
}

function validateProvenanceStatements(pkg, manifest, statements) {
    const provenance = statements.find(
        statement =>
            statement.predicateType === 'https://slsa.dev/provenance/v1'
    );
    if (!provenance) {
        return false;
    }
    const expectedSubject = `pkg:npm/${pkg.name.replace(/^@/, '%40')}@${
        manifest.version
    }`;
    const subjectMatches = provenance.subject?.some(
        subject =>
            subject.name === expectedSubject &&
            subject.digest?.sha512 === integrityToSha512(pkg.integrity)
    );
    const workflow =
        provenance.predicate?.buildDefinition?.externalParameters?.workflow;
    return Boolean(
        subjectMatches &&
            workflow?.repository === expectedRepository &&
            workflow?.path === expectedCallerWorkflow &&
            workflow?.ref === 'refs/heads/main' &&
            provenance.predicate?.runDetails?.builder?.id ===
                'https://github.com/actions/runner/github-hosted'
    );
}

async function fetchProvenanceStatements(attestations) {
    if (Array.isArray(attestations.statements)) {
        return attestations.statements;
    }
    const response = await fetch(attestations.url);
    if (!response.ok) {
        throw new Error(`Unable to fetch npm attestations: ${response.status}`);
    }
    const body = await response.json();
    return (body.attestations || [])
        .map(attestation => attestation.bundle?.dsseEnvelope?.payload)
        .filter(Boolean)
        .map(payload =>
            JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
        );
}

async function auditPackages(manifest, view = npmView) {
    const failures = [];
    for (const pkg of manifest.packages) {
        const spec = `${pkg.name}@${manifest.version}`;
        const integrity = view(spec, 'dist.integrity');
        const next = view(pkg.name, 'dist-tags.next');
        const attestations = view(spec, 'dist.attestations');
        let provenanceMatches = false;
        if (
            attestations?.url &&
            attestations?.provenance?.predicateType ===
                'https://slsa.dev/provenance/v1'
        ) {
            const statements = await fetchProvenanceStatements(attestations);
            provenanceMatches = validateProvenanceStatements(
                pkg,
                manifest,
                statements
            );
        }
        if (
            integrity !== pkg.integrity ||
            next !== manifest.version ||
            !provenanceMatches
        ) {
            failures.push(pkg.name);
        }
    }
    if (failures.length > 0) {
        throw new Error(
            `npm audit failed for ${failures.length} packages: ${failures.join(
                ', '
            )}`
        );
    }
    return manifest.packages.length;
}

function parseArguments(argv) {
    const [command, ...args] = argv;
    const values = {};
    for (let index = 0; index < args.length; index += 2) {
        if (!args[index].startsWith('--') || args[index + 1] === undefined) {
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

function expectedFrom(values) {
    return {
        artifactDigest: required(values, 'artifact-digest').replace(
            /^sha256:/,
            ''
        ),
        artifactId: Number(required(values, 'artifact-id')),
        artifactCreatedAt: required(values, 'artifact-created-at'),
        artifactExpiresAt: required(values, 'artifact-expires-at'),
        candidateSha: required(values, 'candidate-sha'),
        cycleDeploymentId: Number(required(values, 'cycle-deployment-id')),
        cycleId: required(values, 'cycle-id'),
        deploymentId: Number(required(values, 'deployment-id')),
        manifestSha256: required(values, 'manifest-sha256'),
        repository: required(values, 'repository'),
        runId: Number(required(values, 'run-id')),
        sourceSha: required(values, 'source-sha'),
        version: required(values, 'version'),
        workflowRef: required(values, 'workflow-ref'),
        signerDigest: required(values, 'signer-digest'),
        signerWorkflow: required(values, 'signer-workflow'),
    };
}

async function runCli(argv) {
    const { command, values } = parseArguments(argv);
    if (command === 'create-envelope') {
        createEnvelope({
            actionsArtifacts: [
                {
                    digest: required(values, 'artifact-digest').replace(
                        /^sha256:/,
                        ''
                    ),
                    id: Number(required(values, 'artifact-id')),
                    name: required(values, 'artifact-name'),
                    created_at: required(values, 'artifact-created-at'),
                    expires_at: required(values, 'artifact-expires-at'),
                },
            ],
            attestationSigner: {
                digest: required(values, 'signer-digest'),
                repository: required(values, 'signer-repository'),
                workflow: required(values, 'signer-workflow'),
            },
            callerWorkflow: {
                repository: required(values, 'repository'),
                run_attempt: Number(required(values, 'run-attempt')),
                run_id: Number(required(values, 'run-id')),
                workflow_ref: required(values, 'workflow-ref'),
            },
            candidateSha: required(values, 'candidate-sha'),
            cycleDeploymentId: Number(required(values, 'cycle-deployment-id')),
            cycleId: required(values, 'cycle-id'),
            deploymentId: Number(required(values, 'deployment-id')),
            manifestPath: required(values, 'manifest'),
            outputPath: required(values, 'output'),
        });
        return;
    }

    const manifest = verifyRelease({
        artifactDirectory: required(values, 'artifact-directory'),
        envelopePath: required(values, 'envelope'),
        expected: expectedFrom(values),
        repositoryRoot: required(values, 'repository-root'),
    });
    if (command === 'verify') {
        return;
    }
    if (command === 'preflight') {
        preflightPackages(manifest);
        return;
    }
    if (command === 'publish') {
        publishPackages(
            manifest,
            values['artifact-directory'],
            required(values, 'mode')
        );
        return;
    }
    if (command === 'audit') {
        process.stdout.write(
            `Audited ${await auditPackages(manifest)} packages\n`
        );
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
    auditPackages,
    fetchProvenanceStatements,
    integrityToSha512,
    publicationPlan,
    validateProvenanceStatements,
    createEnvelope,
    expectedSubjects,
    loadCanonicalJson,
    parseArguments,
    preflightPackages,
    publishPackages,
    runCli,
    sha256File,
    verifyRelease,
};
