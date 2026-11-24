import type { ISDKModules, SDKModuleName } from './sdkModuleTypes';
export declare const SDKModuleNames: {
    readonly ButtonTracking: "buttonTracking";
};
export declare function registerSDKModule<K extends SDKModuleName>(name: K, module: ISDKModules[K], replace?: boolean): void;
export declare function registerBuiltInSDKModule<K extends SDKModuleName>(name: K, module: ISDKModules[K]): void;
export declare function getSDKModule<K extends SDKModuleName>(name: K): ISDKModules[K] | undefined;
export declare function takeSDKModuleWarnings(): string[];
export declare function resetSDKModules(): void;
export declare function resetButtonTrackingModule(): void;
