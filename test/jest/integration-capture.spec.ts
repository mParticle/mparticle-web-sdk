import IntegrationCapture, {
    facebookClickIdProcessor,
} from '../../src/integrationCapture';
import { deleteAllCookies } from './utils';

describe('Integration Capture', () => {
    describe('constructor', () => {
        it('should initialize with clickIds as undefined', () => {
            const integrationCapture = new IntegrationCapture();
            expect(integrationCapture.clickIds).toBeUndefined();
        });

        it('should initialize with a filtered list of partner identity mappings', () => {
            const integrationCapture = new IntegrationCapture();
            const mappings = integrationCapture.filteredPartnerIdentityMappings;
            expect(Object.keys(mappings)).toEqual(['_ttp']);
        });

        it('should initialize with a filtered list of custom flag mappings', () => {
            const integrationCapture = new IntegrationCapture();
            const mappings = integrationCapture.filteredCustomFlagMappings;
            expect(Object.keys(mappings)).toEqual([
                'fbclid',
                '_fbp',
                '_fbc',
                'gclid',
                'gbraid',
                'wbraid',
                'ttclid',
                'ScCid'
            ]);
        });

        it('should initialize with a filtered list of integration attribute mappings', () => {
            const integrationCapture = new IntegrationCapture();
            const mappings = integrationCapture.filteredIntegrationAttributeMappings;
            expect(Object.keys(mappings)).toEqual(['rtid', 'RoktTransactionId']);
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
            const integrationCapture = new IntegrationCapture();
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
                'ScCid=1234'
            ].join('&');

            const url = new URL(`https://www.example.com/?${queryParams}`);

            window.document.cookie = '_cookie1=1234';
            window.document.cookie = '_cookie2=39895811.9165333198';
            window.document.cookie = '_fbp=54321';
            window.document.cookie = 'baz=qux';

            window.location.href = url.href;
            window.location.search = url.search;

            const integrationCapture = new IntegrationCapture();
            integrationCapture.capture();

            expect(integrationCapture.clickIds).toEqual({
                fbclid: 'fb.2.42.12345',
                _fbp: '54321',
                gclid: '54321',
                gbraid: '67890',
                rtid: '84324',
                wbraid: '09876',
                ScCid:'1234'
            }); 
        });

        describe('Google Click Ids', () => {
            it('should capture Google specific click ids', () => {
                const url = new URL('https://www.example.com/?gclid=54321&gbraid=67890&wbraid=09876');

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture();
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

                const integrationCapture = new IntegrationCapture();
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    ScCid: '1234',
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

            const integrationCapture = new IntegrationCapture();
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

            const integrationCapture = new IntegrationCapture();
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

            const integrationCapture = new IntegrationCapture();
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

            const integrationCapture = new IntegrationCapture();
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

                const integrationCapture = new IntegrationCapture();
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    rtid: '54321',
                });
            });

            it('should capture RoktTransactionId via cookies', () => {
                window.document.cookie = 'RoktTransactionId=12345';

                const url = new URL('https://www.example.com/');

                window.location.href = url.href;
                window.location.search = url.search;

                const integrationCapture = new IntegrationCapture();
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

                const integrationCapture = new IntegrationCapture();
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

                const integrationCapture = new IntegrationCapture();
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    rtid: '54321',
                });
            });

            it('should prioritize rtid over RoktTransactionId via local storage', () => {
                jest.spyOn(Date, 'now').mockImplementation(() => 42);

                const url = new URL('https://www.example.com/?rtid=54321');

                window.location.href = url.href;
                window.location.search = url.search;

                localStorage.setItem('RoktTransactionId', '12345');

                const integrationCapture = new IntegrationCapture();
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    rtid: '54321',
                });
            });

            it('should prioritize local storage over cookies', () => {
                jest.spyOn(Date, 'now').mockImplementation(() => 42);

                const url = new URL('https://www.example.com/');

                window.location.href = url.href;
                window.location.search = url.search;

                localStorage.setItem('RoktTransactionId', '12345');
                window.document.cookie = 'RoktTransactionId=67890';

                const integrationCapture = new IntegrationCapture();
                integrationCapture.capture();

                expect(integrationCapture.clickIds).toEqual({
                    RoktTransactionId: '12345',
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
                'https://www.example.com/?ttclid=12345&fbclid=67890&gclid=54321'
            );

            window.location.href = url.href;
            window.location.search = url.search;

            const integrationCapture = new IntegrationCapture();
            const clickIds = integrationCapture.captureQueryParams();

            expect(clickIds).toEqual({
                fbclid: 'fb.2.42.67890',
                gclid: '54321',
                ttclid: '12345',
            });
        });

        it('should NOT capture query params if they are not mapped', () => {
            const url = new URL(
                'https://www.example.com/?invalidid=12345&foo=bar'
            );

            window.location.href = url.href;
            window.location.search = url.search;

            const integrationCapture = new IntegrationCapture();
            const clickIds = integrationCapture.captureQueryParams();

            expect(clickIds).toEqual({});
        });

        it('should format fbclid correctly with the same timestamp on subsequent captures', () => {
            const url = new URL(
                'https://www.example.com/?fbclid=AbCdEfGhIjKlMnOpQrStUvWxYz1234567890'
            ); 

            window.location.href = url.href;
            window.location.search = url.search;

            const integrationCapture = new IntegrationCapture();
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

            const integrationCapture = new IntegrationCapture();
            const clickIds = integrationCapture.captureCookies();

            expect(clickIds).toEqual({
                _fbp: '54321',
            });
        });

        it('should NOT capture cookies if they are not mapped', () => {
            window.document.cookie = '_cookie1=1234';
            window.document.cookie = '_cookie2=39895811.9165333198';
            window.document.cookie = 'baz=qux';

            const integrationCapture = new IntegrationCapture();
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

            const integrationCapture = new IntegrationCapture();
            const clickIds = integrationCapture.captureLocalStorage();

            expect(clickIds).toEqual({
                RoktTransactionId: '12345',
            });
        });

        it('should NOT capture local storage items if they are not mapped', () => {
            localStorage.setItem('baz', 'qux');

            const integrationCapture = new IntegrationCapture();
            const clickIds = integrationCapture.captureLocalStorage();

            expect(clickIds).toEqual({});
        });
    });

    describe('#getClickIdsAsCustomFlags', () => {
        it('should return empty object if clickIds is empty or undefined', () => {
            const integrationCapture = new IntegrationCapture();
            const customFlags = integrationCapture.getClickIdsAsCustomFlags();

            expect(customFlags).toEqual({});
        });

        it('should only return mapped clickIds as custom flags', () => {
            const integrationCapture = new IntegrationCapture();
            integrationCapture.clickIds = {
                fbclid: '67890',
                _fbp: '54321',
                _ttp: '0823422223.23234',
                ttclid: '12345',
                gclid: '123233.23131',
                invalidId: '12345',
            };

            const customFlags = integrationCapture.getClickIdsAsCustomFlags();

            expect(customFlags).toEqual({
                'Facebook.ClickId': '67890',
                'Facebook.BrowserId': '54321',
                'TikTok.Callback': '12345',
                'GoogleEnhancedConversions.Gclid': '123233.23131',
            });
        });
    });

    describe('#getClickIdsAsPartnerIdentites', () => {
        it('should return empty object if clickIds is empty or undefined', () => {
            const integrationCapture = new IntegrationCapture();
            const partnerIdentities = integrationCapture.getClickIdsAsPartnerIdentities();

            expect(partnerIdentities).toEqual({});
        });

        it('should only return mapped clickIds as partner identities', () => {
            const integrationCapture = new IntegrationCapture();
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
            const integrationCapture = new IntegrationCapture();
            const integrationAttributes = integrationCapture.getClickIdsAsIntegrationAttributes();

            expect(integrationAttributes).toEqual({});
        });

        it('should only return mapped clickIds as integration attributes', () => {
            const integrationCapture = new IntegrationCapture();
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
