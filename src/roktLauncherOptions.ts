import { Dictionary } from './utils';

export interface IRoktLauncherOptions extends Dictionary<any> {
    noDeviceId?: boolean;
    noDeviceID?: boolean;
    noFunctional?: boolean;
    noTargeting?: boolean;
}

export function normalizeRoktLauncherOptions(
    launcherOptions?: IRoktLauncherOptions
): IRoktLauncherOptions {
    const normalizedOptions = { ...(launcherOptions || {}) };
    const hasNoDeviceId =
        normalizedOptions.noDeviceId === true ||
        normalizedOptions.noDeviceID === true;

    if (hasNoDeviceId) {
        normalizedOptions.noDeviceId = true;
        normalizedOptions.noFunctional = true;
        normalizedOptions.noTargeting = true;
    }

    return normalizedOptions;
}
