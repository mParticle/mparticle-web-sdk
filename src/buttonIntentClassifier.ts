// Classifies a click, submit or frame focus by intent. Reads only short control
// labels, never form field values, and stores nothing.
export type CheckoutIntentKind =
    | 'commit'
    | 'wallet'
    | 'checkout_step'
    | 'frame';

// Intents a button click can carry. Checkout kinds also feed the Rokt kit.
export type ButtonIntent =
    | Exclude<CheckoutIntentKind, 'frame'>
    | 'add_to_cart'
    | 'remove_from_cart';

export type ButtonElementKind = 'button' | 'input' | 'role' | 'link' | 'wallet';

export interface IButtonClick {
    intent?: ButtonIntent;
    label?: string;
    element: ButtonElementKind;
}

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
const cartPath = /(?:^|\/)(?:cart|bag|basket|warenkorb|panier|carrito|carrello|winkelwagen|カート)(?:\/|$)/i;
const addToCart = new RegExp(
    '^(?:' +
        [
            'add to (?:cart|bag|basket|trolley)',
            'in den warenkorb(?: legen)?|zum warenkorb hinzufügen',
            'ajouter au panier',
            'añadir al carrito|agregar al carrito|añadir a la cesta',
            'aggiungi al carrello',
            '(?:in|aan) (?:de )?winkelwagen|toevoegen aan (?:de )?winkelwagen',
            'カートに(?:入れる|追加)|カートへ(?:入れる|追加)',
        ].join('|') +
        ')$'
);
const removeFromCart = new RegExp(
    '^(?:remove from (?:cart|bag|basket)|aus dem warenkorb entfernen|retirer du panier|' +
        'eliminar del carrito|rimuovi dal carrello|verwijder uit (?:de )?winkelwagen|カートから削除)$'
);
// Bare remove or delete counts only on a cart page.
const routeGatedRemoves = /^(?:remove(?: item)?|delete(?: item)?|entfernen|löschen|supprimer|retirer|eliminar|quitar|rimuovi|elimina|verwijderen|verwijder|削除(?:する)?)$/;
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

const CONTROL_SELECTOR =
    'button, input[type="submit"], input[type="button"], input[type="image"], [role="button"]';

// Markup from the default themes of common store platforms. It names the intent
// in any language, so it is checked before the label. Remove controls that open
// a confirmation (Salesforce, BigCommerce) count when first clicked.
const STRUCTURAL_INTENTS: Array<[ButtonIntent, string]> = [
    [
        'add_to_cart',
        [
            'form[action*="/cart/add"] [name="add"]',
            '.single_add_to_cart_button',
            'a.add_to_cart_button.ajax_add_to_cart',
            '#product-addtocart-button',
            'form[data-role="tocart-form"] [type="submit"]',
            '#form-action-addToCart',
            '[data-button-type="add-cart"]',
            'button.add-to-cart',
            'button.add-to-cart-global',
            '[data-button-action="add-to-cart"]',
        ].join(', '),
    ],
    [
        'remove_from_cart',
        [
            'cart-remove-button a',
            'cart-remove-button button',
            'a[href*="/cart/change?"][href$="quantity=0"]',
            'a[href*="/cart/change?"][href*="quantity=0&"]',
            '.woocommerce-cart-form a.remove',
            'a.remove_from_cart_button',
            '.wc-block-cart-item__remove-link',
            '#shopping-cart-table a.action-delete',
            '.minicart-items a.action.delete',
            '.cart-remove[data-cart-itemid]',
            'button.remove-product[data-pid]',
            '[data-link-action="delete-from-cart"]',
            '[data-link-action="remove-from-cart"]',
        ].join(', '),
    ],
    [
        'checkout_step',
        [
            'button[name="checkout"]',
            'input[name="checkout"]',
            'a.checkout-button',
            '.woocommerce-mini-cart__buttons a.checkout',
            '.wc-block-cart__submit-button',
            '.wc-block-mini-cart__footer-checkout',
            '[data-role="proceed-to-checkout"]',
            '#top-cart-btn-checkout',
            '[data-primary-checkout-now-action]',
            '.checkout-btn',
        ].join(', '),
    ],
    [
        'commit',
        [
            '#place_order',
            '.wc-block-components-checkout-place-order-button',
            '.payment-method._active button.action.primary.checkout',
            'button.place-order',
            '#payment-confirmation button[type="submit"]',
        ].join(', '),
    ],
];

function structuralIntent(control: Element): ButtonIntent | undefined {
    for (const [intent, selector] of STRUCTURAL_INTENTS) {
        if (control.matches(selector)) {
            return intent;
        }
    }
    return undefined;
}

export function getIntentRouteClass(
    pathname: string
): 'checkout_path' | 'other' {
    return checkoutPath.test(pathname) ? 'checkout_path' : 'other';
}

// Rokt's own placements and frames never count as partner checkout controls.
function isRoktElement(element: Element): boolean {
    if (
        hasComposedAncestor(element, '[data-core-type], #rokt-controller-frame')
    ) {
        return true;
    }
    const src = element.getAttribute('src');
    if (src) {
        try {
            if (
                new URL(src, 'https://example.test').pathname.indexOf(
                    '/wsdk/'
                ) !== -1
            ) {
                return true;
            }
        } catch (e) {
            // An unparseable src is not a Rokt element.
        }
    }
    return false;
}

function isWalletElement(element: Element): boolean {
    return element.matches(
        'apple-pay-button, shop-pay-button, .gpay-button, #AmazonPayButton, [data-amazon-pay-button]'
    );
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
    if (element.tagName.toLowerCase() === 'input') {
        const typeAttr = element.getAttribute('type');
        const type = typeAttr ? typeAttr.toLowerCase() : typeAttr;
        if (type === 'submit' || type === 'button') {
            text = (element as HTMLInputElement).value;
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

// Masking needs \p{Nd} to see every script's digits. Browsers without Unicode
// property escapes send no labels at all.
const DIGIT_PATTERNS = (() => {
    try {
        return {
            run: new RegExp('\\p{Nd}{6,}', 'u'),
            number: new RegExp('\\p{Nd}+(?:[.,،٫٬]\\p{Nd}+)*', 'gu'),
        };
    } catch (e) {
        return undefined;
    }
})();

// The label as logged: lower case, at most 64 characters, digits and amounts
// masked. Dropped when it looks like an email, phone or card number.
export function maskLabel(raw: string | null | undefined): string | undefined {
    if (!raw || raw.length > 128 || !DIGIT_PATTERNS) {
        return undefined;
    }
    const text = raw
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    if (
        !text ||
        text.indexOf('@') !== -1 ||
        DIGIT_PATTERNS.run.test(text.replace(/[\s()\-‐-―]/g, ''))
    ) {
        return undefined;
    }
    const masked = text
        .replace(DIGIT_PATTERNS.number, '#')
        .slice(0, 64)
        .trim();
    return masked || undefined;
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

// Walks at most 12 entries of an event's composed path for the nearest control.
// Rokt elements, disabled controls and anything under data-mp-no-track are skipped.
// closest() over the composed tree: slots, parents, then shadow hosts.
function hasComposedAncestor(element: Element, selector: string): boolean {
    let node: Element | null = element;
    while (node) {
        if (node.matches(selector)) {
            return true;
        }
        const root =
            typeof node.getRootNode === 'function'
                ? (node.getRootNode() as ShadowRoot)
                : null;
        node =
            (node as Element & { assignedSlot?: Element | null })
                .assignedSlot ||
            node.parentElement ||
            (root && root.host) ||
            null;
    }
    return false;
}

function findControl(path: Array<EventTarget | null>): Element | undefined {
    let control: Element | undefined;
    for (const target of path.slice(0, 12)) {
        if (!(target instanceof Element)) {
            continue;
        }
        if (isRoktElement(target) || target.matches('[data-mp-no-track]')) {
            return undefined;
        }
        if (
            !control &&
            (target.matches(CONTROL_SELECTOR + ', a[href]') ||
                isWalletElement(target))
        ) {
            control = target;
        }
    }
    if (
        !control ||
        isRoktElement(control) ||
        hasComposedAncestor(control, '[data-mp-no-track]') ||
        control.matches(':disabled, [aria-disabled="true"]')
    ) {
        return undefined;
    }
    return control;
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
    const structural = structuralIntent(control);
    if (structural) {
        return structural === 'add_to_cart' || structural === 'remove_from_cart'
            ? undefined
            : structural;
    }
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

function cartIntent(
    texts: string[],
    pathname: string
): 'add_to_cart' | 'remove_from_cart' | undefined {
    for (const label of texts) {
        // Prices are already stripped, so drop the separators they leave behind.
        const text = label.replace(/[\s\-–—•|:·()]+$/, '');
        if (addToCart.test(text)) {
            return 'add_to_cart';
        }
        if (
            removeFromCart.test(text) ||
            (routeGatedRemoves.test(text) && cartPath.test(pathname))
        ) {
            return 'remove_from_cart';
        }
    }
    return undefined;
}

function elementKind(control: Element): ButtonElementKind {
    if (isWalletElement(control)) {
        return 'wallet';
    }
    if (control.matches('a[href]')) {
        return 'link';
    }
    const tag = control.tagName.toLowerCase();
    return tag === 'button' || tag === 'input' ? tag : 'role';
}

// Describes a clicked control for auto button tracking. A link counts only when
// its label carries an intent, since page views already cover navigation.
export function describeButtonClick(
    path: Array<EventTarget | null>,
    pathname: string
): IButtonClick | undefined {
    const control = findControl(path);
    if (!control) {
        return undefined;
    }
    const intent: ButtonIntent | undefined =
        structuralIntent(control) ||
        classifyControl(control, pathname) ||
        cartIntent(labels(control), pathname);
    const element = elementKind(control);
    if (element === 'link' && !intent) {
        return undefined;
    }
    const raw = labelSources(control).filter(
        source => !!source && source.trim()
    )[0];
    return { intent, label: maskLabel(raw), element };
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
