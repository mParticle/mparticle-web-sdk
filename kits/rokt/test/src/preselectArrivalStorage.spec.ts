import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ANY_TAB_TRIGGER_TTL_MS,
  clearPreselectArrivals,
  markPreselectArrival,
  recordPreselectFired,
  recordPreselectTrigger,
  wasPreselectTriggeredInAnyTab,
} from '../../src/preselectArrivalStorage';
import { setDevicePersistenceDisabled } from '../../src/storage';

const NAMESPACE_KEY = 'mp-rokt-kit';
const FIELD_KEY = 'preselectArrival:1:confirmation';
const ANY_TAB_FIELD_KEY = 'preselectTriggerAnyTab:1:confirmation';

const readNamespace = (storage: Storage): Record<string, unknown> | null => {
  const raw = storage.getItem(NAMESPACE_KEY);
  return raw === null ? null : JSON.parse(raw);
};

describe('preselectArrivalStorage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    setDevicePersistenceDisabled(false);
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('reports no arrival when its marker cannot be written, rather than one on every call', () => {
    recordPreselectTrigger('1', 'confirmation', true);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(markPreselectArrival('1', 'confirmation')).toBeUndefined();
    expect(markPreselectArrival('1', 'confirmation')).toBeUndefined();
  });

  it('stores only timestamps: the tab record in sessionStorage, the last trigger in localStorage', () => {
    recordPreselectTrigger('1', 'confirmation', true);
    vi.setSystemTime(2_000);
    recordPreselectFired('1', 'confirmation');

    expect(readNamespace(window.sessionStorage)).toEqual({
      [FIELD_KEY]: { triggeredAt: 1_000, identitySeenAt: 1_000, firedAt: 2_000 },
    });
    expect(readNamespace(window.localStorage)).toEqual({ [ANY_TAB_FIELD_KEY]: { triggeredAt: 1_000 } });
  });

  it('sees a trigger from another tab, which starts with its own sessionStorage', () => {
    recordPreselectTrigger('1', 'confirmation', false);
    window.sessionStorage.clear();

    expect(markPreselectArrival('1', 'confirmation')).toEqual({});
    expect(wasPreselectTriggeredInAnyTab('1', 'confirmation')).toBe(true);
    expect(wasPreselectTriggeredInAnyTab('1', 'other-page')).toBe(false);
  });

  it('keeps the latest trigger time across tabs and lets it expire', () => {
    recordPreselectTrigger('1', 'confirmation', false);
    vi.setSystemTime(5_000);
    recordPreselectTrigger('1', 'confirmation', false);

    vi.setSystemTime(5_000 + ANY_TAB_TRIGGER_TTL_MS - 1);
    expect(wasPreselectTriggeredInAnyTab('1', 'confirmation')).toBe(true);
    vi.setSystemTime(5_000 + ANY_TAB_TRIGGER_TTL_MS);
    expect(wasPreselectTriggeredInAnyTab('1', 'confirmation')).toBe(false);
  });

  it('reads no trigger from a malformed or future-dated marker', () => {
    window.localStorage.setItem(NAMESPACE_KEY, JSON.stringify({ [ANY_TAB_FIELD_KEY]: { triggeredAt: 'soon' } }));
    expect(wasPreselectTriggeredInAnyTab('1', 'confirmation')).toBe(false);

    window.localStorage.setItem(NAMESPACE_KEY, JSON.stringify({ [ANY_TAB_FIELD_KEY]: { triggeredAt: 2_000 } }));
    expect(wasPreselectTriggeredInAnyTab('1', 'confirmation')).toBe(false);
  });

  it('keeps the first trigger time and the first time an identity was seen', () => {
    recordPreselectTrigger('1', 'confirmation', false);
    vi.setSystemTime(3_000);
    recordPreselectTrigger('1', 'confirmation', true);
    vi.setSystemTime(5_000);
    recordPreselectTrigger('1', 'confirmation', true);

    expect(markPreselectArrival('1', 'confirmation')).toEqual({ triggeredAt: 1_000, identitySeenAt: 3_000 });
  });

  it('returns the record on the first arrival only', () => {
    recordPreselectTrigger('1', 'confirmation', false);

    expect(markPreselectArrival('1', 'confirmation')).toEqual({ triggeredAt: 1_000 });
    expect(markPreselectArrival('1', 'confirmation')).toBeUndefined();
  });

  it('returns an empty record for an arrival with no trigger in this tab, then nothing on a repeat', () => {
    expect(markPreselectArrival('1', 'confirmation')).toEqual({});
    expect(markPreselectArrival('1', 'confirmation')).toBeUndefined();
  });

  it('starts a fresh record when a trigger follows a reported arrival', () => {
    recordPreselectTrigger('1', 'confirmation', true);
    recordPreselectFired('1', 'confirmation');
    markPreselectArrival('1', 'confirmation');

    vi.setSystemTime(9_000);
    recordPreselectTrigger('1', 'confirmation', false);

    expect(markPreselectArrival('1', 'confirmation')).toEqual({ triggeredAt: 9_000 });
  });

  it('reads only numeric fields back', () => {
    window.sessionStorage.setItem(
      NAMESPACE_KEY,
      JSON.stringify({ [FIELD_KEY]: { triggeredAt: 1, firedAt: 'not-a-time', email: 'a@example.com' } }),
    );

    expect(markPreselectArrival('1', 'confirmation')).toEqual({ triggeredAt: 1 });
  });

  it("clears only the given account's records", () => {
    recordPreselectTrigger('1', 'confirmation', true);
    recordPreselectTrigger('12', 'confirmation', true);

    clearPreselectArrivals('1');

    expect(Object.keys(readNamespace(window.sessionStorage) ?? {})).toEqual(['preselectArrival:12:confirmation']);
    expect(Object.keys(readNamespace(window.localStorage) ?? {})).toEqual(['preselectTriggerAnyTab:12:confirmation']);
  });

  it('keeps records in page memory, off the device, while persistence is disabled', () => {
    setDevicePersistenceDisabled(true);

    recordPreselectTrigger('1', 'confirmation', true);

    expect(markPreselectArrival('1', 'confirmation')).toEqual({ triggeredAt: 1_000, identitySeenAt: 1_000 });
    expect(wasPreselectTriggeredInAnyTab('1', 'confirmation')).toBe(true);
    expect(window.sessionStorage.length).toBe(0);
    expect(window.localStorage.length).toBe(0);
  });

  it.each(['sessionStorage', 'localStorage'] as const)('never throws when %s is blocked', (blocked) => {
    vi.spyOn(window, blocked, 'get').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => recordPreselectTrigger('1', 'confirmation', true)).not.toThrow();
    expect(() => wasPreselectTriggeredInAnyTab('1', 'confirmation')).not.toThrow();
    expect(() => recordPreselectFired('1', 'confirmation')).not.toThrow();
    expect(() => markPreselectArrival('1', 'confirmation')).not.toThrow();
    expect(() => clearPreselectArrivals('1')).not.toThrow();
  });
});
