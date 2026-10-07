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
    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([ENTRY]))).toEqual({
      entries: [{ accountId: ACCOUNT_ID, ...ENTRY }],
    });
  });

  it('omits optional fields the entry leaves out', () => {
    const entry = { pathname: '/cart/review', targetPageIdentifier: 'photo', attributeKeys: ['emailsha256'] };

    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([entry]))).toEqual({
      entries: [{ accountId: ACCOUNT_ID, ...entry }],
    });
  });

  it('unescapes &quot; the way the other kit JSON settings arrive', () => {
    const escaped = buildSetting([ENTRY]).replace(/"/g, '&quot;');

    expect(parsePreselectionConfigSetting(ACCOUNT_ID, escaped)).toEqual({
      entries: [{ accountId: ACCOUNT_ID, ...ENTRY }],
    });
  });

  it('accepts an entry whose accountId matches the connection', () => {
    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([{ ...ENTRY, accountId: ACCOUNT_ID }]))).toEqual({
      entries: [{ accountId: ACCOUNT_ID, ...ENTRY }],
    });
  });

  it('parses identityKeys alongside an override on a different key', () => {
    const entry = { ...ENTRY, identityKeys: ['email'], preselectAttributeOverrides: { showPlacement: 'rokt' } };

    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([entry]))).toEqual({
      entries: [{ accountId: ACCOUNT_ID, ...entry }],
    });
  });

  it('parses triggerEventNames', () => {
    const entry = { ...ENTRY, triggerEventNames: ['Ready to Checkout'] };

    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([entry]))).toEqual({
      entries: [{ accountId: ACCOUNT_ID, ...entry }],
    });
  });

  it.each([true, false])('parses the boolean route-release flag %s', (releaseHoldOnRouteChange) => {
    const entry = { ...ENTRY, releaseHoldOnRouteChange };
    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([entry]))).toEqual({
      entries: [{ accountId: ACCOUNT_ID, ...entry }],
    });
  });

  it.each(['true', 1, null, [], {}])('rejects a non-boolean route-release flag %j', (releaseHoldOnRouteChange) => {
    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([ENTRY, { ...ENTRY, releaseHoldOnRouteChange }]))).toEqual({
      error: 'entry 2 releaseHoldOnRouteChange',
    });
  });

  it('parses identityKeys that are listed in attributeKeys', () => {
    const entry = { ...ENTRY, identityKeys: ['email'] };

    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([entry]))).toEqual({
      entries: [{ accountId: ACCOUNT_ID, ...entry }],
    });
  });

  it('rejects a second entry with the same targetPageIdentifier and names it', () => {
    const duplicate = { ...ENTRY, pathname: '/cart' };

    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([ENTRY, duplicate]))).toEqual({
      error: 'entry 2 targetPageIdentifier',
    });
  });

  it('accepts an empty entries list', () => {
    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([]))).toEqual({ entries: [] });
  });

  it('accepts the largest dispatchDelayMs the server allows', () => {
    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([{ ...ENTRY, dispatchDelayMs: 60000 }]))).toEqual({
      entries: [{ accountId: ACCOUNT_ID, ...ENTRY, dispatchDelayMs: 60000 }],
    });
  });

  it.each([
    ['malformed JSON', '{"schemaVersion": 1,', 'invalid JSON'],
    ['a non-object payload', '[]', 'not an object'],
    ['an unknown schemaVersion', buildSetting([ENTRY], 2), 'schemaVersion'],
    ['a missing schemaVersion', JSON.stringify({ entries: [ENTRY] }), 'schemaVersion'],
    ['entries that are not an array', JSON.stringify({ schemaVersion: 1, entries: {} }), 'entries'],
  ])('rejects %s', (_label, setting, error) => {
    expect(parsePreselectionConfigSetting(ACCOUNT_ID, setting)).toEqual({ error });
  });

  it.each([
    ['a non-object entry', 'entry', 'not an object'],
    ['another account', { ...ENTRY, accountId: 'some-other-account' }, 'accountId'],
    ['a pathname without a leading slash', { ...ENTRY, pathname: 'checkout' }, 'pathname'],
    ['a missing pathname', { ...ENTRY, pathname: undefined }, 'pathname'],
    ['an empty targetPageIdentifier', { ...ENTRY, targetPageIdentifier: '' }, 'targetPageIdentifier'],
    ['no attributeKeys', { ...ENTRY, attributeKeys: [] }, 'attributeKeys'],
    ['a non-string attribute key', { ...ENTRY, attributeKeys: ['email', 7] }, 'attributeKeys'],
    [
      'an optional key outside attributeKeys',
      { ...ENTRY, optionalAttributeKeys: ['lastname'] },
      'optionalAttributeKeys',
    ],
    ['an identity key outside attributeKeys', { ...ENTRY, identityKeys: ['lastname'] }, 'identityKeys'],
    ['empty identityKeys', { ...ENTRY, identityKeys: [] }, 'identityKeys'],
    ['a non-string identity key', { ...ENTRY, identityKeys: ['email', 7] }, 'identityKeys'],
    ['identityKeys that are not an array', { ...ENTRY, identityKeys: 'email' }, 'identityKeys'],
    ['a null identityKeys', { ...ENTRY, identityKeys: null }, 'identityKeys'],
    ['empty triggerEventNames', { ...ENTRY, triggerEventNames: [] }, 'triggerEventNames'],
    ['an empty trigger event name', { ...ENTRY, triggerEventNames: [''] }, 'triggerEventNames'],
    ['a non-string trigger event name', { ...ENTRY, triggerEventNames: ['Ready', 7] }, 'triggerEventNames'],
    ['triggerEventNames that are not an array', { ...ENTRY, triggerEventNames: 'Ready' }, 'triggerEventNames'],
    ['a negative dispatchDelayMs', { ...ENTRY, dispatchDelayMs: -1 }, 'dispatchDelayMs'],
    ['a decimal dispatchDelayMs', { ...ENTRY, dispatchDelayMs: 1500.5 }, 'dispatchDelayMs'],
    ['a dispatchDelayMs above the limit', { ...ENTRY, dispatchDelayMs: 60001 }, 'dispatchDelayMs'],
    ['a string dispatchDelayMs', { ...ENTRY, dispatchDelayMs: '20000' }, 'dispatchDelayMs'],
    ['a null dispatchDelayMs', { ...ENTRY, dispatchDelayMs: null }, 'dispatchDelayMs'],
    [
      'an override key outside attributeKeys',
      { ...ENTRY, preselectAttributeOverrides: { other: 'x' } },
      'preselectAttributeOverrides',
    ],
    [
      'a non-string override value',
      { ...ENTRY, preselectAttributeOverrides: { showPlacement: true } },
      'preselectAttributeOverrides',
    ],
    [
      'an override on a declared identity key',
      { ...ENTRY, identityKeys: ['email'], preselectAttributeOverrides: { email: 'x' } },
      'preselectAttributeOverrides',
    ],
  ])('rejects the whole setting for %s and names the entry and field', (_label, badEntry, field) => {
    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([ENTRY, badEntry]))).toEqual({
      error: `entry 2 ${field}`,
    });
  });

  it('rejects a dispatchDelayMs that JSON.parse reads as Infinity', () => {
    const setting = buildSetting([{ ...ENTRY, dispatchDelayMs: 0 }]).replace(
      '"dispatchDelayMs":0',
      '"dispatchDelayMs":1e400',
    );

    expect(parsePreselectionConfigSetting(ACCOUNT_ID, setting)).toEqual({ error: 'entry 1 dispatchDelayMs' });
  });
});
