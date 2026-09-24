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
  let autoLogPageView: boolean;
  let originalGetActiveForwarders: any;

  const forwarder = (): any => (window as any).mParticle.forwarder;

  // The kit reports every preselect decision through this diagnostic, and it is the only
  // observable that does not depend on how the dispatch is routed onwards.
  const fireCount = (): number =>
    diagnostics.filter((entry) => entry.code === 'PRESELECT_FIRED').length;

  const setAutoLogPageView = (enabled: boolean): void => {
    autoLogPageView = enabled;
  };

  // The kit self-registers a single instance at import, so each test clears the trigger
  // state to start from an unarmed kit.
  const resetWatchState = (): void => {
    forwarder().onRouteChange = undefined;
    forwarder()._lastPreselectPathname = undefined;
  };

  // init() assigns userAttributes and builds a fresh loggingService, so the attributes have
  // to arrive through it and the diagnostics hook can only be installed afterwards.
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

  // RoktManager owns the subscription in core; from the kit's side a route change is
  // exactly a call to the hook it armed.
  const navigateTo = (pathname: string): void => {
    window.history.pushState({}, '', pathname);
    forwarder().onRouteChange();
  };

  beforeEach(() => {
    diagnostics = [];
    autoLogPageView = false;
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
      isAutoLogPageViewEnabled: () => autoLogPageView,
      attachKit: async (kit: any) => {
        (window as any).mParticle.Rokt.attachKitCalled = true;
        (window as any).mParticle.Rokt.kit = kit;
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

    setAutoLogPageView(false);
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

  // RoktManager decides whether to watch by whether the kit it is handed implements the
  // hook, so arming it is the kit's whole side of the contract.
  it('arms the route-change hook for a configured account', async () => {
    await initKit();

    expect(typeof forwarder().onRouteChange).toBe('function');
  });

  it('leaves the hook unset when AutoLogPageView is on', async () => {
    setAutoLogPageView(true);

    await initKit();

    expect(forwarder().onRouteChange).toBeUndefined();
  });

  it('leaves the hook unset for an account with no preselection config', async () => {
    PRESELECTION_CONFIG.length = 0;

    await initKit();

    expect(forwarder().onRouteChange).toBeUndefined();
  });

  // Core calls init() from inside the filter that builds activeForwarders, so that list is
  // still the previous one here. Re-checking membership at this point would block the fire
  // on every first init.
  it('fires on the initial evaluation even though activeForwarders is still empty', async () => {
    (window as any).mParticle._getActiveForwarders = () => [];

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

    // The attribute has to move, or the 60s active-preselect record suppresses the repeat
    // and this would pass whether or not the listener ran.
    forwarder().userAttributes = { loyaltyTier: 'platinum' };
    navigateTo('/somewhere-else');
    navigateTo(TRIGGER_PATHNAME);

    expect(fireCount()).toBe(afterInit + 1);
  });

  it('ignores a route change that leaves the pathname unchanged', async () => {
    await initKit();
    const afterInit = fireCount();

    // Moving the attribute means the active-preselect record would not suppress a second
    // dispatch, so the pathname check is the only thing left holding it back.
    forwarder().userAttributes = { loyaltyTier: 'platinum' };

    // A query-only replaceState is a route change but not a new page.
    window.history.replaceState({}, '', `${TRIGGER_PATHNAME}?sort=price`);
    forwarder().onRouteChange();

    expect(fireCount()).toBe(afterInit);
  });

  // Guest checkout: excludeAnonymousUser keeps the kit out of activeForwarders, the guest
  // reaches the trigger path, then logs in and reinitForwardersOnUserChange puts the kit
  // back. Recording the pathname on the blocked pass would dedup that recovery away.
  it('re-evaluates a pathname it skipped while the kit was inactive', async () => {
    await initKit();
    const afterInit = fireCount();

    navigateTo('/somewhere-else');

    (window as any).mParticle._getActiveForwarders = () => [];
    navigateTo(TRIGGER_PATHNAME);
    expect(fireCount()).toBe(afterInit);

    // Login puts the kit back, and the attribute moves so the fire is not suppressed by
    // the active-preselect record left behind at init.
    (window as any).mParticle._getActiveForwarders = () => [forwarder()];
    forwarder().userAttributes = { loyaltyTier: 'platinum' };
    navigateTo(TRIGGER_PATHNAME);

    expect(fireCount()).toBe(afterInit + 1);
  });

  it('stops firing once the kit is no longer an active forwarder', async () => {
    await initKit();
    const afterInit = fireCount();

    // Same attribute change as the firing case above, so this asserts the gate and not the
    // active-preselect record.
    forwarder().userAttributes = { loyaltyTier: 'platinum' };

    // Consent revoked mid-session: core rebuilt activeForwarders without this kit.
    (window as any).mParticle._getActiveForwarders = () => [];
    navigateTo('/somewhere-else');
    navigateTo(TRIGGER_PATHNAME);

    expect(fireCount()).toBe(afterInit);
  });
});
