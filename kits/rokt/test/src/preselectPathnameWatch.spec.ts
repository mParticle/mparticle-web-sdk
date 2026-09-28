import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../src/Rokt-Kit';
import { PRESELECTION_CONFIG } from '../../src/preselectionConfig';
import {
  buildActivePreselectFieldKey,
  getActivePreselect,
} from '../../src/activePreselectStorage';

/* eslint-disable @typescript-eslint/no-explicit-any */

const ACCOUNT_ID = '900002';
const TRIGGER_PATHNAME = '/pathname-watch-trigger';
const TARGET_PAGE_IDENTIFIER = 'pathname-watch-target';

const waitForCondition = async (conditionFn: () => boolean): Promise<void> => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (conditionFn()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Timeout waiting for condition');
};

describe('preselect pathname watch', () => {
  let diagnostics: any[];
  // Mirrors a core whose RoktManager makes the initial call on attach.
  let callHookOnAttach: boolean;

  const forwarder = (): any => (window as any).mParticle.forwarder;

  const fireCount = (): number =>
    diagnostics.filter((entry) => entry.code === 'PRESELECT_FIRED').length;

  const resetWatchState = (): void => {
    forwarder().onRouteChange = undefined;
    forwarder()._lastPreselectPathname = undefined;
  };

  // init() assigns userAttributes and rebuilds loggingService, so both go through it.
  const initKit = async (): Promise<void> => {
    await forwarder().init(
      { accountId: ACCOUNT_ID },
      () => {},
      true,
      null,
      { loyaltyTier: 'gold' }
    );
    await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

    forwarder().loggingService = {
      logPlacementDiagnostic: (entry: any) => diagnostics.push(entry),
      log: () => undefined,
    };
  };

  const navigateTo = (pathname: string): void => {
    window.history.pushState({}, '', pathname);
    forwarder().onRouteChange();
  };

  beforeEach(() => {
    diagnostics = [];
    callHookOnAttach = true;
    PRESELECTION_CONFIG.length = 0;
    window.localStorage.clear();
    window.sessionStorage.clear();

    PRESELECTION_CONFIG.push({
      accountId: ACCOUNT_ID,
      pathname: TRIGGER_PATHNAME,
      targetPageIdentifier: TARGET_PAGE_IDENTIFIER,
      attributeKeys: ['loyaltyTier'],
    });

    (window as any).Rokt = {
      createLauncher: async () => ({
        enablePreselection: true,
        selectPlacements: () => undefined,
      }),
    };

    (window as any).mParticle.Rokt = {
      attachKitCalled: false,
      launcherOptions: {},
      attachKit: async (kit: any) => {
        (window as any).mParticle.Rokt.attachKitCalled = true;
        (window as any).mParticle.Rokt.kit = kit;
        if (callHookOnAttach) {
          kit.onRouteChange?.();
        }
      },
      filters: {
        userAttributesFilters: [],
        filterUserAttributes: (attributes: any) => attributes,
        filteredUser: {
          getMPID: () => '123',
          getUserIdentities: () => ({ userIdentities: { email: 'test@example.com' } }),
        },
      },
    };

    window.history.pushState({}, '', TRIGGER_PATHNAME);
    resetWatchState();
  });

  afterEach(() => {
    PRESELECTION_CONFIG.length = 0;
    window.history.pushState({}, '', '/');
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('arms the route-change hook for a configured account', async () => {
    await initKit();

    expect(typeof forwarder().onRouteChange).toBe('function');
  });

  it('leaves the hook unset for an account with no preselection config', async () => {
    PRESELECTION_CONFIG.length = 0;

    await initKit();

    expect(forwarder().onRouteChange).toBeUndefined();
  });

  it('does not evaluate the landing page itself on a core that never calls the hook', async () => {
    callHookOnAttach = false;

    await initKit();

    expect(
      getActivePreselect(buildActivePreselectFieldKey(ACCOUNT_ID, TRIGGER_PATHNAME))
    ).toBeNull();
  });

  it('lets a page view queued for the same path fire instead of the pathname attempt', async () => {
    // The shared forwarder is still ready from the previous test; start from before attach.
    forwarder().launcher = null;
    forwarder().isInitialized = false;
    const initializing = forwarder().init(
      { accountId: ACCOUNT_ID },
      () => {},
      true,
      null,
      { loyaltyTier: 'gold' }
    );
    forwarder().loggingService = {
      logPlacementDiagnostic: (entry: any) => diagnostics.push(entry),
      log: () => undefined,
    };
    // Logged before the launcher attaches, so it waits in the queue.
    forwarder().process({
      EventName: 'Checkout',
      EventCategory: 0,
      EventDataType: 3,
      EventAttributes: { loyaltyTier: 'from-event' },
    });
    await initializing;
    await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

    expect(fireCount()).toBe(1);
    expect(
      getActivePreselect(buildActivePreselectFieldKey(ACCOUNT_ID, TRIGGER_PATHNAME))!.attributes
    ).toMatchObject({ loyaltyTier: 'from-event' });
  });

  it('fires on the initial evaluation', async () => {
    await initKit();

    // The init-time fire predates the diagnostics hook, so read what it persisted.
    const record = getActivePreselect(
      buildActivePreselectFieldKey(ACCOUNT_ID, TRIGGER_PATHNAME)
    );
    expect(record).not.toBeNull();
    expect(record!.attributes).toMatchObject({ loyaltyTier: 'gold' });
  });

  it('fires again on a later route change back onto the trigger path', async () => {
    await initKit();
    const afterInit = fireCount();

    // The attribute has to move or the active-preselect record suppresses the repeat,
    // and this would pass either way.
    forwarder().userAttributes = { loyaltyTier: 'platinum' };
    navigateTo('/somewhere-else');
    navigateTo(TRIGGER_PATHNAME);

    expect(fireCount()).toBe(afterInit + 1);
  });

  it('ignores a route change that leaves the pathname unchanged', async () => {
    await initKit();
    const afterInit = fireCount();

    // Attribute moved, so the pathname check is the only thing holding the fire back.
    forwarder().userAttributes = { loyaltyTier: 'platinum' };

    // A query-only replaceState is a route change but not a new page.
    window.history.replaceState({}, '', `${TRIGGER_PATHNAME}?sort=price`);
    forwarder().onRouteChange();

    expect(fireCount()).toBe(afterInit);
  });
});
