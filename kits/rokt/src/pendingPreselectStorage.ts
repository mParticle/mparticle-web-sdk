import { readNamespacedField, writeNamespacedField, removeNamespacedField, LS_NAMESPACE_KEY } from './storage';
import { isObject, isString } from './utils';

// Covers a checkout-to-confirmation redirect; short enough that a stale, unconsumed entry
// doesn't get replayed long after the shopper is gone.
export const PENDING_PRESELECT_TTL_MS = 2 * 60_000;

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
  const stored = readNamespacedField(LS_NAMESPACE_KEY, key);
  if (!isPendingPreselectRecord(stored)) {
    return null;
  }
  if (stored.expiresAt <= Date.now()) {
    removeNamespacedField(LS_NAMESPACE_KEY, key);
    return null;
  }
  return stored;
}

export function setPendingPreselect(
  accountId: string,
  pathname: string,
  identifier: string,
  attributes: Record<string, unknown>,
  mpid: string,
): void {
  writeNamespacedField(LS_NAMESPACE_KEY, buildPendingPreselectFieldKey(accountId), {
    expiresAt: Date.now() + PENDING_PRESELECT_TTL_MS,
    pathname,
    identifier,
    attributes,
    mpid,
  });
}

export function clearPendingPreselect(accountId: string): void {
  removeNamespacedField(LS_NAMESPACE_KEY, buildPendingPreselectFieldKey(accountId));
}
