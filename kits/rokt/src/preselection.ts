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

export interface PreselectHost {
  accountId: string | null;
  filteredUser: IMParticleUser | null | undefined;
  userAttributes: Record<string, unknown>;
  isKitReady(): boolean;
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
    state.pending.push({ event, pathname });
    host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('queued', 'not_ready'));
    return;
  }

  if (!hasValidIdentity(host.filteredUser)) {
    host.logPlacementDiagnostic(buildPreselectDiagnosticLogEntry('missed', 'no_valid_identity'));
    return;
  }

  const collectedAttributes: Record<string, unknown> = {};
  const missingKeys: string[] = [];
  for (const key of configEntry.attributeKeys) {
    const eventValue = host.getEventAttributeValue(event, key);
    const value = eventValue !== null ? eventValue : host.userAttributes[key];
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

export function flushPendingPreselectDispatches(state: PreselectState, host: PreselectHost): void {
  if (state.pending.length === 0) {
    return;
  }

  const pending = state.pending;
  state.pending = [];
  pending.forEach(({ event, pathname }) => maybeFirePreselect(state, host, event, pathname));
}
