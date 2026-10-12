/* eslint-env node, es2021 */

// Shadow-mode parity between a V3 candidate and what the current release
// process ships. It never changes anything and never fails a release; the
// shadow workflow reports its result and uploads only a candidate that
// matches.
//
// Git parity, against the release tag (the tag commit is the one
// semantic-release made, with the generated bundles committed):
//   core/<path>  must equal  <path>      (core/dist/mparticle.js -> dist/mparticle.js)
//   kits/<path>  must equal  kits/<path> (the kit's committed dist/)
// Every candidate bundle must be a regular file at the tag with identical
// bytes (compared by git blob ID), and every .js or .js.map file committed in
// dist/ and in each candidate kit's dist/ must be in the candidate.
// cdn-bundles.tgz must contain exactly the candidate's core/ and kits/ files.
// The tag must resolve to metadata.sourceSha and carry metadata.version.
//
// npm parity: each package's tarball SRI (metadata npmIntegrity, which the
// uploader checks against the tarball bytes) must equal
// `npm view <name>@<version> dist.integrity`. A version npm does not have yet
// is "pending", not a failure.
//
// node --experimental-strip-types scripts/v3-release/check-release-parity.ts \
//     --candidate <dir> --tag vX.Y.Z [--npm] [--report <file>] \
//     [--summary <file>] [--github-output <file>]

type CandidateMetadata = import('./release-contract').CandidateMetadata;
type ReleaseContract = import('./release-contract').ReleaseContract;

const childProcess: typeof import('node:child_process') = require('node:child_process');
const nodeCrypto: typeof import('node:crypto') = require('node:crypto');
const fs: typeof import('node:fs') = require('node:fs');
const path: typeof import('node:path') = require('node:path');
const contract: ReleaseContract = require('./release-contract.ts');

export type ParityStatus = 'pass' | 'fail' | 'pending' | 'unavailable';

export interface GitFileResult {
    candidatePath: string;
    repositoryPath: string;
    status: 'match' | 'differs' | 'missing' | 'unexpected';
}

export interface NpmPackageResult {
    name: string;
    version: string;
    expected: string;
    published: string | null;
    status: 'match' | 'differs' | 'pending' | 'unavailable';
}

export interface ParityReport {
    version: string;
    buildId: string;
    tag: string;
    git: ParityStatus;
    npm: ParityStatus;
    problems: string[];
    files: GitFileResult[];
    packages: NpmPackageResult[];
}

export type CommandRunner = (
    command: string,
    args: string[],
    encoding: 'utf8' | 'buffer'
) => { status: number; stdout: string | Buffer; stderr: string };

export interface ParityOptions {
    candidate: string;
    tag: string;
    npm: boolean;
    run?: CommandRunner;
}

const TAG_PATTERN = /^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const BUNDLE_PATTERN = /\.js(?:\.map)?$/;
const MAX_OUTPUT_BYTES = 256 * 1024 * 1024;
// A registry reply is short; anything else is treated as unavailable.
const NPM_INTEGRITY_PATTERN = /^sha512-[A-Za-z0-9+/]{86}==$/;

function defaultRun(
    command: string,
    args: string[],
    encoding: 'utf8' | 'buffer'
): { status: number; stdout: string | Buffer; stderr: string } {
    const result = childProcess.spawnSync(command, args, {
        encoding: encoding === 'utf8' ? 'utf8' : 'buffer',
        maxBuffer: MAX_OUTPUT_BYTES,
        timeout: 5 * 60 * 1000,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    });
    return {
        status: result.error ? -1 : result.status === null ? -1 : result.status,
        stdout: result.stdout,
        stderr: String(result.stderr || ''),
    };
}

// The object ID git would assign these bytes as a blob (SHA-1 repositories).
function gitBlobId(bytes: Buffer): string {
    return nodeCrypto
        .createHash('sha1')
        .update(`blob ${bytes.length}\0`)
        .update(bytes)
        .digest('hex');
}

function repositoryPathFor(candidatePath: string): string | null {
    if (candidatePath.startsWith('core/')) {
        return candidatePath.slice('core/'.length);
    }
    if (candidatePath.startsWith('kits/')) {
        return candidatePath;
    }
    return null;
}

// kits/rokt/dist/Rokt-Kit.iife.js -> kits/rokt/dist/
function kitDistDirectory(candidatePath: string): string {
    return candidatePath.slice(
        0,
        candidatePath.lastIndexOf('/dist/') + '/dist/'.length
    );
}

interface TreeEntry {
    mode: string;
    type: string;
    id: string;
}

function readTree(
    run: CommandRunner,
    tag: string,
    directories: string[]
): Map<string, TreeEntry> {
    const result = run(
        'git',
        ['ls-tree', '-r', '-z', '--full-tree', tag, '--', ...directories],
        'utf8'
    );
    if (result.status !== 0) {
        throw new Error(`git ls-tree failed for ${tag}`);
    }
    const entries = new Map<string, TreeEntry>();
    for (const record of String(result.stdout).split('\0')) {
        const tab = record.indexOf('\t');
        if (tab === -1) {
            continue;
        }
        const [mode, type, id] = record.slice(0, tab).split(' ');
        entries.set(record.slice(tab + 1), { mode, type, id });
    }
    return entries;
}

function gitText(run: CommandRunner, args: string[]): string {
    const result = run('git', args, 'utf8');
    if (result.status !== 0) {
        throw new Error(`git ${args[0]} failed`);
    }
    return String(result.stdout).trim();
}

function checkGit(
    run: CommandRunner,
    candidate: string,
    metadata: CandidateMetadata,
    tag: string,
    problems: string[]
): GitFileResult[] {
    if (gitText(run, ['rev-parse', '--show-object-format']) !== 'sha1') {
        throw new Error('Only SHA-1 repositories are supported');
    }
    const tagSha = gitText(run, ['rev-parse', '--verify', `${tag}^{commit}`]);
    if (tagSha !== metadata.sourceSha) {
        problems.push(
            `${tag} is ${tagSha}, but the candidate was packaged from ${metadata.sourceSha}`
        );
    }
    const packageJson = JSON.parse(
        gitText(run, ['show', `${tag}:package.json`])
    );
    if (packageJson.version !== metadata.version) {
        problems.push(
            `package.json at ${tag} is ${packageJson.version}, but the candidate is ${metadata.version}`
        );
    }

    const bundles = metadata.files
        .map(file => file.path)
        .filter(filePath => repositoryPathFor(filePath) !== null);
    const kitDirectories = Array.from(
        new Set(
            bundles
                .filter(filePath => filePath.startsWith('kits/'))
                .map(kitDistDirectory)
        )
    ).sort(contract.compareStrings);
    const tree = readTree(run, tag, ['dist', ...kitDirectories]);

    const results: GitFileResult[] = [];
    for (const candidatePath of bundles) {
        const repositoryPath = repositoryPathFor(candidatePath) as string;
        const entry = tree.get(repositoryPath);
        let status: GitFileResult['status'];
        if (
            !entry ||
            entry.type !== 'blob' ||
            (entry.mode !== '100644' && entry.mode !== '100755')
        ) {
            status = 'missing';
        } else {
            const bytes = fs.readFileSync(path.join(candidate, candidatePath));
            status = gitBlobId(bytes) === entry.id ? 'match' : 'differs';
        }
        results.push({ candidatePath, repositoryPath, status });
    }

    const listed = new Set(
        bundles.map(filePath => repositoryPathFor(filePath))
    );
    tree.forEach((_entry, repositoryPath) => {
        const committedBundle =
            BUNDLE_PATTERN.test(repositoryPath) &&
            (/^dist\/[^/]+$/.test(repositoryPath) ||
                kitDirectories.some(
                    directory =>
                        repositoryPath.startsWith(directory) &&
                        !repositoryPath.slice(directory.length).includes('/')
                ));
        if (committedBundle && !listed.has(repositoryPath)) {
            results.push({
                candidatePath: repositoryPath.startsWith('kits/')
                    ? repositoryPath
                    : `core/${repositoryPath}`,
                repositoryPath,
                status: 'unexpected',
            });
        }
    });
    return results.sort((left, right) =>
        contract.compareStrings(left.candidatePath, right.candidatePath)
    );
}

function checkCdnArchive(
    run: CommandRunner,
    candidate: string,
    metadata: CandidateMetadata,
    problems: string[]
): void {
    const archive = path.join(candidate, 'cdn-bundles.tgz');
    if (!metadata.files.some(file => file.path === 'cdn-bundles.tgz')) {
        problems.push('The candidate has no cdn-bundles.tgz');
        return;
    }
    const listing = run('tar', ['-tvzf', archive], 'utf8');
    const names = run('tar', ['-tzf', archive], 'utf8');
    if (listing.status !== 0 || names.status !== 0) {
        problems.push('cdn-bundles.tgz cannot be listed');
        return;
    }
    const members = String(names.stdout)
        .split('\n')
        .filter(Boolean);
    const types = String(listing.stdout)
        .split('\n')
        .filter(Boolean)
        .map(line => line[0]);
    if (types.some(type => type !== '-' && type !== 'd')) {
        problems.push('cdn-bundles.tgz holds an entry that is not a file');
        return;
    }
    const archived = members
        .filter(member => !member.endsWith('/'))
        .sort(contract.compareStrings);
    const expected = metadata.files
        .map(file => file.path)
        .filter(filePath => /^(?:core|kits)\//.test(filePath))
        .sort(contract.compareStrings);
    if (JSON.stringify(archived) !== JSON.stringify(expected)) {
        problems.push(
            'cdn-bundles.tgz does not hold exactly the candidate core/ and kits/ files'
        );
        return;
    }
    for (const member of archived) {
        const extracted = run('tar', ['-xOzf', archive, member], 'buffer');
        const staged = fs.readFileSync(path.join(candidate, member));
        if (
            extracted.status !== 0 ||
            !Buffer.from(extracted.stdout as Buffer).equals(staged)
        ) {
            problems.push(`cdn-bundles.tgz member differs: ${member}`);
        }
    }
}

function checkNpm(
    run: CommandRunner,
    metadata: CandidateMetadata
): NpmPackageResult[] {
    return metadata.packages.map(item => {
        const result = run(
            'npm',
            [
                'view',
                `${item.name}@${metadata.version}`,
                'dist.integrity',
                '--json',
                '--registry',
                'https://registry.npmjs.org/',
            ],
            'utf8'
        );
        const base = {
            name: item.name,
            version: metadata.version,
            expected: item.npmIntegrity,
        };
        if (result.status !== 0) {
            const notPublished = /\bE404\b/.test(
                `${result.stderr}${String(result.stdout)}`
            );
            return {
                ...base,
                published: null,
                status: notPublished ? 'pending' : 'unavailable',
            };
        }
        let published: unknown = null;
        try {
            published = JSON.parse(String(result.stdout) || 'null');
        } catch {
            published = null;
        }
        if (
            typeof published !== 'string' ||
            !NPM_INTEGRITY_PATTERN.test(published)
        ) {
            // npm prints nothing for a version it has never seen.
            return {
                ...base,
                published: null,
                status: published === null ? 'pending' : 'unavailable',
            };
        }
        return {
            ...base,
            published,
            status: published === item.npmIntegrity ? 'match' : 'differs',
        };
    });
}

function overallNpm(packages: NpmPackageResult[]): ParityStatus {
    if (packages.some(item => item.status === 'differs')) {
        return 'fail';
    }
    if (packages.some(item => item.status === 'unavailable')) {
        return 'unavailable';
    }
    if (packages.some(item => item.status === 'pending')) {
        return 'pending';
    }
    return 'pass';
}

function checkParity(options: ParityOptions): ParityReport {
    if (!TAG_PATTERN.test(options.tag)) {
        throw new Error('--tag must be a stable vX.Y.Z tag');
    }
    const run = options.run || defaultRun;
    const metadata = contract.parseMetadata(
        fs.readFileSync(
            path.join(options.candidate, contract.METADATA_FILE_NAME)
        )
    );
    if (`v${metadata.version}` !== options.tag) {
        throw new Error(
            `The candidate is ${metadata.version}, not the release ${options.tag}`
        );
    }
    const problems: string[] = [];
    const files = checkGit(
        run,
        options.candidate,
        metadata,
        options.tag,
        problems
    );
    checkCdnArchive(run, options.candidate, metadata, problems);
    for (const file of files) {
        if (file.status !== 'match') {
            problems.push(
                `${file.candidatePath} (${file.repositoryPath} at ${options.tag}): ${file.status}`
            );
        }
    }
    const packages = options.npm ? checkNpm(run, metadata) : [];
    return {
        version: metadata.version,
        buildId: metadata.buildId,
        tag: options.tag,
        git: problems.length === 0 ? 'pass' : 'fail',
        npm: options.npm ? overallNpm(packages) : 'pending',
        problems,
        files,
        packages,
    };
}

// Upload is safe when the bundles are the committed release bundles and no
// published npm tarball contradicts the candidate.
function isUploadable(report: ParityReport): boolean {
    return report.git === 'pass' && report.npm !== 'fail';
}

function renderSummary(report: ParityReport): string {
    const matched = report.files.filter(file => file.status === 'match').length;
    const lines = [
        `### V3 shadow parity: ${report.version} build ${report.buildId}`,
        '',
        `- Git parity against \`${report.tag}\`: **${report.git}** (${matched}/${report.files.length} bundles identical)`,
        `- npm parity: **${report.npm}**`,
        `- Upload allowed: **${isUploadable(report) ? 'yes' : 'no'}**`,
        '',
        'Candidate `core/<path>` is compared with `<path>` at the tag, and `kits/<path>` with the same path.',
        '',
    ];
    if (report.problems.length) {
        lines.push('#### Problems', '');
        for (const problem of report.problems) {
            lines.push(`- ${problem}`);
        }
        lines.push('');
    }
    if (report.packages.length) {
        lines.push('| Package | Status |', '| --- | --- |');
        for (const item of report.packages) {
            lines.push(`| \`${item.name}@${item.version}\` | ${item.status} |`);
        }
        lines.push('');
    }
    return `${lines.join('\n')}\n`;
}

function parseArguments(
    args: string[]
): ParityOptions & {
    report?: string;
    summary?: string;
    githubOutput?: string;
} {
    const options: ParityOptions & {
        report?: string;
        summary?: string;
        githubOutput?: string;
    } = { candidate: '', tag: '', npm: false };
    for (let index = 0; index < args.length; index++) {
        const argument = args[index];
        if (argument === '--npm') {
            options.npm = true;
            continue;
        }
        const value = args[++index];
        if (!value) {
            throw new Error(`${argument} requires a value`);
        }
        if (argument === '--candidate') {
            options.candidate = value;
        } else if (argument === '--tag') {
            options.tag = value;
        } else if (argument === '--report') {
            options.report = value;
        } else if (argument === '--summary') {
            options.summary = value;
        } else if (argument === '--github-output') {
            options.githubOutput = value;
        } else {
            throw new Error(`Unknown argument: ${argument}`);
        }
    }
    if (!options.candidate || !options.tag) {
        throw new Error('--candidate and --tag are required');
    }
    return options;
}

function main(args: string[], run?: CommandRunner): number {
    const options = parseArguments(args);
    const report = checkParity({ ...options, run });
    const summary = renderSummary(report);
    process.stdout.write(summary);
    if (options.report) {
        fs.writeFileSync(
            options.report,
            `${JSON.stringify(report, null, 4)}\n`
        );
    }
    if (options.summary) {
        fs.appendFileSync(options.summary, summary);
    }
    if (options.githubOutput) {
        fs.appendFileSync(
            options.githubOutput,
            `git_parity=${report.git}\nnpm_parity=${report.npm}\n`
        );
    }
    return isUploadable(report) ? 0 : 1;
}

if (require.main === module) {
    try {
        process.exitCode = main(process.argv.slice(2));
    } catch (error) {
        console.error(
            error instanceof Error ? error.message : 'Unknown parity error'
        );
        process.exitCode = 1;
    }
}

const releaseParity = {
    checkParity,
    gitBlobId,
    isUploadable,
    main,
    renderSummary,
    repositoryPathFor,
};

module.exports = releaseParity;

export type ReleaseParity = typeof releaseParity;
