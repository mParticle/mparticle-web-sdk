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
  const { triggerEventNames, releaseHoldOnRouteChange, readEmailInput, cartIntent, cartUserAttribute } = raw;
  // The older name for the same field, read until every setting has moved to the new one.
  const legacyDefaults = raw.preselectAttributeOverrides;
  const defaults = raw.preselectAttributeDefaults !== undefined ? raw.preselectAttributeDefaults : legacyDefaults;
  const widenedOptionalKeys = raw.widenedOptionalAttributeKeys;

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
    widenedOptionalKeys !== undefined &&
    (!isStringArray(widenedOptionalKeys) || !widenedOptionalKeys.every((key) => attributeKeys.includes(key)))
  ) {
    return 'widenedOptionalAttributeKeys';
  }
  if (
    identityKeys !== undefined &&
    (!isStringArray(identityKeys) ||
      identityKeys.length === 0 ||
      !identityKeys.every((key) => attributeKeys.includes(key)))
  ) {
    return 'identityKeys';
  }
  // A widened tab can fire without its optional and widened keys, in any casing. The launcher accepts a key that
  // call left out only when it carried every identity key, so the entry needs identityKeys outside both lists.
  if (isStringArray(widenedOptionalKeys) && widenedOptionalKeys.length > 0) {
    const relaxedKeys = (isStringArray(optionalAttributeKeys) ? optionalAttributeKeys : [])
      .concat(widenedOptionalKeys)
      .map((key) => key.toLowerCase());
    if (!isStringArray(identityKeys) || identityKeys.some((key) => relaxedKeys.includes(key.toLowerCase()))) {
      return 'identityKeys';
    }
  }
  if (
    dispatchDelayMs !== undefined &&
    (!Number.isInteger(dispatchDelayMs) ||
      (dispatchDelayMs as number) < 0 ||
      (dispatchDelayMs as number) > MAX_DISPATCH_DELAY_MS)
  ) {
    return 'dispatchDelayMs';
  }
  if (releaseHoldOnRouteChange !== undefined && typeof releaseHoldOnRouteChange !== 'boolean') {
    return 'releaseHoldOnRouteChange';
  }
  if (cartIntent !== undefined && typeof cartIntent !== 'boolean') {
    return 'cartIntent';
  }
  if (
    readEmailInput !== undefined &&
    (typeof readEmailInput !== 'boolean' ||
      !attributeKeys.includes('email') ||
      (isStringArray(optionalAttributeKeys) && optionalAttributeKeys.includes('email')) ||
      // The runtime matches optional keys in any casing, so an 'Email' key would make email optional too.
      (isStringArray(widenedOptionalKeys) && widenedOptionalKeys.some((key) => key.toLowerCase() === 'email')))
  ) {
    return 'readEmailInput';
  }
  if (raw.preselectAttributeDefaults !== undefined && legacyDefaults !== undefined) {
    return 'preselectAttributeDefaults';
  }
  if (
    defaults !== undefined &&
    (!isObject(defaults) ||
      !Object.entries(defaults).every(
        ([key, value]) =>
          isString(value) && attributeKeys.includes(key) && !(isStringArray(identityKeys) && identityKeys.includes(key)),
      ))
  ) {
    return raw.preselectAttributeDefaults !== undefined ? 'preselectAttributeDefaults' : 'preselectAttributeOverrides';
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
  if (widenedOptionalKeys !== undefined) {
    entry.widenedOptionalAttributeKeys = widenedOptionalKeys;
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
  if (readEmailInput !== undefined) {
    entry.readEmailInput = readEmailInput;
  }
  if (defaults !== undefined) {
    entry.preselectAttributeDefaults = defaults as Record<string, string>;
  }
  if (triggerEventNames !== undefined) {
    entry.triggerEventNames = triggerEventNames;
  }
  if (cartIntent !== undefined) {
    entry.cartIntent = cartIntent;
  }
  // Kept only as a non-empty string on a cartIntent entry; any other value is dropped rather than rejected.
  if (cartIntent === true && isString(cartUserAttribute) && cartUserAttribute !== '') {
    entry.cartUserAttribute = cartUserAttribute;
  }
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
