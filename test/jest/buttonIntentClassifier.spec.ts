import {
    classifyIntentControl,
    classifyIntentFrame,
    describeButtonClick,
    maskLabel,
} from '../../src/buttonIntentClassifier';

describe('buttonIntentClassifier', () => {
    const control = (html: string) => {
        const parent = document.createElement('div');
        parent.innerHTML = html;
        return parent.firstElementChild!;
    };
    it('recognizes hosted plural checkout routes for buy now', () => {
        expect(
            classifyIntentControl(
                [control('<button>Buy now</button>')],
                '/checkouts/token'
            )
        ).toBe('commit');
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
        expect(classifyIntentControl([button], '/checkout')).toBe(expected);
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
        expect(classifyIntentControl([button], '/product')).toBeUndefined();
        expect(classifyIntentControl([button], '/checkout')).toBe('commit');
        expect(classifyIntentControl([button], '/panier')).toBeUndefined();
    });
    it('does not read re-order buttons on a confirmation page as commits', () => {
        expect(
            classifyIntentControl(
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
            classifyIntentControl([cartButton], '/boutique/produit-x/')
        ).toBeUndefined();
        expect(classifyIntentControl([cartButton], '/panier/')).toBeUndefined();
        const placeOrder = control(
            '<button type="submit" id="place_order" value="Commander">Commander</button>'
        );
        expect(classifyIntentControl([placeOrder], '/commander/')).toBe(
            'commit'
        );
    });
    it('limits buy now to checkout paths', () => {
        const button = control('<button>Buy now</button>');
        expect(classifyIntentControl([button], '/product')).toBeUndefined();
        expect(classifyIntentControl([button], '/checkout')).toBe('commit');
    });
    it.each([
        'apple-pay-button',
        'shop-pay-button',
        'button class="gpay-button"',
        'div id="AmazonPayButton"',
    ])('recognizes %s', tag => {
        const element = control(`<${tag}></${tag.split(' ')[0]}>`);
        expect(classifyIntentControl([element], '/')).toBe('wallet');
    });
    it('does not classify wallet links or banners', () => {
        expect(
            classifyIntentControl(
                [control('<a href="/">PayPal</a>')],
                '/checkout'
            )
        ).toBeUndefined();
        expect(
            classifyIntentControl(
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
            classifyIntentControl([control(html)], '/checkout')
        ).toBeUndefined();
    });
    it.each(['text', 'password', 'email', 'number'])(
        'never reads %s input values even with button role',
        type => {
            const input = control(`<input type="${type}" role="button">`);
            const read = jest.fn(() => {
                throw new Error('field value read');
            });
            Object.defineProperty(input, 'value', { get: read });
            expect(classifyIntentControl([input], '/checkout')).toBeUndefined();
            expect(read).not.toHaveBeenCalled();
        }
    );
    it.each(['submit', 'button'])('reads %s button labels', type => {
        expect(
            classifyIntentControl(
                [control(`<input type="${type}" value="Pay now">`)],
                '/checkout'
            )
        ).toBe('commit');
    });
    it('reads image alt and prefers aria-label', () => {
        expect(
            classifyIntentControl(
                [control('<input type="image" alt="Pay now">')],
                '/checkout'
            )
        ).toBe('commit');
        expect(
            classifyIntentControl(
                [control('<button aria-label="Pay now">different</button>')],
                '/checkout'
            )
        ).toBe('commit');
    });
    it('falls back to visible text when a sentence-length aria-label does not match', () => {
        expect(
            classifyIntentControl(
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
            classifyIntentControl(
                [
                    control(
                        '<button aria-label="Apply promo">Place order</button>'
                    ),
                ],
                '/checkout'
            )
        ).toBe(undefined);
        expect(
            classifyIntentControl(
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
            classifyIntentControl(
                [root.firstElementChild, root, host],
                '/checkout'
            )
        ).toBe('commit');
        host.setAttribute('data-core-type', 'plugin');
        expect(
            classifyIntentControl(
                [root.firstElementChild, root, host],
                '/checkout'
            )
        ).toBeUndefined();
        expect(
            classifyIntentControl(
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
            classifyIntentControl(
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
    it('accepts only visible exact HTTPS frame hosts', () => {
        const frame = control(
            '<iframe src="https://www.paypal.com/frame"></iframe>'
        );
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });
        expect(classifyIntentFrame(frame, window)).toBe('frame');
        frame.setAttribute('src', 'https://www.paypal.com.example.test/frame');
        expect(classifyIntentFrame(frame, window)).toBeUndefined();
        frame.setAttribute('src', 'http://www.paypal.com/frame');
        expect(classifyIntentFrame(frame, window)).toBeUndefined();
    });

    describe('describeButtonClick', () => {
        it.each([
            ['Add to cart', '/p/shoe', 'add_to_cart'],
            ['Add to bag - $19.99', '/p/shoe', 'add_to_cart'],
            ['In den Warenkorb', '/p/schuh', 'add_to_cart'],
            ['Ajouter au panier', '/p/chaussure', 'add_to_cart'],
            ['カートに入れる', '/p/kutsu', 'add_to_cart'],
            ['Remove from cart', '/p/shoe', 'remove_from_cart'],
            ['Remove', '/cart', 'remove_from_cart'],
            ['Supprimer', '/panier', 'remove_from_cart'],
            ['Place order', '/checkout', 'commit'],
            ['Checkout', '/cart', 'checkout_step'],
        ])('reads "%s" on %s as %s', (text, pathname, intent) => {
            expect(
                describeButtonClick([control(`<button>${text}</button>`)], pathname)
            ).toEqual(expect.objectContaining({ intent, element: 'button' }));
        });

        it('only counts a bare remove on a cart page', () => {
            expect(
                describeButtonClick([control('<button>Remove</button>')], '/account')
            ).toEqual({ intent: undefined, label: 'remove', element: 'button' });
        });

        it('describes a generic button with its masked label', () => {
            expect(
                describeButtonClick(
                    [control('<button aria-label="Size 10 US">10</button>')],
                    '/p/shoe'
                )
            ).toEqual({ intent: undefined, label: 'size # us', element: 'button' });
        });

        it('captures a link only when it carries an intent', () => {
            expect(
                describeButtonClick([control('<a href="/help">Help</a>')], '/')
            ).toBeUndefined();
            expect(
                describeButtonClick([control('<a href="/cart/add">Add to cart</a>')], '/p/shoe')
            ).toEqual({ intent: 'add_to_cart', label: 'add to cart', element: 'link' });
        });

        it('tells inputs, role buttons and wallet buttons apart', () => {
            expect(
                describeButtonClick([control('<input type="submit" value="Search">')], '/')
            ).toEqual({ intent: undefined, label: 'search', element: 'input' });
            expect(
                describeButtonClick([control('<div role="button">Menu</div>')], '/')
            ).toEqual({ intent: undefined, label: 'menu', element: 'role' });
            expect(
                describeButtonClick([control('<apple-pay-button></apple-pay-button>')], '/checkout')
            ).toEqual({ intent: 'wallet', label: undefined, element: 'wallet' });
        });

        it('skips disabled controls, data-mp-no-track and Rokt elements', () => {
            expect(
                describeButtonClick([control('<button disabled>Add to cart</button>')], '/')
            ).toBeUndefined();
            expect(
                describeButtonClick([control('<button aria-disabled="true">Add to cart</button>')], '/')
            ).toBeUndefined();
            const wrapped = control(
                '<div data-mp-no-track><button>Add to cart</button></div>'
            );
            expect(
                describeButtonClick([wrapped.firstElementChild], '/')
            ).toBeUndefined();
            expect(
                classifyIntentControl([control('<div data-mp-no-track><button>Place order</button></div>').firstElementChild], '/checkout')
            ).toBeUndefined();
            const rokt = control('<div data-core-type="x"><button>Add to cart</button></div>');
            expect(
                describeButtonClick([rokt.firstElementChild, rokt], '/')
            ).toBeUndefined();
        });

        it('honours data-mp-no-track on a clicked child and across a shadow root', () => {
            const marked = control(
                '<button>Add to cart <span data-mp-no-track>x</span></button>'
            );
            expect(
                describeButtonClick([marked.querySelector('span'), marked], '/')
            ).toBeUndefined();
            expect(describeButtonClick([marked], '/')).toEqual({
                intent: undefined,
                label: undefined,
                element: 'button',
            });

            const host = document.createElement('div');
            host.setAttribute('data-mp-no-track', '');
            document.body.appendChild(host);
            const shadowButton = document.createElement('button');
            shadowButton.textContent = 'Add to cart';
            host.attachShadow({ mode: 'open' }).appendChild(shadowButton);
            expect(describeButtonClick([shadowButton], '/')).toBeUndefined();
            host.remove();
        });

        it('never reads a form field inside the control', () => {
            expect(
                describeButtonClick(
                    [control('<button>Apply <input value="jane@example.com"></button>')],
                    '/'
                )
            ).toEqual({ intent: undefined, label: undefined, element: 'button' });
        });
    });

    describe('maskLabel', () => {
        it.each([
            ['Pay $84.20', 'pay $#'],
            ['  Size   10 ', 'size #'],
            ['Buy 2 for 1.234,50 €', 'buy # for # €'],
            ['ＳＡＶＥ ２０％', 'ｓａｖｅ #％'],
            ['ادفع ٨٤٫٢٠', 'ادفع #'],
        ])('masks "%s" as "%s"', (raw, masked) => {
            expect(maskLabel(raw)).toBe(masked);
        });

        it.each([
            ['an email', 'Send to jane@example.com'],
            ['a phone number', 'Call 555-123-4567'],
            ['a card number', 'Card 4111 1111 1111 1111'],
            ['an Arabic-Indic phone number', 'اتصل ٠١٢٣٤٥٦٧٨٩'],
            ['a Devanagari phone number', 'कॉल ९८७६५४३२१०'],
            ['an order number', 'Track order 12345678'],
            ['an empty label', '   '],
            ['a sentence over 128 characters', 'a'.repeat(129)],
        ])('drops %s', (_, raw) => {
            expect(maskLabel(raw)).toBeUndefined();
        });

        it('caps the label at 64 characters', () => {
            expect(maskLabel('b'.repeat(100))).toHaveLength(64);
        });
    });
});
