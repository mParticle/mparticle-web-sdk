import { describe, it, expect } from 'vitest';
import {
  isSelectPlacementsAttributePersistenceDenied,
  removeSelectPlacementsAttributePersistenceDeniedAttributes,
} from '../../src/selectPlacementsAttributePersistence';

describe('selectPlacementsAttributePersistence', () => {
  it('matches deny-listed keys case-insensitively', () => {
    expect(isSelectPlacementsAttributePersistenceDenied('billingzipcode')).toBe(true);
    expect(isSelectPlacementsAttributePersistenceDenied('BillingZipCode')).toBe(true);
    expect(isSelectPlacementsAttributePersistenceDenied('exitIntentReason')).toBe(true);
    expect(isSelectPlacementsAttributePersistenceDenied('customAttribute')).toBe(false);
  });

  it('removes deny-listed attributes and keeps allowed ones', () => {
    const attributes = {
      billingzipcode: '10001',
      BillingCity: 'new york',
      exitIntentReason: 'idle',
      loyaltyTier: 'gold',
      campaignCode: 'fall',
    };

    expect(removeSelectPlacementsAttributePersistenceDeniedAttributes(attributes)).toEqual({
      loyaltyTier: 'gold',
      campaignCode: 'fall',
    });
  });

  it('returns an empty object for null/undefined and does not throw', () => {
    expect(removeSelectPlacementsAttributePersistenceDeniedAttributes(null)).toEqual({});
    expect(removeSelectPlacementsAttributePersistenceDeniedAttributes(undefined)).toEqual({});
  });
});
