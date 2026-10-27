import type { PreselectionConfigEntry } from './preselectionConfig';
import { isObject, isString, parseKitSettingJson } from './utils';

const SUPPORTED_SCHEMA_VERSION = 1;

// Matches the limit enforced when the setting is saved, and keeps the hold well under the 2^31-1 ms timer cap.
const MAX_DISPATCH_DELAY_MS = 60000;

export type PreselectionConfigSettingResult = { entries: PreselectionConfigEntry[] } | { error: string };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value !== '';
}

const CLIENT_TYPES = ['DesktopWeb', 'MobileWeb'];

// Fields this kit does not know are ignored, as they are on the entry, so a later kit can add one.
function isAttributeDefault(value: unknown): boolean {
  if (isNonEmptyString(value)) {
    return true;
  }
  if (!isObject(value)) {
    return false;
  }

  const { byClientType, byHostname, skipRemembered } = value;
  if (value.value !== undefined && !isNonEmptyString(value.value)) {
    return false;
  }
  if (
    byClientType !== undefined &&
    (!isObject(byClientType) ||
      !Object.entries(byClientType).every(
        ([type, typeValue]) => CLIENT_TYPES.includes(type) && isNonEmptyString(typeValue),
      ))
  ) {
    return false;
  }
  // A page's host always reads in lower case, so any other key could never match.
  if (
    byHostname !== undefined &&
    (!isObject(byHostname) ||
      !Object.entries(byHostname).every(
        ([host, hostValue]) => host !== '' && host === host.toLowerCase() && isNonEmptyString(hostValue),
      ))
  ) {
    return false;
  }
  if (skipRemembered !== undefined && typeof skipRemembered !== 'boolean') {
    return false;
  }
  return value.value !== undefined || byClientType !== undefined || byHostname !== undefined;
}

// Reasons name the field only, never its value, since they ship over the logging pipeline.
function parseEntry(accountId: string, raw: unknown): PreselectionConfigEntry | string {
  if (!isObject(raw)) {
    return 'not an object';
  }

  const { pathname, targetPageIdentifier, attributeKeys, optionalAttributeKeys, identityKeys, dispatchDelayMs } = raw;
  const { triggerEventNames, releaseHoldOnRouteChange, readEmailInput, cartIntent, cartUserAttribute } = raw;
  const { checkoutStepIntent } = raw;
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
  if (checkoutStepIntent !== undefined && typeof checkoutStepIntent !== 'boolean') {
    return 'checkoutStepIntent';
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
      (isStringArray(widenedOptionalKeys) && widenedOptionalKeys.some((key) => key.toLowerCase() === 'email')) ||
      // A default makes its key optional too, and would send a guessed email as the shopper's.
      (isObject(defaults) && Object.keys(defaults).some((key) => key.toLowerCase() === 'email')))
  ) {
    return 'readEmailInput';
  }
  if (raw.preselectAttributeDefaults !== undefined && legacyDefaults !== undefined) {
    return 'preselectAttributeDefaults';
  }
  // No default on an email or identity key, in any casing, which would send a guess as the shopper's own. Under the
  // older name, a value the released kit accepted as an override is dropped instead, so a setting that worked keeps
  // its entries.
  let parsedDefaults: Record<string, unknown> | undefined;
  if (defaults !== undefined) {
    const defaultsReason =
      raw.preselectAttributeDefaults !== undefined ? 'preselectAttributeDefaults' : 'preselectAttributeOverrides';
    if (!isObject(defaults)) {
      return defaultsReason;
    }
    const identityKeysLower = (isStringArray(identityKeys) ? identityKeys : []).map((key) => key.toLowerCase());
    const isValidDefault = ([key, value]: [string, unknown]): boolean =>
      isAttributeDefault(value) &&
      attributeKeys.includes(key) &&
      !['email', 'emailsha256'].includes(key.toLowerCase()) &&
      !identityKeysLower.includes(key.toLowerCase());
    const wasAcceptedOverride = ([key, value]: [string, unknown]): boolean =>
      legacyDefaults !== undefined &&
      isString(value) &&
      attributeKeys.includes(key) &&
      !(isStringArray(identityKeys) && identityKeys.includes(key));
    const defaultEntries = Object.entries(defaults);
    if (!defaultEntries.every((defaultEntry) => isValidDefault(defaultEntry) || wasAcceptedOverride(defaultEntry))) {
      return defaultsReason;
    }
    parsedDefaults = Object.fromEntries(defaultEntries.filter(isValidDefault));
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
  if (checkoutStepIntent !== undefined) {
    entry.checkoutStepIntent = checkoutStepIntent;
  }
  if (readEmailInput !== undefined) {
    entry.readEmailInput = readEmailInput;
  }
  if (parsedDefaults !== undefined) {
    entry.preselectAttributeDefaults = parsedDefaults as PreselectionConfigEntry['preselectAttributeDefaults'];
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
