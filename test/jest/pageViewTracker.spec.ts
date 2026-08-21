import {
    buildPageViewEvent,
    getActiveTracker,
    hasInitialPageViewFired,
    isNewPage,
    markInitialPageViewFired,
    PageViewTracker,
    patchHistory,
    resetPageViewTracking,
    supportsHistoryTracking,
    WIN_INIT_PV_KEY,
    WIN_TRACKER_KEY,
} from '../../src/pageViewTracker';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { EventType, MessageType } from '../../src/types';

// Capture the genuinely-native history methods at import time, before any
// tracker has a chance to monkey-patch them. Used to reset state between tests
// and to drive navigation without going through the tracker's wrapper.
const NATIVE_PUSH_STATE = window.history.pushState;
const NATIVE_REPLACE_STATE = window.history.replaceState;

const WRAPPED_MARKER = '__mpApvWrapped__';

// A wrapper installed by a third party (or an older SDK build) that already
// carries the marker, so our patch must decline to wrap on top of it.
const markedForeignWrapper = (): History['pushState'] => {
    const wrapper = function() {
        /* someone else's wrapper */
    } as History['pushState'];
    Object.defineProperty(wrapper, WRAPPED_MARKER, {
        value: true,
        enumerable: false,
    });
    return wrapper;
};

const unmarkedForeignWrapper = (): History['pushState'] =>
    function() {
        /* someone else's wrapper */
    } as History['pushState'];

// ---------------------------------------------------------------------------
// The pure helpers carry the interesting rules and need no DOM, no timers, and
// no tracker instance to assert.
// ---------------------------------------------------------------------------

describe('pageViewTracker pure helpers', () => {
    describe('#isNewPage', () => {
        it('should treat a different pathname as a new page', () => {
            expect(isNewPage('/a', '/b')).toBe(true);
        });

        it('should treat an identical pathname as the same page', () => {
            expect(isNewPage('/a', '/a')).toBe(false);
        });

        // The caller passes pathnames only, so query strings and hashes never
        // reach here — which is exactly why they cannot trigger a page view.
        it('should treat the first navigation after construction as new', () => {
            expect(isNewPage(null, '/a')).toBe(true);
        });
    });

    describe('#supportsHistoryTracking', () => {
        it('should reject a missing window (SSR)', () => {
            expect(supportsHistoryTracking(null)).toBe(false);
        });

        it('should reject a window with no History API', () => {
            expect(supportsHistoryTracking(({} as unknown) as Window)).toBe(
                false
            );
        });

        it('should reject a window whose pushState is not callable', () => {
            const win = ({
                history: { pushState: undefined },
                addEventListener: () => undefined,
            } as unknown) as Window;

            expect(supportsHistoryTracking(win)).toBe(false);
        });

        it('should reject a window that cannot register listeners', () => {
            const win = ({
                history: { pushState: () => undefined },
            } as unknown) as Window;

            expect(supportsHistoryTracking(win)).toBe(false);
        });

        it('should accept a browser window', () => {
            expect(supportsHistoryTracking(window)).toBe(true);
        });
    });

    describe('#buildPageViewEvent', () => {
        it('should build a PageView event from the supplied data alone', () => {
            const event = buildPageViewEvent({
                hostname: 'example.com',
                title: 'Cart',
                path: '/cart',
            });

            expect(event).toEqual({
                messageType: MessageType.PageView,
                name: 'PageView',
                eventType: EventType.Unknown,
                data: {
                    hostname: 'example.com',
                    title: 'Cart',
                    path: '/cart',
                },
            });
        });

        it('should not alias the caller data into the event', () => {
            const data = { hostname: 'example.com', title: 'Cart', path: '/cart' };
            const event = buildPageViewEvent(data);

            data.path = '/mutated-after-the-fact';

            expect(event.data.path).toBe('/cart');
        });
    });
});

describe('#patchHistory', () => {
    let onNavigate: jest.Mock;
    let log: jest.Mock;

    beforeEach(() => {
        onNavigate = jest.fn();
        log = jest.fn();
    });

    afterEach(() => {
        window.history.pushState = NATIVE_PUSH_STATE;
        window.history.replaceState = NATIVE_REPLACE_STATE;
        NATIVE_REPLACE_STATE.call(window.history, {}, '', '/');
    });

    it('should notify with the method that navigated, after it has run', () => {
        const undo = patchHistory(onNavigate, log);

        window.history.pushState({}, '', '/pushed');
        expect(onNavigate).toHaveBeenLastCalledWith('pushState');
        // The real method already ran by the time we are notified.
        expect(window.location.pathname).toBe('/pushed');

        window.history.replaceState({}, '', '/replaced');
        expect(onNavigate).toHaveBeenLastCalledWith('replaceState');
        expect(window.location.pathname).toBe('/replaced');

        undo();
    });

    it('should restore the native methods when undone', () => {
        const undo = patchHistory(onNavigate, log);
        undo();

        expect(window.history.pushState).toBe(NATIVE_PUSH_STATE);
        expect(window.history.replaceState).toBe(NATIVE_REPLACE_STATE);
    });

    it('should decline to wrap history that is already wrapped', () => {
        const foreignWrapper = markedForeignWrapper();
        window.history.pushState = foreignWrapper;

        expect(patchHistory(onNavigate, log)).toBeNull();
        expect(window.history.pushState).toBe(foreignWrapper);
        expect(log).toHaveBeenCalledWith(
            expect.stringContaining('already wrapped')
        );
    });

    // A third party may patch one of the two methods on top of ours. Undo must
    // decide per method: leave theirs in place, still restore ours.
    it('should leave a foreign wrapper in place but restore its own', () => {
        const undo = patchHistory(onNavigate, log);

        const foreignWrapper = unmarkedForeignWrapper();
        window.history.pushState = foreignWrapper;

        undo();

        expect(window.history.pushState).toBe(foreignWrapper);
        expect(window.history.replaceState).toBe(NATIVE_REPLACE_STATE);
    });

    it('should roll back and report null when assignment is rejected', () => {
        // A frozen/sealed History makes the assignment throw in strict mode.
        Object.defineProperty(window.history, 'pushState', {
            value: NATIVE_PUSH_STATE,
            writable: false,
            configurable: true,
        });

        try {
            expect(patchHistory(onNavigate, log)).toBeNull();
            expect(window.history.pushState).toBe(NATIVE_PUSH_STATE);
            expect(window.history.replaceState).toBe(NATIVE_REPLACE_STATE);
            expect(log).toHaveBeenCalledWith(
                expect.stringContaining('failed to patch history methods')
            );
        } finally {
            Object.defineProperty(window.history, 'pushState', {
                value: NATIVE_PUSH_STATE,
                writable: true,
                configurable: true,
            });
        }
    });

    // The rejection can land on the second assignment, leaving one wrapper
    // installed and one not. The rollback has to be per method or it either
    // leaks the pushState wrapper or restores a method it never replaced.
    it('should roll back the half that was installed when the second is rejected', () => {
        Object.defineProperty(window.history, 'replaceState', {
            value: NATIVE_REPLACE_STATE,
            writable: false,
            configurable: true,
        });

        try {
            expect(patchHistory(onNavigate, log)).toBeNull();
            expect(window.history.pushState).toBe(NATIVE_PUSH_STATE);
            expect(window.history.replaceState).toBe(NATIVE_REPLACE_STATE);

            // Nothing is left listening, so a navigation is not reported twice
            // (or at all) by a wrapper the caller believes it rolled back.
            NATIVE_PUSH_STATE.call(window.history, {}, '', '/after-rollback');
            expect(onNavigate).not.toHaveBeenCalled();
        } finally {
            Object.defineProperty(window.history, 'replaceState', {
                value: NATIVE_REPLACE_STATE,
                writable: true,
                configurable: true,
            });
        }
    });
});

// ---------------------------------------------------------------------------
// The tracker itself, asserted only through its public surface: init(),
// teardown(), isActive, the registry helpers, and the events it logs.
// ---------------------------------------------------------------------------

describe('PageViewTracker', () => {
    let mpInstance: IMParticleWebSDKInstance;
    let logEvent: jest.Mock;
    let resetSessionTimer: jest.Mock;
    let verbose: jest.Mock;

    const createTracker = (): PageViewTracker => new PageViewTracker(mpInstance);

    // Change the URL without triggering the tracker's patched pushState.
    const navigateNatively = (path: string): void => {
        NATIVE_PUSH_STATE.call(window.history, {}, '', path);
    };

    const loggedPaths = (): string[] =>
        logEvent.mock.calls.map(([event]) => event.data.path);

    beforeEach(() => {
        jest.useFakeTimers();

        logEvent = jest.fn();
        resetSessionTimer = jest.fn();
        verbose = jest.fn();

        mpInstance = ({
            Logger: { verbose },
            _SessionManager: { resetSessionTimer },
            _Events: { logEvent },
        } as unknown) as IMParticleWebSDKInstance;
    });

    afterEach(() => {
        // One call tears down whichever tracker is active and clears the window
        // flags — the same entry point the SDK uses, so the tests exercise it
        // rather than reaching around it.
        resetPageViewTracking();

        // Restore the native history methods and reset the URL so each test
        // starts from a clean `http://localhost/` (jsdom's default origin).
        window.history.pushState = NATIVE_PUSH_STATE;
        window.history.replaceState = NATIVE_REPLACE_STATE;
        NATIVE_REPLACE_STATE.call(window.history, {}, '', '/');

        jest.clearAllTimers();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    describe('#constructor', () => {
        it('should be side-effect free', () => {
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

            const tracker = createTracker();

            expect(tracker.isActive).toBe(false);
            expect(addEventListenerSpy).not.toHaveBeenCalled();
            expect(window.history.pushState).toBe(NATIVE_PUSH_STATE);
            expect(getActiveTracker()).toBeUndefined();
        });

        it('should not log page views before init()', () => {
            createTracker();

            window.history.pushState({}, '', '/never-tracked');
            jest.runAllTimers();

            expect(logEvent).not.toHaveBeenCalled();
        });
    });

    describe('#init - environment support', () => {
        it('should not start when the History API is unavailable', () => {
            // Simulate an unsupported environment by removing pushState.
            Object.defineProperty(window.history, 'pushState', {
                value: undefined,
                configurable: true,
                writable: true,
            });

            const tracker = createTracker();
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

            expect(() => tracker.init()).not.toThrow();
            expect(tracker.isActive).toBe(false);
            expect(getActiveTracker()).toBeUndefined();
            expect(addEventListenerSpy).not.toHaveBeenCalled();

            // Restore for afterEach cleanup.
            Object.defineProperty(window.history, 'pushState', {
                value: NATIVE_PUSH_STATE,
                configurable: true,
                writable: true,
            });
        });
    });

    describe('#init', () => {
        it('should become active and register itself', () => {
            const tracker = createTracker();
            tracker.init();

            expect(tracker.isActive).toBe(true);
            expect(getActiveTracker()).toBe(tracker);
        });

        // The seed is the pathname alone, so a query-string change against the
        // landing URL is still the same page.
        it('should seed the current page by pathname only', () => {
            navigateNatively('/dashboard?tab=1#section');

            const tracker = createTracker();
            tracker.init();

            window.history.replaceState({}, '', '/dashboard?tab=2');
            jest.runAllTimers();
            expect(logEvent).not.toHaveBeenCalled();

            window.history.pushState({}, '', '/settings');
            jest.runAllTimers();
            expect(loggedPaths()).toEqual(['/settings']);
        });

        it('should patch pushState/replaceState and register listeners', () => {
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

            const tracker = createTracker();
            tracker.init();

            expect(window.history.pushState).not.toBe(NATIVE_PUSH_STATE);
            expect(window.history.replaceState).not.toBe(NATIVE_REPLACE_STATE);
            expect(addEventListenerSpy).toHaveBeenCalledWith(
                'popstate',
                expect.any(Function)
            );
            expect(addEventListenerSpy).not.toHaveBeenCalledWith(
                'hashchange',
                expect.any(Function)
            );
        });

        // Q9.4 - Double init() patches only once without stacking (idempotency).
        it('should tear down first on a second init(), not stacking wrappers', () => {
            const tracker = createTracker();
            tracker.init();
            const firstWrapper = window.history.pushState;

            tracker.init();

            // After teardown-first + re-patch, the installed wrapper is a fresh
            // one wrapping the native method, never a wrapper wrapping a wrapper.
            expect(window.history.pushState).not.toBe(firstWrapper);

            // Proof that the second patch captured the native method and not the
            // first wrapper: tearing down leaves history exactly as it started.
            tracker.teardown();
            expect(window.history.pushState).toBe(NATIVE_PUSH_STATE);
        });

        // Q9.5 - A second wrapper/instance already present skips patching.
        it('should not wrap history that another wrapper already owns', () => {
            const foreignWrapper = markedForeignWrapper();
            window.history.pushState = foreignWrapper;

            const tracker = createTracker();
            tracker.init();

            expect(window.history.pushState).toBe(foreignWrapper);
            expect(verbose).toHaveBeenCalledWith(
                expect.stringContaining('already wrapped')
            );

            // Having declined to patch, teardown must not clobber the wrapper it
            // never owned.
            tracker.teardown();
            expect(window.history.pushState).toBe(foreignWrapper);
        });

        it('should mark its wrapper as non-enumerable', () => {
            const tracker = createTracker();
            tracker.init();

            const wrapper = window.history.pushState as History['pushState'] &
                Record<string, unknown>;
            expect(wrapper[WRAPPED_MARKER]).toBe(true);
            expect(Object.keys(wrapper)).not.toContain(WRAPPED_MARKER);
        });

        // Q9.8 - Frozen/sealed history throws on assignment, rolls back, and
        // init() doesn't escape while listeners still get added.
        it('should still listen for popstate when history cannot be patched', () => {
            // Make pushState non-writable so assignment throws in strict mode.
            Object.defineProperty(window.history, 'pushState', {
                value: NATIVE_PUSH_STATE,
                writable: false,
                configurable: true,
            });
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

            const tracker = createTracker();

            try {
                expect(() => tracker.init()).not.toThrow();

                // Assignment failed, so the native method is left in place...
                expect(window.history.pushState).toBe(NATIVE_PUSH_STATE);

                // ...but the navigation listener is still registered, so
                // back/forward navigation is still tracked.
                expect(addEventListenerSpy).toHaveBeenCalledWith(
                    'popstate',
                    expect.any(Function)
                );

                navigateNatively('/popstate-only');
                window.dispatchEvent(new PopStateEvent('popstate'));
                jest.runAllTimers();
                expect(loggedPaths()).toEqual(['/popstate-only']);

                expect(() => tracker.teardown()).not.toThrow();
            } finally {
                // Restore writability so afterEach can reset.
                Object.defineProperty(window.history, 'pushState', {
                    value: NATIVE_PUSH_STATE,
                    writable: true,
                    configurable: true,
                });
            }
        });
    });

    describe('navigation detection', () => {
        let tracker: PageViewTracker;

        beforeEach(() => {
            navigateNatively('/');
            tracker = createTracker();
            tracker.init();
        });

        // Q9.1 - Same-path replaceState should not fire a view (dedup).
        // Q9.9 - Landing page isn't double-logged after the init-time view.
        it('should not fire a page view when the path is unchanged', () => {
            window.history.replaceState({}, '', '/');
            jest.runAllTimers();

            expect(logEvent).not.toHaveBeenCalled();
        });

        // Dedup keys on pathname only, so a query-string-only change is treated
        // as the same page and does not fire.
        it('should not fire a view on a query-string-only change', () => {
            window.history.pushState({}, '', '/?tab=settings');
            jest.runAllTimers();

            expect(logEvent).not.toHaveBeenCalled();
        });

        // Hash support is deferred to a follow-up; a hash-only change leaves the
        // pathname unchanged and does not fire.
        it('should not fire a view on a hash-only change', () => {
            window.history.pushState({}, '', '/#/details');
            jest.runAllTimers();

            expect(logEvent).not.toHaveBeenCalled();
        });

        // Q9.3 - A real path change produces one deferred view after flush.
        it('should defer the page view until the timer flushes', () => {
            window.history.pushState({}, '', '/products');

            // Deferred: nothing fires synchronously.
            expect(logEvent).not.toHaveBeenCalled();

            jest.runAllTimers();
            expect(logEvent).toHaveBeenCalledTimes(1);
        });

        // The accepted path is recorded synchronously, so a return trip to the
        // previous URL in the same tick is a fresh page view rather than a dedup.
        it('should record the accepted path before the deferred fire', () => {
            window.history.pushState({}, '', '/products');
            window.history.pushState({}, '', '/');
            jest.runAllTimers();

            expect(loggedPaths()).toEqual(['/products', '/']);
        });

        it('should fire a view on popstate navigation', () => {
            navigateNatively('/back-target');
            window.dispatchEvent(new PopStateEvent('popstate'));
            jest.runAllTimers();

            expect(logEvent).toHaveBeenCalledTimes(1);
        });

        // Hash support is deferred to a follow-up: the tracker no longer listens
        // for hashchange, so a hash-route navigation does not fire.
        it('should not fire a view on hashchange navigation', () => {
            navigateNatively('/#/new-hash');
            window.dispatchEvent(new HashChangeEvent('hashchange'));
            jest.runAllTimers();

            expect(logEvent).not.toHaveBeenCalled();
        });

        it('should fire a view via replaceState when the path changes', () => {
            window.history.replaceState({}, '', '/replaced');
            jest.runAllTimers();

            expect(logEvent).toHaveBeenCalledTimes(1);
        });
    });

    // Q9.10 - Rapid same-tick /a -> /b -> /c fires two events.
    describe('rapid same-tick navigation', () => {
        it('should fire one view per accepted change', () => {
            navigateNatively('/a');
            const tracker = createTracker();
            tracker.init(); // seeds the current page as '/a'

            window.history.pushState({}, '', '/b');
            window.history.pushState({}, '', '/c');

            jest.runAllTimers();

            // /a is the seed; /b and /c are the two accepted changes.
            expect(logEvent).toHaveBeenCalledTimes(2);
        });

        // Each deferred fire must carry the path captured when its navigation
        // was accepted, not the final live location. Before the fix both fires
        // read window.location at flush time and both reported '/c'.
        it('should record each intermediate path, not the final URL', () => {
            navigateNatively('/a');
            const tracker = createTracker();
            tracker.init();

            window.history.pushState({}, '', '/b');
            window.history.pushState({}, '', '/c');

            jest.runAllTimers();

            expect(loggedPaths()).toEqual(['/b', '/c']);
        });
    });

    describe('page view payload', () => {
        it('should fire a PageView event carrying path, title, and hostname', () => {
            navigateNatively('/');
            const tracker = createTracker();
            tracker.init();

            window.document.title = 'Next Page';
            window.history.pushState({}, '', '/next?q=1#top');
            jest.runAllTimers();

            expect(logEvent).toHaveBeenCalledTimes(1);
            const [event] = logEvent.mock.calls[0];
            expect(event).toMatchObject({
                messageType: MessageType.PageView,
                name: 'PageView',
                data: {
                    hostname: 'localhost',
                    title: 'Next Page',
                    path: '/next',
                },
            });
        });

        // The title is read at flush time, not when the navigation is accepted,
        // so a router that sets document.title during its render commit is
        // reflected in the event.
        it('should read the title at flush time, not at navigation time', () => {
            navigateNatively('/');
            const tracker = createTracker();
            tracker.init();

            window.document.title = 'Before Render';
            window.history.pushState({}, '', '/next');
            window.document.title = 'After Render';

            jest.runAllTimers();

            expect(logEvent.mock.calls[0][0].data.title).toBe('After Render');
        });
    });

    describe('deferred fire behavior', () => {
        let tracker: PageViewTracker;

        beforeEach(() => {
            navigateNatively('/');
            tracker = createTracker();
            tracker.init();
        });

        // Q9.11 - Navigation triggers resetSessionTimer() to renew the session.
        it('should call resetSessionTimer before logging the page view', () => {
            const callOrder: string[] = [];
            resetSessionTimer.mockImplementation(() =>
                callOrder.push('resetSessionTimer')
            );
            logEvent.mockImplementation(() => callOrder.push('logEvent'));

            window.history.pushState({}, '', '/next');
            jest.runAllTimers();

            expect(callOrder).toEqual(['resetSessionTimer', 'logEvent']);
        });

        it('should abort a queued fire if torn down before the timer flushes', () => {
            window.history.pushState({}, '', '/pending');

            // Tear down before the deferred callback runs.
            tracker.teardown();
            jest.runAllTimers();

            expect(logEvent).not.toHaveBeenCalled();
            expect(resetSessionTimer).not.toHaveBeenCalled();
        });

        // The navigation handler runs inside the host page's own pushState call,
        // so a throwing collaborator must never propagate into the router.
        it('should isolate errors from the navigation handler', () => {
            verbose.mockImplementationOnce(() => {
                throw new Error('boom');
            });

            expect(() =>
                window.history.pushState({}, '', '/explode')
            ).not.toThrow();
            expect(window.location.pathname).toBe('/explode');
            expect(verbose).toHaveBeenCalledWith(
                expect.stringContaining('navigation handler threw')
            );
        });
    });

    describe('#teardown', () => {
        // Q9.6 - After init() then teardown, the original is restored when
        // still our wrapper.
        it('should restore native history methods and remove listeners', () => {
            const removeEventListenerSpy = jest.spyOn(
                window,
                'removeEventListener'
            );

            const tracker = createTracker();
            tracker.init();
            tracker.teardown();

            expect(window.history.pushState).toBe(NATIVE_PUSH_STATE);
            expect(window.history.replaceState).toBe(NATIVE_REPLACE_STATE);
            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                'popstate',
                expect.any(Function)
            );
            expect(tracker.isActive).toBe(false);
        });

        // Q9.7 - Teardown with another wrapper on top leaves the original in
        // place but still removes listeners.
        it('should leave a foreign wrapper in place but still clean up', () => {
            const removeEventListenerSpy = jest.spyOn(
                window,
                'removeEventListener'
            );

            const tracker = createTracker();
            tracker.init();

            // A third party patches pushState on top of ours after init.
            const foreignWrapper = unmarkedForeignWrapper();
            window.history.pushState = foreignWrapper;

            tracker.teardown();

            // Our wrapper is no longer installed, so we must not clobber the
            // foreign one by restoring the native method. replaceState was never
            // touched by them, so it still comes back.
            expect(window.history.pushState).toBe(foreignWrapper);
            expect(window.history.replaceState).toBe(NATIVE_REPLACE_STATE);
            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                'popstate',
                expect.any(Function)
            );
            expect(tracker.isActive).toBe(false);
        });

        it('should deregister itself', () => {
            const tracker = createTracker();
            tracker.init();
            expect(getActiveTracker()).toBe(tracker);

            tracker.teardown();

            expect(getActiveTracker()).toBeUndefined();
        });

        it('should be safe to call before init()', () => {
            const tracker = createTracker();
            expect(() => tracker.teardown()).not.toThrow();
            expect(tracker.isActive).toBe(false);
        });

        it('should be safe to call twice', () => {
            const tracker = createTracker();
            tracker.init();
            tracker.teardown();

            expect(() => tracker.teardown()).not.toThrow();
            expect(window.history.pushState).toBe(NATIVE_PUSH_STATE);
        });

        // Teardown can only restore a history method that is still ours. If a
        // third party wrapped *our* wrapper, ours stays reachable and keeps being
        // called after teardown — an orphaned wrapper attached to a dead tracker.
        //
        // No event fires either way (the deferred flush aborts when inactive), so
        // this asserts the stronger property: a dead tracker does no work at all.
        // Without the guard it still walks the dedup path and queues a timer just
        // to throw the result away.
        it('should do no work when an orphaned wrapper still calls in', () => {
            navigateNatively('/');
            const tracker = createTracker();
            tracker.init();

            // A third party wraps ours, delegating to it.
            const ourWrapper = window.history.pushState;
            window.history.pushState = function(
                this: History,
                ...args: Parameters<History['pushState']>
            ): void {
                return ourWrapper.apply(this, args);
            } as History['pushState'];

            tracker.teardown();
            verbose.mockClear();

            window.history.pushState({}, '', '/orphaned');
            jest.runAllTimers();

            expect(logEvent).not.toHaveBeenCalled();
            expect(resetSessionTimer).not.toHaveBeenCalled();
            // Bailed before the dedup path, so nothing was accepted or deferred.
            expect(verbose).not.toHaveBeenCalledWith(
                expect.stringContaining('[accept]')
            );
            expect(verbose).not.toHaveBeenCalledWith(
                expect.stringContaining('[defer]')
            );
        });

        it('should stop firing page views after teardown', () => {
            const tracker = createTracker();
            tracker.init();
            tracker.teardown();

            // Navigate via the (now restored) native method + event.
            navigateNatively('/after-teardown');
            window.dispatchEvent(new PopStateEvent('popstate'));
            jest.runAllTimers();

            expect(logEvent).not.toHaveBeenCalled();
        });
    });

    // Regression: Next.js re-evaluates the SDK module on each SPA navigation,
    // resetting all module-level state. Each fresh module creates a new
    // PageViewTracker and calls init(). Without the registry handoff, each
    // init() stacks a new pushState wrapper on top of the previous one and fires
    // N page views per navigation after N module loads.
    describe('handoff between module loads', () => {
        it('should retire the tracker left by a previous module load', () => {
            // Simulate a tracker left behind by a previous module load: the old
            // module is gone, so the only handle to it is the registry.
            const staleTracker = createTracker();
            staleTracker.init();

            const newTracker = createTracker();
            newTracker.init();

            expect(staleTracker.isActive).toBe(false);
            expect(newTracker.isActive).toBe(true);
            expect(getActiveTracker()).toBe(newTracker);
        });

        it('should not fire duplicate page views after a module re-evaluation', () => {
            const trackerA = createTracker();
            trackerA.init();

            const trackerB = createTracker();
            trackerB.init();

            // One navigation should produce exactly one page view.
            window.history.pushState({}, '', '/next');
            jest.runAllTimers();

            expect(logEvent).toHaveBeenCalledTimes(1);
        });

        // Regression: a navigation queued by the stale tracker (setTimeout not
        // yet flushed) must be transferred to the replacement tracker so it is
        // not silently dropped on module re-evaluation.
        it('should transfer a pending page view from the retired tracker', () => {
            const staleTracker = createTracker();
            staleTracker.init(); // seeds the current page as '/'

            // Route change detected by the stale tracker — deferred fire queued,
            // timer not yet flushed.
            window.history.pushState({}, '', '/route-a');

            // Module re-evaluation: the new tracker inherits the pending
            // navigation and retires the stale one.
            const newTracker = createTracker();
            newTracker.init();

            jest.runAllTimers();
            expect(loggedPaths()).toEqual(['/route-a']);

            // A subsequent navigation from the new tracker fires as normal.
            logEvent.mockClear();
            window.history.pushState({}, '', '/route-b');
            jest.runAllTimers();
            expect(loggedPaths()).toEqual(['/route-b']);
        });

        // Regression: same-instance re-init (e.g. a SPA framework calling
        // mParticle.init() on navigation) must not drop a page view queued
        // before the re-init call.
        it('should preserve a pending page view when the same tracker re-inits', () => {
            const tracker = createTracker();
            tracker.init(); // seeds the current page as '/'

            // Route change queues a deferred fire — timer not yet flushed.
            window.history.pushState({}, '', '/about');

            // SPA framework calls mParticle.init() again before the timer fires.
            tracker.init();

            jest.runAllTimers();
            expect(loggedPaths()).toEqual(['/about']);
        });
    });

    describe('window-scoped state', () => {
        it('should not report an initial page view before one is marked', () => {
            expect(hasInitialPageViewFired()).toBe(false);
        });

        it('should report the initial page view once marked', () => {
            markInitialPageViewFired();
            expect(hasInitialPageViewFired()).toBe(true);
        });

        it('should clear the tracker and the initial page view flag on reset', () => {
            const tracker = createTracker();
            tracker.init();
            markInitialPageViewFired();

            resetPageViewTracking();

            expect(tracker.isActive).toBe(false);
            expect(getActiveTracker()).toBeUndefined();
            expect(hasInitialPageViewFired()).toBe(false);
            expect(window.history.pushState).toBe(NATIVE_PUSH_STATE);
        });

        it('should be safe to reset when nothing is tracking', () => {
            expect(() => resetPageViewTracking()).not.toThrow();
        });

        // The window keys are a debugging contract: `window.__mpApvTracker__` is
        // what you inspect in a console to see whether APV is live. Renaming
        // either of them silently breaks that, so pin the literals.
        it('should expose its state under the documented window keys', () => {
            const tracker = createTracker();
            tracker.init();
            markInitialPageViewFired();

            expect(WIN_TRACKER_KEY).toBe('__mpApvTracker__');
            expect(WIN_INIT_PV_KEY).toBe('__mpApvInitPVLogged__');
            expect((window as any).__mpApvTracker__).toBe(tracker);
            expect((window as any).__mpApvInitPVLogged__).toBe(true);
        });
    });
});
