import { isObject } from './utils';

const LS_PROBE_KEY = '__rokt_ls_probe__';

export function isLocalStorageAvailable(): boolean {
  try {
    window.localStorage.setItem(LS_PROBE_KEY, '1');
    window.localStorage.removeItem(LS_PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

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
