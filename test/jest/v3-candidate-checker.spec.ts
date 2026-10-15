import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as zlib from 'zlib';

const {
    checkCandidate,
    parseArguments,
    readTarGz,
} = require('../../scripts/check-v3-candidate');

const version = '9.9.9';
const buildId = 'pr1-100-1';
const cdnFiles: Record<string, string> = {
    'core/dist/mparticle.common.js': 'core common\n',
    'core/dist/mparticle.esm.js': 'core esm\n',
    'core/dist/mparticle.js': 'core iife\n',
    'core/dist/mparticle.stub.js': 'core stub\n',
    'kits/example/dist/Example.common.js': 'kit common\n',
    'kits/example/dist/Example.esm.js': 'kit esm\n',
    'kits/example/dist/Example.iife.js': 'kit iife\n',
};
const packages = [
    {name: '@mparticle/web-example-kit', tarball: 'npm/example-kit.tgz'},
    {name: '@mparticle/web-sdk', tarball: 'npm/web-sdk.tgz'},
];

interface TarEntry {
    path: string;
    contents?: string | Buffer;
    type?: string;
    gnu?: boolean;
    checksumDelta?: number;
}

interface TarOptions {
    zeroBlocks?: number;
    trailing?: Buffer;
}

function tarBytes(entries: TarEntry[], options: TarOptions = {}): Buffer {
    const blocks: Buffer[] = [];
    for (const entry of entries) {
        const data = Buffer.from(entry.contents || '');
        const header = Buffer.alloc(512);
        header.write(entry.path, 0, 100, 'utf8');
        header.write('0000644\0', 100);
        header.write('0000000\0', 108);
        header.write('0000000\0', 116);
        header.write(`${data.length.toString(8).padStart(11, '0')}\0`, 124);
        header.write('00000000000\0', 136);
        header.write('        ', 148);
        header.write(entry.type || '0', 156);
        header.write(entry.gnu ? 'ustar  \u0000' : 'ustar\u000000', 257, 'latin1');
        let checksum = entry.checksumDelta || 0;
        for (let index = 0; index < header.length; index++) {
            checksum += header[index];
        }
        header.write(`${checksum.toString(8).padStart(6, '0')}\0 `, 148);
        blocks.push(header, data, Buffer.alloc((512 - (data.length % 512)) % 512));
    }
    const zeroBlocks = options.zeroBlocks === undefined ? 2 : options.zeroBlocks;
    blocks.push(Buffer.alloc(512 * zeroBlocks), options.trailing || Buffer.alloc(0));
    return Buffer.concat(blocks);
}

function tarGz(entries: TarEntry[], options: TarOptions = {}): Buffer {
    return zlib.gzipSync(tarBytes(entries, options));
}

function paxRecord(key: string, value: string): string {
    const body = ` ${key}=${value}\n`;
    let length = body.length + 1;
    while (`${length}${body}`.length !== length) {
        length = `${length}${body}`.length;
    }
    return `${length}${body}`;
}

function npmTarball(name: string, extra: TarEntry[] = []): Buffer {
    return tarGz([
        {path: 'package/package.json', contents: JSON.stringify({name, version})},
        {path: 'package/dist/bundle.js', contents: `${name}\n`},
        ...extra,
    ]);
}

function sha256(bytes: Buffer): string {
    return crypto.createHash('sha256').update(bytes).digest('hex');
}

function integrity(bytes: Buffer): string {
    return `sha512-${crypto.createHash('sha512').update(bytes).digest('base64')}`;
}

function listFiles(root: string, directory = root): string[] {
    return fs
        .readdirSync(directory, {withFileTypes: true})
        .flatMap(entry => {
            const entryPath = path.join(directory, entry.name);
            return entry.isDirectory()
                ? listFiles(root, entryPath)
                : [path.relative(root, entryPath).split(path.sep).join('/')];
        })
        .sort();
}

function writeFile(root: string, relativePath: string, contents: string | Buffer) {
    const filePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(filePath), {recursive: true});
    fs.writeFileSync(filePath, contents);
}

function readMetadata(root: string) {
    return JSON.parse(fs.readFileSync(path.join(root, 'metadata.json'), 'utf8'));
}

function writeMetadata(root: string, metadata: Record<string, unknown>) {
    fs.writeFileSync(
        path.join(root, 'metadata.json'),
        `${JSON.stringify(metadata, null, 4)}\n`
    );
}

// Rebuilds metadata.json from what is on disk, as a correct packager would.
function inventory(root: string) {
    writeMetadata(root, {
        schemaVersion: 1,
        version,
        sourceSha: 'a'.repeat(40),
        buildId,
        packages: packages.map(({name, tarball}) => ({
            name,
            path: tarball,
            npmIntegrity: integrity(fs.readFileSync(path.join(root, tarball))),
        })),
        files: listFiles(root)
            .filter(filePath => filePath !== 'metadata.json')
            .map(filePath => {
                const bytes = fs.readFileSync(path.join(root, filePath));
                return {path: filePath, size: bytes.length, sha256: sha256(bytes)};
            }),
    });
}

function writeCdnArchive(root: string, filePaths = Object.keys(cdnFiles)) {
    writeFile(
        root,
        'cdn-bundles.tgz',
        tarGz(
            filePaths.map(filePath => ({
                path: filePath,
                contents: fs.readFileSync(path.join(root, filePath), 'utf8'),
            }))
        )
    );
}

function buildCandidate(): string {
    const root = fs.realpathSync(
        fs.mkdtempSync(path.join(os.tmpdir(), 'mparticle-candidate-check-'))
    );
    for (const [filePath, contents] of Object.entries(cdnFiles)) {
        writeFile(root, filePath, contents);
    }
    for (const {name, tarball} of packages) {
        writeFile(root, tarball, npmTarball(name));
    }
    writeCdnArchive(root);
    inventory(root);
    return root;
}

describe('V3 candidate checker', () => {
    let root: string;

    beforeEach(() => {
        root = buildCandidate();
    });

    afterEach(() => {
        fs.rmSync(root, {force: true, recursive: true});
    });

    it('accepts a candidate that meets the reader contract', () => {
        expect(checkCandidate(root)).toEqual([]);
        expect(checkCandidate(root, {version, buildId})).toEqual([]);
    });

    it('reports a version or build ID that differs from the expected one', () => {
        expect(
            checkCandidate(root, {version: '9.9.8', buildId: 'other'})
        ).toEqual([
            'version is 9.9.9, expected 9.9.8',
            'buildId is pr1-100-1, expected other',
        ]);
    });

    it('rejects a file whose bytes no longer match its SHA-256', () => {
        writeFile(root, 'core/dist/mparticle.js', 'core IIFE\n');
        expect(checkCandidate(root)).toEqual([
            'core/dist/mparticle.js SHA-256 does not match metadata',
        ]);
    });

    it('rejects a file whose size no longer matches', () => {
        writeFile(root, 'core/dist/mparticle.js', 'core iife, longer\n');
        expect(checkCandidate(root)).toEqual([
            'core/dist/mparticle.js is 18 bytes, metadata says 10',
        ]);
    });

    it('rejects a listed file that is missing', () => {
        fs.rmSync(path.join(root, 'kits/example/dist/Example.esm.js'));
        expect(checkCandidate(root)).toEqual([
            'Listed file is missing: kits/example/dist/Example.esm.js',
        ]);
    });

    it('rejects a file that metadata does not list', () => {
        writeFile(root, 'core/dist/extra.js', 'extra\n');
        expect(checkCandidate(root)).toEqual([
            'File is not listed in metadata: core/dist/extra.js',
        ]);
    });

    it('recomputes npm tarball integrity', () => {
        const metadata = readMetadata(root);
        metadata.packages[0].npmIntegrity = integrity(Buffer.from('other'));
        writeMetadata(root, metadata);
        expect(checkCandidate(root)).toEqual([
            '@mparticle/web-example-kit npmIntegrity does not match npm/example-kit.tgz',
        ]);

        metadata.packages[0].npmIntegrity = 'sha512-not-base64';
        writeMetadata(root, metadata);
        expect(checkCandidate(root)).toEqual([
            '@mparticle/web-example-kit npmIntegrity is not a sha512 SRI value',
        ]);
    });

    it('requires each npm tarball to hold the listed package at the candidate version', () => {
        writeFile(
            root,
            'npm/web-sdk.tgz',
            tarGz([
                {
                    path: 'package/package.json',
                    contents: JSON.stringify({name: '@mparticle/web-sdk', version: '9.9.8'}),
                },
            ])
        );
        inventory(root);
        expect(checkCandidate(root)).toEqual([
            'npm/web-sdk.tgz contains @mparticle/web-sdk@9.9.8, expected @mparticle/web-sdk@9.9.9',
        ]);
    });

    it('rejects npm tarballs that no package claims', () => {
        writeFile(root, 'npm/orphan.tgz', tarGz([]));
        inventory(root);
        expect(checkCandidate(root)).toEqual([
            'npm/orphan.tgz is not claimed by any package',
        ]);
    });

    it('requires cdn-bundles.tgz to hold exactly the listed CDN files', () => {
        writeCdnArchive(
            root,
            Object.keys(cdnFiles).filter(
                filePath => filePath !== 'kits/example/dist/Example.esm.js'
            )
        );
        inventory(root);
        expect(checkCandidate(root)).toEqual([
            'cdn-bundles.tgz is missing kits/example/dist/Example.esm.js',
        ]);

        writeFile(
            root,
            'cdn-bundles.tgz',
            tarGz([
                ...Object.keys(cdnFiles).map(filePath => ({
                    path: filePath,
                    contents: cdnFiles[filePath],
                })),
                {path: 'core/dist/unlisted.js', contents: 'unlisted\n'},
            ])
        );
        inventory(root);
        expect(checkCandidate(root)).toEqual([
            'cdn-bundles.tgz has a member that is not a listed CDN file: core/dist/unlisted.js',
        ]);

        writeFile(
            root,
            'cdn-bundles.tgz',
            tarGz(
                Object.keys(cdnFiles).map(filePath => ({
                    path: filePath,
                    contents: filePath.endsWith('mparticle.js')
                        ? 'changed\n'
                        : cdnFiles[filePath],
                }))
            )
        );
        inventory(root);
        expect(checkCandidate(root)).toEqual([
            'cdn-bundles.tgz member differs: core/dist/mparticle.js',
        ]);
    });

    it('requires the core bundles and a complete kit bundle layout', () => {
        fs.rmSync(path.join(root, 'core/dist/mparticle.stub.js'));
        fs.rmSync(path.join(root, 'kits/example/dist/Example.iife.js'));
        writeCdnArchive(
            root,
            Object.keys(cdnFiles).filter(
                filePath => !/(stub|Example\.iife)\.js$/.test(filePath)
            )
        );
        writeFile(root, 'kits/example/dist/Example.esm.js.map', '{}\n');
        writeFile(root, 'kits/example/dist/Example.iife.js.map', '{}\n');
        writeFile(root, 'README.md', 'readme\n');
        inventory(root);
        expect(checkCandidate(root)).toEqual(
            expect.arrayContaining([
                'Required core bundle is not listed: core/dist/mparticle.stub.js',
                'File is outside the candidate layout: README.md',
                'kits/example must have exactly one IIFE bundle named after Example.common.js',
                'kits/example has a source map without its bundle: Example.iife.js.map',
            ])
        );
    });

    it('rejects HeartbeatKit bundles', () => {
        writeFile(
            root,
            'kits/adobe/HeartbeatKit/dist/AdobeHBKit.common.js',
            'heartbeat\n'
        );
        inventory(root);
        expect(checkCandidate(root)).toContain(
            'HeartbeatKit bundles must not ship: kits/adobe/HeartbeatKit/dist/AdobeHBKit.common.js'
        );
    });

    it('rejects unsafe paths and symlinks', () => {
        const metadata = readMetadata(root);
        const original = metadata.files[0];
        for (const unsafePath of [
            '../outside.js',
            '/core/dist/mparticle.js',
            'core//dist/mparticle.js',
            'core\\dist\\mparticle.js',
            'core/./dist/mparticle.js',
        ]) {
            metadata.files[0] = {...original, path: unsafePath};
            writeMetadata(root, metadata);
            expect(checkCandidate(root)).toContain(
                `files[0] path is not safe: ${unsafePath}`
            );
        }

        const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'outside-'));
        try {
            inventory(root);
            fs.symlinkSync(outside, path.join(root, 'kits/linked'));
            expect(checkCandidate(root)).toEqual([
                'Symlinks are not allowed: kits/linked',
            ]);
            expect(checkCandidate(path.join(root, 'kits/linked'))).toEqual([
                `${path.join(root, 'kits/linked')} is not a real directory`,
            ]);
        } finally {
            fs.rmSync(outside, {force: true, recursive: true});
        }
    });

    it('validates the metadata schema and file entries', () => {
        const metadata = readMetadata(root);
        writeMetadata(root, {...metadata, extra: true});
        expect(checkCandidate(root)).toEqual([
            'metadata.json must be an object with exactly: buildId, files, packages, schemaVersion, sourceSha, version',
        ]);

        writeMetadata(root, {
            ...metadata,
            schemaVersion: 2,
            version: '9.9.9-beta.1',
            sourceSha: 'A'.repeat(40),
            buildId: '-bad',
        });
        expect(checkCandidate(root)).toEqual(
            expect.arrayContaining([
                'Unsupported schemaVersion: 2',
                'version is not a stable semantic version',
                'buildId is invalid',
                'sourceSha must be a 40-character lowercase hex SHA',
            ])
        );

        writeMetadata(root, {
            ...metadata,
            files: [
                {...metadata.files[0], size: 0},
                {...metadata.files[1], sha256: 'x'},
                {path: 'metadata.json', size: 1, sha256: 'a'.repeat(64)},
                metadata.files[2],
                metadata.files[2],
                ...metadata.files.slice(3),
            ],
        });
        expect(checkCandidate(root)).toEqual(
            expect.arrayContaining([
                `${metadata.files[0].path} has an invalid size: 0`,
                `${metadata.files[1].path} has an invalid sha256`,
                'files must not list metadata.json',
                `${metadata.files[2].path} is listed more than once`,
            ])
        );

        fs.writeFileSync(path.join(root, 'metadata.json'), '{');
        expect(checkCandidate(root)[0]).toMatch(
            /^metadata\.json is not valid UTF-8 JSON/
        );
        fs.rmSync(path.join(root, 'metadata.json'));
        expect(checkCandidate(root)).toEqual([
            'metadata.json is missing or is not a regular file',
        ]);
    });

    it('reads only plain files and directories from archives', () => {
        const members = readTarGz(
            tarGz([
                {path: 'core/', type: '5'},
                {path: 'core/a.js', contents: 'a'},
            ])
        );
        expect(
            members.map((member: {path: string; directory: boolean}) => [
                member.path,
                member.directory,
            ])
        ).toEqual([
            ['core', true],
            ['core/a.js', false],
        ]);
        for (const [type, kind] of [
            ['1', 'hardlink'],
            ['2', 'symlink'],
            ['3', 'character device'],
            ['6', 'FIFO'],
        ]) {
            expect(() =>
                readTarGz(tarGz([{path: `core/${kind}.js`, type}]))
            ).toThrow(`unsupported tar entry type '${type}' for core/${kind}.js`);
        }
    });

    it('reads GNU long-name and pax path headers', () => {
        const longPath = `kits/${'nested/'.repeat(20)}dist/Example.common.js`;
        expect(longPath.length).toBeGreaterThan(100);

        const gnu = readTarGz(
            tarGz([
                {path: '././@LongLink', type: 'L', gnu: true, contents: `${longPath}\0`},
                {path: longPath.slice(0, 100), gnu: true, contents: 'gnu'},
            ])
        );
        expect(gnu.map((member: {path: string}) => member.path)).toEqual([longPath]);
        expect(gnu[0].bytes.toString()).toBe('gnu');

        const pax = readTarGz(
            tarGz([
                {path: 'PaxHeader/entry', type: 'x', contents: paxRecord('path', longPath)},
                {path: 'truncated-name.js', contents: 'pax'},
                {path: 'core/after.js', contents: 'after'},
            ])
        );
        expect(pax.map((member: {path: string}) => member.path)).toEqual([
            longPath,
            'core/after.js',
        ]);

        expect(() =>
            readTarGz(tarGz([{path: '././@LongLink', type: 'L', gnu: true, contents: 'x'}]))
        ).toThrow('tar long-name header has no entry');
        expect(() =>
            readTarGz(
                tarGz([
                    {path: 'PaxHeader/entry', type: 'x', contents: paxRecord('size', '1')},
                    {path: 'core/a.js', contents: 'a'},
                ])
            )
        ).toThrow('pax size overrides are not supported');
        expect(() =>
            readTarGz(
                tarGz([
                    {path: 'PaxHeader/entry', type: 'x', contents: '99 path=x\n'},
                    {path: 'core/a.js', contents: 'a'},
                ])
            )
        ).toThrow('invalid pax header');
    });

    it('reads payloads that are not block-aligned and rejects truncated ones', () => {
        const odd = Buffer.alloc(700, 0x61);
        const members = readTarGz(
            tarGz([
                {path: 'core/odd.js', contents: odd},
                {path: 'core/next.js', contents: 'next'},
            ])
        );
        expect(members[0].bytes).toEqual(odd);
        expect(members[1].bytes.toString()).toBe('next');

        const whole = tarBytes([{path: 'core/odd.js', contents: odd}], {zeroBlocks: 0});
        expect(() => readTarGz(zlib.gzipSync(whole.subarray(0, 512 + 700)))).toThrow(
            'truncated tar entry'
        );
    });

    it('verifies every tar header checksum and format', () => {
        expect(() =>
            readTarGz(tarGz([{path: 'core/a.js', contents: 'a', checksumDelta: 1}]))
        ).toThrow(/^tar header checksum is \d+, computed \d+$/);
        const archive = tarBytes([{path: 'core/a.js', contents: 'a'}]);
        archive.write('nottar\0\0', 257, 'latin1');
        let checksum = 0;
        for (let index = 0; index < 512; index++) {
            checksum += index >= 148 && index < 156 ? 0x20 : archive[index];
        }
        archive.write(`${checksum.toString(8).padStart(6, '0')}\0 `, 148);
        expect(() => readTarGz(zlib.gzipSync(archive))).toThrow(
            'tar header is not ustar, pax or GNU format'
        );
        expect(
            readTarGz(tarGz([{path: 'core/a.js', contents: 'a', gnu: true}]))[0].path
        ).toBe('core/a.js');
    });

    it('requires a proper end-of-archive marker', () => {
        const entries = [{path: 'core/a.js', contents: 'a'}];
        expect(() => readTarGz(tarGz(entries, {zeroBlocks: 0}))).toThrow(
            'tar archive has no end-of-archive marker'
        );
        expect(() => readTarGz(tarGz(entries, {zeroBlocks: 1}))).toThrow(
            'tar end-of-archive marker is incomplete'
        );
        expect(() =>
            readTarGz(tarGz(entries, {trailing: Buffer.from('garbage')}))
        ).toThrow('tar archive has data after end-of-archive');
        expect(() =>
            readTarGz(tarGz(entries, {zeroBlocks: 3, trailing: Buffer.from([1])}))
        ).toThrow('tar archive has data after end-of-archive');
        expect(readTarGz(tarGz(entries, {zeroBlocks: 20}))).toHaveLength(1);
    });

    it('rejects duplicate archive members', () => {
        expect(() =>
            readTarGz(
                tarGz([
                    {path: 'core/a.js', contents: 'a'},
                    {path: 'core/a.js', contents: 'b'},
                ])
            )
        ).toThrow('tar archive repeats core/a.js');
        expect(() =>
            readTarGz(tarGz([{path: 'core/', type: '5'}, {path: 'core', type: '5'}]))
        ).toThrow('tar archive repeats core');

        writeFile(
            root,
            'cdn-bundles.tgz',
            tarGz([
                ...Object.keys(cdnFiles).map(filePath => ({
                    path: filePath,
                    contents: cdnFiles[filePath],
                })),
                {path: 'core/dist/mparticle.js', contents: cdnFiles['core/dist/mparticle.js']},
            ])
        );
        inventory(root);
        expect(checkCandidate(root)).toEqual([
            'cdn-bundles.tgz is not readable: tar archive repeats core/dist/mparticle.js',
        ]);
    });

    it('requires npm tarball members under package/ with exactly one manifest', () => {
        const sdk = '@mparticle/web-sdk';
        const check = (tarball: Buffer) => {
            writeFile(root, 'npm/web-sdk.tgz', tarball);
            inventory(root);
            return checkCandidate(root);
        };

        expect(check(npmTarball(sdk, [{path: 'other/evil.js', contents: 'x'}]))).toEqual([
            'npm/web-sdk.tgz has a member outside package/: other/evil.js',
        ]);
        expect(check(npmTarball(sdk, [{path: 'package/../evil.js', contents: 'x'}]))).toEqual([
            'npm/web-sdk.tgz has an unsafe path: package/../evil.js',
        ]);
        expect(check(tarGz([{path: 'package/dist/bundle.js', contents: 'x'}]))).toEqual([
            'npm/web-sdk.tgz has no package/package.json',
        ]);
        expect(
            check(
                npmTarball(sdk, [
                    {
                        path: 'package/package.json',
                        contents: JSON.stringify({name: sdk, version}),
                    },
                ])
            )
        ).toEqual([
            'npm/web-sdk.tgz is not a readable npm tarball: tar archive repeats package/package.json',
        ]);
    });

    it('parses the candidate directory and expectations', () => {
        expect(
            parseArguments(['out/c', '--version', version, '--build-id', buildId])
        ).toEqual({
            candidateDirectory: 'out/c',
            expectations: {version, buildId},
        });
        expect(() => parseArguments([])).toThrow('Usage:');
        expect(() => parseArguments(['out/c', 'out/d'])).toThrow(
            'Unexpected argument: out/d'
        );
        expect(() => parseArguments(['out/c', '--version'])).toThrow(
            '--version requires a value'
        );
    });
});
