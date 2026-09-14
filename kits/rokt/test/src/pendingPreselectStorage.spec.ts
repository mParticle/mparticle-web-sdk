import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readJSON } from '../../src/storage';
import {
  getPendingPreselect,
  setPendingPreselect,
  clearPendingPreselect,
  PENDING_PRESELECT_TTL_MS,
} from '../../src/pendingPreselectStorage';

const NAMESPACE_KEY = 'mp-rokt-kit';
const ACCOUNT_ID = 'account-1';

describe('pendingPreselectStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  describe('getPendingPreselect', () => {
    it('returns null when nothing is stored', () => {
      expect(getPendingPreselect(ACCOUNT_ID)).toBeNull();
    });

    it('returns the stored record', () => {
      setPendingPreselect(ACCOUNT_ID, '/checkout', 'target-page', { email: 'a@b.com' });
      const record = getPendingPreselect(ACCOUNT_ID);
      expect(record?.pathname).toBe('/checkout');
      expect(record?.identifier).toBe('target-page');
      expect(record?.attributes).toEqual({ email: 'a@b.com' });
    });

    it('returns null once the record has expired', () => {
      setPendingPreselect(ACCOUNT_ID, '/checkout', 'target-page', { email: 'a@b.com' });

      const blob = readJSON(NAMESPACE_KEY) as Record<string, unknown>;
      const fieldKey = `pendingPreselect:${ACCOUNT_ID}`;
      (blob[fieldKey] as { expiresAt: number }).expiresAt = Date.now() - 1;
      window.localStorage.setItem(NAMESPACE_KEY, JSON.stringify(blob));

      expect(getPendingPreselect(ACCOUNT_ID)).toBeNull();
    });

    it('is scoped per account', () => {
      setPendingPreselect(ACCOUNT_ID, '/checkout', 'target-page', { email: 'a@b.com' });
      expect(getPendingPreselect('some-other-account')).toBeNull();
    });

    it('sets an expiry roughly PENDING_PRESELECT_TTL_MS out', () => {
      const before = Date.now();
      setPendingPreselect(ACCOUNT_ID, '/checkout', 'target-page', {});
      const record = getPendingPreselect(ACCOUNT_ID);
      expect(record?.expiresAt).toBeGreaterThanOrEqual(before + PENDING_PRESELECT_TTL_MS);
      expect(record?.expiresAt).toBeLessThanOrEqual(Date.now() + PENDING_PRESELECT_TTL_MS);
    });
  });

  describe('setPendingPreselect', () => {
    it('overwrites a prior unconsumed record for the same account', () => {
      setPendingPreselect(ACCOUNT_ID, '/checkout', 'target-page', { email: 'first@b.com' });
      setPendingPreselect(ACCOUNT_ID, '/checkout', 'target-page', { email: 'second@b.com' });

      expect(getPendingPreselect(ACCOUNT_ID)?.attributes).toEqual({ email: 'second@b.com' });
    });

    it('does not disturb an unrelated namespaced field', () => {
      setPendingPreselect(ACCOUNT_ID, '/checkout', 'target-page', { email: 'a@b.com' });
      const blob = readJSON(NAMESPACE_KEY) as Record<string, unknown>;
      expect(Object.keys(blob)).toEqual([`pendingPreselect:${ACCOUNT_ID}`]);
    });
  });

  describe('clearPendingPreselect', () => {
    it('removes the record for that account only', () => {
      setPendingPreselect(ACCOUNT_ID, '/checkout', 'target-page', { email: 'a@b.com' });
      setPendingPreselect('other-account', '/checkout', 'target-page', { email: 'c@d.com' });

      clearPendingPreselect(ACCOUNT_ID);

      expect(getPendingPreselect(ACCOUNT_ID)).toBeNull();
      expect(getPendingPreselect('other-account')).not.toBeNull();
    });

    it('is a no-op when nothing was stored', () => {
      expect(() => clearPendingPreselect(ACCOUNT_ID)).not.toThrow();
    });
  });
});
