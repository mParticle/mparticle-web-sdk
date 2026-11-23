import { IMParticleWebSDKInstance } from './mp-instance';
import { BaseEvent } from './sdkRuntimeModels';
import { type ICapturedParam, type IPageViewOptions } from './pageViewAttributes';
export { ALLOWED_QUERY_PARAM_PREFIXES, ALLOWED_QUERY_PARAMS, allowedQueryParams, AUTO_PAGE_VIEW_ATTRIBUTE, autoPageViewAttribute, effectiveAllowlist, type ICapturedParam, type IPageViewOptions, type IQueryParamAllowlist, isAllowedQueryParam, MAX_CUSTOM_QUERY_PARAM_VALUE_LENGTH, MAX_CUSTOM_QUERY_PARAMS, paramsToAttributes, parseQueryParamAllowlist, } from './pageViewAttributes';
export declare const WIN_APV_KEY = "__mpApv__";
interface IPageSnapshot {
    path: string;
    params: ICapturedParam[];
}
interface IPageViewData extends IPageSnapshot {
    hostname: string;
    title: string;
    isAutoPageView?: boolean;
}
export declare const pageKey: (page: IPageSnapshot) => string;
export declare const isNewPage: (lastKey: string | null, candidateKey: string) => boolean;
export declare const buildPageViewEvent: ({ params, hostname, title, path, isAutoPageView, }: IPageViewData) => BaseEvent;
export declare const getActiveTracker: () => PageViewTracker | undefined;
export declare const hasInitialPageViewFired: () => boolean;
export declare const markInitialPageViewFired: () => void;
export declare const resetPageViewTracking: () => void;
export declare class PageViewTracker {
    private readonly mpInstance;
    private lastPage;
    private active;
    private customQueryParams;
    private pendingNavigations;
    private undoHistoryPatch;
    private readonly isAutoPageView;
    constructor(mpInstance: IMParticleWebSDKInstance, options?: IPageViewOptions);
    get isActive(): boolean;
    init(): void;
    teardown(): void;
    private readCustomQueryParams;
    private retire;
    private takePendingNavigations;
    private safeHandleNavigation;
    private handleNavigation;
    private scheduleFire;
    private firePageView;
    private log;
}
