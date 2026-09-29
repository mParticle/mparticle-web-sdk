/* eslint-env node, es2021 */

// Per-pod run records for multi-pod uploads and promotions. Each pod appends
// one JSON line; the summary reports which pods changed, which failed and
// which were never attempted, so an operator can re-run or roll back exactly
// those pods. Records hold only public release identity, never infrastructure
// values.

const fs: typeof import('node:fs') = require('node:fs');

export interface PointerSummary {
    version: string;
    buildId: string;
    metadataSha256: string;
}

export type ChannelStatus = 'updated' | 'unchanged' | 'planned' | 'read';

export interface ChannelTransition {
    channel: string;
    // null: the channel had no pointer. A string: the pointer was unreadable.
    before: PointerSummary | null | string;
    after: PointerSummary | null;
    status: ChannelStatus;
}

export interface UploadSummary {
    version: string;
    buildId: string;
    candidatePrefix: string;
    metadataSha256: string;
    objects: number;
    created: number;
    alreadyPresent: number;
    bytes: number;
}

export interface ProgressRecord {
    pod: string;
    operation: string;
    status: 'succeeded' | 'failed' | 'dry-run';
    transitions?: ChannelTransition[];
    upload?: UploadSummary;
    error?: string;
}

const POD_PATTERN = /^[a-z][a-z0-9]{0,15}$/;

function validatePod(pod: unknown): string {
    if (typeof pod !== 'string' || !POD_PATTERN.test(pod)) {
        throw new Error('Pod must be a short lowercase label such as qa');
    }
    return pod;
}

function appendProgressRecord(filePath: string, record: ProgressRecord): void {
    fs.appendFileSync(filePath, `${JSON.stringify(record)}\n`, { mode: 0o600 });
}

function readProgressRecords(filePath: string): ProgressRecord[] {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    return fs
        .readFileSync(filePath, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line) as ProgressRecord);
}

function describeSummary(value: PointerSummary | null | string): string {
    if (value === null) {
        return 'none';
    }
    if (typeof value === 'string') {
        return `unreadable (${value})`;
    }
    return `${value.version} build ${value.buildId} (metadata ${value.metadataSha256})`;
}

function describeTransition(transition: ChannelTransition): string {
    return `${transition.channel}: ${describeSummary(
        transition.before
    )} -> ${describeSummary(transition.after)} [${transition.status}]`;
}

function summarizeProgress(
    records: ProgressRecord[],
    plannedPods: string[]
): string {
    const lines: string[] = [];
    const changed: string[] = [];
    const failed: string[] = [];
    for (const pod of plannedPods) {
        const podRecords = records.filter(record => record.pod === pod);
        if (podRecords.length === 0) {
            lines.push(`- ${pod}: not attempted`);
            continue;
        }
        for (const record of podRecords) {
            lines.push(`- ${pod}: ${record.operation} ${record.status}`);
            if (record.upload) {
                const upload = record.upload;
                lines.push(
                    `  - candidate ${upload.candidatePrefix} metadata ${upload.metadataSha256}: ${upload.objects} objects, ${upload.created} created, ${upload.alreadyPresent} already present`
                );
            }
            for (const transition of record.transitions || []) {
                lines.push(`  - ${describeTransition(transition)}`);
            }
            if (record.error) {
                lines.push(`  - error: ${record.error}`);
            }
            if (
                (record.transitions || []).some(
                    transition => transition.status === 'updated'
                ) ||
                (record.upload && record.upload.created > 0)
            ) {
                changed.push(pod);
            }
            if (record.status === 'failed') {
                failed.push(pod);
            }
        }
    }
    const notAttempted = plannedPods.filter(
        pod => !records.some(record => record.pod === pod)
    );
    return [
        `Changed pods: ${changed.length ? changed.join(', ') : 'none'}`,
        `Failed pods: ${failed.length ? failed.join(', ') : 'none'}`,
        `Not attempted: ${
            notAttempted.length ? notAttempted.join(', ') : 'none'
        }`,
        ...lines,
        '',
    ].join('\n');
}

function main(args: string[]): number {
    let filePath: string | undefined;
    let pods: string[] = [];
    for (let index = 0; index < args.length; index++) {
        const argument = args[index];
        const value = args[++index];
        if (!value) {
            throw new Error(`${argument} requires a value`);
        }
        if (argument === '--file') {
            filePath = value;
        } else if (argument === '--pods') {
            pods = value
                .split(',')
                .filter(Boolean)
                .map(validatePod);
        } else {
            throw new Error(`Unknown argument: ${argument}`);
        }
    }
    if (!filePath || pods.length === 0) {
        throw new Error('--file and --pods are required');
    }
    const records = readProgressRecords(filePath);
    process.stdout.write(summarizeProgress(records, pods));
    return records.some(record => record.status === 'failed') ||
        pods.some(pod => !records.some(record => record.pod === pod))
        ? 1
        : 0;
}

if (require.main === module) {
    try {
        process.exitCode = main(process.argv.slice(2));
    } catch (error) {
        console.error(error instanceof Error ? error.message : 'Unknown error');
        process.exitCode = 1;
    }
}

const releaseProgress = {
    appendProgressRecord,
    describeSummary,
    describeTransition,
    main,
    readProgressRecords,
    summarizeProgress,
    validatePod,
};

module.exports = releaseProgress;

export type ReleaseProgress = typeof releaseProgress;
