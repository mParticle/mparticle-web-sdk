import { expect } from 'chai';
import { describeButtonClick } from '../../src/buttonTracking/buttonDescription';
import { maskLabel } from '../../src/buttonTracking/labelMasking';

// jsdom computes styles only in part, so these run where the browser does.
describe('button description in a browser', () => {
    let root: HTMLDivElement;

    // Browsers without Unicode property escapes send no labels at all.
    const sendsLabels = maskLabel('label') !== undefined;
    const expectedLabel = (label: string) => (sendsLabels ? label : undefined);

    const labelOf = (html: string) => {
        root.innerHTML = html;
        const click = describeButtonClick(root.querySelector('button, input'));
        return click ? click.label : undefined;
    };

    beforeEach(() => {
        root = document.createElement('div');
        document.body.appendChild(root);
    });

    afterEach(() => {
        root.remove();
    });

    it('reads screen-reader-only text', () => {
        expect(
            labelOf(
                '<button><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)">Close</span></button>'
            )
        ).to.equal(expectedLabel('close'));
    });

    it('reads an SVG title', () => {
        expect(labelOf('<button><svg><title>Remove item</title></svg></button>')).to.equal(
            expectedLabel('remove item')
        );
    });

    it('leaves out text a stylesheet hides', () => {
        expect(
            labelOf(
                '<style>.mp-test-secret { display: none } .mp-test-ghost { visibility: hidden }</style>' +
                    '<button>Save <span class="mp-test-secret">Jane</span> <span class="mp-test-ghost">Doe</span></button>'
            )
        ).to.equal(expectedLabel('save'));
    });

    it('leaves out an aria-labelledby reference inside a container a stylesheet hides', () => {
        expect(
            labelOf(
                '<style>.mp-test-secret { display: none }</style>' +
                    '<button aria-labelledby="mp-test-ref">Save</button>' +
                    '<div class="mp-test-secret"><span id="mp-test-ref">Jane Doe</span></div>'
            )
        ).to.equal(expectedLabel('save'));
    });

    it('leaves out SVG text a stylesheet hides', () => {
        expect(
            labelOf(
                '<style>.mp-test-secret { display: none } .mp-test-ghost { visibility: hidden }</style>' +
                    '<button>Save <svg class="mp-test-secret"><text>Jane</text></svg>' +
                    '<svg><text class="mp-test-ghost">Doe</text></svg></button>'
            )
        ).to.equal(expectedLabel('save'));
    });

    it('never names a button from an image a stylesheet hides', () => {
        expect(
            labelOf(
                '<style>.mp-test-secret { display: none }</style>' +
                    '<button><img class="mp-test-secret" alt="Jane Doe"></button>'
            )
        ).to.equal(undefined);
    });

    it('reads text that sets visibility back to visible inside a container a stylesheet hides', () => {
        expect(
            labelOf(
                '<style>.mp-test-ghost { visibility: hidden } .mp-test-ghost b { visibility: visible }</style>' +
                    '<button class="mp-test-ghost">Jane Doe <b>Place order</b></button>'
            )
        ).to.equal(expectedLabel('place order'));
    });

    it('leaves out text a shadow host shows through a slot its stylesheet hides, and reads a shown one', function(this: Mocha.Context) {
        if (typeof root.attachShadow !== 'function') {
            this.skip();
        }

        const labelThroughSlot = (shadow: string) => {
            root.innerHTML = '<button>Save <span id="mp-test-host"><span slot="name">Draft</span></span></button>';
            root.querySelector('#mp-test-host').attachShadow({ mode: 'open' }).innerHTML = shadow;
            return describeButtonClick(root.querySelector('button')).label;
        };

        expect(labelThroughSlot('<style>slot { display: none }</style><slot name="name"></slot>')).to.equal(
            expectedLabel('save')
        );
        expect(labelThroughSlot('<slot name="name"></slot>')).to.equal(expectedLabel('save draft'));
    });

    describe('with shadow DOM', () => {
        beforeEach(function(this: Mocha.Context) {
            if (typeof root.attachShadow !== 'function') {
                this.skip();
            }
        });

        const labelWithShadow = (html: string, shadow: string) => {
            root.innerHTML = html;
            root.querySelector('#mp-test-host').attachShadow({ mode: 'open' }).innerHTML = shadow;
            const button = root.querySelector('#mp-test-host').shadowRoot.querySelector('button') || root.querySelector('button');
            return describeButtonClick(button).label;
        };

        it('leaves out text whose slot is the fallback of a slot that shows assigned nodes instead', () => {
            expect(
                labelWithShadow(
                    '<button>Save <span id="mp-test-host"><span slot="name">Jane Doe</span><span slot="outer">Draft</span></span></button>',
                    '<slot name="outer"><slot name="name"></slot></slot>'
                )
            ).to.equal(expectedLabel('save draft'));
        });

        it('never names a button from an aria-labelledby reference that no slot shows', () => {
            expect(
                labelWithShadow(
                    '<button aria-labelledby="mp-test-ref">Save</button><span id="mp-test-host"><span id="mp-test-ref" slot="name">Jane Doe</span></span>',
                    '<slot></slot>'
                )
            ).to.equal(expectedLabel('save'));
        });

        it('never names a button from an image that no slot shows', () => {
            expect(
                labelWithShadow(
                    '<button><span id="mp-test-host"><img alt="Jane Doe" slot="name"></span></button>',
                    '<slot></slot>'
                )
            ).to.equal(undefined);
        });

        it('reads what is assigned to a slot in a button inside a shadow root, never the fallback', () => {
            expect(
                labelWithShadow('<div id="mp-test-host">Place order</div>', '<button><slot>Jane Doe</slot></button>')
            ).to.equal(expectedLabel('place order'));
            expect(labelWithShadow('<div id="mp-test-host"></div>', '<button><slot>Checkout</slot></button>')).to.equal(
                expectedLabel('checkout')
            );
        });
    });
});
