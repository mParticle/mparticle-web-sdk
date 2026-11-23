import { afterEach, describe, expect, it, vi } from 'vitest';
import { isPageValuePath, readPageValue, readPageValueFill } from '../../../src/preselection/pageValue';

const win = window as unknown as Record<string, unknown>;

describe('readPageValue', () => {
  afterEach(() => {
    delete win.siteData;
  });

  it('reads a string at a dotted path from window', () => {
    win.siteData = { visitor: { profile: { status: 'Guest' } } };

    expect(readPageValue('siteData.visitor.profile.status')).toBe('Guest');
  });

  it('reads a finite number as a string', () => {
    win.siteData = { visitor: { tier: 2 } };

    expect(readPageValue('siteData.visitor.tier')).toBe('2');
  });

  it.each([
    ['a missing path', {}],
    ['a missing step', { visitor: null }],
    ['an object', { visitor: { status: { name: 'guest' } } }],
    ['an array', { visitor: { status: ['guest'] } }],
    ['a boolean', { visitor: { status: true } }],
    ['NaN', { visitor: { status: Number.NaN } }],
    ['Infinity', { visitor: { status: Number.POSITIVE_INFINITY } }],
    ['a function', { visitor: { status: () => 'guest' } }],
  ])('reads nothing for %s', (_label, siteData) => {
    win.siteData = siteData;

    expect(readPageValue('siteData.visitor.status')).toBeUndefined();
  });

  it('refuses a getter without running it', () => {
    const getter = vi.fn(() => 'guest');
    const visitor = {};
    Object.defineProperty(visitor, 'status', { get: getter, enumerable: true });
    win.siteData = { visitor };

    expect(readPageValue('siteData.visitor.status')).toBeUndefined();
    expect(getter).not.toHaveBeenCalled();
  });

  it('refuses an inherited property', () => {
    win.siteData = { visitor: Object.create({ status: 'guest' }) };

    expect(readPageValue('siteData.visitor.status')).toBeUndefined();
  });

  it.each(['__proto__', 'constructor', 'prototype'])('refuses a %s segment, even as an own property', (segment) => {
    win.siteData = JSON.parse(`{"${segment}":{"status":"guest"}}`);

    expect(readPageValue(`siteData.${segment}.status`)).toBeUndefined();
  });

  it('reads nothing when a step throws', () => {
    win.siteData = new Proxy(
      {},
      {
        getOwnPropertyDescriptor: () => {
          throw new Error('blocked');
        },
      },
    );

    expect(readPageValue('siteData.status')).toBeUndefined();
  });
});

describe('isPageValuePath', () => {
  it.each([
    ['one segment', 'status', true],
    ['eight segments', 'a.b.c.d.e.f.g.h', true],
    ['digits, $, _ and - in a segment', 'data_layer.$user.0.login-state', true],
    ['nine segments', 'a.b.c.d.e.f.g.h.i', false],
    ['an empty segment', 'siteData..status', false],
    ['an empty path', '', false],
    ['a bracket', 'siteData[0].status', false],
    ['a space', 'siteData. status', false],
    ['a segment over 64 characters', `siteData.${'a'.repeat(65)}`, false],
    ['__proto__', 'siteData.__proto__.status', false],
    ['constructor', 'siteData.constructor', false],
    ['prototype', 'Object.prototype', false],
    ['a non-string', 42, false],
  ])('%s: %s', (_label, path, expected) => {
    expect(isPageValuePath(path)).toBe(expected);
  });
});

describe('readPageValueFill', () => {
  const PAGE_VALUE = { path: 'siteData.visitor.status', values: { guest: 'guest_shopper' } };

  afterEach(() => {
    delete win.siteData;
  });

  it("sends the mapped value for the page's value in any casing and spacing", () => {
    win.siteData = { visitor: { status: ' GUEST ' } };

    expect(readPageValueFill(PAGE_VALUE)).toBe('guest_shopper');
  });

  it.each(['Registered', 'shopper@example.com', '<script>'])(
    'sends nothing for an unmapped page value, %s',
    (status) => {
      win.siteData = { visitor: { status } };

      expect(readPageValueFill(PAGE_VALUE)).toBeUndefined();
    },
  );

  it.each(['constructor', '__proto__'])(
    'sends nothing for a page value named like a prototype property, %s',
    (status) => {
      win.siteData = { visitor: { status } };

      expect(readPageValueFill(PAGE_VALUE)).toBeUndefined();
    },
  );

  it('sends a mapping the setting itself names constructor', () => {
    win.siteData = { visitor: { status: 'Constructor' } };

    expect(readPageValueFill({ ...PAGE_VALUE, values: JSON.parse('{"constructor":"builder"}') })).toBe('builder');
  });

  it('sends nothing when the page holds no value', () => {
    expect(readPageValueFill(PAGE_VALUE)).toBeUndefined();
  });
});
