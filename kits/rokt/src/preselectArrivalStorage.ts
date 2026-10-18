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

// Timestamps, the intent kind and a hash of the fired attributes, never identifiers or attribute values. Kept in sessionStorage
// (page memory under noFunctional) so the target page can tell whether this tab triggered, fired or
// saw checkout intent earlier. The last trigger time is also kept in localStorage, so it can tell
// whether any tab did.
export interface PreselectArrivalRecord {
  triggeredAt?: number;
  identitySeenAt?: number;
  firedAt?: number;
  firedDigest?: number;
  arrivedAt?: number;
  intentAt?: number;
  intentKind?: PreselectIntentKind;
}

const RECORD_FIELDS = ['triggeredAt', 'identitySeenAt', 'firedAt', 'firedDigest', 'arrivedAt'] as const;

// When this tab last fired for a target page, and a hash of the attributes that fire sent.
export interface PreselectFireMark {
  firedAt: number;
  firedDigest?: number;
}

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

// Returns the earlier fire this one built on, if it was still within the window, so a failed call can be
// rolled back to it. The window keeps the first fire's time; the digest follows the latest fire.
export function recordPreselectFired(
  accountId: string,
  targetPageIdentifier: string,
  digest?: number,
): PreselectFireMark | undefined {
  const fieldKey = buildFieldKey(accountId, targetPageIdentifier);
  const record = readOpenRecord(fieldKey);
  // A fire past the window starts a fresh one, so the one-per-checkout guard keeps working.
  const previous: PreselectFireMark | undefined =
    record.firedAt !== undefined && isWithinWindow(record.firedAt)
      ? { firedAt: record.firedAt, ...(record.firedDigest !== undefined ? { firedDigest: record.firedDigest } : {}) }
      : undefined;
  writeRecord(fieldKey, withFireMark(record, { firedAt: previous?.firedAt ?? Date.now(), firedDigest: digest }));
  return previous;
}

// Rolls back a fire whose call failed or was dropped: an earlier successful fire keeps its time and digest,
// and otherwise the fire is forgotten, so it neither blocks a later fire nor counts as one. A mark a later
// fire has since replaced, with other attributes, belongs to that fire and stays.
export function restorePreselectFired(
  accountId: string,
  targetPageIdentifier: string,
  previous?: PreselectFireMark,
  ownDigest?: number,
): void {
  const fieldKey = buildFieldKey(accountId, targetPageIdentifier);
  const record = readOpenRecord(fieldKey);
  if (record.firedAt === undefined || record.firedDigest !== ownDigest) {
    return;
  }
  writeRecord(fieldKey, withFireMark(record, previous));
}

function withFireMark(record: PreselectArrivalRecord, mark?: PreselectFireMark): PreselectArrivalRecord {
  const rest = { ...record };
  delete rest.firedAt;
  delete rest.firedDigest;
  if (!mark) return rest;
  return { ...rest, firedAt: mark.firedAt, ...(mark.firedDigest !== undefined ? { firedDigest: mark.firedDigest } : {}) };
}

// Whether this tab saw the target page's trigger within INTENT_ARRIVAL_WINDOW_MS and has not arrived since,
// so a later tap elsewhere comes after the shopper left the checkout.
export function wasPreselectTriggeredRecently(accountId: string, targetPageIdentifier: string): boolean {
  const record = readOpenRecord(buildFieldKey(accountId, targetPageIdentifier));
  if (record.triggeredAt === undefined) {
    return false;
  }
  const age = Date.now() - record.triggeredAt;
  return age >= 0 && age < INTENT_ARRIVAL_WINDOW_MS;
}

// Whether this tab fired for the target page within INTENT_ARRIVAL_WINDOW_MS and has not arrived on it
// since, so the checkout already has its pre-selection. Given a digest, a fire whose stored digest differs
// does not count, so changed attributes can fire again; an unknown digest on either side still counts.
export function wasPreselectFiredRecently(accountId: string, targetPageIdentifier: string, digest?: number): boolean {
  const record = readOpenRecord(buildFieldKey(accountId, targetPageIdentifier));
  if (record.firedAt === undefined) {
    return false;
  }
  if (digest !== undefined && record.firedDigest !== undefined && record.firedDigest !== digest) {
    return false;
  }
  const age = Date.now() - record.firedAt;
  return age >= 0 && age < INTENT_ARRIVAL_WINDOW_MS;
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

function isWithinWindow(at: number): boolean {
  const age = Date.now() - at;
  return age >= 0 && age < INTENT_ARRIVAL_WINDOW_MS;
}

function isIntentRecent(intentAt: number): boolean {
  return isWithinWindow(intentAt);
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
