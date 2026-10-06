import { IMParticleUser, SDKEvent } from '@mparticle/web-sdk/internal';
import type { IUserIdentities } from '@mparticle/web-sdk';

import { PRESELECTION_CONFIG, type PreselectionConfigEntry } from './preselectionConfig';
import { parsePreselectionConfigSetting } from './preselectionConfigSetting';
import { buildActivePreselectFieldKey, getActivePreselect, setActivePreselect } from './activePreselectStorage';
import { getPendingPreselect, setPendingPreselect, clearPendingPreselect } from './pendingPreselectStorage';
import { markPreselectArrival, recordPreselectFired, recordPreselectTrigger } from './preselectArrivalStorage';
import { removeSelectPlacementsAttributePersistenceDeniedAttributes } from './selectPlacementsAttributePersistence';
import {
  buildPreselectDiagnosticLogEntry,
  type DiagnosticLogEntry,
  type PreselectDiagnosticDetails,
} from './diagnosticTiming';
import { djb2, isEmpty, isString } from './utils';

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

function isPathnameTriggerEvent(event: SDKEvent): boolean {
  return event === pathnameTriggerEvent;
}

const MESSAGE_TYPE_PAGE_EVENT = 4; // mParticle MessageType.PageEvent, what logEvent sends

function isConfiguredTriggerEvent(configEntry: PreselectionConfigEntry, event: SDKEvent): boolean {
  return (
    event.EventDataType === MESSAGE_TYPE_PAGE_EVENT &&
    isString(event.EventName) &&
    (configEntry.triggerEventNames ?? []).includes(event.EventName)
  );
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
  return !isPathnameTriggerEvent(event) && event.EventDataType !== MESSAGE_TYPE_PAGE_EVENT;
}

function hasWaitingPageView(state: PreselectState, pathname: string): boolean {
  const scheduled = state.scheduledDispatch;
  if (scheduled && scheduled.pathname === pathname && isPageViewTrigger(scheduled.event)) {
    return true;
  }
  return state.pending.some((entry) => entry.pathname === pathname && isPageViewTrigger(entry.event));
}

// The gates resolveAndDispatch and fireDispatch would meet, read without side effects.
function canDispatchNow(
  host: PreselectHost,
  event: SDKEvent,
  configEntry: PreselectionConfigEntry,
  pathname: string,
): boolean {
  if (!host.isKitReady() || !host.isPreselectionEnabled() || !hasValidIdentity(host.filteredUser)) {
    return false;
  }
  const { collected, missingKeys } = collectAttributes(host, event, configEntry);
  if (missingKeys.length > 0) {
    return false;
  }

  // fireDispatch skips an event while a record an event wrote is active, or when the active
  // record already carries these attributes.
  const accountId = host.accountId || '';
  const active = getActivePreselect(buildActivePreselectFieldKey(accountId, stripTrailingSlash(pathname)));
  if (!active) {
    return true;
  }
  const attributesDigest = getAttributesDigest(accountId, configEntry.targetPageIdentifier, collected);
  return !active.byEvent && (attributesDigest === undefined || attributesDigest !== active.attributesDigest);
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
// never leaves the route with nothing to send.
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

  const dispatchesNow = canDispatchNow(host, event, configEntry, pathname);
  if (!dispatchesNow && hasWaitingPageView(state, pathname)) {
    return;
  }
  if (dispatchesNow) {
    dropQueuedForRoute(state, host, pathname);
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
  waitingFor?: 'identity' | 'attribute' | 'launcher';
}

export interface PreselectState {
  pending: PendingPreselectDispatch[];
  dispatchTimer?: ReturnType<typeof setTimeout>;
  scheduledDispatch?: { event: SDKEvent; pathname: string; heldAt: number };
}

export function createPreselectState(): PreselectState {
  return { pending: [] };
}

// Any pageview supersedes a dispatch still waiting on dispatchDelayMs, so a shopper who leaves
// /checkout before the delay elapses never dispatches for the page they left.
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
  return event.EventDataType === MESSAGE_TYPE_PAGE_EVENT ? 2 : 1;
}

function hasUnresolvedAttributes(host: PreselectHost, entry: PendingPreselectDispatch): boolean {
  const configEntry = findPreselectionConfig(host.accountId, entry.pathname);
  return !!configEntry && collectAttributes(host, entry.event, configEntry).missingKeys.length > 0;
}

// Replace rather than accumulate per pathname, so a page that never gets the required
// attribute doesn't grow state.pending without bound across repeat pageviews.
function enqueuePending(state: PreselectState, host: PreselectHost, dispatch: PendingPreselectDispatch): void {
  const existingIndex = state.pending.findIndex((entry) => entry.pathname === dispatch.pathname);
  if (existingIndex >= 0) {
    // A lower-priority trigger never displaces a higher one queued for the same route, except a
    // page view over an event whose required attributes do not resolve, so the route keeps the
    // page view's attributes as it would with no event configured.
    const existing = state.pending[existingIndex];
    if (
      getPendingPriority(dispatch.event) < getPendingPriority(existing.event) &&
      !(isPageViewTrigger(dispatch.event) && hasUnresolvedAttributes(host, existing))
    ) {
      return;
    }

    // Keep the earliest trigger time, so a requeue never restarts the hold.
    state.pending[existingIndex] = {
      ...dispatch,
      triggeredAt: earliestTime(existing.triggeredAt, dispatch.triggeredAt),
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
  getCurrentUser?(): IMParticleUser | null | undefined;
  // Returns a host built from the kit's state now, for work that runs after this one was built.
  getCurrentHost?(): PreselectHost;
  isTargetingDisabled?(): boolean;
  // The filtered user's identities keyed by the name selectPlacements sends them under.
  getUserIdentities?(): Record<string, string>;
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

function formatIdentityTypes(types: string[]): string {
  return types.length > 0 ? types.join(',') : 'none';
}

// Stable per-user id, used to bind a persisted record to the user who was signed in when it
// was written so recovery can't dispatch one user's attributes under a different one.
function getUserId(filteredUser: IMParticleUser | null | undefined): string | null {
  const mpid = filteredUser?.getMPID?.();
  return mpid == null ? null : String(mpid);
}

function describeMissingIdentity(host: PreselectHost): PreselectDiagnosticDetails {
  const kitTypes = getIdentityTypes(host.filteredUser);
  const currentUser = host.getCurrentUser?.();
  const currentTypes = getIdentityTypes(currentUser);
  const kitUserId = getUserId(host.filteredUser);
  const currentUserId = getUserId(currentUser);

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
  };
}

function readOwnValue(source: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(source, key) ? source[key] : undefined;
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
): { collected: Record<string, unknown>; missingKeys: string[] } {
  const livePersistedAttributes = host.filteredUser?.getAllUserAttributes?.() || {};

  const identityKeys = new Set(configEntry.identityKeys ?? []);
  let userIdentities: Record<string, string> | undefined;

  const collected: Record<string, unknown> = {};
  for (const key of configEntry.attributeKeys) {
    const eventValue = host.getEventAttributeValue(event, key);
    let value = !isEmpty(eventValue)
      ? eventValue
      : (readOwnValue(host.userAttributes, key) ?? readOwnValue(livePersistedAttributes, key));
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

  return {
    collected,
    missingKeys: getMissingRequiredAttributeKeys(configEntry, collected),
  };
}

export function dispatchPreselect(host: PreselectHost, options: Record<string, unknown>): void {
  void Promise.resolve(host.selectPlacements(options)).catch((err: unknown) => {
    const errMessage = err instanceof Error ? err.message : String(err);
    host.log({
      message: `Rokt Kit: Preselect selectPlacements call failed: ${errMessage}`,
      code: 'PRESELECT_DISPATCH_FAILED',
    });
  });
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
function fireDispatch(
  host: PreselectHost,
  accountId: string,
  activeRecordScope: string,
  identifier: string,
  attributes: Record<string, unknown>,
  reason: string,
  // An event trigger dispatches once per active period an event started, even when the attributes
  // changed. A record a page view wrote does not hold it off.
  skipWhileActive = false,
): void {
  // Checked here, where every live, replayed and recovered dispatch converges, so no entry
  // point can bypass a noTargeting opt-out.
  if (host.isTargetingDisabled?.()) {
    return;
  }

  const activePreselectKey = buildActivePreselectFieldKey(accountId, activeRecordScope);
  if (skipWhileActive && getActivePreselect(activePreselectKey)?.byEvent) {
    host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('skipped', 'active_preselection'));
    return;
  }

  const attributesDigest = getAttributesDigest(accountId, identifier, attributes);
  if (attributesDigest !== undefined) {
    if (getActivePreselect(activePreselectKey)?.attributesDigest === attributesDigest) {
      host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('skipped', 'active_preselection'));
      return;
    }
    setActivePreselect(activePreselectKey, attributesDigest, skipWhileActive);
  }

  host.logPlacementDiagnostic(
    buildPreselectDiagnosticLogEntry('fired', reason, {
      identity_types: formatIdentityTypes(getIdentityTypes(host.filteredUser)),
    }),
  );
  recordPreselectFired(accountId, identifier);
  dispatchPreselect(host, { attributes, preselect: true, identifier, omitUrl: true });
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

  const attributes = removeSelectPlacementsAttributePersistenceDeniedAttributes(persisted.attributes);
  const missingKeys = getMissingRequiredAttributeKeys(configEntry, attributes);
  if (missingKeys.length > 0) {
    for (const key of missingKeys) {
      host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('missed', `missing_persisted_attribute:${key}`));
    }
    return;
  }

  fireDispatch(host, host.accountId, persisted.identifier, persisted.identifier, attributes, 'recovered');
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
  if (!entry.waitingFor || !isReportingDiagnostics(host)) {
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
    logCancelledHold(host, cancelledHold, pathname);
  }

  holdOrFirePreselect(state, host, event, pathname, triggeringUserId, triggeredAt, replacesPathnameHold);

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
): void {
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

  if (!host.isKitReady()) {
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
      const { collected, missingKeys } = collectAttributes(host, event, configEntry);
      if (missingKeys.length === 0) {
        // Deny-listed attributes may still resolve here (they're read from the raw event or
        // mParticle's live store, not just host.userAttributes), so strip them before this
        // snapshot sits in storage rather than going straight over the wire.
        const persistableAttributes = removeSelectPlacementsAttributePersistenceDeniedAttributes(collected);
        const wasPersisted = setPendingPreselect(
          host.accountId,
          pathname,
          configEntry.targetPageIdentifier,
          persistableAttributes,
          mpid,
        );
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
    });
    return;
  }

  if (!host.isPreselectionEnabled()) {
    return;
  }

  if (host.accountId) {
    recordPreselectTrigger(host.accountId, configEntry.targetPageIdentifier, hasValidIdentity(host.filteredUser));
  }

  if (!hasValidIdentity(host.filteredUser)) {
    host.logPlacementDiagnostic(
      buildPreselectDiagnosticLogEntry('missed', 'no_valid_identity', describeMissingIdentity(host)),
    );
    // Guest checkout can hit this pageview before login; requeue for a later identification.
    enqueuePending(state, host, { event, pathname, triggeringUserId, triggeredAt, waitingFor: 'identity' });
    return;
  }

  if (configEntry.dispatchDelayMs !== undefined && !isConfiguredTriggerEvent(configEntry, event)) {
    const heldForUserId = getUserId(host.filteredUser);
    const holdMs = Math.min(
      configEntry.dispatchDelayMs,
      Math.max(0, triggeredAt + configEntry.dispatchDelayMs - Date.now()),
    );
    state.scheduledDispatch = { event, pathname, heldAt: Date.now() };
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

  resolveAndDispatch(state, host, event, pathname, configEntry, triggeringUserId, triggeredAt);
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
): void {
  const configEntry = findPreselectionConfig(host.accountId, pathname);
  if (!configEntry || host.isTargetingDisabled?.()) {
    return;
  }

  if (!host.isKitReady()) {
    enqueuePending(state, host, { event, pathname, triggeringUserId, triggeredAt, waitingFor: 'launcher' });
    return;
  }

  if (!host.isPreselectionEnabled()) {
    return;
  }

  if (!hasValidIdentity(host.filteredUser)) {
    host.logPlacementDiagnostic(
      buildPreselectDiagnosticLogEntry('missed', 'no_valid_identity', describeMissingIdentity(host)),
    );
    enqueuePending(state, host, { event, pathname, triggeringUserId, triggeredAt, waitingFor: 'identity' });
    return;
  }

  // The event belongs to the user who triggered it; never pair it with someone else's attributes.
  if (getUserId(host.filteredUser) !== triggeringUserId) {
    return;
  }

  resolveAndDispatch(state, host, event, pathname, configEntry, triggeringUserId, triggeredAt);
}

function resolveAndDispatch(
  state: PreselectState,
  host: PreselectHost,
  event: SDKEvent,
  pathname: string,
  configEntry: PreselectionConfigEntry,
  triggeringUserId: string | null | undefined,
  triggeredAt: number,
): void {
  const { collected: collectedAttributes, missingKeys } = collectAttributes(host, event, configEntry);

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
    enqueuePending(state, host, { event, pathname, triggeringUserId, triggeredAt, waitingFor: 'attribute' });
    return;
  }

  const isEventTrigger = isConfiguredTriggerEvent(configEntry, event);
  fireDispatch(
    host,
    host.accountId || '',
    stripTrailingSlash(pathname),
    configEntry.targetPageIdentifier,
    collectedAttributes,
    isEventTrigger ? 'event_trigger' : 'fired',
    isEventTrigger,
  );
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
  pending.forEach(({ event, pathname, storedDiagnostics, triggeringUserId, triggeredAt, waitingFor }) => {
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

    maybeFirePreselect(state, host, event, pathname, triggeringUserId, triggeredAt);
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
  if (!record || record.firedAt !== undefined) {
    return;
  }

  host.logPlacementDiagnostic(
    buildPreselectDiagnosticLogEntry('missed', 'arrival_without_fire', {
      trigger_seen: record.triggeredAt !== undefined,
      identity_seen_on_trigger_path: record.identitySeenAt !== undefined,
      has_identity: hasValidIdentity(host.filteredUser),
      ...sinceTriggerDetail(record.triggeredAt),
    }),
  );
}
