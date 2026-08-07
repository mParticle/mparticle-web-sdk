import { IMParticleWebSDKInstance } from './mp-instance';
export declare class PageViewTracker {
    mpInstance: IMParticleWebSDKInstance;
    private lastPath;
    private isActive;
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
    teardown(): void;
}
