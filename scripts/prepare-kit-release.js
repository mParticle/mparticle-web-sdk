/* eslint-env node, es2021 */

const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..');
const publishMatrixPath = path.join(
    repositoryRoot,
    'kits',
    'publish-matrix.json'
);
const testMatrixPath = path.join(repositoryRoot, 'kits', 'matrix.json');
const repositoryUrl = 'https://github.com/mParticle/mparticle-web-sdk';

function compareStrings(left, right) {
    return left < right ? -1 : left > right ? 1 : 0;
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
    const source = fs.readFileSync(filePath, 'utf8');
    const indent = source.match(/^[\t ]+(?=")/m);
    const spacing = indent ? indent[0] : '    ';
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, spacing)}\n`);
}

function resolveKitPath(relativePath) {
    if (typeof relativePath !== 'string' || !relativePath.startsWith('kits/')) {
        throw new Error(`Invalid kit path: ${relativePath}`);
    }

    const resolvedPath = path.resolve(repositoryRoot, relativePath);
    const kitsRoot = path.join(repositoryRoot, 'kits') + path.sep;
    if (!resolvedPath.startsWith(kitsRoot)) {
        throw new Error(`Kit path escapes kits/: ${relativePath}`);
    }
    return resolvedPath;
}

function validateVersion(version) {
    if (
        typeof version !== 'string' ||
        !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)
    ) {
        throw new Error(
            `Expected a stable semantic version, received: ${version}`
        );
    }
}

function validateRepository(packageJson, relativePath) {
    const repository = packageJson.repository;
    if (
        repository?.type !== 'git' ||
        repository?.url !== repositoryUrl ||
        repository?.directory !== relativePath
    ) {
        throw new Error(
            `${relativePath}/package.json must identify ${repositoryUrl} with directory ${relativePath}`
        );
    }
}

function validateMatrix(entries, matrixName) {
    if (!Array.isArray(entries) || entries.length === 0) {
        throw new Error(`${matrixName} must be a non-empty array`);
    }
}

function validatePublishEntries(publishEntries) {
    const packageNames = new Set();
    const publishPaths = new Set();
    for (const entry of publishEntries) {
        if (
            !entry ||
            typeof entry.name !== 'string' ||
            typeof entry.local_path !== 'string'
        ) {
            throw new Error(
                'Each publish matrix entry requires name and local_path'
            );
        }
        if (packageNames.has(entry.name)) {
            throw new Error(`Duplicate publish package: ${entry.name}`);
        }
        if (publishPaths.has(entry.local_path)) {
            throw new Error(`Duplicate publish path: ${entry.local_path}`);
        }

        const packageJsonPath = path.join(
            resolveKitPath(entry.local_path),
            'package.json'
        );
        const packageJson = readJson(packageJsonPath);
        if (packageJson.name !== entry.name) {
            throw new Error(
                `${entry.local_path}/package.json is ${packageJson.name}, expected ${entry.name}`
            );
        }
        validateRepository(packageJson, entry.local_path);

        packageNames.add(entry.name);
        publishPaths.add(entry.local_path);
    }
    return publishPaths;
}

function discoverPublicKitPackages() {
    const packages = [];
    function visit(directory) {
        for (const entry of fs.readdirSync(directory, {
            withFileTypes: true,
        })) {
            if (
                entry.name === 'node_modules' ||
                entry.name === 'dist' ||
                !entry.isDirectory()
            ) {
                continue;
            }
            const entryPath = path.join(directory, entry.name);
            const packageJsonPath = path.join(entryPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = readJson(packageJsonPath);
                if (packageJson.private !== true) {
                    packages.push({
                        name: packageJson.name,
                        local_path: path
                            .relative(repositoryRoot, entryPath)
                            .split(path.sep)
                            .join('/'),
                    });
                }
            }
            visit(entryPath);
        }
    }
    visit(path.join(repositoryRoot, 'kits'));
    return packages.sort((left, right) =>
        compareStrings(left.local_path, right.local_path)
    );
}

function validatePublishMatrixCompleteness(publishEntries) {
    const serialize = entry => `${entry.name}\0${entry.local_path}`;
    const configured = publishEntries.map(serialize).sort(compareStrings);
    const discovered = discoverPublicKitPackages()
        .map(serialize)
        .sort(compareStrings);
    if (JSON.stringify(configured) !== JSON.stringify(discovered)) {
        const configuredSet = new Set(configured);
        const discoveredSet = new Set(discovered);
        const missing = discovered.filter(entry => !configuredSet.has(entry));
        const unexpected = configured.filter(
            entry => !discoveredSet.has(entry)
        );
        throw new Error(
            [
                missing.length
                    ? `Public packages missing from publish matrix: ${missing
                          .map(entry => entry.replace('\0', ' at '))
                          .join(', ')}`
                    : null,
                unexpected.length
                    ? `Publish matrix entries without public packages: ${unexpected
                          .map(entry => entry.replace('\0', ' at '))
                          .join(', ')}`
                    : null,
            ]
                .filter(Boolean)
                .join('\n')
        );
    }
}

function collectBuildPaths(publishEntries) {
    const buildPaths = [];
    const seenBuildPaths = new Set();
    for (const entry of publishEntries) {
        const buildPath = entry.build_path || entry.local_path;
        if (!seenBuildPaths.has(buildPath)) {
            resolveKitPath(buildPath);
            buildPaths.push(buildPath);
            seenBuildPaths.add(buildPath);
        }
    }
    return buildPaths;
}

function serializeBuildPaths(buildPaths) {
    return buildPaths.map(buildPath => `${buildPath}\n`).join('');
}

function collectManifestPaths(publishPaths, testEntries) {
    const manifestPaths = new Set(publishPaths);
    for (const entry of testEntries) {
        if (!entry || typeof entry.local_path !== 'string') {
            throw new Error('Each test matrix entry requires local_path');
        }
        const packageJsonPath = path.join(
            resolveKitPath(entry.local_path),
            'package.json'
        );
        if (fs.existsSync(packageJsonPath)) {
            validateRepository(readJson(packageJsonPath), entry.local_path);
            manifestPaths.add(entry.local_path);
        }
    }
    return Array.from(manifestPaths);
}

function loadReleaseInventory() {
    const publishEntries = readJson(publishMatrixPath);
    const testEntries = readJson(testMatrixPath);
    validateMatrix(publishEntries, 'kits/publish-matrix.json');
    validateMatrix(testEntries, 'kits/matrix.json');
    const publishPaths = validatePublishEntries(publishEntries);
    validatePublishMatrixCompleteness(publishEntries);

    return {
        buildPaths: collectBuildPaths(publishEntries),
        manifestPaths: collectManifestPaths(publishPaths, testEntries),
        publishOutputPaths: publishEntries.map(
            entry => `${entry.local_path}/dist`
        ),
        publishEntries,
    };
}

function cleanPublishOutputs(inventory) {
    for (const outputPath of inventory.publishOutputPaths) {
        fs.rmSync(resolveKitPath(outputPath), {
            force: true,
            recursive: true,
        });
    }
}

function updateManifestVersion(relativePath, version) {
    const packageDirectory = resolveKitPath(relativePath);
    const packageJsonPath = path.join(packageDirectory, 'package.json');
    const packageJson = readJson(packageJsonPath);
    packageJson.version = version;
    writeJson(packageJsonPath, packageJson);

    const packageLockPath = path.join(packageDirectory, 'package-lock.json');
    if (fs.existsSync(packageLockPath)) {
        const packageLock = readJson(packageLockPath);
        packageLock.version = version;
        if (packageLock.packages?.['']) {
            packageLock.packages[''].version = version;
        }
        writeJson(packageLockPath, packageLock);
    }
}

function prepareKitRelease(version) {
    validateVersion(version);
    const inventory = loadReleaseInventory();
    cleanPublishOutputs(inventory);

    for (const manifestPath of inventory.manifestPaths) {
        updateManifestVersion(manifestPath, version);
    }

    return inventory;
}

if (require.main === module) {
    try {
        const version = process.argv[2];
        const inventory = prepareKitRelease(version);
        process.stdout.write(
            `Prepared ${inventory.publishEntries.length} publishable kits at ${version}\n`
        );
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

module.exports = {
    discoverPublicKitPackages,
    loadReleaseInventory,
    prepareKitRelease,
    serializeBuildPaths,
    validateRepository,
    validatePublishMatrixCompleteness,
    validateVersion,
};
