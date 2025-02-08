export default class ForegroundTimeTracker {
    private isTrackerActive: boolean = false;
    private localStorageName: string = '';
    public startTime: number = 0;
    public totalTime: number = 0;

    constructor(timerKey: string) {
        this.localStorageName = `mp-time-${timerKey}`;
        this.loadTimeFromStorage();
        this.addHandlers();
        if (document.hidden === false) {
            this.startTracking();
        }

        // TODO: this is just to ensure when we load it in an app for testing we can see the timer updates in the console
        // setInterval(() => {
            // console.log(this.getTimeInForeground());
            // console.log(document.hidden);
        // }, 1000);
    }

    private addHandlers(): void {
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());  // when user switches tabs or minimizes the window
        window.addEventListener('beforeunload', () => this.updateTimeInPersistence());       // when user closes tab, refreshes, or navigates to another page via link
        window.addEventListener('blur', () => this.handleWindowBlur());                      // when user switches to another application   
        window.addEventListener('focus', () => this.handleWindowFocus());                    // when window gains focus
        window.addEventListener('storage', (event) => this.syncAcrossTabs(event));                                // 
    }
    
    private loadTimeFromStorage(): void {
        const storedTime = localStorage.getItem(this.localStorageName);
        if (storedTime !== null) {
            this.totalTime = parseFloat(storedTime);
        }
    }

    private handleWindowBlur(): void {
        console.log('handling window blur');
        this.stopTracking();
    }

    private handleWindowFocus(): void {
        this.startTracking();
    }

    private startTracking(): void {
        if (!document.hidden) {
            console.log('starting tracking');
            this.startTime = Math.floor(performance.now()); 
            console.log(this.startTime);
            this.isTrackerActive = true;
        }
    }

    private stopTracking(): void {
        if (this.isTrackerActive) {
            console.log('stopping tracking');
            this.setTotalTime();
            this.updateTimeInPersistence();
            this.isTrackerActive = false;
        }
    }

    private setTotalTime(): void {
        if (this.isTrackerActive) {
            console.log('setting total time');
            const now = Math.floor(performance.now());
            this.totalTime += now - this.startTime;
            this.startTime = now;
        }
    }

    public updateTimeInPersistence(): void {
        if (this.isTrackerActive) {
            console.log('updating time in persistence');
            localStorage.setItem(
                this.localStorageName,
                this.totalTime.toFixed(0)
            );
        }
    }

    private handleVisibilityChange(): void {
        console.log('handleVisibilityChange');
        if (document.hidden) {
            this.stopTracking();
        } else {
            this.startTracking();
        }
    }

    private syncAcrossTabs(event: StorageEvent): void {
        console.log('syncAcrossTabs');
        if (event.key === this.localStorageName && event.newValue !== null) {
            const newTime = parseFloat(event.newValue) || 0;
            // do not overwrite if the new time is smaller than the previous totalTime
            if (newTime > this.totalTime) {
                this.totalTime = newTime;

            }
        }
    }

    public getTimeInForeground(): number {
        console.log('getTimeInForeground');
        this.setTotalTime();
        console.log(this.totalTime)
        this.updateTimeInPersistence();
        return this.totalTime;
    }
    
    public resetTimer(): void {
        console.log('resetTimer');
        this.totalTime = 0;
        this.updateTimeInPersistence();
    }
}