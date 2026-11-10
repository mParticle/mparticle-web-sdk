import {
    cleanPageHref,
    cleanUrl,
    EXCLUDED_URL_FRAGMENT_PARAMS,
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

        it('drops userinfo from a scheme-relative URL', () => {
            expect(
                cleanUrl('//u:p@shop.example.com/a', UrlMode.Path)
            ).toBe('//shop.example.com/a');
        });

        it('masks a relative path segment holding an @, rather than reading it as userinfo', () => {
            expect(cleanUrl('/a/@b', UrlMode.Path)).toBe('/a/*');
        });

        it('masks a numeric user id under u, and keeps an account page there', () => {
            expect(cleanUrl('https://shop.example.com/u/12345678', UrlMode.Path)).toBe('https://shop.example.com/u/*');
            expect(cleanUrl('https://shop.example.com/u/login', UrlMode.Path)).toBe('https://shop.example.com/u/login');
        });

        it('keeps the host when the path holds an @, and masks that segment', () => {
            expect(
                cleanUrl('https://shop.example.com/u/@name', UrlMode.Path)
            ).toBe('https://shop.example.com/u/*');
        });

        it.each([
            ['a product id as written', 'https://shop.example.com/product/trail-runner/509585', 'https://shop.example.com/product/trail-runner/509585'],
            ['a checkout token', 'https://shop.example.com/checkout/qWeRtYuIoPaSdFgHjK_Zx/review?step=2', 'https://shop.example.com/checkout/*/review'],
            ['an order number after an order route', 'https://shop.example.com/account/view-order/12345678/', 'https://shop.example.com/account/view-order/*/'],
            ['an id after a personal route', '//shop.example.com/profile/48213/edit', '//shop.example.com/profile/*/edit'],
            ['a short token after a personal route', 'https://shop.example.com/invite/A1B2C3D4E5F6/accept', 'https://shop.example.com/invite/*/accept'],
            ['a UUID', 'https://shop.example.com/account/order-tracking/550e8400-e29b-41d4-a716-446655440000', 'https://shop.example.com/account/order-tracking/*'],
            ['a long checkout token', 'https://shop.example.com/checkouts/c/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', 'https://shop.example.com/checkouts/c/*'],
            ['a long token cut into shorter pieces', 'https://shop.example.com/checkout/a1b2c3d4-e5f6g7h8/review', 'https://shop.example.com/checkout/*/review'],
            ['an email still encoded after every decode', 'https://shop.example.com/p/jane%252525252540example.com', 'https://shop.example.com/p/*'],
            ['an order after a route still encoded after every decode', 'https://shop.example.com/%25252525256Frders/12345678', 'https://shop.example.com/*/*'],
            ['a relative path', '/orders/12345678', '/orders/*'],
            ['a host with no path', 'https://shop.example.com', 'https://shop.example.com'],
        ])('masks %s in the path', (_name, href, expected) => {
            expect(cleanUrl(href, UrlMode.Path)).toBe(expected);
        });

        it.each([
            ['a product code', 'https://shop.example.com/dp/B0CHX1W1XY'],
            ['a product code with a size', 'https://shop.example.com/p/CN8490-002'],
            ['a product slug with numbers', 'https://shop.example.com/p/acmephone-15-pro-max-256gb'],
            ['a product slug with a model number', 'https://shop.example.com/p/trail-runner-max-270-sport'],
            ['a camel-case product name', 'https://shop.example.com/p/iPhoneProMax'],
            ['a page after a personal route', 'https://shop.example.com/profile/edit'],
            ['a page after an order route', 'https://shop.example.com/orders/history'],
            ['a name after a personal route, which holds no digit or token', 'https://shop.example.com/profile/jane-smith'],
            ['a short code under another route', 'https://shop.example.com/promo/A1B2C3D4E5F6'],
        ])('keeps %s, which a page URL only hides with high confidence', (_name, href) => {
            expect(cleanUrl(href, UrlMode.Path)).toBe(href);
        });

        it('masks a report path with the fuller rules, so a name stays out of it', () => {
            expect(
                cleanUrl(
                    'https://shop.example.com/profile/jane-smith?x=1#top',
                    UrlMode.Report
                )
            ).toBe('https://shop.example.com/profile/*');
            expect(
                cleanUrl(
                    'https://shop.example.com/profile/jane-smith',
                    UrlMode.Path
                )
            ).toBe('https://shop.example.com/profile/jane-smith');
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
            'drops the OAuth param %s',
            name => {
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

        it('applies the allowlist to a query inside a hash route', () => {
            expect(
                cleanUrl(
                    'https://shop.example.com/#/checkout?email=a%40b.com&token=t&page=2',
                    UrlMode.Full
                )
            ).toBe('https://shop.example.com/#/checkout?page=2');
        });

        it('keeps the hash route when no pair in it survives', () => {
            expect(
                cleanUrl(
                    'https://shop.example.com/#/search?email=a%40b.com',
                    UrlMode.Full
                )
            ).toBe('https://shop.example.com/#/search');
        });

        it.each(EXCLUDED_URL_FRAGMENT_PARAMS)(
            'drops %s from a fragment of bare pairs',
            name => {
                expect(
                    cleanUrl(
                        `https://shop.example.com/cb#${name}=v&expires_in=3600`,
                        UrlMode.Full
                    )
                ).toBe('https://shop.example.com/cb#expires_in=3600');
            }
        );

        it('drops refresh and provider tokens from a fragment', () => {
            expect(
                cleanUrl(
                    'https://shop.example.com/cb#access_token=A&refresh_token=R&provider_token=P&provider_refresh_token=Q&type=magiclink',
                    UrlMode.Full
                )
            ).toBe('https://shop.example.com/cb#type=magiclink');
        });

        it('drops the fragment when every bare pair is a token', () => {
            expect(
                cleanUrl(
                    'https://shop.example.com/cb#access_token=X&ID_TOKEN=Y',
                    UrlMode.Full
                )
            ).toBe('https://shop.example.com/cb');
        });

        it.each([
            [
                'https://shop.example.com/cb#access_token=X&redirect=/x?y=1',
                'https://shop.example.com/cb#redirect=/x?y=1',
            ],
            [
                'https://shop.example.com/cb#id_token=X&next=https://o.example/?q',
                'https://shop.example.com/cb#next=https://o.example/?q',
            ],
        ])('drops tokens from bare pairs that contain a ?: %s', (href, expected) => {
            expect(cleanUrl(href, UrlMode.Full)).toBe(expected);
        });

        it('drops a token appended to a hash route with no query', () => {
            expect(
                cleanUrl(
                    'https://shop.example.com/#/cb&access_token=X&tab=2',
                    UrlMode.Full
                )
            ).toBe('https://shop.example.com/#/cb&tab=2');
        });

        it('masks a hash route segment containing =, keeping its pairs', () => {
            expect(
                cleanUrl('https://shop.example.com/#/a=b&c', UrlMode.Full)
            ).toBe('https://shop.example.com/#/*&c');
        });

        it.each([
            ['https://shop.example.com/app#/orders/12345678', 'https://shop.example.com/app#/orders/*'],
            ['https://shop.example.com/app#!/profile/48213?page=2', 'https://shop.example.com/app#!/profile/*?page=2'],
            ['https://shop.example.com/app#/orders/12345678&tab=2', 'https://shop.example.com/app#/orders/*&tab=2'],
            ['https://shop.example.com/app#checkout/qWeRtYuIoPaSdFgHjK_Zx?page=2', 'https://shop.example.com/app#checkout/*?page=2'],
            ['https://shop.example.com/app#/checkout/A1B2C3D4E5F6G7H8&preview', 'https://shop.example.com/app#/checkout/*&preview'],
            ['https://shop.example.com/app#/checkout/A1B2C3D4E5F6G7H8&preview?page=2', 'https://shop.example.com/app#/checkout/*&preview?page=2'],
            ['https://shop.example.com/app#!/checkout/A1B2C3D4E5F6G7H8&preview?page=2', 'https://shop.example.com/app#!/checkout/*&preview?page=2'],
            ['https://shop.example.com/app#orders/12345678', 'https://shop.example.com/app#orders/*'],
            ['https://shop.example.com/app#checkout/A1B2C3D4E5F6G7H8&tab=2', 'https://shop.example.com/app#checkout/*&tab=2'],
        ])('masks a hash route path as the URL path: %s', (href, expected) => {
            expect(cleanUrl(href, UrlMode.Full)).toBe(expected);
        });

        it.each([
            ['https://shop.example.com/app#orders/12345678&access_token=abc/def?page=2', 'https://shop.example.com/app#orders/*?page=2'],
            ['https://shop.example.com/app#/cb&access_token=X?page=2', 'https://shop.example.com/app#/cb?page=2'],
            ['https://shop.example.com/app#!/x&id_token=Y&tab=2?page=2', 'https://shop.example.com/app#!/x&tab=2?page=2'],
            ['https://shop.example.com/app#/cb&refresh_token=R', 'https://shop.example.com/app#/cb'],
        ])('drops token pairs between a hash route and its query: %s', (href, expected) => {
            expect(cleanUrl(href, UrlMode.Full)).toBe(expected);
        });

        it.each([
            ['https://shop.example.com/cb#access_token=abc/def&tab=2', 'https://shop.example.com/cb#tab=2'],
            ['https://shop.example.com/cb#access_token=abc/def?x=1', 'https://shop.example.com/cb'],
            ['https://shop.example.com/cb#id_token=a/b', 'https://shop.example.com/cb'],
        ])('never reads a bare token pair holding a / as a route: %s', (href, expected) => {
            expect(cleanUrl(href, UrlMode.Full)).toBe(expected);
        });

        it.each([
            'https://shop.example.com/p#reviews',
            'https://shop.example.com/p#A1B2C3D4E5F6',
        ])('keeps a plain anchor as written: %s', href => {
            expect(cleanUrl(href, UrlMode.Full)).toBe(href);
        });

        it.each([
            [
                'https://shop.example.com/#/item;id=1?email=x&page=2',
                'https://shop.example.com/#/*?page=2',
            ],
            [
                'https://shop.example.com/#!/item;id=1?email=x',
                'https://shop.example.com/#!/*',
            ],
        ])(
            'applies the allowlist to a route with = before its query: %s',
            (href, expected) => {
                expect(cleanUrl(href, UrlMode.Full)).toBe(expected);
            }
        );

        it('keeps a plain hash route', () => {
            expect(
                cleanUrl('https://shop.example.com/#/reviews', UrlMode.Full)
            ).toBe('https://shop.example.com/#/reviews');
        });

        it.each(['ref', 'referrer', 'REF'])(
            'cleans a URL carried in the %s value',
            name => {
                expect(
                    cleanUrl(
                        `https://shop.example.com/p?${name}=${encodeURIComponent(
                            'https://u:p@o.example/x?email=a@b.com#t'
                        )}&page=1`,
                        UrlMode.Full
                    )
                ).toBe(
                    `https://shop.example.com/p?${name}=${encodeURIComponent(
                        'https://o.example/x'
                    )}&page=1`
                );
            }
        );

        it('cleans an unencoded URL in a ref value', () => {
            expect(
                cleanUrl(
                    'https://shop.example.com/p?ref=https://o.example/x?email=a@b.com',
                    UrlMode.Full
                )
            ).toBe(
                `https://shop.example.com/p?ref=${encodeURIComponent(
                    'https://o.example/x'
                )}`
            );
        });

        it('keeps a ref value with nothing to clean exactly as given', () => {
            expect(
                cleanUrl(
                    'https://shop.example.com/p?ref=spring+sale&referrer=https%3A%2F%2Fo.example%2Fx',
                    UrlMode.Full
                )
            ).toBe(
                'https://shop.example.com/p?ref=spring+sale&referrer=https%3A%2F%2Fo.example%2Fx'
            );
        });

        it.each(['spring2024', 'partner42', 'a=b@c'])(
            'keeps a ref value that is a code, not a URL, as given: %s',
            value => {
                const href = `https://shop.example.com/p?ref=${encodeURIComponent(value)}`;
                expect(cleanUrl(href, UrlMode.Full)).toBe(href);
            }
        );

        it('masks the path of a ref value that is a URL or a path', () => {
            expect(
                cleanUrl(
                    'https://shop.example.com/p?ref=%2Forders%2F12345678&referrer=https%3A%2F%2Fo.example%2Fprofile%2F48213',
                    UrlMode.Full
                )
            ).toBe(
                `https://shop.example.com/p?ref=${encodeURIComponent('/orders/*')}&referrer=${encodeURIComponent('https://o.example/profile/*')}`
            );
        });

        it('drops a ref pair whose value cannot be decoded', () => {
            expect(
                cleanUrl(
                    'https://shop.example.com/p?ref=%E0%A4%A&page=1',
                    UrlMode.Full
                )
            ).toBe('https://shop.example.com/p?page=1');
        });

        it('passes other allowlisted values through unchanged', () => {
            expect(
                cleanUrl(
                    'https://shop.example.com/p?utm_source=x;email=a@b.com&q=a?email=x@y.com',
                    UrlMode.Full
                )
            ).toBe(
                'https://shop.example.com/p?utm_source=x;email=a@b.com&q=a?email=x@y.com'
            );
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

    it.each([
        'utm_source',
        'gclid',
        'utm_source_platform',
        'gad_source',
        'gad_campaignid',
        'srsltid',
        'epik',
        'sccid',
        'irclickid',
        'mc_cid',
        'rtid',
        'rclid',
    ])(
        'keeps the attribution param %s on URLs without capturing it by default',
        name => {
            expect(isAllowedQueryParam(name)).toBe(false);
            expect(
                cleanUrl(`https://shop.example.com/?${name}=v`, UrlMode.Full)
            ).toBe(`https://shop.example.com/?${name}=v`);
        }
    );

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
