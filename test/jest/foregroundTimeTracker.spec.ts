import ForegroundTimeTracker from '../../src/foregroundTimeTracker';

describe('ForegroundTimeTracker', () => {
    let foregroundTimeTracker: ForegroundTimeTracker;
    const apiKey = 'test-key';
    const mockStorageKey = `mp-time-${apiKey}`;

    beforeEach(() => {
        // Although in Jest, document.hidden should be false by default, we force it to be this way
        // to ensure the page is in the foreground
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });
        jest.useFakeTimers();
        localStorage.clear();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.restoreAllMocks();
    });

    it('should initialize with correct localStorage key', () => {
        foregroundTimeTracker = new ForegroundTimeTracker(apiKey);
        expect(foregroundTimeTracker['localStorageName']).toBe(mockStorageKey);
    });

    it('should load time from localStorage on initialization', () => {
        localStorage.setItem(mockStorageKey, '1000');
        foregroundTimeTracker = new ForegroundTimeTracker(apiKey);
        expect(foregroundTimeTracker['totalTime']).toBe(1000);
    });

    it('should start tracking when the page is visible', () => {
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });
        jest.spyOn(global.performance, 'now')
            .mockReturnValueOnce(1000);
        foregroundTimeTracker = new ForegroundTimeTracker(apiKey);

        expect(foregroundTimeTracker['isTrackerActive']).toBe(true);
        expect(foregroundTimeTracker['startTime']).toBe(1000);
    });

    it('should not start tracking if the page is hidden', () => {
        Object.defineProperty(document, 'hidden', { value: true });
        jest.spyOn(global.performance, 'now')
            .mockReturnValueOnce(1000);
        foregroundTimeTracker = new ForegroundTimeTracker(apiKey);
        expect(foregroundTimeTracker['isTrackerActive']).toBe(false);

        // since the page is hidden, it does not call performance.now
        expect(foregroundTimeTracker['startTime']).toBe(0);
    });

    it('should stop tracking when the page becomes hidden', () => {
        jest.spyOn(global.performance, 'now')
            .mockReturnValueOnce(1000)
            .mockReturnValueOnce(2000)
            .mockReturnValueOnce(3000);

        Object.defineProperty(document, 'hidden', { value: false, configurable: true });

        foregroundTimeTracker = new ForegroundTimeTracker(apiKey);

        expect(foregroundTimeTracker['totalTime']).toBe(0);
        expect(foregroundTimeTracker['isTrackerActive']).toBe(true);
        foregroundTimeTracker['handleVisibilityChange']();
        expect(foregroundTimeTracker['isTrackerActive']).toBe(true);

        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        foregroundTimeTracker['handleVisibilityChange']();
        expect(foregroundTimeTracker['isTrackerActive']).toBe(false);
    });

    it('should resume tracking when the page becomes visible again', () => {
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });
        foregroundTimeTracker = new ForegroundTimeTracker(apiKey);
        expect(foregroundTimeTracker['isTrackerActive']).toBe(true);

        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        foregroundTimeTracker['handleVisibilityChange']();
        expect(foregroundTimeTracker['isTrackerActive']).toBe(false);

        Object.defineProperty(document, 'hidden', { value: false, configurable: true });
        foregroundTimeTracker['handleVisibilityChange']();
        expect(foregroundTimeTracker['isTrackerActive']).toBe(true);
    });

    it('should correctly calculate time in foreground', () => {
        jest.spyOn(global.performance, 'now')
            .mockReturnValueOnce(10)
            .mockReturnValueOnce(50)
        foregroundTimeTracker = new ForegroundTimeTracker(apiKey);

        expect(foregroundTimeTracker.getTimeInForeground()).toBe(40);
    });

    it('should update time in localStorage and totalTimewhen the page is hidden', () => {
        jest.spyOn(global.performance, 'now')
            .mockReturnValueOnce(10)
            .mockReturnValueOnce(50)
        foregroundTimeTracker = new ForegroundTimeTracker(apiKey);
        foregroundTimeTracker['totalTime'] = 1000;

        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        foregroundTimeTracker['handleVisibilityChange']();
        expect(foregroundTimeTracker['isTrackerActive']).toBe(false);
        expect(localStorage.getItem(mockStorageKey)).toBe('1040');
        expect(foregroundTimeTracker['totalTime']).toBe(1040);
    });

    it('should set startTime to the last performance.now call when stopping tracking', () => {
        jest.spyOn(global.performance, 'now')
            .mockReturnValueOnce(10)
            .mockReturnValueOnce(50)
        foregroundTimeTracker = new ForegroundTimeTracker(apiKey);
        foregroundTimeTracker['stopTracking']();
        expect(foregroundTimeTracker['startTime']).toBe(50);
    });

    it('should update totalTime from localStorage when storage event occurs', () => {
        localStorage.setItem(mockStorageKey, '7000');
        const event = new StorageEvent('storage', {
            key: mockStorageKey,
            newValue: '7000',
        });

        foregroundTimeTracker = new ForegroundTimeTracker(apiKey);

        foregroundTimeTracker['syncAcrossTabs'](event);
        expect(foregroundTimeTracker['totalTime']).toBe(7000);
    });

    it('should not overwrite totalTime if the new value is smaller', () => {
        foregroundTimeTracker = new ForegroundTimeTracker(apiKey);

        foregroundTimeTracker['totalTime'] = 8000;
        const event = new StorageEvent('storage', {
            key: mockStorageKey,
            newValue: '3000',
        });

        foregroundTimeTracker['syncAcrossTabs'](event);
        expect(foregroundTimeTracker['totalTime']).toBe(8000);
    });

    it('should reset totalTime and update localStorage', () => {
        foregroundTimeTracker = new ForegroundTimeTracker(apiKey);

        foregroundTimeTracker['totalTime'] = 5000;
        foregroundTimeTracker.resetTimer();
        expect(foregroundTimeTracker['totalTime']).toBe(0);
        expect(localStorage.getItem(mockStorageKey)).toBe('0');
    });
});