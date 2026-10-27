import { IMParticleUser, SDKEvent } from '@mparticle/web-sdk/internal';
import type { IUserIdentities } from '@mparticle/web-sdk';

import { PRESELECTION_CONFIG, type PreselectionConfigEntry } from './preselectionConfig';
import { parsePreselectionConfigSetting } from './preselectionConfigSetting';
import {
  buildActivePreselectFieldKey,
  getActivePreselect,
  restoreActivePreselect,
  setActivePreselect,
  type ActivePreselectRecord,
} from './activePreselectStorage';
import { getPendingPreselect, setPendingPreselect, clearPendingPreselect } from './pendingPreselectStorage';
import {
  INTENT_ARRIVAL_WINDOW_MS,
  markPreselectArrival,
  recordPreselectFired,
  restorePreselectFired,
  wasPreselectFiredRecently,
  wasPreselectTriggeredRecently,
  recordPreselectIntent,
  recordPreselectNearMiss,
  recordPreselectPaymentPick,
  recordPreselectTrigger,
  wasPreselectTriggeredInAnyTab,
  type PreselectArrivalRecord,
  type PreselectFireMark,
  type PreselectIntentKind,
} from './preselectArrivalStorage';
import { isDevicePersistenceDisabled } from './storage';
import { removeSelectPlacementsAttributePersistenceDeniedAttributes } from './selectPlacementsAttributePersistence';
import {
  buildPreselectDiagnosticLogEntry,
  type DiagnosticLogEntry,
  type PreselectDiagnosticDetails,
} from './diagnosticTiming';
import {
  describeArrivalPayment,
  paymentFamilyFromClick,
  paymentFamilyFromPick,
  type PaymentFamily,
} from './paymentFamily';
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

// Diagnostics only, never a trigger: the trigger path in any casing, behind one leading segment
// (a locale prefix), or followed by more segments.
function nearlyMatches(configuredPathname: string, pathname: string): boolean {
  const configured = stripTrailingSlash(configuredPathname).toLowerCase();
  const segments = stripTrailingSlash(pathname).toLowerCase().split('/');
  const configuredLength = configured.split('/').length;
  return (
    pathnameMatches(configured, segments.join('/')) ||
    pathnameMatches(configured, ['', ...segments.slice(2)].join('/')) ||
    (segments.length > configuredLength &&
      pathnameMatches(configured, segments.slice(0, configuredLength).join('/')))
  );
}

// A pathname-driven fire has no page-view event behind it, so attribute resolution falls
// through to the user attributes collectAttributes already reads as its fallback.
const pathnameTriggerEvent = {} as SDKEvent;
const intentCommitTriggerEvent = {} as SDKEvent;
const intentWalletTriggerEvent = {} as SDKEvent;
const intentCartTriggerEvent = {} as SDKEvent;
const cartPageViewTriggerEvent = {} as SDKEvent;
type IntentTriggerKind = 'intent_commit' | 'intent_wallet' | 'intent_cart';
// What the core SDK hands the kit on a checkout intent: the kind, when the shopper acted, and from a
// newer core the rule that recognised it and the path it happened on.
export type PreselectIntentSignal = {
  kind: PreselectIntentKind;
  t: number;
  source?: string;
  pathname?: string;
};
// What a newer core SDK hands the kit when the shopper picks a payment method: the names of a payment
// radio's option, or the family of a payment frame they moved into. Only the family read from it is kept.
export type PreselectPaymentPickSignal = {
  t: number;
  pathname?: string;
  names?: readonly string[];
  family?: string;
};
const INTENT_KINDS: PreselectIntentKind[] = ['commit', 'wallet', 'checkout_step', 'frame', 'cart'];
const INTENT_SOURCES = ['vendor', 'label', 'brand', 'frame', 'submit', 'name', 'api'];
const MAX_INTENT_PATHNAME_LENGTH = 512;

// What a commit, wallet or cart click fires as, and the event that stands in for it.
function intentTriggerKind(kind: PreselectIntentKind): IntentTriggerKind {
  if (kind === 'commit') return 'intent_commit';
  return kind === 'cart' ? 'intent_cart' : 'intent_wallet';
}

function intentTriggerEvent(kind: IntentTriggerKind): SDKEvent {
  if (kind === 'intent_commit') return intentCommitTriggerEvent;
  return kind === 'intent_cart' ? intentCartTriggerEvent : intentWalletTriggerEvent;
}

// A signal delivered this soon after its click is live rather than replayed from before the kit attached.
const LIVE_INTENT_MS = 1_000;

function isLiveIntent(signal: PreselectIntentSignal): boolean {
  const age = Date.now() - signal.t;
  return age >= 0 && age < LIVE_INTENT_MS;
}

function getCartIntentEntries(accountId: string): PreselectionConfigEntry[] {
  return getPreselectionEntries(accountId).filter((entry) => entry.cartIntent === true);
}

function signalSource(signal: PreselectIntentSignal): string | undefined {
  return typeof signal.source === 'string' && INTENT_SOURCES.includes(signal.source) ? signal.source : undefined;
}

// Where a tap happened relative to the checkout: on an entry's page, after this tab saw an entry's
// trigger (the shopper left the checkout), or before any entry.
function intentRouteOutsideEntry(accountId: string): 'left' | 'before_entry' {
  const identifiers = new Set(getPreselectionEntries(accountId).map((entry) => entry.targetPageIdentifier));
  return [...identifiers].some((identifier) => wasPreselectTriggeredRecently(accountId, identifier))
    ? 'left'
    : 'before_entry';
}

function logObservedIntent(
  host: PreselectHost,
  signal: PreselectIntentSignal,
  route: 'entry' | 'left' | 'before_entry',
  visitKey: string,
  extra: PreselectDiagnosticDetails = {},
  // The line that ends a tap's wait for identity, so the tap's own line does not hide it.
  endsWait = false,
): void {
  const observedKey = `${visitKey}:${route}:${signal.kind}${endsWait ? ':wait' : ''}`;
  if (observedIntentKinds.has(observedKey)) return;
  observedIntentKinds.add(observedKey);
  const source = signalSource(signal);
  host.logPlacementDiagnostic(
    buildPreselectDiagnosticLogEntry('skipped', 'intent_observed', {
      intent_kind: signal.kind,
      intent_route: route,
      ...(source ? { intent_source: source } : {}),
      has_email: carriesEmail(host, {}),
      has_identity: hasValidIdentity(host.filteredUser),
      ...extra,
    }),
  );
}

// Logged in is mParticle's persisted identity state, not the site's sign-in: where email is a login identity,
// a returning guest whose email was once identified also counts.
function isLoggedIn(host: PreselectHost): boolean {
  const userId = getUserId(host.filteredUser);
  const currentUser = host.getCurrentUser?.();
  return userId !== null && getUserId(currentUser) === userId && currentUser?.isLoggedIn?.() === true;
}

// A tap off its entry's route fires that entry under the same identity, email and once-per-checkout gates: a cart
// click fires the account's one cartIntent entry, and a logged-in shopper's commit or wallet tap its one entry
// without cartIntent. A guest's wallet tap made with no identity waits for one (awaitIdentity). Any other guest
// tap, and a tap no entry or more than one entry could claim, is only observed; `cause` says why.
function fireOrObserveOffEntry(
  state: PreselectState,
  host: PreselectHost,
  signal: PreselectIntentSignal,
  clickPathname: string,
  visitKey: string,
  // Set when the guest who made a waiting wallet tap has since been identified.
  afterWait = false,
): void {
  const accountId = host.accountId!;
  const route = intentRouteOutsideEntry(accountId);
  const loggedIn = isLoggedIn(host);
  const observe = (cause?: string): void =>
    logObservedIntent(host, signal, route, visitKey, { logged_in: loggedIn, ...(cause ? { cause } : {}) }, afterWait);
  const isCart = signal.kind === 'cart';
  // A page can identify a guest while the wallet sheet is open, so a guest's wallet tap may fire once that happens.
  const waitsForIdentity = signal.kind === 'wallet' && !loggedIn && (afterWait || !hasValidIdentity(host.filteredUser));
  if (!isCart && !loggedIn) {
    // The tap's own line, as for any guest tap; one that goes on to wait logs again when the wait ends.
    if (!afterWait) observe();
    if (!waitsForIdentity) return;
  }
  // A cartIntent entry's target page is where a cart click leads, and a commit or wallet tap goes past it.
  const entries = isCart
    ? getCartIntentEntries(accountId)
    : getPreselectionEntries(accountId).filter((entry) => entry.cartIntent !== true);
  if (entries.length === 0) return observe('cart_entry_only');
  if (entries.length !== 1) return observe('multiple_entries');
  // A tap replayed after the shopper moved on is not tied to the page they are on now. A live cart click is
  // exempt: an SPA router can move the page before the click is delivered, and this fire never reads the page.
  if (clickPathname !== stripTrailingSlash(window.location.pathname) && !(isCart && isLiveIntent(signal)))
    return observe('path_changed');
  const entry = entries[0];
  if (!hasValidIdentity(host.filteredUser)) {
    if (waitsForIdentity && !afterWait) return awaitIdentity(state, host, signal, clickPathname, visitKey);
    return observe('no_valid_identity');
  }
  const kind = intentTriggerKind(signal.kind);
  const offEntryKind: OffEntryTriggerKind = `${kind}_off_entry`;
  // Off the entry's route the form is never read, so attributes come from the user alone, even when an SPA
  // router has already moved a live cart click onto an entry's route.
  const { collected, missingKeys } = collectAttributes(host, intentTriggerEvent(kind), entry, false);
  // The once-per-checkout check fireDispatch makes, on the same digest, so changed attributes fire again.
  const digest = getAttributesDigest(host, accountId, entry.targetPageIdentifier, collected);
  if (wasPreselectFiredRecently(accountId, entry.targetPageIdentifier, digest, !isCart))
    return observe('active_preselection');
  if (missingKeys.length > 0) return observe('missing_attribute');
  if (!carriesEmail(host, collected, entry.targetPageIdentifier)) return observe('no_strict_email');
  // Scoped to the target page, as a recovered fire is: the tapped page is never an entry, so a record
  // under it would never be read again.
  fireDispatch(
    host,
    accountId,
    entry.targetPageIdentifier,
    entry.targetPageIdentifier,
    collected,
    'intent',
    describeTrigger(offEntryKind, entry),
    false,
    kind,
    false,
    undefined,
    signalSource(signal),
    { route, loggedIn, requireLogin: !isCart && !waitsForIdentity },
  );
}

// How long a guest's wallet tap waits for the guest to be identified; a wallet sheet takes about 5 to 20 seconds.
const IDENTITY_WAIT_MS = 20_000;

// Holds a guest's wallet tap until an identity arrives (resolveIdentityWait) or the window closes. A later tap
// replaces it and starts its own window.
function awaitIdentity(
  state: PreselectState,
  host: PreselectHost,
  signal: PreselectIntentSignal,
  clickPathname: string,
  visitKey: string,
): void {
  endIdentityWait(state);
  const expire = (): void => {
    state.identityWait = undefined;
    const current = host.getCurrentHost?.() ?? host;
    if (intentSignalsApply(current)) logIdentityWaitExpired(current, wait);
  };
  const wait: IdentityWait = {
    signal,
    clickPathname,
    visitKey,
    route: intentPathHistory[intentPathHistory.length - 1],
    timer: setTimeout(expire, Math.max(0, signal.t + IDENTITY_WAIT_MS - Date.now())),
  };
  state.identityWait = wait;
}

function endIdentityWait(state: PreselectState): void {
  if (state.identityWait) clearTimeout(state.identityWait.timer);
  state.identityWait = undefined;
}

function logIdentityWaitExpired(host: PreselectHost, wait: IdentityWait): void {
  const route = intentRouteOutsideEntry(host.accountId!);
  const extra = { logged_in: isLoggedIn(host), cause: 'identity_wait_expired' };
  logObservedIntent(host, wait.signal, route, wait.visitKey, extra, true);
}

// On the identity-arrival path: the first identity ends the wait. The tap fires through the off-entry gates if the
// shopper is still on the tapped page inside the window, and otherwise expires.
function resolveIdentityWait(state: PreselectState, host: PreselectHost): void {
  const wait = state.identityWait;
  if (!wait || !hasValidIdentity(host.filteredUser)) return;
  endIdentityWait(state);
  if (!intentSignalsApply(host)) return;
  host.logPlacementDiagnostic(
    buildPreselectDiagnosticLogEntry('identity_arrived', 'pending_identity', {
      intent_kind: wait.signal.kind,
      ...sinceTriggerDetail(wait.signal.t),
    }),
  );
  // Any route change since the tap ends its visit, even when the shopper comes back to the tapped page.
  const movedOn =
    intentPathHistory[intentPathHistory.length - 1] !== wait.route ||
    wait.clickPathname !== stripTrailingSlash(window.location.pathname);
  if (movedOn || Date.now() - wait.signal.t >= IDENTITY_WAIT_MS) return logIdentityWaitExpired(host, wait);
  fireOrObserveOffEntry(state, host, wait.signal, wait.clickPathname, wait.visitKey, true);
}

// The path a newer core carries on the signal, if it is a plain path.
function signalPathname(signal: PreselectIntentSignal): string | undefined {
  const pathname = signal.pathname;
  return typeof pathname === 'string' && pathname.charAt(0) === '/' && pathname.length <= MAX_INTENT_PATHNAME_LENGTH
    ? stripTrailingSlash(pathname)
    : undefined;
}
const handledIntentSignals = new Set<string>();
const observedIntentKinds = new Set<string>();
const intentPathHistory: Array<{ pathname: string; since: number }> = [];

function intentKindOf(event: SDKEvent | undefined): IntentTriggerKind | undefined {
  if (event === intentCommitTriggerEvent) return 'intent_commit';
  if (event === intentWalletTriggerEvent) return 'intent_wallet';
  if (event === intentCartTriggerEvent) return 'intent_cart';
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

// The core SDK has already dropped untrusted, throttled and privacy-suppressed signals. With checkout
// intent active, a commit or wallet click on an entry's route fires it, as does a logged-in shopper's off
// every entry, and a cart click fires a cartIntent entry from any route; every other signal is observed only.
// A commit or wallet click never fires a cartIntent entry.
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
  if (!intentSignalsApply(host)) return;
  // An account with no cartIntent entry never hears a cart click.
  if (signal.kind === 'cart' && getCartIntentEntries(host.accountId!).length === 0) return;
  recordIntentForArrival(host.accountId!, signal);
  // The path the click happened on: carried by a newer core, otherwise read from the kit's own route
  // history, which starts when the kit attached.
  const visited = [...intentPathHistory].reverse().find((entry) => entry.since <= signal.t);
  const clickPathname = signalPathname(signal) ?? visited?.pathname;
  if (!clickPathname) return;
  const visitSince = visited && visited.pathname === clickPathname ? visited.since : 0;
  const visitKey = `${clickPathname}:${visitSince}`;
  const isCart = signal.kind === 'cart';
  const firesOnIntent = signal.kind === 'commit' || signal.kind === 'wallet' || isCart;
  const clickEntry = findPreselectionConfig(host.accountId, clickPathname);
  // A commit or wallet tap off every entry, such as an express wallet on the cart, fires only for a
  // logged-in shopper. A cart click anywhere but its cartIntent entry's own route fires that entry from there.
  // A cartIntent entry answers cart clicks only, so for any other tap its own route counts as off every entry: an
  // express wallet or buy-now tap there skips the cart and never fires it, but can fire the account's other entry.
  if (!clickEntry || (isCart ? clickEntry.cartIntent !== true : clickEntry.cartIntent === true)) {
    if (firesOnIntent) fireOrObserveOffEntry(state, host, signal, clickPathname, visitKey);
    return;
  }
  const currentPathname = window.location.pathname;
  const samePath = clickPathname === stripTrailingSlash(currentPathname);
  // A live cart click whose page an SPA router already moved fires the way one off the entry's route does,
  // from the user alone, since the entry's page is gone.
  if (isCart && !samePath && isLiveIntent(signal)) {
    fireOrObserveOffEntry(state, host, signal, clickPathname, visitKey);
    return;
  }
  if (!firesOnIntent || !samePath) {
    logObservedIntent(host, signal, 'entry', visitKey);
    return;
  }
  state.intentSource = signalSource(signal);
  const kind = intentTriggerKind(signal.kind);
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
  maybeFirePreselect(state, host, intentTriggerEvent(kind), currentPathname, undefined, signal.t);
}

// What a checkout intent signal needs before the kit acts on or logs it, checked again when a waiting tap ends.
function intentSignalsApply(host: PreselectHost): boolean {
  return (
    !host.isTargetingDisabled?.() &&
    host.isForwardingAllowed?.() !== false &&
    checkoutIntentApplies(host) &&
    host.isKitReady() &&
    host.isPreselectionEnabled() &&
    hasPreselectionConfigForAccount(host.accountId)
  );
}

// Each of the account's target pages keeps the intent for its arrival line, wherever the shopper was. A cart
// click counts only toward the target pages of entries that fire on one.
function recordIntentForArrival(accountId: string, signal: PreselectIntentSignal): void {
  const entries = signal.kind === 'cart' ? getCartIntentEntries(accountId) : getPreselectionEntries(accountId);
  const identifiers = new Set(entries.map((entry) => entry.targetPageIdentifier));
  identifiers.forEach((identifier) => recordPreselectIntent(accountId, identifier, signal.kind, signal.t));
}

function isPathnameTriggerEvent(event: SDKEvent): boolean {
  return event === pathnameTriggerEvent;
}

const MESSAGE_TYPE_PAGE_EVENT = 4; // mParticle MessageType.PageEvent, what logEvent sends
// Set by core auto button and link tracking on every automatic click. The names survive the
// attribute filters and data plans that can strip the markers.
const AUTO_CLICK_EVENT_NAMES = ['Auto Button Click', 'Auto Link Click'];
const AUTO_CLICK_ATTRIBUTES = ['is_auto_button_click', 'is_auto_link_click'];

// Auto clicks reach the kit as gated checkout intent signals instead, so they
// never count as configured trigger events or placement event mappings.
export function isAutoClickEvent(event: SDKEvent): boolean {
  return (
    (event.EventDataType === MESSAGE_TYPE_PAGE_EVENT && AUTO_CLICK_EVENT_NAMES.includes(event.EventName ?? '')) ||
    AUTO_CLICK_ATTRIBUTES.some((name) => String(event.EventAttributes?.[name]) === 'true')
  );
}

// The account a payment pick is recorded for, under the checkout intent gates, or undefined.
function paymentPickAccount(host: PreselectHost): string | undefined {
  const accountId = host.accountId;
  if (
    !accountId ||
    !hasPreselectionConfigForAccount(accountId) ||
    host.isTargetingDisabled?.() ||
    host.isForwardingAllowed?.() === false ||
    !checkoutIntentApplies(host) ||
    !host.isKitReady() ||
    !host.isPreselectionEnabled()
  ) {
    return undefined;
  }
  return accountId;
}

function recordPaymentFamily(accountId: string, family: PaymentFamily | undefined): void {
  if (!family) return;
  const identifiers = new Set(getPreselectionEntries(accountId).map((entry) => entry.targetPageIdentifier));
  const t = Date.now();
  identifiers.forEach((identifier) => recordPreselectPaymentPick(accountId, identifier, family, t));
}

// Shadow only: remembers the payment method an auto click picked, so the target page's arrival
// line can say whether it matches what the partner reports there. Nothing is sent with the call.
export function recordPreselectPaymentClick(host: PreselectHost, event: SDKEvent): void {
  const accountId = isAutoClickEvent(event) ? paymentPickAccount(host) : undefined;
  if (accountId) {
    recordPaymentFamily(accountId, paymentFamilyFromClick(event.EventAttributes as Record<string, unknown> | undefined));
  }
}

// Shadow only, like an auto click: the payment radios and payment frames the core SDK sees but
// never logs. The names are read here and dropped; only the family is stored.
export function handlePreselectPaymentPick(host: PreselectHost, signal: PreselectPaymentPickSignal): void {
  const accountId = paymentPickAccount(host);
  if (accountId) {
    recordPaymentFamily(accountId, paymentFamilyFromPick(signal));
  }
}

function isConfiguredTriggerEvent(configEntry: PreselectionConfigEntry, event: SDKEvent): boolean {
  return (
    event.EventDataType === MESSAGE_TYPE_PAGE_EVENT &&
    isString(event.EventName) &&
    !isAutoClickEvent(event) &&
    (configEntry.triggerEventNames ?? []).includes(event.EventName)
  );
}

// Names what fired a speculative call and on which configured route, as '<kind>|<pathname>'.
// The persistence deny list keeps it off every later call.
export const PRESELECT_TRIGGER_ATTRIBUTE = 'rokt.preselecttrigger';

// Dispatch option naming the attribute key filled from the page form and the user it was read for, as
// { key, mpid }. The kit sends that value on the speculative call only, for that user, and never keeps it.
export const PRESELECT_FORM_EMAIL_OPTION = 'preselectFormEmail';

// Dispatch option naming the user an off-entry tap fired for, as { mpid, requireLogin }. The call can wait on identity
// search or launcher setup, so the kit sends it only if that user is still its user, and still logged in when the
// fire needed a logged-in shopper.
export const PRESELECT_BOUND_USER_OPTION = 'preselectBoundUser';

// An off-entry tap's call carries its own kind, so it can be measured apart from the confirm click.
// Each keeps the intent_ prefix the dispatch-time email check reads.
type OffEntryTriggerKind = `${IntentTriggerKind}_off_entry`;
type PreselectTriggerKind =
  | 'pageview'
  | 'pathname'
  | 'event'
  | 'recovered'
  | 'pageview_cart'
  | IntentTriggerKind
  | OffEntryTriggerKind;

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

// Fills each default key the attributes hold no value for, in any casing, and never replaces a value they hold.
// Applied to the speculative call only, so a guess is never cached as the shopper's own value.
export function applyPreselectAttributeDefaults(
  attributes: Record<string, unknown>,
  defaults: Record<string, string> | undefined,
): Record<string, unknown> {
  if (!defaults) {
    return attributes;
  }

  const result: Record<string, unknown> = { ...attributes };
  for (const [key, value] of Object.entries(defaults)) {
    const sameKeys = Object.keys(result).filter((name) => name.toLowerCase() === key.toLowerCase());
    if (sameKeys.some((name) => !isEmpty(result[name]))) {
      continue;
    }
    sameKeys.forEach((name) => delete result[name]);
    result[key] = value;
  }
  return result;
}

export function getPreselectCacheMatchKeys(configEntry: PreselectionConfigEntry): string[] {
  const defaultKeys = Object.keys(configEntry.preselectAttributeDefaults ?? {});
  return [...configEntry.attributeKeys, ...defaultKeys.filter((key) => !configEntry.attributeKeys.includes(key))];
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
  const attributesDigest = getAttributesDigest(host, accountId, configEntry.targetPageIdentifier, collected);
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
  // The rule that recognised the last confirm click handled here, for the fired line.
  intentSource?: string;
  // The path whose intent fire last waited for an email, so the wait reports it once.
  noEmailLoggedPathname?: string;
  // The entry whose wait for the confirm click moved quietly to another of its pages, so the new page
  // does not report a second wait.
  intentWaitMovedWithin?: PreselectionConfigEntry;
  // The route whose page view waits to fire the account's cart entry, until the shopper's cart holds items.
  cartPageViewPathname?: string;
  scheduledDispatch?: {
    event: SDKEvent;
    pathname: string;
    heldAt: number;
    heldForUserId: string | null;
    triggeredAt: number;
  };
  identityWait?: IdentityWait;
}

// A guest's wallet tap off every entry, waiting for the guest to be identified.
interface IdentityWait {
  signal: PreselectIntentSignal;
  clickPathname: string;
  visitKey: string;
  // The route the shopper was on at the tap; object identity separates visits to the same page.
  route: (typeof intentPathHistory)[number] | undefined;
  timer: ReturnType<typeof setTimeout>;
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
  // The Rokt launcher's pre-selection variant for this tab, read on each call since the launcher can attach late.
  getPreselectVariant?(): unknown;
  getEventAttributeValue(event: SDKEvent, key: string): unknown;
  logPlacementDiagnostic(entry: DiagnosticLogEntry | null | undefined): void;
  log(entry: DiagnosticLogEntry | null | undefined): void;
  selectPlacements(options: Record<string, unknown>): unknown;
  // False under do-not-share-or-sell or Global Privacy Control, which stop every pre-selection, not
  // only the ones a confirm click fires.
  isPreselectionPrivacyAllowed?(): boolean;
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
  // Everything a pre-selection call for this target page would send with these attributes, in the
  // order selectPlacements merges them: identities, then filtered attributes, then session attributes.
  getOutgoingAttributes?(attributes: Record<string, unknown>, identifier?: string): Record<string, unknown>;
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
// field the shopper never touched never fills the call, and one a script later changes drops out when that change
// fires an event; a silent script write after the shopper's last edit is not seen. Holds elements, never values.
const shopperInputs = new WeakSet<HTMLInputElement>();

// Inputs whose latest input or change event was untrusted, dispatched by script. Read only by the email miss reason.
const scriptInputs = new WeakSet<HTMLInputElement>();

// The document and the field each hear one event, and a capture handler between them can change the field and
// announce it. An event can record only when first heard, so it never undoes that drop; a drop always applies.
const heardEvents = new WeakSet<Event>();

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
  if (!(target instanceof HTMLInputElement)) return;
  const firstHearing = !heardEvents.has(event);
  heardEvents.add(event);
  if (event.isTrusted !== true) scriptInputs.add(target);
  else if (firstHearing) scriptInputs.delete(target);
  if (event.isTrusted === true && isEmailCandidate(target)) {
    if (!firstHearing) return;
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

// Why a required email stayed empty, as the missed line reports it. A closed set: nothing from the page.
type EmailMissReason =
  | 'read_disabled'
  | 'off_route'
  | 'privacy_blocked'
  | 'email_filtered'
  | 'partner_email'
  | 'multiple_emails'
  | 'untrusted_fill'
  | 'unseen_fill'
  | 'no_field';

// Longer values are never emails, and skipping them bounds the pattern's backtracking on fields the shopper didn't fill.
const MAX_EMAIL_LENGTH = 254;

// One pass over the candidates. Collects the shopper-filled emails keyed in lower case; with testUnfilled, also says
// how an email-shaped value reached a field the shopper didn't fill. That value is only tested, never kept.
function scanFormEmails(testUnfilled: boolean): {
  emails: Map<string, string>;
  unfilled?: 'untrusted_fill' | 'unseen_fill';
} {
  const emails = new Map<string, string>();
  let unfilled: 'untrusted_fill' | 'unseen_fill' | undefined;
  document.querySelectorAll('input').forEach((input) => {
    const filled = shopperInputs.has(input);
    if ((!filled && !testUnfilled) || !isEmailCandidate(input)) return;
    const value = input.value.trim();
    if (filled) {
      if (EMAIL_PATTERN.test(value) && !emails.has(value.toLowerCase())) {
        emails.set(value.toLowerCase(), value);
      }
    } else if (unfilled !== 'untrusted_fill' && value.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(value)) {
      unfilled = scriptInputs.has(input) ? 'untrusted_fill' : 'unseen_fill';
    }
  });
  return { emails, unfilled };
}

// The one email across the candidates on the page that the shopper typed into or autofilled, trimmed and
// otherwise as typed. Inputs differing only in case or spacing (email and confirm email) count as one; two
// different emails, such as a gift recipient's beside the shopper's, are ambiguous and read nothing.
function readFormEmail(): string | undefined {
  const { emails } = scanFormEmails(false);
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

const EMAIL_CLASS_KEYS = ['email', 'emailsha256'];

// An attribute or identity key that holds the shopper's email, raw or hashed, in any casing.
export function isPreselectEmailKey(key: string, mappedEmailSha256Key?: string): boolean {
  const lower = key.toLowerCase();
  return EMAIL_CLASS_KEYS.includes(lower) || (isString(mappedEmailSha256Key) && lower === mappedEmailSha256Key.toLowerCase());
}

// Whether the call will carry the shopper's email, raw or hashed, judged on what selectPlacements would
// actually send: the attributes after the kit's cache is merged in and its filters run, or an identity.
function carriesEmail(host: PreselectHost, collected: Record<string, unknown>, identifier?: string): boolean {
  if (host.getOutgoingAttributes) {
    return hasPreselectEmail(host.getOutgoingAttributes(collected, identifier), host.mappedEmailSha256Key);
  }
  return (
    hasPreselectEmail(collected, host.mappedEmailSha256Key) ||
    hasPreselectEmail(host.getUserIdentities?.() ?? {}, host.mappedEmailSha256Key)
  );
}

export function hasPreselectEmail(attributes: Record<string, unknown>, mappedEmailSha256Key?: string): boolean {
  return Object.keys(attributes).some(
    (key) => isPreselectEmailKey(key, mappedEmailSha256Key) && !isEmpty(readOwnValue(attributes, key)),
  );
}

// Why the form may not be read for this entry now, or undefined when it may, decided before any input value is
// touched. It may only on an opted-in entry's own route, with no partner email and no opt-out or privacy signal.
function whyFormEmailUnreadable(
  host: PreselectHost,
  configEntry: PreselectionConfigEntry,
  emailKey: string,
  eventAttributes: Record<string, unknown> = {},
): EmailMissReason | undefined {
  if (configEntry.readEmailInput !== true) return 'read_disabled';
  if (!pathnameMatches(configEntry.pathname, window.location.pathname)) return 'off_route';
  if (
    host.isForwardingAllowed?.() !== true ||
    host.isPreselectionPrivacyAllowed?.() === false ||
    host.isTargetingDisabled?.() === true
  ) {
    return 'privacy_blocked';
  }
  if (host.isEmailIdentityFiltered?.() === true) return 'email_filtered';
  return hasPartnerEmail(host, emailKey, eventAttributes) ? 'partner_email' : undefined;
}

// Why an unresolved email key got nothing from the form, for the missed line. Fields are read only when the gates allow.
function describeMissingEmail(
  host: PreselectHost,
  configEntry: PreselectionConfigEntry,
  emailKey: string,
  event: SDKEvent,
): EmailMissReason {
  const unreadable = whyFormEmailUnreadable(host, configEntry, emailKey, event.EventAttributes ?? {});
  if (unreadable) return unreadable;
  const { emails, unfilled } = scanFormEmails(true);
  return emails.size > 1 ? 'multiple_emails' : (unfilled ?? 'no_field');
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
        entry.pathname === pathname &&
        !whyFormEmailUnreadable(host, configEntry, emailKey, entry.event.EventAttributes ?? {}),
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
    whyFormEmailUnreadable(host, configEntry, emailKey, event.EventAttributes ?? {})
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
      getMissingRequiredAttributeKeys(host, configEntry, {}).includes(emailKey))
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
  host: PreselectHost,
  configEntry: PreselectionConfigEntry,
  attributes: Record<string, unknown>,
): string[] {
  // Only the exact 'widened' variant relaxes the entry's widened keys; anything else keeps them required.
  const widenedKeys =
    host.getPreselectVariant?.() === 'widened' ? (configEntry.widenedOptionalAttributeKeys ?? []) : [];
  // A key with a default always goes out with a value, so it never holds the fire.
  const optionalKeys = new Set(
    [
      ...(configEntry.optionalAttributeKeys ?? []),
      ...widenedKeys,
      ...Object.keys(configEntry.preselectAttributeDefaults ?? {}),
    ].map((key) => key.toLowerCase()),
  );
  return configEntry.attributeKeys.filter(
    (key) => !optionalKeys.has(key.toLowerCase()) && isEmpty(readOwnValue(attributes, key)),
  );
}

function collectAttributes(
  host: PreselectHost,
  event: SDKEvent,
  configEntry: PreselectionConfigEntry,
  // False for a fire off the entry's route, which never reads the page it happens to be on.
  readForm = true,
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

  const formEmailKey = readForm ? fillEmailFromForm(host, configEntry, collected, event) : undefined;

  return {
    collected,
    missingKeys: getMissingRequiredAttributeKeys(host, configEntry, collected),
    formEmailKey,
  };
}

// Undoes what a fire recorded before its call went out, for a call that throws, rejects or is dropped.
const preselectRollbacks = new WeakMap<object, () => void>();

// The rollback for the options a fire passed to selectPlacements, for the kit to run if it drops the call.
export function getPreselectRollback(options: object): (() => void) | undefined {
  return preselectRollbacks.get(options);
}

export function dispatchPreselect(
  host: PreselectHost,
  options: Record<string, unknown>,
  rollback?: () => void,
): void {
  if (rollback) preselectRollbacks.set(options, rollback);
  const logFailure = (err: unknown): void => {
    // A failed call is not the checkout's pre-selection, so it must not hold off the next fire.
    rollback?.();
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

// Fires for one record can overlap. Each fire links to the one before it, and a fire that fails while a
// later fire owns the record hands its snapshot to that later fire rather than restoring, so the record
// never returns to a fire that failed, whichever order the calls settle in.
interface FireRollbackLink<T> {
  previous: T;
  earlier?: FireRollbackLink<T>;
  later?: FireRollbackLink<T>;
}

const latestFireMarkLinks = new Map<string, FireRollbackLink<PreselectFireMark | undefined>>();
const latestActiveLinks = new Map<string, FireRollbackLink<ActivePreselectRecord | null>>();

function linkFireRollback<T>(links: Map<string, FireRollbackLink<T>>, key: string, previous: T): FireRollbackLink<T> {
  const earlier = links.get(key);
  const link: FireRollbackLink<T> = { previous, earlier };
  if (earlier) earlier.later = link;
  links.set(key, link);
  return link;
}

function rollBackFireLink<T>(
  links: Map<string, FireRollbackLink<T>>,
  key: string,
  link: FireRollbackLink<T>,
  restore: (previous: T) => void,
): void {
  const { earlier, later } = link;
  if (later) {
    later.previous = link.previous;
    later.earlier = earlier;
    if (earlier) earlier.later = later;
    return;
  }
  restore(link.previous);
  if (earlier) earlier.later = undefined;
  if (links.get(key) === link) {
    if (earlier) links.set(key, earlier);
    else links.delete(key);
  }
}

function getAttributesDigest(
  host: PreselectHost,
  accountId: string,
  identifier: string,
  attributes: Record<string, unknown>,
): number | undefined {
  try {
    const defaults = findPreselectionConfigByIdentifier(accountId, identifier)?.preselectAttributeDefaults ?? {};
    // What the call will send, read from the same sources as the confirm-click email check, so a corrected email
    // counts as changed attributes even for an entry whose keys leave email out.
    const outgoing = host.getOutgoingAttributes
      ? host.getOutgoingAttributes(attributes, identifier)
      : { ...(host.getUserIdentities?.() ?? {}), ...applyPreselectAttributeDefaults(attributes, defaults) };
    // A defaulted key is keyed by the value the call sends, which can be the shopper's own value under another
    // casing or an identity, so a change to it fires a fresh call.
    const keyedAttributes: Record<string, unknown> = { ...attributes };
    for (const key of Object.keys(defaults)) {
      const sentName = Object.keys(outgoing).find(
        (name) => name.toLowerCase() === key.toLowerCase() && !isEmpty(outgoing[name]),
      );
      keyedAttributes[key] = sentName === undefined ? defaults[key] : outgoing[sentName];
    }
    const keyed = JSON.stringify(keyedAttributes);
    const emails = Object.keys(outgoing)
      .sort()
      .filter((key) => isPreselectEmailKey(key, host.mappedEmailSha256Key) && !isEmpty(readOwnValue(outgoing, key)))
      .map((key) => [key, readOwnValue(outgoing, key)]);
    return djb2(emails.length > 0 ? `${keyed}|${JSON.stringify(emails)}` : keyed);
  } catch {
    // Attributes JSON.stringify rejects (a BigInt, a circular value) skip the dedupe instead:
    // nothing between here and the partner's logPageView call would catch the throw.
    return undefined;
  }
}

export function canDispatchPreselection(host: PreselectHost): boolean {
  return (
    !host.isTargetingDisabled?.() &&
    host.isPreselectionPrivacyAllowed?.() !== false &&
    host.isForwardingAllowed?.() !== false
  );
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
  intent?: IntentTriggerKind,
  byEvent = skipWhileActive,
  formEmailKey?: string,
  intentSource?: string,
  // Set for a fire off its entry's route, which binds the call to its user and says whether it needed a logged-in
  // shopper. A tap also reports its route in place of the entry's, and whether the shopper was logged in.
  offEntry?: { route?: 'left' | 'before_entry'; loggedIn?: boolean; requireLogin: boolean },
): boolean {
  // Checked here, where every live, replayed and recovered dispatch converges, so no entry point can
  // bypass a noTargeting, do-not-share-or-sell or Global Privacy Control opt-out, a user opt-out or a
  // consent change, and nothing is recorded.
  if (!canDispatchPreselection(host)) {
    return false;
  }

  const activePreselectKey = buildActivePreselectFieldKey(accountId, activeRecordScope);
  const attributesDigest = getAttributesDigest(host, accountId, identifier, attributes);
  const intentKindDetail: PreselectDiagnosticDetails = intent ? { intent_kind: intent.replace('intent_', '') } : {};
  // One pre-selection per checkout on the confirm click: once this tab fired these attributes for the
  // target page, a later step's click or a repeated click sends nothing until the shopper arrives. Changed
  // attributes, such as a corrected email, fire again. Delay and page-view fires keep the short dedupe below.
  if (intent && wasPreselectFiredRecently(accountId, identifier, attributesDigest, intent !== 'intent_cart')) {
    host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('skipped', 'active_preselection', intentKindDetail));
    return true;
  }
  if (skipWhileActive && getActivePreselect(activePreselectKey)?.byEvent) {
    host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('skipped', 'active_preselection'));
    return false;
  }

  const previousActive = attributesDigest !== undefined ? getActivePreselect(activePreselectKey) : null;
  if (attributesDigest !== undefined) {
    if (previousActive?.attributesDigest === attributesDigest) {
      host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('skipped', 'active_preselection', intentKindDetail));
      return true;
    }
    setActivePreselect(
      activePreselectKey,
      attributesDigest,
      byEvent || (!!intent && getActivePreselect(activePreselectKey)?.byEvent === true),
    );
  }

  host.logPlacementDiagnostic(
    buildPreselectDiagnosticLogEntry('fired', reason, {
      identity_types: formatIdentityTypes(getIdentityTypes(host.filteredUser)),
      ...(formEmailKey ? { email_source: 'input' } : {}),
      ...(intent
        ? {
            ...intentKindDetail,
            intent_route: offEntry ? offEntry.route : 'entry',
            ...(intentSource ? { intent_source: intentSource } : {}),
            ...(offEntry ? { logged_in: offEntry.loggedIn } : {}),
          }
        : {}),
    }),
  );
  const fireMarkKey = `${accountId}:${identifier}`;
  const fireLink = linkFireRollback(
    latestFireMarkLinks,
    fireMarkKey,
    recordPreselectFired(accountId, identifier, attributesDigest, intent === 'intent_cart'),
  );
  const activeLink =
    attributesDigest !== undefined ? linkFireRollback(latestActiveLinks, activePreselectKey, previousActive) : undefined;
  let rolledBack = false;
  const rollback = (): void => {
    if (rolledBack) return;
    rolledBack = true;
    if (activeLink) {
      rollBackFireLink(latestActiveLinks, activePreselectKey, activeLink, (previous) =>
        restoreActivePreselect(activePreselectKey, previous, attributesDigest),
      );
    }
    rollBackFireLink(latestFireMarkLinks, fireMarkKey, fireLink, (previous) =>
      restorePreselectFired(accountId, identifier, previous, attributesDigest),
    );
  };
  // Added after the digest, so the trigger kind never splits the dedupe above.
  dispatchPreselect(host, {
    attributes: { ...attributes, [PRESELECT_TRIGGER_ATTRIBUTE]: trigger },
    preselect: true,
    identifier,
    omitUrl: true,
    ...(formEmailKey
      ? { [PRESELECT_FORM_EMAIL_OPTION]: { key: formEmailKey, mpid: getUserId(host.filteredUser) } }
      : {}),
    ...(offEntry
      ? { [PRESELECT_BOUND_USER_OPTION]: { mpid: getUserId(host.filteredUser), requireLogin: offEntry.requireLogin } }
      : {}),
  }, rollback);
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
  if (!persisted.byEvent && checkoutIntentApplies(host)) {
    host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('missed', 'recovery_awaits_intent'));
    return;
  }

  const attributes = removeSelectPlacementsAttributePersistenceDeniedAttributes(persisted.attributes);
  const missingKeys = getMissingRequiredAttributeKeys(host, configEntry, attributes);
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
  return (
    !host.isTargetingDisabled?.() &&
    host.isPreselectionPrivacyAllowed?.() !== false &&
    host.isKitReady() &&
    host.isPreselectionEnabled()
  );
}

function sinceTriggerDetail(triggeredAt?: number): PreselectDiagnosticDetails {
  return triggeredAt === undefined ? {} : { since_trigger_ms: Date.now() - triggeredAt };
}

// Moving between two pages of one entry, such as from payment to review under '/checkout/*', replaces
// the wait for the confirm click without counting as leaving the checkout.
function isMoveWithinEntry(host: PreselectHost, entry: PendingPreselectDispatch, pathname: string): boolean {
  if (entry.waitingFor !== 'intent' || entry.intentSeen) {
    return false;
  }
  const from = findPreselectionConfig(host.accountId, entry.pathname);
  return !!from && from === findPreselectionConfig(host.accountId, pathname);
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
    leftEntries.forEach((entry) => {
      if (isMoveWithinEntry(host, entry, pathname)) {
        state.intentWaitMovedWithin = findPreselectionConfig(host.accountId, pathname);
      } else {
        logLeftTriggerPath(host, entry);
      }
    });
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
  // fireDispatch checks these too, but the not-ready branch below persists a snapshot before any
  // dispatch, and a replayed page view reaches it without passing the kit's own gates.
  if (host.isTargetingDisabled?.() || host.isPreselectionPrivacyAllowed?.() === false) {
    return;
  }

  const configEntry = findPreselectionConfig(host.accountId, pathname);
  if (!configEntry) {
    recordNearMissForArrival(host, pathname);
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
  if (!intentSeen && !isConfiguredTriggerEvent(configEntry, event) && checkoutIntentApplies(host)) {
    const movedHere = state.intentWaitMovedWithin === configEntry;
    state.intentWaitMovedWithin = undefined;
    const alreadyLogged = movedHere || (queued?.waitingFor === 'intent' && queued.awaitingIntentLogged === true);
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

// Written before the kit is ready, unlike the trigger, since a page that matches no entry is never
// queued for replay; only a session the launcher has put outside the rollout skips it. Only the
// arrival line reports it, under that line's own gates.
function recordNearMissForArrival(host: PreselectHost, pathname: string): void {
  const accountId = host.accountId;
  if (!accountId || (host.isKitReady() && !host.isPreselectionEnabled())) return;
  getPreselectionEntries(accountId).forEach((entry) => {
    if (nearlyMatches(entry.pathname, pathname)) recordPreselectNearMiss(accountId, entry.targetPageIdentifier);
  });
}

// The target page can itself nearly match, as when it sits under the trigger path, so a near miss
// recorded since the current route began is its own and does not count.
function wasNearMissBeforeThisRoute(nearMissAt: number | undefined): boolean {
  const route = intentPathHistory[intentPathHistory.length - 1];
  return nearMissAt !== undefined && (route === undefined || nearMissAt < route.since);
}

// The referrer's origin against this page's, never the referrer itself.
function describeReferrer(): 'same_origin' | 'other_origin' | 'none' {
  try {
    return new URL(document.referrer).origin === window.location.origin ? 'same_origin' : 'other_origin';
  } catch {
    return 'none';
  }
}

// While the core SDK delivers checkout intent and intent privacy allows it, every entry waits for the
// confirm click. Otherwise the entry keeps its dispatchDelayMs.
function checkoutIntentApplies(host: PreselectHost): boolean {
  return host.isCheckoutIntentActive?.() === true && host.isPreselectionPrivacyAllowed?.() !== false;
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
  const configEntry = findPreselectionConfig(host.accountId, pathname);
  if (!configEntry || host.isTargetingDisabled?.() || host.isPreselectionPrivacyAllowed?.() === false) {
    return;
  }

  // Checkout intent can start applying while a delay runs. The page view then waits for the click
  // too, still bound to the shopper it was held for.
  if (
    !intentSeen &&
    !isConfiguredTriggerEvent(configEntry, event) &&
    !isIntentTriggerEvent(event) &&
    checkoutIntentApplies(host)
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
  if (host.isPreselectionPrivacyAllowed?.() === false) return;
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
    const emailKey = findEmailAttributeKey(configEntry);
    for (const key of missingKeys) {
      host.logPlacementDiagnostic(
        buildPreselectDiagnosticLogEntry('missed', `missing_attribute:${key}`, {
          identity_types: formatIdentityTypes(identityTypes),
          key_is_identity: identityTypes.some((type) => type.toLowerCase() === key.toLowerCase()),
          ...(key === emailKey ? { email_reason: describeMissingEmail(host, configEntry, key, event) } : {}),
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

  const intentKind = intentSeen ?? intentKindOf(event);
  // A fire on the confirm click must carry the shopper's email, raw or hashed, so the call can be
  // matched to them. Without one it waits, and goes once an email arrives while the shopper is here.
  if (intentKind && !carriesEmail(host, collectedAttributes, configEntry.targetPageIdentifier)) {
    if (state.noEmailLoggedPathname !== normalizedPathname) {
      state.noEmailLoggedPathname = normalizedPathname;
      host.logPlacementDiagnostic(
        buildPreselectDiagnosticLogEntry('missed', 'no_strict_email', {
          intent_kind: intentKind.replace('intent_', ''),
          has_identity: hasValidIdentity(host.filteredUser),
        }),
      );
    }
    enqueuePending(state, host, {
      event,
      pathname,
      triggeringUserId,
      triggeredAt,
      intentSeen: intentKind,
      waitingFor: 'attribute',
    });
    return;
  }
  state.noEmailLoggedPathname = undefined;

  if (consumedPending) state.pending = state.pending.filter((entry) => entry !== consumedPending);
  const isEventTrigger = isConfiguredTriggerEvent(configEntry, event);
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
    intentKind,
    isEventTrigger,
    formEmailKey,
    intentKind ? state.intentSource : undefined,
  );
  // Only a dispatch whose attributes are now active guards later intent; a held-off repeat event must
  // not replace the record of the richer call it was held off by.
  if (isActive && (isPageViewTrigger(event) || isEventTrigger)) {
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

const EMPTY_CART_VALUES = ['', '0', '[]', '{}', 'false', 'null'];

// Whether a cart attribute holds items: a non-empty list, or a value other than an empty marker. A JSON string that
// parses to an empty list counts as empty.
function cartHoldsItems(value: unknown): boolean {
  if (isEmpty(value)) return false;
  if (Array.isArray(value)) return true;
  const text = String(value).trim();
  if (EMPTY_CART_VALUES.includes(text.toLowerCase())) return false;
  try {
    const parsed: unknown = JSON.parse(text);
    return !Array.isArray(parsed) || parsed.length > 0;
  } catch {
    return true;
  }
}

// The account's one cartIntent entry, when it names a cart attribute.
function getCartPageViewEntry(accountId: string | null | undefined): PreselectionConfigEntry | undefined {
  const entries = accountId ? getCartIntentEntries(accountId) : [];
  return entries.length === 1 && entries[0].cartUserAttribute ? entries[0] : undefined;
}

// Whether a user attribute is the account's cart attribute, in any casing, so setting it retries a waiting page view.
export function isPreselectCartAttributeKey(accountId: string | null | undefined, key: string): boolean {
  const cartKey = getCartPageViewEntry(accountId)?.cartUserAttribute;
  return isString(cartKey) && cartKey.toLowerCase() === key.toLowerCase();
}

// The cart attribute only gates the page view, so a pre-selection call leaves it out unless the entry it fires for
// matches on it.
export function withoutPreselectCartGateAttribute(
  accountId: string | null | undefined,
  attributes: Record<string, unknown>,
  dispatchedEntry: PreselectionConfigEntry | undefined,
): Record<string, unknown> {
  const cartKey = getCartPageViewEntry(accountId)?.cartUserAttribute?.toLowerCase();
  if (
    !cartKey ||
    (dispatchedEntry && getPreselectCacheMatchKeys(dispatchedEntry).some((key) => key.toLowerCase() === cartKey))
  ) {
    return attributes;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (key.toLowerCase() !== cartKey) {
      result[key] = value;
    }
  }
  return result;
}

// The cart attribute in any casing, read from the user mParticle keeps for this connection.
function readCartAttribute(host: PreselectHost, cartKey: string): unknown {
  const attributes: Record<string, unknown> = host.filteredUser?.getAllUserAttributes?.() ?? {};
  const key = Object.keys(attributes).find((name) => name.toLowerCase() === cartKey.toLowerCase());
  return key === undefined ? undefined : attributes[key];
}

// A page view or route change off the cart entry's route fires that entry once the shopper's cart holds items, even
// while checkout intent is active: the click into the cart leaves too late for the call to land.
export function maybeFirePreselectForCartPageView(
  state: PreselectState,
  host: PreselectHost,
  pathname: string = window.location.pathname,
): void {
  state.cartPageViewPathname = stripTrailingSlash(pathname);
  fireCartPageView(state, host, pathname);
}

// Waits on its route for the launcher, identity, items in the cart or a required attribute, each of which flushes the
// queue. No dispatchDelayMs: that lets the entry's own page settle, and this fire reads the user alone.
function fireCartPageView(state: PreselectState, host: PreselectHost, pathname: string): void {
  const entry = getCartPageViewEntry(host.accountId);
  if (
    !entry ||
    state.cartPageViewPathname !== stripTrailingSlash(pathname) ||
    pathnameMatches(entry.pathname, pathname) ||
    !canDispatchPreselection(host)
  ) {
    state.cartPageViewPathname = undefined;
    return;
  }
  if (!host.isKitReady()) return;
  if (!host.isPreselectionEnabled()) {
    state.cartPageViewPathname = undefined;
    return;
  }
  if (!cartHoldsItems(readCartAttribute(host, entry.cartUserAttribute!)) || !hasValidIdentity(host.filteredUser)) return;
  const accountId = host.accountId!;
  const { collected, missingKeys } = collectAttributes(host, cartPageViewTriggerEvent, entry, false);
  // Like a cart click off the entry's route, the call must carry the shopper's email; until it does, the page view waits.
  if (missingKeys.length > 0 || !carriesEmail(host, collected, entry.targetPageIdentifier)) return;
  state.cartPageViewPathname = undefined;
  // The once-per-checkout and active pre-selection checks fireDispatch makes, skipped here without a log line.
  const digest = getAttributesDigest(host, accountId, entry.targetPageIdentifier, collected);
  const active = getActivePreselect(buildActivePreselectFieldKey(accountId, entry.targetPageIdentifier));
  if (
    wasPreselectFiredRecently(accountId, entry.targetPageIdentifier, digest) ||
    (digest !== undefined && active?.attributesDigest === digest)
  )
    return;
  // Scoped to the target page and bound to its user, as an off-entry tap is.
  fireDispatch(
    host,
    accountId,
    entry.targetPageIdentifier,
    entry.targetPageIdentifier,
    collected,
    'fired',
    describeTrigger('pageview_cart', entry),
    false,
    undefined,
    false,
    undefined,
    undefined,
    { requireLogin: false },
  );
}

export function flushPendingPreselectDispatches(
  state: PreselectState,
  host: PreselectHost,
  currentPathname: string = window.location.pathname,
): void {
  maybeFirePersistedPreselect(state, host);
  resolveIdentityWait(state, host);
  if (state.cartPageViewPathname !== undefined) fireCartPageView(state, host, currentPathname);

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
      if (isMoveWithinEntry(host, entry, currentPathname)) {
        state.intentWaitMovedWithin = findPreselectionConfig(host.accountId, currentPathname);
      } else {
        logLeftTriggerPath(host, { waitingFor, triggeredAt });
      }
      return;
    }

    // Still waiting for the confirm click: nothing else can release it, so it stays queued while
    // checkout intent applies. Once it no longer does, it replays below through the delay instead.
    if (waitingFor === 'intent' && !intentSeen) {
      const waitingEntry = findPreselectionConfig(host.accountId, pathname);
      if (waitingEntry && checkoutIntentApplies(host)) {
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
export function reportPreselectArrival(
  host: PreselectHost,
  identifier: unknown,
  attributes?: Record<string, unknown>,
): void {
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

  // Reported only while checkout intent applies and the kit may forward, under the same privacy it was
  // captured with.
  if (checkoutIntentApplies(host) && host.isForwardingAllowed?.() !== false) {
    host.logPlacementDiagnostic(
      buildPreselectDiagnosticLogEntry('arrived', 'intent_arrival', {
        ...describeIntentBeforeArrival(record),
        ...describePaymentShadow(record, attributes),
      }),
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
      near_miss_seen: wasNearMissBeforeThisRoute(record.nearMissAt),
      // Page memory loses the trigger record on a full navigation, so trigger_seen reads false.
      storage: isDevicePersistenceDisabled() ? 'page' : 'device',
      referrer: describeReferrer(),
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

// The shadow payment check: the family a fire went out with, the latest pick, and what the target page
// reports. Left off when there was no pick and the page reports no payment type.
function describePaymentShadow(
  record: PreselectArrivalRecord,
  attributes: Record<string, unknown> | undefined,
): PreselectDiagnosticDetails {
  const arrival = describeArrivalPayment(attributes);
  const pickAge = record.paymentPickAt === undefined ? -1 : Date.now() - record.paymentPickAt;
  const pick = record.paymentPick && pickAge >= 0 && pickAge < INTENT_ARRIVAL_WINDOW_MS ? record.paymentPick : 'none';
  if (pick === 'none' && arrival === 'absent') {
    return {};
  }
  const fireAge = record.firedAt === undefined ? -1 : Date.now() - record.firedAt;
  const guess =
    record.paymentAtFire && fireAge >= 0 && fireAge < INTENT_ARRIVAL_WINDOW_MS ? record.paymentAtFire : 'none';
  const comparable = guess !== 'none' && arrival !== 'absent' && arrival !== 'other';
  return {
    payment_guess: guess,
    payment_pick: pick,
    payment_arrival: arrival,
    payment_match: comparable ? guess === arrival : 'n/a',
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
