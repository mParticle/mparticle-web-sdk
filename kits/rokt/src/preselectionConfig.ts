export type PreselectClientType = 'DesktopWeb' | 'MobileWeb';

export const PRESELECT_SKIP_DEFAULT = 'skip';

export interface PreselectAttributeDefault {
  value?: string;
  // PRESELECT_SKIP_DEFAULT leaves the key empty on that device, whatever value or byHostname say.
  byClientType?: Partial<Record<PreselectClientType, string>>;
  // Keyed by the exact, lowercase host of the page the call fires from.
  byHostname?: Record<string, string>;
  // Fill even over a value saved from an earlier call, which the kit cannot tell from this page's own.
  skipRemembered?: boolean;
}

// Fallback for an account whose connection has no valid preselectionConfig kit setting.
export interface PreselectionConfigEntry {
  accountId: string;
  pathname: string;
  targetPageIdentifier: string;
  // Attributes that gate the dispatch and form the cache key. Include one only if it is
  // stable between checkout and the target page and is used to select offers; an attribute
  // that moves in between turns every arrival into a miss. Attributes on the
  // selectPlacements persistence deny list cannot survive a recovered dispatch, so they
  // miss on every recovery.
  attributeKeys: string[];
  // Keys that do not block the dispatch when unresolved. They stay in attributeKeys, so the cache
  // still matches on them and records an unresolved one as unset.
  optionalAttributeKeys?: string[];
  // Keys, listed in attributeKeys too, that are also optional on a tab the Rokt launcher marks with
  // the 'widened' pre-selection variant. Every other tab treats them as optionalAttributeKeys says.
  // A non-empty list needs identityKeys, none of them optional or widened in any casing.
  widenedOptionalAttributeKeys?: string[];
  // Keys, listed in attributeKeys too, that resolve from the user identity of the same name when no
  // attribute carries them. The launcher compares these strictly on arrival.
  identityKeys?: string[];
  // Opt-in: when no event, user attribute or identity supplies `email`, read the one the shopper typed
  // into the trigger page's form, taken only from text and email inputs the shopper typed into or
  // autofilled, and only when they hold exactly one distinct email. Only for an entry whose guests reach
  // that page without one; it needs `email` required, widened tabs included.
  readEmailInput?: boolean;
  // Milliseconds to hold the dispatch, so attributes are read after the page has settled rather
  // than at the pageview. Omit it and nothing is scheduled: the dispatch stays synchronous.
  dispatchDelayMs?: number;
  // Release a held dispatch when a later trigger moves to another route. Opt-in per entry.
  releaseHoldOnRouteChange?: boolean;
  // Opt-in: while checkout intent is active, a click on this entry's own route that the core SDK reads as a checkout
  // step, such as "Checkout" or "Proceed to checkout", fires the entry as the confirm click would. For an entry whose
  // confirm click happens on a page the kit doesn't run on. Off the route, such a click still only gets observed.
  checkoutStepIntent?: boolean;
  // Values the speculative call sends only for a key it has no value for, from the trigger event, the
  // shopper's saved attributes or an identity, in any casing; the shopper's own value wins unless the default
  // skips remembered values. A defaulted key counts as resolved, is never written to the saved attributes, and is
  // never filled on a widened tab. List each key in attributeKeys too, never in identityKeys.
  preselectAttributeDefaults?: Record<string, string | PreselectAttributeDefault>;
  // Custom event names (mParticle logEvent) that also trigger on this route, alongside the
  // pageview and pathname triggers. A matching event dispatches without dispatchDelayMs.
  triggerEventNames?: string[];
  // Opt-in: while checkout intent is active, a click that adds to or opens the cart fires this entry from any
  // route, under the confirm click's identity and email rules. Off its own route it fires only as the account's
  // one cartIntent entry. A commit or wallet tap never fires it, on its route or off it.
  cartIntent?: boolean;
  // Opt-in for the account's one cartIntent entry: the user attribute, in any casing, that holds the shopper's cart.
  // A page view off the entry's route fires it at once while that attribute holds items. A gate only, never a key.
  cartUserAttribute?: string;
}

export const PRESELECTION_CONFIG: PreselectionConfigEntry[] = [
  {
    accountId: '2919171670744024290',
    pathname: '/checkout',
    targetPageIdentifier: 'prod.rokt.conf',
    attributeKeys: [
      'email',
      'customertype',
      'firstname',
      'lastname',
    ],
    optionalAttributeKeys: ['firstname', 'lastname'],
    identityKeys: ['email'],
    dispatchDelayMs: 5000,
    readEmailInput: true,
  },
  {
    accountId: '2550745407543340151',
    pathname: '/checkout',
    targetPageIdentifier: 'RoktExperience',
    attributeKeys: [
      'email',
      'firstname',
      'customertype',
      'loyaltytier',
      'paymenttype',
    ],
    optionalAttributeKeys: ['loyaltytier', 'paymenttype'],
    dispatchDelayMs: 20000,
  },
  {
    accountId: '3236704179315511296',
    pathname: '/check-out/*',
    targetPageIdentifier: 'confirmation_page',
    attributeKeys: [
      'email',
      'firstname',
      'loyaltytier',
    ],
    optionalAttributeKeys: [
      'firstname',
      'loyaltytier',
    ],
    dispatchDelayMs: 20000,
  },
  {
    accountId: '2192288523645376337',
    pathname: '/checkout/*/review',
    targetPageIdentifier: 'ppx-ad-view-prod',
    attributeKeys: [
      'email',
    ],
    optionalAttributeKeys: [
      'email',
    ],
    dispatchDelayMs: 10000,
  },
  {
    accountId: '2074245483568304147',
    pathname: '/checkout/cart',
    targetPageIdentifier: 'new_confirmation',
    attributeKeys: [
      'email',
      'showPlacement',
      'post_purchase_variant',
      'has_groupon_banner',
    ],
    optionalAttributeKeys: [
      'showPlacement',
      'post_purchase_variant',
      'has_groupon_banner',
    ],
    preselectAttributeDefaults: {
      showPlacement: 'rokt',
      post_purchase_variant: 'treatment',
      has_groupon_banner: 'false',
    },
  },
  {
    accountId: '3316822094627160064',
    pathname: '/cart/review',
    targetPageIdentifier: 'prod.rokt.photo',
    attributeKeys: [
      'emailsha256',
    ],
    dispatchDelayMs: 1000,
  },
];
