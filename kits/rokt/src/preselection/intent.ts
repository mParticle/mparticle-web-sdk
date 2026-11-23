import { SDKEvent } from '@mparticle/web-sdk/internal';
import {
  recordPreselectIntent,
  recordPreselectPaymentPick,
  wasPreselectTriggeredRecently,
  type PreselectIntentKind,
} from './preselectArrivalStorage';
import { type PaymentFamily } from '../paymentFamily';
import { checkoutIntentApplies, type PreselectHost } from './hostChecks';
import { getCartIntentEntries, getPreselectionEntries, hasPreselectionConfigForAccount, stripTrailingSlash } from './entries';
import { intentPathHistory } from './arrival';

// A pathname-driven fire has no page-view event behind it, so attribute resolution falls
// through to the user attributes collectAttributes already reads as its fallback.
export const pathnameTriggerEvent = {} as SDKEvent;
const intentCommitTriggerEvent = {} as SDKEvent;
const intentWalletTriggerEvent = {} as SDKEvent;
export const intentCheckoutStepTriggerEvent = {} as SDKEvent;
const intentCartTriggerEvent = {} as SDKEvent;
export const cartPageViewTriggerEvent = {} as SDKEvent;
export type IntentTriggerKind = 'intent_commit' | 'intent_wallet' | 'intent_checkout_step' | 'intent_cart';
// What the core SDK hands the kit on a checkout intent: the kind, when the shopper acted, and from a
// newer core the rule that recognised it, the path it happened on and whether a cart click added to the cart.
export type PreselectIntentSignal = {
  kind: PreselectIntentKind;
  t: number;
  source?: string;
  pathname?: string;
  adds?: boolean;
};
// What a newer core SDK hands the kit when the shopper picks a payment method: the names of a payment
// radio's option, or the family of a payment frame they moved into. Only the family read from it is kept.
export type PreselectPaymentPickSignal = {
  t: number;
  pathname?: string;
  names?: readonly string[];
  family?: string;
};
export const INTENT_KINDS: PreselectIntentKind[] = ['commit', 'wallet', 'checkout_step', 'frame', 'cart'];
const INTENT_SOURCES = ['vendor', 'label', 'brand', 'frame', 'submit', 'name', 'api', 'selector'];
const MAX_INTENT_PATHNAME_LENGTH = 512;

// What a commit, wallet, cart or opted-in checkout-step click fires as, and the event that stands in for it.
export function intentTriggerKind(kind: PreselectIntentKind): IntentTriggerKind {
  if (kind === 'commit') return 'intent_commit';
  if (kind === 'checkout_step') return 'intent_checkout_step';
  return kind === 'cart' ? 'intent_cart' : 'intent_wallet';
}

export function intentTriggerEvent(kind: IntentTriggerKind): SDKEvent {
  if (kind === 'intent_commit') return intentCommitTriggerEvent;
  if (kind === 'intent_checkout_step') return intentCheckoutStepTriggerEvent;
  return kind === 'intent_cart' ? intentCartTriggerEvent : intentWalletTriggerEvent;
}

// A signal delivered this soon after its click is live rather than replayed from before the kit attached.
const LIVE_INTENT_MS = 1_000;

export function isLiveIntent(signal: PreselectIntentSignal): boolean {
  const age = Date.now() - signal.t;
  return age >= 0 && age < LIVE_INTENT_MS;
}

export function signalSource(signal: PreselectIntentSignal): string | undefined {
  return typeof signal.source === 'string' && INTENT_SOURCES.includes(signal.source) ? signal.source : undefined;
}

// Where a tap happened relative to the checkout: on an entry's page, after this tab saw an entry's
// trigger (the shopper left the checkout), or before any entry.
export function intentRouteOutsideEntry(accountId: string): 'left' | 'before_entry' {
  const identifiers = new Set(getPreselectionEntries(accountId).map((entry) => entry.targetPageIdentifier));
  return [...identifiers].some((identifier) => wasPreselectTriggeredRecently(accountId, identifier))
    ? 'left'
    : 'before_entry';
}

// How long a guest's wallet tap waits for the guest to be identified; a wallet sheet takes about 5 to 20 seconds.
export const IDENTITY_WAIT_MS = 20_000;

// The path a newer core carries on the signal, if it is a plain path.
export function signalPathname(signal: PreselectIntentSignal): string | undefined {
  const pathname = signal.pathname;
  return typeof pathname === 'string' && pathname.charAt(0) === '/' && pathname.length <= MAX_INTENT_PATHNAME_LENGTH
    ? stripTrailingSlash(pathname)
    : undefined;
}
export const handledIntentSignals = new Set<string>();
export const observedIntentKinds = new Set<string>();

export function intentKindOf(event: SDKEvent | undefined): IntentTriggerKind | undefined {
  if (event === intentCommitTriggerEvent) return 'intent_commit';
  if (event === intentWalletTriggerEvent) return 'intent_wallet';
  if (event === intentCheckoutStepTriggerEvent) return 'intent_checkout_step';
  if (event === intentCartTriggerEvent) return 'intent_cart';
  return undefined;
}

export function isIntentTriggerEvent(event: SDKEvent): boolean {
  return intentKindOf(event) !== undefined;
}

export function recordPreselectIntentPath(pathname: string, since = Date.now()): void {
  pathname = stripTrailingSlash(pathname);
  if (intentPathHistory[intentPathHistory.length - 1]?.pathname === pathname) return;
  intentPathHistory.push({ pathname, since });
  if (intentPathHistory.length > 8) intentPathHistory.shift();
  observedIntentKinds.clear();
}

// What a checkout intent signal needs before the kit acts on or logs it, checked again when a waiting tap ends.
export function intentSignalsApply(host: PreselectHost): boolean {
  return (
    !host.isTargetingDisabled() &&
    host.isForwardingAllowed() &&
    checkoutIntentApplies(host) &&
    host.isKitReady() &&
    host.isPreselectionEnabled() &&
    hasPreselectionConfigForAccount(host.accountId)
  );
}

// Each of the account's target pages keeps the intent for its arrival line, wherever the shopper was. A cart
// click counts only toward the target pages of entries that fire on one.
export function recordIntentForArrival(accountId: string, signal: PreselectIntentSignal): void {
  const entries = signal.kind === 'cart' ? getCartIntentEntries(accountId) : getPreselectionEntries(accountId);
  const identifiers = new Set(entries.map((entry) => entry.targetPageIdentifier));
  identifiers.forEach((identifier) => recordPreselectIntent(accountId, identifier, signal.kind, signal.t));
}

export function isPathnameTriggerEvent(event: SDKEvent): boolean {
  return event === pathnameTriggerEvent;
}

// The account a payment pick is recorded for, under the checkout intent gates, or undefined.
export function paymentPickAccount(host: PreselectHost): string | undefined {
  return intentSignalsApply(host) ? host.accountId! : undefined;
}

// When a payment pick happened: its signal's time, unless that is missing, not finite or still to come.
export function getPickTime(t: number | undefined): number {
  const now = Date.now();
  return typeof t === 'number' && Number.isFinite(t) && t <= now ? t : now;
}

export function recordPaymentFamily(accountId: string, family: PaymentFamily | undefined, t?: number): void {
  if (!family) return;
  const identifiers = new Set(getPreselectionEntries(accountId).map((entry) => entry.targetPageIdentifier));
  const pickedAt = getPickTime(t);
  identifiers.forEach((identifier) => recordPreselectPaymentPick(accountId, identifier, family, pickedAt));
}

// The core SDK hands over an Apple Pay session's pick only within a second of the tap that began it.
export const LATE_PAYMENT_PICK_MS = 1_000;

// A guest's wallet tap off every entry, waiting for the guest to be identified.
export interface IdentityWait {
  signal: PreselectIntentSignal;
  clickPathname: string;
  visitKey: string;
  // The route the shopper was on at the tap; object identity separates visits to the same page.
  route: (typeof intentPathHistory)[number] | undefined;
  timer: ReturnType<typeof setTimeout>;
}
