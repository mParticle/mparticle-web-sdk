import { isFunction } from '../utils';

// Finds the control a click landed on, for both checkout intent and button
// descriptions. Rokt's own elements, disabled controls and anything under
// data-mp-no-track are never returned.
export const CONTROL_SELECTOR =
    'button, input[type="submit"], input[type="button"], input[type="image"], [role="button"]';

const EDITABLE = '[contenteditable]:not([contenteditable="false"])';

// closest() over the composed tree: slots, parents, then shadow hosts.
export function hasComposedAncestor(
    element: Element,
    selector: string
): boolean {
    let node: Element | null = element;
    while (node) {
        if (node.matches(selector)) {
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
// counts. Only the element's own attributes are read.
const WALLET_IN_NAME = /(?:^| )(?:apple ?pay|google ?pay|g ?pay|amazon ?pay|cash ?app|venmo|pay ?pal|shop ?pay|klarna|after ?pay|clear ?pay|affirm|sezzle|samsung ?pay)(?= |$)/;
const BUTTON_IN_NAME = /(?:^| )(?:btn|button)(?= |$)/;
const PART_IN_NAME = /(?:^| )(?:logo|icon|image|img|label|text|caption|message|messaging|info|tooltip|help|learn|terms|promo|banner|container|wrapper|wrap|placeholder|form|section|panel|modal|list|group)(?= |$)/;

function nameWords(value: string | null): string {
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
                WALLET_IN_NAME.test(words) &&
                BUTTON_IN_NAME.test(words) &&
                !PART_IN_NAME.test(words)
        );
}

export function isWalletElement(element: Element): boolean {
    return vendorButtonKind(element) === 'wallet' || isWalletNamed(element);
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

// Whether the element is a picker or sits inside one, such as a label or a
// role="radio" row. A wallet name never makes a tap there a wallet tap.
export function isInPicker(element: Element): boolean {
    return hasComposedAncestor(element, PICKER);
}

// A checkbox or radio is a control of its own only when no button or link
// around it takes the click, so a tappable row keeps its own name.
const OPTION_INPUT = 'input[type="checkbox"], input[type="radio"]';
// Anything that chooses, toggles or takes typing. One between a click's target
// and a wallet-named element keeps that element from becoming the tap.
const NAME_BARRIER =
    PICKER +
    ', ' +
    PICKER_GROUP +
    ', input, select, textarea, option, optgroup, datalist, [aria-expanded], [aria-pressed], ' +
    EDITABLE;

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
// wallet-named one also by its `disabled` class.
export function findControl(
    path: Array<EventTarget | null>
): Element | undefined {
    if (isExcludedPath(path)) {
        return undefined;
    }
    let control: Element | undefined;
    let option: Element | undefined;
    let picked = false;
    for (const target of path.slice(0, 12)) {
        if (control) {
            break;
        }
        if (!(target instanceof Element)) {
            continue;
        }
        if (
            target.matches(CONTROL_SELECTOR + ', a[href], ' + VENDOR_BUTTON) ||
            (!picked && isWalletNamed(target) && !isInPicker(target))
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

// A label around a checkbox or radio holds no typed text, so only the other
// fields rule its text out.
export function isUnsafeLabelSource(label: Element): boolean {
    return (
        !!label.querySelector(
            'input:not([type="checkbox"]):not([type="radio"]), select, textarea, [data-mp-no-track], ' +
                EDITABLE
        ) ||
        hasComposedAncestor(
            label,
            'select, datalist, textarea, [data-mp-no-track], ' + EDITABLE
        )
    );
}
