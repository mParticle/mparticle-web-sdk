import { describe, it, expect, beforeEach, afterEach, onTestFinished, vi } from 'vitest';
import type { SDKEvent } from '@mparticle/web-sdk/internal';
import type { DiagnosticLogEntry } from '../../src/diagnosticTiming';
import type { PreselectionConfigEntry } from '../../src/preselectionConfig';
import {
  handlePreselectIntentSignal,
  recordPreselectIntentPath,
  type PreselectIntentSignal,
  cancelScheduledDispatch,
  createPreselectState,
  maybeFirePreselect,
  maybeFirePersistedPreselect,
  dispatchPreselect,
  getPreselectRollback,
  flushPendingPreselectDispatches,
  findPreselectionConfig,
  findPreselectionConfigByIdentifier,
  getPreselectCacheMatchKeys,
  hasPreselectionConfigForAccount,
  maybeFirePreselectForPathname,
  maybeFirePreselectForEvent,
  maybeFirePreselectForCartPageView,
  isPreselectCartAttributeKey,
  withoutPreselectCartGateAttribute,
  isReadableFormEmailChange,
  recordShopperInput,
  isPreselectAttributeKey,
  isPreselectTriggerEventName,
  applyPreselectionConfigSetting,
  reportPreselectArrival,
  recordPreselectPaymentClick,
  handlePreselectPaymentPick,
  getPreselectClientType,
  getPreselectAttributeDefaults,
  applyPreselectAttributeDefaults,
  PRESELECT_TRIGGER_ATTRIBUTE,
  type PreselectHost,
  type PreselectState,
} from '../../src/preselection';
import {
  buildActivePreselectFieldKey,
  getActivePreselect,
  restoreActivePreselect,
  setActivePreselect,
} from '../../src/activePreselectStorage';
import { getPendingPreselect, setPendingPreselect, clearPendingPreselect } from '../../src/pendingPreselectStorage';
import {
  markPreselectArrival,
  recordPreselectFired,
  recordPreselectIntent,
  recordPreselectNearMiss,
  recordPreselectPaymentPick,
  recordPreselectTrigger,
  recordPreselectCartAdd,
  wasPreselectCartAdded,
  wasPreselectTriggeredInAnyTab,
  wasPreselectFiredRecently,
  wasPreselectTriggeredRecently,
  restorePreselectFired,
} from '../../src/preselectArrivalStorage';
import { setDevicePersistenceDisabled } from '../../src/storage';
import { djb2 } from '../../src/utils';

// Isolates preselection.ts from its collaborator modules: the config data and the
// active-preselect cache are mocked per-test rather than driven through the real modules
// (which hold a shared global array / real browser storage and have their own coverage
// elsewhere), so each test controls exactly the config/cache state it needs.
const { mockConfig } = vi.hoisted(() => ({ mockConfig: { current: [] as PreselectionConfigEntry[] } }));

vi.mock('../../src/preselectionConfig', () => ({
  PRESELECT_SKIP_DEFAULT: 'skip',
  get PRESELECTION_CONFIG() {
    return mockConfig.current;
  },
}));

vi.mock('../../src/activePreselectStorage', () => ({
  buildActivePreselectFieldKey: vi.fn(),
  getActivePreselect: vi.fn(),
  setActivePreselect: vi.fn(),
  restoreActivePreselect: vi.fn(),
}));

vi.mock('../../src/pendingPreselectStorage', () => ({
  getPendingPreselect: vi.fn(),
  setPendingPreselect: vi.fn(),
  clearPendingPreselect: vi.fn(),
}));

vi.mock('../../src/preselectArrivalStorage', () => ({
  INTENT_ARRIVAL_WINDOW_MS: 30 * 60_000,
  markPreselectArrival: vi.fn(),
  recordPreselectFired: vi.fn(),
  recordPreselectIntent: vi.fn(),
  recordPreselectNearMiss: vi.fn(),
  recordPreselectPaymentPick: vi.fn(),
  recordPreselectTrigger: vi.fn(),
  recordPreselectCartAdd: vi.fn(),
  wasPreselectCartAdded: vi.fn(),
  wasPreselectTriggeredInAnyTab: vi.fn(),
  wasPreselectFiredRecently: vi.fn(),
  wasPreselectTriggeredRecently: vi.fn(),
  restorePreselectFired: vi.fn(),
}));

const ACCOUNT_ID = '900001';
const PATHNAME = '/preselect-test-path';
const TARGET_PAGE_IDENTIFIER = 'preselect-target-page';
const ATTRIBUTE_KEY = 'loyaltyTier';
const FIELD_KEY = 'active-preselect-field-key';
const MPID = 'mpid-1';

const CONFIG_ENTRY = {
  accountId: ACCOUNT_ID,
  pathname: PATHNAME,
  targetPageIdentifier: TARGET_PAGE_IDENTIFIER,
  attributeKeys: [ATTRIBUTE_KEY],
};

const buildEvent = (eventAttributes: Record<string, unknown> = {}): SDKEvent =>
  ({ EventAttributes: eventAttributes }) as SDKEvent;

// The kit's listener sees a shopper's typing or autofill as a trusted event; jsdom cannot dispatch one.
const shopperEvent = (target: EventTarget | null, type = 'change') =>
  ({ type, isTrusted: true, target }) as unknown as Event;
const shopperTouch = (target: EventTarget, type = 'input') => recordShopperInput(shopperEvent(target, type));

// jsdom marks every dispatched event untrusted. This one stays trusted through its whole propagation, the way a
// browser carries a shopper's typing or autofill past document capture listeners and on to the field. A script
// that dispatches it again gets an untrusted event, as in a browser.
const dispatchShopperEvent = (target: EventTarget, type = 'input'): Event => {
  const event = new Event(type, { bubbles: true });
  const impl = Object.getOwnPropertySymbols(event).find((key) => key.description === 'impl') as symbol;
  let trusted = true;
  Object.defineProperty((event as unknown as Record<symbol, object>)[impl], 'isTrusted', {
    get: () => trusted,
    set() {},
  });
  target.dispatchEvent(event);
  expect(event.isTrusted).toBe(true);
  trusted = false;
  return event;
};

// Stands in for the kit's document capture listener, which records every input and change event first.
const listenLikeTheKit = () => {
  document.addEventListener('input', recordShopperInput, true);
  document.addEventListener('change', recordShopperInput, true);
  onTestFinished(() => {
    document.removeEventListener('input', recordShopperInput, true);
    document.removeEventListener('change', recordShopperInput, true);
  });
};

// Capture handlers on a form that change the field and announce it with a script change. They run after the
// document hears the shopper's event, so the field hears that change before the shopper's event reaches it.
const OVERWRITING_HANDLERS = [
  {
    label: 'overwrote',
    prepare: (_input: HTMLInputElement) => undefined,
    overwrite: (input: HTMLInputElement) => {
      input.value = 'someone-else@example.com';
      input.dispatchEvent(new Event('change', { bubbles: true }));
    },
  },
  {
    label: 'switched from search to text and overwrote',
    prepare: (input: HTMLInputElement) => {
      dispatchShopperEvent(input, 'input');
      input.type = 'search';
    },
    overwrite: (input: HTMLInputElement) => {
      input.type = 'text';
      input.value = 'someone-else@example.com';
      input.dispatchEvent(new Event('change', { bubbles: true }));
    },
  },
];

const typeIntoOverwritingForm = (value: string, handler = OVERWRITING_HANDLERS[0]) => {
  listenLikeTheKit();
  const form = document.createElement('form');
  const input = document.createElement('input');
  input.type = 'text';
  form.appendChild(input);
  document.body.appendChild(form);
  handler.prepare(input);
  const overwrite = vi.fn(() => handler.overwrite(input));
  form.addEventListener('input', overwrite, true);
  input.value = value;
  dispatchShopperEvent(input, 'input');
  expect(overwrite).toHaveBeenCalledTimes(1);
  return { form, input, overwrite };
};

// A field a script once announced a change on with `scriptEvent`, then the shopper edited.
const touchAfterScriptChange = (value: string) => {
  listenLikeTheKit();
  const input = document.createElement('input');
  input.type = 'text';
  document.body.appendChild(input);
  const scriptEvent = new Event('change', { bubbles: true });
  input.dispatchEvent(scriptEvent);
  input.value = value;
  const shopperEvent = dispatchShopperEvent(input, 'input');
  return { input, shopperEvent, scriptEvent };
};

type ReusedEventOverwrite = (input: HTMLInputElement, shopperEvent: Event, scriptEvent: Event) => void;

// A script overwrites a touched field and announces it with an event object the kit has already heard.
const REUSED_EVENT_OVERWRITES: Array<{ label: string; overwrite: ReusedEventOverwrite }> = [
  {
    label: 'the event the shopper fired',
    overwrite: (input, shopperEvent) => {
      input.value = 'someone-else@example.com';
      input.dispatchEvent(shopperEvent);
    },
  },
  {
    label: 'an event the shopper fired on another field',
    overwrite: (input) => {
      const other = document.createElement('input');
      other.type = 'email';
      document.body.appendChild(other);
      const otherEvent = dispatchShopperEvent(other, 'input');
      other.remove();
      input.value = 'someone-else@example.com';
      input.dispatchEvent(otherEvent);
    },
  },
  {
    label: 'its own earlier event',
    overwrite: (input, _shopperEvent, scriptEvent) => {
      input.value = 'someone-else@example.com';
      input.dispatchEvent(scriptEvent);
    },
  },
];

// What a speculative dispatch sends: the resolved attributes plus the trigger that fired it.
const tagged = (attributes: Record<string, unknown>, kind = 'pageview', pathname = PATHNAME) => ({
  ...attributes,
  [PRESELECT_TRIGGER_ATTRIBUTE]: `${kind}|${pathname}`,
});

describe('preselection', () => {
  let state: PreselectState;
  let host: PreselectHost;
  let selectPlacementsCalls: Record<string, unknown>[];
  let loggedDiagnostics: DiagnosticLogEntry[];
  let loggedEvents: DiagnosticLogEntry[];

  const expectFiresAfter = (ms: number) => {
    vi.advanceTimersByTime(ms - 1);
    expect(selectPlacementsCalls).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(selectPlacementsCalls).toHaveLength(1);
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockConfig.current = [];
    vi.mocked(buildActivePreselectFieldKey).mockReturnValue(FIELD_KEY);
    vi.mocked(getActivePreselect).mockReturnValue(null);
    vi.mocked(getPendingPreselect).mockReturnValue(null);
    vi.mocked(setPendingPreselect).mockReturnValue(true);
    vi.mocked(wasPreselectTriggeredInAnyTab).mockReturnValue(false);
    vi.mocked(wasPreselectFiredRecently).mockReturnValue(false);
    vi.mocked(wasPreselectTriggeredRecently).mockReturnValue(false);

    selectPlacementsCalls = [];
    loggedDiagnostics = [];
    loggedEvents = [];
    state = createPreselectState();

    host = {
      accountId: ACCOUNT_ID,
      filteredUser: {
        getUserIdentities: () => ({ userIdentities: { email: 'test@example.com' } }),
        getMPID: () => MPID,
      } as unknown as PreselectHost['filteredUser'],
      userAttributes: {},
      isKitReady: () => true,
      isPreselectionEnabled: () => true,
      getEventAttributeValue: (event, key) => {
        const attributes = (event as SDKEvent).EventAttributes;
        return attributes && attributes[key] !== undefined ? attributes[key] : null;
      },
      logPlacementDiagnostic: (entry) => {
        if (entry) loggedDiagnostics.push(entry);
      },
      log: (entry) => {
        if (entry) loggedEvents.push(entry);
      },
      selectPlacements: (options) => {
        selectPlacementsCalls.push(options);
      },
    };
  });

  describe('intent triggers', () => {
    let clock = 3000000000000;
    // Checkout intent turns on with the first signal, so a page view before it still takes its
    // dispatchDelayMs hold. That is the only way a click meets a running hold or a fired page view.
    const send = (kind: PreselectIntentSignal['kind'] = 'commit', t = Date.now() + 1) => {
      host.isCheckoutIntentActive = () => true;
      vi.setSystemTime(t);
      const signal = Object.freeze({ kind, t });
      handlePreselectIntentSignal(state, host, signal);
      return signal;
    };
    beforeEach(() => {
      vi.useFakeTimers();
      clock += 10000;
      vi.setSystemTime(clock);
      window.history.replaceState({}, '', PATHNAME);
      recordPreselectIntentPath('/reset', clock - 2);
      recordPreselectIntentPath(PATHNAME, clock - 1);
      mockConfig.current = [{ ...CONFIG_ENTRY, dispatchDelayMs: 5000 }];
      host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
      host.isCheckoutIntentActive = () => false;
      // A fire on the confirm click needs the shopper's email on the call.
      host.getUserIdentities = () => ({ email: 'shopper@example.test' });
    });
    afterEach(() => {
      cancelScheduledDispatch(state);
      vi.useRealTimers();
      window.history.replaceState({}, '', '/');
    });
    it('fires commit immediately with only resolved user attributes and the intent tag', () => {
      send();
      expect(selectPlacementsCalls).toHaveLength(1);
      expect(selectPlacementsCalls[0]).toEqual(
        expect.objectContaining({
          attributes: tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'intent_commit'),
        }),
      );
      expect(loggedDiagnostics).toContainEqual(
        expect.objectContaining({
          code: 'PRESELECT_FIRED',
          message: expect.stringContaining('[reason=intent]'),
        }),
      );
      expect(state.scheduledDispatch).toBeUndefined();
    });
    it('drops queued intent if privacy is revoked before identity arrives', () => {
      const user = host.filteredUser;
      host.filteredUser = null;
      send();
      expect(state.pending).toHaveLength(1);
      host.filteredUser = user;
      host.isPreselectionPrivacyAllowed = () => false;
      vi.mocked(recordPreselectTrigger).mockClear();

      flushPendingPreselectDispatches(state, host, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(state.pending).toHaveLength(0);
      expect(state.scheduledDispatch).toBeUndefined();
      expect(recordPreselectTrigger).not.toHaveBeenCalled();
      expect(setActivePreselect).not.toHaveBeenCalled();
      expect(setPendingPreselect).not.toHaveBeenCalled();
    });
    it('uses current privacy when intent releases a hold', () => {
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      expect(state.scheduledDispatch).toBeDefined();
      const isKitReady = vi.fn(() => true);
      host.getCurrentHost = () => ({ ...host, isKitReady, isPreselectionPrivacyAllowed: () => false });

      send();
      vi.advanceTimersByTime(5000);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(state.scheduledDispatch).toBeUndefined();
      expect(state.pending).toHaveLength(0);
      expect(isKitReady).not.toHaveBeenCalled();
      expect(setActivePreselect).not.toHaveBeenCalled();
    });
    it('rechecks privacy after a user identity callback changes consent', () => {
      let privacyAllowed = true;
      host.isPreselectionPrivacyAllowed = () => privacyAllowed;
      host.filteredUser = {
        getMPID: () => MPID,
        getUserIdentities: () => {
          privacyAllowed = false;
          return { userIdentities: { customerid: MPID } };
        },
      } as unknown as PreselectHost['filteredUser'];
      const readAttribute = vi.spyOn(host, 'getEventAttributeValue');

      send();

      expect(privacyAllowed).toBe(false);
      expect(readAttribute).not.toHaveBeenCalled();
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(setActivePreselect).not.toHaveBeenCalled();
    });
    it('rechecks privacy after an attribute callback changes consent', () => {
      let privacyAllowed = true;
      host.isPreselectionPrivacyAllowed = () => privacyAllowed;
      host.getEventAttributeValue = () => {
        privacyAllowed = false;
        return 'gold';
      };

      send();

      expect(privacyAllowed).toBe(false);
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(setActivePreselect).not.toHaveBeenCalled();
      expect(recordPreselectFired).not.toHaveBeenCalled();
    });
    it('retains the most recent 4096 signals for replay dedupe', () => {
      // Exceed the 4096 replay cap while staying inside this test's 10000 ms clock step. With checkout
      // intent off each signal is only remembered.
      const signals = Array.from({ length: 4097 }, (_, i) => ({ kind: 'commit' as const, t: Date.now() + 1 + i }));
      signals.forEach((signal) => handlePreselectIntentSignal(state, host, signal));
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(loggedDiagnostics).toHaveLength(0);

      host.isCheckoutIntentActive = () => true;
      handlePreselectIntentSignal(state, host, { ...signals[1] });
      expect(selectPlacementsCalls).toHaveLength(0);
      handlePreselectIntentSignal(state, host, { ...signals[0] });
      expect(selectPlacementsCalls).toHaveLength(1);
      handlePreselectIntentSignal(state, host, { ...signals[4096] });
      expect(selectPlacementsCalls).toHaveLength(1);
    });
    it('drops signals older than the retained path history', () => {
      const t = Date.now();
      for (let i = 1; i <= 8; i++) recordPreselectIntentPath(`/later-${i}`, t + i);
      recordPreselectIntentPath(PATHNAME, t + 9);

      send('commit', t);

      expect(loggedDiagnostics).toHaveLength(0);
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(state.pending).toHaveLength(0);
      expect(state.scheduledDispatch).toBeUndefined();
    });
    it.each(['checkout_step', 'frame'] as const)('observes %s only once per route and never fires', (kind) => {
      send(kind);
      send(kind);
      expect(loggedDiagnostics).toHaveLength(1);
      expect(loggedDiagnostics[0]).toEqual({
        code: 'PRESELECT_SKIPPED',
        message: `Rokt Kit: preselect skipped [reason=intent_observed] [intent_kind=${kind}] [intent_route=entry] [has_email=true] [has_identity=true]`,
      });
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(state.pending).toHaveLength(0);
      expect(state.scheduledDispatch).toBeUndefined();
    });
    it('decides fire from checkout intent alone, ignoring any mode on the signal', () => {
      host.isCheckoutIntentActive = () => true;
      handlePreselectIntentSignal(state, host, {
        kind: 'commit',
        t: Date.now(),
        mode: 'observe',
      } as PreselectIntentSignal);
      expect(selectPlacementsCalls).toHaveLength(1);
    });
    it('fires a commit raised before the kit recorded its route, using the path the core carried', () => {
      host.isCheckoutIntentActive = () => true;
      // Older than every recorded route, so only the carried path can place it.
      const t = 1000;
      handlePreselectIntentSignal(state, host, { kind: 'commit', t, source: 'label', pathname: PATHNAME });
      expect(selectPlacementsCalls).toHaveLength(1);
    });
    it.each([
      ['a full URL', 'https://example.test' + PATHNAME],
      ['an overlong path', '/' + 'a'.repeat(600)],
      ['not a string', 42],
    ])('falls back to the route history when the carried path is %s', (_, pathname) => {
      host.isCheckoutIntentActive = () => true;
      // The route history places this click on the entry's page, so it fires only if the carried path is ignored.
      handlePreselectIntentSignal(state, host, {
        kind: 'commit',
        t: Date.now(),
        pathname,
      } as unknown as PreselectIntentSignal);
      expect(selectPlacementsCalls).toHaveLength(1);
    });
    it('only observes a commit whose carried path is not the current page', () => {
      host.isCheckoutIntentActive = () => true;
      mockConfig.current = [
        { ...CONFIG_ENTRY, dispatchDelayMs: 5000 },
        { ...CONFIG_ENTRY, pathname: '/other-entry', dispatchDelayMs: 5000 },
      ];
      handlePreselectIntentSignal(state, host, { kind: 'commit', t: Date.now(), pathname: '/other-entry' });
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(loggedDiagnostics.map((entry) => entry.message)).toEqual([
        expect.stringContaining('[reason=intent_observed] [intent_kind=commit]'),
      ]);
    });
    it("only observes a guest's commit off every configured path, before any entry", () => {
      window.history.replaceState({}, '', '/elsewhere');
      recordPreselectIntentPath('/elsewhere', Date.now());
      send('commit');
      send('commit');
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(loggedDiagnostics.map((line) => line.message)).toEqual([
        'Rokt Kit: preselect skipped [reason=intent_observed] [intent_kind=commit] [intent_route=before_entry] [has_email=true] [has_identity=true] [logged_in=false]',
      ]);
    });
    it('marks a wallet tap off every entry as after the checkout once this tab saw a trigger', () => {
      vi.mocked(wasPreselectTriggeredRecently).mockReturnValue(true);
      host.isCheckoutIntentActive = () => true;
      window.history.replaceState({}, '', '/elsewhere');
      recordPreselectIntentPath('/elsewhere', Date.now());
      handlePreselectIntentSignal(state, host, { kind: 'wallet', t: Date.now(), source: 'vendor', pathname: '/elsewhere' });
      expect(loggedDiagnostics.map((line) => line.message)).toEqual([
        'Rokt Kit: preselect skipped [reason=intent_observed] [intent_kind=wallet] [intent_route=left] [intent_source=vendor] [has_email=true] [has_identity=true] [logged_in=false]',
      ]);
    });
    it('does not observe a checkout step off every entry', () => {
      window.history.replaceState({}, '', '/elsewhere');
      recordPreselectIntentPath('/elsewhere', Date.now());
      send('checkout_step');
      expect(loggedDiagnostics).toHaveLength(0);
    });
    describe('a logged-in shopper off every entry', () => {
      const PRODUCT_PATH = '/product/42';
      // The digest a default tap's call carries: the entry's attribute plus the shopper's email.
      const TAP_DIGEST = djb2(
        `${JSON.stringify({ [ATTRIBUTE_KEY]: 'gold' })}|${JSON.stringify([['email', 'shopper@example.test']])}`,
      );
      let loggedIn: boolean;
      let currentMpid: string;
      const tap = (kind: PreselectIntentSignal['kind'] = 'wallet', extra: Partial<PreselectIntentSignal> = {}) => {
        host.isCheckoutIntentActive = () => true;
        vi.setSystemTime(Date.now() + 1);
        handlePreselectIntentSignal(state, host, Object.freeze({ kind, t: Date.now(), ...extra }));
      };
      const observedLines = () =>
        loggedDiagnostics.map((line) => line.message).filter((message) => message.includes('intent_observed'));
      beforeEach(() => {
        loggedIn = true;
        currentMpid = MPID;
        host.getCurrentUser = () =>
          ({ getMPID: () => currentMpid, isLoggedIn: () => loggedIn }) as unknown as PreselectHost['filteredUser'];
        window.history.replaceState({}, '', PRODUCT_PATH);
        recordPreselectIntentPath(PRODUCT_PATH, Date.now());
      });

      it('fires an express wallet tap for the one entry and tags it with its route and login', () => {
        tap('wallet', { source: 'vendor' });

        expect(selectPlacementsCalls).toEqual([
          {
            attributes: tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'intent_wallet_off_entry'),
            preselect: true,
            identifier: TARGET_PAGE_IDENTIFIER,
            omitUrl: true,
            preselectBoundUser: { mpid: MPID, requireLogin: true },
          },
        ]);
        expect(loggedDiagnostics.map((line) => line.message)).toEqual([
          'Rokt Kit: preselect fired [reason=intent] [identity_types=email] [intent_kind=wallet] [intent_route=before_entry] [intent_source=vendor] [logged_in=true]',
        ]);
        expect(recordPreselectFired).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER, TAP_DIGEST, false);
        expect(buildActivePreselectFieldKey).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER);
        expect(buildActivePreselectFieldKey).not.toHaveBeenCalledWith(ACCOUNT_ID, PRODUCT_PATH);
        expect(state.pending).toHaveLength(0);
        expect(state.scheduledDispatch).toBeUndefined();
      });
      it('fires a commit tap after the shopper left the checkout, tagged as left', () => {
        vi.mocked(wasPreselectTriggeredRecently).mockReturnValue(true);
        tap('commit');
        expect(selectPlacementsCalls).toEqual([
          expect.objectContaining({ attributes: tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'intent_commit_off_entry') }),
        ]);
        expect(loggedDiagnostics.map((line) => line.message)).toEqual([
          'Rokt Kit: preselect fired [reason=intent] [identity_types=email] [intent_kind=commit] [intent_route=left] [logged_in=true]',
        ]);
      });
      it("only observes a guest's tap", () => {
        loggedIn = false;
        tap('wallet');
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(observedLines()).toEqual([
          'Rokt Kit: preselect skipped [reason=intent_observed] [intent_kind=wallet] [intent_route=before_entry] [has_email=true] [has_identity=true] [logged_in=false]',
        ]);
        expect(recordPreselectFired).not.toHaveBeenCalled();
      });
      it('treats a login that belongs to another user, or no kit user, as a guest', () => {
        currentMpid = 'someone-else';
        tap('wallet');
        currentMpid = MPID;
        host.filteredUser = null;
        tap('commit');
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(observedLines()).toEqual([
          expect.stringContaining('[intent_kind=wallet] [intent_route=before_entry] [has_email=true] [has_identity=true] [logged_in=false]'),
          expect.stringContaining('[intent_kind=commit] [intent_route=before_entry] [has_email=true] [has_identity=false] [logged_in=false]'),
        ]);
      });
      it('treats a core whose user has no login state as a guest', () => {
        host.getCurrentUser = () => ({ getMPID: () => MPID }) as unknown as PreselectHost['filteredUser'];
        tap('wallet');
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(observedLines()).toEqual([expect.stringContaining('[logged_in=false]')]);
      });
      it.each(['checkout_step', 'frame'] as const)('never fires or observes a %s tap', (kind) => {
        tap(kind);
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(loggedDiagnostics).toHaveLength(0);
      });
      it('skips a tap without an email on the call, and fires a later one once an email arrives', () => {
        host.getUserIdentities = () => ({ customerid: 'shopper' });
        tap('wallet');
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(observedLines()).toEqual([
          'Rokt Kit: preselect skipped [reason=intent_observed] [intent_kind=wallet] [intent_route=before_entry] [has_email=false] [has_identity=true] [logged_in=true] [cause=no_strict_email]',
        ]);
        expect(recordPreselectFired).not.toHaveBeenCalled();
        expect(state.pending).toHaveLength(0);

        host.getUserIdentities = () => ({ customerid: 'shopper', email: 'shopper@example.test' });
        tap('wallet');
        expect(selectPlacementsCalls).toHaveLength(1);
      });
      it('judges the email on what the call to the one target page would send', () => {
        host.getUserIdentities = () => ({});
        const outgoing = vi.fn((attributes: Record<string, unknown>, identifier?: string) =>
          identifier === TARGET_PAGE_IDENTIFIER ? { ...attributes, emailsha256: 'a'.repeat(64) } : attributes,
        );
        host.getOutgoingAttributes = outgoing;
        tap('wallet');
        expect(outgoing).toHaveBeenCalledWith({ [ATTRIBUTE_KEY]: 'gold' }, TARGET_PAGE_IDENTIFIER);
        expect(selectPlacementsCalls).toHaveLength(1);
      });
      it('sends nothing more once this tab fired for the target page', () => {
        tap('wallet');
        expect(selectPlacementsCalls).toHaveLength(1);
        vi.mocked(wasPreselectFiredRecently).mockReturnValue(true);
        tap('commit');
        expect(selectPlacementsCalls).toHaveLength(1);
        expect(wasPreselectFiredRecently).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER, TAP_DIGEST, true);
        expect(observedLines()).toEqual([
          expect.stringContaining('[intent_kind=commit] [intent_route=before_entry] [has_email=true] [has_identity=true] [logged_in=true] [cause=active_preselection]'),
        ]);
      });
      it('skips a tap with the attributes this tab fired, and fires one whose attributes changed', () => {
        let firedDigest: number | undefined;
        vi.mocked(recordPreselectFired).mockImplementation((_, __, digest) => {
          firedDigest = digest;
          return undefined;
        });
        vi.mocked(wasPreselectFiredRecently).mockImplementation(
          (_, __, digest) => firedDigest !== undefined && (digest === undefined || digest === firedDigest),
        );
        tap('wallet');
        tap('commit');
        expect(selectPlacementsCalls).toHaveLength(1);
        expect(observedLines()).toEqual([expect.stringContaining('[logged_in=true] [cause=active_preselection]')]);

        host.userAttributes = { [ATTRIBUTE_KEY]: 'silver' };
        tap('wallet');
        expect(selectPlacementsCalls).toHaveLength(2);
        expect(selectPlacementsCalls[1].attributes).toEqual(tagged({ [ATTRIBUTE_KEY]: 'silver' }, 'intent_wallet_off_entry'));
        expect(wasPreselectFiredRecently).toHaveBeenLastCalledWith(
          ACCOUNT_ID,
          TARGET_PAGE_IDENTIFIER,
          djb2(`${JSON.stringify({ [ATTRIBUTE_KEY]: 'silver' })}|${JSON.stringify([['email', 'shopper@example.test']])}`),
          true,
        );
      });
      it('binds only an off-entry fire to the logged-in user', () => {
        window.history.replaceState({}, '', PATHNAME);
        recordPreselectIntentPath(PATHNAME, Date.now());
        tap('commit');
        expect(selectPlacementsCalls).toHaveLength(1);
        expect(selectPlacementsCalls[0]).not.toHaveProperty('preselectBoundUser');
        expect(loggedDiagnostics.map((line) => line.message)).toEqual([
          expect.stringContaining('[intent_route=entry]'),
        ]);
      });
      it('lets the confirm click on the entry route skip once an express tap fired', () => {
        tap('wallet');
        vi.mocked(wasPreselectFiredRecently).mockReturnValue(true);
        window.history.replaceState({}, '', PATHNAME);
        recordPreselectIntentPath(PATHNAME, Date.now());
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        tap('commit');
        expect(selectPlacementsCalls).toHaveLength(1);
        expect(loggedDiagnostics.map((line) => line.message)).toContain(
          'Rokt Kit: preselect skipped [reason=active_preselection] [intent_kind=commit]',
        );
      });
      it('fires only when the account has one entry, and observes the rest', () => {
        mockConfig.current = [
          { ...CONFIG_ENTRY, dispatchDelayMs: 5000 },
          { ...CONFIG_ENTRY, pathname: '/subscribe/checkout', targetPageIdentifier: 'subscribe-target' },
        ];
        tap('wallet');
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(recordPreselectFired).not.toHaveBeenCalled();
        expect(observedLines()).toEqual([
          expect.stringContaining('[intent_kind=wallet] [intent_route=before_entry] [has_email=true] [has_identity=true] [logged_in=true] [cause=multiple_entries]'),
        ]);
      });
      it('observes several entries even when this tab saw only one of their triggers', () => {
        mockConfig.current = [
          { ...CONFIG_ENTRY, dispatchDelayMs: 5000 },
          { ...CONFIG_ENTRY, pathname: '/subscribe/checkout', targetPageIdentifier: 'subscribe-target' },
        ];
        vi.mocked(wasPreselectTriggeredRecently).mockImplementation(
          (_, identifier) => identifier === TARGET_PAGE_IDENTIFIER,
        );
        tap('commit');
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(observedLines()).toEqual([expect.stringContaining('[intent_route=left]')]);
        expect(observedLines()).toEqual([expect.stringContaining('[cause=multiple_entries]')]);
      });
      it('skips a tap missing a required attribute without queueing it', () => {
        host.userAttributes = {};
        tap('wallet');
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(state.pending).toHaveLength(0);
        expect(loggedDiagnostics.map((line) => line.message)).toEqual([
          expect.stringContaining('[logged_in=true] [cause=missing_attribute]'),
        ]);
      });
      it('skips a tap whose kit user carries no identity', () => {
        host.filteredUser = {
          getUserIdentities: () => ({ userIdentities: {} }),
          getMPID: () => MPID,
        } as unknown as PreselectHost['filteredUser'];
        host.userAttributes = { [ATTRIBUTE_KEY]: 'gold', email: 'shopper@example.test' };
        tap('wallet');
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(observedLines()).toEqual([expect.stringContaining('[logged_in=true] [cause=no_valid_identity]')]);
      });
      it('skips a tap raised on a page the shopper has since left', () => {
        tap('wallet', { pathname: '/product/7' });
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(observedLines()).toEqual([expect.stringContaining('[logged_in=true] [cause=path_changed]')]);
      });
      it('never reads the page form off the entry route', () => {
        listenLikeTheKit();
        mockConfig.current = [{ ...CONFIG_ENTRY, attributeKeys: ['email'], readEmailInput: true }];
        host.isForwardingAllowed = () => true;
        host.getUserIdentities = () => ({ customerid: 'shopper' });
        host.filteredUser = {
          getUserIdentities: () => ({ userIdentities: { customerid: 'shopper' } }),
          getMPID: () => MPID,
        } as unknown as PreselectHost['filteredUser'];
        const input = document.createElement('input');
        input.type = 'email';
        input.value = 'typed@example.com';
        document.body.appendChild(input);
        onTestFinished(() => input.remove());
        dispatchShopperEvent(input, 'input');

        tap('wallet');

        expect(selectPlacementsCalls).toHaveLength(0);
        expect(observedLines()).toEqual([expect.stringContaining('[cause=missing_attribute]')]);
      });
      it('does nothing while checkout intent is not live', () => {
        host.isCheckoutIntentActive = () => false;
        vi.setSystemTime(Date.now() + 1);
        handlePreselectIntentSignal(state, host, Object.freeze({ kind: 'wallet', t: Date.now() }));
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(loggedDiagnostics).toHaveLength(0);
      });
      it.each(['targeting', 'consent', 'privacy'])('honors the %s gate', (gate) => {
        if (gate === 'targeting') host.isTargetingDisabled = () => true;
        if (gate === 'consent') host.isForwardingAllowed = () => false;
        if (gate === 'privacy') host.isPreselectionPrivacyAllowed = () => false;
        tap('wallet');
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(loggedDiagnostics).toHaveLength(0);
      });
      it('forgets the fire when selectPlacements throws, so a later tap can fire', () => {
        host.selectPlacements = () => {
          throw new Error('boom');
        };
        tap('wallet');
        expect(recordPreselectFired).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER, TAP_DIGEST, false);
        expect(restorePreselectFired).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER, undefined, TAP_DIGEST);
        expect(restoreActivePreselect).toHaveBeenCalledWith(FIELD_KEY, null, TAP_DIGEST);
        expect(loggedEvents).toContainEqual(expect.objectContaining({ code: 'PRESELECT_DISPATCH_FAILED' }));
      });
      it('forgets the fire when the selectPlacements call rejects', async () => {
        vi.mocked(recordPreselectFired).mockReturnValue({ firedAt: 1234, firedDigest: 99 });
        host.selectPlacements = () => Promise.reject(new Error('rejected'));
        tap('commit');
        await Promise.resolve();
        await Promise.resolve();
        expect(restorePreselectFired).toHaveBeenCalledWith(
          ACCOUNT_ID,
          TARGET_PAGE_IDENTIFIER,
          { firedAt: 1234, firedDigest: 99 },
          TAP_DIGEST,
        );
      });
    });
    describe("a guest's wallet tap off every entry, made with no identity", () => {
      const PRODUCT_PATH = '/product/42';
      const HASHED_EMAIL = 'a'.repeat(64);
      const TAP_LINE =
        'Rokt Kit: preselect skipped [reason=intent_observed] [intent_kind=wallet] [intent_route=before_entry] [intent_source=vendor] [has_email=false] [has_identity=false] [logged_in=false]';
      const arrivedLine = (ms: number) =>
        `Rokt Kit: preselect identity_arrived [reason=pending_identity] [intent_kind=wallet] [since_trigger_ms=${ms}]`;
      const endedLine = (details: string, cause: string) =>
        `Rokt Kit: preselect skipped [reason=intent_observed] [intent_kind=wallet] [intent_route=before_entry] [intent_source=vendor] ${details} [cause=${cause}]`;
      let loggedIn: boolean;
      const tap = (kind: PreselectIntentSignal['kind'] = 'wallet') => {
        host.isCheckoutIntentActive = () => true;
        vi.setSystemTime(Date.now() + 1);
        handlePreselectIntentSignal(state, host, Object.freeze({ kind, t: Date.now(), source: 'vendor' }));
      };
      // What the kit's identity callback does once the page identifies the guest, here with the hashed email.
      const identify = (identities: Record<string, string> = { other: HASHED_EMAIL }) => {
        host.filteredUser = {
          getUserIdentities: () => ({ userIdentities: identities }),
          getMPID: () => MPID,
        } as unknown as PreselectHost['filteredUser'];
        host.getUserIdentities = () => (identities.other ? { emailsha256: identities.other } : identities);
        flushPendingPreselectDispatches(state, host);
      };
      const lines = () => loggedDiagnostics.map((line) => line.message);
      beforeEach(() => {
        loggedIn = false;
        host.getCurrentUser = () =>
          ({ getMPID: () => MPID, isLoggedIn: () => loggedIn }) as unknown as PreselectHost['filteredUser'];
        host.filteredUser = {
          getUserIdentities: () => ({ userIdentities: {} }),
          getMPID: () => MPID,
        } as unknown as PreselectHost['filteredUser'];
        host.getUserIdentities = () => ({});
        window.history.replaceState({}, '', PRODUCT_PATH);
        recordPreselectIntentPath(PRODUCT_PATH, Date.now());
      });

      it('fires once when the guest is identified inside the window, bound to that guest', () => {
        tap();
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(lines()).toEqual([TAP_LINE]);

        vi.advanceTimersByTime(19_999);
        identify();
        expect(selectPlacementsCalls).toEqual([
          {
            attributes: tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'intent_wallet_off_entry'),
            preselect: true,
            identifier: TARGET_PAGE_IDENTIFIER,
            omitUrl: true,
            preselectBoundUser: { mpid: MPID, requireLogin: false },
          },
        ]);
        expect(lines()).toEqual([
          TAP_LINE,
          arrivedLine(19_999),
          'Rokt Kit: preselect fired [reason=intent] [identity_types=other] [intent_kind=wallet] [intent_route=before_entry] [intent_source=vendor] [logged_in=false]',
        ]);

        identify();
        vi.advanceTimersByTime(20_000);
        expect(selectPlacementsCalls).toHaveLength(1);
        expect(recordPreselectFired).toHaveBeenCalledTimes(1);
        expect(lines()).toHaveLength(3);
      });
      it('fires nothing for an identity that arrives after the window, and says the wait expired', () => {
        tap();
        vi.advanceTimersByTime(19_999);
        expect(lines()).toEqual([TAP_LINE]);
        vi.advanceTimersByTime(1);
        expect(lines()).toEqual([
          TAP_LINE,
          endedLine('[has_email=false] [has_identity=false] [logged_in=false]', 'identity_wait_expired'),
        ]);

        identify();
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(recordPreselectFired).not.toHaveBeenCalled();
        expect(lines()).toHaveLength(2);
      });
      it('expires the wait when the identity beats a late timer past the window', () => {
        tap();
        // A background tab can run the timer late, so the identity can arrive first.
        vi.setSystemTime(Date.now() + 20_000);
        identify();
        vi.advanceTimersByTime(20_000);
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(lines()).toEqual([
          TAP_LINE,
          arrivedLine(20_000),
          endedLine('[has_email=true] [has_identity=true] [logged_in=false]', 'identity_wait_expired'),
        ]);
      });
      it('ends the wait without a fire when the page moves on before the guest is identified', () => {
        tap();
        window.history.replaceState({}, '', '/product/43');
        recordPreselectIntentPath('/product/43', Date.now());
        vi.advanceTimersByTime(5_000);
        identify();
        vi.advanceTimersByTime(20_000);
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(lines()).toEqual([
          TAP_LINE,
          arrivedLine(5_000),
          endedLine('[has_email=true] [has_identity=true] [logged_in=false]', 'identity_wait_expired'),
        ]);
      });
      it('ends the wait without a fire when the shopper leaves and comes back before being identified', () => {
        tap();
        vi.advanceTimersByTime(1_000);
        window.history.replaceState({}, '', '/product/43');
        recordPreselectIntentPath('/product/43', Date.now());
        vi.advanceTimersByTime(1_000);
        window.history.replaceState({}, '', PRODUCT_PATH);
        recordPreselectIntentPath(PRODUCT_PATH, Date.now());
        vi.advanceTimersByTime(3_000);
        identify();
        vi.advanceTimersByTime(20_000);
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(lines()).toEqual([
          TAP_LINE,
          arrivedLine(5_000),
          endedLine('[has_email=true] [has_identity=true] [logged_in=false]', 'identity_wait_expired'),
        ]);
      });
      it("only observes a guest's commit tap, as before, even once the guest is identified", () => {
        tap('commit');
        identify();
        vi.advanceTimersByTime(20_000);
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(lines()).toEqual([
          'Rokt Kit: preselect skipped [reason=intent_observed] [intent_kind=commit] [intent_route=before_entry] [intent_source=vendor] [has_email=false] [has_identity=false] [logged_in=false]',
        ]);
      });
      it('only observes a guest who already had an identity at the tap', () => {
        identify();
        tap();
        identify();
        vi.advanceTimersByTime(20_000);
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(lines()).toEqual([
          'Rokt Kit: preselect skipped [reason=intent_observed] [intent_kind=wallet] [intent_route=before_entry] [intent_source=vendor] [has_email=true] [has_identity=true] [logged_in=false]',
        ]);
      });
      it('restarts the window on a later tap', () => {
        tap();
        vi.advanceTimersByTime(15_000);
        tap();
        vi.advanceTimersByTime(15_000);
        expect(lines()).toEqual([TAP_LINE]);
        identify();
        expect(selectPlacementsCalls).toHaveLength(1);
      });
      it('says why the tap did not fire when the identity leaves the call without an email', () => {
        tap();
        identify({ customerid: 'guest-42' });
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(lines()).toEqual([
          TAP_LINE,
          arrivedLine(0),
          endedLine('[has_email=false] [has_identity=true] [logged_in=false]', 'no_strict_email'),
        ]);
      });
      it('keeps the once-per-checkout gate', () => {
        vi.mocked(wasPreselectFiredRecently).mockReturnValue(true);
        tap();
        identify();
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(lines()[2]).toBe(
          endedLine('[has_email=true] [has_identity=true] [logged_in=false]', 'active_preselection'),
        );
      });
      it('fires as a logged-in shopper when the identity arrives with a login', () => {
        tap();
        loggedIn = true;
        identify();
        expect(selectPlacementsCalls).toEqual([
          expect.objectContaining({ preselectBoundUser: { mpid: MPID, requireLogin: true } }),
        ]);
        expect(lines()[2]).toContain(
          '[intent_kind=wallet] [intent_route=before_entry] [intent_source=vendor] [logged_in=true]',
        );
      });
      describe.each(['targeting', 'consent', 'privacy'])('once the %s gate closes during the wait', (gate) => {
        const close = () => {
          if (gate === 'targeting') host.isTargetingDisabled = () => true;
          if (gate === 'consent') host.isForwardingAllowed = () => false;
          if (gate === 'privacy') host.isPreselectionPrivacyAllowed = () => false;
        };
        it('logs nothing when the window closes', () => {
          tap();
          close();
          vi.advanceTimersByTime(20_000);
          expect(lines()).toEqual([TAP_LINE]);
        });
        it('neither fires nor logs when the guest is identified', () => {
          tap();
          close();
          identify();
          vi.advanceTimersByTime(20_000);
          expect(selectPlacementsCalls).toHaveLength(0);
          expect(lines()).toEqual([TAP_LINE]);
        });
      });
    });
    it('tags a confirm-click fire with its kind, route and source', () => {
      host.isCheckoutIntentActive = () => true;
      handlePreselectIntentSignal(state, host, { kind: 'commit', t: Date.now(), source: 'label', pathname: PATHNAME });
      expect(loggedDiagnostics.map((line) => line.message)).toContain(
        'Rokt Kit: preselect fired [reason=intent] [identity_types=email] [intent_kind=commit] [intent_route=entry] [intent_source=label]',
      );
    });
    it.each(['name', 'api'])('tags a wallet fire recognised by the %s rule', (source) => {
      host.isCheckoutIntentActive = () => true;
      handlePreselectIntentSignal(state, host, { kind: 'wallet', t: Date.now(), source, pathname: PATHNAME });
      expect(loggedDiagnostics.map((line) => line.message)).toContain(
        `Rokt Kit: preselect fired [reason=intent] [identity_types=email] [intent_kind=wallet] [intent_route=entry] [intent_source=${source}]`,
      );
    });
    it.each([{ kind: 'bad' }, { kind: undefined }, { t: NaN }, { t: Infinity }, { t: '1' }])(
      'drops malformed %j',
      (override) => {
        host.isCheckoutIntentActive = () => true;
        handlePreselectIntentSignal(state, host, {
          kind: 'commit',
          t: Date.now(),
          ...override,
        } as PreselectIntentSignal);
        expect(loggedDiagnostics).toHaveLength(0);
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(recordPreselectIntent).not.toHaveBeenCalled();
      },
    );
    it.each(['targeting', 'consent', 'privacy', 'ready', 'enabled', 'config'])('honors the %s gate', (gate) => {
      if (gate === 'targeting') host.isTargetingDisabled = () => true;
      if (gate === 'consent') host.isForwardingAllowed = () => false;
      if (gate === 'privacy') host.isPreselectionPrivacyAllowed = () => false;
      if (gate === 'ready') host.isKitReady = () => false;
      if (gate === 'enabled') host.isPreselectionEnabled = () => false;
      if (gate === 'config') mockConfig.current = [];
      send();
      expect(loggedDiagnostics).toHaveLength(0);
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(recordPreselectIntent).not.toHaveBeenCalled();
    });
    it('neither records nor observes an intent once consent removes the kit', () => {
      host.isForwardingAllowed = () => false;
      send('checkout_step');
      send('frame');
      expect(loggedDiagnostics).toHaveLength(0);
      expect(recordPreselectIntent).not.toHaveBeenCalled();
    });
    it('drops every signal while checkout intent is not active', () => {
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      handlePreselectIntentSignal(state, host, { kind: 'commit', t: Date.now() });
      handlePreselectIntentSignal(state, host, { kind: 'checkout_step', t: Date.now() });
      expect(loggedDiagnostics.filter((line) => line.message.includes('intent'))).toHaveLength(0);
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(recordPreselectIntent).not.toHaveBeenCalled();
      expectFiresAfter(5000);
    });
    it("records the intent for each of the account's target pages, on or off its trigger path", () => {
      mockConfig.current = [
        { ...CONFIG_ENTRY },
        { ...CONFIG_ENTRY, pathname: '/second' },
        { ...CONFIG_ENTRY, pathname: '/third', targetPageIdentifier: 'third-target' },
        { ...CONFIG_ENTRY, accountId: '900002', pathname: '/fourth', targetPageIdentifier: 'other-account' },
      ];
      window.history.replaceState({}, '', '/elsewhere');
      recordPreselectIntentPath('/elsewhere', Date.now());

      const signal = send('frame');

      expect(vi.mocked(recordPreselectIntent).mock.calls).toEqual([
        [ACCOUNT_ID, TARGET_PAGE_IDENTIFIER, 'frame', signal.t],
        [ACCOUNT_ID, 'third-target', 'frame', signal.t],
      ]);
      expect(loggedDiagnostics).toHaveLength(0);
    });
    it('dedupes replay by kind and timestamp', () => {
      const signal = send();
      handlePreselectIntentSignal(state, host, signal);
      expect(selectPlacementsCalls).toHaveLength(1);
      expect(loggedDiagnostics).toHaveLength(1);
    });
    it('uses the first matching entry only', () => {
      mockConfig.current.unshift({ ...CONFIG_ENTRY, targetPageIdentifier: 'first-target' });
      send();
      expect(selectPlacementsCalls).toEqual([expect.objectContaining({ identifier: 'first-target' })]);
    });
    it('observes an old route without changing the current route hold or pending queue', () => {
      const clickTime = Date.now();
      vi.setSystemTime(clickTime + 10);
      window.history.replaceState({}, '', '/new');
      recordPreselectIntentPath('/new');
      state.pending = [
        {
          event: buildEvent(),
          pathname: '/new',
          waitingFor: 'attribute',
        },
      ];
      const pending = state.pending;
      state.scheduledDispatch = {
        event: buildEvent(),
        pathname: '/new',
        heldAt: Date.now(),
        heldForUserId: MPID,
        triggeredAt: Date.now(),
      };
      const hold = state.scheduledDispatch;
      host.isCheckoutIntentActive = () => true;
      handlePreselectIntentSignal(state, host, {
        kind: 'commit',
        t: clickTime,
      });
      expect(state.pending).toBe(pending);
      expect(state.scheduledDispatch).toBe(hold);
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(loggedDiagnostics[0].message).toContain('intent_observed');
    });
    it('releases a hold once without discarding pending work or logging left_trigger_path', () => {
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      state.pending = [
        {
          event: buildEvent(),
          pathname: PATHNAME,
          waitingFor: 'identity',
        },
      ];
      send('wallet');
      expect(selectPlacementsCalls).toHaveLength(1);
      expect(state.scheduledDispatch).toBeUndefined();
      expect(state.pending).toHaveLength(1);
      expect(loggedDiagnostics.some((line) => line.message.includes('intent_released'))).toBe(true);
      expect(loggedDiagnostics.some((line) => line.message.includes('left_trigger_path'))).toBe(false);
      expect((selectPlacementsCalls[0].attributes as Record<string, unknown>)[PRESELECT_TRIGGER_ATTRIBUTE]).toBe(
        `intent_wallet|${PATHNAME}`,
      );
    });
    it('preserves a pending event through identity and attribute waits, then skips the hold', () => {
      const user = host.filteredUser;
      host.filteredUser = null;
      host.userAttributes = {};
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      const pending = state.pending[0];
      send();
      expect(state.pending[0]).toBe(pending);
      expect(pending.intentSeen).toBe('intent_commit');
      host.filteredUser = user;
      flushPendingPreselectDispatches(state, host, PATHNAME);
      expect(state.pending[0].intentSeen).toBe('intent_commit');
      expect(state.pending[0].waitingFor).toBe('attribute');
      host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
      flushPendingPreselectDispatches(state, host, PATHNAME);
      expect(selectPlacementsCalls).toHaveLength(1);
      expect(state.scheduledDispatch).toBeUndefined();
      expect(loggedDiagnostics.at(-1)?.message).toContain('[reason=intent]');
    });
    it('keeps queued intent when a later page view replaces its unresolved attributes', () => {
      const user = host.filteredUser;
      host.filteredUser = null;
      host.userAttributes = {};
      send();
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      expect(state.pending[0].intentSeen).toBe('intent_commit');
      host.filteredUser = user;
      host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
      flushPendingPreselectDispatches(state, host, PATHNAME);
      expect(selectPlacementsCalls).toHaveLength(1);
      expect(state.scheduledDispatch).toBeUndefined();
      expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'intent_commit'));
      expect(loggedDiagnostics.at(-1)?.message).toContain('[reason=intent]');
    });
    it('lets a resolving page view consume queued intent without starting a hold', () => {
      host.userAttributes = {};
      send('wallet');
      expect(state.pending[0].waitingFor).toBe('attribute');
      maybeFirePreselect(state, host, buildEvent({ [ATTRIBUTE_KEY]: 'gold' }), PATHNAME);
      expect(state.scheduledDispatch).toBeUndefined();
      expect(selectPlacementsCalls).toHaveLength(1);
      expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'intent_wallet'));
      expect(loggedDiagnostics.at(-1)?.message).toContain('[reason=intent]');
      expect(state.pending).toHaveLength(0);
      host.userAttributes[ATTRIBUTE_KEY] = 'silver';
      flushPendingPreselectDispatches(state, host, PATHNAME);
      expect(selectPlacementsCalls).toHaveLength(1);
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      expect(state.pending).toEqual([expect.objectContaining({ waitingFor: 'intent' })]);
      expect(state.pending[0].intentSeen).toBeUndefined();
    });
    it('keeps configured-event hold-off when queued event work fires through intent', () => {
      mockConfig.current[0].triggerEventNames = ['finish'];
      const queuedEvent = { EventDataType: 4, EventName: 'finish' } as SDKEvent;
      state.pending = [{ event: queuedEvent, pathname: PATHNAME, waitingFor: 'attribute' }];
      send();
      flushPendingPreselectDispatches(state, host, PATHNAME);
      expect(selectPlacementsCalls).toHaveLength(1);
      expect(vi.mocked(setActivePreselect)).toHaveBeenLastCalledWith(FIELD_KEY, expect.any(Number), true);
    });
    it('preserves the intent tag when a released hold requeues for identity', () => {
      const user = host.filteredUser;
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      host.filteredUser = null;
      send('wallet');
      expect(state.pending[0].intentSeen).toBe('intent_wallet');
      host.filteredUser = user;
      flushPendingPreselectDispatches(state, host, PATHNAME);
      expect(selectPlacementsCalls).toHaveLength(1);
      expect((selectPlacementsCalls[0].attributes as Record<string, unknown>)[PRESELECT_TRIGGER_ATTRIBUTE]).toBe(
        `intent_wallet|${PATHNAME}`,
      );
      expect(loggedDiagnostics.at(-1)?.message).toContain('[reason=intent]');
    });
    it('never releases a held event under a different user', () => {
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      host.filteredUser = {
        getUserIdentities: () => ({
          userIdentities: { customerid: 'other' },
        }),
        getMPID: () => 'other',
      } as PreselectHost['filteredUser'];
      send();
      expect(selectPlacementsCalls).toHaveLength(0);
    });
    it('preserves the prior event hold-off when intent sends changed attributes', () => {
      vi.mocked(getActivePreselect).mockReturnValue({
        attributesDigest: 123,
        expiresAt: Date.now() + 60000,
        byEvent: true,
      });
      send();
      expect(selectPlacementsCalls).toHaveLength(1);
      expect(setActivePreselect).toHaveBeenCalledWith(FIELD_KEY, expect.any(Number), true);
    });
    it('keeps an identical digest active', () => {
      send();
      const digest = vi.mocked(setActivePreselect).mock.calls[0][1];
      vi.mocked(getActivePreselect).mockReturnValue({
        attributesDigest: digest,
        expiresAt: Date.now() + 60000,
      });
      send();
      expect(selectPlacementsCalls).toHaveLength(1);
      host.userAttributes[ATTRIBUTE_KEY] = 'silver';
      send();
      expect(selectPlacementsCalls).toHaveLength(2);
    });
    it.each(['required', 'optional'])('skips fresh intent that loses a %s page-view attribute', (requirement) => {
      host.userAttributes = {};
      if (requirement === 'optional') mockConfig.current[0].optionalAttributeKeys = [ATTRIBUTE_KEY];
      maybeFirePreselect(state, host, buildEvent({ [ATTRIBUTE_KEY]: 'gold' }), PATHNAME);
      vi.advanceTimersByTime(5000);
      expect(selectPlacementsCalls).toHaveLength(1);
      loggedDiagnostics.length = 0;

      send();

      expect(selectPlacementsCalls).toHaveLength(1);
      expect(state.pending).toHaveLength(0);
      expect(loggedDiagnostics).toHaveLength(0);
      window.history.replaceState({}, '', '/confirmation');
      recordPreselectIntentPath('/confirmation');
      flushPendingPreselectDispatches(state, host, '/confirmation');
      expect(loggedDiagnostics).toHaveLength(0);
    });
    it('skips fresh intent that loses an optional attribute only its configured event carried', () => {
      host.userAttributes = {};
      mockConfig.current[0].triggerEventNames = ['finish'];
      mockConfig.current[0].optionalAttributeKeys = [ATTRIBUTE_KEY];
      const finish = { EventDataType: 4, EventName: 'finish', EventAttributes: { [ATTRIBUTE_KEY]: 'gold' } };
      maybeFirePreselect(state, host, finish as SDKEvent, PATHNAME);
      expect(selectPlacementsCalls).toHaveLength(1);

      send();

      expect(selectPlacementsCalls).toHaveLength(1);
    });
    it('keeps the richer event record when a repeat event without the optional key is held off', () => {
      const active = new Map<string, { attributesDigest: number; expiresAt: number; byEvent?: boolean }>();
      vi.mocked(setActivePreselect).mockImplementation((key, attributesDigest, byEvent) => {
        active.set(key, { attributesDigest, expiresAt: Date.now() + 60000, byEvent });
      });
      vi.mocked(getActivePreselect).mockImplementation((key) => active.get(key) ?? null);
      host.userAttributes = {};
      mockConfig.current[0].triggerEventNames = ['finish'];
      mockConfig.current[0].optionalAttributeKeys = [ATTRIBUTE_KEY];
      const finish = (attributes: Record<string, unknown>) =>
        ({ EventDataType: 4, EventName: 'finish', EventAttributes: attributes }) as SDKEvent;
      maybeFirePreselect(state, host, finish({ [ATTRIBUTE_KEY]: 'gold' }), PATHNAME);
      maybeFirePreselect(state, host, finish({}), PATHNAME);
      expect(selectPlacementsCalls).toHaveLength(1);

      send();

      expect(selectPlacementsCalls).toHaveLength(1);
    });
    it('still fires changed user attributes when intent retains all resolved page-view keys', () => {
      maybeFirePreselect(state, host, buildEvent({ [ATTRIBUTE_KEY]: 'gold' }), PATHNAME);
      vi.advanceTimersByTime(5000);
      host.userAttributes[ATTRIBUTE_KEY] = 'silver';

      send('wallet');

      expect(selectPlacementsCalls).toHaveLength(2);
      expect(selectPlacementsCalls[1].attributes).toEqual(tagged({ [ATTRIBUTE_KEY]: 'silver' }, 'intent_wallet'));
    });
    it.each(['user', 'account', 'route', 'identifier'])(
      'does not use a resolved page view from a different %s context',
      (context) => {
        host.userAttributes = {};
        maybeFirePreselect(state, host, buildEvent({ [ATTRIBUTE_KEY]: 'gold' }), PATHNAME);
        vi.advanceTimersByTime(5000);
        if (context === 'user') {
          host.filteredUser = {
            getMPID: () => 'next-user',
            getUserIdentities: () => ({ userIdentities: { customerid: 'next-user' } }),
          } as unknown as PreselectHost['filteredUser'];
        }
        if (context === 'account') {
          host.accountId = '900002';
          mockConfig.current[0].accountId = host.accountId;
        }
        if (context === 'route') {
          recordPreselectIntentPath('/other-route', Date.now());
          recordPreselectIntentPath(PATHNAME, Date.now() + 1);
        }
        if (context === 'identifier') mockConfig.current[0].targetPageIdentifier = 'next-confirmation';

        send();

        expect(selectPlacementsCalls).toHaveLength(1);
        expect(state.pending).toHaveLength(1);
        expect(state.pending[0].waitingFor).toBe('attribute');
      },
    );
    it('allows intent after a previously resolved key is removed from the configuration', () => {
      host.userAttributes = {};
      maybeFirePreselect(state, host, buildEvent({ [ATTRIBUTE_KEY]: 'gold' }), PATHNAME);
      vi.advanceTimersByTime(5000);
      mockConfig.current[0].attributeKeys = ['nextTier'];
      host.userAttributes.nextTier = 'silver';

      send();

      expect(selectPlacementsCalls).toHaveLength(2);
      expect(selectPlacementsCalls[1].attributes).toEqual(tagged({ nextTier: 'silver' }, 'intent_commit'));
    });
    it('does not reuse page-view context after leaving and returning within the same millisecond', () => {
      host.userAttributes = {};
      mockConfig.current[0].dispatchDelayMs = undefined;
      vi.setSystemTime(clock - 1);
      maybeFirePreselect(state, host, buildEvent({ [ATTRIBUTE_KEY]: 'gold' }), PATHNAME);
      recordPreselectIntentPath('/other-route');
      recordPreselectIntentPath(PATHNAME);

      send();

      expect(selectPlacementsCalls).toHaveLength(1);
      expect(state.pending).toHaveLength(1);
      expect(state.pending[0].waitingFor).toBe('attribute');
    });
  });

  describe('with checkout intent active (auto button tracking on)', () => {
    let clock = 3100000000000;
    const send = (kind: PreselectIntentSignal['kind'] = 'commit') => {
      clock += 1;
      vi.setSystemTime(clock);
      handlePreselectIntentSignal(state, host, Object.freeze({ kind, t: clock }));
    };
    const awaitingIntentLines = () => loggedDiagnostics.filter((line) => line.message.includes('awaiting_intent'));
    beforeEach(() => {
      vi.useFakeTimers();
      clock += 10000;
      vi.setSystemTime(clock);
      window.history.replaceState({}, '', PATHNAME);
      recordPreselectIntentPath('/reset', clock - 2);
      recordPreselectIntentPath(PATHNAME, clock - 1);
      mockConfig.current = [{ ...CONFIG_ENTRY, dispatchDelayMs: 5000 }];
      host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
      host.isCheckoutIntentActive = () => true;
      host.getUserIdentities = () => ({ email: 'shopper@example.test' });
    });
    afterEach(() => {
      cancelScheduledDispatch(state);
      vi.useRealTimers();
      window.history.replaceState({}, '', '/');
      document.body.innerHTML = '';
    });

    it('waits for the confirm click instead of the delay, then fires at once', () => {
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      vi.advanceTimersByTime(60000);
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(state.scheduledDispatch).toBeUndefined();
      expect(state.pending).toEqual([expect.objectContaining({ pathname: PATHNAME, waitingFor: 'intent' })]);
      expect(awaitingIntentLines()).toHaveLength(1);

      send('commit');

      expect(selectPlacementsCalls).toHaveLength(1);
      expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'intent_commit'));
      expect(state.pending).toHaveLength(0);
    });

    describe('one pre-selection per checkout', () => {
      it('skips a fire on another checkout step once this tab fired the same attributes for the target page', () => {
        vi.mocked(wasPreselectFiredRecently).mockReturnValue(true);
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        send('commit');
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(wasPreselectFiredRecently).toHaveBeenCalledWith(
          ACCOUNT_ID,
          TARGET_PAGE_IDENTIFIER,
          djb2(`${JSON.stringify({ [ATTRIBUTE_KEY]: 'gold' })}|${JSON.stringify([['email', 'shopper@example.test']])}`),
          true,
        );
        expect(loggedDiagnostics.map((line) => line.message)).toContain(
          'Rokt Kit: preselect skipped [reason=active_preselection] [intent_kind=commit]',
        );
      });
      it('leaves a delay fire to the short dedupe, so it goes out after an earlier fire as before', () => {
        host.isCheckoutIntentActive = () => false;
        vi.mocked(wasPreselectFiredRecently).mockReturnValue(true);
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        vi.advanceTimersByTime(5000);
        expect(selectPlacementsCalls).toHaveLength(1);
        expect(wasPreselectFiredRecently).not.toHaveBeenCalled();
      });
      it('records the digest of what fired, so a later click can tell changed attributes apart', () => {
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        send('commit');
        expect(recordPreselectFired).toHaveBeenCalledWith(
          ACCOUNT_ID,
          TARGET_PAGE_IDENTIFIER,
          djb2(`${JSON.stringify({ [ATTRIBUTE_KEY]: 'gold' })}|${JSON.stringify([['email', 'shopper@example.test']])}`),
          false,
        );
      });
      it('counts a corrected email the entry does not list as changed attributes', () => {
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        send('commit');
        host.getUserIdentities = () => ({ email: 'corrected@example.test' });
        send('commit');
        const digests = vi.mocked(wasPreselectFiredRecently).mock.calls.map(([, , digest]) => digest);
        expect(new Set(digests).size).toBe(2);
      });
      it('still lets changed attributes fire again on the same page outside the confirm click', () => {
        host.isCheckoutIntentActive = () => false;
        vi.mocked(wasPreselectFiredRecently).mockReturnValue(true);
        vi.mocked(getActivePreselect).mockReturnValue({ expiresAt: Date.now() + 60000, attributesDigest: 1 });
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        vi.advanceTimersByTime(5000);
        expect(selectPlacementsCalls).toHaveLength(1);
      });
    });

    describe('the shopper email on a confirm-click fire', () => {
      it('waits for an email, logs it once, then fires when one arrives', () => {
        host.getUserIdentities = () => ({ customerid: 'shopper' });
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        send('commit');
        send('wallet');
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(loggedDiagnostics.filter((line) => line.message.includes('no_strict_email'))).toEqual([
          {
            code: 'PRESELECT_MISSED',
            message: 'Rokt Kit: preselect missed [reason=no_strict_email] [intent_kind=commit] [has_identity=true]',
          },
        ]);
        host.getUserIdentities = () => ({ customerid: 'shopper', email: 'shopper@example.test' });
        flushPendingPreselectDispatches(state, host);
        expect(selectPlacementsCalls).toHaveLength(1);
        expect(selectPlacementsCalls[0].attributes).toEqual(expect.objectContaining({ [PRESELECT_TRIGGER_ATTRIBUTE]: expect.stringMatching(/^intent_/) }));
      });
      it.each([
        ['an email attribute', { email: 'shopper@example.test' }, {}],
        ['a hashed email attribute', { EmailSha256: 'a'.repeat(64) }, {}],
        ['the mapped hashed identity', {}, { other: 'a'.repeat(64) }],
      ])('fires with %s', (_, attributes, identities) => {
        mockConfig.current = [
          { ...CONFIG_ENTRY, attributeKeys: [ATTRIBUTE_KEY, ...Object.keys(attributes)], dispatchDelayMs: 5000 },
        ];
        host.userAttributes = { [ATTRIBUTE_KEY]: 'gold', ...attributes };
        host.getUserIdentities = () => identities;
        host.mappedEmailSha256Key = 'other';
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        send('commit');
        expect(selectPlacementsCalls).toHaveLength(1);
      });
      it('logs a missing email once per page while the wait retries', () => {
        host.getUserIdentities = () => ({ customerid: 'shopper' });
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        send('commit');
        flushPendingPreselectDispatches(state, host);
        flushPendingPreselectDispatches(state, host);
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(loggedDiagnostics.filter((line) => line.message.includes('no_strict_email'))).toHaveLength(1);
      });
      it('reads the identities when the host cannot build the outgoing attributes', () => {
        host.getOutgoingAttributes = undefined;
        host.getUserIdentities = undefined;
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        send('commit');
        expect(selectPlacementsCalls).toHaveLength(0);

        host.getUserIdentities = () => ({ email: 'shopper@example.test' });
        flushPendingPreselectDispatches(state, host);
        expect(selectPlacementsCalls).toHaveLength(1);
      });
      it('counts an email the call carries from the cached user attributes', () => {
        host.getUserIdentities = () => ({});
        host.getOutgoingAttributes = (attributes) => ({ ...attributes, Email: 'shopper@example.test' });
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        send('commit');
        expect(selectPlacementsCalls).toHaveLength(1);
      });
      it('does not count an email the user attribute filters strip from the call', () => {
        mockConfig.current = [{ ...CONFIG_ENTRY, attributeKeys: [ATTRIBUTE_KEY, 'email'], dispatchDelayMs: 5000 }];
        host.userAttributes = { [ATTRIBUTE_KEY]: 'gold', email: 'shopper@example.test' };
        host.getUserIdentities = () => ({});
        host.getOutgoingAttributes = (attributes) => {
          const filtered = { ...attributes };
          delete filtered.email;
          return filtered;
        };
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        send('commit');
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(loggedDiagnostics.some((line) => line.message.includes('no_strict_email'))).toBe(true);
      });
      it('does not ask a delay fire for an email', () => {
        host.isCheckoutIntentActive = () => false;
        host.getUserIdentities = () => ({});
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        vi.advanceTimersByTime(5000);
        expect(selectPlacementsCalls).toHaveLength(1);
      });
    });

    describe('moving between pages of one entry', () => {
      beforeEach(() => {
        mockConfig.current = [{ ...CONFIG_ENTRY, pathname: '/shop/checkout/*', dispatchDelayMs: 5000 }];
      });
      it('replaces the wait quietly, then fires on the later page', () => {
        window.history.replaceState({}, '', '/shop/checkout/pay');
        recordPreselectIntentPath('/shop/checkout/pay', Date.now());
        maybeFirePreselect(state, host, buildEvent(), '/shop/checkout/pay');
        window.history.replaceState({}, '', '/shop/checkout/review');
        recordPreselectIntentPath('/shop/checkout/review', Date.now());
        maybeFirePreselect(state, host, buildEvent(), '/shop/checkout/review');

        expect(loggedDiagnostics.some((line) => line.message.includes('left_trigger_path'))).toBe(false);
        expect(awaitingIntentLines()).toHaveLength(1);
        expect(state.pending).toEqual([expect.objectContaining({ pathname: '/shop/checkout/review' })]);

        send('commit');
        expect(selectPlacementsCalls).toHaveLength(1);
      });
      it('stays quiet when a flush runs after the move, then fires on the later page', () => {
        window.history.replaceState({}, '', '/shop/checkout/pay');
        recordPreselectIntentPath('/shop/checkout/pay', Date.now());
        maybeFirePreselect(state, host, buildEvent(), '/shop/checkout/pay');
        window.history.replaceState({}, '', '/shop/checkout/review');
        recordPreselectIntentPath('/shop/checkout/review', Date.now());
        flushPendingPreselectDispatches(state, host, '/shop/checkout/review');

        expect(loggedDiagnostics.some((line) => line.message.includes('left_trigger_path'))).toBe(false);
        expect(state.pending).toHaveLength(0);

        maybeFirePreselect(state, host, buildEvent(), '/shop/checkout/review');
        expect(awaitingIntentLines()).toHaveLength(1);
        send('commit');
        expect(selectPlacementsCalls).toHaveLength(1);
      });
      it('still reports leaving for a page outside the entry', () => {
        window.history.replaceState({}, '', '/shop/checkout/pay');
        recordPreselectIntentPath('/shop/checkout/pay', Date.now());
        maybeFirePreselect(state, host, buildEvent(), '/shop/checkout/pay');
        window.history.replaceState({}, '', '/shop/cart');
        flushPendingPreselectDispatches(state, host, '/shop/cart');
        expect(loggedDiagnostics.some((line) => line.message.includes('left_trigger_path'))).toBe(true);
      });
    });

    it('records the trigger at the page view, so an arrival after a missed click still shows it', () => {
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(recordPreselectTrigger).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER, true);
    });

    it('records no trigger for a wait queued before the kit is ready, until it is', () => {
      host.isKitReady = () => false;
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      expect(recordPreselectTrigger).not.toHaveBeenCalled();

      host.isKitReady = () => true;
      flushPendingPreselectDispatches(state, host, PATHNAME);

      expect(recordPreselectTrigger).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER, true);
      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it('fires once for repeated confirm clicks on the same page', () => {
      let active: ReturnType<typeof getActivePreselect> = null;
      vi.mocked(setActivePreselect).mockImplementation((_key, attributesDigest) => {
        active = { expiresAt: Date.now() + 60000, attributesDigest };
      });
      vi.mocked(getActivePreselect).mockImplementation(() => active);
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      send('commit');
      send('commit');
      send('wallet');

      expect(selectPlacementsCalls).toHaveLength(1);
      expect(loggedDiagnostics.filter((line) => line.message.includes('active_preselection'))).toHaveLength(2);
    });

    it('fires nothing for a confirm click after the shopper leaves the configured page', () => {
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      window.history.replaceState({}, '', '/elsewhere');
      recordPreselectIntentPath('/elsewhere', clock);
      maybeFirePreselect(state, host, buildEvent(), '/elsewhere');

      send('commit');

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(state.pending).toHaveLength(0);
    });

    it('fires on a wallet click but not on a checkout step', () => {
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      send('checkout_step');
      expect(selectPlacementsCalls).toHaveLength(0);
      send('wallet');
      expect(selectPlacementsCalls).toHaveLength(1);
    });

    describe('an entry that takes a checkout step as its confirm click', () => {
      beforeEach(() => {
        mockConfig.current = [{ ...CONFIG_ENTRY, dispatchDelayMs: 5000, checkoutStepIntent: true }];
      });

      it('fires the page view held for the click on a checkout step, tagged as one', () => {
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        expect(state.pending).toEqual([expect.objectContaining({ waitingFor: 'intent' })]);

        send('checkout_step');

        expect(selectPlacementsCalls).toHaveLength(1);
        expect(selectPlacementsCalls[0].attributes).toEqual(
          tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'intent_checkout_step'),
        );
        expect(state.pending).toHaveLength(0);
        expect(loggedDiagnostics).toContainEqual(
          expect.objectContaining({ code: 'PRESELECT_FIRED', message: expect.stringContaining('[reason=intent]') }),
        );
      });

      it('fires on a checkout step with no page view held', () => {
        send('checkout_step');
        expect(selectPlacementsCalls).toHaveLength(1);
        expect(selectPlacementsCalls[0].attributes).toEqual(
          tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'intent_checkout_step'),
        );
      });

      it('waits for the shopper email as a confirm click does', () => {
        host.getUserIdentities = () => ({ customerid: 'shopper' });
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        send('checkout_step');
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(loggedDiagnostics.map((line) => line.message)).toContain(
          'Rokt Kit: preselect missed [reason=no_strict_email] [intent_kind=checkout_step] [has_identity=true]',
        );

        host.getUserIdentities = () => ({ customerid: 'shopper', email: 'shopper@example.test' });
        flushPendingPreselectDispatches(state, host);
        expect(selectPlacementsCalls).toHaveLength(1);
      });

      describe('when a client-side router moves the page before the click arrives', () => {
        // The core reads the click's path as it happens and delivers it after the next paint. By then an SPA router
        // has moved the page, and the page view held for the click went with it.
        const routeAway = (): number => {
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);
          const clickedAt = clock + 1;
          clock += 2;
          vi.setSystemTime(clock);
          window.history.replaceState({}, '', '/next');
          recordPreselectIntentPath('/next', clock);
          maybeFirePreselect(state, host, buildEvent(), '/next');
          return clickedAt;
        };
        const deliver = (t: number) =>
          handlePreselectIntentSignal(
            state,
            host,
            Object.freeze({ kind: 'checkout_step' as const, t, source: 'label', pathname: PATHNAME }),
          );

        it('fires the entry from the user, tagged as a checkout step', () => {
          const clickedAt = routeAway();
          expect(state.pending).toHaveLength(0);

          deliver(clickedAt);

          expect(selectPlacementsCalls).toHaveLength(1);
          expect(selectPlacementsCalls[0].attributes).toEqual(
            tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'intent_checkout_step'),
          );
          expect(loggedDiagnostics.map((line) => line.message)).toContainEqual(
            expect.stringMatching(
              /preselect fired \[reason=intent\].*\[intent_kind=checkout_step\] \[intent_route=entry\] \[intent_source=label\] \[logged_in=(true|false)\]/,
            ),
          );
        });

        it('only observes a click replayed after the page moved', () => {
          routeAway();
          deliver(clock - 5000);
          expect(selectPlacementsCalls).toHaveLength(0);
          expect(loggedDiagnostics.map((line) => line.message)).toContainEqual(
            expect.stringContaining('[reason=intent_observed] [intent_kind=checkout_step] [intent_route=entry]'),
          );
        });

        it('observes a click without the shopper email', () => {
          host.getUserIdentities = () => ({ customerid: 'shopper' });
          deliver(routeAway());
          expect(selectPlacementsCalls).toHaveLength(0);
          expect(loggedDiagnostics.map((line) => line.message)).toContainEqual(
            expect.stringMatching(/\[intent_kind=checkout_step\].*\[cause=no_strict_email\]/),
          );
        });

        it('leaves an entry without checkoutStepIntent observed only', () => {
          mockConfig.current = [{ ...CONFIG_ENTRY, dispatchDelayMs: 5000 }];
          deliver(routeAway());
          expect(selectPlacementsCalls).toHaveLength(0);
        });
      });

      it('never fires a cartIntent entry on a checkout step, which keeps waiting', () => {
        mockConfig.current = [{ ...CONFIG_ENTRY, dispatchDelayMs: 5000, cartIntent: true, checkoutStepIntent: true }];
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        const waiting = [...state.pending];
        expect(waiting).toEqual([expect.objectContaining({ waitingFor: 'intent' })]);
        send('checkout_step');
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(state.pending).toEqual(waiting);
      });

      it('never fires or observes a checkout step off its route', () => {
        window.history.replaceState({}, '', '/elsewhere');
        recordPreselectIntentPath('/elsewhere', clock);
        send('checkout_step');
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(loggedDiagnostics).toHaveLength(0);
      });

      it('leaves a checkout step on another entry\'s route observed only', () => {
        mockConfig.current = [
          { ...CONFIG_ENTRY, dispatchDelayMs: 5000, checkoutStepIntent: true },
          { ...CONFIG_ENTRY, pathname: '/other', dispatchDelayMs: 5000 },
        ];
        window.history.replaceState({}, '', '/other');
        recordPreselectIntentPath('/other', clock);
        send('checkout_step');
        expect(selectPlacementsCalls).toHaveLength(0);
        expect(loggedDiagnostics.map((line) => line.message)).toEqual([
          expect.stringContaining('[reason=intent_observed] [intent_kind=checkout_step] [intent_route=entry]'),
        ]);
      });
    });

    it('keeps waiting through a flush and a repeat page view without logging again', () => {
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      flushPendingPreselectDispatches(state, host, PATHNAME);
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(state.pending).toHaveLength(1);
      expect(awaitingIntentLines()).toHaveLength(1);
    });

    it('stores nothing for a recovered dispatch before the click', () => {
      host.isKitReady = () => false;
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      expect(setPendingPreselect).not.toHaveBeenCalled();
      expect(state.pending).toEqual([expect.objectContaining({ waitingFor: 'intent' })]);
    });

    it('waits for identity after the click, then fires without the delay', () => {
      const user = host.filteredUser;
      host.filteredUser = null;
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      send('commit');
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(state.pending).toEqual([expect.objectContaining({ waitingFor: 'identity', intentSeen: 'intent_commit' })]);

      host.filteredUser = user;
      flushPendingPreselectDispatches(state, host, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(1);
      expect(state.scheduledDispatch).toBeUndefined();
    });

    it('reads the email the guest typed when they click to confirm', () => {
      mockConfig.current = [
        { ...CONFIG_ENTRY, attributeKeys: ['email'], readEmailInput: true, dispatchDelayMs: 5000 },
      ];
      host.userAttributes = {};
      host.isForwardingAllowed = () => true;
      host.getUserIdentities = () => ({});
      host.filteredUser = {
        getUserIdentities: () => ({ userIdentities: {} }),
        getMPID: () => MPID,
      } as unknown as PreselectHost['filteredUser'];
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      const input = document.createElement('input');
      input.type = 'email';
      input.value = 'guest@example.com';
      document.body.appendChild(input);
      shopperTouch(input);

      send('commit');

      expect(selectPlacementsCalls).toHaveLength(1);
      expect((selectPlacementsCalls[0].attributes as Record<string, unknown>).email).toBe('guest@example.com');
    });

    it('reads an email typed into a type="text" field when the guest clicks to confirm', () => {
      mockConfig.current = [
        { ...CONFIG_ENTRY, attributeKeys: ['email'], readEmailInput: true, dispatchDelayMs: 5000 },
      ];
      host.userAttributes = {};
      host.isForwardingAllowed = () => true;
      host.getUserIdentities = () => ({});
      host.filteredUser = {
        getUserIdentities: () => ({ userIdentities: {} }),
        getMPID: () => MPID,
      } as unknown as PreselectHost['filteredUser'];
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      const input = document.createElement('input');
      input.type = 'text';
      input.value = 'guest@example.com';
      document.body.appendChild(input);
      shopperTouch(input);

      send('commit');

      expect(selectPlacementsCalls).toHaveLength(1);
      expect((selectPlacementsCalls[0].attributes as Record<string, unknown>).email).toBe('guest@example.com');
    });

    it('never reads a touched field a script overwrote before the confirm click', () => {
      mockConfig.current = [
        { ...CONFIG_ENTRY, attributeKeys: ['email'], readEmailInput: true, dispatchDelayMs: 5000 },
      ];
      host.userAttributes = {};
      host.isForwardingAllowed = () => true;
      host.filteredUser = {
        getUserIdentities: () => ({ userIdentities: {} }),
        getMPID: () => MPID,
      } as unknown as PreselectHost['filteredUser'];
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      const input = document.createElement('input');
      input.type = 'text';
      input.value = 'guest@example.com';
      document.body.appendChild(input);
      shopperTouch(input);
      input.value = 'someone-else@example.com';
      recordShopperInput({ type: 'change', isTrusted: false, target: input } as unknown as Event);

      send('commit');

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it.each([
      {
        label: 'switched type and back',
        overwrite: (input: HTMLInputElement) => {
          input.type = 'password';
          input.value = 'someone-else@example.com';
          recordShopperInput({ type: 'change', isTrusted: false, target: input } as unknown as Event);
          input.type = 'text';
        },
      },
      {
        label: 'detached and reinserted',
        overwrite: (input: HTMLInputElement) => {
          input.remove();
          input.value = 'someone-else@example.com';
          input.dispatchEvent(new Event('change'));
          document.body.appendChild(input);
        },
      },
    ])('never reads a touched field a script overwrote after it $label before the confirm click', ({ overwrite }) => {
      mockConfig.current = [
        { ...CONFIG_ENTRY, attributeKeys: ['email'], readEmailInput: true, dispatchDelayMs: 5000 },
      ];
      host.userAttributes = {};
      host.isForwardingAllowed = () => true;
      host.filteredUser = {
        getUserIdentities: () => ({ userIdentities: {} }),
        getMPID: () => MPID,
      } as unknown as PreselectHost['filteredUser'];
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      const input = document.createElement('input');
      input.type = 'text';
      input.value = 'guest@example.com';
      document.body.appendChild(input);
      shopperTouch(input);
      overwrite(input);

      send('commit');

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it('reads only fields the shopper touched when they click to confirm', () => {
      mockConfig.current = [
        { ...CONFIG_ENTRY, attributeKeys: ['email'], readEmailInput: true, dispatchDelayMs: 5000 },
      ];
      host.userAttributes = {};
      host.isForwardingAllowed = () => true;
      host.filteredUser = {
        getUserIdentities: () => ({ userIdentities: {} }),
        getMPID: () => MPID,
      } as unknown as PreselectHost['filteredUser'];
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      const prefilled = document.createElement('input');
      prefilled.type = 'text';
      prefilled.value = 'someone-else@example.com';
      document.body.appendChild(prefilled);

      send('commit');

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it.each(REUSED_EVENT_OVERWRITES)(
      'never reads a touched field a script overwrote and announced with $label, on the confirm click',
      ({ overwrite }) => {
        mockConfig.current = [
          { ...CONFIG_ENTRY, attributeKeys: ['email'], readEmailInput: true, dispatchDelayMs: 5000 },
        ];
        host.userAttributes = {};
        host.isForwardingAllowed = () => true;
        host.filteredUser = {
          getUserIdentities: () => ({ userIdentities: {} }),
          getMPID: () => MPID,
        } as unknown as PreselectHost['filteredUser'];
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        const { input, shopperEvent, scriptEvent } = touchAfterScriptChange('guest@example.com');
        overwrite(input, shopperEvent, scriptEvent);

        send('commit');

        expect(selectPlacementsCalls).toHaveLength(0);
      },
    );

    it.each(OVERWRITING_HANDLERS)(
      "never reads a field a capture handler $label during the shopper's event, on the confirm click",
      (handler) => {
        mockConfig.current = [
          { ...CONFIG_ENTRY, attributeKeys: ['email'], readEmailInput: true, dispatchDelayMs: 5000 },
        ];
        host.userAttributes = {};
        host.isForwardingAllowed = () => true;
        host.filteredUser = {
          getUserIdentities: () => ({ userIdentities: {} }),
          getMPID: () => MPID,
        } as unknown as PreselectHost['filteredUser'];
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        typeIntoOverwritingForm('guest@example.com', handler);

        send('commit');

        expect(selectPlacementsCalls).toHaveLength(0);
      },
    );

    it("never sends one shopper's page view on another shopper's click", () => {
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      host.filteredUser = {
        getUserIdentities: () => ({ userIdentities: { email: 'other@example.com' } }),
        getMPID: () => 'mpid-2',
      } as unknown as PreselectHost['filteredUser'];

      send('commit');

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it('does not let a later click replace the richer call with fewer attributes', () => {
      mockConfig.current = [
        {
          ...CONFIG_ENTRY,
          attributeKeys: [ATTRIBUTE_KEY, 'paymenttype'],
          optionalAttributeKeys: ['paymenttype'],
          dispatchDelayMs: 5000,
        },
      ];
      maybeFirePreselect(state, host, buildEvent({ paymenttype: 'card' }), PATHNAME);
      send('commit');
      expect(selectPlacementsCalls).toHaveLength(1);
      expect((selectPlacementsCalls[0].attributes as Record<string, unknown>).paymenttype).toBe('card');

      send('wallet');

      expect(selectPlacementsCalls).toHaveLength(1);
    });

    it('falls back to the delay when checkout intent stops applying while it waits', () => {
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      host.isCheckoutIntentActive = () => false;

      flushPendingPreselectDispatches(state, host, PATHNAME);

      expect(state.pending).toHaveLength(0);
      expectFiresAfter(5000);
    });

    it('reports the wait once the launcher is ready, if it began before', () => {
      host.isKitReady = () => false;
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      expect(awaitingIntentLines()).toHaveLength(0);

      host.isKitReady = () => true;
      flushPendingPreselectDispatches(state, host, PATHNAME);
      flushPendingPreselectDispatches(state, host, PATHNAME);

      expect(awaitingIntentLines()).toHaveLength(1);
      expect(state.pending).toEqual([expect.objectContaining({ waitingFor: 'intent' })]);
    });

    it('turns a running delay into a wait for the click if checkout intent starts applying', () => {
      host.isCheckoutIntentActive = () => false;
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      host.isCheckoutIntentActive = () => true;

      vi.advanceTimersByTime(5000);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(state.pending).toEqual([expect.objectContaining({ waitingFor: 'intent', triggeringUserId: MPID })]);
      send('commit');
      expect(selectPlacementsCalls).toHaveLength(1);
    });

    it('does not release a held page view on a route change once checkout intent applies', () => {
      mockConfig.current = [{ ...CONFIG_ENTRY, dispatchDelayMs: 5000, releaseHoldOnRouteChange: true }];
      host.isCheckoutIntentActive = () => false;
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      host.isCheckoutIntentActive = () => true;
      window.history.replaceState({}, '', '/elsewhere');

      maybeFirePreselect(state, host, buildEvent(), '/elsewhere');

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(state.pending).toHaveLength(0);
    });

    it('does not recover a saved page view without the click, but does recover a clicked one', () => {
      const record = {
        expiresAt: Date.now() + 60000,
        pathname: PATHNAME,
        identifier: TARGET_PAGE_IDENTIFIER,
        attributes: { [ATTRIBUTE_KEY]: 'gold' },
        mpid: MPID,
      };
      vi.mocked(getPendingPreselect).mockReturnValue(record);
      flushPendingPreselectDispatches(state, host, '/confirmation');
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(loggedDiagnostics.some((line) => line.message.includes('recovery_awaits_intent'))).toBe(true);

      vi.mocked(getPendingPreselect).mockReturnValue({ ...record, byEvent: true });
      flushPendingPreselectDispatches(state, host, '/confirmation');
      expect(selectPlacementsCalls).toHaveLength(1);
    });

    it('marks a snapshot from a configured trigger event as recoverable', () => {
      mockConfig.current = [{ ...CONFIG_ENTRY, dispatchDelayMs: 5000, triggerEventNames: ['Ready'] }];
      host.isKitReady = () => false;
      maybeFirePreselect(
        state,
        host,
        { EventName: 'Ready', EventDataType: 4, EventAttributes: {} } as unknown as SDKEvent,
        PATHNAME,
      );
      expect(setPendingPreselect).toHaveBeenCalledWith(
        ACCOUNT_ID,
        PATHNAME,
        TARGET_PAGE_IDENTIFIER,
        expect.any(Object),
        MPID,
        true,
      );
    });

    it('keeps the delay when checkout intent is not active', () => {
      host.isCheckoutIntentActive = () => false;
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      expectFiresAfter(5000);
    });

    it('sends no call for a shopper who never clicks', () => {
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      vi.advanceTimersByTime(30 * 60_000);
      flushPendingPreselectDispatches(state, host, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(vi.getTimerCount()).toBe(0);
      expect(state.pending).toEqual([expect.objectContaining({ waitingFor: 'intent' })]);
    });

    it('holds a pathname trigger for the click too', () => {
      maybeFirePreselectForPathname(state, host, PATHNAME);
      vi.advanceTimersByTime(60000);
      expect(selectPlacementsCalls).toHaveLength(0);

      send('commit');

      expect(selectPlacementsCalls).toHaveLength(1);
      expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'intent_commit'));
    });

    it('still dispatches a configured trigger event at once', () => {
      mockConfig.current = [{ ...CONFIG_ENTRY, dispatchDelayMs: 5000, triggerEventNames: ['Ready'] }];
      const ready = { EventName: 'Ready', EventDataType: 4, EventAttributes: {} } as unknown as SDKEvent;

      maybeFirePreselectForEvent(state, host, ready, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(1);
      expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'event'));
    });

    // The key no longer configures anything, so a setting that still carries it waits for the click.
    it.each(['observe', 'fire', 'never'])('waits for the click on a setting entry with intentTrigger %s', (value) => {
      const setting = JSON.stringify({
        schemaVersion: 1,
        entries: [
          {
            pathname: PATHNAME,
            targetPageIdentifier: TARGET_PAGE_IDENTIFIER,
            attributeKeys: [ATTRIBUTE_KEY],
            dispatchDelayMs: 5000,
            intentTrigger: value,
          },
        ],
      });
      onTestFinished(() => {
        applyPreselectionConfigSetting(ACCOUNT_ID, undefined);
      });
      expect(applyPreselectionConfigSetting(ACCOUNT_ID, setting)).toBeUndefined();

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      vi.advanceTimersByTime(60000);
      expect(selectPlacementsCalls).toHaveLength(0);

      send('commit');

      expect(selectPlacementsCalls).toHaveLength(1);
    });

    it('fires nothing, even after the delay, while preselection privacy is withheld', () => {
      host.isPreselectionPrivacyAllowed = () => false;
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      vi.advanceTimersByTime(60000);
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(state.scheduledDispatch).toBeUndefined();
    });
  });

  describe('cart intent', () => {
    const PRODUCT_ROUTE = '/product/*';
    const PRODUCT_PAGE = '/product/42';
    const BAG_TARGET = 'bag-target';
    const PLAIN_ENTRY: PreselectionConfigEntry = {
      accountId: ACCOUNT_ID,
      pathname: PRODUCT_ROUTE,
      targetPageIdentifier: BAG_TARGET,
      attributeKeys: [ATTRIBUTE_KEY],
      dispatchDelayMs: 2000,
    };
    const CART_ENTRY: PreselectionConfigEntry = { ...PLAIN_ENTRY, cartIntent: true };
    const CART_DIGEST = djb2(
      `${JSON.stringify({ [ATTRIBUTE_KEY]: 'gold' })}|${JSON.stringify([['email', 'shopper@example.test']])}`,
    );
    let clock = 3200000000000;
    let loggedIn: boolean;
    const visit = (pathname: string) => {
      window.history.replaceState({}, '', pathname);
      recordPreselectIntentPath(pathname, Date.now());
    };
    const click = (kind: PreselectIntentSignal['kind'] = 'cart', extra: Partial<PreselectIntentSignal> = {}) => {
      clock += 1;
      vi.setSystemTime(clock);
      handlePreselectIntentSignal(state, host, Object.freeze({ kind, t: clock, source: 'label', ...extra }));
    };
    const messages = () => loggedDiagnostics.map((line) => line.message);
    const observedLines = () => messages().filter((message) => message.includes('intent_observed'));
    const bagTagged = (kind: string, pathname = PRODUCT_ROUTE) => tagged({ [ATTRIBUTE_KEY]: 'gold' }, kind, pathname);
    beforeEach(() => {
      vi.useFakeTimers();
      clock += 10000;
      vi.setSystemTime(clock);
      recordPreselectIntentPath('/reset', clock - 1);
      visit('/');
      mockConfig.current = [CART_ENTRY];
      host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
      host.isCheckoutIntentActive = () => true;
      host.getUserIdentities = () => ({ email: 'shopper@example.test' });
      loggedIn = false;
      host.getCurrentUser = () =>
        ({ getMPID: () => MPID, isLoggedIn: () => loggedIn }) as unknown as PreselectHost['filteredUser'];
    });
    afterEach(() => {
      cancelScheduledDispatch(state);
      vi.useRealTimers();
      window.history.replaceState({}, '', '/');
    });

    it("fires a guest's cart click off the entry's route as intent_cart_off_entry", () => {
      click();

      expect(selectPlacementsCalls).toEqual([
        {
          attributes: bagTagged('intent_cart_off_entry'),
          preselect: true,
          identifier: BAG_TARGET,
          omitUrl: true,
          preselectBoundUser: { mpid: MPID, requireLogin: false },
        },
      ]);
      expect(messages()).toEqual([
        'Rokt Kit: preselect fired [reason=intent] [identity_types=email] [intent_kind=cart] [intent_route=before_entry] [intent_source=label] [logged_in=false]',
      ]);
      expect(recordPreselectFired).toHaveBeenCalledWith(ACCOUNT_ID, BAG_TARGET, CART_DIGEST, true);
      expect(buildActivePreselectFieldKey).toHaveBeenCalledWith(ACCOUNT_ID, BAG_TARGET);
      expect(recordPreselectIntent).toHaveBeenCalledWith(ACCOUNT_ID, BAG_TARGET, 'cart', clock);
      expect(state.pending).toHaveLength(0);
      expect(state.scheduledDispatch).toBeUndefined();
    });
    it("binds a logged-in shopper's off-entry cart fire to them without needing them to stay logged in", () => {
      loggedIn = true;
      vi.mocked(wasPreselectTriggeredRecently).mockReturnValue(true);
      click();
      expect(selectPlacementsCalls).toEqual([
        expect.objectContaining({
          attributes: bagTagged('intent_cart_off_entry'),
          preselectBoundUser: { mpid: MPID, requireLogin: false },
        }),
      ]);
      expect(messages()).toEqual([expect.stringContaining('[intent_kind=cart] [intent_route=left] [intent_source=label] [logged_in=true]')]);
    });
    it("releases the page view waiting on the entry's own route as intent_cart", () => {
      visit(PRODUCT_PAGE);
      maybeFirePreselect(state, host, buildEvent(), PRODUCT_PAGE);
      vi.advanceTimersByTime(60000);
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(state.pending).toEqual([expect.objectContaining({ pathname: PRODUCT_PAGE, waitingFor: 'intent' })]);

      click();

      expect(selectPlacementsCalls).toEqual([
        { attributes: bagTagged('intent_cart'), preselect: true, identifier: BAG_TARGET, omitUrl: true },
      ]);
      expect(messages()).toContain(
        'Rokt Kit: preselect fired [reason=intent] [identity_types=email] [intent_kind=cart] [intent_route=entry] [intent_source=label]',
      );
      expect(buildActivePreselectFieldKey).toHaveBeenCalledWith(ACCOUNT_ID, PRODUCT_PAGE);
      expect(state.pending).toHaveLength(0);
    });
    it("fires a cart click on the entry's own route before any page view", () => {
      visit(PRODUCT_PAGE);
      click();
      expect(selectPlacementsCalls).toEqual([expect.objectContaining({ attributes: bagTagged('intent_cart') })]);
    });
    it.each([
      ['without cartIntent', PLAIN_ENTRY],
      ['with cartIntent false', { ...PLAIN_ENTRY, cartIntent: false }],
    ])('leaves an entry %s deaf to cart clicks, on its route and off it', (_, entry) => {
      mockConfig.current = [entry];
      click();
      visit(PRODUCT_PAGE);
      maybeFirePreselect(state, host, buildEvent(), PRODUCT_PAGE);
      click();

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(observedLines()).toEqual([]);
      expect(recordPreselectIntent).not.toHaveBeenCalled();
      expect(state.pending).toEqual([expect.objectContaining({ waitingFor: 'intent' })]);
      expect(state.pending[0].intentSeen).toBeUndefined();

      click('commit');
      expect(selectPlacementsCalls).toEqual([expect.objectContaining({ attributes: bagTagged('intent_commit') })]);
    });
    it("fires the cartIntent entry from another entry's route, and records the click only for its target page", () => {
      mockConfig.current = [{ ...CONFIG_ENTRY }, CART_ENTRY];
      visit(PATHNAME);
      click();
      expect(selectPlacementsCalls).toEqual([
        expect.objectContaining({ identifier: BAG_TARGET, attributes: bagTagged('intent_cart_off_entry') }),
      ]);
      expect(vi.mocked(recordPreselectIntent).mock.calls).toEqual([[ACCOUNT_ID, BAG_TARGET, 'cart', clock]]);

      click('commit');
      expect(selectPlacementsCalls[1]).toEqual(
        expect.objectContaining({ identifier: TARGET_PAGE_IDENTIFIER, attributes: tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'intent_commit') }),
      );
    });
    it('still requires an identity off the entry route', () => {
      host.filteredUser = {
        getUserIdentities: () => ({ userIdentities: {} }),
        getMPID: () => MPID,
      } as unknown as PreselectHost['filteredUser'];
      click();
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(recordPreselectFired).not.toHaveBeenCalled();
      expect(observedLines()).toEqual([
        'Rokt Kit: preselect skipped [reason=intent_observed] [intent_kind=cart] [intent_route=before_entry] [intent_source=label] [has_email=true] [has_identity=false] [logged_in=false] [cause=no_valid_identity]',
      ]);
    });
    it("still requires an identity on the entry's route, and fires once one arrives", () => {
      const user = host.filteredUser;
      host.filteredUser = null;
      visit(PRODUCT_PAGE);
      click();
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(messages()).toEqual([expect.stringContaining('preselect missed [reason=no_valid_identity]')]);
      expect(state.pending).toEqual([expect.objectContaining({ waitingFor: 'identity', intentSeen: 'intent_cart' })]);

      host.filteredUser = user;
      flushPendingPreselectDispatches(state, host, PRODUCT_PAGE);
      expect(selectPlacementsCalls).toEqual([expect.objectContaining({ attributes: bagTagged('intent_cart') })]);
    });
    it('still requires the email on the call, off the entry route and on it', () => {
      host.getUserIdentities = () => ({ customerid: 'shopper' });
      click();
      expect(observedLines()).toEqual([expect.stringContaining('[has_email=false] [has_identity=true] [logged_in=false] [cause=no_strict_email]')]);

      visit(PRODUCT_PAGE);
      click();
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(messages()).toContain('Rokt Kit: preselect missed [reason=no_strict_email] [intent_kind=cart] [has_identity=true]');
    });
    it('skips a repeated cart click with the attributes this tab fired, and fires one whose attributes changed', () => {
      let firedDigest: number | undefined;
      vi.mocked(recordPreselectFired).mockImplementation((_, __, digest) => {
        firedDigest = digest;
        return undefined;
      });
      vi.mocked(wasPreselectFiredRecently).mockImplementation(
        (_, __, digest) => firedDigest !== undefined && (digest === undefined || digest === firedDigest),
      );
      click();
      click();
      visit(PRODUCT_PAGE);
      click();
      expect(selectPlacementsCalls).toHaveLength(1);
      expect(observedLines()).toEqual([expect.stringContaining('[intent_kind=cart] [intent_route=before_entry] [intent_source=label] [has_email=true] [has_identity=true] [logged_in=false] [cause=active_preselection]')]);
      expect(messages()).toContain('Rokt Kit: preselect skipped [reason=active_preselection] [intent_kind=cart]');

      host.userAttributes = { [ATTRIBUTE_KEY]: 'silver' };
      click();
      expect(selectPlacementsCalls).toHaveLength(2);
      expect(selectPlacementsCalls[1].attributes).toEqual(tagged({ [ATTRIBUTE_KEY]: 'silver' }, 'intent_cart', PRODUCT_ROUTE));
    });
    it('observes a cart click off every route two cartIntent entries could claim, and fires the one on its route', () => {
      mockConfig.current = [CART_ENTRY, { ...CART_ENTRY, pathname: '/deals/*', targetPageIdentifier: 'deals-bag' }];
      click();
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(observedLines()).toEqual([expect.stringContaining('[intent_kind=cart] [intent_route=before_entry] [intent_source=label] [has_email=true] [has_identity=true] [logged_in=false] [cause=multiple_entries]')]);

      visit('/deals/7');
      click();
      expect(selectPlacementsCalls).toEqual([
        expect.objectContaining({ identifier: 'deals-bag', attributes: bagTagged('intent_cart', '/deals/*') }),
      ]);
    });
    it('skips a replayed cart click raised on a page the shopper has since left', () => {
      click('cart', { pathname: '/search', t: clock - 5000 });
      click('cart', { pathname: '/product/7', t: clock - 5000 });
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(observedLines()).toEqual([
        expect.stringContaining('[intent_kind=cart] [intent_route=before_entry] [intent_source=label] [has_email=true] [has_identity=true] [logged_in=false] [cause=path_changed]'),
        'Rokt Kit: preselect skipped [reason=intent_observed] [intent_kind=cart] [intent_route=entry] [intent_source=label] [has_email=true] [has_identity=true]',
      ]);
    });
    it.each([
      ['off the entry', '/search'],
      ["on the entry's own route", '/product/7'],
    ])('fires a live cart click %s whose page an SPA router already moved', (_, pathname) => {
      visit('/bag');
      click('cart', { pathname });
      expect(selectPlacementsCalls).toEqual([
        expect.objectContaining({ identifier: BAG_TARGET, attributes: bagTagged('intent_cart_off_entry') }),
      ]);
      expect(messages().some((message) => message.includes('path_changed'))).toBe(false);
    });
    it.each([
      ['off the entry', '/search'],
      ["on the entry's own route", '/product/7'],
    ])('never reads the form for a live cart click %s that an SPA router moved onto an entry route', (_, pathname) => {
      listenLikeTheKit();
      mockConfig.current = [{ ...CART_ENTRY, attributeKeys: ['email'], readEmailInput: true }];
      host.userAttributes = {};
      host.isForwardingAllowed = () => true;
      host.getUserIdentities = () => ({ customerid: 'shopper' });
      host.filteredUser = {
        getUserIdentities: () => ({ userIdentities: { customerid: 'shopper' } }),
        getMPID: () => MPID,
      } as unknown as PreselectHost['filteredUser'];
      visit(PRODUCT_PAGE);
      const input = document.createElement('input');
      input.type = 'email';
      input.value = 'typed@example.com';
      document.body.appendChild(input);
      onTestFinished(() => input.remove());
      dispatchShopperEvent(input, 'input');

      click('cart', { pathname });

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(observedLines()).toEqual([expect.stringContaining('[cause=missing_attribute]')]);
    });
    it('lets a confirm click with the same attributes fire after a cart fire for the same target page', () => {
      mockConfig.current = [CART_ENTRY, { ...PLAIN_ENTRY, pathname: '/bag' }];
      const marks: Array<{ digest?: number; byCart: boolean }> = [];
      vi.mocked(recordPreselectFired).mockImplementation((_, __, digest, byCart = false) => {
        marks.push({ digest, byCart });
        return undefined;
      });
      vi.mocked(wasPreselectFiredRecently).mockImplementation((_, __, digest, ignoreCartFire = false) => {
        const mark = marks[marks.length - 1];
        return !!mark && mark.digest === digest && !(ignoreCartFire && mark.byCart);
      });
      click('cart');
      visit('/bag');
      click('commit');
      expect(selectPlacementsCalls.map((call) => call.attributes)).toEqual([
        bagTagged('intent_cart_off_entry'),
        bagTagged('intent_commit', '/bag'),
      ]);
      expect(marks.map((mark) => mark.byCart)).toEqual([true, false]);

      click('cart');
      expect(selectPlacementsCalls).toHaveLength(2);
    });
    it("observes, never fires, a logged-in shopper's commit or wallet tap off every entry when the one entry is a cartIntent entry", () => {
      loggedIn = true;
      visit('/checkout');
      click('commit');
      click('wallet', { source: 'vendor' });
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(recordPreselectFired).not.toHaveBeenCalled();
      expect(observedLines()).toEqual([
        'Rokt Kit: preselect skipped [reason=intent_observed] [intent_kind=commit] [intent_route=before_entry] [intent_source=label] [has_email=true] [has_identity=true] [logged_in=true] [cause=cart_entry_only]',
        'Rokt Kit: preselect skipped [reason=intent_observed] [intent_kind=wallet] [intent_route=before_entry] [intent_source=vendor] [has_email=true] [has_identity=true] [logged_in=true] [cause=cart_entry_only]',
      ]);
    });
    it("fires a logged-in shopper's commit off every entry for the account's entry without cartIntent", () => {
      loggedIn = true;
      mockConfig.current = [CART_ENTRY, { ...CONFIG_ENTRY }];
      visit('/review');
      click('commit');
      expect(selectPlacementsCalls).toEqual([
        expect.objectContaining({
          identifier: TARGET_PAGE_IDENTIFIER,
          attributes: tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'intent_commit_off_entry'),
          preselectBoundUser: { mpid: MPID, requireLogin: true },
        }),
      ]);
      expect(recordPreselectFired).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER, CART_DIGEST, false);
      expect(recordPreselectFired).not.toHaveBeenCalledWith(ACCOUNT_ID, BAG_TARGET, expect.anything(), expect.anything());
      expect(observedLines()).toEqual([]);
    });
    it("treats the cartIntent entry's own route as off every entry for a commit or wallet tap", () => {
      visit(PRODUCT_PAGE);
      maybeFirePreselect(state, host, buildEvent(), PRODUCT_PAGE);
      vi.advanceTimersByTime(60000);
      click('wallet');
      loggedIn = true;
      click('commit');
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(observedLines()).toEqual([
        expect.stringContaining('[intent_kind=wallet] [intent_route=before_entry] [intent_source=label] [has_email=true] [has_identity=true] [logged_in=false]'),
        expect.stringContaining('[intent_kind=commit] [intent_route=before_entry] [intent_source=label] [has_email=true] [has_identity=true] [logged_in=true] [cause=cart_entry_only]'),
      ]);
      expect(state.pending).toEqual([expect.objectContaining({ pathname: PRODUCT_PAGE, waitingFor: 'intent' })]);
      expect(state.pending[0].intentSeen).toBeUndefined();

      mockConfig.current = [CART_ENTRY, { ...CONFIG_ENTRY }];
      click('wallet');
      expect(selectPlacementsCalls).toEqual([
        expect.objectContaining({
          identifier: TARGET_PAGE_IDENTIFIER,
          attributes: tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'intent_wallet_off_entry'),
        }),
      ]);

      click('cart');
      expect(selectPlacementsCalls[1]).toEqual(expect.objectContaining({ attributes: bagTagged('intent_cart') }));
      expect(state.pending).toHaveLength(0);
    });
    it("only observes a guest's commit or wallet tap off every entry, as before", () => {
      click('wallet');
      click('commit');
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(observedLines()).toEqual([
        expect.stringContaining('[intent_kind=wallet] [intent_route=before_entry] [intent_source=label] [has_email=true] [has_identity=true] [logged_in=false]'),
        expect.stringContaining('[intent_kind=commit] [intent_route=before_entry] [intent_source=label] [has_email=true] [has_identity=true] [logged_in=false]'),
      ]);
    });
    it('does nothing while checkout intent is not live, so the entry keeps its delay', () => {
      host.isCheckoutIntentActive = () => false;
      click();
      visit(PRODUCT_PAGE);
      maybeFirePreselect(state, host, buildEvent(), PRODUCT_PAGE);
      click();
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(recordPreselectIntent).not.toHaveBeenCalled();
      expect(observedLines()).toEqual([]);
      expectFiresAfter(2000);
      expect(selectPlacementsCalls[0].attributes).toEqual(bagTagged('pageview'));
    });
    it.each(['targeting', 'consent', 'privacy'])('honors the %s gate', (gate) => {
      if (gate === 'targeting') host.isTargetingDisabled = () => true;
      if (gate === 'consent') host.isForwardingAllowed = () => false;
      if (gate === 'privacy') host.isPreselectionPrivacyAllowed = () => false;
      click();
      visit(PRODUCT_PAGE);
      click();
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(loggedDiagnostics).toHaveLength(0);
      expect(recordPreselectIntent).not.toHaveBeenCalled();
    });
  });

  describe('cart page view', () => {
    const PRODUCT_ROUTE = '/product/*';
    const PRODUCT_PAGE = '/product/42';
    const BAG_TARGET = 'bag-target';
    const CART_KEY = 'cartItems';
    const CART_ENTRY: PreselectionConfigEntry = {
      accountId: ACCOUNT_ID,
      pathname: PRODUCT_ROUTE,
      targetPageIdentifier: BAG_TARGET,
      attributeKeys: [ATTRIBUTE_KEY],
      dispatchDelayMs: 2000,
      cartIntent: true,
      cartUserAttribute: CART_KEY,
    };
    const FIRED_LINE = 'Rokt Kit: preselect fired [reason=fired] [identity_types=email]';
    const SHOPPER_EMAIL = 'shopper@example.test';
    // The digest a cart page view's call carries: the entry's attribute plus the shopper's email.
    const CART_DIGEST = djb2(`${JSON.stringify({ [ATTRIBUTE_KEY]: 'gold' })}|${JSON.stringify([['email', SHOPPER_EMAIL]])}`);
    let userAttributes: Record<string, unknown>;
    const messages = () => loggedDiagnostics.map((line) => line.message);
    const cartTagged = () => tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'pageview_cart', PRODUCT_ROUTE);
    // A page view as the kit handles one: the route's own entry first, then the cart entry.
    const pageView = (pathname: string) => {
      window.history.replaceState({}, '', pathname);
      recordPreselectIntentPath(pathname);
      maybeFirePreselect(state, host, buildEvent(), pathname);
      maybeFirePreselectForCartPageView(state, host, pathname);
    };
    // Stands in for this tab's fire marks, so a later page view sees what an earlier fire or a cart click recorded.
    const keepFireMarks = () => {
      const marks: Array<{ digest?: number; byCart: boolean }> = [];
      vi.mocked(recordPreselectFired).mockImplementation((_, __, digest, byCart = false) => {
        marks.push({ digest, byCart });
        return undefined;
      });
      vi.mocked(wasPreselectFiredRecently).mockImplementation((_, __, digest, ignoreCartFire = false) => {
        const mark = marks[marks.length - 1];
        return !!mark && mark.digest === digest && !(ignoreCartFire && mark.byCart);
      });
      return marks;
    };
    beforeEach(() => {
      vi.useFakeTimers();
      mockConfig.current = [CART_ENTRY];
      userAttributes = { [ATTRIBUTE_KEY]: 'gold', [CART_KEY]: ['sku-1'] };
      host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
      host.getUserIdentities = () => ({ email: SHOPPER_EMAIL });
      host.filteredUser = {
        getUserIdentities: () => ({ userIdentities: { email: 'test@example.com' } }),
        getMPID: () => MPID,
        getAllUserAttributes: vi.fn(() => userAttributes),
      } as unknown as PreselectHost['filteredUser'];
    });
    afterEach(() => {
      cancelScheduledDispatch(state);
      vi.useRealTimers();
      window.history.replaceState({}, '', '/');
    });

    it('fires the entry at once on a page view off its route while the cart attribute is a list of items', () => {
      pageView('/');

      expect(selectPlacementsCalls).toEqual([
        {
          attributes: cartTagged(),
          preselect: true,
          identifier: BAG_TARGET,
          omitUrl: true,
          preselectBoundUser: { mpid: MPID, requireLogin: false },
        },
      ]);
      expect(messages()).toEqual([FIRED_LINE]);
      expect(recordPreselectFired).toHaveBeenCalledWith(
        ACCOUNT_ID,
        BAG_TARGET,
        CART_DIGEST,
        false,
      );
      expect(buildActivePreselectFieldKey).toHaveBeenCalledWith(ACCOUNT_ID, BAG_TARGET);
      expect(state.scheduledDispatch).toBeUndefined();
    });
    it.each([[['sku-1', 'sku-2']], ['["sku-1"]'], ['2'], [3], [true], ['sku-1']])(
      'fires while the cart attribute holds %j',
      (cart) => {
        userAttributes[CART_KEY] = cart;
        pageView('/');
        expect(selectPlacementsCalls).toEqual([expect.objectContaining({ attributes: cartTagged() })]);
      },
    );
    it.each([
      ['an empty list', []],
      ["'0'", '0'],
      ['a missing attribute', undefined],
      ["'[]'", '[]'],
      ['a JSON string of an empty list', ' [ ] '],
      ["''", ''],
      ["'{}'", '{}'],
      ["'false'", 'false'],
      ["'null'", 'NULL'],
      ['0', 0],
      ['false', false],
      ['null', null],
    ])('does not fire, and logs nothing, for %s', (_, cart) => {
      if (cart === undefined) delete userAttributes[CART_KEY];
      else userAttributes[CART_KEY] = cart;
      pageView('/');
      pageView('/list');
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(recordPreselectFired).not.toHaveBeenCalled();
      expect(loggedDiagnostics).toHaveLength(0);
    });
    it('waits until the call carries an email, then fires once one arrives', () => {
      host.getUserIdentities = () => ({ customerid: 'shopper' });
      pageView('/');
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(loggedDiagnostics).toHaveLength(0);

      host.getUserIdentities = () => ({ customerid: 'shopper', email: SHOPPER_EMAIL });
      flushPendingPreselectDispatches(state, host, '/');
      expect(selectPlacementsCalls).toEqual([expect.objectContaining({ attributes: cartTagged() })]);
    });
    it('reads the cart attribute in any casing', () => {
      userAttributes = { [ATTRIBUTE_KEY]: 'gold', CARTITEMS: ['sku-1'] };
      pageView('/');
      expect(selectPlacementsCalls).toEqual([expect.objectContaining({ attributes: cartTagged() })]);
    });
    it('fires while checkout intent is active, without waiting for a click', () => {
      host.isCheckoutIntentActive = () => true;
      pageView('/');
      expect(selectPlacementsCalls).toEqual([expect.objectContaining({ attributes: cartTagged() })]);
      expect(state.pending).toHaveLength(0);
    });
    it("leaves the entry's own route to its page view, which still holds for dispatchDelayMs", () => {
      pageView(PRODUCT_PAGE);
      expectFiresAfter(2000);
      expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'pageview', PRODUCT_ROUTE));
    });
    it("leaves the entry's own route waiting for the cart click while checkout intent is active", () => {
      host.isCheckoutIntentActive = () => true;
      pageView(PRODUCT_PAGE);
      flushPendingPreselectDispatches(state, host, PRODUCT_PAGE);
      vi.advanceTimersByTime(60000);
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(state.pending).toEqual([expect.objectContaining({ pathname: PRODUCT_PAGE, waitingFor: 'intent' })]);
      expect(messages()).toEqual(['Rokt Kit: preselect held [reason=awaiting_intent]']);
    });
    it("fires on another entry's route alongside that entry's own page view", () => {
      mockConfig.current = [{ ...CONFIG_ENTRY }, CART_ENTRY];
      pageView(PATHNAME);
      expect(selectPlacementsCalls.map((call) => call.attributes)).toEqual([
        tagged({ [ATTRIBUTE_KEY]: 'gold' }),
        cartTagged(),
      ]);
    });
    it('fires once across repeated page views, and again only once the target page has used the last fire', () => {
      const marks = keepFireMarks();
      pageView('/');
      pageView('/');
      pageView('/list');
      pageView('/');
      expect(selectPlacementsCalls).toHaveLength(1);
      expect(messages()).toEqual([FIRED_LINE]);

      // Arriving on the target page closes the fire mark.
      marks.length = 0;
      pageView('/list');
      expect(selectPlacementsCalls).toHaveLength(2);
    });
    it('skips without a log line while the target page holds an active pre-selection of these attributes', () => {
      vi.mocked(getActivePreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        attributesDigest: CART_DIGEST,
      });
      pageView('/');
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(loggedDiagnostics).toHaveLength(0);
      expect(buildActivePreselectFieldKey).toHaveBeenCalledWith(ACCOUNT_ID, BAG_TARGET);
    });
    it('does not fire again for the attributes a cart click already fired for the target page', () => {
      const marks = keepFireMarks();
      marks.push({ digest: CART_DIGEST, byCart: true });
      pageView('/');
      expect(selectPlacementsCalls).toHaveLength(0);
    });
    it('keeps the cart attribute out of the cache match keys and off the call', () => {
      expect(getPreselectCacheMatchKeys(CART_ENTRY)).toEqual([ATTRIBUTE_KEY]);
      pageView('/');
      expect(selectPlacementsCalls[0].attributes).not.toHaveProperty(CART_KEY);
    });
    it.each([
      ['privacy', () => (host.isPreselectionPrivacyAllowed = () => false)],
      ['targeting', () => (host.isTargetingDisabled = () => true)],
      ['consent', () => (host.isForwardingAllowed = () => false)],
      ['sample arm', () => (host.isPreselectionEnabled = () => false)],
    ])('honors the %s gate without reading the cart, and does not fire once it lifts on the same route', (_, close) => {
      close();
      pageView('/');
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(loggedDiagnostics).toHaveLength(0);
      expect(host.filteredUser!.getAllUserAttributes).not.toHaveBeenCalled();

      host.isPreselectionPrivacyAllowed = () => true;
      host.isTargetingDisabled = () => false;
      host.isForwardingAllowed = () => true;
      host.isPreselectionEnabled = () => true;
      flushPendingPreselectDispatches(state, host, '/');
      expect(selectPlacementsCalls).toHaveLength(0);
    });
    it.each([
      [
        'the launcher',
        () => (host.isKitReady = () => false),
        () => (host.isKitReady = () => true),
      ],
      [
        'a valid identity',
        () => (host.filteredUser = { ...host.filteredUser!, getUserIdentities: () => ({ userIdentities: {} }) }),
        () =>
          (host.filteredUser = {
            ...host.filteredUser!,
            getUserIdentities: () => ({ userIdentities: { email: 'test@example.com' } }),
          } as PreselectHost['filteredUser']),
      ],
      [
        'a required attribute',
        () => {
          host.userAttributes = {};
          delete userAttributes[ATTRIBUTE_KEY];
        },
        () => (host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' }),
      ],
      [
        'items in the cart',
        () => (userAttributes[CART_KEY] = '[]'),
        () => (userAttributes[CART_KEY] = '["sku-1"]'),
      ],
    ])('waits on the route for %s, and fires when it arrives', (_, withhold, supply) => {
      withhold();
      pageView('/');
      expect(selectPlacementsCalls).toHaveLength(0);

      supply();
      flushPendingPreselectDispatches(state, host, '/');
      expect(selectPlacementsCalls).toEqual([expect.objectContaining({ attributes: cartTagged() })]);
    });
    it('stops waiting once the shopper moves to another route without a page view', () => {
      userAttributes[CART_KEY] = [];
      pageView('/');
      userAttributes[CART_KEY] = ['sku-1'];
      window.history.replaceState({}, '', '/list');
      flushPendingPreselectDispatches(state, host, '/list');
      flushPendingPreselectDispatches(state, host, '/');
      expect(selectPlacementsCalls).toHaveLength(0);
    });
    it('stops waiting once a page view lands on the entry route', () => {
      userAttributes[CART_KEY] = [];
      pageView('/');
      pageView(PRODUCT_PAGE);
      userAttributes[CART_KEY] = ['sku-1'];
      flushPendingPreselectDispatches(state, host, PRODUCT_PAGE);
      vi.advanceTimersByTime(2000);
      expect(selectPlacementsCalls.map((call) => call.attributes)).toEqual([
        tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'pageview', PRODUCT_ROUTE),
      ]);
    });
    describe('after an add-to-cart click', () => {
      const tapCart = (adds?: boolean, kind: PreselectIntentSignal['kind'] = 'cart') => {
        host.isCheckoutIntentActive = () => true;
        vi.setSystemTime(Date.now() + 1);
        const t = Date.now();
        const signal = { kind, t, source: 'label', ...(adds === undefined ? {} : { adds }) };
        handlePreselectIntentSignal(state, host, Object.freeze(signal));
        return t;
      };

      it('fires on a page view while the page has not set the cart attribute since', () => {
        delete userAttributes[CART_KEY];
        vi.mocked(wasPreselectCartAdded).mockReturnValue(true);
        pageView('/');
        expect(selectPlacementsCalls).toEqual([expect.objectContaining({ attributes: cartTagged() })]);
        expect(wasPreselectCartAdded).toHaveBeenCalledWith(ACCOUNT_ID, MPID);
      });
      it('fires over an empty cart attribute, which the page set before the click', () => {
        userAttributes[CART_KEY] = [];
        vi.mocked(wasPreselectCartAdded).mockReturnValue(true);
        pageView('/');
        expect(selectPlacementsCalls).toEqual([expect.objectContaining({ attributes: cartTagged() })]);
      });
      it('still waits for the shopper\'s email', () => {
        delete userAttributes[CART_KEY];
        vi.mocked(wasPreselectCartAdded).mockReturnValue(true);
        host.getUserIdentities = () => ({ customerid: 'shopper' });
        pageView('/');
        expect(selectPlacementsCalls).toHaveLength(0);
      });
      it('remembers a cart click that adds to the cart, at the time it happened', () => {
        const t = tapCart(true);
        expect(recordPreselectCartAdd).toHaveBeenCalledWith(ACCOUNT_ID, t, MPID);
      });
      it('remembers nothing for a shopper with no mpid yet', () => {
        host.filteredUser = { ...host.filteredUser, getMPID: () => null } as unknown as PreselectHost['filteredUser'];
        tapCart(true);
        expect(recordPreselectCartAdd).not.toHaveBeenCalled();
      });
      it.each([
        ['a cart click that opens the cart', undefined, 'cart'],
        ['a cart click whose adds is not true', 'yes', 'cart'],
        ['a wallet tap', true, 'wallet'],
      ] as const)('remembers nothing for %s', (_, adds, kind) => {
        tapCart(adds as unknown as boolean, kind);
        expect(recordPreselectCartAdd).not.toHaveBeenCalled();
      });
      it('remembers an add that arrives with the same time as a cart open', () => {
        host.isCheckoutIntentActive = () => true;
        // Well clear of the times other tests use, since handled signals are kept for the module's life.
        vi.setSystemTime(Date.now() + 86_400_000);
        const t = Date.now();
        handlePreselectIntentSignal(state, host, Object.freeze({ kind: 'cart', t, source: 'label' }));
        handlePreselectIntentSignal(state, host, Object.freeze({ kind: 'cart', t, source: 'label', adds: true }));
        expect(recordPreselectCartAdd).toHaveBeenCalledWith(ACCOUNT_ID, t, MPID);
      });
      it('remembers nothing for an account whose cart entry names no cart attribute', () => {
        mockConfig.current = [{ ...CART_ENTRY, cartUserAttribute: undefined }];
        tapCart(true);
        expect(recordPreselectCartAdd).not.toHaveBeenCalled();
      });
    });
    it.each([
      ['with no cart attribute named', [{ ...CART_ENTRY, cartUserAttribute: undefined }]],
      ['without cartIntent', [{ ...CART_ENTRY, cartIntent: undefined }]],
      ['beside a second cartIntent entry', [CART_ENTRY, { ...CART_ENTRY, pathname: '/deals/*', targetPageIdentifier: 'deals' }]],
    ])('never fires for an entry %s', (_, entries) => {
      mockConfig.current = entries;
      pageView('/');
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(isPreselectCartAttributeKey(ACCOUNT_ID, CART_KEY)).toBe(false);
    });
    it("names the account's cart attribute in any casing, and nothing else", () => {
      expect(isPreselectCartAttributeKey(ACCOUNT_ID, 'CARTITEMS')).toBe(true);
      expect(isPreselectCartAttributeKey(ACCOUNT_ID, ATTRIBUTE_KEY)).toBe(false);
      expect(isPreselectCartAttributeKey('another-account', CART_KEY)).toBe(false);
      expect(isPreselectCartAttributeKey(null, CART_KEY)).toBe(false);
    });
    it('leaves the cart attribute off a pre-selection call in any casing, unless the entry it fires for matches on it', () => {
      const attributes = { [ATTRIBUTE_KEY]: 'gold', [CART_KEY.toUpperCase()]: ['sku-1'] };
      const checkoutEntry: PreselectionConfigEntry = {
        ...CART_ENTRY,
        cartIntent: undefined,
        cartUserAttribute: undefined,
        pathname: '/checkout',
        targetPageIdentifier: 'confirmation',
        attributeKeys: [CART_KEY],
      };
      mockConfig.current = [CART_ENTRY, checkoutEntry];
      expect(withoutPreselectCartGateAttribute(ACCOUNT_ID, attributes, CART_ENTRY)).toEqual({ [ATTRIBUTE_KEY]: 'gold' });
      expect(withoutPreselectCartGateAttribute(ACCOUNT_ID, attributes, undefined)).toEqual({ [ATTRIBUTE_KEY]: 'gold' });
      expect(withoutPreselectCartGateAttribute(ACCOUNT_ID, attributes, checkoutEntry)).toBe(attributes);
      expect(withoutPreselectCartGateAttribute('another-account', attributes, CART_ENTRY)).toBe(attributes);
    });
  });

  describe('createPreselectState', () => {
    it('starts with an empty pending queue', () => {
      expect(createPreselectState()).toEqual({ pending: [] });
    });
  });

  describe('order review registry entry', () => {
    const ENTRY_ACCOUNT_ID = '2192288523645376337';
    const ENTRY_PATHNAME = '/checkout/order-1/review';
    const ENTRY_DELAY_MS = 10000;
    const dispatchWith = (attributes: Record<string, unknown>) => ({
      attributes: tagged(attributes, 'pageview', '/checkout/*/review'),
      preselect: true,
      identifier: 'ppx-ad-view-prod',
      omitUrl: true,
    });

    beforeEach(async () => {
      const { PRESELECTION_CONFIG } = await vi.importActual<typeof import('../../src/preselectionConfig')>(
        '../../src/preselectionConfig',
      );
      mockConfig.current = PRESELECTION_CONFIG;
      host.accountId = ENTRY_ACCOUNT_ID;
      // Signed in, with no email attribute or email identity.
      host.filteredUser = {
        getUserIdentities: () => ({ userIdentities: { customerid: 'customer-1' } }),
        getMPID: () => MPID,
      } as unknown as PreselectHost['filteredUser'];
      host.getUserIdentities = () => ({ customerid: 'customer-1' });
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('fires after the delay without email', () => {
      maybeFirePreselect(state, host, buildEvent(), ENTRY_PATHNAME);

      expectFiresAfter(ENTRY_DELAY_MS);
      expect(selectPlacementsCalls).toEqual([dispatchWith({})]);
      expect(state.pending).toHaveLength(0);
    });

    it('sends email when the attribute is set', () => {
      host.userAttributes = { email: 'test@example.com' };

      maybeFirePreselect(state, host, buildEvent(), ENTRY_PATHNAME);

      expectFiresAfter(ENTRY_DELAY_MS);
      expect(selectPlacementsCalls).toEqual([dispatchWith({ email: 'test@example.com' })]);
    });
  });

  describe('checkout registry entry without last name in the match set', () => {
    let configEntry: PreselectionConfigEntry;

    beforeEach(async () => {
      const { PRESELECTION_CONFIG } = await vi.importActual<typeof import('../../src/preselectionConfig')>(
        '../../src/preselectionConfig',
      );
      configEntry = PRESELECTION_CONFIG.find((entry) => entry.accountId === '2550745407543340151')!;
      mockConfig.current = [configEntry];
      host.accountId = configEntry.accountId;
      host.userAttributes = { email: 'test@example.com', firstname: 'Ana', customertype: 'guest' };
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('compares first name but not last name on arrival', () => {
      expect(getPreselectCacheMatchKeys(configEntry)).toEqual([
        'email',
        'firstname',
        'customertype',
        'loyaltytier',
        'paymenttype',
      ]);
    });

    it('dispatches after the hold with last name unset', () => {
      maybeFirePreselect(state, host, buildEvent(), configEntry.pathname);

      expectFiresAfter(20000);
      expect(selectPlacementsCalls).toEqual([
        {
          attributes: tagged({ email: 'test@example.com', firstname: 'Ana', customertype: 'guest' }, 'pageview', '/checkout'),
          preselect: true,
          identifier: 'RoktExperience',
          omitUrl: true,
        },
      ]);
    });

    it.each(['email', 'firstname', 'customertype'])('holds the dispatch when required %s is unset', (key) => {
      delete host.userAttributes[key];

      maybeFirePreselect(state, host, buildEvent(), configEntry.pathname);
      vi.advanceTimersByTime(20000);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(state.pending).toEqual([
        expect.objectContaining({ pathname: configEntry.pathname, waitingFor: 'attribute' }),
      ]);
      expect(loggedDiagnostics.filter((entry) => entry.code === 'PRESELECT_MISSED')).toEqual([
        expect.objectContaining({ message: expect.stringContaining(`missing_attribute:${key}`) }),
      ]);
    });
  });

  describe('maybeFirePreselect', () => {
    beforeEach(() => {
      mockConfig.current = [CONFIG_ENTRY];
      host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
    });

    describe('preselection enabled', () => {
      describe('preconditions', () => {
        it('does nothing when no config entry matches the account/pathname', () => {
          mockConfig.current = [];

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toHaveLength(0);
          expect(loggedDiagnostics).toHaveLength(0);
        });

        it('queues rather than fires when the kit is not ready, reporting nothing', () => {
          host.isKitReady = () => false;

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toHaveLength(0);
          expect(state.pending).toEqual([
            {
              event: expect.anything(),
              pathname: PATHNAME,
              storedDiagnostics: [],
              triggeredAt: expect.any(Number),
              waitingFor: 'launcher',
            },
          ]);
          expect(loggedDiagnostics).toHaveLength(0);
        });

        it('collapses repeat pageviews on one pathname to a single pending entry', () => {
          host.isKitReady = () => false;

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(state.pending).toHaveLength(1);
          expect(state.pending[0].storedDiagnostics).toHaveLength(0);
          expect(loggedDiagnostics).toHaveLength(0);
        });

        it('persists a resolvable not-ready attempt so it can survive a full navigation', () => {
          host.isKitReady = () => false;

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(setPendingPreselect).toHaveBeenCalledWith(
            ACCOUNT_ID,
            PATHNAME,
            TARGET_PAGE_IDENTIFIER,
            { [ATTRIBUTE_KEY]: 'gold' },
            MPID,
          );
        });

        it('does not persist a not-ready attempt when identity is not yet known', () => {
          host.isKitReady = () => false;
          host.filteredUser = { getUserIdentities: () => ({ userIdentities: {} }) } as unknown as PreselectHost['filteredUser'];

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(setPendingPreselect).not.toHaveBeenCalled();
        });

        it('does not persist a not-ready attempt when a required attribute is missing', () => {
          host.isKitReady = () => false;
          host.userAttributes = {};

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(setPendingPreselect).not.toHaveBeenCalled();
        });

        it('does not persist a not-ready attempt when the mpid is unavailable', () => {
          host.isKitReady = () => false;
          host.filteredUser = {
            getUserIdentities: () => ({ userIdentities: { email: 'test@example.com' } }),
            getMPID: () => null,
          } as unknown as PreselectHost['filteredUser'];

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(setPendingPreselect).not.toHaveBeenCalled();
        });

        it('strips deny-listed attributes from the persisted snapshot, even though they still count toward completeness', () => {
          host.isKitReady = () => false;
          mockConfig.current = [{ ...CONFIG_ENTRY, attributeKeys: [ATTRIBUTE_KEY, 'billingzipcode'] }];
          host.userAttributes = { [ATTRIBUTE_KEY]: 'gold', billingzipcode: '10001' };

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(setPendingPreselect).toHaveBeenCalledWith(
            ACCOUNT_ID,
            PATHNAME,
            TARGET_PAGE_IDENTIFIER,
            { [ATTRIBUTE_KEY]: 'gold' },
            MPID,
          );
        });

        it('stores a persist-failure diagnostic, and only that, when the write does not succeed', () => {
          host.isKitReady = () => false;
          vi.mocked(setPendingPreselect).mockReturnValue(false);

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(state.pending[0].storedDiagnostics).toEqual([
            expect.objectContaining({ code: 'PRESELECT_QUEUED', message: expect.stringContaining('persist_failed') }),
          ]);
          expect(loggedDiagnostics).toHaveLength(0);
        });

        it('does not fire, but requeues, when there is no valid identity', () => {
          host.filteredUser = { getUserIdentities: () => ({ userIdentities: {} }) } as unknown as PreselectHost['filteredUser'];

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toHaveLength(0);
          expect(state.pending).toEqual([
            { event: expect.anything(), pathname: PATHNAME, triggeredAt: expect.any(Number), waitingFor: 'identity' },
          ]);
          expect(loggedDiagnostics).toContainEqual(expect.objectContaining({ code: 'PRESELECT_MISSED' }));
        });

        it('fires on a later flush once identity becomes valid for a requeued attempt', () => {
          host.filteredUser = { getUserIdentities: () => ({ userIdentities: {} }) } as unknown as PreselectHost['filteredUser'];

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);
          expect(selectPlacementsCalls).toHaveLength(0);
          expect(state.pending).toHaveLength(1);

          host.filteredUser = {
            getUserIdentities: () => ({ userIdentities: { email: 'guest@example.com' } }),
          } as unknown as PreselectHost['filteredUser'];

          flushPendingPreselectDispatches(state, host, PATHNAME);

          expect(selectPlacementsCalls).toHaveLength(1);
          expect(state.pending).toHaveLength(0);
        });
      });

      describe('attribute matching', () => {
        it('requeues and logs missed when a required attribute is unresolved', () => {
          host.userAttributes = {};

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toHaveLength(0);
          expect(state.pending).toHaveLength(1);
          expect(loggedDiagnostics).toContainEqual(
            expect.objectContaining({ code: 'PRESELECT_MISSED', message: expect.stringContaining(ATTRIBUTE_KEY) }),
          );
        });

        it('fires without an unresolved optional attribute, omitting it from the dispatch', () => {
          mockConfig.current = [
            { ...CONFIG_ENTRY, attributeKeys: [ATTRIBUTE_KEY, 'firstname'], optionalAttributeKeys: ['firstname'] },
          ];
          host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toEqual([
            { attributes: tagged({ [ATTRIBUTE_KEY]: 'gold' }), preselect: true, identifier: TARGET_PAGE_IDENTIFIER, omitUrl: true },
          ]);
          expect(loggedDiagnostics).not.toContainEqual(expect.objectContaining({ code: 'PRESELECT_MISSED' }));
        });

        it('sends an optional attribute when it does resolve', () => {
          mockConfig.current = [
            { ...CONFIG_ENTRY, attributeKeys: [ATTRIBUTE_KEY, 'firstname'], optionalAttributeKeys: ['firstname'] },
          ];
          host.userAttributes = { [ATTRIBUTE_KEY]: 'gold', firstname: 'ryan' };

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toEqual([
            {
              attributes: tagged({ [ATTRIBUTE_KEY]: 'gold', firstname: 'ryan' }),
              preselect: true,
              identifier: TARGET_PAGE_IDENTIFIER,
              omitUrl: true,
            },
          ]);
        });

        it('still blocks on an unresolved required attribute when an optional one is also unresolved', () => {
          mockConfig.current = [
            { ...CONFIG_ENTRY, attributeKeys: [ATTRIBUTE_KEY, 'firstname'], optionalAttributeKeys: ['firstname'] },
          ];
          host.userAttributes = {};

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toHaveLength(0);
          expect(state.pending).toHaveLength(1);
          expect(loggedDiagnostics).toContainEqual(
            expect.objectContaining({ code: 'PRESELECT_MISSED', message: expect.stringContaining(ATTRIBUTE_KEY) }),
          );
          expect(loggedDiagnostics).not.toContainEqual(
            expect.objectContaining({ code: 'PRESELECT_MISSED', message: expect.stringContaining('firstname') }),
          );
        });

        it('treats an optional attribute key as optional regardless of case', () => {
          mockConfig.current = [
            { ...CONFIG_ENTRY, attributeKeys: [ATTRIBUTE_KEY, 'firstName'], optionalAttributeKeys: ['FIRSTNAME'] },
          ];
          host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toEqual([
            { attributes: tagged({ [ATTRIBUTE_KEY]: 'gold' }), preselect: true, identifier: TARGET_PAGE_IDENTIFIER, omitUrl: true },
          ]);
        });

        describe('widenedOptionalAttributeKeys', () => {
          beforeEach(() => {
            mockConfig.current = [
              {
                ...CONFIG_ENTRY,
                attributeKeys: [ATTRIBUTE_KEY, 'firstName'],
                widenedOptionalAttributeKeys: ['FIRSTNAME'],
              },
            ];
            host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
          });

          it('fires on a widened tab without an unresolved widened key, omitting it from the dispatch', () => {
            host.getPreselectVariant = () => 'widened';

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            expect(selectPlacementsCalls).toEqual([
              {
                attributes: tagged({ [ATTRIBUTE_KEY]: 'gold' }),
                preselect: true,
                identifier: TARGET_PAGE_IDENTIFIER,
                omitUrl: true,
              },
            ]);
            expect(loggedDiagnostics).not.toContainEqual(expect.objectContaining({ code: 'PRESELECT_MISSED' }));
          });

          it.each([
            { label: 'standard', variant: 'standard' },
            { label: 'absent', variant: undefined },
            { label: 'another value', variant: 'Widened' },
          ])('holds on an unresolved widened key when the variant is $label', ({ variant }) => {
            host.getPreselectVariant = () => variant;

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            expect(selectPlacementsCalls).toHaveLength(0);
            expect(state.pending).toHaveLength(1);
            expect(loggedDiagnostics).toContainEqual(
              expect.objectContaining({ code: 'PRESELECT_MISSED', message: expect.stringContaining('firstName') }),
            );
          });

          it('holds when the host has no variant reader', () => {
            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            expect(selectPlacementsCalls).toHaveLength(0);
            expect(state.pending).toHaveLength(1);
          });

          it('still holds a widened tab on a required key outside both optional lists', () => {
            host.getPreselectVariant = () => 'widened';
            host.userAttributes = {};

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            expect(selectPlacementsCalls).toHaveLength(0);
            expect(loggedDiagnostics).toContainEqual(
              expect.objectContaining({ code: 'PRESELECT_MISSED', message: expect.stringContaining(ATTRIBUTE_KEY) }),
            );
            expect(loggedDiagnostics).not.toContainEqual(
              expect.objectContaining({ code: 'PRESELECT_MISSED', message: expect.stringContaining('firstName') }),
            );
          });

          it('reads the variant when it replays, not when it first held', () => {
            let variant = 'standard';
            host.getPreselectVariant = () => variant;

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);
            expect(selectPlacementsCalls).toHaveLength(0);

            variant = 'widened';
            flushPendingPreselectDispatches(state, host, PATHNAME);

            expect(selectPlacementsCalls).toEqual([
              {
                attributes: tagged({ [ATTRIBUTE_KEY]: 'gold' }),
                preselect: true,
                identifier: TARGET_PAGE_IDENTIFIER,
                omitUrl: true,
              },
            ]);
          });
        });

        describe('preselectAttributeDefaults', () => {
          const DEFAULTED_KEY = 'placementType';
          const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
          const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130.0 Safari/537.36';

          const useEntry = (overrides: Partial<PreselectionConfigEntry> = {}) => {
            mockConfig.current = [
              {
                ...CONFIG_ENTRY,
                attributeKeys: [ATTRIBUTE_KEY, DEFAULTED_KEY],
                preselectAttributeDefaults: { [DEFAULTED_KEY]: 'overlay' },
                ...overrides,
              },
            ];
          };

          const firedLine = () => loggedDiagnostics.find((entry) => entry.code === 'PRESELECT_FIRED');

          beforeEach(() => {
            host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
          });

          afterEach(() => {
            vi.restoreAllMocks();
          });

          it('fires on a standard tab with the defaulted key unset, leaving the fill to the outgoing call', () => {
            useEntry();
            host.getPreselectVariant = () => 'standard';

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            expect(selectPlacementsCalls).toEqual([
              {
                attributes: tagged({ [ATTRIBUTE_KEY]: 'gold' }),
                preselect: true,
                identifier: TARGET_PAGE_IDENTIFIER,
                omitUrl: true,
              },
            ]);
            expect(firedLine()?.message).toContain('[variant=standard] [defaulted_keys=placementType]');
          });

          it('fires on a tab with no variant, which is a standard tab', () => {
            useEntry();

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            expect(selectPlacementsCalls).toHaveLength(1);
            expect(firedLine()?.message).not.toContain('[variant=');
          });

          it('reports no defaulted key when the page set it', () => {
            useEntry();

            maybeFirePreselect(state, host, buildEvent({ [DEFAULTED_KEY]: 'embed' }), PATHNAME);

            expect(selectPlacementsCalls[0].attributes).toEqual(
              tagged({ [ATTRIBUTE_KEY]: 'gold', [DEFAULTED_KEY]: 'embed' }),
            );
            expect(firedLine()?.message).not.toContain('defaulted_keys');
          });

          it('does not count a default as resolved on a widened tab', () => {
            useEntry();
            host.getPreselectVariant = () => 'widened';

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            expect(selectPlacementsCalls).toHaveLength(0);
            expect(loggedDiagnostics).toContainEqual(
              expect.objectContaining({
                code: 'PRESELECT_MISSED',
                message: expect.stringContaining('[reason=missing_attribute:placementType]'),
              }),
            );
            expect(loggedDiagnostics).toContainEqual(
              expect.objectContaining({
                code: 'PRESELECT_MISSED',
                message: expect.stringContaining('[variant=widened]'),
              }),
            );
          });

          it('fires a widened tab without a widened key it would otherwise default', () => {
            useEntry({ widenedOptionalAttributeKeys: [DEFAULTED_KEY] });
            host.getPreselectVariant = () => 'widened';

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            expect(selectPlacementsCalls).toHaveLength(1);
            expect(firedLine()?.message).toContain('[variant=widened]');
            expect(firedLine()?.message).not.toContain('defaulted_keys');
          });

          it('holds on a device the default skips', () => {
            vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE);
            useEntry({
              preselectAttributeDefaults: {
                [DEFAULTED_KEY]: { value: 'overlay', byClientType: { MobileWeb: 'skip' } },
              },
            });

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            expect(selectPlacementsCalls).toHaveLength(0);
            expect(state.pending).toHaveLength(1);
          });

          it('fires on a device the default does not skip', () => {
            vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(MAC);
            useEntry({
              preselectAttributeDefaults: {
                [DEFAULTED_KEY]: { value: 'overlay', byClientType: { MobileWeb: 'skip' } },
              },
            });

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            expect(selectPlacementsCalls).toHaveLength(1);
          });

          it('holds on a device a default with only device values does not name', () => {
            vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (compatible; unknown device)');
            useEntry({
              preselectAttributeDefaults: {
                [DEFAULTED_KEY]: { byClientType: { DesktopWeb: 'overlay', MobileWeb: 'overlay' } },
              },
            });

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            expect(selectPlacementsCalls).toHaveLength(0);
          });

          it('lets a skipRemembered default replace a saved value', () => {
            useEntry({
              preselectAttributeDefaults: { [DEFAULTED_KEY]: { value: 'overlay', skipRemembered: true } },
            });
            host.userAttributes = { [ATTRIBUTE_KEY]: 'gold', [DEFAULTED_KEY]: 'embed' };

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ [ATTRIBUTE_KEY]: 'gold' }));
            expect(firedLine()?.message).toContain('[defaulted_keys=placementType]');
          });

          it('fills nothing over a value the attributes hold in another casing', () => {
            useEntry();
            const attributes = { placementtype: 'embed' };

            const fills = getPreselectAttributeDefaults(host, mockConfig.current[0], attributes);

            expect(fills).toEqual({});
            expect(applyPreselectAttributeDefaults(attributes, fills)).toEqual({ placementtype: 'embed' });
          });

          it('holds on a required key saved in another casing, as it would with no default', () => {
            useEntry();
            host.userAttributes = { [ATTRIBUTE_KEY]: 'gold', placementtype: 'embed' };

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            expect(selectPlacementsCalls).toHaveLength(0);
          });

          it('lets a skipRemembered default replace a value saved in another casing', () => {
            useEntry({
              preselectAttributeDefaults: { [DEFAULTED_KEY]: { value: 'overlay', skipRemembered: true } },
            });
            host.userAttributes = { [ATTRIBUTE_KEY]: 'gold', placementtype: 'embed' };

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            expect(selectPlacementsCalls).toHaveLength(1);
            expect(firedLine()?.message).toContain('[defaulted_keys=placementType]');
          });

          it('keeps a saved value when a skipRemembered default has nothing for this device', () => {
            vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE);
            useEntry({
              preselectAttributeDefaults: {
                [DEFAULTED_KEY]: { value: 'overlay', byClientType: { MobileWeb: 'skip' }, skipRemembered: true },
              },
            });
            host.userAttributes = { [ATTRIBUTE_KEY]: 'gold', [DEFAULTED_KEY]: 'embed' };

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            expect(selectPlacementsCalls[0].attributes).toEqual(
              tagged({ [ATTRIBUTE_KEY]: 'gold', [DEFAULTED_KEY]: 'embed' }),
            );
          });

          it('keeps a saved value on a widened tab, where skipRemembered has no default to give', () => {
            useEntry({
              preselectAttributeDefaults: { [DEFAULTED_KEY]: { value: 'overlay', skipRemembered: true } },
            });
            host.getPreselectVariant = () => 'widened';
            host.userAttributes = { [ATTRIBUTE_KEY]: 'gold', [DEFAULTED_KEY]: 'embed' };

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            expect(selectPlacementsCalls[0].attributes).toEqual(
              tagged({ [ATTRIBUTE_KEY]: 'gold', [DEFAULTED_KEY]: 'embed' }),
            );
          });

          it('does not default a key an identity the call carries already holds', () => {
            useEntry({
              preselectAttributeDefaults: { customerid: 'guess' },
              attributeKeys: [ATTRIBUTE_KEY, 'customerid'],
            });
            host.getUserIdentities = () => ({ CustomerId: 'c-1' });

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            expect(selectPlacementsCalls).toHaveLength(0);
          });

          describe("on the account's mapped hashed-email key", () => {
            beforeEach(() => {
              useEntry({
                preselectAttributeDefaults: { hashedEmail: { value: 'guess', skipRemembered: true } },
                attributeKeys: [ATTRIBUTE_KEY, 'hashedEmail'],
              });
              host.mappedEmailSha256Key = 'hashedemail';
            });

            it('fills no default', () => {
              maybeFirePreselect(state, host, buildEvent(), PATHNAME);

              expect(selectPlacementsCalls).toHaveLength(0);
            });

            it('keeps the saved hash even with skipRemembered', () => {
              host.userAttributes = { [ATTRIBUTE_KEY]: 'gold', hashedEmail: 'saved-hash' };

              maybeFirePreselect(state, host, buildEvent(), PATHNAME);

              expect(selectPlacementsCalls[0].attributes).toEqual(
                tagged({ [ATTRIBUTE_KEY]: 'gold', hashedEmail: 'saved-hash' }),
              );
            });
          });

          describe('skipValues', () => {
            const skipEmbed = (extra: Record<string, unknown> = {}) =>
              useEntry({
                optionalAttributeKeys: [DEFAULTED_KEY],
                preselectAttributeDefaults: { [DEFAULTED_KEY]: { value: 'overlay', skipValues: ['embed'], ...extra } },
              });
            const skippedLine = {
              code: 'PRESELECT_SKIPPED',
              message: 'Rokt Kit: preselect skipped [reason=skip_value:placementType]',
            };

            it("sends and records nothing when the page's own value is one the default skips", () => {
              skipEmbed();

              maybeFirePreselect(state, host, buildEvent({ [DEFAULTED_KEY]: 'embed' }), PATHNAME);

              expect(selectPlacementsCalls).toHaveLength(0);
              expect(state.pending).toHaveLength(0);
              expect(setActivePreselect).not.toHaveBeenCalled();
              expect(loggedDiagnostics).toContainEqual(skippedLine);
            });

            it('matches the key and the value in any casing', () => {
              skipEmbed();

              maybeFirePreselect(state, host, buildEvent({ PlacementType: 'EMBED' }), PATHNAME);

              expect(selectPlacementsCalls).toHaveLength(0);
              expect(loggedDiagnostics).toContainEqual(skippedLine);
            });

            it('matches a boolean value by its text', () => {
              useEntry({
                optionalAttributeKeys: [DEFAULTED_KEY],
                preselectAttributeDefaults: { [DEFAULTED_KEY]: { value: 'false', skipValues: ['true'] } },
              });

              maybeFirePreselect(state, host, buildEvent({ [DEFAULTED_KEY]: true }), PATHNAME);

              expect(selectPlacementsCalls).toHaveLength(0);
            });

            it('skips on a value saved from an earlier call', () => {
              skipEmbed();
              host.userAttributes = { [ATTRIBUTE_KEY]: 'gold', [DEFAULTED_KEY]: 'embed' };

              maybeFirePreselect(state, host, buildEvent(), PATHNAME);

              expect(selectPlacementsCalls).toHaveLength(0);
            });

            it('fires with the fill when skipRemembered sets the saved value aside', () => {
              skipEmbed({ skipRemembered: true });
              host.userAttributes = { [ATTRIBUTE_KEY]: 'gold', [DEFAULTED_KEY]: 'embed' };

              maybeFirePreselect(state, host, buildEvent(), PATHNAME);

              expect(selectPlacementsCalls).toHaveLength(1);
              expect(firedLine()?.message).toContain('[defaulted_keys=placementType]');
            });

            it("fires when the shopper's own value is not one it skips", () => {
              skipEmbed();

              maybeFirePreselect(state, host, buildEvent({ [DEFAULTED_KEY]: 'banner' }), PATHNAME);

              expect(selectPlacementsCalls[0].attributes).toEqual(
                tagged({ [ATTRIBUTE_KEY]: 'gold', [DEFAULTED_KEY]: 'banner' }),
              );
            });

            it('never skips on its own fill', () => {
              useEntry({
                optionalAttributeKeys: [DEFAULTED_KEY],
                preselectAttributeDefaults: { [DEFAULTED_KEY]: { value: 'embed', skipValues: ['embed'] } },
              });

              maybeFirePreselect(state, host, buildEvent(), PATHNAME);

              expect(selectPlacementsCalls).toHaveLength(1);
              expect(firedLine()?.message).toContain('[defaulted_keys=placementType]');
            });

            it('skips a recovered dispatch that carries a skipped value', () => {
              skipEmbed();
              vi.mocked(getPendingPreselect).mockReturnValue({
                expiresAt: Date.now() + 60_000,
                pathname: PATHNAME,
                identifier: TARGET_PAGE_IDENTIFIER,
                attributes: { [ATTRIBUTE_KEY]: 'gold', [DEFAULTED_KEY]: 'embed' },
                mpid: MPID,
              });

              maybeFirePersistedPreselect(state, host);

              expect(selectPlacementsCalls).toHaveLength(0);
              expect(loggedDiagnostics).toContainEqual(skippedLine);
            });
          });

          it('fires a recovered dispatch whose only unset key has a default', () => {
            useEntry();
            vi.mocked(getPendingPreselect).mockReturnValue({
              expiresAt: Date.now() + 60_000,
              pathname: PATHNAME,
              identifier: TARGET_PAGE_IDENTIFIER,
              attributes: { [ATTRIBUTE_KEY]: 'gold' },
              mpid: MPID,
            });

            maybeFirePersistedPreselect(state, host);

            expect(selectPlacementsCalls).toHaveLength(1);
            expect(firedLine()?.message).toContain('[defaulted_keys=placementType]');
          });

          it('keys the dedupe on the defaulted value, so a page value replacing it fires again', () => {
            useEntry();
            vi.mocked(buildActivePreselectFieldKey).mockReturnValue(FIELD_KEY);

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);
            const [, defaultedDigest] = vi.mocked(setActivePreselect).mock.calls[0];
            maybeFirePreselect(state, host, buildEvent({ [DEFAULTED_KEY]: 'overlay' }), PATHNAME);
            const [, pageDigest] = vi.mocked(setActivePreselect).mock.calls[1];

            expect(defaultedDigest).toBe(pageDigest);
            vi.mocked(getActivePreselect).mockReturnValue({ attributesDigest: pageDigest } as never);
            maybeFirePreselect(state, host, buildEvent({ [DEFAULTED_KEY]: 'embed' }), PATHNAME);

            expect(selectPlacementsCalls).toHaveLength(3);
            expect(vi.mocked(setActivePreselect).mock.calls[2][1]).not.toBe(pageDigest);
          });

          it('keys the dedupe on the value a later source sends in place of a default', () => {
            useEntry();
            vi.mocked(buildActivePreselectFieldKey).mockReturnValue(FIELD_KEY);
            let sessionValue = 'embed';
            host.getOutgoingAttributes = (attributes) => ({ ...attributes, [DEFAULTED_KEY]: sessionValue });

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);
            const [, embedDigest] = vi.mocked(setActivePreselect).mock.calls[0];
            vi.mocked(getActivePreselect).mockReturnValue({ attributesDigest: embedDigest } as never);
            sessionValue = 'inline';
            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            expect(selectPlacementsCalls).toHaveLength(2);
            expect(vi.mocked(setActivePreselect).mock.calls[1][1]).not.toBe(embedDigest);
          });
        });

      describe('identityKeys', () => {
        const IDENTITY_KEY = 'emailsha256';

        beforeEach(() => {
          mockConfig.current = [
            { ...CONFIG_ENTRY, attributeKeys: [ATTRIBUTE_KEY, IDENTITY_KEY], identityKeys: [IDENTITY_KEY] },
          ];
          host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
          host.getUserIdentities = () => ({ [IDENTITY_KEY]: 'hashed-identity' });
        });

        it('does not take an inherited property for a declared key', () => {
          mockConfig.current = [{ ...CONFIG_ENTRY, attributeKeys: ['toString'], identityKeys: ['toString'] }];
          host.getEventAttributeValue = () => null;
          host.userAttributes = {};
          host.getUserIdentities = () => ({});

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toHaveLength(0);
        });

        it('does not take a user identity that is not a non-empty string', () => {
          host.getUserIdentities = () => ({ [IDENTITY_KEY]: 42 as unknown as string });

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toHaveLength(0);
        });

        it('resolves a declared key from the user identity of the same name when no attribute carries it', () => {
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toEqual([
            {
              attributes: tagged({ [ATTRIBUTE_KEY]: 'gold', [IDENTITY_KEY]: 'hashed-identity' }),
              preselect: true,
              identifier: TARGET_PAGE_IDENTIFIER,
              omitUrl: true,
            },
          ]);
        });

        it('prefers an attribute value over the user identity', () => {
          host.userAttributes = { [ATTRIBUTE_KEY]: 'gold', [IDENTITY_KEY]: 'hashed-attribute' };

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls[0].attributes).toEqual(tagged({
            [ATTRIBUTE_KEY]: 'gold',
            [IDENTITY_KEY]: 'hashed-attribute',
          }));
        });

        it('does not read user identities for a key the entry does not declare', () => {
          mockConfig.current = [{ ...CONFIG_ENTRY, attributeKeys: [ATTRIBUTE_KEY, IDENTITY_KEY] }];

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toHaveLength(0);
          expect(loggedDiagnostics).toContainEqual(
            expect.objectContaining({ code: 'PRESELECT_MISSED', message: expect.stringContaining(IDENTITY_KEY) }),
          );
        });

        it('requeues when a declared key has neither an attribute nor a user identity', () => {
          host.getUserIdentities = () => ({ email: 'test@example.com' });

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toHaveLength(0);
          expect(state.pending).toHaveLength(1);
          expect(loggedDiagnostics).toContainEqual(
            expect.objectContaining({ code: 'PRESELECT_MISSED', message: expect.stringContaining(IDENTITY_KEY) }),
          );
        });

        it('persists the identity value in a not-ready snapshot', () => {
          host.isKitReady = () => false;

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(setPendingPreselect).toHaveBeenCalledWith(
            ACCOUNT_ID,
            PATHNAME,
            TARGET_PAGE_IDENTIFIER,
            { [ATTRIBUTE_KEY]: 'gold', [IDENTITY_KEY]: 'hashed-identity' },
            MPID,
          );
        });
      });

      describe('dispatchDelayMs', () => {
        const DELAY_MS = 5000;
        const OTHER_PATHNAME = '/not-the-preselect-path';

        beforeEach(() => {
          vi.useFakeTimers();
          mockConfig.current = [{ ...CONFIG_ENTRY, dispatchDelayMs: DELAY_MS }];
          host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
        });

        afterEach(() => {
          vi.useRealTimers();
        });

        it('dispatches synchronously when the key is absent, scheduling nothing', () => {
          mockConfig.current = [CONFIG_ENTRY];

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toHaveLength(1);
          expect(state.dispatchTimer).toBeUndefined();
          expect(vi.getTimerCount()).toBe(0);
        });

        it('holds the dispatch until the delay elapses', () => {
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toHaveLength(0);

          expectFiresAfter(DELAY_MS);
          expect(state.dispatchTimer).toBeUndefined();
        });

        it('resolves attributes when the delay elapses, not when the pageview fired', () => {
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          host.userAttributes = { [ATTRIBUTE_KEY]: 'settled-later' };
          vi.advanceTimersByTime(DELAY_MS);

          expect(selectPlacementsCalls).toEqual([
            {
              attributes: tagged({ [ATTRIBUTE_KEY]: 'settled-later' }),
              preselect: true,
              identifier: TARGET_PAGE_IDENTIFIER,
              omitUrl: true,
            },
          ]);
        });

        it('cancels a held dispatch when the shopper navigates off the configured route', () => {
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);
          expect(vi.getTimerCount()).toBe(1);

          maybeFirePreselect(state, host, buildEvent(), OTHER_PATHNAME);

          expect(state.dispatchTimer).toBeUndefined();
          expect(vi.getTimerCount()).toBe(0);

          vi.advanceTimersByTime(DELAY_MS * 2);
          expect(selectPlacementsCalls).toHaveLength(0);
        });

        it('dispatches once, not twice, across checkout then away then checkout again', () => {
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);
          maybeFirePreselect(state, host, buildEvent(), OTHER_PATHNAME);
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          vi.advanceTimersByTime(DELAY_MS);

          expect(selectPlacementsCalls).toHaveLength(1);
        });

        it('schedules an explicit zero delay instead of dispatching during the pageview', () => {
          mockConfig.current = [{ ...CONFIG_ENTRY, dispatchDelayMs: 0 }];

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);
          expect(selectPlacementsCalls).toHaveLength(0);

          vi.advanceTimersByTime(0);
          expect(selectPlacementsCalls).toHaveLength(1);
        });

        it('reads attributes from the current host when the delay elapses', () => {
          host.getCurrentHost = () => ({ ...host, userAttributes: { [ATTRIBUTE_KEY]: 'from-current-host' } });

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);
          vi.advanceTimersByTime(DELAY_MS);

          expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ [ATTRIBUTE_KEY]: 'from-current-host' }));
        });

        it('does not dispatch when preselection was disabled during the delay', () => {
          host.getCurrentHost = () => ({ ...host, isPreselectionEnabled: () => false });

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);
          vi.advanceTimersByTime(DELAY_MS);

          expect(selectPlacementsCalls).toHaveLength(0);
          expect(state.pending).toHaveLength(0);
        });

        it('requeues when the identity is no longer valid when the delay elapses', () => {
          const signedOutUser = { getUserIdentities: () => ({ userIdentities: {} }), getMPID: () => MPID };
          host.getCurrentHost = () => ({
            ...host,
            filteredUser: signedOutUser as unknown as PreselectHost['filteredUser'],
          });

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);
          vi.advanceTimersByTime(DELAY_MS);

          expect(selectPlacementsCalls).toHaveLength(0);
          expect(state.pending).toHaveLength(1);
          expect(loggedDiagnostics).toContainEqual(
            expect.objectContaining({ code: 'PRESELECT_MISSED', message: expect.stringContaining('no_valid_identity') }),
          );
        });

        it('does not dispatch when targeting was disabled during the delay', () => {
          host.getCurrentHost = () => ({ ...host, isTargetingDisabled: () => true });

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);
          vi.advanceTimersByTime(DELAY_MS);

          expect(selectPlacementsCalls).toHaveLength(0);
          expect(state.pending).toHaveLength(0);
        });

        it('drops the dispatch when a different user is signed in when the delay elapses', () => {
          const otherUser = {
            getUserIdentities: () => ({ userIdentities: { email: 'someone-else@example.com' } }),
            getMPID: () => 'a-different-mpid',
          };
          host.getCurrentHost = () => ({ ...host, filteredUser: otherUser as unknown as PreselectHost['filteredUser'] });

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);
          vi.advanceTimersByTime(DELAY_MS);

          expect(selectPlacementsCalls).toHaveLength(0);
          expect(state.pending).toHaveLength(0);
        });

        it('stops a held dispatch when it is cancelled', () => {
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          cancelScheduledDispatch(state);
          vi.advanceTimersByTime(DELAY_MS);

          expect(selectPlacementsCalls).toHaveLength(0);
          expect(state.scheduledDispatch).toBeUndefined();
        });

        it('keeps a held pageview when a pathname trigger fires for the same route', () => {
          host.userAttributes = {};

          maybeFirePreselect(state, host, buildEvent({ [ATTRIBUTE_KEY]: 'from-pageview' }), PATHNAME);
          maybeFirePreselectForPathname(state, host, PATHNAME);
          vi.advanceTimersByTime(DELAY_MS);

          expect(selectPlacementsCalls).toHaveLength(1);
          expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ [ATTRIBUTE_KEY]: 'from-pageview' }));
        });

        describe('a held dispatch requeued for identity', () => {
          const signedOutUser = { getUserIdentities: () => ({ userIdentities: {} }), getMPID: () => MPID };

          beforeEach(() => {
            host.getCurrentHost = () => ({
              ...host,
              filteredUser: signedOutUser as unknown as PreselectHost['filteredUser'],
            });
            maybeFirePreselect(state, host, buildEvent(), PATHNAME);
            vi.advanceTimersByTime(DELAY_MS);
            host.getCurrentHost = undefined;
          });

          it('replays for the same user once they are identified again', () => {
            flushPendingPreselectDispatches(state, host, PATHNAME);
            vi.advanceTimersByTime(DELAY_MS);

            expect(selectPlacementsCalls).toHaveLength(1);
          });

          it('is not replayed under a different user', () => {
            const otherUser = {
              getUserIdentities: () => ({ userIdentities: { email: 'someone-else@example.com' } }),
              getMPID: () => 'a-different-mpid',
            };
            const otherHost = { ...host, filteredUser: otherUser as unknown as PreselectHost['filteredUser'] };

            flushPendingPreselectDispatches(state, otherHost, PATHNAME);
            vi.advanceTimersByTime(DELAY_MS);

            expect(selectPlacementsCalls).toHaveLength(0);
            expect(state.pending).toHaveLength(0);
          });

          it('does not persist a snapshot under a different user when the kit is not ready', () => {
            const otherUser = {
              getUserIdentities: () => ({ userIdentities: { email: 'someone-else@example.com' } }),
              getMPID: () => 'a-different-mpid',
            };
            const notReadyOtherHost = {
              ...host,
              isKitReady: () => false,
              filteredUser: otherUser as unknown as PreselectHost['filteredUser'],
            };
            vi.mocked(setPendingPreselect).mockClear();

            flushPendingPreselectDispatches(state, notReadyOtherHost, PATHNAME);
            vi.advanceTimersByTime(DELAY_MS);

            expect(setPendingPreselect).not.toHaveBeenCalled();
            expect(selectPlacementsCalls).toHaveLength(0);
            expect(state.pending).toHaveLength(0);
          });
        });

        describe('a replay holds only for what is left since the trigger', () => {
          const anonymousUser = {
            getUserIdentities: () => ({ userIdentities: {} }),
            getMPID: () => MPID,
          } as unknown as PreselectHost['filteredUser'];
          const identifiedUser = {
            getUserIdentities: () => ({ userIdentities: { email: 'test@example.com' } }),
            getMPID: () => MPID,
          } as unknown as PreselectHost['filteredUser'];

          it('fires at the end of the original hold when identity arrives inside it', () => {
            host.filteredUser = anonymousUser;
            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            vi.advanceTimersByTime(2000);
            host.filteredUser = identifiedUser;
            flushPendingPreselectDispatches(state, host, PATHNAME);

            expectFiresAfter(DELAY_MS - 2000);
            expect(loggedDiagnostics).toContainEqual(
              expect.objectContaining({ code: 'PRESELECT_HELD', message: expect.stringContaining('[delay_ms=3000]') }),
            );
          });

          it('fires without a second hold when identity arrives after the hold would have ended', () => {
            host.filteredUser = anonymousUser;
            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            vi.advanceTimersByTime(30_000);
            host.filteredUser = identifiedUser;
            flushPendingPreselectDispatches(state, host, PATHNAME);

            vi.advanceTimersByTime(0);
            expect(selectPlacementsCalls).toHaveLength(1);
          });

          it('fires as soon as a missing attribute arrives after a hold that already ran', () => {
            host.userAttributes = {};
            maybeFirePreselect(state, host, buildEvent(), PATHNAME);
            vi.advanceTimersByTime(DELAY_MS);
            expect(state.pending).toHaveLength(1);

            vi.advanceTimersByTime(1000);
            host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
            flushPendingPreselectDispatches(state, host, PATHNAME);

            vi.advanceTimersByTime(0);
            expect(selectPlacementsCalls).toHaveLength(1);
          });

          it('keeps a later page view hold when a flush finds an older entry queued for the path', () => {
            host.userAttributes = {};
            maybeFirePreselect(state, host, buildEvent(), PATHNAME);
            vi.advanceTimersByTime(DELAY_MS);
            expect(state.pending).toHaveLength(1);

            vi.advanceTimersByTime(1000);
            host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
            maybeFirePreselect(state, host, buildEvent(), PATHNAME);
            flushPendingPreselectDispatches(state, host, PATHNAME);

            expect(state.pending).toHaveLength(0);
            expectFiresAfter(DELAY_MS);
            expect(loggedDiagnostics).not.toContainEqual(
              expect.objectContaining({ message: expect.stringContaining('[reason=hold_cancelled]') }),
            );
          });

          it('counts from the trigger when the launcher attaches during the hold', () => {
            host.isKitReady = () => false;
            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            vi.advanceTimersByTime(1000);
            host.isKitReady = () => true;
            flushPendingPreselectDispatches(state, host, PATHNAME);

            expectFiresAfter(DELAY_MS - 1000);
          });

          it('keeps the earliest trigger time when a later page view replaces the queued entry', () => {
            host.filteredUser = anonymousUser;
            maybeFirePreselect(state, host, buildEvent(), PATHNAME);
            const firstTriggeredAt = state.pending[0].triggeredAt;

            vi.advanceTimersByTime(3000);
            maybeFirePreselect(state, host, buildEvent(), PATHNAME);
            expect(state.pending).toHaveLength(1);
            expect(state.pending[0].triggeredAt).toBe(firstTriggeredAt);

            vi.advanceTimersByTime(1000);
            host.filteredUser = identifiedUser;
            flushPendingPreselectDispatches(state, host, PATHNAME);

            vi.advanceTimersByTime(DELAY_MS - 4000);
            expect(selectPlacementsCalls).toHaveLength(1);
          });

          it('holds for the full delay when a queued entry carries no trigger time', () => {
            state.pending = [{ event: buildEvent(), pathname: PATHNAME, waitingFor: 'attribute' }];

            flushPendingPreselectDispatches(state, host, PATHNAME);

            expectFiresAfter(DELAY_MS);
          });

          it('still gives a fresh page view the full hold', () => {
            vi.advanceTimersByTime(30_000);

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            expectFiresAfter(DELAY_MS);
          });

          it('never holds a replay for longer than the delay when the clock steps back', () => {
            host.filteredUser = anonymousUser;
            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            vi.setSystemTime(Date.now() - 60 * 60 * 1000);
            host.filteredUser = identifiedUser;
            flushPendingPreselectDispatches(state, host, PATHNAME);

            expect(loggedDiagnostics).toContainEqual(
              expect.objectContaining({
                code: 'PRESELECT_HELD',
                message: expect.stringContaining(`[delay_ms=${DELAY_MS}]`),
              }),
            );
            expectFiresAfter(DELAY_MS);
          });

          describe('after the shopper leaves the path with an entry queued', () => {
            const RETURN_HOLD_MS = 20_000;

            beforeEach(() => {
              mockConfig.current = [{ ...CONFIG_ENTRY, dispatchDelayMs: RETURN_HOLD_MS }];
              host.filteredUser = anonymousUser;
              maybeFirePreselect(state, host, buildEvent(), PATHNAME);
              vi.advanceTimersByTime(30_000);
              maybeFirePreselect(state, host, buildEvent(), OTHER_PATHNAME);
              vi.advanceTimersByTime(90_000);
            });

            it('holds a return visit for the full delay from its own trigger', () => {
              maybeFirePreselect(state, host, buildEvent(), PATHNAME);
              vi.advanceTimersByTime(5000);
              host.filteredUser = identifiedUser;
              flushPendingPreselectDispatches(state, host, PATHNAME);

              expectFiresAfter(RETURN_HOLD_MS - 5000);
            });

            it('keeps the return visit hold when a flush runs during it', () => {
              host.filteredUser = identifiedUser;
              maybeFirePreselect(state, host, buildEvent(), PATHNAME);
              vi.advanceTimersByTime(5000);
              flushPendingPreselectDispatches(state, host, PATHNAME);

              expectFiresAfter(RETURN_HOLD_MS - 5000);
            });
          });
        });

        it('requeues when the kit is no longer ready when the delay elapses', () => {
          host.getCurrentHost = () => ({ ...host, isKitReady: () => false });

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);
          vi.advanceTimersByTime(DELAY_MS);

          expect(selectPlacementsCalls).toHaveLength(0);
          expect(state.pending).toHaveLength(1);
        });

        it('requeues from inside the delayed dispatch when an attribute is still unresolved', () => {
          host.userAttributes = {};

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);
          vi.advanceTimersByTime(DELAY_MS);

          expect(selectPlacementsCalls).toHaveLength(0);
          expect(state.pending).toHaveLength(1);
          expect(loggedDiagnostics).toContainEqual(
            expect.objectContaining({ code: 'PRESELECT_MISSED', message: expect.stringContaining(ATTRIBUTE_KEY) }),
          );
        });
      });

        it('falls through to userAttributes when the event value is an empty string rather than treating it as present', () => {
          host.getEventAttributeValue = () => '';
          host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toEqual([
            { attributes: tagged({ [ATTRIBUTE_KEY]: 'gold' }), preselect: true, identifier: TARGET_PAGE_IDENTIFIER, omitUrl: true },
          ]);
        });

        it('fires and records a digest of the attributes, never the values', () => {
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toEqual([
            { attributes: tagged({ [ATTRIBUTE_KEY]: 'gold' }), preselect: true, identifier: TARGET_PAGE_IDENTIFIER, omitUrl: true },
          ]);
          expect(setActivePreselect).toHaveBeenCalledWith(
            FIELD_KEY,
            djb2(JSON.stringify({ [ATTRIBUTE_KEY]: 'gold' })),
            false,
          );
        });

        it('tags the dispatch with the configured route, never the live path', () => {
          mockConfig.current = [{ ...CONFIG_ENTRY, pathname: '/checkout/*/review' }];

          maybeFirePreselect(state, host, buildEvent(), '/checkout/order-81723/review');

          expect(selectPlacementsCalls[0].attributes).toEqual(
            tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'pageview', '/checkout/*/review'),
          );
        });

        it('keys the active-preselect record on the pathname without its trailing slash', () => {
          maybeFirePreselect(state, host, buildEvent(), `${PATHNAME}/`);

          expect(selectPlacementsCalls).toHaveLength(1);
          expect(buildActivePreselectFieldKey).toHaveBeenCalledWith(ACCOUNT_ID, PATHNAME);
        });

        it('skips when a fresh record has the digest of the same attributes', () => {
          vi.mocked(getActivePreselect).mockReturnValue({
            expiresAt: Date.now() + 30_000,
            attributesDigest: djb2(JSON.stringify({ [ATTRIBUTE_KEY]: 'gold' })),
          });

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toHaveLength(0);
          expect(setActivePreselect).not.toHaveBeenCalled();
          expect(loggedDiagnostics).toContainEqual(expect.objectContaining({ code: 'PRESELECT_SKIPPED' }));
        });

        it('fires again when the attributes changed, even though the record is still fresh', () => {
          vi.mocked(getActivePreselect).mockReturnValue({
            expiresAt: Date.now() + 30_000,
            attributesDigest: djb2(JSON.stringify({ [ATTRIBUTE_KEY]: 'silver' })),
          });

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toHaveLength(1);
        });

        it('fires when there is no fresh record for the same attributes', () => {
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toHaveLength(1);
        });

        it.each([
          { label: 'ready', isKitReady: true },
          { label: 'not ready', isKitReady: false },
        ])(
          'neither dispatches nor persists a replayed page view once targeting is disabled (kit $label)',
          ({ isKitReady }) => {
            state.pending = [{ event: buildEvent(), pathname: PATHNAME, waitingFor: 'attribute' }];
            host.isKitReady = () => isKitReady;
            host.isTargetingDisabled = () => true;

            flushPendingPreselectDispatches(state, host, PATHNAME);

            expect(selectPlacementsCalls).toHaveLength(0);
            expect(setActivePreselect).not.toHaveBeenCalled();
            expect(setPendingPreselect).not.toHaveBeenCalled();
          },
        );

        const circularValue: Record<string, unknown> = {};
        circularValue.self = circularValue;

        it.each([
          { label: 'a BigInt', value: BigInt(10) },
          { label: 'a circular value', value: circularValue },
        ])('dispatches without dedupe, rather than throwing into the caller, for $label', ({ value }) => {
          host.getEventAttributeValue = () => null;
          host.userAttributes = { [ATTRIBUTE_KEY]: value };

          expect(() => maybeFirePreselect(state, host, buildEvent(), PATHNAME)).not.toThrow();

          expect(selectPlacementsCalls).toHaveLength(1);
          expect(getActivePreselect).not.toHaveBeenCalled();
          expect(setActivePreselect).not.toHaveBeenCalled();
        });
      });
    });

    describe('preselection disabled', () => {
      it('does not fire despite a matching config, a ready kit, and a valid identity', () => {
        host.isPreselectionEnabled = () => false;

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
        expect(loggedDiagnostics).toHaveLength(0);
      });

      it('reports nothing for a not-ready pageview that turns out to be outside the rollout', () => {
        host.isKitReady = () => false;
        host.isPreselectionEnabled = () => false;

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        expect(loggedDiagnostics).toHaveLength(0);

        host.isKitReady = () => true;
        flushPendingPreselectDispatches(state, host, PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
        expect(loggedDiagnostics).toHaveLength(0);
        expect(state.pending).toHaveLength(0);
      });

      it('fires without reporting a queued diagnostic once the gate answers yes', () => {
        host.isKitReady = () => false;

        maybeFirePreselect(state, host, buildEvent({ [ATTRIBUTE_KEY]: 'gold' }), PATHNAME);
        expect(loggedDiagnostics).toHaveLength(0);

        host.isKitReady = () => true;
        flushPendingPreselectDispatches(state, host, PATHNAME);

        expect(loggedDiagnostics).not.toContainEqual(expect.objectContaining({ code: 'PRESELECT_QUEUED' }));
        expect(loggedDiagnostics).toContainEqual(expect.objectContaining({ code: 'PRESELECT_FIRED' }));
        expect(selectPlacementsCalls).toHaveLength(1);
      });

      it('requeues, reporting nothing, when a flush arrives while the launcher is still attaching', () => {
        host.isKitReady = () => false;

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        const enqueued = state.pending[0];
        flushPendingPreselectDispatches(state, host, PATHNAME);

        expect(loggedDiagnostics).toHaveLength(0);
        expect(state.pending).toHaveLength(1);
        expect(state.pending[0]).not.toBe(enqueued);
        expect(state.pending[0].storedDiagnostics).toEqual([]);
      });
    });
  });

  describe('under do-not-share-or-sell or Global Privacy Control', () => {
    beforeEach(() => {
      mockConfig.current = [CONFIG_ENTRY];
      host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
      host.isPreselectionPrivacyAllowed = () => false;
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('fires no page view, records nothing and queues nothing', () => {
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(setActivePreselect).not.toHaveBeenCalled();
      expect(recordPreselectTrigger).not.toHaveBeenCalled();
      expect(state.pending).toHaveLength(0);
      expect(state.scheduledDispatch).toBeUndefined();
    });

    it('fires no page view after its dispatch delay', () => {
      vi.useFakeTimers();
      mockConfig.current = [{ ...CONFIG_ENTRY, dispatchDelayMs: 5000 }];

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      vi.advanceTimersByTime(60000);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(state.scheduledDispatch).toBeUndefined();
    });

    it('fires no pathname trigger', () => {
      maybeFirePreselectForPathname(state, host, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it('fires no configured event', () => {
      mockConfig.current = [{ ...CONFIG_ENTRY, triggerEventNames: ['Ready to Checkout'] }];
      const triggerEvent = {
        EventName: 'Ready to Checkout',
        EventDataType: 4,
        EventAttributes: { [ATTRIBUTE_KEY]: 'from-event' },
      } as SDKEvent;

      maybeFirePreselectForEvent(state, host, triggerEvent, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(setActivePreselect).not.toHaveBeenCalled();
    });

    it.each([
      { label: 'ready', isKitReady: true },
      { label: 'not ready', isKitReady: false },
    ])('neither dispatches nor persists a replayed page view (kit $label)', ({ isKitReady }) => {
      state.pending = [{ event: buildEvent(), pathname: PATHNAME, waitingFor: 'attribute' }];
      host.isKitReady = () => isKitReady;

      flushPendingPreselectDispatches(state, host, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(setActivePreselect).not.toHaveBeenCalled();
      expect(setPendingPreselect).not.toHaveBeenCalled();
    });

    it('drops a saved attempt on the recovering page', () => {
      vi.mocked(getPendingPreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        pathname: PATHNAME,
        identifier: TARGET_PAGE_IDENTIFIER,
        attributes: { [ATTRIBUTE_KEY]: 'gold' },
        mpid: MPID,
      });

      maybeFirePersistedPreselect(state, host);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(setActivePreselect).not.toHaveBeenCalled();
      expect(clearPendingPreselect).toHaveBeenCalledWith(ACCOUNT_ID);
    });

    it('still fires a page view once both are lifted', () => {
      host.isPreselectionPrivacyAllowed = () => true;

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(1);
    });
  });

  describe('diagnostic detail', () => {
    const OTHER_MPID = 'mpid-2';
    const DELAY_MS = 5000;
    const OTHER_PATHNAME = '/not-the-preselect-path';

    const buildUser = (mpid: string | null, userIdentities: Record<string, string> = {}) =>
      ({
        getUserIdentities: () => ({ userIdentities }),
        getMPID: () => mpid,
      }) as unknown as PreselectHost['filteredUser'];

    const messagesWithCode = (code: string): string[] =>
      loggedDiagnostics.filter((entry) => entry.code === code).map((entry) => entry.message);

    beforeEach(() => {
      mockConfig.current = [CONFIG_ENTRY];
      host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
    });

    describe('no_valid_identity', () => {
      it('keeps the reason token ahead of the detail so existing queries still match', () => {
        host.filteredUser = buildUser(MPID);
        host.getCurrentUser = () => buildUser(MPID);

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(messagesWithCode('PRESELECT_MISSED')).toEqual([
          'Rokt Kit: preselect missed [reason=no_valid_identity] [identity_reason=no_identities]' +
            ' [kit_identity_types=none] [current_identity_types=none] [mpid_match=true] [identity_attribute_present=false]',
        ]);
      });

      it.each([
        {
          label: 'the current user has a single identity type that the kit user lacks',
          filteredUser: buildUser(MPID),
          getCurrentUser: () => buildUser(MPID, { email: 'shopper@example.com' }),
          fragments: [
            '[identity_reason=kit_user_lacks_identities]',
            '[current_identity_types=email] [mpid_match=true]',
          ],
        },
        {
          label: 'the kit has no filtered user at all',
          filteredUser: null,
          getCurrentUser: () => buildUser(MPID, { email: 'shopper@example.com' }),
          fragments: ['[identity_reason=no_filtered_user]'],
        },
        {
          label: 'the kit user is bound to a different MPID than the current user',
          filteredUser: buildUser(MPID),
          getCurrentUser: () => buildUser(OTHER_MPID, { email: 'shopper@example.com' }),
          fragments: [
            '[identity_reason=mpid_mismatch]',
            '[kit_identity_types=none] [current_identity_types=email] [mpid_match=false]',
          ],
        },
        {
          label: 'the current user has identities that the kit user lacks',
          filteredUser: buildUser(MPID),
          getCurrentUser: () => buildUser(MPID, { email: 'shopper@example.com', customerid: 'c-1' }),
          fragments: [
            '[identity_reason=kit_user_lacks_identities]',
            '[current_identity_types=customerid,email] [mpid_match=true]',
          ],
        },
        {
          label: 'the current user cannot be read',
          filteredUser: buildUser(MPID),
          getCurrentUser: undefined,
          fragments: ['[identity_reason=no_identities]', '[mpid_match=unknown]'],
        },
      ])('reports the identity detail when $label', ({ filteredUser, getCurrentUser, fragments }) => {
        host.filteredUser = filteredUser;
        host.getCurrentUser = getCurrentUser;

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        const [message] = messagesWithCode('PRESELECT_MISSED');
        fragments.forEach((fragment) => expect(message).toContain(fragment));
      });

      it('never puts an identity value in the line', () => {
        host.filteredUser = buildUser(MPID);
        host.getCurrentUser = () => buildUser(OTHER_MPID, { email: 'shopper@example.com', customerid: 'c-1' });

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        const [message] = messagesWithCode('PRESELECT_MISSED');
        expect(message).not.toContain('shopper@example.com');
        expect(message).not.toContain('c-1');
        expect(message).not.toContain(OTHER_MPID);
      });

      describe('identity attribute presence', () => {
        beforeEach(() => {
          host.filteredUser = buildUser(MPID);
          host.getCurrentUser = () => buildUser(MPID);
          mockConfig.current = [{ ...CONFIG_ENTRY, attributeKeys: [ATTRIBUTE_KEY, 'configuredIdentity'], identityKeys: ['configuredIdentity'] }];
        });

        it.each(['configuredIdentity', 'CONFIGUREDIDENTITY', 'Email', 'EMAIL', 'emailsha256', 'EmailSha256', 'mappedHash', 'MAPPEDHASH'])(
          'reports presence for %s in either attribute store without exposing the key or value', (key) => {
            host.mappedEmailSha256Key = 'mappedHash';
            for (const source of ['kit', 'live']) {
              loggedDiagnostics.length = 0;
              state = createPreselectState();
              host.userAttributes = source === 'kit' ? { [key]: 'private-identity-value' } : {};
              host.getCurrentUser = () => ({ ...buildUser(MPID), getAllUserAttributes: () =>
                source === 'live' ? { [key]: 'private-identity-value' } : {},
              }) as PreselectHost['filteredUser'];

              maybeFirePreselect(state, host, buildEvent(), PATHNAME);

              const [message] = messagesWithCode('PRESELECT_MISSED');
              expect(message).toContain('[identity_attribute_present=true]');
              expect(message).not.toContain(key);
              expect(message).not.toContain('private-identity-value');
              expect(selectPlacementsCalls).toEqual([]);
            }
          },
        );

        it('counts a non-empty case variant even when the exact-case attribute is empty', () => {
          host.userAttributes = { email: '', Email: 'private-identity-value' };

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(messagesWithCode('PRESELECT_MISSED')[0]).toContain('[identity_attribute_present=true]');
        });

        it('still rejects mixed-case inherited and non-string attributes', () => {
          host.userAttributes = Object.assign(Object.create({ Email: 'private-identity-value' }), { EMAILSHA256: 1 });
          host.getCurrentUser = () => ({
            ...buildUser(MPID),
            getAllUserAttributes: () => Object.assign(Object.create({ MAPPEDHASH: 'private-identity-value' }), { CONFIGUREDIDENTITY: '' }),
          }) as PreselectHost['filteredUser'];
          host.mappedEmailSha256Key = 'mappedHash';

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(messagesWithCode('PRESELECT_MISSED')[0]).toContain('[identity_attribute_present=false]');
        });

        it.each([undefined, null, '', 1, true, [], {}])('reports false for absent or non-string values %j', (value) => {
          host.userAttributes = { email: value, configuredIdentity: value };
          host.getCurrentUser = () => ({ ...buildUser(MPID), getAllUserAttributes: () => ({ emailsha256: value }) }) as PreselectHost['filteredUser'];

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(messagesWithCode('PRESELECT_MISSED')[0]).toContain('[identity_attribute_present=false]');
        });

        it('does not count unrelated attributes, event attributes, or inherited values', () => {
          host.userAttributes = Object.create({ email: 'private-identity-value' });
          host.getCurrentUser = () => ({ ...buildUser(MPID), getAllUserAttributes: () => ({ unrelated: 'private-identity-value' }) }) as PreselectHost['filteredUser'];

          maybeFirePreselect(state, host, buildEvent({ email: 'private-identity-value' }), PATHNAME);

          expect(messagesWithCode('PRESELECT_MISSED')[0]).toContain('[identity_attribute_present=false]');
        });

        it('checks the live store even when the kit carries an empty value for the same key', () => {
          host.userAttributes = { email: '' };
          host.getCurrentUser = () => ({ ...buildUser(MPID), getAllUserAttributes: () => ({ email: 'private-identity-value' }) }) as PreselectHost['filteredUser'];

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(messagesWithCode('PRESELECT_MISSED')[0]).toContain('[identity_attribute_present=true]');
        });

        it.each([true, false])('reads current attributes when identity disappears during a hold: %s', (present) => {
          vi.useFakeTimers();
          try {
            mockConfig.current = [{ ...CONFIG_ENTRY, dispatchDelayMs: DELAY_MS }];
            host.filteredUser = buildUser(MPID, { email: 'test@example.com' });
            host.getCurrentHost = () => ({ ...host,
              filteredUser: buildUser(MPID),
              userAttributes: {},
              getCurrentUser: () => ({ ...buildUser(MPID), getAllUserAttributes: () =>
                present ? { emailsha256: 'private-identity-value' } : {},
              }) as PreselectHost['filteredUser'],
            });

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);
            vi.advanceTimersByTime(DELAY_MS);

            const [message] = messagesWithCode('PRESELECT_MISSED');
            expect(message).toContain(`[identity_attribute_present=${present}]`);
            expect(message).not.toContain('emailsha256');
            expect(message).not.toContain('private-identity-value');
          } finally {
            vi.useRealTimers();
          }
        });
      });

      it('carries the reason when the identity is gone at the end of a hold', () => {
        vi.useFakeTimers();
        mockConfig.current = [{ ...CONFIG_ENTRY, dispatchDelayMs: DELAY_MS }];
        host.getCurrentHost = () => ({
          ...host,
          filteredUser: buildUser(MPID),
          getCurrentUser: () => buildUser(OTHER_MPID, { email: 'shopper@example.com' }),
        });

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        vi.advanceTimersByTime(DELAY_MS);
        vi.useRealTimers();

        expect(messagesWithCode('PRESELECT_MISSED')[0]).toContain(
          '[reason=no_valid_identity] [identity_reason=mpid_mismatch]',
        );
      });
    });

    describe('identity types on fired and missing-attribute lines', () => {
      it('names the identity types on the fired line', () => {
        host.filteredUser = buildUser(MPID, { email: 'shopper@example.com', customerid: 'c-1' });

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(messagesWithCode('PRESELECT_FIRED')).toEqual([
          'Rokt Kit: preselect fired [reason=fired] [identity_types=customerid,email]',
        ]);
      });

      it('names the identity types on a missing-attribute line and says the key is not an identity', () => {
        host.userAttributes = {};

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(messagesWithCode('PRESELECT_MISSED')).toEqual([
          `Rokt Kit: preselect missed [reason=missing_attribute:${ATTRIBUTE_KEY}] [identity_types=email] [key_is_identity=false]`,
        ]);
      });

      it('says when a missing attribute key is held as a user identity instead', () => {
        mockConfig.current = [{ ...CONFIG_ENTRY, attributeKeys: ['Email'] }];
        host.userAttributes = {};

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(messagesWithCode('PRESELECT_MISSED')[0]).toContain('[key_is_identity=true]');
      });

      it('leaves an identity with an empty value out of the gate and the type names', () => {
        host.filteredUser = buildUser(MPID, { email: '', customerid: 'c-1' });

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(messagesWithCode('PRESELECT_FIRED')).toEqual([
          'Rokt Kit: preselect fired [reason=fired] [identity_types=customerid]',
        ]);
      });
    });

    describe('dispatch hold', () => {
      beforeEach(() => {
        vi.useFakeTimers();
        mockConfig.current = [{ ...CONFIG_ENTRY, dispatchDelayMs: DELAY_MS }];
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('logs a held line when the hold starts, before anything fires', () => {
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(messagesWithCode('PRESELECT_HELD')).toEqual([
          `Rokt Kit: preselect held [reason=dispatch_delay] [delay_ms=${DELAY_MS}]`,
        ]);
        expect(messagesWithCode('PRESELECT_FIRED')).toHaveLength(0);
      });

      it('logs no held line when the entry has no hold', () => {
        mockConfig.current = [CONFIG_ENTRY];

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(messagesWithCode('PRESELECT_HELD')).toHaveLength(0);
      });

      it('logs hold_cancelled with the held time when a page view on another path cancels the hold', () => {
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        vi.advanceTimersByTime(1200);

        maybeFirePreselect(state, host, buildEvent(), OTHER_PATHNAME);

        expect(messagesWithCode('PRESELECT_MISSED')).toEqual([
          'Rokt Kit: preselect missed [reason=hold_cancelled] [held_ms=1200] [same_path=false]',
        ]);
      });

      it('marks a hold restarted by a repeat page view on the same path', () => {
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        vi.advanceTimersByTime(300);

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(messagesWithCode('PRESELECT_MISSED')).toEqual([
          'Rokt Kit: preselect missed [reason=hold_cancelled] [held_ms=300] [same_path=true]',
        ]);
        expect(messagesWithCode('PRESELECT_HELD')).toHaveLength(2);
      });

      it('logs one held line and no hold_cancelled when a route change runs the pathname trigger before its page view', () => {
        maybeFirePreselectForPathname(state, host, PATHNAME);
        maybeFirePreselect(state, host, buildEvent({ [ATTRIBUTE_KEY]: 'from-pageview' }), PATHNAME);

        expect(messagesWithCode('PRESELECT_HELD')).toEqual([
          `Rokt Kit: preselect held [reason=dispatch_delay] [delay_ms=${DELAY_MS}]`,
        ]);
        expect(messagesWithCode('PRESELECT_MISSED')).toHaveLength(0);

        vi.advanceTimersByTime(DELAY_MS);

        expect(messagesWithCode('PRESELECT_FIRED')).toHaveLength(1);
        expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ [ATTRIBUTE_KEY]: 'from-pageview' }));
      });

      it('still logs hold_cancelled when a route change to another held path cancels a pathname trigger hold', () => {
        mockConfig.current = [
          { ...CONFIG_ENTRY, dispatchDelayMs: DELAY_MS },
          {
            ...CONFIG_ENTRY,
            pathname: OTHER_PATHNAME,
            targetPageIdentifier: 'other-target',
            dispatchDelayMs: DELAY_MS,
          },
        ];
        maybeFirePreselectForPathname(state, host, PATHNAME);
        vi.advanceTimersByTime(700);

        maybeFirePreselectForPathname(state, host, OTHER_PATHNAME);

        expect(messagesWithCode('PRESELECT_MISSED')).toEqual([
          'Rokt Kit: preselect missed [reason=hold_cancelled] [held_ms=700] [same_path=false]',
        ]);
        expect(messagesWithCode('PRESELECT_HELD')).toHaveLength(2);
      });

      it('still logs hold_cancelled when a same-path call cancels a pathname trigger hold without holding again', () => {
        maybeFirePreselectForPathname(state, host, PATHNAME);
        vi.advanceTimersByTime(400);
        host.filteredUser = buildUser(MPID);

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(messagesWithCode('PRESELECT_MISSED')).toContain(
          'Rokt Kit: preselect missed [reason=hold_cancelled] [held_ms=400] [same_path=true]',
        );
        expect(messagesWithCode('PRESELECT_HELD')).toHaveLength(1);
        expect(state.scheduledDispatch).toBeUndefined();
      });

      it('logs no hold_cancelled line once the hold has already elapsed', () => {
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        vi.advanceTimersByTime(DELAY_MS);

        maybeFirePreselect(state, host, buildEvent(), OTHER_PATHNAME);

        expect(messagesWithCode('PRESELECT_FIRED')).toHaveLength(1);
        expect(messagesWithCode('PRESELECT_MISSED')).toHaveLength(0);
      });

      describe('releaseHoldOnRouteChange', () => {
        beforeEach(() => {
          mockConfig.current = [{ ...CONFIG_ENTRY, dispatchDelayMs: DELAY_MS, releaseHoldOnRouteChange: true }];
        });

        it('fires once on another route with the release reason and clears the timer', () => {
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);
          vi.advanceTimersByTime(1200);
          host.getCurrentHost = () => ({ ...host, userAttributes: { [ATTRIBUTE_KEY]: 'updated' } });

          maybeFirePreselect(state, host, buildEvent(), OTHER_PATHNAME);
          vi.advanceTimersByTime(DELAY_MS);

          expect(selectPlacementsCalls).toHaveLength(1);
          expect(selectPlacementsCalls[0].attributes).toEqual({
            [ATTRIBUTE_KEY]: 'updated',
            [PRESELECT_TRIGGER_ATTRIBUTE]: `pageview|${PATHNAME}`,
          });
          expect(messagesWithCode('PRESELECT_FIRED')).toEqual([
            'Rokt Kit: preselect fired [reason=hold_released_on_route_change] [identity_types=email]',
          ]);
          expect(messagesWithCode('PRESELECT_MISSED')).toEqual([]);
          expect(state.scheduledDispatch).toBeUndefined();
          expect(state.dispatchTimer).toBeUndefined();
        });

        it.each([
          [PATHNAME, `${PATHNAME}/`],
          [`${PATHNAME}/`, PATHNAME],
        ])('re-holds instead of releasing when only the trailing slash changes from %s to %s', (from, to) => {
          maybeFirePreselect(state, host, buildEvent(), from);
          vi.advanceTimersByTime(1200);
          host.userAttributes = { [ATTRIBUTE_KEY]: 'during-route-change' };

          maybeFirePreselect(state, host, buildEvent(), to);

          expect(selectPlacementsCalls).toEqual([]);
          expect(messagesWithCode('PRESELECT_FIRED')).toEqual([]);
          expect(state.scheduledDispatch?.pathname).toBe(to);

          host.userAttributes = { [ATTRIBUTE_KEY]: 'after-settling' };
          expectFiresAfter(DELAY_MS);
          expect(selectPlacementsCalls[0].attributes).toEqual({
            [ATTRIBUTE_KEY]: 'after-settling',
            [PRESELECT_TRIGGER_ATTRIBUTE]: `pageview|${PATHNAME}`,
          });
          expect(messagesWithCode('PRESELECT_FIRED')).toEqual([
            'Rokt Kit: preselect fired [reason=fired] [identity_types=email]',
          ]);
          vi.advanceTimersByTime(DELAY_MS);
          expect(selectPlacementsCalls).toHaveLength(1);
        });

        it('keeps hold_cancelled when the flag is false', () => {
          mockConfig.current[0].releaseHoldOnRouteChange = false;
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);
          vi.advanceTimersByTime(1200);
          maybeFirePreselect(state, host, buildEvent(), OTHER_PATHNAME);
          vi.advanceTimersByTime(DELAY_MS);

          expect(selectPlacementsCalls).toEqual([]);
          expect(messagesWithCode('PRESELECT_MISSED')).toEqual([
            'Rokt Kit: preselect missed [reason=hold_cancelled] [held_ms=1200] [same_path=false]',
          ]);
        });

        it('does not release a same-path page view or pathname hold swap', () => {
          maybeFirePreselectForPathname(state, host, PATHNAME);
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toEqual([]);
          expect(messagesWithCode('PRESELECT_FIRED')).toEqual([]);
          expect(messagesWithCode('PRESELECT_MISSED')).toEqual([
            'Rokt Kit: preselect missed [reason=hold_cancelled] [held_ms=0] [same_path=true]',
          ]);
          vi.advanceTimersByTime(DELAY_MS);
          expect(messagesWithCode('PRESELECT_FIRED')).toEqual([
            'Rokt Kit: preselect fired [reason=fired] [identity_types=email]',
          ]);
        });

        it.each(['changed user', 'noTargeting', 'disabled', 'not ready', 'missing identity', 'missing attribute', 'missing config'])(
          'rechecks the %s gate before releasing', (gate) => {
            maybeFirePreselect(state, host, buildEvent(), PATHNAME);
            const currentHost = { ...host };
            if (gate === 'changed user') currentHost.filteredUser = buildUser(OTHER_MPID, { email: 'test@example.com' });
            if (gate === 'noTargeting') currentHost.isTargetingDisabled = () => true;
            if (gate === 'disabled') currentHost.isPreselectionEnabled = () => false;
            if (gate === 'not ready') currentHost.isKitReady = () => false;
            if (gate === 'missing identity') currentHost.filteredUser = buildUser(MPID);
            if (gate === 'missing attribute') currentHost.userAttributes = {};
            if (gate === 'missing config') mockConfig.current = [];
            host.getCurrentHost = () => currentHost;

            maybeFirePreselect(state, host, buildEvent(), OTHER_PATHNAME);
            vi.advanceTimersByTime(DELAY_MS);

            expect(selectPlacementsCalls).toEqual([]);
            expect(messagesWithCode('PRESELECT_FIRED')).toEqual([]);
            expect(state.pending).toEqual([]);
          },
        );

        it('gives a return visit its own attributes and full hold after a release cannot resolve', () => {
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);
          vi.advanceTimersByTime(1200);
          host.userAttributes = {};
          maybeFirePreselect(state, host, buildEvent(), OTHER_PATHNAME);
          expect(state.pending).toEqual([]);

          host.userAttributes = { [ATTRIBUTE_KEY]: 'from-return-visit' };
          maybeFirePreselectForPathname(state, host, PATHNAME);
          flushPendingPreselectDispatches(state, host, PATHNAME);
          expectFiresAfter(DELAY_MS);
          expect(selectPlacementsCalls[0].attributes).toEqual({
            [ATTRIBUTE_KEY]: 'from-return-visit',
            [PRESELECT_TRIGGER_ATTRIBUTE]: `pathname|${PATHNAME}`,
          });
        });

        it('keeps pending work for the new route when a release cannot resolve', () => {
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);
          const currentRoutePending = {
            event: buildEvent(),
            pathname: OTHER_PATHNAME,
            waitingFor: 'attribute' as const,
          };
          state.pending.push(currentRoutePending);
          host.userAttributes = {};

          maybeFirePreselect(state, host, buildEvent(), OTHER_PATHNAME);

          expect(selectPlacementsCalls).toEqual([]);
          expect(state.pending).toEqual([currentRoutePending]);
        });

        it('skips a second release with the same attributes inside the active period', () => {
          vi.mocked(setActivePreselect).mockImplementation((_key, digest) => {
            vi.mocked(getActivePreselect).mockReturnValue({ attributesDigest: digest, expiresAt: Date.now() + 60000 });
          });
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);
          maybeFirePreselect(state, host, buildEvent(), OTHER_PATHNAME);
          vi.advanceTimersByTime(1000);
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);
          maybeFirePreselect(state, host, buildEvent(), OTHER_PATHNAME);

          expect(selectPlacementsCalls).toHaveLength(1);
          expect(messagesWithCode('PRESELECT_SKIPPED')).toEqual([
            'Rokt Kit: preselect skipped [reason=active_preselection]',
          ]);
        });
      });

      it('returns the cancelled hold, and nothing when no hold is pending', () => {
        expect(cancelScheduledDispatch(state)).toBeUndefined();

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(cancelScheduledDispatch(state)).toEqual({
          event: expect.anything(),
          pathname: PATHNAME,
          heldAt: expect.any(Number),
          heldForUserId: MPID,
          triggeredAt: expect.any(Number),
        });
      });
    });
  });

  describe('arrival telemetry', () => {
    const OTHER_PATHNAME = '/not-the-preselect-path';
    const anonymousUser = {
      getUserIdentities: () => ({ userIdentities: {} }),
      getMPID: () => MPID,
    } as unknown as PreselectHost['filteredUser'];
    const identifiedUser = {
      getUserIdentities: () => ({ userIdentities: { email: 'test@example.com' } }),
      getMPID: () => MPID,
    } as unknown as PreselectHost['filteredUser'];

    const messagesWithCode = (code: string): string[] =>
      loggedDiagnostics.filter((entry) => entry.code === code).map((entry) => entry.message);

    beforeEach(() => {
      vi.useFakeTimers();
      mockConfig.current = [CONFIG_ENTRY];
      host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe('identity arriving for a waiting entry', () => {
      beforeEach(() => {
        host.filteredUser = anonymousUser;
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        vi.advanceTimersByTime(2000);
        loggedDiagnostics.length = 0;
      });

      it('logs the time since the trigger while the shopper is still on the trigger path', () => {
        host.filteredUser = identifiedUser;

        flushPendingPreselectDispatches(state, host, PATHNAME);

        expect(messagesWithCode('PRESELECT_IDENTITY_ARRIVED')).toEqual([
          'Rokt Kit: preselect identity_arrived [reason=pending_identity] [since_trigger_ms=2000] [on_trigger_path=true]',
        ]);
        expect(selectPlacementsCalls).toHaveLength(1);
      });

      it('says when the shopper had already left the trigger path, and reports the drop', () => {
        host.filteredUser = identifiedUser;

        flushPendingPreselectDispatches(state, host, OTHER_PATHNAME);

        expect(messagesWithCode('PRESELECT_IDENTITY_ARRIVED')[0]).toContain('[on_trigger_path=false]');
        expect(messagesWithCode('PRESELECT_MISSED')).toEqual([
          'Rokt Kit: preselect missed [reason=left_trigger_path] [waiting_for=identity] [has_identity=true] [since_trigger_ms=2000]',
        ]);
        expect(selectPlacementsCalls).toHaveLength(0);
      });

      it('logs no arrival for an entry waiting on an attribute rather than identity', () => {
        state.pending = [];
        host.filteredUser = identifiedUser;
        host.userAttributes = {};
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        loggedDiagnostics.length = 0;

        flushPendingPreselectDispatches(state, host, PATHNAME);

        expect(messagesWithCode('PRESELECT_IDENTITY_ARRIVED')).toHaveLength(0);
      });

      it('logs no arrival while the shopper is still anonymous', () => {
        flushPendingPreselectDispatches(state, host, PATHNAME);

        expect(messagesWithCode('PRESELECT_IDENTITY_ARRIVED')).toHaveLength(0);
      });

      it('logs nothing for a session outside the rollout', () => {
        host.filteredUser = identifiedUser;
        host.isPreselectionEnabled = () => false;

        flushPendingPreselectDispatches(state, host, OTHER_PATHNAME);

        expect(loggedDiagnostics).toHaveLength(0);
        expect(state.pending).toHaveLength(0);
      });

      it('logs nothing once targeting is disabled', () => {
        host.filteredUser = identifiedUser;
        host.isTargetingDisabled = () => true;

        flushPendingPreselectDispatches(state, host, OTHER_PATHNAME);

        expect(loggedDiagnostics).toHaveLength(0);
        expect(state.pending).toHaveLength(0);
      });
    });

    describe('an entry dropped because the shopper left the trigger path', () => {
      it('says the entry was waiting for an attribute', () => {
        host.userAttributes = {};
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        loggedDiagnostics.length = 0;

        flushPendingPreselectDispatches(state, host, OTHER_PATHNAME);

        expect(messagesWithCode('PRESELECT_MISSED')).toEqual([
          'Rokt Kit: preselect missed [reason=left_trigger_path] [waiting_for=attribute] [has_identity=true] [since_trigger_ms=0]',
        ]);
        expect(state.pending).toHaveLength(0);
      });

      it('reports the drop when the shopper triggers on another path before any flush', () => {
        host.userAttributes = {};
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        vi.advanceTimersByTime(1500);
        loggedDiagnostics.length = 0;

        maybeFirePreselect(state, host, buildEvent(), OTHER_PATHNAME);

        expect(messagesWithCode('PRESELECT_MISSED')).toEqual([
          'Rokt Kit: preselect missed [reason=left_trigger_path] [waiting_for=attribute] [has_identity=true] [since_trigger_ms=1500]',
        ]);
        expect(state.pending).toHaveLength(0);
      });

      it('reports no drop once targeting is disabled', () => {
        host.userAttributes = {};
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        loggedDiagnostics.length = 0;
        host.isTargetingDisabled = () => true;

        maybeFirePreselect(state, host, buildEvent(), OTHER_PATHNAME);

        expect(loggedDiagnostics).toHaveLength(0);
        expect(state.pending).toHaveLength(0);
      });

      it('says the entry was waiting for the launcher', () => {
        host.isKitReady = () => false;
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        host.isKitReady = () => true;

        flushPendingPreselectDispatches(state, host, OTHER_PATHNAME);

        expect(messagesWithCode('PRESELECT_MISSED')[0]).toContain('[waiting_for=launcher]');
      });

      it('still drops the entry silently while the launcher has not attached', () => {
        host.isKitReady = () => false;
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        flushPendingPreselectDispatches(state, host, OTHER_PATHNAME);

        expect(loggedDiagnostics).toHaveLength(0);
        expect(state.pending).toHaveLength(0);
      });
    });

    describe('trigger and fire markers', () => {
      it('records the trigger with whether an identity was seen on the trigger path', () => {
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(recordPreselectTrigger).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER, true);
        expect(recordPreselectFired).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER, expect.any(Number), false);
      });

      it('records an anonymous trigger without marking a fire', () => {
        host.filteredUser = anonymousUser;

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(recordPreselectTrigger).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER, false);
        expect(recordPreselectFired).not.toHaveBeenCalled();
      });

      it('records nothing before the launcher can say the session is in the rollout', () => {
        host.isKitReady = () => false;

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(recordPreselectTrigger).not.toHaveBeenCalled();
      });

      it('records nothing for a session outside the rollout', () => {
        host.isPreselectionEnabled = () => false;

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(recordPreselectTrigger).not.toHaveBeenCalled();
      });

      describe('near-miss marker', () => {
        it.each([
          ['differs only in casing', '/Preselect-Test-Path'],
          ['sits behind a locale segment', '/en/preselect-test-path'],
          ['continues past the trigger path', '/preselect-test-path/payment'],
        ])('records a page whose path %s, without firing', (_label, pathname) => {
          maybeFirePreselect(state, host, buildEvent(), pathname);

          expect(recordPreselectNearMiss).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER);
          expect(recordPreselectTrigger).not.toHaveBeenCalled();
          expect(selectPlacementsCalls).toHaveLength(0);
        });

        it('records nothing for an unrelated path or the trigger path itself', () => {
          maybeFirePreselect(state, host, buildEvent(), OTHER_PATHNAME);
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(recordPreselectNearMiss).not.toHaveBeenCalled();
        });

        it('records nothing while targeting is disabled', () => {
          host.isTargetingDisabled = () => true;

          maybeFirePreselect(state, host, buildEvent(), '/en/preselect-test-path');

          expect(recordPreselectNearMiss).not.toHaveBeenCalled();
        });

        it('records nothing for a session outside the rollout', () => {
          host.isPreselectionEnabled = () => false;

          maybeFirePreselect(state, host, buildEvent(), '/en/preselect-test-path');

          expect(recordPreselectNearMiss).not.toHaveBeenCalled();
        });

        it('records before the launcher can say whether the session is in the rollout', () => {
          host.isKitReady = () => false;
          host.isPreselectionEnabled = () => false;

          maybeFirePreselect(state, host, buildEvent(), '/en/preselect-test-path');

          expect(recordPreselectNearMiss).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER);
        });
      });

      it('does not mark a fire when the active-preselection dedupe skips it', () => {
        vi.mocked(getActivePreselect).mockReturnValue({
          expiresAt: Date.now() + 30_000,
          attributesDigest: djb2(JSON.stringify({ [ATTRIBUTE_KEY]: 'gold' })),
        });

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(recordPreselectFired).not.toHaveBeenCalled();
      });
    });

    describe('reportPreselectArrival', () => {
      it('logs an arrival that this tab never fired for', () => {
        vi.mocked(markPreselectArrival).mockReturnValue({ triggeredAt: Date.now() - 4000, identitySeenAt: Date.now() });
        vi.mocked(wasPreselectTriggeredInAnyTab).mockReturnValue(true);

        reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER);

        expect(markPreselectArrival).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER);
        expect(messagesWithCode('PRESELECT_MISSED')).toEqual([
          'Rokt Kit: preselect missed [reason=arrival_without_fire] [trigger_seen=true]' +
            ' [identity_seen_on_trigger_path=true] [has_identity=true] [trigger_seen_any_tab=true]' +
            ' [since_trigger_ms=4000] [near_miss_seen=false] [storage=device] [referrer=none]',
        ]);
      });

      it("counts this tab's trigger as any tab's when the device marker is gone", () => {
        vi.mocked(markPreselectArrival).mockReturnValue({ triggeredAt: Date.now() - 4000 });
        vi.mocked(wasPreselectTriggeredInAnyTab).mockReturnValue(false);

        reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER);

        expect(messagesWithCode('PRESELECT_MISSED')).toEqual([expect.stringContaining('[trigger_seen=true]')]);
        expect(messagesWithCode('PRESELECT_MISSED')[0]).toContain('[trigger_seen_any_tab=true]');
      });

      it('says when this tab never saw the trigger at all', () => {
        vi.mocked(markPreselectArrival).mockReturnValue({});
        host.filteredUser = anonymousUser;

        reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER);

        expect(messagesWithCode('PRESELECT_MISSED')).toEqual([
          'Rokt Kit: preselect missed [reason=arrival_without_fire] [trigger_seen=false]' +
            ' [identity_seen_on_trigger_path=false] [has_identity=false] [trigger_seen_any_tab=false]' +
            ' [near_miss_seen=false] [storage=device] [referrer=none]',
        ]);
      });

      it('says when another tab on the device saw the trigger', () => {
        vi.mocked(markPreselectArrival).mockReturnValue({});
        vi.mocked(wasPreselectTriggeredInAnyTab).mockReturnValue(true);

        reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER);

        expect(wasPreselectTriggeredInAnyTab).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER);
        expect(messagesWithCode('PRESELECT_MISSED')).toEqual([
          'Rokt Kit: preselect missed [reason=arrival_without_fire] [trigger_seen=false]' +
            ' [identity_seen_on_trigger_path=false] [has_identity=true] [trigger_seen_any_tab=true]' +
            ' [near_miss_seen=false] [storage=device] [referrer=none]',
        ]);
      });

      it('says when this tab saw a page that nearly matched the trigger path', () => {
        recordPreselectIntentPath('/arrival-after-near-miss', Date.now() - 1000);
        vi.mocked(markPreselectArrival).mockReturnValue({ nearMissAt: Date.now() - 4000 });

        reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER);

        expect(messagesWithCode('PRESELECT_MISSED')[0]).toContain('[near_miss_seen=true]');
      });

      it('does not count a near miss the target page recorded on its own route', () => {
        recordPreselectIntentPath('/arrival-under-trigger-path', Date.now() - 1000);
        vi.mocked(markPreselectArrival).mockReturnValue({ nearMissAt: Date.now() - 1000 });

        reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER);

        expect(messagesWithCode('PRESELECT_MISSED')[0]).toContain('[near_miss_seen=false]');
      });

      it('says when the kit may keep nothing past this page', () => {
        vi.mocked(markPreselectArrival).mockReturnValue({});
        setDevicePersistenceDisabled(true);
        onTestFinished(() => setDevicePersistenceDisabled(false));

        reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER);

        expect(messagesWithCode('PRESELECT_MISSED')[0]).toContain('[storage=page]');
      });

      it.each([
        ['same_origin', () => `${window.location.origin}/checkout`],
        ['other_origin', () => 'https://payments.example.com/confirm'],
        ['none', () => 'not a url'],
      ])('reports the referrer as %s, never the referrer itself', (expected, referrer) => {
        const value = referrer();
        Object.defineProperty(document, 'referrer', { value, configurable: true });
        onTestFinished(() => {
          delete (document as unknown as Record<string, unknown>).referrer;
        });
        vi.mocked(markPreselectArrival).mockReturnValue({});

        reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER);

        const message = messagesWithCode('PRESELECT_MISSED')[0];
        expect(message).toContain(`[referrer=${expected}]`);
        expect(message).not.toContain(value);
      });

      it('logs nothing when this tab fired before arriving', () => {
        vi.mocked(markPreselectArrival).mockReturnValue({ triggeredAt: 1, firedAt: 2 });

        reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER);

        expect(loggedDiagnostics).toHaveLength(0);
      });

      it('logs nothing for a repeat arrival already reported', () => {
        vi.mocked(markPreselectArrival).mockReturnValue(undefined);

        reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER);

        expect(loggedDiagnostics).toHaveLength(0);
      });

      it('logs no intent arrival while checkout intent is not active', () => {
        vi.mocked(markPreselectArrival).mockReturnValue({ intentAt: Date.now() - 500, intentKind: 'commit' });
        host.isCheckoutIntentActive = () => false;

        reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER);

        expect(messagesWithCode('PRESELECT_ARRIVED')).toEqual([]);
        expect(messagesWithCode('PRESELECT_MISSED')).toEqual([
          expect.stringContaining('[reason=arrival_without_fire]'),
        ]);
      });

      describe('while checkout intent is active', () => {
        beforeEach(() => {
          host.isCheckoutIntentActive = () => true;
        });

        it('logs the intent arrival after a fire, and nothing else', () => {
          vi.mocked(markPreselectArrival).mockReturnValue({
            triggeredAt: Date.now() - 9000,
            firedAt: Date.now() - 8000,
            intentAt: Date.now() - 1500,
            intentKind: 'frame',
          });

          reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER);

          expect(loggedDiagnostics).toEqual([
            {
              code: 'PRESELECT_ARRIVED',
              message:
                'Rokt Kit: preselect arrived [reason=intent_arrival] [intent_seen=frame] [lead=1s_2s] [fired=true]',
            },
          ]);
        });

        it('logs the intent arrival alongside the arrival without a fire', () => {
          vi.mocked(markPreselectArrival).mockReturnValue({ triggeredAt: Date.now() - 4000 });

          reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER);

          expect(messagesWithCode('PRESELECT_ARRIVED')).toEqual([
            'Rokt Kit: preselect arrived [reason=intent_arrival] [intent_seen=none] [lead=none] [fired=false]',
          ]);
          expect(messagesWithCode('PRESELECT_MISSED')).toEqual([
            expect.stringContaining('[reason=arrival_without_fire]'),
          ]);
        });

        it.each([
          [0, 'lt1s'],
          [999, 'lt1s'],
          [1000, '1s_2s'],
          [1999, '1s_2s'],
          [2000, '2s_5s'],
          [5000, '5s_10s'],
          [10000, '10s_20s'],
          [20000, '20s_60s'],
          [59999, '20s_60s'],
          [60000, '60s_300s'],
          [300000, '300s_1800s'],
          [1799999, '300s_1800s'],
          [1800000, 'none'],
          [-1, 'none'],
        ])('buckets a %i ms lead as %s', (leadMs, bucket) => {
          vi.mocked(markPreselectArrival).mockReturnValue({ intentAt: Date.now() - leadMs, intentKind: 'commit' });

          reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER);

          expect(messagesWithCode('PRESELECT_ARRIVED')).toEqual([
            `Rokt Kit: preselect arrived [reason=intent_arrival] [intent_seen=${bucket === 'none' ? 'none' : 'commit'}]` +
              ` [lead=${bucket}] [fired=false]`,
          ]);
        });

        it('logs nothing for a repeat arrival already reported', () => {
          vi.mocked(markPreselectArrival).mockReturnValue(undefined);

          reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER);

          expect(loggedDiagnostics).toHaveLength(0);
        });

        it('drops the intent line once consent removes the kit, keeping the arrival without a fire', () => {
          vi.mocked(markPreselectArrival).mockReturnValue({ intentAt: Date.now() - 500, intentKind: 'commit' });
          host.isForwardingAllowed = () => false;

          reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER);

          expect(messagesWithCode('PRESELECT_ARRIVED')).toEqual([]);
          expect(messagesWithCode('PRESELECT_MISSED')).toEqual([
            expect.stringContaining('[reason=arrival_without_fire]'),
          ]);
        });

        describe('shadow payment check', () => {
          const fired = () => ({ triggeredAt: Date.now() - 9000, firedAt: Date.now() - 8000, intentAt: Date.now() - 1500 });

          it('says the pick a fire went out with matches what the target page reports', () => {
            vi.mocked(markPreselectArrival).mockReturnValue({
              ...fired(),
              intentKind: 'commit',
              paymentPick: 'paypal',
              paymentPickAt: Date.now() - 20000,
              paymentAtFire: 'paypal',
            });

            reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER, { paymentType: 'PAYPAL_ACCOUNT' });

            expect(messagesWithCode('PRESELECT_ARRIVED')).toEqual([
              'Rokt Kit: preselect arrived [reason=intent_arrival] [intent_seen=commit] [lead=1s_2s] [fired=true]' +
                ' [payment_guess=paypal] [payment_pick=paypal] [payment_arrival=paypal] [payment_match=true]',
            ]);
          });

          it('says when the shopper switched method after the fire', () => {
            vi.mocked(markPreselectArrival).mockReturnValue({
              ...fired(),
              intentKind: 'commit',
              paymentPick: 'apple_pay',
              paymentPickAt: Date.now() - 1000,
              paymentAtFire: 'card',
            });

            reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER, { payment_type: 'ApplePay' });

            const message = messagesWithCode('PRESELECT_ARRIVED')[0];
            expect(message).toContain('[payment_guess=card] [payment_pick=apple_pay] [payment_arrival=apple_pay]');
            expect(message).toContain('[payment_match=false]');
          });

          it('logs the family the page reports, never its value, and cannot compare an unknown one', () => {
            vi.mocked(markPreselectArrival).mockReturnValue({
              ...fired(),
              intentKind: 'commit',
              paymentPick: 'card',
              paymentPickAt: Date.now() - 1000,
              paymentAtFire: 'card',
            });

            reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER, { paymenttype: 'StoreFinancing-77' });

            const message = messagesWithCode('PRESELECT_ARRIVED')[0];
            expect(message).toContain('[payment_arrival=other] [payment_match=n/a]');
            expect(message).not.toContain('StoreFinancing');
          });

          it('reports the page value with no guess when this tab never fired', () => {
            vi.mocked(markPreselectArrival).mockReturnValue({ intentAt: Date.now() - 500, intentKind: 'commit' });

            reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER, { paymenttype: 'Visa' });

            expect(messagesWithCode('PRESELECT_ARRIVED')[0]).toContain(
              '[fired=false] [payment_guess=none] [payment_pick=none] [payment_arrival=card] [payment_match=n/a]',
            );
          });

          it('drops the guess of a fire older than the arrival window', () => {
            vi.mocked(markPreselectArrival).mockReturnValue({
              triggeredAt: Date.now() - 41 * 60_000,
              firedAt: Date.now() - 40 * 60_000,
              intentAt: Date.now() - 500,
              intentKind: 'commit',
              paymentPick: 'paypal',
              paymentPickAt: Date.now() - 1000,
              paymentAtFire: 'paypal',
            });

            reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER, { paymenttype: 'PayPal' });

            expect(messagesWithCode('PRESELECT_ARRIVED')[0]).toContain(
              '[payment_guess=none] [payment_pick=paypal] [payment_arrival=paypal] [payment_match=n/a]',
            );
          });

          it('ignores a pick older than the arrival window', () => {
            vi.mocked(markPreselectArrival).mockReturnValue({
              intentAt: Date.now() - 500,
              intentKind: 'commit',
              paymentPick: 'venmo',
              paymentPickAt: Date.now() - 31 * 60_000,
            });

            reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER, {});

            expect(messagesWithCode('PRESELECT_ARRIVED')[0]).not.toContain('payment_');
          });

          it('adds nothing when there was no pick and the page reports no payment type', () => {
            vi.mocked(markPreselectArrival).mockReturnValue({ ...fired(), intentKind: 'commit' });

            reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER, { [ATTRIBUTE_KEY]: 'gold' });

            expect(messagesWithCode('PRESELECT_ARRIVED')).toEqual([
              'Rokt Kit: preselect arrived [reason=intent_arrival] [intent_seen=commit] [lead=1s_2s] [fired=true]',
            ]);
          });
        });

        describe('recordPreselectPaymentClick', () => {
          const click = (attributes: Record<string, unknown>, name = 'Auto Button Click'): SDKEvent =>
            ({ EventDataType: 4, EventName: name, EventAttributes: attributes }) as unknown as SDKEvent;

          it('records a checked payment radio for each target page', () => {
            recordPreselectPaymentClick(host, click({ type: 'radio', checked: true, label: 'PayPal' }));

            expect(recordPreselectPaymentPick).toHaveBeenCalledWith(
              ACCOUNT_ID,
              TARGET_PAGE_IDENTIFIER,
              'paypal',
              expect.any(Number),
            );
          });

          it.each([
            ['an unchecked radio', { type: 'radio', checked: false, label: 'Venmo' }],
            ['a plain button naming a card', { type: 'button', label: 'pay with card' }],
            ['a confirm button', { type: 'submit', label: 'place order' }],
            ['a gift card picker', { type: 'radio', checked: true, label: 'gift card' }],
          ])('records nothing for %s', (_, attributes) => {
            recordPreselectPaymentClick(host, click(attributes));

            expect(recordPreselectPaymentPick).not.toHaveBeenCalled();
          });

          it('records a wallet link that leaves the page from its Auto Link Click', () => {
            recordPreselectPaymentClick(
              host,
              click({ element: 'wallet', type: 'button', label: 'PayPal', link_type: 'outbound' }, 'Auto Link Click'),
            );

            expect(recordPreselectPaymentPick).toHaveBeenCalledWith(
              ACCOUNT_ID,
              TARGET_PAGE_IDENTIFIER,
              'paypal',
              expect.any(Number),
            );
          });

          it('records nothing for a partner event that is not an auto button click', () => {
            recordPreselectPaymentClick(host, click({ type: 'radio', checked: true, label: 'PayPal' }, 'Picked'));

            expect(recordPreselectPaymentPick).not.toHaveBeenCalled();
          });

          it.each([
            ['checkout intent is off', () => (host.isCheckoutIntentActive = () => false)],
            ['consent removes the kit', () => (host.isForwardingAllowed = () => false)],
            ['targeting is off', () => (host.isTargetingDisabled = () => true)],
            ['the kit is not ready', () => (host.isKitReady = () => false)],
            ['pre-selection is off for the session', () => (host.isPreselectionEnabled = () => false)],
          ])('records nothing while %s', (_, gate) => {
            gate();

            recordPreselectPaymentClick(host, click({ type: 'radio', checked: true, label: 'Apple Pay' }));

            expect(recordPreselectPaymentPick).not.toHaveBeenCalled();
          });
        });

        describe('handlePreselectPaymentPick', () => {
          const pick = (fields: { names?: string[]; family?: string }) => ({
            t: Date.now(),
            pathname: PATHNAME,
            ...fields,
          });

          it.each([
            ['the names of a payment radio', { names: ['pay with paypal'] }, 'paypal'],
            ['a radio naming a card', { names: ['credit or debit card'] }, 'card'],
            ['the family of a payment frame', { family: 'google_pay' }, 'google_pay'],
          ])('records %s for each target page', (_, fields, family) => {
            handlePreselectPaymentPick(host, pick(fields));

            expect(recordPreselectPaymentPick).toHaveBeenCalledWith(
              ACCOUNT_ID,
              TARGET_PAGE_IDENTIFIER,
              family,
              expect.any(Number),
            );
          });

          it.each([
            ['names that name no method', { names: ['jane doe, # main st'] }],
            ['a balance', { names: ['gift card'] }],
            ['an unknown family', { family: 'bitcoin' }],
          ])('records nothing for %s', (_, fields) => {
            handlePreselectPaymentPick(host, pick(fields));

            expect(recordPreselectPaymentPick).not.toHaveBeenCalled();
          });

          it.each([
            ['checkout intent is off', () => (host.isCheckoutIntentActive = () => false)],
            ['consent removes the kit', () => (host.isForwardingAllowed = () => false)],
            ['targeting is off', () => (host.isTargetingDisabled = () => true)],
            ['the kit is not ready', () => (host.isKitReady = () => false)],
            ['pre-selection is off for the session', () => (host.isPreselectionEnabled = () => false)],
            ['preselection privacy is withheld', () => (host.isPreselectionPrivacyAllowed = () => false)],
          ])('records nothing while %s', (_, gate) => {
            gate();

            handlePreselectPaymentPick(host, pick({ family: 'paypal' }));

            expect(recordPreselectPaymentPick).not.toHaveBeenCalled();
          });

          it('records nothing for an account with no pre-selection entries', () => {
            mockConfig.current = [];

            handlePreselectPaymentPick(host, pick({ family: 'paypal' }));

            expect(recordPreselectPaymentPick).not.toHaveBeenCalled();
          });
        });

        it('neither records nor reports an arrival once preselection privacy is revoked', () => {
          vi.mocked(markPreselectArrival).mockReturnValue({ intentAt: Date.now() - 500, intentKind: 'commit' });
          host.isPreselectionPrivacyAllowed = () => false;

          reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER);

          expect(markPreselectArrival).not.toHaveBeenCalled();
          expect(loggedDiagnostics).toHaveLength(0);
        });

        it('neither reads nor writes the marker when diagnostics are off', () => {
          host.isPreselectionEnabled = () => false;

          reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER);

          expect(markPreselectArrival).not.toHaveBeenCalled();
          expect(loggedDiagnostics).toHaveLength(0);
        });
      });

      it.each([
        { label: 'an identifier with no entry', apply: () => undefined, identifier: 'another-page' },
        { label: 'a session outside the rollout', apply: () => (host.isPreselectionEnabled = () => false) },
        { label: 'a kit that is not ready', apply: () => (host.isKitReady = () => false) },
        { label: 'targeting disabled', apply: () => (host.isTargetingDisabled = () => true) },
        { label: 'preselection privacy withheld', apply: () => (host.isPreselectionPrivacyAllowed = () => false) },
      ])('neither reads nor writes the marker for $label', ({ apply, identifier }) => {
        apply();

        reportPreselectArrival(host, identifier ?? TARGET_PAGE_IDENTIFIER);

        expect(markPreselectArrival).not.toHaveBeenCalled();
        expect(loggedDiagnostics).toHaveLength(0);
      });
    });
  });

  describe('flushPendingPreselectDispatches', () => {
    beforeEach(() => {
      mockConfig.current = [CONFIG_ENTRY];
    });

    it('drains the queue before replaying each pending entry', () => {
      host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
      state.pending = [
        { event: buildEvent(), pathname: PATHNAME, waitingFor: 'attribute' },
        { event: buildEvent(), pathname: PATHNAME, waitingFor: 'attribute' },
      ];

      flushPendingPreselectDispatches(state, host, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(2);
      expect(state.pending).toHaveLength(0);
    });

    it('lands a re-enqueue from a replayed entry in the new queue, rather than looping', () => {
      host.userAttributes = {}; // still missing the required attribute
      state.pending = [{ event: buildEvent(), pathname: PATHNAME, waitingFor: 'attribute' }];

      flushPendingPreselectDispatches(state, host, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(state.pending).toHaveLength(1);
    });

    it('is a no-op with nothing pending', () => {
      expect(() => flushPendingPreselectDispatches(state, host)).not.toThrow();
      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it('drops a stale entry when the user has navigated to a different pathname', () => {
      host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
      state.pending = [{ event: buildEvent(), pathname: PATHNAME, waitingFor: 'attribute' }];

      flushPendingPreselectDispatches(state, host, '/some-other-path');

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(state.pending).toHaveLength(0);
    });

    it('still fires an entry whose pathname matches the current pathname', () => {
      host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
      state.pending = [{ event: buildEvent(), pathname: PATHNAME, waitingFor: 'attribute' }];

      flushPendingPreselectDispatches(state, host, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(1);
    });

    it('also fires a recovered persisted entry, independent of currentPathname', () => {
      vi.mocked(getPendingPreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        pathname: PATHNAME,
        identifier: TARGET_PAGE_IDENTIFIER,
        attributes: { [ATTRIBUTE_KEY]: 'gold' },
        mpid: MPID,
      });

      flushPendingPreselectDispatches(state, host, '/some-other-path');

      expect(selectPlacementsCalls).toHaveLength(1);
    });
  });

  describe('maybeFirePersistedPreselect', () => {
    beforeEach(() => {
      mockConfig.current = [CONFIG_ENTRY];
    });

    it('drops a saved attempt when targeting is disabled on the recovering page', () => {
      vi.mocked(getPendingPreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        pathname: PATHNAME,
        identifier: TARGET_PAGE_IDENTIFIER,
        attributes: { [ATTRIBUTE_KEY]: 'gold' },
        mpid: MPID,
      });
      host.isTargetingDisabled = () => true;

      maybeFirePersistedPreselect(state, host);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(setActivePreselect).not.toHaveBeenCalled();
      expect(clearPendingPreselect).toHaveBeenCalledWith(ACCOUNT_ID);
    });

    it('drops a saved attempt whose required cart attributes were excluded from persistence', () => {
      mockConfig.current = [
        {
          ...CONFIG_ENTRY,
          attributeKeys: [ATTRIBUTE_KEY, 'totalprice', 'cartItems'],
        },
      ];
      const cartAttributes = {
        totalprice: 25,
        cartItems: '[{"sku":"test-item","quantity":1}]',
      };
      host.userAttributes = {
        [ATTRIBUTE_KEY]: 'gold',
        ...cartAttributes,
      };
      host.isKitReady = () => false;

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      const [, pathname, identifier, attributes, mpid] = vi.mocked(setPendingPreselect).mock.calls[0];
      expect(attributes).toEqual({ [ATTRIBUTE_KEY]: 'gold' });
      vi.mocked(getPendingPreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        pathname,
        identifier,
        attributes,
        mpid,
      });
      state = createPreselectState();
      host.isKitReady = () => true;

      maybeFirePersistedPreselect(state, host);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(setActivePreselect).not.toHaveBeenCalled();
      expect(clearPendingPreselect).toHaveBeenCalledWith(ACCOUNT_ID);
      for (const key of ['totalprice', 'cartItems']) {
        expect(loggedDiagnostics).toContainEqual(
          expect.objectContaining({
            code: 'PRESELECT_MISSED',
            message: expect.stringContaining(`missing_persisted_attribute:${key}`),
          }),
        );
      }
    });

    it.each([
      { label: 'undefined', value: undefined },
      { label: 'null', value: null },
      { label: 'empty string', value: '' },
      { label: 'empty array', value: [] },
    ])('drops a saved attempt with a required attribute set to $label', ({ value }) => {
      vi.mocked(getPendingPreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        pathname: PATHNAME,
        identifier: TARGET_PAGE_IDENTIFIER,
        attributes: { [ATTRIBUTE_KEY]: value },
        mpid: MPID,
      });

      maybeFirePersistedPreselect(state, host);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(clearPendingPreselect).toHaveBeenCalledWith(ACCOUNT_ID);
    });

    it.each([
      { variant: 'widened', fires: true },
      { variant: 'standard', fires: false },
    ])('recovers a saved attempt without a widened key only on a widened tab ($variant)', ({ variant, fires }) => {
      mockConfig.current = [
        { ...CONFIG_ENTRY, attributeKeys: [ATTRIBUTE_KEY, 'firstname'], widenedOptionalAttributeKeys: ['firstname'] },
      ];
      vi.mocked(getPendingPreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        pathname: PATHNAME,
        identifier: TARGET_PAGE_IDENTIFIER,
        attributes: { [ATTRIBUTE_KEY]: 'gold' },
        mpid: MPID,
      });
      host.getPreselectVariant = () => variant;

      maybeFirePersistedPreselect(state, host);

      expect(selectPlacementsCalls).toEqual(
        fires
          ? [
              {
                attributes: tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'recovered'),
                preselect: true,
                identifier: TARGET_PAGE_IDENTIFIER,
                omitUrl: true,
              },
            ]
          : [],
      );
      expect(clearPendingPreselect).toHaveBeenCalledWith(ACCOUNT_ID);
    });

    it('recovers a complete saved attempt without an optional attribute', () => {
      mockConfig.current = [
        {
          ...CONFIG_ENTRY,
          attributeKeys: [ATTRIBUTE_KEY, 'firstName'],
          optionalAttributeKeys: ['FIRSTNAME'],
        },
      ];
      vi.mocked(getPendingPreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        pathname: PATHNAME,
        identifier: TARGET_PAGE_IDENTIFIER,
        attributes: { [ATTRIBUTE_KEY]: 'gold' },
        mpid: MPID,
      });

      maybeFirePersistedPreselect(state, host);

      expect(selectPlacementsCalls).toEqual([
        {
          attributes: tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'recovered'),
          preselect: true,
          identifier: TARGET_PAGE_IDENTIFIER,
          omitUrl: true,
        },
      ]);
    });

    it.each([
      { change: 'removed', config: [] },
      { change: 'retargeted', config: [{ ...CONFIG_ENTRY, targetPageIdentifier: 'another-target' }] },
      { change: 'given a new required key', config: [{ ...CONFIG_ENTRY, attributeKeys: [ATTRIBUTE_KEY, 'newKey'] }] },
    ])('drops a saved attempt after its config is $change', ({ config }) => {
      mockConfig.current = config;
      vi.mocked(getPendingPreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        pathname: PATHNAME,
        identifier: TARGET_PAGE_IDENTIFIER,
        attributes: { [ATTRIBUTE_KEY]: 'gold' },
        mpid: MPID,
      });

      maybeFirePersistedPreselect(state, host);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(clearPendingPreselect).toHaveBeenCalledWith(ACCOUNT_ID);
    });

    it('rejects a snapshot containing a required persistence-denied value', () => {
      mockConfig.current = [{ ...CONFIG_ENTRY, attributeKeys: ['totalprice'] }];
      vi.mocked(getPendingPreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        pathname: PATHNAME,
        identifier: TARGET_PAGE_IDENTIFIER,
        attributes: { totalprice: 25 },
        mpid: MPID,
      });

      maybeFirePersistedPreselect(state, host);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(setActivePreselect).not.toHaveBeenCalled();
      expect(clearPendingPreselect).toHaveBeenCalledWith(ACCOUNT_ID);
    });

    it('does nothing when nothing is persisted', () => {
      maybeFirePersistedPreselect(state, host);

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it('does nothing when the kit is not ready', () => {
      host.isKitReady = () => false;
      vi.mocked(getPendingPreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        pathname: PATHNAME,
        identifier: TARGET_PAGE_IDENTIFIER,
        attributes: { [ATTRIBUTE_KEY]: 'gold' },
        mpid: MPID,
      });

      maybeFirePersistedPreselect(state, host);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(clearPendingPreselect).not.toHaveBeenCalled();
    });

    it('fires the persisted attributes and clears the record, regardless of the current pathname', () => {
      vi.mocked(getPendingPreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        pathname: PATHNAME,
        identifier: TARGET_PAGE_IDENTIFIER,
        attributes: { [ATTRIBUTE_KEY]: 'gold' },
        mpid: MPID,
      });

      maybeFirePersistedPreselect(state, host);

      expect(selectPlacementsCalls).toEqual([
        { attributes: tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'recovered'), preselect: true, identifier: TARGET_PAGE_IDENTIFIER, omitUrl: true },
      ]);
      expect(clearPendingPreselect).toHaveBeenCalledWith(ACCOUNT_ID);
    });

    it('keys the active-preselect record by the target identifier, not the source pathname, so it cannot block the next live fire on that pathname', () => {
      vi.mocked(getPendingPreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        pathname: PATHNAME,
        identifier: TARGET_PAGE_IDENTIFIER,
        attributes: { [ATTRIBUTE_KEY]: 'gold' },
        mpid: MPID,
      });

      maybeFirePersistedPreselect(state, host);

      expect(buildActivePreselectFieldKey).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER);
      expect(buildActivePreselectFieldKey).not.toHaveBeenCalledWith(ACCOUNT_ID, PATHNAME);
    });

    it('does not fire, but still clears the record, when preselection is disabled', () => {
      host.isPreselectionEnabled = () => false;
      vi.mocked(getPendingPreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        pathname: PATHNAME,
        identifier: TARGET_PAGE_IDENTIFIER,
        attributes: { [ATTRIBUTE_KEY]: 'gold' },
        mpid: MPID,
      });

      maybeFirePersistedPreselect(state, host);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(clearPendingPreselect).toHaveBeenCalledWith(ACCOUNT_ID);
    });

    it('does not fire or clear the record when identity is not yet resolved, so a later flush can retry it', () => {
      host.filteredUser = { getUserIdentities: () => ({ userIdentities: {} }) } as unknown as PreselectHost['filteredUser'];
      vi.mocked(getPendingPreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        pathname: PATHNAME,
        identifier: TARGET_PAGE_IDENTIFIER,
        attributes: { [ATTRIBUTE_KEY]: 'gold' },
        mpid: MPID,
      });

      maybeFirePersistedPreselect(state, host);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(clearPendingPreselect).not.toHaveBeenCalled();
    });

    it('fires a record left behind while identity was resolving, once a later flush finds a valid identity', () => {
      host.filteredUser = { getUserIdentities: () => ({ userIdentities: {} }) } as unknown as PreselectHost['filteredUser'];
      vi.mocked(getPendingPreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        pathname: PATHNAME,
        identifier: TARGET_PAGE_IDENTIFIER,
        attributes: { [ATTRIBUTE_KEY]: 'gold' },
        mpid: MPID,
      });

      maybeFirePersistedPreselect(state, host);
      expect(selectPlacementsCalls).toHaveLength(0);

      host.filteredUser = {
        getUserIdentities: () => ({ userIdentities: { email: 'test@example.com' } }),
        getMPID: () => MPID,
      } as unknown as PreselectHost['filteredUser'];

      maybeFirePersistedPreselect(state, host);

      expect(selectPlacementsCalls).toHaveLength(1);
      expect(clearPendingPreselect).toHaveBeenCalledWith(ACCOUNT_ID);
    });

    it('does not fire a record persisted for a different user, e.g. after a login/logout on the same device', () => {
      vi.mocked(getPendingPreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        pathname: PATHNAME,
        identifier: TARGET_PAGE_IDENTIFIER,
        attributes: { [ATTRIBUTE_KEY]: 'gold' },
        mpid: 'a-different-mpid',
      });

      maybeFirePersistedPreselect(state, host);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(clearPendingPreselect).toHaveBeenCalledWith(ACCOUNT_ID);
    });

    it('defers to the in-memory entry, rather than firing, when state.pending still has one for the same pathname', () => {
      // A full navigation is what wipes state.pending, so a matching entry here means
      // this is the same JS instance mid an SPA route change, not the cross-page case.
      state.pending = [{ event: buildEvent(), pathname: PATHNAME, waitingFor: 'attribute' }];
      vi.mocked(getPendingPreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        pathname: PATHNAME,
        identifier: TARGET_PAGE_IDENTIFIER,
        attributes: { [ATTRIBUTE_KEY]: 'gold' },
        mpid: MPID,
      });

      maybeFirePersistedPreselect(state, host);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(clearPendingPreselect).toHaveBeenCalledWith(ACCOUNT_ID);
    });

    it('clears the stored copy when a route change before attach drops its in-memory entry', () => {
      let stored: ReturnType<typeof getPendingPreselect> = null;
      vi.mocked(setPendingPreselect).mockImplementation((_accountId, pathname, identifier, attributes, mpid) => {
        stored = { expiresAt: Date.now() + 60_000, pathname, identifier, attributes, mpid };
        return true;
      });
      vi.mocked(getPendingPreselect).mockImplementation(() => stored);
      vi.mocked(clearPendingPreselect).mockImplementation(() => {
        stored = null;
      });
      host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
      host.isKitReady = () => false;

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      expect(stored).not.toBeNull();
      maybeFirePreselect(state, host, buildEvent(), '/a-later-route');

      host.isKitReady = () => true;
      flushPendingPreselectDispatches(state, host, '/a-later-route');

      expect(stored).toBeNull();
      expect(selectPlacementsCalls).toHaveLength(0);
    });
  });

  describe('dispatchPreselect', () => {
    it('calls selectPlacements with the given options and logs nothing on success', async () => {
      dispatchPreselect(host, { preselect: true });
      await Promise.resolve();

      expect(selectPlacementsCalls).toEqual([{ preselect: true }]);
      expect(loggedEvents).toHaveLength(0);
    });

    it('logs PRESELECT_DISPATCH_FAILED with the error message when selectPlacements rejects', async () => {
      host.selectPlacements = () => Promise.reject(new Error('network down'));

      dispatchPreselect(host, { preselect: true });
      await vi.waitFor(() => expect(loggedEvents).toHaveLength(1));

      expect(loggedEvents[0]).toMatchObject({ code: 'PRESELECT_DISPATCH_FAILED' });
      expect(loggedEvents[0].message).toContain('network down');
    });
  });

  describe('findPreselectionConfig', () => {
    beforeEach(() => {
      mockConfig.current = [CONFIG_ENTRY];
    });

    it('returns the matching entry for the account and pathname', () => {
      expect(findPreselectionConfig(ACCOUNT_ID, PATHNAME)).toEqual(CONFIG_ENTRY);
    });

    it('returns undefined when accountId is missing', () => {
      expect(findPreselectionConfig(null, PATHNAME)).toBeUndefined();
      expect(findPreselectionConfig(undefined, PATHNAME)).toBeUndefined();
    });

    it('returns undefined when no entry matches the pathname', () => {
      expect(findPreselectionConfig(ACCOUNT_ID, '/some-other-path')).toBeUndefined();
    });

    it('returns undefined when no entry matches the accountId', () => {
      expect(findPreselectionConfig('some-other-account', PATHNAME)).toBeUndefined();
    });

    describe('wildcard path segment', () => {
      const WILDCARD_ENTRY = { ...CONFIG_ENTRY, pathname: '/checkout/*/review' };

      beforeEach(() => {
        mockConfig.current = [WILDCARD_ENTRY];
      });

      it('matches any single segment in the wildcard position', () => {
        expect(findPreselectionConfig(ACCOUNT_ID, '/checkout/abc123/review')).toEqual(WILDCARD_ENTRY);
        expect(findPreselectionConfig(ACCOUNT_ID, '/checkout/XYZ-789/review')).toEqual(WILDCARD_ENTRY);
      });

      it('does not match across a segment boundary', () => {
        expect(findPreselectionConfig(ACCOUNT_ID, '/checkout/abc/123/review')).toBeUndefined();
      });

      it('does not match an empty segment', () => {
        expect(findPreselectionConfig(ACCOUNT_ID, '/checkout//review')).toBeUndefined();
      });

      it('does not match a shorter or a longer path', () => {
        expect(findPreselectionConfig(ACCOUNT_ID, '/checkout/review')).toBeUndefined();
        expect(findPreselectionConfig(ACCOUNT_ID, '/checkout/abc123/review/extra')).toBeUndefined();
      });

      it('does not match when a literal segment differs', () => {
        expect(findPreselectionConfig(ACCOUNT_ID, '/basket/abc123/review')).toBeUndefined();
        expect(findPreselectionConfig(ACCOUNT_ID, '/checkout/abc123/pay')).toBeUndefined();
      });

      it('matches when the pathname carries a trailing slash', () => {
        expect(findPreselectionConfig(ACCOUNT_ID, '/checkout/abc123/review/')).toEqual(WILDCARD_ENTRY);
      });
    });

    describe('a trailing wildcard covering every step of a checkout', () => {
      const STEPS_ENTRY = { ...CONFIG_ENTRY, pathname: '/secure-checkout/*' };

      beforeEach(() => {
        mockConfig.current = [STEPS_ENTRY];
      });

      it.each(['/secure-checkout/pickup', '/secure-checkout/ship', '/secure-checkout/pay', '/secure-checkout/review'])(
        'matches the %s step',
        (pathname) => {
          expect(findPreselectionConfig(ACCOUNT_ID, pathname)).toEqual(STEPS_ENTRY);
        },
      );

      it.each(['/secure-checkout', '/shopping-bag', '/confirmation', '/secure-checkout/review/edit'])(
        'does not match %s',
        (pathname) => {
          expect(findPreselectionConfig(ACCOUNT_ID, pathname)).toBeUndefined();
        },
      );
    });

    describe('trailing slash', () => {
      it('matches a pathname with a trailing slash against an entry without one', () => {
        expect(findPreselectionConfig(ACCOUNT_ID, `${PATHNAME}/`)).toEqual(CONFIG_ENTRY);
      });

      it('matches a pathname without a trailing slash against an entry with one', () => {
        mockConfig.current = [{ ...CONFIG_ENTRY, pathname: `${PATHNAME}/` }];
        expect(findPreselectionConfig(ACCOUNT_ID, PATHNAME)).toMatchObject({ targetPageIdentifier: TARGET_PAGE_IDENTIFIER });
      });

      it('does not match a deeper pathname that only shares the entry as a prefix', () => {
        expect(findPreselectionConfig(ACCOUNT_ID, `${PATHNAME}/x`)).toBeUndefined();
      });

      it('matches the root path only against the root path', () => {
        mockConfig.current = [{ ...CONFIG_ENTRY, pathname: '/' }];
        expect(findPreselectionConfig(ACCOUNT_ID, '/')).toMatchObject({ targetPageIdentifier: TARGET_PAGE_IDENTIFIER });
        expect(findPreselectionConfig(ACCOUNT_ID, '')).toBeUndefined();
        expect(findPreselectionConfig(ACCOUNT_ID, PATHNAME)).toBeUndefined();
      });
    });
  });

  describe('hasPreselectionConfigForAccount', () => {
    beforeEach(() => {
      mockConfig.current = [CONFIG_ENTRY];
    });

    it('is true for an account with an entry', () => {
      expect(hasPreselectionConfigForAccount(ACCOUNT_ID)).toBe(true);
    });

    it('is false for any other account and for no account', () => {
      expect(hasPreselectionConfigForAccount('some-other-account')).toBe(false);
      expect(hasPreselectionConfigForAccount(null)).toBe(false);
      expect(hasPreselectionConfigForAccount(undefined)).toBe(false);
    });
  });

  describe('maybeFirePreselectForPathname', () => {
    beforeEach(() => {
      mockConfig.current = [CONFIG_ENTRY];
    });

    it('fires from user attributes with no page-view event', () => {
      host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };

      maybeFirePreselectForPathname(state, host, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(1);
      expect(selectPlacementsCalls[0]).toMatchObject({
        attributes: { [ATTRIBUTE_KEY]: 'gold' },
        preselect: true,
        identifier: TARGET_PAGE_IDENTIFIER,
      });
    });

    it('reports the unresolved key when user attributes do not carry it', () => {
      host.userAttributes = {};

      maybeFirePreselectForPathname(state, host, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(loggedDiagnostics).toContainEqual(
        expect.objectContaining({ code: 'PRESELECT_MISSED' }),
      );
    });

    it('does not displace a queued page view, which carries event attributes it cannot', () => {
      host.isKitReady = () => false;
      host.userAttributes = {};
      const pageViewEvent = buildEvent({ [ATTRIBUTE_KEY]: 'from-event' });

      maybeFirePreselect(state, host, pageViewEvent, PATHNAME);
      maybeFirePreselectForPathname(state, host, PATHNAME);

      expect(state.pending).toHaveLength(1);
      expect(state.pending[0].event).toBe(pageViewEvent);
    });

    it('is replaced by a page view arriving for the same pathname', () => {
      host.isKitReady = () => false;
      host.userAttributes = {};
      const pageViewEvent = buildEvent({ [ATTRIBUTE_KEY]: 'from-event' });

      maybeFirePreselectForPathname(state, host, PATHNAME);
      maybeFirePreselect(state, host, pageViewEvent, PATHNAME);

      expect(state.pending).toHaveLength(1);
      expect(state.pending[0].event).toBe(pageViewEvent);
    });

    it('still collapses repeat pathname attempts on one pathname', () => {
      host.isKitReady = () => false;

      maybeFirePreselectForPathname(state, host, PATHNAME);
      maybeFirePreselectForPathname(state, host, PATHNAME);

      expect(state.pending).toHaveLength(1);
    });

    it('leaves the queued event attributes resolvable at the later flush', () => {
      host.isKitReady = () => false;
      host.userAttributes = {};
      maybeFirePreselect(state, host, buildEvent({ [ATTRIBUTE_KEY]: 'from-event' }), PATHNAME);
      maybeFirePreselectForPathname(state, host, PATHNAME);

      host.isKitReady = () => true;
      flushPendingPreselectDispatches(state, host, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(1);
      expect(selectPlacementsCalls[0]).toMatchObject({
        attributes: { [ATTRIBUTE_KEY]: 'from-event' },
      });
    });

    it('does nothing on a pathname with no entry', () => {
      host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };

      maybeFirePreselectForPathname(state, host, '/some-other-path');

      expect(selectPlacementsCalls).toHaveLength(0);
    });
  });

  describe('maybeFirePreselectForEvent', () => {
    const TRIGGER_EVENT_NAME = 'Ready to Checkout';
    const DELAY_MS = 5000;

    const buildCustomEvent = (
      eventName: string,
      eventAttributes: Record<string, unknown> = {},
      eventDataType = 4,
    ): SDKEvent =>
      ({ EventName: eventName, EventDataType: eventDataType, EventAttributes: eventAttributes }) as SDKEvent;

    beforeEach(() => {
      mockConfig.current = [{ ...CONFIG_ENTRY, triggerEventNames: [TRIGGER_EVENT_NAME] }];
      host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('fires on a configured event, preferring its event attributes', () => {
      const triggerEvent = buildCustomEvent(TRIGGER_EVENT_NAME, { [ATTRIBUTE_KEY]: 'from-event' });

      maybeFirePreselectForEvent(state, host, triggerEvent, PATHNAME);

      expect(selectPlacementsCalls).toEqual([
        {
          attributes: tagged({ [ATTRIBUTE_KEY]: 'from-event' }, 'event'),
          preselect: true,
          identifier: TARGET_PAGE_IDENTIFIER,
          omitUrl: true,
        },
      ]);
      expect(loggedDiagnostics).toContainEqual(
        expect.objectContaining({ code: 'PRESELECT_FIRED', message: expect.stringContaining('reason=event_trigger') }),
      );
      expect(setActivePreselect).toHaveBeenCalledWith(
        FIELD_KEY,
        djb2(JSON.stringify({ [ATTRIBUTE_KEY]: 'from-event' })),
        true,
      );
    });

    it('ignores an event name that is not configured', () => {
      maybeFirePreselectForEvent(state, host, buildCustomEvent('Add to Cart'), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it('ignores a configured event name on another route', () => {
      maybeFirePreselectForEvent(state, host, buildCustomEvent(TRIGGER_EVENT_NAME), '/some-other-path');

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it('ignores a configured name on a non custom event', () => {
      maybeFirePreselectForEvent(state, host, buildCustomEvent(TRIGGER_EVENT_NAME, {}, 16), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it('ignores an automatically logged button click with a configured name', () => {
      maybeFirePreselectForEvent(
        state,
        host,
        buildCustomEvent(TRIGGER_EVENT_NAME, { is_auto_button_click: true }),
        PATHNAME,
      );

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it.each(['Auto Button Click', 'Auto Link Click'])(
      'ignores an automatic click by name when its marker was stripped: %s',
      (name) => {
        mockConfig.current = [{ ...CONFIG_ENTRY, triggerEventNames: [name] }];

        maybeFirePreselectForEvent(state, host, buildCustomEvent(name), PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
      },
    );

    it('ignores an automatically logged link click with a configured name', () => {
      maybeFirePreselectForEvent(
        state,
        host,
        buildCustomEvent(TRIGGER_EVENT_NAME, { is_auto_link_click: true }),
        PATHNAME,
      );

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it('ignores the event for an entry with no triggerEventNames', () => {
      mockConfig.current = [CONFIG_ENTRY];

      maybeFirePreselectForEvent(state, host, buildCustomEvent(TRIGGER_EVENT_NAME), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it('dispatches without waiting for dispatchDelayMs', () => {
      vi.useFakeTimers();
      mockConfig.current = [{ ...CONFIG_ENTRY, triggerEventNames: [TRIGGER_EVENT_NAME], dispatchDelayMs: DELAY_MS }];

      maybeFirePreselectForEvent(state, host, buildCustomEvent(TRIGGER_EVENT_NAME), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(1);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('replaces a pageview dispatch still held on the delay', () => {
      vi.useFakeTimers();
      mockConfig.current = [{ ...CONFIG_ENTRY, triggerEventNames: [TRIGGER_EVENT_NAME], dispatchDelayMs: DELAY_MS }];

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      maybeFirePreselectForEvent(state, host, buildCustomEvent(TRIGGER_EVENT_NAME), PATHNAME);
      vi.advanceTimersByTime(DELAY_MS * 2);

      expect(selectPlacementsCalls).toHaveLength(1);
      expect(loggedDiagnostics).toContainEqual(
        expect.objectContaining({ message: expect.stringContaining('reason=event_trigger') }),
      );
    });

    it('leaves a held pageview dispatch alone when an unrelated event arrives', () => {
      vi.useFakeTimers();
      mockConfig.current = [{ ...CONFIG_ENTRY, triggerEventNames: [TRIGGER_EVENT_NAME], dispatchDelayMs: DELAY_MS }];

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      maybeFirePreselectForEvent(state, host, buildCustomEvent('Add to Cart'), PATHNAME);
      vi.advanceTimersByTime(DELAY_MS);

      expect(selectPlacementsCalls).toHaveLength(1);
    });

    it('replays a queued event once the kit is ready, still without the delay', () => {
      vi.useFakeTimers();
      mockConfig.current = [{ ...CONFIG_ENTRY, triggerEventNames: [TRIGGER_EVENT_NAME], dispatchDelayMs: DELAY_MS }];
      host.isKitReady = () => false;

      maybeFirePreselectForEvent(state, host, buildCustomEvent(TRIGGER_EVENT_NAME), PATHNAME);
      expect(selectPlacementsCalls).toHaveLength(0);

      host.isKitReady = () => true;
      flushPendingPreselectDispatches(state, host, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(1);
    });

    it('keeps a queued event when a pageview queues after it on the same route', () => {
      vi.useFakeTimers();
      mockConfig.current = [{ ...CONFIG_ENTRY, triggerEventNames: [TRIGGER_EVENT_NAME], dispatchDelayMs: DELAY_MS }];
      host.isKitReady = () => false;
      const triggerEvent = buildCustomEvent(TRIGGER_EVENT_NAME, { [ATTRIBUTE_KEY]: 'from-event' });

      maybeFirePreselectForEvent(state, host, triggerEvent, PATHNAME);
      maybeFirePreselect(state, host, buildEvent({ [ATTRIBUTE_KEY]: 'from-pageview' }), PATHNAME);

      expect(state.pending).toHaveLength(1);
      expect(state.pending[0].event).toBe(triggerEvent);

      host.isKitReady = () => true;
      flushPendingPreselectDispatches(state, host, PATHNAME);

      expect(selectPlacementsCalls).toEqual([expect.objectContaining({ attributes: tagged({ [ATTRIBUTE_KEY]: 'from-event' }, 'event') })]);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('leaves a queued pageview in place when the event cannot dispatch yet', () => {
      host.isKitReady = () => false;
      const pageView = buildEvent({ [ATTRIBUTE_KEY]: 'from-pageview' });

      maybeFirePreselect(state, host, pageView, PATHNAME);
      maybeFirePreselectForEvent(state, host, buildCustomEvent(TRIGGER_EVENT_NAME), PATHNAME);

      expect(state.pending).toHaveLength(1);
      expect(state.pending[0].event).toBe(pageView);

      host.isKitReady = () => true;
      flushPendingPreselectDispatches(state, host, PATHNAME);

      expect(selectPlacementsCalls).toEqual([
        expect.objectContaining({ attributes: tagged({ [ATTRIBUTE_KEY]: 'from-pageview' }) }),
      ]);
    });

    it('leaves a held pageview in place when the event is missing a required attribute', () => {
      vi.useFakeTimers();
      mockConfig.current = [{ ...CONFIG_ENTRY, triggerEventNames: [TRIGGER_EVENT_NAME], dispatchDelayMs: DELAY_MS }];
      host.userAttributes = {};

      maybeFirePreselect(state, host, buildEvent({ [ATTRIBUTE_KEY]: 'from-pageview' }), PATHNAME);
      maybeFirePreselectForEvent(state, host, buildCustomEvent(TRIGGER_EVENT_NAME), PATHNAME);
      vi.advanceTimersByTime(DELAY_MS);

      expect(selectPlacementsCalls).toEqual([
        expect.objectContaining({ attributes: tagged({ [ATTRIBUTE_KEY]: 'from-pageview' }) }),
      ]);
    });

    describe('with a held pageview and an active record', () => {
      beforeEach(() => {
        vi.useFakeTimers();
        mockConfig.current = [{ ...CONFIG_ENTRY, triggerEventNames: [TRIGGER_EVENT_NAME], dispatchDelayMs: DELAY_MS }];
        let activeRecord: { expiresAt: number; attributesDigest: number; byEvent?: boolean } | null = null;
        vi.mocked(setActivePreselect).mockImplementation((_fieldKey, attributesDigest, byEvent) => {
          activeRecord = { expiresAt: Date.now() + 60_000, attributesDigest, byEvent };
        });
        vi.mocked(getActivePreselect).mockImplementation(() => activeRecord);
      });

      const fireEvent = (tier: string) =>
        maybeFirePreselectForEvent(state, host, buildCustomEvent(TRIGGER_EVENT_NAME, { [ATTRIBUTE_KEY]: tier }), PATHNAME);

      it('leaves the hold in place when a repeat event would be skipped as active', () => {
        fireEvent('from-event');
        maybeFirePreselect(state, host, buildEvent({ [ATTRIBUTE_KEY]: 'from-pageview' }), PATHNAME);
        fireEvent('changed-event');
        vi.advanceTimersByTime(DELAY_MS);

        expect(selectPlacementsCalls.map((call) => call.attributes)).toEqual([
          tagged({ [ATTRIBUTE_KEY]: 'from-event' }, 'event'),
          tagged({ [ATTRIBUTE_KEY]: 'from-pageview' }),
        ]);
      });

      it('leaves a held pathname trigger in place when the event would be skipped as active', () => {
        fireEvent('from-event');
        maybeFirePreselectForPathname(state, host, PATHNAME);
        fireEvent('changed-event');
        vi.advanceTimersByTime(DELAY_MS);

        expect(selectPlacementsCalls.map((call) => call.attributes)).toEqual([
          tagged({ [ATTRIBUTE_KEY]: 'from-event' }, 'event'),
          tagged({ [ATTRIBUTE_KEY]: 'gold' }, 'pathname'),
        ]);
      });

      it('leaves the hold in place when the event carries the attributes already sent', () => {
        maybeFirePreselect(state, host, buildEvent({ [ATTRIBUTE_KEY]: 'first' }), PATHNAME);
        vi.advanceTimersByTime(DELAY_MS);
        maybeFirePreselect(state, host, buildEvent({ [ATTRIBUTE_KEY]: 'second' }), PATHNAME);
        maybeFirePreselectForEvent(state, host, buildCustomEvent(TRIGGER_EVENT_NAME, { [ATTRIBUTE_KEY]: 'first' }), PATHNAME);
        vi.advanceTimersByTime(DELAY_MS);

        expect(selectPlacementsCalls.map((call) => call.attributes)).toEqual([
          tagged({ [ATTRIBUTE_KEY]: 'first' }),
          tagged({ [ATTRIBUTE_KEY]: 'second' }),
        ]);
      });
    });

    it('keeps the stored copy of a queued event when a pageview yields to it', () => {
      host.isKitReady = () => false;

      maybeFirePreselectForEvent(state, host, buildCustomEvent(TRIGGER_EVENT_NAME, { [ATTRIBUTE_KEY]: 'from-event' }), PATHNAME);
      maybeFirePreselect(state, host, buildEvent({ [ATTRIBUTE_KEY]: 'from-pageview' }), PATHNAME);

      expect(setPendingPreselect).toHaveBeenCalledTimes(1);
      expect(setPendingPreselect).toHaveBeenCalledWith(
        ACCOUNT_ID,
        PATHNAME,
        TARGET_PAGE_IDENTIFIER,
        { [ATTRIBUTE_KEY]: 'from-event' },
        MPID,
        true,
      );
    });

    it('lets a pageview replace a queued event whose required attributes do not resolve', () => {
      host.userAttributes = {};
      host.isKitReady = () => false;
      const pageView = buildEvent({ [ATTRIBUTE_KEY]: 'from-pageview' });

      maybeFirePreselectForEvent(state, host, buildCustomEvent(TRIGGER_EVENT_NAME), PATHNAME);
      maybeFirePreselect(state, host, pageView, PATHNAME);

      expect(state.pending).toHaveLength(1);
      expect(state.pending[0].event).toBe(pageView);

      host.isKitReady = () => true;
      flushPendingPreselectDispatches(state, host, PATHNAME);

      expect(selectPlacementsCalls).toEqual([
        expect.objectContaining({ attributes: tagged({ [ATTRIBUTE_KEY]: 'from-pageview' }) }),
      ]);
    });

    it('displaces a queued pageview once the event can dispatch, so a later flush replays nothing', () => {
      host.userAttributes = {};

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      expect(state.pending).toHaveLength(1);

      maybeFirePreselectForEvent(state, host, buildCustomEvent(TRIGGER_EVENT_NAME, { [ATTRIBUTE_KEY]: 'from-event' }), PATHNAME);
      expect(state.pending).toHaveLength(0);

      host.userAttributes = { [ATTRIBUTE_KEY]: 'set-later' };
      flushPendingPreselectDispatches(state, host, PATHNAME);

      expect(selectPlacementsCalls).toEqual([expect.objectContaining({ attributes: tagged({ [ATTRIBUTE_KEY]: 'from-event' }, 'event') })]);
    });

    it('clears a stored copy for its route when the event dispatches now', () => {
      vi.mocked(getPendingPreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        pathname: PATHNAME,
        identifier: TARGET_PAGE_IDENTIFIER,
        attributes: { [ATTRIBUTE_KEY]: 'gold' },
        mpid: MPID,
      });

      maybeFirePreselectForEvent(state, host, buildCustomEvent(TRIGGER_EVENT_NAME, { [ATTRIBUTE_KEY]: 'from-event' }), PATHNAME);

      expect(clearPendingPreselect).toHaveBeenCalledWith(ACCOUNT_ID);
      expect(selectPlacementsCalls).toHaveLength(1);
    });

    it('keeps an event requeued for a missing identity when a pageview requeues after it', () => {
      host.filteredUser = {
        getUserIdentities: () => ({ userIdentities: {} }),
        getMPID: () => MPID,
      } as unknown as PreselectHost['filteredUser'];
      const triggerEvent = buildCustomEvent(TRIGGER_EVENT_NAME);

      maybeFirePreselectForEvent(state, host, triggerEvent, PATHNAME);
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(state.pending).toHaveLength(1);
      expect(state.pending[0].event).toBe(triggerEvent);
    });

    it('skips while an event preselection is active, even when the attributes changed', () => {
      vi.mocked(getActivePreselect).mockReturnValue({ expiresAt: Date.now() + 60_000, attributesDigest: 1, byEvent: true });

      const triggerEvent = buildCustomEvent(TRIGGER_EVENT_NAME, { [ATTRIBUTE_KEY]: 'changed' });

      maybeFirePreselectForEvent(state, host, triggerEvent, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(loggedDiagnostics).toContainEqual(
        expect.objectContaining({ code: 'PRESELECT_SKIPPED', message: expect.stringContaining('active_preselection') }),
      );
    });

    it('fires over an active record a pageview wrote when its attributes changed', () => {
      vi.mocked(getActivePreselect).mockReturnValue({ expiresAt: Date.now() + 60_000, attributesDigest: 1 });

      maybeFirePreselectForEvent(state, host, buildCustomEvent(TRIGGER_EVENT_NAME, { [ATTRIBUTE_KEY]: 'changed' }), PATHNAME);

      expect(selectPlacementsCalls).toEqual([expect.objectContaining({ attributes: tagged({ [ATTRIBUTE_KEY]: 'changed' }, 'event') })]);
    });

    it('skips a repeat event during the active period and fires again once it has expired', () => {
      vi.useFakeTimers();
      const ACTIVE_TTL_MS = 60_000;
      let activeRecord: { expiresAt: number; attributesDigest: number; byEvent?: boolean } | null = null;
      vi.mocked(setActivePreselect).mockImplementation((_fieldKey, attributesDigest, byEvent) => {
        activeRecord = { expiresAt: Date.now() + ACTIVE_TTL_MS, attributesDigest, byEvent };
      });
      vi.mocked(getActivePreselect).mockImplementation(() =>
        activeRecord && activeRecord.expiresAt > Date.now() ? activeRecord : null,
      );

      const fireWithTier = (tier: string) =>
        maybeFirePreselectForEvent(state, host, buildCustomEvent(TRIGGER_EVENT_NAME, { [ATTRIBUTE_KEY]: tier }), PATHNAME);

      fireWithTier('first');
      fireWithTier('second');

      expect(selectPlacementsCalls).toHaveLength(1);

      vi.advanceTimersByTime(ACTIVE_TTL_MS);
      fireWithTier('third');

      expect(selectPlacementsCalls.map((call) => call.attributes)).toEqual([
        tagged({ [ATTRIBUTE_KEY]: 'first' }, 'event'),
        tagged({ [ATTRIBUTE_KEY]: 'third' }, 'event'),
      ]);
    });

    it('still lets a pageview refire when its attributes changed', () => {
      vi.mocked(getActivePreselect).mockReturnValue({ expiresAt: Date.now() + 60_000, attributesDigest: 1 });

      maybeFirePreselect(state, host, buildEvent({ [ATTRIBUTE_KEY]: 'changed' }), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(1);
    });

    it('is not displaced by a later pathname attempt', () => {
      host.isKitReady = () => false;
      const triggerEvent = buildCustomEvent(TRIGGER_EVENT_NAME, { [ATTRIBUTE_KEY]: 'from-event' });

      maybeFirePreselectForEvent(state, host, triggerEvent, PATHNAME);
      maybeFirePreselectForPathname(state, host, PATHNAME);

      expect(state.pending).toHaveLength(1);
      expect(state.pending[0].event).toBe(triggerEvent);
    });
  });

  describe('isPreselectTriggerEventName', () => {
    beforeEach(() => {
      mockConfig.current = [{ ...CONFIG_ENTRY, triggerEventNames: ['Ready to Checkout'] }];
    });

    it('matches a configured event name for the account', () => {
      expect(isPreselectTriggerEventName(ACCOUNT_ID, 'Ready to Checkout')).toBe(true);
    });

    it('does not match another name, another account or a missing account', () => {
      expect(isPreselectTriggerEventName(ACCOUNT_ID, 'Add to Cart')).toBe(false);
      expect(isPreselectTriggerEventName('other-account', 'Ready to Checkout')).toBe(false);
      expect(isPreselectTriggerEventName(null, 'Ready to Checkout')).toBe(false);
      expect(isPreselectTriggerEventName(ACCOUNT_ID, undefined)).toBe(false);
    });

    it('reads the names from a preselectionConfig setting in place of the built-in entries', () => {
      const setting = JSON.stringify({
        schemaVersion: 1,
        entries: [
          {
            pathname: PATHNAME,
            targetPageIdentifier: TARGET_PAGE_IDENTIFIER,
            attributeKeys: [ATTRIBUTE_KEY],
            triggerEventNames: ['Order Review'],
          },
        ],
      });

      try {
        expect(applyPreselectionConfigSetting(ACCOUNT_ID, setting)).toBeUndefined();

        expect(isPreselectTriggerEventName(ACCOUNT_ID, 'Order Review')).toBe(true);
        expect(isPreselectTriggerEventName(ACCOUNT_ID, 'Ready to Checkout')).toBe(false);
      } finally {
        applyPreselectionConfigSetting(ACCOUNT_ID, undefined);
      }
    });
  });

  describe('findPreselectionConfigByIdentifier', () => {
    beforeEach(() => {
      mockConfig.current = [CONFIG_ENTRY];
    });

    it('returns the matching entry for the account and target page identifier', () => {
      expect(findPreselectionConfigByIdentifier(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER)).toEqual(CONFIG_ENTRY);
    });

    it('returns undefined when accountId is missing', () => {
      expect(findPreselectionConfigByIdentifier(null, TARGET_PAGE_IDENTIFIER)).toBeUndefined();
    });

    it('returns undefined when identifier is not a string', () => {
      expect(findPreselectionConfigByIdentifier(ACCOUNT_ID, 123)).toBeUndefined();
    });

    it('returns undefined when no entry matches the identifier', () => {
      expect(findPreselectionConfigByIdentifier(ACCOUNT_ID, 'some-other-page')).toBeUndefined();
    });
  });

  describe('isPreselectAttributeKey', () => {
    beforeEach(() => {
      mockConfig.current = [CONFIG_ENTRY];
    });

    it('returns true when the key is configured for the account', () => {
      expect(isPreselectAttributeKey(ACCOUNT_ID, ATTRIBUTE_KEY)).toBe(true);
    });

    it('returns false when accountId is missing', () => {
      expect(isPreselectAttributeKey(null, ATTRIBUTE_KEY)).toBe(false);
    });

    it('returns false when the key is not configured for the account', () => {
      expect(isPreselectAttributeKey(ACCOUNT_ID, 'not-a-configured-key')).toBe(false);
    });

    it('returns false when no entry matches the account', () => {
      expect(isPreselectAttributeKey('some-other-account', ATTRIBUTE_KEY)).toBe(false);
    });
  });

  describe('applyPreselectionConfigSetting', () => {
    const SETTING_PATHNAME = '/setting-checkout';
    const SETTING_IDENTIFIER = 'setting-target-page';
    const SETTING_ATTRIBUTE_KEY = 'email';
    const setting = JSON.stringify({
      schemaVersion: 1,
      entries: [
        {
          pathname: SETTING_PATHNAME,
          targetPageIdentifier: SETTING_IDENTIFIER,
          attributeKeys: [SETTING_ATTRIBUTE_KEY],
        },
      ],
    });

    beforeEach(() => {
      mockConfig.current = [CONFIG_ENTRY];
    });

    afterEach(() => {
      applyPreselectionConfigSetting(ACCOUNT_ID, undefined);
    });

    it('replaces the built-in entries for the account with the setting entries', () => {
      expect(applyPreselectionConfigSetting(ACCOUNT_ID, setting)).toBeUndefined();

      expect(findPreselectionConfig(ACCOUNT_ID, SETTING_PATHNAME)).toEqual({
        accountId: ACCOUNT_ID,
        pathname: SETTING_PATHNAME,
        targetPageIdentifier: SETTING_IDENTIFIER,
        attributeKeys: [SETTING_ATTRIBUTE_KEY],
      });
      expect(findPreselectionConfig(ACCOUNT_ID, PATHNAME)).toBeUndefined();
      expect(findPreselectionConfigByIdentifier(ACCOUNT_ID, SETTING_IDENTIFIER)?.pathname).toBe(SETTING_PATHNAME);
      expect(isPreselectAttributeKey(ACCOUNT_ID, SETTING_ATTRIBUTE_KEY)).toBe(true);
      expect(isPreselectAttributeKey(ACCOUNT_ID, ATTRIBUTE_KEY)).toBe(false);
    });

    it('leaves other accounts on the built-in entries', () => {
      const otherEntry = { ...CONFIG_ENTRY, accountId: 'some-other-account' };
      mockConfig.current = [CONFIG_ENTRY, otherEntry];

      applyPreselectionConfigSetting(ACCOUNT_ID, setting);

      expect(findPreselectionConfig('some-other-account', PATHNAME)).toEqual(otherEntry);
    });

    it('turns preselection off for the account when the setting has no entries', () => {
      const emptySetting = JSON.stringify({ schemaVersion: 1, entries: [] });

      expect(applyPreselectionConfigSetting(ACCOUNT_ID, emptySetting)).toBeUndefined();

      expect(hasPreselectionConfigForAccount(ACCOUNT_ID)).toBe(false);
    });

    it('keeps the built-in entries and returns the reason when the setting is invalid', () => {
      expect(applyPreselectionConfigSetting(ACCOUNT_ID, '{not json')).toBe('invalid JSON');

      expect(findPreselectionConfig(ACCOUNT_ID, PATHNAME)).toEqual(CONFIG_ENTRY);
    });

    it('rejects the whole setting and restores built-in entries for an invalid route-release flag', () => {
      applyPreselectionConfigSetting(ACCOUNT_ID, setting);
      const validEntry = JSON.parse(setting).entries[0];
      const invalidSetting = JSON.stringify({ schemaVersion: 1, entries: [
        validEntry,
        { ...validEntry, targetPageIdentifier: 'another-target', releaseHoldOnRouteChange: 'true' },
      ] });

      expect(applyPreselectionConfigSetting(ACCOUNT_ID, invalidSetting)).toBe('entry 2 releaseHoldOnRouteChange');
      expect(findPreselectionConfig(ACCOUNT_ID, PATHNAME)).toEqual(CONFIG_ENTRY);
      expect(findPreselectionConfig(ACCOUNT_ID, SETTING_PATHNAME)).toBeUndefined();
    });

    it('drops an earlier setting when the next init has none', () => {
      applyPreselectionConfigSetting(ACCOUNT_ID, setting);

      expect(applyPreselectionConfigSetting(ACCOUNT_ID, undefined)).toBeUndefined();

      expect(findPreselectionConfig(ACCOUNT_ID, PATHNAME)).toEqual(CONFIG_ENTRY);
      expect(findPreselectionConfig(ACCOUNT_ID, SETTING_PATHNAME)).toBeUndefined();
    });
  });
  describe('email input fallback', () => {
    const EMAIL_ENTRY = {
      accountId: ACCOUNT_ID,
      pathname: PATHNAME,
      targetPageIdentifier: TARGET_PAGE_IDENTIFIER,
      attributeKeys: ['email', ATTRIBUTE_KEY],
      optionalAttributeKeys: [ATTRIBUTE_KEY],
      identityKeys: ['email'],
      readEmailInput: true,
    };
    const guest = {
      getUserIdentities: () => ({ userIdentities: {} }),
      getMPID: () => MPID,
    } as unknown as PreselectHost['filteredUser'];
    const queueOnRoute = (eventAttributes: Record<string, unknown> = {}, pathname = PATHNAME) => {
      state.pending = [{ event: buildEvent(eventAttributes), pathname, waitingFor: 'attribute' }];
    };
    // An input holding a value; `touched` marks it as one the shopper typed into or autofilled.
    const addInput = (value: string, type = 'email', touched = true): HTMLInputElement => {
      const input = document.createElement('input');
      input.type = type;
      input.value = value;
      document.body.appendChild(input);
      if (touched) shopperTouch(input);
      return input;
    };

    beforeEach(() => {
      mockConfig.current = [EMAIL_ENTRY];
      host.filteredUser = guest;
      host.isForwardingAllowed = () => true;
      window.history.replaceState({}, '', PATHNAME);
    });

    afterEach(() => {
      document.body.innerHTML = '';
      window.history.replaceState({}, '', '/');
    });

    it('fires for a guest with the email typed into the form, trimmed and otherwise as typed', () => {
      addInput('  Guest@Example.com ');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(1);
      expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ email: 'Guest@Example.com' }));
      expect(recordPreselectTrigger).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER, true);
      expect(loggedDiagnostics).toContainEqual(
        expect.objectContaining({ code: 'PRESELECT_FIRED', message: expect.stringContaining('[email_source=input]') }),
      );
    });

    it('treats an email and a confirm-email field that match as one email', () => {
      addInput('Guest@Example.com');
      addInput(' guest@example.com ');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ email: 'Guest@Example.com' }));
    });

    it('reads nothing for an entry that has not opted in, and keeps the guest waiting', () => {
      mockConfig.current = [{ ...EMAIL_ENTRY, readEmailInput: undefined }];
      addInput('guest@example.com');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(state.pending).toEqual([expect.objectContaining({ waitingFor: 'identity' })]);
      expect(recordPreselectTrigger).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER, false);
    });

    it('logs no error text when a call carrying a typed email is rejected', async () => {
      host.selectPlacements = () => Promise.reject(new Error('bad attribute email=Guest@Example.com'));
      addInput('Guest@Example.com');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(loggedEvents).toContainEqual(expect.objectContaining({ code: 'PRESELECT_DISPATCH_FAILED' }));
      expect(JSON.stringify(loggedEvents)).not.toContain('Guest@Example.com');
    });

    it('waits on missing_attribute:email for a guest on an opted-in entry', () => {
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(loggedDiagnostics).toContainEqual(
        expect.objectContaining({
          code: 'PRESELECT_MISSED',
          message: expect.stringContaining('missing_attribute:email'),
        }),
      );
      expect(recordPreselectTrigger).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER, false);
    });

    it('records nothing and logs no fired line when this connection is no longer allowed', () => {
      host.filteredUser = {
        getUserIdentities: () => ({ userIdentities: { customerid: 'c-1' } }),
        getMPID: () => MPID,
      } as unknown as PreselectHost['filteredUser'];
      host.userAttributes = { email: 'partner@example.com' };
      host.isForwardingAllowed = () => false;

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(setActivePreselect).not.toHaveBeenCalled();
      expect(recordPreselectFired).not.toHaveBeenCalled();
      expect(loggedDiagnostics).not.toContainEqual(expect.objectContaining({ code: 'PRESELECT_FIRED' }));
    });

    it('logs no error text when selectPlacements throws on a call carrying a typed email', () => {
      host.selectPlacements = () => {
        throw new Error('bad attribute email=Guest@Example.com');
      };
      addInput('Guest@Example.com');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(loggedEvents).toContainEqual(expect.objectContaining({ code: 'PRESELECT_DISPATCH_FAILED' }));
      expect(JSON.stringify(loggedEvents)).not.toContain('Guest@Example.com');
    });

    it('forgets the fire when selectPlacements throws, so it does not hold off the next one', () => {
      host.selectPlacements = () => {
        throw new Error('boom');
      };
      addInput('guest@example.com');
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      expect(recordPreselectFired).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER, expect.any(Number), false);
      expect(restorePreselectFired).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER, undefined, expect.any(Number));
      expect(restoreActivePreselect).toHaveBeenCalledWith(FIELD_KEY, null, expect.any(Number));
    });

    it('forgets the fire when the selectPlacements call rejects', async () => {
      host.selectPlacements = () => Promise.reject(new Error('rejected'));
      addInput('guest@example.com');
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      await Promise.resolve();
      await Promise.resolve();
      expect(restorePreselectFired).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER, undefined, expect.any(Number));
    });

    it('rolls back only once when the call drops itself and then fails', () => {
      host.selectPlacements = (options) => {
        getPreselectRollback(options)?.();
        throw new Error('boom');
      };
      addInput('guest@example.com');
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      expect(restorePreselectFired).toHaveBeenCalledTimes(1);
      expect(restoreActivePreselect).toHaveBeenCalledTimes(1);
    });

    it('does not read the form for the trigger record when the event carries an email', () => {
      addInput('typed@example.com');
      const querySpy = vi.spyOn(document, 'querySelectorAll');

      maybeFirePreselect(state, host, buildEvent({ email: 'event@example.com' }), PATHNAME);

      expect(recordPreselectTrigger).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER, true);
      expect(querySpy).not.toHaveBeenCalled();
      querySpy.mockRestore();
    });

    it('never reads the form under do-not-share-or-sell or Global Privacy Control', () => {
      host.isPreselectionPrivacyAllowed = () => false;
      addInput('guest@example.com');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it('never reads the form when this connection filters out the Email identity', () => {
      host.isEmailIdentityFiltered = () => true;
      addInput('guest@example.com');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it.each([
      { label: 'a hashed email identity', setup: () => (host.getUserIdentities = () => ({ emailsha256: 'abc123' })) },
      {
        label: 'an unfiltered identity mapped to the hashed email',
        setup: () => {
          host.mappedEmailSha256Key = 'other';
          host.getCurrentUser = () =>
            ({ getUserIdentities: () => ({ userIdentities: { other: 'abc123' } }) }) as unknown as ReturnType<
              NonNullable<PreselectHost['getCurrentUser']>
            >;
        },
      },
      { label: 'an attribute keyed Email', setup: () => (host.userAttributes = { Email: 'Partner@example.com' }) },
      { label: 'an event attribute keyed Email', event: { Email: 'Partner@example.com' } },
      { label: 'a hashed email on the event', event: { emailsha256: 'abc123' } },
    ])('treats $label as a partner email and never reads the form', ({ setup, event }) => {
      setup?.();
      addInput('guest@example.com');

      maybeFirePreselect(state, host, buildEvent(event), PATHNAME);

      expect(selectPlacementsCalls.map((call) => call.attributes)).not.toContainEqual(
        expect.objectContaining({ email: 'guest@example.com' }),
      );
    });

    it('never reads the form for an identified user on an entry that has not opted in', () => {
      mockConfig.current = [{ ...EMAIL_ENTRY, readEmailInput: undefined }];
      host.filteredUser = {
        getUserIdentities: () => ({ userIdentities: { customerid: 'c-1' } }),
        getMPID: () => MPID,
      } as unknown as PreselectHost['filteredUser'];
      addInput('guest@example.com');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it.each([
      { label: 'identity', user: { getUserIdentities: () => ({ userIdentities: { email: 'known@example.com' } }) } },
      { label: 'user attribute', user: { getAllUserAttributes: () => ({ email: 'known@example.com' }) } },
    ])('never reads the form when this connection filters out the email $label', ({ user }) => {
      host.getCurrentUser = () => user as unknown as ReturnType<NonNullable<PreselectHost['getCurrentUser']>>;
      addInput('guest@example.com');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it('accepts readEmailInput from a setting only on an entry that declares email', () => {
      const settingFor = (attributeKeys: string[]) =>
        JSON.stringify({
          schemaVersion: 1,
          entries: [
            { pathname: PATHNAME, targetPageIdentifier: TARGET_PAGE_IDENTIFIER, attributeKeys, readEmailInput: true },
          ],
        });
      try {
        expect(applyPreselectionConfigSetting(ACCOUNT_ID, settingFor(['email']))).toBeUndefined();
        expect(findPreselectionConfig(ACCOUNT_ID, PATHNAME)?.readEmailInput).toBe(true);
        expect(applyPreselectionConfigSetting(ACCOUNT_ID, settingFor(['emailsha256']))).toContain('readEmailInput');
        const optionalEmail = JSON.stringify({
          schemaVersion: 1,
          entries: [
            {
              pathname: PATHNAME,
              targetPageIdentifier: TARGET_PAGE_IDENTIFIER,
              attributeKeys: ['email'],
              optionalAttributeKeys: ['email'],
              readEmailInput: true,
            },
          ],
        });
        expect(applyPreselectionConfigSetting(ACCOUNT_ID, optionalEmail)).toContain('readEmailInput');
        // A guest passes the identity gate only while email is required, so a widened tab would never read it.
        // Each widened entry declares a disjoint identity key, so readEmailInput is the field that fails.
        const widenedOptionalEmail = JSON.stringify({
          schemaVersion: 1,
          entries: [
            {
              pathname: PATHNAME,
              targetPageIdentifier: TARGET_PAGE_IDENTIFIER,
              attributeKeys: ['email', 'customerid'],
              widenedOptionalAttributeKeys: ['email'],
              identityKeys: ['customerid'],
              readEmailInput: true,
            },
          ],
        });
        expect(applyPreselectionConfigSetting(ACCOUNT_ID, widenedOptionalEmail)).toContain('readEmailInput');
        // The rule applies whenever readEmailInput is set, so a false one is rejected the same way.
        const widenedOptionalEmailOff = JSON.stringify({
          schemaVersion: 1,
          entries: [
            {
              pathname: PATHNAME,
              targetPageIdentifier: TARGET_PAGE_IDENTIFIER,
              attributeKeys: ['email', 'customerid'],
              widenedOptionalAttributeKeys: ['email'],
              identityKeys: ['customerid'],
              readEmailInput: false,
            },
          ],
        });
        expect(applyPreselectionConfigSetting(ACCOUNT_ID, widenedOptionalEmailOff)).toContain('readEmailInput');
        // Optional keys match in any casing at runtime, so a widened 'Email' makes email optional too.
        const widenedOptionalEmailCased = JSON.stringify({
          schemaVersion: 1,
          entries: [
            {
              pathname: PATHNAME,
              targetPageIdentifier: TARGET_PAGE_IDENTIFIER,
              attributeKeys: ['email', 'Email', 'customerid'],
              widenedOptionalAttributeKeys: ['Email'],
              identityKeys: ['customerid'],
              readEmailInput: true,
            },
          ],
        });
        expect(applyPreselectionConfigSetting(ACCOUNT_ID, widenedOptionalEmailCased)).toContain('readEmailInput');
      } finally {
        applyPreselectionConfigSetting(ACCOUNT_ID, undefined);
      }
    });

    it('also reads an input marked autocomplete=email', () => {
      addInput('guest@example.com', 'text').setAttribute('autocomplete', 'email');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ email: 'guest@example.com' }));
    });

    it('reads an email typed into a type="text" field', () => {
      addInput(' guest@example.com ', 'text');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(1);
      expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ email: 'guest@example.com' }));
      expect(loggedDiagnostics).toContainEqual(
        expect.objectContaining({ code: 'PRESELECT_FIRED', message: expect.stringContaining('[email_source=input]') }),
      );
    });

    it('reads an email typed into a field with no type attribute', () => {
      const input = document.createElement('input');
      input.value = 'guest@example.com';
      document.body.appendChild(input);
      shopperTouch(input);

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(input.hasAttribute('type')).toBe(false);
      expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ email: 'guest@example.com' }));
    });

    it('ignores a text field that does not hold an email, and never sends or logs its value', () => {
      addInput('Jane Shopper', 'text');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(state.pending).toEqual([expect.objectContaining({ waitingFor: 'attribute' })]);
      expect(JSON.stringify([loggedDiagnostics, loggedEvents, state.pending])).not.toContain('Jane Shopper');
    });

    it.each([
      { label: 'a hidden input', build: () => addInput('guest@example.com', 'hidden') },
      { label: 'a password input', build: () => addInput('guest@example.com', 'password') },
      {
        label: 'a hidden input marked autocomplete=email',
        build: () => addInput('guest@example.com', 'hidden').setAttribute('autocomplete', 'email'),
      },
      {
        label: 'a password input marked autocomplete=email',
        build: () => addInput('guest@example.com', 'password').setAttribute('autocomplete', 'email'),
      },
      { label: 'a search input', build: () => addInput('guest@example.com', 'search') },
      { label: 'a tel input', build: () => addInput('guest@example.com', 'tel') },
      {
        label: 'a textarea',
        build: () => {
          const textarea = document.createElement('textarea');
          textarea.value = 'guest@example.com';
          document.body.appendChild(textarea);
          shopperTouch(textarea);
        },
      },
      {
        label: 'a contenteditable element',
        build: () => {
          const editable = document.createElement('div');
          editable.contentEditable = 'true';
          editable.textContent = 'guest@example.com';
          document.body.appendChild(editable);
          shopperTouch(editable);
        },
      },
    ])('never reads an email held in $label', ({ build }) => {
      build();

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it('reads nothing when an email field and a text field hold different emails', () => {
      addInput('guest@example.com');
      addInput('recipient@example.com', 'text');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it('reads the same email once from an email field and a text field that differ in case or spacing', () => {
      addInput('Guest@Example.com');
      addInput('  guest@example.com ', 'text');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(1);
      expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ email: 'Guest@Example.com' }));
    });

    it('still reads the one email when another text field holds something else', () => {
      addInput('Jane Shopper', 'text');
      addInput('guest@example.com', 'text');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ email: 'guest@example.com' }));
    });

    it.each([
      { label: 'a text field holding an email', type: 'text', value: ' guest@example.com ', expected: true },
      { label: 'a field with no type holding an email', type: undefined, value: 'guest@example.com', expected: true },
      { label: 'a text field holding something else', type: 'text', value: 'Jane Shopper', expected: false },
      { label: 'an empty text field', type: 'text', value: '', expected: false },
      { label: 'an empty email field', type: 'email', value: '', expected: true },
      { label: 'a hidden input holding an email', type: 'hidden', value: 'guest@example.com', expected: false },
      { label: 'a password input holding an email', type: 'password', value: 'guest@example.com', expected: false },
    ])('treats a change on $label as an email input: $expected', ({ type, value, expected }) => {
      const input = document.createElement('input');
      if (type) input.type = type;
      input.value = value;
      queueOnRoute();

      expect(isReadableFormEmailChange(state, host, shopperEvent(input))).toBe(expected);
    });

    it('treats a change on a textarea holding an email as no email input', () => {
      const textarea = document.createElement('textarea');
      textarea.value = 'guest@example.com';
      queueOnRoute();

      expect(isReadableFormEmailChange(state, host, shopperEvent(textarea))).toBe(false);
      expect(isReadableFormEmailChange(state, host, shopperEvent(null))).toBe(false);
    });

    describe('a change on a text field', () => {
      // A text field whose value getter records every read, holding the guest's email.
      const watchedTextInput = () => {
        const input = document.createElement('input');
        input.type = 'text';
        document.body.appendChild(input);
        const read = vi.fn(() => 'guest@example.com');
        Object.defineProperty(input, 'value', { get: read, configurable: true });
        return { input, read };
      };

      it('counts once a dispatch queued on this route may read the form', () => {
        const { input, read } = watchedTextInput();
        queueOnRoute();

        expect(isReadableFormEmailChange(state, host, shopperEvent(input))).toBe(true);
        expect(read).toHaveBeenCalled();
      });

      it.each([
        {
          label: 'after the user opts out or consent drops the kit',
          setup: () => (host.isForwardingAllowed = () => false),
        },
        {
          label: 'when the host cannot say whether forwarding is allowed',
          setup: () => (host.isForwardingAllowed = undefined),
        },
        {
          label: 'under do-not-share-or-sell or Global Privacy Control',
          setup: () => (host.isPreselectionPrivacyAllowed = () => false),
        },
        { label: 'once targeting is disabled', setup: () => (host.isTargetingDisabled = () => true) },
        {
          label: 'when this connection filters out the Email identity',
          setup: () => (host.isEmailIdentityFiltered = () => true),
        },
        {
          label: 'when the partner already supplies an email',
          setup: () => (host.userAttributes = { email: 'partner@example.com' }),
        },
        {
          label: 'for an entry that has not opted in',
          setup: () => (mockConfig.current = [{ ...EMAIL_ENTRY, readEmailInput: undefined }]),
        },
        { label: 'off the entry route', setup: () => window.history.replaceState({}, '', '/elsewhere') },
        { label: 'with nothing queued', setup: () => (state.pending = []) },
        { label: 'when only another route has a dispatch queued', setup: () => queueOnRoute({}, '/elsewhere') },
        {
          label: 'when the queued event carries an email and waits on another attribute',
          setup: () => queueOnRoute({ email: 'event@example.com' }),
        },
        { label: 'when the queued event carries a hashed email', setup: () => queueOnRoute({ emailsha256: 'abc123' }) },
      ])('never reads its value $label', ({ setup }) => {
        const { input, read } = watchedTextInput();
        queueOnRoute();
        setup();

        expect(isReadableFormEmailChange(state, host, shopperEvent(input))).toBe(false);
        expect(read).not.toHaveBeenCalled();
      });
    });

    describe('fields the shopper touched', () => {
      it('never fills the call from a text field holding an email the shopper never touched', () => {
        addInput('guest@example.com', 'text', false);

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
        expect(state.pending).toEqual([expect.objectContaining({ waitingFor: 'attribute' })]);
      });

      it('reads the same field once the shopper types into or autofills it', () => {
        const input = addInput('guest@example.com', 'text', false);
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        expect(selectPlacementsCalls).toHaveLength(0);

        shopperTouch(input, 'change');
        flushPendingPreselectDispatches(state, host, PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(1);
        expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ email: 'guest@example.com' }));
      });

      it.each(['input', 'change'])('never counts an untrusted %s event dispatched by script', (type) => {
        const input = addInput('guest@example.com', 'text', false);
        recordShopperInput({ type, isTrusted: false, target: input } as unknown as Event);

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
      });

      it("reads nothing when the shopper's email field is empty and an untouched field holds an email", () => {
        addInput('', 'email');
        addInput('someone-else@example.com', 'text', false);

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
      });

      it('reads nothing when two touched fields hold different emails', () => {
        addInput('guest@example.com', 'text');
        addInput('recipient@example.com', 'text');

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
      });

      it('ignores an untouched field when a touched one holds the email', () => {
        addInput('guest@example.com', 'text');
        addInput('someone-else@example.com', 'text', false);

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ email: 'guest@example.com' }));
      });

      it('never reads a touched field once it leaves the page', () => {
        addInput('guest@example.com', 'text').remove();

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
      });

      it('never reads a touched field that has since become a password input', () => {
        addInput('guest@example.com', 'text').type = 'password';

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
      });

      it('never reads a touched field after a script overwrites it and dispatches an event', () => {
        const input = addInput('guest@example.com', 'text');
        input.value = 'someone-else@example.com';
        recordShopperInput({ type: 'change', isTrusted: false, target: input } as unknown as Event);

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
      });

      it('never reads an overwritten field when the queue flushes', () => {
        const input = addInput('', 'text');
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        expect(state.pending).toHaveLength(1);

        input.value = 'someone-else@example.com';
        recordShopperInput({ type: 'input', isTrusted: false, target: input } as unknown as Event);
        flushPendingPreselectDispatches(state, host, PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
      });

      it.each([
        { label: 'on the page view', flushes: false },
        { label: 'when the queue flushes', flushes: true },
      ])('never reads a touched field a script switched type, overwrote and switched back, $label', ({ flushes }) => {
        const input = addInput(flushes ? '' : 'guest@example.com', 'text');
        if (flushes) maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        input.type = 'password';
        input.value = 'someone-else@example.com';
        recordShopperInput({ type: 'change', isTrusted: false, target: input } as unknown as Event);
        input.type = 'text';

        if (flushes) flushPendingPreselectDispatches(state, host, PATHNAME);
        else maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
      });

      it.each([
        { label: 'on the page view', flushes: false },
        { label: 'when the queue flushes', flushes: true },
      ])('never reads a touched field a script overwrote while it was detached, $label', ({ flushes }) => {
        const input = addInput(flushes ? '' : 'guest@example.com', 'text');
        if (flushes) maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        input.remove();
        input.value = 'someone-else@example.com';
        input.dispatchEvent(new Event('change'));
        document.body.appendChild(input);

        if (flushes) flushPendingPreselectDispatches(state, host, PATHNAME);
        else maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
      });

      it('reads the field again once the shopper edits it after a script did', () => {
        const input = addInput('guest@example.com', 'text');
        recordShopperInput({ type: 'input', isTrusted: false, target: input } as unknown as Event);
        shopperTouch(input, 'change');

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ email: 'guest@example.com' }));
      });

      it.each(
        OVERWRITING_HANDLERS.flatMap((handler) => [
          { handler, label: handler.label, path: 'on the page view', flushes: false },
          { handler, label: handler.label, path: 'when the queue flushes', flushes: true },
        ]),
      )("never reads a field a capture handler $label during the shopper's event, $path", ({ handler, flushes }) => {
        if (flushes) maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        typeIntoOverwritingForm('guest@example.com', handler);

        if (flushes) flushPendingPreselectDispatches(state, host, PATHNAME);
        else maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
        expect(state.pending).toEqual([expect.objectContaining({ waitingFor: 'attribute' })]);
      });

      it.each(
        REUSED_EVENT_OVERWRITES.flatMap((reuse) => [
          { ...reuse, path: 'on the page view', flushes: false },
          { ...reuse, path: 'when the queue flushes', flushes: true },
        ]),
      )('never reads a touched field a script overwrote and announced with $label, $path', ({ overwrite, flushes }) => {
        if (flushes) maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        const { input, shopperEvent, scriptEvent } = touchAfterScriptChange('guest@example.com');
        overwrite(input, shopperEvent, scriptEvent);

        if (flushes) flushPendingPreselectDispatches(state, host, PATHNAME);
        else maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
        expect(state.pending).toEqual([expect.objectContaining({ waitingFor: 'attribute' })]);
      });

      it('reads the field once the shopper edits it again after a capture handler overwrote it', () => {
        const { form, input, overwrite } = typeIntoOverwritingForm('guest@example.com');
        form.removeEventListener('input', overwrite, true);

        input.value = 'guest@example.com';
        dispatchShopperEvent(input, 'input');
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ email: 'guest@example.com' }));
      });

      it('records a field once for a trusted event that both the document and the field hear', () => {
        listenLikeTheKit();
        const input = addInput('guest@example.com', 'text', false);
        dispatchShopperEvent(input, 'change');
        const addListener = vi.spyOn(input, 'addEventListener');
        dispatchShopperEvent(input, 'change');

        // One input and one change listener from the document's hearing; the field's hearing adds none.
        expect(addListener).toHaveBeenCalledTimes(2);
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ email: 'guest@example.com' }));
      });

      it('never reads a value while recording a touched field', () => {
        const input = document.createElement('input');
        input.type = 'text';
        document.body.appendChild(input);
        const read = vi.fn(() => 'guest@example.com');
        Object.defineProperty(input, 'value', { get: read, configurable: true });

        shopperTouch(input, 'input');
        shopperTouch(input, 'change');
        recordShopperInput({ type: 'change', isTrusted: false, target: input } as unknown as Event);

        expect(read).not.toHaveBeenCalled();
      });

      it('never counts an untrusted change as one that may flush the queue', () => {
        const input = addInput('guest@example.com', 'text');
        const scriptChange = { type: 'change', isTrusted: false, target: input } as unknown as Event;
        queueOnRoute();

        expect(isReadableFormEmailChange(state, host, scriptChange)).toBe(false);
      });
    });

    it('prefers an email the partner already supplied', () => {
      addInput('typed@example.com');
      host.userAttributes = { email: 'partner@example.com' };

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ email: 'partner@example.com' }));
      expect(loggedDiagnostics).not.toContainEqual(
        expect.objectContaining({ message: expect.stringContaining('email_source') }),
      );
    });

    it('queues an empty form and fires once the email is typed and the queue flushes', () => {
      const input = addInput('');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      expect(selectPlacementsCalls).toHaveLength(0);
      expect(state.pending).toEqual([expect.objectContaining({ waitingFor: 'attribute' })]);

      input.value = 'guest@example.com';
      flushPendingPreselectDispatches(state, host, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(1);
      expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ email: 'guest@example.com' }));
    });

    it.each([
      { label: 'is not a valid email', values: ['not-an-email'] },
      { label: 'holds two different emails', values: ['one@example.com', 'two@example.com'] },
    ])('ignores a form that $label', ({ values }) => {
      values.forEach((value) => addInput(value));

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it('reads nothing when the page is not the entry route', () => {
      addInput('guest@example.com');
      window.history.replaceState({}, '', '/elsewhere');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it('never overrides an email identity, even on an entry without identityKeys', () => {
      mockConfig.current = [{ ...EMAIL_ENTRY, identityKeys: undefined }];
      host.filteredUser = {
        getUserIdentities: () => ({ userIdentities: { email: 'known@example.com' } }),
        getMPID: () => MPID,
      } as unknown as PreselectHost['filteredUser'];
      host.getUserIdentities = () => ({ email: 'known@example.com' });
      addInput('typed@example.com');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(loggedDiagnostics).toContainEqual(
        expect.objectContaining({
          code: 'PRESELECT_MISSED',
          message: expect.stringContaining('missing_attribute:email'),
        }),
      );
    });

    it('marks a form email transient on the dispatch and never on a partner one', () => {
      addInput('guest@example.com');
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      expect(selectPlacementsCalls[0].preselectFormEmail).toEqual({ key: 'email', mpid: MPID });

      host.userAttributes = { email: 'partner@example.com' };
      vi.mocked(getActivePreselect).mockReturnValue(null);
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      expect(selectPlacementsCalls[1].preselectFormEmail).toBeUndefined();
    });

    it('does not store a form email in the recovery snapshot while the launcher is not ready', () => {
      host.filteredUser = {
        getUserIdentities: () => ({ userIdentities: { customerid: 'c-1' } }),
        getMPID: () => MPID,
      } as unknown as PreselectHost['filteredUser'];
      host.isKitReady = () => false;
      addInput('guest@example.com');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(setPendingPreselect).not.toHaveBeenCalled();
      expect(state.pending).toHaveLength(1);
    });

    it('lets a live partner email win over the form when the cached copy is empty', () => {
      host.userAttributes = { email: '' };
      host.filteredUser = {
        ...(guest as object),
        getAllUserAttributes: () => ({ email: 'partner@example.com' }),
      } as unknown as PreselectHost['filteredUser'];
      addInput('typed@example.com');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(1);
      expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ email: 'partner@example.com' }));
    });

    it('lets a guest with a partner email through without reading the form', () => {
      host.userAttributes = { email: 'partner@example.com' };
      addInput('typed@example.com');
      const querySpy = vi.spyOn(document, 'querySelectorAll');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls[0].attributes).toEqual(tagged({ email: 'partner@example.com' }));
      expect(querySpy).not.toHaveBeenCalled();
      querySpy.mockRestore();
    });

    it.each([
      { label: 'after the user opts out or consent drops the kit', allowed: () => false },
      { label: 'when the host cannot say', allowed: undefined },
    ])('never reads the form $label, including from a running hold', ({ allowed }) => {
      mockConfig.current = [{ ...EMAIL_ENTRY, dispatchDelayMs: 1000 }];
      host.filteredUser = {
        getUserIdentities: () => ({ userIdentities: { customerid: 'c-1' } }),
        getMPID: () => MPID,
      } as unknown as PreselectHost['filteredUser'];
      addInput('guest@example.com');
      vi.useFakeTimers();
      try {
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        host.isForwardingAllowed = allowed;
        vi.advanceTimersByTime(1000);
      } finally {
        vi.useRealTimers();
      }

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it('never fills an entry that does not declare email', () => {
      mockConfig.current = [
        { ...EMAIL_ENTRY, attributeKeys: ['emailsha256'], identityKeys: undefined, optionalAttributeKeys: undefined },
      ];
      addInput('guest@example.com');

      maybeFirePreselect(state, host, buildEvent(), PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    describe('the email miss reason', () => {
      const EMAIL_MISS_REASONS = [
        'read_disabled',
        'off_route',
        'privacy_blocked',
        'email_filtered',
        'partner_email',
        'multiple_emails',
        'untrusted_fill',
        'unseen_fill',
        'no_field',
      ];
      const emailMissLines = () =>
        loggedDiagnostics.filter((entry) => entry.message.includes('[reason=missing_attribute:email]'));
      // The one missing-email line's reason, after checking it comes from the closed set.
      const emailReason = () => {
        const lines = emailMissLines();
        expect(lines).toHaveLength(1);
        const reason = /\[email_reason=([^\]]*)\]/.exec(lines[0].message)?.[1];
        expect(EMAIL_MISS_REASONS).toContain(reason);
        return reason;
      };
      const fire = () => maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      const identify = () => {
        host.filteredUser = {
          getUserIdentities: () => ({ userIdentities: { customerid: 'c-1' } }),
          getMPID: () => MPID,
        } as unknown as PreselectHost['filteredUser'];
      };

      it('is no_field when no field holds an email', () => {
        addInput('guest@', 'email');
        addInput('Jane', 'text', false);

        fire();

        expect(emailReason()).toBe('no_field');
      });

      it('is unseen_fill when an email sits in a field that heard no input or change event', () => {
        addInput('guest@example.com', 'text', false);

        fire();

        expect(emailReason()).toBe('unseen_fill');
      });

      it.each(['input', 'change'])('is untrusted_fill when a script fills a field and announces it with %s', (type) => {
        listenLikeTheKit();
        const input = addInput('guest@example.com', 'email', false);
        input.dispatchEvent(new Event(type, { bubbles: true }));

        fire();

        expect(selectPlacementsCalls).toHaveLength(0);
        expect(emailReason()).toBe('untrusted_fill');
      });

      it('is untrusted_fill for a touched field a script later overwrote, ahead of an unseen fill after it', () => {
        const input = addInput('guest@example.com', 'text');
        recordShopperInput({ type: 'change', isTrusted: false, target: input } as unknown as Event);
        addInput('other@example.com', 'text', false);

        fire();

        expect(emailReason()).toBe('untrusted_fill');
      });

      it.each([
        { label: 'while it is an email candidate', candidateFirst: true },
        { label: 'while it is not an email candidate', candidateFirst: false },
      ])("clears a field's script mark once the shopper's own event is heard on it $label", ({ candidateFirst }) => {
        const input = addInput('guest@example.com', 'text', false);
        recordShopperInput({ type: 'input', isTrusted: false, target: input } as unknown as Event);
        if (candidateFirst) shopperTouch(input);
        input.type = 'password';
        shopperTouch(input);
        input.type = 'text';

        fire();

        expect(emailReason()).toBe('unseen_fill');
      });

      it("keeps the script mark when the shopper's event reaches the field after a script overwrote it", () => {
        typeIntoOverwritingForm('guest@example.com');

        fire();

        expect(emailReason()).toBe('untrusted_fill');
      });

      it('is multiple_emails when touched fields hold different emails', () => {
        addInput('guest@example.com', 'text');
        addInput('recipient@example.com', 'text');

        fire();

        expect(emailReason()).toBe('multiple_emails');
      });

      it('never tests a value longer than an email can be', () => {
        addInput(`${'a'.repeat(250)}@example.com`, 'text', false);

        fire();

        expect(emailReason()).toBe('no_field');
      });

      it('is read_disabled for an entry that has not opted in', () => {
        mockConfig.current = [{ ...EMAIL_ENTRY, readEmailInput: undefined }];
        identify();
        addInput('guest@example.com');

        fire();

        expect(emailReason()).toBe('read_disabled');
      });

      it("is off_route when the page is no longer the entry's route", () => {
        addInput('guest@example.com');
        window.history.replaceState({}, '', '/elsewhere');

        fire();

        expect(emailReason()).toBe('off_route');
      });

      it.each([
        {
          label: 'after the user opts out or consent drops the kit',
          setup: () => (host.isForwardingAllowed = () => false),
        },
        { label: 'when the host cannot say', setup: () => (host.isForwardingAllowed = undefined) },
      ])('is privacy_blocked $label', ({ setup }) => {
        setup();
        addInput('guest@example.com');

        fire();

        expect(emailReason()).toBe('privacy_blocked');
      });

      it('is email_filtered when this connection filters out the Email identity', () => {
        host.isEmailIdentityFiltered = () => true;
        addInput('guest@example.com');

        fire();

        expect(emailReason()).toBe('email_filtered');
      });

      it('is partner_email when the partner supplies a hashed email instead', () => {
        host.getUserIdentities = () => ({ emailsha256: 'abc123' });
        addInput('guest@example.com');

        fire();

        expect(emailReason()).toBe('partner_email');
      });

      it.each([
        { label: 'privacy blocks the read', setup: () => (host.isForwardingAllowed = () => false) },
        {
          label: 'the partner supplies an email',
          setup: () => (host.getUserIdentities = () => ({ emailsha256: 'abc' })),
        },
      ])('reads no field value when $label', ({ setup }) => {
        setup();
        const input = addInput('', 'text', false);
        const read = vi.fn(() => 'guest@example.com');
        Object.defineProperty(input, 'value', { get: read, configurable: true });

        fire();

        expect(emailMissLines()).toHaveLength(1);
        expect(read).not.toHaveBeenCalled();
      });

      it('goes only on the email line, never on another missing key', () => {
        mockConfig.current = [{ ...EMAIL_ENTRY, optionalAttributeKeys: undefined }];

        fire();

        const otherLines = loggedDiagnostics.filter((entry) =>
          entry.message.includes(`[reason=missing_attribute:${ATTRIBUTE_KEY}]`),
        );
        expect(otherLines).toHaveLength(1);
        expect(otherLines[0].message).not.toContain('email_reason');
        expect(emailReason()).toBe('no_field');
      });

      it.each([
        { label: 'an unseen fill', touched: [], untouched: ['secret.guest@example.com'] },
        {
          label: 'two touched emails',
          touched: ['secret.guest@example.com', 'secret.other@example.com'],
          untouched: [],
        },
      ])("logs nothing from the page's fields for $label", ({ touched, untouched }) => {
        [
          ...touched.map((value) => [value, true] as const),
          ...untouched.map((value) => [value, false] as const),
        ].forEach(([value, isTouched], index) => {
          const input = addInput(value, 'text', isTouched);
          input.name = `field-name-${index}`;
          input.id = `field-id-${index}`;
        });

        fire();

        emailReason();
        const logged = JSON.stringify(loggedDiagnostics);
        expect(logged).not.toContain('secret');
        expect(logged).not.toContain('example.com');
        expect(logged).not.toContain('field-name');
        expect(logged).not.toContain('field-id');
      });
    });
  });
});

describe('getPreselectClientType', () => {
  it.each([
    [
      'an iPhone',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      'MobileWeb',
    ],
    ['an iPad', 'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148', 'MobileWeb'],
    [
      'an Android phone',
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile',
      'MobileWeb',
    ],
    ['a Kindle', 'Mozilla/5.0 (Linux; U; en-US) AppleWebKit/528.5+ (KHTML, like Gecko) Kindle/3.0', 'MobileWeb'],
    [
      'Windows',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36',
      'DesktopWeb',
    ],
    [
      'a Mac',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15',
      'DesktopWeb',
    ],
    [
      'Chrome OS',
      'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 Chrome/130.0 Safari/537.36',
      'DesktopWeb',
    ],
    ['Linux', 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0', 'DesktopWeb'],
    ['no known operating system', 'Mozilla/5.0 (compatible; unknown device)', undefined],
    ['an empty user agent', '', undefined],
  ])('classes %s', (_label, userAgent, clientType) => {
    expect(getPreselectClientType(userAgent)).toBe(clientType);
  });
});
