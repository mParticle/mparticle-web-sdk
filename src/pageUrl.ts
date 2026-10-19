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

const USERINFO = /^([a-z][a-z0-9+.-]*:\/\/)[^/]*@/i;

const keepsQueryPair = (pair: string): boolean => {
    let name: string;
    try {
        name = decodeURIComponent(pair.split('=')[0].replace(/\+/g, ' '));
    } catch (e) {
        return false;
    }

    return (
        !!name &&
        isAllowedQueryParam(name) &&
        EXCLUDED_URL_QUERY_PARAMS.indexOf(name.toLowerCase()) === -1
    );
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
        queryStart === -1
            ? ''
            : beforeHash
                  .slice(queryStart + 1)
                  .split('&')
                  .filter(keepsQueryPair)
                  .join('&');

    return path + (query ? `?${query}` : '') + hash;
};

// The current page as it may appear on an event.
export const cleanPageHref = (): string => cleanUrl(getHref(), UrlMode.Full);
