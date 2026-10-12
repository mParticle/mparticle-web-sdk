import type { PreselectionConfigEntry } from './preselectionConfig';
import { isObject, isString, parseKitSettingJson } from './utils';

const SUPPORTED_SCHEMA_VERSION = 1;

// Matches the limit enforced when the setting is saved, and keeps the hold well under the 2^31-1 ms timer cap.
const MAX_DISPATCH_DELAY_MS = 60000;

export type PreselectionConfigSettingResult = { entries: PreselectionConfigEntry[] } | { error: string };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

// Reasons name the field only, never its value, since they ship over the logging pipeline.
function parseEntry(accountId: string, raw: unknown): PreselectionConfigEntry | string {
  if (!isObject(raw)) {
    return 'not an object';
  }

  const { pathname, targetPageIdentifier, attributeKeys, optionalAttributeKeys, identityKeys, dispatchDelayMs } = raw;
  const { triggerEventNames, releaseHoldOnRouteChange, intentTrigger } = raw;
  const overrides = raw.preselectAttributeOverrides;

  if (raw.accountId !== undefined && raw.accountId !== accountId) {
    return 'accountId';
  }
  if (!isString(pathname) || !pathname.startsWith('/')) {
    return 'pathname';
  }
  if (!isString(targetPageIdentifier) || targetPageIdentifier === '') {
    return 'targetPageIdentifier';
  }
  if (!isStringArray(attributeKeys) || attributeKeys.length === 0) {
    return 'attributeKeys';
  }
  if (
    optionalAttributeKeys !== undefined &&
    (!isStringArray(optionalAttributeKeys) || !optionalAttributeKeys.every((key) => attributeKeys.includes(key)))
  ) {
    return 'optionalAttributeKeys';
  }
  if (
    identityKeys !== undefined &&
    (!isStringArray(identityKeys) ||
      identityKeys.length === 0 ||
      !identityKeys.every((key) => attributeKeys.includes(key)))
  ) {
    return 'identityKeys';
  }
  if (
    dispatchDelayMs !== undefined &&
    (!Number.isInteger(dispatchDelayMs) ||
      (dispatchDelayMs as number) < 0 ||
      (dispatchDelayMs as number) > MAX_DISPATCH_DELAY_MS)
  ) {
    return 'dispatchDelayMs';
  }
  if (intentTrigger !== undefined && intentTrigger !== 'observe' && intentTrigger !== 'fire') {
    return 'intentTrigger';
  }
  if (releaseHoldOnRouteChange !== undefined && typeof releaseHoldOnRouteChange !== 'boolean') {
    return 'releaseHoldOnRouteChange';
  }
  if (
    overrides !== undefined &&
    (!isObject(overrides) ||
      !Object.entries(overrides).every(
        ([key, value]) =>
          isString(value) && attributeKeys.includes(key) && !(isStringArray(identityKeys) && identityKeys.includes(key)),
      ))
  ) {
    return 'preselectAttributeOverrides';
  }
  if (
    triggerEventNames !== undefined &&
    (!isStringArray(triggerEventNames) ||
      triggerEventNames.length === 0 ||
      triggerEventNames.some((name) => name === ''))
  ) {
    return 'triggerEventNames';
  }

  const entry: PreselectionConfigEntry = { accountId, pathname, targetPageIdentifier, attributeKeys };
  if (optionalAttributeKeys !== undefined) {
    entry.optionalAttributeKeys = optionalAttributeKeys;
  }
  if (identityKeys !== undefined) {
    entry.identityKeys = identityKeys;
  }
  if (dispatchDelayMs !== undefined) {
    entry.dispatchDelayMs = dispatchDelayMs as number;
  }
  if (releaseHoldOnRouteChange !== undefined) {
    entry.releaseHoldOnRouteChange = releaseHoldOnRouteChange;
  }
  if (overrides !== undefined) {
    entry.preselectAttributeOverrides = overrides as Record<string, string>;
  }
  if (triggerEventNames !== undefined) {
    entry.triggerEventNames = triggerEventNames;
  }
  if (intentTrigger !== undefined) entry.intentTrigger = intentTrigger;
  return entry;
}

// Any invalid entry rejects the whole setting, so a partial config can never replace a working one.
export function parsePreselectionConfigSetting(accountId: string, setting: string): PreselectionConfigSettingResult {
  const payload = parseKitSettingJson(setting);
  if (payload === undefined) {
    return { error: 'invalid JSON' };
  }

  if (!isObject(payload)) {
    return { error: 'not an object' };
  }
  if (payload.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    return { error: 'schemaVersion' };
  }
  if (!Array.isArray(payload.entries)) {
    return { error: 'entries' };
  }

  const entries: PreselectionConfigEntry[] = [];
  for (let i = 0; i < payload.entries.length; i++) {
    const entry = parseEntry(accountId, payload.entries[i]);
    if (isString(entry)) {
      return { error: `entry ${i + 1} ${entry}` };
    }
    if (entries.some((existing) => existing.targetPageIdentifier === entry.targetPageIdentifier)) {
      return { error: `entry ${i + 1} targetPageIdentifier` };
    }
    entries.push(entry);
  }
  return { entries };
}
