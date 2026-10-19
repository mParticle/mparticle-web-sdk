import { describe, it, expect, afterEach } from 'vitest';
import { isObject, isString, isEmpty, isFunction, cleanPageUrl, parseKitSettingJson } from '../../src/utils';

describe('utils: type guards', () => {
  describe('isObject', () => {
    it('is true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
    });

    it('is false for arrays', () => {
      expect(isObject([])).toBe(false);
      expect(isObject([1, 2])).toBe(false);
    });

    it('is false for null and undefined', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
    });

    it('is false for primitives', () => {
      expect(isObject('s')).toBe(false);
      expect(isObject(1)).toBe(false);
      expect(isObject(true)).toBe(false);
    });
  });

  describe('isString', () => {
    it('is true for strings', () => {
      expect(isString('')).toBe(true);
      expect(isString('abc')).toBe(true);
    });

    it('is false for non-strings', () => {
      expect(isString(1)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString({})).toBe(false);
      expect(isString(['a'])).toBe(false);
    });
  });

  describe('isFunction', () => {
    it('is true for function declarations and expressions', () => {
      expect(isFunction(function named() {})).toBe(true);
      expect(isFunction(() => undefined)).toBe(true);
      expect(isFunction(async () => undefined)).toBe(true);
    });

    it('is true for methods read off an object', () => {
      const sessionManager = { getSessionId: () => 'session-id' };
      expect(isFunction(sessionManager.getSessionId)).toBe(true);
    });

    it('is false for a missing method', () => {
      const sessionManager = {} as { getSessionId?: () => string };
      expect(isFunction(sessionManager.getSessionId)).toBe(false);
    });

    it('is false for null and undefined', () => {
      expect(isFunction(null)).toBe(false);
      expect(isFunction(undefined)).toBe(false);
    });

    it('is false for non-callable values', () => {
      expect(isFunction({})).toBe(false);
      expect(isFunction([])).toBe(false);
      expect(isFunction('getSessionId')).toBe(false);
      expect(isFunction(1)).toBe(false);
      expect(isFunction(true)).toBe(false);
    });
  });

  describe('isEmpty', () => {
    it('is true for null and undefined', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
    });

    it('is true for empty objects and arrays', () => {
      expect(isEmpty({})).toBe(true);
      expect(isEmpty([])).toBe(true);
    });

    it('is false for non-empty objects and arrays', () => {
      expect(isEmpty({ a: 1 })).toBe(false);
      expect(isEmpty([1])).toBe(false);
    });

    it('is false for non-empty primitives', () => {
      expect(isEmpty('abc')).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });

    it('is true for an empty string', () => {
      expect(isEmpty('')).toBe(true);
    });
  });
});

describe('utils: cleanPageUrl', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;
  const originalMParticle = win.mParticle;

  afterEach(() => {
    win.mParticle = originalMParticle;
  });

  it('delegates to the core SDK in full mode', () => {
    const calls: Array<[string, string]> = [];
    win.mParticle = {
      _cleanUrl: (href: string, mode: string) => {
        calls.push([href, mode]);
        return 'https://shop.example.com/checkout?page=2#/pay';
      },
    };

    expect(cleanPageUrl('https://shop.example.com/checkout?email=a%40b.com&page=2#/pay')).toBe(
      'https://shop.example.com/checkout?page=2#/pay',
    );
    expect(calls).toEqual([['https://shop.example.com/checkout?email=a%40b.com&page=2#/pay', 'full']]);
  });

  describe('when the core SDK predates _cleanUrl', () => {
    it('drops the whole query and keeps the fragment', () => {
      win.mParticle = {};
      expect(cleanPageUrl('https://shop.example.com/checkout?page=2&email=a%40b.com#/pay')).toBe(
        'https://shop.example.com/checkout#/pay',
      );
    });

    it('keeps a ? that is inside the fragment', () => {
      win.mParticle = undefined;
      expect(cleanPageUrl('https://shop.example.com/#/search?q=x')).toBe('https://shop.example.com/#/search?q=x');
    });

    it('leaves a url with neither unchanged', () => {
      win.mParticle = {};
      expect(cleanPageUrl('https://shop.example.com/checkout')).toBe('https://shop.example.com/checkout');
    });
  });
});

describe('utils: parseKitSettingJson', () => {
  it('parses a valid JSON string', () => {
    expect(parseKitSettingJson('[{"value":"a"}]')).toEqual([{ value: 'a' }]);
  });

  it('unescapes &quot; before parsing', () => {
    expect(parseKitSettingJson('{&quot;a&quot;:1}')).toEqual({ a: 1 });
  });

  it('returns undefined for malformed JSON', () => {
    expect(parseKitSettingJson('{not json')).toBeUndefined();
  });
});
