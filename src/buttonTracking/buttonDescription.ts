import { isFunction } from '../utils';
import {
    hasComposedAncestor,
    isUnsafeTextSource,
    isWalletElement,
    nameWords,
    someComposedAncestor,
} from './controls';
import { maskLabel, MAX_RAW_LABEL_LENGTH } from './labelMasking';

// Describes a clicked button for auto button tracking: its masked name, icon,
// hand-written identifiers and kind. Never reads form field values.
export type ButtonElementKind = 'button' | 'input' | 'role' | 'wallet' | 'link';

// A same_page link acts as a button. The others leave the page: to another page
// of the site, another site or a file.
export type LinkType = 'same_page' | 'internal' | 'outbound' | 'download';

const DOWNLOAD_EXTENSIONS = /\.(pdf|zip|csv|txt|ics|docx?|xlsx?|pptx?|dmg|exe|apk|mp3|mp4)$/i;

export type ButtonLabelSource =
    | 'labelledby'
    | 'aria'
    | 'text'
    | 'alt'
    | 'title'
    | 'value'
    | 'heading'
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
    group?: string;
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
    // A link run by script reads as a link, as an anchor does, so whoever reads
    // the click treats it the same.
    return control.matches(
        'a[href]:not([role="button"]), [role~="link"]:not([role~="button"])'
    )
        ? 'link'
        : 'role';
}

const NOT_RENDERED =
    'script, style, template, [hidden], [aria-hidden="true"], [inert]';

// The most nodes read for one label source, and images looked at for one
// button. Each costs a style lookup in the click handler.
const MAX_READS = 64;

function assignedNodes(element: Element): Node[] {
    const slot = element as HTMLSlotElement;
    return isFunction(slot.assignedNodes) ? slot.assignedNodes() : [];
}

// Left out of what is drawn by its parent: a light child of an open shadow host
// that no slot takes, or a slot's own child while nodes are assigned to the
// slot. A closed shadow root can't be seen, so its host's children count.
function isUnslotted(node: Element | Text): boolean {
    const parent = node.parentElement;
    if (!parent) {
        return false;
    }
    return parent.shadowRoot
        ? !node.assignedSlot
        : assignedNodes(parent).length > 0;
}

// Hides the element and all it holds, whatever their own style says.
// Screen-reader-only text is clipped rather than hidden, so it is not. An SVG
// title is never drawn but names its icon, so it is not either.
function hidesSubtree(element: Element): boolean {
    if (element.matches(NOT_RENDERED) || isUnslotted(element)) {
        return true;
    }
    return (
        !(element instanceof SVGTitleElement) &&
        window.getComputedStyle(element).display === 'none'
    );
}

// Visibility is inherited and a child can set it back to visible, so only the
// element's own counts.
function isVisible(element: Element): boolean {
    const visibility = window.getComputedStyle(element).visibility;
    return visibility !== 'hidden' && visibility !== 'collapse';
}

function isShown(element: Element, until?: Element): boolean {
    return !someComposedAncestor(element, hidesSubtree, until);
}

// A shadow host shows a light child only through a slot, and only while
// nothing from that slot up to the host hides it.
function isShownThroughSlot(node: Element | Text, host: Element): boolean {
    const slot = node.assignedSlot;
    return !!slot && isShown(slot, host);
}

// Whitespace hides nothing, so a node holding only whitespace is taken as it
// is, without a style lookup: an icon's paths cost nothing. A slot's text can
// sit in the nodes assigned to it, so a slot is never blank.
function isBlank(node: Element | Text): boolean {
    return (
        !/\S/.test(node.textContent || '') &&
        !(
            node instanceof Element &&
            (node.matches('slot') || !!node.querySelector('slot'))
        )
    );
}

// The text a sighted user or a screen reader gets from an element, whitespace
// collapsed. Undefined when that runs past what maskLabel keeps, takes more
// than MAX_READS nodes to read, or takes in a form field through a slot, so a
// label is never cut short at a node boundary.
function renderedText(root: Element): string | undefined {
    let text = '';
    let reads = 0;
    const append = (value: string) => {
        text = (text + value).replace(/\s+/g, ' ');
    };
    const read = (element: Element): boolean => {
        if (hidesSubtree(element)) {
            return true;
        }
        const assigned = assignedNodes(element);
        const nodes = assigned.length ? assigned : element.childNodes;
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i] as Element | Text;
            const isText = node.nodeType === Node.TEXT_NODE;
            if (!isText && !(node instanceof Element)) {
                continue;
            }
            if (isBlank(node)) {
                append(node.textContent);
                continue;
            }
            if (++reads > MAX_READS) {
                return false;
            }
            if (element.shadowRoot && !isShownThroughSlot(node, element)) {
                continue;
            }
            if (isText) {
                if (isVisible(node.assignedSlot || element)) {
                    append(node.nodeValue);
                }
            } else if (
                // Assigned nodes sit outside the label source, where its own
                // form field check never looked.
                (assigned.length && isUnsafeTextSource(node as Element)) ||
                !read(node as Element)
            ) {
                return false;
            }
            if (text.trim().length > MAX_RAW_LABEL_LENGTH) {
                return false;
            }
        }
        return true;
    };
    return read(root) ? text.trim() : undefined;
}

// '' when the element can't name the button, undefined when its text can't be
// read in full.
function textOf(element: Element | null): string | undefined {
    return element && !isUnsafeTextSource(element) && isShown(element)
        ? renderedText(element)
        : '';
}

// The control itself is already known to be shown.
function shownImageAlt(control: Element): string | undefined {
    const images = control.querySelectorAll('img[alt]');
    for (let i = 0; i < images.length && i < MAX_READS; i++) {
        if (isShown(images[i], control) && isVisible(images[i])) {
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
        const parts = labelledBy
            .split(/\s+/)
            .map(id =>
                textOf(root.getElementById ? root.getElementById(id) : null)
            );
        if (parts.indexOf(undefined) !== -1) {
            return { source: 'none' };
        }
        const text = parts.filter(part => !!part).join(' ');
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
    } else if (readable && isShown(control)) {
        const text = renderedText(control);
        if (text === undefined) {
            return headingName(control) || { source: 'none' };
        }
        if (text) {
            return { raw: text, source: 'text' };
        }
        const alt = shownImageAlt(control);
        if (alt) {
            return { raw: alt, source: 'alt' };
        }
    }
    if (!(control instanceof HTMLInputElement) && isShown(control)) {
        const heading = headingName(control);
        if (heading) {
            return heading;
        }
    }
    const title = nonBlank(control.getAttribute('title'));
    if (title) {
        return { raw: title, source: 'title' };
    }
    return { source: 'none' };
}

// A card whose text runs too long to keep, or has too many parts to read, is
// named by its first heading, as a product or menu card usually is. Not a card
// holding a form field, nor one that takes in slotted content, whose fields
// the form field check can't see.
function headingName(
    control: Element
): { raw: string; source: ButtonLabelSource } | undefined {
    if (
        isUnsafeTextSource(control) ||
        control.shadowRoot ||
        control.querySelector('slot')
    ) {
        return undefined;
    }
    const text = textOf(
        control.querySelector('h1, h2, h3, h4, h5, h6, [role="heading"]')
    );
    return text ? { raw: text, source: 'heading' } : undefined;
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

// A picker's input name, which names its question. Sites often end it with the
// id of the product it belongs to (`color-swatches-48213907`); without that
// number it still names the question.
function questionName(value: string | null): string | undefined {
    return stableIdentifier(value && value.trim().replace(/[-_][0-9]{4,}$/, ''));
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
// input type reads as 'text'. A native button or input reports its own type, a
// wallet-named one included. A role control that isn't a button reads as its
// role: 'radio', 'option', 'tab', 'link' and so on. Any other control, such as
// a role button or a vendor's wallet element, reads as 'button'.
const CONTROL_ROLES = [
    'radio',
    'menuitemradio',
    'checkbox',
    'menuitemcheckbox',
    'switch',
    'option',
    'tab',
    'link',
];

function controlType(control: Element): string {
    const tag = control.tagName.toLowerCase();
    if (tag === 'button' || tag === 'input') {
        return (control as HTMLButtonElement | HTMLInputElement).type;
    }
    if (control.matches('[role~="button"]')) {
        return 'button';
    }
    const roles = (control.getAttribute('role') || '').trim().split(/\s+/);
    for (const role of roles) {
        if (CONTROL_ROLES.indexOf(role) !== -1) {
            return role;
        }
    }
    return 'button';
}

interface ILinkDetails {
    type: LinkType;
    domain?: string;
    fileExtension?: string;
}

// Reads the link's own resolved URL parts, never its full href: only the hostname of
// a link that leaves the site and the extension of a file it downloads travel.
// mailto:, tel: and other schemes give undefined.
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
        : { type: 'internal' };
}

// Whether a described click is on a link that leaves the page, logged as a link
// click rather than a button click.
export function isLinkClick(click: IButtonClick): boolean {
    return !!click.linkType && click.linkType !== 'same_page';
}

// Checkboxes and radios, and the roles that act as them. A role can list
// fallbacks, so any of its tokens counts.
const CHOICE =
    'input[type="checkbox"], input[type="radio"], [role~="checkbox"], [role~="radio"], ' +
    '[role~="switch"], [role~="menuitemcheckbox"], [role~="menuitemradio"], [role~="option"]';
const RADIO_ROLE = '[role~="radio"], [role~="menuitemradio"]';

function boxOf(element: Element): Element | null {
    const box = element instanceof HTMLLabelElement ? element.control : element;
    return box && box.matches(CHOICE) ? box : null;
}

function isRadio(choice: Element | null): boolean {
    return choice instanceof HTMLInputElement
        ? choice.type === 'radio'
        : !!choice && choice.matches(RADIO_ROLE);
}

// The box a click on this control picks. One the click passed through below
// the control comes first: querySelector can't reach a slotted box, a box in a
// shadow root or the box of a label inside the control, and a row can hold
// more than one box. Else the control itself, the box it labels, or the first
// one it wraps, as on an option row whose name repeats the option's text.
function choiceOf(
    control: Element,
    path: Array<EventTarget | null>
): Element | null {
    for (const target of path) {
        if (target === control) {
            break;
        }
        const box = target instanceof Element ? boxOf(target) : null;
        if (box) {
            return box;
        }
    }
    return boxOf(control) || control.querySelector(CHOICE);
}

// Describes a clicked control for auto button and link tracking. A link carries its
// link type, and one to another scheme is skipped. A role="button" anchor carries one
// only when it leaves the page; otherwise it stays a plain button.
export function describeButtonClick(
    control: Element,
    path: Array<EventTarget | null> = []
): IButtonClick | undefined {
    let link: ILinkDetails | undefined;
    if (control.matches('a[href]:not([role="button"])')) {
        link = describeLink(control);
        if (!link) {
            return undefined;
        }
    } else if (control.matches('a[href]')) {
        link = describeLink(control);
        if (link && link.type === 'same_page') {
            link = undefined;
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
    // hand-written identifiers alone. So does a control acting as one or
    // wrapping one, and a label, whose click the browser passes on to its box
    // as a second event.
    const choice = box || choiceOf(control, path);
    // A checkbox's identifiers name its question, which its state answers. A
    // radio's id, test id and the panel it opens name the option picked, so
    // only the name of its input, the question, goes with it. A wrapper's own
    // name, or a role radio's, can name the option instead.
    // An option of a list box, like a radio, names the answer picked.
    const radio =
        isRadio(choice) || (!!choice && choice.matches('[role~="option"]'));
    const named = !radio
        ? control
        : choice instanceof HTMLInputElement
        ? choice
        : null;
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
        elementId: radio
            ? undefined
            : stableIdentifier(control.getAttribute('id')),
        elementName: (choice ? questionName : stableIdentifier)(
            named && named.getAttribute('name')
        ),
        testId: radio
            ? undefined
            : firstIdentifier(control, TEST_ID_ATTRIBUTES),
        controls: radio ? undefined : controlsIdentifier(control),
        form: formIdentifier(control),
        group: choice ? groupName(choice) : undefined,
        element,
        type: controlType(control),
        linkType: link ? link.type : undefined,
        linkDomain: link ? link.domain : undefined,
        fileExtension: link ? link.fileExtension : undefined,
        // The box as the click left it: the browser toggles it before the click
        // reaches listeners, and puts it back if the click is cancelled.
        checked: box ? box.checked : undefined,
    };
}

// The question a picker answers, from the group around it: the group's
// aria-label, aria-labelledby or legend, masked like a label and cut at its
// first colon, since a legend can repeat the pick ("Color: Navy"). Never the
// option's own text, which is the shopper's answer.
const NAMED_GROUP = '[role="radiogroup"], [role="listbox"], [role="group"], fieldset';

function groupName(choice: Element): string | undefined {
    const group = choice.closest(NAMED_GROUP);
    if (!group) {
        return undefined;
    }
    let raw = nonBlank(group.getAttribute('aria-label'));
    if (!raw) {
        const ids = group.getAttribute('aria-labelledby');
        const legend =
            group.tagName === 'FIELDSET'
                ? Array.from(group.children).filter(
                      child => child.tagName === 'LEGEND'
                  )[0]
                : undefined;
        const root = (isFunction(group.getRootNode)
            ? group.getRootNode()
            : document) as Document | ShadowRoot;
        const source = ids
            ? root.getElementById
                ? root.getElementById(ids.trim().split(/\s+/)[0])
                : null
            : legend || null;
        // A label that is, holds or sits in an option, or in an option's
        // label, would name the answer.
        const holder = source ? source.closest('label') : null;
        raw =
            source &&
            !source.closest(CHOICE) &&
            !source.querySelector(CHOICE) &&
            !(holder && (holder.control || holder.querySelector(CHOICE)))
                ? textOf(source)
                : undefined;
    }
    return raw ? maskLabel(raw.split(':')[0]) : undefined;
}

// A question about payment, read from the names its author gave it, so
// "checkout[payment_gateway]", "paymentMethod" and "tender_type" all count and
// "payee" does not. A radio's input name is its question; its group or
// fieldset speaks only for a radio with no name, as a role radio usually is.
const PAYMENT_QUESTION = /(?:^| )(?:pay|payment\w*|tenders?|gateways?)(?: |$)/;
const QUESTION_GROUP = '[role="radiogroup"], fieldset';

function isPaymentQuestion(radio: Element): boolean {
    const name = radio.getAttribute('name');
    const group = name ? null : radio.closest(QUESTION_GROUP);
    const question = group
        ? [
              group.getAttribute('id'),
              group.getAttribute('name'),
              group.getAttribute('aria-label'),
          ]
        : [name];
    return question.some(words => PAYMENT_QUESTION.test(nameWords(words)));
}

// What names a payment option: the radio's accessible name, the text and
// image of each label, and its hand-written ids, text masked like a label.
function optionNames(radio: Element): string[] {
    const names: Array<string | undefined> = [
        maskLabel(accessibleName(radio).raw),
    ];
    const labels =
        radio instanceof HTMLInputElement && radio.labels
            ? Array.from(radio.labels).slice(0, 2)
            : [];
    labels.forEach(label => {
        if (isShown(label) && !isUnsafeTextSource(label, radio)) {
            names.push(maskLabel(renderedText(label)));
            names.push(maskLabel(shownImageAlt(label)));
        }
    });
    names.push(
        stableIdentifier(radio.getAttribute('id')),
        firstIdentifier(radio, TEST_ID_ATTRIBUTES)
    );
    return names.filter(
        (name, index) => !!name && names.indexOf(name) === index
    );
}

// The payment radio a click picks and the names of its option, for the Rokt
// kit alone to read a payment method from. A radio's option is the shopper's
// answer, so these names never go into the logged click.
export interface IPaymentChoice {
    radio: Element;
    names: string[];
}

export function describePaymentChoice(
    control: Element,
    path: Array<EventTarget | null> = []
): IPaymentChoice | undefined {
    const choice = choiceOf(control, path);
    if (
        !isRadio(choice) ||
        hasComposedAncestor(choice, '[data-mp-no-track]') ||
        !isPaymentQuestion(choice)
    ) {
        return undefined;
    }
    const names = optionNames(choice);
    return names.length ? { radio: choice, names } : undefined;
}

// Read once the page has handled the click, which may have cancelled it.
export function isPicked(radio: Element): boolean {
    return radio instanceof HTMLInputElement
        ? radio.checked
        : radio.getAttribute('aria-checked') === 'true';
}
