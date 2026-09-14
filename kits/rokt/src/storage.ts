import { isObject } from './utils';

export const STORAGE_NAMESPACE_KEY = 'mp-rokt-kit';

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

const defaultStorage = (): Storage => window.localStorage;

// getStorage defaults to localStorage; pendingPreselectStorage passes () => window.sessionStorage
// instead, since it's tab-scoped and still survives a same-tab full page navigation. Backend
// resolution happens inside the try, not as a parameter default, since accessing
// window.localStorage/sessionStorage itself can throw under some browser privacy settings,
// not just calling methods on it.
export function readJSON(key: string, getStorage: () => Storage = defaultStorage): unknown {
  try {
    const stored = getStorage().getItem(key);
    return stored === null ? null : JSON.parse(stored);
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown, getStorage: () => Storage = defaultStorage): boolean {
  try {
    getStorage().setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string, getStorage: () => Storage = defaultStorage): void {
  try {
    getStorage().removeItem(key);
  } catch {
    /* empty */
  }
}

export function readNamespacedField(namespaceKey: string, field: string, getStorage: () => Storage = defaultStorage): unknown {
  const blob = readJSON(namespaceKey, getStorage);
  return isObject(blob) ? blob[field] : undefined;
}

export function writeNamespacedField(
  namespaceKey: string,
  field: string,
  value: unknown,
  getStorage: () => Storage = defaultStorage,
): boolean {
  const blob = readJSON(namespaceKey, getStorage);
  const next = isObject(blob) ? { ...blob } : {};
  next[field] = value;
  return writeJSON(namespaceKey, next, getStorage);
}

export function removeNamespacedField(
  namespaceKey: string,
  field: string,
  getStorage: () => Storage = defaultStorage,
): void {
  const blob = readJSON(namespaceKey, getStorage);
  if (!isObject(blob) || !(field in blob)) {
    return;
  }
  const next = { ...blob };
  delete next[field];
  if (Object.keys(next).length === 0) {
    removeKey(namespaceKey, getStorage);
  } else {
    writeJSON(namespaceKey, next, getStorage);
  }
}
