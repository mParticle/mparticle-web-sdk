import { describeButtonClick } from '../../../src/buttonTracking/buttonDescription';
import { classifyIntentControl } from '../../../src/buttonTracking/checkoutIntent';
import { findControl } from '../../../src/buttonTracking/controls';

// Describes and classifies the control a click path lands on, as the tracker does.
const describeClick = (path: Array<EventTarget | null>) => {
    const control = findControl(path);
    return control ? describeButtonClick(control) : undefined;
};
const classify = (path: Array<EventTarget | null>, pathname: string) => {
    const control = findControl(path);
    return control ? classifyIntentControl(control, pathname) : undefined;
};

describe('describeButtonClick', () => {
    const control = (html: string) => {
        const parent = document.createElement('div');
        parent.innerHTML = html;
        return parent.firstElementChild!;
    };

    const describe1 = (html: string) => {
        document.body.innerHTML = html;
        return describeClick([document.body.firstElementChild]);
    };

    it.each([
        ['aria-label on an icon', '<button aria-label="Add to cart"><svg></svg></button>', 'add to cart', 'aria'],
        ['aria-labelledby', '<button aria-labelledby="a b"><svg></svg></button><span id="a">Remove</span><span id="b">Blue shirt</span>', 'remove blue shirt', 'labelledby'],
        ['an svg title', '<button><svg><title>Remove item</title></svg></button>', 'remove item', 'text'],
        ['screen-reader text', '<button><svg aria-hidden="true"></svg><span class="sr-only">Close</span></button>', 'close', 'text'],
        ['a plus sign', '<button>+</button>', '+', 'text'],
        ['a material icon ligature', '<button><span class="material-icons">add_shopping_cart</span></button>', 'add_shopping_cart', 'text'],
        ['an inner image alt', '<button><img src="/x.svg" alt="Remove"></button>', 'remove', 'alt'],
        ['a title attribute', '<button title="Remove"><svg></svg></button>', 'remove', 'title'],
        ['an image input', '<input type="image" src="/c.png" alt="Add to bag">', 'add to bag', 'alt'],
        ['a submit input value', '<input type="submit" value="Continue">', 'continue', 'value'],
        ['a submit input without a value', '<input type="submit">', 'submit', 'value'],
    ])('names a button from %s', (_, html, label, labelSource) => {
        expect(describe1(html)).toEqual(
            expect.objectContaining({ label, labelSource })
        );
    });

    it('keeps a masked aria-label on its own as well', () => {
        expect(
            describe1('<button aria-label="Remove Blue Shirt size 10">×</button>')
        ).toEqual(
            expect.objectContaining({
                label: 'remove blue shirt size #',
                labelSource: 'aria',
                ariaLabel: 'remove blue shirt size #',
            })
        );
        expect(
            describe1('<button aria-labelledby="x" aria-label="Close">×</button><span id="x">Dismiss offer</span>')
        ).toEqual(
            expect.objectContaining({ label: 'dismiss offer', ariaLabel: 'close' })
        );
    });

    it.each([
        [
            'opted out with data-mp-no-track',
            '<button aria-labelledby="r">Save</button><div data-mp-no-track><span id="r">Jane Smith</span></div>',
        ],
        [
            'holding a no-track element',
            '<button aria-labelledby="r">Save</button><span id="r">Hi <b data-mp-no-track>Jane</b></span>',
        ],
        ['a textarea', '<button aria-labelledby="r">Save</button><textarea id="r">12 Smith St</textarea>'],
        [
            'a container with a select',
            '<button aria-labelledby="r">Save</button><div id="r">Ship to <select><option selected>Jane Smith</option></select></div>',
        ],
        ['an editable region', '<button aria-labelledby="r">Save</button><div id="r" contenteditable="true">Jane Smith</div>'],
        [
            'an option inside a select',
            '<button aria-labelledby="r">Save</button><select><option id="r" selected>Jane Smith</option></select>',
        ],
    ])('never names a button from an aria-labelledby reference %s', (_, html) => {
        expect(describe1(html)).toEqual(
            expect.objectContaining({ label: 'save', labelSource: 'text' })
        );
    });

    it.each([
        ['the hidden attribute', '<span hidden>Jane Doe</span>'],
        ['display: none', '<span style="display: none">Jane Doe</span>'],
        ['visibility: hidden', '<span style="visibility: hidden">Jane Doe</span>'],
        ['aria-hidden', '<span aria-hidden="true">Jane Doe</span>'],
        ['a script', '<script type="application/json">{"name":"Jane Doe"}</script>'],
        ['a style', '<style>.jane-doe{}</style>'],
    ])('leaves text hidden by %s out of the label', (_, hidden) => {
        expect(describe1(`<button>Save ${hidden}</button>`)).toEqual(
            expect.objectContaining({ label: 'save', labelSource: 'text' })
        );
        expect(
            describe1(`<button aria-labelledby="r"><svg></svg></button><span id="r">Save ${hidden}</span>`)
        ).toEqual(expect.objectContaining({ label: 'save', labelSource: 'labelledby' }));
    });

    it('leaves text a stylesheet hides out of the label', () => {
        expect(
            describe1('<button>Save <span class="secret">Jane Doe</span></button><style>.secret { display: none }</style>')
        ).toEqual(expect.objectContaining({ label: 'save', labelSource: 'text' }));
    });

    it('drops a hidden aria-labelledby reference and names the button another way', () => {
        expect(
            describe1('<button aria-labelledby="r">Save</button><span id="r" hidden>Jane Doe</span>')
        ).toEqual(expect.objectContaining({ label: 'save', labelSource: 'text' }));
    });

    it.each([
        ['the hidden attribute', 'hidden'],
        ['display: none', 'style="display: none"'],
        ['visibility: hidden', 'style="visibility: hidden"'],
        ['aria-hidden', 'aria-hidden="true"'],
        ['inert', 'inert'],
    ])('drops an aria-labelledby reference inside a container hidden by %s', (_, hiding) => {
        expect(
            describe1(`<button aria-labelledby="r">Save</button><div ${hiding}><span id="r">Jane Doe</span></div>`)
        ).toEqual(expect.objectContaining({ label: 'save', labelSource: 'text' }));
    });

    it('reads no text from a button inside an aria-hidden container', () => {
        document.body.innerHTML = '<div aria-hidden="true"><button>Jane Doe</button></div>';
        const button = document.body.querySelector('button');

        expect(describeClick([button, button.parentElement])).toEqual(
            expect.objectContaining({ label: undefined, labelSource: 'none' })
        );
    });

    it.each([
        ['an SVG with display: none', '<svg style="display: none"><text>Jane Doe</text></svg>'],
        ['SVG text with visibility: hidden', '<svg><text style="visibility: hidden">Jane Doe</text></svg>'],
        ['a hidden SVG with a title', '<svg style="display: none"><title>Jane Doe</title></svg>'],
    ])('leaves text in %s out of the label', (_, svg) => {
        expect(describe1(`<button>Save ${svg}</button>`)).toEqual(
            expect.objectContaining({ label: 'save', labelSource: 'text' })
        );
    });

    it.each([
        ['the hidden attribute', '<img hidden alt="Jane Doe">'],
        ['display: none', '<img style="display: none" alt="Jane Doe">'],
        ['a hidden container', '<span hidden><img alt="Jane Doe"></span>'],
        ['aria-hidden', '<img aria-hidden="true" alt="Jane Doe">'],
    ])('never names a button from an image hidden by %s', (_, image) => {
        expect(describe1(`<button>${image}</button>`)).toEqual(
            expect.objectContaining({ label: undefined, labelSource: 'none' })
        );
    });

    describe('with text a shadow host shows through a slot', () => {
        const describeWithShadow = (shadow: string, text = 'Jane Doe') => {
            document.body.innerHTML = `<button>Save <span id="host"><span slot="name">${text}</span></span></button>`;
            document.getElementById('host')!.attachShadow({ mode: 'open' }).innerHTML = shadow;
            return describeClick([document.body.querySelector('button')]);
        };

        it.each([
            ['a hidden slot', '<slot name="name" hidden></slot>'],
            ['an aria-hidden slot', '<slot name="name" aria-hidden="true"></slot>'],
            ['a slot with display: none', '<slot name="name" style="display: none"></slot>'],
            ['a slot inside a hidden container', '<div hidden><slot name="name"></slot></div>'],
            ['no slot that takes it', '<slot></slot>'],
        ])('leaves the text out when it goes to %s', (_, shadow) => {
            expect(describeWithShadow(shadow)).toEqual(
                expect.objectContaining({ label: 'save', labelSource: 'text' })
            );
        });

        it('reads the text when its slot is shown', () => {
            expect(describeWithShadow('<slot name="name"></slot>', 'Draft')).toEqual(
                expect.objectContaining({ label: 'save draft', labelSource: 'text' })
            );
        });
    });

    it('names a button from its first shown image', () => {
        expect(describe1('<button><img hidden alt="Jane Doe"><img alt="Close"></button>')).toEqual(
            expect.objectContaining({ label: 'close', labelSource: 'alt' })
        );
    });

    it('never reads editable text as a label', () => {
        expect(describe1('<div role="button" contenteditable="true">Jane Smith</div>')).toEqual(
            expect.objectContaining({ label: undefined, labelSource: 'none' })
        );
        expect(describe1('<button><span contenteditable>Jane Smith</span></button>')).toEqual(
            expect.objectContaining({ label: undefined, labelSource: 'none' })
        );
        document.body.innerHTML = '<div contenteditable="true"><button>Bold</button></div>';
        expect(describeClick([document.querySelector('button')])).toEqual(
            expect.objectContaining({ label: undefined, labelSource: 'none' })
        );
    });

    it('describes an unnamed icon button with no label', () => {
        expect(describe1('<button><svg><path d="M0 0"/></svg></button>')).toEqual({
            label: undefined,
            labelSource: 'none',
            ariaLabel: undefined,
            icon: undefined,
            element: 'button',
            type: 'submit',
        });
    });

    it.each([
        ['an svg sprite', '<button><svg><use href="#icon-trash"></use></svg></button>', 'trash'],
        ['an xlink sprite', '<button><svg><use xlink:href="/sprite.svg#cart"></use></svg></button>', 'cart'],
        ['a font icon class', '<button><i class="fa fa-solid fa-trash fa-lg"></i></button>', 'trash'],
        ['an icon class on the button', '<button class="btn icon-plus"></button>', 'plus'],
        ['a bootstrap icon', '<button><i class="bi bi-x-lg"></i></button>', 'x-lg'],
    ])('reads an icon name from %s', (_, html, icon) => {
        expect(describe1(html)).toEqual(expect.objectContaining({ icon }));
    });

    it('never reads an icon from a data-mp-no-track part of the button', () => {
        expect(
            describe1('<button>Save <span data-mp-no-track><svg><use href="#icon-private"></use></svg></span></button>')
        ).toEqual(expect.objectContaining({ icon: undefined }));
        expect(
            describe1('<button><span data-mp-no-track><i class="fa fa-secret"></i></span><i class="fa fa-trash"></i></button>')
        ).toEqual(expect.objectContaining({ icon: 'trash' }));
    });

    it('keeps only letters and hyphens in icon names', () => {
        expect(describe1('<button><svg><use href="#u123"></use></svg></button>')).toEqual(
            expect.objectContaining({ icon: undefined })
        );
        expect(describe1('<button><i class="fa fa-2x"></i></button>')).toEqual(
            expect.objectContaining({ icon: undefined })
        );
    });

    it.each([
        ['add-to-cart', 'add-to-cart'],
        ['btnCheckout', 'btnCheckout'],
        ['step_2', 'step_2'],
        ['place-order-btn', 'place-order-btn'],
        ['cart-item-3-remove', 'cart-item-3-remove'],
        ['ember1234', undefined],
        ['a8f3e2c1', undefined],
        ['radix-:r1:', undefined],
        ['order-12345678', undefined],
        ['tel-555-123-456', undefined],
        ['card-12-34', undefined],
        ['1234', undefined],
        ['jane@example.com', undefined],
        ['x'.repeat(65), undefined],
    ])('keeps the id %s only when it looks hand-written', (id, expected) => {
        document.body.innerHTML = '<button>Go</button>';
        const target = document.querySelector('button')!;
        target.setAttribute('id', id);
        expect(describeClick([target])).toEqual(
            expect.objectContaining({ elementId: expected })
        );
    });

    it('reads the name attribute and the first hand-written test id', () => {
        expect(
            describe1('<button name="checkout" data-testid="a8f3e2c1" data-qa="checkout-button">Checkout</button>')
        ).toEqual(
            expect.objectContaining({
                elementName: 'checkout',
                testId: 'checkout-button',
            })
        );
    });

    it('reads what a button controls and its form', () => {
        document.body.innerHTML =
            '<form id="checkout-form"><button aria-controls="mini-cart">Add</button></form>';
        expect(describeClick([document.querySelector('button')])).toEqual(
            expect.objectContaining({
                controls: 'mini-cart',
                form: 'checkout-form',
            })
        );
        document.body.innerHTML =
            '<form id="pdp-form"></form><button popovertarget="size-guide" form="pdp-form">Sizes</button>';
        expect(describeClick([document.querySelector('button')])).toEqual(
            expect.objectContaining({ controls: 'size-guide', form: 'pdp-form' })
        );
        expect(describe1('<button aria-controls="menu cart">Menu</button>')).toEqual(
            expect.objectContaining({ controls: 'menu' })
        );
        expect(describe1('<button commandfor="cart-drawer">Cart</button>')).toEqual(
            expect.objectContaining({ controls: 'cart-drawer' })
        );
    });

    it('leaves out a form the button does not actually submit', () => {
        expect(describe1('<button form="missing-form">Go</button>')).toEqual(
            expect.objectContaining({ form: undefined })
        );
        document.body.innerHTML =
            '<form id="pdp-form"></form><div role="button" form="pdp-form">Go</div>';
        expect(describeClick([document.querySelector('[role="button"]')])).toEqual(
            expect.objectContaining({ form: undefined })
        );
        document.body.innerHTML =
            '<form id="checkout-form"><input name="id" value="x"><button>Pay</button></form>';
        expect(describeClick([document.querySelector('button')])).toEqual(
            expect.objectContaining({ form: 'checkout-form' })
        );
    });

    it('keeps controls and form only when hand-written', () => {
        document.body.innerHTML =
            '<form id="form-12345678"><button aria-controls="radix-:r1:">Go</button></form>';
        expect(describeClick([document.querySelector('button')])).toEqual(
            expect.objectContaining({ controls: undefined, form: undefined })
        );
    });

    it("never sends a button's value, which is form data", () => {
        const data = describe1('<button name="to" value="janesmith">Send</button>');
        expect(JSON.stringify(data)).not.toContain('janesmith');
    });

    it.each([
        ['text', ' type="text"'],
        ['password', ' type="password"'],
        ['untyped', ''],
        ['unknown type', ' type="anything-at-all"'],
    ])('never reads %s input values even with button role', (_, typeAttribute) => {
        const input = control(`<input${typeAttribute} role="button">`);
        const read = jest.fn(() => {
            throw new Error('field value read');
        });
        Object.defineProperty(input, 'value', { get: read });
        expect(describeClick([input])).toEqual(
            expect.objectContaining({ label: undefined, labelSource: 'none' })
        );
        expect(read).not.toHaveBeenCalled();
    });

    it('reports element and type', () => {
        expect(describe1('<button type="button">Menu</button>')).toEqual(
            expect.objectContaining({ element: 'button', type: 'button' })
        );
        expect(describe1('<button type="reset">Clear</button>')).toEqual(
            expect.objectContaining({ element: 'button', type: 'reset' })
        );
        expect(describe1('<input type="button" value="Apply">')).toEqual(
            expect.objectContaining({ element: 'input', type: 'button' })
        );
        expect(describe1('<input role="button" type="anything-at-all" value="Go">')).toEqual(
            expect.objectContaining({ element: 'input', type: 'text' })
        );
        expect(describe1('<div role="button">Next</div>')).toEqual(
            expect.objectContaining({ element: 'role', type: 'button' })
        );
        expect(describe1('<a role="button" href="#">Submit order</a>')).toEqual(
            expect.objectContaining({ element: 'role', label: 'submit order' })
        );
        expect(describe1('<apple-pay-button></apple-pay-button>')).toEqual(
            expect.objectContaining({ element: 'wallet', type: 'button' })
        );
    });

    it.each([
        ['a same-page anchor', '<a href="#reviews">Reviews</a>', { linkType: 'same_page' }],
        ['an empty href', '<a href="">Open menu</a>', { linkType: 'same_page' }],
        ['a javascript link', '<a href="JavaScript:void(0)">More</a>', { linkType: 'same_page' }],
        ['the current page', '<a href="/">Home</a>', { linkType: 'same_page' }],
        ['an outbound link', '<a href="https://Example.org/help">Help</a>', { linkType: 'outbound', linkDomain: 'example.org' }],
        ['a download attribute', '<a href="/files/menu" download>Menu</a>', { linkType: 'download' }],
        ['a file link', '<a href="/files/menu.PDF">Menu</a>', { linkType: 'download', fileExtension: 'pdf' }],
        [
            'a file on another host',
            '<a href="https://cdn.example.org/menu.docx?v=2">Menu</a>',
            { linkType: 'download', linkDomain: 'cdn.example.org', fileExtension: 'docx' },
        ],
    ])('describes a link page views cannot see: %s', (_name, html, expected) => {
        const description = describe1(html);
        expect(description).toEqual(expect.objectContaining({ element: 'link', type: 'button', ...expected }));
        expect(description.linkDomain).toBe((expected as { linkDomain?: string }).linkDomain);
        expect(description.fileExtension).toBe((expected as { fileExtension?: string }).fileExtension);
    });

    it.each([
        ['navigation within the site', '<a href="/help">Help</a>'],
        ['the same path with another query', '<a href="/?page=2">Next</a>'],
        ['a mail link', '<a href="mailto:help@example.com">Email us</a>'],
        ['a phone link', '<a href="tel:5551234">Call us</a>'],
    ])('leaves %s to page views', (_name, html) => {
        expect(describe1(html)).toBeUndefined();
    });

    it('describes a link acting as a button from its aria attributes', () => {
        expect(
            describe1(
                '<a href="javascript:void(0)" aria-controls="Quantity1" aria-label="Add adult ticket"><img src="/plus.png" alt="Add"></a>'
            )
        ).toEqual(
            expect.objectContaining({
                element: 'link',
                linkType: 'same_page',
                label: 'add adult ticket',
                labelSource: 'aria',
                controls: 'Quantity1',
            })
        );
    });

    it('describes a link from a click on its image and never keeps its href', () => {
        document.body.innerHTML =
            '<a href="https://tickets.example.org/seats?show=1">4:45pm <img src="/x.png" alt=""></a>';
        const link = document.body.firstElementChild!;
        const description = describeClick([link.querySelector('img'), link, document.body]);
        expect(description).toEqual(
            expect.objectContaining({
                element: 'link',
                linkType: 'outbound',
                linkDomain: 'tickets.example.org',
                label: '#:#pm',
            })
        );
        expect(JSON.stringify(description)).not.toMatch(/seats|show=/);
    });

    it('drops an unsafe link label', () => {
        expect(describe1('<a href="#account">jane@example.com</a>')).toEqual(
            expect.objectContaining({ element: 'link', label: undefined, labelSource: 'none' })
        );
    });

    it('keeps a link with role="button" a role button without a link type', () => {
        expect(describe1('<a role="button" href="/next">Next</a>')).toEqual(
            expect.objectContaining({ element: 'role', linkType: undefined })
        );
    });

    it('masks the label and drops an unsafe one', () => {
        expect(describe1('<button>Pay $84.20</button>')).toEqual(
            expect.objectContaining({ label: 'pay $#', labelSource: 'text' })
        );
        expect(describe1('<button>Hi jane@example.com</button>')).toEqual(
            expect.objectContaining({ label: undefined, labelSource: 'none' })
        );
    });

    it('skips disabled controls, data-mp-no-track and Rokt elements', () => {
        expect(describe1('<button disabled>Add to cart</button>')).toBeUndefined();
        expect(describe1('<button aria-disabled="true">Add to cart</button>')).toBeUndefined();
        const wrapped = control('<div data-mp-no-track><button>Add to cart</button></div>');
        expect(describeClick([wrapped.firstElementChild])).toBeUndefined();
        expect(
            classify([control('<div data-mp-no-track><button>Place order</button></div>').firstElementChild], '/checkout')
        ).toBeUndefined();
        const rokt = control('<div data-core-type="x"><button>Add to cart</button></div>');
        expect(describeClick([rokt.firstElementChild, rokt])).toBeUndefined();
    });

    it('honours data-mp-no-track on a clicked child and across shadow roots', () => {
        const marked = control('<button>Add to cart <span data-mp-no-track>x</span></button>');
        expect(describeClick([marked.querySelector('span'), marked])).toBeUndefined();
        expect(describeClick([marked])).toEqual(
            expect.objectContaining({ label: undefined, labelSource: 'none' })
        );

        const host = document.createElement('div');
        host.setAttribute('data-mp-no-track', '');
        document.body.appendChild(host);
        const shadowButton = document.createElement('button');
        shadowButton.textContent = 'Add to cart';
        host.attachShadow({ mode: 'open' }).appendChild(shadowButton);
        expect(describeClick([shadowButton])).toBeUndefined();
        host.remove();

        // A slotted button under a marked shadow ancestor.
        const outer = document.createElement('div');
        document.body.appendChild(outer);
        const root = outer.attachShadow({ mode: 'open' });
        root.innerHTML = '<div data-mp-no-track><slot></slot></div>';
        const slotted = document.createElement('button');
        slotted.textContent = 'Place order';
        outer.appendChild(slotted);
        expect(describeClick([slotted])).toBeUndefined();
        expect(classify([slotted], '/checkout')).toBeUndefined();
        outer.remove();

        // A control deep inside a Rokt placement's shadow tree, past the
        // 12-entry click path.
        const placement = document.createElement('div');
        placement.setAttribute('data-core-type', 'placement');
        document.body.appendChild(placement);
        let parent: Element = placement.attachShadow({ mode: 'open' })
            .appendChild(document.createElement('div'));
        for (let i = 0; i < 15; i++) {
            parent = parent.appendChild(document.createElement('div'));
        }
        const roktButton = parent.appendChild(document.createElement('button'));
        roktButton.textContent = 'Place order';
        expect(describeClick([roktButton])).toBeUndefined();
        expect(classify([roktButton], '/checkout')).toBeUndefined();
        placement.remove();
    });

    it('never reads a form field inside the control', () => {
        expect(
            describeClick([control('<button>Apply <input value="jane@example.com"></button>')])
        ).toEqual(expect.objectContaining({ label: undefined, labelSource: 'none' }));
    });

    describe('checkboxes and radios', () => {
        const input = (html: string) => {
            document.body.innerHTML = html;
            return document.body.querySelector('input')!;
        };

        it('describes a checkbox by its state and hand-written identifiers, never its label', () => {
            const box = input(
                '<input type="checkbox" id="f" name="filter" value="Size 10"><label for="f">Blankets (5)</label>'
            );
            box.checked = true;

            expect(describeClick([box, document.body])).toEqual(
                expect.objectContaining({
                    label: undefined,
                    labelSource: 'none',
                    element: 'input',
                    type: 'checkbox',
                    elementId: 'f',
                    elementName: 'filter',
                    checked: true,
                })
            );
        });

        it('describes a radio inside its label by its state, unchecked as well as checked', () => {
            const radio = input('<label><input type="radio" name="speed"> Express delivery</label>');
            const path = [radio, radio.parentElement, document.body];

            expect(describeClick(path)).toEqual(
                expect.objectContaining({
                    label: undefined,
                    labelSource: 'none',
                    type: 'radio',
                    elementName: 'speed',
                    checked: false,
                })
            );
            radio.checked = true;
            expect(describeClick(path)).toEqual(expect.objectContaining({ checked: true }));
        });

        it.each([
            ['a label tied to it', '<input type="checkbox" id="x"><label for="x">I have a disability</label>'],
            ['a label around it', '<label><input type="checkbox"> Jane Doe, 12 Main St</label>'],
            ['an aria-label', '<input type="checkbox" aria-label="I have a disability">'],
            ['aria-labelledby', '<input type="radio" aria-labelledby="x"><span id="x">Jane Doe</span>'],
            ['a title', '<input type="radio" title="Jane Doe">'],
        ])('never sends text from %s with a box', (_, html) => {
            const box = input(html);
            box.checked = true;

            expect(describeClick([box, box.parentElement])).toEqual(
                expect.objectContaining({
                    label: undefined,
                    labelSource: 'none',
                    ariaLabel: undefined,
                    checked: true,
                })
            );
        });

        it.each([
            ['a switch', '<button role="switch" aria-checked="true">Share my location</button>'],
            ['a checkbox role', '<button role="checkbox" aria-checked="true" aria-label="I have a disability"></button>'],
            ['a radio role', '<button role="radio" aria-checked="true" title="Jane Doe"></button>'],
            ['a menu checkbox', '<button role="menuitemcheckbox" aria-checked="true">Jane Doe</button>'],
            ['a link acting as a menu radio', '<a href="#" role="menuitemradio" aria-checked="true">Jane Doe</a>'],
            ['a fallback role list', '<button role="switch checkbox" aria-checked="true">Jane Doe</button>'],
            ['an icon on a switch', '<button role="switch" aria-checked="true"><i class="fa-wheelchair"></i></button>'],
            ['a label that passes its click on to a box', '<input type="checkbox" id="x"><label role="button" for="x">I have a disability</label>'],
            ['a label around a box', '<label role="button" aria-label="Jane Doe"><input type="radio"></label>'],
        ])('sends no text with %s, which acts as a box', (_, html) => {
            document.body.innerHTML = html;
            const control = document.body.querySelector('button, a, label')!;

            expect(describeClick([control, document.body])).toEqual(
                expect.objectContaining({
                    label: undefined,
                    labelSource: 'none',
                    ariaLabel: undefined,
                    icon: undefined,
                    checked: undefined,
                })
            );
        });

        const optionIdentifiers =
            'id="disability-yes" name="disability" data-testid="disability-yes" aria-controls="disability-details"';

        it.each([
            ['a radio', `<input type="radio" ${optionIdentifiers}>`],
            ['a radio role', `<button role="radio" aria-checked="true" ${optionIdentifiers}></button>`],
            ['a menu radio', `<button role="menuitemradio" aria-checked="true" ${optionIdentifiers}></button>`],
            ['a label for a radio', `<input type="radio" id="r"><label role="button" for="r" ${optionIdentifiers}></label>`],
            ['a row around a radio', `<div role="button" ${optionIdentifiers}><input type="radio"></div>`],
        ])('sends %s with the name of its question, never the identifiers of its option', (_, html) => {
            document.body.innerHTML = html;

            expect(describeClick([document.getElementById('disability-yes'), document.body])).toEqual(
                expect.objectContaining({
                    elementName: 'disability',
                    elementId: undefined,
                    testId: undefined,
                    controls: undefined,
                })
            );
        });

        it('keeps the identifiers of a checkbox, which name its question', () => {
            document.body.innerHTML =
                '<input type="checkbox" id="gift-wrap" name="gift" data-testid="gift-wrap" aria-controls="gift-note">';

            expect(describeClick([document.body.firstElementChild, document.body])).toEqual(
                expect.objectContaining({
                    elementId: 'gift-wrap',
                    elementName: 'gift',
                    testId: 'gift-wrap',
                    controls: 'gift-note',
                })
            );
        });

        it('keeps the text of a label acting as a button for a text field', () => {
            document.body.innerHTML = '<label role="button" for="x">Email</label><input id="x">';

            expect(describeClick([document.body.querySelector('label'), document.body])).toEqual(
                expect.objectContaining({ label: 'email', labelSource: 'text' })
            );
        });

        it('keeps a button or link around the box as the control', () => {
            const radio = input(
                '<div role="button" aria-label="Pay with PayPal"><input type="radio" name="method"></div>'
            );
            const path = [radio, radio.parentElement, document.body];

            expect(describeClick(path)).toEqual(
                expect.objectContaining({ label: undefined, element: 'role', checked: undefined })
            );
            expect(classify(path, '/checkout')).toEqual(
                classify([radio.parentElement], '/checkout')
            );
        });

        it.each([
            ['an aria-label', '<div role="button" aria-label="Ship to Jane Doe"><input type="radio" name="address"></div>'],
            ['aria-labelledby', '<a href="#" aria-labelledby="x"><input type="checkbox"></a><span id="x">Jane Doe</span>'],
            ['a title', '<button title="Jane Doe"><span role="radio" aria-checked="true"></span></button>'],
            ['an icon', '<div role="button"><input type="checkbox"><i class="fa-wheelchair"></i></div>'],
        ])('sends no text from %s on a button or link that wraps a box', (_, html) => {
            document.body.innerHTML = html;
            const control = document.body.firstElementChild!;
            const box = control.querySelector('input, [role="radio"]')!;

            expect(describeClick([box, control, document.body])).toEqual(
                expect.objectContaining({
                    label: undefined,
                    labelSource: 'none',
                    ariaLabel: undefined,
                    icon: undefined,
                    checked: undefined,
                })
            );
        });

        it('leaves a click on the label itself to the click the browser passes to the box', () => {
            input('<input type="checkbox" id="f"><label for="f">Gift wrap</label>');
            const label = document.body.querySelector('label')!;

            expect(findControl([label, document.body])).toBeUndefined();
        });

        it('skips a disabled box', () => {
            const box = input('<input type="checkbox" disabled><label>Gift wrap</label>');

            expect(findControl([box, document.body])).toBeUndefined();
        });

        it('never counts a checkbox or radio as checkout intent, whatever its label', () => {
            const radio = input('<input type="radio" id="r"><label for="r">Place order</label>');
            const box = document.createElement('input');
            box.type = 'checkbox';
            box.setAttribute('aria-label', 'Pay with PayPal');
            document.body.appendChild(box);

            expect(classify([radio, document.body], '/checkout')).toBeUndefined();
            expect(classify([box, document.body], '/checkout')).toBeUndefined();
        });
    });
});
