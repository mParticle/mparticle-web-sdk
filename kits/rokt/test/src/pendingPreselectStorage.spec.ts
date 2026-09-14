import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readJSON } from '../../src/storage';
import {
  getPendingPreselect,
  setPendingPreselect,
  clearPendingPreselect,
  PENDING_PRESELECT_TTL_MS,
} from '../../src/pendingPreselectStorage';

const NAMESPACE_KEY = 'mp-rokt-kit';
const ACCOUNT_ID = 'account-1';
const MPID = 'mpid-1';

describe('pendingPreselectStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('writes to sessionStorage, not localStorage', () => {
    setPendingPreselect(ACCOUNT_ID, '/checkout', 'target-page', { email: 'a@b.com' }, MPID);

    expect(readJSON(NAMESPACE_KEY, () => window.sessionStorage)).toHaveProperty(`pendingPreselect:${ACCOUNT_ID}`);
    expect(readJSON(NAMESPACE_KEY, () => window.localStorage)).toBeNull();
  });

  describe('getPendingPreselect', () => {
    it('returns null when nothing is stored', () => {
      expect(getPendingPreselect(ACCOUNT_ID)).toBeNull();
    });

    it('returns the stored record', () => {
      setPendingPreselect(ACCOUNT_ID, '/checkout', 'target-page', { email: 'a@b.com' }, MPID);
      const record = getPendingPreselect(ACCOUNT_ID);
      expect(record?.pathname).toBe('/checkout');
      expect(record?.identifier).toBe('target-page');
      expect(record?.attributes).toEqual({ email: 'a@b.com' });
      expect(record?.mpid).toBe(MPID);
    });

    it('returns null and removes the entry once the record has expired', () => {
      setPendingPreselect(ACCOUNT_ID, '/checkout', 'target-page', { email: 'a@b.com' }, MPID);

      const fieldKey = `pendingPreselect:${ACCOUNT_ID}`;
      const blob = readJSON(NAMESPACE_KEY, () => window.sessionStorage) as Record<string, unknown>;
      (blob[fieldKey] as { expiresAt: number }).expiresAt = Date.now() - 1;
      window.sessionStorage.setItem(NAMESPACE_KEY, JSON.stringify(blob));

      expect(getPendingPreselect(ACCOUNT_ID)).toBeNull();
      expect(readJSON(NAMESPACE_KEY, () => window.sessionStorage)).toBeNull();
    });

    it('is scoped per account', () => {
      setPendingPreselect(ACCOUNT_ID, '/checkout', 'target-page', { email: 'a@b.com' }, MPID);
      expect(getPendingPreselect('some-other-account')).toBeNull();
    });

    it('sets an expiry roughly PENDING_PRESELECT_TTL_MS out', () => {
      const before = Date.now();
      setPendingPreselect(ACCOUNT_ID, '/checkout', 'target-page', {}, MPID);
      const record = getPendingPreselect(ACCOUNT_ID);
      expect(record?.expiresAt).toBeGreaterThanOrEqual(before + PENDING_PRESELECT_TTL_MS);
      expect(record?.expiresAt).toBeLessThanOrEqual(Date.now() + PENDING_PRESELECT_TTL_MS);
    });
  });

  describe('setPendingPreselect', () => {
    it('overwrites a prior unconsumed record for the same account', () => {
      setPendingPreselect(ACCOUNT_ID, '/checkout', 'target-page', { email: 'first@b.com' }, MPID);
      setPendingPreselect(ACCOUNT_ID, '/checkout', 'target-page', { email: 'second@b.com' }, MPID);

      expect(getPendingPreselect(ACCOUNT_ID)?.attributes).toEqual({ email: 'second@b.com' });
    });

    it('does not disturb an unrelated namespaced field', () => {
      setPendingPreselect(ACCOUNT_ID, '/checkout', 'target-page', { email: 'a@b.com' }, MPID);
      const blob = readJSON(NAMESPACE_KEY, () => window.sessionStorage) as Record<string, unknown>;
      expect(Object.keys(blob)).toEqual([`pendingPreselect:${ACCOUNT_ID}`]);
    });

    it('returns true on a successful write', () => {
      expect(setPendingPreselect(ACCOUNT_ID, '/checkout', 'target-page', { email: 'a@b.com' }, MPID)).toBe(true);
    });

    it('returns false and does not throw when the write fails', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('quota', 'QuotaExceededError');
      });

      expect(setPendingPreselect(ACCOUNT_ID, '/checkout', 'target-page', { email: 'a@b.com' }, MPID)).toBe(false);

      vi.restoreAllMocks();
    });
  });

  describe('clearPendingPreselect', () => {
    it('removes the record for that account only', () => {
      setPendingPreselect(ACCOUNT_ID, '/checkout', 'target-page', { email: 'a@b.com' }, MPID);
      setPendingPreselect('other-account', '/checkout', 'target-page', { email: 'c@d.com' }, MPID);

      clearPendingPreselect(ACCOUNT_ID);

      expect(getPendingPreselect(ACCOUNT_ID)).toBeNull();
      expect(getPendingPreselect('other-account')).not.toBeNull();
    });

    it('is a no-op when nothing was stored', () => {
      expect(() => clearPendingPreselect(ACCOUNT_ID)).not.toThrow();
    });
  });
});
