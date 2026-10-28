import {
  readNamespacedField,
  writeNamespacedField,
  removeNamespacedField,
  removeNamespacedFieldsWithPrefix,
  sessionStorageBackend,
  STORAGE_NAMESPACE_KEY,
} from './storage';
import { isPaymentFamily, type PaymentFamily } from './paymentFamily';
import { isObject } from './utils';

const PRESELECT_ARRIVAL_FIELD_PREFIX = 'preselectArrival:';
const ANY_TAB_TRIGGER_FIELD_PREFIX = 'preselectTriggerAnyTab:';
const CART_ADD_FIELD_PREFIX = 'preselectCartAdd:';
const TARGET_PATH_FIELD_PREFIX = 'preselectTargetPath:';
const CART_ARRIVAL_FIELD_PREFIX = 'preselectCartArrival:';

// mParticle's default session timeout; session end and logout clear the marker sooner.
export const ANY_TAB_TRIGGER_TTL_MS = 30 * 60_000;

// An intent older than this is not counted toward the arrival that follows it.
export const INTENT_ARRIVAL_WINDOW_MS = 30 * 60_000;

// How long an add-to-cart click stands in for a cart attribute holding items. A cart filled and never opened still
// holds its items when the shopper comes back; a week bounds the calls made for one emptied on another device.
export const CART_ADD_TTL_MS = 7 * 24 * 60 * 60_000;

// How long a learned target path holds cart page views off. Each arrival on it renews it, so a path the target page no
// longer uses frees up within a week.
export const TARGET_PATH_TTL_MS = 7 * 24 * 60 * 60_000;

export type PreselectIntentKind = 'commit' | 'wallet' | 'checkout_step' | 'frame' | 'cart';

// Strongest first: a stored intent is replaced only by a stronger kind, or by a later one of its own kind.
const INTENT_KIND_PRIORITY: PreselectIntentKind[] = ['commit', 'wallet', 'frame', 'checkout_step', 'cart'];

// Timestamps, the intent kind and a hash of the fired attributes, never identifiers or attribute values. Kept in sessionStorage
// (page memory under noFunctional) so the target page can tell whether this tab triggered, fired or
// saw checkout intent earlier. The last trigger time is also kept in localStorage, so it can tell
// whether any tab did.
export interface PreselectArrivalRecord {
  triggeredAt?: number;
  identitySeenAt?: number;
  firedAt?: number;
  firedDigest?: number;
  // Set when the latest fire came from a cart click, which never holds off a later confirm or wallet fire.
  firedByCart?: boolean;
  arrivedAt?: number;
  // A page whose path nearly matched the trigger path; the path itself is never kept.
  nearMissAt?: number;
  intentAt?: number;
  intentKind?: PreselectIntentKind;
  // The payment method the shopper last picked, as a family name, and the pick a fire went out with.
  paymentPick?: PaymentFamily;
  paymentPickAt?: number;
  paymentAtFire?: PaymentFamily;
}

const RECORD_FIELDS = [
  'triggeredAt',
  'identitySeenAt',
  'firedAt',
  'firedDigest',
  'arrivedAt',
  'nearMissAt',
  'paymentPickAt',
] as const;
const PAYMENT_FIELDS = ['paymentPick', 'paymentAtFire'] as const;

// When this tab last fired for a target page, and a hash of the attributes that fire sent.
export interface PreselectFireMark {
  firedAt: number;
  firedDigest?: number;
  firedByCart?: boolean;
  paymentAtFire?: PaymentFamily;
}

function buildFieldKey(accountId: string, targetPageIdentifier: string): string {
  return `${PRESELECT_ARRIVAL_FIELD_PREFIX}${accountId}:${targetPageIdentifier}`;
}

function buildAnyTabFieldKey(accountId: string, targetPageIdentifier: string): string {
  return `${ANY_TAB_TRIGGER_FIELD_PREFIX}${accountId}:${targetPageIdentifier}`;
}

function readRecord(fieldKey: string): PreselectArrivalRecord {
  const stored = readNamespacedField(STORAGE_NAMESPACE_KEY, fieldKey, sessionStorageBackend);
  const record: PreselectArrivalRecord = {};
  if (!isObject(stored)) {
    return record;
  }
  for (const field of RECORD_FIELDS) {
    if (typeof stored[field] === 'number') {
      record[field] = stored[field] as number;
    }
  }
  if (typeof stored.intentAt === 'number' && INTENT_KIND_PRIORITY.includes(stored.intentKind as PreselectIntentKind)) {
    record.intentAt = stored.intentAt;
    record.intentKind = stored.intentKind as PreselectIntentKind;
  }
  for (const field of PAYMENT_FIELDS) {
    if (isPaymentFamily(stored[field])) {
      record[field] = stored[field];
    }
  }
  if (record.firedAt !== undefined && stored.firedByCart === true) {
    record.firedByCart = true;
  }
  return record;
}

function writeRecord(fieldKey: string, record: PreselectArrivalRecord): boolean {
  return writeNamespacedField(STORAGE_NAMESPACE_KEY, fieldKey, record, sessionStorageBackend);
}

// A record whose arrival was already reported belongs to an earlier checkout, so a new trigger
// or fire starts a fresh one.
function readOpenRecord(fieldKey: string): PreselectArrivalRecord {
  const record = readRecord(fieldKey);
  return record.arrivedAt === undefined ? record : {};
}

export function recordPreselectTrigger(accountId: string, targetPageIdentifier: string, hasIdentity: boolean): void {
  const fieldKey = buildFieldKey(accountId, targetPageIdentifier);
  const record = readOpenRecord(fieldKey);
  const now = Date.now();
  writeRecord(fieldKey, {
    ...record,
    triggeredAt: record.triggeredAt ?? now,
    ...(hasIdentity ? { identitySeenAt: record.identitySeenAt ?? now } : {}),
  });
  writeNamespacedField(STORAGE_NAMESPACE_KEY, buildAnyTabFieldKey(accountId, targetPageIdentifier), {
    triggeredAt: now,
  });
}

// Whether any tab on this device saw the trigger within ANY_TAB_TRIGGER_TTL_MS, this one included.
export function wasPreselectTriggeredInAnyTab(accountId: string, targetPageIdentifier: string): boolean {
  const stored = readNamespacedField(STORAGE_NAMESPACE_KEY, buildAnyTabFieldKey(accountId, targetPageIdentifier));
  if (!isObject(stored) || typeof stored.triggeredAt !== 'number') {
    return false;
  }
  const age = Date.now() - stored.triggeredAt;
  return age >= 0 && age < ANY_TAB_TRIGGER_TTL_MS;
}

// The last add-to-cart click on this device, as its time and the mpid of the shopper who made it, or when the add was
// last forgotten. Kept in localStorage, which every tab shares, so it outlives the session as the page's own cart
// attribute does, until the page sets that attribute, the shopper logs out or CART_ADD_TTL_MS passes. A click reaches
// the kit after the next paint, so one made before the add was last forgotten, in any tab, can arrive after it and is
// ignored.
export function recordPreselectCartAdd(accountId: string, t: number, mpid: string): void {
  const field = `${CART_ADD_FIELD_PREFIX}${accountId}`;
  const stored = readNamespacedField(STORAGE_NAMESPACE_KEY, field);
  // A late click never replaces a newer add, nor one forgotten since.
  const latest = isObject(stored) ? (stored.addedAt ?? stored.forgottenAt) : undefined;
  if (typeof latest === 'number' && t <= latest) {
    return;
  }
  writeNamespacedField(STORAGE_NAMESPACE_KEY, field, { addedAt: t, mpid });
}

// Counts only for the shopper who added, so another shopper on the same device never inherits it. Either record is
// dropped once CART_ADD_TTL_MS old.
export function wasPreselectCartAdded(accountId: string, mpid: string | null): boolean {
  const field = `${CART_ADD_FIELD_PREFIX}${accountId}`;
  const stored = readNamespacedField(STORAGE_NAMESPACE_KEY, field);
  if (!isObject(stored)) {
    return false;
  }
  const addedAt = typeof stored.addedAt === 'number' ? stored.addedAt : undefined;
  const at = addedAt ?? stored.forgottenAt;
  if (typeof at !== 'number') {
    return false;
  }
  const age = Date.now() - at;
  if (age >= 0 && age < CART_ADD_TTL_MS) {
    return addedAt !== undefined && mpid !== null && stored.mpid === mpid;
  }
  removeNamespacedField(STORAGE_NAMESPACE_KEY, field);
  return false;
}

// Keeps when the add was forgotten only where a late click could bring it back. Otherwise, as under noTargeting or for
// an account with no cart page view, it removes what is there and writes nothing.
export function forgetPreselectCartAdd(accountId: string, keepForgetTime: boolean): void {
  const field = `${CART_ADD_FIELD_PREFIX}${accountId}`;
  if (keepForgetTime) {
    writeNamespacedField(STORAGE_NAMESPACE_KEY, field, { forgottenAt: Date.now() });
  } else {
    removeNamespacedField(STORAGE_NAMESPACE_KEY, field);
  }
}

// Unlike a trigger or fire, a near miss never reopens a reported arrival: the target page's own path
// can nearly match, and reopening would drop the fire that arrival already counted.
export function recordPreselectNearMiss(accountId: string, targetPageIdentifier: string): void {
  const fieldKey = buildFieldKey(accountId, targetPageIdentifier);
  const record = readRecord(fieldKey);
  if (record.arrivedAt !== undefined || record.nearMissAt !== undefined) return;
  writeRecord(fieldKey, { ...record, nearMissAt: Date.now() });
}

// Returns the earlier fire this one built on, if it was still within the window, so a failed call can be
// rolled back to it. The window keeps the first fire's time, unless only a cart click fired before; the
// digest and whether the fire came from a cart click follow the latest fire.
export function recordPreselectFired(
  accountId: string,
  targetPageIdentifier: string,
  digest?: number,
  byCart = false,
): PreselectFireMark | undefined {
  const fieldKey = buildFieldKey(accountId, targetPageIdentifier);
  const record = readOpenRecord(fieldKey);
  // A fire past the window starts a fresh one, so the one-per-checkout guard keeps working.
  const previous: PreselectFireMark | undefined =
    record.firedAt !== undefined && isWithinWindow(record.firedAt)
      ? {
          firedAt: record.firedAt,
          ...(record.firedDigest !== undefined ? { firedDigest: record.firedDigest } : {}),
          ...(record.firedByCart ? { firedByCart: true } : {}),
          ...(record.paymentAtFire !== undefined ? { paymentAtFire: record.paymentAtFire } : {}),
        }
      : undefined;
  // The shadow payment check compares the pick this fire went out with, not one made after it.
  const pickAtFire =
    record.paymentPick !== undefined && record.paymentPickAt !== undefined && isWithinWindow(record.paymentPickAt)
      ? record.paymentPick
      : undefined;
  writeRecord(
    fieldKey,
    withFireMark(record, {
      firedAt: previous && !(previous.firedByCart && !byCart) ? previous.firedAt : Date.now(),
      firedDigest: digest,
      ...(byCart ? { firedByCart: true } : {}),
      paymentAtFire: pickAtFire,
    }),
  );
  return previous;
}

// Rolls back a fire whose call failed or was dropped: an earlier successful fire keeps its time and digest,
// and otherwise the fire is forgotten, so it neither blocks a later fire nor counts as one. A mark a later
// fire has since replaced, with other attributes, belongs to that fire and stays.
export function restorePreselectFired(
  accountId: string,
  targetPageIdentifier: string,
  previous?: PreselectFireMark,
  ownDigest?: number,
): void {
  const fieldKey = buildFieldKey(accountId, targetPageIdentifier);
  const record = readOpenRecord(fieldKey);
  if (record.firedAt === undefined || record.firedDigest !== ownDigest) {
    return;
  }
  writeRecord(fieldKey, withFireMark(record, previous));
}

function withFireMark(record: PreselectArrivalRecord, mark?: PreselectFireMark): PreselectArrivalRecord {
  const rest = { ...record };
  delete rest.firedAt;
  delete rest.firedDigest;
  delete rest.firedByCart;
  delete rest.paymentAtFire;
  if (!mark) return rest;
  return {
    ...rest,
    firedAt: mark.firedAt,
    ...(mark.firedDigest !== undefined ? { firedDigest: mark.firedDigest } : {}),
    ...(mark.firedByCart ? { firedByCart: true } : {}),
    ...(mark.paymentAtFire !== undefined ? { paymentAtFire: mark.paymentAtFire } : {}),
  };
}

// Whether this tab saw the target page's trigger within INTENT_ARRIVAL_WINDOW_MS and has not arrived since,
// so a later tap elsewhere comes after the shopper left the checkout.
export function wasPreselectTriggeredRecently(accountId: string, targetPageIdentifier: string): boolean {
  const record = readOpenRecord(buildFieldKey(accountId, targetPageIdentifier));
  if (record.triggeredAt === undefined) {
    return false;
  }
  const age = Date.now() - record.triggeredAt;
  return age >= 0 && age < INTENT_ARRIVAL_WINDOW_MS;
}

// Whether this tab fired for the target page within INTENT_ARRIVAL_WINDOW_MS and has not arrived on it
// since, so the checkout already has its pre-selection. Given a digest, a fire whose stored digest differs
// does not count, so changed attributes can fire again; an unknown digest on either side still counts.
// A confirm or wallet fire passes ignoreCartFire, so an earlier cart click's fire, whose call a navigation may
// have cut off, never holds it off.
export function wasPreselectFiredRecently(
  accountId: string,
  targetPageIdentifier: string,
  digest?: number,
  ignoreCartFire = false,
): boolean {
  const record = readOpenRecord(buildFieldKey(accountId, targetPageIdentifier));
  if (record.firedAt === undefined || (ignoreCartFire && record.firedByCart)) {
    return false;
  }
  if (digest !== undefined && record.firedDigest !== undefined && record.firedDigest !== digest) {
    return false;
  }
  const age = Date.now() - record.firedAt;
  return age >= 0 && age < INTENT_ARRIVAL_WINDOW_MS;
}

// Keeps the strongest kind this tab saw, and the latest time for that kind. A stored intent past
// INTENT_ARRIVAL_WINDOW_MS no longer counts, so any kind replaces it.
export function recordPreselectIntent(
  accountId: string,
  targetPageIdentifier: string,
  kind: PreselectIntentKind,
  t: number,
): void {
  const fieldKey = buildFieldKey(accountId, targetPageIdentifier);
  const record = readOpenRecord(fieldKey);
  if (record.intentAt !== undefined && record.intentKind !== undefined && isIntentRecent(record.intentAt)) {
    const storedRank = INTENT_KIND_PRIORITY.indexOf(record.intentKind);
    const rank = INTENT_KIND_PRIORITY.indexOf(kind);
    if (storedRank < rank || (storedRank === rank && record.intentAt >= t)) {
      return;
    }
  }
  writeRecord(fieldKey, { ...record, intentAt: t, intentKind: kind });
}

function isWithinWindow(at: number): boolean {
  const age = Date.now() - at;
  return age >= 0 && age < INTENT_ARRIVAL_WINDOW_MS;
}

function isIntentRecent(intentAt: number): boolean {
  return isWithinWindow(intentAt);
}

// Keeps the latest payment method picked in this tab, for the shadow payment check on arrival.
export function recordPreselectPaymentPick(
  accountId: string,
  targetPageIdentifier: string,
  family: PaymentFamily,
  t: number,
): void {
  const fieldKey = buildFieldKey(accountId, targetPageIdentifier);
  const record = readRecord(fieldKey);
  // A pick never reopens a reported arrival; the next trigger or fire opens a fresh record.
  if (record.arrivedAt !== undefined || (record.paymentPickAt !== undefined && record.paymentPickAt > t)) {
    return;
  }
  writeRecord(fieldKey, { ...record, paymentPick: family, paymentPickAt: t });
}

// Returns what this tab recorded before its first arrival on the target page, and undefined for
// every later arrival until a new trigger or fire opens a fresh record.
export function markPreselectArrival(
  accountId: string,
  targetPageIdentifier: string,
): PreselectArrivalRecord | undefined {
  const fieldKey = buildFieldKey(accountId, targetPageIdentifier);
  const record = readRecord(fieldKey);
  if (record.arrivedAt !== undefined) {
    return undefined;
  }
  if (!writeRecord(fieldKey, { ...record, arrivedAt: Date.now() })) {
    return undefined;
  }
  return record;
}

function buildCartArrivalFieldKey(accountId: string, targetPageIdentifier: string): string {
  return `${CART_ARRIVAL_FIELD_PREFIX}${accountId}:${targetPageIdentifier}`;
}

// A hash of the cart this tab last reached the target page with, never the cart itself, and the mpid of the shopper
// who did. Kept apart from the arrival record, which a later trigger or intent reopens. An arrival with no cart to hold
// removes the last one.
export function recordPreselectCartArrival(
  accountId: string,
  targetPageIdentifier: string,
  cartDigest: number | undefined,
  mpid: string | null,
): void {
  const field = buildCartArrivalFieldKey(accountId, targetPageIdentifier);
  if (cartDigest === undefined || mpid === null) {
    removeNamespacedField(STORAGE_NAMESPACE_KEY, field, sessionStorageBackend);
    return;
  }
  writeNamespacedField(
    STORAGE_NAMESPACE_KEY,
    field,
    { arrivedAt: Date.now(), cartDigest, mpid },
    sessionStorageBackend,
  );
}

// Whether this tab reached the target page within INTENT_ARRIVAL_WINDOW_MS holding the cart it holds now, and has not
// fired for that target since. Read from the fire mark, so a fire that is rolled back no longer ends it.
export function wasCartUnchangedSinceArrival(
  accountId: string,
  targetPageIdentifier: string,
  cartDigest: number,
  mpid: string | null,
): boolean {
  const stored = readNamespacedField(
    STORAGE_NAMESPACE_KEY,
    buildCartArrivalFieldKey(accountId, targetPageIdentifier),
    sessionStorageBackend,
  );
  if (
    !isObject(stored) ||
    typeof stored.arrivedAt !== 'number' ||
    stored.cartDigest !== cartDigest ||
    mpid === null ||
    stored.mpid !== mpid
  ) {
    return false;
  }
  // A fire, or this shopper's add-to-cart click, since the arrival ends it, even before the cart attribute catches up.
  const { firedAt } = readRecord(buildFieldKey(accountId, targetPageIdentifier));
  const cartAdd = readNamespacedField(STORAGE_NAMESPACE_KEY, `${CART_ADD_FIELD_PREFIX}${accountId}`);
  const addedAt =
    isObject(cartAdd) && typeof cartAdd.addedAt === 'number' && cartAdd.mpid === mpid ? cartAdd.addedAt : undefined;
  return (
    isWithinWindow(stored.arrivedAt) &&
    !(firedAt !== undefined && firedAt >= stored.arrivedAt) &&
    !(addedAt !== undefined && addedAt >= stored.arrivedAt)
  );
}

// A hash of the path the target page was last reached on, never the path itself, and when. Kept in localStorage, which
// every tab shares, so a later visit to that path is known before the page makes its own call.
export function recordPreselectTargetPath(accountId: string, targetPageIdentifier: string, pathDigest: number): void {
  writeNamespacedField(STORAGE_NAMESPACE_KEY, `${TARGET_PATH_FIELD_PREFIX}${accountId}:${targetPageIdentifier}`, {
    pathDigest,
    learnedAt: Date.now(),
  });
}

export function isPreselectTargetPath(accountId: string, targetPageIdentifier: string, pathDigest: number): boolean {
  const stored = readNamespacedField(
    STORAGE_NAMESPACE_KEY,
    `${TARGET_PATH_FIELD_PREFIX}${accountId}:${targetPageIdentifier}`,
  );
  if (!isObject(stored) || stored.pathDigest !== pathDigest || typeof stored.learnedAt !== 'number') {
    return false;
  }
  const age = Date.now() - stored.learnedAt;
  return age >= 0 && age < TARGET_PATH_TTL_MS;
}

export function clearPreselectArrivals(accountId: string): void {
  removeNamespacedFieldsWithPrefix(
    STORAGE_NAMESPACE_KEY,
    `${PRESELECT_ARRIVAL_FIELD_PREFIX}${accountId}:`,
    sessionStorageBackend,
  );
  removeNamespacedFieldsWithPrefix(
    STORAGE_NAMESPACE_KEY,
    `${CART_ARRIVAL_FIELD_PREFIX}${accountId}:`,
    sessionStorageBackend,
  );
  removeNamespacedFieldsWithPrefix(STORAGE_NAMESPACE_KEY, `${ANY_TAB_TRIGGER_FIELD_PREFIX}${accountId}:`);
}
