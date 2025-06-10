import { MPID } from '@mparticle/web-sdk';
import Constants from './constants';
import { SDKInitConfig } from './sdkRuntimeModels';
import { IKitConfigs } from './configAPIClient';

const { Messages } = Constants;

type valueof<T> = T[keyof T];

// Placeholder for Dictionary-like Types
export type Dictionary<V = any> = Record<string, V>;

export type Environment = valueof<typeof Constants.Environment>;

const createCookieString = (value: string): string =>
    replaceCommasWithPipes(replaceQuotesWithApostrophes(value));

const revertCookieString = (value: string): string =>
    replacePipesWithCommas(replaceApostrophesWithQuotes(value));

const inArray = (items: any[], name: any): boolean => {
    if (!items) {
        return false;
    }

    let i = 0;

    if (Array.prototype.indexOf) {
        return items.indexOf(name, 0) >= 0;
    } else {
        for (let n = items.length; i < n; i++) {
            if (i in items && items[i] === name) {
                return true;
            }
        }
    }

    return false;
};

const findKeyInObject = (obj: any, key: string): string => {
    if (key && obj) {
        for (const prop in obj) {
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
    alternateMethod: string,
): string => {
    const messageArray: string[] = [
        methodName,
        Messages.DeprecationMessages.MethodIsDeprecatedPostfix,
    ];

    if (alternateMethod) {
        messageArray.push(alternateMethod);
        messageArray.push(
            Messages.DeprecationMessages.MethodIsDeprecatedPostfix,
        );
    }

    return messageArray.join(' ');
};

function generateHash(name: string): number {
    let hash = 0;
    let character: number;

    if (name === undefined || name === null) {
        return 0;
    }

    name = name.toString().toLowerCase();

    if (Array.prototype.reduce) {
        return name.split('').reduce(function (a: number, b: string) {
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

const generateUniqueId = (a = ''): string =>
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
              generateUniqueId, // random hex digits
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
    const objType = Object.prototype.toString.call(value);
    return objType === '[object Object]' || objType === '[object Error]';
};

const parseNumber = (value: string | number): number => {
    if (isNaN(value as number) || !isFinite(value as number)) {
        return 0;
    }
    const floatValue = parseFloat(value as string);
    return isNaN(floatValue) ? 0 : floatValue;
};

const parseSettingsString = (settingsString: string): Dictionary<string>[] => {
    try {
        return settingsString
            ? JSON.parse(settingsString.replace(/&quot;/g, '"'))
            : [];
    } catch (error) {
        throw new Error('Settings string contains invalid JSON');
    }
};

const parseStringOrNumber = (
    value: string | number,
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

const replaceMPID = (value: string, mpid: MPID): string =>
    value.replace('%%mpid%%', mpid);

const replaceAmpWithAmpersand = (value: string): string =>
    value.replace(/&amp;/g, '&');

const createCookieSyncUrl = (
    mpid: MPID,
    pixelUrl: string,
    redirectUrl?: string,
): string => {
    const modifiedPixelUrl = replaceAmpWithAmpersand(pixelUrl);
    const modifiedDirectUrl = redirectUrl
        ? replaceAmpWithAmpersand(redirectUrl)
        : null;

    const url = replaceMPID(modifiedPixelUrl, mpid);
    const redirect = modifiedDirectUrl
        ? replaceMPID(modifiedDirectUrl, mpid)
        : '';
    return url + encodeURIComponent(redirect);
};

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
        s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
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
    keys: string[] = [],
): Dictionary<string> => {
    let urlParams: URLSearchParams | URLSearchParamsFallback;
    const results: Dictionary<string> = {};
    const lowerCaseUrlParams: Dictionary<string> = {};

    if (!url) return results;

    if (typeof URL !== 'undefined' && typeof URLSearchParams !== 'undefined') {
        const urlObject = new URL(url);
        urlParams = new URLSearchParams(urlObject.search);
    } else {
        urlParams = queryStringParserFallback(url);
    }

    urlParams.forEach((value, key) => {
        lowerCaseUrlParams[key.toLowerCase()] = value;
    });

    if (isEmpty(keys)) {
        return lowerCaseUrlParams;
    } else {
        keys.forEach((key) => {
            const value = lowerCaseUrlParams[key.toLowerCase()];
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
    const params: Dictionary<string> = {};
    const queryString = url.split('?')[1] || '';
    const pairs = queryString.split('&');

    pairs.forEach((pair) => {
        const [key, ...valueParts] = pair.split('=');
        const value = valueParts.join('=');
        if (key && value !== undefined) {
            try {
                params[key] = decodeURIComponent(value || '');
            } catch (e) {
                console.error(`Failed to decode value for key ${key}: ${e}`);
            }
        }
    });

    return {
        get: function (key: string) {
            return params[key];
        },
        forEach: function (callback: (value: string, key: string) => void) {
            for (const key in params) {
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
        try {
            if (typeof window === 'undefined') {
                return [];
            }
            return window.document.cookie
                .split(';')
                .map((cookie) => cookie.trim());
        } catch (e) {
            console.error('Unable to parse cookies', e);
            return [];
        }
    };

    // Helper function to filter cookies by keys
    const filterCookies = (
        cookies: string[],
        keys?: string[],
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

const filterDictionaryWithHash = <T>(
    dictionary: Dictionary<T>,
    filterList: any[],
    hashFn: (key: string) => any,
): Dictionary<T> => {
    const filtered = {};

    if (!isEmpty(dictionary)) {
        for (const key in dictionary) {
            if (dictionary.hasOwnProperty(key)) {
                const hashedKey = hashFn(key);
                if (!inArray(filterList, hashedKey)) {
                    filtered[key] = dictionary[key];
                }
            }
        }
    }

    return filtered;
};

const parseConfig = (
    config: SDKInitConfig,
    moduleName: string,
    moduleId: number,
): IKitConfigs | null => {
    return (
        config.kitConfigs?.find(
            (kitConfig: IKitConfigs) =>
                kitConfig.name === moduleName &&
                kitConfig.moduleId === moduleId,
        ) || null
    );
};

export {
    createCookieString,
    revertCookieString,
    createCookieSyncUrl,
    valueof,
    converted,
    decoded,
    filterDictionaryWithHash,
    findKeyInObject,
    generateDeprecationMessage,
    generateHash,
    generateUniqueId,
    getRampNumber,
    inArray,
    isObject,
    isStringOrNumber,
    parseConfig,
    parseNumber,
    parseSettingsString,
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
    replaceMPID,
    replaceAmpWithAmpersand,
};
