import type { LoggingService } from './Rokt-Kit';
import {
  readJSON,
  removeKey,
  readNamespacedField,
  writeNamespacedField,
  removeNamespacedField,
  isLocalStorageAvailable,
} from './storage';
import { sanitizeUrl, isObject } from './utils';

const LS_NAMESPACE_KEY = 'mp-rokt-kit';
const LS_PAGE_VIEWS_FIELD = 'pageViews';
const LS_UTM_PARAMS_FIELD = 'utmParams';
const LEGACY_PAGE_VIEWS_KEY = 'mpPageViews';
export const PAGE_VIEWS_MAX_COUNT = 25;

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
type UtmKey = (typeof UTM_KEYS)[number];
export type UtmParams = Partial<Record<UtmKey, string>>;

export interface PageEvent {
  pageUrl: string;
  sourceMessageId: string;
  timestamp: number;
  pageTitle?: string;
  canonicalUrl?: string;
  activeTimeOnSite?: number;
  activeTimeOnPage?: number;
}

function capPageViews(views: PageEvent[]): PageEvent[] {
  return views.slice(-PAGE_VIEWS_MAX_COUNT);
}

export function migrateLegacyPageViewStorage(loggingService: LoggingService | null): void {
  const legacyViews = readJSON(LEGACY_PAGE_VIEWS_KEY);
  if (legacyViews === null) {
    return;
  }

  const alreadyMigrated = readNamespacedField(LS_NAMESPACE_KEY, LS_PAGE_VIEWS_FIELD) !== undefined;
  const needsMigration = !alreadyMigrated && Array.isArray(legacyViews);

  if (needsMigration) {
    loggingService?.log({
      message: 'Rokt Kit: Migrating legacy page-view storage',
      code: 'PAGE_VIEW_LEGACY_MIGRATION',
    });
    const migrated = writeNamespacedField(LS_NAMESPACE_KEY, LS_PAGE_VIEWS_FIELD, legacyViews);
    if (!migrated) {
      loggingService?.log({
        message: 'Rokt Kit: Failed to migrate legacy page-view storage [reason: migration_retry]',
        code: 'PAGE_VIEW_CAPTURE_FAILED',
      });
    }
  }

  removeKey(LEGACY_PAGE_VIEWS_KEY);
}

export function loadPageViews(loggingService: LoggingService | null): PageEvent[] {
  migrateLegacyPageViewStorage(loggingService);
  const stored = readNamespacedField(LS_NAMESPACE_KEY, LS_PAGE_VIEWS_FIELD);
  return Array.isArray(stored) ? (stored as PageEvent[]) : [];
}

export function writePageViews(pageViews: PageEvent[]): number {
  const views = capPageViews(pageViews);
  for (let i = 0; i < views.length; i++) {
    const toWrite = views.slice(i);
    if (writeNamespacedField(LS_NAMESPACE_KEY, LS_PAGE_VIEWS_FIELD, toWrite)) {
      return toWrite.length;
    }
  }
  return 0;
}

export function clearPageViews(): void {
  removeNamespacedField(LS_NAMESPACE_KEY, LS_PAGE_VIEWS_FIELD);
}

export function buildPageEvents(pageViews: PageEvent[]): PageEvent[] {
  const views = capPageViews(pageViews);
  return views.map((pageView, index) => {
    const activeTimeOnSite = pageView.activeTimeOnSite;
    const hasActiveTime = activeTimeOnSite !== undefined && Number.isFinite(activeTimeOnSite);

    const next = views[index + 1];
    const nextActiveTimeOnSite = next?.activeTimeOnSite;
    const hasNextActiveTimeOnSite = nextActiveTimeOnSite !== undefined && Number.isFinite(nextActiveTimeOnSite);

    const diff = hasActiveTime && hasNextActiveTimeOnSite ? nextActiveTimeOnSite - activeTimeOnSite : undefined;

    return {
      pageUrl: pageView.pageUrl,
      sourceMessageId: pageView.sourceMessageId,
      timestamp: pageView.timestamp,
      ...(pageView.pageTitle !== undefined ? { pageTitle: pageView.pageTitle } : {}),
      ...(pageView.canonicalUrl !== undefined ? { canonicalUrl: pageView.canonicalUrl } : {}),
      ...(hasActiveTime ? { activeTimeOnSite } : {}),
      ...(diff !== undefined && diff >= 0 ? { activeTimeOnPage: diff } : {}),
    };
  });
}

export function captureUtmParams(loggingService: LoggingService | null): void {
  if (readNamespacedField(LS_NAMESPACE_KEY, LS_UTM_PARAMS_FIELD) !== undefined) {
    return;
  }
  const search = new URLSearchParams(window.location.search);
  const params: UtmParams = {};
  for (const key of UTM_KEYS) {
    const value = search.get(key);
    if (value) params[key] = value;
  }
  if (Object.keys(params).length === 0) {
    return;
  }
  const captured = Object.keys(params).join(', ');
  if (!writeNamespacedField(LS_NAMESPACE_KEY, LS_UTM_PARAMS_FIELD, params)) {
    const reason = isLocalStorageAvailable() ? 'quota' : 'ls_unavailable';
    loggingService?.log({
      message: `Rokt Kit: Failed to persist UTM params [reason: ${reason}]`,
      code: 'UTM_CAPTURE_FAILED',
    });
    return;
  }
  loggingService?.log({
    message: `Rokt Kit: Captured UTM params [${captured}]`,
    code: 'UTM_CAPTURE_SUCCESS',
  });
}

export function loadUtmParams(): UtmParams | null {
  const stored = readNamespacedField(LS_NAMESPACE_KEY, LS_UTM_PARAMS_FIELD);
  return isObject(stored) ? (stored as UtmParams) : null;
}

export function clearUtmParams(): void {
  removeNamespacedField(LS_NAMESPACE_KEY, LS_UTM_PARAMS_FIELD);
}

export function readCanonicalUrl(): string | undefined {
  const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const href = link?.href;
  if (!href) {
    return undefined;
  }
  return sanitizeUrl(href);
}
