import { IMParticleUser, SDKEvent } from '@mparticle/web-sdk/internal';
import type { IUserIdentities } from '@mparticle/web-sdk';

import { PRESELECTION_CONFIG, type PreselectionConfigEntry } from './preselectionConfig';
import { buildActivePreselectFieldKey, getActivePreselect, setActivePreselect } from './activePreselectStorage';
import { getPendingPreselect, setPendingPreselect, clearPendingPreselect } from './pendingPreselectStorage';
import { removeSelectPlacementsAttributePersistenceDeniedAttributes } from './selectPlacementsAttributePersistence';
import { buildPreselectDiagnosticLogEntry, type DiagnosticLogEntry } from './diagnosticTiming';
import { isEmpty, isString } from './utils';

// A '*' in a configured pathname matches exactly one non-empty path segment. Segment counts
// must be equal, so the pattern is anchored at both ends and cannot widen to another page.
function pathnameMatches(configuredPathname: string, pathname: string): boolean {
  if (!configuredPathname.includes('*')) {
    return configuredPathname === pathname;
  }

  const configuredSegments = configuredPathname.split('/');
  const pathnameSegments = pathname.split('/');
  if (configuredSegments.length !== pathnameSegments.length) {
    return false;
  }

  return configuredSegments.every((segment, index) =>
    segment === '*' ? pathnameSegments[index] !== '' : segment === pathnameSegments[index],
  );
}

// A pathname-driven fire has no page-view event behind it, so attribute resolution falls
// through to the user attributes collectAttributes already reads as its fallback.
const pathnameTriggerEvent = {} as SDKEvent;

function isPathnameTriggerEvent(event: SDKEvent): boolean {
  return event === pathnameTriggerEvent;
}

export function findPreselectionConfig(
  accountId: string | null | undefined,
  pathname: string,
): PreselectionConfigEntry | undefined {
  if (!accountId) {
    return undefined;
  }

  return PRESELECTION_CONFIG.find(
    (entry) => entry.accountId === accountId && pathnameMatches(entry.pathname, pathname),
  );
}

export function findPreselectionConfigByIdentifier(
  accountId: string | null | undefined,
  identifier: unknown,
): PreselectionConfigEntry | undefined {
  if (!accountId || !isString(identifier)) {
    return undefined;
  }

  return PRESELECTION_CONFIG.find((entry) => entry.accountId === accountId && entry.targetPageIdentifier === identifier);
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

  return PRESELECTION_CONFIG.some((entry) => entry.accountId === accountId);
}

export function maybeFirePreselectForPathname(
  state: PreselectState,
  host: PreselectHost,
  pathname: string = window.location.pathname,
): void {
  // A page view queued for this path replays with its own event attributes, so the
  // pathname attempt yields to it rather than firing first.
  if (state.pending.some((entry) => entry.pathname === pathname && !isPathnameTriggerEvent(entry.event))) {
    return;
  }

  maybeFirePreselect(state, host, pathnameTriggerEvent, pathname);
}

export function isPreselectAttributeKey(accountId: string | null | undefined, key: string): boolean {
  if (!accountId) {
    return false;
  }

  return PRESELECTION_CONFIG.some((entry) => entry.accountId === accountId && entry.attributeKeys.includes(key));
}

export interface PendingPreselectDispatch {
  event: SDKEvent;
  pathname: string;
  // isPreselectionEnabled() reads the launcher, so nothing raised before it attaches can know
  // whether this session is in the rollout. Reporting from that window would count the whole
  // eligible population rather than the enabled cohort.
  storedDiagnostics?: DiagnosticLogEntry[];
}

export interface PreselectState {
  pending: PendingPreselectDispatch[];
}

export function createPreselectState(): PreselectState {
  return { pending: [] };
}

// Replace rather than accumulate per pathname, so a page that never gets the required
// attribute doesn't grow state.pending without bound across repeat pageviews.
function enqueuePending(state: PreselectState, dispatch: PendingPreselectDispatch): void {
  const existingIndex = state.pending.findIndex((entry) => entry.pathname === dispatch.pathname);
  if (existingIndex >= 0) {
    // The pathname trigger carries no event attributes, so it must not displace a queued
    // page view that does. A page view may still replace either.
    if (
      isPathnameTriggerEvent(dispatch.event) &&
      !isPathnameTriggerEvent(state.pending[existingIndex].event)
    ) {
      return;
    }

    state.pending[existingIndex] = dispatch;
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
}

function hasValidIdentity(filteredUser: IMParticleUser | null | undefined): boolean {
  if (!filteredUser?.getUserIdentities) {
    return false;
  }

  const userIdentities: IUserIdentities | null = filteredUser.getUserIdentities().userIdentities;
  if (!userIdentities) {
    return false;
  }

  return Object.keys(userIdentities).some((key) => {
    const value = userIdentities[key as keyof IUserIdentities];
    return isString(value) && value.length > 0;
  });
}

// Stable per-user id, used to bind a persisted record to the user who was signed in when it
// was written so recovery can't dispatch one user's attributes under a different one.
function getUserId(filteredUser: IMParticleUser | null | undefined): string | null {
  const mpid = filteredUser?.getMPID?.();
  return mpid == null ? null : String(mpid);
}

function getMissingRequiredAttributeKeys(
  configEntry: PreselectionConfigEntry,
  attributes: Record<string, unknown>,
): string[] {
  const optionalKeys = new Set((configEntry.optionalAttributeKeys ?? []).map((key) => key.toLowerCase()));
  return configEntry.attributeKeys.filter((key) => !optionalKeys.has(key.toLowerCase()) && isEmpty(attributes[key]));
}

function collectAttributes(
  host: PreselectHost,
  event: SDKEvent,
  configEntry: PreselectionConfigEntry,
): { collected: Record<string, unknown>; missingKeys: string[] } {
  const livePersistedAttributes = host.filteredUser?.getAllUserAttributes?.() || {};

  const collected: Record<string, unknown> = {};
  for (const key of configEntry.attributeKeys) {
    const eventValue = host.getEventAttributeValue(event, key);
    const value = !isEmpty(eventValue) ? eventValue : (host.userAttributes[key] ?? livePersistedAttributes[key]);
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
): void {
  const activePreselectKey = buildActivePreselectFieldKey(accountId, activeRecordScope);
  const activeRecord = getActivePreselect(activePreselectKey);
  const sentAttributes = applyPreselectAttributeOverrides(
    attributes,
    findPreselectionConfigByIdentifier(accountId, identifier)?.preselectAttributeOverrides,
  );
  const attributesUnchanged =
    !!activeRecord && JSON.stringify(activeRecord.attributes) === JSON.stringify(sentAttributes);

  if (activeRecord && activeRecord.expiresAt > Date.now() && attributesUnchanged) {
    host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('skipped', 'active_preselection'));
    return;
  }

  setActivePreselect(activePreselectKey, sentAttributes);
  host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('fired', reason));
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

export function maybeFirePreselect(
  state: PreselectState,
  host: PreselectHost,
  event: SDKEvent,
  pathname: string = window.location.pathname,
): void {
  const configEntry = findPreselectionConfig(host.accountId, pathname);
  if (!configEntry) {
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

    enqueuePending(state, { event, pathname, storedDiagnostics });
    return;
  }

  if (!host.isPreselectionEnabled()) {
    return;
  }

  if (!hasValidIdentity(host.filteredUser)) {
    host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('missed', 'no_valid_identity'));
    // Guest checkout can hit this pageview before login; requeue for a later identification.
    enqueuePending(state, { event, pathname });
    return;
  }

  const { collected: collectedAttributes, missingKeys } = collectAttributes(host, event, configEntry);

  if (missingKeys.length > 0) {
    for (const key of missingKeys) {
      host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('missed', `missing_attribute:${key}`));
    }
    // Sites set these one at a time via setUserAttribute, often after this pageview fires;
    // requeue so the kit's setUserAttribute flush can pick it up once a key arrives.
    enqueuePending(state, { event, pathname });
    return;
  }

  fireDispatch(host, host.accountId || '', pathname, configEntry.targetPageIdentifier, collectedAttributes, 'fired');
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
  pending.forEach(({ event, pathname, storedDiagnostics }) => {
    // Drop a stale entry rather than firing it against a route the user has left.
    if (pathname !== currentPathname) {
      return;
    }

    // A replay below rebuilds these from the same event, so dropping them unreported here is
    // safe as well as intended: a disabled session must not reach the funnel.
    if (host.isKitReady() && host.isPreselectionEnabled()) {
      storedDiagnostics?.forEach((entry) => host.logPlacementDiagnostic(entry));
    }

    maybeFirePreselect(state, host, event, pathname);
  });
}
