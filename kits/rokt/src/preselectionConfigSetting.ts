import type { PreselectionConfigEntry } from './preselectionConfig';
import { isObject, isString } from './utils';

const SUPPORTED_SCHEMA_VERSION = 1;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function parseEntry(accountId: string, raw: unknown): PreselectionConfigEntry | undefined {
  if (!isObject(raw)) {
    return undefined;
  }

  const { pathname, targetPageIdentifier, attributeKeys, optionalAttributeKeys, dispatchDelayMs } = raw;
  const overrides = raw.preselectAttributeOverrides;

  if (raw.accountId !== undefined && raw.accountId !== accountId) {
    return undefined;
  }
  if (!isString(pathname) || !pathname.startsWith('/')) {
    return undefined;
  }
  if (!isString(targetPageIdentifier) || targetPageIdentifier === '') {
    return undefined;
  }
  if (!isStringArray(attributeKeys) || attributeKeys.length === 0) {
    return undefined;
  }
  if (
    optionalAttributeKeys !== undefined &&
    (!isStringArray(optionalAttributeKeys) || !optionalAttributeKeys.every((key) => attributeKeys.includes(key)))
  ) {
    return undefined;
  }
  if (dispatchDelayMs !== undefined && (typeof dispatchDelayMs !== 'number' || !(dispatchDelayMs >= 0))) {
    return undefined;
  }
  if (
    overrides !== undefined &&
    (!isObject(overrides) ||
      !Object.entries(overrides).every(([key, value]) => isString(value) && attributeKeys.includes(key)))
  ) {
    return undefined;
  }

  const entry: PreselectionConfigEntry = { accountId, pathname, targetPageIdentifier, attributeKeys };
  if (optionalAttributeKeys !== undefined) {
    entry.optionalAttributeKeys = optionalAttributeKeys;
  }
  if (dispatchDelayMs !== undefined) {
    entry.dispatchDelayMs = dispatchDelayMs;
  }
  if (overrides !== undefined) {
    entry.preselectAttributeOverrides = overrides as Record<string, string>;
  }
  return entry;
}

// Any invalid entry rejects the whole setting, so a partial config can never replace a working one.
export function parsePreselectionConfigSetting(
  accountId: string,
  setting: string,
): PreselectionConfigEntry[] | undefined {
  let payload: unknown;
  try {
    payload = JSON.parse(setting.replace(/&quot;/g, '"'));
  } catch {
    return undefined;
  }

  if (!isObject(payload) || payload.schemaVersion !== SUPPORTED_SCHEMA_VERSION || !Array.isArray(payload.entries)) {
    return undefined;
  }

  const entries: PreselectionConfigEntry[] = [];
  for (const raw of payload.entries) {
    const entry = parseEntry(accountId, raw);
    if (!entry) {
      return undefined;
    }
    entries.push(entry);
  }
  return entries;
}
