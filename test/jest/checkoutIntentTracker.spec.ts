import {
    CheckoutIntentTracker,
    getActiveCheckoutIntentTracker,
    resetCheckoutIntentTracking,
    WIN_CIT_KEY,
} from '../../src/checkoutIntentTracker';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import RoktManager, { IRoktKit } from '../../src/roktManager';
import { IKitConfigs } from '../../src/configAPIClient';
import { IMParticleUser } from '../../src/identity-user-interfaces';
import { SDKIdentityApi } from '../../src/identity.interfaces';
import { IStore } from '../../src/store';

type Listener = (event: unknown) => void;

describe('CheckoutIntentTracker', () => {
    let notify: jest.Mock;
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

    const startTracker = (): CheckoutIntentTracker => {
        const tracker = new CheckoutIntentTracker(makeInstance());
        tracker.init();
        return tracker;
    };

    const click = (target: Element) => {
        listener(docAdd, 'click')(trustedClick(target));
        jest.advanceTimersByTime(0);
    };

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(1000000);
        window.history.replaceState({}, '', '/checkout');
        notify = jest.fn();
        store = {
            isEnabled: true,
            SDKConfig: { flags: { checkoutIntent: true } },
        };
        roktManager = new RoktManager('checkout-intent-test');
        initManager();
        roktManager.attachKit(({
            filters: {},
            launcher: {},
            onCheckoutIntent: notify,
        } as unknown) as IRoktKit);
        resetCheckoutIntentTracking();
        docAdd = jest.spyOn(document, 'addEventListener');
        docRemove = jest.spyOn(document, 'removeEventListener');
        winAdd = jest.spyOn(window, 'addEventListener');
        winRemove = jest.spyOn(window, 'removeEventListener');
    });

    afterEach(() => {
        resetCheckoutIntentTracking();
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

    it('ignores untrusted events', () => {
        startTracker();

        button('Place order').click();
        jest.advanceTimersByTime(0);

        expect(notify).not.toHaveBeenCalled();
    });

    it('ignores clicks that are not checkout controls', () => {
        startTracker();

        click(button('Add to cart'));

        expect(notify).not.toHaveBeenCalled();
    });

    it('never cancels or stops the event', () => {
        startTracker();
        const event = trustedClick(button('Place order'));

        listener(docAdd, 'click')(event);
        jest.advanceTimersByTime(0);

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
        jest.advanceTimersByTime(0);

        expect(notify).toHaveBeenCalledWith({ kind: 'commit', t: 1000000 });
    });

    it('ignores a submit without a submitter when no commit click came first', () => {
        startTracker();

        listener(docAdd, 'submit')(trustedSubmit(null));
        jest.advanceTimersByTime(0);

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
        jest.advanceTimersByTime(0);

        expect(notify).toHaveBeenCalledWith({ kind: 'commit', t: 1001000 });
    });

    it('ignores a submit without a submitter more than 1 second after a commit click', () => {
        startTracker();
        click(button('Place order'));
        notify.mockClear();

        window.history.replaceState({}, '', '/checkout/review');
        jest.setSystemTime(1001001);
        listener(docAdd, 'submit')(trustedSubmit(null));
        jest.advanceTimersByTime(0);

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
        jest.advanceTimersByTime(0);

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
        jest.advanceTimersByTime(0);

        expect(notify).toHaveBeenCalledWith({ kind: 'frame', t: 1000000 });
    });

    describe('privacy gates', () => {
        const gates: Array<[string, () => void]> = [
            ['the user has opted out', () => (store.isEnabled = false)],
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
                () => (store.SDKConfig.flags.checkoutIntent = false),
            ],
        ];

        it.each(gates)('does not attach when %s', (_, apply) => {
            apply();

            const tracker = startTracker();

            expect(tracker.isActive).toBe(false);
            expect(docAdd).not.toHaveBeenCalledWith(
                'click',
                expect.any(Function),
                expect.anything()
            );
        });

        it.each(gates)('drops a signal when %s after attaching', (_, apply) => {
            startTracker();
            apply();

            click(button('Place order'));

            expect(notify).not.toHaveBeenCalled();
        });
    });

    it('ignores a click made while opted out even if opt-in returns before classification', () => {
        startTracker();
        const handler = listener(docAdd, 'click');
        store.isEnabled = false;

        handler(trustedClick(button('Place order')));
        store.isEnabled = true;
        jest.advanceTimersByTime(0);

        expect(notify).not.toHaveBeenCalled();
    });

    it('removes its listeners on teardown and drops queued work', () => {
        const tracker = startTracker();
        const handler = listener(docAdd, 'click');

        handler(trustedClick(button('Place order')));
        tracker.teardown();
        jest.advanceTimersByTime(0);

        expect(notify).not.toHaveBeenCalled();
        expect(docRemove).toHaveBeenCalledWith('click', handler, true);
        expect(docRemove).toHaveBeenCalledWith('submit', handler, true);
        expect(winRemove).toHaveBeenCalledWith('blur', handler);
        expect(winRemove).toHaveBeenCalledWith(
            'pageshow',
            listener(winAdd, 'pageshow')
        );
        expect(tracker.isActive).toBe(false);
        expect(getActiveCheckoutIntentTracker()).toBeUndefined();
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
        jest.advanceTimersByTime(0);

        expect(notify).not.toHaveBeenCalled();
    });

    it('keeps queued work on an ordinary pageshow', () => {
        startTracker();

        listener(docAdd, 'click')(trustedClick(button('Place order')));
        listener(winAdd, 'pageshow')({ persisted: false });
        jest.advanceTimersByTime(0);

        expect(notify).toHaveBeenCalledTimes(1);
    });

    it('buffers a signal under the path it was raised on', () => {
        roktManager = new RoktManager('checkout-intent-test');
        initManager();
        startTracker();

        listener(docAdd, 'click')(trustedClick(button('Place order')));
        window.history.replaceState({}, '', '/order/confirmation');
        jest.advanceTimersByTime(0);
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
        expect((window as any)[WIN_CIT_KEY].tracker).toBe(second);

        second.init();
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
