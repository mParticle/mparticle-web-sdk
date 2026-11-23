import '../../src/Rokt-Kit';
import * as storage from '../../src/storage';
import { isDevicePersistenceDisabled, setDevicePersistenceDisabled } from '../../src/storage';
import {
  applyPreselectionConfigSetting,
  dispatchPreselect,
  isReadableFormEmailChange,
} from '../../src/preselection/preselection';

/* eslint-disable @typescript-eslint/no-explicit-any */

type Flags = Record<string, boolean>;

// Mirrors core's cookie consent manager: init OR page OR consent-derived flags, with $NoTargeting kept in step.
// Kept local so the kit spec never loads core source, which kit CI does not install dependencies for.
function createManager(initFlags: Flags) {
  const manager = {
    pageFlags: {} as Flags,
    derived: {} as Flags,
    replaceDerivedFlags: vi.fn((flags: Flags) => {
      manager.derived = { ...flags };
    }),
    get(key: string) {
      return initFlags[key] === true || manager.pageFlags[key] === true || manager.derived[key] === true;
    },
    getNoTargeting: () => manager.get('noTargeting'),
    getNoFunctional: () => manager.get('noFunctional'),
    getDoNotShareOrSell: () => manager.get('doNotShareOrSell'),
    syncNoTargetingAttribute: vi.fn((user: any) => {
      if (!user) return;
      if (manager.getNoTargeting()) {
        user.setUserAttribute('$NoTargeting', true);
      } else if (Object.prototype.hasOwnProperty.call(user.getAllUserAttributes(), '$NoTargeting')) {
        user.removeUserAttribute('$NoTargeting');
      }
    }),
  };
  return manager;
}

describe('Rokt consent privacy mapping', () => {
  const mp = (window as any).mParticle;
  let kit: any;
  let consent: Record<string, { Consented?: unknown }>;
  let manager: ReturnType<typeof createManager>;
  let launcher: any;
  let attributes: Record<string, unknown>;
  let mpid: string;
  let onSetUserAttribute: () => void;
  const originalGetInstance = mp.getInstance;
  const originalIdentity = mp.Identity;
  const originalRokt = mp.Rokt;

  // Core builds a new user wrapper on every getCurrentUser call.
  const currentUser = () => ({
    getMPID: () => mpid,
    getConsentState: () => ({ getGDPRConsentState: () => consent }),
    getAllUserAttributes: () => attributes,
    setUserAttribute: (key: string, value: unknown) => {
      attributes[key] = value;
      onSetUserAttribute();
    },
    removeUserAttribute: (key: string) => {
      delete attributes[key];
    },
  });

  const useManager = (initFlags: Flags = {}) => {
    manager = createManager({ ...mp.Rokt.launcherOptions, ...initFlags });
    mp.getInstance = () => ({ _CookieConsentManager: manager, setIntegrationAttribute: () => {} });
  };

  const initKit = (settings: Record<string, unknown> = {}) => {
    kit.init({ accountId: '000000', ...settings }, null, true, null, {});
  };

  const mappingSetting = JSON.stringify([
    { map: 'targeted_advertising', value: 'noTargeting' },
    { map: 'functional', value: 'noFunctional' },
    { map: 'sale_of_data', value: 'doNotShareOrSell' },
  ]);

  beforeEach(() => {
    kit = new mp.forwarder.constructor();
    kit.attachLauncher = vi.fn(() => Promise.resolve());
    consent = {};
    attributes = {};
    mpid = '123';
    onSetUserAttribute = () => {};
    mp.Rokt = { launcherOptions: {} };
    mp.Identity = { getCurrentUser: currentUser };
    useManager();
    launcher = { setPrivacyControl: vi.fn(), selectPlacements: vi.fn(() => ({})) };
  });

  afterEach(() => {
    mp.getInstance = originalGetInstance;
    mp.Identity = originalIdentity;
    mp.Rokt = originalRokt;
    setDevicePersistenceDisabled(false);
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('parses purpose-keyed settings like GA4, trims and lowercases purposes and ignores unknown flags', () => {
    consent.targeted_advertising = { Consented: false };
    initKit({
      consentMappingSDK: JSON.stringify([
        { map: ' Targeted_Advertising ', value: 'noTargeting' },
        { map: 'targeted_advertising', value: 'unknownFlag' },
        { map: '   ', value: 'noFunctional' },
      ]),
    });
    expect(kit._consentMappings).toEqual([{ map: 'targeted_advertising', value: 'noTargeting' }]);
    expect(manager.derived.noTargeting).toBe(true);
    expect(kit.attachLauncher).toHaveBeenCalledWith('000000', expect.objectContaining({ noTargeting: true }));
  });

  it('never writes $NoTargeting from init, so core re-initializing forwarders cannot re-enter init', () => {
    consent.targeted_advertising = { Consented: false };
    attributes.$NoTargeting = true;
    const initSpy = vi.spyOn(kit, 'init');
    // Core's setUserAttribute re-runs initForwarders, which calls init on a kit not yet marked initialized.
    onSetUserAttribute = () => initKit({ consentMappingSDK: mappingSetting });
    expect(() => initKit({ consentMappingSDK: mappingSetting })).not.toThrow();
    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(kit.attachLauncher).toHaveBeenCalledTimes(1);
    expect(manager.syncNoTargetingAttribute).not.toHaveBeenCalled();
  });

  it('syncs $NoTargeting once after init for the user core synced before the mapping applied', () => {
    consent.targeted_advertising = { Consented: false };
    initKit({ consentMappingSDK: mappingSetting });
    kit.process({ EventDataType: 4, EventName: 'event', EventAttributes: {} });
    kit.process({ EventDataType: 4, EventName: 'event', EventAttributes: {} });
    expect(manager.syncNoTargetingAttribute).toHaveBeenCalledTimes(1);
    expect(attributes.$NoTargeting).toBe(true);
  });

  it('does not loop when a $NoTargeting write fans back into the kit', () => {
    initKit({ consentMappingSDK: mappingSetting });
    onSetUserAttribute = () => kit.process({ EventDataType: 4, EventName: 'attribute change', EventAttributes: {} });
    consent.targeted_advertising = { Consented: false };
    kit.process({ EventDataType: 4, EventName: 'event', EventAttributes: {} });
    expect(manager.syncNoTargetingAttribute).toHaveBeenCalledTimes(1);
    expect(attributes.$NoTargeting).toBe(true);
  });

  it('only maps strict GDPR declines, ignoring grants and missing purposes', () => {
    initKit({ consentMappingSDK: mappingSetting });
    consent = { targeted_advertising: { Consented: false }, functional: { Consented: true } };
    kit.refreshConsentPrivacy();
    expect(manager.derived).toEqual({ noTargeting: true, noFunctional: false, doNotShareOrSell: false });
    consent = { targeted_advertising: { Consented: 'false' } };
    kit.refreshConsentPrivacy();
    expect(manager.derived.noTargeting).toBe(false);
  });

  it('keeps init and page opt-outs when consent is declined and then granted', () => {
    mp.Rokt.launcherOptions.noTargeting = true;
    useManager();
    initKit({ consentMappingSDK: mappingSetting });
    kit.launcher = launcher;
    manager.pageFlags.doNotShareOrSell = true;
    consent.functional = { Consented: false };
    kit.refreshConsentPrivacy();
    expect(launcher.setPrivacyControl).toHaveBeenLastCalledWith({
      noTargeting: true,
      noFunctional: true,
      doNotShareOrSell: true,
    });
    expect(isDevicePersistenceDisabled()).toBe(true);
    consent.functional = { Consented: true };
    kit.refreshConsentPrivacy();
    expect(launcher.setPrivacyControl).toHaveBeenLastCalledWith({
      noTargeting: true,
      noFunctional: false,
      doNotShareOrSell: true,
    });
    expect(isDevicePersistenceDisabled()).toBe(false);
  });

  it('keeps $NoTargeting in step on decline, grant and a page opt-out, and per user rather than per wrapper', () => {
    initKit({ consentMappingSDK: mappingSetting });
    consent.targeted_advertising = { Consented: false };
    kit.refreshConsentPrivacy();
    kit.refreshConsentPrivacy();
    expect(attributes.$NoTargeting).toBe(true);
    expect(manager.syncNoTargetingAttribute).toHaveBeenCalledTimes(1);
    mpid = '456';
    attributes = {};
    kit.refreshConsentPrivacy();
    expect(attributes.$NoTargeting).toBe(true);
    expect(manager.syncNoTargetingAttribute).toHaveBeenCalledTimes(2);
    consent.targeted_advertising = { Consented: true };
    kit.refreshConsentPrivacy();
    expect(attributes.$NoTargeting).toBeUndefined();
    manager.pageFlags.noTargeting = true;
    kit.refreshConsentPrivacy();
    expect(attributes.$NoTargeting).toBe(true);
  });

  it('keeps a decline when several purposes map to one flag', () => {
    initKit({
      consentMappingSDK: JSON.stringify([
        { map: 'targeted_advertising', value: 'noTargeting' },
        { map: 'other', value: 'noTargeting' },
      ]),
    });
    consent = { targeted_advertising: { Consented: false }, other: { Consented: true } };
    kit.refreshConsentPrivacy();
    expect(manager.derived.noTargeting).toBe(true);
  });

  it('refreshes before a page-view signal and clears derived flags for a new user', () => {
    initKit({ consentMappingSDK: mappingSetting });
    consent.targeted_advertising = { Consented: false };
    kit.process({ EventDataType: 3, EventName: 'page view', EventAttributes: {} });
    expect(kit.isPageHistoryAllowed()).toBe(false);
    mp.Identity.getCurrentUser = () => ({ ...currentUser(), getMPID: () => '789', getConsentState: () => null });
    kit.process({ EventDataType: 4, EventName: 'event', EventAttributes: {} });
    expect(manager.derived.noTargeting).toBe(false);
    expect(kit.isPageHistoryAllowed()).toBe(true);
  });

  it('refreshes on placement entry and again after an asynchronous wait', async () => {
    initKit({ consentMappingSDK: mappingSetting });
    kit.launcher = launcher;
    let finish: () => void;
    kit._workspaceSearchInFlightPromise = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const placement = kit.selectPlacements({});
    consent.sale_of_data = { Consented: false };
    finish!();
    await placement;
    expect(manager.derived.doNotShareOrSell).toBe(true);
    expect(launcher.selectPlacements).toHaveBeenCalled();
    expect(launcher.setPrivacyControl.mock.invocationCallOrder.slice(-1)[0]).toBeLessThan(
      launcher.selectPlacements.mock.invocationCallOrder[0],
    );
    expect(launcher.setPrivacyControl).toHaveBeenLastCalledWith({
      noTargeting: false,
      noFunctional: false,
      doNotShareOrSell: true,
    });
  });

  it('updates saved launcher options without making consent an init opt-out', () => {
    initKit({ consentMappingSDK: mappingSetting });
    kit._launcherAttachState.context = {
      accountId: '000000',
      launcherOptions: { sandbox: true },
      legacyRoktExtensions: [],
    };
    consent.targeted_advertising = { Consented: false };
    kit.refreshConsentPrivacy();
    expect(kit._launcherAttachState.context.launcherOptions.noTargeting).toBe(true);
    expect(mp.Rokt.launcherOptions.noTargeting).toBeUndefined();
    consent.targeted_advertising = { Consented: true };
    kit.refreshConsentPrivacy();
    expect(kit._launcherAttachState.context.launcherOptions).toEqual({ sandbox: true });
  });

  it.each([
    ['no privacy options', {}],
    ['noDeviceId', { noDeviceId: true }],
    ['init opt-outs', { noTargeting: true, doNotShareOrSell: true }],
  ])('leaves partners without a mapping or page opt-out unchanged (%s)', (_name, options) => {
    mp.Rokt.launcherOptions = { ...options };
    useManager({
      noTargeting: (options as Flags).noDeviceId === true,
      noFunctional: (options as Flags).noDeviceId === true,
    });
    const persistence = vi.spyOn(storage, 'setDevicePersistenceDisabled');
    initKit();
    const initPersistenceCalls = persistence.mock.calls.length;
    expect(kit.attachLauncher.mock.calls[0][1]).toEqual({ ...options, integrationName: kit.integrationName });
    kit.launcher = launcher;
    kit._launcherAttachState.context = {
      accountId: '000000',
      launcherOptions: { ...options },
      legacyRoktExtensions: [],
    };
    consent.targeted_advertising = { Consented: false };
    kit.process({ EventDataType: 4, EventName: 'event', EventAttributes: {} });
    kit.onUserIdentified(currentUser());
    kit.refreshConsentPrivacy();
    expect(manager.replaceDerivedFlags).not.toHaveBeenCalled();
    expect(manager.syncNoTargetingAttribute).not.toHaveBeenCalled();
    expect(launcher.setPrivacyControl).not.toHaveBeenCalled();
    expect(persistence.mock.calls.length).toBe(initPersistenceCalls);
    expect(kit._launcherAttachState.context.launcherOptions).toEqual(options);
  });

  it('applies a page opt-out to the launcher without a mapping', () => {
    initKit();
    kit.launcher = launcher;
    kit._launcherAttachState.context = { accountId: '000000', launcherOptions: {}, legacyRoktExtensions: [] };
    manager.pageFlags.noTargeting = true;
    kit.process({ EventDataType: 4, EventName: 'event', EventAttributes: {} });
    kit.process({ EventDataType: 4, EventName: 'event', EventAttributes: {} });
    expect(manager.replaceDerivedFlags).not.toHaveBeenCalled();
    expect(launcher.setPrivacyControl).toHaveBeenCalledTimes(1);
    expect(launcher.setPrivacyControl).toHaveBeenLastCalledWith({
      noTargeting: true,
      noFunctional: false,
      doNotShareOrSell: false,
    });
    expect(kit._launcherAttachState.context.launcherOptions).toEqual({ noTargeting: true });
    expect(attributes.$NoTargeting).toBe(true);
  });

  it('creates a launcher with a decline made before the launcher script loaded', async () => {
    const originalWindowRokt = (window as any).Rokt;
    const createLauncher = vi.fn(() => Promise.resolve({ selectPlacements: vi.fn() }));
    (window as any).Rokt = { createLauncher, createLocalLauncher: vi.fn() };
    try {
      initKit({ consentMappingSDK: mappingSetting });
      const [accountId, initOptions] = kit.attachLauncher.mock.calls[0];
      expect(initOptions.noTargeting).toBeUndefined();
      consent.targeted_advertising = { Consented: false };
      kit.refreshConsentPrivacy();
      kit.isPartnerInLocalLauncherTestGroup = () => false;
      kit.initRoktLauncher = vi.fn();
      await mp.forwarder.constructor.prototype.attachLauncher.call(kit, accountId, initOptions);
      expect(createLauncher).toHaveBeenCalledWith(expect.objectContaining({ accountId, noTargeting: true }));
      expect(initOptions.noTargeting).toBeUndefined();

      consent.targeted_advertising = { Consented: true };
      kit.refreshConsentPrivacy();
      await mp.forwarder.constructor.prototype.attachLauncher.call(kit, accountId, initOptions);
      expect((createLauncher.mock.calls[1] as any[])[0].noTargeting).toBeUndefined();
    } finally {
      (window as any).Rokt = originalWindowRokt;
    }
  });

  it('creates a launcher with unchanged options when there is no mapping or page opt-out', async () => {
    const originalWindowRokt = (window as any).Rokt;
    const createLauncher = vi.fn(() => Promise.resolve({ selectPlacements: vi.fn() }));
    (window as any).Rokt = { createLauncher, createLocalLauncher: vi.fn() };
    mp.Rokt.launcherOptions = { noTargeting: true, sandbox: true };
    useManager();
    try {
      initKit();
      const [accountId, initOptions] = kit.attachLauncher.mock.calls[0];
      kit.isPartnerInLocalLauncherTestGroup = () => false;
      kit.initRoktLauncher = vi.fn();
      await mp.forwarder.constructor.prototype.attachLauncher.call(kit, accountId, initOptions);
      expect(createLauncher).toHaveBeenCalledWith({ accountId, ...initOptions });
    } finally {
      (window as any).Rokt = originalWindowRokt;
    }
  });

  it('sends a grant made while the launcher was being created once it attaches', async () => {
    const originalWindowRokt = (window as any).Rokt;
    let resolveLauncher: (value: unknown) => void = () => {};
    const createLauncher = vi.fn(() => new Promise((resolve) => (resolveLauncher = resolve)));
    (window as any).Rokt = { createLauncher, createLocalLauncher: vi.fn() };
    try {
      initKit({ consentMappingSDK: mappingSetting });
      const [accountId, initOptions] = kit.attachLauncher.mock.calls[0];
      consent.targeted_advertising = { Consented: false };
      kit.refreshConsentPrivacy();
      kit.isPartnerInLocalLauncherTestGroup = () => false;
      kit.initRoktLauncher = vi.fn((created: unknown) => {
        kit.launcher = created;
        kit.refreshConsentPrivacy();
      });
      const attached = mp.forwarder.constructor.prototype.attachLauncher.call(kit, accountId, initOptions);
      expect(createLauncher).toHaveBeenCalledWith(expect.objectContaining({ noTargeting: true }));

      consent.targeted_advertising = { Consented: true };
      kit.process({ EventDataType: 4, EventName: 'event', EventAttributes: {} });
      resolveLauncher(launcher);
      await attached;
      expect(launcher.setPrivacyControl).toHaveBeenCalledTimes(1);
      expect(launcher.setPrivacyControl).toHaveBeenLastCalledWith({
        noTargeting: false,
        noFunctional: false,
        doNotShareOrSell: false,
      });
      kit.process({ EventDataType: 4, EventName: 'event', EventAttributes: {} });
      expect(launcher.setPrivacyControl).toHaveBeenCalledTimes(1);
    } finally {
      (window as any).Rokt = originalWindowRokt;
    }
  });

  it('does not start an exit-intent selection after a decline the kit has not yet refreshed', () => {
    const config = { placementIdentifier: 'exit' };
    const selectPlacements = vi.fn(() => Promise.resolve({}));
    mp.Rokt.selectPlacements = selectPlacements;
    initKit({ consentMappingSDK: mappingSetting });
    kit._exitIntentEnabledForAccount = true;
    kit.getEffectiveExitIntentConfig = vi.fn(() => config);
    kit._exitIntentConfig = config;
    consent.targeted_advertising = { Consented: false };
    expect(kit.handleExitIntent('mouse-exit-top', {})).toBe(false);
    expect(selectPlacements).not.toHaveBeenCalled();
    expect(kit._exitIntentConfig).toBeNull();
  });

  it('drops an exit-intent selection that waited across a targeting decline', async () => {
    const config = { placementIdentifier: 'exit' };
    initKit({ consentMappingSDK: mappingSetting });
    kit.launcher = launcher;
    kit._exitIntentEnabledForAccount = true;
    kit.getEffectiveExitIntentConfig = vi.fn(() => config);
    kit._exitIntentConfig = config;
    kit.extractExitIntentIdentifier = () => 'exit';
    let placement: unknown;
    mp.Rokt.selectPlacements = (options: Record<string, unknown>) => (placement = kit.selectPlacements(options));
    let finish: () => void;
    kit._workspaceSearchInFlightPromise = new Promise<void>((resolve) => {
      finish = resolve;
    });
    expect(kit.handleExitIntent('mouse-exit-top', {})).toBe(true);
    consent.targeted_advertising = { Consented: false };
    finish!();
    await placement;
    expect(launcher.selectPlacements).not.toHaveBeenCalled();
  });

  it('sends a waiting exit-intent selection without its internal marker when targeting stays allowed', async () => {
    const config = { placementIdentifier: 'exit' };
    initKit({ consentMappingSDK: mappingSetting });
    kit.launcher = launcher;
    kit._exitIntentConfig = config;
    kit.extractExitIntentIdentifier = () => 'exit';
    let placement: unknown;
    mp.Rokt.selectPlacements = (options: Record<string, unknown>) => (placement = kit.selectPlacements(options));
    let finish: () => void;
    kit._workspaceSearchInFlightPromise = new Promise<void>((resolve) => {
      finish = resolve;
    });
    kit.handleExitIntent('mouse-exit-top', {});
    finish!();
    await placement;
    expect(launcher.selectPlacements).toHaveBeenCalledTimes(1);
    expect(launcher.selectPlacements.mock.calls[0][0]).not.toHaveProperty('exitIntentOrigin');
  });

  it('sends a grant made while a terminated launcher was being recreated to the new launcher', async () => {
    const originalWindowRokt = (window as any).Rokt;
    let resolveLauncher: (value: unknown) => void = () => {};
    const createLauncher = vi.fn(() => new Promise((resolve) => (resolveLauncher = resolve)));
    (window as any).Rokt = { createLauncher, createLocalLauncher: vi.fn() };
    try {
      initKit({ consentMappingSDK: mappingSetting });
      const [accountId, initOptions] = kit.attachLauncher.mock.calls[0];
      const oldLauncher = { setPrivacyControl: vi.fn(), selectPlacements: vi.fn() };
      kit.launcher = oldLauncher;
      consent.targeted_advertising = { Consented: false };
      kit.refreshConsentPrivacy();
      kit.isPartnerInLocalLauncherTestGroup = () => false;
      kit.initRoktLauncher = vi.fn((created: unknown) => {
        kit.launcher = created;
        kit.refreshConsentPrivacy();
      });
      const recreated = mp.forwarder.constructor.prototype.attachLauncher.call(kit, accountId, initOptions);
      expect(createLauncher).toHaveBeenCalledWith(expect.objectContaining({ noTargeting: true }));

      consent.targeted_advertising = { Consented: true };
      kit.process({ EventDataType: 4, EventName: 'event', EventAttributes: {} });
      resolveLauncher(launcher);
      await recreated;
      expect(launcher.setPrivacyControl).toHaveBeenLastCalledWith({
        noTargeting: false,
        noFunctional: false,
        doNotShareOrSell: false,
      });
    } finally {
      (window as any).Rokt = originalWindowRokt;
    }
  });

  it('disarms exit intent on a targeting decline and re-arms it on a grant', () => {
    const config = { placementIdentifier: 'exit' };
    initKit({ consentMappingSDK: mappingSetting });
    kit._exitIntentEnabledForAccount = true;
    kit.getEffectiveExitIntentConfig = vi.fn(() => config);
    kit._exitIntentConfig = config;
    consent.targeted_advertising = { Consented: false };
    kit.refreshConsentPrivacy();
    expect(kit._exitIntentConfig).toBeNull();
    consent.targeted_advertising = { Consented: true };
    kit.refreshConsentPrivacy();
    expect(kit._exitIntentConfig).toBe(config);
  });

  it('disables device persistence but keeps page memory on a functional decline, and preserves GPC', () => {
    initKit({ consentMappingSDK: mappingSetting });
    consent.functional = { Consented: false };
    kit.refreshConsentPrivacy();
    expect(isDevicePersistenceDisabled()).toBe(true);
    expect(kit.isPageHistoryAllowed()).toBe(true);
    Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, value: true });
    expect(kit.isPageHistoryAllowed()).toBe(false);
    delete (navigator as any).globalPrivacyControl;
  });

  describe('preselection callbacks', () => {
    const PATHNAME = '/checkout/review';
    const preselectionConfig = JSON.stringify({
      schemaVersion: 1,
      entries: [
        {
          pathname: PATHNAME,
          targetPageIdentifier: 'confirmation_page',
          attributeKeys: ['email'],
          readEmailInput: true,
        },
      ],
    });
    const originalPathname = window.location.pathname;
    const originalGetActiveForwarders = mp._getActiveForwarders;

    beforeEach(() => {
      window.history.replaceState({}, '', PATHNAME);
      mp._getActiveForwarders = () => [kit];
    });

    afterEach(() => {
      window.history.replaceState({}, '', originalPathname);
      mp._getActiveForwarders = originalGetActiveForwarders;
      applyPreselectionConfigSetting('000000', undefined);
    });

    it.each([
      { label: 'goes out while consent holds', purpose: undefined, sent: true },
      { label: 'is dropped after a targeted_advertising decline', purpose: 'targeted_advertising', sent: false },
      { label: 'is dropped after a sale_of_data decline', purpose: 'sale_of_data', sent: false },
    ])('a typed email replacing a partner one that waited for the search $label', async ({ purpose, sent }) => {
      initKit({ consentMappingSDK: mappingSetting, preselectionConfig });
      kit.launcher = launcher;
      kit.filters = { filteredUser: currentUser() };
      kit.userAttributes = { email: 'shopper@example.c' };
      let finish: () => void;
      kit._workspaceSearchInFlightPromise = new Promise<void>((resolve) => {
        finish = resolve;
      });
      let placement: unknown;
      const rollback = vi.fn();
      const host = { selectPlacements: (options: any) => (placement = kit.selectPlacements(options)), log: vi.fn() };
      dispatchPreselect(
        host as any,
        {
          identifier: 'confirmation_page',
          preselect: true,
          attributes: { email: 'shopper@example.com' },
          preselectFormEmail: { key: 'email', mpid, replaced: true },
        },
        rollback,
      );
      if (purpose) consent[purpose] = { Consented: false };
      finish!();
      await placement;

      expect(launcher.selectPlacements).toHaveBeenCalledTimes(sent ? 1 : 0);
      expect(rollback).toHaveBeenCalledTimes(sent ? 0 : 1);
    });

    it.each([
      ['targeted_advertising', 'targeting'],
      ['sale_of_data', 'sharing'],
    ])('never reads a committed form field after a %s decline made since the last refresh', (purpose) => {
      initKit({ consentMappingSDK: mappingSetting, preselectionConfig });
      kit._preselectState.pending.push({ pathname: PATHNAME, event: { EventAttributes: {} } });
      consent[purpose] = { Consented: false };
      const input = document.createElement('input');
      input.type = 'text';
      const readValue = vi.fn(() => 'shopper@example.com');
      Object.defineProperty(input, 'value', { configurable: true, get: readValue });
      const event = { type: 'change', isTrusted: true, target: input } as unknown as Event;

      expect(isReadableFormEmailChange(kit._preselectState, kit.buildPreselectHost(), event)).toBe(false);
      expect(readValue).not.toHaveBeenCalled();
    });

    it('applies a functional decline made since the last refresh before recording a payment pick', () => {
      initKit({ consentMappingSDK: mappingSetting, preselectionConfig });
      expect(kit.onPaymentPick).toBeTypeOf('function');
      consent.functional = { Consented: false };

      kit.onPaymentPick({ t: Date.now(), family: 'card' });

      expect(isDevicePersistenceDisabled()).toBe(true);
      expect(sessionStorage.length).toBe(0);
    });

    it('applies a targeting decline made since the last refresh before handling a checkout intent', () => {
      initKit({ consentMappingSDK: mappingSetting, preselectionConfig });
      expect(kit.onCheckoutIntent).toBeTypeOf('function');
      const storedKeys = localStorage.length + sessionStorage.length;
      consent.targeted_advertising = { Consented: false };

      kit.onCheckoutIntent({ kind: 'commit', t: Date.now() });

      expect(kit._effectivePrivacyFlags?.noTargeting).toBe(true);
      expect(localStorage.length + sessionStorage.length).toBe(storedKeys);
    });

    it('applies a targeting decline made since the last refresh before handling a route change', () => {
      initKit({ consentMappingSDK: mappingSetting, preselectionConfig });
      expect(kit.onRouteChange).toBeTypeOf('function');
      consent.targeted_advertising = { Consented: false };
      window.history.replaceState({}, '', `${PATHNAME}/next`);

      kit.onRouteChange();

      expect(kit._effectivePrivacyFlags?.noTargeting).toBe(true);
      expect(kit._lastPreselectPathname).not.toBe(`${PATHNAME}/next`);
    });

    describe('cart attribute callbacks', () => {
      const cartConfig = JSON.stringify({
        schemaVersion: 1,
        entries: [
          {
            pathname: PATHNAME,
            targetPageIdentifier: 'confirmation_page',
            attributeKeys: ['email'],
            cartIntent: true,
            cartUserAttribute: 'cartItems',
          },
        ],
      });
      const storesForgetTime = () => JSON.stringify({ ...localStorage }).includes('forgottenAt');

      it('records the cart forget time while targeting is allowed', () => {
        initKit({ consentMappingSDK: mappingSetting, preselectionConfig: cartConfig });

        kit.setUserAttribute('cartItems', '[]');

        expect(storesForgetTime()).toBe(true);
      });

      it.each([
        ['setting', (k: typeof kit) => k.setUserAttribute('cartItems', '[]')],
        ['removing', (k: typeof kit) => k.removeUserAttribute('cartItems')],
      ])('applies a targeting decline made since the last refresh before %s the cart attribute', (_label, act) => {
        initKit({ consentMappingSDK: mappingSetting, preselectionConfig: cartConfig });
        consent.targeted_advertising = { Consented: false };

        act(kit);

        expect(kit._effectivePrivacyFlags?.noTargeting).toBe(true);
        expect(storesForgetTime()).toBe(false);
      });

      it.each([
        ['setting', (k: typeof kit) => k.setUserAttribute('cartItems', '[]')],
        ['removing', (k: typeof kit) => k.removeUserAttribute('cartItems')],
      ])('applies a functional decline made since the last refresh before %s the cart attribute', (_label, act) => {
        initKit({ consentMappingSDK: mappingSetting, preselectionConfig: cartConfig });
        consent.functional = { Consented: false };

        act(kit);

        expect(isDevicePersistenceDisabled()).toBe(true);
        expect(storesForgetTime()).toBe(false);
      });
    });

    it('applies a decline made since the last refresh in the form listener before anything else', () => {
      initKit({ consentMappingSDK: mappingSetting, preselectionConfig });
      expect(kit._preselectEmailInputListener).toBeTypeOf('function');
      consent.sale_of_data = { Consented: false };
      const input = document.createElement('input');
      const readValue = vi.fn(() => 'shopper@example.com');
      Object.defineProperty(input, 'value', { configurable: true, get: readValue });

      kit._preselectEmailInputListener({ type: 'input', isTrusted: true, target: input } as unknown as Event);

      expect(kit._effectivePrivacyFlags?.doNotShareOrSell).toBe(true);
      expect(readValue).not.toHaveBeenCalled();
    });
  });

  describe('failure handling', () => {
    it('does not let a failing launcher setter escape, and retries it on the next refresh', () => {
      initKit({ consentMappingSDK: mappingSetting });
      const setPrivacyControl = vi.fn(() => {
        throw new Error('launcher is being torn down');
      });
      kit.launcher = { ...launcher, setPrivacyControl };
      consent.targeted_advertising = { Consented: false };

      expect(() => kit.process({ EventDataType: 4, EventName: 'event', EventAttributes: {} })).not.toThrow();
      expect(setPrivacyControl).toHaveBeenCalledTimes(1);

      kit.refreshConsentPrivacy();
      expect(setPrivacyControl).toHaveBeenCalledTimes(2);
    });

    it('retries a launcher setter whose promise rejected', async () => {
      initKit({ consentMappingSDK: mappingSetting });
      const setPrivacyControl = vi.fn(() => Promise.reject(new Error('rejected')));
      kit.launcher = { ...launcher, setPrivacyControl };
      consent.targeted_advertising = { Consented: false };

      kit.refreshConsentPrivacy();
      await Promise.resolve();
      await Promise.resolve();
      kit.refreshConsentPrivacy();

      expect(setPrivacyControl).toHaveBeenCalledTimes(2);
    });

    it('retries a launcher setter that failed while lifting the last restriction', () => {
      initKit({ consentMappingSDK: mappingSetting });
      let failing = false;
      const setPrivacyControl = vi.fn(() => {
        if (failing) throw new Error('launcher is being torn down');
      });
      kit.launcher = { ...launcher, setPrivacyControl };
      consent.targeted_advertising = { Consented: false };
      kit.refreshConsentPrivacy();
      expect(setPrivacyControl).toHaveBeenCalledTimes(1);

      failing = true;
      consent.targeted_advertising = { Consented: true };
      kit.refreshConsentPrivacy();
      expect(setPrivacyControl).toHaveBeenCalledTimes(2);

      failing = false;
      kit.refreshConsentPrivacy();
      expect(setPrivacyControl).toHaveBeenCalledTimes(3);
      kit.refreshConsentPrivacy();
      expect(setPrivacyControl).toHaveBeenCalledTimes(3);
    });

    it('disables kit storage even when the $NoTargeting sync throws', () => {
      initKit({ consentMappingSDK: mappingSetting });
      manager.syncNoTargetingAttribute.mockImplementation(() => {
        throw new Error('forwarder failed');
      });
      consent.targeted_advertising = { Consented: false };
      consent.functional = { Consented: false };

      expect(() => kit.refreshConsentPrivacy()).not.toThrow();
      expect(isDevicePersistenceDisabled()).toBe(true);
    });
  });

  describe('mapping values and older versions', () => {
    const captureLogs = () => {
      const helperKit = new mp.forwarder.constructor();
      helperKit.attachLauncher = vi.fn(() => Promise.resolve());
      helperKit.init({ accountId: '000000' }, null, true, null, {});
      return vi.spyOn(helperKit.testHelpers.LoggingService.prototype, 'log');
    };
    const loggedCodes = (log: ReturnType<typeof captureLogs>) =>
      log.mock.calls.map((call: any[]) => call[0]?.code).filter((code: string) => code === 'CONSENT_PRIVACY_WARNING');

    it('matches mapping values in any letter case', () => {
      initKit({ consentMappingSDK: JSON.stringify([{ map: 'targeted_advertising', value: 'NoTargeting' }]) });
      consent.targeted_advertising = { Consented: false };
      kit.refreshConsentPrivacy();
      expect(kit._effectivePrivacyFlags?.noTargeting).toBe(true);
    });

    it('reports an unknown mapping value once', () => {
      const log = captureLogs();
      initKit({
        consentMappingSDK: JSON.stringify([
          { map: 'a', value: 'noTargetting' },
          { map: 'b', value: 'noTargetting' },
        ]),
      });
      expect(kit._consentMappings).toEqual([]);
      expect(loggedCodes(log)).toHaveLength(1);
    });

    it('reports a mapping that an older mParticle SDK cannot apply', () => {
      const log = captureLogs();
      delete (manager as any).replaceDerivedFlags;
      initKit({ consentMappingSDK: mappingSetting });
      expect(loggedCodes(log)).toHaveLength(1);
    });

    it('reports a mapping that an older launcher cannot apply after it loads', () => {
      const log = captureLogs();
      initKit({ consentMappingSDK: mappingSetting });
      kit.launcher = { selectPlacements: vi.fn(() => ({})) };
      consent.targeted_advertising = { Consented: false };
      kit.refreshConsentPrivacy();
      expect(loggedCodes(log)).toHaveLength(1);
    });
  });

  it('sends the exit-intent config to the extension when targeting is granted after the launcher attached', () => {
    const config = { placementIdentifier: 'exit' };
    const setExtensionData = vi.fn();
    const originalRoktGlobal = (window as any).Rokt;
    (window as any).Rokt = { ...(originalRoktGlobal || {}), setExtensionData };
    try {
      consent.targeted_advertising = { Consented: false };
      initKit({ consentMappingSDK: mappingSetting });
      kit._exitIntentEnabledForAccount = true;
      kit.getEffectiveExitIntentConfig = vi.fn(() => config);
      kit.launcher = launcher;
      setExtensionData.mockClear();

      consent.targeted_advertising = { Consented: true };
      kit.refreshConsentPrivacy();

      expect(setExtensionData).toHaveBeenCalledTimes(1);
    } finally {
      (window as any).Rokt = originalRoktGlobal;
    }
  });
});
