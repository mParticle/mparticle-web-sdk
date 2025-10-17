import Constants from '../../src/constants';
import { IMParticleInstanceManager } from '../../src/sdkRuntimeModels';
const mockPerformanceMark = (globalThis as any).__mockPerformanceMark;


const mParticle = (globalThis as any).mParticle as IMParticleInstanceManager;

describe('mParticle instance manager', () => {

    it('sets sdkStart event timing', async () => {
        expect(mockPerformanceMark).toHaveBeenCalledWith(Constants.PerformanceMetricsNames.SdkStart);
    });

    it('generates a launcher instance guid', () => {
        const guid = mParticle.getLauncherInstanceGuid();
        expect(guid).toBeDefined();
    });

    it('generates the same launcher instance guid', () => {
        const firstGuid = mParticle.getLauncherInstanceGuid();
        const secondGuid = mParticle.getLauncherInstanceGuid();

        expect(firstGuid).toBeDefined();
        expect(secondGuid).toBeDefined();
        expect(firstGuid).toEqual(secondGuid);
    });
});
