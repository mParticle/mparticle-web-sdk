// Builds diagnostic log entries for preselect outcomes. Attribute names
// only — never values — since this ships over the network logging
// pipeline and payloads can carry customer PII.

export interface DiagnosticLogEntry {
  message: string;
  code: string;
}

export type PreselectDiagnosticOutcome = 'fired' | 'missed' | 'queued' | 'skipped';

export function buildPreselectDiagnosticLogEntry(
  outcome: PreselectDiagnosticOutcome,
  reason: string,
): DiagnosticLogEntry {
  const code: Record<PreselectDiagnosticOutcome, string> = {
    fired: 'PRESELECT_FIRED',
    missed: 'PRESELECT_MISSED',
    queued: 'PRESELECT_QUEUED',
    skipped: 'PRESELECT_SKIPPED',
  };
  return {
    message: `Rokt Kit: preselect ${outcome} [reason=${reason}]`,
    code: code[outcome],
  };
}
