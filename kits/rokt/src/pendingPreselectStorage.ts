import { readNamespacedField, writeNamespacedField, removeNamespacedField, LS_NAMESPACE_KEY } from './storage';
import { isObject, isString } from './utils';

// Covers a checkout-to-confirmation style redirect. Short enough that a stale,
// never-consumed entry doesn't get replayed long after the shopper is gone.
export const PENDING_PRESELECT_TTL_MS = 2 * 60_000;

export interface PendingPreselectRecord {
  expiresAt: number;
  pathname: string;
  identifier: string;
  attributes: Record<string, unknown>;
}

function isPendingPreselectRecord(value: unknown): value is PendingPreselectRecord {
  return (
    isObject(value) &&
    typeof value.expiresAt === 'number' &&
    isString(value.pathname) &&
    isString(value.identifier) &&
    isObject(value.attributes)
  );
}

function buildPendingPreselectFieldKey(accountId: string): string {
  return `pendingPreselect:${accountId}`;
}

export function getPendingPreselect(accountId: string): PendingPreselectRecord | null {
  const stored = readNamespacedField(LS_NAMESPACE_KEY, buildPendingPreselectFieldKey(accountId));
  if (!isPendingPreselectRecord(stored) || stored.expiresAt <= Date.now()) {
    return null;
  }
  return stored;
}

export function setPendingPreselect(
  accountId: string,
  pathname: string,
  identifier: string,
  attributes: Record<string, unknown>,
): void {
  writeNamespacedField(LS_NAMESPACE_KEY, buildPendingPreselectFieldKey(accountId), {
    expiresAt: Date.now() + PENDING_PRESELECT_TTL_MS,
    pathname,
    identifier,
    attributes,
  });
}

export function clearPendingPreselect(accountId: string): void {
  removeNamespacedField(LS_NAMESPACE_KEY, buildPendingPreselectFieldKey(accountId));
}
