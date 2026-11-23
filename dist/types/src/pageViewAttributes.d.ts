import { Dictionary } from './utils';
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
export interface IPageViewOptions {
    isAutoPageView?: boolean;
}
export declare const parseQueryParamAllowlist: (configured: unknown) => IQueryParamAllowlist;
export declare const effectiveAllowlist: (extras?: string[]) => string[];
export declare const allowedQueryParams: (href: string, extras?: string[]) => ICapturedParam[];
export declare const paramsToAttributes: (params: ICapturedParam[]) => Dictionary<string>;
export declare const autoPageViewAttribute: (isAutoPageView?: boolean) => Dictionary<boolean>;
