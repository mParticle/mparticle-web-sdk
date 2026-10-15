import { TextDecoder, TextEncoder } from 'util';

// jsdom needs these, and the jsdom test environment does not provide them.
Object.assign(globalThis, { TextEncoder, TextDecoder });

const { smokeTest } = require('../../scripts/smoke-cdn-minified');

describe('smokeTest', () => {
    const core =
        'window.mParticle={init:function(){},logEvent:function(){},addForwarder:function(){}};';
    const kit = (body: string) =>
        `(function(){${body}window.mParticle.addForwarder({name:'smoke',constructor:function(){this.init=function(){};this.process=function(){return K;};}});})();`;

    it('reports an error type only the minified kit throws', async () => {
        const { errors } = await smokeTest(
            { core, kit: kit('var K=1;') },
            { core, kit: kit('') }
        );

        expect(errors).toEqual(['process: ReferenceError']);
    });

    it('ignores errors both copies throw', async () => {
        const { errors } = await smokeTest(
            { core, kit: kit('') },
            { core, kit: kit('') }
        );

        expect(errors).toEqual([]);
    });

    it('marks a bundle that never registers as load only', async () => {
        const result = await smokeTest(
            { core, kit: 'window.notAKit=1;' },
            { core, kit: 'window.notAKit=1;' }
        );

        expect(result).toEqual({ errors: [], loadOnly: true });
    });

    it('reports a kit the minified copy no longer registers', async () => {
        const { errors } = await smokeTest(
            { core, kit: kit('var K=1;') },
            { core, kit: 'window.notAKit=1;' }
        );

        expect(errors).toEqual(['kit: not registered']);
    });

    it('fails the Rokt checkout scenario when the built copy misses it too', async () => {
        const coreWithoutInit = 'window.mParticle={addForwarder:function(){}};';
        const rokt =
            "window.mParticle.addForwarder({name:'Rokt',constructor:function(){this.init=function(){};}});";

        const result = await smokeTest(
            { core: coreWithoutInit, kit: rokt },
            { core: coreWithoutInit, kit: rokt }
        );

        expect(result.errors).toEqual([]);
        expect(result.checkoutMissesBeforeMinification).toEqual([
            'typed email: threw TypeError',
            'confirm click: threw TypeError',
        ]);
    });

    it('reports a checkout call the minified copy sends twice', async () => {
        // Stand-ins for the core and the Rokt kit that send the pre-selection call as the real ones do.
        const checkoutCore =
            'window.mParticle={addForwarder:function(){},logPageView:function(){},init:function(key,config){' +
            'window.intent=!!(config.flags&&config.flags.autoButtonTracking);' +
            'window.Rokt.createLauncher().then(function(launcher){window.Rokt.currentLauncher=launcher;});}};';
        const checkoutKit = (sends: number) =>
            "window.mParticle.addForwarder({name:'Rokt',constructor:function(){this.init=function(){};}});" +
            "function send(trigger){var email=document.getElementById('email').value;" +
            `for(var i=0;i<${sends};i++)setTimeout(function(){window.Rokt.currentLauncher.selectPlacements(` +
            "{preselect:true,identifier:'smoke-confirmation',attributes:{email:email,'rokt.preselecttrigger':trigger+'|/checkout'}});},i*50);}" +
            "document.addEventListener('change',function(e){if(e.isTrusted&&e.target.id==='email'&&!window.intent)send('pageview');});" +
            "document.addEventListener('click',function(e){if(e.isTrusted&&window.intent)send('intent_commit');});";

        const result = await smokeTest(
            { core: checkoutCore, kit: checkoutKit(1) },
            { core: checkoutCore, kit: checkoutKit(2) }
        );

        expect(result.checkoutMissesBeforeMinification).toEqual([]);
        expect(result.errors).toEqual([
            'typed email: no single pageview call with the typed email',
            'confirm click: no single intent_commit call with the typed email',
        ]);
    }, 15000);
});
