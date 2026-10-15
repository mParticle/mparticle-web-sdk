import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isLocalStorageAvailable,
  readJSON,
  writeJSON,
  removeKey,
  readNamespacedField,
  writeNamespacedField,
  removeNamespacedField,
  removeNamespacedFieldsWithPrefix,
  removeKitStorageFromDevice,
  sessionStorageBackend,
  setDevicePersistenceDisabled,
} from '../../src/storage';

describe('storage: key-agnostic localStorage helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  describe('readJSON', () => {
    it('returns the parsed value for a stored JSON string', () => {
      window.localStorage.setItem('k', JSON.stringify({ a: 1, b: [2, 3] }));
      expect(readJSON('k')).toEqual({ a: 1, b: [2, 3] });
    });

    it('round-trips values written by writeJSON', () => {
      writeJSON('k', ['x', 'y']);
      expect(readJSON('k')).toEqual(['x', 'y']);
    });

    it('returns null when the key is absent', () => {
      expect(readJSON('missing')).toBeNull();
    });

    it('returns null for malformed JSON (does not throw)', () => {
      window.localStorage.setItem('k', '{not valid json');
      expect(readJSON('k')).toBeNull();
    });

    it('returns null when getItem throws (access denied)', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      expect(readJSON('k')).toBeNull();
    });

    it('returns null when the storage accessor itself throws, not just its methods', () => {
      expect(
        readJSON('k', () => {
          throw new Error('SecurityError');
        }),
      ).toBeNull();
    });
  });

  describe('writeJSON', () => {
    it('persists the value as a JSON string and returns true', () => {
      expect(writeJSON('k', { hello: 'world' })).toBe(true);
      expect(window.localStorage.getItem('k')).toBe(JSON.stringify({ hello: 'world' }));
    });

    it('returns false when setItem throws (quota exceeded / private mode)', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(writeJSON('k', { hello: 'world' })).toBe(false);
    });

    it('returns false when the storage accessor itself throws, not just its methods', () => {
      expect(
        writeJSON('k', { hello: 'world' }, () => {
          throw new Error('SecurityError');
        }),
      ).toBe(false);
    });

    it('overwrites an existing value', () => {
      writeJSON('k', 1);
      writeJSON('k', 2);
      expect(readJSON('k')).toBe(2);
    });
  });

  describe('removeKey', () => {
    it('removes the stored key', () => {
      window.localStorage.setItem('k', '1');
      removeKey('k');
      expect(window.localStorage.getItem('k')).toBeNull();
    });

    it('does not throw when removeItem throws', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      expect(() => removeKey('k')).not.toThrow();
    });

    it('is a no-op for an absent key', () => {
      expect(() => removeKey('missing')).not.toThrow();
    });
  });

  describe('namespaced fields', () => {
    const NAMESPACE_KEY = 'mp-rokt-kit';

    it('writeNamespacedField stores the value under a field of the namespace object', () => {
      expect(writeNamespacedField(NAMESPACE_KEY, 'pageViews', [1, 2])).toBe(true);
      expect(readJSON(NAMESPACE_KEY)).toEqual({ pageViews: [1, 2] });
    });

    it('readNamespacedField returns the stored field value', () => {
      writeNamespacedField(NAMESPACE_KEY, 'pageViews', ['a']);
      expect(readNamespacedField(NAMESPACE_KEY, 'pageViews')).toEqual(['a']);
    });

    it('preserves sibling fields on write (read-modify-write)', () => {
      writeNamespacedField(NAMESPACE_KEY, 'pageViews', ['a']);
      writeNamespacedField(NAMESPACE_KEY, 'other', { x: 1 });
      expect(readJSON(NAMESPACE_KEY)).toEqual({ pageViews: ['a'], other: { x: 1 } });
    });

    it('overwrites only the targeted field', () => {
      writeNamespacedField(NAMESPACE_KEY, 'pageViews', ['a']);
      writeNamespacedField(NAMESPACE_KEY, 'other', 1);
      writeNamespacedField(NAMESPACE_KEY, 'pageViews', ['b']);
      expect(readNamespacedField(NAMESPACE_KEY, 'pageViews')).toEqual(['b']);
      expect(readNamespacedField(NAMESPACE_KEY, 'other')).toBe(1);
    });

    it('readNamespacedField returns undefined when the key is absent', () => {
      expect(readNamespacedField(NAMESPACE_KEY, 'pageViews')).toBeUndefined();
    });

    it('readNamespacedField returns undefined when the field is absent', () => {
      writeNamespacedField(NAMESPACE_KEY, 'other', 1);
      expect(readNamespacedField(NAMESPACE_KEY, 'pageViews')).toBeUndefined();
    });

    it('readNamespacedField returns undefined when the stored value is not a plain object', () => {
      writeJSON(NAMESPACE_KEY, [1, 2, 3]);
      expect(readNamespacedField(NAMESPACE_KEY, 'pageViews')).toBeUndefined();
    });

    it('writeNamespacedField returns false when the write throws', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(writeNamespacedField(NAMESPACE_KEY, 'pageViews', ['a'])).toBe(false);
    });

    it('removeNamespacedField clears the field but keeps other fields', () => {
      writeNamespacedField(NAMESPACE_KEY, 'pageViews', ['a']);
      writeNamespacedField(NAMESPACE_KEY, 'other', 1);
      removeNamespacedField(NAMESPACE_KEY, 'pageViews');
      expect(readNamespacedField(NAMESPACE_KEY, 'pageViews')).toBeUndefined();
      expect(readJSON(NAMESPACE_KEY)).toEqual({ other: 1 });
    });

    it('removeNamespacedField drops the namespace key once its last field is gone', () => {
      writeNamespacedField(NAMESPACE_KEY, 'pageViews', ['a']);
      removeNamespacedField(NAMESPACE_KEY, 'pageViews');
      expect(window.localStorage.getItem(NAMESPACE_KEY)).toBeNull();
    });

    it('removeNamespacedField is a no-op for an absent key or field', () => {
      expect(() => removeNamespacedField(NAMESPACE_KEY, 'pageViews')).not.toThrow();
      writeNamespacedField(NAMESPACE_KEY, 'other', 1);
      removeNamespacedField(NAMESPACE_KEY, 'pageViews');
      expect(readJSON(NAMESPACE_KEY)).toEqual({ other: 1 });
    });
  });
});

describe('storage backend interchange (localStorage vs sessionStorage)', () => {
  const NAMESPACE_KEY = 'mp-rokt-kit';
  const sessionBackend = () => window.sessionStorage;

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('defaults to localStorage when no backend is given', () => {
    writeJSON(NAMESPACE_KEY, { a: 1 });

    expect(window.localStorage.getItem(NAMESPACE_KEY)).toBe(JSON.stringify({ a: 1 }));
    expect(window.sessionStorage.getItem(NAMESPACE_KEY)).toBeNull();
  });

  it('writes to sessionStorage instead when a backend is given, not localStorage', () => {
    writeJSON(NAMESPACE_KEY, { a: 1 }, sessionBackend);

    expect(window.sessionStorage.getItem(NAMESPACE_KEY)).toBe(JSON.stringify({ a: 1 }));
    expect(window.localStorage.getItem(NAMESPACE_KEY)).toBeNull();
  });

  it('reads back only from the backend it was written to', () => {
    writeJSON(NAMESPACE_KEY, { source: 'session' }, sessionBackend);

    expect(readJSON(NAMESPACE_KEY, sessionBackend)).toEqual({ source: 'session' });
    expect(readJSON(NAMESPACE_KEY)).toBeNull();
  });

  it('keeps the same namespace key + field name independent across backends, since both are used with the same STORAGE_NAMESPACE_KEY string', () => {
    writeNamespacedField(NAMESPACE_KEY, 'pending', { attempt: 'local' });
    writeNamespacedField(NAMESPACE_KEY, 'pending', { attempt: 'session' }, sessionBackend);

    expect(readNamespacedField(NAMESPACE_KEY, 'pending')).toEqual({ attempt: 'local' });
    expect(readNamespacedField(NAMESPACE_KEY, 'pending', sessionBackend)).toEqual({ attempt: 'session' });
  });

  it('removing a field from one backend does not touch the same-named field in the other', () => {
    writeNamespacedField(NAMESPACE_KEY, 'pending', { attempt: 'local' });
    writeNamespacedField(NAMESPACE_KEY, 'pending', { attempt: 'session' }, sessionBackend);

    removeNamespacedField(NAMESPACE_KEY, 'pending', sessionBackend);

    expect(readNamespacedField(NAMESPACE_KEY, 'pending')).toEqual({ attempt: 'local' });
    expect(readNamespacedField(NAMESPACE_KEY, 'pending', sessionBackend)).toBeUndefined();
  });

  it('clearing localStorage does not clear a value written to sessionStorage, and vice versa', () => {
    writeJSON(NAMESPACE_KEY, { a: 1 });
    writeJSON(NAMESPACE_KEY, { b: 2 }, sessionBackend);

    window.localStorage.clear();
    expect(readJSON(NAMESPACE_KEY, sessionBackend)).toEqual({ b: 2 });

    writeJSON(NAMESPACE_KEY, { a: 1 });
    window.sessionStorage.clear();
    expect(readJSON(NAMESPACE_KEY)).toEqual({ a: 1 });
  });

  it('a failure writing to one backend does not report success for, or affect, the other', () => {
    const originalSetItem = Storage.prototype.setItem;
    // Fail only the sessionStorage instance, matching e.g. a browser blocking one
    // storage area but not the other.
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (this === window.sessionStorage) {
        throw new DOMException('quota', 'QuotaExceededError');
      }
      originalSetItem.call(this, key, value);
    });

    expect(writeJSON(NAMESPACE_KEY, { a: 1 }, sessionBackend)).toBe(false);
    expect(writeJSON(NAMESPACE_KEY, { a: 1 })).toBe(true);
    expect(readJSON(NAMESPACE_KEY)).toEqual({ a: 1 });
  });
});

describe('isLocalStorageAvailable', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when localStorage is accessible', () => {
    expect(isLocalStorageAvailable()).toBe(true);
  });

  it('returns false when setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });
    expect(isLocalStorageAvailable()).toBe(false);
  });
});

describe('storage: device persistence switch', () => {
  const NAMESPACE_KEY = 'mp-rokt-kit';

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setDevicePersistenceDisabled(false);
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('keeps both backends in page memory while persistence is disabled', () => {
    setDevicePersistenceDisabled(true);

    writeNamespacedField(NAMESPACE_KEY, 'pageViews', [1]);
    writeNamespacedField(NAMESPACE_KEY, 'pending', { a: 1 }, sessionStorageBackend);

    expect(readNamespacedField(NAMESPACE_KEY, 'pageViews')).toEqual([1]);
    expect(readNamespacedField(NAMESPACE_KEY, 'pending', sessionStorageBackend)).toEqual({ a: 1 });
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });

  it('probes page memory rather than the device while persistence is disabled', () => {
    setDevicePersistenceDisabled(true);
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    expect(isLocalStorageAvailable()).toBe(true);
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('returns to device storage, dropping the in-memory values, once re-enabled', () => {
    setDevicePersistenceDisabled(true);
    writeNamespacedField(NAMESPACE_KEY, 'pageViews', [1]);

    setDevicePersistenceDisabled(false);
    writeNamespacedField(NAMESPACE_KEY, 'pageViews', [2]);

    expect(JSON.parse(window.localStorage.getItem(NAMESPACE_KEY) as string)).toEqual({ pageViews: [2] });
    setDevicePersistenceDisabled(true);
    expect(readNamespacedField(NAMESPACE_KEY, 'pageViews')).toBeUndefined();
  });

  it('removeKitStorageFromDevice clears both device backends even while persistence is disabled', () => {
    window.localStorage.setItem(NAMESPACE_KEY, JSON.stringify({ pageViews: [1] }));
    window.sessionStorage.setItem(NAMESPACE_KEY, JSON.stringify({ pending: {} }));
    window.localStorage.setItem('unrelated', 'kept');
    setDevicePersistenceDisabled(true);

    removeKitStorageFromDevice();

    expect(window.localStorage.getItem(NAMESPACE_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(NAMESPACE_KEY)).toBeNull();
    expect(window.localStorage.getItem('unrelated')).toBe('kept');
  });
});

describe('storage: removeNamespacedFieldsWithPrefix', () => {
  const NAMESPACE_KEY = 'mp-rokt-kit';

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('removes only the fields that start with the prefix', () => {
    writeJSON(NAMESPACE_KEY, { 'activePreselect:a:/x': 1, 'activePreselect:b:/y': 2, pageViews: [] });

    removeNamespacedFieldsWithPrefix(NAMESPACE_KEY, 'activePreselect:');

    expect(readJSON(NAMESPACE_KEY)).toEqual({ pageViews: [] });
  });

  it('removes the namespace key when no fields remain', () => {
    writeJSON(NAMESPACE_KEY, { 'activePreselect:a:/x': 1 });

    removeNamespacedFieldsWithPrefix(NAMESPACE_KEY, 'activePreselect:');

    expect(window.localStorage.getItem(NAMESPACE_KEY)).toBeNull();
  });

  it('does not rewrite the namespace when nothing matches', () => {
    writeJSON(NAMESPACE_KEY, { pageViews: [] });
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    removeNamespacedFieldsWithPrefix(NAMESPACE_KEY, 'activePreselect:');

    expect(setItemSpy).not.toHaveBeenCalled();
  });
});
