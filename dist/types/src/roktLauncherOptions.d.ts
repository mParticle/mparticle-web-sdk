import { Dictionary } from './utils';
export interface IRoktLauncherOptions extends Dictionary<any> {
    noDeviceId?: boolean;
    noDeviceID?: boolean;
    noFunctional?: boolean;
    noTargeting?: boolean;
    sessionId?: string;
    sessionToken?: string;
}
export declare function normalizeRoktLauncherOptions(launcherOptions?: IRoktLauncherOptions): IRoktLauncherOptions;
