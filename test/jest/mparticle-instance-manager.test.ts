import { IMParticleInstanceManager } from '../../src/sdkRuntimeModels';
import { EventTimingName } from '../../src/eventTimingService';

const mParticle = (globalThis as any).mParticle as IMParticleInstanceManager;

globalThis.fetch = jest.fn();

describe('mParticle instance manager', () => {

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        if (mParticle._instances) {
            mParticle._instances = {};
        }
        
        (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
            if (url.includes('config')) {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({ workspaceToken: 'wtTest1' }),
                });
            }
            return Promise.reject(new Error('Unmocked fetch call'));
        });

        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Set up config
        (globalThis as any).mParticle.config = { };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('sets sdkStart event timing', async () => {
        mParticle.init('apiKey', {});

        const timings = mParticle.getAllTimings();

        expect(timings).toHaveProperty(EventTimingName.SdkStart);
        expect(typeof timings[EventTimingName.SdkStart]).toBe('number');
    });

    it('should set IsSelfHosted to false when config is picked from window.mParticle.config', () => {
        mParticle.init('testApiKey', { requestConfig: false });

        expect(mParticle.isSelfHosted()).toBe(false);
    });

    it('should set IsSelfHosted to true when config is not passed and window.mParticle.config is not defined', () => {
        mParticle.init('testApiKey', { requestConfig: true });
        
        expect(mParticle.isSelfHosted()).toBe(true);
    });
});
