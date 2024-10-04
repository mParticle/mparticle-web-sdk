import IntegrationCapture, { facebookClickIdProcessor } from "../../src/integrationCapture";
import { deleteAllCookies } from "./utils";

describe('Integration Capture', () => {
    describe('constructor', () => {
        it('should initialize with clickIds as undefined', () => {
            const integrationCapture = new IntegrationCapture();
            expect(integrationCapture.clickIds).toBeUndefined();
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
        });

        it('should call captureCookies and captureQueryParams', () => {
            const integrationCapture = new IntegrationCapture();
            integrationCapture.captureCookies = jest.fn();
            integrationCapture.captureQueryParams = jest.fn();

            integrationCapture.capture();

            expect(integrationCapture.captureCookies).toHaveBeenCalled();
            expect(integrationCapture.captureQueryParams).toHaveBeenCalled();
        });

        it('should prioritize fbclid over _fbc', () => {

            const url = new URL("https://www.example.com/?fbclid=12345&");

            window.document.cookie = '_cookie1=1234';
            window.document.cookie = '_cookie2=39895811.9165333198';
            window.document.cookie = '_fbc=654321';
            window.document.cookie = 'baz=qux';

            window.location.href = url.href;
            window.location.search = url.search;

            const integrationCapture = new IntegrationCapture();
            integrationCapture.capture();

            expect(integrationCapture.clickIds).toEqual({
               fbclid: '12345', 
            });
        });

        it('should format fbclid correctly', () => {
            const url = new URL("https://www.example.com/?fbclid=fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890");

            window.document.cookie = '_cookie1=1234';
            window.document.cookie = '_cookie2=39895811.9165333198';
            window.document.cookie = '_fbp=54321';
            window.document.cookie = 'baz=qux';

            window.location.href = url.href;
            window.location.search = url.search;

            const integrationCapture = new IntegrationCapture();
            integrationCapture.capture();

            expect(integrationCapture.clickIds).toEqual({
                fbclid: 'AbCdEfGhIjKlMnOpQrStUvWxYz1234567890',
                '_fbp': '54321',
            });
        });

        it('should format _fbc correctly', () => {
            const url = new URL("https://www.example.com/?foo=bar");

            window.document.cookie = '_cookie1=1234';
            window.document.cookie = '_cookie2=39895811.9165333198';
            window.document.cookie = '_fbp=54321';
            window.document.cookie = '_fbc=fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890';
            window.document.cookie = 'baz=qux';

            window.location.href = url.href;
            window.location.search = url.search;

            const integrationCapture = new IntegrationCapture();
            integrationCapture.capture();

            expect(integrationCapture.clickIds).toEqual({
                '_fbc': 'AbCdEfGhIjKlMnOpQrStUvWxYz1234567890',
                '_fbp': '54321',
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
        });

        it('should capture specific query params into clickIds object', () => {
            const url = new URL("https://www.example.com/?ttclid=12345&fbclid=67890&gclid=54321");

            window.location.href = url.href;
            window.location.search = url.search;

            const integrationCapture = new IntegrationCapture();
            const clickIds = integrationCapture.captureQueryParams();

            expect(clickIds).toEqual({
                fbclid: '67890',
            });
        });

        it('should NOT capture query params if they are not mapped', () => {
            const url = new URL("https://www.example.com/?invalidid=12345&foo=bar");

            window.location.href = url.href;
            window.location.search = url.search;

            const integrationCapture = new IntegrationCapture();
            const clickIds = integrationCapture.captureQueryParams();

            expect(clickIds).toEqual({});
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
                '_fbp': '54321',
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
                'Facebook.BrowserId': '54321',
            });
        });

        it('should return empty object if clickIds is empty or undefined', () => {
            const integrationCapture = new IntegrationCapture();
            const customFlags = integrationCapture.getClickIdsAsCustomFlags();

            expect(customFlags).toEqual({});
        });
    });

    describe('#facebookClickIdProcessor', () => {
        it('returns a formatted clickId if it is passed in as a full click id', () => {
            const fullClickId = 'fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890';

            const expectedClickId = 'AbCdEfGhIjKlMnOpQrStUvWxYz1234567890';

            expect(facebookClickIdProcessor(fullClickId)).toEqual(expectedClickId);
        });

        it('returns a formatted clickId if it is passed in as a partial click id', () => {
            const partialClickId = 'AbCdEfGhIjKlMnOpQrStUvWxYz1234567890';

            const expectedClickId = 'AbCdEfGhIjKlMnOpQrStUvWxYz1234567890';

            expect(facebookClickIdProcessor(partialClickId)).toEqual(expectedClickId);
        });

        it('returns an empty string if the clickId is not valid', () => {
            const expectedClickId = '';

            expect(facebookClickIdProcessor(null)).toEqual(expectedClickId);
            expect(facebookClickIdProcessor(undefined)).toEqual(expectedClickId);
            expect(facebookClickIdProcessor('')).toEqual(expectedClickId);

            // @ts-ignore
            expect(facebookClickIdProcessor(NaN)).toEqual(expectedClickId);
            // @ts-ignore
            expect(facebookClickIdProcessor(0)).toEqual(expectedClickId);
        });
    });
});