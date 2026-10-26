// Sorts a payment label or a partner's payment type value into a small fixed set, so a shadow check can
// compare the method a shopper picked before a pre-selection with the one the target page reports.
// Only these family names ever leave the kit, never the label or value they came from. Each pattern is tried
// against the label as lower-case words.
const FAMILY_PATTERNS = {
  apple_pay: /\bapple ?pay\b/,
  google_pay: /\b(?:google ?pay|g ?pay|android ?pay)\b/,
  venmo: /\bvenmo\b/,
  paypal: /\bpay ?pal\b/,
  amazon_pay: /\bamazon ?pay\b/,
  shop_pay: /\bshop ?pay\b/,
  klarna: /\bklarna\b/,
  afterpay: /\b(?:after ?pay|clear ?pay)\b/,
  affirm: /\baffirm\b/,
  cash_app: /\bcash ?app\b/,
  sezzle: /\bsezzle\b/,
  samsung_pay: /\bsamsung ?pay\b/,
  card: /\b(?:credit ?card|debit ?card|credit|debit|cards?|visa|master ?card|mc|am ?ex|american ?express|discover)\b/,
};

export type PaymentFamily = keyof typeof FAMILY_PATTERNS;

// Gift cards, store credit, points and codes pay with a balance or discount, not a payment method, so they are
// dropped before reading what is left: "Bonus Points | Credit Card, VISA" is a card, "Gift card" is nothing.
const NOT_A_METHOD = /\b(?:gift cards?|store credit|rewards?|points?|balance|vouchers?|promo codes?|coupons?)\b/g;
const MAX_WORDS = 12;

// Splits camelCase and separators, so "applePayButton" and "PAYPAL_EXPRESS" read as words.
function toWords(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[^a-z]+/g, ' ')
    .trim();
}

// The one family a short text names, or undefined when it names none, several or only a balance.
export function classifyPaymentFamily(text: unknown): PaymentFamily | undefined {
  if (typeof text !== 'string' || text.length > 128) {
    return undefined;
  }
  const words = toWords(text).replace(NOT_A_METHOD, ' ').replace(/\s+/g, ' ').trim();
  if (!words || words.split(' ').length > MAX_WORDS) {
    return undefined;
  }
  const found = (Object.keys(FAMILY_PATTERNS) as PaymentFamily[]).filter((family) => FAMILY_PATTERNS[family].test(words));
  // A wallet name wins over card words in the same label ("PayPal credit"), but two wallets are ambiguous.
  const wallets = found.filter((family) => family !== 'card');
  if (wallets.length === 1) {
    return wallets[0];
  }
  return wallets.length === 0 && found.length === 1 ? found[0] : undefined;
}

export function isPaymentFamily(value: unknown): value is PaymentFamily {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(FAMILY_PATTERNS, value);
}

// Payment methods are picked with radios. Checkboxes ("save my card", "I affirm I am over 18") and links
// ("learn more about Affirm") never count, so they cannot overwrite the real pick.
const PICKER_TYPE = 'radio';
// Element kinds that are never a radio or checkbox, for a click whose type was stripped.
const BUTTON_ELEMENTS = ['button', 'role', 'wallet'];
const LABEL_FIELDS = ['label', 'aria_label', 'test_id', 'element_id', 'element_name'];

// The payment method an auto button click picked: a checked payment radio, or a wallet button.
// Plain buttons and links only count when their label names a wallet, so "Place order" never reads as a pick.
export function paymentFamilyFromClick(attributes: Record<string, unknown> | undefined): PaymentFamily | undefined {
  if (!attributes) {
    return undefined;
  }
  // Data plans can strip fields, so a picker counts only when it says it is checked, and anything that says
  // it is unchecked never counts, whatever its type.
  const checked = String(attributes.checked);
  const isPicker = attributes.type === PICKER_TYPE;
  if (
    checked === 'false' ||
    (isPicker && checked !== 'true') ||
    attributes.type === 'checkbox' ||
    attributes.element === 'link'
  ) {
    return undefined;
  }
  // Without a type, only an element kind that cannot be a picker counts as a button.
  if (!isPicker && attributes.type === undefined && !BUTTON_ELEMENTS.includes(String(attributes.element))) {
    return undefined;
  }
  for (const field of LABEL_FIELDS) {
    const family = classifyPaymentFamily(attributes[field]);
    if (family && (isPicker || family !== 'card')) {
      return family;
    }
  }
  return undefined;
}

// The payment method a pick handed over by the core SDK names: the family of a frame the shopper moved into,
// or the first family the names of a checked payment radio's option read as. A picker may name a card.
export function paymentFamilyFromPick(pick: { names?: readonly unknown[]; family?: unknown }): PaymentFamily | undefined {
  if (isPaymentFamily(pick.family)) {
    return pick.family;
  }
  for (const name of Array.isArray(pick.names) ? pick.names : []) {
    const family = classifyPaymentFamily(name);
    if (family) {
      return family;
    }
  }
  return undefined;
}

const ARRIVAL_PAYMENT_KEYS = ['paymenttype', 'payment_type', 'paymentmethod', 'payment_method'];

// What the target page's own call says the shopper paid with: absent, a known family, or other.
export function describeArrivalPayment(attributes: Record<string, unknown> | undefined): PaymentFamily | 'absent' | 'other' {
  const key = attributes ? Object.keys(attributes).find((name) => ARRIVAL_PAYMENT_KEYS.includes(name.toLowerCase())) : undefined;
  const value = key ? attributes![key] : undefined;
  if (typeof value !== 'string' || !value.trim()) {
    return 'absent';
  }
  return classifyPaymentFamily(value) ?? 'other';
}
