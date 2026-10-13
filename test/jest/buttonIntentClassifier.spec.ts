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

        it('keeps only letters and hyphens in icon names', () => {
            expect(describe1('<button><svg><use href="#u123"></use></svg></button>')).toEqual(
                expect.objectContaining({ icon: undefined })
            );
            expect(describe1('<button><i class="fa fa-2x"></i></button>')).toEqual(
                expect.objectContaining({ icon: undefined })
            );
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
            ['a Gujarati phone number', 'કૉલ ૯૮૭૬૫૪૩૨૧૦'],
            ['a Tamil phone number', 'அழை ௯௮௭௬௫௪௩௨௧௦'],
            ['an order number', 'Track order 12345678'],
            ['an empty label', '   '],
            ['a sentence over 128 characters', 'a'.repeat(129)],
        ])('drops %s', (_, raw) => {
            expect(maskLabel(raw)).toBeUndefined();
        });

        it('sends no labels where Unicode property escapes are unsupported', () => {
            const NativeRegExp = RegExp;
            const NoUnicodeRegExp = function(
                pattern: string | RegExp,
                flags?: string
            ) {
                if (flags && flags.indexOf('u') !== -1) {
                    throw new SyntaxError('Invalid regular expression flags');
                }
                return new NativeRegExp(pattern, flags);
            } as unknown as RegExpConstructor;
            (global as any).RegExp = NoUnicodeRegExp;
            try {
                jest.isolateModules(() => {
                    const legacy = require('../../src/buttonIntentClassifier');
                    expect(legacy.maskLabel('Add to cart')).toBeUndefined();
                    expect(legacy.maskLabel('ఫోన్ ౯౮౭౬౫౪౩౨౧౦')).toBeUndefined();
                });
            } finally {
                (global as any).RegExp = NativeRegExp;
            }
        });

        it('drops Telugu and Kannada digit runs', () => {
            expect(maskLabel('ఫోన్ ౯౮౭౬౫౪౩౨౧౦')).toBeUndefined();
            expect(maskLabel('ಕರೆ ೯೮೭೬೫೪೩೨೧೦')).toBeUndefined();
        });

        it('caps the label at 64 characters', () => {
            expect(maskLabel('b'.repeat(100))).toHaveLength(64);
        });
    });
});
