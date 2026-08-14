import type { LoggingService } from './Rokt-Kit';
import {
  readJSON,
  removeKey,
  readNamespacedField,
  writeNamespacedField,
  removeNamespacedField,
  writeNamespacedFieldWithinBudget,
} from './storage';
import { sanitizeUrl } from './utils';

const LS_NAMESPACE_KEY = 'mp-rokt-kit';
const LS_PAGE_VIEWS_FIELD = 'pageViews';
const LEGACY_PAGE_VIEWS_KEY = 'mpPageViews';
const PAGE_VIEWS_MAX_LENGTH = 100 * 1024;

export interface PageEvent {
  pageUrl: string;
  sourceMessageId: string;
  timestamp: number;
  pageTitle?: string;
  canonicalUrl?: string;
  activeTimeOnSite?: number;
  activeTimeOnPage?: number;
}

export function migrateLegacyPageViewStorage(loggingService: LoggingService | null): void {
  const legacyViews = readJSON(LEGACY_PAGE_VIEWS_KEY);
  if (legacyViews === null) {
    return;
  }

  const alreadyMigrated = readNamespacedField(LS_NAMESPACE_KEY, LS_PAGE_VIEWS_FIELD) !== undefined;
  const needsMigration = !alreadyMigrated && Array.isArray(legacyViews);

  if (needsMigration) {
    const migrated = writeNamespacedField(LS_NAMESPACE_KEY, LS_PAGE_VIEWS_FIELD, legacyViews);
    if (!migrated) {
      loggingService?.log({
        message: 'Rokt Kit: Failed to migrate legacy page-view storage; retaining legacy key for retry',
        code: 'PAGE_VIEW_CAPTURE_FAILED',
      });
      return;
    }
  }

  removeKey(LEGACY_PAGE_VIEWS_KEY);
}

export function loadPageViews(loggingService: LoggingService | null): PageEvent[] {
  migrateLegacyPageViewStorage(loggingService);
  const stored = readNamespacedField(LS_NAMESPACE_KEY, LS_PAGE_VIEWS_FIELD);
  return Array.isArray(stored) ? (stored as PageEvent[]) : [];
}

export function writePageViews(pageViews: PageEvent[]): boolean {
  return writeNamespacedFieldWithinBudget(LS_NAMESPACE_KEY, LS_PAGE_VIEWS_FIELD, pageViews, PAGE_VIEWS_MAX_LENGTH);
}

export function clearPageViews(): void {
  removeNamespacedField(LS_NAMESPACE_KEY, LS_PAGE_VIEWS_FIELD);
}

export function buildPageEvents(pageViews: PageEvent[]): PageEvent[] {
  return pageViews.map((pageView, index) => {
    const activeTimeOnSite = pageView.activeTimeOnSite;
    const hasActiveTime = activeTimeOnSite !== undefined && Number.isFinite(activeTimeOnSite);

    const next = pageViews[index + 1];
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

export function readCanonicalUrl(): string | undefined {
  const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const href = link?.href;
  if (!href) {
    return undefined;
  }
  return sanitizeUrl(href);
}
