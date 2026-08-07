import { PageViewTracker } from '../../src/pageViewTracker';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { MessageType } from '../../src/types';

// Capture the genuinely-native history methods at import time, before any
// tracker has a chance to monkey-patch them. Used to reset state between tests
// and to drive navigation without going through the tracker's wrapper.
const NATIVE_PUSH_STATE = window.history.pushState;
const NATIVE_REPLACE_STATE = window.history.replaceState;

const WRAPPED_MARKER = '__mpApvWrapped__';

describe('PageViewTracker', () => {
    let mpInstance: IMParticleWebSDKInstance;
    let logEvent: jest.Mock;
    let resetSessionTimer: jest.Mock;
    let verbose: jest.Mock;

    // Every tracker built during a test is registered here so afterEach can
    // tear it down. Trackers add global window listeners in init(); without
    // teardown those listeners leak across tests and fire on later navigations.
    let trackers: PageViewTracker[];

    const createTracker = (): PageViewTracker => {
        const tracker = new PageViewTracker(mpInstance);
        trackers.push(tracker);
        return tracker;
    };

    // Change the URL without triggering the tracker's patched pushState.
    const navigateNatively = (path: string): void => {
        NATIVE_PUSH_STATE.call(window.history, {}, '', path);
    };

    beforeEach(() => {
        jest.useFakeTimers();
        trackers = [];

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
        // Tear down every tracker so its window listeners don't leak into the
        // next test. Swallow errors from trackers whose mocks were rigged to
        // throw.
        trackers.forEach(tracker => {
            try {
                tracker.teardown();
            } catch (e) {
                /* ignore */
            }
        });

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
        it('should be side-effect free and store the mpInstance', () => {
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

            const tracker = createTracker();

            expect(tracker.mpInstance).toBe(mpInstance);
            expect(tracker['isActive']).toBe(false);
            expect(tracker['lastPath']).toBeNull();
            expect(addEventListenerSpy).not.toHaveBeenCalled();
            expect(window.history.pushState).toBe(NATIVE_PUSH_STATE);
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
            expect(tracker['isActive']).toBe(false);
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
        it('should seed lastPath with the pathname only at init time', () => {
            navigateNatively('/dashboard?tab=1#section');

            const tracker = createTracker();
            tracker.init();

            expect(tracker['lastPath']).toBe('/dashboard');
            expect(tracker['isActive']).toBe(true);
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

            const teardownSpy = jest.spyOn(tracker, 'teardown');
            tracker.init();

            expect(teardownSpy).toHaveBeenCalled();
            // After teardown-first + re-patch, the installed wrapper is a fresh
            // one wrapping the native method, never a wrapper wrapping a wrapper.
            expect(window.history.pushState).not.toBe(firstWrapper);
            expect(tracker['originalPushState']).toBe(NATIVE_PUSH_STATE);
        });
    });

    describe('#patchHistoryMethods', () => {
        // Q9.5 - A second wrapper/instance already present skips patching.
        it('should skip patching when history is already wrapped (marker guard)', () => {
            const foreignWrapper = function() {
                /* someone else's wrapper */
            } as History['pushState'];
            Object.defineProperty(foreignWrapper, WRAPPED_MARKER, {
                value: true,
                enumerable: false,
            });
            window.history.pushState = foreignWrapper;

            const tracker = createTracker();
            tracker.init();

            expect(window.history.pushState).toBe(foreignWrapper);
            expect(tracker['originalPushState']).toBeNull();
            expect(tracker['pushStateWrapper']).toBeNull();
            expect(verbose).toHaveBeenCalledWith(
                expect.stringContaining('already wrapped')
            );
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
        it('should roll back and not throw when history assignment fails', () => {
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
                expect(tracker['pushStateWrapper']).toBeNull();
                expect(tracker['originalPushState']).toBeNull();

                // ...but the navigation listener is still registered.
                expect(addEventListenerSpy).toHaveBeenCalledWith(
                    'popstate',
                    expect.any(Function)
                );
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

        it('should update lastPath synchronously when a change is accepted', () => {
            window.history.pushState({}, '', '/products');
            expect(tracker['lastPath']).toBe('/products');
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
            tracker.init(); // seeds lastPath = '/a'

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

            const paths = logEvent.mock.calls.map(([event]) => event.data.path);
            expect(paths).toEqual(['/b', '/c']);
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

        // safeHandleNavigation isolates errors from the *synchronous* handler
        // so a throwing handler never breaks the app's own pushState call.
        it('should isolate synchronous errors from the navigation handler', () => {
            jest.spyOn(
                tracker as PageViewTracker & {
                    handleNavigation: () => void;
                },
                'handleNavigation'
            ).mockImplementation(() => {
                throw new Error('boom');
            });

            expect(() =>
                window.history.pushState({}, '', '/explode')
            ).not.toThrow();
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
            expect(tracker['isActive']).toBe(false);
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
            const foreignWrapper = function() {
                /* someone else's wrapper */
            } as History['pushState'];
            window.history.pushState = foreignWrapper;

            tracker.teardown();

            // Our wrapper is no longer installed, so we must not clobber the
            // foreign one by restoring the native method.
            expect(window.history.pushState).toBe(foreignWrapper);
            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                'popstate',
                expect.any(Function)
            );
            expect(tracker['isActive']).toBe(false);
        });

        // A third party may patch only one of the two methods. Teardown must
        // decide per-method: leave the foreign pushState in place while still
        // restoring our untouched replaceState (otherwise it leaks, and a
        // later re-init stacks a second wrapper on top of it).
        it('should restore replaceState even when pushState is foreign', () => {
            const tracker = createTracker();
            tracker.init();

            const foreignWrapper = function() {
                /* someone else's wrapper */
            } as History['pushState'];
            window.history.pushState = foreignWrapper;

            tracker.teardown();

            expect(window.history.pushState).toBe(foreignWrapper);
            expect(window.history.replaceState).toBe(NATIVE_REPLACE_STATE);
            expect(tracker['isActive']).toBe(false);
        });

        it('should be safe to call before init()', () => {
            const tracker = createTracker();
            expect(() => tracker.teardown()).not.toThrow();
            expect(tracker['isActive']).toBe(false);
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
});
