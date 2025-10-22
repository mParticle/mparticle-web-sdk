import Constants from '../../src/constants';
import { PerformanceMarkType } from '../../src/types';
import { IMParticleInstanceManager } from '../../src/sdkRuntimeModels';

const mockPerformanceMark = (globalThis as any).__mockPerformanceMark;
const mParticle = (globalThis as any).mParticle as IMParticleInstanceManager;

describe('mParticle instance manager', () => {
    beforeEach(() => {
        mockPerformanceMark.mockClear();
        delete (window as any)[Constants.Rokt.LauncherInstanceGuidKey];
    });     

    it('sets sdkStart event timing', async () => {
        mParticle.init("testApiKey", {});
        expect(mockPerformanceMark).toHaveBeenCalledWith(PerformanceMarkType.SdkStart);
    });

    it('does not capture timing if window.performance.mark is not available', () => {
        (globalThis as any).performance.mark = undefined;
        mParticle.init("testApiKey", {});
        expect(mockPerformanceMark).not.toHaveBeenCalled();
    });

    it('sets rokt launcher instance guid', async () => {
        mParticle.init("testApiKey", {});
        expect(window).toHaveProperty(Constants.Rokt.LauncherInstanceGuidKey);
        expect(typeof window[Constants.Rokt.LauncherInstanceGuidKey]).toBe('string');
    });

    it('does not set rokt launcher instance guid if it already exists', () => {
        window[Constants.Rokt.LauncherInstanceGuidKey] = 'testGuid';
        mParticle.init("testApiKey", {});
        expect(window).toHaveProperty(Constants.Rokt.LauncherInstanceGuidKey);
        expect(typeof window[Constants.Rokt.LauncherInstanceGuidKey]).toBe('string');
        expect(window[Constants.Rokt.LauncherInstanceGuidKey]).toBe('testGuid');
    });
});
