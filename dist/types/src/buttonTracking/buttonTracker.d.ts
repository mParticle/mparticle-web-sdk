import { IMParticleWebSDKInstance } from '../mp-instance';
export declare const WIN_BTN_KEY = "__mpBtn__";
export interface IButtonTrackerOptions {
    hasRoktKit: boolean;
    logButtons: boolean;
    logLinks: boolean;
}
export declare const getActiveButtonTracker: () => ButtonTracker | undefined;
export declare const resetButtonTracking: () => void;
export declare class ButtonTracker {
    private readonly mpInstance;
    private active;
    private hasRoktKit;
    private logButtons;
    private logLinks;
    private generation;
    private lastCommitClick;
    private lastClick;
    private lastSent;
    private pagePath;
    private pageEvents;
    private pending;
    constructor(mpInstance: IMParticleWebSDKInstance);
    get isActive(): boolean;
    init(options: IButtonTrackerOptions): void;
    onApplePayBegin(): void;
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
    private pickPayment;
    private eventsEnabled;
    private hasTargetingOptOut;
    private isKitSuppressed;
    private log;
}
