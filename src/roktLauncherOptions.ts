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
    const normalizedOptions = launcherOptions ? { ...launcherOptions } : {};
    const hasNoDeviceId =
        normalizedOptions.noDeviceId === true ||
        normalizedOptions.noDeviceID === true;

    if (hasNoDeviceId) {
        // noDeviceId is the strongest Rokt privacy flag and implies the newer flags.
        normalizedOptions.noDeviceId = true;
        normalizedOptions.noFunctional = true;
        normalizedOptions.noTargeting = true;
    }

    return normalizedOptions;
}
