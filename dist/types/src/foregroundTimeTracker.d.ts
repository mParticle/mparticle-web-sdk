export default class ForegroundTimeTracker {
    private noFunctional;
    private isTrackerActive;
    private localStorageName;
    private timerVault;
    startTime: number;
    totalTime: number;
    constructor(timerKey: string, noFunctional?: boolean);
    private addHandlers;
    private handleVisibilityChange;
    private handleWindowBlur;
    private handleWindowFocus;
    private syncAcrossTabs;
    updateTimeInPersistence(): void;
    private loadTimeFromStorage;
    private startTracking;
    private stopTracking;
    private setTotalTime;
    getTimeInForeground(): number;
    resetTimer(): void;
}
