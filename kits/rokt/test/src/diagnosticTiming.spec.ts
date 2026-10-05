import { describe, it, expect } from 'vitest';
import { buildPreselectDiagnosticLogEntry } from '../../src/diagnosticTiming';

describe('diagnosticTiming', () => {
    it.each([
        { outcome: 'fired', expectedCode: 'PRESELECT_FIRED' },
        { outcome: 'missed', expectedCode: 'PRESELECT_MISSED' },
        { outcome: 'queued', expectedCode: 'PRESELECT_QUEUED' },
        { outcome: 'skipped', expectedCode: 'PRESELECT_SKIPPED' },
    ] as const)(
        'builds code and message for $outcome',
        ({ outcome, expectedCode }) => {
            const reason = 'unit-test-reason';
            expect(buildPreselectDiagnosticLogEntry(outcome, reason)).toEqual({
                code: expectedCode,
                message: `Rokt Kit: preselect ${outcome} [reason=${reason}]`,
            });
        }
    );
});
