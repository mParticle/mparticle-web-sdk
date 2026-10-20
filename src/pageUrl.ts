import { isAllowedQueryParam } from './pageViewTracker';
import { getHref, valueof } from './utils';

// The one rule for a URL that leaves the SDK, shared with kits through
// `mParticle._cleanUrl`. `path` keeps scheme, host and path. `full` adds the
// query params an auto page view may capture, then the fragment.
export const UrlMode = {
    Path: 'path',
    Full: 'full',
} as const;

export type UrlMode = valueof<typeof UrlMode>;

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
    ['access_token', 'id_token']
);

// Allowlisted params whose value is itself a URL, so it can carry a query.
const URL_VALUED_QUERY_PARAMS: string[] = ['ref', 'referrer'];

const USERINFO = /^((?:[a-z][a-z0-9+.-]*:)?\/\/)[^/]*@/i;

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
        !isAllowedQueryParam(name) ||
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

// A hash route keeps its path; a query inside it gets the same allowlist as
// the URL's own query. A fragment of bare pairs loses the OAuth/OIDC ones.
const cleanFragment = (hash: string): string => {
    const queryStart = hash.indexOf('?');
    const route = queryStart === -1 ? hash : hash.slice(0, queryStart);
    if (queryStart !== -1 && route.indexOf('=') === -1) {
        const query = cleanQuery(hash.slice(queryStart + 1));
        return hash.slice(0, queryStart) + (query ? `?${query}` : '');
    }

    if (hash.indexOf('=') === -1) {
        return hash;
    }

    const pairs = hash
        .slice(1)
        .split('&')
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
    const path = (queryStart === -1
        ? beforeHash
        : beforeHash.slice(0, queryStart)
    ).replace(USERINFO, '$1');

    if (mode !== UrlMode.Full) {
        return path;
    }

    const query =
        queryStart === -1 ? '' : cleanQuery(beforeHash.slice(queryStart + 1));

    return path + (query ? `?${query}` : '') + cleanFragment(hash);
};

// The current page as it may appear on an event.
export const cleanPageHref = (): string => cleanUrl(getHref(), UrlMode.Full);
