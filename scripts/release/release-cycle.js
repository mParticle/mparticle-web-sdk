/* eslint-env node, es2021 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { canonicalJson } = require('./candidate-manifest');
const { intentLabel, validateVersionOnlyDiff } = require('./release-intent');
const { parseStableVersion } = require('./version');
const { normalizePaginatedResults } = require('./lifecycle-record');

const gitShaPattern = /^[0-9a-f]{40}$/;
const trustedCreator = 'github-actions[bot]';
const environment = 'v3-release-cycle';
const cycleStates = Object.freeze({
    active: { description: 'v3-cycle:active;schema=1', state: 'in_progress' },
    completed: { description: 'v3-cycle:completed;schema=1', state: 'success' },
});
const sourceUpdatePrefix = 'v3-cycle:source;schema=1;';
const actorPattern = /^(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})|[A-Za-z0-9-]{1,34}\[bot\])$/;

function assertCommitTree(commit, tree, name) {
    assertGitSha(commit?.sha, `${name}_commit_sha`);
    assertGitSha(commit?.commit?.tree?.sha, `${name}_tree_sha`);
    if (
        !tree ||
        tree.sha !== commit.commit.tree.sha ||
        tree.truncated === true ||
        !Array.isArray(tree.tree)
    ) {
        throw new Error(`${name} tree identity is incomplete or invalid`);
    }
    return tree;
}

function versionBlob(tree, contents, expected, name) {
    const entries = tree.tree.filter(entry => entry.path === 'VERSION');
    const bytes = Buffer.from(contents || '', 'utf8');
    const authenticatedBlobSha = crypto
        .createHash('sha1')
        .update(`blob ${bytes.length}\0`)
        .update(bytes)
        .digest('hex');
    if (
        entries.length !== 1 ||
        entries[0].type !== 'blob' ||
        !['100644', '100755'].includes(entries[0].mode) ||
        !gitShaPattern.test(entries[0].sha) ||
        entries[0].sha !== authenticatedBlobSha ||
        contents !== `${expected}\n`
    ) {
        throw new Error(`${name} VERSION blob identity mismatch`);
    }
    return entries[0].sha;
}

function authenticateResultTopology({
    baseCommit,
    baseIsAncestorOfHead,
    headCommit,
    mainCommit,
    mainSha,
    pull,
    baseTree,
    headTree,
    resultTree,
}) {
    assertCommitTree(baseCommit, baseTree, 'base');
    assertCommitTree(headCommit, headTree, 'head');
    assertCommitTree(mainCommit, resultTree, 'result');
    const squash =
        mainCommit.parents?.length === 1 &&
        mainCommit.parents[0].sha === pull.base.sha;
    const merge =
        mainCommit.parents?.length === 2 &&
        mainCommit.parents[0].sha === pull.base.sha &&
        mainCommit.parents[1].sha === pull.head.sha;
    if (
        baseCommit.sha !== pull.base.sha ||
        headCommit.sha !== pull.head.sha ||
        mainCommit.sha !== mainSha ||
        baseIsAncestorOfHead !== true ||
        (!squash && !merge) ||
        resultTree.sha !== headTree.sha
    ) {
        throw new Error('Merged PR commit topology or resulting tree mismatch');
    }
    return squash ? 'squash' : 'merge';
}

function assertGitSha(value, name) {
    if (!gitShaPattern.test(value)) {
        throw new Error(`${name} must be a full lowercase Git SHA`);
    }
    return value;
}

function cycleId({ sourceSha, version }) {
    assertGitSha(sourceSha, 'source_sha');
    parseStableVersion(version);
    return crypto
        .createHash('sha256')
        .update(`mparticle-v3-cycle\0${sourceSha}\0${version}`)
        .digest('hex');
}

function validateMergedIntent({
    baseCommit,
    baseIsAncestorOfHead,
    baseTree,
    baseVersionContents,
    baseVersion,
    changedFiles,
    headCommit,
    headTree,
    headVersionContents,
    mainSha,
    mainCommit,
    pull,
    repository,
    resultTree,
    resultVersionContents,
    version,
}) {
    assertGitSha(mainSha, 'main_sha');
    parseStableVersion(version);
    changedFiles = normalizePaginatedResults(
        changedFiles,
        'Release-intent PR files'
    );
    if (
        !pull ||
        pull.state !== 'closed' ||
        pull.merged !== true ||
        pull.base?.ref !== 'main' ||
        pull.merge_commit_sha !== mainSha ||
        pull.head?.ref !== `release/v3-version-${version}` ||
        pull.head?.repo?.full_name !== repository ||
        pull.user?.login !== 'github-actions[bot]' ||
        pull.user?.type !== 'Bot' ||
        (pull.performed_via_github_app &&
            pull.performed_via_github_app.slug !== 'github-actions') ||
        headCommit.commit?.author?.name !== 'mparticle-automation' ||
        headCommit.commit?.author?.email !== 'developers@mparticle.com' ||
        !pull.labels?.some(label => label.name === intentLabel) ||
        pull.body !==
            [
                '## V3 release intent',
                '',
                `Bump top-level \`VERSION\` from \`${baseVersion}\` to \`${version}\`.`,
                '',
                `<!-- mparticle-v3-release-intent:schema=1;source_sha=${pull.base.sha};version=${version} -->`,
            ].join('\n') ||
        !pull.body.includes(
            `source_sha=${pull.base.sha};version=${version} -->`
        )
    ) {
        throw new Error(
            'Release cycle requires an authenticated merged release-intent PR'
        );
    }
    authenticateResultTopology({
        baseCommit,
        baseIsAncestorOfHead,
        baseTree,
        headCommit,
        headTree,
        mainCommit,
        mainSha,
        pull,
        resultTree,
    });
    versionBlob(baseTree, baseVersionContents, baseVersion, 'Base');
    const headBlob = versionBlob(
        headTree,
        headVersionContents,
        version,
        'Head'
    );
    const resultBlob = versionBlob(
        resultTree,
        resultVersionContents,
        version,
        'Result'
    );
    if (headBlob !== resultBlob) {
        throw new Error('Merged intent VERSION blob differs from PR head');
    }
    validateVersionOnlyDiff(changedFiles, baseVersion, version);
    const { calculateNextVersion } = require('./version');
    if (
        !['patch', 'minor', 'major'].some(
            bump => calculateNextVersion(baseVersion, bump) === version
        )
    ) {
        throw new Error(
            'Release intent VERSION is not an exact supported bump'
        );
    }
    return true;
}

function cyclePayload({ intentPullNumber, sourceSha, version }) {
    if (!Number.isSafeInteger(intentPullNumber) || intentPullNumber <= 0) {
        throw new Error('intent_pull_number must be a positive integer');
    }
    const payload = {
        cycle_id: cycleId({ sourceSha, version }),
        intent_pull_number: intentPullNumber,
        schema_version: 1,
        source_sha: assertGitSha(sourceSha, 'source_sha'),
        version: parseStableVersion(version).version,
    };
    return payload;
}

function logicalCycleState(statuses) {
    statuses = normalizePaginatedResults(
        statuses,
        'Release cycle status history'
    );
    if (statuses.length === 0) {
        throw new Error('Release cycle status history is required');
    }
    const history = [...statuses].reverse().map(status => {
        if (
            status.description?.startsWith(sourceUpdatePrefix) &&
            status.state === 'in_progress' &&
            status.creator?.login === trustedCreator
        ) {
            const match = /^v3-cycle:source;schema=1;sha=([0-9a-f]{40});pr=([1-9][0-9]*);run=([1-9][0-9]*);actor=([A-Za-z0-9[\]-]{1,39})$/.exec(
                status.description
            );
            if (!match) {
                throw new Error(
                    'Release cycle contains an invalid source update'
                );
            }
            return `source:${match[1]}`;
        }
        const state = Object.keys(cycleStates).find(
            name =>
                cycleStates[name].description === status.description &&
                cycleStates[name].state === status.state
        );
        if (!state || status.creator?.login !== trustedCreator) {
            throw new Error('Release cycle contains an untrusted status');
        }
        return state;
    });
    if (
        history[0] !== 'active' ||
        history.slice(1, -1).some(state => !state.startsWith('source:')) ||
        (history.at(-1) !== 'active' &&
            !history.at(-1).startsWith('source:') &&
            history.at(-1) !== 'completed') ||
        history.filter(state => state === 'completed').length > 1
    ) {
        throw new Error('Release cycle status history is out of order');
    }
    return history.at(-1) === 'completed' ? 'completed' : 'active';
}

function effectiveSourceSha(deployment, statuses) {
    logicalCycleState(statuses);
    const history = normalizePaginatedResults(statuses)
        .slice()
        .reverse();
    const updates = history.filter(status =>
        status.description?.startsWith(sourceUpdatePrefix)
    );
    if (updates.length === 0) {
        return deployment.payload.source_sha;
    }
    return updates.at(-1).description.match(/;sha=([0-9a-f]{40});/)[1];
}

function validateCycleDeployment({
    deployment,
    intentPullNumber,
    repository,
    sourceSha,
    statuses,
    version,
    cycleDeploymentId,
    expectedCycleId,
}) {
    const durableSourceSha = deployment?.payload?.source_sha;
    const payload = cyclePayload({
        intentPullNumber,
        sourceSha: durableSourceSha,
        version,
    });
    if (
        !deployment ||
        !Number.isSafeInteger(deployment.id) ||
        deployment.id <= 0 ||
        deployment.environment !== environment ||
        durableSourceSha !== sourceSha ||
        deployment.ref !== durableSourceSha ||
        (cycleDeploymentId !== undefined &&
            deployment.id !== cycleDeploymentId) ||
        (expectedCycleId !== undefined &&
            payload.cycle_id !== expectedCycleId) ||
        deployment.creator?.login !== trustedCreator ||
        deployment.repository_url !==
            `https://api.github.com/repos/${repository}` ||
        canonicalJson(deployment.payload) !== canonicalJson(payload)
    ) {
        throw new Error('Release cycle deployment identity mismatch');
    }
    return {
        cycleId: payload.cycle_id,
        deploymentId: deployment.id,
        effectiveSourceSha: effectiveSourceSha(deployment, statuses),
        state: logicalCycleState(statuses),
    };
}

function planCycleCreation({
    deployments,
    intentPullNumber,
    repository,
    sourceSha,
    statusesByDeployment,
    version,
}) {
    const expected = cyclePayload({ intentPullNumber, sourceSha, version });
    const known = (deployments || []).filter(
        deployment => deployment.environment === environment
    );
    const matching = [];
    for (const deployment of known) {
        if (deployment.payload?.schema_version !== 1) {
            throw new Error('Release cycle has an unrecognized durable schema');
        }
        const statuses = normalizePaginatedResults(
            statusesByDeployment[deployment.id] || [],
            `Release cycle ${deployment.id} status history`
        );
        const exactPayload =
            canonicalJson(deployment.payload) === canonicalJson(expected) &&
            deployment.ref === sourceSha &&
            deployment.creator?.login === trustedCreator &&
            deployment.repository_url ===
                `https://api.github.com/repos/${repository}`;
        if (statuses.length === 0) {
            if (!exactPayload) {
                throw new Error(
                    'Statusless release-cycle record does not match exact identity'
                );
            }
            matching.push(deployment);
            continue;
        }
        const state = logicalCycleState(statuses);
        if (deployment.payload.cycle_id === expected.cycle_id) {
            validateCycleDeployment({
                deployment,
                intentPullNumber,
                repository,
                sourceSha,
                statuses,
                version,
            });
            matching.push(deployment);
        } else if (state === 'active') {
            throw new Error(
                `A different v3 release cycle is active: ${deployment.id}`
            );
        }
    }
    if (matching.length > 1) {
        throw new Error('Duplicate durable release-cycle records detected');
    }
    if (matching.length === 1) {
        const statuses = normalizePaginatedResults(
            statusesByDeployment[matching[0].id] || []
        );
        return {
            cycleId: expected.cycle_id,
            deploymentId: matching[0].id,
            idempotent: statuses.length > 0,
            initialStatusRequired: statuses.length === 0,
            request: null,
        };
    }
    return {
        cycleId: expected.cycle_id,
        deploymentId: null,
        idempotent: false,
        request: {
            auto_merge: false,
            environment,
            payload: expected,
            ref: sourceSha,
            required_contexts: [],
        },
    };
}

function createCycleStatusRequest({ deployment, repository, state, statuses }) {
    const current = logicalCycleState(statuses);
    const targetRepository =
        repository ||
        deployment.repository?.full_name ||
        deployment.repository_url?.replace('https://api.github.com/repos/', '');
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(targetRepository)) {
        throw new Error('Release cycle repository identity is invalid');
    }
    if (!cycleStates[state]) {
        throw new Error(`Unsupported cycle state: ${state}`);
    }
    if (current === state) {
        return { args: [], idempotent: true, logicalState: state };
    }
    if (current !== 'active' || state !== 'completed') {
        throw new Error('Release cycle transition is not allowed');
    }
    return {
        args: [
            'api',
            '--method',
            'POST',
            `repos/${targetRepository}/deployments/${deployment.id}/statuses`,
            '-f',
            `state=${cycleStates[state].state}`,
            '-f',
            `description=${cycleStates[state].description}`,
            '-F',
            'auto_inactive=false',
        ],
        idempotent: false,
        logicalState: state,
    };
}

function createSourceUpdateRequest({
    actor,
    candidateDeployments,
    deployment,
    files,
    headCommit,
    headVersion,
    baseCommit,
    baseIsAncestorOfHead,
    baseTree,
    baseVersionContents,
    headTree,
    headVersionContents,
    mainCommit,
    resultTree,
    resultVersionContents,
    pull,
    repository,
    runId,
    statuses,
}) {
    if (
        !actorPattern.test(actor) ||
        !Number.isSafeInteger(runId) ||
        runId <= 0 ||
        !Array.isArray(candidateDeployments) ||
        !candidateDeployments.every(candidate => {
            const {
                validateHistory,
                validatePayload,
            } = require('./lifecycle-record');
            if (
                candidate.environment !== 'v3-release-lifecycle' ||
                candidate.creator?.login !== trustedCreator ||
                candidate.repository_url !==
                    `https://api.github.com/repos/${repository}` ||
                candidate.payload?.cycle_id !== deployment.payload.cycle_id ||
                candidate.payload?.cycle_deployment_id !== deployment.id ||
                candidate.payload?.version !== deployment.payload.version ||
                candidate.ref !== candidate.payload?.candidate_sha
            ) {
                return false;
            }
            validatePayload(candidate.payload);
            const history = validateHistory(candidate.statuses);
            return history.at(-1) === 'rejected';
        })
    ) {
        throw new Error('Source update actor, run, or ordering is invalid');
    }
    const oldSourceSha = effectiveSourceSha(deployment, statuses);
    const newSourceSha = pull?.merge_commit_sha;
    assertGitSha(newSourceSha, 'release_fix_source_sha');
    const { validateFreezePullRequest } = require('./freeze-policy');
    validateFreezePullRequest({
        activeCycle: deployment,
        baseVersion: deployment.payload.version,
        files,
        headVersion,
        pull: {
            ...pull,
            state: 'open',
            head: { ...pull.head, sha: headCommit.sha },
        },
        requestedBaseSha: oldSourceSha,
        requestedHeadSha: headCommit.sha,
        reviews: pull.reviews,
        baseTree: pull.baseTree,
        baseTreeSha: pull.baseTreeSha,
        headTree: pull.headTree,
        headTreeSha: pull.headTreeSha,
        repository,
    });
    authenticateResultTopology({
        baseCommit,
        baseIsAncestorOfHead,
        baseTree,
        headCommit,
        headTree,
        mainCommit,
        mainSha: newSourceSha,
        pull,
        resultTree,
    });
    const baseBlob = versionBlob(
        baseTree,
        baseVersionContents,
        deployment.payload.version,
        'Base'
    );
    const headBlob = versionBlob(
        headTree,
        headVersionContents,
        deployment.payload.version,
        'Head'
    );
    const resultBlob = versionBlob(
        resultTree,
        resultVersionContents,
        deployment.payload.version,
        'Result'
    );
    if (
        pull.merged !== true ||
        pull.state !== 'closed' ||
        pull.base?.sha !== oldSourceSha ||
        baseBlob !== headBlob ||
        headBlob !== resultBlob ||
        headVersion !== deployment.payload.version ||
        pull.workflow_run?.id !== runId ||
        pull.workflow_run?.actor?.login !== actor ||
        pull.workflow_run?.path !==
            '.github/workflows/v3-release-source-update.yml'
    ) {
        throw new Error('Release-fix source update identity mismatch');
    }
    const description =
        `${sourceUpdatePrefix}sha=${newSourceSha};pr=${pull.number};` +
        `run=${runId};actor=${actor}`;
    if (description.length > 140) {
        throw new Error('Release-fix source update identity is too long');
    }
    return {
        args: [
            'api',
            '--method',
            'POST',
            `repos/${repository}/deployments/${deployment.id}/statuses`,
            '-f',
            `state=in_progress`,
            '-f',
            `description=${description}`,
            '-F',
            'auto_inactive=false',
        ],
        description,
        effectiveSourceSha: newSourceSha,
    };
}

function completeCycle(options, execute = execFileSync) {
    const request = createCycleStatusRequest({
        ...options,
        state: 'completed',
    });
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
    if (command === 'plan-create') {
        const result = planCycleCreation({
            deployments: JSON.parse(
                fs.readFileSync(required(values, 'deployments'), 'utf8')
            ),
            intentPullNumber: Number(required(values, 'intent-pr')),
            repository: required(values, 'repository'),
            sourceSha: required(values, 'source-sha'),
            statusesByDeployment: JSON.parse(
                fs.readFileSync(required(values, 'cycle-statuses'), 'utf8')
            ),
            version: required(values, 'version'),
        });
        fs.writeFileSync(required(values, 'output'), canonicalJson(result));
        return result;
    }
    throw new Error(`Unsupported command: ${command}`);
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
    completeCycle,
    createCycleStatusRequest,
    createSourceUpdateRequest,
    cycleId,
    cyclePayload,
    cycleStates,
    environment,
    effectiveSourceSha,
    logicalCycleState,
    planCycleCreation,
    runCli,
    validateCycleDeployment,
    validateMergedIntent,
};
