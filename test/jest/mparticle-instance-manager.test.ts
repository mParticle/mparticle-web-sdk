import Constants from '../../src/constants';
const mockPerformanceMark = (globalThis as any).__mockPerformanceMark;

describe('mParticle instance manager', () => {

    it('sets sdkStart event timing', async () => {
        expect(mockPerformanceMark).toHaveBeenCalledWith(Constants.PerformanceMetricsNames.SdkStart);
    });
});
