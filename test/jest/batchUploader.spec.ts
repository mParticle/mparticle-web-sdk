import { BatchUploader } from '../../src/batchUploader';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';

describe('BatchUploader', () => {
    let batchUploader: BatchUploader;
    let mockMPInstance: IMParticleWebSDKInstance;

    beforeEach(() => {
        const now = Date.now();
        jest.useFakeTimers({
            now: now,
            advanceTimers: true // This improves the performance of nested timers, equivalent to Sinon's shouldAdvanceTime
        });
        
        // Create a mock mParticle instance with mocked methods for instantiating a BatchUploader
        mockMPInstance = {
            _Store: {
                SDKConfig: {
                    flags: {}
                }
            },
            _Helpers: {
                getFeatureFlag: jest.fn().mockReturnValue(false),
                createServiceUrl: jest.fn().mockReturnValue('https://mock-url.com')
            },
            Identity: {
                getCurrentUser: jest.fn().mockReturnValue({
                    getMPID: () => 'test-mpid'
                })
            }
        } as unknown as IMParticleWebSDKInstance;

        batchUploader = new BatchUploader(mockMPInstance, 1000);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('shouldDebounceAST', () => {
        it('should return false for first call', () => {
            // First call should not be debounced
            const firstCall = (batchUploader as any).shouldDebounceAndUpdateLastASTTime();
            expect(firstCall).toBe(false);
        });

        it('should return true for immediate second call', () => {
            // First call
            (batchUploader as any).shouldDebounceAndUpdateLastASTTime();
            
            // Immediate second call should be debounced
            const secondCall = (batchUploader as any).shouldDebounceAndUpdateLastASTTime();
            expect(secondCall).toBe(true);
        });

        it('should return true for calls within debounce window', () => {
            // First call
            (batchUploader as any).shouldDebounceAndUpdateLastASTTime();
            
            // Advance time but stay within debounce window
            jest.advanceTimersByTime(999);
            
            // Call before window ends should be debounced
            const thirdCall = (batchUploader as any).shouldDebounceAndUpdateLastASTTime();
            expect(thirdCall).toBe(true);
        });

        it('should return false for calls outside debounce window', () => {
            // First call
            (batchUploader as any).shouldDebounceAndUpdateLastASTTime();
            
            // Advance past debounce window
            jest.advanceTimersByTime(1001);
            
            // Second call should not be debounced
            const secondCall = (batchUploader as any).shouldDebounceAndUpdateLastASTTime();
            expect(secondCall).toBe(false);
        });

        it('should update lastASTEventTime when not debouncing', () => {
            // First call
            (batchUploader as any).shouldDebounceAndUpdateLastASTTime();
            const firstCallTime = (batchUploader as any).lastASTEventTime;
            
            // Advance past debounce window
            jest.advanceTimersByTime(1001);
            
            // Second call
            (batchUploader as any).shouldDebounceAndUpdateLastASTTime();
            const secondCallTime = (batchUploader as any).lastASTEventTime;
            
            expect(secondCallTime).toBeGreaterThan(firstCallTime);
        });

        it('should not update lastASTEventTime when debouncing', () => {
            // First call
            (batchUploader as any).shouldDebounceAndUpdateLastASTTime();
            const firstCallTime = (batchUploader as any).lastASTEventTime;
            
            // Immediate second call
            (batchUploader as any).shouldDebounceAndUpdateLastASTTime();
            const secondCallTime = (batchUploader as any).lastASTEventTime;
            
            expect(secondCallTime).toBe(firstCallTime);
        });
    });
}); 