//  Copyright 2025 mParticle, Inc.
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

// ============================================================
// Types
// ============================================================

import { KitInterface, IMParticleUser, SDKEvent } from '@mparticle/web-sdk/internal';
import type { IUserIdentities } from '@mparticle/web-sdk';

import {
  isSelectPlacementsAttributePersistenceDenied,
  removeSelectPlacementsAttributePersistenceDeniedAttributes,
} from './selectPlacementsAttributePersistence';

import {
  PageEvent,
  PAGE_VIEWS_MAX_COUNT,
  buildPageEvents,
  loadPageViews,
  writePageViews,
  clearPageViews,
  readCanonicalUrl,
  captureUtmParams,
  isAutoPageView,
  loadUtmParams,
  clearUtmParams,
} from './pageViewStorage';
import { isLocalStorageAvailable, setDevicePersistenceDisabled, removeKitStorageFromDevice } from './storage';
import {
  cancelScheduledDispatch as cancelScheduledPreselectDispatch,
  createPreselectState,
  maybeFirePreselect as maybeFirePreselectExternal,
  maybeFirePreselectForPathname as maybeFirePreselectForPathnameExternal,
  maybeFirePreselectForEvent as maybeFirePreselectForEventExternal,
  maybeFirePreselectForCartPageView as maybeFirePreselectForCartPageViewExternal,
  isPreselectCartAttributeKey,
  hasPreselectCartPageView,
  withoutPreselectCartGateAttribute,
  isPreselectTriggerEventName,
  hasPreselectionConfigForAccount,
  applyPreselectionConfigSetting,
  flushPendingPreselectDispatches as flushPendingPreselectDispatchesExternal,
  applyPreselectAttributeDefaults,
  getPreselectAttributeDefaults,
  findPreselectionConfigByIdentifier,
  findPreselectionEntryByKey,
  getCallIdentifier,
  getPreselectLookupAttributes,
  usesTargetPageIdentifierAttribute,
  getPreselectCacheIdentityKeys,
  getPreselectCacheMatchTokens,
  getPreselectCacheMatchValues,
  getPreselectCacheMatchKeys,
  getPreselectDefaultedMarker,
  getPreselectIntentSelectors,
  isPreselectAttributeKey,
  isPreselectEmailKey,
  reportPreselectArrival,
  recordPreselectPaymentClick,
  type PreselectState,
  type PreselectHost,
  handlePreselectIntentSignal,
  handlePreselectPaymentPick,
  recordPreselectIntentPath,
  isReadableFormEmailChange,
  recordShopperInput,
  hasEmailInputEntry,
  hasPartnerEmail,
  hasPreselectEmail,
  PRESELECT_DEFAULTED_ATTRIBUTE,
  PRESELECT_TRIGGER_ATTRIBUTE,
  getPreselectRollback,
  canDispatchPreselection,
  PRESELECT_FORM_EMAIL_OPTION,
  PRESELECT_BOUND_USER_OPTION,
  PRESELECT_ENTRY_OPTION,
  type PreselectIntentSignal,
  type PreselectPaymentPickSignal,
  isAutoClickEvent,
} from './preselection/preselection';
import type { PreselectionConfigEntry } from './preselection/preselectionConfig';
import { clearPendingPreselect, removeLegacyPendingPreselects } from './preselection/pendingPreselectStorage';
import { clearActivePreselects, removeLegacyActivePreselects } from './preselection/activePreselectStorage';
import { clearPreselectArrivals, forgetPreselectCartAdd } from './preselection/preselectArrivalStorage';
import { buildPreselectDiagnosticLogEntry } from './preselection/diagnosticTiming';

import {
  isObject,
  isString,
  isEmpty,
  isFunction,
  cleanPageUrl,
  cleanReportingUrl,
  djb2,
  parseKitSettingJson,
  readOwnValue,
} from './utils';
import {
  createLauncherAttachState,
  markLauncherAttached,
  markLauncherAttachFailed,
  markLauncherTerminated,
  rememberAttachContext,
  recreateIfTerminated,
  resetLauncherAttachState,
  type LauncherAttachState,
  type RoktLauncherOptions,
} from './launcherAttachState';
import { ExitIntentWatcher, type ExitIntentConfig, type LeadCapturePayload } from './ExitIntentWatcher';

interface PrivacyFlags {
  noTargeting: boolean;
  noFunctional: boolean;
  doNotShareOrSell: boolean;
}

interface ConsentMapping {
  map: string;
  value: keyof PrivacyFlags;
}

const PRIVACY_FLAG_KEYS: ReadonlyArray<keyof PrivacyFlags> = ['noTargeting', 'noFunctional', 'doNotShareOrSell'];
const NO_PRIVACY_FLAGS: PrivacyFlags = { noTargeting: false, noFunctional: false, doNotShareOrSell: false };

interface RoktKitSettings {
  accountId: string;
  roktExtensions?: string;
  placementEventMapping?: string;
  placementEventAttributeMapping?: string;
  hashedEmailUserIdentityType?: string;
  onboardingExpProvider?: string;
  loggingUrl?: string;
  errorUrl?: string;
  workspaceIdSyncApiKey?: string;
  preselectionConfig?: string;
  consentMappingSDK?: string;
}

interface EventAttributeCondition {
  operator: string;
  attributeValue: string;
}

interface PlacementEventRule {
  eventAttributeKey: string;
  conditions: EventAttributeCondition[];
}

interface EventAttributeMapping {
  value: string;
  map: string;
  conditions?: EventAttributeCondition[];
}

interface PlacementEventMappingEntry {
  jsmap: string;
  value: string;
}

interface RoktExtensionEntry {
  value: string;
}


// What a selection's `on` delivers: the placement-sent body and the placement it came from.
interface RoktSelectionEvent {
  body?: { domain?: unknown };
  placement?: { id?: unknown };
}

interface RoktSelection {
  context?: {
    sessionId?: Promise<string>;
  };
  on?: (eventName: string) => { subscribe?: (callback: (event?: RoktSelectionEvent) => void) => unknown } | undefined;
  then?: (callback: (sel: RoktSelection) => void) => Promise<void>;
  catch?: (callback: () => void) => void;
}

interface RoktLauncher {
  selectPlacements(options: Record<string, unknown>): RoktSelection | Promise<RoktSelection>;
  hashAttributes(attributes: Record<string, unknown>): Promise<Record<string, unknown>>;
  use(extensionName: string): Promise<unknown>;
  terminate(): Promise<void>;
  setPrivacyControl?(flags: PrivacyFlags): Promise<void> | void;
  enablePreselection?: boolean;
  preselectVariant?: 'widened' | 'standard';
}

interface RoktGlobal {
  createLauncher(options: RoktLauncherOptions): Promise<RoktLauncher>;
  createLocalLauncher(options: RoktLauncherOptions): RoktLauncher;
  currentLauncher?: RoktLauncher;
  setExtensionData(data: Record<string, unknown>): void;
}

// FilteredUser is the IMParticleUser shape we receive after kit filtering.
// `getMPID` and `getUserIdentities` are inherited from the SDK's `User` base type.
type FilteredUser = IMParticleUser;

// TODO: Replace with `IIdentitySearchResult` from `@mparticle/web-sdk` once
// a version that exports it is published (currently on a feature branch in
// mParticle/mparticle-web-sdk PR #1255). The shape below is intentionally
// structurally identical so the swap is a one-line import change.
interface WorkspaceIdSyncResult {
  httpCode: number;
  body?: {
    context?: string | null;
    mpid?: string;
    matched_identities?: Record<string, string>;
    is_ephemeral?: boolean;
    is_logged_in?: boolean;
  };
}

// TODO: Replace with `IdentitySearchCallback`-compatible reference from
// `@mparticle/web-sdk` once published (mirrors `SDKIdentityApi.search`).
type WorkspaceIdSyncSearcher = (
  apiKey: string,
  knownIdentities: IUserIdentities,
  callback: (result: WorkspaceIdSyncResult) => void,
) => void;

interface CallTimeUser {
  mpid: string;
  loggedIn: boolean;
  hasIdentities: boolean;
  identityCallCount: number;
}

interface KitFilters {
  userAttributeFilters?: string[];
  filterUserAttributes?: (attributes: Record<string, unknown>, filters?: string[]) => Record<string, unknown>;
  filteredUser?: FilteredUser | null;
}

interface RoktManager {
  attachKit(kit: RoktKit): void | Promise<void>;
  flushOnShoppableAdsReadyMessageQueue?(kit: RoktKit): void;
  selectPlacements?(options: Record<string, unknown>): RoktSelection | Promise<RoktSelection> | undefined;
  filters?: KitFilters;
  domain?: string;
  launcherOptions?: Record<string, unknown>;
  getLocalSessionAttributes?(): Record<string, unknown>;
  setLocalSessionAttribute?(key: string, value: unknown): void;
}

interface MParticleInstance {
  _CookieConsentManager?: {
    replaceDerivedFlags?(flags: Partial<PrivacyFlags>): void;
    syncNoTargetingAttribute?(user: IMParticleUser | null): void;
    getNoTargeting(): boolean;
    getNoFunctional(): boolean;
    getDoNotShareOrSell(): boolean;
  };
  setIntegrationAttribute(moduleId: number, attrs: Record<string, unknown>): void;
}

interface OptimizelyState {
  getActiveExperimentIds(): string[];
  getVariationMap(): Record<string, { id: string }>;
}

interface OptimizelyGlobal {
  get(key: 'state'): OptimizelyState;
}

// Our view of the mParticle global with Rokt-specific extensions.
// We access window.mParticle via an explicit cast (see `mp()` helper below)
// rather than augmenting Window to avoid conflicts with @mparticle/web-sdk declarations.
interface MParticleExtended {
  Rokt: RoktManager;
  addForwarder(config: ForwarderRegistration): void;
  getVersion(): string;
  generateHash(value: string): string | number;
  logEvent(name: string, type: number, attrs?: Record<string, unknown>): void;
  EventType: { Other: number };
  getInstance(): MParticleInstance;
  // Identity type names to their numeric values, e.g. Other: 0.
  IdentityType?: Record<string, unknown>;
  getDeviceId?(): string;
  sessionManager?: { getSession?(): string; getSessionId?(): string };
  _getActiveForwarders(): Array<{ name: string }>;
  config?: { isLocalLauncherEnabled?: boolean; isLoggingEnabled?: boolean };
  captureTiming?(metricName: string): void;
  forwarder?: RoktKit;
  loggedEvents?: Array<Record<string, unknown>>;
  _registerErrorReportingService?(service: ErrorReportingService): void;
  _registerLoggingService?(service: LoggingService): void;
  Identity?: {
    search?: WorkspaceIdSyncSearcher;
    modify?: (identityApiData: { userIdentities?: IUserIdentities }, callback?: () => void) => void;
    getCurrentUser?: () => {
      setUserAttribute?: (key: string, value: unknown) => void;
      getMPID?: () => string;
      getConsentState?: () => { getGDPRConsentState?: () => Record<string, { Consented?: boolean }> } | null;
    } | null;
  };
}

interface TestHelpers {
  generateLauncherScript: (domain: string | undefined, extensions: string[]) => string;
  generateThankYouElementScript: (domain: string | undefined) => string;
  extractRoktExtensionConfig: (settingsString?: string) => RoktExtensionConfig;
  hashEventMessage: (messageType: number, eventType: number, eventName: string) => string | number;
  parseSettingsString: <T>(settingsString?: string) => T[];
  generateMappedEventLookup: (placementEventMapping: PlacementEventMappingEntry[]) => Record<string, string>;
  generateMappedEventAttributeLookup: (mapping: EventAttributeMapping[]) => Record<string, PlacementEventRule[]>;
  sendAdBlockMeasurementSignals: (domain: string | undefined, version: string | null) => void;
  createAutoRemovedIframe: (src: string) => void;
  djb2: (str: string) => number;
  setAllowedOriginHashes: (hashes: number[]) => void;
  ReportingTransport: typeof ReportingTransport;
  ErrorReportingService: typeof ErrorReportingService;
  LoggingService: typeof LoggingService;
  RateLimiter: typeof RateLimiter;
  ErrorCodes: typeof ErrorCodes;
  WSDKErrorSeverity: typeof WSDKErrorSeverity;
  resetLauncherAttachState: () => void;
}

interface ForwarderRegistration {
  name: string;
  constructor: new () => RoktKit;
  getId: () => number;
}

interface ReportingConfig {
  loggingUrl?: string;
  errorUrl?: string;
  integrationDomain?: string;
  isLoggingEnabled: boolean;
}

interface ErrorReport {
  message: string;
  code?: string;
  severity?: string;
  stackTrace?: string;
}

// A log-delivery failure. statusCode is set when the request reached the server
// and returned a non-2xx status (server-side); it is absent for network-level
// failures such as ad-blockers, offline, or CORS rejections (client-side).
interface DeliveryError extends Error {
  statusCode?: number;
}

interface LogEntry {
  message: string;
  code?: string;
}

interface RoktExtensionConfig {
  roktExtensionsQueryParams: string[];
  legacyRoktExtensions: string[];
  loadThankYouElement: boolean;
}

declare global {
  interface Window {
    Rokt?: RoktGlobal;
    __rokt_li_guid__?: string;
    optimizely?: OptimizelyGlobal;
    // mParticle is declared as any to avoid conflicts with @mparticle/web-sdk type declarations.
    // We use the typed mp() accessor for all internal accesses.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mParticle: any;
  }
}

// ============================================================
// Module-level constants
// ============================================================

const name = 'Rokt';
const EMAIL_IDENTITY_TYPE = 7; // mParticle IdentityType.Email
const moduleId = 181;
const EVENT_NAME_SELECT_PLACEMENTS = 'selectPlacements';
// Attributes Rokt receives that the logged selectPlacements event leaves out, so they never reach the
// account's other outputs. Matched in any letter case. The core SDK keeps them off the user's profile.
const ROKT_ONLY_EVENT_ATTRIBUTES = ['paypalpayerid'];
const AUTO_BUTTON_CLICK_EVENT_NAME = 'Auto Button Click';
const AUTO_LINK_CLICK_EVENT_NAME = 'Auto Link Click';
// Marks a placement click in a field core's own clicks carry, so a data plan that drops unplanned
// attributes still leaves it apart from a page click.
const ROKT_PLACEMENT_LABEL_SOURCE = 'rokt_placement';
// A host name and nothing else, as the placement sends for a link pressed inside it.
const LINK_DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/;
// A placement sends POSITIVE_ENGAGEMENT right after the OFFER_ENGAGEMENT of the same press, so a press
// with no positive one in this time was a negative response.
const ENGAGEMENT_PAIR_MS = 500;
const ADBLOCK_CONTROL_DOMAIN = 'apps.roktecommerce.com';
const INIT_LOG_SAMPLING_RATE = 0.1;
const ROKT_THANK_YOU_JOURNEY_EXTENSION = 'ThankYouPageJourney';
const ROKT_INTEGRATION_SCRIPT_ID = 'rokt-launcher';
const ROKT_THANK_YOU_ELEMENT_SCRIPT_ID = 'rokt-thank-you-element';
const USER_IDENTIFIED_IN_WORKSPACE_KEY = 'userIdentifiedInWorkspace';

const MESSAGE_TYPE_PAGE_VIEW = 3; // mParticle MessageType.PageView
const MESSAGE_TYPE_SESSION_END = 2; // mParticle MessageType.SessionEnd
const PAGE_EVENTS_KEY = 'page_events';
const PAGE_VIEW_ATTRIBUTES_KEY = 'page_view_attributes';
const MPARTICLE_SESSION_ID_KEY = 'mparticle_session_id';
const MPARTICLE_DEVICE_ID_KEY = 'mparticle_device_id';
const EXIT_INTENT_EXTENSION_NAME = 'exit-intent';
const EXIT_INTENT_ACCOUNT_ID_OVERRIDES = [
  '3479519924056514560',
  '3484183287406608384',
  '3198447216177237634',
  '3292347205549055462',
];
const EXIT_INTENT_DEFAULT_IDENTIFIER = 'exit-intent-placement';
// Dispatch option marking a selection the kit started from exit intent. Stripped before the launcher call.
const EXIT_INTENT_ORIGIN_OPTION = 'exitIntentOrigin';

// Bound on how long selectPlacements will wait for an in-flight Workspace
// IDSync search before proceeding without the userIdentifiedInWorkspace flag.
// Long enough to cover the typical /v1/search round-trip (~50ms); short enough that a
// stalled search never blocks placement rendering on a thank-you page.
const WORKSPACE_SEARCH_SELECT_TIMEOUT_MS = 500;

// ============================================================
// Reporting service constants
// ============================================================

const ErrorCodes = {
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  UNHANDLED_EXCEPTION: 'UNHANDLED_EXCEPTION',
  IDENTITY_REQUEST: 'IDENTITY_REQUEST',
  LOG_DELIVERY_FAILURE: 'LOG_DELIVERY_FAILURE',
} as const;

const WSDKErrorSeverity = {
  ERROR: 'ERROR',
  INFO: 'INFO',
  WARNING: 'WARNING',
} as const;

const DEFAULT_ROKT_DOMAIN = 'apps.rokt-api.com';
const LOGGING_ENDPOINT = '/v1/log';
const ERROR_ENDPOINT = '/v1/errors';
const RATE_LIMIT_PER_SEVERITY = 10;

// ============================================================
// Helper: typed accessor for window.mParticle
// We use an explicit cast here to avoid conflicts with @mparticle/web-sdk
// type declarations while still providing full type safety for our usages.
// ============================================================

function mp(): MParticleExtended {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).mParticle as MParticleExtended;
}

// ============================================================
// Module-level utility functions
// ============================================================

function generateLauncherScript(domain: string | undefined, extensions: string[]): string {
  const launcherPath = '/wsdk/integrations/launcher.js';
  const baseUrl = [generateBaseUrl(domain), launcherPath].join('');

  if (!extensions || extensions.length === 0) {
    return baseUrl;
  }
  return baseUrl + '?extensions=' + extensions.join(',');
}

function generateThankYouElementScript(domain: string | undefined) {
  const thankYouElementPath = '/rokt-elements/rokt-element-thank-you.js';
  return [generateBaseUrl(domain), thankYouElementPath].join('');
}

function generateBaseUrl(domain: string | undefined) {
  const resolvedDomain = domain !== undefined ? domain : DEFAULT_ROKT_DOMAIN;

  if (resolvedDomain.includes('://')) {
    return resolvedDomain.replace(/\/+$/, '');
  }

  const protocol = 'https://';

  return [protocol, resolvedDomain].join('');
}

function generateReportingUrl(configuredUrl: string | undefined, domain: string | undefined, endpoint: string): string {
  if (configuredUrl) {
    if (configuredUrl.startsWith('http://') || configuredUrl.startsWith('https://')) {
      return configuredUrl;
    }
    return 'https://' + configuredUrl;
  }

  const hasNonHttpScheme = domain?.includes('://') && !/^https?:\/\//i.test(domain);
  const reportingDomain = hasNonHttpScheme ? undefined : domain;

  return generateBaseUrl(reportingDomain) + endpoint;
}

function loadRoktScript(
  scriptId: string,
  source: string,
  handlers?: { onLoad?: () => void; onError?: (e: Event | string) => void },
): void {
  if (document.getElementById(scriptId)) return; // resolves the preexisting script issue

  const target = document.head || document.body;
  const script = document.createElement('script');
  script.id = scriptId;
  script.type = 'text/javascript';
  script.src = source;
  script.async = true;
  script.crossOrigin = 'anonymous';
  (script as HTMLScriptElement & { fetchPriority: string }).fetchPriority = 'high';
  if (handlers?.onLoad) script.onload = handlers.onLoad;
  if (handlers?.onError) script.onerror = handlers.onError;
  target.appendChild(script);
}

function parseSettingsString<T>(settingsString?: string): T[] {
  if (!settingsString) {
    return [];
  }
  const settings = parseKitSettingJson(settingsString);
  if (settings === undefined) {
    console.error('Settings string contains invalid JSON');
    return [];
  }
  return settings as T[];
}

function extractRoktExtensionConfig(settingsString?: string): RoktExtensionConfig {
  const settings = settingsString ? parseSettingsString<RoktExtensionEntry>(settingsString) : [];
  const roktExtensionsQueryParams: string[] = [];
  const legacyRoktExtensions: string[] = [];
  let loadThankYouElement = false;

  for (let i = 0; i < settings.length; i++) {
    const extensionName = settings[i].value;
    if (extensionName === 'thank-you-journey') {
      loadThankYouElement = true;
      legacyRoktExtensions.push(ROKT_THANK_YOU_JOURNEY_EXTENSION);
    } else {
      roktExtensionsQueryParams.push(extensionName);
    }
  }

  return {
    roktExtensionsQueryParams,
    legacyRoktExtensions,
    loadThankYouElement,
  };
}

async function registerLegacyExtensions(legacyExtensions: string[], launcher: RoktLauncher | null) {
  const extensions: Promise<unknown>[] = [];
  if (launcher) {
    for (const extension of legacyExtensions) {
      extensions.push(launcher.use(extension));
    }
  }

  return Promise.all(extensions);
}

function generateMappedEventLookup(placementEventMapping: PlacementEventMappingEntry[]): Record<string, string> {
  if (!placementEventMapping) {
    return {};
  }

  const mappedEvents: Record<string, string> = {};
  for (let i = 0; i < placementEventMapping.length; i++) {
    const mapping = placementEventMapping[i];
    mappedEvents[mapping.jsmap] = mapping.value;
  }
  return mappedEvents;
}

function generateMappedEventAttributeLookup(
  placementEventAttributeMapping: EventAttributeMapping[],
): Record<string, PlacementEventRule[]> {
  const mappedAttributeKeys: Record<string, PlacementEventRule[]> = {};
  if (!Array.isArray(placementEventAttributeMapping)) {
    return mappedAttributeKeys;
  }
  for (let i = 0; i < placementEventAttributeMapping.length; i++) {
    const mapping = placementEventAttributeMapping[i];
    if (!mapping || !isString(mapping.value) || !isString(mapping.map)) {
      continue;
    }

    const mappedAttributeKey = mapping.value;
    const eventAttributeKey = mapping.map;

    if (!mappedAttributeKeys[mappedAttributeKey]) {
      mappedAttributeKeys[mappedAttributeKey] = [];
    }

    mappedAttributeKeys[mappedAttributeKey].push({
      eventAttributeKey: eventAttributeKey,
      conditions: Array.isArray(mapping.conditions) ? mapping.conditions : [],
    });
  }
  return mappedAttributeKeys;
}

function hashEventMessage(messageType: number, eventType: number, eventName: string): string | number {
  return mp().generateHash([messageType, eventType, eventName].join(''));
}

function generateIntegrationName(customIntegrationName?: string): string {
  const coreSdkVersion = mp().getVersion();
  const kitVersion = process.env.PACKAGE_VERSION;
  let integrationName = 'mParticle_' + 'wsdkv_' + coreSdkVersion + '_kitv_' + kitVersion;

  if (customIntegrationName) {
    integrationName += '_' + customIntegrationName;
  }
  return integrationName;
}

function isExitIntentAccountOverrideEnabled(accountId: string | null | undefined): boolean {
  return !!(accountId && EXIT_INTENT_ACCOUNT_ID_OVERRIDES.includes(accountId));
}

function createAutoRemovedIframe(src: string): void {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.src = src;
  iframe.onload = function () {
    iframe.onload = null;
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };
  const target = document.body || document.head;
  if (target) {
    target.appendChild(iframe);
  }
}

function sendAdBlockMeasurementSignals(domain: string | undefined, version: string | null): void {
  const originHash = djb2(window.location.origin);
  const allowedOriginHashes = RoktKit._allowedOriginHashes;
  if (allowedOriginHashes.indexOf(originHash) === -1) {
    return;
  }

  if (Math.random() >= INIT_LOG_SAMPLING_RATE) {
    return;
  }

  const guid = window.__rokt_li_guid__;
  if (!guid) {
    return;
  }

  if (domain && domain.includes('://') && !/^https:\/\//i.test(domain)) {
    return;
  }

  const pageUrl = cleanReportingUrl(window.location.href);
  const params =
    'version=' +
    encodeURIComponent(version ?? '') +
    '&launcherInstanceGuid=' +
    encodeURIComponent(guid) +
    '&pageUrl=' +
    encodeURIComponent(pageUrl);

  const existingBaseUrl = domain ? generateBaseUrl(domain) : 'https://apps.rokt.com';
  createAutoRemovedIframe(existingBaseUrl + '/v1/wsdk-init/index.html?' + params);

  createAutoRemovedIframe(
    'https://' + ADBLOCK_CONTROL_DOMAIN + '/v1/wsdk-init/index.html?' + params + '&isControl=true',
  );
}

// ============================================================
// Reporting helpers
// ============================================================

function _isDebugModeEnabled(): boolean {
  return typeof window !== 'undefined' && !!window.location?.search?.toLowerCase().includes('mp_enable_logging=true');
}

function _getReportingUrl(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const href = window.location?.href;
  return href ? cleanReportingUrl(href) : undefined;
}

function _getUserAgent(): string | undefined {
  return typeof window !== 'undefined' ? window.navigator?.userAgent : undefined;
}

class RateLimiter {
  private _logCount: Record<string, number> = {};

  incrementAndCheck(severity: string): boolean {
    const count = this._logCount[severity] || 0;
    const newCount = count + 1;
    this._logCount[severity] = newCount;
    return newCount > RATE_LIMIT_PER_SEVERITY;
  }
}

class ReportingTransport {
  private _isEnabled: boolean;
  private _integrationName: string;
  private _launcherInstanceGuid: string | undefined;
  private _accountId: string | null;
  private _rateLimiter: RateLimiter;
  private readonly _reporter = 'mp-wsdk';

  constructor(
    config: ReportingConfig,
    integrationName: string | null | undefined,
    launcherInstanceGuid: string | undefined,
    accountId: string | null | undefined,
    rateLimiter?: RateLimiter,
  ) {
    const isLoggingEnabled = config.isLoggingEnabled;
    this._integrationName = integrationName || '';
    this._launcherInstanceGuid = launcherInstanceGuid;
    this._accountId = accountId || null;
    this._rateLimiter = rateLimiter || new RateLimiter();
    this._isEnabled = _isDebugModeEnabled() || isLoggingEnabled;
  }

  send(
    url: string,
    severity: string,
    msg: string,
    code?: string,
    stackTrace?: string,
    onError?: (error: DeliveryError) => void,
  ): void {
    if (!this._isEnabled || this._rateLimiter.incrementAndCheck(severity)) {
      return;
    }

    try {
      const logRequest = {
        additionalInformation: {
          message: msg,
          version: this._integrationName,
        },
        severity,
        code: code || ErrorCodes.UNKNOWN_ERROR,
        url: _getReportingUrl(),
        deviceInfo: _getUserAgent(),
        stackTrace,
        reporter: this._reporter,
        integration: this._integrationName,
      };

      const headers: Record<string, string> = {
        Accept: 'text/plain;charset=UTF-8',
        'Content-Type': 'application/json',
        'rokt-launcher-version': this._integrationName,
        'rokt-wsdk-version': 'joint',
      };

      if (this._launcherInstanceGuid) {
        headers['rokt-launcher-instance-guid'] = this._launcherInstanceGuid;
      }
      if (this._accountId) {
        headers['rokt-account-id'] = this._accountId;
      }

      fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(logRequest),
      })
        .then((response: Response) => {
          // fetch only rejects on network failures; an HTTP 5xx resolves with
          // ok === false. Surface server-side failures so they are not swallowed.
          if (!response.ok) {
            const serverError: DeliveryError = new Error('HTTP ' + response.status + ' from log endpoint');
            serverError.statusCode = response.status;
            throw serverError;
          }
        })
        .catch((error: DeliveryError) => {
          console.error('ReportingTransport: Failed to send log', error);
          if (onError) onError(error);
        });
    } catch (error) {
      console.error('ReportingTransport: Failed to send log', error);
      if (onError) onError(error as DeliveryError);
    }
  }
}

class ErrorReportingService {
  private _transport: ReportingTransport;
  private _errorUrl: string;

  constructor(
    config: ReportingConfig,
    integrationName: string | null | undefined,
    launcherInstanceGuid?: string,
    accountId?: string | null,
    rateLimiter?: RateLimiter,
  ) {
    this._transport = new ReportingTransport(config, integrationName, launcherInstanceGuid, accountId, rateLimiter);
    this._errorUrl = generateReportingUrl(config?.errorUrl, config?.integrationDomain, ERROR_ENDPOINT);
  }

  report(error: ErrorReport | null | undefined): void {
    if (!error) return;
    const severity = error.severity || WSDKErrorSeverity.ERROR;
    this._transport.send(this._errorUrl, severity, error.message, error.code, error.stackTrace);
  }
}

class LoggingService {
  private _intentObserveLines = 0;
  private readonly _transport: ReportingTransport;
  // Own ReportingTransport (and thus own RateLimiter) so a burst of
  // diagnostic timing entries can't starve the operational INFO budget
  // that _transport shares with page-view/quota logging via log().
  private readonly _placementDiagnosticTransport: ReportingTransport;
  // Fired and arrived lines are what pre-selection is judged on, so they get their own budget and a run
  // of held, missed or observed lines can't starve them.
  private readonly _preselectOutcomeTransport: ReportingTransport;
  private readonly _loggingUrl: string;
  private readonly _errorReportingService: { report: (e: ErrorReport) => void };

  constructor(
    config: ReportingConfig,
    errorReportingService: { report: (e: ErrorReport) => void },
    integrationName: string | null | undefined,
    launcherInstanceGuid?: string,
    accountId?: string | null,
    rateLimiter?: RateLimiter,
  ) {
    this._transport = new ReportingTransport(config, integrationName, launcherInstanceGuid, accountId, rateLimiter);
    this._placementDiagnosticTransport = new ReportingTransport(
      config,
      integrationName,
      launcherInstanceGuid,
      accountId,
    );
    this._preselectOutcomeTransport = new ReportingTransport(config, integrationName, launcherInstanceGuid, accountId);
    this._loggingUrl = generateReportingUrl(config?.loggingUrl, config?.integrationDomain, LOGGING_ENDPOINT);
    this._errorReportingService = errorReportingService;
  }

  log(entry: LogEntry | null | undefined): void {
    if (!entry) return;
    this._send(this._transport, entry);
  }

  logPlacementDiagnostic(entry: LogEntry | null | undefined): void {
    if (!entry) return;
    if (entry.code === 'PRESELECT_SKIPPED' && entry.message.includes('[reason=intent_observed]')) {
      if (this._intentObserveLines >= 4) return;
      this._intentObserveLines++;
    }
    const isOutcome = entry.code === 'PRESELECT_FIRED' || entry.code === 'PRESELECT_ARRIVED';
    this._send(isOutcome ? this._preselectOutcomeTransport : this._placementDiagnosticTransport, entry);
  }

  private _send(transport: ReportingTransport, entry: LogEntry): void {
    transport.send(
      this._loggingUrl,
      WSDKErrorSeverity.INFO,
      entry.message,
      entry.code,
      undefined,
      (error: DeliveryError) => {
        if (this._errorReportingService) {
          // A failed log POST is not itself an SDK error. Network-level failures
          // (ad-blockers, offline, CORS) are client-side noise and reported as a
          // WARNING; only a server-side non-2xx response stays at ERROR severity.
          const isServerSide = typeof error.statusCode === 'number';
          this._errorReportingService.report({
            message: 'LoggingService: Failed to send log: ' + error.message,
            code: ErrorCodes.LOG_DELIVERY_FAILURE,
            severity: isServerSide ? WSDKErrorSeverity.ERROR : WSDKErrorSeverity.WARNING,
          });
        }
      },
    );
  }
}

function buildPageEvent(event: SDKEvent, autoLogPageViewOn: boolean): PageEvent {
  const pageUrl = cleanPageUrl(window.location.href);
  const title = event.EventAttributes?.title;
  const eventTitle = isString(title) ? title : undefined;
  const pageTitle = isAutoPageView(event.EventAttributes, autoLogPageViewOn) ? eventTitle : eventTitle || document.title;
  const canonicalUrl = readCanonicalUrl();
  const activeTimeOnSite = event.ActiveTimeOnSite;

  return {
    pageUrl,
    sourceMessageId: event.SourceMessageId,
    timestamp: event.Timestamp,
    ...(pageTitle ? { pageTitle } : {}),
    ...(canonicalUrl !== undefined ? { canonicalUrl } : {}),
    ...(Number.isFinite(activeTimeOnSite) ? { activeTimeOnSite } : {}),
  };
}

// ============================================================
// RoktKit class
// ============================================================

class RoktKit implements KitInterface {
  // Static field for allowed origin hashes (mutable by testHelpers)
  public static _allowedOriginHashes: number[] = [-553112570, 549508659];

  private static readonly PERFORMANCE_MARKS = {
    RoktScriptAppended: 'mp:RoktScriptAppended',
  };

  private static readonly EMAIL_SHA256_KEY = 'emailsha256';

  // Public fields (accessed by tests and the mParticle framework)
  public name = name;
  public id = moduleId;
  public moduleId = moduleId;
  public isInitialized = false;
  public launcher: RoktLauncher | null = null;
  public filters: KitFilters = {};
  public userAttributes: Record<string, unknown> = {};
  private _lastPreselectPathname?: string;
  public onRouteChange?: () => void;
  public onCheckoutIntent?: (signal: PreselectIntentSignal) => void;
  // The account's configured confirm and checkout-step button selectors, read by the core SDK on each click.
  public checkoutIntentSelectors?: { commit?: string[]; checkout_step?: string[] };
  public onPaymentPick?: (signal: PreselectPaymentPickSignal) => void;
  // Flag set by the Workspace IDSync flow on a 200 response. Stored on the
  // kit instance and merged into placement attributes inside selectPlacements.
  public userIdentifiedInWorkspace = false;
  public testHelpers: TestHelpers | null = null;
  public placementEventMappingLookup: Record<string, string> = {};
  public placementEventAttributeMappingLookup: Record<string, PlacementEventRule[]> = {};
  public integrationName: string | null = null;
  public domain?: string;
  public errorReportingService: ErrorReportingService | null = null;
  public loggingService: LoggingService | null = null;

  // Private fields
  private _mappedEmailSha256Key?: string;
  private _onboardingExpProvider?: string;
  private _thankYouElementOnLoadCallback: (() => void) | null = null;
  private _isThankYouElementLoaded = false;
  private _workspaceIdSyncApiKey?: string;

  // Held during a search dispatch so the next selectPlacements call;
  // can wait for the HTTP response before reading userIdentifiedInWorkspace;
  // — otherwise the first placement call ships without the flag.
  private _workspaceSearchInFlightPromise: Promise<void> | null = null;
  // Stable serialization of the identifier set sent in the most recent
  // successful search dispatch. If a subsequent identification arrives with
  // an identical set, we skip the network call (the flag is still correct
  // from the prior search). Keyed over the full IUserIdentities map — not
  // just email — so partners passing hashed email through `other`/`other2-10`
  // or any other identifier benefit from the same dedupe. Cleared on logout
  // so a re-login re-evaluates fresh.
  private _workspaceLastSearchedIdentitiesKey?: string;

  private _launcherAttachState: LauncherAttachState = createLauncherAttachState();
  private _exitIntentConfig: ExitIntentConfig | null = null;
  private _exitIntentWatcher: ExitIntentWatcher = new ExitIntentWatcher({
    isKitReady: () => this.isKitReady(),
    onExitIntent: (reason: string, configuredAttributes: Record<string, unknown>) =>
      this.handleExitIntent(reason, configuredAttributes),
    onLeadCaptureSubmitted: (payload: LeadCapturePayload) =>
      this.applyIdentityCapturePayload(payload.identities, payload.userAttributes),
  });
  private _exitIntentEnabledForAccount = false;
  private _pendingInitWarnings: Array<{ message: string; code: string }> = [];
  private _consentPrivacyWarnings = new Set<string>();
  private _consentMappings: ConsentMapping[] = [];
  // Effective flags while they restrict more than init launcherOptions do; null otherwise.
  private _effectivePrivacyFlags: PrivacyFlags | null = null;
  private _noTargetingSyncedMpid: string | null | undefined;
  private _privacyControlLauncher: RoktLauncher | null = null;
  private _isRefreshingConsentPrivacy = false;
  private _hasDerivedPrivacyFlags = false;
  // The launcher being created was given restricting flags that may have lifted before it attached.
  private _isLauncherCreatedRestricted = false;
  // The launcher in place when that creation started (a terminated one during recreation); it is not the new one.
  private _launcherBeforeCreation: RoktLauncher | null = null;

  private accountId: string | null = null;
  private _preselectState: PreselectState = createPreselectState();
  private _preselectEmailInputListener?: (event: Event) => void;
  // Tracks identity callbacks so a modify that clears core's login flag is told apart from a logout that keeps the MPID.
  private _identityCallCount = 0;
  private _lastNonModifyCallCount = 0;
  private _isModifyIdentityCallInProgress = false;
  // Set by core on each kit instance: the identity types this connection filters out.
  public userIdentityFilters?: number[];

  // ---- Private helpers ----

  private getEventAttributeValue(event: SDKEvent, eventAttributeKey: string): unknown {
    const attributes = event && event.EventAttributes;
    if (!attributes) {
      return null;
    }

    const value = readOwnValue(attributes, eventAttributeKey);
    return value === undefined ? null : value;
  }

  private doesEventAttributeConditionMatch(condition: EventAttributeCondition, actualValue: unknown): boolean {
    if (!condition || !isString(condition.operator)) {
      return false;
    }

    const operator = condition.operator.toLowerCase();
    const expectedValue = condition.attributeValue;

    if (operator === 'exists') {
      return actualValue !== null;
    }

    if (actualValue == null) {
      return false;
    }

    if (operator === 'equals') {
      return String(actualValue) === String(expectedValue);
    }

    if (operator === 'contains') {
      return String(actualValue).indexOf(String(expectedValue)) !== -1;
    }

    return false;
  }

  private doesEventMatchRule(event: SDKEvent, rule: PlacementEventRule): boolean {
    if (!rule || !isString(rule.eventAttributeKey)) {
      return false;
    }

    const conditions = rule.conditions;
    if (!Array.isArray(conditions)) {
      return false;
    }

    const actualValue = this.getEventAttributeValue(event, rule.eventAttributeKey);

    if (conditions.length === 0) {
      return actualValue !== null;
    }
    for (let i = 0; i < conditions.length; i++) {
      if (!this.doesEventAttributeConditionMatch(conditions[i], actualValue)) {
        return false;
      }
    }

    return true;
  }

  private applyPlacementEventAttributeMapping(event: SDKEvent): void {
    const mappedAttributeKeys = Object.keys(this.placementEventAttributeMappingLookup);
    for (let i = 0; i < mappedAttributeKeys.length; i++) {
      const mappedAttributeKey = mappedAttributeKeys[i];
      const rulesForMappedAttributeKey = this.placementEventAttributeMappingLookup[mappedAttributeKey];
      if (isEmpty(rulesForMappedAttributeKey)) {
        continue;
      }

      // Require ALL rules for the same key to match (AND).
      let allMatch = true;
      for (let j = 0; j < rulesForMappedAttributeKey.length; j++) {
        if (!this.doesEventMatchRule(event, rulesForMappedAttributeKey[j])) {
          allMatch = false;
          break;
        }
      }
      if (!allMatch) {
        continue;
      }

      mp().Rokt.setLocalSessionAttribute?.(mappedAttributeKey, true);
    }
  }

  private capturePageView(event: SDKEvent, autoLogPageViewOn: boolean): void {
    let pageUrl: string | undefined;

    try {
      pageUrl = cleanReportingUrl(window.location.href);

      const pageViews = loadPageViews();
      const pageView = buildPageEvent(event, autoLogPageViewOn);
      pageViews.push(pageView);

      const requested = Math.min(pageViews.length, PAGE_VIEWS_MAX_COUNT);
      const stored = writePageViews(pageViews);
      if (stored === 0) {
        const reason = isLocalStorageAvailable() ? 'quota' : 'ls_unavailable';
        this.loggingService?.log({
          message: `Rokt Kit: Failed to persist page view for ${pageUrl} [reason: ${reason}]`,
          code: 'PAGE_VIEW_CAPTURE_FAILED',
        });
      } else if (stored < requested) {
        this.loggingService?.log({
          message: `Rokt Kit: Page view storage reduced from ${requested} to ${stored} record(s) under quota pressure [reason: quota_eviction]`,
          code: 'PAGE_VIEW_QUOTA_EVICTION',
        });
      }
    } catch (err) {
      const reason = isLocalStorageAvailable() ? 'exception' : 'ls_unavailable';
      const errMessage = err instanceof Error ? err.message : String(err);
      this.loggingService?.log({
        message: `Rokt Kit: Failed to capture page view for ${pageUrl}: ${errMessage} [reason: ${reason}]`,
        code: 'PAGE_VIEW_CAPTURE_FAILED',
      });
    }
  }

  private isPreselectionEnabled(): boolean {
    return this.launcher?.enablePreselection === true;
  }

  // The entry a target page's own call goes to, matched on the call's own attributes as well as its identifier.
  private findCacheConfigEntry(
    identifier: string | undefined,
    attributes: Record<string, unknown>,
  ): PreselectionConfigEntry | undefined {
    if (!this.isPreselectionEnabled()) {
      return undefined;
    }

    return findPreselectionConfigByIdentifier(this.accountId, identifier, attributes);
  }

  // The entry a speculative call was fired for, by the targetPageIdentifier its fire keys its records under.
  private findFiredEntry(entryKey: string | undefined): PreselectionConfigEntry | undefined {
    if (!this.isPreselectionEnabled()) {
      return undefined;
    }

    return findPreselectionEntryByKey(this.accountId, entryKey);
  }

  // What the speculative call for the entry keyed entryKey fills in over these attributes, the ones it was fired with.
  // An identity the call carries already holds its key, so a default never stands in for it.
  private buildPreselectAttributeDefaults(
    entryKey: string | undefined,
    attributes: Record<string, unknown>,
  ): Record<string, string> | undefined {
    const configEntry = this.findFiredEntry(entryKey);
    if (!configEntry) {
      return undefined;
    }
    const fills = getPreselectAttributeDefaults(this.buildPreselectHost(), configEntry, attributes);
    const filters = this.filters || {};
    if (!filters.filterUserAttributes) {
      return fills;
    }

    const userAttributeFilters = (filters.userAttributeFilters as string[]) || [];
    return filters.filterUserAttributes(fills, userAttributeFilters) as Record<string, string>;
  }

  private buildPreselectHost(): PreselectHost {
    return {
      accountId: this.accountId,
      filteredUser: this.filters.filteredUser,
      userAttributes: this.userAttributes,
      isKitReady: () => this.isKitReady(),
      isPreselectionEnabled: () => this.isPreselectionEnabled(),
      getPreselectVariant: () => this.launcher?.preselectVariant,
      getEventAttributeValue: (event, key) => this.getEventAttributeValue(event, key),
      logPlacementDiagnostic: (entry) => this.loggingService?.logPlacementDiagnostic(entry),
      log: (entry) => this.loggingService?.log(entry),
      selectPlacements: (options) => this.selectPlacements(options),
      isPreselectionPrivacyAllowed: () => this.isPreselectionPrivacyAllowedNow(),
      getCurrentUser: () => mp().Identity?.getCurrentUser?.() as FilteredUser | null | undefined,
      getCurrentHost: () => this.buildPreselectHost(),
      isTargetingDisabled: () => this.isTargetingDisabledNow(),
      getUserIdentities: () => this.returnUserIdentities(this.filters.filteredUser),
      getOutgoingAttributes: (attributes, entryKey) => this.getOutgoingPreselectAttributes(attributes, entryKey),
      filterAttributes: (attributes) => this.filterPreselectAttributes(attributes),
      getPreselectFills: (attributes, entryKey) => this.buildPreselectAttributeDefaults(entryKey, attributes),
      mappedEmailSha256Key: this._mappedEmailSha256Key,
      isForwardingAllowed: () => this.isForwardingAllowed(),
      isCheckoutIntentActive: () => this.isCheckoutIntentActive(),
      isLinkIntentWithheld: () => this.isLinkIntentWithheld(),
      isEmailIdentityFiltered: () => this.isEmailIdentityFiltered(),
    };
  }

  private flushPendingPreselectDispatches(): void {
    flushPendingPreselectDispatchesExternal(this._preselectState, this.buildPreselectHost());
  }

  private isLauncherReadyToAttach(): boolean {
    return !!window.Rokt && isFunction(window.Rokt.createLauncher);
  }

  /**
   * Returns the user identities from the filtered user, if any.
   */
  private returnUserIdentities(filteredUser: FilteredUser | null | undefined): Record<string, string> {
    if (!filteredUser || !filteredUser.getUserIdentities) {
      return {};
    }

    const userIdentities: IUserIdentities = filteredUser.getUserIdentities().userIdentities;

    return this.replaceOtherIdentityWithEmailsha256(userIdentities);
  }

  private returnLocalSessionAttributes(): Record<string, unknown> {
    if (!mp().Rokt || typeof mp().Rokt.getLocalSessionAttributes !== 'function') {
      return {};
    }
    return mp().Rokt.getLocalSessionAttributes!();
  }

  private replaceOtherIdentityWithEmailsha256(userIdentities: IUserIdentities): Record<string, string> {
    const newUserIdentities: Record<string, string> = { ...(userIdentities || {}) };
    const key = this._mappedEmailSha256Key;
    if (key && userIdentities[key as keyof IUserIdentities]) {
      newUserIdentities[RoktKit.EMAIL_SHA256_KEY] = userIdentities[key as keyof IUserIdentities] as string;
    }
    if (key) {
      delete newUserIdentities[key];
    }

    return newUserIdentities;
  }

  private logSelectPlacementsEvent(attributes: unknown): void {
    if (!window.mParticle || typeof mp().logEvent !== 'function') {
      return;
    }

    if (!isObject(attributes)) {
      return;
    }

    const EVENT_TYPE_OTHER = mp().EventType.Other;

    const eventAttributes: Record<string, unknown> = {};
    const keys = Object.keys(attributes);
    for (let i = 0; i < keys.length; i++) {
      if (ROKT_ONLY_EVENT_ATTRIBUTES.indexOf(keys[i].toLowerCase()) === -1) {
        eventAttributes[keys[i]] = attributes[keys[i]];
      }
    }

    mp().logEvent(EVENT_NAME_SELECT_PLACEMENTS, EVENT_TYPE_OTHER, eventAttributes);
  }

  private setRoktSessionId(sessionId: string): void {
    if (!sessionId || typeof sessionId !== 'string') {
      return;
    }
    try {
      const mpInstance = mp().getInstance();
      if (mpInstance && isFunction(mpInstance.setIntegrationAttribute)) {
        mpInstance.setIntegrationAttribute(moduleId, {
          roktSessionId: sessionId,
        });
      }
    } catch (_e) {
      // Best effort — never let this break the partner page
    }
  }

  private readMpSessionId(): string | undefined {
    // The public mParticle.sessionManager facade exposes only getSession(), which already returns
    // the session id. getSessionId() lives on the internal _SessionManager and has never been
    // re-exported, so prefer it if a future core adds it and fall back to getSession() until then.
    const sessionManager = mp()?.sessionManager;
    const readSessionId = sessionManager?.getSessionId ?? sessionManager?.getSession;
    if (!isFunction(readSessionId)) {
      return undefined;
    }

    return readSessionId.call(sessionManager) || undefined;
  }

  private readMpDeviceId(): string | undefined {
    // The device application stamp (`das`) outlives the session id: core clears the session on
    // timeout, cross-tab rotation and endSession(), but never the device id, which lives in
    // localStorage/cookie for cookieExpiration days (365 by default) and survives login/logout.
    // Read it per call anyway — a partner can reassign it at any time via setDeviceId().
    if (this.isDeviceIdDisabled()) {
      return undefined;
    }
    return mp()?.getDeviceId?.() || undefined;
  }

  private attachLauncher(
    accountId: string,
    launcherOptions: RoktLauncherOptions,
    legacyRoktExtensions: readonly string[] = [],
  ): Promise<void> {
    rememberAttachContext(this._launcherAttachState, {
      accountId,
      launcherOptions: launcherOptions || {},
      legacyRoktExtensions,
    });

    const options: RoktLauncherOptions = {
      accountId,
      ...(launcherOptions || {}),
    };
    // A launcher without setPrivacyControl only ever sees the options it was created with.
    this.applyPrivacyFlagsToOptions(options, this._effectivePrivacyFlags || NO_PRIVACY_FLAGS);
    this._isLauncherCreatedRestricted = this._effectivePrivacyFlags !== null;
    this._launcherBeforeCreation = this.launcher;

    let launcherPromise: Promise<RoktLauncher>;
    if (this.isPartnerInLocalLauncherTestGroup()) {
      launcherPromise = Promise.resolve(window.Rokt!.createLocalLauncher(options));
    } else {
      launcherPromise = window.Rokt!.createLauncher(options);
    }

    return launcherPromise
      .then(async (launcher) => {
        await registerLegacyExtensions([...legacyRoktExtensions], launcher);
        this.initRoktLauncher(launcher);
      })
      .catch((err: unknown) => {
        const wasAttached = this._launcherAttachState.lifecycle === 'attached';
        markLauncherAttachFailed(this._launcherAttachState);
        if (!wasAttached) {
          const errMessage = err instanceof Error ? err.message : String(err);
          this.loggingService?.log({
            message: `Rokt Kit: Failed to attach Rokt launcher: ${errMessage}`,
            code: 'LAUNCHER_ATTACH_FAILED',
          });
        }
        console.error('Error creating Rokt launcher:', err);
      });
  }

  private recreateLauncherIfTerminated(): Promise<void> | undefined {
    return recreateIfTerminated(this._launcherAttachState, this.isLauncherReadyToAttach(), (context) =>
      this.attachLauncher(context.accountId, context.launcherOptions, context.legacyRoktExtensions),
    );
  }

  private initRoktLauncher(launcher: RoktLauncher): void {
    // Assign the launcher to a global variable for later access
    if (window.Rokt) {
      window.Rokt.currentLauncher = launcher;
    }
    // Locally cache the launcher and filters
    this.launcher = launcher;
    this.refreshConsentPrivacy();
    markLauncherAttached(this._launcherAttachState);

    const roktFilters = mp().Rokt?.filters;

    if (!roktFilters) {
      console.warn('Rokt Kit: No filters have been set.');
    } else {
      // A user from onUserIdentified before the first attach is newer than the one core built at init.
      if (!this.isInitialized && this.filters.filteredUser) {
        roktFilters.filteredUser = this.filters.filteredUser;
      }
      this.filters = roktFilters;
      if (!roktFilters.filteredUser) {
        console.warn('Rokt Kit: No filtered user has been set.');
      } else {
        this._workspaceSearchInFlightPromise = this.search(roktFilters.filteredUser);
      }
    }

    // Kit must be initialized before attaching to the Rokt manager
    this.isInitialized = true;

    sendAdBlockMeasurementSignals(this.domain, this.integrationName);

    // Attaches the kit to the Rokt manager
    mp().Rokt.attachKit(this);
    this.pushExitIntentExtensionConfig();

    this.flushPendingPreselectDispatches();
  }

  // Leaving the hook unset is what keeps History unpatched for workspaces that never
  // preselect. The core SDK reads onCheckoutIntent when it has a signal, so an account without
  // pre-selection entries never hears one.
  private armPreselectPathnameTrigger(): void {
    recordPreselectIntentPath(window.location.pathname);
    this.onRouteChange = hasPreselectionConfigForAccount(this.accountId)
      ? (): void => {
          this.refreshConsentPrivacy();
          this.evaluatePreselectPathname();
        }
      : undefined;
    this.armPreselectEmailInputListener();
    // Any account with pre-selection listens: with checkout intent active its entries fire on the
    // confirm click.
    this.onCheckoutIntent = hasPreselectionConfigForAccount(this.accountId)
      ? (signal: PreselectIntentSignal): void => {
          try {
            this.refreshConsentPrivacy();
            handlePreselectIntentSignal(this._preselectState, this.buildPreselectHost(), signal);
          } catch {
            return;
          }
        }
      : undefined;
    this.checkoutIntentSelectors = getPreselectIntentSelectors(this.accountId);
    this.onPaymentPick = hasPreselectionConfigForAccount(this.accountId)
      ? (signal: PreselectPaymentPickSignal): void => {
          try {
            this.refreshConsentPrivacy();
            handlePreselectPaymentPick(this._preselectState, this.buildPreselectHost(), signal);
          } catch {
            return;
          }
        }
      : undefined;
  }

  // A guest often types their email after the trigger page view has queued for want of one, so a
  // committed email input retries the queue. Only accounts with an entry that reads the form listen.
  private armPreselectEmailInputListener(): void {
    if (this._preselectEmailInputListener) {
      document.removeEventListener('input', this._preselectEmailInputListener, true);
      document.removeEventListener('change', this._preselectEmailInputListener, true);
      document.removeEventListener('blur', this._preselectEmailInputListener, true);
      this._preselectEmailInputListener = undefined;
    }
    if (!hasEmailInputEntry(this.accountId)) {
      return;
    }

    // Notes which fields the shopper types into or autofills, reading no value, and retries on a committed
    // change. A blur drops a field no change committed and marks a committed one left mid-edit. The form's own
    // gates run before the changed field's value is read.
    this._preselectEmailInputListener = (event: Event): void => {
      this.refreshConsentPrivacy();
      recordShopperInput(event);
      if (
        event.type === 'change' &&
        this._preselectState.pending.length > 0 &&
        isReadableFormEmailChange(this._preselectState, this.buildPreselectHost(), event)
      ) {
        this.flushPendingPreselectDispatches();
      }
    };
    document.addEventListener('input', this._preselectEmailInputListener, true);
    document.addEventListener('change', this._preselectEmailInputListener, true);
    document.addEventListener('blur', this._preselectEmailInputListener, true);
  }

  // A core released without the check reads false, so its page views are judged by their marker alone.
  private isAutoLogPageViewOn(): boolean {
    const rokt = mp().Rokt as unknown as { isAutoLogPageViewEnabled?: () => boolean } | undefined;
    try {
      return isFunction(rokt?.isAutoLogPageViewEnabled) && rokt!.isAutoLogPageViewEnabled!() === true;
    } catch {
      return false;
    }
  }

  // True while the core SDK says the confirm click can be waited for: auto button tracking is on, no
  // opt-out or privacy option suppresses it, and the browser supports the detector. A core released
  // without the check reads false, so its entries keep dispatchDelayMs.
  private isCheckoutIntentActive(): boolean {
    const rokt = mp().Rokt as unknown as { isCheckoutIntentLive?: () => boolean } | undefined;
    try {
      return isFunction(rokt?.isCheckoutIntentLive) && rokt!.isCheckoutIntentLive!() === true;
    } catch {
      return false;
    }
  }

  // True when the core SDK gives link clicks no checkout intent because this connection does not receive Auto Link
  // Click events. A core released without the check reads false, and turns intent off entirely in that case.
  private isLinkIntentWithheld(): boolean {
    const rokt = mp().Rokt as unknown as { areAutoLinkClicksForwarded?: () => boolean } | undefined;
    try {
      return isFunction(rokt?.areAutoLinkClicksForwarded) && rokt!.areAutoLinkClicksForwarded!() === false;
    } catch {
      return false;
    }
  }

  // Core gates every kit callback on opt-out and consent, but a DOM listener is called by the browser
  // directly, so it checks both itself.
  private isForwardingAllowed(): boolean {
    const store = (mp().getInstance?.() as unknown as { _Store?: { isEnabled?: boolean } } | undefined)?._Store;
    return store?.isEnabled !== false && mp()._getActiveForwarders().some((forwarder) => forwarder === this);
  }

  // A call carrying a form email can wait on identity search or launcher setup. A skipped one costs only
  // the cached hit, so it goes out only if nothing changed: same user, still allowed, and no partner
  // email has appeared, filtered or not.
  private getFormEmailDropCause(emailKey: string, formEmailMpid: unknown): string | undefined {
    if (!this.isForwardingAllowed()) return 'forwarding_disallowed';
    if (this.isTargetingDisabledNow() || !this.isPreselectionPrivacyAllowedNow()) return 'privacy_signal';
    if (String(this.filters?.filteredUser?.getMPID?.() ?? '') !== String(formEmailMpid ?? '')) return 'user_changed';
    if (hasPartnerEmail(this.buildPreselectHost(), emailKey)) return 'partner_email';
    return undefined;
  }

  // Whether this connection filters out the Email identity, or the identity mapped to the hashed email.
  private isEmailIdentityFiltered(): boolean {
    const filters = this.userIdentityFilters || [];
    if (filters.includes(EMAIL_IDENTITY_TYPE)) {
      return true;
    }
    const mappedName = this._mappedEmailSha256Key;
    const identityTypes = (mp().IdentityType || {}) as Record<string, unknown>;
    const mappedType = mappedName
      ? Object.keys(identityTypes).find((typeName) => typeName.toLowerCase() === mappedName)
      : undefined;
    const mappedTypeValue = mappedType ? identityTypes[mappedType] : undefined;
    return typeof mappedTypeValue === 'number' && filters.includes(mappedTypeValue);
  }

  private evaluatePreselectPathname(): void {
    const pathname = window.location.pathname;
    recordPreselectIntentPath(pathname);

    // A query-only replaceState is a route change but not a new page.
    if (pathname === this._lastPreselectPathname) {
      return;
    }

    if (this.isTargetingDisabled()) {
      return;
    }

    this._lastPreselectPathname = pathname;

    maybeFirePreselectForPathnameExternal(this._preselectState, this.buildPreselectHost(), pathname);
    maybeFirePreselectForCartPageViewExternal(this._preselectState, this.buildPreselectHost(), pathname);
  }

  private fetchOptimizely(): Record<string, unknown> {
    const forwarders = mp()
      ._getActiveForwarders()
      .filter((forwarder) => forwarder.name === 'Optimizely');

    try {
      if (forwarders.length > 0 && window.optimizely) {
        const optimizelyState = window.optimizely.get('state');
        if (!optimizelyState || !optimizelyState.getActiveExperimentIds) {
          return {};
        }
        const activeExperimentIds = optimizelyState.getActiveExperimentIds();
        const activeExperiments = activeExperimentIds.reduce((acc: Record<string, string>, expId: string) => {
          acc['rokt.custom.optimizely.experiment.' + expId + '.variationId'] =
            optimizelyState.getVariationMap()[expId].id;
          return acc;
        }, {});
        return activeExperiments;
      }
    } catch (error) {
      console.error('Error fetching Optimizely attributes:', error);
    }
    return {};
  }

  private isKitReady(): boolean {
    return !!(this.isInitialized && this.launcher);
  }

  // What init launcherOptions already restrict today, with noDeviceId implying noTargeting and noFunctional.
  private getInitPrivacyFlags(): PrivacyFlags {
    const options = (mp().Rokt?.launcherOptions || {}) as Record<string, unknown>;
    const isDeviceIdDisabled = this.isDeviceIdDisabled();
    return {
      noTargeting: options.noTargeting === true || isDeviceIdDisabled,
      noFunctional: options.noFunctional === true || isDeviceIdDisabled,
      doNotShareOrSell: options.doNotShareOrSell === true,
    };
  }

  // Writes restricting flags into launcher options; an unrestricted flag goes back to its init value.
  private applyPrivacyFlagsToOptions(target: Record<string, unknown>, flags: PrivacyFlags): void {
    const initOptions = (mp().Rokt?.launcherOptions || {}) as Record<string, unknown>;
    for (const key of PRIVACY_FLAG_KEYS) {
      if (flags[key]) {
        target[key] = true;
      } else if (Object.prototype.hasOwnProperty.call(initOptions, key)) {
        target[key] = initOptions[key];
      } else {
        delete target[key];
      }
    }
  }

  // Values match the flag names in any letter case; an unknown value is reported rather than dropped silently.
  private parseConsentMappings(mappings: unknown): ConsentMapping[] {
    if (!Array.isArray(mappings)) return [];
    const result: ConsentMapping[] = [];
    for (const entry of mappings as Array<{ map?: unknown; value?: unknown }>) {
      if (!entry || !isString(entry.map) || !isString(entry.value)) continue;
      const wanted = entry.value.trim().toLowerCase();
      const value = PRIVACY_FLAG_KEYS.find((key) => key.toLowerCase() === wanted);
      if (!value) {
        this.warnConsentPrivacyOnce(
          `mapping_value:${wanted}`,
          `Rokt Kit: consent mapping value "${entry.value}" is not a privacy flag and is ignored`,
        );
        continue;
      }
      // Core stores GDPR purposes trimmed and lowercased.
      const map = entry.map.trim().toLowerCase();
      if (map.length > 0) result.push({ map, value });
    }
    return result;
  }

  // Replaces only consent's contribution in core; never feeds combined flags back as init or page flags.
  // The effective flags are init launcherOptions OR core's flags (init, page and consent-derived). While they
  // restrict no more than init launcherOptions do, nothing here acts, so integrations without a mapping or a
  // page opt-out keep today's launcher options, storage and attributes.
  private refreshConsentPrivacy(isInit = false): void {
    // Syncing $NoTargeting fans out to forwarders and can re-enter the kit.
    if (this._isRefreshingConsentPrivacy) return;
    this._isRefreshingConsentPrivacy = true;
    try {
      this.applyConsentPrivacy(isInit);
    } finally {
      this._isRefreshingConsentPrivacy = false;
    }
  }

  private applyConsentPrivacy(isInit: boolean): void {
    const manager = mp().getInstance?.()?._CookieConsentManager;
    const user = mp().Identity?.getCurrentUser?.() || null;
    const derived: PrivacyFlags = { noTargeting: false, noFunctional: false, doNotShareOrSell: false };
    // Without a mapping, core's derived flags stay untouched unless an earlier mapping set them.
    if (this._consentMappings.length || this._hasDerivedPrivacyFlags) {
      const consent = user?.getConsentState?.()?.getGDPRConsentState?.() || {};
      for (const mapping of this._consentMappings) {
        if (Object.prototype.hasOwnProperty.call(consent, mapping.map) && consent[mapping.map]?.Consented === false) {
          derived[mapping.value] = true;
        }
      }
      manager?.replaceDerivedFlags?.(derived);
      this._hasDerivedPrivacyFlags = this._consentMappings.length > 0;
    }
    const initFlags = this.getInitPrivacyFlags();
    const flags: PrivacyFlags = {
      noTargeting: initFlags.noTargeting || derived.noTargeting || manager?.getNoTargeting?.() === true,
      noFunctional: initFlags.noFunctional || derived.noFunctional || manager?.getNoFunctional?.() === true,
      doNotShareOrSell:
        initFlags.doNotShareOrSell || derived.doNotShareOrSell || manager?.getDoNotShareOrSell?.() === true,
    };
    const isRestricted = PRIVACY_FLAG_KEYS.some((key) => flags[key] !== initFlags[key]);
    const previous = this._effectivePrivacyFlags || initFlags;
    const isCreatedLauncherAttached = !!this.launcher && this.launcher !== this._launcherBeforeCreation;
    const isAttachedLauncherStale =
      this._isLauncherCreatedRestricted && isCreatedLauncherAttached && this._privacyControlLauncher !== this.launcher;
    if (!isRestricted && !this._effectivePrivacyFlags && !isAttachedLauncherStale) return;
    this._effectivePrivacyFlags = isRestricted ? flags : null;
    // Init applies storage, launcher options and exit intent from these flags itself. Writing $NoTargeting from
    // init would re-enter init through core's forwarder initialization; core syncs it after identify instead.
    if (isInit) return;

    // Storage goes first: the $NoTargeting sync below fans out to forwarders and must not be able to skip it.
    if (previous.noFunctional !== flags.noFunctional) setDevicePersistenceDisabled(flags.noFunctional);
    if ((flags.noFunctional || flags.noTargeting) && !(previous.noFunctional || previous.noTargeting)) {
      removeKitStorageFromDevice();
    }
    if (!this.isPageHistoryAllowed()) {
      clearPageViews();
      clearUtmParams();
    }
    if (previous.noTargeting !== flags.noTargeting && this._exitIntentEnabledForAccount) {
      this.configureExitIntentBridge(this.getEffectiveExitIntentConfig(this.accountId));
      // A launcher attached while targeting was declined never received the extension's config.
      if (this.launcher) this.pushExitIntentExtensionConfig();
    }

    const mpid = user?.getMPID?.() ?? null;
    if (
      user &&
      (previous.noTargeting !== flags.noTargeting ||
        (flags.noTargeting !== initFlags.noTargeting && this._noTargetingSyncedMpid !== mpid))
    ) {
      this._noTargetingSyncedMpid = mpid;
      try {
        manager?.syncNoTargetingAttribute?.(user as unknown as IMParticleUser);
      } catch (error) {
        this.warnConsentPrivacyOnce(
          'no_targeting_sync',
          `Rokt Kit: $NoTargeting sync failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // Recreation must not restore the values captured before a mid-page consent change.
    const context = this._launcherAttachState.context;
    if (context) this.applyPrivacyFlagsToOptions(context.launcherOptions, flags);
    const isChanged = PRIVACY_FLAG_KEYS.some((key) => previous[key] !== flags[key]);
    if (this.launcher && (isChanged || this._privacyControlLauncher !== this.launcher)) {
      this.sendPrivacyControl(this.launcher, flags, isCreatedLauncherAttached);
    }
  }

  // A launcher marked as sent is never sent the same flags again, so it is marked only once the call is made,
  // and unmarked if the call fails, so the next refresh retries it.
  private sendPrivacyControl(launcher: RoktLauncher, flags: PrivacyFlags, isCreatedLauncherAttached: boolean): void {
    if (isCreatedLauncherAttached) this._isLauncherCreatedRestricted = false;
    if (!isFunction(launcher.setPrivacyControl)) {
      this._privacyControlLauncher = launcher;
      if (this._consentMappings.length) {
        this.warnConsentPrivacyOnce(
          'launcher_setter',
          'Rokt Kit: consent mapping is configured but the launcher cannot apply privacy changes after it loads',
        );
      }
      return;
    }
    const onFailure = (error: unknown): void => {
      if (this._privacyControlLauncher === launcher) this._privacyControlLauncher = null;
      this.warnConsentPrivacyOnce(
        'launcher_setter_failed',
        `Rokt Kit: setPrivacyControl failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    };
    try {
      const result = launcher.setPrivacyControl(flags);
      this._privacyControlLauncher = launcher;
      void Promise.resolve(result).catch(onFailure);
    } catch (error) {
      onFailure(error);
    }
  }

  // When the partner has opted out of targeting (noTargeting launcher option),
  // the kit must not collect behavioral targeting signals such as page views.
  private isTargetingDisabled(): boolean {
    return (
      this._effectivePrivacyFlags?.noTargeting === true ||
      (mp().Rokt?.launcherOptions as Record<string, unknown> | undefined)?.noTargeting === true ||
      this.isDeviceIdDisabled()
    );
  }

  // Core's normalizeRoktLauncherOptions turns noDeviceId or noDeviceID into noDeviceId, noFunctional and
  // noTargeting, but an older core passes either spelling through as written, so the kit applies the same rule.
  private isDeviceIdDisabled(): boolean {
    const launcherOptions = mp()?.Rokt?.launcherOptions as Record<string, unknown> | undefined;
    return launcherOptions?.noDeviceId === true || launcherOptions?.noDeviceID === true;
  }

  private isPreselectionPrivacyAllowed(): boolean {
    return (
      this._effectivePrivacyFlags?.doNotShareOrSell !== true &&
      (mp().Rokt?.launcherOptions as Record<string, unknown> | undefined)?.doNotShareOrSell !== true &&
      (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl !== true
    );
  }

  // Preselection reads the form and writes storage from browser callbacks and timers, outside any placement
  // dispatch, so its gates apply a consent change made since the last refresh before answering.
  private isTargetingDisabledNow(): boolean {
    this.refreshConsentPrivacy();
    return this.isTargetingDisabled();
  }

  private isPreselectionPrivacyAllowedNow(): boolean {
    this.refreshConsentPrivacy();
    return this.isPreselectionPrivacyAllowed();
  }

  private isPageHistoryAllowed(): boolean {
    return !this.isTargetingDisabled() && this.isPreselectionPrivacyAllowed();
  }

  private isPartnerInLocalLauncherTestGroup(): boolean {
    return !!(mp().config && mp().config!.isLocalLauncherEnabled && this.isAssignedToSampleGroup());
  }

  private isAssignedToSampleGroup(): boolean {
    const LOCAL_LAUNCHER_TEST_GROUP_THRESHOLD = 0.5;
    return Math.random() > LOCAL_LAUNCHER_TEST_GROUP_THRESHOLD;
  }

  private getEffectiveExitIntentConfig(accountId: string | null | undefined): ExitIntentConfig | null {
    if (!isExitIntentAccountOverrideEnabled(accountId)) {
      return null;
    }

    return {
      identifier: EXIT_INTENT_DEFAULT_IDENTIFIER,
      signals: {
        mouseExitTop: true,
        scrollUpFast: true,
        idle: true,
      },
    } as ExitIntentConfig;
  }

  private applyExitIntentExtensionOverride(
    exitIntentConfig: ExitIntentConfig | null,
    roktExtensionsQueryParams: string[],
  ): string[] {
    if (!exitIntentConfig) {
      return roktExtensionsQueryParams;
    }

    if (!roktExtensionsQueryParams.includes(EXIT_INTENT_EXTENSION_NAME)) {
      return [...roktExtensionsQueryParams, EXIT_INTENT_EXTENSION_NAME];
    }

    return roktExtensionsQueryParams;
  }

  private extractExitIntentIdentifier(config: ExitIntentConfig | null): string | null {
    if (!config) {
      return null;
    }

    if (isString(config.identifier) && config.identifier.length > 0) {
      return config.identifier;
    }

    if (isString(config.placementIdentifier) && config.placementIdentifier.length > 0) {
      return config.placementIdentifier;
    }

    return null;
  }

  private applyIdentityCapturePayload(identities: Record<string, unknown>, userAttributes: Record<string, unknown>): void {
    const knownIdentities: Record<string, string> = {};
    const emailIdentity = identities.email;
    if (isString(emailIdentity) && emailIdentity.length > 0) {
      knownIdentities.email = emailIdentity;
    }
    const mobileIdentity = identities.mobile_number;
    if (isString(mobileIdentity) && mobileIdentity.length > 0) {
      knownIdentities.mobile_number = mobileIdentity;
    }

    const modify = mp().Identity?.modify;
    if (isFunction(modify) && Object.keys(knownIdentities).length > 0) {
      try {
        modify({ userIdentities: knownIdentities as IUserIdentities });
      } catch (error) {
        this.loggingService?.log({
          message: 'Rokt Kit: identity capture modify failed',
          code: 'EXIT_INTENT_IDENTITY_MODIFY_FAILED',
          additional_info: error instanceof Error ? { errorName: error.name, errorMessage: error.message } : undefined,
        });
      }
    }

    const currentUser = mp().Identity?.getCurrentUser?.();
    for (const [key, value] of Object.entries(userAttributes)) {
      if (currentUser?.setUserAttribute) {
        try {
          currentUser.setUserAttribute(key, value);
        } catch (error) {
          this.loggingService?.log({
            message: 'Rokt Kit: identity capture user attribute update failed',
            code: 'EXIT_INTENT_IDENTITY_SET_ATTRIBUTE_FAILED',
            additional_info: error instanceof Error ? { errorName: error.name, errorMessage: error.message, key } : { key },
          });
        }
      }
    }
  }

  private configureExitIntentBridge(config: ExitIntentConfig | null): void {
    this._exitIntentConfig = this.isTargetingDisabled() ? null : config;
    this._exitIntentWatcher.configure(this._exitIntentConfig);
  }

  private handleExitIntent(reason: string, configuredAttributes: Record<string, unknown>): boolean {
    // A decline since the last refresh disarms the bridge here, before any selection starts.
    this.refreshConsentPrivacy();
    if (!this._exitIntentConfig) {
      return false;
    }
    const identifier = this.extractExitIntentIdentifier(this._exitIntentConfig);
    if (!identifier) {
      return false;
    }

    try {
      const exitIntentOptions: Record<string, unknown> = {
        identifier,
        attributes: {
          ...configuredAttributes,
          exitIntentReason: reason,
        },
      };
      exitIntentOptions[EXIT_INTENT_ORIGIN_OPTION] = true;
      const selection = mp().Rokt?.selectPlacements?.(exitIntentOptions);
      void Promise.resolve(selection).catch(() => undefined);
      return true;
    } catch {
      return false;
    }
  }

  private _recordInitWarning(message: string, code = 'EXIT_INTENT_CONFIG_INVALID'): void {
    if (this.loggingService) {
      this.loggingService.log({ message, code });
      return;
    }
    this._pendingInitWarnings.push({ message, code });
  }

  // Each consent privacy problem is reported once per page, so a mapping that cannot apply is visible.
  private warnConsentPrivacyOnce(key: string, message: string): void {
    if (this._consentPrivacyWarnings.has(key)) return;
    this._consentPrivacyWarnings.add(key);
    this._recordInitWarning(message, 'CONSENT_PRIVACY_WARNING');
  }

  private _flushInitWarnings(): void {
    if (!this.loggingService || this._pendingInitWarnings.length === 0) {
      return;
    }
    for (let i = 0; i < this._pendingInitWarnings.length; i += 1) {
      this.loggingService.log(this._pendingInitWarnings[i]);
    }
    this._pendingInitWarnings = [];
  }

  private pushExitIntentExtensionConfig(): void {
    if (!this._exitIntentConfig || !isFunction(window.Rokt?.setExtensionData)) {
      return;
    }

    window.Rokt.setExtensionData({
      [EXIT_INTENT_EXTENSION_NAME]: this._exitIntentConfig,
    });
  }

  private captureTiming(metricName: string): void {
    if (window && mp() && mp().captureTiming && metricName) {
      mp().captureTiming!(metricName);
    }
  }

  // ---- Public methods (mParticle Kit Callbacks) ----

  /**
   * Initializes the Rokt forwarder with settings from the mParticle server.
   */
  public init(
    settings: Record<string, unknown>,
    _service: unknown,
    testMode: boolean,
    _trackerId: unknown,
    filteredUserAttributes?: Record<string, unknown>,
  ): string {
    const mappings = parseSettingsString<ConsentMapping>((settings as unknown as RoktKitSettings).consentMappingSDK);
    this._consentMappings = this.parseConsentMappings(mappings);
    if (this._consentMappings.length && !isFunction(mp().getInstance?.()?._CookieConsentManager?.replaceDerivedFlags)) {
      this.warnConsentPrivacyOnce(
        'core_derived_flags',
        'Rokt Kit: consent mapping is configured but this mParticle SDK version cannot apply it',
      );
    }
    this.refreshConsentPrivacy(true);
    // noFunctional, which noDeviceId implies, forbids storing anything on the shopper's device.
    // Applied before anything else, so nothing later in init can fail open.
    const isFunctionalStorageDisabled =
      this._effectivePrivacyFlags?.noFunctional === true ||
      (mp().Rokt?.launcherOptions as Record<string, unknown> | undefined)?.noFunctional === true ||
      this.isDeviceIdDisabled();
    setDevicePersistenceDisabled(isFunctionalStorageDisabled);
    if (isFunctionalStorageDisabled || this.isTargetingDisabled()) {
      removeKitStorageFromDevice();
    } else {
      removeLegacyActivePreselects();
      removeLegacyPendingPreselects();
    }
    // The device wipe above does not reach page memory, where a re-init can find page views captured
    // before noTargeting turned on, and it does not run for doNotShareOrSell or GPC at all.
    if (!this.isPageHistoryAllowed()) {
      clearPageViews();
      clearUtmParams();
    }

    const kitSettings = settings as unknown as RoktKitSettings;
    const accountId = kitSettings.accountId;
    this._identityCallCount = 0;
    this._lastNonModifyCallCount = 0;
    this._isModifyIdentityCallInProgress = false;
    this._exitIntentEnabledForAccount = isExitIntentAccountOverrideEnabled(accountId);
    const exitIntentConfig = this._exitIntentEnabledForAccount ? this.getEffectiveExitIntentConfig(accountId) : null;
    if (this._exitIntentEnabledForAccount) {
      this.configureExitIntentBridge(exitIntentConfig);
    } else {
      // Defensive cleanup to ensure non-overridden partners remain a no-op.
      this.configureExitIntentBridge(null);
    }
    this.accountId = accountId || null;
    const preselectionConfigError = this.accountId
      ? applyPreselectionConfigSetting(this.accountId, kitSettings.preselectionConfig)
      : undefined;
    this.userAttributes = removeSelectPlacementsAttributePersistenceDeniedAttributes(filteredUserAttributes);
    this.armPreselectPathnameTrigger();
    this._onboardingExpProvider = kitSettings.onboardingExpProvider;

    const placementEventMapping = parseSettingsString<PlacementEventMappingEntry>(kitSettings.placementEventMapping);
    this.placementEventMappingLookup = generateMappedEventLookup(placementEventMapping);

    const placementEventAttributeMapping = parseSettingsString<EventAttributeMapping>(
      kitSettings.placementEventAttributeMapping,
    );
    this.placementEventAttributeMappingLookup = generateMappedEventAttributeLookup(placementEventAttributeMapping);

    // Set dynamic OTHER_IDENTITY based on server settings
    if (kitSettings.hashedEmailUserIdentityType) {
      this._mappedEmailSha256Key = kitSettings.hashedEmailUserIdentityType.toLowerCase();
    }

    this._workspaceIdSyncApiKey = isString(kitSettings.workspaceIdSyncApiKey)
      ? kitSettings.workspaceIdSyncApiKey
      : undefined;

    const domain = mp().Rokt?.domain;
    const { roktExtensionsQueryParams, legacyRoktExtensions, loadThankYouElement } = extractRoktExtensionConfig(
      kitSettings.roktExtensions,
    );
    const effectiveRoktExtensionsQueryParams = this.applyExitIntentExtensionOverride(
      exitIntentConfig,
      roktExtensionsQueryParams,
    );
    const launcherOptions: Record<string, unknown> = {
      ...((mp().Rokt?.launcherOptions as Record<string, unknown>) || {}),
    };
    if (this._effectivePrivacyFlags) this.applyPrivacyFlagsToOptions(launcherOptions, this._effectivePrivacyFlags);
    this.integrationName = generateIntegrationName(launcherOptions.integrationName as string | undefined);
    launcherOptions.integrationName = this.integrationName;

    this.domain = domain;

    const reportingConfig: ReportingConfig = {
      loggingUrl: kitSettings.loggingUrl,
      errorUrl: kitSettings.errorUrl,
      integrationDomain: domain,
      isLoggingEnabled: mp().config?.isLoggingEnabled === true,
    };
    const errorReportingService = new ErrorReportingService(
      reportingConfig,
      this.integrationName,
      window.__rokt_li_guid__,
      kitSettings.accountId,
    );
    const loggingService = new LoggingService(
      reportingConfig,
      errorReportingService,
      this.integrationName,
      window.__rokt_li_guid__,
      kitSettings.accountId,
    );

    this.errorReportingService = errorReportingService;
    this.loggingService = loggingService;
    this._flushInitWarnings();
    if (preselectionConfigError) {
      loggingService.log({
        message:
          'Rokt Kit: preselectionConfig setting is invalid ' +
          `[reason=${preselectionConfigError}], using the built-in preselection config`,
        code: 'PRESELECT_CONFIG_INVALID',
      });
    }

    if (mp()._registerErrorReportingService) {
      mp()._registerErrorReportingService!(errorReportingService);
    }
    if (mp()._registerLoggingService) {
      mp()._registerLoggingService!(loggingService);
    }

    if (testMode) {
      this.testHelpers = {
        generateLauncherScript: generateLauncherScript,
        generateThankYouElementScript: generateThankYouElementScript,
        extractRoktExtensionConfig: extractRoktExtensionConfig,
        hashEventMessage: hashEventMessage,
        parseSettingsString: parseSettingsString,
        generateMappedEventLookup: generateMappedEventLookup,
        generateMappedEventAttributeLookup: generateMappedEventAttributeLookup,
        sendAdBlockMeasurementSignals: sendAdBlockMeasurementSignals,
        createAutoRemovedIframe: createAutoRemovedIframe,
        djb2: djb2,
        setAllowedOriginHashes: (hashes: number[]) => {
          RoktKit._allowedOriginHashes = hashes;
        },
        ReportingTransport: ReportingTransport,
        ErrorReportingService: ErrorReportingService,
        LoggingService: LoggingService,
        RateLimiter: RateLimiter,
        ErrorCodes: ErrorCodes,
        WSDKErrorSeverity: WSDKErrorSeverity,
        resetLauncherAttachState: () => resetLauncherAttachState(this._launcherAttachState),
      };
      this.attachLauncher(accountId, launcherOptions);
      return 'Successfully initialized: ' + name;
    }

    if (loadThankYouElement) {
      mp().Rokt.flushOnShoppableAdsReadyMessageQueue?.(this);
      loadRoktScript(ROKT_THANK_YOU_ELEMENT_SCRIPT_ID, generateThankYouElementScript(domain), {
        onLoad: () => {
          this._isThankYouElementLoaded = true;
          if (this._thankYouElementOnLoadCallback) {
            this._thankYouElementOnLoadCallback();
          }
        },
        onError: (error) => {
          console.error('Error loading Rokt Thank You Element script:', error);
        },
      });
    }

    if (this.isLauncherReadyToAttach()) {
      this.attachLauncher(accountId, launcherOptions, legacyRoktExtensions);
    } else {
      loadRoktScript(ROKT_INTEGRATION_SCRIPT_ID, generateLauncherScript(domain, effectiveRoktExtensionsQueryParams), {
        onLoad: () => {
          if (this.isLauncherReadyToAttach()) {
            // Consent may have changed while the script loaded.
            this.refreshConsentPrivacy();
            this.attachLauncher(accountId, launcherOptions, legacyRoktExtensions);
          } else {
            console.error('Rokt object is not available after script load.');
          }
        },
        onError: (error) => {
          console.error('Error loading Rokt launcher script:', error);
        },
      });

      this.captureTiming(RoktKit.PERFORMANCE_MARKS.RoktScriptAppended);
    }

    return 'Successfully initialized: ' + name;
  }

  public process(event: SDKEvent): string {
    this.refreshConsentPrivacy();
    if (event.EventDataType === MESSAGE_TYPE_PAGE_VIEW) recordPreselectIntentPath(window.location.pathname);
    if (!this.isTargetingDisabled()) {
      if (event.EventDataType === MESSAGE_TYPE_PAGE_VIEW) {
        if (this._exitIntentEnabledForAccount) {
          this._exitIntentWatcher.resetPageViewState();
        }
        if (this.isPageHistoryAllowed()) {
          const autoLogPageViewOn = this.isAutoLogPageViewOn();
          captureUtmParams(this.loggingService, event.EventAttributes, autoLogPageViewOn);
          this.capturePageView(event, autoLogPageViewOn);
        } else {
          clearPageViews();
          clearUtmParams();
        }
        maybeFirePreselectExternal(this._preselectState, this.buildPreselectHost(), event);
        maybeFirePreselectForCartPageViewExternal(this._preselectState, this.buildPreselectHost());
      }

      if (isAutoClickEvent(event)) {
        recordPreselectPaymentClick(this.buildPreselectHost(), event);
      }

      if (isPreselectTriggerEventName(this.accountId, event.EventName)) {
        maybeFirePreselectForEventExternal(this._preselectState, this.buildPreselectHost(), event);
      }
    }

    // Session-scoped records are written only while targeting is on but cleared whatever its state,
    // so none written before it turned off outlives the session.
    if (event.EventDataType === MESSAGE_TYPE_SESSION_END) {
      clearPageViews();
      clearUtmParams();
      cancelScheduledPreselectDispatch(this._preselectState);
      if (this.accountId) {
        clearPendingPreselect(this.accountId);
        clearActivePreselects(this.accountId);
        clearPreselectArrivals(this.accountId);
      }
    }

    // The forwarding work below (LSA mapping) depends on the launcher, so guard
    // it here and surface the not-ready signal to the core SDK.
    if (!this.isKitReady()) {
      return 'Kit not ready for forwarder: ' + name;
    }

    if (isFunction(mp().Rokt?.setLocalSessionAttribute) && !isAutoClickEvent(event)) {
      if (!isEmpty(this.placementEventAttributeMappingLookup)) {
        this.applyPlacementEventAttributeMapping(event);
      }

      if (!isEmpty(this.placementEventMappingLookup)) {
        const hashedEvent = hashEventMessage(event.EventDataType, event.EventCategory, event.EventName ?? '');
        if (this.placementEventMappingLookup[String(hashedEvent)]) {
          mp().Rokt.setLocalSessionAttribute?.(this.placementEventMappingLookup[String(hashedEvent)], true);
        }
      }
    }

    return 'Successfully sent to forwarder: ' + name;
  }

  public setExtensionData(partnerExtensionData: Record<string, unknown>): void {
    if (!this.isKitReady()) {
      console.error('Rokt Kit: Not initialized');
      return;
    }

    window.Rokt!.setExtensionData(partnerExtensionData);
  }

  public setUserAttribute(key: string, value: unknown): string {
    if (!isSelectPlacementsAttributePersistenceDenied(key)) {
      this.userAttributes[key] = value;
    }
    const isCartKey = isPreselectCartAttributeKey(this.accountId, key);
    // The page's own cart attribute takes over from a remembered add-to-cart click.
    if (isCartKey) this.forgetCartAdd();
    // An email arriving can release a confirm-click fire that was waiting for one, and a filled cart a page view.
    if (
      isPreselectAttributeKey(this.accountId, key) ||
      isPreselectEmailKey(key, this._mappedEmailSha256Key) ||
      isCartKey
    ) {
      this.flushPendingPreselectDispatches();
    }
    return 'Successfully set user attribute for forwarder: ' + name;
  }

  // The page's cart attribute or a logout replaces a remembered add-to-cart click. Under noTargeting, or for an account
  // that never remembers one, nothing is written to the device.
  private forgetCartAdd(): void {
    if (this.accountId) {
      forgetPreselectCartAdd(this.accountId, !this.isTargetingDisabled() && hasPreselectCartPageView(this.accountId));
    }
  }

  public removeUserAttribute(key: string): string {
    delete this.userAttributes[key];
    if (isPreselectCartAttributeKey(this.accountId, key)) this.forgetCartAdd();
    return 'Successfully removed user attribute for forwarder: ' + name;
  }

  private handleIdentityComplete(user: IMParticleUser, callbackName: string): string {
    this.userAttributes = removeSelectPlacementsAttributePersistenceDeniedAttributes(user.getAllUserAttributes());
    return 'Successfully called ' + callbackName + ' for forwarder: ' + name;
  }

  public onUserIdentified(user: IMParticleUser): string {
    // Core's setForwarderCallbacks runs onModifyComplete and then onUserIdentified for the same modify response.
    if (this._isModifyIdentityCallInProgress) {
      this._isModifyIdentityCallInProgress = false;
    } else {
      this._identityCallCount += 1;
      this._lastNonModifyCallCount = this._identityCallCount;
    }
    this.refreshConsentPrivacy();
    const filteredUser = user as FilteredUser;
    this.filters.filteredUser = filteredUser;
    this._workspaceSearchInFlightPromise = this.search(filteredUser);
    const result = this.handleIdentityComplete(user, 'onUserIdentified');
    // onUserIdentified fires for every identity op (identify/login/logout/modify)
    // with the fresh current user, so this is the single place to retry a preselect
    // that was requeued for missing identity; maybeFirePreselect re-checks
    // hasValidIdentity itself, so an anonymous user here is a no-op re-queue.
    this.flushPendingPreselectDispatches();
    return result;
  }

  private search(filteredUser: FilteredUser): Promise<void> {
    const apiKey = this._workspaceIdSyncApiKey;
    if (!apiKey) {
      this.userIdentifiedInWorkspace = false;
      this._workspaceLastSearchedIdentitiesKey = undefined;
      return Promise.resolve();
    }
    const search = mp().Identity?.search;
    if (typeof search !== 'function') {
      this.userIdentifiedInWorkspace = false;
      this._workspaceLastSearchedIdentitiesKey = undefined;
      return Promise.resolve();
    }

    const userIdentities: IUserIdentities | null = filteredUser.getUserIdentities
      ? filteredUser.getUserIdentities().userIdentities
      : null;

    // Forward every non-empty string identifier the user has — email,
    // customerid, other/other2-10 (commonly used for hashed email),
    // mobile_number, facebook, etc. The host SDK's Identity.search accepts
    // the full IUserIdentities surface and the server validates it.
    const knownIdentities: Record<string, string> = {};
    if (userIdentities) {
      for (const key of Object.keys(userIdentities) as Array<keyof IUserIdentities>) {
        const value = userIdentities[key];
        if (isString(value) && value.length > 0) {
          knownIdentities[key] = value;
        }
      }
    }

    const identityKeys = Object.keys(knownIdentities);
    if (identityKeys.length === 0) {
      this.userIdentifiedInWorkspace = false;
      this._workspaceLastSearchedIdentitiesKey = undefined;
      return Promise.resolve();
    }

    // Stable cache key: sort keys so insertion-order differences don't
    // cause false misses. The values are partner-supplied strings; no
    // hashing needed — equality on this serialization is sufficient.
    const identitiesKey = identityKeys
      .sort()
      .map((k) => `${k}=${knownIdentities[k]}`)
      .join('&');

    // Same identifier set as the last successful dispatch → skip the
    // network call. The current flag value still reflects the correct
    // match status.
    if (identitiesKey === this._workspaceLastSearchedIdentitiesKey) {
      return this._workspaceSearchInFlightPromise || Promise.resolve();
    }

    // New / different identifier set → reset and re-search. Cache the key
    // up front so a second concurrent invocation with the same set also
    // dedupes.
    this.userIdentifiedInWorkspace = false;
    this._workspaceLastSearchedIdentitiesKey = identitiesKey;

    return new Promise<void>((resolve) => {
      try {
        search(apiKey, knownIdentities as IUserIdentities, (result: WorkspaceIdSyncResult) => {
          if (result?.httpCode === 200) {
            this.userIdentifiedInWorkspace = true;
          }
          resolve();
        });
      } catch (err) {
        console.error('Rokt Kit: Workspace IDSync search failed', err);
        // Dispatch failed — clear the cache so the same identifier set
        // can retry on the next identification rather than being stuck
        // behind a poisoned entry that short-circuits future searches.
        this._workspaceLastSearchedIdentitiesKey = undefined;
        resolve();
      }
    });
  }

  public onLoginComplete(user: IMParticleUser, _filteredIdentityRequest: unknown): string {
    this._isModifyIdentityCallInProgress = false;
    this._identityCallCount += 1;
    this._lastNonModifyCallCount = this._identityCallCount;
    return this.handleIdentityComplete(user, 'onLoginComplete');
  }

  public onLogoutComplete(user: IMParticleUser, _filteredIdentityRequest: unknown): string {
    this._isModifyIdentityCallInProgress = false;
    this._identityCallCount += 1;
    this._lastNonModifyCallCount = this._identityCallCount;
    // Anonymous sessions must not carry the previous user's match forward.
    // Clear the flag explicitly here. Also clear the identities cache so a
    // re-login (possibly with the same identifiers) dispatches a fresh
    // search rather than reusing a stale answer.
    this.userIdentifiedInWorkspace = false;
    this._workspaceSearchInFlightPromise = null;
    this._workspaceLastSearchedIdentitiesKey = undefined;
    // The mpid check at recovery time already stops a persisted preselect from firing for
    // the wrong user; clear eagerly too so it doesn't sit around waiting to be checked.
    if (this.accountId) {
      clearPendingPreselect(this.accountId);
      clearActivePreselects(this.accountId);
      clearPreselectArrivals(this.accountId);
      this.forgetCartAdd();
    }
    return this.handleIdentityComplete(user, 'onLogoutComplete');
  }

  public onModifyComplete(user: IMParticleUser, _filteredIdentityRequest: unknown): string {
    this._identityCallCount += 1;
    this._isModifyIdentityCallInProgress = true;
    // A modify that left the login flag set needs no exemption, so a failed call that clears it later still counts.
    if (mp()?.Identity?.getCurrentUser?.()?.isLoggedIn?.() === true) {
      this._lastNonModifyCallCount = this._identityCallCount;
    }
    return this.handleIdentityComplete(user, 'onModifyComplete');
  }

  /**
   * Selects placements for Rokt Web SDK with merged attributes, filters, and experimentation options.
   *
   * If a Workspace IDSync search is in flight from a recent onUserIdentified
   * call, this method waits up to `WORKSPACE_SEARCH_SELECT_TIMEOUT_MS` for it
   * to settle so the first placement call can include the
   * `userIdentifiedInWorkspace` flag without racing the network response.
   * The timeout protects against a stalled or slow search blocking placement
   * rendering — if it fires, selectPlacements proceeds without the flag.
   *
   * Implementation note: this method stays non-async deliberately. First,
   * the public return type is `RoktSelection | Promise<RoktSelection> |
   * undefined` — a superset of the `RoktSelection | Promise<RoktSelection>`
   * shape declared for `RoktLauncher.selectPlacements` above (line ~70).
   * Marking this `async` would narrow it to `Promise<RoktSelection |
   * undefined>` and silently change the contract for callers that read
   * the result synchronously. Second, `RoktSelection` has an optional
   * `then?` member, so TS treats it as ambiguously promise-like and
   * rejects it as the awaited return of an async function (TS1058) —
   * working around that would require a cast or wrapping every return in
   * `Promise.resolve(...)`. The inner work runs in `_dispatchPlacements`;
   * this wrapper just gates it on the in-flight search via `Promise.race`,
   * and on a post-terminate createLauncher when the SPA needs a new instance.
   */
  public selectPlacements(options: Record<string, unknown>): RoktSelection | Promise<RoktSelection> | undefined {
    this.refreshConsentPrivacy();
    const callTimeUser = this.currentUserSnapshot();
    const recreate = this.recreateLauncherIfTerminated();
    if (recreate) {
      const inFlight = this._workspaceSearchInFlightPromise;
      const waitForSearch = inFlight
        ? Promise.race([
            inFlight,
            new Promise<void>((resolve) => setTimeout(resolve, WORKSPACE_SEARCH_SELECT_TIMEOUT_MS)),
          ])
        : Promise.resolve();
      return Promise.all([recreate, waitForSearch]).then(() =>
        this._dispatchPlacements(options, callTimeUser),
      ) as Promise<RoktSelection>;
    }
    if (this._workspaceSearchInFlightPromise) {
      const inFlight = this._workspaceSearchInFlightPromise;
      return Promise.race([
        inFlight,
        new Promise<void>((resolve) => setTimeout(resolve, WORKSPACE_SEARCH_SELECT_TIMEOUT_MS)),
      ]).then(() => this._dispatchPlacements(options, callTimeUser)) as Promise<RoktSelection>;
    }
    return this._dispatchPlacements(options);
  }

  // Whether a pre-selection call's identifier is still the value of its entry's targetPageIdentifierAttribute among the
  // attributes the workspace's attribute filter lets the call send. A call for an entry with a fixed
  // targetPageIdentifier always is. The entry is the one the fire named, else the one its identifier keys.
  private isPreselectTargetAllowed(firedEntryOption: unknown, options: Record<string, unknown>): boolean {
    const identifier = options.identifier;
    const entryKey = isString(firedEntryOption) ? firedEntryOption : isString(identifier) ? identifier : undefined;
    const entry = findPreselectionEntryByKey(this.accountId, entryKey);
    if (entry?.targetPageIdentifierAttribute === undefined) {
      return true;
    }
    const attributes = isObject(options.attributes) ? options.attributes : {};
    return getCallIdentifier(entry, this.filterPreselectAttributes(attributes)) === identifier;
  }

  // These attributes less those the workspace's attribute filter keeps off this kit's calls.
  private filterPreselectAttributes(attributes: Record<string, unknown>): Record<string, unknown> {
    const filters = this.filters || {};
    return filters.filterUserAttributes
      ? filters.filterUserAttributes(attributes, (filters.userAttributeFilters as string[]) || [])
      : attributes;
  }

  // What a pre-selection call with these attributes would send, mirroring _dispatchPlacements: identities,
  // then the cached user attributes merged in, filtered and overridden for the target page, then the
  // session attributes, so a later source wins as it does on the wire.
  private getOutgoingPreselectAttributes(
    attributes: Record<string, unknown>,
    entryKey?: string,
  ): Record<string, unknown> {
    const merged = { ...removeSelectPlacementsAttributePersistenceDeniedAttributes(this.userAttributes), ...attributes };
    const filtered = this.filterPreselectAttributes(merged);
    const identities = this.returnUserIdentities(this.filters?.filteredUser || null) as Record<string, unknown>;
    const partner = withoutPreselectCartGateAttribute(
      this.accountId,
      entryKey
        ? applyPreselectAttributeDefaults(filtered, this.buildPreselectAttributeDefaults(entryKey, attributes))
        : filtered,
      this.findFiredEntry(entryKey),
    );
    return {
      ...identities,
      ...partner,
      ...this.returnLocalSessionAttributes(),
    };
  }

  private isStillCurrentUser(mpid: string, requireLogin: boolean): boolean {
    const currentUser = mp().Identity?.getCurrentUser?.() as FilteredUser | null | undefined;
    return (
      mpid !== '' &&
      String(this.filters?.filteredUser?.getMPID?.() ?? '') === mpid &&
      String(currentUser?.getMPID?.() ?? '') === mpid &&
      (!requireLogin || currentUser?.isLoggedIn?.() === true)
    );
  }

  private currentUserSnapshot(): CallTimeUser {
    const currentUser = mp()?.Identity?.getCurrentUser?.() as FilteredUser | null | undefined;
    return {
      mpid: String(currentUser?.getMPID?.() ?? ''),
      loggedIn: currentUser?.isLoggedIn?.() === true,
      hasIdentities: Object.values(currentUser?.getUserIdentities?.()?.userIdentities || {}).some(
        (value) => isString(value) && value !== '',
      ),
      identityCallCount: this._identityCallCount,
    };
  }

  // A modify response carries no login flag, so core can report the user as logged out after a modify while keeping
  // the MPID; exempt the cleared flag only when every identity callback since the snapshot was such a modify. A failed
  // identity call clears the flag without any kit callback, so a modify that left the flag set never takes it.
  private hasUserChangedSince(callTime: CallTimeUser): boolean {
    const currentUser = mp().Identity?.getCurrentUser?.() as FilteredUser | null | undefined;
    const loginClearedByModify =
      this._identityCallCount > callTime.identityCallCount &&
      this._lastNonModifyCallCount <= callTime.identityCallCount;
    return (
      String(currentUser?.getMPID?.() ?? '') !== callTime.mpid ||
      (callTime.loggedIn && !loginClearedByModify && currentUser?.isLoggedIn?.() !== true)
    );
  }

  // A call whose user changed while it waited goes out for the new user only when nothing it carries belongs to
  // someone else: its user had no identities and it carries no email, as when an anonymous shopper logs in, or the
  // new user holds every email form it carries, as when core identifies with a passed email that differs from the
  // user's. A logout during the wait drops the call even when the email or MPID survives the logout.
  private mayGoOutForNewUser(callTime: CallTimeUser, attributes: Record<string, unknown>): boolean {
    const currentUser = mp().Identity?.getCurrentUser?.() as FilteredUser | null | undefined;
    if (callTime.loggedIn && currentUser?.isLoggedIn?.() !== true) {
      return false;
    }
    const identities = (currentUser?.getUserIdentities?.()?.userIdentities || {}) as Record<string, unknown>;
    const hashedKey = this._mappedEmailSha256Key;
    // Read the way core reads the hashed email it identifies with.
    const hashedEmail = attributes[RoktKit.EMAIL_SHA256_KEY] || (hashedKey ? attributes[hashedKey] : undefined);
    const carried: Array<[unknown, unknown]> = [];
    if (attributes.email) {
      carried.push([attributes.email, identities.email]);
    }
    if (hashedEmail) {
      carried.push([hashedEmail, hashedKey ? identities[hashedKey] : undefined]);
    }
    if (carried.length === 0) {
      return !callTime.hasIdentities;
    }
    return carried.every(([value, held]) => isString(value) && value === held);
  }

  // Reports why a pre-selection call was dropped and undoes the records its fire wrote: a dropped call is not the
  // checkout's pre-selection, so it must not hold off the next fire.
  private dropPreselect(
    rollback: (() => void) | undefined,
    reason: string,
    details?: Parameters<typeof buildPreselectDiagnosticLogEntry>[2],
  ): undefined {
    this.loggingService?.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('missed', reason, details));
    rollback?.();
    return undefined;
  }

  private _dispatchPlacements(
    options: Record<string, unknown>,
    callTimeUser?: CallTimeUser,
  ): RoktSelection | Promise<RoktSelection> | undefined {
    this.refreshConsentPrivacy();
    // Undoes the fire's records if this call is dropped below.
    const rollback = options ? getPreselectRollback(options) : undefined;
    // Privacy or consent may change while selectPlacements waits for a search or launcher recreation.
    if (options?.preselect === true && !canDispatchPreselection(this.buildPreselectHost())) {
      rollback?.();
      return undefined;
    }
    // A targeting-disabled user gets no exit-intent selection, including one that waited across a decline.
    if (options?.[EXIT_INTENT_ORIGIN_OPTION] === true && this.isTargetingDisabled()) {
      return undefined;
    }
    // No computed key in a destructuring pattern: the CDN's NUglify pass drops the constant it names.
    const transientOption = options?.[PRESELECT_FORM_EMAIL_OPTION];
    const boundUserOption = options?.[PRESELECT_BOUND_USER_OPTION];
    const firedEntryOption = options?.[PRESELECT_ENTRY_OPTION];
    const dispatchOptions = { ...options };
    delete dispatchOptions[PRESELECT_FORM_EMAIL_OPTION];
    delete dispatchOptions[PRESELECT_BOUND_USER_OPTION];
    delete dispatchOptions[PRESELECT_ENTRY_OPTION];
    delete dispatchOptions[EXIT_INTENT_ORIGIN_OPTION];
    options = dispatchOptions;
    // A call for an entry naming targetPageIdentifierAttribute carries the trigger page's value of it as its identifier,
    // which the attribute filter below never reaches. The filter can change while the call waits for a workspace search
    // or a launcher recreation, so the value is read again here under the filter in force now, and a call whose value it
    // removes goes out as nothing and undoes its records, as the fire does when the filter removes it at the trigger.
    if (options.preselect === true && !this.isPreselectTargetAllowed(firedEntryOption, options)) {
      return this.dropPreselect(rollback, 'no_target_page_identifier', { cause: 'filtered' });
    }
    // An off-entry tap goes out only while the user it fired for is still the kit's user, and still logged in when
    // the fire needed that, so a logout or user switch during the wait never sends one user's attributes as another's.
    if (boundUserOption !== undefined) {
      const bound = isObject(boundUserOption) ? boundUserOption : {};
      const requireLogin = bound.requireLogin !== false;
      if (!this.isStillCurrentUser(String(bound.mpid ?? ''), requireLogin)) {
        return this.dropPreselect(rollback, requireLogin ? 'logged_in_dropped' : 'user_changed_dropped');
      }
    }
    // The same rule holds for any call that waited: a logout or user switch during the wait would send, and log, the
    // old user's attributes as the new user's.
    const userChanged = callTimeUser !== undefined && this.hasUserChangedSince(callTimeUser);
    // The wait may have ended on the previous user's search, and its result lands in the one flag the kit keeps for
    // every user. A user with no identities has no search.
    const previousSearchMayHaveAnswered = userChanged && callTimeUser?.hasIdentities === true;
    if (
      callTimeUser &&
      userChanged &&
      !this.mayGoOutForNewUser(callTimeUser, isObject(options.attributes) ? options.attributes : {})
    ) {
      if (options.preselect === true) {
        return this.dropPreselect(rollback, callTimeUser.loggedIn ? 'logged_in_dropped' : 'user_changed_dropped');
      }
      this.loggingService?.log({
        message: 'Rokt Kit: Dropped a selectPlacements call whose user changed while it waited',
        code: 'SELECT_PLACEMENTS_USER_CHANGED',
      });
      rollback?.();
      return undefined;
    }
    const formEmail = isObject(transientOption) ? transientOption : undefined;
    const formEmailKey = formEmail && isString(formEmail.key) ? formEmail.key : undefined;
    if (formEmailKey) {
      const dropCause = this.getFormEmailDropCause(formEmailKey, formEmail!.mpid);
      if (dropCause) {
        return this.dropPreselect(rollback, 'form_email_dropped', { cause: dropCause });
      }
    }
    const attributes = (options.attributes as Record<string, unknown>) || {};
    const cachedUserAttributes = removeSelectPlacementsAttributePersistenceDeniedAttributes(this.userAttributes);
    const placementAttributes: Record<string, unknown> = { ...cachedUserAttributes, ...attributes };

    const filters = this.filters || {};
    const userAttributeFilters = (filters.userAttributeFilters as string[]) || [];
    const filteredUser = filters.filteredUser || null;
    const mpid = filteredUser ? filteredUser.getMPID() : null;

    let filteredAttributes: Record<string, unknown>;

    if (!filters) {
      console.warn('Rokt Kit: No filters available, using user attributes');
      filteredAttributes = placementAttributes;
    } else if (filters.filterUserAttributes) {
      filteredAttributes = filters.filterUserAttributes(placementAttributes, userAttributeFilters);
    } else {
      filteredAttributes = placementAttributes;
    }

    const persistedAttributes = removeSelectPlacementsAttributePersistenceDeniedAttributes(filteredAttributes);
    // A form value is never cached: the key keeps whatever it held before this call.
    if (formEmailKey) {
      if (Object.prototype.hasOwnProperty.call(cachedUserAttributes, formEmailKey)) {
        persistedAttributes[formEmailKey] = cachedUserAttributes[formEmailKey];
      } else {
        delete persistedAttributes[formEmailKey];
      }
    }
    this.userAttributes = persistedAttributes;

    const optimizelyAttributes = this._onboardingExpProvider === 'Optimizely' ? this.fetchOptimizely() : {};

    const filteredUserIdentities = this.returnUserIdentities(filteredUser);

    const sessionAttributes = this.returnLocalSessionAttributes();
    // Checked per call as well as at capture: another tab without the signal shares localStorage and
    // can still be writing page history.
    const isPageHistoryAllowed = this.isPageHistoryAllowed();
    const pageEvents = isPageHistoryAllowed ? buildPageEvents(loadPageViews()) : [];
    const utmParams = isPageHistoryAllowed ? loadUtmParams() : null;
    const mpSessionId = this.readMpSessionId();
    const mpDeviceId = this.readMpDeviceId();

    const identifier = typeof options.identifier === 'string' ? options.identifier : undefined;
    // A speculative call takes its defaults and cache keys from the entry that fired it, named by the fire, never
    // matched again on its identifier, which another entry's target value can equal.
    const firedEntryKey = isString(firedEntryOption) ? firedEntryOption : identifier;
    // A target page's own call is matched on the saved user attributes under the call's own, so a target value the
    // shopper's saved attributes hold finds the entry its early call went out for, and the call's cache keys meet that
    // call's cached result. The view is built once, after the workspace's attribute filter, and both the cache keys and
    // the arrival report read it, so the two never name different entries and a filtered value matches neither. It is
    // read only for an entry that names targetPageIdentifierAttribute while pre-selection is on, so it is built only then.
    const targetLookupAttributes =
      options.preselect !== true && this.isPreselectionEnabled() && usesTargetPageIdentifierAttribute(this.accountId)
        ? this.filterPreselectAttributes(getPreselectLookupAttributes(cachedUserAttributes, attributes))
        : {};
    const cacheConfigEntry =
      options.preselect === true
        ? this.findFiredEntry(firedEntryKey)
        : this.findCacheConfigEntry(identifier, targetLookupAttributes);
    const preselectFills =
      options.preselect === true ? this.buildPreselectAttributeDefaults(firedEntryKey, attributes) : undefined;
    const partnerAttributes =
      options.preselect === true
        ? withoutPreselectCartGateAttribute(
            this.accountId,
            applyPreselectAttributeDefaults(filteredAttributes, preselectFills),
            cacheConfigEntry,
          )
        : filteredAttributes;

    const selectPlacementsAttributes: Record<string, unknown> = {
      ...(filteredUserIdentities as Record<string, unknown>),
      ...partnerAttributes,
      ...optimizelyAttributes,
      ...sessionAttributes,
      ...(pageEvents.length ? { [PAGE_EVENTS_KEY]: JSON.stringify(pageEvents) } : {}),
      ...(utmParams ? { [PAGE_VIEW_ATTRIBUTES_KEY]: utmParams } : {}),
      ...(!previousSearchMayHaveAnswered && this.userIdentifiedInWorkspace
        ? { [USER_IDENTIFIED_IN_WORKSPACE_KEY]: true }
        : {}),
      ...(mpSessionId ? { [MPARTICLE_SESSION_ID_KEY]: mpSessionId } : {}),
      ...(mpDeviceId ? { [MPARTICLE_DEVICE_ID_KEY]: mpDeviceId } : {}),
      mpid,
    };
    // The key can also arrive through partner, user or session attributes, which the kit's own value no longer
    // overwrites under the flag.
    if (this.isDeviceIdDisabled()) {
      delete selectPlacementsAttributes[MPARTICLE_DEVICE_ID_KEY];
    }
    if (options.preselect !== true) {
      reportPreselectArrival(this.buildPreselectHost(), identifier, selectPlacementsAttributes, targetLookupAttributes);
    }

    // A confirm-click or cart page-view pre-selection whose email went missing while it waited does not go out without one.
    const trigger = partnerAttributes[PRESELECT_TRIGGER_ATTRIBUTE];
    if (
      options.preselect === true &&
      isString(trigger) &&
      (trigger.indexOf('intent_') === 0 || trigger.indexOf('pageview_cart|') === 0) &&
      !hasPreselectEmail(selectPlacementsAttributes, this._mappedEmailSha256Key)
    ) {
      return this.dropPreselect(rollback, 'no_strict_email', { cause: 'lost_before_dispatch' });
    }

    const cacheIdentityKeys = getPreselectCacheIdentityKeys(
      cacheConfigEntry,
      preselectFills,
      selectPlacementsAttributes,
    );
    const cacheMatchValues = getPreselectCacheMatchValues(cacheConfigEntry, preselectFills, selectPlacementsAttributes);
    const cacheMatchTokens = getPreselectCacheMatchTokens(
      cacheConfigEntry,
      selectPlacementsAttributes,
      options.preselect !== true,
    );
    // Only the kit writes the marker: a copy from the page, the user attributes or a session attribute never goes out.
    delete selectPlacementsAttributes[PRESELECT_DEFAULTED_ATTRIBUTE];
    const defaultedMarker = getPreselectDefaultedMarker(preselectFills, selectPlacementsAttributes);
    if (defaultedMarker) {
      selectPlacementsAttributes[PRESELECT_DEFAULTED_ATTRIBUTE] = defaultedMarker;
    }

    const selectPlacementsOptions: Record<string, unknown> = {
      ...options,
      attributes: selectPlacementsAttributes,
      ...(cacheConfigEntry ? { cacheMatchKeys: getPreselectCacheMatchKeys(cacheConfigEntry) } : {}),
      ...(cacheIdentityKeys ? { cacheIdentityKeys } : {}),
      ...(cacheMatchValues ? { cacheMatchValues } : {}),
      ...(cacheMatchTokens ? { cacheMatchTokens } : {}),
    };

    const snapshot = this.currentUserSnapshot();
    const dispatchUser =
      callTimeUser?.loggedIn && !userChanged && !snapshot.loggedIn
        ? { ...snapshot, loggedIn: true, identityCallCount: callTimeUser.identityCallCount }
        : snapshot;
    const selection = this.launcher!.selectPlacements(selectPlacementsOptions);

    const isPreselect = options.preselect === true;

    // After selection resolves, sync the Rokt session ID back to mParticle, then log
    const logSelection = () => {
      if (isPreselect) {
        return;
      }
      // Core files the event under whoever is current once the selection resolves, which can be a user an identity
      // call put in place after dispatch. The event's attributes were built for the dispatch user: its MPID, its
      // identities and its cached attributes. So it goes to a new user only when the dispatch user was anonymous,
      // not logged in and with no identities, as when an anonymous shopper logs in. A new user who holds the call's
      // email is not enough, unlike for a call that waited: the rest of the attributes would still be another user's.
      if (this.hasUserChangedSince(dispatchUser) && (dispatchUser.loggedIn || dispatchUser.hasIdentities)) {
        this.loggingService?.log({
          message: 'Rokt Kit: Skipped the selectPlacements event because its user changed before the selection resolved',
          code: 'SELECT_PLACEMENTS_EVENT_USER_CHANGED',
        });
        return;
      }
      this.logSelectPlacementsEvent(selectPlacementsAttributes);
    };

    void Promise.resolve(selection)
      .then((sel) => {
        if (isPreselect) {
          return;
        }
        this.trackPlacementEngagement(sel);
        return sel?.context?.sessionId?.then((sessionId) => this.setRoktSessionId(sessionId));
      })
      .catch(() => undefined)
      .finally(logSelection);

    return selection;
  }

  // Logs each press of a placement's response buttons, and each close, as an auto button click. The
  // placement's frame keeps its buttons and text from the page, so only the response kind goes out.
  private trackPlacementEngagement(selection: RoktSelection | undefined): void {
    if (!selection || !isFunction(selection.on)) {
      return;
    }
    // Presses still waiting for a positive response, oldest first, per placement. A replay can deliver
    // several presses before their positive responses.
    const pending: Record<string, Array<ReturnType<typeof setTimeout>>> = {};
    const settle = (placementId: string, timer: ReturnType<typeof setTimeout>, response: 'positive' | 'negative') => {
      const timers = pending[placementId] || [];
      timers.splice(timers.indexOf(timer), 1);
      clearTimeout(timer);
      this.logPlacementEngagement(placementId, response);
    };
    const subscribe = (eventName: string, callback: (placementId: string, event?: RoktSelectionEvent) => void) => {
      try {
        selection.on!(eventName)?.subscribe?.((event) => callback(String(event?.placement?.id ?? ''), event));
      } catch {
        // A launcher without this event logs nothing for it.
      }
    };
    subscribe('OFFER_ENGAGEMENT', (placementId) => {
      // A press made while clicks may not be logged is dropped, so a later opt-in can't log it.
      if (!this.canLogPlacementClick()) {
        return;
      }
      const timer: ReturnType<typeof setTimeout> = setTimeout(
        () => settle(placementId, timer, 'negative'),
        ENGAGEMENT_PAIR_MS,
      );
      (pending[placementId] = pending[placementId] || []).push(timer);
    });
    // A positive response settles the press it follows. One with no press waiting belongs to a press that
    // was dropped, so it logs nothing.
    subscribe('POSITIVE_ENGAGEMENT', (placementId) => {
      const oldest = (pending[placementId] || [])[0];
      if (oldest !== undefined) {
        settle(placementId, oldest, 'positive');
      }
    });
    subscribe('PLACEMENT_CLOSED', (placementId) => {
      (pending[placementId] || []).slice().forEach((timer) => settle(placementId, timer, 'negative'));
      this.logPlacementEngagement(placementId, 'close');
    });
    subscribe('LINK_ENGAGEMENT', (placementId, event) => {
      const domain = event?.body?.domain;
      this.logPlacementLink(
        placementId,
        typeof domain === 'string' && domain.length <= 253 && LINK_DOMAIN.test(domain.toLowerCase())
          ? domain.toLowerCase()
          : undefined,
      );
    });
  }

  // Checked when each click is logged, since the launcher calls back outside core's own gates.
  private canLogPlacementClick(): boolean {
    return this.isCheckoutIntentActive() && this.isForwardingAllowed() && isFunction(mp().logEvent);
  }

  private logPlacementEngagement(placementId: string, response: 'positive' | 'negative' | 'close'): void {
    if (!this.canLogPlacementClick()) {
      return;
    }
    mp().logEvent(AUTO_BUTTON_CLICK_EVENT_NAME, mp().EventType.Other, {
      is_auto_button_click: true,
      is_rokt_placement_click: true,
      element: 'button',
      type: 'button',
      label_source: ROKT_PLACEMENT_LABEL_SOURCE,
      hostname: window.location.hostname,
      rokt_response: response,
      rokt_placement_id: placementId,
    });
  }

  // A link pressed inside a placement, logged like an auto link click to another site.
  private logPlacementLink(placementId: string, domain: string | undefined): void {
    if (!this.canLogPlacementClick()) {
      return;
    }
    const attributes: Record<string, string | boolean> = {
      is_auto_link_click: true,
      is_rokt_placement_click: true,
      element: 'link',
      type: 'link',
      label_source: ROKT_PLACEMENT_LABEL_SOURCE,
      hostname: window.location.hostname,
      link_type: 'external',
      rokt_placement_id: placementId,
    };
    if (domain) {
      attributes.link_domain = domain;
    }
    mp().logEvent(AUTO_LINK_CLICK_EVENT_NAME, mp().EventType.Other, attributes);
  }

  /**
   * Passes attributes to the Rokt Web SDK for client-side hashing.
   */
  public hashAttributes(attributes: Record<string, unknown>): Promise<Record<string, unknown>> | null {
    if (!this.isKitReady()) {
      console.error('Rokt Kit: Not initialized');
      return null;
    }
    return this.launcher!.hashAttributes(attributes);
  }

  /**
   * Enables optional Integration Launcher extensions before selecting placements.
   *
   * @deprecated This functionality has been internalized and will be removed in a future release.
   */
  public use(extensionName: string): Promise<unknown> {
    if (!this.isKitReady()) {
      console.error('Rokt Kit: Not initialized');
      return Promise.reject(new Error('Rokt Kit: Not initialized'));
    }
    if (!extensionName || !isString(extensionName)) {
      return Promise.reject(new Error('Rokt Kit: Invalid extension name'));
    }
    return this.launcher!.use(extensionName);
  }

  /**
   * Tears down the Rokt launcher and the placements it rendered.
   *
   * The kit's launcher reference is left in place so isKitReady() stays true.
   * The Web SDK clears its memoized launcher on terminate, so a later
   * createLauncher (SPA navigation) produces a new instance. The next
   * selectPlacements call re-attaches that instance. Nulling the reference
   * here would flip the kit to not-ready with no drain path for queued calls.
   */
  public terminate(): Promise<void> {
    if (!this.isKitReady()) {
      console.error('Rokt Kit: Not initialized');
      return Promise.resolve();
    }
    markLauncherTerminated(this._launcherAttachState);
    return this.launcher!.terminate();
  }

  /**
   * Registers a callback to be invoked once rokt-thank-you-element.js becomes available.
   */
  public onShoppableAdsReady(callback: () => void) {
    if (this._isThankYouElementLoaded) {
      callback();
    } else {
      this._thankYouElementOnLoadCallback = callback;
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
  if (!config) {
    window.console.log('You must pass a config object to register the kit ' + name);
    return;
  }
  if (!isObject(config)) {
    window.console.log("'config' must be an object. You passed in a " + typeof config);
    return;
  }

  if (isObject(config.kits)) {
    (config.kits as Record<string, unknown>)[name] = {
      constructor: RoktKit,
    };
  } else {
    config.kits = {};
    config.kits[name] = {
      constructor: RoktKit,
    };
  }
  window.console.log('Successfully registered ' + name + ' to your mParticle configuration');
}

if (typeof window !== 'undefined' && window.mParticle && mp().addForwarder) {
  mp().addForwarder({
    name: name,
    constructor: RoktKit,
    getId: getId,
  });
}

export { register };
export type { LoggingService };
