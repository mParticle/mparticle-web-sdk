import {spawnSync} from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const {
    appendGitHubOutputs,
    changedPathsFromGit,
    loadMatrix,
    parseNameStatus,
    selectKitMatrix,
    validateCommitSha,
    validateMatrix,
} = require('../../scripts/select-kit-tests');

const temporaryGitDirectories: string[] = [];
const gitAuthorEnvironment = {
    GIT_AUTHOR_EMAIL: 'kit-selector@example.com',
    GIT_AUTHOR_NAME: 'Kit Selector Tests',
    GIT_COMMITTER_EMAIL: 'kit-selector@example.com',
    GIT_COMMITTER_NAME: 'Kit Selector Tests',
};

function runGit(repository: string, args: string[]): string {
    const result = spawnSync('git', args, {
        cwd: repository,
        encoding: 'utf8',
        env: {...process.env, ...gitAuthorEnvironment},
    });
    if (result.status !== 0) {
        throw new Error(
            `git ${args.join(' ')} failed: ${result.stderr || result.stdout}`
        );
    }
    return result.stdout.trim();
}

function commit(repository: string, message: string): string {
    runGit(repository, ['add', '--all']);
    runGit(repository, [
        '-c',
        'user.name=Kit Selector Tests',
        '-c',
        'user.email=kit-selector@example.com',
        '-c',
        'commit.gpgsign=false',
        'commit',
        '--quiet',
        '-m',
        message,
    ]);
    return runGit(repository, ['rev-parse', 'HEAD']);
}

function createGitRepository(): {directory: string; initialSha: string} {
    const directory = fs.mkdtempSync(
        path.join(os.tmpdir(), 'kit-selector-git-')
    );
    temporaryGitDirectories.push(directory);
    runGit(directory, ['init', '--quiet']);
    fs.writeFileSync(path.join(directory, 'initial.txt'), 'initial\n');
    return {directory, initialSha: commit(directory, 'initial commit')};
}

afterEach(() => {
    while (temporaryGitDirectories.length > 0) {
        fs.rmSync(temporaryGitDirectories.pop() as string, {
            force: true,
            recursive: true,
        });
    }
});

const matrix = [
    {name: 'Rokt Pay Plus', local_path: 'kits/roktpayplus'},
    {name: 'Google Analytics 4', local_path: 'kits/google-analytics-4'},
    {name: 'Adobe Target', local_path: 'kits/adobe-target'},
    {name: 'Rokt', local_path: 'kits/rokt'},
    {name: 'Adobe', local_path: 'kits/adobe'},
];

function selectedPaths(changedPaths: string[]): string[] {
    return selectKitMatrix(matrix, changedPaths).matrix.map(
        (entry: {local_path: string}) => entry.local_path
    );
}

describe('select kit tests', () => {
    it('wires validated event SHAs and stable result handling into PR CI', () => {
        const workflow = fs.readFileSync(
            path.join(__dirname, '../../.github/workflows/pull-request.yml'),
            'utf8'
        );

        expect(workflow).toContain('fetch-depth: 0');
        expect(workflow).toContain(
            'BASE_SHA: ${{ github.event.pull_request.base.sha }}'
        );
        expect(workflow).toContain(
            'HEAD_SHA: ${{ github.event.pull_request.head.sha }}'
        );
        expect(workflow).toContain('run: node scripts/select-kit-tests.js');
        expect(workflow).toContain('name: Kit Tests Result');
        expect(workflow).toContain('name: Report no kit tests needed');
        expect(workflow).toMatch(
            /- uses: actions\/checkout@v6[ \t]*\n[ \t]*if: \$\{\{ ! matrix\.kit\.noop \}\}/
        );
        expect(workflow).toMatch(
            /- uses: actions\/setup-node@v6[ \t]*\n[ \t]*if: \$\{\{ ! matrix\.kit\.noop \}\}/
        );
        expect(workflow).toContain(
            "if: needs.load-kit-matrix.outputs.rokt_coverage == 'true'"
        );
        expect(workflow).not.toMatch(/git diff.*\${{/);
    });

    it('keeps Rokt and Rokt Pay Plus separate', () => {
        const rokt = selectKitMatrix(matrix, ['kits/rokt/src/Rokt-Kit.ts']);
        expect(rokt.matrix.map((entry: {name: string}) => entry.name)).toEqual([
            'Rokt',
        ]);
        expect(rokt.roktCoverage).toBe(true);

        const payPlus = selectKitMatrix(matrix, [
            'kits/roktpayplus/src/RoktPayPlusKit.ts',
        ]);
        expect(
            payPlus.matrix.map((entry: {name: string}) => entry.name)
        ).toEqual(['Rokt Pay Plus']);
        expect(payPlus.roktCoverage).toBe(false);
    });

    it.each([
        ['Adobe', 'kits/adobe/packages/AdobeClient/src/index.ts', 'kits/adobe'],
        [
            'Google Analytics 4',
            'kits/google-analytics-4/src/index.js',
            'kits/google-analytics-4',
        ],
    ])('selects the %s umbrella entry', (_name, changedPath, expectedPath) => {
        expect(selectedPaths([changedPath])).toEqual([expectedPath]);
    });

    it('selects multiple kits in deterministic matrix order', () => {
        expect(
            selectedPaths([
                'kits/roktpayplus/src/index.ts',
                'kits/adobe/src/index.ts',
                'kits/roktpayplus/src/index.ts',
            ])
        ).toEqual(['kits/adobe', 'kits/roktpayplus']);
    });

    it('uses a no-op sentinel for documentation-only changes', () => {
        const selection = selectKitMatrix(matrix, [
            'README.md',
            'docs/kit-testing.md',
        ]);

        expect(selection).toMatchObject({
            fullMatrix: false,
            fullMatrixReason: null,
            kitTestsNeeded: false,
            roktCoverage: false,
        });
        expect(selection.matrix).toEqual([
            {
                name: 'No kit tests required',
                local_path: '',
                noop: true,
            },
        ]);
    });

    it('runs the full matrix for unknown kit paths', () => {
        const selection = selectKitMatrix(matrix, [
            'kits/new-kit/src/index.ts',
        ]);

        expect(selection.fullMatrix).toBe(true);
        expect(selection.fullMatrixReason).toContain('unknown kit path');
        expect(selection.roktCoverage).toBe(true);
        expect(selection.matrix).toHaveLength(matrix.length);
    });

    it.each([
        'src/events.js',
        'test/jest/events.spec.ts',
        'rollup.config.js',
        'scripts/release.sh',
        'package.json',
        'package-lock.json',
        'kits/matrix.json',
        'scripts/select-kit-tests.js',
        '.github/workflows/pull-request.yml',
    ])('runs the full matrix for shared-impact path %s', changedPath => {
        const selection = selectKitMatrix(matrix, [changedPath]);

        expect(selection.fullMatrix).toBe(true);
        expect(selection.matrix).toHaveLength(matrix.length);
        expect(selection.roktCoverage).toBe(true);
    });

    it('lets a global-impact path override kit-specific paths', () => {
        const selection = selectKitMatrix(matrix, [
            'kits/adobe/src/index.ts',
            'src/events.js',
        ]);

        expect(selection.fullMatrix).toBe(true);
        expect(selection.matrix).toHaveLength(matrix.length);
    });

    it('accounts for both sides of renames and for deletions', () => {
        expect(
            parseNameStatus(
                'R100\0kits/rokt/src/old.ts\0docs/old-rokt.md\0' +
                    'D\0kits/adobe/src/deleted.ts\0'
            )
        ).toEqual([
            'kits/rokt/src/old.ts',
            'docs/old-rokt.md',
            'kits/adobe/src/deleted.ts',
        ]);
    });

    it('rejects malformed matrix JSON', () => {
        const tempDirectory = fs.mkdtempSync(
            path.join(os.tmpdir(), 'kit-matrix-test-')
        );
        const matrixPath = path.join(tempDirectory, 'matrix.json');

        try {
            fs.writeFileSync(matrixPath, '{not-json');
            expect(() => loadMatrix(matrixPath)).toThrow(
                'Unable to load kits/matrix.json'
            );
        } finally {
            fs.rmSync(tempDirectory, {force: true, recursive: true});
        }
    });

    it('rejects duplicate names and paths', () => {
        expect(() =>
            validateMatrix([
                {name: 'Rokt', local_path: 'kits/rokt'},
                {name: 'Rokt', local_path: 'kits/other'},
            ])
        ).toThrow('Duplicate kit name');
        expect(() =>
            validateMatrix([
                {name: 'Rokt', local_path: 'kits/rokt'},
                {name: 'Other', local_path: 'kits/rokt'},
            ])
        ).toThrow('Duplicate kit local_path');
    });

    it.each([
        [
            {name: 'Parent', local_path: 'kits/example'},
            {name: 'Child', local_path: 'kits/example/child'},
        ],
        [
            {name: 'Child', local_path: 'kits/example/child'},
            {name: 'Parent', local_path: 'kits/example'},
        ],
    ])(
        'rejects overlapping matrix paths regardless of input order',
        (first, second) => {
            expect(() => validateMatrix([first, second])).toThrow(
                'Overlapping kit local_path entries: kits/example and kits/example/child'
            );
        }
    );

    it('rejects traversal in matrix and changed paths', () => {
        for (const localPath of [
            'kits/../src',
            'kits/..',
            'kits/rokt/..',
        ]) {
            expect(() =>
                validateMatrix([{name: 'Escape', local_path: localPath}])
            ).toThrow('Invalid repository path');
        }
        for (const changedPath of [
            '../package.json',
            'kits/..',
            'kits/rokt/..',
        ]) {
            expect(() => selectKitMatrix(matrix, [changedPath])).toThrow(
                'Invalid repository path'
            );
        }
    });

    it('rejects non-exact or option-like Git revisions', () => {
        expect(() => validateCommitSha('main', 'BASE_SHA')).toThrow(
            'must be a full 40- or 64-character Git SHA'
        );
        expect(() => validateCommitSha('--help', 'HEAD_SHA')).toThrow(
            'must be a full 40- or 64-character Git SHA'
        );
    });

    it('encodes all GitHub output values and multiline reasons', () => {
        const outputDirectory = fs.mkdtempSync(
            path.join(os.tmpdir(), 'kit-selector-output-')
        );
        const outputPath = path.join(outputDirectory, 'github-output');

        try {
            appendGitHubOutputs(outputPath, {
                matrix: [
                    {
                        name: 'Rokt',
                        local_path: 'kits/rokt',
                        noop: false,
                    },
                ],
                fullMatrix: true,
                fullMatrixReason: 'first line\nsecond line',
                kitTestsNeeded: true,
                roktCoverage: true,
            });
            const output = fs.readFileSync(outputPath, 'utf8');

            expect(output).toContain(
                'matrix=[{"name":"Rokt","local_path":"kits/rokt","noop":false}]\n'
            );
            expect(output).toContain('full_matrix=true\n');
            expect(output).toContain('kit_tests_needed=true\n');
            expect(output).toContain('rokt_coverage=true\n');
            expect(output).toMatch(
                /full_matrix_reason<<(kit-matrix-[a-f0-9]{32})\nfirst line\nsecond line\n\1\n/
            );
        } finally {
            fs.rmSync(outputDirectory, {force: true, recursive: true});
        }
    });
});

describe('changed paths from real Git repositories', () => {
    it('returns normal feature changes', () => {
        const {directory, initialSha} = createGitRepository();
        fs.writeFileSync(path.join(directory, 'feature.txt'), 'feature\n');
        const headSha = commit(directory, 'add feature');

        expect(changedPathsFromGit(initialSha, headSha, directory)).toEqual([
            'feature.txt',
        ]);
    });

    it('returns deleted paths', () => {
        const {directory} = createGitRepository();
        fs.writeFileSync(path.join(directory, 'deleted.txt'), 'delete me\n');
        const baseSha = commit(directory, 'add file to delete');
        fs.unlinkSync(path.join(directory, 'deleted.txt'));
        const headSha = commit(directory, 'delete file');

        expect(changedPathsFromGit(baseSha, headSha, directory)).toEqual([
            'deleted.txt',
        ]);
    });

    it('returns both old and new paths for renames', () => {
        const {directory} = createGitRepository();
        fs.writeFileSync(path.join(directory, 'old-name.txt'), 'rename me\n');
        const baseSha = commit(directory, 'add file to rename');
        fs.renameSync(
            path.join(directory, 'old-name.txt'),
            path.join(directory, 'new-name.txt')
        );
        const headSha = commit(directory, 'rename file');

        expect(changedPathsFromGit(baseSha, headSha, directory)).toEqual([
            'old-name.txt',
            'new-name.txt',
        ]);
    });

    it('excludes target-only changes when the target branch is ahead', () => {
        const {directory, initialSha} = createGitRepository();
        runGit(directory, ['checkout', '--quiet', '-b', 'feature', initialSha]);
        fs.writeFileSync(path.join(directory, 'feature.txt'), 'feature\n');
        const featureSha = commit(directory, 'feature change');

        runGit(directory, ['checkout', '--quiet', '-b', 'target', initialSha]);
        fs.writeFileSync(path.join(directory, 'target.txt'), 'target\n');
        const targetSha = commit(directory, 'target change');

        expect(changedPathsFromGit(targetSha, featureSha, directory)).toEqual([
            'feature.txt',
        ]);
    });
});
