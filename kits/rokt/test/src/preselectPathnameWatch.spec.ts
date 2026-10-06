import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../../src/Rokt-Kit';
import { PRESELECTION_CONFIG } from '../../src/preselectionConfig';
import { applyPreselectionConfigSetting } from '../../src/preselection';
import {
  buildActivePreselectFieldKey,
  getActivePreselect,
} from '../../src/activePreselectStorage';
import { djb2 } from '../../src/utils';

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

  const recordedDigest = (): number | undefined =>
    getActivePreselect(buildActivePreselectFieldKey(ACCOUNT_ID, TRIGGER_PATHNAME))?.attributesDigest;

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
    applyPreselectionConfigSetting(ACCOUNT_ID, undefined);
    PRESELECTION_CONFIG.length = 0;
    window.history.pushState({}, '', '/');
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('arms the route-change hook for a configured account', async () => {
    await initKit();

    expect(typeof forwarder().onRouteChange).toBe('function');
  });

  it('arms the route-change hook for an account configured only through the preselectionConfig setting', async () => {
    PRESELECTION_CONFIG.length = 0;
    const setting = JSON.stringify({
      schemaVersion: 1,
      entries: [
        { pathname: TRIGGER_PATHNAME, targetPageIdentifier: TARGET_PAGE_IDENTIFIER, attributeKeys: ['loyaltyTier'] },
      ],
    }).replace(/"/g, '&quot;');

    await forwarder().init(
      { accountId: ACCOUNT_ID, preselectionConfig: setting },
      () => {},
      true,
      null,
      { loyaltyTier: 'gold' }
    );
    await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

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
    expect(recordedDigest()).toBe(djb2(JSON.stringify({ loyaltyTier: 'from-event' })));
  });

  it('fires on the initial evaluation', async () => {
    await initKit();

    // The init-time fire predates the diagnostics hook, so read what it recorded.
    expect(recordedDigest()).toBe(djb2(JSON.stringify({ loyaltyTier: 'gold' })));
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

  it('still sends the fired line after two short visits to a held path', async () => {
    const delayMs = 5000;
    PRESELECTION_CONFIG[0] = {
      ...PRESELECTION_CONFIG[0],
      dispatchDelayMs: delayMs,
    };
    window.history.pushState({}, '', '/landing');
    await initKit();

    const sentCodes: string[] = [];
    const originalFetch = window.fetch;
    (window as any).fetch = (_url: string, options: any) => {
      sentCodes.push(JSON.parse(options.body).code);
      return Promise.resolve({ ok: true });
    };
    // The real service, so the placement diagnostic rate limit applies.
    forwarder().loggingService = new (forwarder().testHelpers.LoggingService)(
      { loggingUrl: 'test.com/v1/log', isLoggingEnabled: true },
      { report: () => undefined },
      '1.0.0',
      'test-guid'
    );
    const visitWithPageView = (pathname: string): void => {
      navigateTo(pathname);
      forwarder().process({
        EventName: 'Page',
        EventCategory: 0,
        EventDataType: 3,
        EventAttributes: {},
      });
    };

    vi.useFakeTimers();
    try {
      for (let visit = 0; visit < 2; visit += 1) {
        visitWithPageView(TRIGGER_PATHNAME);
        vi.advanceTimersByTime(delayMs / 2);
        visitWithPageView('/somewhere-else');
      }
      visitWithPageView(TRIGGER_PATHNAME);
      vi.advanceTimersByTime(delayMs);

      expect(
        sentCodes.filter((code) => code === 'PRESELECT_FIRED')
      ).toHaveLength(1);
    } finally {
      vi.useRealTimers();
      window.fetch = originalFetch;
    }
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
