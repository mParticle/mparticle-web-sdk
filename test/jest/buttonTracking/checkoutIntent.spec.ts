import {
    classifyIntentControl,
    classifyIntentFrame,
} from '../../../src/buttonTracking/checkoutIntent';
import { findControl } from '../../../src/buttonTracking/controls';

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
        ['Review order', undefined],
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
        ['Add to cart', undefined],
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
        ['Place order (pay later)', undefined],
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
    it('lets an excluded aria-label or text veto the control', () => {
        expect(
            classify(
                [
                    control(
                        '<button aria-label="Apply promo">Place order</button>'
                    ),
                ],
                '/checkout'
            )
        ).toBe(undefined);
        expect(
            classify(
                [
                    control(
                        '<button aria-label="Place order">Apply promo</button>'
                    ),
                ],
                '/checkout'
            )
        ).toBe(undefined);
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
        ['https://checkoutshopper-live.adyen.com/checkoutshopper/other.html', 'wallet'],
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
        expect(classifyIntentFrame(frame, window)).toBe(expected);
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
        expect(classifyIntentFrame(frame, window)).toBeUndefined();
    });
    it('accepts only visible exact HTTPS frame hosts', () => {
        const frame = control(
            '<iframe src="https://www.paypal.com/frame"></iframe>'
        );
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });
        expect(classifyIntentFrame(frame, window)).toBe('wallet');
        frame.setAttribute('src', 'https://www.paypal.com.example.test/frame');
        expect(classifyIntentFrame(frame, window)).toBeUndefined();
        frame.setAttribute('src', 'http://www.paypal.com/frame');
        expect(classifyIntentFrame(frame, window)).toBeUndefined();
    });
});
