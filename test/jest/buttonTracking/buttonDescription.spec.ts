import {
    describeButtonClick,
    describePaymentChoice,
    isLinkClick,
    isPicked,
    LinkType,
} from '../../../src/buttonTracking/buttonDescription';
import { classifyIntentControl } from '../../../src/buttonTracking/checkoutIntent';
import { findControl } from '../../../src/buttonTracking/controls';

// Describes and classifies the control a click path lands on, as the tracker does.
const describeClick = (path: Array<EventTarget | null>) => {
    const control = findControl(path);
    return control ? describeButtonClick(control, path) : undefined;
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

    it('reads text that sets visibility back to visible inside a hidden container', () => {
        expect(
            describe1('<button style="visibility: hidden"><span style="visibility: visible">Place order</span></button>')
        ).toEqual(expect.objectContaining({ label: 'place order', labelSource: 'text' }));
        expect(
            describe1(
                '<button aria-labelledby="r"><svg></svg></button>' +
                    '<div style="visibility: hidden"><span id="r"><span style="visibility: visible">Place order</span></span></div>'
            )
        ).toEqual(expect.objectContaining({ label: 'place order', labelSource: 'labelledby' }));
    });

    it('leaves out text that inherits visibility: hidden', () => {
        expect(
            describe1('<button>Save <span style="visibility: hidden">Jane <b>Doe</b></span></button>')
        ).toEqual(expect.objectContaining({ label: 'save', labelSource: 'text' }));
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
        ['visibility: hidden on a container', '<span style="visibility: hidden"><img alt="Jane Doe"></span>'],
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

        it('leaves the text out when its slot sits in another slot that shows assigned nodes instead', () => {
            document.body.innerHTML =
                '<button>Save <span id="host"><span slot="name">Jane Doe</span><span slot="outer">Draft</span></span></button>';
            document.getElementById('host')!.attachShadow({ mode: 'open' }).innerHTML =
                '<slot name="outer"><slot name="name"></slot></slot>';

            expect(describeClick([document.body.querySelector('button')])).toEqual(
                expect.objectContaining({ label: 'save draft', labelSource: 'text' })
            );
        });

        it('reads the text when its slot is the fallback of a slot nothing is assigned to', () => {
            expect(describeWithShadow('<slot name="outer"><slot name="name"></slot></slot>', 'Draft')).toEqual(
                expect.objectContaining({ label: 'save draft', labelSource: 'text' })
            );
        });
    });

    describe('with a light child that no slot of its open shadow host takes', () => {
        const describeWithShadow = (html: string) => {
            document.body.innerHTML = html;
            document.getElementById('host')!.attachShadow({ mode: 'open' }).innerHTML = '<slot></slot>';
            return describeClick([document.body.querySelector('button')]);
        };

        it('never names a button from it as an aria-labelledby reference', () => {
            expect(
                describeWithShadow(
                    '<button aria-labelledby="r">Save</button><span id="host"><span id="r" slot="name">Jane Doe</span></span>'
                )
            ).toEqual(expect.objectContaining({ label: 'save', labelSource: 'text' }));
        });

        it('never names a button from it as an image', () => {
            expect(
                describeWithShadow('<button><span id="host"><img alt="Jane Doe" slot="name"></span></button>')
            ).toEqual(expect.objectContaining({ label: undefined, labelSource: 'none' }));
        });
    });

    describe('with a button in a shadow root that holds a slot', () => {
        const describeInShadow = (light: string, button: string) => {
            document.body.innerHTML = `<div id="host">${light}</div>`;
            const root = document.getElementById('host')!.attachShadow({ mode: 'open' });
            root.innerHTML = button;
            return describeClick([root.querySelector('button')]);
        };

        it('reads the nodes assigned to the slot and never its fallback', () => {
            expect(describeInShadow('<span>Place order</span>', '<button><slot>Secret fallback</slot></button>')).toEqual(
                expect.objectContaining({ label: 'place order', labelSource: 'text' })
            );
        });

        it("reads the slot's fallback when nothing is assigned to it", () => {
            expect(describeInShadow('', '<button><slot>Checkout</slot></button>')).toEqual(
                expect.objectContaining({ label: 'checkout', labelSource: 'text' })
            );
        });

        it('leaves out an assigned node that is hidden', () => {
            expect(
                describeInShadow('Place order <span hidden>Jane Doe</span>', '<button><slot></slot></button>')
            ).toEqual(expect.objectContaining({ label: 'place order', labelSource: 'text' }));
        });

        it('never names the button from a form field assigned to the slot', () => {
            expect(
                describeInShadow(
                    '<span>Ship to</span><select><option selected>Jane Smith</option></select>',
                    '<button><slot></slot></button>'
                )
            ).toEqual(expect.objectContaining({ label: undefined, labelSource: 'none' }));
        });
    });

    it('counts collapsed whitespace, not markup indentation, toward the label length', () => {
        const paths = new Array(40).join('\n                <path d="M0 0h24v24H0z"></path>');
        expect(
            describe1(`<button>\n            <svg>${paths}\n            </svg>\n            <span>Add to cart</span>\n        </button>`)
        ).toEqual(expect.objectContaining({ label: 'add to cart', labelSource: 'text' }));
        expect(
            describe1(`<button><span>Add</span>\n            <svg>${paths}\n            </svg>\n            <span>to cart</span></button>`)
        ).toEqual(expect.objectContaining({ label: 'add to cart', labelSource: 'text' }));
    });

    it('never cuts a label short at a node boundary', () => {
        const gap = new Array(140).join(' ');
        expect(describe1(`<button><span>jane.doe</span>${gap}<span>@example.com</span></button>`)).toEqual(
            expect.objectContaining({ label: undefined, labelSource: 'none' })
        );
    });

    describe('style lookups', () => {
        let getComputedStyle: jest.SpyInstance;

        beforeEach(() => {
            getComputedStyle = jest.spyOn(window, 'getComputedStyle');
        });

        afterEach(() => {
            getComputedStyle.mockRestore();
        });

        it('looks up no style for the parts of an icon that hold no text', () => {
            const paths = new Array(301).join('<path d="M0 0h24v24H0z"></path>');
            expect(describe1(`<button><svg>${paths}</svg><span>Add to cart</span></button>`)).toEqual(
                expect.objectContaining({ label: 'add to cart', labelSource: 'text' })
            );
            expect(getComputedStyle.mock.calls.length).toBeLessThan(20);
        });

        it('gives no label once a label source takes too many to read', () => {
            const items = new Array(301).join('<span style="visibility: hidden">x</span>');
            expect(describe1(`<button aria-labelledby="r">Save</button><div id="r">${items}</div>`)).toEqual(
                expect.objectContaining({ label: undefined, labelSource: 'none' })
            );
            expect(getComputedStyle.mock.calls.length).toBeLessThan(200);
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
        expect(describe1('<button type="submit" id="applePayButton">Pay</button>')).toEqual(
            expect.objectContaining({ element: 'wallet', type: 'submit' })
        );
        expect(describe1('<div id="venmo-pay-btn"><span>Venmo</span></div>')).toEqual(
            expect.objectContaining({
                element: 'wallet',
                label: 'venmo',
                elementId: 'venmo-pay-btn',
            })
        );
    });

    it.each([
        ['a same-page anchor', '<a href="#reviews">Reviews</a>', { linkType: 'same_page' }],
        ['an empty href', '<a href="">Open menu</a>', { linkType: 'same_page' }],
        ['a javascript link', '<a href="JavaScript:void(0)">More</a>', { linkType: 'same_page' }],
        ['the current page', '<a href="/">Home</a>', { linkType: 'same_page' }],
        ['navigation within the site', '<a href="/help">Help</a>', { linkType: 'internal' }],
        ['the same path with another query', '<a href="/?page=2">Next</a>', { linkType: 'internal' }],
        ['an outbound link', '<a href="https://Example.org/help">Help</a>', { linkType: 'outbound', linkDomain: 'example.org' }],
        ['a download attribute', '<a href="/files/menu" download>Menu</a>', { linkType: 'download' }],
        ['a file link', '<a href="/files/menu.PDF">Menu</a>', { linkType: 'download', fileExtension: 'pdf' }],
        [
            'a file on another host',
            '<a href="https://cdn.example.org/menu.docx?v=2">Menu</a>',
            { linkType: 'download', linkDomain: 'cdn.example.org', fileExtension: 'docx' },
        ],
    ])('describes a link with its link type: %s', (_name, html, expected) => {
        const description = describe1(html);
        expect(description).toEqual(expect.objectContaining({ element: 'link', type: 'button', ...expected }));
        expect(description.linkDomain).toBe((expected as { linkDomain?: string }).linkDomain);
        expect(description.fileExtension).toBe((expected as { fileExtension?: string }).fileExtension);
    });

    it.each([
        ['a mail link', '<a href="mailto:help@example.com">Email us</a>'],
        ['a phone link', '<a href="tel:5551234">Call us</a>'],
    ])('skips %s', (_name, html) => {
        expect(describe1(html)).toBeUndefined();
    });

    it.each([
        ['same_page', false],
        ['internal', true],
        ['outbound', true],
        ['download', true],
        [undefined, false],
    ])('logs a click with link type %s as a link click: %s', (linkType, expected) => {
        expect(
            isLinkClick({ labelSource: 'none', element: 'link', type: 'button', linkType: linkType as LinkType })
        ).toBe(expected);
    });

    describe('cart controls', () => {
        it('describes a bag icon button as any button, and no cart click when it leads to the cart page', () => {
            expect(
                describe1(
                    '<button title="Shopping bag" aria-label="1 item in bag" data-testid="header-cart"><svg></svg></button>'
                )
            ).toEqual({
                label: '# item in bag',
                labelSource: 'aria',
                ariaLabel: '# item in bag',
                icon: undefined,
                elementId: undefined,
                elementName: undefined,
                testId: 'header-cart',
                controls: undefined,
                form: undefined,
                element: 'button',
                type: 'submit',
                linkType: undefined,
                linkDomain: undefined,
                fileExtension: undefined,
                checked: undefined,
            });
            expect(classify([document.body.firstElementChild], '/')).toBeUndefined();
        });

        it('names a title-only bag button from its title, and no cart click when it leads to the cart page', () => {
            expect(describe1('<button title="Shopping bag"><svg></svg></button>')).toEqual(
                expect.objectContaining({ label: 'shopping bag', labelSource: 'title', element: 'button' })
            );
            expect(classify([document.body.firstElementChild], '/')).toBeUndefined();
        });

        it('describes a cart link as an internal link, and never classifies it as cart', () => {
            expect(describe1('<a href="/bag" title="Shopping bag"><svg></svg></a>')).toEqual(
                expect.objectContaining({ element: 'link', linkType: 'internal', label: 'shopping bag' })
            );
            expect(classify([document.body.firstElementChild], '/')).toBeUndefined();
        });

        it('describes a cart checkbox with its checked state, and never counts it as intent', () => {
            expect(describe1('<input type="checkbox" aria-label="Add to bag">')).toEqual(
                expect.objectContaining({ label: undefined, ariaLabel: undefined, element: 'input', checked: false })
            );
            expect(classify([document.body.firstElementChild], '/')).toBeUndefined();
        });
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

    it.each([
        ['a same-page href', '<a role="button" href="#next">Next</a>'],
        ['a javascript href', '<a role="button" href="javascript:void(0)">Next</a>'],
        ['the current page', '<a role="button" href="/">Next</a>'],
        ['a mail link', '<a role="button" href="mailto:help@example.com">Email us</a>'],
    ])('keeps a link with role="button" and %s a role button without a link type', (_name, html) => {
        expect(describe1(html)).toEqual(expect.objectContaining({ element: 'role', linkType: undefined }));
    });

    it.each([
        ['another page of the site', '<a role="button" href="/next">Next</a>', { linkType: 'internal' }],
        ['another site', '<a role="button" href="https://example.org/next">Next</a>', { linkType: 'outbound', linkDomain: 'example.org' }],
        ['a file', '<a role="button" href="/menu.pdf">Menu</a>', { linkType: 'download', fileExtension: 'pdf' }],
    ])('gives a link with role="button" that leaves for %s its link type', (_name, html, expected) => {
        expect(describe1(html)).toEqual(expect.objectContaining({ element: 'role', ...expected }));
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
            'id="disability-yes" data-testid="disability-yes" aria-controls="disability-details"';

        it.each([
            ['a radio', `<input type="radio" name="disability" ${optionIdentifiers}>`],
            ['a label for a radio', `<input type="radio" id="r" name="disability"><label role="button" for="r" name="disability-yes" ${optionIdentifiers}></label>`],
            ['a row around a radio', `<div role="button" name="disability-yes" ${optionIdentifiers}><input type="radio" name="disability"></div>`],
            ['a button around a radio', `<button name="disability-yes" ${optionIdentifiers}><input type="radio" name="disability"></button>`],
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

        it.each([
            ['a radio role', `<button role="radio" aria-checked="true" name="disability-yes" ${optionIdentifiers}></button>`],
            ['a menu radio', `<button role="menuitemradio" aria-checked="true" name="disability-yes" ${optionIdentifiers}></button>`],
            ['a button around a radio role', `<button name="disability-yes" ${optionIdentifiers}><span role="radio" aria-checked="true"></span></button>`],
        ])('sends %s, with no radio input to name its question, with no name or option identifiers', (_, html) => {
            document.body.innerHTML = html;

            expect(describeClick([document.getElementById('disability-yes'), document.body])).toEqual(
                expect.objectContaining({
                    elementName: undefined,
                    elementId: undefined,
                    testId: undefined,
                    controls: undefined,
                })
            );
        });

        it.each([
            ['a swatch named for its product', '<input type="radio" name="color-swatches-48213907">', 'color-swatches'],
            ['a size tile named for its product', '<input type="radio" name="size-tiles-v-2-48213907">', 'size-tiles-v-2'],
            ['a filter named for its product', '<input type="checkbox" name="size_1234567">', 'size'],
            ['a short number, kept as written', '<input type="radio" name="step-2">', 'step-2'],
            ['an id with no question left', '<input type="radio" name="12345678">', undefined],
            ['a generated name', '<input type="radio" name="ember1234-48213907">', undefined],
            ['two product numbers', '<input type="radio" name="color-1234-48213907">', undefined],
        ])('names the question of %s without its product number', (_, html, expected) => {
            document.body.innerHTML = html;

            expect(describeClick([document.body.firstElementChild, document.body]).elementName).toBe(expected);
        });

        it('still drops a numbered name from a button that is not a picker', () => {
            document.body.innerHTML = '<button name="add-48213907">Add to bag</button>';

            expect(describeClick([document.body.firstElementChild, document.body]).elementName).toBeUndefined();
        });

        it.each([
            ['an aria-label', '<div role="radiogroup" aria-label="Delivery"><input type="radio" name="speed"><input type="radio" name="speed"></div>', 'delivery'],
            ['aria-labelledby', '<h3 id="q">Pick a size</h3><div role="radiogroup" aria-labelledby="q"><input type="radio" name="size"><input type="radio" name="size"></div>', 'pick a size'],
            ['a legend, cut at the pick it repeats', '<fieldset><legend>Color: Navy</legend><input type="radio" name="color"><input type="radio" name="color"></fieldset>', 'color'],
            ['a list box', '<div role="listbox" aria-label="State"><div role="option" id="state-ca">California</div><div role="option">Oregon</div></div>', 'state'],
            ['no group', '<input type="radio" name="speed">', undefined],
            ['a label that is an option, never', '<div role="listbox" aria-labelledby="o"><div role="option" id="o">Jane Doe</div><div role="option">John Doe</div></div>', undefined],
            ['a label an option shares, never', '<span id="s">Jane Doe</span><div role="radiogroup" aria-labelledby="s"><div role="radio" aria-labelledby="s"></div><div role="radio"></div></div>', undefined],
            ['a label inside an option, never', '<div role="radiogroup" aria-labelledby="t"><label><input type="radio" name="to"><span id="t">Jane Doe</span></label><input type="radio" name="to"></div>', undefined],
            ['the button that opens a list box, never', '<button id="b" aria-haspopup="listbox">12 Oak St</button><div role="listbox" aria-labelledby="b"><div role="option">12 Oak St</div><div role="option">9 Elm St</div></div>', undefined],
            ['a combobox, never', '<div role="combobox" id="c">Jane Doe</div><div role="listbox" aria-labelledby="c"><div role="option">Jane Doe</div><div role="option">John Doe</div></div>', undefined],
            ['a group around one option, never', '<div role="radiogroup"><div role="group" aria-label="Jane Doe, 12 Oak St"><input type="radio" name="address"></div><div role="group" aria-label="John Doe"><input type="radio" name="address"></div></div>', undefined],
            ['the group around more than one option, past a group around one', '<div role="radiogroup" aria-label="Ship to"><div role="group" aria-label="Jane Doe"><input type="radio" name="address"></div><div role="group"><input type="radio" name="address"></div></div>', 'ship to'],
            ['a heading beside one option in its own group, never', '<div role="group" aria-labelledby="a1"><h3 id="a1">Jane Doe</h3><input type="radio" name="address"></div>', undefined],
            ['a group around a role option wrapping its own input, never', '<div role="group" aria-label="Jane Doe"><div role="radio"><input type="radio" name="address"></div></div>', undefined],
            ['a label holding what an option is named by, never', '<div id="card"><span id="n">Jane Doe</span></div><div role="radiogroup" aria-labelledby="card"><div role="radio" aria-labelledby="n"></div><div role="radio"></div></div>', undefined],
            ['a label inside what an option is named by, never', '<div id="row"><span id="g">Jane Doe</span></div><div role="radiogroup" aria-labelledby="g"><div role="radio" aria-labelledby="row"></div><div role="radio"></div></div>', undefined],
            ['a label inside a native option\'s label, never', '<label for="r1"><span id="g">Jane Doe</span></label><div role="radiogroup" aria-labelledby="g"><input type="radio" id="r1" name="to"><input type="radio" name="to"></div>', undefined],
            ['a link, never', '<a href="/account" id="l">Jane Doe</a><div role="listbox" aria-labelledby="l"><div role="option">A</div><div role="option">B</div></div>', undefined],
            ['a role link, never', '<div role="link" id="l">Jane Doe</div><div role="listbox" aria-labelledby="l"><div role="option">A</div><div role="option">B</div></div>', undefined],
            ['a tab, never', '<div role="tab" id="t">12 Oak St</div><div role="listbox" aria-labelledby="t"><div role="option">A</div><div role="option">B</div></div>', undefined],
            ['a group around a role option beside its hidden input, never', '<div role="group" aria-label="Jane Doe"><div role="radio"></div><input type="radio" name="address" hidden></div>', undefined],
            ['a group around one option and an unrelated toggle, never', '<div role="group" aria-label="Jane Doe, 12 Oak St"><input type="radio" name="address"><input type="checkbox" name="default"></div>', undefined],
            ['a card beside a hidden radio of the same name, never', '<div role="group" aria-label="Jane Doe, 12 Oak St"><input type="radio" name="ship"><input type="radio" name="ship" style="visibility:hidden"></div>', undefined],
            ['a card whose other role radio sits in its own group, never', '<div role="group" aria-label="Jane Doe"><div role="radio"></div><div role="radiogroup" aria-label="Speed"><div role="radio"></div><div role="radio"></div></div></div>', undefined],
            ['a card around shipping and billing radios, never', '<div role="group" aria-label="Jane Doe, 12 Oak St"><input type="radio" name="shipping"><input type="radio" name="billing"></div>', undefined],
            ['the question around cards of shipping and billing radios', '<fieldset><legend>Addresses</legend><div role="group" aria-label="Jane Doe, 12 Oak St"><input type="radio" name="shipping"><input type="radio" name="billing"></div><div role="group" aria-label="John Doe"><input type="radio" name="shipping"><input type="radio" name="billing"></div></fieldset>', 'addresses'],
            ['a card around default shipping and billing checkboxes, never', '<div role="group" aria-label="Jane Doe"><input type="checkbox" name="default-shipping"><input type="checkbox" name="default-billing"></div>', undefined],
            ['a card around radios of the same name in different forms, never', '<div role="group" aria-label="Jane Doe"><form><input type="radio" name="address"></form><form><input type="radio" name="address"></form></div>', undefined],
            ['a card around a role radio beside its visually hidden input, never', '<div role="radiogroup" aria-label="Jane Doe"><div role="radio"></div><input type="radio" name="address" style="opacity: 0"></div>', undefined],
            ['a card around default shipping and billing switches, never', '<div role="group" aria-label="Jane Doe"><div role="switch"></div><div role="switch"></div></div>', undefined],
            ['a card around default shipping and billing role checkboxes, never', '<fieldset><legend>Jane Doe</legend><div role="checkbox"></div><div role="checkbox"></div></fieldset>', undefined],
            ['the radiogroup around role radios, past a card', '<div role="radiogroup" aria-label="Ship to"><div role="group" aria-label="Jane Doe"><div role="radio"></div></div><div role="radio"></div></div>', 'ship to'],
            ['a button listed with fallback roles, never', '<div role="button presentation" id="b">12 Oak St</div><div role="listbox" aria-labelledby="b"><div role="option">A</div><div role="option">B</div></div>', undefined],
        ])('names the group of a picker from %s', (_, html, expected) => {
            document.body.innerHTML = html;
            const choice = document.body.querySelector('input, [role="option"], [role="radio"], [role="switch"], [role="checkbox"]')!;

            expect(describeButtonClick(choice, [choice, document.body]).group).toBe(expected);
        });

        it('resolves a group label inside its own shadow root, not a same-id element on the page', () => {
            document.body.innerHTML = '<span id="q">Jane Doe</span><div id="host"></div>';
            const root = document.getElementById('host')!.attachShadow({ mode: 'open' });
            root.innerHTML = '<span id="q">Size</span><div role="radiogroup" aria-labelledby="q"><input type="radio" name="size"><input type="radio" name="size"></div>';
            const radio = root.querySelector('input')!;

            expect(describeButtonClick(radio, [radio]).group).toBe('size');
        });

        it('reads no group name through a slot, which shows whatever is assigned to it', () => {
            document.body.innerHTML = '<div id="host"><button slot="q">Jane Doe</button></div>';
            const root = document.getElementById('host')!.attachShadow({ mode: 'open' });
            root.innerHTML = '<slot name="q" id="q"></slot><div role="radiogroup" aria-labelledby="q"><input type="radio" name="to"><input type="radio" name="to"></div>';
            const radio = root.querySelector('input')!;

            expect(describeButtonClick(radio, [radio]).group).toBeUndefined();
        });

        it('reads no group name from a span slotted into a button', () => {
            document.body.innerHTML =
                '<div id="host"><span id="q">Jane Doe</span></div><div role="radiogroup" aria-labelledby="q"><input type="radio" name="to"><input type="radio" name="to"></div>';
            document.getElementById('host')!.attachShadow({ mode: 'open' }).innerHTML = '<button><slot></slot></button>';
            const radio = document.querySelector('input')!;

            expect(describeButtonClick(radio, [radio]).group).toBeUndefined();
        });

        it('sends no name with an input acting as an option', () => {
            document.body.innerHTML = '<div role="listbox"><input type="checkbox" role="option" name="jane-doe"></div>';
            const option = document.querySelector('input')!;

            expect(describeButtonClick(option, [option, document.body]).elementName).toBeUndefined();
        });

        it('sends an option of a list box with its type and group, never its text or identifiers', () => {
            document.body.innerHTML =
                '<div role="listbox" aria-label="Title"><div role="option" id="title-mrs" data-testid="title-mrs">Mrs</div><div role="option">Ms</div></div>';
            const option = document.body.querySelector('[role="option"]')!;

            expect(describeButtonClick(option, [option, document.body])).toEqual(
                expect.objectContaining({
                    label: undefined,
                    labelSource: 'none',
                    elementId: undefined,
                    testId: undefined,
                    type: 'option',
                    group: 'title',
                })
            );
        });

        it.each([
            ['a tab', '<div role="tab">Reviews</div>', 'tab'],
            ['a link run by script', '<div role="link">See all</div>', 'link'],
            ['a fallback role list', '<div role="tab button">Reviews</div>', 'button'],
            ['a role list split by tabs', '<div role="presentation\ttab">Reviews</div>', 'tab'],
        ])('types %s by its role', (_, html, type) => {
            document.body.innerHTML = html;

            expect(describeButtonClick(document.body.firstElementChild!, []).type).toBe(type);
        });

        it('names a card whose text runs too long by its heading', () => {
            document.body.innerHTML =
                '<div role="button"><h3>Breakfast Burrito</h3><p>' + 'Eggs, potatoes, cheese and salsa. '.repeat(5) + '</p><span>$13.50</span></div>';

            expect(describeButtonClick(document.body.firstElementChild!, [])).toEqual(
                expect.objectContaining({ label: 'breakfast burrito', labelSource: 'heading' })
            );
        });

        it('names a card with too many parts to read by its heading', () => {
            document.body.innerHTML =
                '<div role="button"><img alt=""><span>New</span><h2>Trail Runner</h2><span>4.5</span><span>$80</span></div>';

            expect(describeButtonClick(document.body.firstElementChild!, [])).toEqual(
                expect.objectContaining({ label: 'trail runner', labelSource: 'heading' })
            );
        });

        it('sends a link run by script without its text, which can name the shopper', () => {
            document.body.innerHTML = '<div role="link" aria-label="Account for Jane" id="account-link">Hi, Jane</div>';

            expect(describeButtonClick(document.body.firstElementChild!, [])).toEqual(
                expect.objectContaining({
                    element: 'link',
                    label: undefined,
                    labelSource: 'none',
                    ariaLabel: undefined,
                    elementId: 'account-link',
                })
            );
        });

        it('sends a field acting as a link without its text', () => {
            document.body.innerHTML = '<input type="text" role="link" aria-label="Account for Jane" value="Jane">';

            expect(describeButtonClick(document.body.firstElementChild!, [])).toEqual(
                expect.objectContaining({ label: undefined, labelSource: 'none', ariaLabel: undefined })
            );
        });

        it('keeps the name of a native button acting as a link, as before', () => {
            document.body.innerHTML = '<button role="link">See all</button>';

            expect(describeButtonClick(document.body.firstElementChild!, []).label).toBe('see all');
        });

        it('reports a link role listed with others as a link', () => {
            document.body.innerHTML = '<div role="link presentation">Pay with PayPal</div>';

            expect(describeButtonClick(document.body.firstElementChild!, []).element).toBe('link');
        });

        it('reads no heading from a card that takes in slotted content', () => {
            document.body.innerHTML = '<div id="card" role="button"><h3>Jane Doe</h3><p>' + 'x '.repeat(80) + '</p></div>';
            const card = document.getElementById('card')!;
            card.attachShadow({ mode: 'open' }).innerHTML = '<slot></slot>';

            expect(describeButtonClick(card, []).label).toBeUndefined();
        });

        it('reads no heading from a card holding a shadow root, whose fields it cannot check', () => {
            document.body.innerHTML = '<div role="button"><h3>Jane Doe</h3><div id="field"></div><p>' + 'x '.repeat(80) + '</p></div>';
            document.getElementById('field')!.attachShadow({ mode: 'open' }).innerHTML = '<input value="jane@example.com">';

            expect(describeButtonClick(document.body.firstElementChild!, []).label).toBeUndefined();
        });

        it('reads no heading from a card holding a custom element, whose shadow root may be closed', () => {
            document.body.innerHTML = '<div id="card" role="button"><h3>Jane Doe</h3><account-field></account-field><p>' + 'x '.repeat(80) + '</p></div>';
            document.querySelector('account-field')!.attachShadow({ mode: 'closed' }).innerHTML = '<input value="jane@example.com">';

            expect(describeButtonClick(document.getElementById('card')!, []).label).toBeUndefined();
        });

        it('reads no heading from a card that holds a form field', () => {
            document.body.innerHTML =
                '<div role="button"><h3>Jane Doe</h3><input value="jane@example.com"><p>' + 'x '.repeat(80) + '</p></div>';

            expect(describeButtonClick(document.body.firstElementChild!, []).label).toBeUndefined();
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

        // Paths as the browser composes them, from the clicked box or label up.
        it.each([
            [
                'a label in it for a radio outside it',
                () => {
                    document.body.innerHTML =
                        '<div role="button"><label for="r">Jane Doe, 12 Main St</label></div><input type="radio" id="r">';
                    const label = document.body.querySelector('label')!;
                    return [label, label.parentElement, document.body];
                },
            ],
            [
                'a radio slotted into it',
                () => {
                    document.body.innerHTML = '<div id="host"><input type="radio" name="address"></div>';
                    const host = document.getElementById('host')!;
                    const root = host.attachShadow({ mode: 'open' });
                    root.innerHTML = '<div role="button" aria-label="Ship to Jane Doe"><slot></slot></div>';
                    const slot = root.querySelector('slot')!;
                    return [host.firstElementChild, slot, slot.parentElement, root, host, document.body];
                },
            ],
            [
                'a checkbox in the shadow root of a component in it',
                () => {
                    document.body.innerHTML = '<div role="button" aria-label="I have a disability"><span id="host"></span></div>';
                    const host = document.getElementById('host')!;
                    const root = host.attachShadow({ mode: 'open' });
                    root.innerHTML = '<input type="checkbox">';
                    return [root.firstElementChild, root, host, host.parentElement, document.body];
                },
            ],
        ])('sends no text from a row around %s, which the click passed through', (_, clickPath) => {
            expect(describeClick(clickPath())).toEqual(
                expect.objectContaining({
                    label: undefined,
                    labelSource: 'none',
                    ariaLabel: undefined,
                    icon: undefined,
                    element: 'role',
                })
            );
        });

        it('takes the clicked radio over a checkbox before it in the same row', () => {
            document.body.innerHTML =
                '<div role="button" id="disability-yes" data-testid="disability-yes" aria-controls="disability-details">' +
                '<input type="checkbox" name="remember"><input type="radio" name="disability"></div>';
            const row = document.body.firstElementChild!;

            expect(describeClick([row.lastElementChild, row, document.body])).toEqual(
                expect.objectContaining({ elementId: undefined, testId: undefined, controls: undefined })
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

describe('describePaymentChoice', () => {
    // The choice a click on this element reads, along the path the browser gives.
    const choiceAt = (target: Element) => {
        const path: Array<EventTarget | null> = [];
        for (let node: Element | null = target; node; node = node.parentElement) {
            path.push(node);
        }
        path.push(document);
        const control = findControl(path);
        return control ? describePaymentChoice(control, path) : undefined;
    };
    const byId = (id: string) => document.getElementById(id)!;

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('names a payment radio by the text and image of the label around it, and its id', () => {
        document.body.innerHTML =
            '<label><input type="radio" name="payment_method" id="paypal-option"> Pay with PayPal <img src="/p.svg" alt="PayPal logo"></label>';

        expect(choiceAt(byId('paypal-option'))).toEqual({
            radio: byId('paypal-option'),
            names: ['pay with paypal', 'paypal logo', 'paypal-option'],
        });
    });

    it.each([
        ['its input name', '<input type="radio" name="checkout[payment_gateway]" id="opt"><label for="opt">Credit card</label>'],
        ['its input name in one word', '<input type="radio" name="paymentmethod" id="opt"><label for="opt">Credit card</label>'],
        ['the fieldset of a radio with no name', '<fieldset id="payment-options"><input type="radio" id="opt"><label for="opt">Credit card</label></fieldset>'],
        ['the group of a radio with no name', '<div role="radiogroup" aria-label="Tender type"><input type="radio" id="opt"><label for="opt">Credit card</label></div>'],
    ])('reads a payment question from %s', (_, html) => {
        document.body.innerHTML = html;

        expect(choiceAt(byId('opt'))).toEqual(
            expect.objectContaining({ names: ['credit card', 'opt'] })
        );
    });

    it('names a button acting as a payment radio by its own text and test id', () => {
        document.body.innerHTML =
            '<div role="radiogroup" aria-label="Payment method"><button role="radio" aria-checked="true" data-testid="venmo-option">Venmo</button></div>';
        const row = document.querySelector('button')!;

        expect(choiceAt(row)).toEqual({ radio: row, names: ['venmo', 'venmo-option'] });
    });

    it('masks the names like a label', () => {
        document.body.innerHTML =
            '<input type="radio" name="paymentMethod" id="saved"><label for="saved">Visa ending 4242</label>' +
            '<input type="radio" name="paymentMethod" id="mail"><label for="mail">jane@example.test</label>';

        expect(choiceAt(byId('saved')).names).toEqual(['visa ending #', 'saved']);
        expect(choiceAt(byId('mail')).names).toEqual(['mail']);
    });

    it('reads no text from a label that holds another field', () => {
        document.body.innerHTML =
            '<label><input type="radio" name="payment" id="other"> Other <input type="text" value="Jane Doe"></label>';

        expect(choiceAt(byId('other')).names).toEqual(['other']);
    });

    it.each([
        ['a radio whose question is not about payment', '<input type="radio" name="disability" id="target"><label for="target">Wheelchair access</label>'],
        ['a checkbox in a payment form', '<form id="payment-form"><input type="checkbox" name="payment_save" id="target"><label for="target">Save my card</label></form>'],
        ['a payment radio nothing names', '<input type="radio" name="payment">'],
        ['a radio in a payment form whose question is not', '<form id="payment-form"><fieldset id="billing-address"><input type="radio" name="billing_address" id="target"><label for="target">Card address</label></fieldset></form>'],
        ['a named radio in a payment fieldset whose question is not', '<fieldset id="payment"><input type="radio" name="shipping_speed" id="target"><label for="target">Card delivery</label></fieldset>'],
        ['a question that only starts like pay', '<input type="radio" name="payee" id="target"><label for="target">Card</label><input type="radio" name="payroll_period">'],
        ['a button that is not a radio', '<form id="payment-form"><button id="target">Pay with PayPal</button></form>'],
    ])('describes nothing for %s', (_, html) => {
        document.body.innerHTML = html;
        const target = document.getElementById('target') || document.querySelector('input')!;

        expect(choiceAt(target)).toBeUndefined();
    });

    it.each([
        ['a row', '<div role="button" id="target">PayPal <span data-mp-no-track><input type="radio" name="payment_method" id="paypal"></span></div>'],
        ['a label', '<label id="target" for="paypal">PayPal</label><span data-mp-no-track><input type="radio" name="payment_method" id="paypal"></span>'],
    ])('describes nothing for a payment radio under data-mp-no-track, clicked through %s outside it', (_, html) => {
        document.body.innerHTML = html;

        expect(choiceAt(byId('target'))).toBeUndefined();
    });

    it('reads no text from a label under data-mp-no-track', () => {
        document.body.innerHTML =
            '<input type="radio" name="payment_method" id="opt"><span data-mp-no-track><label for="opt">Card ending 4242</label></span>' +
            '<label for="opt" data-mp-no-track>Jane Doe</label>';

        expect(choiceAt(byId('opt')).names).toEqual(['opt']);
    });

    it('reads whether the click left the radio picked', () => {
        document.body.innerHTML =
            '<input type="radio" name="payment" id="native"><button role="radio" aria-checked="false" id="role">Card</button>';
        const native = byId('native') as HTMLInputElement;
        const role = byId('role');

        expect(isPicked(native)).toBe(false);
        expect(isPicked(role)).toBe(false);
        native.checked = true;
        role.setAttribute('aria-checked', 'true');
        expect(isPicked(native)).toBe(true);
        expect(isPicked(role)).toBe(true);
    });
});
