import * as fs from 'fs';
import {
    FAKE_ACCOUNT_ID,
    FAKE_BUCKET,
    argValue,
    installFakeAws,
} from './v3-release/fake-aws';
import { makeTempDirectory } from './v3-release/helpers';

const contract = require('../../scripts/v3-release/release-contract.ts');
const {
    ReleaseStorageError,
    isRetryable,
} = require('../../scripts/v3-release/release-storage.ts');
const {
    InMemoryReleaseStorage,
    etagFor,
} = require('../../scripts/v3-release/in-memory-release-storage.ts');
const {
    AwsCliReleaseStorage,
    awsCliStorageFromEnvironment,
    extractAwsErrorCode,
    mapAwsErrorCode,
} = require('../../scripts/v3-release/aws-cli-release-storage.ts');

const KEY = 'web-sdk/v3/candidates/3.5.0/12345-1/core/dist/mparticle.js';
const POINTER = 'web-sdk/v3/channels/v3-staging/active-release.json';
const JS_HEADERS = contract.candidateObjectHeaders('core/dist/mparticle.js');

async function codeOf(promise: Promise<unknown>): Promise<string> {
    try {
        await promise;
    } catch (error) {
        expect(error).toBeInstanceOf(ReleaseStorageError);
        return (error as any).code;
    }
    throw new Error('Expected a storage error');
}

function expectNoDisclosure(text: string) {
    for (const secret of [FAKE_BUCKET, FAKE_ACCOUNT_ID, 'raw stderr']) {
        expect(text).not.toContain(secret);
    }
}

describe('V3 release storage', () => {
    describe('in-memory fake', () => {
        it('models create-only writes', async () => {
            const storage = new InMemoryReleaseStorage();
            const bytes = Buffer.from('a');
            const { etag } = await storage.putObjectIfAbsent(KEY, bytes, JS_HEADERS);
            expect(etag).toBe(etagFor(bytes));
            expect(
                await codeOf(storage.putObjectIfAbsent(KEY, bytes, JS_HEADERS))
            ).toBe('PreconditionFailed');
            const stored = await storage.getObject(KEY, 10);
            expect(stored.bytes.toString()).toBe('a');
            expect(stored.contentType).toBe(JS_HEADERS.contentType);
            expect(stored.cacheControl).toBe(JS_HEADERS.cacheControl);
            expect(stored.contentEncoding).toBeUndefined();
        });

        it('models If-Match writes and missing keys', async () => {
            const storage = new InMemoryReleaseStorage();
            expect(
                await codeOf(
                    storage.putObjectIfMatch(POINTER, Buffer.from('x'), '"e"', contract.POINTER_HEADERS)
                )
            ).toBe('NotFound');
            storage.seed(POINTER, Buffer.from('one'));
            const current = await storage.getObject(POINTER, 10);
            expect(
                await codeOf(
                    storage.putObjectIfMatch(POINTER, Buffer.from('two'), '"stale"', contract.POINTER_HEADERS)
                )
            ).toBe('PreconditionFailed');
            await storage.putObjectIfMatch(
                POINTER,
                Buffer.from('two'),
                current.etag,
                contract.POINTER_HEADERS
            );
            expect(storage.bytesOf(POINTER).toString()).toBe('two');
            expect(await codeOf(storage.getObject('missing', 10))).toBe('NotFound');
        });

        it('models denials, missing-key 403s, lost responses and corruption', async () => {
            const storage = new InMemoryReleaseStorage({
                missingObjectCode: 'AccessDenied',
                deny: (operation: string, key: string) =>
                    operation !== 'get' && key.startsWith('web-sdk/v3/channels/'),
                corruptRead: (_key: string, bytes: Buffer) =>
                    Buffer.concat([bytes, Buffer.from('!')]),
            });
            expect(await codeOf(storage.getObject('missing', 10))).toBe('AccessDenied');
            expect(
                await codeOf(storage.putObjectIfAbsent(POINTER, Buffer.from('p'), contract.POINTER_HEADERS))
            ).toBe('AccessDenied');

            storage.injectFault({ operation: 'putIfAbsent', code: 'Transient', afterApply: true });
            expect(
                await codeOf(storage.putObjectIfAbsent(KEY, Buffer.from('a'), JS_HEADERS))
            ).toBe('Transient');
            expect(storage.bytesOf(KEY).toString()).toBe('a');
            expect((await storage.getObject(KEY, 10)).bytes.toString()).toBe('a!');
            expect(await codeOf(storage.getObject(KEY, 1))).toBe('TooLarge');
            expect(storage.writes().map((call: any) => call.operation)).toEqual([
                'putIfAbsent',
                'putIfAbsent',
            ]);
        });

        it('classifies only transient failures as retryable', () => {
            for (const code of ['ConditionalConflict', 'Throttled', 'Transient']) {
                expect(isRetryable(new ReleaseStorageError(code, 'get', KEY))).toBe(true);
            }
            for (const code of ['PreconditionFailed', 'AccessDenied', 'BadDigest', 'NotFound', 'Unknown']) {
                expect(isRetryable(new ReleaseStorageError(code, 'get', KEY))).toBe(false);
            }
            expect(isRetryable(new Error('other'))).toBe(false);
        });
    });

    describe('AWS CLI adapter', () => {
        let directory: string;

        beforeEach(() => {
            directory = makeTempDirectory('v3-release-storage-');
        });

        afterEach(() => {
            fs.rmSync(directory, { recursive: true, force: true });
        });

        function adapter(fake: ReturnType<typeof installFakeAws>) {
            return new AwsCliReleaseStorage({
                bucket: FAKE_BUCKET,
                expectedBucketOwner: FAKE_ACCOUNT_ID,
                env: { ...process.env, ...fake.env },
            });
        }

        it('sends create-only PUTs with fixed headers, checksum and owner', async () => {
            const fake = installFakeAws(directory);
            const storage = adapter(fake);
            const bytes = Buffer.from('console.log(1);');
            const { etag } = await storage.putObjectIfAbsent(KEY, bytes, JS_HEADERS);
            expect(etag).toBe(etagFor(bytes));

            const [call] = fake.calls();
            expect(call.slice(0, 2)).toEqual(['s3api', 'put-object']);
            expect(argValue(call, '--bucket')).toBe(FAKE_BUCKET);
            expect(argValue(call, '--key')).toBe(KEY);
            expect(argValue(call, '--if-none-match')).toBe('*');
            expect(argValue(call, '--expected-bucket-owner')).toBe(FAKE_ACCOUNT_ID);
            expect(argValue(call, '--content-type')).toBe(
                'application/javascript; charset=utf-8'
            );
            expect(argValue(call, '--cache-control')).toBe(
                'public, max-age=31536000, immutable'
            );
            expect(argValue(call, '--checksum-sha256')).toBe(contract.sha256Base64(bytes));
            for (const flag of ['--if-match', '--acl', '--content-encoding', '--server-side-encryption']) {
                expect(call).not.toContain(flag);
            }
            expect(fake.read(KEY).equals(bytes)).toBe(true);
            expect(fake.headers(KEY)).toMatchObject({
                contentType: JS_HEADERS.contentType,
                cacheControl: JS_HEADERS.cacheControl,
            });
        });

        it('reads objects with their ETag and headers', async () => {
            const fake = installFakeAws(directory);
            const storage = adapter(fake);
            await storage.putObjectIfAbsent(KEY, Buffer.from('abc'), JS_HEADERS);
            const stored = await storage.getObject(KEY, 3);
            expect(stored.bytes.toString()).toBe('abc');
            expect(stored.etag).toBe(etagFor(Buffer.from('abc')));
            expect(stored.contentType).toBe(JS_HEADERS.contentType);
            expect(stored.contentEncoding).toBeUndefined();
            const getCall = fake.calls()[1];
            expect(getCall.slice(0, 2)).toEqual(['s3api', 'get-object']);
            expect(argValue(getCall, '--expected-bucket-owner')).toBe(FAKE_ACCOUNT_ID);
            expect(await codeOf(storage.getObject(KEY, 2))).toBe('TooLarge');
        });

        it('sends If-Match with the read ETag and fails stale writes', async () => {
            const fake = installFakeAws(directory);
            const storage = adapter(fake);
            fake.seed(POINTER, Buffer.from('one'), contract.POINTER_HEADERS);
            const current = await storage.getObject(POINTER, 100);
            await storage.putObjectIfMatch(POINTER, Buffer.from('two'), current.etag, contract.POINTER_HEADERS);
            const putCall = fake.calls()[1];
            expect(argValue(putCall, '--if-match')).toBe(current.etag);
            expect(putCall).not.toContain('--if-none-match');
            expect(argValue(putCall, '--cache-control')).toBe('no-cache');
            expect(
                await codeOf(
                    storage.putObjectIfMatch(POINTER, Buffer.from('three'), current.etag, contract.POINTER_HEADERS)
                )
            ).toBe('PreconditionFailed');
            expect(fake.read(POINTER).toString()).toBe('two');
        });

        it('refuses bodies over the single-part cap before calling AWS', async () => {
            const fake = installFakeAws(directory);
            const oversized = Buffer.alloc(contract.MAX_CANDIDATE_FILE_BYTES + 1);
            expect(
                await codeOf(adapter(fake).putObjectIfAbsent(KEY, oversized, JS_HEADERS))
            ).toBe('TooLarge');
            expect(
                await codeOf(
                    adapter(fake).putObjectIfMatch(POINTER, oversized, '"e"', contract.POINTER_HEADERS)
                )
            ).toBe('TooLarge');
            expect(fake.calls()).toEqual([]);
            expect(
                await codeOf(
                    new InMemoryReleaseStorage().putObjectIfAbsent(KEY, oversized, JS_HEADERS)
                )
            ).toBe('TooLarge');
        });

        it('only ever calls single-part put-object and get-object', async () => {
            const fake = installFakeAws(directory);
            const storage = adapter(fake);
            await storage.putObjectIfAbsent(KEY, Buffer.from('a'), JS_HEADERS);
            fake.seed(POINTER, Buffer.from('one'), contract.POINTER_HEADERS);
            const current = await storage.getObject(POINTER, 100);
            await storage.putObjectIfMatch(POINTER, Buffer.from('two'), current.etag, contract.POINTER_HEADERS);
            expect(fake.calls().map(call => call.slice(0, 2).join(' '))).toEqual([
                's3api put-object',
                's3api get-object',
                's3api put-object',
            ]);
            // Every write carries exactly one precondition.
            for (const call of fake.calls().filter(call => call[1] === 'put-object')) {
                expect(
                    ['--if-none-match', '--if-match'].filter(flag => call.includes(flag))
                ).toHaveLength(1);
            }
            const source = fs.readFileSync(
                require.resolve('../../scripts/v3-release/aws-cli-release-storage.ts'),
                'utf8'
            );
            for (const forbidden of [
                "'copy-object'",
                "'upload-part-copy'",
                "'create-multipart-upload'",
                "'complete-multipart-upload'",
                "'upload-part'",
                "'delete-object'",
                "'s3', 'cp'",
                "'--server-side-encryption'",
            ]) {
                expect(source).not.toContain(forbidden);
            }
            expect(Object.getOwnPropertyNames(AwsCliReleaseStorage.prototype).sort()).toEqual([
                'constructor',
                'getObject',
                'put',
                'putObjectIfAbsent',
                'putObjectIfMatch',
                'run',
                'withTemporaryDirectory',
            ]);
        });

        it.each([
            ['AccessDenied', 'AccessDenied'],
            ['PreconditionFailed', 'PreconditionFailed'],
            ['ConditionalRequestConflict', 'ConditionalConflict'],
            ['SlowDown', 'Throttled'],
            ['InternalError', 'Transient'],
            ['BadDigest', 'BadDigest'],
            ['SomethingNew', 'Unknown'],
        ])('normalizes %s without disclosing provider output', async (awsCode, code) => {
            for (const textErrors of [false, true]) {
                const fake = installFakeAws(fs.mkdtempSync(`${directory}/case-`), {
                    textErrors,
                    failures: [{ operation: 'put-object', code: awsCode }],
                });
                let message = '';
                try {
                    await adapter(fake).putObjectIfAbsent(KEY, Buffer.from('a'), JS_HEADERS);
                } catch (error) {
                    expect((error as any).code).toBe(code);
                    message = `${(error as Error).message} ${(error as Error).stack}`;
                }
                expect(message).toContain(`(${code})`);
                expectNoDisclosure(message);
            }
        });

        it('reports a wrong bucket owner as AccessDenied and a missing key as NotFound', async () => {
            const fake = installFakeAws(directory, { owner: '210987654321' });
            expect(await codeOf(adapter(fake).getObject(KEY, 10))).toBe('AccessDenied');
            fake.configure({});
            expect(await codeOf(adapter(fake).getObject(KEY, 10))).toBe('NotFound');
        });

        it('reports a missing AWS CLI as Unavailable', async () => {
            const storage = new AwsCliReleaseStorage({
                bucket: FAKE_BUCKET,
                expectedBucketOwner: FAKE_ACCOUNT_ID,
                awsExecutable: `${directory}/no-such-aws`,
            });
            expect(await codeOf(storage.getObject(KEY, 10))).toBe('Unavailable');
        });

        it('extracts only well-formed error codes', () => {
            expect(extractAwsErrorCode('{"Code":"AccessDenied","Message":"x"}')).toBe('AccessDenied');
            expect(
                extractAwsErrorCode('An error occurred (412) when calling the PutObject operation')
            ).toBe('412');
            expect(extractAwsErrorCode('{"Code":"bad code; rm -rf"}')).toBe('Unknown');
            expect(extractAwsErrorCode('garbage')).toBe('Unknown');
            expect(mapAwsErrorCode('412')).toBe('PreconditionFailed');
            expect(mapAwsErrorCode('__proto__')).toBe('Unknown');
        });

        it('validates environment configuration without echoing values', () => {
            const cases: Array<[Record<string, string>, RegExp]> = [
                [{ AWS_ACCOUNT_ID: FAKE_ACCOUNT_ID }, /SDK_ARTIFACT_BUCKET is not set/],
                [{ SDK_ARTIFACT_BUCKET: FAKE_BUCKET }, /AWS_ACCOUNT_ID is not set/],
                [
                    { SDK_ARTIFACT_BUCKET: FAKE_BUCKET, AWS_ACCOUNT_ID: '12345' },
                    /expected account configuration is invalid/,
                ],
                [
                    { SDK_ARTIFACT_BUCKET: 'Secret_Bucket', AWS_ACCOUNT_ID: FAKE_ACCOUNT_ID },
                    /bucket configuration is invalid/,
                ],
            ];
            for (const [env, pattern] of cases) {
                let message = '';
                try {
                    awsCliStorageFromEnvironment(env);
                } catch (error) {
                    message = (error as Error).message;
                }
                expect(message).toMatch(pattern);
                expectNoDisclosure(message);
                expect(message).not.toContain('Secret_Bucket');
            }
            expect(
                awsCliStorageFromEnvironment({
                    SDK_ARTIFACT_BUCKET: FAKE_BUCKET,
                    AWS_ACCOUNT_ID: FAKE_ACCOUNT_ID,
                })
            ).toBeInstanceOf(AwsCliReleaseStorage);
        });
    });
});
