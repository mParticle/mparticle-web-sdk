/* eslint-env node, es2021 */

const { parseStableVersion } = require('./version');

const gitShaPattern = /^[0-9a-f]{40}$/;
const releaseFixLabel = 'v3-release-fix';
const releaseFixIdentity = '<!-- mparticle-v3-release-fix:schema=1 -->';
const allowedPatterns = [
    /^src\/.+/,
    /^test\/.+/,
    /^kits\/[^/]+\/src\/.+/,
    /^kits\/[^/]+\/test\/.+/,
    /^kits\/[^/]+\/tests\/.+/,
];
const deniedPatterns = [
    /^VERSION$/,
    /^dist(?:\/|$)/,
    /^\.release(?:\/|$)/,
    /^\.github\/workflows(?:\/|$)/,
    /^scripts\/release(?:\/|$)/,
    /(?:^|\/)package(?:-lock)?\.json$/,
    /(?:^|\/)(?:npm-shrinkwrap|yarn\.lock|pnpm-lock\.yaml)$/,
    /(?:^|\/)dist(?:\/|$)/,
];

function assertGitSha(value, name) {
    if (!gitShaPattern.test(value)) {
        throw new Error(`${name} must be a full lowercase Git SHA`);
    }
}

function assertReleaseFixPaths(files) {
    if (!Array.isArray(files) || files.length === 0) {
        throw new Error('Release-fix PR must change at least one file');
    }
    for (const file of files) {
        if (
            !['added', 'modified', 'removed', 'renamed'].includes(file?.status)
        ) {
            throw new Error(
                `Release-fix file status is not allowed: ${file?.status}`
            );
        }
        const paths = [file.filename];
        if (file.status === 'renamed') {
            paths.push(file.previous_filename);
        } else if (file.previous_filename !== undefined) {
            throw new Error('Release-fix previous_filename is unsafe');
        }
        for (const filename of paths) {
            if (
                typeof filename !== 'string' ||
                deniedPatterns.some(pattern => pattern.test(filename)) ||
                !allowedPatterns.some(pattern => pattern.test(filename))
            ) {
                throw new Error(`Release-fix path is not allowed: ${filename}`);
            }
        }
    }
    return true;
}

function treeEntries(tree, name) {
    if (
        !tree ||
        tree.truncated === true ||
        !gitShaPattern.test(tree.sha) ||
        !Array.isArray(tree.tree)
    ) {
        throw new Error(`${name} Git tree is incomplete or unauthenticated`);
    }
    return new Map(tree.tree.map(entry => [entry.path, entry]));
}

function assertRegularBlob(entry, path) {
    if (
        !entry ||
        entry.type !== 'blob' ||
        !['100644', '100755'].includes(entry.mode) ||
        !gitShaPattern.test(entry.sha)
    ) {
        throw new Error(`Release-fix path is not a regular blob: ${path}`);
    }
}

function validateChangedFileTrees(
    files,
    baseTree,
    headTree,
    expectedBaseTreeSha,
    expectedHeadTreeSha
) {
    const base = treeEntries(baseTree, 'Base');
    const head = treeEntries(headTree, 'Head');
    if (
        baseTree.sha !== expectedBaseTreeSha ||
        headTree.sha !== expectedHeadTreeSha
    ) {
        throw new Error('Release-fix Git tree identity mismatch');
    }
    for (const file of files) {
        if (file.status === 'added') {
            assertRegularBlob(head.get(file.filename), file.filename);
            if (base.has(file.filename)) {
                throw new Error(`Added path already exists: ${file.filename}`);
            }
        } else if (file.status === 'removed') {
            assertRegularBlob(base.get(file.filename), file.filename);
            if (head.has(file.filename)) {
                throw new Error(`Removed path still exists: ${file.filename}`);
            }
        } else if (file.status === 'renamed') {
            assertRegularBlob(
                base.get(file.previous_filename),
                file.previous_filename
            );
            assertRegularBlob(head.get(file.filename), file.filename);
            if (head.has(file.previous_filename) || base.has(file.filename)) {
                throw new Error('Release-fix rename tree identity is unsafe');
            }
        } else {
            assertRegularBlob(base.get(file.filename), file.filename);
            assertRegularBlob(head.get(file.filename), file.filename);
        }
    }
    return true;
}

function hasExactApproval(reviews, headSha) {
    const latestByReviewer = new Map();
    for (const review of reviews || []) {
        if (
            review?.user?.login &&
            review.commit_id === headSha &&
            ['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(
                review.state
            )
        ) {
            latestByReviewer.set(review.user.login, review.state);
        }
    }
    return Array.from(latestByReviewer.values()).some(
        state => state === 'APPROVED'
    );
}

function validateFreezePullRequest({
    activeCycle,
    baseVersion,
    files,
    headVersion,
    pull,
    requestedBaseSha,
    requestedHeadSha,
    reviews,
    baseTree,
    baseTreeSha,
    headTree,
    headTreeSha,
    repository,
}) {
    assertGitSha(requestedBaseSha, 'base_sha');
    assertGitSha(requestedHeadSha, 'head_sha');
    if (!activeCycle) {
        return { allowed: true, reason: 'no-active-cycle', type: 'normal' };
    }
    if (
        !pull ||
        pull.state !== 'open' ||
        pull.base?.ref !== 'main' ||
        pull.base?.sha !== requestedBaseSha ||
        pull.head?.sha !== requestedHeadSha ||
        pull.base?.repo?.full_name !== repository ||
        pull.head?.repo?.full_name !== repository
    ) {
        throw new Error(
            'Pull request base/head identity is stale, forked, or invalid'
        );
    }
    const isReleaseFix =
        pull.labels?.some(label => label.name === releaseFixLabel) &&
        pull.body?.includes(releaseFixIdentity);
    if (!isReleaseFix) {
        throw new Error('Normal PR merges are blocked during an active cycle');
    }
    if (!hasExactApproval(reviews, requestedHeadSha)) {
        throw new Error(
            'Release-fix PR requires approval of the exact head commit'
        );
    }
    const before = parseStableVersion(baseVersion).version;
    const after = parseStableVersion(headVersion).version;
    if (before !== after) {
        throw new Error('Release-fix PR must leave VERSION unchanged');
    }
    assertReleaseFixPaths(files);
    validateChangedFileTrees(
        files,
        baseTree,
        headTree,
        baseTreeSha,
        headTreeSha
    );
    return {
        allowed: true,
        reason: 'reviewed-release-fix',
        type: 'release-fix',
    };
}

module.exports = {
    allowedPatterns,
    assertReleaseFixPaths,
    deniedPatterns,
    hasExactApproval,
    releaseFixIdentity,
    releaseFixLabel,
    validateChangedFileTrees,
    validateFreezePullRequest,
};
