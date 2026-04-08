import { BatchUploader } from '../../src/batchUploader';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';

describe('BatchUploader', () => {
    let batchUploader: BatchUploader;
    let mockMPInstance: IMParticleWebSDKInstance;
    let originalFetch: typeof global.fetch;
    let mockSendBatchToForwarders: jest.Mock;

    beforeEach(() => {
        const now = Date.now();
        jest.useFakeTimers({
            now: now,
            advanceTimers: true // This improves the performance of nested timers, equivalent to Sinon's shouldAdvanceTime
        });
        originalFetch = global.fetch;
        global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });

        // Create a mock mParticle instance with mocked methods for instantiating a BatchUploader
        mockSendBatchToForwarders = jest.fn();
        mockMPInstance = {
            _Store: {
                SDKConfig: {
                    flags: {},
                },
                sideloadedKitsCount: 0,
            },
            _Helpers: {
                getFeatureFlag: jest.fn().mockReturnValue(false),
                createServiceUrl: jest.fn().mockReturnValue('https://mock-url.com'),
                generateUniqueId: jest.fn().mockReturnValue('mock-uuid'),
            },
            _Forwarders: {
                sendBatchToForwarders: mockSendBatchToForwarders,
            },
            Identity: {
                getCurrentUser: jest.fn().mockReturnValue({
                    getMPID: () => 'test-mpid',
                    getConsentState: () => null,
                    getUserIdentities: () => ({ userIdentities: {} }),
                    getAllUserAttributes: () => ({}),
                }),
            },
            Logger: {
                error: jest.fn(),
                warning: jest.fn(),
                verbose: jest.fn(),
                isVerbose: jest.fn().mockReturnValue(false),
            },
        } as unknown as IMParticleWebSDKInstance;

        batchUploader = new BatchUploader(mockMPInstance, 1000);
    });

    afterEach(() => {
        jest.useRealTimers();
        global.fetch = originalFetch;
    });

    describe('batch forwarding to kits', () => {
        it('should call sendBatchToForwarders for each new batch in createNewBatches', () => {
            const mockEvents = [
                {
                    EventName: 'Test Event',
                    EventDataType: 4,
                    MPID: 'test-mpid',
                    SessionId: 'session-1',
                    EventCategory: 1,
                    Timestamp: Date.now(),
                },
            ];

            const mockUser = {
                getMPID: () => 'test-mpid',
                getConsentState: () => null,
                getUserIdentities: () => ({ userIdentities: {} }),
                getAllUserAttributes: () => ({}),
            };

            BatchUploader['createNewBatches'](
                mockEvents as any,
                mockUser as any,
                mockMPInstance
            );

            expect(mockSendBatchToForwarders).toHaveBeenCalledTimes(1);
            expect(mockSendBatchToForwarders).toHaveBeenCalledWith(
                expect.objectContaining({
                    mpid: 'test-mpid',
                })
            );
        });

        it('should call sendBatchToForwarders before onCreateBatch', () => {
            const callOrder: string[] = [];

            mockSendBatchToForwarders.mockImplementation(() => {
                callOrder.push('sendBatchToForwarders');
            });

            mockMPInstance._Store.SDKConfig.onCreateBatch = (batch) => {
                callOrder.push('onCreateBatch');
                return batch;
            };

            const mockEvents = [
                {
                    EventName: 'Test Event',
                    EventDataType: 4,
                    MPID: 'test-mpid',
                    SessionId: 'session-1',
                    EventCategory: 1,
                    Timestamp: Date.now(),
                },
            ];

            const mockUser = {
                getMPID: () => 'test-mpid',
                getConsentState: () => null,
                getUserIdentities: () => ({ userIdentities: {} }),
                getAllUserAttributes: () => ({}),
            };

            BatchUploader['createNewBatches'](
                mockEvents as any,
                mockUser as any,
                mockMPInstance
            );

            expect(callOrder).toEqual([
                'sendBatchToForwarders',
                'onCreateBatch',
            ]);
        });

        it('should forward batch before onCreateBatch can modify it', () => {
            let forwardedEventCount = 0;

            mockSendBatchToForwarders.mockImplementation((batch) => {
                forwardedEventCount = batch.events.length;
            });

            mockMPInstance._Store.SDKConfig.onCreateBatch = (batch) => {
                batch.modified = true;
                batch.events = [];
                return batch;
            };

            const mockEvents = [
                {
                    EventName: 'Test Event',
                    EventDataType: 4,
                    MPID: 'test-mpid',
                    SessionId: 'session-1',
                    EventCategory: 1,
                    Timestamp: Date.now(),
                },
            ];

            const mockUser = {
                getMPID: () => 'test-mpid',
                getConsentState: () => null,
                getUserIdentities: () => ({ userIdentities: {} }),
                getAllUserAttributes: () => ({}),
            };

            BatchUploader['createNewBatches'](
                mockEvents as any,
                mockUser as any,
                mockMPInstance
            );

            expect(forwardedEventCount).toBeGreaterThan(0);
        });

        it('should forward batch even when onCreateBatch drops it', () => {
            mockMPInstance._Store.SDKConfig.onCreateBatch = () => {
                return null;
            };

            (mockMPInstance.Logger as any).warning = jest.fn();

            const mockEvents = [
                {
                    EventName: 'Test Event',
                    EventDataType: 4,
                    MPID: 'test-mpid',
                    SessionId: 'session-1',
                    EventCategory: 1,
                    Timestamp: Date.now(),
                },
            ];

            const mockUser = {
                getMPID: () => 'test-mpid',
                getConsentState: () => null,
                getUserIdentities: () => ({ userIdentities: {} }),
                getAllUserAttributes: () => ({}),
            };

            BatchUploader['createNewBatches'](
                mockEvents as any,
                mockUser as any,
                mockMPInstance
            );

            expect(mockSendBatchToForwarders).toHaveBeenCalledTimes(1);
        });

        it('should not throw if sendBatchToForwarders errors', () => {
            mockSendBatchToForwarders.mockImplementation(() => {
                throw new Error('Kit failure');
            });

            const mockEvents = [
                {
                    EventName: 'Test Event',
                    EventDataType: 4,
                    MPID: 'test-mpid',
                    SessionId: 'session-1',
                    EventCategory: 1,
                    Timestamp: Date.now(),
                },
            ];

            const mockUser = {
                getMPID: () => 'test-mpid',
                getConsentState: () => null,
                getUserIdentities: () => ({ userIdentities: {} }),
                getAllUserAttributes: () => ({}),
            };

            expect(() => {
                BatchUploader['createNewBatches'](
                    mockEvents as any,
                    mockUser as any,
                    mockMPInstance
                );
            }).not.toThrow();

            expect(mockMPInstance.Logger.error).toHaveBeenCalled();
        });

        it('should create separate batches per MPID and forward each', () => {
            const mockEvents = [
                {
                    EventName: 'Event User A',
                    EventDataType: 4,
                    MPID: 'mpid-a',
                    SessionId: 'session-1',
                    EventCategory: 1,
                    Timestamp: Date.now(),
                },
                {
                    EventName: 'Event User B',
                    EventDataType: 4,
                    MPID: 'mpid-b',
                    SessionId: 'session-1',
                    EventCategory: 1,
                    Timestamp: Date.now(),
                },
            ];

            const mockUser = {
                getMPID: () => 'mpid-a',
                getConsentState: () => null,
                getUserIdentities: () => ({ userIdentities: {} }),
                getAllUserAttributes: () => ({}),
            };

            BatchUploader['createNewBatches'](
                mockEvents as any,
                mockUser as any,
                mockMPInstance
            );

            expect(mockSendBatchToForwarders).toHaveBeenCalledTimes(2);
        });
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
}); 