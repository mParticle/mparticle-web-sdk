import { normalizeRoktLauncherOptions } from '../../src/roktLauncherOptions';

describe('normalizeRoktLauncherOptions', () => {
    it('should leave launcher options unchanged when noDeviceId is not enabled', () => {
        const launcherOptions = {
            integrationName: 'customIntegration',
            noFunctional: false,
            noTargeting: true,
        };

        expect(normalizeRoktLauncherOptions(launcherOptions)).toEqual(
            launcherOptions
        );
    });

    it('should expand noDeviceId to noFunctional and noTargeting', () => {
        const launcherOptions = normalizeRoktLauncherOptions({
            noDeviceId: true,
            noFunctional: false,
            noTargeting: false,
        });

        expect(launcherOptions.noDeviceId).toBe(true);
        expect(launcherOptions.noFunctional).toBe(true);
        expect(launcherOptions.noTargeting).toBe(true);
    });

    it('should normalize legacy noDeviceID casing to canonical noDeviceId', () => {
        const launcherOptions = normalizeRoktLauncherOptions({
            noDeviceID: true,
            noFunctional: false,
            noTargeting: false,
        });

        expect(launcherOptions.noDeviceId).toBe(true);
        expect(launcherOptions.noDeviceID).toBe(true);
        expect(launcherOptions.noFunctional).toBe(true);
        expect(launcherOptions.noTargeting).toBe(true);
    });
});
