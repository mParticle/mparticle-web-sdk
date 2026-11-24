import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { TextDecoder, TextEncoder } from 'util';

// jsdom needs these, and the jsdom test environment does not provide them.
Object.assign(globalThis, { TextEncoder, TextDecoder });

const {
    smokeTest,
    main,
    introducedUndeclaredNames,
} = require('../../scripts/smoke-cdn-minified');

describe('introducedUndeclaredNames', () => {
    const original =
        '(function(){const K="k";function f(o){const{[K]:t,...r}=o||{};return[t,r]}window.f=f})();';

    it('reports a name the minifier left undeclared', () => {
        const broken =
            '(function(){function n(n){const{[K]:t,...r}=n||{};return[t,r]}window.f=n})()';

        expect(introducedUndeclaredNames(original, broken)).toEqual(['K']);
    });

    it('passes when every reference was renamed with its declaration', () => {
        const renamed =
            '(function(){const n="k";function t(t){const{[n]:i,...r}=t||{};return[i,r]}window.f=t})()';

        expect(introducedUndeclaredNames(original, renamed)).toEqual([]);
    });

    it('ignores global comments, which the minifier strips', () => {
        const withGlobalComment =
            '/* global Suppressed */\n(function(){return typeof Suppressed=="function"?Suppressed:null})();';
        const stripped =
            '(function(){return typeof Suppressed=="function"?Suppressed:null})()';

        expect(introducedUndeclaredNames(withGlobalComment, stripped)).toEqual([]);
    });

    it('throws when the minified bundle does not parse', () => {
        expect(() => introducedUndeclaredNames(original, '(function(){')).toThrow(
            'does not parse'
        );
    });
});

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

        expect(result).toEqual({
            errors: [],
            loadOnly: true,
            baselineErrors: [],
        });
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

// main reads baselines relative to the working directory, as CI runs it from the folder holding the bundles.
async function mainIn(files: Record<string, string>, bundles: string[]) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mp-smoke-'));
    const cwd = process.cwd();
    try {
        for (const [file, code] of Object.entries(files)) {
            fs.mkdirSync(path.dirname(path.join(dir, file)), {
                recursive: true,
            });
            fs.writeFileSync(path.join(dir, file), code);
        }
        process.chdir(dir);
        return await main(bundles);
    } finally {
        process.chdir(cwd);
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

describe('main baseline requirements', () => {
    const cleanCore =
        'window.mParticle={init:function(){},logEvent:function(){},addForwarder:function(){}};';
    const throwingCore =
        "window.mParticle={init:function(){throw new TypeError('smoke');},logEvent:function(){},addForwarder:function(){}};";

    it('fails when a Rollup bundle has no .unminified baseline', async () => {
        const code = await mainIn(
            { 'CustomKit.iife.js': '(function(){window.x=1;})();' },
            ['CustomKit.iife.js']
        );

        expect(code).toBe(1);
    });

    it('accepts a Vite bundle without an .unminified baseline', async () => {
        const code = await mainIn(
            { 'RoktPayPlus-Kit.iife.js': '(function(){window.x=1;})();' },
            ['RoktPayPlus-Kit.iife.js']
        );

        expect(code).toBe(0);
    });

    it('fails when a baseline has no minified bundle in the run', async () => {
        const code = await mainIn(
            {
                'dist/mparticle.js': cleanCore,
                'dist/mparticle.js.unminified': cleanCore,
                'kits/smoke/dist/SmokeKit.iife.js.unminified':
                    '(function(){window.x=1;})();',
            },
            ['dist/mparticle.js']
        );

        expect(code).toBe(1);
    });

    it('passes a core that runs cleanly before and after minification', async () => {
        const code = await mainIn(
            {
                'dist/mparticle.js': cleanCore,
                'dist/mparticle.js.unminified': cleanCore,
            },
            ['dist/mparticle.js']
        );

        expect(code).toBe(0);
    });

    it('fails when the core throws the same way before and after minification', async () => {
        const code = await mainIn(
            {
                'dist/mparticle.js': throwingCore,
                'dist/mparticle.js.unminified': throwingCore,
            },
            ['dist/mparticle.js']
        );

        expect(code).toBe(1);
    });
});
