import { IMParticleWebSDKInstance } from './mp-instance';
import { BaseEvent } from './sdkRuntimeModels';
import { Dictionary } from './utils';
type HistoryMethodName = 'pushState' | 'replaceState';
type NavigationSource = HistoryMethodName | 'popstate';
export declare const WIN_APV_KEY = "__mpApv__";
export declare const ALLOWED_QUERY_PARAMS: string[];
interface IPageSnapshot {
    path: string;
    params: Dictionary<string>;
}
interface IPageViewData extends IPageSnapshot {
    hostname: string;
    title: string;
}
export declare const allowedQueryParams: (href: string) => Dictionary<string>;
export declare const pageKey: (page: IPageSnapshot) => string;
export declare const isNewPage: (lastKey: string | null, candidateKey: string) => boolean;
export declare const supportsHistoryTracking: (win: Window | null) => boolean;
export declare const buildPageViewEvent: ({ params, hostname, title, path, }: IPageViewData) => BaseEvent;
export declare const getActiveTracker: () => PageViewTracker | undefined;
export declare const hasInitialPageViewFired: () => boolean;
export declare const markInitialPageViewFired: () => void;
export declare const resetPageViewTracking: () => void;
export declare const patchHistory: (onNavigate: (source: NavigationSource) => void, log: (message: string) => void) => (() => void) | null;
export declare class PageViewTracker {
    private readonly mpInstance;
    private lastPage;
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
