/* eslint-env node, es2021 */

const crypto = require('node:crypto');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const { canonicalJson } = require('./candidate-manifest');

const gitShaPattern = /^[0-9a-f]{40}$/;
const sha256Pattern = /^[0-9a-f]{64}$/;
const trustedCreator = 'github-actions[bot]';
const environment = 'v3-release-lifecycle';
const states = Object.freeze({
    prepared: {
        description: 'v3-release:prepared;schema=1',
        state: 'queued',
    },
    awaiting_approval: {
        description: 'v3-release:awaiting_approval;schema=1',
        state: 'pending',
    },
    approved: {
        description: 'v3-release:approved;schema=1',
        state: 'success',
    },
    publishing: {
        description: 'v3-release:publishing;schema=1',
        state: 'in_progress',
    },
    published: {
        description: 'v3-release:published;schema=1',
        state: 'success',
    },
    promoted: {
        description: 'v3-release:promoted;schema=1',
        state: 'success',
    },
    rejected: {
        description: 'v3-release:rejected;schema=1',
        state: 'failure',
    },
});
const orderedStates = Object.freeze([
    'prepared',
    'awaiting_approval',
    'approved',
    'publishing',
    'published',
    'promoted',
]);
const rejectionReasonPattern = /^[A-Za-z0-9][A-Za-z0-9 ._:/-]{0,63}$/;
const actorPattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;

function normalizePaginatedResults(value, name = 'GitHub API history') {
    if (!Array.isArray(value)) {
        throw new Error(`${name} is required`);
    }
    const normalized = value.flatMap(page => {
        if (!Array.isArray(page)) {
            return [page];
        }
        return page;
    });
    if (normalized.some(entry => !entry || typeof entry !== 'object')) {
        throw new Error(`${name} contains an invalid entry`);
    }
    return normalized;
}

function lifecyclePayload(identity) {
    const payload = {
        actions_artifacts: identity.actionsArtifacts,
        caller_workflow: identity.callerWorkflow,
        candidate_sha: identity.candidateSha,
        cycle_deployment_id: identity.cycleDeploymentId,
        cycle_id: identity.cycleId,
        manifest_sha256: identity.manifestSha256,
        originating_run: identity.originatingRun,
        schema_version: 1,
        signer_workflow: identity.signerWorkflow,
        source_sha: identity.sourceSha,
        stable_tag: `v${identity.version}`,
        version: identity.version,
    };
    validatePayload(payload);
    return payload;
}

function validatePayload(payload) {
    if (
        !payload ||
        payload.schema_version !== 1 ||
        !gitShaPattern.test(payload.source_sha) ||
        !gitShaPattern.test(payload.candidate_sha) ||
        !sha256Pattern.test(payload.cycle_id) ||
        !Number.isSafeInteger(payload.cycle_deployment_id) ||
        payload.cycle_deployment_id <= 0 ||
        !sha256Pattern.test(payload.manifest_sha256) ||
        payload.stable_tag !== `v${payload.version}` ||
        (() => {
            try {
                require('./version').parseStableVersion(payload.version);
                return false;
            } catch {
                return true;
            }
        })() ||
        !Array.isArray(payload.actions_artifacts) ||
        payload.actions_artifacts.length === 0 ||
        !payload.actions_artifacts.every(
            artifact =>
                Number.isSafeInteger(artifact.id) &&
                artifact.id > 0 &&
                sha256Pattern.test(artifact.digest)
        ) ||
        payload.originating_run?.repository !==
            payload.caller_workflow?.repository ||
        payload.originating_run?.workflow_ref !==
            payload.caller_workflow?.workflow_ref ||
        payload.originating_run?.run_id !== payload.caller_workflow?.run_id ||
        !Number.isSafeInteger(payload.originating_run?.run_id) ||
        payload.originating_run.run_id <= 0 ||
        typeof payload.signer_workflow?.workflow !== 'string' ||
        payload.signer_workflow.digest !== payload.source_sha
    ) {
        throw new Error('Invalid lifecycle payload');
    }
    return payload;
}

function createDeploymentRequest({ identity, repository }) {
    const payload = lifecyclePayload(identity);
    return {
        args: [
            'api',
            '--method',
            'POST',
            `repos/${repository}/deployments`,
            '-f',
            `ref=${identity.candidateSha}`,
            '-f',
            `environment=${environment}`,
            '-F',
            'auto_merge=false',
            '-f',
            'required_contexts[]',
            '-f',
            `payload=${canonicalJson(payload).trimEnd()}`,
        ],
        payload,
    };
}

function logicalStatuses(statuses) {
    statuses = normalizePaginatedResults(statuses, 'Lifecycle status history');
    return [...statuses].reverse().map(status => {
        const logicalState = Object.keys(states).find(
            name =>
                (states[name].description === status.description ||
                    (name === 'rejected' &&
                        status.description?.startsWith(
                            'v3-release:rejected;schema=2;'
                        ))) &&
                states[name].state === status.state
        );
        if (!logicalState) {
            throw new Error('Lifecycle contains an unrecognized status');
        }
        if (status.creator?.login !== trustedCreator) {
            throw new Error('Lifecycle status creator is not GitHub Actions');
        }
        return logicalState;
    });
}

function rejectionDescription({ actor, reason, runId }) {
    if (
        !actorPattern.test(actor) ||
        !rejectionReasonPattern.test(reason) ||
        !Number.isSafeInteger(runId) ||
        runId <= 0
    ) {
        throw new Error('Invalid lifecycle rejection audit identity');
    }
    const description =
        `v3-release:rejected;schema=2;actor=${actor};run=${runId};` +
        `reason=${reason}`;
    if (description.length > 140) {
        throw new Error('Lifecycle rejection audit identity is too long');
    }
    return description;
}

function createRejectionStatusRequest({
    actor,
    candidateSha,
    cycleDeploymentId,
    cycleId,
    deployment,
    manifestSha256,
    reason,
    repository,
    runId,
    statuses,
    stableTagAbsent,
    npmPublicationAbsent,
    version,
}) {
    const identity = {
        ...deployment.payload,
        actionsArtifacts: deployment.payload?.actions_artifacts,
        callerWorkflow: deployment.payload?.caller_workflow,
        candidateSha,
        cycleDeploymentId,
        cycleId,
        manifestSha256,
        originatingRun: deployment.payload?.originating_run,
        signerWorkflow: deployment.payload?.signer_workflow,
        sourceSha: deployment.payload?.source_sha,
        version,
    };
    const history = validateDeployment({
        deployment,
        identity,
        repository,
        statuses,
    });
    const description = rejectionDescription({ actor, reason, runId });
    statuses = normalizePaginatedResults(statuses, 'Lifecycle status history');
    const latest = statuses[0];
    if (history.at(-1) === 'rejected') {
        if (
            latest?.description === description &&
            latest?.state === states.rejected.state
        ) {
            return {
                args: [],
                deploymentId: deployment.id,
                idempotent: true,
                logicalState: 'rejected',
            };
        }
        throw new Error('Lifecycle candidate was already rejected');
    }
    if (
        history.length !== 2 ||
        history[0] !== 'prepared' ||
        history[1] !== 'awaiting_approval' ||
        stableTagAbsent !== true ||
        npmPublicationAbsent !== true
    ) {
        throw new Error(
            'Lifecycle rejection requires awaiting_approval state and authenticated absence of tag and publication'
        );
    }
    return {
        args: [
            'api',
            '--method',
            'POST',
            `repos/${repository}/deployments/${deployment.id}/statuses`,
            '-f',
            `state=${states.rejected.state}`,
            '-f',
            `description=${description}`,
            '-F',
            'auto_inactive=false',
        ],
        deploymentId: deployment.id,
        idempotent: false,
        logicalState: 'rejected',
    };
}

function appendRejectionStatus(options, execute = execFileSync) {
    const request = createRejectionStatusRequest(options);
    if (!request.idempotent) {
        execute('gh', request.args, { stdio: 'inherit' });
    }
    return request;
}

function authenticateRejectionAbsence(
    { manifestPath, manifestSha256, repository, version },
    execute = spawnSync
) {
    const manifestBytes = fs.readFileSync(manifestPath);
    if (
        crypto
            .createHash('sha256')
            .update(manifestBytes)
            .digest('hex') !== manifestSha256
    ) {
        throw new Error('Rejection manifest digest mismatch');
    }
    const manifest = JSON.parse(manifestBytes);
    if (manifest.version !== version) {
        throw new Error('Rejection manifest version mismatch');
    }
    const tag = execute(
        'gh',
        ['api', `repos/${repository}/git/ref/tags/v${version}`],
        { encoding: 'utf8' }
    );
    if (tag.status === 0) {
        throw new Error('Stable tag exists; rejection is no longer allowed');
    }
    if (!`${tag.stdout}\n${tag.stderr}`.includes('404')) {
        throw new Error('Unable to authenticate stable tag absence');
    }
    require('./exact-release').preflightPackages(manifest);
    return { npmPublicationAbsent: true, stableTagAbsent: true };
}

function validateHistory(statuses) {
    const history = logicalStatuses(statuses);
    const rejectedIndex = history.indexOf('rejected');
    if (rejectedIndex !== -1) {
        if (
            history.length !== 3 ||
            history[0] !== 'prepared' ||
            history[1] !== 'awaiting_approval' ||
            rejectedIndex !== 2
        ) {
            throw new Error('Lifecycle rejection history is out of order');
        }
        return history;
    }
    history.forEach((state, index) => {
        if (state !== orderedStates[index]) {
            throw new Error('Lifecycle status history is out of order');
        }
    });
    return history;
}

function validateDeployment({ deployment, identity, repository, statuses }) {
    const expectedPayload = lifecyclePayload(identity);
    if (
        !deployment ||
        !Number.isSafeInteger(deployment.id) ||
        deployment.id <= 0 ||
        deployment.ref !== identity.candidateSha ||
        deployment.environment !== environment ||
        deployment.creator?.login !== trustedCreator ||
        deployment.repository_url !==
            `https://api.github.com/repos/${repository}` ||
        canonicalJson(deployment.payload) !== canonicalJson(expectedPayload)
    ) {
        throw new Error(
            'Lifecycle deployment does not match exact release identity'
        );
    }
    return validateHistory(statuses);
}

function authorizeCandidateOperation({
    candidateDeployments,
    cycleDeploymentId,
    cycleId,
    mode,
    recoveryCandidateSha,
    recoveryDeploymentId,
    repository,
    sourceSha,
    version,
}) {
    if (
        !Array.isArray(candidateDeployments) ||
        !Number.isSafeInteger(cycleDeploymentId) ||
        cycleDeploymentId <= 0 ||
        !sha256Pattern.test(cycleId) ||
        !['fresh', 'recovery'].includes(mode) ||
        !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) ||
        !gitShaPattern.test(sourceSha)
    ) {
        throw new Error('Invalid candidate operation authorization');
    }
    require('./version').parseStableVersion(version);
    const cycleCandidates = candidateDeployments.filter(candidate => {
        return (
            candidate?.payload?.cycle_id === cycleId ||
            candidate?.payload?.cycle_deployment_id === cycleDeploymentId
        );
    });
    const authenticated = cycleCandidates.map(candidate => {
        validatePayload(candidate.payload);
        if (
            !Number.isSafeInteger(candidate.id) ||
            candidate.id <= 0 ||
            candidate.environment !== environment ||
            candidate.creator?.login !== trustedCreator ||
            candidate.repository_url !==
                `https://api.github.com/repos/${repository}` ||
            candidate.payload.cycle_id !== cycleId ||
            candidate.payload.cycle_deployment_id !== cycleDeploymentId ||
            candidate.payload.source_sha !== sourceSha ||
            candidate.payload.version !== version ||
            candidate.ref !== candidate.payload.candidate_sha
        ) {
            throw new Error(
                'Candidate deployment does not match exact active cycle'
            );
        }
        return {
            candidate,
            history: validateHistory(candidate.statuses),
        };
    });
    if (mode === 'fresh') {
        if (
            authenticated.some(({ history }) => history.at(-1) !== 'rejected')
        ) {
            throw new Error(
                'Fresh candidate requires every prior candidate to be rejected'
            );
        }
        return { candidateCount: authenticated.length, mode };
    }
    if (
        !Number.isSafeInteger(recoveryDeploymentId) ||
        recoveryDeploymentId <= 0 ||
        !gitShaPattern.test(recoveryCandidateSha)
    ) {
        throw new Error('Invalid recovery candidate authorization');
    }
    const recovery = authenticated.filter(
        ({ candidate }) =>
            candidate.id === recoveryDeploymentId &&
            candidate.ref === recoveryCandidateSha
    );
    if (
        recovery.length !== 1 ||
        !['approved', 'publishing', 'published'].includes(
            recovery[0].history.at(-1)
        )
    ) {
        throw new Error('Recovery requires the exact recorded candidate');
    }
    return {
        candidateCount: authenticated.length,
        deploymentId: recoveryDeploymentId,
        mode,
    };
}

function createLifecycleStatusRequest({
    candidateSha,
    deployment,
    manifestSha256,
    repository,
    state,
    statuses,
    cycleDeploymentId,
    cycleId,
    version,
}) {
    const identity = {
        ...deployment.payload,
        actionsArtifacts: deployment.payload?.actions_artifacts,
        callerWorkflow: deployment.payload?.caller_workflow,
        candidateSha,
        cycleDeploymentId,
        cycleId,
        manifestSha256,
        originatingRun: deployment.payload?.originating_run,
        signerWorkflow: deployment.payload?.signer_workflow,
        sourceSha: deployment.payload?.source_sha,
        version,
    };
    const history = validateDeployment({
        deployment,
        identity,
        repository,
        statuses,
    });
    const predecessorIndex = orderedStates.indexOf(state) - 1;
    if (history[history.length - 1] === state) {
        return {
            args: [],
            deploymentId: deployment.id,
            idempotent: true,
            logicalState: state,
        };
    }
    if (
        !states[state] ||
        state === 'rejected' ||
        !gitShaPattern.test(candidateSha) ||
        !/^[0-9a-f]{64}$/.test(manifestSha256) ||
        !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) ||
        (() => {
            try {
                require('./version').parseStableVersion(version);
                return false;
            } catch {
                return true;
            }
        })() ||
        !deployment ||
        !Number.isSafeInteger(deployment.id) ||
        deployment.id <= 0 ||
        history.includes('rejected') ||
        history.length !== predecessorIndex + 1 ||
        (predecessorIndex >= 0 &&
            history[history.length - 1] !== orderedStates[predecessorIndex])
    ) {
        throw new Error(
            'Lifecycle deployment does not match exact release identity'
        );
    }
    return {
        args: [
            'api',
            '--method',
            'POST',
            `repos/${repository}/deployments/${deployment.id}/statuses`,
            '-f',
            `state=${states[state].state}`,
            '-f',
            `description=${states[state].description}`,
            '-F',
            'auto_inactive=false',
        ],
        deploymentId: deployment.id,
        idempotent: false,
        logicalState: state,
    };
}

function appendLifecycleStatus(options, execute = execFileSync) {
    const request = createLifecycleStatusRequest(options);
    if (!request.idempotent) {
        execute('gh', request.args, { stdio: 'inherit' });
    }
    return request;
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

function runCli(argv) {
    const { command, values } = parseArguments(argv);
    if (!['append', 'authorize-candidate', 'reject'].includes(command)) {
        throw new Error(`Unsupported command: ${command}`);
    }
    if (command === 'authorize-candidate') {
        return authorizeCandidateOperation({
            candidateDeployments: JSON.parse(
                fs.readFileSync(required(values, 'deployments'), 'utf8')
            ),
            cycleDeploymentId: Number(required(values, 'cycle-deployment-id')),
            cycleId: required(values, 'cycle-id'),
            mode: required(values, 'mode'),
            recoveryCandidateSha: values['recovery-candidate-sha'],
            recoveryDeploymentId: values['recovery-deployment-id']
                ? Number(values['recovery-deployment-id'])
                : undefined,
            repository: required(values, 'repository'),
            sourceSha: required(values, 'source-sha'),
            version: required(values, 'version'),
        });
    }
    const options = {
        candidateSha: required(values, 'candidate-sha'),
        deployment: JSON.parse(
            fs.readFileSync(required(values, 'deployment'), 'utf8')
        ),
        manifestSha256: required(values, 'manifest-sha256'),
        repository: required(values, 'repository'),
        cycleDeploymentId: Number(required(values, 'cycle-deployment-id')),
        cycleId: required(values, 'cycle-id'),
        statuses: JSON.parse(
            fs.readFileSync(required(values, 'statuses'), 'utf8')
        ),
        version: required(values, 'version'),
    };
    if (command === 'reject') {
        const absence = authenticateRejectionAbsence({
            manifestPath: required(values, 'manifest'),
            manifestSha256: options.manifestSha256,
            repository: options.repository,
            version: options.version,
        });
        return appendRejectionStatus({
            ...options,
            actor: required(values, 'actor'),
            reason: required(values, 'reason'),
            runId: Number(required(values, 'run-id')),
            ...absence,
        });
    }
    return appendLifecycleStatus({
        ...options,
        state: required(values, 'state'),
    });
}

if (require.main === module) {
    try {
        runCli(process.argv.slice(2));
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

module.exports = {
    authorizeCandidateOperation,
    appendRejectionStatus,
    authenticateRejectionAbsence,
    appendLifecycleStatus,
    createDeploymentRequest,
    createLifecycleStatusRequest,
    createRejectionStatusRequest,
    environment,
    lifecyclePayload,
    logicalStatuses,
    normalizePaginatedResults,
    rejectionDescription,
    runCli,
    states,
    trustedCreator,
    validateDeployment,
    validateHistory,
    validatePayload,
};
