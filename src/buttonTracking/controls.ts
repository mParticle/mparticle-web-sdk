import { isFunction } from '../utils';

// Finds the control a click landed on, for both checkout intent and button
// descriptions. Rokt's own elements, disabled controls and anything under
// data-mp-no-track are never returned.
export const CONTROL_SELECTOR =
    'button, input[type="submit"], input[type="button"], input[type="image"], [role="button"]';

const EDITABLE = '[contenteditable]:not([contenteditable="false"])';

// One step up the composed tree: the slot, the parent, then the shadow host.
function composedParent(node: Element): Element | null {
    const root = isFunction(node.getRootNode)
        ? (node.getRootNode() as ShadowRoot)
        : null;
    return (
        (node as Element & { assignedSlot?: Element | null }).assignedSlot ||
        node.parentElement ||
        (root && root.host) ||
        null
    );
}

// Tests the element and its ancestors over the composed tree: slots, parents,
// then shadow hosts. With `until`, stops before reaching that ancestor.
export function someComposedAncestor(
    element: Element,
    test: (node: Element) => boolean,
    until?: Element
): boolean {
    let node: Element | null = element;
    while (node && node !== until) {
        if (test(node)) {
            return true;
        }
        node = composedParent(node);
    }
    return false;
}

// closest() over the composed tree, starting at the element itself.
export function hasComposedAncestor(
    element: Element,
    selector: string
): boolean {
    return someComposedAncestor(element, node => node.matches(selector));
}

const ROKT_SELECTOR = '[data-core-type], #rokt-controller-frame';

// A Rokt frame or script is served from a /wsdk/ path.
function hasRoktSrc(element: Element): boolean {
    const src = element.getAttribute('src');
    if (!src) {
        return false;
    }
    try {
        return (
            new URL(src, 'https://example.test').pathname.indexOf('/wsdk/') !==
            -1
        );
    } catch (e) {
        // An unparseable src is not a Rokt element.
        return false;
    }
}

// Rokt's own placements and frames never count as partner checkout controls.
export function isRoktElement(element: Element): boolean {
    return hasComposedAncestor(element, ROKT_SELECTOR) || hasRoktSrc(element);
}

// Wallet and quick-pay buttons as their vendors render them: official custom
// elements and documented classes, ids and attributes.
const WALLET_SIGNATURE = [
    'apple-pay-button',
    '.apple-pay-button',
    '.gpay-button',
    '.gpay-card-info-container',
    '#gpay-button-online-api-id',
    'paypal-button',
    'venmo-button',
    'paypal-pay-later-button',
    'paypal-credit-button',
    'shop-pay-button',
    'shop-pay-wallet-button',
    'shopify-accelerated-checkout',
    'shopify-accelerated-checkout-cart',
    'shopify-apple-pay-button',
    'shopify-google-pay-button',
    'shopify-paypal-button',
    'shopify-amazon-pay-button',
    '.amazonpay-button-focusable',
    '#AmazonPayButton',
    '[data-amazon-pay-button]',
    '[data-afterpay-entry-point]',
].join(', ');
// PayPal's card button opens a card form, so it is a step rather than a wallet.
const CARD_FORM_BUTTON = 'paypal-basic-card-button';
const VENDOR_BUTTON = WALLET_SIGNATURE + ', ' + CARD_FORM_BUTTON;
// Apple's set-up and top-up buttons manage a wallet rather than pay with it.
const NOT_A_PAYMENT = ['set-up', 'add-money', 'reload', 'top-up']
    .map(type => 'apple-pay-button[type="' + type + '"]')
    .join(', ');

// What a vendor's own button markup says about a control. Only the control or
// the shadow host that owns it counts, so a merchant wrapper reusing a vendor
// class never turns its children into wallet buttons.
export function vendorButtonKind(
    control: Element
): 'wallet' | 'checkout_step' | 'none' | undefined {
    let host: Element | null = control.matches(VENDOR_BUTTON) ? control : null;
    if (!host) {
        const root = isFunction(control.getRootNode)
            ? (control.getRootNode() as ShadowRoot)
            : null;
        host = root && root.host && root.host.matches(VENDOR_BUTTON)
            ? root.host
            : null;
    }
    if (!host) {
        return undefined;
    }
    if (host.matches(NOT_A_PAYMENT)) {
        return 'none';
    }
    return host.matches(CARD_FORM_BUTTON) ? 'checkout_step' : 'wallet';
}

// A merchant-built wallet button that names its wallet in an id or test id, such
// as `venmo-pay-btn` or `applePayButton`. The name must also say button and not
// name a part or a wrapper of one, so a wallet's logo, label or container never
// counts, nor a button that only chooses a wallet. Affirm is also an English
// verb, so it counts only beside a payment word. Only the element's own
// attributes are read.
const WALLET_IN_NAME = /(?:^| )(?:apple ?pay|google ?pay|g ?pay|amazon ?pay|cash ?app|venmo|pay ?pal|shop ?pay|klarna|after ?pay|clear ?pay|sezzle|samsung ?pay)(?= |$)/;
const AFFIRM_IN_NAME = /(?:^| )affirm(?= |$)/;
const PAYMENT_IN_NAME = /(?:^| )(?:pay|payment|checkout)(?= |$)/;
const BUTTON_IN_NAME = /(?:^| )(?:btn|button)(?= |$)/;
const PART_IN_NAME = /(?:^| )(?:logo|icon|image|img|label|text|caption|message|messaging|info|tooltip|help|learn|terms|promo|banner|container|wrapper|wrap|placeholder|form|section|panel|modal|list|group|select|option|tab|toggle|radio|choice|method)(?= |$)/;

export function nameWords(value: string | null): string {
    return (value || '')
        .slice(0, 64)
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[^A-Za-z0-9]+/g, ' ')
        .trim()
        .toLowerCase();
}

export function isWalletNamed(element: Element): boolean {
    return [element.getAttribute('id'), element.getAttribute('data-testid')]
        .map(nameWords)
        .some(
            words =>
                (WALLET_IN_NAME.test(words) ||
                    (AFFIRM_IN_NAME.test(words) &&
                        PAYMENT_IN_NAME.test(words))) &&
                BUTTON_IN_NAME.test(words) &&
                !PART_IN_NAME.test(words)
        );
}

export function isWalletElement(element: Element): boolean {
    return (
        vendorButtonKind(element) === 'wallet' || isWalletNamedControl(element)
    );
}

// Pickers and toggles choose a payment method or open a panel; they never pay.
const PICKER =
    'input[type="radio"], input[type="checkbox"], label, [role="radio"], [role="tab"], [role="option"], ' +
    '[role="checkbox"], [role="switch"], [role="menuitemradio"], [role="menuitemcheckbox"], [aria-checked], [aria-selected]';
const PICKER_GROUP = '[role="radiogroup"], [role="tablist"], [role="listbox"]';
// Pay-later and financing messages link to details rather than pay.
const MESSAGING =
    'klarna-placement, afterpay-placement, square-placement, .affirm-as-low-as, .affirm-site-modal, ' +
    '.affirm-product-modal, [data-pp-message]';

// A control that is still logged as a click but never counts as checkout intent.
// A cart button can open a flyout, so aria-expanded alone never quiets one.
export function isQuietIntentControl(
    control: Element,
    isVendorWallet: boolean,
    isCart = false
): boolean {
    if (control.matches(PICKER)) {
        return true;
    }
    if (hasComposedAncestor(control, PICKER_GROUP)) {
        return true;
    }
    if (
        !isVendorWallet &&
        ((!isCart && control.hasAttribute('aria-expanded')) ||
            control.hasAttribute('aria-pressed'))
    ) {
        return true;
    }
    return hasComposedAncestor(control, MESSAGING);
}

// A checkbox or radio is a control of its own only when no button or link
// around it takes the click, so a tappable row stays the control.
const OPTION_INPUT = 'input[type="checkbox"], input[type="radio"]';
// Anything that chooses, toggles or takes typing. One between a click's target
// and a wallet-named element, or inside that element, keeps it from becoming
// the tap. Hidden inputs and button-like inputs are not fields.
const NAME_BARRIER =
    PICKER +
    ', ' +
    PICKER_GROUP +
    ', input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]), ' +
    'select, textarea, option, optgroup, datalist, [aria-expanded], [aria-pressed], ' +
    EDITABLE;
// What owns a click on anything inside it: a picker, a real control or link,
// a toggle, or an editable region.
const NAME_HOLDER =
    PICKER +
    ', ' +
    CONTROL_SELECTOR +
    ', a[href], ' +
    VENDOR_BUTTON +
    ', [aria-expanded], [aria-pressed], ' +
    EDITABLE;

// A wallet-named element that may stand as a control by its name alone: not
// itself a picker, toggle or form field; not inside a picker, a real button or
// link, a toggle, an editable region or another wallet-named element, which own
// the click with their own state; and holding no picker or field, in its open
// shadow root either, so a payment-method row with its own radio or select
// never becomes a wallet tap.
export function isWalletNamedControl(element: Element): boolean {
    if (!isWalletNamed(element) || element.matches(NAME_BARRIER)) {
        return false;
    }
    for (
        let node = composedParent(element);
        node;
        node = composedParent(node)
    ) {
        if (node.matches(NAME_HOLDER) || isWalletNamed(node)) {
            return false;
        }
    }
    const shadow = element.shadowRoot;
    return (
        !element.querySelector(NAME_BARRIER) &&
        !(shadow && shadow.querySelector(NAME_BARRIER))
    );
}

// Whether a click is never tracked: it has no element, or lands on a Rokt
// element or under data-mp-no-track. Reads at most 12 entries of the path.
export function isExcludedPath(path: Array<EventTarget | null>): boolean {
    const entries = path.slice(0, 12);
    let first: Element | undefined;
    for (const target of entries) {
        if (target instanceof Element) {
            first = target;
            break;
        }
    }
    if (
        !first ||
        hasComposedAncestor(first, ROKT_SELECTOR + ', [data-mp-no-track]')
    ) {
        return true;
    }
    for (const target of entries) {
        if (target instanceof Element && hasRoktSrc(target)) {
            return true;
        }
    }
    return false;
}

// Walks at most 12 entries of an event's composed path for the nearest control.
// A wallet-named element counts as one unless a picker, toggle or form field
// lies between it and the target or a picker holds it, so choosing an option in
// or around it never becomes its tap. Excluded clicks give nothing; disabled controls are skipped, a
// wallet-named one also by its `disabled` class. A caller that has already
// found the path not excluded passes `included` so the walk runs once.
export function findControl(
    path: Array<EventTarget | null>,
    included = false,
    limit = 12
): Element | undefined {
    if (!included && isExcludedPath(path)) {
        return undefined;
    }
    let control: Element | undefined;
    let option: Element | undefined;
    let picked = false;
    for (const target of path.slice(0, limit)) {
        if (control) {
            break;
        }
        if (!(target instanceof Element)) {
            continue;
        }
        if (
            target.matches(CONTROL_SELECTOR + ', a[href], ' + VENDOR_BUTTON) ||
            (!picked && isWalletNamedControl(target))
        ) {
            control = target;
        } else {
            if (!option && target.matches(OPTION_INPUT)) {
                option = target;
            }
            picked = picked || target.matches(NAME_BARRIER);
        }
    }
    control = control || option;
    if (
        !control ||
        control.matches(':disabled, [aria-disabled="true"]') ||
        (control.classList.contains('disabled') && isWalletNamed(control))
    ) {
        return undefined;
    }
    return control;
}

// Roles that act as controls without being buttons or links: pickers, tabs,
// options and links run by script. A role can list fallbacks, so any of its
// tokens counts.
const ROLE_CONTROL =
    '[role~="radio"], [role~="menuitemradio"], [role~="checkbox"], [role~="menuitemcheckbox"], ' +
    '[role~="switch"], [role~="option"], [role~="tab"], [role~="link"]';

// The nearest role control on the click path, for logging the click alone:
// checkout intent and payment choices only ever read what findControl finds.
// None when anything disabled sits on the path, so a role control around or
// inside a disabled control never logs the click it suppressed.
export function findRoleControl(
    path: Array<EventTarget | null>,
    limit: number
): Element | undefined {
    const entries = path
        .slice(0, limit)
        .filter((target): target is Element => target instanceof Element);
    if (entries.some(target => target.matches(':disabled, [aria-disabled="true"]'))) {
        return undefined;
    }
    for (const target of entries) {
        if (target.matches(ROLE_CONTROL)) {
            return target;
        }
    }
    return undefined;
}

// Text that may hold what a shopper typed or what the page opted out: form
// fields, editable regions, and anything under data-mp-no-track. `own` is a
// box the element labels, which holds no typing of its own.
export function isUnsafeTextSource(element: Element, own?: Element): boolean {
    const inside = 'input, select, textarea, [data-mp-no-track], ' + EDITABLE;
    return (
        element.matches(
            'input, select, textarea, option, optgroup, datalist, ' + EDITABLE
        ) ||
        (own
            ? Array.from(element.querySelectorAll(inside)).some(
                  found => found !== own
              )
            : !!element.querySelector(inside)) ||
        hasComposedAncestor(
            element,
            'select, datalist, textarea, [data-mp-no-track], ' + EDITABLE
        )
    );
}
