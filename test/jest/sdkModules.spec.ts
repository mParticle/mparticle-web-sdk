import Constants from '../../src/constants';
import { SDKModuleNames } from '../../src/sdkModules';
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
        registry.registerSDKModule(name as typeof ButtonTracking, module as IButtonTrackingModule);

    // A fresh registry for each test: registrations the page makes outside the
    // test environment survive resetSDKModules by design.
    let registry: typeof import('../../src/sdkModules');
    beforeEach(() => {
        jest.isolateModules(() => {
            registry = require('../../src/sdkModules');
        });
    });

    it('returns undefined for a module that never registered', () => {
        expect(registry.getSDKModule(ButtonTracking)).toBeUndefined();
    });

    it('returns the registered module', () => {
        const module = fakeModule();
        registry.registerSDKModule(ButtonTracking, module);

        expect(registry.getSDKModule(ButtonTracking)).toBe(module);
        expect(registry.takeSDKModuleWarnings()).toEqual([]);
    });

    it('keeps the first valid registration and ignores a later one silently', () => {
        const first = fakeModule();
        registry.registerSDKModule(ButtonTracking, first);
        registry.registerSDKModule(ButtonTracking, fakeModule());

        expect(registry.getSDKModule(ButtonTracking)).toBe(first);
        expect(registry.takeSDKModuleWarnings()).toEqual([]);
    });

    it('rejects a module built for another SDK version, leaving its one warning to the code that reads it', () => {
        registry.registerSDKModule(ButtonTracking, fakeModule({ version: '0.0.1' }));

        expect(registry.getSDKModule(ButtonTracking)).toBeUndefined();
        expect(registry.takeSDKModuleWarnings()).toEqual([]);
        expect(registry.getSDKModuleRejection(ButtonTracking)).toBe(
            'Rejected SDK module buttonTracking 0.0.1, built for another SDK version'
        );
    });

    it('accepts a valid module after a rejected one', () => {
        registry.registerSDKModule(ButtonTracking, fakeModule({ version: '0.0.1' }));
        const valid = fakeModule();
        registry.registerSDKModule(ButtonTracking, valid);

        expect(registry.getSDKModule(ButtonTracking)).toBe(valid);
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

        expect(registry.getSDKModule(ButtonTracking)).toBeUndefined();
        expect(registry.takeSDKModuleWarnings()).toEqual([
            'Ignored an invalid SDK module registration',
        ]);
    });

    it('keeps the registered module when an invalid one follows', () => {
        const module = fakeModule();
        registry.registerSDKModule(ButtonTracking, module);
        register(ButtonTracking, undefined);

        expect(registry.getSDKModule(ButtonTracking)).toBe(module);
        expect(registry.takeSDKModuleWarnings()).toHaveLength(1);
    });

    it('hands each warning over once', () => {
        register(ButtonTracking, undefined);

        expect(registry.takeSDKModuleWarnings()).toHaveLength(1);
        expect(registry.takeSDKModuleWarnings()).toEqual([]);
    });

    describe('replace, for the test environment', () => {
        it('replaces the registered module', () => {
            registry.registerSDKModule(ButtonTracking, fakeModule());
            const second = fakeModule();
            registry.registerSDKModule(ButtonTracking, second, true);

            expect(registry.getSDKModule(ButtonTracking)).toBe(second);
        });

        it('removes the module when given undefined', () => {
            registry.registerSDKModule(ButtonTracking, fakeModule());
            registry.registerSDKModule(ButtonTracking, undefined, true);

            expect(registry.getSDKModule(ButtonTracking)).toBeUndefined();
            expect(registry.takeSDKModuleWarnings()).toEqual([]);
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

        it('restores a module the page registered, such as a module file, and drops rejections', () => {
            jest.isolateModules(() => {
                const registry = require('../../src/sdkModules');
                const fromModuleFile = fakeModule();
                registry.registerSDKModule(ButtonTracking, fromModuleFile);
                registry.registerSDKModule(ButtonTracking, fakeModule({ version: '0.0.1' }));
                registry.registerSDKModule(ButtonTracking, undefined, true);

                registry.resetSDKModules();

                expect(registry.getSDKModule(ButtonTracking)).toBe(fromModuleFile);
                expect(registry.getSDKModuleRejection(ButtonTracking)).toBeUndefined();
            });
        });

        it('does not restore a module the test environment swapped in', () => {
            jest.isolateModules(() => {
                const registry = require('../../src/sdkModules');
                registry.registerSDKModule(ButtonTracking, fakeModule(), true);

                registry.resetSDKModules();

                expect(registry.getSDKModule(ButtonTracking)).toBeUndefined();
            });
        });
    });

    describe('resetButtonTrackingModule', () => {
        it('resets the registered button tracking module', () => {
            const module = fakeModule();
            registry.registerSDKModule(ButtonTracking, module);

            registry.resetButtonTrackingModule();

            expect(module.reset).toHaveBeenCalledTimes(1);
        });

        it('does nothing without the module', () => {
            expect(() => registry.resetButtonTrackingModule()).not.toThrow();
        });

        it('contains a reset that throws and removes the module', () => {
            registry.registerSDKModule(
                ButtonTracking,
                fakeModule({
                    reset: () => {
                        throw new Error('reset failed');
                    },
                })
            );

            expect(() => registry.resetButtonTrackingModule()).not.toThrow();
            expect(registry.getSDKModule(ButtonTracking)).toBeUndefined();
        });
    });
});
