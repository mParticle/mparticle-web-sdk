import {
    cleanPageHref,
    cleanUrl,
    EXCLUDED_URL_QUERY_PARAMS,
    UrlMode,
} from '../../src/pageUrl';
import { isAllowedQueryParam } from '../../src/pageViewTracker';
import { queryStringParser } from '../../src/utils';

describe('cleanUrl', () => {
    describe('path mode', () => {
        it('keeps scheme, host and path only', () => {
            expect(
                cleanUrl(
                    'https://shop.example.com/checkout?utm_source=x&email=a%40b.com#/step',
                    UrlMode.Path
                )
            ).toBe('https://shop.example.com/checkout');
        });

        it('drops userinfo', () => {
            expect(
                cleanUrl('https://user:secret@shop.example.com/a', UrlMode.Path)
            ).toBe('https://shop.example.com/a');
        });

        it('keeps an @ that sits in the path', () => {
            expect(
                cleanUrl('https://shop.example.com/u/@name', UrlMode.Path)
            ).toBe('https://shop.example.com/u/@name');
        });

        it('treats an unknown mode as path', () => {
            expect(
                cleanUrl(
                    'https://shop.example.com/a?utm_source=x#h',
                    'other' as UrlMode
                )
            ).toBe('https://shop.example.com/a');
        });
    });

    describe('full mode', () => {
        it('keeps allowlisted params and the fragment, drops the rest', () => {
            expect(
                cleanUrl(
                    'https://shop.example.com/p?email=a%40b.com&utm_source=google&token=abc&page=2#/reviews',
                    UrlMode.Full
                )
            ).toBe(
                'https://shop.example.com/p?utm_source=google&page=2#/reviews'
            );
        });

        it('keeps prefix-matched params', () => {
            expect(
                cleanUrl(
                    'https://shop.example.com/p?dwvar_123_color=navy&sid=1',
                    UrlMode.Full
                )
            ).toBe('https://shop.example.com/p?dwvar_123_color=navy');
        });

        it('matches names in any case and keeps the original spelling', () => {
            expect(
                cleanUrl(
                    'https://shop.example.com/p?UTM_Source=Google',
                    UrlMode.Full
                )
            ).toBe('https://shop.example.com/p?UTM_Source=Google');
        });

        it('matches percent-encoded names', () => {
            expect(
                cleanUrl(
                    'https://shop.example.com/p?utm%5Fsource=x',
                    UrlMode.Full
                )
            ).toBe('https://shop.example.com/p?utm%5Fsource=x');
        });

        it('keeps pair text and order exactly as given', () => {
            expect(
                cleanUrl(
                    'https://shop.example.com/s?q=red+shoes&page=3&q=blue%20hat',
                    UrlMode.Full
                )
            ).toBe(
                'https://shop.example.com/s?q=red+shoes&page=3&q=blue%20hat'
            );
        });

        it('drops a pair whose name cannot be decoded', () => {
            expect(
                cleanUrl('https://shop.example.com/p?%E0%A4%A=1&page=2', UrlMode.Full)
            ).toBe('https://shop.example.com/p?page=2');
        });

        it.each(EXCLUDED_URL_QUERY_PARAMS)(
            'drops the OAuth param %s even though page views allow it',
            name => {
                expect(isAllowedQueryParam(name)).toBe(true);
                expect(
                    cleanUrl(
                        `https://shop.example.com/cb?${name}=v&page=1`,
                        UrlMode.Full
                    )
                ).toBe('https://shop.example.com/cb?page=1');
            }
        );

        it('drops OAuth params in any case', () => {
            expect(
                cleanUrl('https://shop.example.com/cb?CODE=abc', UrlMode.Full)
            ).toBe('https://shop.example.com/cb');
        });

        it('omits the ? when no pair survives', () => {
            expect(
                cleanUrl(
                    'https://shop.example.com/a?email=a%40b.com#top',
                    UrlMode.Full
                )
            ).toBe('https://shop.example.com/a#top');
        });

        it('keeps a ? that is inside the fragment', () => {
            expect(
                cleanUrl(
                    'https://shop.example.com/#/search?email=a%40b.com',
                    UrlMode.Full
                )
            ).toBe('https://shop.example.com/#/search?email=a%40b.com');
        });

        it('leaves a URL with nothing to clean unchanged', () => {
            expect(
                cleanUrl('https://shop.example.com/a/b', UrlMode.Full)
            ).toBe('https://shop.example.com/a/b');
        });

        it('drops userinfo', () => {
            expect(
                cleanUrl('https://u:p@shop.example.com/a?page=1', UrlMode.Full)
            ).toBe('https://shop.example.com/a?page=1');
        });
    });

    it.each([undefined, null, '', 42])('returns "" for %p', href => {
        expect(cleanUrl(href as string, UrlMode.Full)).toBe('');
        expect(cleanUrl(href as string, UrlMode.Path)).toBe('');
    });
});

describe('cleanPageHref', () => {
    afterEach(() => {
        window.history.replaceState(null, '', '/');
    });

    it('cleans the current location in full mode', () => {
        window.history.replaceState(
            null,
            '',
            '/checkout?email=a%40b.com&utm_campaign=fall&code=abc#/pay'
        );

        expect(cleanPageHref()).toBe(
            `${window.location.origin}/checkout?utm_campaign=fall#/pay`
        );
    });
});

describe('isAllowedQueryParam', () => {
    it('matches mixed-case allowlist entries case-insensitively', () => {
        expect(isAllowedQueryParam('ntt')).toBe(true);
        expect(isAllowedQueryParam('SEARCHTERM')).toBe(true);
    });

    it('rejects names off the allowlist', () => {
        expect(isAllowedQueryParam('email')).toBe(false);
        expect(isAllowedQueryParam('constructor')).toBe(false);
    });
});

describe('queryStringParser fallback', () => {
    const originalURL = global.URL;

    afterEach(() => {
        global.URL = originalURL;
    });

    it('does not carry the fragment into the last value', () => {
        delete global.URL;

        expect(
            queryStringParser('https://shop.example.com/?utm_source=x#frag', [
                'utm_source',
            ])
        ).toEqual({ utm_source: 'x' });
    });
});
