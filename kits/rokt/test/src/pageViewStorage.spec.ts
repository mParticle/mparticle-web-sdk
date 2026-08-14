import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readJSON, writeNamespacedField } from '../../src/storage';
import { migrateLegacyPageViewStorage, loadPageViews, writePageViews, clearPageViews } from '../../src/pageViewStorage';
import type { LoggingService } from '../../src/Rokt-Kit';

const NAMESPACE_KEY = 'mp-rokt-kit';
const PAGE_VIEWS_FIELD = 'pageViews';
const LEGACY_PAGE_VIEWS_KEY = 'mpPageViews';

const pageView = (id: string) => ({ pageUrl: 'https://example.com/' + id, sourceMessageId: id, timestamp: 1 });

describe('pageViewStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  describe('migrateLegacyPageViewStorage', () => {
    it('is a no-op when the legacy key is absent', () => {
      migrateLegacyPageViewStorage(null);
      expect(readJSON(NAMESPACE_KEY)).toBeNull();
    });

    it('moves a legacy array into the namespaced field and removes the legacy key', () => {
      window.localStorage.setItem(LEGACY_PAGE_VIEWS_KEY, JSON.stringify([pageView('home')]));
      migrateLegacyPageViewStorage(null);

      expect(readJSON(NAMESPACE_KEY)).toEqual({ [PAGE_VIEWS_FIELD]: [pageView('home')] });
      expect(window.localStorage.getItem(LEGACY_PAGE_VIEWS_KEY)).toBeNull();
    });

    it('does not overwrite an already-migrated field, but still clears the legacy key', () => {
      writeNamespacedField(NAMESPACE_KEY, PAGE_VIEWS_FIELD, [pageView('current')]);
      window.localStorage.setItem(LEGACY_PAGE_VIEWS_KEY, JSON.stringify([pageView('stale')]));

      migrateLegacyPageViewStorage(null);

      expect(readJSON(NAMESPACE_KEY)).toEqual({ [PAGE_VIEWS_FIELD]: [pageView('current')] });
      expect(window.localStorage.getItem(LEGACY_PAGE_VIEWS_KEY)).toBeNull();
    });

    it('retains the legacy key and logs when the migrating write fails', () => {
      window.localStorage.setItem(LEGACY_PAGE_VIEWS_KEY, JSON.stringify([pageView('home')]));
      const logger = { log: vi.fn() } as unknown as LoggingService;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('quota', 'QuotaExceededError');
      });

      migrateLegacyPageViewStorage(logger);

      expect(window.localStorage.getItem(LEGACY_PAGE_VIEWS_KEY)).not.toBeNull();
      expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({ code: 'PAGE_VIEW_CAPTURE_FAILED' }));
    });
  });

  describe('loadPageViews', () => {
    it('returns an empty array when nothing is stored', () => {
      expect(loadPageViews(null)).toEqual([]);
    });

    it('returns the stored page views', () => {
      writeNamespacedField(NAMESPACE_KEY, PAGE_VIEWS_FIELD, [pageView('home'), pageView('about')]);
      expect(loadPageViews(null)).toEqual([pageView('home'), pageView('about')]);
    });

    it('returns an empty array when the stored value is not an array', () => {
      writeNamespacedField(NAMESPACE_KEY, PAGE_VIEWS_FIELD, { not: 'an array' });
      expect(loadPageViews(null)).toEqual([]);
    });

    it('migrates the legacy key before reading', () => {
      window.localStorage.setItem(LEGACY_PAGE_VIEWS_KEY, JSON.stringify([pageView('legacy')]));
      expect(loadPageViews(null)).toEqual([pageView('legacy')]);
      expect(window.localStorage.getItem(LEGACY_PAGE_VIEWS_KEY)).toBeNull();
    });
  });

  describe('writePageViews', () => {
    it('persists the page views and returns true', () => {
      expect(writePageViews([pageView('home')])).toBe(true);
      expect(loadPageViews(null)).toEqual([pageView('home')]);
    });

    it('evicts oldest-first to stay within the byte budget', () => {
      const oversizedUrl = 'https://example.com/' + 'a'.repeat(5000);
      const views = Array.from({ length: 30 }, (_, i) => ({
        pageUrl: oversizedUrl,
        sourceMessageId: 'seed-' + i,
        timestamp: i,
      }));

      expect(writePageViews(views)).toBe(true);

      const stored = loadPageViews(null);
      expect(JSON.stringify(stored).length).toBeLessThanOrEqual(100 * 1024);
      expect(stored.length).toBeLessThan(30);
      expect(stored[stored.length - 1].sourceMessageId).toBe('seed-29');
    });
  });

  describe('clearPageViews', () => {
    it('removes the page-view field', () => {
      writeNamespacedField(NAMESPACE_KEY, PAGE_VIEWS_FIELD, [pageView('home')]);
      writeNamespacedField(NAMESPACE_KEY, 'unrelatedField', 'keep-me');
      clearPageViews();

      const blob = readJSON(NAMESPACE_KEY);
      expect(blob).not.toHaveProperty(PAGE_VIEWS_FIELD);
      expect(blob).toHaveProperty('unrelatedField', 'keep-me');
    });
  });
});
