import { describeButtonClick } from '../../../src/buttonTracking/buttonDescription';
import { classifyIntentControl } from '../../../src/buttonTracking/checkoutIntent';

describe('describeButtonClick', () => {
    const control = (html: string) => {
        const parent = document.createElement('div');
        parent.innerHTML = html;
        return parent.firstElementChild!;
    };

    const describe1 = (html: string) => {
        document.body.innerHTML = html;
        return describeButtonClick([document.body.firstElementChild]);
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

    it('never reads editable text as a label', () => {
        expect(describe1('<div role="button" contenteditable="true">Jane Smith</div>')).toEqual(
            expect.objectContaining({ label: undefined, labelSource: 'none' })
        );
        expect(describe1('<button><span contenteditable>Jane Smith</span></button>')).toEqual(
            expect.objectContaining({ label: undefined, labelSource: 'none' })
        );
        document.body.innerHTML = '<div contenteditable="true"><button>Bold</button></div>';
        expect(describeButtonClick([document.querySelector('button')])).toEqual(
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
        expect(describeButtonClick([target])).toEqual(
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
        expect(describeButtonClick([input])).toEqual(
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

    it('does not describe plain links', () => {
        expect(describe1('<a href="/help">Help</a>')).toBeUndefined();
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
        expect(describeButtonClick([wrapped.firstElementChild])).toBeUndefined();
        expect(
            classifyIntentControl([control('<div data-mp-no-track><button>Place order</button></div>').firstElementChild], '/checkout')
        ).toBeUndefined();
        const rokt = control('<div data-core-type="x"><button>Add to cart</button></div>');
        expect(describeButtonClick([rokt.firstElementChild, rokt])).toBeUndefined();
    });

    it('honours data-mp-no-track on a clicked child and across shadow roots', () => {
        const marked = control('<button>Add to cart <span data-mp-no-track>x</span></button>');
        expect(describeButtonClick([marked.querySelector('span'), marked])).toBeUndefined();
        expect(describeButtonClick([marked])).toEqual(
            expect.objectContaining({ label: undefined, labelSource: 'none' })
        );

        const host = document.createElement('div');
        host.setAttribute('data-mp-no-track', '');
        document.body.appendChild(host);
        const shadowButton = document.createElement('button');
        shadowButton.textContent = 'Add to cart';
        host.attachShadow({ mode: 'open' }).appendChild(shadowButton);
        expect(describeButtonClick([shadowButton])).toBeUndefined();
        host.remove();

        // A slotted button under a marked shadow ancestor.
        const outer = document.createElement('div');
        document.body.appendChild(outer);
        const root = outer.attachShadow({ mode: 'open' });
        root.innerHTML = '<div data-mp-no-track><slot></slot></div>';
        const slotted = document.createElement('button');
        slotted.textContent = 'Place order';
        outer.appendChild(slotted);
        expect(describeButtonClick([slotted])).toBeUndefined();
        expect(classifyIntentControl([slotted], '/checkout')).toBeUndefined();
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
        expect(describeButtonClick([roktButton])).toBeUndefined();
        expect(classifyIntentControl([roktButton], '/checkout')).toBeUndefined();
        placement.remove();
    });

    it('never reads a form field inside the control', () => {
        expect(
            describeButtonClick([control('<button>Apply <input value="jane@example.com"></button>')])
        ).toEqual(expect.objectContaining({ label: undefined, labelSource: 'none' }));
    });
});
