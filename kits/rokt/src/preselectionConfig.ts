// Hardcoded for now; will move to a server-delivered kit setting later.
export interface PreselectionConfigEntry {
  accountId: string;
  pathname: string;
  targetPageIdentifier: string;
  attributeKeys: string[];
}

export const PRESELECTION_CONFIG: PreselectionConfigEntry[] = [
  {
    accountId: '2919171670744024290',
    pathname: '/checkout',
    targetPageIdentifier: 'prod.rokt.conf',
    attributeKeys: [
      'email',
      'amount',
      'concessions_total',
      'customertype',
      'eventvenue',
      'firstname',
      'lastname',
      'member_status',
      'billingzipcode',
      'currency',
    ],
  },
];
