// Sorts a payment label or a partner's payment type value into a small fixed set, so a shadow check can
// compare the method a shopper picked before a pre-selection with the one the target page reports.
// Only these names ever leave the kit, never the label or value they came from.
export const PAYMENT_FAMILIES = [
  'card',
  'apple_pay',
  'google_pay',
  'paypal',
  'venmo',
  'amazon_pay',
  'shop_pay',
  'klarna',
  'afterpay',
  'affirm',
  'cash_app',
  'sezzle',
  'samsung_pay',
] as const;

export type PaymentFamily = (typeof PAYMENT_FAMILIES)[number];

const FAMILY_PATTERNS: Array<[PaymentFamily, RegExp]> = [
  ['apple_pay', /\bapple ?pay\b/],
  ['google_pay', /\b(?:google ?pay|g ?pay|android ?pay)\b/],
  ['venmo', /\bvenmo\b/],
  ['paypal', /\bpay ?pal\b/],
  ['amazon_pay', /\bamazon ?pay\b/],
  ['shop_pay', /\bshop ?pay\b/],
  ['klarna', /\bklarna\b/],
  ['afterpay', /\b(?:after ?pay|clear ?pay)\b/],
  ['affirm', /\baffirm\b/],
  ['cash_app', /\bcash ?app\b/],
  ['sezzle', /\bsezzle\b/],
  ['samsung_pay', /\bsamsung ?pay\b/],
  ['card', /\b(?:credit|debit|card|cards|visa|master ?card|mc|amex|american express|discover)\b/],
];

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
  const found = FAMILY_PATTERNS.filter(([, pattern]) => pattern.test(words)).map(([family]) => family);
  // A wallet name wins over card words in the same label ("PayPal credit"), but two wallets are ambiguous.
  const wallets = found.filter((family) => family !== 'card');
  if (wallets.length === 1) {
    return wallets[0];
  }
  return wallets.length === 0 && found.length === 1 ? found[0] : undefined;
}

export function isPaymentFamily(value: unknown): value is PaymentFamily {
  return typeof value === 'string' && (PAYMENT_FAMILIES as readonly string[]).includes(value);
}

const PICKER_TYPES = ['radio', 'checkbox'];
const LABEL_FIELDS = ['label', 'aria_label', 'test_id', 'element_id', 'element_name'];

// The payment method an auto button click picked: a checked payment radio or checkbox, or a wallet button.
// Plain buttons and links only count when their label names a wallet, so "Place order" never reads as a pick.
export function paymentFamilyFromClick(attributes: Record<string, unknown> | undefined): PaymentFamily | undefined {
  if (!attributes) {
    return undefined;
  }
  const isPicker = PICKER_TYPES.includes(String(attributes.type));
  if (isPicker && String(attributes.checked) === 'false') {
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
