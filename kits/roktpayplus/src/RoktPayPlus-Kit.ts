//  Copyright 2026 Rokt Pte Ltd
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//
// Rokt Pay+ mParticle web kit.
//
// Re-emits the events an advertiser already logs through the mParticle web SDK to the
// embedding Rokt Pay+ plugin as postMessage signals. Everything lives in this single file.
//
//   - Page views drive funnel progression (stepComplete), matched on the screen name.
//   - Custom events drive the conversion and other outcomes, matched on the event name.
//   - initiated is emitted once when the kit initializes.

import type { KitInterface, SDKEvent } from '@mparticle/web-sdk/internal';

// ============================================================
// Constants
// ============================================================

const name = 'RoktPayPlus';

// Module ID assigned by mParticle when the kit is registered.
const moduleId = 184;

// mParticle message types (SDKEvent.EventDataType values).
const MessageType = {
  SessionStart: 1,
  SessionEnd: 2,
  PageView: 3,
  PageEvent: 4,
} as const;

// The Pay+ signals the Rokt plugin understands. Values match the plugin's MessageEventType.
// `stepComplete` is the progression signal used by the Pay+ plugin.
const SIGNALS = {
  INITIATED: 'initiated',
  STEP_COMPLETE: 'stepComplete',
  APPROVED: 'approved',
  PENDING: 'pending',
  LOGGED_IN: 'loggedIn',
  ACCOUNT_CREATED: 'accountCreated',
  OFFER_SAVED: 'offerSaved',
  PURCHASE_COMPLETED: 'purchaseCompleted',
  FORM_SUBMITTED: 'formSubmitted',
  PENDING_SUCCESS: 'pendingSuccess',
  CLOSE: 'close',
  REMOVE_LOADING_OVERLAY: 'removeLoadingOverlay',
  GWP_APPROVED: 'gwpApproved',
} as const;

const DEFAULT_CONVERSION_EVENT_NAME = 'conversion';

// Custom event settings: each maps a custom event name (or comma-separated list) to a signal.
const EVENT_SETTING_TO_SIGNAL: ReadonlyArray<{ setting: keyof RoktPayPlusKitSettings; signal: string }> = [
  { setting: 'approvedEventName', signal: SIGNALS.APPROVED },
  { setting: 'pendingEventName', signal: SIGNALS.PENDING },
  { setting: 'loggedInEventName', signal: SIGNALS.LOGGED_IN },
  { setting: 'accountCreatedEventName', signal: SIGNALS.ACCOUNT_CREATED },
  { setting: 'offerSavedEventName', signal: SIGNALS.OFFER_SAVED },
  { setting: 'purchaseCompletedEventName', signal: SIGNALS.PURCHASE_COMPLETED },
  { setting: 'formSubmittedEventName', signal: SIGNALS.FORM_SUBMITTED },
  { setting: 'pendingSuccessEventName', signal: SIGNALS.PENDING_SUCCESS },
  { setting: 'closeEventName', signal: SIGNALS.CLOSE },
  { setting: 'removeLoadingOverlayEventName', signal: SIGNALS.REMOVE_LOADING_OVERLAY },
  { setting: 'gwpApprovedEventName', signal: SIGNALS.GWP_APPROVED },
];

// ============================================================
// Types
// ============================================================

// Settings configured in the mParticle dashboard, delivered to init() as forwarderSettings.
interface RoktPayPlusKitSettings {
  progressionScreenNames?: string;
  approvedEventName?: string;
  pendingEventName?: string;
  loggedInEventName?: string;
  accountCreatedEventName?: string;
  offerSavedEventName?: string;
  purchaseCompletedEventName?: string;
  formSubmittedEventName?: string;
  pendingSuccessEventName?: string;
  closeEventName?: string;
  removeLoadingOverlayEventName?: string;
  conversionEventName?: string;
  // Custom event name(s) that signal a gift-with-purchase conversion.
  gwpApprovedEventName?: string;
}

interface KitConfig {
  progressionScreens: string[];
  progressionConfigured: boolean;
  eventNameToSignal: Record<string, string>;
  eventConfigured: boolean;
  defaultConversionEventName: string;
}

interface RoktSignalMessage {
  source: 'rokt-payplus-kit';
  type: string;
  detail?: Record<string, unknown>;
  trigger?: string;
}

// ============================================================
// Module-level helpers
// ============================================================

function parseList(value?: string): string[] {
  if (!value || typeof value !== 'string') {
    return [];
  }
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildConfig(settings: RoktPayPlusKitSettings): KitConfig {
  const progressionScreens = parseList(settings.progressionScreenNames);

  const eventNameToSignal: Record<string, string> = {};
  for (const { setting, signal } of EVENT_SETTING_TO_SIGNAL) {
    for (const eventName of parseList(settings[setting])) {
      eventNameToSignal[eventName] = signal;
    }
  }

  return {
    progressionScreens,
    progressionConfigured: progressionScreens.length > 0,
    eventNameToSignal,
    eventConfigured: Object.keys(eventNameToSignal).length > 0,
    defaultConversionEventName: settings.conversionEventName || DEFAULT_CONVERSION_EVENT_NAME,
  };
}

// The meaningful screen name lives in the page view's screen_name attribute (the server
// upload nests this as custom_attributes.screen_name; the top-level page name is generic).
// Fall back to the event name when the attribute is absent.
function resolveScreenName(event: SDKEvent): string {
  const fromAttr = event.EventAttributes && event.EventAttributes.screen_name;
  return fromAttr || event.EventName;
}

// Resolve the window the kit should post Pay+ signals to. Pay+ only ever runs inside an
// iframe, so the kit signals only when framed: window.parent differs from self (which also
// covers nested frames). On a standalone top-level page parent === self, so this returns null
// and the kit stays silent instead of messaging its own window.
function getEmbeddingTarget(): Window | null {
  if (typeof window === 'undefined') {
    return null;
  }
  if (window.parent && window.parent !== window) {
    return window.parent;
  }
  return null;
}

// Emit a Pay+ signal to the embedding parent (the Rokt plugin). No-ops when the page is not
// framed, so the SDK running on a standalone advertiser page never makes postMessage calls.
function emitSignal(type: string, detail?: Record<string, unknown>, trigger?: string): void {
  const target = getEmbeddingTarget();
  if (!target || typeof target.postMessage !== 'function') {
    return;
  }
  const message: RoktSignalMessage = { source: 'rokt-payplus-kit', type };
  if (detail !== undefined) {
    message.detail = detail;
  }
  if (trigger !== undefined) {
    message.trigger = trigger;
  }
  // Demo/POC uses '*'. Production should target the plugin's known origin.
  target.postMessage(message, '*');
}

function isObject(val: unknown): val is Record<string, unknown> {
  return val != null && typeof val === 'object' && Array.isArray(val) === false;
}

// ============================================================
// Kit
// ============================================================

class RoktPayPlusKit implements KitInterface {
  public name = name;
  public id = moduleId;
  public isInitialized = false;

  private config: KitConfig = buildConfig({});

  public init(settings: Record<string, unknown>): string {
    this.config = buildConfig((settings || {}) as RoktPayPlusKitSettings);

    // Initialization is the reliable "app loaded and ready" moment. The session-start event
    // is not consistently forwarded to a kit that registers during init, so we emit here.
    emitSignal(SIGNALS.INITIATED, undefined, 'SDK forwarder init (app loaded)');
    this.isInitialized = true;

    return 'Successfully initialized forwarder: ' + name;
  }

  public process(event: SDKEvent): string {
    if (!this.isInitialized) {
      return 'Kit not initialized: ' + name;
    }

    switch (event.EventDataType) {
      case MessageType.PageView:
        this.handlePageView(event);
        break;
      case MessageType.PageEvent:
        this.handleCustomEvent(event);
        break;
      default:
        break;
    }

    return 'Successfully sent to forwarder: ' + name;
  }

  // Page views are funnel progression only. A configured progression screen (or any page
  // view when none are configured) emits stepComplete. A page view is never the conversion.
  private handlePageView(event: SDKEvent): void {
    const screen = resolveScreenName(event);
    if (!screen) {
      return;
    }
    const isStep = !this.config.progressionConfigured || this.config.progressionScreens.indexOf(screen) !== -1;
    if (isStep) {
      emitSignal(SIGNALS.STEP_COMPLETE, { step: screen }, "logPageView('" + screen + "')");
    }
  }

  // Custom events carry the conversion and other outcomes, matched on the event name.
  private handleCustomEvent(event: SDKEvent): void {
    const eventName = event.EventName;
    if (!eventName) {
      return;
    }

    const mapped = this.config.eventNameToSignal[eventName];
    if (mapped) {
      emitSignal(mapped, event.EventAttributes || {}, "logEvent('" + eventName + "')");
      return;
    }

    if (!this.config.eventConfigured && eventName === this.config.defaultConversionEventName) {
      emitSignal(SIGNALS.APPROVED, event.EventAttributes || {}, "logEvent('" + eventName + "', Transaction)");
    }
  }
}

// ============================================================
// Kit registration
// ============================================================

function getId(): number {
  return moduleId;
}

function register(config: { kits?: Record<string, unknown> }): void {
  if (!isObject(config)) {
    window.console.log("'config' must be an object. You passed in a " + typeof config);
    return;
  }
  if (!isObject(config.kits)) {
    config.kits = {};
  }
  config.kits[name] = { constructor: RoktPayPlusKit };
  window.console.log('Successfully registered ' + name + ' to your mParticle configuration');
}

if (typeof window !== 'undefined') {
  const w = window as unknown as { mParticle?: { addForwarder?: (c: unknown) => void } };
  if (w.mParticle && typeof w.mParticle.addForwarder === 'function') {
    w.mParticle.addForwarder({ name, constructor: RoktPayPlusKit, getId });
  }
}

export { register, RoktPayPlusKit };
export type { RoktPayPlusKitSettings };
