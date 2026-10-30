import { BatchUploader } from '../../src/batchUploader';
import { StorageResult } from '../../src/vault';
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
        const ok = { ok: true, status: 200 };
        const failed = { ok: false, status: 500 };
        const batch = (id: string, createdAt: number) => ({
            source_request_id: id,
            timestamp_unixtime_ms: createdAt,
            events: [{ event_type: 'custom_event' }],
        });
        const storedIds = () =>
            (JSON.parse(window.localStorage.getItem(`${storageName}-batches`) || '[]') as Array<{ source_request_id: string }>).map(
                stored => stored.source_request_id
            );
        let uploader: BatchUploader;
        let settlers: Array<(response: { ok: boolean; status: number }) => void>;

        beforeEach(() => {
            window.localStorage.clear();
            window.sessionStorage.clear();
            (mockMPInstance._Store as any).storageName = storageName;
            (mockMPInstance._Store as any).deviceId = 'overlap-device';
            mockMPInstance._Helpers.getFeatureFlag = jest.fn().mockReturnValue('100');
            uploader = new BatchUploader(mockMPInstance, 1000);
            settlers = [];
            global.fetch = jest.fn().mockImplementation(() => new Promise(resolve => settlers.push(resolve)));
        });

        afterEach(() => {
            uploader.destroy();
            window.localStorage.clear();
        });

        // Two uploads with one batch each, both in flight at once; the first holds the older batch.
        const startBoth = async (secondCreatedAt = 2000): Promise<Array<Promise<void>>> => {
            (uploader as any).batchesQueuedForProcessing = [batch('first', 1000)];
            const first = (uploader as any).prepareAndUpload(false, false);
            (uploader as any).batchesQueuedForProcessing = [batch('second', secondCreatedAt)];
            const second = (uploader as any).prepareAndUpload(false, false);
            await Promise.resolve();
            expect(settlers).toHaveLength(2);
            return [first, second];
        };

        it.each([
            ['the earlier one succeeds after the later one failed', [1, 0], [failed, ok], ['second']],
            ['both fail, the later one first', [1, 0], [failed, failed], ['first', 'second']],
            ['both fail, the earlier one first', [0, 1], [failed, failed], ['first', 'second']],
        ])('keeps the stored batches in creation order when %s', async (_, order, responses, expected) => {
            const uploads = await startBoth();
            for (let step = 0; step < order.length; step++) {
                settlers[order[step]](responses[step]);
                await uploads[order[step]];
            }

            expect(storedIds()).toEqual(expected);
        });

        it('keeps creation order for batches created in the same millisecond', async () => {
            const [first, second] = await startBoth(1000);
            settlers[0](failed);
            await first;
            settlers[1](failed);
            await second;

            expect(storedIds()).toEqual(['first', 'second']);
        });

        it.each([
            ['created apart', 2000],
            ['created in the same millisecond', 1000],
        ])('drops the older batch when only one fits, whichever upload stored first, %s', async (_, secondCreatedAt) => {
            const vault = (uploader as any).batchVault;
            const store = vault.store.bind(vault);
            jest.spyOn(vault, 'store').mockImplementation((...args: unknown[]) =>
                (args[0] as unknown[]).length > 1 ? StorageResult.QuotaExceeded : store(args[0])
            );
            const [first, second] = await startBoth(secondCreatedAt);
            settlers[0](failed);
            await first;
            settlers[1](failed);
            await second;

            expect(storedIds()).toEqual(['second']);
        });
        it.each([
            ['refused', false, ['exit']],
            ['accepted', true, []],
        ])('stores the batch for the next page only when its exit beacon is refused (%s)', async (_, accepted, expected) => {
            (navigator as any).sendBeacon = jest.fn().mockReturnValue(accepted);
            const store = jest.spyOn((uploader as any).batchVault, 'store');
            (uploader as any).batchesQueuedForProcessing = [batch('exit', 1000)];

            await (uploader as any).prepareAndUpload(false, true);

            expect(storedIds()).toEqual(expected);
            expect(store).toHaveBeenCalledTimes(accepted ? 0 : 1);
            delete (navigator as any).sendBeacon;
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

    describe('fetch upload', () => {
        const smallBatch = () => ({ events: [{ event_type: 'custom_event' }] } as any);

        it('sends a small batch without keepalive', async () => {
            await batchUploader['uploadBatches']([smallBatch()], false);

            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect((global.fetch as jest.Mock).mock.calls[0][1]).not.toHaveProperty('keepalive');
        });

        it('requeues a batch when the request is refused', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Failed to fetch'));
            const batch = smallBatch();

            const notUploaded = await batchUploader['uploadBatches']([batch], false);

            expect(notUploaded).toEqual([batch]);
        });
    });

    describe('exit beacon', () => {
        const batch = (id: string) =>
            ({ source_request_id: id, events: [{ event_type: 'custom_event' }] } as any);
        let sendBeacon: jest.Mock;

        beforeEach(() => {
            sendBeacon = jest.fn().mockReturnValue(true);
            (navigator as any).sendBeacon = sendBeacon;
        });

        afterEach(() => {
            delete (navigator as any).sendBeacon;
        });

        it('sends every batch and keeps none when the browser accepts them', async () => {
            const notSent = await batchUploader['uploadBatches']([batch('a'), batch('b')], true);

            expect(sendBeacon).toHaveBeenCalledTimes(2);
            expect(notSent).toBeNull();
            expect(mockMPInstance.Logger.warning).not.toHaveBeenCalled();
        });

        it('keeps a refused batch and the ones after it, and logs it', async () => {
            sendBeacon.mockReturnValueOnce(true).mockReturnValueOnce(false);
            const batches = [batch('a'), batch('b'), batch('c')];

            const notSent = await batchUploader['uploadBatches'](batches, true);

            expect(sendBeacon).toHaveBeenCalledTimes(2);
            expect(notSent).toEqual([batches[1], batches[2]]);
            expect(global.fetch).not.toHaveBeenCalled();
            expect(mockMPInstance.Logger.warning).toHaveBeenCalledWith(
                expect.stringContaining('refused the exit upload of 2 batch(es)')
            );
        });

        it('requeues a refused batch for the next upload', async () => {
            sendBeacon.mockReturnValue(false);
            (batchUploader as any).batchesQueuedForProcessing = [batch('a')];

            await batchUploader.prepareAndUpload(false, true);

            expect(
                (batchUploader as any).batchesQueuedForProcessing.map(
                    (queued: { source_request_id: string }) => queued.source_request_id
                )
            ).toEqual(['a']);
        });
    });
}); 