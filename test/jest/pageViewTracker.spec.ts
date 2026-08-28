import {
    ALLOWED_QUERY_PARAMS,
    allowedQueryParams,
    buildPageViewEvent,
    getActiveTracker,
    hasInitialPageViewFired,
    isNewPage,
    markInitialPageViewFired,
    effectiveAllowlist,
    MAX_CUSTOM_QUERY_PARAM_VALUE_LENGTH,
    MAX_CUSTOM_QUERY_PARAMS,
    pageKey,
    parseQueryParamAllowlist,
    PageViewTracker,
    patchHistory,
    resetPageViewTracking,
    supportsHistoryTracking,
    WIN_APV_KEY,
} from '../../src/pageViewTracker';
import Constants from '../../src/constants';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { EventType, MessageType } from '../../src/types';

// Capture the genuinely-native history methods at import time, before any
// tracker has a chance to monkey-patch them. Used to reset state between tests
// and to drive navigation without going through the tracker's wrapper.
const NATIVE_PUSH_STATE = window.history.pushState;
const NATIVE_REPLACE_STATE = window.history.replaceState;

const WRAPPED_MARKER = '__mpApvWrapped__';

// A wrapper installed by a third party (or an older SDK build) that already
// carries the marker, so our patch must decline to wrap on top of it.
const markedForeignWrapper = (): History['pushState'] => {
    const wrapper = function() {
        /* someone else's wrapper */
    } as History['pushState'];
    Object.defineProperty(wrapper, WRAPPED_MARKER, {
        value: true,
        enumerable: false,
    });
    return wrapper;
};

const unmarkedForeignWrapper = (): History['pushState'] =>
    function() {
        /* someone else's wrapper */
    } as History['pushState'];

// ---------------------------------------------------------------------------
// The pure helpers carry the interesting rules and need no DOM, no timers, and
// no tracker instance to assert.
// ---------------------------------------------------------------------------

describe('pageViewTracker pure helpers', () => {
    describe('#allowedQueryParams', () => {
        it('should keep an allowlisted param', () => {
            expect(
                allowedQueryParams('https://example.com/?ref=google')
            ).toEqual([{ name: 'ref', value: 'google' }]);
        });

        // The allowlist is the whole point: anything not named is dropped, so a
        // partner URL carrying an order id or an email cannot leak through.
        it('should drop a param that is not allowlisted', () => {
            expect(
                allowedQueryParams(
                    'https://example.com/?ref=google&email=someone@example.com&order_id=42'
                )
            ).toEqual([{ name: 'ref', value: 'google' }]);
        });

        it('should fold key casing onto the allowlisted name', () => {
            expect(
                allowedQueryParams('https://example.com/?Ref=google')
            ).toEqual([{ name: 'ref', value: 'google' }]);
        });

        it('should return nothing for a URL with no query string', () => {
            expect(allowedQueryParams('https://example.com/cart')).toEqual([]);
        });

        // getHref() yields '' under SSR, so this is the path that must not throw.
        it('should return nothing for an empty href', () => {
            expect(allowedQueryParams('')).toEqual([]);
        });

        // A URL is free to carry a param named after an Object.prototype member.
        // It is not on the allowlist, so it is dropped like any other unlisted
        // param — this asserts the drop, not the own-property guard in
        // queryStringParser, which only bites when the KEY LIST names such a member.
        it('should drop params named after Object.prototype members', () => {
            expect(
                allowedQueryParams(
                    'https://example.com/?constructor=x&__proto__=y&toString=z&ref=google'
                )
            ).toEqual([{ name: 'ref', value: 'google' }]);
        });

        // Removed from the default list deliberately: `code` is an OAuth
        // authorization code and `state`/`nonce` are CSRF/replay tokens, and
        // capturing them by default put credentials in the event store and every
        // connected kit for customers who had no use for them. A customer who needs
        // them configures them per input — see the next test.
        it.each([
            'code',
            'state',
            'nonce',
            'client_id',
            'redirect_uri',
            'response_type',
            'scope',
        ])('should not capture the OAuth/OIDC param %s by default', name => {
            expect(
                allowedQueryParams(
                    `https://example.com/callback?${name}=sensitive&ref=g`
                )
            ).toEqual([{ name: 'ref', value: 'g' }]);
        });

        // Also removed from the default, for a different reason: these are already
        // carried on planes built for them — click ids by IntegrationCapture as
        // per-network custom flags, campaign data by the reserved `$utm_*` user
        // attributes. As page view attributes they were a copy nothing read.
        it.each([
            'utm_source',
            'utm_medium',
            'utm_campaign',
            'utm_term',
            'utm_content',
            'utm_id',
            'gclid',
            'gbraid',
            'wbraid',
            'fbclid',
            'msclkid',
            'ttclid',
            'twclid',
            'li_fat_id',
            'dclid',
        ])('should not capture the attribution param %s by default', name => {
            expect(
                allowedQueryParams(
                    `https://example.com/landing?${name}=abc&ref=g`
                )
            ).toEqual([{ name: 'ref', value: 'g' }]);
        });

        // A customer who does want one as a page view attribute configures it, through
        // the same path a real config takes. Nothing else pins this: while these were
        // built-ins, parseQueryParamAllowlist dropped a configured copy as a duplicate.
        it.each(['utm_source', 'gclid'])(
            'should capture the attribution param %s once configured',
            name => {
                const { allowed } = parseQueryParamAllowlist(name);

                expect(allowed).toEqual([name]);
                expect(
                    allowedQueryParams(
                        `https://example.com/landing?${name}=abc`,
                        allowed
                    )
                ).toEqual([{ name, value: 'abc' }]);
            }
        );

        // The removal is a change of DEFAULT, not of capability. This is what makes
        // it a safe change rather than a regression.
        it('should still capture an OAuth param when a customer configures it', () => {
            expect(
                allowedQueryParams('https://example.com/callback?code=abc123', [
                    'code',
                ])
            ).toEqual([{ name: 'code', value: 'abc123' }]);
        });

        // The same escape hatch through the path a real customer takes: the value
        // arrives as a comma-separated string and processFlags validates it before
        // anything downstream sees it.
        //
        // This assertion is the one that matters for this PR. While `code` was a
        // built-in, parseQueryParamAllowlist dropped it as a duplicate — so a
        // customer typing `code` into Advanced Settings would have got an empty list
        // and the escape hatch would have silently done nothing. Removing it from the
        // defaults is precisely what makes that work, and nothing else pins it.
        it('should accept a configured OAuth param through the string config path', () => {
            const { allowed } = parseQueryParamAllowlist('code');

            expect(allowed).toEqual(['code']);
            expect(
                allowedQueryParams(
                    'https://example.com/callback?code=abc123',
                    allowed
                )
            ).toEqual([{ name: 'code', value: 'abc123' }]);
        });

        it('should capture a configured custom param', () => {
            expect(
                allowedQueryParams(
                    'https://example.com/?promo_code=SAVE20&ref=google',
                    ['promo_code']
                )
            ).toEqual([
                { name: 'ref', value: 'google' },
                { name: 'promo_code', value: 'SAVE20' },
            ]);
        });

        it('should still drop an unlisted param when extras are configured', () => {
            expect(
                allowedQueryParams(
                    'https://example.com/?promo_code=x&email=a@b.com',
                    ['promo_code']
                )
            ).toEqual([{ name: 'promo_code', value: 'x' }]);
        });

        // This is the regression the hardening PR could not test: with a hardcoded
        // allowlist, `in` and hasOwnProperty are indistinguishable because no
        // built-in names a prototype member. A configured list makes it reachable.
        // parseQueryParamAllowlist rejects these names, so reaching allowedQueryParams
        // with them means someone bypassed that — and it must still be inert.
        it.each(['constructor', '__proto__', 'toString', 'valueOf'])(
            'should capture nothing for a configured extra named %s',
            name => {
                expect(
                    allowedQueryParams('https://example.com/?ref=google', [
                        name,
                    ])
                ).toEqual([{ name: 'ref', value: 'google' }]);
            }
        );

        it('should not pollute Object.prototype via a configured extra', () => {
            allowedQueryParams('https://example.com/?__proto__=polluted', [
                '__proto__',
            ]);

            expect(({} as Record<string, unknown>).polluted).toBeUndefined();
        });

        // Custom params are where unbounded customer choice enters, so their values
        // are bounded. Dropped rather than truncated: truncating would make two
        // different long values produce the same dedup key and swallow a real view.
        it('should drop a custom param whose value exceeds the cap', () => {
            const tooLong = 'x'.repeat(MAX_CUSTOM_QUERY_PARAM_VALUE_LENGTH + 1);

            expect(
                allowedQueryParams(
                    `https://example.com/?blob=${tooLong}&ref=g`,
                    ['blob']
                )
            ).toEqual([{ name: 'ref', value: 'g' }]);
        });

        it('should keep a custom param whose value is exactly at the cap', () => {
            const exact = 'x'.repeat(MAX_CUSTOM_QUERY_PARAM_VALUE_LENGTH);

            expect(
                allowedQueryParams(`https://example.com/?blob=${exact}`, ['blob'])
            ).toEqual([{ name: 'blob', value: exact }]);
        });

        // Built-in behaviour is deliberately untouched by the cap, so nobody can
        // lose a long search term on upgrade.
        it('should keep a built-in param whose value exceeds the custom cap', () => {
            const tooLong = 'x'.repeat(MAX_CUSTOM_QUERY_PARAM_VALUE_LENGTH + 1);

            expect(
                allowedQueryParams(`https://example.com/?search=${tooLong}`)
            ).toEqual([{ name: 'search', value: tooLong }]);
        });

        it('should keep every param on the allowlist', () => {
            const query = ALLOWED_QUERY_PARAMS.map(
                name => `${name}=v-${name}`
            ).join('&');

            expect(
                allowedQueryParams(`https://example.com/?${query}`)
            ).toHaveLength(ALLOWED_QUERY_PARAMS.length);
        });
    });

    describe('#parseQueryParamAllowlist', () => {
        const allowed = (input: string | string[]): string[] =>
            parseQueryParamAllowlist(input).allowed;
        const rejectedPositions = (input: string | string[]): number[] =>
            parseQueryParamAllowlist(input).rejectedPositions;
        const overLimit = (input: string | string[]): number =>
            parseQueryParamAllowlist(input).overLimit;

        it('should split, trim and lowercase a comma-separated string', () => {
            expect(allowed(' Promo_Code , AFFILIATE_ID ')).toEqual([
                'promo_code',
                'affiliate_id',
            ]);
        });

        it('should accept an array as well as a string', () => {
            expect(allowed(['promo_code'])).toEqual(['promo_code']);
        });

        it.each([undefined, null, '', ' , , '])(
            'should return nothing for %p',
            input => {
                expect(allowed(input as string)).toEqual([]);
            }
        );

        it('should drop a duplicate of a built-in without rejecting it', () => {
            // Asking for something you already have is not an error.
            expect(allowed('ref, promo_code')).toEqual(['promo_code']);
            expect(rejectedPositions('ref')).toEqual([]);
        });

        it('should drop a repeat of itself', () => {
            expect(allowed('promo_code, promo_code')).toEqual(['promo_code']);
        });

        it.each([
            ['a name with spaces', 'bad name'],
            ['an equals sign', 'a=b'],
            ['an ampersand', 'a&b'],
            ['a percent', 'a%20b'],
            ['a leading hyphen', '-lead'],
            ['a leading dot', '.lead'],
            ['a non-ASCII name', 'émail'],
        ])('should reject %s', (_label, name) => {
            expect(allowed(name)).toEqual([]);
            expect(rejectedPositions(name)).toEqual([1]);
        });

        // Positions are 1-based and count every comma-separated slot, so a reported
        // position lines up with what the customer typed into the field.
        it('should report the position of each rejected entry', () => {
            expect(
                rejectedPositions('promo_code, bad name, affiliate_id, a=b')
            ).toEqual([2, 4]);
        });

        it('should count a blank slot as a position without rejecting it', () => {
            expect(rejectedPositions('promo_code, , bad name')).toEqual([3]);
        });

        // No part of a rejected entry may reach a log. An earlier version reported a
        // prefix cut at the first illegal character, which does not achieve that:
        // `.`, `-` and `_` are all legal, so these leaked whole or nearly whole.
        it.each([
            'password=hunter2',
            'token.hunter2 x',
            'user.email.hunter2@x',
            '-secret-value-abcdef',
            '.hunter2',
        ])('should report only a position for %p', entry => {
            const { allowed: names, rejectedPositions: positions } =
                parseQueryParamAllowlist(entry);

            expect(names).toEqual([]);
            expect(positions).toEqual([1]);
            // A number cannot carry the customer's text at all, which is the point.
            expect(JSON.stringify(positions)).not.toContain('hunter2');
            expect(JSON.stringify(positions)).not.toContain('secret');
            expect(JSON.stringify(positions)).not.toContain('abc');
        });

        it('should reject a name longer than 64 characters', () => {
            const long = 'a'.repeat(65);
            expect(allowed(long)).toEqual([]);
            expect(rejectedPositions(long)).toEqual([1]);
        });

        it('should accept a name of exactly 64 characters', () => {
            const exact = 'a'.repeat(64);
            expect(allowed(exact)).toEqual([exact]);
        });

        it.each(['hostname', 'title', 'path'])(
            'should reject the core event field %s',
            name => {
                expect(allowed(name)).toEqual([]);
                expect(rejectedPositions(name)).toEqual([1]);
            }
        );

        it.each(['constructor', '__proto__', 'prototype'])(
            'should reject the prototype member name %s',
            name => {
                expect(allowed(name)).toEqual([]);
                expect(rejectedPositions(name)).toEqual([1]);
            }
        );

        // Every other flag in this SDK is a string compared against 'True', so
        // setting this one to `True` is a plausible operator slip — and `true` is a
        // legal param name, so nothing else would catch it.
        it.each(['True', 'true', 'False', 'false'])(
            'should reject the boolean-looking value %p',
            name => {
                expect(allowed(name)).toEqual([]);
                expect(rejectedPositions(name)).toEqual([1]);
            }
        );

        it('should cap the accepted list', () => {
            const many = Array.from(
                { length: MAX_CUSTOM_QUERY_PARAMS + 15 },
                (_unused, i) => `p${i}`
            ).join(',');

            expect(allowed(many)).toHaveLength(MAX_CUSTOM_QUERY_PARAMS);
        });

        // Entries past the cap used to be dropped with no report of any kind: the
        // cap was checked at the top of the loop, so they were neither accepted nor
        // rejected. They are counted so the warning can say how many were lost.
        it('should count the entries dropped past the cap', () => {
            const many = Array.from(
                { length: MAX_CUSTOM_QUERY_PARAMS + 15 },
                (_unused, i) => `p${i}`
            ).join(',');

            expect(overLimit(many)).toBe(15);
            expect(rejectedPositions(many)).toEqual([]);
        });

        // The cap is checked after the duplicate and blank filters, so neither
        // consumes headroom that a real addition could have used.
        it('should not let duplicates consume cap headroom', () => {
            const names = Array.from(
                { length: MAX_CUSTOM_QUERY_PARAMS },
                (_unused, i) => `p${i}`
            );
            const withDuplicates = names
                .concat(names)
                .concat(['ref', '', 'last_one'])
                .join(',');

            expect(allowed(withDuplicates)).toEqual(names);
            // Only `last_one` was a genuine addition with nowhere to go.
            expect(overLimit(withDuplicates)).toBe(1);
        });
    });

    describe('#effectiveAllowlist', () => {
        it('should be the built-ins alone when nothing is configured', () => {
            expect(effectiveAllowlist()).toEqual(ALLOWED_QUERY_PARAMS);
            expect(effectiveAllowlist([])).toEqual(ALLOWED_QUERY_PARAMS);
        });

        // The built-in prefix is what keeps existing dedup keys byte-identical for
        // pages that use no custom params. Reordering here would fire one spurious
        // page view per page on the first navigation after a customer opts in.
        it('should keep the built-ins first, in their existing order', () => {
            const list = effectiveAllowlist(['promo_code']);

            expect(list.slice(0, ALLOWED_QUERY_PARAMS.length)).toEqual(
                ALLOWED_QUERY_PARAMS
            );
            expect(list[list.length - 1]).toBe('promo_code');
        });

        // Sorted, not in config order. The suffix has to depend on the SET of
        // custom params, because pageKey walks this list: appended in config order,
        // a customer who merely swaps two co-occurring params in the Advanced
        // Settings field changes the key of every page carrying both, and each of
        // those fires one spurious page view.
        it('should append extras sorted, whatever order they were given in', () => {
            const suffix = (extras: string[]): string[] =>
                effectiveAllowlist(extras).slice(ALLOWED_QUERY_PARAMS.length);

            expect(suffix(['zeta', 'alpha'])).toEqual(['alpha', 'zeta']);
            expect(suffix(['alpha', 'zeta'])).toEqual(['alpha', 'zeta']);
        });

        // getFeatureFlag returns null when the flag is absent, and a default
        // parameter only fires for undefined.
        it.each([undefined, null])('should tolerate %p', extras => {
            expect(effectiveAllowlist(extras as string[])).toEqual(
                ALLOWED_QUERY_PARAMS
            );
        });

        it('should not duplicate an extra that is already built in', () => {
            expect(effectiveAllowlist(['ref'])).toEqual(ALLOWED_QUERY_PARAMS);
        });
    });

    describe('#pageKey', () => {
        // Builds a snapshot the way currentPage() does, so a case can be stated
        // as a URL and still exercise the real parser rather than a hand-made
        // params object.
        const pageFromHref = (href: string) => ({
            path: new URL(href).pathname,
            params: allowedQueryParams(href),
        });

        it('should be the pathname alone when no params are captured', () => {
            expect(pageKey({ path: '/cart', params: [] })).toBe('/cart');
        });

        it('should include the captured params', () => {
            expect(
                pageKey({ path: '/search', params: [{ name: 'q', value: 'shoes' }] })
            ).toBe('/search?q=shoes');
        });

        // Sorted, so a router that reorders the query string on an otherwise
        // identical navigation does not produce a spurious second page view.
        it('should be stable against param reordering', () => {
            // The capture order is fixed by the allowlist, so two URLs whose
            // query strings differ only in order produce the same pair list and
            // therefore the same key.
            const a = pageKey(pageFromHref('https://x.com/s?q=x&page=2'));
            const b = pageKey(pageFromHref('https://x.com/s?page=2&q=x'));

            expect(a).toBe(b);
        });

        it('should distinguish two values of the same param', () => {
            expect(
                pageKey({ path: '/s', params: [{ name: 'page', value: '1' }] })
            ).not.toBe(
                pageKey({ path: '/s', params: [{ name: 'page', value: '2' }] })
            );
        });

        // queryStringParser hands values back DECODED, so a value carrying the
        // pair delimiters would serialize exactly like two separate params and
        // dedup a real navigation away. `search` follows `q` in the allowlist, so
        // the two below collide unless the value is re-encoded.
        it('should not collide when a value contains the pair delimiters', () => {
            const injected = pageKey({
                path: '/s',
                params: [{ name: 'q', value: 'a&search=b' }],
            });
            const genuine = pageKey({
                path: '/s',
                params: [
                    { name: 'q', value: 'a' },
                    { name: 'search', value: 'b' },
                ],
            });

            expect(injected).not.toBe(genuine);
        });

        // The property that makes opting in safe: a page whose URL uses none of the
        // custom params must key identically before and after a customer adds them.
        // If this breaks, every such page fires one spurious view on the first
        // navigation after rollout.
        //
        // Asserted against a literal, which is what "byte-identical" means. Comparing
        // two calls to the current allowedQueryParams would compare new against new
        // and pass even if the whole union were reordered, since both sides move
        // together.
        const keyFor = (extras?: string[]): string => {
            const href = 'https://x.com/p?page=2&ref=google';

            return pageKey({
                path: new URL(href).pathname,
                params: allowedQueryParams(href, extras),
            });
        };

        it('should be this exact key with no custom params configured', () => {
            expect(keyFor()).toBe('/p?page=2&ref=google');
        });

        it('should be the same key once custom params are configured', () => {
            expect(keyFor(['promo_code', 'affiliate_id'])).toBe(
                '/p?page=2&ref=google'
            );
        });

        // The same collision reached through the tracker rather than by hand:
        // ?q=a%26search%3Db and ?q=a&search=b are different pages.
        it('should fire a view between a colliding encoded and real pair', () => {
            expect(
                pageKey(pageFromHref('https://x.com/s?q=a%26search%3Db'))
            ).not.toBe(pageKey(pageFromHref('https://x.com/s?q=a&search=b')));
        });
    });

    describe('#isNewPage', () => {
        it('should treat a different key as a new page', () => {
            expect(isNewPage('/a', '/b')).toBe(true);
        });

        it('should treat an identical key as the same page', () => {
            expect(isNewPage('/a', '/a')).toBe(false);
        });

        // The caller passes pageKey() output, so an unallowlisted param and the
        // hash are already absent — which is why they cannot trigger a view.
        it('should treat the first navigation after construction as new', () => {
            expect(isNewPage(null, '/a')).toBe(true);
        });
    });

    describe('#supportsHistoryTracking', () => {
        it('should reject a missing window (SSR)', () => {
            expect(supportsHistoryTracking(null)).toBe(false);
        });

        it('should reject a window with no History API', () => {
            expect(supportsHistoryTracking(({} as unknown) as Window)).toBe(
                false
            );
        });

        it('should reject a window whose pushState is not callable', () => {
            const win = ({
                history: { pushState: undefined },
                addEventListener: () => undefined,
            } as unknown) as Window;

            expect(supportsHistoryTracking(win)).toBe(false);
        });

        it('should reject a window that cannot register listeners', () => {
            const win = ({
                history: { pushState: () => undefined },
            } as unknown) as Window;

            expect(supportsHistoryTracking(win)).toBe(false);
        });

        it('should accept a browser window', () => {
            expect(supportsHistoryTracking(window)).toBe(true);
        });
    });

    describe('#buildPageViewEvent', () => {
        it('should build a PageView event from the supplied data alone', () => {
            const event = buildPageViewEvent({
                hostname: 'example.com',
                title: 'Cart',
                path: '/cart',
                params: [],
            });

            expect(event).toEqual({
                messageType: MessageType.PageView,
                name: 'PageView',
                eventType: EventType.Unknown,
                data: {
                    hostname: 'example.com',
                    title: 'Cart',
                    path: '/cart',
                },
            });
        });

        it('should flatten the captured params alongside the core fields', () => {
            const event = buildPageViewEvent({
                hostname: 'example.com',
                title: 'Cart',
                path: '/cart',
                params: [
                    { name: 'page', value: '2' },
                    { name: 'ref', value: 'google' },
                ],
            });

            expect(event.data).toEqual({
                hostname: 'example.com',
                title: 'Cart',
                path: '/cart',
                page: '2',
                ref: 'google',
            });
        });

        // No allowlist entry collides with the core fields today; this asserts the
        // spread ordering that keeps a later addition from overwriting one.
        it('should not let a param overwrite a core field', () => {
            const event = buildPageViewEvent({
                hostname: 'example.com',
                title: 'Cart',
                path: '/cart',
                params: [
                    { name: 'path', value: '/spoofed' },
                    { name: 'hostname', value: 'evil.com' },
                ],
            });

            expect(event.data.path).toBe('/cart');
            expect(event.data.hostname).toBe('example.com');
        });

        it('should not alias the caller data into the event', () => {
            const data = {
                hostname: 'example.com',
                title: 'Cart',
                path: '/cart',
                params: [{ name: 'q', value: 'shoes' }],
            };
            const event = buildPageViewEvent(data);

            data.path = '/mutated-after-the-fact';
            data.params[0].value = 'mutated-after-the-fact';

            expect(event.data.path).toBe('/cart');
            expect(event.data.q).toBe('shoes');
        });
    });
});

describe('#patchHistory', () => {
    let onNavigate: jest.Mock;
    let log: jest.Mock;

    beforeEach(() => {
        onNavigate = jest.fn();
        log = jest.fn();
    });

    afterEach(() => {
        window.history.pushState = NATIVE_PUSH_STATE;
        window.history.replaceState = NATIVE_REPLACE_STATE;
        NATIVE_REPLACE_STATE.call(window.history, {}, '', '/');
    });

    it('should notify with the method that navigated, after it has run', () => {
        const undo = patchHistory(onNavigate, log);

        window.history.pushState({}, '', '/pushed');
        expect(onNavigate).toHaveBeenLastCalledWith('pushState');
        // The real method already ran by the time we are notified.
        expect(window.location.pathname).toBe('/pushed');

        window.history.replaceState({}, '', '/replaced');
        expect(onNavigate).toHaveBeenLastCalledWith('replaceState');
        expect(window.location.pathname).toBe('/replaced');

        undo();
    });

    it('should restore the native methods when undone', () => {
        const undo = patchHistory(onNavigate, log);
        undo();

        expect(window.history.pushState).toBe(NATIVE_PUSH_STATE);
        expect(window.history.replaceState).toBe(NATIVE_REPLACE_STATE);
    });

    it('should decline to wrap history that is already wrapped', () => {
        const foreignWrapper = markedForeignWrapper();
        window.history.pushState = foreignWrapper;

        expect(patchHistory(onNavigate, log)).toBeNull();
        expect(window.history.pushState).toBe(foreignWrapper);
        expect(log).toHaveBeenCalledWith(
            expect.stringContaining('already wrapped')
        );
    });

    // A third party may patch one of the two methods on top of ours. Undo must
    // decide per method: leave theirs in place, still restore ours.
    it('should leave a foreign wrapper in place but restore its own', () => {
        const undo = patchHistory(onNavigate, log);

        const foreignWrapper = unmarkedForeignWrapper();
        window.history.pushState = foreignWrapper;

        undo();

        expect(window.history.pushState).toBe(foreignWrapper);
        expect(window.history.replaceState).toBe(NATIVE_REPLACE_STATE);
    });

    it('should roll back and report null when assignment is rejected', () => {
        // A frozen/sealed History makes the assignment throw in strict mode.
        Object.defineProperty(window.history, 'pushState', {
            value: NATIVE_PUSH_STATE,
            writable: false,
            configurable: true,
        });

        try {
            expect(patchHistory(onNavigate, log)).toBeNull();
            expect(window.history.pushState).toBe(NATIVE_PUSH_STATE);
            expect(window.history.replaceState).toBe(NATIVE_REPLACE_STATE);
            expect(log).toHaveBeenCalledWith(
                expect.stringContaining('failed to patch history methods')
            );
        } finally {
            Object.defineProperty(window.history, 'pushState', {
                value: NATIVE_PUSH_STATE,
                writable: true,
                configurable: true,
            });
        }
    });

    // The rejection can land on the second assignment, leaving one wrapper
    // installed and one not. The rollback has to be per method or it either
    // leaks the pushState wrapper or restores a method it never replaced.
    it('should roll back the half that was installed when the second is rejected', () => {
        Object.defineProperty(window.history, 'replaceState', {
            value: NATIVE_REPLACE_STATE,
            writable: false,
            configurable: true,
        });

        try {
            expect(patchHistory(onNavigate, log)).toBeNull();
            expect(window.history.pushState).toBe(NATIVE_PUSH_STATE);
            expect(window.history.replaceState).toBe(NATIVE_REPLACE_STATE);

            // Nothing is left listening, so a navigation is not reported twice
            // (or at all) by a wrapper the caller believes it rolled back.
            NATIVE_PUSH_STATE.call(window.history, {}, '', '/after-rollback');
            expect(onNavigate).not.toHaveBeenCalled();
        } finally {
            Object.defineProperty(window.history, 'replaceState', {
                value: NATIVE_REPLACE_STATE,
                writable: true,
                configurable: true,
            });
        }
    });
});

// ---------------------------------------------------------------------------
// The tracker itself, asserted only through its public surface: init(),
// teardown(), isActive, the registry helpers, and the events it logs.
// ---------------------------------------------------------------------------

describe('PageViewTracker', () => {
    let mpInstance: IMParticleWebSDKInstance;
    let logEvent: jest.Mock;
    let resetSessionTimer: jest.Mock;
    let verbose: jest.Mock;
    let warning: jest.Mock;
    let getFeatureFlag: jest.Mock;

    const createTracker = (): PageViewTracker => new PageViewTracker(mpInstance);

    // Change the URL without triggering the tracker's patched pushState.
    const navigateNatively = (path: string): void => {
        NATIVE_PUSH_STATE.call(window.history, {}, '', path);
    };

    const loggedPaths = (): string[] =>
        logEvent.mock.calls.map(([event]) => event.data.path);

    beforeEach(() => {
        jest.useFakeTimers();

        logEvent = jest.fn();
        resetSessionTimer = jest.fn();
        verbose = jest.fn();
        warning = jest.fn();
        // No configured additions unless a test says otherwise.
        getFeatureFlag = jest.fn().mockReturnValue(undefined);

        mpInstance = ({
            Logger: { verbose, warning },
            _SessionManager: { resetSessionTimer },
            _Events: { logEvent },
            _Helpers: { getFeatureFlag },
        } as unknown) as IMParticleWebSDKInstance;
    });

    afterEach(() => {
        // One call tears down whichever tracker is active and clears the window
        // flags — the same entry point the SDK uses, so the tests exercise it
        // rather than reaching around it.
        resetPageViewTracking();

        // Restore the native history methods and reset the URL so each test
        // starts from a clean `http://localhost/` (jsdom's default origin).
        window.history.pushState = NATIVE_PUSH_STATE;
        window.history.replaceState = NATIVE_REPLACE_STATE;
        NATIVE_REPLACE_STATE.call(window.history, {}, '', '/');

        jest.clearAllTimers();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    describe('#constructor', () => {
        it('should be side-effect free', () => {
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

            const tracker = createTracker();

            expect(tracker.isActive).toBe(false);
            expect(addEventListenerSpy).not.toHaveBeenCalled();
            expect(window.history.pushState).toBe(NATIVE_PUSH_STATE);
            expect(getActiveTracker()).toBeUndefined();
        });

        it('should not log page views before init()', () => {
            createTracker();

            window.history.pushState({}, '', '/never-tracked');
            jest.runAllTimers();

            expect(logEvent).not.toHaveBeenCalled();
        });
    });

    describe('#init - environment support', () => {
        it('should not start when the History API is unavailable', () => {
            // Simulate an unsupported environment by removing pushState.
            Object.defineProperty(window.history, 'pushState', {
                value: undefined,
                configurable: true,
                writable: true,
            });

            const tracker = createTracker();
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

            expect(() => tracker.init()).not.toThrow();
            expect(tracker.isActive).toBe(false);
            expect(getActiveTracker()).toBeUndefined();
            expect(addEventListenerSpy).not.toHaveBeenCalled();

            // Restore for afterEach cleanup.
            Object.defineProperty(window.history, 'pushState', {
                value: NATIVE_PUSH_STATE,
                configurable: true,
                writable: true,
            });
        });
    });

    describe('#init', () => {
        it('should become active and register itself', () => {
            const tracker = createTracker();
            tracker.init();

            expect(tracker.isActive).toBe(true);
            expect(getActiveTracker()).toBe(tracker);
        });

        // The seed is the pathname plus the allowlisted params, so a change to an
        // unallowlisted param (`tab`) against the landing URL is the same page.
        it('should seed the current page by path and allowlisted params only', () => {
            navigateNatively('/dashboard?tab=1#section');

            const tracker = createTracker();
            tracker.init();

            window.history.replaceState({}, '', '/dashboard?tab=2');
            jest.runAllTimers();
            expect(logEvent).not.toHaveBeenCalled();

            window.history.pushState({}, '', '/settings');
            jest.runAllTimers();
            expect(loggedPaths()).toEqual(['/settings']);
        });

        // The seed includes the params, so arriving on `?page=2` and navigating to
        // `?page=3` is a fresh view rather than a dedup against the landing URL.
        it('should seed the allowlisted params so a change to one fires', () => {
            navigateNatively('/dashboard?page=2');

            const tracker = createTracker();
            tracker.init();

            window.history.pushState({}, '', '/dashboard?page=2');
            jest.runAllTimers();
            expect(logEvent).not.toHaveBeenCalled();

            window.history.pushState({}, '', '/dashboard?page=3');
            jest.runAllTimers();
            expect(logEvent).toHaveBeenCalledTimes(1);
            expect(logEvent.mock.calls[0][0].data.page).toBe('3');
        });

        it('should patch pushState/replaceState and register listeners', () => {
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

            const tracker = createTracker();
            tracker.init();

            expect(window.history.pushState).not.toBe(NATIVE_PUSH_STATE);
            expect(window.history.replaceState).not.toBe(NATIVE_REPLACE_STATE);
            expect(addEventListenerSpy).toHaveBeenCalledWith(
                'popstate',
                expect.any(Function)
            );
            expect(addEventListenerSpy).not.toHaveBeenCalledWith(
                'hashchange',
                expect.any(Function)
            );
        });

        // Q9.4 - Double init() patches only once without stacking (idempotency).
        it('should tear down first on a second init(), not stacking wrappers', () => {
            const tracker = createTracker();
            tracker.init();
            const firstWrapper = window.history.pushState;

            tracker.init();

            // After teardown-first + re-patch, the installed wrapper is a fresh
            // one wrapping the native method, never a wrapper wrapping a wrapper.
            expect(window.history.pushState).not.toBe(firstWrapper);

            // Proof that the second patch captured the native method and not the
            // first wrapper: tearing down leaves history exactly as it started.
            tracker.teardown();
            expect(window.history.pushState).toBe(NATIVE_PUSH_STATE);
        });

        // Q9.5 - A second wrapper/instance already present skips patching.
        it('should not wrap history that another wrapper already owns', () => {
            const foreignWrapper = markedForeignWrapper();
            window.history.pushState = foreignWrapper;

            const tracker = createTracker();
            tracker.init();

            expect(window.history.pushState).toBe(foreignWrapper);
            expect(verbose).toHaveBeenCalledWith(
                expect.stringContaining('already wrapped')
            );

            // Having declined to patch, teardown must not clobber the wrapper it
            // never owned.
            tracker.teardown();
            expect(window.history.pushState).toBe(foreignWrapper);
        });

        it('should mark its wrapper as non-enumerable', () => {
            const tracker = createTracker();
            tracker.init();

            const wrapper = window.history.pushState as History['pushState'] &
                Record<string, unknown>;
            expect(wrapper[WRAPPED_MARKER]).toBe(true);
            expect(Object.keys(wrapper)).not.toContain(WRAPPED_MARKER);
        });

        // Q9.8 - Frozen/sealed history throws on assignment, rolls back, and
        // init() doesn't escape while listeners still get added.
        it('should still listen for popstate when history cannot be patched', () => {
            // Make pushState non-writable so assignment throws in strict mode.
            Object.defineProperty(window.history, 'pushState', {
                value: NATIVE_PUSH_STATE,
                writable: false,
                configurable: true,
            });
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

            const tracker = createTracker();

            try {
                expect(() => tracker.init()).not.toThrow();

                // Assignment failed, so the native method is left in place...
                expect(window.history.pushState).toBe(NATIVE_PUSH_STATE);

                // ...but the navigation listener is still registered, so
                // back/forward navigation is still tracked.
                expect(addEventListenerSpy).toHaveBeenCalledWith(
                    'popstate',
                    expect.any(Function)
                );

                navigateNatively('/popstate-only');
                window.dispatchEvent(new PopStateEvent('popstate'));
                jest.runAllTimers();
                expect(loggedPaths()).toEqual(['/popstate-only']);

                expect(() => tracker.teardown()).not.toThrow();
            } finally {
                // Restore writability so afterEach can reset.
                Object.defineProperty(window.history, 'pushState', {
                    value: NATIVE_PUSH_STATE,
                    writable: true,
                    configurable: true,
                });
            }
        });
    });

    describe('configured additional query params', () => {
        // Mirrors production: the raw comma-separated string is parsed ONCE, by
        // processFlags, and the flag holds the whole IQueryParamAllowlist. The
        // tracker never sees the raw string, so neither does this test.
        //
        // That distinction is load-bearing rather than pedantic. These tests used to
        // mock getFeatureFlag with the raw string, which let the tracker re-parse it
        // and made the rejection warning look alive when in production it received
        // an already-clean list and could never fire.
        const initWith = (configured: string | undefined): PageViewTracker => {
            const parsed = parseQueryParamAllowlist(configured);

            getFeatureFlag.mockImplementation((flag: string) =>
                flag === Constants.FeatureFlags.AutoLogPageViewQueryParams
                    ? parsed
                    : undefined
            );

            const tracker = createTracker();
            tracker.init();
            return tracker;
        };

        it('should capture a configured param on a page view', () => {
            navigateNatively('/');
            initWith('promo_code');

            window.history.pushState({}, '', '/promo?promo_code=SAVE20');
            jest.runAllTimers();

            expect(logEvent.mock.calls[0][0].data).toMatchObject({
                path: '/promo',
                promo_code: 'SAVE20',
            });
        });

        // Without the flag the param is not on the allowlist, so it is neither
        // captured nor part of the dedup key.
        it('should ignore the param when nothing is configured', () => {
            navigateNatively('/');
            initWith(undefined);

            window.history.pushState({}, '', '/promo?promo_code=SAVE20');
            jest.runAllTimers();

            expect(logEvent.mock.calls[0][0].data.promo_code).toBeUndefined();
        });

        // A configured param joins the dedup key, so changing it is a new page.
        it('should fire a view when a configured param changes', () => {
            navigateNatively('/list?promo_code=A');
            initWith('promo_code');

            window.history.pushState({}, '', '/list?promo_code=B');
            jest.runAllTimers();

            expect(logEvent).toHaveBeenCalledTimes(1);
            expect(logEvent.mock.calls[0][0].data.promo_code).toBe('B');
        });

        it('should warn with positions for what it rejected, never text', () => {
            navigateNatively('/');
            initWith('promo_code, bad name, affiliate_id, password=hunter2');

            expect(warning).toHaveBeenCalledTimes(1);
            const [message] = warning.mock.calls[0];

            // Enough to identify which entries were dropped...
            expect(message).toContain('positions 2, 4');
            // ...and none of the customer's text, valid or otherwise.
            expect(message).not.toContain('hunter2');
            expect(message).not.toContain('password');
            expect(message).not.toContain('bad');
            expect(message).not.toContain('promo_code');
        });

        // The whole point of F5's fix: processFlags validates, the tracker reports.
        // If the tracker re-parsed the clean list it was handed, this could not fire.
        it('should warn about entries dropped past the cap', () => {
            navigateNatively('/');
            initWith(
                Array.from(
                    { length: MAX_CUSTOM_QUERY_PARAMS + 3 },
                    (_unused, i) => `p${i}`
                ).join(',')
            );

            expect(warning).toHaveBeenCalledTimes(1);
            expect(warning.mock.calls[0][0]).toContain(
                `ignoring 3 additional page view query parameters beyond the limit of ${MAX_CUSTOM_QUERY_PARAMS}`
            );
        });

        it('should not warn when every configured name is valid', () => {
            navigateNatively('/');
            initWith('promo_code, affiliate_id');

            expect(warning).not.toHaveBeenCalled();
        });

        // A hand-mutated or absent flag must not throw on the init path.
        it.each([undefined, null, 'promo_code', []])(
            'should tolerate a flag value of %p',
            value => {
                navigateNatively('/');
                getFeatureFlag.mockReturnValue(value);

                expect(() => createTracker().init()).not.toThrow();
                expect(warning).not.toHaveBeenCalled();
            }
        );
    });

    describe('navigation detection', () => {
        let tracker: PageViewTracker;

        beforeEach(() => {
            navigateNatively('/');
            tracker = createTracker();
            tracker.init();
        });

        // Q9.1 - Same-path replaceState should not fire a view (dedup).
        // Q9.9 - Landing page isn't double-logged after the init-time view.
        it('should not fire a page view when the path is unchanged', () => {
            window.history.replaceState({}, '', '/');
            jest.runAllTimers();

            expect(logEvent).not.toHaveBeenCalled();
        });

        // Dedup keys on the pathname plus the allowlisted params, so a change
        // confined to a param we do not capture is the same page.
        it('should not fire a view on an unallowlisted query-param change', () => {
            window.history.pushState({}, '', '/?tab=settings');
            jest.runAllTimers();

            expect(logEvent).not.toHaveBeenCalled();
        });

        // The counterpart: an allowlisted param IS part of the key, which is what
        // makes pagination and search navigations visible at all.
        it('should fire a view on an allowlisted query-param change', () => {
            window.history.pushState({}, '', '/?q=shoes');
            jest.runAllTimers();

            expect(logEvent).toHaveBeenCalledTimes(1);

            window.history.pushState({}, '', '/?q=boots');
            jest.runAllTimers();

            expect(logEvent).toHaveBeenCalledTimes(2);
            expect(
                logEvent.mock.calls.map(([event]) => event.data.q)
            ).toEqual(['shoes', 'boots']);
        });

        // Hash support is deferred to a follow-up; a hash-only change leaves the
        // pathname unchanged and does not fire.
        it('should not fire a view on a hash-only change', () => {
            window.history.pushState({}, '', '/#/details');
            jest.runAllTimers();

            expect(logEvent).not.toHaveBeenCalled();
        });

        // Q9.3 - A real path change produces one deferred view after flush.
        it('should defer the page view until the timer flushes', () => {
            window.history.pushState({}, '', '/products');

            // Deferred: nothing fires synchronously.
            expect(logEvent).not.toHaveBeenCalled();

            jest.runAllTimers();
            expect(logEvent).toHaveBeenCalledTimes(1);
        });

        // The accepted path is recorded synchronously, so a return trip to the
        // previous URL in the same tick is a fresh page view rather than a dedup.
        it('should record the accepted path before the deferred fire', () => {
            window.history.pushState({}, '', '/products');
            window.history.pushState({}, '', '/');
            jest.runAllTimers();

            expect(loggedPaths()).toEqual(['/products', '/']);
        });

        it('should fire a view on popstate navigation', () => {
            navigateNatively('/back-target');
            window.dispatchEvent(new PopStateEvent('popstate'));
            jest.runAllTimers();

            expect(logEvent).toHaveBeenCalledTimes(1);
        });

        // Hash support is deferred to a follow-up: the tracker no longer listens
        // for hashchange, so a hash-route navigation does not fire.
        it('should not fire a view on hashchange navigation', () => {
            navigateNatively('/#/new-hash');
            window.dispatchEvent(new HashChangeEvent('hashchange'));
            jest.runAllTimers();

            expect(logEvent).not.toHaveBeenCalled();
        });

        it('should fire a view via replaceState when the path changes', () => {
            window.history.replaceState({}, '', '/replaced');
            jest.runAllTimers();

            expect(logEvent).toHaveBeenCalledTimes(1);
        });
    });

    // Q9.10 - Rapid same-tick /a -> /b -> /c fires two events.
    describe('rapid same-tick navigation', () => {
        it('should fire one view per accepted change', () => {
            navigateNatively('/a');
            const tracker = createTracker();
            tracker.init(); // seeds the current page as '/a'

            window.history.pushState({}, '', '/b');
            window.history.pushState({}, '', '/c');

            jest.runAllTimers();

            // /a is the seed; /b and /c are the two accepted changes.
            expect(logEvent).toHaveBeenCalledTimes(2);
        });

        // Each deferred fire must carry the path captured when its navigation
        // was accepted, not the final live location. Before the fix both fires
        // read window.location at flush time and both reported '/c'.
        it('should record each intermediate path, not the final URL', () => {
            navigateNatively('/a');
            const tracker = createTracker();
            tracker.init();

            window.history.pushState({}, '', '/b');
            window.history.pushState({}, '', '/c');

            jest.runAllTimers();

            expect(loggedPaths()).toEqual(['/b', '/c']);
        });
    });

    describe('page view payload', () => {
        it('should fire a PageView event carrying path, title, and hostname', () => {
            navigateNatively('/');
            const tracker = createTracker();
            tracker.init();

            window.document.title = 'Next Page';
            window.history.pushState({}, '', '/next?tab=1#top');
            jest.runAllTimers();

            expect(logEvent).toHaveBeenCalledTimes(1);
            const [event] = logEvent.mock.calls[0];
            expect(event).toEqual({
                messageType: MessageType.PageView,
                name: 'PageView',
                eventType: EventType.Unknown,
                data: {
                    hostname: 'localhost',
                    title: 'Next Page',
                    path: '/next',
                },
            });
        });

        it('should attach the allowlisted query params as flat attributes', () => {
            navigateNatively('/');
            const tracker = createTracker();
            tracker.init();

            window.document.title = 'Landing';
            window.history.pushState(
                {},
                '',
                '/promo?page=2&q=boots&ref=google&session_token=secret#top'
            );
            jest.runAllTimers();

            expect(logEvent.mock.calls[0][0].data).toEqual({
                hostname: 'localhost',
                title: 'Landing',
                path: '/promo',
                page: '2',
                q: 'boots',
                ref: 'google',
            });
        });

        // Each deferred fire carries the params captured when its navigation was
        // accepted, for the same reason as the path: a same-tick navigation would
        // otherwise overwrite window.location before the flush reads it.
        it('should capture the params at navigation time, not flush time', () => {
            navigateNatively('/a');
            const tracker = createTracker();
            tracker.init();

            window.history.pushState({}, '', '/b?ref=first');
            window.history.pushState({}, '', '/c?ref=second');

            jest.runAllTimers();

            expect(
                logEvent.mock.calls.map(([event]) => event.data.ref)
            ).toEqual(['first', 'second']);
        });

        // Verbose logging goes to the console, and session-replay tooling ships
        // console output off-domain. Param names are useful for debugging dedup;
        // the values are not worth the exposure.
        it('should log param names but never their values', () => {
            navigateNatively('/');
            const tracker = createTracker();
            tracker.init();

            window.history.pushState({}, '', '/search?q=SECRET-SEARCH-TERM');
            jest.runAllTimers();

            const logged = verbose.mock.calls.map(([message]) => message).join('\n');

            expect(logged).toContain('q');
            expect(logged).not.toContain('SECRET-SEARCH-TERM');
        });

        // The title is read at flush time, not when the navigation is accepted,
        // so a router that sets document.title during its render commit is
        // reflected in the event.
        it('should read the title at flush time, not at navigation time', () => {
            navigateNatively('/');
            const tracker = createTracker();
            tracker.init();

            window.document.title = 'Before Render';
            window.history.pushState({}, '', '/next');
            window.document.title = 'After Render';

            jest.runAllTimers();

            expect(logEvent.mock.calls[0][0].data.title).toBe('After Render');
        });
    });

    describe('deferred fire behavior', () => {
        let tracker: PageViewTracker;

        beforeEach(() => {
            navigateNatively('/');
            tracker = createTracker();
            tracker.init();
        });

        // Q9.11 - Navigation triggers resetSessionTimer() to renew the session.
        it('should call resetSessionTimer before logging the page view', () => {
            const callOrder: string[] = [];
            resetSessionTimer.mockImplementation(() =>
                callOrder.push('resetSessionTimer')
            );
            logEvent.mockImplementation(() => callOrder.push('logEvent'));

            window.history.pushState({}, '', '/next');
            jest.runAllTimers();

            expect(callOrder).toEqual(['resetSessionTimer', 'logEvent']);
        });

        it('should abort a queued fire if torn down before the timer flushes', () => {
            window.history.pushState({}, '', '/pending');

            // Tear down before the deferred callback runs.
            tracker.teardown();
            jest.runAllTimers();

            expect(logEvent).not.toHaveBeenCalled();
            expect(resetSessionTimer).not.toHaveBeenCalled();
        });

        // The navigation handler runs inside the host page's own pushState call,
        // so a throwing collaborator must never propagate into the router.
        it('should isolate errors from the navigation handler', () => {
            verbose.mockImplementationOnce(() => {
                throw new Error('boom');
            });

            expect(() =>
                window.history.pushState({}, '', '/explode')
            ).not.toThrow();
            expect(window.location.pathname).toBe('/explode');
            expect(verbose).toHaveBeenCalledWith(
                expect.stringContaining('navigation handler threw')
            );
        });
    });

    describe('#teardown', () => {
        // Q9.6 - After init() then teardown, the original is restored when
        // still our wrapper.
        it('should restore native history methods and remove listeners', () => {
            const removeEventListenerSpy = jest.spyOn(
                window,
                'removeEventListener'
            );

            const tracker = createTracker();
            tracker.init();
            tracker.teardown();

            expect(window.history.pushState).toBe(NATIVE_PUSH_STATE);
            expect(window.history.replaceState).toBe(NATIVE_REPLACE_STATE);
            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                'popstate',
                expect.any(Function)
            );
            expect(tracker.isActive).toBe(false);
        });

        // Q9.7 - Teardown with another wrapper on top leaves the original in
        // place but still removes listeners.
        it('should leave a foreign wrapper in place but still clean up', () => {
            const removeEventListenerSpy = jest.spyOn(
                window,
                'removeEventListener'
            );

            const tracker = createTracker();
            tracker.init();

            // A third party patches pushState on top of ours after init.
            const foreignWrapper = unmarkedForeignWrapper();
            window.history.pushState = foreignWrapper;

            tracker.teardown();

            // Our wrapper is no longer installed, so we must not clobber the
            // foreign one by restoring the native method. replaceState was never
            // touched by them, so it still comes back.
            expect(window.history.pushState).toBe(foreignWrapper);
            expect(window.history.replaceState).toBe(NATIVE_REPLACE_STATE);
            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                'popstate',
                expect.any(Function)
            );
            expect(tracker.isActive).toBe(false);
        });

        it('should deregister itself', () => {
            const tracker = createTracker();
            tracker.init();
            expect(getActiveTracker()).toBe(tracker);

            tracker.teardown();

            expect(getActiveTracker()).toBeUndefined();
        });

        it('should be safe to call before init()', () => {
            const tracker = createTracker();
            expect(() => tracker.teardown()).not.toThrow();
            expect(tracker.isActive).toBe(false);
        });

        it('should be safe to call twice', () => {
            const tracker = createTracker();
            tracker.init();
            tracker.teardown();

            expect(() => tracker.teardown()).not.toThrow();
            expect(window.history.pushState).toBe(NATIVE_PUSH_STATE);
        });

        // Teardown can only restore a history method that is still ours. If a
        // third party wrapped *our* wrapper, ours stays reachable and keeps being
        // called after teardown — an orphaned wrapper attached to a dead tracker.
        //
        // No event fires either way (the deferred flush aborts when inactive), so
        // this asserts the stronger property: a dead tracker does no work at all.
        // Without the guard it still walks the dedup path and queues a timer just
        // to throw the result away.
        it('should do no work when an orphaned wrapper still calls in', () => {
            navigateNatively('/');
            const tracker = createTracker();
            tracker.init();

            // A third party wraps ours, delegating to it.
            const ourWrapper = window.history.pushState;
            window.history.pushState = function(
                this: History,
                ...args: Parameters<History['pushState']>
            ): void {
                return ourWrapper.apply(this, args);
            } as History['pushState'];

            tracker.teardown();
            verbose.mockClear();

            window.history.pushState({}, '', '/orphaned');
            jest.runAllTimers();

            expect(logEvent).not.toHaveBeenCalled();
            expect(resetSessionTimer).not.toHaveBeenCalled();
            // Bailed before the dedup path, so nothing was accepted or deferred.
            expect(verbose).not.toHaveBeenCalledWith(
                expect.stringContaining('[accept]')
            );
            expect(verbose).not.toHaveBeenCalledWith(
                expect.stringContaining('[defer]')
            );
        });

        it('should stop firing page views after teardown', () => {
            const tracker = createTracker();
            tracker.init();
            tracker.teardown();

            // Navigate via the (now restored) native method + event.
            navigateNatively('/after-teardown');
            window.dispatchEvent(new PopStateEvent('popstate'));
            jest.runAllTimers();

            expect(logEvent).not.toHaveBeenCalled();
        });
    });

    // Regression: Next.js re-evaluates the SDK module on each SPA navigation,
    // resetting all module-level state. Each fresh module creates a new
    // PageViewTracker and calls init(). Without the registry handoff, each
    // init() stacks a new pushState wrapper on top of the previous one and fires
    // N page views per navigation after N module loads.
    describe('handoff between module loads', () => {
        it('should retire the tracker left by a previous module load', () => {
            // Simulate a tracker left behind by a previous module load: the old
            // module is gone, so the only handle to it is the registry.
            const staleTracker = createTracker();
            staleTracker.init();

            const newTracker = createTracker();
            newTracker.init();

            expect(staleTracker.isActive).toBe(false);
            expect(newTracker.isActive).toBe(true);
            expect(getActiveTracker()).toBe(newTracker);
        });

        it('should not fire duplicate page views after a module re-evaluation', () => {
            const trackerA = createTracker();
            trackerA.init();

            const trackerB = createTracker();
            trackerB.init();

            // One navigation should produce exactly one page view.
            window.history.pushState({}, '', '/next');
            jest.runAllTimers();

            expect(logEvent).toHaveBeenCalledTimes(1);
        });

        // Regression: a navigation queued by the stale tracker (setTimeout not
        // yet flushed) must be transferred to the replacement tracker so it is
        // not silently dropped on module re-evaluation.
        it('should transfer a pending page view from the retired tracker', () => {
            const staleTracker = createTracker();
            staleTracker.init(); // seeds the current page as '/'

            // Route change detected by the stale tracker — deferred fire queued,
            // timer not yet flushed.
            window.history.pushState({}, '', '/route-a');

            // Module re-evaluation: the new tracker inherits the pending
            // navigation and retires the stale one.
            const newTracker = createTracker();
            newTracker.init();

            jest.runAllTimers();
            expect(loggedPaths()).toEqual(['/route-a']);

            // A subsequent navigation from the new tracker fires as normal.
            logEvent.mockClear();
            window.history.pushState({}, '', '/route-b');
            jest.runAllTimers();
            expect(loggedPaths()).toEqual(['/route-b']);
        });

        // Regression: same-instance re-init (e.g. a SPA framework calling
        // mParticle.init() on navigation) must not drop a page view queued
        // before the re-init call.
        it('should preserve a pending page view when the same tracker re-inits', () => {
            const tracker = createTracker();
            tracker.init(); // seeds the current page as '/'

            // Route change queues a deferred fire — timer not yet flushed.
            window.history.pushState({}, '', '/about');

            // SPA framework calls mParticle.init() again before the timer fires.
            tracker.init();

            jest.runAllTimers();
            expect(loggedPaths()).toEqual(['/about']);
        });
    });

    describe('window-scoped state', () => {
        it('should not report an initial page view before one is marked', () => {
            expect(hasInitialPageViewFired()).toBe(false);
        });

        it('should report the initial page view once marked', () => {
            markInitialPageViewFired();
            expect(hasInitialPageViewFired()).toBe(true);
        });

        it('should clear the tracker and the initial page view flag on reset', () => {
            const tracker = createTracker();
            tracker.init();
            markInitialPageViewFired();

            resetPageViewTracking();

            expect(tracker.isActive).toBe(false);
            expect(getActiveTracker()).toBeUndefined();
            expect(hasInitialPageViewFired()).toBe(false);
            expect(window.history.pushState).toBe(NATIVE_PUSH_STATE);
        });

        it('should be safe to reset when nothing is tracking', () => {
            expect(() => resetPageViewTracking()).not.toThrow();
        });

        // The window key is a debugging contract: `window.__mpApv__` is what you
        // inspect in a console to see whether APV is live. Renaming it silently
        // breaks that, so pin the literal and the shape.
        it('should expose all its state under one documented window key', () => {
            const tracker = createTracker();
            tracker.init();
            markInitialPageViewFired();

            expect(WIN_APV_KEY).toBe('__mpApv__');
            expect((window as any).__mpApv__).toEqual({
                tracker,
                initialPageViewFired: true,
            });
        });

        // The point of one object over two loose keys: reset is a single
        // reassignment, so there is no ordering in which half the state survives.
        it('should replace the whole state object on reset', () => {
            const tracker = createTracker();
            tracker.init();
            markInitialPageViewFired();
            const before = (window as any).__mpApv__;

            resetPageViewTracking();

            const after = (window as any).__mpApv__;
            expect(after).not.toBe(before);
            expect(after).toEqual({
                tracker: undefined,
                initialPageViewFired: false,
            });
        });
    });
});
