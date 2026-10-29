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
          var kValue = void 0;
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
          var kValue = void 0,
            mappedValue = void 0;
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

    var version = "3.27.0";

    var Constants = {
      sdkVersion: version,
      sdkVendor: 'mparticle',
      platform: 'web',
      Messages: {
        DeprecationMessages: {
          MethodHasBeenDeprecated: 'has been deprecated.',
          MethodMarkedForDeprecationPostfix: 'is a deprecated method and will be removed in future releases.',
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
        cookieNameV4: 'mprtcl-v4',
        currentStorageName: 'mprtcl-v4'
      },
      DefaultConfig: {
        cookieDomain: null,
        cookieExpiration: 365,
        logLevel: null,
        timeout: 300,
        sessionTimeout: 30,
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
      // These are the paths that are used to construct the CNAME urls
      CNAMEUrlPaths: {
        v1SecureServiceUrl: '/webevents/v1/JS/',
        v2SecureServiceUrl: '/webevents/v2/JS/',
        v3SecureServiceUrl: '/webevents/v3/JS/',
        configUrl: '/tags/JS/v2/',
        identityUrl: '/identity/v1/',
        aliasUrl: '/webevents/v1/identity/'
      },
      Base64CookieKeys: {
        csm: 1,
        sa: 1,
        ss: 1,
        lsa: 1,
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
        // CaptureIntegrationSpecificIds (legacy): boolean flag from server/UI
        //   - 'True'  \u2192 capture all integration-specific IDs
        //   - 'False' \u2192 capture none
        CaptureIntegrationSpecificIds: 'captureIntegrationSpecificIds',
        // CaptureIntegrationSpecificIdsV2 (new): string mode from server
        //   - 'all'      \u2192 capture all IDs
        //   - 'none'     \u2192 capture none
        //   - 'roktonly' \u2192 capture only Rokt-related IDs
        CaptureIntegrationSpecificIdsV2: 'captureIntegrationSpecificIds.V2',
        AstBackgroundEvents: 'astBackgroundEvents',
        AutoLogPageView: 'autoLogPageView',
        AutoButtonTracking: 'autoButtonTracking',
        AutoLinkTracking: 'autoLinkTracking'
      },
      DefaultInstance: 'default_instance',
      CCPAPurpose: 'data_sale_opt_out',
      IdentityMethods: {
        Modify: 'modify',
        Logout: 'logout',
        Login: 'login',
        Identify: 'identify'
      },
      Environment: {
        Development: 'development',
        Production: 'production'
      },
      CaptureIntegrationSpecificIdsV2Modes: {
        All: 'all',
        None: 'none',
        RoktOnly: 'roktonly'
      },
      Rokt: {
        LauncherInstanceGuidKey: '__rokt_li_guid__'
      }
    };
    // https://go.mparticle.com/work/SQDSDKS-6080
    var ONE_DAY_IN_SECONDS = 60 * 60 * 24;
    var MILLIS_IN_ONE_SEC = 1000;
    // User attribute set when the end user opts out of ad targeting via
    // launcherOptions.noTargeting. Server-side systems use this attribute
    // to exclude the user from retargeting audiences.
    var NO_TARGETING_ATTRIBUTE = '$NoTargeting';
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
    var HTTP_OK = 200;
    var HTTP_ACCEPTED = 202;
    var HTTP_BAD_REQUEST = 400;
    var HTTP_NOT_FOUND = 404;
    var HTTP_SERVER_ERROR = 500;

    function _typeof(o) {
      "@babel/helpers - typeof";

      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
        return typeof o;
      } : function (o) {
        return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
      }, _typeof(o);
    }

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

    var Messages$a = Constants.Messages;
    var createCookieString = function createCookieString(value) {
      return replaceCommasWithPipes(replaceQuotesWithApostrophes(value));
    };
    var revertCookieString = function revertCookieString(value) {
      return replacePipesWithCommas(replaceApostrophesWithQuotes(value));
    };
    var inArray = function inArray(items, name) {
      if (!items) {
        return false;
      }
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
          if (hasOwnProp(obj, prop) && prop.toLowerCase() === key.toLowerCase()) {
            return prop;
          }
        }
      }
      return null;
    };
    var generateDeprecationMessage = function generateDeprecationMessage(methodName, isDeprecated, alternateMethod, docsUrl) {
      var messageArray = [methodName];
      if (isDeprecated) {
        messageArray.push(Messages$a.DeprecationMessages.MethodHasBeenDeprecated);
      } else {
        messageArray.push(Messages$a.DeprecationMessages.MethodMarkedForDeprecationPostfix);
      }
      if (alternateMethod) {
        messageArray.push(Messages$a.DeprecationMessages.AlternativeMethodPrefix);
        messageArray.push(alternateMethod + ".");
      }
      if (docsUrl) {
        messageArray.push("See - " + docsUrl);
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
    var _generateUniqueId = function generateUniqueId(a) {
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
      _generateUniqueId // random hex digits
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
    var parseSettingsString = function parseSettingsString(settingsString) {
      try {
        return settingsString ? JSON.parse(settingsString.replace(/&quot;/g, '"')) : [];
      } catch (error) {
        throw new Error('Settings string contains invalid JSON');
      }
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
    var replaceMPID = function replaceMPID(value, mpid) {
      return value.replace('%%mpid%%', mpid);
    };
    var replaceAmpWithAmpersand = function replaceAmpWithAmpersand(value) {
      return value.replace(/&amp;/g, '&');
    };
    var createCookieSyncUrl = function createCookieSyncUrl(mpid, pixelUrl, redirectUrl, domain, base64Mpid) {
      var modifiedPixelUrl = replaceAmpWithAmpersand(pixelUrl);
      var modifiedDirectUrl = redirectUrl ? replaceAmpWithAmpersand(redirectUrl) : null;
      var url = replaceMPID(modifiedPixelUrl, mpid);
      var redirect = modifiedDirectUrl ? replaceMPID(modifiedDirectUrl, mpid) : '';
      var fullUrl = url + encodeURIComponent(redirect);
      if (domain) {
        var separator = fullUrl.includes('?') ? '&' : '?';
        fullUrl += "".concat(separator, "domain=").concat(domain);
      }
      if (base64Mpid) {
        var separator = fullUrl.includes('?') ? '&' : '?';
        fullUrl += "".concat(separator, "google_hm=").concat(base64Mpid);
      }
      return fullUrl;
    };
    // Google's cookie matching service requires `google_hm` values to be web-safe
    // base64 (RFC 4648 \u00A75) without padding, otherwise the write to the hosted
    // match table fails: https://developers.google.com/authorized-buyers/rtb/cookie-guide
    // (String#replaceAll is not available in our ES5 browser targets.)
    var WEB_SAFE_BASE64_REPLACEMENTS = {
      '+': '-',
      '/': '_',
      '=': ''
    };
    // btoa is defined only over Latin-1 and throws InvalidCharacterError above U+00FF
    var isLatin1 = function isLatin1(value) {
      return !/[^\u0000-\u00ff]/.test(value);
    };
    var toWebSafeBase64 = function toWebSafeBase64(value) {
      return isLatin1(value) ? btoa(value).replace(/[+/=]/g, function (c) {
        return WEB_SAFE_BASE64_REPLACEMENTS[c];
      }) : undefined;
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
    var isValidAttributeValue = function isValidAttributeValue(value) {
      return value !== undefined && !isObject(value) && !Array.isArray(value);
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
    // For keys that did not come from the object itself: `obj[name]` and `name in obj`
    // both walk the prototype chain, so `constructor` is truthy on any plain object.
    //
    // Not `Object.hasOwn`, which Sonar recommends here (typescript:S6653). It is ES2022 and
    // does not compile under this project's `lib: ["es5", "es6", "dom"]`; widening that
    // would emit a call absent from every browser before 2021, and this same file still
    // carries a fallback for browsers with no URLSearchParams.
    var hasOwnProp = function hasOwnProp(obj, key) {
      return Object.prototype.hasOwnProperty.call(obj, key);
    };
    // Assigning `__proto__` replaces the target's prototype instead of adding an own
    // property; `constructor` is reserved alongside it by the stored-record contract.
    // `prototype` is deliberately absent: isValidKeyValue accepts it, so setUserAttribute
    // persists it and the getters must hand it back.
    var isReservedStoredPropertyName = function isReservedStoredPropertyName(name) {
      return name === '__proto__' || name === 'constructor';
    };
    // extend's historical set, which additionally refuses `prototype` when merging.
    var isUncopyableMergeName = function isUncopyableMergeName(name) {
      return isReservedStoredPropertyName(name) || name === 'prototype';
    };
    // Kit-facing copies stay compatible with conventional own-property iteration, such as
    // attributes.hasOwnProperty(key), which is the one read pattern an attribute of that name
    // interferes with. The public getters keep the name; only this filter drops it.
    var isReservedKitPropertyName = function isReservedKitPropertyName(name) {
      return isReservedStoredPropertyName(name) || name === 'hasOwnProperty';
    };
    var queryStringParser = function queryStringParser(url, keys) {
      if (keys === void 0) {
        keys = [];
      }
      var urlParams;
      var results = {};
      var lowerCaseUrlParams = {};
      if (!url) return results;
      if (typeof URL !== 'undefined' && typeof URLSearchParams !== 'undefined') {
        var urlObject = new URL(url);
        urlParams = new URLSearchParams(urlObject.search);
      } else {
        urlParams = queryStringParserFallback(url);
      }
      urlParams.forEach(function (value, key) {
        lowerCaseUrlParams[key.toLowerCase()] = value;
      });
      if (isEmpty(keys)) {
        return lowerCaseUrlParams;
      } else {
        keys.forEach(function (key) {
          var name = key.toLowerCase();
          // Callers pass their own key list, so `name` may not be from this URL.
          if (hasOwnProp(lowerCaseUrlParams, name) && lowerCaseUrlParams[name]) {
            results[key] = lowerCaseUrlParams[name];
          }
        });
      }
      return results;
    };
    var queryStringParserFallback = function queryStringParserFallback(url) {
      var params = {};
      var queryString = url.split('#')[0].split('?')[1] || '';
      var pairs = queryString.split('&');
      pairs.forEach(function (pair) {
        var _a = pair.split('='),
          key = _a[0],
          valueParts = _a.slice(1);
        var value = valueParts.join('=');
        if (key && value !== undefined) {
          try {
            params[key] = decodeURIComponent(value || '');
          } catch (e) {
            console.error("Failed to decode value for key ".concat(key, ": ").concat(e));
          }
        }
      });
      return {
        get: function get(key) {
          return params[key];
        },
        forEach: function forEach(callback) {
          for (var key in params) {
            // Keys come straight off the URL, so `?hasOwnProperty=1` would
            // shadow the method and `params.hasOwnProperty(key)` would throw.
            if (hasOwnProp(params, key)) {
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
        try {
          if (typeof window === 'undefined') {
            return [];
          }
          return window.document.cookie.split(';').map(function (cookie) {
            return cookie.trim();
          });
        } catch (e) {
          console.error('Unable to parse cookies', e);
          return [];
        }
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
    var filterDictionaryWithHash = function filterDictionaryWithHash(dictionary, filterList, hashFn) {
      var filtered = {};
      if (!isEmpty(dictionary)) {
        for (var key in dictionary) {
          if (hasOwnProp(dictionary, key) && !isReservedKitPropertyName(key)) {
            var hashedKey = hashFn(key);
            if (!inArray(filterList, hashedKey)) {
              filtered[key] = dictionary[key];
            }
          }
        }
      }
      return filtered;
    };
    var parseConfig = function parseConfig(config, moduleName, moduleId) {
      var _a;
      return ((_a = config.kitConfigs) === null || _a === void 0 ? void 0 : _a.find(function (kitConfig) {
        return kitConfig.name === moduleName && kitConfig.moduleId === moduleId;
      })) || null;
    };
    /**
     * Obfuscates an object by replacing all primitive values with their type names,
     * while preserving the structure of nested objects and arrays.
     * This is useful for logging data structures without exposing PII.
     *
     * @param value - The value to obfuscate
     * @returns The obfuscated value with types instead of actual values
     *
     * @example
     * obfuscateData({ email: 'user@email.com', age: 30 })
     * // Returns: { email: 'string', age: 'number' }
     *
     * obfuscateData({ tags: ['premium', 'verified'] })
     * // Returns: { tags: ['string', 'string'] }
     */
    var _obfuscateData = function obfuscateData(value) {
      // Preserve null and undefined
      if (value === null || value === undefined) {
        return value;
      }
      // Handle arrays - recursively obfuscate each element
      if (Array.isArray(value)) {
        return value.map(function (item) {
          return _obfuscateData(item);
        });
      }
      // Handle objects - recursively obfuscate each property
      if (isObject(value)) {
        var obfuscated = {};
        for (var key in value) {
          if (value.hasOwnProperty(key)) {
            obfuscated[key] = _obfuscateData(value[key]);
          }
        }
        return obfuscated;
      }
      // For primitives and other types, return the type as a string
      return _typeof(value);
    };
    /**
     * For verbose logging: returns raw data when isDevelopmentMode is true, else obfuscated data.
     * Used when logging payloads so PII is not exposed in production.
     *
     * @param data - The value to log
     * @param isDevelopmentMode - When true, returns data unchanged, when false or undefined, returns obfuscated data
     * @returns Raw data when isDevelopmentMode is true, otherwise obfuscated structure
     *
     * @example
     * obfuscateDevData({ email: 'user@email.com' }, true)
     * // Returns: { email: 'user@email.com' }
     *
     * obfuscateDevData({ email: 'user@email.com' }, false)
     * // Returns: { email: 'string' }
     */
    var obfuscateDevData = function obfuscateDevData(data, isDevelopmentMode) {
      return isDevelopmentMode ? data : _obfuscateData(data);
    };
    // Standalone version of jQuery.extend, from https://github.com/dansdom/extend
    // https://go.mparticle.com/work/SQDSDKS-6047
    function extend() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var objectHelper = {
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
      };
      var options,
        name,
        src,
        copy,
        copyIsArray,
        clone,
        target = args[0] || {},
        i = 1,
        deep = false;
      var length = args.length;
      if (typeof target === 'boolean') {
        deep = target;
        target = args[1] || {};
        i = 2;
      }
      if (_typeof(target) !== 'object' && !objectHelper.isFunction(target)) {
        target = {};
      }
      if (length === i) {
        target = {};
        --i;
      }
      for (; i < length; i++) {
        if ((options = args[i]) != null) {
          for (name in options) {
            if (isUncopyableMergeName(name)) {
              continue;
            }
            if (!Object.prototype.hasOwnProperty.call(options, name)) {
              continue;
            }
            src = target[name];
            copy = options[name];
            if (target === copy) {
              continue;
            }
            if (deep && copy && (objectHelper.isPlainObject(copy) || (copyIsArray = objectHelper.isArray(copy)))) {
              if (copyIsArray) {
                copyIsArray = false;
                clone = src && objectHelper.isArray(src) ? src : [];
              } else {
                clone = src && objectHelper.isPlainObject(src) ? src : {};
              }
              target[name] = extend(deep, clone, copy);
            } else if (copy !== undefined) {
              target[name] = copy;
            }
          }
        }
      }
      return target;
    }
    var getErrorMessage = function getErrorMessage(e, fallback) {
      if (fallback === void 0) {
        fallback = 'unknown error';
      }
      if (e instanceof Error) {
        return e.message;
      }
      if (typeof e === 'string') {
        return e;
      }
      // fetch-mock and some network libs reject with { message } rather than Error
      if (e && _typeof(e) === 'object' && typeof e.message === 'string') {
        return e.message;
      }
      return fallback;
    };

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
    // Continuation of EventType enum above, but in seperate object since we don't expose these to end user
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
      PhoneNumber3: 21,
      isValid: function isValid(identityType) {
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
      },
      getName: function getName(identityType) {
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
      },
      getIdentityType: function getIdentityType(identityName) {
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
          case 'email_sha256':
            return IdentityType.Other;
          case 'mobile_sha256':
            return IdentityType.Other2;
          default:
            return false;
        }
      },
      getIdentityName: function getIdentityName(identityType) {
        switch (identityType) {
          case IdentityType.Other:
            return 'other';
          case IdentityType.CustomerId:
            return 'customerid';
          case IdentityType.Facebook:
            return 'facebook';
          case IdentityType.Twitter:
            return 'twitter';
          case IdentityType.Google:
            return 'google';
          case IdentityType.Microsoft:
            return 'microsoft';
          case IdentityType.Yahoo:
            return 'yahoo';
          case IdentityType.Email:
            return 'email';
          case IdentityType.FacebookCustomAudienceId:
            return 'facebookcustomaudienceid';
          case IdentityType.Other2:
            return 'other2';
          case IdentityType.Other3:
            return 'other3';
          case IdentityType.Other4:
            return 'other4';
          case IdentityType.Other5:
            return 'other5';
          case IdentityType.Other6:
            return 'other6';
          case IdentityType.Other7:
            return 'other7';
          case IdentityType.Other8:
            return 'other8';
          case IdentityType.Other9:
            return 'other9';
          case IdentityType.Other10:
            return 'other10';
          case IdentityType.MobileNumber:
            return 'mobile_number';
          case IdentityType.PhoneNumber2:
            return 'phone_number_2';
          case IdentityType.PhoneNumber3:
            return 'phone_number_3';
          default:
            return null;
        }
      },
      // Strips out functions from Identity Types for easier lookups
      getValuesAsStrings: function getValuesAsStrings() {
        return Object.values(IdentityType).map(function (value) {
          return isNumber(value) ? value.toString() : undefined;
        }).filter(function (value) {
          return value !== undefined;
        });
      },
      getNewIdentitiesByName: function getNewIdentitiesByName(newIdentitiesByType) {
        var newIdentitiesByName = {};
        var identityTypeValuesAsStrings = IdentityType.getValuesAsStrings();
        for (var key in newIdentitiesByType) {
          // IdentityTypes are stored as numbers but are passed in as strings
          if (identityTypeValuesAsStrings.includes(key)) {
            var identityNameKey = IdentityType.getIdentityName(parseNumber(key));
            newIdentitiesByName[identityNameKey] = newIdentitiesByType[key];
          }
        }
        return newIdentitiesByName;
      }
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
      RemoveFromWishlist: 10,
      // Rokt Brain commerce-adjacent types
      ViewCart: 11,
      AddShippingInfo: 12,
      AddPaymentInfo: 13,
      PaymentMethodSelected: 14,
      PaymentAttempted: 15,
      PaymentSucceeded: 16,
      PaymentFailed: 17,
      RefundInitiated: 18,
      isRoktCommerceType: function isRoktCommerceType(id) {
        return id >= ProductActionType.ViewCart && id <= ProductActionType.RefundInitiated;
      },
      getName: function getName(id) {
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
          case ProductActionType.ViewCart:
            return 'View Cart';
          case ProductActionType.AddShippingInfo:
            return 'Add Shipping Info';
          case ProductActionType.AddPaymentInfo:
            return 'Add Payment Info';
          case ProductActionType.PaymentMethodSelected:
            return 'Payment Method Selected';
          case ProductActionType.PaymentAttempted:
            return 'Payment Attempted';
          case ProductActionType.PaymentSucceeded:
            return 'Payment Succeeded';
          case ProductActionType.PaymentFailed:
            return 'Payment Failed';
          case ProductActionType.RefundInitiated:
            return 'Refund Initiated';
          default:
            return 'Unknown';
        }
      },
      // these are the action names used by server and mobile SDKs when expanding a CommerceEvent
      getExpansionName: function getExpansionName(id) {
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
          case ProductActionType.ViewCart:
            return 'view_cart';
          case ProductActionType.AddShippingInfo:
            return 'add_shipping_info';
          case ProductActionType.AddPaymentInfo:
            return 'add_payment_info';
          case ProductActionType.PaymentMethodSelected:
            return 'payment_method_selected';
          case ProductActionType.PaymentAttempted:
            return 'payment_attempted';
          case ProductActionType.PaymentSucceeded:
            return 'payment_succeeded';
          case ProductActionType.PaymentFailed:
            return 'payment_failed';
          case ProductActionType.RefundInitiated:
            return 'refund_initiated';
          default:
            return 'unknown';
        }
      }
    };
    var RoktEvents = {
      SignUp: 'sign_up',
      Subscribe: 'subscribe',
      StartTrial: 'start_trial',
      GenerateLead: 'generate_lead',
      Search: 'search',
      Upsell: 'upsell',
      EarnVirtualCurrency: 'earn_virtual_currency',
      DwellTime: 'dwell_time',
      Hover: 'hover',
      Scroll: 'scroll',
      ClickToExpand: 'click_to_expand'
    };
    var PromotionActionType = {
      Unknown: 0,
      PromotionView: 1,
      PromotionClick: 2,
      getName: function getName(id) {
        switch (id) {
          case PromotionActionType.PromotionView:
            return 'view';
          case PromotionActionType.PromotionClick:
            return 'click';
          default:
            return 'unknown';
        }
      },
      // these are the names that the server and mobile SDKs use while expanding CommerceEvent
      getExpansionName: function getExpansionName(id) {
        switch (id) {
          case PromotionActionType.PromotionView:
            return 'view';
          case PromotionActionType.PromotionClick:
            return 'click';
          default:
            return 'unknown';
        }
      }
    };
    var ProfileMessageType = {
      Logout: 3
    };
    var ApplicationTransitionType$1 = {
      AppInit: 1
    };
    var PerformanceMarkType = {
      SdkStart: 'mp:sdkStart',
      JointSdkSelectPlacements: 'mp:jointSdkSelectPlacements',
      JointSdkRoktKitInit: 'mp:jointSdkRoktKitInit'
    };
    // A stored `ui` key is the decimal string of an IdentityType; anything else was
    // not written by this SDK. The round-trip comparison is load bearing: parseNumber
    // returns 0 for any non-numeric key and IdentityType.Other is 0, so after parsing
    // alone a stored "hasOwnProperty" is indistinguishable from a genuine Other entry.
    function getIdentityTypeFromStoredKey(key) {
      var identityType = parseNumber(key);
      if (String(identityType) !== key || !IdentityType.isValid(identityType)) {
        return null;
      }
      return identityType;
    }
    var Types = {
      MessageType: MessageType$1,
      EventType: EventType,
      CommerceEventType: CommerceEventType,
      IdentityType: IdentityType,
      ProfileMessageType: ProfileMessageType,
      ApplicationTransitionType: ApplicationTransitionType$1,
      ProductActionType: ProductActionType,
      PromotionActionType: PromotionActionType,
      RoktEvents: RoktEvents,
      Environment: Constants.Environment
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
      SDKProductActionType[SDKProductActionType["ViewCart"] = 11] = "ViewCart";
      SDKProductActionType[SDKProductActionType["AddShippingInfo"] = 12] = "AddShippingInfo";
      SDKProductActionType[SDKProductActionType["AddPaymentInfo"] = 13] = "AddPaymentInfo";
      SDKProductActionType[SDKProductActionType["PaymentMethodSelected"] = 14] = "PaymentMethodSelected";
      SDKProductActionType[SDKProductActionType["PaymentAttempted"] = 15] = "PaymentAttempted";
      SDKProductActionType[SDKProductActionType["PaymentSucceeded"] = 16] = "PaymentSucceeded";
      SDKProductActionType[SDKProductActionType["PaymentFailed"] = 17] = "PaymentFailed";
      SDKProductActionType[SDKProductActionType["RefundInitiated"] = 18] = "RefundInitiated";
    })(SDKProductActionType || (SDKProductActionType = {}));
    var LogLevelType = {
      None: 'none',
      Verbose: 'verbose',
      Warning: 'warning',
      Error: 'error'
    };

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
    // Integration outputs are used to determine how click ids are used within the SDK
    // CUSTOM_FLAGS are sent out when an Event is created via ServerModel.createEventObject
    // PARTNER_IDENTITIES are sent out in a Batch when a group of events are converted to a Batch
    // INTEGRATION_ATTRIBUTES are stored initially on the SDKEvent level but then is added to the Batch when the batch is created
    var IntegrationOutputs = {
      CUSTOM_FLAGS: 'custom_flags',
      PARTNER_IDENTITIES: 'partner_identities',
      INTEGRATION_ATTRIBUTES: 'integration_attributes'
    };
    var integrationMappingExternal = {
      // Facebook / Meta
      fbclid: {
        mappedKey: 'Facebook.ClickId',
        processor: facebookClickIdProcessor,
        output: IntegrationOutputs.CUSTOM_FLAGS
      },
      _fbp: {
        mappedKey: 'Facebook.BrowserId',
        output: IntegrationOutputs.CUSTOM_FLAGS
      },
      _fbc: {
        mappedKey: 'Facebook.ClickId',
        output: IntegrationOutputs.CUSTOM_FLAGS
      },
      // Google
      gclid: {
        mappedKey: 'GoogleEnhancedConversions.Gclid',
        output: IntegrationOutputs.CUSTOM_FLAGS
      },
      gbraid: {
        mappedKey: 'GoogleEnhancedConversions.Gbraid',
        output: IntegrationOutputs.CUSTOM_FLAGS
      },
      wbraid: {
        mappedKey: 'GoogleEnhancedConversions.Wbraid',
        output: IntegrationOutputs.CUSTOM_FLAGS
      },
      // TIKTOK
      ttclid: {
        mappedKey: 'TikTok.Callback',
        output: IntegrationOutputs.CUSTOM_FLAGS
      },
      _ttp: {
        mappedKey: 'tiktok_cookie_id',
        output: IntegrationOutputs.PARTNER_IDENTITIES
      },
      // Snapchat
      // https://businesshelp.snapchat.com/s/article/troubleshooting-click-id?language=en_US
      ScCid: {
        mappedKey: 'SnapchatConversions.ClickId',
        output: IntegrationOutputs.CUSTOM_FLAGS
      },
      // Pinterest
      // https://developers.pinterest.com/docs/track-conversions/track-conversions-in-the-api/
      // https://help.pinterest.com/en/business/article/pinterest-tag-parameters-and-cookies
      epik: {
        mappedKey: 'Pinterest.click_id',
        output: IntegrationOutputs.CUSTOM_FLAGS
      },
      _epik: {
        mappedKey: 'Pinterest.click_id',
        output: IntegrationOutputs.CUSTOM_FLAGS
      },
      // Snapchat
      // https://developers.snap.com/api/marketing-api/Conversions-API/UsingTheAPI#sending-click-id
      _scid: {
        mappedKey: 'SnapchatConversions.Cookie1',
        output: IntegrationOutputs.CUSTOM_FLAGS
      }
    };
    var integrationMappingRokt = {
      // Rokt
      // https://docs.rokt.com/developers/integration-guides/web/advanced/rokt-id-tag/
      // https://go.mparticle.com/work/SQDSDKS-7167
      rtid: {
        mappedKey: 'passbackconversiontrackingid',
        output: IntegrationOutputs.INTEGRATION_ATTRIBUTES,
        moduleId: 1277
      },
      rclid: {
        mappedKey: 'passbackconversiontrackingid',
        output: IntegrationOutputs.INTEGRATION_ATTRIBUTES,
        moduleId: 1277
      },
      RoktTransactionId: {
        mappedKey: 'passbackconversiontrackingid',
        output: IntegrationOutputs.INTEGRATION_ATTRIBUTES,
        moduleId: 1277
      }
    };
    function isIntegrationCaptureEnabled(getFeatureFlag) {
      if (!getFeatureFlag) {
        return false;
      }
      var integrationSpecificIds = getFeatureFlag(Constants.FeatureFlags.CaptureIntegrationSpecificIds);
      var integrationSpecificIdsV2 = getFeatureFlag(Constants.FeatureFlags.CaptureIntegrationSpecificIdsV2);
      return !!integrationSpecificIdsV2 && integrationSpecificIdsV2 !== Constants.CaptureIntegrationSpecificIdsV2Modes.None || integrationSpecificIds === true;
    }
    var IntegrationCapture = /** @class */function () {
      function IntegrationCapture(captureMode) {
        this.initialTimestamp = Date.now();
        this.captureMode = captureMode;
        // Cache filtered mappings for faster access
        this.filteredPartnerIdentityMappings = this.filterMappings(IntegrationOutputs.PARTNER_IDENTITIES);
        this.filteredCustomFlagMappings = this.filterMappings(IntegrationOutputs.CUSTOM_FLAGS);
        this.filteredIntegrationAttributeMappings = this.filterMappings(IntegrationOutputs.INTEGRATION_ATTRIBUTES);
      }
      /**
       * Captures Integration Ids from cookies and query params and stores them in clickIds object
       */
      IntegrationCapture.prototype.capture = function () {
        var queryParams = this.captureQueryParams() || {};
        var cookies = this.captureCookies() || {};
        var localStorage = this.captureLocalStorage() || {};
        this.normalizePinterestClickId(queryParams);
        this.normalizePinterestClickId(localStorage);
        this.normalizePinterestClickId(cookies);
        this.applySourcePrecedence([queryParams, localStorage, cookies, this.clickIds || {}]);
        this.clickIds = __assign(__assign(__assign(__assign({}, this.clickIds), cookies), localStorage), queryParams);
      };
      /**
       * Captures cookies based on the integration ID mapping.
       */
      IntegrationCapture.prototype.captureCookies = function () {
        var integrationKeys = this.getAllowedKeysForMode();
        var cookies = getCookies(integrationKeys);
        return this.applyProcessors(cookies, getHref(), this.initialTimestamp);
      };
      /**
       * Captures query parameters based on the integration ID mapping.
       */
      IntegrationCapture.prototype.captureQueryParams = function () {
        var queryParams = this.getQueryParams();
        return this.applyProcessors(queryParams, getHref(), this.initialTimestamp);
      };
      /**
       * Captures local storage based on the integration ID mapping.
       */
      IntegrationCapture.prototype.captureLocalStorage = function () {
        var integrationKeys = this.getAllowedKeysForMode();
        var localStorageItems = {};
        for (var _i = 0, integrationKeys_1 = integrationKeys; _i < integrationKeys_1.length; _i++) {
          var key = integrationKeys_1[_i];
          var localStorageItem = localStorage.getItem(key);
          if (localStorageItem) {
            localStorageItems[key] = localStorageItem;
          }
        }
        return this.applyProcessors(localStorageItems, getHref(), this.initialTimestamp);
      };
      /**
       * Gets the query parameters based on the integration ID mapping.
       * @returns {Dictionary<string>} The query parameters.
       */
      IntegrationCapture.prototype.getQueryParams = function () {
        var integrationKeys = this.getAllowedKeysForMode();
        return queryStringParser(getHref(), integrationKeys);
      };
      /**
       * Converts captured click IDs to custom flags for SDK events.
       * @returns {SDKEventCustomFlags} The custom flags.
       */
      IntegrationCapture.prototype.getClickIdsAsCustomFlags = function () {
        return this.getClickIds(this.clickIds, this.filteredCustomFlagMappings);
      };
      /**
       * Returns only the `partner_identities` mapped integration output.
       * @returns {Dictionary<string>} The partner identities.
       */
      IntegrationCapture.prototype.getClickIdsAsPartnerIdentities = function () {
        return this.getClickIds(this.clickIds, this.filteredPartnerIdentityMappings);
      };
      /**
       * Returns only the `integration_attributes` mapped integration output.
       * @returns {IntegrationAttributes} The integration attributes.
       */
      IntegrationCapture.prototype.getClickIdsAsIntegrationAttributes = function () {
        var _a;
        var _b, _c;
        // Integration IDs are stored in the following format:
        // {
        //     "integration_attributes": {
        //         "<moduleId>": {
        //           "mappedKey": "clickIdValue"
        //         }
        //     }
        // }
        var mappedClickIds = {};
        for (var key in this.clickIds) {
          if (this.clickIds.hasOwnProperty(key)) {
            var value = this.clickIds[key];
            var mappingKey = (_b = this.filteredIntegrationAttributeMappings[key]) === null || _b === void 0 ? void 0 : _b.mappedKey;
            if (!isEmpty(mappingKey)) {
              var moduleId = (_c = this.filteredIntegrationAttributeMappings[key]) === null || _c === void 0 ? void 0 : _c.moduleId;
              if (moduleId && !mappedClickIds[moduleId]) {
                mappedClickIds[moduleId] = (_a = {}, _a[mappingKey] = value, _a);
              }
            }
          }
        }
        return mappedClickIds;
      };
      IntegrationCapture.prototype.getClickIds = function (clickIds, mappingList) {
        var _a;
        var mappedClickIds = {};
        if (!clickIds) {
          return mappedClickIds;
        }
        for (var key in clickIds) {
          if (clickIds.hasOwnProperty(key)) {
            var value = clickIds[key];
            var mappedKey = (_a = mappingList[key]) === null || _a === void 0 ? void 0 : _a.mappedKey;
            if (!isEmpty(mappedKey)) {
              mappedClickIds[mappedKey] = value;
            }
          }
        }
        return mappedClickIds;
      };
      IntegrationCapture.prototype.normalizePinterestClickId = function (clickIds) {
        // Deterministic tie-breaker when both aliases are present in the same source:
        // keep _epik and drop epik.
        if (!isEmpty(clickIds === null || clickIds === void 0 ? void 0 : clickIds['_epik']) && !isEmpty(clickIds === null || clickIds === void 0 ? void 0 : clickIds['epik'])) {
          delete clickIds['epik'];
        }
      };
      IntegrationCapture.prototype.applySourcePrecedence = function (sourcesInPrecedenceOrder) {
        var mapping = this.getActiveIntegrationMapping();
        var outputOf = function outputOf(key) {
          var _a;
          return ((_a = mapping[key]) === null || _a === void 0 ? void 0 : _a.mappedKey) || key;
        };
        var outputsHeldByHigherSources = [];
        for (var _i = 0, sourcesInPrecedenceOrder_1 = sourcesInPrecedenceOrder; _i < sourcesInPrecedenceOrder_1.length; _i++) {
          var source = sourcesInPrecedenceOrder_1[_i];
          var outputsHeldBySource = [];
          for (var key in source) {
            var output = outputOf(key);
            if (outputsHeldByHigherSources.indexOf(output) !== -1) {
              delete source[key];
            } else if (!isEmpty(source[key])) {
              outputsHeldBySource.push(output);
            }
          }
          outputsHeldByHigherSources.push.apply(outputsHeldByHigherSources, outputsHeldBySource);
        }
      };
      IntegrationCapture.prototype.applyProcessors = function (clickIds, url, timestamp) {
        var _a;
        var processedClickIds = {};
        var integrationKeys = this.getActiveIntegrationMapping();
        for (var key in clickIds) {
          if (clickIds.hasOwnProperty(key)) {
            var value = clickIds[key];
            var processor = (_a = integrationKeys[key]) === null || _a === void 0 ? void 0 : _a.processor;
            processedClickIds[key] = processor ? processor(value, url, timestamp) : value;
          }
        }
        return processedClickIds;
      };
      IntegrationCapture.prototype.filterMappings = function (outputType) {
        var filteredMappings = {};
        var integrationKeys = this.getActiveIntegrationMapping();
        for (var key in integrationKeys) {
          if (integrationKeys[key].output === outputType) {
            filteredMappings[key] = integrationKeys[key];
          }
        }
        return filteredMappings;
      };
      /**
       * Returns the allowed keys to capture based on the current mode.
       * For RoktOnly, limit capture to Rokt keys; for All, capture all mapped keys.
       */
      IntegrationCapture.prototype.getAllowedKeysForMode = function () {
        return Object.keys(this.getActiveIntegrationMapping());
      };
      /**
      * Selects the active integration mapping for the current captureMode.
      * - 'roktonly': only Rokt IDs are considered
      * - 'all': both External and Rokt IDs are considered
      * - else: returns an empty mapping and nothing will be captured
      */
      IntegrationCapture.prototype.getActiveIntegrationMapping = function () {
        if (this.captureMode === Constants.CaptureIntegrationSpecificIdsV2Modes.RoktOnly) {
          return integrationMappingRokt;
        }
        if (this.captureMode === Constants.CaptureIntegrationSpecificIdsV2Modes.All) {
          return __assign(__assign({}, integrationMappingExternal), integrationMappingRokt);
        }
        return {};
      };
      return IntegrationCapture;
    }();

    function convertEvents(mpid, sdkEvents, mpInstance) {
      if (!mpid) {
        return null;
      }
      if (!sdkEvents || sdkEvents.length < 1) {
        return null;
      }
      var _IntegrationCapture = mpInstance._IntegrationCapture,
        _Helpers = mpInstance._Helpers;
      var getFeatureFlag = _Helpers.getFeatureFlag;
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
          package: lastEvent.Package,
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
      // https://go.mparticle.com/work/SQDSDKS-7639
      if (isIntegrationCaptureEnabled(getFeatureFlag)) {
        _IntegrationCapture === null || _IntegrationCapture === void 0 ? void 0 : _IntegrationCapture.capture();
        var capturedPartnerIdentities = _IntegrationCapture === null || _IntegrationCapture === void 0 ? void 0 : _IntegrationCapture.getClickIdsAsPartnerIdentities();
        if (!isEmpty(capturedPartnerIdentities)) {
          upload.partner_identities = capturedPartnerIdentities;
        }
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
    function convertCommerceEvent(sdkEvent) {
      var commonEventData = convertBaseEventData(sdkEvent);
      var commerceEventData = {
        custom_flags: sdkEvent.CustomFlags,
        product_action: convertProductAction(sdkEvent),
        promotion_action: convertPromotionAction(sdkEvent),
        product_impressions: convertImpressions(sdkEvent),
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
      // Determine the transition type based on IsBackgroundAST flag
      var _a = dist.ApplicationStateTransitionEventDataApplicationTransitionTypeEnum,
        applicationBackground = _a.applicationBackground,
        applicationInitialized = _a.applicationInitialized;
      var transitionType = sdkEvent.IsBackgroundAST ? applicationBackground : applicationInitialized;
      var astEventData = {
        application_transition_type: transitionType,
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
        source_message_id: sdkEvent.SourceMessageId,
        active_time_on_site_ms: sdkEvent.ActiveTimeOnSite,
        total_time_on_site_ms: sdkEvent.TotalTimeOnSite,
        page_url: sdkEvent.PageUrl
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
        new: sdkEvent.UserAttributeChanges.New,
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
        new: {
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

    // Masks the parts of a page path that can single out one shopper: pagePath for
    // the path a click logs, pageUrlPath for the page URL and page views every event
    // carries.
    // A token of letters and digits mixed, six or more long, as session ids,
    // hex and UUID parts and invite codes are: `A1B2C3D4E5F6`, `550e8400`.
    var MIXED_TOKEN = /^(?=[^0-9]*[0-9])(?=[^A-Za-z]*[A-Za-z])[A-Za-z0-9]{6,}$/;
    // Letters alone, eight or more long, switching case three times or more, as a
    // random code does (`xKpQzRtV`) and a camel-case route word rarely does.
    var CASE_SWITCHING_TOKEN = /^(?=[A-Za-z]{8,}$)(?:[^a-z]*[a-z]+[A-Z]){3}/;
    // Route words whose next segment names one person or carries a one-time code,
    // as in `/profile/jane-smith` or `/reset/abcdefgh`.
    var PERSONAL_ROUTE = /^(?:u|user|users|profile|profiles|member|members|people|reset|reset-password|password|verify|verification|confirm|activate|invite|invitation|token|unsubscribe|magic-link)$/i;
    // Route words whose next segment is one shopper's order: any with `order` or
    // `orders` as a whole word part, as in `view-order`, `order-received` or `order_id`.
    var ORDER_ROUTE = /(?:^|[-_])orders?(?:[-_]|$)/i;
    // Product words that name a way to buy, not an order: `pre-order`, `on-order`,
    // `back-order`, `made-to-order`, as the whole route word only, so
    // `return-to-order` and `pre-order-status` stay routes.
    var PRODUCT_ORDER_WORD = /^(?:(?:pre|on|back)[-_]|made[-_]to[-_])orders?$/i;
    // A `;` that starts a matrix parameter, plain or encoded any number of times.
    var MATRIX_SEPARATOR = /;|%(?:25)*3B/i;
    // A valid escape left after decoding stopped, as when a literal `%` before it
    // can't be decoded again. What it hides is unknown, so it counts as sensitive.
    var LEFTOVER_ESCAPE = /%[0-9A-F]{2}/i;
    function hidesNextSegment(route) {
      return PERSONAL_ROUTE.test(route) || ORDER_ROUTE.test(route) && !PRODUCT_ORDER_WORD.test(route);
    }
    // How many times a value is decoded at most, so one encoded twice or more reads
    // as its plain text.
    var MAX_DECODES = 5;
    // Decodes until the text stops changing. Undefined when the first decode fails;
    // a later failure keeps what decoded so far, as a literal `%` would.
    function decodeFully(text) {
      var current = text;
      for (var i = 0; i < MAX_DECODES; i++) {
        var next = void 0;
        try {
          next = decodeURIComponent(current);
        } catch (e) {
          return i === 0 ? undefined : current;
        }
        if (next === current) {
          return current;
        }
        current = next;
      }
      return current;
    }
    // The route word in a raw path segment: its last part behind an encoded slash,
    // read before any matrix parameter such as `;jsessionid=`, its `;` encoded once,
    // twice or not at all, so a parameter's own value never hides it. Undefined when
    // it can't be decoded, or is still encoded after MAX_DECODES.
    function routeWord(segment) {
      var text = segment;
      for (var i = 0; i < MAX_DECODES; i++) {
        var route = text.split(MATRIX_SEPARATOR)[0];
        var next = void 0;
        try {
          next = decodeURIComponent(route);
        } catch (e) {
          return i === 0 ? undefined : route.split('/').pop();
        }
        if (next === route) {
          return route.split('/').pop();
        }
        text = next;
      }
      return undefined;
    }
    // The last segment before index i that isn't empty, so `/orders//12345678`
    // still reads the order route.
    function routeSegment(segments, i) {
      var routeIndex = i - 1;
      while (routeIndex > 0 && segments[routeIndex] === '') {
        routeIndex--;
      }
      return segments[routeIndex];
    }
    // A piece with a lowercase letter right before an uppercase one, as a random
    // code has and a Title-Case word doesn't.
    var INNER_CASE_SWITCH = /[a-z][A-Z]/;
    var isToken = function isToken(text) {
      return MIXED_TOKEN.test(text) || CASE_SWITCHING_TOKEN.test(text);
    };
    var mixesLettersAndDigits = function mixesLettersAndDigits(piece) {
      return /[0-9]/.test(piece) && /[A-Za-z]/.test(piece);
    };
    // `+` sits inside base64 tokens, so it never splits one. A token that `-` or `_`
    // cuts into short pieces is still one when the pieces read as one joined and
    // either a piece switches case inside it or two or more pieces mix letters and
    // digits, as `a1b2-c3d4-e5f6` does. Title-Case-Words and plain slugs such as
    // `iphone-15-pro` do neither.
    function isTokenSegment(segment) {
      var text = segment.replace(/\+/g, '');
      var pieces = text.split(/[-_.~]/);
      var joined = pieces.join('');
      return pieces.some(isToken) || pieces.some(function (piece) {
        return INNER_CASE_SWITCH.test(piece);
      }) && isToken(joined) || pieces.filter(mixesLettersAndDigits).length >= 2 && MIXED_TOKEN.test(joined);
    }
    // The path a click logs. A segment that can single out one shopper
    // goes as `*`: one holding an @, `;` or `=`, a token, or the one after a route
    // that names a person, carries a code or opens an order. Kept segments stay
    // exactly as the page has them, plain numbers included, since on a product page
    // they name the product.
    function pagePath(pathname) {
      var segments = pathname.split('/');
      return segments.map(function (segment, i) {
        var text = decodeFully(segment);
        var route = i > 0 ? routeWord(routeSegment(segments, i)) : '';
        // A route word that can't be decoded may be any route, so the
        // segment after it is hidden too.
        var hiddenByRoute = i > 0 && !!text && (route === undefined || hidesNextSegment(route));
        // An encoded slash hides several segments in one, so it goes whole.
        return text === undefined || /[@;=/]/.test(text) || LEFTOVER_ESCAPE.test(text) || isTokenSegment(text) || hiddenByRoute ? '*' : segment;
      }).join('/');
    }
    // A token long enough that no page or product name looks like it: 16 or more
    // letters and digits mixed, as checkout tokens are, 16 or more letters
    // switching case like a random code, or a UUID.
    var LONG_MIXED_TOKEN = /^(?=[^0-9]*[0-9])(?=[^A-Za-z]*[A-Za-z])[A-Za-z0-9]{16,}$/;
    var LONG_CASE_SWITCHING_TOKEN = /^(?=[A-Za-z]{16,}$)(?:[^a-z]*[a-z]+[A-Z]){3}/;
    var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // A token that `-` or `_` cuts into shorter pieces counts when two or more
    // pieces mix letters and digits, as `a1b2c3d4-e5f6g7h8` does and a product slug
    // such as `acmephone-15-pro-max-256gb` doesn't.
    function isLongToken(segment) {
      var pieces = segment.replace(/\+/g, '').split(/[-_.~]/);
      return UUID.test(segment) || pieces.some(function (piece) {
        return LONG_MIXED_TOKEN.test(piece) || LONG_CASE_SWITCHING_TOKEN.test(piece);
      }) || pieces.filter(mixesLettersAndDigits).length >= 2 && LONG_MIXED_TOKEN.test(pieces.join(''));
    }
    // The path every event carries, in its page URL and page views, where a
    // wrong `*` costs every output the page it names. Only what reliably singles
    // out one shopper goes as `*`: a segment holding an @, `;` or `=`, one that
    // can't be decoded or still holds an escape, a long token, and the one after a
    // route that names a person or opens an order when it holds a digit or a token.
    // Product codes and pages such as `/profile/edit` or `/orders/history` stay.
    function pageUrlPath(pathname) {
      var segments = pathname.split('/');
      return segments.map(function (segment, i) {
        var text = decodeFully(segment);
        var route = i > 0 ? routeWord(routeSegment(segments, i)) : '';
        var holdsId = !!text && (/[0-9]/.test(text) || isTokenSegment(text));
        // A route word that can't be decoded may be any route.
        var hiddenByRoute = i > 0 && !!text && (route === undefined || hidesNextSegment(route) && holdsId);
        return text === undefined || /[@;=/]/.test(text) || LEFTOVER_ESCAPE.test(text) || isLongToken(text) || hiddenByRoute ? '*' : segment;
      }).join('/');
    }

    var HISTORY_METHODS = ['pushState', 'replaceState'];
    var WRAPPED_MARKER = '__mpApvWrapped__';
    var supportsHistoryTracking = function supportsHistoryTracking(win) {
      return !!win && win.history !== undefined && typeof win.history.pushState === 'function' && typeof win.addEventListener === 'function';
    };
    // Wraps pushState/replaceState so `onNavigate` runs after the real method, and
    // returns the single function that undoes it \u2014 or null when nothing was
    // installed (history is already wrapped, or a frozen/sealed History rejected the
    // assignment). Handing back one undo closure keeps the wrapper and original
    // references out of the tracker entirely: there is no half-patched state for a
    // caller to inspect, and no way to restore the wrong pair.
    var patchHistory = function patchHistory(onNavigate, log) {
      if (window.history.pushState[WRAPPED_MARKER]) {
        log('[patch] history already wrapped, skipping to avoid double-wrap \u2014 STACKED WRAPPER DETECTED');
        return null;
      }
      var originals = {};
      var wrappers = {};
      HISTORY_METHODS.forEach(function (name) {
        var original = window.history[name];
        originals[name] = original;
        var wrapper = function wrapper() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
          }
          var result = original.apply(this, args);
          onNavigate(name);
          return result;
        };
        Object.defineProperty(wrapper, WRAPPED_MARKER, {
          value: true,
          enumerable: false
        });
        wrappers[name] = wrapper;
      });
      // Restore per method: a third party may have patched one of the two on top of
      // ours after we installed. Clobbering theirs would break their tracking, so
      // leave anything that is no longer ours in place.
      var restore = function restore() {
        return HISTORY_METHODS.forEach(function (name) {
          if (window.history[name] === wrappers[name]) {
            window.history[name] = originals[name];
            log("[teardown] restored original ".concat(name));
          } else {
            log("[teardown] ".concat(name, " no longer ours; leaving in place, gating callback to no-op"));
          }
        });
      };
      try {
        HISTORY_METHODS.forEach(function (name) {
          window.history[name] = wrappers[name];
        });
      } catch (e) {
        log("[error] failed to patch history methods (frozen/sealed), rolling back: ".concat(e));
        try {
          restore();
        } catch (restoreError) {
          log("[error] failed to restore history methods after patch failure: ".concat(restoreError));
        }
        return null;
      }
      return restore;
    };
    // One History patch for the whole SDK, so page-view tracking and preselection do not
    // stack two wrappers.
    //
    // State lives on `window`, not module scope, because Next.js re-executes the bundle per
    // SPA navigation while the patch from the previous execution stays installed.
    var WIN_ROUTE_MONITOR_KEY = '__mpRouteMonitor__';
    var monitorState = function monitorState() {
      var win = window;
      if (!win[WIN_ROUTE_MONITOR_KEY]) {
        win[WIN_ROUTE_MONITOR_KEY] = {
          listeners: {},
          undoHistoryPatch: null,
          popStateListener: null
        };
      }
      return win[WIN_ROUTE_MONITOR_KEY];
    };
    // Reads the shared state at call time, so a wrapper installed by a previous bundle
    // execution still reaches the current listeners.
    var emit = function emit(source) {
      Object.values(monitorState().listeners).forEach(function (listener) {
        try {
          listener(source);
        } catch (e) {
          // One subscriber must not stop the others, and must never break navigation.
        }
      });
    };
    var install = function install(state, log) {
      if (state.undoHistoryPatch || state.popStateListener) {
        return;
      }
      state.undoHistoryPatch = patchHistory(emit, log);
      state.popStateListener = function () {
        return emit('popstate');
      };
      window.addEventListener('popstate', state.popStateListener);
    };
    var uninstall = function uninstall(state) {
      if (state.popStateListener) {
        window.removeEventListener('popstate', state.popStateListener);
        state.popStateListener = null;
      }
      if (state.undoHistoryPatch) {
        state.undoHistoryPatch();
        state.undoHistoryPatch = null;
      }
    };
    // Installs on the first subscriber and tears down after the last leaves, so a workspace
    // that needs neither is never patched. Unsubscribing only removes the listener while it
    // still owns its key, so an outgoing instance cannot remove its replacement.
    var subscribeToRouteChange = function subscribeToRouteChange(key, listener, log) {
      if (log === void 0) {
        log = function log() {
          return undefined;
        };
      }
      if (!supportsHistoryTracking(typeof window === 'undefined' ? null : window)) {
        return function () {
          return undefined;
        };
      }
      var state = monitorState();
      state.listeners[key] = listener;
      install(state, log);
      return function () {
        if (state.listeners[key] !== listener) {
          return;
        }
        delete state.listeners[key];
        if (Object.keys(state.listeners).length === 0) {
          uninstall(state);
        }
      };
    };

    // All APV state hangs off one window key, and it is the public debugging
    // contract: `window.__mpApv__` is what you inspect in a console to see whether
    // tracking is live.
    //
    // It lives on `window` rather than in module scope because Next.js re-executes
    // the SDK bundle on every SPA navigation: module-level state is reset each time,
    // but `window` persists for the lifetime of the tab.
    //
    // One object rather than a key per flag, so resetting is a single reassignment.
    // Nothing has to be deleted, and there is no ordering in which half the state
    // survives the reset.
    var WIN_APV_KEY = '__mpApv__';
    // Parameters that identify which page a view is of. Authorization-flow and campaign
    // attribution parameters are deliberately absent; an input can add them explicitly.
    var ALLOWED_QUERY_PARAMS = [
    // Pagination
    'page', 'limit', 'offset', 'cursor', 'per_page',
    // Site search term, as the common platforms spell it. Matching is
    // case-insensitive. `s` is WordPress and WooCommerce search; other
    // single-letter names are too generic. `oq` is a storefront search term.
    'q', 's', 'oq', 'search', 'query', 'keyword', 'keywords', 'term', 'text', 'searchTerm', 'searchText', 'search_query', 'search_text', 'Ntt',
    // Product and variant identifiers. `cid` is not a category: it is a
    // customer id on many sites.
    'pid', 'productId', 'sku', 'skuId', 'variant', 'color', 'colour', 'size',
    // Category
    'category',
    // Referral
    'ref', 'referrer'];
    var AUTO_PAGE_VIEW_ATTRIBUTE = 'is_auto_page_view';
    var CORE_EVENT_FIELDS = ['hostname', 'title', 'path', AUTO_PAGE_VIEW_ATTRIBUTE];
    var PROTOTYPE_MEMBER_NAMES = ['constructor', '__proto__', 'prototype'];
    // Server flag values are the strings 'True' and 'False', so these get typed here by habit.
    var FLAG_VALUE_NAMES = ['true', 'false'];
    var RESERVED_QUERY_PARAMS = CORE_EVENT_FIELDS.concat(PROTOTYPE_MEMBER_NAMES, FLAG_VALUE_NAMES);
    var BUILT_IN_NAMES = ALLOWED_QUERY_PARAMS.map(function (name) {
      return name.toLowerCase();
    });
    var isBuiltIn = function isBuiltIn(name) {
      return BUILT_IN_NAMES.indexOf(name.toLowerCase()) !== -1;
    };
    // Excludes `&`, `=`, `%` and whitespace, which would distort the dedup key.
    var QUERY_PARAM_NAME = /^[a-z0-9_][a-z0-9_.-]{0,63}$/;
    var MAX_CUSTOM_QUERY_PARAMS = 25;
    var MAX_CUSTOM_QUERY_PARAM_VALUE_LENGTH = 512;
    // Params matched by name prefix, for platforms that put a per-product id in the
    // name. Salesforce Commerce Cloud spells a variant choice
    // `dwvar_<productId>_<attribute>`, e.g. `dwvar_12345_color=navy`.
    var ALLOWED_QUERY_PARAM_PREFIXES = ['dwvar_'];
    var hasAllowedPrefix = function hasAllowedPrefix(name) {
      return ALLOWED_QUERY_PARAM_PREFIXES.some(function (prefix) {
        return name.indexOf(prefix) === 0;
      });
    };
    // Whether a query param name, in any case, is one an auto page view captures by default.
    var isAllowedQueryParam = function isAllowedQueryParam(name) {
      return isBuiltIn(name) || hasAllowedPrefix(name.toLowerCase());
    };
    // ---------------------------------------------------------------------------
    // Pure helpers. No `this`, no globals, no side effects \u2014 callable and assertable
    // on their own, which is where the interesting rules live.
    // ---------------------------------------------------------------------------
    // Validated here as well as in the dashboard, because remote config is untrusted input.
    var parseQueryParamAllowlist = function parseQueryParamAllowlist(configured) {
      var allowed = [];
      var rejectedPositions = [];
      var overLimit = 0;
      if (!configured) {
        return {
          allowed: allowed,
          rejectedPositions: rejectedPositions,
          overLimit: overLimit
        };
      }
      var entries = Array.isArray(configured) ? configured : String(configured).split(',');
      entries.forEach(function (entry, index) {
        var position = index + 1;
        var name = String(entry).trim().toLowerCase();
        if (!name) {
          return;
        }
        if (!QUERY_PARAM_NAME.test(name) || RESERVED_QUERY_PARAMS.indexOf(name) !== -1) {
          rejectedPositions.push(position);
          return;
        }
        if (isBuiltIn(name) || allowed.indexOf(name) !== -1) {
          return;
        }
        if (allowed.length >= MAX_CUSTOM_QUERY_PARAMS) {
          overLimit++;
          return;
        }
        allowed.push(name);
      });
      return {
        allowed: allowed,
        rejectedPositions: rejectedPositions,
        overLimit: overLimit
      };
    };
    // Not localeCompare: this order feeds the dedup key, so it must be identical in every
    // browser, and localeCompare is locale-dependent.
    var byName = function byName(a, b) {
      return a < b ? -1 : a > b ? 1 : 0;
    };
    // Built-ins keep their positions and additions sort after them, so a dedup key depends on
    // which params are configured, not the order they were typed.
    var effectiveAllowlist = function effectiveAllowlist(extras) {
      if (extras === void 0) {
        extras = [];
      }
      return ALLOWED_QUERY_PARAMS.concat(extras.filter(function (name) {
        return !isBuiltIn(name);
      }).sort(byName));
    };
    // Over-long custom values are dropped rather than truncated: two truncated values could
    // share a dedup key and swallow a real page view.
    var isWithinValueLimit = function isWithinValueLimit(name, value) {
      return isBuiltIn(name) || value.length <= MAX_CUSTOM_QUERY_PARAM_VALUE_LENGTH;
    };
    // A prefix match is a platform name, not a configured extra, so the custom
    // value limit does not apply. A name already on the allowlist keeps that
    // position instead of being appended again.
    var prefixMatchedParams = function prefixMatchedParams(href, allowlist) {
      var allParams = queryStringParser(href);
      return Object.keys(allParams).filter(function (name) {
        return hasAllowedPrefix(name) && allParams[name] && allowlist.indexOf(name) === -1;
      }).sort(byName).map(function (name) {
        return {
          name: name,
          value: allParams[name]
        };
      });
    };
    var allowedQueryParams = function allowedQueryParams(href, extras) {
      if (extras === void 0) {
        extras = [];
      }
      var allowlist = effectiveAllowlist(extras);
      var found = queryStringParser(href, allowlist);
      var listed = allowlist.filter(function (name) {
        return hasOwnProp(found, name);
      }).filter(function (name) {
        return isWithinValueLimit(name, found[name]);
      }).map(function (name) {
        return {
          name: name,
          value: found[name]
        };
      });
      return listed.concat(prefixMatchedParams(href, allowlist));
    };
    var paramsToAttributes = function paramsToAttributes(params) {
      var attributes = {};
      params.forEach(function (_a) {
        var name = _a.name,
          value = _a.value;
        attributes[name] = value;
      });
      return attributes;
    };
    // Absent rather than false on a manual page view, so the attribute is only ever
    // added by the automatic emitters. Shared by both of them so the key and that
    // rule have one definition instead of two that can drift.
    var autoPageViewAttribute = function autoPageViewAttribute(isAutoPageView) {
      var _a;
      return isAutoPageView ? (_a = {}, _a[AUTO_PAGE_VIEW_ATTRIBUTE] = true, _a) : {};
    };
    // Values are re-encoded because they arrive decoded: `{q: 'a&search=b'}` would otherwise
    // key the same as `{q: 'a', search: 'b'}` and dedup a real navigation away.
    var pageKey = function pageKey(page) {
      var query = page.params.map(function (_a) {
        var name = _a.name,
          value = _a.value;
        return "".concat(name, "=").concat(encodeURIComponent(value));
      }).join('&');
      return query ? "".concat(page.path, "?").concat(query) : page.path;
    };
    // Dedup keys on the pageKey above: a change to any captured param is a new page
    // (`?page=2` is a distinct pagination view), while a hash-only change, or a
    // change confined to params we do not capture, is the same page.
    var isNewPage = function isNewPage(lastKey, candidateKey) {
      return candidateKey !== lastKey;
    };
    // Mirrors the event shape of the public mParticle.logPageView(), but carries the
    // path and query params captured when the navigation was accepted rather than the
    // live location.
    var buildPageViewEvent = function buildPageViewEvent(_a) {
      var params = _a.params,
        hostname = _a.hostname,
        title = _a.title,
        path = _a.path,
        isAutoPageView = _a.isAutoPageView;
      return {
        messageType: MessageType$1.PageView,
        name: 'PageView',
        // Params spread first, then the core fields by name, so a core field always
        // wins. No allowlist entry collides with hostname/title/path today; naming
        // them here is what keeps a later addition from silently overwriting one.
        data: __assign(__assign(__assign({}, paramsToAttributes(params)), {
          hostname: hostname,
          title: title,
          // Masked here, not in the page snapshot, whose raw path tells one page from the next.
          path: pageUrlPath(path)
        }), autoPageViewAttribute(isAutoPageView)),
        eventType: EventType.Unknown
      };
    };
    // ---------------------------------------------------------------------------
    // Window-scoped APV state. Every read and write goes through these helpers, so
    // neither the tracker nor mp-instance touches `window` directly and
    // `typeof window` is checked in exactly one place.
    // ---------------------------------------------------------------------------
    var apvWindow = function apvWindow() {
      return typeof window === 'undefined' ? null : window;
    };
    var freshState = function freshState() {
      return {
        initialPageViewFired: false
      };
    };
    // Reads tolerate absent state, so a read never mutates `window`. Only the
    // writers below create it.
    var readState = function readState() {
      var win = apvWindow();
      return win ? win[WIN_APV_KEY] : undefined;
    };
    var writeState = function writeState() {
      var win = apvWindow();
      if (!win) {
        return null;
      }
      if (!win[WIN_APV_KEY]) {
        win[WIN_APV_KEY] = freshState();
      }
      return win[WIN_APV_KEY];
    };
    var getActiveTracker = function getActiveTracker() {
      var state = readState();
      return state ? state.tracker : undefined;
    };
    var hasInitialPageViewFired = function hasInitialPageViewFired() {
      var state = readState();
      return !!(state && state.initialPageViewFired);
    };
    var markInitialPageViewFired = function markInitialPageViewFired() {
      var state = writeState();
      if (state) {
        state.initialPageViewFired = true;
      }
    };
    // Returns the page to its pre-APV state: stops the active tracker (restoring the
    // history methods it patched), then swaps in fresh state. The state object is the
    // authoritative handle, so this reaches trackers whose owning module is gone.
    var resetPageViewTracking = function resetPageViewTracking() {
      var win = apvWindow();
      if (!win) {
        return;
      }
      var active = getActiveTracker();
      if (active) {
        active.teardown();
      }
      // One reassignment replaces every flag at once, so nothing can be left behind
      // whatever shape the previous state was in.
      win[WIN_APV_KEY] = freshState();
    };
    var setActiveTracker = function setActiveTracker(tracker) {
      var state = writeState();
      if (state) {
        state.tracker = tracker;
      }
    };
    var clearActiveTracker = function clearActiveTracker(tracker) {
      var state = readState();
      if (state && state.tracker === tracker) {
        state.tracker = undefined;
      }
    };
    var currentPage = function currentPage(extras) {
      return {
        path: window.location.pathname,
        params: allowedQueryParams(getHref(), extras)
      };
    };
    // Log-safe description of a page: the path, plus the NAMES of the captured
    // params. Values are deliberately omitted \u2014 verbose logging goes to the console,
    // and session-replay tooling ships console output off-domain, which is not a
    // place for an OAuth code or a consumer's search terms.
    // Only reachable before init() assigns lastPage, which is ahead of any navigation
    // handler being able to run, so this returns nothing rather than a sentinel.
    var describePage = function describePage(page) {
      if (!page) {
        return '';
      }
      var names = page.params.map(function (_a) {
        var name = _a.name;
        return name;
      });
      // A log line is read by no output, so it takes the click path's fuller rules.
      var path = pagePath(page.path);
      return names.length ? "".concat(path, " (params: ").concat(names.join(), ")") : path;
    };
    // ---------------------------------------------------------------------------
    // History patching
    // ---------------------------------------------------------------------------
    // ---------------------------------------------------------------------------
    // Tracker
    // ---------------------------------------------------------------------------
    var PageViewTracker = /** @class */function () {
      function PageViewTracker(mpInstance, options) {
        this.lastPage = null;
        this.active = false;
        this.customQueryParams = [];
        this.pendingNavigations = [];
        this.undoHistoryPatch = null;
        this.mpInstance = mpInstance;
        this.isAutoPageView = !!(options && options.isAutoPageView);
      }
      Object.defineProperty(PageViewTracker.prototype, "isActive", {
        // True while this tracker owns the history patch and is listening for
        // navigations. Flips to false on teardown, including the teardown a
        // successor tracker performs during a handoff. Read-only, and the one thing
        // worth checking on `window.__mpApv__.tracker` from a console.
        get: function get() {
          return this.active;
        },
        enumerable: false,
        configurable: true
      });
      PageViewTracker.prototype.init = function () {
        var _this = this;
        this.log('[init] PageViewTracker Init');
        if (!supportsHistoryTracking(apvWindow())) {
          this.log('[init] unsupported environment (no History API), not starting');
          return;
        }
        // Take over from whichever tracker is currently active: one left behind by
        // a previous module load, or this same tracker on a repeat
        // mParticle.init(). Their pending navigations are transferred rather than
        // dropped \u2014 a route change may have queued a deferred fire that has not
        // flushed yet, and dropping it loses a page view entirely.
        var active = getActiveTracker();
        var inheritedPages = this.retire(active);
        if (this.active && active !== this) {
          inheritedPages = inheritedPages.concat(this.retire(this));
        }
        this.active = true;
        this.customQueryParams = this.readCustomQueryParams();
        this.lastPage = currentPage(this.customQueryParams);
        this.log("[init] seeded lastPage: ".concat(describePage(this.lastPage)));
        this.undoHistoryPatch = subscribeToRouteChange('pageView', function (source) {
          return _this.safeHandleNavigation(source);
        }, function (message) {
          return _this.log(message);
        });
        setActiveTracker(this);
        this.log('[init] patched pushState/replaceState + listening for popstate');
        inheritedPages.forEach(function (page) {
          return _this.scheduleFire(page);
        });
      };
      PageViewTracker.prototype.teardown = function () {
        // Discard pending deferred fires (e.g. AutoLogPageView switched off on
        // re-init). A handoff calls takePendingNavigations() first, so by this
        // point those paths are already transferred rather than dropped.
        this.takePendingNavigations();
        if (this.undoHistoryPatch) {
          this.undoHistoryPatch();
          this.undoHistoryPatch = null;
        }
        this.active = false;
        clearActiveTracker(this);
      };
      PageViewTracker.prototype.readCustomQueryParams = function () {
        var _a = this.mpInstance._Store.SDKConfig.autoLogPageViewQueryParams || {},
          _b = _a.allowed,
          allowed = _b === void 0 ? [] : _b,
          _c = _a.rejectedPositions,
          rejectedPositions = _c === void 0 ? [] : _c,
          _d = _a.overLimit,
          overLimit = _d === void 0 ? 0 : _d;
        if (rejectedPositions.length) {
          this.mpInstance.Logger.warning('mParticle APV: ignoring invalid additional page view query ' + "parameters at positions ".concat(rejectedPositions.join(', ')));
        }
        if (overLimit) {
          this.mpInstance.Logger.warning("mParticle APV: ignoring ".concat(overLimit, " additional page view ") + "query parameters beyond the limit of " + "".concat(MAX_CUSTOM_QUERY_PARAMS));
        }
        if (allowed.length) {
          this.log("[init] additional query params: ".concat(allowed.join()));
        }
        return allowed;
      };
      // Stops the outgoing tracker and returns the pages it had queued so this
      // tracker can re-schedule them once it is active. Private, but reachable
      // across instances: the handoff protocol stays internal to the class.
      PageViewTracker.prototype.retire = function (outgoing) {
        if (!outgoing) {
          return [];
        }
        this.log(outgoing === this ? '[init] retiring this tracker for a repeat mParticle.init() \u2014 transferring pending navigations and tearing down' : '[init] retiring a tracker from a previous module load \u2014 transferring pending navigations and tearing down');
        var pages = outgoing.takePendingNavigations();
        outgoing.teardown();
        return pages;
      };
      // Cancels this tracker's deferred fires and hands back their captured pages.
      PageViewTracker.prototype.takePendingNavigations = function () {
        var pending = this.pendingNavigations;
        this.pendingNavigations = [];
        pending.forEach(function (_a) {
          var timeoutId = _a.timeoutId;
          return clearTimeout(timeoutId);
        });
        return pending.map(function (_a) {
          var page = _a.page;
          return page;
        });
      };
      PageViewTracker.prototype.safeHandleNavigation = function (source) {
        // An orphaned wrapper still calls in: teardown can only restore a history
        // method that is still ours, so one a third party patched over stays
        // installed and keeps firing at a dead tracker. Bail before touching
        // lastPath or queueing a fire the flush would just abort. Guarding here
        // rather than at each wrapper also covers the popstate path.
        if (!this.active) {
          return;
        }
        try {
          this.handleNavigation(source);
        } catch (e) {
          this.log("[error] navigation handler threw (".concat(source, "), page view skipped: ").concat(e));
        }
      };
      PageViewTracker.prototype.handleNavigation = function (source) {
        var candidate = currentPage(this.customQueryParams);
        var lastKey = this.lastPage ? pageKey(this.lastPage) : null;
        this.log("[detect] navigation signal (source: ".concat(source, ", candidate: ").concat(describePage(candidate), ", last: ").concat(describePage(this.lastPage), ")"));
        if (!isNewPage(lastKey, pageKey(candidate))) {
          this.log("[dedupe] page unchanged, skipping (source: ".concat(source, ", page: ").concat(describePage(candidate), ")"));
          return;
        }
        this.log("[accept] page changed, scheduling fire (source: ".concat(source, ", from: ").concat(describePage(this.lastPage), ", to: ").concat(describePage(candidate), ")"));
        this.lastPage = candidate;
        this.scheduleFire(candidate);
      };
      // Deferred by a macrotask so the router's post-navigation render commit has a
      // chance to update document.title before the event is built. The path and
      // query params are snapshotted now because they are already settled, whereas a
      // same-tick navigation would overwrite window.location before the flush reads
      // it.
      PageViewTracker.prototype.scheduleFire = function (page) {
        var _this = this;
        var timeoutId = setTimeout(function () {
          _this.pendingNavigations = _this.pendingNavigations.filter(function (p) {
            return p.timeoutId !== timeoutId;
          });
          if (!_this.active) {
            _this.log('[defer] fire aborted, tracker inactive (torn down before flush)');
            return;
          }
          _this.mpInstance._SessionManager.resetSessionTimer();
          _this.firePageView(page);
        }, 0);
        this.pendingNavigations.push({
          page: page,
          timeoutId: timeoutId
        });
      };
      PageViewTracker.prototype.firePageView = function (page) {
        var title = window.document.title;
        var event = buildPageViewEvent(__assign(__assign({}, page), {
          hostname: window.location.hostname,
          title: title,
          isAutoPageView: this.isAutoPageView
        }));
        this.log("[fire] deferred flush -> _Events.logEvent(PageView) (page: ".concat(describePage(page), ", title: ").concat(title, ")"));
        this.mpInstance._Events.logEvent(event);
      };
      PageViewTracker.prototype.log = function (message) {
        this.mpInstance.Logger.verbose("mParticle APV: ".concat(message));
      };
      return PageViewTracker;
    }();

    // The one rule for a URL that leaves the SDK, shared with kits through
    // `mParticle._cleanUrl`. `path` keeps scheme, host and path, with any path
    // segment that can single out one shopper as `*` (see pageUrlPath). `full` adds the
    // query params an auto page view captures by default and the campaign
    // attribution params, then the fragment, a hash route's path masked the same way.
    var UrlMode = {
      Path: 'path',
      Full: 'full',
      // A path for a log or an error report, masked with the click path's fuller
      // rules, since no output reads it as a page.
      Report: 'report'
    };
    // Campaign attribution and ad-network click ids. URLs keep them; an auto page view
    // carries one as an attribute only when an input configures it.
    var URL_ATTRIBUTION_QUERY_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic', 'gad_source', 'gad_campaignid', 'mc_cid', 'gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid', 'ttclid', 'twclid', 'li_fat_id', 'dclid', 'srsltid', 'epik', 'ScCid', 'irclickid', 'rtid', 'rclid'];
    var URL_ATTRIBUTION_QUERY_PARAMS_LOWER = URL_ATTRIBUTION_QUERY_PARAMS.map(function (name) {
      return name.toLowerCase();
    });
    var isUrlQueryParam = function isUrlQueryParam(name) {
      return isAllowedQueryParam(name) || URL_ATTRIBUTION_QUERY_PARAMS_LOWER.indexOf(name.toLowerCase()) !== -1;
    };
    // OAuth 2.0 / OIDC authorization-flow params. They stay off URLs even where the
    // page view allowlist admits them, because a URL travels on every event.
    var EXCLUDED_URL_QUERY_PARAMS = ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'code', 'nonce'];
    // An OAuth implicit or OIDC fragment response puts its tokens in `#k=v&...`.
    var EXCLUDED_URL_FRAGMENT_PARAMS = EXCLUDED_URL_QUERY_PARAMS.concat(['access_token', 'id_token', 'refresh_token', 'provider_token', 'provider_refresh_token']);
    // Allowlisted params whose value is itself a URL, so it can carry a query.
    var URL_VALUED_QUERY_PARAMS = ['ref', 'referrer'];
    var USERINFO = /^((?:[a-z][a-z0-9+.-]*:)?\/\/)[^/]*@/i;
    var ORIGIN = /^(?:[a-z][a-z0-9+.-]*:)?\/\/[^/]*/i;
    // Only a URL or a path is masked. A bare value, such as `ref=spring2024`, is a
    // code rather than a page, and stays as written.
    var maskPath = function maskPath(url, mask) {
      if (mask === void 0) {
        mask = pageUrlPath;
      }
      var origin = ORIGIN.exec(url);
      if (origin) {
        return origin[0] + mask(url.slice(origin[0].length));
      }
      return url.charAt(0) === '/' ? mask(url) : url;
    };
    // A hash route keeps its `#` or `#!` and has its path masked as the URL's own.
    // The `&` pairs or flags after the path lose the OAuth/OIDC ones, as a bare
    // fragment's pairs do.
    var maskRoute = function maskRoute(route) {
      var prefix = /^#!?/.exec(route)[0];
      var pairsStart = route.indexOf('&');
      var pathEnd = pairsStart === -1 ? route.length : pairsStart;
      var pairs = route.slice(pathEnd).split('&').slice(1).filter(keepsFragmentPair).map(function (pair) {
        return "&".concat(pair);
      }).join('');
      return prefix + pageUrlPath(route.slice(prefix.length, pathEnd)) + pairs;
    };
    var decodeQueryComponent = function decodeQueryComponent(component) {
      return decodeURIComponent(component.replace(/\+/g, ' '));
    };
    var cleanQueryPair = function cleanQueryPair(pair) {
      var separator = pair.indexOf('=');
      var rawName = separator === -1 ? pair : pair.slice(0, separator);
      var name;
      try {
        name = decodeQueryComponent(rawName);
      } catch (e) {
        return null;
      }
      var lowerName = name.toLowerCase();
      if (!name || !isUrlQueryParam(name) || EXCLUDED_URL_QUERY_PARAMS.indexOf(lowerName) !== -1) {
        return null;
      }
      if (separator === -1 || URL_VALUED_QUERY_PARAMS.indexOf(lowerName) === -1) {
        return pair;
      }
      var value;
      try {
        value = decodeQueryComponent(pair.slice(separator + 1));
      } catch (e) {
        return null;
      }
      var cleanedValue = cleanUrl(value, UrlMode.Path);
      return cleanedValue === value ? pair : "".concat(rawName, "=").concat(encodeURIComponent(cleanedValue));
    };
    var cleanQuery = function cleanQuery(query) {
      return query.split('&').map(cleanQueryPair).filter(function (pair) {
        return pair !== null;
      }).join('&');
    };
    var keepsFragmentPair = function keepsFragmentPair(pair) {
      try {
        var name_1 = decodeQueryComponent(pair.split('=')[0]);
        return EXCLUDED_URL_FRAGMENT_PARAMS.indexOf(name_1.toLowerCase()) === -1;
      } catch (e) {
        return false;
      }
    };
    // A hash route (`#/...`, `#!...`, or a path with no `=` before its `?`) keeps
    // its path; a query inside it gets the same allowlist as the URL's own query.
    // A fragment of bare pairs loses the OAuth/OIDC ones.
    var cleanFragment = function cleanFragment(hash) {
      var queryStart = hash.indexOf('?');
      var route = queryStart === -1 ? hash : hash.slice(0, queryStart);
      // `#/\u2026`, `#!\u2026`, or a fragment with a `/` before any `&` or `?`, as
      // `#orders/12345678` is in routers that drop the leading slash.
      // A `/` counts only before any `=`, so a bare pair such as
      // `#access_token=abc/def` is never read as a route.
      var isHashRoute = /^#!|^#[^?&=]*\//.test(hash);
      var isRoute = isHashRoute || queryStart !== -1 && route.indexOf('=') === -1;
      if (isRoute && queryStart !== -1) {
        var query = cleanQuery(hash.slice(queryStart + 1));
        return maskRoute(route) + (query ? "?".concat(query) : '');
      }
      // A plain anchor such as `#reviews` names a part of the page, not a route.
      if (hash.indexOf('=') === -1) {
        return isHashRoute ? maskRoute(hash) : hash;
      }
      // A hash route's path leads its pairs, as in `#/cb&tab=2`.
      var pairs = hash.slice(1).split('&').map(function (pair, i) {
        return i === 0 && isHashRoute ? maskRoute("#".concat(pair)).slice(1) : pair;
      }).filter(keepsFragmentPair).join('&');
      return pairs ? "#".concat(pairs) : '';
    };
    // String-based rather than `new URL`, so kept pairs and the fragment go out
    // exactly as the browser reported them and no environment can parse differently.
    // An unknown mode is treated as `path`.
    var cleanUrl = function cleanUrl(href, mode) {
      if (typeof href !== 'string' || !href) {
        return '';
      }
      var hashStart = href.indexOf('#');
      var hash = hashStart === -1 ? '' : href.slice(hashStart);
      var beforeHash = hashStart === -1 ? href : href.slice(0, hashStart);
      var queryStart = beforeHash.indexOf('?');
      var path = maskPath((queryStart === -1 ? beforeHash : beforeHash.slice(0, queryStart)).replace(USERINFO, '$1'), mode === UrlMode.Report ? pagePath : pageUrlPath);
      if (mode !== UrlMode.Full) {
        return path;
      }
      var query = queryStart === -1 ? '' : cleanQuery(beforeHash.slice(queryStart + 1));
      return path + (query ? "?".concat(query) : '') + cleanFragment(hash);
    };
    // The current page as it may appear on an event.
    var cleanPageHref = function cleanPageHref() {
      return cleanUrl(getHref(), UrlMode.Full);
    };

    // Outcome of a vault write so callers can react to the cause of a failure.
    // `Unavailable` covers storage being blocked/disabled (e.g. SecurityError),
    // where retrying with a smaller payload cannot succeed.
    var StorageResult;
    (function (StorageResult) {
      StorageResult["Success"] = "Success";
      StorageResult["QuotaExceeded"] = "QuotaExceeded";
      StorageResult["Unavailable"] = "Unavailable";
    })(StorageResult || (StorageResult = {}));
    var isQuotaExceededError = function isQuotaExceededError(e) {
      return e instanceof DOMException && (
      // Standard quota errors, plus Firefox's legacy name/code.
      e.code === 22 || e.code === 1014 || e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    };
    var BaseVault = /** @class */function () {
      /**
       *
       * @param {string} storageKey the local storage key string
       * @param {Storage} storageObject Web API Storage object that is being used
       */
      function BaseVault(storageKey, storageObject) {
        this._storageKey = storageKey;
        this.storageObject = storageObject;
        this.contents = this.retrieve();
      }
      /**
       * Stores a StorableItem to Storage
       * @method store
       * @param item {StorableItem}
       */
      BaseVault.prototype.store = function (item) {
        var stringifiedItem;
        try {
          if (isNumber(item) || !isEmpty(item)) {
            stringifiedItem = JSON.stringify(item);
          } else {
            stringifiedItem = '';
          }
          this.storageObject.setItem(this._storageKey, stringifiedItem);
          this.contents = item;
          return StorageResult.Success;
        } catch (e) {
          return isQuotaExceededError(e) ? StorageResult.QuotaExceeded : StorageResult.Unavailable;
        }
      };
      /**
       * Retrieve StorableItem from Storage
       * @method retrieve
       * @returns {StorableItem}
       */
      BaseVault.prototype.retrieve = function () {
        // https://go.mparticle.com/work/SQDSDKS-5022
        try {
          var item = this.storageObject.getItem(this._storageKey);
          this.contents = item ? JSON.parse(item) : null;
        } catch (e) {
          this.contents = null;
        }
        return this.contents;
      };
      /**
       * Removes all persisted data from Storage based on this vault's `key`
       * Will remove storage key from Storage as well
       * @method purge
       */
      BaseVault.prototype.purge = function () {
        this.contents = null;
        try {
          this.storageObject.removeItem(this._storageKey);
        } catch (e) {
          // Storage persistence is best effort.
        }
      };
      return BaseVault;
    }();
    var LocalStorageVault = /** @class */function (_super) {
      __extends(LocalStorageVault, _super);
      function LocalStorageVault(storageKey) {
        return _super.call(this, storageKey, window.localStorage) || this;
      }
      return LocalStorageVault;
    }(BaseVault);
    var SessionStorageVault = /** @class */function (_super) {
      __extends(SessionStorageVault, _super);
      function SessionStorageVault(storageKey) {
        return _super.call(this, storageKey, window.sessionStorage) || this;
      }
      return SessionStorageVault;
    }(BaseVault);
    // DisabledVault is used when persistence is disabled by privacy flags.
    var DisabledVault = /** @class */function (_super) {
      __extends(DisabledVault, _super);
      function DisabledVault(storageKey) {
        var _this = _super.call(this, storageKey, window.localStorage) || this;
        _this.contents = null;
        _this.storageObject.removeItem(_this._storageKey);
        return _this;
      }
      DisabledVault.prototype.store = function (_item) {
        this.contents = null;
        return StorageResult.Success;
      };
      DisabledVault.prototype.retrieve = function () {
        return this.contents;
      };
      DisabledVault.prototype.purge = function () {
        this.contents = null;
      };
      return DisabledVault;
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
              for (var key in headers) {
                if (headers.hasOwnProperty(key)) {
                  xhr.setRequestHeader(key, headers[key]);
                }
              }
              xhr.send(data);
            })];
          });
        });
      };
      return XHRUploader;
    }(AsyncUploader);

    function hasMPIDAndUserLoginChanged(previousUser, newUser) {
      return !previousUser || newUser.getMPID() !== previousUser.getMPID() || previousUser.isLoggedIn() !== newUser.isLoggedIn();
    }
    // https://go.mparticle.com/work/SQDSDKS-6504
    function hasMPIDChanged(prevUser, identityApiResult) {
      return !prevUser || prevUser.getMPID() && identityApiResult.mpid && identityApiResult.mpid !== prevUser.getMPID();
    }
    // https://go.mparticle.com/work/SQDSDKS-7136
    function appendUserInfo(user, event) {
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
      if (isObject(dtoUserIdentities)) {
        if (Object.keys(dtoUserIdentities).length) {
          for (var key in dtoUserIdentities) {
            var userIdentity = {};
            userIdentity.Identity = dtoUserIdentities[key];
            userIdentity.Type = parseNumber(key);
            validUserIdentities.push(userIdentity);
          }
        }
      }
      event.UserIdentities = validUserIdentities;
    }

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
       * @param {IMParticleWebSDKInstance} mpInstance - the mParticle SDK instance
       * @param {number} uploadInterval - the desired upload interval in milliseconds
       */
      function BatchUploader(mpInstance, uploadInterval) {
        var _a;
        var _b, _c;
        this.offlineStorageEnabled = false;
        this.lastASTEventTime = 0;
        this.AST_DEBOUNCE_MS = 1000; // 1 second debounce
        this.uploadIntervalTimerId = null;
        this.exitHandler = null;
        this.visibilityChangeHandler = null;
        this.destroyed = false;
        // The order this page's uploads first picked each batch up in, by request
        // id. Batches enter uploads in creation order, so this keeps that order for
        // batches that share a millisecond.
        this.batchOrder = new Map();
        this.nextBatchOrder = 0;
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
        // When noFunctional is true, prevent events/batches storage
        var noFunctional = (_b = mpInstance._CookieConsentManager) === null || _b === void 0 ? void 0 : _b.getNoFunctional();
        if (this.offlineStorageEnabled && !noFunctional) {
          this.eventVault = new SessionStorageVault("".concat(mpInstance._Store.storageName, "-events"));
          this.batchVault = new LocalStorageVault("".concat(mpInstance._Store.storageName, "-batches"));
          // Load Events from Session Storage in case we have any in storage.
          // retrieve() returns null for empty/corrupt storage, so default to
          // an empty array to keep the spread safe.
          (_a = this.eventsQueuedForProcessing).push.apply(_a, (_c = this.eventVault.retrieve()) !== null && _c !== void 0 ? _c : []);
        }
        var _d = this.mpInstance._Store,
          SDKConfig = _d.SDKConfig,
          devToken = _d.devToken;
        var baseUrl = this.mpInstance._Helpers.createServiceUrl(SDKConfig.v3SecureServiceUrl, devToken);
        this.uploadUrl = "".concat(baseUrl, "/events");
        this.uploader = window.fetch ? new FetchUploader(this.uploadUrl) : new XHRUploader(this.uploadUrl);
        this.triggerUploadInterval(true, false);
        this.addEventListeners();
      }
      /**
       * Cleans up timers and event listeners to prevent leaks when the SDK
       * is re-initialized (e.g. between tests or on repeated init calls).
       */
      BatchUploader.prototype.destroy = function () {
        this.destroyed = true;
        if (this.uploadIntervalTimerId !== null) {
          clearTimeout(this.uploadIntervalTimerId);
          this.uploadIntervalTimerId = null;
        }
        if (this.visibilityChangeHandler) {
          document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
        }
        if (this.exitHandler) {
          window.removeEventListener('beforeunload', this.exitHandler);
          window.removeEventListener('pagehide', this.exitHandler);
        }
        this.exitHandler = null;
        this.visibilityChangeHandler = null;
      };
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
      // debounce AST just in case multiple events are fired in a short period of time due to browser differences
      BatchUploader.prototype.shouldDebounceAndUpdateLastASTTime = function () {
        var now = Date.now();
        if (now - this.lastASTEventTime < this.AST_DEBOUNCE_MS) {
          return true;
        }
        this.lastASTEventTime = now;
        return false;
      };
      // https://go.mparticle.com/work/SQDSDKS-7133
      BatchUploader.prototype.createBackgroundASTEvent = function () {
        var _a;
        var now = Date.now();
        var _b = this.mpInstance,
          _Store = _b._Store,
          Identity = _b.Identity,
          _timeOnSiteTimer = _b._timeOnSiteTimer,
          _Helpers = _b._Helpers;
        var sessionId = _Store.sessionId,
          deviceId = _Store.deviceId,
          sessionStartDate = _Store.sessionStartDate,
          SDKConfig = _Store.SDKConfig;
        var generateUniqueId = _Helpers.generateUniqueId,
          getFeatureFlag = _Helpers.getFeatureFlag;
        var getCurrentUser = Identity.getCurrentUser;
        var event = {
          AppName: SDKConfig.appName,
          AppVersion: SDKConfig.appVersion,
          Package: SDKConfig.package,
          EventDataType: MessageType$1.AppStateTransition,
          Timestamp: now,
          SessionId: sessionId,
          DeviceId: deviceId,
          IsFirstRun: false,
          SourceMessageId: generateUniqueId(),
          SDKVersion: Constants.sdkVersion,
          CustomFlags: {},
          EventAttributes: {},
          SessionStartDate: (sessionStartDate === null || sessionStartDate === void 0 ? void 0 : sessionStartDate.getTime()) || now,
          Debug: SDKConfig.isDevelopmentMode,
          ActiveTimeOnSite: (_timeOnSiteTimer === null || _timeOnSiteTimer === void 0 ? void 0 : _timeOnSiteTimer.getTimeInForeground()) || 0,
          TotalTimeOnSite: ((_a = _Store.getTotalTimeOnSite) === null || _a === void 0 ? void 0 : _a.call(_Store)) || 0,
          PageUrl: cleanPageHref() || null,
          IsBackgroundAST: true
        };
        var customFlags = __assign({}, event.CustomFlags);
        var integrationAttributes = _Store.integrationAttributes;
        // https://go.mparticle.com/work/SQDSDKS-5053
        if (isIntegrationCaptureEnabled(getFeatureFlag)) {
          // Attempt to recapture click IDs in case a third party integration
          // has added or updated  new click IDs since the last event was sent.
          this.mpInstance._IntegrationCapture.capture();
          var transformedClickIDs = this.mpInstance._IntegrationCapture.getClickIdsAsCustomFlags();
          customFlags = __assign(__assign({}, transformedClickIDs), customFlags);
          var transformedIntegrationAttributes = this.mpInstance._IntegrationCapture.getClickIdsAsIntegrationAttributes();
          integrationAttributes = __assign(__assign({}, transformedIntegrationAttributes), integrationAttributes);
        }
        event.CustomFlags = customFlags;
        event.IntegrationAttributes = integrationAttributes;
        appendUserInfo(getCurrentUser(), event);
        return event;
      };
      // Adds listeners to be used trigger Navigator.sendBeacon if the browser
      // loses focus for any reason, such as closing browser tab or minimizing window
      BatchUploader.prototype.addEventListeners = function () {
        var _this_1 = this;
        var _this = this;
        var handleExit = function handleExit() {
          // Check for debounce before creating and queueing event
          var getFeatureFlag = _this_1.mpInstance._Helpers.getFeatureFlag;
          var AstBackgroundEvents = Constants.FeatureFlags.AstBackgroundEvents;
          if (getFeatureFlag(AstBackgroundEvents)) {
            if (_this.shouldDebounceAndUpdateLastASTTime()) {
              return;
            }
            // Add application state transition event to queue
            var event_1 = _this.createBackgroundASTEvent();
            _this.queueEvent(event_1);
          }
          // Then trigger the upload with beacon
          _this.prepareAndUpload(false, _this.isBeaconAvailable());
        };
        this.exitHandler = handleExit;
        this.visibilityChangeHandler = function () {
          if (document.visibilityState === 'hidden') {
            handleExit();
          }
        };
        // visibility change is a document property, not window
        document.addEventListener('visibilitychange', this.visibilityChangeHandler);
        window.addEventListener('beforeunload', handleExit);
        window.addEventListener('pagehide', handleExit);
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
        this.uploadIntervalTimerId = setTimeout(function () {
          _this_1.prepareAndUpload(triggerFuture, useBeacon);
        }, this.uploadIntervalMillis);
      };
      /**
       * This method will queue a single Event which will eventually be processed into a Batch
       * @param event event that should be queued
       */
      BatchUploader.prototype.queueEvent = function (event) {
        if (isEmpty(event)) {
          return;
        }
        this.eventsQueuedForProcessing.push(event);
        if (this.offlineStorageEnabled && this.eventVault) {
          this.eventVault.store(this.eventsQueuedForProcessing);
        }
        if (this.mpInstance.Logger.isVerbose()) {
          var eventToLog = obfuscateDevData(event, this.mpInstance._Store.SDKConfig.isDevelopmentMode);
          this.mpInstance.Logger.verbose("Queuing event: ".concat(JSON.stringify(eventToLog)));
          this.mpInstance.Logger.verbose("Queued event count: ".concat(this.eventsQueuedForProcessing.length));
        }
        if (this.shouldTriggerImmediateUpload(event.EventDataType)) {
          this.prepareAndUpload(false, false);
        }
      };
      // https://go.mparticle.com/work/SQDSDKS-3720
      BatchUploader.prototype.shouldTriggerImmediateUpload = function (eventDataType) {
        var priorityEvents = [MessageType$1.Commerce, MessageType$1.UserIdentityChange];
        return !this.batchingEnabled || priorityEvents.includes(eventDataType);
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
        var _a;
        if (triggerFuture === void 0) {
          triggerFuture = false;
        }
        if (useBeacon === void 0) {
          useBeacon = false;
        }
        return __awaiter(this, void 0, void 0, function () {
          var currentUser, currentEvents, newBatches, batchesToUpload, batchesThatDidNotUpload, retriedIds;
          var _b, _c, _d;
          var _this_1 = this;
          return __generator(this, function (_e) {
            switch (_e.label) {
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
                  (_b = this.batchesQueuedForProcessing).unshift.apply(_b, (_a = this.batchVault.retrieve()) !== null && _a !== void 0 ? _a : []);
                  // Remove batches from local storage before transmit to
                  // prevent duplication
                  this.batchVault.purge();
                }
                if (!isEmpty(newBatches)) {
                  (_c = this.batchesQueuedForProcessing).push.apply(_c, newBatches);
                }
                batchesToUpload = this.batchesQueuedForProcessing;
                this.batchesQueuedForProcessing = [];
                batchesToUpload.forEach(function (batch) {
                  if (!_this_1.batchOrder.has(batch.source_request_id)) {
                    _this_1.batchOrder.set(batch.source_request_id, _this_1.nextBatchOrder++);
                  }
                });
                return [4 /*yield*/, this.uploadBatches(batchesToUpload, useBeacon)];
              case 1:
                batchesThatDidNotUpload = _e.sent();
                retriedIds = (batchesThatDidNotUpload || []).map(function (batch) {
                  return batch.source_request_id;
                });
                batchesToUpload.forEach(function (batch) {
                  if (retriedIds.indexOf(batch.source_request_id) === -1) {
                    _this_1.batchOrder.delete(batch.source_request_id);
                  }
                });
                // Batches that do not successfully upload are added back to the process queue
                // in the order they were created so that we can attempt re-transmission in
                // the same sequence. This is to prevent any potential data corruption.
                if (!isEmpty(batchesThatDidNotUpload)) {
                  // TODO: https://go.mparticle.com/work/SQDSDKS-5165
                  (_d = this.batchesQueuedForProcessing).unshift.apply(_d, batchesThatDidNotUpload);
                }
                // Update Offline Storage with current state of batch queue
                if (!useBeacon && this.offlineStorageEnabled && this.batchVault) {
                  // Note: since beacon is "Fire and forget" it will empty `batchesThatDidNotUplod`
                  // regardless of whether the batches were successfully uploaded or not. We should
                  // therefore NOT overwrite Offline Storage when beacon returns, so that we can retry
                  // uploading saved batches at a later time. Batches should only be removed from
                  // Local Storage once we can confirm they are successfully uploaded.
                  this.storeBatchesQueuedForProcessing();
                }
                if (triggerFuture && !this.destroyed) {
                  this.triggerUploadInterval(triggerFuture, false);
                }
                return [2 /*return*/];
            }
          });
        });
      };
      BatchUploader.prototype.storeBatchesQueuedForProcessing = function () {
        var _this_1 = this;
        var _a;
        // Another upload may have stored its failed batches while this one was
        // in flight. Merge them in creation order, whichever upload finished
        // first, so they are not overwritten and quota trimming drops the oldest.
        var orderOf = function orderOf(batch) {
          var _a;
          return (_a = _this_1.batchOrder.get(batch.source_request_id)) !== null && _a !== void 0 ? _a : -1;
        };
        var batches = __spreadArray(__spreadArray([], this.batchesQueuedForProcessing, true), (_a = this.batchVault.retrieve()) !== null && _a !== void 0 ? _a : [], true).sort(function (a, b) {
          var _a, _b;
          return orderOf(a) - orderOf(b) || ((_a = a.timestamp_unixtime_ms) !== null && _a !== void 0 ? _a : 0) - ((_b = b.timestamp_unixtime_ms) !== null && _b !== void 0 ? _b : 0);
        });
        // Nothing to persist: reset offline storage to an empty state.
        if (isEmpty(batches)) {
          this.batchVault.store([]);
          this.batchesQueuedForProcessing = [];
          return;
        }
        // Drop oldest batches until storage accepts the payload. Only quota
        // failures are recoverable by trimming; if storage is unavailable,
        // dropping batches won't help, so retain them in memory.
        for (var dropped = 0; dropped < batches.length; dropped++) {
          var result = this.batchVault.store(batches.slice(dropped));
          if (result === StorageResult.Success) {
            this.logDroppedOfflineBatches(dropped);
            this.batchesQueuedForProcessing = [];
            return;
          }
          if (result === StorageResult.Unavailable) {
            this.mpInstance.Logger.warning('Offline batch storage is unavailable. Retaining batches in memory.');
            return;
          }
        }
        // Every attempt stayed over quota, even down to the newest batch.
        // Retain them in memory rather than dropping everything.
        this.mpInstance.Logger.warning('Offline batch storage is over quota. Retaining batches in memory.');
      };
      BatchUploader.prototype.logDroppedOfflineBatches = function (droppedBatchCount) {
        if (droppedBatchCount > 0) {
          this.mpInstance.Logger.warning('Offline batch storage is over quota. Dropped ' + "".concat(droppedBatchCount, " oldest batch(es)."));
        }
      };
      BatchUploader.prototype.uploadBatches = function (batches, useBeacon) {
        return __awaiter(this, void 0, void 0, function () {
          var uploads, uploadsToLog, i, fetchPayload, blob, response, e_1;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                uploads = batches.filter(function (batch) {
                  return !isEmpty(batch.events);
                });
                if (isEmpty(uploads)) {
                  return [2 /*return*/, null];
                }
                if (this.mpInstance.Logger.isVerbose()) {
                  uploadsToLog = obfuscateDevData(uploads, this.mpInstance._Store.SDKConfig.isDevelopmentMode);
                  this.mpInstance.Logger.verbose("Uploading batches: ".concat(JSON.stringify(uploadsToLog)));
                  this.mpInstance.Logger.verbose("Batch count: ".concat(uploads.length));
                }
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
                  this.mpInstance.Logger.verbose("Upload success for request ID: ".concat(uploads[i].source_request_id));
                } else if (response.status >= 500 || response.status === 429) {
                  this.mpInstance.Logger.error("HTTP error status ".concat(response.status, " received"));
                  // Server error, add back current batches and try again later
                  return [2 /*return*/, uploads.slice(i, uploads.length)];
                } else if (response.status >= 401) {
                  this.mpInstance.Logger.error("HTTP error status ".concat(response.status, " while uploading - please verify your API key."));
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
                this.mpInstance.Logger.error("Error sending event to mParticle servers. ".concat(e_1));
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

    var ErrorCodes = {
      UNKNOWN_ERROR: 'UNKNOWN_ERROR',
      UNHANDLED_EXCEPTION: 'UNHANDLED_EXCEPTION',
      IDENTITY_REQUEST: 'IDENTITY_REQUEST',
      IDENTITY_MISMATCH: 'IDENTITY_MISMATCH',
      MP_DEPRECATED_METHOD_USAGE: 'MP_DEPRECATED_METHOD_USAGE'
    };
    var WSDKErrorSeverity = {
      ERROR: 'ERROR',
      INFO: 'INFO',
      WARNING: 'WARNING'
    };

    var Modify$4 = Constants.IdentityMethods.Modify;
    var Validators = {
      // From ./utils
      // Utility Functions for backwards compatability
      isNumber: isNumber,
      isFunction: isFunction,
      isStringOrNumber: isStringOrNumber,
      // Validator Functions
      isValidAttributeValue: isValidAttributeValue,
      // Validator Functions
      // Neither null nor undefined can be a valid Key
      isValidKeyValue: function isValidKeyValue(key) {
        return Boolean(key && !isObject(key) && !Array.isArray(key) && !this.isFunction(key));
      },
      removeFalsyIdentityValues: function removeFalsyIdentityValues(identityApiData, logger) {
        if (!identityApiData || !identityApiData.userIdentities) {
          return identityApiData;
        }
        var cleanedData = {};
        var cleanedUserIdentities = __assign({}, identityApiData.userIdentities);
        for (var identityType in identityApiData.userIdentities) {
          if (identityApiData.userIdentities.hasOwnProperty(identityType)) {
            var value = identityApiData.userIdentities[identityType];
            // Check if value is falsy (undefined, false, 0, '', etc.) but not null
            if (value !== null && !value) {
              logger.warning("Identity value for '".concat(identityType, "' is falsy (").concat(value, "). This value will be removed from the request."));
              delete cleanedUserIdentities[identityType];
            }
          }
        }
        cleanedData.userIdentities = cleanedUserIdentities;
        return cleanedData;
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

    var HTTPCodes$4 = Constants.HTTPCodes;
    /**
     * Sends a POST to mParticle's IDSync Search endpoint and invokes `callback`
     * with the HTTP status and parsed body.
     *
     * Defensive contract:
     *  - No identifier with a non-empty string value -> callback with
     *    `{ httpCode: noHttpCoverage }`, no network call.
     *  - Missing `apiKey` -> callback with `{ httpCode: noHttpCoverage }`,
     *    no network call.
     *  - Network/JSON-parse errors are caught and surfaced via the callback,
     *    never thrown. Network errors are also reported through the optional
     *    `errorReporter` so any registered IErrorReportingService can observe
     *    them (matches the pattern used by identifyRequest in identityApiClient).
     */
    var sendSearchRequest = function sendSearchRequest(knownIdentities, apiKey, requestBuilder, searchUrl, callback, logger, uploader, errorReporter) {
      return __awaiter(void 0, void 0, void 0, function () {
        var safeInvoke, cleanedKnownIdentities, requestEnvelope, requestBody, fetchPayload, api, response, body, xhrLike, e_2, message, reportMessage;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              // Validate the callback up front. If it isn't a function we have nowhere
              // to deliver a result to, so log and bail out without invoking anything.
              if (!isFunction(callback)) {
                logger.error('search called without a callback function; skipping request.');
                return [2 /*return*/];
              }
              safeInvoke = function safeInvoke(result) {
                try {
                  callback(result);
                } catch (e) {
                  logger.error('Error invoking search callback: ' + getErrorMessage(e));
                }
              };
              cleanedKnownIdentities = Validators.removeFalsyIdentityValues({
                userIdentities: knownIdentities !== null && knownIdentities !== void 0 ? knownIdentities : {}
              }, logger).userIdentities;
              // No usable identifier -> deliver httpCode: noHttpCoverage so callers
              // waiting on the callback (e.g. to clear a loading state) don't hang.
              if (!Object.values(cleanedKnownIdentities !== null && cleanedKnownIdentities !== void 0 ? cleanedKnownIdentities : {}).some(function (v) {
                return typeof v === 'string' && v.length > 0;
              })) {
                logger.verbose('Identity search called with empty identifiers; skipping request.');
                safeInvoke({
                  httpCode: HTTPCodes$4.noHttpCoverage
                });
                return [2 /*return*/];
              }
              // No API key -> same: deliver noHttpCoverage rather than hanging.
              if (!apiKey) {
                logger.verbose('search called without a workspace API key; skipping request.');
                safeInvoke({
                  httpCode: HTTPCodes$4.noHttpCoverage
                });
                return [2 /*return*/];
              }
              _a.label = 1;
            case 1:
              _a.trys.push([1, 9,, 10]);
              requestEnvelope = requestBuilder();
              requestBody = __assign(__assign({}, requestEnvelope), {
                known_identities: __assign({}, cleanedKnownIdentities)
              });
              fetchPayload = {
                method: 'post',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                  'x-mp-key': apiKey
                },
                body: JSON.stringify(requestBody)
              };
              api = uploader || (window.fetch ? new FetchUploader(searchUrl) : new XHRUploader(searchUrl));
              logger.verbose('Sending search request to ' + searchUrl);
              return [4 /*yield*/, api.upload(fetchPayload, searchUrl)];
            case 2:
              response = _a.sent();
              body = void 0;
              if (!isFunction(response.json)) return [3 /*break*/, 7];
              _a.label = 3;
            case 3:
              _a.trys.push([3, 5,, 6]);
              return [4 /*yield*/, response.json()];
            case 4:
              body = _a.sent();
              return [3 /*break*/, 6];
            case 5:
              _a.sent();
              logger.verbose('search response had no parseable JSON body.');
              return [3 /*break*/, 6];
            case 6:
              return [3 /*break*/, 8];
            case 7:
              xhrLike = response;
              if (xhrLike === null || xhrLike === void 0 ? void 0 : xhrLike.responseText) {
                try {
                  body = JSON.parse(xhrLike.responseText);
                } catch (e) {
                  logger.verbose('search XHR response was not valid JSON.');
                }
              }
              _a.label = 8;
            case 8:
              if (response.status === HTTP_OK) {
                logger.verbose('search received 200 OK.');
              } else if (response.status === HTTP_NOT_FOUND) {
                // 404 NOT_FOUND_ERROR is an expected steady-state outcome and is
                // intentionally not logged as an error.
                logger.verbose('search received 404 (no match).');
              } else {
                logger.verbose('search received non-success status ' + response.status);
              }
              safeInvoke({
                httpCode: response.status,
                body: body
              });
              return [3 /*break*/, 10];
            case 9:
              e_2 = _a.sent();
              message = getErrorMessage(e_2);
              reportMessage = 'Error sending search request: ' + message;
              logger.error(reportMessage);
              // Mirror the identity-route pattern in identityApiClient.ts: log to
              // console AND push a structured report through the dispatcher so any
              // registered IErrorReportingService (e.g. the Rokt kit's) can observe
              // the failure.
              errorReporter === null || errorReporter === void 0 ? void 0 : errorReporter.report({
                message: reportMessage,
                code: ErrorCodes.IDENTITY_REQUEST,
                severity: WSDKErrorSeverity.ERROR
              });
              safeInvoke({
                httpCode: HTTPCodes$4.noHttpCoverage
              });
              return [3 /*break*/, 10];
            case 10:
              return [2 /*return*/];
          }
        });
      });
    };

    var _a$1 = Constants.IdentityMethods,
      Identify$2 = _a$1.Identify,
      Modify$3 = _a$1.Modify,
      Login$2 = _a$1.Login,
      Logout$2 = _a$1.Logout;
    var HTTPCodes$3 = Constants.HTTPCodes,
      Messages$9 = Constants.Messages;
    var CACHE_HEADER = 'x-mp-max-age';
    var cacheOrClearIdCache = function cacheOrClearIdCache(method, knownIdentities, idCache, identityResponse, parsingCachedResponse) {
      // when parsing a response that has already been cached, simply return instead of attempting another cache
      if (parsingCachedResponse) {
        return;
      }
      // default the expire timestamp to one day in milliseconds unless a header comes back
      var expireTimestamp = getExpireTimestamp(identityResponse === null || identityResponse === void 0 ? void 0 : identityResponse.cacheMaxAge);
      switch (method) {
        case Login$2:
        case Identify$2:
          cacheIdentityRequest(method, knownIdentities, expireTimestamp, idCache, identityResponse);
          break;
        case Modify$3:
        case Logout$2:
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
      if (!hasOwnProp(cache, hashedKey)) {
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
    var SHA256_IDENTITY_ALIASES = {
      email_sha256: 'other',
      mobile_sha256: 'other2'
    };
    var normalizeUserIdentityKeys = function normalizeUserIdentityKeys(userIdentities) {
      var normalized = __assign({}, userIdentities);
      Object.keys(SHA256_IDENTITY_ALIASES).forEach(function (alias) {
        if (alias in normalized) {
          var value = normalized[alias];
          delete normalized[alias];
          normalized[SHA256_IDENTITY_ALIASES[alias]] = value;
        }
      });
      return normalized;
    };
    // Compare two identity objects by key and value, independent of
    // object key insertion order. The two sides come from different sources
    // (numeric IdentityType iteration vs. partner-provided / alias-normalized
    // order)
    var identitiesEqual = function identitiesEqual(a, b) {
      var aKeys = Object.keys(a !== null && a !== void 0 ? a : {});
      var bKeys = Object.keys(b !== null && b !== void 0 ? b : {});
      if (aKeys.length !== bKeys.length) return false;
      return aKeys.every(function (key) {
        return a[key] === b[key];
      });
    };
    var hasIdentityRequestChanged = function hasIdentityRequestChanged(currentUser, newIdentityRequest) {
      if (!currentUser || !(newIdentityRequest === null || newIdentityRequest === void 0 ? void 0 : newIdentityRequest.userIdentities)) {
        return false;
      }
      var currentUserIdentities = currentUser.getUserIdentities().userIdentities;
      var newIdentities = normalizeUserIdentityKeys(newIdentityRequest.userIdentities);
      return !identitiesEqual(currentUserIdentities, newIdentities);
    };
    /**
     * Checks if deviceId or other user identifiers (like email) were explicitly provided
     * by the partner via config.deviceId or config.identifyRequest.userIdentities.
     * When noFunctional is true, then cookies are blocked, so the partner must explicitly
     * pass deviceId or other identifiers to prevent new users from being created on each page load.
     *
     * @param store - The SDK store (provides SDKConfig.deviceId and SDKConfig.identifyRequest.userIdentities)
     * @returns true if deviceId or other identifiers were explicitly provided in config, false otherwise
     */
    var hasExplicitIdentifier = function hasExplicitIdentifier(store) {
      var _a, _b, _c;
      var userIdentities = (_b = (_a = store === null || store === void 0 ? void 0 : store.SDKConfig) === null || _a === void 0 ? void 0 : _a.identifyRequest) === null || _b === void 0 ? void 0 : _b.userIdentities;
      if (userIdentities && isObject(userIdentities) && !isEmpty(userIdentities) && Object.values(userIdentities).some(Boolean)) {
        return true;
      }
      return !!((_c = store === null || store === void 0 ? void 0 : store.SDKConfig) === null || _c === void 0 ? void 0 : _c.deviceId);
    };
    /**
     * Builds the /v1/identify-style envelope (client_sdk, environment,
     * request_id, request_timestamp_ms) used to correlate IDSync requests
     * across endpoints. `known_identities` is omitted so the caller can
     * fold in the search-specific identifiers alongside the envelope.
     */
    var buildIdentitySearchEnvelope = function buildIdentitySearchEnvelope(environment) {
      return {
        client_sdk: {
          platform: Constants.platform,
          sdk_vendor: Constants.sdkVendor,
          sdk_version: Constants.sdkVersion
        },
        environment: environment,
        request_id: _generateUniqueId(),
        request_timestamp_ms: Date.now()
      };
    };
    /**
     * Wires the SDK instance into `sendSearchRequest`: gates on `canLog`,
     * builds the `/v1/search` URL and request envelope, and dispatches.
     * Lives here so the SDK glue (URL building, opt-out gate, dispatcher
     * plumbing) is type-checked instead of being expressed in plain JS.
     */
    var executeSearchRequest = function executeSearchRequest(mpInstance, workspaceApiKey, knownIdentities, callback) {
      var _Helpers = mpInstance._Helpers,
        _Store = mpInstance._Store,
        Logger = mpInstance.Logger,
        _ErrorReportingDispatcher = mpInstance._ErrorReportingDispatcher;
      var _a = _Store.SDKConfig,
        identityUrl = _a.identityUrl,
        isDevelopmentMode = _a.isDevelopmentMode;
      if (!_Helpers.canLog()) {
        Logger.verbose(Messages$9.InformationMessages.AbandonLogEvent);
        if (isFunction(callback)) {
          try {
            callback({
              httpCode: HTTPCodes$3.loggingDisabledOrMissingAPIKey
            });
          } catch (e) {
            Logger.error('Error invoking search callback: ' + getErrorMessage(e));
          }
        }
        return;
      }
      // The Search endpoint is colocated with /v1/identify under
      // identityUrl, so we reuse the same service URL builder. We do
      // NOT append the apiKey to the URL \u2014 auth is done via x-mp-key.
      var serviceUrl = _Helpers.createServiceUrl(identityUrl);
      var searchUrl = serviceUrl + 'search?cb=1';
      var environment = isDevelopmentMode ? 'development' : 'production';
      sendSearchRequest(knownIdentities, workspaceApiKey, function () {
        return buildIdentitySearchEnvelope(environment);
      }, searchUrl, callback, Logger, undefined, _ErrorReportingDispatcher);
    };

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
            appendUserInfo(user, event);
          }
        });
      };
      // When noFunctional is set and there are no identities passed, the SDK will not fully initialize.
      // In this case, there will be no MPID, but we still want kits to initialize and forward the event to kits.
      // The original event is queued for the MP server upload path so it can be sent once an MPID is returned.
      // Returns true if the event was handled by this path (caller should return early).
      var handleNoFunctionalPreMpidEvent = function handleNoFunctionalPreMpidEvent(event, mpid) {
        var _a;
        var noFunctionalWithoutId = ((_a = mpInstance._CookieConsentManager) === null || _a === void 0 ? void 0 : _a.getNoFunctional()) && !hasExplicitIdentifier(mpInstance._Store);
        if (!noFunctionalWithoutId || mpid || !mpInstance._Store.configurationLoaded || mpInstance._Store.requireDelay) {
          return false;
        }
        var forwarderEvent = event;
        if (kitBlocker === null || kitBlocker === void 0 ? void 0 : kitBlocker.kitBlockingEnabled) {
          forwarderEvent = kitBlocker.createBlockedEvent(event);
        }
        if (forwarderEvent) {
          mpInstance._Forwarders.sendEventToForwarders(forwarderEvent);
          event.AlreadySentToForwarders = true;
        }
        mpInstance.Logger.verbose('noFunctional event forwarded to kits and queued for MP server upload when MPID is available.');
        mpInstance._Store.eventQueue.push(event);
        return true;
      };
      this.sendEventToServer = function (event, _options) {
        var defaultOptions = {
          shouldUploadEvent: true
        };
        var options = extend(defaultOptions, _options);
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
        if (handleNoFunctionalPreMpidEvent(event, mpid)) {
          return;
        }
        // We queue events if there is no MPID (MPID is null, or === 0), or there are integrations that
        // require this to stall because integration attributes need to be set, or if we are still
        // fetching the config (self hosted only), and so require delaying events
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
        // https://go.mparticle.com/work/SQDSDKS-6935
        // While Event Name is 'usually' a string, there are some cases where it is a number
        // in that it could be a type of MessageType Enum
        if (event.EventName !== String(Types.MessageType.AppStateTransition)) {
          if (kitBlocker && kitBlocker.kitBlockingEnabled) {
            event = kitBlocker.createBlockedEvent(event);
          }
          // We need to check event again, because kitblocking
          // can nullify the event.
          // Skip if forwarders were already called in the noFunctional pre-MPID path
          // to prevent double-sending when the event queue is later flushed.
          if (event && !event.AlreadySentToForwarders) {
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
      var _a;
      _a = KitFilterHelper;
      KitFilterHelper.filterUserAttributes = function (userAttributes, filterList) {
        return filterDictionaryWithHash(userAttributes, filterList, function (key) {
          return _a.hashUserAttribute(key);
        });
      };
      KitFilterHelper.filterUserIdentities = function (userIdentities, filterList) {
        return filterDictionaryWithHash(userIdentities, filterList, function (key) {
          return _a.hashUserIdentity(IdentityType.getIdentityType(key));
        });
      };
      KitFilterHelper.isFilteredUserAttribute = function (userAttributeKey, filterList) {
        var hashedUserAttribute = _a.hashUserAttribute(userAttributeKey);
        return filterList && inArray(filterList, hashedUserAttribute);
      };
      return KitFilterHelper;
    }();

    var StorageNames$1 = Constants.StorageNames;
    function appendFilteredUserIdentity(filteredUserIdentities, identity, userIdentityType) {
      if (userIdentityType === Types.IdentityType.CustomerId) {
        filteredUserIdentities.unshift(identity);
      } else {
        filteredUserIdentities.push(identity);
      }
    }
    function buildFilteredUserIdentities$1(userIdentitiesObject, filterList, inArray) {
      var filteredUserIdentities = [];
      if (!userIdentitiesObject || !Object.keys(userIdentitiesObject).length) {
        return filteredUserIdentities;
      }
      for (var userIdentityName in userIdentitiesObject) {
        if (!userIdentitiesObject.hasOwnProperty(userIdentityName)) {
          continue;
        }
        var userIdentityType = Types.IdentityType.getIdentityType(userIdentityName);
        // Must be `=== false`: IdentityType.Other is 0, so a falsy check would
        // drop a valid type.
        var isUnrecognisedIdentityName = userIdentityType === false;
        if (isUnrecognisedIdentityName) {
          continue;
        }
        if (inArray(filterList, userIdentityType)) {
          continue;
        }
        appendFilteredUserIdentity(filteredUserIdentities, {
          Type: userIdentityType,
          Identity: userIdentitiesObject[userIdentityName]
        }, userIdentityType);
      }
      return filteredUserIdentities;
    }
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
                  var currentUser = mParticleUser || mpInstance.Identity.getCurrentUser();
                  var userDidNotChange = (currentUser === null || currentUser === void 0 ? void 0 : currentUser.getMPID()) === previousMpid;
                  return userDidNotChange ? null : mpInstance.Identity.getUser(previousMpid);
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
      this.extend = extend;
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
        return buildFilteredUserIdentities$1(userIdentitiesObject, filterList, self.inArray);
      };
      this.filterUserIdentitiesForForwarders = KitFilterHelper.filterUserIdentities;
      this.filterUserAttributes = KitFilterHelper.filterUserAttributes;
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
      this.generateUniqueId = _generateUniqueId;
      // Imported Validators
      this.Validators = Validators;
    }

    var Messages$8 = Constants.Messages;
    var androidBridgeNameBase = 'mParticleAndroid';
    var iosBridgeNameBase = 'mParticle';
    function getAndroidBridge(name) {
      if (!Object.prototype.hasOwnProperty.call(window, name)) {
        return undefined;
      }
      return window[name];
    }
    function getInstanceNamedValue(instance, name) {
      return instance[name];
    }
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
        var _a, _b;
        if (!bridgeName) {
          return false;
        }
        var androidBridgeName = androidBridgeNameBase + '_' + bridgeName + '_v2';
        var iosBridgeName = iosBridgeNameBase + '_' + bridgeName + '_v2';
        // iOS v2 bridge
        if ((_b = (_a = window.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.hasOwnProperty(iosBridgeName)) {
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
        if (mpInstance._Store.SDKConfig.useNativeSdk || getAndroidBridge(androidBridgeNameBase) || mpInstance._Store.SDKConfig.isIOS) {
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
        var androidBridge = getAndroidBridge(androidBridgeNameBase);
        if (androidBridge && androidBridge.hasOwnProperty(path)) {
          mpInstance.Logger.verbose(Messages$8.InformationMessages.SendAndroid + path);
          androidBridge[path](value);
        } else if (mpInstance._Store.SDKConfig.isIOS) {
          mpInstance.Logger.verbose(Messages$8.InformationMessages.SendIOS + path);
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
        var _a, _b;
        if (!requiredWebviewBridgeName) {
          return;
        }
        var androidBridgeName = androidBridgeNameBase + '_' + requiredWebviewBridgeName + '_v2',
          androidBridge = getAndroidBridge(androidBridgeName),
          iosBridgeName = iosBridgeNameBase + '_' + requiredWebviewBridgeName + '_v2';
        var iOSBridgeMessageHandler, iOSBridgeNonMessageHandler;
        if ((_b = (_a = window.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b[iosBridgeName]) {
          iOSBridgeMessageHandler = window.webkit.messageHandlers[iosBridgeName];
        }
        if (mpInstance.uiwebviewBridgeName === iosBridgeName) {
          iOSBridgeNonMessageHandler = getInstanceNamedValue(mpInstance, iosBridgeName);
        }
        if (androidBridge && androidBridge.hasOwnProperty(path)) {
          mpInstance.Logger.verbose(Messages$8.InformationMessages.SendAndroid + path);
          androidBridge[path](value);
          return;
        } else if (iOSBridgeMessageHandler) {
          mpInstance.Logger.verbose(Messages$8.InformationMessages.SendIOS + path);
          iOSBridgeMessageHandler.postMessage(JSON.stringify({
            path: path,
            value: value ? JSON.parse(value) : null
          }));
        } else if (iOSBridgeNonMessageHandler) {
          mpInstance.Logger.verbose(Messages$8.InformationMessages.SendIOS + path);
          self.sendViaIframeToIOS(path, value);
        }
      };
    }

    var Messages$7 = Constants.Messages;
    var InformationMessages = Messages$7.InformationMessages;
    var DAYS_IN_MILLISECONDS = 1000 * 60 * 60 * 24;
    // Partner module IDs for cookie sync configurations
    var PARTNER_MODULE_IDS = {
      AdobeEventForwarder: 11,
      DoubleclickDFP: 41,
      AppNexus: 50,
      Lotame: 58,
      TradeDesk: 103,
      VerizonMedia: 155,
      Rokt: 1277
    };
    function CookieSyncManager(mpInstance) {
      var self = this;
      // Public
      this.attemptCookieSync = function (mpid, mpidIsNotInCookies) {
        var _a;
        var _b = mpInstance._Store,
          pixelConfigurations = _b.pixelConfigurations,
          webviewBridgeEnabled = _b.webviewBridgeEnabled;
        if (!mpid || webviewBridgeEnabled) {
          return;
        }
        // When noFunctional is true, persistence is not saved, so we cannot track cookie sync
        // dates. Skip cookie sync to avoid running it on every page load.
        if ((_a = mpInstance._CookieConsentManager) === null || _a === void 0 ? void 0 : _a.getNoFunctional()) {
          return;
        }
        var persistence = mpInstance._Persistence.getPersistence();
        if (isEmpty(persistence)) {
          return;
        }
        pixelConfigurations.forEach(function (pixelSettings) {
          var _a, _b, _c;
          try {
            // set requiresConsent to false to start each additional pixel configuration
            // set to true only if filteringConsenRuleValues.values.length exists
            var requiresConsent = false;
            // Filtering rules as defined in UI
            var filteringConsentRuleValues = pixelSettings.filteringConsentRuleValues,
              pixelUrl = pixelSettings.pixelUrl,
              redirectUrl = pixelSettings.redirectUrl,
              moduleId = pixelSettings.moduleId,
              settings = pixelSettings.settings,
              // Tells you how often we should do a cookie sync (in days)
              frequencyCap = pixelSettings.frequencyCap;
            var values = (filteringConsentRuleValues || {}).values;
            if (isEmpty(pixelUrl)) {
              return;
            }
            if (!isEmpty(values)) {
              requiresConsent = true;
            }
            // If MPID is new to cookies, we should not try to perform the cookie sync
            // because a cookie sync can only occur once a user either consents or doesn't.
            // we should not check if it's enabled if the user has a blank consent
            if (requiresConsent && mpidIsNotInCookies) {
              return;
            }
            // For Rokt, block cookie sync under the noTargeting or doNotShareOrSell privacy flag,
            // or when the browser sends Global Privacy Control
            if (moduleId === PARTNER_MODULE_IDS.Rokt) {
              var nav = typeof navigator === 'undefined' ? undefined : navigator;
              if (mpInstance._CookieConsentManager.getNoTargeting() || mpInstance._CookieConsentManager.getDoNotShareOrSell() || !!nav && nav.globalPrivacyControl === true) {
                return;
              }
            }
            var isEnabledForUserConsent = mpInstance._Consent.isEnabledForUserConsent;
            if (!isEnabledForUserConsent(filteringConsentRuleValues, mpInstance.Identity.getCurrentUser())) {
              return;
            }
            var cookieSyncDates = (_b = (_a = persistence[mpid]) === null || _a === void 0 ? void 0 : _a.csd) !== null && _b !== void 0 ? _b : {};
            var lastSyncDateForModule = cookieSyncDates[moduleId] || null;
            if (!isLastSyncDateExpired(frequencyCap, lastSyncDateForModule)) {
              return;
            }
            // The Trade Desk requires a URL parameter for GDPR enabled users.
            // It is optional but to simplify the code, we add it for all Trade
            // // Desk cookie syncs.
            var domain = moduleId === PARTNER_MODULE_IDS.TradeDesk ? window.location.hostname : undefined;
            // Google Marketing Platform accepts a web-safe base64-encoded MPID via the
            // `google_hm` query parameter, but only for accounts provisioned for Google
            // Hosted Matching \u2014 Google returns errors otherwise. It is therefore gated
            // behind the opt-in `enableHmTag` setting (off by default), which the server
            // delivers as the string 'True' when the UI toggle is enabled.
            var enableHmTag = ((_c = settings === null || settings === void 0 ? void 0 : settings.enableHmTag) === null || _c === void 0 ? void 0 : _c.toLowerCase()) === 'true';
            var isDoubleClickModule = moduleId === PARTNER_MODULE_IDS.DoubleclickDFP;
            var usesHostedMatching = isDoubleClickModule && enableHmTag;
            var base64Mpid = usesHostedMatching ? toWebSafeBase64(mpid) : undefined;
            if (usesHostedMatching && !base64Mpid) {
              mpInstance.Logger.warning('Unable to base64 encode the current MPID; omitting the google_hm parameter from this cookie sync');
            }
            var fullUrl = createCookieSyncUrl(mpid, pixelUrl, redirectUrl, domain, base64Mpid);
            self.performCookieSync(fullUrl, moduleId.toString(), mpid, cookieSyncDates);
          } catch (e) {
            mpInstance.Logger.error('Error performing cookie sync: ' + e);
          }
        });
      };
      // Private
      this.performCookieSync = function (url, moduleId, mpid, cookieSyncDates) {
        var img = document.createElement('img');
        mpInstance.Logger.verbose(InformationMessages.CookieSync);
        img.onload = function () {
          cookieSyncDates[moduleId] = new Date().getTime();
          mpInstance._Persistence.saveUserCookieSyncDatesToPersistence(mpid, cookieSyncDates);
        };
        img.src = url;
      };
    }
    var isLastSyncDateExpired = function isLastSyncDateExpired(frequencyCap, lastSyncDate) {
      // If there is no lastSyncDate, then there is no previous cookie sync, so we should sync the cookie
      if (!lastSyncDate) {
        return true;
      }
      // Otherwise, compare the last sync date to determine if it should do a cookie sync again
      return new Date().getTime() > new Date(lastSyncDate).getTime() + frequencyCap * DAYS_IN_MILLISECONDS;
    };

    function logDeprecatedMethodUsage(usage, logger, errorReporter) {
      logger.warning(usage.warningMessage);
      errorReporter === null || errorReporter === void 0 ? void 0 : errorReporter.report({
        message: usage.methodName,
        code: ErrorCodes.MP_DEPRECATED_METHOD_USAGE,
        severity: WSDKErrorSeverity.WARNING
      });
    }

    var Messages$6 = Constants.Messages;
    function SessionManager(mpInstance) {
      var self = this;
      this.initialize = function () {
        var _a;
        if (mpInstance._Store.sessionId) {
          var _b = mpInstance._Store,
            dateLastEventSent = _b.dateLastEventSent,
            SDKConfig = _b.SDKConfig;
          var sessionTimeout = SDKConfig.sessionTimeout;
          if (hasSessionTimedOut(dateLastEventSent === null || dateLastEventSent === void 0 ? void 0 : dateLastEventSent.getTime(), sessionTimeout)) {
            self.endSession();
            self.startNewSession();
          } else {
            // https://go.mparticle.com/work/SQDSDKS-6045
            // https://go.mparticle.com/work/SQDSDKS-6323
            var currentUser = mpInstance.Identity.getCurrentUser();
            var sdkIdentityRequest = SDKConfig.identifyRequest;
            var shouldSuppressIdentify = ((_a = mpInstance._CookieConsentManager) === null || _a === void 0 ? void 0 : _a.getNoFunctional()) && !hasExplicitIdentifier(mpInstance._Store);
            if (!shouldSuppressIdentify && hasIdentityRequestChanged(currentUser, sdkIdentityRequest)) {
              mpInstance.Identity.identify(sdkIdentityRequest, SDKConfig.identityCallback);
              mpInstance._Store.identifyCalled = true;
              mpInstance._Store.SDKConfig.identityCallback = null;
            }
          }
        } else {
          self.startNewSession();
        }
      };
      this.getSession = function () {
        logDeprecatedMethodUsage({
          methodName: 'SessionManager.getSession()',
          warningMessage: generateDeprecationMessage('SessionManager.getSession()', false, 'SessionManager.getSessionId()')
        }, mpInstance.Logger, mpInstance._ErrorReportingDispatcher);
        return this.getSessionId();
      };
      this.getSessionId = function () {
        return mpInstance._Store.sessionId;
      };
      this.startNewSession = function () {
        var _a;
        mpInstance.Logger.verbose(Messages$6.InformationMessages.StartingNewSession);
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
          var shouldSuppressIdentify = ((_a = mpInstance._CookieConsentManager) === null || _a === void 0 ? void 0 : _a.getNoFunctional()) && !hasExplicitIdentifier(mpInstance._Store);
          if (!mpInstance._Store.identifyCalled && !shouldSuppressIdentify) {
            mpInstance.Identity.identify(mpInstance._Store.SDKConfig.identifyRequest, mpInstance._Store.SDKConfig.identityCallback);
            mpInstance._Store.identifyCalled = true;
            mpInstance._Store.SDKConfig.identityCallback = null;
          }
          mpInstance._Events.logEvent({
            messageType: Types.MessageType.SessionStart
          });
        } else {
          mpInstance.Logger.verbose(Messages$6.InformationMessages.AbandonStartSession);
        }
      };
      this.endSession = function (override) {
        var _a, _b, _c, _d;
        mpInstance.Logger.verbose(Messages$6.InformationMessages.StartingEndSession);
        if (override) {
          performSessionEnd();
          return;
        }
        if (!mpInstance._Helpers.canLog()) {
          // At this moment, an AbandonedEndSession is defined when one of three things occurs:
          // - the SDK's store is not enabled because mParticle.setOptOut was called
          // - the devToken is undefined
          // - webviewBridgeEnabled is set to false
          mpInstance.Logger.verbose(Messages$6.InformationMessages.AbandonEndSession);
          (_a = mpInstance._timeOnSiteTimer) === null || _a === void 0 ? void 0 : _a.resetTimer();
          return;
        }
        var cookies = mpInstance._Persistence.getPersistence();
        if (!cookies || cookies.gs && !cookies.gs.sid) {
          mpInstance.Logger.verbose(Messages$6.InformationMessages.NoSessionToEnd);
          (_b = mpInstance._timeOnSiteTimer) === null || _b === void 0 ? void 0 : _b.resetTimer();
          return;
        }
        // sessionId is not equal to cookies.sid if cookies.sid is changed in another tab
        if (cookies.gs.sid && mpInstance._Store.sessionId !== cookies.gs.sid) {
          mpInstance._Store.sessionId = cookies.gs.sid;
        }
        if ((_c = cookies === null || cookies === void 0 ? void 0 : cookies.gs) === null || _c === void 0 ? void 0 : _c.les) {
          var sessionTimeout = mpInstance._Store.SDKConfig.sessionTimeout;
          if (hasSessionTimedOut(cookies.gs.les, sessionTimeout)) {
            performSessionEnd();
          } else {
            self.setSessionTimer();
            (_d = mpInstance._timeOnSiteTimer) === null || _d === void 0 ? void 0 : _d.resetTimer();
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
      /**
       * Checks if the session has expired based on the last event timestamp
       * @param lastEventTimestamp - Unix timestamp in milliseconds of the last event
       * @param sessionTimeout - Session timeout in minutes
       * @returns true if the session has expired, false otherwise
       */
      function hasSessionTimedOut(lastEventTimestamp, sessionTimeout) {
        if (!lastEventTimestamp || !sessionTimeout || sessionTimeout <= 0) {
          return false;
        }
        var sessionTimeoutInMilliseconds = sessionTimeout * 60000;
        var timeSinceLastEvent = Date.now() - lastEventTimestamp;
        return timeSinceLastEvent >= sessionTimeoutInMilliseconds;
      }
      /**
       * Performs session end operations:
       * - Logs a SessionEnd event
       * - Nullifies the session ID and related data
       * - Resets the time-on-site timer
       */
      function performSessionEnd() {
        var _a;
        mpInstance._Events.logEvent({
          messageType: Types.MessageType.SessionEnd
        });
        mpInstance._Store.nullifySession();
        (_a = mpInstance._timeOnSiteTimer) === null || _a === void 0 ? void 0 : _a.resetTimer();
      }
    }

    var Messages$5 = Constants.Messages;
    function Ecommerce(mpInstance) {
      var self = this;
      // https://go.mparticle.com/work/SQDSDKS-4801
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
      // When the caller does not supply a transaction-level total via
      // transactionAttributes.Revenue, derive it from the product list
      // (quantity * price) plus shipping and tax. A total that the caller provided
      // (including 0) is never overwritten.
      this.calculateProductActionTotalAmount = function (productAction) {
        if (!productAction || productAction.TotalAmount != null) {
          return productAction;
        }
        var totalAmount = 0;
        if (Array.isArray(productAction.ProductList)) {
          productAction.ProductList.forEach(function (product) {
            totalAmount += parseNumber(product.Quantity) * parseNumber(product.Price);
          });
        }
        totalAmount += parseNumber(productAction.ShippingAmount) + parseNumber(productAction.TaxAmount);
        productAction.TotalAmount = totalAmount;
        return productAction;
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
          case Types.ProductActionType.ViewCart:
            return 'ViewCart';
          case Types.ProductActionType.AddShippingInfo:
            return 'AddShippingInfo';
          case Types.ProductActionType.AddPaymentInfo:
            return 'AddPaymentInfo';
          case Types.ProductActionType.PaymentMethodSelected:
            return 'PaymentMethodSelected';
          case Types.ProductActionType.PaymentAttempted:
            return 'PaymentAttempted';
          case Types.ProductActionType.PaymentSucceeded:
            return 'PaymentSucceeded';
          case Types.ProductActionType.PaymentFailed:
            return 'PaymentFailed';
          case Types.ProductActionType.RefundInitiated:
            return 'RefundInitiated';
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
          // https://go.mparticle.com/work/SQDSDKS-4801
          case Types.ProductActionType.Unknown:
            return Types.EventType.Unknown;
          case Types.ProductActionType.ViewDetail:
            return Types.CommerceEventType.ProductViewDetail;
          // Rokt Brain commerce-adjacent types map to Unknown on server
          case Types.ProductActionType.ViewCart:
          case Types.ProductActionType.AddShippingInfo:
          case Types.ProductActionType.AddPaymentInfo:
          case Types.ProductActionType.PaymentMethodSelected:
          case Types.ProductActionType.PaymentAttempted:
          case Types.ProductActionType.PaymentSucceeded:
          case Types.ProductActionType.PaymentFailed:
          case Types.ProductActionType.RefundInitiated:
            return Types.EventType.Unknown;
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
      // https://go.mparticle.com/work/SQDSDKS-4801
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
      // https://go.mparticle.com/work/SQDSDKS-4801
      this.extractTransactionId = function (attributes, productAction) {
        if (productAction.TransactionId) {
          attributes['Transaction Id'] = productAction.TransactionId;
        }
      };
      // https://go.mparticle.com/work/SQDSDKS-4801
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
      // https://go.mparticle.com/work/SQDSDKS-4801
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
          mpInstance.Logger.error(Messages$5.ErrorMessages.PromotionIdRequired);
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
          mpInstance.Logger.error(Messages$5.ErrorMessages.TransactionIdRequired);
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
              var attributes = extend(false, {}, commerceEvent.EventAttributes);
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
          var attributes = extend(false, {}, commerceEvent.EventAttributes);
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
          var attributes = extend(false, {}, commerceEvent.EventAttributes);
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
          var attributes = extend(false, commerceEvent.EventAttributes, product.Attributes);
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
        mpInstance.Logger.verbose(Messages$5.InformationMessages.StartingLogCommerceEvent);
        if (mpInstance._Helpers.canLog()) {
          baseEvent = mpInstance._ServerModel.createEventObject({
            messageType: Types.MessageType.Commerce,
            sourceMessageId: options === null || options === void 0 ? void 0 : options.sourceMessageId
          });
          baseEvent.EventName = 'eCommerce - ';
          baseEvent.CurrencyCode = mpInstance._Store.currencyCode;
          baseEvent.CustomFlags = extend(baseEvent.CustomFlags, customFlags);
          return baseEvent;
        } else {
          mpInstance.Logger.verbose(Messages$5.InformationMessages.AbandonLogEvent);
        }
        return null;
      };
      // sanitizes any non number, non string value to 0
      this.sanitizeAmount = function (amount, category) {
        if (!mpInstance._Helpers.Validators.isStringOrNumber(amount)) {
          var message = [category, 'must be of type number. A', _typeof(amount), 'was passed. Converting to 0'].join(' ');
          mpInstance.Logger.warning(message);
          return 0;
        }
        // if amount is a string, it will be parsed into a number if possible, or set to 0
        return mpInstance._Helpers.parseNumber(amount);
      };
    }

    var ForegroundTimeTracker = /** @class */function () {
      function ForegroundTimeTracker(timerKey, noFunctional) {
        if (noFunctional === void 0) {
          noFunctional = false;
        }
        this.noFunctional = noFunctional;
        this.isTrackerActive = false;
        this.localStorageName = '';
        this.startTime = 0;
        this.totalTime = 0;
        this.localStorageName = "mprtcl-tos-".concat(timerKey);
        this.timerVault = new LocalStorageVault(this.localStorageName);
        if (!this.noFunctional) {
          this.loadTimeFromStorage();
        }
        this.addHandlers();
        if (document.hidden === false) {
          this.startTracking();
        }
      }
      ForegroundTimeTracker.prototype.addHandlers = function () {
        var _this = this;
        // when user switches tabs or minimizes the window
        document.addEventListener('visibilitychange', function () {
          return _this.handleVisibilityChange();
        });
        // when user switches to another application
        window.addEventListener('blur', function () {
          return _this.handleWindowBlur();
        });
        // when window gains focus
        window.addEventListener('focus', function () {
          return _this.handleWindowFocus();
        });
        // this ensures that timers between tabs are in sync
        window.addEventListener('storage', function (event) {
          return _this.syncAcrossTabs(event);
        });
        // when user closes tab, refreshes, or navigates to another page via link
        window.addEventListener('beforeunload', function () {
          return _this.updateTimeInPersistence();
        });
      };
      ForegroundTimeTracker.prototype.handleVisibilityChange = function () {
        if (document.hidden) {
          this.stopTracking();
        } else {
          this.startTracking();
        }
      };
      ForegroundTimeTracker.prototype.handleWindowBlur = function () {
        if (this.isTrackerActive) {
          this.stopTracking();
        }
      };
      ForegroundTimeTracker.prototype.handleWindowFocus = function () {
        if (!this.isTrackerActive) {
          this.startTracking();
        }
      };
      ForegroundTimeTracker.prototype.syncAcrossTabs = function (event) {
        if (event.key === this.localStorageName && event.newValue !== null) {
          var newTime = parseFloat(event.newValue) || 0;
          this.totalTime = newTime;
        }
      };
      ForegroundTimeTracker.prototype.updateTimeInPersistence = function () {
        if (this.isTrackerActive && !this.noFunctional) {
          this.timerVault.store(Math.round(this.totalTime));
        }
      };
      ForegroundTimeTracker.prototype.loadTimeFromStorage = function () {
        var storedTime = this.timerVault.retrieve();
        if (isNumber(storedTime) && storedTime !== null) {
          this.totalTime = storedTime;
        }
      };
      ForegroundTimeTracker.prototype.startTracking = function () {
        if (!document.hidden) {
          this.startTime = Math.floor(performance.now());
          this.isTrackerActive = true;
        }
      };
      ForegroundTimeTracker.prototype.stopTracking = function () {
        if (this.isTrackerActive) {
          this.setTotalTime();
          this.updateTimeInPersistence();
          this.isTrackerActive = false;
        }
      };
      ForegroundTimeTracker.prototype.setTotalTime = function () {
        if (this.isTrackerActive) {
          var now = Math.floor(performance.now());
          this.totalTime += now - this.startTime;
          this.startTime = now;
        }
      };
      ForegroundTimeTracker.prototype.getTimeInForeground = function () {
        this.setTotalTime();
        this.updateTimeInPersistence();
        return this.totalTime;
      };
      ForegroundTimeTracker.prototype.resetTimer = function () {
        this.totalTime = 0;
        this.updateTimeInPersistence();
      };
      return ForegroundTimeTracker;
    }();

    function normalizeRoktLauncherOptions(launcherOptions) {
      var normalizedOptions = launcherOptions ? __assign({}, launcherOptions) : {};
      var hasNoDeviceId = normalizedOptions.noDeviceId === true || normalizedOptions.noDeviceID === true;
      if (hasNoDeviceId) {
        // noDeviceId is the strongest Rokt privacy flag and implies the newer flags.
        normalizedOptions.noDeviceId = true;
        normalizedOptions.noFunctional = true;
        normalizedOptions.noTargeting = true;
      }
      return normalizedOptions;
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
      // Always initialize flags to at least an empty object to prevent undefined access
      sdkConfig.flags = sdkConfig.flags || {};
      return sdkConfig;
    }
    // TODO: Merge this with SDKStoreApi in sdkRuntimeModels
    function Store(config, mpInstance, apiKey) {
      var _this = this;
      var createMainStorageName = mpInstance._Helpers.createMainStorageName;
      var isWebviewEnabled = mpInstance._NativeSdkHelpers.isWebviewEnabled;
      var defaultStore = {
        isEnabled: true,
        sessionAttributes: {},
        localSessionAttributes: {},
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
        identityCallFailed: false,
        identifyRequestCount: 0,
        SDKConfig: {},
        nonCurrentUserMPIDs: {},
        identifyCalled: false,
        isLoggedIn: false,
        cookieSyncDates: {},
        integrationAttributes: {},
        requireDelay: true,
        isLocalStorageAvailable: null,
        storageName: null,
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
        roktAccountId: null,
        integrationName: null,
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
        this.SDKConfig.flags = processFlags(config);
        this.SDKConfig.autoLogPageViewQueryParams = parseQueryParamAllowlist(config.autoLogPageViewQueryParams);
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
        if (config.hasOwnProperty('maxCookieSize')) {
          this.SDKConfig.maxCookieSize = config.maxCookieSize;
        } else {
          this.SDKConfig.maxCookieSize = Constants.DefaultConfig.maxCookieSize;
        }
        if (config.hasOwnProperty('appName')) {
          this.SDKConfig.appName = config.appName;
        }
        if (config.hasOwnProperty('package')) {
          this.SDKConfig.package = config.package;
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
            mpInstance.Logger.warning('The optional callback must be a function. You tried entering a(n) ' + _typeof(callback) + ' . Callback not set. Please set your callback again.');
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
          if (isObject(_this.persistenceData[mpid])) {
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
      this.getLocalSessionAttributes = function () {
        return _this.localSessionAttributes || {};
      };
      this.setLocalSessionAttribute = function (key, value) {
        var _a;
        _this.localSessionAttributes[key] = value;
        _this.persistenceData.gs.lsa = __assign(__assign({}, _this.persistenceData.gs.lsa || {}), (_a = {}, _a[key] = value, _a));
        mpInstance._Persistence.savePersistence(_this.persistenceData);
      };
      this.syncPersistenceData = function () {
        var persistenceData = mpInstance._Persistence.getPersistence();
        _this.persistenceData = extend({}, _this.persistenceData, persistenceData);
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
      this.getRoktAccountId = function () {
        return _this.roktAccountId;
      };
      this.setRoktAccountId = function (accountId) {
        _this.roktAccountId = accountId;
      };
      this.getIntegrationName = function () {
        return _this.integrationName;
      };
      this.setIntegrationName = function (integrationName) {
        _this.integrationName = integrationName;
      };
      this.getTimeOnSite = function () {
        var _a;
        return (_a = mpInstance._timeOnSiteTimer) === null || _a === void 0 ? void 0 : _a.getTimeInForeground();
      };
      this.getTotalTimeOnSite = function () {
        return _this.sessionStartDate ? Date.now() - _this.sessionStartDate.getTime() : undefined;
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
        _this.sessionStartDate = null;
        _this.sessionAttributes = {};
        _this.localSessionAttributes = {};
        mpInstance._Persistence.update();
      };
      this.processConfig = function (config) {
        var workspaceToken = config.workspaceToken,
          requiredWebviewBridgeName = config.requiredWebviewBridgeName;
        // We should reprocess the flags and baseUrls in case they have changed when we request an updated config
        // such as if the SDK is being self-hosted and the flags are different on the server config
        // https://go.mparticle.com/work/SQDSDKS-6317
        // Only update flags if the config actually has flags (don't overwrite with empty object)
        if (config.flags) {
          _this.SDKConfig.flags = processFlags(config);
        }
        // Stored whole: the tracker reports the rejections, and cannot recover them by
        // re-parsing a list that has already had them removed.
        _this.SDKConfig.autoLogPageViewQueryParams = parseQueryParamAllowlist(config.autoLogPageViewQueryParams);
        var baseUrls = processBaseUrls(config, _this.SDKConfig.flags, apiKey);
        for (var baseUrlKeys in baseUrls) {
          _this.SDKConfig[baseUrlKeys] = baseUrls[baseUrlKeys];
        }
        if (workspaceToken) {
          _this.SDKConfig.workspaceToken = workspaceToken;
          var noFunctional = normalizeRoktLauncherOptions(config === null || config === void 0 ? void 0 : config.launcherOptions).noFunctional;
          mpInstance._timeOnSiteTimer = new ForegroundTimeTracker(workspaceToken, noFunctional);
        } else {
          mpInstance.Logger.warning('You should have a workspaceToken on your config object for security purposes.');
        }
        // add a new function to apply items to the store that require config to be returned
        _this.storageName = createMainStorageName(workspaceToken);
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
        CaptureIntegrationSpecificIds = _a.CaptureIntegrationSpecificIds,
        CaptureIntegrationSpecificIdsV2 = _a.CaptureIntegrationSpecificIdsV2,
        AstBackgroundEvents = _a.AstBackgroundEvents,
        AutoLogPageView = _a.AutoLogPageView,
        AutoButtonTracking = _a.AutoButtonTracking,
        AutoLinkTracking = _a.AutoLinkTracking;
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
      flags[CaptureIntegrationSpecificIdsV2] = config.flags[CaptureIntegrationSpecificIdsV2] || 'none';
      flags[AstBackgroundEvents] = config.flags[AstBackgroundEvents] === 'True';
      flags[AutoLogPageView] = config.flags[AutoLogPageView] === 'True';
      flags[AutoButtonTracking] = config.flags[AutoButtonTracking] === 'True';
      flags[AutoLinkTracking] = config.flags[AutoLinkTracking] === 'True';
      return flags;
    }
    function processBaseUrls(config, flags, apiKey) {
      // an API key is not present in a webview only mode. In this case, no baseUrls are needed
      if (!apiKey) {
        return {};
      }
      // A CNAME (config.domain, e.g. set by the snippet v2.6+) takes precedence
      // over direct URL routing so that customer-configured first-party domains
      // and the snippet's fallback domain are always honored.
      if (!isEmpty(config.domain)) {
        return processCustomBaseUrls(config);
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
      var CNAMEUrlPaths = Constants.CNAMEUrlPaths;
      // newBaseUrls are default if the customer is not using a CNAME
      // If a customer passes either config.domain or config.v3SecureServiceUrl,
      // config.identityUrl, etc, the customer is using a CNAME.
      // config.domain will take priority if a customer passes both.
      var newBaseUrls = {};
      // If config.domain exists, the customer is using a CNAME.  We append the url paths to the provided domain.
      // This flag is set on the Rokt/MP snippet (starting at version 2.6), meaning config.domain will alwys be empty
      // if a customer is using a snippet prior to 2.6.
      if (!isEmpty(config.domain)) {
        for (var pathKey in CNAMEUrlPaths) {
          newBaseUrls[pathKey] = "".concat(config.domain).concat(CNAMEUrlPaths[pathKey]);
        }
        return newBaseUrls;
      }
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

    var Logger = /** @class */function () {
      function Logger(config) {
        var _a, _b;
        this.logLevel = (_a = config.logLevel) !== null && _a !== void 0 ? _a : LogLevelType.Warning;
        this.logger = (_b = config.logger) !== null && _b !== void 0 ? _b : new ConsoleLogger();
      }
      Logger.prototype.verbose = function (msg) {
        if (this.logLevel === LogLevelType.None) return;
        if (this.logger.verbose && this.logLevel === LogLevelType.Verbose) {
          this.logger.verbose(msg);
        }
      };
      Logger.prototype.warning = function (msg) {
        if (this.logLevel === LogLevelType.None) return;
        if (this.logger.warning && (this.logLevel === LogLevelType.Verbose || this.logLevel === LogLevelType.Warning)) {
          this.logger.warning(msg);
        }
      };
      Logger.prototype.error = function (msg) {
        if (this.logLevel === LogLevelType.None) return;
        if (this.logger.error) {
          this.logger.error(msg);
        }
      };
      Logger.prototype.isVerbose = function () {
        return this.logLevel === LogLevelType.Verbose;
      };
      Logger.prototype.setLogLevel = function (newLogLevel) {
        this.logLevel = newLogLevel;
      };
      return Logger;
    }();
    var ConsoleLogger = /** @class */function () {
      function ConsoleLogger() {}
      ConsoleLogger.prototype.verbose = function (msg) {
        if (console && console.info) {
          console.info(msg);
        }
      };
      ConsoleLogger.prototype.error = function (msg) {
        if (console && console.error) {
          console.error(msg);
        }
      };
      ConsoleLogger.prototype.warning = function (msg) {
        if (console && console.warn) {
          console.warn(msg);
        }
      };
      return ConsoleLogger;
    }();

    var Base64 = Polyfill.Base64,
      Messages$4 = Constants.Messages,
      Base64CookieKeys = Constants.Base64CookieKeys,
      SDKv2NonMPIDCookieKeys = Constants.SDKv2NonMPIDCookieKeys,
      StorageNames = Constants.StorageNames;
    function getMParticleManager() {
      return window.mParticle;
    }
    function _Persistence(mpInstance) {
      var self = this;
      // https://go.mparticle.com/work/SQDSDKS-5022
      this.useLocalStorage = function () {
        return !mpInstance._Store.SDKConfig.useCookieStorage && mpInstance._Store.isLocalStorageAvailable;
      };
      function setFirstRunFromExistingData(localStorageData, cookies) {
        if (!localStorageData && !cookies) {
          mpInstance._Store.isFirstRun = true;
          mpInstance._Store.mpid = 0;
          return;
        }
        mpInstance._Store.isFirstRun = false;
      }
      function mergeStorageSources(localStorageData, cookies) {
        if (localStorageData && cookies) {
          // https://go.mparticle.com/work/SQDSDKS-6047
          return extend(false, localStorageData, cookies);
        }
        return localStorageData || cookies;
      }
      // For migrating from localStorage to cookies -- If an instance switches from
      // localStorage to cookies, then no mParticle cookie exists yet and there is
      // localStorage. Get the localStorage, set them to cookies, then delete the
      // localStorage item.
      function migrateLocalStorageToCookies(storage, localStorageData, cookies) {
        var allData;
        if (localStorageData) {
          allData = mergeStorageSources(localStorageData, cookies);
          storage.removeItem(mpInstance._Store.storageName);
        } else if (cookies) {
          allData = cookies;
        }
        self.storeDataInMemory(allData);
        return allData;
      }
      // For migrating from cookie to localStorage -- If an instance is newly
      // switching from cookies to localStorage, then no mParticle localStorage
      // exists yet and there are cookies. Get the cookies, set them to
      // localStorage, then delete the cookies.
      function migrateCookiesToLocalStorage(localStorageData, cookies) {
        if (!cookies) {
          self.storeDataInMemory(localStorageData);
          return undefined;
        }
        var allData = localStorageData || cookies;
        self.storeDataInMemory(allData);
        self.expireCookies(mpInstance._Store.storageName);
        return allData;
      }
      function loadPersistenceIntoMemory(localStorageData, cookies) {
        if (!mpInstance._Store.isLocalStorageAvailable) {
          self.storeDataInMemory(cookies);
          return;
        }
        if (mpInstance._Store.SDKConfig.useCookieStorage) {
          return migrateLocalStorageToCookies(window.localStorage, localStorageData, cookies);
        }
        return migrateCookiesToLocalStorage(localStorageData, cookies);
      }
      function copyNonCurrentUserMpids(allData) {
        for (var key in allData) {
          if (allData.hasOwnProperty(key) && !SDKv2NonMPIDCookieKeys[key]) {
            mpInstance._Store.nonCurrentUserMPIDs[key] = allData[key];
          }
        }
      }
      function clearCorruptStorage(cookieWasLoaded) {
        if (self.useLocalStorage() && mpInstance._Store.isLocalStorageAvailable) {
          if (!cookieWasLoaded) {
            localStorage.removeItem(mpInstance._Store.storageName);
          }
          return;
        }
        self.expireCookies(mpInstance._Store.storageName);
      }
      this.initializeStorage = function () {
        var cookies = null;
        try {
          var localStorageData = self.getLocalStorage();
          cookies = self.getCookie();
          // https://go.mparticle.com/work/SQDSDKS-6045
          setFirstRunFromExistingData(localStorageData, cookies);
          // https://go.mparticle.com/work/SQDSDKS-6045
          if (!mpInstance._Store.isLocalStorageAvailable) {
            mpInstance._Store.SDKConfig.useCookieStorage = true;
          }
          // https://go.mparticle.com/work/SQDSDKS-6046
          var allData = loadPersistenceIntoMemory(localStorageData, cookies);
          copyNonCurrentUserMpids(allData);
          self.update();
        } catch (e) {
          // If cookies or local storage is corrupt, we want to remove it
          // so that in the future, initializeStorage will work
          clearCorruptStorage(Boolean(cookies));
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
      function applyEmptyPersistenceDefaults() {
        mpInstance.Logger.verbose(Messages$4.InformationMessages.CookieNotFound);
        mpInstance._Store.clientId = mpInstance._Store.clientId || mpInstance._Helpers.generateUniqueId();
        mpInstance._Store.deviceId = mpInstance._Store.deviceId || mpInstance._Helpers.generateUniqueId();
      }
      function hydrateStoreFromPersistence(obj, currentMPID) {
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
        mpInstance._Store.localSessionAttributes = obj.gs.lsa || mpInstance._Store.localSessionAttributes;
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
        mpInstance._Store.sessionStartDate = obj.gs.ssd ? new Date(obj.gs.ssd) : new Date();
        if (currentMPID) {
          obj = obj[currentMPID];
        } else {
          obj = obj[obj.cu];
        }
      }
      // https://go.mparticle.com/work/SQDSDKS-6045
      this.storeDataInMemory = function (obj, currentMPID) {
        try {
          if (!obj) {
            applyEmptyPersistenceDefaults();
            return;
          }
          hydrateStoreFromPersistence(obj, currentMPID);
        } catch (e) {
          mpInstance.Logger.error(Messages$4.ErrorMessages.CookieParseError);
        }
      };
      // https://go.mparticle.com/work/SQDSDKS-5022
      this.determineLocalStorageAvailability = function (storage) {
        var mParticleManager = getMParticleManager();
        if (mParticleManager === null || mParticleManager === void 0 ? void 0 : mParticleManager._forceNoLocalStorage) {
          return false;
        }
        try {
          storage.setItem('mparticle', 'test');
          var result = storage.getItem('mparticle') === 'test';
          storage.removeItem('mparticle');
          return Boolean(result && storage);
        } catch (e) {
          return false;
        }
      };
      // https://go.mparticle.com/work/SQDSDKS-6021
      this.setLocalStorage = function () {
        var _a;
        if (!mpInstance._Store.isLocalStorageAvailable) {
          return;
        }
        // Block mprtcl-v4 localStorage when noFunctional is true
        if ((_a = mpInstance._CookieConsentManager) === null || _a === void 0 ? void 0 : _a.getNoFunctional()) {
          return;
        }
        var key = mpInstance._Store.storageName,
          localStorageData = self.getLocalStorage() || {},
          currentUser = mpInstance.Identity.getCurrentUser(),
          mpid = currentUser ? currentUser.getMPID() : null;
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
            localStorageData = extend({}, localStorageData, mpInstance._Store.nonCurrentUserMPIDs);
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
        data.gs.lsa = store.localSessionAttributes;
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
      function parsePersistenceRecord(raw) {
        var decoded = self.decodePersistence(raw);
        if (!decoded) {
          return null;
        }
        var record = JSON.parse(decoded);
        return mpInstance._Helpers.isObject(record) && Object.keys(record).length ? record : null;
      }
      this.getLocalStorage = function () {
        if (!mpInstance._Store.isLocalStorageAvailable) {
          return null;
        }
        return parsePersistenceRecord(window.localStorage.getItem(mpInstance._Store.storageName));
      };
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
        writeCookie(cookieName + '=' + '' + expires + '; path=/' + domain);
      };
      this.getCookie = function () {
        var cookies,
          key = mpInstance._Store.storageName,
          i,
          l,
          parts,
          name,
          cookie;
        mpInstance.Logger.verbose(Messages$4.InformationMessages.CookieSearch);
        try {
          cookies = window.document.cookie.split('; ');
        } catch (e) {
          mpInstance.Logger.verbose('Unable to parse undefined cookie');
          return null;
        }
        for (i = 0, l = cookies.length; i < l; i++) {
          try {
            parts = cookies[i].split('=');
            name = parts.shift();
            cookie = parts.join('=');
          } catch (e) {
            mpInstance.Logger.verbose('Unable to parse cookie: ' + name + '. Skipping.');
          }
          if (key && key === name) {
            var persistence = parsePersistenceRecord(mpInstance._Helpers.converted(cookie));
            if (persistence) {
              mpInstance.Logger.verbose(Messages$4.InformationMessages.CookieFound);
              return persistence;
            }
          }
        }
        return null;
      };
      // https://go.mparticle.com/work/SQDSDKS-5022
      // https://go.mparticle.com/work/SQDSDKS-6021
      this.setCookie = function () {
        var _a;
        // Block mprtcl-v4 cookies when noFunctional is true
        if ((_a = mpInstance._CookieConsentManager) === null || _a === void 0 ? void 0 : _a.getNoFunctional()) {
          return;
        }
        var mpid,
          currentUser = mpInstance.Identity.getCurrentUser();
        if (currentUser) {
          mpid = currentUser.getMPID();
        }
        var date = new Date(),
          key = mpInstance._Store.storageName,
          cookies = self.getCookie() || {},
          expires = new Date(date.getTime() + mpInstance._Store.SDKConfig.cookieExpiration * 24 * 60 * 60 * 1000).toUTCString(),
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
          cookies = extend({}, cookies, mpInstance._Store.nonCurrentUserMPIDs);
          mpInstance._Store.nonCurrentUserMPIDs = {};
        }
        encodedCookiesWithExpirationAndPath = self.reduceAndEncodePersistence(cookies, expires, domain, mpInstance._Store.SDKConfig.maxCookieSize);
        mpInstance.Logger.verbose(Messages$4.InformationMessages.CookieSet);
        writeCookie(encodeURIComponent(key) + '=' + encodedCookiesWithExpirationAndPath);
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
      function isEncodedCookieTooLarge(encoded, maxCookieSize) {
        return encoded.length > maxCookieSize;
      }
      function removeUnsessionedMpidsWhenOversized(persistence, expires, domain, maxCookieSize) {
        var encodedCookiesWithExpirationAndPath;
        for (var key in persistence) {
          if (!persistence.hasOwnProperty(key)) {
            continue;
          }
          encodedCookiesWithExpirationAndPath = createFullEncodedCookie(persistence, expires, domain);
          if (!isEncodedCookieTooLarge(encodedCookiesWithExpirationAndPath, maxCookieSize)) {
            continue;
          }
          if (SDKv2NonMPIDCookieKeys[key] || key === persistence.cu) {
            continue;
          }
          delete persistence[key];
        }
        return encodedCookiesWithExpirationAndPath;
      }
      function collectRemovableMpids(persistence) {
        var MPIDsOnCookie = {};
        for (var potentialMPID in persistence) {
          if (!persistence.hasOwnProperty(potentialMPID)) {
            continue;
          }
          if (SDKv2NonMPIDCookieKeys[potentialMPID] || potentialMPID === persistence.cu) {
            continue;
          }
          MPIDsOnCookie[potentialMPID] = 1;
        }
        return MPIDsOnCookie;
      }
      function removeMpidsNotInCurrentSession(persistence, MPIDsOnCookie, currentSessionMPIDs, expires, domain, maxCookieSize) {
        var encodedCookiesWithExpirationAndPath;
        for (var mpid in MPIDsOnCookie) {
          encodedCookiesWithExpirationAndPath = createFullEncodedCookie(persistence, expires, domain);
          if (!isEncodedCookieTooLarge(encodedCookiesWithExpirationAndPath, maxCookieSize)) {
            continue;
          }
          if (!MPIDsOnCookie.hasOwnProperty(mpid)) {
            continue;
          }
          if (currentSessionMPIDs.indexOf(mpid) === -1) {
            delete persistence[mpid];
          }
        }
        return encodedCookiesWithExpirationAndPath;
      }
      function logAndRemoveOversizedMpid(persistence, MPIDtoRemove, maxCookieSize) {
        if (persistence[MPIDtoRemove]) {
          mpInstance.Logger.verbose('Size of new encoded cookie is larger than maxCookieSize setting of ' + maxCookieSize + '. Removing from cookie the earliest logged in MPID containing: ' + JSON.stringify(persistence[MPIDtoRemove], null, 2));
          delete persistence[MPIDtoRemove];
          return;
        }
        mpInstance.Logger.error('Unable to save MPID data to cookies because the resulting encoded cookie is larger than the maxCookieSize setting of ' + maxCookieSize + '. We recommend using a maxCookieSize of 1500.');
      }
      function removeCurrentSessionMpidsByAge(persistence, currentSessionMPIDs, expires, domain, maxCookieSize) {
        var encodedCookiesWithExpirationAndPath;
        for (var i = 0; i < currentSessionMPIDs.length; i++) {
          encodedCookiesWithExpirationAndPath = createFullEncodedCookie(persistence, expires, domain);
          if (!isEncodedCookieTooLarge(encodedCookiesWithExpirationAndPath, maxCookieSize)) {
            break;
          }
          logAndRemoveOversizedMpid(persistence, currentSessionMPIDs[i], maxCookieSize);
        }
        return encodedCookiesWithExpirationAndPath;
      }
      this.reduceAndEncodePersistence = function (persistence, expires, domain, maxCookieSize) {
        var currentSessionMPIDs = persistence.gs.csm ? persistence.gs.csm : [];
        if (!currentSessionMPIDs.length) {
          return removeUnsessionedMpidsWhenOversized(persistence, expires, domain, maxCookieSize);
        }
        var MPIDsOnCookie = collectRemovableMpids(persistence);
        if (Object.keys(MPIDsOnCookie).length) {
          removeMpidsNotInCurrentSession(persistence, MPIDsOnCookie, currentSessionMPIDs, expires, domain, maxCookieSize);
        }
        return removeCurrentSessionMpidsByAge(persistence, currentSessionMPIDs, expires, domain, maxCookieSize);
      };
      function writeCookie(cookie) {
        var isHttpsPage = window.location.protocol === 'https:';
        window.document.cookie = isHttpsPage ? cookie + ';Secure' : cookie;
      }
      function createFullEncodedCookie(persistence, expires, domain) {
        return self.encodePersistence(JSON.stringify(persistence)) + ';expires=' + expires + ';path=/' + domain;
      }
      function isNonEmptyArrayOrObject(value) {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        if (!mpInstance._Helpers.isObject(value)) {
          return false;
        }
        return Object.keys(value).length > 0;
      }
      function encodeGsBase64Field(gs, key) {
        if (!gs[key] || !isNonEmptyArrayOrObject(gs[key])) {
          delete gs[key];
          return;
        }
        gs[key] = Base64.encode(JSON.stringify(gs[key]));
      }
      function encodeGlobalSettings(gs) {
        for (var key in gs) {
          if (!gs.hasOwnProperty(key)) {
            continue;
          }
          if (Base64CookieKeys[key]) {
            encodeGsBase64Field(gs, key);
            continue;
          }
          if (key === 'ie') {
            gs[key] = gs[key] ? 1 : 0;
            continue;
          }
          if (!gs[key]) {
            delete gs[key];
          }
        }
      }
      function encodeMpidBase64Field(container, key) {
        var value = container[key];
        if (mpInstance._Helpers.isObject(value) && Object.keys(value).length) {
          container[key] = Base64.encode(JSON.stringify(value));
          return;
        }
        delete container[key];
      }
      function encodeMpidRecord(record) {
        for (var key in record) {
          if (!record.hasOwnProperty(key)) {
            continue;
          }
          if (Base64CookieKeys[key]) {
            encodeMpidBase64Field(record, key);
          }
        }
      }
      function encodeMpidRecords(persistence) {
        for (var mpid in persistence) {
          if (!persistence.hasOwnProperty(mpid)) {
            continue;
          }
          if (SDKv2NonMPIDCookieKeys[mpid]) {
            continue;
          }
          encodeMpidRecord(persistence[mpid]);
        }
      }
      this.encodePersistence = function (persistenceString) {
        var persistence = JSON.parse(persistenceString);
        encodeGlobalSettings(persistence.gs);
        encodeMpidRecords(persistence);
        return createCookieString(JSON.stringify(persistence));
      };
      function decodeGlobalSettings(gs) {
        for (var key in gs) {
          if (!gs.hasOwnProperty(key)) {
            continue;
          }
          if (Base64CookieKeys[key]) {
            gs[key] = JSON.parse(Base64.decode(gs[key]));
            // Written as an array of MPIDs by encodeGsBase64Field, then read
            // as one by addMpidToSessionHistory and reduceAndEncodePersistence.
            if (key === 'csm' && !Array.isArray(gs[key])) {
              delete gs[key];
            }
            continue;
          }
          if (key === 'ie') {
            gs[key] = Boolean(gs[key]);
          }
        }
      }
      function decodeMpidRecord(record) {
        for (var key in record) {
          if (!record.hasOwnProperty(key)) {
            continue;
          }
          if (!Base64CookieKeys[key]) {
            continue;
          }
          if (record[key].length) {
            record[key] = JSON.parse(Base64.decode(record[key]));
          }
        }
      }
      function decodeMpidRecords(persistence) {
        for (var mpid in persistence) {
          if (!persistence.hasOwnProperty(mpid)) {
            continue;
          }
          if (!SDKv2NonMPIDCookieKeys[mpid]) {
            if (!mpInstance._Helpers.isObject(persistence[mpid])) {
              delete persistence[mpid];
              continue;
            }
            decodeMpidRecord(persistence[mpid]);
            continue;
          }
          if (mpid === 'l') {
            persistence[mpid] = Boolean(persistence[mpid]);
          }
        }
      }
      // TODO: This should actually be decodePersistenceString or
      //       we should refactor this to take a string and return an object
      this.decodePersistence = function (persistenceString) {
        try {
          if (!persistenceString) {
            return;
          }
          var persistence = JSON.parse(revertCookieString(persistenceString));
          if (mpInstance._Helpers.isObject(persistence) && Object.keys(persistence).length) {
            decodeGlobalSettings(persistence.gs);
            decodeMpidRecords(persistence);
          }
          return JSON.stringify(persistence);
        } catch (e) {
          mpInstance.Logger.error('Problem with decoding cookie');
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
      this.saveUserCookieSyncDatesToPersistence = function (mpid, csd) {
        if (csd) {
          var persistence = self.getPersistence();
          if (persistence) {
            if (mpInstance._Helpers.isObject(persistence[mpid])) {
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
        var _a;
        // Block mprtcl-v4 persistence when noFunctional is true
        if ((_a = mpInstance._CookieConsentManager) === null || _a === void 0 ? void 0 : _a.getNoFunctional()) {
          return;
        }
        var encodedPersistence = self.encodePersistence(JSON.stringify(persistence)),
          date = new Date(),
          key = mpInstance._Store.storageName,
          expires = new Date(date.getTime() + mpInstance._Store.SDKConfig.cookieExpiration * 24 * 60 * 60 * 1000).toUTCString(),
          cookieDomain = self.getCookieDomain(),
          domain;
        if (cookieDomain === '') {
          domain = '';
        } else {
          domain = ';domain=' + cookieDomain;
        }
        if (mpInstance._Store.SDKConfig.useCookieStorage) {
          var encodedCookiesWithExpirationAndPath = self.reduceAndEncodePersistence(persistence, expires, domain, mpInstance._Store.SDKConfig.maxCookieSize);
          writeCookie(encodeURIComponent(key) + '=' + encodedCookiesWithExpirationAndPath);
        } else {
          if (mpInstance._Store.isLocalStorageAvailable) {
            try {
              localStorage.setItem(mpInstance._Store.storageName, encodedPersistence);
            } catch (e) {
              mpInstance.Logger.error('Error saving persistence to localStorage.');
            }
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
          if (!mpInstance._Helpers.isObject(persistence[mpid])) {
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
        if (persistence && mpInstance._Helpers.isObject(persistence[mpid])) {
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
        localStorage.clear();
        self.expireCookies(StorageNames.cookieName);
        self.expireCookies(StorageNames.cookieNameV2);
        self.expireCookies(StorageNames.cookieNameV3);
        self.expireCookies(StorageNames.cookieNameV4);
        self.expireCookies(mpInstance._Store.storageName);
        var mParticleManager = getMParticleManager();
        if (mParticleManager === null || mParticleManager === void 0 ? void 0 : mParticleManager._isTestEnv) {
          var testWorkspaceToken = 'abcdef';
          localStorage.removeItem(mpInstance._Helpers.createMainStorageName(testWorkspaceToken));
          self.expireCookies(mpInstance._Helpers.createMainStorageName(testWorkspaceToken));
        }
      };
      // https://go.mparticle.com/work/SQDSDKS-6045
      // Forwarder Batching Code
      this.forwardingStatsBatches = {
        uploadsTable: {},
        forwardingStatsEventQueue: []
      };
    }

    var Messages$3 = Constants.Messages;
    function Events(mpInstance) {
      var self = this;
      this.logEvent = function (event, options) {
        mpInstance.Logger.verbose(Messages$3.InformationMessages.StartingLogEvent + ': ' + event.name);
        if (mpInstance._Helpers.canLog()) {
          var uploadObject = mpInstance._ServerModel.createEventObject(event);
          mpInstance._APIClient.sendEventToServer(uploadObject, options);
        } else {
          mpInstance.Logger.verbose(Messages$3.InformationMessages.AbandonLogEvent);
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
        mpInstance.Logger.verbose(Messages$3.InformationMessages.StartingLogOptOut);
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
      // The auto page view for the landing page. The SPA navigations that follow it
      // come from PageViewTracker instead, so both emitters attach the same
      // allowlisted query params.
      this.logPageView = function (options) {
        var _a;
        self.logEvent({
          messageType: Types.MessageType.PageView,
          name: 'PageView',
          data: __assign(__assign(__assign({}, paramsToAttributes(allowedQueryParams(getHref(), (_a = mpInstance._Store.SDKConfig.autoLogPageViewQueryParams) === null || _a === void 0 ? void 0 : _a.allowed))), {
            hostname: window.location.hostname,
            title: window.document.title
          }), autoPageViewAttribute(options && options.isAutoPageView)),
          eventType: Types.EventType.Unknown
        });
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
          if (Types.ProductActionType.isRoktCommerceType(productActionType)) {
            event.CustomFlags = event.CustomFlags || {};
            event.CustomFlags['Rokt.CommerceEventType'] = Types.ProductActionType.getExpansionName(productActionType);
          }
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
            ProductActionType: Types.ProductActionType.Purchase,
            ProductList: Array.isArray(product) ? product : [product]
          };
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
        mpInstance.Logger.verbose(Messages$3.InformationMessages.StartingLogCommerceEvent);
        // If a developer typos the ProductActionType, the event category will be
        // null, resulting in kit forwarding errors on the server.
        // The check for `ProductAction` is required to denote that these are
        // ProductAction events, and not impression or promotions
        if (commerceEvent.ProductAction && commerceEvent.EventCategory === null) {
          mpInstance.Logger.error('Commerce event not sent.  The mParticle.ProductActionType you passed was invalid. Re-check your code.');
          return;
        }
        var sanitizedAttrs = mpInstance._Helpers.sanitizeAttributes(attrs, commerceEvent.EventName);
        if (mpInstance._Helpers.canLog()) {
          if (sanitizedAttrs) {
            commerceEvent.EventAttributes = sanitizedAttrs;
          }
          // When no transaction total (Revenue) was provided, derive it from
          // the products, shipping, and tax.
          if (commerceEvent.ProductAction) {
            mpInstance._Ecommerce.calculateProductActionTotalAmount(commerceEvent.ProductAction);
          }
          mpInstance._APIClient.sendEventToServer(commerceEvent, options);
          // https://go.mparticle.com/work/SQDSDKS-6038
          mpInstance._Persistence.update();
        } else {
          mpInstance.Logger.verbose(Messages$3.InformationMessages.AbandonLogEvent);
        }
      };
      this.addEventHandler = function (domEvent, selector, eventName, data, eventType) {
        var elements = [],
          handler = function handler(e, element) {
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
          var _loop_1 = function _loop_1() {
            var element = elements[i];
            var elementHandler = function elementHandler(e) {
              handler(e, element);
            };
            if (element.addEventListener) {
              // Modern browsers
              element.addEventListener(domEvent, elementHandler, false);
            } else if (element.attachEvent) {
              // IE < 9
              element.attachEvent('on' + domEvent, elementHandler);
            } else {
              // All other browsers
              element['on' + domEvent] = elementHandler;
            }
          };
          for (i = 0; i < elements.length; i++) {
            _loop_1();
          }
        } else {
          mpInstance.Logger.verbose('No elements found');
        }
      };
    }

    function isAttributeKeyAllowed(kitBlocker, key) {
      return !(kitBlocker === null || kitBlocker === void 0 ? void 0 : kitBlocker.isAttributeKeyBlocked(key));
    }
    function isIdentityAllowed(kitBlocker, identityName) {
      return !(kitBlocker === null || kitBlocker === void 0 ? void 0 : kitBlocker.isIdentityBlocked(identityName));
    }
    function copyUserAttributeValue(value) {
      return Array.isArray(value) ? value.slice() : value;
    }
    function buildUserAttributesCopy(userAttributes, kitBlocker) {
      var userAttributesCopy = {};
      if (!userAttributes) {
        return userAttributesCopy;
      }
      for (var prop in userAttributes) {
        if (!hasOwnProp(userAttributes, prop) || isReservedStoredPropertyName(prop) || !isAttributeKeyAllowed(kitBlocker, prop)) {
          continue;
        }
        userAttributesCopy[prop] = copyUserAttributeValue(userAttributes[prop]);
      }
      return userAttributesCopy;
    }
    function buildUserAttributeLists(userAttributes, kitBlocker) {
      var userAttributesLists = {};
      for (var key in userAttributes) {
        if (!hasOwnProp(userAttributes, key) || isReservedStoredPropertyName(key) || !Array.isArray(userAttributes[key]) || !isAttributeKeyAllowed(kitBlocker, key)) {
          continue;
        }
        userAttributesLists[key] = userAttributes[key].slice();
      }
      return userAttributesLists;
    }
    function buildFilteredUserIdentities(identities, kitBlocker) {
      var currentUserIdentities = {};
      var identitiesByType = identities;
      for (var identityType in identitiesByType) {
        if (!hasOwnProp(identitiesByType, identityType)) {
          continue;
        }
        var storedIdentityType = getIdentityTypeFromStoredKey(identityType);
        // Must be `=== null`: IdentityType.Other is 0, so a falsy check would
        // drop a valid stored Other identity.
        if (storedIdentityType === null) {
          continue;
        }
        var identityName = Types.IdentityType.getIdentityName(storedIdentityType);
        if (!isIdentityAllowed(kitBlocker, identityName)) {
          continue;
        }
        currentUserIdentities[identityName] = identitiesByType[identityType];
      }
      return currentUserIdentities;
    }
    function filteredMparticleUser(mpid, forwarder, mpInstance, kitBlocker) {
      function getAllUserAttributes() {
        var userAttributesCopy = buildUserAttributesCopy(mpInstance._Store.getUserAttributes(mpid), kitBlocker);
        return mpInstance._Helpers.filterUserAttributes(userAttributesCopy, forwarder.userAttributeFilters);
      }
      return {
        getUserIdentities: function getUserIdentities() {
          var currentUserIdentities = buildFilteredUserIdentities(mpInstance._Store.getUserIdentities(mpid), kitBlocker);
          currentUserIdentities = mpInstance._Helpers.filterUserIdentitiesForForwarders(currentUserIdentities, forwarder.userIdentityFilters);
          return {
            userIdentities: currentUserIdentities
          };
        },
        getMPID: function getMPID() {
          return mpid;
        },
        getUserAttributesLists: function getUserAttributesLists(forwarder) {
          var userAttributesLists = buildUserAttributeLists(getAllUserAttributes(), kitBlocker);
          return mpInstance._Helpers.filterUserAttributes(userAttributesLists, forwarder.userAttributeFilters);
        },
        getAllUserAttributes: getAllUserAttributes
      };
    }

    var FORWARDING_RULE_MESSAGE_TYPES = [Types.MessageType.PageEvent, Types.MessageType.PageView, Types.MessageType.Commerce];
    function inFilteredList(filterList, hash) {
      if (filterList && filterList.length) {
        return inArray(filterList, hash);
      }
      return false;
    }
    function isBlockedByForwardingRule(messageType, attributes, forwarder) {
      if (!FORWARDING_RULE_MESSAGE_TYPES.includes(messageType) || !forwarder.filteringEventAttributeValue || !forwarder.filteringEventAttributeValue.eventAttributeName || !forwarder.filteringEventAttributeValue.eventAttributeValue) {
        return false;
      }
      var foundProp = null;
      if (attributes) {
        for (var prop in attributes) {
          if (attributes.hasOwnProperty(prop)) {
            var hashedName = KitFilterHelper.hashAttributeConditionalForwarding(prop);
            if (hashedName === forwarder.filteringEventAttributeValue.eventAttributeName) {
              foundProp = {
                name: hashedName,
                value: KitFilterHelper.hashAttributeConditionalForwarding(attributes[prop])
              };
              break;
            }
          }
        }
      }
      var isMatch = foundProp !== null && foundProp.value === forwarder.filteringEventAttributeValue.eventAttributeValue;
      var shouldInclude = forwarder.filteringEventAttributeValue.includeOnMatch === true ? isMatch : !isMatch;
      return !shouldInclude;
    }
    function isBlockedByEventFilter(messageType, hashedEventName, hashedEventType, forwarder) {
      if (messageType === Types.MessageType.PageEvent && (inFilteredList(forwarder.eventNameFilters, hashedEventName) || inFilteredList(forwarder.eventTypeFilters, hashedEventType))) {
        return true;
      } else if (messageType === Types.MessageType.Commerce && inFilteredList(forwarder.eventTypeFilters, hashedEventType)) {
        return true;
      } else if (messageType === Types.MessageType.PageView && inFilteredList(forwarder.screenNameFilters, hashedEventName)) {
        return true;
      }
      return false;
    }
    // sendEventToForwarders passes no kitBlocker: apiClient has already applied
    // the data plan by then.
    function isEventForwarded(event, forwarder, kitBlocker) {
      var plannedEvent = kitBlocker && kitBlocker.kitBlockingEnabled ? kitBlocker.createBlockedEvent(event) : event;
      if (!plannedEvent) {
        return false;
      }
      if (isBlockedByForwardingRule(plannedEvent.EventDataType, plannedEvent.EventAttributes, forwarder)) {
        return false;
      }
      var eventCategory = plannedEvent.EventCategory;
      return !isBlockedByEventFilter(plannedEvent.EventDataType, KitFilterHelper.hashEventName(plannedEvent.EventName, eventCategory), KitFilterHelper.hashEventType(eventCategory), forwarder);
    }
    function filterEventAttributes(messageType, eventCategory, eventName, attributes, forwarder) {
      if (!attributes) {
        return attributes;
      }
      var filterList;
      if (messageType === Types.MessageType.PageEvent) {
        filterList = forwarder.attributeFilters;
      } else if (messageType === Types.MessageType.PageView) {
        filterList = forwarder.screenAttributeFilters;
      }
      if (!filterList) {
        return attributes;
      }
      var filtered = {};
      for (var attrName in attributes) {
        if (attributes.hasOwnProperty(attrName)) {
          var hash = KitFilterHelper.hashEventAttributeKey(eventCategory, eventName, attrName);
          if (!inArray(filterList, hash)) {
            filtered[attrName] = attributes[attrName];
          }
        }
      }
      return filtered;
    }
    function filterUserIdentities(userIdentities, filterList) {
      if (!userIdentities || !userIdentities.length) {
        return userIdentities || [];
      }
      return userIdentities.filter(function (userIdentity) {
        return !inArray(filterList, KitFilterHelper.hashUserIdentity(userIdentity.Type));
      });
    }

    var _a;
    var _b = Constants.IdentityMethods,
      Modify$2 = _b.Modify,
      Identify$1 = _b.Identify,
      Login$1 = _b.Login,
      Logout$1 = _b.Logout;
    // Maps an identity method to the kit callback that reports its completion.
    var identityCompleteKitMethods = (_a = {}, _a[Identify$1] = 'onIdentifyComplete', _a[Login$1] = 'onLoginComplete', _a[Logout$1] = 'onLogoutComplete', _a[Modify$2] = 'onModifyComplete', _a);
    function removeBlockedUserIdentities(userIdentities, kitBlocker) {
      var identitiesByName = userIdentities;
      var allowedUserIdentities = {};
      for (var identityName in identitiesByName) {
        if (!identitiesByName.hasOwnProperty(identityName) || !isIdentityAllowed(kitBlocker, identityName)) {
          continue;
        }
        allowedUserIdentities[identityName] = identitiesByName[identityName];
      }
      return allowedUserIdentities;
    }
    function userAttributesMatchFilter(userAttributes, filterObject) {
      for (var attrName in userAttributes) {
        if (!hasOwnProp(userAttributes, attrName)) {
          continue;
        }
        var attrHash = KitFilterHelper.hashAttributeConditionalForwarding(attrName);
        var valueHash = KitFilterHelper.hashAttributeConditionalForwarding(userAttributes[attrName]);
        if (attrHash === filterObject.userAttributeName && valueHash === filterObject.userAttributeValue) {
          return true;
        }
      }
      return false;
    }
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
          var allowedUserIdentities_1 = removeBlockedUserIdentities(userIdentities, kitBlocker);
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
            var filteredUserIdentities = mpInstance._Helpers.filterUserIdentities(allowedUserIdentities_1, forwarder.userIdentityFilters);
            var filteredUserAttributes = user ? filteredMparticleUser(user.getMPID(), forwarder, mpInstance, kitBlocker).getAllUserAttributes() : {};
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
        if (!user) {
          return false;
        }
        var userAttributes = user.getAllUserAttributes();
        try {
          var hasUserAttributes = userAttributes && mpInstance._Helpers.isObject(userAttributes) && Object.keys(userAttributes).length > 0;
          var isMatch = hasUserAttributes ? userAttributesMatchFilter(userAttributes, filterObject) : false;
          return filterObject.includeOnMatch === isMatch;
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
        if (mpInstance._Store.webviewBridgeEnabled || !mpInstance._Store.activeForwarders) {
          return;
        }
        var forwardEvent = function forwardEvent(forwarder) {
          if (!isEventForwarded(event, forwarder)) {
            return;
          }
          // Clone the event object, as we could be sending different attributes to each forwarder
          var clonedEvent = extend(true, {}, event);
          clonedEvent.EventAttributes = filterEventAttributes(event.EventDataType, event.EventCategory, event.EventName, clonedEvent.EventAttributes, forwarder);
          // Check user identity filtering rules
          clonedEvent.UserIdentities = filterUserIdentities(clonedEvent.UserIdentities, forwarder.userIdentityFilters);
          // Check user attribute filtering rules
          clonedEvent.UserAttributes = KitFilterHelper.filterUserAttributes(clonedEvent.UserAttributes, forwarder.userAttributeFilters);
          if (!forwarder.process) {
            return;
          }
          mpInstance.Logger.verbose('Sending message to forwarder: ' + forwarder.name);
          var result = forwarder.process(clonedEvent);
          if (result) {
            mpInstance.Logger.verbose(result);
          }
        };
        // Not for...of: the downleveled loop is miscompiled in cjs/esm builds.
        mpInstance._Store.activeForwarders.forEach(function (forwarder) {
          forwardEvent(forwarder);
        });
      };
      this.handleForwarderUserAttributes = function (functionNameKey, key, value) {
        if (kitBlocker && kitBlocker.isAttributeKeyBlocked(key) || !mpInstance._Store.activeForwarders.length) {
          return;
        }
        mpInstance._Store.activeForwarders.forEach(function (forwarder) {
          var forwarderFunction = forwarder[functionNameKey];
          if (!forwarderFunction || KitFilterHelper.isFilteredUserAttribute(key, forwarder.userAttributeFilters)) {
            return;
          }
          try {
            var result = void 0;
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
        var allowedUserIdentities = removeBlockedUserIdentities(userIdentities, kitBlocker);
        mpInstance._Store.activeForwarders.forEach(function (forwarder) {
          var filteredUserIdentities = mpInstance._Helpers.filterUserIdentities(allowedUserIdentities, forwarder.userIdentityFilters);
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
        var kitMethodName = identityCompleteKitMethods[identityMethod];
        if (!kitMethodName) {
          return;
        }
        mpInstance._Store.activeForwarders.forEach(function (forwarder) {
          var onIdentityComplete = forwarder[kitMethodName];
          if (!onIdentityComplete) {
            return;
          }
          var filteredUser = filteredMparticleUser(user.getMPID(), forwarder, mpInstance, kitBlocker);
          var result = onIdentityComplete.call(forwarder, filteredUser, filteredUser.getUserIdentities());
          if (result) {
            mpInstance.Logger.verbose(result);
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
        for (var name_1 in kits) {
          // Configs are returned with suffixes also. We need to consider the
          // config suffix here to match the constructor suffix
          var kitNameWithConfigSuffix = void 0;
          if (config.suffix) {
            kitNameWithConfigSuffix = "".concat(config.name, "-").concat(config.suffix);
          }
          if (name_1 === kitNameWithConfigSuffix || name_1 === config.name) {
            if (config.isDebug === mpInstance._Store.SDKConfig.isDevelopmentMode || config.isSandbox === mpInstance._Store.SDKConfig.isDevelopmentMode) {
              newKit = this.returnConfiguredKit(kits[name_1], config);
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
            var registeredSideloadedKits_1 = {
              kits: {}
            };
            var unregisteredSideloadedKits = mpConfig.sideloadedKits;
            unregisteredSideloadedKits.forEach(function (unregisteredKit) {
              try {
                // Register each sideloaded kit, which adds a key of the sideloaded kit name
                // and a value of the sideloaded kit constructor.
                unregisteredKit.kitInstance.register(registeredSideloadedKits_1);
                var kitName = unregisteredKit.kitInstance.name;
                // Then add the kit filters to each registered kit.
                registeredSideloadedKits_1.kits[kitName].filters = unregisteredKit.filterDictionary;
              } catch (e) {
                console.error('Error registering sideloaded kit ' + unregisteredKit.kitInstance.name);
              }
            });
            // Then configure each registered kit
            for (var registeredKitKey in registeredSideloadedKits_1.kits) {
              var registeredKit = registeredSideloadedKits_1.kits[registeredKitKey];
              self.configureSideloadedKit(registeredKit);
            }
            // If Sideloaded Kits are successfully registered,
            // record this in the Store.
            if (!isEmpty(registeredSideloadedKits_1.kits)) {
              var kitKeys = Object.keys(registeredSideloadedKits_1.kits);
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
      this.returnConfiguredKit = function (forwarder, config) {
        if (config === void 0) {
          config = {};
        }
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
      this.sendSingleForwardingStatsToServer = function (forwardingStatsData) {
        return __awaiter(_this, void 0, void 0, function () {
          var fetchPayload, response, message;
          var _a;
          return __generator(this, function (_b) {
            switch (_b.label) {
              case 0:
                fetchPayload = {
                  method: 'post',
                  body: JSON.stringify(forwardingStatsData),
                  headers: {
                    Accept: 'text/plain;charset=UTF-8',
                    'Content-Type': 'text/plain;charset=UTF-8'
                  }
                };
                return [4 /*yield*/, this.forwarderStatsUploader.upload(fetchPayload)];
              case 1:
                response = _b.sent();
                // This is a fire and forget, so we only need to log the response based on the code, and not return any response body
                if (response.status === 202) {
                  // https://go.mparticle.com/work/SQDSDKS-6670
                  message = 'Successfully sent forwarding stats to mParticle Servers';
                } else {
                  message = 'Issue with forwarding stats to mParticle Servers, received HTTP Code of ' + response.statusText;
                }
                (_a = mpInstance === null || mpInstance === void 0 ? void 0 : mpInstance.Logger) === null || _a === void 0 ? void 0 : _a.verbose(message);
                return [2 /*return*/];
            }
          });
        });
      };
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
        var _a, _b, _c;
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
          var integrationAttributes = mpInstance._Store.integrationAttributes;
          var getFeatureFlag = mpInstance._Helpers.getFeatureFlag;
          // https://go.mparticle.com/work/SQDSDKS-5053
          // https://go.mparticle.com/work/SQDSDKS-7639
          if (isIntegrationCaptureEnabled(getFeatureFlag)) {
            // Attempt to recapture click IDs in case a third party integration
            // has added or updated  new click IDs since the last event was sent.
            mpInstance._IntegrationCapture.capture();
            var transformedClickIDs = mpInstance._IntegrationCapture.getClickIdsAsCustomFlags();
            customFlags = __assign(__assign({}, transformedClickIDs), customFlags);
            var transformedIntegrationAttributes = mpInstance._IntegrationCapture.getClickIdsAsIntegrationAttributes();
            integrationAttributes = __assign(__assign({}, transformedIntegrationAttributes), integrationAttributes);
          }
          if (event.hasOwnProperty('toEventAPIObject')) {
            eventObject = event.toEventAPIObject();
          } else {
            eventObject = {
              // This is an artifact from v2 events where SessionStart/End and AST event
              //  names are numbers (1, 2, or 10), but going forward with v3, these lifecycle
              //  events do not have names, but are denoted by their `event_type`
              EventName: event.name || String(event.messageType),
              EventCategory: event.eventType,
              EventAttributes: mpInstance._Helpers.sanitizeAttributes(event.data, event.name),
              ActiveTimeOnSite: (_a = mpInstance._timeOnSiteTimer) === null || _a === void 0 ? void 0 : _a.getTimeInForeground(),
              TotalTimeOnSite: (_c = (_b = mpInstance._Store).getTotalTimeOnSite) === null || _c === void 0 ? void 0 : _c.call(_b),
              PageUrl: cleanPageHref() || null,
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
            Package: mpInstance._Store.SDKConfig.package,
            ClientGeneratedId: mpInstance._Store.clientId,
            DeviceId: mpInstance._Store.deviceId,
            IntegrationAttributes: integrationAttributes,
            CurrencyCode: mpInstance._Store.currencyCode,
            DataPlan: mpInstance._Store.SDKConfig.dataPlan ? mpInstance._Store.SDKConfig.dataPlan : {}
          };
          if (eventObject.EventDataType === MessageType.AppStateTransition) {
            eventObject.IsFirstRun = mpInstance._Store.isFirstRun;
            eventObject.LaunchReferral = cleanPageHref() || null;
          }
          // FIXME: Remove duplicate occurence
          eventObject.CurrencyCode = mpInstance._Store.currencyCode;
          var currentUser = user || mpInstance.Identity.getCurrentUser();
          appendUserInfo(currentUser, eventObject);
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
          return extend({}, eventObject, uploadObject);
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
        window.mParticle._forwardingStatsTimer = setInterval(function () {
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
                  if (xhr_1.readyState === 4) {
                    if (xhr_1.status === 200 || xhr_1.status === 202) {
                      mpInstance.Logger.verbose('Successfully sent  ' + xhr_1.statusText + ' from server');
                      delete uploadsTable[date];
                    } else if (xhr_1.status.toString()[0] === '4') {
                      if (xhr_1.status !== 429) {
                        delete uploadsTable[date];
                      }
                    } else {
                      uploadsTable[date].uploading = false;
                    }
                  }
                };
                var xhr_1 = mpInstance._Helpers.createXHR(xhrCallback);
                var forwardingStatsData = uploadsTable[date].data;
                uploadsTable[date].uploading = true;
                mpInstance._APIClient.sendBatchForwardingStatsToServer(forwardingStatsData, xhr_1);
              }
            }
          })(date);
        }
      }
    }

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

    var processReadyQueue = function processReadyQueue(readyQueue, logger) {
      if (isEmpty(readyQueue)) {
        return [];
      }
      // Without draining first, sync re-entry (cache-hit identify \u2192
      // parseIdentityResponse \u2192 processReadyQueue) re-iterates the same array:
      // callers only replace `_preInit.readyQueue` with [] after we return, so the
      // nested call still sees every entry. That duplicates Identity/event calls
      // and can nest "Unable to compute proper mParticle function" wraps.
      // Splice the queue empty up front so a nested call observes [].
      var items = readyQueue.splice(0, readyQueue.length);
      // Isolate each item so one throw cannot abort the rest of this pass.
      // Drain-first already removed siblings from the shared queue; without a
      // per-item catch they would be lost forever when forEach aborts.
      items.forEach(function (readyQueueItem) {
        try {
          if (isFunction(readyQueueItem)) {
            readyQueueItem();
          } else if (Array.isArray(readyQueueItem)) {
            processPreloadedItem(readyQueueItem);
          }
        } catch (e) {
          logger.error('Error processing ready queue item: ' + getErrorMessage(e));
        }
      });
      return [];
    };
    var processPreloadedItem = function processPreloadedItem(readyQueueItem) {
      // Operate on a copy so processPreloadedItem never mutates the caller's
      // queued item array (defensive; the queue itself is drained above).
      var args = readyQueueItem.slice();
      var method = args.splice(0, 1)[0];
      // Skip malformed queue entries (empty array or non-string method) instead of
      // throwing an uncaught TypeError from method.split() below.
      if (typeof method !== 'string' || method.length === 0) {
        return;
      }
      // if the first argument is a method on the base mParticle object, run it
      if (typeof window !== 'undefined' && window.mParticle && window.mParticle[args[0]]) {
        window.mParticle[method].apply(window.mParticle, args);
        // otherwise, the method is on either eCommerce or Identity objects, ie. "eCommerce.setCurrencyCode", "Identity.login"
      } else {
        var methodArray = method.split('.');
        try {
          var computedMPFunction = window.mParticle;
          var context_1 = window.mParticle;
          // Track both the function and its context
          for (var _i = 0, methodArray_1 = methodArray; _i < methodArray_1.length; _i++) {
            var currentMethod = methodArray_1[_i];
            context_1 = computedMPFunction; // Keep track of the parent object
            computedMPFunction = computedMPFunction[currentMethod];
          }
          // Apply the function with its proper context
          computedMPFunction.apply(context_1, args);
        } catch (e) {
          throw new Error('Unable to compute proper mParticle function ' + e);
        }
      }
    };

    var Messages$2 = Constants.Messages,
      HTTPCodes$2 = Constants.HTTPCodes,
      FeatureFlags$1 = Constants.FeatureFlags,
      IdentityMethods$1 = Constants.IdentityMethods;
    var ErrorMessages = Messages$2.ErrorMessages;
    var CacheIdentity = FeatureFlags$1.CacheIdentity;
    var Identify = IdentityMethods$1.Identify,
      Modify$1 = IdentityMethods$1.Modify,
      Login = IdentityMethods$1.Login,
      Logout = IdentityMethods$1.Logout;
    function Identity(mpInstance) {
      var _a = mpInstance._Helpers,
        getFeatureFlag = _a.getFeatureFlag,
        extend = _a.extend;
      var self = this;
      this.idCache = null;
      this.audienceManager = null;
      // https://go.mparticle.com/work/SQDSDKS-6353
      this.IdentityRequest = {
        preProcessIdentityRequest: function preProcessIdentityRequest(identityApiData, callback, method) {
          mpInstance.Logger.verbose(Messages$2.InformationMessages.StartingLogEvent + ': ' + method);
          // First, remove any falsy identity values and warn about them
          var removedFalsyIdentityData = mpInstance._Helpers.Validators.removeFalsyIdentityValues(identityApiData, mpInstance.Logger);
          // Normalize convenience aliases (email_sha256 \u2192 other, mobile_sha256 \u2192 other2)
          var cleanedIdentityApiData = (removedFalsyIdentityData === null || removedFalsyIdentityData === void 0 ? void 0 : removedFalsyIdentityData.userIdentities) ? __assign(__assign({}, removedFalsyIdentityData), {
            userIdentities: normalizeUserIdentityKeys(removedFalsyIdentityData.userIdentities)
          }) : removedFalsyIdentityData;
          var identityValidationResult = mpInstance._Helpers.Validators.validateIdentities(cleanedIdentityApiData, method);
          if (!identityValidationResult.valid) {
            mpInstance.Logger.error('ERROR: ' + identityValidationResult.error);
            return {
              valid: false,
              error: identityValidationResult.error
            };
          }
          if (callback && !mpInstance._Helpers.Validators.isFunction(callback)) {
            var error = 'The optional callback must be a function. You tried entering a(n) ' + _typeof(callback);
            mpInstance.Logger.error(error);
            return {
              valid: false,
              error: error
            };
          }
          return {
            valid: true,
            cleanedIdentities: cleanedIdentityApiData
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
          if (newIdentities && isObject(newIdentities) && previousIdentities && isObject(previousIdentities)) {
            for (var key in newIdentities) {
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
            EndUnixtimeMs: aliasRequest.endTime,
            Scope: aliasRequest.scope
          };
        },
        convertToNative: function convertToNative(identityApiData) {
          var nativeIdentityRequest = [];
          if (identityApiData === null || identityApiData === void 0 ? void 0 : identityApiData.userIdentities) {
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
          return undefined;
        }
      };
      /**
       * Invoke these methods on the mParticle.Identity object.
       * Example: mParticle.Identity.getCurrentUser().
       * @class mParticle.Identity
       */
      this.IdentityAPI = {
        HTTPCodes: HTTPCodes$2,
        /**
         * Initiate a logout request to the mParticle server
         * @method identify
         * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
         * @param {Function} [callback] A callback function that is called when the identify request completes
         */
        identify: function identify(identityApiData, callback) {
          // https://go.mparticle.com/work/SQDSDKS-6337
          var mpid;
          var currentUser = mpInstance.Identity.getCurrentUser();
          var preProcessResult = mpInstance._Identity.IdentityRequest.preProcessIdentityRequest(identityApiData, callback, Identify);
          if (currentUser) {
            mpid = currentUser.getMPID();
          }
          if (preProcessResult.valid) {
            var identityApiRequest = mpInstance._Identity.IdentityRequest.createIdentityRequest(preProcessResult.cleanedIdentities, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, mpInstance._Store.deviceId, mpInstance._Store.context, mpid);
            if (mpInstance._Helpers.getFeatureFlag(Constants.FeatureFlags.CacheIdentity)) {
              var successfullyCachedIdentity = tryCacheIdentity(identityApiRequest.known_identities, self.idCache, self.parseIdentityResponse, mpid, callback, identityApiData, Identify);
              if (successfullyCachedIdentity) {
                return;
              }
            }
            if (mpInstance._Helpers.canLog()) {
              if (mpInstance._Store.webviewBridgeEnabled) {
                mpInstance._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Identify, JSON.stringify(mpInstance._Identity.IdentityRequest.convertToNative(identityApiData)));
                mpInstance._Helpers.invokeCallback(callback, HTTPCodes$2.nativeIdentityRequest, 'Identify request sent to native sdk');
              } else {
                mpInstance._IdentityAPIClient.sendIdentityRequest(identityApiRequest, Identify, callback, identityApiData, self.parseIdentityResponse, mpid, identityApiRequest.known_identities);
              }
            } else {
              mpInstance._Helpers.invokeCallback(callback, HTTPCodes$2.loggingDisabledOrMissingAPIKey, Messages$2.InformationMessages.AbandonLogEvent);
              mpInstance.Logger.verbose(Messages$2.InformationMessages.AbandonLogEvent);
            }
          } else {
            mpInstance._Helpers.invokeCallback(callback, HTTPCodes$2.validationIssue, preProcessResult.error);
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
          var mpid;
          var currentUser = mpInstance.Identity.getCurrentUser();
          var preProcessResult = mpInstance._Identity.IdentityRequest.preProcessIdentityRequest(identityApiData, callback, Logout);
          if (currentUser) {
            mpid = currentUser.getMPID();
          }
          if (preProcessResult.valid) {
            var evt_1;
            var identityApiRequest = mpInstance._Identity.IdentityRequest.createIdentityRequest(preProcessResult.cleanedIdentities, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, mpInstance._Store.deviceId, mpInstance._Store.context, mpid);
            if (mpInstance._Helpers.canLog()) {
              if (mpInstance._Store.webviewBridgeEnabled) {
                mpInstance._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Logout, JSON.stringify(mpInstance._Identity.IdentityRequest.convertToNative(identityApiData)));
                mpInstance._Helpers.invokeCallback(callback, HTTPCodes$2.nativeIdentityRequest, 'Logout request sent to native sdk');
              } else {
                mpInstance._IdentityAPIClient.sendIdentityRequest(identityApiRequest, Logout, callback, identityApiData, self.parseIdentityResponse, mpid);
                evt_1 = mpInstance._ServerModel.createEventObject({
                  messageType: Types.MessageType.Profile
                });
                evt_1.ProfileMessageType = Types.ProfileMessageType.Logout;
                if (mpInstance._Store.activeForwarders.length) {
                  mpInstance._Store.activeForwarders.forEach(function (forwarder) {
                    var kit = forwarder;
                    if (kit.logOut) {
                      kit.logOut(evt_1);
                    }
                  });
                }
              }
            } else {
              mpInstance._Helpers.invokeCallback(callback, HTTPCodes$2.loggingDisabledOrMissingAPIKey, Messages$2.InformationMessages.AbandonLogEvent);
              mpInstance.Logger.verbose(Messages$2.InformationMessages.AbandonLogEvent);
            }
          } else {
            mpInstance._Helpers.invokeCallback(callback, HTTPCodes$2.validationIssue, preProcessResult.error);
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
          var mpid;
          var currentUser = mpInstance.Identity.getCurrentUser();
          var preProcessResult = mpInstance._Identity.IdentityRequest.preProcessIdentityRequest(identityApiData, callback, Login);
          if (currentUser) {
            mpid = currentUser.getMPID();
          }
          if (preProcessResult.valid) {
            var identityApiRequest = mpInstance._Identity.IdentityRequest.createIdentityRequest(preProcessResult.cleanedIdentities, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, mpInstance._Store.deviceId, mpInstance._Store.context, mpid);
            if (mpInstance._Helpers.getFeatureFlag(Constants.FeatureFlags.CacheIdentity)) {
              var successfullyCachedIdentity = tryCacheIdentity(identityApiRequest.known_identities, self.idCache, self.parseIdentityResponse, mpid, callback, identityApiData, Login);
              if (successfullyCachedIdentity) {
                return;
              }
            }
            if (mpInstance._Helpers.canLog()) {
              if (mpInstance._Store.webviewBridgeEnabled) {
                mpInstance._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Login, JSON.stringify(mpInstance._Identity.IdentityRequest.convertToNative(identityApiData)));
                mpInstance._Helpers.invokeCallback(callback, HTTPCodes$2.nativeIdentityRequest, 'Login request sent to native sdk');
              } else {
                mpInstance._IdentityAPIClient.sendIdentityRequest(identityApiRequest, Login, callback, identityApiData, self.parseIdentityResponse, mpid, identityApiRequest.known_identities);
              }
            } else {
              mpInstance._Helpers.invokeCallback(callback, HTTPCodes$2.loggingDisabledOrMissingAPIKey, Messages$2.InformationMessages.AbandonLogEvent);
              mpInstance.Logger.verbose(Messages$2.InformationMessages.AbandonLogEvent);
            }
          } else {
            mpInstance._Helpers.invokeCallback(callback, HTTPCodes$2.validationIssue, preProcessResult.error);
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
          var mpid;
          var currentUser = mpInstance.Identity.getCurrentUser();
          var preProcessResult = mpInstance._Identity.IdentityRequest.preProcessIdentityRequest(identityApiData, callback, Modify$1);
          if (currentUser) {
            mpid = currentUser.getMPID();
          }
          if (preProcessResult.valid) {
            var newUserIdentities = (identityApiData === null || identityApiData === void 0 ? void 0 : identityApiData.userIdentities) ? preProcessResult.cleanedIdentities.userIdentities : {};
            var identityApiRequest = mpInstance._Identity.IdentityRequest.createModifyIdentityRequest(currentUser ? currentUser.getUserIdentities().userIdentities : {}, newUserIdentities, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, mpInstance._Store.context);
            if (mpInstance._Helpers.canLog()) {
              if (mpInstance._Store.webviewBridgeEnabled) {
                mpInstance._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Modify, JSON.stringify(mpInstance._Identity.IdentityRequest.convertToNative(identityApiData)));
                mpInstance._Helpers.invokeCallback(callback, HTTPCodes$2.nativeIdentityRequest, 'Modify request sent to native sdk');
              } else {
                mpInstance._IdentityAPIClient.sendIdentityRequest(identityApiRequest, Modify$1, callback, identityApiData, self.parseIdentityResponse, mpid);
              }
            } else {
              mpInstance._Helpers.invokeCallback(callback, HTTPCodes$2.loggingDisabledOrMissingAPIKey, Messages$2.InformationMessages.AbandonLogEvent);
              mpInstance.Logger.verbose(Messages$2.InformationMessages.AbandonLogEvent);
            }
          } else {
            mpInstance._Helpers.invokeCallback(callback, HTTPCodes$2.validationIssue, preProcessResult.error);
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
            message = Messages$2.ValidationMessages.AliasMissingMpid;
          }
          if (aliasRequest.destinationMpid === aliasRequest.sourceMpid) {
            message = Messages$2.ValidationMessages.AliasNonUniqueMpid;
          }
          if (!aliasRequest.startTime || !aliasRequest.endTime) {
            message = Messages$2.ValidationMessages.AliasMissingTime;
          }
          if (aliasRequest.startTime > aliasRequest.endTime) {
            message = Messages$2.ValidationMessages.AliasStartBeforeEndTime;
          }
          if (message) {
            mpInstance.Logger.warning(message);
            mpInstance._Helpers.invokeAliasCallback(callback, HTTPCodes$2.validationIssue, message);
            return;
          }
          if (mpInstance._Helpers.canLog()) {
            if (mpInstance._Store.webviewBridgeEnabled) {
              mpInstance._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Alias, JSON.stringify(mpInstance._Identity.IdentityRequest.convertAliasToNative(aliasRequest)));
              mpInstance._Helpers.invokeAliasCallback(callback, HTTPCodes$2.nativeIdentityRequest, 'Alias request sent to native sdk');
            } else {
              mpInstance.Logger.verbose(Messages$2.InformationMessages.StartingAliasRequest + ': ' + aliasRequest.sourceMpid + ' -> ' + aliasRequest.destinationMpid);
              var aliasRequestMessage = mpInstance._Identity.IdentityRequest.createAliasNetworkRequest(aliasRequest);
              mpInstance._IdentityAPIClient.sendAliasRequest(aliasRequestMessage, callback);
            }
          } else {
            mpInstance._Helpers.invokeAliasCallback(callback, HTTPCodes$2.loggingDisabledOrMissingAPIKey, Messages$2.InformationMessages.AbandonAliasUsers);
            mpInstance.Logger.verbose(Messages$2.InformationMessages.AbandonAliasUsers);
          }
        },
        /**
         * Search the IDSync Workspace endpoint for a known identity.
         *
         * POSTs to mParticle's `/v1/search` endpoint and invokes `callback`
         * with `{ httpCode, body? }`.
         *
         * The `workspaceApiKey` is a workspace-specific API key supplied by
         * the caller (passed in from a kit's settings). It is intentionally
         * NOT read from the SDK's own workspace token, so that workspace
         * searches can be authorised independently of the host SDK's
         * workspace.
         *
         * @method search
         * @param {String} workspaceApiKey Workspace API key (sent as x-mp-key).
         * @param {Object} knownIdentities A `UserIdentities` map.
         * @param {Function} callback Invoked with the `IIdentitySearchResult`.
         */
        search: function search(workspaceApiKey, knownIdentities, callback) {
          executeSearchRequest(mpInstance, workspaceApiKey, knownIdentities, callback);
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
        createAliasRequest: function createAliasRequest(sourceUser, destinationUser, scope) {
          try {
            if (!destinationUser || !sourceUser) {
              mpInstance.Logger.error("'destinationUser' and 'sourceUser' must both be present");
              return null;
            }
            var startTime_1 = sourceUser.getFirstSeenTime();
            if (!startTime_1) {
              mpInstance.Identity.getUsers().forEach(function (user) {
                if (user.getFirstSeenTime() && (!startTime_1 || user.getFirstSeenTime() < startTime_1)) {
                  startTime_1 = user.getFirstSeenTime();
                }
              });
            }
            var minFirstSeenTimeMs = new Date().getTime() - mpInstance._Store.SDKConfig.aliasMaxWindow * 24 * 60 * 60 * 1000;
            var endTime = sourceUser.getLastSeenTime() || new Date().getTime();
            //if the startTime is greater than $maxAliasWindow ago, adjust the startTime to the earliest allowed
            if (startTime_1 < minFirstSeenTimeMs) {
              startTime_1 = minFirstSeenTimeMs;
              if (endTime < startTime_1) {
                mpInstance.Logger.warning('Source User has not been seen in the last ' + mpInstance._Store.SDKConfig.maxAliasWindow + ' days, Alias Request will likely fail');
              }
            }
            return {
              destinationMpid: destinationUser.getMPID(),
              sourceMpid: sourceUser.getMPID(),
              startTime: startTime_1,
              endTime: endTime,
              scope: scope || 'device'
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
              if (!hasOwnProp(identities, identityType)) {
                continue;
              }
              var storedIdentityType = getIdentityTypeFromStoredKey(identityType);
              // Must be `=== null`: IdentityType.Other is 0, so a falsy
              // check would drop a valid stored Other identity.
              if (storedIdentityType === null) {
                continue;
              }
              currentUserIdentities[Types.IdentityType.getIdentityName(storedIdentityType)] = identities[identityType];
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
              mpInstance.Logger.error(Messages$2.ErrorMessages.BadKey);
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
              mpInstance.Logger.error(Messages$2.ErrorMessages.BadKey);
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
                mpInstance.Logger.error(Messages$2.ErrorMessages.BadAttribute);
                return;
              }
              if (!mpInstance._Helpers.Validators.isValidKeyValue(key)) {
                mpInstance.Logger.error(Messages$2.ErrorMessages.BadKey);
                return;
              }
              if (mpInstance._Store.webviewBridgeEnabled) {
                mpInstance._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetUserAttribute, JSON.stringify({
                  key: key,
                  value: newValue
                }));
              } else {
                var userAttributes = this.getAllUserAttributes();
                var previousUserAttributeValue = void 0;
                var isNewAttribute = void 0;
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
                mpInstance._Forwarders.initForwarders(self.IdentityAPI.getCurrentUser().getUserIdentities().userIdentities, mpInstance._APIClient.prepareForwardingStats);
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
              mpInstance.Logger.error('Must pass an object into setUserAttributes. You passed a ' + _typeof(userAttributes));
            }
          },
          /**
           * Removes a specific user attribute
           * @method removeUserAttribute
           * @param {String} key
           */
          removeUserAttribute: function removeUserAttribute(key) {
            var cookies;
            var userAttributes;
            mpInstance._SessionManager.resetSessionTimer();
            if (!mpInstance._Helpers.Validators.isValidKeyValue(key)) {
              mpInstance.Logger.error(Messages$2.ErrorMessages.BadKey);
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
              if (cookies && isObject(cookies[mpid])) {
                cookies[mpid].ua = userAttributes;
                mpInstance._Persistence.savePersistence(cookies);
              }
              self.sendUserAttributeChangeEvent(key, null, deletedUAKeyCopy, false, true, this);
              mpInstance._Forwarders.initForwarders(self.IdentityAPI.getCurrentUser().getUserIdentities().userIdentities, mpInstance._APIClient.prepareForwardingStats);
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
              mpInstance.Logger.error(Messages$2.ErrorMessages.BadKey);
              return;
            }
            if (!Array.isArray(newValue)) {
              mpInstance.Logger.error('The value you passed in to setUserAttributeList must be an array. You passed in a ' + _typeof(newValue));
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
              var previousUserAttributeValue = void 0;
              var isNewAttribute = void 0;
              var userAttributeChange = void 0;
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
              mpInstance._Forwarders.initForwarders(self.IdentityAPI.getCurrentUser().getUserIdentities().userIdentities, mpInstance._APIClient.prepareForwardingStats);
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
              mpInstance._Forwarders.initForwarders(self.IdentityAPI.getCurrentUser().getUserIdentities().userIdentities, mpInstance._APIClient.prepareForwardingStats);
              if (userAttributes) {
                for (var prop in userAttributes) {
                  if (hasOwnProp(userAttributes, prop)) {
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
            var userAttributes;
            var userAttributesLists = {};
            userAttributes = this.getAllUserAttributes();
            for (var key in userAttributes) {
              if (hasOwnProp(userAttributes, key) && !isReservedStoredPropertyName(key) && Array.isArray(userAttributes[key])) {
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
                if (hasOwnProp(userAttributes, prop) && !isReservedStoredPropertyName(prop)) {
                  var attrValue = userAttributes[prop];
                  if (Array.isArray(attrValue)) {
                    userAttributesCopy[prop] = attrValue.slice();
                  } else {
                    userAttributesCopy[prop] = attrValue;
                  }
                }
              }
            }
            return userAttributesCopy;
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
            mpInstance._CookieSyncManager.attemptCookieSync(this.getMPID());
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
              self.audienceManager = new AudienceManager(mpInstance._Store.SDKConfig.userAudienceUrl, mpInstance._Store.devToken, mpInstance.Logger);
            }
            self.audienceManager.sendGetUserAudienceRequest(mpid, callback);
          }
        };
      };
      // https://go.mparticle.com/work/SQDSDKS-6355
      this.parseIdentityResponse = function (identityResponse, previousMPID, callback, identityApiData, method, knownIdentities, parsingCachedResponse) {
        var _a, _b, _c;
        var prevUser = mpInstance.Identity.getUser(previousMPID);
        var prevUserMPID = prevUser ? prevUser.getMPID() : null;
        var previousUIByName = prevUser ? prevUser.getUserIdentities().userIdentities : {};
        var mpidIsNotInCookies;
        var identityApiResult;
        var newUser;
        var newIdentitiesByType = {};
        mpInstance._Store.identityCallInFlight = false;
        try {
          mpInstance.Logger.verbose('Parsing "' + method + '" identity response from server');
          identityApiResult = (_a = identityResponse.responseText) !== null && _a !== void 0 ? _a : null;
          mpInstance._Store.isLoggedIn = (identityApiResult === null || identityApiResult === void 0 ? void 0 : identityApiResult.is_logged_in) || false;
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
              mpInstance._CookieSyncManager.attemptCookieSync(identityApiResult.mpid, mpidIsNotInCookies);
              mpInstance._Persistence.swapCurrentUser(previousMPID, identityApiResult.mpid, mpInstance._Store.currentSessionMPIDs);
              if (identityApiData && !isEmpty(identityApiData.userIdentities)) {
                newIdentitiesByType = self.IdentityRequest.combineUserIdentities(incomingUIByName, identityApiData.userIdentities);
              }
              // https://go.mparticle.com/work/SQDSDKS-6041
              mpInstance._Store.setUserIdentities(identityApiResult.mpid, newIdentitiesByType);
              mpInstance._Persistence.update();
              mpInstance._Store.syncPersistenceData();
              // https://go.mparticle.com/work/SQDSDKS-6357
              mpInstance._Store.context = identityApiResult.context || mpInstance._Store.context;
            }
            newUser = mpInstance.Identity.getCurrentUser();
            // https://go.mparticle.com/work/SQDSDKS-6359
            tryOnUserAlias(prevUser, newUser, identityApiData, mpInstance.Logger, mpInstance._ErrorReportingDispatcher);
            var persistence = mpInstance._Persistence.getPersistence();
            if (newUser) {
              mpInstance._Persistence.storeDataInMemory(persistence, newUser.getMPID());
              self.reinitForwardersOnUserChange(prevUser, newUser);
              self.setForwarderCallbacks(newUser, method);
            }
            var newIdentitiesByName = IdentityType.getNewIdentitiesByName(newIdentitiesByType);
            var uiByName = method === Modify$1 ? previousUIByName : incomingUIByName;
            // Sync $NoTargeting before sendUserIdentityChangeEvent
            // because UIC events call sendEventToServer which triggers
            // processQueuedEvents, draining the event queue. The
            // attribute must be in the store before that happens so
            // appendUserInfo picks it up.
            (_b = mpInstance._CookieConsentManager) === null || _b === void 0 ? void 0 : _b.syncNoTargetingAttribute(newUser);
            // https://go.mparticle.com/work/SQDSDKS-6501
            self.sendUserIdentityChangeEvent(newIdentitiesByName, method, identityApiResult.mpid, uiByName);
          }
          if (callback) {
            var callbackCode = identityResponse.status === 0 ? HTTPCodes$2.noHttpCoverage : identityResponse.status;
            mpInstance._Helpers.invokeCallback(callback, callbackCode, identityApiResult || null, newUser, previousMPID);
          } else if (identityApiResult && !isEmpty(identityApiResult.errors)) {
            // https://go.mparticle.com/work/SQDSDKS-6500
            mpInstance.Logger.error('Received HTTP response code of ' + identityResponse.status + ' - ' + identityApiResult.errors[0].message);
          }
          mpInstance.Logger.verbose('Successfully parsed Identity Response');
          // https://go.mparticle.com/work/SQDSDKS-6654
          (_c = mpInstance._APIClient) === null || _c === void 0 ? void 0 : _c.processQueuedEvents();
        } catch (e) {
          if (callback) {
            mpInstance._Helpers.invokeCallback(callback, identityResponse.status, identityApiResult || null);
          }
          mpInstance.Logger.error('Error parsing JSON response from Identity server: ' + e);
        }
        mpInstance._Store.isInitialized = true;
        mpInstance._RoktManager.onIdentityComplete();
        mpInstance._preInit.readyQueue = processReadyQueue(mpInstance._preInit.readyQueue, mpInstance.Logger);
      };
      // send a user identity change request on identify, login, logout, modify when any values change.
      // compare what identities exist vs what is previously was for the specific user if they were in memory before.
      // if it's the first time the user is logging in, send a user identity change request with
      this.sendUserIdentityChangeEvent = function (newUserIdentities, method, mpid, prevUserIdentities) {
        var _a;
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
            // If a new identity type was introduced when the identity changes
            // we need to notify the server so that the user profile is updated in
            // the mParticle UI.
            var isNewUserIdentityType = !prevUserIdentities[identityType];
            var userIdentityChangeEvent = self.createUserIdentityChange(identityType, newUserIdentities[identityType], prevUserIdentities[identityType], isNewUserIdentityType, currentUserInMemory);
            (_a = mpInstance._APIClient) === null || _a === void 0 ? void 0 : _a.sendEventToServer(userIdentityChangeEvent);
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
        var _a;
        var userAttributeChangeEvent = self.createUserAttributeChange(attributeKey, newUserAttributeValue, previousUserAttributeValue, isNewAttribute, deleted, user);
        if (userAttributeChangeEvent) {
          (_a = mpInstance._APIClient) === null || _a === void 0 ? void 0 : _a.sendEventToServer(userAttributeChangeEvent);
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
        var _a;
        if (hasMPIDAndUserLoginChanged(prevUser, newUser)) {
          (_a = mpInstance._Forwarders) === null || _a === void 0 ? void 0 : _a.initForwarders(newUser.getUserIdentities().userIdentities, mpInstance._APIClient.prepareForwardingStats);
        }
      };
      this.setForwarderCallbacks = function (user, method) {
        var _a, _b, _c;
        // https://go.mparticle.com/work/SQDSDKS-6036
        (_a = mpInstance._Forwarders) === null || _a === void 0 ? void 0 : _a.setForwarderUserIdentities(user.getUserIdentities().userIdentities);
        (_b = mpInstance._Forwarders) === null || _b === void 0 ? void 0 : _b.setForwarderOnIdentityComplete(user, method);
        (_c = mpInstance._Forwarders) === null || _c === void 0 ? void 0 : _c.setForwarderOnUserIdentified(user);
      };
    }
    // https://go.mparticle.com/work/SQDSDKS-6359
    function tryOnUserAlias(previousUser, newUser, identityApiData, logger, errorReporter) {
      if (identityApiData && identityApiData.onUserAlias && isFunction(identityApiData.onUserAlias)) {
        try {
          logDeprecatedMethodUsage({
            methodName: 'onUserAlias',
            warningMessage: generateDeprecationMessage('onUserAlias')
          }, logger, errorReporter);
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
        var isDate = timestamp instanceof Date;
        if (isDate) {
          timestamp = timestamp.getTime();
        }
        if ((timestamp || isDate) && (typeof timestamp !== 'number' && typeof timestamp !== 'string' || isNaN(timestamp))) {
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
          if (!isObject(json)) {
            return state;
          }
          if (isObject(json.gdpr)) {
            for (var purpose in json.gdpr) {
              if (hasOwnProp(json.gdpr, purpose)) {
                state.addGDPRConsentState(purpose, privacyConsentFromMinifiedJson(json.gdpr[purpose]));
              }
            }
          }
          if (isObject(json.ccpa)) {
            if (hasOwnProp(json.ccpa, CCPAPurpose)) {
              state.setCCPAConsentState(privacyConsentFromMinifiedJson(json.ccpa[CCPAPurpose]));
            }
          }
          return state;
        }
      };
      function privacyConsentFromMinifiedJson(minifiedConsent) {
        if (!isObject(minifiedConsent)) {
          return null;
        }
        return self.createPrivacyConsent(minifiedConsent.c, minifiedConsent.ts, minifiedConsent.d, minifiedConsent.l, minifiedConsent.h);
      }
      // TODO: Refactor this method into a constructor
      this.createConsentState = function (consentState) {
        var gdpr = {};
        var ccpa = {};
        if (consentState) {
          var consentStateCopy = self.createConsentState();
          consentStateCopy.setGDPRConsentState(consentState.getGDPRConsentState());
          consentStateCopy.setCCPAConsentState(consentState.getCCPAConsentState());
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
         * @param purpose [String] Data processing purpose that describes the type of processing done on the data subject\u2019s data
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
         * @param purpose [String] Data processing purpose that describes the type of processing done on the data subject\u2019s data
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
        return {
          setGDPRConsentState: setGDPRConsentState,
          addGDPRConsentState: addGDPRConsentState,
          setCCPAConsentState: setCCPAConsentState,
          getCCPAConsentState: getCCPAConsentState,
          getGDPRConsentState: getGDPRConsentState,
          removeGDPRConsentState: removeGDPRConsentState,
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
    var withNoChange = function withNoChange(event) {
      return event;
    };
    var withoutUserAttributes = function withoutUserAttributes(event) {
      return __assign(__assign({}, event), {
        UserAttributes: {}
      });
    };
    var withoutUserIdentities = function withoutUserIdentities(event) {
      return __assign(__assign({}, event), {
        UserIdentities: []
      });
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
        if (event) {
          event = this.applyBlockingStep('the event and its attributes', this.transformEventAndEventAttributes, event, withNoChange);
        }
        if (event && event.EventDataType === Types.MessageType.Commerce) {
          event = this.applyBlockingStep('product attributes', this.transformProductAttributes, event, withNoChange);
        }
        if (event) {
          event = this.applyBlockingStep('user attributes', this.transformUserAttributes, event, withoutUserAttributes);
          event = this.applyBlockingStep('user identities', this.transformUserIdentities, event, withoutUserIdentities);
        }
        return event;
      };
      KitBlocker.prototype.applyBlockingStep = function (filteredData, step, event, onFailure) {
        try {
          return step.call(this, event);
        } catch (stepError) {
          var fallbackEvent = onFailure(event);
          this.reportFailedStep(filteredData, stepError);
          return fallbackEvent;
        }
      };
      KitBlocker.prototype.reportFailedStep = function (filteredData, stepError) {
        try {
          this.mpInstance.Logger.error('Kit blocking could not filter ' + filteredData + ': ' + stepError);
        } catch (_a) {
          // Best-effort: a logger or error value that throws must not stop the remaining steps.
        }
      };
      KitBlocker.prototype.transformEventAndEventAttributes = function (event) {
        var clonedEvent = __assign({}, event);
        var baseEvent = convertEvent(clonedEvent);
        if (!baseEvent) {
          return clonedEvent;
        }
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
            if (clonedEvent.EventAttributes) {
              var plannedEventAttributes = {};
              for (var _i = 0, _a = Object.keys(clonedEvent.EventAttributes); _i < _a.length; _i++) {
                var key = _a[_i];
                if (matchedEvent[key] === true) {
                  plannedEventAttributes[key] = clonedEvent.EventAttributes[key];
                }
              }
              clonedEvent.EventAttributes = plannedEventAttributes;
            }
            return clonedEvent;
          } else {
            return clonedEvent;
          }
        }
        return clonedEvent;
      };
      KitBlocker.prototype.transformProductAttributes = function (event) {
        var clonedEvent = __assign({}, event);
        var baseEvent = convertEvent(clonedEvent);
        var matchKey = this.getProductAttributeMatchKey(baseEvent);
        var matchedEvent = this.dataPlanMatchLookups[matchKey];
        function withPlannedAttributesOnly(plannedAttributes, productList) {
          return productList === null || productList === void 0 ? void 0 : productList.map(function (product) {
            if (!product.Attributes) {
              return product;
            }
            var attributes = {};
            for (var _i = 0, _a = Object.keys(product.Attributes); _i < _a.length; _i++) {
              var productKey = _a[_i];
              if (plannedAttributes[productKey] === true) {
                attributes[productKey] = product.Attributes[productKey];
              }
            }
            return __assign(__assign({}, product), {
              Attributes: attributes
            });
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
            if (clonedEvent.ProductAction) {
              clonedEvent.ProductAction = __assign(__assign({}, clonedEvent.ProductAction), {
                ProductList: withPlannedAttributesOnly(matchedEvent, clonedEvent.ProductAction.ProductList)
              });
            } else if (clonedEvent.ProductImpressions) {
              clonedEvent.ProductImpressions = clonedEvent.ProductImpressions.map(function (impression) {
                return __assign(__assign({}, impression), {
                  ProductList: withPlannedAttributesOnly(matchedEvent, impression.ProductList)
                });
              });
            } else {
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
          var matchedAttributes = this.dataPlanMatchLookups['user_attributes'];
          if (this.mpInstance._Helpers.isObject(matchedAttributes) && clonedEvent.UserAttributes) {
            var plannedUserAttributes = {};
            for (var _i = 0, _a = Object.keys(clonedEvent.UserAttributes); _i < _a.length; _i++) {
              var ua = _a[_i];
              if (matchedAttributes[ua] === true) {
                plannedUserAttributes[ua] = clonedEvent.UserAttributes[ua];
              }
            }
            clonedEvent.UserAttributes = plannedUserAttributes;
          }
        }
        return clonedEvent;
      };
      KitBlocker.prototype.isAttributeKeyBlocked = function (key) {
        /* used when an attribute is added to the user */
        if (!this.blockUserAttributes) {
          return false;
        }
        var matchedAttributes = this.dataPlanMatchLookups['user_attributes'];
        // When additionalProperties is set to true, matchedAttributes 
        // will be a boolean, otherwise it will return an object
        if (typeof matchedAttributes === 'boolean' && matchedAttributes) {
          return false;
        }
        if (_typeof(matchedAttributes) === "object") {
          if (matchedAttributes[key] === true) {
            return false;
          } else {
            return true;
          }
        }
        // When "Block unplanned user attributes" is enabled and "Allow unplanned user
        // attributes" is also enabled in the UI, allowing unplanned user attributes will be prioritized
        return false;
      };
      KitBlocker.prototype.isIdentityBlocked = function (key) {
        /* used when an attribute is added to the user */
        if (!this.blockUserIdentities) {
          return false;
        }
        if (this.blockUserIdentities) {
          var matchedIdentities = this.dataPlanMatchLookups['user_identities'];
          var unplannedIdentitiesAllowed = matchedIdentities === true;
          // The lookup is absent, not empty, when the plan carries no
          // user_identities data point, and indexing it would throw.
          var planHasNoIdentityDataPoint = !matchedIdentities;
          if (unplannedIdentitiesAllowed || planHasNoIdentityDataPoint) {
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
        var clonedEvent = __assign({}, event);
        if (this.blockUserIdentities) {
          var matchedIdentities_1 = this.dataPlanMatchLookups['user_identities'];
          if (this.mpInstance._Helpers.isObject(matchedIdentities_1)) {
            if ((_a = clonedEvent === null || clonedEvent === void 0 ? void 0 : clonedEvent.UserIdentities) === null || _a === void 0 ? void 0 : _a.length) {
              clonedEvent.UserIdentities = clonedEvent.UserIdentities.filter(function (uiByType) {
                var identityName = Types.IdentityType.getIdentityName(_this.mpInstance._Helpers.parseNumber(uiByType.Type));
                return matchedIdentities_1[identityName];
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

    var HTTPCodes$1 = Constants.HTTPCodes,
      Messages$1 = Constants.Messages,
      IdentityMethods = Constants.IdentityMethods;
    var Modify = IdentityMethods.Modify;
    function IdentityAPIClient(mpInstance) {
      this.sendAliasRequest = function (aliasRequest, aliasCallback) {
        return __awaiter(this, void 0, void 0, function () {
          var Logger, invokeAliasCallback, aliasUrl, apiKey, uploadUrl, uploader, uploadPayload, response, aliasResponseBody, message, errorMessage, _a, xhrResponse, errorResponse, e_2, errorMessage;
          return __generator(this, function (_b) {
            switch (_b.label) {
              case 0:
                Logger = mpInstance.Logger;
                invokeAliasCallback = mpInstance._Helpers.invokeAliasCallback;
                aliasUrl = mpInstance._Store.SDKConfig.aliasUrl;
                apiKey = mpInstance._Store.devToken;
                Logger.verbose(Messages$1.InformationMessages.SendAliasHttp);
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
                _b.trys.push([1, 13,, 14]);
                return [4 /*yield*/, uploader.upload(uploadPayload)];
              case 2:
                response = _b.sent();
                aliasResponseBody = void 0;
                message = void 0;
                errorMessage = void 0;
                _a = response.status;
                switch (_a) {
                  case HTTP_ACCEPTED:
                    return [3 /*break*/, 3];
                  case HTTP_OK:
                    return [3 /*break*/, 3];
                  case HTTP_BAD_REQUEST:
                    return [3 /*break*/, 4];
                }
                return [3 /*break*/, 11];
              case 3:
                // https://go.mparticle.com/work/SQDSDKS-6670
                message = 'Received Alias Response from server: ' + JSON.stringify(response.status);
                return [3 /*break*/, 12];
              case 4:
                if (!response.json) return [3 /*break*/, 9];
                _b.label = 5;
              case 5:
                _b.trys.push([5, 7,, 8]);
                return [4 /*yield*/, response.json()];
              case 6:
                aliasResponseBody = _b.sent();
                return [3 /*break*/, 8];
              case 7:
                _b.sent();
                Logger.verbose('The request has no response body');
                return [3 /*break*/, 8];
              case 8:
                return [3 /*break*/, 10];
              case 9:
                xhrResponse = response;
                aliasResponseBody = xhrResponse.responseText ? JSON.parse(xhrResponse.responseText) : '';
                _b.label = 10;
              case 10:
                errorResponse = aliasResponseBody;
                if (errorResponse === null || errorResponse === void 0 ? void 0 : errorResponse.message) {
                  errorMessage = errorResponse.message;
                }
                message = 'Issue with sending Alias Request to mParticle Servers, received HTTP Code of ' + response.status;
                if (errorResponse === null || errorResponse === void 0 ? void 0 : errorResponse.code) {
                  message += ' - ' + errorResponse.code;
                }
                return [3 /*break*/, 12];
              case 11:
                {
                  throw new Error('Received HTTP Code of ' + response.status);
                }
              case 12:
                Logger.verbose(message);
                invokeAliasCallback(aliasCallback, response.status, errorMessage);
                return [3 /*break*/, 14];
              case 13:
                e_2 = _b.sent();
                errorMessage = getErrorMessage(e_2);
                Logger.error('Error sending alias request to mParticle servers. ' + errorMessage);
                invokeAliasCallback(aliasCallback, HTTPCodes$1.noHttpCoverage, errorMessage);
                return [3 /*break*/, 14];
              case 14:
                return [2 /*return*/];
            }
          });
        });
      };
      this.sendIdentityRequest = function (identityApiRequest, method, callback, originalIdentityApiData, parseIdentityResponse, mpid, knownIdentities) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function () {
          var requestCount, invokeCallback, Logger, errorReporter, previousMPID, uploadUrl, uploader, fetchPayload, response, identityResponse, message, _e, responseBody, errorResponse, errorMessage, responseText, isDevelopmentMode, responseToLog, errorMessage, requestCount, err_1, requestCount, errorMessage, msg;
          return __generator(this, function (_f) {
            switch (_f.label) {
              case 0:
                if ((_a = mpInstance._RoktManager) === null || _a === void 0 ? void 0 : _a.isInitialized) {
                  mpInstance._Store.identifyRequestCount = (mpInstance._Store.identifyRequestCount || 0) + 1;
                  requestCount = mpInstance._Store.identifyRequestCount;
                  mpInstance.captureTiming("".concat(requestCount, "-identityRequestStart"));
                }
                invokeCallback = mpInstance._Helpers.invokeCallback;
                Logger = mpInstance.Logger, errorReporter = mpInstance._ErrorReportingDispatcher;
                Logger.verbose(Messages$1.InformationMessages.SendIdentityBegin);
                if (!identityApiRequest) {
                  Logger.error(Messages$1.ErrorMessages.APIRequestEmpty);
                  return [2 /*return*/];
                }
                Logger.verbose(Messages$1.InformationMessages.SendIdentityHttp);
                if (mpInstance._Store.identityCallInFlight) {
                  invokeCallback(callback, HTTPCodes$1.activeIdentityRequest, 'There is currently an Identity request processing. Please wait for this to return before requesting again');
                  return [2 /*return*/];
                }
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
                mpInstance._Store.identityCallInFlight = true;
                _f.label = 1;
              case 1:
                _f.trys.push([1, 9,, 10]);
                return [4 /*yield*/, uploader.upload(fetchPayload)];
              case 2:
                response = _f.sent();
                identityResponse = void 0;
                message = void 0;
                _e = response.status;
                switch (_e) {
                  case HTTP_ACCEPTED:
                    return [3 /*break*/, 3];
                  case HTTP_OK:
                    return [3 /*break*/, 3];
                  case HTTP_BAD_REQUEST:
                    return [3 /*break*/, 3];
                }
                return [3 /*break*/, 7];
              case 3:
                if (!response.json) return [3 /*break*/, 5];
                return [4 /*yield*/, response.json()];
              case 4:
                responseBody = _f.sent();
                identityResponse = this.getIdentityResponseFromFetch(response, responseBody);
                return [3 /*break*/, 6];
              case 5:
                identityResponse = this.getIdentityResponseFromXHR(response);
                _f.label = 6;
              case 6:
                if (identityResponse.status === HTTP_BAD_REQUEST) {
                  errorResponse = identityResponse.responseText;
                  message = 'Issue with sending Identity Request to mParticle Servers, received HTTP Code of ' + identityResponse.status;
                  if (errorResponse === null || errorResponse === void 0 ? void 0 : errorResponse.Errors) {
                    errorMessage = errorResponse.Errors.map(function (error) {
                      return error.message;
                    }).join(', ');
                    message += ' - ' + errorMessage;
                  }
                } else if (Logger.isVerbose()) {
                  responseText = identityResponse.responseText;
                  isDevelopmentMode = mpInstance._Store.SDKConfig.isDevelopmentMode;
                  responseToLog = responseText;
                  if (!isDevelopmentMode && (responseText === null || responseText === void 0 ? void 0 : responseText.matched_identities)) {
                    responseToLog = __assign(__assign({}, responseText), {
                      matched_identities: _obfuscateData(responseText.matched_identities)
                    });
                  }
                  message = 'Received Identity Response from server: ' + JSON.stringify(responseToLog);
                }
                return [3 /*break*/, 8];
              case 7:
                {
                  if (response.status >= HTTP_SERVER_ERROR) {
                    throw new Error('Received HTTP Code of ' + response.status);
                  }
                  mpInstance._Store.identityCallInFlight = false;
                  mpInstance._Store.identityCallFailed = false;
                  errorMessage = 'Received HTTP Code of ' + response.status;
                  Logger.error('Error sending identity request to servers - ' + errorMessage);
                  invokeCallback(callback, HTTPCodes$1.noHttpCoverage, errorMessage);
                  return [2 /*return*/];
                }
              case 8:
                mpInstance._Store.identityCallInFlight = false;
                mpInstance._Store.identityCallFailed = false;
                if (message) {
                  Logger.verbose(message);
                }
                if ((_b = mpInstance._RoktManager) === null || _b === void 0 ? void 0 : _b.isInitialized) {
                  requestCount = mpInstance._Store.identifyRequestCount;
                  mpInstance.captureTiming("".concat(requestCount, "-identityRequestEnd"));
                }
                parseIdentityResponse(identityResponse, previousMPID, callback, originalIdentityApiData, method, knownIdentities, false);
                return [3 /*break*/, 10];
              case 9:
                err_1 = _f.sent();
                mpInstance._Store.identityCallInFlight = false;
                mpInstance._Store.identityCallFailed = true;
                if ((_c = mpInstance._RoktManager) === null || _c === void 0 ? void 0 : _c.isInitialized) {
                  requestCount = mpInstance._Store.identifyRequestCount;
                  mpInstance.captureTiming("".concat(requestCount, "-identityRequestEnd"));
                }
                errorMessage = getErrorMessage(err_1);
                msg = 'Error sending identity request to servers' + ' - ' + errorMessage;
                Logger.error(msg);
                errorReporter === null || errorReporter === void 0 ? void 0 : errorReporter.report({
                  message: msg,
                  code: ErrorCodes.IDENTITY_REQUEST,
                  severity: WSDKErrorSeverity.ERROR
                });
                (_d = mpInstance.processQueueOnIdentityFailure) === null || _d === void 0 ? void 0 : _d.call(mpInstance);
                invokeCallback(callback, HTTPCodes$1.noHttpCoverage, errorMessage);
                return [3 /*break*/, 10];
              case 10:
                return [2 /*return*/];
            }
          });
        });
      };
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

    var PASSBACK_CONVERSION_TRACKING_ID = 'passbackconversiontrackingid';
    // One signal per kind (commit, wallet, checkout_step, frame and cart), with an
    // add-to-cart click apart from a cart open, so a new one never evicts another.
    var CHECKOUT_INTENT_BUFFER_LIMIT = 6;
    var CHECKOUT_INTENT_MAX_AGE_MS = 30000;
    var ON_SHOPPABLE_ADS_READY_METHOD = 'onShoppableAdsReady';
    // The purpose of this class is to create a link between the Core mParticle SDK and the
    // Rokt Web SDK via a Web Kit.
    // The Rokt Manager should load before the Web Kit and stubs out many of the
    // Rokt Web SDK functions with an internal message queue in case a Rokt function
    // is requested before the Rokt Web Kit or SDK is finished loaded.
    // Once the Rokt Kit is attached to the Rokt Manager, we can consider the
    // Rokt Manager in a "ready" state and it can begin sending data to the kit.
    //
    // https://github.com/mparticle-integrations/mparticle-javascript-integration-rokt
    var RoktManager = /** @class */function () {
      // Keys this manager's route subscription, so a re-executed bundle's manager replaces
      // it while a second named instance keeps its own.
      function RoktManager(instanceName) {
        this.instanceName = instanceName;
        this.kit = null;
        this.filters = {};
        this.currentUser = null;
        this.messageQueue = new Map();
        this.sandbox = null;
        this.placementAttributesMapping = [];
        this.onReadyCallback = null;
        this.initialized = false;
        this.isShoppableAdsLoaded = false;
        this.stopRouteChangeWatch = null;
        // Checkout intent raised before the kit attached: latest per kind.
        this.pendingCheckoutIntents = [];
        // Off until SDK init finds the Rokt connection receives auto button clicks.
        this.autoButtonClicksForwarded = false;
      }
      /**
       * Sets a callback to be invoked when RoktManager becomes ready
       */
      RoktManager.prototype.setOnReadyCallback = function (callback) {
        this.onReadyCallback = callback;
      };
      /**
       * Initializes the RoktManager with configuration settings and user data.
       *
       * @param {IKitConfigs} roktConfig - Configuration object containing user attribute filters and settings
       * @param {IMParticleUser} filteredUser - User object with filtered attributes
       * @param {SDKIdentityApi} identityService - The mParticle Identity instance
       * @param {SDKLoggerApi} logger - The mParticle Logger instance
       * @param {IRoktOptions} options - Options for the RoktManager
       * @param {Function} captureTiming - Function to capture performance timing marks
       * @param {IErrorReportingService} errorReporter - Dispatcher for error/warning reporting
       * @param {ILoggingService} loggingService - Dispatcher for informational logging
       * @param {Function} createFilteredUser - Builds a user as the Rokt connection's filters and the data plan allow
       *
       * @throws Logs error to console if placementAttributesMapping parsing fails
       */
      RoktManager.prototype.init = function (roktConfig, filteredUser, identityService, store, logger, options, captureTiming, errorReporter, loggingService, integrationCapture, createFilteredUser) {
        var _a, _b;
        var _c = roktConfig || {},
          userAttributeFilters = _c.userAttributeFilters,
          settings = _c.settings;
        var _d = settings || {},
          placementAttributesMapping = _d.placementAttributesMapping,
          hashedEmailUserIdentityType = _d.hashedEmailUserIdentityType;
        this.mappedEmailShaIdentityType = (_a = hashedEmailUserIdentityType === null || hashedEmailUserIdentityType === void 0 ? void 0 : hashedEmailUserIdentityType.toLowerCase()) !== null && _a !== void 0 ? _a : null;
        this.identityService = identityService;
        this.store = store;
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.loggingService = loggingService;
        this.captureTiming = captureTiming;
        this.integrationCapture = integrationCapture;
        this.createFilteredUser = createFilteredUser;
        (_b = this.captureTiming) === null || _b === void 0 ? void 0 : _b.call(this, PerformanceMarkType.JointSdkRoktKitInit);
        this.filters = {
          userAttributeFilters: userAttributeFilters,
          filterUserAttributes: KitFilterHelper.filterUserAttributes,
          filteredUser: filteredUser
        };
        try {
          this.placementAttributesMapping = parseSettingsString(placementAttributesMapping);
        } catch (error) {
          this.logger.error('Error parsing placement attributes mapping from config: ' + error);
        }
        // This is the global setting for sandbox mode
        // It is set here and passed in to the createLauncher method in the Rokt Kit
        // This is not to be confused for the `sandbox` flag in the selectPlacements attributes
        // as that is independent of this setting, though they share the same name.
        var sandbox = (options === null || options === void 0 ? void 0 : options.sandbox) || false;
        // Launcher options are set here for the kit to pick up and pass through
        // to the Rokt Launcher.
        var launcherOptions = normalizeRoktLauncherOptions(options === null || options === void 0 ? void 0 : options.launcherOptions);
        this.launcherOptions = __assign({
          sandbox: sandbox
        }, launcherOptions);
        if (options === null || options === void 0 ? void 0 : options.domain) {
          this.domain = options.domain;
        }
        // initialized indicates that init() has been called and the RoktManager has been initialized.
        // This is different from isReady(), which only returns true once the kit has been attached 
        // (which is asynchronous), and has a launcher.
        this.initialized = true;
      };
      Object.defineProperty(RoktManager.prototype, "isInitialized", {
        get: function get() {
          return this.initialized;
        },
        enumerable: false,
        configurable: true
      });
      RoktManager.prototype.attachKit = function (kit) {
        var _a, _b, _c, _d;
        this.kit = kit;
        this.watchRouteChanges();
        this.flushCheckoutIntents();
        if ((_a = kit.settings) === null || _a === void 0 ? void 0 : _a.accountId) {
          this.store.setRoktAccountId(kit.settings.accountId);
        }
        if (kit.integrationName) {
          (_b = this.store) === null || _b === void 0 ? void 0 : _b.setIntegrationName(kit.integrationName);
        }
        this.processMessageQueue();
        try {
          (_c = this.onReadyCallback) === null || _c === void 0 ? void 0 : _c.call(this);
        } catch (e) {
          (_d = this.logger) === null || _d === void 0 ? void 0 : _d.error('RoktManager: Error in onReadyCallback: ' + e);
        }
      };
      // Core already emits a page view per navigation when AutoLogPageView is on, so the kit
      // subscribes to route changes only when it is off. The call on attach happens either
      // way: the auto page view fires once per page load, so a re-init emits none.
      RoktManager.prototype.watchRouteChanges = function () {
        var _this = this;
        var _a, _b, _c;
        if (!isFunction((_a = this.kit) === null || _a === void 0 ? void 0 : _a.onRouteChange)) {
          (_b = this.stopRouteChangeWatch) === null || _b === void 0 ? void 0 : _b.call(this);
          this.stopRouteChangeWatch = null;
          return;
        }
        if (this.isAutoLogPageViewEnabled()) {
          (_c = this.stopRouteChangeWatch) === null || _c === void 0 ? void 0 : _c.call(this);
          this.stopRouteChangeWatch = null;
        } else if (!this.stopRouteChangeWatch) {
          this.stopRouteChangeWatch = subscribeToRouteChange("rokt:".concat(this.instanceName), function () {
            return _this.notifyRouteChange();
          });
        }
        // A full navigation or a re-init lands on the trigger route without a route change
        // of its own.
        this.notifyRouteChange();
      };
      // Reads `this.kit` at call time, so a kit attached by a later init() takes over.
      RoktManager.prototype.notifyRouteChange = function () {
        var _a, _b, _c;
        try {
          (_b = (_a = this.kit) === null || _a === void 0 ? void 0 : _a.onRouteChange) === null || _b === void 0 ? void 0 : _b.call(_a);
        } catch (e) {
          (_c = this.logger) === null || _c === void 0 ? void 0 : _c.error("RoktManager: Error in onRouteChange: ".concat(getErrorMessage(e)));
        }
      };
      RoktManager.prototype.setAutoButtonClicksForwarded = function (forwarded) {
        this.autoButtonClicksForwarded = forwarded;
      };
      // noTargeting (which noDeviceId implies), doNotShareOrSell or Global Privacy
      // Control. Unlike noFunctional, these also stop auto button and link clicks
      // from being logged.
      RoktManager.prototype.hasTargetingOptOut = function () {
        var options = this.launcherOptions || {};
        if (options.noTargeting || options.doNotShareOrSell) {
          return true;
        }
        var nav = typeof navigator === 'undefined' ? undefined : navigator;
        return !!nav && nav.globalPrivacyControl === true;
      };
      // Checkout intent is off unless the flag is on, and under opt-out, any Rokt
      // privacy launcher option, Global Privacy Control, or a Rokt connection that
      // does not receive auto button clicks.
      RoktManager.prototype.isCheckoutIntentSuppressed = function () {
        var _a, _b, _c;
        var flags = (_b = (_a = this.store) === null || _a === void 0 ? void 0 : _a.SDKConfig) === null || _b === void 0 ? void 0 : _b.flags;
        if (!flags || flags[Constants.FeatureFlags.AutoButtonTracking] !== true || !this.store.isEnabled || !this.autoButtonClicksForwarded) {
          return true;
        }
        return !!((_c = this.launcherOptions) === null || _c === void 0 ? void 0 : _c.noFunctional) || this.hasTargetingOptOut();
      };
      // True when the kit can wait for the shopper's confirm click: signals are not
      // suppressed and the browser exposes the composed path the detector reads.
      // Decided from config alone, so tracker setup and teardown never change it.
      RoktManager.prototype.isCheckoutIntentLive = function () {
        if (this.isCheckoutIntentSuppressed()) {
          return false;
        }
        return typeof Event !== 'undefined' && isFunction(Event.prototype.composedPath);
      };
      // Reads `this.kit` at call time; before a kit attaches the signal is buffered
      // with the path it was raised on.
      RoktManager.prototype.notifyCheckoutIntent = function (signal, pathname) {
        var _a;
        if (pathname === void 0) {
          pathname = window.location.pathname;
        }
        if (this.isCheckoutIntentSuppressed()) {
          return;
        }
        var kit = this.kit;
        if (!kit) {
          // One per kind, with an add-to-cart click kept apart from a
          // click that opens the cart.
          this.pendingCheckoutIntents = this.pendingCheckoutIntents.filter(function (pending) {
            return pending.signal.kind !== signal.kind || !!pending.signal.adds !== !!signal.adds;
          }).concat({
            signal: signal,
            pathname: pathname
          }).slice(-CHECKOUT_INTENT_BUFFER_LIMIT);
          return;
        }
        try {
          if (isFunction(kit.onCheckoutIntent)) {
            kit.onCheckoutIntent(signal);
          }
        } catch (e) {
          (_a = this.logger) === null || _a === void 0 ? void 0 : _a.error("RoktManager: Error in onCheckoutIntent: ".concat(getErrorMessage(e)));
        }
      };
      RoktManager.prototype.discardCheckoutIntents = function () {
        this.pendingCheckoutIntents = [];
      };
      // Under the same gates as checkout intent. A pick made before a kit
      // attaches is not kept: the shopper is still choosing, and the next pick
      // replaces it.
      RoktManager.prototype.notifyPaymentPick = function (signal) {
        var _a;
        if (this.isCheckoutIntentSuppressed()) {
          return;
        }
        var kit = this.kit;
        try {
          if (kit && isFunction(kit.onPaymentPick)) {
            kit.onPaymentPick(signal);
          }
        } catch (e) {
          (_a = this.logger) === null || _a === void 0 ? void 0 : _a.error("RoktManager: Error in onPaymentPick: ".concat(getErrorMessage(e)));
        }
      };
      // Replays recent buffered signals raised on the current page, oldest first.
      RoktManager.prototype.flushCheckoutIntents = function () {
        var _this = this;
        var pending = this.pendingCheckoutIntents;
        this.pendingCheckoutIntents = [];
        var now = Date.now();
        var pathname = window.location.pathname;
        pending.filter(function (_a) {
          var signal = _a.signal,
            signalPathname = _a.pathname;
          return now - signal.t < CHECKOUT_INTENT_MAX_AGE_MS && signalPathname === pathname;
        }).sort(function (a, b) {
          return a.signal.t - b.signal.t;
        }).forEach(function (_a) {
          var signal = _a.signal;
          return _this.notifyCheckoutIntent(signal);
        });
      };
      // The Rokt kit reads this to tell core's page views, whose title and utm
      // attributes a filter may have removed, from ones logged by hand.
      RoktManager.prototype.isAutoLogPageViewEnabled = function () {
        var _a, _b, _c;
        return ((_c = (_b = (_a = this.store) === null || _a === void 0 ? void 0 : _a.SDKConfig) === null || _b === void 0 ? void 0 : _b.flags) === null || _c === void 0 ? void 0 : _c[Constants.FeatureFlags.AutoLogPageView]) === true;
      };
      /**
       * Renders ads based on the options provided
       *
       * @param {IRoktSelectPlacementsOptions} options - The options for selecting placements, including attributes and optional identifier
       * @returns {Promise<IRoktSelection>} A promise that resolves to the selection
       *
       * @example
       * // Correct usage with await
       * await window.mParticle.Rokt.selectPlacements({
       *   attributes: {
       *     email: 'user@example.com',
       *     customAttr: 'value'
       *   }
       * });
       */
      RoktManager.prototype.selectPlacements = function (options) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
        return __awaiter(this, void 0, void 0, function () {
          var attributes, sandboxValue, mappedAttributes, attributesToLog, currentUserIdentities, currentEmail, newEmail, currentHashedEmail, newHashedEmail, isValidHashedEmailIdentityType, emailChanged, hashedEmailChanged, newIdentities_1, msg, msg, userAttributes_1, roktUser, roktUserIdentities, timeOnSite, totalTimeOnSite, enrichedAttributes, hashedEmail, capturedAttrs, passbackId, enrichedOptions;
          var _this = this;
          return __generator(this, function (_t) {
            (_a = this.captureTiming) === null || _a === void 0 ? void 0 : _a.call(this, PerformanceMarkType.JointSdkSelectPlacements);
            // Queue if kit isn't ready OR if identity is in flight
            if (!this.isReady() || ((_b = this.store) === null || _b === void 0 ? void 0 : _b.identityCallInFlight)) {
              return [2 /*return*/, this.deferredCall('selectPlacements', options)];
            }
            try {
              attributes = options.attributes;
              sandboxValue = (attributes === null || attributes === void 0 ? void 0 : attributes.sandbox) || null;
              mappedAttributes = this.mapPlacementAttributes(attributes, this.placementAttributesMapping);
              if ((_c = this.logger) === null || _c === void 0 ? void 0 : _c.isVerbose()) {
                attributesToLog = obfuscateDevData(attributes, (_e = (_d = this.store) === null || _d === void 0 ? void 0 : _d.SDKConfig) === null || _e === void 0 ? void 0 : _e.isDevelopmentMode);
                this.logger.verbose("mParticle.Rokt selectPlacements called with attributes:\n".concat(JSON.stringify(attributesToLog, null, 2)));
              }
              this.currentUser = this.identityService.getCurrentUser();
              currentUserIdentities = ((_g = (_f = this.currentUser) === null || _f === void 0 ? void 0 : _f.getUserIdentities()) === null || _g === void 0 ? void 0 : _g.userIdentities) || {};
              currentEmail = currentUserIdentities.email;
              newEmail = mappedAttributes.email;
              currentHashedEmail = void 0;
              newHashedEmail = void 0;
              isValidHashedEmailIdentityType = this.mappedEmailShaIdentityType && IdentityType.getIdentityType(this.mappedEmailShaIdentityType) !== false;
              if (isValidHashedEmailIdentityType) {
                currentHashedEmail = currentUserIdentities[this.mappedEmailShaIdentityType];
                newHashedEmail = mappedAttributes['emailsha256'] || mappedAttributes[this.mappedEmailShaIdentityType] || undefined;
              }
              emailChanged = this.hasIdentityChanged(currentEmail, newEmail);
              hashedEmailChanged = this.hasIdentityChanged(currentHashedEmail, newHashedEmail);
              newIdentities_1 = {};
              if (emailChanged) {
                newIdentities_1.email = newEmail;
                if (newEmail) {
                  msg = 'Email mismatch detected. Current email differs from email passed to selectPlacements call. Proceeding to call identify with email from selectPlacements call. Please verify your implementation.';
                  this.logger.warning(msg);
                  (_h = this.errorReporter) === null || _h === void 0 ? void 0 : _h.report({
                    message: msg,
                    code: ErrorCodes.IDENTITY_MISMATCH,
                    severity: WSDKErrorSeverity.WARNING
                  });
                }
              }
              if (hashedEmailChanged) {
                newIdentities_1[this.mappedEmailShaIdentityType] = newHashedEmail;
                msg = 'emailsha256 mismatch detected. Current mParticle hashedEmail differs from hashedEmail passed to selectPlacements call. Proceeding to call identify with hashedEmail from selectPlacements call. Please verify your implementation.';
                this.logger.warning(msg);
                (_j = this.errorReporter) === null || _j === void 0 ? void 0 : _j.report({
                  message: msg,
                  code: ErrorCodes.IDENTITY_MISMATCH,
                  severity: WSDKErrorSeverity.WARNING
                });
              }
              userAttributes_1 = this.toUserAttributes(mappedAttributes);
              if (isEmpty(newIdentities_1)) {
                this.setUserAttributes(this.currentUser, userAttributes_1);
              } else {
                // Fire-and-forget identify \u2014 best-effort, does not block selectPlacements
                try {
                  this.identityService.identify({
                    userIdentities: __assign(__assign({}, currentUserIdentities), newIdentities_1)
                  }, function (result) {
                    var _a;
                    var httpCode = Number(result === null || result === void 0 ? void 0 : result.httpCode);
                    if (httpCode && (httpCode >= 400 || httpCode < 0)) {
                      _this.logger.error('Background identify failed with HTTP ' + httpCode);
                    }
                    _this.setUserAttributes((_a = result === null || result === void 0 ? void 0 : result.getUser) === null || _a === void 0 ? void 0 : _a.call(result), userAttributes_1, newIdentities_1);
                    // Drain any selectPlacements calls that were deferred while
                    // identify was in-flight. By the time this callback fires,
                    // identityCallInFlight has already been reset to false.
                    _this.processMessageQueue();
                  });
                } catch (error) {
                  this.logger.error('Background identify threw an error: ' + getErrorMessage(error));
                  this.setUserAttributes(this.identityService.getCurrentUser(), userAttributes_1, newIdentities_1);
                }
              }
              roktUser = this.currentUser && this.createFilteredUser ? this.createFilteredUser(this.currentUser.getMPID()) : null;
              roktUserIdentities = ((_k = roktUser === null || roktUser === void 0 ? void 0 : roktUser.getUserIdentities()) === null || _k === void 0 ? void 0 : _k.userIdentities) || {};
              timeOnSite = (_m = (_l = this.store) === null || _l === void 0 ? void 0 : _l.getTimeOnSite) === null || _m === void 0 ? void 0 : _m.call(_l);
              totalTimeOnSite = (_p = (_o = this.store) === null || _o === void 0 ? void 0 : _o.getTotalTimeOnSite) === null || _p === void 0 ? void 0 : _p.call(_o);
              enrichedAttributes = __assign(__assign(__assign(__assign({}, mappedAttributes), sandboxValue !== null ? {
                sandbox: sandboxValue
              } : {}), timeOnSite ? {
                active_time_on_site_ms: timeOnSite
              } : {}), totalTimeOnSite ? {
                total_time_on_site_ms: totalTimeOnSite
              } : {});
              // Propagate email from current user identities if not already in attributes
              if (!enrichedAttributes.email) {
                if (roktUserIdentities.email) {
                  enrichedAttributes.email = roktUserIdentities.email;
                } else if (currentUserIdentities.email) {
                  this.logFilteredIdentity('email');
                }
              }
              // Propagate emailsha256 from current user identities if not already in attributes
              if (isValidHashedEmailIdentityType && !enrichedAttributes.emailsha256 && !enrichedAttributes[this.mappedEmailShaIdentityType]) {
                hashedEmail = roktUserIdentities[this.mappedEmailShaIdentityType];
                if (hashedEmail) {
                  enrichedAttributes.emailsha256 = hashedEmail;
                } else if (currentUserIdentities[this.mappedEmailShaIdentityType]) {
                  this.logFilteredIdentity(this.mappedEmailShaIdentityType);
                }
              }
              if (!enrichedAttributes[PASSBACK_CONVERSION_TRACKING_ID]) {
                (_q = this.integrationCapture) === null || _q === void 0 ? void 0 : _q.capture();
                capturedAttrs = (_r = this.integrationCapture) === null || _r === void 0 ? void 0 : _r.getClickIdsAsIntegrationAttributes();
                passbackId = (_s = capturedAttrs === null || capturedAttrs === void 0 ? void 0 : capturedAttrs[PARTNER_MODULE_IDS.Rokt]) === null || _s === void 0 ? void 0 : _s[PASSBACK_CONVERSION_TRACKING_ID];
                if (passbackId) {
                  enrichedAttributes[PASSBACK_CONVERSION_TRACKING_ID] = passbackId;
                }
              }
              this.filters.filteredUser = roktUser || this.filters.filteredUser || null;
              enrichedOptions = __assign(__assign({}, options), {
                attributes: enrichedAttributes
              });
              return [2 /*return*/, this.kit.selectPlacements(enrichedOptions)];
            } catch (error) {
              return [2 /*return*/, Promise.reject(error instanceof Error ? error : new Error('Unknown error occurred'))];
            }
            return [2 /*return*/];
          });
        });
      };
      RoktManager.prototype.logFilteredIdentity = function (identityType) {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.verbose("mParticle.Rokt selectPlacements did not add the ".concat(identityType, " user identity to the attributes because the Rokt connection does not allow it"));
      };
      /**
       * Hashes attributes and returns both original and hashed versions
       * with Rokt-compatible key names (like emailsha256, mobilesha256)
       *
       *
       * @param {RoktAttributes} attributes - Attributes to hash
       * @returns {Promise<RoktAttributes>} Object with both original and hashed attributes
       *
       */
      RoktManager.prototype.hashAttributes = function (attributes) {
        return __awaiter(this, void 0, void 0, function () {
          var keys, hashPromises, results, hashedAttributes, _i, results_1, _a, key, attributeValue, hashedValue, error_1;
          var _this = this;
          return __generator(this, function (_b) {
            switch (_b.label) {
              case 0:
                _b.trys.push([0, 2,, 3]);
                if (!attributes || _typeof(attributes) !== 'object') {
                  return [2 /*return*/, {}];
                }
                keys = Object.keys(attributes);
                if (keys.length === 0) {
                  return [2 /*return*/, {}];
                }
                hashPromises = keys.map(function (key) {
                  return __awaiter(_this, void 0, void 0, function () {
                    var attributeValue, hashedValue;
                    return __generator(this, function (_a) {
                      switch (_a.label) {
                        case 0:
                          attributeValue = attributes[key];
                          return [4 /*yield*/, this.hashSha256(attributeValue)];
                        case 1:
                          hashedValue = _a.sent();
                          return [2 /*return*/, {
                            key: key,
                            attributeValue: attributeValue,
                            hashedValue: hashedValue
                          }];
                      }
                    });
                  });
                });
                return [4 /*yield*/, Promise.all(hashPromises)];
              case 1:
                results = _b.sent();
                hashedAttributes = {};
                for (_i = 0, results_1 = results; _i < results_1.length; _i++) {
                  _a = results_1[_i], key = _a.key, attributeValue = _a.attributeValue, hashedValue = _a.hashedValue;
                  hashedAttributes[key] = attributeValue;
                  if (hashedValue) {
                    hashedAttributes["".concat(key, "sha256")] = hashedValue;
                  }
                }
                return [2 /*return*/, hashedAttributes];
              case 2:
                error_1 = _b.sent();
                this.logger.error("Failed to hashAttributes, returning an empty object: ".concat(getErrorMessage(error_1)));
                return [2 /*return*/, {}];
              case 3:
                return [2 /*return*/];
            }
          });
        });
      };
      RoktManager.prototype.setExtensionData = function (extensionData) {
        if (!this.isReady()) {
          this.deferredCall('setExtensionData', extensionData);
          return;
        }
        try {
          this.kit.setExtensionData(extensionData);
        } catch (error) {
          throw new Error('Error setting extension data: ' + getErrorMessage(error));
        }
      };
      RoktManager.prototype.use = function (name) {
        if (!this.isReady()) {
          return this.deferredCall('use', name);
        }
        try {
          return this.kit.use(name);
        } catch (error) {
          return Promise.reject(error instanceof Error ? error : new Error('Error using extension: ' + name));
        }
      };
      /**
       * Tears down the current Rokt launcher and removes the placements it rendered.
       *
       * Intended for hosts that cannot simply destroy the container element \u2014
       * SPA route changes and confirmation pages, for example.
       *
       * Unlike the other proxied methods, a call made before the kit is ready is
       * *not* queued. Replaying a teardown against a launcher created later would
       * silently tear down placements the caller never asked to remove; with no
       * launcher there is nothing to terminate, so this resolves as a no-op.
       *
       * @example
       * await window.mParticle.Rokt.terminate();
       *
       * @returns {Promise<void>} Resolves once the launcher has torn down. Never rejects.
       */
      RoktManager.prototype.terminate = function () {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function () {
          var error_2;
          return __generator(this, function (_d) {
            switch (_d.label) {
              case 0:
                if (!this.isReady()) {
                  (_a = this.logger) === null || _a === void 0 ? void 0 : _a.verbose('mParticle.Rokt.terminate called before the Rokt kit was ready. Nothing to terminate.');
                  return [2 /*return*/];
                }
                if (!isFunction(this.kit.terminate)) {
                  (_b = this.logger) === null || _b === void 0 ? void 0 : _b.error('mParticle.Rokt.terminate is not supported by the attached Rokt Kit version.');
                  return [2 /*return*/];
                }
                _d.label = 1;
              case 1:
                _d.trys.push([1, 3,, 4]);
                return [4 /*yield*/, this.kit.terminate()];
              case 2:
                _d.sent();
                return [3 /*break*/, 4];
              case 3:
                error_2 = _d.sent();
                (_c = this.logger) === null || _c === void 0 ? void 0 : _c.error("Failed to terminate the Rokt launcher: ".concat(getErrorMessage(error_2)));
                return [3 /*break*/, 4];
              case 4:
                return [2 /*return*/];
            }
          });
        });
      };
      RoktManager.prototype.onShoppableAdsReady = function (callback) {
        if (!this.kit || !this.isShoppableAdsLoaded) {
          this.deferredCall('onShoppableAdsReady', callback);
          return;
        }
        try {
          this.kit.onShoppableAdsReady(callback);
        } catch (error) {
          this.logger.error("Failed to register onShoppableAdsReady callback: ".concat(getErrorMessage(error)));
        }
      };
      RoktManager.prototype.flushOnShoppableAdsReadyMessageQueue = function (kit) {
        var _this = this;
        this.kit = kit;
        this.messageQueue.forEach(function (message, key) {
          var _a;
          if (message.methodName === ON_SHOPPABLE_ADS_READY_METHOD) {
            try {
              kit.onShoppableAdsReady(message.payload);
            } catch (e) {
              (_a = _this.logger) === null || _a === void 0 ? void 0 : _a.error('RoktManager: Error flushing onShoppableAdsReady: ' + e);
            }
            _this.messageQueue.delete(key);
          }
        });
        this.isShoppableAdsLoaded = true;
      };
      /**
       * Hashes an attribute using SHA-256
       *
       * @param {string | number | boolean | undefined | null} attribute - The value to hash
       * @returns {Promise<string | undefined | null>} SHA-256 hashed value or undefined/null
       *
       */
      RoktManager.prototype.hashSha256 = function (attribute) {
        return __awaiter(this, void 0, void 0, function () {
          var normalizedValue, error_3;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                if (attribute === null || attribute === undefined) {
                  this.logger.warning("hashSha256 received null/undefined as input");
                  return [2 /*return*/, attribute];
                }
                _a.label = 1;
              case 1:
                _a.trys.push([1, 3,, 4]);
                normalizedValue = String(attribute).trim().toLocaleLowerCase();
                return [4 /*yield*/, this.sha256Hex(normalizedValue)];
              case 2:
                return [2 /*return*/, _a.sent()];
              case 3:
                error_3 = _a.sent();
                this.logger.error("Failed to hashSha256, returning undefined: ".concat(getErrorMessage(error_3)));
                return [2 /*return*/, undefined];
              case 4:
                return [2 /*return*/];
            }
          });
        });
      };
      RoktManager.prototype.getLocalSessionAttributes = function () {
        return this.store.getLocalSessionAttributes();
      };
      RoktManager.prototype.setLocalSessionAttribute = function (key, value) {
        this.store.setLocalSessionAttribute(key, value);
      };
      RoktManager.prototype.isReady = function () {
        // The Rokt Manager is ready when a kit is attached and has a launcher
        return Boolean(this.kit && this.kit.launcher);
      };
      RoktManager.prototype.toUserAttributes = function (attributes) {
        var reservedAttributes = ['sandbox'];
        var filteredAttributes = {};
        for (var key in attributes) {
          if (attributes.hasOwnProperty(key) && reservedAttributes.indexOf(key) === -1) {
            var value = attributes[key];
            filteredAttributes[key] = Array.isArray(value) ? JSON.stringify(value) : value;
          }
        }
        return filteredAttributes;
      };
      RoktManager.prototype.setUserAttributes = function (user, userAttributes, identitiesUserMustNotContradict) {
        if (identitiesUserMustNotContradict === void 0) {
          identitiesUserMustNotContradict = {};
        }
        if (!user) {
          this.logger.warning('selectPlacements attributes were not set because there is no user to set them on.');
          return;
        }
        try {
          if (this.hasContradictingIdentity(user, identitiesUserMustNotContradict)) {
            this.logger.warning('selectPlacements attributes were not set because identify did not resolve to a user with the passed email or hashed email.');
            return;
          }
          user.setUserAttributes(userAttributes);
        } catch (error) {
          this.logger.error('Error setting user attributes: ' + error);
        }
      };
      RoktManager.prototype.hasContradictingIdentity = function (user, identities) {
        return Object.keys(identities).some(function (identityType) {
          var _a, _b;
          var userValue = (_b = (_a = user.getUserIdentities()) === null || _a === void 0 ? void 0 : _a.userIdentities) === null || _b === void 0 ? void 0 : _b[identityType];
          return Boolean(userValue) && userValue !== identities[identityType];
        });
      };
      RoktManager.prototype.mapPlacementAttributes = function (attributes, placementAttributesMapping) {
        var mappingLookup = {};
        for (var _i = 0, placementAttributesMapping_1 = placementAttributesMapping; _i < placementAttributesMapping_1.length; _i++) {
          var mapping = placementAttributesMapping_1[_i];
          mappingLookup[mapping.map] = mapping.value;
        }
        var mappedAttributes = {};
        for (var key in attributes) {
          if (attributes.hasOwnProperty(key)) {
            var newKey = mappingLookup[key] || key;
            mappedAttributes[newKey] = attributes[key];
          }
        }
        return mappedAttributes;
      };
      RoktManager.prototype.onIdentityComplete = function () {
        if (this.isReady()) {
          this.currentUser = this.identityService.getCurrentUser();
          // Process any queued selectPlacements calls that were waiting for identity
          this.processMessageQueue();
        }
      };
      RoktManager.prototype.processMessageQueue = function () {
        var _this = this;
        var _a;
        if (!this.isReady() || this.messageQueue.size === 0) {
          return;
        }
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.verbose("RoktManager: Processing ".concat(this.messageQueue.size, " queued messages"));
        var messagesToProcess = Array.from(this.messageQueue.values());
        // Clear the queue immediately to prevent re-processing
        this.messageQueue.clear();
        messagesToProcess.forEach(function (message) {
          var _a, _b, _c, _d;
          if (!(message.methodName in _this) || !isFunction(_this[message.methodName])) {
            (_a = _this.logger) === null || _a === void 0 ? void 0 : _a.error("RoktManager: Method ".concat(message.methodName, " not found"));
            return;
          }
          if ((_b = _this.logger) === null || _b === void 0 ? void 0 : _b.isVerbose()) {
            var payloadToLog = obfuscateDevData(message.payload, (_d = (_c = _this.store) === null || _c === void 0 ? void 0 : _c.SDKConfig) === null || _d === void 0 ? void 0 : _d.isDevelopmentMode);
            _this.logger.verbose("RoktManager: Processing queued message: ".concat(message.methodName, " with payload: ").concat(JSON.stringify(payloadToLog)));
          }
          // Capture resolve/reject functions before async processing
          var resolve = message.resolve;
          var reject = message.reject;
          var handleError = function handleError(error) {
            var _a;
            (_a = _this.logger) === null || _a === void 0 ? void 0 : _a.error("RoktManager: Error processing message '".concat(message.methodName, "': ").concat(getErrorMessage(error)));
            if (reject) {
              reject(error);
            }
          };
          try {
            var result = _this[message.methodName](message.payload);
            // Handle both sync and async methods
            Promise.resolve(result).then(function (resolvedResult) {
              if (resolve) {
                resolve(resolvedResult);
              }
            }).catch(handleError);
          } catch (error) {
            handleError(error);
          }
        });
      };
      RoktManager.prototype.queueMessage = function (message) {
        this.messageQueue.set(message.messageId, message);
      };
      RoktManager.prototype.deferredCall = function (methodName, payload) {
        var _this = this;
        return new Promise(function (resolve, reject) {
          var messageId = "".concat(methodName, "_").concat(_generateUniqueId());
          _this.queueMessage({
            messageId: messageId,
            methodName: methodName,
            payload: payload,
            resolve: resolve,
            reject: reject
          });
        });
      };
      /**
       * Hashes a string input using SHA-256 and returns the hex digest
       * Uses the Web Crypto API for secure hashing
       *
       * @param {string} input - The string to hash
       * @returns {Promise<string>} The SHA-256 hash as a hexadecimal string
       */
      RoktManager.prototype.sha256Hex = function (input) {
        return __awaiter(this, void 0, void 0, function () {
          var encoder, encodedInput, digest;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                encoder = new TextEncoder();
                encodedInput = encoder.encode(input);
                return [4 /*yield*/, crypto.subtle.digest('SHA-256', encodedInput)];
              case 1:
                digest = _a.sent();
                return [2 /*return*/, this.arrayBufferToHex(digest)];
            }
          });
        });
      };
      /**
       * Converts an ArrayBuffer to a hexadecimal string representation
       * Each byte is converted to a 2-character hex string with leading zeros
       *
       * @param {ArrayBuffer} buffer - The buffer to convert
       * @returns {string} The hexadecimal string representation
       */
      RoktManager.prototype.arrayBufferToHex = function (buffer) {
        var bytes = new Uint8Array(buffer);
        var hexString = '';
        for (var i = 0; i < bytes.length; i++) {
          var hexByte = bytes[i].toString(16).padStart(2, '0');
          hexString += hexByte;
        }
        return hexString;
      };
      /**
       * Checks if an identity value has changed by comparing current and new values
       *
       * @param {string | undefined} currentValue - The current identity value
       * @param {string | undefined} newValue - The new identity value to compare against
       * @returns {boolean} True if the identity has changed (new value exists and differs from current), false otherwise
       */
      RoktManager.prototype.hasIdentityChanged = function (currentValue, newValue) {
        if (!newValue) {
          return false;
        }
        if (!currentValue) {
          return true; // New value exists but no current value
        }
        if (currentValue !== newValue) {
          return true; // Values are different
        }
        return false; // Values are the same
      };
      return RoktManager;
    }();

    /**
     * CookieConsentManager handles storage and access of consent flags (noFunctional, noTargeting,
     * doNotShareOrSell) that are passed via launcherOptions during SDK initialization.
     *
     * These flags allow Rokt integration to respect user privacy choices.
     *
     * Default behavior: All flags default to false, meaning all features are allowed
     * unless explicitly opted out by the user.
     */
    var CookieConsentManager = /** @class */function () {
      function CookieConsentManager(flags) {
        this.flags = flags;
        this.flags = {
          noFunctional: flags.noFunctional === true,
          noTargeting: flags.noTargeting === true,
          doNotShareOrSell: flags.doNotShareOrSell === true
        };
      }
      /**
       * Returns true if third-party targeting is disabled.
       * Targeting is allowed when noTargeting is false (default).
       */
      CookieConsentManager.prototype.getNoTargeting = function () {
        return this.flags.noTargeting;
      };
      /**
       * Returns true if functional tracking is disabled.
       * Functional tracking is allowed when noFunctional is false (default).
       */
      CookieConsentManager.prototype.getNoFunctional = function () {
        return this.flags.noFunctional;
      };
      /**
       * Returns true if the user has opted out of the sale or sharing of their data.
       * Sharing is allowed when doNotShareOrSell is false (default).
       */
      CookieConsentManager.prototype.getDoNotShareOrSell = function () {
        return this.flags.doNotShareOrSell;
      };
      CookieConsentManager.prototype.syncNoTargetingAttribute = function (user) {
        if (!user) return;
        if (this.flags.noTargeting) {
          user.setUserAttribute(NO_TARGETING_ATTRIBUTE, true);
        } else if (hasOwnProp(user.getAllUserAttributes(), NO_TARGETING_ATTRIBUTE)) {
          user.removeUserAttribute(NO_TARGETING_ATTRIBUTE);
        }
      };
      return CookieConsentManager;
    }();

    var ErrorReportingDispatcher = /** @class */function () {
      function ErrorReportingDispatcher() {
        this.services = [];
      }
      ErrorReportingDispatcher.prototype.register = function (service) {
        this.services.push(service);
      };
      ErrorReportingDispatcher.prototype.report = function (error) {
        var _this = this;
        this.services.forEach(function (s) {
          var _a;
          try {
            s.report(error);
          } catch (e) {
            (_a = _this.logger) === null || _a === void 0 ? void 0 : _a.error('Error in ErrorReportingService: ' + e);
          }
        });
      };
      return ErrorReportingDispatcher;
    }();

    var LoggingDispatcher = /** @class */function () {
      function LoggingDispatcher() {
        this.services = [];
      }
      LoggingDispatcher.prototype.register = function (service) {
        this.services.push(service);
      };
      LoggingDispatcher.prototype.log = function (entry) {
        var _this = this;
        this.services.forEach(function (s) {
          var _a;
          try {
            s.log(entry);
          } catch (e) {
            (_a = _this.logger) === null || _a === void 0 ? void 0 : _a.error('Error in LoggingService: ' + e);
          }
        });
      };
      return LoggingDispatcher;
    }();

    // Marks an automatically logged button click, like `is_auto_page_view`.
    var AUTO_BUTTON_ATTRIBUTE = 'is_auto_button_click';
    // Specific enough not to merge with a customer's own 'Button Click' event.
    var BUTTON_CLICK_EVENT_NAME = 'Auto Button Click';
    // Marks an automatically logged click on a link that leaves the page.
    var AUTO_LINK_ATTRIBUTE = 'is_auto_link_click';
    var LINK_CLICK_EVENT_NAME = 'Auto Link Click';
    // The attributes both click events carry, with the page fields that auto page
    // views carry. No intent: classifying clicks is left to whoever reads the data.
    var clickAttributes = function clickAttributes(click, pathname) {
      var data = {
        label_source: click.labelSource,
        element: click.element,
        type: click.type,
        path: pagePath(pathname),
        hostname: window.location.hostname
      };
      // Optional fields are left out when the control has no safe value for them.
      var optional = {
        label: click.label,
        aria_label: click.ariaLabel,
        icon: click.icon,
        element_id: click.elementId,
        element_name: click.elementName,
        test_id: click.testId,
        controls: click.controls,
        form: click.form,
        group: click.group,
        link_type: click.linkType,
        link_domain: click.linkDomain,
        link_path: click.linkPath,
        file_extension: click.fileExtension
      };
      for (var _i = 0, _a = Object.keys(optional); _i < _a.length; _i++) {
        var key = _a[_i];
        if (optional[key]) {
          data[key] = optional[key];
        }
      }
      if (click.checked !== undefined) {
        data.checked = click.checked;
      }
      return data;
    };
    // One custom event per button click, logged like logLink() with the auto marker.
    var buildButtonClickEvent = function buildButtonClickEvent(click, pathname) {
      var data = clickAttributes(click, pathname);
      data[AUTO_BUTTON_ATTRIBUTE] = true;
      return {
        messageType: MessageType$1.PageEvent,
        name: BUTTON_CLICK_EVENT_NAME,
        data: data,
        eventType: EventType.Other
      };
    };
    // One custom event per click on a link that leaves the page. Typed Other, not
    // Navigation, so no kit reads it as a page change. A plain link to another page
    // of the site goes without its text, which can name the shopper ("Hi, Jane"), and
    // with its destination path instead; a button or wallet acting as a link keeps
    // its name.
    var buildLinkClickEvent = function buildLinkClickEvent(click, pathname) {
      var data = clickAttributes(click.linkType === 'internal' && click.element === 'link' ? __assign(__assign({}, click), {
        label: undefined,
        labelSource: 'none',
        ariaLabel: undefined
      }) : click, pathname);
      data[AUTO_LINK_ATTRIBUTE] = true;
      return {
        messageType: MessageType$1.PageEvent,
        name: LINK_CLICK_EVENT_NAME,
        data: data,
        eventType: EventType.Other
      };
    };
    // Every attribute buildButtonClickEvent can set apart from the marker and the
    // hostname, which is the same on every click on this page. A spec checks the
    // two stay in step.
    var CLICK_ATTRIBUTES = ['label_source', 'element', 'type', 'path', 'label', 'aria_label', 'icon', 'element_id', 'element_name', 'test_id', 'controls', 'form', 'group', 'link_type', 'link_domain', 'link_path', 'file_extension', 'checked'];
    // Which check keeps some or all auto button clicks, or auto link clicks with
    // `link`, from a kit, or undefined when the kit receives every one. A forwarding
    // rule on an attribute whose value differs between clicks lets some through and
    // not others. Each other check goes through isEventForwarded on its own, so
    // together they decide as it does for each click.
    var getButtonClickBlocker = function getButtonClickBlocker(forwarder, kitBlocker, link) {
      if (link === void 0) {
        link = false;
      }
      var rule = forwarder.filteringEventAttributeValue;
      if (rule && rule.eventAttributeValue && CLICK_ATTRIBUTES.some(function (name) {
        return KitFilterHelper.hashAttributeConditionalForwarding(name) === rule.eventAttributeName;
      })) {
        return 'forwarding rule';
      }
      var attributes = {
        hostname: window.location.hostname
      };
      attributes[link ? AUTO_LINK_ATTRIBUTE : AUTO_BUTTON_ATTRIBUTE] = true;
      var click = {
        EventName: link ? LINK_CLICK_EVENT_NAME : BUTTON_CLICK_EVENT_NAME,
        EventCategory: EventType.Other,
        EventDataType: MessageType$1.PageEvent,
        EventAttributes: attributes
      };
      var checks = [['data plan', {}], ['forwarding rule', {
        filteringEventAttributeValue: rule
      }], ['event name filter', {
        eventNameFilters: forwarder.eventNameFilters
      }], ['event type filter', {
        eventTypeFilters: forwarder.eventTypeFilters
      }]];
      var failed = checks.find(function (_a) {
        var filters = _a[1];
        return !isEventForwarded(click, filters, kitBlocker);
      });
      return failed ? failed[0] : undefined;
    };

    // Finds the control a click landed on, for both checkout intent and button
    // descriptions. Rokt's own elements, disabled controls and anything under
    // data-mp-no-track are never returned.
    var CONTROL_SELECTOR = 'button, input[type="submit"], input[type="button"], input[type="image"], [role="button"]';
    var EDITABLE = '[contenteditable]:not([contenteditable="false"])';
    // One step up the composed tree: the slot, the parent, then the shadow host.
    function composedParent(node) {
      var root = isFunction(node.getRootNode) ? node.getRootNode() : null;
      return node.assignedSlot || node.parentElement || root && root.host || null;
    }
    // Tests the element and its ancestors over the composed tree: slots, parents,
    // then shadow hosts. With `until`, stops before reaching that ancestor.
    function someComposedAncestor(element, test, until) {
      var node = element;
      while (node && node !== until) {
        if (test(node)) {
          return true;
        }
        node = composedParent(node);
      }
      return false;
    }
    // closest() over the composed tree, starting at the element itself.
    function hasComposedAncestor(element, selector) {
      return someComposedAncestor(element, function (node) {
        return node.matches(selector);
      });
    }
    var ROKT_SELECTOR = '[data-core-type], #rokt-controller-frame';
    // A Rokt frame or script is served from a /wsdk/ path.
    function hasRoktSrc(element) {
      var src = element.getAttribute('src');
      if (!src) {
        return false;
      }
      try {
        return new URL(src, 'https://example.test').pathname.indexOf('/wsdk/') !== -1;
      } catch (e) {
        // An unparseable src is not a Rokt element.
        return false;
      }
    }
    // Rokt's own placements and frames never count as partner checkout controls.
    function isRoktElement(element) {
      return hasComposedAncestor(element, ROKT_SELECTOR) || hasRoktSrc(element);
    }
    // Wallet and quick-pay buttons as their vendors render them: official custom
    // elements and documented classes, ids and attributes.
    var WALLET_SIGNATURE = ['apple-pay-button', '.apple-pay-button', '.gpay-button', '.gpay-card-info-container', '#gpay-button-online-api-id', 'paypal-button', 'venmo-button', 'paypal-pay-later-button', 'paypal-credit-button', 'shop-pay-button', 'shop-pay-wallet-button', 'shopify-accelerated-checkout', 'shopify-accelerated-checkout-cart', 'shopify-apple-pay-button', 'shopify-google-pay-button', 'shopify-paypal-button', 'shopify-amazon-pay-button', '.amazonpay-button-focusable', '#AmazonPayButton', '[data-amazon-pay-button]', '[data-afterpay-entry-point]'].join(', ');
    // PayPal's card button opens a card form, so it is a step rather than a wallet.
    var CARD_FORM_BUTTON = 'paypal-basic-card-button';
    var VENDOR_BUTTON = WALLET_SIGNATURE + ', ' + CARD_FORM_BUTTON;
    // Apple's set-up and top-up buttons manage a wallet rather than pay with it.
    var NOT_A_PAYMENT = ['set-up', 'add-money', 'reload', 'top-up'].map(function (type) {
      return 'apple-pay-button[type="' + type + '"]';
    }).join(', ');
    // What a vendor's own button markup says about a control. Only the control or
    // the shadow host that owns it counts, so a merchant wrapper reusing a vendor
    // class never turns its children into wallet buttons.
    function vendorButtonKind(control) {
      var host = control.matches(VENDOR_BUTTON) ? control : null;
      if (!host) {
        var root = isFunction(control.getRootNode) ? control.getRootNode() : null;
        host = root && root.host && root.host.matches(VENDOR_BUTTON) ? root.host : null;
      }
      if (!host) {
        return undefined;
      }
      if (host.matches(NOT_A_PAYMENT)) {
        return 'none';
      }
      return host.matches(CARD_FORM_BUTTON) ? 'checkout_step' : 'wallet';
    }
    // A merchant-built wallet button that names its wallet in an id or test id, such
    // as `venmo-pay-btn` or `applePayButton`. The name must also say button and not
    // name a part or a wrapper of one, so a wallet's logo, label or container never
    // counts, nor a button that only chooses a wallet. Affirm is also an English
    // verb, so it counts only beside a payment word. Only the element's own
    // attributes are read.
    var WALLET_IN_NAME = /(?:^| )(?:apple ?pay|google ?pay|g ?pay|amazon ?pay|cash ?app|venmo|pay ?pal|shop ?pay|klarna|after ?pay|clear ?pay|sezzle|samsung ?pay)(?= |$)/;
    var AFFIRM_IN_NAME = /(?:^| )affirm(?= |$)/;
    var PAYMENT_IN_NAME = /(?:^| )(?:pay|payment|checkout)(?= |$)/;
    var BUTTON_IN_NAME = /(?:^| )(?:btn|button)(?= |$)/;
    var PART_IN_NAME = /(?:^| )(?:logo|icon|image|img|label|text|caption|message|messaging|info|tooltip|help|learn|terms|promo|banner|container|wrapper|wrap|placeholder|form|section|panel|modal|list|group|select|option|tab|toggle|radio|choice|method)(?= |$)/;
    function nameWords(value) {
      return (value || '').slice(0, 64).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[^A-Za-z0-9]+/g, ' ').trim().toLowerCase();
    }
    function isWalletNamed(element) {
      return [element.getAttribute('id'), element.getAttribute('data-testid')].map(nameWords).some(function (words) {
        return (WALLET_IN_NAME.test(words) || AFFIRM_IN_NAME.test(words) && PAYMENT_IN_NAME.test(words)) && BUTTON_IN_NAME.test(words) && !PART_IN_NAME.test(words);
      });
    }
    function isWalletElement(element) {
      return vendorButtonKind(element) === 'wallet' || isWalletNamedControl(element);
    }
    // Pickers and toggles choose a payment method or open a panel; they never pay.
    var PICKER = 'input[type="radio"], input[type="checkbox"], label, [role="radio"], [role="tab"], [role="option"], ' + '[role="checkbox"], [role="switch"], [role="menuitemradio"], [role="menuitemcheckbox"], [aria-checked], [aria-selected]';
    var PICKER_GROUP = '[role="radiogroup"], [role="tablist"], [role="listbox"]';
    // Pay-later and financing messages link to details rather than pay.
    var MESSAGING = 'klarna-placement, afterpay-placement, square-placement, .affirm-as-low-as, .affirm-site-modal, ' + '.affirm-product-modal, [data-pp-message]';
    // A control that is still logged as a click but never counts as checkout intent.
    // A cart button can open a flyout, so aria-expanded alone never quiets one.
    function isQuietIntentControl(control, isVendorWallet, isCart) {
      if (isCart === void 0) {
        isCart = false;
      }
      if (control.matches(PICKER)) {
        return true;
      }
      if (hasComposedAncestor(control, PICKER_GROUP)) {
        return true;
      }
      if (!isVendorWallet && (!isCart && control.hasAttribute('aria-expanded') || control.hasAttribute('aria-pressed'))) {
        return true;
      }
      return hasComposedAncestor(control, MESSAGING);
    }
    // A checkbox or radio is a control of its own only when no button or link
    // around it takes the click, so a tappable row stays the control.
    var OPTION_INPUT = 'input[type="checkbox"], input[type="radio"]';
    // Anything that chooses, toggles or takes typing. One between a click's target
    // and a wallet-named element, or inside that element, keeps it from becoming
    // the tap. Hidden inputs and button-like inputs are not fields.
    var NAME_BARRIER = PICKER + ', ' + PICKER_GROUP + ', input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]), ' + 'select, textarea, option, optgroup, datalist, [aria-expanded], [aria-pressed], ' + EDITABLE;
    // What owns a click on anything inside it: a picker, a real control or link,
    // a toggle, or an editable region.
    var NAME_HOLDER = PICKER + ', ' + CONTROL_SELECTOR + ', a[href], ' + VENDOR_BUTTON + ', [aria-expanded], [aria-pressed], ' + EDITABLE;
    // A wallet-named element that may stand as a control by its name alone: not
    // itself a picker, toggle or form field; not inside a picker, a real button or
    // link, a toggle, an editable region or another wallet-named element, which own
    // the click with their own state; and holding no picker or field, in its open
    // shadow root either, so a payment-method row with its own radio or select
    // never becomes a wallet tap.
    function isWalletNamedControl(element) {
      if (!isWalletNamed(element) || element.matches(NAME_BARRIER)) {
        return false;
      }
      for (var node = composedParent(element); node; node = composedParent(node)) {
        if (node.matches(NAME_HOLDER) || isWalletNamed(node)) {
          return false;
        }
      }
      var shadow = element.shadowRoot;
      return !element.querySelector(NAME_BARRIER) && !(shadow && shadow.querySelector(NAME_BARRIER));
    }
    // Whether a click is never tracked: it has no element, or lands on a Rokt
    // element or under data-mp-no-track. Reads at most 12 entries of the path.
    function isExcludedPath(path) {
      var entries = path.slice(0, 12);
      var first;
      for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
        var target = entries_1[_i];
        if (target instanceof Element) {
          first = target;
          break;
        }
      }
      if (!first || hasComposedAncestor(first, ROKT_SELECTOR + ', [data-mp-no-track]')) {
        return true;
      }
      for (var _a = 0, entries_2 = entries; _a < entries_2.length; _a++) {
        var target = entries_2[_a];
        if (target instanceof Element && hasRoktSrc(target)) {
          return true;
        }
      }
      return false;
    }
    // Walks at most 12 entries of an event's composed path for the nearest control.
    // A wallet-named element counts as one unless a picker, toggle or form field
    // lies between it and the target or a picker holds it, so choosing an option in
    // or around it never becomes its tap. Excluded clicks give nothing; disabled controls are skipped, a
    // wallet-named one also by its `disabled` class. A caller that has already
    // found the path not excluded passes `included` so the walk runs once.
    function findControl(path, included, limit) {
      if (included === void 0) {
        included = false;
      }
      if (limit === void 0) {
        limit = 12;
      }
      if (!included && isExcludedPath(path)) {
        return undefined;
      }
      var control;
      var option;
      var picked = false;
      for (var _i = 0, _a = path.slice(0, limit); _i < _a.length; _i++) {
        var target = _a[_i];
        if (control) {
          break;
        }
        if (!(target instanceof Element)) {
          continue;
        }
        if (target.matches(CONTROL_SELECTOR + ', a[href], ' + VENDOR_BUTTON) || !picked && isWalletNamedControl(target)) {
          control = target;
        } else {
          if (!option && target.matches(OPTION_INPUT)) {
            option = target;
          }
          picked = picked || target.matches(NAME_BARRIER);
        }
      }
      control = control || option;
      if (!control || control.matches(':disabled, [aria-disabled="true"]') || control.classList.contains('disabled') && isWalletNamed(control)) {
        return undefined;
      }
      return control;
    }
    // Roles that act as controls without being buttons or links: pickers, tabs,
    // options and links run by script. A role can list fallbacks, so any of its
    // tokens counts.
    var ROLE_CONTROL = '[role~="radio"], [role~="menuitemradio"], [role~="checkbox"], [role~="menuitemcheckbox"], ' + '[role~="switch"], [role~="option"], [role~="tab"], [role~="link"]';
    var TYPING_FIELD = 'input:not([type="submit"]):not([type="button"]):not([type="image"]):not([type="reset"]):not([type="radio"]):not([type="checkbox"]), ' + 'textarea, select, ' + EDITABLE;
    // The nearest role control on the click path, for logging the click alone:
    // checkout intent and payment choices only ever read what findControl finds.
    // None when anything disabled sits on the path, so a role control around or
    // inside a disabled control never logs the click it suppressed.
    function findRoleControl(path, limit) {
      var entries = path.slice(0, limit).filter(function (target) {
        return target instanceof Element;
      });
      if (entries.some(function (target) {
        return target.matches(':disabled, [aria-disabled="true"]') || target.classList.contains('disabled') && isWalletNamed(target);
      })) {
        return undefined;
      }
      for (var _i = 0, entries_3 = entries; _i < entries_3.length; _i++) {
        var target = entries_3[_i];
        if (target.matches(ROLE_CONTROL)) {
          // A typing field, or anything in an editable region, takes typing
          // whatever role it carries.
          return target.matches(TYPING_FIELD) || hasComposedAncestor(target, EDITABLE) ? undefined : target;
        }
        // A click in a typing field belongs to the field, not to the role
        // control around it.
        if (target.matches(TYPING_FIELD)) {
          return undefined;
        }
      }
      return undefined;
    }
    // Text that may hold what a shopper typed or what the page opted out: form
    // fields, editable regions, and anything under data-mp-no-track. `own` is a
    // box the element labels, which holds no typing of its own.
    function isUnsafeTextSource(element, own) {
      var inside = 'input, select, textarea, [data-mp-no-track], ' + EDITABLE;
      return element.matches('input, select, textarea, option, optgroup, datalist, ' + EDITABLE) || (own ? Array.from(element.querySelectorAll(inside)).some(function (found) {
        return found !== own;
      }) : !!element.querySelector(inside)) || hasComposedAncestor(element, 'select, datalist, textarea, [data-mp-no-track], ' + EDITABLE);
    }

    // Masks a button label before it is logged. Button text can carry personal data,
    // so this is the privacy boundary for every label and aria-label.
    // Masking needs \p{Nd} to see every script's digits. Browsers without Unicode
    // property escapes send no labels at all.
    function createDigitPatterns() {
      try {
        return {
          run: new RegExp('\\p{Nd}{6,}', 'u'),
          number: new RegExp('\\p{Nd}+(?:[.,\u060C\u066B\u066C]\\p{Nd}+)*', 'gu')
        };
      } catch (e) {
        return undefined;
      }
    }
    var digitPatterns = createDigitPatterns();
    // Longer raw labels are dropped, not cut short.
    var MAX_RAW_LABEL_LENGTH = 128;
    // The label as logged: lower case, at most 64 characters, digits and amounts
    // masked. Dropped when it looks like an email, phone or card number.
    function maskLabel(raw) {
      if (!raw || raw.length > MAX_RAW_LABEL_LENGTH || !digitPatterns) {
        return undefined;
      }
      var text = raw.replace(/\s+/g, ' ').trim().toLowerCase();
      if (!text || text.indexOf('@') !== -1 || digitPatterns.run.test(text.replace(/[\s()\-\u2010-\u2015]/g, ''))) {
        return undefined;
      }
      var masked = text.replace(digitPatterns.number, '#').slice(0, 64).trim();
      return masked || undefined;
    }
    // Masks numbers and amounts in any script as '#', or undefined where the browser
    // can't see every script's digits.
    function maskNumbers(text) {
      return digitPatterns ? text.replace(digitPatterns.number, '#') : undefined;
    }

    var DOWNLOAD_EXTENSIONS = /\.(pdf|zip|csv|txt|ics|docx?|xlsx?|pptx?|dmg|exe|apk|mp3|mp4)$/i;
    function elementKind(control) {
      if (isWalletElement(control)) {
        return 'wallet';
      }
      var tag = control.tagName.toLowerCase();
      if (tag === 'button' || tag === 'input') {
        return tag;
      }
      // A link run by script reads as a link, as an anchor does, so whoever reads
      // the click treats it the same.
      return control.matches('a[href]:not([role="button"]), [role~="link"]:not([role~="button"])') ? 'link' : 'role';
    }
    var NOT_RENDERED = 'script, style, template, [hidden], [aria-hidden="true"], [inert]';
    // The most nodes read for one label source, and images looked at for one
    // button. Each costs a style lookup in the click handler.
    var MAX_READS = 64;
    function assignedNodes(element) {
      var slot = element;
      return isFunction(slot.assignedNodes) ? slot.assignedNodes() : [];
    }
    // Left out of what is drawn by its parent: a light child of an open shadow host
    // that no slot takes, or a slot's own child while nodes are assigned to the
    // slot. A closed shadow root can't be seen, so its host's children count.
    function isUnslotted(node) {
      var parent = node.parentElement;
      if (!parent) {
        return false;
      }
      return parent.shadowRoot ? !node.assignedSlot : assignedNodes(parent).length > 0;
    }
    // Hides the element and all it holds, whatever their own style says.
    // Screen-reader-only text is clipped rather than hidden, so it is not. An SVG
    // title is never drawn but names its icon, so it is not either.
    function hidesSubtree(element) {
      if (element.matches(NOT_RENDERED) || isUnslotted(element)) {
        return true;
      }
      return !(element instanceof SVGTitleElement) && window.getComputedStyle(element).display === 'none';
    }
    // Visibility is inherited and a child can set it back to visible, so only the
    // element's own counts.
    function isVisible(element) {
      var visibility = window.getComputedStyle(element).visibility;
      return visibility !== 'hidden' && visibility !== 'collapse';
    }
    function isShown(element, until) {
      return !someComposedAncestor(element, hidesSubtree, until);
    }
    // A shadow host shows a light child only through a slot, and only while
    // nothing from that slot up to the host hides it.
    function isShownThroughSlot(node, host) {
      var slot = node.assignedSlot;
      return !!slot && isShown(slot, host);
    }
    // Whitespace hides nothing, so a node holding only whitespace is taken as it
    // is, without a style lookup: an icon's paths cost nothing. A slot's text can
    // sit in the nodes assigned to it, so a slot is never blank.
    function isBlank(node) {
      return !/\S/.test(node.textContent || '') && !(node instanceof Element && (node.matches('slot') || !!node.querySelector('slot')));
    }
    // The text a sighted user or a screen reader gets from an element, whitespace
    // collapsed. Undefined when that runs past what maskLabel keeps, takes more
    // than MAX_READS nodes to read, or takes in a form field through a slot, so a
    // label is never cut short at a node boundary.
    function renderedText(root) {
      var text = '';
      var reads = 0;
      var append = function append(value) {
        text = (text + value).replace(/\s+/g, ' ');
      };
      var _read = function read(element) {
        if (hidesSubtree(element)) {
          return true;
        }
        var assigned = assignedNodes(element);
        var nodes = assigned.length ? assigned : element.childNodes;
        for (var i = 0; i < nodes.length; i++) {
          var node = nodes[i];
          var isText = node.nodeType === Node.TEXT_NODE;
          if (!isText && !(node instanceof Element)) {
            continue;
          }
          if (isBlank(node)) {
            append(node.textContent);
            continue;
          }
          if (++reads > MAX_READS) {
            return false;
          }
          if (element.shadowRoot && !isShownThroughSlot(node, element)) {
            continue;
          }
          if (isText) {
            if (isVisible(node.assignedSlot || element)) {
              append(node.nodeValue);
            }
          } else if (
          // Assigned nodes sit outside the label source, where its own
          // form field check never looked.
          assigned.length && isUnsafeTextSource(node) || !_read(node)) {
            return false;
          }
          if (text.trim().length > MAX_RAW_LABEL_LENGTH) {
            return false;
          }
        }
        return true;
      };
      return _read(root) ? text.trim() : undefined;
    }
    // '' when the element can't name the button, undefined when its text can't be
    // read in full.
    function textOf(element) {
      return element && !isUnsafeTextSource(element) && isShown(element) ? renderedText(element) : '';
    }
    // The control itself is already known to be shown.
    function shownImageAlt(control) {
      var images = control.querySelectorAll('img[alt]');
      for (var i = 0; i < images.length && i < MAX_READS; i++) {
        if (isShown(images[i], control) && isVisible(images[i])) {
          return nonBlank(images[i].getAttribute('alt'));
        }
      }
      return undefined;
    }
    function nonBlank(value) {
      return value && value.trim() ? value : undefined;
    }
    // The button's name as a screen reader would read it, simplified: the first of
    // aria-labelledby, aria-label, own text (or an inner image's alt), title, and
    // for inputs their value. The text sources are skipped for controls that hold
    // form fields or more than four children, so a typed value is never read.
    function accessibleName(control) {
      var labelledBy = control.getAttribute('aria-labelledby');
      if (labelledBy) {
        var root_1 = isFunction(control.getRootNode) ? control.getRootNode() : document;
        var parts = labelledBy.split(/\s+/).map(function (id) {
          return textOf(root_1.getElementById ? root_1.getElementById(id) : null);
        });
        if (parts.indexOf(undefined) !== -1) {
          return {
            source: 'none'
          };
        }
        var text = parts.filter(function (part) {
          return !!part;
        }).join(' ');
        if (text) {
          return {
            raw: text,
            source: 'labelledby'
          };
        }
      }
      var aria = nonBlank(control.getAttribute('aria-label'));
      if (aria) {
        return {
          raw: aria,
          source: 'aria'
        };
      }
      var readable = control.children.length <= 4 && !isUnsafeTextSource(control);
      if (control instanceof HTMLInputElement) {
        // The browser's normalised type: an unknown value reads as 'text'.
        var type = control.type;
        if (type === 'image') {
          var alt = nonBlank(control.getAttribute('alt'));
          if (alt) {
            return {
              raw: alt,
              source: 'alt'
            };
          }
        } else if (type === 'submit' || type === 'button' || type === 'reset') {
          var value = nonBlank(control.value);
          if (value) {
            return {
              raw: value,
              source: 'value'
            };
          }
          if (type !== 'button') {
            // What the browser shows on an input without a value.
            return {
              raw: type,
              source: 'value'
            };
          }
        }
      } else if (readable && isShown(control)) {
        var text = renderedText(control);
        if (text === undefined) {
          return headingName(control) || {
            source: 'none'
          };
        }
        if (text) {
          return {
            raw: text,
            source: 'text'
          };
        }
        var alt = shownImageAlt(control);
        if (alt) {
          return {
            raw: alt,
            source: 'alt'
          };
        }
      }
      if (!(control instanceof HTMLInputElement) && isShown(control)) {
        var heading = headingName(control);
        if (heading) {
          return heading;
        }
      }
      var title = nonBlank(control.getAttribute('title'));
      if (title) {
        return {
          raw: title,
          source: 'title'
        };
      }
      return {
        source: 'none'
      };
    }
    // A card whose text runs too long to keep, or has too many parts to read, is
    // named by its first heading, as a product or menu card usually is. Not a card
    // holding a form field, nor one that takes in slotted content or holds a
    // shadow root, whose fields the form field check can't see.
    function headingName(control) {
      if (isUnsafeTextSource(control) || control.shadowRoot || control.querySelector('slot') ||
      // A custom element can hide fields in a closed shadow root, which
      // nothing outside it can see.
      control.tagName.indexOf('-') !== -1 || Array.from(control.querySelectorAll('*')).some(function (element) {
        return !!element.shadowRoot || element.tagName.indexOf('-') !== -1;
      })) {
        return undefined;
      }
      var text = textOf(control.querySelector('h1, h2, h3, h4, h5, h6, [role="heading"]'));
      return text ? {
        raw: text,
        source: 'heading'
      } : undefined;
    }
    var ICON_CLASS = /^(?:fa|fas|far|fal|icon|bi|glyphicon|ti|mdi|ri|la|lucide|ion|feather|ph)-([a-z][a-z-]{1,31})$/;
    // Size, style and animation classes that share the icon prefixes.
    var ICON_MODIFIER = /^(?:solid|regular|light|thin|duotone|brands|sharp|fw|lg|xs|sm|xl|spin|pulse|border|inverse|stack|flip(?:-[a-z]+)?|rotate(?:-[a-z]+)?|pull-[a-z]+)$/;
    function iconToken(candidate) {
      if (!candidate) {
        return undefined;
      }
      var token = candidate.toLowerCase().replace(/^icon-/, '');
      return /^[a-z][a-z-]{1,31}$/.test(token) ? token : undefined;
    }
    // An icon name from an SVG sprite reference or an icon-font class, for buttons
    // whose only content is an icon. Letters and hyphens only.
    function iconHint(control) {
      var allowed = function allowed(element) {
        return !hasComposedAncestor(element, '[data-mp-no-track]');
      };
      var use = Array.from(control.querySelectorAll('use')).filter(allowed)[0];
      if (use) {
        var href = use.getAttribute('href') || use.getAttribute('xlink:href') || '';
        var hash = href.indexOf('#');
        var sprite = iconToken(hash === -1 ? null : href.slice(hash + 1));
        if (sprite) {
          return sprite;
        }
      }
      var candidates = [control].concat(Array.from(control.querySelectorAll('i, span, svg'))).filter(allowed).slice(0, 5);
      for (var _i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
        var element = candidates_1[_i];
        var classes = (element.getAttribute('class') || '').split(/\s+/);
        for (var _a = 0, classes_1 = classes; _a < classes_1.length; _a++) {
          var name_1 = classes_1[_a];
          var match = ICON_CLASS.exec(name_1.toLowerCase());
          if (match && !ICON_MODIFIER.test(match[1])) {
            return match[1];
          }
        }
      }
      return undefined;
    }
    // Words of letters, each optionally ending in up to three digits, joined by
    // hyphens or underscores: `add-to-cart`, `btnCheckout`, `step_2`. Generated ids
    // (`ember1234`, `a8f3e2c1`, `radix-:r1:`) and long numbers don't match.
    var HAND_WRITTEN_ID = /^[A-Za-z]+[0-9]{0,3}(?:[-_](?:[A-Za-z]+[0-9]{0,3}|[0-9]{1,3}))*$/;
    // A developer-written identifier, or nothing.
    function stableIdentifier(value) {
      if (!value) {
        return undefined;
      }
      var id = value.trim();
      // At most three digits in all, so numbers split into groups don't pass.
      var digits = id.replace(/[^0-9]/g, '').length;
      return id.length <= 64 && digits <= 3 && HAND_WRITTEN_ID.test(id) ? id : undefined;
    }
    // A picker's input name, which names its question. Sites often end it with the
    // id of the product it belongs to (`color-swatches-48213907`); without that
    // number it still names the question.
    function questionName(value) {
      return stableIdentifier(value && value.trim().replace(/[-_][0-9]{4,}$/, ''));
    }
    var TEST_ID_ATTRIBUTES = ['data-testid', 'data-test-id', 'data-test', 'data-qa', 'data-cy'];
    // The first of these attributes that holds a developer-written identifier.
    function firstIdentifier(control, attributes) {
      for (var _i = 0, attributes_1 = attributes; _i < attributes_1.length; _i++) {
        var attribute = attributes_1[_i];
        var id = stableIdentifier(control.getAttribute(attribute));
        if (id) {
          return id;
        }
      }
      return undefined;
    }
    // What the button opens or acts on: a menu, drawer or dialog. aria-controls can
    // list several ids, so only the first is used.
    function controlsIdentifier(control) {
      var ariaControls = control.getAttribute('aria-controls');
      return stableIdentifier(ariaControls ? ariaControls.trim().split(/\s+/)[0] : null) || firstIdentifier(control, ['popovertarget', 'commandfor']);
    }
    // The id of the form a button or input actually submits, which the browser
    // resolves from its form attribute or its owning form. getAttribute, because a
    // field named "id" shadows form.id.
    function formIdentifier(control) {
      var form = control instanceof HTMLButtonElement || control instanceof HTMLInputElement ? control.form : null;
      return form ? stableIdentifier(form.getAttribute('id')) : undefined;
    }
    // The browser's normalised type: a button defaults to 'submit' and an unknown
    // input type reads as 'text'. A native button or input reports its own type, a
    // wallet-named one included. A role control that isn't a button reads as its
    // role: 'radio', 'option', 'tab', 'link' and so on. Any other control, such as
    // a role button or a vendor's wallet element, reads as 'button'.
    var CONTROL_ROLES = ['radio', 'menuitemradio', 'checkbox', 'menuitemcheckbox', 'switch', 'option', 'tab', 'link'];
    function controlType(control) {
      var tag = control.tagName.toLowerCase();
      if (tag === 'button' || tag === 'input') {
        return control.type;
      }
      if (control.matches('[role~="button"]')) {
        return 'button';
      }
      var roles = (control.getAttribute('role') || '').trim().split(/\s+/);
      for (var _i = 0, roles_1 = roles; _i < roles_1.length; _i++) {
        var role = roles_1[_i];
        if (CONTROL_ROLES.indexOf(role) !== -1) {
          return role;
        }
      }
      return 'button';
    }
    // The page a link to another page of the site opens: its decoded path alone,
    // since an id in a path can point at one shopper. A segment holding a token,
    // or following a route word that names a person or carries a code, goes as
    // `*`, and numbers in any script are masked as in labels. Dropped when it
    // holds an @, `;` or `=` (session ids and matrix parameters), is too long to
    // be a route, or the browser can't mask every script's digits.
    function linkPath(link) {
      // Each segment decodes on its own, so a literal `%` in one never stops the
      // next from decoding.
      var decoded = link.pathname.split('/').map(decodeFully);
      if (decoded.some(function (segment) {
        return segment === undefined;
      })) {
        return undefined;
      }
      var path = decoded.join('/');
      if (path.length > MAX_RAW_LABEL_LENGTH || /[@;=]/.test(path) || LEFTOVER_ESCAPE.test(path)) {
        return undefined;
      }
      var segments = path.split('/');
      var masked = segments.map(function (segment, i) {
        return isTokenSegment(segment) || i > 0 && segment && hidesNextSegment(routeSegment(segments, i)) ? '*' : segment;
      });
      return maskNumbers(masked.join('/'));
    }
    // Reads the link's own resolved URL parts, never its full href: only the hostname of
    // a link that leaves the site, the path of one to another page of the site and the
    // extension of a file it downloads travel. mailto:, tel: and other schemes give
    // undefined.
    function describeLink(link) {
      var href = (link.getAttribute('href') || '').trim();
      if (!href || href.charAt(0) === '#') {
        return {
          type: 'same_page'
        };
      }
      if (!(link instanceof HTMLAnchorElement)) {
        return undefined;
      }
      var protocol = link.protocol.toLowerCase();
      if (protocol === 'javascript:') {
        return {
          type: 'same_page'
        };
      }
      if (protocol !== 'http:' && protocol !== 'https:') {
        return undefined;
      }
      var domain = link.hostname !== window.location.hostname ? link.hostname.toLowerCase() : undefined;
      var extension = DOWNLOAD_EXTENSIONS.exec(link.pathname);
      if (link.hasAttribute('download') || extension) {
        return {
          type: 'download',
          domain: domain,
          fileExtension: extension ? extension[1].toLowerCase() : undefined
        };
      }
      if (domain) {
        return {
          type: 'outbound',
          domain: domain
        };
      }
      return link.pathname === window.location.pathname && link.search === window.location.search ? {
        type: 'same_page'
      } : {
        type: 'internal',
        path: linkPath(link)
      };
    }
    // Whether a described click is on a link that leaves the page, logged as a link
    // click rather than a button click.
    function isLinkClick(click) {
      return !!click.linkType && click.linkType !== 'same_page';
    }
    // Checkboxes and radios, and the roles that act as them. A role can list
    // fallbacks, so any of its tokens counts.
    var CHOICE = 'input[type="checkbox"], input[type="radio"], [role~="checkbox"], [role~="radio"], ' + '[role~="switch"], [role~="menuitemcheckbox"], [role~="menuitemradio"], [role~="option"]';
    var RADIO_ROLE = '[role~="radio"], [role~="menuitemradio"]';
    function boxOf(element) {
      var box = element instanceof HTMLLabelElement ? element.control : element;
      return box && box.matches(CHOICE) ? box : null;
    }
    function isRadio(choice) {
      return choice instanceof HTMLInputElement ? choice.type === 'radio' : !!choice && choice.matches(RADIO_ROLE);
    }
    // The box a click on this control picks. One the click passed through below
    // the control comes first: querySelector can't reach a slotted box, a box in a
    // shadow root or the box of a label inside the control, and a row can hold
    // more than one box. Else the control itself, the box it labels, or the first
    // one it wraps, as on an option row whose name repeats the option's text.
    function choiceOf(control, path) {
      for (var _i = 0, path_1 = path; _i < path_1.length; _i++) {
        var target = path_1[_i];
        if (target === control) {
          break;
        }
        var box = target instanceof Element ? boxOf(target) : null;
        if (box) {
          return box;
        }
      }
      return boxOf(control) || control.querySelector(CHOICE);
    }
    // Describes a clicked control for auto button and link tracking. A link carries its
    // link type, and one to another scheme is skipped. A role="button" anchor carries one
    // only when it leaves the page; otherwise it stays a plain button.
    function describeButtonClick(control, path) {
      if (path === void 0) {
        path = [];
      }
      var link;
      if (control.matches('a[href]:not([role="button"])')) {
        link = describeLink(control);
        if (!link) {
          return undefined;
        }
      } else if (control.matches('a[href]')) {
        link = describeLink(control);
        if (link && link.type === 'same_page') {
          link = undefined;
        }
      }
      var element = elementKind(control);
      var box = control instanceof HTMLInputElement && (control.type === 'checkbox' || control.type === 'radio') ? control : undefined;
      // A box's text sent with its state is the shopper's answer, and the text
      // can be a name, an address or a sensitive choice, so a box goes by its
      // hand-written identifiers alone. So does a control acting as one or
      // wrapping one, and a label, whose click the browser passes on to its box
      // as a second event.
      var choice = box || choiceOf(control, path);
      // A checkbox's identifiers name its question, which its state answers. A
      // radio's id, test id and the panel it opens name the option picked, so
      // only the name of its input, the question, goes with it. A wrapper's own
      // name, or a role radio's, can name the option instead.
      // An option of a list box, like a radio, names the answer picked.
      var radio = isRadio(choice) || !!choice && choice.matches('[role~="option"]');
      var named = !radio ? control : choice instanceof HTMLInputElement && !choice.matches('[role~="option"]') ? choice : null;
      // A link run by script has no address to say where it goes, so it goes
      // without its text, as a plain link to another page of the site does: the
      // text can name the shopper ("Hi, Jane").
      // A native button keeps its name whatever its role, as it always has.
      var textless = !!choice || !link && element !== 'wallet' && control.matches('[role~="link"]') && !control.matches(CONTROL_SELECTOR);
      var name = textless ? undefined : accessibleName(control);
      var label = name ? maskLabel(name.raw) : undefined;
      return {
        label: label,
        labelSource: label ? name.source : 'none',
        // Kept on its own as well: it often says more than the visible text,
        // such as which item a remove button removes.
        ariaLabel: textless ? undefined : maskLabel(control.getAttribute('aria-label')),
        icon: choice ? undefined : iconHint(control),
        elementId: radio ? undefined : stableIdentifier(control.getAttribute('id')),
        elementName: (choice ? questionName : stableIdentifier)(named && named.getAttribute('name')),
        testId: radio ? undefined : firstIdentifier(control, TEST_ID_ATTRIBUTES),
        controls: radio ? undefined : controlsIdentifier(control),
        form: formIdentifier(control),
        group: choice ? groupName(choice) : undefined,
        element: element,
        type: controlType(control),
        linkType: link ? link.type : undefined,
        linkDomain: link ? link.domain : undefined,
        linkPath: link ? link.path : undefined,
        fileExtension: link ? link.fileExtension : undefined,
        // The box as the click left it: the browser toggles it before the click
        // reaches listeners, and puts it back if the click is cancelled.
        checked: box ? box.checked : undefined,
        pick: choice || control.matches('[role~="tab"]') ? true : undefined
      };
    }
    // The question a picker answers, from the group around it: the group's
    // aria-label, aria-labelledby or legend, masked like a label and cut at its
    // first colon, since a legend can repeat the pick ("Color: Navy"). Never the
    // option's own text, which is the shopper's answer.
    var NAMED_GROUP = '[role="radiogroup"], [role="listbox"], [role="group"], fieldset';
    // A control such as the button that opens a list box shows the option picked.
    var NOT_A_QUESTION = CHOICE + ', ' + CONTROL_SELECTOR + ', a[href], input, select, textarea, slot, [aria-haspopup], [role~="button"], ' + '[role~="link"], [role~="tab"], [role~="combobox"]';
    var OPTION_KINDS = ['radio', 'menuitemradio', 'checkbox', 'menuitemcheckbox', 'switch', 'option'];
    function optionKind(option) {
      if (option instanceof HTMLInputElement) {
        return option.type;
      }
      var roles = (option.getAttribute('role') || '').trim().split(/\s+/);
      return roles.filter(function (role) {
        return OPTION_KINDS.indexOf(role) !== -1;
      })[0];
    }
    // Whether two options answer the same question. A native box shares its
    // question only with a box of the same name in the same form, as the browser
    // groups radios, so separate shipping and billing radios ask two.
    function sameQuestion(option, choice) {
      if (!(choice instanceof HTMLInputElement)) {
        // A role option answers only within its own radio group or list box.
        var container = '[role="radiogroup"], [role="listbox"]';
        return !(option instanceof HTMLInputElement) && optionKind(option) === optionKind(choice) && option.closest(container) === choice.closest(container);
      }
      var name = choice.getAttribute('name');
      return option instanceof HTMLInputElement && option.type === choice.type && !!name && option.getAttribute('name') === name && option.form === choice.form;
    }
    // Whether a group offers another answer to the question picked: a shown option
    // to the same question that isn't part of the one picked. A card around one
    // address radio and a "make default" checkbox, or around a role radio and the
    // hidden input behind it, offers none.
    function holdsOptions(group, choice) {
      var options = group.querySelectorAll(CHOICE);
      for (var i = 0; i < options.length; i++) {
        var option = options[i];
        if (!option.contains(choice) && !choice.contains(option) && sameQuestion(option, choice) && isShown(option, group) && isVisible(option) &&
        // A fully transparent option, as a native input behind a styled
        // one often is, shows the shopper no second answer.
        !someComposedAncestor(option, function (node) {
          return window.getComputedStyle(node).opacity === '0';
        }, group)) {
          return true;
        }
      }
      return false;
    }
    // The elements an option is named by: those its aria-labelledby points at and
    // a native box's labels.
    function optionLabels(option, root) {
      var labels = option instanceof HTMLInputElement && option.labels ? Array.from(option.labels) : [];
      (option.getAttribute('aria-labelledby') || '').trim().split(/\s+/).forEach(function (ref) {
        var target = ref && root.getElementById ? root.getElementById(ref) : null;
        if (target) {
          labels.push(target);
        }
      });
      return labels;
    }
    // The group asking the question a pick answers. A role radio's is its
    // radiogroup and an option's its list box; a role toggle, such as a switch,
    // stands alone. A native box's is the nearest group offering other answers,
    // since a group around one option, such as a saved address card, can be
    // named by that option.
    function questionGroup(choice) {
      if (!(choice instanceof HTMLInputElement)) {
        var container = choice.matches('[role~="option"]') ? choice.closest('[role="listbox"]') : choice.matches('[role~="radio"]') ? choice.closest('[role="radiogroup"]') : null;
        return container && holdsOptions(container, choice) ? container : null;
      }
      var group = choice.closest(NAMED_GROUP);
      while (group && !holdsOptions(group, choice)) {
        group = group.parentElement ? group.parentElement.closest(NAMED_GROUP) : null;
      }
      return group;
    }
    function groupName(choice) {
      var group = questionGroup(choice);
      if (!group) {
        return undefined;
      }
      var raw = nonBlank(group.getAttribute('aria-label'));
      if (!raw) {
        var ids = group.getAttribute('aria-labelledby');
        var legend = group.tagName === 'FIELDSET' ? Array.from(group.children).filter(function (child) {
          return child.tagName === 'LEGEND';
        })[0] : undefined;
        var root_2 = isFunction(group.getRootNode) ? group.getRootNode() : document;
        var source_1 = ids ? root_2.getElementById ? root_2.getElementById(ids.trim().split(/\s+/)[0]) : null : legend || null;
        // A label that is, holds or sits in an option or a control, or in an
        // option's label, would name the answer.
        var holder = source_1 ? source_1.closest('label') : null;
        // Nor one that holds, or sits in, what an option of the group names
        // itself by.
        var labelsOption = !!source_1 && Array.from(group.querySelectorAll(CHOICE)).some(function (option) {
          return optionLabels(option, root_2).some(function (label) {
            return source_1.contains(label) || label.contains(source_1);
          });
        });
        raw = source_1 && !labelsOption && !hasComposedAncestor(source_1, NOT_A_QUESTION) && !source_1.querySelector(NOT_A_QUESTION) && !(holder && (holder.control || holder.querySelector(CHOICE))) ? textOf(source_1) : undefined;
      }
      return raw ? maskLabel(raw.split(':')[0]) : undefined;
    }
    // A question about payment, read from the names its author gave it, so
    // "checkout[payment_gateway]", "paymentMethod" and "tender_type" all count and
    // "payee" does not. A radio's input name is its question; its group or
    // fieldset speaks only for a radio with no name, as a role radio usually is.
    var PAYMENT_QUESTION = /(?:^| )(?:pay|payment\w*|tenders?|gateways?)(?: |$)/;
    var QUESTION_GROUP = '[role="radiogroup"], fieldset';
    function isPaymentQuestion(radio) {
      var name = radio.getAttribute('name');
      var group = name ? null : radio.closest(QUESTION_GROUP);
      var question = group ? [group.getAttribute('id'), group.getAttribute('name'), group.getAttribute('aria-label')] : [name];
      return question.some(function (words) {
        return PAYMENT_QUESTION.test(nameWords(words));
      });
    }
    // What names a payment option: the radio's accessible name, the text and
    // image of each label, and its hand-written ids, text masked like a label.
    function optionNames(radio) {
      var names = [maskLabel(accessibleName(radio).raw)];
      var labels = radio instanceof HTMLInputElement && radio.labels ? Array.from(radio.labels).slice(0, 2) : [];
      labels.forEach(function (label) {
        if (isShown(label) && !isUnsafeTextSource(label, radio)) {
          names.push(maskLabel(renderedText(label)));
          names.push(maskLabel(shownImageAlt(label)));
        }
      });
      names.push(stableIdentifier(radio.getAttribute('id')), firstIdentifier(radio, TEST_ID_ATTRIBUTES));
      return names.filter(function (name, index) {
        return !!name && names.indexOf(name) === index;
      });
    }
    function describePaymentChoice(control, path) {
      if (path === void 0) {
        path = [];
      }
      var choice = choiceOf(control, path);
      if (!isRadio(choice) || hasComposedAncestor(choice, '[data-mp-no-track]') || !isPaymentQuestion(choice)) {
        return undefined;
      }
      var names = optionNames(choice);
      return names.length ? {
        radio: choice,
        names: names
      } : undefined;
    }
    // Read once the page has handled the click, which may have cancelled it.
    function isPicked(radio) {
      return radio instanceof HTMLInputElement ? radio.checked : radio.getAttribute('aria-checked') === 'true';
    }

    // A checkout segment may name its kind or its version, as /express-checkout, /checkout-v2 and /checkout-external do.
    // Other hyphenated words make it a content slug, such as /help/checkout-faq or /products/self-checkout-kiosk.
    var checkoutPath = /(?:^|\/)(?:(?:(?:express|guest|quick|secure|complete|one-?page|single-?page|mobile)-)?checkouts?(?:-(?:v\d+|\d+|flow|external|process|step(?:-\d+)?))?|payment|order|kasse|paiement|commander?|pago)(?:\/|$)/i;
    // A confirmation page under a checkout route, such as /checkout/thankyou/<order> or /checkouts/<token>/thank_you, comes
    // after the confirm click. "Complete" and "success" mark one only as the last word of a segment, so /complete-checkout
    // and /checkout/complete-registration stay checkout routes.
    var confirmationPath = /(?:^|[\/_-])(?:thank[-_]?you|thanks|confirmation|confirmed|receipt|received)(?:[\/_-]|$)|(?:^|[\/_-])(?:complete|completed|success)(?:\/|$)/i;
    // A bare "Register" creates an account, rather than placing the order, on a checkout's sign-in or account step or in a
    // form that asks for a password.
    var bareRegister = /^register(?: now)?$/;
    var accountStepPath = /(?:^|\/)(?:register|registration|login|log-in|signin|sign-in|signup|sign-up|account|create-account)(?:\/|$)/i;
    // English look-alikes are whole words; the other languages stay substring
    // matches, since several of them do not separate words with spaces.
    var englishExclusions = new RegExp('\\b(?:coupon|promo(?: code)?|newsletter|sign in|sign up|log in|login|add to (?:cart|bag|basket)|' + 'gift card balance|(?:add|apply|redeem|check|enter|use) (?:a |an |your )?gift card|pay later|' + 'interest free|as low as|learn more|prequalify|apply (?:now|for)|payment plan|available|accepted|' + 'we accept|set up|add money|reload|top up|add to (?:apple|google) wallet|connect|link your|unlink|' + 'remove|delete|edit|change|manage|use a different|switch)\\b|^pay in$|\\bpay in (?:installments|instalments)\\b');
    var otherExclusions = new RegExp(['gutschein|anmelden|warenkorb|bon cadeau|connexion|panier|cup\u00F3n|iniciar sesi\u00F3n|carrito', 'carrello|codice sconto|accedi|buono regalo|winkelwagen|kortingscode|inloggen|cadeaubon|achteraf betalen', '\u30AB\u30FC\u30C8|\u30AF\u30FC\u30DD\u30F3|\u30ED\u30B0\u30A4\u30F3|\u4F1A\u54E1\u767B\u9332|\u30AE\u30D5\u30C8|\u5F8C\u6255\u3044|\u30E1\u30EB\u30DE\u30AC'].join('|'));
    var englishCommits = '(?:(?:agree|accept|review) and )?(?:place|submit|complete|confirm|finali[sz]e)' + '(?!(?: [^ ]+){0,2} (?:another|new|next)(?: |$))(?! (?:[^ ]+ )?gift card)' + '(?: [^ ]+){0,2} (?:order|purchase|booking|reservation|payment|checkout|transaction)' + '(?: now| securely| and pay| (?:with|using) [^ ]+(?: [^ ]+)?)?(?: (?:total|subtotal|items?|tickets?))?' + '|pay(?: securely)?(?: now)?|(?:confirm|agree|accept|submit|order|book) and pay' + '|pay and place (?:my |your )?order|order with obligation to pay';
    var otherCommits = ['(?:jetzt )?(?:zahlungs|kosten)pflichtig (?:bestellen|buchen)|(?:jetzt )?bezahlen|kauf abschlie\u00DFen|bestellung abschlie\u00DFen', 'commander et payer|payer(?: maintenant)?|(?:confirmer|finaliser) (?:ma |la )?commande', "valider et payer|confirmer et payer|commande avec obligation de paiement|finaliser l'achat", '(?:realizar|confirmar|completar) (?:el |mi |la )?(?:pedido|compra|reserva)|finalizar (?:el |mi )?pedido|pagar(?: ahora)?', 'pedido con obligaci\u00F3n de pago', "(?:effettua|conferma|concludi|completa) (?:l'|il )?(?:ordine|acquisto)|ordine con obbligo di pagamento", 'paga(?: ora| adesso)?|ordina e paga', '(?:nu )?betalen|bestellen en betalen|bestelling plaatsen|plaats bestelling|bestelling afronden', 'bestelling met betalingsverplichting', '(?:\u3053\u306E\u5185\u5BB9\u3067|\u4E0A\u8A18\u306E?\u5185\u5BB9\u3067)?\u3054?(?:\u6CE8\u6587|\u8CFC\u5165|\u4E88\u7D04|\u6C7A\u6E08|\u304A?\u652F\u6255\u3044?)\u3092?(?:\u78BA\u5B9A|\u5B8C\u4E86)(?:\u3059\u308B)?', '(?:\u3053\u306E\u5185\u5BB9\u3067|\u4E0A\u8A18\u306E?\u5185\u5BB9\u3067)\u3054?(?:\u6CE8\u6587|\u8CFC\u5165|\u4E88\u7D04)\u3059\u308B|\u3054?\u6CE8\u6587\u3059\u308B|\u6C7A\u6E08\u3059\u308B|(?:\u4ECA\u3059\u3050|\u3092)?\u652F\u6255\u3046'].join('|');
    var commits = new RegExp('^(?:' + englishCommits + '|' + otherCommits + ')$');
    // A plain link is navigation, so in English only an order or purchase it
    // places, submits or completes counts as the confirm click.
    var linkCommits = new RegExp('^(?:(?:place|submit|complete)(?!(?: [^ ]+){0,2} (?:another|new|next)(?: |$))(?: [^ ]+){0,2} (?:order|purchase)|' + otherCommits + ')$');
    var routeGatedCommits = new RegExp('^(?:buy now|purchase|register(?: now)?|complete (?:my |your )?registration|jetzt kaufen|kaufen|commander|(?:passer|valider) (?:la |ma )?commande|finalizar (?:la |mi )?compra|' + 'comprar ahora|acquista ora|nu kopen|\u4ECA\u3059\u3050\u8CFC\u5165|\u8CFC\u5165\u3059\u308B|\u3053\u306E\u5185\u5BB9\u3067\u7533\u3057\u8FBC\u3080)$');
    var steps = new RegExp('^(?:' + ["(?:let's |lets |go to |proceed to |secure )?(?:check ?out|checkout)(?: now| securely| as guest)?", '(?:continue|proceed) to (?:payment|review|billing|shipping|delivery|order review)|review (?:my |your )?order', 'guest checkout|(?:pay|continue|check ?out) (?:with|by) (?:card|credit card|debit card|credit or debit card)', 'zur kasse|zur kasse gehen|auschecken|weiter zur zahlung', 'passer \u00E0 la caisse|continuer vers le paiement|proc\u00E9der au paiement', 'ir a caja|continuar al pago|tramitar pedido', "procedi al checkout|procedi all'acquisto|procedi al pagamento|vai alla cassa", 'afrekenen|verder naar betalen|doorgaan naar betalen', '\u30EC\u30B8\u306B\u9032\u3080|\u3054?(?:\u8CFC\u5165|\u6CE8\u6587)\u624B\u7D9A\u304D(?:\u3078|\u306B)(?:\u9032\u3080)?|\u304A?\u652F\u6255\u3044(?:\u3078|\u306B)\u9032\u3080|(?:\u3054\u6CE8\u6587\u5185\u5BB9\u306E)?\u78BA\u8A8D\u753B\u9762\u3078(?:\u9032\u3080)?'].join('|') + ')$');
    var CART_NOUN = '(?:(?:my|your|the) )?(?:shopping )?(?:cart|bag|basket)';
    // "Add to bag" and "Add 2 to cart": a click that puts something in the cart.
    var addToCartLabels = new RegExp('^add(?: [^ ]+){0,5} to ' + CART_NOUN + '$');
    // "View cart", "Shopping bag", "Bag", and a count badge such as "1 item in bag",
    // which reads "item in bag" once digits are stripped: a click that opens the cart.
    var openCartLabels = new RegExp('^(?:(?:(?:view|open|go to) )?' + CART_NOUN + '(?: items?)?' + '|items? in ' + CART_NOUN + ')$');
    var WALLET_NAMES = 'apple pay|google pay|paypal|venmo|amazon pay|shop pay|klarna|afterpay|clearpay|cash app(?: pay)?|affirm|sezzle|samsung pay';
    var WALLET_VERBS = 'pay|buy|purchase|order|book|donate|subscribe|check ?out|checkout|express checkout|continue|proceed|' + 'complete purchase|place (?:my |your )?order';
    // "Pay with Klarna", "Buy with GPay", "Continue to PayPal".
    var walletPhrases = new RegExp('^(?:(?:' + WALLET_VERBS + ')(?: now| securely)? (?:with|using|via|through|by) (?:' + WALLET_NAMES + ')(?: express(?: checkout)?| checkout)?|(?:continue|proceed|go) (?:to|with) (?:' + WALLET_NAMES + '))$');
    // A wallet's own name on a button: "PayPal", "Klarna checkout", "Apple Pay logo".
    var walletBrands = new RegExp('^(?:' + WALLET_NAMES + ')(?: (?:checkout|check out|express(?: checkout)?|express pay|buy now|pay now|pay|now)' + '| (?:logo|icon|mark|button)(?: (?:logo|icon|mark|button))*)?$');
    // Exact HTTPS hosts of hosted wallet button frames.
    var walletFrameFamilies = {
      'pay.google.com': 'google_pay',
      'applepay.cdn-apple.com': 'apple_pay',
      'payments.amazon.com': 'amazon_pay',
      'pay.shopify.com': 'shop_pay'
    };
    // PayPal serves its buttons and its card fields and pay-later messages from
    // the same hosts; only the button frames are wallet taps.
    var paypalFrameHosts = new Set(['www.paypal.com', 'www.sandbox.paypal.com']);
    var PAYPAL_BUTTON_FRAME = /^\/smart\/(?:buttons|menu)(?:\/|$)/;
    var PAYPAL_CARD_FRAME = /^\/smart\/card-fields?(?:\/|$)/;
    // PayPal's JS SDK, used directly or wrapped by a processor, leaves its frames
    // without a src and names them __zoid__paypal_<component>__ instead.
    var PAYPAL_SDK_FRAME = /^__zoid__paypal_/;
    var PAYPAL_SDK_BUTTON_FRAME = /^__zoid__paypal_(?:buttons|menu)__/;
    // Stripe's quick-pay button frames; its other frames are card and form fields.
    var STRIPE_WALLET_FRAME = /\/elements-inner-(?:payment-request|express-checkout)-/;
    var STRIPE_CARD_FRAME = /\/elements-inner-card\b/;
    // Hosted card-entry and fingerprint frames: focus there is typing card details.
    // Some of these hosts also serve gift card and bank account fields, so none
    // names a family.
    var CARD_FRAME_DOMAINS = ['adyen.com', 'braintreegateway.com', 'cybersource.com', 'squarecdn.com', 'checkout.com'];
    // Keep these classes ASCII-only in source bytes to avoid mojibake parse failures
    // when a host page forces non-UTF-8 decoding before JavaScript parse.
    var TYPOGRAPHIC_APOSTROPHES = /[\u2019\u2018]/g;
    var CURRENCY_AND_NUMBER_CHARS = /[0-9\uFF10-\uFF19$\u20AC\u00A3\u00A5\uFFE5\u20B9\u5186.,\uFF0C]/g;
    var BRACKETED = /\([^()]*\)|\[[^[\]]*\]|\uFF08[^\uFF08\uFF09]*\uFF09|\uFF3B[^\uFF3B\uFF3D]*\uFF3D|\u3010[^\u3010\u3011]*\u3011/g;
    // Spaces, punctuation, separators, arrows and symbols, CJK and full-width forms
    // included, plus emoji halves and variation selectors.
    var EDGE = "[\\s!-/:-@\\[-`{-~\\u00A1-\\u00BF\\u00D7\\u00F7\\u2000-\\u206F\\u20A0-\\u20CF\\u2190-\\u2BFF" + "\\u3000-\\u3003\\u3008-\\u3011\\u3014-\\u301F\\u30FB\\uD800-\\uDFFF\\uFE00-\\uFE0F" + "\\uFF01-\\uFF0F\\uFF1A-\\uFF20\\uFF3B-\\uFF40\\uFF5B-\\uFF65]+";
    var EDGE_SYMBOLS = new RegExp('^' + EDGE + '|' + EDGE + '$', 'g');
    function getIntentRouteClass(pathname) {
      return checkoutPath.test(pathname) && !confirmationPath.test(pathname) ? 'checkout_path' : 'other';
    }
    var SEPARATORS = /[-_|\u00B7\u2022]/g;
    var CURRENCY_CODES = /(?:^| )(?:usd|aud|cad|nzd|gbp|eur|chf|sgd|hkd|jpy|inr|mxn)(?= |$)|\b(?:a|au|ca|c|us|nz|hk|s)\$/g;
    var WALLET_ALIASES = [[/\bapplepay\b/g, 'apple pay'], [/\bg ?pay\b/g, 'google pay'], [/\bamazonpay\b/g, 'amazon pay'], [/\bshoppay\b/g, 'shop pay'], [/\bcashapp\b/g, 'cash app']];
    // Labels longer than this are sentences: they neither match nor veto intent.
    var MAX_LABEL_WORDS = 8;
    function normalize(text) {
      if (!text || text.length > 128) {
        return undefined;
      }
      var label = text.toLowerCase().replace(TYPOGRAPHIC_APOSTROPHES, "'").replace(/[&+]/g, ' and ').replace(SEPARATORS, ' ').replace(CURRENCY_CODES, ' ').replace(CURRENCY_AND_NUMBER_CHARS, '').replace(/\s+/g, ' ').trim();
      WALLET_ALIASES.forEach(function (_a) {
        var alias = _a[0],
          name = _a[1];
        label = label.replace(alias, name);
      });
      return label.split(' ').length > MAX_LABEL_WORDS ? undefined : label;
    }
    // The label without bracketed asides or the separators and symbols left at its
    // edges, so "place order -" and "place order ( items)" both read "place order".
    function coreLabel(text) {
      var core = text.replace(BRACKETED, ' ').replace(/\s+/g, ' ').replace(EDGE_SYMBOLS, '');
      return core || text.replace(EDGE_SYMBOLS, '');
    }
    // Labels come from aria-label then visible text. Only submit and button inputs
    // have their value read, so a typed field value is never touched. A control
    // holding form fields or more than four children gives only its aria-label.
    function labelSources(element) {
      if (element instanceof HTMLInputElement) {
        var type = element.type;
        var text = null;
        if (type === 'submit' || type === 'button') {
          text = element.value;
        } else if (type === 'image') {
          text = element.getAttribute('alt');
        }
        return [element.getAttribute('aria-label'), text];
      }
      if (element.children.length > 4 || isUnsafeTextSource(element)) {
        return [element.getAttribute('aria-label')];
      }
      return [element.getAttribute('aria-label'), element.textContent];
    }
    function labels(element) {
      return labelSources(element).map(normalize).filter(function (label) {
        return !!label;
      });
    }
    // A cart button is often a bare icon, so its title names it when nothing else
    // does. Only the cart rule reads the title. Opening the cart counts only for a
    // control that opens it on the page, such as a flyout: one that leads to the cart
    // page unloads before a call made on the click can return.
    function cartControlAction(control, cores) {
      var title = cores.length ? undefined : normalize(control.getAttribute('title'));
      var texts = title ? [coreLabel(title)] : cores;
      if (texts.some(function (text) {
        return addToCartLabels.test(text);
      })) {
        return 'add';
      }
      return (control.hasAttribute('aria-expanded') || control.hasAttribute('aria-haspopup')) && texts.some(function (text) {
        return openCartLabels.test(text);
      }) ? 'open' : undefined;
    }
    // Every field the browser counts as the form's own, form-attribute fields included. Read through the native getter
    // where the browser has one, since a field named "elements" shadows the form's own property.
    function formFields(form) {
      var descriptor = Object.getOwnPropertyDescriptor(HTMLFormElement.prototype, 'elements');
      return descriptor && descriptor.get ? descriptor.get.call(form) : form.elements;
    }
    // The form a button or input submits, which its form attribute can name from outside it.
    function createsAccount(control, pathname) {
      var form = control instanceof HTMLButtonElement || control instanceof HTMLInputElement ? control.form : control.closest('form');
      return accountStepPath.test(pathname) || !!form && Array.prototype.some.call(formFields(form), function (field) {
        return field instanceof HTMLInputElement && field.type === 'password';
      });
    }
    // "Buy now", "Purchase" and "Register" count only on a checkout route that isn't a
    // confirmation page, and never on a plain link, which is navigation.
    function isCommitLabel(text, isLink, pathname, control) {
      if (isLink) {
        return linkCommits.test(text);
      }
      return commits.test(text) || routeGatedCommits.test(text) && getIntentRouteClass(pathname) === 'checkout_path' && !(bareRegister.test(text) && createsAccount(control, pathname));
    }
    // Classifies a clicked or submitting control found by findControl, in order:
    // pickers, toggles and pay-later messages never count; a vendor's own wallet
    // button counts before any label rule; a confirm label on any source counts
    // before the look-alike exclusions veto; then a wallet-named control, wallet
    // phrases and steps. An add-to-cart label, links included, or a control that
    // opens the cart on the page counts only where none of those do.
    function classifyIntent(control, pathname) {
      var vendor = vendorButtonKind(control);
      if (vendor === 'none') {
        return undefined;
      }
      if (vendor) {
        return isQuietIntentControl(control, vendor === 'wallet') ? undefined : {
          kind: vendor,
          source: 'vendor'
        };
      }
      var texts = labels(control);
      var cores = texts.map(coreLabel);
      var cartAction = cartControlAction(control, cores);
      var cart;
      if (cartAction === 'add') {
        cart = {
          kind: 'cart',
          source: 'label',
          adds: true
        };
      } else if (cartAction === 'open') {
        cart = {
          kind: 'cart',
          source: 'label'
        };
      }
      if (isQuietIntentControl(control, false, !!cart)) {
        return undefined;
      }
      // A bag button that opens a flyout counts only as a cart click.
      if (cart && control.hasAttribute('aria-expanded')) {
        return cart;
      }
      var isLink = control.matches('a[href]:not([role="button"])');
      if (cores.some(function (text) {
        return isCommitLabel(text, isLink, pathname, control);
      })) {
        return {
          kind: 'commit',
          source: 'label'
        };
      }
      if (texts.concat(cores).some(function (text) {
        return englishExclusions.test(text) || otherExclusions.test(text);
      })) {
        return cart;
      }
      if (isWalletNamedControl(control)) {
        return {
          kind: 'wallet',
          source: 'name'
        };
      }
      var isButton = !isLink && control.matches(CONTROL_SELECTOR);
      for (var _i = 0, cores_1 = cores; _i < cores_1.length; _i++) {
        var text = cores_1[_i];
        if (isButton && walletPhrases.test(text)) {
          return {
            kind: 'wallet',
            source: 'label'
          };
        }
        if (isButton && walletBrands.test(text)) {
          return {
            kind: 'wallet',
            source: 'brand'
          };
        }
        if (steps.test(text)) {
          return {
            kind: 'checkout_step',
            source: 'label'
          };
        }
      }
      return cart;
    }
    // The host is the domain or one of its subdomains, never a look-alike suffix.
    function isOnDomain(host, domain) {
      return host === domain || host.length > domain.length && host.slice(host.length - domain.length - 1) === '.' + domain;
    }
    // Focus moving into a visible hosted wallet button counts as a wallet click;
    // focus into hosted card fields or messages is only a frame. A family comes
    // only from a frame that can draw no other method: PayPal's button frame also
    // draws Pay Later, Venmo and its card form, Stripe's quick-pay frame draws
    // Apple Pay or Google Pay by browser, and its payment form holds several.
    function classifyPaymentFrame(target, win) {
      if (win.document.visibilityState !== 'visible' || !(target instanceof HTMLIFrameElement)) {
        return undefined;
      }
      if (isRoktElement(target) || hasComposedAncestor(target, '[data-mp-no-track]')) {
        return undefined;
      }
      // A frame that has its own src is judged by that address, never by its name.
      if ((!target.src || target.src === 'about:blank') && PAYPAL_SDK_FRAME.test(target.name)) {
        return PAYPAL_SDK_BUTTON_FRAME.test(target.name) ? {
          kind: 'wallet'
        } : {
          kind: 'frame'
        };
      }
      try {
        var url = new URL(target.src);
        var host_1 = url.protocol === 'https:' ? url.hostname : '';
        if (paypalFrameHosts.has(host_1)) {
          if (PAYPAL_BUTTON_FRAME.test(url.pathname)) {
            return {
              kind: 'wallet'
            };
          }
          return PAYPAL_CARD_FRAME.test(url.pathname) ? {
            kind: 'frame',
            family: 'card'
          } : {
            kind: 'frame'
          };
        }
        if (Object.prototype.hasOwnProperty.call(walletFrameFamilies, host_1)) {
          return {
            kind: 'wallet',
            family: walletFrameFamilies[host_1]
          };
        }
        if (host_1 === 'js.stripe.com') {
          if (STRIPE_WALLET_FRAME.test(url.pathname)) {
            return {
              kind: 'wallet'
            };
          }
          return STRIPE_CARD_FRAME.test(url.pathname) ? {
            kind: 'frame',
            family: 'card'
          } : {
            kind: 'frame'
          };
        }
        if (CARD_FRAME_DOMAINS.some(function (domain) {
          return isOnDomain(host_1, domain);
        })) {
          return {
            kind: 'frame'
          };
        }
      } catch (e) {
        // An unparseable frame src is not a wallet frame.
      }
      return undefined;
    }

    // State lives on `window`, like APV, so a re-executed bundle never doubles the
    // listeners. Inspect `window.__mpBtn__` in a console to see if one is live.
    var WIN_BTN_KEY = '__mpBtn__';
    var THROTTLE_MS = 2000;
    var SUBMIT_AFTER_COMMIT_CLICK_MS = 1000;
    // Apple Pay must begin inside the tap's own handler, so the tap is this recent.
    var APPLE_PAY_AFTER_CLICK_MS = 1000;
    // How far up from the clicked element a control is looked for. Checkout intent
    // keeps findControl's own 12; logging looks further, past deep product cards.
    var PATH_LIMIT = 20;
    // A ceiling, not a dedupe: a held Enter key or browser automation fires a
    // trusted click per repeat, and each one is forwarded to every kit.
    var PAGE_EVENT_LIMIT = 100;
    // A click uploads at once. Taps that follow it this quickly are held and share
    // one upload once they stop.
    var UPLOAD_DEBOUNCE_MS = 100;
    var btnWindow = function btnWindow() {
      return typeof window === 'undefined' ? null : window;
    };
    var getActiveButtonTracker = function getActiveButtonTracker() {
      var win = btnWindow();
      var state = win ? win[WIN_BTN_KEY] : undefined;
      return state ? state.tracker : undefined;
    };
    // Stops whichever tracker is active, including one from an earlier bundle load.
    var resetButtonTracking = function resetButtonTracking() {
      var win = btnWindow();
      if (!win) {
        return;
      }
      var active = getActiveButtonTracker();
      if (active) {
        active.teardown();
      }
      win[WIN_BTN_KEY] = {};
    };
    // Runs once the browser has painted the page's response to the interaction, so
    // describing and logging a click never delays that paint.
    var afterNextPaint = function afterNextPaint(fn) {
      if (isFunction(window.requestAnimationFrame) && document.visibilityState !== 'hidden') {
        requestAnimationFrame(function () {
          setTimeout(fn, 0);
        });
      } else {
        setTimeout(fn, 0);
      }
    };
    // Apple Pay's session opens only from a shopper's tap, whatever button the page
    // draws for it, so its opening is a wallet tap no label or name rule can miss.
    // The wrapper keeps the page's own begin under this key, to put it back.
    var APPLE_PAY_HOOK = '__mpApplePayHook__';
    var applePayPrototype = function applePayPrototype(win) {
      var session = win['ApplePaySession'];
      return session && session.prototype;
    };
    // Wraps ApplePaySession.prototype.begin once per window, so the active tracker
    // hears that a session began. The wrapper reads no arguments and no payment
    // data, and returns or throws exactly what the original does. Nothing here can
    // throw into SDK init: a throwing getter or a frozen prototype leaves Apple Pay
    // as it was.
    var hookApplePay = function hookApplePay(win) {
      try {
        var prototype = applePayPrototype(win);
        var begin_1 = prototype && prototype.begin;
        if (!isFunction(begin_1) || begin_1[APPLE_PAY_HOOK]) {
          return;
        }
        var opened = function opened() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
          }
          var result = begin_1.apply(this, args);
          try {
            var tracker = getActiveButtonTracker();
            if (tracker) {
              tracker.onApplePayBegin();
            }
          } catch (e) {
            // A session the page began is never disturbed by tracking.
          }
          return result;
        };
        // Not enumerable, so the marker doesn't show among the method's own keys.
        Object.defineProperty(opened, APPLE_PAY_HOOK, {
          value: begin_1
        });
        prototype.begin = opened;
      } catch (e) {
        // Apple Pay stays as the page set it up.
      }
    };
    // Puts the page's own begin back, unless another script has wrapped it since.
    var unhookApplePay = function unhookApplePay(win) {
      try {
        var prototype = applePayPrototype(win);
        var begin = prototype && prototype.begin;
        if (isFunction(begin) && isFunction(begin[APPLE_PAY_HOOK])) {
          prototype.begin = begin[APPLE_PAY_HOOK];
        }
      } catch (e) {
        // Apple Pay stays as it is.
      }
    };
    var CAPTURE_PASSIVE = {
      capture: true,
      passive: true
    };
    var PASSIVE = {
      passive: true
    };
    // Logs button clicks and clicks on links that leave the page as mParticle events, and hands checkout
    // intent to the Rokt kit as a frozen {kind, t, source, pathname}, with adds on an add-to-cart click.
    // Submits and wallet frame focus feed the kit only, and so do payment picks: a payment radio's option
    // names, or the payment family of a focused frame.
    var ButtonTracker = /** @class */function () {
      function ButtonTracker(mpInstance) {
        var _this = this;
        this.active = false;
        this.hasRoktKit = false;
        this.logButtons = false;
        this.logLinks = false;
        // Bumped on reset so classification queued before it is dropped.
        this.generation = 0;
        this.lastCommitClick = -Infinity;
        // The latest trusted click: whether the page excluded it, and the intent it
        // already carries to the kit, with its source, if any.
        this.lastClick = null;
        this.lastSent = {};
        this.pagePath = null;
        this.pageEvents = 0;
        // Clicks read at dispatch and waiting for the next paint.
        this.pending = [];
        this.uploadTimerId = null;
        this.uploadHeld = false;
        // Set while the page is left, when the SDK's exit upload sends the queue.
        this.leaving = false;
        this.drain = function () {
          var queue = _this.pending;
          _this.pending = [];
          queue.forEach(function (delivery) {
            return delivery();
          });
        };
        // A click that navigates away can unload the page before the next paint, so
        // anything waiting is delivered as the page is hidden or left. The capture
        // listeners run before the SDK's own upload on the same events, including
        // beforeunload, the first of them.
        this.onHide = function (event) {
          if (event.type === 'beforeunload' || event.type === 'pagehide' || document.visibilityState === 'hidden') {
            _this.leaving = true;
            try {
              _this.drain();
            } finally {
              _this.leaving = false;
            }
            // The SDK's exit upload sends the queue, held taps included.
            _this.cancelUpload();
          }
        };
        this.onPageShow = function (event) {
          // A page restored from the back-forward cache starts fresh.
          if (event.persisted) {
            _this.reset();
          }
        };
        this.onEvent = function (event) {
          try {
            _this.observe(event);
          } catch (e) {
            _this.log('[error] event handler threw: ' + e);
          }
        };
        this.mpInstance = mpInstance;
      }
      Object.defineProperty(ButtonTracker.prototype, "isActive", {
        get: function get() {
          return this.active;
        },
        enumerable: false,
        configurable: true
      });
      ButtonTracker.prototype.init = function (options) {
        var win = btnWindow();
        if (!win) {
          return;
        }
        var previous = getActiveButtonTracker();
        if (previous) {
          previous.teardown();
        }
        if (this.active) {
          this.teardown();
        }
        this.hasRoktKit = options.hasRoktKit;
        this.logButtons = options.logButtons;
        this.logLinks = options.logLinks;
        if ((!(this.logButtons || this.logLinks) || !this.eventsEnabled()) && this.isKitSuppressed()) {
          this.log('opted out, not starting');
          return;
        }
        win.document.addEventListener('click', this.onEvent, CAPTURE_PASSIVE);
        win.document.addEventListener('submit', this.onEvent, CAPTURE_PASSIVE);
        win.addEventListener('blur', this.onEvent, PASSIVE);
        win.addEventListener('pageshow', this.onPageShow, PASSIVE);
        win.addEventListener('beforeunload', this.onHide, CAPTURE_PASSIVE);
        win.addEventListener('pagehide', this.onHide, CAPTURE_PASSIVE);
        win.document.addEventListener('visibilitychange', this.onHide, CAPTURE_PASSIVE);
        this.active = true;
        if (!win[WIN_BTN_KEY]) {
          win[WIN_BTN_KEY] = {};
        }
        win[WIN_BTN_KEY].tracker = this;
        // Only where checkout intent can reach the kit; a shopper who opts back in mid-page gets no session
        // signal until the next page load.
        if (!this.isKitSuppressed()) {
          hookApplePay(win);
        }
        this.log('listening');
      };
      // An Apple Pay session begun right after a tracked tap counts as a wallet
      // tap for the kit; one begun with no such tap, or from a tap the page
      // excluded, does not. A tap that reads as a confirm tap reaches the kit as
      // one. It is delivered on a timer, not after the next paint, since the
      // payment sheet may hold painting back: a tap that already reads as a
      // wallet goes now under its own rule, and the throttle drops the copy
      // queued for the paint.
      ButtonTracker.prototype.onApplePayBegin = function () {
        var _this = this;
        var t = Date.now();
        var click = this.lastClick;
        if (!this.active || !click || click.excluded || click.kind === 'commit' || t - click.t > APPLE_PAY_AFTER_CLICK_MS || this.isKitSuppressed()) {
          return;
        }
        var pathname = window.location.pathname;
        var generation = this.generation;
        setTimeout(function () {
          if (generation !== _this.generation) {
            return;
          }
          try {
            _this.emit('wallet', click.kind === 'wallet' ? click.source : 'api', 'apple_pay', t, pathname);
          } catch (e) {
            _this.log('[error] Apple Pay delivery threw: ' + e);
          }
        }, 0);
      };
      ButtonTracker.prototype.teardown = function () {
        var win = btnWindow();
        if (win) {
          win.document.removeEventListener('click', this.onEvent, true);
          win.document.removeEventListener('submit', this.onEvent, true);
          win.removeEventListener('blur', this.onEvent);
          win.removeEventListener('pageshow', this.onPageShow);
          win.removeEventListener('beforeunload', this.onHide, true);
          win.removeEventListener('pagehide', this.onHide, true);
          win.document.removeEventListener('visibilitychange', this.onHide, true);
          var state = win[WIN_BTN_KEY];
          if (state && state.tracker === this) {
            state.tracker = undefined;
            unhookApplePay(win);
          }
        }
        this.active = false;
        // Signals not yet handed to a kit go with the tracker.
        this.clearPending();
      };
      // Drops queued classification, commit timing and buffered signals, so
      // nothing captured before an opt-out is delivered after an opt-in.
      ButtonTracker.prototype.clearPending = function () {
        this.reset();
        var roktManager = this.mpInstance._RoktManager;
        if (roktManager) {
          roktManager.discardCheckoutIntents();
        }
      };
      ButtonTracker.prototype.reset = function () {
        this.generation++;
        this.pending = [];
        this.lastCommitClick = -Infinity;
        this.lastClick = null;
        this.lastSent = {};
        this.pagePath = null;
        this.pageEvents = 0;
        this.cancelUpload();
      };
      ButtonTracker.prototype.enqueue = function (delivery) {
        this.pending.push(delivery);
        if (this.pending.length === 1) {
          afterNextPaint(this.drain);
        }
      };
      ButtonTracker.prototype.observe = function (event) {
        var _this = this;
        if (!this.active || !event.isTrusted) {
          return;
        }
        var layer = event.type;
        var logsEvents = layer === 'click' && (this.logButtons || this.logLinks) && this.eventsEnabled() && !this.hasTargetingOptOut();
        var signalsKit = !this.isKitSuppressed();
        if (!logsEvents && !signalsKit) {
          return;
        }
        var t = Date.now();
        var pathname = window.location.pathname;
        // The button is read now, while the click is still being dispatched:
        // this capture listener runs before the page's own handlers, so a
        // button that disables or relabels itself is seen as it was clicked.
        // Logging and the kit hand-off wait for the next paint.
        var click;
        var asLink = false;
        var box;
        var kind;
        var source;
        var adds;
        var choice;
        var family;
        var unconfirmedCommit = false;
        if (layer === 'click') {
          // The composed path is only populated during dispatch.
          var path = isFunction(event.composedPath) ? event.composedPath().slice(0, PATH_LIMIT) : [];
          var excluded = isExcludedPath(path);
          var control = excluded ? undefined : findControl(path, true);
          var logged = control || (excluded ? undefined : findControl(path, true, PATH_LIMIT) || findRoleControl(path, PATH_LIMIT));
          if (logged) {
            // With links alone, only an anchor can be logged.
            click = logsEvents && (this.logButtons || logged.matches('a[href]')) ? describeButtonClick(logged, path) : undefined;
            if (click) {
              asLink = this.logLinks && isLinkClick(click);
              // Without link tracking, a link that leaves the page stays a
              // button click, except a plain link to another page of the
              // site, which button tracking never logged.
              var asButton = this.logButtons && !asLink && !(click.linkType === 'internal' && logged.matches('a[href]:not([role="button"])'));
              if (!asLink && !asButton) {
                click = undefined;
              }
            }
            if (click && click.checked !== undefined) {
              box = logged;
            }
          }
          if (control) {
            // Checkout intent is only worked out when the kit can use it.
            var intent = signalsKit ? classifyIntent(control, pathname) : undefined;
            kind = intent ? intent.kind : undefined;
            source = intent ? intent.source : undefined;
            adds = intent ? intent.adds : undefined;
            choice = signalsKit ? describePaymentChoice(control, path) : undefined;
          }
          this.lastClick = {
            t: t,
            excluded: excluded,
            kind: kind,
            source: source
          };
        } else if (layer === 'submit') {
          var submitter = event.submitter;
          var control = submitter ? findControl([submitter]) : undefined;
          // A form submitted without a submitter only counts right after a
          // commit click, which is known once that click is delivered.
          if (!submitter) {
            kind = 'commit';
            source = 'submit';
          } else if (control) {
            var intent = classifyIntent(control, pathname);
            kind = intent ? intent.kind : undefined;
            source = intent ? intent.source : undefined;
            adds = intent ? intent.adds : undefined;
          }
          unconfirmedCommit = !submitter;
        }
        var generation = this.generation;
        this.enqueue(function () {
          if (generation !== _this.generation) {
            return;
          }
          try {
            if (layer === 'blur') {
              // Read after the blur settles: some browsers have not moved
              // focus into the frame yet when the window blurs.
              var frame = classifyPaymentFrame(document.activeElement, window);
              kind = frame ? frame.kind : undefined;
              family = frame ? frame.family : undefined;
              source = 'frame';
            } else if (unconfirmedCommit && t - _this.lastCommitClick > SUBMIT_AFTER_COMMIT_CLICK_MS) {
              kind = undefined;
            }
            if (click && logsEvents) {
              // The box as this click left it. The browser toggles it
              // before dispatch and puts it back once a cancelled click
              // is over, so only a cancelled click changes the reading
              // taken at dispatch: a checkbox to the other state, a
              // radio to however it was restored.
              if (box && event.defaultPrevented) {
                click.checked = box.type === 'checkbox' ? !click.checked : box.checked;
              }
              _this.logClick(click, pathname, asLink);
            }
            // Ahead of the intent, so a pre-selection it fires goes out
            // with this pick.
            if (choice && isPicked(choice.radio)) {
              _this.pickPayment(t, pathname, choice.names);
            } else if (family) {
              _this.pickPayment(t, pathname, undefined, family);
            }
            if (kind) {
              _this.emit(kind, source, layer, t, pathname, adds);
            }
          } catch (e) {
            _this.log('[error] delivery threw: ' + e);
          }
        });
      };
      // Every real click is one event, repeats included, up to a ceiling per page.
      ButtonTracker.prototype.logClick = function (click, pathname, asLink) {
        if (!this.eventsEnabled() || this.hasTargetingOptOut()) {
          return;
        }
        if (pathname !== this.pagePath) {
          this.pagePath = pathname;
          this.pageEvents = 0;
        }
        if (this.pageEvents >= PAGE_EVENT_LIMIT) {
          return;
        }
        this.pageEvents++;
        // Restarts an expired session, as public logEvent() and page views do.
        this.mpInstance._SessionManager.resetSessionTimer();
        var queued = this.queuedForUpload();
        this.mpInstance._Events.logEvent(asLink ? buildLinkClickEvent(click, pathname) : buildButtonClickEvent(click, pathname));
        // Only a click waiting for the batch interval is sent early: a held
        // one goes out when released, and with batching off it already has.
        // A pick, such as a checkbox, a radio or a tab, waits for the batch,
        // since choosing an option doesn't leave the page the way a confirm
        // click can.
        if (!this.leaving && !click.pick && this.queuedForUpload() > queued) {
          this.uploadNow();
        }
      };
      // Events waiting in the upload queue for the next batch interval.
      ButtonTracker.prototype.queuedForUpload = function () {
        var uploader = this.mpInstance._APIClient.uploader;
        return uploader ? uploader.eventsQueuedForProcessing.length : 0;
      };
      // Uploads a click without waiting for the batch interval. A tap inside the
      // wait after the last one is held, and each restarts the wait, so a burst
      // after the first click goes out in one request once the taps stop.
      ButtonTracker.prototype.uploadNow = function () {
        var _this = this;
        if (this.uploadTimerId === null) {
          this.mpInstance.upload();
        } else {
          clearTimeout(this.uploadTimerId);
          this.uploadHeld = true;
        }
        this.uploadTimerId = setTimeout(function () {
          _this.uploadTimerId = null;
          if (_this.uploadHeld) {
            _this.uploadHeld = false;
            _this.mpInstance.upload();
          }
        }, UPLOAD_DEBOUNCE_MS);
      };
      ButtonTracker.prototype.cancelUpload = function () {
        if (this.uploadTimerId !== null) {
          clearTimeout(this.uploadTimerId);
          this.uploadTimerId = null;
        }
        this.uploadHeld = false;
      };
      ButtonTracker.prototype.emit = function (kind, source, layer, t, pathname, adds) {
        if (this.isKitSuppressed()) {
          return;
        }
        if (kind === 'commit' && layer === 'click') {
          this.lastCommitClick = t;
        }
        // An add-to-cart click throttles apart from a click that opens the
        // cart, so opening the cart first never drops the add.
        var key = adds ? kind + ':adds' : kind;
        var last = this.lastSent[key];
        if (last && last.pathname === pathname && t - last.t < THROTTLE_MS) {
          return;
        }
        this.lastSent[key] = {
          t: t,
          pathname: pathname
        };
        this.mpInstance._RoktManager.notifyCheckoutIntent(Object.freeze(adds ? {
          kind: kind,
          t: t,
          source: source,
          pathname: pathname,
          adds: adds
        } : {
          kind: kind,
          t: t,
          source: source,
          pathname: pathname
        }), pathname);
      };
      ButtonTracker.prototype.pickPayment = function (t, pathname, names, family) {
        if (this.isKitSuppressed()) {
          return;
        }
        this.mpInstance._RoktManager.notifyPaymentPick(Object.freeze({
          t: t,
          pathname: pathname,
          names: names ? Object.freeze(names.slice()) : undefined,
          family: family
        }));
      };
      // Events follow the SDK's opt-out like any other event.
      ButtonTracker.prototype.eventsEnabled = function () {
        var store = this.mpInstance._Store;
        return !!store && store.isEnabled;
      };
      // Read per click, since the launcher options can arrive after the tracker
      // starts. Only where this init configures a Rokt kit, so Global Privacy
      // Control alone doesn't stop click logging elsewhere.
      ButtonTracker.prototype.hasTargetingOptOut = function () {
        var roktManager = this.mpInstance._RoktManager;
        return this.hasRoktKit && !!roktManager && roktManager.hasTargetingOptOut();
      };
      // The Rokt manager owns the kit's privacy gates: flag, opt-out, launcher
      // options and Global Privacy Control.
      ButtonTracker.prototype.isKitSuppressed = function () {
        var roktManager = this.mpInstance._RoktManager;
        return !this.hasRoktKit || !roktManager || roktManager.isCheckoutIntentSuppressed();
      };
      ButtonTracker.prototype.log = function (message) {
        this.mpInstance.Logger.verbose('mParticle button tracking: ' + message);
      };
      return ButtonTracker;
    }();

    var Messages = Constants.Messages,
      HTTPCodes = Constants.HTTPCodes,
      FeatureFlags = Constants.FeatureFlags,
      CaptureIntegrationSpecificIdsV2Modes = Constants.CaptureIntegrationSpecificIdsV2Modes;
    var ReportBatching = FeatureFlags.ReportBatching,
      CaptureIntegrationSpecificIds = FeatureFlags.CaptureIntegrationSpecificIds,
      CaptureIntegrationSpecificIdsV2 = FeatureFlags.CaptureIntegrationSpecificIdsV2;
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
      this._CookieSyncManager = new CookieSyncManager(this);
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
      this._ErrorReportingDispatcher = new ErrorReportingDispatcher();
      this._LoggingDispatcher = new LoggingDispatcher();
      this._RoktManager = new RoktManager(instanceName);
      this._RoktManager.setOnReadyCallback(function () {
        self.processQueueOnIdentityFailure();
      });
      /**
       * Processes message and ready queue when identity requests fails but Rokt is ready.
       */
      this.processQueueOnIdentityFailure = function () {
        var _a, _b, _c;
        if ((_a = self._Store) === null || _a === void 0 ? void 0 : _a.isInitialized) {
          return;
        }
        if (((_b = self._Store) === null || _b === void 0 ? void 0 : _b.identityCallFailed) && ((_c = self._RoktManager) === null || _c === void 0 ? void 0 : _c.isReady())) {
          self._RoktManager.processMessageQueue();
          self._preInit.readyQueue = processReadyQueue(self._preInit.readyQueue, self.Logger);
        }
      };
      /**
       * Drains the ready queue for noFunctional sessions with no explicit identity.
       */
      this.processQueueOnNoFunctional = function () {
        var _a, _b;
        if ((_a = self._Store) === null || _a === void 0 ? void 0 : _a.isInitialized) {
          return;
        }
        var noFunctionalWithoutId = ((_b = self._CookieConsentManager) === null || _b === void 0 ? void 0 : _b.getNoFunctional()) && !hasExplicitIdentifier(self._Store);
        if (noFunctionalWithoutId) {
          self._preInit.readyQueue = processReadyQueue(self._preInit.readyQueue, self.Logger);
        }
      };
      // required for forwarders once they reference the mparticle instance
      this.IdentityType = IdentityType;
      this.EventType = EventType;
      this.CommerceEventType = CommerceEventType;
      this.PromotionType = PromotionActionType;
      this.ProductActionType = ProductActionType;
      this.RoktEvents = RoktEvents;
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
              var mergedConfig = extend({}, config, result);
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
          // The Rokt manager keeps its own store reference, so stop button
          // tracking here rather than relying on the deleted store.
          resetButtonTracking();
          instance._ButtonTracker = undefined;
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
        instance._ErrorReportingDispatcher = new ErrorReportingDispatcher();
        instance._LoggingDispatcher = new LoggingDispatcher();
        instance.Logger = new Logger(config);
        instance._ErrorReportingDispatcher.logger = instance.Logger;
        instance._LoggingDispatcher.logger = instance.Logger;
        instance._Store = new Store(config, instance);
        instance._Store.isLocalStorageAvailable = instance._Persistence.determineLocalStorageAvailability(window.localStorage);
        instance._Events.stopTracking();
        resetPageViewTracking();
        instance._PageViewTracker = undefined;
        resetButtonTracking();
        instance._ButtonTracker = undefined;
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
       * Executes callback when the SDK is ready, or Rokt is ready but identify requests fail due to server errors.
       * This ensures Rokt methods like selectPlacements continue to work during backend outages.
       * @method ready
       * @param {Function} f Callback to execute
       */
      this.ready = function (f) {
        var _a, _b, _c;
        var noFunctionalWithoutId = ((_a = self._CookieConsentManager) === null || _a === void 0 ? void 0 : _a.getNoFunctional()) && !hasExplicitIdentifier(self._Store);
        var shouldExecute = isFunction(f) && (((_b = self._Store) === null || _b === void 0 ? void 0 : _b.isInitialized) || ((_c = self._Store) === null || _c === void 0 ? void 0 : _c.identityCallFailed) && self._RoktManager.isReady() || noFunctionalWithoutId);
        if (shouldExecute) {
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
        return self._Store.SDKConfig.isDevelopmentMode ? Constants.Environment.Development : Constants.Environment.Production;
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
          event.eventType = EventType.Unknown;
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
          eventType = EventType.Unknown;
        }
        if (!self._Helpers.isEventType(eventType)) {
          self.Logger.error('Invalid event type: ' + eventType + ', must be one of: \n' + JSON.stringify(EventType));
          return;
        }
        if (!self._Helpers.canLog()) {
          self.Logger.error(Messages.ErrorMessages.LoggingDisabled);
          return;
        }
        self._Events.logEvent({
          messageType: MessageType$1.PageEvent,
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
          messageType: MessageType$1.CrashReport,
          name: error.name ? error.name : 'Error',
          eventType: EventType.Other,
          data: data
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
            self.Logger.error('The attributes argument must be an object. A ' + _typeof(attrs) + ' was entered. Please correct and retry.');
            return;
          }
          if (customFlags && !self._Helpers.isObject(customFlags)) {
            self.Logger.error('The customFlags argument must be an object. A ' + _typeof(customFlags) + ' was entered. Please correct and retry.');
            return;
          }
        }
        self._Events.logEvent({
          messageType: MessageType$1.PageView,
          name: eventName,
          data: attrs,
          eventType: EventType.Unknown,
          customFlags: customFlags
        }, eventOptions);
      };
      /**
       * Forces an upload of the batch
       * @method upload
       */
      this.upload = function () {
        var _a, _b;
        if (self._Helpers.canLog()) {
          if (self._Store.webviewBridgeEnabled) {
            self._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Upload);
          } else {
            (_b = (_a = self._APIClient) === null || _a === void 0 ? void 0 : _a.uploader) === null || _b === void 0 ? void 0 : _b.prepareAndUpload(false, false);
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
         * @deprecated Use `logProductAction` with `ProductActionType.Purchase` instead.
         */
        logPurchase: function logPurchase(transactionAttributes, product, clearCart, attrs, customFlags) {
          logDeprecatedMethodUsage({
            methodName: 'mParticle.logPurchase',
            warningMessage: 'mParticle.logPurchase is deprecated, please use mParticle.logProductAction with ProductActionType.Purchase instead'
          }, self.Logger, self._ErrorReportingDispatcher);
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
        var _a;
        var skipQueue = ((_a = self._CookieConsentManager) === null || _a === void 0 ? void 0 : _a.getNoFunctional()) && !hasExplicitIdentifier(self._Store);
        if (!skipQueue) {
          var queued = queueIfNotInitialized(function () {
            self.setSessionAttribute(key, value);
          }, self);
          if (queued) return;
        }
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
        if (isOptingOut) {
          if (self._ButtonTracker) {
            self._ButtonTracker.clearPending();
          }
          self._RoktManager.discardCheckoutIntents();
        }
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
                  self.Logger.error('Values for integration attributes must be strings. You entered a ' + _typeof(attrs[key]));
                  continue;
                }
              } else {
                self.Logger.error('Keys must be strings, you entered a ' + _typeof(key));
                continue;
              }
            }
          }
        } else {
          self.Logger.error('Attrs must be an object with keys and values. You entered a ' + _typeof(attrs));
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
      this._registerErrorReportingService = function (service) {
        self._ErrorReportingDispatcher.register(service);
      };
      this._registerLoggingService = function (service) {
        self._LoggingDispatcher.register(service);
      };
      var launcherInstanceGuidKey = Constants.Rokt.LauncherInstanceGuidKey;
      this.setLauncherInstanceGuid = function () {
        if (!window[launcherInstanceGuidKey] || typeof window[launcherInstanceGuidKey] !== 'string') {
          window[launcherInstanceGuidKey] = self._Helpers.generateUniqueId();
        }
      };
      this.getLauncherInstanceGuid = function () {
        return window[launcherInstanceGuidKey];
      };
      this.captureTiming = function (metricsName) {
        var _a;
        if (typeof window !== 'undefined' && ((_a = window.performance) === null || _a === void 0 ? void 0 : _a.mark)) {
          window.performance.mark(metricsName);
        }
      };
    }
    // Some (server) config settings need to be returned before they are set on SDKConfig in a self hosted environment
    function completeSDKInitialization(apiKey, config, mpInstance) {
      var _a, _b, _c, _d;
      var kitBlocker = createKitBlocker(config, mpInstance);
      var getFeatureFlag = mpInstance._Helpers.getFeatureFlag;
      var _e = Constants.FeatureFlags,
        AutoLogPageView = _e.AutoLogPageView,
        AutoButtonTracking = _e.AutoButtonTracking,
        AutoLinkTracking = _e.AutoLinkTracking;
      // Destroy previous batch uploader to prevent leaked timers and event listeners
      if ((_a = mpInstance._APIClient) === null || _a === void 0 ? void 0 : _a.uploader) {
        mpInstance._APIClient.uploader.destroy();
      }
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
        // Button tracking never runs as a native passthrough.
        resetButtonTracking();
        mpInstance._RoktManager.setAutoButtonClicksForwarded(false);
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
        if (getFeatureFlag(ReportBatching)) {
          mpInstance._ForwardingStatsUploader.startForwardingStatsTimer();
        }
        // https://go.mparticle.com/work/SQDSDKS-7639
        if (isIntegrationCaptureEnabled(getFeatureFlag)) {
          var integrationSpecificIds = getFeatureFlag(CaptureIntegrationSpecificIds);
          var integrationSpecificIdsV2 = getFeatureFlag(CaptureIntegrationSpecificIdsV2);
          var captureMode = void 0;
          if (integrationSpecificIds || integrationSpecificIdsV2 === CaptureIntegrationSpecificIdsV2Modes.All) {
            captureMode = 'all';
          } else if (integrationSpecificIdsV2 === CaptureIntegrationSpecificIdsV2Modes.RoktOnly) {
            captureMode = 'roktonly';
          }
          mpInstance._IntegrationCapture = new IntegrationCapture(captureMode);
          mpInstance._IntegrationCapture.capture();
        }
        // Configure Rokt Manager with user and filtered user
        var roktConfig_1 = parseConfig(config, 'Rokt', 181);
        if (roktConfig_1) {
          var accountId = (_b = roktConfig_1.settings) === null || _b === void 0 ? void 0 : _b.accountId;
          mpInstance._Store.setRoktAccountId(accountId);
          var createRoktFilteredUser = function createRoktFilteredUser(mpid) {
            return filteredMparticleUser(mpid, roktConfig_1, mpInstance, kitBlocker);
          };
          var roktOptions = {
            sandbox: config === null || config === void 0 ? void 0 : config.isDevelopmentMode,
            launcherOptions: config === null || config === void 0 ? void 0 : config.launcherOptions,
            domain: config === null || config === void 0 ? void 0 : config.domain
          };
          // https://go.mparticle.com/work/SQDSDKS-7339
          mpInstance._RoktManager.init(roktConfig_1, createRoktFilteredUser(currentUserMPID), mpInstance.Identity, mpInstance._Store, mpInstance.Logger, roktOptions, mpInstance.captureTiming, mpInstance._ErrorReportingDispatcher, mpInstance._LoggingDispatcher, mpInstance._IntegrationCapture, createRoktFilteredUser);
        }
        // Checkout intent comes from the shopper's clicks, so it goes to the
        // Rokt kit only when that kit receives them. Set before
        // processForwarders: the kit can read it during this init, from its own
        // init or from a returning shopper's landing page view.
        var logButtons = !!getFeatureFlag(AutoButtonTracking);
        var logLinks = !!getFeatureFlag(AutoLinkTracking);
        // Links feed intent too, so with link tracking on the kit must also
        // receive Auto Link Click events.
        var buttonClickBlocker = roktConfig_1 ? getButtonClickBlocker(roktConfig_1, kitBlocker) : undefined;
        var linkClickBlocker = roktConfig_1 && logLinks ? getButtonClickBlocker(roktConfig_1, kitBlocker, true) : undefined;
        if (logButtons && (buttonClickBlocker || linkClickBlocker)) {
          mpInstance.Logger.warning(buttonClickBlocker ? "Checkout intent is off: the ".concat(buttonClickBlocker, " keeps some or all Auto Button Click events from the Rokt kit.") : "Checkout intent is off: the ".concat(linkClickBlocker, " keeps some or all Auto Link Click events from the Rokt kit."));
        }
        mpInstance._RoktManager.setAutoButtonClicksForwarded(!!roktConfig_1 && !buttonClickBlocker && !linkClickBlocker);
        mpInstance._Forwarders.processForwarders(config, mpInstance._APIClient.prepareForwardingStats);
        mpInstance._Forwarders.processPixelConfigs(config);
        // Checks if session is created, resumed, or needs to be ended
        // Logs a session start or session end event accordingly
        mpInstance._SessionManager.initialize();
        mpInstance._Events.logAST();
        // Note: APV state (the active tracker and the initial-page-view flag) is
        // window-scoped and assumes a single active SDK instance. Multiple-instance
        // support is out of scope.
        if (getFeatureFlag(AutoLogPageView)) {
          if (!mpInstance._PageViewTracker) {
            mpInstance.Logger.verbose('mParticle APV: [sdk-init] creating new PageViewTracker for this instance');
            mpInstance._PageViewTracker = new PageViewTracker(mpInstance, {
              isAutoPageView: true
            });
          }
          // The initial page view fires once per hard page load, not once per
          // init(): the window flag survives the module re-evaluation Next.js
          // performs on every SPA navigation, so repeated init() calls from SPA
          // re-renders don't fire duplicate logPageView() events.
          if (hasInitialPageViewFired()) {
            mpInstance.Logger.verbose('mParticle APV: [sdk-init] initial page view already logged this page load, skipping');
          } else {
            markInitialPageViewFired();
            mpInstance._Events.logPageView({
              isAutoPageView: true
            });
          }
          mpInstance._PageViewTracker.init();
        } else if (mpInstance._PageViewTracker) {
          // AutoLogPageView was disabled on re-init: tear down the active tracker
          // so it stops listening. Re-created if the flag is re-enabled later.
          mpInstance._PageViewTracker.teardown();
        }
        if (logButtons || logLinks) {
          if (!mpInstance._ButtonTracker) {
            mpInstance._ButtonTracker = new ButtonTracker(mpInstance);
          }
          mpInstance._ButtonTracker.init({
            hasRoktKit: !!roktConfig_1,
            logButtons: logButtons,
            logLinks: logLinks
          });
        } else {
          // Also retires a tracker left by an earlier bundle load. Like APV,
          // this assumes a single active SDK instance.
          resetButtonTracking();
        }
        processIdentityCallback(mpInstance, currentUser, currentUserMPID, currentUserIdentities);
      }
      // We will continue to clear out the ready queue as part of the initial init flow
      // if an identify request is unnecessary, such as if there is an existing session
      if (mpInstance._Store.mpid && !mpInstance._Store.identifyCalled || mpInstance._Store.webviewBridgeEnabled) {
        mpInstance._Store.isInitialized = true;
        // Sync $NoTargeting user attribute on re-init when no identity call is made
        // if for some reason there was a change in boolean between init calls
        (_c = mpInstance._CookieConsentManager) === null || _c === void 0 ? void 0 : _c.syncNoTargetingAttribute(mpInstance.Identity.getCurrentUser());
        mpInstance._preInit.readyQueue = processReadyQueue(mpInstance._preInit.readyQueue, mpInstance.Logger);
      }
      // For noFunctional sessions with no identity, drain any pre-init ready callbacks
      // that were queued before _CookieConsentManager was available to evaluate the condition.
      (_d = mpInstance.processQueueOnNoFunctional) === null || _d === void 0 ? void 0 : _d.call(mpInstance);
      // https://go.mparticle.com/work/SQDSDKS-6040
      if (mpInstance._Store.isFirstRun) {
        mpInstance._Store.isFirstRun = false;
      }
    }
    // https://go.mparticle.com/work/SQDSDKS-7061
    function createKitBlocker(config, mpInstance) {
      var kitBlocker;
      var dataPlanForKitBlocker;
      var kitBlockError;
      var kitBlockOptions;
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
      var _a;
      // Identity expects mpInstance._Identity.idCache to always exist. DisabledVault
      // ensures no identity response data is written to localStorage when noFunctional is true
      if ((_a = mpInstance._CookieConsentManager) === null || _a === void 0 ? void 0 : _a.getNoFunctional()) {
        return new DisabledVault("".concat(mpInstance._Store.storageName, "-id-cache"));
      }
      return new LocalStorageVault("".concat(mpInstance._Store.storageName, "-id-cache"));
    }
    function runPreConfigFetchInitialization(mpInstance, apiKey, config) {
      mpInstance.Logger = new Logger(config);
      mpInstance._ErrorReportingDispatcher.logger = mpInstance.Logger;
      mpInstance._LoggingDispatcher.logger = mpInstance.Logger;
      mpInstance._Store = new Store(config, mpInstance, apiKey);
      window.mParticle.Store = mpInstance._Store;
      // Button tracking stops until this init's config decides whether it runs.
      resetButtonTracking();
      mpInstance.Logger.verbose(StartingInitialization);
      // Initialize CookieConsentManager with privacy flags from launcherOptions
      var _a = normalizeRoktLauncherOptions(config === null || config === void 0 ? void 0 : config.launcherOptions),
        noFunctional = _a.noFunctional,
        noTargeting = _a.noTargeting,
        doNotShareOrSell = _a.doNotShareOrSell;
      mpInstance._CookieConsentManager = new CookieConsentManager({
        noFunctional: noFunctional,
        noTargeting: noTargeting,
        doNotShareOrSell: doNotShareOrSell
      });
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
    function queueIfNotInitialized(func, self) {
      var _a, _b;
      // When noFunctional is true with no explicit identifier, the SDK will never
      // receive an MPID. Let these calls through so events can still reach forwarders immediately.
      // sendEventToServer handles queuing for the MP server upload path separately.
      var noFunctionalWithoutId = ((_a = self._CookieConsentManager) === null || _a === void 0 ? void 0 : _a.getNoFunctional()) && !hasExplicitIdentifier(self._Store);
      if (((_b = self._Store) === null || _b === void 0 ? void 0 : _b.isInitialized) || noFunctionalWithoutId) {
        return false;
      }
      self._preInit.readyQueue.push(function () {
        var _a;
        if ((_a = self._Store) === null || _a === void 0 ? void 0 : _a.isInitialized) {
          func();
        }
      });
      return true;
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
            extend: extend,
            createServiceUrl: mockFunction,
            parseNumber: mockFunction,
            isObject: mockFunction,
            Validators: null
          },
          _resetForTests: mockFunction,
          _APIClient: null,
          _timeOnSiteTimer: {
            getTimeInForeground: mockFunction
          },
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
            },
            getTotalTimeOnSite: mockFunction
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
        var hashedScreenName = KitFilterHelper.hashEventName(screenName, EventType.Unknown);
        this.filterDictionary.screenNameFilters.push(hashedScreenName);
      };
      MPSideloadedKit.prototype.addScreenAttributeFilter = function (screenName, screenAttribute) {
        var hashedScreenAttribute = KitFilterHelper.hashEventAttributeKey(EventType.Unknown, screenName, screenAttribute);
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
    // https://go.mparticle.com/work/SQDSDKS-6768
    if (!Array.isArray) {
      // @ts-ignore
      Array.prototype.isArray = Polyfill.isArray;
    }
    function mParticleInstanceManager() {
      var self = this;
      // Only leaving this here in case any clients are trying to access mParticle.Store, to prevent from throwing
      this.Store = {};
      this._instances = {};
      this.IdentityType = IdentityType;
      this.EventType = EventType;
      this.CommerceEventType = CommerceEventType;
      this.PromotionType = PromotionActionType;
      this.ProductActionType = ProductActionType;
      this.RoktEvents = RoktEvents;
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
          client = new mParticleInstance(instanceName);
          self._instances[instanceName] = client;
        }
        client.captureTiming(PerformanceMarkType.SdkStart);
        client.setLauncherInstanceGuid();
        client.init(apiKey, config, instanceName);
      };
      this.captureTiming = function (metricsName) {
        self.getInstance().captureTiming(metricsName);
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
      this.Rokt = self.getInstance()._RoktManager;
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
        createAliasRequest: function createAliasRequest(sourceUser, destinationUser, scope) {
          return self.getInstance().Identity.createAliasRequest(sourceUser, destinationUser, scope);
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
        },
        search: function search(workspaceApiKey, knownIdentities, callback) {
          self.getInstance().Identity.search(workspaceApiKey, knownIdentities, callback);
        }
      };
      this.sessionManager = {
        getSession: function getSession() {
          return self.getInstance()._SessionManager.getSessionId();
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
      this._setIntegrationDelay = function (moduleId, boolean) {
        self.getInstance()._setIntegrationDelay(moduleId, boolean);
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
      // Kits clean every URL they send with the same rule as core events.
      this._cleanUrl = cleanUrl;
      this.addForwarder = function (forwarder) {
        self.getInstance().addForwarder(forwarder);
      };
      this._getActiveForwarders = function () {
        return self.getInstance()._getActiveForwarders();
      };
      this._setWrapperSDKInfo = function (name, version) {
        self.getInstance()._setWrapperSDKInfo(name, version);
      };
      this._registerErrorReportingService = function (service) {
        self.getInstance()._registerErrorReportingService(service);
      };
      this._registerLoggingService = function (service) {
        self.getInstance()._registerLoggingService(service);
      };
    }
    var mParticleManager = new mParticleInstanceManager();
    if (typeof window !== 'undefined') {
      // mParticle is the global object used to access the SDK and predates instance manager,
      // when mParticle was a singleton.  We now support multiple instances. Calling methods
      // on mParticle directly will access the default instance, but mParticle can also be used 
      // as the instance manager in self hosted mode.
      window.mParticle = mParticleManager;
      // https://go.mparticle.com/work/SQDSDKS-5053
      window.mParticle._BatchValidator = new _BatchValidator();
    }

    return mParticleManager;

})();
