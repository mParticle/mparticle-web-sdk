import IntegrationCapture, {
    facebookClickIdProcessor,
} from '../../src/integrationCapture';
import { deleteAllCookies } from './utils';

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

        it('should return only Rokt keys from helpers when captureMode is roktonly (lowercase)', () => {
            // Query params
            const url = new URL('https://www.example.com/?fbclid=abc&gclid=g1&rtid=rt1&rclid=rc1');
            window.location.href = url.href;
            window.location.search = url.search;

            // Cookies
            document.cookie = '_fbp=54321';
            document.cookie = 'RoktTransactionId=xyz';

            // Local storage
            window.localStorage.setItem('RoktTransactionId', 'ls-rok');

            const integrationCapture = new IntegrationCapture('roktonly');

            const clickIds = integrationCapture.captureQueryParams();
            const clickIdCookies = integrationCapture.captureCookies();
            const clickIdLocalStorage = integrationCapture.captureLocalStorage();

            expect(clickIds).toEqual({ rtid: 'rt1', rclid: 'rc1' });
            expect(clickIdCookies).toEqual({ RoktTransactionId: 'xyz' });
            expect(clickIdLocalStorage).toEqual({ RoktTransactionId: 'ls-rok' });
        });

        it('should return all mapped keys from helpers when captureMode is all (lowercase)', () => {
            jest.spyOn(Date, 'now').mockImplementation(() => 42);
            // Query params
            const url = new URL('https://www.example.com/?fbclid=abc&gclid=g1&rtid=rt1&rclid=rc1&ScCid=snap1');
            window.location.href = url.href;
            window.location.search = url.search;

            // Cookies
            document.cookie = '_fbp=54321';
            document.cookie = '_fbc=fb.1.1554763741205.abcdef';
            document.cookie = 'RoktTransactionId=xyz';

            // Local storage
            window.localStorage.setItem('RoktTransactionId', 'ls-rok');

            const integrationCapture = new IntegrationCapture('all');

            const clickIds = integrationCapture.captureQueryParams();
            const clickIdCookies = integrationCapture.captureCookies();
            const clickIdLocalStorage = integrationCapture.captureLocalStorage();

            // fbclid is formatted with timestamp/domain index
            expect(clickIds).toMatchObject({ fbclid: 'fb.2.42.abc', gclid: 'g1', rtid: 'rt1', rclid: 'rc1', ScCid: 'snap1' });
            expect(clickIdCookies).toMatchObject({ _fbp: '54321', _fbc: 'fb.1.1554763741205.abcdef', RoktTransactionId: 'xyz' });
            expect(clickIdLocalStorage).toEqual({ RoktTransactionId: 'ls-rok' });
        });

        it('should NOT return mapped keys from helpers when captureMode is none (lowercase)', () => {
            jest.spyOn(Date, 'now').mockImplementation(() => 42);
            // Query params
            const url = new URL('https://www.example.com/?fbclid=abc&gclid=g1&rtid=rt1&rclid=rc1&ScCid=snap1');
            window.location.href = url.href;
            window.location.search = url.search;

            // Cookies
            document.cookie = '_fbp=54321';
            document.cookie = '_fbc=fb.1.1554763741205.abcdef';
            document.cookie = 'RoktTransactionId=xyz';

            // Local storage
            window.localStorage.setItem('RoktTransactionId', 'ls-rok');

            const integrationCapture = new IntegrationCapture('none');

            const clickIds = integrationCapture.captureQueryParams();
            const clickIdCookies = integrationCapture.captureCookies();
            const clickIdLocalStorage = integrationCapture.captureLocalStorage();

            expect(clickIds).toMatchObject({});
            expect(clickIdCookies).toMatchObject({});
            expect(clickIdLocalStorage).toEqual({});
        });
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
                const url = new URL('https://www.example.com/?gclid=54321&gbraid=67890&wbraid=09876');

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    gclid: '54321',
                    gbraid: '67890',
                    wbraid: '09876',
                });
            });
        });

        describe('SnapChat Click Ids', () => {
            it('should capture Snapchat specific click ids', () => {
                const url = new URL('https://www.example.com/?ScCid=1234');

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    ScCid: '1234',
                });
            });

            it('should capture Snapchat specific click ids without being case sensitive', () => {
                const url = new URL('https://www.example.com/?sccid=1234');

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    ScCid: '1234',
                });
            });

            it('should capture _scid from cookies', () => {
                const url = new URL('https://www.example.com/');

                window.document.cookie = '_scid=cookie1-from-cookie';
                window.document.cookie = '_cookie1=4567';
                window.document.cookie = 'baz=qux';

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    _scid: 'cookie1-from-cookie',
                });
            });

            it('should capture both ScCid from query params and _scid from cookies', () => {
                const url = new URL('https://www.example.com/?ScCid=4567');

                window.document.cookie = '_scid=cookie1-from-cookie';
                window.document.cookie = '_cookie1=334455';

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    ScCid: '4567',
                    _scid: 'cookie1-from-cookie',
                });
            });
        });

        describe('Pinterest Click Ids', () => {
            it('should capture Pinterest click ids from query params', () => {
                const url = new URL('https://www.example.com/?epik=from_query');

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    epik: 'from_query',
                });
            });

            it('should capture Pinterest _epik from query params', () => {
                const url = new URL('https://www.example.com/?_epik=from_query_underscore');

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    _epik: 'from_query_underscore',
                });
            });

            it('should prefer _epik over epik when both query aliases are present', () => {
                const url = new URL(
                    'https://www.example.com/?epik=from_query&_epik=from_query_underscore'
                );

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    _epik: 'from_query_underscore',
                });
            });

            it('should capture Pinterest _epik from cookies when cookie is the only source', () => {
                const url = new URL('https://www.example.com/');
                window.document.cookie = '_epik=from_cookie_underscore';

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    _epik: 'from_cookie_underscore',
                });
            });

            it('should capture Pinterest epik from cookies when cookie is the only source', () => {
                const url = new URL('https://www.example.com/');
                window.document.cookie = 'epik=from_cookie_epik';

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    epik: 'from_cookie_epik',
                });
            });

            it('should capture Pinterest _epik from localStorage when localStorage is the only source', () => {
                const url = new URL('https://www.example.com/');
                localStorage.setItem('_epik', 'from_local_storage_underscore');

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    _epik: 'from_local_storage_underscore',
                });
            });

            it('should capture Pinterest epik from localStorage when localStorage is the only source', () => {
                const url = new URL('https://www.example.com/');
                localStorage.setItem('epik', 'from_local_storage_epik');

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    epik: 'from_local_storage_epik',
                });
            });

            it('should prefer query over localStorage and cookies', () => {
                const url = new URL('https://www.example.com/?epik=from_query');
                window.document.cookie = '_epik=from_cookie';
                localStorage.setItem('_epik', 'from_local_storage');

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    epik: 'from_query',
                });
            });

            it('should prefer localStorage over cookies when query params are missing', () => {
                const url = new URL('https://www.example.com/');
                window.document.cookie = '_epik=from_cookie';
                localStorage.setItem('_epik', 'from_local_storage');

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    _epik: 'from_local_storage',
                });
            });

            it('should prefer _epik over epik when both localStorage aliases are present', () => {
                const url = new URL('https://www.example.com/');
                localStorage.setItem('epik', 'from_local_storage_epik');
                localStorage.setItem('_epik', 'from_local_storage_underscore');

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    _epik: 'from_local_storage_underscore',
                });
            });

            it('should not let stale Pinterest aliases override fresh query values across captures', () => {
                const integrationCapture = new IntegrationCapture('all');

                window.location.href = 'https://www.example.com/';
                window.location.search = '';
                window.document.cookie = '_epik=stale_cookie_alias';
                integrationCapture.capture();

                window.location.href = 'https://www.example.com/?epik=fresh_query_value';
                window.location.search = '?epik=fresh_query_value';
                integrationCapture.capture();

                const customFlags = integrationCapture.getClickIdsAsCustomFlags();
                expect(customFlags['Pinterest.click_id']).toBe('fresh_query_value');
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
            it('should capture rtid via url param', () => {
                const url = new URL('https://www.example.com/?rtid=54321');

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    rtid: '54321',
                });
            });

            it('should capture rclid via url param', () => {
                const url = new URL('https://www.example.com/?rclid=7183717');

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    rclid: '7183717',
                });
            });

            it('should capture RoktTransactionId via cookies', () => {
                window.document.cookie = 'RoktTransactionId=12345';

                const url = new URL('https://www.example.com/');

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    RoktTransactionId: '12345',
                });
            });

            it('should capture RoktTransactionId via local storage', () => {
                jest.spyOn(Date, 'now').mockImplementation(() => 42);

                const url = new URL('https://www.example.com/');

                window.location.href = url.href;
                window.location.search = url.search;

                localStorage.setItem('RoktTransactionId', '54321');

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    RoktTransactionId: '54321',
                });
            });

            it('should prioritize rtid over RoktTransactionId via cookies', () => {
                jest.spyOn(Date, 'now').mockImplementation(() => 42);

                const url = new URL('https://www.example.com/?rtid=54321');
                
                window.document.cookie = 'RoktTransactionId=12345';

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    rtid: '54321',
                });
            });

            it('should prioritize rclid over RoktTransactionId via cookies', () => {
                jest.spyOn(Date, 'now').mockImplementation(() => 42);

                const url = new URL('https://www.example.com/?rclid=7183717');

                window.document.cookie = 'RoktTransactionId=12345';

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    rclid: '7183717',
                });
            });

            it('should prioritize rtid over RoktTransactionId via local storage', () => {
                jest.spyOn(Date, 'now').mockImplementation(() => 42);

                const url = new URL('https://www.example.com/?rtid=54321');

                window.location.href = url.href;
                window.location.search = url.search;

                localStorage.setItem('RoktTransactionId', '12345');

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    rtid: '54321',
                });
            });

            it('should prioritize rclid over RoktTransactionId via local storage', () => {
                jest.spyOn(Date, 'now').mockImplementation(() => 42);

                const url = new URL('https://www.example.com/?rclid=7183717');
                
                window.location.href = url.href;
                window.location.search = url.search;

                localStorage.setItem('RoktTransactionId', '12345');

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    rclid: '7183717',
                });
            });

            it('should prioritize local storage over cookies', () => {
                jest.spyOn(Date, 'now').mockImplementation(() => 42);

                const url = new URL('https://www.example.com/');

                window.location.href = url.href;
                window.location.search = url.search;

                localStorage.setItem('RoktTransactionId', '12345');
                window.document.cookie = 'RoktTransactionId=67890';

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    RoktTransactionId: '12345',
                });
            });
        });

        describe('precedence between the URL, localStorage and cookies', () => {
            const outputOfEachKey: [string, string][] = [
                ['fbclid', 'Facebook.ClickId'],
                ['_fbc', 'Facebook.ClickId'],
                ['_fbp', 'Facebook.BrowserId'],
                ['gclid', 'GoogleEnhancedConversions.Gclid'],
                ['gbraid', 'GoogleEnhancedConversions.Gbraid'],
                ['wbraid', 'GoogleEnhancedConversions.Wbraid'],
                ['ttclid', 'TikTok.Callback'],
                ['_ttp', 'tiktok_cookie_id'],
                ['ScCid', 'SnapchatConversions.ClickId'],
                ['_scid', 'SnapchatConversions.Cookie1'],
                ['epik', 'Pinterest.click_id'],
                ['_epik', 'Pinterest.click_id'],
                ['rtid', 'passbackconversiontrackingid'],
                ['rclid', 'passbackconversiontrackingid'],
                ['RoktTransactionId', 'passbackconversiontrackingid'],
            ];

            const landingPage = 'https://www.example.com/';

            const visit = (url: string) => {
                window.location.href = url;
                window.location.search = new URL(url).search;
            };

            const store: { [source: string]: (key: string, value: string) => void } = {
                url: (key, value) => visit(`${landingPage}?${key}=${value}`),
                localStorage: (key, value) => window.localStorage.setItem(key, value),
                cookie: (key, value) => {
                    window.document.cookie = `${key}=${value}`;
                },
            };

            const asCaptured = (key: string, value: string) =>
                key === 'fbclid' ? `fb.2.42.${value}` : value;

            const capturedOutputs = (integrationCapture: IntegrationCapture) => ({
                ...integrationCapture.getClickIdsAsCustomFlags(),
                ...integrationCapture.getClickIdsAsPartnerIdentities(),
                ...integrationCapture.getClickIdsAsIntegrationAttributes()[1277],
            });

            beforeEach(() => {
                jest.spyOn(Date, 'now').mockImplementation(() => 42);
                visit(landingPage);
            });

            describe.each(['url', 'localStorage', 'cookie'])('when only the %s holds a key', source => {
                it.each(outputOfEachKey)('captures %s as %s', (key, output) => {
                    store[source](key, `from-${source}`);

                    const integrationCapture = new IntegrationCapture('all');
                    integrationCapture.capture();

                    expect(capturedOutputs(integrationCapture)[output]).toBe(asCaptured(key, `from-${source}`));
                });
            });

            describe.each([
                ['url', 'cookie'],
                ['url', 'localStorage'],
                ['localStorage', 'cookie'],
            ])('when the %s and the %s hold the same key', (higher, lower) => {
                it.each(outputOfEachKey)(`reports %s from the ${higher} as %s`, (key, output) => {
                    store[lower](key, `from-${lower}`);
                    store[higher](key, `from-${higher}`);

                    const integrationCapture = new IntegrationCapture('all');
                    integrationCapture.capture();

                    expect(capturedOutputs(integrationCapture)[output]).toBe(asCaptured(key, `from-${higher}`));
                    expect(integrationCapture.clickIds[key]).toBe(asCaptured(key, `from-${higher}`));
                });
            });

            it.each([
                ['rclid', 'url', 'rtid', 'cookie', 'passbackconversiontrackingid'],
                ['rtid', 'url', 'rclid', 'localStorage', 'passbackconversiontrackingid'],
                ['RoktTransactionId', 'localStorage', 'rtid', 'cookie', 'passbackconversiontrackingid'],
                ['rtid', 'localStorage', 'RoktTransactionId', 'cookie', 'passbackconversiontrackingid'],
                ['fbclid', 'url', '_fbc', 'localStorage', 'Facebook.ClickId'],
                ['fbclid', 'localStorage', '_fbc', 'cookie', 'Facebook.ClickId'],
                ['_fbc', 'localStorage', 'fbclid', 'cookie', 'Facebook.ClickId'],
                ['epik', 'url', '_epik', 'cookie', 'Pinterest.click_id'],
            ])('reports %s from the %s over %s from the %s as %s', (higherKey, higher, lowerKey, lower, output) => {
                store[lower](lowerKey, `from-${lower}`);
                store[higher](higherKey, `from-${higher}`);

                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();

                expect(capturedOutputs(integrationCapture)[output]).toBe(asCaptured(higherKey, `from-${higher}`));
            });

            it('does not let a Rokt ID from an earlier capture outrank one in the URL', () => {
                store.cookie('RoktTransactionId', 'from-cookie');
                const integrationCapture = new IntegrationCapture('all');
                integrationCapture.capture();
                expect(capturedOutputs(integrationCapture).passbackconversiontrackingid, 'first capture').toBe('from-cookie');

                store.url('rtid', 'from-url');
                integrationCapture.capture();

                expect(capturedOutputs(integrationCapture).passbackconversiontrackingid).toBe('from-url');
            });

            it('does not let a Facebook click ID from an earlier capture outrank one in the URL', () => {
                const integrationCapture = new IntegrationCapture('all');
                store.url('fbclid', 'first-visit');
                integrationCapture.capture();
                visit(landingPage);
                store.cookie('_fbc', 'from-cookie');
                integrationCapture.capture();
                expect(capturedOutputs(integrationCapture)['Facebook.ClickId'], 'second capture').toBe('from-cookie');

                store.url('fbclid', 'second-visit');
                integrationCapture.capture();

                expect(capturedOutputs(integrationCapture)['Facebook.ClickId']).toBe('fb.2.42.second-visit');
            });

            it('keeps a click ID from an earlier capture while no source holds it', () => {
                const integrationCapture = new IntegrationCapture('all');
                visit(`${landingPage}?gclid=from-landing-page&rtid=from-landing-page`);
                integrationCapture.capture();

                visit(`${landingPage}next-page`);
                integrationCapture.capture();

                expect(capturedOutputs(integrationCapture)['GoogleEnhancedConversions.Gclid']).toBe('from-landing-page');
                expect(capturedOutputs(integrationCapture).passbackconversiontrackingid).toBe('from-landing-page');
            });

            it('keeps a Rokt ID from an earlier capture when a cookie for the same output is empty', () => {
                const integrationCapture = new IntegrationCapture('all');
                store.url('rtid', 'from-landing-page');
                integrationCapture.capture();

                visit(`${landingPage}next-page`);
                window.document.cookie = 'RoktTransactionId=';
                integrationCapture.capture();

                expect(capturedOutputs(integrationCapture).passbackconversiontrackingid).toBe('from-landing-page');
            });

            it.each([
                ['gclid', 'gclid', 'GoogleEnhancedConversions.Gclid'],
                ['rtid', 'RoktTransactionId', 'passbackconversiontrackingid'],
            ])('replaces %s from an earlier capture with %s stored since', (earlierKey, storedKey, output) => {
                const integrationCapture = new IntegrationCapture('all');
                store.url(earlierKey, 'from-landing-page');
                integrationCapture.capture();
                expect(capturedOutputs(integrationCapture)[output], 'first capture').toBe('from-landing-page');

                visit(`${landingPage}next-page`);
                store.localStorage(storedKey, 'from-localStorage');
                integrationCapture.capture();

                expect(capturedOutputs(integrationCapture)[output]).toBe('from-localStorage');
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
                ScCid: '456789',
                epik: 'pinterest123',
                _scid: 'cookie1-value',
                invalidId: '12345',
            };

            const customFlags = integrationCapture.getClickIdsAsCustomFlags();

            expect(customFlags).toEqual({
                'Facebook.ClickId': '67890',
                'Facebook.BrowserId': '54321',
                'TikTok.Callback': '12345',
                'GoogleEnhancedConversions.Gclid': '123233.23131',
                'SnapchatConversions.ClickId': '456789',
                'Pinterest.click_id': 'pinterest123',
                'SnapchatConversions.Cookie1': 'cookie1-value',
            });
        });

        it('should map both epik and _epik to Pinterest.click_id deterministically (_epik preferred)', () => {
            const integrationCapture = new IntegrationCapture('all');
            expect(integrationCapture.filteredCustomFlagMappings.epik).toBeDefined();
            expect(integrationCapture.filteredCustomFlagMappings._epik).toBeDefined();

            integrationCapture.clickIds = {
                epik: 'pinterest_epik',
                _epik: 'pinterest_underscore_epik',
            };

            const customFlags = integrationCapture.getClickIdsAsCustomFlags();
            expect(customFlags['Pinterest.click_id']).toBe(
                'pinterest_underscore_epik'
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

