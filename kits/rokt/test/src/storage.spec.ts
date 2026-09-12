import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isLocalStorageAvailable,
  readJSON,
  writeJSON,
  removeKey,
  readNamespacedField,
  writeNamespacedField,
  removeNamespacedField,
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
