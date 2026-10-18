import {
    CONTROL_SELECTOR,
    hasComposedAncestor,
    isPickerOrToggle,
    isQuietIntentControl,
    isRoktElement,
    isUnsafeTextSource,
    vendorButtonKind,
    vendorWalletNames,
} from './controls';

// Classifies a click, submit or frame focus as checkout intent for the Rokt kit.
// Reads only short control labels, never form field values, and stores nothing.
export type CheckoutIntentKind =
    | 'commit'
    | 'wallet'
    | 'checkout_step'
    | 'frame';

const checkoutPath = /(?:^|\/)(?:checkouts?|payment|order|kasse|paiement|commander?|pago)(?:\/|$)/i;
// English look-alikes are whole words; the other languages stay substring
// matches, since several of them do not separate words with spaces.
const englishExclusions = new RegExp(
    '\\b(?:coupon|promo(?: code)?|newsletter|sign in|sign up|log in|login|add to (?:cart|bag|basket)|' +
        'gift card balance|(?:add|apply|redeem|check|enter|use) (?:a |an |your )?gift card|pay later|' +
        'interest free|as low as|learn more|prequalify|apply (?:now|for)|payment plan|available|accepted|' +
        'we accept|set up|add money|reload|top up|add to (?:apple|google) wallet|connect|link your|unlink|' +
        'remove|delete|edit|change|manage|use a different|switch)\\b|^pay in$|\\bpay in (?:installments|instalments)\\b'
);
const otherExclusions = new RegExp(
    [
        'gutschein|anmelden|warenkorb|bon cadeau|connexion|panier|cupón|iniciar sesión|carrito',
        'carrello|codice sconto|accedi|buono regalo|winkelwagen|kortingscode|inloggen|cadeaubon|achteraf betalen',
        'カート|クーポン|ログイン|会員登録|ギフト|後払い|メルマガ',
    ].join('|')
);
const englishCommits =
    '(?:(?:agree|accept|review) and )?(?:place|submit|complete|confirm|finali[sz]e)' +
    '(?!(?: [^ ]+){0,2} (?:another|new|next)(?: |$))(?! (?:[^ ]+ )?gift card)' +
    '(?: [^ ]+){0,2} (?:order|purchase|booking|reservation|payment|checkout|transaction)' +
    '(?: now| securely| and pay| (?:with|using) [^ ]+(?: [^ ]+)?)?(?: (?:total|subtotal|items?|tickets?))?' +
    '|pay(?: securely)?(?: now)?|(?:confirm|agree|accept|submit|order|book) and pay' +
    '|pay and place (?:my |your )?order|order with obligation to pay';
const otherCommits = [
    '(?:jetzt )?(?:zahlungs|kosten)pflichtig (?:bestellen|buchen)|(?:jetzt )?bezahlen|kauf abschließen|bestellung abschließen',
    'commander et payer|payer(?: maintenant)?|(?:confirmer|finaliser) (?:ma |la )?commande',
    "valider et payer|confirmer et payer|commande avec obligation de paiement|finaliser l'achat",
    '(?:realizar|confirmar|completar) (?:el |mi |la )?(?:pedido|compra|reserva)|finalizar (?:el |mi )?pedido|pagar(?: ahora)?',
    'pedido con obligación de pago',
    "(?:effettua|conferma|concludi|completa) (?:l'|il )?(?:ordine|acquisto)|ordine con obbligo di pagamento",
    'paga(?: ora| adesso)?|ordina e paga',
    '(?:nu )?betalen|bestellen en betalen|bestelling plaatsen|plaats bestelling|bestelling afronden',
    'bestelling met betalingsverplichting',
    '(?:この内容で|上記の?内容で)?ご?(?:注文|購入|予約|決済|お?支払い?)を?(?:確定|完了)(?:する)?',
    '(?:この内容で|上記の?内容で)ご?(?:注文|購入|予約)する|ご?注文する|決済する|(?:今すぐ|を)?支払う',
].join('|');
const commits = new RegExp('^(?:' + englishCommits + '|' + otherCommits + ')$');
// A plain link is navigation, so in English only an order or purchase it
// places, submits or completes counts as the confirm click.
const linkCommits = new RegExp(
    '^(?:(?:place|submit|complete)(?!(?: [^ ]+){0,2} (?:another|new|next)(?: |$))(?: [^ ]+){0,2} (?:order|purchase)|' +
        otherCommits +
        ')$'
);
const routeGatedCommits = new RegExp(
    '^(?:buy now|purchase|jetzt kaufen|kaufen|commander|(?:passer|valider) (?:la |ma )?commande|finalizar (?:la |mi )?compra|' +
        'comprar ahora|acquista ora|nu kopen|今すぐ購入|購入する|この内容で申し込む)$'
);
const steps = new RegExp(
    '^(?:' +
        [
            "(?:let's |lets |go to |proceed to |secure )?(?:check ?out|checkout)(?: now| securely| as guest)?",
            '(?:continue|proceed) to (?:payment|review|billing|shipping|delivery|order review)|review (?:my |your )?order',
            'guest checkout|(?:pay|continue|check ?out) (?:with|by) (?:card|credit card|debit card|credit or debit card)',
            'zur kasse|zur kasse gehen|auschecken|weiter zur zahlung',
            'passer à la caisse|continuer vers le paiement|procéder au paiement',
            'ir a caja|continuar al pago|tramitar pedido',
            "procedi al checkout|procedi all'acquisto|procedi al pagamento|vai alla cassa",
            'afrekenen|verder naar betalen|doorgaan naar betalen',
            'レジに進む|ご?(?:購入|注文)手続き(?:へ|に)(?:進む)?|お?支払い(?:へ|に)進む|(?:ご注文内容の)?確認画面へ(?:進む)?',
        ].join('|') +
        ')$'
);
const WALLET_NAMES =
    'apple pay|google pay|paypal|venmo|amazon pay|shop pay|klarna|afterpay|clearpay|cash app(?: pay)?|affirm|sezzle|samsung pay';
const WALLET_VERBS =
    'pay|buy|purchase|order|book|donate|subscribe|check ?out|checkout|express checkout|continue|proceed|' +
    'complete purchase|place (?:my |your )?order';
// "Pay with Klarna", "Buy with GPay", "Continue to PayPal". Each alternative
// captures the wallet it names.
const walletPhrases = new RegExp(
    '^(?:(?:' + WALLET_VERBS + ')(?: now| securely)? (?:with|using|via|through|by) (' + WALLET_NAMES +
        ')(?: express(?: checkout)?| checkout)?|(?:continue|proceed|go) (?:to|with) (' + WALLET_NAMES + '))$'
);
// A wallet's own name on a button: "PayPal", "Klarna checkout", "Apple Pay logo".
const walletBrands = new RegExp(
    '^(' + WALLET_NAMES + ')(?: (?:checkout|check out|express(?: checkout)?|express pay|buy now|pay now|pay|now)' +
        '| (?:logo|icon|mark|button)(?: (?:logo|icon|mark|button))*)?$'
);
// The wallets above as one bounded value each: "apple pay" reads apple_pay and
// "cash app pay" reads cash_app.
export type WalletBrand =
    | 'apple_pay'
    | 'google_pay'
    | 'paypal'
    | 'venmo'
    | 'amazon_pay'
    | 'shop_pay'
    | 'klarna'
    | 'afterpay'
    | 'clearpay'
    | 'cash_app'
    | 'affirm'
    | 'sezzle'
    | 'samsung_pay';
// Exact HTTPS hosts of hosted wallet button frames.
const walletFrameHosts = new Set([
    'pay.google.com',
    'applepay.cdn-apple.com',
    'payments.amazon.com',
    'pay.shopify.com',
]);
// PayPal serves its buttons and its card fields and pay-later messages from
// the same hosts; only the button frames are wallet taps.
const paypalFrameHosts = new Set(['www.paypal.com', 'www.sandbox.paypal.com']);
const PAYPAL_BUTTON_FRAME = /^\/smart\/(?:buttons|menu)(?:\/|$)/;
// Stripe's quick-pay button frames; its other frames are card and form fields.
const STRIPE_WALLET_FRAME = /\/elements-inner-(?:payment-request|express-checkout)-/;
// Hosted card-entry and fingerprint frames: focus there is typing card details.
const CARD_FRAME_DOMAINS = [
    'adyen.com',
    'braintreegateway.com',
    'cybersource.com',
    'squarecdn.com',
    'checkout.com',
];
// Keep these classes ASCII-only in source bytes to avoid mojibake parse failures
// when a host page forces non-UTF-8 decoding before JavaScript parse.
const TYPOGRAPHIC_APOSTROPHES = /[\u2019\u2018]/g;
const CURRENCY_AND_NUMBER_CHARS =
    /[0-9\uFF10-\uFF19$\u20AC\u00A3\u00A5\uFFE5\u20B9\u5186.,\uFF0C]/g;
const BRACKETED = /\([^()]*\)|\[[^[\]]*\]|\uFF08[^\uFF08\uFF09]*\uFF09|\uFF3B[^\uFF3B\uFF3D]*\uFF3D|\u3010[^\u3010\u3011]*\u3011/g;
// Spaces, punctuation, separators, arrows and symbols, CJK and full-width forms
// included, plus emoji halves and variation selectors.
const EDGE =
    '[\\s!-/:-@\\[-`{-~\\u00A1-\\u00BF\\u00D7\\u00F7\\u2000-\\u206F\\u20A0-\\u20CF\\u2190-\\u2BFF' +
    '\\u3000-\\u3003\\u3008-\\u3011\\u3014-\\u301F\\u30FB\\uD800-\\uDFFF\\uFE00-\\uFE0F' +
    '\\uFF01-\\uFF0F\\uFF1A-\\uFF20\\uFF3B-\\uFF40\\uFF5B-\\uFF65]+';
const EDGE_SYMBOLS = new RegExp('^' + EDGE + '|' + EDGE + '$', 'g');

function getIntentRouteClass(pathname: string): 'checkout_path' | 'other' {
    return checkoutPath.test(pathname) ? 'checkout_path' : 'other';
}

const SEPARATORS = /[-_|·•]/g;
const CURRENCY_CODES = /(?:^| )(?:usd|aud|cad|nzd|gbp|eur|chf|sgd|hkd|jpy|inr|mxn)(?= |$)|\b(?:a|au|ca|c|us|nz|hk|s)\$/g;
const WALLET_ALIASES: Array<[RegExp, string]> = [
    [/\bapplepay\b/g, 'apple pay'],
    [/\bg ?pay\b/g, 'google pay'],
    [/\bamazonpay\b/g, 'amazon pay'],
    [/\bshoppay\b/g, 'shop pay'],
    [/\bcashapp\b/g, 'cash app'],
];
// Labels longer than this are sentences: they neither match nor veto intent.
const MAX_LABEL_WORDS = 8;

function normalize(text: string | null | undefined): string | undefined {
    if (!text || text.length > 128) {
        return undefined;
    }
    let label = text
        .toLowerCase()
        .replace(TYPOGRAPHIC_APOSTROPHES, "'")
        .replace(/[&+]/g, ' and ')
        .replace(SEPARATORS, ' ')
        .replace(CURRENCY_CODES, ' ')
        .replace(CURRENCY_AND_NUMBER_CHARS, '')
        .replace(/\s+/g, ' ')
        .trim();
    WALLET_ALIASES.forEach(([alias, name]) => {
        label = label.replace(alias, name);
    });
    return label.split(' ').length > MAX_LABEL_WORDS ? undefined : label;
}

// The label without bracketed asides or the separators and symbols left at its
// edges, so "place order -" and "place order ( items)" both read "place order".
function coreLabel(text: string): string {
    const core = text
        .replace(BRACKETED, ' ')
        .replace(/\s+/g, ' ')
        .replace(EDGE_SYMBOLS, '');
    return core || text.replace(EDGE_SYMBOLS, '');
}

// Labels come from aria-label then visible text. Only submit and button inputs
// have their value read, so a typed field value is never touched. A control
// holding form fields or more than four children gives only its aria-label.
function labelSources(element: Element): Array<string | null> {
    if (element instanceof HTMLInputElement) {
        const type = element.type;
        let text: string | null = null;
        if (type === 'submit' || type === 'button') {
            text = element.value;
        } else if (type === 'image') {
            text = element.getAttribute('alt');
        }
        return [element.getAttribute('aria-label'), text];
    }
    if (element.children.length > 4 || isUnsafeTextSource(element)) {
        return [element.getAttribute('aria-label')];
    }
    return [element.getAttribute('aria-label'), element.textContent];
}

function labels(element: Element): string[] {
    return labelSources(element)
        .map(normalize)
        .filter((label): label is string => !!label);
}

// Which rule recognised the intent: a vendor's own markup, a phrase in the
// label, a wallet's bare name, a hosted frame, or a form submitted after a
// confirm click.
export type CheckoutIntentSource = 'vendor' | 'label' | 'brand' | 'frame' | 'submit';

export interface ICheckoutIntent {
    kind: Exclude<CheckoutIntentKind, 'frame'>;
    source: CheckoutIntentSource;
    // On a wallet tap, the one wallet its vendor markup or label names.
    brand?: WalletBrand;
}

// The wallet a normalized label names in full, such as "buy with apple pay".
function labelWalletName(text: string): string | undefined {
    const match = walletPhrases.exec(text) || walletBrands.exec(text);
    return match ? match[1] || match[2] : undefined;
}

// A wallet tap carries a brand only when the vendor markup and every label
// that names a wallet agree on one, and the control neither picks nor toggles.
function walletIntent(
    control: Element,
    source: CheckoutIntentSource,
    names: Array<string | undefined>
): ICheckoutIntent {
    const brands = names
        .filter((name): name is string => !!name)
        .map(
            name =>
                name
                    .replace(/^cash app pay$/, 'cash app')
                    .replace(/ /g, '_') as WalletBrand
        )
        .filter((brand, index, all) => all.indexOf(brand) === index);
    return brands.length === 1 && !isPickerOrToggle(control)
        ? { kind: 'wallet', source, brand: brands[0] }
        : { kind: 'wallet', source };
}

// "Buy now" and "Purchase" count only on a checkout route, and never on a plain
// link, which is navigation.
function isCommitLabel(text: string, isLink: boolean, pathname: string): boolean {
    if (isLink) {
        return linkCommits.test(text);
    }
    return (
        commits.test(text) ||
        (routeGatedCommits.test(text) &&
            getIntentRouteClass(pathname) === 'checkout_path')
    );
}

// Classifies a clicked or submitting control found by findControl, in order:
// pickers, toggles and pay-later messages never count; a vendor's own wallet
// button counts before any label rule; a confirm label on any source counts
// before the look-alike exclusions veto; then wallet phrases and steps.
export function classifyIntent(
    control: Element,
    pathname: string
): ICheckoutIntent | undefined {
    const vendor = vendorButtonKind(control);
    if (isQuietIntentControl(control, vendor === 'wallet') || vendor === 'none') {
        return undefined;
    }
    const texts = labels(control);
    const cores = texts.map(coreLabel);
    if (vendor === 'wallet') {
        // Markup matching two signatures names no brand, whatever the label says.
        const vendorNames = vendorWalletNames(control);
        return walletIntent(
            control,
            'vendor',
            vendorNames.length > 1
                ? []
                : vendorNames.concat(cores.map(labelWalletName))
        );
    }
    if (vendor) {
        return { kind: vendor, source: 'vendor' };
    }
    const isLink = control.matches('a[href]:not([role="button"])');
    if (cores.some(text => isCommitLabel(text, isLink, pathname))) {
        return { kind: 'commit', source: 'label' };
    }
    if (
        texts
            .concat(cores)
            .some(text => englishExclusions.test(text) || otherExclusions.test(text))
    ) {
        return undefined;
    }
    const isButton = !isLink && control.matches(CONTROL_SELECTOR);
    for (const text of cores) {
        if (isButton && walletPhrases.test(text)) {
            return walletIntent(control, 'label', cores.map(labelWalletName));
        }
        if (isButton && walletBrands.test(text)) {
            return walletIntent(control, 'brand', cores.map(labelWalletName));
        }
        if (steps.test(text)) {
            return { kind: 'checkout_step', source: 'label' };
        }
    }
    return undefined;
}

export function classifyIntentControl(
    control: Element,
    pathname: string
): Exclude<CheckoutIntentKind, 'frame'> | undefined {
    const intent = classifyIntent(control, pathname);
    return intent ? intent.kind : undefined;
}

// The host is the domain or one of its subdomains, never a look-alike suffix.
function isOnDomain(host: string, domain: string): boolean {
    return (
        host === domain ||
        (host.length > domain.length &&
            host.slice(host.length - domain.length - 1) === '.' + domain)
    );
}

// Focus moving into a visible hosted wallet button counts as a wallet click;
// focus into hosted card fields or messages is only a frame.
export function classifyIntentFrame(
    target: EventTarget | null,
    win: Window
): 'wallet' | 'frame' | undefined {
    if (
        win.document.visibilityState !== 'visible' ||
        !(target instanceof HTMLIFrameElement)
    ) {
        return undefined;
    }
    if (
        isRoktElement(target) ||
        hasComposedAncestor(target, '[data-mp-no-track]')
    ) {
        return undefined;
    }
    try {
        const url = new URL(target.src);
        const host = url.protocol === 'https:' ? url.hostname : '';
        if (paypalFrameHosts.has(host)) {
            return PAYPAL_BUTTON_FRAME.test(url.pathname) ? 'wallet' : 'frame';
        }
        if (walletFrameHosts.has(host)) {
            return 'wallet';
        }
        if (host === 'js.stripe.com') {
            return STRIPE_WALLET_FRAME.test(url.pathname) ? 'wallet' : 'frame';
        }
        if (CARD_FRAME_DOMAINS.some(domain => isOnDomain(host, domain))) {
            return 'frame';
        }
    } catch (e) {
        // An unparseable frame src is not a wallet frame.
    }
    return undefined;
}
