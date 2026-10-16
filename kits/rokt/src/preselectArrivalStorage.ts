import {
  readNamespacedField,
  writeNamespacedField,
  removeNamespacedFieldsWithPrefix,
  sessionStorageBackend,
  STORAGE_NAMESPACE_KEY,
} from './storage';
import { isObject } from './utils';

const PRESELECT_ARRIVAL_FIELD_PREFIX = 'preselectArrival:';
const ANY_TAB_TRIGGER_FIELD_PREFIX = 'preselectTriggerAnyTab:';

// mParticle's default session timeout; session end and logout clear the marker sooner.
export const ANY_TAB_TRIGGER_TTL_MS = 30 * 60_000;

// An intent older than this is not counted toward the arrival that follows it.
export const INTENT_ARRIVAL_WINDOW_MS = 30 * 60_000;

export type PreselectIntentKind = 'commit' | 'wallet' | 'checkout_step' | 'frame';

// Strongest first: a stored intent is replaced only by a stronger kind, or by a later one of its own kind.
const INTENT_KIND_PRIORITY: PreselectIntentKind[] = ['commit', 'wallet', 'frame', 'checkout_step'];

// Timestamps and the intent kind only, never identifiers or attribute values. Kept in sessionStorage
// (page memory under noFunctional) so the target page can tell whether this tab triggered, fired or
// saw checkout intent earlier. The last trigger time is also kept in localStorage, so it can tell
// whether any tab did.
export interface PreselectArrivalRecord {
  triggeredAt?: number;
  identitySeenAt?: number;
  firedAt?: number;
  arrivedAt?: number;
  // A page whose path nearly matched the trigger path; the path itself is never kept.
  nearMissAt?: number;
  intentAt?: number;
  intentKind?: PreselectIntentKind;
}

const RECORD_FIELDS = ['triggeredAt', 'identitySeenAt', 'firedAt', 'arrivedAt', 'nearMissAt'] as const;

function buildFieldKey(accountId: string, targetPageIdentifier: string): string {
  return `${PRESELECT_ARRIVAL_FIELD_PREFIX}${accountId}:${targetPageIdentifier}`;
}

function buildAnyTabFieldKey(accountId: string, targetPageIdentifier: string): string {
  return `${ANY_TAB_TRIGGER_FIELD_PREFIX}${accountId}:${targetPageIdentifier}`;
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
  if (typeof stored.intentAt === 'number' && INTENT_KIND_PRIORITY.includes(stored.intentKind as PreselectIntentKind)) {
    record.intentAt = stored.intentAt;
    record.intentKind = stored.intentKind as PreselectIntentKind;
  }
  return record;
}

function writeRecord(fieldKey: string, record: PreselectArrivalRecord): boolean {
  return writeNamespacedField(STORAGE_NAMESPACE_KEY, fieldKey, record, sessionStorageBackend);
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
  writeNamespacedField(STORAGE_NAMESPACE_KEY, buildAnyTabFieldKey(accountId, targetPageIdentifier), {
    triggeredAt: now,
  });
}

// Whether any tab on this device saw the trigger within ANY_TAB_TRIGGER_TTL_MS, this one included.
export function wasPreselectTriggeredInAnyTab(accountId: string, targetPageIdentifier: string): boolean {
  const stored = readNamespacedField(STORAGE_NAMESPACE_KEY, buildAnyTabFieldKey(accountId, targetPageIdentifier));
  if (!isObject(stored) || typeof stored.triggeredAt !== 'number') {
    return false;
  }
  const age = Date.now() - stored.triggeredAt;
  return age >= 0 && age < ANY_TAB_TRIGGER_TTL_MS;
}

export function recordPreselectNearMiss(accountId: string, targetPageIdentifier: string): void {
  const fieldKey = buildFieldKey(accountId, targetPageIdentifier);
  const record = readOpenRecord(fieldKey);
  if (record.nearMissAt !== undefined) return;
  writeRecord(fieldKey, { ...record, nearMissAt: Date.now() });
}

export function recordPreselectFired(accountId: string, targetPageIdentifier: string): void {
  const fieldKey = buildFieldKey(accountId, targetPageIdentifier);
  const record = readOpenRecord(fieldKey);
  writeRecord(fieldKey, { ...record, firedAt: record.firedAt ?? Date.now() });
}

// Keeps the strongest kind this tab saw, and the latest time for that kind. A stored intent past
// INTENT_ARRIVAL_WINDOW_MS no longer counts, so any kind replaces it.
export function recordPreselectIntent(
  accountId: string,
  targetPageIdentifier: string,
  kind: PreselectIntentKind,
  t: number,
): void {
  const fieldKey = buildFieldKey(accountId, targetPageIdentifier);
  const record = readOpenRecord(fieldKey);
  if (record.intentAt !== undefined && record.intentKind !== undefined && isIntentRecent(record.intentAt)) {
    const storedRank = INTENT_KIND_PRIORITY.indexOf(record.intentKind);
    const rank = INTENT_KIND_PRIORITY.indexOf(kind);
    if (storedRank < rank || (storedRank === rank && record.intentAt >= t)) {
      return;
    }
  }
  writeRecord(fieldKey, { ...record, intentAt: t, intentKind: kind });
}

function isIntentRecent(intentAt: number): boolean {
  const age = Date.now() - intentAt;
  return age >= 0 && age < INTENT_ARRIVAL_WINDOW_MS;
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
  if (!writeRecord(fieldKey, { ...record, arrivedAt: Date.now() })) {
    return undefined;
  }
  return record;
}

export function clearPreselectArrivals(accountId: string): void {
  removeNamespacedFieldsWithPrefix(
    STORAGE_NAMESPACE_KEY,
    `${PRESELECT_ARRIVAL_FIELD_PREFIX}${accountId}:`,
    sessionStorageBackend,
  );
  removeNamespacedFieldsWithPrefix(STORAGE_NAMESPACE_KEY, `${ANY_TAB_TRIGGER_FIELD_PREFIX}${accountId}:`);
}
