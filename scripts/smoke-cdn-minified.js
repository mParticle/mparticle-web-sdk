/* eslint-env node, es2021 */

// Runs a bundle and its CDN-minified copy through the same calls and reports
// error types only the minified copy produces. Messages are not compared,
// because minification renames the identifiers they quote.

const SETTLE_MS = 200;

const KIT_CALLS = [
    [
        'process',
        [
            {
                EventName: 'smoke',
                EventDataType: 4,
                EventCategory: 1,
                EventAttributes: {},
            },
        ],
    ],
    ['setUserIdentity', ['smoke-id', 1]],
    ['onUserIdentified', [null]],
    ['setUserAttribute', ['smoke', 'value']],
    ['removeUserAttribute', ['smoke']],
    ['selectPlacements', [{ identifier: 'smoke', attributes: {} }]],
];

async function outcomes(core, kit) {
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
        runScripts: 'outside-only',
        url: 'https://example.com/',
        pretendToBeVisual: true,
        beforeParse(window) {
            // Offline and silent, so both runs see the same thing.
            window.XMLHttpRequest = class {
                open() {}
                send() {}
                setRequestHeader() {}
                abort() {}
            };
            window.navigator.sendBeacon = () => true;
            window.WebSocket = class {
                send() {}
                close() {}
            };
        },
    });
    const window = dom.window;
    const results = [];
    const record = (step, error) =>
        results.push(`${step}: ${(error && error.name) || 'Error'}`);
    window.addEventListener('error', event => record('async', event.error));
    window.addEventListener('unhandledrejection', event =>
        record('async', event.reason)
    );
    const step = (name, run) => {
        try {
            const result = run();
            if (result && typeof result.then === 'function') {
                result.catch(error => record(name, error));
            }
        } catch (error) {
            record(name, error);
        }
    };

    step('core', () => window.eval(core));
    step('init', () =>
        window.mParticle.init('smoke-test-key', { isDevelopmentMode: true })
    );
    step('logEvent', () => window.mParticle.logEvent('smoke'));

    if (kit) {
        let forwarder;
        const addForwarder = window.mParticle && window.mParticle.addForwarder;
        if (window.mParticle) {
            window.mParticle.addForwarder = registered => {
                forwarder = registered;
                if (addForwarder) {
                    step('addForwarder', () =>
                        addForwarder.call(window.mParticle, registered)
                    );
                }
            };
        }
        step('kit', () => window.eval(kit));
        if (!forwarder) {
            results.push('kit: not registered');
        } else {
            let instance;
            step('construct', () => {
                instance = new forwarder.constructor();
            });
            if (instance) {
                step('kit init', () => instance.init({}, () => {}, true));
                for (const [method, args] of KIT_CALLS) {
                    if (typeof instance[method] === 'function') {
                        step(method, () => instance[method](...args));
                    }
                }
            }
        }
    }

    await new Promise(resolve => setTimeout(resolve, SETTLE_MS));
    window.close();
    return results;
}

async function minifiedOnlyErrors(original, minified) {
    const before = await outcomes(original.core, original.kit);
    const after = await outcomes(minified.core, minified.kit);
    const remaining = before.slice();
    return after.filter(outcome => {
        const index = remaining.indexOf(outcome);
        if (index === -1) {
            return true;
        }
        remaining.splice(index, 1);
        return false;
    });
}

module.exports = { minifiedOnlyErrors };
