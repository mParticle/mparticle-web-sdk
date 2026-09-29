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

describe('V3 shadow release parity', () => {
    let directory: string;
    let repository: string;
    let candidate: string;
    let tagSha: string;
    let npmReply: NpmReply;
    let npmCalls: string[][];

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
    function run(command: string, args: string[], encoding: 'utf8' | 'buffer') {
        if (command === 'npm') {
            npmCalls.push(args);
            return npmReply;
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

    function writeMetadata(sourceSha = tagSha) {
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
            packages: [
                {
                    name: PACKAGE,
                    path: TARBALL,
                    npmIntegrity: contract.npmIntegrityFor(
                        fs.readFileSync(path.join(candidate, TARBALL))
                    ),
                },
            ],
            files,
        };
        fs.writeFileSync(
            path.join(candidate, 'metadata.json'),
            contract.serializeCanonical(metadata)
        );
        return metadata;
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
        npmCalls = [];
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
