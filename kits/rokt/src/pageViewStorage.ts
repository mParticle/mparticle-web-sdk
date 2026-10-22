import type { LoggingService } from './Rokt-Kit';
import {
  readNamespacedField,
  writeNamespacedField,
  removeNamespacedField,
  isLocalStorageAvailable,
  STORAGE_NAMESPACE_KEY,
} from './storage';
import { cleanPageUrl, isObject, isString } from './utils';

const LS_PAGE_VIEWS_FIELD = 'pageViews';
const LS_UTM_PARAMS_FIELD = 'utmParams';
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

// Stored history can come from a kit version that kept the query, including one still running in
// another tab, so every record is cleaned again when read, and an entry that is not a record is
// dropped rather than read. A capture then writes it back clean.
export function loadPageViews(): PageEvent[] {
  const stored = readNamespacedField(STORAGE_NAMESPACE_KEY, LS_PAGE_VIEWS_FIELD);
  return Array.isArray(stored) ? (stored as PageEvent[]).filter(isObject).map(cleanStoredUrls) : [];
}

// The send path has no try, so a URL that is not a string is left as stored rather than cleaned.
function cleanStoredUrls(pageView: PageEvent): PageEvent {
  return {
    ...pageView,
    ...(isString(pageView.pageUrl) ? { pageUrl: cleanPageUrl(pageView.pageUrl) } : {}),
    ...(isString(pageView.canonicalUrl) ? { canonicalUrl: cleanPageUrl(pageView.canonicalUrl) } : {}),
  };
}

export function writePageViews(pageViews: PageEvent[]): number {
  const views = capPageViews(pageViews);
  for (let i = 0; i < views.length; i++) {
    const toWrite = views.slice(i);
    if (writeNamespacedField(STORAGE_NAMESPACE_KEY, LS_PAGE_VIEWS_FIELD, toWrite)) {
      return toWrite.length;
    }
  }
  return 0;
}

export function clearPageViews(): void {
  removeNamespacedField(STORAGE_NAMESPACE_KEY, LS_PAGE_VIEWS_FIELD);
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

// Core marks its automatic page views and gives them the page title and the URL's utm params as attributes, so on
// those a missing one was removed by the Rokt connection's attribute filters or the data plan. Those can remove the
// marker too, so every page view counts as automatic while core's AutoLogPageView setting is on. A page view logged by
// hand with the setting off may never have carried them.
export function isAutoPageView(
  attributes: Record<string, unknown> | null | undefined,
  autoLogPageViewOn = false,
): boolean {
  return autoLogPageViewOn || (!!attributes && attributes.is_auto_page_view === true);
}

export function captureUtmParams(
  loggingService: LoggingService | null,
  attributes?: Record<string, unknown> | null,
  autoLogPageViewOn = false,
): void {
  if (readNamespacedField(STORAGE_NAMESPACE_KEY, LS_UTM_PARAMS_FIELD) !== undefined) {
    return;
  }
  const fromEvent = isAutoPageView(attributes, autoLogPageViewOn);
  const search = new URLSearchParams(window.location.search);
  const params: UtmParams = {};
  for (const key of UTM_KEYS) {
    const value = fromEvent ? (attributes || {})[key] : search.get(key);
    if (isString(value) && value) params[key] = value;
  }
  if (Object.keys(params).length === 0) {
    return;
  }
  const captured = Object.keys(params).join(', ');
  if (!writeNamespacedField(STORAGE_NAMESPACE_KEY, LS_UTM_PARAMS_FIELD, params)) {
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
  const stored = readNamespacedField(STORAGE_NAMESPACE_KEY, LS_UTM_PARAMS_FIELD);
  return isObject(stored) ? (stored as UtmParams) : null;
}

export function clearUtmParams(): void {
  removeNamespacedField(STORAGE_NAMESPACE_KEY, LS_UTM_PARAMS_FIELD);
}

export function readCanonicalUrl(): string | undefined {
  const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const href = link?.href;
  if (!href) {
    return undefined;
  }
  return cleanPageUrl(href);
}
