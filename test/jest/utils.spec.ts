import { queryStringParser, getCookies, getHref } from '../../src/utils';

function deleteAllCookies() {
    document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    });
}

describe('Utils', () => {
    describe('getCookies', () => {
        beforeEach(() => {
            window.document.cookie = '_cookie1=1234';
            window.document.cookie = '_cookie2=39895811.9165333198';
            window.document.cookie = 'foo=bar';
            window.document.cookie = 'baz=qux';
        });

        afterEach(() => {
            deleteAllCookies();
            console.log('window.document.cookie after', window.document.cookie);
        });

        it('returns all cookies as an object', () => {

            console.log('window.document.cookie', window.document.cookie);

            const expectedResult = {
                foo: 'bar',
                '_cookie1': '1234',
                '_cookie2': '39895811.9165333198',
                baz: 'qux',
            };

            expect(getCookies()).toEqual(expectedResult);
        });

        it('returns only the cookies that match the keys', () => {
            const expectedResult = {
                foo: 'bar',
                baz: 'qux',
            };

            expect(getCookies(['foo', 'baz'])).toEqual(expectedResult);
        });
    });

    describe('queryyStringParser', () => {
        const url = 'https://www.example.com?q=z&foo=bar&baz=qux&narf=poit';

        it('returns an object with the query string parameters that match an array of keys', () => {
            const keys = ['foo', 'narf'];

            const expectedResult = {
                foo: 'bar',
                narf: 'poit',
            };

            expect(queryStringParser(url, keys)).toEqual(expectedResult);
        });

        it('returns an empty object if no keys are found', () => {
            const keys = ['quux', 'corge'];

            expect(queryStringParser(url, keys)).toEqual({});
        });

        it('returns an empty object if the URL is empty', () => {
            const keys = ['foo', 'narf'];

            expect(queryStringParser('', keys)).toEqual({});
        });

        describe('without URLSearchParams', () => {
            beforeEach(() => {
                URL = undefined;
                URLSearchParams = undefined;
            });
    
            it('returns an object with the query string parameters that match an array of keys', () => {
                const keys = ['foo', 'narf'];
    
                const expectedResult = {
                    foo: 'bar',
                    narf: 'poit',
                };
                expect(queryStringParser(url, keys)).toEqual(expectedResult);
            });
    
            it('returns an empty object if no keys are found', () => {
                const keys = ['quux', 'corge'];
    
                expect(queryStringParser(url, keys)).toEqual({});
            });
    
            it('returns an empty object if the URL is empty', () => {
                const keys = ['foo', 'narf'];
    
                expect(queryStringParser('', keys)).toEqual({});
            });
        });
    });

    describe('getHref', () => {
        it('returns the current URL', () => {
            expect(getHref()).toEqual(window.location.href);
        });

        it('returns an empty string if window is not defined', () => {
            const originalWindow = global.window;
            delete global.window;

            expect(getHref()).toEqual('');

            global.window = originalWindow;
        });
    });

});
