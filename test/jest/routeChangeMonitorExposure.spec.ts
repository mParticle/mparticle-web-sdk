// The Rokt kit reaches the SDK through `window.mParticle`, which is the instance manager,
// not the instance. A method exposed only on the instance is invisible to it, so this
// asserts on the object the kit actually reads.
describe('_subscribeToRouteChange exposure', () => {
    beforeEach(() => {
        jest.resetModules();
        delete (window as any).mParticle;
    });

    it('is exposed on window.mParticle, which is what kits read', () => {
        require('../../src/mparticle-instance-manager');

        expect(typeof (window as any).mParticle._subscribeToRouteChange).toBe(
            'function'
        );
    });

    // End to end over the path the kit takes: manager -> instance -> monitor. Each hop was
    // present on its own while the chain as a whole did nothing.
    it('delivers a route change to a listener subscribed via window.mParticle', () => {
        require('../../src/mparticle-instance-manager');
        const mParticle = (window as any).mParticle;

        const seen: string[] = [];
        const stop = mParticle._subscribeToRouteChange(
            (source: string) => seen.push(source),
            undefined,
            'kit'
        );

        window.history.pushState({}, '', '/checkout');
        expect(seen).toEqual(['pushState']);

        stop();
        window.history.pushState({}, '', '/confirmation');
        expect(seen).toEqual(['pushState']);
    });

    it('forwards through to the instance and returns its unsubscribe', () => {
        require('../../src/mparticle-instance-manager');
        const mParticle = (window as any).mParticle;

        const stop = jest.fn();
        const instanceSubscribe = jest.fn().mockReturnValue(stop);
        jest.spyOn(mParticle, 'getInstance').mockReturnValue({
            _subscribeToRouteChange: instanceSubscribe,
        });

        const listener = (): void => undefined;
        const log = (): void => undefined;
        const returned = mParticle._subscribeToRouteChange(
            listener,
            log,
            'kit'
        );

        expect(instanceSubscribe).toHaveBeenCalledWith(listener, log, 'kit');
        expect(returned).toBe(stop);
    });
});
