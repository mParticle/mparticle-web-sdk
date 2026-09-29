import * as fs from 'fs';
import * as path from 'path';
import {
    FAKE_ACCOUNT_ID,
    FAKE_BUCKET,
    argValue,
    installFakeAws,
} from './v3-release/fake-aws';
import {
    CapturedOutput,
    FIXTURE_DIRECTORY,
    TestCandidate,
    buildCandidate,
    makeTempDirectory,
    pointerBytesFor,
    seedCandidate,
    seedPointer,
} from './v3-release/helpers';

const contract = require('../../scripts/v3-release/release-contract.ts');
const {
    InMemoryReleaseStorage,
} = require('../../scripts/v3-release/in-memory-release-storage.ts');
const progress = require('../../scripts/v3-release/release-progress.ts');
const promoter = require('../../scripts/v3-release/promote-v3-release.ts');

const STAGING = 'v3-staging';
const ORDER_A = 'v3-release-order-a';
const GA_ORDER = ['v3-release-order-a', 'v3-release-order-b', 'v3-release-order-c', 'ga'];

// The fake AWS CLI starts a node process per call.
jest.setTimeout(60000);

describe('V3 release promoter', () => {
    let directory: string;
    let previous: TestCandidate;
    let next: TestCandidate;
    let storage: any;
    let output: CapturedOutput;
    let progressFile: string;

    beforeEach(() => {
        directory = makeTempDirectory('v3-release-promote-');
        progressFile = path.join(directory, 'progress.jsonl');
        previous = buildCandidate({ version: '3.4.1', buildId: '100-1', salt: 'previous ' });
        next = buildCandidate({ version: '3.5.0', buildId: '12345-1' });
        storage = new InMemoryReleaseStorage();
        seedCandidate(storage, previous);
        seedCandidate(storage, next);
        output = new CapturedOutput();
    });

    afterEach(() => {
        fs.rmSync(directory, { recursive: true, force: true });
    });

    async function run(...args: string[]): Promise<number> {
        return promoter.main([...args, '--progress-file', progressFile], {
            env: {},
            log: output.write,
            createStorage: () => storage,
        });
    }

    async function failureOf(...args: string[]): Promise<string> {
        try {
            await run(...args);
        } catch (error) {
            return (error as Error).message;
        }
        throw new Error('Expected the promoter to fail');
    }

    function pointerOn(channel: string): Buffer | undefined {
        return storage.bytesOf(contract.pointerKey(channel));
    }

    function records() {
        return progress.readProgressRecords(progressFile);
    }

    describe('stage (Step 1)', () => {
        it('creates the first v3-staging pointer with If-None-Match and canonical bytes', async () => {
            expect(await run('stage', '--version', '3.5.0', '--build-id', '12345-1')).toBe(0);
            const writes = storage.writes();
            expect(writes).toEqual([
                {
                    operation: 'putIfAbsent',
                    key: 'web-sdk/v3/channels/v3-staging/active-release.json',
                    etag: undefined,
                    headers: { contentType: 'application/json', cacheControl: 'no-cache' },
                },
            ]);
            expect(
                pointerOn(STAGING).equals(
                    fs.readFileSync(path.join(FIXTURE_DIRECTORY, 'active-release.json'))
                )
            ).toBe(true);
            expect(output.text).toContain('v3-staging before: none');
            expect(output.text).toContain(
                `v3-staging after:  3.5.0 build 12345-1 metadata ${next.metadataSha256} [updated]`
            );
            expect(records()).toEqual([
                expect.objectContaining({
                    operation: 'stage',
                    status: 'succeeded',
                    transitions: [
                        {
                            channel: STAGING,
                            before: null,
                            after: {
                                version: '3.5.0',
                                buildId: '12345-1',
                                metadataSha256: next.metadataSha256,
                            },
                            status: 'updated',
                        },
                    ],
                }),
            ]);
        });

        it('replaces an existing pointer with If-Match on the ETag it read and prints the rollback target', async () => {
            seedPointer(storage, STAGING, previous);
            const etag = (await storage.getObject(contract.pointerKey(STAGING), 1e5)).etag;
            await run('stage', '--version', '3.5.0', '--build-id', '12345-1');
            expect(storage.writes()).toEqual([
                expect.objectContaining({ operation: 'putIfMatch', etag }),
            ]);
            expect(output.text).toContain(
                `v3-staging before: 3.4.1 build 100-1 metadata ${previous.metadataSha256}`
            );
            expect(output.text).toContain(
                'v3-staging rollback target: rollback --channel v3-staging --version 3.4.1 --build-id 100-1 --pod local'
            );
        });

        it('is a no-op when the channel already selects the candidate', async () => {
            seedPointer(storage, STAGING, next);
            await run('stage', '--version', '3.5.0', '--build-id', '12345-1');
            expect(storage.writes()).toEqual([]);
            expect(output.text).toContain('[unchanged]');
        });

        it('binds an expected metadata SHA-256', async () => {
            expect(
                await failureOf(
                    'stage',
                    '--version',
                    '3.5.0',
                    '--build-id',
                    '12345-1',
                    '--expected-metadata-sha256',
                    previous.metadataSha256
                )
            ).toMatch(/does not match --expected-metadata-sha256/);
            expect(storage.writes()).toEqual([]);
        });
    });

    describe('candidate verification before any write', () => {
        const key = (candidate: TestCandidate, filePath: string) =>
            `${candidate.prefix}${filePath}`;

        it.each([
            [
                'a candidate without metadata.json',
                (s: any) => s.objects.delete(key(next, 'metadata.json')),
                /metadata.json failed \(NotFound\)/,
            ],
            [
                'a missing file',
                (s: any) => s.objects.delete(key(next, 'kits/rokt/dist/Rokt-Kit.iife.js')),
                /Rokt-Kit.iife.js failed \(NotFound\)/,
            ],
            [
                'a file whose bytes differ',
                (s: any) =>
                    s.seed(
                        key(next, 'kits/braze/braze-5/dist/BrazeKit.iife.js'),
                        Buffer.from('fixture kits/braze/braze-5/dist/BrazeKit.iife.XX'),
                        contract.candidateObjectHeaders('x.js')
                    ),
                /BrazeKit.iife.js does not match its metadata/,
            ],
            [
                'a file stored with Content-Encoding',
                (s: any) =>
                    s.seed(
                        key(next, 'core/dist/mparticle.js'),
                        next.files.get('core/dist/mparticle.js'),
                        contract.candidateObjectHeaders('x.js'),
                        'gzip'
                    ),
                /mparticle.js has unexpected headers/,
            ],
            [
                'metadata for another build under this prefix',
                (s: any) =>
                    s.seed(
                        key(next, 'metadata.json'),
                        buildCandidate({ version: '3.5.0', buildId: '999-1' }).metadataBytes,
                        contract.candidateObjectHeaders('metadata.json')
                    ),
                /build ID does not match/,
            ],
            [
                'non-canonical metadata',
                (s: any) =>
                    s.seed(
                        key(next, 'metadata.json'),
                        Buffer.from(JSON.stringify(next.metadata)),
                        contract.candidateObjectHeaders('metadata.json')
                    ),
                /not canonical/,
            ],
        ])('refuses %s', async (_label, mutate, pattern) => {
            mutate(storage);
            expect(await failureOf('stage', '--version', '3.5.0', '--build-id', '12345-1')).toMatch(
                pattern
            );
            expect(storage.writes()).toEqual([]);
            expect(records()).toEqual([
                expect.objectContaining({ status: 'failed', transitions: [] }),
            ]);
        });

        it('checks npm integrity only at full depth', async () => {
            const tarball = `npm/mparticle-web-sdk-3.5.0.tgz`;
            const tampered = JSON.parse(JSON.stringify(next.metadata));
            tampered.packages[0].npmIntegrity = contract.npmIntegrityFor(Buffer.from('x'));
            const bytes = contract.serializeCanonical(tampered);
            storage.seed(key(next, 'metadata.json'), bytes, contract.candidateObjectHeaders('metadata.json'));
            const sha = contract.sha256Hex(bytes);
            expect(
                await failureOf('stage', '--version', '3.5.0', '--build-id', '12345-1')
            ).toMatch(new RegExp(`${tarball} does not match its integrity`));
            expect(
                await run('stage', '--version', '3.5.0', '--build-id', '12345-1', '--verify', 'required')
            ).toBe(0);
            expect(contract.parsePointer(pointerOn(STAGING)).metadataSha256).toBe(sha);
        });
    });

    describe('promote (Step 2) and the staging safeguard', () => {
        it('copies the staging pointer to one release order', async () => {
            seedPointer(storage, STAGING, next);
            seedPointer(storage, ORDER_A, previous);
            expect(await run('promote', '--from', STAGING, '--to', ORDER_A, '--version', '3.5.0')).toBe(0);
            expect(pointerOn(ORDER_A).equals(pointerOn(STAGING))).toBe(true);
            expect(storage.writes().map((call: any) => call.key)).toEqual([contract.pointerKey(ORDER_A)]);
        });

        it.each([
            ['v3-staging serves another version', () => seedPointer(storage, STAGING, previous), /serves 3.4.1, not 3.5.0/],
            ['v3-staging has no pointer', () => undefined, /v3-staging has no valid pointer/],
            [
                'v3-staging holds an invalid pointer',
                () => storage.seed(contract.pointerKey(STAGING), Buffer.from('{}')),
                /v3-staging has no valid pointer \(Active release pointer is missing schemaVersion\)/,
            ],
        ])('refuses when %s', async (_label, arrange, pattern) => {
            arrange();
            expect(
                await failureOf('promote', '--from', STAGING, '--to', ORDER_A, '--version', '3.5.0')
            ).toMatch(pattern);
            expect(await failureOf('promote-ga', '--version', '3.5.0')).toMatch(pattern);
            expect(storage.writes()).toEqual([]);
        });

        it('refuses when staging serves another build of the version', async () => {
            seedPointer(storage, STAGING, next);
            expect(
                await failureOf('promote-ga', '--version', '3.5.0', '--build-id', '12345-2')
            ).toMatch(/serves build 12345-1, not 12345-2/);
            expect(storage.writes()).toEqual([]);
        });

        it.each([
            [['promote', '--from', STAGING, '--to', 'ga', '--version', '3.5.0'], /use promote-ga for ga/],
            [['promote', '--from', ORDER_A, '--to', 'v3-release-order-b', '--version', '3.5.0'], /--from v3-staging/],
            [['promote', '--to', ORDER_A, '--version', '3.5.0'], /--from v3-staging/],
            [['promote', '--from', STAGING, '--to', 'production', '--version', '3.5.0'], /Channel must be one of/],
            [['stage', '--version', '3.5.0', '--build-id', '1-1', '--channel', 'ga'], /stage does not accept --channel/],
            [['show', '--channel', 'ga', '--dry-run'], /read-only/],
            [['publish', '--version', '3.5.0'], /Operation must be one of/],
            [['stage', '--version', '2.30.0', '--build-id', '1-1'], /V3 version/],
            [['rollback', '--channel', 'ga', '--version', '3.5.0', '--verify', 'none'], /--verify must be/],
        ])('rejects %j', async (args, pattern) => {
            expect(() => promoter.parseArguments(args)).toThrow(pattern);
        });

        it('requires the operation inputs it needs', async () => {
            expect(await failureOf('stage', '--version', '3.5.0')).toMatch(/--build-id is required/);
            expect(await failureOf('rollback', '--version', '3.5.0', '--build-id', '1-1')).toMatch(
                /--channel is required/
            );
        });
    });

    describe('promote-ga (Step 3)', () => {
        it('updates every release order, then ga, from the staging candidate', async () => {
            seedPointer(storage, STAGING, next);
            seedPointer(storage, 'v3-release-order-b', next);
            expect(await run('promote-ga', '--version', '3.5.0')).toBe(0);
            for (const channel of GA_ORDER) {
                expect(pointerOn(channel).equals(pointerBytesFor(next))).toBe(true);
            }
            expect(storage.writes().map((call: any) => [call.operation, call.key])).toEqual([
                ['putIfAbsent', contract.pointerKey('v3-release-order-a')],
                ['putIfAbsent', contract.pointerKey('v3-release-order-c')],
                ['putIfAbsent', contract.pointerKey('ga')],
            ]);
            expect(records()[0].transitions.map((t: any) => [t.channel, t.status])).toEqual([
                ['v3-release-order-a', 'updated'],
                ['v3-release-order-b', 'unchanged'],
                ['v3-release-order-c', 'updated'],
                ['ga', 'updated'],
            ]);
            expect(storage.writes().some((call: any) => contract.isCandidateKey(call.key))).toBe(false);
        });

        it('stops at the first failed channel and reports what already moved', async () => {
            seedPointer(storage, STAGING, next);
            storage.injectFault({ operation: 'putIfAbsent', key: contract.pointerKey('v3-release-order-c'), code: 'AccessDenied' });
            expect(await failureOf('promote-ga', '--version', '3.5.0')).toMatch(/v3-release-order-c.*\(AccessDenied\)/);
            expect(pointerOn('ga')).toBeUndefined();
            const [record] = records();
            expect(record.status).toBe('failed');
            expect(record.transitions.map((t: any) => t.channel)).toEqual([
                'v3-release-order-a',
                'v3-release-order-b',
            ]);
            expect(output.text).toContain('v3-release-order-b after:  3.5.0 build 12345-1');
        });
    });

    describe('conditional writes', () => {
        it('refuses without retrying when the pointer changes between read and write', async () => {
            seedPointer(storage, STAGING, next);
            seedPointer(storage, ORDER_A, previous);
            const concurrent = pointerBytesFor(buildCandidate({ version: '3.5.1', buildId: '777-1' }));
            storage.options.beforeWrite = (_operation: string, key: string, target: any) => {
                if (key === contract.pointerKey(ORDER_A)) {
                    target.seed(key, concurrent, contract.POINTER_HEADERS);
                }
            };
            expect(
                await failureOf('promote', '--from', STAGING, '--to', ORDER_A, '--version', '3.5.0')
            ).toMatch(/pointer changed after it was read; nothing was overwritten/);
            expect(pointerOn(ORDER_A).equals(concurrent)).toBe(true);
            expect(storage.writes()).toHaveLength(1);
        });

        it('refuses a first promotion when another writer creates the pointer first', async () => {
            const concurrent = pointerBytesFor(previous);
            storage.options.beforeWrite = (_operation: string, key: string, target: any) =>
                target.seed(key, concurrent, contract.POINTER_HEADERS);
            expect(await failureOf('stage', '--version', '3.5.0', '--build-id', '12345-1')).toMatch(
                /nothing was overwritten/
            );
            expect(storage.writes()[0].operation).toBe('putIfAbsent');
            expect(pointerOn(STAGING).equals(concurrent)).toBe(true);
        });

        it('fails loudly when the pointer does not read back as written, still recording what it replaced', async () => {
            seedPointer(storage, STAGING, previous);
            storage.options.corruptRead = (key: string, bytes: Buffer) =>
                key === contract.pointerKey(STAGING) && !bytes.equals(pointerBytesFor(previous))
                    ? Buffer.concat([bytes, Buffer.from(' ')])
                    : bytes;
            expect(await failureOf('stage', '--version', '3.5.0', '--build-id', '12345-1')).toMatch(
                /Pointer readback for v3-staging does not match/
            );
            expect(output.text).toContain(
                `v3-staging before: 3.4.1 build 100-1 metadata ${previous.metadataSha256}`
            );
            expect(output.text).toContain(
                'v3-staging rollback target: rollback --channel v3-staging --version 3.4.1 --build-id 100-1 --pod local'
            );
            expect(records()).toEqual([
                expect.objectContaining({
                    status: 'failed',
                    transitions: [expect.objectContaining({ channel: STAGING, status: 'updated' })],
                }),
            ]);
        });

        it('explains a missing pointer that the role cannot distinguish from a denial', async () => {
            storage.options.missingObjectCode = 'AccessDenied';
            expect(await failureOf('stage', '--version', '3.5.0', '--build-id', '12345-1')).toMatch(
                /allowed to list the pointer key before its first promotion/
            );
            expect(storage.writes()).toEqual([]);
        });

        it('writes only pointer keys, only conditionally, and never copies candidates', async () => {
            await run('stage', '--version', '3.5.0', '--build-id', '12345-1');
            await run('promote', '--from', STAGING, '--to', ORDER_A, '--version', '3.5.0');
            await run('promote-ga', '--version', '3.5.0');
            await run('rollback', '--channel', 'ga', '--version', '3.4.1', '--build-id', '100-1');
            const writes = storage.writes();
            expect(writes.length).toBeGreaterThan(0);
            for (const write of writes) {
                expect(['putIfAbsent', 'putIfMatch']).toContain(write.operation);
                expect(contract.isPointerKey(write.key)).toBe(true);
                expect(contract.isCandidateKey(write.key)).toBe(false);
                expect(write.headers).toEqual(contract.POINTER_HEADERS);
            }
            expect(
                writes.filter((write: any) => write.operation === 'putIfMatch')
                    .every((write: any) => typeof write.etag === 'string' && write.etag !== '')
            ).toBe(true);
            const source = fs.readFileSync(
                require.resolve('../../scripts/v3-release/promote-v3-release.ts'),
                'utf8'
            );
            expect(source).not.toMatch(/copyObject|deleteObject|candidateKey\(/i);
        });

        it('treats a pointer that names another channel as unreadable', async () => {
            const bytes = contract.serializeCanonical({
                ...JSON.parse(pointerBytesFor(previous).toString()),
                channel: 'ga',
            });
            storage.seed(contract.pointerKey(ORDER_A), bytes, contract.POINTER_HEADERS);
            await run('rollback', '--channel', ORDER_A, '--version', '3.4.1', '--build-id', '100-1');
            expect(output.text).toContain(
                'v3-release-order-a before: unreadable (Active release pointer names a different channel)'
            );
            expect(storage.writes()).toEqual([
                expect.objectContaining({ operation: 'putIfMatch', key: contract.pointerKey(ORDER_A) }),
            ]);
            expect(pointerOn(ORDER_A).equals(pointerBytesFor(previous))).toBe(true);
        });

        it('overwrites an unreadable pointer only with If-Match', async () => {
            storage.seed(contract.pointerKey(ORDER_A), Buffer.from('not json'));
            await run('rollback', '--channel', ORDER_A, '--version', '3.4.1', '--build-id', '100-1');
            expect(storage.writes()[0].operation).toBe('putIfMatch');
            expect(output.text).toContain('v3-release-order-a before: unreadable (Active release pointer is not valid JSON)');
        });
    });

    describe('rollback', () => {
        it('bypasses the staging safeguard but still verifies, and round-trips A to B to A', async () => {
            seedPointer(storage, STAGING, next);
            seedPointer(storage, ORDER_A, previous);
            await run('promote', '--from', STAGING, '--to', ORDER_A, '--version', '3.5.0');
            expect(pointerOn(ORDER_A).equals(pointerBytesFor(next))).toBe(true);
            expect(output.text).toContain(
                'v3-release-order-a rollback target: rollback --channel v3-release-order-a --version 3.4.1 --build-id 100-1 --pod local'
            );

            await run('rollback', '--channel', ORDER_A, '--version', '3.4.1', '--build-id', '100-1');
            expect(pointerOn(ORDER_A).equals(pointerBytesFor(previous))).toBe(true);
            expect(pointerOn(STAGING).equals(pointerBytesFor(next))).toBe(true);
            expect(output.text).toContain('Rollback bypasses the staging safeguard');
        });

        it('refuses to roll back to a candidate that fails verification', async () => {
            seedPointer(storage, ORDER_A, next);
            storage.objects.delete(`${previous.prefix}core/dist/mparticle.stub.js`);
            expect(
                await failureOf('rollback', '--channel', ORDER_A, '--version', '3.4.1', '--build-id', '100-1')
            ).toMatch(/mparticle.stub.js failed \(NotFound\)/);
            expect(storage.writes()).toEqual([]);
        });
    });

    describe('dry run and show', () => {
        it.each([
            [['stage', '--version', '3.4.1', '--build-id', '100-1']],
            [['promote', '--from', STAGING, '--to', ORDER_A, '--version', '3.5.0']],
            [['promote-ga', '--version', '3.5.0']],
            [['rollback', '--channel', 'ga', '--version', '3.4.1', '--build-id', '100-1']],
        ])('%j --dry-run verifies but writes nothing', async args => {
            seedPointer(storage, STAGING, next);
            expect(await run(...args, '--dry-run')).toBe(0);
            expect(storage.writes()).toEqual([]);
            expect(output.text).toContain('dry run: no pointer will be written');
            expect(output.text).toContain('[planned]');
            expect(records()[0].status).toBe('dry-run');
        });

        it('dry run still refuses an unverifiable candidate', async () => {
            storage.objects.delete(`${next.prefix}cdn-bundles.tgz`);
            expect(
                await failureOf('stage', '--version', '3.5.0', '--build-id', '12345-1', '--dry-run')
            ).toMatch(/cdn-bundles.tgz failed \(NotFound\)/);
        });

        it('shows a channel read-only and verifies what it selects', async () => {
            seedPointer(storage, 'ga', previous);
            expect(await run('show', '--channel', 'ga')).toBe(0);
            expect(await run('show', '--channel', ORDER_A)).toBe(0);
            expect(storage.writes()).toEqual([]);
            expect(output.text).toContain(`ga after:  3.4.1 build 100-1 metadata ${previous.metadataSha256} [read]`);
            expect(output.text).toContain('Candidate: 3.4.1 build 100-1');
            expect(output.text).toContain('v3-release-order-a before: none');
            expect(output.text).not.toContain('rollback target');
        });

        it('show fails, still printing the pointer, when its candidate is broken', async () => {
            seedPointer(storage, 'ga', previous);
            storage.objects.delete(`${previous.prefix}core/dist/mparticle.js`);
            expect(await failureOf('show', '--channel', 'ga')).toMatch(/ga candidate failed verification/);
            expect(output.text).toContain('ga before: 3.4.1 build 100-1');
        });
    });

    describe('through the AWS CLI adapter across pods', () => {
        const pods = ['qa', 'us1', 'us2'];

        function podEnvironment(pod: string, config: any = {}) {
            const fake = installFakeAws(path.join(directory, pod), config);
            return {
                fake,
                env: {
                    ...process.env,
                    ...fake.env,
                    SDK_ARTIFACT_BUCKET: FAKE_BUCKET,
                    AWS_ACCOUNT_ID: FAKE_ACCOUNT_ID,
                },
            };
        }

        function seedFake(fake: any, candidate: TestCandidate) {
            candidate.files.forEach((bytes, filePath) =>
                fake.seed(`${candidate.prefix}${filePath}`, bytes, contract.candidateObjectHeaders(filePath))
            );
            fake.seed(
                `${candidate.prefix}metadata.json`,
                candidate.metadataBytes,
                contract.candidateObjectHeaders('metadata.json')
            );
        }

        it('stages, promotes with conditional writes and reports a partial multi-pod failure', async () => {
            const qa = podEnvironment('qa');
            const us1 = podEnvironment('us1', { deny: { put: ['web-sdk/v3/channels/v3-release-order-b/'] } });
            for (const { fake } of [qa, us1]) {
                seedFake(fake, next);
            }
            const cli = (env: any, pod: string, ...args: string[]) =>
                promoter.main([...args, '--pod', pod, '--progress-file', progressFile], {
                    env,
                    log: output.write,
                });

            for (const [pod, { env }] of [['qa', qa], ['us1', us1]] as Array<[string, any]>) {
                await cli(env, pod, 'stage', '--version', '3.5.0', '--build-id', '12345-1', '--verify', 'required');
            }
            await cli(qa.env, 'qa', 'promote-ga', '--version', '3.5.0', '--verify', 'required');
            let failure = '';
            try {
                await cli(us1.env, 'us1', 'promote-ga', '--version', '3.5.0', '--verify', 'required');
            } catch (error) {
                failure = (error as Error).message;
            }
            expect(failure).toMatch(/v3-release-order-b.*\(AccessDenied\)/);

            const pointerPuts = qa.fake
                .calls()
                .filter(call => call[1] === 'put-object');
            expect(pointerPuts.every(call => argValue(call, '--key').startsWith('web-sdk/v3/channels/'))).toBe(true);
            expect(pointerPuts.every(call => argValue(call, '--if-none-match') === '*')).toBe(true);
            expect(pointerPuts.every(call => argValue(call, '--cache-control') === 'no-cache')).toBe(true);
            expect(pointerPuts.every(call => argValue(call, '--content-type') === 'application/json')).toBe(true);

            await cli(qa.env, 'qa', 'rollback', '--channel', 'ga', '--version', '3.5.0', '--build-id', '12345-1', '--verify', 'required');
            seedFake(qa.fake, previous);
            await cli(qa.env, 'qa', 'rollback', '--channel', 'ga', '--version', '3.4.1', '--build-id', '100-1', '--verify', 'required');
            const lastPut = qa.fake.calls().filter(call => call[1] === 'put-object').pop();
            expect(argValue(lastPut, '--if-match')).toMatch(/^"[0-9a-f]{32}"$/);
            expect(qa.fake.read(contract.pointerKey('ga')).equals(pointerBytesFor(previous))).toBe(true);

            const promoteRecords = progress
                .readProgressRecords(progressFile)
                .filter((record: any) => record.operation === 'promote-ga');
            const summary = progress.summarizeProgress(promoteRecords, pods);
            expect(summary).toContain('Changed pods: qa, us1');
            expect(summary).toContain('Failed pods: us1');
            expect(summary).toContain('Not attempted: us2');
            for (const text of [output.text, failure, fs.readFileSync(progressFile, 'utf8')]) {
                expect(text).not.toContain(FAKE_BUCKET);
                expect(text).not.toContain(FAKE_ACCOUNT_ID);
                expect(text).not.toContain('raw stderr');
            }
        });
    });
});
