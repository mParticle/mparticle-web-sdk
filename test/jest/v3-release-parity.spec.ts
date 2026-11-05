import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { makeTempDirectory } from './v3-release/helpers';

const contract = require('../../scripts/v3-release/release-contract.ts');
const parity = require('../../scripts/v3-release/check-release-parity.ts');

const VERSION = '3.5.0';
const TAG = `v${VERSION}`;
const PACKAGE = '@mparticle/web-sdk';
const TARBALL = `npm/mparticle-web-sdk-${VERSION}.tgz`;
// A release with kits lists several packages; the core package is one of them.
const KIT_RELEASE_PACKAGES = [
    '@mparticle/web-braze-kit',
    '@mparticle/web-rokt-kit',
    PACKAGE,
];
const LARGE_RELEASE_PACKAGES = [
    '@mparticle/web-adobe-kit',
    '@mparticle/web-amplitude-kit',
    '@mparticle/web-braze-kit',
    '@mparticle/web-google-analytics-kit',
    '@mparticle/web-rokt-kit',
    PACKAGE,
];

// Committed at the tag, as the release process leaves them.
const REPOSITORY_FILES: Record<string, string> = {
    'dist/mparticle.common.js': 'core common',
    'dist/mparticle.esm.js': 'core esm',
    'dist/mparticle.js': 'core iife',
    'dist/mparticle.stub.js': 'core stub',
    'dist/types/src/sdk.d.ts': 'types are not bundles',
    'kits/rokt/dist/Rokt-Kit.iife.js': 'rokt iife',
    'kits/rokt/dist/Rokt-Kit.iife.js.map': '{"version":3}',
    'kits/rokt/dist/Rokt-Kit.d.ts': 'types are not bundles',
    'kits/braze/braze-5/dist/BrazeKit.common.js': 'braze common',
    'kits/braze/braze-5/src/BrazeKit.js': 'source is not a bundle',
};

type NpmReply = { status: number; stdout: string; stderr: string };

function tarballFor(name: string): string {
    return `npm/${name.replace(/^@/, '').replace('/', '-')}-${VERSION}.tgz`;
}

function published(integrity: string): NpmReply {
    return { status: 0, stdout: JSON.stringify(integrity), stderr: '' };
}

describe('V3 shadow release parity', () => {
    let directory: string;
    let repository: string;
    let candidate: string;
    let tagSha: string;
    let npmReply: NpmReply;
    // Replies for the next npm reads, in order; npmReply once they run out.
    let npmReplies: NpmReply[];
    let npmCalls: string[][];
    // The timeout each npm view was given, and what a view does to the clock.
    let npmTimeouts: Array<number | undefined>;
    let onNpmView: (timeoutMilliseconds?: number) => void;

    function git(...args: string[]): string {
        const result = spawnSync(
            'git',
            [
                '-c',
                'user.name=test',
                '-c',
                'user.email=test@example.com',
                '-c',
                'commit.gpgsign=false',
                '-c',
                'tag.gpgsign=false',
                ...args,
            ],
            { cwd: repository, encoding: 'utf8' }
        );
        if (result.status !== 0) {
            throw new Error(result.stderr);
        }
        return result.stdout.trim();
    }

    function write(root: string, filePath: string, content: string | Buffer) {
        fs.mkdirSync(path.dirname(path.join(root, filePath)), { recursive: true });
        fs.writeFileSync(path.join(root, filePath), content);
    }

    // Runs git and tar for real inside the test repository; npm is faked.
    function run(
        command: string,
        args: string[],
        encoding: 'utf8' | 'buffer',
        timeoutMilliseconds?: number
    ) {
        if (command === 'npm') {
            npmCalls.push(args);
            npmTimeouts.push(timeoutMilliseconds);
            onNpmView(timeoutMilliseconds);
            return npmReplies.shift() || npmReply;
        }
        const result = spawnSync(command, args, {
            cwd: repository,
            encoding: encoding === 'utf8' ? 'utf8' : 'buffer',
            maxBuffer: 64 * 1024 * 1024,
        });
        return {
            status: result.status === null ? -1 : result.status,
            stdout: result.stdout,
            stderr: String(result.stderr || ''),
        };
    }

    function writeMetadata(sourceSha = tagSha, packageNames = [PACKAGE]) {
        const files = listFiles(candidate)
            .filter(filePath => filePath !== 'metadata.json')
            .map(filePath => {
                const bytes = fs.readFileSync(path.join(candidate, filePath));
                return {
                    path: filePath,
                    size: bytes.length,
                    sha256: contract.sha256Hex(bytes),
                };
            });
        const metadata = {
            schemaVersion: 1,
            version: VERSION,
            sourceSha,
            buildId: '12345-1',
            packages: packageNames.map(name => ({
                name,
                path: tarballFor(name),
                npmIntegrity: contract.npmIntegrityFor(
                    fs.readFileSync(path.join(candidate, tarballFor(name)))
                ),
            })),
            files,
        };
        fs.writeFileSync(
            path.join(candidate, 'metadata.json'),
            contract.serializeCanonical(metadata)
        );
        return metadata;
    }

    // Writes a tarball for each package and lists them all, sorted by name as
    // the canonical metadata requires.
    function writePackages(names: string[]) {
        const sorted = [...names].sort(contract.compareStrings);
        for (const name of sorted) {
            write(candidate, tarballFor(name), Buffer.from(`packed ${name}`));
        }
        return writeMetadata(tagSha, sorted).packages;
    }

    function listFiles(root: string, prefix = ''): string[] {
        return fs
            .readdirSync(path.join(root, prefix), { withFileTypes: true })
            .flatMap(entry => {
                const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
                return entry.isDirectory() ? listFiles(root, relative) : [relative];
            })
            .sort(contract.compareStrings);
    }

    function writeArchive() {
        const result = spawnSync(
            'tar',
            ['-czf', path.join(candidate, 'cdn-bundles.tgz'), '-C', candidate, 'core', 'kits'],
            { encoding: 'utf8' }
        );
        expect(result.stderr).toBe('');
        expect(result.status).toBe(0);
    }

    function check(npm = true) {
        return parity.checkParity({ candidate, tag: TAG, npm, run });
    }

    beforeEach(() => {
        directory = makeTempDirectory('v3-release-parity-');
        repository = path.join(directory, 'repository');
        candidate = path.join(directory, 'candidate');
        fs.mkdirSync(repository);
        git('init', '-q');
        write(repository, 'package.json', JSON.stringify({ version: VERSION }));
        for (const [filePath, content] of Object.entries(REPOSITORY_FILES)) {
            write(repository, filePath, content);
        }
        git('add', '.');
        git('commit', '-q', '-m', 'release');
        git('tag', '-a', TAG, '-m', TAG);
        tagSha = git('rev-parse', `${TAG}^{commit}`);

        for (const [filePath, content] of Object.entries(REPOSITORY_FILES)) {
            if (/(?:^|\/)dist\/[^/]+\.js(?:\.map)?$/.test(filePath)) {
                write(
                    candidate,
                    filePath.startsWith('dist/') ? `core/${filePath}` : filePath,
                    content
                );
            }
        }
        write(candidate, TARBALL, Buffer.from('packed tarball'));
        writeArchive();
        const metadata = writeMetadata();
        npmReply = {
            status: 0,
            stdout: JSON.stringify(metadata.packages[0].npmIntegrity),
            stderr: '',
        };
        npmReplies = [];
        npmCalls = [];
        npmTimeouts = [];
        onNpmView = () => {};
    });

    afterEach(() => {
        fs.rmSync(directory, { recursive: true, force: true });
    });

    it('maps core/ to the repository root and kits/ to itself, and passes', () => {
        const report = check();
        expect(report.git).toBe('pass');
        expect(report.npm).toBe('pass');
        expect(report.problems).toEqual([]);
        expect(
            report.files.map((file: any) => [file.candidatePath, file.repositoryPath, file.status])
        ).toEqual([
            ['core/dist/mparticle.common.js', 'dist/mparticle.common.js', 'match'],
            ['core/dist/mparticle.esm.js', 'dist/mparticle.esm.js', 'match'],
            ['core/dist/mparticle.js', 'dist/mparticle.js', 'match'],
            ['core/dist/mparticle.stub.js', 'dist/mparticle.stub.js', 'match'],
            [
                'kits/braze/braze-5/dist/BrazeKit.common.js',
                'kits/braze/braze-5/dist/BrazeKit.common.js',
                'match',
            ],
            ['kits/rokt/dist/Rokt-Kit.iife.js', 'kits/rokt/dist/Rokt-Kit.iife.js', 'match'],
            [
                'kits/rokt/dist/Rokt-Kit.iife.js.map',
                'kits/rokt/dist/Rokt-Kit.iife.js.map',
                'match',
            ],
        ]);
        expect(npmCalls).toEqual([
            [
                'view',
                `${PACKAGE}@${VERSION}`,
                'dist.integrity',
                '--json',
                '--registry',
                'https://registry.npmjs.org/',
            ],
        ]);
        expect(parity.isUploadable(report)).toBe(true);
    });

    it('fails a bundle whose bytes differ from the tag', () => {
        write(candidate, 'kits/rokt/dist/Rokt-Kit.iife.js', 'rokt iife, rebuilt');
        writeArchive();
        writeMetadata();
        const report = check();
        expect(report.git).toBe('fail');
        expect(report.problems).toContain(
            `kits/rokt/dist/Rokt-Kit.iife.js (kits/rokt/dist/Rokt-Kit.iife.js at ${TAG}): differs`
        );
        expect(parity.isUploadable(report)).toBe(false);
    });

    it('fails a candidate bundle that is not committed at the tag', () => {
        write(candidate, 'kits/rokt/dist/Rokt-Kit.esm.js', 'not committed');
        writeArchive();
        writeMetadata();
        expect(check().problems).toContain(
            `kits/rokt/dist/Rokt-Kit.esm.js (kits/rokt/dist/Rokt-Kit.esm.js at ${TAG}): missing`
        );
    });

    it('fails when a committed bundle is left out of the candidate', () => {
        fs.rmSync(path.join(candidate, 'kits/rokt/dist/Rokt-Kit.iife.js.map'));
        fs.rmSync(path.join(candidate, 'cdn-bundles.tgz'));
        writeArchive();
        writeMetadata();
        const report = check();
        expect(report.git).toBe('fail');
        expect(report.problems).toContain(
            `kits/rokt/dist/Rokt-Kit.iife.js.map (kits/rokt/dist/Rokt-Kit.iife.js.map at ${TAG}): unexpected`
        );
    });

    it('fails when the tag is not the commit the candidate was packaged from', () => {
        writeMetadata('c'.repeat(40));
        expect(check().problems).toContain(
            `${TAG} is ${tagSha}, but the candidate was packaged from ${'c'.repeat(40)}`
        );
    });

    it('fails when the tag carries another version', () => {
        write(repository, 'package.json', JSON.stringify({ version: '3.5.1' }));
        git('commit', '-q', '-am', 'bump');
        git('tag', '-f', '-a', TAG, '-m', TAG);
        tagSha = git('rev-parse', `${TAG}^{commit}`);
        writeMetadata();
        expect(check().problems).toContain(
            `package.json at ${TAG} is 3.5.1, but the candidate is ${VERSION}`
        );
    });

    it('fails when cdn-bundles.tgz does not hold exactly the candidate bundles', () => {
        fs.rmSync(path.join(candidate, 'cdn-bundles.tgz'));
        fs.renameSync(
            path.join(candidate, 'kits/braze'),
            path.join(directory, 'braze')
        );
        writeArchive();
        fs.renameSync(path.join(directory, 'braze'), path.join(candidate, 'kits/braze'));
        writeMetadata();
        expect(check().problems).toContain(
            'cdn-bundles.tgz does not hold exactly the candidate core/ and kits/ files'
        );
    });

    it('rejects a candidate for a different release', () => {
        expect(() =>
            parity.checkParity({ candidate, tag: 'v3.5.1', npm: false, run })
        ).toThrow(/not the release v3.5.1/);
        expect(() =>
            parity.checkParity({ candidate, tag: '3.5.0', npm: false, run })
        ).toThrow(/stable vX.Y.Z/);
    });

    describe('npm', () => {
        it.each([
            ['an unpublished package (E404)', { status: 1, stdout: '', stderr: 'npm error code E404' }],
            ['an unpublished version (empty reply)', { status: 0, stdout: '', stderr: '' }],
        ])('reports %s as pending and still allows the upload', (_label, reply) => {
            npmReply = reply;
            const report = check();
            expect(report.npm).toBe('pending');
            expect(report.packages[0]).toMatchObject({ status: 'pending', published: null });
            expect(parity.isUploadable(report)).toBe(true);
        });

        it('fails a published tarball with a different integrity', () => {
            npmReply = {
                status: 0,
                stdout: JSON.stringify(contract.npmIntegrityFor(Buffer.from('other'))),
                stderr: '',
            };
            const report = check();
            expect(report.npm).toBe('fail');
            expect(report.git).toBe('pass');
            expect(parity.isUploadable(report)).toBe(false);
        });

        it('stops at the first of several packages when it differs, and reads no other', () => {
            const packages = writePackages(KIT_RELEASE_PACKAGES);
            const other = contract.npmIntegrityFor(Buffer.from('other'));
            npmReplies = [published(other)];
            const report = check();
            expect(npmCalls.map(args => args[1])).toEqual([`${packages[0].name}@${VERSION}`]);
            expect(report.packages).toEqual([
                {
                    name: packages[0].name,
                    version: VERSION,
                    expected: packages[0].npmIntegrity,
                    published: other,
                    status: 'differs',
                },
            ]);
            expect(report.npm).toBe('fail');
            expect(parity.isUploadable(report)).toBe(false);
        });

        it('reads every package while they match, and stops at a later one that differs', () => {
            const packages = writePackages(KIT_RELEASE_PACKAGES);
            npmReplies = packages.map((item: any) => published(item.npmIntegrity));
            expect(check().npm).toBe('pass');
            expect(npmCalls).toHaveLength(3);

            npmCalls = [];
            npmReplies = [
                published(packages[0].npmIntegrity),
                published(contract.npmIntegrityFor(Buffer.from('other'))),
            ];
            const report = check();
            expect(npmCalls).toHaveLength(2);
            expect(report.packages.map((item: any) => item.status)).toEqual(['match', 'differs']);
            expect(report.npm).toBe('fail');
        });

        it('gives each npm view at most 30 seconds', () => {
            const packages = writePackages(KIT_RELEASE_PACKAGES);
            npmReplies = packages.map((item: any) => published(item.npmIntegrity));
            expect(check().npm).toBe('pass');
            expect(npmTimeouts).toEqual([30_000, 30_000, 30_000]);
        });

        it.each([
            ['a registry error', { status: 1, stdout: '', stderr: 'npm error code ETIMEDOUT' }],
            ['an unexpected reply', { status: 0, stdout: '"sha1-abc"', stderr: '' }],
        ])('reports %s as unavailable without blocking', (_label, reply) => {
            npmReply = reply;
            const report = check();
            expect(report.npm).toBe('unavailable');
            expect(parity.isUploadable(report)).toBe(true);
        });

        it('is skipped without --npm', () => {
            const report = check(false);
            expect(npmCalls).toEqual([]);
            expect(report.npm).toBe('pending');
        });
    });

    // Release-gate mode passes --npm-retry-seconds 600: Audit V3 kits on npm
    // only warns about a kit npm does not show yet, so the gate reads npm
    // again with backoff before it fails on pending or unavailable.
    describe('npm retry window', () => {
        const PENDING: NpmReply = { status: 1, stdout: '', stderr: 'npm error code E404' };
        const UNAVAILABLE: NpmReply = { status: 1, stdout: '', stderr: 'npm error code ETIMEDOUT' };
        let clock: number;
        let sleeps: number[];
        let logs: string[];

        function checkWithin(npmRetrySeconds: number) {
            return parity.checkParity({
                candidate,
                tag: TAG,
                npm: true,
                npmRetrySeconds,
                run,
                now: () => clock,
                sleep: (milliseconds: number) => {
                    sleeps.push(milliseconds);
                    clock += milliseconds;
                },
                log: (line: string) => logs.push(line),
            });
        }

        beforeEach(() => {
            clock = 1_000_000;
            sleeps = [];
            logs = [];
        });

        it('reads npm again while it reads pending, and passes once npm shows the package', () => {
            npmReplies = [PENDING, PENDING];
            const report = checkWithin(600);
            expect(npmCalls).toHaveLength(3);
            expect(sleeps).toEqual([15_000, 30_000]);
            expect(report.npm).toBe('pass');
            expect(report.npmReads).toBe(3);
            expect(report.packages[0]).toMatchObject({ status: 'match' });
            expect(logs).toEqual([
                'npm parity reads pending after read 1; reading again in 15 s (600 s left).',
                'npm parity reads pending after read 2; reading again in 30 s (585 s left).',
            ]);
            expect(parity.renderSummary(report)).toContain('- npm parity: **pass** after 3 reads');
            expect(parity.isUploadable(report)).toBe(true);
        });

        it('stays pending when npm still reads pending as the window runs out', () => {
            npmReply = PENDING;
            const start = clock;
            const report = checkWithin(600);
            // 15, 30, 60 and 120 seconds, then 120 until the last read falls
            // exactly on the end of the window.
            expect(sleeps).toEqual([
                15_000, 30_000, 60_000, 120_000, 120_000, 120_000, 120_000, 15_000,
            ]);
            expect(clock - start).toBe(600_000);
            expect(npmCalls).toHaveLength(sleeps.length + 1);
            expect(report.npm).toBe('pending');
            expect(report.npmReads).toBe(9);
            // The script still exits 0 on pending; "Require npm parity in
            // release-gate mode" is the step that fails the gate on it.
            expect(parity.isUploadable(report)).toBe(true);
        });

        it('reads an unavailable reply again, and stops at once on a fail reading', () => {
            npmReplies = [
                UNAVAILABLE,
                {
                    status: 0,
                    stdout: JSON.stringify(contract.npmIntegrityFor(Buffer.from('other'))),
                    stderr: '',
                },
            ];
            const report = checkWithin(600);
            expect(npmCalls).toHaveLength(2);
            expect(sleeps).toEqual([15_000]);
            expect(report.npm).toBe('fail');
            expect(parity.isUploadable(report)).toBe(false);
        });

        it('stops at once when the first of several packages differs, without reading the rest or waiting', () => {
            writePackages(KIT_RELEASE_PACKAGES);
            npmReplies = [published(contract.npmIntegrityFor(Buffer.from('other')))];
            const report = checkWithin(600);
            expect(npmCalls).toHaveLength(1);
            expect(sleeps).toEqual([]);
            expect(report.npmReads).toBe(1);
            expect(report.npm).toBe('fail');
        });

        it('caps each npm view at the time left of a 2-minute read, and reads a package with no time left as unavailable', () => {
            const packages = writePackages(LARGE_RELEASE_PACKAGES);
            // A slow registry: each npm view takes 25 seconds and reads pending.
            npmReply = PENDING;
            onNpmView = () => {
                clock += 25_000;
            };
            const report = checkWithin(0);
            // 120 s left at the first view, then 95, 70, 45 and 20; none for the sixth.
            expect(npmTimeouts).toEqual([30_000, 30_000, 30_000, 30_000, 20_000]);
            expect(report.packages.map((item: any) => item.status)).toEqual([
                'pending',
                'pending',
                'pending',
                'pending',
                'pending',
                'unavailable',
            ]);
            expect(report.packages[5]).toMatchObject({ name: packages[5].name, published: null });
            expect(report.npm).toBe('unavailable');
        });

        it('ends a hung registry read 2 minutes after the window with a parity result', () => {
            writePackages(LARGE_RELEASE_PACKAGES);
            // Every npm view runs to its timeout, which spawnSync reports as status -1.
            npmReply = { status: -1, stdout: '', stderr: '' };
            onNpmView = timeoutMilliseconds => {
                clock += timeoutMilliseconds as number;
            };
            const start = clock;
            const report = checkWithin(600);
            // Four views of 30 seconds fill each 2-minute read. The last read
            // starts when the 600-second window runs out.
            expect(sleeps).toEqual([15_000, 30_000, 60_000, 15_000]);
            expect(clock - start).toBe(720_000);
            expect(report.npmReads).toBe(5);
            expect(npmCalls).toHaveLength(20);
            expect(report.npm).toBe('unavailable');
            expect(report.packages.map((item: any) => item.status)).toEqual(
                LARGE_RELEASE_PACKAGES.map(() => 'unavailable')
            );
        });

        it('does not wait when git parity already fails', () => {
            write(candidate, 'kits/rokt/dist/Rokt-Kit.iife.js', 'rokt iife, rebuilt');
            writeArchive();
            writeMetadata();
            npmReply = PENDING;
            const report = checkWithin(600);
            expect(report.git).toBe('fail');
            expect(npmCalls).toHaveLength(1);
            expect(sleeps).toEqual([]);
        });

        it('reads npm once without a window, as the transition path does', () => {
            npmReply = PENDING;
            const report = checkWithin(0);
            expect(npmCalls).toHaveLength(1);
            expect(sleeps).toEqual([]);
            expect(report.npm).toBe('pending');
            expect(report.npmReads).toBe(1);
            expect(parity.renderSummary(report)).toContain('- npm parity: **pending**\n');
        });

        it('refuses a window that is not a whole number of seconds or comes without --npm', () => {
            for (const value of ['-1', '1.5', '10m', '010', '60000']) {
                expect(() =>
                    parity.main(
                        ['--candidate', candidate, '--tag', TAG, '--npm', '--npm-retry-seconds', value],
                        run
                    )
                ).toThrow(/--npm-retry-seconds must be a whole number/);
            }
            expect(() =>
                parity.main(
                    ['--candidate', candidate, '--tag', TAG, '--npm-retry-seconds', '600'],
                    run
                )
            ).toThrow('--npm-retry-seconds requires --npm');
            expect(() => checkWithin(3601)).toThrow(/from 0 to 3600/);
            expect(npmCalls).toEqual([]);
        });
    });

    describe('sleep between npm reads', () => {
        it('fails when sleep cannot run, instead of reading npm again at once', () => {
            const calls: unknown[][] = [];
            const spawn = (...args: unknown[]) => {
                calls.push(args);
                return { error: new Error('spawnSync sleep ENOENT'), status: null, signal: null };
            };
            expect(() => parity.defaultSleep(15_000, spawn)).toThrow(
                'sleep 15 failed (spawnSync sleep ENOENT), so the npm parity wait stops'
            );
            expect(calls).toEqual([['sleep', ['15']]]);
        });

        it('fails when sleep exits with an error or is killed', () => {
            expect(() =>
                parity.defaultSleep(1_500, () => ({ status: 1, signal: null }))
            ).toThrow('sleep 1.5 failed (exit status 1)');
            expect(() =>
                parity.defaultSleep(1_500, () => ({ status: null, signal: 'SIGTERM' }))
            ).toThrow('sleep 1.5 failed (signal SIGTERM)');
        });

        it('returns once sleep exits 0', () => {
            expect(() =>
                parity.defaultSleep(1_500, () => ({ status: 0, signal: null }))
            ).not.toThrow();
        });
    });

    describe('command line', () => {
        it('writes the report, summary and outputs and exits 1 only when not uploadable', () => {
            const outputs = path.join(directory, 'outputs');
            const summary = path.join(directory, 'summary.md');
            const reportFile = path.join(directory, 'report.json');
            const args = [
                '--candidate',
                candidate,
                '--tag',
                TAG,
                '--npm',
                '--report',
                reportFile,
                '--summary',
                summary,
                '--github-output',
                outputs,
            ];
            const write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
            try {
                npmReply = { status: 1, stdout: '', stderr: 'E404' };
                expect(parity.main(args, run)).toBe(0);
                expect(fs.readFileSync(outputs, 'utf8')).toBe(
                    'git_parity=pass\nnpm_parity=pending\n'
                );
                expect(fs.readFileSync(summary, 'utf8')).toContain('Upload allowed: **yes**');
                expect(JSON.parse(fs.readFileSync(reportFile, 'utf8')).git).toBe('pass');

                write.mockClear();
                npmReply = {
                    status: 0,
                    stdout: JSON.stringify(contract.npmIntegrityFor(Buffer.from('other'))),
                    stderr: '',
                };
                expect(parity.main(args, run)).toBe(1);
                expect(fs.readFileSync(outputs, 'utf8')).toContain('npm_parity=fail\n');
            } finally {
                write.mockRestore();
            }
        });

        it('computes git blob IDs the way git does', () => {
            const bytes = Buffer.from('core iife');
            expect(parity.gitBlobId(bytes)).toBe(
                git('rev-parse', `${TAG}:dist/mparticle.js`)
            );
            expect(parity.repositoryPathFor('core/dist/mparticle.js')).toBe(
                'dist/mparticle.js'
            );
            expect(parity.repositoryPathFor('kits/rokt/dist/Rokt-Kit.iife.js')).toBe(
                'kits/rokt/dist/Rokt-Kit.iife.js'
            );
            expect(parity.repositoryPathFor('npm/x.tgz')).toBeNull();
        });
    });
});
