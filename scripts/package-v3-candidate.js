/* eslint-env node, es2021 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const { loadReleaseInventory } = require('./prepare-kit-release');
const { packPackage, validatePackageManifest } = require('./publish-kits');

const repositoryRoot = path.resolve(__dirname, '..');
const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const candidateSourceMapEnvironment = {
    ...process.env,
    V3_CANDIDATE_SOURCEMAPS: 'true',
};
const coreBundlePaths = [
    'dist/mparticle.common.js',
    'dist/mparticle.esm.js',
    'dist/mparticle.js',
];
const privateBundlePaths = [
    'kits/adobe/HeartbeatKit/dist/AdobeHBKit.esm.js',
    'kits/adobe/HeartbeatKit/dist/AdobeHBKit.iife.js',
];

function compareStrings(left, right) {
    return left < right ? -1 : left > right ? 1 : 0;
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizePath(filePath) {
    return filePath.split(path.sep).join('/');
}

function run(command, args, options = {}) {
    const output = execFileSync(command, args, {
        cwd: options.cwd || repositoryRoot,
        encoding: 'utf8',
        env: options.env || process.env,
        stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
    });
    return output ? output.trim() : '';
}

function runNpm(args, options = {}) {
    return run(npmExecutable, args, options);
}

function sha256(filePath) {
    return crypto
        .createHash('sha256')
        .update(fs.readFileSync(filePath))
        .digest('hex');
}

function sha256Bytes(bytes) {
    return crypto
        .createHash('sha256')
        .update(bytes)
        .digest('hex');
}

function expectedKitBundlePaths(entry, packageJson) {
    if (
        typeof packageJson.main !== 'string' ||
        !packageJson.main.startsWith('dist/') ||
        !packageJson.main.endsWith('.common.js')
    ) {
        throw new Error(
            `${entry.name} main must identify a dist/*.common.js bundle`
        );
    }

    const packagePaths = [
        packageJson.main,
        packageJson.main.replace(/\.common\.js$/, '.iife.js'),
    ];
    if (packageJson.module) {
        if (
            typeof packageJson.module !== 'string' ||
            !packageJson.module.startsWith('dist/') ||
            !packageJson.module.endsWith('.esm.js')
        ) {
            throw new Error(
                `${entry.name} module must identify a dist/*.esm.js bundle`
            );
        }
        packagePaths.push(packageJson.module);
    }

    return Array.from(new Set(packagePaths))
        .flatMap(bundlePath => [
            normalizePath(path.join(entry.local_path, bundlePath)),
            normalizePath(path.join(entry.local_path, `${bundlePath}.map`)),
        ])
        .sort(compareStrings);
}

function expectedBundlePaths(inventory) {
    const paths = coreBundlePaths.flatMap(bundlePath => [
        bundlePath,
        `${bundlePath}.map`,
    ]);

    for (const entry of inventory.publishEntries) {
        const packageJson = readJson(
            path.join(repositoryRoot, entry.local_path, 'package.json')
        );
        paths.push(...expectedKitBundlePaths(entry, packageJson));
    }
    for (const bundlePath of privateBundlePaths) {
        paths.push(bundlePath, `${bundlePath}.map`);
    }
    return paths.sort(compareStrings);
}

function requiredNpmBundlePaths(packageJson) {
    return Array.from(
        new Set(
            [
                packageJson.main,
                packageJson.module,
                typeof packageJson.browser === 'string'
                    ? packageJson.browser
                    : null,
                ...(Array.isArray(packageJson.files) ? packageJson.files : []),
            ]
                .filter(
                    filePath =>
                        typeof filePath === 'string' &&
                        filePath.startsWith('dist/') &&
                        filePath.endsWith('.js')
                )
                .map(normalizePath)
        )
    ).sort(compareStrings);
}

function listFiles(directory) {
    if (!fs.existsSync(directory)) {
        return [];
    }

    const files = [];
    function visit(currentDirectory) {
        for (const entry of fs.readdirSync(currentDirectory, {
            withFileTypes: true,
        })) {
            const entryPath = path.join(currentDirectory, entry.name);
            if (entry.isDirectory()) {
                visit(entryPath);
            } else if (entry.isFile()) {
                files.push(entryPath);
            } else {
                throw new Error(`Unsupported candidate entry: ${entryPath}`);
            }
        }
    }
    visit(directory);
    return files.sort(compareStrings);
}

function validateBuiltBundles(inventory) {
    const expected = expectedBundlePaths(inventory);
    const expectedSet = new Set(expected);
    const actual = [
        ...listFiles(path.join(repositoryRoot, 'dist')),
        ...inventory.publishEntries.flatMap(entry =>
            listFiles(path.join(repositoryRoot, entry.local_path, 'dist'))
        ),
        ...listFiles(path.join(repositoryRoot, 'kits/adobe/HeartbeatKit/dist')),
    ]
        .map(filePath => normalizePath(path.relative(repositoryRoot, filePath)))
        .filter(filePath => /\.(?:js|js\.map)$/.test(filePath))
        .sort(compareStrings);
    const actualSet = new Set(actual);
    const missing = expected.filter(filePath => !actualSet.has(filePath));
    const unexpected = actual.filter(filePath => !expectedSet.has(filePath));

    if (missing.length || unexpected.length) {
        throw new Error(
            [
                missing.length
                    ? `Missing candidate bundles: ${missing.join(', ')}`
                    : null,
                unexpected.length
                    ? `Unexpected candidate bundles: ${unexpected.join(', ')}`
                    : null,
            ]
                .filter(Boolean)
                .join('\n')
        );
    }
    return expected;
}

function cleanBuildOutputs(inventory) {
    const outputDirectories = new Set([
        'dist',
        'kits/adobe/HeartbeatKit/dist',
        ...inventory.publishOutputPaths,
    ]);
    for (const outputDirectory of outputDirectories) {
        fs.rmSync(path.join(repositoryRoot, outputDirectory), {
            force: true,
            recursive: true,
        });
    }
}

function buildBundles(inventory) {
    cleanBuildOutputs(inventory);
    for (const script of [
        'build:iife',
        'build:npm',
        'build:esm',
        'build:types',
    ]) {
        runNpm(['run', script], {
            env: candidateSourceMapEnvironment,
            stdio: 'inherit',
        });
    }

    for (const buildPath of inventory.buildPaths) {
        runNpm(['ci', '--prefix', buildPath], { stdio: 'inherit' });
        if (buildPath === 'kits/google-analytics-4') {
            for (const packagePath of [
                'kits/google-analytics-4/packages/GA4Client',
                'kits/google-analytics-4/packages/GA4Server',
            ]) {
                runNpm(['ci', '--prefix', packagePath], { stdio: 'inherit' });
                runNpm(
                    [
                        'run',
                        'build',
                        '--prefix',
                        packagePath,
                        '--',
                        '--sourcemap',
                    ],
                    { stdio: 'inherit' }
                );
            }
            continue;
        }
        const buildArguments = ['run', 'build', '--prefix', buildPath];
        if (buildPath !== 'kits/adobe') {
            buildArguments.push('--', '--sourcemap');
        }
        runNpm(buildArguments, {
            env: candidateSourceMapEnvironment,
            stdio: 'inherit',
        });
    }
}

function copyBundles(bundlePaths, candidateRoot) {
    for (const bundlePath of bundlePaths) {
        const sourcePath = path.join(repositoryRoot, bundlePath);
        const destinationPath = path.join(
            candidateRoot,
            bundlePath.startsWith('dist/') ? 'core' : '',
            bundlePath
        );
        fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
        fs.copyFileSync(sourcePath, destinationPath);
    }
}

function packPackages(inventory, version, candidateRoot) {
    const npmDirectory = path.join(candidateRoot, 'npm');
    fs.mkdirSync(npmDirectory, { recursive: true });
    const coreManifest = readJson(path.join(repositoryRoot, 'package.json'));
    if (coreManifest.version !== version) {
        throw new Error(
            `Core SDK is ${coreManifest.version}, expected ${version}`
        );
    }

    const packageArtifacts = [
        {
            name: coreManifest.name,
            candidateBundleRoot: path.join(candidateRoot, 'core'),
            requiredBundlePaths: requiredNpmBundlePaths(coreManifest),
            ...packPackage('.', npmDirectory, { npmExecutable }),
        },
    ];
    for (const entry of inventory.publishEntries) {
        validatePackageManifest(entry, version);
        const packageJson = readJson(
            path.join(repositoryRoot, entry.local_path, 'package.json')
        );
        packageArtifacts.push({
            name: entry.name,
            candidateBundleRoot: path.join(candidateRoot, entry.local_path),
            requiredBundlePaths: requiredNpmBundlePaths(packageJson),
            ...packPackage(entry.local_path, npmDirectory, { npmExecutable }),
        });
    }

    const tarballNames = new Set();
    return packageArtifacts
        .map(artifact => {
            validatePackedBundles(
                artifact.name,
                artifact.tarballPath,
                artifact.candidateBundleRoot,
                artifact.requiredBundlePaths
            );
            const filename = path.basename(artifact.tarballPath);
            if (tarballNames.has(filename)) {
                throw new Error(`Duplicate npm tarball: ${filename}`);
            }
            tarballNames.add(filename);
            return {
                name: artifact.name,
                path: `npm/${filename}`,
                npmIntegrity: artifact.integrity,
            };
        })
        .sort((left, right) => compareStrings(left.name, right.name));
}

function runChecked(command, args, options = {}) {
    const result = spawnSync(command, args, options);
    if (result.status !== 0) {
        throw new Error(
            `${command} failed: ${String(result.stderr || '').trim()}`
        );
    }
    return result;
}

function validatePackedBundles(
    packageName,
    tarballPath,
    candidateBundleRoot,
    requiredBundlePaths
) {
    const archiveEntries = runChecked('tar', ['-tzf', tarballPath], {
        encoding: 'utf8',
    })
        .stdout.split('\n')
        .filter(entry => /^package\/dist\/.+\.js$/.test(entry))
        .sort(compareStrings);
    const archiveEntrySet = new Set(archiveEntries);

    for (const requiredPath of requiredBundlePaths) {
        const archivePath = `package/${normalizePath(requiredPath)}`;
        if (!archiveEntrySet.has(archivePath)) {
            throw new Error(
                `${packageName} npm tarball is missing required bundle: ${requiredPath}`
            );
        }
    }

    for (const archivePath of archiveEntries) {
        const relativePath = archivePath.slice('package/'.length);
        const candidatePath = path.join(candidateBundleRoot, relativePath);
        if (!fs.existsSync(candidatePath)) {
            throw new Error(
                `${packageName} npm bundle is missing from CDN candidate: ${relativePath}`
            );
        }
        const packedBytes = runChecked(
            'tar',
            ['-xOzf', tarballPath, archivePath],
            { encoding: 'buffer' }
        ).stdout;
        if (sha256Bytes(packedBytes) !== sha256(candidatePath)) {
            throw new Error(
                `${packageName} npm and CDN bundles differ: ${relativePath}`
            );
        }
    }
}

function createCdnArchive(candidateRoot) {
    const archivePath = path.join(candidateRoot, 'cdn-bundles.tgz');
    const tarPath = path.join(candidateRoot, '.cdn-bundles.tar');
    runChecked(
        'tar',
        [
            '--sort=name',
            '--mtime=@0',
            '--owner=0',
            '--group=0',
            '--numeric-owner',
            '--mode=a-x,u=rwX,go=rX',
            '-cf',
            tarPath,
            '-C',
            candidateRoot,
            'core',
            'kits',
        ],
        { encoding: 'utf8' }
    );
    const archiveFile = fs.openSync(archivePath, 'w');
    try {
        runChecked('gzip', ['-n', '-9', '-c', tarPath], {
            encoding: 'buffer',
            stdio: ['ignore', archiveFile, 'pipe'],
        });
    } finally {
        fs.closeSync(archiveFile);
        fs.rmSync(tarPath, { force: true });
    }

    const archivedFiles = runChecked('tar', ['-tzf', archivePath], {
        encoding: 'utf8',
    })
        .stdout.split('\n')
        .filter(entry => entry && !entry.endsWith('/'))
        .sort(compareStrings);
    const expectedFiles = listFiles(candidateRoot)
        .map(filePath => normalizePath(path.relative(candidateRoot, filePath)))
        .filter(filePath => /^(?:core|kits)\//.test(filePath))
        .sort(compareStrings);
    if (JSON.stringify(archivedFiles) !== JSON.stringify(expectedFiles)) {
        throw new Error('CDN archive inventory does not match staged bundles');
    }
    return archivePath;
}

function createFileInventory(candidateRoot) {
    return listFiles(candidateRoot)
        .filter(filePath => path.basename(filePath) !== 'metadata.json')
        .map(filePath => ({
            path: normalizePath(path.relative(candidateRoot, filePath)),
            size: fs.statSync(filePath).size,
            sha256: sha256(filePath),
        }))
        .sort((left, right) => compareStrings(left.path, right.path));
}

function writeMetadata(candidateRoot, identity, packages) {
    const metadata = {
        schemaVersion: 1,
        version: identity.version,
        sourceSha: identity.sourceSha,
        buildId: identity.buildId,
        packages,
        files: createFileInventory(candidateRoot),
    };
    fs.writeFileSync(
        path.join(candidateRoot, 'metadata.json'),
        `${JSON.stringify(metadata, null, 4)}\n`
    );
    return metadata;
}

function parseArguments(args) {
    const options = {};
    for (let index = 0; index < args.length; index++) {
        const argument = args[index];
        if (argument === '--build-id' || argument === '--output') {
            const value = args[++index];
            if (!value) {
                throw new Error(`${argument} requires a value`);
            }
            options[argument === '--build-id' ? 'buildId' : 'output'] = value;
        } else {
            throw new Error(`Unknown argument: ${argument}`);
        }
    }
    if (
        !options.buildId ||
        !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(options.buildId)
    ) {
        throw new Error(
            '--build-id must contain only letters, numbers, dots, underscores, and hyphens'
        );
    }
    if (!options.output) {
        throw new Error('--output is required');
    }
    if (
        path.isAbsolute(options.output) ||
        path.win32.isAbsolute(options.output) ||
        options.output.split(/[\\/]/).includes('..') ||
        options.output === '.'
    ) {
        throw new Error(
            '--output must be a relative path inside the repository'
        );
    }
    return options;
}

function resolveCandidateOutput(output, sourceRoot = repositoryRoot) {
    const realRepositoryRoot = fs.realpathSync(sourceRoot);
    const outputPath = path.resolve(realRepositoryRoot, output);
    const outputRoot = path.join(realRepositoryRoot, 'out');
    if (!outputPath.startsWith(`${outputRoot}${path.sep}`)) {
        throw new Error(
            '--output must be inside the repository out/ directory'
        );
    }
    let existingAncestor = path.dirname(outputPath);
    while (!fs.existsSync(existingAncestor)) {
        existingAncestor = path.dirname(existingAncestor);
    }
    const realAncestor = fs.realpathSync(existingAncestor);
    if (
        realAncestor !== realRepositoryRoot &&
        !realAncestor.startsWith(`${realRepositoryRoot}${path.sep}`)
    ) {
        throw new Error(
            '--output must not use a symlink that leaves the repository'
        );
    }
    return outputPath;
}

function assertCleanSource(sourceRoot = repositoryRoot) {
    const status = run('git', ['status', '--short', '--untracked-files=all'], {
        cwd: sourceRoot,
    });
    if (status) {
        throw new Error(
            `Candidate source contains uncommitted changes:\n${status}`
        );
    }
}

function packageCandidate(options) {
    assertCleanSource();
    const inventory = loadReleaseInventory();
    const version = readJson(path.join(repositoryRoot, 'package.json')).version;
    const sourceSha = run('git', ['rev-parse', 'HEAD']);
    const outputPath = resolveCandidateOutput(options.output);
    if (fs.existsSync(outputPath)) {
        throw new Error(`Candidate output already exists: ${outputPath}`);
    }
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    buildBundles(inventory);
    const bundlePaths = validateBuiltBundles(inventory);
    const temporaryRoot = fs.mkdtempSync(
        path.join(path.dirname(outputPath), '.v3-candidate-')
    );
    try {
        copyBundles(bundlePaths, temporaryRoot);
        const packages = packPackages(inventory, version, temporaryRoot);
        createCdnArchive(temporaryRoot);
        const metadata = writeMetadata(
            temporaryRoot,
            { version, sourceSha, buildId: options.buildId },
            packages
        );
        fs.renameSync(temporaryRoot, outputPath);
        return {
            outputPath,
            metadata,
        };
    } catch (error) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
        throw error;
    }
}

function main() {
    const options = parseArguments(process.argv.slice(2));
    const result = packageCandidate(options);
    console.log(
        `Created V3 candidate ${result.metadata.version}/${result.metadata.buildId} with ${result.metadata.files.length} files at ${result.outputPath}`
    );
}

if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

module.exports = {
    assertCleanSource,
    createCdnArchive,
    createFileInventory,
    expectedBundlePaths,
    expectedKitBundlePaths,
    parseArguments,
    requiredNpmBundlePaths,
    resolveCandidateOutput,
    sha256,
    validatePackedBundles,
    validateBuiltBundles,
    writeMetadata,
};
