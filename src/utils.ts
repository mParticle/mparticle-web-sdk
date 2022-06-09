type valueof<T> = T[keyof T];

const inArray = (items: any[], name: string): boolean => {
    const i = 0;

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

export {
    valueof,
    converted,
    decoded,
    findKeyInObject,
    inArray,
    isObject,
    parseNumber,
    returnConvertedBoolean,
};
