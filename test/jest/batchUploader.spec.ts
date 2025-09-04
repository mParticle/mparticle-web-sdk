import { BatchUploader } from '../../src/batchUploader';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { StoragePrivacyMap, StorageTypes } from '../../src/constants';

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
                storageName: 'mprtcl-v4_abcdef',
                noFunctional: false,
                noTargeting: false,
                getPrivacyFlagForStorage: function(this: any, storageType: typeof StorageTypes[number]) {
                    const privacyControl = StoragePrivacyMap[storageType];
                    if (privacyControl === 'functional') {
                        return !!this.noFunctional;
                    }
                    if (privacyControl === 'targeting') {
                        return !!this.noTargeting;
                    }
                    return false;
                },
                deviceId: 'device-1',
                SDKConfig: {
                    flags: {}
                }
            },
            _Helpers: {
                getFeatureFlag: jest.fn().mockReturnValue('100'),
                createServiceUrl: jest.fn().mockReturnValue('https://mock-url.com')
            },
            Identity: {
                getCurrentUser: jest.fn().mockReturnValue({
                    getMPID: () => 'test-mpid'
                })
            },
            Logger: {
                verbose: jest.fn(),
                error: jest.fn(),
                warning: jest.fn(),
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
            const firstCall = batchUploader['shouldDebounceAndUpdateLastASTTime']();
            expect(firstCall).toBe(false);
        });

        it('should return true for immediate second call', () => {
            // First call
            batchUploader['shouldDebounceAndUpdateLastASTTime']();
            
            // Immediate second call should be debounced
            const secondCall = batchUploader['shouldDebounceAndUpdateLastASTTime']();
            expect(secondCall).toBe(true);
        });

        it('should return true for calls within debounce window', () => {
            // First call
            batchUploader['shouldDebounceAndUpdateLastASTTime']();
            
            // Advance time but stay within debounce window
            jest.advanceTimersByTime(999);
            
            // Call before window ends should be debounced
            const thirdCall = batchUploader['shouldDebounceAndUpdateLastASTTime']();
            expect(thirdCall).toBe(true);
        });

        it('should return false for calls outside debounce window', () => {
            // First call
            batchUploader['shouldDebounceAndUpdateLastASTTime']();
            
            // Advance past debounce window
            jest.advanceTimersByTime(1001);
            
            // Second call should not be debounced
            const secondCall = batchUploader['shouldDebounceAndUpdateLastASTTime']();
            expect(secondCall).toBe(false);
        });

        it('should update lastASTEventTime when not debouncing', () => {
            // First call
            batchUploader['shouldDebounceAndUpdateLastASTTime']();
            const firstCallTime = batchUploader['lastASTEventTime'];
            
            // Advance past debounce window
            jest.advanceTimersByTime(1001);
            
            // Second call
            batchUploader['shouldDebounceAndUpdateLastASTTime']();
            const secondCallTime = batchUploader['lastASTEventTime'];
            
            expect(secondCallTime).toBeGreaterThan(firstCallTime);
        });

        it('should not update lastASTEventTime when debouncing', () => {
            // First call
            batchUploader['shouldDebounceAndUpdateLastASTTime']();
            const firstCallTime = batchUploader['lastASTEventTime'];
            
            // Immediate second call
            batchUploader['shouldDebounceAndUpdateLastASTTime']();
            const secondCallTime = batchUploader['lastASTEventTime'];
            
            expect(secondCallTime).toBe(firstCallTime);
        });
    });

    describe('noFunctional', () => {
        beforeEach(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        it('should disable offline storage when noFunctional is true', () => {
            mockMPInstance._Store.noFunctional = true;

            const uploader = new BatchUploader(mockMPInstance, 1000);
            expect(uploader['offlineStorageEnabled']).toBe(false);

            uploader.queueEvent({ EventDataType: 4 } as any);
            expect(sessionStorage.getItem('mprtcl-v4_abcdef-events')).toBeNull();
            expect(localStorage.getItem('mprtcl-v4_abcdef-batches')).toBeNull();
        });

        it('should enable offline storage when noFunctional is default (false)', () => {
            // mockMPInstance._Store.noFunctional = false;
            const uploader = new BatchUploader(mockMPInstance, 1000);

            expect(uploader['offlineStorageEnabled']).toBe(true);

            uploader.queueEvent({ EventDataType: 4 } as any);
            expect(sessionStorage.getItem('mprtcl-v4_abcdef-events')).not.toBeNull();
        });

        it('should enable offline storage when noFunctional is false', () => {
            mockMPInstance._Store.noFunctional = false;

            const uploader = new BatchUploader(mockMPInstance, 1000);

            uploader.queueEvent({ EventDataType: 4 } as any);
            expect(sessionStorage.getItem('mprtcl-v4_abcdef-events')).not.toBeNull();
        });
    });
}); 