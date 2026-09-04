import { readNamespacedField, writeNamespacedField, LS_NAMESPACE_KEY } from './storage';
import { isObject } from './utils';

export const ACTIVE_PRESELECT_TTL_MS = 60_000;

export interface ActivePreselectRecord {
  expiresAt: number;
  attributes: Record<string, unknown>;
}

function isActivePreselectRecord(value: unknown): value is ActivePreselectRecord {
  return isObject(value) && typeof value.expiresAt === 'number' && isObject(value.attributes);
}

export function buildActivePreselectFieldKey(accountId: string, pathname: string): string {
  return `activePreselect:${accountId}:${pathname}`;
}

export function getActivePreselect(fieldKey: string): ActivePreselectRecord | null {
  const stored = readNamespacedField(LS_NAMESPACE_KEY, fieldKey);
  return isActivePreselectRecord(stored) ? stored : null;
}

export function setActivePreselect(fieldKey: string, attributes: Record<string, unknown>): void {
  writeNamespacedField(LS_NAMESPACE_KEY, fieldKey, {
    expiresAt: Date.now() + ACTIVE_PRESELECT_TTL_MS,
    attributes,
  });
}
