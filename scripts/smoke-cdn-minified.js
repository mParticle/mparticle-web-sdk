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
    return { results, kitName: registered && registered.name };
}

// The Rokt kit's guest checkout, which the calls above never reach: its pre-selection entry reads the email
// a shopper types and sends it once the field changes or, with checkout intent on, on the confirm click.
const CHECKOUT_PATHNAME = '/checkout';
const CHECKOUT_IDENTIFIER = 'smoke-confirmation';
const SHOPPER_EMAIL = 'shopper@example.com';
const CHECKOUT_PAGE =
    '<!doctype html><html><body><input type="text" id="email">' +
    '<input type="text" id="recipient"><button type="button">Place order</button></body></html>';
const CHECKOUT_SETTINGS = {
    accountId: '1',
    preselectionConfig: JSON.stringify({
        schemaVersion: 1,
        entries: [
            {
                pathname: CHECKOUT_PATHNAME,
                targetPageIdentifier: CHECKOUT_IDENTIFIER,
                attributeKeys: ['email'],
                identityKeys: ['email'],
                readEmailInput: true,
            },
        ],
    }),
};
const WAIT_MS = 2000;

async function until(check) {
    const deadline = Date.now() + WAIT_MS;
    while (!check() && Date.now() < deadline) {
        await settle(10);
    }
    return check();
}

// Returns what the copy got wrong; an empty list means the checkout went as a browser runs it.
async function checkoutMisses(core, kit, withCheckoutIntent) {
    const { JSDOM, VirtualConsole } = require('jsdom');
    const calls = [];
    const misses = [];
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('error', () => misses.push('console.error'));
    const dom = new JSDOM(CHECKOUT_PAGE, {
        runScripts: 'outside-only',
        url: `https://example.com${CHECKOUT_PATHNAME}`,
        pretendToBeVisual: true,
        virtualConsole,
        beforeParse(window) {
            // Identify is answered so the core initializes the kit; every other request goes unanswered.
            window.XMLHttpRequest = class {
                open(method, url) {
                    this.url = url;
                }
                send() {
                    if (/\/identify$/.test(this.url)) {
                        setTimeout(() => {
                            this.readyState = 4;
                            this.status = 200;
                            this.responseText = '{"mpid":"1"}';
                            this.onreadystatechange();
                        }, 0);
                    }
                }
                setRequestHeader() {}
                getResponseHeader() {
                    return null;
                }
                abort() {}
            };
            window.navigator.sendBeacon = () => true;
            window.WebSocket = class {
                send() {}
                close() {}
            };
            const selection = {
                close() {},
                on: () => ({ subscribe() {} }),
                getPlacements: () => Promise.resolve([]),
            };
            const launcher = {
                enablePreselection: true,
                selectPlacements: options => {
                    calls.push(options);
                    return Promise.resolve(selection);
                },
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
    const document = window.document;
    const name = error => (error && error.name) || 'Error';
    window.addEventListener('error', event =>
        misses.push(`uncaught ${name(event.error)}`)
    );
    const onRejection = reason => misses.push(`unhandled ${name(reason)}`);
    process.on('unhandledRejection', onRejection);

    // jsdom marks every dispatched event untrusted. This one stays trusted for its one dispatch, as a
    // shopper's typing or click does; dispatching it again would make it untrusted, as in a browser.
    const dispatchAsShopper = (target, event) => {
        const impl = Object.getOwnPropertySymbols(event).find(
            symbol => symbol.description === 'impl'
        );
        let trusted = true;
        Object.defineProperty(event[impl], 'isTrusted', {
            get: () => trusted,
            set() {},
        });
        target.dispatchEvent(event);
        if (event.isTrusted !== true) {
            misses.push(`${event.type} was not trusted`);
        }
        trusted = false;
    };
    const typeInto = (input, value, commit) => {
        input.value = value;
        dispatchAsShopper(input, new window.Event('input', { bubbles: true }));
        if (commit) {
            dispatchAsShopper(
                input,
                new window.Event('change', { bubbles: true })
            );
        }
    };
    const sent = expectedTrigger =>
        calls.length === 1 &&
        calls[0].preselect === true &&
        calls[0].identifier === CHECKOUT_IDENTIFIER &&
        calls[0].attributes.email === SHOPPER_EMAIL &&
        calls[0].attributes['rokt.preselecttrigger'] === expectedTrigger;

    try {
        window.eval(core);
        window.eval(kit);
        window.mParticle.init('smoke-test-key', {
            isDevelopmentMode: true,
            requestConfig: false,
            flags: withCheckoutIntent ? { autoButtonTracking: 'True' } : {},
            kitConfigs: [
                {
                    ...kitConfig({ name: 'Rokt', getId: () => 181 }),
                    // The core starts a kit only when its debug flag matches the workspace mode.
                    isDebug: true,
                    settings: CHECKOUT_SETTINGS,
                },
            ],
        });
        if (!(await until(() => window.Rokt.currentLauncher))) {
            misses.push('kit never attached');
            return misses;
        }
        window.mParticle.logPageView();

        // The shopper starts typing a second email, then a script rewrites it and announces the change.
        const recipient = document.getElementById('recipient');
        typeInto(recipient, 'recipient@example.com', false);
        recipient.value = 'script@example.com';
        recipient.dispatchEvent(new window.Event('change', { bubbles: true }));
        await settle(SETTLE_MS);
        if (calls.length > 0) {
            misses.push("sent on a script's change");
        }
        typeInto(document.getElementById('email'), SHOPPER_EMAIL, true);

        if (withCheckoutIntent) {
            await settle(SETTLE_MS);
            if (calls.length > 0) {
                misses.push('sent before the confirm click');
            }
            dispatchAsShopper(
                document.querySelector('button'),
                new window.MouseEvent('click', { bubbles: true })
            );
        }
        // Sent with the typed email only if the script's change dropped the second field.
        const trigger = withCheckoutIntent ? 'intent_commit' : 'pageview';
        if (!(await until(() => sent(`${trigger}|${CHECKOUT_PATHNAME}`)))) {
            misses.push(`no ${trigger} call with the typed email`);
        }
        await settle(SETTLE_MS);
    } catch (error) {
        misses.push(`threw ${name(error)}`);
    } finally {
        process.off('unhandledRejection', onRejection);
        window.close();
    }
    return misses;
}

async function roktCheckoutMisses(copy) {
    const typed = await checkoutMisses(copy.core, copy.kit, false);
    const clicked = await checkoutMisses(copy.core, copy.kit, true);
    const misses = typed
        .map(miss => `typed email: ${miss}`)
        .concat(clicked.map(miss => `confirm click: ${miss}`));
    return Array.from(new Set(misses));
}

async function smokeTest(original, minified) {
    const before = await outcomes(original.core, original.kit);
    const after = await outcomes(minified.core, minified.kit);
    const remaining = before.results.slice();
    const errors = after.results.filter(outcome => {
        const index = remaining.indexOf(outcome);
        if (index === -1) {
            return true;
        }
        remaining.splice(index, 1);
        return false;
    });
    const result = {
        errors,
        loadOnly: before.results.includes('kit: not registered'),
    };
    if (before.kitName === 'Rokt') {
        // A miss on the built copy means the scenario no longer matches the kit, which would leave
        // the minified copy's run proving nothing, so it fails the check as well.
        const built = await roktCheckoutMisses(original);
        const shipped = await roktCheckoutMisses(minified);
        errors.push(...shipped.filter(miss => !built.includes(miss)));
        result.checkoutMissesBeforeMinification = built;
    }
    return result;
}

module.exports = { smokeTest };
