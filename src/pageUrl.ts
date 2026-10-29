import { isAllowedQueryParam } from './pageViewTracker';
import { pagePath } from './pathMasking';
import { getHref, valueof } from './utils';

// The one rule for a URL that leaves the SDK, shared with kits through
// `mParticle._cleanUrl`. `path` keeps scheme, host and path, with any path
// segment that can single out one shopper as `*` (see pagePath). `full` adds the
// query params an auto page view captures by default and the campaign
// attribution params, then the fragment, a hash route's path masked the same way.
export const UrlMode = {
    Path: 'path',
    Full: 'full',
} as const;

export type UrlMode = valueof<typeof UrlMode>;

// Campaign attribution and ad-network click ids. URLs keep them; an auto page view
// carries one as an attribute only when an input configures it.
const URL_ATTRIBUTION_QUERY_PARAMS: string[] = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'utm_id',
    'utm_source_platform',
    'utm_creative_format',
    'utm_marketing_tactic',
    'gad_source',
    'gad_campaignid',
    'mc_cid',
    'gclid',
    'gbraid',
    'wbraid',
    'fbclid',
    'msclkid',
    'ttclid',
    'twclid',
    'li_fat_id',
    'dclid',
    'srsltid',
    'epik',
    'ScCid',
    'irclickid',
    'rtid',
    'rclid',
];

const URL_ATTRIBUTION_QUERY_PARAMS_LOWER: string[] = URL_ATTRIBUTION_QUERY_PARAMS.map(
    name => name.toLowerCase()
);

const isUrlQueryParam = (name: string): boolean =>
    isAllowedQueryParam(name) ||
    URL_ATTRIBUTION_QUERY_PARAMS_LOWER.indexOf(name.toLowerCase()) !== -1;

// OAuth 2.0 / OIDC authorization-flow params. They stay off URLs even where the
// page view allowlist admits them, because a URL travels on every event.
export const EXCLUDED_URL_QUERY_PARAMS: string[] = [
    'client_id',
    'redirect_uri',
    'response_type',
    'scope',
    'state',
    'code',
    'nonce',
];

// An OAuth implicit or OIDC fragment response puts its tokens in `#k=v&...`.
export const EXCLUDED_URL_FRAGMENT_PARAMS: string[] = EXCLUDED_URL_QUERY_PARAMS.concat(
    [
        'access_token',
        'id_token',
        'refresh_token',
        'provider_token',
        'provider_refresh_token',
    ]
);

// Allowlisted params whose value is itself a URL, so it can carry a query.
const URL_VALUED_QUERY_PARAMS: string[] = ['ref', 'referrer'];

const USERINFO = /^((?:[a-z][a-z0-9+.-]*:)?\/\/)[^/]*@/i;
const ORIGIN = /^(?:[a-z][a-z0-9+.-]*:)?\/\/[^/]*/i;

// Only a URL or a path is masked. A bare value, such as `ref=spring2024`, is a
// code rather than a page, and stays as written.
const maskPath = (url: string): string => {
    const origin = ORIGIN.exec(url);
    if (origin) {
        return origin[0] + pagePath(url.slice(origin[0].length));
    }
    return url.charAt(0) === '/' ? pagePath(url) : url;
};

// A hash route keeps its `#` or `#!` and has its path masked as the URL's own,
// up to any `&` pairs or flags that follow it.
const maskRoute = (route: string): string => {
    const prefix = /^#!?/.exec(route)[0];
    const pairsStart = route.indexOf('&');
    const pathEnd = pairsStart === -1 ? route.length : pairsStart;
    return (
        prefix +
        pagePath(route.slice(prefix.length, pathEnd)) +
        route.slice(pathEnd)
    );
};

const decodeQueryComponent = (component: string): string =>
    decodeURIComponent(component.replace(/\+/g, ' '));

const cleanQueryPair = (pair: string): string | null => {
    const separator = pair.indexOf('=');
    const rawName = separator === -1 ? pair : pair.slice(0, separator);
    let name: string;
    try {
        name = decodeQueryComponent(rawName);
    } catch (e) {
        return null;
    }

    const lowerName = name.toLowerCase();
    if (
        !name ||
        !isUrlQueryParam(name) ||
        EXCLUDED_URL_QUERY_PARAMS.indexOf(lowerName) !== -1
    ) {
        return null;
    }

    if (separator === -1 || URL_VALUED_QUERY_PARAMS.indexOf(lowerName) === -1) {
        return pair;
    }

    let value: string;
    try {
        value = decodeQueryComponent(pair.slice(separator + 1));
    } catch (e) {
        return null;
    }
    const cleanedValue = cleanUrl(value, UrlMode.Path);
    return cleanedValue === value
        ? pair
        : `${rawName}=${encodeURIComponent(cleanedValue)}`;
};

const cleanQuery = (query: string): string =>
    query
        .split('&')
        .map(cleanQueryPair)
        .filter((pair): pair is string => pair !== null)
        .join('&');

const keepsFragmentPair = (pair: string): boolean => {
    try {
        const name = decodeQueryComponent(pair.split('=')[0]);
        return EXCLUDED_URL_FRAGMENT_PARAMS.indexOf(name.toLowerCase()) === -1;
    } catch (e) {
        return false;
    }
};

// A hash route (`#/...`, `#!...`, or a path with no `=` before its `?`) keeps
// its path; a query inside it gets the same allowlist as the URL's own query.
// A fragment of bare pairs loses the OAuth/OIDC ones.
const cleanFragment = (hash: string): string => {
    const queryStart = hash.indexOf('?');
    const route = queryStart === -1 ? hash : hash.slice(0, queryStart);
    // `#/…`, `#!…`, or a fragment with a `/` before any `&` or `?`, as
    // `#orders/12345678` is in routers that drop the leading slash.
    const isHashRoute = /^#!|^#[^?&]*\//.test(hash);
    const isRoute =
        isHashRoute || (queryStart !== -1 && route.indexOf('=') === -1);

    if (isRoute && queryStart !== -1) {
        const query = cleanQuery(hash.slice(queryStart + 1));
        return maskRoute(route) + (query ? `?${query}` : '');
    }

    // A plain anchor such as `#reviews` names a part of the page, not a route.
    if (hash.indexOf('=') === -1) {
        return isHashRoute ? maskRoute(hash) : hash;
    }

    // A hash route's path leads its pairs, as in `#/cb&tab=2`.
    const pairs = hash
        .slice(1)
        .split('&')
        .map((pair, i) =>
            i === 0 && isHashRoute ? maskRoute(`#${pair}`).slice(1) : pair
        )
        .filter(keepsFragmentPair)
        .join('&');
    return pairs ? `#${pairs}` : '';
};

// String-based rather than `new URL`, so kept pairs and the fragment go out
// exactly as the browser reported them and no environment can parse differently.
// An unknown mode is treated as `path`.
export const cleanUrl = (href: string, mode: UrlMode): string => {
    if (typeof href !== 'string' || !href) {
        return '';
    }

    const hashStart = href.indexOf('#');
    const hash = hashStart === -1 ? '' : href.slice(hashStart);
    const beforeHash = hashStart === -1 ? href : href.slice(0, hashStart);
    const queryStart = beforeHash.indexOf('?');
    const path = maskPath(
        (queryStart === -1
            ? beforeHash
            : beforeHash.slice(0, queryStart)
        ).replace(USERINFO, '$1')
    );

    if (mode !== UrlMode.Full) {
        return path;
    }

    const query =
        queryStart === -1 ? '' : cleanQuery(beforeHash.slice(queryStart + 1));

    return path + (query ? `?${query}` : '') + cleanFragment(hash);
};

// The current page as it may appear on an event.
export const cleanPageHref = (): string => cleanUrl(getHref(), UrlMode.Full);
