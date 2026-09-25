/* eslint-env node, es2021 */

const nodeCrypto: typeof import('node:crypto') = require('node:crypto');
const fs: typeof import('node:fs') = require('node:fs');
const path: typeof import('node:path') = require('node:path');
const zlib: typeof import('node:zlib') = require('node:zlib');
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
    timeout?: number;
}

interface PackageLock {
    version?: string;
    packages?: Record<string, { version?: string }>;
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
    version: string;
    buildId: string;
    output: string;
}

interface PackageCandidateResult {
    outputPath: string;
    metadata: CandidateMetadata;
    metadataSha256: string;
}

interface RunOptions {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    stdio?: import('node:child_process').StdioOptions;
    timeout?: number;
}

const {
    loadReleaseInventory,
    validateVersion,
}: {
    loadReleaseInventory: () => ReleaseInventory;
    validateVersion: (version: unknown) => void;
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
// A bare "npm" would resolve to node_modules/.bin/npm when run via npm run.
const npmExecutable = path.join(
    path.dirname(process.execPath),
    process.platform === 'win32' ? 'npm.cmd' : 'npm'
);
const candidateUmask = 0o022;
const commandTimeoutMs = 5 * 60 * 1000;
const maxOutputBytes = 256 * 1024 * 1024;
// zlib writes the build platform into the gzip OS byte (19 on macOS).
const gzipOsUnix = 3;
const coreBundlePaths = [
    'dist/mparticle.common.js',
    'dist/mparticle.esm.js',
    'dist/mparticle.js',
    'dist/mparticle.stub.js',
];
let resolvedGnuTar: string | undefined;
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
        maxBuffer: maxOutputBytes,
        stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
        timeout: options.timeout || commandTimeoutMs,
    });
    return output ? output.trim() : '';
}

function applyCandidateUmask(): number {
    return process.umask(candidateUmask);
}

function findGnuTar(environment: NodeJS.ProcessEnv = process.env): string {
    if (environment.TAR && !path.isAbsolute(environment.TAR)) {
        throw new Error('TAR must be an absolute path to GNU tar');
    }
    for (const candidate of environment.TAR
        ? [environment.TAR]
        : ['gtar', 'tar']) {
        const result = spawnSync(candidate, ['--version'], {
            encoding: 'utf8',
            timeout: commandTimeoutMs,
        });
        if (
            !result.error &&
            result.status === 0 &&
            /\bGNU tar\b/.test(result.stdout)
        ) {
            return candidate;
        }
    }
    throw new Error(
        environment.TAR
            ? `TAR=${environment.TAR} is not GNU tar`
            : 'GNU tar is required; install it (for example, brew install gnu-tar) or set TAR to its absolute path'
    );
}

function gnuTar(): string {
    if (!resolvedGnuTar) {
        resolvedGnuTar = findGnuTar();
    }
    return resolvedGnuTar;
}

function gzipDeterministic(bytes: Buffer): Buffer {
    const compressed = zlib.gzipSync(bytes, { level: 9 });
    compressed[9] = gzipOsUnix;
    return compressed;
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
    packageJson: PackageManifest,
    producesMaps = false
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
        .flatMap(bundlePath => {
            const normalized = normalizePath(
                path.join(entry.local_path, bundlePath)
            );
            return producesMaps
                ? [normalized, `${normalized}.map`]
                : [normalized];
        })
        .sort(compareStrings);
}

function expectedBundlePaths(inventory: ReleaseInventory): string[] {
    // Core bundles: the production rollup build (ENVIRONMENT=prod) sets
    // sourcemap: false, so no .map files are produced.
    const paths = [...coreBundlePaths];

    for (const entry of inventory.publishEntries) {
        const packageJson = readJson<PackageManifest>(
            path.join(repositoryRoot, entry.local_path, 'package.json')
        );
        // Only Vite-built kits (rokt, roktpayplus) produce source maps.
        const producesMaps = fs.existsSync(
            path.join(repositoryRoot, entry.local_path, 'vite.config.ts')
        );
        paths.push(...expectedKitBundlePaths(entry, packageJson, producesMaps));
    }
    // Adobe HeartbeatKit: sourcemap is gated on V3_CANDIDATE_SOURCEMAPS which
    // is not set during release.sh, so no .map files are produced.
    for (const bundlePath of privateBundlePaths) {
        paths.push(bundlePath);
    }
    return paths.sort(compareStrings);
}

function validateCandidateManifests(
    inventory: ReleaseInventory,
    coreManifest: PackageManifest,
    packageLock: PackageLock
): string {
    const version = coreManifest.version;
    validateVersion(version);
    if (!coreManifest.name) {
        throw new Error('Core SDK package.json requires a package name');
    }
    const lockRoot = packageLock.packages && packageLock.packages[''];
    const lockVersion = lockRoot && lockRoot.version;
    if (packageLock.version !== version || lockVersion !== version) {
        throw new Error(
            `Core SDK package-lock.json is ${packageLock.version}/${lockVersion}, expected ${version}`
        );
    }
    for (const entry of inventory.publishEntries) {
        const packageJson = readJson<PackageManifest>(
            path.join(repositoryRoot, entry.local_path, 'package.json')
        );
        if (packageJson.name !== entry.name) {
            throw new Error(
                `${entry.local_path}/package.json is ${packageJson.name}, expected ${entry.name}`
            );
        }
        if (packageJson.version !== version) {
            throw new Error(
                `${entry.name} is ${packageJson.version}, expected ${version}`
            );
        }
    }
    expectedBundlePaths(inventory);
    return version as string;
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

function validateBuiltBundles(
    inventory: ReleaseInventory,
    sourceRoot = repositoryRoot
): string[] {
    const expected = expectedBundlePaths(inventory);
    const expectedSet = new Set(expected);
    const actual = [
        ...listFiles(path.join(sourceRoot, 'dist')),
        ...inventory.publishEntries.flatMap(entry =>
            listFiles(path.join(sourceRoot, entry.local_path, 'dist'))
        ),
        ...listFiles(path.join(sourceRoot, 'kits/adobe/HeartbeatKit/dist')),
    ]
        .map(filePath => normalizePath(path.relative(sourceRoot, filePath)))
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

function copyBundles(
    bundlePaths: string[],
    candidateRoot: string,
    sourceRoot = repositoryRoot
): void {
    for (const bundlePath of bundlePaths) {
        const sourcePath = path.join(sourceRoot, bundlePath);
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
    coreManifest: PackageManifest,
    version: string,
    candidateRoot: string
): CandidatePackage[] {
    const npmDirectory = path.join(candidateRoot, 'npm');
    fs.mkdirSync(npmDirectory, { recursive: true });
    const packOptions: PackPackageOptions = {
        npmExecutable,
        timeout: commandTimeoutMs,
    };

    const packageArtifacts: StagedPackageArtifact[] = [
        {
            name: coreManifest.name as string,
            candidateBundleRoot: path.join(candidateRoot, 'core'),
            requiredBundlePaths: requiredNpmBundlePaths(coreManifest),
            ...packPackage('.', npmDirectory, packOptions),
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
            ...packPackage(entry.local_path, npmDirectory, packOptions),
        });
    }

    const tarballNames = new Set();
    return packageArtifacts
        .map(artifact => {
            validatePackedModes(artifact.name, artifact.tarballPath);
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
    const result = spawnSync(command, args, {
        maxBuffer: maxOutputBytes,
        timeout: commandTimeoutMs,
        ...options,
    }) as import('node:child_process').SpawnSyncReturns<T>;
    if (result.error || result.status !== 0) {
        const reason = result.error
            ? result.error.message
            : result.signal
            ? `signal ${result.signal}`
            : `exit ${result.status}`;
        throw new Error(
            `${command} ${args.join(' ')} failed (${reason}): ${String(
                result.stderr || ''
            ).trim()}`
        );
    }
    return result;
}

function validatePackedModes(packageName: string, tarballPath: string): void {
    const entries = runChecked<string>(
        gnuTar(),
        ['--numeric-owner', '-tvzf', tarballPath],
        { encoding: 'utf8' }
    ).stdout.split('\n');
    for (const entry of entries.filter(Boolean)) {
        const mode = entry.slice(0, 10);
        if (mode !== '-rw-r--r--' && mode !== '-rwxr-xr-x') {
            throw new Error(
                `${packageName} npm tarball has a non-portable entry: ${entry}`
            );
        }
    }
}

function validatePackedBundles(
    packageName: string,
    tarballPath: string,
    candidateBundleRoot: string,
    requiredBundlePaths: string[]
): void {
    const archiveEntries = runChecked<string>(gnuTar(), ['-tzf', tarballPath], {
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
            gnuTar(),
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
        gnuTar(),
        [
            '--format=gnu',
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
    try {
        fs.writeFileSync(
            archivePath,
            gzipDeterministic(fs.readFileSync(tarPath))
        );
    } finally {
        fs.rmSync(tarPath, { force: true });
    }

    const archivedFiles = runChecked<string>(gnuTar(), ['-tzf', archivePath], {
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
    for (const archivedFile of archivedFiles) {
        const stagedPath = path.join(candidateRoot, archivedFile);
        const extractedBytes = runChecked<Buffer>(
            gnuTar(),
            ['-xOzf', archivePath, archivedFile],
            { encoding: 'buffer' }
        ).stdout;
        if (sha256Bytes(extractedBytes) !== sha256(stagedPath)) {
            throw new Error(
                `CDN archive member differs from staged file: ${archivedFile}`
            );
        }
    }
    return archivePath;
}

function createFileInventory(candidateRoot: string): CandidateFile[] {
    return listFiles(candidateRoot)
        .map(filePath => ({
            filePath,
            relativePath: normalizePath(path.relative(candidateRoot, filePath)),
        }))
        .filter(({ relativePath }) => relativePath !== 'metadata.json')
        .map(({ filePath, relativePath }) => {
            const size = fs.statSync(filePath).size;
            if (size === 0) {
                throw new Error(`Candidate file is empty: ${relativePath}`);
            }
            return { path: relativePath, size, sha256: sha256(filePath) };
        })
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
    let version: string | undefined;
    const explicit: Partial<Pick<CandidateOptions, 'buildId' | 'output'>> = {};

    for (let index = 0; index < args.length; index++) {
        const argument = args[index];
        if (argument === '--build-id' || argument === '--output') {
            const value = args[++index];
            if (!value) {
                throw new Error(`${argument} requires a value`);
            }
            explicit[argument === '--build-id' ? 'buildId' : 'output'] = value;
        } else if (!argument.startsWith('-')) {
            if (version !== undefined) {
                throw new Error(`Unexpected positional argument: ${argument}`);
            }
            version = argument;
        } else {
            throw new Error(`Unknown argument: ${argument}`);
        }
    }

    if (!version) {
        throw new Error('version is required');
    }
    validateVersion(version);

    // Build ID: explicit > GITHUB_RUN_ID env var > local timestamp
    const rawBuildId =
        explicit.buildId || process.env.GITHUB_RUN_ID || `local-${Date.now()}`;

    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(rawBuildId)) {
        throw new Error(
            '--build-id must contain only letters, numbers, dots, underscores, and hyphens'
        );
    }

    const buildId = rawBuildId;
    const output = explicit.output || `out/candidate-${version}-${buildId}`;

    if (
        path.isAbsolute(output) ||
        path.win32.isAbsolute(output) ||
        output.split(/[\\/]/).includes('..') ||
        output === '.'
    ) {
        throw new Error(
            '--output must be a relative path inside the repository'
        );
    }

    return { version, buildId, output };
}

function isRealDirectory(directory: string): boolean {
    const stat = fs.lstatSync(directory, { throwIfNoEntry: false });
    if (!stat) {
        return false;
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
        throw new Error(
            `${directory} must be a real directory, not a symlink or file`
        );
    }
    return true;
}

function candidateOutputDirectories(
    output: string,
    sourceRoot: string
): string[] {
    const realRepositoryRoot = fs.realpathSync(sourceRoot);
    const outputRoot = path.join(realRepositoryRoot, 'out');
    const outputPath = path.resolve(realRepositoryRoot, output);
    if (!outputPath.startsWith(`${outputRoot}${path.sep}`)) {
        throw new Error(
            '--output must be inside the repository out/ directory'
        );
    }
    const directories = [outputRoot];
    for (const segment of path
        .relative(outputRoot, outputPath)
        .split(path.sep)) {
        directories.push(
            path.join(directories[directories.length - 1], segment)
        );
    }
    return directories;
}

// Every existing directory from out/ to the output must be a real directory,
// so symlinks cannot redirect the output even inside the repository.
function resolveCandidateOutput(
    output: string,
    sourceRoot = repositoryRoot
): string {
    const directories = candidateOutputDirectories(output, sourceRoot);
    const outputPath = directories[directories.length - 1];
    for (const directory of directories.slice(0, -1)) {
        if (!isRealDirectory(directory)) {
            break;
        }
    }
    if (fs.lstatSync(outputPath, { throwIfNoEntry: false })) {
        throw new Error(`Candidate output already exists: ${outputPath}`);
    }
    return outputPath;
}

function createCandidateOutput(
    output: string,
    sourceRoot = repositoryRoot
): string {
    const directories = candidateOutputDirectories(output, sourceRoot);
    const outputPath = directories[directories.length - 1];
    for (const directory of directories.slice(0, -1)) {
        if (!isRealDirectory(directory)) {
            fs.mkdirSync(directory);
        }
    }
    try {
        fs.mkdirSync(outputPath);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
            throw new Error(`Candidate output already exists: ${outputPath}`);
        }
        throw error;
    }
    if (fs.realpathSync(outputPath) !== outputPath) {
        throw new Error(
            `Candidate output moved during creation: ${outputPath}`
        );
    }
    return outputPath;
}

function packageCandidate(options: CandidateOptions): PackageCandidateResult {
    applyCandidateUmask();
    gnuTar();
    const inventory = loadReleaseInventory();
    const coreManifest = readJson<PackageManifest>(
        path.join(repositoryRoot, 'package.json')
    );
    const resolvedVersion = validateCandidateManifests(
        inventory,
        coreManifest,
        readJson<PackageLock>(path.join(repositoryRoot, 'package-lock.json'))
    );
    if (resolvedVersion !== options.version) {
        throw new Error(
            `package.json version is ${resolvedVersion}, expected ${options.version}`
        );
    }
    const sourceSha = run('git', ['rev-parse', 'HEAD']);
    const bundlePaths = validateBuiltBundles(inventory);
    const outputPath = createCandidateOutput(options.output);

    // metadata.json is written last, so its presence marks a complete output.
    try {
        copyBundles(bundlePaths, outputPath);
        const packages = packPackages(
            inventory,
            coreManifest,
            options.version,
            outputPath
        );
        createCdnArchive(outputPath);
        const metadata = writeMetadata(
            outputPath,
            {
                version: options.version,
                sourceSha,
                buildId: options.buildId,
            },
            packages
        );
        return {
            outputPath,
            metadata,
            metadataSha256: sha256(path.join(outputPath, 'metadata.json')),
        };
    } catch (error) {
        fs.rmSync(outputPath, { force: true, recursive: true });
        throw error;
    }
}

function main(): void {
    const options = parseArguments(process.argv.slice(2));
    const result = packageCandidate(options);
    console.log(
        `Created V3 candidate ${result.metadata.version}/${result.metadata.buildId} with ${result.metadata.files.length} files at ${result.outputPath}`
    );
    console.log(`metadata.json SHA-256: ${result.metadataSha256}`);
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
    applyCandidateUmask,
    copyBundles,
    createCandidateOutput,
    createCdnArchive,
    createFileInventory,
    expectedBundlePaths,
    expectedKitBundlePaths,
    findGnuTar,
    gzipDeterministic,
    npmExecutable,
    parseArguments,
    requiredNpmBundlePaths,
    resolveCandidateOutput,
    sha256,
    validateBuiltBundles,
    validateCandidateManifests,
    validatePackedBundles,
    validatePackedModes,
    writeMetadata,
};
