import IntegrationCapture from "../../src/integrationCapture";

function deleteAllCookies() {
    document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    });
}

describe('Integration Capture', () => {
    describe('constructor', () => {
        it('should initialize with clickIds as undefined', () => {
            const integrationCapture = new IntegrationCapture();
            expect(integrationCapture.clickIds).toBeUndefined();
        });
    });

    describe('#capture', () => {
        it('should call captureCookies and captureQueryParams', () => {
            const integrationCapture = new IntegrationCapture();
            integrationCapture.captureCookies = jest.fn();
            integrationCapture.captureQueryParams = jest.fn();

            integrationCapture.capture();

            expect(integrationCapture.captureCookies).toHaveBeenCalled();
            expect(integrationCapture.captureQueryParams).toHaveBeenCalled();
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
        });

        it('should capture specific query params into clickIds object', () => {
            const url = new URL("https://www.example.com/?ttclid=12345&fbclid=67890&_fbp=54321");

            window.location.href = url.href;
            window.location.search = url.search;

            const integrationCapture = new IntegrationCapture();
            integrationCapture.captureQueryParams();

            expect(integrationCapture.clickIds).toEqual({
                fbclid: '67890',
                '_fbp': '54321',
            });
        });

        it('should NOT capture query params if they are not mapped', () => {
            const url = new URL("https://www.example.com/?invalidid=12345&foo=bar");

            window.location.href = url.href;
            window.location.search = url.search;

            const integrationCapture = new IntegrationCapture();
            integrationCapture.captureQueryParams();

            expect(integrationCapture.clickIds).toEqual({});
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
            integrationCapture.captureCookies();

            expect(integrationCapture.clickIds).toEqual({
                '_fbp': '54321',
            });
        });

        it('should NOT capture cookies if they are not mapped', () => {
            window.document.cookie = '_cookie1=1234';
            window.document.cookie = '_cookie2=39895811.9165333198';
            window.document.cookie = 'baz=qux';

            const integrationCapture = new IntegrationCapture();
            integrationCapture.captureCookies();

            expect(integrationCapture.clickIds).toEqual({});
        });
    });

    describe('#getClickIdsAsCustomFlags', () => {
        it('should return clickIds as custom flags', () => {
            const integrationCapture = new IntegrationCapture();
            integrationCapture.clickIds = {
                fbclid: '67890',
                '_fbp': '54321',
            };

            const customFlags = integrationCapture.getClickIdsAsCustomFlags();

            expect(customFlags).toEqual({
                'Facebook.ClickId': '67890',
                'FaceBook.BrowserId': '54321',
            });
        });

        it('should return empty object if clickIds is empty or undefined', () => {
            const integrationCapture = new IntegrationCapture();
            const customFlags = integrationCapture.getClickIdsAsCustomFlags();

            expect(customFlags).toEqual({});
        });
    });
});