import { expect } from 'chai';
import { describeButtonClick } from '../../src/buttonTracking/buttonDescription';

// jsdom computes styles only in part, so these run where the browser does.
describe('button description in a browser', () => {
    let root: HTMLDivElement;

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
        ).to.equal('close');
    });

    it('reads an SVG title', () => {
        expect(labelOf('<button><svg><title>Remove item</title></svg></button>')).to.equal('remove item');
    });

    it('leaves out text a stylesheet hides', () => {
        expect(
            labelOf(
                '<style>.mp-test-secret { display: none } .mp-test-ghost { visibility: hidden }</style>' +
                    '<button>Save <span class="mp-test-secret">Jane</span> <span class="mp-test-ghost">Doe</span></button>'
            )
        ).to.equal('save');
    });

    it('leaves out an aria-labelledby reference inside a container a stylesheet hides', () => {
        expect(
            labelOf(
                '<style>.mp-test-secret { display: none }</style>' +
                    '<button aria-labelledby="mp-test-ref">Save</button>' +
                    '<div class="mp-test-secret"><span id="mp-test-ref">Jane Doe</span></div>'
            )
        ).to.equal('save');
    });

    it('leaves out SVG text a stylesheet hides', () => {
        expect(
            labelOf(
                '<style>.mp-test-secret { display: none } .mp-test-ghost { visibility: hidden }</style>' +
                    '<button>Save <svg class="mp-test-secret"><text>Jane</text></svg>' +
                    '<svg><text class="mp-test-ghost">Doe</text></svg></button>'
            )
        ).to.equal('save');
    });

    it('never names a button from an image a stylesheet hides', () => {
        expect(
            labelOf(
                '<style>.mp-test-secret { display: none }</style>' +
                    '<button><img class="mp-test-secret" alt="Jane Doe"></button>'
            )
        ).to.equal(undefined);
    });

    it('leaves out text a shadow host shows through a slot its stylesheet hides, and reads a shown one', () => {
        const labelThroughSlot = (shadow: string) => {
            root.innerHTML = '<button>Save <span id="mp-test-host"><span slot="name">Draft</span></span></button>';
            root.querySelector('#mp-test-host').attachShadow({ mode: 'open' }).innerHTML = shadow;
            return describeButtonClick(root.querySelector('button')).label;
        };

        expect(labelThroughSlot('<style>slot { display: none }</style><slot name="name"></slot>')).to.equal('save');
        expect(labelThroughSlot('<slot name="name"></slot>')).to.equal('save draft');
    });
});
