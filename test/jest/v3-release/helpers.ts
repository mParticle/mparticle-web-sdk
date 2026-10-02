import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const contract = require('../../../scripts/v3-release/release-contract.ts');

export const FIXTURE_DIRECTORY = path.join(
    __dirname,
    '../../fixtures/v3-release'
);

// The same inventory, contents and source SHA as the server-side reader's own
// test fixture, so the checked-in bytes can be shared with it.
export const READER_FIXTURE_PATHS = [
    'cdn-bundles.tgz',
    'core/dist/mparticle.common.js',
    'core/dist/mparticle.esm.js',
    'core/dist/mparticle.js',
    'core/dist/mparticle.stub.js',
    'kits/braze/braze-5/dist/BrazeKit.common.js',
    'kits/braze/braze-5/dist/BrazeKit.iife.js',
    'kits/rokt/dist/Rokt-Kit.common.js',
    'kits/rokt/dist/Rokt-Kit.common.js.map',
    'kits/rokt/dist/Rokt-Kit.esm.js',
    'kits/rokt/dist/Rokt-Kit.esm.js.map',
    'kits/rokt/dist/Rokt-Kit.iife.js',
    'kits/rokt/dist/Rokt-Kit.iife.js.map',
    'kits/roktpayplus/dist/RoktPayPlus-Kit.common.js',
    'kits/roktpayplus/dist/RoktPayPlus-Kit.common.js.map',
    'kits/roktpayplus/dist/RoktPayPlus-Kit.iife.js',
    'kits/roktpayplus/dist/RoktPayPlus-Kit.iife.js.map',
    'npm/mparticle-web-sdk-3.5.0.tgz',
];

export const SOURCE_SHA = '0123456789abcdef0123456789abcdef01234567';

export interface TestCandidate {
    version: string;
    buildId: string;
    files: Map<string, Buffer>;
    metadata: any;
    metadataBytes: Buffer;
    metadataSha256: string;
    prefix: string;
}

export function fixtureContent(filePath: string, salt = ''): Buffer {
    return Buffer.from(`fixture ${salt}${filePath}`, 'utf8');
}

export function buildCandidate(
    options: {
        version?: string;
        buildId?: string;
        salt?: string;
        paths?: string[];
    } = {}
): TestCandidate {
    const version = options.version || '3.5.0';
    const buildId = options.buildId || '12345-1';
    const salt = options.salt || '';
    const packagePath = `npm/mparticle-web-sdk-${version}.tgz`;
    const paths = (options.paths || READER_FIXTURE_PATHS)
        .map(filePath =>
            filePath.startsWith('npm/mparticle-web-sdk-') ? packagePath : filePath
        )
        .sort(contract.compareStrings);
    const files = new Map<string, Buffer>();
    for (const filePath of paths) {
        files.set(filePath, fixtureContent(filePath, salt));
    }
    const metadata = {
        schemaVersion: 1,
        version,
        sourceSha: SOURCE_SHA,
        buildId,
        packages: [
            {
                name: '@mparticle/web-sdk',
                path: packagePath,
                npmIntegrity: contract.npmIntegrityFor(files.get(packagePath)),
            },
        ],
        files: paths.map(filePath => ({
            path: filePath,
            size: files.get(filePath).length,
            sha256: contract.sha256Hex(files.get(filePath)),
        })),
    };
    const metadataBytes = contract.serializeCanonical(metadata);
    return {
        version,
        buildId,
        files,
        metadata,
        metadataBytes,
        metadataSha256: contract.sha256Hex(metadataBytes),
        prefix: contract.candidatePrefix(version, buildId),
    };
}

export function writeCandidateDirectory(
    directory: string,
    candidate: TestCandidate
): string {
    candidate.files.forEach((bytes, filePath) => {
        fs.mkdirSync(path.dirname(path.join(directory, filePath)), {
            recursive: true,
        });
        fs.writeFileSync(path.join(directory, filePath), bytes);
    });
    fs.writeFileSync(
        path.join(directory, 'metadata.json'),
        candidate.metadataBytes
    );
    return directory;
}

// Seeds an in-memory store with an uploaded candidate (metadata included).
export function seedCandidate(storage: any, candidate: TestCandidate): void {
    candidate.files.forEach((bytes, filePath) => {
        storage.seed(
            `${candidate.prefix}${filePath}`,
            bytes,
            contract.candidateObjectHeaders(filePath)
        );
    });
    storage.seed(
        `${candidate.prefix}metadata.json`,
        candidate.metadataBytes,
        contract.candidateObjectHeaders('metadata.json')
    );
}

export function pointerBytesFor(candidate: TestCandidate): Buffer {
    return contract.serializePointer(
        contract.createPointer(candidate, candidate.metadataSha256)
    );
}

export function seedPointer(
    storage: any,
    channel: string,
    candidate: TestCandidate
): void {
    storage.seed(
        contract.pointerKey(channel),
        pointerBytesFor(candidate),
        contract.POINTER_HEADERS
    );
}

export function makeTempDirectory(prefix: string): string {
    return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
}

export class CapturedOutput {
    lines: string[] = [];
    write = (line: string): void => {
        this.lines.push(line);
    };
    get text(): string {
        return this.lines.join('\n');
    }
}
