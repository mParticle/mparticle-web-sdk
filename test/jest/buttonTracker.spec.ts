import {
    AUTO_BUTTON_ATTRIBUTE,
    AUTO_BUTTON_FLAG,
    ButtonTracker,
    getActiveButtonTracker,
    resetButtonTracking,
    WIN_BTN_KEY,
} from '../../src/buttonTracker';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import RoktManager, { IRoktKit } from '../../src/roktManager';
import { IKitConfigs } from '../../src/configAPIClient';
import { IMParticleUser } from '../../src/identity-user-interfaces';
import { SDKIdentityApi } from '../../src/identity.interfaces';
import { IStore } from '../../src/store';

type Listener = (event: unknown) => void;

describe('ButtonTracker', () => {
    let notify: jest.Mock;
    let logEvent: jest.Mock;
    let resetSessionTimer: jest.Mock;
    let roktManager: RoktManager;
    let store: {
        isEnabled: boolean;
        SDKConfig: { flags: Record<string, unknown> };
    };
    let docAdd: jest.SpyInstance;
    let docRemove: jest.SpyInstance;
    let winAdd: jest.SpyInstance;
    let winRemove: jest.SpyInstance;

    const makeInstance = (): IMParticleWebSDKInstance =>
        (({
            _Store: store,
            _RoktManager: roktManager,
            _Events: { logEvent },
            _SessionManager: { resetSessionTimer },
            Logger: { verbose: jest.fn() },
        } as unknown) as IMParticleWebSDKInstance);

    // A real manager, so the privacy gates and delivery are the shipped ones.
    const initManager = (launcherOptions: Record<string, unknown> = {}) => {
        roktManager.init(
            {} as IKitConfigs,
            {} as IMParticleUser,
            ({} as unknown) as SDKIdentityApi,
            (store as unknown) as IStore,
            ({ verbose: jest.fn(), error: jest.fn() } as unknown) as any,
            { launcherOptions }
        );
    };

    const listener = (spy: jest.SpyInstance, type: string): Listener => {
        const calls = spy.mock.calls.filter(call => call[0] === type);
        return calls[calls.length - 1][1];
    };

    const button = (text: string): HTMLButtonElement => {
        const element = document.createElement('button');
        element.textContent = text;
        document.body.appendChild(element);
        return element;
    };

    // jsdom only dispatches untrusted events, so trusted ones are fed to the
    // registered listener directly.
    const trustedClick = (target: Element) => ({
        type: 'click',
        isTrusted: true,
        target,
        composedPath: () => [target, document.body, document],
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
    });

    const trustedSubmit = (submitter: Element | null) => ({
        type: 'submit',
        isTrusted: true,
        target: document.createElement('form'),
        submitter,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
    });

    const startTracker = (hasRoktKit = true): ButtonTracker => {
        const tracker = new ButtonTracker(makeInstance());
        tracker.init({ hasRoktKit });
        return tracker;
    };

    // The tracker classifies after the next animation frame. After setSystemTime
    // the fake clock's next frame can be up to two frames away.
    const afterPaint = () => jest.advanceTimersByTime(40);

    const click = (target: Element) => {
        listener(docAdd, 'click')(trustedClick(target));
        afterPaint();
    };

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(1000000);
        window.history.replaceState({}, '', '/checkout');
        notify = jest.fn();
        logEvent = jest.fn();
        resetSessionTimer = jest.fn();
        store = {
            isEnabled: true,
            SDKConfig: { flags: { autoButtonTracking: true } },
        };
        roktManager = new RoktManager('checkout-intent-test');
        initManager();
        roktManager.attachKit(({
            filters: {},
            launcher: {},
            onCheckoutIntent: notify,
        } as unknown) as IRoktKit);
        resetButtonTracking();
        docAdd = jest.spyOn(document, 'addEventListener');
        docRemove = jest.spyOn(document, 'removeEventListener');
        winAdd = jest.spyOn(window, 'addEventListener');
        winRemove = jest.spyOn(window, 'removeEventListener');
    });

    afterEach(() => {
        resetButtonTracking();
        jest.restoreAllMocks();
        jest.useRealTimers();
        document.body.innerHTML = '';
        delete (navigator as any).globalPrivacyControl;
    });

    it('attaches capture and passive listeners', () => {
        startTracker();

        expect(docAdd).toHaveBeenCalledWith('click', expect.any(Function), {
            capture: true,
            passive: true,
        });
        expect(docAdd).toHaveBeenCalledWith('submit', expect.any(Function), {
            capture: true,
            passive: true,
        });
        expect(winAdd).toHaveBeenCalledWith('blur', expect.any(Function), {
            passive: true,
        });
        expect(winAdd).toHaveBeenCalledWith('pageshow', expect.any(Function), {
            passive: true,
        });
    });

    it('delivers a frozen signal for a trusted commit click', () => {
        startTracker();

        click(button('Place order'));

        expect(notify).toHaveBeenCalledTimes(1);
        const signal = notify.mock.calls[0][0];
        expect(signal).toEqual({ kind: 'commit', t: 1000000 });
        expect(Object.isFrozen(signal)).toBe(true);
    });

    it('waits for the next paint before classifying, unless the page is hidden', () => {
        startTracker();

        listener(docAdd, 'click')(trustedClick(button('Place order')));
        jest.advanceTimersByTime(0);
        expect(notify).not.toHaveBeenCalled();
        afterPaint();
        expect(notify).toHaveBeenCalledTimes(1);

        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'hidden',
        });
        window.history.replaceState({}, '', '/checkout/review');
        listener(docAdd, 'click')(trustedClick(button('Place order')));
        jest.advanceTimersByTime(0);
        expect(notify).toHaveBeenCalledTimes(2);
        delete (document as any).visibilityState;
    });

    it.each(['pagehide', 'visibilitychange'])(
        'delivers a waiting click when the page is left before the next paint (%s)',
        type => {
            startTracker();
            listener(docAdd, 'click')(trustedClick(button('Place order')));
            expect(logEvent).not.toHaveBeenCalled();

            Object.defineProperty(document, 'visibilityState', {
                configurable: true,
                value: 'hidden',
            });
            if (type === 'pagehide') {
                listener(winAdd, 'pagehide')({ type: 'pagehide' });
            } else {
                listener(docAdd, 'visibilitychange')({ type: 'visibilitychange' });
            }
            delete (document as any).visibilityState;

            expect(logEvent).toHaveBeenCalledTimes(1);
            expect(notify).toHaveBeenCalledWith({ kind: 'commit', t: 1000000 });

            afterPaint();
            expect(logEvent).toHaveBeenCalledTimes(1);
        }
    );

    it('listens for page exit in the capture phase so it runs before the upload', () => {
        startTracker();

        expect(winAdd).toHaveBeenCalledWith('pagehide', expect.any(Function), {
            capture: true,
            passive: true,
        });
        expect(docAdd).toHaveBeenCalledWith(
            'visibilitychange',
            expect.any(Function),
            { capture: true, passive: true }
        );
    });

    it('ignores untrusted events', () => {
        startTracker();

        button('Place order').click();
        afterPaint();

        expect(notify).not.toHaveBeenCalled();
    });

    it('sends the kit nothing for clicks that are not checkout controls', () => {
        startTracker();

        click(button('Add to cart'));

        expect(notify).not.toHaveBeenCalled();
    });

    it('never cancels or stops the event', () => {
        startTracker();
        const event = trustedClick(button('Place order'));

        listener(docAdd, 'click')(event);
        afterPaint();

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(event.stopPropagation).not.toHaveBeenCalled();
    });

    it('throttles one signal per kind per 2 seconds on the same path', () => {
        startTracker();
        const target = button('Place order');

        click(target);
        jest.setSystemTime(1001999);
        click(target);
        expect(notify).toHaveBeenCalledTimes(1);

        jest.setSystemTime(1002000);
        click(target);
        expect(notify).toHaveBeenCalledTimes(2);
    });

    it('does not throttle a different kind or a different path', () => {
        startTracker();

        click(button('Place order'));
        click(button('Checkout'));
        window.history.replaceState({}, '', '/checkout/payment');
        click(button('Place order'));

        expect(notify.mock.calls.map(call => call[0].kind)).toEqual([
            'commit',
            'checkout_step',
            'commit',
        ]);
    });

    it('classifies a submit by its submitter', () => {
        startTracker();

        listener(docAdd, 'submit')(trustedSubmit(button('Pay now')));
        afterPaint();

        expect(notify).toHaveBeenCalledWith({ kind: 'commit', t: 1000000 });
    });

    it('ignores a submit without a submitter when no commit click came first', () => {
        startTracker();

        listener(docAdd, 'submit')(trustedSubmit(null));
        afterPaint();

        expect(notify).not.toHaveBeenCalled();
    });

    // A path change lets the submit through the commit throttle.
    it('counts a submit without a submitter within 1 second of a commit click', () => {
        startTracker();
        click(button('Place order'));
        notify.mockClear();

        window.history.replaceState({}, '', '/checkout/review');
        jest.setSystemTime(1001000);
        listener(docAdd, 'submit')(trustedSubmit(null));
        afterPaint();

        expect(notify).toHaveBeenCalledWith({ kind: 'commit', t: 1001000 });
    });

    it('ignores a submit without a submitter more than 1 second after a commit click', () => {
        startTracker();
        click(button('Place order'));
        notify.mockClear();

        window.history.replaceState({}, '', '/checkout/review');
        jest.setSystemTime(1001001);
        listener(docAdd, 'submit')(trustedSubmit(null));
        afterPaint();

        expect(notify).not.toHaveBeenCalled();
    });

    it('reports focus moving into a hosted wallet frame', () => {
        startTracker();
        const frame = document.createElement('iframe');
        frame.src = 'https://pay.google.com/frame';
        document.body.appendChild(frame);
        jest.spyOn(document, 'activeElement', 'get').mockReturnValue(frame);
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });

        listener(winAdd, 'blur')({ type: 'blur', isTrusted: true });
        afterPaint();

        expect(notify).toHaveBeenCalledWith({ kind: 'frame', t: 1000000 });
    });

    it('reads the focused frame after the blur settles', () => {
        startTracker();
        const frame = document.createElement('iframe');
        frame.src = 'https://pay.google.com/frame';
        document.body.appendChild(frame);
        const active = jest
            .spyOn(document, 'activeElement', 'get')
            .mockReturnValue(document.body);
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });

        listener(winAdd, 'blur')({ type: 'blur', isTrusted: true });
        active.mockReturnValue(frame);
        afterPaint();

        expect(notify).toHaveBeenCalledWith({ kind: 'frame', t: 1000000 });
    });

    describe('privacy gates', () => {
        const kitGates: Array<[string, () => void]> = [
            [
                'a Rokt privacy launcher option is set',
                () => initManager({ doNotShareOrSell: true }),
            ],
            [
                'Global Privacy Control is on',
                () => ((navigator as any).globalPrivacyControl = true),
            ],
            [
                'the flag is off',
                () => (store.SDKConfig.flags.autoButtonTracking = false),
            ],
        ];
        const optOut: [string, () => void] = [
            'the user has opted out',
            () => (store.isEnabled = false),
        ];

        it('does not attach when the user has opted out', () => {
            optOut[1]();

            const tracker = startTracker();

            expect(tracker.isActive).toBe(false);
            expect(docAdd).not.toHaveBeenCalledWith(
                'click',
                expect.any(Function),
                expect.anything()
            );
        });

        it.each(kitGates)(
            'logs the click but sends the kit nothing when %s',
            (_, apply) => {
                apply();
                startTracker();

                click(button('Place order'));

                expect(notify).not.toHaveBeenCalled();
                expect(logEvent).toHaveBeenCalledTimes(1);
            }
        );

        it.each([...kitGates, optOut])(
            'drops a kit signal when %s after attaching',
            (_, apply) => {
                startTracker();
                apply();

                click(button('Place order'));

                expect(notify).not.toHaveBeenCalled();
            }
        );

        it('stops logging events after an opt-out', () => {
            startTracker();
            store.isEnabled = false;

            click(button('Add to cart'));

            expect(logEvent).not.toHaveBeenCalled();
        });
    });

    describe('event logging', () => {
        it('logs a generic button as Button Click with its masked label', () => {
            startTracker();

            click(button('Size 10'));

            expect(logEvent).toHaveBeenCalledWith({
                messageType: 4,
                name: 'Button Click',
                eventType: 8,
                data: {
                    label: 'size #',
                    label_source: 'text',
                    element: 'button',
                    type: 'submit',
                    path: '/checkout',
                    hostname: window.location.hostname,
                    [AUTO_BUTTON_ATTRIBUTE]: true,
                },
                customFlags: { [AUTO_BUTTON_FLAG]: 'true' },
            });
        });

        it('records a button as it was clicked, even if the page disables or relabels it', () => {
            startTracker();
            const target = button('Place order');

            listener(docAdd, 'click')(trustedClick(target));
            // The page's own handler runs after this capture listener.
            target.disabled = true;
            target.textContent = 'Processing';
            afterPaint();

            expect(logEvent).toHaveBeenCalledTimes(1);
            expect(logEvent.mock.calls[0][0].data.label).toBe('place order');
            expect(notify).toHaveBeenCalledWith({ kind: 'commit', t: 1000000 });
        });

        it('adds hand-written identifiers to the event', () => {
            startTracker();
            const target = button('Add');
            target.id = 'add-to-cart';
            target.setAttribute('name', 'add');
            target.setAttribute('data-testid', 'pdp-add-button');

            click(target);

            expect(logEvent.mock.calls[0][0].data).toEqual(
                expect.objectContaining({
                    element_id: 'add-to-cart',
                    element_name: 'add',
                    test_id: 'pdp-add-button',
                })
            );
        });

        it('restarts the session timer before logging, like page views', () => {
            startTracker();

            click(button('Small'));

            expect(resetSessionTimer).toHaveBeenCalledTimes(1);
            expect(resetSessionTimer.mock.invocationCallOrder[0]).toBeLessThan(
                logEvent.mock.invocationCallOrder[0]
            );
        });

        it('logs every button the same way and sends only checkout intent to the kit', () => {
            startTracker();

            click(button('Add to cart'));
            click(button('Place order'));

            expect(logEvent.mock.calls.map(call => call[0].name)).toEqual([
                'Button Click',
                'Button Click',
            ]);
            expect(logEvent.mock.calls[0][0].eventType).toBe(8);
            expect(logEvent.mock.calls[0][0].data.intent).toBeUndefined();
            expect(notify).toHaveBeenCalledTimes(1);
            expect(notify.mock.calls[0][0].kind).toBe('commit');
        });

        it('sends the kit checkout intent from a link without logging the link', () => {
            startTracker();
            const link = document.createElement('a');
            link.href = '/checkout';
            link.textContent = 'Checkout';
            document.body.appendChild(link);

            click(link);

            expect(logEvent).not.toHaveBeenCalled();
            expect(notify).toHaveBeenCalledWith({ kind: 'checkout_step', t: 1000000 });
        });

        it('logs without a Rokt kit and never signals one', () => {
            startTracker(false);

            click(button('Place order'));

            expect(logEvent).toHaveBeenCalledTimes(1);
            expect(notify).not.toHaveBeenCalled();
        });

        it('logs nothing for submits or wallet frame focus', () => {
            startTracker();
            listener(docAdd, 'submit')(trustedSubmit(button('Pay now')));
            afterPaint();

            expect(logEvent).not.toHaveBeenCalled();
            expect(notify).toHaveBeenCalledTimes(1);
        });

        it('logs an unnamed or unsafe button without a label', () => {
            startTracker();

            click(button('Email jane@example.com'));

            expect(logEvent).toHaveBeenCalledTimes(1);
            const data = logEvent.mock.calls[0][0].data;
            expect(data.label).toBeUndefined();
            expect(data.label_source).toBe('none');
        });

        it('logs one event per label each second', () => {
            startTracker();
            const target = button('Small');

            click(target);
            jest.setSystemTime(1000999);
            click(target);
            click(button('Large'));
            expect(logEvent).toHaveBeenCalledTimes(2);

            jest.setSystemTime(1001000);
            click(target);
            expect(logEvent).toHaveBeenCalledTimes(3);
        });

        it('logs at most 50 events per page and starts over on a new path', () => {
            startTracker();

            for (let i = 0; i < 60; i++) {
                click(
                    button(
                        'Option ' +
                            String.fromCharCode(65 + Math.floor(i / 26)) +
                            String.fromCharCode(65 + (i % 26))
                    )
                );
            }
            expect(logEvent).toHaveBeenCalledTimes(50);

            window.history.replaceState({}, '', '/cart');
            click(button('Option A'));
            expect(logEvent).toHaveBeenCalledTimes(51);
        });
    });

    it('ignores a click made while opted out even if opt-in returns before classification', () => {
        startTracker();
        const handler = listener(docAdd, 'click');
        store.isEnabled = false;

        handler(trustedClick(button('Place order')));
        store.isEnabled = true;
        afterPaint();

        expect(notify).not.toHaveBeenCalled();
    });

    it('drops a click queued before an opt-out even if opt-in returns before classification', () => {
        const tracker = startTracker();
        const handler = listener(docAdd, 'click');

        handler(trustedClick(button('Place order')));
        store.isEnabled = false;
        tracker.clearPending();
        store.isEnabled = true;
        afterPaint();

        expect(notify).not.toHaveBeenCalled();
    });

    it('does not let a click classified while opted out arm a later submit', () => {
        startTracker();
        const clickHandler = listener(docAdd, 'click');

        clickHandler(trustedClick(button('Place order')));
        store.isEnabled = false;
        afterPaint();
        store.isEnabled = true;
        listener(docAdd, 'submit')(trustedSubmit(null));
        afterPaint();

        expect(notify).not.toHaveBeenCalled();
    });

    it('removes its listeners on teardown and drops queued work', () => {
        const tracker = startTracker();
        const handler = listener(docAdd, 'click');

        handler(trustedClick(button('Place order')));
        tracker.teardown();
        afterPaint();

        expect(notify).not.toHaveBeenCalled();
        expect(docRemove).toHaveBeenCalledWith('click', handler, true);
        expect(docRemove).toHaveBeenCalledWith('submit', handler, true);
        expect(winRemove).toHaveBeenCalledWith('blur', handler);
        expect(winRemove).toHaveBeenCalledWith(
            'pageshow',
            listener(winAdd, 'pageshow')
        );
        expect(tracker.isActive).toBe(false);
        expect(getActiveButtonTracker()).toBeUndefined();
    });

    it('resets the throttle on a back-forward cache restore', () => {
        startTracker();
        const target = button('Place order');
        click(target);

        listener(winAdd, 'pageshow')({ persisted: true });
        click(target);

        expect(notify).toHaveBeenCalledTimes(2);
    });

    it('drops queued work on a back-forward cache restore', () => {
        startTracker();

        listener(docAdd, 'click')(trustedClick(button('Place order')));
        listener(winAdd, 'pageshow')({ persisted: true });
        afterPaint();

        expect(notify).not.toHaveBeenCalled();
    });

    it('keeps queued work on an ordinary pageshow', () => {
        startTracker();

        listener(docAdd, 'click')(trustedClick(button('Place order')));
        listener(winAdd, 'pageshow')({ persisted: false });
        afterPaint();

        expect(notify).toHaveBeenCalledTimes(1);
    });

    it('buffers a signal under the path it was raised on', () => {
        roktManager = new RoktManager('checkout-intent-test');
        initManager();
        startTracker();

        listener(docAdd, 'click')(trustedClick(button('Place order')));
        window.history.replaceState({}, '', '/order/confirmation');
        afterPaint();
        roktManager.attachKit(({
            filters: {},
            launcher: {},
            onCheckoutIntent: notify,
        } as unknown) as IRoktKit);

        expect(notify).not.toHaveBeenCalled();
    });

    it('discards signals not yet handed to a kit on teardown', () => {
        roktManager = new RoktManager('checkout-intent-test');
        initManager();
        const tracker = startTracker();

        click(button('Place order'));
        tracker.teardown();
        roktManager.attachKit(({
            filters: {},
            launcher: {},
            onCheckoutIntent: notify,
        } as unknown) as IRoktKit);

        expect(notify).not.toHaveBeenCalled();
    });

    it('retires the earlier tracker on re-init so listeners never double', () => {
        const first = startTracker();
        const second = startTracker();

        expect(first.isActive).toBe(false);
        expect(second.isActive).toBe(true);
        expect((window as any)[WIN_BTN_KEY].tracker).toBe(second);

        second.init({ hasRoktKit: true });
        click(button('Place order'));

        expect(notify).toHaveBeenCalledTimes(1);
        expect(
            docAdd.mock.calls.filter(call => call[0] === 'click').length -
                docRemove.mock.calls.filter(call => call[0] === 'click').length
        ).toBe(1);
    });

    it('keeps working when classification throws', () => {
        startTracker();
        const broken = trustedClick(button('Place order'));
        broken.composedPath = () => {
            throw new Error('boom');
        };

        expect(() => listener(docAdd, 'click')(broken)).not.toThrow();
        click(button('Place order'));

        expect(notify).toHaveBeenCalledTimes(1);
    });
});
