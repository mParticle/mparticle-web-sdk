// Base64 encoder/decoder - http://www.webtoolkit.info/javascript_base64.html
const Base64 = {
    _keyStr:
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',

    // Input must be a string
    encode: function encode(input: string): string {
        try {
            if (window.btoa && window.atob) {
                return window.btoa(unescape(encodeURIComponent(input)));
            }
        } catch (e) {
            console.error('Error encoding cookie values into Base64:' + e);
        }
        return this._encode(input);
    },

    _encode: function _encode(input: string): string {
        let output = '';
        let chr1: number, chr2: number, chr3: number, enc1: number, enc2: number, enc3: number, enc4: number;
        let i = 0;

        input = UTF8.encode(input);

        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output =
                output +
                Base64._keyStr.charAt(enc1) +
                Base64._keyStr.charAt(enc2) +
                Base64._keyStr.charAt(enc3) +
                Base64._keyStr.charAt(enc4);
        }
        return output;
    },

    decode: function decode(input: string): string {
        try {
            if (window.btoa && window.atob) {
                return decodeURIComponent(escape(window.atob(input)));
            }
        } catch (e) {
            //log(e);
        }
        return Base64._decode(input);
    },

    _decode: function _decode(input: string): string {
        let output = '';
        let chr1: number, chr2: number, chr3: number;
        let enc1: number, enc2: number, enc3: number, enc4: number;
        let i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

        while (i < input.length) {
            enc1 = Base64._keyStr.indexOf(input.charAt(i++));
            enc2 = Base64._keyStr.indexOf(input.charAt(i++));
            enc3 = Base64._keyStr.indexOf(input.charAt(i++));
            enc4 = Base64._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 !== 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 !== 64) {
                output = output + String.fromCharCode(chr3);
            }
        }
        output = UTF8.decode(output);
        return output;
    },
};

const UTF8 = {
    encode: function encode(s: string): string {
        let utftext = '';

        for (let n = 0; n < s.length; n++) {
            const c = s.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if (c > 127 && c < 2048) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    },

    decode: function decode(utftext: string): string {
        let s = '';
        let i = 0;
        let c = 0,
            c1 = 0,
            c2 = 0;

        while (i < utftext.length) {
            c = utftext.charCodeAt(i);
            if (c < 128) {
                s += String.fromCharCode(c);
                i++;
            } else if (c > 191 && c < 224) {
                c1 = utftext.charCodeAt(i + 1);
                s += String.fromCharCode(((c & 31) << 6) | (c1 & 63));
                i += 2;
            } else {
                c1 = utftext.charCodeAt(i + 1);
                c2 = utftext.charCodeAt(i + 2);
                s += String.fromCharCode(
                    ((c & 15) << 12) | ((c1 & 63) << 6) | (c2 & 63)
                );
                i += 3;
            }
        }
        return s;
    },
};

// forEach polyfill
// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.io/#x15.4.4.18
function polyfillForEach(this: unknown, callback: Function, thisArg?: unknown): void {
    let T: unknown, k: number;

    if (this == null) {
        throw new TypeError(' this is null or not defined');
    }

    const O = Object(this);
    const len = O.length >>> 0;

    if (typeof callback !== 'function') {
        throw new TypeError(callback + ' is not a function');
    }

    if (arguments.length > 1) {
        T = thisArg;
    }

    k = 0;

    while (k < len) {
        let kValue: unknown;
        if (k in O) {
            kValue = O[k];
            callback.call(T, kValue, k, O);
        }
        k++;
    }
}

// map polyfill
// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.io/#x15.4.4.19
function polyfillMap(this: unknown, callback: Function, thisArg?: unknown): unknown[] {
    let T: unknown, k: number;

    if (this === null) {
        throw new TypeError(' this is null or not defined');
    }

    const O = Object(this);
    const len = O.length >>> 0;

    if (typeof callback !== 'function') {
        throw new TypeError(callback + ' is not a function');
    }

    if (arguments.length > 1) {
        T = thisArg;
    }

    const A = new Array(len);

    k = 0;

    while (k < len) {
        let kValue: unknown, mappedValue: unknown;
        if (k in O) {
            kValue = O[k];
            mappedValue = callback.call(T, kValue, k, O);
            A[k] = mappedValue;
        }
        k++;
    }

    return A;
}

// filter polyfill
// Prodcution steps of ECMA-262, Edition 5
// Reference: http://es5.github.io/#x15.4.4.20
function polyfillFilter(this: unknown, fun: Function /*, thisArg*/): unknown[] {
    'use strict';

    if (this === void 0 || this === null) {
        throw new TypeError();
    }

    const t = Object(this);
    const len = t.length >>> 0;
    if (typeof fun !== 'function') {
        throw new TypeError();
    }

    const res: unknown[] = [];
    const thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for (let i = 0; i < len; i++) {
        if (i in t) {
            const val = t[i];
            if (fun.call(thisArg, val, i, t)) {
                res.push(val);
            }
        }
    }

    return res;
}

export default {
    forEach: polyfillForEach as typeof Array.prototype.forEach,

    // map polyfill
    // Production steps of ECMA-262, Edition 5, 15.4.4.19
    // Reference: http://es5.github.io/#x15.4.4.19
    map: polyfillMap as typeof Array.prototype.map,

    // filter polyfill
    // Prodcution steps of ECMA-262, Edition 5
    // Reference: http://es5.github.io/#x15.4.4.20
    filter: polyfillFilter as typeof Array.prototype.filter,

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
    isArray: function(arg: unknown): boolean {
        return Object.prototype.toString.call(arg) === '[object Array]';
    },

    Base64: Base64,
};
