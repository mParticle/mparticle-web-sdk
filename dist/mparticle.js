var mParticle = (function () {

    // Base64 encoder/decoder - http://www.webtoolkit.info/javascript_base64.html
    var Base64$1 = {
      _keyStr: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
      // Input must be a string
      encode: function encode(input) {
        try {
          if (window.btoa && window.atob) {
            return window.btoa(unescape(encodeURIComponent(input)));
          }
        } catch (e) {
          console.error('Error encoding cookie values into Base64:' + e);
        }
        return this._encode(input);
      },
      _encode: function _encode(input) {
        var output = '';
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        input = UTF8.encode(input);
        while (i < input.length) {
          chr1 = input.charCodeAt(i++);
          chr2 = input.charCodeAt(i++);
          chr3 = input.charCodeAt(i++);
          enc1 = chr1 >> 2;
          enc2 = (chr1 & 3) << 4 | chr2 >> 4;
          enc3 = (chr2 & 15) << 2 | chr3 >> 6;
          enc4 = chr3 & 63;
          if (isNaN(chr2)) {
            enc3 = enc4 = 64;
          } else if (isNaN(chr3)) {
            enc4 = 64;
          }
          output = output + Base64$1._keyStr.charAt(enc1) + Base64$1._keyStr.charAt(enc2) + Base64$1._keyStr.charAt(enc3) + Base64$1._keyStr.charAt(enc4);
        }
        return output;
      },
      decode: function decode(input) {
        try {
          if (window.btoa && window.atob) {
            return decodeURIComponent(escape(window.atob(input)));
          }
        } catch (e) {
          //log(e);
        }
        return Base64$1._decode(input);
      },
      _decode: function _decode(input) {
        var output = '';
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
        while (i < input.length) {
          enc1 = Base64$1._keyStr.indexOf(input.charAt(i++));
          enc2 = Base64$1._keyStr.indexOf(input.charAt(i++));
          enc3 = Base64$1._keyStr.indexOf(input.charAt(i++));
          enc4 = Base64$1._keyStr.indexOf(input.charAt(i++));
          chr1 = enc1 << 2 | enc2 >> 4;
          chr2 = (enc2 & 15) << 4 | enc3 >> 2;
          chr3 = (enc3 & 3) << 6 | enc4;
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
      }
    };
    var UTF8 = {
      encode: function encode(s) {
        var utftext = '';
        for (var n = 0; n < s.length; n++) {
          var c = s.charCodeAt(n);
          if (c < 128) {
            utftext += String.fromCharCode(c);
          } else if (c > 127 && c < 2048) {
            utftext += String.fromCharCode(c >> 6 | 192);
            utftext += String.fromCharCode(c & 63 | 128);
          } else {
            utftext += String.fromCharCode(c >> 12 | 224);
            utftext += String.fromCharCode(c >> 6 & 63 | 128);
            utftext += String.fromCharCode(c & 63 | 128);
          }
        }
        return utftext;
      },
      decode: function decode(utftext) {
        var s = '';
        var i = 0;
        var c = 0,
          c1 = 0,
          c2 = 0;
        while (i < utftext.length) {
          c = utftext.charCodeAt(i);
          if (c < 128) {
            s += String.fromCharCode(c);
            i++;
          } else if (c > 191 && c < 224) {
            c1 = utftext.charCodeAt(i + 1);
            s += String.fromCharCode((c & 31) << 6 | c1 & 63);
            i += 2;
          } else {
            c1 = utftext.charCodeAt(i + 1);
            c2 = utftext.charCodeAt(i + 2);
            s += String.fromCharCode((c & 15) << 12 | (c1 & 63) << 6 | c2 & 63);
            i += 3;
          }
        }
        return s;
      }
    };
    var Polyfill = {
      // forEach polyfill
      // Production steps of ECMA-262, Edition 5, 15.4.4.18
      // Reference: http://es5.github.io/#x15.4.4.18
      forEach: function forEach(callback, thisArg) {
        var T, k;
        if (this == null) {
          throw new TypeError(' this is null or not defined');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        if (typeof callback !== 'function') {
          throw new TypeError(callback + ' is not a function');
        }
        if (arguments.length > 1) {
          T = thisArg;
        }
        k = 0;
        while (k < len) {
          var kValue;
          if (k in O) {
            kValue = O[k];
            callback.call(T, kValue, k, O);
          }
          k++;
        }
      },
      // map polyfill
      // Production steps of ECMA-262, Edition 5, 15.4.4.19
      // Reference: http://es5.github.io/#x15.4.4.19
      map: function map(callback, thisArg) {
        var T, A, k;
        if (this === null) {
          throw new TypeError(' this is null or not defined');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        if (typeof callback !== 'function') {
          throw new TypeError(callback + ' is not a function');
        }
        if (arguments.length > 1) {
          T = thisArg;
        }
        A = new Array(len);
        k = 0;
        while (k < len) {
          var kValue, mappedValue;
          if (k in O) {
            kValue = O[k];
            mappedValue = callback.call(T, kValue, k, O);
            A[k] = mappedValue;
          }
          k++;
        }
        return A;
      },
      // filter polyfill
      // Prodcution steps of ECMA-262, Edition 5
      // Reference: http://es5.github.io/#x15.4.4.20
      filter: function filter(fun /*, thisArg*/) {

        if (this === void 0 || this === null) {
          throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun !== 'function') {
          throw new TypeError();
        }
        var res = [];
        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++) {
          if (i in t) {
            var val = t[i];
            if (fun.call(thisArg, val, i, t)) {
              res.push(val);
            }
          }
        }
        return res;
      },
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
      isArray: function isArray(arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
      },
      Base64: Base64$1
    };

    function _typeof$1(o) {
      "@babel/helpers - typeof";

      return _typeof$1 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
        return typeof o;
      } : function (o) {
        return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
      }, _typeof$1(o);
    }

    function _toPrimitive(input, hint) {
      if (_typeof$1(input) !== "object" || input === null) return input;
      var prim = input[Symbol.toPrimitive];
      if (prim !== undefined) {
        var res = prim.call(input, hint || "default");
        if (_typeof$1(res) !== "object") return res;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return (hint === "string" ? String : Number)(input);
    }

    function _toPropertyKey(arg) {
      var key = _toPrimitive(arg, "string");
      return _typeof$1(key) === "symbol" ? key : String(key);
    }

    function _defineProperty(obj, key, value) {
      key = _toPropertyKey(key);
      if (key in obj) {
        Object.defineProperty(obj, key, {
          value: value,
          enumerable: true,
          configurable: true,
          writable: true
        });
      } else {
        obj[key] = value;
      }
      return obj;
    }

    var EventTypeEnum;
    (function (EventTypeEnum) {
      EventTypeEnum[EventTypeEnum["Unknown"] = 0] = "Unknown";
      EventTypeEnum[EventTypeEnum["Navigation"] = 1] = "Navigation";
      EventTypeEnum[EventTypeEnum["Location"] = 2] = "Location";
      EventTypeEnum[EventTypeEnum["Search"] = 3] = "Search";
      EventTypeEnum[EventTypeEnum["Transaction"] = 4] = "Transaction";
      EventTypeEnum[EventTypeEnum["UserContent"] = 5] = "UserContent";
      EventTypeEnum[EventTypeEnum["UserPreference"] = 6] = "UserPreference";
      EventTypeEnum[EventTypeEnum["Social"] = 7] = "Social";
      EventTypeEnum[EventTypeEnum["Other"] = 8] = "Other";
      EventTypeEnum[EventTypeEnum["Media"] = 9] = "Media";
    })(EventTypeEnum || (EventTypeEnum = {}));
    // TODO: https://mparticle-eng.atlassian.net/browse/SQDSDKS-5403
    var MessageType$2;
    (function (MessageType) {
      MessageType[MessageType["SessionStart"] = 1] = "SessionStart";
      MessageType[MessageType["SessionEnd"] = 2] = "SessionEnd";
      MessageType[MessageType["PageView"] = 3] = "PageView";
      MessageType[MessageType["PageEvent"] = 4] = "PageEvent";
      MessageType[MessageType["CrashReport"] = 5] = "CrashReport";
      MessageType[MessageType["OptOut"] = 6] = "OptOut";
      MessageType[MessageType["AppStateTransition"] = 10] = "AppStateTransition";
      MessageType[MessageType["Profile"] = 14] = "Profile";
      MessageType[MessageType["Commerce"] = 16] = "Commerce";
      MessageType[MessageType["UserAttributeChange"] = 17] = "UserAttributeChange";
      MessageType[MessageType["UserIdentityChange"] = 18] = "UserIdentityChange";
      MessageType[MessageType["Media"] = 20] = "Media";
    })(MessageType$2 || (MessageType$2 = {}));
    var IdentityType$1;
    (function (IdentityType) {
      IdentityType[IdentityType["Other"] = 0] = "Other";
      IdentityType[IdentityType["CustomerId"] = 1] = "CustomerId";
      IdentityType[IdentityType["Facebook"] = 2] = "Facebook";
      IdentityType[IdentityType["Twitter"] = 3] = "Twitter";
      IdentityType[IdentityType["Google"] = 4] = "Google";
      IdentityType[IdentityType["Microsoft"] = 5] = "Microsoft";
      IdentityType[IdentityType["Yahoo"] = 6] = "Yahoo";
      IdentityType[IdentityType["Email"] = 7] = "Email";
      IdentityType[IdentityType["FacebookCustomAudienceId"] = 9] = "FacebookCustomAudienceId";
      IdentityType[IdentityType["Other2"] = 10] = "Other2";
      IdentityType[IdentityType["Other3"] = 11] = "Other3";
      IdentityType[IdentityType["Other4"] = 12] = "Other4";
      IdentityType[IdentityType["Other5"] = 13] = "Other5";
      IdentityType[IdentityType["Other6"] = 14] = "Other6";
      IdentityType[IdentityType["Other7"] = 15] = "Other7";
      IdentityType[IdentityType["Other8"] = 16] = "Other8";
      IdentityType[IdentityType["Other9"] = 17] = "Other9";
      IdentityType[IdentityType["Other10"] = 18] = "Other10";
      IdentityType[IdentityType["MobileNumber"] = 19] = "MobileNumber";
      IdentityType[IdentityType["PhoneNumber2"] = 20] = "PhoneNumber2";
      IdentityType[IdentityType["PhoneNumber3"] = 21] = "PhoneNumber3";
    })(IdentityType$1 || (IdentityType$1 = {}));

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (g && (g = 0, op[0] && (_ = 0)), _) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    var version = "2.30.2";

    var Constants = {
      sdkVersion: version,
      sdkVendor: 'mparticle',
      platform: 'web',
      Messages: {
        DeprecationMessages: {
          MethodIsDeprecatedPostfix: 'is a deprecated method and will be removed in future releases',
          AlternativeMethodPrefix: 'Please use the alternate method:'
        },
        ErrorMessages: {
          NoToken: 'A token must be specified.',
          EventNameInvalidType: 'Event name must be a valid string value.',
          EventDataInvalidType: 'Event data must be a valid object hash.',
          LoggingDisabled: 'Event logging is currently disabled.',
          CookieParseError: 'Could not parse cookie',
          EventEmpty: 'Event object is null or undefined, cancelling send',
          APIRequestEmpty: 'APIRequest is null or undefined, cancelling send',
          NoEventType: 'Event type must be specified.',
          TransactionIdRequired: 'Transaction ID is required',
          TransactionRequired: 'A transaction attributes object is required',
          PromotionIdRequired: 'Promotion ID is required',
          BadAttribute: 'Attribute value cannot be object or array',
          BadKey: 'Key value cannot be object or array',
          BadLogPurchase: 'Transaction attributes and a product are both required to log a purchase, https://docs.mparticle.com/?javascript#measuring-transactions',
          AudienceAPINotEnabled: 'Your workspace is not enabled to retrieve user audiences.'
        },
        InformationMessages: {
          CookieSearch: 'Searching for cookie',
          CookieFound: 'Cookie found, parsing values',
          CookieNotFound: 'Cookies not found',
          CookieSet: 'Setting cookie',
          CookieSync: 'Performing cookie sync',
          SendBegin: 'Starting to send event',
          SendIdentityBegin: 'Starting to send event to identity server',
          SendWindowsPhone: 'Sending event to Windows Phone container',
          SendIOS: 'Calling iOS path: ',
          SendAndroid: 'Calling Android JS interface method: ',
          SendHttp: 'Sending event to mParticle HTTP service',
          SendAliasHttp: 'Sending alias request to mParticle HTTP service',
          SendIdentityHttp: 'Sending event to mParticle HTTP service',
          StartingNewSession: 'Starting new Session',
          StartingLogEvent: 'Starting to log event',
          StartingLogOptOut: 'Starting to log user opt in/out',
          StartingEndSession: 'Starting to end session',
          StartingInitialization: 'Starting to initialize',
          StartingLogCommerceEvent: 'Starting to log commerce event',
          StartingAliasRequest: 'Starting to Alias MPIDs',
          LoadingConfig: 'Loading configuration options',
          AbandonLogEvent: 'Cannot log event, logging disabled or developer token not set',
          AbandonAliasUsers: 'Cannot Alias Users, logging disabled or developer token not set',
          AbandonStartSession: 'Cannot start session, logging disabled or developer token not set',
          AbandonEndSession: 'Cannot end session, logging disabled or developer token not set',
          NoSessionToEnd: 'Cannot end session, no active session found'
        },
        ValidationMessages: {
          ModifyIdentityRequestUserIdentitiesPresent: 'identityRequests to modify require userIdentities to be present. Request not sent to server. Please fix and try again',
          IdentityRequesetInvalidKey: 'There is an invalid key on your identityRequest object. It can only contain a `userIdentities` object and a `onUserAlias` function. Request not sent to server. Please fix and try again.',
          OnUserAliasType: 'The onUserAlias value must be a function.',
          UserIdentities: 'The userIdentities key must be an object with keys of identityTypes and values of strings. Request not sent to server. Please fix and try again.',
          UserIdentitiesInvalidKey: 'There is an invalid identity key on your `userIdentities` object within the identityRequest. Request not sent to server. Please fix and try again.',
          UserIdentitiesInvalidValues: 'All user identity values must be strings or null. Request not sent to server. Please fix and try again.',
          AliasMissingMpid: 'Alias Request must contain both a destinationMpid and a sourceMpid',
          AliasNonUniqueMpid: "Alias Request's destinationMpid and sourceMpid must be unique",
          AliasMissingTime: 'Alias Request must have both a startTime and an endTime',
          AliasStartBeforeEndTime: "Alias Request's endTime must be later than its startTime"
        }
      },
      NativeSdkPaths: {
        LogEvent: 'logEvent',
        SetUserTag: 'setUserTag',
        RemoveUserTag: 'removeUserTag',
        SetUserAttribute: 'setUserAttribute',
        RemoveUserAttribute: 'removeUserAttribute',
        SetSessionAttribute: 'setSessionAttribute',
        AddToCart: 'addToCart',
        RemoveFromCart: 'removeFromCart',
        ClearCart: 'clearCart',
        LogOut: 'logOut',
        SetUserAttributeList: 'setUserAttributeList',
        RemoveAllUserAttributes: 'removeAllUserAttributes',
        GetUserAttributesLists: 'getUserAttributesLists',
        GetAllUserAttributes: 'getAllUserAttributes',
        Identify: 'identify',
        Logout: 'logout',
        Login: 'login',
        Modify: 'modify',
        Alias: 'aliasUsers',
        Upload: 'upload'
      },
      StorageNames: {
        localStorageName: 'mprtcl-api',
        localStorageNameV3: 'mprtcl-v3',
        cookieName: 'mprtcl-api',
        cookieNameV2: 'mprtcl-v2',
        cookieNameV3: 'mprtcl-v3',
        localStorageNameV4: 'mprtcl-v4',
        localStorageProductsV4: 'mprtcl-prodv4',
        cookieNameV4: 'mprtcl-v4',
        currentStorageName: 'mprtcl-v4',
        currentStorageProductsName: 'mprtcl-prodv4'
      },
      DefaultConfig: {
        cookieDomain: null,
        cookieExpiration: 365,
        logLevel: null,
        timeout: 300,
        sessionTimeout: 30,
        maxProducts: 20,
        forwarderStatsTimeout: 5000,
        integrationDelayTimeout: 5000,
        maxCookieSize: 3000,
        aliasMaxWindow: 90,
        uploadInterval: 0 // Maximum milliseconds in between batch uploads, below 500 will mean immediate upload.  The server returns this as a string, but we are using it as a number internally
      },

      DefaultBaseUrls: {
        v1SecureServiceUrl: 'jssdks.mparticle.com/v1/JS/',
        v2SecureServiceUrl: 'jssdks.mparticle.com/v2/JS/',
        v3SecureServiceUrl: 'jssdks.mparticle.com/v3/JS/',
        configUrl: 'jssdkcdns.mparticle.com/JS/v2/',
        identityUrl: 'identity.mparticle.com/v1/',
        aliasUrl: 'jssdks.mparticle.com/v1/identity/',
        userAudienceUrl: 'nativesdks.mparticle.com/v1/'
      },
      Base64CookieKeys: {
        csm: 1,
        sa: 1,
        ss: 1,
        ua: 1,
        ui: 1,
        csd: 1,
        ia: 1,
        con: 1
      },
      // https://go.mparticle.com/work/SQDSDKS-6039
      SDKv2NonMPIDCookieKeys: {
        gs: 1,
        cu: 1,
        l: 1,
        globalSettings: 1,
        currentUserMPID: 1
      },
      HTTPCodes: {
        noHttpCoverage: -1,
        activeIdentityRequest: -2,
        activeSession: -3,
        validationIssue: -4,
        nativeIdentityRequest: -5,
        loggingDisabledOrMissingAPIKey: -6,
        tooManyRequests: 429
      },
      FeatureFlags: {
        ReportBatching: 'reportBatching',
        EventBatchingIntervalMillis: 'eventBatchingIntervalMillis',
        OfflineStorage: 'offlineStorage',
        DirectUrlRouting: 'directURLRouting',
        CacheIdentity: 'cacheIdentity',
        AudienceAPI: 'audienceAPI',
        CaptureIntegrationSpecificIds: 'captureIntegrationSpecificIds'
      },
      DefaultInstance: 'default_instance',
      CCPAPurpose: 'data_sale_opt_out',
      IdentityMethods: {
        Modify: 'modify',
        Logout: 'logout',
        Login: 'login',
        Identify: 'identify'
      }
    };
    // https://go.mparticle.com/work/SQDSDKS-6080
    var ONE_DAY_IN_SECONDS = 60 * 60 * 24;
    var MILLIS_IN_ONE_SEC = 1000;
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
    var HTTP_OK = 200;
    var HTTP_ACCEPTED = 202;

    var Messages$a = Constants.Messages;
    var createCookieString = function createCookieString(value) {
      return replaceCommasWithPipes(replaceQuotesWithApostrophes(value));
    };
    var revertCookieString = function revertCookieString(value) {
      return replacePipesWithCommas(replaceApostrophesWithQuotes(value));
    };
    var inArray = function inArray(items, name) {
      var i = 0;
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
    var findKeyInObject = function findKeyInObject(obj, key) {
      if (key && obj) {
        for (var prop in obj) {
          if (obj.hasOwnProperty(prop) && prop.toLowerCase() === key.toLowerCase()) {
            return prop;
          }
        }
      }
      return null;
    };
    var generateDeprecationMessage = function generateDeprecationMessage(methodName, alternateMethod) {
      var messageArray = [methodName, Messages$a.DeprecationMessages.MethodIsDeprecatedPostfix];
      if (alternateMethod) {
        messageArray.push(alternateMethod);
        messageArray.push(Messages$a.DeprecationMessages.MethodIsDeprecatedPostfix);
      }
      return messageArray.join(' ');
    };
    function generateHash(name) {
      var hash = 0;
      var character;
      if (name === undefined || name === null) {
        return 0;
      }
      name = name.toString().toLowerCase();
      if (Array.prototype.reduce) {
        return name.split('').reduce(function (a, b) {
          a = (a << 5) - a + b.charCodeAt(0);
          return a & a;
        }, 0);
      }
      if (name.length === 0) {
        return hash;
      }
      for (var i = 0; i < name.length; i++) {
        character = name.charCodeAt(i);
        hash = (hash << 5) - hash + character;
        hash = hash & hash;
      }
      return hash;
    }
    var generateRandomValue = function generateRandomValue(value) {
      var randomValue;
      var a;
      if (window.crypto && window.crypto.getRandomValues) {
        // @ts-ignore
        randomValue = window.crypto.getRandomValues(new Uint8Array(1)); // eslint-disable-line no-undef
      }

      if (randomValue) {
        // @ts-ignore
        return (a ^ randomValue[0] % 16 >> a / 4).toString(16);
      }
      return (a ^ Math.random() * 16 >> a / 4).toString(16);
    };
    var generateUniqueId = function generateUniqueId(a) {
      // https://gist.github.com/jed/982883
      // Added support for crypto for better random
      if (a === void 0) {
        a = '';
      }
      return a // if the placeholder was passed, return
      ? generateRandomValue() // if the placeholder was passed, return
      :
      // [1e7] -> // 10000000 +
      // -1e3  -> // -1000 +
      // -4e3  -> // -4000 +
      // -8e3  -> // -80000000 +
      // -1e11 -> //-100000000000,
      "".concat(1e7, "-").concat(1e3, "-").concat(4e3, "-").concat(8e3, "-").concat(1e11).replace(/[018]/g,
      // zeroes, ones, and eights with
      generateUniqueId // random hex digits
      );
    };
    /**
     * Returns a value between 1-100 inclusive.
     */
    var getRampNumber = function getRampNumber(value) {
      if (!value) {
        return 100;
      }
      var hash = generateHash(value);
      return Math.abs(hash % 100) + 1;
    };
    var isObject = function isObject(value) {
      var objType = Object.prototype.toString.call(value);
      return objType === '[object Object]' || objType === '[object Error]';
    };
    var parseNumber = function parseNumber(value) {
      if (isNaN(value) || !isFinite(value)) {
        return 0;
      }
      var floatValue = parseFloat(value);
      return isNaN(floatValue) ? 0 : floatValue;
    };
    var parseStringOrNumber = function parseStringOrNumber(value) {
      if (isStringOrNumber(value)) {
        return value;
      } else {
        return null;
      }
    };
    var replaceCommasWithPipes = function replaceCommasWithPipes(value) {
      return value.replace(/,/g, '|');
    };
    var replacePipesWithCommas = function replacePipesWithCommas(value) {
      return value.replace(/\|/g, ',');
    };
    var replaceApostrophesWithQuotes = function replaceApostrophesWithQuotes(value) {
      return value.replace(/\'/g, '"');
    };
    var replaceQuotesWithApostrophes = function replaceQuotesWithApostrophes(value) {
      return value.replace(/\"/g, "'");
    };
    // FIXME: REFACTOR for V3
    // only used in store.js to sanitize server-side formatting of
    // booleans when checking for `isDevelopmentMode`
    // Should be removed in v3
    var returnConvertedBoolean = function returnConvertedBoolean(data) {
      if (data === 'false' || data === '0') {
        return false;
      } else {
        return Boolean(data);
      }
    };
    var decoded = function decoded(s) {
      return decodeURIComponent(s.replace(/\+/g, ' '));
    };
    var converted = function converted(s) {
      if (s.indexOf('"') === 0) {
        s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      }
      return s;
    };
    var isString = function isString(value) {
      return typeof value === 'string';
    };
    var isNumber = function isNumber(value) {
      return typeof value === 'number';
    };
    var isBoolean = function isBoolean(value) {
      return typeof value === 'boolean';
    };
    var isFunction = function isFunction(fn) {
      return typeof fn === 'function';
    };
    var isValidCustomFlagProperty = function isValidCustomFlagProperty(value) {
      return isNumber(value) || isString(value) || isBoolean(value);
    };
    var toDataPlanSlug = function toDataPlanSlug(value) {
      // Make sure we are only acting on strings or numbers
      return isStringOrNumber(value) ? value.toString().toLowerCase().replace(/[^0-9a-zA-Z]+/g, '_') : '';
    };
    var isDataPlanSlug = function isDataPlanSlug(str) {
      return str === toDataPlanSlug(str);
    };
    var isStringOrNumber = function isStringOrNumber(value) {
      return isString(value) || isNumber(value);
    };
    var isEmpty = function isEmpty(value) {
      return value == null || !(Object.keys(value) || value).length;
    };
    var moveElementToEnd = function moveElementToEnd(array, index) {
      return array.slice(0, index).concat(array.slice(index + 1), array[index]);
    };
    var queryStringParser = function queryStringParser(url, keys) {
      if (keys === void 0) {
        keys = [];
      }
      var urlParams;
      var results = {};
      if (!url) return results;
      if (typeof URL !== 'undefined' && typeof URLSearchParams !== 'undefined') {
        var urlObject = new URL(url);
        urlParams = new URLSearchParams(urlObject.search);
      } else {
        urlParams = queryStringParserFallback(url);
      }
      if (isEmpty(keys)) {
        urlParams.forEach(function (value, key) {
          results[key] = value;
        });
      } else {
        keys.forEach(function (key) {
          var value = urlParams.get(key);
          if (value) {
            results[key] = value;
          }
        });
      }
      return results;
    };
    var queryStringParserFallback = function queryStringParserFallback(url) {
      var params = {};
      var queryString = url.split('?')[1] || '';
      var pairs = queryString.split('&');
      pairs.forEach(function (pair) {
        var _a = pair.split('='),
          key = _a[0],
          value = _a[1];
        if (key && value) {
          params[key] = decodeURIComponent(value || '');
        }
      });
      return {
        get: function get(key) {
          return params[key];
        },
        forEach: function forEach(callback) {
          for (var key in params) {
            if (params.hasOwnProperty(key)) {
              callback(params[key], key);
            }
          }
        }
      };
    };
    // Get cookies as a dictionary
    var getCookies = function getCookies(keys) {
      // Helper function to parse cookies from document.cookie
      var parseCookies = function parseCookies() {
        if (typeof window === 'undefined') {
          return [];
        }
        return window.document.cookie.split(';').map(function (cookie) {
          return cookie.trim();
        });
      };
      // Helper function to filter cookies by keys
      var filterCookies = function filterCookies(cookies, keys) {
        var results = {};
        for (var _i = 0, cookies_1 = cookies; _i < cookies_1.length; _i++) {
          var cookie = cookies_1[_i];
          var _a = cookie.split('='),
            key = _a[0],
            value = _a[1];
          if (!keys || keys.includes(key)) {
            results[key] = value;
          }
        }
        return results;
      };
      // Parse cookies from document.cookie
      var parsedCookies = parseCookies();
      // Filter cookies by keys if provided
      return filterCookies(parsedCookies, keys);
    };
    var getHref = function getHref() {
      return typeof window !== 'undefined' && window.location ? window.location.href : '';
    };

    function getNewIdentitiesByName(newIdentitiesByType) {
      var newIdentitiesByName = {};
      for (var key in newIdentitiesByType) {
        var identityNameKey = getIdentityName(parseNumber(key));
        newIdentitiesByName[identityNameKey] = newIdentitiesByType[key];
      }
      return newIdentitiesByName;
    }
    function getIdentityName(identityType) {
      switch (identityType) {
        case IdentityType$1.Other:
          return 'other';
        case IdentityType$1.CustomerId:
          return 'customerid';
        case IdentityType$1.Facebook:
          return 'facebook';
        case IdentityType$1.Twitter:
          return 'twitter';
        case IdentityType$1.Google:
          return 'google';
        case IdentityType$1.Microsoft:
          return 'microsoft';
        case IdentityType$1.Yahoo:
          return 'yahoo';
        case IdentityType$1.Email:
          return 'email';
        case IdentityType$1.FacebookCustomAudienceId:
          return 'facebookcustomaudienceid';
        case IdentityType$1.Other2:
          return 'other2';
        case IdentityType$1.Other3:
          return 'other3';
        case IdentityType$1.Other4:
          return 'other4';
        case IdentityType$1.Other5:
          return 'other5';
        case IdentityType$1.Other6:
          return 'other6';
        case IdentityType$1.Other7:
          return 'other7';
        case IdentityType$1.Other8:
          return 'other8';
        case IdentityType$1.Other9:
          return 'other9';
        case IdentityType$1.Other10:
          return 'other10';
        case IdentityType$1.MobileNumber:
          return 'mobile_number';
        case IdentityType$1.PhoneNumber2:
          return 'phone_number_2';
        case IdentityType$1.PhoneNumber3:
          return 'phone_number_3';
        default:
          return null;
      }
    }

    var _TriggerUploadType;
    var MessageType$1 = {
      SessionStart: 1,
      SessionEnd: 2,
      PageView: 3,
      PageEvent: 4,
      CrashReport: 5,
      OptOut: 6,
      AppStateTransition: 10,
      Profile: 14,
      Commerce: 16,
      Media: 20,
      UserAttributeChange: 17,
      UserIdentityChange: 18
    };

    // Dictionary that contains MessageTypes that will
    // trigger an immediate upload.
    var TriggerUploadType = (_TriggerUploadType = {}, _defineProperty(_TriggerUploadType, MessageType$1.Commerce, 1), _defineProperty(_TriggerUploadType, MessageType$1.UserIdentityChange, 1), _TriggerUploadType);
    var EventType = {
      Unknown: 0,
      Navigation: 1,
      Location: 2,
      Search: 3,
      Transaction: 4,
      UserContent: 5,
      UserPreference: 6,
      Social: 7,
      Other: 8,
      Media: 9,
      getName: function getName(id) {
        switch (id) {
          case EventType.Unknown:
            return 'Unknown';
          case EventType.Navigation:
            return 'Navigation';
          case EventType.Location:
            return 'Location';
          case EventType.Search:
            return 'Search';
          case EventType.Transaction:
            return 'Transaction';
          case EventType.UserContent:
            return 'User Content';
          case EventType.UserPreference:
            return 'User Preference';
          case EventType.Social:
            return 'Social';
          case CommerceEventType.ProductAddToCart:
            return 'Product Added to Cart';
          case CommerceEventType.ProductAddToWishlist:
            return 'Product Added to Wishlist';
          case CommerceEventType.ProductCheckout:
            return 'Product Checkout';
          case CommerceEventType.ProductCheckoutOption:
            return 'Product Checkout Options';
          case CommerceEventType.ProductClick:
            return 'Product Click';
          case CommerceEventType.ProductImpression:
            return 'Product Impression';
          case CommerceEventType.ProductPurchase:
            return 'Product Purchased';
          case CommerceEventType.ProductRefund:
            return 'Product Refunded';
          case CommerceEventType.ProductRemoveFromCart:
            return 'Product Removed From Cart';
          case CommerceEventType.ProductRemoveFromWishlist:
            return 'Product Removed from Wishlist';
          case CommerceEventType.ProductViewDetail:
            return 'Product View Details';
          case CommerceEventType.PromotionClick:
            return 'Promotion Click';
          case CommerceEventType.PromotionView:
            return 'Promotion View';
          default:
            return 'Other';
        }
      }
    };

    // Continuation of enum above, but in seperate object since we don't expose these to end user
    var CommerceEventType = {
      ProductAddToCart: 10,
      ProductRemoveFromCart: 11,
      ProductCheckout: 12,
      ProductCheckoutOption: 13,
      ProductClick: 14,
      ProductViewDetail: 15,
      ProductPurchase: 16,
      ProductRefund: 17,
      PromotionView: 18,
      PromotionClick: 19,
      ProductAddToWishlist: 20,
      ProductRemoveFromWishlist: 21,
      ProductImpression: 22
    };
    var IdentityType = {
      Other: 0,
      CustomerId: 1,
      Facebook: 2,
      Twitter: 3,
      Google: 4,
      Microsoft: 5,
      Yahoo: 6,
      Email: 7,
      FacebookCustomAudienceId: 9,
      Other2: 10,
      Other3: 11,
      Other4: 12,
      Other5: 13,
      Other6: 14,
      Other7: 15,
      Other8: 16,
      Other9: 17,
      Other10: 18,
      MobileNumber: 19,
      PhoneNumber2: 20,
      PhoneNumber3: 21
    };
    IdentityType.isValid = function (identityType) {
      if (typeof identityType === 'number') {
        for (var prop in IdentityType) {
          if (IdentityType.hasOwnProperty(prop)) {
            if (IdentityType[prop] === identityType) {
              return true;
            }
          }
        }
      }
      return false;
    };
    IdentityType.getName = function (identityType) {
      switch (identityType) {
        case window.mParticle.IdentityType.CustomerId:
          return 'Customer ID';
        case window.mParticle.IdentityType.Facebook:
          return 'Facebook ID';
        case window.mParticle.IdentityType.Twitter:
          return 'Twitter ID';
        case window.mParticle.IdentityType.Google:
          return 'Google ID';
        case window.mParticle.IdentityType.Microsoft:
          return 'Microsoft ID';
        case window.mParticle.IdentityType.Yahoo:
          return 'Yahoo ID';
        case window.mParticle.IdentityType.Email:
          return 'Email';
        case window.mParticle.IdentityType.FacebookCustomAudienceId:
          return 'Facebook App User ID';
        default:
          return 'Other ID';
      }
    };
    IdentityType.getIdentityType = function (identityName) {
      switch (identityName) {
        case 'other':
          return IdentityType.Other;
        case 'customerid':
          return IdentityType.CustomerId;
        case 'facebook':
          return IdentityType.Facebook;
        case 'twitter':
          return IdentityType.Twitter;
        case 'google':
          return IdentityType.Google;
        case 'microsoft':
          return IdentityType.Microsoft;
        case 'yahoo':
          return IdentityType.Yahoo;
        case 'email':
          return IdentityType.Email;
        case 'facebookcustomaudienceid':
          return IdentityType.FacebookCustomAudienceId;
        case 'other2':
          return IdentityType.Other2;
        case 'other3':
          return IdentityType.Other3;
        case 'other4':
          return IdentityType.Other4;
        case 'other5':
          return IdentityType.Other5;
        case 'other6':
          return IdentityType.Other6;
        case 'other7':
          return IdentityType.Other7;
        case 'other8':
          return IdentityType.Other8;
        case 'other9':
          return IdentityType.Other9;
        case 'other10':
          return IdentityType.Other10;
        case 'mobile_number':
          return IdentityType.MobileNumber;
        case 'phone_number_2':
          return IdentityType.PhoneNumber2;
        case 'phone_number_3':
          return IdentityType.PhoneNumber3;
        default:
          return false;
      }
    };
    IdentityType.getIdentityName = function (identityType) {
      return getIdentityName(identityType);
    };
    var ProductActionType = {
      Unknown: 0,
      AddToCart: 1,
      RemoveFromCart: 2,
      Checkout: 3,
      CheckoutOption: 4,
      Click: 5,
      ViewDetail: 6,
      Purchase: 7,
      Refund: 8,
      AddToWishlist: 9,
      RemoveFromWishlist: 10
    };
    ProductActionType.getName = function (id) {
      switch (id) {
        case ProductActionType.AddToCart:
          return 'Add to Cart';
        case ProductActionType.RemoveFromCart:
          return 'Remove from Cart';
        case ProductActionType.Checkout:
          return 'Checkout';
        case ProductActionType.CheckoutOption:
          return 'Checkout Option';
        case ProductActionType.Click:
          return 'Click';
        case ProductActionType.ViewDetail:
          return 'View Detail';
        case ProductActionType.Purchase:
          return 'Purchase';
        case ProductActionType.Refund:
          return 'Refund';
        case ProductActionType.AddToWishlist:
          return 'Add to Wishlist';
        case ProductActionType.RemoveFromWishlist:
          return 'Remove from Wishlist';
        default:
          return 'Unknown';
      }
    };

    // these are the action names used by server and mobile SDKs when expanding a CommerceEvent
    ProductActionType.getExpansionName = function (id) {
      switch (id) {
        case ProductActionType.AddToCart:
          return 'add_to_cart';
        case ProductActionType.RemoveFromCart:
          return 'remove_from_cart';
        case ProductActionType.Checkout:
          return 'checkout';
        case ProductActionType.CheckoutOption:
          return 'checkout_option';
        case ProductActionType.Click:
          return 'click';
        case ProductActionType.ViewDetail:
          return 'view_detail';
        case ProductActionType.Purchase:
          return 'purchase';
        case ProductActionType.Refund:
          return 'refund';
        case ProductActionType.AddToWishlist:
          return 'add_to_wishlist';
        case ProductActionType.RemoveFromWishlist:
          return 'remove_from_wishlist';
        default:
          return 'unknown';
      }
    };
    var PromotionActionType = {
      Unknown: 0,
      PromotionView: 1,
      PromotionClick: 2
    };
    PromotionActionType.getName = function (id) {
      switch (id) {
        case PromotionActionType.PromotionView:
          return 'view';
        case PromotionActionType.PromotionClick:
          return 'click';
        default:
          return 'unknown';
      }
    };

    // these are the names that the server and mobile SDKs use while expanding CommerceEvent
    PromotionActionType.getExpansionName = function (id) {
      switch (id) {
        case PromotionActionType.PromotionView:
          return 'view';
        case PromotionActionType.PromotionClick:
          return 'click';
        default:
          return 'unknown';
      }
    };
    var ProfileMessageType = {
      Logout: 3
    };
    var ApplicationTransitionType$1 = {
      AppInit: 1
    };
    var Environment = {
      Production: 'production',
      Development: 'development'
    };
    var Types = {
      MessageType: MessageType$1,
      EventType: EventType,
      CommerceEventType: CommerceEventType,
      IdentityType: IdentityType,
      ProfileMessageType: ProfileMessageType,
      ApplicationTransitionType: ApplicationTransitionType$1,
      ProductActionType: ProductActionType,
      PromotionActionType: PromotionActionType,
      TriggerUploadType: TriggerUploadType,
      Environment: Environment
    };

    var SDKProductActionType;
    (function (SDKProductActionType) {
      SDKProductActionType[SDKProductActionType["Unknown"] = 0] = "Unknown";
      SDKProductActionType[SDKProductActionType["AddToCart"] = 1] = "AddToCart";
      SDKProductActionType[SDKProductActionType["RemoveFromCart"] = 2] = "RemoveFromCart";
      SDKProductActionType[SDKProductActionType["Checkout"] = 3] = "Checkout";
      SDKProductActionType[SDKProductActionType["CheckoutOption"] = 4] = "CheckoutOption";
      SDKProductActionType[SDKProductActionType["Click"] = 5] = "Click";
      SDKProductActionType[SDKProductActionType["ViewDetail"] = 6] = "ViewDetail";
      SDKProductActionType[SDKProductActionType["Purchase"] = 7] = "Purchase";
      SDKProductActionType[SDKProductActionType["Refund"] = 8] = "Refund";
      SDKProductActionType[SDKProductActionType["AddToWishlist"] = 9] = "AddToWishlist";
      SDKProductActionType[SDKProductActionType["RemoveFromWishlist"] = 10] = "RemoveFromWishlist";
    })(SDKProductActionType || (SDKProductActionType = {}));

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    var dist = {};

    (function (exports) {
    	Object.defineProperty(exports, "__esModule", { value: true });
    	(function (ApplicationInformationOsEnum) {
    	    ApplicationInformationOsEnum["unknown"] = "Unknown";
    	    ApplicationInformationOsEnum["iOS"] = "IOS";
    	    ApplicationInformationOsEnum["android"] = "Android";
    	    ApplicationInformationOsEnum["windowsPhone"] = "WindowsPhone";
    	    ApplicationInformationOsEnum["mobileWeb"] = "MobileWeb";
    	    ApplicationInformationOsEnum["unityIOS"] = "UnityIOS";
    	    ApplicationInformationOsEnum["unityAndroid"] = "UnityAndroid";
    	    ApplicationInformationOsEnum["desktop"] = "Desktop";
    	    ApplicationInformationOsEnum["tvOS"] = "TVOS";
    	    ApplicationInformationOsEnum["roku"] = "Roku";
    	    ApplicationInformationOsEnum["outOfBand"] = "OutOfBand";
    	    ApplicationInformationOsEnum["alexa"] = "Alexa";
    	    ApplicationInformationOsEnum["smartTV"] = "SmartTV";
    	    ApplicationInformationOsEnum["fireTV"] = "FireTV";
    	    ApplicationInformationOsEnum["xbox"] = "Xbox";
    	})(exports.ApplicationInformationOsEnum || (exports.ApplicationInformationOsEnum = {}));
    	(function (ApplicationStateTransitionEventEventTypeEnum) {
    	    ApplicationStateTransitionEventEventTypeEnum["applicationStateTransition"] = "application_state_transition";
    	})(exports.ApplicationStateTransitionEventEventTypeEnum || (exports.ApplicationStateTransitionEventEventTypeEnum = {}));
    	(function (ApplicationStateTransitionEventDataApplicationTransitionTypeEnum) {
    	    ApplicationStateTransitionEventDataApplicationTransitionTypeEnum["applicationInitialized"] = "application_initialized";
    	    ApplicationStateTransitionEventDataApplicationTransitionTypeEnum["applicationExit"] = "application_exit";
    	    ApplicationStateTransitionEventDataApplicationTransitionTypeEnum["applicationBackground"] = "application_background";
    	    ApplicationStateTransitionEventDataApplicationTransitionTypeEnum["applicationForeground"] = "application_foreground";
    	})(exports.ApplicationStateTransitionEventDataApplicationTransitionTypeEnum || (exports.ApplicationStateTransitionEventDataApplicationTransitionTypeEnum = {}));
    	(function (BatchEnvironmentEnum) {
    	    BatchEnvironmentEnum["unknown"] = "unknown";
    	    BatchEnvironmentEnum["development"] = "development";
    	    BatchEnvironmentEnum["production"] = "production";
    	})(exports.BatchEnvironmentEnum || (exports.BatchEnvironmentEnum = {}));
    	(function (BreadcrumbEventEventTypeEnum) {
    	    BreadcrumbEventEventTypeEnum["breadcrumb"] = "breadcrumb";
    	})(exports.BreadcrumbEventEventTypeEnum || (exports.BreadcrumbEventEventTypeEnum = {}));
    	(function (CommerceEventEventTypeEnum) {
    	    CommerceEventEventTypeEnum["commerceEvent"] = "commerce_event";
    	})(exports.CommerceEventEventTypeEnum || (exports.CommerceEventEventTypeEnum = {}));
    	(function (CommerceEventDataCustomEventTypeEnum) {
    	    CommerceEventDataCustomEventTypeEnum["addToCart"] = "add_to_cart";
    	    CommerceEventDataCustomEventTypeEnum["removeFromCart"] = "remove_from_cart";
    	    CommerceEventDataCustomEventTypeEnum["checkout"] = "checkout";
    	    CommerceEventDataCustomEventTypeEnum["checkoutOption"] = "checkout_option";
    	    CommerceEventDataCustomEventTypeEnum["click"] = "click";
    	    CommerceEventDataCustomEventTypeEnum["viewDetail"] = "view_detail";
    	    CommerceEventDataCustomEventTypeEnum["purchase"] = "purchase";
    	    CommerceEventDataCustomEventTypeEnum["refund"] = "refund";
    	    CommerceEventDataCustomEventTypeEnum["promotionView"] = "promotion_view";
    	    CommerceEventDataCustomEventTypeEnum["promotionClick"] = "promotion_click";
    	    CommerceEventDataCustomEventTypeEnum["addToWishlist"] = "add_to_wishlist";
    	    CommerceEventDataCustomEventTypeEnum["removeFromWishlist"] = "remove_from_wishlist";
    	    CommerceEventDataCustomEventTypeEnum["impression"] = "impression";
    	})(exports.CommerceEventDataCustomEventTypeEnum || (exports.CommerceEventDataCustomEventTypeEnum = {}));
    	(function (CrashReportEventEventTypeEnum) {
    	    CrashReportEventEventTypeEnum["crashReport"] = "crash_report";
    	})(exports.CrashReportEventEventTypeEnum || (exports.CrashReportEventEventTypeEnum = {}));
    	(function (CustomEventEventTypeEnum) {
    	    CustomEventEventTypeEnum["customEvent"] = "custom_event";
    	})(exports.CustomEventEventTypeEnum || (exports.CustomEventEventTypeEnum = {}));
    	(function (CustomEventDataCustomEventTypeEnum) {
    	    CustomEventDataCustomEventTypeEnum["navigation"] = "navigation";
    	    CustomEventDataCustomEventTypeEnum["location"] = "location";
    	    CustomEventDataCustomEventTypeEnum["search"] = "search";
    	    CustomEventDataCustomEventTypeEnum["transaction"] = "transaction";
    	    CustomEventDataCustomEventTypeEnum["userContent"] = "user_content";
    	    CustomEventDataCustomEventTypeEnum["userPreference"] = "user_preference";
    	    CustomEventDataCustomEventTypeEnum["social"] = "social";
    	    CustomEventDataCustomEventTypeEnum["media"] = "media";
    	    CustomEventDataCustomEventTypeEnum["other"] = "other";
    	    CustomEventDataCustomEventTypeEnum["unknown"] = "unknown";
    	})(exports.CustomEventDataCustomEventTypeEnum || (exports.CustomEventDataCustomEventTypeEnum = {}));
    	(function (DeviceCurrentStateDeviceOrientationEnum) {
    	    DeviceCurrentStateDeviceOrientationEnum["portrait"] = "portrait";
    	    DeviceCurrentStateDeviceOrientationEnum["portraitUpsideDown"] = "portrait_upside_down";
    	    DeviceCurrentStateDeviceOrientationEnum["landscape"] = "landscape";
    	    DeviceCurrentStateDeviceOrientationEnum["landscapeLeft"] = "LandscapeLeft";
    	    DeviceCurrentStateDeviceOrientationEnum["landscapeRight"] = "LandscapeRight";
    	    DeviceCurrentStateDeviceOrientationEnum["faceUp"] = "FaceUp";
    	    DeviceCurrentStateDeviceOrientationEnum["faceDown"] = "FaceDown";
    	    DeviceCurrentStateDeviceOrientationEnum["square"] = "Square";
    	})(exports.DeviceCurrentStateDeviceOrientationEnum || (exports.DeviceCurrentStateDeviceOrientationEnum = {}));
    	(function (DeviceCurrentStateStatusBarOrientationEnum) {
    	    DeviceCurrentStateStatusBarOrientationEnum["portrait"] = "portrait";
    	    DeviceCurrentStateStatusBarOrientationEnum["portraitUpsideDown"] = "portrait_upside_down";
    	    DeviceCurrentStateStatusBarOrientationEnum["landscape"] = "landscape";
    	    DeviceCurrentStateStatusBarOrientationEnum["landscapeLeft"] = "LandscapeLeft";
    	    DeviceCurrentStateStatusBarOrientationEnum["landscapeRight"] = "LandscapeRight";
    	    DeviceCurrentStateStatusBarOrientationEnum["faceUp"] = "FaceUp";
    	    DeviceCurrentStateStatusBarOrientationEnum["faceDown"] = "FaceDown";
    	    DeviceCurrentStateStatusBarOrientationEnum["square"] = "Square";
    	})(exports.DeviceCurrentStateStatusBarOrientationEnum || (exports.DeviceCurrentStateStatusBarOrientationEnum = {}));
    	(function (DeviceInformationPlatformEnum) {
    	    DeviceInformationPlatformEnum["iOS"] = "iOS";
    	    DeviceInformationPlatformEnum["android"] = "Android";
    	    DeviceInformationPlatformEnum["web"] = "web";
    	    DeviceInformationPlatformEnum["desktop"] = "desktop";
    	    DeviceInformationPlatformEnum["tvOS"] = "tvOS";
    	    DeviceInformationPlatformEnum["roku"] = "roku";
    	    DeviceInformationPlatformEnum["outOfBand"] = "out_of_band";
    	    DeviceInformationPlatformEnum["smartTV"] = "smart_tv";
    	    DeviceInformationPlatformEnum["xbox"] = "xbox";
    	})(exports.DeviceInformationPlatformEnum || (exports.DeviceInformationPlatformEnum = {}));
    	(function (EventTypeEnum) {
    	    EventTypeEnum["unknown"] = "unknown";
    	    EventTypeEnum["sessionStart"] = "session_start";
    	    EventTypeEnum["sessionEnd"] = "session_end";
    	    EventTypeEnum["screenView"] = "screen_view";
    	    EventTypeEnum["customEvent"] = "custom_event";
    	    EventTypeEnum["crashReport"] = "crash_report";
    	    EventTypeEnum["optOut"] = "opt_out";
    	    EventTypeEnum["firstRun"] = "first_run";
    	    EventTypeEnum["preAttribution"] = "pre_attribution";
    	    EventTypeEnum["pushRegistration"] = "push_registration";
    	    EventTypeEnum["applicationStateTransition"] = "application_state_transition";
    	    EventTypeEnum["pushMessage"] = "push_message";
    	    EventTypeEnum["networkPerformance"] = "network_performance";
    	    EventTypeEnum["breadcrumb"] = "breadcrumb";
    	    EventTypeEnum["profile"] = "profile";
    	    EventTypeEnum["pushReaction"] = "push_reaction";
    	    EventTypeEnum["commerceEvent"] = "commerce_event";
    	    EventTypeEnum["userAttributeChange"] = "user_attribute_change";
    	    EventTypeEnum["userIdentityChange"] = "user_identity_change";
    	    EventTypeEnum["uninstall"] = "uninstall";
    	    EventTypeEnum["validationResult"] = "validation_result";
    	})(exports.EventTypeEnum || (exports.EventTypeEnum = {}));
    	(function (IdentityTypeEnum) {
    	    IdentityTypeEnum["other"] = "other";
    	    IdentityTypeEnum["customerId"] = "customer_id";
    	    IdentityTypeEnum["facebook"] = "facebook";
    	    IdentityTypeEnum["twitter"] = "twitter";
    	    IdentityTypeEnum["google"] = "google";
    	    IdentityTypeEnum["microsoft"] = "microsoft";
    	    IdentityTypeEnum["yahoo"] = "yahoo";
    	    IdentityTypeEnum["email"] = "email";
    	    IdentityTypeEnum["alias"] = "alias";
    	    IdentityTypeEnum["facebookCustomAudienceId"] = "facebook_custom_audience_id";
    	    IdentityTypeEnum["otherId2"] = "other_id_2";
    	    IdentityTypeEnum["otherId3"] = "other_id_3";
    	    IdentityTypeEnum["otherId4"] = "other_id_4";
    	    IdentityTypeEnum["otherId5"] = "other_id_5";
    	    IdentityTypeEnum["otherId6"] = "other_id_6";
    	    IdentityTypeEnum["otherId7"] = "other_id_7";
    	    IdentityTypeEnum["otherId8"] = "other_id_8";
    	    IdentityTypeEnum["otherId9"] = "other_id_9";
    	    IdentityTypeEnum["otherId10"] = "other_id_10";
    	    IdentityTypeEnum["mobileNumber"] = "mobile_number";
    	    IdentityTypeEnum["phoneNumber2"] = "phone_number_2";
    	    IdentityTypeEnum["phoneNumber3"] = "phone_number_3";
    	})(exports.IdentityTypeEnum || (exports.IdentityTypeEnum = {}));
    	(function (NetworkPerformanceEventEventTypeEnum) {
    	    NetworkPerformanceEventEventTypeEnum["networkPerformance"] = "network_performance";
    	})(exports.NetworkPerformanceEventEventTypeEnum || (exports.NetworkPerformanceEventEventTypeEnum = {}));
    	(function (OptOutEventEnum) {
    	    OptOutEventEnum["optOut"] = "opt_out";
    	})(exports.OptOutEventEnum || (exports.OptOutEventEnum = {}));
    	(function (ProductActionActionEnum) {
    	    ProductActionActionEnum["unknown"] = "unknown";
    	    ProductActionActionEnum["addToCart"] = "add_to_cart";
    	    ProductActionActionEnum["removeFromCart"] = "remove_from_cart";
    	    ProductActionActionEnum["checkout"] = "checkout";
    	    ProductActionActionEnum["checkoutOption"] = "checkout_option";
    	    ProductActionActionEnum["click"] = "click";
    	    ProductActionActionEnum["viewDetail"] = "view_detail";
    	    ProductActionActionEnum["purchase"] = "purchase";
    	    ProductActionActionEnum["refund"] = "refund";
    	    ProductActionActionEnum["addToWishlist"] = "add_to_wishlist";
    	    ProductActionActionEnum["removeFromWishlist"] = "remove_from_wish_list";
    	})(exports.ProductActionActionEnum || (exports.ProductActionActionEnum = {}));
    	(function (ProfileEventEventTypeEnum) {
    	    ProfileEventEventTypeEnum["profile"] = "profile";
    	})(exports.ProfileEventEventTypeEnum || (exports.ProfileEventEventTypeEnum = {}));
    	(function (ProfileEventDataProfileEventTypeEnum) {
    	    ProfileEventDataProfileEventTypeEnum["signup"] = "signup";
    	    ProfileEventDataProfileEventTypeEnum["login"] = "login";
    	    ProfileEventDataProfileEventTypeEnum["logout"] = "logout";
    	    ProfileEventDataProfileEventTypeEnum["update"] = "update";
    	    ProfileEventDataProfileEventTypeEnum["delete"] = "delete";
    	})(exports.ProfileEventDataProfileEventTypeEnum || (exports.ProfileEventDataProfileEventTypeEnum = {}));
    	(function (PromotionActionActionEnum) {
    	    PromotionActionActionEnum["view"] = "view";
    	    PromotionActionActionEnum["click"] = "click";
    	})(exports.PromotionActionActionEnum || (exports.PromotionActionActionEnum = {}));
    	(function (PushMessageEventEventTypeEnum) {
    	    PushMessageEventEventTypeEnum["pushMessage"] = "push_message";
    	})(exports.PushMessageEventEventTypeEnum || (exports.PushMessageEventEventTypeEnum = {}));
    	(function (PushMessageEventDataPushMessageTypeEnum) {
    	    PushMessageEventDataPushMessageTypeEnum["sent"] = "sent";
    	    PushMessageEventDataPushMessageTypeEnum["received"] = "received";
    	    PushMessageEventDataPushMessageTypeEnum["action"] = "action";
    	})(exports.PushMessageEventDataPushMessageTypeEnum || (exports.PushMessageEventDataPushMessageTypeEnum = {}));
    	(function (PushMessageEventDataApplicationStateEnum) {
    	    PushMessageEventDataApplicationStateEnum["notRunning"] = "not_running";
    	    PushMessageEventDataApplicationStateEnum["background"] = "background";
    	    PushMessageEventDataApplicationStateEnum["foreground"] = "foreground";
    	})(exports.PushMessageEventDataApplicationStateEnum || (exports.PushMessageEventDataApplicationStateEnum = {}));
    	(function (PushMessageEventDataPushMessageBehaviorEnum) {
    	    PushMessageEventDataPushMessageBehaviorEnum["received"] = "Received";
    	    PushMessageEventDataPushMessageBehaviorEnum["directOpen"] = "DirectOpen";
    	    PushMessageEventDataPushMessageBehaviorEnum["read"] = "Read";
    	    PushMessageEventDataPushMessageBehaviorEnum["influencedOpen"] = "InfluencedOpen";
    	    PushMessageEventDataPushMessageBehaviorEnum["displayed"] = "Displayed";
    	})(exports.PushMessageEventDataPushMessageBehaviorEnum || (exports.PushMessageEventDataPushMessageBehaviorEnum = {}));
    	(function (PushRegistrationEventEventTypeEnum) {
    	    PushRegistrationEventEventTypeEnum["pushRegistration"] = "push_registration";
    	})(exports.PushRegistrationEventEventTypeEnum || (exports.PushRegistrationEventEventTypeEnum = {}));
    	(function (SessionEndEventEventTypeEnum) {
    	    SessionEndEventEventTypeEnum["sessionEnd"] = "session_end";
    	})(exports.SessionEndEventEventTypeEnum || (exports.SessionEndEventEventTypeEnum = {}));
    	(function (SessionStartEventEventTypeEnum) {
    	    SessionStartEventEventTypeEnum["sessionStart"] = "session_start";
    	})(exports.SessionStartEventEventTypeEnum || (exports.SessionStartEventEventTypeEnum = {}));
    	(function (SourceInformationChannelEnum) {
    	    SourceInformationChannelEnum["native"] = "native";
    	    SourceInformationChannelEnum["javascript"] = "javascript";
    	    SourceInformationChannelEnum["pixel"] = "pixel";
    	    SourceInformationChannelEnum["desktop"] = "desktop";
    	    SourceInformationChannelEnum["partner"] = "partner";
    	    SourceInformationChannelEnum["serverToServer"] = "server_to_server";
    	})(exports.SourceInformationChannelEnum || (exports.SourceInformationChannelEnum = {}));
    	(function (UserAttributeChangeEventEventTypeEnum) {
    	    UserAttributeChangeEventEventTypeEnum["userAttributeChange"] = "user_attribute_change";
    	})(exports.UserAttributeChangeEventEventTypeEnum || (exports.UserAttributeChangeEventEventTypeEnum = {}));
    	(function (UserIdentityChangeEventEventTypeEnum) {
    	    UserIdentityChangeEventEventTypeEnum["userIdentityChange"] = "user_identity_change";
    	})(exports.UserIdentityChangeEventEventTypeEnum || (exports.UserIdentityChangeEventEventTypeEnum = {})); 
    } (dist));

    var SDKIdentityTypeEnum;
    (function (SDKIdentityTypeEnum) {
      SDKIdentityTypeEnum["other"] = "other";
      SDKIdentityTypeEnum["customerId"] = "customerid";
      SDKIdentityTypeEnum["facebook"] = "facebook";
      SDKIdentityTypeEnum["twitter"] = "twitter";
      SDKIdentityTypeEnum["google"] = "google";
      SDKIdentityTypeEnum["microsoft"] = "microsoft";
      SDKIdentityTypeEnum["yahoo"] = "yahoo";
      SDKIdentityTypeEnum["email"] = "email";
      SDKIdentityTypeEnum["alias"] = "alias";
      SDKIdentityTypeEnum["facebookCustomAudienceId"] = "facebookcustomaudienceid";
      SDKIdentityTypeEnum["otherId2"] = "other2";
      SDKIdentityTypeEnum["otherId3"] = "other3";
      SDKIdentityTypeEnum["otherId4"] = "other4";
      SDKIdentityTypeEnum["otherId5"] = "other5";
      SDKIdentityTypeEnum["otherId6"] = "other6";
      SDKIdentityTypeEnum["otherId7"] = "other7";
      SDKIdentityTypeEnum["otherId8"] = "other8";
      SDKIdentityTypeEnum["otherId9"] = "other9";
      SDKIdentityTypeEnum["otherId10"] = "other10";
      SDKIdentityTypeEnum["mobileNumber"] = "mobile_number";
      SDKIdentityTypeEnum["phoneNumber2"] = "phone_number_2";
      SDKIdentityTypeEnum["phoneNumber3"] = "phone_number_3";
    })(SDKIdentityTypeEnum || (SDKIdentityTypeEnum = {}));

    function convertEvents(mpid, sdkEvents, mpInstance) {
      if (!mpid) {
        return null;
      }
      if (!sdkEvents || sdkEvents.length < 1) {
        return null;
      }
      var user = mpInstance.Identity.getCurrentUser();
      var uploadEvents = [];
      var lastEvent = null;
      for (var _i = 0, sdkEvents_1 = sdkEvents; _i < sdkEvents_1.length; _i++) {
        var sdkEvent = sdkEvents_1[_i];
        if (sdkEvent) {
          lastEvent = sdkEvent;
          var baseEvent = convertEvent(sdkEvent);
          if (baseEvent) {
            uploadEvents.push(baseEvent);
          }
        }
      }
      if (!lastEvent) {
        return null;
      }
      var currentConsentState = null;
      // Add the consent state from either the Last Event or the user
      if (!isEmpty(lastEvent.ConsentState)) {
        currentConsentState = lastEvent.ConsentState;
      } else if (!isEmpty(user)) {
        currentConsentState = user.getConsentState();
      }
      var upload = {
        source_request_id: mpInstance._Helpers.generateUniqueId(),
        mpid: mpid,
        timestamp_unixtime_ms: new Date().getTime(),
        environment: lastEvent.Debug ? dist.BatchEnvironmentEnum.development : dist.BatchEnvironmentEnum.production,
        events: uploadEvents,
        mp_deviceid: lastEvent.DeviceId,
        sdk_version: lastEvent.SDKVersion,
        // TODO: Refactor this to read from _Store or a global config
        application_info: {
          application_version: lastEvent.AppVersion,
          application_name: lastEvent.AppName,
          "package": lastEvent.Package,
          sideloaded_kits_count: mpInstance._Store.sideloadedKitsCount
        },
        device_info: {
          platform: dist.DeviceInformationPlatformEnum.web,
          screen_width: typeof window !== 'undefined' && typeof window.screen !== 'undefined' ? window.screen.width : 0,
          screen_height: typeof window !== 'undefined' && typeof window.screen !== 'undefined' ? window.screen.height : 0
        },
        user_attributes: lastEvent.UserAttributes,
        user_identities: convertUserIdentities(lastEvent.UserIdentities),
        consent_state: convertConsentState(currentConsentState),
        integration_attributes: lastEvent.IntegrationAttributes
      };
      if (lastEvent.DataPlan && lastEvent.DataPlan.PlanId) {
        upload.context = {
          data_plan: {
            plan_id: lastEvent.DataPlan.PlanId,
            plan_version: lastEvent.DataPlan.PlanVersion || undefined
          }
        };
      }
      return upload;
    }
    function convertConsentState(sdkConsentState) {
      if (isEmpty(sdkConsentState)) {
        return null;
      }
      var consentState = {
        gdpr: convertGdprConsentState(sdkConsentState.getGDPRConsentState()),
        ccpa: convertCcpaConsentState(sdkConsentState.getCCPAConsentState())
      };
      return consentState;
    }
    function convertGdprConsentState(sdkGdprConsentState) {
      if (!sdkGdprConsentState) {
        return null;
      }
      var state = {};
      for (var purpose in sdkGdprConsentState) {
        if (sdkGdprConsentState.hasOwnProperty(purpose)) {
          state[purpose] = {
            consented: sdkGdprConsentState[purpose].Consented,
            hardware_id: sdkGdprConsentState[purpose].HardwareId,
            document: sdkGdprConsentState[purpose].ConsentDocument,
            timestamp_unixtime_ms: sdkGdprConsentState[purpose].Timestamp,
            location: sdkGdprConsentState[purpose].Location
          };
        }
      }
      return state;
    }
    function convertCcpaConsentState(sdkCcpaConsentState) {
      if (!sdkCcpaConsentState) {
        return null;
      }
      var state = {
        data_sale_opt_out: {
          consented: sdkCcpaConsentState.Consented,
          hardware_id: sdkCcpaConsentState.HardwareId,
          document: sdkCcpaConsentState.ConsentDocument,
          timestamp_unixtime_ms: sdkCcpaConsentState.Timestamp,
          location: sdkCcpaConsentState.Location
        }
      };
      return state;
    }
    function convertUserIdentities(sdkUserIdentities) {
      if (!sdkUserIdentities || !sdkUserIdentities.length) {
        return null;
      }
      var batchIdentities = {};
      for (var _i = 0, sdkUserIdentities_1 = sdkUserIdentities; _i < sdkUserIdentities_1.length; _i++) {
        var identity = sdkUserIdentities_1[_i];
        switch (identity.Type) {
          case Types.IdentityType.CustomerId:
            batchIdentities.customer_id = identity.Identity;
            break;
          case Types.IdentityType.Email:
            batchIdentities.email = identity.Identity;
            break;
          case Types.IdentityType.Facebook:
            batchIdentities.facebook = identity.Identity;
            break;
          case Types.IdentityType.FacebookCustomAudienceId:
            batchIdentities.facebook_custom_audience_id = identity.Identity;
            break;
          case Types.IdentityType.Google:
            batchIdentities.google = identity.Identity;
            break;
          case Types.IdentityType.Microsoft:
            batchIdentities.microsoft = identity.Identity;
            break;
          case Types.IdentityType.Other:
            batchIdentities.other = identity.Identity;
            break;
          case Types.IdentityType.Other2:
            batchIdentities.other_id_2 = identity.Identity;
            break;
          case Types.IdentityType.Other3:
            batchIdentities.other_id_3 = identity.Identity;
            break;
          case Types.IdentityType.Other4:
            batchIdentities.other_id_4 = identity.Identity;
            break;
          case Types.IdentityType.Other5:
            batchIdentities.other_id_5 = identity.Identity;
            break;
          case Types.IdentityType.Other6:
            batchIdentities.other_id_6 = identity.Identity;
            break;
          case Types.IdentityType.Other7:
            batchIdentities.other_id_7 = identity.Identity;
            break;
          case Types.IdentityType.Other8:
            batchIdentities.other_id_8 = identity.Identity;
            break;
          case Types.IdentityType.Other9:
            batchIdentities.other_id_9 = identity.Identity;
            break;
          case Types.IdentityType.Other10:
            batchIdentities.other_id_10 = identity.Identity;
            break;
          case Types.IdentityType.MobileNumber:
            batchIdentities.mobile_number = identity.Identity;
            break;
          case Types.IdentityType.PhoneNumber2:
            batchIdentities.phone_number_2 = identity.Identity;
            break;
          case Types.IdentityType.PhoneNumber3:
            batchIdentities.phone_number_3 = identity.Identity;
            break;
        }
      }
      return batchIdentities;
    }
    function convertEvent(sdkEvent) {
      if (!sdkEvent) {
        return null;
      }
      switch (sdkEvent.EventDataType) {
        case Types.MessageType.AppStateTransition:
          return convertAST(sdkEvent);
        case Types.MessageType.Commerce:
          return convertCommerceEvent(sdkEvent);
        case Types.MessageType.CrashReport:
          return convertCrashReportEvent(sdkEvent);
        case Types.MessageType.OptOut:
          return convertOptOutEvent(sdkEvent);
        case Types.MessageType.PageEvent:
          // Note: Media Events are also sent as PageEvents/CustomEvents
          return convertCustomEvent(sdkEvent);
        case Types.MessageType.PageView:
          return convertPageViewEvent(sdkEvent);
        case Types.MessageType.Profile:
          //deprecated and not supported by the web SDK
          return null;
        case Types.MessageType.SessionEnd:
          return convertSessionEndEvent(sdkEvent);
        case Types.MessageType.SessionStart:
          return convertSessionStartEvent(sdkEvent);
        case Types.MessageType.UserAttributeChange:
          return convertUserAttributeChangeEvent(sdkEvent);
        case Types.MessageType.UserIdentityChange:
          return convertUserIdentityChangeEvent(sdkEvent);
      }
      return null;
    }
    function convertProductActionType(actionType) {
      if (!actionType) {
        return dist.ProductActionActionEnum.unknown;
      }
      switch (actionType) {
        case SDKProductActionType.AddToCart:
          return dist.ProductActionActionEnum.addToCart;
        case SDKProductActionType.AddToWishlist:
          return dist.ProductActionActionEnum.addToWishlist;
        case SDKProductActionType.Checkout:
          return dist.ProductActionActionEnum.checkout;
        case SDKProductActionType.CheckoutOption:
          return dist.ProductActionActionEnum.checkoutOption;
        case SDKProductActionType.Click:
          return dist.ProductActionActionEnum.click;
        case SDKProductActionType.Purchase:
          return dist.ProductActionActionEnum.purchase;
        case SDKProductActionType.Refund:
          return dist.ProductActionActionEnum.refund;
        case SDKProductActionType.RemoveFromCart:
          return dist.ProductActionActionEnum.removeFromCart;
        case SDKProductActionType.RemoveFromWishlist:
          return dist.ProductActionActionEnum.removeFromWishlist;
        case SDKProductActionType.ViewDetail:
          return dist.ProductActionActionEnum.viewDetail;
        default:
          return dist.ProductActionActionEnum.unknown;
      }
    }
    function convertProductAction(sdkEvent) {
      if (!sdkEvent.ProductAction) {
        return null;
      }
      var productAction = {
        action: convertProductActionType(sdkEvent.ProductAction.ProductActionType),
        checkout_step: sdkEvent.ProductAction.CheckoutStep,
        checkout_options: sdkEvent.ProductAction.CheckoutOptions,
        transaction_id: sdkEvent.ProductAction.TransactionId,
        affiliation: sdkEvent.ProductAction.Affiliation,
        total_amount: sdkEvent.ProductAction.TotalAmount,
        tax_amount: sdkEvent.ProductAction.TaxAmount,
        shipping_amount: sdkEvent.ProductAction.ShippingAmount,
        coupon_code: sdkEvent.ProductAction.CouponCode,
        products: convertProducts(sdkEvent.ProductAction.ProductList)
      };
      return productAction;
    }
    function convertProducts(sdkProducts) {
      if (!sdkProducts || !sdkProducts.length) {
        return null;
      }
      var products = [];
      for (var _i = 0, sdkProducts_1 = sdkProducts; _i < sdkProducts_1.length; _i++) {
        var sdkProduct = sdkProducts_1[_i];
        var product = {
          id: sdkProduct.Sku,
          name: sdkProduct.Name,
          brand: sdkProduct.Brand,
          category: sdkProduct.Category,
          variant: sdkProduct.Variant,
          total_product_amount: sdkProduct.TotalAmount,
          position: sdkProduct.Position,
          price: sdkProduct.Price,
          quantity: sdkProduct.Quantity,
          coupon_code: sdkProduct.CouponCode,
          custom_attributes: sdkProduct.Attributes
        };
        products.push(product);
      }
      return products;
    }
    function convertPromotionAction(sdkEvent) {
      if (!sdkEvent.PromotionAction) {
        return null;
      }
      var promotionAction = {
        action: sdkEvent.PromotionAction.PromotionActionType,
        promotions: convertPromotions(sdkEvent.PromotionAction.PromotionList)
      };
      return promotionAction;
    }
    function convertPromotions(sdkPromotions) {
      if (!sdkPromotions || !sdkPromotions.length) {
        return null;
      }
      var promotions = [];
      for (var _i = 0, sdkPromotions_1 = sdkPromotions; _i < sdkPromotions_1.length; _i++) {
        var sdkPromotion = sdkPromotions_1[_i];
        var promotion = {
          id: sdkPromotion.Id,
          name: sdkPromotion.Name,
          creative: sdkPromotion.Creative,
          position: sdkPromotion.Position
        };
        promotions.push(promotion);
      }
      return promotions;
    }
    function convertImpressions(sdkEvent) {
      if (!sdkEvent.ProductImpressions) {
        return null;
      }
      var impressions = [];
      for (var _i = 0, _a = sdkEvent.ProductImpressions; _i < _a.length; _i++) {
        var sdkImpression = _a[_i];
        var impression = {
          product_impression_list: sdkImpression.ProductImpressionList,
          products: convertProducts(sdkImpression.ProductList)
        };
        impressions.push(impression);
      }
      return impressions;
    }
    function convertShoppingCart(sdkEvent) {
      if (!sdkEvent.ShoppingCart || !sdkEvent.ShoppingCart.ProductList || !sdkEvent.ShoppingCart.ProductList.length) {
        return null;
      }
      var shoppingCart = {
        products: convertProducts(sdkEvent.ShoppingCart.ProductList)
      };
      return shoppingCart;
    }
    function convertCommerceEvent(sdkEvent) {
      var commonEventData = convertBaseEventData(sdkEvent);
      var commerceEventData = {
        custom_flags: sdkEvent.CustomFlags,
        product_action: convertProductAction(sdkEvent),
        promotion_action: convertPromotionAction(sdkEvent),
        product_impressions: convertImpressions(sdkEvent),
        shopping_cart: convertShoppingCart(sdkEvent),
        currency_code: sdkEvent.CurrencyCode
      };
      commerceEventData = Object.assign(commerceEventData, commonEventData);
      return {
        event_type: dist.EventTypeEnum.commerceEvent,
        data: commerceEventData
      };
    }
    function convertCrashReportEvent(sdkEvent) {
      var commonEventData = convertBaseEventData(sdkEvent);
      var crashReportEventData = {
        message: sdkEvent.EventName
      };
      crashReportEventData = Object.assign(crashReportEventData, commonEventData);
      return {
        event_type: dist.EventTypeEnum.crashReport,
        data: crashReportEventData
      };
    }
    function convertAST(sdkEvent) {
      var commonEventData = convertBaseEventData(sdkEvent);
      var astEventData = {
        application_transition_type: dist.ApplicationStateTransitionEventDataApplicationTransitionTypeEnum.applicationInitialized,
        is_first_run: sdkEvent.IsFirstRun,
        is_upgrade: false,
        launch_referral: sdkEvent.LaunchReferral
      };
      astEventData = Object.assign(astEventData, commonEventData);
      return {
        event_type: dist.EventTypeEnum.applicationStateTransition,
        data: astEventData
      };
    }
    function convertSessionEndEvent(sdkEvent) {
      var commonEventData = convertBaseEventData(sdkEvent);
      var sessionEndEventData = {
        session_duration_ms: sdkEvent.SessionLength
        //note: External Events DTO does not support the session mpids array as of this time.
        //spanning_mpids: sdkEvent.SessionMpids
      };

      sessionEndEventData = Object.assign(sessionEndEventData, commonEventData);
      return {
        event_type: dist.EventTypeEnum.sessionEnd,
        data: sessionEndEventData
      };
    }
    function convertSessionStartEvent(sdkEvent) {
      var commonEventData = convertBaseEventData(sdkEvent);
      var sessionStartEventData = {};
      sessionStartEventData = Object.assign(sessionStartEventData, commonEventData);
      return {
        event_type: dist.EventTypeEnum.sessionStart,
        data: sessionStartEventData
      };
    }
    function convertPageViewEvent(sdkEvent) {
      var commonEventData = convertBaseEventData(sdkEvent);
      var screenViewEventData = {
        custom_flags: sdkEvent.CustomFlags,
        screen_name: sdkEvent.EventName
      };
      screenViewEventData = Object.assign(screenViewEventData, commonEventData);
      return {
        event_type: dist.EventTypeEnum.screenView,
        data: screenViewEventData
      };
    }
    function convertOptOutEvent(sdkEvent) {
      var commonEventData = convertBaseEventData(sdkEvent);
      var optOutEventData = {
        is_opted_out: sdkEvent.OptOut
      };
      optOutEventData = Object.assign(optOutEventData, commonEventData);
      return {
        event_type: dist.EventTypeEnum.optOut,
        data: optOutEventData
      };
    }
    function convertCustomEvent(sdkEvent) {
      var commonEventData = convertBaseEventData(sdkEvent);
      var customEventData = {
        custom_event_type: convertSdkEventType(sdkEvent.EventCategory),
        custom_flags: sdkEvent.CustomFlags,
        event_name: sdkEvent.EventName
      };
      customEventData = Object.assign(customEventData, commonEventData);
      return {
        event_type: dist.EventTypeEnum.customEvent,
        data: customEventData
      };
    }
    function convertSdkEventType(sdkEventType) {
      switch (sdkEventType) {
        case Types.EventType.Other:
          return dist.CustomEventDataCustomEventTypeEnum.other;
        case Types.EventType.Location:
          return dist.CustomEventDataCustomEventTypeEnum.location;
        case Types.EventType.Navigation:
          return dist.CustomEventDataCustomEventTypeEnum.navigation;
        case Types.EventType.Search:
          return dist.CustomEventDataCustomEventTypeEnum.search;
        case Types.EventType.Social:
          return dist.CustomEventDataCustomEventTypeEnum.social;
        case Types.EventType.Transaction:
          return dist.CustomEventDataCustomEventTypeEnum.transaction;
        case Types.EventType.UserContent:
          return dist.CustomEventDataCustomEventTypeEnum.userContent;
        case Types.EventType.UserPreference:
          return dist.CustomEventDataCustomEventTypeEnum.userPreference;
        case Types.EventType.Media:
          return dist.CustomEventDataCustomEventTypeEnum.media;
        case Types.CommerceEventType.ProductAddToCart:
          return dist.CommerceEventDataCustomEventTypeEnum.addToCart;
        case Types.CommerceEventType.ProductAddToWishlist:
          return dist.CommerceEventDataCustomEventTypeEnum.addToWishlist;
        case Types.CommerceEventType.ProductCheckout:
          return dist.CommerceEventDataCustomEventTypeEnum.checkout;
        case Types.CommerceEventType.ProductCheckoutOption:
          return dist.CommerceEventDataCustomEventTypeEnum.checkoutOption;
        case Types.CommerceEventType.ProductClick:
          return dist.CommerceEventDataCustomEventTypeEnum.click;
        case Types.CommerceEventType.ProductImpression:
          return dist.CommerceEventDataCustomEventTypeEnum.impression;
        case Types.CommerceEventType.ProductPurchase:
          return dist.CommerceEventDataCustomEventTypeEnum.purchase;
        case Types.CommerceEventType.ProductRefund:
          return dist.CommerceEventDataCustomEventTypeEnum.refund;
        case Types.CommerceEventType.ProductRemoveFromCart:
          return dist.CommerceEventDataCustomEventTypeEnum.removeFromCart;
        case Types.CommerceEventType.ProductRemoveFromWishlist:
          return dist.CommerceEventDataCustomEventTypeEnum.removeFromWishlist;
        case Types.CommerceEventType.ProductViewDetail:
          return dist.CommerceEventDataCustomEventTypeEnum.viewDetail;
        case Types.CommerceEventType.PromotionClick:
          return dist.CommerceEventDataCustomEventTypeEnum.promotionClick;
        case Types.CommerceEventType.PromotionView:
          return dist.CommerceEventDataCustomEventTypeEnum.promotionView;
        default:
          return dist.CustomEventDataCustomEventTypeEnum.unknown;
      }
    }
    function convertBaseEventData(sdkEvent) {
      var commonEventData = {
        timestamp_unixtime_ms: sdkEvent.Timestamp,
        session_uuid: sdkEvent.SessionId,
        session_start_unixtime_ms: sdkEvent.SessionStartDate,
        custom_attributes: sdkEvent.EventAttributes,
        location: convertSDKLocation(sdkEvent.Location),
        source_message_id: sdkEvent.SourceMessageId
      };
      return commonEventData;
    }
    function convertSDKLocation(sdkEventLocation) {
      if (sdkEventLocation && Object.keys(sdkEventLocation).length) {
        return {
          latitude: sdkEventLocation.lat,
          longitude: sdkEventLocation.lng
        };
      }
      return null;
    }
    function convertUserAttributeChangeEvent(sdkEvent) {
      var commonEventData = convertBaseEventData(sdkEvent);
      var userAttributeChangeEvent = {
        user_attribute_name: sdkEvent.UserAttributeChanges.UserAttributeName,
        "new": sdkEvent.UserAttributeChanges.New,
        old: sdkEvent.UserAttributeChanges.Old,
        deleted: sdkEvent.UserAttributeChanges.Deleted,
        is_new_attribute: sdkEvent.UserAttributeChanges.IsNewAttribute
      };
      userAttributeChangeEvent = __assign(__assign({}, userAttributeChangeEvent), commonEventData);
      return {
        event_type: dist.EventTypeEnum.userAttributeChange,
        data: userAttributeChangeEvent
      };
    }
    function convertUserIdentityChangeEvent(sdkEvent) {
      var commonEventData = convertBaseEventData(sdkEvent);
      var userIdentityChangeEvent = {
        "new": {
          identity_type: convertUserIdentityTypeToServerIdentityType(sdkEvent.UserIdentityChanges.New.IdentityType),
          identity: sdkEvent.UserIdentityChanges.New.Identity || null,
          timestamp_unixtime_ms: sdkEvent.Timestamp,
          created_this_batch: sdkEvent.UserIdentityChanges.New.CreatedThisBatch
        },
        old: {
          identity_type: convertUserIdentityTypeToServerIdentityType(sdkEvent.UserIdentityChanges.Old.IdentityType),
          identity: sdkEvent.UserIdentityChanges.Old.Identity || null,
          timestamp_unixtime_ms: sdkEvent.Timestamp,
          created_this_batch: sdkEvent.UserIdentityChanges.Old.CreatedThisBatch
        }
      };
      userIdentityChangeEvent = Object.assign(userIdentityChangeEvent, commonEventData);
      return {
        event_type: dist.EventTypeEnum.userIdentityChange,
        data: userIdentityChangeEvent
      };
    }
    function convertUserIdentityTypeToServerIdentityType(identityType) {
      switch (identityType) {
        case SDKIdentityTypeEnum.other:
          return dist.IdentityTypeEnum.other;
        case SDKIdentityTypeEnum.customerId:
          return dist.IdentityTypeEnum.customerId;
        case SDKIdentityTypeEnum.facebook:
          return dist.IdentityTypeEnum.facebook;
        case SDKIdentityTypeEnum.twitter:
          return dist.IdentityTypeEnum.twitter;
        case SDKIdentityTypeEnum.google:
          return dist.IdentityTypeEnum.google;
        case SDKIdentityTypeEnum.microsoft:
          return dist.IdentityTypeEnum.microsoft;
        case SDKIdentityTypeEnum.yahoo:
          return dist.IdentityTypeEnum.yahoo;
        case SDKIdentityTypeEnum.email:
          return dist.IdentityTypeEnum.email;
        case SDKIdentityTypeEnum.alias:
          return dist.IdentityTypeEnum.alias;
        case SDKIdentityTypeEnum.facebookCustomAudienceId:
          return dist.IdentityTypeEnum.facebookCustomAudienceId;
        case SDKIdentityTypeEnum.otherId2:
          return dist.IdentityTypeEnum.otherId2;
        case SDKIdentityTypeEnum.otherId3:
          return dist.IdentityTypeEnum.otherId3;
        case SDKIdentityTypeEnum.otherId4:
          return dist.IdentityTypeEnum.otherId4;
        case SDKIdentityTypeEnum.otherId5:
          return dist.IdentityTypeEnum.otherId5;
        case SDKIdentityTypeEnum.otherId6:
          return dist.IdentityTypeEnum.otherId6;
        case SDKIdentityTypeEnum.otherId7:
          return dist.IdentityTypeEnum.otherId7;
        case SDKIdentityTypeEnum.otherId8:
          return dist.IdentityTypeEnum.otherId8;
        case SDKIdentityTypeEnum.otherId9:
          return dist.IdentityTypeEnum.otherId9;
        case SDKIdentityTypeEnum.otherId10:
          return dist.IdentityTypeEnum.otherId10;
        case SDKIdentityTypeEnum.mobileNumber:
          return dist.IdentityTypeEnum.mobileNumber;
        case SDKIdentityTypeEnum.phoneNumber2:
          return dist.IdentityTypeEnum.phoneNumber2;
        case SDKIdentityTypeEnum.phoneNumber3:
          return dist.IdentityTypeEnum.phoneNumber3;
      }
    }

    var BaseVault = /** @class */function () {
      /**
       *
       * @param {string} storageKey the local storage key string
       * @param {Storage} Web API Storage object that is being used
       * @param {IVaultOptions} options A Dictionary of IVaultOptions
       */
      function BaseVault(storageKey, storageObject, options) {
        this._storageKey = storageKey;
        this.storageObject = storageObject;
        // Add a fake logger in case one is not provided or needed
        this.logger = (options === null || options === void 0 ? void 0 : options.logger) || {
          verbose: function verbose() {},
          warning: function warning() {},
          error: function error() {}
        };
        this.contents = this.retrieve();
      }
      /**
       * Stores a StorableItem to Storage
       * @method store
       * @param item {StorableItem}
       */
      BaseVault.prototype.store = function (item) {
        this.contents = item;
        var stringifiedItem = !isEmpty(item) ? JSON.stringify(item) : '';
        try {
          this.storageObject.setItem(this._storageKey, stringifiedItem);
          this.logger.verbose("Saving item to Storage: ".concat(stringifiedItem));
        } catch (error) {
          this.logger.error("Cannot Save items to Storage: ".concat(stringifiedItem));
          this.logger.error(error);
        }
      };
      /**
       * Retrieve StorableItem from Storage
       * @method retrieve
       * @returns {StorableItem}
       */
      BaseVault.prototype.retrieve = function () {
        // TODO: Handle cases where Local Storage is unavailable
        // https://go.mparticle.com/work/SQDSDKS-5022
        var item = this.storageObject.getItem(this._storageKey);
        this.contents = item ? JSON.parse(item) : null;
        this.logger.verbose("Retrieving item from Storage: ".concat(item));
        return this.contents;
      };
      /**
       * Removes all persisted data from Storage based on this vault's `key`
       * Will remove storage key from Storage as well
       * @method purge
       */
      BaseVault.prototype.purge = function () {
        this.logger.verbose('Purging Storage');
        this.contents = null;
        this.storageObject.removeItem(this._storageKey);
      };
      return BaseVault;
    }();
    var LocalStorageVault = /** @class */function (_super) {
      __extends(LocalStorageVault, _super);
      function LocalStorageVault(storageKey, options) {
        return _super.call(this, storageKey, window.localStorage, options) || this;
      }
      return LocalStorageVault;
    }(BaseVault);
    var SessionStorageVault = /** @class */function (_super) {
      __extends(SessionStorageVault, _super);
      function SessionStorageVault(storageKey, options) {
        return _super.call(this, storageKey, window.sessionStorage, options) || this;
      }
      return SessionStorageVault;
    }(BaseVault);

    var AsyncUploader = /** @class */function () {
      function AsyncUploader(url) {
        this.url = url;
      }
      return AsyncUploader;
    }();
    var FetchUploader = /** @class */function (_super) {
      __extends(FetchUploader, _super);
      function FetchUploader() {
        return _super !== null && _super.apply(this, arguments) || this;
      }
      FetchUploader.prototype.upload = function (fetchPayload, _url) {
        return __awaiter(this, void 0, void 0, function () {
          var url;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                url = _url || this.url;
                return [4 /*yield*/, fetch(url, fetchPayload)];
              case 1:
                return [2 /*return*/, _a.sent()];
            }
          });
        });
      };
      return FetchUploader;
    }(AsyncUploader);
    var XHRUploader = /** @class */function (_super) {
      __extends(XHRUploader, _super);
      function XHRUploader() {
        return _super !== null && _super.apply(this, arguments) || this;
      }
      XHRUploader.prototype.upload = function (fetchPayload) {
        return __awaiter(this, void 0, void 0, function () {
          var response;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                return [4 /*yield*/, this.makeRequest(this.url, fetchPayload.body, fetchPayload.method, fetchPayload.headers)];
              case 1:
                response = _a.sent();
                return [2 /*return*/, response];
            }
          });
        });
      };
      // XHR Ready States
      // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/readyState
      // 0   UNSENT  open() has not been called yet.
      // 1   OPENED  send() has been called.
      // 2   HEADERS_RECEIVED    send() has been called, and headers and status are available.
      // 3   LOADING Downloading; responseText holds partial data.
      // 4   DONE    The operation is complete.
      // https://go.mparticle.com/work/SQDSDKS-6736
      XHRUploader.prototype.makeRequest = function (url, data, method, headers) {
        if (method === void 0) {
          method = 'post';
        }
        if (headers === void 0) {
          headers = {};
        }
        return __awaiter(this, void 0, void 0, function () {
          var xhr;
          return __generator(this, function (_a) {
            xhr = new XMLHttpRequest();
            return [2 /*return*/, new Promise(function (resolve, reject) {
              xhr.onreadystatechange = function () {
                if (xhr.readyState !== 4) return;
                // Process the response
                // We resolve all xhr responses whose ready state is 4 regardless of HTTP codes that may be errors (400+)
                // because these are valid HTTP responses.
                resolve(xhr);
              };
              // Reject a promise only when there is an xhr error
              xhr.onerror = function () {
                reject(xhr);
              };
              xhr.open(method, url);
              Object.entries(headers).forEach(function (_a) {
                var key = _a[0],
                  value = _a[1];
                xhr.setRequestHeader(key, value);
              });
              xhr.send(data);
            })];
          });
        });
      };
      return XHRUploader;
    }(AsyncUploader);

    /**
     * BatchUploader contains all the logic to store/retrieve events and batches
     * to/from persistence, and upload batches to mParticle.
     * It queues events as they come in, storing them in persistence, then at set
     * intervals turns them into batches and transfers between event and batch
     * persistence.
     * It then attempts to upload them to mParticle, purging batch persistence if
     * the upload is successful
     *
     * These uploads happen on an interval basis using window.fetch or XHR
     * requests, depending on what is available in the browser.
     *
     * Uploads can also be triggered on browser visibility/focus changes via an
     * event listener, which then uploads to mPartice via the browser's Beacon API.
     */
    var BatchUploader = /** @class */function () {
      /**
       * Creates an instance of a BatchUploader
       * @param {MParticleWebSDK} mpInstance - the mParticle SDK instance
       * @param {number} uploadInterval - the desired upload interval in milliseconds
       */
      function BatchUploader(mpInstance, uploadInterval) {
        var _a;
        this.offlineStorageEnabled = false;
        this.mpInstance = mpInstance;
        this.uploadIntervalMillis = uploadInterval;
        this.batchingEnabled = uploadInterval >= BatchUploader.MINIMUM_INTERVAL_MILLIS;
        if (this.uploadIntervalMillis < BatchUploader.MINIMUM_INTERVAL_MILLIS) {
          this.uploadIntervalMillis = BatchUploader.MINIMUM_INTERVAL_MILLIS;
        }
        // Events will be queued during `queueEvents` method
        this.eventsQueuedForProcessing = [];
        // Batch queue should start empty and will be populated during
        // `prepareAndUpload` method, either via Local Storage or after
        // new batches are created.
        this.batchesQueuedForProcessing = [];
        // Cache Offline Storage Availability boolean
        // so that we don't have to check it every time
        this.offlineStorageEnabled = this.isOfflineStorageAvailable();
        if (this.offlineStorageEnabled) {
          this.eventVault = new SessionStorageVault("".concat(mpInstance._Store.storageName, "-events"), {
            logger: mpInstance.Logger
          });
          this.batchVault = new LocalStorageVault("".concat(mpInstance._Store.storageName, "-batches"), {
            logger: mpInstance.Logger
          });
          // Load Events from Session Storage in case we have any in storage
          (_a = this.eventsQueuedForProcessing).push.apply(_a, this.eventVault.retrieve());
        }
        var _b = this.mpInstance._Store,
          SDKConfig = _b.SDKConfig,
          devToken = _b.devToken;
        var baseUrl = this.mpInstance._Helpers.createServiceUrl(SDKConfig.v3SecureServiceUrl, devToken);
        this.uploadUrl = "".concat(baseUrl, "/events");
        this.uploader = window.fetch ? new FetchUploader(this.uploadUrl) : new XHRUploader(this.uploadUrl);
        this.triggerUploadInterval(true, false);
        this.addEventListeners();
      }
      BatchUploader.prototype.isOfflineStorageAvailable = function () {
        var _a = this.mpInstance,
          getFeatureFlag = _a._Helpers.getFeatureFlag,
          deviceId = _a._Store.deviceId;
        // https://go.mparticle.com/work/SQDSDKS-6317
        var offlineStorageFeatureFlagValue = getFeatureFlag(Constants.FeatureFlags.OfflineStorage);
        var offlineStoragePercentage = parseInt(offlineStorageFeatureFlagValue, 10);
        var rampNumber = getRampNumber(deviceId);
        // TODO: Handle cases where Local Storage is unavailable
        //       Potentially shared between Vault and Persistence as well
        //       https://go.mparticle.com/work/SQDSDKS-5022
        return offlineStoragePercentage >= rampNumber;
      };
      // Adds listeners to be used trigger Navigator.sendBeacon if the browser
      // loses focus for any reason, such as closing browser tab or minimizing window
      BatchUploader.prototype.addEventListeners = function () {
        var _this = this;
        // visibility change is a document property, not window
        document.addEventListener('visibilitychange', function () {
          _this.prepareAndUpload(false, _this.isBeaconAvailable());
        });
        window.addEventListener('beforeunload', function () {
          _this.prepareAndUpload(false, _this.isBeaconAvailable());
        });
        window.addEventListener('pagehide', function () {
          _this.prepareAndUpload(false, _this.isBeaconAvailable());
        });
      };
      BatchUploader.prototype.isBeaconAvailable = function () {
        if (navigator.sendBeacon) {
          return true;
        }
        return false;
      };
      // Triggers a setTimeout for prepareAndUpload
      BatchUploader.prototype.triggerUploadInterval = function (triggerFuture, useBeacon) {
        var _this_1 = this;
        if (triggerFuture === void 0) {
          triggerFuture = false;
        }
        if (useBeacon === void 0) {
          useBeacon = false;
        }
        setTimeout(function () {
          _this_1.prepareAndUpload(triggerFuture, useBeacon);
        }, this.uploadIntervalMillis);
      };
      /**
       * This method will queue a single Event which will eventually be processed into a Batch
       * @param event event that should be queued
       */
      BatchUploader.prototype.queueEvent = function (event) {
        if (!isEmpty(event)) {
          this.eventsQueuedForProcessing.push(event);
          if (this.offlineStorageEnabled && this.eventVault) {
            this.eventVault.store(this.eventsQueuedForProcessing);
          }
          this.mpInstance.Logger.verbose("Queuing event: ".concat(JSON.stringify(event)));
          this.mpInstance.Logger.verbose("Queued event count: ".concat(this.eventsQueuedForProcessing.length));
          // TODO: Remove this check once the v2 code path is removed
          //       https://go.mparticle.com/work/SQDSDKS-3720
          if (!this.batchingEnabled || Types.TriggerUploadType[event.EventDataType]) {
            this.prepareAndUpload(false, false);
          }
        }
      };
      /**
       * This implements crucial logic to:
       * - bucket pending events by MPID, and then by Session, and upload individual batches for each bucket.
       *
       * In the future this should enforce other requirements such as maximum batch size.
       *
       * @param sdkEvents current pending events
       * @param defaultUser the user to reference for events that are missing data
       */
      BatchUploader.createNewBatches = function (sdkEvents, defaultUser, mpInstance) {
        if (!defaultUser || !sdkEvents || !sdkEvents.length) {
          return null;
        }
        //bucket by MPID, and then by session, ordered by timestamp
        var newUploads = [];
        var eventsByUser = new Map();
        for (var _i = 0, sdkEvents_1 = sdkEvents; _i < sdkEvents_1.length; _i++) {
          var sdkEvent = sdkEvents_1[_i];
          //on initial startup, there may be events logged without an mpid.
          if (!sdkEvent.MPID) {
            var mpid = defaultUser.getMPID();
            sdkEvent.MPID = mpid;
          }
          var events = eventsByUser.get(sdkEvent.MPID);
          if (!events) {
            events = [];
          }
          events.push(sdkEvent);
          eventsByUser.set(sdkEvent.MPID, events);
        }
        for (var _a = 0, _b = Array.from(eventsByUser.entries()); _a < _b.length; _a++) {
          var entry = _b[_a];
          var mpid = entry[0];
          var userEvents = entry[1];
          var eventsBySession = new Map();
          for (var _c = 0, userEvents_1 = userEvents; _c < userEvents_1.length; _c++) {
            var sdkEvent = userEvents_1[_c];
            var events = eventsBySession.get(sdkEvent.SessionId);
            if (!events) {
              events = [];
            }
            events.push(sdkEvent);
            eventsBySession.set(sdkEvent.SessionId, events);
          }
          for (var _d = 0, _e = Array.from(eventsBySession.entries()); _d < _e.length; _d++) {
            var entry_1 = _e[_d];
            var uploadBatchObject = convertEvents(mpid, entry_1[1], mpInstance);
            var onCreateBatchCallback = mpInstance._Store.SDKConfig.onCreateBatch;
            if (onCreateBatchCallback) {
              uploadBatchObject = onCreateBatchCallback(uploadBatchObject);
              if (uploadBatchObject) {
                uploadBatchObject.modified = true;
              } else {
                mpInstance.Logger.warning('Skiping batch upload because no batch was returned from onCreateBatch callback');
              }
            }
            if (uploadBatchObject) {
              newUploads.push(uploadBatchObject);
            }
          }
        }
        return newUploads;
      };
      /**
       * This is the main loop function:
       *  - take all pending events and turn them into batches
       *  - attempt to upload each batch
       *
       * @param triggerFuture whether to trigger the loop again - for manual/forced uploads this should be false
       * @param useBeacon whether to use the beacon API - used when the page is being unloaded
       */
      BatchUploader.prototype.prepareAndUpload = function (triggerFuture, useBeacon) {
        return __awaiter(this, void 0, void 0, function () {
          var currentUser, currentEvents, newBatches, batchesToUpload, batchesThatDidNotUpload;
          var _a, _b, _c;
          return __generator(this, function (_d) {
            switch (_d.label) {
              case 0:
                currentUser = this.mpInstance.Identity.getCurrentUser();
                currentEvents = this.eventsQueuedForProcessing;
                this.eventsQueuedForProcessing = [];
                if (this.offlineStorageEnabled && this.eventVault) {
                  this.eventVault.store([]);
                }
                newBatches = [];
                if (!isEmpty(currentEvents)) {
                  newBatches = BatchUploader.createNewBatches(currentEvents, currentUser, this.mpInstance);
                }
                // Top Load any older Batches from Offline Storage so they go out first
                if (this.offlineStorageEnabled && this.batchVault) {
                  (_a = this.batchesQueuedForProcessing).unshift.apply(_a, this.batchVault.retrieve());
                  // Remove batches from local storage before transmit to
                  // prevent duplication
                  this.batchVault.purge();
                }
                if (!isEmpty(newBatches)) {
                  (_b = this.batchesQueuedForProcessing).push.apply(_b, newBatches);
                }
                batchesToUpload = this.batchesQueuedForProcessing;
                this.batchesQueuedForProcessing = [];
                return [4 /*yield*/, this.uploadBatches(this.mpInstance.Logger, batchesToUpload, useBeacon)];
              case 1:
                batchesThatDidNotUpload = _d.sent();
                // Batches that do not successfully upload are added back to the process queue
                // in the order they were created so that we can attempt re-transmission in
                // the same sequence. This is to prevent any potential data corruption.
                if (!isEmpty(batchesThatDidNotUpload)) {
                  // TODO: https://go.mparticle.com/work/SQDSDKS-5165
                  (_c = this.batchesQueuedForProcessing).unshift.apply(_c, batchesThatDidNotUpload);
                }
                // Update Offline Storage with current state of batch queue
                if (!useBeacon && this.offlineStorageEnabled && this.batchVault) {
                  // Note: since beacon is "Fire and forget" it will empty `batchesThatDidNotUplod`
                  // regardless of whether the batches were successfully uploaded or not. We should
                  // therefore NOT overwrite Offline Storage when beacon returns, so that we can retry
                  // uploading saved batches at a later time. Batches should only be removed from
                  // Local Storage once we can confirm they are successfully uploaded.
                  this.batchVault.store(this.batchesQueuedForProcessing);
                  // Clear batch queue since everything should be in Offline Storage
                  this.batchesQueuedForProcessing = [];
                }
                if (triggerFuture) {
                  this.triggerUploadInterval(triggerFuture, false);
                }
                return [2 /*return*/];
            }
          });
        });
      };
      // TODO: Refactor to use logger as a class method
      // https://go.mparticle.com/work/SQDSDKS-5167
      BatchUploader.prototype.uploadBatches = function (logger, batches, useBeacon) {
        return __awaiter(this, void 0, void 0, function () {
          var uploads, i, fetchPayload, blob, response, e_1;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                uploads = batches.filter(function (batch) {
                  return !isEmpty(batch.events);
                });
                if (isEmpty(uploads)) {
                  return [2 /*return*/, null];
                }
                logger.verbose("Uploading batches: ".concat(JSON.stringify(uploads)));
                logger.verbose("Batch count: ".concat(uploads.length));
                i = 0;
                _a.label = 1;
              case 1:
                if (!(i < uploads.length)) return [3 /*break*/, 6];
                fetchPayload = {
                  method: 'POST',
                  headers: {
                    Accept: BatchUploader.CONTENT_TYPE,
                    'Content-Type': 'text/plain;charset=UTF-8'
                  },
                  body: JSON.stringify(uploads[i])
                };
                if (!(useBeacon && this.isBeaconAvailable())) return [3 /*break*/, 2];
                blob = new Blob([fetchPayload.body], {
                  type: 'text/plain;charset=UTF-8'
                });
                navigator.sendBeacon(this.uploadUrl, blob);
                return [3 /*break*/, 5];
              case 2:
                _a.trys.push([2, 4,, 5]);
                return [4 /*yield*/, this.uploader.upload(fetchPayload)];
              case 3:
                response = _a.sent();
                if (response.status >= 200 && response.status < 300) {
                  logger.verbose("Upload success for request ID: ".concat(uploads[i].source_request_id));
                } else if (response.status >= 500 || response.status === 429) {
                  logger.error("HTTP error status ".concat(response.status, " received"));
                  // Server error, add back current batches and try again later
                  return [2 /*return*/, uploads.slice(i, uploads.length)];
                } else if (response.status >= 401) {
                  logger.error("HTTP error status ".concat(response.status, " while uploading - please verify your API key."));
                  //if we're getting a 401, assume we'll keep getting a 401 and clear the uploads.
                  return [2 /*return*/, null];
                } else {
                  // In case there is an HTTP error we did not anticipate.
                  console.error("HTTP error status ".concat(response.status, " while uploading events."), response);
                  throw new Error("Uncaught HTTP Error ".concat(response.status, ".  Batch upload will be re-attempted."));
                }
                return [3 /*break*/, 5];
              case 4:
                e_1 = _a.sent();
                logger.error("Error sending event to mParticle servers. ".concat(e_1));
                return [2 /*return*/, uploads.slice(i, uploads.length)];
              case 5:
                i++;
                return [3 /*break*/, 1];
              case 6:
                return [2 /*return*/, null];
            }
          });
        });
      };
      // We upload JSON, but this content type is required to avoid a CORS preflight request
      BatchUploader.CONTENT_TYPE = 'text/plain;charset=UTF-8';
      BatchUploader.MINIMUM_INTERVAL_MILLIS = 500;
      return BatchUploader;
    }();

    function APIClient(mpInstance, kitBlocker) {
      this.uploader = null;
      var self = this;
      this.queueEventForBatchUpload = function (event) {
        if (!this.uploader) {
          // https://go.mparticle.com/work/SQDSDKS-6317
          var millis = parseNumber(mpInstance._Helpers.getFeatureFlag(Constants.FeatureFlags.EventBatchingIntervalMillis));
          this.uploader = new BatchUploader(mpInstance, millis);
        }
        this.uploader.queueEvent(event);
        // https://go.mparticle.com/work/SQDSDKS-6038
        mpInstance._Persistence.update();
      };
      this.processQueuedEvents = function () {
        var mpid,
          currentUser = mpInstance.Identity.getCurrentUser();
        if (currentUser) {
          mpid = currentUser.getMPID();
        }
        if (mpInstance._Store.eventQueue.length && mpid) {
          var localQueueCopy = mpInstance._Store.eventQueue;
          mpInstance._Store.eventQueue = [];
          this.appendUserInfoToEvents(currentUser, localQueueCopy);
          localQueueCopy.forEach(function (event) {
            self.sendEventToServer(event);
          });
        }
      };
      this.appendUserInfoToEvents = function (user, events) {
        events.forEach(function (event) {
          if (!event.MPID) {
            mpInstance._ServerModel.appendUserInfo(user, event);
          }
        });
      };
      this.sendEventToServer = function (event, _options) {
        var defaultOptions = {
          shouldUploadEvent: true
        };
        var options = mpInstance._Helpers.extend(defaultOptions, _options);
        if (mpInstance._Store.webviewBridgeEnabled) {
          mpInstance._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.LogEvent, JSON.stringify(event));
          return;
        }
        var mpid,
          currentUser = mpInstance.Identity.getCurrentUser();
        if (currentUser) {
          mpid = currentUser.getMPID();
        }
        mpInstance._Store.requireDelay = mpInstance._Helpers.isDelayedByIntegration(mpInstance._preInit.integrationDelays, mpInstance._Store.integrationDelayTimeoutStart, Date.now());
        // We queue events if there is no MPID (MPID is null, or === 0), or there are integrations that that require this to stall because integration attributes
        // need to be set, or if we are still fetching the config (self hosted only), and so require delaying events
        if (!mpid || mpInstance._Store.requireDelay || !mpInstance._Store.configurationLoaded) {
          mpInstance.Logger.verbose('Event was added to eventQueue. eventQueue will be processed once a valid MPID is returned or there is no more integration imposed delay.');
          mpInstance._Store.eventQueue.push(event);
          return;
        }
        this.processQueuedEvents();
        if (isEmpty(event)) {
          return;
        }
        // https://go.mparticle.com/work/SQDSDKS-6038
        if (options.shouldUploadEvent) {
          this.queueEventForBatchUpload(event);
        }
        if (event.EventName !== Types.MessageType.AppStateTransition) {
          if (kitBlocker && kitBlocker.kitBlockingEnabled) {
            event = kitBlocker.createBlockedEvent(event);
          }
          // We need to check event again, because kitblocking
          // can nullify the event
          if (event) {
            mpInstance._Forwarders.sendEventToForwarders(event);
          }
        }
      };
      this.sendBatchForwardingStatsToServer = function (forwardingStatsData, xhr) {
        var url;
        var data;
        try {
          url = mpInstance._Helpers.createServiceUrl(mpInstance._Store.SDKConfig.v2SecureServiceUrl, mpInstance._Store.devToken);
          data = {
            uuid: mpInstance._Helpers.generateUniqueId(),
            data: forwardingStatsData
          };
          if (xhr) {
            xhr.open('post', url + '/Forwarding');
            xhr.send(JSON.stringify(data));
          }
        } catch (e) {
          mpInstance.Logger.error('Error sending forwarding stats to mParticle servers.');
        }
      };
      this.initializeForwarderStatsUploader = function () {
        var forwardingDomain = mpInstance._Store.SDKConfig.v1SecureServiceUrl;
        var devToken = mpInstance._Store.devToken;
        var uploadUrl = "https://".concat(forwardingDomain).concat(devToken, "/Forwarding");
        var uploader = window.fetch ? new FetchUploader(uploadUrl) : new XHRUploader(uploadUrl);
        return uploader;
      };
      this.prepareForwardingStats = function (forwarder, event) {
        var forwardingStatsData;
        var queue = mpInstance._Forwarders.getForwarderStatsQueue();
        if (forwarder && forwarder.isVisible) {
          forwardingStatsData = {
            mid: forwarder.id,
            esid: forwarder.eventSubscriptionId,
            n: event.EventName,
            attrs: event.EventAttributes,
            sdk: event.SDKVersion,
            dt: event.EventDataType,
            et: event.EventCategory,
            dbg: event.Debug,
            ct: event.Timestamp,
            eec: event.ExpandedEventCount,
            dp: event.DataPlan
          };
          var _a = mpInstance._Forwarders,
            sendSingleForwardingStatsToServer = _a.sendSingleForwardingStatsToServer,
            setForwarderStatsQueue = _a.setForwarderStatsQueue;
          if (mpInstance._Helpers.getFeatureFlag(Constants.FeatureFlags.ReportBatching)) {
            queue.push(forwardingStatsData);
            setForwarderStatsQueue(queue);
          } else {
            sendSingleForwardingStatsToServer(forwardingStatsData);
          }
        }
      };
    }

    var Modify$4 = Constants.IdentityMethods.Modify;
    var Validators = {
      // From ./utils
      // Utility Functions for backwards compatability
      isNumber: isNumber,
      isFunction: isFunction,
      isStringOrNumber: isStringOrNumber,
      // Validator Functions
      isValidAttributeValue: function isValidAttributeValue(value) {
        return value !== undefined && !isObject(value) && !Array.isArray(value);
      },
      // Validator Functions
      // Neither null nor undefined can be a valid Key
      isValidKeyValue: function isValidKeyValue(key) {
        return Boolean(key && !isObject(key) && !Array.isArray(key) && !this.isFunction(key));
      },
      validateIdentities: function validateIdentities(identityApiData, method) {
        var validIdentityRequestKeys = {
          userIdentities: 1,
          onUserAlias: 1,
          copyUserAttributes: 1
        };
        if (identityApiData) {
          if (method === Modify$4) {
            if (isObject(identityApiData.userIdentities) && !Object.keys(identityApiData.userIdentities).length || !isObject(identityApiData.userIdentities)) {
              return {
                valid: false,
                error: Constants.Messages.ValidationMessages.ModifyIdentityRequestUserIdentitiesPresent
              };
            }
          }
          for (var key in identityApiData) {
            if (identityApiData.hasOwnProperty(key)) {
              if (!validIdentityRequestKeys[key]) {
                return {
                  valid: false,
                  error: Constants.Messages.ValidationMessages.IdentityRequesetInvalidKey
                };
              }
              if (key === 'onUserAlias' && !Validators.isFunction(identityApiData[key])) {
                return {
                  valid: false,
                  error: Constants.Messages.ValidationMessages.OnUserAliasType
                };
              }
            }
          }
          if (Object.keys(identityApiData).length === 0) {
            return {
              valid: true
            };
          } else {
            // identityApiData.userIdentities can't be undefined
            if (identityApiData.userIdentities === undefined) {
              return {
                valid: false,
                error: Constants.Messages.ValidationMessages.UserIdentities
              };
              // identityApiData.userIdentities can be null, but if it isn't null or undefined (above conditional), it must be an object
            } else if (identityApiData.userIdentities !== null && !isObject(identityApiData.userIdentities)) {
              return {
                valid: false,
                error: Constants.Messages.ValidationMessages.UserIdentities
              };
            }
            if (isObject(identityApiData.userIdentities) && Object.keys(identityApiData.userIdentities).length) {
              for (var identityType in identityApiData.userIdentities) {
                if (identityApiData.userIdentities.hasOwnProperty(identityType)) {
                  if (Types.IdentityType.getIdentityType(identityType) === false) {
                    return {
                      valid: false,
                      error: Constants.Messages.ValidationMessages.UserIdentitiesInvalidKey
                    };
                  }
                  if (!(typeof identityApiData.userIdentities[identityType] === 'string' || identityApiData.userIdentities[identityType] === null)) {
                    return {
                      valid: false,
                      error: Constants.Messages.ValidationMessages.UserIdentitiesInvalidValues
                    };
                  }
                }
              }
            }
          }
        }
        return {
          valid: true
        };
      }
    };

    var KitFilterHelper = /** @class */function () {
      function KitFilterHelper() {}
      KitFilterHelper.hashEventType = function (eventType) {
        return generateHash(eventType);
      };
      KitFilterHelper.hashEventName = function (eventName, eventType) {
        return generateHash(eventType + eventName);
      };
      KitFilterHelper.hashEventAttributeKey = function (eventType, eventName, customAttributeName) {
        return generateHash(eventType + eventName + customAttributeName);
      };
      KitFilterHelper.hashUserAttribute = function (userAttributeKey) {
        return generateHash(userAttributeKey);
      };
      // User Identities are not actually hashed, this method is named this way to
      // be consistent with the filter class. UserIdentityType is also a number
      KitFilterHelper.hashUserIdentity = function (userIdentity) {
        return userIdentity;
      };
      KitFilterHelper.hashConsentPurpose = function (prefix, purpose) {
        return generateHash(prefix + purpose);
      };
      // The methods below are for conditional forwarding, a type of filter
      // hashAttributeCondiitonalForwarding is used for both User and Event
      // attribute keys and attribute values
      // The backend returns the hashes as strings for conditional forwarding
      // but returns "regular" filters as arrays of numbers
      // See IFilteringEventAttributeValue in configApiClient.ts as an example
      KitFilterHelper.hashAttributeConditionalForwarding = function (attribute) {
        return generateHash(attribute).toString();
      };
      KitFilterHelper.hashConsentPurposeConditionalForwarding = function (prefix, purpose) {
        return this.hashConsentPurpose(prefix, purpose).toString();
      };
      return KitFilterHelper;
    }();

    var StorageNames$1 = Constants.StorageNames;
    function Helpers(mpInstance) {
      var self = this;
      this.canLog = function () {
        if (mpInstance._Store.isEnabled && (mpInstance._Store.devToken || mpInstance._Store.webviewBridgeEnabled)) {
          return true;
        }
        return false;
      };
      this.getFeatureFlag = function (feature) {
        if (mpInstance._Store.SDKConfig.flags.hasOwnProperty(feature)) {
          return mpInstance._Store.SDKConfig.flags[feature];
        }
        return null;
      };
      this.invokeCallback = function (callback, code, body, mParticleUser, previousMpid) {
        if (!callback) {
          mpInstance.Logger.warning('There is no callback provided');
        }
        try {
          if (self.Validators.isFunction(callback)) {
            callback({
              httpCode: code,
              body: body,
              getUser: function getUser() {
                if (mParticleUser) {
                  return mParticleUser;
                } else {
                  return mpInstance.Identity.getCurrentUser();
                }
              },
              getPreviousUser: function getPreviousUser() {
                if (!previousMpid) {
                  var users = mpInstance.Identity.getUsers();
                  var mostRecentUser = users.shift();
                  var currentUser = mParticleUser || mpInstance.Identity.getCurrentUser();
                  if (mostRecentUser && currentUser && mostRecentUser.getMPID() === currentUser.getMPID()) {
                    mostRecentUser = users.shift();
                  }
                  return mostRecentUser || null;
                } else {
                  return mpInstance.Identity.getUser(previousMpid);
                }
              }
            });
          }
        } catch (e) {
          mpInstance.Logger.error('There was an error with your callback: ' + e);
        }
      };
      this.invokeAliasCallback = function (callback, code, message) {
        if (!callback) {
          mpInstance.Logger.warning('There is no callback provided');
        }
        try {
          if (self.Validators.isFunction(callback)) {
            var callbackMessage = {
              httpCode: code
            };
            if (message) {
              callbackMessage.message = message;
            }
            callback(callbackMessage);
          }
        } catch (e) {
          mpInstance.Logger.error('There was an error with your callback: ' + e);
        }
      };

      // https://go.mparticle.com/work/SQDSDKS-6047
      // Standalone version of jQuery.extend, from https://github.com/dansdom/extend
      this.extend = function () {
        var options,
          name,
          src,
          copy,
          copyIsArray,
          clone,
          target = arguments[0] || {},
          i = 1,
          length = arguments.length,
          deep = false,
          // helper which replicates the jquery internal functions
          objectHelper = {
            hasOwn: Object.prototype.hasOwnProperty,
            class2type: {},
            type: function type(obj) {
              return obj == null ? String(obj) : objectHelper.class2type[Object.prototype.toString.call(obj)] || 'object';
            },
            isPlainObject: function isPlainObject(obj) {
              if (!obj || objectHelper.type(obj) !== 'object' || obj.nodeType || objectHelper.isWindow(obj)) {
                return false;
              }
              try {
                if (obj.constructor && !objectHelper.hasOwn.call(obj, 'constructor') && !objectHelper.hasOwn.call(obj.constructor.prototype, 'isPrototypeOf')) {
                  return false;
                }
              } catch (e) {
                return false;
              }
              var key;
              for (key in obj) {} // eslint-disable-line no-empty

              return key === undefined || objectHelper.hasOwn.call(obj, key);
            },
            isArray: Array.isArray || function (obj) {
              return objectHelper.type(obj) === 'array';
            },
            isFunction: function isFunction(obj) {
              return objectHelper.type(obj) === 'function';
            },
            isWindow: function isWindow(obj) {
              return obj != null && obj == obj.window;
            }
          }; // end of objectHelper

        // Handle a deep copy situation
        if (typeof target === 'boolean') {
          deep = target;
          target = arguments[1] || {};
          // skip the boolean and the target
          i = 2;
        }

        // Handle case when target is a string or something (possible in deep copy)
        if (_typeof$1(target) !== 'object' && !objectHelper.isFunction(target)) {
          target = {};
        }

        // If no second argument is used then this can extend an object that is using this method
        if (length === i) {
          target = this;
          --i;
        }
        for (; i < length; i++) {
          // Only deal with non-null/undefined values
          if ((options = arguments[i]) != null) {
            // Extend the base object
            for (name in options) {
              src = target[name];
              copy = options[name];

              // Prevent never-ending loop
              if (target === copy) {
                continue;
              }

              // Recurse if we're merging plain objects or arrays
              if (deep && copy && (objectHelper.isPlainObject(copy) || (copyIsArray = objectHelper.isArray(copy)))) {
                if (copyIsArray) {
                  copyIsArray = false;
                  clone = src && objectHelper.isArray(src) ? src : [];
                } else {
                  clone = src && objectHelper.isPlainObject(src) ? src : {};
                }

                // Never move original objects, clone them
                target[name] = self.extend(deep, clone, copy);

                // Don't bring in undefined values
              } else if (copy !== undefined) {
                target[name] = copy;
              }
            }
          }
        }

        // Return the modified object
        return target;
      };
      this.createServiceUrl = function (secureServiceUrl, devToken) {
        var serviceScheme = window.mParticle && mpInstance._Store.SDKConfig.forceHttps ? 'https://' : window.location.protocol + '//';
        var baseUrl;
        if (mpInstance._Store.SDKConfig.forceHttps) {
          baseUrl = 'https://' + secureServiceUrl;
        } else {
          baseUrl = serviceScheme + secureServiceUrl;
        }
        if (devToken) {
          baseUrl = baseUrl + devToken;
        }
        return baseUrl;
      };
      this.createXHR = function (cb) {
        var xhr;
        try {
          xhr = new window.XMLHttpRequest();
        } catch (e) {
          mpInstance.Logger.error('Error creating XMLHttpRequest object.');
        }
        if (xhr && cb && 'withCredentials' in xhr) {
          xhr.onreadystatechange = cb;
        } else if (typeof window.XDomainRequest !== 'undefined') {
          mpInstance.Logger.verbose('Creating XDomainRequest object');
          try {
            xhr = new window.XDomainRequest();
            xhr.onload = cb;
          } catch (e) {
            mpInstance.Logger.error('Error creating XDomainRequest object');
          }
        }
        return xhr;
      };
      this.filterUserIdentities = function (userIdentitiesObject, filterList) {
        var filteredUserIdentities = [];
        if (userIdentitiesObject && Object.keys(userIdentitiesObject).length) {
          for (var userIdentityName in userIdentitiesObject) {
            if (userIdentitiesObject.hasOwnProperty(userIdentityName)) {
              var userIdentityType = Types.IdentityType.getIdentityType(userIdentityName);
              if (!self.inArray(filterList, userIdentityType)) {
                var identity = {
                  Type: userIdentityType,
                  Identity: userIdentitiesObject[userIdentityName]
                };
                if (userIdentityType === Types.IdentityType.CustomerId) {
                  filteredUserIdentities.unshift(identity);
                } else {
                  filteredUserIdentities.push(identity);
                }
              }
            }
          }
        }
        return filteredUserIdentities;
      };
      this.filterUserIdentitiesForForwarders = function (userIdentitiesObject, filterList) {
        var filteredUserIdentities = {};
        if (userIdentitiesObject && Object.keys(userIdentitiesObject).length) {
          for (var userIdentityName in userIdentitiesObject) {
            if (userIdentitiesObject.hasOwnProperty(userIdentityName)) {
              var userIdentityType = KitFilterHelper.hashUserIdentity(Types.IdentityType.getIdentityType(userIdentityName));
              if (!self.inArray(filterList, userIdentityType)) {
                filteredUserIdentities[userIdentityName] = userIdentitiesObject[userIdentityName];
              }
            }
          }
        }
        return filteredUserIdentities;
      };
      this.filterUserAttributes = function (userAttributes, filterList) {
        var filteredUserAttributes = {};
        if (userAttributes && Object.keys(userAttributes).length) {
          for (var userAttribute in userAttributes) {
            if (userAttributes.hasOwnProperty(userAttribute)) {
              var hashedUserAttribute = KitFilterHelper.hashUserAttribute(userAttribute);
              if (!self.inArray(filterList, hashedUserAttribute)) {
                filteredUserAttributes[userAttribute] = userAttributes[userAttribute];
              }
            }
          }
        }
        return filteredUserAttributes;
      };
      this.isFilteredUserAttribute = function (userAttributeKey, filterList) {
        var hashedUserAttribute = KitFilterHelper.hashUserAttribute(userAttributeKey);
        return filterList && self.inArray(filterList, hashedUserAttribute);
      };
      this.isEventType = function (type) {
        for (var prop in Types.EventType) {
          if (Types.EventType.hasOwnProperty(prop)) {
            if (Types.EventType[prop] === type) {
              return true;
            }
          }
        }
        return false;
      };
      this.sanitizeAttributes = function (attrs, name) {
        if (!attrs || !self.isObject(attrs)) {
          return null;
        }
        var sanitizedAttrs = {};
        for (var prop in attrs) {
          // Make sure that attribute values are not objects or arrays, which are not valid
          if (attrs.hasOwnProperty(prop) && self.Validators.isValidAttributeValue(attrs[prop])) {
            sanitizedAttrs[prop] = attrs[prop];
          } else {
            mpInstance.Logger.warning("For '" + name + "', the corresponding attribute value of '" + prop + "' must be a string, number, boolean, or null.");
          }
        }
        return sanitizedAttrs;
      };
      this.isDelayedByIntegration = function (delayedIntegrations, timeoutStart, now) {
        if (now - timeoutStart > mpInstance._Store.SDKConfig.integrationDelayTimeout) {
          return false;
        }
        for (var integration in delayedIntegrations) {
          if (delayedIntegrations[integration] === true) {
            return true;
          } else {
            continue;
          }
        }
        return false;
      };
      this.createMainStorageName = function (workspaceToken) {
        if (workspaceToken) {
          return StorageNames$1.currentStorageName + '_' + workspaceToken;
        } else {
          return StorageNames$1.currentStorageName;
        }
      };
      this.createProductStorageName = function (workspaceToken) {
        if (workspaceToken) {
          return StorageNames$1.currentStorageProductsName + '_' + workspaceToken;
        } else {
          return StorageNames$1.currentStorageProductsName;
        }
      };

      // TODO: Refactor SDK to directly use these methods
      // https://go.mparticle.com/work/SQDSDKS-5239
      // Utility Functions
      this.converted = converted;
      this.findKeyInObject = findKeyInObject;
      this.parseNumber = parseNumber;
      this.inArray = inArray;
      this.isObject = isObject;
      this.decoded = decoded;
      this.parseStringOrNumber = parseStringOrNumber;
      this.generateHash = generateHash;
      this.generateUniqueId = generateUniqueId;

      // Imported Validators
      this.Validators = Validators;
    }

    var Messages$9 = Constants.Messages;
    var androidBridgeNameBase = 'mParticleAndroid';
    var iosBridgeNameBase = 'mParticle';
    function NativeSdkHelpers(mpInstance) {
      var self = this;
      this.initializeSessionAttributes = function (apiKey) {
        var SetSessionAttribute = Constants.NativeSdkPaths.SetSessionAttribute;
        var env = JSON.stringify({
          key: '$src_env',
          value: 'webview'
        });
        var key = JSON.stringify({
          key: '$src_key',
          value: apiKey
        });
        self.sendToNative(SetSessionAttribute, env);
        if (apiKey) {
          self.sendToNative(SetSessionAttribute, key);
        }
      };
      this.isBridgeV2Available = function (bridgeName) {
        if (!bridgeName) {
          return false;
        }
        var androidBridgeName = androidBridgeNameBase + '_' + bridgeName + '_v2';
        var iosBridgeName = iosBridgeNameBase + '_' + bridgeName + '_v2';

        // iOS v2 bridge
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.hasOwnProperty(iosBridgeName)) {
          return true;
        }
        // other iOS v2 bridge
        // TODO: what to do about people setting things on mParticle itself?
        if (window.mParticle && window.mParticle.uiwebviewBridgeName && window.mParticle.uiwebviewBridgeName === iosBridgeName) {
          return true;
        }
        // android
        if (window.hasOwnProperty(androidBridgeName)) {
          return true;
        }
        return false;
      };
      this.isWebviewEnabled = function (requiredWebviewBridgeName, minWebviewBridgeVersion) {
        mpInstance._Store.bridgeV2Available = self.isBridgeV2Available(requiredWebviewBridgeName);
        mpInstance._Store.bridgeV1Available = self.isBridgeV1Available();
        if (minWebviewBridgeVersion === 2) {
          return mpInstance._Store.bridgeV2Available;
        }

        // iOS BridgeV1 can be available via mParticle.isIOS, but return false if uiwebviewBridgeName doesn't match requiredWebviewBridgeName
        if (window.mParticle) {
          if (window.mParticle.uiwebviewBridgeName && window.mParticle.uiwebviewBridgeName !== iosBridgeNameBase + '_' + requiredWebviewBridgeName + '_v2') {
            return false;
          }
        }
        if (minWebviewBridgeVersion < 2) {
          // ios
          return mpInstance._Store.bridgeV2Available || mpInstance._Store.bridgeV1Available;
        }
        return false;
      };
      this.isBridgeV1Available = function () {
        if (mpInstance._Store.SDKConfig.useNativeSdk || window.mParticleAndroid || mpInstance._Store.SDKConfig.isIOS) {
          return true;
        }
        return false;
      };
      this.sendToNative = function (path, value) {
        if (mpInstance._Store.bridgeV2Available && mpInstance._Store.SDKConfig.minWebviewBridgeVersion === 2) {
          self.sendViaBridgeV2(path, value, mpInstance._Store.SDKConfig.requiredWebviewBridgeName);
          return;
        }
        if (mpInstance._Store.bridgeV2Available && mpInstance._Store.SDKConfig.minWebviewBridgeVersion < 2) {
          self.sendViaBridgeV2(path, value, mpInstance._Store.SDKConfig.requiredWebviewBridgeName);
          return;
        }
        if (mpInstance._Store.bridgeV1Available && mpInstance._Store.SDKConfig.minWebviewBridgeVersion < 2) {
          self.sendViaBridgeV1(path, value);
          return;
        }
      };
      this.sendViaBridgeV1 = function (path, value) {
        if (window.mParticleAndroid && window.mParticleAndroid.hasOwnProperty(path)) {
          mpInstance.Logger.verbose(Messages$9.InformationMessages.SendAndroid + path);
          window.mParticleAndroid[path](value);
        } else if (mpInstance._Store.SDKConfig.isIOS) {
          mpInstance.Logger.verbose(Messages$9.InformationMessages.SendIOS + path);
          self.sendViaIframeToIOS(path, value);
        }
      };
      this.sendViaIframeToIOS = function (path, value) {
        var iframe = document.createElement('IFRAME');
        iframe.setAttribute('src', 'mp-sdk://' + path + '/' + encodeURIComponent(value));
        document.documentElement.appendChild(iframe);
        iframe.parentNode.removeChild(iframe);
      };
      this.sendViaBridgeV2 = function (path, value, requiredWebviewBridgeName) {
        if (!requiredWebviewBridgeName) {
          return;
        }
        var androidBridgeName = androidBridgeNameBase + '_' + requiredWebviewBridgeName + '_v2',
          androidBridge = window[androidBridgeName],
          iosBridgeName = iosBridgeNameBase + '_' + requiredWebviewBridgeName + '_v2',
          iOSBridgeMessageHandler,
          iOSBridgeNonMessageHandler;
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers[iosBridgeName]) {
          iOSBridgeMessageHandler = window.webkit.messageHandlers[iosBridgeName];
        }
        if (mpInstance.uiwebviewBridgeName === iosBridgeName) {
          iOSBridgeNonMessageHandler = mpInstance[iosBridgeName];
        }
        if (androidBridge && androidBridge.hasOwnProperty(path)) {
          mpInstance.Logger.verbose(Messages$9.InformationMessages.SendAndroid + path);
          androidBridge[path](value);
          return;
        } else if (iOSBridgeMessageHandler) {
          mpInstance.Logger.verbose(Messages$9.InformationMessages.SendIOS + path);
          iOSBridgeMessageHandler.postMessage(JSON.stringify({
            path: path,
            value: value ? JSON.parse(value) : null
          }));
        } else if (iOSBridgeNonMessageHandler) {
          mpInstance.Logger.verbose(Messages$9.InformationMessages.SendIOS + path);
          self.sendViaIframeToIOS(path, value);
        }
      };
    }

    var Messages$8 = Constants.Messages;
    function cookieSyncManager(mpInstance) {
      var self = this;

      // Public
      this.attemptCookieSync = function (previousMPID, mpid, mpidIsNotInCookies) {
        // TODO: These should move inside the for loop
        var pixelConfig, lastSyncDateForModule, url, redirect, urlWithRedirect, requiresConsent;

        // TODO: Make this exit quicker instead of nested
        if (mpid && !mpInstance._Store.webviewBridgeEnabled) {
          mpInstance._Store.pixelConfigurations.forEach(function (pixelSettings) {
            // set requiresConsent to false to start each additional pixel configuration
            // set to true only if filteringConsenRuleValues.values.length exists
            requiresConsent = false;

            // TODO: Replace with isEmpty
            if (pixelSettings.filteringConsentRuleValues && pixelSettings.filteringConsentRuleValues.values && pixelSettings.filteringConsentRuleValues.values.length) {
              requiresConsent = true;
            }
            pixelConfig = {
              // Kit Module ID
              moduleId: pixelSettings.moduleId,
              // Tells you how often we should do a cookie sync (in days)
              frequencyCap: pixelSettings.frequencyCap,
              // Url for cookie sync pixel
              pixelUrl: self.replaceAmp(pixelSettings.pixelUrl),
              // TODO: Document requirements for redirectUrl
              redirectUrl: pixelSettings.redirectUrl ? self.replaceAmp(pixelSettings.redirectUrl) : null,
              // Filtering rules as defined in UI
              filteringConsentRuleValues: pixelSettings.filteringConsentRuleValues
            };

            // TODO: combine replaceMPID and replaceAmp into sanitizeUrl function
            url = self.replaceMPID(pixelConfig.pixelUrl, mpid);
            redirect = pixelConfig.redirectUrl ? self.replaceMPID(pixelConfig.redirectUrl, mpid) : '';
            urlWithRedirect = url + encodeURIComponent(redirect);

            // TODO: Refactor so that Persistence is only called once
            //       outside of the loop
            var persistence = mpInstance._Persistence.getPersistence();

            // TODO: Is there a historic reason for checking for previousMPID?
            //       it does not appear to be passed in anywhere
            if (previousMPID && previousMPID !== mpid) {
              if (persistence && persistence[mpid]) {
                if (!persistence[mpid].csd) {
                  persistence[mpid].csd = {};
                }
                self.performCookieSync(urlWithRedirect, pixelConfig.moduleId, mpid, persistence[mpid].csd, pixelConfig.filteringConsentRuleValues, mpidIsNotInCookies, requiresConsent);
              }
              return;
            } else {
              // TODO: Refactor to check for the inverse and exit early
              //       rather than nesting
              if (persistence[mpid]) {
                if (!persistence[mpid].csd) {
                  persistence[mpid].csd = {};
                }
                lastSyncDateForModule = persistence[mpid].csd[pixelConfig.moduleId.toString()] ? persistence[mpid].csd[pixelConfig.moduleId.toString()] : null;
                if (lastSyncDateForModule) {
                  // Check to see if we need to refresh cookieSync
                  if (
                  // TODO: Turn this into a convenience method for readability?
                  //       We use similar comparisons elsewhere in the SDK,
                  //       so perhaps we can make a time comparison convenience method
                  new Date().getTime() > new Date(lastSyncDateForModule).getTime() + pixelConfig.frequencyCap *
                  // TODO: Turn these numbers into a constant so
                  //       we can remember what this number is for
                  60 * 1000 * 60 * 24) {
                    self.performCookieSync(urlWithRedirect, pixelConfig.moduleId, mpid, persistence[mpid].csd, pixelConfig.filteringConsentRuleValues, mpidIsNotInCookies, requiresConsent);
                  }
                } else {
                  self.performCookieSync(urlWithRedirect, pixelConfig.moduleId, mpid, persistence[mpid].csd, pixelConfig.filteringConsentRuleValues, mpidIsNotInCookies, requiresConsent);
                }
              }
            }
          });
        }
      };

      // Private
      this.replaceMPID = function (string, mpid) {
        return string.replace('%%mpid%%', mpid);
      };

      // Private
      // TODO: Rename function to replaceAmpWithAmpersand
      this.replaceAmp = function (string) {
        return string.replace(/&amp;/g, '&');
      };

      // Private
      this.performCookieSync = function (url, moduleId, mpid, cookieSyncDates, filteringConsentRuleValues, mpidIsNotInCookies, requiresConsent) {
        // if MPID is new to cookies, we should not try to perform the cookie sync
        // because a cookie sync can only occur once a user either consents or doesn't
        // we should not check if its enabled if the user has a blank consent
        // TODO: We should do this check outside of this function
        if (requiresConsent && mpidIsNotInCookies) {
          return;
        }

        // TODO: Refactor so that check is made outside of the function.
        //       Cache or store the boolean so that it only gets called once per
        //       cookie sync attempt per module.
        //       Currently, attemptCookieSync is called as a loop and therefore this
        //       function polls the user object and consent multiple times.
        if (mpInstance._Consent.isEnabledForUserConsent(filteringConsentRuleValues, mpInstance.Identity.getCurrentUser())) {
          var img = document.createElement('img');
          mpInstance.Logger.verbose(Messages$8.InformationMessages.CookieSync);
          img.onload = function () {
            // TODO: Break this out into a convenience method so we can unit test
            cookieSyncDates[moduleId.toString()] = new Date().getTime();
            mpInstance._Persistence.saveUserCookieSyncDatesToPersistence(mpid, cookieSyncDates);
          };
          img.src = url;
        }
      };
    }

    var Messages$7 = Constants.Messages;
    function SessionManager(mpInstance) {
      var self = this;
      this.initialize = function () {
        if (mpInstance._Store.sessionId) {
          var sessionTimeoutInMilliseconds = mpInstance._Store.SDKConfig.sessionTimeout * 60000;
          if (new Date() > new Date(mpInstance._Store.dateLastEventSent.getTime() + sessionTimeoutInMilliseconds)) {
            self.endSession();
            self.startNewSession();
          } else {
            // https://go.mparticle.com/work/SQDSDKS-6045
            var persistence = mpInstance._Persistence.getPersistence();
            if (persistence && !persistence.cu) {
              // https://go.mparticle.com/work/SQDSDKS-6323
              mpInstance.Identity.identify(mpInstance._Store.SDKConfig.identifyRequest, mpInstance._Store.SDKConfig.identityCallback);
              mpInstance._Store.identifyCalled = true;
              mpInstance._Store.SDKConfig.identityCallback = null;
            }
          }
        } else {
          self.startNewSession();
        }
      };
      this.getSession = function () {
        mpInstance.Logger.warning(generateDeprecationMessage('SessionManager.getSession()', 'SessionManager.getSessionId()'));
        return this.getSessionId();
      };
      this.getSessionId = function () {
        return mpInstance._Store.sessionId;
      };
      this.startNewSession = function () {
        mpInstance.Logger.verbose(Messages$7.InformationMessages.StartingNewSession);
        if (mpInstance._Helpers.canLog()) {
          mpInstance._Store.sessionId = mpInstance._Helpers.generateUniqueId().toUpperCase();
          var currentUser = mpInstance.Identity.getCurrentUser();
          var mpid = currentUser ? currentUser.getMPID() : null;
          if (mpid) {
            mpInstance._Store.currentSessionMPIDs = [mpid];
          }
          if (!mpInstance._Store.sessionStartDate) {
            var date = new Date();
            mpInstance._Store.sessionStartDate = date;
            mpInstance._Store.dateLastEventSent = date;
          }
          self.setSessionTimer();
          if (!mpInstance._Store.identifyCalled) {
            mpInstance.Identity.identify(mpInstance._Store.SDKConfig.identifyRequest, mpInstance._Store.SDKConfig.identityCallback);
            mpInstance._Store.identifyCalled = true;
            mpInstance._Store.SDKConfig.identityCallback = null;
          }
          mpInstance._Events.logEvent({
            messageType: Types.MessageType.SessionStart
          });
        } else {
          mpInstance.Logger.verbose(Messages$7.InformationMessages.AbandonStartSession);
        }
      };
      this.endSession = function (override) {
        var _a;
        mpInstance.Logger.verbose(Messages$7.InformationMessages.StartingEndSession);
        if (override) {
          mpInstance._Events.logEvent({
            messageType: Types.MessageType.SessionEnd
          });
          mpInstance._Store.nullifySession();
          return;
        }
        if (!mpInstance._Helpers.canLog()) {
          // At this moment, an AbandonedEndSession is defined when on of three things occurs:
          // - the SDK's store is not enabled because mParticle.setOptOut was called
          // - the devToken is undefined
          // - webviewBridgeEnabled is set to false
          mpInstance.Logger.verbose(Messages$7.InformationMessages.AbandonEndSession);
          return;
        }
        var sessionTimeoutInMilliseconds;
        var timeSinceLastEventSent;
        var cookies = mpInstance._Persistence.getPersistence();
        if (!cookies || cookies.gs && !cookies.gs.sid) {
          mpInstance.Logger.verbose(Messages$7.InformationMessages.NoSessionToEnd);
          return;
        }
        // sessionId is not equal to cookies.sid if cookies.sid is changed in another tab
        if (cookies.gs.sid && mpInstance._Store.sessionId !== cookies.gs.sid) {
          mpInstance._Store.sessionId = cookies.gs.sid;
        }
        if ((_a = cookies === null || cookies === void 0 ? void 0 : cookies.gs) === null || _a === void 0 ? void 0 : _a.les) {
          sessionTimeoutInMilliseconds = mpInstance._Store.SDKConfig.sessionTimeout * 60000;
          var newDate = new Date().getTime();
          timeSinceLastEventSent = newDate - cookies.gs.les;
          if (timeSinceLastEventSent < sessionTimeoutInMilliseconds) {
            self.setSessionTimer();
          } else {
            mpInstance._Events.logEvent({
              messageType: Types.MessageType.SessionEnd
            });
            mpInstance._Store.sessionStartDate = null;
            mpInstance._Store.nullifySession();
          }
        }
      };
      this.setSessionTimer = function () {
        var sessionTimeoutInMilliseconds = mpInstance._Store.SDKConfig.sessionTimeout * 60000;
        mpInstance._Store.globalTimer = window.setTimeout(function () {
          self.endSession();
        }, sessionTimeoutInMilliseconds);
      };
      this.resetSessionTimer = function () {
        if (!mpInstance._Store.webviewBridgeEnabled) {
          if (!mpInstance._Store.sessionId) {
            self.startNewSession();
          }
          self.clearSessionTimeout();
          self.setSessionTimer();
        }
        self.startNewSessionIfNeeded();
      };
      this.clearSessionTimeout = function () {
        clearTimeout(mpInstance._Store.globalTimer);
      };
      this.startNewSessionIfNeeded = function () {
        if (!mpInstance._Store.webviewBridgeEnabled) {
          var persistence = mpInstance._Persistence.getPersistence();
          if (!mpInstance._Store.sessionId && persistence) {
            if (persistence.sid) {
              mpInstance._Store.sessionId = persistence.sid;
            } else {
              self.startNewSession();
            }
          }
        }
      };
    }

    var Messages$6 = Constants.Messages;
    function Ecommerce(mpInstance) {
      var self = this;
      this.convertTransactionAttributesToProductAction = function (transactionAttributes, productAction) {
        if (transactionAttributes.hasOwnProperty('Id')) {
          productAction.TransactionId = transactionAttributes.Id;
        }
        if (transactionAttributes.hasOwnProperty('Affiliation')) {
          productAction.Affiliation = transactionAttributes.Affiliation;
        }
        if (transactionAttributes.hasOwnProperty('CouponCode')) {
          productAction.CouponCode = transactionAttributes.CouponCode;
        }
        if (transactionAttributes.hasOwnProperty('Revenue')) {
          productAction.TotalAmount = this.sanitizeAmount(transactionAttributes.Revenue, 'Revenue');
        }
        if (transactionAttributes.hasOwnProperty('Shipping')) {
          productAction.ShippingAmount = this.sanitizeAmount(transactionAttributes.Shipping, 'Shipping');
        }
        if (transactionAttributes.hasOwnProperty('Tax')) {
          productAction.TaxAmount = this.sanitizeAmount(transactionAttributes.Tax, 'Tax');
        }
        if (transactionAttributes.hasOwnProperty('Step')) {
          productAction.CheckoutStep = transactionAttributes.Step;
        }
        if (transactionAttributes.hasOwnProperty('Option')) {
          productAction.CheckoutOptions = transactionAttributes.Option;
        }
      };
      this.getProductActionEventName = function (productActionType) {
        switch (productActionType) {
          case Types.ProductActionType.AddToCart:
            return 'AddToCart';
          case Types.ProductActionType.AddToWishlist:
            return 'AddToWishlist';
          case Types.ProductActionType.Checkout:
            return 'Checkout';
          case Types.ProductActionType.CheckoutOption:
            return 'CheckoutOption';
          case Types.ProductActionType.Click:
            return 'Click';
          case Types.ProductActionType.Purchase:
            return 'Purchase';
          case Types.ProductActionType.Refund:
            return 'Refund';
          case Types.ProductActionType.RemoveFromCart:
            return 'RemoveFromCart';
          case Types.ProductActionType.RemoveFromWishlist:
            return 'RemoveFromWishlist';
          case Types.ProductActionType.ViewDetail:
            return 'ViewDetail';
          case Types.ProductActionType.Unknown:
          default:
            return 'Unknown';
        }
      };
      this.getPromotionActionEventName = function (promotionActionType) {
        switch (promotionActionType) {
          case Types.PromotionActionType.PromotionClick:
            return 'PromotionClick';
          case Types.PromotionActionType.PromotionView:
            return 'PromotionView';
          default:
            return 'Unknown';
        }
      };
      this.convertProductActionToEventType = function (productActionType) {
        switch (productActionType) {
          case Types.ProductActionType.AddToCart:
            return Types.CommerceEventType.ProductAddToCart;
          case Types.ProductActionType.AddToWishlist:
            return Types.CommerceEventType.ProductAddToWishlist;
          case Types.ProductActionType.Checkout:
            return Types.CommerceEventType.ProductCheckout;
          case Types.ProductActionType.CheckoutOption:
            return Types.CommerceEventType.ProductCheckoutOption;
          case Types.ProductActionType.Click:
            return Types.CommerceEventType.ProductClick;
          case Types.ProductActionType.Purchase:
            return Types.CommerceEventType.ProductPurchase;
          case Types.ProductActionType.Refund:
            return Types.CommerceEventType.ProductRefund;
          case Types.ProductActionType.RemoveFromCart:
            return Types.CommerceEventType.ProductRemoveFromCart;
          case Types.ProductActionType.RemoveFromWishlist:
            return Types.CommerceEventType.ProductRemoveFromWishlist;
          case Types.ProductActionType.Unknown:
            return Types.EventType.Unknown;
          case Types.ProductActionType.ViewDetail:
            return Types.CommerceEventType.ProductViewDetail;
          default:
            mpInstance.Logger.error('Could not convert product action type ' + productActionType + ' to event type');
            return null;
        }
      };
      this.convertPromotionActionToEventType = function (promotionActionType) {
        switch (promotionActionType) {
          case Types.PromotionActionType.PromotionClick:
            return Types.CommerceEventType.PromotionClick;
          case Types.PromotionActionType.PromotionView:
            return Types.CommerceEventType.PromotionView;
          default:
            mpInstance.Logger.error('Could not convert promotion action type ' + promotionActionType + ' to event type');
            return null;
        }
      };
      this.generateExpandedEcommerceName = function (eventName, plusOne) {
        return 'eCommerce - ' + eventName + ' - ' + (plusOne ? 'Total' : 'Item');
      };
      this.extractProductAttributes = function (attributes, product) {
        if (product.CouponCode) {
          attributes['Coupon Code'] = product.CouponCode;
        }
        if (product.Brand) {
          attributes['Brand'] = product.Brand;
        }
        if (product.Category) {
          attributes['Category'] = product.Category;
        }
        if (product.Name) {
          attributes['Name'] = product.Name;
        }
        if (product.Sku) {
          attributes['Id'] = product.Sku;
        }
        if (product.Price) {
          attributes['Item Price'] = product.Price;
        }
        if (product.Quantity) {
          attributes['Quantity'] = product.Quantity;
        }
        if (product.Position) {
          attributes['Position'] = product.Position;
        }
        if (product.Variant) {
          attributes['Variant'] = product.Variant;
        }
        attributes['Total Product Amount'] = product.TotalAmount || 0;
      };
      this.extractTransactionId = function (attributes, productAction) {
        if (productAction.TransactionId) {
          attributes['Transaction Id'] = productAction.TransactionId;
        }
      };
      this.extractActionAttributes = function (attributes, productAction) {
        self.extractTransactionId(attributes, productAction);
        if (productAction.Affiliation) {
          attributes['Affiliation'] = productAction.Affiliation;
        }
        if (productAction.CouponCode) {
          attributes['Coupon Code'] = productAction.CouponCode;
        }
        if (productAction.TotalAmount) {
          attributes['Total Amount'] = productAction.TotalAmount;
        }
        if (productAction.ShippingAmount) {
          attributes['Shipping Amount'] = productAction.ShippingAmount;
        }
        if (productAction.TaxAmount) {
          attributes['Tax Amount'] = productAction.TaxAmount;
        }
        if (productAction.CheckoutOptions) {
          attributes['Checkout Options'] = productAction.CheckoutOptions;
        }
        if (productAction.CheckoutStep) {
          attributes['Checkout Step'] = productAction.CheckoutStep;
        }
      };
      this.extractPromotionAttributes = function (attributes, promotion) {
        if (promotion.Id) {
          attributes['Id'] = promotion.Id;
        }
        if (promotion.Creative) {
          attributes['Creative'] = promotion.Creative;
        }
        if (promotion.Name) {
          attributes['Name'] = promotion.Name;
        }
        if (promotion.Position) {
          attributes['Position'] = promotion.Position;
        }
      };
      this.buildProductList = function (event, product) {
        if (product) {
          if (Array.isArray(product)) {
            return product;
          }
          return [product];
        }
        return event.ShoppingCart.ProductList;
      };
      this.createProduct = function (name, sku, price, quantity, variant, category, brand, position, couponCode, attributes) {
        attributes = mpInstance._Helpers.sanitizeAttributes(attributes, name);
        if (typeof name !== 'string') {
          mpInstance.Logger.error('Name is required when creating a product');
          return null;
        }
        if (!mpInstance._Helpers.Validators.isStringOrNumber(sku)) {
          mpInstance.Logger.error('SKU is required when creating a product, and must be a string or a number');
          return null;
        }
        if (!mpInstance._Helpers.Validators.isStringOrNumber(price)) {
          mpInstance.Logger.error('Price is required when creating a product, and must be a string or a number');
          return null;
        } else {
          price = mpInstance._Helpers.parseNumber(price);
        }
        if (position && !mpInstance._Helpers.Validators.isNumber(position)) {
          mpInstance.Logger.error('Position must be a number, it will be set to null.');
          position = null;
        }
        if (!mpInstance._Helpers.Validators.isStringOrNumber(quantity)) {
          quantity = 1;
        } else {
          quantity = mpInstance._Helpers.parseNumber(quantity);
        }
        return {
          Name: name,
          Sku: sku,
          Price: price,
          Quantity: quantity,
          Brand: brand,
          Variant: variant,
          Category: category,
          Position: position,
          CouponCode: couponCode,
          TotalAmount: quantity * price,
          Attributes: attributes
        };
      };
      this.createPromotion = function (id, creative, name, position) {
        if (!mpInstance._Helpers.Validators.isStringOrNumber(id)) {
          mpInstance.Logger.error(Messages$6.ErrorMessages.PromotionIdRequired);
          return null;
        }
        return {
          Id: id,
          Creative: creative,
          Name: name,
          Position: position
        };
      };
      this.createImpression = function (name, product) {
        if (typeof name !== 'string') {
          mpInstance.Logger.error('Name is required when creating an impression.');
          return null;
        }
        if (!product) {
          mpInstance.Logger.error('Product is required when creating an impression.');
          return null;
        }
        return {
          Name: name,
          Product: product
        };
      };
      this.createTransactionAttributes = function (id, affiliation, couponCode, revenue, shipping, tax) {
        if (!mpInstance._Helpers.Validators.isStringOrNumber(id)) {
          mpInstance.Logger.error(Messages$6.ErrorMessages.TransactionIdRequired);
          return null;
        }
        return {
          Id: id,
          Affiliation: affiliation,
          CouponCode: couponCode,
          Revenue: revenue,
          Shipping: shipping,
          Tax: tax
        };
      };
      this.expandProductImpression = function (commerceEvent) {
        var appEvents = [];
        if (!commerceEvent.ProductImpressions) {
          return appEvents;
        }
        commerceEvent.ProductImpressions.forEach(function (productImpression) {
          if (productImpression.ProductList) {
            productImpression.ProductList.forEach(function (product) {
              var attributes = mpInstance._Helpers.extend(false, {}, commerceEvent.EventAttributes);
              if (product.Attributes) {
                for (var attribute in product.Attributes) {
                  attributes[attribute] = product.Attributes[attribute];
                }
              }
              self.extractProductAttributes(attributes, product);
              if (productImpression.ProductImpressionList) {
                attributes['Product Impression List'] = productImpression.ProductImpressionList;
              }
              var appEvent = mpInstance._ServerModel.createEventObject({
                messageType: Types.MessageType.PageEvent,
                name: self.generateExpandedEcommerceName('Impression'),
                data: attributes,
                eventType: Types.EventType.Transaction
              });
              appEvents.push(appEvent);
            });
          }
        });
        return appEvents;
      };
      this.expandCommerceEvent = function (event) {
        if (!event) {
          return null;
        }
        return self.expandProductAction(event).concat(self.expandPromotionAction(event)).concat(self.expandProductImpression(event));
      };
      this.expandPromotionAction = function (commerceEvent) {
        var appEvents = [];
        if (!commerceEvent.PromotionAction) {
          return appEvents;
        }
        var promotions = commerceEvent.PromotionAction.PromotionList;
        promotions.forEach(function (promotion) {
          var attributes = mpInstance._Helpers.extend(false, {}, commerceEvent.EventAttributes);
          self.extractPromotionAttributes(attributes, promotion);
          var appEvent = mpInstance._ServerModel.createEventObject({
            messageType: Types.MessageType.PageEvent,
            name: self.generateExpandedEcommerceName(Types.PromotionActionType.getExpansionName(commerceEvent.PromotionAction.PromotionActionType)),
            data: attributes,
            eventType: Types.EventType.Transaction
          });
          appEvents.push(appEvent);
        });
        return appEvents;
      };
      this.expandProductAction = function (commerceEvent) {
        var appEvents = [];
        if (!commerceEvent.ProductAction) {
          return appEvents;
        }
        var shouldExtractActionAttributes = false;
        if (commerceEvent.ProductAction.ProductActionType === Types.ProductActionType.Purchase || commerceEvent.ProductAction.ProductActionType === Types.ProductActionType.Refund) {
          var attributes = mpInstance._Helpers.extend(false, {}, commerceEvent.EventAttributes);
          attributes['Product Count'] = commerceEvent.ProductAction.ProductList ? commerceEvent.ProductAction.ProductList.length : 0;
          self.extractActionAttributes(attributes, commerceEvent.ProductAction);
          if (commerceEvent.CurrencyCode) {
            attributes['Currency Code'] = commerceEvent.CurrencyCode;
          }
          var plusOneEvent = mpInstance._ServerModel.createEventObject({
            messageType: Types.MessageType.PageEvent,
            name: self.generateExpandedEcommerceName(Types.ProductActionType.getExpansionName(commerceEvent.ProductAction.ProductActionType), true),
            data: attributes,
            eventType: Types.EventType.Transaction
          });
          appEvents.push(plusOneEvent);
        } else {
          shouldExtractActionAttributes = true;
        }
        var products = commerceEvent.ProductAction.ProductList;
        if (!products) {
          return appEvents;
        }
        products.forEach(function (product) {
          var attributes = mpInstance._Helpers.extend(false, commerceEvent.EventAttributes, product.Attributes);
          if (shouldExtractActionAttributes) {
            self.extractActionAttributes(attributes, commerceEvent.ProductAction);
          } else {
            self.extractTransactionId(attributes, commerceEvent.ProductAction);
          }
          self.extractProductAttributes(attributes, product);
          var productEvent = mpInstance._ServerModel.createEventObject({
            messageType: Types.MessageType.PageEvent,
            name: self.generateExpandedEcommerceName(Types.ProductActionType.getExpansionName(commerceEvent.ProductAction.ProductActionType)),
            data: attributes,
            eventType: Types.EventType.Transaction
          });
          appEvents.push(productEvent);
        });
        return appEvents;
      };
      this.createCommerceEventObject = function (customFlags, options) {
        var baseEvent;
        // https://go.mparticle.com/work/SQDSDKS-4801
        var extend = mpInstance._Helpers.extend;
        mpInstance.Logger.verbose(Messages$6.InformationMessages.StartingLogCommerceEvent);
        if (mpInstance._Helpers.canLog()) {
          baseEvent = mpInstance._ServerModel.createEventObject({
            messageType: Types.MessageType.Commerce,
            sourceMessageId: options === null || options === void 0 ? void 0 : options.sourceMessageId
          });
          baseEvent.EventName = 'eCommerce - ';
          baseEvent.CurrencyCode = mpInstance._Store.currencyCode;
          baseEvent.ShoppingCart = [];
          baseEvent.CustomFlags = extend(baseEvent.CustomFlags, customFlags);
          return baseEvent;
        } else {
          mpInstance.Logger.verbose(Messages$6.InformationMessages.AbandonLogEvent);
        }
        return null;
      };

      // sanitizes any non number, non string value to 0
      this.sanitizeAmount = function (amount, category) {
        if (!mpInstance._Helpers.Validators.isStringOrNumber(amount)) {
          var message = [category, 'must be of type number. A', _typeof$1(amount), 'was passed. Converting to 0'].join(' ');
          mpInstance.Logger.warning(message);
          return 0;
        }

        // if amount is a string, it will be parsed into a number if possible, or set to 0
        return mpInstance._Helpers.parseNumber(amount);
      };
    }

    function createSDKConfig(config) {
      // TODO: Refactor to create a default config object
      var sdkConfig = {};
      for (var prop in Constants.DefaultConfig) {
        if (Constants.DefaultConfig.hasOwnProperty(prop)) {
          sdkConfig[prop] = Constants.DefaultConfig[prop];
        }
      }
      if (config) {
        for (var prop in config) {
          if (config.hasOwnProperty(prop)) {
            sdkConfig[prop] = config[prop];
          }
        }
      }
      for (var prop in Constants.DefaultBaseUrls) {
        sdkConfig[prop] = Constants.DefaultBaseUrls[prop];
      }
      return sdkConfig;
    }
    // TODO: Merge this with SDKStoreApi in sdkRuntimeModels
    function Store(config, mpInstance, apiKey) {
      var _this = this;
      var _a = mpInstance._Helpers,
        createMainStorageName = _a.createMainStorageName,
        createProductStorageName = _a.createProductStorageName;
      var isWebviewEnabled = mpInstance._NativeSdkHelpers.isWebviewEnabled;
      var defaultStore = {
        isEnabled: true,
        sessionAttributes: {},
        currentSessionMPIDs: [],
        consentState: null,
        sessionId: null,
        isFirstRun: null,
        clientId: null,
        deviceId: null,
        devToken: null,
        serverSettings: {},
        dateLastEventSent: null,
        sessionStartDate: null,
        currentPosition: null,
        isTracking: false,
        watchPositionId: null,
        cartProducts: [],
        eventQueue: [],
        currencyCode: null,
        globalTimer: null,
        context: null,
        configurationLoaded: false,
        identityCallInFlight: false,
        SDKConfig: {},
        nonCurrentUserMPIDs: {},
        identifyCalled: false,
        isLoggedIn: false,
        cookieSyncDates: {},
        integrationAttributes: {},
        requireDelay: true,
        isLocalStorageAvailable: null,
        storageName: null,
        prodStorageName: null,
        activeForwarders: [],
        kits: {},
        sideloadedKits: [],
        configuredForwarders: [],
        pixelConfigurations: [],
        wrapperSDKInfo: {
          name: 'none',
          version: null,
          isInfoSet: false
        },
        // Placeholder for in-memory persistence model
        persistenceData: {
          gs: {}
        }
      };
      for (var key in defaultStore) {
        this[key] = defaultStore[key];
      }
      this.devToken = apiKey || null;
      this.integrationDelayTimeoutStart = Date.now();
      // Set configuration to default settings
      this.SDKConfig = createSDKConfig(config);
      if (config) {
        if (!config.hasOwnProperty('flags')) {
          this.SDKConfig.flags = {};
        }
        // We process the initial config that is passed via the SDK init
        // and then we will reprocess the config within the processConfig
        // function when the config is updated from the server
        // https://go.mparticle.com/work/SQDSDKS-6317
        this.SDKConfig.flags = processFlags(config);
        if (config.deviceId) {
          this.deviceId = config.deviceId;
        }
        if (config.hasOwnProperty('isDevelopmentMode')) {
          this.SDKConfig.isDevelopmentMode = returnConvertedBoolean(config.isDevelopmentMode);
        } else {
          this.SDKConfig.isDevelopmentMode = false;
        }
        var baseUrls = processBaseUrls(config, this.SDKConfig.flags, apiKey);
        for (var baseUrlKeys in baseUrls) {
          this.SDKConfig[baseUrlKeys] = baseUrls[baseUrlKeys];
        }
        if (config.hasOwnProperty('logLevel')) {
          this.SDKConfig.logLevel = config.logLevel;
        }
        this.SDKConfig.useNativeSdk = !!config.useNativeSdk;
        this.SDKConfig.kits = config.kits || {};
        this.SDKConfig.sideloadedKits = config.sideloadedKits || [];
        if (config.hasOwnProperty('isIOS')) {
          this.SDKConfig.isIOS = config.isIOS;
        } else {
          this.SDKConfig.isIOS = window.mParticle && window.mParticle.isIOS ? window.mParticle.isIOS : false;
        }
        if (config.hasOwnProperty('useCookieStorage')) {
          this.SDKConfig.useCookieStorage = config.useCookieStorage;
        } else {
          this.SDKConfig.useCookieStorage = false;
        }
        if (config.hasOwnProperty('maxProducts')) {
          this.SDKConfig.maxProducts = config.maxProducts;
        } else {
          this.SDKConfig.maxProducts = Constants.DefaultConfig.maxProducts;
        }
        if (config.hasOwnProperty('maxCookieSize')) {
          this.SDKConfig.maxCookieSize = config.maxCookieSize;
        } else {
          this.SDKConfig.maxCookieSize = Constants.DefaultConfig.maxCookieSize;
        }
        if (config.hasOwnProperty('appName')) {
          this.SDKConfig.appName = config.appName;
        }
        if (config.hasOwnProperty('package')) {
          this.SDKConfig["package"] = config["package"];
        }
        if (config.hasOwnProperty('integrationDelayTimeout')) {
          this.SDKConfig.integrationDelayTimeout = config.integrationDelayTimeout;
        } else {
          this.SDKConfig.integrationDelayTimeout = Constants.DefaultConfig.integrationDelayTimeout;
        }
        if (config.hasOwnProperty('identifyRequest')) {
          this.SDKConfig.identifyRequest = config.identifyRequest;
        }
        if (config.hasOwnProperty('identityCallback')) {
          var callback = config.identityCallback;
          if (mpInstance._Helpers.Validators.isFunction(callback)) {
            this.SDKConfig.identityCallback = config.identityCallback;
          } else {
            mpInstance.Logger.warning('The optional callback must be a function. You tried entering a(n) ' + _typeof$1(callback) + ' . Callback not set. Please set your callback again.');
          }
        }
        if (config.hasOwnProperty('appVersion')) {
          this.SDKConfig.appVersion = config.appVersion;
        }
        if (config.hasOwnProperty('appName')) {
          this.SDKConfig.appName = config.appName;
        }
        if (config.hasOwnProperty('sessionTimeout')) {
          this.SDKConfig.sessionTimeout = config.sessionTimeout;
        }
        if (config.hasOwnProperty('dataPlan')) {
          this.SDKConfig.dataPlan = {
            PlanVersion: null,
            PlanId: null
          };
          var dataPlan = config.dataPlan;
          if (dataPlan.planId) {
            if (isDataPlanSlug(dataPlan.planId)) {
              this.SDKConfig.dataPlan.PlanId = dataPlan.planId;
            } else {
              mpInstance.Logger.error('Your data plan id must be a string and match the data plan slug format (i.e. under_case_slug)');
            }
          }
          if (dataPlan.planVersion) {
            if (isNumber(dataPlan.planVersion)) {
              this.SDKConfig.dataPlan.PlanVersion = dataPlan.planVersion;
            } else {
              mpInstance.Logger.error('Your data plan version must be a number');
            }
          }
        } else {
          this.SDKConfig.dataPlan = {};
        }
        if (config.hasOwnProperty('forceHttps')) {
          this.SDKConfig.forceHttps = config.forceHttps;
        } else {
          this.SDKConfig.forceHttps = true;
        }
        // Some forwarders require custom flags on initialization, so allow them to be set using config object
        this.SDKConfig.customFlags = config.customFlags || {};
        if (config.hasOwnProperty('minWebviewBridgeVersion')) {
          this.SDKConfig.minWebviewBridgeVersion = config.minWebviewBridgeVersion;
        } else {
          this.SDKConfig.minWebviewBridgeVersion = 1;
        }
        if (config.hasOwnProperty('aliasMaxWindow')) {
          this.SDKConfig.aliasMaxWindow = config.aliasMaxWindow;
        } else {
          this.SDKConfig.aliasMaxWindow = Constants.DefaultConfig.aliasMaxWindow;
        }
        if (config.hasOwnProperty('dataPlanOptions')) {
          var dataPlanOptions = config.dataPlanOptions;
          if (!dataPlanOptions.hasOwnProperty('dataPlanVersion') || !dataPlanOptions.hasOwnProperty('blockUserAttributes') || !dataPlanOptions.hasOwnProperty('blockEventAttributes') || !dataPlanOptions.hasOwnProperty('blockEvents') || !dataPlanOptions.hasOwnProperty('blockUserIdentities')) {
            mpInstance.Logger.error('Ensure your config.dataPlanOptions object has the following keys: a "dataPlanVersion" object, and "blockUserAttributes", "blockEventAttributes", "blockEvents", "blockUserIdentities" booleans');
          }
        }
        if (config.hasOwnProperty('onCreateBatch')) {
          if (typeof config.onCreateBatch === 'function') {
            this.SDKConfig.onCreateBatch = config.onCreateBatch;
          } else {
            mpInstance.Logger.error('config.onCreateBatch must be a function');
            // set to undefined because all items are set on createSDKConfig
            this.SDKConfig.onCreateBatch = undefined;
          }
        }
      }
      this._getFromPersistence = function (mpid, key) {
        if (!mpid) {
          return null;
        }
        _this.syncPersistenceData();
        if (_this.persistenceData && _this.persistenceData[mpid] && _this.persistenceData[mpid][key]) {
          return _this.persistenceData[mpid][key];
        } else {
          return null;
        }
      };
      this._setPersistence = function (mpid, key, value) {
        var _a;
        if (!mpid) {
          return;
        }
        _this.syncPersistenceData();
        if (_this.persistenceData) {
          if (_this.persistenceData[mpid]) {
            _this.persistenceData[mpid][key] = value;
          } else {
            _this.persistenceData[mpid] = (_a = {}, _a[key] = value, _a);
          }
          // Clear out persistence attributes that are empty
          // so that we don't upload empty or undefined values
          if (isObject(_this.persistenceData[mpid][key]) && isEmpty(_this.persistenceData[mpid][key])) {
            delete _this.persistenceData[mpid][key];
          }
          mpInstance._Persistence.savePersistence(_this.persistenceData);
        }
      };
      this.hasInvalidIdentifyRequest = function () {
        var identifyRequest = _this.SDKConfig.identifyRequest;
        return isObject(identifyRequest) && isObject(identifyRequest.userIdentities) && isEmpty(identifyRequest.userIdentities) || !identifyRequest;
      };
      this.getConsentState = function (mpid) {
        var fromMinifiedJsonObject = mpInstance._Consent.ConsentSerialization.fromMinifiedJsonObject;
        var serializedConsentState = _this._getFromPersistence(mpid, 'con');
        if (!isEmpty(serializedConsentState)) {
          return fromMinifiedJsonObject(serializedConsentState);
        }
        return null;
      };
      this.setConsentState = function (mpid, consentState) {
        var toMinifiedJsonObject = mpInstance._Consent.ConsentSerialization.toMinifiedJsonObject;
        // If ConsentState is null, we assume the intent is to clear out the consent state
        if (consentState || consentState === null) {
          _this._setPersistence(mpid, 'con', toMinifiedJsonObject(consentState));
        }
      };
      this.getDeviceId = function () {
        return _this.deviceId;
      };
      this.setDeviceId = function (deviceId) {
        _this.deviceId = deviceId;
        _this.persistenceData.gs.das = deviceId;
        mpInstance._Persistence.update();
      };
      this.getFirstSeenTime = function (mpid) {
        return _this._getFromPersistence(mpid, 'fst');
      };
      this.setFirstSeenTime = function (mpid, _time) {
        if (!mpid) {
          return;
        }
        var time = _time || new Date().getTime();
        _this._setPersistence(mpid, 'fst', time);
      };
      this.getLastSeenTime = function (mpid) {
        if (!mpid) {
          return null;
        }
        // https://go.mparticle.com/work/SQDSDKS-6315
        var currentUser = mpInstance.Identity.getCurrentUser();
        if (mpid === (currentUser === null || currentUser === void 0 ? void 0 : currentUser.getMPID())) {
          // if the mpid is the current user, its last seen time is the current time
          return new Date().getTime();
        }
        return _this._getFromPersistence(mpid, 'lst');
      };
      this.setLastSeenTime = function (mpid, _time) {
        if (!mpid) {
          return;
        }
        var time = _time || new Date().getTime();
        _this._setPersistence(mpid, 'lst', time);
      };
      this.syncPersistenceData = function () {
        var persistenceData = mpInstance._Persistence.getPersistence();
        _this.persistenceData = mpInstance._Helpers.extend({}, _this.persistenceData, persistenceData);
      };
      this.getUserAttributes = function (mpid) {
        return _this._getFromPersistence(mpid, 'ua') || {};
      };
      this.setUserAttributes = function (mpid, userAttributes) {
        return _this._setPersistence(mpid, 'ua', userAttributes);
      };
      this.getUserIdentities = function (mpid) {
        return _this._getFromPersistence(mpid, 'ui') || {};
      };
      this.setUserIdentities = function (mpid, userIdentities) {
        _this._setPersistence(mpid, 'ui', userIdentities);
      };
      this.addMpidToSessionHistory = function (mpid, previousMPID) {
        var indexOfMPID = _this.currentSessionMPIDs.indexOf(mpid);
        if (mpid && previousMPID !== mpid && indexOfMPID < 0) {
          _this.currentSessionMPIDs.push(mpid);
          return;
        }
        if (indexOfMPID >= 0) {
          _this.currentSessionMPIDs = moveElementToEnd(_this.currentSessionMPIDs, indexOfMPID);
        }
      };
      this.nullifySession = function () {
        _this.sessionId = null;
        _this.dateLastEventSent = null;
        _this.sessionAttributes = {};
        mpInstance._Persistence.update();
      };
      this.processConfig = function (config) {
        var workspaceToken = config.workspaceToken,
          requiredWebviewBridgeName = config.requiredWebviewBridgeName;
        // We should reprocess the flags and baseUrls in case they have changed when we request an updated config
        // such as if the SDK is being self-hosted and the flags are different on the server config
        // https://go.mparticle.com/work/SQDSDKS-6317
        _this.SDKConfig.flags = processFlags(config);
        var baseUrls = processBaseUrls(config, _this.SDKConfig.flags, apiKey);
        for (var baseUrlKeys in baseUrls) {
          _this.SDKConfig[baseUrlKeys] = baseUrls[baseUrlKeys];
        }
        if (workspaceToken) {
          _this.SDKConfig.workspaceToken = workspaceToken;
        } else {
          mpInstance.Logger.warning('You should have a workspaceToken on your config object for security purposes.');
        }
        // add a new function to apply items to the store that require config to be returned
        _this.storageName = createMainStorageName(workspaceToken);
        _this.prodStorageName = createProductStorageName(workspaceToken);
        _this.SDKConfig.requiredWebviewBridgeName = requiredWebviewBridgeName || workspaceToken;
        _this.webviewBridgeEnabled = isWebviewEnabled(_this.SDKConfig.requiredWebviewBridgeName, _this.SDKConfig.minWebviewBridgeVersion);
        _this.configurationLoaded = true;
      };
    }
    // https://go.mparticle.com/work/SQDSDKS-6317
    function processFlags(config) {
      var flags = {};
      var _a = Constants.FeatureFlags,
        ReportBatching = _a.ReportBatching,
        EventBatchingIntervalMillis = _a.EventBatchingIntervalMillis,
        OfflineStorage = _a.OfflineStorage,
        DirectUrlRouting = _a.DirectUrlRouting,
        CacheIdentity = _a.CacheIdentity,
        AudienceAPI = _a.AudienceAPI,
        CaptureIntegrationSpecificIds = _a.CaptureIntegrationSpecificIds;
      if (!config.flags) {
        return {};
      }
      // https://go.mparticle.com/work/SQDSDKS-6317
      // Passed in config flags take priority over defaults
      flags[ReportBatching] = config.flags[ReportBatching] || false;
      // The server returns stringified numbers, sowe need to parse
      flags[EventBatchingIntervalMillis] = parseNumber(config.flags[EventBatchingIntervalMillis]) || Constants.DefaultConfig.uploadInterval;
      flags[OfflineStorage] = config.flags[OfflineStorage] || '0';
      flags[DirectUrlRouting] = config.flags[DirectUrlRouting] === 'True';
      flags[CacheIdentity] = config.flags[CacheIdentity] === 'True';
      flags[AudienceAPI] = config.flags[AudienceAPI] === 'True';
      flags[CaptureIntegrationSpecificIds] = config.flags[CaptureIntegrationSpecificIds] === 'True';
      return flags;
    }
    function processBaseUrls(config, flags, apiKey) {
      // an API key is not present in a webview only mode. In this case, no baseUrls are needed
      if (!apiKey) {
        return {};
      }
      // When direct URL routing is false, update baseUrls based custom urls
      // passed to the config
      if (flags.directURLRouting) {
        return processDirectBaseUrls(config, apiKey);
      } else {
        return processCustomBaseUrls(config);
      }
    }
    function processCustomBaseUrls(config) {
      var defaultBaseUrls = Constants.DefaultBaseUrls;
      var newBaseUrls = {};
      // If there is no custo base url, we use the default base url
      for (var baseUrlKey in defaultBaseUrls) {
        newBaseUrls[baseUrlKey] = config[baseUrlKey] || defaultBaseUrls[baseUrlKey];
      }
      return newBaseUrls;
    }
    function processDirectBaseUrls(config, apiKey) {
      var defaultBaseUrls = Constants.DefaultBaseUrls;
      var directBaseUrls = {};
      // When Direct URL Routing is true, we create a new set of baseUrls that
      // include the silo in the urls.  mParticle API keys are prefixed with the
      // silo and a hyphen (ex. "us1-", "us2-", "eu1-").  us1 was the first silo,
      // and before other silos existed, there were no prefixes and all apiKeys
      // were us1. As such, if we split on a '-' and the resulting array length
      // is 1, then it is an older APIkey that should route to us1.
      // When splitKey.length is greater than 1, then splitKey[0] will be
      // us1, us2, eu1, au1, or st1, etc as new silos are added
      var DEFAULT_SILO = 'us1';
      var splitKey = apiKey.split('-');
      var routingPrefix = splitKey.length <= 1 ? DEFAULT_SILO : splitKey[0];
      for (var baseUrlKey in defaultBaseUrls) {
        // Any custom endpoints passed to mpConfig will take priority over direct
        // mapping to the silo.  The most common use case is a customer provided CNAME.
        if (baseUrlKey === 'configUrl') {
          directBaseUrls[baseUrlKey] = config[baseUrlKey] || defaultBaseUrls[baseUrlKey];
          continue;
        }
        if (config.hasOwnProperty(baseUrlKey)) {
          directBaseUrls[baseUrlKey] = config[baseUrlKey];
        } else {
          var urlparts = defaultBaseUrls[baseUrlKey].split('.');
          directBaseUrls[baseUrlKey] = __spreadArray([urlparts[0], routingPrefix], urlparts.slice(1), true).join('.');
        }
      }
      return directBaseUrls;
    }

    function Logger(config) {
      var self = this;
      var logLevel = config.logLevel || 'warning';
      if (config.hasOwnProperty('logger')) {
        this.logger = config.logger;
      } else {
        this.logger = new ConsoleLogger();
      }
      this.verbose = function (msg) {
        if (logLevel !== 'none') {
          if (self.logger.verbose && logLevel === 'verbose') {
            self.logger.verbose(msg);
          }
        }
      };
      this.warning = function (msg) {
        if (logLevel !== 'none') {
          if (self.logger.warning && (logLevel === 'verbose' || logLevel === 'warning')) {
            self.logger.warning(msg);
          }
        }
      };
      this.error = function (msg) {
        if (logLevel !== 'none') {
          if (self.logger.error) {
            self.logger.error(msg);
          }
        }
      };
      this.setLogLevel = function (newLogLevel) {
        logLevel = newLogLevel;
      };
    }
    function ConsoleLogger() {
      this.verbose = function (msg) {
        if (console && console.info) {
          console.info(msg);
        }
      };
      this.error = function (msg) {
        if (console && console.error) {
          console.error(msg);
        }
      };
      this.warning = function (msg) {
        if (console && console.warn) {
          console.warn(msg);
        }
      };
    }

    var Base64 = Polyfill.Base64,
      Messages$5 = Constants.Messages,
      Base64CookieKeys = Constants.Base64CookieKeys,
      SDKv2NonMPIDCookieKeys = Constants.SDKv2NonMPIDCookieKeys,
      StorageNames = Constants.StorageNames;
    function _Persistence(mpInstance) {
      var self = this;

      // https://go.mparticle.com/work/SQDSDKS-5022
      this.useLocalStorage = function () {
        return !mpInstance._Store.SDKConfig.useCookieStorage && mpInstance._Store.isLocalStorageAvailable;
      };
      this.initializeStorage = function () {
        try {
          var storage,
            localStorageData = self.getLocalStorage(),
            cookies = self.getCookie(),
            allData;

          // https://go.mparticle.com/work/SQDSDKS-6045
          // Determine if there is any data in cookies or localStorage to figure out if it is the first time the browser is loading mParticle
          if (!localStorageData && !cookies) {
            mpInstance._Store.isFirstRun = true;
            mpInstance._Store.mpid = 0;
          } else {
            mpInstance._Store.isFirstRun = false;
          }

          // https://go.mparticle.com/work/SQDSDKS-6045
          if (!mpInstance._Store.isLocalStorageAvailable) {
            mpInstance._Store.SDKConfig.useCookieStorage = true;
          }

          // https://go.mparticle.com/work/SQDSDKS-6046
          if (mpInstance._Store.isLocalStorageAvailable) {
            storage = window.localStorage;
            if (mpInstance._Store.SDKConfig.useCookieStorage) {
              // For migrating from localStorage to cookies -- If an instance switches from localStorage to cookies, then
              // no mParticle cookie exists yet and there is localStorage. Get the localStorage, set them to cookies, then delete the localStorage item.
              if (localStorageData) {
                if (cookies) {
                  // https://go.mparticle.com/work/SQDSDKS-6047
                  allData = mpInstance._Helpers.extend(false, localStorageData, cookies);
                } else {
                  allData = localStorageData;
                }
                storage.removeItem(mpInstance._Store.storageName);
              } else if (cookies) {
                allData = cookies;
              }
              self.storeDataInMemory(allData);
            } else {
              // For migrating from cookie to localStorage -- If an instance is newly switching from cookies to localStorage, then
              // no mParticle localStorage exists yet and there are cookies. Get the cookies, set them to localStorage, then delete the cookies.
              if (cookies) {
                if (localStorageData) {
                  // https://go.mparticle.com/work/SQDSDKS-6047
                  allData = mpInstance._Helpers.extend(false, localStorageData, cookies);
                } else {
                  allData = cookies;
                }
                self.storeDataInMemory(allData);
                self.expireCookies(mpInstance._Store.storageName);
              } else {
                self.storeDataInMemory(localStorageData);
              }
            }
          } else {
            self.storeDataInMemory(cookies);
          }

          // https://go.mparticle.com/work/SQDSDKS-6048
          try {
            if (mpInstance._Store.isLocalStorageAvailable) {
              var encodedProducts = localStorage.getItem(mpInstance._Store.prodStorageName);
              if (encodedProducts) {
                var decodedProducts = JSON.parse(Base64.decode(encodedProducts));
              }
              if (mpInstance._Store.mpid) {
                self.storeProductsInMemory(decodedProducts, mpInstance._Store.mpid);
              }
            }
          } catch (e) {
            if (mpInstance._Store.isLocalStorageAvailable) {
              localStorage.removeItem(mpInstance._Store.prodStorageName);
            }
            mpInstance._Store.cartProducts = [];
            mpInstance.Logger.error('Error loading products in initialization: ' + e);
          }

          // https://go.mparticle.com/work/SQDSDKS-6046
          // Stores all non-current user MPID information into the store
          for (var key in allData) {
            if (allData.hasOwnProperty(key)) {
              if (!SDKv2NonMPIDCookieKeys[key]) {
                mpInstance._Store.nonCurrentUserMPIDs[key] = allData[key];
              }
            }
          }
          self.update();
        } catch (e) {
          // If cookies or local storage is corrupt, we want to remove it
          // so that in the future, initializeStorage will work
          if (self.useLocalStorage() && mpInstance._Store.isLocalStorageAvailable) {
            localStorage.removeItem(mpInstance._Store.storageName);
          } else {
            self.expireCookies(mpInstance._Store.storageName);
          }
          mpInstance.Logger.error('Error initializing storage: ' + e);
        }
      };
      this.update = function () {
        if (!mpInstance._Store.webviewBridgeEnabled) {
          if (mpInstance._Store.SDKConfig.useCookieStorage) {
            self.setCookie();
          }
          self.setLocalStorage();
        }
      };
      this.storeProductsInMemory = function (products, mpid) {
        if (products) {
          try {
            mpInstance._Store.cartProducts = products[mpid] && products[mpid].cp ? products[mpid].cp : [];
          } catch (e) {
            mpInstance.Logger.error(Messages$5.ErrorMessages.CookieParseError);
          }
        }
      };

      // https://go.mparticle.com/work/SQDSDKS-6045
      this.storeDataInMemory = function (obj, currentMPID) {
        try {
          if (!obj) {
            mpInstance.Logger.verbose(Messages$5.InformationMessages.CookieNotFound);
            mpInstance._Store.clientId = mpInstance._Store.clientId || mpInstance._Helpers.generateUniqueId();
            mpInstance._Store.deviceId = mpInstance._Store.deviceId || mpInstance._Helpers.generateUniqueId();
          } else {
            // Set MPID first, then change object to match MPID data
            if (currentMPID) {
              mpInstance._Store.mpid = currentMPID;
            } else {
              mpInstance._Store.mpid = obj.cu || 0;
            }
            obj.gs = obj.gs || {};
            mpInstance._Store.sessionId = obj.gs.sid || mpInstance._Store.sessionId;
            mpInstance._Store.isEnabled = typeof obj.gs.ie !== 'undefined' ? obj.gs.ie : mpInstance._Store.isEnabled;
            mpInstance._Store.sessionAttributes = obj.gs.sa || mpInstance._Store.sessionAttributes;
            mpInstance._Store.serverSettings = obj.gs.ss || mpInstance._Store.serverSettings;
            mpInstance._Store.devToken = mpInstance._Store.devToken || obj.gs.dt;
            mpInstance._Store.SDKConfig.appVersion = mpInstance._Store.SDKConfig.appVersion || obj.gs.av;
            mpInstance._Store.clientId = obj.gs.cgid || mpInstance._Store.clientId || mpInstance._Helpers.generateUniqueId();

            // For most persistence values, we prioritize localstorage/cookie values over
            // Store. However, we allow device ID to be overriden via a config value and
            // thus the priority of the deviceId value is
            // 1. value passed via config.deviceId
            // 2. previous value in persistence
            // 3. generate new guid
            mpInstance._Store.deviceId = mpInstance._Store.deviceId || obj.gs.das || mpInstance._Helpers.generateUniqueId();
            mpInstance._Store.integrationAttributes = obj.gs.ia || {};
            mpInstance._Store.context = obj.gs.c || mpInstance._Store.context;
            mpInstance._Store.currentSessionMPIDs = obj.gs.csm || mpInstance._Store.currentSessionMPIDs;
            mpInstance._Store.isLoggedIn = obj.l === true;
            if (obj.gs.les) {
              mpInstance._Store.dateLastEventSent = new Date(obj.gs.les);
            }
            if (obj.gs.ssd) {
              mpInstance._Store.sessionStartDate = new Date(obj.gs.ssd);
            } else {
              mpInstance._Store.sessionStartDate = new Date();
            }
            if (currentMPID) {
              obj = obj[currentMPID];
            } else {
              obj = obj[obj.cu];
            }
          }
        } catch (e) {
          mpInstance.Logger.error(Messages$5.ErrorMessages.CookieParseError);
        }
      };

      // https://go.mparticle.com/work/SQDSDKS-5022
      this.determineLocalStorageAvailability = function (storage) {
        var result;
        if (window.mParticle && window.mParticle._forceNoLocalStorage) {
          storage = undefined;
        }
        try {
          storage.setItem('mparticle', 'test');
          result = storage.getItem('mparticle') === 'test';
          storage.removeItem('mparticle');
          return result && storage;
        } catch (e) {
          return false;
        }
      };
      this.getUserProductsFromLS = function (mpid) {
        if (!mpInstance._Store.isLocalStorageAvailable) {
          return [];
        }
        var decodedProducts,
          userProducts,
          parsedProducts,
          encodedProducts = localStorage.getItem(mpInstance._Store.prodStorageName);
        if (encodedProducts) {
          decodedProducts = Base64.decode(encodedProducts);
        }
        // if there is an MPID, we are retrieving the user's products, which is an array
        if (mpid) {
          try {
            if (decodedProducts) {
              parsedProducts = JSON.parse(decodedProducts);
            }
            if (decodedProducts && parsedProducts[mpid] && parsedProducts[mpid].cp && Array.isArray(parsedProducts[mpid].cp)) {
              userProducts = parsedProducts[mpid].cp;
            } else {
              userProducts = [];
            }
            return userProducts;
          } catch (e) {
            return [];
          }
        } else {
          return [];
        }
      };
      this.getAllUserProductsFromLS = function () {
        var decodedProducts,
          encodedProducts = localStorage.getItem(mpInstance._Store.prodStorageName),
          parsedDecodedProducts;
        if (encodedProducts) {
          decodedProducts = Base64.decode(encodedProducts);
        }
        // returns an object with keys of MPID and values of array of products
        try {
          parsedDecodedProducts = JSON.parse(decodedProducts);
        } catch (e) {
          parsedDecodedProducts = {};
        }
        return parsedDecodedProducts;
      };

      // https://go.mparticle.com/work/SQDSDKS-6021
      this.setLocalStorage = function () {
        if (!mpInstance._Store.isLocalStorageAvailable) {
          return;
        }
        var key = mpInstance._Store.storageName,
          allLocalStorageProducts = self.getAllUserProductsFromLS(),
          localStorageData = self.getLocalStorage() || {},
          currentUser = mpInstance.Identity.getCurrentUser(),
          mpid = currentUser ? currentUser.getMPID() : null,
          currentUserProducts = {
            cp: allLocalStorageProducts[mpid] ? allLocalStorageProducts[mpid].cp : []
          };
        if (mpid) {
          allLocalStorageProducts = allLocalStorageProducts || {};
          allLocalStorageProducts[mpid] = currentUserProducts;
          try {
            window.localStorage.setItem(encodeURIComponent(mpInstance._Store.prodStorageName), Base64.encode(JSON.stringify(allLocalStorageProducts)));
          } catch (e) {
            mpInstance.Logger.error('Error with setting products on localStorage.');
          }
        }
        if (!mpInstance._Store.SDKConfig.useCookieStorage) {
          localStorageData.gs = localStorageData.gs || {};
          localStorageData.l = mpInstance._Store.isLoggedIn ? 1 : 0;
          if (mpInstance._Store.sessionId) {
            localStorageData.gs.csm = mpInstance._Store.currentSessionMPIDs;
          }
          localStorageData.gs.ie = mpInstance._Store.isEnabled;
          if (mpid) {
            localStorageData.cu = mpid;
          }
          if (Object.keys(mpInstance._Store.nonCurrentUserMPIDs).length) {
            localStorageData = mpInstance._Helpers.extend({}, localStorageData, mpInstance._Store.nonCurrentUserMPIDs);
            mpInstance._Store.nonCurrentUserMPIDs = {};
          }
          localStorageData = setGlobalStorageAttributes(localStorageData);
          try {
            window.localStorage.setItem(encodeURIComponent(key), self.encodePersistence(JSON.stringify(localStorageData)));
          } catch (e) {
            mpInstance.Logger.error('Error with setting localStorage item.');
          }
        }
      };
      function setGlobalStorageAttributes(data) {
        var store = mpInstance._Store;
        data.gs.sid = store.sessionId;
        data.gs.ie = store.isEnabled;
        data.gs.sa = store.sessionAttributes;
        data.gs.ss = store.serverSettings;
        data.gs.dt = store.devToken;
        data.gs.les = store.dateLastEventSent ? store.dateLastEventSent.getTime() : null;
        data.gs.av = store.SDKConfig.appVersion;
        data.gs.cgid = store.clientId;
        data.gs.das = store.deviceId;
        data.gs.c = store.context;
        data.gs.ssd = store.sessionStartDate ? store.sessionStartDate.getTime() : 0;
        data.gs.ia = store.integrationAttributes;
        return data;
      }
      this.getLocalStorage = function () {
        if (!mpInstance._Store.isLocalStorageAvailable) {
          return null;
        }
        var key = mpInstance._Store.storageName,
          localStorageData = self.decodePersistence(window.localStorage.getItem(key)),
          obj = {},
          j;
        if (localStorageData) {
          localStorageData = JSON.parse(localStorageData);
          for (j in localStorageData) {
            if (localStorageData.hasOwnProperty(j)) {
              obj[j] = localStorageData[j];
            }
          }
        }
        if (Object.keys(obj).length) {
          return obj;
        }
        return null;
      };
      function removeLocalStorage(localStorageName) {
        localStorage.removeItem(localStorageName);
      }
      this.expireCookies = function (cookieName) {
        var date = new Date(),
          expires,
          domain,
          cookieDomain;
        cookieDomain = self.getCookieDomain();
        if (cookieDomain === '') {
          domain = '';
        } else {
          domain = ';domain=' + cookieDomain;
        }
        date.setTime(date.getTime() - 24 * 60 * 60 * 1000);
        expires = '; expires=' + date.toUTCString();
        document.cookie = cookieName + '=' + '' + expires + '; path=/' + domain;
      };
      this.getCookie = function () {
        var cookies = window.document.cookie.split('; '),
          key = mpInstance._Store.storageName,
          i,
          l,
          parts,
          name,
          cookie,
          result = key ? undefined : {};
        mpInstance.Logger.verbose(Messages$5.InformationMessages.CookieSearch);
        for (i = 0, l = cookies.length; i < l; i++) {
          try {
            parts = cookies[i].split('=');
            name = parts.shift();
            cookie = parts.join('=');
          } catch (e) {
            mpInstance.Logger.verbose('Unable to parse cookie: ' + name + '. Skipping.');
          }
          if (key && key === name) {
            result = mpInstance._Helpers.converted(cookie);
            break;
          }
          if (!key) {
            result[name] = mpInstance._Helpers.converted(cookie);
          }
        }
        if (result) {
          mpInstance.Logger.verbose(Messages$5.InformationMessages.CookieFound);
          return JSON.parse(self.decodePersistence(result));
        } else {
          return null;
        }
      };

      // https://go.mparticle.com/work/SQDSDKS-5022
      // https://go.mparticle.com/work/SQDSDKS-6021
      this.setCookie = function () {
        var mpid,
          currentUser = mpInstance.Identity.getCurrentUser();
        if (currentUser) {
          mpid = currentUser.getMPID();
        }
        var date = new Date(),
          key = mpInstance._Store.storageName,
          cookies = self.getCookie() || {},
          expires = new Date(date.getTime() + mpInstance._Store.SDKConfig.cookieExpiration * 24 * 60 * 60 * 1000).toGMTString(),
          cookieDomain,
          domain,
          encodedCookiesWithExpirationAndPath;
        cookieDomain = self.getCookieDomain();
        if (cookieDomain === '') {
          domain = '';
        } else {
          domain = ';domain=' + cookieDomain;
        }
        cookies.gs = cookies.gs || {};
        if (mpInstance._Store.sessionId) {
          cookies.gs.csm = mpInstance._Store.currentSessionMPIDs;
        }
        if (mpid) {
          cookies.cu = mpid;
        }
        cookies.l = mpInstance._Store.isLoggedIn ? 1 : 0;
        cookies = setGlobalStorageAttributes(cookies);
        if (Object.keys(mpInstance._Store.nonCurrentUserMPIDs).length) {
          cookies = mpInstance._Helpers.extend({}, cookies, mpInstance._Store.nonCurrentUserMPIDs);
          mpInstance._Store.nonCurrentUserMPIDs = {};
        }
        encodedCookiesWithExpirationAndPath = self.reduceAndEncodePersistence(cookies, expires, domain, mpInstance._Store.SDKConfig.maxCookieSize);
        mpInstance.Logger.verbose(Messages$5.InformationMessages.CookieSet);
        window.document.cookie = encodeURIComponent(key) + '=' + encodedCookiesWithExpirationAndPath;
      };

      /*  This function determines if a cookie is greater than the configured maxCookieSize.
          - If it is, we remove an MPID and its associated UI/UA/CSD from the cookie.
          - Once removed, check size, and repeat.
          - Never remove the currentUser's MPID from the cookie.
       MPID removal priority:
      1. If there are no currentSessionMPIDs, remove a random MPID from the the cookie.
      2. If there are currentSessionMPIDs:
          a. Remove at random MPIDs on the cookie that are not part of the currentSessionMPIDs
          b. Then remove MPIDs based on order in currentSessionMPIDs array, which
          stores MPIDs based on earliest login.
      */
      this.reduceAndEncodePersistence = function (persistence, expires, domain, maxCookieSize) {
        var encodedCookiesWithExpirationAndPath,
          currentSessionMPIDs = persistence.gs.csm ? persistence.gs.csm : [];
        // Comment 1 above
        if (!currentSessionMPIDs.length) {
          for (var key in persistence) {
            if (persistence.hasOwnProperty(key)) {
              encodedCookiesWithExpirationAndPath = createFullEncodedCookie(persistence, expires, domain);
              if (encodedCookiesWithExpirationAndPath.length > maxCookieSize) {
                if (!SDKv2NonMPIDCookieKeys[key] && key !== persistence.cu) {
                  delete persistence[key];
                }
              }
            }
          }
        } else {
          // Comment 2 above - First create an object of all MPIDs on the cookie
          var MPIDsOnCookie = {};
          for (var potentialMPID in persistence) {
            if (persistence.hasOwnProperty(potentialMPID)) {
              if (!SDKv2NonMPIDCookieKeys[potentialMPID] && potentialMPID !== persistence.cu) {
                MPIDsOnCookie[potentialMPID] = 1;
              }
            }
          }
          // Comment 2a above
          if (Object.keys(MPIDsOnCookie).length) {
            for (var mpid in MPIDsOnCookie) {
              encodedCookiesWithExpirationAndPath = createFullEncodedCookie(persistence, expires, domain);
              if (encodedCookiesWithExpirationAndPath.length > maxCookieSize) {
                if (MPIDsOnCookie.hasOwnProperty(mpid)) {
                  if (currentSessionMPIDs.indexOf(mpid) === -1) {
                    delete persistence[mpid];
                  }
                }
              }
            }
          }
          // Comment 2b above
          for (var i = 0; i < currentSessionMPIDs.length; i++) {
            encodedCookiesWithExpirationAndPath = createFullEncodedCookie(persistence, expires, domain);
            if (encodedCookiesWithExpirationAndPath.length > maxCookieSize) {
              var MPIDtoRemove = currentSessionMPIDs[i];
              if (persistence[MPIDtoRemove]) {
                mpInstance.Logger.verbose('Size of new encoded cookie is larger than maxCookieSize setting of ' + maxCookieSize + '. Removing from cookie the earliest logged in MPID containing: ' + JSON.stringify(persistence[MPIDtoRemove], 0, 2));
                delete persistence[MPIDtoRemove];
              } else {
                mpInstance.Logger.error('Unable to save MPID data to cookies because the resulting encoded cookie is larger than the maxCookieSize setting of ' + maxCookieSize + '. We recommend using a maxCookieSize of 1500.');
              }
            } else {
              break;
            }
          }
        }
        return encodedCookiesWithExpirationAndPath;
      };
      function createFullEncodedCookie(persistence, expires, domain) {
        return self.encodePersistence(JSON.stringify(persistence)) + ';expires=' + expires + ';path=/' + domain;
      }
      this.findPrevCookiesBasedOnUI = function (identityApiData) {
        var persistence = mpInstance._Persistence.getPersistence();
        var matchedUser;
        if (identityApiData) {
          for (var requestedIdentityType in identityApiData.userIdentities) {
            if (persistence && Object.keys(persistence).length) {
              for (var key in persistence) {
                // any value in persistence that has an MPID key will be an MPID to search through
                // other keys on the cookie are currentSessionMPIDs and currentMPID which should not be searched
                if (persistence[key].mpid) {
                  var cookieUIs = persistence[key].ui;
                  for (var cookieUIType in cookieUIs) {
                    if (requestedIdentityType === cookieUIType && identityApiData.userIdentities[requestedIdentityType] === cookieUIs[cookieUIType]) {
                      matchedUser = key;
                      break;
                    }
                  }
                }
              }
            }
          }
        }
        if (matchedUser) {
          self.storeDataInMemory(persistence, matchedUser);
        }
      };
      this.encodePersistence = function (persistence) {
        persistence = JSON.parse(persistence);
        for (var key in persistence.gs) {
          if (persistence.gs.hasOwnProperty(key)) {
            if (Base64CookieKeys[key]) {
              if (persistence.gs[key]) {
                // base64 encode any value that is an object or Array in globalSettings
                if (Array.isArray(persistence.gs[key]) && persistence.gs[key].length || mpInstance._Helpers.isObject(persistence.gs[key]) && Object.keys(persistence.gs[key]).length) {
                  persistence.gs[key] = Base64.encode(JSON.stringify(persistence.gs[key]));
                } else {
                  delete persistence.gs[key];
                }
              } else {
                delete persistence.gs[key];
              }
            } else if (key === 'ie') {
              persistence.gs[key] = persistence.gs[key] ? 1 : 0;
            } else if (!persistence.gs[key]) {
              delete persistence.gs[key];
            }
          }
        }
        for (var mpid in persistence) {
          if (persistence.hasOwnProperty(mpid)) {
            if (!SDKv2NonMPIDCookieKeys[mpid]) {
              for (key in persistence[mpid]) {
                if (persistence[mpid].hasOwnProperty(key)) {
                  if (Base64CookieKeys[key]) {
                    if (mpInstance._Helpers.isObject(persistence[mpid][key]) && Object.keys(persistence[mpid][key]).length) {
                      persistence[mpid][key] = Base64.encode(JSON.stringify(persistence[mpid][key]));
                    } else {
                      delete persistence[mpid][key];
                    }
                  }
                }
              }
            }
          }
        }
        return createCookieString(JSON.stringify(persistence));
      };

      // TODO: This should actually be decodePersistenceString or
      //       we should refactor this to take a string and return an object
      this.decodePersistence = function (persistence) {
        try {
          if (persistence) {
            persistence = JSON.parse(revertCookieString(persistence));
            if (mpInstance._Helpers.isObject(persistence) && Object.keys(persistence).length) {
              for (var key in persistence.gs) {
                if (persistence.gs.hasOwnProperty(key)) {
                  if (Base64CookieKeys[key]) {
                    persistence.gs[key] = JSON.parse(Base64.decode(persistence.gs[key]));
                  } else if (key === 'ie') {
                    persistence.gs[key] = Boolean(persistence.gs[key]);
                  }
                }
              }
              for (var mpid in persistence) {
                if (persistence.hasOwnProperty(mpid)) {
                  if (!SDKv2NonMPIDCookieKeys[mpid]) {
                    for (key in persistence[mpid]) {
                      if (persistence[mpid].hasOwnProperty(key)) {
                        if (Base64CookieKeys[key]) {
                          if (persistence[mpid][key].length) {
                            persistence[mpid][key] = JSON.parse(Base64.decode(persistence[mpid][key]));
                          }
                        }
                      }
                    }
                  } else if (mpid === 'l') {
                    persistence[mpid] = Boolean(persistence[mpid]);
                  }
                }
              }
            }
            return JSON.stringify(persistence);
          }
        } catch (e) {
          mpInstance.Logger.error('Problem with decoding cookie', e);
        }
      };
      this.getCookieDomain = function () {
        if (mpInstance._Store.SDKConfig.cookieDomain) {
          return mpInstance._Store.SDKConfig.cookieDomain;
        } else {
          var rootDomain = self.getDomain(document, location.hostname);
          if (rootDomain === '') {
            return '';
          } else {
            return '.' + rootDomain;
          }
        }
      };

      // This function loops through the parts of a full hostname, attempting to set a cookie on that domain. It will set a cookie at the highest level possible.
      // For example subdomain.domain.co.uk would try the following combinations:
      // "co.uk" -> fail
      // "domain.co.uk" -> success, return
      // "subdomain.domain.co.uk" -> skipped, because already found
      this.getDomain = function (doc, locationHostname) {
        var i,
          testParts,
          mpTest = 'mptest=cookie',
          hostname = locationHostname.split('.');
        for (i = hostname.length - 1; i >= 0; i--) {
          testParts = hostname.slice(i).join('.');
          doc.cookie = mpTest + ';domain=.' + testParts + ';';
          if (doc.cookie.indexOf(mpTest) > -1) {
            doc.cookie = mpTest.split('=')[0] + '=;domain=.' + testParts + ';expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            return testParts;
          }
        }
        return '';
      };
      this.getCartProducts = function (mpid) {
        var allCartProducts,
          cartProductsString = localStorage.getItem(mpInstance._Store.prodStorageName);
        if (cartProductsString) {
          allCartProducts = JSON.parse(Base64.decode(cartProductsString));
          if (allCartProducts && allCartProducts[mpid] && allCartProducts[mpid].cp) {
            return allCartProducts[mpid].cp;
          }
        }
        return [];
      };
      this.setCartProducts = function (allProducts) {
        if (!mpInstance._Store.isLocalStorageAvailable) {
          return;
        }
        try {
          window.localStorage.setItem(encodeURIComponent(mpInstance._Store.prodStorageName), Base64.encode(JSON.stringify(allProducts)));
        } catch (e) {
          mpInstance.Logger.error('Error with setting products on localStorage.');
        }
      };
      this.saveUserCookieSyncDatesToPersistence = function (mpid, csd) {
        if (csd) {
          var persistence = self.getPersistence();
          if (persistence) {
            if (persistence[mpid]) {
              persistence[mpid].csd = csd;
            } else {
              persistence[mpid] = {
                csd: csd
              };
            }
          }
          self.savePersistence(persistence);
        }
      };
      this.swapCurrentUser = function (previousMPID, currentMPID, currentSessionMPIDs) {
        if (previousMPID && currentMPID && previousMPID !== currentMPID) {
          var persistence = self.getPersistence();
          if (persistence) {
            persistence.cu = currentMPID;
            persistence.gs.csm = currentSessionMPIDs;
            self.savePersistence(persistence);
          }
        }
      };

      // https://go.mparticle.com/work/SQDSDKS-6021
      this.savePersistence = function (persistence) {
        var encodedPersistence = self.encodePersistence(JSON.stringify(persistence)),
          date = new Date(),
          key = mpInstance._Store.storageName,
          expires = new Date(date.getTime() + mpInstance._Store.SDKConfig.cookieExpiration * 24 * 60 * 60 * 1000).toGMTString(),
          cookieDomain = self.getCookieDomain(),
          domain;
        if (cookieDomain === '') {
          domain = '';
        } else {
          domain = ';domain=' + cookieDomain;
        }
        if (mpInstance._Store.SDKConfig.useCookieStorage) {
          var encodedCookiesWithExpirationAndPath = self.reduceAndEncodePersistence(persistence, expires, domain, mpInstance._Store.SDKConfig.maxCookieSize);
          window.document.cookie = encodeURIComponent(key) + '=' + encodedCookiesWithExpirationAndPath;
        } else {
          if (mpInstance._Store.isLocalStorageAvailable) {
            localStorage.setItem(mpInstance._Store.storageName, encodedPersistence);
          }
        }
      };
      this.getPersistence = function () {
        var persistence = this.useLocalStorage() ? this.getLocalStorage() : this.getCookie();
        return persistence;
      };
      this.getFirstSeenTime = function (mpid) {
        if (!mpid) {
          return null;
        }
        var persistence = self.getPersistence();
        if (persistence && persistence[mpid] && persistence[mpid].fst) {
          return persistence[mpid].fst;
        } else {
          return null;
        }
      };

      /**
       * set the "first seen" time for a user. the time will only be set once for a given
       * mpid after which subsequent calls will be ignored
       */
      this.setFirstSeenTime = function (mpid, time) {
        if (!mpid) {
          return;
        }
        // https://go.mparticle.com/work/SQDSDKS-6329
        if (!time) {
          time = new Date().getTime();
        }
        var persistence = self.getPersistence();
        if (persistence) {
          if (!persistence[mpid]) {
            persistence[mpid] = {};
          }
          if (!persistence[mpid].fst) {
            persistence[mpid].fst = time;
            self.savePersistence(persistence);
          }
        }
      };

      /**
       * returns the "last seen" time for a user. If the mpid represents the current user, the
       * return value will always be the current time, otherwise it will be to stored "last seen"
       * time
       */
      this.getLastSeenTime = function (mpid) {
        if (!mpid) {
          return null;
        }
        if (mpid === mpInstance.Identity.getCurrentUser().getMPID()) {
          //if the mpid is the current user, its last seen time is the current time
          return new Date().getTime();
        } else {
          var persistence = self.getPersistence();
          if (persistence && persistence[mpid] && persistence[mpid].lst) {
            return persistence[mpid].lst;
          }
          return null;
        }
      };
      this.setLastSeenTime = function (mpid, time) {
        if (!mpid) {
          return;
        }
        // https://go.mparticle.com/work/SQDSDKS-6329
        if (!time) {
          time = new Date().getTime();
        }
        var persistence = self.getPersistence();
        if (persistence && persistence[mpid]) {
          persistence[mpid].lst = time;
          self.savePersistence(persistence);
        }
      };
      this.getDeviceId = function () {
        return mpInstance._Store.deviceId;
      };
      this.setDeviceId = function (guid) {
        mpInstance._Store.deviceId = guid;
        self.update();
      };
      this.resetPersistence = function () {
        removeLocalStorage(StorageNames.localStorageName);
        removeLocalStorage(StorageNames.localStorageNameV3);
        removeLocalStorage(StorageNames.localStorageNameV4);
        removeLocalStorage(mpInstance._Store.prodStorageName);
        removeLocalStorage(mpInstance._Store.storageName);
        removeLocalStorage(StorageNames.localStorageProductsV4);
        self.expireCookies(StorageNames.cookieName);
        self.expireCookies(StorageNames.cookieNameV2);
        self.expireCookies(StorageNames.cookieNameV3);
        self.expireCookies(StorageNames.cookieNameV4);
        self.expireCookies(mpInstance._Store.prodStorageName);
        self.expireCookies(mpInstance._Store.storageName);
        if (mParticle._isTestEnv) {
          var testWorkspaceToken = 'abcdef';
          removeLocalStorage(mpInstance._Helpers.createMainStorageName(testWorkspaceToken));
          self.expireCookies(mpInstance._Helpers.createMainStorageName(testWorkspaceToken));
          removeLocalStorage(mpInstance._Helpers.createProductStorageName(testWorkspaceToken));
        }
      };

      // https://go.mparticle.com/work/SQDSDKS-6045
      // Forwarder Batching Code
      this.forwardingStatsBatches = {
        uploadsTable: {},
        forwardingStatsEventQueue: []
      };
    }

    var Messages$4 = Constants.Messages;
    function Events(mpInstance) {
      var self = this;
      this.logEvent = function (event, options) {
        mpInstance.Logger.verbose(Messages$4.InformationMessages.StartingLogEvent + ': ' + event.name);
        if (mpInstance._Helpers.canLog()) {
          var uploadObject = mpInstance._ServerModel.createEventObject(event);
          mpInstance._APIClient.sendEventToServer(uploadObject, options);
        } else {
          mpInstance.Logger.verbose(Messages$4.InformationMessages.AbandonLogEvent);
        }
      };
      this.startTracking = function (callback) {
        if (!mpInstance._Store.isTracking) {
          if ('geolocation' in navigator) {
            mpInstance._Store.watchPositionId = navigator.geolocation.watchPosition(successTracking, errorTracking);
          }
        } else {
          var position = {
            coords: {
              latitude: mpInstance._Store.currentPosition.lat,
              longitude: mpInstance._Store.currentPosition.lng
            }
          };
          triggerCallback(callback, position);
        }
        function successTracking(position) {
          mpInstance._Store.currentPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          triggerCallback(callback, position);
          // prevents callback from being fired multiple times
          callback = null;
          mpInstance._Store.isTracking = true;
        }
        function errorTracking() {
          triggerCallback(callback);
          // prevents callback from being fired multiple times
          callback = null;
          mpInstance._Store.isTracking = false;
        }
        function triggerCallback(callback, position) {
          if (callback) {
            try {
              if (position) {
                callback(position);
              } else {
                callback();
              }
            } catch (e) {
              mpInstance.Logger.error('Error invoking the callback passed to startTrackingLocation.');
              mpInstance.Logger.error(e);
            }
          }
        }
      };
      this.stopTracking = function () {
        if (mpInstance._Store.isTracking) {
          navigator.geolocation.clearWatch(mpInstance._Store.watchPositionId);
          mpInstance._Store.currentPosition = null;
          mpInstance._Store.isTracking = false;
        }
      };
      this.logOptOut = function () {
        mpInstance.Logger.verbose(Messages$4.InformationMessages.StartingLogOptOut);
        var event = mpInstance._ServerModel.createEventObject({
          messageType: Types.MessageType.OptOut,
          eventType: Types.EventType.Other
        });
        mpInstance._APIClient.sendEventToServer(event);
      };
      this.logAST = function () {
        self.logEvent({
          messageType: Types.MessageType.AppStateTransition
        });
      };
      this.logCheckoutEvent = function (step, option, attrs, customFlags) {
        var event = mpInstance._Ecommerce.createCommerceEventObject(customFlags);
        if (event) {
          event.EventName += mpInstance._Ecommerce.getProductActionEventName(Types.ProductActionType.Checkout);
          event.EventCategory = Types.CommerceEventType.ProductCheckout;
          event.ProductAction = {
            ProductActionType: Types.ProductActionType.Checkout,
            CheckoutStep: step,
            CheckoutOptions: option,
            ProductList: []
          };
          self.logCommerceEvent(event, attrs);
        }
      };
      this.logProductActionEvent = function (productActionType, product, customAttrs, customFlags, transactionAttributes, options) {
        var event = mpInstance._Ecommerce.createCommerceEventObject(customFlags, options);
        var productList = Array.isArray(product) ? product : [product];
        productList.forEach(function (product) {
          if (product.TotalAmount) {
            product.TotalAmount = mpInstance._Ecommerce.sanitizeAmount(product.TotalAmount, 'TotalAmount');
          }
          if (product.Position) {
            product.Position = mpInstance._Ecommerce.sanitizeAmount(product.Position, 'Position');
          }
          if (product.Price) {
            product.Price = mpInstance._Ecommerce.sanitizeAmount(product.Price, 'Price');
          }
          if (product.Quantity) {
            product.Quantity = mpInstance._Ecommerce.sanitizeAmount(product.Quantity, 'Quantity');
          }
        });
        if (event) {
          event.EventCategory = mpInstance._Ecommerce.convertProductActionToEventType(productActionType);
          event.EventName += mpInstance._Ecommerce.getProductActionEventName(productActionType);
          event.ProductAction = {
            ProductActionType: productActionType,
            ProductList: productList
          };
          if (mpInstance._Helpers.isObject(transactionAttributes)) {
            mpInstance._Ecommerce.convertTransactionAttributesToProductAction(transactionAttributes, event.ProductAction);
          }
          self.logCommerceEvent(event, customAttrs, options);
        }
      };
      this.logPurchaseEvent = function (transactionAttributes, product, attrs, customFlags) {
        var event = mpInstance._Ecommerce.createCommerceEventObject(customFlags);
        if (event) {
          event.EventName += mpInstance._Ecommerce.getProductActionEventName(Types.ProductActionType.Purchase);
          event.EventCategory = Types.CommerceEventType.ProductPurchase;
          event.ProductAction = {
            ProductActionType: Types.ProductActionType.Purchase
          };
          event.ProductAction.ProductList = mpInstance._Ecommerce.buildProductList(event, product);
          mpInstance._Ecommerce.convertTransactionAttributesToProductAction(transactionAttributes, event.ProductAction);
          self.logCommerceEvent(event, attrs);
        }
      };
      this.logRefundEvent = function (transactionAttributes, product, attrs, customFlags) {
        if (!transactionAttributes) {
          mpInstance.Logger.error(Messages$4.ErrorMessages.TransactionRequired);
          return;
        }
        var event = mpInstance._Ecommerce.createCommerceEventObject(customFlags);
        if (event) {
          event.EventName += mpInstance._Ecommerce.getProductActionEventName(Types.ProductActionType.Refund);
          event.EventCategory = Types.CommerceEventType.ProductRefund;
          event.ProductAction = {
            ProductActionType: Types.ProductActionType.Refund
          };
          event.ProductAction.ProductList = mpInstance._Ecommerce.buildProductList(event, product);
          mpInstance._Ecommerce.convertTransactionAttributesToProductAction(transactionAttributes, event.ProductAction);
          self.logCommerceEvent(event, attrs);
        }
      };
      this.logPromotionEvent = function (promotionType, promotion, attrs, customFlags, eventOptions) {
        var event = mpInstance._Ecommerce.createCommerceEventObject(customFlags);
        if (event) {
          event.EventName += mpInstance._Ecommerce.getPromotionActionEventName(promotionType);
          event.EventCategory = mpInstance._Ecommerce.convertPromotionActionToEventType(promotionType);
          event.PromotionAction = {
            PromotionActionType: promotionType,
            PromotionList: Array.isArray(promotion) ? promotion : [promotion]
          };
          self.logCommerceEvent(event, attrs, eventOptions);
        }
      };
      this.logImpressionEvent = function (impression, attrs, customFlags, options) {
        var event = mpInstance._Ecommerce.createCommerceEventObject(customFlags);
        if (event) {
          event.EventName += 'Impression';
          event.EventCategory = Types.CommerceEventType.ProductImpression;
          if (!Array.isArray(impression)) {
            impression = [impression];
          }
          event.ProductImpressions = [];
          impression.forEach(function (impression) {
            event.ProductImpressions.push({
              ProductImpressionList: impression.Name,
              ProductList: Array.isArray(impression.Product) ? impression.Product : [impression.Product]
            });
          });
          self.logCommerceEvent(event, attrs, options);
        }
      };
      this.logCommerceEvent = function (commerceEvent, attrs, options) {
        mpInstance.Logger.verbose(Messages$4.InformationMessages.StartingLogCommerceEvent);

        // If a developer typos the ProductActionType, the event category will be
        // null, resulting in kit forwarding errors on the server.
        // The check for `ProductAction` is required to denote that these are
        // ProductAction events, and not impression or promotions
        if (commerceEvent.ProductAction && commerceEvent.EventCategory === null) {
          mpInstance.Logger.error('Commerce event not sent.  The mParticle.ProductActionType you passed was invalid. Re-check your code.');
          return;
        }
        attrs = mpInstance._Helpers.sanitizeAttributes(attrs, commerceEvent.EventName);
        if (mpInstance._Helpers.canLog()) {
          if (mpInstance._Store.webviewBridgeEnabled) {
            // Don't send shopping cart to parent sdks
            commerceEvent.ShoppingCart = {};
          }
          if (attrs) {
            commerceEvent.EventAttributes = attrs;
          }
          mpInstance._APIClient.sendEventToServer(commerceEvent, options);

          // https://go.mparticle.com/work/SQDSDKS-6038
          mpInstance._Persistence.update();
        } else {
          mpInstance.Logger.verbose(Messages$4.InformationMessages.AbandonLogEvent);
        }
      };
      this.addEventHandler = function (domEvent, selector, eventName, data, eventType) {
        var elements = [],
          handler = function handler(e) {
            var timeoutHandler = function timeoutHandler() {
              if (element.href) {
                window.location.href = element.href;
              } else if (element.submit) {
                element.submit();
              }
            };
            mpInstance.Logger.verbose('DOM event triggered, handling event');
            self.logEvent({
              messageType: Types.MessageType.PageEvent,
              name: typeof eventName === 'function' ? eventName(element) : eventName,
              data: typeof data === 'function' ? data(element) : data,
              eventType: eventType || Types.EventType.Other
            });

            // TODO: Handle middle-clicks and special keys (ctrl, alt, etc)
            if (element.href && element.target !== '_blank' || element.submit) {
              // Give xmlhttprequest enough time to execute before navigating a link or submitting form

              if (e.preventDefault) {
                e.preventDefault();
              } else {
                e.returnValue = false;
              }
              setTimeout(timeoutHandler, mpInstance._Store.SDKConfig.timeout);
            }
          },
          element,
          i;
        if (!selector) {
          mpInstance.Logger.error("Can't bind event, selector is required");
          return;
        }

        // Handle a css selector string or a dom element
        if (typeof selector === 'string') {
          elements = document.querySelectorAll(selector);
        } else if (selector.nodeType) {
          elements = [selector];
        }
        if (elements.length) {
          mpInstance.Logger.verbose('Found ' + elements.length + ' element' + (elements.length > 1 ? 's' : '') + ', attaching event handlers');
          for (i = 0; i < elements.length; i++) {
            element = elements[i];
            if (element.addEventListener) {
              element.addEventListener(domEvent, handler, false);
            } else if (element.attachEvent) {
              element.attachEvent('on' + domEvent, handler);
            } else {
              element['on' + domEvent] = handler;
            }
          }
        } else {
          mpInstance.Logger.verbose('No elements found');
        }
      };
    }

    function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
      try {
        var info = gen[key](arg);
        var value = info.value;
      } catch (error) {
        reject(error);
        return;
      }
      if (info.done) {
        resolve(value);
      } else {
        Promise.resolve(value).then(_next, _throw);
      }
    }
    function _asyncToGenerator(fn) {
      return function () {
        var self = this,
          args = arguments;
        return new Promise(function (resolve, reject) {
          var gen = fn.apply(self, args);
          function _next(value) {
            asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
          }
          function _throw(err) {
            asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
          }
          _next(undefined);
        });
      };
    }

    var regeneratorRuntime$1 = {exports: {}};

    var _typeof = {exports: {}};

    _typeof.exports;

    (function (module) {
    	function _typeof(o) {
    	  "@babel/helpers - typeof";

    	  return (module.exports = _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    	    return typeof o;
    	  } : function (o) {
    	    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
    	  }, module.exports.__esModule = true, module.exports["default"] = module.exports), _typeof(o);
    	}
    	module.exports = _typeof, module.exports.__esModule = true, module.exports["default"] = module.exports; 
    } (_typeof));

    var _typeofExports = _typeof.exports;

    regeneratorRuntime$1.exports;

    (function (module) {
    	var _typeof = _typeofExports["default"];
    	function _regeneratorRuntime() {
    	  module.exports = _regeneratorRuntime = function _regeneratorRuntime() {
    	    return e;
    	  }, module.exports.__esModule = true, module.exports["default"] = module.exports;
    	  var t,
    	    e = {},
    	    r = Object.prototype,
    	    n = r.hasOwnProperty,
    	    o = Object.defineProperty || function (t, e, r) {
    	      t[e] = r.value;
    	    },
    	    i = "function" == typeof Symbol ? Symbol : {},
    	    a = i.iterator || "@@iterator",
    	    c = i.asyncIterator || "@@asyncIterator",
    	    u = i.toStringTag || "@@toStringTag";
    	  function define(t, e, r) {
    	    return Object.defineProperty(t, e, {
    	      value: r,
    	      enumerable: !0,
    	      configurable: !0,
    	      writable: !0
    	    }), t[e];
    	  }
    	  try {
    	    define({}, "");
    	  } catch (t) {
    	    define = function define(t, e, r) {
    	      return t[e] = r;
    	    };
    	  }
    	  function wrap(t, e, r, n) {
    	    var i = e && e.prototype instanceof Generator ? e : Generator,
    	      a = Object.create(i.prototype),
    	      c = new Context(n || []);
    	    return o(a, "_invoke", {
    	      value: makeInvokeMethod(t, r, c)
    	    }), a;
    	  }
    	  function tryCatch(t, e, r) {
    	    try {
    	      return {
    	        type: "normal",
    	        arg: t.call(e, r)
    	      };
    	    } catch (t) {
    	      return {
    	        type: "throw",
    	        arg: t
    	      };
    	    }
    	  }
    	  e.wrap = wrap;
    	  var h = "suspendedStart",
    	    l = "suspendedYield",
    	    f = "executing",
    	    s = "completed",
    	    y = {};
    	  function Generator() {}
    	  function GeneratorFunction() {}
    	  function GeneratorFunctionPrototype() {}
    	  var p = {};
    	  define(p, a, function () {
    	    return this;
    	  });
    	  var d = Object.getPrototypeOf,
    	    v = d && d(d(values([])));
    	  v && v !== r && n.call(v, a) && (p = v);
    	  var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p);
    	  function defineIteratorMethods(t) {
    	    ["next", "throw", "return"].forEach(function (e) {
    	      define(t, e, function (t) {
    	        return this._invoke(e, t);
    	      });
    	    });
    	  }
    	  function AsyncIterator(t, e) {
    	    function invoke(r, o, i, a) {
    	      var c = tryCatch(t[r], t, o);
    	      if ("throw" !== c.type) {
    	        var u = c.arg,
    	          h = u.value;
    	        return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) {
    	          invoke("next", t, i, a);
    	        }, function (t) {
    	          invoke("throw", t, i, a);
    	        }) : e.resolve(h).then(function (t) {
    	          u.value = t, i(u);
    	        }, function (t) {
    	          return invoke("throw", t, i, a);
    	        });
    	      }
    	      a(c.arg);
    	    }
    	    var r;
    	    o(this, "_invoke", {
    	      value: function value(t, n) {
    	        function callInvokeWithMethodAndArg() {
    	          return new e(function (e, r) {
    	            invoke(t, n, e, r);
    	          });
    	        }
    	        return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
    	      }
    	    });
    	  }
    	  function makeInvokeMethod(e, r, n) {
    	    var o = h;
    	    return function (i, a) {
    	      if (o === f) throw new Error("Generator is already running");
    	      if (o === s) {
    	        if ("throw" === i) throw a;
    	        return {
    	          value: t,
    	          done: !0
    	        };
    	      }
    	      for (n.method = i, n.arg = a;;) {
    	        var c = n.delegate;
    	        if (c) {
    	          var u = maybeInvokeDelegate(c, n);
    	          if (u) {
    	            if (u === y) continue;
    	            return u;
    	          }
    	        }
    	        if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) {
    	          if (o === h) throw o = s, n.arg;
    	          n.dispatchException(n.arg);
    	        } else "return" === n.method && n.abrupt("return", n.arg);
    	        o = f;
    	        var p = tryCatch(e, r, n);
    	        if ("normal" === p.type) {
    	          if (o = n.done ? s : l, p.arg === y) continue;
    	          return {
    	            value: p.arg,
    	            done: n.done
    	          };
    	        }
    	        "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg);
    	      }
    	    };
    	  }
    	  function maybeInvokeDelegate(e, r) {
    	    var n = r.method,
    	      o = e.iterator[n];
    	    if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y;
    	    var i = tryCatch(o, e.iterator, r.arg);
    	    if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y;
    	    var a = i.arg;
    	    return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y);
    	  }
    	  function pushTryEntry(t) {
    	    var e = {
    	      tryLoc: t[0]
    	    };
    	    1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e);
    	  }
    	  function resetTryEntry(t) {
    	    var e = t.completion || {};
    	    e.type = "normal", delete e.arg, t.completion = e;
    	  }
    	  function Context(t) {
    	    this.tryEntries = [{
    	      tryLoc: "root"
    	    }], t.forEach(pushTryEntry, this), this.reset(!0);
    	  }
    	  function values(e) {
    	    if (e || "" === e) {
    	      var r = e[a];
    	      if (r) return r.call(e);
    	      if ("function" == typeof e.next) return e;
    	      if (!isNaN(e.length)) {
    	        var o = -1,
    	          i = function next() {
    	            for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next;
    	            return next.value = t, next.done = !0, next;
    	          };
    	        return i.next = i;
    	      }
    	    }
    	    throw new TypeError(_typeof(e) + " is not iterable");
    	  }
    	  return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", {
    	    value: GeneratorFunctionPrototype,
    	    configurable: !0
    	  }), o(GeneratorFunctionPrototype, "constructor", {
    	    value: GeneratorFunction,
    	    configurable: !0
    	  }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) {
    	    var e = "function" == typeof t && t.constructor;
    	    return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name));
    	  }, e.mark = function (t) {
    	    return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t;
    	  }, e.awrap = function (t) {
    	    return {
    	      __await: t
    	    };
    	  }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () {
    	    return this;
    	  }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) {
    	    void 0 === i && (i = Promise);
    	    var a = new AsyncIterator(wrap(t, r, n, o), i);
    	    return e.isGeneratorFunction(r) ? a : a.next().then(function (t) {
    	      return t.done ? t.value : a.next();
    	    });
    	  }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () {
    	    return this;
    	  }), define(g, "toString", function () {
    	    return "[object Generator]";
    	  }), e.keys = function (t) {
    	    var e = Object(t),
    	      r = [];
    	    for (var n in e) r.push(n);
    	    return r.reverse(), function next() {
    	      for (; r.length;) {
    	        var t = r.pop();
    	        if (t in e) return next.value = t, next.done = !1, next;
    	      }
    	      return next.done = !0, next;
    	    };
    	  }, e.values = values, Context.prototype = {
    	    constructor: Context,
    	    reset: function reset(e) {
    	      if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t);
    	    },
    	    stop: function stop() {
    	      this.done = !0;
    	      var t = this.tryEntries[0].completion;
    	      if ("throw" === t.type) throw t.arg;
    	      return this.rval;
    	    },
    	    dispatchException: function dispatchException(e) {
    	      if (this.done) throw e;
    	      var r = this;
    	      function handle(n, o) {
    	        return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o;
    	      }
    	      for (var o = this.tryEntries.length - 1; o >= 0; --o) {
    	        var i = this.tryEntries[o],
    	          a = i.completion;
    	        if ("root" === i.tryLoc) return handle("end");
    	        if (i.tryLoc <= this.prev) {
    	          var c = n.call(i, "catchLoc"),
    	            u = n.call(i, "finallyLoc");
    	          if (c && u) {
    	            if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
    	            if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
    	          } else if (c) {
    	            if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
    	          } else {
    	            if (!u) throw new Error("try statement without catch or finally");
    	            if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
    	          }
    	        }
    	      }
    	    },
    	    abrupt: function abrupt(t, e) {
    	      for (var r = this.tryEntries.length - 1; r >= 0; --r) {
    	        var o = this.tryEntries[r];
    	        if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) {
    	          var i = o;
    	          break;
    	        }
    	      }
    	      i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null);
    	      var a = i ? i.completion : {};
    	      return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a);
    	    },
    	    complete: function complete(t, e) {
    	      if ("throw" === t.type) throw t.arg;
    	      return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y;
    	    },
    	    finish: function finish(t) {
    	      for (var e = this.tryEntries.length - 1; e >= 0; --e) {
    	        var r = this.tryEntries[e];
    	        if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y;
    	      }
    	    },
    	    "catch": function _catch(t) {
    	      for (var e = this.tryEntries.length - 1; e >= 0; --e) {
    	        var r = this.tryEntries[e];
    	        if (r.tryLoc === t) {
    	          var n = r.completion;
    	          if ("throw" === n.type) {
    	            var o = n.arg;
    	            resetTryEntry(r);
    	          }
    	          return o;
    	        }
    	      }
    	      throw new Error("illegal catch attempt");
    	    },
    	    delegateYield: function delegateYield(e, r, n) {
    	      return this.delegate = {
    	        iterator: values(e),
    	        resultName: r,
    	        nextLoc: n
    	      }, "next" === this.method && (this.arg = t), y;
    	    }
    	  }, e;
    	}
    	module.exports = _regeneratorRuntime, module.exports.__esModule = true, module.exports["default"] = module.exports; 
    } (regeneratorRuntime$1));

    var regeneratorRuntimeExports = regeneratorRuntime$1.exports;

    // TODO(Babel 8): Remove this file.

    var runtime = regeneratorRuntimeExports();
    var regenerator = runtime;

    // Copied from https://github.com/facebook/regenerator/blob/main/packages/runtime/runtime.js#L736=
    try {
      regeneratorRuntime = runtime;
    } catch (accidentalStrictMode) {
      if (typeof globalThis === "object") {
        globalThis.regeneratorRuntime = runtime;
      } else {
        Function("r", "regeneratorRuntime = r")(runtime);
      }
    }

    var _regeneratorRuntime = /*@__PURE__*/getDefaultExportFromCjs(regenerator);

    function filteredMparticleUser(mpid, forwarder, mpInstance, kitBlocker) {
      var self = this;
      return {
        getUserIdentities: function getUserIdentities() {
          var currentUserIdentities = {};
          var identities = mpInstance._Store.getUserIdentities(mpid);
          for (var identityType in identities) {
            if (identities.hasOwnProperty(identityType)) {
              var identityName = Types.IdentityType.getIdentityName(mpInstance._Helpers.parseNumber(identityType));
              if (!kitBlocker || kitBlocker && !kitBlocker.isIdentityBlocked(identityName))
                //if identity type is not blocked
                currentUserIdentities[identityName] = identities[identityType];
            }
          }
          currentUserIdentities = mpInstance._Helpers.filterUserIdentitiesForForwarders(currentUserIdentities, forwarder.userIdentityFilters);
          return {
            userIdentities: currentUserIdentities
          };
        },
        getMPID: function getMPID() {
          return mpid;
        },
        getUserAttributesLists: function getUserAttributesLists(forwarder) {
          var userAttributes,
            userAttributesLists = {};
          userAttributes = self.getAllUserAttributes();
          for (var key in userAttributes) {
            if (userAttributes.hasOwnProperty(key) && Array.isArray(userAttributes[key])) {
              if (!kitBlocker || kitBlocker && !kitBlocker.isAttributeKeyBlocked(key)) {
                userAttributesLists[key] = userAttributes[key].slice();
              }
            }
          }
          userAttributesLists = mpInstance._Helpers.filterUserAttributes(userAttributesLists, forwarder.userAttributeFilters);
          return userAttributesLists;
        },
        getAllUserAttributes: function getAllUserAttributes() {
          var userAttributesCopy = {};
          var userAttributes = mpInstance._Store.getUserAttributes(mpid);
          if (userAttributes) {
            for (var prop in userAttributes) {
              if (userAttributes.hasOwnProperty(prop)) {
                if (!kitBlocker || kitBlocker && !kitBlocker.isAttributeKeyBlocked(prop)) {
                  if (Array.isArray(userAttributes[prop])) {
                    userAttributesCopy[prop] = userAttributes[prop].slice();
                  } else {
                    userAttributesCopy[prop] = userAttributes[prop];
                  }
                }
              }
            }
          }
          userAttributesCopy = mpInstance._Helpers.filterUserAttributes(userAttributesCopy, forwarder.userAttributeFilters);
          return userAttributesCopy;
        }
      };
    }

    var _Constants$IdentityMe = Constants.IdentityMethods,
      Modify$3 = _Constants$IdentityMe.Modify,
      Identify$2 = _Constants$IdentityMe.Identify,
      Login$2 = _Constants$IdentityMe.Login,
      Logout$2 = _Constants$IdentityMe.Logout;
    function Forwarders(mpInstance, kitBlocker) {
      var _this = this;
      var self = this;
      this.forwarderStatsUploader = new APIClient(mpInstance, kitBlocker).initializeForwarderStatsUploader();
      var UserAttributeActionTypes = {
        setUserAttribute: 'setUserAttribute',
        removeUserAttribute: 'removeUserAttribute'
      };
      this.initForwarders = function (userIdentities, forwardingStatsCallback) {
        var user = mpInstance.Identity.getCurrentUser();
        if (!mpInstance._Store.webviewBridgeEnabled && mpInstance._Store.configuredForwarders) {
          // Some js libraries require that they be loaded first, or last, etc
          mpInstance._Store.configuredForwarders.sort(function (x, y) {
            x.settings.PriorityValue = x.settings.PriorityValue || 0;
            y.settings.PriorityValue = y.settings.PriorityValue || 0;
            return -1 * (x.settings.PriorityValue - y.settings.PriorityValue);
          });
          mpInstance._Store.activeForwarders = mpInstance._Store.configuredForwarders.filter(function (forwarder) {
            if (!mpInstance._Consent.isEnabledForUserConsent(forwarder.filteringConsentRuleValues, user)) {
              return false;
            }
            if (!self.isEnabledForUserAttributes(forwarder.filteringUserAttributeValue, user)) {
              return false;
            }
            if (!self.isEnabledForUnknownUser(forwarder.excludeAnonymousUser, user)) {
              return false;
            }
            var filteredUserIdentities = mpInstance._Helpers.filterUserIdentities(userIdentities, forwarder.userIdentityFilters);
            var filteredUserAttributes = mpInstance._Helpers.filterUserAttributes(user ? user.getAllUserAttributes() : {}, forwarder.userAttributeFilters);
            if (!forwarder.initialized) {
              forwarder.logger = mpInstance.Logger;
              forwarder.init(forwarder.settings, forwardingStatsCallback, false, null, filteredUserAttributes, filteredUserIdentities, mpInstance._Store.SDKConfig.appVersion, mpInstance._Store.SDKConfig.appName, mpInstance._Store.SDKConfig.customFlags, mpInstance._Store.clientId);
              forwarder.initialized = true;
            }
            return true;
          });
        }
      };
      this.isEnabledForUserAttributes = function (filterObject, user) {
        if (!filterObject || !mpInstance._Helpers.isObject(filterObject) || !Object.keys(filterObject).length) {
          return true;
        }
        var attrHash, valueHash, userAttributes;
        if (!user) {
          return false;
        } else {
          userAttributes = user.getAllUserAttributes();
        }
        var isMatch = false;
        try {
          if (userAttributes && mpInstance._Helpers.isObject(userAttributes) && Object.keys(userAttributes).length) {
            for (var attrName in userAttributes) {
              if (userAttributes.hasOwnProperty(attrName)) {
                attrHash = KitFilterHelper.hashAttributeConditionalForwarding(attrName);
                valueHash = KitFilterHelper.hashAttributeConditionalForwarding(userAttributes[attrName]);
                if (attrHash === filterObject.userAttributeName && valueHash === filterObject.userAttributeValue) {
                  isMatch = true;
                  break;
                }
              }
            }
          }
          if (filterObject) {
            return filterObject.includeOnMatch === isMatch;
          } else {
            return true;
          }
        } catch (e) {
          // in any error scenario, err on side of returning true and forwarding event
          return true;
        }
      };
      this.isEnabledForUnknownUser = function (excludeAnonymousUserBoolean, user) {
        if (!user || !user.isLoggedIn()) {
          if (excludeAnonymousUserBoolean) {
            return false;
          }
        }
        return true;
      };
      this.applyToForwarders = function (functionName, functionArgs) {
        if (mpInstance._Store.activeForwarders.length) {
          mpInstance._Store.activeForwarders.forEach(function (forwarder) {
            var forwarderFunction = forwarder[functionName];
            if (forwarderFunction) {
              try {
                var result = forwarder[functionName](functionArgs);
                if (result) {
                  mpInstance.Logger.verbose(result);
                }
              } catch (e) {
                mpInstance.Logger.verbose(e);
              }
            }
          });
        }
      };
      this.sendEventToForwarders = function (event) {
        var clonedEvent,
          hashedEventName,
          hashedEventType,
          filterUserIdentities = function filterUserIdentities(event, filterList) {
            if (event.UserIdentities && event.UserIdentities.length) {
              event.UserIdentities.forEach(function (userIdentity, i) {
                if (mpInstance._Helpers.inArray(filterList, KitFilterHelper.hashUserIdentity(userIdentity.Type))) {
                  event.UserIdentities.splice(i, 1);
                  if (i > 0) {
                    i--;
                  }
                }
              });
            }
          },
          filterAttributes = function filterAttributes(event, filterList) {
            var hash;
            if (!filterList) {
              return;
            }
            for (var attrName in event.EventAttributes) {
              if (event.EventAttributes.hasOwnProperty(attrName)) {
                hash = KitFilterHelper.hashEventAttributeKey(event.EventCategory, event.EventName, attrName);
                if (mpInstance._Helpers.inArray(filterList, hash)) {
                  delete event.EventAttributes[attrName];
                }
              }
            }
          },
          inFilteredList = function inFilteredList(filterList, hash) {
            if (filterList && filterList.length) {
              if (mpInstance._Helpers.inArray(filterList, hash)) {
                return true;
              }
            }
            return false;
          },
          forwardingRuleMessageTypes = [Types.MessageType.PageEvent, Types.MessageType.PageView, Types.MessageType.Commerce];
        if (!mpInstance._Store.webviewBridgeEnabled && mpInstance._Store.activeForwarders) {
          hashedEventName = KitFilterHelper.hashEventName(event.EventName, event.EventCategory);
          hashedEventType = KitFilterHelper.hashEventType(event.EventCategory);
          for (var i = 0; i < mpInstance._Store.activeForwarders.length; i++) {
            // Check attribute forwarding rule. This rule allows users to only forward an event if a
            // specific attribute exists and has a specific value. Alternatively, they can specify
            // that an event not be forwarded if the specified attribute name and value exists.
            // The two cases are controlled by the "includeOnMatch" boolean value.
            // Supported message types for attribute forwarding rules are defined in the forwardingRuleMessageTypes array

            if (forwardingRuleMessageTypes.indexOf(event.EventDataType) > -1 && mpInstance._Store.activeForwarders[i].filteringEventAttributeValue && mpInstance._Store.activeForwarders[i].filteringEventAttributeValue.eventAttributeName && mpInstance._Store.activeForwarders[i].filteringEventAttributeValue.eventAttributeValue) {
              var foundProp = null;

              // Attempt to find the attribute in the collection of event attributes
              if (event.EventAttributes) {
                for (var prop in event.EventAttributes) {
                  var hashedEventAttributeName;
                  hashedEventAttributeName = KitFilterHelper.hashAttributeConditionalForwarding(prop);
                  if (hashedEventAttributeName === mpInstance._Store.activeForwarders[i].filteringEventAttributeValue.eventAttributeName) {
                    foundProp = {
                      name: hashedEventAttributeName,
                      value: KitFilterHelper.hashAttributeConditionalForwarding(event.EventAttributes[prop])
                    };
                  }
                  if (foundProp) {
                    break;
                  }
                }
              }
              var isMatch = foundProp !== null && foundProp.value === mpInstance._Store.activeForwarders[i].filteringEventAttributeValue.eventAttributeValue;
              var shouldInclude = mpInstance._Store.activeForwarders[i].filteringEventAttributeValue.includeOnMatch === true ? isMatch : !isMatch;
              if (!shouldInclude) {
                continue;
              }
            }

            // Clone the event object, as we could be sending different attributes to each forwarder
            clonedEvent = {};
            clonedEvent = mpInstance._Helpers.extend(true, clonedEvent, event);
            // Check event filtering rules
            if (event.EventDataType === Types.MessageType.PageEvent && (inFilteredList(mpInstance._Store.activeForwarders[i].eventNameFilters, hashedEventName) || inFilteredList(mpInstance._Store.activeForwarders[i].eventTypeFilters, hashedEventType))) {
              continue;
            } else if (event.EventDataType === Types.MessageType.Commerce && inFilteredList(mpInstance._Store.activeForwarders[i].eventTypeFilters, hashedEventType)) {
              continue;
            } else if (event.EventDataType === Types.MessageType.PageView && inFilteredList(mpInstance._Store.activeForwarders[i].screenNameFilters, hashedEventName)) {
              continue;
            }

            // Check attribute filtering rules
            if (clonedEvent.EventAttributes) {
              if (event.EventDataType === Types.MessageType.PageEvent) {
                filterAttributes(clonedEvent, mpInstance._Store.activeForwarders[i].attributeFilters);
              } else if (event.EventDataType === Types.MessageType.PageView) {
                filterAttributes(clonedEvent, mpInstance._Store.activeForwarders[i].screenAttributeFilters);
              }
            }

            // Check user identity filtering rules
            filterUserIdentities(clonedEvent, mpInstance._Store.activeForwarders[i].userIdentityFilters);

            // Check user attribute filtering rules
            clonedEvent.UserAttributes = mpInstance._Helpers.filterUserAttributes(clonedEvent.UserAttributes, mpInstance._Store.activeForwarders[i].userAttributeFilters);
            if (mpInstance._Store.activeForwarders[i].process) {
              mpInstance.Logger.verbose('Sending message to forwarder: ' + mpInstance._Store.activeForwarders[i].name);
              var result = mpInstance._Store.activeForwarders[i].process(clonedEvent);
              if (result) {
                mpInstance.Logger.verbose(result);
              }
            }
          }
        }
      };
      this.handleForwarderUserAttributes = function (functionNameKey, key, value) {
        if (kitBlocker && kitBlocker.isAttributeKeyBlocked(key) || !mpInstance._Store.activeForwarders.length) {
          return;
        }
        mpInstance._Store.activeForwarders.forEach(function (forwarder) {
          var forwarderFunction = forwarder[functionNameKey];
          if (!forwarderFunction || mpInstance._Helpers.isFilteredUserAttribute(key, forwarder.userAttributeFilters)) {
            return;
          }
          try {
            var result;
            if (functionNameKey === UserAttributeActionTypes.setUserAttribute) {
              result = forwarder.setUserAttribute(key, value);
            } else if (functionNameKey === UserAttributeActionTypes.removeUserAttribute) {
              result = forwarder.removeUserAttribute(key);
            }
            if (result) {
              mpInstance.Logger.verbose(result);
            }
          } catch (e) {
            mpInstance.Logger.error(e);
          }
        });
      };

      // TODO: https://go.mparticle.com/work/SQDSDKS-6036
      this.setForwarderUserIdentities = function (userIdentities) {
        mpInstance._Store.activeForwarders.forEach(function (forwarder) {
          var filteredUserIdentities = mpInstance._Helpers.filterUserIdentities(userIdentities, forwarder.userIdentityFilters);
          if (forwarder.setUserIdentity) {
            filteredUserIdentities.forEach(function (identity) {
              var result = forwarder.setUserIdentity(identity.Identity, identity.Type);
              if (result) {
                mpInstance.Logger.verbose(result);
              }
            });
          }
        });
      };
      this.setForwarderOnUserIdentified = function (user) {
        mpInstance._Store.activeForwarders.forEach(function (forwarder) {
          var filteredUser = filteredMparticleUser(user.getMPID(), forwarder, mpInstance, kitBlocker);
          if (forwarder.onUserIdentified) {
            var result = forwarder.onUserIdentified(filteredUser);
            if (result) {
              mpInstance.Logger.verbose(result);
            }
          }
        });
      };
      this.setForwarderOnIdentityComplete = function (user, identityMethod) {
        var result;
        mpInstance._Store.activeForwarders.forEach(function (forwarder) {
          var filteredUser = filteredMparticleUser(user.getMPID(), forwarder, mpInstance, kitBlocker);
          var filteredUserIdentities = filteredUser.getUserIdentities();
          if (identityMethod === Identify$2) {
            if (forwarder.onIdentifyComplete) {
              result = forwarder.onIdentifyComplete(filteredUser, filteredUserIdentities);
              if (result) {
                mpInstance.Logger.verbose(result);
              }
            }
          } else if (identityMethod === Login$2) {
            if (forwarder.onLoginComplete) {
              result = forwarder.onLoginComplete(filteredUser, filteredUserIdentities);
              if (result) {
                mpInstance.Logger.verbose(result);
              }
            }
          } else if (identityMethod === Logout$2) {
            if (forwarder.onLogoutComplete) {
              result = forwarder.onLogoutComplete(filteredUser, filteredUserIdentities);
              if (result) {
                mpInstance.Logger.verbose(result);
              }
            }
          } else if (identityMethod === Modify$3) {
            if (forwarder.onModifyComplete) {
              result = forwarder.onModifyComplete(filteredUser, filteredUserIdentities);
              if (result) {
                mpInstance.Logger.verbose(result);
              }
            }
          }
        });
      };
      this.getForwarderStatsQueue = function () {
        return mpInstance._Persistence.forwardingStatsBatches.forwardingStatsEventQueue;
      };
      this.setForwarderStatsQueue = function (queue) {
        mpInstance._Persistence.forwardingStatsBatches.forwardingStatsEventQueue = queue;
      };

      // Processing forwarders is a 2 step process:
      //   1. Configure the kit
      //   2. Initialize the kit
      // There are 2 types of kits:
      //   1. UI-enabled kits
      //   2. Sideloaded kits.
      this.processForwarders = function (config, forwardingStatsCallback) {
        if (!config) {
          mpInstance.Logger.warning('No config was passed. Cannot process forwarders');
        } else {
          this.processUIEnabledKits(config);
          this.processSideloadedKits(config);
          self.initForwarders(mpInstance._Store.SDKConfig.identifyRequest.userIdentities, forwardingStatsCallback);
        }
      };

      // These are kits that are enabled via the mParticle UI.
      // A kit that is UI-enabled will have a kit configuration that returns from
      // the server, or in rare cases, is passed in by the developer.
      // The kit configuration will be compared with the kit constructors to determine
      // if there is a match before being initialized.
      // Only kits that are configured properly can be active and used for kit forwarding.
      this.processUIEnabledKits = function (config) {
        var kits = this.returnKitConstructors();
        try {
          if (Array.isArray(config.kitConfigs) && config.kitConfigs.length) {
            config.kitConfigs.forEach(function (kitConfig) {
              self.configureUIEnabledKit(kitConfig, kits);
            });
          }
        } catch (e) {
          mpInstance.Logger.error('MP Kits not configured propertly. Kits may not be initialized. ' + e);
        }
      };
      this.returnKitConstructors = function () {
        var kits = {};
        // If there are kits inside of mpInstance._Store.SDKConfig.kits, then mParticle is self hosted
        if (!isEmpty(mpInstance._Store.SDKConfig.kits)) {
          kits = mpInstance._Store.SDKConfig.kits;
          // otherwise mParticle is loaded via script tag
        } else if (!isEmpty(mpInstance._preInit.forwarderConstructors)) {
          mpInstance._preInit.forwarderConstructors.forEach(function (kitConstructor) {
            // A suffix is added to a kitConstructor and kit config if there are multiple different
            // versions of a client kit.  This matches the suffix in the DB.  As an example
            // the GA4 kit has a client kit and a server side kit which has a client side
            // component.  They share the same name/module ID in the DB, so we include a
            // suffix to distinguish them in the kits object.
            // If a customer wanted simultaneous GA4 client and server connections,
            // a suffix allows the SDK to distinguish the two.
            if (kitConstructor.suffix) {
              var kitNameWithConstructorSuffix = "".concat(kitConstructor.name, "-").concat(kitConstructor.suffix);
              kits[kitNameWithConstructorSuffix] = kitConstructor;
            } else {
              kits[kitConstructor.name] = kitConstructor;
            }
          });
        }
        return kits;
      };
      this.configureUIEnabledKit = function (configuration, kits) {
        var newKit = null;
        var config = configuration;
        for (var name in kits) {
          // Configs are returned with suffixes also. We need to consider the
          // config suffix here to match the constructor suffix
          var kitNameWithConfigSuffix = void 0;
          if (config.suffix) {
            kitNameWithConfigSuffix = "".concat(config.name, "-").concat(config.suffix);
          }
          if (name === kitNameWithConfigSuffix || name === config.name) {
            if (config.isDebug === mpInstance._Store.SDKConfig.isDevelopmentMode || config.isSandbox === mpInstance._Store.SDKConfig.isDevelopmentMode) {
              newKit = this.returnConfiguredKit(kits[name], config);
              mpInstance._Store.configuredForwarders.push(newKit);
              break;
            }
          }
        }
      };

      // Unlike UI enabled kits, sideloaded kits are always added to active forwarders.

      // TODO: Sideloading kits currently require the use of a register method
      // which requires an object on which to be registered.
      // In the future, when all kits are moved to the mpConfig rather than
      // there being a separate process for MP configured kits and
      // sideloaded kits, this will need to be refactored.
      this.processSideloadedKits = function (mpConfig) {
        try {
          if (Array.isArray(mpConfig.sideloadedKits)) {
            var registeredSideloadedKits = {
              kits: {}
            };
            var unregisteredSideloadedKits = mpConfig.sideloadedKits;
            unregisteredSideloadedKits.forEach(function (unregisteredKit) {
              try {
                // Register each sideloaded kit, which adds a key of the sideloaded kit name
                // and a value of the sideloaded kit constructor.
                unregisteredKit.kitInstance.register(registeredSideloadedKits);
                var kitName = unregisteredKit.kitInstance.name;
                // Then add the kit filters to each registered kit.
                registeredSideloadedKits.kits[kitName].filters = unregisteredKit.filterDictionary;
              } catch (e) {
                console.error('Error registering sideloaded kit ' + unregisteredKit.kitInstance.name);
              }
            });

            // Then configure each registered kit
            for (var registeredKitKey in registeredSideloadedKits.kits) {
              var registeredKit = registeredSideloadedKits.kits[registeredKitKey];
              self.configureSideloadedKit(registeredKit);
            }

            // If Sideloaded Kits are successfully registered,
            // record this in the Store.
            if (!isEmpty(registeredSideloadedKits.kits)) {
              var kitKeys = Object.keys(registeredSideloadedKits.kits);
              mpInstance._Store.sideloadedKitsCount = kitKeys.length;
            }
          }
        } catch (e) {
          mpInstance.Logger.error('Sideloaded Kits not configured propertly. Kits may not be initialized. ' + e);
        }
      };

      // kits can be included via mParticle UI, or via sideloaded kit config API
      this.configureSideloadedKit = function (kitConstructor) {
        mpInstance._Store.configuredForwarders.push(this.returnConfiguredKit(kitConstructor, kitConstructor.filters));
      };
      this.returnConfiguredKit = function (forwarder) {
        var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var newForwarder = new forwarder.constructor();
        newForwarder.id = config.moduleId;

        // TODO: isSandbox, hasSandbox is never used in any kit or in core SDK.
        // isVisible.  Investigate is only used in 1 place. It is always true if
        // it is sent to JS. Investigate further to determine if these can be removed.
        // https://go.mparticle.com/work/SQDSDKS-5156
        newForwarder.isSandbox = config.isDebug || config.isSandbox;
        newForwarder.hasSandbox = config.hasDebugString === 'true';
        newForwarder.isVisible = config.isVisible || true;
        newForwarder.settings = config.settings || {};
        newForwarder.eventNameFilters = config.eventNameFilters || [];
        newForwarder.eventTypeFilters = config.eventTypeFilters || [];
        newForwarder.attributeFilters = config.attributeFilters || [];
        newForwarder.screenNameFilters = config.screenNameFilters || [];
        newForwarder.screenAttributeFilters = config.screenAttributeFilters || [];
        newForwarder.userIdentityFilters = config.userIdentityFilters || [];
        newForwarder.userAttributeFilters = config.userAttributeFilters || [];
        newForwarder.filteringEventAttributeValue = config.filteringEventAttributeValue || {};
        newForwarder.filteringUserAttributeValue = config.filteringUserAttributeValue || {};
        newForwarder.eventSubscriptionId = config.eventSubscriptionId || null;
        newForwarder.filteringConsentRuleValues = config.filteringConsentRuleValues || {};
        newForwarder.excludeAnonymousUser = config.excludeAnonymousUser || false;
        return newForwarder;
      };
      this.configurePixel = function (settings) {
        if (settings.isDebug === mpInstance._Store.SDKConfig.isDevelopmentMode || settings.isProduction !== mpInstance._Store.SDKConfig.isDevelopmentMode) {
          mpInstance._Store.pixelConfigurations.push(settings);
        }
      };
      this.processPixelConfigs = function (config) {
        try {
          if (!isEmpty(config.pixelConfigs)) {
            config.pixelConfigs.forEach(function (pixelConfig) {
              self.configurePixel(pixelConfig);
            });
          }
        } catch (e) {
          mpInstance.Logger.error('Cookie Sync configs not configured propertly. Cookie Sync may not be initialized. ' + e);
        }
      };
      this.sendSingleForwardingStatsToServer = /*#__PURE__*/function () {
        var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(forwardingStatsData) {
          var _mpInstance$Logger;
          var fetchPayload, response, message;
          return _regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) switch (_context.prev = _context.next) {
              case 0:
                // https://go.mparticle.com/work/SQDSDKS-6568
                fetchPayload = {
                  method: 'post',
                  body: JSON.stringify(forwardingStatsData),
                  headers: {
                    Accept: 'text/plain;charset=UTF-8',
                    'Content-Type': 'text/plain;charset=UTF-8'
                  }
                };
                _context.next = 3;
                return _this.forwarderStatsUploader.upload(fetchPayload);
              case 3:
                response = _context.sent;
                // This is a fire and forget, so we only need to log the response based on the code, and not return any response body
                if (response.status === 202) {
                  // https://go.mparticle.com/work/SQDSDKS-6670
                  message = 'Successfully sent forwarding stats to mParticle Servers';
                } else {
                  message = 'Issue with forwarding stats to mParticle Servers, received HTTP Code of ' + response.statusText;
                }
                mpInstance === null || mpInstance === void 0 || (_mpInstance$Logger = mpInstance.Logger) === null || _mpInstance$Logger === void 0 || _mpInstance$Logger.verbose(message);
              case 6:
              case "end":
                return _context.stop();
            }
          }, _callee);
        }));
        return function (_x) {
          return _ref.apply(this, arguments);
        };
      }();
    }

    // TODO: This file is no longer the server model because the web SDK payload
    var MessageType = Types.MessageType;
    var ApplicationTransitionType = Types.ApplicationTransitionType;
    // TODO: Make this a pure function that returns a new object
    function convertCustomFlags(event, dto) {
      var valueArray = [];
      dto.flags = {};
      for (var prop in event.CustomFlags) {
        valueArray = [];
        if (event.CustomFlags.hasOwnProperty(prop)) {
          if (Array.isArray(event.CustomFlags[prop])) {
            event.CustomFlags[prop].forEach(function (customFlagProperty) {
              if (isValidCustomFlagProperty(customFlagProperty)) {
                valueArray.push(customFlagProperty.toString());
              }
            });
          } else if (isValidCustomFlagProperty(event.CustomFlags[prop])) {
            valueArray.push(event.CustomFlags[prop].toString());
          }
          if (valueArray.length) {
            dto.flags[prop] = valueArray;
          }
        }
      }
    }
    function convertProductToV2DTO(product) {
      return {
        id: parseStringOrNumber(product.Sku),
        nm: parseStringOrNumber(product.Name),
        pr: parseNumber(product.Price),
        qt: parseNumber(product.Quantity),
        br: parseStringOrNumber(product.Brand),
        va: parseStringOrNumber(product.Variant),
        ca: parseStringOrNumber(product.Category),
        ps: parseNumber(product.Position),
        cc: parseStringOrNumber(product.CouponCode),
        tpa: parseNumber(product.TotalAmount),
        attrs: product.Attributes
      };
    }
    function convertProductListToV2DTO(productList) {
      if (!productList) {
        return [];
      }
      return productList.map(function (product) {
        return convertProductToV2DTO(product);
      });
    }
    function ServerModel(mpInstance) {
      var self = this;
      // TODO: Can we refactor this to not mutate the event?
      this.appendUserInfo = function (user, event) {
        if (!event) {
          return;
        }
        if (!user) {
          event.MPID = null;
          event.ConsentState = null;
          event.UserAttributes = null;
          event.UserIdentities = null;
          return;
        }
        if (event.MPID && event.MPID === user.getMPID()) {
          return;
        }
        event.MPID = user.getMPID();
        event.ConsentState = user.getConsentState();
        event.UserAttributes = user.getAllUserAttributes();
        var userIdentities = user.getUserIdentities().userIdentities;
        var dtoUserIdentities = {};
        for (var identityKey in userIdentities) {
          var identityType = Types.IdentityType.getIdentityType(identityKey);
          if (identityType !== false) {
            dtoUserIdentities[identityType] = userIdentities[identityKey];
          }
        }
        var validUserIdentities = [];
        if (mpInstance._Helpers.isObject(dtoUserIdentities)) {
          if (Object.keys(dtoUserIdentities).length) {
            for (var key in dtoUserIdentities) {
              var userIdentity = {};
              userIdentity.Identity = dtoUserIdentities[key];
              userIdentity.Type = mpInstance._Helpers.parseNumber(key);
              validUserIdentities.push(userIdentity);
            }
          }
        }
        event.UserIdentities = validUserIdentities;
      };
      this.convertToConsentStateV2DTO = function (state) {
        if (!state) {
          return null;
        }
        var jsonObject = {};
        var gdprConsentState = state.getGDPRConsentState();
        if (gdprConsentState) {
          var gdpr = {};
          jsonObject.gdpr = gdpr;
          for (var purpose in gdprConsentState) {
            if (gdprConsentState.hasOwnProperty(purpose)) {
              var gdprConsent = gdprConsentState[purpose];
              jsonObject.gdpr[purpose] = {};
              if (typeof gdprConsent.Consented === 'boolean') {
                gdpr[purpose].c = gdprConsent.Consented;
              }
              if (typeof gdprConsent.Timestamp === 'number') {
                gdpr[purpose].ts = gdprConsent.Timestamp;
              }
              if (typeof gdprConsent.ConsentDocument === 'string') {
                gdpr[purpose].d = gdprConsent.ConsentDocument;
              }
              if (typeof gdprConsent.Location === 'string') {
                gdpr[purpose].l = gdprConsent.Location;
              }
              if (typeof gdprConsent.HardwareId === 'string') {
                gdpr[purpose].h = gdprConsent.HardwareId;
              }
            }
          }
        }
        var ccpaConsentState = state.getCCPAConsentState();
        if (ccpaConsentState) {
          jsonObject.ccpa = {
            data_sale_opt_out: {
              c: ccpaConsentState.Consented,
              ts: ccpaConsentState.Timestamp,
              d: ccpaConsentState.ConsentDocument,
              l: ccpaConsentState.Location,
              h: ccpaConsentState.HardwareId
            }
          };
        }
        return jsonObject;
      };
      this.createEventObject = function (event, user) {
        var uploadObject = {};
        var eventObject = {};
        //  The `optOut` variable is passed later in this method to the `uploadObject`
        //  so that it can be used to denote whether or not a user has "opted out" of being
        //  tracked. If this is an `optOut` Event, we set `optOut` to the inverse of the SDK's
        // `isEnabled` boolean which is controlled via `MPInstanceManager.setOptOut`.
        var optOut = event.messageType === Types.MessageType.OptOut ? !mpInstance._Store.isEnabled : null;
        // TODO: Why is Webview Bridge Enabled or Opt Out necessary here?
        if (mpInstance._Store.sessionId || event.messageType === Types.MessageType.OptOut || mpInstance._Store.webviewBridgeEnabled) {
          var customFlags = __assign({}, event.customFlags);
          // https://go.mparticle.com/work/SQDSDKS-5053
          if (mpInstance._Helpers.getFeatureFlag && mpInstance._Helpers.getFeatureFlag(Constants.FeatureFlags.CaptureIntegrationSpecificIds)) {
            // Attempt to recapture click IDs in case a third party integration
            // has added or updated  new click IDs since the last event was sent.
            mpInstance._IntegrationCapture.capture();
            var transformedClickIDs = mpInstance._IntegrationCapture.getClickIdsAsCustomFlags();
            customFlags = __assign(__assign({}, transformedClickIDs), customFlags);
          }
          if (event.hasOwnProperty('toEventAPIObject')) {
            eventObject = event.toEventAPIObject();
          } else {
            eventObject = {
              // This is an artifact from v2 events where SessionStart/End and AST event
              //  names are numbers (1, 2, or 10), but going forward with v3, these lifecycle
              //  events do not have names, but are denoted by their `event_type`
              EventName: event.name || event.messageType,
              EventCategory: event.eventType,
              EventAttributes: mpInstance._Helpers.sanitizeAttributes(event.data, event.name),
              SourceMessageId: event.sourceMessageId || mpInstance._Helpers.generateUniqueId(),
              EventDataType: event.messageType,
              CustomFlags: customFlags,
              UserAttributeChanges: event.userAttributeChanges,
              UserIdentityChanges: event.userIdentityChanges
            };
          }
          // TODO: Should we move this side effect outside of this method?
          if (event.messageType !== Types.MessageType.SessionEnd) {
            mpInstance._Store.dateLastEventSent = new Date();
          }
          uploadObject = {
            // FIXME: Deprecate when we get rid of V2
            Store: mpInstance._Store.serverSettings,
            SDKVersion: Constants.sdkVersion,
            SessionId: mpInstance._Store.sessionId,
            SessionStartDate: mpInstance._Store.sessionStartDate ? mpInstance._Store.sessionStartDate.getTime() : 0,
            Debug: mpInstance._Store.SDKConfig.isDevelopmentMode,
            Location: mpInstance._Store.currentPosition,
            OptOut: optOut,
            ExpandedEventCount: 0,
            AppVersion: mpInstance.getAppVersion(),
            AppName: mpInstance.getAppName(),
            Package: mpInstance._Store.SDKConfig["package"],
            ClientGeneratedId: mpInstance._Store.clientId,
            DeviceId: mpInstance._Store.deviceId,
            IntegrationAttributes: mpInstance._Store.integrationAttributes,
            CurrencyCode: mpInstance._Store.currencyCode,
            DataPlan: mpInstance._Store.SDKConfig.dataPlan ? mpInstance._Store.SDKConfig.dataPlan : {}
          };
          if (eventObject.EventDataType === MessageType.AppStateTransition) {
            eventObject.IsFirstRun = mpInstance._Store.isFirstRun;
            eventObject.LaunchReferral = window.location.href || null;
          }
          // FIXME: Remove duplicate occurence
          eventObject.CurrencyCode = mpInstance._Store.currencyCode;
          var currentUser = user || mpInstance.Identity.getCurrentUser();
          self.appendUserInfo(currentUser, eventObject);
          if (event.messageType === Types.MessageType.SessionEnd) {
            eventObject.SessionLength = mpInstance._Store.dateLastEventSent.getTime() - mpInstance._Store.sessionStartDate.getTime();
            eventObject.currentSessionMPIDs = mpInstance._Store.currentSessionMPIDs;
            // Session attributes are assigned on a session level, but only uploaded
            // when a session ends. As there is no way to attach event attributes to
            // a `SessionEnd` event, we are uploading the session level attributes
            // as event level attributes in a `SessionEnd` event.
            eventObject.EventAttributes = mpInstance._Store.sessionAttributes;
            // TODO: We should move this out of here to avoid side effects
            mpInstance._Store.currentSessionMPIDs = [];
            mpInstance._Store.sessionStartDate = null;
          }
          uploadObject.Timestamp = mpInstance._Store.dateLastEventSent.getTime();
          return mpInstance._Helpers.extend({}, eventObject, uploadObject);
        }
        return null;
      };
      this.convertEventToV2DTO = function (event) {
        var dto = {
          n: event.EventName,
          et: event.EventCategory,
          ua: event.UserAttributes,
          ui: event.UserIdentities,
          ia: event.IntegrationAttributes,
          str: event.Store,
          attrs: event.EventAttributes,
          sdk: event.SDKVersion,
          sid: event.SessionId,
          sl: event.SessionLength,
          ssd: event.SessionStartDate,
          dt: event.EventDataType,
          dbg: event.Debug,
          ct: event.Timestamp,
          lc: event.Location,
          o: event.OptOut,
          eec: event.ExpandedEventCount,
          av: event.AppVersion,
          cgid: event.ClientGeneratedId,
          das: event.DeviceId,
          mpid: event.MPID,
          smpids: event.currentSessionMPIDs
        };
        if (event.DataPlan && event.DataPlan.PlanId) {
          dto.dp_id = event.DataPlan.PlanId;
          if (event.DataPlan.PlanVersion) {
            dto.dp_v = event.DataPlan.PlanVersion;
          }
        }
        var consent = self.convertToConsentStateV2DTO(event.ConsentState);
        if (consent) {
          dto.con = consent;
        }
        if (event.EventDataType === MessageType.AppStateTransition) {
          dto.fr = event.IsFirstRun;
          dto.iu = false;
          dto.at = ApplicationTransitionType.AppInit;
          dto.lr = event.LaunchReferral;
          // Nullify Attributes in case AST Was logged manually or
          // via logBaseEvent. AST should not have any attributes
          dto.attrs = null;
        }
        if (event.CustomFlags) {
          convertCustomFlags(event, dto);
        }
        if (event.EventDataType === MessageType.Commerce) {
          dto.cu = event.CurrencyCode;
          // TODO: If Cart is deprecated, we should deprecate this too
          if (event.ShoppingCart) {
            dto.sc = {
              pl: convertProductListToV2DTO(event.ShoppingCart.ProductList)
            };
          }
          if (event.ProductAction) {
            dto.pd = {
              an: event.ProductAction.ProductActionType,
              cs: mpInstance._Helpers.parseNumber(event.ProductAction.CheckoutStep),
              co: event.ProductAction.CheckoutOptions,
              pl: convertProductListToV2DTO(event.ProductAction.ProductList),
              ti: event.ProductAction.TransactionId,
              ta: event.ProductAction.Affiliation,
              tcc: event.ProductAction.CouponCode,
              tr: mpInstance._Helpers.parseNumber(event.ProductAction.TotalAmount),
              ts: mpInstance._Helpers.parseNumber(event.ProductAction.ShippingAmount),
              tt: mpInstance._Helpers.parseNumber(event.ProductAction.TaxAmount)
            };
          } else if (event.PromotionAction) {
            dto.pm = {
              an: event.PromotionAction.PromotionActionType,
              pl: event.PromotionAction.PromotionList.map(function (promotion) {
                return {
                  id: promotion.Id,
                  nm: promotion.Name,
                  cr: promotion.Creative,
                  ps: promotion.Position ? promotion.Position : 0
                };
              })
            };
          } else if (event.ProductImpressions) {
            dto.pi = event.ProductImpressions.map(function (impression) {
              return {
                pil: impression.ProductImpressionList,
                pl: convertProductListToV2DTO(impression.ProductList)
              };
            });
          }
        } else if (event.EventDataType === MessageType.Profile) {
          dto.pet = event.ProfileMessageType;
        }
        return dto;
      };
    }

    function forwardingStatsUploader(mpInstance) {
      this.startForwardingStatsTimer = function () {
        mParticle._forwardingStatsTimer = setInterval(function () {
          prepareAndSendForwardingStatsBatch();
        }, mpInstance._Store.SDKConfig.forwarderStatsTimeout);
      };
      function prepareAndSendForwardingStatsBatch() {
        var forwarderQueue = mpInstance._Forwarders.getForwarderStatsQueue(),
          uploadsTable = mpInstance._Persistence.forwardingStatsBatches.uploadsTable,
          now = Date.now();
        if (forwarderQueue.length) {
          uploadsTable[now] = {
            uploading: false,
            data: forwarderQueue
          };
          mpInstance._Forwarders.setForwarderStatsQueue([]);
        }
        for (var date in uploadsTable) {
          (function (date) {
            if (uploadsTable.hasOwnProperty(date)) {
              if (uploadsTable[date].uploading === false) {
                var xhrCallback = function xhrCallback() {
                  if (xhr.readyState === 4) {
                    if (xhr.status === 200 || xhr.status === 202) {
                      mpInstance.Logger.verbose('Successfully sent  ' + xhr.statusText + ' from server');
                      delete uploadsTable[date];
                    } else if (xhr.status.toString()[0] === '4') {
                      if (xhr.status !== 429) {
                        delete uploadsTable[date];
                      }
                    } else {
                      uploadsTable[date].uploading = false;
                    }
                  }
                };
                var xhr = mpInstance._Helpers.createXHR(xhrCallback);
                var forwardingStatsData = uploadsTable[date].data;
                uploadsTable[date].uploading = true;
                mpInstance._APIClient.sendBatchForwardingStatsToServer(forwardingStatsData, xhr);
              }
            }
          })(date);
        }
      }
    }

    var _a = Constants.IdentityMethods,
      Identify$1 = _a.Identify,
      Modify$2 = _a.Modify,
      Login$1 = _a.Login,
      Logout$1 = _a.Logout;
    var CACHE_HEADER = 'x-mp-max-age';
    var cacheOrClearIdCache = function cacheOrClearIdCache(method, knownIdentities, idCache, identityResponse, parsingCachedResponse) {
      // when parsing a response that has already been cached, simply return instead of attempting another cache
      if (parsingCachedResponse) {
        return;
      }
      // default the expire timestamp to one day in milliseconds unless a header comes back
      var expireTimestamp = getExpireTimestamp(identityResponse === null || identityResponse === void 0 ? void 0 : identityResponse.cacheMaxAge);
      switch (method) {
        case Login$1:
        case Identify$1:
          cacheIdentityRequest(method, knownIdentities, expireTimestamp, idCache, identityResponse);
          break;
        case Modify$2:
        case Logout$1:
          idCache.purge();
          break;
      }
    };
    var cacheIdentityRequest = function cacheIdentityRequest(method, identities, expireTimestamp, idCache, identityResponse) {
      var responseText = identityResponse.responseText,
        status = identityResponse.status;
      var cache = idCache.retrieve() || {};
      var cacheKey = concatenateIdentities(method, identities);
      var hashedKey = generateHash(cacheKey);
      var mpid = responseText.mpid,
        is_logged_in = responseText.is_logged_in;
      var cachedResponseBody = {
        mpid: mpid,
        is_logged_in: is_logged_in
      };
      cache[hashedKey] = {
        responseText: JSON.stringify(cachedResponseBody),
        status: status,
        expireTimestamp: expireTimestamp
      };
      idCache.store(cache);
    };
    // We need to ensure that identities are concatenated in a deterministic way, so
    // we sort the identities based on their enum.
    // we create an array, set the user identity at the index of the user identity type
    var concatenateIdentities = function concatenateIdentities(method, userIdentities) {
      var DEVICE_APPLICATION_STAMP = 'device_application_stamp';
      // set DAS first since it is not an official identity type
      var cacheKey = "".concat(method, ":").concat(DEVICE_APPLICATION_STAMP, "=").concat(userIdentities.device_application_stamp, ";");
      var idLength = Object.keys(userIdentities).length;
      var concatenatedIdentities = '';
      if (idLength) {
        var userIDArray = new Array();
        // create an array where each index is equal to the user identity type
        for (var key in userIdentities) {
          if (key === DEVICE_APPLICATION_STAMP) {
            continue;
          } else {
            userIDArray[Types.IdentityType.getIdentityType(key)] = userIdentities[key];
          }
        }
        concatenatedIdentities = userIDArray.reduce(function (prevValue, currentValue, index) {
          var idName = Types.IdentityType.getIdentityName(index);
          return "".concat(prevValue).concat(idName, "=").concat(currentValue, ";");
        }, cacheKey);
      }
      return concatenatedIdentities;
    };
    var hasValidCachedIdentity = function hasValidCachedIdentity(method, proposedUserIdentities, idCache) {
      // There is an edge case where multiple identity calls are taking place
      // before identify fires, so there may not be a cache.  See what happens when
      // the ? in idCache is removed to the following test
      // "queued events contain login mpid instead of identify mpid when calling
      // login immediately after mParticle initializes"
      var cache = idCache === null || idCache === void 0 ? void 0 : idCache.retrieve();
      // if there is no cache, then there is no valid cached identity
      if (!cache) {
        return false;
      }
      var cacheKey = concatenateIdentities(method, proposedUserIdentities);
      var hashedKey = generateHash(cacheKey);
      // if cache doesn't have the cacheKey, there is no valid cached identity
      if (!cache.hasOwnProperty(hashedKey)) {
        return false;
      }
      // If there is a valid cache key, compare the expireTimestamp to the current time.
      // If the current time is greater than the expireTimestamp, it is not a valid
      // cached identity.
      var expireTimestamp = cache[hashedKey].expireTimestamp;
      if (expireTimestamp < new Date().getTime()) {
        return false;
      } else {
        return true;
      }
    };
    var getCachedIdentity = function getCachedIdentity(method, proposedUserIdentities, idCache) {
      var cacheKey = concatenateIdentities(method, proposedUserIdentities);
      var hashedKey = generateHash(cacheKey);
      var cache = idCache.retrieve();
      var cachedIdentity = cache ? cache[hashedKey] : null;
      return {
        responseText: parseIdentityResponse(cachedIdentity.responseText),
        expireTimestamp: cachedIdentity.expireTimestamp,
        status: cachedIdentity.status
      };
    };
    // https://go.mparticle.com/work/SQDSDKS-6079
    var createKnownIdentities = function createKnownIdentities(identityApiData, deviceId) {
      var identitiesResult = {};
      if (isObject(identityApiData === null || identityApiData === void 0 ? void 0 : identityApiData.userIdentities)) {
        for (var identity in identityApiData.userIdentities) {
          identitiesResult[identity] = identityApiData.userIdentities[identity];
        }
      }
      identitiesResult.device_application_stamp = deviceId;
      return identitiesResult;
    };
    var removeExpiredIdentityCacheDates = function removeExpiredIdentityCacheDates(idCache) {
      var cache = idCache.retrieve() || {};
      var currentTime = new Date().getTime();
      // Iterate over the cache and remove any key/value pairs that are expired
      for (var key in cache) {
        if (cache[key].expireTimestamp < currentTime) {
          delete cache[key];
        }
      }
      idCache.store(cache);
    };
    var tryCacheIdentity = function tryCacheIdentity(knownIdentities, idCache, parseIdentityResponse, mpid, callback, identityApiData, identityMethod) {
      // https://go.mparticle.com/work/SQDSDKS-6095
      var shouldReturnCachedIdentity = hasValidCachedIdentity(identityMethod, knownIdentities, idCache);
      // If Identity is cached, then immediately parse the identity response
      if (shouldReturnCachedIdentity) {
        var cachedIdentity = getCachedIdentity(identityMethod, knownIdentities, idCache);
        parseIdentityResponse(cachedIdentity, mpid, callback, identityApiData, identityMethod, knownIdentities, true);
        return true;
      }
      return false;
    };
    var getExpireTimestamp = function getExpireTimestamp(maxAge) {
      if (maxAge === void 0) {
        maxAge = ONE_DAY_IN_SECONDS;
      }
      return new Date().getTime() + maxAge * MILLIS_IN_ONE_SEC;
    };
    var parseIdentityResponse = function parseIdentityResponse(responseText) {
      return responseText ? JSON.parse(responseText) : {};
    };

    var AudienceManager = /** @class */function () {
      function AudienceManager(userAudienceUrl, apiKey, logger) {
        this.url = '';
        this.logger = logger;
        this.url = "https://".concat(userAudienceUrl).concat(apiKey, "/audience");
        this.userAudienceAPI = window.fetch ? new FetchUploader(this.url) : new XHRUploader(this.url);
      }
      AudienceManager.prototype.sendGetUserAudienceRequest = function (mpid, callback) {
        return __awaiter(this, void 0, void 0, function () {
          var fetchPayload, audienceURLWithMPID, userAudiencePromise, userAudienceMembershipsServerResponse, parsedUserAudienceMemberships, e_1;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                this.logger.verbose('Fetching user audiences from server');
                fetchPayload = {
                  method: 'GET',
                  headers: {
                    Accept: '*/*'
                  }
                };
                audienceURLWithMPID = "".concat(this.url, "?mpid=").concat(mpid);
                _a.label = 1;
              case 1:
                _a.trys.push([1, 6,, 7]);
                return [4 /*yield*/, this.userAudienceAPI.upload(fetchPayload, audienceURLWithMPID)];
              case 2:
                userAudiencePromise = _a.sent();
                if (!(userAudiencePromise.status >= 200 && userAudiencePromise.status < 300)) return [3 /*break*/, 4];
                this.logger.verbose("User Audiences successfully received");
                return [4 /*yield*/, userAudiencePromise.json()];
              case 3:
                userAudienceMembershipsServerResponse = _a.sent();
                parsedUserAudienceMemberships = {
                  currentAudienceMemberships: userAudienceMembershipsServerResponse === null || userAudienceMembershipsServerResponse === void 0 ? void 0 : userAudienceMembershipsServerResponse.audience_memberships
                };
                try {
                  callback(parsedUserAudienceMemberships);
                } catch (e) {
                  throw new Error('Error invoking callback on user audience response.');
                }
                return [3 /*break*/, 5];
              case 4:
                if (userAudiencePromise.status === 401) {
                  throw new Error('`HTTP error status ${userAudiencePromise.status} while retrieving User Audiences - please verify your API key.`');
                } else if (userAudiencePromise.status === 403) {
                  throw new Error('`HTTP error status ${userAudiencePromise.status} while retrieving User Audiences - please verify your workspace is enabled for audiences.`');
                } else {
                  // In case there is an HTTP error we did not anticipate.
                  throw new Error("Uncaught HTTP Error ".concat(userAudiencePromise.status, "."));
                }
              case 5:
                return [3 /*break*/, 7];
              case 6:
                e_1 = _a.sent();
                this.logger.error("Error retrieving audiences. ".concat(e_1));
                return [3 /*break*/, 7];
              case 7:
                return [2 /*return*/];
            }
          });
        });
      };

      return AudienceManager;
    }();

    function hasMPIDAndUserLoginChanged(previousUser, newUser) {
      return !previousUser || newUser.getMPID() !== previousUser.getMPID() || previousUser.isLoggedIn() !== newUser.isLoggedIn();
    }
    // https://go.mparticle.com/work/SQDSDKS-6504
    function hasMPIDChanged(prevUser, identityApiResult) {
      return !prevUser || prevUser.getMPID() && identityApiResult.mpid && identityApiResult.mpid !== prevUser.getMPID();
    }

    var Messages$3 = Constants.Messages,
      HTTPCodes$3 = Constants.HTTPCodes,
      FeatureFlags$1 = Constants.FeatureFlags,
      IdentityMethods = Constants.IdentityMethods;
    var ErrorMessages = Messages$3.ErrorMessages;
    var CacheIdentity = FeatureFlags$1.CacheIdentity;
    var Identify = IdentityMethods.Identify,
      Modify$1 = IdentityMethods.Modify,
      Login = IdentityMethods.Login,
      Logout = IdentityMethods.Logout;
    function Identity(mpInstance) {
      var _mpInstance$_Helpers = mpInstance._Helpers,
        getFeatureFlag = _mpInstance$_Helpers.getFeatureFlag,
        extend = _mpInstance$_Helpers.extend;
      var self = this;
      this.idCache = null;
      this.audienceManager = null;

      // https://go.mparticle.com/work/SQDSDKS-6353
      this.IdentityRequest = {
        preProcessIdentityRequest: function preProcessIdentityRequest(identityApiData, callback, method) {
          mpInstance.Logger.verbose(Messages$3.InformationMessages.StartingLogEvent + ': ' + method);
          var identityValidationResult = mpInstance._Helpers.Validators.validateIdentities(identityApiData, method);
          if (!identityValidationResult.valid) {
            mpInstance.Logger.error('ERROR: ' + identityValidationResult.error);
            return {
              valid: false,
              error: identityValidationResult.error
            };
          }
          if (callback && !mpInstance._Helpers.Validators.isFunction(callback)) {
            var error = 'The optional callback must be a function. You tried entering a(n) ' + _typeof$1(callback);
            mpInstance.Logger.error(error);
            return {
              valid: false,
              error: error
            };
          }
          return {
            valid: true
          };
        },
        createIdentityRequest: function createIdentityRequest(identityApiData, platform, sdkVendor, sdkVersion, deviceId, context, mpid) {
          var APIRequest = {
            client_sdk: {
              platform: platform,
              sdk_vendor: sdkVendor,
              sdk_version: sdkVersion
            },
            context: context,
            environment: mpInstance._Store.SDKConfig.isDevelopmentMode ? 'development' : 'production',
            request_id: mpInstance._Helpers.generateUniqueId(),
            request_timestamp_ms: new Date().getTime(),
            previous_mpid: mpid || null,
            known_identities: createKnownIdentities(identityApiData, deviceId)
          };
          return APIRequest;
        },
        createModifyIdentityRequest: function createModifyIdentityRequest(currentUserIdentities, newUserIdentities, platform, sdkVendor, sdkVersion, context) {
          return {
            client_sdk: {
              platform: platform,
              sdk_vendor: sdkVendor,
              sdk_version: sdkVersion
            },
            context: context,
            environment: mpInstance._Store.SDKConfig.isDevelopmentMode ? 'development' : 'production',
            request_id: mpInstance._Helpers.generateUniqueId(),
            request_timestamp_ms: new Date().getTime(),
            identity_changes: this.createIdentityChanges(currentUserIdentities, newUserIdentities)
          };
        },
        createIdentityChanges: function createIdentityChanges(previousIdentities, newIdentities) {
          var identityChanges = [];
          var key;
          if (newIdentities && isObject(newIdentities) && previousIdentities && isObject(previousIdentities)) {
            for (key in newIdentities) {
              identityChanges.push({
                old_value: previousIdentities[key] || null,
                new_value: newIdentities[key],
                identity_type: key
              });
            }
          }
          return identityChanges;
        },
        // takes 2 UI objects keyed by name, combines them, returns them keyed by type
        combineUserIdentities: function combineUserIdentities(previousUIByName, newUIByName) {
          var combinedUIByType = {};
          var combinedUIByName = extend({}, previousUIByName, newUIByName);
          for (var key in combinedUIByName) {
            var type = Types.IdentityType.getIdentityType(key);
            // this check removes anything that is not whitelisted as an identity type
            if (type !== false && type >= 0) {
              combinedUIByType[Types.IdentityType.getIdentityType(key)] = combinedUIByName[key];
            }
          }
          return combinedUIByType;
        },
        createAliasNetworkRequest: function createAliasNetworkRequest(aliasRequest) {
          return {
            request_id: mpInstance._Helpers.generateUniqueId(),
            request_type: 'alias',
            environment: mpInstance._Store.SDKConfig.isDevelopmentMode ? 'development' : 'production',
            api_key: mpInstance._Store.devToken,
            data: {
              destination_mpid: aliasRequest.destinationMpid,
              source_mpid: aliasRequest.sourceMpid,
              start_unixtime_ms: aliasRequest.startTime,
              end_unixtime_ms: aliasRequest.endTime,
              scope: aliasRequest.scope,
              device_application_stamp: mpInstance._Store.deviceId
            }
          };
        },
        convertAliasToNative: function convertAliasToNative(aliasRequest) {
          return {
            DestinationMpid: aliasRequest.destinationMpid,
            SourceMpid: aliasRequest.sourceMpid,
            StartUnixtimeMs: aliasRequest.startTime,
            EndUnixtimeMs: aliasRequest.endTime
          };
        },
        convertToNative: function convertToNative(identityApiData) {
          var nativeIdentityRequest = [];
          if (identityApiData && identityApiData.userIdentities) {
            for (var key in identityApiData.userIdentities) {
              if (identityApiData.userIdentities.hasOwnProperty(key)) {
                nativeIdentityRequest.push({
                  Type: Types.IdentityType.getIdentityType(key),
                  Identity: identityApiData.userIdentities[key]
                });
              }
            }
            return {
              UserIdentities: nativeIdentityRequest
            };
          }
        }
      };
      /**
       * Invoke these methods on the mParticle.Identity object.
       * Example: mParticle.Identity.getCurrentUser().
       * @class mParticle.Identity
       */
      this.IdentityAPI = {
        HTTPCodes: HTTPCodes$3,
        /**
         * Initiate a logout request to the mParticle server
         * @method identify
         * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
         * @param {Function} [callback] A callback function that is called when the identify request completes
         */
        identify: function identify(identityApiData, callback) {
          // https://go.mparticle.com/work/SQDSDKS-6337
          var mpid,
            currentUser = mpInstance.Identity.getCurrentUser(),
            preProcessResult = mpInstance._Identity.IdentityRequest.preProcessIdentityRequest(identityApiData, callback, Identify);
          if (currentUser) {
            mpid = currentUser.getMPID();
          }
          if (preProcessResult.valid) {
            var identityApiRequest = mpInstance._Identity.IdentityRequest.createIdentityRequest(identityApiData, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, mpInstance._Store.deviceId, mpInstance._Store.context, mpid);
            if (mpInstance._Helpers.getFeatureFlag(Constants.FeatureFlags.CacheIdentity)) {
              var successfullyCachedIdentity = tryCacheIdentity(identityApiRequest.known_identities, self.idCache, self.parseIdentityResponse, mpid, callback, identityApiData, Identify);
              if (successfullyCachedIdentity) {
                return;
              }
            }
            if (mpInstance._Helpers.canLog()) {
              if (mpInstance._Store.webviewBridgeEnabled) {
                mpInstance._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Identify, JSON.stringify(mpInstance._Identity.IdentityRequest.convertToNative(identityApiData)));
                mpInstance._Helpers.invokeCallback(callback, HTTPCodes$3.nativeIdentityRequest, 'Identify request sent to native sdk');
              } else {
                mpInstance._IdentityAPIClient.sendIdentityRequest(identityApiRequest, Identify, callback, identityApiData, self.parseIdentityResponse, mpid, identityApiRequest.known_identities);
              }
            } else {
              mpInstance._Helpers.invokeCallback(callback, HTTPCodes$3.loggingDisabledOrMissingAPIKey, Messages$3.InformationMessages.AbandonLogEvent);
              mpInstance.Logger.verbose(Messages$3.InformationMessages.AbandonLogEvent);
            }
          } else {
            mpInstance._Helpers.invokeCallback(callback, HTTPCodes$3.validationIssue, preProcessResult.error);
            mpInstance.Logger.verbose(preProcessResult);
          }
        },
        /**
         * Initiate a logout request to the mParticle server
         * @method logout
         * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
         * @param {Function} [callback] A callback function that is called when the logout request completes
         */
        logout: function logout(identityApiData, callback) {
          // https://go.mparticle.com/work/SQDSDKS-6337
          var mpid,
            currentUser = mpInstance.Identity.getCurrentUser(),
            preProcessResult = mpInstance._Identity.IdentityRequest.preProcessIdentityRequest(identityApiData, callback, Logout);
          if (currentUser) {
            mpid = currentUser.getMPID();
          }
          if (preProcessResult.valid) {
            var evt,
              identityApiRequest = mpInstance._Identity.IdentityRequest.createIdentityRequest(identityApiData, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, mpInstance._Store.deviceId, mpInstance._Store.context, mpid);
            if (mpInstance._Helpers.canLog()) {
              if (mpInstance._Store.webviewBridgeEnabled) {
                mpInstance._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Logout, JSON.stringify(mpInstance._Identity.IdentityRequest.convertToNative(identityApiData)));
                mpInstance._Helpers.invokeCallback(callback, HTTPCodes$3.nativeIdentityRequest, 'Logout request sent to native sdk');
              } else {
                mpInstance._IdentityAPIClient.sendIdentityRequest(identityApiRequest, Logout, callback, identityApiData, self.parseIdentityResponse, mpid);
                evt = mpInstance._ServerModel.createEventObject({
                  messageType: Types.MessageType.Profile
                });
                evt.ProfileMessageType = Types.ProfileMessageType.Logout;
                if (mpInstance._Store.activeForwarders.length) {
                  mpInstance._Store.activeForwarders.forEach(function (forwarder) {
                    if (forwarder.logOut) {
                      forwarder.logOut(evt);
                    }
                  });
                }
              }
            } else {
              mpInstance._Helpers.invokeCallback(callback, HTTPCodes$3.loggingDisabledOrMissingAPIKey, Messages$3.InformationMessages.AbandonLogEvent);
              mpInstance.Logger.verbose(Messages$3.InformationMessages.AbandonLogEvent);
            }
          } else {
            mpInstance._Helpers.invokeCallback(callback, HTTPCodes$3.validationIssue, preProcessResult.error);
            mpInstance.Logger.verbose(preProcessResult);
          }
        },
        /**
         * Initiate a login request to the mParticle server
         * @method login
         * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
         * @param {Function} [callback] A callback function that is called when the login request completes
         */
        login: function login(identityApiData, callback) {
          // https://go.mparticle.com/work/SQDSDKS-6337
          var mpid,
            currentUser = mpInstance.Identity.getCurrentUser(),
            preProcessResult = mpInstance._Identity.IdentityRequest.preProcessIdentityRequest(identityApiData, callback, Login);
          if (currentUser) {
            mpid = currentUser.getMPID();
          }
          if (preProcessResult.valid) {
            var identityApiRequest = mpInstance._Identity.IdentityRequest.createIdentityRequest(identityApiData, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, mpInstance._Store.deviceId, mpInstance._Store.context, mpid);
            if (mpInstance._Helpers.getFeatureFlag(Constants.FeatureFlags.CacheIdentity)) {
              var successfullyCachedIdentity = tryCacheIdentity(identityApiRequest.known_identities, self.idCache, self.parseIdentityResponse, mpid, callback, identityApiData, Login);
              if (successfullyCachedIdentity) {
                return;
              }
            }
            if (mpInstance._Helpers.canLog()) {
              if (mpInstance._Store.webviewBridgeEnabled) {
                mpInstance._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Login, JSON.stringify(mpInstance._Identity.IdentityRequest.convertToNative(identityApiData)));
                mpInstance._Helpers.invokeCallback(callback, HTTPCodes$3.nativeIdentityRequest, 'Login request sent to native sdk');
              } else {
                mpInstance._IdentityAPIClient.sendIdentityRequest(identityApiRequest, Login, callback, identityApiData, self.parseIdentityResponse, mpid, identityApiRequest.known_identities);
              }
            } else {
              mpInstance._Helpers.invokeCallback(callback, HTTPCodes$3.loggingDisabledOrMissingAPIKey, Messages$3.InformationMessages.AbandonLogEvent);
              mpInstance.Logger.verbose(Messages$3.InformationMessages.AbandonLogEvent);
            }
          } else {
            mpInstance._Helpers.invokeCallback(callback, HTTPCodes$3.validationIssue, preProcessResult.error);
            mpInstance.Logger.verbose(preProcessResult);
          }
        },
        /**
         * Initiate a modify request to the mParticle server
         * @method modify
         * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
         * @param {Function} [callback] A callback function that is called when the modify request completes
         */
        modify: function modify(identityApiData, callback) {
          // https://go.mparticle.com/work/SQDSDKS-6337
          var mpid,
            currentUser = mpInstance.Identity.getCurrentUser(),
            preProcessResult = mpInstance._Identity.IdentityRequest.preProcessIdentityRequest(identityApiData, callback, Modify$1);
          if (currentUser) {
            mpid = currentUser.getMPID();
          }
          var newUserIdentities = identityApiData && identityApiData.userIdentities ? identityApiData.userIdentities : {};
          if (preProcessResult.valid) {
            var identityApiRequest = mpInstance._Identity.IdentityRequest.createModifyIdentityRequest(currentUser ? currentUser.getUserIdentities().userIdentities : {}, newUserIdentities, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, mpInstance._Store.context);
            if (mpInstance._Helpers.canLog()) {
              if (mpInstance._Store.webviewBridgeEnabled) {
                mpInstance._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Modify, JSON.stringify(mpInstance._Identity.IdentityRequest.convertToNative(identityApiData)));
                mpInstance._Helpers.invokeCallback(callback, HTTPCodes$3.nativeIdentityRequest, 'Modify request sent to native sdk');
              } else {
                mpInstance._IdentityAPIClient.sendIdentityRequest(identityApiRequest, Modify$1, callback, identityApiData, self.parseIdentityResponse, mpid, identityApiRequest.known_identities);
              }
            } else {
              mpInstance._Helpers.invokeCallback(callback, HTTPCodes$3.loggingDisabledOrMissingAPIKey, Messages$3.InformationMessages.AbandonLogEvent);
              mpInstance.Logger.verbose(Messages$3.InformationMessages.AbandonLogEvent);
            }
          } else {
            mpInstance._Helpers.invokeCallback(callback, HTTPCodes$3.validationIssue, preProcessResult.error);
            mpInstance.Logger.verbose(preProcessResult);
          }
        },
        /**
         * Returns a user object with methods to interact with the current user
         * @method getCurrentUser
         * @return {Object} the current user object
         */
        getCurrentUser: function getCurrentUser() {
          var mpid;
          if (mpInstance._Store) {
            mpid = mpInstance._Store.mpid;
            if (mpid) {
              mpid = mpInstance._Store.mpid.slice();
              return self.mParticleUser(mpid, mpInstance._Store.isLoggedIn);
            } else if (mpInstance._Store.webviewBridgeEnabled) {
              return self.mParticleUser();
            } else {
              return null;
            }
          } else {
            return null;
          }
        },
        /**
         * Returns a the user object associated with the mpid parameter or 'null' if no such
         * user exists
         * @method getUser
         * @param {String} mpid of the desired user
         * @return {Object} the user for  mpid
         */
        getUser: function getUser(mpid) {
          var persistence = mpInstance._Persistence.getPersistence();
          if (persistence) {
            if (persistence[mpid] && !Constants.SDKv2NonMPIDCookieKeys.hasOwnProperty(mpid)) {
              return self.mParticleUser(mpid);
            } else {
              return null;
            }
          } else {
            return null;
          }
        },
        /**
         * Returns all users, including the current user and all previous users that are stored on the device.
         * @method getUsers
         * @return {Array} array of users
         */
        getUsers: function getUsers() {
          var persistence = mpInstance._Persistence.getPersistence();
          var users = [];
          if (persistence) {
            for (var key in persistence) {
              if (!Constants.SDKv2NonMPIDCookieKeys.hasOwnProperty(key)) {
                users.push(self.mParticleUser(key));
              }
            }
          }
          users.sort(function (a, b) {
            var aLastSeen = a.getLastSeenTime() || 0;
            var bLastSeen = b.getLastSeenTime() || 0;
            if (aLastSeen > bLastSeen) {
              return -1;
            } else {
              return 1;
            }
          });
          return users;
        },
        /**
         * Initiate an alias request to the mParticle server
         * @method aliasUsers
         * @param {Object} aliasRequest  object representing an AliasRequest
         * @param {Function} [callback] A callback function that is called when the aliasUsers request completes
         */
        aliasUsers: function aliasUsers(aliasRequest, callback) {
          var message;
          if (!aliasRequest.destinationMpid || !aliasRequest.sourceMpid) {
            message = Messages$3.ValidationMessages.AliasMissingMpid;
          }
          if (aliasRequest.destinationMpid === aliasRequest.sourceMpid) {
            message = Messages$3.ValidationMessages.AliasNonUniqueMpid;
          }
          if (!aliasRequest.startTime || !aliasRequest.endTime) {
            message = Messages$3.ValidationMessages.AliasMissingTime;
          }
          if (aliasRequest.startTime > aliasRequest.endTime) {
            message = Messages$3.ValidationMessages.AliasStartBeforeEndTime;
          }
          if (message) {
            mpInstance.Logger.warning(message);
            mpInstance._Helpers.invokeAliasCallback(callback, HTTPCodes$3.validationIssue, message);
            return;
          }
          if (mpInstance._Helpers.canLog()) {
            if (mpInstance._Store.webviewBridgeEnabled) {
              mpInstance._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Alias, JSON.stringify(mpInstance._Identity.IdentityRequest.convertAliasToNative(aliasRequest)));
              mpInstance._Helpers.invokeAliasCallback(callback, HTTPCodes$3.nativeIdentityRequest, 'Alias request sent to native sdk');
            } else {
              mpInstance.Logger.verbose(Messages$3.InformationMessages.StartingAliasRequest + ': ' + aliasRequest.sourceMpid + ' -> ' + aliasRequest.destinationMpid);
              var aliasRequestMessage = mpInstance._Identity.IdentityRequest.createAliasNetworkRequest(aliasRequest);
              mpInstance._IdentityAPIClient.sendAliasRequest(aliasRequestMessage, callback);
            }
          } else {
            mpInstance._Helpers.invokeAliasCallback(callback, HTTPCodes$3.loggingDisabledOrMissingAPIKey, Messages$3.InformationMessages.AbandonAliasUsers);
            mpInstance.Logger.verbose(Messages$3.InformationMessages.AbandonAliasUsers);
          }
        },
        /**
         Create a default AliasRequest for 2 MParticleUsers. This will construct the request
        using the sourceUser's firstSeenTime as the startTime, and its lastSeenTime as the endTime.
        
        In the unlikely scenario that the sourceUser does not have a firstSeenTime, which will only
        be the case if they have not been the current user since this functionality was added, the 
        startTime will be populated with the earliest firstSeenTime out of any stored user. Similarly,
        if the sourceUser does not have a lastSeenTime, the endTime will be populated with the current time
        
        There is a limit to how old the startTime can be, represented by the config field 'aliasMaxWindow', in days.
        If the startTime falls before the limit, it will be adjusted to the oldest allowed startTime. 
        In rare cases, where the sourceUser's lastSeenTime also falls outside of the aliasMaxWindow limit, 
        after applying this adjustment it will be impossible to create an aliasRequest passes the aliasUsers() 
        validation that the startTime must be less than the endTime 
        */
        createAliasRequest: function createAliasRequest(sourceUser, destinationUser) {
          try {
            if (!destinationUser || !sourceUser) {
              mpInstance.Logger.error("'destinationUser' and 'sourceUser' must both be present");
              return null;
            }
            var startTime = sourceUser.getFirstSeenTime();
            if (!startTime) {
              mpInstance.Identity.getUsers().forEach(function (user) {
                if (user.getFirstSeenTime() && (!startTime || user.getFirstSeenTime() < startTime)) {
                  startTime = user.getFirstSeenTime();
                }
              });
            }
            var minFirstSeenTimeMs = new Date().getTime() - mpInstance._Store.SDKConfig.aliasMaxWindow * 24 * 60 * 60 * 1000;
            var endTime = sourceUser.getLastSeenTime() || new Date().getTime();
            //if the startTime is greater than $maxAliasWindow ago, adjust the startTime to the earliest allowed
            if (startTime < minFirstSeenTimeMs) {
              startTime = minFirstSeenTimeMs;
              if (endTime < startTime) {
                mpInstance.Logger.warning('Source User has not been seen in the last ' + mpInstance._Store.SDKConfig.maxAliasWindow + ' days, Alias Request will likely fail');
              }
            }
            return {
              destinationMpid: destinationUser.getMPID(),
              sourceMpid: sourceUser.getMPID(),
              startTime: startTime,
              endTime: endTime
            };
          } catch (e) {
            mpInstance.Logger.error('There was a problem with creating an alias request: ' + e);
            return null;
          }
        }
      };

      // https://go.mparticle.com/work/SQDSDKS-6354
      /**
       * Invoke these methods on the mParticle.Identity.getCurrentUser() object.
       * Example: mParticle.Identity.getCurrentUser().getAllUserAttributes()
       * @class mParticle.Identity.getCurrentUser()
       */
      this.mParticleUser = function (mpid, _isLoggedIn) {
        var self = this;
        return {
          /**
           * Get user identities for current user
           * @method getUserIdentities
           * @return {Object} an object with userIdentities as its key
           */
          getUserIdentities: function getUserIdentities() {
            var currentUserIdentities = {};
            var identities = mpInstance._Store.getUserIdentities(mpid);
            for (var identityType in identities) {
              if (identities.hasOwnProperty(identityType)) {
                currentUserIdentities[Types.IdentityType.getIdentityName(mpInstance._Helpers.parseNumber(identityType))] = identities[identityType];
              }
            }
            return {
              userIdentities: currentUserIdentities
            };
          },
          /**
           * Get the MPID of the current user
           * @method getMPID
           * @return {String} the current user MPID as a string
           */
          getMPID: function getMPID() {
            return mpid;
          },
          /**
           * Sets a user tag
           * @method setUserTag
           * @param {String} tagName
           */
          setUserTag: function setUserTag(tagName) {
            if (!mpInstance._Helpers.Validators.isValidKeyValue(tagName)) {
              mpInstance.Logger.error(Messages$3.ErrorMessages.BadKey);
              return;
            }
            this.setUserAttribute(tagName, null);
          },
          /**
           * Removes a user tag
           * @method removeUserTag
           * @param {String} tagName
           */
          removeUserTag: function removeUserTag(tagName) {
            if (!mpInstance._Helpers.Validators.isValidKeyValue(tagName)) {
              mpInstance.Logger.error(Messages$3.ErrorMessages.BadKey);
              return;
            }
            this.removeUserAttribute(tagName);
          },
          /**
           * Sets a user attribute
           * @method setUserAttribute
           * @param {String} key
           * @param {String} value
           */
          // https://go.mparticle.com/work/SQDSDKS-4576
          // https://go.mparticle.com/work/SQDSDKS-6373
          setUserAttribute: function setUserAttribute(key, newValue) {
            mpInstance._SessionManager.resetSessionTimer();
            if (mpInstance._Helpers.canLog()) {
              if (!mpInstance._Helpers.Validators.isValidAttributeValue(newValue)) {
                mpInstance.Logger.error(Messages$3.ErrorMessages.BadAttribute);
                return;
              }
              if (!mpInstance._Helpers.Validators.isValidKeyValue(key)) {
                mpInstance.Logger.error(Messages$3.ErrorMessages.BadKey);
                return;
              }
              if (mpInstance._Store.webviewBridgeEnabled) {
                mpInstance._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetUserAttribute, JSON.stringify({
                  key: key,
                  value: newValue
                }));
              } else {
                var userAttributes = this.getAllUserAttributes();
                var previousUserAttributeValue;
                var isNewAttribute;
                var existingProp = mpInstance._Helpers.findKeyInObject(userAttributes, key);
                if (existingProp) {
                  isNewAttribute = false;
                  previousUserAttributeValue = userAttributes[existingProp];
                  delete userAttributes[existingProp];
                } else {
                  isNewAttribute = true;
                }
                userAttributes[key] = newValue;
                mpInstance._Store.setUserAttributes(mpid, userAttributes);
                self.sendUserAttributeChangeEvent(key, newValue, previousUserAttributeValue, isNewAttribute, false, this);
                mpInstance._Forwarders.initForwarders(self.IdentityAPI.getCurrentUser().getUserIdentities(), mpInstance._APIClient.prepareForwardingStats);
                mpInstance._Forwarders.handleForwarderUserAttributes('setUserAttribute', key, newValue);
              }
            }
          },
          /**
           * Set multiple user attributes
           * @method setUserAttributes
           * @param {Object} user attribute object with keys of the attribute type, and value of the attribute value
           */
          // https://go.mparticle.com/work/SQDSDKS-6373
          setUserAttributes: function setUserAttributes(userAttributes) {
            mpInstance._SessionManager.resetSessionTimer();
            if (isObject(userAttributes)) {
              if (mpInstance._Helpers.canLog()) {
                for (var key in userAttributes) {
                  if (userAttributes.hasOwnProperty(key)) {
                    this.setUserAttribute(key, userAttributes[key]);
                  }
                }
              }
            } else {
              mpInstance.Logger.error('Must pass an object into setUserAttributes. You passed a ' + _typeof$1(userAttributes));
            }
          },
          /**
           * Removes a specific user attribute
           * @method removeUserAttribute
           * @param {String} key
           */
          removeUserAttribute: function removeUserAttribute(key) {
            var cookies, userAttributes;
            mpInstance._SessionManager.resetSessionTimer();
            if (!mpInstance._Helpers.Validators.isValidKeyValue(key)) {
              mpInstance.Logger.error(Messages$3.ErrorMessages.BadKey);
              return;
            }
            if (mpInstance._Store.webviewBridgeEnabled) {
              mpInstance._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.RemoveUserAttribute, JSON.stringify({
                key: key,
                value: null
              }));
            } else {
              cookies = mpInstance._Persistence.getPersistence();
              userAttributes = this.getAllUserAttributes();
              var existingProp = mpInstance._Helpers.findKeyInObject(userAttributes, key);
              if (existingProp) {
                key = existingProp;
              }
              var deletedUAKeyCopy = userAttributes[key] ? userAttributes[key].toString() : null;
              delete userAttributes[key];
              if (cookies && cookies[mpid]) {
                cookies[mpid].ua = userAttributes;
                mpInstance._Persistence.savePersistence(cookies, mpid);
              }
              self.sendUserAttributeChangeEvent(key, null, deletedUAKeyCopy, false, true, this);
              mpInstance._Forwarders.initForwarders(self.IdentityAPI.getCurrentUser().getUserIdentities(), mpInstance._APIClient.prepareForwardingStats);
              mpInstance._Forwarders.handleForwarderUserAttributes('removeUserAttribute', key, null);
            }
          },
          /**
           * Sets a list of user attributes
           * @method setUserAttributeList
           * @param {String} key
           * @param {Array} value an array of values
           */
          // https://go.mparticle.com/work/SQDSDKS-6373
          setUserAttributeList: function setUserAttributeList(key, newValue) {
            mpInstance._SessionManager.resetSessionTimer();
            if (!mpInstance._Helpers.Validators.isValidKeyValue(key)) {
              mpInstance.Logger.error(Messages$3.ErrorMessages.BadKey);
              return;
            }
            if (!Array.isArray(newValue)) {
              mpInstance.Logger.error('The value you passed in to setUserAttributeList must be an array. You passed in a ' + (typeof value === "undefined" ? "undefined" : _typeof$1(value)));
              return;
            }
            var arrayCopy = newValue.slice();
            if (mpInstance._Store.webviewBridgeEnabled) {
              mpInstance._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetUserAttributeList, JSON.stringify({
                key: key,
                value: arrayCopy
              }));
            } else {
              var userAttributes = this.getAllUserAttributes();
              var previousUserAttributeValue;
              var isNewAttribute;
              var userAttributeChange;
              var existingProp = mpInstance._Helpers.findKeyInObject(userAttributes, key);
              if (existingProp) {
                isNewAttribute = false;
                previousUserAttributeValue = userAttributes[existingProp];
                delete userAttributes[existingProp];
              } else {
                isNewAttribute = true;
              }
              userAttributes[key] = arrayCopy;
              mpInstance._Store.setUserAttributes(mpid, userAttributes);

              // If the new attributeList length is different than the previous, then there is a change event.
              // Loop through new attributes list, see if they are all in the same index as previous user attributes list
              // If there are any changes, break, and immediately send a userAttributeChangeEvent with full array as a value
              if (!previousUserAttributeValue || !Array.isArray(previousUserAttributeValue)) {
                userAttributeChange = true;
              } else if (newValue.length !== previousUserAttributeValue.length) {
                userAttributeChange = true;
              } else {
                for (var i = 0; i < newValue.length; i++) {
                  if (previousUserAttributeValue[i] !== newValue[i]) {
                    userAttributeChange = true;
                    break;
                  }
                }
              }
              if (userAttributeChange) {
                self.sendUserAttributeChangeEvent(key, newValue, previousUserAttributeValue, isNewAttribute, false, this);
              }
              mpInstance._Forwarders.initForwarders(self.IdentityAPI.getCurrentUser().getUserIdentities(), mpInstance._APIClient.prepareForwardingStats);
              mpInstance._Forwarders.handleForwarderUserAttributes('setUserAttribute', key, arrayCopy);
            }
          },
          /**
           * Removes all user attributes
           * @method removeAllUserAttributes
           */
          removeAllUserAttributes: function removeAllUserAttributes() {
            var userAttributes;
            mpInstance._SessionManager.resetSessionTimer();
            if (mpInstance._Store.webviewBridgeEnabled) {
              mpInstance._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.RemoveAllUserAttributes);
            } else {
              userAttributes = this.getAllUserAttributes();
              mpInstance._Forwarders.initForwarders(self.IdentityAPI.getCurrentUser().getUserIdentities(), mpInstance._APIClient.prepareForwardingStats);
              if (userAttributes) {
                for (var prop in userAttributes) {
                  if (userAttributes.hasOwnProperty(prop)) {
                    mpInstance._Forwarders.handleForwarderUserAttributes('removeUserAttribute', prop, null);
                  }
                  this.removeUserAttribute(prop);
                }
              }
            }
          },
          /**
           * Returns all user attribute keys that have values that are arrays
           * @method getUserAttributesLists
           * @return {Object} an object of only keys with array values. Example: { attr1: [1, 2, 3], attr2: ['a', 'b', 'c'] }
           */
          getUserAttributesLists: function getUserAttributesLists() {
            var userAttributes,
              userAttributesLists = {};
            userAttributes = this.getAllUserAttributes();
            for (var key in userAttributes) {
              if (userAttributes.hasOwnProperty(key) && Array.isArray(userAttributes[key])) {
                userAttributesLists[key] = userAttributes[key].slice();
              }
            }
            return userAttributesLists;
          },
          /**
           * Returns all user attributes
           * @method getAllUserAttributes
           * @return {Object} an object of all user attributes. Example: { attr1: 'value1', attr2: ['a', 'b', 'c'] }
           */
          getAllUserAttributes: function getAllUserAttributes() {
            var getUserAttributes = mpInstance._Store.getUserAttributes;
            var userAttributesCopy = {};
            var userAttributes = getUserAttributes(mpid);
            if (userAttributes) {
              for (var prop in userAttributes) {
                if (userAttributes.hasOwnProperty(prop)) {
                  if (Array.isArray(userAttributes[prop])) {
                    userAttributesCopy[prop] = userAttributes[prop].slice();
                  } else {
                    userAttributesCopy[prop] = userAttributes[prop];
                  }
                }
              }
            }
            return userAttributesCopy;
          },
          /**
           * Returns the cart object for the current user
           * @method getCart
           * @return a cart object
           */
          getCart: function getCart() {
            mpInstance.Logger.warning('Deprecated function Identity.getCurrentUser().getCart() will be removed in future releases');
            return self.mParticleUserCart(mpid);
          },
          /**
           * Returns the Consent State stored locally for this user.
           * @method getConsentState
           * @return a ConsentState object
           */
          getConsentState: function getConsentState() {
            return mpInstance._Store.getConsentState(mpid);
          },
          /**
           * Sets the Consent State stored locally for this user.
           * @method setConsentState
           * @param {Object} consent state
           */
          setConsentState: function setConsentState(state) {
            mpInstance._Store.setConsentState(mpid, state);
            mpInstance._Forwarders.initForwarders(this.getUserIdentities().userIdentities, mpInstance._APIClient.prepareForwardingStats);
            mpInstance._CookieSyncManager.attemptCookieSync(null, this.getMPID());
          },
          isLoggedIn: function isLoggedIn() {
            return _isLoggedIn;
          },
          getLastSeenTime: function getLastSeenTime() {
            return mpInstance._Persistence.getLastSeenTime(mpid);
          },
          getFirstSeenTime: function getFirstSeenTime() {
            return mpInstance._Persistence.getFirstSeenTime(mpid);
          },
          /**
           * Get user audiences
           * @method getuserAudiences
           * @param {Function} [callback] A callback function that is invoked when the user audience request completes
           */
          // https://go.mparticle.com/work/SQDSDKS-6436
          getUserAudiences: function getUserAudiences(callback) {
            // user audience API is feature flagged
            if (!mpInstance._Helpers.getFeatureFlag(FeatureFlags$1.AudienceAPI)) {
              mpInstance.Logger.error(ErrorMessages.AudienceAPINotEnabled);
              return;
            }
            if (self.audienceManager === null) {
              self.audienceManager = new AudienceManager(mpInstance._Store.SDKConfig.userAudienceUrl, mpInstance._Store.devToken, mpInstance.Logger, mpid);
            }
            self.audienceManager.sendGetUserAudienceRequest(mpid, callback);
          }
        };
      };

      /**
       * Invoke these methods on the mParticle.Identity.getCurrentUser().getCart() object.
       * Example: mParticle.Identity.getCurrentUser().getCart().add(...);
       * @class mParticle.Identity.getCurrentUser().getCart()
       * @deprecated
       */
      this.mParticleUserCart = function (mpid) {
        return {
          /**
           * Adds a cart product to the user cart
           * @method add
           * @param {Object} product the product
           * @param {Boolean} [logEvent] a boolean to log adding of the cart object. If blank, no logging occurs.
           * @deprecated
           */
          add: function add(product, logEvent) {
            mpInstance.Logger.warning('Deprecated function Identity.getCurrentUser().getCart().add() will be removed in future releases');
            var allProducts, userProducts, arrayCopy;
            arrayCopy = Array.isArray(product) ? product.slice() : [product];
            arrayCopy.forEach(function (product) {
              product.Attributes = mpInstance._Helpers.sanitizeAttributes(product.Attributes);
            });
            if (mpInstance._Store.webviewBridgeEnabled) {
              mpInstance._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.AddToCart, JSON.stringify(arrayCopy));
            } else {
              mpInstance._SessionManager.resetSessionTimer();
              userProducts = mpInstance._Persistence.getUserProductsFromLS(mpid);
              userProducts = userProducts.concat(arrayCopy);
              if (logEvent === true) {
                mpInstance._Events.logProductActionEvent(Types.ProductActionType.AddToCart, arrayCopy);
              }
              var productsForMemory = {};
              productsForMemory[mpid] = {
                cp: userProducts
              };
              if (userProducts.length > mpInstance._Store.SDKConfig.maxProducts) {
                mpInstance.Logger.verbose('The cart contains ' + userProducts.length + ' items. Only ' + mpInstance._Store.SDKConfig.maxProducts + ' can currently be saved in cookies.');
                userProducts = userProducts.slice(-mpInstance._Store.SDKConfig.maxProducts);
              }
              allProducts = mpInstance._Persistence.getAllUserProductsFromLS();
              allProducts[mpid].cp = userProducts;
              mpInstance._Persistence.setCartProducts(allProducts);
            }
          },
          /**
           * Removes a cart product from the current user cart
           * @method remove
           * @param {Object} product the product
           * @param {Boolean} [logEvent] a boolean to log adding of the cart object. If blank, no logging occurs.
           * @deprecated
           */
          remove: function remove(product, logEvent) {
            mpInstance.Logger.warning('Deprecated function Identity.getCurrentUser().getCart().remove() will be removed in future releases');
            var allProducts,
              userProducts,
              cartIndex = -1,
              cartItem = null;
            if (mpInstance._Store.webviewBridgeEnabled) {
              mpInstance._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.RemoveFromCart, JSON.stringify(product));
            } else {
              mpInstance._SessionManager.resetSessionTimer();
              userProducts = mpInstance._Persistence.getUserProductsFromLS(mpid);
              if (userProducts) {
                userProducts.forEach(function (cartProduct, i) {
                  if (cartProduct.Sku === product.Sku) {
                    cartIndex = i;
                    cartItem = cartProduct;
                  }
                });
                if (cartIndex > -1) {
                  userProducts.splice(cartIndex, 1);
                  if (logEvent === true) {
                    mpInstance._Events.logProductActionEvent(Types.ProductActionType.RemoveFromCart, cartItem);
                  }
                }
              }
              var productsForMemory = {};
              productsForMemory[mpid] = {
                cp: userProducts
              };
              allProducts = mpInstance._Persistence.getAllUserProductsFromLS();
              allProducts[mpid].cp = userProducts;
              mpInstance._Persistence.setCartProducts(allProducts);
            }
          },
          /**
           * Clears the user's cart
           * @method clear
           * @deprecated
           */
          clear: function clear() {
            mpInstance.Logger.warning('Deprecated function Identity.getCurrentUser().getCart().clear() will be removed in future releases');
            var allProducts;
            if (mpInstance._Store.webviewBridgeEnabled) {
              mpInstance._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.ClearCart);
            } else {
              mpInstance._SessionManager.resetSessionTimer();
              allProducts = mpInstance._Persistence.getAllUserProductsFromLS();
              if (allProducts && allProducts[mpid] && allProducts[mpid].cp) {
                allProducts[mpid].cp = [];
                allProducts[mpid].cp = [];
                mpInstance._Persistence.setCartProducts(allProducts);
              }
            }
          },
          /**
           * Returns all cart products
           * @method getCartProducts
           * @return {Array} array of cart products
           * @deprecated
           */
          getCartProducts: function getCartProducts() {
            mpInstance.Logger.warning('Deprecated function Identity.getCurrentUser().getCart().getCartProducts() will be removed in future releases');
            return mpInstance._Persistence.getCartProducts(mpid);
          }
        };
      };

      // https://go.mparticle.com/work/SQDSDKS-6355
      this.parseIdentityResponse = function (identityResponse, previousMPID, callback, identityApiData, method, knownIdentities, parsingCachedResponse) {
        var prevUser = mpInstance.Identity.getUser(previousMPID);
        var prevUserMPID = prevUser ? prevUser.getMPID() : null;
        var previousUIByName = prevUser ? prevUser.getUserIdentities().userIdentities : {};
        var mpidIsNotInCookies;
        var identityApiResult;
        var newUser;
        var newIdentitiesByType = {};
        mpInstance._Store.identityCallInFlight = false;
        try {
          var _identityResponse$res, _identityApiResult, _mpInstance$_APIClien;
          mpInstance.Logger.verbose('Parsing "' + method + '" identity response from server');
          identityApiResult = (_identityResponse$res = identityResponse.responseText) !== null && _identityResponse$res !== void 0 ? _identityResponse$res : null;
          mpInstance._Store.isLoggedIn = ((_identityApiResult = identityApiResult) === null || _identityApiResult === void 0 ? void 0 : _identityApiResult.is_logged_in) || false;

          // https://go.mparticle.com/work/SQDSDKS-6504
          // set currentUser
          if (hasMPIDChanged(prevUser, identityApiResult)) {
            mpInstance._Store.mpid = identityApiResult.mpid;
            if (prevUser) {
              // https://go.mparticle.com/work/SQDSDKS-6329
              mpInstance._Persistence.setLastSeenTime(previousMPID);
            }
            mpidIsNotInCookies = !mpInstance._Persistence.getFirstSeenTime(identityApiResult.mpid);

            // https://go.mparticle.com/work/SQDSDKS-6329
            mpInstance._Persistence.setFirstSeenTime(identityApiResult.mpid);
          }
          if (identityResponse.status === HTTP_OK) {
            if (getFeatureFlag(CacheIdentity)) {
              cacheOrClearIdCache(method, knownIdentities, self.idCache, identityResponse, parsingCachedResponse);
            }
            var incomingUser = self.IdentityAPI.getUser(identityApiResult.mpid);
            var incomingUIByName = incomingUser ? incomingUser.getUserIdentities().userIdentities : {};
            if (method === Modify$1) {
              newIdentitiesByType = mpInstance._Identity.IdentityRequest.combineUserIdentities(previousUIByName, identityApiData.userIdentities);
              mpInstance._Store.setUserIdentities(previousMPID, newIdentitiesByType);
            } else {
              // https://go.mparticle.com/work/SQDSDKS-6356
              //this covers an edge case where, users stored before "firstSeenTime" was introduced
              //will not have a value for "fst" until the current MPID changes, and in some cases,
              //the current MPID will never change
              if (method === Identify && prevUser && identityApiResult.mpid === prevUserMPID) {
                // https://go.mparticle.com/work/SQDSDKS-6329
                mpInstance._Persistence.setFirstSeenTime(identityApiResult.mpid);
              }
              mpInstance._Store.addMpidToSessionHistory(identityApiResult.mpid, previousMPID);
              mpInstance._CookieSyncManager.attemptCookieSync(previousMPID, identityApiResult.mpid, mpidIsNotInCookies);
              mpInstance._Persistence.swapCurrentUser(previousMPID, identityApiResult.mpid, mpInstance._Store.currentSessionMPIDs);
              if (identityApiData && !isEmpty(identityApiData.userIdentities)) {
                newIdentitiesByType = self.IdentityRequest.combineUserIdentities(incomingUIByName, identityApiData.userIdentities);
              }

              // https://go.mparticle.com/work/SQDSDKS-6041
              mpInstance._Store.setUserIdentities(identityApiResult.mpid, newIdentitiesByType);
              mpInstance._Persistence.update();
              mpInstance._Store.syncPersistenceData();
              mpInstance._Persistence.findPrevCookiesBasedOnUI(identityApiData);

              // https://go.mparticle.com/work/SQDSDKS-6357
              mpInstance._Store.context = identityApiResult.context || mpInstance._Store.context;
            }
            newUser = mpInstance.Identity.getCurrentUser();

            // https://go.mparticle.com/work/SQDSDKS-6359
            tryOnUserAlias(prevUser, newUser, identityApiData, mpInstance.Logger);
            var persistence = mpInstance._Persistence.getPersistence();
            if (newUser) {
              mpInstance._Persistence.storeDataInMemory(persistence, newUser.getMPID());
              self.reinitForwardersOnUserChange(prevUser, newUser);
              self.setForwarderCallbacks(newUser, method);
            }
            var newIdentitiesByName = getNewIdentitiesByName(newIdentitiesByType);
            var uiByName = method === Modify$1 ? previousUIByName : incomingUIByName;

            // https://go.mparticle.com/work/SQDSDKS-6501
            self.sendUserIdentityChangeEvent(newIdentitiesByName, method, identityApiResult.mpid, uiByName);
          }
          if (callback) {
            var callbackCode = identityResponse.status === 0 ? HTTPCodes$3.noHttpCoverage : identityResponse.status;
            mpInstance._Helpers.invokeCallback(callback, callbackCode, identityApiResult || null, newUser);
          } else if (identityApiResult && !isEmpty(identityApiResult.errors)) {
            // https://go.mparticle.com/work/SQDSDKS-6500
            mpInstance.Logger.error('Received HTTP response code of ' + identityResponse.status + ' - ' + identityApiResult.errors[0].message);
          }
          mpInstance.Logger.verbose('Successfully parsed Identity Response');

          // https://go.mparticle.com/work/SQDSDKS-6654
          (_mpInstance$_APIClien = mpInstance._APIClient) === null || _mpInstance$_APIClien === void 0 || _mpInstance$_APIClien.processQueuedEvents();
        } catch (e) {
          if (callback) {
            mpInstance._Helpers.invokeCallback(callback, identityResponse.status, identityApiResult || null);
          }
          mpInstance.Logger.error('Error parsing JSON response from Identity server: ' + e);
        }
      };

      // send a user identity change request on identify, login, logout, modify when any values change.
      // compare what identities exist vs what is previously was for the specific user if they were in memory before.
      // if it's the first time the user is logging in, send a user identity change request with
      this.sendUserIdentityChangeEvent = function (newUserIdentities, method, mpid, prevUserIdentities) {
        if (!mpid) {
          // https://go.mparticle.com/work/SQDSDKS-6501
          if (method !== Modify$1) {
            return;
          }
        }

        // https://go.mparticle.com/work/SQDSDKS-6354
        var currentUserInMemory = this.IdentityAPI.getUser(mpid);
        for (var identityType in newUserIdentities) {
          // Verifies a change actually happened
          if (prevUserIdentities[identityType] !== newUserIdentities[identityType]) {
            var _mpInstance$_APIClien2;
            // If a new identity type was introduced when the identity changes
            // we need to notify the server so that the user profile is updated in
            // the mParticle UI.
            var isNewUserIdentityType = !prevUserIdentities[identityType];
            var userIdentityChangeEvent = self.createUserIdentityChange(identityType, newUserIdentities[identityType], prevUserIdentities[identityType], isNewUserIdentityType, currentUserInMemory);
            (_mpInstance$_APIClien2 = mpInstance._APIClient) === null || _mpInstance$_APIClien2 === void 0 || _mpInstance$_APIClien2.sendEventToServer(userIdentityChangeEvent);
          }
        }
      };
      this.createUserIdentityChange = function (identityType, newIdentity, oldIdentity, isIdentityTypeNewToBatch, userInMemory) {
        var userIdentityChangeEvent;

        // https://go.mparticle.com/work/SQDSDKS-6439
        userIdentityChangeEvent = mpInstance._ServerModel.createEventObject({
          messageType: Types.MessageType.UserIdentityChange,
          userIdentityChanges: {
            New: {
              IdentityType: identityType,
              Identity: newIdentity,
              CreatedThisBatch: isIdentityTypeNewToBatch
            },
            Old: {
              IdentityType: identityType,
              Identity: oldIdentity,
              CreatedThisBatch: false
            }
          },
          userInMemory: userInMemory
        });
        return userIdentityChangeEvent;
      };
      this.sendUserAttributeChangeEvent = function (attributeKey, newUserAttributeValue, previousUserAttributeValue, isNewAttribute, deleted, user) {
        var userAttributeChangeEvent = self.createUserAttributeChange(attributeKey, newUserAttributeValue, previousUserAttributeValue, isNewAttribute, deleted, user);
        if (userAttributeChangeEvent) {
          var _mpInstance$_APIClien3;
          (_mpInstance$_APIClien3 = mpInstance._APIClient) === null || _mpInstance$_APIClien3 === void 0 || _mpInstance$_APIClien3.sendEventToServer(userAttributeChangeEvent);
        }
      };
      this.createUserAttributeChange = function (key, newValue, previousUserAttributeValue, isNewAttribute, deleted, user) {
        if (typeof previousUserAttributeValue === 'undefined') {
          previousUserAttributeValue = null;
        }
        var userAttributeChangeEvent;
        if (newValue !== previousUserAttributeValue) {
          // https://go.mparticle.com/work/SQDSDKS-6439
          userAttributeChangeEvent = mpInstance._ServerModel.createEventObject({
            messageType: Types.MessageType.UserAttributeChange,
            userAttributeChanges: {
              UserAttributeName: key,
              New: newValue,
              Old: previousUserAttributeValue,
              Deleted: deleted,
              IsNewAttribute: isNewAttribute
            }
          }, user);
        }
        return userAttributeChangeEvent;
      };
      this.reinitForwardersOnUserChange = function (prevUser, newUser) {
        if (hasMPIDAndUserLoginChanged(prevUser, newUser)) {
          var _mpInstance$_Forwarde;
          (_mpInstance$_Forwarde = mpInstance._Forwarders) === null || _mpInstance$_Forwarde === void 0 || _mpInstance$_Forwarde.initForwarders(newUser.getUserIdentities().userIdentities, mpInstance._APIClient.prepareForwardingStats);
        }
      };
      this.setForwarderCallbacks = function (user, method) {
        var _mpInstance$_Forwarde2, _mpInstance$_Forwarde3, _mpInstance$_Forwarde4;
        // https://go.mparticle.com/work/SQDSDKS-6036
        (_mpInstance$_Forwarde2 = mpInstance._Forwarders) === null || _mpInstance$_Forwarde2 === void 0 || _mpInstance$_Forwarde2.setForwarderUserIdentities(user.getUserIdentities().userIdentities);
        (_mpInstance$_Forwarde3 = mpInstance._Forwarders) === null || _mpInstance$_Forwarde3 === void 0 || _mpInstance$_Forwarde3.setForwarderOnIdentityComplete(user, method);
        (_mpInstance$_Forwarde4 = mpInstance._Forwarders) === null || _mpInstance$_Forwarde4 === void 0 || _mpInstance$_Forwarde4.setForwarderOnUserIdentified(user);
      };
    }

    // https://go.mparticle.com/work/SQDSDKS-6359
    function tryOnUserAlias(previousUser, newUser, identityApiData, logger) {
      if (identityApiData && identityApiData.onUserAlias && isFunction(identityApiData.onUserAlias)) {
        try {
          logger.warning(generateDeprecationMessage('onUserAlias'));
          identityApiData.onUserAlias(previousUser, newUser);
        } catch (e) {
          logger.error('There was an error with your onUserAlias function - ' + e);
        }
      }
    }

    var CCPAPurpose = Constants.CCPAPurpose;
    function Consent(mpInstance) {
      var self = this;
      // this function is called when consent is required to
      // determine if a cookie sync should happen, or a
      // forwarder should be initialized
      this.isEnabledForUserConsent = function (consentRules, user) {
        if (!consentRules || !consentRules.values || !consentRules.values.length) {
          return true;
        }
        if (!user) {
          return false;
        }
        var purposeHashes = {};
        var consentState = user.getConsentState();
        var purposeHash;
        if (consentState) {
          // the server hashes consent purposes in the following way:
          // GDPR - '1' + purpose name
          // CCPA - '2data_sale_opt_out' (there is only 1 purpose of data_sale_opt_out for CCPA)
          var GDPRConsentHashPrefix = '1';
          var CCPAHashPrefix = '2';
          var gdprConsentState = consentState.getGDPRConsentState();
          if (gdprConsentState) {
            for (var purpose in gdprConsentState) {
              if (gdprConsentState.hasOwnProperty(purpose)) {
                purposeHash = KitFilterHelper.hashConsentPurposeConditionalForwarding(GDPRConsentHashPrefix, purpose);
                purposeHashes[purposeHash] = gdprConsentState[purpose].Consented;
              }
            }
          }
          var CCPAConsentState = consentState.getCCPAConsentState();
          if (CCPAConsentState) {
            purposeHash = KitFilterHelper.hashConsentPurposeConditionalForwarding(CCPAHashPrefix, CCPAPurpose);
            purposeHashes[purposeHash] = CCPAConsentState.Consented;
          }
        }
        var isMatch = consentRules.values.some(function (consentRule) {
          var consentPurposeHash = consentRule.consentPurpose;
          var hasConsented = consentRule.hasConsented;
          if (purposeHashes.hasOwnProperty(consentPurposeHash)) {
            return purposeHashes[consentPurposeHash] === hasConsented;
          }
          return false;
        });
        return consentRules.includeOnMatch === isMatch;
      };
      this.createPrivacyConsent = function (consented, timestamp, consentDocument, location, hardwareId) {
        if (typeof consented !== 'boolean') {
          mpInstance.Logger.error('Consented boolean is required when constructing a Consent object.');
          return null;
        }
        if (timestamp && isNaN(timestamp)) {
          mpInstance.Logger.error('Timestamp must be a valid number when constructing a Consent object.');
          return null;
        }
        if (consentDocument && typeof consentDocument !== 'string') {
          mpInstance.Logger.error('Document must be a valid string when constructing a Consent object.');
          return null;
        }
        if (location && typeof location !== 'string') {
          mpInstance.Logger.error('Location must be a valid string when constructing a Consent object.');
          return null;
        }
        if (hardwareId && typeof hardwareId !== 'string') {
          mpInstance.Logger.error('Hardware ID must be a valid string when constructing a Consent object.');
          return null;
        }
        return {
          Consented: consented,
          Timestamp: timestamp || Date.now(),
          ConsentDocument: consentDocument,
          Location: location,
          HardwareId: hardwareId
        };
      };
      this.ConsentSerialization = {
        toMinifiedJsonObject: function toMinifiedJsonObject(state) {
          var _a;
          var jsonObject = {};
          if (state) {
            var gdprConsentState = state.getGDPRConsentState();
            if (gdprConsentState) {
              jsonObject.gdpr = {};
              for (var purpose in gdprConsentState) {
                if (gdprConsentState.hasOwnProperty(purpose)) {
                  var gdprConsent = gdprConsentState[purpose];
                  jsonObject.gdpr[purpose] = {};
                  if (typeof gdprConsent.Consented === 'boolean') {
                    jsonObject.gdpr[purpose].c = gdprConsent.Consented;
                  }
                  if (typeof gdprConsent.Timestamp === 'number') {
                    jsonObject.gdpr[purpose].ts = gdprConsent.Timestamp;
                  }
                  if (typeof gdprConsent.ConsentDocument === 'string') {
                    jsonObject.gdpr[purpose].d = gdprConsent.ConsentDocument;
                  }
                  if (typeof gdprConsent.Location === 'string') {
                    jsonObject.gdpr[purpose].l = gdprConsent.Location;
                  }
                  if (typeof gdprConsent.HardwareId === 'string') {
                    jsonObject.gdpr[purpose].h = gdprConsent.HardwareId;
                  }
                }
              }
            }
            var ccpaConsentState = state.getCCPAConsentState();
            if (ccpaConsentState) {
              jsonObject.ccpa = (_a = {}, _a[CCPAPurpose] = {}, _a);
              if (typeof ccpaConsentState.Consented === 'boolean') {
                jsonObject.ccpa[CCPAPurpose].c = ccpaConsentState.Consented;
              }
              if (typeof ccpaConsentState.Timestamp === 'number') {
                jsonObject.ccpa[CCPAPurpose].ts = ccpaConsentState.Timestamp;
              }
              if (typeof ccpaConsentState.ConsentDocument === 'string') {
                jsonObject.ccpa[CCPAPurpose].d = ccpaConsentState.ConsentDocument;
              }
              if (typeof ccpaConsentState.Location === 'string') {
                jsonObject.ccpa[CCPAPurpose].l = ccpaConsentState.Location;
              }
              if (typeof ccpaConsentState.HardwareId === 'string') {
                jsonObject.ccpa[CCPAPurpose].h = ccpaConsentState.HardwareId;
              }
            }
          }
          return jsonObject;
        },
        fromMinifiedJsonObject: function fromMinifiedJsonObject(json) {
          var state = self.createConsentState();
          if (json.gdpr) {
            for (var purpose in json.gdpr) {
              if (json.gdpr.hasOwnProperty(purpose)) {
                var gdprConsent = self.createPrivacyConsent(json.gdpr[purpose].c, json.gdpr[purpose].ts, json.gdpr[purpose].d, json.gdpr[purpose].l, json.gdpr[purpose].h);
                state.addGDPRConsentState(purpose, gdprConsent);
              }
            }
          }
          if (json.ccpa) {
            if (json.ccpa.hasOwnProperty(CCPAPurpose)) {
              var ccpaConsent = self.createPrivacyConsent(json.ccpa[CCPAPurpose].c, json.ccpa[CCPAPurpose].ts, json.ccpa[CCPAPurpose].d, json.ccpa[CCPAPurpose].l, json.ccpa[CCPAPurpose].h);
              state.setCCPAConsentState(ccpaConsent);
            }
          }
          return state;
        }
      };
      // TODO: Refactor this method into a constructor
      this.createConsentState = function (consentState) {
        var gdpr = {};
        var ccpa = {};
        if (consentState) {
          var consentStateCopy = self.createConsentState();
          consentStateCopy.setGDPRConsentState(consentState.getGDPRConsentState());
          consentStateCopy.setCCPAConsentState(consentState.getCCPAConsentState());
          // TODO: Remove casting once `removeCCPAState` is removed;
          return consentStateCopy;
        }
        function canonicalizeForDeduplication(purpose) {
          if (typeof purpose !== 'string') {
            return null;
          }
          var trimmedPurpose = purpose.trim();
          if (!trimmedPurpose.length) {
            return null;
          }
          return trimmedPurpose.toLowerCase();
        }
        /**
         * Invoke these methods on a consent state object.
         * <p>
         * Usage: const consent = mParticle.Consent.createConsentState()
         * <br>
         * consent.setGDPRCoonsentState()
         *
         * @class Consent
         */
        /**
         * Add a GDPR Consent State to the consent state object
         *
         * @method addGDPRConsentState
         * @param purpose [String] Data processing purpose that describes the type of processing done on the data subject’s data
         * @param gdprConsent [Object] A GDPR consent object created via mParticle.Consent.createGDPRConsent(...)
         */
        function addGDPRConsentState(purpose, gdprConsent) {
          var normalizedPurpose = canonicalizeForDeduplication(purpose);
          if (!normalizedPurpose) {
            mpInstance.Logger.error('Purpose must be a string.');
            return this;
          }
          if (!isObject(gdprConsent)) {
            mpInstance.Logger.error('Invoked with a bad or empty consent object.');
            return this;
          }
          var gdprConsentCopy = self.createPrivacyConsent(gdprConsent.Consented, gdprConsent.Timestamp, gdprConsent.ConsentDocument, gdprConsent.Location, gdprConsent.HardwareId);
          if (gdprConsentCopy) {
            gdpr[normalizedPurpose] = gdprConsentCopy;
          }
          return this;
        }
        function setGDPRConsentState(gdprConsentState) {
          if (!gdprConsentState) {
            gdpr = {};
          } else if (isObject(gdprConsentState)) {
            gdpr = {};
            for (var purpose in gdprConsentState) {
              if (gdprConsentState.hasOwnProperty(purpose)) {
                this.addGDPRConsentState(purpose, gdprConsentState[purpose]);
              }
            }
          }
          return this;
        }
        /**
         * Remove a GDPR Consent State to the consent state object
         *
         * @method removeGDPRConsentState
         * @param purpose [String] Data processing purpose that describes the type of processing done on the data subject’s data
         */
        function removeGDPRConsentState(purpose) {
          var normalizedPurpose = canonicalizeForDeduplication(purpose);
          if (!normalizedPurpose) {
            return this;
          }
          delete gdpr[normalizedPurpose];
          return this;
        }
        /**
         * Gets the GDPR Consent State
         *
         * @method getGDPRConsentState
         * @return {Object} A GDPR Consent State
         */
        function getGDPRConsentState() {
          return Object.assign({}, gdpr);
        }
        /**
         * Sets a CCPA Consent state (has a single purpose of 'data_sale_opt_out')
         *
         * @method setCCPAConsentState
         * @param {Object} ccpaConsent CCPA Consent State
         */
        function setCCPAConsentState(ccpaConsent) {
          if (!isObject(ccpaConsent)) {
            mpInstance.Logger.error('Invoked with a bad or empty CCPA consent object.');
            return this;
          }
          var ccpaConsentCopy = self.createPrivacyConsent(ccpaConsent.Consented, ccpaConsent.Timestamp, ccpaConsent.ConsentDocument, ccpaConsent.Location, ccpaConsent.HardwareId);
          if (ccpaConsentCopy) {
            ccpa[CCPAPurpose] = ccpaConsentCopy;
          }
          return this;
        }
        /**
         * Gets the CCPA Consent State
         *
         * @method getCCPAConsentStatensent
         * @return {Object} A CCPA Consent State
         */
        function getCCPAConsentState() {
          return ccpa[CCPAPurpose];
        }
        /**
         * Removes CCPA from the consent state object
         *
         * @method removeCCPAConsentState
         */
        function removeCCPAConsentState() {
          delete ccpa[CCPAPurpose];
          return this;
        }
        // TODO: Can we remove this? It is deprecated.
        function removeCCPAState() {
          mpInstance.Logger.warning('removeCCPAState is deprecated and will be removed in a future release; use removeCCPAConsentState instead');
          // @ts-ignore
          return removeCCPAConsentState();
        }
        return {
          setGDPRConsentState: setGDPRConsentState,
          addGDPRConsentState: addGDPRConsentState,
          setCCPAConsentState: setCCPAConsentState,
          getCCPAConsentState: getCCPAConsentState,
          getGDPRConsentState: getGDPRConsentState,
          removeGDPRConsentState: removeGDPRConsentState,
          removeCCPAState: removeCCPAState,
          removeCCPAConsentState: removeCCPAConsentState
        };
      };
    }

    /*
        TODO: Including this as a workaround because attempting to import it from
        @mparticle/data-planning-models directly creates a build error.
     */
    var DataPlanMatchType = {
      ScreenView: "screen_view",
      CustomEvent: "custom_event",
      Commerce: "commerce",
      UserAttributes: "user_attributes",
      UserIdentities: "user_identities",
      ProductAction: "product_action",
      PromotionAction: "promotion_action",
      ProductImpression: "product_impression"
    };
    /*
        inspiration from https://github.com/mParticle/data-planning-node/blob/master/src/data_planning/data_plan_event_validator.ts
        but modified to only include commerce events, custom events, screen views, and removes validation

        The purpose of the KitBlocker class is to parse a data plan and determine what events, event/user/product attributes, and user identities should be blocked from downstream forwarders.

        KitBlocker is instantiated with a data plan on mParticle initialization. KitBlocker.kitBlockingEnabled is false if no data plan is passed.
        It parses the data plan by creating a `dataPlanMatchLookups` object in the following manner:
            1. For all events and user attributes/identities, it generates a `matchKey` in the shape of `typeOfEvent:eventType:nameOfEvent`
                a. The matchKeys' value will return `true` if additionalProperties for the custom attributes/identities is `true`, otherwise it will return an object of planned attribute/identities
            2. For commerce events, after step 1 and 1a, a second `matchKey` is included that appends `Products`. This is used to determine productAttributes blocked
        
        When an event is logged in mParticle, it is sent to our server and then calls `KitBlocker.createBlockedEvent` before passing the event to each forwarder.
        If the event is blocked, it will not send to the forwarder. If the event is not blocked, event/user/product attributes and user identities will be removed from the returned event if blocked.
    */
    var KitBlocker = /** @class */function () {
      function KitBlocker(dataPlan, mpInstance) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        this.dataPlanMatchLookups = {};
        this.blockEvents = false;
        this.blockEventAttributes = false;
        this.blockUserAttributes = false;
        this.blockUserIdentities = false;
        this.kitBlockingEnabled = false;
        // if data plan is not requested, the data plan is {document: null}
        if (dataPlan && !dataPlan.document) {
          this.kitBlockingEnabled = false;
          return;
        }
        this.kitBlockingEnabled = true;
        this.mpInstance = mpInstance;
        this.blockEvents = (_c = (_b = (_a = dataPlan === null || dataPlan === void 0 ? void 0 : dataPlan.document) === null || _a === void 0 ? void 0 : _a.dtpn) === null || _b === void 0 ? void 0 : _b.blok) === null || _c === void 0 ? void 0 : _c.ev;
        this.blockEventAttributes = (_f = (_e = (_d = dataPlan === null || dataPlan === void 0 ? void 0 : dataPlan.document) === null || _d === void 0 ? void 0 : _d.dtpn) === null || _e === void 0 ? void 0 : _e.blok) === null || _f === void 0 ? void 0 : _f.ea;
        this.blockUserAttributes = (_j = (_h = (_g = dataPlan === null || dataPlan === void 0 ? void 0 : dataPlan.document) === null || _g === void 0 ? void 0 : _g.dtpn) === null || _h === void 0 ? void 0 : _h.blok) === null || _j === void 0 ? void 0 : _j.ua;
        this.blockUserIdentities = (_m = (_l = (_k = dataPlan === null || dataPlan === void 0 ? void 0 : dataPlan.document) === null || _k === void 0 ? void 0 : _k.dtpn) === null || _l === void 0 ? void 0 : _l.blok) === null || _m === void 0 ? void 0 : _m.id;
        var versionDocument = (_q = (_p = (_o = dataPlan === null || dataPlan === void 0 ? void 0 : dataPlan.document) === null || _o === void 0 ? void 0 : _o.dtpn) === null || _p === void 0 ? void 0 : _p.vers) === null || _q === void 0 ? void 0 : _q.version_document;
        var dataPoints = versionDocument === null || versionDocument === void 0 ? void 0 : versionDocument.data_points;
        if (versionDocument) {
          try {
            if ((dataPoints === null || dataPoints === void 0 ? void 0 : dataPoints.length) > 0) {
              dataPoints.forEach(function (point) {
                return _this.addToMatchLookups(point);
              });
            }
          } catch (e) {
            this.mpInstance.Logger.error('There was an issue with the data plan: ' + e);
          }
        }
      }
      KitBlocker.prototype.addToMatchLookups = function (point) {
        var _a, _b, _c;
        if (!point.match || !point.validator) {
          this.mpInstance.Logger.warning("Data Plan Point is not valid' + ".concat(point));
          return;
        }
        // match keys for non product custom attribute related data points
        var matchKey = this.generateMatchKey(point.match);
        var properties = this.getPlannedProperties(point.match.type, point.validator);
        this.dataPlanMatchLookups[matchKey] = properties;
        // match keys for product custom attribute related data points
        if (((_a = point === null || point === void 0 ? void 0 : point.match) === null || _a === void 0 ? void 0 : _a.type) === DataPlanMatchType.ProductImpression || ((_b = point === null || point === void 0 ? void 0 : point.match) === null || _b === void 0 ? void 0 : _b.type) === DataPlanMatchType.ProductAction || ((_c = point === null || point === void 0 ? void 0 : point.match) === null || _c === void 0 ? void 0 : _c.type) === DataPlanMatchType.PromotionAction) {
          matchKey = this.generateProductAttributeMatchKey(point.match);
          properties = this.getProductProperties(point.match.type, point.validator);
          this.dataPlanMatchLookups[matchKey] = properties;
        }
      };
      KitBlocker.prototype.generateMatchKey = function (match) {
        var criteria = match.criteria || '';
        switch (match.type) {
          case DataPlanMatchType.CustomEvent:
            var customEventCriteria = criteria;
            return [DataPlanMatchType.CustomEvent, customEventCriteria.custom_event_type, customEventCriteria.event_name].join(':');
          case DataPlanMatchType.ScreenView:
            var screenViewCriteria = criteria;
            return [DataPlanMatchType.ScreenView, '', screenViewCriteria.screen_name].join(':');
          case DataPlanMatchType.ProductAction:
            var productActionMatch = criteria;
            return [match.type, productActionMatch.action].join(':');
          case DataPlanMatchType.PromotionAction:
            var promoActionMatch = criteria;
            return [match.type, promoActionMatch.action].join(':');
          case DataPlanMatchType.ProductImpression:
            var productImpressionActionMatch = criteria;
            return [match.type, productImpressionActionMatch.action].join(':');
          case DataPlanMatchType.UserIdentities:
          case DataPlanMatchType.UserAttributes:
            return [match.type].join(':');
          default:
            return null;
        }
      };
      KitBlocker.prototype.generateProductAttributeMatchKey = function (match) {
        var criteria = match.criteria || '';
        switch (match.type) {
          case DataPlanMatchType.ProductAction:
            var productActionMatch = criteria;
            return [match.type, productActionMatch.action, 'ProductAttributes'].join(':');
          case DataPlanMatchType.PromotionAction:
            var promoActionMatch = criteria;
            return [match.type, promoActionMatch.action, 'ProductAttributes'].join(':');
          case DataPlanMatchType.ProductImpression:
            return [match.type, 'ProductAttributes'].join(':');
          default:
            return null;
        }
      };
      KitBlocker.prototype.getPlannedProperties = function (type, validator) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        var customAttributes;
        var userAdditionalProperties;
        switch (type) {
          case DataPlanMatchType.CustomEvent:
          case DataPlanMatchType.ScreenView:
          case DataPlanMatchType.ProductAction:
          case DataPlanMatchType.PromotionAction:
          case DataPlanMatchType.ProductImpression:
            customAttributes = (_d = (_c = (_b = (_a = validator === null || validator === void 0 ? void 0 : validator.definition) === null || _a === void 0 ? void 0 : _a.properties) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.properties) === null || _d === void 0 ? void 0 : _d.custom_attributes;
            if (customAttributes) {
              if (customAttributes.additionalProperties === true || customAttributes.additionalProperties === undefined) {
                return true;
              } else {
                var properties = {};
                for (var _i = 0, _j = Object.keys(customAttributes.properties); _i < _j.length; _i++) {
                  var property = _j[_i];
                  properties[property] = true;
                }
                return properties;
              }
            } else {
              if (((_g = (_f = (_e = validator === null || validator === void 0 ? void 0 : validator.definition) === null || _e === void 0 ? void 0 : _e.properties) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.additionalProperties) === false) {
                return {};
              } else {
                return true;
              }
            }
          case DataPlanMatchType.UserAttributes:
          case DataPlanMatchType.UserIdentities:
            userAdditionalProperties = (_h = validator === null || validator === void 0 ? void 0 : validator.definition) === null || _h === void 0 ? void 0 : _h.additionalProperties;
            if (userAdditionalProperties === true || userAdditionalProperties === undefined) {
              return true;
            } else {
              var properties = {};
              var userProperties = validator.definition.properties;
              for (var _k = 0, _l = Object.keys(userProperties); _k < _l.length; _k++) {
                var property = _l[_k];
                properties[property] = true;
              }
              return properties;
            }
          default:
            return null;
        }
      };
      KitBlocker.prototype.getProductProperties = function (type, validator) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
        var productCustomAttributes;
        switch (type) {
          case DataPlanMatchType.ProductImpression:
            productCustomAttributes = (_k = (_j = (_h = (_g = (_f = (_e = (_d = (_c = (_b = (_a = validator === null || validator === void 0 ? void 0 : validator.definition) === null || _a === void 0 ? void 0 : _a.properties) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.properties) === null || _d === void 0 ? void 0 : _d.product_impressions) === null || _e === void 0 ? void 0 : _e.items) === null || _f === void 0 ? void 0 : _f.properties) === null || _g === void 0 ? void 0 : _g.products) === null || _h === void 0 ? void 0 : _h.items) === null || _j === void 0 ? void 0 : _j.properties) === null || _k === void 0 ? void 0 : _k.custom_attributes;
            //product item attributes
            if ((productCustomAttributes === null || productCustomAttributes === void 0 ? void 0 : productCustomAttributes.additionalProperties) === false) {
              var properties = {};
              for (var _i = 0, _v = Object.keys(productCustomAttributes === null || productCustomAttributes === void 0 ? void 0 : productCustomAttributes.properties); _i < _v.length; _i++) {
                var property = _v[_i];
                properties[property] = true;
              }
              return properties;
            }
            return true;
          case DataPlanMatchType.ProductAction:
          case DataPlanMatchType.PromotionAction:
            productCustomAttributes = (_u = (_t = (_s = (_r = (_q = (_p = (_o = (_m = (_l = validator === null || validator === void 0 ? void 0 : validator.definition) === null || _l === void 0 ? void 0 : _l.properties) === null || _m === void 0 ? void 0 : _m.data) === null || _o === void 0 ? void 0 : _o.properties) === null || _p === void 0 ? void 0 : _p.product_action) === null || _q === void 0 ? void 0 : _q.properties) === null || _r === void 0 ? void 0 : _r.products) === null || _s === void 0 ? void 0 : _s.items) === null || _t === void 0 ? void 0 : _t.properties) === null || _u === void 0 ? void 0 : _u.custom_attributes;
            //product item attributes
            if (productCustomAttributes) {
              if (productCustomAttributes.additionalProperties === false) {
                var properties = {};
                for (var _w = 0, _x = Object.keys(productCustomAttributes === null || productCustomAttributes === void 0 ? void 0 : productCustomAttributes.properties); _w < _x.length; _w++) {
                  var property = _x[_w];
                  properties[property] = true;
                }
                return properties;
              }
            }
            return true;
          default:
            return null;
        }
      };
      KitBlocker.prototype.getMatchKey = function (eventToMatch) {
        switch (eventToMatch.event_type) {
          case dist.EventTypeEnum.screenView:
            var screenViewEvent = eventToMatch;
            if (screenViewEvent.data) {
              return ['screen_view', '', screenViewEvent.data.screen_name].join(':');
            }
            return null;
          case dist.EventTypeEnum.commerceEvent:
            var commerceEvent = eventToMatch;
            var matchKey = [];
            if (commerceEvent && commerceEvent.data) {
              var _a = commerceEvent.data,
                product_action = _a.product_action,
                product_impressions = _a.product_impressions,
                promotion_action = _a.promotion_action;
              if (product_action) {
                matchKey.push(DataPlanMatchType.ProductAction);
                matchKey.push(product_action.action);
              } else if (promotion_action) {
                matchKey.push(DataPlanMatchType.PromotionAction);
                matchKey.push(promotion_action.action);
              } else if (product_impressions) {
                matchKey.push(DataPlanMatchType.ProductImpression);
              }
            }
            return matchKey.join(':');
          case dist.EventTypeEnum.customEvent:
            var customEvent = eventToMatch;
            if (customEvent.data) {
              return ['custom_event', customEvent.data.custom_event_type, customEvent.data.event_name].join(':');
            }
            return null;
          default:
            return null;
        }
      };
      KitBlocker.prototype.getProductAttributeMatchKey = function (eventToMatch) {
        switch (eventToMatch.event_type) {
          case dist.EventTypeEnum.commerceEvent:
            var commerceEvent = eventToMatch;
            var matchKey = [];
            var _a = commerceEvent.data,
              product_action = _a.product_action,
              product_impressions = _a.product_impressions,
              promotion_action = _a.promotion_action;
            if (product_action) {
              matchKey.push(DataPlanMatchType.ProductAction);
              matchKey.push(product_action.action);
              matchKey.push('ProductAttributes');
            } else if (promotion_action) {
              matchKey.push(DataPlanMatchType.PromotionAction);
              matchKey.push(promotion_action.action);
              matchKey.push('ProductAttributes');
            } else if (product_impressions) {
              matchKey.push(DataPlanMatchType.ProductImpression);
              matchKey.push('ProductAttributes');
            }
            return matchKey.join(':');
          default:
            return null;
        }
      };
      KitBlocker.prototype.createBlockedEvent = function (event) {
        /*
            return a transformed event based on event/event attributes,
            then product attributes if applicable, then user attributes,
            then the user identities
        */
        try {
          if (event) {
            event = this.transformEventAndEventAttributes(event);
          }
          if (event && event.EventDataType === Types.MessageType.Commerce) {
            event = this.transformProductAttributes(event);
          }
          if (event) {
            event = this.transformUserAttributes(event);
            event = this.transformUserIdentities(event);
          }
          return event;
        } catch (e) {
          return event;
        }
      };
      KitBlocker.prototype.transformEventAndEventAttributes = function (event) {
        var clonedEvent = __assign({}, event);
        var baseEvent = convertEvent(clonedEvent);
        var matchKey = this.getMatchKey(baseEvent);
        var matchedEvent = this.dataPlanMatchLookups[matchKey];
        if (this.blockEvents) {
          /*
              If the event is not planned, it doesn't exist in dataPlanMatchLookups
              and should be blocked (return null to not send anything to forwarders)
          */
          if (!matchedEvent) {
            return null;
          }
        }
        if (this.blockEventAttributes) {
          /*
              matchedEvent is set to `true` if additionalProperties is `true`
              otherwise, delete attributes that exist on event.EventAttributes
              that aren't on
          */
          if (matchedEvent === true) {
            return clonedEvent;
          }
          if (matchedEvent) {
            for (var _i = 0, _a = Object.keys(clonedEvent.EventAttributes); _i < _a.length; _i++) {
              var key = _a[_i];
              if (!matchedEvent[key]) {
                delete clonedEvent.EventAttributes[key];
              }
            }
            return clonedEvent;
          } else {
            return clonedEvent;
          }
        }
        return clonedEvent;
      };
      KitBlocker.prototype.transformProductAttributes = function (event) {
        var _a;
        var clonedEvent = __assign({}, event);
        var baseEvent = convertEvent(clonedEvent);
        var matchKey = this.getProductAttributeMatchKey(baseEvent);
        var matchedEvent = this.dataPlanMatchLookups[matchKey];
        function removeAttribute(matchedEvent, productList) {
          productList.forEach(function (product) {
            for (var _i = 0, _a = Object.keys(product.Attributes); _i < _a.length; _i++) {
              var productKey = _a[_i];
              if (!matchedEvent[productKey]) {
                delete product.Attributes[productKey];
              }
            }
          });
        }
        if (this.blockEvents) {
          /*
              If the event is not planned, it doesn't exist in dataPlanMatchLookups
              and should be blocked (return null to not send anything to forwarders)
          */
          if (!matchedEvent) {
            return null;
          }
        }
        if (this.blockEventAttributes) {
          /*
              matchedEvent is set to `true` if additionalProperties is `true`
              otherwise, delete attributes that exist on event.EventAttributes
              that aren't on
          */
          if (matchedEvent === true) {
            return clonedEvent;
          }
          if (matchedEvent) {
            switch (event.EventCategory) {
              case Types.CommerceEventType.ProductImpression:
                clonedEvent.ProductImpressions.forEach(function (impression) {
                  removeAttribute(matchedEvent, impression === null || impression === void 0 ? void 0 : impression.ProductList);
                });
                break;
              case Types.CommerceEventType.ProductPurchase:
                removeAttribute(matchedEvent, (_a = clonedEvent.ProductAction) === null || _a === void 0 ? void 0 : _a.ProductList);
                break;
              default:
                this.mpInstance.Logger.warning('Product Not Supported ');
            }
            return clonedEvent;
          } else {
            return clonedEvent;
          }
        }
        return clonedEvent;
      };
      KitBlocker.prototype.transformUserAttributes = function (event) {
        var clonedEvent = __assign({}, event);
        if (this.blockUserAttributes) {
          /*
              If the user attribute is not found in the matchedAttributes
              then remove it from event.UserAttributes as it is blocked
          */
          var matchedAttributes = this.dataPlanMatchLookups['user_attributes'];
          if (this.mpInstance._Helpers.isObject(matchedAttributes)) {
            for (var _i = 0, _a = Object.keys(clonedEvent.UserAttributes); _i < _a.length; _i++) {
              var ua = _a[_i];
              if (!matchedAttributes[ua]) {
                delete clonedEvent.UserAttributes[ua];
              }
            }
          }
        }
        return clonedEvent;
      };
      KitBlocker.prototype.isAttributeKeyBlocked = function (key) {
        /* used when an attribute is added to the user */
        if (!this.blockUserAttributes) {
          return false;
        }
        if (this.blockUserAttributes) {
          var matchedAttributes = this.dataPlanMatchLookups['user_attributes'];
          if (matchedAttributes === true) {
            return false;
          }
          if (!matchedAttributes[key]) {
            return true;
          }
        }
        return false;
      };
      KitBlocker.prototype.isIdentityBlocked = function (key) {
        /* used when an attribute is added to the user */
        if (!this.blockUserIdentities) {
          return false;
        }
        if (this.blockUserIdentities) {
          var matchedIdentities = this.dataPlanMatchLookups['user_identities'];
          if (matchedIdentities === true) {
            return false;
          }
          if (!matchedIdentities[key]) {
            return true;
          }
        } else {
          return false;
        }
        return false;
      };
      KitBlocker.prototype.transformUserIdentities = function (event) {
        var _this = this;
        var _a;
        /*
            If the user identity is not found in matchedIdentities
            then remove it from event.UserIdentities as it is blocked.
            event.UserIdentities is of type [{Identity: 'id1', Type: 7}, ...]
            and so to compare properly in matchedIdentities, each Type needs
            to be converted to an identityName
        */
        var clonedEvent = __assign({}, event);
        if (this.blockUserIdentities) {
          var matchedIdentities_1 = this.dataPlanMatchLookups['user_identities'];
          if (this.mpInstance._Helpers.isObject(matchedIdentities_1)) {
            if ((_a = clonedEvent === null || clonedEvent === void 0 ? void 0 : clonedEvent.UserIdentities) === null || _a === void 0 ? void 0 : _a.length) {
              clonedEvent.UserIdentities.forEach(function (uiByType, i) {
                var identityName = Types.IdentityType.getIdentityName(_this.mpInstance._Helpers.parseNumber(uiByType.Type));
                if (!matchedIdentities_1[identityName]) {
                  clonedEvent.UserIdentities.splice(i, 1);
                }
              });
            }
          }
        }
        return clonedEvent;
      };
      return KitBlocker;
    }();

    var buildUrl = function buildUrl(configUrl, apiKey, dataPlanConfig, isDevelopmentMode) {
      var url = configUrl + apiKey + '/config';
      var env = isDevelopmentMode ? '1' : '0';
      var queryParams = ["env=".concat(env)];
      var _a = dataPlanConfig || {},
        planId = _a.planId,
        planVersion = _a.planVersion;
      if (planId) {
        queryParams.push("plan_id=".concat(planId));
      }
      if (planVersion) {
        queryParams.push("plan_version=".concat(planVersion));
      }
      return "".concat(url, "?").concat(queryParams.join('&'));
    };
    function ConfigAPIClient(apiKey, config, mpInstance) {
      var _this = this;
      var baseUrl = 'https://' + mpInstance._Store.SDKConfig.configUrl;
      var isDevelopmentMode = config.isDevelopmentMode;
      var dataPlan = config.dataPlan;
      var uploadUrl = buildUrl(baseUrl, apiKey, dataPlan, isDevelopmentMode);
      var uploader = window.fetch ? new FetchUploader(uploadUrl) : new XHRUploader(uploadUrl);
      this.getSDKConfiguration = function () {
        return __awaiter(_this, void 0, void 0, function () {
          var configResponse, fetchPayload, response, xhrResponse;
          var _a, _b, _c;
          return __generator(this, function (_d) {
            switch (_d.label) {
              case 0:
                fetchPayload = {
                  method: 'get',
                  headers: {
                    Accept: 'text/plain;charset=UTF-8',
                    'Content-Type': 'text/plain;charset=UTF-8'
                  },
                  body: null
                };
                _d.label = 1;
              case 1:
                _d.trys.push([1, 6,, 7]);
                return [4 /*yield*/, uploader.upload(fetchPayload)];
              case 2:
                response = _d.sent();
                if (!(response.status === 200)) return [3 /*break*/, 5];
                (_a = mpInstance === null || mpInstance === void 0 ? void 0 : mpInstance.Logger) === null || _a === void 0 ? void 0 : _a.verbose('Successfully received configuration from server');
                if (!response.json) return [3 /*break*/, 4];
                return [4 /*yield*/, response.json()];
              case 3:
                configResponse = _d.sent();
                return [2 /*return*/, configResponse];
              case 4:
                xhrResponse = response;
                configResponse = JSON.parse(xhrResponse.responseText);
                return [2 /*return*/, configResponse];
              case 5:
                (_b = mpInstance === null || mpInstance === void 0 ? void 0 : mpInstance.Logger) === null || _b === void 0 ? void 0 : _b.verbose('Issue with receiving configuration from server, received HTTP Code of ' + response.statusText);
                return [3 /*break*/, 7];
              case 6:
                _d.sent();
                (_c = mpInstance === null || mpInstance === void 0 ? void 0 : mpInstance.Logger) === null || _c === void 0 ? void 0 : _c.error('Error getting forwarder configuration from mParticle servers.');
                return [3 /*break*/, 7];
              case 7:
                // Returns the original config object if we cannot retrieve the remote config
                return [2 /*return*/, config];
            }
          });
        });
      };
    }

    var HTTPCodes$2 = Constants.HTTPCodes,
      Messages$2 = Constants.Messages;
    function sendAliasRequest(mpInstance, aliasRequest, aliasCallback) {
      return __awaiter(this, void 0, void 0, function () {
        var _a, verbose, error, invokeAliasCallback, aliasUrl, apiKey, uploadUrl, uploader, uploadPayload, response, message, aliasResponseBody, xhrResponse, errorMessage, e_2, err;
        return __generator(this, function (_b) {
          switch (_b.label) {
            case 0:
              _a = mpInstance.Logger, verbose = _a.verbose, error = _a.error;
              invokeAliasCallback = mpInstance._Helpers.invokeAliasCallback;
              aliasUrl = mpInstance._Store.SDKConfig.aliasUrl;
              apiKey = mpInstance._Store.devToken;
              verbose(Messages$2.InformationMessages.SendAliasHttp);
              uploadUrl = "https://".concat(aliasUrl).concat(apiKey, "/Alias");
              uploader = window.fetch ? new FetchUploader(uploadUrl) : new XHRUploader(uploadUrl);
              uploadPayload = {
                method: 'post',
                headers: {
                  Accept: 'text/plain;charset=UTF-8',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(aliasRequest)
              };
              _b.label = 1;
            case 1:
              _b.trys.push([1, 9,, 10]);
              return [4 /*yield*/, uploader.upload(uploadPayload)];
            case 2:
              response = _b.sent();
              message = void 0;
              aliasResponseBody = void 0;
              if (!response.json) return [3 /*break*/, 7];
              _b.label = 3;
            case 3:
              _b.trys.push([3, 5,, 6]);
              return [4 /*yield*/, response.json()];
            case 4:
              aliasResponseBody = _b.sent();
              return [3 /*break*/, 6];
            case 5:
              _b.sent();
              verbose('The request has no response body');
              return [3 /*break*/, 6];
            case 6:
              return [3 /*break*/, 8];
            case 7:
              xhrResponse = response;
              aliasResponseBody = xhrResponse.responseText ? JSON.parse(xhrResponse.responseText) : '';
              _b.label = 8;
            case 8:
              errorMessage = void 0;
              switch (response.status) {
                case HTTP_OK:
                case HTTP_ACCEPTED:
                  // https://go.mparticle.com/work/SQDSDKS-6670
                  message = 'Successfully sent forwarding stats to mParticle Servers';
                  break;
                default:
                  // 400 has an error message, but 403 doesn't
                  if (aliasResponseBody === null || aliasResponseBody === void 0 ? void 0 : aliasResponseBody.message) {
                    errorMessage = aliasResponseBody.message;
                  }
                  message = 'Issue with sending Alias Request to mParticle Servers, received HTTP Code of ' + response.status;
              }
              verbose(message);
              invokeAliasCallback(aliasCallback, response.status, errorMessage);
              return [3 /*break*/, 10];
            case 9:
              e_2 = _b.sent();
              err = e_2;
              error('Error sending alias request to mParticle servers. ' + err);
              invokeAliasCallback(aliasCallback, HTTPCodes$2.noHttpCoverage, err.message);
              return [3 /*break*/, 10];
            case 10:
              return [2 /*return*/];
          }
        });
      });
    }

    var HTTPCodes$1 = Constants.HTTPCodes,
      Messages$1 = Constants.Messages;
    var Modify = Constants.IdentityMethods.Modify;
    function IdentityAPIClient(mpInstance) {
      this.sendAliasRequest = /*#__PURE__*/function () {
        var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(aliasRequest, callback) {
          return _regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return sendAliasRequest(mpInstance, aliasRequest, callback);
              case 2:
              case "end":
                return _context.stop();
            }
          }, _callee);
        }));
        return function (_x, _x2) {
          return _ref.apply(this, arguments);
        };
      }();
      this.sendIdentityRequest = /*#__PURE__*/function () {
        var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(identityApiRequest, method, callback, originalIdentityApiData, parseIdentityResponse, mpid, knownIdentities) {
          var _mpInstance$Logger, verbose, error, invokeCallback, previousMPID, uploadUrl, uploader, fetchPayload, response, identityResponse, responseBody;
          return _regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) switch (_context2.prev = _context2.next) {
              case 0:
                _mpInstance$Logger = mpInstance.Logger, verbose = _mpInstance$Logger.verbose, error = _mpInstance$Logger.error;
                invokeCallback = mpInstance._Helpers.invokeCallback;
                verbose(Messages$1.InformationMessages.SendIdentityBegin);
                if (identityApiRequest) {
                  _context2.next = 6;
                  break;
                }
                error(Messages$1.ErrorMessages.APIRequestEmpty);
                return _context2.abrupt("return");
              case 6:
                verbose(Messages$1.InformationMessages.SendIdentityHttp);
                if (!mpInstance._Store.identityCallInFlight) {
                  _context2.next = 10;
                  break;
                }
                invokeCallback(callback, HTTPCodes$1.activeIdentityRequest, 'There is currently an Identity request processing. Please wait for this to return before requesting again');
                return _context2.abrupt("return");
              case 10:
                previousMPID = mpid || null;
                uploadUrl = this.getUploadUrl(method, mpid);
                uploader = window.fetch ? new FetchUploader(uploadUrl) : new XHRUploader(uploadUrl);
                fetchPayload = {
                  method: 'post',
                  headers: {
                    Accept: 'text/plain;charset=UTF-8',
                    'Content-Type': 'application/json',
                    'x-mp-key': mpInstance._Store.devToken
                  },
                  body: JSON.stringify(identityApiRequest)
                };
                _context2.prev = 14;
                mpInstance._Store.identityCallInFlight = true;
                _context2.next = 18;
                return uploader.upload(fetchPayload);
              case 18:
                response = _context2.sent;
                if (!response.json) {
                  _context2.next = 26;
                  break;
                }
                _context2.next = 22;
                return response.json();
              case 22:
                responseBody = _context2.sent;
                identityResponse = this.getIdentityResponseFromFetch(response, responseBody);
                _context2.next = 27;
                break;
              case 26:
                identityResponse = this.getIdentityResponseFromXHR(response);
              case 27:
                verbose('Received Identity Response from server: ' + JSON.stringify(identityResponse.responseText));
                parseIdentityResponse(identityResponse, previousMPID, callback, originalIdentityApiData, method, knownIdentities, false);
                _context2.next = 36;
                break;
              case 31:
                _context2.prev = 31;
                _context2.t0 = _context2["catch"](14);
                mpInstance._Store.identityCallInFlight = false;
                invokeCallback(callback, HTTPCodes$1.noHttpCoverage, _context2.t0);
                error('Error sending identity request to servers' + ' - ' + _context2.t0);
              case 36:
              case "end":
                return _context2.stop();
            }
          }, _callee2, this, [[14, 31]]);
        }));
        return function (_x3, _x4, _x5, _x6, _x7, _x8, _x9) {
          return _ref2.apply(this, arguments);
        };
      }();
      this.getUploadUrl = function (method, mpid) {
        var uploadServiceUrl = mpInstance._Helpers.createServiceUrl(mpInstance._Store.SDKConfig.identityUrl);
        var uploadUrl = method === Modify ? uploadServiceUrl + mpid + '/' + method : uploadServiceUrl + method;
        return uploadUrl;
      };
      this.getIdentityResponseFromFetch = function (response, responseBody) {
        return {
          status: response.status,
          responseText: responseBody,
          cacheMaxAge: parseInt(response.headers.get(CACHE_HEADER)) || 0,
          expireTimestamp: 0
        };
      };
      this.getIdentityResponseFromXHR = function (response) {
        return {
          status: response.status,
          responseText: response.responseText ? JSON.parse(response.responseText) : {},
          cacheMaxAge: parseNumber(response.getResponseHeader(CACHE_HEADER) || ''),
          expireTimestamp: 0
        };
      };
    }

    // Facebook Click ID has specific formatting rules
    // The formatted ClickID value must be of the form version.subdomainIndex.creationTime.<fbclid>, where:
    // - version is always this prefix: fb
    // - subdomainIndex is which domain the cookie is defined on ('com' = 0, 'example.com' = 1, 'www.example.com' = 2)
    // - creationTime is the UNIX time since epoch in milliseconds when the _fbc was stored. If you don't save the _fbc cookie, use the timestamp when you first observed or received this fbclid value
    // - <fbclid> is the value for the fbclid query parameter in the page URL.
    // https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc
    var facebookClickIdProcessor = function facebookClickIdProcessor(clickId, url, timestamp) {
      if (!clickId || !url) {
        return '';
      }
      var urlSegments = url === null || url === void 0 ? void 0 : url.split('//');
      if (!urlSegments) {
        return '';
      }
      var urlParts = urlSegments[1].split('/');
      var domainParts = urlParts[0].split('.');
      var subdomainIndex = 1;
      // The rules for subdomainIndex are for parsing the domain portion
      // of the URL for cookies, but in this case we are parsing the URL 
      // itself, so we can ignore the use of 0 for 'com'
      if (domainParts.length >= 3) {
        subdomainIndex = 2;
      }
      // If timestamp is not provided, use the current time
      var _timestamp = timestamp || Date.now();
      return "fb.".concat(subdomainIndex, ".").concat(_timestamp, ".").concat(clickId);
    };
    var integrationMapping = {
      fbclid: {
        mappedKey: 'Facebook.ClickId',
        processor: facebookClickIdProcessor
      },
      _fbp: {
        mappedKey: 'Facebook.BrowserId'
      },
      _fbc: {
        mappedKey: 'Facebook.ClickId'
      }
    };
    var IntegrationCapture = /** @class */function () {
      function IntegrationCapture() {
        this.initialTimestamp = Date.now();
      }
      /**
       * Captures Integration Ids from cookies and query params and stores them in clickIds object
       */
      IntegrationCapture.prototype.capture = function () {
        var queryParams = this.captureQueryParams() || {};
        var cookies = this.captureCookies() || {};
        // Exclude _fbc if fbclid is present
        // https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc#retrieve-from-fbclid-url-query-parameter
        if (queryParams['fbclid'] && cookies['_fbc']) {
          delete cookies['_fbc'];
        }
        this.clickIds = __assign(__assign(__assign({}, this.clickIds), queryParams), cookies);
      };
      /**
       * Captures cookies based on the integration ID mapping.
       */
      IntegrationCapture.prototype.captureCookies = function () {
        var cookies = getCookies(Object.keys(integrationMapping));
        return this.applyProcessors(cookies);
      };
      /**
       * Captures query parameters based on the integration ID mapping.
       */
      IntegrationCapture.prototype.captureQueryParams = function () {
        var queryParams = this.getQueryParams();
        return this.applyProcessors(queryParams, getHref(), this.initialTimestamp);
      };
      /**
       * Gets the query parameters based on the integration ID mapping.
       * @returns {Dictionary<string>} The query parameters.
       */
      IntegrationCapture.prototype.getQueryParams = function () {
        return queryStringParser(getHref(), Object.keys(integrationMapping));
      };
      /**
       * Converts captured click IDs to custom flags for SDK events.
       * @returns {SDKEventCustomFlags} The custom flags.
       */
      IntegrationCapture.prototype.getClickIdsAsCustomFlags = function () {
        var _a;
        var customFlags = {};
        if (!this.clickIds) {
          return customFlags;
        }
        for (var _i = 0, _b = Object.entries(this.clickIds); _i < _b.length; _i++) {
          var _c = _b[_i],
            key = _c[0],
            value = _c[1];
          var mappedKey = (_a = integrationMapping[key]) === null || _a === void 0 ? void 0 : _a.mappedKey;
          if (!isEmpty(mappedKey)) {
            customFlags[mappedKey] = value;
          }
        }
        return customFlags;
      };
      IntegrationCapture.prototype.applyProcessors = function (clickIds, url, timestamp) {
        var _a;
        var processedClickIds = {};
        for (var _i = 0, _b = Object.entries(clickIds); _i < _b.length; _i++) {
          var _c = _b[_i],
            key = _c[0],
            value = _c[1];
          var processor = (_a = integrationMapping[key]) === null || _a === void 0 ? void 0 : _a.processor;
          if (processor) {
            processedClickIds[key] = processor(value, url, timestamp);
          } else {
            processedClickIds[key] = value;
          }
        }
        return processedClickIds;
      };
      return IntegrationCapture;
    }();

    var Messages = Constants.Messages,
      HTTPCodes = Constants.HTTPCodes,
      FeatureFlags = Constants.FeatureFlags;
    var ReportBatching = FeatureFlags.ReportBatching,
      CaptureIntegrationSpecificIds = FeatureFlags.CaptureIntegrationSpecificIds;
    var StartingInitialization = Messages.InformationMessages.StartingInitialization;

    /**
     * <p>All of the following methods can be called on the primary mParticle class. In version 2.10.0, we introduced <a href="https://docs.mparticle.com/developers/sdk/web/multiple-instances/">multiple instances</a>. If you are using multiple instances (self hosted environments only), you should call these methods on each instance.</p>
     * <p>In current versions of mParticle, if your site has one instance, that instance name is 'default_instance'. Any methods called on mParticle on a site with one instance will be mapped to the `default_instance`.</p>
     * <p>This is for simplicity and backwards compatibility. For example, calling mParticle.logPageView() automatically maps to mParticle.getInstance('default_instance').logPageView().</p>
     * <p>If you have multiple instances, instances must first be initialized and then a method can be called on that instance. For example:</p>
     * <code>
     *  mParticle.init('apiKey', config, 'another_instance');
     *  mParticle.getInstance('another_instance').logPageView();
     * </code>
     *
     * @class mParticle & mParticleInstance
     */

    function mParticleInstance(instanceName) {
      var self = this;
      // These classes are for internal use only. Not documented for public consumption
      this._instanceName = instanceName;
      this._NativeSdkHelpers = new NativeSdkHelpers(this);
      this._SessionManager = new SessionManager(this);
      this._Persistence = new _Persistence(this);
      this._Helpers = new Helpers(this);
      this._Events = new Events(this);
      this._CookieSyncManager = new cookieSyncManager(this);
      this._ServerModel = new ServerModel(this);
      this._Ecommerce = new Ecommerce(this);
      this._ForwardingStatsUploader = new forwardingStatsUploader(this);
      this._Consent = new Consent(this);
      this._IdentityAPIClient = new IdentityAPIClient(this);
      this._preInit = {
        readyQueue: [],
        integrationDelays: {},
        forwarderConstructors: []
      };
      this._IntegrationCapture = new IntegrationCapture();

      // required for forwarders once they reference the mparticle instance
      this.IdentityType = Types.IdentityType;
      this.EventType = Types.EventType;
      this.CommerceEventType = Types.CommerceEventType;
      this.PromotionType = Types.PromotionActionType;
      this.ProductActionType = Types.ProductActionType;
      this._Identity = new Identity(this);
      this.Identity = this._Identity.IdentityAPI;
      this.generateHash = this._Helpers.generateHash;

      // https://go.mparticle.com/work/SQDSDKS-6289
      // TODO: Replace this with Store once Store is moved earlier in the init process
      this.getDeviceId = this._Persistence.getDeviceId;
      if (typeof window !== 'undefined') {
        if (window.mParticle && window.mParticle.config) {
          if (window.mParticle.config.hasOwnProperty('rq')) {
            this._preInit.readyQueue = window.mParticle.config.rq;
          }
        }
      }
      this.init = function (apiKey, config) {
        var _this = this;
        if (!config) {
          console.warn('You did not pass a config object to init(). mParticle will not initialize properly');
        }
        runPreConfigFetchInitialization(this, apiKey, config);

        // config code - Fetch config when requestConfig = true, otherwise, proceed with SDKInitialization
        // Since fetching the configuration is asynchronous, we must pass completeSDKInitialization
        // to it for it to be run after fetched
        if (config) {
          if (!config.hasOwnProperty('requestConfig') || config.requestConfig) {
            var configApiClient = new ConfigAPIClient(apiKey, config, this);
            configApiClient.getSDKConfiguration().then(function (result) {
              var mergedConfig = _this._Helpers.extend({}, config, result);
              completeSDKInitialization(apiKey, mergedConfig, _this);
            });
          } else {
            completeSDKInitialization(apiKey, config, this);
          }
        } else {
          console.error('No config available on the window, please pass a config object to mParticle.init()');
          return;
        }
      };
      /**
       * Resets the SDK to an uninitialized state and removes cookies/localStorage. You MUST call mParticle.init(apiKey, window.mParticle.config)
       * before any other mParticle methods or the SDK will not function as intended.
       * @method setLogLevel
       * @param {String} logLevel verbose, warning, or none. By default, `warning` is chosen.
       */
      this.setLogLevel = function (newLogLevel) {
        self.Logger.setLogLevel(newLogLevel);
      };

      /**
       * Resets the SDK to an uninitialized state and removes cookies/localStorage. You MUST call mParticle.init(apiKey, window.mParticle.config)
       * before any other mParticle methods or the SDK will not function as intended.
       * @method reset
       */
      this.reset = function (instance) {
        try {
          instance._Persistence.resetPersistence();
          if (instance._Store) {
            delete instance._Store;
          }
        } catch (error) {
          console.error('Cannot reset mParticle', error);
        }
      };
      this._resetForTests = function (config, keepPersistence, instance) {
        if (instance._Store) {
          delete instance._Store;
        }
        instance._Store = new Store(config, instance);
        instance._Store.isLocalStorageAvailable = instance._Persistence.determineLocalStorageAvailability(window.localStorage);
        instance._Events.stopTracking();
        if (!keepPersistence) {
          instance._Persistence.resetPersistence();
        }
        instance._Persistence.forwardingStatsBatches.uploadsTable = {};
        instance._Persistence.forwardingStatsBatches.forwardingStatsEventQueue = [];
        instance._preInit = {
          readyQueue: [],
          pixelConfigurations: [],
          integrationDelays: {},
          forwarderConstructors: [],
          isDevelopmentMode: false
        };
      };
      /**
       * A callback method that is invoked after mParticle is initialized.
       * @method ready
       * @param {Function} function A function to be called after mParticle is initialized
       */
      this.ready = function (f) {
        if (self.isInitialized() && typeof f === 'function') {
          f();
        } else {
          self._preInit.readyQueue.push(f);
        }
      };
      /**
       * Returns the current mParticle environment setting
       * @method getEnvironment
       * @returns {String} mParticle environment setting
       */
      this.getEnvironment = function () {
        return self._Store.SDKConfig.isDevelopmentMode ? Types.Environment.Development : Types.Environment.Production;
      };
      /**
       * Returns the mParticle SDK version number
       * @method getVersion
       * @return {String} mParticle SDK version number
       */
      this.getVersion = function () {
        return Constants.sdkVersion;
      };
      /**
       * Sets the app version
       * @method setAppVersion
       * @param {String} version version number
       */
      this.setAppVersion = function (version) {
        var queued = queueIfNotInitialized(function () {
          self.setAppVersion(version);
        }, self);
        if (queued) return;
        self._Store.SDKConfig.appVersion = version;
        self._Persistence.update();
      };
      /**
       * Sets the device id
       * @method setDeviceId
       * @param {String} name device ID (UUIDv4-formatted string)
       */
      this.setDeviceId = function (guid) {
        var queued = queueIfNotInitialized(function () {
          self.setDeviceId(guid);
        }, self);
        if (queued) return;
        this._Store.setDeviceId(guid);
      };
      /**
       * Returns a boolean for whether or not the SDKhas been fully initialized
       * @method isInitialized
       * @return {Boolean} a boolean for whether or not the SDK has been fully initialized
       */
      this.isInitialized = function () {
        return self._Store ? self._Store.isInitialized : false;
      };

      /**
       * Gets the app name
       * @method getAppName
       * @return {String} App name
       */
      this.getAppName = function () {
        return self._Store.SDKConfig.appName;
      };
      /**
       * Sets the app name
       * @method setAppName
       * @param {String} name App Name
       */
      this.setAppName = function (name) {
        var queued = queueIfNotInitialized(function () {
          self.setAppName(name);
        }, self);
        if (queued) return;
        self._Store.SDKConfig.appName = name;
      };
      /**
       * Gets the app version
       * @method getAppVersion
       * @return {String} App version
       */
      this.getAppVersion = function () {
        return self._Store.SDKConfig.appVersion;
      };
      /**
       * Stops tracking the location of the user
       * @method stopTrackingLocation
       */
      this.stopTrackingLocation = function () {
        self._SessionManager.resetSessionTimer();
        self._Events.stopTracking();
      };
      /**
       * Starts tracking the location of the user
       * @method startTrackingLocation
       * @param {Function} [callback] A callback function that is called when the location is either allowed or rejected by the user. A position object of schema {coords: {latitude: number, longitude: number}} is passed to the callback
       */
      this.startTrackingLocation = function (callback) {
        if (!isFunction(callback)) {
          self.Logger.warning('Warning: Location tracking is triggered, but not including a callback into the `startTrackingLocation` may result in events logged too quickly and not being associated with a location.');
        }
        self._SessionManager.resetSessionTimer();
        self._Events.startTracking(callback);
      };
      /**
       * Sets the position of the user
       * @method setPosition
       * @param {Number} lattitude lattitude digit
       * @param {Number} longitude longitude digit
       */
      this.setPosition = function (lat, lng) {
        var queued = queueIfNotInitialized(function () {
          self.setPosition(lat, lng);
        }, self);
        if (queued) return;
        self._SessionManager.resetSessionTimer();
        if (typeof lat === 'number' && typeof lng === 'number') {
          self._Store.currentPosition = {
            lat: lat,
            lng: lng
          };
        } else {
          self.Logger.error('Position latitude and/or longitude must both be of type number');
        }
      };
      /**
       * Starts a new session
       * @method startNewSession
       */
      this.startNewSession = function () {
        self._SessionManager.startNewSession();
      };
      /**
       * Ends the current session
       * @method endSession
       */
      this.endSession = function () {
        // Sends true as an over ride vs when endSession is called from the setInterval
        self._SessionManager.endSession(true);
      };

      /**
       * Logs a Base Event to mParticle's servers
       * @param {Object} event Base Event Object
       * @param {Object} [eventOptions] For Event-level Configuration Options
       */
      this.logBaseEvent = function (event, eventOptions) {
        var queued = queueIfNotInitialized(function () {
          self.logBaseEvent(event, eventOptions);
        }, self);
        if (queued) return;
        self._SessionManager.resetSessionTimer();
        if (typeof event.name !== 'string') {
          self.Logger.error(Messages.ErrorMessages.EventNameInvalidType);
          return;
        }
        if (!event.eventType) {
          event.eventType = Types.EventType.Unknown;
        }
        if (!self._Helpers.canLog()) {
          self.Logger.error(Messages.ErrorMessages.LoggingDisabled);
          return;
        }
        self._Events.logEvent(event, eventOptions);
      };
      /**
       * Logs an event to mParticle's servers
       * @method logEvent
       * @param {String} eventName The name of the event
       * @param {Number} [eventType] The eventType as seen [here](http://docs.mparticle.com/developers/sdk/web/event-tracking#event-type)
       * @param {Object} [eventInfo] Attributes for the event
       * @param {Object} [customFlags] Additional customFlags
       * @param {Object} [eventOptions] For Event-level Configuration Options
       */
      this.logEvent = function (eventName, eventType, eventInfo, customFlags, eventOptions) {
        var queued = queueIfNotInitialized(function () {
          self.logEvent(eventName, eventType, eventInfo, customFlags, eventOptions);
        }, self);
        if (queued) return;
        self._SessionManager.resetSessionTimer();
        if (typeof eventName !== 'string') {
          self.Logger.error(Messages.ErrorMessages.EventNameInvalidType);
          return;
        }
        if (!eventType) {
          eventType = Types.EventType.Unknown;
        }
        if (!self._Helpers.isEventType(eventType)) {
          self.Logger.error('Invalid event type: ' + eventType + ', must be one of: \n' + JSON.stringify(Types.EventType));
          return;
        }
        if (!self._Helpers.canLog()) {
          self.Logger.error(Messages.ErrorMessages.LoggingDisabled);
          return;
        }
        self._Events.logEvent({
          messageType: Types.MessageType.PageEvent,
          name: eventName,
          data: eventInfo,
          eventType: eventType,
          customFlags: customFlags
        }, eventOptions);
      };
      /**
       * Used to log custom errors
       *
       * @method logError
       * @param {String or Object} error The name of the error (string), or an object formed as follows {name: 'exampleName', message: 'exampleMessage', stack: 'exampleStack'}
       * @param {Object} [attrs] Custom attrs to be passed along with the error event; values must be string, number, or boolean
       */
      this.logError = function (error, attrs) {
        var queued = queueIfNotInitialized(function () {
          self.logError(error, attrs);
        }, self);
        if (queued) return;
        self._SessionManager.resetSessionTimer();
        if (!error) {
          return;
        }
        if (typeof error === 'string') {
          error = {
            message: error
          };
        }
        var data = {
          m: error.message ? error.message : error,
          s: 'Error',
          t: error.stack || null
        };
        if (attrs) {
          var sanitized = self._Helpers.sanitizeAttributes(attrs, data.m);
          for (var prop in sanitized) {
            data[prop] = sanitized[prop];
          }
        }
        self._Events.logEvent({
          messageType: Types.MessageType.CrashReport,
          name: error.name ? error.name : 'Error',
          data: data,
          eventType: Types.EventType.Other
        });
      };
      /**
       * Logs `click` events
       * @method logLink
       * @param {String} selector The selector to add a 'click' event to (ex. #purchase-event)
       * @param {String} [eventName] The name of the event
       * @param {Number} [eventType] The eventType as seen [here](http://docs.mparticle.com/developers/sdk/web/event-tracking#event-type)
       * @param {Object} [eventInfo] Attributes for the event
       */
      this.logLink = function (selector, eventName, eventType, eventInfo) {
        self._Events.addEventHandler('click', selector, eventName, eventInfo, eventType);
      };
      /**
       * Logs `submit` events
       * @method logForm
       * @param {String} selector The selector to add the event handler to (ex. #search-event)
       * @param {String} [eventName] The name of the event
       * @param {Number} [eventType] The eventType as seen [here](http://docs.mparticle.com/developers/sdk/web/event-tracking#event-type)
       * @param {Object} [eventInfo] Attributes for the event
       */
      this.logForm = function (selector, eventName, eventType, eventInfo) {
        self._Events.addEventHandler('submit', selector, eventName, eventInfo, eventType);
      };
      /**
       * Logs a page view
       * @method logPageView
       * @param {String} eventName The name of the event. Defaults to 'PageView'.
       * @param {Object} [attrs] Attributes for the event
       * @param {Object} [customFlags] Custom flags for the event
       * @param {Object} [eventOptions] For Event-level Configuration Options
       */
      this.logPageView = function (eventName, attrs, customFlags, eventOptions) {
        var queued = queueIfNotInitialized(function () {
          self.logPageView(eventName, attrs, customFlags, eventOptions);
        }, self);
        if (queued) return;
        self._SessionManager.resetSessionTimer();
        if (self._Helpers.canLog()) {
          if (!self._Helpers.Validators.isStringOrNumber(eventName)) {
            eventName = 'PageView';
          }
          if (!attrs) {
            attrs = {
              hostname: window.location.hostname,
              title: window.document.title
            };
          } else if (!self._Helpers.isObject(attrs)) {
            self.Logger.error('The attributes argument must be an object. A ' + _typeof$1(attrs) + ' was entered. Please correct and retry.');
            return;
          }
          if (customFlags && !self._Helpers.isObject(customFlags)) {
            self.Logger.error('The customFlags argument must be an object. A ' + _typeof$1(customFlags) + ' was entered. Please correct and retry.');
            return;
          }
        }
        self._Events.logEvent({
          messageType: Types.MessageType.PageView,
          name: eventName,
          data: attrs,
          eventType: Types.EventType.Unknown,
          customFlags: customFlags
        }, eventOptions);
      };
      /**
       * Forces an upload of the batch
       * @method upload
       */
      this.upload = function () {
        if (self._Helpers.canLog()) {
          if (self._Store.webviewBridgeEnabled) {
            self._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Upload);
          } else {
            self._APIClient.uploader.prepareAndUpload(false, false);
          }
        }
      };
      /**
       * Invoke these methods on the mParticle.Consent object.
       * Example: mParticle.Consent.createConsentState()
       *
       * @class mParticle.Consent
       */
      this.Consent = {
        /**
         * Creates a CCPA Opt Out Consent State.
         *
         * @method createCCPAConsent
         * @param {Boolean} optOut true represents a "data sale opt-out", false represents the user declining a "data sale opt-out"
         * @param {Number} timestamp Unix time (likely to be Date.now())
         * @param {String} consentDocument document version or experience that the user may have consented to
         * @param {String} location location where the user gave consent
         * @param {String} hardwareId hardware ID for the device or browser used to give consent. This property exists only to provide additional context and is not used to identify users
         * @return {Object} CCPA Consent State
         */
        createCCPAConsent: self._Consent.createPrivacyConsent,
        /**
         * Creates a GDPR Consent State.
         *
         * @method createGDPRConsent
         * @param {Boolean} consent true represents a "data sale opt-out", false represents the user declining a "data sale opt-out"
         * @param {Number} timestamp Unix time (likely to be Date.now())
         * @param {String} consentDocument document version or experience that the user may have consented to
         * @param {String} location location where the user gave consent
         * @param {String} hardwareId hardware ID for the device or browser used to give consent. This property exists only to provide additional context and is not used to identify users
         * @return {Object} GDPR Consent State
         */
        createGDPRConsent: self._Consent.createPrivacyConsent,
        /**
         * Creates a Consent State Object, which can then be used to set CCPA states, add multiple GDPR states, as well as get and remove these privacy states.
         *
         * @method createConsentState
         * @return {Object} ConsentState object
         */
        createConsentState: self._Consent.createConsentState
      };
      /**
       * Invoke these methods on the mParticle.eCommerce object.
       * Example: mParticle.eCommerce.createImpresion(...)
       * @class mParticle.eCommerce
       */
      this.eCommerce = {
        /**
         * Invoke these methods on the mParticle.eCommerce.Cart object.
         * Example: mParticle.eCommerce.Cart.add(...)
         * @class mParticle.eCommerce.Cart
         * @deprecated
         */
        Cart: {
          /**
           * Adds a product to the cart
           * @method add
           * @param {Object} product The product you want to add to the cart
           * @param {Boolean} [logEventBoolean] Option to log the event to mParticle's servers. If blank, no logging occurs.
           * @deprecated
           */
          add: function add(product, logEventBoolean) {
            self.Logger.warning('Deprecated function eCommerce.Cart.add() will be removed in future releases');
            var mpid,
              currentUser = self.Identity.getCurrentUser();
            if (currentUser) {
              mpid = currentUser.getMPID();
            }
            self._Identity.mParticleUserCart(mpid).add(product, logEventBoolean);
          },
          /**
           * Removes a product from the cart
           * @method remove
           * @param {Object} product The product you want to add to the cart
           * @param {Boolean} [logEventBoolean] Option to log the event to mParticle's servers. If blank, no logging occurs.
           * @deprecated
           */
          remove: function remove(product, logEventBoolean) {
            self.Logger.warning('Deprecated function eCommerce.Cart.remove() will be removed in future releases');
            var mpid,
              currentUser = self.Identity.getCurrentUser();
            if (currentUser) {
              mpid = currentUser.getMPID();
            }
            self._Identity.mParticleUserCart(mpid).remove(product, logEventBoolean);
          },
          /**
           * Clears the cart
           * @method clear
           * @deprecated
           */
          clear: function clear() {
            self.Logger.warning('Deprecated function eCommerce.Cart.clear() will be removed in future releases');
            var mpid,
              currentUser = self.Identity.getCurrentUser();
            if (currentUser) {
              mpid = currentUser.getMPID();
            }
            self._Identity.mParticleUserCart(mpid).clear();
          }
        },
        /**
         * Sets the currency code
         * @for mParticle.eCommerce
         * @method setCurrencyCode
         * @param {String} code The currency code
         */
        setCurrencyCode: function setCurrencyCode(code) {
          var queued = queueIfNotInitialized(function () {
            self.eCommerce.setCurrencyCode(code);
          }, self);
          if (queued) return;
          if (typeof code !== 'string') {
            self.Logger.error('Code must be a string');
            return;
          }
          self._SessionManager.resetSessionTimer();
          self._Store.currencyCode = code;
        },
        /**
         * Creates a product
         * @for mParticle.eCommerce
         * @method createProduct
         * @param {String} name product name
         * @param {String} sku product sku
         * @param {Number} price product price
         * @param {Number} [quantity] product quantity. If blank, defaults to 1.
         * @param {String} [variant] product variant
         * @param {String} [category] product category
         * @param {String} [brand] product brand
         * @param {Number} [position] product position
         * @param {String} [coupon] product coupon
         * @param {Object} [attributes] product attributes
         */
        createProduct: function createProduct(name, sku, price, quantity, variant, category, brand, position, coupon, attributes) {
          return self._Ecommerce.createProduct(name, sku, price, quantity, variant, category, brand, position, coupon, attributes);
        },
        /**
         * Creates a promotion
         * @for mParticle.eCommerce
         * @method createPromotion
         * @param {String} id a unique promotion id
         * @param {String} [creative] promotion creative
         * @param {String} [name] promotion name
         * @param {Number} [position] promotion position
         */
        createPromotion: function createPromotion(id, creative, name, position) {
          return self._Ecommerce.createPromotion(id, creative, name, position);
        },
        /**
         * Creates a product impression
         * @for mParticle.eCommerce
         * @method createImpression
         * @param {String} name impression name
         * @param {Object} product the product for which an impression is being created
         */
        createImpression: function createImpression(name, product) {
          return self._Ecommerce.createImpression(name, product);
        },
        /**
         * Creates a transaction attributes object to be used with a checkout
         * @for mParticle.eCommerce
         * @method createTransactionAttributes
         * @param {String or Number} id a unique transaction id
         * @param {String} [affiliation] affilliation
         * @param {String} [couponCode] the coupon code for which you are creating transaction attributes
         * @param {Number} [revenue] total revenue for the product being purchased
         * @param {String} [shipping] the shipping method
         * @param {Number} [tax] the tax amount
         */
        createTransactionAttributes: function createTransactionAttributes(id, affiliation, couponCode, revenue, shipping, tax) {
          return self._Ecommerce.createTransactionAttributes(id, affiliation, couponCode, revenue, shipping, tax);
        },
        /**
         * Logs a checkout action
         * @for mParticle.eCommerce
         * @method logCheckout
         * @param {Number} step checkout step number
         * @param {String} option
         * @param {Object} attrs
         * @param {Object} [customFlags] Custom flags for the event
         * @deprecated
         */
        logCheckout: function logCheckout(step, option, attrs, customFlags) {
          self.Logger.warning('mParticle.logCheckout is deprecated, please use mParticle.logProductAction instead');
          if (!self._Store.isInitialized) {
            self.ready(function () {
              self.eCommerce.logCheckout(step, option, attrs, customFlags);
            });
            return;
          }
          self._SessionManager.resetSessionTimer();
          self._Events.logCheckoutEvent(step, option, attrs, customFlags);
        },
        /**
         * Logs a product action
         * @for mParticle.eCommerce
         * @method logProductAction
         * @param {Number} productActionType product action type as found [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/src/types.js#L206-L218)
         * @param {Object} product the product for which you are creating the product action
         * @param {Object} [attrs] attributes related to the product action
         * @param {Object} [customFlags] Custom flags for the event
         * @param {Object} [transactionAttributes] Transaction Attributes for the event
         * @param {Object} [eventOptions] For Event-level Configuration Options
         */
        logProductAction: function logProductAction(productActionType, product, attrs, customFlags, transactionAttributes, eventOptions) {
          var queued = queueIfNotInitialized(function () {
            self.eCommerce.logProductAction(productActionType, product, attrs, customFlags, transactionAttributes, eventOptions);
          }, self);
          if (queued) return;
          self._SessionManager.resetSessionTimer();
          self._Events.logProductActionEvent(productActionType, product, attrs, customFlags, transactionAttributes, eventOptions);
        },
        /**
         * Logs a product purchase
         * @for mParticle.eCommerce
         * @method logPurchase
         * @param {Object} transactionAttributes transactionAttributes object
         * @param {Object} product the product being purchased
         * @param {Boolean} [clearCart] boolean to clear the cart after logging or not. Defaults to false
         * @param {Object} [attrs] other attributes related to the product purchase
         * @param {Object} [customFlags] Custom flags for the event
         * @deprecated
         */
        logPurchase: function logPurchase(transactionAttributes, product, clearCart, attrs, customFlags) {
          self.Logger.warning('mParticle.logPurchase is deprecated, please use mParticle.logProductAction instead');
          if (!self._Store.isInitialized) {
            self.ready(function () {
              self.eCommerce.logPurchase(transactionAttributes, product, clearCart, attrs, customFlags);
            });
            return;
          }
          if (!transactionAttributes || !product) {
            self.Logger.error(Messages.ErrorMessages.BadLogPurchase);
            return;
          }
          self._SessionManager.resetSessionTimer();
          self._Events.logPurchaseEvent(transactionAttributes, product, attrs, customFlags);
        },
        /**
         * Logs a product promotion
         * @for mParticle.eCommerce
         * @method logPromotion
         * @param {Number} type the promotion type as found [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/src/types.js#L275-L279)
         * @param {Object} promotion promotion object
         * @param {Object} [attrs] boolean to clear the cart after logging or not
         * @param {Object} [customFlags] Custom flags for the event
         * @param {Object} [eventOptions] For Event-level Configuration Options
         */
        logPromotion: function logPromotion(type, promotion, attrs, customFlags, eventOptions) {
          var queued = queueIfNotInitialized(function () {
            self.eCommerce.logPromotion(type, promotion, attrs, customFlags, eventOptions);
          }, self);
          if (queued) return;
          self._SessionManager.resetSessionTimer();
          self._Events.logPromotionEvent(type, promotion, attrs, customFlags, eventOptions);
        },
        /**
         * Logs a product impression
         * @for mParticle.eCommerce
         * @method logImpression
         * @param {Object} impression product impression object
         * @param {Object} attrs attributes related to the impression log
         * @param {Object} [customFlags] Custom flags for the event
         * @param {Object} [eventOptions] For Event-level Configuration Options
         */
        logImpression: function logImpression(impression, attrs, customFlags, eventOptions) {
          var queued = queueIfNotInitialized(function () {
            self.eCommerce.logImpression(impression, attrs, customFlags, eventOptions);
          }, self);
          if (queued) return;
          self._SessionManager.resetSessionTimer();
          self._Events.logImpressionEvent(impression, attrs, customFlags, eventOptions);
        },
        /**
         * Logs a refund
         * @for mParticle.eCommerce
         * @method logRefund
         * @param {Object} transactionAttributes transaction attributes related to the refund
         * @param {Object} product product being refunded
         * @param {Boolean} [clearCart] boolean to clear the cart after refund is logged. Defaults to false.
         * @param {Object} [attrs] attributes related to the refund
         * @param {Object} [customFlags] Custom flags for the event
         * @deprecated
         */
        logRefund: function logRefund(transactionAttributes, product, clearCart, attrs, customFlags) {
          self.Logger.warning('mParticle.logRefund is deprecated, please use mParticle.logProductAction instead');
          if (!self._Store.isInitialized) {
            self.ready(function () {
              self.eCommerce.logRefund(transactionAttributes, product, clearCart, attrs, customFlags);
            });
            return;
          }
          self._SessionManager.resetSessionTimer();
          self._Events.logRefundEvent(transactionAttributes, product, attrs, customFlags);
        },
        expandCommerceEvent: function expandCommerceEvent(event) {
          return self._Ecommerce.expandCommerceEvent(event);
        }
      };
      /**
       * Sets a session attribute
       * @method setSessionAttribute
       * @param {String} key key for session attribute
       * @param {String or Number} value value for session attribute
       */
      this.setSessionAttribute = function (key, value) {
        var queued = queueIfNotInitialized(function () {
          self.setSessionAttribute(key, value);
        }, self);
        if (queued) return;

        // Logs to cookie
        // And logs to in-memory object
        // Example: mParticle.setSessionAttribute('location', '33431');
        if (self._Helpers.canLog()) {
          if (!self._Helpers.Validators.isValidAttributeValue(value)) {
            self.Logger.error(Messages.ErrorMessages.BadAttribute);
            return;
          }
          if (!self._Helpers.Validators.isValidKeyValue(key)) {
            self.Logger.error(Messages.ErrorMessages.BadKey);
            return;
          }
          if (self._Store.webviewBridgeEnabled) {
            self._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetSessionAttribute, JSON.stringify({
              key: key,
              value: value
            }));
          } else {
            var existingProp = self._Helpers.findKeyInObject(self._Store.sessionAttributes, key);
            if (existingProp) {
              key = existingProp;
            }
            self._Store.sessionAttributes[key] = value;
            self._Persistence.update();
            self._Forwarders.applyToForwarders('setSessionAttribute', [key, value]);
          }
        }
      };
      /**
       * Set opt out of logging
       * @method setOptOut
       * @param {Boolean} isOptingOut boolean to opt out or not. When set to true, opt out of logging.
       */
      this.setOptOut = function (isOptingOut) {
        var queued = queueIfNotInitialized(function () {
          self.setOptOut(isOptingOut);
        }, self);
        if (queued) return;
        self._SessionManager.resetSessionTimer();
        self._Store.isEnabled = !isOptingOut;
        self._Events.logOptOut();
        self._Persistence.update();
        if (self._Store.activeForwarders.length) {
          self._Store.activeForwarders.forEach(function (forwarder) {
            if (forwarder.setOptOut) {
              var result = forwarder.setOptOut(isOptingOut);
              if (result) {
                self.Logger.verbose(result);
              }
            }
          });
        }
      };
      /**
       * Set or remove the integration attributes for a given integration ID.
       * Integration attributes are keys and values specific to a given integration. For example,
       * many integrations have their own internal user/device ID. mParticle will store integration attributes
       * for a given device, and will be able to use these values for server-to-server communication to services.
       * This is often useful when used in combination with a server-to-server feed, allowing the feed to be enriched
       * with the necessary integration attributes to be properly forwarded to the given integration.
       * @method setIntegrationAttribute
       * @param {Number} integrationId mParticle integration ID
       * @param {Object} attrs a map of attributes that will replace any current attributes. The keys are predefined by mParticle.
       * Please consult with the mParticle docs or your solutions consultant for the correct value. You may
       * also pass a null or empty map here to remove all of the attributes.
       */
      this.setIntegrationAttribute = function (integrationId, attrs) {
        var queued = queueIfNotInitialized(function () {
          self.setIntegrationAttribute(integrationId, attrs);
        }, self);
        if (queued) return;
        if (typeof integrationId !== 'number') {
          self.Logger.error('integrationId must be a number');
          return;
        }
        if (attrs === null) {
          self._Store.integrationAttributes[integrationId] = {};
        } else if (self._Helpers.isObject(attrs)) {
          if (Object.keys(attrs).length === 0) {
            self._Store.integrationAttributes[integrationId] = {};
          } else {
            for (var key in attrs) {
              if (typeof key === 'string') {
                if (typeof attrs[key] === 'string') {
                  if (self._Helpers.isObject(self._Store.integrationAttributes[integrationId])) {
                    self._Store.integrationAttributes[integrationId][key] = attrs[key];
                  } else {
                    self._Store.integrationAttributes[integrationId] = {};
                    self._Store.integrationAttributes[integrationId][key] = attrs[key];
                  }
                } else {
                  self.Logger.error('Values for integration attributes must be strings. You entered a ' + _typeof$1(attrs[key]));
                  continue;
                }
              } else {
                self.Logger.error('Keys must be strings, you entered a ' + _typeof$1(key));
                continue;
              }
            }
          }
        } else {
          self.Logger.error('Attrs must be an object with keys and values. You entered a ' + _typeof$1(attrs));
          return;
        }
        self._Persistence.update();
      };
      /**
       * Get integration attributes for a given integration ID.
       * @method getIntegrationAttributes
       * @param {Number} integrationId mParticle integration ID
       * @return {Object} an object map of the integrationId's attributes
       */
      this.getIntegrationAttributes = function (integrationId) {
        if (self._Store.integrationAttributes[integrationId]) {
          return self._Store.integrationAttributes[integrationId];
        } else {
          return {};
        }
      };
      // Used by our forwarders
      this.addForwarder = function (forwarder) {
        self._preInit.forwarderConstructors.push(forwarder);
      };
      this.configurePixel = function (settings) {
        self._Forwarders.configurePixel(settings);
      };
      this._getActiveForwarders = function () {
        return self._Store.activeForwarders;
      };
      this._getIntegrationDelays = function () {
        return self._preInit.integrationDelays;
      };
      /*
          An integration delay is a workaround that prevents events from being sent when it is necessary to do so.
          Some server side integrations require a client side value to be included in the payload to successfully 
          forward.  This value can only be pulled from the client side partner SDK.
           During the kit initialization, the kit:
          * sets an integration delay to `true`
          * grabs the required value from the partner SDK,
          * sets it via `setIntegrationAttribute`
          * sets the integration delay to `false`
           The core SDK can then read via `isDelayedByIntegration` to no longer delay sending events.
           This integration attribute is now on the batch payload for the server side to read.
           If there is no delay, then the events sent before an integration attribute is included would not
          be forwarded successfully server side.
      */
      this._setIntegrationDelay = function (module, shouldDelayIntegration) {
        self._preInit.integrationDelays[module] = shouldDelayIntegration;

        // If the integration delay is set to true, no further action needed
        if (shouldDelayIntegration === true) {
          return;
        }
        // If the integration delay is set to false, check to see if there are any
        // other integration delays set to true.  It not, process the queued events/.

        var integrationDelaysKeys = Object.keys(self._preInit.integrationDelays);
        if (integrationDelaysKeys.length === 0) {
          return;
        }
        var hasIntegrationDelays = integrationDelaysKeys.some(function (integration) {
          return self._preInit.integrationDelays[integration] === true;
        });
        if (!hasIntegrationDelays) {
          self._APIClient.processQueuedEvents();
        }
      };

      // Internal use only. Used by our wrapper SDKs to identify themselves during initialization.
      this._setWrapperSDKInfo = function (name, version) {
        var queued = queueIfNotInitialized(function () {
          self._setWrapperSDKInfo(name, version);
        }, self);
        if (queued) return;
        if (self._Store.wrapperSDKInfo === undefined || !self._Store.wrapperSDKInfo.isInfoSet) {
          self._Store.wrapperSDKInfo = {
            name: name,
            version: version,
            isInfoSet: true
          };
        }
      };
    }

    // Some (server) config settings need to be returned before they are set on SDKConfig in a self hosted environment
    function completeSDKInitialization(apiKey, config, mpInstance) {
      var kitBlocker = createKitBlocker(config, mpInstance);
      mpInstance._APIClient = new APIClient(mpInstance, kitBlocker);
      mpInstance._Forwarders = new Forwarders(mpInstance, kitBlocker);
      mpInstance._Store.processConfig(config);
      mpInstance._Identity.idCache = createIdentityCache(mpInstance);
      removeExpiredIdentityCacheDates(mpInstance._Identity.idCache);

      // Web View Bridge is used for cases where the Web SDK is loaded within an iOS or Android device's
      // Web View.  The Web SDK simply acts as a passthrough to the mParticle Native SDK.  It is not
      // responsible for sending events directly to mParticle's servers.  The Web SDK will not initialize
      // persistence or Identity directly.
      if (mpInstance._Store.webviewBridgeEnabled) {
        mpInstance._NativeSdkHelpers.initializeSessionAttributes(apiKey);
      } else {
        // Main SDK initialization flow

        // Load any settings/identities/attributes from cookie or localStorage
        mpInstance._Persistence.initializeStorage();
        mpInstance._Store.syncPersistenceData();

        // Set up user identitiy variables for later use
        var currentUser = mpInstance.Identity.getCurrentUser();
        var currentUserMPID = currentUser ? currentUser.getMPID() : null;
        var currentUserIdentities = currentUser ? currentUser.getUserIdentities().userIdentities : {};
        mpInstance._Store.SDKConfig.identifyRequest = mpInstance._Store.hasInvalidIdentifyRequest() ? {
          userIdentities: currentUserIdentities
        } : mpInstance._Store.SDKConfig.identifyRequest;
        if (mpInstance._Helpers.getFeatureFlag(ReportBatching)) {
          mpInstance._ForwardingStatsUploader.startForwardingStatsTimer();
        }
        if (mpInstance._Helpers.getFeatureFlag(CaptureIntegrationSpecificIds)) {
          mpInstance._IntegrationCapture.capture();
        }
        mpInstance._Forwarders.processForwarders(config, mpInstance._APIClient.prepareForwardingStats);
        mpInstance._Forwarders.processPixelConfigs(config);

        // Checks if session is created, resumed, or needs to be ended
        // Logs a session start or session end event accordingly
        mpInstance._SessionManager.initialize();
        mpInstance._Events.logAST();
        processIdentityCallback(mpInstance, currentUser, currentUserMPID, currentUserIdentities);
      }
      mpInstance._Store.isInitialized = true;

      // Call any functions that are waiting for the library to be initialized
      try {
        mpInstance._preInit.readyQueue = processReadyQueue(mpInstance._preInit.readyQueue);
      } catch (error) {
        mpInstance.Logger.error(error);
      }

      // https://go.mparticle.com/work/SQDSDKS-6040
      if (mpInstance._Store.isFirstRun) {
        mpInstance._Store.isFirstRun = false;
      }
    }
    function createKitBlocker(config, mpInstance) {
      var kitBlocker, dataPlanForKitBlocker, kitBlockError, kitBlockOptions;

      /*  There are three ways a data plan object for blocking can be passed to the SDK:
              1. Manually via config.dataPlanOptions (this takes priority)
              If not passed in manually, we user the server provided via either
              2. Snippet via /mparticle.js endpoint (config.dataPlan.document)
              3. Self hosting via /config endpoint (config.dataPlanResult)
      */

      if (config.dataPlanOptions) {
        mpInstance.Logger.verbose('Customer provided data plan found');
        kitBlockOptions = config.dataPlanOptions;
        dataPlanForKitBlocker = {
          document: {
            dtpn: {
              vers: kitBlockOptions.dataPlanVersion,
              blok: {
                ev: kitBlockOptions.blockEvents,
                ea: kitBlockOptions.blockEventAttributes,
                ua: kitBlockOptions.blockUserAttributes,
                id: kitBlockOptions.blockUserIdentities
              }
            }
          }
        };
      }
      if (!dataPlanForKitBlocker) {
        // config.dataPlan.document returns on /mparticle.js endpoint
        if (config.dataPlan && config.dataPlan.document) {
          if (config.dataPlan.document.error_message) {
            kitBlockError = config.dataPlan.document.error_message;
          } else {
            mpInstance.Logger.verbose('Data plan found from mParticle.js');
            dataPlanForKitBlocker = config.dataPlan;
          }
        }
        // config.dataPlanResult returns on /config endpoint
        else if (config.dataPlanResult) {
          if (config.dataPlanResult.error_message) {
            kitBlockError = config.dataPlanResult.error_message;
          } else {
            mpInstance.Logger.verbose('Data plan found from /config');
            dataPlanForKitBlocker = {
              document: config.dataPlanResult
            };
          }
        }
      }
      if (kitBlockError) {
        mpInstance.Logger.error(kitBlockError);
      }
      if (dataPlanForKitBlocker) {
        kitBlocker = new KitBlocker(dataPlanForKitBlocker, mpInstance);
      }
      return kitBlocker;
    }
    function createIdentityCache(mpInstance) {
      return new LocalStorageVault("".concat(mpInstance._Store.storageName, "-id-cache"), {
        logger: mpInstance.Logger
      });
    }
    function runPreConfigFetchInitialization(mpInstance, apiKey, config) {
      mpInstance.Logger = new Logger(config);
      mpInstance._Store = new Store(config, mpInstance, apiKey);
      window.mParticle.Store = mpInstance._Store;
      mpInstance.Logger.verbose(StartingInitialization);

      // Check to see if localStorage is available before main configuration runs
      // since we will need this for the current implementation of user persistence
      // TODO: Refactor this when we refactor User Identity Persistence
      try {
        mpInstance._Store.isLocalStorageAvailable = mpInstance._Persistence.determineLocalStorageAvailability(window.localStorage);
      } catch (e) {
        mpInstance.Logger.warning('localStorage is not available, using cookies if available');
        mpInstance._Store.isLocalStorageAvailable = false;
      }
    }
    function processIdentityCallback(mpInstance, currentUser, currentUserMPID, currentUserIdentities) {
      // https://go.mparticle.com/work/SQDSDKS-6323
      // Call mParticle._Store.SDKConfig.identityCallback when identify was not called
      // due to a reload or a sessionId already existing
      // Any identity callback should always be ran regardless if an identity call
      // is made
      if (!mpInstance._Store.identifyCalled && mpInstance._Store.SDKConfig.identityCallback && currentUser && currentUserMPID) {
        mpInstance._Store.SDKConfig.identityCallback({
          httpCode: HTTPCodes.activeSession,
          getUser: function getUser() {
            return mpInstance._Identity.mParticleUser(currentUserMPID);
          },
          getPreviousUser: function getPreviousUser() {
            var users = mpInstance.Identity.getUsers();
            var mostRecentUser = users.shift();
            var mostRecentUserMPID = mostRecentUser.getMPID();
            if (mostRecentUser && mostRecentUserMPID === currentUserMPID) {
              mostRecentUser = users.shift();
            }
            return mostRecentUser || null;
          },
          body: {
            mpid: currentUserMPID,
            is_logged_in: mpInstance._Store.isLoggedIn,
            matched_identities: currentUserIdentities,
            context: null,
            is_ephemeral: false
          }
        });
      }
    }
    function processPreloadedItem(readyQueueItem) {
      var args = readyQueueItem;
      var method = args.splice(0, 1)[0];
      // if the first argument is a method on the base mParticle object, run it
      if (mParticle[args[0]]) {
        mParticle[method].apply(this, args);
        // otherwise, the method is on either eCommerce or Identity objects, ie. "eCommerce.setCurrencyCode", "Identity.login"
      } else {
        var methodArray = method.split('.');
        try {
          var computedMPFunction = mParticle;
          for (var i = 0; i < methodArray.length; i++) {
            var currentMethod = methodArray[i];
            computedMPFunction = computedMPFunction[currentMethod];
          }
          computedMPFunction.apply(this, args);
        } catch (e) {
          throw new Error('Unable to compute proper mParticle function ' + e);
        }
      }
    }
    function processReadyQueue(readyQueue) {
      if (!isEmpty(readyQueue)) {
        readyQueue.forEach(function (readyQueueItem) {
          if (isFunction(readyQueueItem)) {
            readyQueueItem();
          } else if (Array.isArray(readyQueueItem)) {
            processPreloadedItem(readyQueueItem);
          }
        });
      }
      // https://go.mparticle.com/work/SQDSDKS-6835
      return [];
    }
    function queueIfNotInitialized(func, self) {
      if (!self.isInitialized()) {
        self.ready(function () {
          func();
        });
        return true;
      }
      return false;
    }

    // This file is used ONLY for the mParticle ESLint plugin. It should NOT be used otherwise!
    var mockFunction = function mockFunction() {
      return null;
    };
    var _BatchValidator = /** @class */function () {
      function _BatchValidator() {}
      _BatchValidator.prototype.getMPInstance = function () {
        return {
          // Certain Helper, Store, and Identity properties need to be mocked to be used in the `returnBatch` method
          _Helpers: {
            sanitizeAttributes: window.mParticle.getInstance()._Helpers.sanitizeAttributes,
            generateHash: function generateHash() {
              return 'mockHash';
            },
            generateUniqueId: function generateUniqueId() {
              return 'mockId';
            },
            extend: window.mParticle.getInstance()._Helpers.extend,
            createServiceUrl: mockFunction,
            parseNumber: mockFunction,
            isObject: mockFunction,
            Validators: null
          },
          _resetForTests: mockFunction,
          _APIClient: null,
          MPSideloadedKit: null,
          _Consent: null,
          _Events: null,
          _Forwarders: null,
          _NativeSdkHelpers: null,
          _Persistence: null,
          _preInit: null,
          Consent: null,
          _ServerModel: null,
          _SessionManager: null,
          _Store: {
            sessionId: 'mockSessionId',
            sideloadedKits: [],
            devToken: 'test_dev_token',
            isFirstRun: true,
            isEnabled: true,
            sessionAttributes: {},
            currentSessionMPIDs: [],
            consentState: null,
            clientId: null,
            deviceId: null,
            serverSettings: {},
            dateLastEventSent: null,
            sessionStartDate: null,
            currentPosition: null,
            isTracking: false,
            watchPositionId: null,
            cartProducts: [],
            eventQueue: [],
            currencyCode: null,
            globalTimer: null,
            context: null,
            configurationLoaded: false,
            identityCallInFlight: false,
            nonCurrentUserMPIDs: {},
            identifyCalled: false,
            isLoggedIn: false,
            cookieSyncDates: {},
            integrationAttributes: {},
            requireDelay: true,
            isLocalStorageAvailable: null,
            integrationDelayTimeoutStart: null,
            storageName: null,
            prodStorageName: null,
            activeForwarders: [],
            kits: {},
            configuredForwarders: [],
            pixelConfigurations: [],
            wrapperSDKInfo: {
              name: 'none',
              version: null,
              isInfoSet: false
            },
            SDKConfig: {
              isDevelopmentMode: false,
              onCreateBatch: mockFunction
            }
          },
          config: null,
          eCommerce: null,
          Identity: {
            getCurrentUser: mockFunction,
            IdentityAPI: {},
            identify: mockFunction,
            login: mockFunction,
            logout: mockFunction,
            modify: mockFunction
          },
          Logger: {
            verbose: mockFunction,
            error: mockFunction,
            warning: mockFunction
          },
          ProductActionType: null,
          ServerModel: null,
          addForwarder: mockFunction,
          generateHash: mockFunction,
          getAppVersion: mockFunction,
          getAppName: mockFunction,
          getInstance: mockFunction,
          getDeviceId: mockFunction,
          init: mockFunction,
          logBaseEvent: mockFunction,
          logEvent: mockFunction,
          logLevel: 'none',
          setPosition: mockFunction,
          upload: mockFunction
        };
      };
      _BatchValidator.prototype.createSDKEventFunction = function (event) {
        return new ServerModel(this.getMPInstance()).createEventObject(event);
      };
      _BatchValidator.prototype.returnBatch = function (events) {
        var _this = this;
        var mpInstance = this.getMPInstance();
        var sdkEvents = Array.isArray(events) ? events.map(function (event) {
          return _this.createSDKEventFunction(event);
        }) : [this.createSDKEventFunction(events)];
        var batch = convertEvents('0', sdkEvents, mpInstance);
        return batch;
      };
      return _BatchValidator;
    }();

    var MPSideloadedKit = /** @class */function () {
      function MPSideloadedKit(unregisteredKitInstance) {
        this.filterDictionary = {
          eventTypeFilters: [],
          eventNameFilters: [],
          screenNameFilters: [],
          screenAttributeFilters: [],
          userIdentityFilters: [],
          userAttributeFilters: [],
          attributeFilters: [],
          consentRegulationFilters: [],
          consentRegulationPurposeFilters: [],
          messageTypeFilters: [],
          messageTypeStateFilters: [],
          // The below filtering members are optional, but we instantiate them
          // to simplify public method assignment
          filteringEventAttributeValue: {},
          filteringUserAttributeValue: {},
          filteringConsentRuleValues: {}
        };
        this.kitInstance = unregisteredKitInstance;
      }
      MPSideloadedKit.prototype.addEventTypeFilter = function (eventType) {
        var hashedEventType = KitFilterHelper.hashEventType(eventType);
        this.filterDictionary.eventTypeFilters.push(hashedEventType);
      };
      MPSideloadedKit.prototype.addEventNameFilter = function (eventType, eventName) {
        var hashedEventName = KitFilterHelper.hashEventName(eventName, eventType);
        this.filterDictionary.eventNameFilters.push(hashedEventName);
      };
      MPSideloadedKit.prototype.addEventAttributeFilter = function (eventType, eventName, customAttributeKey) {
        var hashedEventAttribute = KitFilterHelper.hashEventAttributeKey(eventType, eventName, customAttributeKey);
        this.filterDictionary.attributeFilters.push(hashedEventAttribute);
      };
      MPSideloadedKit.prototype.addScreenNameFilter = function (screenName) {
        var hashedScreenName = KitFilterHelper.hashEventName(screenName, EventTypeEnum.Unknown);
        this.filterDictionary.screenNameFilters.push(hashedScreenName);
      };
      MPSideloadedKit.prototype.addScreenAttributeFilter = function (screenName, screenAttribute) {
        var hashedScreenAttribute = KitFilterHelper.hashEventAttributeKey(EventTypeEnum.Unknown, screenName, screenAttribute);
        this.filterDictionary.screenAttributeFilters.push(hashedScreenAttribute);
      };
      MPSideloadedKit.prototype.addUserIdentityFilter = function (userIdentity) {
        var hashedIdentityType = KitFilterHelper.hashUserIdentity(userIdentity);
        this.filterDictionary.userIdentityFilters.push(hashedIdentityType);
      };
      MPSideloadedKit.prototype.addUserAttributeFilter = function (userAttributeKey) {
        var hashedUserAttributeKey = KitFilterHelper.hashUserAttribute(userAttributeKey);
        this.filterDictionary.userAttributeFilters.push(hashedUserAttributeKey);
      };
      return MPSideloadedKit;
    }();

    if (!Array.prototype.forEach) {
      Array.prototype.forEach = Polyfill.forEach;
    }
    if (!Array.prototype.map) {
      Array.prototype.map = Polyfill.map;
    }
    if (!Array.prototype.filter) {
      Array.prototype.filter = Polyfill.filter;
    }
    if (!Array.isArray) {
      Array.prototype.isArray = Polyfill.isArray;
    }
    function mParticle$1() {
      var self = this;
      // Only leaving this here in case any clients are trying to access mParticle.Store, to prevent from throwing
      this.Store = {};
      this._instances = {};
      this.IdentityType = Types.IdentityType;
      this.EventType = Types.EventType;
      this.CommerceEventType = Types.CommerceEventType;
      this.PromotionType = Types.PromotionActionType;
      this.ProductActionType = Types.ProductActionType;
      this.MPSideloadedKit = MPSideloadedKit;
      if (typeof window !== 'undefined') {
        this.isIOS = window.mParticle && window.mParticle.isIOS ? window.mParticle.isIOS : false;
        this.config = window.mParticle && window.mParticle.config ? window.mParticle.config : {};
      }

      /**
       * Initializes the mParticle instance. If no instanceName is provided, an instance name of `default_instance` will be used.
       * <p>
       * If you'd like to initiate multiple mParticle instances, first review our <a href="https://docs.mparticle.com/developers/sdk/web/multiple-instances/">doc site</a>, and ensure you pass a unique instance name as the third argument as shown below.
       * @method init
       * @param {String} apiKey your mParticle assigned API key
       * @param {Object} [config] an options object for additional configuration
       * @param {String} [instanceName] If you are self hosting the JS SDK and working with multiple instances, you would pass an instanceName to `init`. This instance will be selected when invoking other methods. See the above link to the doc site for more info and examples.
       */
      this.init = function (apiKey, config, instanceName) {
        if (!config && window.mParticle && window.mParticle.config) {
          console.warn('You did not pass a config object to mParticle.init(). Attempting to use the window.mParticle.config if it exists. Please note that in a future release, this may not work and mParticle will not initialize properly');
          config = window.mParticle ? window.mParticle.config : {};
        }
        instanceName = (!instanceName || instanceName.length === 0 ? Constants.DefaultInstance : instanceName).toLowerCase();
        var client = self._instances[instanceName];
        if (client === undefined) {
          client = new mParticleInstance(apiKey);
          self._instances[instanceName] = client;
        }
        client.init(apiKey, config, instanceName);
      };
      this.getInstance = function getInstance(instanceName) {
        var client;
        if (!instanceName) {
          instanceName = Constants.DefaultInstance;
          client = self._instances[instanceName];
          if (!client) {
            client = new mParticleInstance(instanceName);
            self._instances[Constants.DefaultInstance] = client;
          }
          return client;
        } else {
          client = self._instances[instanceName.toLowerCase()];
          if (!client) {
            console.log('You tried to initialize an instance named ' + instanceName + '. This instance does not exist. Check your instance name or initialize a new instance with this name before calling it.');
            return null;
          }
          return client;
        }
      };
      this.getDeviceId = function () {
        return self.getInstance().getDeviceId();
      };
      this.setDeviceId = function (guid) {
        return self.getInstance().setDeviceId(guid);
      };
      this.isInitialized = function () {
        return self.getInstance().isInitialized();
      };
      this.startNewSession = function () {
        self.getInstance().startNewSession();
      };
      this.endSession = function () {
        self.getInstance().endSession();
      };
      this.setLogLevel = function (newLogLevel) {
        self.getInstance().setLogLevel(newLogLevel);
      };
      this.ready = function (argument) {
        self.getInstance().ready(argument);
      };
      this.setAppVersion = function (version) {
        self.getInstance().setAppVersion(version);
      };
      this.getAppName = function () {
        return self.getInstance().getAppName();
      };
      this.setAppName = function (name) {
        self.getInstance().setAppName(name);
      };
      this.getAppVersion = function () {
        return self.getInstance().getAppVersion();
      };
      this.getEnvironment = function () {
        return self.getInstance().getEnvironment();
      };
      this.stopTrackingLocation = function () {
        self.getInstance().stopTrackingLocation();
      };
      this.startTrackingLocation = function (callback) {
        self.getInstance().startTrackingLocation(callback);
      };
      this.setPosition = function (lat, lng) {
        self.getInstance().setPosition(lat, lng);
      };
      this.startNewSession = function () {
        self.getInstance().startNewSession();
      };
      this.endSession = function () {
        self.getInstance().endSession();
      };
      this.logBaseEvent = function (event, eventOptions) {
        self.getInstance().logBaseEvent(event, eventOptions);
      };
      this.logEvent = function (eventName, eventType, eventInfo, customFlags, eventOptions) {
        self.getInstance().logEvent(eventName, eventType, eventInfo, customFlags, eventOptions);
      };
      this.logError = function (error, attrs) {
        self.getInstance().logError(error, attrs);
      };
      this.logLink = function (selector, eventName, eventType, eventInfo) {
        self.getInstance().logLink(selector, eventName, eventType, eventInfo);
      };
      this.logForm = function (selector, eventName, eventType, eventInfo) {
        self.getInstance().logForm(selector, eventName, eventType, eventInfo);
      };
      this.logPageView = function (eventName, attrs, customFlags, eventOptions) {
        self.getInstance().logPageView(eventName, attrs, customFlags, eventOptions);
      };
      this.upload = function () {
        self.getInstance().upload();
      };
      this.eCommerce = {
        Cart: {
          add: function add(product, logEventBoolean) {
            self.getInstance().eCommerce.Cart.add(product, logEventBoolean);
          },
          remove: function remove(product, logEventBoolean) {
            self.getInstance().eCommerce.Cart.remove(product, logEventBoolean);
          },
          clear: function clear() {
            self.getInstance().eCommerce.Cart.clear();
          }
        },
        setCurrencyCode: function setCurrencyCode(code) {
          self.getInstance().eCommerce.setCurrencyCode(code);
        },
        createProduct: function createProduct(name, sku, price, quantity, variant, category, brand, position, coupon, attributes) {
          return self.getInstance().eCommerce.createProduct(name, sku, price, quantity, variant, category, brand, position, coupon, attributes);
        },
        createPromotion: function createPromotion(id, creative, name, position) {
          return self.getInstance().eCommerce.createPromotion(id, creative, name, position);
        },
        createImpression: function createImpression(name, product) {
          return self.getInstance().eCommerce.createImpression(name, product);
        },
        createTransactionAttributes: function createTransactionAttributes(id, affiliation, couponCode, revenue, shipping, tax) {
          return self.getInstance().eCommerce.createTransactionAttributes(id, affiliation, couponCode, revenue, shipping, tax);
        },
        logCheckout: function logCheckout(step, options, attrs, customFlags) {
          self.getInstance().eCommerce.logCheckout(step, options, attrs, customFlags);
        },
        logProductAction: function logProductAction(productActionType, product, attrs, customFlags, transactionAttributes, eventOptions) {
          self.getInstance().eCommerce.logProductAction(productActionType, product, attrs, customFlags, transactionAttributes, eventOptions);
        },
        logPurchase: function logPurchase(transactionAttributes, product, clearCart, attrs, customFlags) {
          self.getInstance().eCommerce.logPurchase(transactionAttributes, product, clearCart, attrs, customFlags);
        },
        logPromotion: function logPromotion(type, promotion, attrs, customFlags, eventOptions) {
          self.getInstance().eCommerce.logPromotion(type, promotion, attrs, customFlags, eventOptions);
        },
        logImpression: function logImpression(impression, attrs, customFlags, eventOptions) {
          self.getInstance().eCommerce.logImpression(impression, attrs, customFlags, eventOptions);
        },
        logRefund: function logRefund(transactionAttributes, product, clearCart, attrs, customFlags) {
          self.getInstance().eCommerce.logRefund(transactionAttributes, product, clearCart, attrs, customFlags);
        },
        expandCommerceEvent: function expandCommerceEvent(event) {
          return self.getInstance().eCommerce.expandCommerceEvent(event);
        }
      };
      this.setSessionAttribute = function (key, value) {
        self.getInstance().setSessionAttribute(key, value);
      };
      this.setOptOut = function (isOptingOut) {
        self.getInstance().setOptOut(isOptingOut);
      };
      this.setIntegrationAttribute = function (integrationId, attrs) {
        self.getInstance().setIntegrationAttribute(integrationId, attrs);
      };
      this.getIntegrationAttributes = function (moduleId) {
        return self.getInstance().getIntegrationAttributes(moduleId);
      };
      this.Identity = {
        HTTPCodes: Constants.HTTPCodes,
        aliasUsers: function aliasUsers(aliasRequest, callback) {
          self.getInstance().Identity.aliasUsers(aliasRequest, callback);
        },
        createAliasRequest: function createAliasRequest(sourceUser, destinationUser) {
          return self.getInstance().Identity.createAliasRequest(sourceUser, destinationUser);
        },
        getCurrentUser: function getCurrentUser() {
          return self.getInstance().Identity.getCurrentUser();
        },
        getUser: function getUser(mpid) {
          return self.getInstance().Identity.getUser(mpid);
        },
        getUsers: function getUsers() {
          return self.getInstance().Identity.getUsers();
        },
        identify: function identify(identityApiData, callback) {
          self.getInstance().Identity.identify(identityApiData, callback);
        },
        login: function login(identityApiData, callback) {
          self.getInstance().Identity.login(identityApiData, callback);
        },
        logout: function logout(identityApiData, callback) {
          self.getInstance().Identity.logout(identityApiData, callback);
        },
        modify: function modify(identityApiData, callback) {
          self.getInstance().Identity.modify(identityApiData, callback);
        }
      };
      this.sessionManager = {
        getSession: function getSession() {
          return self.getInstance()._SessionManager.getSession();
        }
      };
      this.Consent = {
        createConsentState: function createConsentState() {
          return self.getInstance().Consent.createConsentState();
        },
        createGDPRConsent: function createGDPRConsent(consented, timestamp, consentDocument, location, hardwareId) {
          return self.getInstance().Consent.createGDPRConsent(consented, timestamp, consentDocument, location, hardwareId);
        },
        createCCPAConsent: function createCCPAConsent(consented, timestamp, consentDocument, location, hardwareId) {
          return self.getInstance().Consent.createGDPRConsent(consented, timestamp, consentDocument, location, hardwareId);
        }
      };
      this.reset = function () {
        self.getInstance().reset(self.getInstance());
      };
      this._resetForTests = function (MPConfig, keepPersistence) {
        if (typeof keepPersistence === 'boolean') {
          self.getInstance()._resetForTests(MPConfig, keepPersistence, self.getInstance());
        } else {
          self.getInstance()._resetForTests(MPConfig, false, self.getInstance());
        }
      };
      this.configurePixel = function (settings) {
        self.getInstance().configurePixel(settings);
      };
      this._setIntegrationDelay = function (moduleId, _boolean) {
        self.getInstance()._setIntegrationDelay(moduleId, _boolean);
      };
      this._getIntegrationDelays = function () {
        return self.getInstance()._getIntegrationDelays();
      };
      this.getVersion = function () {
        return self.getInstance().getVersion();
      };
      this.generateHash = function (string) {
        return self.getInstance().generateHash(string);
      };
      this.addForwarder = function (forwarder) {
        self.getInstance().addForwarder(forwarder);
      };
      this._getActiveForwarders = function () {
        return self.getInstance()._getActiveForwarders();
      };
      this._setWrapperSDKInfo = function (name, version) {
        self.getInstance()._setWrapperSDKInfo(name, version);
      };
    }
    var mparticleInstance = new mParticle$1();
    if (typeof window !== 'undefined') {
      window.mParticle = mparticleInstance;
      window.mParticle._BatchValidator = new _BatchValidator();
    }

    return mparticleInstance;

})();
