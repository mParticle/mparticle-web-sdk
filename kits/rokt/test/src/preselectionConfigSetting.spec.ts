import { describe, it, expect } from 'vitest';
import { parsePreselectionConfigSetting } from '../../src/preselectionConfigSetting';
import { PRESELECTION_CONFIG } from '../../src/preselectionConfig';

const ACCOUNT_ID = '900001';

const ENTRY = {
  pathname: '/checkout/*/review',
  targetPageIdentifier: 'confirmation_page',
  attributeKeys: ['email', 'firstname', 'showPlacement'],
  optionalAttributeKeys: ['firstname'],
  dispatchDelayMs: 20000,
  preselectAttributeDefaults: { showPlacement: 'rokt' },
};

// ENTRY without its defaults, for the older preselectAttributeOverrides name.
const BARE_ENTRY = {
  pathname: ENTRY.pathname,
  targetPageIdentifier: ENTRY.targetPageIdentifier,
  attributeKeys: ENTRY.attributeKeys,
  optionalAttributeKeys: ENTRY.optionalAttributeKeys,
  dispatchDelayMs: ENTRY.dispatchDelayMs,
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

  it('parses identityKeys alongside a default on a different key', () => {
    const entry = { ...ENTRY, identityKeys: ['email'] };

    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([entry]))).toEqual({
      entries: [{ accountId: ACCOUNT_ID, ...entry }],
    });
  });

  it('reads the older preselectAttributeOverrides name as defaults', () => {
    const entry = { ...BARE_ENTRY, preselectAttributeOverrides: { showPlacement: 'rokt' } };

    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([entry]))).toEqual({
      entries: [{ accountId: ACCOUNT_ID, ...BARE_ENTRY, preselectAttributeDefaults: { showPlacement: 'rokt' } }],
    });
  });

  it('keeps the entry and drops an older-name value the released kit accepted but a default may not take', () => {
    const attributeKeys = [...BARE_ENTRY.attributeKeys, 'emailsha256', 'customerid', 'CustomerId'];
    const entry = {
      ...BARE_ENTRY,
      attributeKeys,
      identityKeys: ['customerid'],
      preselectAttributeOverrides: {
        showPlacement: 'rokt',
        firstname: '',
        email: 'x',
        emailsha256: 'y',
        CustomerId: 'z',
      },
    };

    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([entry]))).toEqual({
      entries: [
        {
          accountId: ACCOUNT_ID,
          ...BARE_ENTRY,
          attributeKeys,
          identityKeys: ['customerid'],
          preselectAttributeDefaults: { showPlacement: 'rokt' },
        },
      ],
    });
  });

  it('parses firesOnPageView', () => {
    const entry = { ...ENTRY, firesOnPageView: true };

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

  it.each([true, false])('parses the boolean cart-intent flag %s', (cartIntent) => {
    const entry = { ...ENTRY, cartIntent };
    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([entry]))).toEqual({
      entries: [{ accountId: ACCOUNT_ID, ...entry }],
    });
  });

  it('leaves cartIntent off an entry that omits it', () => {
    const result = parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([ENTRY]));
    expect('entries' in result && result.entries[0]).not.toHaveProperty('cartIntent');
  });

  it.each(['true', 1, null, [], {}])('rejects a non-boolean cart-intent flag %j', (cartIntent) => {
    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([{ ...ENTRY, cartIntent }]))).toEqual({
      error: 'entry 1 cartIntent',
    });
  });

  it('parses the cart attribute on a cartIntent entry', () => {
    const entry = { ...ENTRY, cartIntent: true, cartUserAttribute: 'cartItems' };
    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([entry]))).toEqual({
      entries: [{ accountId: ACCOUNT_ID, ...entry }],
    });
  });

  it.each([
    ['without cartIntent', {}],
    ['with cartIntent false', { cartIntent: false }],
  ])('ignores the cart attribute on an entry %s, and keeps the rest of the entry', (_, fields) => {
    const entry = { ...ENTRY, ...fields };
    expect(
      parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([{ ...entry, cartUserAttribute: 'cartItems' }])),
    ).toEqual({ entries: [{ accountId: ACCOUNT_ID, ...entry }] });
  });

  it.each(['', 1, true, null, ['cartItems'], {}])(
    'ignores a cart attribute %j that is not a non-empty string on a cartIntent entry',
    (cartUserAttribute) => {
      const entry = { ...ENTRY, cartIntent: true };
      expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([{ ...entry, cartUserAttribute }]))).toEqual({
        entries: [{ accountId: ACCOUNT_ID, ...entry }],
      });
    },
  );

  it.each([
    [{ widenedOptionalAttributeKeys: ['firstname', 'showPlacement'], identityKeys: ['email'] }],
    [{ widenedOptionalAttributeKeys: [] }],
    [{ widenedOptionalAttributeKeys: [], optionalAttributeKeys: ['firstname', 'email'], identityKeys: ['email'] }],
    [{ optionalAttributeKeys: ['firstname', 'email'], identityKeys: ['email'] }],
  ])('parses an entry whose widened keys are absent, empty or clear of identityKeys: %j', (fields) => {
    const entry = { ...ENTRY, ...fields };

    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([entry]))).toEqual({
      entries: [{ accountId: ACCOUNT_ID, ...entry }],
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
    [
      'a widened optional key outside attributeKeys',
      { ...ENTRY, widenedOptionalAttributeKeys: ['lastname'] },
      'widenedOptionalAttributeKeys',
    ],
    [
      'a non-string widened optional key',
      { ...ENTRY, widenedOptionalAttributeKeys: ['firstname', 7] },
      'widenedOptionalAttributeKeys',
    ],
    [
      'widenedOptionalAttributeKeys that are not an array',
      { ...ENTRY, widenedOptionalAttributeKeys: 'firstname' },
      'widenedOptionalAttributeKeys',
    ],
    [
      'a null widenedOptionalAttributeKeys',
      { ...ENTRY, widenedOptionalAttributeKeys: null },
      'widenedOptionalAttributeKeys',
    ],
    ['an identity key outside attributeKeys', { ...ENTRY, identityKeys: ['lastname'] }, 'identityKeys'],
    ['empty identityKeys', { ...ENTRY, identityKeys: [] }, 'identityKeys'],
    ['a non-string identity key', { ...ENTRY, identityKeys: ['email', 7] }, 'identityKeys'],
    ['identityKeys that are not an array', { ...ENTRY, identityKeys: 'email' }, 'identityKeys'],
    ['a null identityKeys', { ...ENTRY, identityKeys: null }, 'identityKeys'],
    [
      'widenedOptionalAttributeKeys without identityKeys',
      { ...ENTRY, widenedOptionalAttributeKeys: ['showPlacement'] },
      'identityKeys',
    ],
    [
      'an identity key that is optional on a widened entry',
      { ...ENTRY, widenedOptionalAttributeKeys: ['showPlacement'], identityKeys: ['firstname'] },
      'identityKeys',
    ],
    [
      'an identity key optional in another casing on a widened entry',
      {
        ...ENTRY,
        attributeKeys: [...ENTRY.attributeKeys, 'Email'],
        optionalAttributeKeys: ['firstname', 'Email'],
        widenedOptionalAttributeKeys: ['showPlacement'],
        identityKeys: ['email'],
      },
      'identityKeys',
    ],
    [
      'an identity key widened in another casing',
      {
        ...ENTRY,
        attributeKeys: [...ENTRY.attributeKeys, 'Email'],
        widenedOptionalAttributeKeys: ['Email'],
        identityKeys: ['email'],
      },
      'identityKeys',
    ],
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
      'an older-name key outside attributeKeys',
      { ...BARE_ENTRY, preselectAttributeOverrides: { other: 'x' } },
      'preselectAttributeOverrides',
    ],
    [
      'a non-string older-name value',
      { ...BARE_ENTRY, preselectAttributeOverrides: { showPlacement: true } },
      'preselectAttributeOverrides',
    ],
    [
      'an older-name value on a declared identity key',
      { ...BARE_ENTRY, identityKeys: ['email'], preselectAttributeOverrides: { email: 'x' } },
      'preselectAttributeOverrides',
    ],
    ['a string firesOnPageView', { ...ENTRY, firesOnPageView: 'true' }, 'firesOnPageView'],
    ['a null firesOnPageView', { ...ENTRY, firesOnPageView: null }, 'firesOnPageView'],
    [
      'an email default on a readEmailInput entry',
      { ...ENTRY, readEmailInput: true, preselectAttributeDefaults: { email: 'x' } },
      'readEmailInput',
    ],
    [
      'an older-name email value on a readEmailInput entry',
      { ...BARE_ENTRY, readEmailInput: true, preselectAttributeOverrides: { email: 'x' } },
      'readEmailInput',
    ],
    ['null defaults', { ...ENTRY, preselectAttributeDefaults: null }, 'preselectAttributeDefaults'],
    ['a null older-name value', { ...BARE_ENTRY, preselectAttributeOverrides: null }, 'preselectAttributeOverrides'],
    [
      'both names at once',
      { ...ENTRY, preselectAttributeOverrides: { showPlacement: 'rokt' } },
      'preselectAttributeDefaults',
    ],
    ['defaults that are not an object', { ...ENTRY, preselectAttributeDefaults: ['x'] }, 'preselectAttributeDefaults'],
    [
      'a default key outside attributeKeys',
      { ...ENTRY, preselectAttributeDefaults: { other: 'x' } },
      'preselectAttributeDefaults',
    ],
    [
      'a non-string default value',
      { ...ENTRY, preselectAttributeDefaults: { firstname: false } },
      'preselectAttributeDefaults',
    ],
    [
      'a default on a declared identity key',
      { ...ENTRY, identityKeys: ['email'], preselectAttributeDefaults: { email: 'x' } },
      'preselectAttributeDefaults',
    ],
  ])('rejects the whole setting for %s and names the entry and field', (_label, badEntry, field) => {
    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([ENTRY, badEntry]))).toEqual({
      error: `entry 2 ${field}`,
    });
  });

  describe('preselectAttributeDefaults', () => {
    const DEFAULTS_ENTRY = {
      ...ENTRY,
      attributeKeys: [...ENTRY.attributeKeys, 'placementType', 'segment', 'experience'],
    };

    it('parses a plain value and each field of a default object', () => {
      const preselectAttributeDefaults = {
        placementType: 'overlay',
        segment: { value: 'standard', byClientType: { DesktopWeb: 'corporate', MobileWeb: 'skip' } },
        experience: { byHostname: { 'shop.example.com': 'alternate' }, skipRemembered: true },
      };

      expect(
        parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([{ ...DEFAULTS_ENTRY, preselectAttributeDefaults }])),
      ).toEqual({ entries: [{ accountId: ACCOUNT_ID, ...DEFAULTS_ENTRY, preselectAttributeDefaults }] });
    });

    it('accepts a field it does not know inside a default, so a later kit can add one', () => {
      const preselectAttributeDefaults = { placementType: { value: 'overlay', byPathname: { '/a': 'embed' } } };

      expect(
        parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([{ ...DEFAULTS_ENTRY, preselectAttributeDefaults }])),
      ).toEqual({ entries: [{ accountId: ACCOUNT_ID, ...DEFAULTS_ENTRY, preselectAttributeDefaults }] });
    });

    it.each([
      ['defaults that are not an object', ['overlay']],
      ['a null defaults', null],
      ['a key outside attributeKeys', { lastname: 'x' }],
      ['an empty value', { placementType: '' }],
      ['a non-string value', { placementType: true }],
      ['a null value', { placementType: null }],
      ['an object with nothing to fill', { placementType: { skipRemembered: true } }],
      ['an empty value field', { placementType: { value: '' } }],
      ['an unknown client type', { placementType: { byClientType: { TabletWeb: 'overlay' } } }],
      ['an empty client type value', { placementType: { byClientType: { MobileWeb: '' } } }],
      ['a byClientType that is not an object', { placementType: { byClientType: 'overlay' } }],
      ['a host in upper case', { placementType: { byHostname: { 'Shop.example.com': 'overlay' } } }],
      ['an empty host', { placementType: { byHostname: { '': 'overlay' } } }],
      ['a non-string host value', { placementType: { byHostname: { 'shop.example.com': 1 } } }],
      ['a non-boolean skipRemembered', { placementType: { value: 'overlay', skipRemembered: 'true' } }],
      ['a default on email', { email: 'x' }],
      ['a default on email in another casing', { EMAIL: 'x' }, ['EMAIL']],
      ['a default on a hashed email', { emailSha256: 'x' }, ['emailSha256']],
    ])('rejects %s', (_label, preselectAttributeDefaults, extraKeys: string[] = []) => {
      const badEntry = {
        ...DEFAULTS_ENTRY,
        attributeKeys: [...DEFAULTS_ENTRY.attributeKeys, ...extraKeys],
        preselectAttributeDefaults,
      };

      expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([ENTRY, badEntry]))).toEqual({
        error: 'entry 2 preselectAttributeDefaults',
      });
    });

    it('rejects a default on a declared identity key in any casing', () => {
      const badEntry = {
        ...DEFAULTS_ENTRY,
        attributeKeys: [...DEFAULTS_ENTRY.attributeKeys, 'customerid', 'CustomerId'],
        identityKeys: ['customerid'],
        preselectAttributeDefaults: { CustomerId: 'x' },
      };

      expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([badEntry]))).toEqual({
        error: 'entry 1 preselectAttributeDefaults',
      });
    });

    it('checks a default under the older name by the same rules, and names that field', () => {
      const badEntry = {
        ...BARE_ENTRY,
        attributeKeys: [...BARE_ENTRY.attributeKeys, 'placementType'],
        preselectAttributeOverrides: { placementType: { byClientType: { TabletWeb: 'overlay' } } },
      };

      expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([badEntry]))).toEqual({
        error: 'entry 1 preselectAttributeOverrides',
      });
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

describe('intentTrigger settings', () => {
  // The key no longer configures anything, so the entry parses with any value and drops it.
  it.each([['observe'], ['fire'], ['FIRE'], [true], [null], [1], [{}], [[]]])('ignores %j', (intentTrigger) => {
    expect(parsePreselectionConfigSetting(ACCOUNT_ID, buildSetting([{ ...ENTRY, intentTrigger }]))).toEqual({
      entries: [{ accountId: ACCOUNT_ID, ...ENTRY }],
    });
  });
});

describe('built-in preselection entries', () => {
  // Grouped by account as the fallback serves them, so the cross-entry rules apply, and read back unchanged.
  it('each pass the same rules as the server setting', () => {
    const accountIds = Array.from(new Set(PRESELECTION_CONFIG.map((entry) => entry.accountId)));
    for (const accountId of accountIds) {
      const entries = PRESELECTION_CONFIG.filter((entry) => entry.accountId === accountId);
      const setting = JSON.stringify({ schemaVersion: 1, entries });
      expect(parsePreselectionConfigSetting(accountId, setting), accountId).toEqual({ entries });
    }
  });
});
