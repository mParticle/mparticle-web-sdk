import { Dictionary } from './utils';
export interface IRoktLauncherOptions extends Dictionary<any> {
    noDeviceId?: boolean;
    noDeviceID?: boolean;
    noFunctional?: boolean;
    noTargeting?: boolean;
}
export declare function normalizeRoktLauncherOptions(launcherOptions?: IRoktLauncherOptions): IRoktLauncherOptions;
