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
  let clearHookOnAttach: boolean;
  let originalGetActiveForwarders: any;

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
    clearHookOnAttach = false;
    PRESELECTION_CONFIG.length = 0;
    window.localStorage.clear();
    window.sessionStorage.clear();

    originalGetActiveForwarders = (window as any).mParticle._getActiveForwarders;

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
        if (clearHookOnAttach) {
          kit.onRouteChange = undefined;
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

    (window as any).mParticle._getActiveForwarders = () => [forwarder()];
    window.history.pushState({}, '', TRIGGER_PATHNAME);
    resetWatchState();
  });

  afterEach(() => {
    PRESELECTION_CONFIG.length = 0;
    window.history.pushState({}, '', '/');
    window.localStorage.clear();
    window.sessionStorage.clear();
    (window as any).mParticle._getActiveForwarders = originalGetActiveForwarders;
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

  it('skips the initial evaluation when the manager cleared the hook', async () => {
    clearHookOnAttach = true;

    await initKit();

    expect(
      getActivePreselect(buildActivePreselectFieldKey(ACCOUNT_ID, TRIGGER_PATHNAME))
    ).toBeNull();
  });

  it('fires on the initial evaluation when the kit is an active forwarder', async () => {
    await initKit();

    // The init-time fire predates the diagnostics hook, so read what it persisted.
    const record = getActivePreselect(
      buildActivePreselectFieldKey(ACCOUNT_ID, TRIGGER_PATHNAME)
    );
    expect(record).not.toBeNull();
    expect(record!.attributes).toMatchObject({ loyaltyTier: 'gold' });
  });

  it('does not fire on the initial evaluation when the kit was dropped meanwhile', async () => {
    (window as any).mParticle._getActiveForwarders = () => [];

    await initKit();

    expect(
      getActivePreselect(buildActivePreselectFieldKey(ACCOUNT_ID, TRIGGER_PATHNAME))
    ).toBeNull();
  });

  it('fires when a blocked guest logs in on the trigger route without navigating', async () => {
    (window as any).mParticle._getActiveForwarders = () => [];
    await initKit();
    expect(fireCount()).toBe(0);

    (window as any).mParticle._getActiveForwarders = () => [forwarder()];
    forwarder().onUserIdentified({
      getMPID: () => '123',
      getUserIdentities: () => ({ userIdentities: { email: 'test@example.com' } }),
      getAllUserAttributes: () => ({ loyaltyTier: 'gold' }),
    });

    expect(fireCount()).toBe(1);
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

  it('re-evaluates a pathname it skipped while the kit was inactive', async () => {
    await initKit();
    const afterInit = fireCount();

    navigateTo('/somewhere-else');

    (window as any).mParticle._getActiveForwarders = () => [];
    navigateTo(TRIGGER_PATHNAME);
    expect(fireCount()).toBe(afterInit);

    // Attribute moved so the record left behind at init does not suppress the fire.
    (window as any).mParticle._getActiveForwarders = () => [forwarder()];
    forwarder().userAttributes = { loyaltyTier: 'platinum' };
    navigateTo(TRIGGER_PATHNAME);

    expect(fireCount()).toBe(afterInit + 1);
  });

  it('stops firing once the kit is no longer an active forwarder', async () => {
    await initKit();
    const afterInit = fireCount();

    // Same attribute change as the firing case, so this asserts the gate.
    forwarder().userAttributes = { loyaltyTier: 'platinum' };

    (window as any).mParticle._getActiveForwarders = () => [];
    navigateTo('/somewhere-else');
    navigateTo(TRIGGER_PATHNAME);

    expect(fireCount()).toBe(afterInit);
  });
});
