import { BatchUploader } from '../../src/batchUploader';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';

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
                    flags: {},
                },
                sideloadedKitsCount: 0,
            },
            _Helpers: {
                getFeatureFlag: jest.fn().mockReturnValue(false),
                createServiceUrl: jest.fn().mockReturnValue('https://mock-url.com'),
                generateUniqueId: jest.fn().mockReturnValue('mock-uuid'),
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
        batchUploader.destroy();
        jest.useRealTimers();
        global.fetch = originalFetch;
    });

    describe('offline storage with overlapping uploads', () => {
        const storageName = 'mprtcl-v4_overlap';
        const batch = (id: string) => ({ source_request_id: id, events: [{ event_type: 'custom_event' }] });
        const storedIds = () =>
            (JSON.parse(window.localStorage.getItem(`${storageName}-batches`) || '[]') as Array<{ source_request_id: string }>).map(
                stored => stored.source_request_id
            );
        let uploader: BatchUploader;
        let settleFirst: (response: { ok: boolean; status: number }) => void;

        beforeEach(() => {
            window.localStorage.clear();
            window.sessionStorage.clear();
            (mockMPInstance._Store as any).storageName = storageName;
            (mockMPInstance._Store as any).deviceId = 'overlap-device';
            mockMPInstance._Helpers.getFeatureFlag = jest.fn().mockReturnValue('100');
            uploader = new BatchUploader(mockMPInstance, 1000);
            global.fetch = jest
                .fn()
                .mockImplementationOnce(() => new Promise(resolve => (settleFirst = resolve)))
                .mockResolvedValueOnce({ ok: false, status: 500 });
        });

        afterEach(() => {
            uploader.destroy();
            window.localStorage.clear();
        });

        // The first upload is in flight when the second fails and stores its batch.
        const overlap = async (): Promise<{ first: Promise<void> }> => {
            (uploader as any).batchesQueuedForProcessing = [batch('first')];
            const first = (uploader as any).prepareAndUpload(false, false);
            (uploader as any).batchesQueuedForProcessing = [batch('second')];
            await (uploader as any).prepareAndUpload(false, false);
            expect(storedIds()).toEqual(['second']);
            return { first };
        };

        it('keeps the batch a later upload stored when the earlier one succeeds', async () => {
            const { first } = await overlap();
            settleFirst({ ok: true, status: 200 });
            await first;

            expect(storedIds()).toEqual(['second']);
        });

        it('stores both, oldest first, when the earlier upload fails too', async () => {
            const { first } = await overlap();
            settleFirst({ ok: false, status: 500 });
            await first;

            expect(storedIds()).toEqual(['first', 'second']);
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