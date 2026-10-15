import { TextDecoder, TextEncoder } from 'util';

// jsdom needs these, and the jsdom test environment does not provide them.
Object.assign(globalThis, { TextEncoder, TextDecoder });

const { minifiedOnlyErrors } = require('../../scripts/smoke-cdn-minified');

describe('minifiedOnlyErrors', () => {
    const core =
        'window.mParticle={init:function(){},logEvent:function(){},addForwarder:function(){}};';
    const kit = (body: string) =>
        `(function(){${body}window.mParticle.addForwarder({name:'smoke',constructor:function(){this.init=function(){};this.process=function(){return K;};}});})();`;

    it('reports an error type only the minified kit throws', async () => {
        const errors = await minifiedOnlyErrors(
            { core, kit: kit('var K=1;') },
            { core, kit: kit('') }
        );

        expect(errors).toEqual(['process: ReferenceError']);
    });

    it('ignores errors both copies throw', async () => {
        const errors = await minifiedOnlyErrors(
            { core, kit: kit('') },
            { core, kit: kit('') }
        );

        expect(errors).toEqual([]);
    });

    it('reports a kit the minified copy no longer registers', async () => {
        const errors = await minifiedOnlyErrors(
            { core, kit: kit('var K=1;') },
            { core, kit: 'window.notAKit=1;' }
        );

        expect(errors).toEqual(['kit: not registered']);
    });
});
