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
    
    describe('addHandlers', () => {
        let tracker: ForegroundTimeTracker;
        
        beforeEach(() => {
            jest.spyOn(document, 'addEventListener');
            jest.spyOn(window, 'addEventListener');
            tracker = new ForegroundTimeTracker(mockStorageKey);
        });
        
        afterEach(() => {
            jest.restoreAllMocks();
        });
        
        it('should add event listeners when instantiated', () => {
            expect(document.addEventListener).toHaveBeenCalledWith(
                'visibilitychange',
                expect.any(Function)
            );
            expect(window.addEventListener).toHaveBeenCalledWith(
                'beforeunload',
                expect.any(Function)
            );
            expect(window.addEventListener).toHaveBeenCalledWith(
                'storage',
                expect.any(Function)
            );
            expect(window.addEventListener).toHaveBeenCalledWith(
                'focus',
                expect.any(Function)
            );
            expect(window.addEventListener).toHaveBeenCalledWith(
                'blur',
                expect.any(Function)
            );
        });
        
        it('should call visibilitychange when visibility changes', () => {
            const spy = jest.spyOn(tracker as any, 'handleVisibilityChange');

            document.dispatchEvent(new Event('visibilitychange'));
            expect(spy).toHaveBeenCalled();
        });
        
        it('should call updateTimeInPersistence before unloading', () => {
            const spy = jest.spyOn(tracker, 'updateTimeInPersistence');
            window.dispatchEvent(new Event('beforeunload'));
            expect(spy).toHaveBeenCalled();
        });
        
        it('should call syncAcrossTabs when storage changes', () => {
            const spy = jest.spyOn(tracker as any, 'syncAcrossTabs');
            window.dispatchEvent(new StorageEvent('storage', { key: 'mp-time-test' }));
            expect(spy).toHaveBeenCalled();
        });
        
        it('should call handleWindowFocus when window gains focus', () => {
            const spy = jest.spyOn(tracker as any, 'handleWindowFocus');
            window.dispatchEvent(new Event('focus'));
            expect(spy).toHaveBeenCalled();
        });
        
        it('should call handleWindowBlur when window loses focus', () => {
            const spy = jest.spyOn(tracker as any, 'handleWindowBlur');
            window.dispatchEvent(new Event('blur'));
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('loadTimeFromStorage', () => {
        let tracker: ForegroundTimeTracker;

        beforeEach(() => {
            localStorage.clear();
        });

        it('should initialize with correct localStorage key', () => {
            foregroundTimeTracker = new ForegroundTimeTracker(apiKey);
            expect(foregroundTimeTracker['localStorageName']).toBe(mockStorageKey);
        });

        it('should load the time from localStorage if it exists', () => {
            localStorage.setItem(`mp-time-${mockStorageKey}`, '1234');

            tracker = new ForegroundTimeTracker(mockStorageKey);
            expect(tracker.totalTime).toBe(1234);
        });

        it('should set totalTime to 0 if localStorage has no value', () => {
            // Ensure there's nothing stored in localStorage
            localStorage.removeItem(`mp-time-${mockStorageKey}`);

            tracker = new ForegroundTimeTracker(mockStorageKey);
            expect(tracker.totalTime).toBe(0);
        });

        it('should handle non-numeric values gracefully', () => {
            localStorage.setItem(`mp-time-${mockStorageKey}`, 'invalid');

            tracker = new ForegroundTimeTracker(mockStorageKey);
            console.log(tracker.totalTime);
            expect(tracker.totalTime).toBeNaN();
        });
    });

    describe('handleWindowBlur', () => {
        let tracker: ForegroundTimeTracker;

        beforeEach(() => {
            localStorage.clear();
            tracker = new ForegroundTimeTracker(mockStorageKey);

            // Manually set startTime and isTrackerActive for testing
            tracker.startTime = 1000;
            tracker['isTrackerActive'] = true;
        });

        it('should call stopTracking when window loses focus (blur)', () => {
            const stopTrackingSpy = jest.spyOn(tracker as any, 'stopTracking');

            window.dispatchEvent(new Event('blur'));

            expect(stopTrackingSpy).toHaveBeenCalled();
        });

        it('should update isTrackerActive to false when window loses focus', () => {
            const stopTrackingSpy = jest.spyOn(tracker as any, 'stopTracking');

            window.dispatchEvent(new Event('blur'));

            expect(tracker['isTrackerActive']).toBe(false);
            expect(stopTrackingSpy).toHaveBeenCalled();
        });

        it('should call setTotalTime and updateTimeInPersistence when window loses focus', () => {
            const setTotalTimeSpy = jest.spyOn(tracker as any, 'setTotalTime');
            const updateTimeInPersistenceSpy = jest.spyOn(tracker as any, 'updateTimeInPersistence');

            window.dispatchEvent(new Event('blur'));

            expect(setTotalTimeSpy).toHaveBeenCalled();
            expect(updateTimeInPersistenceSpy).toHaveBeenCalled();
        });
    });

    describe.only('handleWindowFocus', () => {
        let tracker: ForegroundTimeTracker;

        beforeEach(() => {
            localStorage.clear();
            tracker = new ForegroundTimeTracker(mockStorageKey);

            tracker.startTime = 1000;
            tracker['isTrackerActive'] = false;
        });

        it('should call startTracking when window gains focus', () => {
            const startTrackingSpy = jest.spyOn(tracker as any, 'startTracking');

            window.dispatchEvent(new Event('focus'));

            expect(startTrackingSpy).toHaveBeenCalled();
        });

        it('should set isTrackerActive to true when window gains focus', () => {
            const startTrackingSpy = jest.spyOn(tracker as any, 'startTracking');

            window.dispatchEvent(new Event('focus'));

            expect(tracker['isTrackerActive']).toBe(true);
            expect(startTrackingSpy).toHaveBeenCalled();
        });

        // TODO: for some reason this fails without the set timeout.  is there a delay for the window to dispatch the event?
        // iti passes when it's the only test run, or when it's the top test here.  but when it's last it fails as it currently is
        it('should update startTime when window gains focus', () => {
            jest.spyOn(global.performance, 'now')
                .mockReturnValueOnce(1001)

            // Dispatch a focus event
            window.dispatchEvent(new Event('focus'));
            // setTimeout(() => {
                // Ensure startTime was updated
                expect(tracker.startTime).toBe(1001);
            // })
        });
    });

    describe('startTracking', () => {
        let tracker: ForegroundTimeTracker;

        beforeEach(() => {
            localStorage.clear();
            tracker = new ForegroundTimeTracker(mockStorageKey);

            tracker.startTime = 0;
            tracker['isTrackerActive'] = false;
        });

        it('should set startTime to current time when startTracking is called', () => {
            jest.spyOn(global.performance, 'now')
                .mockReturnValueOnce(1001)
            // Store the current time before calling startTracking
            const previousStartTime = tracker.startTime;

            tracker['startTracking']();

            // Check if startTime is updated and greater than the previous value
            expect(tracker.startTime).toBe(1001);
        });

        it('should set isTrackerActive to true when startTracking is called', () => {
            // Call the private method startTracking indirectly via focus event
            tracker['startTracking']();

            // Check that the tracker is active
            expect(tracker['isTrackerActive']).toBe(true);
        });

        it('should not start tracking if the document is hidden (document.hidden = true)', () => {
            // Set the document to hidden (as if the tab is not in focus)
            Object.defineProperty(document, 'hidden', { value: true });

            // Spy on startTime to check if it gets updated
            const startTimeSpy = jest.spyOn(tracker as any, 'startTracking');

            // Call the private method startTracking indirectly via focus event
            tracker['startTracking']();

            // Ensure that startTracking didn't update the startTime because the document is hidden
            expect(startTimeSpy).toHaveBeenCalled();
            expect(tracker.startTime).toBe(0);
            expect(tracker['isTrackerActive']).toBe(false);
        });
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