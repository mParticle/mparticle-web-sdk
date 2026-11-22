// The query-param allowlist and the attributes a page view carries. Manual page
// views and config parsing read these, so they sit apart from the tracker.
import { Dictionary, hasOwnProp, queryStringParser } from './utils';

// Parameters that identify which page a view is of. Authorization-flow and campaign
// attribution parameters are deliberately absent; an input can add them explicitly.
export const ALLOWED_QUERY_PARAMS: string[] = [
    // Pagination
    'page',
    'limit',
    'offset',
    'cursor',
    'per_page',

    // Site search term, as the common platforms spell it. Matching is
    // case-insensitive. `s` is WordPress and WooCommerce search; other
    // single-letter names are too generic. `oq` is a storefront search term.
    'q',
    's',
    'oq',
    'search',
    'query',
    'keyword',
    'keywords',
    'term',
    'text',
    'searchTerm',
    'searchText',
    'search_query',
    'search_text',
    'Ntt', // Endeca

    // Product and variant identifiers. `cid` is not a category: it is a
    // customer id on many sites.
    'pid',
    'productId',
    'sku',
    'skuId',
    'variant',
    'color',
    'colour',
    'size',

    // Category
    'category',

    // Referral
    'ref',
    'referrer',
];

export const AUTO_PAGE_VIEW_ATTRIBUTE = 'is_auto_page_view';

const CORE_EVENT_FIELDS = ['hostname', 'title', 'path', AUTO_PAGE_VIEW_ATTRIBUTE];

const PROTOTYPE_MEMBER_NAMES = ['constructor', '__proto__', 'prototype'];

// Server flag values are the strings 'True' and 'False', so these get typed here by habit.
const FLAG_VALUE_NAMES = ['true', 'false'];

const RESERVED_QUERY_PARAMS = CORE_EVENT_FIELDS.concat(
    PROTOTYPE_MEMBER_NAMES,
    FLAG_VALUE_NAMES
);

const BUILT_IN_NAMES = ALLOWED_QUERY_PARAMS.map(name => name.toLowerCase());

const isBuiltIn = (name: string): boolean =>
    BUILT_IN_NAMES.indexOf(name.toLowerCase()) !== -1;

// Excludes `&`, `=`, `%` and whitespace, which would distort the dedup key.
const QUERY_PARAM_NAME = /^[a-z0-9_][a-z0-9_.-]{0,63}$/;

export const MAX_CUSTOM_QUERY_PARAMS = 25;

export interface IQueryParamAllowlist {
    allowed: string[];

    // Positions, never names: a rejected entry may be a secret pasted into the wrong field.
    rejectedPositions: number[];

    overLimit: number;
}

export const MAX_CUSTOM_QUERY_PARAM_VALUE_LENGTH = 512;

// A list, not a dictionary: its order is the order the dedup key is built in.
export interface ICapturedParam {
    name: string;
    value: string;
}

// Params matched by name prefix, for platforms that put a per-product id in the
// name. Salesforce Commerce Cloud spells a variant choice
// `dwvar_<productId>_<attribute>`, e.g. `dwvar_12345_color=navy`.
export const ALLOWED_QUERY_PARAM_PREFIXES: string[] = ['dwvar_'];

const hasAllowedPrefix = (name: string): boolean =>
    ALLOWED_QUERY_PARAM_PREFIXES.some(prefix => name.indexOf(prefix) === 0);

// Whether a query param name, in any case, is one an auto page view captures by default.
export const isAllowedQueryParam = (name: string): boolean =>
    isBuiltIn(name) || hasAllowedPrefix(name.toLowerCase());

// Options for the emitters the AutoLogPageView flag drives. Passing this is how
// an emitter is told it is automatic; it never reads the feature flag itself.
export interface IPageViewOptions {
    isAutoPageView?: boolean;
}

// Validated here as well as in the dashboard, because remote config is untrusted input.
export const parseQueryParamAllowlist = (
    configured: unknown
): IQueryParamAllowlist => {
    const allowed: string[] = [];
    const rejectedPositions: number[] = [];
    let overLimit = 0;

    if (!configured) {
        return { allowed, rejectedPositions, overLimit };
    }

    const entries: unknown[] = Array.isArray(configured)
        ? configured
        : String(configured).split(',');

    entries.forEach((entry, index) => {
        const position = index + 1;
        const name = String(entry)
            .trim()
            .toLowerCase();

        if (!name) {
            return;
        }

        if (
            !QUERY_PARAM_NAME.test(name) ||
            RESERVED_QUERY_PARAMS.indexOf(name) !== -1
        ) {
            rejectedPositions.push(position);
            return;
        }

        if (isBuiltIn(name) || allowed.indexOf(name) !== -1) {
            return;
        }

        if (allowed.length >= MAX_CUSTOM_QUERY_PARAMS) {
            overLimit++;
            return;
        }

        allowed.push(name);
    });

    return { allowed, rejectedPositions, overLimit };
};

// Not localeCompare: this order feeds the dedup key, so it must be identical in every
// browser, and localeCompare is locale-dependent.
const byName = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

// Built-ins keep their positions and additions sort after them, so a dedup key depends on
// which params are configured, not the order they were typed.
export const effectiveAllowlist = (extras: string[] = []): string[] =>
    ALLOWED_QUERY_PARAMS.concat(
        extras.filter(name => !isBuiltIn(name)).sort(byName)
    );

// Over-long custom values are dropped rather than truncated: two truncated values could
// share a dedup key and swallow a real page view.
const isWithinValueLimit = (name: string, value: string): boolean =>
    isBuiltIn(name) || value.length <= MAX_CUSTOM_QUERY_PARAM_VALUE_LENGTH;

// A prefix match is a platform name, not a configured extra, so the custom
// value limit does not apply. A name already on the allowlist keeps that
// position instead of being appended again.
const prefixMatchedParams = (
    href: string,
    allowlist: string[]
): ICapturedParam[] => {
    const allParams = queryStringParser(href);

    return Object.keys(allParams)
        .filter(
            name =>
                hasAllowedPrefix(name) &&
                allParams[name] &&
                allowlist.indexOf(name) === -1
        )
        .sort(byName)
        .map(name => ({ name, value: allParams[name] }));
};

export const allowedQueryParams = (
    href: string,
    extras: string[] = []
): ICapturedParam[] => {
    const allowlist = effectiveAllowlist(extras);
    const found = queryStringParser(href, allowlist);
    const listed = allowlist
        .filter(name => hasOwnProp(found, name))
        .filter(name => isWithinValueLimit(name, found[name]))
        .map(name => ({ name, value: found[name] }));

    return listed.concat(prefixMatchedParams(href, allowlist));
};

export const paramsToAttributes = (
    params: ICapturedParam[]
): Dictionary<string> => {
    const attributes: Dictionary<string> = {};
    params.forEach(({ name, value }) => {
        attributes[name] = value;
    });
    return attributes;
};

// Absent rather than false on a manual page view, so the attribute is only ever
// added by the automatic emitters. Shared by both of them so the key and that
// rule have one definition instead of two that can drift.
export const autoPageViewAttribute = (
    isAutoPageView?: boolean
): Dictionary<boolean> =>
    isAutoPageView ? { [AUTO_PAGE_VIEW_ATTRIBUTE]: true } : {};
