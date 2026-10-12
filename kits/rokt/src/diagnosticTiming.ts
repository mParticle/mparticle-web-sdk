// Builds diagnostic log entries for preselect outcomes. Attribute names
// only — never values — since this ships over the network logging
// pipeline and payloads can carry customer PII.

export interface DiagnosticLogEntry {
  message: string;
  code: string;
}

export type PreselectDiagnosticOutcome = 'fired' | 'missed' | 'queued' | 'skipped' | 'held' | 'identity_arrived';

export type PreselectDiagnosticDetails = Record<string, string | number | boolean>;

export function buildPreselectDiagnosticLogEntry(
  outcome: PreselectDiagnosticOutcome,
  reason: string,
  details: PreselectDiagnosticDetails = {},
): DiagnosticLogEntry {
  const code: Record<PreselectDiagnosticOutcome, string> = {
    fired: 'PRESELECT_FIRED',
    missed: 'PRESELECT_MISSED',
    queued: 'PRESELECT_QUEUED',
    skipped: 'PRESELECT_SKIPPED',
    held: 'PRESELECT_HELD',
    identity_arrived: 'PRESELECT_IDENTITY_ARRIVED',
  };
  const detailText = Object.entries(details)
    .map(([key, value]) => ` [${key}=${value}]`)
    .join('');
  return {
    message: `Rokt Kit: preselect ${outcome} [reason=${reason}]${detailText}`,
    code: code[outcome],
  };
}
