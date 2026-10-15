import { IMParticleUser, SDKEvent } from '@mparticle/web-sdk/internal';
import type { IUserIdentities } from '@mparticle/web-sdk';

import { PRESELECTION_CONFIG, type PreselectionConfigEntry } from './preselectionConfig';
import { parsePreselectionConfigSetting } from './preselectionConfigSetting';
import { buildActivePreselectFieldKey, getActivePreselect, setActivePreselect } from './activePreselectStorage';
import { getPendingPreselect, setPendingPreselect, clearPendingPreselect } from './pendingPreselectStorage';
import {
  INTENT_ARRIVAL_WINDOW_MS,
  markPreselectArrival,
  recordPreselectFired,
  recordPreselectIntent,
  recordPreselectTrigger,
  wasPreselectTriggeredInAnyTab,
  type PreselectArrivalRecord,
  type PreselectIntentKind,
} from './preselectArrivalStorage';
import { removeSelectPlacementsAttributePersistenceDeniedAttributes } from './selectPlacementsAttributePersistence';
import {
  buildPreselectDiagnosticLogEntry,
  type DiagnosticLogEntry,
  type PreselectDiagnosticDetails,
} from './diagnosticTiming';
import { djb2, isEmpty, isString, readOwnValue } from './utils';

const settingEntriesByAccount = new Map<string, PreselectionConfigEntry[]>();

// An account with a valid preselectionConfig setting uses only its entries; otherwise it keeps
// PRESELECTION_CONFIG. Returns why a present setting was rejected, or undefined.
export function applyPreselectionConfigSetting(accountId: string, setting: string | undefined): string | undefined {
  settingEntriesByAccount.delete(accountId);
  if (!setting) {
    return undefined;
  }

  const result = parsePreselectionConfigSetting(accountId, setting);
  if ('error' in result) {
    return result.error;
  }
  settingEntriesByAccount.set(accountId, result.entries);
  return undefined;
}

function getPreselectionEntries(accountId: string): PreselectionConfigEntry[] {
  return settingEntriesByAccount.get(accountId) ?? PRESELECTION_CONFIG.filter((entry) => entry.accountId === accountId);
}

// A '*' in a configured pathname matches exactly one non-empty path segment. Segment counts
// must be equal, so the pattern is anchored at both ends and cannot widen to another page.
function pathnameMatches(configuredPathname: string, pathname: string): boolean {
  const normalizedConfigured = stripTrailingSlash(configuredPathname);
  const normalizedPathname = stripTrailingSlash(pathname);

  if (!normalizedConfigured.includes('*')) {
    return normalizedConfigured === normalizedPathname;
  }

  const configuredSegments = normalizedConfigured.split('/');
  const pathnameSegments = normalizedPathname.split('/');
  if (configuredSegments.length !== pathnameSegments.length) {
    return false;
  }

  return configuredSegments.every((segment, index) =>
    segment === '*' ? pathnameSegments[index] !== '' : segment === pathnameSegments[index],
  );
}

// A site's own router may or may not add a trailing slash, so one is stripped from both
// sides before any compare. '/' itself is left alone: it has no slash left to strip.
function stripTrailingSlash(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

// A pathname-driven fire has no page-view event behind it, so attribute resolution falls
// through to the user attributes collectAttributes already reads as its fallback.
const pathnameTriggerEvent = {} as SDKEvent;
const intentCommitTriggerEvent = {} as SDKEvent;
const intentWalletTriggerEvent = {} as SDKEvent;
type IntentTriggerKind = 'intent_commit' | 'intent_wallet';
// What the core SDK hands the kit on a checkout intent: the kind and when the shopper acted.
export type PreselectIntentSignal = {
  kind: PreselectIntentKind;
  t: number;
};
const INTENT_KINDS: PreselectIntentKind[] = ['commit', 'wallet', 'checkout_step', 'frame'];
const handledIntentSignals = new Set<string>();
const observedIntentKinds = new Set<string>();
const intentPathHistory: Array<{ pathname: string; since: number }> = [];

function intentKindOf(event: SDKEvent | undefined): IntentTriggerKind | undefined {
  if (event === intentCommitTriggerEvent) return 'intent_commit';
  if (event === intentWalletTriggerEvent) return 'intent_wallet';
  return undefined;
}

function isIntentTriggerEvent(event: SDKEvent): boolean {
  return intentKindOf(event) !== undefined;
}

export function recordPreselectIntentPath(pathname: string, since = Date.now()): void {
  pathname = stripTrailingSlash(pathname);
  if (intentPathHistory[intentPathHistory.length - 1]?.pathname === pathname) return;
  intentPathHistory.push({ pathname, since });
  if (intentPathHistory.length > 8) intentPathHistory.shift();
  observedIntentKinds.clear();
}

export function hasPreselectionIntentTrigger(accountId: string | null | undefined): boolean {
  return !!accountId && getPreselectionEntries(accountId).some((entry) => entry.intentTrigger);
}

// With checkout intent active, every entry fires on the confirm click rather than dispatchDelayMs,
// unless it opts out with intentTrigger 'observe'. Otherwise only an entry set to 'fire' does.
function firesOnCheckoutIntent(host: PreselectHost, entry: PreselectionConfigEntry | undefined): boolean {
  if (!entry || entry.intentTrigger === 'observe') return false;
  return entry.intentTrigger === 'fire' || host.isCheckoutIntentActive?.() === true;
}

// The core SDK has already dropped untrusted, throttled and privacy-suppressed signals. Whether one
// may fire is the entry's own intentTrigger; every other signal is observed only.
export function handlePreselectIntentSignal(
  state: PreselectState,
  host: PreselectHost,
  signal: PreselectIntentSignal,
): void {
  if (!signal || !INTENT_KINDS.includes(signal.kind) || typeof signal.t !== 'number' || !Number.isFinite(signal.t))
    return;
  const key = `${signal.kind}:${signal.t}`;
  if (handledIntentSignals.has(key)) return;
  handledIntentSignals.add(key);
  if (handledIntentSignals.size > 4096) handledIntentSignals.delete(handledIntentSignals.values().next().value!);
  if (
    host.isTargetingDisabled?.() ||
    host.isIntentPrivacyAllowed?.() === false ||
    !host.isKitReady() ||
    !host.isPreselectionEnabled() ||
    !(hasPreselectionIntentTrigger(host.accountId) ||
      (host.isCheckoutIntentActive?.() === true && hasPreselectionConfigForAccount(host.accountId)))
  )
    return;
  recordIntentForArrival(host.accountId!, signal);
  const path = [...intentPathHistory].reverse().find((entry) => entry.since <= signal.t);
  if (!path) return;
  const entry = findPreselectionConfig(host.accountId, path.pathname);
  const firesForEntry = firesOnCheckoutIntent(host, entry);
  const onTriggerPath = !!entry?.intentTrigger || firesForEntry;
  if (!onTriggerPath) return;
  const currentPathname = window.location.pathname;
  const samePath = stripTrailingSlash(path.pathname) === stripTrailingSlash(currentPathname);
  const firesOnIntent = signal.kind === 'commit' || signal.kind === 'wallet';
  if (!firesForEntry || !firesOnIntent || !samePath) {
    const observedKey = `${path.since}:${signal.kind}`;
    if (!observedIntentKinds.has(observedKey)) {
      observedIntentKinds.add(observedKey);
      host.logPlacementDiagnostic(
        buildPreselectDiagnosticLogEntry('skipped', 'intent_observed', {
          intent_kind: signal.kind,
          has_identity: hasValidIdentity(host.filteredUser),
          hold_running: !!state.scheduledDispatch,
          on_trigger_path: onTriggerPath,
        }),
      );
    }
    return;
  }
  const kind: IntentTriggerKind = signal.kind === 'commit' ? 'intent_commit' : 'intent_wallet';
  const held = state.scheduledDispatch;
  if (held && stripTrailingSlash(held.pathname) === stripTrailingSlash(currentPathname)) {
    cancelScheduledDispatch(state);
    releaseHeldDispatch(state, host, held, 'intent_released', kind);
    return;
  }
  const pending = state.pending.find(
    (dispatch) => stripTrailingSlash(dispatch.pathname) === stripTrailingSlash(currentPathname),
  );
  if (pending) {
    pending.intentSeen = kind;
    // A dispatch held only for the click goes now; one still missing identity, attributes or the
    // launcher keeps the intent and goes the moment it resolves.
    if (pending.waitingFor === 'intent') {
      state.pending = state.pending.filter((dispatch) => dispatch !== pending);
      maybeFirePreselect(
        state, host, pending.event, currentPathname, pending.triggeringUserId, pending.triggeredAt, kind,
      );
    }
    return;
  }
  maybeFirePreselect(
    state,
    host,
    signal.kind === 'commit' ? intentCommitTriggerEvent : intentWalletTriggerEvent,
    currentPathname,
    undefined,
    signal.t,
  );
}

// Each intent-enrolled target page keeps the intent for its arrival line, wherever the shopper was.
function recordIntentForArrival(accountId: string, signal: PreselectIntentSignal): void {
  const identifiers = new Set(
    getPreselectionEntries(accountId)
      .filter((entry) => entry.intentTrigger)
      .map((entry) => entry.targetPageIdentifier),
  );
  identifiers.forEach((identifier) => recordPreselectIntent(accountId, identifier, signal.kind, signal.t));
}

function isPathnameTriggerEvent(event: SDKEvent): boolean {
  return event === pathnameTriggerEvent;
}

const MESSAGE_TYPE_PAGE_EVENT = 4; // mParticle MessageType.PageEvent, what logEvent sends
// Set by core auto button tracking on every automatic click. The name survives the
// attribute filters and data plans that can strip the attribute.
const AUTO_BUTTON_EVENT_NAME = 'Auto Button Click';
const AUTO_BUTTON_ATTRIBUTE = 'is_auto_button_click';

// Auto button clicks reach the kit as gated checkout intent signals instead, so they
// never count as configured trigger events or placement event mappings.
export function isAutoButtonClickEvent(event: SDKEvent): boolean {
  return (
    (event.EventDataType === MESSAGE_TYPE_PAGE_EVENT && event.EventName === AUTO_BUTTON_EVENT_NAME) ||
    String(event.EventAttributes?.[AUTO_BUTTON_ATTRIBUTE]) === 'true'
  );
}

function isConfiguredTriggerEvent(configEntry: PreselectionConfigEntry, event: SDKEvent): boolean {
  return (
    event.EventDataType === MESSAGE_TYPE_PAGE_EVENT &&
    isString(event.EventName) &&
    !isAutoButtonClickEvent(event) &&
    (configEntry.triggerEventNames ?? []).includes(event.EventName)
  );
}

// Names what fired a speculative call and on which configured route, as '<kind>|<pathname>'.
// The persistence deny list keeps it off every later call.
export const PRESELECT_TRIGGER_ATTRIBUTE = 'rokt.preselecttrigger';

// Dispatch option naming the attribute key filled from the page form and the user it was read for, as
// { key, mpid }. The kit sends that value on the speculative call only, for that user, and never keeps it.
export const PRESELECT_FORM_EMAIL_OPTION = 'preselectFormEmail';

type PreselectTriggerKind = 'pageview' | 'pathname' | 'event' | 'recovered' | IntentTriggerKind;

function describeTrigger(kind: PreselectTriggerKind, configEntry: PreselectionConfigEntry): string {
  return `${kind}|${configEntry.pathname}`;
}

export function findPreselectionConfig(
  accountId: string | null | undefined,
  pathname: string,
): PreselectionConfigEntry | undefined {
  if (!accountId) {
    return undefined;
  }

  return getPreselectionEntries(accountId).find((entry) => pathnameMatches(entry.pathname, pathname));
}

export function findPreselectionConfigByIdentifier(
  accountId: string | null | undefined,
  identifier: unknown,
): PreselectionConfigEntry | undefined {
  if (!accountId || !isString(identifier)) {
    return undefined;
  }

  return getPreselectionEntries(accountId).find((entry) => entry.targetPageIdentifier === identifier);
}

export function applyPreselectAttributeOverrides(
  attributes: Record<string, unknown>,
  overrides: Record<string, string> | undefined,
): Record<string, unknown> {
  if (!overrides) {
    return attributes;
  }

  const overriddenKeys = new Set(Object.keys(overrides).map((key) => key.toLowerCase()));
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (!overriddenKeys.has(key.toLowerCase())) {
      result[key] = value;
    }
  }
  return { ...result, ...overrides };
}

export function getPreselectCacheMatchKeys(configEntry: PreselectionConfigEntry): string[] {
  const overrideKeys = Object.keys(configEntry.preselectAttributeOverrides ?? {});
  return [...configEntry.attributeKeys, ...overrideKeys.filter((key) => !configEntry.attributeKeys.includes(key))];
}

export function hasPreselectionConfigForAccount(accountId: string | null | undefined): boolean {
  if (!accountId) {
    return false;
  }

  return getPreselectionEntries(accountId).length > 0;
}

export function maybeFirePreselectForPathname(
  state: PreselectState,
  host: PreselectHost,
  pathname: string = window.location.pathname,
): void {
  // A page view queued or held for this path replays with its own event attributes, so the
  // pathname attempt yields to it rather than firing first.
  if (state.pending.some((entry) => entry.pathname === pathname && !isPathnameTriggerEvent(entry.event))) {
    return;
  }
  const scheduled = state.scheduledDispatch;
  if (scheduled && scheduled.pathname === pathname && !isPathnameTriggerEvent(scheduled.event)) {
    return;
  }

  maybeFirePreselect(state, host, pathnameTriggerEvent, pathname);
}

// Cheap account-level check so the kit skips building a host for every unrelated custom event.
export function isPreselectTriggerEventName(accountId: string | null | undefined, eventName: unknown): boolean {
  if (!accountId || !isString(eventName)) {
    return false;
  }

  return getPreselectionEntries(accountId).some((entry) => (entry.triggerEventNames ?? []).includes(eventName));
}

function isPageViewTrigger(event: SDKEvent): boolean {
  return (
    !isPathnameTriggerEvent(event) && !isIntentTriggerEvent(event) && event.EventDataType !== MESSAGE_TYPE_PAGE_EVENT
  );
}

function hasWaitingPageView(state: PreselectState, pathname: string): boolean {
  const scheduled = state.scheduledDispatch;
  if (scheduled && scheduled.pathname === pathname && isPageViewTrigger(scheduled.event)) {
    return true;
  }
  return state.pending.some((entry) => entry.pathname === pathname && isPageViewTrigger(entry.event));
}

// What the event would meet in resolveAndDispatch and fireDispatch, read without side effects:
// it sends now, waits in the queue for a gate or an attribute, or is skipped as active.
function getEventDispatchOutcome(
  host: PreselectHost,
  event: SDKEvent,
  configEntry: PreselectionConfigEntry,
  pathname: string,
): 'now' | 'waits' | 'skipped' {
  if (!host.isKitReady() || !host.isPreselectionEnabled() || !passesIdentityGate(host, configEntry)) {
    return 'waits';
  }
  const { collected, missingKeys } = collectAttributes(host, event, configEntry);
  if (missingKeys.length > 0) {
    return 'waits';
  }

  // fireDispatch skips an event while a record an event wrote is active, or when the active
  // record already carries these attributes.
  const accountId = host.accountId || '';
  const active = getActivePreselect(buildActivePreselectFieldKey(accountId, stripTrailingSlash(pathname)));
  if (!active) {
    return 'now';
  }
  const attributesDigest = getAttributesDigest(accountId, configEntry.targetPageIdentifier, collected);
  const isSkipped =
    active.byEvent || (attributesDigest !== undefined && attributesDigest === active.attributesDigest);
  return isSkipped ? 'skipped' : 'now';
}

// An event dispatching now supersedes whatever was queued for its route, so a later flush cannot
// replay that entry, or its stored copy, as a second dispatch.
function dropQueuedForRoute(state: PreselectState, host: PreselectHost, pathname: string): void {
  state.pending = state.pending.filter((entry) => entry.pathname !== pathname);
  const persisted = host.accountId ? getPendingPreselect(host.accountId) : null;
  if (host.accountId && persisted && persisted.pathname === pathname) {
    clearPendingPreselect(host.accountId);
  }
}

// Only a configured event on the entry's own route reaches maybeFirePreselect, so an unrelated
// custom event never cancels a held pageview dispatch. A page view held or queued for the route
// keeps its place unless the event can dispatch now, so an event missing a required attribute
// never leaves the route with nothing to send. An event skipped as active sends nothing at all,
// so it also leaves a held pathname trigger in place.
export function maybeFirePreselectForEvent(
  state: PreselectState,
  host: PreselectHost,
  event: SDKEvent,
  pathname: string = window.location.pathname,
): void {
  const configEntry = findPreselectionConfig(host.accountId, pathname);
  if (!configEntry || !isConfiguredTriggerEvent(configEntry, event)) {
    return;
  }

  const outcome = getEventDispatchOutcome(host, event, configEntry, pathname);
  if (outcome === 'now') {
    dropQueuedForRoute(state, host, pathname);
  } else if (
    hasWaitingPageView(state, pathname) ||
    (outcome === 'skipped' && state.scheduledDispatch?.pathname === pathname)
  ) {
    return;
  }

  maybeFirePreselect(state, host, event, pathname);
}

export function isPreselectAttributeKey(accountId: string | null | undefined, key: string): boolean {
  if (!accountId) {
    return false;
  }

  return getPreselectionEntries(accountId).some((entry) => entry.attributeKeys.includes(key));
}

export interface PendingPreselectDispatch {
  intentSeen?: IntentTriggerKind;
  event: SDKEvent;
  pathname: string;
  // isPreselectionEnabled() reads the launcher, so nothing raised before it attaches can know
  // whether this session is in the rollout. Reporting from that window would count the whole
  // eligible population rather than the enabled cohort.
  storedDiagnostics?: DiagnosticLogEntry[];
  // Set only when a held dispatch requeues, so its replay can never run under another user.
  triggeringUserId?: string | null;
  // When the trigger first fired, so a replay holds only for what is left of dispatchDelayMs.
  triggeredAt?: number;
  // 'intent': the account's checkout intent is active, so the dispatch waits for the shopper's
  // confirm click instead of dispatchDelayMs.
  waitingFor: 'identity' | 'attribute' | 'launcher' | 'intent';
  // Whether this wait for the confirm click has been reported; the first chance may come before
  // the launcher can report it.
  awaitingIntentLogged?: boolean;
}

export interface PreselectState {
  pending: PendingPreselectDispatch[];
  lastResolvedPageView?: {
    accountId: string | null;
    pathname: string;
    // Object identity separates route visits even when their timestamps match.
    route: (typeof intentPathHistory)[number] | undefined;
    userId: string | null;
    identifier: string;
    attributeKeys: string[];
  };
  dispatchTimer?: ReturnType<typeof setTimeout>;
  scheduledDispatch?: {
    event: SDKEvent;
    pathname: string;
    heldAt: number;
    heldForUserId: string | null;
    triggeredAt: number;
  };
}

export function createPreselectState(): PreselectState {
  return { pending: [] };
}

// Cancels the timer and returns its held dispatch so the caller can choose whether to release it.
export function cancelScheduledDispatch(state: PreselectState): PreselectState['scheduledDispatch'] {
  if (state.dispatchTimer === undefined) {
    return undefined;
  }
  const cancelled = state.scheduledDispatch;
  clearTimeout(state.dispatchTimer);
  state.dispatchTimer = undefined;
  state.scheduledDispatch = undefined;
  return cancelled;
}

function earliestTime(first: number | undefined, second: number | undefined): number | undefined {
  if (first === undefined) {
    return second;
  }
  return second === undefined ? first : Math.min(first, second);
}

// Only a configured trigger event reaches the queue as a page event, so the type alone ranks it.
// An event outranks a page view, which outranks the attribute-less pathname trigger.
function getPendingPriority(event: SDKEvent): number {
  if (isPathnameTriggerEvent(event)) {
    return 0;
  }
  return isIntentTriggerEvent(event) || event.EventDataType === MESSAGE_TYPE_PAGE_EVENT ? 2 : 1;
}

function hasUnresolvedAttributes(host: PreselectHost, entry: PendingPreselectDispatch): boolean {
  const configEntry = findPreselectionConfig(host.accountId, entry.pathname);
  return !!configEntry && collectAttributes(host, entry.event, configEntry).missingKeys.length > 0;
}

// A lower-priority trigger never displaces a higher one queued for the same route, except a
// page view over an event whose required attributes do not resolve, so the route keeps the
// page view's attributes as it would with no event configured.
function yieldsToQueued(state: PreselectState, host: PreselectHost, event: SDKEvent, pathname: string): boolean {
  const existing = state.pending.find((entry) => entry.pathname === pathname);
  return (
    !!existing &&
    getPendingPriority(event) < getPendingPriority(existing.event) &&
    !(isPageViewTrigger(event) && hasUnresolvedAttributes(host, existing))
  );
}

// Replace rather than accumulate per pathname, so a page that never gets the required
// attribute doesn't grow state.pending without bound across repeat pageviews.
function enqueuePending(state: PreselectState, host: PreselectHost, dispatch: PendingPreselectDispatch): void {
  const existingIndex = state.pending.findIndex((entry) => entry.pathname === dispatch.pathname);
  if (existingIndex >= 0) {
    if (yieldsToQueued(state, host, dispatch.event, dispatch.pathname)) {
      return;
    }
    const existing = state.pending[existingIndex];

    // Keep the earliest trigger time, so a requeue never restarts the hold.
    state.pending[existingIndex] = {
      ...dispatch,
      triggeredAt: earliestTime(existing.triggeredAt, dispatch.triggeredAt),
      intentSeen: dispatch.intentSeen ?? existing.intentSeen ?? intentKindOf(existing.event),
    };
    return;
  }
  state.pending.push(dispatch);
}

export interface PreselectHost {
  accountId: string | null;
  filteredUser: IMParticleUser | null | undefined;
  userAttributes: Record<string, unknown>;
  isKitReady(): boolean;
  isPreselectionEnabled(): boolean;
  getEventAttributeValue(event: SDKEvent, key: string): unknown;
  logPlacementDiagnostic(entry: DiagnosticLogEntry | null | undefined): void;
  log(entry: DiagnosticLogEntry | null | undefined): void;
  selectPlacements(options: Record<string, unknown>): unknown;
  isIntentPrivacyAllowed?(): boolean;
  // True while the core SDK sends this kit checkout intent signals: the workspace has auto button
  // tracking on and no opt-out or privacy option suppresses them.
  isCheckoutIntentActive?(): boolean;
  getCurrentUser?(): IMParticleUser | null | undefined;
  // Returns a host built from the kit's state now, for work that runs after this one was built.
  getCurrentHost?(): PreselectHost;
  isTargetingDisabled?(): boolean;
  // False once the user opts out or consent drops the kit. The page form is never read unless true.
  isForwardingAllowed?(): boolean;
  // True when this connection filters out the Email identity or the identity mapped to the hashed email,
  // so the form must not supply one.
  isEmailIdentityFiltered?(): boolean;
  // The filtered user's identities keyed by the name selectPlacements sends them under.
  getUserIdentities?(): Record<string, string>;
  mappedEmailSha256Key?: string;
}

// Type names only: the values are shopper PII and these feed diagnostics sent over the network.
function getIdentityTypes(user: IMParticleUser | null | undefined): string[] {
  if (!user?.getUserIdentities) {
    return [];
  }

  const userIdentities: IUserIdentities | null = user.getUserIdentities().userIdentities;
  if (!userIdentities) {
    return [];
  }

  return Object.keys(userIdentities)
    .filter((key) => {
      const value = userIdentities[key as keyof IUserIdentities];
      return isString(value) && value.length > 0;
    })
    .sort();
}

function hasValidIdentity(filteredUser: IMParticleUser | null | undefined): boolean {
  return getIdentityTypes(filteredUser).length > 0;
}

// Many partners identify a guest only after the order, so the email a guest types on the trigger
// page is the only one there is in time. It fills an unresolved `email` key, nothing else.
// Some checkout forms mark the email field type="text", so any text or email input is a candidate,
// as is one marked autocomplete="email"; hidden and password inputs never are. Only a candidate the
// shopper typed into or autofilled is read, and only a value shaped like an email counts.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Candidates whose latest input or change event was trusted: the shopper typed into or autofilled them. A
// field the shopper never touched is never read, and one a script later changes drops out when that change
// fires an event; a silent script write after the shopper's last edit is not seen. Holds elements, never values.
const shopperInputs = new WeakSet<HTMLInputElement>();

// The document and the field each hear one event, and a capture handler between them can overwrite the field and
// announce it. Each event decides once, so the shopper's event can't record again a field that announcement dropped.
const decidedEvents = new WeakSet<Event>();

// `type` reads "text" for a missing or unknown type attribute.
function isEmailCandidate(target: EventTarget | null): target is HTMLInputElement {
  if (!(target instanceof HTMLInputElement)) return false;
  const type = target.type;
  return (
    type === 'text' ||
    type === 'email' ||
    (target.getAttribute('autocomplete') === 'email' && type !== 'hidden' && type !== 'password')
  );
}

// Records an input on a trusted input or change event while it is a candidate, and drops it on any other,
// whatever its type then. Reads no value.
export function recordShopperInput(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || decidedEvents.has(event)) return;
  decidedEvents.add(event);
  if (event.isTrusted === true && isEmailCandidate(target)) {
    shopperInputs.add(target);
    // The field hears its own events even while detached from the page, where the document listener can't.
    target.addEventListener('input', recordShopperInput, true);
    target.addEventListener('change', recordShopperInput, true);
  } else {
    shopperInputs.delete(target);
  }
}

// A change on an explicit email input, or on a text input that now holds an email.
function isEmailInput(target: EventTarget | null): boolean {
  return (
    isEmailCandidate(target) &&
    (target.type === 'email' ||
      target.getAttribute('autocomplete') === 'email' ||
      EMAIL_PATTERN.test(target.value.trim()))
  );
}

function findEmailAttributeKey(configEntry: PreselectionConfigEntry): string | undefined {
  return configEntry.attributeKeys.find((key) => key.toLowerCase() === 'email');
}

// The one email across the candidates on the page that the shopper typed into or autofilled, trimmed and
// otherwise as typed. Inputs differing only in case or spacing (email and confirm email) count as one; two
// different emails, such as a gift recipient's beside the shopper's, are ambiguous and read nothing.
function readFormEmail(): string | undefined {
  const emails = new Map<string, string>();
  document.querySelectorAll('input').forEach((input) => {
    if (!shopperInputs.has(input) || !isEmailCandidate(input)) return;
    const value = input.value.trim();
    if (EMAIL_PATTERN.test(value) && !emails.has(value.toLowerCase())) {
      emails.set(value.toLowerCase(), value);
    }
  });
  return emails.size === 1 ? emails.values().next().value : undefined;
}

// Whether the partner supplies the shopper's email anywhere, including on the unfiltered user: an email
// filtered from this connection is one the partner chose not to share, so the form must not stand in.
// A hashed email (emailsha256, or the identity mapped to it) counts, and keys match in any casing.
export function hasPartnerEmail(
  host: PreselectHost,
  emailKey: string,
  eventAttributes: Record<string, unknown> = {},
): boolean {
  const emailKeys = new Set(
    [emailKey, 'emailsha256', host.mappedEmailSha256Key].filter(isString).map((key) => key.toLowerCase()),
  );
  const currentUser = host.getCurrentUser?.();
  const sources: Array<Record<string, unknown>> = [
    eventAttributes,
    host.userAttributes,
    host.filteredUser?.getAllUserAttributes?.() ?? {},
    host.getUserIdentities?.() ?? {},
    currentUser?.getAllUserAttributes?.() ?? {},
    (currentUser?.getUserIdentities?.().userIdentities as Record<string, unknown> | undefined) ?? {},
  ];
  return sources.some((source) =>
    Object.keys(source).some((key) => emailKeys.has(key.toLowerCase()) && !isEmpty(readOwnValue(source, key))),
  );
}

// Whether the form may be read for this entry now, decided before any input value is touched: an
// opted-in entry on its own route, no partner email anywhere, and the user has not opted out, withdrawn
// consent, disabled targeting or asked not to share or sell.
function mayReadFormEmail(
  host: PreselectHost,
  configEntry: PreselectionConfigEntry,
  emailKey: string,
  eventAttributes: Record<string, unknown> = {},
): boolean {
  return (
    configEntry.readEmailInput === true &&
    pathnameMatches(configEntry.pathname, window.location.pathname) &&
    host.isForwardingAllowed?.() === true &&
    host.isIntentPrivacyAllowed?.() !== false &&
    host.isTargetingDisabled?.() !== true &&
    host.isEmailIdentityFiltered?.() !== true &&
    !hasPartnerEmail(host, emailKey, eventAttributes)
  );
}

// The change listener's test. A dispatch queued on this route must be one the form may fill, judged with
// its own event as the read is, before the changed field's value is read; then the shopper must have
// changed an email input.
export function isReadableFormEmailChange(state: PreselectState, host: PreselectHost, event: Event): boolean {
  const pathname = window.location.pathname;
  const configEntry = findPreselectionConfig(host.accountId, pathname);
  const emailKey = configEntry && findEmailAttributeKey(configEntry);
  return (
    !!emailKey &&
    state.pending.some(
      (entry) =>
        entry.pathname === pathname && mayReadFormEmail(host, configEntry, emailKey, entry.event.EventAttributes ?? {}),
    ) &&
    event.isTrusted === true &&
    isEmailInput(event.target)
  );
}

// Fills an unresolved email key from the form and returns that key, when the form may be read.
function fillEmailFromForm(
  host: PreselectHost,
  configEntry: PreselectionConfigEntry,
  collected: Record<string, unknown>,
  event: SDKEvent,
): string | undefined {
  const emailKey = findEmailAttributeKey(configEntry);
  if (
    !emailKey ||
    !isEmpty(readOwnValue(collected, emailKey)) ||
    !mayReadFormEmail(host, configEntry, emailKey, event.EventAttributes ?? {})
  ) {
    return undefined;
  }
  const email = readFormEmail();
  if (!email) {
    return undefined;
  }
  collected[emailKey] = email;
  return emailKey;
}

// An opted-in entry requires email, so its guests pass the identity gate and wait on the email itself
// (missing_attribute:email) until a partner source or the form supplies one.
function passesIdentityGate(host: PreselectHost, configEntry: PreselectionConfigEntry): boolean {
  const emailKey = findEmailAttributeKey(configEntry);
  return (
    hasValidIdentity(host.filteredUser) ||
    (configEntry.readEmailInput === true &&
      !!emailKey &&
      getMissingRequiredAttributeKeys(configEntry, {}).includes(emailKey))
  );
}

export function hasEmailInputEntry(accountId: string | null | undefined): boolean {
  return !!accountId && getPreselectionEntries(accountId).some((entry) => entry.readEmailInput === true);
}

function formatIdentityTypes(types: string[]): string {
  return types.length > 0 ? types.join(',') : 'none';
}

// Stable per-user id, used to bind a persisted record to the user who was signed in when it
// was written so recovery can't dispatch one user's attributes under a different one.
function getUserId(filteredUser: IMParticleUser | null | undefined): string | null {
  const mpid = filteredUser?.getMPID?.();
  return mpid == null ? null : String(mpid);
}

function describeMissingIdentity(host: PreselectHost, configEntry: PreselectionConfigEntry): PreselectDiagnosticDetails {
  const kitTypes = getIdentityTypes(host.filteredUser);
  const currentUser = host.getCurrentUser?.();
  const currentTypes = getIdentityTypes(currentUser);
  const kitUserId = getUserId(host.filteredUser);
  const currentUserId = getUserId(currentUser);

  const identityAttributeKeys = [...(configEntry.identityKeys ?? []), 'email', 'emailsha256'];
  if (host.mappedEmailSha256Key) {
    identityAttributeKeys.push(host.mappedEmailSha256Key);
  }
  const normalizedIdentityKeys = new Set(identityAttributeKeys.map((key) => key.toLowerCase()));
  const liveUserAttributes = currentUser?.getAllUserAttributes?.() ?? {};
  const identityAttributePresent = [host.userAttributes, liveUserAttributes].some((attributes) =>
    Object.entries(attributes).some(
      ([key, value]) => normalizedIdentityKeys.has(key.toLowerCase()) && isString(value) && value.length > 0,
    ),
  );

  let identityReason = 'no_identities';
  if (!host.filteredUser) {
    identityReason = 'no_filtered_user';
  } else if (currentUserId !== null && kitUserId !== currentUserId) {
    identityReason = 'mpid_mismatch';
  } else if (currentTypes.length > 0) {
    identityReason = 'kit_user_lacks_identities';
  }

  return {
    identity_reason: identityReason,
    kit_identity_types: formatIdentityTypes(kitTypes),
    current_identity_types: formatIdentityTypes(currentTypes),
    mpid_match: currentUserId === null ? 'unknown' : kitUserId === currentUserId,
    identity_attribute_present: identityAttributePresent,
  };
}

function getMissingRequiredAttributeKeys(
  configEntry: PreselectionConfigEntry,
  attributes: Record<string, unknown>,
): string[] {
  const optionalKeys = new Set((configEntry.optionalAttributeKeys ?? []).map((key) => key.toLowerCase()));
  return configEntry.attributeKeys.filter(
    (key) => !optionalKeys.has(key.toLowerCase()) && isEmpty(readOwnValue(attributes, key)),
  );
}

function collectAttributes(
  host: PreselectHost,
  event: SDKEvent,
  configEntry: PreselectionConfigEntry,
): { collected: Record<string, unknown>; missingKeys: string[]; formEmailKey?: string } {
  const livePersistedAttributes = host.filteredUser?.getAllUserAttributes?.() || {};

  const identityKeys = new Set(configEntry.identityKeys ?? []);
  let userIdentities: Record<string, string> | undefined;

  const collected: Record<string, unknown> = {};
  for (const key of configEntry.attributeKeys) {
    const eventValue = host.getEventAttributeValue(event, key);
    const cachedValue = readOwnValue(host.userAttributes, key);
    let value = !isEmpty(eventValue)
      ? eventValue
      : !isEmpty(cachedValue)
        ? cachedValue
        : readOwnValue(livePersistedAttributes, key);
    if (isEmpty(value) && identityKeys.has(key)) {
      if (!userIdentities) {
        userIdentities = host.getUserIdentities?.() ?? {};
      }
      const identityValue = readOwnValue(userIdentities, key);
      value = isString(identityValue) && identityValue !== '' ? identityValue : undefined;
    }
    if (isEmpty(value)) {
      continue;
    }
    collected[key] = value;
  }

  const formEmailKey = fillEmailFromForm(host, configEntry, collected, event);

  return {
    collected,
    missingKeys: getMissingRequiredAttributeKeys(configEntry, collected),
    formEmailKey,
  };
}

export function dispatchPreselect(host: PreselectHost, options: Record<string, unknown>): void {
  const logFailure = (err: unknown): void => {
    // A call carrying a typed email logs no error text, which could echo what was submitted.
    const errMessage = options[PRESELECT_FORM_EMAIL_OPTION]
      ? 'redacted'
      : err instanceof Error
        ? err.message
        : String(err);
    host.log({
      message: `Rokt Kit: Preselect selectPlacements call failed: ${errMessage}`,
      code: 'PRESELECT_DISPATCH_FAILED',
    });
  };
  let selection: unknown;
  try {
    selection = host.selectPlacements(options);
  } catch (err) {
    logFailure(err);
    return;
  }
  void Promise.resolve(selection).catch(logFailure);
}

function getAttributesDigest(
  accountId: string,
  identifier: string,
  attributes: Record<string, unknown>,
): number | undefined {
  try {
    return djb2(
      JSON.stringify(
        applyPreselectAttributeOverrides(
          attributes,
          findPreselectionConfigByIdentifier(accountId, identifier)?.preselectAttributeOverrides,
        ),
      ),
    );
  } catch {
    // Attributes JSON.stringify rejects (a BigInt, a circular value) skip the dedupe instead:
    // nothing between here and the partner's logPageView call would catch the throw.
    return undefined;
  }
}

// activeRecordScope keys the active-preselect dedupe cache. For a live fire this is the
// current pathname (they're the same page by construction); for a recovered fire it must
// NOT be the source pathname, since a recovered fire can happen from any page — stamping
// the source checkout path there would block the next live fire on that same path.
// Returns true when these attributes are the active preselection afterwards: dispatched now, or
// already active under the same digest.
function fireDispatch(
  host: PreselectHost,
  accountId: string,
  activeRecordScope: string,
  identifier: string,
  attributes: Record<string, unknown>,
  reason: string,
  trigger: string,
  // An event trigger dispatches once per active period an event started, even when the attributes
  // changed. A record a page view wrote does not hold it off.
  skipWhileActive = false,
  intent = false,
  byEvent = skipWhileActive,
  formEmailKey?: string,
): boolean {
  // Checked here, where every live, replayed and recovered dispatch converges, so no entry
  // point can bypass a noTargeting opt-out, a user opt-out or a consent change, and nothing is recorded.
  if (host.isTargetingDisabled?.() || host.isForwardingAllowed?.() === false) {
    return false;
  }

  if (intent && host.isIntentPrivacyAllowed?.() === false) return false;
  const activePreselectKey = buildActivePreselectFieldKey(accountId, activeRecordScope);
  if (skipWhileActive && getActivePreselect(activePreselectKey)?.byEvent) {
    host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('skipped', 'active_preselection'));
    return false;
  }

  const attributesDigest = getAttributesDigest(accountId, identifier, attributes);
  if (attributesDigest !== undefined) {
    if (getActivePreselect(activePreselectKey)?.attributesDigest === attributesDigest) {
      host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('skipped', 'active_preselection'));
      return true;
    }
    setActivePreselect(
      activePreselectKey,
      attributesDigest,
      byEvent || (intent && getActivePreselect(activePreselectKey)?.byEvent === true),
    );
  }

  host.logPlacementDiagnostic(
    buildPreselectDiagnosticLogEntry('fired', reason, {
      identity_types: formatIdentityTypes(getIdentityTypes(host.filteredUser)),
      ...(formEmailKey ? { email_source: 'input' } : {}),
    }),
  );
  recordPreselectFired(accountId, identifier);
  // Added after the digest, so the trigger kind never splits the dedupe above.
  dispatchPreselect(host, {
    attributes: { ...attributes, [PRESELECT_TRIGGER_ATTRIBUTE]: trigger },
    preselect: true,
    identifier,
    omitUrl: true,
    ...(formEmailKey
      ? { [PRESELECT_FORM_EMAIL_OPTION]: { key: formEmailKey, mpid: getUserId(host.filteredUser) } }
      : {}),
  });
  return true;
}

// Recovers a preselect attempt that resolved but couldn't dispatch before the page that
// queued it went away. Independent of the current pathname on purpose: that's the case
// being recovered (checkout to its confirmation page), not a reason to discard it. Only
// fires for the same user who was signed in when it was persisted.
export function maybeFirePersistedPreselect(state: PreselectState, host: PreselectHost): void {
  if (!host.accountId || !host.isKitReady()) {
    return;
  }

  const persisted = getPendingPreselect(host.accountId);
  if (!persisted) {
    return;
  }

  // A full navigation is what wipes state.pending; if this JS instance's own in-memory
  // queue still has an entry for the same pathname, this is a same-instance SPA route
  // change instead, and that entry's own pathname check already owns the outcome here.
  if (state.pending.some((entry) => entry.pathname === persisted.pathname)) {
    clearPendingPreselect(host.accountId);
    return;
  }

  if (!host.isPreselectionEnabled()) {
    clearPendingPreselect(host.accountId);
    return;
  }

  if (!hasValidIdentity(host.filteredUser)) {
    // Identity can still be resolving right after the launcher attaches; leave the record
    // in place so a later flush (e.g. onUserIdentified) gets another shot at it.
    return;
  }

  clearPendingPreselect(host.accountId);

  if (getUserId(host.filteredUser) !== persisted.mpid) {
    return;
  }

  const configEntry = findPreselectionConfig(host.accountId, persisted.pathname);
  if (!configEntry || configEntry.targetPageIdentifier !== persisted.identifier) {
    return;
  }

  // A page view saved before checkout intent applied must not fire now without the click.
  if (!persisted.byEvent && awaitsCheckoutIntent(host, configEntry)) {
    host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('missed', 'recovery_awaits_intent'));
    return;
  }

  const attributes = removeSelectPlacementsAttributePersistenceDeniedAttributes(persisted.attributes);
  const missingKeys = getMissingRequiredAttributeKeys(configEntry, attributes);
  if (missingKeys.length > 0) {
    for (const key of missingKeys) {
      host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('missed', `missing_persisted_attribute:${key}`));
    }
    return;
  }

  fireDispatch(
    host,
    host.accountId,
    persisted.identifier,
    persisted.identifier,
    attributes,
    'recovered',
    describeTrigger('recovered', configEntry),
  );
}

function isReportingDiagnostics(host: PreselectHost): boolean {
  return !host.isTargetingDisabled?.() && host.isKitReady() && host.isPreselectionEnabled();
}

function sinceTriggerDetail(triggeredAt?: number): PreselectDiagnosticDetails {
  return triggeredAt === undefined ? {} : { since_trigger_ms: Date.now() - triggeredAt };
}

function logLeftTriggerPath(
  host: PreselectHost,
  entry: Pick<PendingPreselectDispatch, 'waitingFor' | 'triggeredAt'>,
): void {
  if (!isReportingDiagnostics(host)) {
    return;
  }
  host.logPlacementDiagnostic(
    buildPreselectDiagnosticLogEntry('missed', 'left_trigger_path', {
      waiting_for: entry.waitingFor,
      has_identity: hasValidIdentity(host.filteredUser),
      ...sinceTriggerDetail(entry.triggeredAt),
    }),
  );
}

export function maybeFirePreselect(
  state: PreselectState,
  host: PreselectHost,
  event: SDKEvent,
  pathname: string = window.location.pathname,
  triggeringUserId?: string | null,
  triggeredAt: number = Date.now(),
  intentSeen?: IntentTriggerKind,
): void {
  // Entries for paths the shopper left are dropped as the flush drops them, so none can lend its
  // trigger time to a return visit or replay over that visit's hold. A dropped entry's stored copy
  // is cleared with it, as the flush clears it, so a route change cannot fire it as recovered.
  const leftEntries = state.pending.filter((entry) => entry.pathname !== pathname);
  if (leftEntries.length > 0) {
    const persisted = host.accountId ? getPendingPreselect(host.accountId) : null;
    if (host.accountId && persisted && leftEntries.some((entry) => entry.pathname === persisted.pathname)) {
      clearPendingPreselect(host.accountId);
    }
    leftEntries.forEach((entry) => logLeftTriggerPath(host, entry));
    state.pending = state.pending.filter((entry) => entry.pathname === pathname);
  }

  const cancelledHold = cancelScheduledDispatch(state);
  // On a route change the pathname trigger holds just before its page view holds the same path
  // again. That swap logs nothing, so the cancel line waits to see whether a new hold starts.
  const replacesPathnameHold =
    cancelledHold !== undefined && cancelledHold.pathname === pathname && isPathnameTriggerEvent(cancelledHold.event);
  if (cancelledHold && !replacesPathnameHold) {
    const heldEntry = findPreselectionConfig(host.accountId, cancelledHold.pathname);
    if (
      stripTrailingSlash(cancelledHold.pathname) !== stripTrailingSlash(pathname) &&
      heldEntry?.releaseHoldOnRouteChange
    ) {
      releaseHeldDispatch(state, host, cancelledHold, 'hold_released_on_route_change');
      // A failed release can requeue through the timer path. The shopper has already left,
      // so discard that work before it can replay an old event on a return visit.
      state.pending = state.pending.filter((entry) => {
        if (entry.pathname === cancelledHold.pathname) {
          logLeftTriggerPath(host, entry);
          return false;
        }
        return true;
      });
    } else {
      logCancelledHold(host, cancelledHold, pathname);
    }
  }

  holdOrFirePreselect(state, host, event, pathname, triggeringUserId, triggeredAt, replacesPathnameHold, intentSeen);

  if (replacesPathnameHold && state.scheduledDispatch === undefined) {
    logCancelledHold(host, cancelledHold, pathname);
  }
}

function logCancelledHold(
  host: PreselectHost,
  cancelledHold: NonNullable<PreselectState['scheduledDispatch']>,
  pathname: string,
): void {
  host.logPlacementDiagnostic(
    buildPreselectDiagnosticLogEntry('missed', 'hold_cancelled', {
      held_ms: Date.now() - cancelledHold.heldAt,
      same_path: cancelledHold.pathname === pathname,
    }),
  );
}

function holdOrFirePreselect(
  state: PreselectState,
  host: PreselectHost,
  event: SDKEvent,
  pathname: string,
  triggeringUserId: string | null | undefined,
  triggeredAt: number,
  replacesHold: boolean,
  intentSeen?: IntentTriggerKind,
): void {
  const queued = state.pending.find((entry) => stripTrailingSlash(entry.pathname) === stripTrailingSlash(pathname));
  intentSeen ??= intentKindOf(event) ?? queued?.intentSeen ?? intentKindOf(queued?.event);
  if (intentSeen && host.isIntentPrivacyAllowed?.() === false) return;
  // fireDispatch checks this too, but the not-ready branch below persists a snapshot before any
  // dispatch, and a replayed page view reaches it without passing the kit's own gates.
  if (host.isTargetingDisabled?.()) {
    return;
  }

  const configEntry = findPreselectionConfig(host.accountId, pathname);
  if (!configEntry) {
    return;
  }

  // Ahead of the not-ready branch on purpose: that branch persists a snapshot keyed to whoever
  // is signed in now, so a held dispatch replaying under a different user would write the first
  // user's attributes under the second. Only entries carrying an id are checked, so a
  // pageview-path entry still replays after sign-in, which is what the guest-checkout requeue is.
  if (triggeringUserId !== undefined && getUserId(host.filteredUser) !== triggeringUserId) {
    return;
  }

  // With checkout intent active, a page view or pathname trigger waits for the shopper's confirm
  // click instead of dispatchDelayMs, so no call goes out for a shopper who never commits. Ahead of
  // the not-ready branch, so nothing is stored for a recovered dispatch without the click either.
  // A configured trigger event still dispatches as before.
  if (!intentSeen && !isConfiguredTriggerEvent(configEntry, event) && awaitsCheckoutIntent(host, configEntry)) {
    const alreadyLogged = queued?.waitingFor === 'intent' && queued.awaitingIntentLogged === true;
    const canLog = host.isKitReady() && host.isPreselectionEnabled();
    enqueuePending(state, host, {
      event,
      pathname,
      // Bound to an identified shopper, as a timer hold is, so another user's click never sends
      // this page view's attributes. A guest stays unbound so signing in at checkout still fires.
      triggeringUserId:
        triggeringUserId ?? (hasValidIdentity(host.filteredUser) ? getUserId(host.filteredUser) : undefined),
      triggeredAt,
      waitingFor: 'intent',
      awaitingIntentLogged: alreadyLogged || canLog,
    });
    if (!alreadyLogged && canLog) {
      host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('held', 'awaiting_intent'));
    }
    // Recorded at the page view, so an arrival after a missed click still shows the trigger.
    if (canLog) recordTriggerForArrival(host, configEntry, event);
    return;
  }

  if (!host.isKitReady()) {
    // Decided before the snapshot below, so a trigger the queue keeps out never overwrites the
    // stored copy of the one it keeps.
    if (yieldsToQueued(state, host, event, pathname)) {
      return;
    }

    // The gate below reads the launcher, which does not exist yet, so "disabled" and "not yet
    // known" are indistinguishable here.
    const storedDiagnostics: DiagnosticLogEntry[] = [];

    // Not-ready is an infra-readiness race, not an attribute problem, so this usually
    // resolves. Snapshot it now so a full navigation away doesn't lose it with this page.
    // Deliberately left ahead of the gate: this has to survive a navigation that can happen
    // before the launcher ever attaches, so deferring it past the gate would defeat it.
    // Gating it needs the decision knowable pre-launcher, which is a Web SDK change.
    const mpid = getUserId(host.filteredUser);
    if (host.accountId && mpid && hasValidIdentity(host.filteredUser)) {
      const { collected, missingKeys, formEmailKey } = collectAttributes(host, event, configEntry);
      if (missingKeys.length === 0 && !formEmailKey) {
        // Deny-listed attributes may still resolve here (they're read from the raw event or
        // mParticle's live store, not just host.userAttributes), so strip them before this
        // snapshot sits in storage rather than going straight over the wire.
        const persistableAttributes = removeSelectPlacementsAttributePersistenceDeniedAttributes(collected);
        const byEvent = isConfiguredTriggerEvent(configEntry, event) || !!intentSeen;
        const wasPersisted = byEvent
          ? setPendingPreselect(
              host.accountId,
              pathname,
              configEntry.targetPageIdentifier,
              persistableAttributes,
              mpid,
              true,
            )
          : setPendingPreselect(host.accountId, pathname, configEntry.targetPageIdentifier, persistableAttributes, mpid);
        if (!wasPersisted) {
          storedDiagnostics.push(buildPreselectDiagnosticLogEntry('queued', 'persist_failed'));
        }
      }
    }

    enqueuePending(state, host, {
      event,
      pathname,
      storedDiagnostics,
      triggeringUserId,
      triggeredAt,
      waitingFor: 'launcher',
      intentSeen,
    });
    return;
  }

  if (!host.isPreselectionEnabled()) {
    return;
  }

  recordTriggerForArrival(host, configEntry, event);

  if (!passesIdentityGate(host, configEntry)) {
    host.logPlacementDiagnostic(
      buildPreselectDiagnosticLogEntry('missed', 'no_valid_identity', describeMissingIdentity(host, configEntry)),
    );
    // Guest checkout can hit this pageview before login; requeue for a later identification.
    enqueuePending(state, host, { event, pathname, triggeringUserId, triggeredAt, intentSeen, waitingFor: 'identity' });
    return;
  }

  if (
    configEntry.dispatchDelayMs !== undefined &&
    !isConfiguredTriggerEvent(configEntry, event) &&
    !isIntentTriggerEvent(event) &&
    !intentSeen
  ) {
    const heldForUserId = getUserId(host.filteredUser);
    const holdMs = Math.min(
      configEntry.dispatchDelayMs,
      Math.max(0, triggeredAt + configEntry.dispatchDelayMs - Date.now()),
    );
    state.scheduledDispatch = { event, pathname, heldAt: Date.now(), heldForUserId, triggeredAt };
    if (!replacesHold) {
      host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('held', 'dispatch_delay', { delay_ms: holdMs }));
    }
    state.dispatchTimer = setTimeout(() => {
      state.dispatchTimer = undefined;
      state.scheduledDispatch = undefined;
      dispatchAfterDelay(state, host.getCurrentHost?.() ?? host, event, pathname, heldForUserId, triggeredAt);
    }, holdMs);
    return;
  }

  resolveAndDispatch(
    state, host, event, pathname, configEntry, triggeringUserId, triggeredAt, undefined, intentSeen,
    intentSeen ? queued : undefined,
  );
}

// Marks the trigger page as seen for the arrival line, with whether an identity was present.
function recordTriggerForArrival(host: PreselectHost, configEntry: PreselectionConfigEntry, event: SDKEvent): void {
  if (!host.accountId) return;
  const emailKey = findEmailAttributeKey(configEntry);
  // Short-circuits, so the form is read only when neither the event nor the partner has an email.
  const hasGuestEmail =
    configEntry.readEmailInput === true &&
    !!emailKey &&
    (hasPartnerEmail(host, emailKey, event.EventAttributes ?? {}) ||
      fillEmailFromForm(host, configEntry, {}, event) !== undefined);
  recordPreselectTrigger(
    host.accountId,
    configEntry.targetPageIdentifier,
    hasValidIdentity(host.filteredUser) || hasGuestEmail,
  );
}

// Only while the core SDK can deliver the click: otherwise the entry keeps its dispatchDelayMs.
function awaitsCheckoutIntent(host: PreselectHost, configEntry: PreselectionConfigEntry): boolean {
  return (
    configEntry.intentTrigger !== 'observe' &&
    host.isCheckoutIntentActive?.() === true &&
    host.isIntentPrivacyAllowed?.() !== false
  );
}

function releaseHeldDispatch(
  state: PreselectState,
  host: PreselectHost,
  held: NonNullable<PreselectState['scheduledDispatch']>,
  reason: string,
  kindOverride?: IntentTriggerKind,
): void {
  dispatchAfterDelay(
    state,
    host.getCurrentHost?.() ?? host,
    held.event,
    held.pathname,
    held.heldForUserId,
    held.triggeredAt,
    reason,
    kindOverride,
  );
}

// The gates above ran when the delay started; identity, the launcher and the config can all
// change while it runs, so they are checked again against the kit's current state.
function dispatchAfterDelay(
  state: PreselectState,
  host: PreselectHost,
  event: SDKEvent,
  pathname: string,
  triggeringUserId: string | null,
  triggeredAt: number,
  reason?: string,
  intentSeen?: IntentTriggerKind,
): void {
  if (intentSeen && host.isIntentPrivacyAllowed?.() === false) return;
  const configEntry = findPreselectionConfig(host.accountId, pathname);
  if (!configEntry || host.isTargetingDisabled?.()) {
    return;
  }

  // Checkout intent can start applying while a delay runs. The page view then waits for the click
  // too, still bound to the shopper it was held for.
  if (
    !intentSeen &&
    !isConfiguredTriggerEvent(configEntry, event) &&
    !isIntentTriggerEvent(event) &&
    awaitsCheckoutIntent(host, configEntry)
  ) {
    const canLog = host.isKitReady() && host.isPreselectionEnabled();
    enqueuePending(state, host, {
      event,
      pathname,
      triggeringUserId,
      triggeredAt,
      waitingFor: 'intent',
      awaitingIntentLogged: canLog,
    });
    if (canLog) {
      host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('held', 'awaiting_intent'));
    }
    return;
  }

  if (!host.isKitReady()) {
    enqueuePending(state, host, { event, pathname, triggeringUserId, triggeredAt, intentSeen, waitingFor: 'launcher' });
    return;
  }

  if (!host.isPreselectionEnabled()) {
    return;
  }

  if (!passesIdentityGate(host, configEntry)) {
    host.logPlacementDiagnostic(
      buildPreselectDiagnosticLogEntry('missed', 'no_valid_identity', describeMissingIdentity(host, configEntry)),
    );
    enqueuePending(state, host, { event, pathname, triggeringUserId, triggeredAt, intentSeen, waitingFor: 'identity' });
    return;
  }

  // The event belongs to the user who triggered it; never pair it with someone else's attributes.
  if (getUserId(host.filteredUser) !== triggeringUserId) {
    return;
  }

  resolveAndDispatch(state, host, event, pathname, configEntry, triggeringUserId, triggeredAt, reason, intentSeen);
}

function resolveAndDispatch(
  state: PreselectState,
  host: PreselectHost,
  event: SDKEvent,
  pathname: string,
  configEntry: PreselectionConfigEntry,
  triggeringUserId: string | null | undefined,
  triggeredAt: number,
  reason?: string,
  intentSeen?: IntentTriggerKind,
  consumedPending?: PendingPreselectDispatch,
): void {
  if (intentSeen && host.isIntentPrivacyAllowed?.() === false) return;
  const { collected: collectedAttributes, missingKeys, formEmailKey } = collectAttributes(host, event, configEntry);
  const lastPageView = state.lastResolvedPageView;
  const route = intentPathHistory[intentPathHistory.length - 1];
  const normalizedPathname = stripTrailingSlash(pathname);
  // Keep the resolved page view or configured event when fresh intent loses any of its configured attributes.
  if (
    isIntentTriggerEvent(event) &&
    lastPageView &&
    lastPageView.accountId === host.accountId &&
    lastPageView.pathname === normalizedPathname &&
    lastPageView.route === route &&
    lastPageView.userId === getUserId(host.filteredUser) &&
    lastPageView.identifier === configEntry.targetPageIdentifier &&
    lastPageView.attributeKeys.some(
      (key) => configEntry.attributeKeys.includes(key) && isEmpty(readOwnValue(collectedAttributes, key)),
    )
  ) {
    return;
  }

  if (missingKeys.length > 0) {
    const identityTypes = getIdentityTypes(host.filteredUser);
    for (const key of missingKeys) {
      host.logPlacementDiagnostic(
        buildPreselectDiagnosticLogEntry('missed', `missing_attribute:${key}`, {
          identity_types: formatIdentityTypes(identityTypes),
          key_is_identity: identityTypes.some((type) => type.toLowerCase() === key.toLowerCase()),
        }),
      );
    }
    // Sites set these one at a time via setUserAttribute, often after this pageview fires;
    // requeue so the kit's setUserAttribute flush can pick it up once a key arrives.
    enqueuePending(state, host, {
      event,
      pathname,
      triggeringUserId,
      triggeredAt,
      intentSeen,
      waitingFor: 'attribute',
    });
    return;
  }

  if (consumedPending) state.pending = state.pending.filter((entry) => entry !== consumedPending);
  const isEventTrigger = isConfiguredTriggerEvent(configEntry, event);
  const intentKind = intentSeen ?? intentKindOf(event);
  const kind: PreselectTriggerKind =
    intentKind ?? (isEventTrigger ? 'event' : isPathnameTriggerEvent(event) ? 'pathname' : 'pageview');
  const isActive = fireDispatch(
    host,
    host.accountId || '',
    stripTrailingSlash(pathname),
    configEntry.targetPageIdentifier,
    collectedAttributes,
    reason ?? (intentKind ? 'intent' : isEventTrigger ? 'event_trigger' : 'fired'),
    describeTrigger(kind, configEntry),
    isEventTrigger && !intentKind,
    !!intentKind,
    isEventTrigger,
    formEmailKey,
  );
  // Only a dispatch whose attributes are now active guards later intent; a held-off repeat event must
  // not replace the record of the richer call it was held off by.
  if (
    isActive &&
    (configEntry.intentTrigger || firesOnCheckoutIntent(host, configEntry)) &&
    (isPageViewTrigger(event) || isEventTrigger)
  ) {
    state.lastResolvedPageView = {
      accountId: host.accountId,
      pathname: normalizedPathname,
      route,
      userId: getUserId(host.filteredUser),
      identifier: configEntry.targetPageIdentifier,
      attributeKeys: Object.keys(collectedAttributes),
    };
  }
}

export function flushPendingPreselectDispatches(
  state: PreselectState,
  host: PreselectHost,
  currentPathname: string = window.location.pathname,
): void {
  maybeFirePersistedPreselect(state, host);

  if (state.pending.length === 0) {
    return;
  }

  const pending = state.pending;
  state.pending = [];
  pending.forEach((entry) => {
    const { event, pathname, storedDiagnostics, triggeringUserId, triggeredAt, waitingFor, intentSeen } = entry;
    const isReporting = isReportingDiagnostics(host);
    const hasIdentity = hasValidIdentity(host.filteredUser);
    const sinceTrigger = sinceTriggerDetail(triggeredAt);

    if (isReporting && waitingFor === 'identity' && hasIdentity) {
      host.logPlacementDiagnostic(
        buildPreselectDiagnosticLogEntry('identity_arrived', 'pending_identity', {
          ...sinceTrigger,
          on_trigger_path: pathname === currentPathname,
        }),
      );
    }

    // Drop a stale entry rather than firing it against a route the user has left.
    if (pathname !== currentPathname) {
      logLeftTriggerPath(host, { waitingFor, triggeredAt });
      return;
    }

    // Still waiting for the confirm click: nothing else can release it, so it stays queued while
    // checkout intent applies. Once it no longer does, it replays below through the delay instead.
    if (waitingFor === 'intent' && !intentSeen) {
      const waitingEntry = findPreselectionConfig(host.accountId, pathname);
      if (waitingEntry && awaitsCheckoutIntent(host, waitingEntry)) {
        // A wait queued before the kit was ready has neither its log line nor its trigger yet.
        if (!entry.awaitingIntentLogged && host.isKitReady() && host.isPreselectionEnabled()) {
          host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('held', 'awaiting_intent'));
          recordTriggerForArrival(host, waitingEntry, event);
          entry.awaitingIntentLogged = true;
        }
        state.pending.push(entry);
        return;
      }
    }

    // A replay below rebuilds these from the same event, so dropping them unreported here is
    // safe as well as intended: a disabled session must not reach the funnel.
    if (isReporting) {
      storedDiagnostics?.forEach((entry) => host.logPlacementDiagnostic(entry));
    }

    // A hold running for this path started after this entry queued, so the entry yields to it
    // rather than cancelling it and replaying an older event and trigger time.
    if (state.scheduledDispatch?.pathname === pathname) {
      return;
    }

    maybeFirePreselect(state, host, event, pathname, triggeringUserId, triggeredAt, intentSeen);
  });
}

// Runs on the partner's own target-page call. Reports a tab that reaches the target page without
// having fired, which a full navigation away from the trigger page otherwise hides.
export function reportPreselectArrival(host: PreselectHost, identifier: unknown): void {
  if (!host.accountId || !isReportingDiagnostics(host)) {
    return;
  }

  const configEntry = findPreselectionConfigByIdentifier(host.accountId, identifier);
  if (!configEntry) {
    return;
  }

  const record = markPreselectArrival(host.accountId, configEntry.targetPageIdentifier);
  if (!record) {
    return;
  }

  // The stored intent is reported only while intent privacy still allows it, as it was captured.
  if (hasPreselectionIntentTrigger(host.accountId) && host.isIntentPrivacyAllowed?.() !== false) {
    host.logPlacementDiagnostic(
      buildPreselectDiagnosticLogEntry('arrived', 'intent_arrival', describeIntentBeforeArrival(record)),
    );
  }

  if (record.firedAt !== undefined) {
    return;
  }

  const triggerSeen = record.triggeredAt !== undefined;
  host.logPlacementDiagnostic(
    buildPreselectDiagnosticLogEntry('missed', 'arrival_without_fire', {
      trigger_seen: triggerSeen,
      identity_seen_on_trigger_path: record.identitySeenAt !== undefined,
      has_identity: hasValidIdentity(host.filteredUser),
      // Another tab's checkout caches its offers in that tab, so this arrival still misses. This tab's
      // own trigger counts too: the device marker can expire, be cleared by another tab or fail to save.
      trigger_seen_any_tab:
        triggerSeen || wasPreselectTriggeredInAnyTab(host.accountId, configEntry.targetPageIdentifier),
      ...sinceTriggerDetail(record.triggeredAt),
    }),
  );
}

function describeIntentBeforeArrival(record: PreselectArrivalRecord): PreselectDiagnosticDetails {
  const lead =
    record.intentAt === undefined || record.intentKind === undefined
      ? 'none'
      : bucketIntentLead(Date.now() - record.intentAt);
  return {
    intent_seen: lead === 'none' ? 'none' : record.intentKind!,
    lead,
    fired: record.firedAt !== undefined,
  };
}

const INTENT_LEAD_BUCKETS: Array<[number, string]> = [
  [1000, 'lt1s'],
  [2000, '1s_2s'],
  [5000, '2s_5s'],
  [10000, '5s_10s'],
  [20000, '10s_20s'],
  [60000, '20s_60s'],
  [300000, '60s_300s'],
  [INTENT_ARRIVAL_WINDOW_MS, '300s_1800s'],
];

// An intent from the future or older than INTENT_ARRIVAL_WINDOW_MS counts as none.
function bucketIntentLead(ms: number): string {
  if (ms < 0) {
    return 'none';
  }
  const bucket = INTENT_LEAD_BUCKETS.find(([upperBound]) => ms < upperBound);
  return bucket ? bucket[1] : 'none';
}
