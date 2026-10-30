import {
    CONTROL_SELECTOR,
    hasComposedAncestor,
    isQuietIntentControl,
    isRoktElement,
    isUnsafeTextSource,
    isWalletNamedControl,
    vendorButtonKind,
} from './controls';

// Classifies a click, submit or frame focus as checkout intent for the Rokt kit.
// Reads only short control labels, never form field values, and stores nothing.
export type CheckoutIntentKind =
    | 'commit'
    | 'wallet'
    | 'checkout_step'
    | 'frame'
    | 'cart';

// A checkout segment may name its kind or its version, as /express-checkout, /checkout-v2 and /checkout-external do.
// Other hyphenated words make it a content slug, such as /help/checkout-faq or /products/self-checkout-kiosk.
const CHECKOUT_SEGMENT =
    '(?:(?:express|guest|quick|secure|complete|one-?page|single-?page|mobile)-)?checkouts?' +
    '(?:-(?:v\\d+|\\d+|flow|external|process|step(?:-\\d+)?))?';
const checkoutPath = new RegExp(
    '(?:^|\\/)(?:' + CHECKOUT_SEGMENT + '|payment|order|kasse|paiement|commander?|pago)(?:\\/|$)',
    'i'
);
// A route with a checkout segment itself, not just a payment or order one, which account pages also use.
const checkoutSegmentPath = new RegExp('(?:^|\\/)' + CHECKOUT_SEGMENT + '(?:\\/|$)', 'i');
// A confirmation page under a checkout route, such as /checkout/thankyou/<order> or /checkouts/<token>/thank_you, comes
// after the confirm click. "Complete" and "success" mark one only as the last word of a segment, so /complete-checkout
// and /checkout/complete-registration stay checkout routes.
const confirmationPath = /(?:^|[\/_-])(?:thank[-_]?you|thanks|confirmation|confirmed|receipt|received)(?:[\/_-]|$)|(?:^|[\/_-])(?:complete|completed|success)(?:\/|$)/i;
// A bare "Register" creates an account, rather than placing the order, on a checkout's sign-in or account step or in a
// form that asks for a password.
const bareRegister = /^register(?: now)?$/;
const accountStepPath = /(?:^|\/)(?:register|registration|login|log-in|signin|sign-in|signup|sign-up|account|create-account)(?:\/|$)/i;
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
    '^(?:buy now|purchase|register(?: now)?|complete (?:my |your )?registration|jetzt kaufen|kaufen|commander|(?:passer|valider) (?:la |ma )?commande|finalizar (?:la |mi )?compra|' +
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
// "Save and continue" also saves profile, address and card forms, so it is a step only on a checkout segment's route
// that isn't an account or confirmation page.
const routeGatedSteps = /^save and continue$/;
const CART_NOUN = '(?:(?:my|your|the) )?(?:shopping )?(?:cart|bag|basket)';
// "Add to bag" and "Add 2 to cart": a click that puts something in the cart.
const addToCartLabels = new RegExp('^add(?: [^ ]+){0,5} to ' + CART_NOUN + '$');
// "View cart", "Shopping bag", "Bag", and a count badge such as "1 item in bag",
// which reads "item in bag" once digits are stripped: a click that opens the cart.
const openCartLabels = new RegExp(
    '^(?:(?:(?:view|open|go to) )?' + CART_NOUN + '(?: items?)?' +
        '|items? in ' + CART_NOUN + ')$'
);
const WALLET_NAMES =
    'apple pay|google pay|paypal|venmo|amazon pay|shop pay|klarna|afterpay|clearpay|cash app(?: pay)?|affirm|sezzle|samsung pay';
const WALLET_VERBS =
    'pay|buy|purchase|order|book|donate|subscribe|check ?out|checkout|express checkout|continue|proceed|' +
    'complete purchase|place (?:my |your )?order';
// "Pay with Klarna", "Buy with GPay", "Continue to PayPal".
const walletPhrases = new RegExp(
    '^(?:(?:' + WALLET_VERBS + ')(?: now| securely)? (?:with|using|via|through|by) (?:' + WALLET_NAMES +
        ')(?: express(?: checkout)?| checkout)?|(?:continue|proceed|go) (?:to|with) (?:' + WALLET_NAMES + '))$'
);
// A wallet's own name on a button: "PayPal", "Klarna checkout", "Apple Pay logo".
const walletBrands = new RegExp(
    '^(?:' + WALLET_NAMES + ')(?: (?:checkout|check out|express(?: checkout)?|express pay|buy now|pay now|pay|now)' +
        '| (?:logo|icon|mark|button)(?: (?:logo|icon|mark|button))*)?$'
);
// The payment method a frame's focus picks, in the Rokt kit's family names.
export type PaymentFrameFamily =
    | 'apple_pay'
    | 'google_pay'
    | 'amazon_pay'
    | 'shop_pay'
    | 'card';
// Exact HTTPS hosts of hosted wallet button frames.
const walletFrameFamilies: { [host: string]: PaymentFrameFamily } = {
    'pay.google.com': 'google_pay',
    'applepay.cdn-apple.com': 'apple_pay',
    'payments.amazon.com': 'amazon_pay',
    'pay.shopify.com': 'shop_pay',
};
// PayPal serves its buttons and its card fields and pay-later messages from
// the same hosts; only the button frames are wallet taps.
const paypalFrameHosts = new Set(['www.paypal.com', 'www.sandbox.paypal.com']);
const PAYPAL_BUTTON_FRAME = /^\/smart\/(?:buttons|menu)(?:\/|$)/;
const PAYPAL_CARD_FRAME = /^\/smart\/card-fields?(?:\/|$)/;
// PayPal's JS SDK, used directly or wrapped by a processor, leaves its frames
// without a src and names them __zoid__paypal_<component>__ instead.
const PAYPAL_SDK_FRAME = /^__zoid__paypal_/;
const PAYPAL_SDK_BUTTON_FRAME = /^__zoid__paypal_(?:buttons|menu)__/;
// Stripe's quick-pay button frames; its other frames are card and form fields.
const STRIPE_WALLET_FRAME = /\/elements-inner-(?:payment-request|express-checkout)-/;
const STRIPE_CARD_FRAME = /\/elements-inner-card\b/;
// Hosted card-entry and fingerprint frames: focus there is typing card details.
// Some of these hosts also serve gift card and bank account fields, so none
// names a family.
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
    return checkoutPath.test(pathname) && !confirmationPath.test(pathname)
        ? 'checkout_path'
        : 'other';
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

// A cart button is often a bare icon, so its title names it when nothing else
// does. Only the cart rule reads the title. Opening the cart counts only for a
// control that opens it on the page, such as a flyout: one that leads to the cart
// page unloads before a call made on the click can return.
function cartControlAction(control: Element, cores: string[]): 'add' | 'open' | undefined {
    const title = cores.length ? undefined : normalize(control.getAttribute('title'));
    const texts = title ? [coreLabel(title)] : cores;
    if (texts.some(text => addToCartLabels.test(text))) {
        return 'add';
    }
    return (control.hasAttribute('aria-expanded') || control.hasAttribute('aria-haspopup')) &&
        texts.some(text => openCartLabels.test(text))
        ? 'open'
        : undefined;
}

// Which rule recognised the intent: a vendor's own markup, a phrase in the
// label, a wallet's bare name, a hosted frame, a form submitted after a confirm
// click, a merchant button named after its wallet, or a payment sheet the page
// opened.
export type CheckoutIntentSource =
    | 'vendor'
    | 'label'
    | 'brand'
    | 'frame'
    | 'submit'
    | 'name'
    | 'api';

export interface ICheckoutIntent {
    kind: Exclude<CheckoutIntentKind, 'frame'>;
    source: CheckoutIntentSource;
    // Set on a cart click that puts something in the cart, not one that opens it.
    adds?: true;
}

// Every field the browser counts as the form's own, form-attribute fields included. Read through the native getter
// where the browser has one, since a field named "elements" shadows the form's own property.
function formFields(form: HTMLFormElement): ArrayLike<Element> {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLFormElement.prototype, 'elements');
    return descriptor && descriptor.get ? descriptor.get.call(form) : form.elements;
}

// The form a button or input submits, which its form attribute can name from outside it.
function createsAccount(control: Element, pathname: string): boolean {
    const form =
        control instanceof HTMLButtonElement || control instanceof HTMLInputElement
            ? control.form
            : control.closest('form');
    return (
        accountStepPath.test(pathname) ||
        (!!form &&
            Array.prototype.some.call(
                formFields(form),
                (field: Element) => field instanceof HTMLInputElement && field.type === 'password'
            ))
    );
}

// "Buy now", "Purchase" and "Register" count only on a checkout route that isn't a
// confirmation page, and never on a plain link, which is navigation.
function isCommitLabel(text: string, isLink: boolean, pathname: string, control: Element): boolean {
    if (isLink) {
        return linkCommits.test(text);
    }
    return (
        commits.test(text) ||
        (routeGatedCommits.test(text) &&
            getIntentRouteClass(pathname) === 'checkout_path' &&
            !(bareRegister.test(text) && createsAccount(control, pathname)))
    );
}

// Classifies a clicked or submitting control found by findControl, in order:
// pickers, toggles and pay-later messages never count; a vendor's own wallet
// button counts before any label rule; a confirm label on any source counts
// before the look-alike exclusions veto; then a wallet-named control, wallet
// phrases and steps. An add-to-cart label, links included, or a control that
// opens the cart on the page counts only where none of those do.
export function classifyIntent(
    control: Element,
    pathname: string
): ICheckoutIntent | undefined {
    const vendor = vendorButtonKind(control);
    if (vendor === 'none') {
        return undefined;
    }
    if (vendor) {
        return isQuietIntentControl(control, vendor === 'wallet')
            ? undefined
            : { kind: vendor, source: 'vendor' };
    }
    const texts = labels(control);
    const cores = texts.map(coreLabel);
    const cartAction = cartControlAction(control, cores);
    let cart: ICheckoutIntent | undefined;
    if (cartAction === 'add') {
        cart = { kind: 'cart', source: 'label', adds: true };
    } else if (cartAction === 'open') {
        cart = { kind: 'cart', source: 'label' };
    }
    if (isQuietIntentControl(control, false, !!cart)) {
        return undefined;
    }
    // A bag button that opens a flyout counts only as a cart click.
    if (cart && control.hasAttribute('aria-expanded')) {
        return cart;
    }
    const isLink = control.matches('a[href]:not([role="button"])');
    if (cores.some(text => isCommitLabel(text, isLink, pathname, control))) {
        return { kind: 'commit', source: 'label' };
    }
    if (
        texts
            .concat(cores)
            .some(text => englishExclusions.test(text) || otherExclusions.test(text))
    ) {
        return cart;
    }
    if (isWalletNamedControl(control)) {
        return { kind: 'wallet', source: 'name' };
    }
    const isButton = !isLink && control.matches(CONTROL_SELECTOR);
    for (const text of cores) {
        if (isButton && walletPhrases.test(text)) {
            return { kind: 'wallet', source: 'label' };
        }
        if (isButton && walletBrands.test(text)) {
            return { kind: 'wallet', source: 'brand' };
        }
        if (
            steps.test(text) ||
            (isButton &&
                routeGatedSteps.test(text) &&
                checkoutSegmentPath.test(pathname) &&
                !confirmationPath.test(pathname) &&
                !accountStepPath.test(pathname))
        ) {
            return { kind: 'checkout_step', source: 'label' };
        }
    }
    return cart;
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

export interface IPaymentFrame {
    kind: 'wallet' | 'frame';
    family?: PaymentFrameFamily;
}

// Focus moving into a visible hosted wallet button counts as a wallet click;
// focus into hosted card fields or messages is only a frame. A family comes
// only from a frame that can draw no other method: PayPal's button frame also
// draws Pay Later, Venmo and its card form, Stripe's quick-pay frame draws
// Apple Pay or Google Pay by browser, and its payment form holds several.
export function classifyPaymentFrame(
    target: EventTarget | null,
    win: Window
): IPaymentFrame | undefined {
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
    // A frame that has its own src is judged by that address, never by its name.
    if (
        (!target.src || target.src === 'about:blank') &&
        PAYPAL_SDK_FRAME.test(target.name)
    ) {
        return PAYPAL_SDK_BUTTON_FRAME.test(target.name)
            ? { kind: 'wallet' }
            : { kind: 'frame' };
    }
    try {
        const url = new URL(target.src);
        const host = url.protocol === 'https:' ? url.hostname : '';
        if (paypalFrameHosts.has(host)) {
            if (PAYPAL_BUTTON_FRAME.test(url.pathname)) {
                return { kind: 'wallet' };
            }
            return PAYPAL_CARD_FRAME.test(url.pathname)
                ? { kind: 'frame', family: 'card' }
                : { kind: 'frame' };
        }
        if (Object.prototype.hasOwnProperty.call(walletFrameFamilies, host)) {
            return { kind: 'wallet', family: walletFrameFamilies[host] };
        }
        if (host === 'js.stripe.com') {
            if (STRIPE_WALLET_FRAME.test(url.pathname)) {
                return { kind: 'wallet' };
            }
            return STRIPE_CARD_FRAME.test(url.pathname)
                ? { kind: 'frame', family: 'card' }
                : { kind: 'frame' };
        }
        if (CARD_FRAME_DOMAINS.some(domain => isOnDomain(host, domain))) {
            return { kind: 'frame' };
        }
    } catch (e) {
        // An unparseable frame src is not a wallet frame.
    }
    return undefined;
}
