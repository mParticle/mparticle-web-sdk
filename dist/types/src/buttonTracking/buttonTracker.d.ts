import { IMParticleWebSDKInstance } from '../mp-instance';
export declare const WIN_BTN_KEY = "__mpBtn__";
export interface IButtonTrackerOptions {
    hasRoktKit: boolean;
}
export declare const getActiveButtonTracker: () => ButtonTracker | undefined;
export declare const resetButtonTracking: () => void;
export declare class ButtonTracker {
    private readonly mpInstance;
    private active;
    private hasRoktKit;
    private generation;
    private lastCommitClick;
    private lastSent;
    private pagePath;
    private pageEvents;
    private lastEvent;
    private pending;
    constructor(mpInstance: IMParticleWebSDKInstance);
    get isActive(): boolean;
    init(options: IButtonTrackerOptions): void;
    teardown(): void;
    clearPending(): void;
    private reset;
    private enqueue;
    private readonly drain;
    private readonly onHide;
    private readonly onPageShow;
    private readonly onEvent;
    private observe;
    private logClick;
    private emit;
    private eventsEnabled;
    private isKitSuppressed;
    private log;
}
