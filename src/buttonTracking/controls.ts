import { isFunction } from '../utils';

// Finds the control a click landed on, for both checkout intent and button
// descriptions. Rokt's own elements, disabled controls and anything under
// data-mp-no-track are never returned.
export const CONTROL_SELECTOR =
    'button, input[type="submit"], input[type="button"], input[type="image"], [role="button"]';

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
        const root = isFunction(node.getRootNode)
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

// closest() over the composed tree.
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

export function isWalletElement(element: Element): boolean {
    return vendorButtonKind(element) === 'wallet';
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
export function isQuietIntentControl(
    control: Element,
    isVendorWallet: boolean
): boolean {
    if (control.matches(PICKER)) {
        return true;
    }
    if (hasComposedAncestor(control, PICKER_GROUP)) {
        return true;
    }
    if (
        !isVendorWallet &&
        (control.hasAttribute('aria-expanded') ||
            control.hasAttribute('aria-pressed'))
    ) {
        return true;
    }
    return hasComposedAncestor(control, MESSAGING);
}

// A checkbox or radio is a control of its own only when no button or link
// around it takes the click, so a tappable row stays the control.
const OPTION_INPUT = 'input[type="checkbox"], input[type="radio"]';

// Walks at most 12 entries of an event's composed path for the nearest control.
// One composed walk from the target rules out Rokt elements and anything under
// data-mp-no-track; disabled controls are skipped.
export function findControl(
    path: Array<EventTarget | null>
): Element | undefined {
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
        return undefined;
    }
    let control: Element | undefined;
    let option: Element | undefined;
    for (const target of entries) {
        if (!(target instanceof Element)) {
            continue;
        }
        if (hasRoktSrc(target)) {
            return undefined;
        }
        if (
            !control &&
            target.matches(CONTROL_SELECTOR + ', a[href], ' + VENDOR_BUTTON)
        ) {
            control = target;
        } else if (!control && !option && target.matches(OPTION_INPUT)) {
            option = target;
        }
    }
    control = control || option;
    if (!control || control.matches(':disabled, [aria-disabled="true"]')) {
        return undefined;
    }
    return control;
}

const EDITABLE = '[contenteditable]:not([contenteditable="false"])';

// Text that may hold what a shopper typed or what the page opted out: form
// fields, editable regions, and anything under data-mp-no-track.
export function isUnsafeTextSource(element: Element): boolean {
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
