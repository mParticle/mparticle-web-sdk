import { describe, it, expect } from 'vitest';
import { parsePreselectionConfigSetting } from '../../src/preselectionConfigSetting';

const ACCOUNT_ID = '900001';

const ENTRY = {
  pathname: '/checkout/*/review',
  targetPageIdentifier: 'confirmation_page',
  attributeKeys: ['email', 'firstname', 'showPlacement'],
  optionalAttributeKeys: ['firstname'],
  dispatchDelayMs: 20000,
  preselectAttributeOverrides: { showPlacement: 'rokt' },
};

const buildSetting = (entries: unknown[], schemaVersion: unknown = 1): string =>
  JSON.stringify({ schemaVersion, entries });

describe('parsePreselectionConfigSetting', () => {
  it('parses every field and scopes each entry to the connection account', () => {
    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([ENTRY]))).toEqual([
      { accountId: ACCOUNT_ID, ...ENTRY },
    ]);
  });

  it('omits optional fields the entry leaves out', () => {
    const entry = { pathname: '/cart/review', targetPageIdentifier: 'photo', attributeKeys: ['emailsha256'] };

    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([entry]))).toEqual([
      { accountId: ACCOUNT_ID, ...entry },
    ]);
  });

  it('unescapes &quot; the way the other kit JSON settings arrive', () => {
    const escaped = buildSetting([ENTRY]).replace(/"/g, '&quot;');

    expect(parsePreselectionConfigSetting(ACCOUNT_ID, escaped)).toEqual([{ accountId: ACCOUNT_ID, ...ENTRY }]);
  });

  it('accepts an entry whose accountId matches the connection', () => {
    expect(
      parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([{ ...ENTRY, accountId: ACCOUNT_ID }])),
    ).toHaveLength(1);
  });

  it('accepts an empty entries list', () => {
    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([]))).toEqual([]);
  });

  it.each([
    ['malformed JSON', '{"schemaVersion": 1,'],
    ['a non-object payload', '[]'],
    ['an unknown schemaVersion', buildSetting([ENTRY], 2)],
    ['a missing schemaVersion', JSON.stringify({ entries: [ENTRY] })],
    ['entries that are not an array', JSON.stringify({ schemaVersion: 1, entries: {} })],
  ])('rejects %s', (_label, setting) => {
    expect(parsePreselectionConfigSetting(ACCOUNT_ID, setting)).toBeUndefined();
  });

  it.each([
    ['a non-object entry', 'entry'],
    ['another account', { ...ENTRY, accountId: 'some-other-account' }],
    ['a pathname without a leading slash', { ...ENTRY, pathname: 'checkout' }],
    ['a missing pathname', { ...ENTRY, pathname: undefined }],
    ['an empty targetPageIdentifier', { ...ENTRY, targetPageIdentifier: '' }],
    ['no attributeKeys', { ...ENTRY, attributeKeys: [] }],
    ['a non-string attribute key', { ...ENTRY, attributeKeys: ['email', 7] }],
    ['an optional key outside attributeKeys', { ...ENTRY, optionalAttributeKeys: ['lastname'] }],
    ['a negative dispatchDelayMs', { ...ENTRY, dispatchDelayMs: -1 }],
    ['a string dispatchDelayMs', { ...ENTRY, dispatchDelayMs: '20000' }],
    ['a null dispatchDelayMs', { ...ENTRY, dispatchDelayMs: null }],
    ['an override key outside attributeKeys', { ...ENTRY, preselectAttributeOverrides: { other: 'x' } }],
    ['a non-string override value', { ...ENTRY, preselectAttributeOverrides: { showPlacement: true } }],
  ])('rejects the whole setting for %s', (_label, badEntry) => {
    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([ENTRY, badEntry]))).toBeUndefined();
  });
});
