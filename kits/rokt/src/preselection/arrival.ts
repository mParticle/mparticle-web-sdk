import {
  INTENT_ARRIVAL_WINDOW_MS,
  markPreselectArrival,
  recordPreselectCartArrival,
  recordPreselectTargetPath,
  wasPreselectTriggeredInAnyTab,
  type PreselectArrivalRecord,
} from './preselectArrivalStorage';
import { isDevicePersistenceDisabled } from '../storage';
import { sinceTriggerDetail, type PreselectDiagnosticDetails } from './diagnosticTiming';
import { describeArrivalPayment } from '../paymentFamily';
import { djb2 } from '../utils';
import {
  checkoutIntentApplies,
  getUserId,
  hasValidIdentity,
  isReportingDiagnostics,
  logOutcome,
  type PreselectHost,
} from './hostChecks';
import { findPreselectionConfigByIdentifier } from './attributeDefaults';
import { cartHoldsItems, digestCart, getCartPageViewEntry, readCartAttribute, targetPageKey } from './cartPageView';

export const intentPathHistory: Array<{ pathname: string; since: number }> = [];

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

// Runs on the partner's own target-page call. Reports a tab that reaches the target page without
// having fired, which a full navigation away from the trigger page otherwise hides.
// lookupAttributes, when given, are the attributes the call's entry is matched on, the same ones its cache keys were
// chosen on, so the two never name different entries; attributes are what the call sends.
export function reportPreselectArrival(
  host: PreselectHost,
  identifier: unknown,
  attributes?: Record<string, unknown>,
  lookupAttributes: Record<string, unknown> | undefined = attributes,
): void {
  if (!host.accountId || !isReportingDiagnostics(host)) {
    return;
  }

  const configEntry = findPreselectionConfigByIdentifier(host.accountId, identifier, lookupAttributes);
  if (!configEntry) {
    return;
  }

  // For the cart page-view entry, the path and cart it arrived with hold off later page views that would waste a call.
  const cartEntry = getCartPageViewEntry(host.accountId);
  if (cartEntry?.targetPageIdentifier === configEntry.targetPageIdentifier) {
    // The bare root is every page of a site that routes in its fragment or script, so it is never learned as the target.
    const pageKey = targetPageKey(window.location.pathname);
    if (pageKey !== '/') {
      recordPreselectTargetPath(host.accountId, configEntry.targetPageIdentifier, djb2(pageKey));
    }
    // Only a cart that held items had a call to use; an arrival without one drops an earlier hold.
    const cart = readCartAttribute(host, cartEntry.cartUserAttribute!);
    recordPreselectCartArrival(
      host.accountId,
      configEntry.targetPageIdentifier,
      cartHoldsItems(cart) ? digestCart(cart) : undefined,
      getUserId(host.filteredUser),
    );
  }

  const record = markPreselectArrival(host.accountId, configEntry.targetPageIdentifier);
  if (!record) {
    return;
  }

  // Reported only while checkout intent applies and the kit may forward, under the same privacy it was
  // captured with.
  if (checkoutIntentApplies(host) && host.isForwardingAllowed()) {
    logOutcome(host, 'arrived', 'intent_arrival', {
      ...describeIntentBeforeArrival(record),
      ...describePaymentShadow(record, attributes),
    });
  }

  if (record.firedAt !== undefined) {
    return;
  }

  const triggerSeen = record.triggeredAt !== undefined;
  logOutcome(host, 'missed', 'arrival_without_fire', {
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
  });
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
