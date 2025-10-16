import { IMParticleInstanceManager } from '../../src/sdkRuntimeModels';
import { EventTimingNames } from '../../src/eventTimingService';

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
    }
}

const mParticle = window.mParticle as IMParticleInstanceManager;

// Mock fetch globally
global.fetch = jest.fn();

describe('mParticle instance manager', () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
        if (mParticle._instances) {
            mParticle._instances = {};
        }
        
        

        // Mock fetch only for specific config endpoints
        mockFetch.mockImplementation((input: any, init?: any) => {
            const urlString = typeof input === 'string' ? input : 
                             input?.url || input?.toString() || 'unknown';
            
            // Only mock the config endpoint
            if (urlString.includes('/config?env=0')) {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: async () => ({ workspaceToken: 'wtTest1' }),
                } as Response);
            }
            
            // For any other fetch calls, reject or return a default response

            // This is what cursor gave me, but we should also
            // mock the identity and events endpoints as well


            return Promise.reject(new Error(`Unmocked fetch call to: ${urlString}`));
        });

        // Mock console methods
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        
        window.mParticle.config = {};
    });

    afterEach(() => {
        jest.restoreAllMocks();
        mockFetch.mockClear();
    });

    it('sets sdkStart event timing', async () => {
        mParticle.init('apiKey', {});

        const timings = mParticle.getAllTimings();

        expect(timings).toHaveProperty(EventTimingNames.SdkStart);
        expect(typeof timings[EventTimingNames.SdkStart]).toBe('number');
    });

    it('should set IsSelfHosted to false when config is picked from window.mParticle.config', () => {
        mParticle.init('testApiKey', { requestConfig: false });

        expect(mParticle.IsSelfHosted()).toBe(false);
    });

    it('should set IsSelfHosted to true when config is not passed and window.mParticle.config is not defined', () => {
        mParticle.init('testApiKey', {});
        
        expect(mParticle.IsSelfHosted()).toBe(true);
    });
});
