import { isFunction } from '../utils';

// Finds the control a click landed on, for both checkout intent and button
// descriptions. Rokt's own elements, disabled controls and anything under
// data-mp-no-track are never returned.
export const CONTROL_SELECTOR =
    'button, input[type="submit"], input[type="button"], input[type="image"], [role="button"]';

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

// Rokt's own placements and frames never count as partner checkout controls.
export function isRoktElement(element: Element): boolean {
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

export function isWalletElement(element: Element): boolean {
    return element.matches(
        'apple-pay-button, shop-pay-button, .gpay-button, #AmazonPayButton, [data-amazon-pay-button]'
    );
}

// Walks at most 12 entries of an event's composed path for the nearest control.
// Rokt elements, disabled controls and anything under data-mp-no-track are skipped.
export function findControl(
    path: Array<EventTarget | null>
): Element | undefined {
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
