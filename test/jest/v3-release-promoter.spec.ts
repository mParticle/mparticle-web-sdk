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
    SOURCE_SHA,
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
    let readBranchTips: jest.Mock;

    beforeEach(() => {
        readBranchTips = jest.fn(async (branches: string[]) => {
            const tips: Record<string, string> = {};
            branches.forEach(branch => (tips[branch] = SOURCE_SHA));
            return tips;
        });
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
            readBranchTips,
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

    function pointerWrites(): any[] {
        return storage.writes().filter((call: any) => contract.isPointerKey(call.key));
    }

    function indexEntryOn(version: string): any {
        const bytes = storage.bytesOf(contract.releaseIndexKey(version));
        return bytes && JSON.parse(bytes.toString('utf8'));
    }

    function seedIndex(candidate: TestCandidate): void {
        storage.seed(
            contract.releaseIndexKey(candidate.version),
            contract.serializeReleaseIndexEntry(
                contract.createReleaseIndexEntry(contract.createPointer(candidate, candidate.metadataSha256))
            ),
            contract.POINTER_HEADERS
        );
    }

    function records() {
        return progress.readProgressRecords(progressFile);
    }

    describe('stage (Step 1)', () => {
        it('creates the first v3-staging pointer with If-None-Match and canonical bytes', async () => {
            expect(await run('stage', '--version', '3.5.0', '--build-id', '12345-1')).toBe(0);
            const writes = pointerWrites();
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
            expect(pointerWrites()).toEqual([
                expect.objectContaining({ operation: 'putIfMatch', etag }),
            ]);
            expect(output.text).toContain(
                `v3-staging before: 3.4.1 build 100-1 metadata ${previous.metadataSha256}`
            );
            expect(output.text).toContain(
                'v3-staging rollback target: rollback --channel v3-staging --version 3.4.1 --build-id 100-1 --allow-downgrade --pod local'
            );
        });

        it('is a no-op when the channel already selects the candidate', async () => {
            seedPointer(storage, STAGING, next);
            await run('stage', '--version', '3.5.0', '--build-id', '12345-1');
            expect(pointerWrites()).toEqual([]);
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
            expect(pointerWrites().map((call: any) => call.key)).toEqual([contract.pointerKey(ORDER_A)]);
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
            expect(pointerWrites().map((call: any) => [call.operation, call.key])).toEqual([
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

    describe('waiting for v3-staging', () => {
        let sleeps: number[];
        let onSleep: (count: number) => void;
        let clock: number;
        let readMilliseconds: number;

        async function runWaiting(...args: string[]): Promise<number> {
            return promoter.main([...args, '--progress-file', progressFile], {
                env: {},
                log: output.write,
                createStorage: () => storage,
                readBranchTips,
                sleep: async (milliseconds: number) => {
                    sleeps.push(milliseconds);
                    clock += milliseconds + readMilliseconds;
                    onSleep(sleeps.length);
                },
                now: () => clock,
            });
        }

        async function waitingFailureOf(...args: string[]): Promise<string> {
            try {
                await runWaiting(...args);
            } catch (error) {
                return (error as Error).message;
            }
            throw new Error('Expected the promoter to fail');
        }

        beforeEach(() => {
            sleeps = [];
            onSleep = () => undefined;
            clock = 1e12;
            readMilliseconds = 0;
        });

        it('waits with backoff until the shadow upload stages the release, then promotes it', async () => {
            seedPointer(storage, STAGING, previous);
            onSleep = count => {
                if (count === 3) {
                    seedPointer(storage, STAGING, next);
                }
            };
            expect(await runWaiting('promote-ga', '--version', '3.5.0', '--wait-for-staging', '480')).toBe(0);
            expect(sleeps).toEqual([15000, 30000, 60000]);
            for (const channel of GA_ORDER) {
                expect(pointerOn(channel).equals(pointerBytesFor(next))).toBe(true);
            }
            expect(output.text).toContain(
                'v3-staging serves 3.4.1, not yet 3.5.0; checking again in 15s (waited 0s of 480s)'
            );
        });

        it('waits for a first v3-staging pointer', async () => {
            onSleep = () => seedPointer(storage, STAGING, next);
            expect(
                await runWaiting('promote', '--from', STAGING, '--to', ORDER_A, '--version', '3.5.0', '--wait-for-staging', '60')
            ).toBe(0);
            expect(sleeps).toEqual([15000]);
            expect(output.text).toContain('v3-staging serves no pointer, not yet 3.5.0');
            expect(pointerOn(ORDER_A).equals(pointerBytesFor(next))).toBe(true);
        });

        it('stops at the bound and refuses as before', async () => {
            seedPointer(storage, STAGING, previous);
            expect(
                await waitingFailureOf('promote-ga', '--version', '3.5.0', '--wait-for-staging', '480')
            ).toBe('v3-staging serves 3.4.1, not 3.5.0; refusing to promote');
            expect(sleeps).toEqual([15000, 30000, 60000, 120000, 120000, 105000]);
            // The last pause leaves the final read its whole timeout.
            expect(sleeps.reduce((total, value) => total + value, 0)).toBe(450000);
            expect(storage.writes()).toEqual([]);
        });

        it('bounds every re-read by the time the wait keeps for it', async () => {
            seedPointer(storage, STAGING, previous);
            await waitingFailureOf('promote-ga', '--version', '3.5.0', '--wait-for-staging', '480');
            const stagingReads = storage.calls.filter(
                (call: any) => call.operation === 'get' && call.key === contract.pointerKey(STAGING)
            );
            expect(stagingReads).toHaveLength(sleeps.length + 1);
            expect(stagingReads[0].timeoutMs).toBeUndefined();
            for (const read of stagingReads.slice(1)) {
                expect(read.timeoutMs).toBe(30000);
            }
        });

        it('counts slow reads against the bound', async () => {
            seedPointer(storage, STAGING, previous);
            readMilliseconds = 20000;
            expect(
                await waitingFailureOf('promote-ga', '--version', '3.5.0', '--wait-for-staging', '480')
            ).toMatch(/serves 3.4.1, not 3.5.0/);
            expect(sleeps).toEqual([15000, 30000, 60000, 120000, 120000, 5000]);
            // The final read starts 30 seconds before the bound and ends by it.
            const total = sleeps.reduce((sum, value) => sum + value, 0);
            expect(total + readMilliseconds * sleeps.length).toBe(470000);
            expect(output.text).toContain('checking again in 5s (waited 445s of 480s)');
        });

        it('does not wait when less time is left than one re-read needs', async () => {
            seedPointer(storage, STAGING, previous);
            expect(
                await waitingFailureOf('promote-ga', '--version', '3.5.0', '--wait-for-staging', '30')
            ).toMatch(/serves 3.4.1, not 3.5.0/);
            expect(sleeps).toEqual([]);
        });

        it.each([
            ['serves a newer release', () => seedPointer(storage, STAGING, buildCandidate({ version: '3.6.0', buildId: '1-1' })), /serves 3.6.0, not 3.5.0/],
            [
                'holds an invalid pointer',
                () => storage.seed(contract.pointerKey(STAGING), Buffer.from('{}')),
                /v3-staging has no valid pointer/,
            ],
        ])('refuses at once when v3-staging %s', async (_label, arrange, pattern) => {
            arrange();
            expect(
                await waitingFailureOf('promote-ga', '--version', '3.5.0', '--wait-for-staging', '480')
            ).toMatch(pattern);
            expect(sleeps).toEqual([]);
            expect(storage.writes()).toEqual([]);
        });

        it('refuses at once without --wait-for-staging', async () => {
            seedPointer(storage, STAGING, previous);
            expect(await waitingFailureOf('promote-ga', '--version', '3.5.0')).toMatch(
                /serves 3.4.1, not 3.5.0/
            );
            expect(sleeps).toEqual([]);
        });

        it.each([
            [['promote-ga', '--version', '3.5.0', '--wait-for-staging', '0'], /whole number of seconds/],
            [['promote-ga', '--version', '3.5.0', '--wait-for-staging', '1.5'], /whole number of seconds/],
            [['promote-ga', '--version', '3.5.0', '--wait-for-staging', '481'], /at most 480 seconds/],
            [['stage', '--version', '3.5.0', '--build-id', '1-1', '--wait-for-staging', '60'], /stage does not accept --wait-for-staging/],
            [['rollback', '--channel', 'ga', '--version', '3.5.0', '--build-id', '1-1', '--wait-for-staging', '60'], /rollback does not accept --wait-for-staging/],
            [['show', '--channel', 'ga', '--wait-for-staging', '60'], /show does not accept --wait-for-staging/],
        ])('rejects %j', (args, pattern) => {
            expect(() => promoter.parseArguments(args)).toThrow(pattern);
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
            ).toMatch(/pointer changed after it was read and does not name this candidate/);
            expect(pointerOn(ORDER_A).equals(concurrent)).toBe(true);
            expect(storage.writes()).toHaveLength(1);
        });

        it.each([
            ['an If-Match', 'putIfMatch', true],
            ['a create-only', 'putIfAbsent', false],
        ])('records %s write that landed before a PreconditionFailed retry', async (_label, operation, seeded) => {
            if (seeded) {
                seedPointer(storage, STAGING, previous);
            }
            storage.injectFault({ operation, code: 'PreconditionFailed', afterApply: true });
            expect(await run('stage', '--version', '3.5.0', '--build-id', '12345-1')).toBe(0);
            expect(pointerOn(STAGING).equals(pointerBytesFor(next))).toBe(true);
            expect(records()[0]).toEqual(
                expect.objectContaining({
                    status: 'succeeded',
                    transitions: [expect.objectContaining({ status: 'updated' })],
                })
            );
            expect(pointerWrites()).toHaveLength(1);
        });

        it('still refuses a PreconditionFailed when the pointer holds the target bytes with the wrong headers', async () => {
            seedPointer(storage, STAGING, previous);
            storage.options.beforeWrite = (_operation: string, key: string, target: any) =>
                target.seed(key, pointerBytesFor(next), { contentType: 'text/plain', cacheControl: 'no-cache' });
            expect(await failureOf('stage', '--version', '3.5.0', '--build-id', '12345-1')).toMatch(
                /pointer changed after it was read and does not name this candidate/
            );
        });

        it('refuses a first promotion when another writer creates the pointer first', async () => {
            const concurrent = pointerBytesFor(previous);
            storage.options.beforeWrite = (_operation: string, key: string, target: any) =>
                target.seed(key, concurrent, contract.POINTER_HEADERS);
            expect(await failureOf('stage', '--version', '3.5.0', '--build-id', '12345-1')).toMatch(
                /pointer changed after it was read and does not name this candidate/
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
                'v3-staging rollback target: rollback --channel v3-staging --version 3.4.1 --build-id 100-1 --allow-downgrade --pod local'
            );
            expect(records()).toEqual([
                expect.objectContaining({
                    status: 'failed',
                    transitions: [expect.objectContaining({ channel: STAGING, status: 'updated' })],
                }),
            ]);
        });

        it('creates a first pointer create-only when a missing key reads as denied', async () => {
            seedIndex(next);
            storage.options.missingObjectCode = 'AccessDenied';
            expect(await run('stage', '--version', '3.5.0', '--build-id', '12345-1')).toBe(0);
            expect(pointerWrites()).toEqual([
                expect.objectContaining({ operation: 'putIfAbsent', key: contract.pointerKey(STAGING) }),
            ]);
            expect(pointerOn(STAGING).equals(pointerBytesFor(next))).toBe(true);
            expect(output.text).toContain('v3-staging before: unreadable (read denied; written create-only)');
            expect(records()[0].transitions).toEqual([
                expect.objectContaining({ status: 'updated', before: 'read denied; written create-only' }),
            ]);
        });

        it('stops without overwriting when a denied read hides an existing pointer', async () => {
            seedPointer(storage, ORDER_A, previous);
            storage.options.deny = (operation: string, key: string) =>
                operation === 'get' && key === contract.pointerKey(ORDER_A);
            seedPointer(storage, STAGING, next);
            expect(
                await failureOf('promote', '--from', STAGING, '--to', ORDER_A, '--version', '3.5.0')
            ).toMatch(/v3-release-order-a pointer exists but reading it was denied; nothing was overwritten/);
            expect(storage.writes()).toEqual([
                expect.objectContaining({ operation: 'putIfAbsent', key: contract.pointerKey(ORDER_A) }),
            ]);
            expect(pointerOn(ORDER_A).equals(pointerBytesFor(previous))).toBe(true);
        });

        it('still fails closed on a denied read that feeds a decision', async () => {
            storage.options.missingObjectCode = 'AccessDenied';
            expect(await failureOf('show', '--channel', 'ga')).toMatch(/Reading the ga pointer was denied/);
            expect(
                await failureOf('promote', '--from', STAGING, '--to', ORDER_A, '--version', '3.5.0')
            ).toMatch(/Reading the v3-staging pointer was denied/);
            expect(storage.writes()).toEqual([]);
        });

        it.each(['Transient', 'Throttled', 'ConditionalConflict', 'Unknown'])(
            'records a %s write whose response was lost but which landed',
            async code => {
                seedPointer(storage, STAGING, previous);
                storage.injectFault({ operation: 'putIfMatch', code, afterApply: true });
                expect(await run('stage', '--version', '3.5.0', '--build-id', '12345-1')).toBe(0);
                expect(pointerOn(STAGING).equals(pointerBytesFor(next))).toBe(true);
                expect(records()[0]).toEqual(
                    expect.objectContaining({
                        status: 'succeeded',
                        transitions: [expect.objectContaining({ status: 'updated' })],
                    })
                );
                expect(output.text).toContain(
                    'v3-staging rollback target: rollback --channel v3-staging --version 3.4.1 --build-id 100-1 --allow-downgrade --pod local'
                );
                // The re-read, then the reader chain: pointer and required files.
                const reads = storage.calls.filter((call: any) => call.operation === 'get');
                expect(reads.filter((call: any) => call.key === contract.pointerKey(STAGING)).length).toBe(3);
            }
        );

        it('records a lost create-only response that landed', async () => {
            storage.injectFault({ operation: 'putIfAbsent', code: 'Transient', afterApply: true });
            expect(await run('stage', '--version', '3.5.0', '--build-id', '12345-1')).toBe(0);
            expect(records()[0].status).toBe('succeeded');
        });

        it('rethrows a transient write error that did not land', async () => {
            seedPointer(storage, STAGING, previous);
            storage.injectFault({ operation: 'putIfMatch', code: 'Transient' });
            expect(await failureOf('stage', '--version', '3.5.0', '--build-id', '12345-1')).toMatch(
                /\(Transient\)/
            );
            expect(pointerOn(STAGING).equals(pointerBytesFor(previous))).toBe(true);
            expect(records()[0]).toEqual(expect.objectContaining({ status: 'failed', transitions: [] }));
        });

        it('does not treat a landed-looking pointer with the wrong headers as success', async () => {
            seedPointer(storage, STAGING, previous);
            storage.injectFault({ operation: 'putIfMatch', code: 'Transient', afterApply: true });
            const originalPut = storage.putObjectIfMatch.bind(storage);
            storage.putObjectIfMatch = (key: string, bytes: Buffer, etag: string) =>
                originalPut(key, bytes, etag, { contentType: 'text/plain', cacheControl: 'no-cache' });
            expect(await failureOf('stage', '--version', '3.5.0', '--build-id', '12345-1')).toMatch(
                /\(Transient\)/
            );
        });

        it('writes only pointer keys, only conditionally, and never copies candidates', async () => {
            await run('stage', '--version', '3.5.0', '--build-id', '12345-1');
            await run('promote', '--from', STAGING, '--to', ORDER_A, '--version', '3.5.0');
            await run('promote-ga', '--version', '3.5.0');
            await run('rollback', '--channel', 'ga', '--version', '3.4.1', '--build-id', '100-1', '--allow-downgrade');
            const writes = storage.writes();
            expect(writes.length).toBeGreaterThan(0);
            for (const write of writes) {
                expect(['putIfAbsent', 'putIfMatch']).toContain(write.operation);
                expect(contract.isPointerKey(write.key) || contract.isReleaseIndexKey(write.key)).toBe(true);
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

    describe('stale-run guards', () => {
        const OTHER_SHA = 'fedcba9876543210fedcba9876543210fedcba98';

        it('refuses a delayed Step 1 run for an older release after a newer one staged', async () => {
            seedPointer(storage, STAGING, next);
            expect(await failureOf('stage', '--version', '3.4.1', '--build-id', '100-1')).toMatch(
                /v3-staging serves 3.5.0, which is newer than 3.4.1; refusing to move it backwards/
            );
            expect(storage.writes()).toEqual([]);
            expect(pointerOn(STAGING).equals(pointerBytesFor(next))).toBe(true);
        });

        it('refuses a delayed Step 2 run whose release order already serves a newer version', async () => {
            // Staging was re-pointed at the older release, so the staging
            // safeguard alone would let the stale run through.
            seedPointer(storage, STAGING, previous);
            seedPointer(storage, ORDER_A, next);
            expect(
                await failureOf('promote', '--from', STAGING, '--to', ORDER_A, '--version', '3.4.1')
            ).toMatch(/v3-release-order-a serves 3.5.0, which is newer than 3.4.1/);
            expect(storage.writes()).toEqual([]);
        });

        it('checks the version against the pointer read just before the write', async () => {
            // A newer release lands on order b while this Step 3 run is
            // working through order a.
            seedPointer(storage, STAGING, previous);
            const newer = buildCandidate({ version: '3.6.0', buildId: '300-1', salt: 'newer ' });
            seedCandidate(storage, newer);
            storage.options.beforeWrite = (_operation: string, key: string, target: any) => {
                if (key === contract.pointerKey('v3-release-order-a')) {
                    target.seed(
                        contract.pointerKey('v3-release-order-b'),
                        pointerBytesFor(newer),
                        contract.POINTER_HEADERS
                    );
                }
            };
            expect(await failureOf('promote-ga', '--version', '3.4.1')).toMatch(
                /v3-release-order-b serves 3.6.0, which is newer than 3.4.1/
            );
            expect(pointerOn('v3-release-order-b').equals(pointerBytesFor(newer))).toBe(true);
            expect(pointerOn('ga')).toBeUndefined();
            expect(records()[0].transitions.map((t: any) => [t.channel, t.status])).toEqual([
                ['v3-release-order-a', 'updated'],
            ]);
        });

        it('refuses another build of the same version unless --allow-rebuild', async () => {
            const rebuild = buildCandidate({ version: '3.5.0', buildId: '12345-2', salt: 'rebuild ' });
            seedCandidate(storage, rebuild);
            seedPointer(storage, STAGING, next);
            expect(await failureOf('stage', '--version', '3.5.0', '--build-id', '12345-2')).toMatch(
                /already serves 3.5.0 as build 12345-1; refusing to replace it with build 12345-2 without --allow-rebuild/
            );
            expect(storage.writes()).toEqual([]);
            expect(
                await run('stage', '--version', '3.5.0', '--build-id', '12345-2', '--allow-rebuild')
            ).toBe(0);
            expect(pointerOn(STAGING).equals(pointerBytesFor(rebuild))).toBe(true);
        });

        it('passes every required branch to the tip reader before each write', async () => {
            seedPointer(storage, STAGING, next);
            expect(
                await run(
                    'promote-ga',
                    '--version',
                    '3.5.0',
                    '--require-branch-tip',
                    'main',
                    '--require-branch-tip',
                    'v3-release-order-a'
                )
            ).toBe(0);
            expect(readBranchTips).toHaveBeenCalledTimes(GA_ORDER.length);
            for (const call of readBranchTips.mock.calls) {
                expect(call[0]).toEqual(['main', 'v3-release-order-a']);
            }
        });

        it('refuses to write once a shadowed branch has moved past the candidate', async () => {
            seedPointer(storage, STAGING, previous);
            readBranchTips.mockResolvedValue({ 'v3-staging': OTHER_SHA });
            expect(
                await failureOf(
                    'stage',
                    '--version',
                    '3.5.0',
                    '--build-id',
                    '12345-1',
                    '--require-branch-tip',
                    'v3-staging'
                )
            ).toMatch(
                new RegExp(`Branch v3-staging is at ${OTHER_SHA}, not the candidate's source ${SOURCE_SHA}`)
            );
            expect(storage.writes()).toEqual([]);
            readBranchTips.mockResolvedValue({});
            expect(
                await failureOf('stage', '--version', '3.5.0', '--build-id', '12345-1', '--require-branch-tip', 'v3-staging', '--dry-run')
            ).toMatch(/Branch v3-staging was not found/);
        });

        it('stops mid-promotion when a branch moves between channels', async () => {
            seedPointer(storage, STAGING, next);
            readBranchTips
                .mockResolvedValueOnce({ main: SOURCE_SHA })
                .mockResolvedValue({ main: OTHER_SHA });
            expect(
                await failureOf('promote-ga', '--version', '3.5.0', '--require-branch-tip', 'main')
            ).toMatch(/Branch main is at/);
            expect(storage.writes().map((call: any) => call.key)).toEqual([
                contract.pointerKey('v3-release-order-a'),
            ]);
            expect(records()[0].transitions.map((t: any) => t.channel)).toEqual(['v3-release-order-a']);
        });

        it('verifies the reader chain even when the pointer is already correct', async () => {
            seedPointer(storage, STAGING, next);
            storage.seed(
                `${next.prefix}core/dist/mparticle.js`,
                Buffer.from('tampered'),
                contract.candidateObjectHeaders('core/dist/mparticle.js')
            );
            expect(
                await failureOf('stage', '--version', '3.5.0', '--build-id', '12345-1', '--verify', 'required')
            ).toMatch(/mparticle.js does not match its metadata/);
            storage.seed(contract.pointerKey(STAGING), pointerBytesFor(next), {
                contentType: 'application/json',
                cacheControl: 'max-age=300',
            });
            storage.seed(
                `${next.prefix}core/dist/mparticle.js`,
                next.files.get('core/dist/mparticle.js'),
                contract.candidateObjectHeaders('core/dist/mparticle.js')
            );
            expect(await failureOf('stage', '--version', '3.5.0', '--build-id', '12345-1')).toMatch(
                /Pointer for v3-staging has unexpected headers/
            );
            expect(storage.writes()).toEqual([]);
        });

        it.each([
            [['stage', '--version', '3.5.0', '--build-id', '1-1', '--allow-downgrade'], /Only rollback and rollback-all accept --allow-downgrade/],
            [['promote-ga', '--version', '3.5.0', '--allow-downgrade'], /Only rollback and rollback-all accept --allow-downgrade/],
            [['show', '--channel', 'ga', '--allow-rebuild'], /show does not accept --allow-rebuild/],
            [['rollback-all', '--version', '3.5.0', '--allow-upgrade'], /Only rollback accepts --allow-upgrade/],
            [['rollback', '--channel', 'ga', '--version', '3.5.0', '--build-id', '1-1', '--require-branch-tip', 'main'], /rollback does not accept --require-branch-tip/],
            [['stage', '--version', '3.5.0', '--build-id', '1-1', '--require-branch-tip', '../main'], /must be a branch name/],
            [['stage', '--version', '3.5.0', '--build-id', '1-1', '--require-branch-tip', 'a..b'], /must be a branch name/],
            [['stage', '--version', '3.5.0', '--build-id', '1-1', '--require-branch-tip', '-x'], /must be a branch name/],
        ])('rejects %j', (args, pattern) => {
            expect(() => promoter.parseArguments(args)).toThrow(pattern);
        });

        it('reads branch tips from the remote with git ls-remote', async () => {
            const { execFileSync } = require('child_process');
            const remote = path.join(directory, 'remote');
            const clone = path.join(directory, 'clone');
            const git = (cwd: string, ...args: string[]) =>
                execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
            fs.mkdirSync(remote);
            git(remote, 'init', '-q', '-b', 'main');
            git(remote, '-c', 'user.name=t', '-c', 'user.email=t@example.com', '-c', 'commit.gpgsign=false', 'commit', '-q', '--allow-empty', '-m', 'x');
            git(remote, 'branch', 'v3-staging');
            git(directory, 'clone', '-q', remote, clone);
            const head = git(remote, 'rev-parse', 'HEAD');
            const tips = await promoter.gitBranchTipReader(clone)(['main', 'v3-staging', 'missing']);
            expect(tips).toEqual({ main: head, 'v3-staging': head });
        });
    });

    describe('rollback', () => {
        it('bypasses the staging safeguard but still verifies, and round-trips A to B to A', async () => {
            seedPointer(storage, STAGING, next);
            seedPointer(storage, ORDER_A, previous);
            await run('promote', '--from', STAGING, '--to', ORDER_A, '--version', '3.5.0');
            expect(pointerOn(ORDER_A).equals(pointerBytesFor(next))).toBe(true);
            expect(output.text).toContain(
                'v3-release-order-a rollback target: rollback --channel v3-release-order-a --version 3.4.1 --build-id 100-1 --allow-downgrade --pod local'
            );

            await run('rollback', '--channel', ORDER_A, '--version', '3.4.1', '--build-id', '100-1', '--allow-downgrade');
            expect(pointerOn(ORDER_A).equals(pointerBytesFor(previous))).toBe(true);
            expect(pointerOn(STAGING).equals(pointerBytesFor(next))).toBe(true);
            expect(output.text).toContain('Rollback bypasses the staging safeguard');
        });

        it('moves a channel down only with --allow-downgrade', async () => {
            seedPointer(storage, ORDER_A, next);
            expect(
                await failureOf('rollback', '--channel', ORDER_A, '--version', '3.4.1', '--build-id', '100-1')
            ).toMatch(/serves 3.5.0, which is newer than 3.4.1; refusing to move it backwards/);
            expect(storage.writes()).toEqual([]);
            expect(
                await run('rollback', '--channel', ORDER_A, '--version', '3.4.1', '--build-id', '100-1', '--allow-downgrade')
            ).toBe(0);
            expect(pointerOn(ORDER_A).equals(pointerBytesFor(previous))).toBe(true);
        });

        it.each([[[] as string[]], [['--allow-downgrade']], [['--allow-rebuild']]])(
            'moves a channel forward only with --allow-upgrade, not with %j',
            async flags => {
                seedPointer(storage, 'ga', previous);
                expect(
                    await failureOf('rollback', '--channel', 'ga', '--version', '3.5.0', '--build-id', '12345-1', ...flags)
                ).toMatch(
                    /ga serves 3.4.1, which is older than 3.5.0; rollback moves a channel forward only with --allow-upgrade/
                );
                expect(storage.writes()).toEqual([]);
                expect(
                    await run('rollback', '--channel', 'ga', '--version', '3.5.0', '--build-id', '12345-1', '--allow-upgrade')
                ).toBe(0);
                expect(pointerOn('ga').equals(pointerBytesFor(next))).toBe(true);
            }
        );

        it('accepts --allow-upgrade only on rollback', () => {
            expect(() => promoter.parseArguments(['promote-ga', '--version', '3.5.0', '--allow-upgrade'])).toThrow(
                /Only rollback accepts --allow-upgrade/
            );
        });

        it('switches to another build of the same version only with --allow-rebuild', async () => {
            const rebuild = buildCandidate({ version: '3.5.0', buildId: '12345-2', salt: 'rebuild ' });
            seedCandidate(storage, rebuild);
            seedPointer(storage, ORDER_A, rebuild);
            for (const flags of [[], ['--allow-downgrade']]) {
                expect(
                    await failureOf('rollback', '--channel', ORDER_A, '--version', '3.5.0', '--build-id', '12345-1', ...flags)
                ).toMatch(/already serves 3.5.0 as build 12345-2; refusing to replace it with build 12345-1 without --allow-rebuild\.$/);
            }
            expect(storage.writes()).toEqual([]);
            expect(
                await run('rollback', '--channel', ORDER_A, '--version', '3.5.0', '--build-id', '12345-1', '--allow-rebuild')
            ).toBe(0);
            expect(pointerOn(ORDER_A).equals(pointerBytesFor(next))).toBe(true);
        });

        it('prints the flag each printed rollback target needs, including one that undoes a rollback', async () => {
            const rebuild = buildCandidate({ version: '3.5.0', buildId: '12345-2', salt: 'rebuild ' });
            seedCandidate(storage, rebuild);
            seedPointer(storage, STAGING, rebuild);
            await run('stage', '--version', '3.5.0', '--build-id', '12345-1', '--allow-rebuild');
            expect(output.text).toContain(
                'v3-staging rollback target: rollback --channel v3-staging --version 3.5.0 --build-id 12345-2 --allow-rebuild --pod local'
            );

            seedPointer(storage, 'ga', next);
            await run('rollback', '--channel', 'ga', '--version', '3.4.1', '--build-id', '100-1', '--allow-downgrade');
            expect(output.text).toContain(
                'ga rollback target: rollback --channel ga --version 3.5.0 --build-id 12345-1 --allow-upgrade --pod local'
            );
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

    describe('release index', () => {
        const indexKey = (version: string) => `web-sdk/v3/releases/${version}.json`;
        const indexWrites = () =>
            storage.writes().filter((call: any) => call.key.startsWith('web-sdk/v3/releases/'));
        const entryFor = (candidate: TestCandidate) => ({
            schemaVersion: 1,
            version: candidate.version,
            buildId: candidate.buildId,
            metadataSha256: candidate.metadataSha256,
        });

        it('creates the entry create-only, after the pointer, when stage first moves a build', async () => {
            expect(await run('stage', '--version', '3.5.0', '--build-id', '12345-1')).toBe(0);
            expect(storage.writes().map((call: any) => [call.operation, call.key])).toEqual([
                ['putIfAbsent', contract.pointerKey(STAGING)],
                ['putIfAbsent', indexKey('3.5.0')],
            ]);
            expect(indexWrites()[0].headers).toEqual({ contentType: 'application/json', cacheControl: 'no-cache' });
            expect(storage.bytesOf(indexKey('3.5.0')).toString('utf8')).toBe(
                `${JSON.stringify(entryFor(next), null, 4)}\n`
            );
            expect(output.text).toContain('Release index 3.5.0: none -> build 12345-1 [created]');
        });

        it('rewrites a matching entry unchanged, only with If-Match on the ETag it planned with', async () => {
            seedPointer(storage, STAGING, next);
            seedIndex(next);
            const before = storage.bytesOf(indexKey('3.5.0'));
            const etag = (await storage.getObject(indexKey('3.5.0'), 1e5)).etag;
            await run('promote', '--from', STAGING, '--to', ORDER_A, '--version', '3.5.0');
            await run('promote-ga', '--version', '3.5.0');
            expect(indexWrites()).toEqual([
                expect.objectContaining({ operation: 'putIfMatch', etag }),
                expect.objectContaining({ operation: 'putIfMatch', etag }),
            ]);
            expect(storage.bytesOf(indexKey('3.5.0')).equals(before)).toBe(true);
            expect(output.text).toContain('Release index 3.5.0: build 12345-1 -> build 12345-1 [unchanged]');
        });

        it('accepts a 412 on rewriting a matching entry when the stored bytes still match', async () => {
            // With SSE-KMS a rewrite of identical bytes changes the ETag, so a
            // concurrent run rewriting the same entry first makes this If-Match
            // fail even though the entry is still correct.
            seedPointer(storage, STAGING, next);
            seedIndex(next);
            storage.injectFault({ operation: 'putIfMatch', key: indexKey('3.5.0'), code: 'PreconditionFailed' });
            expect(await run('promote', '--from', STAGING, '--to', ORDER_A, '--version', '3.5.0')).toBe(0);
            expect(records()[0].releaseIndex.status).toBe('unchanged');
            expect(indexEntryOn('3.5.0')).toEqual(entryFor(next));
        });

        it('backfills an entry for a release staged before the index existed', async () => {
            seedPointer(storage, STAGING, next);
            expect(await run('promote-ga', '--version', '3.5.0')).toBe(0);
            expect(indexWrites().map((call: any) => call.operation)).toEqual(['putIfAbsent']);
            expect(indexEntryOn('3.5.0')).toEqual(entryFor(next));
        });

        it('re-running a stage that already moved the pointer still writes a missing entry', async () => {
            seedPointer(storage, STAGING, next);
            expect(await run('stage', '--version', '3.5.0', '--build-id', '12345-1')).toBe(0);
            expect(pointerWrites()).toEqual([]);
            expect(indexEntryOn('3.5.0')).toEqual(entryFor(next));
        });

        it('refuses another build of an indexed version before moving any pointer, and replaces the entry with --allow-rebuild', async () => {
            const rebuild = buildCandidate({ version: '3.5.0', buildId: '12345-2', salt: 'rebuild ' });
            seedCandidate(storage, rebuild);
            seedPointer(storage, STAGING, previous);
            seedIndex(next);
            expect(await failureOf('stage', '--version', '3.5.0', '--build-id', '12345-2')).toMatch(
                /release index names build 12345-1 for 3.5.0, not build 12345-2; refusing .* without --allow-rebuild/
            );
            expect(storage.writes()).toEqual([]);
            expect(records()[0]).toEqual(expect.objectContaining({ status: 'failed', transitions: [] }));

            const etag = (await storage.getObject(indexKey('3.5.0'), 1e5)).etag;
            expect(await run('stage', '--version', '3.5.0', '--build-id', '12345-2', '--allow-rebuild')).toBe(0);
            expect(indexWrites()).toEqual([expect.objectContaining({ operation: 'putIfMatch', etag })]);
            expect(indexEntryOn('3.5.0')).toEqual(entryFor(rebuild));
            expect(output.text).toContain('Release index 3.5.0: build 12345-1 -> build 12345-2 [replaced]');
        });

        it('refuses an unreadable entry without --allow-rebuild and replaces it with If-Match with it', async () => {
            storage.seed(indexKey('3.5.0'), Buffer.from('{"schemaVersion":1}'), contract.POINTER_HEADERS);
            expect(await failureOf('stage', '--version', '3.5.0', '--build-id', '12345-1')).toMatch(
                /release index names unreadable \(Release index entry for 3.5.0 is missing version\)/
            );
            expect(storage.writes()).toEqual([]);
            expect(await run('stage', '--version', '3.5.0', '--build-id', '12345-1', '--allow-rebuild')).toBe(0);
            expect(indexWrites().map((call: any) => call.operation)).toEqual(['putIfMatch']);
            expect(indexEntryOn('3.5.0')).toEqual(entryFor(next));
        });

        it('plans but writes nothing on a dry run', async () => {
            expect(await run('stage', '--version', '3.5.0', '--build-id', '12345-1', '--dry-run')).toBe(0);
            expect(storage.writes()).toEqual([]);
            expect(output.text).toContain('Release index 3.5.0: none -> build 12345-1 [planned]');
        });

        it('fails the run after the pointer moved when the entry cannot be written, and a re-run converges', async () => {
            storage.injectFault({ operation: 'putIfAbsent', key: indexKey('3.5.0'), code: 'AccessDenied' });
            expect(await failureOf('stage', '--version', '3.5.0', '--build-id', '12345-1')).toMatch(
                /releases\/3.5.0.json failed \(AccessDenied\)/
            );
            expect(pointerOn(STAGING).equals(pointerBytesFor(next))).toBe(true);
            expect(records()[0]).toEqual(
                expect.objectContaining({
                    status: 'failed',
                    transitions: [expect.objectContaining({ channel: STAGING, status: 'updated' })],
                })
            );
            expect(output.text).toContain('Release index 3.5.0: none -> build 12345-1 [planned]');

            expect(await run('stage', '--version', '3.5.0', '--build-id', '12345-1')).toBe(0);
            expect(records()[1].transitions).toEqual([expect.objectContaining({ status: 'unchanged' })]);
            expect(indexEntryOn('3.5.0')).toEqual(entryFor(next));
        });

        it('refuses before moving any pointer when the entry cannot be read', async () => {
            seedPointer(storage, STAGING, previous);
            storage.options.deny = (operation: string, key: string) =>
                operation === 'get' && key === indexKey('3.5.0');
            expect(await failureOf('stage', '--version', '3.5.0', '--build-id', '12345-1')).toMatch(
                /Reading the release index entry for 3.5.0 was denied .*; no pointer was moved/
            );
            expect(storage.writes()).toEqual([]);
            expect(pointerOn(STAGING).equals(pointerBytesFor(previous))).toBe(true);
        });

        it('fails when a concurrent rebuild replaces a matching entry while this run moves pointers', async () => {
            seedPointer(storage, STAGING, next);
            seedIndex(next);
            storage.options.beforeWrite = (_operation: string, key: string, target: any) => {
                if (key === contract.pointerKey(ORDER_A)) {
                    target.seed(
                        indexKey('3.5.0'),
                        contract.serializeReleaseIndexEntry({ ...entryFor(next), buildId: '12345-9' }),
                        contract.POINTER_HEADERS
                    );
                }
            };
            expect(await failureOf('promote', '--from', STAGING, '--to', ORDER_A, '--version', '3.5.0')).toMatch(
                /release index entry for 3.5.0 changed during this run and does not name build 12345-1/
            );
            expect(pointerOn(ORDER_A).equals(pointerBytesFor(next))).toBe(true);
            expect(records()[0]).toEqual(
                expect.objectContaining({
                    status: 'failed',
                    releaseIndex: { version: '3.5.0', buildId: '12345-1', before: 'build 12345-1', status: 'planned' },
                })
            );
        });

        it('records the index outcome in the progress record, and counts a new entry as a change', async () => {
            seedPointer(storage, STAGING, next);
            expect(await run('stage', '--version', '3.5.0', '--build-id', '12345-1')).toBe(0);
            expect(records()[0].releaseIndex).toEqual({
                version: '3.5.0',
                buildId: '12345-1',
                before: 'none',
                status: 'created',
            });
            const summary = progress.summarizeProgress(records(), ['local']);
            expect(summary).toContain('Changed pods: local');
            expect(summary).toContain('  - release index 3.5.0: none -> build 12345-1 [created]');
        });

        it('refuses when another writer creates a different entry first', async () => {
            const concurrent = contract.serializeReleaseIndexEntry({ ...entryFor(next), buildId: '12345-9' });
            storage.options.beforeWrite = (_operation: string, key: string, target: any) => {
                if (key === indexKey('3.5.0')) {
                    target.seed(key, concurrent, contract.POINTER_HEADERS);
                }
            };
            expect(await failureOf('stage', '--version', '3.5.0', '--build-id', '12345-1')).toMatch(
                /release index entry for 3.5.0 changed during this run and does not name build 12345-1/
            );
            expect(storage.bytesOf(indexKey('3.5.0')).equals(concurrent)).toBe(true);
        });

        it('records a lost create-only response that landed', async () => {
            storage.injectFault({ operation: 'putIfAbsent', key: indexKey('3.5.0'), code: 'Transient', afterApply: true });
            expect(await run('stage', '--version', '3.5.0', '--build-id', '12345-1')).toBe(0);
            expect(indexEntryOn('3.5.0')).toEqual(entryFor(next));
        });

        it('fails when the entry does not read back as written', async () => {
            storage.options.corruptRead = (key: string, bytes: Buffer) =>
                key === indexKey('3.5.0') ? Buffer.concat([bytes, Buffer.from(' ')]) : bytes;
            expect(await failureOf('stage', '--version', '3.5.0', '--build-id', '12345-1')).toMatch(
                /Release index readback for 3.5.0 does not match/
            );
        });

        it('rolls a channel back by version alone, verifying the indexed candidate', async () => {
            seedPointer(storage, ORDER_A, next);
            seedIndex(previous);
            expect(
                await run('rollback', '--channel', ORDER_A, '--version', '3.4.1', '--allow-downgrade')
            ).toBe(0);
            expect(pointerOn(ORDER_A).equals(pointerBytesFor(previous))).toBe(true);
            expect(indexWrites()).toEqual([]);
            expect(output.text).toContain(
                `Release index: 3.4.1 is build 100-1 metadata ${previous.metadataSha256}`
            );
        });

        it('does not read the index for a rollback with an explicit build', async () => {
            seedPointer(storage, ORDER_A, next);
            await run('rollback', '--channel', ORDER_A, '--version', '3.4.1', '--build-id', '100-1', '--allow-downgrade');
            expect(storage.calls.some((call: any) => call.key.startsWith('web-sdk/v3/releases/'))).toBe(false);
        });

        it.each([
            ['has no entry', () => undefined, /release index has no entry for 3.4.1; pass --build-id/],
            [
                'has an unreadable entry',
                () => storage.seed(indexKey('3.4.1'), Buffer.from('not json'), contract.POINTER_HEADERS),
                /release index entry for 3.4.1 is unreadable \(Release index entry for 3.4.1 is not valid JSON\); pass --build-id/,
            ],
            [
                'has an entry for another version',
                () =>
                    storage.seed(
                        indexKey('3.4.1'),
                        contract.serializeCanonical(entryFor(next)),
                        contract.POINTER_HEADERS
                    ),
                /names a different version/,
            ],
            [
                'cannot be read',
                () => (storage.options.deny = (operation: string, key: string) =>
                    operation === 'get' && key === indexKey('3.4.1')),
                /Reading the release index entry for 3.4.1 was denied/,
            ],
            [
                'names a metadata hash the candidate does not have',
                () =>
                    storage.seed(
                        indexKey('3.4.1'),
                        contract.serializeReleaseIndexEntry({ ...entryFor(previous), metadataSha256: 'a'.repeat(64) }),
                        contract.POINTER_HEADERS
                    ),
                /metadata.json does not match the release index entry for 3.4.1/,
            ],
        ])('refuses a version-only rollback when the index %s', async (_label, arrange, pattern) => {
            seedPointer(storage, ORDER_A, next);
            arrange();
            expect(
                await failureOf('rollback', '--channel', ORDER_A, '--version', '3.4.1', '--allow-downgrade')
            ).toMatch(pattern);
            expect(storage.writes()).toEqual([]);
        });

        it('refuses a version-only rollback whose --expected-metadata-sha256 disagrees with the index', async () => {
            seedPointer(storage, ORDER_A, next);
            seedIndex(previous);
            expect(
                await failureOf(
                    'rollback',
                    '--channel',
                    ORDER_A,
                    '--version',
                    '3.4.1',
                    '--allow-downgrade',
                    '--expected-metadata-sha256',
                    next.metadataSha256
                )
            ).toMatch(/release index entry for 3.4.1 does not match --expected-metadata-sha256/);
            expect(storage.writes()).toEqual([]);
        });
    });

    describe('rollback-all', () => {
        const REVERSE = ['v3-staging', 'ga', 'v3-release-order-c', 'v3-release-order-b', 'v3-release-order-a'];

        function seedAll(candidate: TestCandidate) {
            for (const channel of REVERSE) {
                seedPointer(storage, channel, candidate);
            }
        }

        it('rolls every channel back to one candidate, v3-staging first, then most workspaces first', async () => {
            seedAll(next);
            expect(
                await run('rollback-all', '--version', '3.4.1', '--build-id', '100-1', '--allow-downgrade')
            ).toBe(0);
            for (const channel of REVERSE) {
                expect(pointerOn(channel).equals(pointerBytesFor(previous))).toBe(true);
            }
            expect(pointerWrites().map((call: any) => call.key)).toEqual(REVERSE.map(channel => contract.pointerKey(channel)));
            expect(pointerWrites().every((call: any) => call.operation === 'putIfMatch')).toBe(true);
            const [record] = records();
            expect(record).toEqual(expect.objectContaining({ operation: 'rollback-all', status: 'succeeded' }));
            expect(record.transitions.map((t: any) => [t.channel, t.status])).toEqual(
                REVERSE.map(channel => [channel, 'updated'])
            );
            expect(output.text).toContain('Rollback bypasses the staging safeguard');
            expect(storage.writes().filter((call: any) => contract.isReleaseIndexKey(call.key))).toEqual([]);
            const metadataReads = storage.calls.filter((call: any) => call.key === `${previous.prefix}metadata.json`);
            // The candidate is resolved and verified once (two metadata reads),
            // then each channel's reader chain is checked after its write.
            expect(metadataReads).toHaveLength(2 + REVERSE.length);
        });

        it('leaves a channel already on an older version alone and never moves one forward', async () => {
            const older = buildCandidate({ version: '3.3.0', buildId: '50-1', salt: 'older ' });
            seedCandidate(storage, older);
            seedAll(next);
            seedPointer(storage, 'ga', older);
            storage.objects.delete(contract.pointerKey('v3-release-order-c'));
            expect(
                await run('rollback-all', '--version', '3.4.1', '--build-id', '100-1', '--allow-downgrade')
            ).toBe(0);
            expect(pointerOn('ga').equals(pointerBytesFor(older))).toBe(true);
            expect(pointerOn('v3-release-order-c').equals(pointerBytesFor(previous))).toBe(true);
            expect(records()[0].transitions.map((t: any) => [t.channel, t.status])).toEqual([
                ['v3-staging', 'updated'],
                ['ga', 'skipped'],
                ['v3-release-order-c', 'updated'],
                ['v3-release-order-b', 'updated'],
                ['v3-release-order-a', 'updated'],
            ]);
            expect(records()[0].transitions[1].after).toEqual(
                expect.objectContaining({ version: '3.3.0', buildId: '50-1' })
            );
            expect(progress.summarizeProgress(records(), ['local'])).toContain(
                'ga: 3.3.0 build 50-1 (metadata '
            );
            expect(output.text).not.toContain('ga rollback target');
        });

        it('leaves channels already on the target unchanged', async () => {
            seedAll(previous);
            expect(
                await run('rollback-all', '--version', '3.4.1', '--build-id', '100-1', '--allow-downgrade')
            ).toBe(0);
            expect(storage.writes()).toEqual([]);
            expect(records()[0].transitions.every((t: any) => t.status === 'unchanged')).toBe(true);
        });

        it('refuses to move any channel down without --allow-downgrade', async () => {
            seedAll(next);
            expect(await failureOf('rollback-all', '--version', '3.4.1', '--build-id', '100-1')).toMatch(
                /v3-staging serves 3.5.0, which is newer than 3.4.1; refusing to move it backwards/
            );
            expect(storage.writes()).toEqual([]);
        });

        it('needs --allow-rebuild for a channel on another build of the target version', async () => {
            const rebuild = buildCandidate({ version: '3.4.1', buildId: '101-1', salt: 'rebuild ' });
            seedCandidate(storage, rebuild);
            seedAll(next);
            seedPointer(storage, 'ga', rebuild);
            expect(
                await failureOf('rollback-all', '--version', '3.4.1', '--build-id', '100-1', '--allow-downgrade')
            ).toMatch(/ga already serves 3.4.1 as build 101-1; refusing to replace it with build 100-1 without --allow-rebuild/);
            expect(pointerOn('ga').equals(pointerBytesFor(rebuild))).toBe(true);
            expect(
                await run(
                    'rollback-all',
                    '--version',
                    '3.4.1',
                    '--build-id',
                    '100-1',
                    '--allow-downgrade',
                    '--allow-rebuild'
                )
            ).toBe(0);
            for (const channel of REVERSE) {
                expect(pointerOn(channel).equals(pointerBytesFor(previous))).toBe(true);
            }
        });

        it('rolls back by version alone through the release index', async () => {
            seedAll(next);
            seedIndex(previous);
            expect(await run('rollback-all', '--version', '3.4.1', '--allow-downgrade')).toBe(0);
            for (const channel of REVERSE) {
                expect(pointerOn(channel).equals(pointerBytesFor(previous))).toBe(true);
            }
            expect(output.text).toContain('Release index: 3.4.1 is build 100-1');
        });

        it('plans every channel and writes nothing on a dry run', async () => {
            seedAll(next);
            expect(
                await run('rollback-all', '--version', '3.4.1', '--build-id', '100-1', '--allow-downgrade', '--dry-run')
            ).toBe(0);
            expect(storage.writes()).toEqual([]);
            expect(records()[0].status).toBe('dry-run');
            expect(records()[0].transitions.map((t: any) => t.status)).toEqual(REVERSE.map(() => 'planned'));
        });

        it('refuses a candidate that fails verification before moving anything', async () => {
            seedAll(next);
            storage.objects.delete(`${previous.prefix}core/dist/mparticle.esm.js`);
            expect(
                await failureOf('rollback-all', '--version', '3.4.1', '--build-id', '100-1', '--allow-downgrade')
            ).toMatch(/mparticle.esm.js failed \(NotFound\)/);
            expect(storage.writes()).toEqual([]);
        });

        it('stops at the first failed channel, reports what moved, and a re-run converges', async () => {
            seedAll(next);
            storage.injectFault({ operation: 'putIfMatch', key: contract.pointerKey('v3-release-order-b'), code: 'AccessDenied' });
            expect(
                await failureOf('rollback-all', '--version', '3.4.1', '--build-id', '100-1', '--allow-downgrade')
            ).toMatch(/v3-release-order-b.*\(AccessDenied\)/);
            expect(records()[0].transitions.map((t: any) => t.channel)).toEqual(['v3-staging', 'ga', 'v3-release-order-c']);
            expect(pointerOn('v3-release-order-a').equals(pointerBytesFor(next))).toBe(true);

            expect(
                await run('rollback-all', '--version', '3.4.1', '--build-id', '100-1', '--allow-downgrade')
            ).toBe(0);
            expect(records()[1].transitions.map((t: any) => [t.channel, t.status])).toEqual([
                ['v3-staging', 'unchanged'],
                ['ga', 'unchanged'],
                ['v3-release-order-c', 'unchanged'],
                ['v3-release-order-b', 'updated'],
                ['v3-release-order-a', 'updated'],
            ]);
        });

        it('fails when a promotion writes to a skipped channel during the rollback, and a re-run fixes it', async () => {
            const older = buildCandidate({ version: '3.3.0', buildId: '50-1', salt: 'older ' });
            seedCandidate(storage, older);
            seedAll(next);
            seedPointer(storage, 'ga', older);
            let raced = false;
            storage.options.beforeWrite = (_operation: string, key: string, target: any) => {
                if (!raced && key === contract.pointerKey('v3-release-order-c')) {
                    raced = true;
                    target.seed(contract.pointerKey('ga'), pointerBytesFor(next), contract.POINTER_HEADERS);
                }
            };
            expect(
                await failureOf('rollback-all', '--version', '3.4.1', '--build-id', '100-1', '--allow-downgrade')
            ).toMatch(
                /After the rollback, ga \(3.5.0 build 12345-1 metadata [0-9a-f]{64}\) serves a newer release or another build than 3.4.1 build 100-1 metadata [0-9a-f]{64}: a promotion wrote during the rollback. Stop the release, then run rollback-all again./
            );
            expect(records()[0].status).toBe('failed');
            expect(records()[0].transitions).toHaveLength(5);

            expect(
                await run('rollback-all', '--version', '3.4.1', '--build-id', '100-1', '--allow-downgrade')
            ).toBe(0);
            expect(pointerOn('ga').equals(pointerBytesFor(previous))).toBe(true);
        });

        it('fails when a promotion writes another build of the target version during the rollback', async () => {
            const older = buildCandidate({ version: '3.3.0', buildId: '50-1', salt: 'older ' });
            const rebuild = buildCandidate({ version: '3.4.1', buildId: '100-2', salt: 'rebuild ' });
            seedCandidate(storage, older);
            seedCandidate(storage, rebuild);
            seedAll(next);
            seedPointer(storage, 'ga', older);
            let raced = false;
            storage.options.beforeWrite = (_operation: string, key: string, target: any) => {
                if (!raced && key === contract.pointerKey('v3-release-order-c')) {
                    raced = true;
                    target.seed(contract.pointerKey('ga'), pointerBytesFor(rebuild), contract.POINTER_HEADERS);
                }
            };
            expect(
                await failureOf('rollback-all', '--version', '3.4.1', '--build-id', '100-1', '--allow-downgrade')
            ).toMatch(/After the rollback, ga \(3.4.1 build 100-2 metadata [0-9a-f]{64}\) serves a newer release or another build/);
        });

        it('stops a promotion that is running when the rollback moves v3-staging', async () => {
            seedPointer(storage, STAGING, next);
            storage.options.beforeWrite = (_operation: string, key: string, target: any) => {
                if (key === contract.pointerKey('v3-release-order-a')) {
                    target.seed(contract.pointerKey(STAGING), pointerBytesFor(previous), contract.POINTER_HEADERS);
                }
            };
            expect(await failureOf('promote-ga', '--version', '3.5.0')).toMatch(
                /v3-staging no longer serves 3.5.0 build 12345-1 \(it serves 3.4.1 build 100-1 metadata [0-9a-f]{64}\); refusing to move v3-release-order-b. A rollback may be in progress./
            );
            expect(pointerOn('v3-release-order-a').equals(pointerBytesFor(next))).toBe(true);
            expect(pointerOn('v3-release-order-b')).toBeUndefined();
            expect(pointerOn('ga')).toBeUndefined();
            expect(records()[0].transitions.map((t: any) => t.channel)).toEqual(['v3-release-order-a']);
        });

        it('stops a promotion when v3-staging is gone or unreadable at write time', async () => {
            seedPointer(storage, STAGING, next);
            storage.options.beforeWrite = (_operation: string, key: string, target: any) => {
                if (key === contract.pointerKey('v3-release-order-a')) {
                    target.seed(contract.pointerKey(STAGING), Buffer.from('not json'), contract.POINTER_HEADERS);
                }
            };
            expect(await failureOf('promote-ga', '--version', '3.5.0')).toMatch(
                /v3-staging no longer serves 3.5.0 build 12345-1 \(it serves an unreadable pointer: Active release pointer is not valid JSON\); refusing to move v3-release-order-b/
            );
        });

        it('re-reads v3-staging before each promotion write, not only at the start', async () => {
            seedPointer(storage, STAGING, next);
            expect(await run('promote-ga', '--version', '3.5.0')).toBe(0);
            const stagingReads = storage.calls.filter(
                (call: any) => call.operation === 'get' && call.key === contract.pointerKey(STAGING)
            );
            // Once for the staging safeguard, then once before each of the four writes.
            expect(stagingReads).toHaveLength(1 + 4);
        });

        it.each([
            [['rollback-all', '--version', '3.4.1', '--channel', 'ga'], /rollback-all does not accept --channel/],
            [['rollback-all', '--version', '3.4.1', '--allow-upgrade'], /Only rollback accepts --allow-upgrade/],
            [['rollback-all', '--version', '3.4.1', '--require-branch-tip', 'main'], /rollback-all does not accept --require-branch-tip/],
            [['rollback-all', '--version', '3.4.1', '--wait-for-staging', '5'], /rollback-all does not accept --wait-for-staging/],
        ])('rejects %j', (args, pattern) => {
            expect(() => promoter.parseArguments(args)).toThrow(pattern);
        });

        it('requires a version', async () => {
            expect(await failureOf('rollback-all', '--allow-downgrade')).toMatch(/--version is required/);
        });
    });

    describe('dry run and show', () => {
        it.each([
            [['stage', '--version', '3.6.0', '--build-id', '200-1']],
            [['promote', '--from', STAGING, '--to', ORDER_A, '--version', '3.5.0']],
            [['promote-ga', '--version', '3.5.0']],
            [['rollback', '--channel', 'ga', '--version', '3.4.1', '--build-id', '100-1']],
        ])('%j --dry-run verifies but writes nothing', async args => {
            seedCandidate(storage, buildCandidate({ version: '3.6.0', buildId: '200-1', salt: 'newer ' }));
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

    describe('status', () => {
        const ORDER = ['v3-staging', 'v3-release-order-a', 'v3-release-order-b', 'v3-release-order-c', 'ga'];

        it('reads every channel in promotion order, verifying each candidate once, and writes nothing', async () => {
            seedPointer(storage, STAGING, next);
            seedPointer(storage, ORDER_A, next);
            seedPointer(storage, 'ga', previous);
            expect(await run('status')).toBe(0);
            expect(storage.writes()).toEqual([]);
            const transitions = records()[0].transitions;
            expect(transitions.map((t: any) => [t.channel, t.status])).toEqual(ORDER.map(channel => [channel, 'read']));
            expect(transitions.map((t: any) => t.after && t.after.buildId)).toEqual([
                '12345-1',
                '12345-1',
                null,
                null,
                '100-1',
            ]);
            expect(records()[0]).toEqual(expect.objectContaining({ operation: 'status', status: 'succeeded' }));
            expect(output.text).toContain('v3-release-order-b before: none');
            expect(output.text).not.toContain('rollback target');
            const metadataReads = (candidate: TestCandidate) =>
                storage.calls.filter((call: any) => call.key === `${candidate.prefix}metadata.json`).length;
            expect(metadataReads(next)).toBe(1);
            expect(metadataReads(previous)).toBe(1);
        });

        it('reports every problem after reading all five channels, then fails', async () => {
            seedPointer(storage, STAGING, next);
            storage.seed(contract.pointerKey(ORDER_A), Buffer.from('not json'), contract.POINTER_HEADERS);
            seedPointer(storage, 'v3-release-order-c', next);
            seedPointer(storage, 'ga', previous);
            storage.objects.delete(`${previous.prefix}core/dist/mparticle.js`);
            storage.options.deny = (operation: string, key: string) =>
                operation === 'get' && key === contract.pointerKey('v3-release-order-b');
            const message = await failureOf('status');
            expect(message).toMatch(/^Status found 3 problems: /);
            expect(message).toContain('v3-release-order-a: unreadable pointer (Active release pointer is not valid JSON)');
            expect(message).toContain('v3-release-order-b: Reading the v3-release-order-b pointer was denied');
            expect(message).toContain('ga: candidate failed verification: get web-sdk/v3/candidates/3.4.1/100-1/core/dist/mparticle.js failed (NotFound)');
            const [record] = records();
            expect(record.status).toBe('failed');
            expect(record.transitions.map((t: any) => t.channel)).toEqual(ORDER);
            expect(record.transitions[2].before).toBe('read failed');
            expect(storage.writes()).toEqual([]);
        });

        it('with --version, fails unless every channel serves that release', async () => {
            for (const channel of ORDER) {
                seedPointer(storage, channel, next);
            }
            expect(await run('status', '--version', '3.5.0')).toBe(0);
            expect(await run('status', '--version', '3.5.0', '--build-id', '12345-1')).toBe(0);

            seedPointer(storage, 'ga', previous);
            storage.objects.delete(contract.pointerKey('v3-release-order-c'));
            const message = await failureOf('status', '--version', '3.5.0', '--build-id', '12345-1');
            expect(message).toMatch(/^Status found 2 problems: /);
            expect(message).toContain('v3-release-order-c: serves none, expected 3.5.0 build 12345-1');
            expect(message).toContain(
                `ga: serves 3.4.1 build 100-1 metadata ${previous.metadataSha256}, expected 3.5.0 build 12345-1`
            );
            expect(storage.writes()).toEqual([]);
        });

        it('with --build-id, fails on another build of the expected version', async () => {
            const rebuild = buildCandidate({ version: '3.5.0', buildId: '12345-2', salt: 'rebuild ' });
            seedCandidate(storage, rebuild);
            for (const channel of ORDER) {
                seedPointer(storage, channel, next);
            }
            seedPointer(storage, ORDER_A, rebuild);
            expect(await run('status', '--version', '3.5.0')).toBe(0);
            expect(await failureOf('status', '--version', '3.5.0', '--build-id', '12345-1')).toMatch(
                /^Status found 1 problem: v3-release-order-a: serves 3.5.0 build 12345-2 metadata [0-9a-f]{64}, expected 3.5.0 build 12345-1$/
            );
        });

        it('reports a candidate failure on every channel that selects it', async () => {
            seedPointer(storage, STAGING, next);
            seedPointer(storage, 'ga', next);
            storage.objects.delete(`${next.prefix}cdn-bundles.tgz`);
            const message = await failureOf('status');
            expect(message).toMatch(/^Status found 2 problems: v3-staging: candidate failed .*; ga: candidate failed/);
        });

        it.each([
            [['status', '--channel', 'ga'], /status does not accept --channel/],
            [['status', '--build-id', '1-1'], /status --build-id needs --version/],
            [['status', '--dry-run'], /status is read-only and does not accept --dry-run/],
            [['status', '--allow-rebuild'], /status does not accept --allow-rebuild/],
            [['status', '--allow-downgrade'], /Only rollback and rollback-all accept --allow-downgrade/],
            [['status', '--require-branch-tip', 'main'], /status does not accept --require-branch-tip/],
            [['status', '--wait-for-staging', '5'], /status does not accept --wait-for-staging/],
        ])('rejects %j', (args, pattern) => {
            expect(() => promoter.parseArguments(args)).toThrow(pattern);
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
                .filter(call => call[1] === 'put-object' && !argValue(call, '--key').startsWith('web-sdk/v3/releases/'));
            expect(pointerPuts.every(call => argValue(call, '--key').startsWith('web-sdk/v3/channels/'))).toBe(true);
            expect(pointerPuts.every(call => argValue(call, '--if-none-match') === '*')).toBe(true);
            expect(pointerPuts.every(call => argValue(call, '--cache-control') === 'no-cache')).toBe(true);
            expect(pointerPuts.every(call => argValue(call, '--content-type') === 'application/json')).toBe(true);

            await cli(qa.env, 'qa', 'rollback', '--channel', 'ga', '--version', '3.5.0', '--build-id', '12345-1', '--verify', 'required');
            seedFake(qa.fake, previous);
            await cli(qa.env, 'qa', 'rollback', '--channel', 'ga', '--version', '3.4.1', '--build-id', '100-1', '--verify', 'required', '--allow-downgrade');
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

        it('records a pointer write that landed before the CLI retry got a 412', async () => {
            const qa = podEnvironment('qa', {
                failures: [
                    {
                        operation: 'put-object',
                        keyPrefix: 'web-sdk/v3/channels/',
                        code: 'PreconditionFailed',
                        afterApply: true,
                    },
                ],
            });
            seedFake(qa.fake, previous);
            seedFake(qa.fake, next);
            qa.fake.seed(contract.pointerKey(STAGING), pointerBytesFor(previous), contract.POINTER_HEADERS);
            expect(
                await promoter.main(
                    ['stage', '--version', '3.5.0', '--build-id', '12345-1', '--verify', 'required', '--pod', 'qa', '--progress-file', progressFile],
                    { env: qa.env, log: output.write }
                )
            ).toBe(0);
            expect(qa.fake.read(contract.pointerKey(STAGING)).equals(pointerBytesFor(next))).toBe(true);
            expect(records()[0]).toEqual(
                expect.objectContaining({
                    status: 'succeeded',
                    transitions: [expect.objectContaining({ status: 'updated' })],
                })
            );
            expect(output.text).not.toContain('nothing was overwritten');
        });
    });
});
