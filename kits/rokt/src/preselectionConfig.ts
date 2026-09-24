// Hardcoded for now; will move to a server-delivered kit setting later.
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
}

export const PRESELECTION_CONFIG: PreselectionConfigEntry[] = [
  {
    accountId: '2919171670744024290',
    pathname: '/checkout',
    targetPageIdentifier: 'prod.rokt.conf',
    attributeKeys: [
      'email',
      'customertype',
      'eventvenue',
      'firstname',
      'lastname',
      'member_status',
      'billingzipcode',
      'currency',
    ],
    optionalAttributeKeys: ['firstname', 'lastname'],
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
      'ccbin',
    ],
    optionalAttributeKeys: ['loyaltytier', 'paymenttype', 'ccbin'],
  },
  {
    accountId: '3236704179315511296',
    pathname: '/check-out/pay',
    targetPageIdentifier: 'confirmation_page',
    attributeKeys: [
      'email',
      'firstname',
      'lastname',
      'loyaltytier',
    ],
    optionalAttributeKeys: [
      'firstname',
      'lastname',
      'loyaltytier',
    ],
  },
  {
    accountId: '2192288523645376337',
    pathname: '/checkout/*/review',
    targetPageIdentifier: 'ppx-ad-view-prod',
    attributeKeys: [
      'email',
      'firstname',
      'lastname',
    ],
    optionalAttributeKeys: [
      'email',
    ],
  },
  {
    accountId: '2074245483568304147',
    pathname: '/checkout/cart',
    targetPageIdentifier: 'new_confirmation',
    attributeKeys: [
      'email',
      'firstname',
      'lastname',
    ],
    optionalAttributeKeys: [
      'firstname',
      'lastname',
    ],
  },
];
