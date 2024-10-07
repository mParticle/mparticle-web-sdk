import Constants from './constants';

const { Messages } = Constants;

type valueof<T> = T[keyof T];

// Placeholder for Dictionary-like Types
export type Dictionary<V = any> = Record<string, V>;

export type Environment = 'development' | 'production';

const createCookieString = (value: string): string =>
    replaceCommasWithPipes(replaceQuotesWithApostrophes(value));

const revertCookieString = (value: string): string =>
    replacePipesWithCommas(replaceApostrophesWithQuotes(value));

const inArray = (items: any[], name: string): boolean => {
    let i = 0;

    if (Array.prototype.indexOf) {
        return items.indexOf(name, 0) >= 0;
    } else {
        for (var n = items.length; i < n; i++) {
            if (i in items && items[i] === name) {
                return true;
            }
        }
    }

    return false;
};

const findKeyInObject = (obj: any, key: string): string => {
    if (key && obj) {
        for (var prop in obj) {
            if (
                obj.hasOwnProperty(prop) &&
                prop.toLowerCase() === key.toLowerCase()
            ) {
                return prop;
            }
        }
    }

    return null;
};

const generateDeprecationMessage = (
    methodName: string,
    alternateMethod: string
): string => {
    const messageArray: string[] = [
        methodName,
        Messages.DeprecationMessages.MethodIsDeprecatedPostfix,
    ];

    if (alternateMethod) {
        messageArray.push(alternateMethod);
        messageArray.push(
            Messages.DeprecationMessages.MethodIsDeprecatedPostfix
        );
    }

    return messageArray.join(' ');
};

function generateHash(name: string): number {
    let hash: number = 0;
    let character: number;

    if (name === undefined || name === null) {
        return 0;
    }

    name = name.toString().toLowerCase();

    if (Array.prototype.reduce) {
        return name.split('').reduce(function(a: number, b: string) {
            a = (a << 5) - a + b.charCodeAt(0);
            return a & a;
        }, 0);
    }

    if (name.length === 0) {
        return hash;
    }

    for (let i = 0; i < name.length; i++) {
        character = name.charCodeAt(i);
        hash = (hash << 5) - hash + character;
        hash = hash & hash;
    }

    return hash;
}

const generateRandomValue = (value?: string): string => {
    let randomValue: string;
    let a: number;

    if (window.crypto && window.crypto.getRandomValues) {
        // @ts-ignore
        randomValue = window.crypto.getRandomValues(new Uint8Array(1)); // eslint-disable-line no-undef
    }
    if (randomValue) {
        // @ts-ignore
        return (a ^ (randomValue[0] % 16 >> (a / 4))).toString(16);
    }

    return (a ^ ((Math.random() * 16) >> (a / 4))).toString(16);
};

const generateUniqueId = (a: string = ''): string =>
    // https://gist.github.com/jed/982883
    // Added support for crypto for better random

    a // if the placeholder was passed, return
        ? generateRandomValue(a) // if the placeholder was passed, return
        : // [1e7] -> // 10000000 +
          // -1e3  -> // -1000 +
          // -4e3  -> // -4000 +
          // -8e3  -> // -80000000 +
          // -1e11 -> //-100000000000,
          `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(
              /[018]/g, // zeroes, ones, and eights with
              generateUniqueId // random hex digits
          );

/**
 * Returns a value between 1-100 inclusive.
 */
const getRampNumber = (value?: string): number => {
    if (!value) {
        return 100;
    }

    const hash = generateHash(value);

    return Math.abs(hash % 100) + 1;
};

const isObject = (value: any): boolean => {
    var objType = Object.prototype.toString.call(value);
    return objType === '[object Object]' || objType === '[object Error]';
};

const parseNumber = (value: string | number): number => {
    if (isNaN(value as number) || !isFinite(value as number)) {
        return 0;
    }
    var floatValue = parseFloat(value as string);
    return isNaN(floatValue) ? 0 : floatValue;
};

const parseStringOrNumber = (
    value: string | number
): string | number | null => {
    if (isStringOrNumber(value)) {
        return value;
    } else {
        return null;
    }
};

const replaceCommasWithPipes = (value: string): string =>
    value.replace(/,/g, '|');

const replacePipesWithCommas = (value: string): string =>
    value.replace(/\|/g, ',');

const replaceApostrophesWithQuotes = (value: string): string =>
    value.replace(/\'/g, '"');

const replaceQuotesWithApostrophes = (value: string): string =>
    value.replace(/\"/g, "'");

// FIXME: REFACTOR for V3
// only used in store.js to sanitize server-side formatting of
// booleans when checking for `isDevelopmentMode`
// Should be removed in v3
const returnConvertedBoolean = (data: string | boolean | number) => {
    if (data === 'false' || data === '0') {
        return false;
    } else {
        return Boolean(data);
    }
};

const decoded = (s: string): string =>
    decodeURIComponent(s.replace(/\+/g, ' '));

const converted = (s: string): string => {
    if (s.indexOf('"') === 0) {
        s = s
            .slice(1, -1)
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
    }

    return s;
};

const isString = (value: any): boolean => typeof value === 'string';
const isNumber = (value: any): boolean => typeof value === 'number';
const isBoolean = (value: any): boolean => typeof value === 'boolean';
const isFunction = (fn: any): boolean => typeof fn === 'function';
const isValidCustomFlagProperty = (value: any): boolean =>
    isNumber(value) || isString(value) || isBoolean(value);

const toDataPlanSlug = (value: any): string =>
    // Make sure we are only acting on strings or numbers
    isStringOrNumber(value)
        ? value
              .toString()
              .toLowerCase()
              .replace(/[^0-9a-zA-Z]+/g, '_')
        : '';

const isDataPlanSlug = (str: string): boolean => str === toDataPlanSlug(str);

const isStringOrNumber = (value: any): boolean =>
    isString(value) || isNumber(value);

const isEmpty = (value: Dictionary<any> | string | null | undefined): boolean =>
    value == null || !(Object.keys(value) || value).length;

const mergeObjects = <T extends object>(...objects: T[]): T => {
    return Object.assign({}, ...objects);
};

const moveElementToEnd = <T>(array: T[], index: number): T[] =>
    array.slice(0, index).concat(array.slice(index + 1), array[index]);

const queryStringParser = (
    url: string,
    keys: string[] = []
): Dictionary<string> => {
    let urlParams: URLSearchParams | URLSearchParamsFallback;
    let results: Dictionary<string> = {};

    if (!url) return results;

    if (typeof URL !== 'undefined' && typeof URLSearchParams !== 'undefined') {
        const urlObject = new URL(url);
        urlParams = new URLSearchParams(urlObject.search);
    } else {
        urlParams = queryStringParserFallback(url);
    }

    if (isEmpty(keys)) {
        urlParams.forEach((value, key) => {
            results[key] = value;
        });
    } else {
        keys.forEach(key => {
            const value = urlParams.get(key);
            if (value) {
                results[key] = value;
            }
        });
    }

    return results;
};

interface URLSearchParamsFallback {
    get: (key: string) => string | null;
    forEach: (callback: (value: string, key: string) => void) => void;
}

const queryStringParserFallback = (url: string): URLSearchParamsFallback => {
    let params: Dictionary<string> = {};
    const queryString = url.split('?')[1] || '';
    const pairs = queryString.split('&');

    pairs.forEach(pair => {
        var [key, value] = pair.split('=');
        if (key && value) {
            params[key] = decodeURIComponent(value || '');
        }
    });

    return {
        get: function(key: string) {
            return params[key];
        },
        forEach: function(callback: (value: string, key: string) => void) {
            for (var key in params) {
                if (params.hasOwnProperty(key)) {
                    callback(params[key], key);
                }
            }
        },
    };
};

// Get cookies as a dictionary
const getCookies = (keys?: string[]): Dictionary<string> => {
    // Helper function to parse cookies from document.cookie
    const parseCookies = (): string[] => {
        if (typeof window === 'undefined') {
            return [];
        }
        return window.document.cookie.split(';').map(cookie => cookie.trim());
    };

    // Helper function to filter cookies by keys
    const filterCookies = (
        cookies: string[],
        keys?: string[]
    ): Dictionary<string> => {
        const results: Dictionary<string> = {};
        for (const cookie of cookies) {
            const [key, value] = cookie.split('=');
            if (!keys || keys.includes(key)) {
                results[key] = value;
            }
        }
        return results;
    };

    // Parse cookies from document.cookie
    const parsedCookies: string[] = parseCookies();

    // Filter cookies by keys if provided
    return filterCookies(parsedCookies, keys);
};

const getHref = (): string => {
    return typeof window !== 'undefined' && window.location
        ? window.location.href
        : '';
};

export {
    createCookieString,
    revertCookieString,
    valueof,
    converted,
    decoded,
    findKeyInObject,
    generateDeprecationMessage,
    generateHash,
    generateUniqueId,
    getRampNumber,
    inArray,
    isObject,
    isStringOrNumber,
    parseNumber,
    parseStringOrNumber,
    replaceCommasWithPipes,
    replacePipesWithCommas,
    replaceApostrophesWithQuotes,
    replaceQuotesWithApostrophes,
    returnConvertedBoolean,
    toDataPlanSlug,
    isString,
    isNumber,
    isFunction,
    isDataPlanSlug,
    isEmpty,
    isValidCustomFlagProperty,
    mergeObjects,
    moveElementToEnd,
    queryStringParser,
    getCookies,
    getHref,
};
