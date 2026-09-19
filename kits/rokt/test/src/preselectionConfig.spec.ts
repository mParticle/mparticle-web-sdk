import { describe, expect, it } from 'vitest';
import { PRESELECTION_CONFIG } from '../../src/preselectionConfig';

describe('preselection config', () => {
  it('excludes cart items from confirmation-page preselection', () => {
    const config = PRESELECTION_CONFIG.find(
      (entry) =>
        entry.accountId === '3236704179315511296' &&
        entry.targetPageIdentifier === 'confirmation_page',
    );

    expect(config).toBeDefined();
    expect(config?.attributeKeys).not.toContain('cartItems');
  });
});
