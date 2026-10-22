import { IMParticleWebSDKInstance } from './mp-instance';
import { BaseEvent } from './sdkRuntimeModels';
import { Dictionary } from './utils';
export declare const WIN_APV_KEY = "__mpApv__";
export declare const ALLOWED_QUERY_PARAMS: string[];
export declare const AUTO_PAGE_VIEW_ATTRIBUTE = "is_auto_page_view";
export declare const MAX_CUSTOM_QUERY_PARAMS = 25;
export interface IQueryParamAllowlist {
    allowed: string[];
    rejectedPositions: number[];
    overLimit: number;
}
export declare const MAX_CUSTOM_QUERY_PARAM_VALUE_LENGTH = 512;
export interface ICapturedParam {
    name: string;
    value: string;
}
export declare const ALLOWED_QUERY_PARAM_PREFIXES: string[];
export declare const isAllowedQueryParam: (name: string) => boolean;
interface IPageSnapshot {
    path: string;
    params: ICapturedParam[];
}
interface IPageViewData extends IPageSnapshot {
    hostname: string;
    title: string;
    isAutoPageView?: boolean;
}
export interface IPageViewOptions {
    isAutoPageView?: boolean;
}
export declare const parseQueryParamAllowlist: (configured: unknown) => IQueryParamAllowlist;
export declare const effectiveAllowlist: (extras?: string[]) => string[];
export declare const allowedQueryParams: (href: string, extras?: string[]) => ICapturedParam[];
export declare const paramsToAttributes: (params: ICapturedParam[]) => Dictionary<string>;
export declare const autoPageViewAttribute: (isAutoPageView?: boolean) => Dictionary<boolean>;
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
export {};
