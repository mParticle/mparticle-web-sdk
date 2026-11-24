import type { ButtonTracker } from './buttonTracking/buttonTracker';
import type { IMParticleWebSDKInstance } from './mp-instance';
export interface ISDKModule {
    version: string;
}
export interface IButtonTrackingModule extends ISDKModule {
    createTracker(mpInstance: IMParticleWebSDKInstance): ButtonTracker;
    reset(): void;
}
export interface ISDKModules {
    buttonTracking: IButtonTrackingModule;
}
export type SDKModuleName = keyof ISDKModules;
export interface ISDKModuleRegistry {
    _registerModule<K extends SDKModuleName>(name: K, module: ISDKModules[K]): void;
}
