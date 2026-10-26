import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ANY_TAB_TRIGGER_TTL_MS,
  CART_ADD_TTL_MS,
  INTENT_ARRIVAL_WINDOW_MS,
  clearPreselectArrivals,
  forgetPreselectCartAdd,
  restorePreselectFired,
  markPreselectArrival,
  recordPreselectFired,
  recordPreselectIntent,
  recordPreselectNearMiss,
  recordPreselectPaymentPick,
  recordPreselectTrigger,
  recordPreselectCartAdd,
  wasPreselectCartAdded,
  wasPreselectFiredRecently,
  wasPreselectTriggeredInAnyTab,
  wasPreselectTriggeredRecently,
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

  it('keeps the first near miss as a timestamp only, and hands it to the arrival', () => {
    recordPreselectNearMiss('1', 'confirmation');
    vi.setSystemTime(2_000);
    recordPreselectNearMiss('1', 'confirmation');

    expect(readNamespace(window.sessionStorage)).toEqual({ [FIELD_KEY]: { nearMissAt: 1_000 } });
    expect(markPreselectArrival('1', 'confirmation')).toEqual({ nearMissAt: 1_000 });
  });

  it('leaves a reported arrival closed when a near miss follows it', () => {
    recordPreselectNearMiss('1', 'confirmation');
    markPreselectArrival('1', 'confirmation');
    vi.setSystemTime(2_000);
    recordPreselectNearMiss('1', 'confirmation');

    expect(markPreselectArrival('1', 'confirmation')).toBeUndefined();
  });

  it('keeps the fire of a reported arrival when the target page reloads under the trigger path', () => {
    recordPreselectTrigger('1', 'confirmation', true);
    recordPreselectFired('1', 'confirmation');
    markPreselectArrival('1', 'confirmation');
    vi.setSystemTime(2_000);
    recordPreselectNearMiss('1', 'confirmation');

    expect(readNamespace(window.sessionStorage)).toEqual({
      [FIELD_KEY]: { triggeredAt: 1_000, identitySeenAt: 1_000, firedAt: 1_000, arrivedAt: 1_000 },
    });
    expect(markPreselectArrival('1', 'confirmation')).toBeUndefined();
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

  describe('the one-per-checkout window', () => {
    it('reports a fire within the window and not after it', () => {
      recordPreselectFired('1', 'confirmation');
      expect(wasPreselectFiredRecently('1', 'confirmation')).toBe(true);
      vi.setSystemTime(1_000 + INTENT_ARRIVAL_WINDOW_MS);
      expect(wasPreselectFiredRecently('1', 'confirmation')).toBe(false);
    });

    it('starts a fresh window on the first fire after the last one expired', () => {
      recordPreselectFired('1', 'confirmation');
      vi.setSystemTime(1_000 + INTENT_ARRIVAL_WINDOW_MS + 1);
      recordPreselectFired('1', 'confirmation');
      expect(wasPreselectFiredRecently('1', 'confirmation')).toBe(true);
    });

    it('forgets a fire whose call failed, keeping the rest of the record', () => {
      recordPreselectTrigger('1', 'confirmation', true);
      const previous = recordPreselectFired('1', 'confirmation');
      restorePreselectFired('1', 'confirmation', previous);
      expect(wasPreselectFiredRecently('1', 'confirmation')).toBe(false);
      expect(markPreselectArrival('1', 'confirmation')).toEqual({ triggeredAt: 1_000, identitySeenAt: 1_000 });
    });

    it('leaves the record alone when no fire was recorded', () => {
      recordPreselectTrigger('1', 'confirmation', true);
      restorePreselectFired('1', 'confirmation', { firedAt: 500 });
      expect(wasPreselectFiredRecently('1', 'confirmation')).toBe(false);
      expect(markPreselectArrival('1', 'confirmation')).toEqual({ triggeredAt: 1_000, identitySeenAt: 1_000 });
    });

    it('keeps an earlier successful fire when a later attempt in the window fails', () => {
      recordPreselectFired('1', 'confirmation');
      vi.setSystemTime(5_000);
      const previous = recordPreselectFired('1', 'confirmation');
      expect(previous).toEqual({ firedAt: 1_000 });
      restorePreselectFired('1', 'confirmation', previous);
      expect(wasPreselectFiredRecently('1', 'confirmation')).toBe(true);
      vi.setSystemTime(1_000 + INTENT_ARRIVAL_WINDOW_MS);
      expect(wasPreselectFiredRecently('1', 'confirmation')).toBe(false);
    });

    it('lets changed attributes through and counts the same or an unknown digest', () => {
      recordPreselectFired('1', 'confirmation', 11);
      expect(wasPreselectFiredRecently('1', 'confirmation', 11)).toBe(true);
      expect(wasPreselectFiredRecently('1', 'confirmation', 22)).toBe(false);
      expect(wasPreselectFiredRecently('1', 'confirmation')).toBe(true);
      recordPreselectFired('1', 'other');
      expect(wasPreselectFiredRecently('1', 'other', 22)).toBe(true);
    });

    it('keeps the first fire time but follows the latest digest within the window', () => {
      recordPreselectFired('1', 'confirmation', 11);
      vi.setSystemTime(5_000);
      expect(recordPreselectFired('1', 'confirmation', 22)).toEqual({ firedAt: 1_000, firedDigest: 11 });
      expect(wasPreselectFiredRecently('1', 'confirmation', 22)).toBe(true);
      expect(wasPreselectFiredRecently('1', 'confirmation', 11)).toBe(false);
      vi.setSystemTime(1_000 + INTENT_ARRIVAL_WINDOW_MS);
      expect(wasPreselectFiredRecently('1', 'confirmation', 22)).toBe(false);
    });

    it('rolls a failed changed-attribute fire back to the earlier fire and its digest', () => {
      recordPreselectFired('1', 'confirmation', 11);
      vi.setSystemTime(5_000);
      const previous = recordPreselectFired('1', 'confirmation', 22);
      restorePreselectFired('1', 'confirmation', previous, 22);
      expect(wasPreselectFiredRecently('1', 'confirmation', 11)).toBe(true);
      expect(wasPreselectFiredRecently('1', 'confirmation', 22)).toBe(false);
    });

    it('lets a cart fire hold off only another cart fire', () => {
      recordPreselectFired('1', 'confirmation', 11, true);
      expect(wasPreselectFiredRecently('1', 'confirmation', 11)).toBe(true);
      expect(wasPreselectFiredRecently('1', 'confirmation', 11, true)).toBe(false);
      expect(markPreselectArrival('1', 'confirmation')).toEqual(
        expect.objectContaining({ firedAt: 1_000, firedDigest: 11, firedByCart: true }),
      );
    });

    it('rolls a failed confirm fire after a cart fire back to the cart fire', () => {
      recordPreselectFired('1', 'confirmation', 11, true);
      vi.setSystemTime(5_000);
      const previous = recordPreselectFired('1', 'confirmation', 11);
      expect(previous).toEqual({ firedAt: 1_000, firedDigest: 11, firedByCart: true });
      expect(wasPreselectFiredRecently('1', 'confirmation', 11, true)).toBe(true);
      restorePreselectFired('1', 'confirmation', previous, 11);
      expect(wasPreselectFiredRecently('1', 'confirmation', 11, true)).toBe(false);
      expect(wasPreselectFiredRecently('1', 'confirmation', 11)).toBe(true);
    });

    it('times a confirm fire after a cart fire from the confirm fire', () => {
      recordPreselectFired('1', 'confirmation', 11, true);
      vi.setSystemTime(5_000);
      recordPreselectFired('1', 'confirmation', 11);
      vi.setSystemTime(1_000 + INTENT_ARRIVAL_WINDOW_MS);
      expect(wasPreselectFiredRecently('1', 'confirmation', 11, true)).toBe(true);
    });

    it('keeps a later fire with other attributes when an earlier call rolls back', () => {
      const beforeFirst = recordPreselectFired('1', 'confirmation', 11);
      vi.setSystemTime(5_000);
      recordPreselectFired('1', 'confirmation', 22);
      restorePreselectFired('1', 'confirmation', beforeFirst, 11);
      expect(wasPreselectFiredRecently('1', 'confirmation', 22)).toBe(true);
      expect(wasPreselectFiredRecently('1', 'confirmation', 11)).toBe(false);
    });

    it('stops counting after an arrival', () => {
      recordPreselectTrigger('1', 'confirmation', true);
      recordPreselectFired('1', 'confirmation');
      expect(wasPreselectTriggeredRecently('1', 'confirmation')).toBe(true);
      markPreselectArrival('1', 'confirmation');
      expect(wasPreselectFiredRecently('1', 'confirmation')).toBe(false);
      expect(wasPreselectTriggeredRecently('1', 'confirmation')).toBe(false);
    });
  });

  it('reads only numeric fields back', () => {
    window.sessionStorage.setItem(
      NAMESPACE_KEY,
      JSON.stringify({ [FIELD_KEY]: { triggeredAt: 1, firedAt: 'not-a-time', email: 'a@example.com' } }),
    );

    expect(markPreselectArrival('1', 'confirmation')).toEqual({ triggeredAt: 1 });
  });

  describe('recordPreselectPaymentPick', () => {
    it('keeps the latest pick and copies it onto the next fire', () => {
      recordPreselectPaymentPick('1', 'confirmation', 'card', 900);
      recordPreselectPaymentPick('1', 'confirmation', 'paypal', 950);
      recordPreselectPaymentPick('1', 'confirmation', 'venmo', 920);
      recordPreselectFired('1', 'confirmation', 7);

      expect(markPreselectArrival('1', 'confirmation')).toEqual({
        paymentPick: 'paypal',
        paymentPickAt: 950,
        paymentAtFire: 'paypal',
        firedAt: 1_000,
        firedDigest: 7,
      });
    });

    it('keeps the pick a fire went out with when the shopper picks again', () => {
      recordPreselectPaymentPick('1', 'confirmation', 'card', 900);
      recordPreselectFired('1', 'confirmation', 7);
      recordPreselectPaymentPick('1', 'confirmation', 'apple_pay', 1_000);

      expect(markPreselectArrival('1', 'confirmation')).toMatchObject({
        paymentPick: 'apple_pay',
        paymentAtFire: 'card',
      });
    });

    it('fires with no pick when the last one is older than the window', () => {
      recordPreselectPaymentPick('1', 'confirmation', 'card', 900);
      vi.setSystemTime(900 + INTENT_ARRIVAL_WINDOW_MS);
      recordPreselectFired('1', 'confirmation', 7);

      expect(markPreselectArrival('1', 'confirmation')).not.toHaveProperty('paymentAtFire');
    });

    it('rolls a failed fire back to the pick the earlier fire went out with', () => {
      recordPreselectPaymentPick('1', 'confirmation', 'card', 900);
      recordPreselectFired('1', 'confirmation', 7);
      recordPreselectPaymentPick('1', 'confirmation', 'paypal', 950);
      const previous = recordPreselectFired('1', 'confirmation', 8);
      restorePreselectFired('1', 'confirmation', previous, 8);

      expect(previous).toEqual({ firedAt: 1_000, firedDigest: 7, paymentAtFire: 'card' });
      expect(markPreselectArrival('1', 'confirmation')).toMatchObject({ firedDigest: 7, paymentAtFire: 'card' });
    });

    it('forgets the pick of a failed fire with no earlier fire', () => {
      recordPreselectPaymentPick('1', 'confirmation', 'card', 900);
      recordPreselectFired('1', 'confirmation', 7);
      restorePreselectFired('1', 'confirmation', undefined, 7);

      const record = markPreselectArrival('1', 'confirmation');
      expect(record).not.toHaveProperty('firedAt');
      expect(record).not.toHaveProperty('paymentAtFire');
    });

    it('keeps a reported arrival closed when the shopper picks afterwards', () => {
      recordPreselectFired('1', 'confirmation', 7);
      markPreselectArrival('1', 'confirmation');
      recordPreselectPaymentPick('1', 'confirmation', 'card', 1_000);

      expect(markPreselectArrival('1', 'confirmation')).toBeUndefined();
    });

    it('drops a stored value that is not a known family', () => {
      window.sessionStorage.setItem(
        NAMESPACE_KEY,
        JSON.stringify({ [FIELD_KEY]: { paymentPick: 'shopper@example.com', paymentPickAt: 900, paymentAtFire: 'x' } }),
      );

      expect(markPreselectArrival('1', 'confirmation')).toEqual({ paymentPickAt: 900 });
    });
  });

  describe('recordPreselectIntent', () => {
    it('stores only the time and the kind next to the other timestamps', () => {
      recordPreselectTrigger('1', 'confirmation', false);
      recordPreselectIntent('1', 'confirmation', 'checkout_step', 900);

      expect(readNamespace(window.sessionStorage)).toEqual({
        [FIELD_KEY]: { triggeredAt: 1_000, intentAt: 900, intentKind: 'checkout_step' },
      });
    });

    it('keeps the strongest kind: commit, then wallet, then frame, then checkout_step, then cart', () => {
      recordPreselectIntent('1', 'confirmation', 'cart', 890);
      recordPreselectIntent('1', 'confirmation', 'checkout_step', 900);
      recordPreselectIntent('1', 'confirmation', 'frame', 910);
      recordPreselectIntent('1', 'confirmation', 'wallet', 920);
      recordPreselectIntent('1', 'confirmation', 'commit', 930);
      recordPreselectIntent('1', 'confirmation', 'wallet', 990);
      recordPreselectIntent('1', 'confirmation', 'frame', 990);
      recordPreselectIntent('1', 'confirmation', 'checkout_step', 990);
      recordPreselectIntent('1', 'confirmation', 'cart', 990);

      expect(markPreselectArrival('1', 'confirmation')).toEqual({ intentAt: 930, intentKind: 'commit' });
    });

    it.each([
      ['commit', 'wallet'],
      ['wallet', 'frame'],
      ['frame', 'checkout_step'],
      ['checkout_step', 'cart'],
    ] as const)('keeps %s over a later %s', (stronger, weaker) => {
      recordPreselectIntent('1', 'confirmation', stronger, 900);
      recordPreselectIntent('1', 'confirmation', weaker, 950);

      expect(markPreselectArrival('1', 'confirmation')).toEqual({ intentAt: 900, intentKind: stronger });
    });

    it('stores a cart click and reads it back for the arrival', () => {
      recordPreselectIntent('1', 'bag', 'cart', 900);
      expect(markPreselectArrival('1', 'bag')).toEqual({ intentAt: 900, intentKind: 'cart' });
    });

    it('keeps the latest time for the stored kind', () => {
      recordPreselectIntent('1', 'confirmation', 'wallet', 950);
      recordPreselectIntent('1', 'confirmation', 'wallet', 900);
      expect(markPreselectArrival('1', 'confirmation')).toEqual({ intentAt: 950, intentKind: 'wallet' });

      vi.setSystemTime(2_000);
      recordPreselectIntent('1', 'confirmation', 'wallet', 1_500);
      recordPreselectIntent('1', 'confirmation', 'wallet', 1_800);
      expect(markPreselectArrival('1', 'confirmation')).toEqual({ intentAt: 1_800, intentKind: 'wallet' });
    });

    it('lets any kind replace a stronger intent past the arrival window', () => {
      recordPreselectIntent('1', 'confirmation', 'commit', 1_000);
      vi.setSystemTime(1_000 + INTENT_ARRIVAL_WINDOW_MS);
      recordPreselectIntent('1', 'confirmation', 'checkout_step', 1_000 + INTENT_ARRIVAL_WINDOW_MS);

      expect(markPreselectArrival('1', 'confirmation')).toEqual({
        intentAt: 1_000 + INTENT_ARRIVAL_WINDOW_MS,
        intentKind: 'checkout_step',
      });
    });

    it('starts a fresh record after a reported arrival', () => {
      recordPreselectIntent('1', 'confirmation', 'commit', 900);
      markPreselectArrival('1', 'confirmation');

      recordPreselectIntent('1', 'confirmation', 'frame', 950);

      expect(markPreselectArrival('1', 'confirmation')).toEqual({ intentAt: 950, intentKind: 'frame' });
    });

    it('reads back neither field when the kind is not one it knows', () => {
      window.sessionStorage.setItem(
        NAMESPACE_KEY,
        JSON.stringify({ [FIELD_KEY]: { firedAt: 1, intentAt: 2, intentKind: 'a@example.com' } }),
      );

      expect(markPreselectArrival('1', 'confirmation')).toEqual({ firedAt: 1 });
    });

    it('keeps the intent in page memory, off the device, while persistence is disabled', () => {
      setDevicePersistenceDisabled(true);

      recordPreselectIntent('1', 'confirmation', 'wallet', 900);

      expect(markPreselectArrival('1', 'confirmation')).toEqual({ intentAt: 900, intentKind: 'wallet' });
      expect(window.sessionStorage.length).toBe(0);
      expect(window.localStorage.length).toBe(0);
    });
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
    expect(() => recordPreselectIntent('1', 'confirmation', 'commit', 1_000)).not.toThrow();
    expect(() => markPreselectArrival('1', 'confirmation')).not.toThrow();
    expect(() => clearPreselectArrivals('1')).not.toThrow();
    expect(() => recordPreselectCartAdd('1', 1_000)).not.toThrow();
    expect(() => wasPreselectCartAdded('1')).not.toThrow();
    expect(() => forgetPreselectCartAdd('1')).not.toThrow();
  });

  describe('the remembered add-to-cart click', () => {
    it('keeps only the time, in localStorage, for that account', () => {
      recordPreselectCartAdd('1', 900);

      expect(wasPreselectCartAdded('1')).toBe(true);
      expect(wasPreselectCartAdded('12')).toBe(false);
      expect(readNamespace(window.localStorage)).toEqual({ 'preselectCartAdd:1': { addedAt: 900 } });
      expect(window.sessionStorage.length).toBe(0);
    });

    it('outlives the session, and clearing the arrivals for a session end leaves it', () => {
      recordPreselectCartAdd('1', 1_000);
      window.sessionStorage.clear();
      clearPreselectArrivals('1');

      expect(wasPreselectCartAdded('1')).toBe(true);
    });

    it('lapses after CART_ADD_TTL_MS and is then removed', () => {
      recordPreselectCartAdd('1', 1_000);
      vi.setSystemTime(1_000 + CART_ADD_TTL_MS - 1);
      expect(wasPreselectCartAdded('1')).toBe(true);

      vi.setSystemTime(1_000 + CART_ADD_TTL_MS);
      expect(wasPreselectCartAdded('1')).toBe(false);
      expect(readNamespace(window.localStorage)).toBeNull();
    });

    it('does not count an add stamped after the current time', () => {
      recordPreselectCartAdd('1', 5_000);

      expect(wasPreselectCartAdded('1')).toBe(false);
    });

    it('ignores a click made before the add was forgotten, which reached the kit after', () => {
      vi.setSystemTime(2_000);
      forgetPreselectCartAdd('1');

      recordPreselectCartAdd('1', 1_500);
      recordPreselectCartAdd('1', 2_000);
      expect(wasPreselectCartAdded('1')).toBe(false);

      recordPreselectCartAdd('1', 2_001);
      vi.setSystemTime(2_001);
      expect(wasPreselectCartAdded('1')).toBe(true);
      expect(wasPreselectCartAdded('12')).toBe(false);
    });

    it('shares when the add was forgotten with every tab, through localStorage', () => {
      vi.setSystemTime(2_000);
      forgetPreselectCartAdd('1');

      expect(readNamespace(window.localStorage)).toEqual({ 'preselectCartAdd:1': { forgottenAt: 2_000 } });
      expect(window.sessionStorage.length).toBe(0);
    });

    it('drops when the add was forgotten once CART_ADD_TTL_MS old', () => {
      forgetPreselectCartAdd('1');
      vi.setSystemTime(1_000 + CART_ADD_TTL_MS);

      expect(wasPreselectCartAdded('1')).toBe(false);
      expect(readNamespace(window.localStorage)).toBeNull();
    });

    it('is forgotten for that account only', () => {
      recordPreselectCartAdd('1', 1_000);
      recordPreselectCartAdd('12', 1_000);

      forgetPreselectCartAdd('1');

      expect(wasPreselectCartAdded('1')).toBe(false);
      expect(wasPreselectCartAdded('12')).toBe(true);
    });

    it('stays in page memory, off the device, while persistence is disabled', () => {
      setDevicePersistenceDisabled(true);

      recordPreselectCartAdd('1', 1_000);

      expect(wasPreselectCartAdded('1')).toBe(true);
      expect(window.localStorage.length).toBe(0);
    });

    it.each([[null], ['900'], [{}], [{ addedAt: '900' }], [{ forgottenAt: 900 }]])(
      'ignores a stored value of %j',
      (stored) => {
        window.localStorage.setItem(NAMESPACE_KEY, JSON.stringify({ 'preselectCartAdd:1': stored }));

        expect(wasPreselectCartAdded('1')).toBe(false);
      },
    );
  });
});
