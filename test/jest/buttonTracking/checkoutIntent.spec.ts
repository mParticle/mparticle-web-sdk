import {
    classifyIntent,
    classifyIntentControl,
    classifyPaymentFrame,
} from '../../../src/buttonTracking/checkoutIntent';
import { findControl } from '../../../src/buttonTracking/controls';

const frameKind = (frame: Element) => {
    const found = classifyPaymentFrame(frame, window);
    return found ? found.kind : undefined;
};

// Classifies the control a click path lands on, as the tracker does.
const classify = (path: Array<EventTarget | null>, pathname: string) => {
    const control = findControl(path);
    return control ? classifyIntentControl(control, pathname) : undefined;
};

describe('checkoutIntent', () => {
    const control = (html: string) => {
        const parent = document.createElement('div');
        parent.innerHTML = html;
        return parent.firstElementChild!;
    };
    // A host element with an open shadow root holding the clicked button, as a
    // vendor web component renders it. Returns the path a click would report.
    const shadowPath = (hostTag: string, innerHtml: string, attrs = '') => {
        const host = control(`<${hostTag} ${attrs}></${hostTag}>`);
        const root = host.attachShadow({ mode: 'open' });
        root.innerHTML = innerHtml;
        const inner = root.firstElementChild!;
        return [inner, root, host];
    };

    describe('English grammar', () => {
        // [visible text, aria-label or null, expected kind]
        it.each([
            ['Place Order', null, 'commit'],
            ['Place order Total: $54.10', null, 'commit'],
            ['Place order \u00B7 3 items', null, 'commit'],
            ['Complete purchase - 2 tickets', null, 'commit'],
            ['Place order with gift card', null, 'commit'],
            ['Agree & Place Order', null, 'commit'],
            ['Review & Place Order', null, 'commit'],
            ['Pay CHF 32.65', null, 'commit'],
            ['Pay A$45.00', null, 'commit'],
            ['Place your delivery order', null, 'commit'],
            ['Complete Purchase', null, 'commit'],
            ['Submit order', null, 'commit'],
            ['Pay', null, 'commit'],
            ['Submit gift card payment', null, undefined],
            ['Pay in full', null, undefined],
            ['Place another order', null, undefined],
            ['Confirm donation', null, undefined],
            ['Pay with Klarna', null, 'wallet'],
            ['Buy with GPay', null, 'wallet'],
            ['Pay with PayPal', null, 'wallet'],
            ['Buy with Apple Pay', null, 'wallet'],
            ['Check out with Afterpay', null, 'wallet'],
            ['Continue to PayPal', null, 'wallet'],
            ['applepay', null, 'wallet'],
            ['apple pay logo', null, 'wallet'],
            ['PayPal', null, 'wallet'],
            ['Continue with Link', null, undefined],
            ['Sign in with PayPal', null, undefined],
            ['Set up Apple Pay', null, undefined],
            ['Apple Pay available', null, undefined],
            ['Klarna', 'Pay later', undefined],
            ['Klarna', 'Pay later with Klarna', undefined],
            ['Pay in 4 interest-free payments. Learn more', null, undefined],
            ["Let's Check Out", null, 'checkout_step'],
            ['Continue to Review', null, 'checkout_step'],
            ['Pay With Card', null, 'checkout_step'],
            ['Pay with credit card', null, 'checkout_step'],
            ['Pay with gift card', null, undefined],
            ['Confirm My Choices', null, undefined],
            ['Accept and continue', null, undefined],
            ['Apply', null, undefined],
            ['Submit', null, undefined],
            ['Continue', null, undefined],
            ['Edit payment', null, undefined],
        ])('reads "%s" (aria-label %s) as %s', (text, ariaLabel, expected) => {
            const button = document.createElement('button');
            button.textContent = text;
            if (ariaLabel) {
                button.setAttribute('aria-label', ariaLabel);
            }
            expect(classify([button], '/checkout')).toBe(expected);
        });
        it('reads a plain link as a commit only when it places, submits or completes an order', () => {
            expect(classify([control('<a href="/order">Place order</a>')], '/checkout')).toBe('commit');
            expect(classify([control('<a href="/bill">Pay</a>')], '/account')).toBeUndefined();
            expect(classify([control('<a href="/pay">Confirm and pay</a>')], '/account')).toBeUndefined();
            expect(classify([control('<a href="#" role="button">Pay</a>')], '/checkout')).toBe('commit');
        });
        it('never reads buy now or purchase on a plain link as a commit', () => {
            expect(classify([control('<a href="/product/1">Buy now</a>')], '/checkout')).toBeUndefined();
            expect(classify([control('<a href="/checkout/next">Purchase</a>')], '/checkout')).toBeUndefined();
            expect(classify([control('<button>Buy now</button>')], '/checkout')).toBe('commit');
        });
        it('does not read a wallet name on a plain link as a wallet tap', () => {
            expect(classify([control('<a href="/paypal-info">PayPal</a>')], '/checkout')).toBeUndefined();
            expect(classify([control('<a href="#" role="button">PayPal</a>')], '/checkout')).toBe('wallet');
        });
        it('ignores labels longer than eight words, so they neither match nor veto', () => {
            const button = control(
                '<button aria-label="Apply your gift card balance to this order before you continue">Checkout</button>'
            );
            expect(classify([button], '/cart')).toBe('checkout_step');
        });
    });

    describe('quiet guards', () => {
        it.each([
            ['a payment method row acting as a radio', '<button role="radio" aria-checked="false"><span>PayPal</span></button>'],
            ['a wallet tab', '<button role="tab">Apple Pay</button>'],
            ['an option', '<button role="option">Google Pay</button>'],
            ['an accordion header', '<button aria-expanded="false">PayPal</button>'],
            ['a toggle', '<button aria-pressed="false">Klarna</button>'],
            ['a selected tile', '<div role="button" aria-selected="true">Venmo</div>'],
        ])('gives no intent for %s', (_, html) => {
            const element = control(html);
            expect(findControl([element])).toBe(element);
            expect(classify([element], '/checkout')).toBeUndefined();
        });
        it('gives no intent for a button wrapped inside a tab list or list box', () => {
            const tabs = control('<div role="tablist"><div class="tab-wrap"><button>Apple Pay</button></div></div>');
            const tabButton = tabs.querySelector('button')!;
            expect(classify([tabButton, tabButton.parentElement, tabs], '/checkout')).toBeUndefined();
            const list = control('<ul role="listbox"><li><span><button>Place order</button></span></li></ul>');
            const listButton = list.querySelector('button')!;
            expect(classify([listButton], '/checkout')).toBeUndefined();
        });
        it('gives no intent for a button inside a radio group', () => {
            const group = control('<div role="radiogroup"><button>Google Pay</button></div>');
            const button = group.querySelector('button')!;
            expect(classify([button, group], '/checkout')).toBeUndefined();
        });
        it.each([
            ['<afterpay-placement><button>Afterpay</button></afterpay-placement>'],
            ['<div data-pp-message><button>PayPal</button></div>'],
            ['<div class="affirm-as-low-as"><button>Affirm</button></div>'],
        ])('gives no intent for a button inside pay-later messaging: %s', html => {
            const wrapper = control(html);
            const button = wrapper.querySelector('button')!;
            expect(classify([button, wrapper], '/checkout')).toBeUndefined();
        });
        it('gives no intent inside messaging that renders in a shadow root', () => {
            const path = shadowPath('klarna-placement', '<button>Klarna</button>');
            expect(classify(path, '/checkout')).toBeUndefined();
        });
    });

    describe('cart clicks', () => {
        it.each([
            ['Add to cart'],
            ['Add to Bag'],
            ['Add to basket'],
            ['Add to my bag'],
            ['Add to shopping bag'],
            ['Add 2 to cart'],
            ["Add Women's Crew Sweater to Bag"],
            ['Add to bag - $49.99'],
        ])('reads "%s" as a cart click', text => {
            const button = document.createElement('button');
            button.textContent = text;
            expect(classify([button], '/product/1')).toBe('cart');
        });
        it('marks a click that adds to the cart, and not one that opens it', () => {
            const add = document.createElement('button');
            add.textContent = 'Add to bag';
            const icon = document.createElement('button');
            icon.setAttribute('title', 'Add to cart');
            const flyout = document.createElement('button');
            flyout.textContent = 'My bag';
            flyout.setAttribute('aria-expanded', 'false');
            expect(classifyIntent(add, '/product/1')).toEqual({ kind: 'cart', source: 'label', adds: true });
            expect(classifyIntent(icon, '/product/1')).toEqual({ kind: 'cart', source: 'label', adds: true });
            expect(classifyIntent(flyout, '/product/1')).toEqual({ kind: 'cart', source: 'label' });
        });
        const openCart = [
            ['View cart'],
            ['View my bag'],
            ['View shopping basket'],
            ['Go to cart'],
            ['My bag'],
            ['Your cart'],
            ['Shopping bag'],
            ['Shopping cart'],
            ['Cart'],
            ['Bag'],
            ['Basket'],
            ['Cart (3)'],
            ['Bag, 2 items'],
            ['1 item in bag'],
            ['3 items in your bag'],
            ['Item(s) in cart'],
        ];
        it.each(openCart)('reads "%s" as a cart click on a button that opens the cart on the page', text => {
            const flyout = document.createElement('button');
            flyout.textContent = text;
            flyout.setAttribute('aria-expanded', 'false');
            const dialog = document.createElement('button');
            dialog.textContent = text;
            dialog.setAttribute('aria-haspopup', 'dialog');
            expect(classify([flyout], '/product/1')).toBe('cart');
            expect(classify([dialog], '/product/1')).toBe('cart');
        });
        it.each(openCart)('does not read "%s" as a cart click on a button that leads to the cart page', text => {
            const button = document.createElement('button');
            button.textContent = text;
            expect(classify([button], '/product/1')).toBeUndefined();
        });
        it.each([
            ['Bags'],
            ['Sleeping bag'],
            ['Tote bag'],
            ['Added to bag'],
            ['Remove from bag'],
            ['Edit bag'],
            ['Empty cart'],
            ['Add to wishlist'],
            ['Add to bag and checkout'],
            ['View bag and checkout'],
            ['Basketball'],
            ['Warenkorb'],
            ['3'],
        ])('does not read "%s" as a cart click', text => {
            const button = document.createElement('button');
            button.textContent = text;
            expect(classify([button], '/product/1')).not.toBe('cart');
        });
        it('reads a bag icon by its aria-label, with the item count stripped', () => {
            const icon = control(
                '<button aria-expanded="false" title="Shopping bag" aria-label="1 item in bag" data-testid="header-cart"><svg></svg><span>1</span></button>'
            );
            expect(classify([icon], '/')).toBe('cart');
        });
        it('does not count a bag icon that leads to the cart page', () => {
            const icon = control(
                '<button title="Shopping bag" aria-label="1 item in bag" data-testid="header-cart"><svg></svg><span>1</span></button>'
            );
            expect(classify([icon], '/')).toBeUndefined();
        });
        it('reads the title of an icon button that has no other label', () => {
            expect(classify([control('<button aria-expanded="false" title="Shopping bag"><svg></svg></button>')], '/')).toBe('cart');
            expect(classify([control('<button aria-haspopup="dialog" title="Shopping bag"><span>2</span></button>')], '/')).toBe('cart');
            expect(classify([control('<button title="Add to bag"><svg></svg></button>')], '/product/1')).toBe('cart');
        });
        it('reads no title once the button has a label of its own', () => {
            expect(classify([control('<button title="Shopping bag">Menu</button>')], '/')).toBeUndefined();
            expect(classify([control('<button title="Place order"><svg></svg></button>')], '/checkout')).toBeUndefined();
            expect(classify([control('<button title="PayPal"><svg></svg></button>')], '/checkout')).toBeUndefined();
        });
        it('never counts a link to the cart page, which leaves before a call can return', () => {
            expect(classify([control('<a href="/bag">Bag</a>')], '/')).toBeUndefined();
            expect(classify([control('<a href="/cart" aria-label="Cart, 3 items"><svg></svg></a>')], '/')).toBeUndefined();
            expect(classify([control('<a href="/bag" title="Shopping bag"><svg></svg></a>')], '/')).toBeUndefined();
        });
        it('reads add to bag on a link', () => {
            expect(classify([control('<a href="/bag?add=1">Add to bag</a>')], '/product/1')).toBe('cart');
        });
        it('counts a bag button that opens a flyout', () => {
            expect(classify([control('<button aria-expanded="false" aria-label="1 item in bag"><svg></svg></button>')], '/')).toBe('cart');
            expect(classify([control('<button aria-expanded="false" title="Shopping bag"><svg></svg></button>')], '/')).toBe('cart');
        });
        it('keeps other toggles quiet, a pressed bag button included', () => {
            expect(classify([control('<button aria-expanded="false">Place order</button>')], '/checkout')).toBeUndefined();
            expect(classify([control('<button aria-expanded="false">Checkout</button>')], '/cart')).toBeUndefined();
            expect(classify([control('<button aria-pressed="false">Bag</button>')], '/')).toBeUndefined();
            expect(classify([control('<button aria-expanded="true" aria-pressed="false">Bag</button>')], '/')).toBeUndefined();
        });
        it('reads a flyout toggle only as cart, whatever its other label says', () => {
            expect(
                classify([control('<button aria-expanded="false" aria-label="Bag">Place order</button>')], '/checkout')
            ).toBe('cart');
            expect(
                classify([control('<button aria-expanded="false" aria-label="Pay with PayPal">Bag</button>')], '/checkout')
            ).toBe('cart');
        });
        it.each([
            ['a radio', '<input type="radio" aria-label="Add to bag">'],
            ['a checkbox', '<input type="checkbox" aria-label="Shopping bag">'],
            ['a radio row', '<button role="radio" aria-checked="false">Add to bag</button>'],
            ['a tab', '<button role="tab">Bag</button>'],
            ['an option', '<button role="option">Shopping bag</button>'],
            ['a selected tile', '<div role="button" aria-selected="true">Add to cart</div>'],
        ])('keeps %s quiet', (_, html) => {
            const element = control(html);
            expect(findControl([element])).toBe(element);
            expect(classify([element], '/')).toBeUndefined();
        });
        it('keeps a cart button inside a tab list or pay-later messaging quiet', () => {
            const tabs = control('<div role="tablist"><button>Bag</button></div>');
            expect(classify([tabs.querySelector('button')!, tabs], '/')).toBeUndefined();
            const message = control('<div data-pp-message><button>Add to bag</button></div>');
            expect(classify([message.querySelector('button')!, message], '/')).toBeUndefined();
        });
        it('lets add to bag past the exclusions as cart, and never as a commit', () => {
            expect(classify([control('<button>Add to bag</button>')], '/checkout')).toBe('cart');
            expect(classify([control('<a href="/bag">Add to bag</a>')], '/checkout')).toBe('cart');
            expect(classify([control('<button aria-label="Add to bag">Apply promo</button>')], '/checkout')).toBe('cart');
        });
        it('leaves commit, wallet and step labels as they were', () => {
            expect(classify([control('<button aria-label="Bag">Place order</button>')], '/checkout')).toBe('commit');
            expect(classify([control('<button aria-label="Shopping bag">Pay with PayPal</button>')], '/cart')).toBe('wallet');
            expect(classify([control('<button aria-label="Bag">Checkout</button>')], '/cart')).toBe('checkout_step');
            expect(classify([control('<button aria-label="Add to cart">Buy now</button>')], '/checkout')).toBe('commit');
            expect(classify([control('<button aria-label="Add to cart">Buy now</button>')], '/product/1')).toBe('cart');
        });
        it('leaves a vendor wallet button a wallet', () => {
            expect(classify([control('<apple-pay-button aria-label="Add to bag"></apple-pay-button>')], '/cart')).toBe('wallet');
            expect(classify([control('<apple-pay-button type="set-up" aria-label="Bag"></apple-pay-button>')], '/cart')).toBeUndefined();
        });
    });

    describe('vendor wallet signatures', () => {
        it.each([
            ['a merchant button with Apple Pay styling and no text', '<button class="button apple-pay-button apple-pay-button--link"><svg aria-label="apple pay logo"></svg></button>'],
            ['the Google Pay card button', '<button id="gpay-button-online-api-id" class="gpay-card-info-container black" aria-label="Buy with GPay"></button>'],
            ['the plain Google Pay button', '<button class="gpay-button black" aria-label="Google Pay"></button>'],
            ['an Afterpay entry point', '<button data-afterpay-entry-point="cart"><img alt=""></button>'],
            ['the Amazon Pay focusable button', '<div class="amazonpay-button-focusable" role="button" tabindex="0"></div>'],
        ])('reads %s as a wallet', (_, html) => {
            expect(classify([control(html)], '/cart')).toBe('wallet');
        });
        it.each(['apple-pay-button', 'paypal-button', 'venmo-button', 'shop-pay-wallet-button', 'shopify-accelerated-checkout'])(
            'reads the inner button of <%s> as a wallet',
            tag => {
                expect(classify(shadowPath(tag, '<button aria-label="Pay"><span></span></button>'), '/cart')).toBe('wallet');
            }
        );
        it('reads a vendor Pay Later button as a wallet ahead of the pay-later exclusion', () => {
            const path = shadowPath('paypal-pay-later-button', '<button aria-label="Pay Later">Pay Later</button>');
            expect(classify(path, '/checkout')).toBe('wallet');
        });
        it('reads a vendor host with a closed shadow root as the control', () => {
            const host = control('<paypal-button type="pay"></paypal-button>');
            host.attachShadow({ mode: 'closed' });
            expect(findControl([host])).toBe(host);
            expect(classify([host], '/checkout')).toBe('wallet');
        });
        it('does not turn a link inside a merchant wrapper with a vendor class into a wallet', () => {
            const wrapper = control('<div class="apple-pay-button"><a href="/apple-pay">Learn more</a></div>');
            const link = wrapper.querySelector('a')!;
            expect(classify([link, wrapper], '/checkout')).toBeUndefined();
        });
        it.each(['set-up', 'add-money', 'reload', 'top-up'])('gives no intent for an Apple Pay %s button', type => {
            expect(classify([control(`<apple-pay-button type="${type}"></apple-pay-button>`)], '/checkout')).toBeUndefined();
        });
        it("reads PayPal's card button as a checkout step", () => {
            const path = shadowPath('paypal-basic-card-button', '<button aria-label="Debit or Credit Card">Debit or Credit Card</button>');
            expect(classify(path, '/checkout')).toBe('checkout_step');
        });
        it('still lets a picker role win over a vendor class', () => {
            expect(classify([control('<button role="radio" class="gpay-button" aria-checked="false"></button>')], '/checkout')).toBeUndefined();
        });
    });

    describe('merchant wallet buttons named in an id or test id', () => {
        // A click lands on inner text; the path climbs to the named element.
        const pathFrom = (html: string, innerSelector: string) => {
            const root = control(html);
            const path: Element[] = [];
            let node: Element | null = root.querySelector(innerSelector) || root;
            while (node) {
                path.push(node);
                node = node.parentElement;
            }
            return path;
        };

        it('reads a div drawn as an Apple Pay button, whose logo carries the wallet name, as a wallet', () => {
            const path = pathFrom(
                '<div data-testid="applepay-checkout-button" class="sc-a1"><span class="text"><span class="caption">Checkout with</span></span><span class="mark"></span></div>',
                '.caption'
            );
            expect(findControl(path)).toBe(path[2]);
            expect(classify(path, '/checkout/review')).toBe('wallet');
        });
        it.each([
            ['an upper-case row id', '<div id="VENMO_CHECKOUT_BTN"><div><svg aria-label="Venmo"></svg></div><div><span>Venmo</span></div></div>'],
            ['an express row id', '<div id="PAYPAL_WALLET_BTN"><div><span>PayPal</span></div></div>'],
            ['a cash app test id', '<div data-testid="cashAppPayButton"><span>Cash App Pay</span></div>'],
            ['a kebab-case id', '<div id="amazon-pay-btn"><span>Amazon Pay</span></div>'],
            ['a test id that leads with the button word', '<div data-testid="btn-google-pay"><span>Google Pay</span></div>'],
        ])('reads a payment row named with %s as a wallet', (_, html) => {
            expect(classify(pathFrom(html, 'span'), '/checkout/review')).toBe('wallet');
        });
        it.each([
            ['a card row', '<div id="CARD_PAYMENT_BTN"><span>Credit card</span></div>'],
            ['a generic button id', '<div id="SUBMIT_BTN"><span>Continue</span></div>'],
            ['a wallet name without a button word', '<div id="apple-pay-option"><span>Apple Pay</span></div>'],
            ['a wallet container', '<div id="paypal-button-container"><span>PayPal</span></div>'],
            ['a wallet logo', '<div id="apple-pay-button-logo"><span>Apple Pay</span></div>'],
            ['a dropdown toggle showing the chosen wallet', '<span data-testid="payment-dropdown-toggle"><span>Apple Pay</span></span>'],
            ['a wallet word inside another word', '<div id="unvenmoable-btn"><span>Pay</span></div>'],
        ])('finds no control for %s', (_, html) => {
            expect(findControl(pathFrom(html, 'span'))).toBeUndefined();
        });
        it('skips a wallet-named button that marks itself disabled', () => {
            const path = pathFrom('<div data-testid="applepay-checkout-button" class="disabled"><span>Checkout with</span></div>', 'span');
            expect(findControl(path)).toBeUndefined();
        });
        it('keeps the look-alike exclusions ahead of the name', () => {
            expect(classify(pathFrom('<div id="paypal-pay-btn"><span>Learn more</span></div>', 'span'), '/checkout')).toBeUndefined();
        });
        it('keeps a wallet-named row inside a radio group quiet', () => {
            const path = pathFrom('<div role="radiogroup"><div id="venmo-pay-btn"><span>Venmo</span></div></div>', 'span');
            expect(findControl(path)).toBe(path[1]);
            expect(classify(path, '/checkout')).toBeUndefined();
        });
        it('keeps a wallet-named picker quiet', () => {
            expect(classify([control('<div id="paypal-pay-btn" role="option" aria-selected="false">PayPal</div>')], '/checkout')).toBeUndefined();
        });
        it('lets a real button inside a wallet-named element stay the control', () => {
            const path = pathFrom('<div id="paypal-pay-btn"><button>Place order</button></div>', 'button');
            expect(findControl(path)).toBe(path[0]);
            expect(classify(path, '/checkout')).toBe('commit');
        });
        it.each([
            ['radio', '<div id="paypal-pay-btn"><input type="radio" name="pay"><span>PayPal</span></div>'],
            ['checkbox', '<div id="paypal-pay-btn"><input type="checkbox" name="save"><span>Save PayPal</span></div>'],
        ])('keeps a %s inside a wallet-named row as the quiet control', (_, html) => {
            const path = pathFrom(html, 'input');
            expect(findControl(path)).toBe(path[0]);
            expect(classify(path, '/checkout')).toBeUndefined();
        });
        it.each([
            ['a native select', '<div id="paypal-pay-btn"><select><option>PayPal</option></select></div>', 'select'],
            ['a disclosure toggle', '<div id="paypal-pay-btn"><div aria-expanded="false"><span>More</span></div></div>', 'span'],
            ['a pressed toggle', '<div id="paypal-pay-btn"><div aria-pressed="false"><span>Save</span></div></div>', 'span'],
            ['a radio group caption', '<div id="paypal-pay-btn"><div role="radiogroup"><span>Pay with</span></div></div>', 'span'],
            ['a tab list', '<div id="paypal-pay-btn"><div role="tablist"><span>Wallets</span></div></div>', 'span'],
            ['a list box', '<div id="paypal-pay-btn"><ul role="listbox"><li><span>PayPal</span></li></ul></div>', 'span'],
            ['a text field', '<div id="paypal-pay-btn"><input type="email" name="email"></div>', 'input'],
        ])('keeps %s inside a wallet-named row from becoming its tap', (_, html, inner) => {
            const path = pathFrom(html, inner);
            expect(classify(path, '/checkout')).toBeUndefined();
        });
        it('finds no control for a label tapped inside a wallet-named row', () => {
            const path = pathFrom(
                '<div id="venmo-pay-btn"><label><span>Venmo</span><input type="radio" name="pay"></label></div>',
                'span'
            );
            expect(findControl(path)).toBeUndefined();
        });
        it.each([
            ['a label', '<label for="pm-wallet"><div id="paypal-button"><span>PayPal</span></div></label>'],
            ['a radio row', '<div role="radio" aria-checked="false"><span data-testid="venmoPayBtn">Venmo</span></div>'],
            ['a selected option', '<div role="option" aria-selected="true"><div id="cash-app-pay-btn"><span>Cash App Pay</span></div></div>'],
        ])('finds no control for a wallet-named element inside %s', (_, html) => {
            const path = pathFrom(html, 'span');
            expect(findControl(path)).toBeUndefined();
            expect(classify(path, '/checkout')).toBeUndefined();
        });
        it.each([
            ['a select', '<select id="paypal-button"><option>PayPal</option></select>'],
            ['a text field', '<input type="text" id="paypal-button">'],
            ['a text area', '<textarea id="paypal-button"></textarea>'],
            ['an editable region', '<div contenteditable="true" id="paypal-button">PayPal</div>'],
            ['a disclosure toggle', '<div aria-expanded="false" id="paypal-button">PayPal</div>'],
        ])('finds no control for %s named after a wallet', (_, html) => {
            const element = control(html);
            expect(findControl([element])).toBeUndefined();
            expect(classify([element], '/checkout')).toBeUndefined();
        });
        it('reads a real button inside a picker by its label, not its wallet name', () => {
            const path = pathFrom('<div role="radio"><button id="paypal-pay-btn">Select</button></div>', 'button');
            expect(findControl(path)).toBe(path[0]);
            expect(classify(path, '/checkout')).toBeUndefined();
        });
        it('still reads a wallet-named element outside any picker as a wallet by its name', () => {
            const path = pathFrom('<div><div data-testid="venmoPayBtn"><span>Venmo</span></div></div>', 'span');
            expect(classifyIntent(findControl(path)!, '/checkout')).toEqual({ kind: 'wallet', source: 'name' });
        });
        it.each([
            ['its text', '<div id="paypal-pay-btn"><input type="radio" name="pm"><span>PayPal</span></div>', 'span'],
            ['its logo, beside a hidden radio', '<div id="paypal-pay-btn"><input type="radio" name="pm" hidden><img alt="PayPal"></div>', 'img'],
            ['its text, beside a role radio', '<div data-testid="venmoPayBtn"><div role="radio" aria-checked="false"></div><span>Venmo</span></div>', 'span'],
        ])('gives no intent for a tap on %s in a wallet-named row that holds a picker', (_, html, inner) => {
            const path = pathFrom(html, inner);
            expect(findControl(path)).toBeUndefined();
            expect(classify(path, '/checkout')).toBeUndefined();
        });
        it.each(['paypal-select-btn', 'venmo-option-btn', 'applepay-tab-button', 'payment-method-paypal-button', 'pay-pal-toggle-btn', 'paypalRadioButton', 'venmo-choice-btn'])(
            'finds no control for a button named %s, which only chooses a wallet',
            id => {
                expect(findControl(pathFrom(`<div id="${id}"><span>PayPal</span></div>`, 'span'))).toBeUndefined();
            }
        );
        it.each(['affirm-btn', 'affirmButton', 'affirm-continue-btn'])('finds no control for %s, where affirm is only a verb', id => {
            expect(findControl(pathFrom(`<div id="${id}"><span>I agree</span></div>`, 'span'))).toBeUndefined();
        });
        it.each(['affirm-checkout-btn', 'affirmPayButton', 'affirm-payment-button'])('reads %s as a wallet', id => {
            expect(classify(pathFrom(`<div id="${id}"><span>Affirm</span></div>`, 'span'), '/checkout')).toBe('wallet');
        });
        it.each([
            ['a collapsed disclosure button', '<button aria-expanded="false"><span id="paypal-button">PayPal</span></button>'],
            ['an expanded disclosure button', '<button aria-expanded="true"><span id="paypal-button">PayPal</span></button>'],
            ['an unpressed toggle button', '<button aria-pressed="false"><span data-testid="venmoPayBtn">Venmo</span></button>'],
            ['a pressed toggle button', '<button aria-pressed="true"><span data-testid="venmoPayBtn">Venmo</span></button>'],
        ])('keeps a wallet-named element inside %s quiet', (_, html) => {
            const path = pathFrom(html, 'span');
            expect(findControl(path)).toBe(path[1]);
            expect(classify(path, '/checkout')).toBeUndefined();
        });
        it.each([
            ['an aria-disabled button', '<button aria-disabled="true"><span id="paypal-button">PayPal</span></button>'],
            ['a disabled button', '<button disabled><span id="paypal-button">PayPal</span></button>'],
        ])('finds no control for a wallet-named element inside %s', (_, html) => {
            expect(findControl(pathFrom(html, 'span'))).toBeUndefined();
        });
        it('finds no control for a wallet-named element inside an editable region', () => {
            const path = pathFrom('<div contenteditable="true"><span id="paypal-button">PayPal</span></div>', 'span');
            expect(findControl(path)).toBeUndefined();
            expect(classify(path, '/checkout')).toBeUndefined();
        });
        it('gives no intent for a tap beside a select in a wallet-named row', () => {
            const path = pathFrom('<div id="paypal-button"><select><option>PayPal</option></select><span>PayPal</span></div>', 'span');
            expect(findControl(path)).toBeUndefined();
            expect(classify(path, '/checkout')).toBeUndefined();
        });
        it('still reads a wallet-named row that carries a hidden input as a wallet', () => {
            const path = pathFrom('<div id="paypal-pay-btn"><input type="hidden" name="method" value="wallet"><span>PayPal</span></div>', 'span');
            expect(classify(path, '/checkout')).toBe('wallet');
        });
        it.each([
            ['an aria-disabled', '<div id="paypal-button" aria-disabled="true"><span id="paypal-btn">PayPal</span></div>'],
            ['a disabled-class', '<div id="paypal-button" class="disabled"><span id="paypal-btn">PayPal</span></div>'],
        ])('keeps a wallet-named child of %s wallet-named row from taking the click', (_, html) => {
            expect(findControl(pathFrom(html, 'span'))).toBeUndefined();
        });
        it('keeps a wallet-named child of a row that holds a radio from taking the click', () => {
            const path = pathFrom('<div id="paypal-button"><input type="radio" name="pm"><span data-testid="paypalButton">PayPal</span></div>', 'span');
            expect(findControl(path)).toBeUndefined();
            expect(classify(path, '/checkout')).toBeUndefined();
        });
        it('gives no intent for a caption tap in a wallet-named host whose shadow root holds a radio', () => {
            const path = shadowPath('div', '<span>PayPal</span><input type="radio" name="pm">', 'id="paypal-pay-btn"');
            expect(findControl(path)).toBeUndefined();
            expect(classify(path, '/checkout')).toBeUndefined();
        });
        it.each([
            ['submit', '<input type="submit" id="applePayButton" value="">'],
            ['button', '<input type="button" id="applePayButton" value="">'],
            ['image', '<input type="image" id="applePayButton" src="pay.png">'],
        ])('reads a wallet-named %s input with no label as a wallet', (_, html) => {
            const element = control(html);
            expect(classifyIntent(findControl([element])!, '/checkout')).toEqual({ kind: 'wallet', source: 'name' });
        });
        it('still keeps a plain radio quiet', () => {
            const radio = control('<input type="radio" name="pay" value="wallet">');
            expect(findControl([radio])).toBe(radio);
            expect(classify([radio], '/checkout')).toBeUndefined();
        });
    });

    it('recognizes hosted plural checkout routes for buy now', () => {
        expect(
            classify(
                [control('<button>Buy now</button>')],
                '/checkouts/token'
            )
        ).toBe('commit');
    });
    it('reads the visible text when a long aria-label does not match', () => {
        const link = control(
            '<a href="#javascript" role="button" aria-label="Submit order when press enter navigate to order confirmation page">Submit order<i aria-hidden="true"></i></a>'
        );
        expect(classify([link], '/cart/review')).toBe('commit');
    });
    it('ignores an icon and the order total inside a commit button', () => {
        const button = control(
            '<button type="submit"><svg aria-hidden="true"></svg><span> Place Order </span><span>$31.98</span></button>'
        );
        expect(classify([button.querySelector('span')!, button], '/check-out/review')).toBe('commit');
    });
    it.each([
        ['Place order', 'commit'],
        ['Pay now $12.99', 'commit'],
        ['Complete purchase', 'commit'],
        ['Confirm order', 'commit'],
        ['Zahlungspflichtig bestellen', 'commit'],
        ['Jetzt bezahlen', 'commit'],
        ['Commande avec obligation de paiement', 'commit'],
        ['Payer maintenant', 'commit'],
        ['Finaliser l’achat', 'commit'],
        ['Pagar ahora', 'commit'],
        ['Realizar pedido', 'commit'],
        ['Submit order', 'commit'],
        ['Place your order', 'commit'],
        ['Place your delivery order', 'commit'],
        ['Complete your purchase', 'commit'],
        ['Confirm booking', 'commit'],
        ['Submit payment', 'commit'],
        ['Pay $19.13', 'commit'],
        ['Confirm and pay', 'commit'],
        ['Pay securely now', 'commit'],
        ['Order and pay', 'commit'],
        ['Jetzt zahlungspflichtig bestellen', 'commit'],
        ['Kostenpflichtig bestellen', 'commit'],
        ['Commander et payer', 'commit'],
        ['Finalizar pedido', 'commit'],
        ['Realizar el pedido', 'commit'],
        ['Pagar', 'commit'],
        ['Effettua l’ordine', 'commit'],
        ['Ordine con obbligo di pagamento', 'commit'],
        ['Bestelling plaatsen', 'commit'],
        ['Bestellen en betalen', 'commit'],
        ['注文を確定する', 'commit'],
        ['注文を確定', 'commit'],
        ['この内容で注文する', 'commit'],
        ['注文する', 'commit'],
        ['この内容で購入する', 'commit'],
        ['この内容で予約する', 'commit'],
        ['予約する', undefined],
        ['予約を確定する', 'commit'],
        ['今すぐ支払う', 'commit'],
        ['１，９８０円を支払う', 'commit'],
        ['￥1,980を支払う', 'commit'],
        ['Check out', 'checkout_step'],
        ['Tramitar pedido', 'checkout_step'],
        ['Procedi al pagamento', 'checkout_step'],
        ['Afrekenen', 'checkout_step'],
        ['レジに進む', 'checkout_step'],
        ['ご購入手続きへ', 'checkout_step'],
        ['購入手続きに進む', 'checkout_step'],
        ['Check-out', 'checkout_step'],
        ['Auschecken', 'checkout_step'],
        ['Subscribe', undefined],
        ['Book now', undefined],
        ['Get tickets', undefined],
        ['Buy tickets', undefined],
        ['Achteraf betalen', undefined],
        ['カートに入れる', undefined],
        ['クーポンを使う', undefined],
        ['Place another order', undefined],
        ['Place a new order', undefined],
        ['Place new order', undefined],
        ['Submit a new order', undefined],
        ['Place your next order', undefined],
        ['Edit order', undefined],
        ['Track order', undefined],
        ['Review order', 'checkout_step'],
        ['Apple Pay', 'wallet'],
        ['Google Pay', 'wallet'],
        ['PayPal', 'wallet'],
        ['Venmo', 'wallet'],
        ['Amazon Pay', 'wallet'],
        ['Shop Pay', 'wallet'],
        ['Klarna', 'wallet'],
        ['Afterpay', 'wallet'],
        ['Affirm', 'wallet'],
        ['Checkout', 'checkout_step'],
        ['Continue to payment', 'checkout_step'],
        ['Zur Kasse', 'checkout_step'],
        ['Passer à la caisse', 'checkout_step'],
        ['Continuar al pago', 'checkout_step'],
        ['Coupon', undefined],
        ['Promo pay now', undefined],
        ['Newsletter', undefined],
        ['Sign in', undefined],
        ['Add to cart', 'cart'],
        ['Gift card', undefined],
        ['Pay later with Klarna', undefined],
        ['Gutschein', undefined],
        ['Connexion', undefined],
        ['Carrito', undefined],
    ])('classifies %s', (text, expected) => {
        const button = document.createElement('button');
        button.textContent = text!;
        expect(classify([button], '/checkout')).toBe(expected);
    });
    it.each([
        ['Place order \u00B7 $43.95', 'commit'],
        ['Place order \u2022 $43.95', 'commit'],
        ['Place order - $43.95', 'commit'],
        ['Place order \u2013 $43.95', 'commit'],
        ['Place order \u2014 $43.95', 'commit'],
        ['Place order | $43.95', 'commit'],
        ['Place order: $43.95', 'commit'],
        ['Place order / $43.95', 'commit'],
        ['Place order (2 items)', 'commit'],
        ['Place order [2 items]', 'commit'],
        ['[Place order]', 'commit'],
        ['Place order \u2192', 'commit'],
        ['Place order \u00BB', 'commit'],
        ['Place order >', 'commit'],
        ['Place order!', 'commit'],
        ['\uD83D\uDD12 Place order', 'commit'],
        ['Pay $43.95 now', 'commit'],
        ['Pay now \u00B7 $43.95', 'commit'],
        ['Pay now ($43.95)', 'commit'],
        ['Pay $43.95 \u2192', 'commit'],
        ['Zahlungspflichtig bestellen \u2192', 'commit'],
        ['Commander et payer (3 articles)', 'commit'],
        ['\u6CE8\u6587\u3092\u78BA\u5B9A\u3059\u308B\uFF08\uFF12\u70B9\uFF09', 'commit'],
        ['\u6CE8\u6587\u3092\u78BA\u5B9A\u3059\u308B \uFF1E', 'commit'],
        ['\u3010\u6CE8\u6587\u3092\u78BA\u5B9A\u3059\u308B\u3011', 'commit'],
        ['Checkout (3)', 'checkout_step'],
        ['\u2192 Continue to payment', 'checkout_step'],
        ['PayPal (opens in a new window)', 'wallet'],
        ['Place order history', undefined],
        ['Place order \u00B7 history', undefined],
        ['Learn how to place order', undefined],
        ['Order status', undefined],
        ['Learn more about payment', undefined],
        ['Pay later', undefined],
        ['Pay later \u2192', undefined],
        ['Place order (pay later)', 'commit'],
        ['Place another order \u2192', undefined],
        ['Track order (2 items)', undefined],
        ['\u2192', undefined],
    ])('reads %s around the action', (text, expected) => {
        const button = document.createElement('button');
        button.textContent = text!;
        expect(classify([button], '/checkout')).toBe(expected);
    });
    it.each([
        'Purchase',
        'Jetzt kaufen',
        'Comprar ahora',
        '今すぐ購入',
        '購入する',
        'この内容で申し込む',
        'Commander',
        'Passer la commande',
        'Valider la commande',
        'Valider ma commande',
        'Finalizar compra',
    ])('limits %s to checkout paths', text => {
        const button = document.createElement('button');
        button.textContent = text;
        expect(classify([button], '/product')).toBeUndefined();
        expect(classify([button], '/checkout')).toBe('commit');
        expect(classify([button], '/panier')).toBeUndefined();
    });
    it('does not read re-order buttons on a confirmation page as commits', () => {
        expect(
            classify(
                [control('<button>Place a new order</button>')],
                '/order/received'
            )
        ).toBeUndefined();
    });
    it('records the French WooCommerce commit on the place-order button, not the cart button', () => {
        const cartButton = control(
            '<a class="checkout wc-forward" href="/commander/">Valider la commande</a>'
        );
        expect(
            classify([cartButton], '/boutique/produit-x/')
        ).toBeUndefined();
        expect(classify([cartButton], '/panier/')).toBeUndefined();
        const placeOrder = control(
            '<button type="submit" id="place_order" value="Commander">Commander</button>'
        );
        expect(classify([placeOrder], '/commander/')).toBe(
            'commit'
        );
    });
    it('limits buy now to checkout paths', () => {
        const button = control('<button>Buy now</button>');
        expect(classify([button], '/product')).toBeUndefined();
        expect(classify([button], '/checkout')).toBe('commit');
    });
    it.each(['Register', 'Register now', 'Complete registration', 'Complete your registration'])(
        'reads %s as the confirm click only on a checkout path',
        text => {
            const button = document.createElement('button');
            button.textContent = text;
            expect(classify([button], '/checkout')).toBe('commit');
            expect(classify([button], '/events/123')).toBeUndefined();
            expect(classify([button], '/account/register')).toBeUndefined();
        }
    );
    it('never reads register on a plain link or in a longer sign-up label', () => {
        expect(classify([control('<a href="/account/new">Register</a>')], '/checkout')).toBeUndefined();
        expect(classify([control('<button>Register for an account</button>')], '/checkout')).toBeUndefined();
    });
    it.each(['/checkout-v2', '/checkout-flow/step-2', '/express-checkout', '/en/guest-checkouts/abc'])(
        'counts the hyphenated checkout segment %s as a checkout path',
        pathname => {
            expect(classify([control('<button>Register</button>')], pathname)).toBe('commit');
            expect(classify([control('<button>Buy now</button>')], pathname)).toBe('commit');
        }
    );
    it.each([
        ['/checkouts/token', 'commit'],
        ['/checkoutpage', undefined],
        ['/checkout_v2', undefined],
    ])('still classes %s as before', (pathname, expected) => {
        expect(classify([control('<button>Purchase</button>')], pathname)).toBe(expected);
    });
    it.each([
        '/checkout/thankyou/1ABC2DE',
        '/checkout/thank-you',
        '/checkout/confirmation/42',
        '/checkout-complete',
        '/checkout/success',
        '/order/received',
    ])('never reads a route-gated label as a commit on the confirmation page %s', pathname => {
        expect(classify([control('<button>Register</button>')], pathname)).toBeUndefined();
        expect(classify([control('<button>Buy now</button>')], pathname)).toBeUndefined();
        expect(classify([control('<button>Purchase</button>')], pathname)).toBeUndefined();
        expect(classify([control('<button>Place order</button>')], pathname)).toBe('commit');
    });
    it.each([
        'apple-pay-button',
        'shop-pay-button',
        'button class="gpay-button"',
        'div id="AmazonPayButton"',
    ])('recognizes %s', tag => {
        const element = control(`<${tag}></${tag.split(' ')[0]}>`);
        expect(classify([element], '/')).toBe('wallet');
    });
    it('does not classify wallet links or banners', () => {
        expect(
            classify(
                [control('<a href="/">PayPal</a>')],
                '/checkout'
            )
        ).toBeUndefined();
        expect(
            classify(
                [control('<div>Apple Pay</div>')],
                '/checkout'
            )
        ).toBeUndefined();
    });
    it.each([
        '<button>' + 'a'.repeat(129) + '</button>',
        '<button><input value="Pay now"></button>',
        '<button><i></i><i></i><i></i><i></i><i></i>Pay now</button>',
    ])('rejects oversized or field-containing controls', html => {
        expect(
            classify([control(html)], '/checkout')
        ).toBeUndefined();
    });
    it.each([
        ['an editable region', '<div role="button" contenteditable>Place order</div>'],
        ['a select', '<select role="button"><option>Place order</option></select>'],
        ['a control under an editable region', '<div contenteditable><span role="button">Place order</span></div>'],
    ])('never reads the text of %s', (_, html) => {
        document.body.innerHTML = html;
        const target = document.querySelector('[role="button"]');
        expect(classify([target], '/checkout')).toBeUndefined();
        document.body.innerHTML = '';
    });
    it.each([
        ['more than four children', '<button aria-label="%s"><i></i><i></i><i></i><i></i><i></i>%s</button>'],
        ['a form field', '<button aria-label="%s"><input value="x">%s</button>'],
        ['an editable region', '<div role="button" contenteditable aria-label="%s">%s</div>'],
    ])('reads only the aria-label of a control with %s', (_, template) => {
        const html = (label: string, text: string) =>
            template.replace('%s', label).replace('%s', text);
        document.body.innerHTML = html('Place order', 'Continue');
        const labelled = document.querySelector('button, [role="button"]')!;
        const read = jest.fn(() => 'Place order');
        Object.defineProperty(labelled, 'textContent', { get: read });
        expect(classify([labelled], '/checkout')).toBe('commit');
        document.body.innerHTML = html('Continue', 'Place order');
        expect(
            classify([document.querySelector('button, [role="button"]')], '/checkout')
        ).toBeUndefined();
        expect(read).not.toHaveBeenCalled();
        document.body.innerHTML = '';
    });
    it.each([
        ['text', ' type="text"'],
        ['password', ' type="password"'],
        ['email', ' type="email"'],
        ['number', ' type="number"'],
        ['untyped', ''],
        ['unknown type', ' type="anything-at-all"'],
    ])(
        'never reads %s input values even with button role',
        (_, typeAttribute) => {
            const input = control(`<input${typeAttribute} role="button">`);
            const read = jest.fn(() => {
                throw new Error('field value read');
            });
            Object.defineProperty(input, 'value', { get: read });
            expect(classify([input], '/checkout')).toBeUndefined();
            expect(read).not.toHaveBeenCalled();
        }
    );
    it.each(['submit', 'button'])('reads %s button labels', type => {
        expect(
            classify(
                [control(`<input type="${type}" value="Pay now">`)],
                '/checkout'
            )
        ).toBe('commit');
    });
    it('reads image alt and prefers aria-label', () => {
        expect(
            classify(
                [control('<input type="image" alt="Pay now">')],
                '/checkout'
            )
        ).toBe('commit');
        expect(
            classify(
                [control('<button aria-label="Pay now">different</button>')],
                '/checkout'
            )
        ).toBe('commit');
    });
    it('falls back to visible text when a sentence-length aria-label does not match', () => {
        expect(
            classify(
                [
                    control(
                        '<a href="#javascript" role="button" aria-label="Submit order when press enter navigate to order confirmation page">Submit order<i></i></a>'
                    ),
                ],
                '/cart/review'
            )
        ).toBe('commit');
    });
    it('lets a confirm label win over an excluded label on the same control', () => {
        expect(classify([control('<button aria-label="Apply promo">Place order</button>')], '/checkout')).toBe('commit');
        expect(classify([control('<button aria-label="Place order">Apply promo</button>')], '/checkout')).toBe('commit');
    });
    it('lets an excluded aria-label or text veto wallet and step labels', () => {
        expect(classify([control('<button aria-label="Apply promo">Checkout</button>')], '/cart')).toBe(undefined);
        expect(classify([control('<button aria-label="Pay later">Klarna</button>')], '/checkout')).toBe(undefined);
        expect(classify([control('<button aria-label="Klarna">Learn more</button>')], '/checkout')).toBe(undefined);
    });
    it('matches an open shadow button and rejects Rokt ancestry', () => {
        const host = document.createElement('div');
        const root = host.attachShadow({ mode: 'open' });
        root.innerHTML = '<button>Place order</button>';
        expect(
            classify(
                [root.firstElementChild, root, host],
                '/checkout'
            )
        ).toBe('commit');
        host.setAttribute('data-core-type', 'plugin');
        expect(
            classify(
                [root.firstElementChild, root, host],
                '/checkout'
            )
        ).toBeUndefined();
        expect(
            classify(
                [
                    control(
                        '<button src="https://example.test/proxy/wsdk/button">Pay now</button>'
                    ),
                ],
                '/checkout'
            )
        ).toBeUndefined();
    });
    it('treats an unparseable src as a partner control, not Rokt', () => {
        expect(
            classify(
                [control('<button src="http://[">Place order</button>')],
                '/checkout'
            )
        ).toBe('commit');
    });
    it('classifies a control in a browser without getRootNode', () => {
        const button = control('<button>Place order</button>');
        Object.defineProperty(button, 'getRootNode', { value: undefined });
        expect(classify([button], '/checkout')).toBe('commit');
    });
    it('bounds traversal to twelve path entries', () => {
        expect(
            classify(
                [
                    ...Array.from({ length: 12 }, () =>
                        document.createElement('span')
                    ),
                    control('<button>Pay now</button>'),
                ],
                '/checkout'
            )
        ).toBeUndefined();
    });
    const HASH = '0123456789abcdef0123456789abcdef';
    it.each([
        ['https://www.paypal.com/smart/buttons?style=x', 'wallet'],
        ['https://www.sandbox.paypal.com/smart/buttons', 'wallet'],
        ['https://www.paypal.com/smart/menu', 'wallet'],
        ['https://pay.google.com/gp/p/ui/payframe', 'wallet'],
        ['https://applepay.cdn-apple.com/jsapi/frame', 'wallet'],
        ['https://payments.amazon.com/checkout', 'wallet'],
        ['https://pay.shopify.com/frame', 'wallet'],
        [`https://js.stripe.com/v3/elements-inner-payment-request-${HASH}.html#k=v`, 'wallet'],
        [`https://js.stripe.com/v3/elements-inner-express-checkout-${HASH}.html#k=v`, 'wallet'],
        [`https://js.stripe.com/v3/elements-inner-card-${HASH}.html#k=v`, 'frame'],
        [`https://js.stripe.com/v3/elements-inner-payment-${HASH}.html#k=v`, 'frame'],
        [`https://js.stripe.com/v3/elements-inner-address-${HASH}.html#k=v`, 'frame'],
        ['https://checkoutshopper-live.adyen.com/checkoutshopper/securedfields/live_KEY/5.0.0/securedFields.html?type=card', 'frame'],
        ['https://checkoutshopper-live.adyen.com/checkoutshopper/other.html', 'frame'],
        ['https://checkoutshopper-live-us.adyen.com/checkoutshopper/securedfields/live_KEY/5.0.0/securedFields.html', 'frame'],
        ['https://assets.braintreegateway.com/web/3.97.2/html/hosted-fields-frame.min.html', 'frame'],
        ['https://flex.cybersource.com/microform/bundle/v2/iframe.html', 'frame'],
        ['https://web.squarecdn.com/v1/square.js/card.html', 'frame'],
        ['https://checkout-web-components.checkout.com/index.html', 'frame'],
        ['https://www.paypal.com/frame', 'frame'],
        ['https://www.paypal.com/smart/card-fields', 'frame'],
        ['https://www.paypal.com/smart/card-field', 'frame'],
        ['https://www.paypal.com/credit-presentment/smart/message', 'frame'],
        ['https://www.paypal.com/credit-presentment/smart/modal', 'frame'],
        ['https://pay.google.com.example.test/frame', undefined],
        ['https://example.test/v3/elements-inner-payment-request-x.html', undefined],
    ])('classifies focus into %s as %s', (src, expected) => {
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });
        const frame = control(`<iframe src="${src}"></iframe>`);
        expect(frameKind(frame)).toBe(expected);
    });
    // PayPal's JS SDK names each frame __zoid__<component>__<payload>__ and
    // loads it by navigating the frame, so the frame has no src of its own.
    const ZOID_PAYLOAD = 'eyJzZW5kZXIiOnsiZG9tYWluIjoiaHR0cHM6Ly9zaG9wLmV4YW1wbGUifX0=';
    const zoidName = (component: string) => `__zoid__${component}__${ZOID_PAYLOAD}__`;
    it.each([
        ['a button frame with no src', zoidName('paypal_buttons'), null, 'wallet'],
        ['a button frame with an about:blank src', zoidName('paypal_buttons'), 'about:blank', 'wallet'],
        ['a button frame with its PayPal src', zoidName('paypal_buttons'), 'https://www.paypal.com/smart/buttons?style.label=paypal', 'wallet'],
        ['a button frame with its sandbox src', zoidName('paypal_buttons'), 'https://www.sandbox.paypal.com/smart/buttons', 'wallet'],
        ['a menu frame with no src', zoidName('paypal_menu'), null, 'wallet'],
        ['a pay later message frame', zoidName('paypal_message'), null, 'frame'],
        ['a pay later message frame with its PayPal src', zoidName('paypal_message'), 'https://www.paypal.com/credit-presentment/smart/message', 'frame'],
        ['a pay later modal frame', zoidName('paypal_credit_modal'), null, 'frame'],
        ['a card field frame', zoidName('paypal_card_number_field'), null, 'frame'],
        ['a card fields frame', zoidName('paypal_card_fields'), 'about:blank', 'frame'],
        ['a checkout overlay frame', zoidName('paypal_checkout'), null, 'frame'],
        ['a button-named frame loading a message', zoidName('paypal_buttons'), 'https://www.paypal.com/credit-presentment/smart/message', 'frame'],
        ['a button-named frame loading another host', zoidName('paypal_buttons'), 'https://example.test/smart/buttons', undefined],
        ['a button-named frame loading over HTTP', zoidName('paypal_buttons'), 'http://www.paypal.com/smart/buttons', undefined],
        ['a prerender placeholder frame', '__zoid_prerender_frame__paypal_buttons_uid_0123456789__', null, undefined],
        ['another zoid component', zoidName('venmo_checkout'), null, undefined],
        ['a frame named like the component without the zoid prefix', 'paypal_buttons', null, undefined],
        ['an unnamed frame with no src', '', null, undefined],
    ])('classifies focus into a PayPal SDK %s', (_, name, src, expected) => {
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });
        const frame = document.createElement('iframe');
        frame.name = name;
        if (src !== null) {
            frame.setAttribute('src', src);
        }
        expect(frameKind(frame)).toBe(expected);
    });
    it('names no payment family for a PayPal SDK frame, which can draw more than one method', () => {
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });
        const frame = document.createElement('iframe');
        frame.name = zoidName('paypal_buttons');
        expect(classifyPaymentFrame(frame, window)).toEqual({ kind: 'wallet' });
        frame.name = zoidName('paypal_card_fields');
        expect(classifyPaymentFrame(frame, window)).toEqual({ kind: 'frame' });
    });
    it('ignores a PayPal SDK button frame while the page is hidden or marked no-track', () => {
        const frame = control(
            `<div data-mp-no-track><iframe name="${zoidName('paypal_buttons')}"></iframe></div>`
        ).querySelector('iframe')!;
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });
        expect(frameKind(frame)).toBeUndefined();
        frame.parentElement!.removeAttribute('data-mp-no-track');
        expect(frameKind(frame)).toBe('wallet');
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'hidden',
        });
        expect(frameKind(frame)).toBeUndefined();
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });
    });
    it.each([
        ['marked itself', '<iframe data-mp-no-track src="https://pay.google.com/frame"></iframe>'],
        ['under a marked ancestor', '<div data-mp-no-track><iframe src="https://pay.google.com/frame"></iframe></div>'],
    ])('ignores a wallet frame %s with data-mp-no-track', (_, html) => {
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });
        const element = control(html);
        const frame = element.querySelector('iframe') || element;
        expect(frameKind(frame)).toBeUndefined();
    });
    it('accepts only visible HTTPS frames on the exact hosts or their own subdomains', () => {
        const frame = control(
            '<iframe src="https://www.paypal.com/frame"></iframe>'
        );
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });
        expect(frameKind(frame)).toBe('frame');
        frame.setAttribute('src', 'https://www.paypal.com/smart/buttons');
        expect(frameKind(frame)).toBe('wallet');
        frame.setAttribute('src', 'https://www.paypal.com.example.test/smart/buttons');
        expect(frameKind(frame)).toBeUndefined();
        frame.setAttribute('src', 'http://www.paypal.com/smart/buttons');
        expect(frameKind(frame)).toBeUndefined();
        frame.setAttribute('src', 'https://evil-adyen.com/checkoutshopper');
        expect(frameKind(frame)).toBeUndefined();
        frame.setAttribute('src', 'https://adyen.com.example.test/checkoutshopper');
        expect(frameKind(frame)).toBeUndefined();
    });
    it.each([
        ['https://pay.google.com/gp/p/ui/payframe', 'wallet', 'google_pay'],
        ['https://applepay.cdn-apple.com/jsapi/frame', 'wallet', 'apple_pay'],
        ['https://payments.amazon.com/checkout', 'wallet', 'amazon_pay'],
        ['https://pay.shopify.com/frame', 'wallet', 'shop_pay'],
        [`https://js.stripe.com/v3/elements-inner-card-${HASH}.html#k=v`, 'frame', 'card'],
        ['https://www.paypal.com/smart/card-fields', 'frame', 'card'],
        // Each draws or holds more than one method, so the frame alone names none.
        ['https://www.paypal.com/smart/buttons?style=x', 'wallet', undefined],
        ['https://www.paypal.com/smart/menu', 'wallet', undefined],
        [`https://js.stripe.com/v3/elements-inner-payment-request-${HASH}.html#k=v`, 'wallet', undefined],
        [`https://js.stripe.com/v3/elements-inner-express-checkout-${HASH}.html#k=v`, 'wallet', undefined],
        [`https://js.stripe.com/v3/elements-inner-payment-${HASH}.html#k=v`, 'frame', undefined],
        [`https://js.stripe.com/v3/elements-inner-address-${HASH}.html#k=v`, 'frame', undefined],
        ['https://www.paypal.com/credit-presentment/smart/message', 'frame', undefined],
        // Card hosts, some of which also serve gift card or bank account fields.
        ['https://assets.braintreegateway.com/web/3.97.2/html/hosted-fields-frame.min.html', 'frame', undefined],
        ['https://checkoutshopper-live.adyen.com/checkoutshopper/securedfields/live_KEY/5.0.0/securedFields.html', 'frame', undefined],
        ['https://flex.cybersource.com/microform/bundle/v2/iframe.html', 'frame', undefined],
        ['https://web.squarecdn.com/v1/square.js/card.html', 'frame', undefined],
        ['https://checkout-web-components.checkout.com/index.html', 'frame', undefined],
    ])('reads focus into %s as a %s naming %s', (src, kind, family) => {
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });
        const frame = control(`<iframe src="${src}"></iframe>`);
        expect(classifyPaymentFrame(frame, window)).toEqual(
            family ? { kind, family } : { kind }
        );
    });
    it('names no payment method for a frame it does not classify', () => {
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });
        const frame = control(
            '<iframe data-mp-no-track src="https://pay.google.com/frame"></iframe>'
        );
        expect(classifyPaymentFrame(frame, window)).toBeUndefined();
        frame.removeAttribute('data-mp-no-track');
        frame.setAttribute('src', 'http://pay.google.com/frame');
        expect(classifyPaymentFrame(frame, window)).toBeUndefined();
    });
});
