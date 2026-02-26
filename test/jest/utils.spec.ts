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
    parseSettingsString,
    obfuscateData,
    obfuscateDevData,
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

            it('should handle different params case sensitivity and return them as lowercased params', () => {
                const url = 'https://www.example.com?FoO=bar&bAz=qux&NARF=poit'
                const keys = [
                    'foo',
                    'baz',
                    'narf',
                ];

                const expectedResult = {
                    foo: 'bar',
                    narf: 'poit',
                    baz: 'qux',
                };

                expect(queryStringParser(url, keys)).toEqual(expectedResult);
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

        it('should add domain parameter when provided', () => {
            const simplePixelUrl = 'https://test.com/pixel';
            expect(createCookieSyncUrl('testMPID', simplePixelUrl, null, 'example.com')).toBe('https://test.com/pixel?domain=example.com');
        });

        it('should handle domain parameter with hyphens and dots', () => {
            const simplePixelUrl = 'https://test.com/pixel';
            expect(createCookieSyncUrl('testMPID', simplePixelUrl, null, 'sub-domain.example.com')).toBe('https://test.com/pixel?domain=sub-domain.example.com');
        });

        it('should handle domain parameter with redirect URL', () => {
            const simplePixelUrl = 'https://test.com/pixel';
            const simpleRedirectUrl = 'https://redirect.com/callback';
            expect(createCookieSyncUrl('testMPID', simplePixelUrl, simpleRedirectUrl, 'example.com')).toBe('https://test.com/pixelhttps%3A%2F%2Fredirect.com%2Fcallback?domain=example.com');
        });

        it('should not add domain parameter when domain is undefined', () => {
            const simplePixelUrl = 'https://test.com/pixel';
            expect(createCookieSyncUrl('testMPID', simplePixelUrl, null, undefined)).toBe('https://test.com/pixel');
        });

        it('should not add domain parameter when domain is empty string', () => {
            const simplePixelUrl = 'https://test.com/pixel';
            expect(createCookieSyncUrl('testMPID', simplePixelUrl, null, '')).toBe('https://test.com/pixel');
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

    describe('#parseSettingsString', () => {
        it('should parse a settings string', () => {
            const settingsString = "[{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;f.name&quot;,&quot;maptype&quot;:&quot;UserAttributeClass.Name&quot;,&quot;value&quot;:&quot;firstname&quot;},{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;last_name&quot;,&quot;maptype&quot;:&quot;UserAttributeClass.Name&quot;,&quot;value&quot;:&quot;lastname&quot;}]";
            expect(parseSettingsString(settingsString)).toEqual([
                { jsmap: null, map: 'f.name', maptype: 'UserAttributeClass.Name', value: 'firstname' },
                { jsmap: null, map: 'last_name', maptype: 'UserAttributeClass.Name', value: 'lastname' },
            ]);
        });

        it('should parse a settings string with a number value', () => {
            const settingsString = "[{&quot;jsmap&quot;:&quot;-1484452948&quot;,&quot;map&quot;:&quot;-5208850776883573773&quot;,&quot;maptype&quot;:&quot;EventClass.Id&quot;,&quot;value&quot;:&quot;abc&quot;},{&quot;jsmap&quot;:&quot;1838502119&quot;,&quot;map&quot;:&quot;1324617889422969328&quot;,&quot;maptype&quot;:&quot;EventClass.Id&quot;,&quot;value&quot;:&quot;bcd&quot;},{&quot;jsmap&quot;:&quot;-355458063&quot;,&quot;map&quot;:&quot;5878452521714063084&quot;,&quot;maptype&quot;:&quot;EventClass.Id&quot;,&quot;value&quot;:&quot;card_viewed_test&quot;}]";
            expect(parseSettingsString(settingsString)).toEqual([
                { jsmap: '-1484452948', map: '-5208850776883573773', maptype: 'EventClass.Id', value: 'abc' },
                { jsmap: '1838502119', map: '1324617889422969328', maptype: 'EventClass.Id', value: 'bcd' },
                { jsmap: '-355458063', map: '5878452521714063084', maptype: 'EventClass.Id', value: 'card_viewed_test' },
            ]);
        });
        
        it('returns an empty array if the settings string is null', () => {
            const settingsString = null;
            expect(parseSettingsString(settingsString)).toEqual([]);
        });

        it('returns an empty array if the settings string is empty', () => {
            const settingsString = "";
            expect(parseSettingsString(settingsString)).toEqual([]);
        });

        it('throws an error message if the settings string is not a valid JSON', () => {
            const settingsString = "not a valid JSON";
            expect(() => parseSettingsString(settingsString)).toThrow('Settings string contains invalid JSON');
        });
    });

    describe('#obfuscateData', () => {
        describe('primitives', () => {
            it('should replace string values with "string"', () => {
                expect(obfuscateData('user@email.com')).toBe('string');
                expect(obfuscateData('John Doe')).toBe('string');
                expect(obfuscateData('')).toBe('string');
            });

            it('should replace number values with "number"', () => {
                expect(obfuscateData(42)).toBe('number');
                expect(obfuscateData(0)).toBe('number');
                expect(obfuscateData(-123.456)).toBe('number');
                expect(obfuscateData(NaN)).toBe('number');
                expect(obfuscateData(Infinity)).toBe('number');
            });

            it('should replace boolean values with "boolean"', () => {
                expect(obfuscateData(true)).toBe('boolean');
                expect(obfuscateData(false)).toBe('boolean');
            });

            it('should preserve null', () => {
                expect(obfuscateData(null)).toBe(null);
            });

            it('should preserve undefined', () => {
                expect(obfuscateData(undefined)).toBe(undefined);
            });

            it('should replace function values with "function"', () => {
                const fn = () => {};
                expect(obfuscateData(fn)).toBe('function');
            });
        });

        describe('objects', () => {
            it('should obfuscate flat objects', () => {
                const input = {
                    email: 'user@email.com',
                    age: 30,
                    verified: true,
                };

                expect(obfuscateData(input)).toEqual({
                    email: 'string',
                    age: 'number',
                    verified: 'boolean',
                });
            });

            it('should recursively obfuscate nested objects', () => {
                const input = {
                    user: {
                        name: 'John Doe',
                        age: 30,
                        address: {
                            street: '123 Main St',
                            city: 'Springfield',
                        },
                    },
                };

                expect(obfuscateData(input)).toEqual({
                    user: {
                        name: 'string',
                        age: 'number',
                        address: {
                            street: 'string',
                            city: 'string',
                        },
                    },
                });
            });

            it('should preserve null values in objects', () => {
                const input = {
                    name: 'John',
                    metadata: null,
                    age: 30,
                };

                expect(obfuscateData(input)).toEqual({
                    name: 'string',
                    metadata: null,
                    age: 'number',
                });
            });

            it('should handle empty objects', () => {
                expect(obfuscateData({})).toEqual({});
            });
        });

        describe('arrays', () => {
            it('should obfuscate arrays of primitives', () => {
                expect(obfuscateData(['premium', 'verified'])).toEqual(['string', 'string']);
                expect(obfuscateData([1, 2, 3])).toEqual(['number', 'number', 'number']);
                expect(obfuscateData([true, false])).toEqual(['boolean', 'boolean']);
            });

            it('should obfuscate arrays of objects', () => {
                const input = [
                    { id: 123, name: 'Product A' },
                    { id: 456, name: 'Product B' },
                ];

                expect(obfuscateData(input)).toEqual([
                    { id: 'number', name: 'string' },
                    { id: 'number', name: 'string' },
                ]);
            });

            it('should handle arrays with mixed types', () => {
                const input = ['text', 42, true, null, undefined];

                expect(obfuscateData(input)).toEqual(['string', 'number', 'boolean', null, undefined]);
            });

            it('should recursively obfuscate nested arrays', () => {
                const input = [
                    ['a', 'b'],
                    ['c', 'd'],
                ];

                expect(obfuscateData(input)).toEqual([
                    ['string', 'string'],
                    ['string', 'string'],
                ]);
            });

            it('should handle empty arrays', () => {
                expect(obfuscateData([])).toEqual([]);
            });
        });

        describe('complex nested structures', () => {
            it('should obfuscate complex event-like structures', () => {
                const input = {
                    eventName: 'purchase',
                    user: {
                        email: 'user@email.com',
                        age: 30,
                        verified: true,
                        metadata: null,
                    },
                    tags: ['premium', 'verified'],
                    items: [
                        { id: 123, name: 'Product A', price: 29.99 },
                        { id: 456, name: 'Product B', price: 49.99 },
                    ],
                };

                expect(obfuscateData(input)).toEqual({
                    eventName: 'string',
                    user: {
                        email: 'string',
                        age: 'number',
                        verified: 'boolean',
                        metadata: null,
                    },
                    tags: ['string', 'string'],
                    items: [
                        { id: 'number', name: 'string', price: 'number' },
                        { id: 'number', name: 'string', price: 'number' },
                    ],
                });
            });

            it('should handle objects with arrays of nested objects', () => {
                const input = {
                    users: [
                        {
                            name: 'John',
                            contacts: [
                                { type: 'email', value: 'john@email.com' },
                                { type: 'phone', value: '555-1234' },
                            ],
                        },
                        {
                            name: 'Jane',
                            contacts: [
                                { type: 'email', value: 'jane@email.com' },
                            ],
                        },
                    ],
                };

                expect(obfuscateData(input)).toEqual({
                    users: [
                        {
                            name: 'string',
                            contacts: [
                                { type: 'string', value: 'string' },
                                { type: 'string', value: 'string' },
                            ],
                        },
                        {
                            name: 'string',
                            contacts: [
                                { type: 'string', value: 'string' },
                            ],
                        },
                    ],
                });
            });
        });

        describe('edge cases', () => {
            it('should handle objects with special values', () => {
                const input = {
                    nan: NaN,
                    infinity: Infinity,
                    negativeInfinity: -Infinity,
                };

                expect(obfuscateData(input)).toEqual({
                    nan: 'number',
                    infinity: 'number',
                    negativeInfinity: 'number',
                });
            });

            it('should not mutate the original object', () => {
                const input = {
                    email: 'user@email.com',
                    age: 30,
                };

                const original = { ...input };
                obfuscateData(input);

                expect(input).toEqual(original);
            });

            it('should not mutate the original array', () => {
                const input = ['test', 123, true];
                const original = [...input];

                obfuscateData(input);

                expect(input).toEqual(original);
            });
        });
    });

    describe('#obfuscateDevData', () => {
        it('returns data as-is when isDevelopmentMode is true', () => {
            expect(obfuscateDevData('sensitive', true)).toBe('sensitive');
            expect(obfuscateDevData(42, true)).toBe(42);
            expect(obfuscateDevData(null, true)).toBe(null);
            expect(obfuscateDevData(undefined, true)).toBe(undefined);

            const obj = { email: 'user@test.com', age: 30 };
            expect(obfuscateDevData(obj, true)).toBe(obj);
            expect(obfuscateDevData(obj, true)).toEqual({ email: 'user@test.com', age: 30 });

            const arr = [1, 'two', true];
            expect(obfuscateDevData(arr, true)).toBe(arr);
            expect(obfuscateDevData(arr, true)).toEqual([1, 'two', true]);
        });

        it('returns obfuscated data when isDevelopmentMode is false', () => {
            expect(obfuscateDevData('sensitive', false)).toBe('string');
            expect(obfuscateDevData(42, false)).toBe('number');
            expect(obfuscateDevData(null, false)).toBe(null);
            expect(obfuscateDevData(undefined, false)).toBe(undefined);

            const obj = { email: 'user@test.com', age: 30 };
            expect(obfuscateDevData(obj, false)).toEqual({
                email: 'string',
                age: 'number',
            });

            expect(obfuscateDevData([1, 'two', true], false)).toEqual(['number', 'string', 'boolean']);
        });

        it('treats undefined isDevelopmentMode as false and returns obfuscated data', () => {
            expect(obfuscateDevData({ email: 'a@b.com' }, undefined)).toEqual({ email: 'string' });
        });
    });
});