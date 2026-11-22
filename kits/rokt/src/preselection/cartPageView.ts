import { type PreselectionConfigEntry } from './preselectionConfig';
import { djb2, isEmpty, isString } from '../utils';
import { type PreselectHost } from './hostChecks';
import { getCartIntentEntries, stripTrailingSlash } from './entries';
import { getPreselectCacheMatchKeys } from './attributeDefaults';

const EMPTY_CART_VALUES = ['', '0', '[]', '{}', 'false', 'null'];

// Whether a cart attribute holds items: a non-empty list, or a value other than an empty marker. A JSON string that
// parses to an empty list counts as empty.
export function cartHoldsItems(value: unknown): boolean {
  if (isEmpty(value)) return false;
  if (Array.isArray(value)) return true;
  const text = String(value).trim();
  if (EMPTY_CART_VALUES.includes(text.toLowerCase())) return false;
  try {
    const parsed: unknown = JSON.parse(text);
    return !Array.isArray(parsed) || parsed.length > 0;
  } catch {
    return true;
  }
}

// The account's one cartIntent entry, when it names a cart attribute.
export function getCartPageViewEntry(accountId: string | null | undefined): PreselectionConfigEntry | undefined {
  const entries = accountId ? getCartIntentEntries(accountId) : [];
  return entries.length === 1 && entries[0].cartUserAttribute ? entries[0] : undefined;
}

// Whether the account has a cart page view, so an add-to-cart click can be remembered for it.
export function hasPreselectCartPageView(accountId: string | null | undefined): boolean {
  return getCartPageViewEntry(accountId) !== undefined;
}

// Whether a user attribute is the account's cart attribute, in any casing, so setting it retries a waiting page view.
export function isPreselectCartAttributeKey(accountId: string | null | undefined, key: string): boolean {
  const cartKey = getCartPageViewEntry(accountId)?.cartUserAttribute;
  return isString(cartKey) && cartKey.toLowerCase() === key.toLowerCase();
}

// The cart attribute only gates the page view, so a pre-selection call leaves it out unless the entry it fires for
// matches on it.
export function withoutPreselectCartGateAttribute(
  accountId: string | null | undefined,
  attributes: Record<string, unknown>,
  dispatchedEntry: PreselectionConfigEntry | undefined,
): Record<string, unknown> {
  const cartKey = getCartPageViewEntry(accountId)?.cartUserAttribute?.toLowerCase();
  if (
    !cartKey ||
    (dispatchedEntry && getPreselectCacheMatchKeys(dispatchedEntry).some((key) => key.toLowerCase() === cartKey))
  ) {
    return attributes;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (key.toLowerCase() !== cartKey) {
      result[key] = value;
    }
  }
  return result;
}

// The cart attribute in any casing, read from the user mParticle keeps for this connection.
export function readCartAttribute(host: PreselectHost, cartKey: string): unknown {
  const attributes: Record<string, unknown> = host.filteredUser?.getAllUserAttributes?.() ?? {};
  const key = Object.keys(attributes).find((name) => name.toLowerCase() === cartKey.toLowerCase());
  return key === undefined ? undefined : attributes[key];
}

// What tells the target page apart from other pages on its path: the path, the query, and a hash route (`#/…`, `#!…`,
// or a fragment with a `/` before any `&` or `?`). A plain anchor such as `#payment` names a part of the page, not a page.
export function targetPageKey(pathname: string): string {
  const { search, hash } = window.location;
  const isRoute = /^#!|^#[^?&]*\//.test(hash);
  return stripTrailingSlash(pathname) + search + (isRoute ? hash : '');
}

// A hash of the cart attribute, so a page view can tell whether the cart changed since the shopper reached the target.
// Undefined for a value JSON can't hold, which then holds nothing off.
export function digestCart(cart: unknown): number | undefined {
  try {
    return djb2(isString(cart) ? cart : (JSON.stringify(cart) ?? ''));
  } catch {
    return undefined;
  }
}
