import Constants from './constants';
import { isObject } from './utils';
import type { ISDKModules, SDKModuleName } from './sdkModuleTypes';

// Optional SDK code registers here before init, as kits do with addForwarder.
// The full SDK registers every module statically from its entry point. A build
// that leaves a module out never registers it, and the code that reads the
// module treats a missing one as its feature switched off.
export const SDKModuleNames = {
    ButtonTracking: 'buttonTracking',
} as const;

const knownNames: { [K in SDKModuleName]: true } = { buttonTracking: true };

let modules: Partial<ISDKModules> = {};
// What the page itself registered, the full SDK's built-in modules or a module
// file loaded after the lean SDK. A test reset returns to these.
const pageModules: Partial<ISDKModules> = {};
// Registration usually runs before any instance has a logger, so each warning
// waits here until the next init logs it.
let warnings: string[] = [];
// A rejected module is reported by the code that needs it, only when its
// feature is on, so a page logs one warning for it rather than two.
let rejections: Partial<Record<SDKModuleName, string>> = {};

// The first valid registration of a module wins, and a later valid one is
// ignored. Anything invalid, including undefined, is ignored with one warning.
// A module built for another SDK version is rejected without a warning here;
// getSDKModuleRejection hands its reason to the code that reads the module.
// replace lets the test environment swap a module, or remove it with
// undefined, because Karma runs the built bundle and cannot reach this file.
export function registerSDKModule<K extends SDKModuleName>(
    name: K,
    module: ISDKModules[K],
    replace?: boolean
): void {
    if (replace && module === undefined) {
        delete modules[name];
        return;
    }
    if (
        !Object.prototype.hasOwnProperty.call(knownNames, name) ||
        !isObject(module) ||
        typeof module.version !== 'string'
    ) {
        warnings.push('Ignored an invalid SDK module registration');
        return;
    }
    if (module.version !== Constants.sdkVersion) {
        rejections[name] =
            'Rejected SDK module ' + name + ' ' + module.version + ', built for another SDK version';
        return;
    }
    if (!modules[name] || replace) {
        modules[name] = module;
    }
    if (!replace && !pageModules[name]) {
        pageModules[name] = module;
    }
}

export function registerBuiltInSDKModule<K extends SDKModuleName>(
    name: K,
    module: ISDKModules[K]
): void {
    pageModules[name] = module;
    registerSDKModule(name, module);
}

export function getSDKModule<K extends SDKModuleName>(
    name: K
): ISDKModules[K] | undefined {
    return modules[name];
}

export function getSDKModuleRejection(name: SDKModuleName): string | undefined {
    return rejections[name];
}

export function takeSDKModuleWarnings(): string[] {
    const taken = warnings;
    warnings = [];
    return taken;
}

// Back to the modules the page registered, with no warnings or rejections.
export function resetSDKModules(): void {
    modules = { ...pageModules };
    warnings = [];
    rejections = {};
}

// Stops button tracking where its module is present. A page without the
// module has no tracker of its own to stop. Every caller goes through here, so
// a reset that throws never reaches init or reset: the module is removed, and
// the next tracker build finds it missing and turns both tracking flags off.
export function resetButtonTrackingModule(): void {
    const buttonTracking = modules.buttonTracking;
    try {
        if (buttonTracking && typeof buttonTracking.reset === 'function') {
            buttonTracking.reset();
        }
    } catch {
        delete modules.buttonTracking;
    }
}
