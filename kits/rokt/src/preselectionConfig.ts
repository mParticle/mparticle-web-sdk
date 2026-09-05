import { isString } from './utils';

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
      'locale',
      'member_status',
      'movierating',
      'billingzipcode',
      'country',
      'currency',
      'language',
    ],
  },
];

export function findPreselectionConfig(
  accountId: string | null | undefined,
  pathname: string,
): PreselectionConfigEntry | undefined {
  if (!accountId) {
    return undefined;
  }

  return PRESELECTION_CONFIG.find((entry) => entry.accountId === accountId && entry.pathname === pathname);
}

export function findPreselectionConfigByIdentifier(
  accountId: string | null | undefined,
  identifier: unknown,
): PreselectionConfigEntry | undefined {
  if (!accountId || !isString(identifier)) {
    return undefined;
  }

  return PRESELECTION_CONFIG.find((entry) => entry.accountId === accountId && entry.targetPageIdentifier === identifier);
}
