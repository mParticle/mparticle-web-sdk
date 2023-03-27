import slugify from 'slugify';

type valueof<T> = T[keyof T];

// Placeholder for Dictionary-like Types
export type Dictionary<V = any> = Record<string, V>;

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

function generateHash(name: string): number {
    let hash: number = 0;
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
const isFunction = (fn: any): boolean => typeof fn === 'function';

// TODO: Refactor this to a regex
const isDataPlanSlug = (str: string): boolean =>
    isString(str) && str === slugify(str);

const isStringOrNumber = (value: any): boolean =>
    isString(value) || isNumber(value);

const isEmpty = (value: Dictionary<any> | null | undefined): boolean =>
    value == null || !(Object.keys(value) || value).length;

export {
    valueof,
    converted,
    decoded,
    findKeyInObject,
    generateHash,
    generateUniqueId,
    getRampNumber,
    inArray,
    isObject,
    isStringOrNumber,
    parseNumber,
    parseStringOrNumber,
    returnConvertedBoolean,
    isString,
    isNumber,
    isFunction,
    isDataPlanSlug,
    isEmpty,
};
