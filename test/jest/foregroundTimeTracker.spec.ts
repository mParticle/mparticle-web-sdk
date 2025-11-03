import ForegroundTimeTracker from '../../src/foregroundTimeTracker';
import Store, { IStore } from '../../src/store';
import { SDKInitConfig } from '../../src/sdkRuntimeModels';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';

describe('ForegroundTimeTracker', () => {
    let foregroundTimeTracker: ForegroundTimeTracker;
    const timerKey = 'test-key';
    const mockStorageKey = `mprtcl-tos-${timerKey}`;
    
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
    
    describe('#constructor', () => {
        it('should set the localStorageName properly', () => {
            foregroundTimeTracker = new ForegroundTimeTracker(timerKey);
            expect(foregroundTimeTracker['localStorageName']).toBe(mockStorageKey);
        });
    
        it('should load time from localStorage on initialization', () => {
            localStorage.setItem(mockStorageKey, '1000');
            foregroundTimeTracker = new ForegroundTimeTracker(timerKey);
            expect(foregroundTimeTracker['totalTime']).toBe(1000);
        });

        it('should call addHandlers', () => {
            const addHandlersSpy = jest.spyOn(ForegroundTimeTracker.prototype as any, 'addHandlers');
            foregroundTimeTracker = new ForegroundTimeTracker(timerKey);
            expect(addHandlersSpy).toHaveBeenCalled();
        });

        it('should call startTracking if the document is not hidden', () => {
            Object.defineProperty(document, 'hidden', { value: false });
            const startTrackingSpy = jest.spyOn(ForegroundTimeTracker.prototype as any, 'startTracking');
            foregroundTimeTracker = new ForegroundTimeTracker(timerKey);
            expect(startTrackingSpy).toHaveBeenCalled();
        });

        it('should not call startTracking if the document is hidden', () => {
            Object.defineProperty(document, 'hidden', { value: true });
            const startTrackingSpy = jest.spyOn(ForegroundTimeTracker.prototype as any, 'startTracking');
            foregroundTimeTracker = new ForegroundTimeTracker(timerKey);

            expect(startTrackingSpy).not.toHaveBeenCalled();
        });
    });

    describe('#addHandlers', () => {
        let tracker: ForegroundTimeTracker;
        
        beforeEach(() => {
            jest.spyOn(document, 'addEventListener');
            jest.spyOn(window, 'addEventListener');
            tracker = new ForegroundTimeTracker(timerKey);
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
                'blur',
                expect.any(Function)
            );
            expect(window.addEventListener).toHaveBeenCalledWith(
                'focus',
                expect.any(Function)
            );
            expect(window.addEventListener).toHaveBeenCalledWith(
                'storage',
                expect.any(Function)
            );
        });
        
        it('should call handleVisibilityChange when visibility changes', () => {
            const spy = jest.spyOn(tracker as any, 'handleVisibilityChange');

            document.dispatchEvent(new Event('visibilitychange'));
            expect(spy).toHaveBeenCalled();
        });
        
        it('should call updateTimeInPersistence when beforeunload is triggered', () => {
            const spy = jest.spyOn(tracker, 'updateTimeInPersistence');
            window.dispatchEvent(new Event('beforeunload'));
            expect(spy).toHaveBeenCalled();
        });
        
        it('should call handleWindowBlur when window loses focus', () => {
            const spy = jest.spyOn(tracker as any, 'handleWindowBlur');
            window.dispatchEvent(new Event('blur'));
            expect(spy).toHaveBeenCalled();
        });

        it('should call handleWindowFocus when window gains focus', () => {
            const spy = jest.spyOn(tracker as any, 'handleWindowFocus');
            window.dispatchEvent(new Event('focus'));
            expect(spy).toHaveBeenCalled();
        });

        it('should call syncAcrossTabs when storage changes', () => {
            const spy = jest.spyOn(tracker as any, 'syncAcrossTabs');
            window.dispatchEvent(new StorageEvent('storage', { key: 'mprtcl-tos-test' }));
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('#loadTimeFromStorage', () => {
        let tracker: ForegroundTimeTracker;

        it('should load the time from localStorage if it exists', () => {
            localStorage.setItem(`mprtcl-tos-${timerKey}`, '1234');

            tracker = new ForegroundTimeTracker(timerKey);
            expect(tracker.totalTime).toBe(1234);
        });

        it('should set totalTime to 0 if localStorage has no value', () => {
            tracker = new ForegroundTimeTracker(timerKey);
            expect(tracker.totalTime).toBe(0);
        });

        it('should set totalTime to 0 if there is a non-numeric value in localStorage for time on site', () => {
            localStorage.setItem(`mprtcl-tos-${timerKey}`, '"invalid"');

            tracker = new ForegroundTimeTracker(timerKey);
            expect(tracker.totalTime).toBe(0);
        });
    });

    describe('#handleWindowBlur', () => {
        let tracker: ForegroundTimeTracker;

        beforeEach(() => {
            tracker = new ForegroundTimeTracker(timerKey);

            // Manually set startTime and isTrackerActive for testing
            tracker.startTime = 1000;
            tracker['isTrackerActive'] = true;
        });

        it('should call stopTracking when window loses focus (blur event fired)', () => {
            const stopTrackingSpy = jest.spyOn(tracker as any, 'stopTracking');

            window.dispatchEvent(new Event('blur'));

            expect(stopTrackingSpy).toHaveBeenCalled();
        });
    });

    describe('#handleWindowFocus', () => {
        let tracker: ForegroundTimeTracker;

        beforeEach(() => {
            tracker = new ForegroundTimeTracker(timerKey);

            tracker.startTime = 1000;
            tracker['isTrackerActive'] = false;
        });

        it('should call startTracking when window gains focus', () => {
            const startTrackingSpy = jest.spyOn(tracker as any, 'startTracking');

            window.dispatchEvent(new Event('focus'));

            expect(startTrackingSpy).toHaveBeenCalled();
        });
    });

    describe('#startTracking', () => {
        let tracker: ForegroundTimeTracker;

        beforeEach(() => {
            tracker = new ForegroundTimeTracker(timerKey);

            tracker.startTime = 0;
            tracker['isTrackerActive'] = false;
        });

        it('should set startTime to performance.now() when startTracking is called', () => {
            jest.spyOn(global.performance, 'now')
                .mockReturnValueOnce(1001)

            tracker['startTracking']();
            expect(tracker.startTime).toBe(1001);
        });

        it('should set isTrackerActive to true when startTracking is called', () => {
            expect(tracker['isTrackerActive']).toBe(false);
            tracker['startTracking']();

            // Check that the tracker is active
            expect(tracker['isTrackerActive']).toBe(true);
        });

        it('should not start tracking if the document is hidden (document.hidden = true)', () => {
            // Set the document to hidden (as if the tab is not in focus)
            Object.defineProperty(document, 'hidden', { value: true });
            const startTimeSpy = jest.spyOn(tracker as any, 'startTracking');

            tracker['startTracking']();

            // Ensure that startTracking didn't update the startTime because the document is hidden
            expect(startTimeSpy).toHaveBeenCalled();
            expect(tracker.startTime).toBe(0);
            expect(tracker['isTrackerActive']).toBe(false);
        });
    });

    describe('#stopTracking', () => {
        let tracker: ForegroundTimeTracker;

        beforeEach(() => {
            tracker = new ForegroundTimeTracker(timerKey);

            // Initialize state as if tracking was already active
            tracker['isTrackerActive'] = true;
            tracker.startTime = 500;
            tracker.totalTime = 1000;
        });

        it('should set isTrackerActive to false', () => {
            tracker['stopTracking']();
            expect(tracker['isTrackerActive']).toBe(false);
        });

        it('should call setTotalTime', () => {
            const setTotalTimeSpy = jest.spyOn(tracker as any, 'setTotalTime');

            tracker['stopTracking']();
            expect(setTotalTimeSpy).toHaveBeenCalled();
        });

        it('should call updateTimeInPersistence', () => {
            const updatePersistenceSpy = jest.spyOn(tracker, 'updateTimeInPersistence');

            tracker['stopTracking']();
            expect(updatePersistenceSpy).toHaveBeenCalled();
        });

        it('should not call setTotalTime or updateTimeInPersistence if tracker is inactive', () => {
            tracker['isTrackerActive'] = false;
            const setTotalTimeSpy = jest.spyOn(tracker as any, 'setTotalTime');
            const updateTimeInPersistenceSpy = jest.spyOn(tracker as any, 'updateTimeInPersistence');

            tracker['stopTracking']();

            expect(setTotalTimeSpy).not.toHaveBeenCalled();
            expect(updateTimeInPersistenceSpy).not.toHaveBeenCalled();
        });
    });

    describe('#setTotalTime', () => {
        let tracker: ForegroundTimeTracker;

        beforeEach(() => {
            tracker = new ForegroundTimeTracker(timerKey);

            // Initialize state to simulate active tracking
            tracker['isTrackerActive'] = true;
            tracker.startTime = 1000;
            tracker.totalTime = 5000;
        });

        it('should update totalTime when tracker is active', () => {
            jest.spyOn(global.performance, 'now').mockReturnValue(2000);

            tracker['setTotalTime']();

            // totalTime += performance.now() - startTime
            // 5000 + 2000 - 1000 = 6000
            // https://go.mparticle.com/work/SQDSDKS-7079
            expect(tracker.totalTime).toBe(6000);

            // Ensure startTime is updated to the new current time (performance.now())
            expect(tracker.startTime).toBe(2000);
        });

        it('should correctly handle consecutive calls', () => {
            jest.spyOn(global.performance, 'now')
                .mockReturnValueOnce(2000) // 1st call
                .mockReturnValueOnce(3000); // 2nd call

            tracker['setTotalTime'](); // 1st call to performance.now
            expect(tracker.totalTime).toBe(6000); // 5000 + 2000 - 1000

            tracker['setTotalTime'](); // 2nd call to performance.now
            expect(tracker.totalTime).toBe(7000); // 6000 + 3000 - 2000
        });

        it('should not update totalTime when tracker is inactive', () => {
            // set this spy even though it should not be invoked since isTrackerActive = false
            jest.spyOn(global.performance, 'now').mockReturnValue(2000);

            tracker['isTrackerActive'] = false;
            const previousTotalTime = tracker.totalTime;

            tracker['setTotalTime']();

            expect(tracker.totalTime).toBe(previousTotalTime);
        });

        it('should not modify startTime if tracker is inactive', () => {
            tracker['isTrackerActive'] = false;
            const previousStartTime = tracker.startTime;

            tracker['setTotalTime']();

            expect(tracker.startTime).toBe(previousStartTime);
        });
    });


    describe('#updateTimeInPersistence', () => {
        let tracker: ForegroundTimeTracker;

        beforeEach(() => {
            tracker = new ForegroundTimeTracker(timerKey);
        });

        it('should store totalTime in localStorage when tracking is active', () => {
            tracker['isTrackerActive'] = true;
            tracker.totalTime = 5000;

            tracker.updateTimeInPersistence();

            expect(tracker['timerVault'].retrieve()).toBe(5000);
        });

        it('should not update localStorage when tracking is inactive', () => {
            tracker['isTrackerActive'] = false;
            tracker.totalTime = 8000;

            tracker.updateTimeInPersistence();

            expect(localStorage.getItem(mockStorageKey)).toBeNull();
        });

        it('should format totalTime correctly before storing', () => {
            tracker['isTrackerActive'] = true;
            tracker.totalTime = 1234.5678;

            tracker.updateTimeInPersistence();
            expect(tracker['timerVault'].retrieve()).toBe(1235);
        });
    });

    describe('#handleVisibilityChange', () => {
        let tracker: ForegroundTimeTracker;

        beforeEach(() => {
            tracker = new ForegroundTimeTracker(timerKey);
        });

        it('should call stopTracking when document becomes hidden', () => {
            const stopTrackingSpy = jest.spyOn(tracker as any, 'stopTracking');
            Object.defineProperty(document, 'hidden', { value: true, configurable: true });

            document.dispatchEvent(new Event('visibilitychange'));

            expect(stopTrackingSpy).toHaveBeenCalled();
        });

        it('should call startTracking when document becomes visible', () => {
            const startTrackingSpy = jest.spyOn(tracker as any, 'startTracking');
            Object.defineProperty(document, 'hidden', { value: false, configurable: true });

            document.dispatchEvent(new Event('visibilitychange'));

            expect(startTrackingSpy).toHaveBeenCalled();
        });
    });

    describe('#syncAcrossTabs', () => {
        let tracker: ForegroundTimeTracker;

        beforeEach(() => {
            tracker = new ForegroundTimeTracker(timerKey);
            tracker['totalTime'] = 500; // Set an initial total time
        });

        it('should call syncAcrossTabs when a storage event occurs', () => {
            const syncSpy = jest.spyOn(tracker as any, 'syncAcrossTabs');

            window.dispatchEvent(new StorageEvent('storage', { key: mockStorageKey }));

            expect(syncSpy).toHaveBeenCalled();
        });

        it('should update totalTime when a new time on site value is passed', () => {
            localStorage.setItem(mockStorageKey, '600');
            const event = new StorageEvent('storage', { key: mockStorageKey, newValue: '800' });

            window.dispatchEvent(event);

            expect(tracker.totalTime).toBe(800);
        });

        it('should update trackerTotal time to be 0 (such as when a session end event occurs)', () => {
            const event = new StorageEvent('storage', { key: mockStorageKey, newValue: '0' });

            window.dispatchEvent(event);

            expect(tracker.totalTime).toBe(0)
        });

        it('should NOT update totalTime if newValue is null', () => {
            const event = new StorageEvent('storage', { key: mockStorageKey, newValue: null });

            window.dispatchEvent(event);

            expect(tracker.totalTime).toBe(500)
        });

        it('should NOT update totalTime if the storage event key does not match', () => {
            const event = new StorageEvent('storage', { key: 'some-other-key', newValue: '999' });

            window.dispatchEvent(event);

            expect(tracker.totalTime).toBe(500)
        });
    });

    describe('#getTimeInForeground', () => {
        let tracker: ForegroundTimeTracker;

        beforeEach(() => {
            tracker = new ForegroundTimeTracker(timerKey);
            tracker['totalTime'] = 500; // Set an initial total time
            tracker['startTime'] = 1000; // Set an iintial start time
        });

        it('should call setTotalTime', () => {
            const setTotalTimeSpy = jest.spyOn(tracker as any, 'setTotalTime');

            tracker.getTimeInForeground();

            expect(setTotalTimeSpy).toHaveBeenCalled();
        });

        it('should call updateTimeInPersistence', () => {
            const updatePersistenceSpy = jest.spyOn(tracker as any, 'updateTimeInPersistence');

            tracker.getTimeInForeground();

            expect(updatePersistenceSpy).toHaveBeenCalled();
        });

        it('should return the updated totalTime', () => {
            jest.spyOn(global.performance, 'now').mockReturnValue(2000); // Simulate elapsed time

            const totalTime = tracker.getTimeInForeground();

            expect(totalTime).toBe(1500); // 500 += 2000 -1000
        });
    });

    describe('#resetTimer', () => {
        let tracker: ForegroundTimeTracker;

        beforeEach(() => {
            tracker = new ForegroundTimeTracker(timerKey);
        });

        it('should set totalTime = 0', () => {
            tracker['totalTime'] = 500;

            tracker.resetTimer();

            expect(tracker['totalTime']).toBe(0);
        });

        it('should call updateTimeInPersistence', () => {
            const updatePersistenceSpy = jest.spyOn(tracker as any, 'updateTimeInPersistence');

            tracker.resetTimer();


            expect(updatePersistenceSpy).toHaveBeenCalled();
        });
    });

    describe('#privacy flags', () => {
        const workspaceToken = 'abcdef';
        const tosKey = `mprtcl-tos-${workspaceToken}`;
        let mockMPInstance: IMParticleWebSDKInstance;
        let store: IStore;

        beforeEach(() => {
            jest.useFakeTimers({ now: Date.now(), advanceTimers: true });
            localStorage.clear();

            mockMPInstance = {
                _Helpers: {
                    createMainStorageName: () => `mprtcl-v4_${workspaceToken}`,
                    createProductStorageName: () => `mprtcl-prodv4_${workspaceToken}`,
                    Validators: { isFunction: () => true },
                    extend: Object.assign,
                },
                _NativeSdkHelpers: { isWebviewEnabled: () => false },
                _Persistence: {
                    update: jest.fn(),
                    savePersistence: jest.fn(),
                    getPersistence: () => ({ gs: {} }),
                },
                Logger: { verbose: jest.fn(), warning: jest.fn(), error: jest.fn() },
                Identity: { getCurrentUser: () => ({ getMPID: () => 'mpid' }) },
                _timeOnSiteTimer: undefined as any,
            } as unknown as IMParticleWebSDKInstance;

            store = {} as IStore;
            (Store as any).call(store, {} as SDKInitConfig, mockMPInstance, 'apikey');
            mockMPInstance._Store = store;
        });

        afterEach(() => {
            jest.useRealTimers();
            localStorage.clear();
        });

        it('should track time on site when noTargeting is false by default', () => {
            store.processConfig({ workspaceToken } as SDKInitConfig);
            expect(mockMPInstance._timeOnSiteTimer).toBeDefined();
            jest.advanceTimersByTime(1000);
            mockMPInstance._timeOnSiteTimer.getTimeInForeground();
            expect(localStorage.getItem(tosKey)).not.toBeNull();
        });

        it('should NOT track time on site when noTargeting is true', () => {
            store.processConfig({ workspaceToken, launcherOptions: { noTargeting: true } } as SDKInitConfig);
            expect(mockMPInstance._timeOnSiteTimer).toBeUndefined();
            expect(localStorage.getItem(tosKey)).toBeNull();
        });

        it('should track time on site when noTargeting is false', () => {
            store.processConfig({ workspaceToken, launcherOptions: { noTargeting: false } } as SDKInitConfig);
            expect(mockMPInstance._timeOnSiteTimer).toBeDefined();
            jest.advanceTimersByTime(1000);
            mockMPInstance._timeOnSiteTimer.getTimeInForeground();
            expect(localStorage.getItem(tosKey)).not.toBeNull();
        });
    });
});