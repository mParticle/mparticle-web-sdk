import Constants from '../../src/constants';
import {
    getSDKModule,
    registerSDKModule,
    resetButtonTrackingModule,
    resetSDKModules,
    SDKModuleNames,
    takeSDKModuleWarnings,
} from '../../src/sdkModules';
import { IButtonTrackingModule } from '../../src/sdkModuleTypes';

describe('SDK modules', () => {
    const { ButtonTracking } = SDKModuleNames;
    const fakeModule = (
        overrides: Partial<IButtonTrackingModule> = {}
    ): IButtonTrackingModule => ({
        version: Constants.sdkVersion,
        createTracker: jest.fn(),
        reset: jest.fn(),
        ...overrides,
    });
    const register = (name: unknown, module: unknown) =>
        registerSDKModule(name as typeof ButtonTracking, module as IButtonTrackingModule);

    afterEach(() => {
        resetSDKModules();
    });

    it('returns undefined for a module that never registered', () => {
        expect(getSDKModule(ButtonTracking)).toBeUndefined();
    });

    it('returns the registered module', () => {
        const module = fakeModule();
        registerSDKModule(ButtonTracking, module);

        expect(getSDKModule(ButtonTracking)).toBe(module);
        expect(takeSDKModuleWarnings()).toEqual([]);
    });

    it('keeps the first valid registration and ignores a later one silently', () => {
        const first = fakeModule();
        registerSDKModule(ButtonTracking, first);
        registerSDKModule(ButtonTracking, fakeModule());

        expect(getSDKModule(ButtonTracking)).toBe(first);
        expect(takeSDKModuleWarnings()).toEqual([]);
    });

    it('rejects a module built for another SDK version with one warning', () => {
        registerSDKModule(ButtonTracking, fakeModule({ version: '0.0.1' }));

        expect(getSDKModule(ButtonTracking)).toBeUndefined();
        expect(takeSDKModuleWarnings()).toEqual([
            'Rejected SDK module buttonTracking 0.0.1, built for another SDK version',
        ]);
    });

    it('accepts a valid module after a rejected one', () => {
        registerSDKModule(ButtonTracking, fakeModule({ version: '0.0.1' }));
        const valid = fakeModule();
        registerSDKModule(ButtonTracking, valid);

        expect(getSDKModule(ButtonTracking)).toBe(valid);
    });

    it.each([
        ['undefined', ButtonTracking, undefined],
        ['null', ButtonTracking, null],
        ['a function', ButtonTracking, () => undefined],
        ['an unknown name', 'pageViews', { version: Constants.sdkVersion }],
        ['a name that is not a string', 7, { version: Constants.sdkVersion }],
        ['the name __proto__', '__proto__', { version: Constants.sdkVersion }],
        ['no version', ButtonTracking, { createTracker: jest.fn(), reset: jest.fn() }],
        ['a version that is not a string', ButtonTracking, { version: 3, createTracker: jest.fn(), reset: jest.fn() }],
    ])('ignores %s with one warning', (_, name, module) => {
        register(name, module);

        expect(getSDKModule(ButtonTracking)).toBeUndefined();
        expect(takeSDKModuleWarnings()).toEqual([
            'Ignored an invalid SDK module registration',
        ]);
    });

    it('keeps the registered module when an invalid one follows', () => {
        const module = fakeModule();
        registerSDKModule(ButtonTracking, module);
        register(ButtonTracking, undefined);

        expect(getSDKModule(ButtonTracking)).toBe(module);
        expect(takeSDKModuleWarnings()).toHaveLength(1);
    });

    it('hands each warning over once', () => {
        register(ButtonTracking, undefined);

        expect(takeSDKModuleWarnings()).toHaveLength(1);
        expect(takeSDKModuleWarnings()).toEqual([]);
    });

    describe('replace, for the test environment', () => {
        it('replaces the registered module', () => {
            registerSDKModule(ButtonTracking, fakeModule());
            const second = fakeModule();
            registerSDKModule(ButtonTracking, second, true);

            expect(getSDKModule(ButtonTracking)).toBe(second);
        });

        it('removes the module when given undefined', () => {
            registerSDKModule(ButtonTracking, fakeModule());
            registerSDKModule(ButtonTracking, undefined, true);

            expect(getSDKModule(ButtonTracking)).toBeUndefined();
            expect(takeSDKModuleWarnings()).toEqual([]);
        });
    });

    describe('resetSDKModules', () => {
        it('restores the built-in modules and drops warnings', () => {
            // A fresh copy, so the built-in module stays out of the other tests.
            jest.isolateModules(() => {
                const registry = require('../../src/sdkModules');
                const builtIn = fakeModule();
                registry.registerBuiltInSDKModule(ButtonTracking, builtIn);
                registry.registerSDKModule(ButtonTracking, undefined, true);
                registry.registerSDKModule(ButtonTracking, undefined);

                registry.resetSDKModules();

                expect(registry.getSDKModule(ButtonTracking)).toBe(builtIn);
                expect(registry.takeSDKModuleWarnings()).toEqual([]);
            });
        });
    });

    describe('resetButtonTrackingModule', () => {
        it('resets the registered button tracking module', () => {
            const module = fakeModule();
            registerSDKModule(ButtonTracking, module);

            resetButtonTrackingModule();

            expect(module.reset).toHaveBeenCalledTimes(1);
        });

        it('does nothing without the module', () => {
            expect(() => resetButtonTrackingModule()).not.toThrow();
        });

        it('contains a reset that throws and removes the module', () => {
            registerSDKModule(
                ButtonTracking,
                fakeModule({
                    reset: () => {
                        throw new Error('reset failed');
                    },
                })
            );

            expect(() => resetButtonTrackingModule()).not.toThrow();
            expect(getSDKModule(ButtonTracking)).toBeUndefined();
        });
    });
});
