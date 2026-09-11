/* eslint-env node, es2021 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const {
    canonicalJson,
    createCandidateManifest,
} = require('./candidate-manifest');
const {
    loadV3PackageInventory,
    resolvePackagePath,
    validatePackageInventory,
} = require('./package-inventory');
const { readVersionFile } = require('./version');

const candidateManifestFilename = 'candidate-manifest.json';
const releaseNotesFilename = 'release-notes.md';
const npmExecutable = path.join(
    path.dirname(process.execPath),
    process.platform === 'win32' ? 'npm.cmd' : 'npm'
);

function isWithin(parentPath, childPath) {
    const parent = path.resolve(parentPath);
    const child = path.resolve(childPath);
    return child === parent || child.startsWith(`${parent}${path.sep}`);
}

function resolveReleasePath(releaseDirectory, relativePath) {
    if (
        typeof relativePath !== 'string' ||
        relativePath.length === 0 ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(`Unsafe release output path: ${relativePath}`);
    }

    const resolved = path.resolve(releaseDirectory, relativePath);
    if (
        !isWithin(releaseDirectory, resolved) ||
        resolved === releaseDirectory
    ) {
        throw new Error(
            `Release output path escapes directory: ${relativePath}`
        );
    }
    return resolved;
}

function assertSafeReleaseDirectory(releaseDirectory) {
    if (
        typeof releaseDirectory !== 'string' ||
        releaseDirectory.trim().length === 0
    ) {
        throw new Error('A release output directory is required');
    }

    const resolved = path.resolve(releaseDirectory);
    const parsed = path.parse(resolved);
    if (resolved === parsed.root || resolved === path.resolve(process.cwd())) {
        throw new Error(`Refusing dangerous release directory: ${resolved}`);
    }
    return resolved;
}

function defaultPackPackage({ packageDirectory, outputDirectory }) {
    const output = execFileSync(
        npmExecutable,
        [
            'pack',
            packageDirectory,
            '--json',
            '--ignore-scripts',
            '--pack-destination',
            outputDirectory,
        ],
        {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        }
    );
    const results = JSON.parse(output);
    if (!Array.isArray(results) || results.length !== 1) {
        throw new Error(`Unexpected npm pack output for ${packageDirectory}`);
    }
    return results[0];
}

function validatePackageManifest(repositoryRoot, entry, version) {
    const packageDirectory = resolvePackagePath(repositoryRoot, entry.path);
    const manifest = JSON.parse(
        fs.readFileSync(path.join(packageDirectory, 'package.json'), 'utf8')
    );
    if (manifest.name !== entry.name) {
        throw new Error(
            `Package manifest mismatch at ${entry.path}: expected ${entry.name}, found ${manifest.name}`
        );
    }
    if (manifest.version !== version) {
        throw new Error(
            `Package ${entry.name} has version ${manifest.version}; expected ${version}`
        );
    }

    const requiredPaths = [
        manifest.main,
        manifest.module,
        manifest.types,
        ...(Array.isArray(manifest.files) ? manifest.files : []),
    ].filter(Boolean);
    requiredPaths.forEach(requiredPath => {
        if (
            typeof requiredPath !== 'string' ||
            /[*?[\]{}]/.test(requiredPath) ||
            path.isAbsolute(requiredPath) ||
            !isWithin(
                packageDirectory,
                path.resolve(packageDirectory, requiredPath)
            )
        ) {
            throw new Error(
                `${entry.name} has an unsafe or unsupported package path: ${requiredPath}`
            );
        }
        if (!fs.existsSync(path.resolve(packageDirectory, requiredPath))) {
            throw new Error(
                `${entry.name} release artifact is missing: ${requiredPath}`
            );
        }
    });

    return packageDirectory;
}

function validatePackResult(result, entry, version, outputDirectory) {
    if (
        !result ||
        result.name !== entry.name ||
        result.version !== version ||
        typeof result.filename !== 'string'
    ) {
        throw new Error(
            `Packed package metadata mismatch for ${entry.name}@${version}`
        );
    }
    if (
        result.filename !== path.basename(result.filename) ||
        !result.filename.endsWith('.tgz')
    ) {
        throw new Error(`Unsafe tarball path: ${result.filename}`);
    }

    const tarballPath = resolveReleasePath(outputDirectory, result.filename);
    if (!fs.statSync(tarballPath).isFile()) {
        throw new Error(`Packed tarball is not a file: ${result.filename}`);
    }
    return tarballPath;
}

function hashFile(filePath, algorithm) {
    return crypto
        .createHash(algorithm)
        .update(fs.readFileSync(filePath))
        .digest(algorithm === 'sha512' ? 'base64' : 'hex');
}

function getBuildTools() {
    return {
        node: process.version,
        npm: execFileSync(npmExecutable, ['--version'], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        }).trim(),
    };
}

function prepareReleaseArtifacts({
    repositoryRoot,
    releaseDirectory,
    releaseNotesPath,
    sourceSha,
    inventory,
    packPackage = defaultPackPackage,
    buildTools = getBuildTools(),
}) {
    const root = path.resolve(repositoryRoot);
    const version = readVersionFile(root);
    if (typeof sourceSha !== 'string' || !/^[0-9a-f]{40}$/.test(sourceSha)) {
        throw new Error('Expected source_sha to be a full lowercase Git SHA');
    }
    const packages = inventory
        ? validatePackageInventory(
              inventory.map(entry => ({
                  name: entry.name,
                  path: entry.path,
              })),
              root
          )
        : loadV3PackageInventory(root);

    // Validate all immutable inputs before creating or cleaning output.
    const packageDirectories = packages.map(entry =>
        validatePackageManifest(root, entry, version)
    );
    const resolvedReleaseNotesPath = path.resolve(
        releaseNotesPath || path.join(root, '.release', releaseNotesFilename)
    );
    if (!fs.statSync(resolvedReleaseNotesPath).isFile()) {
        throw new Error('Release notes must be a file');
    }
    const releaseNotesStat = fs.statSync(resolvedReleaseNotesPath);

    const outputDirectory = assertSafeReleaseDirectory(releaseDirectory);
    fs.mkdirSync(outputDirectory, { recursive: true });
    const temporaryDirectory = fs.mkdtempSync(
        resolveReleasePath(outputDirectory, '.prepare-')
    );

    try {
        const seenTarballs = new Set();
        const artifacts = packages.map((entry, index) => {
            const result = packPackage({
                entry,
                outputDirectory: temporaryDirectory,
                packageDirectory: packageDirectories[index],
            });
            const tarballPath = validatePackResult(
                result,
                entry,
                version,
                temporaryDirectory
            );
            if (seenTarballs.has(result.filename)) {
                throw new Error(`Duplicate tarball path: ${result.filename}`);
            }
            seenTarballs.add(result.filename);

            const stat = fs.statSync(tarballPath);
            return {
                integrity: `sha512-${hashFile(tarballPath, 'sha512')}`,
                name: entry.name,
                path: entry.path,
                sha256: hashFile(tarballPath, 'sha256'),
                size: stat.size,
                tarball: result.filename,
                version,
            };
        });
        const manifest = createCandidateManifest({
            build: buildTools,
            packages: artifacts,
            release_notes: {
                path: releaseNotesFilename,
                sha256: hashFile(resolvedReleaseNotesPath, 'sha256'),
                size: releaseNotesStat.size,
            },
            source_sha: sourceSha,
            version,
        });

        const outputPaths = artifacts.map(artifact =>
            resolveReleasePath(outputDirectory, artifact.tarball)
        );
        outputPaths.push(
            resolveReleasePath(outputDirectory, candidateManifestFilename),
            resolveReleasePath(outputDirectory, releaseNotesFilename)
        );
        outputPaths.forEach(outputPath => {
            if (fs.existsSync(outputPath)) {
                throw new Error(
                    `Release output already exists: ${path.basename(
                        outputPath
                    )}`
                );
            }
        });

        artifacts.forEach(artifact => {
            fs.renameSync(
                resolveReleasePath(temporaryDirectory, artifact.tarball),
                resolveReleasePath(outputDirectory, artifact.tarball)
            );
        });
        const manifestPath = resolveReleasePath(
            outputDirectory,
            candidateManifestFilename
        );
        fs.writeFileSync(manifestPath, canonicalJson(manifest));
        fs.copyFileSync(
            resolvedReleaseNotesPath,
            resolveReleasePath(outputDirectory, releaseNotesFilename)
        );

        return { artifacts, manifest, manifestPath, version };
    } finally {
        if (isWithin(outputDirectory, temporaryDirectory)) {
            fs.rmSync(temporaryDirectory, { force: true, recursive: true });
        }
    }
}

function parseCliArguments(argv) {
    const values = {};
    for (let index = 0; index < argv.length; index += 2) {
        const key = argv[index];
        const value = argv[index + 1];
        if (
            ![
                '--repository-root',
                '--release-directory',
                '--release-notes',
                '--source-sha',
            ].includes(key) ||
            typeof value !== 'string'
        ) {
            throw new Error(
                'Usage: prepare-artifacts.js --repository-root ROOT --release-directory DIR --release-notes FILE --source-sha SHA'
            );
        }
        if (values[key]) {
            throw new Error(`Duplicate CLI option: ${key}`);
        }
        values[key] = value;
    }
    if (Object.keys(values).length !== 4) {
        throw new Error(
            'Usage: prepare-artifacts.js --repository-root ROOT --release-directory DIR --release-notes FILE --source-sha SHA'
        );
    }
    return values;
}

function runCli(argv) {
    const values = parseCliArguments(argv);
    const result = prepareReleaseArtifacts({
        releaseDirectory: values['--release-directory'],
        releaseNotesPath: values['--release-notes'],
        repositoryRoot: values['--repository-root'],
        sourceSha: values['--source-sha'],
    });
    process.stdout.write(
        `${JSON.stringify({
            manifest: result.manifestPath,
            package_count: result.artifacts.length,
            version: result.version,
        })}\n`
    );
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
    candidateManifestFilename,
    defaultPackPackage,
    parseCliArguments,
    prepareReleaseArtifacts,
    resolveReleasePath,
    runCli,
};
