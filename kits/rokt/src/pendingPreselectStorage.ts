import { readNamespacedField, writeNamespacedField, removeNamespacedField, LS_NAMESPACE_KEY } from './storage';
import { isObject, isString } from './utils';

// Covers a checkout-to-confirmation redirect; short enough that a stale, unconsumed entry
// doesn't get replayed long after the shopper is gone.
export const PENDING_PRESELECT_TTL_MS = 2 * 60_000;

// sessionStorage, not localStorage: tab-scoped, so a different tab can't recover a snapshot
// meant for this one, but it still survives a same-tab full page navigation (checkout to
// its confirmation page), which is the only case this needs to survive.
const PENDING_PRESELECT_STORAGE = (): Storage => window.sessionStorage;

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
  return `pendingPreselect:${accountId}`;
}

export function getPendingPreselect(accountId: string): PendingPreselectRecord | null {
  const key = buildPendingPreselectFieldKey(accountId);
  const stored = readNamespacedField(LS_NAMESPACE_KEY, key, PENDING_PRESELECT_STORAGE());
  if (!isPendingPreselectRecord(stored)) {
    return null;
  }
  if (stored.expiresAt <= Date.now()) {
    removeNamespacedField(LS_NAMESPACE_KEY, key, PENDING_PRESELECT_STORAGE());
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
    LS_NAMESPACE_KEY,
    buildPendingPreselectFieldKey(accountId),
    {
      expiresAt: Date.now() + PENDING_PRESELECT_TTL_MS,
      pathname,
      identifier,
      attributes,
      mpid,
    },
    PENDING_PRESELECT_STORAGE(),
  );
}

export function clearPendingPreselect(accountId: string): void {
  removeNamespacedField(LS_NAMESPACE_KEY, buildPendingPreselectFieldKey(accountId), PENDING_PRESELECT_STORAGE());
}
