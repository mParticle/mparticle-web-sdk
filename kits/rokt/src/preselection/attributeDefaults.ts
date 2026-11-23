import {
  PRESELECT_SKIP_DEFAULT,
  type PreselectAlternateTargetPageIdentifiers,
  type PreselectAttributeDefault,
  type PreselectClientType,
  type PreselectionConfigEntry,
} from './preselectionConfig';
import { getEntryTargetPageIdentifiers, isIdentifier } from './preselectionConfigSetting';
import { readPreselectPaymentPick } from './preselectArrivalStorage';
import { type PreselectDiagnosticDetails } from './diagnosticTiming';
import { classifyPaymentFamily, type PaymentFamily } from '../paymentFamily';
import { isEmpty, isObject, isString, readOwnValue } from '../utils';
import { type PreselectHost } from './hostChecks';
import { getPreselectionEntries } from './entries';
import { isPreselectEmailKey } from './emailKeys';

// Names, comma-joined, the keys a speculative call sent with the entry's default. A name goes out only when it matches
// PRESELECT_DEFAULTED_NAME_PATTERN, and at most PRESELECT_DEFAULTED_MAX_NAMES of them. The persistence deny list keeps
// it off every later call.
export const PRESELECT_DEFAULTED_ATTRIBUTE = 'rokt.preselectdefaulted';
const PRESELECT_DEFAULTED_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_.]{0,63}$/;
const PRESELECT_DEFAULTED_MAX_NAMES = 16;

// The entry a target page's own call goes to. A call matches an entry that names targetPageIdentifierAttribute only
// when its identifier equals the call's own value of that attribute, never by targetPageIdentifier, and any other entry
// by targetPageIdentifier. A call that matches more than one entry goes to none: two entries' attributes can hold the
// same value, or one's value can equal another's targetPageIdentifier, and nothing in the call says which entry it is
// for. It then carries no entry's cache keys and reports no arrival, so it never meets another entry's early call.
export function findPreselectionConfigByIdentifier(
  accountId: string | null | undefined,
  identifier: unknown,
  attributes?: Record<string, unknown>,
): PreselectionConfigEntry | undefined {
  if (!accountId || !isString(identifier)) {
    return undefined;
  }

  const matches = getPreselectionEntries(accountId).filter((entry) =>
    entry.targetPageIdentifierAttribute === undefined
      ? getEntryTargetPageIdentifiers(entry).includes(identifier)
      : attributes !== undefined && getCallIdentifier(entry, attributes) === identifier,
  );
  return matches.length === 1 ? matches[0] : undefined;
}

// The value under key in any casing: the exact spelling first, else the one value every other spelling agrees on.
export function readValueInAnyCasing(source: Record<string, unknown>, key: string): unknown {
  const exact = readOwnValue(source, key);
  if (!isEmpty(exact)) {
    return exact;
  }
  const lowerKey = key.toLowerCase();
  const values = Object.keys(source)
    .filter((name) => name.toLowerCase() === lowerKey && !isEmpty(source[name]))
    .map((name) => source[name]);
  return values.length > 0 && values.every((value) => value === values[0]) ? values[0] : undefined;
}

const kitLoadedAt = Date.now();
// The latest page view or pathname trigger on each entry's route on this page, by account and entry key.
const latestEntryPageViewAt = new Map<string, number>();

export function recordEntryPageView(configEntry: PreselectionConfigEntry, at: number): void {
  const key = `${configEntry.accountId}:${configEntry.targetPageIdentifier}`;
  latestEntryPageViewAt.set(key, Math.max(latestEntryPageViewAt.get(key) ?? 0, at));
}

// The payment pick an entry's call reads. An entry with alternate target pages counts a pick only when made since the
// route's latest page view on this page, so one left by an abandoned checkout never sends a later one to another page
// or fills that call's payment default. Other entries read the pick as before.
export function readEntryPaymentPick(configEntry: PreselectionConfigEntry): PaymentFamily | undefined {
  const { accountId, targetPageIdentifier } = configEntry;
  if (!configEntry.alternateTargetPageIdentifiers) {
    return readPreselectPaymentPick(accountId, targetPageIdentifier);
  }
  const since = latestEntryPageViewAt.get(`${accountId}:${targetPageIdentifier}`) ?? kitLoadedAt;
  return readPreselectPaymentPick(accountId, targetPageIdentifier, since);
}

// The alternate target page this call names: the shopper's payment pick first, then the page's host, then the device.
function pickAlternateTargetPageIdentifier(
  configEntry: PreselectionConfigEntry,
  alternates: PreselectAlternateTargetPageIdentifiers,
): string | undefined {
  return alternateTargetPageIdentifierFor(
    alternates,
    alternates.byPaymentPick ? readEntryPaymentPick(configEntry) : undefined,
  );
}

export function alternateTargetPageIdentifierFor(
  alternates: PreselectAlternateTargetPageIdentifiers,
  paymentPick: PaymentFamily | undefined,
): string | undefined {
  const { byPaymentPick, byHostname, byClientType } = alternates;
  const clientType = byClientType ? getPreselectClientType(navigator.userAgent) : undefined;
  return [
    byPaymentPick && paymentPick ? readOwnValue(byPaymentPick, paymentPick) : undefined,
    byHostname ? readOwnValue(byHostname, window.location.hostname) : undefined,
    byClientType && clientType ? readOwnValue(byClientType, clientType) : undefined,
  ].find(isString);
}

// The identifier a call for this entry goes out under: its own value of targetPageIdentifierAttribute, trimmed, when
// the entry names one, else the alternate target page it picks, else targetPageIdentifier. Undefined when that value is
// not a non-empty string free of whitespace and control characters once trimmed, so no call goes out under it.
export function getCallIdentifier(
  configEntry: PreselectionConfigEntry,
  attributes: Record<string, unknown>,
): string | undefined {
  const key = configEntry.targetPageIdentifierAttribute;
  if (key === undefined) {
    const alternates = configEntry.alternateTargetPageIdentifiers;
    return (
      (alternates ? pickAlternateTargetPageIdentifier(configEntry, alternates) : undefined) ??
      configEntry.targetPageIdentifier
    );
  }
  const value = readValueInAnyCasing(attributes, key);
  if (!isString(value)) {
    return undefined;
  }
  const trimmed = value.trim();
  return isIdentifier(trimmed) ? trimmed : undefined;
}

// Applies the fills getPreselectAttributeDefaults chose, dropping each filled key's other spellings. Applied to the
// speculative call only, so a guess is never cached as the shopper's own value.
export function applyPreselectAttributeDefaults(
  attributes: Record<string, unknown>,
  fills: Record<string, string> | undefined,
): Record<string, unknown> {
  if (!fills) {
    return attributes;
  }

  const filledKeys = new Set(Object.keys(fills).map((key) => key.toLowerCase()));
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (!filledKeys.has(key.toLowerCase())) {
      result[key] = value;
    }
  }
  return { ...result, ...fills };
}

// Only the exact 'widened' variant counts; any other value, or none, is a standard tab.
export function isWidenedTab(host: PreselectHost): boolean {
  return host.getPreselectVariant() === 'widened';
}

// The Rokt launcher's device classes from the user agent: its mobile operating systems first, then the desktop ones
// it recognises. A user agent naming neither has no class, so only a default's plain value applies to it.
const MOBILE_OS_PATTERN = /iP(hone|od|ad)|Android|BlackBerry|BB10|IEMobile|Kindle/;
const DESKTOP_OS_PATTERN =
  /Win(dows|16|95|98|CE)|Pocket Internet Explorer|OpenBSD|SunOS|CrOS|Linux|X11|Mac_PowerPC|Macintosh|QNX|BeOS|OS\/2/;

export function getPreselectClientType(userAgent: string): PreselectClientType | undefined {
  if (MOBILE_OS_PATTERN.test(userAgent)) {
    return 'MobileWeb';
  }
  return DESKTOP_OS_PATTERN.test(userAgent) ? 'DesktopWeb' : undefined;
}

// A device's skip wins over everything; otherwise the shopper's payment pick, then the page's host, then the device,
// then the plain value.
export function resolvePreselectAttributeDefault(
  attributeDefault: string | PreselectAttributeDefault,
  paymentPick: PaymentFamily | undefined,
): string | undefined {
  if (isString(attributeDefault)) {
    return attributeDefault;
  }

  const clientType = getPreselectClientType(navigator.userAgent);
  const byClientType = clientType ? attributeDefault.byClientType?.[clientType] : undefined;
  if (byClientType === PRESELECT_SKIP_DEFAULT) {
    return undefined;
  }
  const byPaymentPick =
    paymentPick && attributeDefault.byPaymentPick
      ? (readOwnValue(attributeDefault.byPaymentPick, paymentPick) as string | undefined)
      : undefined;
  const byHostname = attributeDefault.byHostname
    ? (readOwnValue(attributeDefault.byHostname, window.location.hostname) as string | undefined)
    : undefined;
  return byPaymentPick ?? byHostname ?? byClientType ?? attributeDefault.value;
}

// Read only for an entry with a default that names payment picks, so no other entry touches the tab's record.
function readDefaultPaymentPick(configEntry: PreselectionConfigEntry): PaymentFamily | undefined {
  const defaults = Object.values(configEntry.preselectAttributeDefaults ?? {});
  return defaults.some((attributeDefault) => isObject(attributeDefault) && attributeDefault.byPaymentPick)
    ? readEntryPaymentPick(configEntry)
    : undefined;
}

function getHeldKeys(source: Record<string, unknown>): Set<string> {
  return new Set(
    Object.keys(source)
      .filter((key) => !isEmpty(source[key]))
      .map((key) => key.toLowerCase()),
  );
}

// Defaults with explicit matching or skipping rules apply to both arms; other defaults remain standard-only.
function defaultAppliesToTab(host: PreselectHost, attributeDefault: string | PreselectAttributeDefault): boolean {
  return (
    !isWidenedTab(host) ||
    (!isString(attributeDefault) && !!(attributeDefault.matchGroups || attributeDefault.skipValues))
  );
}

// The defaults this call fills, keyed as the entry spells them: each key these attributes, the call's identities
// and its saved attributes leave empty in every casing, since applying a fill drops the key's other spellings. A
// saved value counts only where the default does not skip remembered values.
export function getPreselectAttributeDefaults(
  host: PreselectHost,
  configEntry: PreselectionConfigEntry,
  attributes: Record<string, unknown>,
): Record<string, string> {
  const defaults = configEntry.preselectAttributeDefaults;
  if (!defaults) {
    return {};
  }

  const heldKeys = new Set([...getHeldKeys(host.getUserIdentities()), ...getHeldKeys(attributes)]);
  const savedKeys = getHeldKeys(host.userAttributes ?? {});
  const paymentPick = readDefaultPaymentPick(configEntry);
  const fills: Record<string, string> = {};
  for (const key of Object.keys(defaults)) {
    const lowerKey = key.toLowerCase();
    // The parser bars email and emailsha256, but only the kit knows the account's mapped hashed-email key, which a
    // guess would go out as just the same.
    if (
      !defaultAppliesToTab(host, defaults[key]) ||
      isPreselectEmailKey(key, host.mappedEmailSha256Key) ||
      heldKeys.has(lowerKey) ||
      (savedKeys.has(lowerKey) && !skipsRememberedValues(host, configEntry, key))
    ) {
      continue;
    }
    const value = resolvePreselectAttributeDefault(defaults[key], paymentPick);
    if (value !== undefined) {
      fills[key] = value;
    }
  }
  return fills;
}

// Only while the key takes a default on this tab: with none to send, a saved value still beats an empty key.
export function skipsRememberedValues(host: PreselectHost, configEntry: PreselectionConfigEntry, key: string): boolean {
  const attributeDefault = readOwnValue(configEntry.preselectAttributeDefaults ?? {}, key);
  return (
    isObject(attributeDefault) &&
    attributeDefault.skipRemembered === true &&
    defaultAppliesToTab(host, attributeDefault as PreselectAttributeDefault) &&
    !isPreselectEmailKey(key, host.mappedEmailSha256Key) &&
    resolvePreselectAttributeDefault(
      attributeDefault as PreselectAttributeDefault,
      readDefaultPaymentPick(configEntry),
    ) !== undefined
  );
}

// The defaulted key whose value the call would send, under any spelling and in any casing, is one its default skips.
// Read from what the call sends, after every source, filter and fill, so a stale value the call drops never stops it.
// Any spelling is enough, and a wrong skip costs only the speed-up, as the target page makes its own call. The parser
// keeps a default's own fills out of its skipValues, so a guess never stops a call.
export function findSkippedDefaultKey(
  configEntry: PreselectionConfigEntry,
  outgoing: Record<string, unknown>,
): string | undefined {
  const defaults = configEntry.preselectAttributeDefaults ?? {};
  return Object.keys(defaults).find((key) => {
    const attributeDefault = defaults[key];
    if (isString(attributeDefault) || !attributeDefault.skipValues) {
      return false;
    }
    const skipValues = attributeDefault.skipValues.map((value) => value.toLowerCase());
    return Object.keys(outgoing).some((name) => {
      const value = outgoing[name];
      return (
        name.toLowerCase() === key.toLowerCase() &&
        (isString(value) || typeof value === 'number' || typeof value === 'boolean') &&
        skipValues.includes(String(value).toLowerCase())
      );
    });
  });
}

// Reported only when the launcher names one of the two arms, so the line never carries anything else it holds.
export function preselectVariantDetail(host: PreselectHost): PreselectDiagnosticDetails {
  const variant = host.getPreselectVariant();
  return variant === 'widened' || variant === 'standard' ? { variant } : {};
}

// The launcher compares identityKeys strictly on arrival, so a defaulted key the confirmation page leaves empty makes
// the live call instead of keeping an offer picked on a guess. Only on an entry that already declares identityKeys:
// the launcher treats a call that sent every strict key as identified and then forgives keys that call never sent,
// which a defaulted key alone would switch on. A key matched by payment family whose value names a family stays out,
// because the launcher never reads a match token on an identity key; its token keeps it strict instead (see
// getPreselectCacheMatchTokens).
export function getPreselectCacheIdentityKeys(
  configEntry: PreselectionConfigEntry | undefined,
  fills: Record<string, string> | undefined,
  outgoing: Record<string, unknown>,
): string[] | undefined {
  const identityKeys = configEntry?.identityKeys;
  if (!identityKeys?.length || !fills) {
    return identityKeys;
  }
  const defaults = configEntry?.preselectAttributeDefaults;
  const defaultedKeys = getSentPreselectDefaults(fills, outgoing).filter(
    (key) => !(matchesByPaymentFamily(defaults?.[key]) && classifyPaymentFamily(fills[key]) !== undefined),
  );
  return defaultedKeys.length > 0 ? [...identityKeys, ...defaultedKeys] : identityKeys;
}

// For each key the call still sends with its default, the group holding the filled value, so the launcher keeps the
// cached offers when the target page sends any value in it. A fill in no group is left to the exact compare.
export function getPreselectCacheMatchValues(
  configEntry: PreselectionConfigEntry | undefined,
  fills: Record<string, string> | undefined,
  outgoing: Record<string, unknown>,
): Record<string, string[]> | undefined {
  const defaults = configEntry?.preselectAttributeDefaults;
  if (!defaults || !fills) {
    return undefined;
  }
  const matchValues: Record<string, string[]> = {};
  getSentPreselectDefaults(fills, outgoing).forEach((key) => {
    const attributeDefault = defaults[key];
    const group = isString(attributeDefault)
      ? undefined
      : attributeDefault?.matchGroups?.find((matchGroup) => matchGroup.includes(fills[key]));
    if (group) {
      matchValues[key] = group;
    }
  });
  return Object.keys(matchValues).length > 0 ? matchValues : undefined;
}

// Sent by a target page call that has no value the launcher can read under a family-matched key. Only target page calls
// send it, so it never equals a cached token.
const NO_PAYMENT_VALUE_TOKEN = 'none';

function matchesByPaymentFamily(attributeDefault: string | PreselectAttributeDefault | undefined): boolean {
  return !isString(attributeDefault) && attributeDefault?.matchPaymentFamily === true;
}

// For each key whose default matches by payment family, the family of the value this call sends, on the speculative
// call and the target page call alike, so the launcher keeps the cached offers for any value of that family. A value
// that names no family sends no token and is left to the exact compare. A target page call with no value under the key,
// or one that also sends it under another spelling, sends NO_PAYMENT_VALUE_TOKEN, so an offer picked for one payment
// type is never kept when the target page names none.
export function getPreselectCacheMatchTokens(
  configEntry: PreselectionConfigEntry | undefined,
  outgoing: Record<string, unknown>,
  isTargetPageCall: boolean,
): Record<string, string> | undefined {
  const defaults = configEntry?.preselectAttributeDefaults;
  if (!defaults) {
    return undefined;
  }
  const matchTokens: Record<string, string> = {};
  Object.keys(defaults).forEach((key) => {
    if (!matchesByPaymentFamily(defaults[key])) {
      return;
    }
    const value = readOwnValue(outgoing, key);
    const isUnreadable = hasOtherSpelling(outgoing, key) || isEmpty(value);
    const family = isUnreadable ? undefined : classifyPaymentFamily(value);
    if (family) {
      matchTokens[key] = family;
    } else if (isUnreadable && isTargetPageCall) {
      matchTokens[key] = NO_PAYMENT_VALUE_TOKEN;
    }
  });
  return Object.keys(matchTokens).length > 0 ? matchTokens : undefined;
}

// The keys the call still sends with their default once filters and later sources have had their say. A later source
// that sends a value for the key under another spelling replaces the default, so that key no longer counts.
function getSentPreselectDefaults(fills: Record<string, string>, outgoing: Record<string, unknown>): string[] {
  return Object.keys(fills).filter(
    (key) => readOwnValue(outgoing, key) === fills[key] && !hasOtherSpelling(outgoing, key),
  );
}

// Whether the call also sends a non-empty value for the key under another spelling.
function hasOtherSpelling(outgoing: Record<string, unknown>, key: string): boolean {
  return Object.keys(outgoing).some(
    (name) => name !== key && name.toLowerCase() === key.toLowerCase() && !isEmpty(outgoing[name]),
  );
}

// The PRESELECT_DEFAULTED_ATTRIBUTE value for a speculative call, or undefined when it sends no default.
export function getPreselectDefaultedMarker(
  fills: Record<string, string> | undefined,
  outgoing: Record<string, unknown>,
): string | undefined {
  if (!fills) {
    return undefined;
  }
  const names = getSentPreselectDefaults(fills, outgoing)
    .filter((key) => PRESELECT_DEFAULTED_NAME_PATTERN.test(key))
    .slice(0, PRESELECT_DEFAULTED_MAX_NAMES);
  return names.length > 0 ? names.join(',') : undefined;
}

export function getPreselectCacheMatchKeys(configEntry: PreselectionConfigEntry): string[] {
  const defaultKeys = Object.keys(configEntry.preselectAttributeDefaults ?? {});
  return [...configEntry.attributeKeys, ...defaultKeys.filter((key) => !configEntry.attributeKeys.includes(key))];
}
