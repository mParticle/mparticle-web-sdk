export default class ForegroundTimeTracker {
    private isTrackerActive: boolean = false;
    private localStorageName: string = '';
    public startTime: number = 0;
    public totalTime: number = 0;

    constructor(apiKey: string) {
        this.localStorageName = `mp-time-${apiKey}`;
        this.loadTimeFromStorage();
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.syncAcrossTabs = this.syncAcrossTabs.bind(this);
        this.init();
    }

    private init(): void {
        document.addEventListener(
            'visibilitychange',
            this.handleVisibilityChange
        );
        window.addEventListener('beforeunload', () => this.updateTimeInPersistence());
         // Sync time updates across tabs
        window.addEventListener('storage', this.syncAcrossTabs);
        this.startTracking();

        // TODO: this is just to ensure when we load it in an app we can see the timer updates in the console
        setInterval(() => {
            console.log(this.startTime);
            console.log(this.getTimeInForeground());
        }, 1000);
    }

    private loadTimeFromStorage(): void {
        const storedTime = localStorage.getItem(this.localStorageName);
        if (storedTime !== null) {
            this.totalTime = parseFloat(storedTime);
        }
    }

    private startTracking(): void {
        if (!document.hidden) {
            this.startTime = Math.floor(performance.now()); 
            this.isTrackerActive = true;
        }
    }

    private stopTracking(): void {
        if (this.isTrackerActive) {
            this.setTotalTime();
            this.updateTimeInPersistence();
            this.isTrackerActive = false;
        }
    }

    private setTotalTime(): void {
        if (this.isTrackerActive) {
            const now = Math.floor(performance.now());
            this.totalTime += now - this.startTime;
            this.startTime = now;
        }
    }

    public updateTimeInPersistence(): void {
        if (this.isTrackerActive) {
            localStorage.setItem(
                this.localStorageName,
                this.totalTime.toFixed(0)
            );
        }
    }

    private handleVisibilityChange(): void {
        if (document.hidden) {
            this.stopTracking();
        } else {
            this.startTracking();
        }
    }

    private syncAcrossTabs(event: StorageEvent): void {
        if (event.key === this.localStorageName && event.newValue !== null) {
            const newTime = parseFloat(event.newValue) || 0;
            // do not overwrite if the new time is smaller than the previous totalTime
            if (newTime > this.totalTime) {
                this.totalTime = newTime;

            }
        }
    }

    public getTimeInForeground(): number {
        this.setTotalTime();
        this.updateTimeInPersistence();
        return this.totalTime;
    }
    
    public resetTimer(): void {
        this.totalTime = 0;
        this.updateTimeInPersistence();
    }
}
