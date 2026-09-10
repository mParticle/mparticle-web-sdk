/* eslint-env node, es2021 */

const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..', '..');
const packageNamePattern = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;

function loadJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function discoverPublishableKitManifests(root) {
    const kitsRoot = path.join(root, 'kits');
    const discovered = [];

    function visit(directory) {
        for (const entry of fs.readdirSync(directory, {
            withFileTypes: true,
        })) {
            if (
                entry.isDirectory() &&
                !['node_modules', 'dist', 'coverage'].includes(entry.name)
            ) {
                visit(path.join(directory, entry.name));
            }
        }
        const manifestPath = path.join(directory, 'package.json');
        if (!fs.existsSync(manifestPath)) {
            return;
        }
        const manifest = loadJson(manifestPath);
        if (manifest.private !== true) {
            discovered.push({
                name: manifest.name,
                path: path.relative(root, directory),
            });
        }
    }

    visit(kitsRoot);
    return discovered.sort((left, right) =>
        left.path.localeCompare(right.path)
    );
}

function assertExactKitInventory(matrixEntries, discoveredEntries) {
    const normalize = entries =>
        entries.map(entry => `${entry.name}\0${entry.path}`).sort();
    const expected = normalize(matrixEntries);
    const discovered = normalize(discoveredEntries);
    if (JSON.stringify(expected) !== JSON.stringify(discovered)) {
        throw new Error(
            'kits/publish-matrix.json does not exactly match independently ' +
                `discovered publishable kit manifests; matrix=${JSON.stringify(
                    expected
                )}, discovered=${JSON.stringify(discovered)}`
        );
    }
}

function resolvePackagePath(root, packagePath) {
    if (
        typeof packagePath !== 'string' ||
        packagePath.length === 0 ||
        path.isAbsolute(packagePath)
    ) {
        throw new Error(`Invalid package path: ${packagePath}`);
    }

    const resolvedRoot = path.resolve(root);
    const resolvedPath = path.resolve(resolvedRoot, packagePath);
    if (
        resolvedPath !== resolvedRoot &&
        !resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)
    ) {
        throw new Error(`Package path escapes repository root: ${packagePath}`);
    }
    return resolvedPath;
}

function validatePackageInventory(entries, root = repositoryRoot) {
    if (!Array.isArray(entries) || entries.length === 0) {
        throw new Error('Expected at least one publishable package');
    }

    const names = new Set();
    const packagePaths = new Set();

    return entries.map((entry, index) => {
        if (
            !entry ||
            typeof entry.name !== 'string' ||
            !packageNamePattern.test(entry.name)
        ) {
            throw new Error(`Invalid package name at inventory index ${index}`);
        }
        if (names.has(entry.name)) {
            throw new Error(`Duplicate package name: ${entry.name}`);
        }
        names.add(entry.name);

        const absolutePath = resolvePackagePath(root, entry.path);
        const relativePath =
            entry.path === '.'
                ? '.'
                : path.relative(path.resolve(root), absolutePath);
        if (packagePaths.has(relativePath)) {
            throw new Error(`Duplicate package path: ${relativePath}`);
        }
        packagePaths.add(relativePath);

        const manifest = loadJson(path.join(absolutePath, 'package.json'));
        if (manifest.name !== entry.name) {
            throw new Error(
                `Package name mismatch at ${relativePath}: expected ` +
                    `${entry.name}, found ${manifest.name}`
            );
        }
        if (manifest.private === true) {
            throw new Error(`Package is marked private: ${entry.name}`);
        }

        return {
            name: entry.name,
            path: relativePath,
            type: index === 0 ? 'core' : 'kit',
        };
    });
}

function loadV3PackageInventory(root = repositoryRoot) {
    const rootManifest = loadJson(path.join(root, 'package.json'));
    const matrix = loadJson(path.join(root, 'kits', 'publish-matrix.json'));
    if (!Array.isArray(matrix)) {
        throw new Error('Expected kits/publish-matrix.json to be an array');
    }

    const entries = [
        {
            name: rootManifest.name,
            path: '.',
        },
        ...matrix.map(entry => ({
            name: entry.name,
            path: entry.local_path,
        })),
    ];
    assertExactKitInventory(
        entries.slice(1),
        discoverPublishableKitManifests(root)
    );

    return validatePackageInventory(entries, root);
}

module.exports = {
    assertExactKitInventory,
    discoverPublishableKitManifests,
    loadV3PackageInventory,
    resolvePackagePath,
    validatePackageInventory,
};
