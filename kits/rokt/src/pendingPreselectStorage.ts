import {
  readNamespacedField,
  writeNamespacedField,
  removeNamespacedField,
  removeNamespacedFieldsWithPrefix,
  sessionStorageBackend,
  STORAGE_NAMESPACE_KEY,
} from './storage';
import { isObject, isString } from './utils';

// Covers a checkout-to-confirmation redirect; short enough that a stale, unconsumed entry
// doesn't get replayed long after the shopper is gone.
export const PENDING_PRESELECT_TTL_MS = 5 * 60_000;

const PENDING_PRESELECT_FIELD_PREFIX = 'pendingPreselect:';

// Kept in sessionStorage (page memory under noFunctional), not localStorage: tab-scoped, so a
// different tab can't recover a snapshot meant for this one, but it still survives a same-tab
// full page navigation (checkout to its confirmation page), which is the only case this needs
// to survive. Web Storage is per origin, so a confirmation page on another subdomain
// (checkout.example.com to confirmation.example.com) can't recover it; that page makes a normal
// call instead. localStorage, used by kit 3.2.2, had the same limit.
export interface PendingPreselectRecord {
  expiresAt: number;
  pathname: string;
  identifier: string;
  attributes: Record<string, unknown>;
  mpid: string;
}

function isPendingPreselectRecord(value: unknown): value is PendingPreselectRecord {
  return (
    isObject(value) &&
    typeof value.expiresAt === 'number' &&
    isString(value.pathname) &&
    isString(value.identifier) &&
    isObject(value.attributes) &&
    isString(value.mpid)
  );
}

function buildPendingPreselectFieldKey(accountId: string): string {
  return `${PENDING_PRESELECT_FIELD_PREFIX}${accountId}`;
}

export function getPendingPreselect(accountId: string): PendingPreselectRecord | null {
  const key = buildPendingPreselectFieldKey(accountId);
  const stored = readNamespacedField(STORAGE_NAMESPACE_KEY, key, sessionStorageBackend);
  if (!isPendingPreselectRecord(stored)) {
    return null;
  }
  if (stored.expiresAt <= Date.now()) {
    removeNamespacedField(STORAGE_NAMESPACE_KEY, key, sessionStorageBackend);
    return null;
  }
  return stored;
}

// Returns whether the write actually succeeded (private mode, quota) — callers should not
// assume a persisted snapshot exists just because this was called.
export function setPendingPreselect(
  accountId: string,
  pathname: string,
  identifier: string,
  attributes: Record<string, unknown>,
  mpid: string,
): boolean {
  return writeNamespacedField(
    STORAGE_NAMESPACE_KEY,
    buildPendingPreselectFieldKey(accountId),
    {
      expiresAt: Date.now() + PENDING_PRESELECT_TTL_MS,
      pathname,
      identifier,
      attributes,
      mpid,
    },
    sessionStorageBackend,
  );
}

export function clearPendingPreselect(accountId: string): void {
  removeNamespacedField(STORAGE_NAMESPACE_KEY, buildPendingPreselectFieldKey(accountId), sessionStorageBackend);
}

// Kit 3.2.2 kept these snapshots in localStorage. Later versions only read sessionStorage, so an
// unrecovered one would otherwise stay on the device.
export function removeLegacyPendingPreselects(): void {
  removeNamespacedFieldsWithPrefix(STORAGE_NAMESPACE_KEY, PENDING_PRESELECT_FIELD_PREFIX);
}
