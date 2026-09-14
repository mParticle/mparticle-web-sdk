import { isObject } from './utils';

export const LS_NAMESPACE_KEY = 'mp-rokt-kit';

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

// storage defaults to localStorage; pendingPreselectStorage passes sessionStorage instead,
// since it's tab-scoped and still survives a same-tab full page navigation.
export function readJSON(key: string, storage: Storage = window.localStorage): unknown {
  try {
    const stored = storage.getItem(key);
    return stored === null ? null : JSON.parse(stored);
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown, storage: Storage = window.localStorage): boolean {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string, storage: Storage = window.localStorage): void {
  try {
    storage.removeItem(key);
  } catch {
    /* empty */
  }
}

export function readNamespacedField(namespaceKey: string, field: string, storage: Storage = window.localStorage): unknown {
  const blob = readJSON(namespaceKey, storage);
  return isObject(blob) ? blob[field] : undefined;
}

export function writeNamespacedField(
  namespaceKey: string,
  field: string,
  value: unknown,
  storage: Storage = window.localStorage,
): boolean {
  const blob = readJSON(namespaceKey, storage);
  const next = isObject(blob) ? { ...blob } : {};
  next[field] = value;
  return writeJSON(namespaceKey, next, storage);
}

export function removeNamespacedField(namespaceKey: string, field: string, storage: Storage = window.localStorage): void {
  const blob = readJSON(namespaceKey, storage);
  if (!isObject(blob) || !(field in blob)) {
    return;
  }
  const next = { ...blob };
  delete next[field];
  if (Object.keys(next).length === 0) {
    removeKey(namespaceKey, storage);
  } else {
    writeJSON(namespaceKey, next, storage);
  }
}
