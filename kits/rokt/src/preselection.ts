import { IMParticleUser, SDKEvent } from '@mparticle/web-sdk/internal';
import type { IUserIdentities } from '@mparticle/web-sdk';

import { findPreselectionConfig, type PreselectionConfigEntry } from './preselectionConfig';
import { buildActivePreselectFieldKey, getActivePreselect, setActivePreselect } from './activePreselectStorage';
import { getPendingPreselect, setPendingPreselect, clearPendingPreselect } from './pendingPreselectStorage';
import { buildPreselectDiagnosticLogEntry, type DiagnosticLogEntry } from './diagnosticTiming';
import { isEmpty, isString } from './utils';

export interface PendingPreselectDispatch {
  event: SDKEvent;
  pathname: string;
}

export interface PreselectState {
  pending: PendingPreselectDispatch[];
}

export function createPreselectState(): PreselectState {
  return { pending: [] };
}

// Only the most recent pageview per pathname is worth retrying — replace rather than
// accumulate, so a page the user never provides the required attribute on doesn't grow
// state.pending without bound across repeat pageviews.
function enqueuePending(state: PreselectState, dispatch: PendingPreselectDispatch): void {
  const existingIndex = state.pending.findIndex((entry) => entry.pathname === dispatch.pathname);
  if (existingIndex >= 0) {
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

// Resolves the configured attribute keys against the pageview event first, then the kit's
// own in-memory attribute bag, then mParticle's live persisted attributes. Shared by the
// normal fire path and the not-ready path's best-effort snapshot for cross-page persistence.
function collectAttributes(
  host: PreselectHost,
  event: SDKEvent,
  configEntry: PreselectionConfigEntry,
): { collected: Record<string, unknown>; missingKeys: string[] } {
  const livePersistedAttributes = host.filteredUser?.getAllUserAttributes?.() || {};

  const collected: Record<string, unknown> = {};
  const missingKeys: string[] = [];
  for (const key of configEntry.attributeKeys) {
    const eventValue = host.getEventAttributeValue(event, key);
    const value = !isEmpty(eventValue) ? eventValue : (host.userAttributes[key] ?? livePersistedAttributes[key]);
    if (isEmpty(value)) {
      missingKeys.push(key);
      continue;
    }
    collected[key] = value;
  }

  return { collected, missingKeys };
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

function fireDispatch(
  host: PreselectHost,
  accountId: string,
  pathname: string,
  identifier: string,
  attributes: Record<string, unknown>,
  reason: string,
): void {
  const activePreselectKey = buildActivePreselectFieldKey(accountId, pathname);
  const activeRecord = getActivePreselect(activePreselectKey);
  const attributesUnchanged =
    !!activeRecord && JSON.stringify(activeRecord.attributes) === JSON.stringify(attributes);

  if (activeRecord && activeRecord.expiresAt > Date.now() && attributesUnchanged) {
    host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('skipped', 'active_preselection'));
    return;
  }

  setActivePreselect(activePreselectKey, attributes);
  host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('fired', reason));
  dispatchPreselect(host, { attributes, preselect: true, identifier, omitUrl: true });
}

// Recovers a preselect attempt that was resolvable but couldn't dispatch because the kit
// wasn't ready yet, and whose page has since gone away (a full navigation discards the
// in-memory pending queue along with the rest of that page's JS context). Deliberately
// independent of the current pathname: unlike the in-memory queue below, which is dropped
// on a same-instance pathname change because that instance is still around to observe it,
// a full navigation to a different page — checkout to its confirmation page, say — is
// exactly the case this exists to recover, not a reason to discard it. Safe to call
// unconditionally once the kit is ready: a no-op when nothing was persisted.
export function maybeFirePersistedPreselect(host: PreselectHost): void {
  if (!host.accountId || !host.isKitReady()) {
    return;
  }

  const persisted = getPendingPreselect(host.accountId);
  if (!persisted) {
    return;
  }

  clearPendingPreselect(host.accountId);

  if (!host.isPreselectionEnabled() || !hasValidIdentity(host.filteredUser)) {
    return;
  }

  fireDispatch(host, host.accountId, persisted.pathname, persisted.identifier, persisted.attributes, 'recovered');
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
    enqueuePending(state, { event, pathname });
    host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('queued', 'not_ready'));

    // The kit not being ready is an infra-readiness race, not an attribute problem — a
    // shopper this far along usually already has everything the config asks for. Snapshot
    // it now, while the page (and this event) is still alive, so a full navigation away
    // before the launcher attaches doesn't lose the attempt along with this JS context.
    if (host.accountId && hasValidIdentity(host.filteredUser)) {
      const { collected, missingKeys } = collectAttributes(host, event, configEntry);
      if (missingKeys.length === 0) {
        setPendingPreselect(host.accountId, pathname, configEntry.targetPageIdentifier, collected);
      }
    }
    return;
  }

  if (!host.isPreselectionEnabled()) {
    return;
  }

  if (!hasValidIdentity(host.filteredUser)) {
    host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('missed', 'no_valid_identity'));
    // Guest checkout can hit this pageview before login; requeue so a later
    // identification on the same page can still flush a confirmation preselect.
    enqueuePending(state, { event, pathname });
    return;
  }

  const { collected: collectedAttributes, missingKeys } = collectAttributes(host, event, configEntry);

  if (missingKeys.length > 0) {
    for (const key of missingKeys) {
      host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('missed', `missing_attribute:${key}`));
    }
    // The site sets these attributes one at a time via setUserAttribute, often after this
    // pageview has already fired, so requeue rather than dropping the attempt on the floor;
    // Rokt-Kit's setUserAttribute flushes this queue once a matching key arrives.
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
  // Checked unconditionally, ahead of the in-memory queue below: a recovered entry is
  // account-scoped, not tied to currentPathname, since it exists specifically for the case
  // where the page that queued it is already gone.
  maybeFirePersistedPreselect(host);

  if (state.pending.length === 0) {
    return;
  }

  const pending = state.pending;
  state.pending = [];
  pending.forEach(({ event, pathname }) => {
    // A stale entry from a page the user has since navigated away from should not fire
    // against its originally-queued route; drop it rather than replaying it here.
    if (pathname !== currentPathname) {
      return;
    }
    maybeFirePreselect(state, host, event, pathname);
  });
}
