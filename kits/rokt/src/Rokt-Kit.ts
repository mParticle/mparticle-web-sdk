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

interface RoktSelection {
  context?: {
    sessionId?: Promise<string>;
  };
  then?: (callback: (sel: RoktSelection) => void) => Promise<void>;
  catch?: (callback: () => void) => void;
}

interface RoktLauncher {
  selectPlacements(options: Record<string, unknown>): RoktSelection | Promise<RoktSelection>;
  hashAttributes(attributes: Record<string, unknown>): Promise<Record<string, unknown>>;
  use(extensionName: string): Promise<unknown>;
}

interface RoktGlobal {
  createLauncher(options: Record<string, unknown>): Promise<RoktLauncher>;
  createLocalLauncher(options: Record<string, unknown>): RoktLauncher;
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

interface KitFilters {
  userAttributeFilters?: string[];
  filterUserAttributes?: (attributes: Record<string, unknown>, filters?: string[]) => Record<string, unknown>;
  filteredUser?: FilteredUser | null;
}

interface RoktManager {
  attachKit(kit: RoktKit): void | Promise<void>;
  flushOnShoppableAdsReadyMessageQueue?(kit: RoktKit): void;
  filters?: KitFilters;
  domain?: string;
  launcherOptions?: Record<string, unknown>;
  getLocalSessionAttributes?(): Record<string, unknown>;
  setLocalSessionAttribute?(key: string, value: unknown): void;
}

interface MParticleInstance {
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
  sessionManager?: { getSession(): string };
  _getActiveForwarders(): Array<{ name: string }>;
  config?: { isLocalLauncherEnabled?: boolean; isLoggingEnabled?: boolean };
  captureTiming?(metricName: string): void;
  forwarder?: RoktKit;
  loggedEvents?: Array<Record<string, unknown>>;
  _registerErrorReportingService?(service: ErrorReportingService): void;
  _registerLoggingService?(service: LoggingService): void;
  Identity?: { search?: WorkspaceIdSyncSearcher };
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
const moduleId = 181;
const EVENT_NAME_SELECT_PLACEMENTS = 'selectPlacements';
const ADBLOCK_CONTROL_DOMAIN = 'apps.roktecommerce.com';
const INIT_LOG_SAMPLING_RATE = 0.1;
const ROKT_THANK_YOU_JOURNEY_EXTENSION = 'ThankYouPageJourney';
const ROKT_INTEGRATION_SCRIPT_ID = 'rokt-launcher';
const ROKT_THANK_YOU_ELEMENT_SCRIPT_ID = 'rokt-thank-you-element';
const USER_IDENTIFIED_IN_WORKSPACE_KEY = 'userIdentifiedInWorkspace';

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
  const resolvedDomain = typeof domain !== 'undefined' ? domain : DEFAULT_ROKT_DOMAIN;
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

  return generateBaseUrl(domain) + endpoint;
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

function isObject(val: unknown): val is Record<string, unknown> {
  return val != null && typeof val === 'object' && Array.isArray(val) === false;
}

function parseSettingsString<T>(settingsString?: string): T[] {
  if (!settingsString) {
    return [];
  }
  try {
    return JSON.parse(settingsString.replace(/&quot;/g, '"')) as T[];
  } catch (_error) {
    console.error('Settings string contains invalid JSON');
  }
  return [];
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

function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'object') {
    return Object.keys(value as object).length === 0;
  }
  if (Array.isArray(value)) {
    return (value as unknown[]).length === 0;
  }
  return false;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
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

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return hash;
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

  const pageUrl = window.location.href.split('?')[0].split('#')[0];
  const params =
    'version=' +
    encodeURIComponent(version ?? '') +
    '&launcherInstanceGuid=' +
    encodeURIComponent(guid) +
    '&pageUrl=' +
    encodeURIComponent(pageUrl);

  const existingDomain = domain || 'apps.rokt.com';
  createAutoRemovedIframe('https://' + existingDomain + '/v1/wsdk-init/index.html?' + params);

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
  return typeof window !== 'undefined' ? window.location?.href : undefined;
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
  private _transport: ReportingTransport;
  private _loggingUrl: string;
  private _errorReportingService: { report: (e: ErrorReport) => void };

  constructor(
    config: ReportingConfig,
    errorReportingService: { report: (e: ErrorReport) => void },
    integrationName: string | null | undefined,
    launcherInstanceGuid?: string,
    accountId?: string | null,
    rateLimiter?: RateLimiter,
  ) {
    this._transport = new ReportingTransport(config, integrationName, launcherInstanceGuid, accountId, rateLimiter);
    this._loggingUrl = generateReportingUrl(config?.loggingUrl, config?.integrationDomain, LOGGING_ENDPOINT);
    this._errorReportingService = errorReportingService;
  }

  log(entry: LogEntry | null | undefined): void {
    if (!entry) return;
    this._transport.send(
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

  // ---- Private helpers ----

  private getEventAttributeValue(event: SDKEvent, eventAttributeKey: string): unknown {
    const attributes = event && event.EventAttributes;
    if (!attributes) {
      return null;
    }

    if (typeof attributes[eventAttributeKey] === 'undefined') {
      return null;
    }

    return attributes[eventAttributeKey];
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

  private isLauncherReadyToAttach(): boolean {
    return !!window.Rokt && typeof window.Rokt.createLauncher === 'function';
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
    if (isEmpty(this.placementEventMappingLookup) && isEmpty(this.placementEventAttributeMappingLookup)) {
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

    mp().logEvent(EVENT_NAME_SELECT_PLACEMENTS, EVENT_TYPE_OTHER, attributes as Record<string, unknown>);
  }

  private setRoktSessionId(sessionId: string): void {
    if (!sessionId || typeof sessionId !== 'string') {
      return;
    }
    try {
      const mpInstance = mp().getInstance();
      if (mpInstance && typeof mpInstance.setIntegrationAttribute === 'function') {
        mpInstance.setIntegrationAttribute(moduleId, {
          roktSessionId: sessionId,
        });
      }
    } catch (_e) {
      // Best effort — never let this break the partner page
    }
  }

  private attachLauncher(
    accountId: string,
    launcherOptions: Record<string, unknown>,
    legacyRoktExtensions: string[] = [],
  ): void {
    const mpSessionId =
      mp() && mp().sessionManager && typeof mp().sessionManager!.getSession === 'function'
        ? mp().sessionManager!.getSession()
        : undefined;

    const options: Record<string, unknown> = {
      accountId,
      ...(launcherOptions || {}),
      ...(mpSessionId ? { mpSessionId } : {}),
    };

    let launcherPromise: Promise<RoktLauncher>;
    if (this.isPartnerInLocalLauncherTestGroup()) {
      launcherPromise = Promise.resolve(window.Rokt!.createLocalLauncher(options));
    } else {
      launcherPromise = window.Rokt!.createLauncher(options);
    }

    launcherPromise
      .then(async (launcher) => {
        await registerLegacyExtensions(legacyRoktExtensions, launcher);
        this.initRoktLauncher(launcher);
      })
      .catch((err: unknown) => {
        console.error('Error creating Rokt launcher:', err);
      });
  }

  private initRoktLauncher(launcher: RoktLauncher): void {
    // Assign the launcher to a global variable for later access
    if (window.Rokt) {
      window.Rokt.currentLauncher = launcher;
    }
    // Locally cache the launcher and filters
    this.launcher = launcher;

    const roktFilters = mp().Rokt?.filters;

    if (!roktFilters) {
      console.warn('Rokt Kit: No filters have been set.');
    } else {
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

  private isPartnerInLocalLauncherTestGroup(): boolean {
    return !!(mp().config && mp().config!.isLocalLauncherEnabled && this.isAssignedToSampleGroup());
  }

  private isAssignedToSampleGroup(): boolean {
    const LOCAL_LAUNCHER_TEST_GROUP_THRESHOLD = 0.5;
    return Math.random() > LOCAL_LAUNCHER_TEST_GROUP_THRESHOLD;
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
    const kitSettings = settings as unknown as RoktKitSettings;
    const accountId = kitSettings.accountId;
    this.userAttributes = removeSelectPlacementsAttributePersistenceDeniedAttributes(filteredUserAttributes);
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
    const launcherOptions: Record<string, unknown> = {
      ...((mp().Rokt?.launcherOptions as Record<string, unknown>) || {}),
    };
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
      loadRoktScript(ROKT_INTEGRATION_SCRIPT_ID, generateLauncherScript(domain, roktExtensionsQueryParams), {
        onLoad: () => {
          if (this.isLauncherReadyToAttach()) {
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
    if (!this.isKitReady()) {
      return 'Kit not ready for forwarder: ' + name;
    }
    if (typeof mp().Rokt?.setLocalSessionAttribute === 'function') {
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
    return 'Successfully set user attribute for forwarder: ' + name;
  }

  public removeUserAttribute(key: string): string {
    delete this.userAttributes[key];
    return 'Successfully removed user attribute for forwarder: ' + name;
  }

  private handleIdentityComplete(user: IMParticleUser, callbackName: string): string {
    this.userAttributes = removeSelectPlacementsAttributePersistenceDeniedAttributes(user.getAllUserAttributes());
    return 'Successfully called ' + callbackName + ' for forwarder: ' + name;
  }

  public onUserIdentified(user: IMParticleUser): string {
    const filteredUser = user as FilteredUser;
    this.filters.filteredUser = filteredUser;
    this._workspaceSearchInFlightPromise = this.search(filteredUser);
    return this.handleIdentityComplete(user, 'onUserIdentified');
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
    return this.handleIdentityComplete(user, 'onLoginComplete');
  }

  public onLogoutComplete(user: IMParticleUser, _filteredIdentityRequest: unknown): string {
    // Anonymous sessions must not carry the previous user's match forward.
    // Clear the flag explicitly here. Also clear the identities cache so a
    // re-login (possibly with the same identifiers) dispatches a fresh
    // search rather than reusing a stale answer.
    this.userIdentifiedInWorkspace = false;
    this._workspaceSearchInFlightPromise = null;
    this._workspaceLastSearchedIdentitiesKey = undefined;
    return this.handleIdentityComplete(user, 'onLogoutComplete');
  }

  public onModifyComplete(user: IMParticleUser, _filteredIdentityRequest: unknown): string {
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
   * this wrapper just gates it on the in-flight search via `Promise.race`.
   */
  public selectPlacements(options: Record<string, unknown>): RoktSelection | Promise<RoktSelection> | undefined {
    if (this._workspaceSearchInFlightPromise) {
      const inFlight = this._workspaceSearchInFlightPromise;
      return Promise.race([
        inFlight,
        new Promise<void>((resolve) => setTimeout(resolve, WORKSPACE_SEARCH_SELECT_TIMEOUT_MS)),
      ]).then(() => this._dispatchPlacements(options)) as Promise<RoktSelection>;
    }
    return this._dispatchPlacements(options);
  }

  private _dispatchPlacements(options: Record<string, unknown>): RoktSelection | Promise<RoktSelection> | undefined {
    const attributes = ((options && (options.attributes as Record<string, unknown>)) || {}) as Record<string, unknown>;
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

    this.userAttributes = removeSelectPlacementsAttributePersistenceDeniedAttributes(filteredAttributes);

    const optimizelyAttributes = this._onboardingExpProvider === 'Optimizely' ? this.fetchOptimizely() : {};

    const filteredUserIdentities = this.returnUserIdentities(filteredUser);

    const localSessionAttributes = this.returnLocalSessionAttributes();

    const selectPlacementsAttributes: Record<string, unknown> = {
      ...(filteredUserIdentities as Record<string, unknown>),
      ...filteredAttributes,
      ...optimizelyAttributes,
      ...localSessionAttributes,
      ...(this.userIdentifiedInWorkspace ? { [USER_IDENTIFIED_IN_WORKSPACE_KEY]: true } : {}),
      mpid,
    };

    const selectPlacementsOptions: Record<string, unknown> = { ...options, attributes: selectPlacementsAttributes };

    const selection = this.launcher!.selectPlacements(selectPlacementsOptions);

    // After selection resolves, sync the Rokt session ID back to mParticle, then log
    const logSelection = () => this.logSelectPlacementsEvent(selectPlacementsAttributes);

    void Promise.resolve(selection)
      .then((sel) => sel?.context?.sessionId?.then((sessionId) => this.setRoktSessionId(sessionId)))
      .catch(() => undefined)
      .finally(logSelection);

    return selection;
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
