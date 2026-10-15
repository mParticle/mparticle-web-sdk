/* eslint-env node, es2021 */

// Runs a bundle and its CDN-minified copy through the same calls and reports
// error types only the minified copy produces. Messages are not compared,
// because minification renames the identifiers they quote.

const SETTLE_MS = 200;
const ATTACH_MS = 50;

const settle = ms => new Promise(resolve => setTimeout(resolve, ms));

const SETTINGS = { accountId: '1' };
const SMOKE_USER = {
    getMPID: () => '1',
    getAllUserAttributes: () => ({}),
    getUserIdentities: () => ({ userIdentities: {} }),
    getConsentState: () => null,
};
const NO_FILTERS = [];

function kitConfig(registered) {
    return {
        name: registered.name,
        suffix: registered.suffix,
        moduleId:
            typeof registered.getId === 'function' ? registered.getId() : 0,
        isDebug: false,
        isVisible: true,
        isDebugString: 'false',
        hasDebugString: 'false',
        settings: SETTINGS,
        eventSubscriptionId: 1,
        excludeAnonymousUser: false,
        eventTypeFilters: NO_FILTERS,
        eventNameFilters: NO_FILTERS,
        screenNameFilters: NO_FILTERS,
        screenAttributeFilters: NO_FILTERS,
        userIdentityFilters: NO_FILTERS,
        userAttributeFilters: NO_FILTERS,
        attributeFilters: NO_FILTERS,
    };
}

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
    ['onUserIdentified', [SMOKE_USER]],
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
            // A ready launcher lets the Rokt kit take its production path.
            const selection = {
                close() {},
                on: () => ({ subscribe() {} }),
                getPlacements: () => Promise.resolve([]),
            };
            const launcher = {
                selectPlacements: () => Promise.resolve(selection),
                hashAttributes: () => Promise.resolve({}),
                use: () => Promise.resolve({}),
                terminate() {},
            };
            window.Rokt = {
                createLauncher: () => Promise.resolve(launcher),
                createLocalLauncher: () => launcher,
                setExtensionData() {},
            };
        },
    });
    const window = dom.window;
    const results = [];
    const record = (step, error) =>
        results.push(`${step}: ${(error && error.name) || 'Error'}`);
    window.addEventListener('error', event => record('async', event.error));
    const onRejection = reason => record('async', reason);
    process.on('unhandledRejection', onRejection);
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
    let registered;
    if (kit && window.mParticle) {
        const addForwarder = window.mParticle.addForwarder;
        window.mParticle.addForwarder = kitRegistration => {
            registered = kitRegistration;
            step('addForwarder', () =>
                addForwarder.call(window.mParticle, kitRegistration)
            );
        };
        step('kit', () => window.eval(kit));
    }
    step('init', () =>
        window.mParticle.init('smoke-test-key', {
            isDevelopmentMode: true,
            requestConfig: false,
            kitConfigs: registered ? [kitConfig(registered)] : [],
        })
    );
    step('logEvent', () => window.mParticle.logEvent('smoke'));

    if (kit && !registered) {
        results.push('kit: not registered');
    } else if (registered) {
        let instance;
        step('construct', () => {
            instance = new registered.constructor();
        });
        if (instance) {
            step('kit init', () => instance.init(SETTINGS, () => {}, false));
            await settle(ATTACH_MS);
            for (const [method, args] of KIT_CALLS) {
                if (typeof instance[method] === 'function') {
                    step(method, () => instance[method](...args));
                }
            }
        }
    }

    try {
        await settle(SETTLE_MS);
    } finally {
        process.off('unhandledRejection', onRejection);
        window.close();
    }
    return results;
}

async function smokeTest(original, minified) {
    const before = await outcomes(original.core, original.kit);
    const after = await outcomes(minified.core, minified.kit);
    const remaining = before.slice();
    const errors = after.filter(outcome => {
        const index = remaining.indexOf(outcome);
        if (index === -1) {
            return true;
        }
        remaining.splice(index, 1);
        return false;
    });
    return { errors, loadOnly: before.includes('kit: not registered') };
}

module.exports = { smokeTest };
