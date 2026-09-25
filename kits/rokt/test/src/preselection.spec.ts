import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SDKEvent } from '@mparticle/web-sdk/internal';
import type { DiagnosticLogEntry } from '../../src/diagnosticTiming';
import type { PreselectionConfigEntry } from '../../src/preselectionConfig';
import {
  createPreselectState,
  maybeFirePreselect,
  maybeFirePersistedPreselect,
  dispatchPreselect,
  flushPendingPreselectDispatches,
  findPreselectionConfig,
  findPreselectionConfigByIdentifier,
  hasPreselectionConfigForAccount,
  maybeFirePreselectForPathname,
  isPreselectAttributeKey,
  type PreselectHost,
  type PreselectState,
} from '../../src/preselection';
import { buildActivePreselectFieldKey, getActivePreselect, setActivePreselect } from '../../src/activePreselectStorage';
import { getPendingPreselect, setPendingPreselect, clearPendingPreselect } from '../../src/pendingPreselectStorage';

// Isolates preselection.ts from its collaborator modules: the config data and the
// active-preselect cache are mocked per-test rather than driven through the real modules
// (which hold a shared global array / real localStorage and have their own coverage
// elsewhere), so each test controls exactly the config/cache state it needs.
const { mockConfig } = vi.hoisted(() => ({ mockConfig: { current: [] as PreselectionConfigEntry[] } }));

vi.mock('../../src/preselectionConfig', () => ({
  get PRESELECTION_CONFIG() {
    return mockConfig.current;
  },
}));

vi.mock('../../src/activePreselectStorage', () => ({
  buildActivePreselectFieldKey: vi.fn(),
  getActivePreselect: vi.fn(),
  setActivePreselect: vi.fn(),
}));

vi.mock('../../src/pendingPreselectStorage', () => ({
  getPendingPreselect: vi.fn(),
  setPendingPreselect: vi.fn(),
  clearPendingPreselect: vi.fn(),
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

describe('preselection', () => {
  let state: PreselectState;
  let host: PreselectHost;
  let selectPlacementsCalls: Record<string, unknown>[];
  let loggedDiagnostics: DiagnosticLogEntry[];
  let loggedEvents: DiagnosticLogEntry[];

  beforeEach(() => {
    vi.resetAllMocks();
    mockConfig.current = [];
    vi.mocked(buildActivePreselectFieldKey).mockReturnValue(FIELD_KEY);
    vi.mocked(getActivePreselect).mockReturnValue(null);
    vi.mocked(getPendingPreselect).mockReturnValue(null);
    vi.mocked(setPendingPreselect).mockReturnValue(true);

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

  describe('createPreselectState', () => {
    it('starts with an empty pending queue', () => {
      expect(createPreselectState()).toEqual({ pending: [] });
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
          expect(state.pending).toEqual([{ event: expect.anything(), pathname: PATHNAME }]);
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
            { attributes: { [ATTRIBUTE_KEY]: 'gold' }, preselect: true, identifier: TARGET_PAGE_IDENTIFIER, omitUrl: true },
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
              attributes: { [ATTRIBUTE_KEY]: 'gold', firstname: 'ryan' },
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
            { attributes: { [ATTRIBUTE_KEY]: 'gold' }, preselect: true, identifier: TARGET_PAGE_IDENTIFIER, omitUrl: true },
          ]);
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

          vi.advanceTimersByTime(DELAY_MS - 1);
          expect(selectPlacementsCalls).toHaveLength(0);

          vi.advanceTimersByTime(1);
          expect(selectPlacementsCalls).toHaveLength(1);
          expect(state.dispatchTimer).toBeUndefined();
        });

        it('resolves attributes when the delay elapses, not when the pageview fired', () => {
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          host.userAttributes = { [ATTRIBUTE_KEY]: 'settled-later' };
          vi.advanceTimersByTime(DELAY_MS);

          expect(selectPlacementsCalls).toEqual([
            {
              attributes: { [ATTRIBUTE_KEY]: 'settled-later' },
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

          expect(selectPlacementsCalls[0].attributes).toEqual({ [ATTRIBUTE_KEY]: 'from-current-host' });
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
            { attributes: { [ATTRIBUTE_KEY]: 'gold' }, preselect: true, identifier: TARGET_PAGE_IDENTIFIER, omitUrl: true },
          ]);
        });

        it('fires and caches the attributes when all are present and nothing is cached yet', () => {
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toEqual([
            { attributes: { [ATTRIBUTE_KEY]: 'gold' }, preselect: true, identifier: TARGET_PAGE_IDENTIFIER, omitUrl: true },
          ]);
          expect(setActivePreselect).toHaveBeenCalledWith(FIELD_KEY, { [ATTRIBUTE_KEY]: 'gold' });
        });

        it('skips when the cached attributes are unchanged and still fresh', () => {
          vi.mocked(getActivePreselect).mockReturnValue({
            expiresAt: Date.now() + 30_000,
            attributes: { [ATTRIBUTE_KEY]: 'gold' },
          });

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toHaveLength(0);
          expect(setActivePreselect).not.toHaveBeenCalled();
          expect(loggedDiagnostics).toContainEqual(expect.objectContaining({ code: 'PRESELECT_SKIPPED' }));
        });

        it('fires again when the attributes changed, even though the cache is still fresh', () => {
          vi.mocked(getActivePreselect).mockReturnValue({
            expiresAt: Date.now() + 30_000,
            attributes: { [ATTRIBUTE_KEY]: 'silver' },
          });

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toHaveLength(1);
        });

        it('fires again when the cache has expired, even though the attributes are unchanged', () => {
          vi.mocked(getActivePreselect).mockReturnValue({
            expiresAt: Date.now() - 1,
            attributes: { [ATTRIBUTE_KEY]: 'gold' },
          });

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toHaveLength(1);
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

  describe('flushPendingPreselectDispatches', () => {
    beforeEach(() => {
      mockConfig.current = [CONFIG_ENTRY];
    });

    it('drains the queue before replaying each pending entry', () => {
      host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
      state.pending = [
        { event: buildEvent(), pathname: PATHNAME },
        { event: buildEvent(), pathname: PATHNAME },
      ];

      flushPendingPreselectDispatches(state, host, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(2);
      expect(state.pending).toHaveLength(0);
    });

    it('lands a re-enqueue from a replayed entry in the new queue, rather than looping', () => {
      host.userAttributes = {}; // still missing the required attribute
      state.pending = [{ event: buildEvent(), pathname: PATHNAME }];

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
      state.pending = [{ event: buildEvent(), pathname: PATHNAME }];

      flushPendingPreselectDispatches(state, host, '/some-other-path');

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(state.pending).toHaveLength(0);
    });

    it('still fires an entry whose pathname matches the current pathname', () => {
      host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
      state.pending = [{ event: buildEvent(), pathname: PATHNAME }];

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
          attributes: { [ATTRIBUTE_KEY]: 'gold' },
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
        { attributes: { [ATTRIBUTE_KEY]: 'gold' }, preselect: true, identifier: TARGET_PAGE_IDENTIFIER, omitUrl: true },
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
      state.pending = [{ event: buildEvent(), pathname: PATHNAME }];
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
});
