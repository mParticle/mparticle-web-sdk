import { isFunction } from '../utils';
import {
    hasComposedAncestor,
    isUnsafeTextSource,
    isWalletElement,
    someComposedAncestor,
} from './controls';
import { maskLabel } from './labelMasking';

// Describes a clicked button for auto button tracking: its masked name, icon,
// hand-written identifiers and kind. Never reads form field values.
export type ButtonElementKind = 'button' | 'input' | 'role' | 'wallet' | 'link';

// The link clicks page views can't see: ones that stay on the page, leave the site or download a file.
export type LinkType = 'same_page' | 'outbound' | 'download';

const DOWNLOAD_EXTENSIONS = /\.(pdf|zip|csv|txt|ics|docx?|xlsx?|pptx?|dmg|exe|apk|mp3|mp4)$/i;

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
    linkType?: LinkType;
    linkDomain?: string;
    fileExtension?: string;
    checked?: boolean;
}

function elementKind(control: Element): ButtonElementKind {
    if (isWalletElement(control)) {
        return 'wallet';
    }
    const tag = control.tagName.toLowerCase();
    if (tag === 'button' || tag === 'input') {
        return tag;
    }
    return control.matches('a[href]:not([role="button"])') ? 'link' : 'role';
}

const NOT_RENDERED =
    'script, style, template, [hidden], [aria-hidden="true"], [inert]';

// Hidden from view or from assistive technology. Screen-reader-only text is
// clipped rather than hidden, so it is not. An SVG title is never drawn but
// names its icon, so it is not either.
function isHidden(element: Element): boolean {
    if (element.matches(NOT_RENDERED)) {
        return true;
    }
    if (element instanceof SVGTitleElement) {
        return false;
    }
    const style = window.getComputedStyle(element);
    return (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.visibility === 'collapse'
    );
}

// display: none and aria-hidden on an ancestor hide an element whatever its
// own style says.
function isShown(element: Element): boolean {
    return !someComposedAncestor(element, isHidden);
}

// A shadow host shows a light child only through a slot, and only while
// nothing from that slot up to the host is hidden. A closed shadow root can't
// be seen, so its host's children are read as they are.
function isShownThroughSlot(node: Node, host: Element): boolean {
    const slot = (node as Element | Text).assignedSlot;
    return !!slot && !someComposedAncestor(slot, isHidden, host);
}

function renderedText(element: Element): string {
    if (isHidden(element)) {
        return '';
    }
    let text = '';
    const nodes = element.childNodes;
    // maskLabel drops anything longer, so reading further is wasted work.
    for (let i = 0; i < nodes.length && text.length <= 128; i++) {
        const node = nodes[i];
        if (element.shadowRoot && !isShownThroughSlot(node, element)) {
            continue;
        }
        if (node.nodeType === Node.TEXT_NODE) {
            text += node.nodeValue;
        } else if (node instanceof Element) {
            text += renderedText(node);
        }
    }
    return text;
}

function textOf(element: Element | null): string {
    return element && !isUnsafeTextSource(element) && isShown(element)
        ? renderedText(element).trim()
        : '';
}

function shownImageAlt(control: Element): string | undefined {
    const images = control.querySelectorAll('img[alt]');
    for (let i = 0; i < images.length; i++) {
        if (isShown(images[i])) {
            return nonBlank(images[i].getAttribute('alt'));
        }
    }
    return undefined;
}

function nonBlank(value: string | null): string | undefined {
    return value && value.trim() ? value : undefined;
}

// The button's name as a screen reader would read it, simplified: the first of
// aria-labelledby, aria-label, own text (or an inner image's alt), title, and
// for inputs their value. The text sources are skipped for controls that hold
// form fields or more than four children, so a typed value is never read.
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
        const alt = shownImageAlt(control);
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

// What the button opens or acts on: a menu, drawer or dialog. aria-controls can
// list several ids, so only the first is used.
function controlsIdentifier(control: Element): string | undefined {
    const ariaControls = control.getAttribute('aria-controls');
    return (
        stableIdentifier(
            ariaControls ? ariaControls.trim().split(/\s+/)[0] : null
        ) || firstIdentifier(control, ['popovertarget', 'commandfor'])
    );
}

// The id of the form a button or input actually submits, which the browser
// resolves from its form attribute or its owning form. getAttribute, because a
// field named "id" shadows form.id.
function formIdentifier(control: Element): string | undefined {
    const form =
        control instanceof HTMLButtonElement ||
        control instanceof HTMLInputElement
            ? control.form
            : null;
    return form ? stableIdentifier(form.getAttribute('id')) : undefined;
}

// The browser's normalised type: a button defaults to 'submit' and an unknown
// input type reads as 'text'. Wallet and role buttons are just 'button'.
function controlType(control: Element, element: ButtonElementKind): string {
    return element === 'button' || element === 'input'
        ? (control as HTMLButtonElement | HTMLInputElement).type
        : 'button';
}

interface ILinkDetails {
    type: LinkType;
    domain?: string;
    fileExtension?: string;
}

// Reads the link's own resolved URL parts, never its full href: only the hostname of
// a link that leaves the site and the extension of a file it downloads travel. Navigation
// within the site is left to page views, and mailto:, tel: and other schemes are skipped.
function describeLink(link: Element): ILinkDetails | undefined {
    const href = (link.getAttribute('href') || '').trim();
    if (!href || href.charAt(0) === '#') {
        return { type: 'same_page' };
    }
    if (!(link instanceof HTMLAnchorElement)) {
        return undefined;
    }
    const protocol = link.protocol.toLowerCase();
    if (protocol === 'javascript:') {
        return { type: 'same_page' };
    }
    if (protocol !== 'http:' && protocol !== 'https:') {
        return undefined;
    }
    const domain =
        link.hostname !== window.location.hostname
            ? link.hostname.toLowerCase()
            : undefined;
    const extension = DOWNLOAD_EXTENSIONS.exec(link.pathname);
    if (link.hasAttribute('download') || extension) {
        return {
            type: 'download',
            domain,
            fileExtension: extension ? extension[1].toLowerCase() : undefined,
        };
    }
    if (domain) {
        return { type: 'outbound', domain };
    }
    return link.pathname === window.location.pathname &&
        link.search === window.location.search
        ? { type: 'same_page' }
        : undefined;
}

// Checkboxes and radios, and the roles that act as them. A role can list
// fallbacks, so any of its tokens counts.
const CHOICE =
    'input[type="checkbox"], input[type="radio"], [role~="checkbox"], [role~="radio"], ' +
    '[role~="switch"], [role~="menuitemcheckbox"], [role~="menuitemradio"]';

// The box a click on this control picks: the control itself, or the one a
// label passes the click on to.
function choiceOf(control: Element): Element | null {
    const choice =
        control instanceof HTMLLabelElement ? control.control : control;
    return choice && choice.matches(CHOICE) ? choice : null;
}

// Describes a clicked control for auto button tracking. A link counts only when page
// views can't see the click, and carries its link type.
export function describeButtonClick(
    control: Element
): IButtonClick | undefined {
    let link: ILinkDetails | undefined;
    if (control.matches('a[href]:not([role="button"])')) {
        link = describeLink(control);
        if (!link) {
            return undefined;
        }
    }
    const element = elementKind(control);
    const box =
        control instanceof HTMLInputElement &&
        (control.type === 'checkbox' || control.type === 'radio')
            ? control
            : undefined;
    // A box's text sent with its state is the shopper's answer, and the text
    // can be a name, an address or a sensitive choice, so a box goes by its
    // hand-written identifiers alone. So does a control acting as one, and a
    // label, whose click the browser passes on to its box as a second event.
    const choice = box || choiceOf(control);
    const name = choice ? undefined : accessibleName(control);
    const label = name ? maskLabel(name.raw) : undefined;
    return {
        label,
        labelSource: label ? name.source : 'none',
        // Kept on its own as well: it often says more than the visible text,
        // such as which item a remove button removes.
        ariaLabel: choice
            ? undefined
            : maskLabel(control.getAttribute('aria-label')),
        icon: choice ? undefined : iconHint(control),
        elementId: stableIdentifier(control.getAttribute('id')),
        elementName: stableIdentifier(control.getAttribute('name')),
        testId: firstIdentifier(control, TEST_ID_ATTRIBUTES),
        controls: controlsIdentifier(control),
        form: formIdentifier(control),
        element,
        type: controlType(control, element),
        linkType: link ? link.type : undefined,
        linkDomain: link ? link.domain : undefined,
        fileExtension: link ? link.fileExtension : undefined,
        // The box as the click left it: the browser toggles it before the click
        // reaches listeners, and puts it back if the click is cancelled.
        checked: box ? box.checked : undefined,
    };
}
