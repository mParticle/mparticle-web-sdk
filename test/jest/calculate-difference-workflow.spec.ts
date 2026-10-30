import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const yaml = require('js-yaml');

const REPO_ROOT = path.join(__dirname, '../..');
const WORKFLOW_PATH = '.github/workflows/calculate-difference.yml';

const workflow = yaml.load(
    fs.readFileSync(path.join(REPO_ROOT, WORKFLOW_PATH), 'utf8')
);
const reportDiff = workflow.jobs['calculate-diff'].steps.find(
    (step: any) => step.id === 'report-diff'
);

// Runs the Report Diff step's script the way the runner does, with the
// inputs in env, and returns its exit status and the outputs it wrote.
function runReportDiff(
    initial: string,
    updated: string
): { status: number | null; outputs: Record<string, string> } {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'calc-diff-'));
    const outputFile = path.join(directory, 'output');
    fs.writeFileSync(outputFile, '');

    try {
        const result = spawnSync(
            'bash',
            ['--noprofile', '--norc', '-eo', 'pipefail', '-c', reportDiff.run],
            {
                cwd: REPO_ROOT,
                encoding: 'utf8',
                env: {
                    ...process.env,
                    INITIAL_BUNDLE_SIZE: initial,
                    UPDATED_BUNDLE_SIZE: updated,
                    GITHUB_OUTPUT: outputFile,
                },
            }
        );
        const outputs = fs
            .readFileSync(outputFile, 'utf8')
            .split('\n')
            .filter(line => line.length > 0)
            .reduce((all, line) => {
                const [name, ...value] = line.split('=');
                return { ...all, [name]: value.join('=') };
            }, {} as Record<string, string>);

        return { status: result.status, outputs };
    } finally {
        fs.rmSync(directory, { recursive: true, force: true });
    }
}

describe('calculate-difference workflow', () => {
    it('reads its inputs from env, not from expressions in the script', () => {
        expect(reportDiff.env).toEqual({
            INITIAL_BUNDLE_SIZE: '${{ inputs.initial_bundle_size }}',
            UPDATED_BUNDLE_SIZE: '${{ inputs.updated_bundle_size }}',
        });
        expect(reportDiff.run).not.toContain('${{');
    });

    it.each([
        ['growth', '1000', '1100', '10', '10'],
        ['shrinkage', '1000', '900', '-10', '-10'],
        ['no change', '1000', '1000', '0', '0'],
        ['an exact two-decimal result', '800', '810', '1.25', '1.25'],
    ])(
        'reports %s as a percentage',
        (_, initial, updated, diff, diffPercent) => {
            expect(runReportDiff(initial, updated)).toEqual({
                status: 0,
                outputs: { diff, diff_percent: diffPercent },
            });
        }
    );

    it('floors the percentage to two decimals', () => {
        const { status, outputs } = runReportDiff('3', '4');

        expect(status).toBe(0);
        expect(Number(outputs.diff)).toBeCloseTo(33.3333, 4);
        expect(outputs.diff_percent).toBe('33.33');
    });

    it('floors a negative percentage towards negative infinity', () => {
        const { status, outputs } = runReportDiff('3', '2');

        expect(status).toBe(0);
        expect(Number(outputs.diff)).toBeCloseTo(-33.3333, 4);
        expect(outputs.diff_percent).toBe('-33.34');
    });

    it.each([
        ['a non-numeric initial size', 'abc', '100'],
        ['a non-numeric updated size', '100', 'abc'],
        ['an empty initial size', '', '100'],
        ['an empty updated size', '100', ''],
        ['a zero initial size', '0', '100'],
        ['a negative initial size', '-5', '100'],
        ['shell syntax in a size', '100; echo injected', '100'],
    ])('fails and writes no outputs for %s', (_, initial, updated) => {
        expect(runReportDiff(initial, updated)).toEqual({
            status: 1,
            outputs: {},
        });
    });
});
