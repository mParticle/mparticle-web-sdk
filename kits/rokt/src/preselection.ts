import { IMParticleUser, SDKEvent } from '@mparticle/web-sdk/internal';
import type { IUserIdentities } from '@mparticle/web-sdk';

import { findPreselectionConfig } from './preselectionConfig';
import { buildActivePreselectFieldKey, getActivePreselect, setActivePreselect } from './activePreselectStorage';
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

export function dispatchPreselect(host: PreselectHost, options: Record<string, unknown>): void {
  void Promise.resolve(host.selectPlacements(options)).catch((err: unknown) => {
    const errMessage = err instanceof Error ? err.message : String(err);
    host.log({
      message: `Rokt Kit: Preselect selectPlacements call failed: ${errMessage}`,
      code: 'PRESELECT_DISPATCH_FAILED',
    });
  });
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

  const livePersistedAttributes = host.filteredUser?.getAllUserAttributes?.() || {};

  const collectedAttributes: Record<string, unknown> = {};
  const missingKeys: string[] = [];
  for (const key of configEntry.attributeKeys) {
    const eventValue = host.getEventAttributeValue(event, key);
    const value = !isEmpty(eventValue) ? eventValue : (host.userAttributes[key] ?? livePersistedAttributes[key]);
    if (isEmpty(value)) {
      missingKeys.push(key);
      continue;
    }
    collectedAttributes[key] = value;
  }

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

  const activePreselectKey = buildActivePreselectFieldKey(host.accountId || '', pathname);
  const activeRecord = getActivePreselect(activePreselectKey);
  const attributesUnchanged =
    !!activeRecord && JSON.stringify(activeRecord.attributes) === JSON.stringify(collectedAttributes);

  if (activeRecord && activeRecord.expiresAt > Date.now() && attributesUnchanged) {
    host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('skipped', 'active_preselection'));
    return;
  }

  const preselectOptions: Record<string, unknown> = {
    attributes: collectedAttributes,
    preselect: true,
    identifier: configEntry.targetPageIdentifier,
    omitUrl: true,
  };

  setActivePreselect(activePreselectKey, collectedAttributes);
  host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('fired', 'fired'));

  dispatchPreselect(host, preselectOptions);
}

export function flushPendingPreselectDispatches(
  state: PreselectState,
  host: PreselectHost,
  currentPathname: string = window.location.pathname,
): void {
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
