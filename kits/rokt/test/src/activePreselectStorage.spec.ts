import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ACTIVE_PRESELECT_TTL_MS,
  buildActivePreselectFieldKey,
  clearActivePreselects,
  getActivePreselect,
  removeLegacyActivePreselects,
  setActivePreselect,
} from '../../src/activePreselectStorage';
import { setDevicePersistenceDisabled } from '../../src/storage';

const NAMESPACE_KEY = 'mp-rokt-kit';

const readNamespace = (storage: Storage): Record<string, unknown> | null => {
  const raw = storage.getItem(NAMESPACE_KEY);
  return raw === null ? null : JSON.parse(raw);
};

describe('activePreselectStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    setDevicePersistenceDisabled(false);
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('stores only the expiry and the digest, in sessionStorage', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const fieldKey = buildActivePreselectFieldKey('1', '/checkout');

    setActivePreselect(fieldKey, 42);

    expect(readNamespace(window.sessionStorage)).toEqual({
      [fieldKey]: { expiresAt: 1_000 + ACTIVE_PRESELECT_TTL_MS, attributesDigest: 42 },
    });
    expect(readNamespace(window.localStorage)).toBeNull();
  });

  it('treats a record as absent from the moment it expires', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const fieldKey = buildActivePreselectFieldKey('1', '/checkout');
    setActivePreselect(fieldKey, 42);

    vi.setSystemTime(1_000 + ACTIVE_PRESELECT_TTL_MS - 1);
    expect(getActivePreselect(fieldKey)).toEqual({ expiresAt: 1_000 + ACTIVE_PRESELECT_TTL_MS, attributesDigest: 42 });

    vi.setSystemTime(1_000 + ACTIVE_PRESELECT_TTL_MS);
    expect(getActivePreselect(fieldKey)).toBeNull();
  });

  it('ignores a record shaped like the earlier raw-attributes format', () => {
    const fieldKey = buildActivePreselectFieldKey('1', '/checkout');
    window.sessionStorage.setItem(
      NAMESPACE_KEY,
      JSON.stringify({ [fieldKey]: { expiresAt: Date.now() + 60_000, attributes: { email: 'a@example.com' } } }),
    );

    expect(getActivePreselect(fieldKey)).toBeNull();
  });

  it("clears only the given account's records, not an account whose id shares the prefix", () => {
    setActivePreselect(buildActivePreselectFieldKey('1', '/checkout'), 1);
    setActivePreselect(buildActivePreselectFieldKey('1', '/other'), 2);
    setActivePreselect(buildActivePreselectFieldKey('12', '/checkout'), 3);

    clearActivePreselects('1');

    expect(Object.keys(readNamespace(window.sessionStorage) ?? {})).toEqual([
      buildActivePreselectFieldKey('12', '/checkout'),
    ]);
  });

  it('removes every legacy record from localStorage and keeps the other fields', () => {
    window.localStorage.setItem(
      NAMESPACE_KEY,
      JSON.stringify({
        'activePreselect:1:/checkout': { expiresAt: 1, attributes: { email: 'a@example.com' } },
        'activePreselect:2:/checkout/abc/review': { expiresAt: 1, attributes: { email: 'b@example.com' } },
        utmParams: { utm_source: 'x' },
      }),
    );

    removeLegacyActivePreselects();

    expect(readNamespace(window.localStorage)).toEqual({ utmParams: { utm_source: 'x' } });
  });

  it('keeps records in page memory, off the device, while persistence is disabled', () => {
    setDevicePersistenceDisabled(true);
    const fieldKey = buildActivePreselectFieldKey('1', '/checkout');

    setActivePreselect(fieldKey, 42);

    expect(getActivePreselect(fieldKey)?.attributesDigest).toBe(42);
    expect(window.sessionStorage.length).toBe(0);
    expect(window.localStorage.length).toBe(0);
  });
});
