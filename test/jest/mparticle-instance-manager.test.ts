import Constants from '../../src/constants';
import { IMParticleInstanceManager } from '../../src/sdkRuntimeModels';
const mockPerformanceMark = (globalThis as any).__mockPerformanceMark;

const mParticle = (globalThis as any).mParticle as IMParticleInstanceManager;

describe('mParticle instance manager', () => {
    it('sets sdkStart event timing', async () => {
        mParticle.init("testApiKey", {});
        expect(mockPerformanceMark).toHaveBeenCalledWith(Constants.PerformanceMetricsNames.SdkStart);
    });

    it('sets rokt launcher instance guid', async () => {
        mParticle.init("testApiKey", {});
        expect(window).toHaveProperty(Constants.Rokt.LauncherInstanceGuidKey);
        expect(typeof window[Constants.Rokt.LauncherInstanceGuidKey]).toBe('string');
    });
});
