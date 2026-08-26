import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readJSON, writeNamespacedField } from '../../src/storage';
import {
  migrateLegacyPageViewStorage,
  loadPageViews,
  writePageViews,
  clearPageViews,
  buildPageEvents,
  captureUtmParams,
  loadUtmParams,
  clearUtmParams,
} from '../../src/pageViewStorage';
import type { LoggingService } from '../../src/Rokt-Kit';

const NAMESPACE_KEY = 'mp-rokt-kit';
const PAGE_VIEWS_FIELD = 'pageViews';
const UTM_PARAMS_FIELD = 'utmParams';
const LEGACY_PAGE_VIEWS_KEY = 'mpPageViews';

function stubSearch(search: string): void {
  vi.stubGlobal('location', { ...window.location, search });
}

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

    it('logs PAGE_VIEW_LEGACY_MIGRATION when the migration path is taken', () => {
      window.localStorage.setItem(LEGACY_PAGE_VIEWS_KEY, JSON.stringify([pageView('home')]));
      const logger = { log: vi.fn() } as unknown as LoggingService;

      migrateLegacyPageViewStorage(logger);

      expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({ code: 'PAGE_VIEW_LEGACY_MIGRATION' }));
    });

    it('removes the legacy key and logs when the migrating write fails', () => {
      window.localStorage.setItem(LEGACY_PAGE_VIEWS_KEY, JSON.stringify([pageView('home')]));
      const logger = { log: vi.fn() } as unknown as LoggingService;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('quota', 'QuotaExceededError');
      });

      migrateLegacyPageViewStorage(logger);

      // Legacy key is removed even on failure — prevents the infinite retry loop.
      expect(window.localStorage.getItem(LEGACY_PAGE_VIEWS_KEY)).toBeNull();
      expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({ code: 'PAGE_VIEW_CAPTURE_FAILED' }));
    });

    it('does not log PAGE_VIEW_CAPTURE_FAILED on a second call after a failed migration', () => {
      window.localStorage.setItem(LEGACY_PAGE_VIEWS_KEY, JSON.stringify([pageView('home')]));
      const logger = { log: vi.fn() } as unknown as LoggingService;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('quota', 'QuotaExceededError');
      });

      migrateLegacyPageViewStorage(logger); // first call: fails, legacy key removed
      vi.restoreAllMocks();
      logger.log.mockClear();

      migrateLegacyPageViewStorage(logger); // second call: legacy key gone, no-op

      expect(logger.log).not.toHaveBeenCalled();
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
    it('persists the page views and returns the stored count', () => {
      expect(writePageViews([pageView('home')])).toBe(1);
      expect(loadPageViews(null)).toEqual([pageView('home')]);
    });

    it('keeps only the 25 most-recent views when given more than 25', () => {
      const views = Array.from({ length: 40 }, (_, i) => pageView('page-' + i));
      expect(writePageViews(views)).toBe(25);
      const stored = loadPageViews(null);
      expect(stored).toHaveLength(25);
      expect(stored[0].sourceMessageId).toBe('page-15');
      expect(stored[24].sourceMessageId).toBe('page-39');
    });

    it('evicts oldest records and retries when the initial write fails due to quota', () => {
      const views = Array.from({ length: 5 }, (_, i) => pageView('page-' + i));
      const original = Storage.prototype.setItem;
      let calls = 0;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
        if (++calls === 1) throw new DOMException('quota', 'QuotaExceededError');
        original.call(this, key, value);
      });

      expect(writePageViews(views)).toBe(4);
      const stored = loadPageViews(null);
      expect(stored).toHaveLength(4);
      expect(stored[0].sourceMessageId).toBe('page-1');
      expect(stored[3].sourceMessageId).toBe('page-4');
    });

    it('evicts oldest records across multiple failed writes until one succeeds', () => {
      const views = Array.from({ length: 5 }, (_, i) => pageView('page-' + i));
      const original = Storage.prototype.setItem;
      let calls = 0;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
        if (++calls <= 3) throw new DOMException('quota', 'QuotaExceededError');
        original.call(this, key, value);
      });

      expect(writePageViews(views)).toBe(2);
      const stored = loadPageViews(null);
      expect(stored).toHaveLength(2);
      expect(stored[0].sourceMessageId).toBe('page-3');
      expect(stored[1].sourceMessageId).toBe('page-4');
    });

    it('evicts the oldest record from pre-existing storage when quota is tight on the next write', () => {
      const existing = Array.from({ length: 5 }, (_, i) => pageView('existing-' + i));
      writePageViews(existing); // seed storage

      const updated = [...existing, pageView('new')];
      const original = Storage.prototype.setItem;
      let calls = 0;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
        if (++calls === 1) throw new DOMException('quota', 'QuotaExceededError');
        original.call(this, key, value);
      });

      expect(writePageViews(updated)).toBe(5);
      const stored = loadPageViews(null);
      expect(stored).toHaveLength(5);
      expect(stored[0].sourceMessageId).toBe('existing-1');
      expect(stored[4].sourceMessageId).toBe('new');
    });

    it('returns 0 when every write attempt fails', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('quota', 'QuotaExceededError');
      });
      expect(writePageViews([pageView('home')])).toBe(0);
    });
  });

  describe('buildPageEvents', () => {
    it('returns all views when count is within the send limit', () => {
      const views = Array.from({ length: 10 }, (_, i) => pageView('page-' + i));
      expect(buildPageEvents(views)).toHaveLength(10);
    });

    it('caps output at 25 most-recent views when storage exceeds the send limit', () => {
      const views = Array.from({ length: 40 }, (_, i) => ({
        pageUrl: 'https://example.com/page-' + i,
        sourceMessageId: 'id-' + i,
        timestamp: i,
      }));
      const result = buildPageEvents(views);
      expect(result).toHaveLength(25);
      expect(result[0].sourceMessageId).toBe('id-15');
      expect(result[24].sourceMessageId).toBe('id-39');
    });

    it('computes activeTimeOnPage correctly within the capped window', () => {
      const views = Array.from({ length: 30 }, (_, i) => ({
        pageUrl: 'https://example.com/page-' + i,
        sourceMessageId: 'id-' + i,
        timestamp: i,
        activeTimeOnSite: i * 1000,
      }));
      const result = buildPageEvents(views);
      expect(result).toHaveLength(25);
      expect(result[0].activeTimeOnPage).toBe(1000);
      expect(result[24].activeTimeOnPage).toBeUndefined();
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

  describe('captureUtmParams', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('stores present UTM params on first call', () => {
      stubSearch('?utm_source=google&utm_medium=cpc&utm_campaign=spring');
      captureUtmParams(null);
      expect(readJSON(NAMESPACE_KEY)).toHaveProperty(UTM_PARAMS_FIELD, {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'spring',
      });
    });

    it('only stores the keys that are present', () => {
      stubSearch('?utm_source=email');
      captureUtmParams(null);
      const stored = readJSON(NAMESPACE_KEY) as Record<string, unknown>;
      expect(stored[UTM_PARAMS_FIELD]).toEqual({ utm_source: 'email' });
    });

    it('does nothing when no UTM params are in the URL', () => {
      stubSearch('?unrelated=value');
      captureUtmParams(null);
      expect(readJSON(NAMESPACE_KEY)).toBeNull();
    });

    it('does nothing when the URL has no query string', () => {
      stubSearch('');
      captureUtmParams(null);
      expect(readJSON(NAMESPACE_KEY)).toBeNull();
    });

    it('first touch wins — does not overwrite when UTMs are already stored', () => {
      stubSearch('?utm_source=google');
      captureUtmParams(null);
      stubSearch('?utm_source=facebook&utm_medium=paid');
      captureUtmParams(null);
      const stored = readJSON(NAMESPACE_KEY) as Record<string, unknown>;
      expect(stored[UTM_PARAMS_FIELD]).toEqual({ utm_source: 'google' });
    });
  });

  describe('loadUtmParams', () => {
    it('returns null when nothing is stored', () => {
      expect(loadUtmParams()).toBeNull();
    });

    it('returns the stored UTM params', () => {
      writeNamespacedField(NAMESPACE_KEY, UTM_PARAMS_FIELD, { utm_source: 'google', utm_medium: 'cpc' });
      expect(loadUtmParams()).toEqual({ utm_source: 'google', utm_medium: 'cpc' });
    });

    it('returns null when the stored value is not an object', () => {
      writeNamespacedField(NAMESPACE_KEY, UTM_PARAMS_FIELD, 'invalid');
      expect(loadUtmParams()).toBeNull();
    });
  });

  describe('clearUtmParams', () => {
    it('removes the utmParams field without affecting other fields', () => {
      writeNamespacedField(NAMESPACE_KEY, UTM_PARAMS_FIELD, { utm_source: 'google' });
      writeNamespacedField(NAMESPACE_KEY, PAGE_VIEWS_FIELD, [pageView('home')]);
      clearUtmParams();

      const blob = readJSON(NAMESPACE_KEY);
      expect(blob).not.toHaveProperty(UTM_PARAMS_FIELD);
      expect(blob).toHaveProperty(PAGE_VIEWS_FIELD);
    });
  });
});
