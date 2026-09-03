import IntegrationCapture, {
    facebookClickIdProcessor,
} from '../../src/integrationCapture';
import { deleteAllCookies } from './utils';

type FullCaptureSetup = {
    url: string;
    cookies?: string[];
    localStorage?: Record<string, string>;
    mockNow?: number;
};

/** Sets location from URL, optional cookies/localStorage, runs IntegrationCapture('all').capture(). */
function clickIdsAfterFullCaptureAllMode(setup: FullCaptureSetup): Record<string, string> {
    const { url, cookies, localStorage: ls, mockNow } = setup;
    if (mockNow !== undefined) {
        jest.spyOn(Date, 'now').mockImplementation(() => mockNow);
    }
    const urlObj = new URL(url);
    cookies?.forEach((c) => {
        window.document.cookie = c;
    });
    if (ls) {
        for (const [key, val] of Object.entries(ls)) {
            window.localStorage.setItem(key, val);
        }
    }
    window.location.href = urlObj.href;
    window.location.search = urlObj.search;
    const integrationCapture = new IntegrationCapture('all');
    integrationCapture.capture();
    return integrationCapture.clickIds ?? {};
}

describe('Integration Capture', () => {
    describe('constructor', () => {
        it('should initialize with clickIds as undefined', () => {
            const integrationCapture = new IntegrationCapture('all');
            expect(integrationCapture.clickIds).toBeUndefined();
        });

        it('should initialize with a filtered list of partner identity mappings', () => {
            const integrationCapture = new IntegrationCapture('all');
            const mappings = integrationCapture.filteredPartnerIdentityMappings;
            expect(Object.keys(mappings)).toEqual(['_ttp']);
        });

        it('should initialize with a filtered list of custom flag mappings', () => {
            const integrationCapture = new IntegrationCapture('all');
            const mappings = integrationCapture.filteredCustomFlagMappings;
            expect(Object.keys(mappings)).toEqual([
                'fbclid',
                '_fbp',
                '_fbc',
                'gclid',
                'gbraid',
                'wbraid',
                'ttclid',
                'ScCid',
                'epik',
                '_epik',
                '_scid'
            ]);
        });

        it('should initialize with a filtered list of integration attribute mappings', () => {
            const integrationCapture = new IntegrationCapture('all');
            const mappings = integrationCapture.filteredIntegrationAttributeMappings;
            expect(Object.keys(mappings)).toEqual([
                'rtid',
                'rclid', 
                'RoktTransactionId'
            ]);
        });

        it('should initialize with a filtered list of integration attribute mappings for roktonly', () => {
            const integrationCapture = new IntegrationCapture('roktonly');
            const mappings = integrationCapture.filteredIntegrationAttributeMappings;
            const expectedKeys = ['rtid', 'rclid', 'RoktTransactionId'];
            expect(Object.keys(mappings).sort()).toEqual([...expectedKeys].sort());
            const excludedKeys = [
                'fbclid',
                '_fbp',
                '_fbc',
                'gclid',
                'gbraid',
                'wbraid',
                'ttclid',
                'ScCid',
                '_scid',
            ];
            for (const key of excludedKeys) {
                expect(mappings).not.toHaveProperty(key);
            }
        });
    });

    describe('capture V2 modes gating in helpers', () => {
        const originalLocation = window.location as any;

        beforeEach(() => {
            delete (window as any).location;
            (window as any).location = { href: 'https://www.example.com/', search: '' } as any;
            deleteAllCookies();
            window.localStorage.clear();
            jest.restoreAllMocks();
        });

        afterEach(() => {
            window.location = originalLocation;
            deleteAllCookies();
            window.localStorage.clear();
        });

        const V2_MODE_HELPER_CASES: Array<{
            title: string;
            captureMode: 'roktonly' | 'all' | 'none';
            url: string;
            cookies: string[];
            mockNow?: number;
            expectQuery: Record<string, unknown>;
            expectCookies: Record<string, unknown>;
            expectLocalStorage: Record<string, string>;
        }> = [
            {
                title: 'should return only Rokt keys from helpers when captureMode is roktonly (lowercase)',
                captureMode: 'roktonly',
                url: 'https://www.example.com/?fbclid=abc&gclid=g1&rtid=rt1&rclid=rc1',
                cookies: ['_fbp=54321', 'RoktTransactionId=xyz'],
                expectQuery: { rtid: 'rt1', rclid: 'rc1' },
                expectCookies: { RoktTransactionId: 'xyz' },
                expectLocalStorage: { RoktTransactionId: 'ls-rok' },
            },
            {
                title: 'should return all mapped keys from helpers when captureMode is all (lowercase)',
                captureMode: 'all',
                url: 'https://www.example.com/?fbclid=abc&gclid=g1&rtid=rt1&rclid=rc1&ScCid=snap1',
                cookies: [
                    '_fbp=54321',
                    '_fbc=fb.1.1554763741205.abcdef',
                    'RoktTransactionId=xyz',
                ],
                mockNow: 42,
                expectQuery: {
                    fbclid: 'fb.2.42.abc',
                    gclid: 'g1',
                    rtid: 'rt1',
                    rclid: 'rc1',
                    ScCid: 'snap1',
                },
                expectCookies: {
                    _fbp: '54321',
                    _fbc: 'fb.1.1554763741205.abcdef',
                    RoktTransactionId: 'xyz',
                },
                expectLocalStorage: { RoktTransactionId: 'ls-rok' },
            },
            {
                title: 'should NOT return mapped keys from helpers when captureMode is none (lowercase)',
                captureMode: 'none',
                url: 'https://www.example.com/?fbclid=abc&gclid=g1&rtid=rt1&rclid=rc1&ScCid=snap1',
                cookies: [
                    '_fbp=54321',
                    '_fbc=fb.1.1554763741205.abcdef',
                    'RoktTransactionId=xyz',
                ],
                mockNow: 42,
                expectQuery: {},
                expectCookies: {},
                expectLocalStorage: {},
            },
        ];

        V2_MODE_HELPER_CASES.forEach(
            ({
                title,
                captureMode,
                url,
                cookies,
                mockNow,
                expectQuery,
                expectCookies,
                expectLocalStorage,
            }) => {
                it(title, () => {
                    if (mockNow !== undefined) {
                        jest.spyOn(Date, 'now').mockImplementation(() => mockNow);
                    }
                    const urlObj = new URL(url);
                    window.location.href = urlObj.href;
                    window.location.search = urlObj.search;
                    cookies.forEach((c) => {
                        document.cookie = c;
                    });
                    window.localStorage.setItem('RoktTransactionId', 'ls-rok');

                    const integrationCapture = new IntegrationCapture(captureMode);

                    const clickIds = integrationCapture.captureQueryParams();
                    const clickIdCookies = integrationCapture.captureCookies();
                    const clickIdLocalStorage = integrationCapture.captureLocalStorage();

                    expect(clickIds).toMatchObject(expectQuery);
                    expect(clickIdCookies).toMatchObject(expectCookies);
                    expect(clickIdLocalStorage).toEqual(expectLocalStorage);
                });
            },
        );
    });

    describe('#capture', () => {
        const originalLocation = window.location;

        beforeEach(() => {
            delete (window as any).location;
            (window as any).location = {
                href: '',
                search: '',
                assign: jest.fn(),
                replace: jest.fn(),
                reload: jest.fn(),
            };

            deleteAllCookies();
        });

        afterEach(() => {
            window.location = originalLocation;
            window.localStorage.clear();
            jest.restoreAllMocks();
        });

        it('should call captureCookies and captureQueryParams', () => {
            const integrationCapture = new IntegrationCapture('all');
            integrationCapture.captureCookies = jest.fn();
            integrationCapture.captureQueryParams = jest.fn();
            integrationCapture.capture();

            expect(integrationCapture.captureCookies).toHaveBeenCalled();
            expect(integrationCapture.captureQueryParams).toHaveBeenCalled();
        });

        it('should pass all clickIds to clickIds object', () => {
            jest.spyOn(Date, 'now').mockImplementation(() => 42);

            const queryParams = [
                'fbclid=12345',
                'gclid=54321',
                'gbraid=67890',
                'wbraid=09876',
                'rtid=84324',
                'rclid=7183717',
                'ScCid=1234'
            ].join('&');

            const url = new URL(`https://www.example.com/?${queryParams}`);

            window.document.cookie = '_cookie1=1234';
            window.document.cookie = '_cookie2=39895811.9165333198';
            window.document.cookie = '_fbp=54321';
            window.document.cookie = 'baz=qux';

            window.location.href = url.href;
            window.location.search = url.search;

            const integrationCapture = new IntegrationCapture('all');
            integrationCapture.capture();

            expect(integrationCapture.clickIds).toEqual({
                fbclid: 'fb.2.42.12345',
                _fbp: '54321',
                gclid: '54321',
                gbraid: '67890',
                rtid: '84324',
                rclid: '7183717',
                wbraid: '09876',
                ScCid:'1234'
            }); 
        });

        describe('Google Click Ids', () => {
            it('should capture Google specific click ids', () => {
                expect(
                    clickIdsAfterFullCaptureAllMode({
                        url: 'https://www.example.com/?gclid=54321&gbraid=67890&wbraid=09876',
                    }),
                ).toEqual({
                    gclid: '54321',
                    gbraid: '67890',
                    wbraid: '09876',
                });
            });
        });

        describe('SnapChat Click Ids', () => {
            const SNAPCHAT_FULL_CAPTURE: Array<{
                title: string;
                setup: FullCaptureSetup;
                expected: Record<string, string>;
            }> = [
                {
                    title: 'should capture Snapchat specific click ids',
                    setup: { url: 'https://www.example.com/?ScCid=1234' },
                    expected: { ScCid: '1234' },
                },
                {
                    title: 'should capture Snapchat specific click ids without being case sensitive',
                    setup: { url: 'https://www.example.com/?sccid=1234' },
                    expected: { ScCid: '1234' },
                },
                {
                    title: 'should capture _scid from cookies',
                    setup: {
                        url: 'https://www.example.com/',
                        cookies: [
                            '_scid=cookie1-from-cookie',
                            '_cookie1=4567',
                            'baz=qux',
                        ],
                    },
                    expected: { _scid: 'cookie1-from-cookie' },
                },
                {
                    title: 'should capture both ScCid from query params and _scid from cookies',
                    setup: {
                        url: 'https://www.example.com/?ScCid=4567',
                        cookies: ['_scid=cookie1-from-cookie', '_cookie1=334455'],
                    },
                    expected: {
                        ScCid: '4567',
                        _scid: 'cookie1-from-cookie',
                    },
                },
            ];

            SNAPCHAT_FULL_CAPTURE.forEach(({ title, setup, expected }) => {
                it(title, () => {
                    expect(clickIdsAfterFullCaptureAllMode(setup)).toEqual(expected);
                });
            });
        });

        describe('Pinterest Click Ids', () => {
            const PINTEREST_FULL_CAPTURE: Array<{
                title: string;
                setup: FullCaptureSetup;
                expected: Record<string, string>;
            }> = [
                {
                    title: 'should capture Pinterest specific click ids from query params (_epik)',
                    setup: { url: 'https://www.example.com/?_epik=1234' },
                    expected: { _epik: '1234' },
                },
                {
                    title: 'should capture Pinterest specific click ids from query params (epik)',
                    setup: { url: 'https://www.example.com/?epik=5678' },
                    expected: { epik: '5678' },
                },
                {
                    title: 'should capture Pinterest specific click ids from cookies (_epik)',
                    setup: {
                        url: 'https://www.example.com/',
                        cookies: ['_epik=pinterest_cookie_value'],
                    },
                    expected: { _epik: 'pinterest_cookie_value' },
                },
                {
                    title: 'should capture Pinterest specific click ids from cookies (epik)',
                    setup: {
                        url: 'https://www.example.com/',
                        cookies: ['epik=pinterest_cookie_value_epik'],
                    },
                    expected: { epik: 'pinterest_cookie_value_epik' },
                },
                {
                    title: 'should capture Pinterest specific click ids from localStorage (_epik)',
                    setup: {
                        url: 'https://www.example.com/',
                        localStorage: { _epik: 'pinterest_localstorage_value' },
                    },
                    expected: { _epik: 'pinterest_localstorage_value' },
                },
                {
                    title: 'should capture Pinterest specific click ids from localStorage (epik)',
                    setup: {
                        url: 'https://www.example.com/',
                        localStorage: { epik: 'pinterest_localstorage_value_epik' },
                    },
                    expected: { epik: 'pinterest_localstorage_value_epik' },
                },
                {
                    title: 'should prefer Pinterest query param over cookie when both are present',
                    setup: {
                        url: 'https://www.example.com/?epik=from_query',
                        cookies: ['_epik=from_cookie', 'epik=from_cookie_epik'],
                    },
                    expected: { epik: 'from_query' },
                },
                {
                    title: 'should prefer Pinterest query param over localStorage when both are present',
                    setup: {
                        url: 'https://www.example.com/?_epik=from_query',
                        localStorage: {
                            epik: 'from_ls',
                            _epik: 'from_ls_underscore',
                        },
                    },
                    expected: { _epik: 'from_query' },
                },
                {
                    title: 'should prefer Pinterest localStorage over cookie when both are present',
                    setup: {
                        url: 'https://www.example.com/',
                        cookies: ['epik=from_cookie', '_epik=from_cookie_us'],
                        localStorage: { _epik: 'from_ls' },
                    },
                    expected: { _epik: 'from_ls' },
                },
            ];

            PINTEREST_FULL_CAPTURE.forEach(({ title, setup, expected }) => {
                it(title, () => {
                    expect(clickIdsAfterFullCaptureAllMode(setup)).toEqual(expected);
                });
            });
        });

        describe('Facebook Click Ids', () => {
        it('should format fbclid correctly', () => {
            jest.spyOn(Date, 'now').mockImplementation(() => 42);

            const url = new URL(
                'https://www.example.com/?fbclid=AbCdEfGhIjKlMnOpQrStUvWxYz1234567890'
            );

            window.document.cookie = '_cookie1=1234';
            window.document.cookie = '_cookie2=39895811.9165333198';
            window.document.cookie = 'baz=qux';

            window.location.href = url.href;
            window.location.search = url.search;

            const integrationCapture = new IntegrationCapture('all');
            integrationCapture.capture();

            expect(integrationCapture.clickIds).toEqual({
                fbclid:
                    'fb.2.42.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890',
            });
        });

        it('should pass the _fbc value unaltered', () => {
            const url = new URL('https://www.example.com/?foo=bar');

            window.document.cookie = '_cookie1=1234';
            window.document.cookie = '_cookie2=39895811.9165333198';
            window.document.cookie =
                '_fbc=fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890';
            window.document.cookie = 'baz=qux';

            window.location.href = url.href;
            window.location.search = url.search;

            const integrationCapture = new IntegrationCapture('all');
            integrationCapture.capture();

            expect(integrationCapture.clickIds).toEqual({
                _fbc: 'fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890',
            });
        });

        it('should pass the _fbp value unaltered', () => {
            const url = new URL('https://www.example.com/?foo=bar');

            window.document.cookie = '_cookie1=1234';
            window.document.cookie = '_cookie2=39895811.9165333198';
            window.document.cookie = '_fbp=54321';
            window.document.cookie = 'baz=qux';

            window.location.href = url.href;
            window.location.search = url.search;

            const integrationCapture = new IntegrationCapture('all');
            integrationCapture.capture();

            expect(integrationCapture.clickIds).toEqual({
                _fbp: '54321',
            });
        });

        it('should prioritize fbclid over _fbc', () => {
            jest.spyOn(Date, 'now').mockImplementation(() => 42);

            const url = new URL('https://www.example.com/?fbclid=12345&');

            window.document.cookie = '_cookie1=1234';
            window.document.cookie = '_cookie2=39895811.9165333198';
            window.document.cookie = '_fbc=fb.1.23.654321';
            window.document.cookie = 'baz=qux';

            window.location.href = url.href;
            window.location.search = url.search;

            const integrationCapture = new IntegrationCapture('all');
            integrationCapture.capture();

            expect(integrationCapture.clickIds).toEqual({
                fbclid: 'fb.2.42.12345',
            });
        });
        });

        describe('Rokt Click Ids', () => {
            const ROKT_FULL_CAPTURE: Array<{
                title: string;
                setup: FullCaptureSetup;
                expected: Record<string, string>;
            }> = [
                {
                    title: 'should capture rtid via url param',
                    setup: { url: 'https://www.example.com/?rtid=54321' },
                    expected: { rtid: '54321' },
                },
                {
                    title: 'should capture rclid via url param',
                    setup: { url: 'https://www.example.com/?rclid=7183717' },
                    expected: { rclid: '7183717' },
                },
                {
                    title: 'should capture RoktTransactionId via cookies',
                    setup: {
                        url: 'https://www.example.com/',
                        cookies: ['RoktTransactionId=12345'],
                    },
                    expected: { RoktTransactionId: '12345' },
                },
                {
                    title: 'should capture RoktTransactionId via local storage',
                    setup: {
                        url: 'https://www.example.com/',
                        localStorage: { RoktTransactionId: '54321' },
                        mockNow: 42,
                    },
                    expected: { RoktTransactionId: '54321' },
                },
                {
                    title: 'should prioritize rtid over RoktTransactionId via cookies',
                    setup: {
                        url: 'https://www.example.com/?rtid=54321',
                        cookies: ['RoktTransactionId=12345'],
                        mockNow: 42,
                    },
                    expected: { rtid: '54321' },
                },
                {
                    title: 'should prioritize rclid over RoktTransactionId via cookies',
                    setup: {
                        url: 'https://www.example.com/?rclid=7183717',
                        cookies: ['RoktTransactionId=12345'],
                        mockNow: 42,
                    },
                    expected: { rclid: '7183717' },
                },
                {
                    title: 'should prioritize rtid over RoktTransactionId via local storage',
                    setup: {
                        url: 'https://www.example.com/?rtid=54321',
                        localStorage: { RoktTransactionId: '12345' },
                        mockNow: 42,
                    },
                    expected: { rtid: '54321' },
                },
                {
                    title: 'should prioritize rclid over RoktTransactionId via local storage',
                    setup: {
                        url: 'https://www.example.com/?rclid=7183717',
                        localStorage: { RoktTransactionId: '12345' },
                        mockNow: 42,
                    },
                    expected: { rclid: '7183717' },
                },
                {
                    title: 'should prioritize local storage over cookies',
                    setup: {
                        url: 'https://www.example.com/',
                        cookies: ['RoktTransactionId=67890'],
                        localStorage: { RoktTransactionId: '12345' },
                        mockNow: 42,
                    },
                    expected: { RoktTransactionId: '12345' },
                },
            ];

            ROKT_FULL_CAPTURE.forEach(({ title, setup, expected }) => {
                it(title, () => {
                    expect(clickIdsAfterFullCaptureAllMode(setup)).toEqual(expected);
                });
            });
        });

    });

    describe('#captureQueryParams', () => {
        const originalLocation = window.location;

        beforeEach(() => {
            delete (window as any).location;
            (window as any).location = {
                href: '',
                search: '',
                assign: jest.fn(),
                replace: jest.fn(),
                reload: jest.fn(),
            };
        });

        afterEach(() => {
            window.location = originalLocation;
            jest.restoreAllMocks();
        });

        it('should capture specific query params into clickIds object', () => {
            jest.spyOn(Date, 'now').mockImplementation(() => 42);

            const url = new URL(
                'https://www.example.com/?ttclid=12345&fbclid=67890&gclid=54321&rclid=7183717&rtid=54321'
            );

            window.location.href = url.href;
            window.location.search = url.search;

            const integrationCapture = new IntegrationCapture('all');
            const clickIds = integrationCapture.captureQueryParams();

            expect(clickIds).toEqual({
                fbclid: 'fb.2.42.67890',
                gclid: '54321',
                ttclid: '12345',
                rclid: '7183717',
                rtid: '54321',
            });
        });

        it('should NOT capture query params if they are not mapped', () => {
            const url = new URL(
                'https://www.example.com/?invalidid=12345&foo=bar'
            );

            window.location.href = url.href;
            window.location.search = url.search;

            const integrationCapture = new IntegrationCapture('all');
            const clickIds = integrationCapture.captureQueryParams();
            expect(clickIds).toEqual({});
        });

        it('should format fbclid correctly with the same timestamp on subsequent captures', () => {
            const url = new URL(
                'https://www.example.com/?fbclid=AbCdEfGhIjKlMnOpQrStUvWxYz1234567890'
            ); 

            window.location.href = url.href;
            window.location.search = url.search;

            const integrationCapture = new IntegrationCapture('all');
            integrationCapture.capture();   

            const firstCapture = integrationCapture.captureQueryParams();

            integrationCapture.capture();

            const secondCapture = integrationCapture.captureQueryParams();

            expect(firstCapture).toEqual(secondCapture);
        });
    });

    describe('#captureCookies', () => {
        beforeEach(() => {
            deleteAllCookies();
        });

        it('should capture specific cookies into clickIds object', () => {
            window.document.cookie = '_cookie1=1234';
            window.document.cookie = '_cookie2=39895811.9165333198';
            window.document.cookie = '_fbp=54321';
            window.document.cookie = 'baz=qux';

            const integrationCapture = new IntegrationCapture('all');
            const clickIds = integrationCapture.captureCookies();

            expect(clickIds).toEqual({
                _fbp: '54321',
            });
        });

        it('should capture _scid from cookies', () => {
            window.document.cookie = '_cookie1=4567';
            window.document.cookie = '_scid=cookie1-from-cookie';
            window.document.cookie = 'baz=qux';

            const integrationCapture = new IntegrationCapture('all');
            const clickIds = integrationCapture.captureCookies();

            expect(clickIds).toEqual({
                _scid: 'cookie1-from-cookie',
            });
        });

        it('should NOT capture cookies if they are not mapped', () => {
            window.document.cookie = '_cookie1=1234';
            window.document.cookie = '_cookie2=39895811.9165333198';
            window.document.cookie = 'baz=qux';

            const integrationCapture = new IntegrationCapture('all');
            const clickIds = integrationCapture.captureCookies();

            expect(clickIds).toEqual({});
        });
    });

    describe('#captureLocalStorage', () => {
        beforeEach(() => {
            localStorage.clear();
        });

        it('should capture specific local storage items into clickIds object', () => {
            localStorage.setItem('RoktTransactionId', '12345');

            const integrationCapture = new IntegrationCapture('all');
            const clickIds = integrationCapture.captureLocalStorage();

            expect(clickIds).toEqual({
                RoktTransactionId: '12345',
            });
        });

        it('should NOT capture local storage items if they are not mapped', () => {
            localStorage.setItem('baz', 'qux');

            const integrationCapture = new IntegrationCapture('all');
            const clickIds = integrationCapture.captureLocalStorage();

            expect(clickIds).toEqual({});
        });
    });

    describe('#getClickIdsAsCustomFlags', () => {
        it('should return empty object if clickIds is empty or undefined', () => {
            const integrationCapture = new IntegrationCapture('all');
            const customFlags = integrationCapture.getClickIdsAsCustomFlags();

            expect(customFlags).toEqual({});
        });

        it('should only return mapped clickIds as custom flags', () => {
            const integrationCapture = new IntegrationCapture('all');
            integrationCapture.clickIds = {
                fbclid: '67890',
                _fbp: '54321',
                _ttp: '0823422223.23234',
                ttclid: '12345',
                gclid: '123233.23131',
                epik: 'pinterest123',
                ScCid: '456789',
                _scid: 'cookie1-value',
                invalidId: '12345',
            };

            const customFlags = integrationCapture.getClickIdsAsCustomFlags();

            expect(customFlags).toEqual({
                'Facebook.ClickId': '67890',
                'Facebook.BrowserId': '54321',
                'TikTok.Callback': '12345',
                'GoogleEnhancedConversions.Gclid': '123233.23131',
                'Pinterest.click_id': 'pinterest123',
                'SnapchatConversions.ClickId': '456789',
                'SnapchatConversions.Cookie1': 'cookie1-value',
            });
        });

        it('should map both epik and _epik to Pinterest.click_id', () => {
            const integrationCapture = new IntegrationCapture('all');
            expect(integrationCapture.filteredCustomFlagMappings.epik).toBeDefined();
            expect(integrationCapture.filteredCustomFlagMappings._epik).toBeDefined();

            integrationCapture.clickIds = {
                epik: 'pinterest_epik',
                _epik: 'pinterest_underscore_epik',
            };

            const customFlags = integrationCapture.getClickIdsAsCustomFlags();
            const pinterestClickId = customFlags['Pinterest.click_id'];

            // Same mappedKey: last key wins depends on for-in order; value must be one of the inputs.
            expect(pinterestClickId).toBeDefined();
            expect(['pinterest_epik', 'pinterest_underscore_epik']).toContain(
                pinterestClickId,
            );
        });
    });

    describe('#getClickIdsAsPartnerIdentites', () => {
        it('should return empty object if clickIds is empty or undefined', () => {
            const integrationCapture = new IntegrationCapture('all');
            const partnerIdentities = integrationCapture.getClickIdsAsPartnerIdentities();

            expect(partnerIdentities).toEqual({});
        });

        it('should only return mapped clickIds as partner identities', () => {
            const integrationCapture = new IntegrationCapture('all');
            integrationCapture.clickIds = {
                fbclid: '67890',
                _fbp: '54321',
                ttclid: '12345',
                _ttp: '1234123999.123123',
                gclid: '123233.23131',
                invalidId: '12345',
            };

            const partnerIdentities = integrationCapture.getClickIdsAsPartnerIdentities();

            expect(partnerIdentities).toEqual({
                tiktok_cookie_id: '1234123999.123123',
            });
        });
    });

    describe('#getClickIdsAsIntegrationAttributes', () => {
        it('should return empty object if clickIds is empty or undefined', () => {
            const integrationCapture = new IntegrationCapture('all');
            const integrationAttributes = integrationCapture.getClickIdsAsIntegrationAttributes();

            expect(integrationAttributes).toEqual({});
        });

        it('should only return mapped clickIds as integration attributes', () => {
            const integrationCapture = new IntegrationCapture('all');
            integrationCapture.clickIds = {
                rtid: '12345',
                RoktTransactionId: '54321',
            };

            const integrationAttributes = integrationCapture.getClickIdsAsIntegrationAttributes();

            expect(integrationAttributes).toEqual({
                '1277': {
                    'passbackconversiontrackingid': '12345',
                }
            });
        });
    });

    describe('#facebookClickIdProcessor', () => {
        it('returns a formatted clickId if it is passed in as a partial click id', () => {
            const partialClickId = 'AbCdEfGhIjKlMnOpQrStUvWxYz1234567890';
            const expectedClickId =
                'fb.2.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890';

            expect(
                facebookClickIdProcessor(
                    partialClickId,
                    'https://www.example.com/',
                    1554763741205,
                )
            ).toEqual(expectedClickId);
        });

        it('should start with a prefix of `fb`', () => {
            const url = 'https://example.com/path/to/something';
            expect(facebookClickIdProcessor('AbCdEfGhI', url, 1554763741205)).toMatch(/^fb\./);
        });

        it('should have `1` in the second portion if the host is example.com', () => {
            const url = 'https://example.com/path/to/something';
            const partialClickId = 'AbCdEfGhIjKlMnOpQrStUvWxYz1234567890';

            const expectedClickId = 'fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890';

            expect(facebookClickIdProcessor(partialClickId, url, 1554763741205)).toEqual(
                expectedClickId
            );
        });

        it('should have `2` in the second portion if the host is www.example.com', () => {
            const url = 'https://www.example.com/path/to/something';
            const partialClickId = 'AbCdEfGhIjKlMnOpQrStUvWxYz1234567890';

            const expectedClickId = 'fb.2.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890';

            expect(facebookClickIdProcessor(partialClickId, url, 1554763741205)).toEqual(
                expectedClickId
            );
        });

        it('should have `2` in the second portion if the host is nested subdomains', () => {
            const url = 'https://extra.subdomain.web-3.example.com/path/to/something';
            const partialClickId = 'AbCdEfGhIjKlMnOpQrStUvWxYz1234567890';

            const expectedClickId = 'fb.2.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890';

            expect(facebookClickIdProcessor(partialClickId, url, 1554763741205)).toEqual(
                expectedClickId
            );
        });

        it('returns an empty string if the clickId or url is not valid', () => {
            const expectedClickId = '';

            expect(facebookClickIdProcessor(null, null)).toEqual(expectedClickId);
            expect(facebookClickIdProcessor(undefined, undefined)).toEqual(
                expectedClickId
            );
            expect(facebookClickIdProcessor('', '')).toEqual(expectedClickId);
            expect(
                facebookClickIdProcessor((NaN as unknown) as string, (NaN as unknown) as string)
            ).toEqual(expectedClickId);
            expect(facebookClickIdProcessor((0 as unknown) as string, (0 as unknown) as string)).toEqual(
                expectedClickId
            );
        });
    });
});

