import { valueof } from './utils';
export declare const UrlMode: {
    readonly Path: "path";
    readonly Full: "full";
};
export type UrlMode = valueof<typeof UrlMode>;
export declare const EXCLUDED_URL_QUERY_PARAMS: string[];
export declare const EXCLUDED_URL_FRAGMENT_PARAMS: string[];
export declare const cleanUrl: (href: string, mode: UrlMode) => string;
export declare const cleanPageHref: () => string;
