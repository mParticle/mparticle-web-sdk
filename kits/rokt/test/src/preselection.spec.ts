import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SDKEvent } from '@mparticle/web-sdk/internal';
import type { DiagnosticLogEntry } from '../../src/diagnosticTiming';
import type { PreselectionConfigEntry } from '../../src/preselectionConfig';
import {
  createPreselectState,
  maybeFirePreselect,
  maybeRefreshPreselect,
  maybeFirePersistedPreselect,
  dispatchPreselect,
  flushPendingPreselectDispatches,
  findPreselectionConfig,
  findPreselectionConfigByIdentifier,
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

        it('queues rather than fires when the kit is not ready, holding the diagnostic until the gate can answer', () => {
          host.isKitReady = () => false;

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(selectPlacementsCalls).toHaveLength(0);
          expect(state.pending).toEqual([
            {
              event: expect.anything(),
              pathname: PATHNAME,
              storedDiagnostics: [expect.objectContaining({ code: 'PRESELECT_QUEUED' })],
            },
          ]);
          expect(loggedDiagnostics).toHaveLength(0);
        });

        it('collapses repeat pageviews on one pathname to a single stored diagnostic', () => {
          host.isKitReady = () => false;

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);
          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(state.pending).toHaveLength(1);
          expect(state.pending[0].storedDiagnostics).toHaveLength(1);
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

        it('stores a persist-failure diagnostic alongside the not-ready one when the write does not succeed', () => {
          host.isKitReady = () => false;
          vi.mocked(setPendingPreselect).mockReturnValue(false);

          maybeFirePreselect(state, host, buildEvent(), PATHNAME);

          expect(state.pending[0].storedDiagnostics).toContainEqual(
            expect.objectContaining({ code: 'PRESELECT_QUEUED', message: expect.stringContaining('persist_failed') }),
          );
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

      // The regression this guards: readiness is checked before the gate, so a pageview that
      // lands while the launcher is still attaching used to report PRESELECT_QUEUED for every
      // eligible session rather than the enabled cohort, inflating the queued counter by the
      // inverse of the rollout percentage.
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

      it('reports the stored queued diagnostic once the gate answers yes', () => {
        host.isKitReady = () => false;

        maybeFirePreselect(state, host, buildEvent({ [ATTRIBUTE_KEY]: 'gold' }), PATHNAME);
        expect(loggedDiagnostics).toHaveLength(0);

        host.isKitReady = () => true;
        flushPendingPreselectDispatches(state, host, PATHNAME);

        expect(loggedDiagnostics).toContainEqual(
          expect.objectContaining({ code: 'PRESELECT_QUEUED', message: expect.stringContaining('not_ready') }),
        );
        expect(selectPlacementsCalls).toHaveLength(1);
      });

      it('rebuilds the stored diagnostic, reporting nothing, when a flush arrives while the launcher is still attaching', () => {
        host.isKitReady = () => false;

        maybeFirePreselect(state, host, buildEvent(), PATHNAME);
        flushPendingPreselectDispatches(state, host, PATHNAME);

        expect(loggedDiagnostics).toHaveLength(0);
        expect(state.pending).toHaveLength(1);
        expect(state.pending[0].storedDiagnostics).toEqual([
          expect.objectContaining({ code: 'PRESELECT_QUEUED', message: expect.stringContaining('not_ready') }),
        ]);
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

  describe('maybeRefreshPreselect', () => {
    beforeEach(() => {
      mockConfig.current = [CONFIG_ENTRY];
      host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
    });

    it('fires from the attribute bag with no pageview event', () => {
      maybeRefreshPreselect(state, host, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(1);
      expect(selectPlacementsCalls[0]).toMatchObject({
        attributes: { [ATTRIBUTE_KEY]: 'gold' },
        preselect: true,
        identifier: TARGET_PAGE_IDENTIFIER,
      });
      expect(loggedDiagnostics).toEqual([
        expect.objectContaining({ code: 'PRESELECT_FIRED', message: expect.stringContaining('refreshed') }),
      ]);
    });

    it('fires again once a configured attribute has actually changed', () => {
      vi.mocked(getActivePreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        attributes: { [ATTRIBUTE_KEY]: 'silver' },
      } as unknown as ReturnType<typeof getActivePreselect>);

      maybeRefreshPreselect(state, host, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(1);
    });

    it('stands down while the attributes are unchanged, so it cannot dispatch per keystroke', () => {
      vi.mocked(getActivePreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        attributes: { [ATTRIBUTE_KEY]: 'gold' },
      } as unknown as ReturnType<typeof getActivePreselect>);

      maybeRefreshPreselect(state, host, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(loggedDiagnostics).toEqual([
        expect.objectContaining({ code: 'PRESELECT_SKIPPED' }),
      ]);
    });

    it('leaves a queued dispatch to the flush rather than firing alongside it', () => {
      host.isKitReady = () => false;
      maybeFirePreselect(state, host, buildEvent(), PATHNAME);
      host.isKitReady = () => true;
      expect(state.pending).toHaveLength(1);

      maybeRefreshPreselect(state, host, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it('leaves a persisted record to recovery rather than firing alongside it', () => {
      vi.mocked(getPendingPreselect).mockReturnValue({
        expiresAt: Date.now() + 60_000,
        pathname: PATHNAME,
        identifier: TARGET_PAGE_IDENTIFIER,
        attributes: { [ATTRIBUTE_KEY]: 'gold' },
        mpid: MPID,
      } as unknown as ReturnType<typeof getPendingPreselect>);

      maybeRefreshPreselect(state, host, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it('does nothing off a configured pathname', () => {
      maybeRefreshPreselect(state, host, '/somewhere-else');

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(loggedDiagnostics).toHaveLength(0);
    });

    it.each([
      ['the kit is not ready', () => { host.isKitReady = () => false; }],
      ['the session is not in the rollout', () => { host.isPreselectionEnabled = () => false; }],
      ['there is no valid identity', () => {
        host.filteredUser = { getUserIdentities: () => ({ userIdentities: {} }), getMPID: () => MPID } as unknown as PreselectHost['filteredUser'];
      }],
    ])('does nothing when %s', (_label, arrange) => {
      arrange();

      maybeRefreshPreselect(state, host, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
    });

    it('does nothing while a configured attribute is still missing', () => {
      host.userAttributes = {};

      maybeRefreshPreselect(state, host, PATHNAME);

      expect(selectPlacementsCalls).toHaveLength(0);
      expect(loggedDiagnostics).toHaveLength(0);
    });
  });

  describe('maybeFirePersistedPreselect', () => {
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
