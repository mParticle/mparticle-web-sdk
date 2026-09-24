import {
    subscribeToRouteChange,
    resetRouteChangeMonitor,
    RouteChangeSource,
} from '../../src/routeChangeMonitor';
import mParticleInstance, {
    IMParticleWebSDKInstance,
} from '../../src/mp-instance';

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
        subscribeToRouteChange(source => seen.push(source));

        window.history.pushState({}, '', '/a');
        window.history.replaceState({}, '', '/b');
        window.dispatchEvent(new PopStateEvent('popstate'));

        expect(seen).toEqual(['pushState', 'replaceState', 'popstate']);
    });

    it('patches History only once for many subscribers', () => {
        subscribeToRouteChange(() => undefined);
        const afterFirst = window.history.pushState;

        subscribeToRouteChange(() => undefined);

        expect(window.history.pushState).toBe(afterFirst);
    });

    it('fans one navigation out to every subscriber', () => {
        const a: string[] = [];
        const b: string[] = [];
        subscribeToRouteChange(() => a.push('a'));
        subscribeToRouteChange(() => b.push('b'));

        window.history.pushState({}, '', '/a');

        expect(a).toEqual(['a']);
        expect(b).toEqual(['b']);
    });

    it('keeps the other subscribers running when one throws', () => {
        const seen: string[] = [];
        subscribeToRouteChange(() => {
            throw new Error('subscriber blew up');
        });
        subscribeToRouteChange(() => seen.push('still here'));

        expect(() => window.history.pushState({}, '', '/a')).not.toThrow();
        expect(seen).toEqual(['still here']);
    });

    it('stops reporting to a subscriber that unsubscribes, and leaves the others', () => {
        const a: string[] = [];
        const b: string[] = [];
        const stopA = subscribeToRouteChange(() => a.push('a'));
        subscribeToRouteChange(() => b.push('b'));

        stopA();
        window.history.pushState({}, '', '/a');

        expect(a).toEqual([]);
        expect(b).toEqual(['b']);
    });

    it('is safe to unsubscribe twice', () => {
        const stop = subscribeToRouteChange(() => undefined);

        stop();
        expect(() => stop()).not.toThrow();
    });

    it('restores History once the last subscriber leaves', () => {
        const stopA = subscribeToRouteChange(() => undefined);
        const stopB = subscribeToRouteChange(() => undefined);

        stopA();
        expect(window.history.pushState).not.toBe(originalPushState);

        stopB();
        expect(window.history.pushState).toBe(originalPushState);
        expect(window.history.replaceState).toBe(originalReplaceState);
    });

    it('does not report after the last subscriber has left', () => {
        const seen: string[] = [];
        const stop = subscribeToRouteChange(() => seen.push('x'));
        stop();

        window.history.pushState({}, '', '/a');

        expect(seen).toEqual([]);
    });

    it('re-patches when a subscriber arrives after a full teardown', () => {
        const stop = subscribeToRouteChange(() => undefined);
        stop();

        const seen: string[] = [];
        subscribeToRouteChange(() => seen.push('x'));
        window.history.pushState({}, '', '/a');

        expect(seen).toEqual(['x']);
    });

    it('passes navigation arguments through to the real History method', () => {
        subscribeToRouteChange(() => undefined);

        window.history.pushState({ step: 2 }, '', '/checkout/abc/review');

        expect(window.location.pathname).toBe('/checkout/abc/review');
    });
});

describe('routeChangeMonitor on the SDK instance', () => {
    // Kits initialise inside processForwarders, which runs before config handling, so a kit
    // reading this during its own init must not find it undefined.
    it('is available from construction, before any kit initialises', () => {
        const instance = new (mParticleInstance as unknown as new (
            name: string
        ) => IMParticleWebSDKInstance)('default');

        expect(typeof instance._subscribeToRouteChange).toBe('function');
    });
});
