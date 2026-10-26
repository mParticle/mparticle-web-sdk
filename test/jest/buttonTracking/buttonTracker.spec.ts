import { BatchUploader } from '../../../src/batchUploader';
import { AUTO_BUTTON_ATTRIBUTE, AUTO_LINK_ATTRIBUTE } from '../../../src/buttonTracking/buttonClickEvent';
import {
    ButtonTracker,
    getActiveButtonTracker,
    resetButtonTracking,
    WIN_BTN_KEY,
} from '../../../src/buttonTracking/buttonTracker';
import * as checkoutIntent from '../../../src/buttonTracking/checkoutIntent';
import * as buttonDescription from '../../../src/buttonTracking/buttonDescription';
import * as controls from '../../../src/buttonTracking/controls';
import { IMParticleWebSDKInstance } from '../../../src/mp-instance';
import RoktManager, { IRoktKit } from '../../../src/roktManager';
import { IKitConfigs } from '../../../src/configAPIClient';
import { IMParticleUser } from '../../../src/identity-user-interfaces';
import { SDKIdentityApi } from '../../../src/identity.interfaces';
import { IStore } from '../../../src/store';
import { BaseEvent, SDKEvent } from '../../../src/sdkRuntimeModels';

type Listener = (event: unknown) => void;

describe('ButtonTracker', () => {
    let notify: jest.Mock;
    let logEvent: jest.Mock;
    let resetSessionTimer: jest.Mock;
    let upload: jest.Mock;
    let apiClient: { uploader: BatchUploader | null };
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
            _APIClient: apiClient,
            upload,
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
        roktManager.setAutoButtonClicksForwarded(true);
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
    const trustedClick = (
        target: Element,
        path: Array<EventTarget> = [target, document.body, document]
    ) => ({
        type: 'click',
        isTrusted: true,
        target,
        composedPath: () => path,
        defaultPrevented: false,
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

    const startTracker = (
        hasRoktKit = true,
        logs = { logButtons: true, logLinks: false }
    ): ButtonTracker => {
        const tracker = new ButtonTracker(makeInstance());
        tracker.init({ hasRoktKit, ...logs });
        return tracker;
    };

    // The tracker classifies after the next animation frame. After setSystemTime
    // the fake clock's next frame can be up to two frames away.
    const afterPaint = () => jest.advanceTimersByTime(40);

    const click = (target: Element, path?: Array<EventTarget>) => {
        listener(docAdd, 'click')(trustedClick(target, path));
        afterPaint();
    };

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(1000000);
        window.history.replaceState({}, '', '/checkout');
        notify = jest.fn();
        logEvent = jest.fn();
        resetSessionTimer = jest.fn();
        upload = jest.fn();
        apiClient = { uploader: null };
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
        expect(signal).toEqual({ kind: 'commit', t: 1000000, source: 'label', pathname: '/checkout' });
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

    it.each(['beforeunload', 'pagehide', 'visibilitychange'])(
        'delivers a waiting click when the page is left before the next paint (%s)',
        type => {
            startTracker();
            listener(docAdd, 'click')(trustedClick(button('Place order')));
            expect(logEvent).not.toHaveBeenCalled();

            Object.defineProperty(document, 'visibilityState', {
                configurable: true,
                value: 'hidden',
            });
            if (type === 'pagehide' || type === 'beforeunload') {
                listener(winAdd, type)({ type });
            } else {
                listener(docAdd, 'visibilitychange')({ type: 'visibilitychange' });
            }
            delete (document as any).visibilityState;

            expect(logEvent).toHaveBeenCalledTimes(1);
            expect(notify).toHaveBeenCalledWith(expect.objectContaining({ kind: 'commit', t: 1000000 }));

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
        expect(winAdd).toHaveBeenCalledWith(
            'beforeunload',
            expect.any(Function),
            { capture: true, passive: true }
        );
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

        click(button('Size guide'));

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

        expect(notify).toHaveBeenCalledWith(expect.objectContaining({ kind: 'commit', t: 1000000 }));
    });

    it('ignores a submit whose submitter is not a checkout control', () => {
        startTracker();

        listener(docAdd, 'submit')(trustedSubmit(button('Search')));
        afterPaint();

        expect(notify).not.toHaveBeenCalled();
    });

    it('ignores a submit whose submitter is excluded from tracking', () => {
        startTracker();
        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-mp-no-track', '');
        document.body.appendChild(wrapper);
        const submitter = document.createElement('button');
        submitter.textContent = 'Pay now';
        wrapper.appendChild(submitter);

        listener(docAdd, 'submit')(trustedSubmit(submitter));
        afterPaint();

        expect(notify).not.toHaveBeenCalled();
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

        expect(notify).toHaveBeenCalledWith(expect.objectContaining({ kind: 'commit', t: 1001000, source: 'submit' }));
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

    it('reports focus moving into a hosted wallet button as a wallet click', () => {
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

        expect(notify).toHaveBeenCalledWith(expect.objectContaining({ kind: 'wallet', t: 1000000, source: 'frame' }));
    });

    it('reports focus moving into a PayPal SDK button frame with no src as a wallet click', () => {
        startTracker();
        const frame = document.createElement('iframe');
        frame.name = '__zoid__paypal_buttons__eyJ9__';
        document.body.appendChild(frame);
        jest.spyOn(document, 'activeElement', 'get').mockReturnValue(frame);
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });

        listener(winAdd, 'blur')({ type: 'blur', isTrusted: true });
        afterPaint();

        expect(notify).toHaveBeenCalledWith(expect.objectContaining({ kind: 'wallet', t: 1000000, source: 'frame' }));
    });

    it('reads the focused card field frame after the blur settles', () => {
        startTracker();
        const frame = document.createElement('iframe');
        frame.src = 'https://js.stripe.com/v3/elements-inner-card.html';
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

        expect(notify).toHaveBeenCalledWith(expect.objectContaining({ kind: 'frame', t: 1000000 }));
    });

    describe('payment picks', () => {
        let pick: jest.Mock;

        const focusFrame = (src: string) => {
            const frame = document.createElement('iframe');
            frame.src = src;
            document.body.appendChild(frame);
            jest.spyOn(document, 'activeElement', 'get').mockReturnValue(frame);
            Object.defineProperty(document, 'visibilityState', {
                configurable: true,
                value: 'visible',
            });
            listener(winAdd, 'blur')({ type: 'blur', isTrusted: true });
            afterPaint();
        };

        const paymentRadio = (checked: boolean) => {
            document.body.insertAdjacentHTML(
                'beforeend',
                '<label><input type="radio" name="payment_method" id="paypal-option"> PayPal</label>'
            );
            const radio = document.getElementById('paypal-option') as HTMLInputElement;
            radio.checked = checked;
            return radio;
        };

        beforeEach(() => {
            pick = jest.fn();
            roktManager.attachKit(({
                filters: {},
                launcher: {},
                onCheckoutIntent: notify,
                onPaymentPick: pick,
            } as unknown) as IRoktKit);
        });

        it('hands the kit the names of a picked payment radio, and logs the click without them', () => {
            startTracker();
            const radio = paymentRadio(true);

            click(radio, [radio, radio.parentElement!, document.body, document]);

            expect(pick).toHaveBeenCalledTimes(1);
            const signal = pick.mock.calls[0][0];
            expect(signal).toEqual({
                t: 1000000,
                pathname: '/checkout',
                names: ['paypal', 'paypal-option'],
                family: undefined,
            });
            expect(Object.isFrozen(signal)).toBe(true);
            expect(Object.isFrozen(signal.names)).toBe(true);
            const logged = logEvent.mock.calls[0][0].data;
            expect(logged).toEqual(
                expect.objectContaining({ type: 'radio', element_name: 'payment_method', checked: true })
            );
            expect(JSON.stringify(logged)).not.toContain('paypal');
        });

        it('hands over nothing for a payment radio the click left unpicked', () => {
            startTracker();
            const radio = paymentRadio(false);

            click(radio, [radio, radio.parentElement!, document.body, document]);

            expect(pick).not.toHaveBeenCalled();
        });

        it('hands over nothing for a radio whose question is not about payment', () => {
            startTracker();
            document.body.insertAdjacentHTML(
                'beforeend',
                '<input type="radio" name="disability" id="wheelchair"><label for="wheelchair">PayPal</label>'
            );
            const radio = document.getElementById('wheelchair') as HTMLInputElement;
            radio.checked = true;

            click(radio);

            expect(pick).not.toHaveBeenCalled();
        });

        it('hands the kit the family of a focused payment frame before the wallet intent', () => {
            startTracker();

            focusFrame('https://pay.google.com/gp/p/ui/payframe');

            expect(pick).toHaveBeenCalledWith({
                t: 1000000,
                pathname: '/checkout',
                names: undefined,
                family: 'google_pay',
            });
            expect(notify).toHaveBeenCalledWith(expect.objectContaining({ kind: 'wallet' }));
            expect(pick.mock.invocationCallOrder[0]).toBeLessThan(
                notify.mock.invocationCallOrder[0]
            );
        });

        it('hands over no pick for a wallet frame that names no single method', () => {
            startTracker();

            focusFrame(
                'https://js.stripe.com/v3/elements-inner-payment-request-0123456789abcdef0123456789abcdef.html'
            );

            expect(pick).not.toHaveBeenCalled();
            expect(notify).toHaveBeenCalledWith(expect.objectContaining({ kind: 'wallet' }));
        });

        it.each([
            ['a Rokt privacy launcher option is set', () => initManager({ noTargeting: true })],
            ['the Rokt connection does not receive auto button clicks', () => roktManager.setAutoButtonClicksForwarded(false)],
            ['the SDK is opted out', () => (store.isEnabled = false)],
        ])('hands over nothing while %s', (_, gate) => {
            startTracker();
            gate();
            const radio = paymentRadio(true);

            click(radio, [radio, radio.parentElement!, document.body, document]);
            focusFrame('https://pay.google.com/gp/p/ui/payframe');

            expect(pick).not.toHaveBeenCalled();
        });

        it('hands over nothing when this init configures no Rokt kit', () => {
            startTracker(false);
            const radio = paymentRadio(true);

            click(radio, [radio, radio.parentElement!, document.body, document]);

            expect(pick).not.toHaveBeenCalled();
        });
    });

    describe('privacy gates', () => {
        const targetingGates: Array<[string, () => void]> = [
            ['noTargeting is set', () => initManager({ noTargeting: true })],
            [
                'doNotShareOrSell is set',
                () => initManager({ doNotShareOrSell: true }),
            ],
            ['noDeviceId is set', () => initManager({ noDeviceId: true })],
            [
                'Global Privacy Control is on',
                () => ((navigator as any).globalPrivacyControl = true),
            ],
        ];
        const intentGates: Array<[string, () => void]> = [
            ['noFunctional alone is set', () => initManager({ noFunctional: true })],
            [
                'the flag is off',
                () => (store.SDKConfig.flags.autoButtonTracking = false),
            ],
            [
                'the Rokt connection does not receive auto button clicks',
                () => roktManager.setAutoButtonClicksForwarded(false),
            ],
        ];
        const kitGates = [...targetingGates, ...intentGates];
        const bothOn = { logButtons: true, logLinks: true };

        const clickButtonAndLink = () => {
            click(button('Place order'));
            const link = document.createElement('a');
            link.href = 'https://example.org/help';
            link.textContent = 'Help centre';
            document.body.appendChild(link);
            click(link);
        };
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

        it('logs both click events with no privacy option set', () => {
            startTracker(true, bothOn);

            clickButtonAndLink();

            expect(logEvent.mock.calls.map(call => call[0].name)).toEqual([
                'Auto Button Click',
                'Auto Link Click',
            ]);
            expect(notify).toHaveBeenCalledTimes(1);
        });

        it.each(targetingGates)(
            'logs neither click event and sends the kit nothing when %s',
            (_, apply) => {
                apply();
                startTracker(true, bothOn);

                clickButtonAndLink();

                expect(logEvent).not.toHaveBeenCalled();
                expect(notify).not.toHaveBeenCalled();
            }
        );

        it.each(targetingGates)(
            'stops logging clicks when %s after attaching',
            (_, apply) => {
                startTracker(true, bothOn);
                clickButtonAndLink();
                apply();

                clickButtonAndLink();

                expect(logEvent).toHaveBeenCalledTimes(2);
            }
        );

        it('drops a click read before noTargeting arrives but delivered after it', () => {
            startTracker();

            listener(docAdd, 'click')(trustedClick(button('Size 10')));
            initManager({ noTargeting: true });
            afterPaint();

            expect(logEvent).not.toHaveBeenCalled();
        });

        it('logs clicks again once the launcher options no longer opt out', () => {
            initManager({ doNotShareOrSell: true });
            startTracker();
            click(button('Size guide'));
            initManager({});

            click(button('Size 10'));

            expect(logEvent).toHaveBeenCalledTimes(1);
            expect(logEvent.mock.calls[0][0].data.label).toBe('size #');
        });

        it.each(intentGates)(
            'logs the click but sends the kit nothing when %s',
            (_, apply) => {
                apply();
                startTracker(true, bothOn);

                clickButtonAndLink();

                expect(notify).not.toHaveBeenCalled();
                expect(logEvent.mock.calls.map(call => call[0].name)).toEqual([
                    'Auto Button Click',
                    'Auto Link Click',
                ]);
            }
        );

        it('keeps logging under Global Privacy Control without a Rokt kit', () => {
            (navigator as any).globalPrivacyControl = true;
            startTracker(false, bothOn);

            clickButtonAndLink();

            expect(logEvent.mock.calls.map(call => call[0].name)).toEqual([
                'Auto Button Click',
                'Auto Link Click',
            ]);
        });

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
        it('finds the control once and skips checkout intent without a Rokt kit', () => {
            const find = jest.spyOn(controls, 'findControl');
            const classify = jest.spyOn(checkoutIntent, 'classifyIntent');
            startTracker(false);

            click(button('Place order'));

            expect(logEvent).toHaveBeenCalledTimes(1);
            expect(find).toHaveBeenCalledTimes(1);
            expect(classify).not.toHaveBeenCalled();
            expect(notify).not.toHaveBeenCalled();
        });

        it('logs a generic button as Auto Button Click with its masked label', () => {
            startTracker();

            click(button('Size 10'));

            expect(logEvent).toHaveBeenCalledWith({
                messageType: 4,
                name: 'Auto Button Click',
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
            expect(notify).toHaveBeenCalledWith(expect.objectContaining({ kind: 'commit', t: 1000000 }));
        });

        it('adds hand-written identifiers to the event', () => {
            startTracker();
            const target = button('Add');
            target.id = 'add-to-cart';
            target.setAttribute('name', 'add');
            target.setAttribute('data-testid', 'pdp-add-button');
            target.setAttribute('aria-controls', 'mini-cart');
            const form = document.createElement('form');
            form.id = 'pdp-form';
            document.body.appendChild(form);
            target.setAttribute('form', 'pdp-form');

            click(target);

            expect(logEvent.mock.calls[0][0].data).toEqual(
                expect.objectContaining({
                    element_id: 'add-to-cart',
                    element_name: 'add',
                    test_id: 'pdp-add-button',
                    controls: 'mini-cart',
                    form: 'pdp-form',
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

            click(button('Size guide'));
            click(button('Place order'));

            expect(logEvent.mock.calls.map(call => call[0].name)).toEqual([
                'Auto Button Click',
                'Auto Button Click',
            ]);
            expect(logEvent.mock.calls[0][0].eventType).toBe(8);
            expect(logEvent.mock.calls[0][0].data.intent).toBeUndefined();
            expect(notify).toHaveBeenCalledTimes(1);
            expect(notify.mock.calls[0][0].kind).toBe('commit');
        });

        it('sends the kit checkout intent from a link without logging the link', () => {
            startTracker();
            const link = document.createElement('a');
            link.href = '/checkout/payment';
            link.textContent = 'Checkout';
            document.body.appendChild(link);

            click(link);

            expect(logEvent).not.toHaveBeenCalled();
            expect(notify).toHaveBeenCalledWith(expect.objectContaining({ kind: 'checkout_step', t: 1000000 }));
        });

        describe('cart clicks', () => {
            beforeEach(() => {
                window.history.replaceState({}, '', '/product/1');
            });

            it('logs a bag button that leads to the cart page, and signals the kit nothing', () => {
                startTracker();
                document.body.insertAdjacentHTML(
                    'beforeend',
                    '<button title="Shopping bag" aria-label="1 item in bag" data-testid="header-cart"><svg></svg></button>'
                );

                click(document.querySelector('[data-testid="header-cart"]')!);

                expect(logEvent).toHaveBeenCalledWith(
                    expect.objectContaining({ name: 'Auto Button Click' })
                );
                expect(notify).not.toHaveBeenCalled();
            });

            it('logs a cart click as an Auto Button Click and hands the kit a cart signal', () => {
                startTracker();
                document.body.insertAdjacentHTML(
                    'beforeend',
                    '<button aria-expanded="false" title="Shopping bag" aria-label="1 item in bag" data-testid="header-cart"><svg></svg></button>'
                );

                click(document.querySelector('[data-testid="header-cart"]')!);

                expect(logEvent).toHaveBeenCalledWith({
                    messageType: 4,
                    name: 'Auto Button Click',
                    eventType: 8,
                    data: {
                        label: '# item in bag',
                        label_source: 'aria',
                        aria_label: '# item in bag',
                        test_id: 'header-cart',
                        element: 'button',
                        type: 'submit',
                        path: '/product/1',
                        hostname: window.location.hostname,
                        [AUTO_BUTTON_ATTRIBUTE]: true,
                    },
                });
                expect(notify).toHaveBeenCalledTimes(1);
                expect(notify.mock.calls[0][0]).toEqual({
                    kind: 'cart',
                    t: 1000000,
                    source: 'label',
                    pathname: '/product/1',
                });
            });

            it('sends nothing for a link to the cart page', () => {
                startTracker();
                const link = document.createElement('a');
                link.href = '/bag';
                link.setAttribute('title', 'Shopping bag');
                document.body.appendChild(link);

                click(link);

                expect(logEvent).not.toHaveBeenCalled();
                expect(notify).not.toHaveBeenCalled();
            });

            it('sends the kit cart intent from an add-to-bag link without logging the link', () => {
                startTracker();
                const link = document.createElement('a');
                link.href = '/bag?add=1';
                link.setAttribute('title', 'Add to bag');
                document.body.appendChild(link);

                click(link);

                expect(logEvent).not.toHaveBeenCalled();
                expect(notify).toHaveBeenCalledWith(expect.objectContaining({ kind: 'cart' }));
            });

            it('sends cart from a bag button that opens a flyout', () => {
                startTracker();
                const flyout = button('');
                flyout.setAttribute('aria-expanded', 'false');
                flyout.setAttribute('aria-label', 'My bag');

                click(flyout);

                expect(notify).toHaveBeenCalledWith(expect.objectContaining({ kind: 'cart' }));
            });

            it('logs a cart-labelled checkbox and never signals the kit', () => {
                startTracker();
                document.body.insertAdjacentHTML('beforeend', '<input type="checkbox" aria-label="Add to bag">');

                click(document.querySelector('input')!);

                expect(logEvent).toHaveBeenCalledTimes(1);
                expect(notify).not.toHaveBeenCalled();
            });

            it('never lets a cart click arm a submit without a submitter', () => {
                startTracker();
                click(button('Add to bag'));
                notify.mockClear();

                listener(docAdd, 'submit')(trustedSubmit(null));
                afterPaint();

                expect(notify).not.toHaveBeenCalled();
            });

            it('sends add to bag from its submit once, inside the throttle', () => {
                startTracker();
                const addToBag = button('Add to bag');

                click(addToBag);
                listener(docAdd, 'submit')(trustedSubmit(addToBag));
                afterPaint();

                expect(notify).toHaveBeenCalledTimes(1);
                expect(notify.mock.calls[0][0].kind).toBe('cart');
            });
        });

        describe('link clicks', () => {
            const link = (href: string, text: string): HTMLAnchorElement => {
                const element = document.createElement('a');
                element.href = href;
                element.textContent = text;
                document.body.appendChild(element);
                return element;
            };
            const bothOn = { logButtons: true, logLinks: true };

            it('keeps logging outbound and download links as Auto Button Click while link tracking is off', () => {
                startTracker();

                click(link('https://example.org/help', 'Help centre'));
                click(link('/menu.pdf', 'Menu'));

                expect(logEvent.mock.calls.map(call => call[0].name)).toEqual([
                    'Auto Button Click',
                    'Auto Button Click',
                ]);
                expect(logEvent.mock.calls.map(call => call[0].data.link_type)).toEqual(['outbound', 'download']);
                expect(logEvent.mock.calls[0][0].data.label).toBe('help centre');
            });

            it('keeps logging a role="button" link to another page as Auto Button Click while link tracking is off', () => {
                startTracker();
                const next = link('/next', 'Next');
                next.setAttribute('role', 'button');

                click(next);

                expect(logEvent).toHaveBeenCalledTimes(1);
                expect(logEvent.mock.calls[0][0].name).toBe('Auto Button Click');
                expect(logEvent.mock.calls[0][0].data).toEqual(
                    expect.objectContaining({ element: 'role', label: 'next' })
                );
            });

            it('logs no plain link to another page of the site while link tracking is off', () => {
                startTracker();

                click(link('/help', 'Help'));

                expect(logEvent).not.toHaveBeenCalled();
            });

            it('sends no label or aria label with a link to another page of the site', () => {
                startTracker(true, bothOn);
                const account = link('/account', 'Hi, Jane');
                account.setAttribute('aria-label', 'Jane Doe account');
                account.id = 'account-link';

                click(account);

                const data = logEvent.mock.calls[0][0].data;
                expect(data.link_type).toBe('internal');
                expect(data.label).toBeUndefined();
                expect(data.aria_label).toBeUndefined();
                expect(data.label_source).toBe('none');
                expect(data.element_id).toBe('account-link');
            });

            it('never describes a control that is not a link while link tracking is on alone', () => {
                const describe = jest.spyOn(buttonDescription, 'describeButtonClick');
                store.SDKConfig.flags.autoButtonTracking = false;
                startTracker(true, { logButtons: false, logLinks: true });

                click(button('Add to bag'));
                click(link('/help', 'Help'));

                expect(describe).toHaveBeenCalledTimes(1);
                expect(logEvent.mock.calls.map(call => call[0].name)).toEqual(['Auto Link Click']);
            });

            it.each([
                ['a role="button" element', '<a href="/next"><span role="button">Next</span></a>', 'span'],
                ['a vendor wallet button', '<a href="/next"><apple-pay-button></apple-pay-button></a>', 'apple-pay-button'],
            ])('logs nothing for %s inside a link while link tracking is on alone', (_name, html, selector) => {
                store.SDKConfig.flags.autoButtonTracking = false;
                startTracker(true, { logButtons: false, logLinks: true });
                document.body.insertAdjacentHTML('beforeend', html);
                const inner = document.querySelector(selector)!;

                click(inner, [inner, inner.parentElement!, document.body, document]);

                expect(logEvent).not.toHaveBeenCalled();
            });

            it('logs an outbound link click as an Auto Link Click', () => {
                startTracker(true, bothOn);

                click(link('https://example.org/help', 'Help centre'));

                expect(logEvent).toHaveBeenCalledWith({
                    messageType: 4,
                    name: 'Auto Link Click',
                    eventType: 8,
                    data: {
                        label: 'help centre',
                        label_source: 'text',
                        element: 'link',
                        type: 'button',
                        link_type: 'outbound',
                        link_domain: 'example.org',
                        path: '/checkout',
                        hostname: window.location.hostname,
                        [AUTO_LINK_ATTRIBUTE]: true,
                    },
                });
            });

            it.each([
                ['another page of the site', '/help', 'internal'],
                ['a file', '/menu.pdf', 'download'],
            ])('logs a link to %s as an Auto Link Click', (_name, href, linkType) => {
                startTracker(true, bothOn);

                click(link(href, 'Go'));

                expect(logEvent).toHaveBeenCalledTimes(1);
                expect(logEvent.mock.calls[0][0].name).toBe('Auto Link Click');
                expect(logEvent.mock.calls[0][0].data.link_type).toBe(linkType);
                expect(logEvent.mock.calls[0][0].data[AUTO_BUTTON_ATTRIBUTE]).toBeUndefined();
            });

            it('logs a role="button" link that leaves the page as an Auto Link Click', () => {
                startTracker(true, bothOn);
                const next = link('/next', 'Next');
                next.setAttribute('role', 'button');

                click(next);

                expect(logEvent.mock.calls[0][0].name).toBe('Auto Link Click');
                expect(logEvent.mock.calls[0][0].data).toEqual(
                    expect.objectContaining({ element: 'role', link_type: 'internal', label: 'next' })
                );
            });

            it.each([
                ['a same-page anchor', '#reviews'],
                ['a javascript link', 'javascript:void(0)'],
            ])('keeps %s an Auto Button Click', (_name, href) => {
                startTracker(true, bothOn);

                click(link(href, 'More'));

                expect(logEvent).toHaveBeenCalledTimes(1);
                expect(logEvent.mock.calls[0][0].name).toBe('Auto Button Click');
                expect(logEvent.mock.calls[0][0].data.link_type).toBe('same_page');
                expect(logEvent.mock.calls[0][0].data[AUTO_LINK_ATTRIBUTE]).toBeUndefined();
            });

            it('logs links and no buttons with link tracking alone, and never signals the kit', () => {
                store.SDKConfig.flags.autoButtonTracking = false;
                startTracker(true, { logButtons: false, logLinks: true });

                click(button('Place order'));
                click(link('#reviews', 'Reviews'));
                click(link('/checkout/payment', 'Checkout'));

                expect(logEvent.mock.calls.map(call => call[0].name)).toEqual(['Auto Link Click']);
                expect(notify).not.toHaveBeenCalled();
            });

            it('keeps the kit checkout intent from a link that is logged as a link click', () => {
                startTracker(true, bothOn);

                click(link('/checkout/payment', 'Checkout'));

                expect(logEvent.mock.calls[0][0].name).toBe('Auto Link Click');
                expect(notify).toHaveBeenCalledWith(expect.objectContaining({ kind: 'checkout_step' }));
            });

            it('does not start with neither click stream on and the kit suppressed', () => {
                store.SDKConfig.flags.autoButtonTracking = false;
                startTracker(true, { logButtons: false, logLinks: false });

                expect(docAdd.mock.calls.filter(call => call[0] === 'click')).toEqual([]);
            });
        });

        it('logs a checkbox click with its checked state and no label, and never signals the kit', () => {
            startTracker();
            document.body.insertAdjacentHTML(
                'beforeend',
                '<input type="checkbox" id="wrap"><label for="wrap">Gift wrap</label>'
            );
            const box = document.getElementById('wrap') as HTMLInputElement;
            // The browser toggles the box before listeners see the click.
            box.checked = true;

            click(box);

            expect(logEvent).toHaveBeenCalledWith({
                messageType: 4,
                name: 'Auto Button Click',
                eventType: 8,
                data: {
                    label_source: 'none',
                    element: 'input',
                    type: 'checkbox',
                    element_id: 'wrap',
                    checked: true,
                    path: '/checkout',
                    hostname: window.location.hostname,
                    [AUTO_BUTTON_ATTRIBUTE]: true,
                },
            });
            expect(notify).not.toHaveBeenCalled();
        });

        it('logs a radio click with the name of its question and no id', () => {
            startTracker();
            document.body.insertAdjacentHTML(
                'beforeend',
                '<input type="radio" name="disability" id="disability-yes">'
            );
            const radio = document.getElementById('disability-yes') as HTMLInputElement;
            radio.checked = true;

            click(radio);

            expect(logEvent.mock.calls[0][0].data).toEqual({
                label_source: 'none',
                element: 'input',
                type: 'radio',
                element_name: 'disability',
                checked: true,
                path: '/checkout',
                hostname: window.location.hostname,
                [AUTO_BUTTON_ATTRIBUTE]: true,
            });
        });

        it('logs a label acting as a button, and the click it passes on to its box, with no text', () => {
            startTracker();
            document.body.insertAdjacentHTML(
                'beforeend',
                '<input type="checkbox" id="needs"><label role="button" for="needs">I have a disability</label>'
            );
            const box = document.getElementById('needs') as HTMLInputElement;

            click(box.nextElementSibling!);
            box.checked = true;
            click(box);

            const logged = logEvent.mock.calls.map(call => call[0].data);
            expect(logged).toEqual([
                expect.objectContaining({ element: 'role', label_source: 'none' }),
                expect.objectContaining({ element: 'input', label_source: 'none', checked: true }),
            ]);
            logged.forEach(data => {
                expect(data).not.toHaveProperty('label');
                expect(data).not.toHaveProperty('aria_label');
            });
        });

        it('logs a label inside a row, and the click it passes on to a radio outside the row, with no text', () => {
            startTracker();
            document.body.insertAdjacentHTML(
                'beforeend',
                '<div role="button"><label for="address">Jane Doe, 12 Main St</label></div><input type="radio" id="address">'
            );
            const label = document.querySelector('label')!;
            const radio = document.getElementById('address') as HTMLInputElement;

            click(label, [label, label.parentElement!, document.body, document]);
            radio.checked = true;
            click(radio);

            const logged = logEvent.mock.calls.map(call => call[0].data);
            expect(logged).toEqual([
                expect.objectContaining({ element: 'role', label_source: 'none' }),
                expect.objectContaining({ element: 'input', label_source: 'none', checked: true }),
            ]);
            logged.forEach(data => {
                expect(data).not.toHaveProperty('label');
                expect(data).not.toHaveProperty('aria_label');
            });
        });

        it.each([
            ['checkbox', true],
            ['radio', false],
        ])('logs a %s as the page left it when the page cancels the click', (type, before) => {
            startTracker();
            const box = document.createElement('input');
            box.type = type;
            box.checked = before;
            document.body.appendChild(box);

            // The browser toggles the box before dispatch, and restores it once
            // a click the page cancelled is over.
            box.checked = type === 'checkbox' ? !before : true;
            const event = trustedClick(box);
            listener(docAdd, 'click')(event);
            event.defaultPrevented = true;
            box.checked = before;
            afterPaint();

            expect(logEvent).toHaveBeenCalledTimes(1);
            expect(logEvent.mock.calls[0][0].data.checked).toBe(before);
        });

        it('logs each of several clicks on the same frame as that click left the box', () => {
            startTracker();
            document.body.insertAdjacentHTML(
                'beforeend',
                '<input type="checkbox" id="gift"><input type="radio" name="speed" id="standard"><input type="radio" name="speed" id="express">'
            );
            const gift = document.getElementById('gift') as HTMLInputElement;
            const standard = document.getElementById('standard') as HTMLInputElement;
            const express = document.getElementById('express') as HTMLInputElement;
            const clickNow = (box: HTMLInputElement) =>
                listener(docAdd, 'click')(trustedClick(box));

            // Toggled on and off, then two radios picked, all before the next paint.
            gift.checked = true;
            clickNow(gift);
            gift.checked = false;
            clickNow(gift);
            standard.checked = true;
            clickNow(standard);
            express.checked = true;
            clickNow(express);
            afterPaint();

            expect(
                logEvent.mock.calls.map(call => call[0].data.checked)
            ).toEqual([true, false, true, true]);
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

        it('logs every click, including quick repeats, up to 100 per page', () => {
            startTracker();
            const target = button('Add');

            for (let i = 0; i < 120; i++) {
                click(target);
            }
            expect(logEvent).toHaveBeenCalledTimes(100);

            window.history.replaceState({}, '', '/cart');
            click(target);
            expect(logEvent).toHaveBeenCalledTimes(101);
        });
    });

    describe('uploading clicks', () => {
        let uploader: BatchUploader;
        let fetchMock: jest.Mock;
        let originalFetch: typeof global.fetch;

        // Stands in for createEventObject with the fields an upload carries.
        const toSDKEvent = (event: BaseEvent): SDKEvent =>
            (({
                EventName: event.name,
                EventCategory: event.eventType,
                EventDataType: event.messageType,
                EventAttributes: event.data,
                Timestamp: Date.now(),
                SessionId: 'session-id',
                MPID: 'test-mpid',
            } as unknown) as SDKEvent);

        // A real uploader, reached as the SDK's logEvent() and upload() reach it.
        const startUploader = (intervalMillis: number) => {
            uploader = new BatchUploader(
                ({
                    _Store: { SDKConfig: { flags: {} }, sideloadedKitsCount: 0 },
                    _Helpers: {
                        getFeatureFlag: () => false,
                        createServiceUrl: () => 'https://mock-url.com',
                        generateUniqueId: () => 'mock-uuid',
                    },
                    Identity: {
                        getCurrentUser: () => ({
                            getMPID: () => 'test-mpid',
                            getConsentState: (): null => null,
                        }),
                    },
                    Logger: {
                        error: jest.fn(),
                        warning: jest.fn(),
                        verbose: jest.fn(),
                        isVerbose: () => false,
                    },
                } as unknown) as IMParticleWebSDKInstance,
                intervalMillis
            );
            apiClient.uploader = uploader;
            logEvent.mockImplementation((event: BaseEvent) =>
                uploader.queueEvent(toSDKEvent(event))
            );
            upload.mockImplementation(() =>
                uploader.prepareAndUpload(false, false)
            );
        };

        const uploadedEventNames = (): string[][] =>
            fetchMock.mock.calls.map(call =>
                JSON.parse(call[1].body).events.map(
                    (event: { data: { event_name: string } }) =>
                        event.data.event_name
                )
            );

        beforeEach(() => {
            originalFetch = global.fetch;
            fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
            global.fetch = fetchMock;
        });

        afterEach(() => {
            uploader.destroy();
            global.fetch = originalFetch;
            delete (navigator as any).sendBeacon;
        });

        it('uploads a click at once, without waiting for the batch interval', () => {
            startUploader(10000);
            startTracker();

            click(button('Add to cart'));

            expect(upload).toHaveBeenCalledTimes(1);
            expect(uploadedEventNames()).toEqual([['Auto Button Click']]);

            jest.advanceTimersByTime(100);

            expect(upload).toHaveBeenCalledTimes(1);
        });

        it('sends the first tap at once and the rest of a burst as one upload', () => {
            startUploader(10000);
            startTracker();
            const target = button('Add');

            // Taps 60 ms apart, each inside the wait the previous one started.
            for (let i = 0; i < 4; i++) {
                click(target);
                jest.advanceTimersByTime(20);
            }
            // The burst outlasts one wait, so each tap restarted it.
            expect(uploadedEventNames()).toEqual([['Auto Button Click']]);

            jest.advanceTimersByTime(100);

            expect(upload).toHaveBeenCalledTimes(2);
            expect(uploadedEventNames()).toEqual([
                ['Auto Button Click'],
                [
                    'Auto Button Click',
                    'Auto Button Click',
                    'Auto Button Click',
                ],
            ]);
        });

        it('leaves a checkbox or radio click for the batch interval', () => {
            startUploader(10000);
            startTracker();
            document.body.insertAdjacentHTML(
                'beforeend',
                '<input type="checkbox" id="size"><input type="radio" id="speed">'
            );

            click(document.getElementById('size')!);
            click(document.getElementById('speed')!);
            jest.advanceTimersByTime(100);

            expect(upload).not.toHaveBeenCalled();
            expect(uploadedEventNames()).toEqual([]);

            jest.advanceTimersByTime(10000);

            expect(uploadedEventNames()).toEqual([
                ['Auto Button Click', 'Auto Button Click'],
            ]);
        });

        it('sends a waiting checkbox click with the next button click', () => {
            startUploader(10000);
            startTracker();
            document.body.insertAdjacentHTML('beforeend', '<input type="checkbox" id="size">');

            click(document.getElementById('size')!);
            click(button('Add to cart'));

            expect(upload).toHaveBeenCalledTimes(1);
            expect(uploadedEventNames()).toEqual([
                ['Auto Button Click', 'Auto Button Click'],
            ]);
        });

        it('uploads clicks further apart than the wait each at once', () => {
            startUploader(10000);
            startTracker();
            const target = button('Add');

            click(target);
            jest.advanceTimersByTime(110);
            expect(uploadedEventNames()).toEqual([['Auto Button Click']]);

            click(target);

            expect(upload).toHaveBeenCalledTimes(2);
            expect(uploadedEventNames()).toEqual([
                ['Auto Button Click'],
                ['Auto Button Click'],
            ]);
        });

        it('adds no upload when batching is off and each click already went', () => {
            startUploader(0);
            startTracker();

            click(button('Add'));
            click(button('Add'));
            jest.advanceTimersByTime(100);

            expect(upload).not.toHaveBeenCalled();
            expect(uploadedEventNames()).toEqual([
                ['Auto Button Click'],
                ['Auto Button Click'],
            ]);
        });

        it('forces no upload for a click held back from the upload queue', () => {
            startUploader(10000);
            uploader.queueEvent(
                toSDKEvent({ name: 'Earlier', messageType: 4, eventType: 8 })
            );
            startTracker();
            // Held, as before an MPID: the click never reaches the uploader.
            logEvent.mockImplementation(() => undefined);

            click(button('Add'));
            jest.advanceTimersByTime(100);

            expect(upload).not.toHaveBeenCalled();
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it.each([
            ['teardown', (tracker: ButtonTracker) => tracker.teardown()],
            ['reset', () => resetButtonTracking()],
            ['opt-out', (tracker: ButtonTracker) => tracker.clearPending()],
        ])('cancels the early upload of a held tap on %s', (_, stop) => {
            startUploader(10000);
            const tracker = startTracker();
            const target = button('Add');

            click(target);
            click(target);
            stop(tracker);
            jest.advanceTimersByTime(100);

            expect(upload).toHaveBeenCalledTimes(1);
        });

        // Bodies the exit upload hands to sendBeacon.
        const beaconBodies = (): string[] => {
            const beacons: string[] = [];
            jest.spyOn(window, 'Blob').mockImplementation(
                (parts: BlobPart[]) =>
                    (({ body: parts[0] } as unknown) as Blob)
            );
            (navigator as any).sendBeacon = jest.fn(
                (_url: string, blob: { body: string }) => {
                    beacons.push(blob.body);
                    return true;
                }
            );
            return beacons;
        };

        it.each(['beforeunload', 'pagehide'])(
            'leaves a click to the exit upload when the page is left before the next paint (%s)',
            type => {
                const beacons = beaconBodies();
                startUploader(10000);
                startTracker();

                listener(docAdd, 'click')(trustedClick(button('Add')));
                window.dispatchEvent(new Event(type));
                jest.advanceTimersByTime(100);

                expect(upload).not.toHaveBeenCalled();
                expect(fetchMock).not.toHaveBeenCalled();
                expect(
                    beacons.map(body =>
                        JSON.parse(body).events.map(
                            (event: { data: { event_name: string } }) =>
                                event.data.event_name
                        )
                    )
                ).toEqual([['Auto Button Click']]);
            }
        );

        it('has a click on its way when the page is left after the next paint', () => {
            (navigator as any).sendBeacon = jest.fn(() => true);
            startUploader(10000);
            startTracker();

            click(button('Add'));
            window.dispatchEvent(new Event('pagehide'));
            jest.advanceTimersByTime(100);

            expect(upload).toHaveBeenCalledTimes(1);
            expect(uploadedEventNames()).toEqual([['Auto Button Click']]);
            expect((navigator as any).sendBeacon).not.toHaveBeenCalled();
        });

        it('sends a held tap with the exit upload rather than after it', () => {
            const beacons = beaconBodies();
            startUploader(10000);
            startTracker();
            const target = button('Add');

            click(target);
            click(target);
            window.dispatchEvent(new Event('pagehide'));
            jest.advanceTimersByTime(100);

            expect(upload).toHaveBeenCalledTimes(1);
            expect(
                beacons.map(body =>
                    JSON.parse(body).events.map(
                        (event: { data: { event_name: string } }) =>
                            event.data.event_name
                    )
                )
            ).toEqual([['Auto Button Click']]);
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

        second.init({ hasRoktKit: true, logButtons: true, logLinks: false });
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

    describe('wallet buttons the page draws itself', () => {
        const pay = window as any;
        const beginApplePay = () => new pay.ApplePaySession().begin();
        // A click on inner text whose path climbs through its parent.
        const clickInside = (target: Element) => {
            listener(docAdd, 'click')({
                ...trustedClick(target),
                composedPath: () => [
                    target,
                    target.parentElement,
                    document.body,
                    document,
                ],
            });
        };
        // A tap on an element no rule reads, as a page's own Apple Pay button.
        const tapPlainDiv = (attrs = '') => {
            document.body.innerHTML = `<div ${attrs}><span>Pay</span></div>`;
            clickInside(document.querySelector('span')!);
        };

        beforeEach(() => {
            // Like the real one, begin throws without its session as receiver.
            pay.ApplePaySession = class Session {
                begin(): string {
                    if (!(this instanceof Session)) {
                        throw new TypeError('Illegal invocation');
                    }
                    return 'began';
                }
            };
        });

        afterEach(() => {
            delete pay.ApplePaySession;
        });

        it('logs a tap on a wallet-named div and hands the kit a wallet tap', () => {
            startTracker();
            document.body.innerHTML =
                '<div data-testid="venmo-pay-btn"><span>Venmo</span></div>';
            clickInside(document.querySelector('span')!);
            afterPaint();

            expect(logEvent).toHaveBeenCalledTimes(1);
            expect(notify).toHaveBeenCalledWith(
                expect.objectContaining({ kind: 'wallet', source: 'name' })
            );
        });

        it('reports Apple Pay beginning right after a tap as a wallet tap, on a timer', () => {
            startTracker();
            tapPlainDiv();

            expect(beginApplePay()).toBe('began');
            expect(notify).not.toHaveBeenCalled();
            jest.advanceTimersByTime(0);

            expect(notify).toHaveBeenCalledWith(
                expect.objectContaining({
                    kind: 'wallet',
                    source: 'api',
                    pathname: '/checkout',
                })
            );
            expect(logEvent).not.toHaveBeenCalled();
        });

        it('reports nothing when Apple Pay begins with no tap before it', () => {
            startTracker();

            beginApplePay();
            jest.advanceTimersByTime(0);

            expect(notify).not.toHaveBeenCalled();
        });

        it('reports nothing when the last tap was more than a second earlier', () => {
            startTracker();
            tapPlainDiv();
            jest.advanceTimersByTime(1001);

            beginApplePay();
            jest.advanceTimersByTime(0);

            expect(notify).not.toHaveBeenCalled();
        });

        it('reports nothing for a tap the page excluded from tracking', () => {
            startTracker();
            tapPlainDiv('data-mp-no-track');

            beginApplePay();
            jest.advanceTimersByTime(0);

            expect(notify).not.toHaveBeenCalled();
        });

        it('rethrows when Apple Pay fails to begin and reports nothing', () => {
            pay.ApplePaySession.prototype.begin = () => {
                throw new Error('no gesture');
            };
            startTracker();
            tapPlainDiv();

            expect(beginApplePay).toThrow('no gesture');
            jest.advanceTimersByTime(0);

            expect(notify).not.toHaveBeenCalled();
        });

        it('wraps begin once however many trackers start', () => {
            const begin = jest.fn(() => 'began');
            pay.ApplePaySession.prototype.begin = begin;
            startTracker();
            startTracker();
            tapPlainDiv();

            beginApplePay();
            jest.advanceTimersByTime(0);

            expect(begin).toHaveBeenCalledTimes(1);
            expect(notify).toHaveBeenCalledTimes(1);
        });

        it('leaves Apple Pay untouched without a Rokt kit', () => {
            const begin = pay.ApplePaySession.prototype.begin;
            startTracker(false);

            expect(pay.ApplePaySession.prototype.begin).toBe(begin);
        });

        it.each([
            ['under Global Privacy Control', () => {
                (navigator as any).globalPrivacyControl = true;
            }],
            ['without auto button tracking', () => {
                store.SDKConfig.flags.autoButtonTracking = false;
            }],
        ])('leaves Apple Pay untouched %s', (_, suppress) => {
            suppress();
            const begin = pay.ApplePaySession.prototype.begin;
            startTracker();

            expect(pay.ApplePaySession.prototype.begin).toBe(begin);
        });

        it("keeps the hook's marker out of the method's own keys", () => {
            const begin = pay.ApplePaySession.prototype.begin;
            startTracker();

            expect(pay.ApplePaySession.prototype.begin).not.toBe(begin);
            expect(Object.keys(pay.ApplePaySession.prototype.begin)).toEqual([]);
        });

        it('sends a tap that already reads as a wallet on the timer, before any paint, once', () => {
            startTracker();
            document.body.innerHTML =
                '<apple-pay-button buttonstyle="black" type="buy"></apple-pay-button>';
            listener(docAdd, 'click')(
                trustedClick(document.querySelector('apple-pay-button')!)
            );
            beginApplePay();
            jest.advanceTimersByTime(0);

            expect(notify).toHaveBeenCalledTimes(1);
            expect(notify).toHaveBeenCalledWith(
                expect.objectContaining({ kind: 'wallet', source: 'vendor' })
            );

            afterPaint();
            expect(notify).toHaveBeenCalledTimes(1);
        });

        it.each([
            ['under data-mp-no-track', '<div data-mp-no-track><button>Place order</button></div>'],
            ['inside a Rokt element', '<div data-core-type="placement"><button>Place order</button></div>'],
        ])('logs nothing and sends no intent for a confirm button %s', (_, html) => {
            startTracker();
            document.body.innerHTML = html;
            clickInside(document.querySelector('button')!);
            beginApplePay();
            afterPaint();

            expect(logEvent).not.toHaveBeenCalled();
            expect(notify).not.toHaveBeenCalled();
        });

        it('reports nothing while checkout intent is suppressed', () => {
            startTracker();
            tapPlainDiv();
            (navigator as any).globalPrivacyControl = true;

            beginApplePay();
            jest.advanceTimersByTime(0);

            expect(notify).not.toHaveBeenCalled();
        });

        it('reports nothing once the tracker is torn down', () => {
            const tracker = startTracker();
            tapPlainDiv();
            tracker.teardown();

            expect(beginApplePay()).toBe('began');
            jest.advanceTimersByTime(0);

            expect(notify).not.toHaveBeenCalled();
        });

        it('hands the kit one wallet tap for a named button and the session it begins', () => {
            startTracker();
            document.body.innerHTML =
                '<div id="applepay-checkout-btn"><span>Checkout with</span></div>';
            clickInside(document.querySelector('span')!);
            beginApplePay();
            afterPaint();

            expect(notify).toHaveBeenCalledTimes(1);
            expect(notify).toHaveBeenCalledWith(
                expect.objectContaining({ kind: 'wallet', source: 'name' })
            );
        });

        it("credits a vendor Apple Pay button's tap to its own rule, not the session", () => {
            startTracker();
            document.body.innerHTML =
                '<apple-pay-button buttonstyle="black" type="buy"></apple-pay-button>';
            listener(docAdd, 'click')(
                trustedClick(document.querySelector('apple-pay-button')!)
            );
            beginApplePay();
            afterPaint();

            expect(notify).toHaveBeenCalledTimes(1);
            expect(notify).toHaveBeenCalledWith(
                expect.objectContaining({ kind: 'wallet', source: 'vendor' })
            );
        });

        it('sends a confirm tap as itself when Apple Pay begins from it', () => {
            startTracker();
            listener(docAdd, 'click')(trustedClick(button('Place order')));
            beginApplePay();
            afterPaint();

            expect(notify).toHaveBeenCalledTimes(1);
            expect(notify).toHaveBeenCalledWith(
                expect.objectContaining({ kind: 'commit' })
            );
        });

        it('wraps begin once on a window whose earlier tracker lost its state', () => {
            const begin = pay.ApplePaySession.prototype.begin;
            const first = startTracker();
            delete (window as any)[WIN_BTN_KEY];
            startTracker();

            expect(pay.ApplePaySession.prototype.begin.__mpApplePayHook__).toBe(
                begin
            );
            first.teardown();
        });

        it("keeps the page's Apple Pay working when hearing it throws", () => {
            const tracker = startTracker();
            jest.spyOn(tracker, 'onApplePayBegin').mockImplementation(() => {
                throw new Error('boom');
            });
            tapPlainDiv();

            expect(beginApplePay()).toBe('began');
        });

        it('drops a session signal when tracking is cleared before it is sent', () => {
            const tracker = startTracker();
            tapPlainDiv();
            beginApplePay();
            tracker.clearPending();
            jest.advanceTimersByTime(0);

            expect(notify).not.toHaveBeenCalled();
        });

        it('forgets the last tap once tracking is cleared', () => {
            const tracker = startTracker();
            tapPlainDiv();
            tracker.clearPending();
            beginApplePay();
            jest.advanceTimersByTime(0);

            expect(notify).not.toHaveBeenCalled();
        });

        it("puts the page's own begin back on teardown", () => {
            const begin = pay.ApplePaySession.prototype.begin;
            const tracker = startTracker();
            expect(pay.ApplePaySession.prototype.begin).not.toBe(begin);

            tracker.teardown();

            expect(pay.ApplePaySession.prototype.begin).toBe(begin);
        });

        it('leaves a wrapper another script added later in place on teardown', () => {
            const tracker = startTracker();
            const ours = pay.ApplePaySession.prototype.begin;
            const theirs = function(this: unknown) {
                return ours.apply(this);
            };
            pay.ApplePaySession.prototype.begin = theirs;

            tracker.teardown();

            expect(pay.ApplePaySession.prototype.begin).toBe(theirs);
        });

        it('starts listening when reading Apple Pay throws', () => {
            delete pay.ApplePaySession;
            Object.defineProperty(window, 'ApplePaySession', {
                configurable: true,
                get() {
                    throw new Error('blocked');
                },
            });

            expect(() => startTracker()).not.toThrow();
            expect(docAdd).toHaveBeenCalledWith(
                'click',
                expect.any(Function),
                expect.anything()
            );
        });
    });
});
