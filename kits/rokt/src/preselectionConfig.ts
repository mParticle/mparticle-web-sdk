// Hardcoded for now; will move to a server-delivered kit setting later.
export interface PreselectionConfigEntry {
  accountId: string;
  pathname: string;
  targetPageIdentifier: string;
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
      'amount',
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
      'amount',
      'firstname',
      'lastname',
      'cartItems',
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
      'totalprice',
      'cartItems',
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
];
