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
  // Keys, listed in attributeKeys too, that resolve from the user identity of the same name when no
  // attribute carries them. The launcher compares these strictly on arrival.
  identityKeys?: string[];
  // Milliseconds to hold the dispatch, so attributes are read after the page has settled rather
  // than at the pageview. Omit it and nothing is scheduled: the dispatch stays synchronous.
  dispatchDelayMs?: number;
  // Release a held dispatch when a later trigger moves to another route. Opt-in per entry.
  releaseHoldOnRouteChange?: boolean;
  // Values the speculative call sends in place of the trigger page's own, for a partner flag that
  // takes its target-page value only on the target page. List each key in attributeKeys too.
  preselectAttributeOverrides?: Record<string, string>;
  // Custom event names (mParticle logEvent) that also trigger on this route, alongside the
  // pageview and pathname triggers. A matching event dispatches without dispatchDelayMs.
  triggerEventNames?: string[];
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
    dispatchDelayMs: 20000,
  },
  {
    accountId: '2550745407543340151',
    pathname: '/checkout',
    targetPageIdentifier: 'RoktExperience',
    attributeKeys: [
      'email',
      'firstname',
      'lastname',
      'customertype',
      'loyaltytier',
      'paymenttype',
    ],
    optionalAttributeKeys: ['firstname', 'lastname', 'loyaltytier', 'paymenttype'],
    dispatchDelayMs: 20000,
  },
  {
    accountId: '3236704179315511296',
    pathname: '/check-out/pay',
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
    preselectAttributeOverrides: {
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
