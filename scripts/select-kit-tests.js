/* eslint-env node, es2021 */

const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..');
const defaultMatrixPath = path.join(repositoryRoot, 'kits', 'matrix.json');
const noOpEntry = {
    name: 'No kit tests required',
    local_path: '',
    noop: true,
};
const fullMatrixPaths = new Set([
    '.babelrc',
    '.eslintrc',
    '.prettierignore',
    '.prettierrc',
    'jest.config.js',
    'kits/matrix.json',
    'npm-shrinkwrap.json',
    'package-lock.json',
    'package.json',
    'pnpm-lock.yaml',
    'release.config.js',
    'rollup.config.js',
    'rollup.test.config.js',
    'tsconfig.json',
    'tsconfig.types.json',
    'yarn.lock',
]);
const fullMatrixPrefixes = ['.github/workflows/', 'scripts/', 'src/', 'test/'];
const documentationExtensions = new Set(['.md', '.mdx']);
const documentationFiles = new Set([
    'AGENTS.md',
    'ARCHITECTURE.md',
    'CHANGELOG.md',
    'CONTRIBUTING.md',
    'LICENSE',
    'README.md',
]);
const fullShaPattern = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/i;

function normalizeRepositoryPath(filePath) {
    if (typeof filePath !== 'string' || filePath.length === 0) {
        throw new Error('Changed paths must be non-empty strings');
    }

    const normalized = filePath.replace(/\\/g, '/').replace(/^\.\//, '');
    if (
        normalized.startsWith('/') ||
        normalized.includes('\0') ||
        normalized.split('/').includes('..')
    ) {
        throw new Error(`Invalid repository path: ${filePath}`);
    }
    return normalized;
}

function validateMatrix(entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
        throw new Error('kits/matrix.json must be a non-empty array');
    }

    const names = new Set();
    const localPaths = new Set();
    const validatedEntries = entries
        .map((entry, index) => {
            if (
                !entry ||
                typeof entry !== 'object' ||
                Array.isArray(entry) ||
                typeof entry.name !== 'string' ||
                entry.name.trim() === '' ||
                typeof entry.local_path !== 'string'
            ) {
                throw new Error(
                    `kits/matrix.json entry ${index} requires name and local_path`
                );
            }

            const localPath = normalizeRepositoryPath(entry.local_path);
            if (
                !localPath.startsWith('kits/') ||
                localPath === 'kits/' ||
                localPath.endsWith('/') ||
                !/^kits\/[A-Za-z0-9._/-]+$/.test(localPath)
            ) {
                throw new Error(
                    `Invalid kit local_path in kits/matrix.json: ${entry.local_path}`
                );
            }
            if (names.has(entry.name)) {
                throw new Error(
                    `Duplicate kit name in kits/matrix.json: ${entry.name}`
                );
            }
            if (localPaths.has(localPath)) {
                throw new Error(
                    `Duplicate kit local_path in kits/matrix.json: ${localPath}`
                );
            }

            names.add(entry.name);
            localPaths.add(localPath);
            return {
                ...entry,
                local_path: localPath,
                noop: false,
            };
        })
        .sort(
            (left, right) =>
                left.local_path.localeCompare(right.local_path) ||
                left.name.localeCompare(right.name)
        );

    for (let index = 0; index < validatedEntries.length; index++) {
        const parent = validatedEntries[index];
        for (
            let childIndex = index + 1;
            childIndex < validatedEntries.length;
            childIndex++
        ) {
            const child = validatedEntries[childIndex];
            if (child.local_path.startsWith(`${parent.local_path}/`)) {
                throw new Error(
                    `Overlapping kit local_path entries: ${parent.local_path} and ${child.local_path}`
                );
            }
        }
    }

    return validatedEntries;
}

function loadMatrix(matrixPath = defaultMatrixPath) {
    let entries;
    try {
        entries = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
    } catch (error) {
        throw new Error(`Unable to load kits/matrix.json: ${error.message}`, {
            cause: error,
        });
    }
    return validateMatrix(entries);
}

function isDocumentationPath(filePath) {
    return (
        documentationFiles.has(filePath) ||
        filePath.startsWith('docs/') ||
        filePath.startsWith('.github/images/') ||
        documentationExtensions.has(path.posix.extname(filePath).toLowerCase())
    );
}

function requiresFullMatrix(filePath) {
    return (
        fullMatrixPaths.has(filePath) ||
        fullMatrixPrefixes.some(prefix => filePath.startsWith(prefix))
    );
}

function selectKitMatrix(entries, changedPaths) {
    const matrix = validateMatrix(entries);
    if (!Array.isArray(changedPaths)) {
        throw new Error('Changed paths must be an array');
    }

    const normalizedPaths = Array.from(
        new Set(changedPaths.map(normalizeRepositoryPath))
    ).sort();
    const selectedPaths = new Set();
    let fullMatrixReason = null;

    for (const changedPath of normalizedPaths) {
        if (requiresFullMatrix(changedPath)) {
            fullMatrixReason = `shared-impact path changed: ${changedPath}`;
            break;
        }

        const matchingEntry = matrix.find(
            entry =>
                changedPath === entry.local_path ||
                changedPath.startsWith(`${entry.local_path}/`)
        );
        if (matchingEntry) {
            selectedPaths.add(matchingEntry.local_path);
            continue;
        }

        if (changedPath.startsWith('kits/')) {
            fullMatrixReason = `unknown kit path changed: ${changedPath}`;
            break;
        }
        if (!isDocumentationPath(changedPath)) {
            fullMatrixReason = `unclassified path changed: ${changedPath}`;
            break;
        }
    }

    const selectedEntries = fullMatrixReason
        ? matrix
        : matrix.filter(entry => selectedPaths.has(entry.local_path));
    const kitTestsNeeded = selectedEntries.length > 0;
    const roktCoverage =
        Boolean(fullMatrixReason) ||
        selectedEntries.some(entry => entry.local_path === 'kits/rokt');

    return {
        matrix: kitTestsNeeded ? selectedEntries : [noOpEntry],
        fullMatrix: Boolean(fullMatrixReason),
        fullMatrixReason,
        kitTestsNeeded,
        roktCoverage,
        changedPaths: normalizedPaths,
    };
}

function validateCommitSha(sha, label, cwd = repositoryRoot) {
    if (typeof sha !== 'string' || !fullShaPattern.test(sha)) {
        throw new Error(`${label} must be a full 40- or 64-character Git SHA`);
    }

    const result = childProcess.spawnSync(
        'git',
        ['cat-file', '-e', `${sha}^{commit}`],
        {
            cwd,
            encoding: 'utf8',
        }
    );
    if (result.status !== 0) {
        throw new Error(`${label} is not an available commit: ${sha}`);
    }
    return sha.toLowerCase();
}

function parseNameStatus(output) {
    const fields = output.split('\0');
    if (fields[fields.length - 1] === '') {
        fields.pop();
    }

    const changedPaths = [];
    for (let index = 0; index < fields.length; ) {
        const status = fields[index++];
        if (!/^[ACDMRTUXB][0-9]*$/.test(status)) {
            throw new Error(`Unexpected git diff status: ${status}`);
        }

        const pathCount =
            status.startsWith('R') || status.startsWith('C') ? 2 : 1;
        if (index + pathCount > fields.length) {
            throw new Error(`Missing path for git diff status: ${status}`);
        }
        for (let pathIndex = 0; pathIndex < pathCount; pathIndex++) {
            changedPaths.push(fields[index++]);
        }
    }
    return changedPaths;
}

function changedPathsFromGit(baseSha, headSha, cwd = repositoryRoot) {
    const base = validateCommitSha(baseSha, 'BASE_SHA', cwd);
    const head = validateCommitSha(headSha, 'HEAD_SHA', cwd);
    const result = childProcess.spawnSync(
        'git',
        [
            'diff',
            '--name-status',
            '-z',
            '--find-renames',
            `${base}...${head}`,
            '--',
        ],
        {
            cwd,
            encoding: 'utf8',
            maxBuffer: 10 * 1024 * 1024,
        }
    );
    if (result.status !== 0) {
        throw new Error(
            `Unable to derive changed paths: ${result.stderr.trim()}`
        );
    }
    return parseNameStatus(result.stdout);
}

function appendGitHubOutputs(outputPath, selection) {
    if (!outputPath) {
        throw new Error('GITHUB_OUTPUT is required in CLI mode');
    }
    const reason = selection.fullMatrixReason || '';
    const delimiter = `kit-matrix-${crypto.randomBytes(16).toString('hex')}`;
    fs.appendFileSync(
        outputPath,
        [
            `matrix=${JSON.stringify(selection.matrix)}`,
            `full_matrix=${selection.fullMatrix}`,
            `full_matrix_reason<<${delimiter}`,
            reason,
            delimiter,
            `kit_tests_needed=${selection.kitTestsNeeded}`,
            `rokt_coverage=${selection.roktCoverage}`,
            '',
        ].join('\n')
    );
}

function runCli() {
    const changedPaths = changedPathsFromGit(
        process.env.BASE_SHA,
        process.env.HEAD_SHA
    );
    const selection = selectKitMatrix(loadMatrix(), changedPaths);
    appendGitHubOutputs(process.env.GITHUB_OUTPUT, selection);
    process.stdout.write(`${JSON.stringify(selection, null, 2)}\n`);
}

if (require.main === module) {
    try {
        runCli();
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

module.exports = {
    appendGitHubOutputs,
    changedPathsFromGit,
    loadMatrix,
    parseNameStatus,
    selectKitMatrix,
    validateCommitSha,
    validateMatrix,
};
