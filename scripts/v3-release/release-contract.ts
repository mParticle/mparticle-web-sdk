/* eslint-env node, es2021 */

// Schema-1 contract shared by the V3 candidate uploader and release promoter.
// Every rule the server-side reader enforces is mirrored here. Producers are
// stricter than the reader: documents must be byte-for-byte canonical, hex is
// lowercase, inventories are sorted, and versions are V3.

const nodeCrypto: typeof import('node:crypto') = require('node:crypto');
const { TextDecoder }: typeof import('node:util') = require('node:util');

export interface CandidateFile {
    path: string;
    size: number;
    sha256: string;
}

export interface CandidatePackage {
    name: string;
    path: string;
    npmIntegrity: string;
}

export interface CandidateMetadata {
    schemaVersion: 1;
    version: string;
    sourceSha: string;
    buildId: string;
    packages: CandidatePackage[];
    files: CandidateFile[];
}

export interface ActiveReleasePointer {
    schemaVersion: 1;
    version: string;
    buildId: string;
    candidatePrefix: string;
    metadataSha256: string;
    // Optional in schema 1. Accepted when present; never written.
    channel?: string;
}

export interface CandidateIdentity {
    version: string;
    buildId: string;
}

export interface ObjectHeaders {
    contentType: string;
    cacheControl: string;
}

export interface ParseOptions {
    // false accepts any document the reader accepts; true (the default) also
    // requires the exact bytes this module would write.
    canonical?: boolean;
}

export interface PointerParseOptions extends ParseOptions {
    // When set, a pointer that names a different channel is rejected.
    expectedChannel?: string;
}

class ReleaseContractError extends Error {
    constructor(message: string) {
        super(message);
        // Keeps instanceof working when compiled to ES5 (as Jest does).
        Object.setPrototypeOf(this, ReleaseContractError.prototype);
        this.name = 'ReleaseContractError';
    }
}

const SCHEMA_VERSION = 1;
const RELEASE_ROOT = 'web-sdk/v3';
const CANDIDATES_PREFIX = `${RELEASE_ROOT}/candidates/`;
const CHANNELS_PREFIX = `${RELEASE_ROOT}/channels/`;
const POINTER_FILE_NAME = 'active-release.json';
const METADATA_FILE_NAME = 'metadata.json';

// Limits equal the reader's.
const MAX_POINTER_BYTES = 64 * 1024;
const MAX_METADATA_BYTES = 10 * 1024 * 1024;
const MAX_CANDIDATE_FILE_BYTES = 100 * 1024 * 1024;
// Producer-only cap; the reader has none.
const MAX_BUILD_ID_LENGTH = 64;

const REQUIRED_CORE_FILES: readonly string[] = [
    'core/dist/mparticle.common.js',
    'core/dist/mparticle.esm.js',
    'core/dist/mparticle.js',
    'core/dist/mparticle.stub.js',
];

// Release-order names match the server's stored release-order values; "ga"
// serves every workspace without one.
const CHANNELS: readonly string[] = [
    'ga',
    'v3-staging',
    'v3-release-order-a',
    'v3-release-order-b',
    'v3-release-order-c',
];
const STAGING_CHANNEL = 'v3-staging';
const GA_CHANNEL = 'ga';
const RELEASE_ORDER_CHANNELS: readonly string[] = [
    'v3-release-order-a',
    'v3-release-order-b',
    'v3-release-order-c',
];

// Without the m flag, "$" matches only at the very end of input (no trailing
// newline allowed), which is how the reader anchors its patterns.
const CHANNEL_PATTERN = /^(?:ga|v3-staging|v3-release-order-[abc])$/;
const BUILD_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const VERSION_PATTERN = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const READER_SHA256_PATTERN = /^[a-fA-F0-9]{64}$/;
const READER_SOURCE_SHA_PATTERN = /^[a-fA-F0-9]{40}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const SOURCE_SHA_PATTERN = /^[0-9a-f]{40}$/;
// The reader's control characters: C0 controls, DEL and C1 controls.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f-\u009f]/;
// The packager's layout. Producers reject anything else, so an untrusted
// candidate directory cannot smuggle other paths into a candidate prefix.
// Kits sit one to three directories below kits/ (for example
// kits/adobe/packages/AdobeClient).
const FILE_NAME = '[A-Za-z0-9][A-Za-z0-9._-]*';
const CANDIDATE_LAYOUT_PATTERNS: readonly RegExp[] = [
    new RegExp(`^core/dist/${FILE_NAME}\\.js$`),
    new RegExp(
        `^kits/${FILE_NAME}(?:/${FILE_NAME}){0,2}/dist/${FILE_NAME}\\.js(?:\\.map)?$`
    ),
    new RegExp(`^npm/${FILE_NAME}\\.tgz$`),
    /^cdn-bundles\.tgz$/,
];

const JAVASCRIPT_CONTENT_TYPE = 'application/javascript; charset=utf-8';
const JSON_CONTENT_TYPE = 'application/json';
const GZIP_CONTENT_TYPE = 'application/gzip';
const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const POINTER_CACHE_CONTROL = 'no-cache';
const POINTER_HEADERS: ObjectHeaders = {
    contentType: JSON_CONTENT_TYPE,
    cacheControl: POINTER_CACHE_CONTROL,
};

const POINTER_KEYS = [
    'schemaVersion',
    'version',
    'buildId',
    'candidatePrefix',
    'metadataSha256',
];
const METADATA_KEYS = [
    'schemaVersion',
    'version',
    'sourceSha',
    'buildId',
    'packages',
    'files',
];
const PACKAGE_KEYS = ['name', 'path', 'npmIntegrity'];
const FILE_KEYS = ['path', 'size', 'sha256'];

function fail(message: string): never {
    throw new ReleaseContractError(message);
}

// Same ordering as the packager (UTF-16 code units), which agrees with the
// ordinal ordering used by the reader.
function compareStrings(left: string, right: string): number {
    return left < right ? -1 : left > right ? 1 : 0;
}

function compareNumericIdentifiers(left: string, right: string): number {
    const a = left.replace(/^0+(?=[0-9])/, '');
    const b = right.replace(/^0+(?=[0-9])/, '');
    return a.length !== b.length
        ? a.length < b.length
            ? -1
            : 1
        : compareStrings(a, b);
}

// SemVer 2.0 precedence (section 11): numeric core, then a release outranks
// its prereleases, then prerelease identifiers left to right. Build metadata
// is ignored, so 3.1.0+a and 3.1.0+b compare equal.
function compareVersions(left: string, right: string): number {
    if (!isReaderVersion(left) || !isReaderVersion(right)) {
        fail('Version must be a SemVer 2.0 version');
    }
    const split = (version: string) => {
        const withoutBuild = version.split('+')[0];
        const dash = withoutBuild.indexOf('-');
        const core = dash === -1 ? withoutBuild : withoutBuild.slice(0, dash);
        const prerelease =
            dash === -1 ? [] : withoutBuild.slice(dash + 1).split('.');
        return { core: core.split('.'), prerelease };
    };
    const a = split(left);
    const b = split(right);
    for (let index = 0; index < 3; index++) {
        const result = compareNumericIdentifiers(a.core[index], b.core[index]);
        if (result !== 0) {
            return result;
        }
    }
    if (a.prerelease.length === 0 && b.prerelease.length === 0) {
        return 0;
    }
    if (a.prerelease.length === 0) {
        return 1;
    }
    if (b.prerelease.length === 0) {
        return -1;
    }
    for (
        let index = 0;
        index < Math.min(a.prerelease.length, b.prerelease.length);
        index++
    ) {
        const x = a.prerelease[index];
        const y = b.prerelease[index];
        const xNumeric = /^[0-9]+$/.test(x);
        const yNumeric = /^[0-9]+$/.test(y);
        let result: number;
        if (xNumeric && yNumeric) {
            result = compareNumericIdentifiers(x, y);
        } else if (xNumeric !== yNumeric) {
            result = xNumeric ? -1 : 1;
        } else {
            result = compareStrings(x, y);
        }
        if (result !== 0) {
            return result;
        }
    }
    return Math.sign(a.prerelease.length - b.prerelease.length);
}

function sha256Hex(bytes: Uint8Array): string {
    return nodeCrypto
        .createHash('sha256')
        .update(bytes)
        .digest('hex');
}

function sha256Base64(bytes: Uint8Array): string {
    return nodeCrypto
        .createHash('sha256')
        .update(bytes)
        .digest('base64');
}

function npmIntegrityFor(bytes: Uint8Array): string {
    return `sha512-${nodeCrypto
        .createHash('sha512')
        .update(bytes)
        .digest('base64')}`;
}

function isSafeObjectPath(value: unknown): value is string {
    if (
        typeof value !== 'string' ||
        value.trim() === '' ||
        value.startsWith('/') ||
        value.includes('\\') ||
        CONTROL_CHARACTER_PATTERN.test(value)
    ) {
        return false;
    }
    return value
        .split('/')
        .every(
            segment => segment !== '' && segment !== '.' && segment !== '..'
        );
}

function isCandidateLayoutPath(value: unknown): value is string {
    return (
        isSafeObjectPath(value) &&
        CANDIDATE_LAYOUT_PATTERNS.some(pattern => pattern.test(value))
    );
}

function isValidChannel(value: unknown): value is string {
    return typeof value === 'string' && CHANNEL_PATTERN.test(value);
}

function isReaderVersion(value: unknown): value is string {
    return typeof value === 'string' && VERSION_PATTERN.test(value);
}

function isReaderBuildId(value: unknown): value is string {
    return typeof value === 'string' && BUILD_ID_PATTERN.test(value);
}

function validateChannel(value: unknown): string {
    if (!isValidChannel(value)) {
        fail(`Channel must be one of: ${CHANNELS.join(', ')}`);
    }
    return value;
}

function validateVersion(value: unknown): string {
    if (!isReaderVersion(value)) {
        fail('Version must be a SemVer 2.0 version');
    }
    if (!value.startsWith('3.')) {
        fail('Version must be a V3 version');
    }
    // Producer-only, as is the leading-zero rule below: the reader accepts
    // build metadata, but 3.1.0, 3.1.0+a and 3.1.0+b compare equal while
    // naming different candidate prefixes.
    if (value.includes('+')) {
        fail('Version must not have build metadata');
    }
    // Producer-only (SemVer 2.0 section 9): the reader accepts rc.01, which
    // would compare equal to rc.1 while naming a different candidate prefix.
    const dash = value.indexOf('-');
    if (
        dash !== -1 &&
        value
            .slice(dash + 1)
            .split('.')
            .some(identifier => /^0[0-9]+$/.test(identifier))
    ) {
        fail('Version prerelease numbers must not have leading zeros');
    }
    return value;
}

function validateBuildId(value: unknown): string {
    if (!isReaderBuildId(value) || value.length > MAX_BUILD_ID_LENGTH) {
        fail(
            `Build ID must match ${BUILD_ID_PATTERN.source} and be at most ${MAX_BUILD_ID_LENGTH} characters`
        );
    }
    return value;
}

function validateSha256(value: unknown, description: string): string {
    if (typeof value !== 'string' || !SHA256_PATTERN.test(value)) {
        fail(`${description} must be 64 lowercase hexadecimal characters`);
    }
    return value;
}

function candidatePrefix(version: string, buildId: string): string {
    return `${CANDIDATES_PREFIX}${validateVersion(version)}/${validateBuildId(
        buildId
    )}/`;
}

function candidateKey(
    version: string,
    buildId: string,
    relativePath: string
): string {
    if (!isSafeObjectPath(relativePath)) {
        fail('Candidate file path is not a safe object path');
    }
    return `${candidatePrefix(version, buildId)}${relativePath}`;
}

function metadataKey(version: string, buildId: string): string {
    return candidateKey(version, buildId, METADATA_FILE_NAME);
}

function pointerKey(channel: string): string {
    return `${CHANNELS_PREFIX}${validateChannel(channel)}/${POINTER_FILE_NAME}`;
}

function isCandidateKey(key: string): boolean {
    return key.startsWith(CANDIDATES_PREFIX) && isSafeObjectPath(key);
}

function isPointerKey(key: string): boolean {
    return CHANNELS.some(channel => key === pointerKey(channel));
}

function serializeCanonical(value: unknown): Buffer {
    return Buffer.from(`${JSON.stringify(value, null, 4)}\n`, 'utf8');
}

function decodeStrictUtf8(bytes: Uint8Array, description: string): string {
    let text: string;
    try {
        text = new TextDecoder('utf-8', {
            fatal: true,
            ignoreBOM: true,
        }).decode(bytes);
    } catch {
        return fail(`${description} is not valid UTF-8`);
    }
    if (text.charCodeAt(0) === 0xfeff) {
        fail(`${description} must not start with a byte order mark`);
    }
    return text;
}

function parseJsonObject(
    bytes: Uint8Array,
    maxBytes: number,
    description: string
): { text: string; value: Record<string, unknown> } {
    if (bytes.length > maxBytes) {
        fail(`${description} exceeds its allowed size`);
    }
    const text = decodeStrictUtf8(bytes, description);
    let value: unknown;
    try {
        value = JSON.parse(text);
    } catch {
        return fail(`${description} is not valid JSON`);
    }
    if (!isPlainObject(value)) {
        fail(`${description} must be a JSON object`);
    }
    return { text, value };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireKeys(
    value: Record<string, unknown>,
    keys: string[],
    description: string
): void {
    for (const key of keys) {
        if (!Object.prototype.hasOwnProperty.call(value, key)) {
            fail(`${description} is missing ${key}`);
        }
    }
}

function requireCanonical(
    text: string,
    normalized: unknown,
    description: string
): void {
    if (serializeCanonical(normalized).toString('utf8') !== text) {
        fail(
            `${description} is not canonical schema-1 JSON (unknown or duplicate fields, field order, formatting, or sort order)`
        );
    }
}

function isValidNpmIntegrity(value: unknown, canonical: boolean): boolean {
    const prefix = 'sha512-';
    if (
        typeof value !== 'string' ||
        value.trim() === '' ||
        !value.startsWith(prefix)
    ) {
        return false;
    }
    const encoded = value.slice(prefix.length);
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded) || encoded.length % 4 !== 0) {
        return false;
    }
    const decoded = Buffer.from(encoded, 'base64');
    return (
        decoded.length === 64 &&
        (!canonical || decoded.toString('base64') === encoded)
    );
}

function parsePointer(
    bytes: Uint8Array,
    options: PointerParseOptions = {}
): ActiveReleasePointer {
    const canonical = options.canonical !== false;
    const description = 'Active release pointer';
    const { text, value } = parseJsonObject(
        bytes,
        MAX_POINTER_BYTES,
        description
    );
    requireKeys(value, POINTER_KEYS, description);
    if (value.schemaVersion !== SCHEMA_VERSION) {
        fail(`${description} schema version is not supported`);
    }
    if (!isReaderVersion(value.version)) {
        fail(`${description} version is invalid`);
    }
    if (!isReaderBuildId(value.buildId)) {
        fail(`${description} build ID is invalid`);
    }
    if (
        typeof value.metadataSha256 !== 'string' ||
        !READER_SHA256_PATTERN.test(value.metadataSha256)
    ) {
        fail(`${description} metadata SHA-256 digest is invalid`);
    }
    const prefix = value.candidatePrefix;
    if (typeof prefix !== 'string' || !prefix.endsWith('/')) {
        fail(`${description} candidate prefix must end with '/'`);
    }
    if (!isSafeObjectPath(prefix.slice(0, -1))) {
        fail(`${description} candidate prefix is not a safe object path`);
    }
    if (prefix !== `${CANDIDATES_PREFIX}${value.version}/${value.buildId}/`) {
        fail(
            `${description} candidate prefix does not match its version and build ID`
        );
    }

    const hasChannel = Object.prototype.hasOwnProperty.call(value, 'channel');
    if (hasChannel && !isValidChannel(value.channel)) {
        fail(`${description} channel is invalid`);
    }
    if (
        hasChannel &&
        options.expectedChannel !== undefined &&
        value.channel !== options.expectedChannel
    ) {
        fail(`${description} names a different channel`);
    }

    const pointer: ActiveReleasePointer = {
        schemaVersion: SCHEMA_VERSION,
        version: value.version,
        buildId: value.buildId,
        candidatePrefix: prefix,
        metadataSha256: value.metadataSha256,
    };
    if (hasChannel) {
        pointer.channel = value.channel as string;
    }
    if (canonical) {
        validateVersion(pointer.version);
        validateBuildId(pointer.buildId);
        validateSha256(
            pointer.metadataSha256,
            `${description} metadata SHA-256`
        );
        requireCanonical(text, pointer, description);
    }
    return pointer;
}

function createPointer(
    identity: CandidateIdentity,
    metadataSha256: string
): ActiveReleasePointer {
    return {
        schemaVersion: SCHEMA_VERSION,
        version: validateVersion(identity.version),
        buildId: validateBuildId(identity.buildId),
        candidatePrefix: candidatePrefix(identity.version, identity.buildId),
        metadataSha256: validateSha256(metadataSha256, 'Metadata SHA-256'),
    };
}

// Writes exactly the five required fields. The optional "channel" field is
// accepted on read but not written, so every pointer this module writes is
// readable by a reader that predates it.
function serializePointer(pointer: ActiveReleasePointer): Buffer {
    const bytes = serializeCanonical({
        schemaVersion: pointer.schemaVersion,
        version: pointer.version,
        buildId: pointer.buildId,
        candidatePrefix: pointer.candidatePrefix,
        metadataSha256: pointer.metadataSha256,
    });
    parsePointer(bytes);
    return bytes;
}

function parseFile(
    value: unknown,
    canonical: boolean,
    index: number
): CandidateFile {
    const description = `Candidate metadata file entry ${index}`;
    if (!isPlainObject(value)) {
        return fail(`${description} is invalid`);
    }
    requireKeys(value, FILE_KEYS, description);
    if (!isSafeObjectPath(value.path)) {
        fail(`${description} path is not a safe object path`);
    }
    if (value.path === METADATA_FILE_NAME) {
        fail('Candidate metadata must not list itself');
    }
    if (canonical && !isCandidateLayoutPath(value.path)) {
        fail(`${description} path is outside the candidate layout`);
    }
    if (
        typeof value.size !== 'number' ||
        !Number.isInteger(value.size) ||
        value.size <= 0 ||
        value.size > MAX_CANDIDATE_FILE_BYTES
    ) {
        fail(`Candidate file '${value.path}' has an invalid size`);
    }
    if (
        typeof value.sha256 !== 'string' ||
        !(canonical ? SHA256_PATTERN : READER_SHA256_PATTERN).test(value.sha256)
    ) {
        fail(`Candidate file '${value.path}' has an invalid SHA-256 digest`);
    }
    return { path: value.path, size: value.size, sha256: value.sha256 };
}

function parsePackage(value: unknown, canonical: boolean): CandidatePackage {
    if (
        !isPlainObject(value) ||
        typeof value.name !== 'string' ||
        value.name.trim() === ''
    ) {
        return fail('Candidate metadata contains an invalid package');
    }
    requireKeys(value, PACKAGE_KEYS, 'Candidate metadata package');
    if (!isSafeObjectPath(value.path)) {
        fail(
            `Candidate package '${value.name}' path is not a safe object path`
        );
    }
    if (!isValidNpmIntegrity(value.npmIntegrity, canonical)) {
        fail(
            `Candidate package '${value.name}' has an invalid npm integrity value`
        );
    }
    return {
        name: value.name,
        path: value.path,
        npmIntegrity: value.npmIntegrity as string,
    };
}

function parseMetadata(
    bytes: Uint8Array,
    options: ParseOptions = {}
): CandidateMetadata {
    const canonical = options.canonical !== false;
    const description = 'Candidate metadata';
    const { text, value } = parseJsonObject(
        bytes,
        MAX_METADATA_BYTES,
        description
    );
    requireKeys(value, METADATA_KEYS, description);
    if (value.schemaVersion !== SCHEMA_VERSION) {
        fail(`${description} schema version is not supported`);
    }
    if (!isReaderVersion(value.version)) {
        fail(`${description} version is invalid`);
    }
    if (!isReaderBuildId(value.buildId)) {
        fail(`${description} build ID is invalid`);
    }
    if (
        typeof value.sourceSha !== 'string' ||
        !(canonical ? SOURCE_SHA_PATTERN : READER_SOURCE_SHA_PATTERN).test(
            value.sourceSha
        )
    ) {
        fail(`${description} source SHA is invalid`);
    }
    if (!Array.isArray(value.packages) || value.packages.length === 0) {
        fail(`${description} does not list packages`);
    }
    if (!Array.isArray(value.files) || value.files.length === 0) {
        fail(`${description} does not list files`);
    }

    const files = value.files.map((file, index) =>
        parseFile(file, canonical, index)
    );
    const filePaths = new Set<string>();
    for (const file of files) {
        if (filePaths.has(file.path)) {
            fail(`${description} lists file '${file.path}' more than once`);
        }
        filePaths.add(file.path);
    }
    for (const requiredFile of REQUIRED_CORE_FILES) {
        if (!filePaths.has(requiredFile)) {
            fail(
                `${description} does not list required file '${requiredFile}'`
            );
        }
    }

    const packages = value.packages.map(item => parsePackage(item, canonical));
    const packageNames = new Set<string>();
    for (const item of packages) {
        if (packageNames.has(item.name)) {
            fail(`${description} contains a duplicate package`);
        }
        packageNames.add(item.name);
        if (
            !item.path.startsWith('npm/') ||
            !item.path.endsWith('.tgz') ||
            !filePaths.has(item.path)
        ) {
            fail(
                `Candidate package '${item.name}' does not identify an inventoried npm artifact`
            );
        }
    }

    const metadata: CandidateMetadata = {
        schemaVersion: SCHEMA_VERSION,
        version: value.version,
        sourceSha: value.sourceSha,
        buildId: value.buildId,
        packages,
        files,
    };
    if (canonical) {
        validateVersion(metadata.version);
        validateBuildId(metadata.buildId);
        const sortedFiles = [...files].sort((left, right) =>
            compareStrings(left.path, right.path)
        );
        const sortedPackages = [...packages].sort((left, right) =>
            compareStrings(left.name, right.name)
        );
        requireCanonical(
            text,
            { ...metadata, packages: sortedPackages, files: sortedFiles },
            description
        );
    }
    return metadata;
}

function validateMetadataIdentity(
    metadata: CandidateMetadata,
    identity: CandidateIdentity
): void {
    if (metadata.version !== identity.version) {
        fail('Candidate metadata version does not match the expected version');
    }
    if (metadata.buildId !== identity.buildId) {
        fail(
            'Candidate metadata build ID does not match the expected build ID'
        );
    }
}

// Headers are fixed before the first upload: objects are create-only, so a
// header cannot be corrected later without a new build ID.
function candidateObjectHeaders(relativePath: string): ObjectHeaders {
    let contentType: string;
    if (relativePath.endsWith('.js')) {
        contentType = JAVASCRIPT_CONTENT_TYPE;
    } else if (
        relativePath.endsWith('.map') ||
        relativePath === METADATA_FILE_NAME
    ) {
        contentType = JSON_CONTENT_TYPE;
    } else if (relativePath.endsWith('.tgz')) {
        contentType = GZIP_CONTENT_TYPE;
    } else {
        return fail(`No content type is defined for '${relativePath}'`);
    }
    return { contentType, cacheControl: IMMUTABLE_CACHE_CONTROL };
}

function describePointer(pointer: ActiveReleasePointer | null): string {
    return pointer
        ? `${pointer.version} build ${pointer.buildId} metadata ${pointer.metadataSha256}`
        : 'none';
}

const releaseContract = {
    CANDIDATES_PREFIX,
    CHANNELS,
    CHANNELS_PREFIX,
    GA_CHANNEL,
    MAX_BUILD_ID_LENGTH,
    MAX_CANDIDATE_FILE_BYTES,
    MAX_METADATA_BYTES,
    MAX_POINTER_BYTES,
    METADATA_FILE_NAME,
    POINTER_FILE_NAME,
    POINTER_HEADERS,
    RELEASE_ORDER_CHANNELS,
    RELEASE_ROOT,
    REQUIRED_CORE_FILES,
    SCHEMA_VERSION,
    STAGING_CHANNEL,
    ReleaseContractError,
    candidateKey,
    candidateObjectHeaders,
    candidatePrefix,
    compareStrings,
    compareVersions,
    createPointer,
    describePointer,
    isCandidateKey,
    isCandidateLayoutPath,
    isPointerKey,
    isSafeObjectPath,
    isValidChannel,
    metadataKey,
    npmIntegrityFor,
    parseMetadata,
    parsePointer,
    pointerKey,
    serializeCanonical,
    serializePointer,
    sha256Base64,
    sha256Hex,
    validateBuildId,
    validateChannel,
    validateMetadataIdentity,
    validateSha256,
    validateVersion,
};

module.exports = releaseContract;

export type ReleaseContract = typeof releaseContract;
