import { IMParticleWebSDKInstance } from './mp-instance';
export declare const WIN_CIT_KEY = "__mpCit__";
export declare const getActiveCheckoutIntentTracker: () => CheckoutIntentTracker | undefined;
export declare const resetCheckoutIntentTracking: () => void;
export declare class CheckoutIntentTracker {
    private readonly mpInstance;
    private active;
    private generation;
    private lastCommitClick;
    private lastSent;
    constructor(mpInstance: IMParticleWebSDKInstance);
    get isActive(): boolean;
    init(): void;
    teardown(): void;
    clearPending(): void;
    private reset;
    private readonly onPageShow;
    private readonly onEvent;
    private observe;
    private emit;
    private isSuppressed;
    private log;
}
