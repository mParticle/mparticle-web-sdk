import * as fs from 'fs';
import * as path from 'path';
import { makeTempDirectory } from './v3-release/helpers';

const progress = require('../../scripts/v3-release/release-progress.ts');

const BEFORE = { version: '3.4.1', buildId: '100-1', metadataSha256: 'a'.repeat(64) };
const AFTER = { version: '3.5.0', buildId: '200-1', metadataSha256: 'b'.repeat(64) };

describe('V3 release progress', () => {
    let directory: string;
    let progressFile: string;

    beforeEach(() => {
        directory = makeTempDirectory('v3-release-progress-');
        progressFile = path.join(directory, 'progress.jsonl');
    });

    afterEach(() => {
        fs.rmSync(directory, { recursive: true, force: true });
    });

    it('reports changed, failed and not-attempted pods for a partial promotion', () => {
        progress.appendProgressRecord(progressFile, {
            pod: 'qa',
            operation: 'promote-ga',
            status: 'succeeded',
            transitions: [
                { channel: 'v3-release-order-a', before: BEFORE, after: AFTER, status: 'updated' },
                { channel: 'ga', before: AFTER, after: AFTER, status: 'unchanged' },
            ],
        });
        progress.appendProgressRecord(progressFile, {
            pod: 'us1',
            operation: 'promote-ga',
            status: 'failed',
            transitions: [
                { channel: 'v3-release-order-a', before: null, after: AFTER, status: 'updated' },
            ],
            error: 'putIfMatch web-sdk/v3/channels/v3-release-order-b/active-release.json failed (PreconditionFailed)',
        });

        const summary = progress.summarizeProgress(
            progress.readProgressRecords(progressFile),
            ['qa', 'us1', 'us2']
        );
        expect(summary).toContain('Changed pods: qa, us1');
        expect(summary).toContain('Failed pods: us1');
        expect(summary).toContain('Not attempted: us2');
        expect(summary).toContain(
            `v3-release-order-a: 3.4.1 build 100-1 (metadata ${'a'.repeat(64)}) -> 3.5.0 build 200-1`
        );
        expect(summary).toContain('v3-release-order-a: none -> 3.5.0 build 200-1');
        expect(summary).toContain('- us2: not attempted');
    });

    it('exits non-zero unless every planned pod succeeded', () => {
        const write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
        try {
            progress.appendProgressRecord(progressFile, {
                pod: 'qa',
                operation: 'upload',
                status: 'succeeded',
            });
            expect(progress.main(['--file', progressFile, '--pods', 'qa'])).toBe(0);
            expect(progress.main(['--file', progressFile, '--pods', 'qa,us1'])).toBe(1);
            progress.appendProgressRecord(progressFile, {
                pod: 'us1',
                operation: 'upload',
                status: 'failed',
            });
            expect(progress.main(['--file', progressFile, '--pods', 'qa,us1'])).toBe(1);
        } finally {
            write.mockRestore();
        }
    });

    it('lists each pod once when it has several records', () => {
        for (const operation of ['upload', 'promote']) {
            progress.appendProgressRecord(progressFile, {
                pod: 'qa',
                operation,
                status: 'failed',
                transitions: [
                    { channel: 'v3-staging', before: BEFORE, after: AFTER, status: 'updated' },
                ],
            });
        }
        const summary = progress.summarizeProgress(
            progress.readProgressRecords(progressFile),
            ['qa']
        );
        expect(summary).toContain('Changed pods: qa\n');
        expect(summary).toContain('Failed pods: qa\n');
    });

    it('ignores failures of pods outside the selection', () => {
        const write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
        try {
            progress.appendProgressRecord(progressFile, { pod: 'qa', operation: 'upload', status: 'succeeded' });
            progress.appendProgressRecord(progressFile, { pod: 'us1', operation: 'upload', status: 'failed' });
            expect(progress.main(['--file', progressFile, '--pods', 'qa'])).toBe(0);
            expect(write.mock.calls.join('')).toContain('Failed pods: none');
            expect(progress.main(['--file', progressFile, '--pods', 'qa,us1'])).toBe(1);
        } finally {
            write.mockRestore();
        }
    });

    it('reports planned object counts for a dry-run upload', () => {
        progress.appendProgressRecord(progressFile, {
            pod: 'qa',
            operation: 'upload',
            status: 'dry-run',
            upload: {
                version: '3.5.0',
                buildId: '200-1',
                candidatePrefix: 'web-sdk/v3/candidates/3.5.0/200-1/',
                metadataSha256: 'b'.repeat(64),
                objects: 19,
                created: 0,
                alreadyPresent: 0,
                bytes: 100,
            },
        });
        const summary = progress.summarizeProgress(
            progress.readProgressRecords(progressFile),
            ['qa']
        );
        expect(summary).toContain(': 19 objects planned');
        expect(summary).not.toContain('already present');
    });

    it('rejects malformed pod labels', () => {
        expect(() => progress.validatePod('US1')).toThrow();
        expect(() => progress.validatePod('us1;rm')).toThrow();
        expect(progress.validatePod('st1')).toBe('st1');
    });
});
