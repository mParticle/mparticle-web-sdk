import NativeSdkHelpers from '../../src/nativeSdkHelpers';
import {
    IAndroidNativeBridge,
    INativeSdkHelpers,
} from '../../src/nativeSdkHelpers.interfaces';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';

describe('NativeSdkHelpers v1 Android bridge', () => {
    const windowPrototype = Object.getPrototypeOf(window);
    let sdkConfig: { useNativeSdk: boolean; isIOS: boolean };
    let verbose: jest.Mock;
    let helpers: INativeSdkHelpers;

    function inheritBridge(bridge: unknown): void {
        Object.defineProperty(windowPrototype, 'mParticleAndroid', {
            value: bridge,
            configurable: true,
            writable: true,
        });
    }

    function createBridge(): IAndroidNativeBridge & { logEvent: jest.Mock } {
        return { logEvent: jest.fn() };
    }

    beforeEach(() => {
        delete window.mParticleAndroid;
        sdkConfig = { useNativeSdk: false, isIOS: false };
        verbose = jest.fn();
        helpers = new NativeSdkHelpers(({
            _Store: { SDKConfig: sdkConfig },
            Logger: { verbose, warning: jest.fn(), error: jest.fn() },
        } as unknown) as IMParticleWebSDKInstance);
        helpers.sendViaIframeToIOS = jest.fn();
    });

    afterEach(() => {
        delete window.mParticleAndroid;
        delete windowPrototype.mParticleAndroid;
    });

    describe('isBridgeV1Available', () => {
        it('is true for a bridge that is an own property of window', () => {
            window.mParticleAndroid = createBridge();

            expect(helpers.isBridgeV1Available()).toBe(true);
        });

        it('is false when window.mParticleAndroid is absent', () => {
            expect('mParticleAndroid' in window).toBe(false);
            expect(helpers.isBridgeV1Available()).toBe(false);

            window.mParticleAndroid = createBridge();
            expect(
                helpers.isBridgeV1Available(),
                'with an own-property bridge'
            ).toBe(true);
        });

        it('is false for a bridge that window inherits rather than owns', () => {
            const bridge = createBridge();
            inheritBridge(bridge);

            expect(window.mParticleAndroid, 'inherited value resolves').toBe(
                bridge
            );
            expect(
                Object.prototype.hasOwnProperty.call(window, 'mParticleAndroid'),
                'own property'
            ).toBe(false);
            expect(helpers.isBridgeV1Available()).toBe(false);

            window.mParticleAndroid = bridge;
            expect(
                helpers.isBridgeV1Available(),
                'with the same bridge as an own property'
            ).toBe(true);
        });

        it.each([
            ['null', null],
            ['undefined', undefined],
            ['an empty string', ''],
        ])('is false for an own property holding %s', (_label, value) => {
            window.mParticleAndroid = createBridge();
            expect(
                helpers.isBridgeV1Available(),
                'with an own-property bridge'
            ).toBe(true);

            window.mParticleAndroid = (value as unknown) as IAndroidNativeBridge;

            expect(
                Object.prototype.hasOwnProperty.call(window, 'mParticleAndroid'),
                'own property'
            ).toBe(true);
            expect(helpers.isBridgeV1Available()).toBe(false);
        });

        it.each([['useNativeSdk'], ['isIOS']])(
            'is true when %s is set, with no Android bridge on window',
            configKey => {
                expect(
                    helpers.isBridgeV1Available(),
                    'with neither setting'
                ).toBe(false);

                sdkConfig[configKey as keyof typeof sdkConfig] = true;

                expect('mParticleAndroid' in window).toBe(false);
                expect(helpers.isBridgeV1Available()).toBe(true);
            }
        );
    });

    describe('sendViaBridgeV1', () => {
        it('calls the path on a bridge that is an own property of window', () => {
            const bridge = createBridge();
            window.mParticleAndroid = bridge;

            helpers.sendViaBridgeV1('logEvent', '{"EventName":"a"}');

            expect(bridge.logEvent).toHaveBeenCalledTimes(1);
            expect(bridge.logEvent).toHaveBeenCalledWith('{"EventName":"a"}');
            expect(verbose).toHaveBeenCalledWith(
                expect.stringContaining('logEvent')
            );
        });

        it('does not call a bridge that window inherits rather than owns', () => {
            const bridge = createBridge();
            inheritBridge(bridge);
            expect(window.mParticleAndroid, 'inherited value resolves').toBe(
                bridge
            );

            helpers.sendViaBridgeV1('logEvent', '{"EventName":"a"}');
            expect(bridge.logEvent).not.toHaveBeenCalled();

            window.mParticleAndroid = bridge;
            helpers.sendViaBridgeV1('logEvent', '{"EventName":"b"}');
            expect(bridge.logEvent).toHaveBeenCalledTimes(1);
            expect(bridge.logEvent).toHaveBeenCalledWith('{"EventName":"b"}');
        });

        it('does not throw for an inherited value whose member is not callable', () => {
            inheritBridge({ logEvent: {} });
            expect(
                Object.prototype.hasOwnProperty.call(
                    window.mParticleAndroid,
                    'logEvent'
                ),
                'inherited value has a logEvent member'
            ).toBe(true);

            expect(() =>
                helpers.sendViaBridgeV1('logEvent', '{"EventName":"a"}')
            ).not.toThrow();

            const bridge = createBridge();
            window.mParticleAndroid = bridge;
            helpers.sendViaBridgeV1('logEvent', '{"EventName":"b"}');
            expect(bridge.logEvent).toHaveBeenCalledWith('{"EventName":"b"}');
        });

        it('falls back to the iOS iframe when the own-property bridge lacks the path and isIOS is set', () => {
            const bridge = createBridge();
            window.mParticleAndroid = bridge;

            helpers.sendViaBridgeV1('upload', '');
            expect(helpers.sendViaIframeToIOS).not.toHaveBeenCalled();

            sdkConfig.isIOS = true;
            helpers.sendViaBridgeV1('upload', '');

            expect(helpers.sendViaIframeToIOS).toHaveBeenCalledWith(
                'upload',
                ''
            );
            expect(bridge.logEvent).not.toHaveBeenCalled();
        });

        it('sends nothing when window.mParticleAndroid is absent and isIOS is not set', () => {
            expect('mParticleAndroid' in window).toBe(false);

            expect(() =>
                helpers.sendViaBridgeV1('logEvent', '{"EventName":"a"}')
            ).not.toThrow();
            expect(helpers.sendViaIframeToIOS).not.toHaveBeenCalled();
            expect(verbose).not.toHaveBeenCalled();

            sdkConfig.isIOS = true;
            helpers.sendViaBridgeV1('logEvent', '{"EventName":"a"}');
            expect(helpers.sendViaIframeToIOS).toHaveBeenCalledWith(
                'logEvent',
                '{"EventName":"a"}'
            );
        });
    });
});
