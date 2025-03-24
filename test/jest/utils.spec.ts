import { IKitConfigs } from '../../src/configAPIClient';
import { SDKInitConfig } from '../../src/sdkRuntimeModels';
import {
    queryStringParser,
    getCookies,
    getHref,
    replaceMPID,
    replaceAmpWithAmpersand,
    createCookieSyncUrl,
    inArray,
    filterDictionaryWithHash,
    parseConfig,
} from '../../src/utils';
import { deleteAllCookies } from './utils';

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
        });

        it('returns all cookies as an object', () => {
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

        it('returns an empty object if no keys are found', () => {
            expect(getCookies(['quux', 'corge'])).toEqual({});
        });

        it('returns an empty object if there are no cookies', () => {
            deleteAllCookies();

            expect(getCookies()).toEqual({});
        });

        it('returns an empty object if window is undefined', () => {
            const originalWindow = global.window;
            delete global.window;

            expect(getCookies()).toEqual({});

            global.window = originalWindow
        });
    });

    describe('queryStringParser', () => {
        const url = 'https://www.example.com?q=z&foo=bar&baz=qux&narf=poit';

        describe('with URLSearchParams', () => {
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
    
            it('returns an empty object if there are no query parameters', () => {
                expect(queryStringParser('https://www.example.com', ['foo', 'narf'])).toEqual({});
            });

            it('returns an object with all the query string parameters if no keys are passed', () => {
                const expectedResult = {
                    q: 'z',
                    foo: 'bar',
                    baz: 'qux',
                    narf: 'poit',
                };

                expect(queryStringParser(url)).toEqual(expectedResult);
            });
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

            it('returns an empty object if there are no query parameters', () => {
                expect(queryStringParser('https://www.example.com', ['foo', 'narf'])).toEqual({});
            });

            it('returns an object with all the query string parameters if no keys are passed', () => {
                const expectedResult = {
                    q: 'z',
                    foo: 'bar',
                    baz: 'qux',
                    narf: 'poit',
                };

                expect(queryStringParser(url, [])).toEqual(expectedResult);
            });

            it('should handle non-standard characters or malformed urls', () => {
                const malformedUrl = 'https://www.example.com?foo=bar&baz=qux&mal=%E0%A4%A&narf=poit&param0=你好&*;<script>alert("hi")</script>&http://a.com/?c=7&d=8#!/asd+/%^^%zz%%%world你好&param1&param2=&param3=%E0%A4%A&param4=value1=value2&param5=a%AFc';
                const keys = [
                    'foo',
                    'narf',
                    'param0',
                    'param1',
                    'param2',
                    'param3',
                    'param4'
                ];

                const expectedResult = {
                    foo: 'bar',
                    narf: 'poit',
                    param0: '你好',
                };

                expect(queryStringParser(malformedUrl, keys)).toEqual(expectedResult);
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

    describe('#replaceMPID', () => {
        it('replaces the MPID in a string', () => {
            const mpid = '1234';
            const string = 'https://www.google.com?mpid=%%mpid%%&foo=bar';

            expect(replaceMPID(string, mpid)).toEqual(
                'https://www.google.com?mpid=1234&foo=bar'
            );
        });
    });

    describe('#replaceAmpWithAmpersand', () => {
        it('replaces all instances of amp with ampersand', () => {
            const string = 'https://www.google.com?mpid=%%mpid%%&amp;foo=bar';

            expect(replaceAmpWithAmpersand(string)).toEqual(
                'https://www.google.com?mpid=%%mpid%%&foo=bar'
            );
        });
    });

    describe('#createCookieSyncUrl', () => {
        const pixelUrl: string = 'https://abc.abcdex.net/ibs:exampleid=12345&amp;exampleuuid=%%mpid%%&amp;redir=';
        const redirectUrl: string = 'https://cookiesync.mparticle.com/v1/sync?esid=123456&amp;MPID=%%mpid%%&amp;ID=${DD_UUID}&amp;Key=mpApiKey&amp;env=2';

        it('should return a cookieSyncUrl when both pixelUrl and redirectUrl are not null', () => {
            expect(createCookieSyncUrl('testMPID', pixelUrl, redirectUrl)).toBe('https://abc.abcdex.net/ibs:exampleid=12345&exampleuuid=testMPID&redir=https%3A%2F%2Fcookiesync.mparticle.com%2Fv1%2Fsync%3Fesid%3D123456%26MPID%3DtestMPID%26ID%3D%24%7BDD_UUID%7D%26Key%3DmpApiKey%26env%3D2');
        });

        it('should return a cookieSyncUrl when pixelUrl is not null but redirectUrl is null', () => {
            expect(createCookieSyncUrl('testMPID', pixelUrl, null)).toBe('https://abc.abcdex.net/ibs:exampleid=12345&exampleuuid=testMPID&redir=');
        });
    });

    describe('#inArray', () => {
        it('returns true if the item is in the array', () => {
            expect(inArray(['foo', 'bar', 'baz'], 'bar')).toBe(true);
        });

        it('returns false if the item is not in the array', () => {
            expect(inArray(['foo', 'bar', 'baz'], 'qux')).toBe(false);
        });

        it('returns false if the array is empty', () => {
            expect(inArray([], 'foo')).toBe(false);
        });

        it('returns false if the array is null', () => {
            expect(inArray(null, 'foo')).toBe(false);
        });

        it('returns false if the array is undefined', () => {
            expect(inArray(undefined, 'foo')).toBe(false);
        });

        it('should handle type-sensitive array membership checks', () => {
            expect(inArray([1, 2, 3], 2)).toBe(true);
            expect(inArray([1, '2', 3], 2)).toBe(false);
            expect(inArray([1, 2, 3], '2')).toBe(false);
            expect(inArray([1, '2', 3], '2')).toBe(true);
            expect(inArray([1, 2, 3], 4)).toBe(false);
            expect(inArray([1, 2, '', 3], NaN)).toBe(false);
            expect(inArray([1, 2, '', 3], null)).toBe(false);
            expect(inArray([1, 2, '', 3], undefined)).toBe(false);
        });
    });

    describe('#filterDictionaryWithHash', () => {
        it('should filter a dictionary based on a hash function and filter list', () => {
            const dictionary = {
                'foo': 'bar',
                'bar': 'baz',
                'baz': 'qux',
                'quux': 'corge',
            };
    
            const filterList = [
                98, // charCode for 'b'
                102, // charCode for 'f'
            ];
            const hashFn = (key: string): number => key.charCodeAt(0);

            const filtered = filterDictionaryWithHash(dictionary, filterList, hashFn);

            expect(filtered).toEqual({
                'quux': 'corge',
            });
        });
    });

    describe('#parseConfig', () => {
        it('should ONLY return the kit config for Rokt', () => {
            const roktKitConfig: Partial<IKitConfigs> = {
                name: 'Rokt',
                moduleId: 181,
            };

            const otherKitConfig: Partial<IKitConfigs> = {
                name: 'Other Kit',
                moduleId: 42,
            };

            const config: SDKInitConfig = {
                kitConfigs: [roktKitConfig as IKitConfigs, otherKitConfig as IKitConfigs],
            };

            const result = parseConfig(config, 'Rokt', 181);
            expect(result).toEqual(roktKitConfig);
        });

        it('should return null if no kit config is found', () => {
            const config: SDKInitConfig = {
                kitConfigs: [],
            };

            const result = parseConfig(config, 'Rokt', 181);
            expect(result).toBeNull();
        });
    });
});