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
    TestCandidate,
    buildCandidate,
    makeTempDirectory,
    writeCandidateDirectory,
} from './v3-release/helpers';

const contract = require('../../scripts/v3-release/release-contract.ts');
const {
    InMemoryReleaseStorage,
} = require('../../scripts/v3-release/in-memory-release-storage.ts');
const {
    readProgressRecords,
} = require('../../scripts/v3-release/release-progress.ts');
const uploader = require('../../scripts/v3-release/upload-v3-candidate.ts');
const { writeMetadata } = require('../../scripts/package-v3-candidate');

const FAST = { retryDelayMs: 0 };

// The fake AWS CLI starts a node process per call.
jest.setTimeout(60000);

describe('V3 candidate uploader', () => {
    let directory: string;
    let candidate: TestCandidate;
    let candidateDirectory: string;

    beforeEach(() => {
        directory = makeTempDirectory('v3-release-upload-');
        candidate = buildCandidate();
        candidateDirectory = writeCandidateDirectory(
            path.join(directory, 'candidate'),
            candidate
        );
    });

    afterEach(() => {
        fs.rmSync(directory, { recursive: true, force: true });
    });

    function local() {
        return uploader.validateLocalCandidate(candidateDirectory);
    }

    function rewriteMetadata(mutate: (metadata: any) => void): void {
        const metadata = JSON.parse(JSON.stringify(candidate.metadata));
        mutate(metadata);
        fs.writeFileSync(
            path.join(candidateDirectory, 'metadata.json'),
            contract.serializeCanonical(metadata)
        );
    }

    async function failureOf(promise: Promise<unknown>): Promise<string> {
        try {
            await promise;
        } catch (error) {
            return (error as Error).message;
        }
        throw new Error('Expected the upload to fail');
    }

    describe('local validation', () => {
        it('accepts metadata written by the candidate packager', () => {
            const root = path.join(directory, 'packaged');
            const packagePath = 'npm/mparticle-web-sdk-3.5.0.tgz';
            for (const filePath of [
                ...contract.REQUIRED_CORE_FILES,
                'kits/rokt/dist/Rokt-Kit.iife.js',
                'kits/rokt/dist/Rokt-Kit.iife.js.map',
                'cdn-bundles.tgz',
                packagePath,
            ]) {
                fs.mkdirSync(path.dirname(path.join(root, filePath)), {
                    recursive: true,
                });
                fs.writeFileSync(path.join(root, filePath), `packaged ${filePath}`);
            }
            writeMetadata(
                root,
                { version: '3.5.0', sourceSha: 'a'.repeat(40), buildId: '777-2' },
                [
                    {
                        name: '@mparticle/web-sdk',
                        path: packagePath,
                        npmIntegrity: contract.npmIntegrityFor(
                            fs.readFileSync(path.join(root, packagePath))
                        ),
                    },
                ]
            );
            const validated = uploader.validateLocalCandidate(root, {
                version: '3.5.0',
                buildId: '777-2',
            });
            expect(validated.metadata.files).toHaveLength(8);
        });

        it('accepts the candidate and binds the expected identity', () => {
            const validated = uploader.validateLocalCandidate(candidateDirectory, {
                version: '3.5.0',
                buildId: '12345-1',
                metadataSha256: candidate.metadataSha256,
            });
            expect(validated.metadataSha256).toBe(candidate.metadataSha256);
        });

        it.each([
            ['version', { version: '3.5.1' }],
            ['build ID', { buildId: '12345-2' }],
            ['SHA-256', { metadataSha256: 'f'.repeat(64) }],
            ['source SHA', { sourceSha: 'f'.repeat(40) }],
        ])('rejects an unexpected %s', (label, expected) => {
            expect(() =>
                uploader.validateLocalCandidate(candidateDirectory, expected)
            ).toThrow(label);
        });

        it.each([
            [
                'a missing metadata.json',
                () => fs.rmSync(path.join(candidateDirectory, 'metadata.json')),
                /metadata.json is missing/,
            ],
            [
                'a missing listed file',
                () => fs.rmSync(path.join(candidateDirectory, 'cdn-bundles.tgz')),
                /Missing files: cdn-bundles.tgz/,
            ],
            [
                'an unlisted file',
                () => fs.writeFileSync(path.join(candidateDirectory, 'core/extra.js'), 'x'),
                /Unlisted files: core\/extra.js/,
            ],
            [
                'a nested metadata.json',
                () => fs.writeFileSync(path.join(candidateDirectory, 'core/metadata.json'), '{}'),
                /Unlisted files: core\/metadata.json/,
            ],
            [
                'a symlinked file',
                () => {
                    const target = path.join(candidateDirectory, 'cdn-bundles.tgz');
                    const moved = path.join(directory, 'outside.tgz');
                    fs.renameSync(target, moved);
                    fs.symlinkSync(moved, target);
                },
                /not a regular file/,
            ],
            [
                'a changed file of the same size',
                () =>
                    fs.writeFileSync(
                        path.join(candidateDirectory, 'core/dist/mparticle.js'),
                        Buffer.from('fixture core/dist/mparticle.XX')
                    ),
                /SHA-256 does not match metadata: core\/dist\/mparticle.js/,
            ],
            [
                'a truncated file',
                () =>
                    fs.writeFileSync(path.join(candidateDirectory, 'core/dist/mparticle.js'), 'x'),
                /size does not match metadata/,
            ],
            [
                'a wrong npm integrity',
                () =>
                    rewriteMetadata(metadata => {
                        metadata.packages[0].npmIntegrity = contract.npmIntegrityFor(
                            Buffer.from('other')
                        );
                    }),
                /npm tarball integrity does not match/,
            ],
            [
                'a file without a fixed content type',
                () => {
                    fs.writeFileSync(path.join(candidateDirectory, 'README.md'), 'readme');
                    rewriteMetadata(metadata => {
                        metadata.files.unshift({
                            path: 'README.md',
                            size: 6,
                            sha256: contract.sha256Hex(Buffer.from('readme')),
                        });
                    });
                },
                /outside the candidate layout/,
            ],
            [
                'a symlinked directory',
                () => {
                    const target = path.join(candidateDirectory, 'kits/braze');
                    const moved = path.join(directory, 'outside-braze');
                    fs.renameSync(target, moved);
                    fs.symlinkSync(moved, target);
                },
                /not a regular file or directory: kits\/braze/,
            ],
            [
                'non-canonical metadata',
                () =>
                    fs.writeFileSync(
                        path.join(candidateDirectory, 'metadata.json'),
                        JSON.stringify(candidate.metadata)
                    ),
                /not canonical/,
            ],
        ])('rejects %s', (_label, mutate, pattern) => {
            mutate();
            expect(() => local()).toThrow(pattern);
        });

        it('rejects a symlinked candidate directory', () => {
            const link = path.join(directory, 'link');
            fs.symlinkSync(candidateDirectory, link);
            expect(() => uploader.validateLocalCandidate(link)).toThrow(
                /real directory/
            );
        });
    });

    describe('upload plan', () => {
        it('uploads the inventory in order with metadata.json last and fixed headers', () => {
            const plan = uploader.buildUploadPlan(local());
            expect(plan.map((entry: any) => entry.path)).toEqual([
                ...candidate.metadata.files.map((file: any) => file.path),
                'metadata.json',
            ]);
            for (const entry of plan) {
                expect(entry.key).toBe(`${candidate.prefix}${entry.path}`);
                expect(entry.cacheControl).toBe('public, max-age=31536000, immutable');
                expect(Object.keys(entry)).not.toContain('contentEncoding');
            }
            const byPath = (filePath: string) =>
                plan.find((entry: any) => entry.path === filePath);
            expect(byPath('core/dist/mparticle.js').contentType).toBe(
                'application/javascript; charset=utf-8'
            );
            expect(byPath('kits/rokt/dist/Rokt-Kit.iife.js.map').contentType).toBe(
                'application/json'
            );
            expect(byPath('metadata.json').contentType).toBe('application/json');
            expect(byPath('cdn-bundles.tgz').contentType).toBe('application/gzip');
            expect(byPath('metadata.json').sha256).toBe(candidate.metadataSha256);
        });
    });

    describe('upload against the in-memory store', () => {
        const total = () => candidate.files.size + 1;

        it('creates every object, reads it back and writes metadata.json last', async () => {
            const storage = new InMemoryReleaseStorage();
            const summary = await uploader.uploadCandidate(local(), storage, FAST);
            expect(summary).toEqual({
                version: '3.5.0',
                buildId: '12345-1',
                candidatePrefix: 'web-sdk/v3/candidates/3.5.0/12345-1/',
                metadataSha256: candidate.metadataSha256,
                objects: total(),
                created: total(),
                alreadyPresent: 0,
                bytes: Array.from(candidate.files.values()).reduce(
                    (sum, bytes) => sum + bytes.length,
                    candidate.metadataBytes.length
                ),
            });
            const writes = storage.writes();
            expect(writes).toHaveLength(total());
            expect(writes.every((call: any) => call.operation === 'putIfAbsent')).toBe(true);
            expect(writes[writes.length - 1].key).toBe(`${candidate.prefix}metadata.json`);
            expect(
                storage.calls.every((call: any) => call.key.startsWith(candidate.prefix))
            ).toBe(true);
            expect(
                storage.calls.some((call: any) => contract.isPointerKey(call.key))
            ).toBe(false);
            expect(storage.bytesOf(`${candidate.prefix}metadata.json`).equals(
                candidate.metadataBytes
            )).toBe(true);
        });

        it('only ever creates objects: no overwrite, copy or delete', async () => {
            const storage = new InMemoryReleaseStorage();
            await uploader.uploadCandidate(local(), storage, FAST);
            await uploader.uploadCandidate(local(), storage, FAST);
            expect(
                Array.from(new Set(storage.calls.map((call: any) => call.operation))).sort()
            ).toEqual(['get', 'putIfAbsent']);
            const source = fs.readFileSync(
                require.resolve('../../scripts/v3-release/upload-v3-candidate.ts'),
                'utf8'
            );
            expect(source).not.toMatch(/putObjectIfMatch|copyObject|deleteObject/i);
        });

        it('treats an existing identical object (412) as already present', async () => {
            const storage = new InMemoryReleaseStorage();
            const key = `${candidate.prefix}kits/rokt/dist/Rokt-Kit.iife.js`;
            const bytes = candidate.files.get('kits/rokt/dist/Rokt-Kit.iife.js');
            storage.seed(key, bytes, contract.candidateObjectHeaders('x.js'));
            const summary = await uploader.uploadCandidate(local(), storage, FAST);
            expect(summary.alreadyPresent).toBe(1);
            expect(summary.created).toBe(total() - 1);
            expect(
                storage.calls
                    .filter((call: any) => call.key === key)
                    .map((call: any) => call.operation)
            ).toEqual(['putIfAbsent', 'get', 'get']);
            expect(storage.bytesOf(key).equals(bytes)).toBe(true);
        });

        it('re-runs idempotently when every object is already present', async () => {
            const storage = new InMemoryReleaseStorage();
            await uploader.uploadCandidate(local(), storage, FAST);
            const summary = await uploader.uploadCandidate(local(), storage, FAST);
            expect(summary.created).toBe(0);
            expect(summary.alreadyPresent).toBe(total());
        });

        it.each([0, 5, 17, 18])(
            'resumes after a failure at object %i without ever writing metadata early',
            async failAt => {
                const storage = new InMemoryReleaseStorage();
                const plan = uploader.buildUploadPlan(local());
                storage.injectFault({
                    operation: 'putIfAbsent',
                    key: plan[failAt].key,
                    code: 'AccessDenied',
                });
                const message = await failureOf(
                    uploader.uploadCandidate(local(), storage, FAST)
                );
                expect(message).toContain('(AccessDenied)');
                expect(storage.bytesOf(`${candidate.prefix}metadata.json`)).toBeUndefined();
                expect(storage.writes()).toHaveLength(failAt + 1);

                const summary = await uploader.uploadCandidate(local(), storage, FAST);
                expect(summary.created).toBe(total() - failAt);
                expect(summary.alreadyPresent).toBe(failAt);
            }
        );

        it('treats a lost write response as idempotent success', async () => {
            const storage = new InMemoryReleaseStorage();
            storage.injectFault({
                operation: 'putIfAbsent',
                key: `${candidate.prefix}core/dist/mparticle.js`,
                code: 'Transient',
                afterApply: true,
            });
            const summary = await uploader.uploadCandidate(local(), storage, FAST);
            expect(summary.alreadyPresent).toBe(1);
            expect(summary.created).toBe(total() - 1);
        });

        it('retries throttling and conditional conflicts', async () => {
            const storage = new InMemoryReleaseStorage();
            storage.injectFault({ operation: 'putIfAbsent', code: 'Throttled', times: 2 });
            storage.injectFault({ operation: 'get', code: 'ConditionalConflict' });
            const summary = await uploader.uploadCandidate(local(), storage, FAST);
            expect(summary.created).toBe(total());
        });

        it('does not retry a denied write', async () => {
            const storage = new InMemoryReleaseStorage({
                deny: (operation: string) => operation === 'putIfAbsent',
            });
            await failureOf(uploader.uploadCandidate(local(), storage, FAST));
            expect(storage.writes()).toHaveLength(1);
        });

        it('stops on a collision with different bytes and never overwrites', async () => {
            const storage = new InMemoryReleaseStorage();
            const key = `${candidate.prefix}core/dist/mparticle.esm.js`;
            storage.seed(key, Buffer.from('different'), contract.candidateObjectHeaders('x.js'));
            const message = await failureOf(
                uploader.uploadCandidate(local(), storage, FAST)
            );
            expect(message).toMatch(/Candidate collision: core\/dist\/mparticle.esm.js/);
            expect(storage.bytesOf(key).toString()).toBe('different');
            expect(storage.writes()[storage.writes().length - 1].key).toBe(key);
            expect(storage.bytesOf(`${candidate.prefix}metadata.json`)).toBeUndefined();
        });

        it('fails when a different metadata.json is already present', async () => {
            const storage = new InMemoryReleaseStorage();
            storage.seed(
                `${candidate.prefix}metadata.json`,
                buildCandidate({ salt: 'other ' }).metadataBytes,
                contract.candidateObjectHeaders('metadata.json')
            );
            expect(await failureOf(uploader.uploadCandidate(local(), storage, FAST))).toMatch(
                /Candidate collision: metadata.json/
            );
        });

        it('fails when readback bytes differ', async () => {
            const storage = new InMemoryReleaseStorage({
                corruptRead: (key: string, bytes: Buffer) =>
                    key.endsWith('mparticle.stub.js') ? Buffer.from(bytes.toString().toUpperCase()) : bytes,
            });
            expect(await failureOf(uploader.uploadCandidate(local(), storage, FAST))).toMatch(
                /Readback of core\/dist\/mparticle.stub.js did not match/
            );
            expect(storage.bytesOf(`${candidate.prefix}metadata.json`)).toBeUndefined();
        });

        it('fails when an identical existing object has different headers', async () => {
            const storage = new InMemoryReleaseStorage();
            storage.seed(
                `${candidate.prefix}cdn-bundles.tgz`,
                candidate.files.get('cdn-bundles.tgz'),
                { contentType: 'application/x-gzip', cacheControl: 'no-cache' }
            );
            expect(await failureOf(uploader.uploadCandidate(local(), storage, FAST))).toMatch(
                /unexpected object headers/
            );
        });

        it('fails when an object carries a Content-Encoding', async () => {
            const storage = new InMemoryReleaseStorage();
            storage.seed(
                `${candidate.prefix}cdn-bundles.tgz`,
                candidate.files.get('cdn-bundles.tgz'),
                contract.candidateObjectHeaders('cdn-bundles.tgz'),
                'gzip'
            );
            expect(await failureOf(uploader.uploadCandidate(local(), storage, FAST))).toMatch(
                /unexpected object headers/
            );
        });

        it('fails when a file changes after validation', async () => {
            const validated = local();
            fs.writeFileSync(path.join(candidateDirectory, 'cdn-bundles.tgz'), 'swapped');
            const storage = new InMemoryReleaseStorage();
            expect(await failureOf(uploader.uploadCandidate(validated, storage, FAST))).toMatch(
                /changed after validation: cdn-bundles.tgz/
            );
        });
    });

    describe('command line', () => {
        it('dry-runs with no credentials, storage or writes', async () => {
            const output = new CapturedOutput();
            const createStorage = jest.fn();
            const progressFile = path.join(directory, 'progress.jsonl');
            const code = await uploader.main(
                ['--candidate', candidateDirectory, '--dry-run', '--pod', 'qa', '--progress-file', progressFile],
                { env: {}, log: output.write, createStorage }
            );
            expect(code).toBe(0);
            expect(createStorage).not.toHaveBeenCalled();
            expect(output.lines[0]).toMatch(/Dry run: no credentials used and nothing written. 19 objects/);
            expect(output.lines[19]).toMatch(/^19\/19 metadata.json \d+ bytes application\/json$/);
            expect(output.text).toContain('Candidate prefix: web-sdk/v3/candidates/3.5.0/12345-1/');
            expect(output.text).toContain(`metadata.json SHA-256: ${candidate.metadataSha256}`);
            expect(readProgressRecords(progressFile)).toEqual([
                expect.objectContaining({ pod: 'qa', operation: 'upload', status: 'dry-run' }),
            ]);
        });

        it('uploads through the AWS CLI adapter without disclosing configuration', async () => {
            const fake = installFakeAws(directory);
            const output = new CapturedOutput();
            const progressFile = path.join(directory, 'progress.jsonl');
            const env = {
                ...process.env,
                ...fake.env,
                SDK_ARTIFACT_BUCKET: FAKE_BUCKET,
                AWS_ACCOUNT_ID: FAKE_ACCOUNT_ID,
            };
            const args = [
                '--candidate',
                candidateDirectory,
                '--expected-build-id',
                '12345-1',
                '--expected-metadata-sha256',
                candidate.metadataSha256,
                '--pod',
                'qa',
                '--progress-file',
                progressFile,
            ];
            expect(await uploader.main(args, { env, log: output.write, upload: FAST })).toBe(0);

            const puts = fake.calls().filter(call => call[1] === 'put-object');
            expect(puts).toHaveLength(19);
            expect(puts.every(call => argValue(call, '--if-none-match') === '*')).toBe(true);
            expect(puts.every(call => argValue(call, '--expected-bucket-owner') === FAKE_ACCOUNT_ID)).toBe(true);
            expect(argValue(puts[18], '--key')).toBe(`${candidate.prefix}metadata.json`);
            expect(fake.read(`${candidate.prefix}metadata.json`).equals(candidate.metadataBytes)).toBe(true);
            expect(fake.calls().every(call => argValue(call, '--key').startsWith(candidate.prefix))).toBe(true);

            expect(await uploader.main(args, { env, log: output.write, upload: FAST })).toBe(0);
            expect(output.text).toContain('Objects: 19 (0 created, 19 already present)');
            expect(output.text).not.toContain(FAKE_BUCKET);
            expect(output.text).not.toContain(FAKE_ACCOUNT_ID);
            expect(readProgressRecords(progressFile).map((record: any) => record.status)).toEqual([
                'succeeded',
                'succeeded',
            ]);
        });

        it('records a failed pod and surfaces only the normalized code', async () => {
            const fake = installFakeAws(directory, {
                deny: { put: [`${candidate.prefix}kits/`] },
            });
            const output = new CapturedOutput();
            const progressFile = path.join(directory, 'progress.jsonl');
            let message = '';
            try {
                await uploader.main(
                    ['--candidate', candidateDirectory, '--pod', 'us1', '--progress-file', progressFile],
                    {
                        env: {
                            ...process.env,
                            ...fake.env,
                            SDK_ARTIFACT_BUCKET: FAKE_BUCKET,
                            AWS_ACCOUNT_ID: FAKE_ACCOUNT_ID,
                        },
                        log: output.write,
                        upload: FAST,
                    }
                );
            } catch (error) {
                message = (error as Error).message;
            }
            expect(message).toMatch(/putIfAbsent .*kits\/braze.* failed \(AccessDenied\)/);
            const [record] = readProgressRecords(progressFile);
            expect(record).toMatchObject({ pod: 'us1', status: 'failed' });
            for (const text of [message, output.text, JSON.stringify(record)]) {
                expect(text).not.toContain(FAKE_BUCKET);
                expect(text).not.toContain(FAKE_ACCOUNT_ID);
                expect(text).not.toContain('raw stderr');
            }
            expect(fake.read(`${candidate.prefix}metadata.json`)).toBeUndefined();
        });

        it.each([
            [['--dry-run'], /--candidate is required/],
            [['--candidate'], /--candidate requires a value/],
            [['--candidate', 'x', '--expected-build-id', '../1'], /Build ID/],
            [['--candidate', 'x', '--pod', 'US1'], /Pod/],
            [['--candidate', 'x', '--expected-source-sha', 'ABC'], /full lowercase commit SHA/],
            [['--candidate', 'x', '--bucket', 'b'], /Unknown argument: --bucket/],
        ])('rejects arguments %j', (args, pattern) => {
            expect(() => uploader.parseArguments(args)).toThrow(pattern);
        });
    });
});
