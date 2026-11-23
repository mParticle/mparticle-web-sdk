import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import {
    FIXTURE_DIRECTORY,
    MODULES_BLOCK,
    READER_FIXTURE_PATHS,
    buildCandidate,
    fixtureContent,
    pointerBytesFor,
} from './v3-release/helpers';

const contract = require('../../scripts/v3-release/release-contract.ts');

function metadataWith(mutate: (metadata: any) => void): Buffer {
    const metadata = JSON.parse(buildCandidate().metadataBytes.toString());
    mutate(metadata);
    return contract.serializeCanonical(metadata);
}

function modulesMetadataWith(mutate: (metadata: any) => void): Buffer {
    const metadata = JSON.parse(
        buildCandidate({ modules: true }).metadataBytes.toString()
    );
    mutate(metadata);
    metadata.files.sort((left: any, right: any) =>
        contract.compareStrings(left.path, right.path)
    );
    return contract.serializeCanonical(metadata);
}

function listFile(metadata: any, filePath: string): void {
    const bytes = fixtureContent(filePath);
    metadata.files.push({
        path: filePath,
        size: bytes.length,
        sha256: contract.sha256Hex(bytes),
    });
}

function listedFile(metadata: any, filePath: string): any {
    return metadata.files.find((file: any) => file.path === filePath);
}

function addModules(metadata: any, count: number): void {
    for (let index = 0; index < count; index++) {
        const name = `extra${String(index).padStart(2, '0')}`;
        const filePath = `core/dist/${name}.js`;
        listFile(metadata, filePath);
        metadata.modules.files.push({
            name,
            path: filePath,
            enabledBy: [{ flag: 'autoButtonTracking', value: 'True' }],
        });
    }
}

const LEAN_PATH = 'core/dist/mparticle.lean.js';
const MODULE_PATH = 'core/dist/mparticle.buttonTracking.js';
const FULL_CORE_PATH = 'core/dist/mparticle.js';

// The same cases the server-side reader rejects, so a candidate the producers
// accept never has its modules ignored there.
const INVALID_MODULES: Array<[string, (metadata: any) => void]> = [
    ['the block is null', m => (m.modules = null)],
    ['the block is an array', m => (m.modules = [])],
    ['the block is a string', m => (m.modules = LEAN_PATH)],
    ['the block is empty', m => (m.modules = {})],
    ['the block has an extra key', m => (m.modules.extra = 1)],
    ['the block misses files', m => delete m.modules.files],
    ['schema version 2', m => (m.modules.schemaVersion = 2)],
    ['schema version as a string', m => (m.modules.schemaVersion = '1')],
    ['the core is not listed', m => (m.files = m.files.filter((f: any) => f.path !== LEAN_PATH))],
    ['the core is the full core', m => (m.modules.core = FULL_CORE_PATH)],
    ['the core is the stub', m => (m.modules.core = 'core/dist/mparticle.stub.js')],
    ['the core is outside core/dist', m => (m.modules.core = 'kits/rokt/dist/Rokt-Kit.iife.js')],
    ['the core path traverses', m => (m.modules.core = 'core/dist/../dist/mparticle.lean.js')],
    ['the core starts with an underscore', m => (m.modules.core = 'core/dist/_lean.js')],
    ['the core has the full core SHA-256', m => (listedFile(m, LEAN_PATH).sha256 = listedFile(m, FULL_CORE_PATH).sha256)],
    ['no modules', m => (m.modules.files = [])],
    ['17 modules', m => addModules(m, 17)],
    ['a module has an extra key', m => (m.modules.files[0].extra = 'x')],
    ['a module misses enabledBy', m => delete m.modules.files[0].enabledBy],
    ['a module named none', m => (m.modules.files[0].name = 'none')],
    ['a module named UNKNOWN', m => (m.modules.files[0].name = 'UNKNOWN')],
    ['a module name that leaves a comment', m => (m.modules.files[0].name = 'x*/alert(1)//')],
    ['a module name with a comma', m => (m.modules.files[0].name = 'a,b')],
    ['a 65-character module name', m => (m.modules.files[0].name = 'a'.repeat(65))],
    ['an empty module name', m => (m.modules.files[0].name = '')],
    ['a module listed twice', m => { addModules(m, 1); m.modules.files[1].name = 'buttonTracking'; }],
    ['two modules on one path', m => { addModules(m, 1); m.modules.files[1].path = MODULE_PATH; }],
    ['a module on the core path', m => (m.modules.files[0].path = LEAN_PATH)],
    ['a module on the full core path', m => (m.modules.files[0].path = FULL_CORE_PATH)],
    ['a module not listed', m => (m.files = m.files.filter((f: any) => f.path !== MODULE_PATH))],
    ['a module with the full core SHA-256', m => (listedFile(m, MODULE_PATH).sha256 = listedFile(m, FULL_CORE_PATH).sha256)],
    ['a module with the core SHA-256', m => (listedFile(m, MODULE_PATH).sha256 = listedFile(m, LEAN_PATH).sha256)],
    ['no conditions', m => (m.modules.files[0].enabledBy = [])],
    ['9 conditions', m => (m.modules.files[0].enabledBy = Array.from({ length: 9 }, (_, i) => ({ flag: `flag${i}`, value: 'True' })))],
    ['a condition with an extra key', m => (m.modules.files[0].enabledBy[0].extra = 'x')],
    ['a condition without a value', m => delete m.modules.files[0].enabledBy[0].value],
    ['a boolean condition value', m => (m.modules.files[0].enabledBy[0].value = true)],
    ['an empty condition value', m => (m.modules.files[0].enabledBy[0].value = '')],
    ['a condition value HTML encoding would change', m => (m.modules.files[0].enabledBy[0].value = 'a&b')],
    ['a numeric condition flag', m => (m.modules.files[0].enabledBy[0].flag = 1)],
];

function pointerWith(mutate: (pointer: any) => void): Buffer {
    const pointer = JSON.parse(pointerBytesFor(buildCandidate()).toString());
    mutate(pointer);
    return contract.serializeCanonical(pointer);
}

describe('V3 release contract', () => {
    it('typechecks the release scripts strictly', () => {
        execFileSync(
            process.execPath,
            [
                require.resolve('typescript/bin/tsc'),
                '-p',
                path.join(__dirname, '../../tsconfig.v3-release.json'),
            ],
            { stdio: 'pipe', timeout: 120000 }
        );
    }, 120000);

    describe('golden reader fixture', () => {
        const metadataBytes = fs.readFileSync(
            path.join(FIXTURE_DIRECTORY, 'metadata.json')
        );
        const pointerBytes = fs.readFileSync(
            path.join(FIXTURE_DIRECTORY, 'active-release.json')
        );

        it('is reproduced byte for byte from the reader fixture recipe', () => {
            const candidate = buildCandidate();
            expect(candidate.metadataBytes.equals(metadataBytes)).toBe(true);
            expect(pointerBytesFor(candidate).equals(pointerBytes)).toBe(true);
        });

        it('passes the strict producer checks', () => {
            const metadata = contract.parseMetadata(metadataBytes);
            const pointer = contract.parsePointer(pointerBytes);
            expect(pointer).toEqual({
                schemaVersion: 1,
                version: '3.5.0',
                buildId: '12345-1',
                candidatePrefix: 'web-sdk/v3/candidates/3.5.0/12345-1/',
                metadataSha256: contract.sha256Hex(metadataBytes),
            });
            contract.validateMetadataIdentity(metadata, pointer);
            expect(metadata.files).toHaveLength(18);
        });
    });

    describe('golden modules fixture', () => {
        const metadataBytes = fs.readFileSync(
            path.join(FIXTURE_DIRECTORY, 'metadata.modules.json')
        );

        it('is reproduced byte for byte from the reader fixture recipe plus the module', () => {
            expect(
                buildCandidate({ modules: true }).metadataBytes.equals(
                    metadataBytes
                )
            ).toBe(true);
        });

        it('passes the strict producer checks with its modules block', () => {
            const metadata = contract.parseMetadata(metadataBytes);
            expect(metadata.modules).toEqual(MODULES_BLOCK);
            expect(metadata.files).toHaveLength(20);
        });

        it('is read without its modules block in reader mode', () => {
            const metadata = contract.parseMetadata(metadataBytes, {
                canonical: false,
            });
            expect(metadata.modules).toBeUndefined();
            expect(metadata.files).toHaveLength(20);
        });

        it('leaves a candidate without the block exactly as before', () => {
            const metadata = contract.parseMetadata(
                buildCandidate().metadataBytes
            );
            expect(metadata).not.toHaveProperty('modules');
        });
    });

    describe('modules block', () => {
        it.each(INVALID_MODULES)('rejects %s', (_label, mutate) => {
            const bytes = modulesMetadataWith(mutate);
            expect(() => contract.parseMetadata(bytes)).toThrow(/odule/);
            expect(() =>
                contract.parseMetadata(bytes, { canonical: false })
            ).not.toThrow();
        });

        it('accepts 16 modules and 8 conditions', () => {
            const bytes = modulesMetadataWith(metadata => {
                addModules(metadata, 15);
                metadata.modules.files[0].enabledBy = Array.from(
                    { length: 8 },
                    (_, index) => ({ flag: `flag${index}`, value: 'True' })
                );
            });
            const metadata = contract.parseMetadata(bytes);
            expect(metadata.modules.files).toHaveLength(16);
            expect(metadata.modules.files[0].enabledBy).toHaveLength(8);
        });

        it.each([
            [
                'not written last',
                (text: string) => {
                    const metadata = JSON.parse(text);
                    const { modules, ...rest } = metadata;
                    return contract.serializeCanonical({ modules, ...rest });
                },
            ],
            [
                'with its keys out of order',
                (text: string) => {
                    const metadata = JSON.parse(text);
                    const { schemaVersion, core, files } = metadata.modules;
                    metadata.modules = { core, schemaVersion, files };
                    return contract.serializeCanonical(metadata);
                },
            ],
            [
                'with conditions out of order',
                (text: string) => {
                    const metadata = JSON.parse(text);
                    metadata.modules.files[0].enabledBy.reverse();
                    return contract.serializeCanonical(metadata);
                },
            ],
            [
                'with modules out of name order',
                (text: string) => {
                    const metadata = JSON.parse(text);
                    addModules(metadata, 1);
                    metadata.modules.files[1].name = 'aaa';
                    metadata.files.sort((left: any, right: any) =>
                        contract.compareStrings(left.path, right.path)
                    );
                    return contract.serializeCanonical(metadata);
                },
            ],
            [
                'with a schema version written as 1.0',
                (text: string) =>
                    Buffer.from(
                        text.replace(
                            '"modules": {\n        "schemaVersion": 1,',
                            '"modules": {\n        "schemaVersion": 1.0,'
                        )
                    ),
            ],
        ])('rejects a block %s', (_label, rewrite) => {
            const text = buildCandidate({
                modules: true,
            }).metadataBytes.toString();
            const bytes = rewrite(text);
            expect(bytes.toString()).not.toBe(text);
            expect(() => contract.parseMetadata(bytes)).toThrow(
                /not canonical/
            );
        });
    });

    describe('keys and channels', () => {
        it('builds bucket-absolute keys under web-sdk/v3', () => {
            expect(contract.candidatePrefix('3.5.0', '12345-1')).toBe(
                'web-sdk/v3/candidates/3.5.0/12345-1/'
            );
            expect(
                contract.candidateKey('3.5.0', '12345-1', 'core/dist/mparticle.js')
            ).toBe('web-sdk/v3/candidates/3.5.0/12345-1/core/dist/mparticle.js');
            expect(contract.metadataKey('3.5.0', '12345-1')).toBe(
                'web-sdk/v3/candidates/3.5.0/12345-1/metadata.json'
            );
            expect(contract.CHANNELS.map(contract.pointerKey)).toEqual([
                'web-sdk/v3/channels/ga/active-release.json',
                'web-sdk/v3/channels/v3-staging/active-release.json',
                'web-sdk/v3/channels/v3-release-order-a/active-release.json',
                'web-sdk/v3/channels/v3-release-order-b/active-release.json',
                'web-sdk/v3/channels/v3-release-order-c/active-release.json',
            ]);
        });

        it.each([
            'production',
            'main',
            'staging',
            'v3-release-order-d',
            'GA',
            'ga\n',
            '../ga',
            'ga/../v3-staging',
            '',
        ])('rejects channel %j', channel => {
            expect(contract.isValidChannel(channel)).toBe(false);
            expect(() => contract.pointerKey(channel)).toThrow(/Channel/);
        });

        it('keeps the candidate and pointer namespaces disjoint', () => {
            for (const channel of contract.CHANNELS) {
                const key = contract.pointerKey(channel);
                expect(contract.isPointerKey(key)).toBe(true);
                expect(contract.isCandidateKey(key)).toBe(false);
            }
            expect(
                contract.isPointerKey(
                    contract.candidateKey('3.5.0', '1-1', 'metadata.json')
                )
            ).toBe(false);
        });

        it.each([
            ['a non-V3 version', '2.30.0', '1-1'],
            ['a v-prefixed version', 'v3.5.0', '1-1'],
            ['a leading zero', '3.05.0', '1-1'],
            ['a prerelease number with a leading zero', '3.0.0-rc.01', '1-1'],
            ['a leading zero after a hyphenated prerelease', '3.0.0-beta-1.00', '1-1'],
            ['build metadata', '3.5.0+a', '1-1'],
            ['prerelease build metadata', '3.6.0-rc.1+build.5', '1-1'],
            ['build metadata with a leading zero', '3.6.0-rc.1+build.01', '1-1'],
            ['a trailing newline', '3.5.0\n', '1-1'],
            ['an unsafe build ID', '3.5.0', '../1'],
            ['a build ID with a slash', '3.5.0', '1/1'],
            ['an overlong build ID', '3.5.0', 'a'.repeat(65)],
        ])('rejects %s in a candidate prefix', (_label, version, buildId) => {
            expect(() => contract.candidatePrefix(version, buildId)).toThrow();
        });

        it('accepts prerelease versions and 64-character build IDs', () => {
            expect(
                contract.candidatePrefix('3.6.0-rc.1', 'a'.repeat(64))
            ).toBe(`web-sdk/v3/candidates/3.6.0-rc.1/${'a'.repeat(64)}/`);
            for (const version of ['3.6.0-rc.0', '3.6.0-rc.10', '3.6.0-0a.01b']) {
                expect(contract.validateVersion(version)).toBe(version);
            }
        });

        it.each([
            '/core/dist/mparticle.js',
            'core\\dist\\mparticle.js',
            'core//mparticle.js',
            'core/./mparticle.js',
            'core/../mparticle.js',
            'core/dist/',
            ' ',
            'core/\u0000.js',
            'core/\u0085.js',
        ])('rejects unsafe object path %j', unsafe => {
            expect(contract.isSafeObjectPath(unsafe)).toBe(false);
            expect(() => contract.candidateKey('3.5.0', '1-1', unsafe)).toThrow(
                /safe object path/
            );
        });
    });

    describe('pointer', () => {
        it('serializes exactly five fields with four-space indentation', () => {
            const bytes = pointerBytesFor(buildCandidate());
            const text = bytes.toString('utf8');
            expect(text.endsWith('}\n')).toBe(true);
            expect(text).not.toContain('\r');
            expect(Object.keys(JSON.parse(text))).toEqual([
                'schemaVersion',
                'version',
                'buildId',
                'candidatePrefix',
                'metadataSha256',
            ]);
            expect(text.split('\n')[1]).toBe('    "schemaVersion": 1,');
            expect(bytes.length).toBeLessThanOrEqual(contract.MAX_POINTER_BYTES);
        });

        it.each([
            ['schema version 2', (p: any) => (p.schemaVersion = 2)],
            ['a string schema version', (p: any) => (p.schemaVersion = '1')],
            ['an invalid version', (p: any) => (p.version = '3.5')],
            ['an invalid build ID', (p: any) => (p.buildId = '-1')],
            ['an invalid digest', (p: any) => (p.metadataSha256 = 'abc')],
            ['a missing field', (p: any) => delete p.metadataSha256],
            [
                'a prefix without a trailing slash',
                (p: any) => (p.candidatePrefix = p.candidatePrefix.slice(0, -1)),
            ],
            [
                'a prefix under another root',
                (p: any) =>
                    (p.candidatePrefix = 'web-sdk/v2/candidates/3.5.0/12345-1/'),
            ],
            [
                'a prefix for another build',
                (p: any) =>
                    (p.candidatePrefix = 'web-sdk/v3/candidates/3.5.0/99-1/'),
            ],
            [
                'an unsafe prefix',
                (p: any) =>
                    (p.candidatePrefix =
                        'web-sdk/v3/candidates/3.5.0//12345-1/'),
            ],
        ])('rejects %s in both modes', (_label, mutate) => {
            const bytes = pointerWith(mutate);
            expect(() => contract.parsePointer(bytes)).toThrow();
            expect(() =>
                contract.parsePointer(bytes, { canonical: false })
            ).toThrow();
        });

        it('accepts the optional channel field and can bind it', () => {
            const bytes = pointerWith((p: any) => (p.channel = 'ga'));
            expect(contract.parsePointer(bytes).channel).toBe('ga');
            expect(
                contract.parsePointer(bytes, { expectedChannel: 'ga' }).version
            ).toBe('3.5.0');
            for (const canonical of [true, false]) {
                expect(() =>
                    contract.parsePointer(bytes, {
                        canonical,
                        expectedChannel: 'v3-staging',
                    })
                ).toThrow(/different channel/);
                expect(() =>
                    contract.parsePointer(
                        pointerWith((p: any) => (p.channel = 'production')),
                        { canonical }
                    )
                ).toThrow(/channel is invalid/);
            }
            expect(
                contract
                    .serializePointer(contract.parsePointer(bytes))
                    .equals(pointerBytesFor(buildCandidate()))
            ).toBe(true);
        });

        it.each([
            ['an unknown field', (p: any) => (p.region = 'us')],
            [
                'an uppercase digest',
                (p: any) => (p.metadataSha256 = p.metadataSha256.toUpperCase()),
            ],
        ])('accepts %s only when reader-lenient', (_label, mutate) => {
            const bytes = pointerWith(mutate);
            expect(() => contract.parsePointer(bytes)).toThrow();
            expect(
                contract.parsePointer(bytes, { canonical: false }).version
            ).toBe('3.5.0');
        });

        it('accepts a build metadata version only when reader-lenient', () => {
            const bytes = pointerWith((p: any) => {
                p.version = '3.5.0+a';
                p.candidatePrefix = 'web-sdk/v3/candidates/3.5.0+a/12345-1/';
            });
            expect(() => contract.parsePointer(bytes)).toThrow(/build metadata/);
            expect(
                contract.parsePointer(bytes, { canonical: false }).version
            ).toBe('3.5.0+a');
        });

        it.each([
            [
                'reordered fields',
                (text: string) =>
                    JSON.stringify(
                        { version: '3.5.0', ...JSON.parse(text) },
                        null,
                        4
                    ) + '\n',
            ],
            ['CRLF line endings', (text: string) => text.replace(/\n/g, '\r\n')],
            ['no trailing newline', (text: string) => text.trimEnd()],
            ['two-space indentation', (text: string) => text.replace(/ {4}/g, '  ')],
            [
                'a duplicate key',
                (text: string) =>
                    text.replace(
                        '"schemaVersion": 1,',
                        '"schemaVersion": 2,\n    "schemaVersion": 1,'
                    ),
            ],
            ['a byte order mark', (text: string) => `\ufeff${text}`],
        ])('rejects %s when canonical', (_label, mutate) => {
            const text = pointerBytesFor(buildCandidate()).toString('utf8');
            expect(() =>
                contract.parsePointer(Buffer.from(mutate(text), 'utf8'))
            ).toThrow();
        });

        it('rejects invalid UTF-8 and oversized pointers', () => {
            expect(() =>
                contract.parsePointer(Buffer.from([0x7b, 0xff, 0x7d]))
            ).toThrow(/UTF-8/);
            expect(() =>
                contract.parsePointer(
                    Buffer.alloc(contract.MAX_POINTER_BYTES + 1, 0x20)
                )
            ).toThrow(/allowed size/);
        });

        it('never serializes an invalid pointer', () => {
            expect(() =>
                contract.createPointer(
                    { version: '3.5.0', buildId: '1-1' },
                    'A'.repeat(64)
                )
            ).toThrow(/lowercase/);
        });
    });

    describe('metadata', () => {
        it.each([
            ['schema version 2', (m: any) => (m.schemaVersion = 2)],
            ['an invalid version', (m: any) => (m.version = 'latest')],
            ['an empty build ID', (m: any) => (m.buildId = '')],
            ['a build ID with a leading dash', (m: any) => (m.buildId = '-1')],
            ['a build ID with a slash', (m: any) => (m.buildId = '../evil')],
            ['a numeric build ID', (m: any) => (m.buildId = 12345)],
            ['an invalid source SHA', (m: any) => (m.sourceSha = 'abc')],
            ['no packages', (m: any) => (m.packages = [])],
            ['no files', (m: any) => (m.files = [])],
            ['a missing field', (m: any) => delete m.sourceSha],
            ['a null file entry', (m: any) => (m.files[0] = null)],
            ['a zero-byte file', (m: any) => (m.files[0].size = 0)],
            ['a negative size', (m: any) => (m.files[0].size = -1)],
            ['a fractional size', (m: any) => (m.files[0].size = 1.5)],
            [
                'a file over 100 MiB',
                (m: any) => (m.files[0].size = 100 * 1024 * 1024 + 1),
            ],
            ['an invalid digest', (m: any) => (m.files[0].sha256 = 'x')],
            ['an absolute path', (m: any) => (m.files[0].path = '/cdn-bundles.tgz')],
            ['a parent segment', (m: any) => (m.files[0].path = '../cdn-bundles.tgz')],
            [
                'itself as a file',
                (m: any) =>
                    m.files.push({
                        path: 'metadata.json',
                        size: 1,
                        sha256: '0'.repeat(64),
                    }),
            ],
            ['a duplicate file', (m: any) => m.files.push({ ...m.files[0] })],
            [
                'a duplicate package',
                (m: any) => m.packages.push({ ...m.packages[0] }),
            ],
            ['a blank package name', (m: any) => (m.packages[0].name = ' ')],
            [
                'a package outside npm/',
                (m: any) => (m.packages[0].path = 'cdn-bundles.tgz'),
            ],
            [
                'a package that is not a tarball',
                (m: any) => (m.packages[0].path = 'core/dist/mparticle.js'),
            ],
            [
                'an uninventoried package',
                (m: any) => (m.packages[0].path = 'npm/missing.tgz'),
            ],
            [
                'a non-sha512 integrity',
                (m: any) => (m.packages[0].npmIntegrity = 'sha1-abc='),
            ],
            [
                'a short integrity',
                (m: any) =>
                    (m.packages[0].npmIntegrity = `sha512-${Buffer.alloc(
                        32
                    ).toString('base64')}`),
            ],
            [
                'a non-base64 integrity',
                (m: any) => (m.packages[0].npmIntegrity = 'sha512-!!!!'),
            ],
        ])('rejects %s in both modes', (_label, mutate) => {
            const bytes = metadataWith(mutate);
            expect(() => contract.parseMetadata(bytes)).toThrow();
            expect(() =>
                contract.parseMetadata(bytes, { canonical: false })
            ).toThrow();
        });

        it.each([
            ['a newline', 'x\n::error title=injected::boom'],
            ['a NUL', '@mparticle/web-sdk\u0000'],
            ['an escape sequence', '\u001b[31m@mparticle/web-sdk'],
            ['a C1 control', '@mparticle/web-sdk\u0085'],
        ])(
            'rejects a package name with %s in both modes without echoing it',
            (_label, name) => {
                const bytes = metadataWith((m: any) => {
                    m.packages[0].name = name;
                    m.packages[0].npmIntegrity = 'sha512-!!!!';
                });
                for (const canonical of [true, false]) {
                    let message = '';
                    try {
                        contract.parseMetadata(bytes, { canonical });
                    } catch (error) {
                        message = (error as Error).message;
                    }
                    expect(message).toBe(
                        'Candidate metadata contains an invalid package'
                    );
                }
            }
        );

        it.each([
            ['an uppercase name', 'MParticle-Web-SDK'],
            ['a space', '@mparticle/web sdk'],
            ['a leading dot', '.web-sdk'],
            ['a leading underscore', '_web-sdk'],
            ['an empty scope', '@/web-sdk'],
            ['a nested scope', '@mparticle/web/sdk'],
            ['a name over 214 characters', `@mparticle/${'a'.repeat(204)}`],
        ])('rejects a package name with %s only when canonical', (_label, name) => {
            const bytes = metadataWith((m: any) => (m.packages[0].name = name));
            expect(() => contract.parseMetadata(bytes)).toThrow(
                /package name npm would reject/
            );
            expect(
                contract.parseMetadata(bytes, { canonical: false }).packages[0]
                    .name
            ).toBe(name);
        });

        it('rejects two packages sharing one npm artifact only when canonical', () => {
            const bytes = metadataWith((m: any) => {
                m.packages.push({
                    ...m.packages[0],
                    name: '@mparticle/z-kit',
                });
            });
            expect(() => contract.parseMetadata(bytes)).toThrow(
                /one npm artifact for two packages/
            );
            expect(
                contract.parseMetadata(bytes, { canonical: false }).packages
            ).toHaveLength(2);
        });

        it('accepts a 214-character package name', () => {
            const name = `@mparticle/${'a'.repeat(203)}`;
            expect(name).toHaveLength(214);
            const bytes = metadataWith((m: any) => (m.packages[0].name = name));
            expect(contract.parseMetadata(bytes).packages[0].name).toBe(name);
        });

        it.each(contract.REQUIRED_CORE_FILES as string[])(
            'requires the core bundle %s',
            requiredFile => {
                const bytes = metadataWith(m => {
                    m.files = m.files.filter(
                        (file: any) => file.path !== requiredFile
                    );
                });
                expect(() =>
                    contract.parseMetadata(bytes, { canonical: false })
                ).toThrow(requiredFile);
            }
        );

        it.each([
            ['unsorted files', (m: any) => m.files.reverse()],
            [
                'unsorted packages',
                (m: any) =>
                    m.packages.unshift({
                        ...m.packages[0],
                        name: '@mparticle/z-kit',
                    }),
            ],
            ['an unknown field', (m: any) => (m.channel = 'ga')],
            [
                'an uppercase file digest',
                (m: any) => (m.files[0].sha256 = m.files[0].sha256.toUpperCase()),
            ],
        ])('rejects %s only when canonical', (_label, mutate) => {
            const bytes = metadataWith(mutate);
            expect(() => contract.parseMetadata(bytes)).toThrow();
            expect(
                contract.parseMetadata(bytes, { canonical: false }).version
            ).toBe('3.5.0');
        });

        it.each([
            'core/mparticle.js',
            'core/dist/sub/mparticle.js',
            'core/dist/mparticle.js.map',
            'core/dist/.hidden.js',
            'kits/rokt/Rokt-Kit.js',
            'kits/a/b/c/d/dist/Kit.js',
            'kits/rokt/dist/dist/Rokt-Kit.js.gz',
            'kits/-rokt/dist/Rokt-Kit.js',
            'kits/rokt/dist/Rokt-Kit.d.ts',
            'npm/nested/pkg.tgz',
            'npm/pkg.tar',
            'README.md',
            'channels/ga/active-release.json',
        ])('rejects %j outside the candidate layout when canonical', path => {
            expect(contract.isCandidateLayoutPath(path)).toBe(false);
            const bytes = metadataWith((m: any) => {
                m.files.push({ path, size: 1, sha256: '0'.repeat(64) });
                m.files.sort((left: any, right: any) =>
                    contract.compareStrings(left.path, right.path)
                );
            });
            expect(() => contract.parseMetadata(bytes)).toThrow(
                /candidate layout/
            );
        });

        it('accepts every path of the packager layout', () => {
            for (const path of [
                ...READER_FIXTURE_PATHS,
                'kits/amplitude/amplitude-8/dist/Amplitude.esm.js',
                'kits/adobe/HeartbeatKit/dist/AdobeHBKit.iife.js',
                'kits/adobe/packages/AdobeClient/dist/AdobeClientSideKit.common.js',
            ]) {
                expect(contract.isCandidateLayoutPath(path)).toBe(true);
            }
        });

        it('rejects metadata over 10 MiB', () => {
            expect(() =>
                contract.parseMetadata(
                    Buffer.alloc(contract.MAX_METADATA_BYTES + 1, 0x20)
                )
            ).toThrow(/allowed size/);
        });

        it('binds metadata identity to the expected release', () => {
            const metadata = contract.parseMetadata(buildCandidate().metadataBytes);
            expect(() =>
                contract.validateMetadataIdentity(metadata, {
                    version: '3.5.1',
                    buildId: '12345-1',
                })
            ).toThrow(/version/);
            expect(() =>
                contract.validateMetadataIdentity(metadata, {
                    version: '3.5.0',
                    buildId: '12345-2',
                })
            ).toThrow(/build ID/);
        });
    });

    describe('release index entry', () => {
        const entry = {
            schemaVersion: 1,
            version: '3.5.0',
            buildId: '12345-1',
            metadataSha256: 'a'.repeat(64),
        };
        const bytes = () => contract.serializeReleaseIndexEntry(entry);

        it('lives at one key per V3 version, outside candidates and channels', () => {
            expect(contract.releaseIndexKey('3.5.0')).toBe('web-sdk/v3/releases/3.5.0.json');
            expect(contract.isReleaseIndexKey('web-sdk/v3/releases/3.5.0-rc.1.json')).toBe(true);
            for (const key of [
                'web-sdk/v3/releases/3.5.0',
                'web-sdk/v3/releases/2.30.0.json',
                'web-sdk/v3/releases/3.5.0+a.json',
                'web-sdk/v3/releases/x/3.5.0.json',
                'web-sdk/v3/releases/.json',
                contract.pointerKey('ga'),
            ]) {
                expect(contract.isReleaseIndexKey(key)).toBe(false);
            }
            expect(() => contract.releaseIndexKey('3.5.0/../x')).toThrow(/SemVer/);
            expect(contract.isCandidateKey(contract.releaseIndexKey('3.5.0'))).toBe(false);
            expect(contract.isPointerKey(contract.releaseIndexKey('3.5.0'))).toBe(false);
        });

        it('serializes canonically and round-trips', () => {
            expect(bytes().toString('utf8')).toBe(`${JSON.stringify(entry, null, 4)}\n`);
            expect(contract.parseReleaseIndexEntry(bytes(), '3.5.0')).toEqual(entry);
            expect(
                contract.createReleaseIndexEntry(
                    contract.createPointer({ version: '3.5.0', buildId: '12345-1' }, 'a'.repeat(64))
                )
            ).toEqual(entry);
        });

        it.each([
            ['another version', () => contract.serializeCanonical({ ...entry, version: '3.5.1' }), /names a different version/],
            ['an unknown field', () => contract.serializeCanonical({ ...entry, extra: 1 }), /not canonical/],
            [
                'reordered fields',
                () =>
                    contract.serializeCanonical({
                        version: entry.version,
                        schemaVersion: 1,
                        buildId: entry.buildId,
                        metadataSha256: entry.metadataSha256,
                    }),
                /not canonical/,
            ],
            ['compact JSON', () => Buffer.from(JSON.stringify(entry)), /not canonical/],
            ['uppercase hex', () => contract.serializeCanonical({ ...entry, metadataSha256: 'A'.repeat(64) }), /64 lowercase/],
            ['a missing build', () => contract.serializeCanonical({ ...entry, buildId: undefined }), /missing buildId/],
            ['schema 2', () => contract.serializeCanonical({ ...entry, schemaVersion: 2 }), /schema version/],
            ['an array', () => Buffer.from('[]'), /JSON object/],
            ['an oversized document', () => Buffer.alloc(contract.MAX_RELEASE_INDEX_BYTES + 1, 32), /exceeds/],
        ])('rejects %s', (_label, make, pattern) => {
            expect(() => contract.parseReleaseIndexEntry(make(), '3.5.0')).toThrow(pattern);
        });
    });

    describe('object headers', () => {
        it.each([
            [
                'core/dist/mparticle.js',
                'application/javascript; charset=utf-8',
            ],
            ['kits/rokt/dist/Rokt-Kit.iife.js.map', 'application/json'],
            ['metadata.json', 'application/json'],
            ['npm/mparticle-web-sdk-3.5.0.tgz', 'application/gzip'],
            ['cdn-bundles.tgz', 'application/gzip'],
        ])('fixes %s as %s and immutable', (filePath, contentType) => {
            expect(contract.candidateObjectHeaders(filePath)).toEqual({
                contentType,
                cacheControl: 'public, max-age=31536000, immutable',
            });
        });

        it('uses no-cache JSON for pointers and rejects unknown files', () => {
            expect(contract.POINTER_HEADERS).toEqual({
                contentType: 'application/json',
                cacheControl: 'no-cache',
            });
            expect(() => contract.candidateObjectHeaders('README.md')).toThrow(
                /content type/
            );
        });
    });

    describe('compareVersions', () => {
        it('orders versions by SemVer 2.0 precedence', () => {
            const ordered = [
                '3.0.0-alpha',
                '3.0.0-alpha.1',
                '3.0.0-alpha.beta',
                '3.0.0-beta',
                '3.0.0-beta.2',
                '3.0.0-beta.11',
                '3.0.0-rc.1',
                '3.0.0',
                '3.0.1',
                '3.9.0',
                '3.10.0',
                '3.10.2',
                '10.0.0',
            ];
            for (let i = 0; i < ordered.length; i++) {
                for (let j = 0; j < ordered.length; j++) {
                    expect(contract.compareVersions(ordered[i], ordered[j])).toBe(
                        Math.sign(i - j)
                    );
                }
            }
        });

        it('ignores build metadata and rejects non-SemVer input', () => {
            expect(contract.compareVersions('3.1.0+a', '3.1.0+b')).toBe(0);
            expect(contract.compareVersions('3.1.0', '3.1.0')).toBe(0);
            expect(() => contract.compareVersions('3.1', '3.1.0')).toThrow(/SemVer/);
            expect(() => contract.compareVersions('3.1.0', 'v3.1.0')).toThrow(/SemVer/);
        });
    });
});
