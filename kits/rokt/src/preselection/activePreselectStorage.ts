import {
  readNamespacedField,
  removeNamespacedField,
  writeNamespacedField,
  removeNamespacedFieldsWithPrefix,
  sessionStorageBackend,
  STORAGE_NAMESPACE_KEY,
} from '../storage';
import { isObject } from '../utils';

export const ACTIVE_PRESELECT_TTL_MS = 60_000;

const ACTIVE_PRESELECT_FIELD_PREFIX = 'activePreselect:';

// A djb2 digest of the sent attributes, never the values: the dedupe only needs to know
// whether they changed, and shopper attributes must not sit on the device.
export interface ActivePreselectRecord {
  expiresAt: number;
  attributesDigest: number;
  // Set when a configured trigger event wrote the record, so only it holds off a later event.
  byEvent?: boolean;
}

function isActivePreselectRecord(value: unknown): value is ActivePreselectRecord {
  return isObject(value) && typeof value.expiresAt === 'number' && typeof value.attributesDigest === 'number';
}

export function buildActivePreselectFieldKey(accountId: string, pathname: string): string {
  return `${ACTIVE_PRESELECT_FIELD_PREFIX}${accountId}:${pathname}`;
}

export function getActivePreselect(fieldKey: string): ActivePreselectRecord | null {
  const stored = readNamespacedField(STORAGE_NAMESPACE_KEY, fieldKey, sessionStorageBackend);
  return isActivePreselectRecord(stored) && stored.expiresAt > Date.now() ? stored : null;
}

export function setActivePreselect(fieldKey: string, attributesDigest: number, byEvent = false): void {
  writeNamespacedField(
    STORAGE_NAMESPACE_KEY,
    fieldKey,
    { expiresAt: Date.now() + ACTIVE_PRESELECT_TTL_MS, attributesDigest, ...(byEvent ? { byEvent: true } : {}) },
    sessionStorageBackend,
  );
}

// Puts back the record a failed or dropped dispatch replaced, or removes the one it wrote. A record a later
// dispatch wrote with other attributes belongs to that dispatch and stays.
export function restoreActivePreselect(
  fieldKey: string,
  previous: ActivePreselectRecord | null,
  ownDigest?: number,
): void {
  const current = getActivePreselect(fieldKey);
  if (current && current.attributesDigest !== ownDigest) {
    return;
  }
  if (previous && previous.expiresAt > Date.now()) {
    writeNamespacedField(STORAGE_NAMESPACE_KEY, fieldKey, previous, sessionStorageBackend);
  } else {
    removeNamespacedField(STORAGE_NAMESPACE_KEY, fieldKey, sessionStorageBackend);
  }
}

export function clearActivePreselects(accountId: string): void {
  removeNamespacedFieldsWithPrefix(
    STORAGE_NAMESPACE_KEY,
    `${ACTIVE_PRESELECT_FIELD_PREFIX}${accountId}:`,
    sessionStorageBackend,
  );
}

// Kit 3.2.0 to 3.10.0 kept these records in localStorage with the raw attribute values and never
// removed them.
export function removeLegacyActivePreselects(): void {
  removeNamespacedFieldsWithPrefix(STORAGE_NAMESPACE_KEY, ACTIVE_PRESELECT_FIELD_PREFIX);
}
