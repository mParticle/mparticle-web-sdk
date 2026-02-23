import { BatchUploader } from '../../src/batchUploader';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { LogLevelType } from '../../src/sdkRuntimeModels';

describe('BatchUploader', () => {
    let batchUploader: BatchUploader;
    let mockMPInstance: IMParticleWebSDKInstance;
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
        const now = Date.now();
        jest.useFakeTimers({
            now: now,
            advanceTimers: true // This improves the performance of nested timers, equivalent to Sinon's shouldAdvanceTime
        });
        originalFetch = global.fetch;
        global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });

        // Create a mock mParticle instance with mocked methods for instantiating a BatchUploader
        mockMPInstance = {
            _Store: {
                SDKConfig: {
                    flags: {}
                },
                deviceId: 'test-device-id'
            },
            _Helpers: {
                getFeatureFlag: jest.fn().mockReturnValue(false),
                createServiceUrl: jest.fn().mockReturnValue('https://mock-url.com'),
            },
            Identity: {
                getCurrentUser: jest.fn().mockReturnValue({
                    getMPID: () => 'test-mpid'
                })
            },
            Logger: {
                verbose: jest.fn(),
                warning: jest.fn(),
                error: jest.fn(),
                setLogLevel: jest.fn(),
                getLogLevel: jest.fn().mockReturnValue(LogLevelType.Verbose)
            }
        } as unknown as IMParticleWebSDKInstance;

        batchUploader = new BatchUploader(mockMPInstance, 1000);
    });

    afterEach(() => {
        jest.useRealTimers();
        global.fetch = originalFetch;
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

    describe('queueEvent log level (obfuscated vs raw)', () => {
        const eventWithName = {
            EventName: 'TestEventName',
            EventCategory: 1,
            SessionId: 's1',
            DeviceId: 'd1',
            Timestamp: Date.now(),
            SourceMessageId: 'mid1',
            SDKVersion: '1.0'
        } as any;

        it('should log obfuscated event when log level is verbose', () => {
            (mockMPInstance.Logger.getLogLevel as jest.Mock).mockReturnValue(LogLevelType.Verbose);
            batchUploader.queueEvent(eventWithName);
            expect(mockMPInstance.Logger.verbose).toHaveBeenCalled();
            const verboseCall = (mockMPInstance.Logger.verbose as jest.Mock).mock.calls.find(
                (c: string[]) => c[0].includes('Queuing event:')
            );
            expect(verboseCall).toBeDefined();
            // Obfuscation replaces primitive values with type names; raw event name would not appear
            expect(verboseCall[0]).not.toContain('TestEventName');
            expect(verboseCall[0]).toContain('string'); // obfuscated string type
        });

        it('should log raw event when log level is debug', () => {
            (mockMPInstance.Logger.getLogLevel as jest.Mock).mockReturnValue(LogLevelType.Debug);
            batchUploader.queueEvent(eventWithName);
            expect(mockMPInstance.Logger.verbose).toHaveBeenCalled();
            const verboseCall = (mockMPInstance.Logger.verbose as jest.Mock).mock.calls.find(
                (c: string[]) => c[0].includes('Queuing event:')
            );
            expect(verboseCall).toBeDefined();
            expect(verboseCall[0]).toContain('TestEventName');
        });
    });
}); 