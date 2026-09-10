/* eslint-env node, es2021 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { calculateNextVersion, parseStableVersion } = require('./version');

const gitShaPattern = /^[0-9a-f]{40}$/;
const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const intentLabel = 'v3-release-intent';
const identityPrefix = '<!-- mparticle-v3-release-intent:';

function assertGitSha(value, name) {
    if (!gitShaPattern.test(value)) {
        throw new Error(`${name} must be a full lowercase Git SHA`);
    }
    return value;
}

function intentIdentity({ sourceSha, targetVersion }) {
    assertGitSha(sourceSha, 'source_sha');
    parseStableVersion(targetVersion);
    return `${identityPrefix}schema=1;source_sha=${sourceSha};version=${targetVersion} -->`;
}

function isIntentPullRequest(pull) {
    return Boolean(
        pull &&
            pull.state === 'open' &&
            pull.base?.ref === 'main' &&
            pull.labels?.some(label => label.name === intentLabel) &&
            typeof pull.body === 'string' &&
            pull.body.includes(identityPrefix)
    );
}

function authenticateExistingIntentPull(pull, plan) {
    if (
        !isIntentPullRequest(pull) ||
        pull.base?.sha !== plan.sourceSha ||
        pull.head?.ref !== plan.branch ||
        pull.head?.repo?.full_name !== pull.base?.repo?.full_name ||
        pull.user?.login !== 'github-actions[bot]' ||
        pull.body !== plan.body ||
        pull.title !== plan.title
    ) {
        throw new Error('Existing release-intent PR identity mismatch');
    }
    return pull;
}

function activeCycles(deployments, statusesByDeployment) {
    return (deployments || []).filter(deployment => {
        if (deployment?.environment !== 'v3-release-cycle') {
            return false;
        }
        if (deployment?.payload?.schema_version !== 1) {
            throw new Error('Release cycle has an unrecognized durable schema');
        }
        const rawStatuses = statusesByDeployment[deployment.id];
        const statuses = Array.isArray(rawStatuses)
            ? rawStatuses.flat()
            : rawStatuses;
        if (!Array.isArray(statuses) || statuses.length === 0) {
            throw new Error(
                `Release cycle ${deployment.id} has no authenticated status`
            );
        }
        const { logicalCycleState } = require('./release-cycle');
        return logicalCycleState(statuses) === 'active';
    });
}

function createIntentPlan({
    activeDeployments = [],
    bump,
    currentVersion,
    mainSha,
    openPulls = [],
    statusesByDeployment = {},
}) {
    assertGitSha(mainSha, 'main_sha');
    parseStableVersion(currentVersion);
    const cycles = activeCycles(activeDeployments, statusesByDeployment);
    if (cycles.length > 0) {
        throw new Error(
            `A v3 release cycle is already active: ${cycles
                .map(cycle => cycle.id)
                .join(', ')}`
        );
    }
    const targetVersion = calculateNextVersion(currentVersion, bump);
    const branch = `release/v3-version-${targetVersion}`;
    const plan = {
        body: [
            '## V3 release intent',
            '',
            `Bump top-level \`VERSION\` from \`${currentVersion}\` to \`${targetVersion}\`.`,
            '',
            intentIdentity({ sourceSha: mainSha, targetVersion }),
        ].join('\n'),
        branch,
        commitMessage: `chore(release): set version to ${targetVersion}`,
        currentVersion,
        label: intentLabel,
        pushArguments: [
            'push',
            `--force-with-lease=refs/heads/${branch}:`,
            'origin',
            `HEAD:refs/heads/${branch}`,
        ],
        sourceSha: mainSha,
        targetVersion,
        title: `chore(release): set version to ${targetVersion}`,
    };
    const intents = openPulls.filter(isIntentPullRequest);
    const exact = intents.filter(
        pull =>
            pull.head?.ref === branch &&
            pull.base?.sha === mainSha &&
            pull.body === plan.body
    );
    if (exact.length === 1 && intents.length === 1) {
        authenticateExistingIntentPull(exact[0], plan);
        return {
            ...plan,
            existingPullNumber: exact[0].number,
            idempotent: true,
        };
    }
    if (intents.length > 0) {
        throw new Error(
            `A distinct or mismatched VERSION release-intent PR already exists: ${intents
                .map(pull => `#${pull.number}`)
                .join(', ')}`
        );
    }
    return { ...plan, existingPullNumber: null, idempotent: false };
}

function validateVersionOnlyDiff(changedFiles, oldVersion, newVersion) {
    parseStableVersion(oldVersion);
    parseStableVersion(newVersion);
    if (
        !Array.isArray(changedFiles) ||
        changedFiles.length !== 1 ||
        changedFiles[0]?.filename !== 'VERSION' ||
        changedFiles[0]?.status !== 'modified' ||
        changedFiles[0]?.additions !== 1 ||
        changedFiles[0]?.deletions !== 1 ||
        changedFiles[0]?.changes !== 2
    ) {
        throw new Error('Release intent must be an exact VERSION-only patch');
    }
    if (oldVersion === newVersion) {
        throw new Error('Release intent VERSION must change');
    }
    return true;
}

function deterministicIntentKey({ sourceSha, targetVersion }) {
    return crypto
        .createHash('sha256')
        .update(intentIdentity({ sourceSha, targetVersion }))
        .digest('hex');
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

function runCli(argv, execute = execFileSync) {
    const { command, values } = parseArguments(argv);
    if (command !== 'create') {
        throw new Error(`Unsupported command: ${command}`);
    }
    const repository = required(values, 'repository');
    if (!repositoryPattern.test(repository)) {
        throw new Error('Invalid repository');
    }
    const openPulls = JSON.parse(
        fs.readFileSync(required(values, 'open-pulls'), 'utf8')
    );
    const deployments = JSON.parse(
        fs.readFileSync(required(values, 'deployments'), 'utf8')
    );
    const statusesByDeployment = JSON.parse(
        fs.readFileSync(required(values, 'cycle-statuses'), 'utf8')
    );
    const plan = createIntentPlan({
        activeDeployments: deployments,
        bump: required(values, 'bump'),
        currentVersion: required(values, 'current-version'),
        mainSha: required(values, 'main-sha'),
        openPulls,
        statusesByDeployment,
    });
    fs.writeFileSync(required(values, 'output'), JSON.stringify(plan));
    if (values.push === 'true') {
        execute('git', plan.pushArguments, { stdio: 'inherit' });
    }
    return plan;
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
    activeCycles,
    authenticateExistingIntentPull,
    createIntentPlan,
    deterministicIntentKey,
    intentIdentity,
    intentLabel,
    isIntentPullRequest,
    runCli,
    validateVersionOnlyDiff,
};
