/* eslint-env node, es2021 */

const nodeCrypto: typeof import('node:crypto') = require('node:crypto');
const fs: typeof import('node:fs') = require('node:fs');
const path: typeof import('node:path') = require('node:path');
const childProcess: typeof import('node:child_process') = require('node:child_process');
const { execFileSync, spawnSync } = childProcess;

interface ReleaseEntry {
    name: string;
    local_path: string;
    build_path?: string;
}

interface ReleaseInventory {
    buildPaths: string[];
    publishEntries: ReleaseEntry[];
    publishOutputPaths: string[];
}

interface PackageManifest {
    name?: string;
    version?: string;
    main?: string;
    module?: string;
    browser?: string | Record<string, string>;
    files?: string[];
}

interface PackPackageOptions {
    npmExecutable?: string;
}

interface PackedPackage {
    integrity: string;
    tarballPath: string;
}

interface CandidatePackage {
    name: string;
    path: string;
    npmIntegrity: string;
}

interface StagedPackageArtifact extends PackedPackage {
    name: string;
    candidateBundleRoot: string;
    requiredBundlePaths: string[];
}

interface CandidateFile {
    path: string;
    size: number;
    sha256: string;
}

interface CandidateIdentity {
    version: string;
    sourceSha: string;
    buildId: string;
}

interface CandidateMetadata extends CandidateIdentity {
    schemaVersion: 1;
    packages: CandidatePackage[];
    files: CandidateFile[];
}

interface CandidateOptions {
    buildId: string;
    output: string;
}

interface PackageCandidateResult {
    outputPath: string;
    metadata: CandidateMetadata;
}

interface RunOptions {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    stdio?: import('node:child_process').StdioOptions;
}

const {
    loadReleaseInventory,
}: {
    loadReleaseInventory: () => ReleaseInventory;
} = require('./prepare-kit-release');
const {
    packPackage,
    validatePackageManifest,
}: {
    packPackage: (
        packagePath: string,
        destination: string,
        options?: PackPackageOptions
    ) => PackedPackage;
    validatePackageManifest: (entry: ReleaseEntry, version: string) => void;
} = require('./publish-kits');

const repositoryRoot = path.resolve(__dirname, '..');
const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const candidateSourceMapEnvironment: NodeJS.ProcessEnv = {
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

function compareStrings(left: string, right: string): number {
    return left < right ? -1 : left > right ? 1 : 0;
}

function readJson<T>(filePath: string): T {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function normalizePath(filePath: string): string {
    return filePath.split(path.sep).join('/');
}

function run(
    command: string,
    args: string[],
    options: RunOptions = {}
): string {
    const output = execFileSync(command, args, {
        cwd: options.cwd || repositoryRoot,
        encoding: 'utf8',
        env: options.env || process.env,
        stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
    });
    return output ? output.trim() : '';
}

function runNpm(args: string[], options: RunOptions = {}): string {
    return run(npmExecutable, args, options);
}

function sha256(filePath: string): string {
    return nodeCrypto
        .createHash('sha256')
        .update(fs.readFileSync(filePath))
        .digest('hex');
}

function sha256Bytes(bytes: Buffer): string {
    return nodeCrypto
        .createHash('sha256')
        .update(bytes)
        .digest('hex');
}

function expectedKitBundlePaths(
    entry: ReleaseEntry,
    packageJson: PackageManifest
): string[] {
    if (
        typeof packageJson.main !== 'string' ||
        !packageJson.main.startsWith('dist/') ||
        !packageJson.main.endsWith('.common.js')
    ) {
        throw new Error(
            `${entry.name} main must identify a dist/*.common.js bundle`
        );
    }

    const packagePaths: string[] = [
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

function expectedBundlePaths(inventory: ReleaseInventory): string[] {
    const paths = coreBundlePaths.flatMap(bundlePath => [
        bundlePath,
        `${bundlePath}.map`,
    ]);

    for (const entry of inventory.publishEntries) {
        const packageJson = readJson<PackageManifest>(
            path.join(repositoryRoot, entry.local_path, 'package.json')
        );
        paths.push(...expectedKitBundlePaths(entry, packageJson));
    }
    for (const bundlePath of privateBundlePaths) {
        paths.push(bundlePath, `${bundlePath}.map`);
    }
    return paths.sort(compareStrings);
}

function requiredNpmBundlePaths(packageJson: PackageManifest): string[] {
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
                    (filePath): filePath is string =>
                        typeof filePath === 'string' &&
                        filePath.startsWith('dist/') &&
                        filePath.endsWith('.js')
                )
                .map(normalizePath)
        )
    ).sort(compareStrings);
}

function listFiles(directory: string): string[] {
    if (!fs.existsSync(directory)) {
        return [];
    }

    const files: string[] = [];
    function visit(currentDirectory: string): void {
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

function validateBuiltBundles(inventory: ReleaseInventory): string[] {
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

function cleanBuildOutputs(inventory: ReleaseInventory): void {
    const outputDirectories = new Set<string>([
        'dist',
        'kits/adobe/HeartbeatKit/dist',
        ...inventory.publishOutputPaths,
    ]);
    for (const outputDirectory of Array.from(outputDirectories)) {
        fs.rmSync(path.join(repositoryRoot, outputDirectory), {
            force: true,
            recursive: true,
        });
    }
}

function buildBundles(inventory: ReleaseInventory): void {
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

function copyBundles(bundlePaths: string[], candidateRoot: string): void {
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

function packPackages(
    inventory: ReleaseInventory,
    version: string,
    candidateRoot: string
): CandidatePackage[] {
    const npmDirectory = path.join(candidateRoot, 'npm');
    fs.mkdirSync(npmDirectory, { recursive: true });
    const coreManifest = readJson<PackageManifest>(
        path.join(repositoryRoot, 'package.json')
    );
    if (!coreManifest.name) {
        throw new Error('Core SDK package.json requires a package name');
    }
    if (coreManifest.version !== version) {
        throw new Error(
            `Core SDK is ${coreManifest.version}, expected ${version}`
        );
    }

    const packageArtifacts: StagedPackageArtifact[] = [
        {
            name: coreManifest.name,
            candidateBundleRoot: path.join(candidateRoot, 'core'),
            requiredBundlePaths: requiredNpmBundlePaths(coreManifest),
            ...packPackage('.', npmDirectory, { npmExecutable }),
        },
    ];
    for (const entry of inventory.publishEntries) {
        validatePackageManifest(entry, version);
        const packageJson = readJson<PackageManifest>(
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

function runChecked<T extends string | Buffer>(
    command: string,
    args: string[],
    options: import('node:child_process').SpawnSyncOptions = {}
): import('node:child_process').SpawnSyncReturns<T> {
    const result = spawnSync(
        command,
        args,
        options
    ) as import('node:child_process').SpawnSyncReturns<T>;
    if (result.status !== 0) {
        throw new Error(
            `${command} failed: ${String(result.stderr || '').trim()}`
        );
    }
    return result;
}

function validatePackedBundles(
    packageName: string,
    tarballPath: string,
    candidateBundleRoot: string,
    requiredBundlePaths: string[]
): void {
    const archiveEntries = runChecked<string>('tar', ['-tzf', tarballPath], {
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
        const packedBytes = runChecked<Buffer>(
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

function createCdnArchive(candidateRoot: string): string {
    const archivePath = path.join(candidateRoot, 'cdn-bundles.tgz');
    const tarPath = path.join(candidateRoot, '.cdn-bundles.tar');
    runChecked<string>(
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
        runChecked<Buffer>('gzip', ['-n', '-9', '-c', tarPath], {
            encoding: 'buffer',
            stdio: ['ignore', archiveFile, 'pipe'],
        });
    } finally {
        fs.closeSync(archiveFile);
        fs.rmSync(tarPath, { force: true });
    }

    const archivedFiles = runChecked<string>('tar', ['-tzf', archivePath], {
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

function createFileInventory(candidateRoot: string): CandidateFile[] {
    return listFiles(candidateRoot)
        .filter(filePath => path.basename(filePath) !== 'metadata.json')
        .map(filePath => ({
            path: normalizePath(path.relative(candidateRoot, filePath)),
            size: fs.statSync(filePath).size,
            sha256: sha256(filePath),
        }))
        .sort((left, right) => compareStrings(left.path, right.path));
}

function writeMetadata(
    candidateRoot: string,
    identity: CandidateIdentity,
    packages: CandidatePackage[]
): CandidateMetadata {
    const metadata: CandidateMetadata = {
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

function parseArguments(args: string[]): CandidateOptions {
    const options: Partial<CandidateOptions> = {};
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
    return options as CandidateOptions;
}

function resolveCandidateOutput(
    output: string,
    sourceRoot = repositoryRoot
): string {
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

function assertCleanSource(sourceRoot = repositoryRoot): void {
    const status = run('git', ['status', '--short', '--untracked-files=all'], {
        cwd: sourceRoot,
    });
    if (status) {
        throw new Error(
            `Candidate source contains uncommitted changes:\n${status}`
        );
    }
}

function packageCandidate(options: CandidateOptions): PackageCandidateResult {
    assertCleanSource();
    const inventory = loadReleaseInventory();
    const version = readJson<PackageManifest>(
        path.join(repositoryRoot, 'package.json')
    ).version;
    if (!version) {
        throw new Error('Core SDK package.json requires a version');
    }
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

function main(): void {
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
        console.error(
            error instanceof Error ? error.message : 'Unknown candidate error'
        );
        process.exitCode = 1;
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
