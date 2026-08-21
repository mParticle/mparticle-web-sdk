import { IMParticleWebSDKInstance } from './mp-instance';
export declare const WIN_TRACKER_KEY = "__mpApvTracker__";
export declare const WIN_INIT_PV_KEY: "__mpApvInitPVLogged__";
export type WindowWithApvFlags = Window & {
    [WIN_TRACKER_KEY]?: PageViewTracker;
    [WIN_INIT_PV_KEY]?: boolean;
};
export declare class PageViewTracker {
    static hasInitialPageViewFired(): boolean;
    static markInitialPageViewFired(): void;
    static resetWindowState(instanceTracker?: PageViewTracker): void;
    mpInstance: IMParticleWebSDKInstance;
    private lastPath;
    private _isActive;
    get isActive(): boolean;
    private pendingNavigations;
    private originalPushState;
    private originalReplaceState;
    private pushStateWrapper;
    private replaceStateWrapper;
    private popStateListener;
    constructor(mpInstance: IMParticleWebSDKInstance);
    private isSupportedEnvironment;
    init(): void;
    private patchHistoryMethods;
    private addNavigationListeners;
    private safeHandleNavigation;
    private getCurrentKey;
    private handleNavigation;
    private firePageView;
    takePendingNavigations(): string[];
    private restoreHistoryMethod;
    teardown(): void;
}
