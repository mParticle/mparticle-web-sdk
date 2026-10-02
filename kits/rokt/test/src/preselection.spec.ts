import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SDKEvent } from '@mparticle/web-sdk/internal';
import type { DiagnosticLogEntry } from '../../src/diagnosticTiming';
import type { PreselectionConfigEntry } from '../../src/preselectionConfig';
import {
  cancelScheduledDispatch,
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
  applyPreselectionConfigSetting,
  reportPreselectArrival,
  type PreselectHost,
  type PreselectState,
} from '../../src/preselection';
import { buildActivePreselectFieldKey, getActivePreselect, setActivePreselect } from '../../src/activePreselectStorage';
import { getPendingPreselect, setPendingPreselect, clearPendingPreselect } from '../../src/pendingPreselectStorage';
import { markPreselectArrival, recordPreselectFired, recordPreselectTrigger } from '../../src/preselectArrivalStorage';
import { djb2 } from '../../src/utils';

// Isolates preselection.ts from its collaborator modules: the config data and the
// active-preselect cache are mocked per-test rather than driven through the real modules
// (which hold a shared global array / real browser storage and have their own coverage
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

vi.mock('../../src/preselectArrivalStorage', () => ({
  markPreselectArrival: vi.fn(),
  recordPreselectFired: vi.fn(),
  recordPreselectTrigger: vi.fn(),
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
              attributes: { [ATTRIBUTE_KEY]: 'gold', [IDENTITY_KEY]: 'hashed-identity' },
              preselect: true,
              identifier: TARGET_PAGE_IDENTIFIER,
              omitUrl: true,
            },
          ]);
        });

        it('prefers an attribute value over the user identity', () => {
          host.userAttributes = { [ATTRIBUTE_KEY]: 'gold', [IDENTITY_KEY]: 'hashed-attribute' };

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls[0].attributes).toEqual({
            [ATTRIBUTE_KEY]: 'gold',
            [IDENTITY_KEY]: 'hashed-attribute',
          });
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
          expect(selectPlacementsCalls[0].attributes).toEqual({ [ATTRIBUTE_KEY]: 'from-pageview' });
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

            vi.advanceTimersByTime(DELAY_MS - 2000 - 1);
            expect(selectPlacementsCalls).toHaveLength(0);
            vi.advanceTimersByTime(1);
            expect(selectPlacementsCalls).toHaveLength(1);
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
            vi.advanceTimersByTime(DELAY_MS - 1);
            expect(selectPlacementsCalls).toHaveLength(0);
            vi.advanceTimersByTime(1);
            expect(selectPlacementsCalls).toHaveLength(1);
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

            vi.advanceTimersByTime(DELAY_MS - 1000 - 1);
            expect(selectPlacementsCalls).toHaveLength(0);
            vi.advanceTimersByTime(1);
            expect(selectPlacementsCalls).toHaveLength(1);
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
            state.pending = [{ event: buildEvent(), pathname: PATHNAME }];

            flushPendingPreselectDispatches(state, host, PATHNAME);

            vi.advanceTimersByTime(DELAY_MS - 1);
            expect(selectPlacementsCalls).toHaveLength(0);
            vi.advanceTimersByTime(1);
            expect(selectPlacementsCalls).toHaveLength(1);
          });

          it('still gives a fresh page view the full hold', () => {
            vi.advanceTimersByTime(30_000);

            maybeFirePreselect(state, host, buildEvent(), PATHNAME);

            vi.advanceTimersByTime(DELAY_MS - 1);
            expect(selectPlacementsCalls).toHaveLength(0);
            vi.advanceTimersByTime(1);
            expect(selectPlacementsCalls).toHaveLength(1);
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
            vi.advanceTimersByTime(DELAY_MS - 1);
            expect(selectPlacementsCalls).toHaveLength(0);
            vi.advanceTimersByTime(1);
            expect(selectPlacementsCalls).toHaveLength(1);
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

              vi.advanceTimersByTime(RETURN_HOLD_MS - 5000 - 1);
              expect(selectPlacementsCalls).toHaveLength(0);
              vi.advanceTimersByTime(1);
              expect(selectPlacementsCalls).toHaveLength(1);
            });

            it('keeps the return visit hold when a flush runs during it', () => {
              host.filteredUser = identifiedUser;
              maybeFirePreselect(state, host, buildEvent(), PATHNAME);
              vi.advanceTimersByTime(5000);
              flushPendingPreselectDispatches(state, host, PATHNAME);

              vi.advanceTimersByTime(RETURN_HOLD_MS - 5000 - 1);
              expect(selectPlacementsCalls).toHaveLength(0);
              vi.advanceTimersByTime(1);
              expect(selectPlacementsCalls).toHaveLength(1);
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
            { attributes: { [ATTRIBUTE_KEY]: 'gold' }, preselect: true, identifier: TARGET_PAGE_IDENTIFIER, omitUrl: true },
          ]);
        });

        it('fires and records a digest of the attributes, never the values', () => {
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toEqual([
            { attributes: { [ATTRIBUTE_KEY]: 'gold' }, preselect: true, identifier: TARGET_PAGE_IDENTIFIER, omitUrl: true },
          ]);
          expect(setActivePreselect).toHaveBeenCalledWith(FIELD_KEY, djb2(JSON.stringify({ [ATTRIBUTE_KEY]: 'gold' })));
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
            state.pending = [{ event: buildEvent(), pathname: PATHNAME }];
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
            ' [kit_identity_types=none] [current_identity_types=none] [mpid_match=true]',
        ]);
      });

      it('says when the kit has no filtered user at all', () => {
        host.filteredUser = null;
        host.getCurrentUser = () => buildUser(MPID, { email: 'shopper@example.com' });

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(messagesWithCode('PRESELECT_MISSED')[0]).toContain('[identity_reason=no_filtered_user]');
      });

      it('says when the kit user is bound to a different MPID than the current user', () => {
        host.filteredUser = buildUser(MPID);
        host.getCurrentUser = () => buildUser(OTHER_MPID, { email: 'shopper@example.com' });

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        const [message] = messagesWithCode('PRESELECT_MISSED');
        expect(message).toContain('[identity_reason=mpid_mismatch]');
        expect(message).toContain('[kit_identity_types=none] [current_identity_types=email] [mpid_match=false]');
      });

      it('says when the current user has identities that the kit user lacks', () => {
        host.filteredUser = buildUser(MPID);
        host.getCurrentUser = () => buildUser(MPID, { email: 'shopper@example.com', customerid: 'c-1' });

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        const [message] = messagesWithCode('PRESELECT_MISSED');
        expect(message).toContain('[identity_reason=kit_user_lacks_identities]');
        expect(message).toContain('[current_identity_types=customerid,email] [mpid_match=true]');
      });

      it('reports the MPID comparison as unknown when the current user cannot be read', () => {
        host.filteredUser = buildUser(MPID);
        host.getCurrentUser = undefined;

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        const [message] = messagesWithCode('PRESELECT_MISSED');
        expect(message).toContain('[identity_reason=no_identities]');
        expect(message).toContain('[mpid_match=unknown]');
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
        expect(selectPlacementsCalls[0].attributes).toEqual({ [ATTRIBUTE_KEY]: 'from-pageview' });
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

      it('returns the cancelled hold, and nothing when no hold is pending', () => {
        expect(cancelScheduledDispatch(state)).toBeUndefined();

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(cancelScheduledDispatch(state)).toEqual({
          event: expect.anything(),
          pathname: PATHNAME,
          heldAt: expect.any(Number),
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
        expect(recordPreselectFired).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER);
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

        reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER);

        expect(markPreselectArrival).toHaveBeenCalledWith(ACCOUNT_ID, TARGET_PAGE_IDENTIFIER);
        expect(messagesWithCode('PRESELECT_MISSED')).toEqual([
          'Rokt Kit: preselect missed [reason=arrival_without_fire] [trigger_seen=true]' +
            ' [identity_seen_on_trigger_path=true] [has_identity=true] [since_trigger_ms=4000]',
        ]);
      });

      it('says when this tab never saw the trigger at all', () => {
        vi.mocked(markPreselectArrival).mockReturnValue({});
        host.filteredUser = anonymousUser;

        reportPreselectArrival(host, TARGET_PAGE_IDENTIFIER);

        expect(messagesWithCode('PRESELECT_MISSED')).toEqual([
          'Rokt Kit: preselect missed [reason=arrival_without_fire] [trigger_seen=false]' +
            ' [identity_seen_on_trigger_path=false] [has_identity=false]',
        ]);
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

      it.each([
        { label: 'an identifier with no entry', apply: () => undefined, identifier: 'another-page' },
        { label: 'a session outside the rollout', apply: () => (host.isPreselectionEnabled = () => false) },
        { label: 'a kit that is not ready', apply: () => (host.isKitReady = () => false) },
        { label: 'targeting disabled', apply: () => (host.isTargetingDisabled = () => true) },
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

    it('drops an earlier setting when the next init has none', () => {
      applyPreselectionConfigSetting(ACCOUNT_ID, setting);

      expect(applyPreselectionConfigSetting(ACCOUNT_ID, undefined)).toBeUndefined();

      expect(findPreselectionConfig(ACCOUNT_ID, PATHNAME)).toEqual(CONFIG_ENTRY);
      expect(findPreselectionConfig(ACCOUNT_ID, SETTING_PATHNAME)).toBeUndefined();
    });
  });
});
