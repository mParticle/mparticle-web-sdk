import { BatchUploader } from '../../../src/batchUploader';
import { AUTO_BUTTON_ATTRIBUTE } from '../../../src/buttonTracking/buttonClickEvent';
import {
    ButtonTracker,
    getActiveButtonTracker,
    resetButtonTracking,
    WIN_BTN_KEY,
} from '../../../src/buttonTracking/buttonTracker';
import * as checkoutIntent from '../../../src/buttonTracking/checkoutIntent';
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
        it('finds the control once and skips checkout intent without a Rokt kit', () => {
            const find = jest.spyOn(controls, 'findControl');
            const classify = jest.spyOn(checkoutIntent, 'classifyIntentControl');
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
            expect(notify).toHaveBeenCalledWith({ kind: 'commit', t: 1000000 });
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

            click(button('Add to cart'));
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
            expect(notify).toHaveBeenCalledWith({ kind: 'checkout_step', t: 1000000 });
        });

        it('logs an outbound link click with its link type', () => {
            startTracker();
            const link = document.createElement('a');
            link.href = 'https://example.org/help';
            link.textContent = 'Help centre';
            document.body.appendChild(link);

            click(link);

            expect(logEvent).toHaveBeenCalledTimes(1);
            expect(logEvent.mock.calls[0][0].name).toBe('Auto Button Click');
            expect(logEvent.mock.calls[0][0].data).toEqual(
                expect.objectContaining({
                    element: 'link',
                    link_type: 'outbound',
                    link_domain: 'example.org',
                    label: 'help centre',
                })
            );
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

        it('uploads a click shortly after it, without waiting for the batch interval', () => {
            startUploader(10000);
            startTracker();

            click(button('Add to cart'));
            expect(fetchMock).not.toHaveBeenCalled();

            jest.advanceTimersByTime(100);

            expect(upload).toHaveBeenCalledTimes(1);
            expect(uploadedEventNames()).toEqual([['Auto Button Click']]);
        });

        it('sends a burst of taps as one upload carrying every click', () => {
            startUploader(10000);
            startTracker();
            const target = button('Add');

            // Taps 60 ms apart, each inside the wait the previous one started.
            for (let i = 0; i < 4; i++) {
                click(target);
                jest.advanceTimersByTime(20);
            }
            expect(fetchMock).not.toHaveBeenCalled();

            jest.advanceTimersByTime(100);

            expect(uploadedEventNames()).toEqual([
                [
                    'Auto Button Click',
                    'Auto Button Click',
                    'Auto Button Click',
                    'Auto Button Click',
                ],
            ]);
        });

        it('uploads clicks further apart than the wait separately', () => {
            startUploader(10000);
            startTracker();
            const target = button('Add');

            click(target);
            jest.advanceTimersByTime(110);
            expect(uploadedEventNames()).toEqual([['Auto Button Click']]);

            click(target);
            jest.advanceTimersByTime(100);

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
        ])('drops a pending upload on %s', (_, stop) => {
            startUploader(10000);
            const tracker = startTracker();

            click(button('Add'));
            stop(tracker);
            jest.advanceTimersByTime(100);

            expect(upload).not.toHaveBeenCalled();
        });

        it.each(['before', 'after'])(
            'leaves a click to the exit upload when the page is left %s the next paint',
            when => {
                const beacons: string[] = [];
                (navigator as any).sendBeacon = jest.fn(() => true);
                jest.spyOn(window, 'Blob').mockImplementation(
                    (parts: BlobPart[]) => {
                        beacons.push(parts[0] as string);
                        return {} as Blob;
                    }
                );
                startUploader(10000);
                startTracker();

                listener(docAdd, 'click')(trustedClick(button('Add')));
                if (when === 'after') {
                    afterPaint();
                }
                window.dispatchEvent(new Event('pagehide'));
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
