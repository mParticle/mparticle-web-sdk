/* eslint-env node, es2021 */

// Checks a V3 candidate directory against the contract its readers rely on.
// It deliberately shares no code with package-v3-candidate.ts, so a packager
// bug cannot hide itself by also breaking the check.

const nodeCrypto: typeof import('node:crypto') = require('node:crypto');
const fs: typeof import('node:fs') = require('node:fs');
const path: typeof import('node:path') = require('node:path');
const zlib: typeof import('node:zlib') = require('node:zlib');
const nodeUtil: typeof import('node:util') = require('node:util');

interface CheckExpectations {
    version?: string;
    buildId?: string;
}

interface ListedFile {
    path: string;
    size: number;
    sha256: string;
}

interface ArchiveMember {
    path: string;
    directory: boolean;
    bytes: Buffer;
}

const metadataFileName = 'metadata.json';
const cdnArchivePath = 'cdn-bundles.tgz';
const maxMetadataBytes = 10 * 1024 * 1024;
const maxFileBytes = 100 * 1024 * 1024;
const requiredCoreFiles = [
    'core/dist/mparticle.common.js',
    'core/dist/mparticle.esm.js',
    'core/dist/mparticle.js',
    'core/dist/mparticle.stub.js',
];
const metadataKeys = [
    'buildId',
    'files',
    'packages',
    'schemaVersion',
    'sourceSha',
    'version',
];
const fileKeys = ['path', 'sha256', 'size'];
const packageKeys = ['name', 'npmIntegrity', 'path'];
const versionPattern = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;
const buildIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const sourceShaPattern = /^[0-9a-f]{40}$/;
const sha256Pattern = /^[0-9a-f]{64}$/;
const packageNamePattern = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
const coreBundlePattern = /^core\/dist\/[^/]+\.js$/;
const kitBundlePattern = /^(kits\/(?:[^/]+\/)+)dist\/[^/]+\.(?:common|esm|iife)\.js(?:\.map)?$/;
const npmTarballPattern = /^npm\/[^/]+\.tgz$/;
// The private Adobe HeartbeatKit is inlined into the Adobe kits, never shipped.
const heartbeatPattern = /heartbeatkit|adobehbkit/i;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]): boolean {
    return JSON.stringify(Object.keys(value).sort()) === JSON.stringify(keys);
}

function isSafeRelativePath(filePath: unknown): filePath is string {
    if (
        typeof filePath !== 'string' ||
        filePath === '' ||
        filePath.startsWith('/') ||
        /^[A-Za-z]:/.test(filePath) ||
        filePath.includes('\\') ||
        /[\u0000-\u001f\u007f]/.test(filePath)
    ) {
        return false;
    }
    return filePath
        .split('/')
        .every(
            segment => segment !== '' && segment !== '.' && segment !== '..'
        );
}

function sha256Hex(bytes: Buffer): string {
    return nodeCrypto
        .createHash('sha256')
        .update(bytes)
        .digest('hex');
}

function npmIntegrity(bytes: Buffer): string {
    return `sha512-${nodeCrypto
        .createHash('sha512')
        .update(bytes)
        .digest('base64')}`;
}

function isWellFormedIntegrity(value: unknown): value is string {
    if (typeof value !== 'string' || !value.startsWith('sha512-')) {
        return false;
    }
    const encoded = value.slice('sha512-'.length);
    const decoded = Buffer.from(encoded, 'base64');
    return decoded.length === 64 && decoded.toString('base64') === encoded;
}

function readCString(field: Buffer): string {
    const end = field.indexOf(0);
    return field.subarray(0, end === -1 ? field.length : end).toString('utf8');
}

function readOctal(field: Buffer): number {
    if (field[0] & 0x80) {
        throw new Error('base-256 tar numbers are not supported');
    }
    const text = readCString(field).trim();
    if (!/^[0-7]*$/.test(text)) {
        throw new Error(`invalid tar number: ${text}`);
    }
    return text ? parseInt(text, 8) : 0;
}

function readPaxPath(data: Buffer): string | undefined {
    let offset = 0;
    let paxPath: string | undefined;
    while (offset < data.length) {
        const space = data.indexOf(0x20, offset);
        const length =
            space === -1
                ? NaN
                : parseInt(data.subarray(offset, space).toString(), 10);
        if (
            !(length > 0) ||
            offset + length > data.length ||
            data[offset + length - 1] !== 0x0a
        ) {
            throw new Error('invalid pax header');
        }
        const record = data
            .subarray(space + 1, offset + length - 1)
            .toString('utf8');
        if (record.startsWith('path=')) {
            paxPath = record.slice('path='.length);
        } else if (record.startsWith('size=')) {
            throw new Error('pax size overrides are not supported');
        }
        offset += length;
    }
    return paxPath;
}

function isZeroBlock(block: Buffer): boolean {
    return block.every(byte => byte === 0);
}

// The checksum is the unsigned byte sum of the header with its own field
// read as spaces.
function verifyHeaderChecksum(header: Buffer): void {
    const stored = readOctal(header.subarray(148, 156));
    let computed = 0;
    for (let index = 0; index < header.length; index++) {
        computed += index >= 148 && index < 156 ? 0x20 : header[index];
    }
    if (stored !== computed) {
        throw new Error(
            `tar header checksum is ${stored}, computed ${computed}`
        );
    }
}

// POSIX ustar ("ustar\0" "00", also used by pax) or GNU ("ustar  \0").
function isPosixUstar(header: Buffer): boolean {
    const magic = header.subarray(257, 265).toString('latin1');
    if (magic === 'ustar\u000000') {
        return true;
    }
    if (magic === 'ustar  \u0000') {
        return false;
    }
    throw new Error('tar header is not ustar, pax or GNU format');
}

// Reads the ustar, GNU and pax subset that npm and GNU tar write. It checks
// every header checksum, requires the two-zero-block end-of-archive marker
// with nothing but zero padding after it, rejects duplicate paths, and
// rejects links, devices and anything else that is not a plain file or
// directory.
function readTarGz(compressed: Buffer): ArchiveMember[] {
    const tar = zlib.gunzipSync(compressed);
    const members: ArchiveMember[] = [];
    const seen = new Set<string>();
    let overridePath: string | undefined;
    let offset = 0;

    while (offset + 512 <= tar.length) {
        const header = tar.subarray(offset, offset + 512);
        if (isZeroBlock(header)) {
            if (overridePath !== undefined) {
                throw new Error('tar long-name header has no entry');
            }
            const second = tar.subarray(offset + 512, offset + 1024);
            if (second.length !== 512 || !isZeroBlock(second)) {
                throw new Error('tar end-of-archive marker is incomplete');
            }
            if (!isZeroBlock(tar.subarray(offset + 1024))) {
                throw new Error('tar archive has data after end-of-archive');
            }
            return members;
        }
        verifyHeaderChecksum(header);
        const posixUstar = isPosixUstar(header);
        const size = readOctal(header.subarray(124, 136));
        const typeFlag =
            header[156] === 0 ? '0' : String.fromCharCode(header[156]);
        const dataStart = offset + 512;
        const data = tar.subarray(dataStart, dataStart + size);
        offset = dataStart + Math.ceil(size / 512) * 512;
        if (data.length !== size || offset > tar.length) {
            throw new Error('truncated tar entry');
        }

        if (typeFlag === 'L') {
            overridePath = readCString(data);
            continue;
        }
        if (typeFlag === 'x') {
            overridePath = readPaxPath(data) || overridePath;
            continue;
        }
        if (typeFlag === 'g') {
            continue;
        }

        let memberPath = overridePath;
        overridePath = undefined;
        if (memberPath === undefined) {
            const name = readCString(header.subarray(0, 100));
            const prefix = posixUstar
                ? readCString(header.subarray(345, 500))
                : '';
            memberPath = prefix ? `${prefix}/${name}` : name;
        }
        let member: ArchiveMember;
        if (typeFlag === '0') {
            member = {
                path: memberPath,
                directory: false,
                bytes: Buffer.from(data),
            };
        } else if (typeFlag === '5') {
            member = {
                path: memberPath.replace(/\/$/, ''),
                directory: true,
                bytes: Buffer.alloc(0),
            };
        } else {
            throw new Error(
                `unsupported tar entry type '${typeFlag}' for ${memberPath}`
            );
        }
        if (seen.has(member.path)) {
            throw new Error(`tar archive repeats ${member.path}`);
        }
        seen.add(member.path);
        members.push(member);
    }
    throw new Error('tar archive has no end-of-archive marker');
}

// npm tarballs hold everything under package/, with exactly one manifest.
function readNpmManifest(
    tarballPath: string,
    bytes: Buffer,
    errors: string[]
): unknown {
    const members = readTarGz(bytes);
    for (const member of members) {
        if (!isSafeRelativePath(member.path)) {
            errors.push(`${tarballPath} has an unsafe path: ${member.path}`);
        } else if (
            member.path !== 'package' &&
            !member.path.startsWith('package/')
        ) {
            errors.push(
                `${tarballPath} has a member outside package/: ${member.path}`
            );
        }
    }
    const manifests = members.filter(
        member => member.path === 'package/package.json' && !member.directory
    );
    if (manifests.length !== 1) {
        errors.push(`${tarballPath} has no package/package.json`);
        return undefined;
    }
    return JSON.parse(manifests[0].bytes.toString('utf8'));
}

function listDiskFiles(
    candidateDirectory: string,
    errors: string[]
): Map<string, number> {
    const files = new Map<string, number>();
    function visit(directory: string): void {
        for (const entry of fs.readdirSync(directory, {
            withFileTypes: true,
        })) {
            const entryPath = path.join(directory, entry.name);
            const relativePath = path
                .relative(candidateDirectory, entryPath)
                .split(path.sep)
                .join('/');
            const stat = fs.lstatSync(entryPath);
            if (stat.isSymbolicLink()) {
                errors.push(`Symlinks are not allowed: ${relativePath}`);
            } else if (stat.isDirectory()) {
                visit(entryPath);
            } else if (stat.isFile()) {
                files.set(relativePath, stat.size);
            } else {
                errors.push(`Unsupported file type: ${relativePath}`);
            }
        }
    }
    visit(candidateDirectory);
    return files;
}

function readMetadata(
    candidateDirectory: string,
    errors: string[]
): Record<string, unknown> | undefined {
    const metadataPath = path.join(candidateDirectory, metadataFileName);
    const stat = fs.lstatSync(metadataPath, { throwIfNoEntry: false });
    if (!stat || !stat.isFile()) {
        errors.push(`${metadataFileName} is missing or is not a regular file`);
        return undefined;
    }
    if (stat.size > maxMetadataBytes) {
        errors.push(`${metadataFileName} exceeds ${maxMetadataBytes} bytes`);
        return undefined;
    }
    let metadata: unknown;
    try {
        metadata = JSON.parse(
            new nodeUtil.TextDecoder('utf-8', { fatal: true }).decode(
                fs.readFileSync(metadataPath)
            )
        );
    } catch (error) {
        errors.push(
            `${metadataFileName} is not valid UTF-8 JSON: ${
                (error as Error).message
            }`
        );
        return undefined;
    }
    if (!isRecord(metadata) || !hasExactKeys(metadata, metadataKeys)) {
        errors.push(
            `${metadataFileName} must be an object with exactly: ${metadataKeys.join(
                ', '
            )}`
        );
        return undefined;
    }
    return metadata;
}

function checkIdentity(
    metadata: Record<string, unknown>,
    expectations: CheckExpectations,
    errors: string[]
): void {
    if (metadata.schemaVersion !== 1) {
        errors.push(`Unsupported schemaVersion: ${metadata.schemaVersion}`);
    }
    if (
        typeof metadata.version !== 'string' ||
        !versionPattern.test(metadata.version)
    ) {
        errors.push(`version is not a stable semantic version`);
    } else if (
        expectations.version !== undefined &&
        metadata.version !== expectations.version
    ) {
        errors.push(
            `version is ${metadata.version}, expected ${expectations.version}`
        );
    }
    if (
        typeof metadata.buildId !== 'string' ||
        !buildIdPattern.test(metadata.buildId)
    ) {
        errors.push('buildId is invalid');
    } else if (
        expectations.buildId !== undefined &&
        metadata.buildId !== expectations.buildId
    ) {
        errors.push(
            `buildId is ${metadata.buildId}, expected ${expectations.buildId}`
        );
    }
    if (
        typeof metadata.sourceSha !== 'string' ||
        !sourceShaPattern.test(metadata.sourceSha)
    ) {
        errors.push('sourceSha must be a 40-character lowercase hex SHA');
    }
}

function checkListedFiles(
    value: unknown,
    errors: string[]
): Map<string, ListedFile> {
    const files = new Map<string, ListedFile>();
    if (!Array.isArray(value) || value.length === 0) {
        errors.push('files must be a non-empty array');
        return files;
    }
    value.forEach((entry: unknown, index) => {
        if (!isRecord(entry) || !hasExactKeys(entry, fileKeys)) {
            errors.push(
                `files[${index}] must have exactly: path, sha256, size`
            );
            return;
        }
        const { path: filePath, size, sha256 } = entry;
        if (!isSafeRelativePath(filePath)) {
            errors.push(`files[${index}] path is not safe: ${filePath}`);
            return;
        }
        if (filePath === metadataFileName) {
            errors.push(`files must not list ${metadataFileName}`);
            return;
        }
        if (
            typeof size !== 'number' ||
            !Number.isInteger(size) ||
            size <= 0 ||
            size > maxFileBytes
        ) {
            errors.push(`${filePath} has an invalid size: ${size}`);
            return;
        }
        if (typeof sha256 !== 'string' || !sha256Pattern.test(sha256)) {
            errors.push(`${filePath} has an invalid sha256`);
            return;
        }
        if (files.has(filePath)) {
            errors.push(`${filePath} is listed more than once`);
            return;
        }
        files.set(filePath, { path: filePath, size, sha256 });
    });
    return files;
}

function checkLayout(files: Map<string, ListedFile>, errors: string[]): void {
    for (const requiredFile of requiredCoreFiles) {
        if (!files.has(requiredFile)) {
            errors.push(`Required core bundle is not listed: ${requiredFile}`);
        }
    }

    const kits = new Map<string, Set<string>>();
    for (const filePath of Array.from(files.keys())) {
        if (heartbeatPattern.test(filePath)) {
            errors.push(`HeartbeatKit bundles must not ship: ${filePath}`);
        }
        if (
            filePath === cdnArchivePath ||
            coreBundlePattern.test(filePath) ||
            npmTarballPattern.test(filePath)
        ) {
            continue;
        }
        const kitMatch = kitBundlePattern.exec(filePath);
        if (!kitMatch) {
            errors.push(`File is outside the candidate layout: ${filePath}`);
            continue;
        }
        const kitRoot = kitMatch[1];
        const bundles = kits.get(kitRoot) || new Set<string>();
        kits.set(kitRoot, bundles);
        bundles.add(filePath.slice(`${kitRoot}dist/`.length));
    }

    if (!files.has(cdnArchivePath)) {
        errors.push(`${cdnArchivePath} is not listed`);
    }
    if (kits.size === 0) {
        errors.push('No kit bundles are listed');
    }
    // Each kit ships one CommonJS bundle with its IIFE twin, at most one ESM
    // bundle, and source maps only beside a bundle that is also shipped.
    kits.forEach((bundles, kitRoot) => {
        const kitName = kitRoot.slice(0, -1);
        const scripts = Array.from(bundles).filter(
            bundle => !bundle.endsWith('.map')
        );
        const common = scripts.filter(bundle => bundle.endsWith('.common.js'));
        const iife = scripts.filter(bundle => bundle.endsWith('.iife.js'));
        const esm = scripts.filter(bundle => bundle.endsWith('.esm.js'));
        if (common.length !== 1) {
            errors.push(
                `${kitName} must have exactly one CommonJS bundle, found ${common.length}`
            );
        } else if (
            iife.length !== 1 ||
            iife[0] !== common[0].replace(/\.common\.js$/, '.iife.js')
        ) {
            errors.push(
                `${kitName} must have exactly one IIFE bundle named after ${common[0]}`
            );
        }
        if (esm.length > 1) {
            errors.push(`${kitName} has more than one ESM bundle`);
        }
        bundles.forEach(bundle => {
            if (bundle.endsWith('.map') && !bundles.has(bundle.slice(0, -4))) {
                errors.push(
                    `${kitName} has a source map without its bundle: ${bundle}`
                );
            }
        });
    });
}

function checkDiskFiles(
    candidateDirectory: string,
    files: Map<string, ListedFile>,
    errors: string[]
): Map<string, Buffer> {
    const contents = new Map<string, Buffer>();
    const diskFiles = listDiskFiles(candidateDirectory, errors);
    diskFiles.delete(metadataFileName);

    files.forEach((file, filePath) => {
        const diskSize = diskFiles.get(filePath);
        if (diskSize === undefined) {
            errors.push(`Listed file is missing: ${filePath}`);
            return;
        }
        if (diskSize !== file.size) {
            errors.push(
                `${filePath} is ${diskSize} bytes, metadata says ${file.size}`
            );
            return;
        }
        const bytes = fs.readFileSync(path.join(candidateDirectory, filePath));
        if (sha256Hex(bytes) !== file.sha256) {
            errors.push(`${filePath} SHA-256 does not match metadata`);
            return;
        }
        contents.set(filePath, bytes);
    });
    for (const filePath of Array.from(diskFiles.keys())) {
        if (!files.has(filePath)) {
            errors.push(`File is not listed in metadata: ${filePath}`);
        }
    }
    return contents;
}

function checkPackages(
    value: unknown,
    version: unknown,
    files: Map<string, ListedFile>,
    contents: Map<string, Buffer>,
    errors: string[]
): void {
    if (!Array.isArray(value) || value.length === 0) {
        errors.push('packages must be a non-empty array');
        return;
    }
    const names = new Set<string>();
    const tarballs = new Set<string>();
    value.forEach((entry: unknown, index) => {
        if (!isRecord(entry) || !hasExactKeys(entry, packageKeys)) {
            errors.push(
                `packages[${index}] must have exactly: name, npmIntegrity, path`
            );
            return;
        }
        const { name, path: tarballPath, npmIntegrity: integrity } = entry;
        if (typeof name !== 'string' || !packageNamePattern.test(name)) {
            errors.push(`packages[${index}] has an invalid name`);
            return;
        }
        if (names.has(name)) {
            errors.push(`Package ${name} is listed more than once`);
        }
        names.add(name);
        if (heartbeatPattern.test(name)) {
            errors.push(`HeartbeatKit must not ship as a package: ${name}`);
        }
        if (
            typeof tarballPath !== 'string' ||
            !npmTarballPattern.test(tarballPath) ||
            !files.has(tarballPath)
        ) {
            errors.push(`${name} path is not a listed npm/*.tgz file`);
            return;
        }
        if (tarballs.has(tarballPath)) {
            errors.push(`${tarballPath} is claimed by more than one package`);
        }
        tarballs.add(tarballPath);
        if (!isWellFormedIntegrity(integrity)) {
            errors.push(`${name} npmIntegrity is not a sha512 SRI value`);
            return;
        }
        const bytes = contents.get(tarballPath);
        if (!bytes) {
            return;
        }
        if (npmIntegrity(bytes) !== integrity) {
            errors.push(`${name} npmIntegrity does not match ${tarballPath}`);
            return;
        }
        try {
            const packageJson = readNpmManifest(tarballPath, bytes, errors);
            if (packageJson === undefined) {
                return;
            }
            if (!isRecord(packageJson)) {
                errors.push(`${tarballPath} package.json is not an object`);
            } else if (
                packageJson.name !== name ||
                packageJson.version !== version
            ) {
                errors.push(
                    `${tarballPath} contains ${packageJson.name}@${packageJson.version}, expected ${name}@${version}`
                );
            }
        } catch (error) {
            errors.push(
                `${tarballPath} is not a readable npm tarball: ${
                    (error as Error).message
                }`
            );
        }
    });
    files.forEach((file, filePath) => {
        if (npmTarballPattern.test(filePath) && !tarballs.has(filePath)) {
            errors.push(`${filePath} is not claimed by any package`);
        }
    });
}

function checkCdnArchive(
    files: Map<string, ListedFile>,
    contents: Map<string, Buffer>,
    errors: string[]
): void {
    const archive = contents.get(cdnArchivePath);
    if (!archive) {
        return;
    }
    let members: ArchiveMember[];
    try {
        members = readTarGz(archive);
    } catch (error) {
        errors.push(
            `${cdnArchivePath} is not readable: ${(error as Error).message}`
        );
        return;
    }
    const archived = new Set<string>();
    for (const member of members) {
        if (!isSafeRelativePath(member.path)) {
            errors.push(`${cdnArchivePath} has an unsafe path: ${member.path}`);
            continue;
        }
        if (member.directory) {
            continue;
        }
        archived.add(member.path);
        const file = files.get(member.path);
        if (!file || !/^(?:core|kits)\//.test(member.path)) {
            errors.push(
                `${cdnArchivePath} has a member that is not a listed CDN file: ${member.path}`
            );
        } else if (sha256Hex(member.bytes) !== file.sha256) {
            errors.push(`${cdnArchivePath} member differs: ${member.path}`);
        }
    }
    files.forEach((file, filePath) => {
        if (/^(?:core|kits)\//.test(filePath) && !archived.has(filePath)) {
            errors.push(`${cdnArchivePath} is missing ${filePath}`);
        }
    });
}

function checkCandidate(
    candidateDirectory: string,
    expectations: CheckExpectations = {}
): string[] {
    const errors: string[] = [];
    const stat = fs.lstatSync(candidateDirectory, { throwIfNoEntry: false });
    if (!stat || stat.isSymbolicLink() || !stat.isDirectory()) {
        return [`${candidateDirectory} is not a real directory`];
    }
    const metadata = readMetadata(candidateDirectory, errors);
    if (!metadata) {
        return errors;
    }
    checkIdentity(metadata, expectations, errors);
    const files = checkListedFiles(metadata.files, errors);
    checkLayout(files, errors);
    const contents = checkDiskFiles(candidateDirectory, files, errors);
    checkPackages(metadata.packages, metadata.version, files, contents, errors);
    checkCdnArchive(files, contents, errors);
    return errors;
}

function parseArguments(
    args: string[]
): { candidateDirectory: string; expectations: CheckExpectations } {
    let candidateDirectory: string | undefined;
    const expectations: CheckExpectations = {};
    for (let index = 0; index < args.length; index++) {
        const argument = args[index];
        if (argument === '--version' || argument === '--build-id') {
            const value = args[++index];
            if (!value) {
                throw new Error(`${argument} requires a value`);
            }
            expectations[
                argument === '--version' ? 'version' : 'buildId'
            ] = value;
        } else if (
            !argument.startsWith('-') &&
            candidateDirectory === undefined
        ) {
            candidateDirectory = argument;
        } else {
            throw new Error(`Unexpected argument: ${argument}`);
        }
    }
    if (!candidateDirectory) {
        throw new Error(
            'Usage: check-v3-candidate.ts <candidate-directory> [--version <version>] [--build-id <build-id>]'
        );
    }
    return { candidateDirectory, expectations };
}

function main(): void {
    const { candidateDirectory, expectations } = parseArguments(
        process.argv.slice(2)
    );
    const errors = checkCandidate(candidateDirectory, expectations);
    if (errors.length) {
        console.error(
            `V3 candidate check failed with ${errors.length} problem(s):`
        );
        for (const error of errors) {
            console.error(`- ${error}`);
        }
        process.exitCode = 1;
        return;
    }
    const metadata = JSON.parse(
        fs.readFileSync(path.join(candidateDirectory, metadataFileName), 'utf8')
    );
    console.log(
        `V3 candidate ${metadata.version}/${metadata.buildId} passed: ${metadata.files.length} files, ${metadata.packages.length} packages`
    );
}

if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error(
            error instanceof Error ? error.message : 'Unknown checker error'
        );
        process.exitCode = 1;
    }
}

const checkV3Candidate = { checkCandidate, parseArguments, readTarGz };

module.exports = checkV3Candidate;

export type CheckV3CandidateModule = typeof checkV3Candidate;
