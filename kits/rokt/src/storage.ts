import { isObject } from './utils';

export const STORAGE_NAMESPACE_KEY = 'mp-rokt-kit';

const LS_PROBE_KEY = '__rokt_ls_probe__';

export type StorageBackend = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function createMemoryStorage(): StorageBackend {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value);
    },
    removeItem: (key) => {
      items.delete(key);
    },
  };
}

// Under noFunctional (which core also sets for noDeviceId) nothing may be written to the
// shopper's device, so both backends resolve to page memory: the kit keeps working for the
// current page and nothing it stores outlives it.
let memoryStorages: { local: StorageBackend; session: StorageBackend } | null = null;

export function setDevicePersistenceDisabled(disabled: boolean): void {
  if (!disabled) {
    memoryStorages = null;
  } else if (!memoryStorages) {
    memoryStorages = { local: createMemoryStorage(), session: createMemoryStorage() };
  }
}

const defaultStorage = (): StorageBackend => memoryStorages?.local ?? window.localStorage;

export const sessionStorageBackend = (): StorageBackend => memoryStorages?.session ?? window.sessionStorage;

export function isLocalStorageAvailable(): boolean {
  try {
    const storage = defaultStorage();
    storage.setItem(LS_PROBE_KEY, '1');
    storage.removeItem(LS_PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

// Backend resolution happens inside the try, not as a parameter default, since accessing
// window.localStorage/sessionStorage itself can throw under some browser privacy settings,
// not just calling methods on it.
export function readJSON(key: string, getStorage: () => StorageBackend = defaultStorage): unknown {
  try {
    const stored = getStorage().getItem(key);
    return stored === null ? null : JSON.parse(stored);
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown, getStorage: () => StorageBackend = defaultStorage): boolean {
  try {
    getStorage().setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string, getStorage: () => StorageBackend = defaultStorage): void {
  try {
    getStorage().removeItem(key);
  } catch {
    /* empty */
  }
}

// Bypasses the in-memory backends on purpose: this removes what earlier pages or earlier kit
// versions left on the device.
export function removeKitStorageFromDevice(): void {
  removeKey(STORAGE_NAMESPACE_KEY, () => window.localStorage);
  removeKey(STORAGE_NAMESPACE_KEY, () => window.sessionStorage);
}

export function readNamespacedField(
  namespaceKey: string,
  field: string,
  getStorage: () => StorageBackend = defaultStorage,
): unknown {
  const blob = readJSON(namespaceKey, getStorage);
  return isObject(blob) ? blob[field] : undefined;
}

export function writeNamespacedField(
  namespaceKey: string,
  field: string,
  value: unknown,
  getStorage: () => StorageBackend = defaultStorage,
): boolean {
  const blob = readJSON(namespaceKey, getStorage);
  const next = isObject(blob) ? { ...blob } : {};
  next[field] = value;
  return writeJSON(namespaceKey, next, getStorage);
}

function writeOrRemoveNamespace(
  namespaceKey: string,
  next: Record<string, unknown>,
  getStorage: () => StorageBackend,
): void {
  if (Object.keys(next).length === 0) {
    removeKey(namespaceKey, getStorage);
  } else {
    writeJSON(namespaceKey, next, getStorage);
  }
}

export function removeNamespacedField(
  namespaceKey: string,
  field: string,
  getStorage: () => StorageBackend = defaultStorage,
): void {
  const blob = readJSON(namespaceKey, getStorage);
  if (!isObject(blob) || !(field in blob)) {
    return;
  }
  const next = { ...blob };
  delete next[field];
  writeOrRemoveNamespace(namespaceKey, next, getStorage);
}

export function removeNamespacedFieldsWithPrefix(
  namespaceKey: string,
  prefix: string,
  getStorage: () => StorageBackend = defaultStorage,
): void {
  const blob = readJSON(namespaceKey, getStorage);
  if (!isObject(blob)) {
    return;
  }
  const matchingFields = Object.keys(blob).filter((field) => field.startsWith(prefix));
  if (matchingFields.length === 0) {
    return;
  }
  const next = { ...blob };
  matchingFields.forEach((field) => delete next[field]);
  writeOrRemoveNamespace(namespaceKey, next, getStorage);
}
