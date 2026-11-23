import type { ButtonTracker } from './buttonTracking/buttonTracker';
import type { IMParticleWebSDKInstance } from './mp-instance';

export interface ISDKModule {
    // A module is built with one SDK release and runs only with that release.
    version: string;
}

export interface IButtonTrackingModule extends ISDKModule {
    createTracker(mpInstance: IMParticleWebSDKInstance): ButtonTracker;
    // Stops whichever tracker is active, including one from an earlier bundle load.
    reset(): void;
}

export interface ISDKModules {
    buttonTracking: IButtonTrackingModule;
}

export type SDKModuleName = keyof ISDKModules;

// Kept off IMParticleInstanceManager so the registry stays out of the
// published declarations.
export interface ISDKModuleRegistry {
    _registerModule<K extends SDKModuleName>(
        name: K,
        module: ISDKModules[K]
    ): void;
}
