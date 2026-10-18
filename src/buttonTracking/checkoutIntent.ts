import {
    CONTROL_SELECTOR,
    hasComposedAncestor,
    isQuietIntentControl,
    isRoktElement,
    isUnsafeTextSource,
    vendorButtonKind,
} from './controls';

// Classifies a click, submit or frame focus as checkout intent for the Rokt kit.
// Reads only short control labels, never form field values, and stores nothing.
export type CheckoutIntentKind =
    | 'commit'
    | 'wallet'
    | 'checkout_step'
    | 'frame';

const checkoutPath = /(?:^|\/)(?:checkouts?|payment|order|kasse|paiement|commander?|pago)(?:\/|$)/i;
const exclusions = new RegExp(
    [
        'coupon|promo|newsletter|sign in|add to cart|gift card|pay later|pay in|payment plan|learn more',
        'gutschein|anmelden|warenkorb|bon cadeau|connexion|panier|cupón|iniciar sesión|carrito',
        'carrello|codice sconto|accedi|buono regalo|winkelwagen|kortingscode|inloggen|cadeaubon|achteraf betalen',
        'カート|クーポン|ログイン|会員登録|ギフト|後払い|メルマガ',
    ].join('|')
);
const commits = new RegExp(
    '^(?:' +
        [
            '(?:place|submit|complete|confirm|finali[sz]e)(?!(?: [^ ]+){0,2} (?:another|new|next)(?: |$))(?: [^ ]+){0,2} (?:order|purchase|booking|reservation|payment|checkout)',
            'pay(?: securely)?(?: now)?|confirm and pay|order and pay|order with obligation to pay',
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
        ].join('|') +
        ')$'
);
const routeGatedCommits = new RegExp(
    '^(?:buy now|purchase|jetzt kaufen|kaufen|commander|(?:passer|valider) (?:la |ma )?commande|finalizar (?:la |mi )?compra|' +
        'comprar ahora|acquista ora|nu kopen|今すぐ購入|購入する|この内容で申し込む)$'
);
const steps = new RegExp(
    '^(?:' +
        [
            'checkout|check out|check-out|continue to payment|proceed to checkout',
            'zur kasse|zur kasse gehen|auschecken|weiter zur zahlung',
            'passer à la caisse|continuer vers le paiement|procéder au paiement',
            'ir a caja|continuar al pago|tramitar pedido',
            "procedi al checkout|procedi all'acquisto|procedi al pagamento|vai alla cassa",
            'afrekenen|verder naar betalen|doorgaan naar betalen',
            'レジに進む|ご?(?:購入|注文)手続き(?:へ|に)(?:進む)?|お?支払い(?:へ|に)進む|(?:ご注文内容の)?確認画面へ(?:進む)?',
        ].join('|') +
        ')$'
);
const wallets = /^(?:apple pay|google pay|paypal|venmo|amazon pay|shop pay|klarna|afterpay|affirm)$/;
// Exact HTTPS hosts of hosted payment frames. Their frames are wallet buttons
// except the card entry fields and pay-later messages some of them also serve.
const walletFrameHosts = new Set([
    'www.paypal.com',
    'www.sandbox.paypal.com',
    'pay.google.com',
    'applepay.cdn-apple.com',
    'payments.amazon.com',
    'pay.shopify.com',
    'checkoutshopper-live.adyen.com',
]);
const NON_WALLET_FRAME = /^\/(?:smart\/card-fields?|credit-presentment)(?:\/|$)|\/securedfields\//;
// Stripe's quick-pay button frames; its other frames are card and form fields.
const STRIPE_WALLET_FRAME = /\/elements-inner-(?:payment-request|express-checkout)-/;
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

function normalize(text: string | null | undefined): string | undefined {
    if (!text || text.length > 128) {
        return undefined;
    }
    return text
        .toLowerCase()
        .replace(TYPOGRAPHIC_APOSTROPHES, "'")
        .replace(CURRENCY_AND_NUMBER_CHARS, '')
        .replace(/\s+/g, ' ')
        .trim();
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

function classifyLabel(
    text: string,
    button: boolean,
    pathname: string
): Exclude<CheckoutIntentKind, 'frame'> | undefined {
    if (
        commits.test(text) ||
        (routeGatedCommits.test(text) &&
            getIntentRouteClass(pathname) === 'checkout_path')
    ) {
        return 'commit';
    }
    if (button && wallets.test(text)) {
        return 'wallet';
    }
    if (steps.test(text)) {
        return 'checkout_step';
    }
    return undefined;
}

// Classifies a clicked or submitting control found by findControl. Pickers,
// toggles and pay-later messages never count. A vendor's own wallet button
// counts before any label rule, so its Pay Later variant is a wallet too.
export function classifyIntentControl(
    control: Element,
    pathname: string
): Exclude<CheckoutIntentKind, 'frame'> | undefined {
    const vendor = vendorButtonKind(control);
    if (isQuietIntentControl(control, vendor === 'wallet') || vendor === 'none') {
        return undefined;
    }
    if (vendor) {
        return vendor;
    }
    const texts = labels(control);
    const cores = texts.map(coreLabel);
    if (texts.concat(cores).some(text => exclusions.test(text))) {
        return undefined;
    }
    let button = false;
    if (!control.matches('a[href]')) {
        button = control.matches(CONTROL_SELECTOR);
    }
    for (const text of cores) {
        const kind = classifyLabel(text, button, pathname);
        if (kind) {
            return kind;
        }
    }
    return undefined;
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
        if (walletFrameHosts.has(host)) {
            return NON_WALLET_FRAME.test(url.pathname) ? 'frame' : 'wallet';
        }
        if (host === 'js.stripe.com') {
            return STRIPE_WALLET_FRAME.test(url.pathname) ? 'wallet' : 'frame';
        }
    } catch (e) {
        // An unparseable frame src is not a wallet frame.
    }
    return undefined;
}
