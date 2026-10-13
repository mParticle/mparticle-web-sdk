import {
    CONTROL_SELECTOR,
    findControl,
    isRoktElement,
    isWalletElement,
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
// Exact HTTPS hosts of hosted wallet and payment frames.
const frameHosts = new Set([
    'www.paypal.com',
    'www.sandbox.paypal.com',
    'pay.google.com',
    'applepay.cdn-apple.com',
    'js.stripe.com',
    'checkoutshopper-live.adyen.com',
    'payments.amazon.com',
    'pay.shopify.com',
]);

function getIntentRouteClass(pathname: string): 'checkout_path' | 'other' {
    return checkoutPath.test(pathname) ? 'checkout_path' : 'other';
}

function normalize(text: string | null | undefined): string | undefined {
    if (!text || text.length > 128) {
        return undefined;
    }
    return text
        .toLowerCase()
        .replace(/[’‘]/g, "'")
        .replace(/[0-9０-９$€£¥￥₹円.,，]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Labels come from aria-label then visible text. Only submit and button inputs
// have their value read, so a typed field value is never touched.
function labelSources(element: Element): Array<string | null> {
    if (
        element.children.length > 4 ||
        element.querySelector('input, select, textarea, [data-mp-no-track]')
    ) {
        return [];
    }
    let text: string | null = null;
    if (element instanceof HTMLInputElement) {
        const type = element.type;
        if (type === 'submit' || type === 'button') {
            text = element.value;
        } else if (type === 'image') {
            text = element.getAttribute('alt');
        }
    } else {
        text = element.textContent;
    }
    return [element.getAttribute('aria-label'), text];
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

export function classifyIntentControl(
    path: Array<EventTarget | null>,
    pathname: string
): CheckoutIntentKind | undefined {
    const control = findControl(path);
    return control ? classifyControl(control, pathname) : undefined;
}

function classifyControl(
    control: Element,
    pathname: string
): Exclude<CheckoutIntentKind, 'frame'> | undefined {
    const texts = labels(control);
    if (texts.some(text => exclusions.test(text))) {
        return undefined;
    }
    let button = false;
    if (!control.matches('a[href]')) {
        button = control.matches(CONTROL_SELECTOR) || isWalletElement(control);
    }
    if (button && isWalletElement(control)) {
        return 'wallet';
    }
    for (const text of texts) {
        const kind = classifyLabel(text, button, pathname);
        if (kind) {
            return kind;
        }
    }
    return undefined;
}

// Focus moving into a visible hosted wallet or payment frame.
export function classifyIntentFrame(
    target: EventTarget | null,
    win: Window
): 'frame' | undefined {
    if (
        win.document.visibilityState !== 'visible' ||
        !(target instanceof HTMLIFrameElement)
    ) {
        return undefined;
    }
    if (isRoktElement(target)) {
        return undefined;
    }
    try {
        const url = new URL(target.src);
        if (url.protocol === 'https:' && frameHosts.has(url.hostname)) {
            return 'frame';
        }
    } catch (e) {
        // An unparseable frame src is not a wallet frame.
    }
    return undefined;
}
