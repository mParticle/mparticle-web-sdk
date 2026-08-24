import { IMParticleWebSDKInstance } from './mp-instance';
import { BaseEvent } from './sdkRuntimeModels';
type HistoryMethodName = 'pushState' | 'replaceState';
type NavigationSource = HistoryMethodName | 'popstate';
export declare const WIN_APV_KEY = "__mpApv__";
interface IPageViewData {
    hostname: string;
    title: string;
    path: string;
}
export declare const isNewPage: (lastPath: string | null, candidatePath: string) => boolean;
export declare const supportsHistoryTracking: (win: Window | null) => boolean;
export declare const buildPageViewEvent: (data: IPageViewData) => BaseEvent;
export declare const getActiveTracker: () => PageViewTracker | undefined;
export declare const hasInitialPageViewFired: () => boolean;
export declare const markInitialPageViewFired: () => void;
export declare const resetPageViewTracking: () => void;
export declare const patchHistory: (onNavigate: (source: NavigationSource) => void, log: (message: string) => void) => (() => void) | null;
export declare class PageViewTracker {
    private readonly mpInstance;
    private lastPath;
    private active;
    private pendingNavigations;
    private undoHistoryPatch;
    private popStateListener;
    constructor(mpInstance: IMParticleWebSDKInstance);
    get isActive(): boolean;
    init(): void;
    teardown(): void;
    private retire;
    private takePendingNavigations;
    private safeHandleNavigation;
    private handleNavigation;
    private scheduleFire;
    private firePageView;
    private log;
}
export {};
