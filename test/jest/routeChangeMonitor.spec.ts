import {
    subscribeToRouteChange,
    resetRouteChangeMonitor,
    RouteChangeSource,
    WIN_ROUTE_MONITOR_KEY,
} from '../../src/routeChangeMonitor';

describe('routeChangeMonitor', () => {
    let originalPushState: History['pushState'];
    let originalReplaceState: History['replaceState'];

    beforeEach(() => {
        originalPushState = window.history.pushState;
        originalReplaceState = window.history.replaceState;
        window.history.replaceState({}, '', '/start');
        resetRouteChangeMonitor();
    });

    afterEach(() => {
        resetRouteChangeMonitor();
        window.history.pushState = originalPushState;
        window.history.replaceState = originalReplaceState;
    });

    it('reports pushState, replaceState and popstate to a subscriber', () => {
        const seen: RouteChangeSource[] = [];
        subscribeToRouteChange('a', source => seen.push(source));

        window.history.pushState({}, '', '/a');
        window.history.replaceState({}, '', '/b');
        window.dispatchEvent(new PopStateEvent('popstate'));

        expect(seen).toEqual(['pushState', 'replaceState', 'popstate']);
    });

    it('patches History only once for many subscribers', () => {
        subscribeToRouteChange('a', () => undefined);
        const afterFirst = window.history.pushState;

        subscribeToRouteChange('b', () => undefined);

        expect(window.history.pushState).toBe(afterFirst);
    });

    it('fans one navigation out to every subscriber', () => {
        const a: string[] = [];
        const b: string[] = [];
        subscribeToRouteChange('a', () => a.push('a'));
        subscribeToRouteChange('b', () => b.push('b'));

        window.history.pushState({}, '', '/a');

        expect(a).toEqual(['a']);
        expect(b).toEqual(['b']);
    });

    it('replaces the listener already registered under the same key', () => {
        const earlier: string[] = [];
        const later: string[] = [];
        subscribeToRouteChange('owner', () => earlier.push('earlier'));
        subscribeToRouteChange('owner', () => later.push('later'));

        window.history.pushState({}, '', '/a');

        expect(earlier).toEqual([]);
        expect(later).toEqual(['later']);
    });

    it('does not let a replaced listener unsubscribe its replacement', () => {
        const seen: string[] = [];
        const stopEarlier = subscribeToRouteChange('owner', () => undefined);
        subscribeToRouteChange('owner', () => seen.push('later'));

        stopEarlier();
        window.history.pushState({}, '', '/a');

        expect(seen).toEqual(['later']);
        expect(window.history.pushState).not.toBe(originalPushState);
    });

    it('keeps the other subscribers running when one throws', () => {
        const seen: string[] = [];
        subscribeToRouteChange('a', () => {
            throw new Error('subscriber blew up');
        });
        subscribeToRouteChange('b', () => seen.push('still here'));

        expect(() => window.history.pushState({}, '', '/a')).not.toThrow();
        expect(seen).toEqual(['still here']);
    });

    it('stops reporting to a subscriber that unsubscribes, and leaves the others', () => {
        const a: string[] = [];
        const b: string[] = [];
        const stopA = subscribeToRouteChange('a', () => a.push('a'));
        subscribeToRouteChange('b', () => b.push('b'));

        stopA();
        window.history.pushState({}, '', '/a');

        expect(a).toEqual([]);
        expect(b).toEqual(['b']);
    });

    it('is safe to unsubscribe twice', () => {
        const stop = subscribeToRouteChange('a', () => undefined);

        stop();
        expect(() => stop()).not.toThrow();
    });

    it('restores History once the last subscriber leaves', () => {
        const stopA = subscribeToRouteChange('a', () => undefined);
        const stopB = subscribeToRouteChange('b', () => undefined);

        stopA();
        expect(window.history.pushState).not.toBe(originalPushState);

        stopB();
        expect(window.history.pushState).toBe(originalPushState);
        expect(window.history.replaceState).toBe(originalReplaceState);
    });

    it('does not report after the last subscriber has left', () => {
        const seen: string[] = [];
        const stop = subscribeToRouteChange('a', () => seen.push('x'));
        stop();

        window.history.pushState({}, '', '/a');

        expect(seen).toEqual([]);
    });

    it('re-patches when a subscriber arrives after a full teardown', () => {
        const stop = subscribeToRouteChange('a', () => undefined);
        stop();

        const seen: string[] = [];
        subscribeToRouteChange('a', () => seen.push('x'));
        window.history.pushState({}, '', '/a');

        expect(seen).toEqual(['x']);
    });

    it('passes navigation arguments through to the real History method', () => {
        subscribeToRouteChange('a', () => undefined);

        window.history.pushState({ step: 2 }, '', '/checkout/abc/review');

        expect(window.location.pathname).toBe('/checkout/abc/review');
    });
});

describe('routeChangeMonitor state location', () => {
    let originalPushState: History['pushState'];
    let originalReplaceState: History['replaceState'];

    beforeEach(() => {
        originalPushState = window.history.pushState;
        originalReplaceState = window.history.replaceState;
        window.history.replaceState({}, '', '/start');
        resetRouteChangeMonitor();
    });

    afterEach(() => {
        resetRouteChangeMonitor();
        window.history.pushState = originalPushState;
        window.history.replaceState = originalReplaceState;
    });

    it('keeps subscriber state on window so it survives a bundle re-execution', () => {
        const listener = (): void => undefined;
        subscribeToRouteChange('a', listener);

        expect(window[WIN_ROUTE_MONITOR_KEY]).toBeDefined();
        expect(window[WIN_ROUTE_MONITOR_KEY].listeners.a).toBe(listener);
    });

    it('lets a listener registered after the patch still receive pushState', () => {
        // Only true if emit reads the shared state at call time.
        subscribeToRouteChange('a', () => undefined);

        const seen: string[] = [];
        subscribeToRouteChange('b', () => seen.push('late'));

        window.history.pushState({}, '', '/a');

        expect(seen).toEqual(['late']);
    });
});
