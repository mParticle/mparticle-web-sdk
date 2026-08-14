import { isObject } from './utils';

export function readJSON(key: string): unknown {
  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? null : JSON.parse(stored);
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* empty */
  }
}

export function readNamespacedField(namespaceKey: string, field: string): unknown {
  const blob = readJSON(namespaceKey);
  return isObject(blob) ? blob[field] : undefined;
}

export function writeNamespacedField(namespaceKey: string, field: string, value: unknown): boolean {
  const blob = readJSON(namespaceKey);
  const next = isObject(blob) ? { ...blob } : {};
  next[field] = value;
  return writeJSON(namespaceKey, next);
}

export function removeNamespacedField(namespaceKey: string, field: string): void {
  const blob = readJSON(namespaceKey);
  if (!isObject(blob) || !(field in blob)) {
    return;
  }
  const next = { ...blob };
  delete next[field];
  if (Object.keys(next).length === 0) {
    removeKey(namespaceKey);
  } else {
    writeJSON(namespaceKey, next);
  }
}

export function writeNamespacedFieldWithinBudget(
  namespaceKey: string,
  field: string,
  records: unknown[],
  maxLength: number,
): boolean {
  // Operate on a copy so the caller's array isn't trimmed as a side effect.
  const remaining = records.slice();

  const evictOldest = (): boolean => {
    if (remaining.length <= 1) {
      return false;
    }
    remaining.shift();
    return true;
  };

  // Two limits: our own soft cap (maxLength), then the browser's hard quota,
  // which is shared across the origin and only surfaces when setItem throws.
  let overBudget = JSON.stringify(remaining).length > maxLength;
  while (overBudget && evictOldest()) {
    overBudget = JSON.stringify(remaining).length > maxLength;
  }

  let written = writeNamespacedField(namespaceKey, field, remaining);
  while (!written && evictOldest()) {
    written = writeNamespacedField(namespaceKey, field, remaining);
  }

  return written;
}
