import ForwardingStatsUploader, {
    IForwardingStatsUploader,
} from '../../src/forwardingStatsUploader';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';

interface FakeXHR {
    readyState: number;
    status: number;
    statusText: string;
    callback: () => void;
}

describe('forwardingStatsUploader', () => {
    const TIMEOUT = 5000;
    let uploadsTable: Record<string, { uploading: boolean; data: unknown[] }>;
    let queue: unknown[];
    let sent: Array<{ data: unknown[]; xhr: FakeXHR }>;
    let mpInstance: IMParticleWebSDKInstance;
    let uploader: IForwardingStatsUploader;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.spyOn(Date, 'now').mockReturnValue(1000);

        uploadsTable = {};
        queue = [];
        sent = [];

        mpInstance = ({
            _Store: { SDKConfig: { forwarderStatsTimeout: TIMEOUT } },
            _Forwarders: {
                getForwarderStatsQueue: jest.fn(() => queue),
                setForwarderStatsQueue: jest.fn((next: unknown[]) => {
                    queue = next;
                }),
            },
            _Persistence: { forwardingStatsBatches: { uploadsTable } },
            _Helpers: {
                createXHR: jest.fn(
                    (callback: () => void): FakeXHR => ({
                        readyState: 0,
                        status: 0,
                        statusText: '',
                        callback,
                    })
                ),
            },
            _APIClient: {
                sendBatchForwardingStatsToServer: jest.fn(
                    (data: unknown[], xhr: FakeXHR) => {
                        sent.push({ data, xhr });
                    }
                ),
            },
            Logger: { verbose: jest.fn() },
        } as unknown) as IMParticleWebSDKInstance;

        uploader = new (ForwardingStatsUploader as any)(mpInstance);
    });

    afterEach(() => {
        clearInterval((window.mParticle as any)._forwardingStatsTimer);
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    function respond(xhr: FakeXHR, status: number): void {
        xhr.readyState = 4;
        xhr.status = status;
        xhr.statusText = String(status);
        xhr.callback();
    }

    it('stores the timer on window.mParticle and runs at the configured interval', () => {
        uploader.startForwardingStatsTimer();

        expect((window.mParticle as any)._forwardingStatsTimer).toBeDefined();
        jest.advanceTimersByTime(TIMEOUT - 1);
        expect(mpInstance._Forwarders.getForwarderStatsQueue).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1);
        expect(mpInstance._Forwarders.getForwarderStatsQueue).toHaveBeenCalledTimes(1);
    });

    it('sends nothing when the queue and the uploads table are empty', () => {
        uploader.startForwardingStatsTimer();
        jest.advanceTimersByTime(TIMEOUT);

        expect(sent).toHaveLength(0);
        expect(mpInstance._Forwarders.setForwarderStatsQueue).not.toHaveBeenCalled();
    });

    it('moves the queue into the uploads table, clears it and sends it', () => {
        queue = [{ mid: 1 }, { mid: 2 }];
        uploader.startForwardingStatsTimer();
        jest.advanceTimersByTime(TIMEOUT);

        expect(mpInstance._Forwarders.setForwarderStatsQueue).toHaveBeenCalledWith([]);
        expect(sent).toHaveLength(1);
        expect(sent[0].data).toEqual([{ mid: 1 }, { mid: 2 }]);
        expect(uploadsTable[1000].uploading).toBe(true);
    });

    it.each([200, 202])('deletes the batch after a %i response', status => {
        queue = [{ mid: 1 }];
        uploader.startForwardingStatsTimer();
        jest.advanceTimersByTime(TIMEOUT);

        respond(sent[0].xhr, status);

        expect(uploadsTable[1000]).toBeUndefined();
        expect(mpInstance.Logger.verbose).toHaveBeenCalled();
    });

    it('deletes the batch after a 4xx response other than 429', () => {
        queue = [{ mid: 1 }];
        uploader.startForwardingStatsTimer();
        jest.advanceTimersByTime(TIMEOUT);

        respond(sent[0].xhr, 400);

        expect(uploadsTable[1000]).toBeUndefined();
    });

    it('leaves a rate-limited batch marked uploading (never retried)', () => {
        // Documents current behaviour, not the intended contract: a 429
        // skips the delete but never resets `uploading`, so the retry loop
        // skips this batch for the life of the page. A fix that retries
        // rate-limited batches should update this test.
        queue = [{ mid: 1 }];
        uploader.startForwardingStatsTimer();
        jest.advanceTimersByTime(TIMEOUT);

        respond(sent[0].xhr, 429);

        expect(uploadsTable[1000]).toBeDefined();
        expect(uploadsTable[1000].uploading).toBe(true);
    });

    it('marks the batch for retry after a 5xx response and resends it', () => {
        queue = [{ mid: 1 }];
        uploader.startForwardingStatsTimer();
        jest.advanceTimersByTime(TIMEOUT);

        respond(sent[0].xhr, 500);
        expect(uploadsTable[1000].uploading).toBe(false);

        jest.advanceTimersByTime(TIMEOUT);
        expect(sent).toHaveLength(2);
        expect(sent[1].data).toEqual([{ mid: 1 }]);
    });

    it('ignores callbacks before the request finishes', () => {
        queue = [{ mid: 1 }];
        uploader.startForwardingStatsTimer();
        jest.advanceTimersByTime(TIMEOUT);

        const xhr = sent[0].xhr;
        xhr.readyState = 3;
        xhr.callback();

        expect(uploadsTable[1000].uploading).toBe(true);
    });

    it('does not resend a batch that is still uploading', () => {
        uploadsTable[500] = { uploading: true, data: [{ mid: 9 }] };
        uploader.startForwardingStatsTimer();
        jest.advanceTimersByTime(TIMEOUT);

        expect(sent).toHaveLength(0);
    });

    it('sends batches left in the uploads table from earlier runs', () => {
        uploadsTable[500] = { uploading: false, data: [{ mid: 9 }] };
        uploader.startForwardingStatsTimer();
        jest.advanceTimersByTime(TIMEOUT);

        expect(sent).toHaveLength(1);
        expect(sent[0].data).toEqual([{ mid: 9 }]);
    });
});
