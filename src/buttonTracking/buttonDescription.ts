import { isFunction } from '../utils';
import {
    hasComposedAncestor,
    isUnsafeTextSource,
    isWalletElement,
} from './controls';
import { maskLabel } from './labelMasking';

// Describes a clicked button for auto button tracking: its masked name, icon,
// hand-written identifiers and kind. Never reads form field values.
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
    elementId?: string;
    elementName?: string;
    testId?: string;
    controls?: string;
    form?: string;
    element: ButtonElementKind;
    type: string;
}

function elementKind(control: Element): ButtonElementKind {
    if (isWalletElement(control)) {
        return 'wallet';
    }
    const tag = control.tagName.toLowerCase();
    return tag === 'button' || tag === 'input' ? tag : 'role';
}

function textOf(element: Element | null): string {
    return element && !isUnsafeTextSource(element) && element.textContent
        ? element.textContent.trim()
        : '';
}

function nonBlank(value: string | null): string | undefined {
    return value && value.trim() ? value : undefined;
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
        const root = (isFunction(control.getRootNode)
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
    const aria = nonBlank(control.getAttribute('aria-label'));
    if (aria) {
        return { raw: aria, source: 'aria' };
    }
    const readable =
        control.children.length <= 4 && !isUnsafeTextSource(control);
    if (control instanceof HTMLInputElement) {
        // The browser's normalised type: an unknown value reads as 'text'.
        const type = control.type;
        if (type === 'image') {
            const alt = nonBlank(control.getAttribute('alt'));
            if (alt) {
                return { raw: alt, source: 'alt' };
            }
        } else if (type === 'submit' || type === 'button' || type === 'reset') {
            const value = nonBlank(control.value);
            if (value) {
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
        const alt = image ? nonBlank(image.getAttribute('alt')) : undefined;
        if (alt) {
            return { raw: alt, source: 'alt' };
        }
    }
    const title = nonBlank(control.getAttribute('title'));
    if (title) {
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
    const use = Array.from(control.querySelectorAll('use')).filter(allowed)[0];
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
        .concat(Array.from(control.querySelectorAll('i, span, svg')))
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

// Words of letters, each optionally ending in up to three digits, joined by
// hyphens or underscores: `add-to-cart`, `btnCheckout`, `step_2`. Generated ids
// (`ember1234`, `a8f3e2c1`, `radix-:r1:`) and long numbers don't match.
const HAND_WRITTEN_ID = /^[A-Za-z]+[0-9]{0,3}(?:[-_](?:[A-Za-z]+[0-9]{0,3}|[0-9]{1,3}))*$/;

// A developer-written identifier, or nothing.
function stableIdentifier(value: string | null): string | undefined {
    if (!value) {
        return undefined;
    }
    const id = value.trim();
    // At most three digits in all, so numbers split into groups don't pass.
    const digits = id.replace(/[^0-9]/g, '').length;
    return id.length <= 64 && digits <= 3 && HAND_WRITTEN_ID.test(id)
        ? id
        : undefined;
}

const TEST_ID_ATTRIBUTES = [
    'data-testid',
    'data-test-id',
    'data-test',
    'data-qa',
    'data-cy',
];

// What the button opens or acts on: a menu, drawer or dialog.
const CONTROLS_ATTRIBUTES = ['aria-controls', 'popovertarget', 'commandfor'];

// The first of these attributes that holds a developer-written identifier.
function firstIdentifier(
    control: Element,
    attributes: string[]
): string | undefined {
    for (const attribute of attributes) {
        const id = stableIdentifier(control.getAttribute(attribute));
        if (id) {
            return id;
        }
    }
    return undefined;
}

// The form a button or input submits: its form attribute, or the owning form's id.
function formIdentifier(control: Element): string | undefined {
    const form =
        control instanceof HTMLButtonElement ||
        control instanceof HTMLInputElement
            ? control.form
            : null;
    return stableIdentifier(
        control.getAttribute('form') || (form ? form.getAttribute('id') : null)
    );
}

// The browser's normalised type: a button defaults to 'submit' and an unknown
// input type reads as 'text'. Wallet and role buttons are just 'button'.
function controlType(control: Element, element: ButtonElementKind): string {
    return element === 'button' || element === 'input'
        ? (control as HTMLButtonElement | HTMLInputElement).type
        : 'button';
}

// Describes a clicked control for auto button tracking. Links are left to page
// views, so a link click is not described.
export function describeButtonClick(
    control: Element
): IButtonClick | undefined {
    if (control.matches('a[href]:not([role="button"])')) {
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
        elementId: stableIdentifier(control.getAttribute('id')),
        elementName: stableIdentifier(control.getAttribute('name')),
        testId: firstIdentifier(control, TEST_ID_ATTRIBUTES),
        controls: firstIdentifier(control, CONTROLS_ATTRIBUTES),
        form: formIdentifier(control),
        element,
        type: controlType(control, element),
    };
}
