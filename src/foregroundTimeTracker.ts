import { isNumber } from './utils';
import { createVault, BaseVault } from './vault';
import { VaultKind } from './constants';

export default class ForegroundTimeTracker {
    private isTrackerActive: boolean = false;
    private localStorageName: string = '';
    private timerVault: BaseVault<number>;
    public startTime: number = 0;
    public totalTime: number = 0;

    constructor(timerKey: string) {
        this.localStorageName = `mprtcl-tos-${timerKey}`;
        this.timerVault = createVault<number>(this.localStorageName, VaultKind.LocalStorage);
        this.loadTimeFromStorage();
        this.addHandlers();
        if (document.hidden === false) {
            this.startTracking();
        }
    }

    private addHandlers(): void {
        // when user switches tabs or minimizes the window
        document.addEventListener('visibilitychange', () =>
            this.handleVisibilityChange()
        );
        // when user switches to another application
        window.addEventListener('blur', () => this.handleWindowBlur());
        // when window gains focus
        window.addEventListener('focus', () => this.handleWindowFocus());
        // this ensures that timers between tabs are in sync
        window.addEventListener('storage', event => this.syncAcrossTabs(event));
        // when user closes tab, refreshes, or navigates to another page via link
        window.addEventListener('beforeunload', () =>
            this.updateTimeInPersistence()
        );
    }

    private handleVisibilityChange(): void {
        if (document.hidden) {
            this.stopTracking();
        } else {
            this.startTracking();
        }
    }

    private handleWindowBlur(): void {
        if (this.isTrackerActive) {
            this.stopTracking();
        }
    }

    private handleWindowFocus(): void {
        if (!this.isTrackerActive) {
            this.startTracking();
        }
    }

    private syncAcrossTabs(event: StorageEvent): void {
        if (event.key === this.localStorageName && event.newValue !== null) {
            const newTime = parseFloat(event.newValue) || 0;
            this.totalTime = newTime;
        }
    }

    public updateTimeInPersistence(): void {
        if (this.isTrackerActive) {
            this.timerVault.store(Math.round(this.totalTime));
        }
    }

    private loadTimeFromStorage(): void {
        const storedTime = this.timerVault.retrieve();
        if (isNumber(storedTime) && storedTime !== null) {
            this.totalTime = storedTime;
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