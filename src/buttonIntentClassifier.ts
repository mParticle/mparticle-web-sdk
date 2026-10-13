// Classifies a click, submit or frame focus as checkout intent, and describes a
// clicked button for auto button tracking. Reads only short control labels,
// never form field values, and stores nothing.
export type CheckoutIntentKind =
    | 'commit'
    | 'wallet'
    | 'checkout_step'
    | 'frame';

export type ButtonElementKind = 'button' | 'input' | 'role' | 'wallet';

export type ButtonLabelSource =
    | 'labelledby'
    | 'aria'
    | 'text'
    | 'alt'
    | 'title'
    | 'value'
    | 'none';

export interface IButtonClick {
    label?: string;
    labelSource: ButtonLabelSource;
    ariaLabel?: string;
    icon?: string;
    element: ButtonElementKind;
    type: string;
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

// Walks at most 12 entries of an event's composed path for the nearest control.
// Rokt elements, disabled controls and anything under data-mp-no-track are skipped.
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

function elementKind(control: Element): ButtonElementKind {
    if (isWalletElement(control)) {
        return 'wallet';
    }
    const tag = control.tagName.toLowerCase();
    return tag === 'button' || tag === 'input' ? tag : 'role';
}

const EDITABLE = '[contenteditable]:not([contenteditable="false"])';

// Text that may hold what a shopper typed or what the page opted out: form
// fields, editable regions, and anything under data-mp-no-track.
function isUnsafeTextSource(element: Element): boolean {
    return (
        element.matches(
            'input, select, textarea, option, optgroup, datalist, ' + EDITABLE
        ) ||
        !!element.querySelector(
            'input, select, textarea, [data-mp-no-track], ' + EDITABLE
        ) ||
        hasComposedAncestor(
            element,
            'select, datalist, textarea, [data-mp-no-track], ' + EDITABLE
        )
    );
}

function textOf(element: Element | null): string {
    return element && !isUnsafeTextSource(element) && element.textContent
        ? element.textContent.trim()
        : '';
}

// The button's name as a screen reader would read it, simplified: the first of
// aria-labelledby, aria-label, own text (or an inner image's alt), title, and for
// inputs their value. The text sources are skipped for controls that hold form
// fields or more than four children, so a typed value is never read.
function accessibleName(
    control: Element
): { raw?: string; source: ButtonLabelSource } {
    const labelledBy = control.getAttribute('aria-labelledby');
    if (labelledBy) {
        const root = (typeof control.getRootNode === 'function'
            ? control.getRootNode()
            : document) as Document | ShadowRoot;
        const text = labelledBy
            .split(/\s+/)
            .map(id =>
                textOf(root.getElementById ? root.getElementById(id) : null)
            )
            .filter(part => !!part)
            .join(' ');
        if (text) {
            return { raw: text, source: 'labelledby' };
        }
    }
    const aria = control.getAttribute('aria-label');
    if (aria && aria.trim()) {
        return { raw: aria, source: 'aria' };
    }
    const readable =
        control.children.length <= 4 && !isUnsafeTextSource(control);
    if (control.tagName.toLowerCase() === 'input') {
        const typeAttr = control.getAttribute('type');
        const type = typeAttr ? typeAttr.toLowerCase() : 'text';
        if (type === 'image') {
            const alt = control.getAttribute('alt');
            if (alt && alt.trim()) {
                return { raw: alt, source: 'alt' };
            }
        } else if (type === 'submit' || type === 'button' || type === 'reset') {
            const value = (control as HTMLInputElement).value;
            if (value && value.trim()) {
                return { raw: value, source: 'value' };
            }
            if (type !== 'button') {
                // What the browser shows on an input without a value.
                return { raw: type, source: 'value' };
            }
        }
    } else if (readable) {
        const text = textOf(control);
        if (text) {
            return { raw: text, source: 'text' };
        }
        const image = control.querySelector('img[alt]');
        const alt = image ? image.getAttribute('alt') : null;
        if (alt && alt.trim()) {
            return { raw: alt, source: 'alt' };
        }
    }
    const title = control.getAttribute('title');
    if (title && title.trim()) {
        return { raw: title, source: 'title' };
    }
    return { source: 'none' };
}

const ICON_CLASS = /^(?:fa|fas|far|fal|icon|bi|glyphicon|ti|mdi|ri|la|lucide|ion|feather|ph)-([a-z][a-z-]{1,31})$/;
// Size, style and animation classes that share the icon prefixes.
const ICON_MODIFIER = /^(?:solid|regular|light|thin|duotone|brands|sharp|fw|lg|xs|sm|xl|spin|pulse|border|inverse|stack|flip(?:-[a-z]+)?|rotate(?:-[a-z]+)?|pull-[a-z]+)$/;

function iconToken(candidate: string | null): string | undefined {
    if (!candidate) {
        return undefined;
    }
    const token = candidate.toLowerCase().replace(/^icon-/, '');
    return /^[a-z][a-z-]{1,31}$/.test(token) ? token : undefined;
}

// An icon name from an SVG sprite reference or an icon-font class, for buttons
// whose only content is an icon. Letters and hyphens only.
function iconHint(control: Element): string | undefined {
    const allowed = (element: Element) =>
        !hasComposedAncestor(element, '[data-mp-no-track]');
    const uses: Element[] = Array.prototype.slice.call(
        control.querySelectorAll('use')
    );
    const use = uses.filter(allowed)[0];
    if (use) {
        const href =
            use.getAttribute('href') || use.getAttribute('xlink:href') || '';
        const hash = href.indexOf('#');
        const sprite = iconToken(hash === -1 ? null : href.slice(hash + 1));
        if (sprite) {
            return sprite;
        }
    }
    const candidates = [control]
        .concat(
            Array.prototype.slice.call(control.querySelectorAll('i, span, svg'))
        )
        .filter(allowed)
        .slice(0, 5);
    for (const element of candidates) {
        const classes = (element.getAttribute('class') || '').split(/\s+/);
        for (const name of classes) {
            const match = ICON_CLASS.exec(name.toLowerCase());
            if (match && !ICON_MODIFIER.test(match[1])) {
                return match[1];
            }
        }
    }
    return undefined;
}

function controlType(control: Element, element: ButtonElementKind): string {
    if (element === 'button' || element === 'input') {
        const typeAttr = control.getAttribute('type');
        const type = typeAttr ? typeAttr.toLowerCase() : '';
        if (element === 'input') {
            return type || 'text';
        }
        return type === 'button' || type === 'reset' ? type : 'submit';
    }
    return 'button';
}

// Describes a clicked button for auto button tracking. Links are left to page
// views, so a link click is not described.
export function describeButtonClick(
    path: Array<EventTarget | null>
): IButtonClick | undefined {
    const control = findControl(path);
    if (!control || control.matches('a[href]:not([role="button"])')) {
        return undefined;
    }
    const element = elementKind(control);
    const name = accessibleName(control);
    const label = maskLabel(name.raw);
    return {
        label,
        labelSource: label ? name.source : 'none',
        // Kept on its own as well: it often says more than the visible text,
        // such as which item a remove button removes.
        ariaLabel: maskLabel(control.getAttribute('aria-label')),
        icon: iconHint(control),
        element,
        type: controlType(control, element),
    };
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
