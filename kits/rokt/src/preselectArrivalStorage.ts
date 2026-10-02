import {
  readNamespacedField,
  writeNamespacedField,
  removeNamespacedFieldsWithPrefix,
  sessionStorageBackend,
  STORAGE_NAMESPACE_KEY,
} from './storage';
import { isObject } from './utils';

const PRESELECT_ARRIVAL_FIELD_PREFIX = 'preselectArrival:';

// Timestamps only, never identifiers or attribute values. Kept in sessionStorage (page memory
// under noFunctional) so the target page can tell whether this tab triggered or fired earlier.
export interface PreselectArrivalRecord {
  triggeredAt?: number;
  identitySeenAt?: number;
  firedAt?: number;
  arrivedAt?: number;
}

const RECORD_FIELDS: (keyof PreselectArrivalRecord)[] = ['triggeredAt', 'identitySeenAt', 'firedAt', 'arrivedAt'];

function buildFieldKey(accountId: string, targetPageIdentifier: string): string {
  return `${PRESELECT_ARRIVAL_FIELD_PREFIX}${accountId}:${targetPageIdentifier}`;
}

function readRecord(fieldKey: string): PreselectArrivalRecord {
  const stored = readNamespacedField(STORAGE_NAMESPACE_KEY, fieldKey, sessionStorageBackend);
  const record: PreselectArrivalRecord = {};
  if (!isObject(stored)) {
    return record;
  }
  for (const field of RECORD_FIELDS) {
    if (typeof stored[field] === 'number') {
      record[field] = stored[field] as number;
    }
  }
  return record;
}

function writeRecord(fieldKey: string, record: PreselectArrivalRecord): void {
  writeNamespacedField(STORAGE_NAMESPACE_KEY, fieldKey, record, sessionStorageBackend);
}

// A record whose arrival was already reported belongs to an earlier checkout, so a new trigger
// or fire starts a fresh one.
function readOpenRecord(fieldKey: string): PreselectArrivalRecord {
  const record = readRecord(fieldKey);
  return record.arrivedAt === undefined ? record : {};
}

export function recordPreselectTrigger(accountId: string, targetPageIdentifier: string, hasIdentity: boolean): void {
  const fieldKey = buildFieldKey(accountId, targetPageIdentifier);
  const record = readOpenRecord(fieldKey);
  const now = Date.now();
  writeRecord(fieldKey, {
    ...record,
    triggeredAt: record.triggeredAt ?? now,
    ...(hasIdentity ? { identitySeenAt: record.identitySeenAt ?? now } : {}),
  });
}

export function recordPreselectFired(accountId: string, targetPageIdentifier: string): void {
  const fieldKey = buildFieldKey(accountId, targetPageIdentifier);
  const record = readOpenRecord(fieldKey);
  writeRecord(fieldKey, { ...record, firedAt: record.firedAt ?? Date.now() });
}

// Returns what this tab recorded before its first arrival on the target page, and undefined for
// every later arrival until a new trigger or fire opens a fresh record.
export function markPreselectArrival(
  accountId: string,
  targetPageIdentifier: string,
): PreselectArrivalRecord | undefined {
  const fieldKey = buildFieldKey(accountId, targetPageIdentifier);
  const record = readRecord(fieldKey);
  if (record.arrivedAt !== undefined) {
    return undefined;
  }
  writeRecord(fieldKey, { ...record, arrivedAt: Date.now() });
  return record;
}

export function clearPreselectArrivals(accountId: string): void {
  removeNamespacedFieldsWithPrefix(
    STORAGE_NAMESPACE_KEY,
    `${PRESELECT_ARRIVAL_FIELD_PREFIX}${accountId}:`,
    sessionStorageBackend,
  );
}
