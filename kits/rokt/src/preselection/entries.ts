import { PRESELECTION_CONFIG, type PreselectionConfigEntry } from './preselectionConfig';
import { parsePreselectionConfigSetting } from './preselectionConfigSetting';
import { isEmpty } from '../utils';

const settingEntriesByAccount = new Map<string, PreselectionConfigEntry[]>();

// An account with a valid preselectionConfig setting uses only its entries; otherwise it keeps
// PRESELECTION_CONFIG. Returns why a present setting was rejected, or undefined.
export function applyPreselectionConfigSetting(accountId: string, setting: string | undefined): string | undefined {
  settingEntriesByAccount.delete(accountId);
  if (!setting) {
    return undefined;
  }

  const result = parsePreselectionConfigSetting(accountId, setting);
  if ('error' in result) {
    return result.error;
  }
  settingEntriesByAccount.set(accountId, result.entries);
  return undefined;
}

export function getPreselectionEntries(accountId: string): PreselectionConfigEntry[] {
  return settingEntriesByAccount.get(accountId) ?? PRESELECTION_CONFIG.filter((entry) => entry.accountId === accountId);
}

export function getEntryPathnames(entry: PreselectionConfigEntry): string[] {
  return entry.pathnames ? [entry.pathname, ...entry.pathnames] : [entry.pathname];
}

export function findMatchingEntryPathname(entry: PreselectionConfigEntry, pathname: string): string | undefined {
  return getEntryPathnames(entry).find((configuredPathname) => pathnameMatches(configuredPathname, pathname));
}

export function entryMatchesPathname(entry: PreselectionConfigEntry, pathname: string): boolean {
  return findMatchingEntryPathname(entry, pathname) !== undefined;
}

// A '*' in a configured pathname matches exactly one non-empty path segment. Segment counts
// must be equal, so the pattern is anchored at both ends and cannot widen to another page.
function pathnameMatches(configuredPathname: string, pathname: string): boolean {
  const normalizedConfigured = stripTrailingSlash(configuredPathname);
  const normalizedPathname = stripTrailingSlash(pathname);

  if (!normalizedConfigured.includes('*')) {
    return normalizedConfigured === normalizedPathname;
  }

  const configuredSegments = normalizedConfigured.split('/');
  const pathnameSegments = normalizedPathname.split('/');
  if (configuredSegments.length !== pathnameSegments.length) {
    return false;
  }

  return configuredSegments.every((segment, index) =>
    segment === '*' ? pathnameSegments[index] !== '' : segment === pathnameSegments[index],
  );
}

// A site's own router may or may not add a trailing slash, so one is stripped from both
// sides before any compare. '/' itself is left alone: it has no slash left to strip.
export function stripTrailingSlash(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

// Diagnostics only, never a trigger: the trigger path in any casing, behind one leading segment
// (a locale prefix), or followed by more segments.
export function nearlyMatches(configuredPathname: string, pathname: string): boolean {
  const configured = stripTrailingSlash(configuredPathname).toLowerCase();
  const segments = stripTrailingSlash(pathname).toLowerCase().split('/');
  const configuredLength = configured.split('/').length;
  return (
    pathnameMatches(configured, segments.join('/')) ||
    pathnameMatches(configured, ['', ...segments.slice(2)].join('/')) ||
    (segments.length > configuredLength &&
      pathnameMatches(configured, segments.slice(0, configuredLength).join('/')))
  );
}

export function getCartIntentEntries(accountId: string): PreselectionConfigEntry[] {
  return getPreselectionEntries(accountId).filter((entry) => entry.cartIntent === true);
}

export function findPreselectionConfig(
  accountId: string | null | undefined,
  pathname: string,
): PreselectionConfigEntry | undefined {
  if (!accountId) {
    return undefined;
  }

  return getPreselectionEntries(accountId).find((entry) => entryMatchesPathname(entry, pathname));
}

// The attributes a target-page call is matched to its entry on: the saved user attributes with the call's own laid over
// them, as collectAttributes reads the early call's target value. A call's non-empty value under any spelling of a key
// replaces every saved spelling of it, so the call's value always wins and a saved value stands only where it has none.
export function getPreselectLookupAttributes(
  savedAttributes: Record<string, unknown>,
  callAttributes: Record<string, unknown>,
): Record<string, unknown> {
  const callNames = new Set(
    Object.keys(callAttributes)
      .filter((name) => !isEmpty(callAttributes[name]))
      .map((name) => name.toLowerCase()),
  );
  const merged: Record<string, unknown> = {};
  for (const name of Object.keys(savedAttributes)) {
    if (!callNames.has(name.toLowerCase())) {
      merged[name] = savedAttributes[name];
    }
  }
  for (const name of Object.keys(callAttributes)) {
    if (!isEmpty(callAttributes[name])) {
      merged[name] = callAttributes[name];
    }
  }
  return merged;
}

// True when an entry of the account names targetPageIdentifierAttribute, the only kind of entry a target page's call is
// matched to on its attributes.
export function usesTargetPageIdentifierAttribute(accountId: string | null | undefined): boolean {
  return (
    !!accountId && getPreselectionEntries(accountId).some((entry) => entry.targetPageIdentifierAttribute !== undefined)
  );
}

// The entry a fire's records name. A fire keys them by targetPageIdentifier, whatever identifier its call carries, so
// this is the entry the fire was for.
export function findPreselectionEntryByKey(
  accountId: string | null | undefined,
  key: string | undefined,
): PreselectionConfigEntry | undefined {
  if (!accountId || key === undefined) {
    return undefined;
  }
  return getPreselectionEntries(accountId).find((entry) => entry.targetPageIdentifier === key);
}

export function hasPreselectionConfigForAccount(accountId: string | null | undefined): boolean {
  if (!accountId) {
    return false;
  }

  return getPreselectionEntries(accountId).length > 0;
}

export function hasEmailInputEntry(accountId: string | null | undefined): boolean {
  return !!accountId && getPreselectionEntries(accountId).some((entry) => entry.readEmailInput === true);
}
