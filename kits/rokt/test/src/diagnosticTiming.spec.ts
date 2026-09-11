import { describe, it, expect } from 'vitest';
import { buildPreselectDiagnosticLogEntry } from '../../src/diagnosticTiming';

describe('diagnosticTiming', () => {
    describe('buildPreselectDiagnosticLogEntry', () => {
        it('reports fired with the given reason', () => {
            const entry = buildPreselectDiagnosticLogEntry('fired', 'fired');

            expect(entry.code).toBe('PRESELECT_FIRED');
            expect(entry.message).toBe(
                'Rokt Kit: preselect fired [reason=fired]'
            );
        });

        it('reports missed with a missing-attribute reason', () => {
            const entry = buildPreselectDiagnosticLogEntry(
                'missed',
                'missing_attribute:email'
            );

            expect(entry.code).toBe('PRESELECT_MISSED');
            expect(entry.message).toContain('reason=missing_attribute:email');
        });

        it('reports queued and skipped outcomes', () => {
            expect(
                buildPreselectDiagnosticLogEntry('queued', 'not_ready').code
            ).toBe('PRESELECT_QUEUED');
            expect(
                buildPreselectDiagnosticLogEntry(
                    'skipped',
                    'active_preselection'
                ).code
            ).toBe('PRESELECT_SKIPPED');
        });
    });
});
