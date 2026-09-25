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
  isPreselectAttributeKey,
  hasPreselectTrigger,
  maybeFirePreselectOnTrigger,
  bindPreselectTrigger,
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

  describe('trigger elements', () => {
    const TRIGGER_ENTRY: PreselectionConfigEntry = {
      ...CONFIG_ENTRY,
      triggerElements: [{ selector: '#place-order' }],
    };

    let button: HTMLButtonElement;
    let label: HTMLSpanElement;

    beforeEach(() => {
      mockConfig.current = [TRIGGER_ENTRY];
      host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
      button = document.createElement('button');
      button.id = 'place-order';
      label = document.createElement('span');
      label.textContent = 'Place order';
      button.appendChild(label);
      document.body.appendChild(button);
    });

    afterEach(() => {
      button.remove();
    });

    describe('maybeFirePreselect', () => {
      it('does nothing on a trigger-armed route', () => {
        maybeFirePreselect(state, host, buildEvent(), PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
        expect(state.pending).toHaveLength(0);
        expect(loggedDiagnostics).toHaveLength(0);
      });
    });

    describe('maybeFirePreselectOnTrigger', () => {
      it('fires for a click inside a trigger element, reporting the trigger as the reason', () => {
        maybeFirePreselectOnTrigger(state, host, label, PATHNAME);

        expect(selectPlacementsCalls).toEqual([
          {
            attributes: { [ATTRIBUTE_KEY]: 'gold' },
            preselect: true,
            identifier: TARGET_PAGE_IDENTIFIER,
            omitUrl: true,
          },
        ]);
        expect(loggedDiagnostics).toEqual([
          { code: 'PRESELECT_FIRED', message: 'Rokt Kit: preselect fired [reason=fired_on_trigger]' },
        ]);
      });

      it('ignores a click outside every trigger element', () => {
        maybeFirePreselectOnTrigger(state, host, document.body, PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
        expect(loggedDiagnostics).toHaveLength(0);
      });

      it('ignores a target that is not an element', () => {
        maybeFirePreselectOnTrigger(state, host, null, PATHNAME);
        maybeFirePreselectOnTrigger(state, host, document, PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
      });

      it('ignores a click on a route with no trigger elements', () => {
        mockConfig.current = [CONFIG_ENTRY];

        maybeFirePreselectOnTrigger(state, host, label, PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
      });

      it('matches configured text case-insensitively', () => {
        mockConfig.current = [{ ...CONFIG_ENTRY, triggerElements: [{ selector: 'button', text: 'PLACE ORDER' }] }];

        maybeFirePreselectOnTrigger(state, host, label, PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(1);
      });

      it('ignores an element whose text does not contain the configured text', () => {
        mockConfig.current = [{ ...CONFIG_ENTRY, triggerElements: [{ selector: 'button', text: 'Continue' }] }];

        maybeFirePreselectOnTrigger(state, host, label, PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
      });

      it('ignores a disabled trigger element', () => {
        button.disabled = true;

        maybeFirePreselectOnTrigger(state, host, label, PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
      });

      it('ignores an aria-disabled trigger element', () => {
        button.setAttribute('aria-disabled', 'true');

        maybeFirePreselectOnTrigger(state, host, label, PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
      });

      it('ignores an invalid selector without throwing, still matching the others', () => {
        mockConfig.current = [
          { ...CONFIG_ENTRY, triggerElements: [{ selector: '[[invalid' }, { selector: '#place-order' }] },
        ];

        expect(() => maybeFirePreselectOnTrigger(state, host, label, PATHNAME)).not.toThrow();
        expect(selectPlacementsCalls).toHaveLength(1);
      });

      it('queues a click that is missing an attribute and fires it once the attribute arrives', () => {
        host.userAttributes = {};

        maybeFirePreselectOnTrigger(state, host, label, PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
        expect(state.pending).toEqual([{ event: undefined, pathname: PATHNAME, triggered: true }]);

        host.userAttributes = { [ATTRIBUTE_KEY]: 'gold' };
        flushPendingPreselectDispatches(state, host, PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(1);
        expect(loggedDiagnostics.at(-1)).toEqual({
          code: 'PRESELECT_FIRED',
          message: 'Rokt Kit: preselect fired [reason=fired_on_trigger]',
        });
      });

      it('queues a click made before the kit is ready and fires it once it is', () => {
        host.isKitReady = () => false;

        maybeFirePreselectOnTrigger(state, host, label, PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
        expect(state.pending).toEqual([
          { event: undefined, pathname: PATHNAME, triggered: true, storedDiagnostics: [] },
        ]);

        host.isKitReady = () => true;
        flushPendingPreselectDispatches(state, host, PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(1);
      });
    });

    describe('flushPendingPreselectDispatches', () => {
      it('drops a queued pageview on a trigger-armed route', () => {
        state.pending = [{ event: buildEvent(), pathname: PATHNAME }];

        flushPendingPreselectDispatches(state, host, PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
        expect(state.pending).toHaveLength(0);
      });

      it('drops a queued click once the route no longer has trigger elements', () => {
        mockConfig.current = [CONFIG_ENTRY];
        state.pending = [{ pathname: PATHNAME, triggered: true }];

        flushPendingPreselectDispatches(state, host, PATHNAME);

        expect(selectPlacementsCalls).toHaveLength(0);
      });
    });

    describe('hasPreselectTrigger', () => {
      it('returns true when the account has a route with trigger elements', () => {
        expect(hasPreselectTrigger(ACCOUNT_ID)).toBe(true);
      });

      it('returns false when the account has no trigger elements', () => {
        mockConfig.current = [CONFIG_ENTRY];

        expect(hasPreselectTrigger(ACCOUNT_ID)).toBe(false);
      });

      it('returns false when accountId is missing', () => {
        expect(hasPreselectTrigger(null)).toBe(false);
      });
    });

    describe('bindPreselectTrigger', () => {
      it('passes the click target to the handler', () => {
        const onTrigger = vi.fn();

        bindPreselectTrigger(onTrigger);
        label.click();

        expect(onTrigger).toHaveBeenCalledWith(label);
      });

      it('replaces the previous listener rather than adding a second one', () => {
        const first = vi.fn();
        const second = vi.fn();

        bindPreselectTrigger(first);
        bindPreselectTrigger(second);
        label.click();

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
      });
    });
  });
});
