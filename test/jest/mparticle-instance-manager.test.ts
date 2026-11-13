import Constants from '../../src/constants';
import { PerformanceMarkType } from '../../src/types';
import { IMParticleInstanceManager } from '../../src/sdkRuntimeModels';

const mockPerformanceMark = (globalThis as any).__mockPerformanceMark;
const mParticle = (globalThis as any).mParticle as IMParticleInstanceManager;

describe('mParticle instance manager', () => {
    let xhrSend: jest.SpyInstance;

    // Each init still sends an identify request. Stub the send so the request never leaves the
    // test and nothing completes after Jest tears the environment down.
    beforeAll(() => {
        xhrSend = jest
            .spyOn(XMLHttpRequest.prototype, 'send')
            .mockImplementation(() => undefined);
    });

    afterAll(() => {
        xhrSend.mockRestore();
    });

    beforeEach(() => {
        mockPerformanceMark.mockClear();
        delete (globalThis as any)[Constants.Rokt.LauncherInstanceGuidKey];
    });     

    it('sets sdkStart event timing', async () => {
        mParticle.init("testApiKey", { requestConfig: false });
        expect(mockPerformanceMark).toHaveBeenCalledWith(PerformanceMarkType.SdkStart);
    });

    it('does not capture timing if window.performance.mark is not available', () => {
        (globalThis as any).performance.mark = undefined;
        mParticle.init("testApiKey", { requestConfig: false });
        expect(mockPerformanceMark).not.toHaveBeenCalled();
    });

    it('sets rokt launcher instance guid', async () => {
        mParticle.init("testApiKey", { requestConfig: false });
        expect(globalThis).toHaveProperty(Constants.Rokt.LauncherInstanceGuidKey);
        expect(typeof globalThis[Constants.Rokt.LauncherInstanceGuidKey]).toBe('string');
    });

    it('does not set rokt launcher instance guid if it already exists', () => {
        globalThis[Constants.Rokt.LauncherInstanceGuidKey] = 'testGuid';
        mParticle.init("testApiKey", { requestConfig: false });
        expect(globalThis).toHaveProperty(Constants.Rokt.LauncherInstanceGuidKey);
        expect(typeof globalThis[Constants.Rokt.LauncherInstanceGuidKey]).toBe('string');
        expect(globalThis[Constants.Rokt.LauncherInstanceGuidKey]).toBe('testGuid');
    });
});
