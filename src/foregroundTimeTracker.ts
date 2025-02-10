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

        // TODO: this logging is only for testing purposes
        // it is to give an idea to the tester that the timer is working properly
        // setInterval(() => {
            // console.log(this.getTimeInForeground());
        // }, 1000);
    }

    private addHandlers(): void {
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());  // when user switches tabs or minimizes the window
        window.addEventListener('beforeunload', () => this.updateTimeInPersistence());       // when user closes tab, refreshes, or navigates to another page via link
        window.addEventListener('blur', () => this.handleWindowBlur());                      // when user switches to another application   
        window.addEventListener('focus', () => this.handleWindowFocus());                    // when window gains focus
        window.addEventListener('storage', (event) => this.syncAcrossTabs(event));           // this ensures that timers between tabs are in sync
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
        console.log('handling window focus');
        this.startTracking();
    }

    private startTracking(): void {
        console.log('starting tracking');
        if (!document.hidden) {
            this.startTime = Math.floor(performance.now()); 
            console.log(this.startTime);
            this.isTrackerActive = true;
        }
    }

    private stopTracking(): void {
        console.log('stopping tracking');
        if (this.isTrackerActive) {
            this.setTotalTime();
            this.updateTimeInPersistence();
            this.isTrackerActive = false;
        }
    }

    private setTotalTime(): void {
        if (this.isTrackerActive) {
            console.log(
                `setting total time because isTrackerActive is ${this.isTrackerActive}`
            );
            const now = Math.floor(performance.now());
            this.totalTime += now - this.startTime;
            this.startTime = now;
        }
    }

    public updateTimeInPersistence(): void {
        if (this.isTrackerActive) {
            console.log(
                `updating time in persistence because isTrackerActive is ${this.isTrackerActive}`
            );
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
        console.log('event.key', event.key);
        console.log('this.localStorageName', this.localStorageName);
        if (event.key === this.localStorageName && event.newValue !== null) {
            const newTime = parseFloat(event.newValue) || 0;
            // we need to set this to 0 if a session has ended.  since the timer should start again.
            // do not overwrite if the new time is smaller than the previous totalTime
            // if (newTime > this.totalTime) {
                this.totalTime = newTime;
            // }
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