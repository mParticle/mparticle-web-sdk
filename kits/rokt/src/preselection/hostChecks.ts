import { IMParticleUser, SDKEvent } from '@mparticle/web-sdk/internal';
import type { IUserIdentities } from '@mparticle/web-sdk';
import { type DiagnosticLogEntry } from './diagnosticTiming';
import { isString } from '../utils';

// Logged in is mParticle's persisted identity state, not the site's sign-in: where email is a login identity,
// a returning guest whose email was once identified also counts.
export function isLoggedIn(host: PreselectHost): boolean {
  const userId = getUserId(host.filteredUser);
  const currentUser = host.getCurrentUser();
  return userId !== null && getUserId(currentUser) === userId && currentUser?.isLoggedIn?.() === true;
}

export interface PreselectHost {
  accountId: string | null;
  filteredUser: IMParticleUser | null | undefined;
  userAttributes: Record<string, unknown>;
  isKitReady(): boolean;
  isPreselectionEnabled(): boolean;
  // The Rokt launcher's pre-selection variant for this tab, read on each call since the launcher can attach late.
  getPreselectVariant(): unknown;
  getEventAttributeValue(event: SDKEvent, key: string): unknown;
  logPlacementDiagnostic(entry: DiagnosticLogEntry | null | undefined): void;
  log(entry: DiagnosticLogEntry | null | undefined): void;
  selectPlacements(options: Record<string, unknown>): unknown;
  // False under do-not-share-or-sell or Global Privacy Control, which stop every pre-selection, not
  // only the ones a confirm click fires.
  isPreselectionPrivacyAllowed(): boolean;
  // True while the core SDK sends this kit checkout intent signals: the workspace has auto button
  // tracking on and no opt-out or privacy option suppresses them.
  isCheckoutIntentActive(): boolean;
  // True when the core SDK sends no intent for link clicks, because this connection does not receive Auto Link Click
  // events. Button clicks still send it.
  isLinkIntentWithheld(): boolean;
  getCurrentUser(): IMParticleUser | null | undefined;
  // Returns a host built from the kit's state now, for work that runs after this one was built.
  getCurrentHost(): PreselectHost;
  isTargetingDisabled(): boolean;
  // False once the user opts out or consent drops the kit. The page form is never read unless true.
  isForwardingAllowed(): boolean;
  // True when this connection filters out the Email identity or the identity mapped to the hashed email,
  // so the form must not supply one.
  isEmailIdentityFiltered(): boolean;
  // The filtered user's identities keyed by the name selectPlacements sends them under.
  getUserIdentities(): Record<string, string>;
  // Everything a pre-selection call for the entry whose targetPageIdentifier is entryKey would send with these
  // attributes, in the order selectPlacements merges them: identities, then filtered attributes, then session
  // attributes. The entry is named by its key, never by the call's identifier, which another entry can share.
  getOutgoingAttributes(attributes: Record<string, unknown>, entryKey?: string): Record<string, unknown>;
  // These attributes less those the workspace's attribute filter keeps off a call, so a value the filter removes never
  // names the target page a call goes out under.
  filterAttributes(attributes: Record<string, unknown>): Record<string, unknown>;
  // The defaults that call fills for these attributes, after the workspace's attribute filter.
  getPreselectFills(attributes: Record<string, unknown>, entryKey?: string): Record<string, string> | undefined;
  mappedEmailSha256Key?: string;
}

// Type names only: the values are shopper PII and these feed diagnostics sent over the network.
export function getIdentityTypes(user: IMParticleUser | null | undefined): string[] {
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

export function hasValidIdentity(filteredUser: IMParticleUser | null | undefined): boolean {
  return getIdentityTypes(filteredUser).length > 0;
}

export function formatIdentityTypes(types: string[]): string {
  return types.length > 0 ? types.join(',') : 'none';
}

// Stable per-user id, used to bind a persisted record to the user who was signed in when it
// was written so recovery can't dispatch one user's attributes under a different one.
export function getUserId(filteredUser: IMParticleUser | null | undefined): string | null {
  const mpid = filteredUser?.getMPID?.();
  return mpid == null ? null : String(mpid);
}

export function canDispatchPreselection(host: PreselectHost): boolean {
  return (
    !host.isTargetingDisabled() &&
    host.isPreselectionPrivacyAllowed() &&
    host.isForwardingAllowed()
  );
}

export function isReportingDiagnostics(host: PreselectHost): boolean {
  return (
    !host.isTargetingDisabled() &&
    host.isPreselectionPrivacyAllowed() &&
    host.isKitReady() &&
    host.isPreselectionEnabled()
  );
}

// While the core SDK delivers checkout intent and intent privacy allows it, the kit acts on intent signals.
export function checkoutIntentApplies(host: PreselectHost): boolean {
  return host.isCheckoutIntentActive() && host.isPreselectionPrivacyAllowed();
}

// While checkout intent applies, every entry waits for the confirm click, unless link clicks carry no intent: a
// checkout link could then never release the wait, so the entry keeps its dispatchDelayMs and a click releases it early.
export function pageViewsAwaitIntent(host: PreselectHost): boolean {
  return checkoutIntentApplies(host) && !host.isLinkIntentWithheld();
}
