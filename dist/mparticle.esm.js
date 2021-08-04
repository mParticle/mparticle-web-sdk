if (typeof globalThis !== 'undefined') {globalThis.regeneratorRuntime = undefined}

// Base64 encoder/decoder - http://www.webtoolkit.info/javascript_base64.html
var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",// Input must be a string
encode:function(a){try{if(window.btoa&&window.atob)return window.btoa(unescape(encodeURIComponent(a)))}catch(a){console.error("Error encoding cookie values into Base64:"+a);}return this._encode(a)},_encode:function(a){var b,c,d,e,f,g,h,j="",k=0;for(a=UTF8.encode(a);k<a.length;)b=a.charCodeAt(k++),c=a.charCodeAt(k++),d=a.charCodeAt(k++),e=b>>2,f=(3&b)<<4|c>>4,g=(15&c)<<2|d>>6,h=63&d,isNaN(c)?g=h=64:isNaN(d)&&(h=64),j=j+Base64._keyStr.charAt(e)+Base64._keyStr.charAt(f)+Base64._keyStr.charAt(g)+Base64._keyStr.charAt(h);return j},decode:function(a){try{if(window.btoa&&window.atob)return decodeURIComponent(escape(window.atob(a)))}catch(a){//log(e);
}return Base64._decode(a)},_decode:function(a){var b,c,d,e,f,g,h,j="",k=0;for(a=a.replace(/[^A-Za-z0-9\+\/\=]/g,"");k<a.length;)e=Base64._keyStr.indexOf(a.charAt(k++)),f=Base64._keyStr.indexOf(a.charAt(k++)),g=Base64._keyStr.indexOf(a.charAt(k++)),h=Base64._keyStr.indexOf(a.charAt(k++)),b=e<<2|f>>4,c=(15&f)<<4|g>>2,d=(3&g)<<6|h,j+=String.fromCharCode(b),64!==g&&(j+=String.fromCharCode(c)),64!==h&&(j+=String.fromCharCode(d));return j=UTF8.decode(j),j}},UTF8={encode:function(a){for(var b,d="",e=0;e<a.length;e++)b=a.charCodeAt(e),128>b?d+=String.fromCharCode(b):127<b&&2048>b?(d+=String.fromCharCode(192|b>>6),d+=String.fromCharCode(128|63&b)):(d+=String.fromCharCode(224|b>>12),d+=String.fromCharCode(128|63&b>>6),d+=String.fromCharCode(128|63&b));return d},decode:function(a){for(var b="",d=0,e=0,f=0,g=0;d<a.length;)e=a.charCodeAt(d),128>e?(b+=String.fromCharCode(e),d++):191<e&&224>e?(f=a.charCodeAt(d+1),b+=String.fromCharCode((31&e)<<6|63&f),d+=2):(f=a.charCodeAt(d+1),g=a.charCodeAt(d+2),b+=String.fromCharCode((15&e)<<12|(63&f)<<6|63&g),d+=3);return b}};var Polyfill = {// forEach polyfill
// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.io/#x15.4.4.18
forEach:function forEach(a,b){var c,d;if(null==this)throw new TypeError(" this is null or not defined");var e=Object(this),f=e.length>>>0;if("function"!=typeof a)throw new TypeError(a+" is not a function");for(1<arguments.length&&(c=b),d=0;d<f;){var g;d in e&&(g=e[d],a.call(c,g,d,e)),d++;}},// map polyfill
// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.io/#x15.4.4.19
map:function map(a,b){var c,d,e;if(null===this)throw new TypeError(" this is null or not defined");var f=Object(this),g=f.length>>>0;if("function"!=typeof a)throw new TypeError(a+" is not a function");for(1<arguments.length&&(c=b),d=Array(g),e=0;e<g;){var h,i;e in f&&(h=f[e],i=a.call(c,h,e,f),d[e]=i),e++;}return d},// filter polyfill
// Prodcution steps of ECMA-262, Edition 5
// Reference: http://es5.github.io/#x15.4.4.20
filter:function filter(a/*, thisArg*/){if(void 0===this||null===this)throw new TypeError;var b=Object(this),c=b.length>>>0;if("function"!=typeof a)throw new TypeError;for(var d=[],e=2<=arguments.length?arguments[1]:void 0,f=0;f<c;f++)if(f in b){var g=b[f];a.call(e,g,f,b)&&d.push(g);}return d},// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
isArray:function isArray(a){return "[object Array]"===Object.prototype.toString.call(a)},Base64:Base64};

function _defineProperty(obj, key, value) {
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

var defineProperty = _defineProperty;

var MessageType={SessionStart:1,SessionEnd:2,PageView:3,PageEvent:4,CrashReport:5,OptOut:6,AppStateTransition:10,Profile:14,Commerce:16,Media:20,UserAttributeChange:17,UserIdentityChange:18},TriggerUploadType=defineProperty({},MessageType.Commerce,1),EventType={Unknown:0,Navigation:1,Location:2,Search:3,Transaction:4,UserContent:5,UserPreference:6,Social:7,Other:8,Media:9,getName:function getName(a){return a===EventType.Unknown?"Unknown":a===EventType.Navigation?"Navigation":a===EventType.Location?"Location":a===EventType.Search?"Search":a===EventType.Transaction?"Transaction":a===EventType.UserContent?"User Content":a===EventType.UserPreference?"User Preference":a===EventType.Social?"Social":a===CommerceEventType.ProductAddToCart?"Product Added to Cart":a===CommerceEventType.ProductAddToWishlist?"Product Added to Wishlist":a===CommerceEventType.ProductCheckout?"Product Checkout":a===CommerceEventType.ProductCheckoutOption?"Product Checkout Options":a===CommerceEventType.ProductClick?"Product Click":a===CommerceEventType.ProductImpression?"Product Impression":a===CommerceEventType.ProductPurchase?"Product Purchased":a===CommerceEventType.ProductRefund?"Product Refunded":a===CommerceEventType.ProductRemoveFromCart?"Product Removed From Cart":a===CommerceEventType.ProductRemoveFromWishlist?"Product Removed from Wishlist":a===CommerceEventType.ProductViewDetail?"Product View Details":a===CommerceEventType.PromotionClick?"Promotion Click":a===CommerceEventType.PromotionView?"Promotion View":"Other"}},CommerceEventType={ProductAddToCart:10,ProductRemoveFromCart:11,ProductCheckout:12,ProductCheckoutOption:13,ProductClick:14,ProductViewDetail:15,ProductPurchase:16,ProductRefund:17,PromotionView:18,PromotionClick:19,ProductAddToWishlist:20,ProductRemoveFromWishlist:21,ProductImpression:22},IdentityType={Other:0,CustomerId:1,Facebook:2,Twitter:3,Google:4,Microsoft:5,Yahoo:6,Email:7,FacebookCustomAudienceId:9,Other2:10,Other3:11,Other4:12,Other5:13,Other6:14,Other7:15,Other8:16,Other9:17,Other10:18,MobileNumber:19,PhoneNumber2:20,PhoneNumber3:21};IdentityType.isValid=function(a){if("number"==typeof a)for(var b in IdentityType)if(IdentityType.hasOwnProperty(b)&&IdentityType[b]===a)return !0;return !1},IdentityType.getName=function(a){return a===window.mParticle.IdentityType.CustomerId?"Customer ID":a===window.mParticle.IdentityType.Facebook?"Facebook ID":a===window.mParticle.IdentityType.Twitter?"Twitter ID":a===window.mParticle.IdentityType.Google?"Google ID":a===window.mParticle.IdentityType.Microsoft?"Microsoft ID":a===window.mParticle.IdentityType.Yahoo?"Yahoo ID":a===window.mParticle.IdentityType.Email?"Email":a===window.mParticle.IdentityType.FacebookCustomAudienceId?"Facebook App User ID":"Other ID"},IdentityType.getIdentityType=function(a){return "other"===a?IdentityType.Other:"customerid"===a?IdentityType.CustomerId:"facebook"===a?IdentityType.Facebook:"twitter"===a?IdentityType.Twitter:"google"===a?IdentityType.Google:"microsoft"===a?IdentityType.Microsoft:"yahoo"===a?IdentityType.Yahoo:"email"===a?IdentityType.Email:"facebookcustomaudienceid"===a?IdentityType.FacebookCustomAudienceId:"other2"===a?IdentityType.Other2:"other3"===a?IdentityType.Other3:"other4"===a?IdentityType.Other4:"other5"===a?IdentityType.Other5:"other6"===a?IdentityType.Other6:"other7"===a?IdentityType.Other7:"other8"===a?IdentityType.Other8:"other9"===a?IdentityType.Other9:"other10"===a?IdentityType.Other10:"mobile_number"===a?IdentityType.MobileNumber:"phone_number_2"===a?IdentityType.PhoneNumber2:!("phone_number_3"!=a)&&IdentityType.PhoneNumber3},IdentityType.getIdentityName=function(a){return a===IdentityType.Other?"other":a===IdentityType.CustomerId?"customerid":a===IdentityType.Facebook?"facebook":a===IdentityType.Twitter?"twitter":a===IdentityType.Google?"google":a===IdentityType.Microsoft?"microsoft":a===IdentityType.Yahoo?"yahoo":a===IdentityType.Email?"email":a===IdentityType.FacebookCustomAudienceId?"facebookcustomaudienceid":a===IdentityType.Other2?"other2":a===IdentityType.Other3?"other3":a===IdentityType.Other4?"other4":a===IdentityType.Other5?"other5":a===IdentityType.Other6?"other6":a===IdentityType.Other7?"other7":a===IdentityType.Other8?"other8":a===IdentityType.Other9?"other9":a===IdentityType.Other10?"other10":a===IdentityType.MobileNumber?"mobile_number":a===IdentityType.PhoneNumber2?"phone_number_2":a===IdentityType.PhoneNumber3?"phone_number_3":void 0};var ProductActionType={Unknown:0,AddToCart:1,RemoveFromCart:2,Checkout:3,CheckoutOption:4,Click:5,ViewDetail:6,Purchase:7,Refund:8,AddToWishlist:9,RemoveFromWishlist:10};ProductActionType.getName=function(a){return a===ProductActionType.AddToCart?"Add to Cart":a===ProductActionType.RemoveFromCart?"Remove from Cart":a===ProductActionType.Checkout?"Checkout":a===ProductActionType.CheckoutOption?"Checkout Option":a===ProductActionType.Click?"Click":a===ProductActionType.ViewDetail?"View Detail":a===ProductActionType.Purchase?"Purchase":a===ProductActionType.Refund?"Refund":a===ProductActionType.AddToWishlist?"Add to Wishlist":a===ProductActionType.RemoveFromWishlist?"Remove from Wishlist":"Unknown"},ProductActionType.getExpansionName=function(a){return a===ProductActionType.AddToCart?"add_to_cart":a===ProductActionType.RemoveFromCart?"remove_from_cart":a===ProductActionType.Checkout?"checkout":a===ProductActionType.CheckoutOption?"checkout_option":a===ProductActionType.Click?"click":a===ProductActionType.ViewDetail?"view_detail":a===ProductActionType.Purchase?"purchase":a===ProductActionType.Refund?"refund":a===ProductActionType.AddToWishlist?"add_to_wishlist":a===ProductActionType.RemoveFromWishlist?"remove_from_wishlist":"unknown"};var PromotionActionType={Unknown:0,PromotionView:1,PromotionClick:2};PromotionActionType.getName=function(a){return a===PromotionActionType.PromotionView?"view":a===PromotionActionType.PromotionClick?"click":"unknown"},PromotionActionType.getExpansionName=function(a){return a===PromotionActionType.PromotionView?"view":a===PromotionActionType.PromotionClick?"click":"unknown"};var ProfileMessageType={Logout:3},ApplicationTransitionType={AppInit:1};var Types = {MessageType:MessageType,EventType:EventType,CommerceEventType:CommerceEventType,IdentityType:IdentityType,ProfileMessageType:ProfileMessageType,ApplicationTransitionType:ApplicationTransitionType,ProductActionType:ProductActionType,PromotionActionType:PromotionActionType,TriggerUploadType:TriggerUploadType};

var version = "2.14.0";

var Constants={sdkVersion:version,sdkVendor:"mparticle",platform:"web",Messages:{ErrorMessages:{NoToken:"A token must be specified.",EventNameInvalidType:"Event name must be a valid string value.",EventDataInvalidType:"Event data must be a valid object hash.",LoggingDisabled:"Event logging is currently disabled.",CookieParseError:"Could not parse cookie",EventEmpty:"Event object is null or undefined, cancelling send",APIRequestEmpty:"APIRequest is null or undefined, cancelling send",NoEventType:"Event type must be specified.",TransactionIdRequired:"Transaction ID is required",TransactionRequired:"A transaction attributes object is required",PromotionIdRequired:"Promotion ID is required",BadAttribute:"Attribute value cannot be object or array",BadKey:"Key value cannot be object or array",BadLogPurchase:"Transaction attributes and a product are both required to log a purchase, https://docs.mparticle.com/?javascript#measuring-transactions"},InformationMessages:{CookieSearch:"Searching for cookie",CookieFound:"Cookie found, parsing values",CookieNotFound:"Cookies not found",CookieSet:"Setting cookie",CookieSync:"Performing cookie sync",SendBegin:"Starting to send event",SendIdentityBegin:"Starting to send event to identity server",SendWindowsPhone:"Sending event to Windows Phone container",SendIOS:"Calling iOS path: ",SendAndroid:"Calling Android JS interface method: ",SendHttp:"Sending event to mParticle HTTP service",SendAliasHttp:"Sending alias request to mParticle HTTP service",SendIdentityHttp:"Sending event to mParticle HTTP service",StartingNewSession:"Starting new Session",StartingLogEvent:"Starting to log event",StartingLogOptOut:"Starting to log user opt in/out",StartingEndSession:"Starting to end session",StartingInitialization:"Starting to initialize",StartingLogCommerceEvent:"Starting to log commerce event",StartingAliasRequest:"Starting to Alias MPIDs",LoadingConfig:"Loading configuration options",AbandonLogEvent:"Cannot log event, logging disabled or developer token not set",AbandonAliasUsers:"Cannot Alias Users, logging disabled or developer token not set",AbandonStartSession:"Cannot start session, logging disabled or developer token not set",AbandonEndSession:"Cannot end session, logging disabled or developer token not set",NoSessionToEnd:"Cannot end session, no active session found"},ValidationMessages:{ModifyIdentityRequestUserIdentitiesPresent:"identityRequests to modify require userIdentities to be present. Request not sent to server. Please fix and try again",IdentityRequesetInvalidKey:"There is an invalid key on your identityRequest object. It can only contain a `userIdentities` object and a `onUserAlias` function. Request not sent to server. Please fix and try again.",OnUserAliasType:"The onUserAlias value must be a function. The onUserAlias provided is of type",UserIdentities:"The userIdentities key must be an object with keys of identityTypes and values of strings. Request not sent to server. Please fix and try again.",UserIdentitiesInvalidKey:"There is an invalid identity key on your `userIdentities` object within the identityRequest. Request not sent to server. Please fix and try again.",UserIdentitiesInvalidValues:"All user identity values must be strings or null. Request not sent to server. Please fix and try again.",AliasMissingMpid:"Alias Request must contain both a destinationMpid and a sourceMpid",AliasNonUniqueMpid:"Alias Request's destinationMpid and sourceMpid must be unique",AliasMissingTime:"Alias Request must have both a startTime and an endTime",AliasStartBeforeEndTime:"Alias Request's endTime must be later than its startTime"}},NativeSdkPaths:{LogEvent:"logEvent",SetUserTag:"setUserTag",RemoveUserTag:"removeUserTag",SetUserAttribute:"setUserAttribute",RemoveUserAttribute:"removeUserAttribute",SetSessionAttribute:"setSessionAttribute",AddToCart:"addToCart",RemoveFromCart:"removeFromCart",ClearCart:"clearCart",LogOut:"logOut",SetUserAttributeList:"setUserAttributeList",RemoveAllUserAttributes:"removeAllUserAttributes",GetUserAttributesLists:"getUserAttributesLists",GetAllUserAttributes:"getAllUserAttributes",Identify:"identify",Logout:"logout",Login:"login",Modify:"modify",Alias:"aliasUsers",Upload:"upload"},StorageNames:{localStorageName:"mprtcl-api",// Name of the mP localstorage, had cp and pb even if cookies were used, skipped v2
localStorageNameV3:"mprtcl-v3",// v3 Name of the mP localstorage, final version on SDKv1
cookieName:"mprtcl-api",// v1 Name of the cookie stored on the user's machine
cookieNameV2:"mprtcl-v2",// v2 Name of the cookie stored on the user's machine. Removed keys with no values, moved cartProducts and productBags to localStorage.
cookieNameV3:"mprtcl-v3",// v3 Name of the cookie stored on the user's machine. Base64 encoded keys in Base64CookieKeys object, final version on SDKv1
localStorageNameV4:"mprtcl-v4",// v4 Name of the mP localstorage, Current Version
localStorageProductsV4:"mprtcl-prodv4",// The name for mP localstorage that contains products for cartProducs and productBags
cookieNameV4:"mprtcl-v4",// v4 Name of the cookie stored on the user's machine. Base64 encoded keys in Base64CookieKeys object, current version on SDK v2
currentStorageName:"mprtcl-v4",currentStorageProductsName:"mprtcl-prodv4"},DefaultConfig:{cookieDomain:null,// If null, defaults to current location.host
cookieExpiration:365,// Cookie expiration time in days
logLevel:null,// What logging will be provided in the console
timeout:300,// timeout in milliseconds for logging functions
sessionTimeout:30,// Session timeout in minutes
maxProducts:20,// Number of products persisted in cartProducts and productBags
forwarderStatsTimeout:5e3,// Milliseconds for forwarderStats timeout
integrationDelayTimeout:5e3,// Milliseconds for forcing the integration delay to un-suspend event queueing due to integration partner errors
maxCookieSize:3e3,// Number of bytes for cookie size to not exceed
aliasMaxWindow:90,// Max age of Alias request startTime, in days
uploadInterval:0// Maximum milliseconds in between batch uploads, below 500 will mean immediate upload
},DefaultUrls:{v1SecureServiceUrl:"jssdks.mparticle.com/v1/JS/",v2SecureServiceUrl:"jssdks.mparticle.com/v2/JS/",v3SecureServiceUrl:"jssdks.mparticle.com/v3/JS/",configUrl:"jssdkcdns.mparticle.com/JS/v2/",identityUrl:"identity.mparticle.com/v1/",aliasUrl:"jssdks.mparticle.com/v1/identity/"},Base64CookieKeys:{csm:1,sa:1,ss:1,ua:1,ui:1,csd:1,ia:1,con:1},SDKv2NonMPIDCookieKeys:{gs:1,cu:1,l:1,globalSettings:1,currentUserMPID:1},HTTPCodes:{noHttpCoverage:-1,activeIdentityRequest:-2,activeSession:-3,validationIssue:-4,nativeIdentityRequest:-5,loggingDisabledOrMissingAPIKey:-6,tooManyRequests:429},FeatureFlags:{ReportBatching:"reportBatching",EventsV3:"eventsV3",EventBatchingIntervalMillis:"eventBatchingIntervalMillis"},DefaultInstance:"default_instance"};

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var _typeof_1 = createCommonjsModule(function (module) {
function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    module.exports = _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    module.exports = _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

module.exports = _typeof;
});

var setPrototypeOf = createCommonjsModule(function (module) {
function _setPrototypeOf(o, p) {
  module.exports = _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

module.exports = _setPrototypeOf;
});

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) setPrototypeOf(subClass, superClass);
}

var inherits = _inherits;

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

var assertThisInitialized = _assertThisInitialized;

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof_1(call) === "object" || typeof call === "function")) {
    return call;
  }

  return assertThisInitialized(self);
}

var possibleConstructorReturn = _possibleConstructorReturn;

var getPrototypeOf = createCommonjsModule(function (module) {
function _getPrototypeOf(o) {
  module.exports = _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

module.exports = _getPrototypeOf;
});

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }

  return arr2;
}

var arrayLikeToArray = _arrayLikeToArray;

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return arrayLikeToArray(arr);
}

var arrayWithoutHoles = _arrayWithoutHoles;

function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
}

var iterableToArray = _iterableToArray;

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return arrayLikeToArray(o, minLen);
}

var unsupportedIterableToArray = _unsupportedIterableToArray;

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

var nonIterableSpread = _nonIterableSpread;

function _toConsumableArray(arr) {
  return arrayWithoutHoles(arr) || iterableToArray(arr) || unsupportedIterableToArray(arr) || nonIterableSpread();
}

var toConsumableArray = _toConsumableArray;

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

var asyncToGenerator = _asyncToGenerator;

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var classCallCheck = _classCallCheck;

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

var createClass = _createClass;

var runtime_1 = createCommonjsModule(function (module) {
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined$1; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] =
    GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return PromiseImpl.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return PromiseImpl.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new PromiseImpl(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    if (PromiseImpl === void 0) PromiseImpl = Promise;

    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList),
      PromiseImpl
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined$1) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined$1;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined$1;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[toStringTagSymbol] = "Generator";

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined$1;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined$1, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined$1;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined$1;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined$1;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined$1;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined$1;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
   module.exports 
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  Function("r", "regeneratorRuntime = r")(runtime);
}
});

var regenerator = runtime_1;

var SDKProductActionType;
(function (a) { a[a.Unknown = 0] = "Unknown", a[a.AddToCart = 1] = "AddToCart", a[a.RemoveFromCart = 2] = "RemoveFromCart", a[a.Checkout = 3] = "Checkout", a[a.CheckoutOption = 4] = "CheckoutOption", a[a.Click = 5] = "Click", a[a.ViewDetail = 6] = "ViewDetail", a[a.Purchase = 7] = "Purchase", a[a.Refund = 8] = "Refund", a[a.AddToWishlist = 9] = "AddToWishlist", a[a.RemoveFromWishlist = 10] = "RemoveFromWishlist"; })(SDKProductActionType || (SDKProductActionType = {}));
var SDKIdentityTypeEnum;
(function (a) { a.other = "other", a.customerId = "customerid", a.facebook = "facebook", a.twitter = "twitter", a.google = "google", a.microsoft = "microsoft", a.yahoo = "yahoo", a.email = "email", a.alias = "alias", a.facebookCustomAudienceId = "facebookcustomaudienceid", a.otherId2 = "other2", a.otherId3 = "other3", a.otherId4 = "other4", a.otherId5 = "other5", a.otherId6 = "other6", a.otherId7 = "other7", a.otherId8 = "other8", a.otherId9 = "other9", a.otherId10 = "other10", a.mobileNumber = "mobile_number", a.phoneNumber2 = "phone_number_2", a.phoneNumber3 = "phone_number_3"; })(SDKIdentityTypeEnum || (SDKIdentityTypeEnum = {}));

var dist = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Enum for the os property.
 */
var ApplicationInformationOsEnum;
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
})(ApplicationInformationOsEnum = exports.ApplicationInformationOsEnum || (exports.ApplicationInformationOsEnum = {}));
/**
 * Enum for the event_type property.
 */
var ApplicationStateTransitionEventEventTypeEnum;
(function (ApplicationStateTransitionEventEventTypeEnum) {
    ApplicationStateTransitionEventEventTypeEnum["applicationStateTransition"] = "application_state_transition";
})(ApplicationStateTransitionEventEventTypeEnum = exports.ApplicationStateTransitionEventEventTypeEnum || (exports.ApplicationStateTransitionEventEventTypeEnum = {}));
/**
 * Enum for the application_transition_type property.
 */
var ApplicationStateTransitionEventDataApplicationTransitionTypeEnum;
(function (ApplicationStateTransitionEventDataApplicationTransitionTypeEnum) {
    ApplicationStateTransitionEventDataApplicationTransitionTypeEnum["applicationInitialized"] = "application_initialized";
    ApplicationStateTransitionEventDataApplicationTransitionTypeEnum["applicationExit"] = "application_exit";
    ApplicationStateTransitionEventDataApplicationTransitionTypeEnum["applicationBackground"] = "application_background";
    ApplicationStateTransitionEventDataApplicationTransitionTypeEnum["applicationForeground"] = "application_foreground";
})(ApplicationStateTransitionEventDataApplicationTransitionTypeEnum = exports.ApplicationStateTransitionEventDataApplicationTransitionTypeEnum || (exports.ApplicationStateTransitionEventDataApplicationTransitionTypeEnum = {}));
/**
 * Enum for the environment property.
 */
var BatchEnvironmentEnum;
(function (BatchEnvironmentEnum) {
    BatchEnvironmentEnum["unknown"] = "unknown";
    BatchEnvironmentEnum["development"] = "development";
    BatchEnvironmentEnum["production"] = "production";
})(BatchEnvironmentEnum = exports.BatchEnvironmentEnum || (exports.BatchEnvironmentEnum = {}));
/**
 * Enum for the event_type property.
 */
var BreadcrumbEventEventTypeEnum;
(function (BreadcrumbEventEventTypeEnum) {
    BreadcrumbEventEventTypeEnum["breadcrumb"] = "breadcrumb";
})(BreadcrumbEventEventTypeEnum = exports.BreadcrumbEventEventTypeEnum || (exports.BreadcrumbEventEventTypeEnum = {}));
/**
 * Enum for the event_type property.
 */
var CommerceEventEventTypeEnum;
(function (CommerceEventEventTypeEnum) {
    CommerceEventEventTypeEnum["commerceEvent"] = "commerce_event";
})(CommerceEventEventTypeEnum = exports.CommerceEventEventTypeEnum || (exports.CommerceEventEventTypeEnum = {}));
/**
 * Enum for the custom_event_type property.
 */
var CommerceEventDataCustomEventTypeEnum;
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
})(CommerceEventDataCustomEventTypeEnum = exports.CommerceEventDataCustomEventTypeEnum || (exports.CommerceEventDataCustomEventTypeEnum = {}));
/**
 * Enum for the event_type property.
 */
var CrashReportEventEventTypeEnum;
(function (CrashReportEventEventTypeEnum) {
    CrashReportEventEventTypeEnum["crashReport"] = "crash_report";
})(CrashReportEventEventTypeEnum = exports.CrashReportEventEventTypeEnum || (exports.CrashReportEventEventTypeEnum = {}));
/**
 * Enum for the event_type property.
 */
var CustomEventEventTypeEnum;
(function (CustomEventEventTypeEnum) {
    CustomEventEventTypeEnum["customEvent"] = "custom_event";
})(CustomEventEventTypeEnum = exports.CustomEventEventTypeEnum || (exports.CustomEventEventTypeEnum = {}));
/**
 * Enum for the custom_event_type property.
 */
var CustomEventDataCustomEventTypeEnum;
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
})(CustomEventDataCustomEventTypeEnum = exports.CustomEventDataCustomEventTypeEnum || (exports.CustomEventDataCustomEventTypeEnum = {}));
/**
 * Enum for the device_orientation property.
 */
var DeviceCurrentStateDeviceOrientationEnum;
(function (DeviceCurrentStateDeviceOrientationEnum) {
    DeviceCurrentStateDeviceOrientationEnum["portrait"] = "portrait";
    DeviceCurrentStateDeviceOrientationEnum["portraitUpsideDown"] = "portrait_upside_down";
    DeviceCurrentStateDeviceOrientationEnum["landscape"] = "landscape";
    DeviceCurrentStateDeviceOrientationEnum["landscapeLeft"] = "LandscapeLeft";
    DeviceCurrentStateDeviceOrientationEnum["landscapeRight"] = "LandscapeRight";
    DeviceCurrentStateDeviceOrientationEnum["faceUp"] = "FaceUp";
    DeviceCurrentStateDeviceOrientationEnum["faceDown"] = "FaceDown";
    DeviceCurrentStateDeviceOrientationEnum["square"] = "Square";
})(DeviceCurrentStateDeviceOrientationEnum = exports.DeviceCurrentStateDeviceOrientationEnum || (exports.DeviceCurrentStateDeviceOrientationEnum = {}));
/**
 * Enum for the status_bar_orientation property.
 */
var DeviceCurrentStateStatusBarOrientationEnum;
(function (DeviceCurrentStateStatusBarOrientationEnum) {
    DeviceCurrentStateStatusBarOrientationEnum["portrait"] = "portrait";
    DeviceCurrentStateStatusBarOrientationEnum["portraitUpsideDown"] = "portrait_upside_down";
    DeviceCurrentStateStatusBarOrientationEnum["landscape"] = "landscape";
    DeviceCurrentStateStatusBarOrientationEnum["landscapeLeft"] = "LandscapeLeft";
    DeviceCurrentStateStatusBarOrientationEnum["landscapeRight"] = "LandscapeRight";
    DeviceCurrentStateStatusBarOrientationEnum["faceUp"] = "FaceUp";
    DeviceCurrentStateStatusBarOrientationEnum["faceDown"] = "FaceDown";
    DeviceCurrentStateStatusBarOrientationEnum["square"] = "Square";
})(DeviceCurrentStateStatusBarOrientationEnum = exports.DeviceCurrentStateStatusBarOrientationEnum || (exports.DeviceCurrentStateStatusBarOrientationEnum = {}));
/**
 * Enum for the platform property.
 */
var DeviceInformationPlatformEnum;
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
})(DeviceInformationPlatformEnum = exports.DeviceInformationPlatformEnum || (exports.DeviceInformationPlatformEnum = {}));
var EventTypeEnum;
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
})(EventTypeEnum = exports.EventTypeEnum || (exports.EventTypeEnum = {}));
var IdentityTypeEnum;
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
})(IdentityTypeEnum = exports.IdentityTypeEnum || (exports.IdentityTypeEnum = {}));
/**
 * Enum for the event_type property.
 */
var NetworkPerformanceEventEventTypeEnum;
(function (NetworkPerformanceEventEventTypeEnum) {
    NetworkPerformanceEventEventTypeEnum["networkPerformance"] = "network_performance";
})(NetworkPerformanceEventEventTypeEnum = exports.NetworkPerformanceEventEventTypeEnum || (exports.NetworkPerformanceEventEventTypeEnum = {}));
/**
 * Enum for the event_type property.
 */
var OptOutEventEnum;
(function (OptOutEventEnum) {
    OptOutEventEnum["optOut"] = "opt_out";
})(OptOutEventEnum = exports.OptOutEventEnum || (exports.OptOutEventEnum = {}));
/**
 * Enum for the action property.
 */
var ProductActionActionEnum;
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
})(ProductActionActionEnum = exports.ProductActionActionEnum || (exports.ProductActionActionEnum = {}));
/**
 * Enum for the event_type property.
 */
var ProfileEventEventTypeEnum;
(function (ProfileEventEventTypeEnum) {
    ProfileEventEventTypeEnum["profile"] = "profile";
})(ProfileEventEventTypeEnum = exports.ProfileEventEventTypeEnum || (exports.ProfileEventEventTypeEnum = {}));
/**
 * Enum for the profile_event_type property.
 */
var ProfileEventDataProfileEventTypeEnum;
(function (ProfileEventDataProfileEventTypeEnum) {
    ProfileEventDataProfileEventTypeEnum["signup"] = "signup";
    ProfileEventDataProfileEventTypeEnum["login"] = "login";
    ProfileEventDataProfileEventTypeEnum["logout"] = "logout";
    ProfileEventDataProfileEventTypeEnum["update"] = "update";
    ProfileEventDataProfileEventTypeEnum["delete"] = "delete";
})(ProfileEventDataProfileEventTypeEnum = exports.ProfileEventDataProfileEventTypeEnum || (exports.ProfileEventDataProfileEventTypeEnum = {}));
/**
 * Enum for the action property.
 */
var PromotionActionActionEnum;
(function (PromotionActionActionEnum) {
    PromotionActionActionEnum["view"] = "view";
    PromotionActionActionEnum["click"] = "click";
})(PromotionActionActionEnum = exports.PromotionActionActionEnum || (exports.PromotionActionActionEnum = {}));
/**
 * Enum for the event_type property.
 */
var PushMessageEventEventTypeEnum;
(function (PushMessageEventEventTypeEnum) {
    PushMessageEventEventTypeEnum["pushMessage"] = "push_message";
})(PushMessageEventEventTypeEnum = exports.PushMessageEventEventTypeEnum || (exports.PushMessageEventEventTypeEnum = {}));
/**
 * Enum for the push_message_type property.
 */
var PushMessageEventDataPushMessageTypeEnum;
(function (PushMessageEventDataPushMessageTypeEnum) {
    PushMessageEventDataPushMessageTypeEnum["sent"] = "sent";
    PushMessageEventDataPushMessageTypeEnum["received"] = "received";
    PushMessageEventDataPushMessageTypeEnum["action"] = "action";
})(PushMessageEventDataPushMessageTypeEnum = exports.PushMessageEventDataPushMessageTypeEnum || (exports.PushMessageEventDataPushMessageTypeEnum = {}));
/**
 * Enum for the application_state property.
 */
var PushMessageEventDataApplicationStateEnum;
(function (PushMessageEventDataApplicationStateEnum) {
    PushMessageEventDataApplicationStateEnum["notRunning"] = "not_running";
    PushMessageEventDataApplicationStateEnum["background"] = "background";
    PushMessageEventDataApplicationStateEnum["foreground"] = "foreground";
})(PushMessageEventDataApplicationStateEnum = exports.PushMessageEventDataApplicationStateEnum || (exports.PushMessageEventDataApplicationStateEnum = {}));
/**
 * Enum for the push_message_behavior property.
 */
var PushMessageEventDataPushMessageBehaviorEnum;
(function (PushMessageEventDataPushMessageBehaviorEnum) {
    PushMessageEventDataPushMessageBehaviorEnum["received"] = "Received";
    PushMessageEventDataPushMessageBehaviorEnum["directOpen"] = "DirectOpen";
    PushMessageEventDataPushMessageBehaviorEnum["read"] = "Read";
    PushMessageEventDataPushMessageBehaviorEnum["influencedOpen"] = "InfluencedOpen";
    PushMessageEventDataPushMessageBehaviorEnum["displayed"] = "Displayed";
})(PushMessageEventDataPushMessageBehaviorEnum = exports.PushMessageEventDataPushMessageBehaviorEnum || (exports.PushMessageEventDataPushMessageBehaviorEnum = {}));
/**
 * Enum for the event_type property.
 */
var PushRegistrationEventEventTypeEnum;
(function (PushRegistrationEventEventTypeEnum) {
    PushRegistrationEventEventTypeEnum["pushRegistration"] = "push_registration";
})(PushRegistrationEventEventTypeEnum = exports.PushRegistrationEventEventTypeEnum || (exports.PushRegistrationEventEventTypeEnum = {}));
/**
 * Enum for the event_type property.
 */
var SessionEndEventEventTypeEnum;
(function (SessionEndEventEventTypeEnum) {
    SessionEndEventEventTypeEnum["sessionEnd"] = "session_end";
})(SessionEndEventEventTypeEnum = exports.SessionEndEventEventTypeEnum || (exports.SessionEndEventEventTypeEnum = {}));
/**
 * Enum for the event_type property.
 */
var SessionStartEventEventTypeEnum;
(function (SessionStartEventEventTypeEnum) {
    SessionStartEventEventTypeEnum["sessionStart"] = "session_start";
})(SessionStartEventEventTypeEnum = exports.SessionStartEventEventTypeEnum || (exports.SessionStartEventEventTypeEnum = {}));
/**
 * Enum for the channel property.
 */
var SourceInformationChannelEnum;
(function (SourceInformationChannelEnum) {
    SourceInformationChannelEnum["native"] = "native";
    SourceInformationChannelEnum["javascript"] = "javascript";
    SourceInformationChannelEnum["pixel"] = "pixel";
    SourceInformationChannelEnum["desktop"] = "desktop";
    SourceInformationChannelEnum["partner"] = "partner";
    SourceInformationChannelEnum["serverToServer"] = "server_to_server";
})(SourceInformationChannelEnum = exports.SourceInformationChannelEnum || (exports.SourceInformationChannelEnum = {}));
/**
 * Enum for the event_type property.
 */
var UserAttributeChangeEventEventTypeEnum;
(function (UserAttributeChangeEventEventTypeEnum) {
    UserAttributeChangeEventEventTypeEnum["userAttributeChange"] = "user_attribute_change";
})(UserAttributeChangeEventEventTypeEnum = exports.UserAttributeChangeEventEventTypeEnum || (exports.UserAttributeChangeEventEventTypeEnum = {}));
/**
 * Enum for the event_type property.
 */
var UserIdentityChangeEventEventTypeEnum;
(function (UserIdentityChangeEventEventTypeEnum) {
    UserIdentityChangeEventEventTypeEnum["userIdentityChange"] = "user_identity_change";
})(UserIdentityChangeEventEventTypeEnum = exports.UserIdentityChangeEventEventTypeEnum || (exports.UserIdentityChangeEventEventTypeEnum = {}));
});

unwrapExports(dist);
var dist_1 = dist.ApplicationInformationOsEnum;
var dist_2 = dist.ApplicationStateTransitionEventEventTypeEnum;
var dist_3 = dist.ApplicationStateTransitionEventDataApplicationTransitionTypeEnum;
var dist_4 = dist.BatchEnvironmentEnum;
var dist_5 = dist.BreadcrumbEventEventTypeEnum;
var dist_6 = dist.CommerceEventEventTypeEnum;
var dist_7 = dist.CommerceEventDataCustomEventTypeEnum;
var dist_8 = dist.CrashReportEventEventTypeEnum;
var dist_9 = dist.CustomEventEventTypeEnum;
var dist_10 = dist.CustomEventDataCustomEventTypeEnum;
var dist_11 = dist.DeviceCurrentStateDeviceOrientationEnum;
var dist_12 = dist.DeviceCurrentStateStatusBarOrientationEnum;
var dist_13 = dist.DeviceInformationPlatformEnum;
var dist_14 = dist.EventTypeEnum;
var dist_15 = dist.IdentityTypeEnum;
var dist_16 = dist.NetworkPerformanceEventEventTypeEnum;
var dist_17 = dist.OptOutEventEnum;
var dist_18 = dist.ProductActionActionEnum;
var dist_19 = dist.ProfileEventEventTypeEnum;
var dist_20 = dist.ProfileEventDataProfileEventTypeEnum;
var dist_21 = dist.PromotionActionActionEnum;
var dist_22 = dist.PushMessageEventEventTypeEnum;
var dist_23 = dist.PushMessageEventDataPushMessageTypeEnum;
var dist_24 = dist.PushMessageEventDataApplicationStateEnum;
var dist_25 = dist.PushMessageEventDataPushMessageBehaviorEnum;
var dist_26 = dist.PushRegistrationEventEventTypeEnum;
var dist_27 = dist.SessionEndEventEventTypeEnum;
var dist_28 = dist.SessionStartEventEventTypeEnum;
var dist_29 = dist.SourceInformationChannelEnum;
var dist_30 = dist.UserAttributeChangeEventEventTypeEnum;
var dist_31 = dist.UserIdentityChangeEventEventTypeEnum;

function ownKeys(a, b) { var c = Object.keys(a); if (Object.getOwnPropertySymbols) {
    var d = Object.getOwnPropertySymbols(a);
    b && (d = d.filter(function (b) { return Object.getOwnPropertyDescriptor(a, b).enumerable; })), c.push.apply(c, d);
} return c; }
function _objectSpread(a) { for (var b, c = 1; c < arguments.length; c++)
    b = null == arguments[c] ? {} : arguments[c], c % 2 ? ownKeys(Object(b), !0).forEach(function (c) { defineProperty(a, c, b[c]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(a, Object.getOwnPropertyDescriptors(b)) : ownKeys(Object(b)).forEach(function (c) { Object.defineProperty(a, c, Object.getOwnPropertyDescriptor(b, c)); }); return a; }
function _createForOfIteratorHelper(a, b) { var c = "undefined" != typeof Symbol && a[Symbol.iterator] || a["@@iterator"]; if (!c) {
    if (Array.isArray(a) || (c = _unsupportedIterableToArray$1(a)) || b && a && "number" == typeof a.length) {
        c && (a = c);
        var d = 0, e = function () { };
        return { s: e, n: function n() { return d >= a.length ? { done: !0 } : { done: !1, value: a[d++] }; }, e: function e(a) { throw a; }, f: e };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
} var f, g = !0, h = !1; return { s: function s() { c = c.call(a); }, n: function n() { var a = c.next(); return g = a.done, a; }, e: function e(a) { h = !0, f = a; }, f: function f() { try {
        g || null == c["return"] || c["return"]();
    }
    finally {
        if (h)
            throw f;
    } } }; }
function _unsupportedIterableToArray$1(a, b) { if (a) {
    if ("string" == typeof a)
        return _arrayLikeToArray$1(a, b);
    var c = Object.prototype.toString.call(a).slice(8, -1);
    return "Object" === c && a.constructor && (c = a.constructor.name), "Map" === c || "Set" === c ? Array.from(a) : "Arguments" === c || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(c) ? _arrayLikeToArray$1(a, b) : void 0;
} }
function _arrayLikeToArray$1(a, b) { (null == b || b > a.length) && (b = a.length); for (var c = 0, d = Array(b); c < b; c++)
    d[c] = a[c]; return d; }
function convertEvents(a, b, c) { if (!a)
    return null; if (!b || 1 > b.length)
    return null; var d, e = [], f = null, g = _createForOfIteratorHelper(b); try {
    for (g.s(); !(d = g.n()).done;) {
        var i = d.value;
        if (i) {
            f = i;
            var j = convertEvent(i);
            j && e.push(j);
        }
    }
}
catch (a) {
    g.e(a);
}
finally {
    g.f();
} if (!f)
    return null; var h = { source_request_id: c._Helpers.generateUniqueId(), mpid: a, timestamp_unixtime_ms: new Date().getTime(), environment: f.Debug ? dist_4.development : dist_4.production, events: e, mp_deviceid: f.DeviceId, sdk_version: f.SDKVersion, application_info: { application_version: f.AppVersion, application_name: f.AppName }, device_info: { platform: dist_13.web, screen_width: window.screen.width, screen_height: window.screen.height }, user_attributes: f.UserAttributes, user_identities: convertUserIdentities(f.UserIdentities), consent_state: convertConsentState(f.ConsentState), integration_attributes: f.IntegrationAttributes }; return f.DataPlan && f.DataPlan.PlanId && (h.context = { data_plan: { plan_id: f.DataPlan.PlanId, plan_version: f.DataPlan.PlanVersion || void 0 } }), h; }
function convertConsentState(a) { if (!a)
    return null; var b = { gdpr: convertGdprConsentState(a.getGDPRConsentState()), ccpa: convertCcpaConsentState(a.getCCPAConsentState()) }; return b; }
function convertGdprConsentState(a) { if (!a)
    return null; var b = {}; for (var c in a)
    a.hasOwnProperty(c) && (b[c] = { consented: a[c].Consented, hardware_id: a[c].HardwareId, document: a[c].ConsentDocument, timestamp_unixtime_ms: a[c].Timestamp, location: a[c].Location }); return b; }
function convertCcpaConsentState(a) { if (!a)
    return null; var b = { data_sale_opt_out: { consented: a.Consented, hardware_id: a.HardwareId, document: a.ConsentDocument, timestamp_unixtime_ms: a.Timestamp, location: a.Location } }; return b; }
function convertUserIdentities(a) { if (!a || !a.length)
    return null; var b, c = {}, d = _createForOfIteratorHelper(a); try {
    for (d.s(); !(b = d.n()).done;) {
        var e = b.value;
        switch (e.Type) {
            case Types.IdentityType.CustomerId:
                c.customer_id = e.Identity;
                break;
            case Types.IdentityType.Email:
                c.email = e.Identity;
                break;
            case Types.IdentityType.Facebook:
                c.facebook = e.Identity;
                break;
            case Types.IdentityType.FacebookCustomAudienceId:
                c.facebook_custom_audience_id = e.Identity;
                break;
            case Types.IdentityType.Google:
                c.google = e.Identity;
                break;
            case Types.IdentityType.Microsoft:
                c.microsoft = e.Identity;
                break;
            case Types.IdentityType.Other:
                c.other = e.Identity;
                break;
            case Types.IdentityType.Other2:
                c.other_id_2 = e.Identity;
                break;
            case Types.IdentityType.Other3:
                c.other_id_3 = e.Identity;
                break;
            case Types.IdentityType.Other4:
                c.other_id_4 = e.Identity;
                break;
            case Types.IdentityType.Other5:
                c.other_id_5 = e.Identity;
                break;
            case Types.IdentityType.Other6:
                c.other_id_6 = e.Identity;
                break;
            case Types.IdentityType.Other7:
                c.other_id_7 = e.Identity;
                break;
            case Types.IdentityType.Other8:
                c.other_id_8 = e.Identity;
                break;
            case Types.IdentityType.Other9:
                c.other_id_9 = e.Identity;
                break;
            case Types.IdentityType.Other10:
                c.other_id_10 = e.Identity;
                break;
            case Types.IdentityType.MobileNumber:
                c.mobile_number = e.Identity;
                break;
            case Types.IdentityType.PhoneNumber2:
                c.phone_number_2 = e.Identity;
                break;
            case Types.IdentityType.PhoneNumber3:
                c.phone_number_3 = e.Identity;
                break;
            default:
        }
    }
}
catch (a) {
    d.e(a);
}
finally {
    d.f();
} return c; }
function convertEvent(a) {
    if (!a)
        return null;
    switch (a.EventDataType) {
        case Types.MessageType.AppStateTransition: return convertAST(a);
        case Types.MessageType.Commerce: return convertCommerceEvent(a);
        case Types.MessageType.CrashReport: return convertCrashReportEvent(a);
        case Types.MessageType.OptOut: return convertOptOutEvent(a);
        case Types.MessageType.PageEvent: // Note: Media Events are also sent as PageEvents/CustomEvents
            return convertCustomEvent(a);
        case Types.MessageType.PageView: return convertPageViewEvent(a);
        case Types.MessageType.Profile: //deprecated and not supported by the web SDK
            return null;
        case Types.MessageType.SessionEnd: return convertSessionEndEvent(a);
        case Types.MessageType.SessionStart: return convertSessionStartEvent(a);
        case Types.MessageType.UserAttributeChange: return convertUserAttributeChangeEvent(a);
        case Types.MessageType.UserIdentityChange: return convertUserIdentityChangeEvent(a);
    }
    return null;
}
function convertProductActionType(a) { if (!a)
    return dist_18.unknown; return a === SDKProductActionType.AddToCart ? dist_18.addToCart : a === SDKProductActionType.AddToWishlist ? dist_18.addToWishlist : a === SDKProductActionType.Checkout ? dist_18.checkout : a === SDKProductActionType.CheckoutOption ? dist_18.checkoutOption : a === SDKProductActionType.Click ? dist_18.click : a === SDKProductActionType.Purchase ? dist_18.purchase : a === SDKProductActionType.Refund ? dist_18.refund : a === SDKProductActionType.RemoveFromCart ? dist_18.removeFromCart : a === SDKProductActionType.RemoveFromWishlist ? dist_18.removeFromWishlist : a === SDKProductActionType.ViewDetail ? dist_18.viewDetail : dist_18.unknown; }
function convertProductAction(a) { if (!a.ProductAction)
    return null; var b = { action: convertProductActionType(a.ProductAction.ProductActionType), checkout_step: a.ProductAction.CheckoutStep, checkout_options: a.ProductAction.CheckoutOptions, transaction_id: a.ProductAction.TransactionId, affiliation: a.ProductAction.Affiliation, total_amount: a.ProductAction.TotalAmount, tax_amount: a.ProductAction.TaxAmount, shipping_amount: a.ProductAction.ShippingAmount, coupon_code: a.ProductAction.CouponCode, products: convertProducts(a.ProductAction.ProductList) }; return b; }
function convertProducts(a) { if (!a || !a.length)
    return null; var b, c = [], d = _createForOfIteratorHelper(a); try {
    for (d.s(); !(b = d.n()).done;) {
        var e = b.value, f = { id: e.Sku, name: e.Name, brand: e.Brand, category: e.Category, variant: e.Variant, total_product_amount: e.TotalAmount, position: e.Position, price: e.Price, quantity: e.Quantity, coupon_code: e.CouponCode, custom_attributes: e.Attributes };
        c.push(f);
    }
}
catch (a) {
    d.e(a);
}
finally {
    d.f();
} return c; }
function convertPromotionAction(a) { if (!a.PromotionAction)
    return null; var b = { action: a.PromotionAction.PromotionActionType, promotions: convertPromotions(a.PromotionAction.PromotionList) }; return b; }
function convertPromotions(a) { if (!a || !a.length)
    return null; var b, c = [], d = _createForOfIteratorHelper(a); try {
    for (d.s(); !(b = d.n()).done;) {
        var e = b.value, f = { id: e.Id, name: e.Name, creative: e.Creative, position: e.Position };
        c.push(f);
    }
}
catch (a) {
    d.e(a);
}
finally {
    d.f();
} return c; }
function convertImpressions(a) { if (!a.ProductImpressions)
    return null; var b, c = [], d = _createForOfIteratorHelper(a.ProductImpressions); try {
    for (d.s(); !(b = d.n()).done;) {
        var e = b.value, f = { product_impression_list: e.ProductImpressionList, products: convertProducts(e.ProductList) };
        c.push(f);
    }
}
catch (a) {
    d.e(a);
}
finally {
    d.f();
} return c; }
function convertShoppingCart(a) { if (!a.ShoppingCart || !a.ShoppingCart.ProductList || !a.ShoppingCart.ProductList.length)
    return null; var b = { products: convertProducts(a.ShoppingCart.ProductList) }; return b; }
function convertCommerceEvent(a) { var b = convertBaseEventData(a), c = { custom_flags: a.CustomFlags, product_action: convertProductAction(a), promotion_action: convertPromotionAction(a), product_impressions: convertImpressions(a), shopping_cart: convertShoppingCart(a), currency_code: a.CurrencyCode }; return c = Object.assign(c, b), { event_type: dist_14.commerceEvent, data: c }; }
function convertCrashReportEvent(a) { var b = convertBaseEventData(a), c = { message: a.EventName }; return c = Object.assign(c, b), { event_type: dist_14.crashReport, data: c }; }
function convertAST(a) { var b = convertBaseEventData(a), c = { application_transition_type: dist_3.applicationInitialized, is_first_run: a.IsFirstRun, is_upgrade: !1 }; return c = Object.assign(c, b), { event_type: dist_14.applicationStateTransition, data: c }; }
function convertSessionEndEvent(a) {
    var b = convertBaseEventData(a), c = { session_duration_ms: a.SessionLength //note: External Events DTO does not support the session mpids array as of this time.
        //spanning_mpids: sdkEvent.SessionMpids
    };
    return c = Object.assign(c, b), { event_type: dist_14.sessionEnd, data: c };
}
function convertSessionStartEvent(a) { var b = convertBaseEventData(a), c = {}; return c = Object.assign(c, b), { event_type: dist_14.sessionStart, data: c }; }
function convertPageViewEvent(a) { var b = convertBaseEventData(a), c = { custom_flags: a.CustomFlags, screen_name: a.EventName }; return c = Object.assign(c, b), { event_type: dist_14.screenView, data: c }; }
function convertOptOutEvent(a) { var b = convertBaseEventData(a), c = { is_opted_out: a.OptOut }; return c = Object.assign(c, b), { event_type: dist_14.optOut, data: c }; }
function convertCustomEvent(a) { var b = convertBaseEventData(a), c = { custom_event_type: convertSdkEventType(a.EventCategory), custom_flags: a.CustomFlags, event_name: a.EventName }; return c = Object.assign(c, b), { event_type: dist_14.customEvent, data: c }; }
function convertSdkEventType(a) { return a === Types.EventType.Other ? dist_10.other : a === Types.EventType.Location ? dist_10.location : a === Types.EventType.Navigation ? dist_10.navigation : a === Types.EventType.Search ? dist_10.search : a === Types.EventType.Social ? dist_10.social : a === Types.EventType.Transaction ? dist_10.transaction : a === Types.EventType.UserContent ? dist_10.userContent : a === Types.EventType.UserPreference ? dist_10.userPreference : a === Types.EventType.Media ? dist_10.media : a === Types.CommerceEventType.ProductAddToCart ? dist_7.addToCart : a === Types.CommerceEventType.ProductAddToWishlist ? dist_7.addToWishlist : a === Types.CommerceEventType.ProductCheckout ? dist_7.checkout : a === Types.CommerceEventType.ProductCheckoutOption ? dist_7.checkoutOption : a === Types.CommerceEventType.ProductClick ? dist_7.click : a === Types.CommerceEventType.ProductImpression ? dist_7.impression : a === Types.CommerceEventType.ProductPurchase ? dist_7.purchase : a === Types.CommerceEventType.ProductRefund ? dist_7.refund : a === Types.CommerceEventType.ProductRemoveFromCart ? dist_7.removeFromCart : a === Types.CommerceEventType.ProductRemoveFromWishlist ? dist_7.removeFromWishlist : a === Types.CommerceEventType.ProductViewDetail ? dist_7.viewDetail : a === Types.CommerceEventType.PromotionClick ? dist_7.promotionClick : a === Types.CommerceEventType.PromotionView ? dist_7.promotionView : dist_10.unknown; }
function convertBaseEventData(a) { var b = { timestamp_unixtime_ms: a.Timestamp, session_uuid: a.SessionId, session_start_unixtime_ms: a.SessionStartDate, custom_attributes: a.EventAttributes, location: convertSDKLocation(a.Location), source_message_id: a.SourceMessageId }; return b; }
function convertSDKLocation(a) { return a && Object.keys(a).length ? { latitude: a.lat, longitude: a.lng } : null; }
function convertUserAttributeChangeEvent(a) { var b = convertBaseEventData(a), c = { user_attribute_name: a.UserAttributeChanges.UserAttributeName, new: a.UserAttributeChanges.New, old: a.UserAttributeChanges.Old, deleted: a.UserAttributeChanges.Deleted, is_new_attribute: a.UserAttributeChanges.IsNewAttribute }; return c = _objectSpread(_objectSpread({}, c), b), { event_type: dist_14.userAttributeChange, data: c }; }
function convertUserIdentityChangeEvent(a) { var b = convertBaseEventData(a), c = { new: { identity_type: convertUserIdentityTypeToServerIdentityType(a.UserIdentityChanges.New.IdentityType), identity: a.UserIdentityChanges.New.Identity || null, timestamp_unixtime_ms: a.Timestamp, created_this_batch: a.UserIdentityChanges.New.CreatedThisBatch }, old: { identity_type: convertUserIdentityTypeToServerIdentityType(a.UserIdentityChanges.Old.IdentityType), identity: a.UserIdentityChanges.Old.Identity || null, timestamp_unixtime_ms: a.Timestamp, created_this_batch: a.UserIdentityChanges.Old.CreatedThisBatch } }; return c = Object.assign(c, b), { event_type: dist_14.userIdentityChange, data: c }; }
function convertUserIdentityTypeToServerIdentityType(a) { return a === SDKIdentityTypeEnum.other ? dist_15.other : a === SDKIdentityTypeEnum.customerId ? dist_15.customerId : a === SDKIdentityTypeEnum.facebook ? dist_15.facebook : a === SDKIdentityTypeEnum.twitter ? dist_15.twitter : a === SDKIdentityTypeEnum.google ? dist_15.google : a === SDKIdentityTypeEnum.microsoft ? dist_15.microsoft : a === SDKIdentityTypeEnum.yahoo ? dist_15.yahoo : a === SDKIdentityTypeEnum.email ? dist_15.email : a === SDKIdentityTypeEnum.alias ? dist_15.alias : a === SDKIdentityTypeEnum.facebookCustomAudienceId ? dist_15.facebookCustomAudienceId : a === SDKIdentityTypeEnum.otherId2 ? dist_15.otherId2 : a === SDKIdentityTypeEnum.otherId3 ? dist_15.otherId3 : a === SDKIdentityTypeEnum.otherId4 ? dist_15.otherId4 : a === SDKIdentityTypeEnum.otherId5 ? dist_15.otherId5 : a === SDKIdentityTypeEnum.otherId6 ? dist_15.otherId6 : a === SDKIdentityTypeEnum.otherId7 ? dist_15.otherId7 : a === SDKIdentityTypeEnum.otherId8 ? dist_15.otherId8 : a === SDKIdentityTypeEnum.otherId9 ? dist_15.otherId9 : a === SDKIdentityTypeEnum.otherId10 ? dist_15.otherId10 : a === SDKIdentityTypeEnum.mobileNumber ? dist_15.mobileNumber : a === SDKIdentityTypeEnum.phoneNumber2 ? dist_15.phoneNumber2 : a === SDKIdentityTypeEnum.phoneNumber3 ? dist_15.phoneNumber3 : void 0; }

function _createSuper(a) { var b = _isNativeReflectConstruct(); return function () { var c, d = getPrototypeOf(a); if (b) {
    var e = getPrototypeOf(this).constructor;
    c = Reflect.construct(d, arguments, e);
}
else
    c = d.apply(this, arguments); return possibleConstructorReturn(this, c); }; }
function _isNativeReflectConstruct() { if ("undefined" == typeof Reflect || !Reflect.construct)
    return !1; if (Reflect.construct.sham)
    return !1; if ("function" == typeof Proxy)
    return !0; try {
    return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () { })), !0;
}
catch (a) {
    return !1;
} }
function _createForOfIteratorHelper$1(a, b) { var c = "undefined" != typeof Symbol && a[Symbol.iterator] || a["@@iterator"]; if (!c) {
    if (Array.isArray(a) || (c = _unsupportedIterableToArray$2(a)) || b && a && "number" == typeof a.length) {
        c && (a = c);
        var d = 0, e = function () { };
        return { s: e, n: function n() { return d >= a.length ? { done: !0 } : { done: !1, value: a[d++] }; }, e: function e(a) { throw a; }, f: e };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
} var f, g = !0, h = !1; return { s: function s() { c = c.call(a); }, n: function n() { var a = c.next(); return g = a.done, a; }, e: function e(a) { h = !0, f = a; }, f: function f() { try {
        g || null == c["return"] || c["return"]();
    }
    finally {
        if (h)
            throw f;
    } } }; }
function _unsupportedIterableToArray$2(a, b) { if (a) {
    if ("string" == typeof a)
        return _arrayLikeToArray$2(a, b);
    var c = Object.prototype.toString.call(a).slice(8, -1);
    return "Object" === c && a.constructor && (c = a.constructor.name), "Map" === c || "Set" === c ? Array.from(a) : "Arguments" === c || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(c) ? _arrayLikeToArray$2(a, b) : void 0;
} }
function _arrayLikeToArray$2(a, b) { (null == b || b > a.length) && (b = a.length); for (var c = 0, d = Array(b); c < b; c++)
    d[c] = a[c]; return d; }
var BatchUploader = /*#__PURE__*/ function () {
    function a(b, c) { var d = this; classCallCheck(this, a), defineProperty(this, "uploadIntervalMillis", void 0), defineProperty(this, "pendingEvents", void 0), defineProperty(this, "pendingUploads", void 0), defineProperty(this, "mpInstance", void 0), defineProperty(this, "uploadUrl", void 0), defineProperty(this, "batchingEnabled", void 0), this.mpInstance = b, this.uploadIntervalMillis = c, this.batchingEnabled = c >= a.MINIMUM_INTERVAL_MILLIS, this.uploadIntervalMillis < a.MINIMUM_INTERVAL_MILLIS && (this.uploadIntervalMillis = a.MINIMUM_INTERVAL_MILLIS), this.pendingEvents = [], this.pendingUploads = []; var e = this.mpInstance._Store, f = e.SDKConfig, g = e.devToken, h = this.mpInstance._Helpers.createServiceUrl(f.v3SecureServiceUrl, g); this.uploadUrl = "".concat(h, "/events"), setTimeout(function () { d.prepareAndUpload(!0, !1); }, this.uploadIntervalMillis), this.addEventListeners(); }
    return createClass(a, [{ key: "addEventListeners", value: function addEventListeners() { var a = this; document.addEventListener("visibilitychange", function () { a.prepareAndUpload(!1, a.isBeaconAvailable()); }), window.addEventListener("beforeunload", function () { a.prepareAndUpload(!1, a.isBeaconAvailable()); }), window.addEventListener("pagehide", function () { a.prepareAndUpload(!1, a.isBeaconAvailable()); }); } }, { key: "isBeaconAvailable", value: function isBeaconAvailable() { return !!navigator.sendBeacon; } }, { key: "queueEvent", value: function queueEvent(a) { a && (this.pendingEvents.push(a), this.mpInstance.Logger.verbose("Queuing event: ".concat(JSON.stringify(a))), this.mpInstance.Logger.verbose("Queued event count: ".concat(this.pendingEvents.length)), (!this.batchingEnabled || Types.TriggerUploadType[a.EventDataType]) && this.prepareAndUpload(!1, !1)); } /**
                 * This implements crucial logic to:
                 * - bucket pending events by MPID, and then by Session, and upload individual batches for each bucket.
                 *
                 * In the future this should enforce other requirements such as maximum batch size.
                 *
                 * @param sdkEvents current pending events
                 * @param defaultUser the user to reference for events that are missing data
                 */
        }, { key: "prepareAndUpload", value: /**
            * This is the main loop function:
            *  - take all pending events and turn them into batches
            *  - attempt to upload each batch
            *
            * @param triggerFuture whether to trigger the loop again - for manual/forced uploads this should be false
            * @param useBeacon whether to use the beacon API - used when the page is being unloaded
            */ function () { var b = asyncToGenerator(/*#__PURE__*/ regenerator.mark(function b(c, d) { var e, f, g, h, i, j, k, l = this; return regenerator.wrap(function (b) { for (;;)
                switch (b.prev = b.next) {
                    case 0: return e = this.mpInstance.Identity.getCurrentUser(), f = this.pendingEvents, this.pendingEvents = [], g = a.createNewUploads(f, e, this.mpInstance), g && g.length && (h = this.pendingUploads).push.apply(h, toConsumableArray(g)), i = this.pendingUploads, this.pendingUploads = [], b.next = 9, this.upload(this.mpInstance.Logger, i, d);
                    case 9: j = b.sent, j && j.length && (k = this.pendingUploads).unshift.apply(k, toConsumableArray(j)), c && setTimeout(function () { l.prepareAndUpload(!0, !1); }, this.uploadIntervalMillis);
                    case 12:
                    case "end": return b.stop();
                } }, b, this); })); return function prepareAndUpload() { return b.apply(this, arguments); }; }() }, { key: "upload", value: function () { var b = asyncToGenerator(/*#__PURE__*/ regenerator.mark(function b(c, d, e) { var f, g, h, j, k; return regenerator.wrap(function (b) { for (;;)
                switch (b.prev = b.next) {
                    case 0:
                        if (d && !(1 > d.length)) {
                            b.next = 2;
                            break;
                        }
                        return b.abrupt("return", null);
                    case 2: c.verbose("Uploading batches: ".concat(JSON.stringify(d))), c.verbose("Batch count: ".concat(d.length)), g = 0;
                    case 5:
                        if (!(g < d.length)) {
                            b.next = 38;
                            break;
                        }
                        if (h = { method: "POST", headers: { Accept: a.CONTENT_TYPE, "Content-Type": "text/plain;charset=UTF-8" }, body: JSON.stringify(d[g]) }, !(e && this.isBeaconAvailable())) {
                            b.next = 12;
                            break;
                        }
                        j = new Blob([h.body], { type: "text/plain;charset=UTF-8" }), navigator.sendBeacon(this.uploadUrl, j), b.next = 35;
                        break;
                    case 12: return f || (window.fetch ? f = new FetchUploader(this.uploadUrl, c) : f = new XHRUploader(this.uploadUrl, c)), b.prev = 13, b.next = 16, f.upload(h, d, g);
                    case 16:
                        if (k = b.sent, !(200 <= k.status && 300 > k.status)) {
                            b.next = 21;
                            break;
                        }
                        c.verbose("Upload success for request ID: ".concat(d[g].source_request_id)), b.next = 29;
                        break;
                    case 21:
                        if (!(500 <= k.status || 429 === k.status)) {
                            b.next = 26;
                            break;
                        }
                        return c.error("HTTP error status ".concat(k.status, " received")), b.abrupt("return", d.slice(g, d.length));
                    case 26:
                        if (!(401 <= k.status)) {
                            b.next = 29;
                            break;
                        }
                        return c.error("HTTP error status ".concat(k.status, " while uploading - please verify your API key.")), b.abrupt("return", null);
                    case 29:
                        b.next = 35;
                        break;
                    case 31: return b.prev = 31, b.t0 = b["catch"](13), c.error("Error sending event to mParticle servers. ".concat(b.t0)), b.abrupt("return", d.slice(g, d.length));
                    case 35:
                        g++, b.next = 5;
                        break;
                    case 38: return b.abrupt("return", null);
                    case 39:
                    case "end": return b.stop();
                } }, b, this, [[13, 31]]); })); return function upload() { return b.apply(this, arguments); }; }() }], [{ key: "createNewUploads", value: function createNewUploads(a, b, c) {
                if (!b || !a || !a.length)
                    return null; //bucket by MPID, and then by session, ordered by timestamp
                var d, e = [], f = new Map, g = _createForOfIteratorHelper$1(a);
                try {
                    for (g.s(); !(d = g.n()).done;) {
                        var v = d.value; //on initial startup, there may be events logged without an mpid.
                        if (!v.MPID) {
                            var w = b.getMPID();
                            v.MPID = w;
                        }
                        var x = f.get(v.MPID);
                        x || (x = []), x.push(v), f.set(v.MPID, x);
                    }
                }
                catch (a) {
                    g.e(a);
                }
                finally {
                    g.f();
                }
                for (var h = 0, i = Array.from(f.entries()); h < i.length; h++) {
                    var j, k = i[h], l = k[0], m = k[1], n = new Map, o = _createForOfIteratorHelper$1(m);
                    try {
                        for (o.s(); !(j = o.n()).done;) {
                            var p = j.value, q = n.get(p.SessionId);
                            q || (q = []), q.push(p), n.set(p.SessionId, q);
                        }
                    }
                    catch (a) {
                        o.e(a);
                    }
                    finally {
                        o.f();
                    }
                    for (var r = 0, s = Array.from(n.entries()); r < s.length; r++) {
                        var t = s[r], u = convertEvents(l, t[1], c);
                        u && e.push(u);
                    }
                }
                return e;
            } }]), a;
}();
defineProperty(BatchUploader, "CONTENT_TYPE", "text/plain;charset=UTF-8"), defineProperty(BatchUploader, "MINIMUM_INTERVAL_MILLIS", 500);
var AsyncUploader = function a(b, c) { classCallCheck(this, a), defineProperty(this, "url", void 0), defineProperty(this, "logger", void 0), this.url = b, this.logger = c; }, FetchUploader = /*#__PURE__*/ function (a) { function b() { return classCallCheck(this, b), c.apply(this, arguments); } inherits(b, a); var c = _createSuper(b); return createClass(b, [{ key: "upload", value: function () { var a = asyncToGenerator(/*#__PURE__*/ regenerator.mark(function a(b) { var c; return regenerator.wrap(function (a) { for (;;)
            switch (a.prev = a.next) {
                case 0: return a.next = 2, fetch(this.url, b);
                case 2: return c = a.sent, a.abrupt("return", c);
                case 4:
                case "end": return a.stop();
            } }, a, this); })); return function upload() { return a.apply(this, arguments); }; }() }]), b; }(AsyncUploader), XHRUploader = /*#__PURE__*/ function (a) { function b() { return classCallCheck(this, b), c.apply(this, arguments); } inherits(b, a); var c = _createSuper(b); return createClass(b, [{ key: "upload", value: function () { var a = asyncToGenerator(/*#__PURE__*/ regenerator.mark(function a(b) { var c; return regenerator.wrap(function (a) { for (;;)
            switch (a.prev = a.next) {
                case 0: return a.next = 2, this.makeRequest(this.url, this.logger, b.body);
                case 2: return c = a.sent, a.abrupt("return", c);
                case 4:
                case "end": return a.stop();
            } }, a, this); })); return function upload() { return a.apply(this, arguments); }; }() }, { key: "makeRequest", value: function () { var a = asyncToGenerator(/*#__PURE__*/ regenerator.mark(function a(b, c, d) { var e; return regenerator.wrap(function (a) { for (;;)
            switch (a.prev = a.next) {
                case 0: return e = new XMLHttpRequest, a.abrupt("return", new Promise(function (a, c) { e.onreadystatechange = function () { 4 !== e.readyState || (200 <= e.status && 300 > e.status ? a(e) : c(e)); }, e.open("post", b), e.send(d); }));
                case 2:
                case "end": return a.stop();
            } }, a); })); return function makeRequest() { return a.apply(this, arguments); }; }() }]), b; }(AsyncUploader);

var Messages=Constants.Messages;function APIClient(a,b){this.uploader=null;var c=this;this.queueEventForBatchUpload=function(b){if(!this.uploader){var c=a._Helpers.getFeatureFlag(Constants.FeatureFlags.EventBatchingIntervalMillis);this.uploader=new BatchUploader(a,c);}this.uploader.queueEvent(b);},this.shouldEnableBatching=function(){// Returns a string of a number that must be parsed
// Invalid strings will be parsed to NaN which is falsey
var b=parseInt(a._Helpers.getFeatureFlag(Constants.FeatureFlags.EventsV3),10);if(!b)return !1;var c=a._Helpers.getRampNumber(a._Store.deviceId);return b>=c},this.processQueuedEvents=function(){var b,d=a.Identity.getCurrentUser();if(d&&(b=d.getMPID()),a._Store.eventQueue.length&&b){var e=a._Store.eventQueue;a._Store.eventQueue=[],this.appendUserInfoToEvents(d,e),e.forEach(function(a){c.sendEventToServer(a);});}},this.appendUserInfoToEvents=function(b,c){c.forEach(function(c){c.MPID||a._ServerModel.appendUserInfo(b,c);});},this.sendEventToServer=function(c,d){var e=a._Helpers.extend({shouldUploadEvent:!0},d);if(a._Store.webviewBridgeEnabled)return void a._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.LogEvent,JSON.stringify(c));var f,g=a.Identity.getCurrentUser();// We queue events if there is no MPID (MPID is null, or === 0), or there are integrations that that require this to stall because integration attributes
// need to be set, or if we are still fetching the config (self hosted only), and so require delaying events
return g&&(f=g.getMPID()),a._Store.requireDelay=a._Helpers.isDelayedByIntegration(a._preInit.integrationDelays,a._Store.integrationDelayTimeoutStart,Date.now()),f&&!a._Store.requireDelay&&a._Store.configurationLoaded?void(this.processQueuedEvents(),c&&e.shouldUploadEvent&&(this.shouldEnableBatching()?this.queueEventForBatchUpload(c):this.sendSingleEventToServer(c)),c&&c.EventName!==Types.MessageType.AppStateTransition&&(b&&b.kitBlockingEnabled&&(c=b.createBlockedEvent(c)),c&&a._Forwarders.sendEventToForwarders(c))):(a.Logger.verbose("Event was added to eventQueue. eventQueue will be processed once a valid MPID is returned or there is no more integration imposed delay."),void a._Store.eventQueue.push(c))},this.sendSingleEventToServer=function(b){if(b.EventDataType!==Types.MessageType.Media){var c,d=function(){4===c.readyState&&(a.Logger.verbose("Received "+c.statusText+" from server"),a._Persistence.update());};if(!b)return void a.Logger.error(Messages.ErrorMessages.EventEmpty);if(a.Logger.verbose(Messages.InformationMessages.SendHttp),c=a._Helpers.createXHR(d),c)try{c.open("post",a._Helpers.createServiceUrl(a._Store.SDKConfig.v2SecureServiceUrl,a._Store.devToken)+"/Events"),c.send(JSON.stringify(a._ServerModel.convertEventToDTO(b)));}catch(b){a.Logger.error("Error sending event to mParticle servers. "+b);}}},this.sendBatchForwardingStatsToServer=function(b,c){var d,e;try{d=a._Helpers.createServiceUrl(a._Store.SDKConfig.v2SecureServiceUrl,a._Store.devToken),e={uuid:a._Helpers.generateUniqueId(),data:b},c&&(c.open("post",d+"/Forwarding"),c.send(JSON.stringify(e)));}catch(b){a.Logger.error("Error sending forwarding stats to mParticle servers.");}},this.sendSingleForwardingStatsToServer=function(b){var c,d;try{var e=function(){4===f.readyState&&202===f.status&&a.Logger.verbose("Successfully sent  "+f.statusText+" from server");},f=a._Helpers.createXHR(e);c=a._Helpers.createServiceUrl(a._Store.SDKConfig.v1SecureServiceUrl,a._Store.devToken),d=b,f&&(f.open("post",c+"/Forwarding"),f.send(JSON.stringify(d)));}catch(b){a.Logger.error("Error sending forwarding stats to mParticle servers.");}},this.prepareForwardingStats=function(b,d){var e,f=a._Forwarders.getForwarderStatsQueue();b&&b.isVisible&&(e={mid:b.id,esid:b.eventSubscriptionId,n:d.EventName,attrs:d.EventAttributes,sdk:d.SDKVersion,dt:d.EventDataType,et:d.EventCategory,dbg:d.Debug,ct:d.Timestamp,eec:d.ExpandedEventCount,dp:d.DataPlan},a._Helpers.getFeatureFlag(Constants.FeatureFlags.ReportBatching)?(f.push(e),a._Forwarders.setForwarderStatsQueue(f)):c.sendSingleForwardingStatsToServer(e));};}

var slugify = createCommonjsModule(function (module, exports) {
(function (name, root, factory) {
  {
    module.exports = factory();
    module.exports['default'] = factory();
  }
}('slugify', commonjsGlobal, function () {
  var charMap = JSON.parse('{"$":"dollar","%":"percent","&":"and","<":"less",">":"greater","|":"or","¢":"cent","£":"pound","¤":"currency","¥":"yen","©":"(c)","ª":"a","®":"(r)","º":"o","À":"A","Á":"A","Â":"A","Ã":"A","Ä":"A","Å":"A","Æ":"AE","Ç":"C","È":"E","É":"E","Ê":"E","Ë":"E","Ì":"I","Í":"I","Î":"I","Ï":"I","Ð":"D","Ñ":"N","Ò":"O","Ó":"O","Ô":"O","Õ":"O","Ö":"O","Ø":"O","Ù":"U","Ú":"U","Û":"U","Ü":"U","Ý":"Y","Þ":"TH","ß":"ss","à":"a","á":"a","â":"a","ã":"a","ä":"a","å":"a","æ":"ae","ç":"c","è":"e","é":"e","ê":"e","ë":"e","ì":"i","í":"i","î":"i","ï":"i","ð":"d","ñ":"n","ò":"o","ó":"o","ô":"o","õ":"o","ö":"o","ø":"o","ù":"u","ú":"u","û":"u","ü":"u","ý":"y","þ":"th","ÿ":"y","Ā":"A","ā":"a","Ă":"A","ă":"a","Ą":"A","ą":"a","Ć":"C","ć":"c","Č":"C","č":"c","Ď":"D","ď":"d","Đ":"DJ","đ":"dj","Ē":"E","ē":"e","Ė":"E","ė":"e","Ę":"e","ę":"e","Ě":"E","ě":"e","Ğ":"G","ğ":"g","Ģ":"G","ģ":"g","Ĩ":"I","ĩ":"i","Ī":"i","ī":"i","Į":"I","į":"i","İ":"I","ı":"i","Ķ":"k","ķ":"k","Ļ":"L","ļ":"l","Ľ":"L","ľ":"l","Ł":"L","ł":"l","Ń":"N","ń":"n","Ņ":"N","ņ":"n","Ň":"N","ň":"n","Ō":"O","ō":"o","Ő":"O","ő":"o","Œ":"OE","œ":"oe","Ŕ":"R","ŕ":"r","Ř":"R","ř":"r","Ś":"S","ś":"s","Ş":"S","ş":"s","Š":"S","š":"s","Ţ":"T","ţ":"t","Ť":"T","ť":"t","Ũ":"U","ũ":"u","Ū":"u","ū":"u","Ů":"U","ů":"u","Ű":"U","ű":"u","Ų":"U","ų":"u","Ŵ":"W","ŵ":"w","Ŷ":"Y","ŷ":"y","Ÿ":"Y","Ź":"Z","ź":"z","Ż":"Z","ż":"z","Ž":"Z","ž":"z","Ə":"E","ƒ":"f","Ơ":"O","ơ":"o","Ư":"U","ư":"u","ǈ":"LJ","ǉ":"lj","ǋ":"NJ","ǌ":"nj","Ș":"S","ș":"s","Ț":"T","ț":"t","ə":"e","˚":"o","Ά":"A","Έ":"E","Ή":"H","Ί":"I","Ό":"O","Ύ":"Y","Ώ":"W","ΐ":"i","Α":"A","Β":"B","Γ":"G","Δ":"D","Ε":"E","Ζ":"Z","Η":"H","Θ":"8","Ι":"I","Κ":"K","Λ":"L","Μ":"M","Ν":"N","Ξ":"3","Ο":"O","Π":"P","Ρ":"R","Σ":"S","Τ":"T","Υ":"Y","Φ":"F","Χ":"X","Ψ":"PS","Ω":"W","Ϊ":"I","Ϋ":"Y","ά":"a","έ":"e","ή":"h","ί":"i","ΰ":"y","α":"a","β":"b","γ":"g","δ":"d","ε":"e","ζ":"z","η":"h","θ":"8","ι":"i","κ":"k","λ":"l","μ":"m","ν":"n","ξ":"3","ο":"o","π":"p","ρ":"r","ς":"s","σ":"s","τ":"t","υ":"y","φ":"f","χ":"x","ψ":"ps","ω":"w","ϊ":"i","ϋ":"y","ό":"o","ύ":"y","ώ":"w","Ё":"Yo","Ђ":"DJ","Є":"Ye","І":"I","Ї":"Yi","Ј":"J","Љ":"LJ","Њ":"NJ","Ћ":"C","Џ":"DZ","А":"A","Б":"B","В":"V","Г":"G","Д":"D","Е":"E","Ж":"Zh","З":"Z","И":"I","Й":"J","К":"K","Л":"L","М":"M","Н":"N","О":"O","П":"P","Р":"R","С":"S","Т":"T","У":"U","Ф":"F","Х":"H","Ц":"C","Ч":"Ch","Ш":"Sh","Щ":"Sh","Ъ":"U","Ы":"Y","Ь":"","Э":"E","Ю":"Yu","Я":"Ya","а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ж":"zh","з":"z","и":"i","й":"j","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"h","ц":"c","ч":"ch","ш":"sh","щ":"sh","ъ":"u","ы":"y","ь":"","э":"e","ю":"yu","я":"ya","ё":"yo","ђ":"dj","є":"ye","і":"i","ї":"yi","ј":"j","љ":"lj","њ":"nj","ћ":"c","ѝ":"u","џ":"dz","Ґ":"G","ґ":"g","Ғ":"GH","ғ":"gh","Қ":"KH","қ":"kh","Ң":"NG","ң":"ng","Ү":"UE","ү":"ue","Ұ":"U","ұ":"u","Һ":"H","һ":"h","Ә":"AE","ә":"ae","Ө":"OE","ө":"oe","Ա":"A","Բ":"B","Գ":"G","Դ":"D","Ե":"E","Զ":"Z","Է":"E\'","Ը":"Y\'","Թ":"T\'","Ժ":"JH","Ի":"I","Լ":"L","Խ":"X","Ծ":"C\'","Կ":"K","Հ":"H","Ձ":"D\'","Ղ":"GH","Ճ":"TW","Մ":"M","Յ":"Y","Ն":"N","Շ":"SH","Չ":"CH","Պ":"P","Ջ":"J","Ռ":"R\'","Ս":"S","Վ":"V","Տ":"T","Ր":"R","Ց":"C","Փ":"P\'","Ք":"Q\'","Օ":"O\'\'","Ֆ":"F","և":"EV","฿":"baht","ა":"a","ბ":"b","გ":"g","დ":"d","ე":"e","ვ":"v","ზ":"z","თ":"t","ი":"i","კ":"k","ლ":"l","მ":"m","ნ":"n","ო":"o","პ":"p","ჟ":"zh","რ":"r","ს":"s","ტ":"t","უ":"u","ფ":"f","ქ":"k","ღ":"gh","ყ":"q","შ":"sh","ჩ":"ch","ც":"ts","ძ":"dz","წ":"ts","ჭ":"ch","ხ":"kh","ჯ":"j","ჰ":"h","Ẁ":"W","ẁ":"w","Ẃ":"W","ẃ":"w","Ẅ":"W","ẅ":"w","ẞ":"SS","Ạ":"A","ạ":"a","Ả":"A","ả":"a","Ấ":"A","ấ":"a","Ầ":"A","ầ":"a","Ẩ":"A","ẩ":"a","Ẫ":"A","ẫ":"a","Ậ":"A","ậ":"a","Ắ":"A","ắ":"a","Ằ":"A","ằ":"a","Ẳ":"A","ẳ":"a","Ẵ":"A","ẵ":"a","Ặ":"A","ặ":"a","Ẹ":"E","ẹ":"e","Ẻ":"E","ẻ":"e","Ẽ":"E","ẽ":"e","Ế":"E","ế":"e","Ề":"E","ề":"e","Ể":"E","ể":"e","Ễ":"E","ễ":"e","Ệ":"E","ệ":"e","Ỉ":"I","ỉ":"i","Ị":"I","ị":"i","Ọ":"O","ọ":"o","Ỏ":"O","ỏ":"o","Ố":"O","ố":"o","Ồ":"O","ồ":"o","Ổ":"O","ổ":"o","Ỗ":"O","ỗ":"o","Ộ":"O","ộ":"o","Ớ":"O","ớ":"o","Ờ":"O","ờ":"o","Ở":"O","ở":"o","Ỡ":"O","ỡ":"o","Ợ":"O","ợ":"o","Ụ":"U","ụ":"u","Ủ":"U","ủ":"u","Ứ":"U","ứ":"u","Ừ":"U","ừ":"u","Ử":"U","ử":"u","Ữ":"U","ữ":"u","Ự":"U","ự":"u","Ỳ":"Y","ỳ":"y","Ỵ":"Y","ỵ":"y","Ỷ":"Y","ỷ":"y","Ỹ":"Y","ỹ":"y","–":"-","‘":"\'","’":"\'","“":"\\\"","”":"\\\"","„":"\\\"","†":"+","•":"*","…":"...","₠":"ecu","₢":"cruzeiro","₣":"french franc","₤":"lira","₥":"mill","₦":"naira","₧":"peseta","₨":"rupee","₩":"won","₪":"new shequel","₫":"dong","€":"euro","₭":"kip","₮":"tugrik","₯":"drachma","₰":"penny","₱":"peso","₲":"guarani","₳":"austral","₴":"hryvnia","₵":"cedi","₸":"kazakhstani tenge","₹":"indian rupee","₺":"turkish lira","₽":"russian ruble","₿":"bitcoin","℠":"sm","™":"tm","∂":"d","∆":"delta","∑":"sum","∞":"infinity","♥":"love","元":"yuan","円":"yen","﷼":"rial"}');
  var locales = JSON.parse('{"de":{"Ä":"AE","ä":"ae","Ö":"OE","ö":"oe","Ü":"UE","ü":"ue","%":"prozent","&":"und","|":"oder","∑":"summe","∞":"unendlich","♥":"liebe"},"es":{"%":"por ciento","&":"y","<":"menor que",">":"mayor que","|":"o","¢":"centavos","£":"libras","¤":"moneda","₣":"francos","∑":"suma","∞":"infinito","♥":"amor"},"fr":{"%":"pourcent","&":"et","<":"plus petit",">":"plus grand","|":"ou","¢":"centime","£":"livre","¤":"devise","₣":"franc","∑":"somme","∞":"infini","♥":"amour"},"pt":{"%":"porcento","&":"e","<":"menor",">":"maior","|":"ou","¢":"centavo","∑":"soma","£":"libra","∞":"infinito","♥":"amor"},"uk":{"И":"Y","и":"y","Й":"Y","й":"y","Ц":"Ts","ц":"ts","Х":"Kh","х":"kh","Щ":"Shch","щ":"shch","Г":"H","г":"h"},"vi":{"Đ":"D","đ":"d"}}');

  function replace (string, options) {
    if (typeof string !== 'string') {
      throw new Error('slugify: string argument expected')
    }

    options = (typeof options === 'string')
      ? {replacement: options}
      : options || {};

    var locale = locales[options.locale] || {};

    var replacement = options.replacement === undefined ? '-' : options.replacement;

    var trim = options.trim === undefined ? true : options.trim;

    var slug = string.normalize().split('')
      // replace characters based on charMap
      .reduce(function (result, ch) {
        return result + (locale[ch] || charMap[ch] ||  (ch === replacement ? ' ' : ch))
          // remove not allowed characters
          .replace(options.remove || /[^\w\s$*_+~.()'"!\-:@]+/g, '')
      }, '');

    if (options.strict) {
      slug = slug.replace(/[^A-Za-z0-9\s]/g, '');
    }

    if (trim) {
      slug = slug.trim();
    }

    // Replace spaces with replacement character, treating multiple consecutive
    // spaces as a single space.
    slug = slug.replace(/\s+/g, replacement);

    if (options.lower) {
      slug = slug.toLowerCase();
    }

    return slug
  }

  replace.extend = function (customMap) {
    Object.assign(charMap, customMap);
  };

  return replace
}));
});

var StorageNames=Constants.StorageNames,pluses=/\+/g;function Helpers(a){function b(b){var a;return window.crypto&&window.crypto.getRandomValues&&(a=window.crypto.getRandomValues(new Uint8Array(1))),a?(b^a[0]%16>>b/4).toString(16):(b^16*Math.random()>>b/4).toString(16)}var c=this;/**
     * Returns a value between 1-100 inclusive.
     */ // Standalone version of jQuery.extend, from https://github.com/dansdom/extend
this.canLog=function(){return !!(a._Store.isEnabled&&(a._Store.devToken||a._Store.webviewBridgeEnabled))},this.returnConvertedBoolean=function(a){return "false"!==a&&"0"!==a&&!!a},this.getFeatureFlag=function(b){return a._Store.SDKConfig.flags.hasOwnProperty(b)?a._Store.SDKConfig.flags[b]:null},this.getRampNumber=function(a){if(!a)return 100;var b=c.generateHash(a);return Math.abs(b%100)+1},this.invokeCallback=function(b,d,e,f,g){b||a.Logger.warning("There is no callback provided");try{c.Validators.isFunction(b)&&b({httpCode:d,body:e,getUser:function getUser(){return f?f:a.Identity.getCurrentUser()},getPreviousUser:function getPreviousUser(){if(!g){var b=a.Identity.getUsers(),c=b.shift(),d=f||a.Identity.getCurrentUser();return c&&d&&c.getMPID()===d.getMPID()&&(c=b.shift()),c||null}return a.Identity.getUser(g)}});}catch(b){a.Logger.error("There was an error with your callback: "+b);}},this.invokeAliasCallback=function(b,d,e){b||a.Logger.warning("There is no callback provided");try{if(c.Validators.isFunction(b)){var f={httpCode:d};e&&(f.message=e),b(f);}}catch(b){a.Logger.error("There was an error with your callback: "+b);}},this.extend=function(){var a,b,d,e,f,g,h=arguments[0]||{},j=1,k=arguments.length,l=!1,// helper which replicates the jquery internal functions
m={hasOwn:Object.prototype.hasOwnProperty,class2type:{},type:function type(a){return null==a?a+"":m.class2type[Object.prototype.toString.call(a)]||"object"},isPlainObject:function isPlainObject(a){if(!a||"object"!==m.type(a)||a.nodeType||m.isWindow(a))return !1;try{if(a.constructor&&!m.hasOwn.call(a,"constructor")&&!m.hasOwn.call(a.constructor.prototype,"isPrototypeOf"))return !1}catch(a){return !1}for(var b in a);// eslint-disable-line no-empty
return b===void 0||m.hasOwn.call(a,b)},isArray:Array.isArray||function(a){return "array"===m.type(a)},isFunction:function isFunction(a){return "function"===m.type(a)},isWindow:function isWindow(a){return null!=a&&a==a.window}};// end of objectHelper
// Handle a deep copy situation
for("boolean"==typeof h&&(l=h,h=arguments[1]||{},j=2),"object"===_typeof_1(h)||m.isFunction(h)||(h={}),k===j&&(h=this,--j);j<k;j++)// Only deal with non-null/undefined values
if(null!=(a=arguments[j]))// Extend the base object
for(b in a)// Prevent never-ending loop
(d=h[b],e=a[b],h!==e)&&(l&&e&&(m.isPlainObject(e)||(f=m.isArray(e)))?(f?(f=!1,g=d&&m.isArray(d)?d:[]):g=d&&m.isPlainObject(d)?d:{},h[b]=c.extend(l,g,e)):void 0!==e&&(h[b]=e));// Recurse if we're merging plain objects or arrays
// Return the modified object
return h},this.isObject=function(a){var b=Object.prototype.toString.call(a);return "[object Object]"===b||"[object Error]"===b},this.inArray=function(a,b){var c=0;if(Array.prototype.indexOf)return 0<=a.indexOf(b,0);for(var d=a.length;c<d;c++)if(c in a&&a[c]===b)return !0},this.createServiceUrl=function(b,c){var d,e=window.mParticle&&a._Store.SDKConfig.forceHttps?"https://":window.location.protocol+"//";return d=a._Store.SDKConfig.forceHttps?"https://"+b:e+b,c&&(d+=c),d},this.createXHR=function(b){var c;try{c=new window.XMLHttpRequest;}catch(b){a.Logger.error("Error creating XMLHttpRequest object.");}if(c&&b&&"withCredentials"in c)c.onreadystatechange=b;else if("undefined"!=typeof window.XDomainRequest){a.Logger.verbose("Creating XDomainRequest object");try{c=new window.XDomainRequest,c.onload=b;}catch(b){a.Logger.error("Error creating XDomainRequest object");}}return c},this.generateUniqueId=function(d){// https://gist.github.com/jed/982883
// Added support for crypto for better random
return d// if the placeholder was passed, return
?b(d)// a random number
:// or otherwise a concatenated string:
"10000000-1000-4000-8000-100000000000".replace(// replacing
/[018]/g,// zeroes, ones, and eights with
c.generateUniqueId// random hex digits
)},this.filterUserIdentities=function(a,b){var d=[];if(a&&Object.keys(a).length)for(var e in a)if(a.hasOwnProperty(e)){var f=Types.IdentityType.getIdentityType(e);if(!c.inArray(b,f)){var g={Type:f,Identity:a[e]};f===Types.IdentityType.CustomerId?d.unshift(g):d.push(g);}}return d},this.filterUserIdentitiesForForwarders=function(a,b){var d={};if(a&&Object.keys(a).length)for(var e in a)if(a.hasOwnProperty(e)){var f=Types.IdentityType.getIdentityType(e);c.inArray(b,f)||(d[e]=a[e]);}return d},this.filterUserAttributes=function(a,b){var d={};if(a&&Object.keys(a).length)for(var e in a)if(a.hasOwnProperty(e)){var f=c.generateHash(e);c.inArray(b,f)||(d[e]=a[e]);}return d},this.findKeyInObject=function(a,b){if(b&&a)for(var c in a)if(a.hasOwnProperty(c)&&c.toLowerCase()===b.toLowerCase())return c;return null},this.decoded=function(a){return decodeURIComponent(a.replace(pluses," "))},this.converted=function(a){return 0===a.indexOf("\"")&&(a=a.slice(1,-1).replace(/\\"/g,"\"").replace(/\\\\/g,"\\")),a},this.isEventType=function(a){for(var b in Types.EventType)if(Types.EventType.hasOwnProperty(b)&&Types.EventType[b]===a)return !0;return !1},this.parseNumber=function(a){if(isNaN(a)||!isFinite(a))return 0;var b=parseFloat(a);return isNaN(b)?0:b},this.parseStringOrNumber=function(a){return c.Validators.isStringOrNumber(a)?a:null},this.generateHash=function(a){var b,c=0,d=0;if(void 0===a||null===a)return 0;if(a=a.toString().toLowerCase(),Array.prototype.reduce)return a.split("").reduce(function(c,d){return c=(c<<5)-c+d.charCodeAt(0),c&c},0);if(0===a.length)return c;for(d=0;d<a.length;d++)b=a.charCodeAt(d),c=(c<<5)-c+b,c&=c;return c},this.sanitizeAttributes=function(b,d){if(!b||!c.isObject(b))return null;var e={};for(var f in b)// Make sure that attribute values are not objects or arrays, which are not valid
b.hasOwnProperty(f)&&c.Validators.isValidAttributeValue(b[f])?e[f]=b[f]:a.Logger.warning("For '"+d+"', the corresponding attribute value of '"+f+"' must be a string, number, boolean, or null.");return e},this.Validators={isValidAttributeValue:function isValidAttributeValue(a){return a!==void 0&&!c.isObject(a)&&!Array.isArray(a)},// Neither null nor undefined can be a valid Key
isValidKeyValue:function isValidKeyValue(a){return !(!a||c.isObject(a)||Array.isArray(a))},isStringOrNumber:function isStringOrNumber(a){return "string"==typeof a||"number"==typeof a},isNumber:function isNumber(a){return "number"==typeof a},isFunction:function isFunction(a){return "function"==typeof a},validateIdentities:function validateIdentities(b,d){var e={userIdentities:1,onUserAlias:1,copyUserAttributes:1};if(b){if("modify"===d&&(c.isObject(b.userIdentities)&&!Object.keys(b.userIdentities).length||!c.isObject(b.userIdentities)))return {valid:!1,error:Constants.Messages.ValidationMessages.ModifyIdentityRequestUserIdentitiesPresent};for(var f in b)if(b.hasOwnProperty(f)){if(!e[f])return {valid:!1,error:Constants.Messages.ValidationMessages.IdentityRequesetInvalidKey};if("onUserAlias"===f&&!a._Helpers.Validators.isFunction(b[f]))return {valid:!1,error:Constants.Messages.ValidationMessages.OnUserAliasType+_typeof_1(b[f])}}if(0===Object.keys(b).length)return {valid:!0};// identityApiData.userIdentities can't be undefined
if(void 0===b.userIdentities)return {valid:!1,error:Constants.Messages.ValidationMessages.UserIdentities};// identityApiData.userIdentities can be null, but if it isn't null or undefined (above conditional), it must be an object
if(null!==b.userIdentities&&!c.isObject(b.userIdentities))return {valid:!1,error:Constants.Messages.ValidationMessages.UserIdentities};if(c.isObject(b.userIdentities)&&Object.keys(b.userIdentities).length)for(var g in b.userIdentities)if(b.userIdentities.hasOwnProperty(g)){if(!1===Types.IdentityType.getIdentityType(g))return {valid:!1,error:Constants.Messages.ValidationMessages.UserIdentitiesInvalidKey};if("string"!=typeof b.userIdentities[g]&&null!==b.userIdentities[g])return {valid:!1,error:Constants.Messages.ValidationMessages.UserIdentitiesInvalidValues}}}return {valid:!0}}},this.isDelayedByIntegration=function(b,c,d){if(d-c>a._Store.SDKConfig.integrationDelayTimeout)return !1;for(var e in b){if(!0===b[e])return !0;continue}return !1},this.createMainStorageName=function(a){return a?StorageNames.currentStorageName+"_"+a:StorageNames.currentStorageName},this.createProductStorageName=function(a){return a?StorageNames.currentStorageProductsName+"_"+a:StorageNames.currentStorageProductsName},this.isSlug=function(a){return a===slugify(a)};}

var Messages$1=Constants.Messages,androidBridgeNameBase="mParticleAndroid",iosBridgeNameBase="mParticle";function NativeSdkHelpers(a){var b=this;this.isBridgeV2Available=function(a){if(!a)return !1;var b=iosBridgeNameBase+"_"+a+"_v2";// iOS v2 bridge
return !!(window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.hasOwnProperty(b))||!!(window.mParticle&&window.mParticle.uiwebviewBridgeName&&window.mParticle.uiwebviewBridgeName===b)||!!window.hasOwnProperty(androidBridgeNameBase+"_"+a+"_v2");// other iOS v2 bridge
// TODO: what to do about people setting things on mParticle itself?
// android
},this.isWebviewEnabled=function(c,d){return a._Store.bridgeV2Available=b.isBridgeV2Available(c),a._Store.bridgeV1Available=b.isBridgeV1Available(),2===d?a._Store.bridgeV2Available:!(window.mParticle&&window.mParticle.uiwebviewBridgeName&&window.mParticle.uiwebviewBridgeName!==iosBridgeNameBase+"_"+c+"_v2")&&!!(2>d)&&(a._Store.bridgeV2Available||a._Store.bridgeV1Available);// iOS BridgeV1 can be available via mParticle.isIOS, but return false if uiwebviewBridgeName doesn't match requiredWebviewBridgeName
},this.isBridgeV1Available=function(){return !!(a._Store.SDKConfig.useNativeSdk||window.mParticleAndroid||a._Store.SDKConfig.isIOS)},this.sendToNative=function(c,d){return a._Store.bridgeV2Available&&2===a._Store.SDKConfig.minWebviewBridgeVersion?void b.sendViaBridgeV2(c,d,a._Store.SDKConfig.requiredWebviewBridgeName):a._Store.bridgeV2Available&&2>a._Store.SDKConfig.minWebviewBridgeVersion?void b.sendViaBridgeV2(c,d,a._Store.SDKConfig.requiredWebviewBridgeName):a._Store.bridgeV1Available&&2>a._Store.SDKConfig.minWebviewBridgeVersion?void b.sendViaBridgeV1(c,d):void 0},this.sendViaBridgeV1=function(c,d){window.mParticleAndroid&&window.mParticleAndroid.hasOwnProperty(c)?(a.Logger.verbose(Messages$1.InformationMessages.SendAndroid+c),window.mParticleAndroid[c](d)):a._Store.SDKConfig.isIOS&&(a.Logger.verbose(Messages$1.InformationMessages.SendIOS+c),b.sendViaIframeToIOS(c,d));},this.sendViaIframeToIOS=function(a,b){var c=document.createElement("IFRAME");c.setAttribute("src","mp-sdk://"+a+"/"+encodeURIComponent(b)),document.documentElement.appendChild(c),c.parentNode.removeChild(c);},this.sendViaBridgeV2=function(c,d,e){if(e){var f,g,h=window[androidBridgeNameBase+"_"+e+"_v2"],i=iosBridgeNameBase+"_"+e+"_v2";return window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers[i]&&(f=window.webkit.messageHandlers[i]),a.uiwebviewBridgeName===i&&(g=a[i]),h&&h.hasOwnProperty(c)?(a.Logger.verbose(Messages$1.InformationMessages.SendAndroid+c),void h[c](d)):void(f?(a.Logger.verbose(Messages$1.InformationMessages.SendIOS+c),f.postMessage(JSON.stringify({path:c,value:d?JSON.parse(d):null}))):g&&(a.Logger.verbose(Messages$1.InformationMessages.SendIOS+c),b.sendViaIframeToIOS(c,d)))}};}

var Messages$2=Constants.Messages;function cookieSyncManager(a){var b=this;this.attemptCookieSync=function(c,d,e){var f,g,h,i,j,k;d&&!a._Store.webviewBridgeEnabled&&a._Store.pixelConfigurations.forEach(function(l){k=!1,l.filteringConsentRuleValues&&l.filteringConsentRuleValues.values&&l.filteringConsentRuleValues.values.length&&(k=!0),f={moduleId:l.moduleId,frequencyCap:l.frequencyCap,pixelUrl:b.replaceAmp(l.pixelUrl),redirectUrl:l.redirectUrl?b.replaceAmp(l.redirectUrl):null,filteringConsentRuleValues:l.filteringConsentRuleValues},h=b.replaceMPID(f.pixelUrl,d),i=f.redirectUrl?b.replaceMPID(f.redirectUrl,d):"",j=h+encodeURIComponent(i);var m=a._Persistence.getPersistence();return c&&c!==d?void(m&&m[d]&&(!m[d].csd&&(m[d].csd={}),b.performCookieSync(j,f.moduleId,d,m[d].csd,f.filteringConsentRuleValues,e,k))):void(m[d]&&(!m[d].csd&&(m[d].csd={}),g=m[d].csd[f.moduleId.toString()]?m[d].csd[f.moduleId.toString()]:null,g?new Date().getTime()>new Date(g).getTime()+24*(60*(1e3*(60*f.frequencyCap)))&&b.performCookieSync(j,f.moduleId,d,m[d].csd,f.filteringConsentRuleValues,e,k):b.performCookieSync(j,f.moduleId,d,m[d].csd,f.filteringConsentRuleValues,e,k)))});},this.replaceMPID=function(a,b){return a.replace("%%mpid%%",b)},this.replaceAmp=function(a){return a.replace(/&amp;/g,"&")},this.performCookieSync=function(b,c,d,e,f,g,h){// if MPID is new to cookies, we should not try to perform the cookie sync
// because a cookie sync can only occur once a user either consents or doesn't
// we should not check if its enabled if the user has a blank consent
if(!(h&&g)&&a._Consent.isEnabledForUserConsent(f,a.Identity.getCurrentUser())){var i=document.createElement("img");a.Logger.verbose(Messages$2.InformationMessages.CookieSync),i.src=b,e[c.toString()]=new Date().getTime(),a._Persistence.saveUserCookieSyncDatesToPersistence(d,e);}};}

var Messages$3=Constants.Messages;function SessionManager(a){var b=this;this.initialize=function(){if(a._Store.sessionId){var c=6e4*a._Store.SDKConfig.sessionTimeout;if(new Date>new Date(a._Store.dateLastEventSent.getTime()+c))b.endSession(),b.startNewSession();else {var d=a._Persistence.getPersistence();d&&!d.cu&&(a.Identity.identify(a._Store.SDKConfig.identifyRequest,a._Store.SDKConfig.identityCallback),a._Store.identifyCalled=!0,a._Store.SDKConfig.identityCallback=null);}}else b.startNewSession();},this.getSession=function(){return a._Store.sessionId},this.startNewSession=function(){if(a.Logger.verbose(Messages$3.InformationMessages.StartingNewSession),a._Helpers.canLog()){a._Store.sessionId=a._Helpers.generateUniqueId().toUpperCase();var c=a.Identity.getCurrentUser(),d=c?c.getMPID():null;if(d&&(a._Store.currentSessionMPIDs=[d]),!a._Store.sessionStartDate){var e=new Date;a._Store.sessionStartDate=e,a._Store.dateLastEventSent=e;}b.setSessionTimer(),a._Store.identifyCalled||(a.Identity.identify(a._Store.SDKConfig.identifyRequest,a._Store.SDKConfig.identityCallback),a._Store.identifyCalled=!0,a._Store.SDKConfig.identityCallback=null),a._Events.logEvent({messageType:Types.MessageType.SessionStart});}else a.Logger.verbose(Messages$3.InformationMessages.AbandonStartSession);},this.endSession=function(c){if(a.Logger.verbose(Messages$3.InformationMessages.StartingEndSession),c)a._Events.logEvent({messageType:Types.MessageType.SessionEnd}),a._Store.sessionId=null,a._Store.dateLastEventSent=null,a._Store.sessionAttributes={},a._Persistence.update();else if(a._Helpers.canLog()){var d,e,f;if(e=a._Persistence.getPersistence(),!e)return;if(e.gs&&!e.gs.sid)return void a.Logger.verbose(Messages$3.InformationMessages.NoSessionToEnd);// sessionId is not equal to cookies.sid if cookies.sid is changed in another tab
if(e.gs.sid&&a._Store.sessionId!==e.gs.sid&&(a._Store.sessionId=e.gs.sid),e.gs&&e.gs.les){d=6e4*a._Store.SDKConfig.sessionTimeout;var g=new Date().getTime();f=g-e.gs.les,f<d?b.setSessionTimer():(a._Events.logEvent({messageType:Types.MessageType.SessionEnd}),a._Store.sessionId=null,a._Store.dateLastEventSent=null,a._Store.sessionStartDate=null,a._Store.sessionAttributes={},a._Persistence.update());}}else a.Logger.verbose(Messages$3.InformationMessages.AbandonEndSession);},this.setSessionTimer=function(){var c=6e4*a._Store.SDKConfig.sessionTimeout;a._Store.globalTimer=window.setTimeout(function(){b.endSession();},c);},this.resetSessionTimer=function(){a._Store.webviewBridgeEnabled||(!a._Store.sessionId&&b.startNewSession(),b.clearSessionTimeout(),b.setSessionTimer()),b.startNewSessionIfNeeded();},this.clearSessionTimeout=function(){clearTimeout(a._Store.globalTimer);},this.startNewSessionIfNeeded=function(){if(!a._Store.webviewBridgeEnabled){var c=a._Persistence.getPersistence();!a._Store.sessionId&&c&&(c.sid?a._Store.sessionId=c.sid:b.startNewSession());}};}

var Messages$4=Constants.Messages;function Ecommerce(a){var b=this;// sanitizes any non number, non string value to 0
this.convertTransactionAttributesToProductAction=function(a,b){a.hasOwnProperty("Id")&&(b.TransactionId=a.Id),a.hasOwnProperty("Affiliation")&&(b.Affiliation=a.Affiliation),a.hasOwnProperty("CouponCode")&&(b.CouponCode=a.CouponCode),a.hasOwnProperty("Revenue")&&(b.TotalAmount=this.sanitizeAmount(a.Revenue,"Revenue")),a.hasOwnProperty("Shipping")&&(b.ShippingAmount=this.sanitizeAmount(a.Shipping,"Shipping")),a.hasOwnProperty("Tax")&&(b.TaxAmount=this.sanitizeAmount(a.Tax,"Tax")),a.hasOwnProperty("Step")&&(b.CheckoutStep=a.Step),a.hasOwnProperty("Option")&&(b.CheckoutOptions=a.Option);},this.getProductActionEventName=function(a){switch(a){case Types.ProductActionType.AddToCart:return "AddToCart";case Types.ProductActionType.AddToWishlist:return "AddToWishlist";case Types.ProductActionType.Checkout:return "Checkout";case Types.ProductActionType.CheckoutOption:return "CheckoutOption";case Types.ProductActionType.Click:return "Click";case Types.ProductActionType.Purchase:return "Purchase";case Types.ProductActionType.Refund:return "Refund";case Types.ProductActionType.RemoveFromCart:return "RemoveFromCart";case Types.ProductActionType.RemoveFromWishlist:return "RemoveFromWishlist";case Types.ProductActionType.ViewDetail:return "ViewDetail";case Types.ProductActionType.Unknown:default:return "Unknown";}},this.getPromotionActionEventName=function(a){return a===Types.PromotionActionType.PromotionClick?"PromotionClick":a===Types.PromotionActionType.PromotionView?"PromotionView":"Unknown"},this.convertProductActionToEventType=function(b){return b===Types.ProductActionType.AddToCart?Types.CommerceEventType.ProductAddToCart:b===Types.ProductActionType.AddToWishlist?Types.CommerceEventType.ProductAddToWishlist:b===Types.ProductActionType.Checkout?Types.CommerceEventType.ProductCheckout:b===Types.ProductActionType.CheckoutOption?Types.CommerceEventType.ProductCheckoutOption:b===Types.ProductActionType.Click?Types.CommerceEventType.ProductClick:b===Types.ProductActionType.Purchase?Types.CommerceEventType.ProductPurchase:b===Types.ProductActionType.Refund?Types.CommerceEventType.ProductRefund:b===Types.ProductActionType.RemoveFromCart?Types.CommerceEventType.ProductRemoveFromCart:b===Types.ProductActionType.RemoveFromWishlist?Types.CommerceEventType.ProductRemoveFromWishlist:b===Types.ProductActionType.Unknown?Types.EventType.Unknown:b===Types.ProductActionType.ViewDetail?Types.CommerceEventType.ProductViewDetail:(a.Logger.error("Could not convert product action type "+b+" to event type"),null)},this.convertPromotionActionToEventType=function(b){return b===Types.PromotionActionType.PromotionClick?Types.CommerceEventType.PromotionClick:b===Types.PromotionActionType.PromotionView?Types.CommerceEventType.PromotionView:(a.Logger.error("Could not convert promotion action type "+b+" to event type"),null)},this.generateExpandedEcommerceName=function(a,b){return "eCommerce - "+a+" - "+(b?"Total":"Item")},this.extractProductAttributes=function(a,b){b.CouponCode&&(a["Coupon Code"]=b.CouponCode),b.Brand&&(a.Brand=b.Brand),b.Category&&(a.Category=b.Category),b.Name&&(a.Name=b.Name),b.Sku&&(a.Id=b.Sku),b.Price&&(a["Item Price"]=b.Price),b.Quantity&&(a.Quantity=b.Quantity),b.Position&&(a.Position=b.Position),b.Variant&&(a.Variant=b.Variant),a["Total Product Amount"]=b.TotalAmount||0;},this.extractTransactionId=function(a,b){b.TransactionId&&(a["Transaction Id"]=b.TransactionId);},this.extractActionAttributes=function(a,c){b.extractTransactionId(a,c),c.Affiliation&&(a.Affiliation=c.Affiliation),c.CouponCode&&(a["Coupon Code"]=c.CouponCode),c.TotalAmount&&(a["Total Amount"]=c.TotalAmount),c.ShippingAmount&&(a["Shipping Amount"]=c.ShippingAmount),c.TaxAmount&&(a["Tax Amount"]=c.TaxAmount),c.CheckoutOptions&&(a["Checkout Options"]=c.CheckoutOptions),c.CheckoutStep&&(a["Checkout Step"]=c.CheckoutStep);},this.extractPromotionAttributes=function(a,b){b.Id&&(a.Id=b.Id),b.Creative&&(a.Creative=b.Creative),b.Name&&(a.Name=b.Name),b.Position&&(a.Position=b.Position);},this.buildProductList=function(a,b){return b?Array.isArray(b)?b:[b]:a.ShoppingCart.ProductList},this.createProduct=function(b,c,d,e,f,g,h,i,j,k){return (k=a._Helpers.sanitizeAttributes(k,b),"string"!=typeof b)?(a.Logger.error("Name is required when creating a product"),null):a._Helpers.Validators.isStringOrNumber(c)?a._Helpers.Validators.isStringOrNumber(d)?(d=a._Helpers.parseNumber(d),i&&!a._Helpers.Validators.isNumber(i)&&(a.Logger.error("Position must be a number, it will be set to null."),i=null),e=a._Helpers.Validators.isStringOrNumber(e)?a._Helpers.parseNumber(e):1,{Name:b,Sku:c,Price:d,Quantity:e,Brand:h,Variant:f,Category:g,Position:i,CouponCode:j,TotalAmount:e*d,Attributes:k}):(a.Logger.error("Price is required when creating a product, and must be a string or a number"),null):(a.Logger.error("SKU is required when creating a product, and must be a string or a number"),null)},this.createPromotion=function(b,c,d,e){return a._Helpers.Validators.isStringOrNumber(b)?{Id:b,Creative:c,Name:d,Position:e}:(a.Logger.error(Messages$4.ErrorMessages.PromotionIdRequired),null)},this.createImpression=function(b,c){return "string"==typeof b?c?{Name:b,Product:c}:(a.Logger.error("Product is required when creating an impression."),null):(a.Logger.error("Name is required when creating an impression."),null)},this.createTransactionAttributes=function(b,c,d,e,f,g){return a._Helpers.Validators.isStringOrNumber(b)?{Id:b,Affiliation:c,CouponCode:d,Revenue:e,Shipping:f,Tax:g}:(a.Logger.error(Messages$4.ErrorMessages.TransactionIdRequired),null)},this.expandProductImpression=function(c){var d=[];return c.ProductImpressions?(c.ProductImpressions.forEach(function(e){e.ProductList&&e.ProductList.forEach(function(f){var g=a._Helpers.extend(!1,{},c.EventAttributes);if(f.Attributes)for(var h in f.Attributes)g[h]=f.Attributes[h];b.extractProductAttributes(g,f),e.ProductImpressionList&&(g["Product Impression List"]=e.ProductImpressionList);var i=a._ServerModel.createEventObject({messageType:Types.MessageType.PageEvent,name:b.generateExpandedEcommerceName("Impression"),data:g,eventType:Types.EventType.Transaction});d.push(i);});}),d):d},this.expandCommerceEvent=function(a){return a?b.expandProductAction(a).concat(b.expandPromotionAction(a)).concat(b.expandProductImpression(a)):null},this.expandPromotionAction=function(c){var d=[];if(!c.PromotionAction)return d;var e=c.PromotionAction.PromotionList;return e.forEach(function(e){var f=a._Helpers.extend(!1,{},c.EventAttributes);b.extractPromotionAttributes(f,e);var g=a._ServerModel.createEventObject({messageType:Types.MessageType.PageEvent,name:b.generateExpandedEcommerceName(Types.PromotionActionType.getExpansionName(c.PromotionAction.PromotionActionType)),data:f,eventType:Types.EventType.Transaction});d.push(g);}),d},this.expandProductAction=function(c){var d=[];if(!c.ProductAction)return d;var e=!1;if(c.ProductAction.ProductActionType===Types.ProductActionType.Purchase||c.ProductAction.ProductActionType===Types.ProductActionType.Refund){var f=a._Helpers.extend(!1,{},c.EventAttributes);f["Product Count"]=c.ProductAction.ProductList?c.ProductAction.ProductList.length:0,b.extractActionAttributes(f,c.ProductAction),c.CurrencyCode&&(f["Currency Code"]=c.CurrencyCode);var g=a._ServerModel.createEventObject({messageType:Types.MessageType.PageEvent,name:b.generateExpandedEcommerceName(Types.ProductActionType.getExpansionName(c.ProductAction.ProductActionType),!0),data:f,eventType:Types.EventType.Transaction});d.push(g);}else e=!0;var h=c.ProductAction.ProductList;return h?(h.forEach(function(f){var g=a._Helpers.extend(!1,c.EventAttributes,f.Attributes);e?b.extractActionAttributes(g,c.ProductAction):b.extractTransactionId(g,c.ProductAction),b.extractProductAttributes(g,f);var h=a._ServerModel.createEventObject({messageType:Types.MessageType.PageEvent,name:b.generateExpandedEcommerceName(Types.ProductActionType.getExpansionName(c.ProductAction.ProductActionType)),data:g,eventType:Types.EventType.Transaction});d.push(h);}),d):d},this.createCommerceEventObject=function(b){var c;return (a.Logger.verbose(Messages$4.InformationMessages.StartingLogCommerceEvent),a._Helpers.canLog())?(c=a._ServerModel.createEventObject({messageType:Types.MessageType.Commerce}),c.EventName="eCommerce - ",c.CurrencyCode=a._Store.currencyCode,c.ShoppingCart=[],c.CustomFlags=b,c):(a.Logger.verbose(Messages$4.InformationMessages.AbandonLogEvent),null)},this.sanitizeAmount=function(b,c){if(!a._Helpers.Validators.isStringOrNumber(b)){var d=[c,"must be of type number. A",_typeof_1(b),"was passed. Converting to 0"].join(" ");return a.Logger.warning(d),0}// if amount is a string, it will be parsed into a number if possible, or set to 0
return a._Helpers.parseNumber(b)};}

function createSDKConfig(a){var b={};for(var c in Constants.DefaultConfig)Constants.DefaultConfig.hasOwnProperty(c)&&(b[c]=Constants.DefaultConfig[c]);if(a)for(c in a)a.hasOwnProperty(c)&&(b[c]=a[c]);for(c in Constants.DefaultUrls)b[c]=Constants.DefaultUrls[c];return b}function Store(a,b){var c={isEnabled:!0,sessionAttributes:{},currentSessionMPIDs:[],consentState:null,sessionId:null,isFirstRun:null,clientId:null,deviceId:null,devToken:null,migrationData:{},serverSettings:{},dateLastEventSent:null,sessionStartDate:null,currentPosition:null,isTracking:!1,watchPositionId:null,cartProducts:[],eventQueue:[],currencyCode:null,globalTimer:null,context:"",configurationLoaded:!1,identityCallInFlight:!1,SDKConfig:{},migratingToIDSyncCookies:!1,nonCurrentUserMPIDs:{},identifyCalled:!1,isLoggedIn:!1,cookieSyncDates:{},integrationAttributes:{},requireDelay:!0,isLocalStorageAvailable:null,storageName:null,prodStorageName:null,activeForwarders:[],kits:{},configuredForwarders:[],pixelConfigurations:[]};for(var d in c)this[d]=c[d];// Set configuration to default settings
if(this.integrationDelayTimeoutStart=Date.now(),this.SDKConfig=createSDKConfig(a),a){if(this.SDKConfig.isDevelopmentMode=!!a.hasOwnProperty("isDevelopmentMode")&&b._Helpers.returnConvertedBoolean(a.isDevelopmentMode),a.hasOwnProperty("v1SecureServiceUrl")&&(this.SDKConfig.v1SecureServiceUrl=a.v1SecureServiceUrl),a.hasOwnProperty("v2SecureServiceUrl")&&(this.SDKConfig.v2SecureServiceUrl=a.v2SecureServiceUrl),a.hasOwnProperty("v3SecureServiceUrl")&&(this.SDKConfig.v3SecureServiceUrl=a.v3SecureServiceUrl),a.hasOwnProperty("identityUrl")&&(this.SDKConfig.identityUrl=a.identityUrl),a.hasOwnProperty("aliasUrl")&&(this.SDKConfig.aliasUrl=a.aliasUrl),a.hasOwnProperty("configUrl")&&(this.SDKConfig.configUrl=a.configUrl),a.hasOwnProperty("logLevel")&&(this.SDKConfig.logLevel=a.logLevel),this.SDKConfig.useNativeSdk=!!a.hasOwnProperty("useNativeSdk")&&a.useNativeSdk,a.hasOwnProperty("kits")&&(this.SDKConfig.kits=a.kits),this.SDKConfig.isIOS=a.hasOwnProperty("isIOS")?a.isIOS:!!(window.mParticle&&window.mParticle.isIOS)&&window.mParticle.isIOS,this.SDKConfig.useCookieStorage=!!a.hasOwnProperty("useCookieStorage")&&a.useCookieStorage,this.SDKConfig.maxProducts=a.hasOwnProperty("maxProducts")?a.maxProducts:Constants.DefaultConfig.maxProducts,this.SDKConfig.maxCookieSize=a.hasOwnProperty("maxCookieSize")?a.maxCookieSize:Constants.DefaultConfig.maxCookieSize,a.hasOwnProperty("appName")&&(this.SDKConfig.appName=a.appName),this.SDKConfig.integrationDelayTimeout=a.hasOwnProperty("integrationDelayTimeout")?a.integrationDelayTimeout:Constants.DefaultConfig.integrationDelayTimeout,a.hasOwnProperty("identifyRequest")&&(this.SDKConfig.identifyRequest=a.identifyRequest),a.hasOwnProperty("identityCallback")){var e=a.identityCallback;b._Helpers.Validators.isFunction(e)?this.SDKConfig.identityCallback=a.identityCallback:b.Logger.warning("The optional callback must be a function. You tried entering a(n) "+_typeof_1(e)," . Callback not set. Please set your callback again.");}if(a.hasOwnProperty("appVersion")&&(this.SDKConfig.appVersion=a.appVersion),a.hasOwnProperty("appName")&&(this.SDKConfig.appName=a.appName),a.hasOwnProperty("sessionTimeout")&&(this.SDKConfig.sessionTimeout=a.sessionTimeout),a.hasOwnProperty("dataPlan")&&(this.SDKConfig.dataPlan={PlanVersion:null,PlanId:null},a.dataPlan.hasOwnProperty("planId")&&("string"==typeof a.dataPlan.planId?b._Helpers.isSlug(a.dataPlan.planId)?this.SDKConfig.dataPlan.PlanId=a.dataPlan.planId:b.Logger.error("Your data plan id must be in a slug format"):b.Logger.error("Your data plan id must be a string")),a.dataPlan.hasOwnProperty("planVersion")&&("number"==typeof a.dataPlan.planVersion?this.SDKConfig.dataPlan.PlanVersion=a.dataPlan.planVersion:b.Logger.error("Your data plan version must be a number"))),this.SDKConfig.forceHttps=!a.hasOwnProperty("forceHttps")||a.forceHttps,a.hasOwnProperty("customFlags")&&(this.SDKConfig.customFlags=a.customFlags),this.SDKConfig.minWebviewBridgeVersion=a.hasOwnProperty("minWebviewBridgeVersion")?a.minWebviewBridgeVersion:1,this.SDKConfig.aliasMaxWindow=a.hasOwnProperty("aliasMaxWindow")?a.aliasMaxWindow:Constants.DefaultConfig.aliasMaxWindow,a.hasOwnProperty("dataPlanOptions")){var f=a.dataPlanOptions;f.hasOwnProperty("dataPlanVersion")&&f.hasOwnProperty("blockUserAttributes")&&f.hasOwnProperty("blockEventAttributes")&&f.hasOwnProperty("blockEvents")&&f.hasOwnProperty("blockUserIdentities")||b.Logger.error("Ensure your config.dataPlanOptions object has the following keys: a \"dataPlanVersion\" object, and \"blockUserAttributes\", \"blockEventAttributes\", \"blockEvents\", \"blockUserIdentities\" booleans");}a.hasOwnProperty("flags")||(this.SDKConfig.flags={}),this.SDKConfig.flags.hasOwnProperty(Constants.FeatureFlags.EventsV3)||(this.SDKConfig.flags[Constants.FeatureFlags.EventsV3]=0),this.SDKConfig.flags.hasOwnProperty(Constants.FeatureFlags.EventBatchingIntervalMillis)||(this.SDKConfig.flags[Constants.FeatureFlags.EventBatchingIntervalMillis]=Constants.DefaultConfig.uploadInterval),this.SDKConfig.flags.hasOwnProperty(Constants.FeatureFlags.ReportBatching)||(this.SDKConfig.flags[Constants.FeatureFlags.ReportBatching]=!1);}}

function Logger(a){var b=this,c=a.logLevel||"warning";this.logger=a.hasOwnProperty("logger")?a.logger:new ConsoleLogger,this.verbose=function(a){"none"!==c&&b.logger.verbose&&"verbose"===c&&b.logger.verbose(a);},this.warning=function(a){"none"!==c&&b.logger.warning&&("verbose"===c||"warning"===c)&&b.logger.warning(a);},this.error=function(a){"none"!==c&&b.logger.error&&b.logger.error(a);},this.setLogLevel=function(a){c=a;};}function ConsoleLogger(){this.verbose=function(a){console&&console.info&&console.info(a);},this.error=function(a){console&&console.error&&console.error(a);},this.warning=function(a){console&&console.warn&&console.warn(a);};}

var Base64$1=Polyfill.Base64,Messages$5=Constants.Messages,Base64CookieKeys=Constants.Base64CookieKeys,SDKv2NonMPIDCookieKeys=Constants.SDKv2NonMPIDCookieKeys,StorageNames$1=Constants.StorageNames;function _Persistence(a){function b(b){var c=a._Store;return b.gs.sid=c.sessionId,b.gs.ie=c.isEnabled,b.gs.sa=c.sessionAttributes,b.gs.ss=c.serverSettings,b.gs.dt=c.devToken,b.gs.les=c.dateLastEventSent?c.dateLastEventSent.getTime():null,b.gs.av=c.SDKConfig.appVersion,b.gs.cgid=c.clientId,b.gs.das=c.deviceId,b.gs.c=c.context,b.gs.ssd=c.sessionStartDate?c.sessionStartDate.getTime():0,b.gs.ia=c.integrationAttributes,b}function c(a){localStorage.removeItem(a);}function d(a,b,c){return f.encodePersistence(JSON.stringify(a))+";expires="+b+";path=/"+c}var f=this;// only used in persistence
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
*/ // This function loops through the parts of a full hostname, attempting to set a cookie on that domain. It will set a cookie at the highest level possible.
// For example subdomain.domain.co.uk would try the following combinations:
// "co.uk" -> fail
// "domain.co.uk" -> success, return
// "subdomain.domain.co.uk" -> skipped, because already found
/**
     * set the "first seen" time for a user. the time will only be set once for a given
     * mpid after which subsequent calls will be ignored
     */ /**
     * returns the "last seen" time for a user. If the mpid represents the current user, the
     * return value will always be the current time, otherwise it will be to stored "last seen"
     * time
     */ // Forwarder Batching Code
this.useLocalStorage=function(){return !a._Store.SDKConfig.useCookieStorage&&a._Store.isLocalStorageAvailable},this.initializeStorage=function(){try{var b,c,d=f.getLocalStorage(),e=f.getCookie();// Determine if there is any data in cookies or localStorage to figure out if it is the first time the browser is loading mParticle
d||e?a._Store.isFirstRun=!1:(a._Store.isFirstRun=!0,a._Store.mpid=0),a._Store.isLocalStorageAvailable||(a._Store.SDKConfig.useCookieStorage=!0),a._Store.isLocalStorageAvailable?(b=window.localStorage,a._Store.SDKConfig.useCookieStorage?(d?(c=e?a._Helpers.extend(!1,d,e):d,b.removeItem(a._Store.storageName)):e&&(c=e),f.storeDataInMemory(c)):e?(c=d?a._Helpers.extend(!1,d,e):e,f.storeDataInMemory(c),f.expireCookies(a._Store.storageName)):f.storeDataInMemory(d)):f.storeDataInMemory(e);try{if(a._Store.isLocalStorageAvailable){var g=localStorage.getItem(a._Store.prodStorageName);if(g)var h=JSON.parse(Base64$1.decode(g));a._Store.mpid&&f.storeProductsInMemory(h,a._Store.mpid);}}catch(b){a._Store.isLocalStorageAvailable&&localStorage.removeItem(a._Store.prodStorageName),a._Store.cartProducts=[],a.Logger.error("Error loading products in initialization: "+b);}for(var i in c)c.hasOwnProperty(i)&&(SDKv2NonMPIDCookieKeys[i]||(a._Store.nonCurrentUserMPIDs[i]=c[i]));f.update();}catch(b){f.useLocalStorage()&&a._Store.isLocalStorageAvailable?localStorage.removeItem(a._Store.storageName):f.expireCookies(a._Store.storageName),a.Logger.error("Error initializing storage: "+b);}},this.update=function(){a._Store.webviewBridgeEnabled||(a._Store.SDKConfig.useCookieStorage&&f.setCookie(),f.setLocalStorage());},this.storeProductsInMemory=function(b,c){if(b)try{a._Store.cartProducts=b[c]&&b[c].cp?b[c].cp:[];}catch(b){a.Logger.error(Messages$5.ErrorMessages.CookieParseError);}},this.storeDataInMemory=function(b,c){try{b?(a._Store.mpid=c?c:b.cu||0,b.gs=b.gs||{},a._Store.sessionId=b.gs.sid||a._Store.sessionId,a._Store.isEnabled="undefined"==typeof b.gs.ie?a._Store.isEnabled:b.gs.ie,a._Store.sessionAttributes=b.gs.sa||a._Store.sessionAttributes,a._Store.serverSettings=b.gs.ss||a._Store.serverSettings,a._Store.devToken=a._Store.devToken||b.gs.dt,a._Store.SDKConfig.appVersion=a._Store.SDKConfig.appVersion||b.gs.av,a._Store.clientId=b.gs.cgid||a._Store.clientId||a._Helpers.generateUniqueId(),a._Store.deviceId=b.gs.das||a._Store.deviceId||a._Helpers.generateUniqueId(),a._Store.integrationAttributes=b.gs.ia||{},a._Store.context=b.gs.c||a._Store.context,a._Store.currentSessionMPIDs=b.gs.csm||a._Store.currentSessionMPIDs,a._Store.isLoggedIn=!0===b.l,b.gs.les&&(a._Store.dateLastEventSent=new Date(b.gs.les)),a._Store.sessionStartDate=b.gs.ssd?new Date(b.gs.ssd):new Date,b=c?b[c]:b[b.cu]):(a.Logger.verbose(Messages$5.InformationMessages.CookieNotFound),a._Store.clientId=a._Store.clientId||a._Helpers.generateUniqueId(),a._Store.deviceId=a._Store.deviceId||a._Helpers.generateUniqueId());}catch(b){a.Logger.error(Messages$5.ErrorMessages.CookieParseError);}},this.determineLocalStorageAvailability=function(a){var b;window.mParticle&&window.mParticle._forceNoLocalStorage&&(a=void 0);try{return a.setItem("mparticle","test"),b="test"===a.getItem("mparticle"),a.removeItem("mparticle"),b&&a}catch(a){return !1}},this.getUserProductsFromLS=function(b){if(!a._Store.isLocalStorageAvailable)return [];var c,d,e,f=localStorage.getItem(a._Store.prodStorageName);// if there is an MPID, we are retrieving the user's products, which is an array
if(f&&(c=Base64$1.decode(f)),b)try{return c&&(e=JSON.parse(c)),d=c&&e[b]&&e[b].cp&&Array.isArray(e[b].cp)?e[b].cp:[],d}catch(a){return []}else return []},this.getAllUserProductsFromLS=function(){var b,c,d=localStorage.getItem(a._Store.prodStorageName);d&&(b=Base64$1.decode(d));// returns an object with keys of MPID and values of array of products
try{c=JSON.parse(b);}catch(a){c={};}return c},this.setLocalStorage=function(){if(a._Store.isLocalStorageAvailable){var c=a._Store.storageName,d=f.getAllUserProductsFromLS(),e=f.getLocalStorage()||{},g=a.Identity.getCurrentUser(),h=g?g.getMPID():null,i={cp:d[h]?d[h].cp:[]};if(h){d=d||{},d[h]=i;try{window.localStorage.setItem(encodeURIComponent(a._Store.prodStorageName),Base64$1.encode(JSON.stringify(d)));}catch(b){a.Logger.error("Error with setting products on localStorage.");}}if(!a._Store.SDKConfig.useCookieStorage){e.gs=e.gs||{},e.l=a._Store.isLoggedIn?1:0,a._Store.sessionId&&(e.gs.csm=a._Store.currentSessionMPIDs),e.gs.ie=a._Store.isEnabled,h&&(e.cu=h),Object.keys(a._Store.nonCurrentUserMPIDs).length&&(e=a._Helpers.extend({},e,a._Store.nonCurrentUserMPIDs),a._Store.nonCurrentUserMPIDs={}),e=b(e);try{window.localStorage.setItem(encodeURIComponent(c),f.encodePersistence(JSON.stringify(e)));}catch(b){a.Logger.error("Error with setting localStorage item.");}}}},this.getLocalStorage=function(){if(!a._Store.isLocalStorageAvailable)return null;var b,c=a._Store.storageName,d=f.decodePersistence(window.localStorage.getItem(c)),e={};if(d)for(b in d=JSON.parse(d),d)d.hasOwnProperty(b)&&(e[b]=d[b]);return Object.keys(e).length?e:null},this.expireCookies=function(a){var b,c,d,e=new Date;d=f.getCookieDomain(),c=""===d?"":";domain="+d,e.setTime(e.getTime()-86400000),b="; expires="+e.toUTCString(),document.cookie=a+"="+b+"; path=/"+c;},this.getCookie=function(){var b,c,d,g,h,j=window.document.cookie.split("; "),k=a._Store.storageName,m=k?void 0:{};for(a.Logger.verbose(Messages$5.InformationMessages.CookieSearch),b=0,c=j.length;b<c;b++){try{d=j[b].split("="),g=a._Helpers.decoded(d.shift()),h=a._Helpers.decoded(d.join("="));}catch(b){a.Logger.verbose("Unable to parse cookie: "+g+". Skipping.");}if(k&&k===g){m=a._Helpers.converted(h);break}k||(m[g]=a._Helpers.converted(h));}return m?(a.Logger.verbose(Messages$5.InformationMessages.CookieFound),JSON.parse(f.decodePersistence(m))):null},this.setCookie=function(){var c,d=a.Identity.getCurrentUser();d&&(c=d.getMPID());var e,g,h,i=new Date,j=a._Store.storageName,k=f.getCookie()||{},l=new Date(i.getTime()+1e3*(60*(60*(24*a._Store.SDKConfig.cookieExpiration)))).toGMTString();e=f.getCookieDomain(),g=""===e?"":";domain="+e,k.gs=k.gs||{},a._Store.sessionId&&(k.gs.csm=a._Store.currentSessionMPIDs),c&&(k.cu=c),k.l=a._Store.isLoggedIn?1:0,k=b(k),Object.keys(a._Store.nonCurrentUserMPIDs).length&&(k=a._Helpers.extend({},k,a._Store.nonCurrentUserMPIDs),a._Store.nonCurrentUserMPIDs={}),h=f.reduceAndEncodePersistence(k,l,g,a._Store.SDKConfig.maxCookieSize),a.Logger.verbose(Messages$5.InformationMessages.CookieSet),window.document.cookie=encodeURIComponent(j)+"="+h;},this.reduceAndEncodePersistence=function(b,c,e,f){var g,h=b.gs.csm?b.gs.csm:[];// Comment 1 above
if(!h.length)for(var j in b)b.hasOwnProperty(j)&&(g=d(b,c,e),g.length>f&&!SDKv2NonMPIDCookieKeys[j]&&j!==b.cu&&delete b[j]);else {// Comment 2 above - First create an object of all MPIDs on the cookie
var k={};for(var l in b)b.hasOwnProperty(l)&&(SDKv2NonMPIDCookieKeys[l]||l===b.cu||(k[l]=1));// Comment 2a above
if(Object.keys(k).length)for(var m in k)g=d(b,c,e),g.length>f&&k.hasOwnProperty(m)&&-1===h.indexOf(m)&&delete b[m];// Comment 2b above
for(var n,o=0;o<h.length&&(g=d(b,c,e),g.length>f);o++)n=h[o],b[n]?(a.Logger.verbose("Size of new encoded cookie is larger than maxCookieSize setting of "+f+". Removing from cookie the earliest logged in MPID containing: "+JSON.stringify(b[n],0,2)),delete b[n]):a.Logger.error("Unable to save MPID data to cookies because the resulting encoded cookie is larger than the maxCookieSize setting of "+f+". We recommend using a maxCookieSize of 1500.");}return g},this.findPrevCookiesBasedOnUI=function(b){var c,d=a._Persistence.getPersistence();if(b)for(var e in b.userIdentities)if(d&&Object.keys(d).length)for(var g in d)// any value in persistence that has an MPID key will be an MPID to search through
// other keys on the cookie are currentSessionMPIDs and currentMPID which should not be searched
if(d[g].mpid){var h=d[g].ui;for(var i in h)if(e===i&&b.userIdentities[e]===h[i]){c=g;break}}c&&f.storeDataInMemory(d,c);},this.encodePersistence=function(b){for(var c in b=JSON.parse(b),b.gs)b.gs.hasOwnProperty(c)&&(Base64CookieKeys[c]?b.gs[c]?Array.isArray(b.gs[c])&&b.gs[c].length||a._Helpers.isObject(b.gs[c])&&Object.keys(b.gs[c]).length?b.gs[c]=Base64$1.encode(JSON.stringify(b.gs[c])):delete b.gs[c]:delete b.gs[c]:"ie"===c?b.gs[c]=b.gs[c]?1:0:!b.gs[c]&&delete b.gs[c]);for(var d in b)if(b.hasOwnProperty(d)&&!SDKv2NonMPIDCookieKeys[d])for(c in b[d])b[d].hasOwnProperty(c)&&Base64CookieKeys[c]&&(a._Helpers.isObject(b[d][c])&&Object.keys(b[d][c]).length?b[d][c]=Base64$1.encode(JSON.stringify(b[d][c])):delete b[d][c]);return f.createCookieString(JSON.stringify(b))},this.decodePersistence=function(b){try{if(b){if(b=JSON.parse(f.revertCookieString(b)),a._Helpers.isObject(b)&&Object.keys(b).length){for(var c in b.gs)b.gs.hasOwnProperty(c)&&(Base64CookieKeys[c]?b.gs[c]=JSON.parse(Base64$1.decode(b.gs[c])):"ie"===c&&(b.gs[c]=!!b.gs[c]));for(var d in b)if(b.hasOwnProperty(d))if(!SDKv2NonMPIDCookieKeys[d])for(c in b[d])b[d].hasOwnProperty(c)&&Base64CookieKeys[c]&&b[d][c].length&&(b[d][c]=JSON.parse(Base64$1.decode(b[d][c])));else "l"===d&&(b[d]=!!b[d]);}return JSON.stringify(b)}}catch(b){a.Logger.error("Problem with decoding cookie",b);}},this.replaceCommasWithPipes=function(a){return a.replace(/,/g,"|")},this.replacePipesWithCommas=function(a){return a.replace(/\|/g,",")},this.replaceApostrophesWithQuotes=function(a){return a.replace(/\'/g,"\"")},this.replaceQuotesWithApostrophes=function(a){return a.replace(/\"/g,"'")},this.createCookieString=function(a){return f.replaceCommasWithPipes(f.replaceQuotesWithApostrophes(a))},this.revertCookieString=function(a){return f.replacePipesWithCommas(f.replaceApostrophesWithQuotes(a))},this.getCookieDomain=function(){if(a._Store.SDKConfig.cookieDomain)return a._Store.SDKConfig.cookieDomain;var b=f.getDomain(document,location.hostname);return ""===b?"":"."+b},this.getDomain=function(a,b){var c,d,e=b.split(".");for(c=e.length-1;0<=c;c--)if(d=e.slice(c).join("."),a.cookie="mptest=cookie;domain=."+d+";",-1<a.cookie.indexOf("mptest=cookie"))return a.cookie="mptest=;domain=."+d+";expires=Thu, 01 Jan 1970 00:00:01 GMT;",d;return ""},this.getUserIdentities=function(a){var b=f.getPersistence();return b&&b[a]&&b[a].ui?b[a].ui:{}},this.getAllUserAttributes=function(a){var b=f.getPersistence();return b&&b[a]&&b[a].ua?b[a].ua:{}},this.getCartProducts=function(b){var c,d=localStorage.getItem(a._Store.prodStorageName);return d&&(c=JSON.parse(Base64$1.decode(d)),c&&c[b]&&c[b].cp)?c[b].cp:[]},this.setCartProducts=function(b){if(a._Store.isLocalStorageAvailable)try{window.localStorage.setItem(encodeURIComponent(a._Store.prodStorageName),Base64$1.encode(JSON.stringify(b)));}catch(b){a.Logger.error("Error with setting products on localStorage.");}},this.saveUserIdentitiesToPersistence=function(a,b){if(b){var c=f.getPersistence();c&&(c[a]?c[a].ui=b:c[a]={ui:b},f.savePersistence(c));}},this.saveUserAttributesToPersistence=function(a,b){var c=f.getPersistence();b&&(c&&(c[a]?c[a].ui=b:c[a]={ui:b}),f.savePersistence(c));},this.saveUserCookieSyncDatesToPersistence=function(a,b){if(b){var c=f.getPersistence();c&&(c[a]?c[a].csd=b:c[a]={csd:b}),f.savePersistence(c);}},this.saveUserConsentStateToCookies=function(b,c){//it's currently not supported to set persistence
//for any MPID that's not the current one.
if(c||null===c){var d=f.getPersistence();d&&(d[b]?d[b].con=a._Consent.ConsentSerialization.toMinifiedJsonObject(c):d[b]={con:a._Consent.ConsentSerialization.toMinifiedJsonObject(c)},f.savePersistence(d));}},this.savePersistence=function(b){var c,d=f.encodePersistence(JSON.stringify(b)),e=new Date,g=a._Store.storageName,h=new Date(e.getTime()+1e3*(60*(60*(24*a._Store.SDKConfig.cookieExpiration)))).toGMTString(),i=f.getCookieDomain();if(c=""===i?"":";domain="+i,a._Store.SDKConfig.useCookieStorage){var j=f.reduceAndEncodePersistence(b,h,c,a._Store.SDKConfig.maxCookieSize);window.document.cookie=encodeURIComponent(g)+"="+j;}else a._Store.isLocalStorageAvailable&&localStorage.setItem(a._Store.storageName,d);},this.getPersistence=function(){var a=this.useLocalStorage()?this.getLocalStorage():this.getCookie();return a},this.getConsentState=function(b){var c=f.getPersistence();return c&&c[b]&&c[b].con?a._Consent.ConsentSerialization.fromMinifiedJsonObject(c[b].con):null},this.getFirstSeenTime=function(a){if(!a)return null;var b=f.getPersistence();return b&&b[a]&&b[a].fst?b[a].fst:null},this.setFirstSeenTime=function(a,b){if(a){b||(b=new Date().getTime());var c=f.getPersistence();c&&(!c[a]&&(c[a]={}),!c[a].fst&&(c[a].fst=b,f.savePersistence(c)));}},this.getLastSeenTime=function(b){if(!b)return null;if(b===a.Identity.getCurrentUser().getMPID())//if the mpid is the current user, its last seen time is the current time
return new Date().getTime();var c=f.getPersistence();return c&&c[b]&&c[b].lst?c[b].lst:null},this.setLastSeenTime=function(a,b){if(a){b||(b=new Date().getTime());var c=f.getPersistence();c&&c[a]&&(c[a].lst=b,f.savePersistence(c));}},this.getDeviceId=function(){return a._Store.deviceId},this.resetPersistence=function(){if(c(StorageNames$1.localStorageName),c(StorageNames$1.localStorageNameV3),c(StorageNames$1.localStorageNameV4),c(a._Store.prodStorageName),c(a._Store.storageName),c(StorageNames$1.localStorageProductsV4),f.expireCookies(StorageNames$1.cookieName),f.expireCookies(StorageNames$1.cookieNameV2),f.expireCookies(StorageNames$1.cookieNameV3),f.expireCookies(StorageNames$1.cookieNameV4),f.expireCookies(a._Store.prodStorageName),f.expireCookies(a._Store.storageName),mParticle._isTestEnv){c(a._Helpers.createMainStorageName("abcdef")),f.expireCookies(a._Helpers.createMainStorageName("abcdef")),c(a._Helpers.createProductStorageName("abcdef"));}},this.forwardingStatsBatches={uploadsTable:{},forwardingStatsEventQueue:[]};}

var Messages$6=Constants.Messages;function Events(a){var b=this;this.logEvent=function(b,c){if(a.Logger.verbose(Messages$6.InformationMessages.StartingLogEvent+": "+b.name),a._Helpers.canLog()){var d=a._ServerModel.createEventObject(b);a._APIClient.sendEventToServer(d,c);}else a.Logger.verbose(Messages$6.InformationMessages.AbandonLogEvent);},this.startTracking=function(b){function c(c){// prevents callback from being fired multiple times
a._Store.currentPosition={lat:c.coords.latitude,lng:c.coords.longitude},e(b,c),b=null,a._Store.isTracking=!0;}function d(){// prevents callback from being fired multiple times
e(b),b=null,a._Store.isTracking=!1;}function e(b,c){if(b)try{c?b(c):b();}catch(b){a.Logger.error("Error invoking the callback passed to startTrackingLocation."),a.Logger.error(b);}}if(!a._Store.isTracking)"geolocation"in navigator&&(a._Store.watchPositionId=navigator.geolocation.watchPosition(c,d));else {var f={coords:{latitude:a._Store.currentPosition.lat,longitude:a._Store.currentPosition.lng}};e(b,f);}},this.stopTracking=function(){a._Store.isTracking&&(navigator.geolocation.clearWatch(a._Store.watchPositionId),a._Store.currentPosition=null,a._Store.isTracking=!1);},this.logOptOut=function(){a.Logger.verbose(Messages$6.InformationMessages.StartingLogOptOut);var b=a._ServerModel.createEventObject({messageType:Types.MessageType.OptOut,eventType:Types.EventType.Other});a._APIClient.sendEventToServer(b);},this.logAST=function(){b.logEvent({messageType:Types.MessageType.AppStateTransition});},this.logCheckoutEvent=function(c,d,e,f){var g=a._Ecommerce.createCommerceEventObject(f);g&&(g.EventName+=a._Ecommerce.getProductActionEventName(Types.ProductActionType.Checkout),g.EventCategory=Types.CommerceEventType.ProductCheckout,g.ProductAction={ProductActionType:Types.ProductActionType.Checkout,CheckoutStep:c,CheckoutOptions:d,ProductList:[]},b.logCommerceEvent(g,e));},this.logProductActionEvent=function(c,d,e,f,g,h){var i=a._Ecommerce.createCommerceEventObject(f),j=Array.isArray(d)?d:[d];j.forEach(function(b){b.TotalAmount&&(b.TotalAmount=a._Ecommerce.sanitizeAmount(b.TotalAmount,"TotalAmount")),b.Position&&(b.Position=a._Ecommerce.sanitizeAmount(b.Position,"Position")),b.Price&&(b.Price=a._Ecommerce.sanitizeAmount(b.Price,"Price")),b.Quantity&&(b.Quantity=a._Ecommerce.sanitizeAmount(b.Quantity,"Quantity"));}),i&&(i.EventCategory=a._Ecommerce.convertProductActionToEventType(c),i.EventName+=a._Ecommerce.getProductActionEventName(c),i.ProductAction={ProductActionType:c,ProductList:j},a._Helpers.isObject(g)&&a._Ecommerce.convertTransactionAttributesToProductAction(g,i.ProductAction),b.logCommerceEvent(i,e,h));},this.logPurchaseEvent=function(c,d,e,f){var g=a._Ecommerce.createCommerceEventObject(f);g&&(g.EventName+=a._Ecommerce.getProductActionEventName(Types.ProductActionType.Purchase),g.EventCategory=Types.CommerceEventType.ProductPurchase,g.ProductAction={ProductActionType:Types.ProductActionType.Purchase},g.ProductAction.ProductList=a._Ecommerce.buildProductList(g,d),a._Ecommerce.convertTransactionAttributesToProductAction(c,g.ProductAction),b.logCommerceEvent(g,e));},this.logRefundEvent=function(c,d,e,f){if(!c)return void a.Logger.error(Messages$6.ErrorMessages.TransactionRequired);var g=a._Ecommerce.createCommerceEventObject(f);g&&(g.EventName+=a._Ecommerce.getProductActionEventName(Types.ProductActionType.Refund),g.EventCategory=Types.CommerceEventType.ProductRefund,g.ProductAction={ProductActionType:Types.ProductActionType.Refund},g.ProductAction.ProductList=a._Ecommerce.buildProductList(g,d),a._Ecommerce.convertTransactionAttributesToProductAction(c,g.ProductAction),b.logCommerceEvent(g,e));},this.logPromotionEvent=function(c,d,e,f,g){var h=a._Ecommerce.createCommerceEventObject(f);h&&(h.EventName+=a._Ecommerce.getPromotionActionEventName(c),h.EventCategory=a._Ecommerce.convertPromotionActionToEventType(c),h.PromotionAction={PromotionActionType:c,PromotionList:[d]},b.logCommerceEvent(h,e,g));},this.logImpressionEvent=function(c,d,e,f){var g=a._Ecommerce.createCommerceEventObject(e);g&&(g.EventName+="Impression",g.EventCategory=Types.CommerceEventType.ProductImpression,!Array.isArray(c)&&(c=[c]),g.ProductImpressions=[],c.forEach(function(a){g.ProductImpressions.push({ProductImpressionList:a.Name,ProductList:Array.isArray(a.Product)?a.Product:[a.Product]});}),b.logCommerceEvent(g,d,f));},this.logCommerceEvent=function(b,c,d){a.Logger.verbose(Messages$6.InformationMessages.StartingLogCommerceEvent),c=a._Helpers.sanitizeAttributes(c,b.EventName),a._Helpers.canLog()?(a._Store.webviewBridgeEnabled&&(b.ShoppingCart={}),c&&(b.EventAttributes=c),a._APIClient.sendEventToServer(b,d),a._Persistence.update()):a.Logger.verbose(Messages$6.InformationMessages.AbandonLogEvent);},this.addEventHandler=function(c,d,f,g,h){var j,k,e=[],l=function(c){var d=function(){j.href?window.location.href=j.href:j.submit&&j.submit();};a.Logger.verbose("DOM event triggered, handling event"),b.logEvent({messageType:Types.MessageType.PageEvent,name:"function"==typeof f?f(j):f,data:"function"==typeof g?g(j):g,eventType:h||Types.EventType.Other}),(j.href&&"_blank"!==j.target||j.submit)&&(c.preventDefault?c.preventDefault():c.returnValue=!1,setTimeout(d,a._Store.SDKConfig.timeout));};if(!d)return void a.Logger.error("Can't bind event, selector is required");// Handle a css selector string or a dom element
if("string"==typeof d?e=document.querySelectorAll(d):d.nodeType&&(e=[d]),e.length)for(a.Logger.verbose("Found "+e.length+" element"+(1<e.length?"s":"")+", attaching event handlers"),k=0;k<e.length;k++)j=e[k],j.addEventListener?j.addEventListener(c,l,!1):j.attachEvent?j.attachEvent("on"+c,l):j["on"+c]=l;else a.Logger.verbose("No elements found");};}

var StorageNames$2=Constants.StorageNames,Base64$2=Polyfill.Base64,CookiesGlobalSettingsKeys={das:1},MPIDKeys={ui:1};function Migrations(a){function b(){var b,d,f,g,j,k,m=window.document.cookie.split("; ");for(a.Logger.verbose(Constants.Messages.InformationMessages.CookieSearch),d=0,f=m.length;d<f;d++){try{g=m[d].split("="),j=a._Helpers.decoded(g.shift()),k=a._Helpers.decoded(g.join("="));}catch(b){a.Logger.verbose("Unable to parse cookie: "+j+". Skipping.");}//most recent version needs no migration
if(j===a._Store.storageName)return;if(j===StorageNames$2.cookieNameV4)return c(k,StorageNames$2.cookieNameV4),void(a._Store.isLocalStorageAvailable&&e());// migration path for SDKv1CookiesV3, doesn't need to be encoded
if(j===StorageNames$2.cookieNameV3){b=h.convertSDKv1CookiesV3ToSDKv2CookiesV4(k),c(b,StorageNames$2.cookieNameV3);break}}}function c(b,c){var d,e,f=new Date,g=a._Persistence.getCookieDomain();d=new Date(f.getTime()+1e3*(60*(60*(24*StorageNames$2.CookieExpiration)))).toGMTString(),e=""===g?"":";domain="+g,a.Logger.verbose(Constants.Messages.InformationMessages.CookieSet),window.document.cookie=encodeURIComponent(a._Store.storageName)+"="+b+";expires="+d+";path=/"+e,a._Persistence.expireCookies(c),a._Store.migratingToIDSyncCookies=!0;}function d(b){try{var c={gs:{csm:[]}};for(var d in b=JSON.parse(b),b)b.hasOwnProperty(d)&&(CookiesGlobalSettingsKeys[d]?c.gs[d]=b[d]:"mpid"===d?c.cu=b[d]:b.mpid&&(c[b.mpid]=c[b.mpid]||{},MPIDKeys[d]&&(c[b.mpid][d]=b[d])));return JSON.stringify(c)}catch(b){a.Logger.error("Failed to restructure previous cookie into most current cookie schema");}}function e(){var b=StorageNames$2.localStorageProductsV4,c=localStorage.getItem(StorageNames$2.localStorageProductsV4);localStorage.setItem(a._Store.prodStorageName,c),localStorage.removeItem(b);}function f(b,c){if(a._Store.isLocalStorageAvailable){var d={};if(d[c]={},b.cp){try{d[c].cp=JSON.parse(Base64$2.decode(b.cp));}catch(a){d[c].cp=b.cp;}Array.isArray(d[c].cp)||(d[c].cp=[]);}localStorage.setItem(a._Store.prodStorageName,Base64$2.encode(JSON.stringify(d)));}}function g(){function b(b,c){try{window.localStorage.setItem(encodeURIComponent(a._Store.storageName),b);}catch(b){a.Logger.error("Error with setting localStorage item.");}window.localStorage.removeItem(encodeURIComponent(c));}var c,d,g,i,j=StorageNames$2.localStorageNameV3,k=StorageNames$2.localStorageNameV4,l=window.localStorage.getItem(a._Store.storageName);if(!l){if(d=window.localStorage.getItem(k),d)return b(d,k),void e();if(g=window.localStorage.getItem(j),g){// localStorage may contain only products, or the full persistence
// when there is an MPID on the cookie, it is the full persistence
if(a._Store.migratingToIDSyncCookies=!0,i=g.slice(),g=JSON.parse(a._Persistence.replacePipesWithCommas(a._Persistence.replaceApostrophesWithQuotes(g))),g.mpid)return g=JSON.parse(h.convertSDKv1CookiesV3ToSDKv2CookiesV4(i)),void b(JSON.stringify(g),j);// if no MPID, it is only the products
if((g.cp||g.pb)&&!g.mpid)return c=a._Persistence.getCookie(),c?(f(g,c.cu),void localStorage.removeItem(StorageNames$2.localStorageNameV3)):void localStorage.removeItem(StorageNames$2.localStorageNameV3)}}}var h=this;//  if there is a cookie or localStorage:
//  1. determine which version it is ('mprtcl-api', 'mprtcl-v2', 'mprtcl-v3', 'mprtcl-v4')
//  2. return if 'mprtcl-v4', otherwise migrate to mprtclv4 schema
// 3. if 'mprtcl-api', could be JSSDKv2 or JSSDKv1. JSSDKv2 cookie has a 'globalSettings' key on it
this.migrate=function(){try{b();}catch(b){a._Persistence.expireCookies(StorageNames$2.cookieNameV3),a._Persistence.expireCookies(StorageNames$2.cookieNameV4),a.Logger.error("Error migrating cookie: "+b);}if(a._Store.isLocalStorageAvailable)try{g();}catch(b){localStorage.removeItem(StorageNames$2.localStorageNameV3),localStorage.removeItem(StorageNames$2.localStorageNameV4),a.Logger.error("Error migrating localStorage: "+b);}},this.convertSDKv1CookiesV3ToSDKv2CookiesV4=function(b){b=a._Persistence.replacePipesWithCommas(a._Persistence.replaceApostrophesWithQuotes(b));var c=JSON.parse(b),e=JSON.parse(d(b));return c.mpid&&(e.gs.csm.push(c.mpid),e.gs.csm=Base64$2.encode(JSON.stringify(e.gs.csm)),f(c,c.mpid)),JSON.stringify(e)};}

function filteredMparticleUser(a,b,c,d){var e=this;return {getUserIdentities:function getUserIdentities(){var e={},f=c._Persistence.getUserIdentities(a);for(var g in f)if(f.hasOwnProperty(g)){var h=Types.IdentityType.getIdentityName(c._Helpers.parseNumber(g));d&&(!d||d.isIdentityBlocked(h))||(//if identity type is not blocked
e[h]=f[g]);}return e=c._Helpers.filterUserIdentitiesForForwarders(e,b.userIdentityFilters),{userIdentities:e}},getMPID:function getMPID(){return a},getUserAttributesLists:function getUserAttributesLists(a){var b,f={};for(var g in b=e.getAllUserAttributes(),b)b.hasOwnProperty(g)&&Array.isArray(b[g])&&(d&&(!d||d.isAttributeKeyBlocked(g))||(f[g]=b[g].slice()));return f=c._Helpers.filterUserAttributes(f,a.userAttributeFilters),f},getAllUserAttributes:function getAllUserAttributes(){var e={},f=c._Persistence.getAllUserAttributes(a);if(f)for(var g in f)f.hasOwnProperty(g)&&(d&&(!d||d.isAttributeKeyBlocked(g))||(Array.isArray(f[g])?e[g]=f[g].slice():e[g]=f[g]));return e=c._Helpers.filterUserAttributes(e,b.userAttributeFilters),e}}}

function Forwarders(a,b){var c=this;this.initForwarders=function(b,d){var e=a.Identity.getCurrentUser();!a._Store.webviewBridgeEnabled&&a._Store.configuredForwarders&&(a._Store.configuredForwarders.sort(function(a,b){return a.settings.PriorityValue=a.settings.PriorityValue||0,b.settings.PriorityValue=b.settings.PriorityValue||0,-1*(a.settings.PriorityValue-b.settings.PriorityValue)}),a._Store.activeForwarders=a._Store.configuredForwarders.filter(function(f){if(!a._Consent.isEnabledForUserConsent(f.filteringConsentRuleValues,e))return !1;if(!c.isEnabledForUserAttributes(f.filteringUserAttributeValue,e))return !1;if(!c.isEnabledForUnknownUser(f.excludeAnonymousUser,e))return !1;var g=a._Helpers.filterUserIdentities(b,f.userIdentityFilters),h=a._Helpers.filterUserAttributes(e?e.getAllUserAttributes():{},f.userAttributeFilters);return f.initialized||(f.init(f.settings,d,!1,null,h,g,a._Store.SDKConfig.appVersion,a._Store.SDKConfig.appName,a._Store.SDKConfig.customFlags,a._Store.clientId),f.initialized=!0),!0}));},this.isEnabledForUserAttributes=function(b,c){if(!b||!a._Helpers.isObject(b)||!Object.keys(b).length)return !0;var d,e,f;if(!c)return !1;f=c.getAllUserAttributes();var g=!1;try{if(f&&a._Helpers.isObject(f)&&Object.keys(f).length)for(var h in f)if(f.hasOwnProperty(h)&&(d=a._Helpers.generateHash(h).toString(),e=a._Helpers.generateHash(f[h]).toString(),d===b.userAttributeName&&e===b.userAttributeValue)){g=!0;break}return !b||b.includeOnMatch===g}catch(a){// in any error scenario, err on side of returning true and forwarding event
return !0}},this.isEnabledForUnknownUser=function(a,b){return !!(b&&b.isLoggedIn()||!a)},this.applyToForwarders=function(b,c){a._Store.activeForwarders.length&&a._Store.activeForwarders.forEach(function(d){var e=d[b];if(e)try{var f=d[b](c);f&&a.Logger.verbose(f);}catch(b){a.Logger.verbose(b);}});},this.sendEventToForwarders=function(b){var c,d,e,f=function(b,c){b.UserIdentities&&b.UserIdentities.length&&b.UserIdentities.forEach(function(d,e){a._Helpers.inArray(c,d.Type)&&(b.UserIdentities.splice(e,1),0<e&&e--);});},g=function(b,c){var d;if(c)for(var e in b.EventAttributes)b.EventAttributes.hasOwnProperty(e)&&(d=a._Helpers.generateHash(b.EventCategory+b.EventName+e),a._Helpers.inArray(c,d)&&delete b.EventAttributes[e]);},h=function(b,c){return !!(b&&b.length&&a._Helpers.inArray(b,c))},j=[Types.MessageType.PageEvent,Types.MessageType.PageView,Types.MessageType.Commerce];if(!a._Store.webviewBridgeEnabled&&a._Store.activeForwarders){d=a._Helpers.generateHash(b.EventCategory+b.EventName),e=a._Helpers.generateHash(b.EventCategory);for(var k=0;k<a._Store.activeForwarders.length;k++){// Check attribute forwarding rule. This rule allows users to only forward an event if a
// specific attribute exists and has a specific value. Alternatively, they can specify
// that an event not be forwarded if the specified attribute name and value exists.
// The two cases are controlled by the "includeOnMatch" boolean value.
// Supported message types for attribute forwarding rules are defined in the forwardingRuleMessageTypes array
if(-1<j.indexOf(b.EventDataType)&&a._Store.activeForwarders[k].filteringEventAttributeValue&&a._Store.activeForwarders[k].filteringEventAttributeValue.eventAttributeName&&a._Store.activeForwarders[k].filteringEventAttributeValue.eventAttributeValue){var l=null;// Attempt to find the attribute in the collection of event attributes
if(b.EventAttributes)for(var m in b.EventAttributes){var n;if(n=a._Helpers.generateHash(m).toString(),n===a._Store.activeForwarders[k].filteringEventAttributeValue.eventAttributeName&&(l={name:n,value:a._Helpers.generateHash(b.EventAttributes[m]).toString()}),l)break}var o=null!==l&&l.value===a._Store.activeForwarders[k].filteringEventAttributeValue.eventAttributeValue,p=!0===a._Store.activeForwarders[k].filteringEventAttributeValue.includeOnMatch?o:!o;if(!p)continue}// Clone the event object, as we could be sending different attributes to each forwarder
// Check event filtering rules
if(c={},c=a._Helpers.extend(!0,c,b),b.EventDataType===Types.MessageType.PageEvent&&(h(a._Store.activeForwarders[k].eventNameFilters,d)||h(a._Store.activeForwarders[k].eventTypeFilters,e)))continue;else if(b.EventDataType===Types.MessageType.Commerce&&h(a._Store.activeForwarders[k].eventTypeFilters,e))continue;else if(b.EventDataType===Types.MessageType.PageView&&h(a._Store.activeForwarders[k].screenNameFilters,d))continue;// Check attribute filtering rules
if(c.EventAttributes&&(b.EventDataType===Types.MessageType.PageEvent?g(c,a._Store.activeForwarders[k].attributeFilters):b.EventDataType===Types.MessageType.PageView&&g(c,a._Store.activeForwarders[k].screenAttributeFilters)),f(c,a._Store.activeForwarders[k].userIdentityFilters),c.UserAttributes=a._Helpers.filterUserAttributes(c.UserAttributes,a._Store.activeForwarders[k].userAttributeFilters),a.Logger.verbose("Sending message to forwarder: "+a._Store.activeForwarders[k].name),a._Store.activeForwarders[k].process){var q=a._Store.activeForwarders[k].process(c);q&&a.Logger.verbose(q);}}}},this.callSetUserAttributeOnForwarders=function(c,d){b&&b.isAttributeKeyBlocked(c)||a._Store.activeForwarders.length&&a._Store.activeForwarders.forEach(function(b){if(b.setUserAttribute&&b.userAttributeFilters&&!a._Helpers.inArray(b.userAttributeFilters,a._Helpers.generateHash(c)))try{var e=b.setUserAttribute(c,d);e&&a.Logger.verbose(e);}catch(b){a.Logger.error(b);}});},this.setForwarderUserIdentities=function(b){a._Store.activeForwarders.forEach(function(c){var d=a._Helpers.filterUserIdentities(b,c.userIdentityFilters);c.setUserIdentity&&d.forEach(function(b){var d=c.setUserIdentity(b.Identity,b.Type);d&&a.Logger.verbose(d);});});},this.setForwarderOnUserIdentified=function(c){a._Store.activeForwarders.forEach(function(d){var e=filteredMparticleUser(c.getMPID(),d,a,b);if(d.onUserIdentified){var f=d.onUserIdentified(e);f&&a.Logger.verbose(f);}});},this.setForwarderOnIdentityComplete=function(c,d){var e;a._Store.activeForwarders.forEach(function(f){var g=filteredMparticleUser(c.getMPID(),f,a,b);"identify"===d?f.onIdentifyComplete&&(e=f.onIdentifyComplete(g),e&&a.Logger.verbose(e)):"login"===d?f.onLoginComplete&&(e=f.onLoginComplete(g),e&&a.Logger.verbose(e)):"logout"===d?f.onLogoutComplete&&(e=f.onLogoutComplete(g),e&&a.Logger.verbose(e)):"modify"==d&&f.onModifyComplete&&(e=f.onModifyComplete(g),e&&a.Logger.verbose(e));});},this.getForwarderStatsQueue=function(){return a._Persistence.forwardingStatsBatches.forwardingStatsEventQueue},this.setForwarderStatsQueue=function(b){a._Persistence.forwardingStatsBatches.forwardingStatsEventQueue=b;},this.configureForwarder=function(b){var c=null,d=b,e={};// if there are kits inside of mpInstance._Store.SDKConfig.kits, then mParticle is self hosted
for(var f in a._Helpers.isObject(a._Store.SDKConfig.kits)&&0<Object.keys(a._Store.SDKConfig.kits).length?e=a._Store.SDKConfig.kits:0<a._preInit.forwarderConstructors.length&&a._preInit.forwarderConstructors.forEach(function(a){e[a.name]=a;}),e)if(f===d.name&&(d.isDebug===a._Store.SDKConfig.isDevelopmentMode||d.isSandbox===a._Store.SDKConfig.isDevelopmentMode)){c=new e[f].constructor,c.id=d.moduleId,c.isSandbox=d.isDebug||d.isSandbox,c.hasSandbox="true"===d.hasDebugString,c.isVisible=d.isVisible,c.settings=d.settings,c.eventNameFilters=d.eventNameFilters,c.eventTypeFilters=d.eventTypeFilters,c.attributeFilters=d.attributeFilters,c.screenNameFilters=d.screenNameFilters,c.screenNameFilters=d.screenNameFilters,c.screenAttributeFilters=d.screenAttributeFilters,c.userIdentityFilters=d.userIdentityFilters,c.userAttributeFilters=d.userAttributeFilters,c.filteringEventAttributeValue=d.filteringEventAttributeValue,c.filteringUserAttributeValue=d.filteringUserAttributeValue,c.eventSubscriptionId=d.eventSubscriptionId,c.filteringConsentRuleValues=d.filteringConsentRuleValues,c.excludeAnonymousUser=d.excludeAnonymousUser,a._Store.configuredForwarders.push(c);break}},this.configurePixel=function(b){(b.isDebug===a._Store.SDKConfig.isDevelopmentMode||b.isProduction!==a._Store.SDKConfig.isDevelopmentMode)&&a._Store.pixelConfigurations.push(b);},this.processForwarders=function(b,d){if(!b)a.Logger.warning("No config was passed. Cannot process forwarders");else try{Array.isArray(b.kitConfigs)&&b.kitConfigs.length&&b.kitConfigs.forEach(function(a){c.configureForwarder(a);}),Array.isArray(b.pixelConfigs)&&b.pixelConfigs.length&&b.pixelConfigs.forEach(function(a){c.configurePixel(a);}),c.initForwarders(a._Store.SDKConfig.identifyRequest.userIdentities,d);}catch(b){a.Logger.error("Config was not parsed propertly. Forwarders may not be initialized.");}};}

var MessageType$1=Types.MessageType,ApplicationTransitionType$1=Types.ApplicationTransitionType;function ServerModel(a){function b(a,b){var c=[];for(var d in b.flags={},a.CustomFlags)c=[],a.CustomFlags.hasOwnProperty(d)&&(Array.isArray(a.CustomFlags[d])?a.CustomFlags[d].forEach(function(a){("number"==typeof a||"string"==typeof a||"boolean"==typeof a)&&c.push(a.toString());}):("number"==typeof a.CustomFlags[d]||"string"==typeof a.CustomFlags[d]||"boolean"==typeof a.CustomFlags[d])&&c.push(a.CustomFlags[d].toString()),c.length&&(b.flags[d]=c));}function c(a){return a?a.map(function(a){return d(a)}):[]}function d(b){return {id:a._Helpers.parseStringOrNumber(b.Sku),nm:a._Helpers.parseStringOrNumber(b.Name),pr:a._Helpers.parseNumber(b.Price),qt:a._Helpers.parseNumber(b.Quantity),br:a._Helpers.parseStringOrNumber(b.Brand),va:a._Helpers.parseStringOrNumber(b.Variant),ca:a._Helpers.parseStringOrNumber(b.Category),ps:a._Helpers.parseNumber(b.Position),cc:a._Helpers.parseStringOrNumber(b.CouponCode),tpa:a._Helpers.parseNumber(b.TotalAmount),attrs:b.Attributes}}var e=this;this.appendUserInfo=function(b,c){if(c){if(!b)return c.MPID=null,c.ConsentState=null,c.UserAttributes=null,void(c.UserIdentities=null);if(!(c.MPID&&c.MPID===b.getMPID())){c.MPID=b.getMPID(),c.ConsentState=b.getConsentState(),c.UserAttributes=b.getAllUserAttributes();var d=b.getUserIdentities().userIdentities,e={};for(var f in d){var g=Types.IdentityType.getIdentityType(f);!1!==g&&(e[g]=d[f]);}var h=[];if(a._Helpers.isObject(e)&&Object.keys(e).length)for(var i in e){var j={};j.Identity=e[i],j.Type=a._Helpers.parseNumber(i),h.push(j);}c.UserIdentities=h;}}},this.convertToConsentStateDTO=function(a){if(!a)return null;var b={},c=a.getGDPRConsentState();if(c){var d={};for(var e in b.gdpr=d,c)if(c.hasOwnProperty(e)){var f=c[e];b.gdpr[e]={},"boolean"==typeof f.Consented&&(d[e].c=f.Consented),"number"==typeof f.Timestamp&&(d[e].ts=f.Timestamp),"string"==typeof f.ConsentDocument&&(d[e].d=f.ConsentDocument),"string"==typeof f.Location&&(d[e].l=f.Location),"string"==typeof f.HardwareId&&(d[e].h=f.HardwareId);}}var g=a.getCCPAConsentState();return g&&(b.ccpa={data_sale_opt_out:{c:g.Consented,ts:g.Timestamp,d:g.ConsentDocument,l:g.Location,h:g.HardwareId}}),b},this.createEventObject=function(b,c){var d={},f={},g=b.messageType===Types.MessageType.OptOut?!a._Store.isEnabled:null;if(a._Store.sessionId||b.messageType==Types.MessageType.OptOut||a._Store.webviewBridgeEnabled){f=b.hasOwnProperty("toEventAPIObject")?b.toEventAPIObject():{EventName:b.name||b.messageType,EventCategory:b.eventType,EventAttributes:a._Helpers.sanitizeAttributes(b.data,b.name),SourceMessageId:b.sourceMessageId||a._Helpers.generateUniqueId(),EventDataType:b.messageType,CustomFlags:b.customFlags||{},UserAttributeChanges:b.userAttributeChanges,UserIdentityChanges:b.userIdentityChanges},b.messageType!==Types.MessageType.SessionEnd&&(a._Store.dateLastEventSent=new Date),d={Store:a._Store.serverSettings,SDKVersion:Constants.sdkVersion,SessionId:a._Store.sessionId,SessionStartDate:a._Store.sessionStartDate?a._Store.sessionStartDate.getTime():0,Debug:a._Store.SDKConfig.isDevelopmentMode,Location:a._Store.currentPosition,OptOut:g,ExpandedEventCount:0,AppVersion:a.getAppVersion(),AppName:a.getAppName(),ClientGeneratedId:a._Store.clientId,DeviceId:a._Store.deviceId,IntegrationAttributes:a._Store.integrationAttributes,CurrencyCode:a._Store.currencyCode,DataPlan:a._Store.SDKConfig.dataPlan?a._Store.SDKConfig.dataPlan:{}},f.EventDataType===MessageType$1.AppStateTransition&&(f.IsFirstRun=a._Store.isFirstRun),f.CurrencyCode=a._Store.currencyCode;var h=c||a.Identity.getCurrentUser();return e.appendUserInfo(h,f),b.messageType===Types.MessageType.SessionEnd&&(f.SessionLength=a._Store.dateLastEventSent.getTime()-a._Store.sessionStartDate.getTime(),f.currentSessionMPIDs=a._Store.currentSessionMPIDs,f.EventAttributes=a._Store.sessionAttributes,a._Store.currentSessionMPIDs=[],a._Store.sessionStartDate=null),d.Timestamp=a._Store.dateLastEventSent.getTime(),a._Helpers.extend({},f,d)}return null},this.convertEventToDTO=function(d){var f={n:d.EventName,et:d.EventCategory,ua:d.UserAttributes,ui:d.UserIdentities,ia:d.IntegrationAttributes,str:d.Store,attrs:d.EventAttributes,sdk:d.SDKVersion,sid:d.SessionId,sl:d.SessionLength,ssd:d.SessionStartDate,dt:d.EventDataType,dbg:d.Debug,ct:d.Timestamp,lc:d.Location,o:d.OptOut,eec:d.ExpandedEventCount,av:d.AppVersion,cgid:d.ClientGeneratedId,das:d.DeviceId,mpid:d.MPID,smpids:d.currentSessionMPIDs};d.DataPlan&&d.DataPlan.PlanId&&(f.dp_id=d.DataPlan.PlanId,d.DataPlan.PlanVersion&&(f.dp_v=d.DataPlan.PlanVersion));var g=e.convertToConsentStateDTO(d.ConsentState);return g&&(f.con=g),d.EventDataType===MessageType$1.AppStateTransition&&(f.fr=d.IsFirstRun,f.iu=!1,f.at=ApplicationTransitionType$1.AppInit,f.lr=window.location.href||null,f.attrs=null),d.CustomFlags&&b(d,f),d.EventDataType===MessageType$1.Commerce?(f.cu=d.CurrencyCode,d.ShoppingCart&&(f.sc={pl:c(d.ShoppingCart.ProductList)}),d.ProductAction?f.pd={an:d.ProductAction.ProductActionType,cs:a._Helpers.parseNumber(d.ProductAction.CheckoutStep),co:d.ProductAction.CheckoutOptions,pl:c(d.ProductAction.ProductList),ti:d.ProductAction.TransactionId,ta:d.ProductAction.Affiliation,tcc:d.ProductAction.CouponCode,tr:a._Helpers.parseNumber(d.ProductAction.TotalAmount),ts:a._Helpers.parseNumber(d.ProductAction.ShippingAmount),tt:a._Helpers.parseNumber(d.ProductAction.TaxAmount)}:d.PromotionAction?f.pm={an:d.PromotionAction.PromotionActionType,pl:d.PromotionAction.PromotionList.map(function(a){return {id:a.Id,nm:a.Name,cr:a.Creative,ps:a.Position?a.Position:0}})}:d.ProductImpressions&&(f.pi=d.ProductImpressions.map(function(a){return {pil:a.ProductImpressionList,pl:c(a.ProductList)}}))):d.EventDataType===MessageType$1.Profile&&(f.pet=d.ProfileMessageType),f};}

function forwardingStatsUploader(a){function b(){var b=a._Forwarders.getForwarderStatsQueue(),c=a._Persistence.forwardingStatsBatches.uploadsTable,d=Date.now();for(var e in b.length&&(c[d]={uploading:!1,data:b},a._Forwarders.setForwarderStatsQueue([])),c)(function(b){if(c.hasOwnProperty(b)&&!1===c[b].uploading){var d=function(){4===e.readyState&&(200===e.status||202===e.status?(a.Logger.verbose("Successfully sent  "+e.statusText+" from server"),delete c[b]):"4"===e.status.toString()[0]?429!==e.status&&delete c[b]:c[b].uploading=!1);},e=a._Helpers.createXHR(d),f=c[b].data;c[b].uploading=!0,a._APIClient.sendBatchForwardingStatsToServer(f,e);}})(e);}this.startForwardingStatsTimer=function(){mParticle._forwardingStatsTimer=setInterval(function(){b();},a._Store.SDKConfig.forwarderStatsTimeout);};}

var Messages$7=Constants.Messages,HTTPCodes=Constants.HTTPCodes;function Identity(t){var s=this;/**
     * Invoke these methods on the mParticle.Identity object.
     * Example: mParticle.Identity.getCurrentUser().
     * @class mParticle.Identity
     */ /**
     * Invoke these methods on the mParticle.Identity.getCurrentUser() object.
     * Example: mParticle.Identity.getCurrentUser().getAllUserAttributes()
     * @class mParticle.Identity.getCurrentUser()
     */ /**
     * Invoke these methods on the mParticle.Identity.getCurrentUser().getCart() object.
     * Example: mParticle.Identity.getCurrentUser().getCart().add(...);
     * @class mParticle.Identity.getCurrentUser().getCart()
     * @deprecated
     */ // send a user identity change request on identify, login, logout, modify when any values change.
// compare what identities exist vs what is previously was for the specific user if they were in memory before.
// if it's the first time the user is logging in, send a user identity change request with
this.checkIdentitySwap=function(e,s,r){if(e&&s&&e!==s){var i=t._Persistence.getPersistence();i&&(i.cu=s,i.gs.csm=r,t._Persistence.savePersistence(i));}},this.IdentityRequest={createKnownIdentities:function createKnownIdentities(e,s){var r={};if(e&&e.userIdentities&&t._Helpers.isObject(e.userIdentities))for(var i in e.userIdentities)r[i]=e.userIdentities[i];return r.device_application_stamp=s,r},preProcessIdentityRequest:function preProcessIdentityRequest(e,s,r){t.Logger.verbose(Messages$7.InformationMessages.StartingLogEvent+": "+r);var i=t._Helpers.Validators.validateIdentities(e,r);if(!i.valid)return t.Logger.error("ERROR: "+i.error),{valid:!1,error:i.error};if(s&&!t._Helpers.Validators.isFunction(s)){var n="The optional callback must be a function. You tried entering a(n) "+_typeof_1(s);return t.Logger.error(n),{valid:!1,error:n}}return {valid:!0}},createIdentityRequest:function createIdentityRequest(e,s,r,i,n,o,a){var d={client_sdk:{platform:s,sdk_vendor:r,sdk_version:i},context:o,environment:t._Store.SDKConfig.isDevelopmentMode?"development":"production",request_id:t._Helpers.generateUniqueId(),request_timestamp_ms:new Date().getTime(),previous_mpid:a||null,known_identities:this.createKnownIdentities(e,n)};return d},createModifyIdentityRequest:function createModifyIdentityRequest(e,s,r,i,n,o){return {client_sdk:{platform:r,sdk_vendor:i,sdk_version:n},context:o,environment:t._Store.SDKConfig.isDevelopmentMode?"development":"production",request_id:t._Helpers.generateUniqueId(),request_timestamp_ms:new Date().getTime(),identity_changes:this.createIdentityChanges(e,s)}},createIdentityChanges:function createIdentityChanges(e,s){var r,i=[];if(s&&t._Helpers.isObject(s)&&e&&t._Helpers.isObject(e))for(r in s)i.push({old_value:e[r]||null,new_value:s[r],identity_type:r});return i},// takes 2 UI objects keyed by name, combines them, returns them keyed by type
combineUserIdentities:function combineUserIdentities(e,s){var r={},i=t._Helpers.extend(e,s);for(var n in i){var o=Types.IdentityType.getIdentityType(n);// this check removes anything that is not whitelisted as an identity type
!1!==o&&0<=o&&(r[Types.IdentityType.getIdentityType(n)]=i[n]);}return r},createAliasNetworkRequest:function createAliasNetworkRequest(e){return {request_id:t._Helpers.generateUniqueId(),request_type:"alias",environment:t._Store.SDKConfig.isDevelopmentMode?"development":"production",api_key:t._Store.devToken,data:{destination_mpid:e.destinationMpid,source_mpid:e.sourceMpid,start_unixtime_ms:e.startTime,end_unixtime_ms:e.endTime,scope:e.scope,device_application_stamp:t._Store.deviceId}}},convertAliasToNative:function convertAliasToNative(e){return {DestinationMpid:e.destinationMpid,SourceMpid:e.sourceMpid,StartUnixtimeMs:e.startTime,EndUnixtimeMs:e.endTime}},convertToNative:function convertToNative(e){var t=[];if(e&&e.userIdentities){for(var s in e.userIdentities)e.userIdentities.hasOwnProperty(s)&&t.push({Type:Types.IdentityType.getIdentityType(s),Identity:e.userIdentities[s]});return {UserIdentities:t}}}},this.IdentityAPI={HTTPCodes:HTTPCodes,/**
         * Initiate a logout request to the mParticle server
         * @method identify
         * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
         * @param {Function} [callback] A callback function that is called when the identify request completes
         */identify:function identify(e,r){var i,n=t.Identity.getCurrentUser(),o=t._Identity.IdentityRequest.preProcessIdentityRequest(e,r,"identify");if(n&&(i=n.getMPID()),o.valid){var a=t._Identity.IdentityRequest.createIdentityRequest(e,Constants.platform,Constants.sdkVendor,Constants.sdkVersion,t._Store.deviceId,t._Store.context,i);t._Helpers.canLog()?t._Store.webviewBridgeEnabled?(t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Identify,JSON.stringify(t._Identity.IdentityRequest.convertToNative(e))),t._Helpers.invokeCallback(r,HTTPCodes.nativeIdentityRequest,"Identify request sent to native sdk")):t._IdentityAPIClient.sendIdentityRequest(a,"identify",r,e,s.parseIdentityResponse,i):(t._Helpers.invokeCallback(r,HTTPCodes.loggingDisabledOrMissingAPIKey,Messages$7.InformationMessages.AbandonLogEvent),t.Logger.verbose(Messages$7.InformationMessages.AbandonLogEvent));}else t._Helpers.invokeCallback(r,HTTPCodes.validationIssue,o.error),t.Logger.verbose(o);},/**
         * Initiate a logout request to the mParticle server
         * @method logout
         * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
         * @param {Function} [callback] A callback function that is called when the logout request completes
         */logout:function logout(e,r){var i,n=t.Identity.getCurrentUser(),o=t._Identity.IdentityRequest.preProcessIdentityRequest(e,r,"logout");if(n&&(i=n.getMPID()),o.valid){var a,d=t._Identity.IdentityRequest.createIdentityRequest(e,Constants.platform,Constants.sdkVendor,Constants.sdkVersion,t._Store.deviceId,t._Store.context,i);t._Helpers.canLog()?t._Store.webviewBridgeEnabled?(t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Logout,JSON.stringify(t._Identity.IdentityRequest.convertToNative(e))),t._Helpers.invokeCallback(r,HTTPCodes.nativeIdentityRequest,"Logout request sent to native sdk")):(t._IdentityAPIClient.sendIdentityRequest(d,"logout",r,e,s.parseIdentityResponse,i),a=t._ServerModel.createEventObject({messageType:Types.MessageType.Profile}),a.ProfileMessageType=Types.ProfileMessageType.Logout,t._Store.activeForwarders.length&&t._Store.activeForwarders.forEach(function(e){e.logOut&&e.logOut(a);})):(t._Helpers.invokeCallback(r,HTTPCodes.loggingDisabledOrMissingAPIKey,Messages$7.InformationMessages.AbandonLogEvent),t.Logger.verbose(Messages$7.InformationMessages.AbandonLogEvent));}else t._Helpers.invokeCallback(r,HTTPCodes.validationIssue,o.error),t.Logger.verbose(o);},/**
         * Initiate a login request to the mParticle server
         * @method login
         * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
         * @param {Function} [callback] A callback function that is called when the login request completes
         */login:function login(e,r){var i,n=t.Identity.getCurrentUser(),o=t._Identity.IdentityRequest.preProcessIdentityRequest(e,r,"login");if(n&&(i=n.getMPID()),o.valid){var a=t._Identity.IdentityRequest.createIdentityRequest(e,Constants.platform,Constants.sdkVendor,Constants.sdkVersion,t._Store.deviceId,t._Store.context,i);t._Helpers.canLog()?t._Store.webviewBridgeEnabled?(t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Login,JSON.stringify(t._Identity.IdentityRequest.convertToNative(e))),t._Helpers.invokeCallback(r,HTTPCodes.nativeIdentityRequest,"Login request sent to native sdk")):t._IdentityAPIClient.sendIdentityRequest(a,"login",r,e,s.parseIdentityResponse,i):(t._Helpers.invokeCallback(r,HTTPCodes.loggingDisabledOrMissingAPIKey,Messages$7.InformationMessages.AbandonLogEvent),t.Logger.verbose(Messages$7.InformationMessages.AbandonLogEvent));}else t._Helpers.invokeCallback(r,HTTPCodes.validationIssue,o.error),t.Logger.verbose(o);},/**
         * Initiate a modify request to the mParticle server
         * @method modify
         * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
         * @param {Function} [callback] A callback function that is called when the modify request completes
         */modify:function modify(e,r){var i,n=t.Identity.getCurrentUser(),o=t._Identity.IdentityRequest.preProcessIdentityRequest(e,r,"modify");n&&(i=n.getMPID());var a=e&&e.userIdentities?e.userIdentities:{};if(o.valid){var d=t._Identity.IdentityRequest.createModifyIdentityRequest(n?n.getUserIdentities().userIdentities:{},a,Constants.platform,Constants.sdkVendor,Constants.sdkVersion,t._Store.context);t._Helpers.canLog()?t._Store.webviewBridgeEnabled?(t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Modify,JSON.stringify(t._Identity.IdentityRequest.convertToNative(e))),t._Helpers.invokeCallback(r,HTTPCodes.nativeIdentityRequest,"Modify request sent to native sdk")):t._IdentityAPIClient.sendIdentityRequest(d,"modify",r,e,s.parseIdentityResponse,i):(t._Helpers.invokeCallback(r,HTTPCodes.loggingDisabledOrMissingAPIKey,Messages$7.InformationMessages.AbandonLogEvent),t.Logger.verbose(Messages$7.InformationMessages.AbandonLogEvent));}else t._Helpers.invokeCallback(r,HTTPCodes.validationIssue,o.error),t.Logger.verbose(o);},/**
         * Returns a user object with methods to interact with the current user
         * @method getCurrentUser
         * @return {Object} the current user object
         */getCurrentUser:function getCurrentUser(){var e;return t._Store?(e=t._Store.mpid,e?(e=t._Store.mpid.slice(),s.mParticleUser(e,t._Store.isLoggedIn)):t._Store.webviewBridgeEnabled?s.mParticleUser():null):null},/**
         * Returns a the user object associated with the mpid parameter or 'null' if no such
         * user exists
         * @method getUser
         * @param {String} mpid of the desired user
         * @return {Object} the user for  mpid
         */getUser:function getUser(e){var r=t._Persistence.getPersistence();return r?r[e]&&!Constants.SDKv2NonMPIDCookieKeys.hasOwnProperty(e)?s.mParticleUser(e):null:null},/**
         * Returns all users, including the current user and all previous users that are stored on the device.
         * @method getUsers
         * @return {Array} array of users
         */getUsers:function getUsers(){var e=t._Persistence.getPersistence(),r=[];if(e)for(var i in e)Constants.SDKv2NonMPIDCookieKeys.hasOwnProperty(i)||r.push(s.mParticleUser(i));return r.sort(function(e,t){var s=e.getLastSeenTime()||0,r=t.getLastSeenTime()||0;return s>r?-1:1}),r},/**
         * Initiate an alias request to the mParticle server
         * @method aliasUsers
         * @param {Object} aliasRequest  object representing an AliasRequest
         * @param {Function} [callback] A callback function that is called when the aliasUsers request completes
         */aliasUsers:function aliasUsers(e,s){var r;if(e.destinationMpid&&e.sourceMpid||(r=Messages$7.ValidationMessages.AliasMissingMpid),e.destinationMpid===e.sourceMpid&&(r=Messages$7.ValidationMessages.AliasNonUniqueMpid),e.startTime&&e.endTime||(r=Messages$7.ValidationMessages.AliasMissingTime),e.startTime>e.endTime&&(r=Messages$7.ValidationMessages.AliasStartBeforeEndTime),r)return t.Logger.warning(r),void t._Helpers.invokeAliasCallback(s,HTTPCodes.validationIssue,r);if(!t._Helpers.canLog())t._Helpers.invokeAliasCallback(s,HTTPCodes.loggingDisabledOrMissingAPIKey,Messages$7.InformationMessages.AbandonAliasUsers),t.Logger.verbose(Messages$7.InformationMessages.AbandonAliasUsers);else if(t._Store.webviewBridgeEnabled)t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Alias,JSON.stringify(t._Identity.IdentityRequest.convertAliasToNative(e))),t._Helpers.invokeAliasCallback(s,HTTPCodes.nativeIdentityRequest,"Alias request sent to native sdk");else {t.Logger.verbose(Messages$7.InformationMessages.StartingAliasRequest+": "+e.sourceMpid+" -> "+e.destinationMpid);var i=t._Identity.IdentityRequest.createAliasNetworkRequest(e);t._IdentityAPIClient.sendAliasRequest(i,s);}},/**
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
        */createAliasRequest:function createAliasRequest(e,s){try{if(!s||!e)return t.Logger.error("'destinationUser' and 'sourceUser' must both be present"),null;var r=e.getFirstSeenTime();r||t.Identity.getUsers().forEach(function(e){e.getFirstSeenTime()&&(!r||e.getFirstSeenTime()<r)&&(r=e.getFirstSeenTime());});var i=new Date().getTime()-1e3*(60*(60*(24*t._Store.SDKConfig.aliasMaxWindow))),n=e.getLastSeenTime()||new Date().getTime();return r<i&&(r=i,n<r&&t.Logger.warning("Source User has not been seen in the last "+t._Store.SDKConfig.maxAliasWindow+" days, Alias Request will likely fail")),{destinationMpid:s.getMPID(),sourceMpid:e.getMPID(),startTime:r,endTime:n}}catch(s){return t.Logger.error("There was a problem with creating an alias request: "+s),null}}},this.mParticleUser=function(e,s){var r=this;return {/**
             * Get user identities for current user
             * @method getUserIdentities
             * @return {Object} an object with userIdentities as its key
             */getUserIdentities:function getUserIdentities(){var s={},r=t._Persistence.getUserIdentities(e);for(var i in r)r.hasOwnProperty(i)&&(s[Types.IdentityType.getIdentityName(t._Helpers.parseNumber(i))]=r[i]);return {userIdentities:s}},/**
             * Get the MPID of the current user
             * @method getMPID
             * @return {String} the current user MPID as a string
             */getMPID:function getMPID(){return e},/**
             * Sets a user tag
             * @method setUserTag
             * @param {String} tagName
             */setUserTag:function setUserTag(e){return t._Helpers.Validators.isValidKeyValue(e)?void this.setUserAttribute(e,null):void t.Logger.error(Messages$7.ErrorMessages.BadKey)},/**
             * Removes a user tag
             * @method removeUserTag
             * @param {String} tagName
             */removeUserTag:function removeUserTag(e){return t._Helpers.Validators.isValidKeyValue(e)?void this.removeUserAttribute(e):void t.Logger.error(Messages$7.ErrorMessages.BadKey)},/**
             * Sets a user attribute
             * @method setUserAttribute
             * @param {String} key
             * @param {String} value
             */setUserAttribute:function setUserAttribute(s,i){var n,o,a,d;if(t._SessionManager.resetSessionTimer(),t._Helpers.canLog()){if(!t._Helpers.Validators.isValidAttributeValue(i))return void t.Logger.error(Messages$7.ErrorMessages.BadAttribute);if(!t._Helpers.Validators.isValidKeyValue(s))return void t.Logger.error(Messages$7.ErrorMessages.BadKey);if(t._Store.webviewBridgeEnabled)t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetUserAttribute,JSON.stringify({key:s,value:i}));else {n=t._Persistence.getPersistence(),o=this.getAllUserAttributes();var g=t._Helpers.findKeyInObject(o,s);g?(d=!1,a=o[g],delete o[g]):d=!0,o[s]=i,n&&n[e]&&(n[e].ua=o,t._Persistence.savePersistence(n,e)),r.sendUserAttributeChangeEvent(s,i,a,d,!1,this),t._Forwarders.initForwarders(r.IdentityAPI.getCurrentUser().getUserIdentities(),t._APIClient.prepareForwardingStats),t._Forwarders.callSetUserAttributeOnForwarders(s,i);}}},/**
             * Set multiple user attributes
             * @method setUserAttributes
             * @param {Object} user attribute object with keys of the attribute type, and value of the attribute value
             */setUserAttributes:function setUserAttributes(e){if(t._SessionManager.resetSessionTimer(),!t._Helpers.isObject(e))t.Logger.error("Must pass an object into setUserAttributes. You passed a "+_typeof_1(e));else if(t._Helpers.canLog())for(var s in e)e.hasOwnProperty(s)&&this.setUserAttribute(s,e[s]);},/**
             * Removes a specific user attribute
             * @method removeUserAttribute
             * @param {String} key
             */removeUserAttribute:function removeUserAttribute(s){var i,n;if(t._SessionManager.resetSessionTimer(),!t._Helpers.Validators.isValidKeyValue(s))return void t.Logger.error(Messages$7.ErrorMessages.BadKey);if(t._Store.webviewBridgeEnabled)t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.RemoveUserAttribute,JSON.stringify({key:s,value:null}));else {i=t._Persistence.getPersistence(),n=this.getAllUserAttributes();var o=t._Helpers.findKeyInObject(n,s);o&&(s=o);var a=n[s]?n[s].toString():null;delete n[s],i&&i[e]&&(i[e].ua=n,t._Persistence.savePersistence(i,e)),r.sendUserAttributeChangeEvent(s,null,a,!1,!0,this),t._Forwarders.initForwarders(r.IdentityAPI.getCurrentUser().getUserIdentities(),t._APIClient.prepareForwardingStats),t._Forwarders.applyToForwarders("removeUserAttribute",s);}},/**
             * Sets a list of user attributes
             * @method setUserAttributeList
             * @param {String} key
             * @param {Array} value an array of values
             */setUserAttributeList:function setUserAttributeList(s,n){var o,a,d,g,l;if(t._SessionManager.resetSessionTimer(),!t._Helpers.Validators.isValidKeyValue(s))return void t.Logger.error(Messages$7.ErrorMessages.BadKey);if(!Array.isArray(n))return void t.Logger.error("The value you passed in to setUserAttributeList must be an array. You passed in a "+("undefined"==typeof value?"undefined":_typeof_1(value)));var u=n.slice();if(t._Store.webviewBridgeEnabled)t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetUserAttributeList,JSON.stringify({key:s,value:u}));else {o=t._Persistence.getPersistence(),a=this.getAllUserAttributes();var p=t._Helpers.findKeyInObject(a,s);if(p?(g=!1,d=a[p],delete a[p]):g=!0,a[s]=u,o&&o[e]&&(o[e].ua=a,t._Persistence.savePersistence(o,e)),t._APIClient.shouldEnableBatching()){// If the new attributeList length is different previous, then there is a change event.
// Loop through new attributes list, see if they are all in the same index as previous user attributes list
// If there are any changes, break, and immediately send a userAttributeChangeEvent with full array as a value
if(!d||!Array.isArray(d))l=!0;else if(n.length!==d.length)l=!0;else for(var c=0;c<n.length;c++)if(d[c]!==n[c]){l=!0;break}l&&r.sendUserAttributeChangeEvent(s,n,d,g,!1,this);}t._Forwarders.initForwarders(r.IdentityAPI.getCurrentUser().getUserIdentities(),t._APIClient.prepareForwardingStats),t._Forwarders.callSetUserAttributeOnForwarders(s,u);}},/**
             * Removes all user attributes
             * @method removeAllUserAttributes
             */removeAllUserAttributes:function removeAllUserAttributes(){var e;if(t._SessionManager.resetSessionTimer(),t._Store.webviewBridgeEnabled)t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.RemoveAllUserAttributes);else if(e=this.getAllUserAttributes(),t._Forwarders.initForwarders(r.IdentityAPI.getCurrentUser().getUserIdentities(),t._APIClient.prepareForwardingStats),e)for(var s in e)e.hasOwnProperty(s)&&t._Forwarders.applyToForwarders("removeUserAttribute",s),this.removeUserAttribute(s);},/**
             * Returns all user attribute keys that have values that are arrays
             * @method getUserAttributesLists
             * @return {Object} an object of only keys with array values. Example: { attr1: [1, 2, 3], attr2: ['a', 'b', 'c'] }
             */getUserAttributesLists:function getUserAttributesLists(){var e,t={};for(var s in e=this.getAllUserAttributes(),e)e.hasOwnProperty(s)&&Array.isArray(e[s])&&(t[s]=e[s].slice());return t},/**
             * Returns all user attributes
             * @method getAllUserAttributes
             * @return {Object} an object of all user attributes. Example: { attr1: 'value1', attr2: ['a', 'b', 'c'] }
             */getAllUserAttributes:function getAllUserAttributes(){var s={},r=t._Persistence.getAllUserAttributes(e);if(r)for(var i in r)r.hasOwnProperty(i)&&(s[i]=Array.isArray(r[i])?r[i].slice():r[i]);return s},/**
             * Returns the cart object for the current user
             * @method getCart
             * @return a cart object
             */getCart:function getCart(){return t.Logger.warning("Deprecated function Identity.getCurrentUser().getCart() will be removed in future releases"),r.mParticleUserCart(e)},/**
             * Returns the Consent State stored locally for this user.
             * @method getConsentState
             * @return a ConsentState object
             */getConsentState:function getConsentState(){return t._Persistence.getConsentState(e)},/**
             * Sets the Consent State stored locally for this user.
             * @method setConsentState
             * @param {Object} consent state
             */setConsentState:function setConsentState(s){t._Persistence.saveUserConsentStateToCookies(e,s),t._Forwarders.initForwarders(this.getUserIdentities().userIdentities,t._APIClient.prepareForwardingStats),t._CookieSyncManager.attemptCookieSync(null,this.getMPID());},isLoggedIn:function isLoggedIn(){return s},getLastSeenTime:function getLastSeenTime(){return t._Persistence.getLastSeenTime(e)},getFirstSeenTime:function getFirstSeenTime(){return t._Persistence.getFirstSeenTime(e)}}},this.mParticleUserCart=function(e){return {/**
             * Adds a cart product to the user cart
             * @method add
             * @param {Object} product the product
             * @param {Boolean} [logEvent] a boolean to log adding of the cart object. If blank, no logging occurs.
             * @deprecated
             */add:function add(s,r){t.Logger.warning("Deprecated function Identity.getCurrentUser().getCart().add() will be removed in future releases");var i,n,o;if(o=Array.isArray(s)?s.slice():[s],o.forEach(function(e){e.Attributes=t._Helpers.sanitizeAttributes(e.Attributes);}),t._Store.webviewBridgeEnabled)t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.AddToCart,JSON.stringify(o));else {t._SessionManager.resetSessionTimer(),n=t._Persistence.getUserProductsFromLS(e),n=n.concat(o),!0===r&&t._Events.logProductActionEvent(Types.ProductActionType.AddToCart,o);n.length>t._Store.SDKConfig.maxProducts&&(t.Logger.verbose("The cart contains "+n.length+" items. Only "+t._Store.SDKConfig.maxProducts+" can currently be saved in cookies."),n=n.slice(-t._Store.SDKConfig.maxProducts)),i=t._Persistence.getAllUserProductsFromLS(),i[e].cp=n,t._Persistence.setCartProducts(i);}},/**
             * Removes a cart product from the current user cart
             * @method remove
             * @param {Object} product the product
             * @param {Boolean} [logEvent] a boolean to log adding of the cart object. If blank, no logging occurs.
             * @deprecated
             */remove:function remove(s,r){t.Logger.warning("Deprecated function Identity.getCurrentUser().getCart().remove() will be removed in future releases");var i,n,o=-1,a=null;if(t._Store.webviewBridgeEnabled)t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.RemoveFromCart,JSON.stringify(s));else {t._SessionManager.resetSessionTimer(),n=t._Persistence.getUserProductsFromLS(e),n&&(n.forEach(function(e,t){e.Sku===s.Sku&&(o=t,a=e);}),-1<o&&(n.splice(o,1),!0===r&&t._Events.logProductActionEvent(Types.ProductActionType.RemoveFromCart,a)));i=t._Persistence.getAllUserProductsFromLS(),i[e].cp=n,t._Persistence.setCartProducts(i);}},/**
             * Clears the user's cart
             * @method clear
             * @deprecated
             */clear:function clear(){t.Logger.warning("Deprecated function Identity.getCurrentUser().getCart().clear() will be removed in future releases");var s;t._Store.webviewBridgeEnabled?t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.ClearCart):(t._SessionManager.resetSessionTimer(),s=t._Persistence.getAllUserProductsFromLS(),s&&s[e]&&s[e].cp&&(s[e].cp=[],s[e].cp=[],t._Persistence.setCartProducts(s)));},/**
             * Returns all cart products
             * @method getCartProducts
             * @return {Array} array of cart products
             * @deprecated
             */getCartProducts:function getCartProducts(){return t.Logger.warning("Deprecated function Identity.getCurrentUser().getCart().getCartProducts() will be removed in future releases"),t._Persistence.getCartProducts(e)}}},this.parseIdentityResponse=function(r,i,n,o,a){var d,g,l,u,p=t.Identity.getUser(i),c={},y=p?p.getUserIdentities().userIdentities:{},I=t._Helpers.extend({},y);t._Store.identityCallInFlight=!1;try{if(t.Logger.verbose("Parsing \""+a+"\" identity response from server"),r.responseText&&(l=JSON.parse(r.responseText),l.hasOwnProperty("is_logged_in")&&(t._Store.isLoggedIn=l.is_logged_in)),(!p||p.getMPID()&&l.mpid&&l.mpid!==p.getMPID())&&(t._Store.mpid=l.mpid,p&&t._Persistence.setLastSeenTime(i),!t._Persistence.getFirstSeenTime(l.mpid)&&(g=!0),t._Persistence.setFirstSeenTime(l.mpid)),200===r.status){if("modify"===a)c=t._Identity.IdentityRequest.combineUserIdentities(y,o.userIdentities),t._Persistence.saveUserIdentitiesToPersistence(i,c);else {var _=s.IdentityAPI.getUser(l.mpid),v=_?_.getUserIdentities().userIdentities:{},m=t._Helpers.extend({},v);//if there is any previous migration data
if(t.Logger.verbose("Successfully parsed Identity Response"),"identify"==a&&p&&l.mpid===p.getMPID()&&t._Persistence.setFirstSeenTime(l.mpid),u=t._Store.currentSessionMPIDs.indexOf(l.mpid),t._Store.sessionId&&l.mpid&&i!==l.mpid&&0>u&&t._Store.currentSessionMPIDs.push(l.mpid),-1<u&&(t._Store.currentSessionMPIDs=t._Store.currentSessionMPIDs.slice(0,u).concat(t._Store.currentSessionMPIDs.slice(u+1,t._Store.currentSessionMPIDs.length)),t._Store.currentSessionMPIDs.push(l.mpid)),t._CookieSyncManager.attemptCookieSync(i,l.mpid,g),s.checkIdentitySwap(i,l.mpid,t._Store.currentSessionMPIDs),Object.keys(t._Store.migrationData).length){c=t._Store.migrationData.userIdentities||{};var S=t._Store.migrationData.userAttributes||{};t._Persistence.saveUserAttributesToPersistence(l.mpid,S);}else o&&o.userIdentities&&Object.keys(o.userIdentities).length&&(c=s.IdentityRequest.combineUserIdentities(v,o.userIdentities));t._Persistence.saveUserIdentitiesToPersistence(l.mpid,c),t._Persistence.update(),t._Persistence.findPrevCookiesBasedOnUI(o),t._Store.context=l.context||t._Store.context;}if(d=t.Identity.getCurrentUser(),o&&o.onUserAlias&&t._Helpers.Validators.isFunction(o.onUserAlias))try{t.Logger.warning("Deprecated function onUserAlias will be removed in future releases"),o.onUserAlias(p,d);}catch(s){t.Logger.error("There was an error with your onUserAlias function - "+s);}var P=t._Persistence.getPersistence();d&&(t._Persistence.storeDataInMemory(P,d.getMPID()),(!p||d.getMPID()!==p.getMPID()||p.isLoggedIn()!==d.isLoggedIn())&&t._Forwarders.initForwarders(d.getUserIdentities().userIdentities,t._APIClient.prepareForwardingStats),t._Forwarders.setForwarderUserIdentities(d.getUserIdentities().userIdentities),t._Forwarders.setForwarderOnIdentityComplete(d,a),t._Forwarders.setForwarderOnUserIdentified(d,a));var b={};for(var A in c)b[Types.IdentityType.getIdentityName(t._Helpers.parseNumber(A))]=c[A];s.sendUserIdentityChangeEvent(b,a,l.mpid,"modify"===a?I:m);}n?0===r.status?t._Helpers.invokeCallback(n,HTTPCodes.noHttpCoverage,l||null,d):t._Helpers.invokeCallback(n,r.status,l||null,d):l&&l.errors&&l.errors.length&&t.Logger.error("Received HTTP response code of "+r.status+" - "+l.errors[0].message),t._APIClient.processQueuedEvents();}catch(s){n&&t._Helpers.invokeCallback(n,r.status,l||null),t.Logger.error("Error parsing JSON response from Identity server: "+s);}},this.sendUserIdentityChangeEvent=function(e,r,i,n){var o,a;if(t._APIClient.shouldEnableBatching()&&(i||"modify"===r))for(var d in o=this.IdentityAPI.getUser(i),e)if(n[d]!==e[d]){var g=!n[d];a=s.createUserIdentityChange(d,e[d],n[d],g,o),t._APIClient.sendEventToServer(a);}},this.createUserIdentityChange=function(e,s,r,i,n){var o;return o=t._ServerModel.createEventObject({messageType:Types.MessageType.UserIdentityChange,userIdentityChanges:{New:{IdentityType:e,Identity:s,CreatedThisBatch:i},Old:{IdentityType:e,Identity:r,CreatedThisBatch:!1}},userInMemory:n}),o},this.sendUserAttributeChangeEvent=function(e,r,i,n,o,a){if(t._APIClient.shouldEnableBatching()){var d=s.createUserAttributeChange(e,r,i,n,o,a);d&&t._APIClient.sendEventToServer(d);}},this.createUserAttributeChange=function(e,s,r,i,n,o){r||(r=null);var a;return s!==r&&(a=t._ServerModel.createEventObject({messageType:Types.MessageType.UserAttributeChange,userAttributeChanges:{UserAttributeName:e,New:s,Old:r||null,Deleted:n,IsNewAttribute:i}},o)),a};}

function Consent(a){var b=this,c="data_sale_opt_out";// this function is called when consent is required to determine if a cookie sync should happen, or a forwarder should be initialized
this.isEnabledForUserConsent=function(b,c){if(!b||!b.values||!b.values.length)return !0;if(!c)return !1;var d,e={},f=c.getConsentState();if(f){// the server hashes consent purposes in the following way:
// GDPR - '1' + purpose name
// CCPA - '2data_sale_opt_out' (there is only 1 purpose of data_sale_opt_out for CCPA)
var g=f.getGDPRConsentState();if(g)for(var h in g)g.hasOwnProperty(h)&&(d=a._Helpers.generateHash("1"+h).toString(),e[d]=g[h].Consented);var i=f.getCCPAConsentState();i&&(d=a._Helpers.generateHash("2"+"data_sale_opt_out").toString(),e[d]=i.Consented);}var j=b.values.some(function(a){var b=a.consentPurpose,c=a.hasConsented;if(e.hasOwnProperty(b))return e[b]===c});return b.includeOnMatch===j},this.createPrivacyConsent=function(b,c,d,e,f){return "boolean"==typeof b?c&&isNaN(c)?(a.Logger.error("Timestamp must be a valid number when constructing a Consent object."),null):d&&"string"!=typeof d?(a.Logger.error("Document must be a valid string when constructing a Consent object."),null):e&&"string"!=typeof e?(a.Logger.error("Location must be a valid string when constructing a Consent object."),null):f&&"string"!=typeof f?(a.Logger.error("Hardware ID must be a valid string when constructing a Consent object."),null):{Consented:b,Timestamp:c||Date.now(),ConsentDocument:d,Location:e,HardwareId:f}:(a.Logger.error("Consented boolean is required when constructing a Consent object."),null)},this.ConsentSerialization={toMinifiedJsonObject:function toMinifiedJsonObject(a){var b={};if(a){var d=a.getGDPRConsentState();if(d)for(var e in b.gdpr={},d)if(d.hasOwnProperty(e)){var f=d[e];b.gdpr[e]={},"boolean"==typeof f.Consented&&(b.gdpr[e].c=f.Consented),"number"==typeof f.Timestamp&&(b.gdpr[e].ts=f.Timestamp),"string"==typeof f.ConsentDocument&&(b.gdpr[e].d=f.ConsentDocument),"string"==typeof f.Location&&(b.gdpr[e].l=f.Location),"string"==typeof f.HardwareId&&(b.gdpr[e].h=f.HardwareId);}var g=a.getCCPAConsentState();g&&(b.ccpa={},b.ccpa[c]={},"boolean"==typeof g.Consented&&(b.ccpa[c].c=g.Consented),"number"==typeof g.Timestamp&&(b.ccpa[c].ts=g.Timestamp),"string"==typeof g.ConsentDocument&&(b.ccpa[c].d=g.ConsentDocument),"string"==typeof g.Location&&(b.ccpa[c].l=g.Location),"string"==typeof g.HardwareId&&(b.ccpa[c].h=g.HardwareId));}return b},fromMinifiedJsonObject:function fromMinifiedJsonObject(a){var d=b.createConsentState();if(a.gdpr)for(var e in a.gdpr)if(a.gdpr.hasOwnProperty(e)){var f=b.createPrivacyConsent(a.gdpr[e].c,a.gdpr[e].ts,a.gdpr[e].d,a.gdpr[e].l,a.gdpr[e].h);d.addGDPRConsentState(e,f);}if(a.ccpa&&a.ccpa.hasOwnProperty(c)){var g=b.createPrivacyConsent(a.ccpa[c].c,a.ccpa[c].ts,a.ccpa[c].d,a.ccpa[c].l,a.ccpa[c].h);d.setCCPAConsentState(g);}return d}},this.createConsentState=function(d){function e(a){if("string"!=typeof a)return null;var b=a.trim();return b.length?b.toLowerCase():null}/**
         * Invoke these methods on a consent state object.
         * <p>
         * Usage: var consent = mParticle.Consent.createConsentState()
         * <br>
         * consent.setGDPRCoonsentState()
         *
         * @class Consent
         */ /**
         * Add a GDPR Consent State to the consent state object
         *
         * @method addGDPRConsentState
         * @param purpose [String] Data processing purpose that describes the type of processing done on the data subject’s data
         * @param gdprConsent [Object] A GDPR consent object created via mParticle.Consent.createGDPRConsent(...)
         */function f(c,d){var f=e(c);if(!f)return a.Logger.error("Purpose must be a string."),this;if(!a._Helpers.isObject(d))return a.Logger.error("Invoked with a bad or empty consent object."),this;var g=b.createPrivacyConsent(d.Consented,d.Timestamp,d.ConsentDocument,d.Location,d.HardwareId);return g&&(l[f]=g),this}function g(b){if(!b)l={};else if(a._Helpers.isObject(b))for(var c in l={},b)b.hasOwnProperty(c)&&f(c,b[c]);return this}/**
         * Remove a GDPR Consent State to the consent state object
         *
         * @method removeGDPRConsentState
         * @param purpose [String] Data processing purpose that describes the type of processing done on the data subject’s data
         */function h(a){var b=e(a);return b?(delete l[b],this):this}/**
         * Gets the GDPR Consent State
         *
         * @method getGDPRConsentState
         * @return {Object} A GDPR Consent State
         */function i(){return a._Helpers.extend({},l)}/**
         * Sets a CCPA Consent state (has a single purpose of 'data_sale_opt_out')
         *
         * @method setCCPAConsentState
         * @param {Object} ccpaConsent CCPA Consent State
         */function j(d){if(!a._Helpers.isObject(d))return a.Logger.error("Invoked with a bad or empty CCPA consent object."),this;var e=b.createPrivacyConsent(d.Consented,d.Timestamp,d.ConsentDocument,d.Location,d.HardwareId);return e&&(m[c]=e),this}/**
         * Gets the CCPA Consent State
         *
         * @method getCCPAConsentStatensent
         * @return {Object} A CCPA Consent State
         */ /**
         * Removes CCPA from the consent state object
         *
         * @method removeCCPAConsentState
         */function k(){return delete m[c],this}var l={},m={};return d&&(g(d.getGDPRConsentState()),j(d.getCCPAConsentState())),{setGDPRConsentState:g,addGDPRConsentState:f,setCCPAConsentState:j,getCCPAConsentState:function(){return m[c]},getGDPRConsentState:i,removeGDPRConsentState:h,removeCCPAState:function(){return a.Logger.warning("removeCCPAState is deprecated and will be removed in a future release; use removeCCPAConsentState instead"),k()},removeCCPAConsentState:k}};}

function ownKeys$1(a, b) { var c = Object.keys(a); if (Object.getOwnPropertySymbols) {
    var d = Object.getOwnPropertySymbols(a);
    b && (d = d.filter(function (b) { return Object.getOwnPropertyDescriptor(a, b).enumerable; })), c.push.apply(c, d);
} return c; }
function _objectSpread$1(a) { for (var b, c = 1; c < arguments.length; c++)
    b = null == arguments[c] ? {} : arguments[c], c % 2 ? ownKeys$1(Object(b), !0).forEach(function (c) { defineProperty(a, c, b[c]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(a, Object.getOwnPropertyDescriptors(b)) : ownKeys$1(Object(b)).forEach(function (c) { Object.defineProperty(a, c, Object.getOwnPropertyDescriptor(b, c)); }); return a; }
var DataPlanMatchType = { ScreenView: "screen_view", CustomEvent: "custom_event", Commerce: "commerce", UserAttributes: "user_attributes", UserIdentities: "user_identities", ProductAction: "product_action", PromotionAction: "promotion_action", ProductImpression: "product_impression" }, KitBlocker = /*#__PURE__*/ function () {
    function a(b, c) {
        var d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s = this; // if data plan is not requested, the data plan is {document: null}
        if (classCallCheck(this, a), defineProperty(this, "dataPlanMatchLookups", {}), defineProperty(this, "blockEvents", !1), defineProperty(this, "blockEventAttributes", !1), defineProperty(this, "blockUserAttributes", !1), defineProperty(this, "blockUserIdentities", !1), defineProperty(this, "kitBlockingEnabled", !1), defineProperty(this, "mpInstance", void 0), b && !b.document)
            return void (this.kitBlockingEnabled = !1);
        this.kitBlockingEnabled = !0, this.mpInstance = c, this.blockEvents = null === b || void 0 === b || null === (d = b.document) || void 0 === d || null === (e = d.dtpn) || void 0 === e || null === (f = e.blok) || void 0 === f ? void 0 : f.ev, this.blockEventAttributes = null === b || void 0 === b || null === (g = b.document) || void 0 === g || null === (h = g.dtpn) || void 0 === h || null === (i = h.blok) || void 0 === i ? void 0 : i.ea, this.blockUserAttributes = null === b || void 0 === b || null === (j = b.document) || void 0 === j || null === (k = j.dtpn) || void 0 === k || null === (l = k.blok) || void 0 === l ? void 0 : l.ua, this.blockUserIdentities = null === b || void 0 === b || null === (m = b.document) || void 0 === m || null === (n = m.dtpn) || void 0 === n || null === (o = n.blok) || void 0 === o ? void 0 : o.id;
        var t = null === b || void 0 === b || null === (p = b.document) || void 0 === p || null === (q = p.dtpn) || void 0 === q || null === (r = q.vers) || void 0 === r ? void 0 : r.version_document, u = null === t || void 0 === t ? void 0 : t.data_points;
        if (t)
            try {
                0 < (null === u || void 0 === u ? void 0 : u.length) && u.forEach(function (a) { return s.addToMatchLookups(a); });
            }
            catch (a) {
                this.mpInstance.Logger.error("There was an issue with the data plan: " + a);
            }
    }
    return createClass(a, [{ key: "addToMatchLookups", value: function addToMatchLookups(a) {
                var b, c, d;
                if (!a.match || !a.validator)
                    return void this.mpInstance.Logger.warning("Data Plan Point is not valid' + ".concat(a)); // match keys for non product custom attribute related data points
                var e = this.generateMatchKey(a.match), f = this.getPlannedProperties(a.match.type, a.validator);
                this.dataPlanMatchLookups[e] = f, ((null === a || void 0 === a || null === (b = a.match) || void 0 === b ? void 0 : b.type) === DataPlanMatchType.ProductImpression || (null === a || void 0 === a || null === (c = a.match) || void 0 === c ? void 0 : c.type) === DataPlanMatchType.ProductAction || (null === a || void 0 === a || null === (d = a.match) || void 0 === d ? void 0 : d.type) === DataPlanMatchType.PromotionAction) && (e = this.generateProductAttributeMatchKey(a.match), f = this.getProductProperties(a.match.type, a.validator), this.dataPlanMatchLookups[e] = f);
            } }, { key: "generateMatchKey", value: function generateMatchKey(a) { var b = a.criteria || ""; switch (a.type) {
                case DataPlanMatchType.CustomEvent:
                    var c = b;
                    return [DataPlanMatchType.CustomEvent, c.custom_event_type, c.event_name].join(":");
                case DataPlanMatchType.ScreenView: return [DataPlanMatchType.ScreenView, "", b.screen_name].join(":");
                case DataPlanMatchType.ProductAction: return [a.type, b.action].join(":");
                case DataPlanMatchType.PromotionAction: return [a.type, b.action].join(":");
                case DataPlanMatchType.ProductImpression: return [a.type, b.action].join(":");
                case DataPlanMatchType.UserIdentities:
                case DataPlanMatchType.UserAttributes: return [a.type].join(":");
                default: return null;
            } } }, { key: "generateProductAttributeMatchKey", value: function generateProductAttributeMatchKey(a) { var b = a.criteria || ""; switch (a.type) {
                case DataPlanMatchType.ProductAction: return [a.type, b.action, "ProductAttributes"].join(":");
                case DataPlanMatchType.PromotionAction: return [a.type, b.action, "ProductAttributes"].join(":");
                case DataPlanMatchType.ProductImpression: return [a.type, "ProductAttributes"].join(":");
                default: return null;
            } } }, { key: "getPlannedProperties", value: function getPlannedProperties(a, b) { var c, d, e, f, g, h, i; switch (a) {
                case DataPlanMatchType.CustomEvent:
                case DataPlanMatchType.ScreenView:
                case DataPlanMatchType.ProductAction:
                case DataPlanMatchType.PromotionAction:
                case DataPlanMatchType.ProductImpression:
                    if (h = null === b || void 0 === b || null === (c = b.definition) || void 0 === c || null === (d = c.properties) || void 0 === d || null === (e = d.data) || void 0 === e || null === (f = e.properties) || void 0 === f ? void 0 : f.custom_attributes, h) {
                        if (!0 === h.additionalProperties || void 0 === h.additionalProperties)
                            return !0;
                        for (var j, k = {}, l = 0, m = Object.keys(h.properties); l < m.length; l++)
                            j = m[l], k[j] = !0;
                        return k;
                    }
                    var n, o, p;
                    return !1 !== (null === b || void 0 === b || null === (n = b.definition) || void 0 === n || null === (o = n.properties) || void 0 === o || null === (p = o.data) || void 0 === p ? void 0 : p.additionalProperties) || {};
                case DataPlanMatchType.UserAttributes:
                case DataPlanMatchType.UserIdentities:
                    if (i = null === b || void 0 === b || null === (g = b.definition) || void 0 === g ? void 0 : g.additionalProperties, !0 === i || void 0 === i)
                        return !0;
                    for (var q, r = {}, s = b.definition.properties, t = 0, u = Object.keys(s); t < u.length; t++)
                        q = u[t], r[q] = !0;
                    return r;
                default: return null;
            } } }, { key: "getProductProperties", value: function getProductProperties(a, b) {
                var c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w;
                switch (a) {
                    case DataPlanMatchType.ProductImpression: //product item attributes
                        if (w = null === b || void 0 === b || null === (c = b.definition) || void 0 === c || null === (d = c.properties) || void 0 === d || null === (e = d.data) || void 0 === e || null === (f = e.properties) || void 0 === f || null === (g = f.product_impressions) || void 0 === g || null === (h = g.items) || void 0 === h || null === (i = h.properties) || void 0 === i || null === (j = i.products) || void 0 === j || null === (k = j.items) || void 0 === k || null === (l = k.properties) || void 0 === l ? void 0 : l.custom_attributes, !1 === (null === (m = w) || void 0 === m ? void 0 : m.additionalProperties)) {
                            for (var x = {}, y = 0, z = Object.keys(null === (A = w) || void 0 === A ? void 0 : A.properties); y < z.length; y++) {
                                var A, B = z[y];
                                x[B] = !0;
                            }
                            return x;
                        }
                        return !0;
                    case DataPlanMatchType.ProductAction:
                    case DataPlanMatchType.PromotionAction: //product item attributes
                        if (w = null === b || void 0 === b || null === (n = b.definition) || void 0 === n || null === (o = n.properties) || void 0 === o || null === (p = o.data) || void 0 === p || null === (q = p.properties) || void 0 === q || null === (r = q.product_action) || void 0 === r || null === (s = r.properties) || void 0 === s || null === (t = s.products) || void 0 === t || null === (u = t.items) || void 0 === u || null === (v = u.properties) || void 0 === v ? void 0 : v.custom_attributes, w && !1 === w.additionalProperties) {
                            for (var C = {}, D = 0, E = Object.keys(null === (F = w) || void 0 === F ? void 0 : F.properties); D < E.length; D++) {
                                var F, G = E[D];
                                C[G] = !0;
                            }
                            return C;
                        }
                        return !0;
                    default: return null;
                }
            } }, { key: "getMatchKey", value: function getMatchKey(a) { switch (a.event_type) {
                case dist_14.screenView:
                    var h = a;
                    return h.data ? ["screen_view", "", h.data.screen_name].join(":") : null;
                case dist_14.commerceEvent:
                    var b = a, c = [];
                    if (b && b.data) {
                        var d = b.data, e = d.product_action, f = d.product_impressions, g = d.promotion_action;
                        e ? (c.push(DataPlanMatchType.ProductAction), c.push(e.action)) : g ? (c.push(DataPlanMatchType.PromotionAction), c.push(g.action)) : f && c.push(DataPlanMatchType.ProductImpression);
                    }
                    return c.join(":");
                case dist_14.customEvent:
                    var i = a;
                    return i.data ? ["custom_event", i.data.custom_event_type, i.data.event_name].join(":") : null;
                default: return null;
            } } }, { key: "getProductAttributeMatchKey", value: function getProductAttributeMatchKey(a) { switch (a.event_type) {
                case dist_14.commerceEvent:
                    var b = [], c = a.data, d = c.product_action, e = c.product_impressions, f = c.promotion_action;
                    return d ? (b.push(DataPlanMatchType.ProductAction), b.push(d.action), b.push("ProductAttributes")) : f ? (b.push(DataPlanMatchType.PromotionAction), b.push(f.action), b.push("ProductAttributes")) : e && (b.push(DataPlanMatchType.ProductImpression), b.push("ProductAttributes")), b.join(":");
                default: return null;
            } } }, { key: "createBlockedEvent", value: function createBlockedEvent(a) {
                try {
                    return a && (a = this.transformEventAndEventAttributes(a)), a && a.EventDataType === Types.MessageType.Commerce && (a = this.transformProductAttributes(a)), a && (a = this.transformUserAttributes(a), a = this.transformUserIdentities(a)), a;
                }
                catch (b) {
                    return a;
                }
            } }, { key: "transformEventAndEventAttributes", value: function transformEventAndEventAttributes(a) {
                var b = _objectSpread$1({}, a), c = convertEvent(b), d = this.getMatchKey(c), e = this.dataPlanMatchLookups[d];
                if (this.blockEvents && !e) /*
                        If the event is not planned, it doesn't exist in dataPlanMatchLookups
                        and should be blocked (return null to not send anything to forwarders)
                    */
                    return null;
                if (this.blockEventAttributes) { /*
                    matchedEvent is set to `true` if additionalProperties is `true`
                    otherwise, delete attributes that exist on event.EventAttributes
                    that aren't on
                */
                    if (!0 === e)
                        return b;
                    if (e) {
                        for (var f, g = 0, h = Object.keys(b.EventAttributes); g < h.length; g++)
                            f = h[g], e[f] || delete b.EventAttributes[f];
                        return b;
                    }
                    return b;
                }
                return b;
            } }, { key: "transformProductAttributes", value: function transformProductAttributes(a) {
                function b(a, b) { b.forEach(function (b) { for (var c, d = 0, e = Object.keys(b.Attributes); d < e.length; d++)
                    c = e[d], a[c] || delete b.Attributes[c]; }); }
                var c, d = _objectSpread$1({}, a), e = convertEvent(d), f = this.getProductAttributeMatchKey(e), g = this.dataPlanMatchLookups[f];
                if (this.blockEvents && !g) /*
                    If the event is not planned, it doesn't exist in dataPlanMatchLookups
                    and should be blocked (return null to not send anything to forwarders)
                */
                    return null;
                if (this.blockEventAttributes) { /*
                    matchedEvent is set to `true` if additionalProperties is `true`
                    otherwise, delete attributes that exist on event.EventAttributes
                    that aren't on
                */
                    if (!0 === g)
                        return d;
                    if (g) {
                        switch (a.EventCategory) {
                            case Types.CommerceEventType.ProductImpression:
                                d.ProductImpressions.forEach(function (a) { b(g, null === a || void 0 === a ? void 0 : a.ProductList); });
                                break;
                            case Types.CommerceEventType.ProductPurchase:
                                b(g, null === (c = d.ProductAction) || void 0 === c ? void 0 : c.ProductList);
                                break;
                            default: this.mpInstance.Logger.warning("Product Not Supported ");
                        }
                        return d;
                    }
                    return d;
                }
                return d;
            } }, { key: "transformUserAttributes", value: function transformUserAttributes(a) {
                var b = _objectSpread$1({}, a);
                if (this.blockUserAttributes) { /*
                    If the user attribute is not found in the matchedAttributes
                    then remove it from event.UserAttributes as it is blocked
                */
                    var f = this.dataPlanMatchLookups.user_attributes;
                    if (this.mpInstance._Helpers.isObject(f))
                        for (var c, d = 0, e = Object.keys(b.UserAttributes); d < e.length; d++)
                            c = e[d], f[c] || delete b.UserAttributes[c];
                }
                return b;
            } }, { key: "isAttributeKeyBlocked", value: function isAttributeKeyBlocked(a) { /* used when an attribute is added to the user */ if (!this.blockUserAttributes)
                return !1; if (this.blockUserAttributes) {
                var b = this.dataPlanMatchLookups.user_attributes;
                if (!0 === b)
                    return !1;
                if (!b[a])
                    return !0;
            } return !1; } }, { key: "isIdentityBlocked", value: function isIdentityBlocked(a) { /* used when an attribute is added to the user */ if (!this.blockUserIdentities)
                return !1; if (this.blockUserIdentities) {
                var b = this.dataPlanMatchLookups.user_identities;
                if (!0 === b)
                    return !1;
                if (!b[a])
                    return !0;
            }
            else
                return !1; return !1; } }, { key: "transformUserIdentities", value: function transformUserIdentities(a) { var b = this, c = _objectSpread$1({}, a); if (this.blockUserIdentities) {
                var e = this.dataPlanMatchLookups.user_identities;
                if (this.mpInstance._Helpers.isObject(e)) {
                    var d;
                    null !== c && void 0 !== c && null !== (d = c.UserIdentities) && void 0 !== d && d.length && c.UserIdentities.forEach(function (a, d) { var f = Types.IdentityType.getIdentityName(b.mpInstance._Helpers.parseNumber(a.Type)); e[f] || c.UserIdentities.splice(d, 1); });
                }
            } return c; } }]), a;
}(); /*
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

function ConfigAPIClient(){this.getSDKConfiguration=function(a,b,c,d){var e;try{var f=function(){4===g.readyState&&(200===g.status?(b=d._Helpers.extend({},b,JSON.parse(g.responseText)),c(a,b,d),d.Logger.verbose("Successfully received configuration from server")):(c(a,b,d),d.Logger.verbose("Issue with receiving configuration from server, received HTTP Code of "+g.status)));},g=d._Helpers.createXHR(f);e="https://"+d._Store.SDKConfig.configUrl+a+"/config?env=",e+=b.isDevelopmentMode?"1":"0";var h=b.dataPlan;h&&(h.planId&&(e=e+"&plan_id="+h.planId||""),h.planVersion&&(e=e+"&plan_version="+h.planVersion||"")),g&&(g.open("get",e),g.send(null));}catch(f){c(a,b,d),d.Logger.error("Error getting forwarder configuration from mParticle servers.");}};}

var HTTPCodes$1=Constants.HTTPCodes,Messages$8=Constants.Messages;function IdentityAPIClient(a){this.sendAliasRequest=function(b,c){var d,e=function(){if(4===d.readyState){//only parse error messages from failing requests
if(a.Logger.verbose("Received "+d.statusText+" from server"),200!==d.status&&202!==d.status&&d.responseText){var b=JSON.parse(d.responseText);if(b.hasOwnProperty("message")){var e=b.message;return void a._Helpers.invokeAliasCallback(c,d.status,e)}}a._Helpers.invokeAliasCallback(c,d.status);}};if(a.Logger.verbose(Messages$8.InformationMessages.SendAliasHttp),d=a._Helpers.createXHR(e),d)try{d.open("post",a._Helpers.createServiceUrl(a._Store.SDKConfig.aliasUrl,a._Store.devToken)+"/Alias"),d.send(JSON.stringify(b));}catch(b){a._Helpers.invokeAliasCallback(c,HTTPCodes$1.noHttpCoverage,b),a.Logger.error("Error sending alias request to mParticle servers. "+b);}},this.sendIdentityRequest=function(b,c,d,e,f,g){var h,i,j=function(){4===h.readyState&&(a.Logger.verbose("Received "+h.statusText+" from server"),f(h,i,d,e,c));};if(a.Logger.verbose(Messages$8.InformationMessages.SendIdentityBegin),!b)return void a.Logger.error(Messages$8.ErrorMessages.APIRequestEmpty);if(a.Logger.verbose(Messages$8.InformationMessages.SendIdentityHttp),h=a._Helpers.createXHR(j),h)try{a._Store.identityCallInFlight?a._Helpers.invokeCallback(d,HTTPCodes$1.activeIdentityRequest,"There is currently an Identity request processing. Please wait for this to return before requesting again"):(i=g||null,"modify"===c?h.open("post",a._Helpers.createServiceUrl(a._Store.SDKConfig.identityUrl)+g+"/"+c):h.open("post",a._Helpers.createServiceUrl(a._Store.SDKConfig.identityUrl)+c),h.setRequestHeader("Content-Type","application/json"),h.setRequestHeader("x-mp-key",a._Store.devToken),a._Store.identityCallInFlight=!0,h.send(JSON.stringify(b)));}catch(b){a._Store.identityCallInFlight=!1,a._Helpers.invokeCallback(d,HTTPCodes$1.noHttpCoverage,b),a.Logger.error("Error sending identity request to servers with status code "+h.status+" - "+b);}};}

var Messages$9=Constants.Messages,HTTPCodes$2=Constants.HTTPCodes;/**
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
 */function mParticleInstance(a){var b=this;// These classes are for internal use only. Not documented for public consumption
// required for forwarders once they reference the mparticle instance
/**
     * Resets the SDK to an uninitialized state and removes cookies/localStorage. You MUST call mParticle.init(apiKey, window.mParticle.config)
     * before any other mParticle methods or the SDK will not function as intended.
     * @method setLogLevel
     * @param {String} logLevel verbose, warning, or none. By default, `warning` is chosen.
     */ /**
     * Resets the SDK to an uninitialized state and removes cookies/localStorage. You MUST call mParticle.init(apiKey, window.mParticle.config)
     * before any other mParticle methods or the SDK will not function as intended.
     * @method reset
     */ /**
     * A callback method that is invoked after mParticle is initialized.
     * @method ready
     * @param {Function} function A function to be called after mParticle is initialized
     */ /**
     * Returns the mParticle SDK version number
     * @method getVersion
     * @return {String} mParticle SDK version number
     */ /**
     * Sets the app version
     * @method setAppVersion
     * @param {String} version version number
     */ /**
     * Gets the app name
     * @method getAppName
     * @return {String} App name
     */ /**
     * Sets the app name
     * @method setAppName
     * @param {String} name App Name
     */ /**
     * Gets the app version
     * @method getAppVersion
     * @return {String} App version
     */ /**
     * Stops tracking the location of the user
     * @method stopTrackingLocation
     */ /**
     * Starts tracking the location of the user
     * @method startTrackingLocation
     * @param {Function} [callback] A callback function that is called when the location is either allowed or rejected by the user. A position object of schema {coords: {latitude: number, longitude: number}} is passed to the callback
     */ /**
     * Sets the position of the user
     * @method setPosition
     * @param {Number} lattitude lattitude digit
     * @param {Number} longitude longitude digit
     */ /**
     * Starts a new session
     * @method startNewSession
     */ /**
     * Ends the current session
     * @method endSession
     */ /**
     * Logs a Base Event to mParticle's servers
     * @param {Object} event Base Event Object
     * @param {Object} [eventOptions] For Event-level Configuration Options
     */ /**
     * Logs an event to mParticle's servers
     * @method logEvent
     * @param {String} eventName The name of the event
     * @param {Number} [eventType] The eventType as seen [here](http://docs.mparticle.com/developers/sdk/web/event-tracking#event-type)
     * @param {Object} [eventInfo] Attributes for the event
     * @param {Object} [customFlags] Additional customFlags
     * @param {Object} [eventOptions] For Event-level Configuration Options
     */ /**
     * Used to log custom errors
     *
     * @method logError
     * @param {String or Object} error The name of the error (string), or an object formed as follows {name: 'exampleName', message: 'exampleMessage', stack: 'exampleStack'}
     * @param {Object} [attrs] Custom attrs to be passed along with the error event; values must be string, number, or boolean
     */ /**
     * Logs `click` events
     * @method logLink
     * @param {String} selector The selector to add a 'click' event to (ex. #purchase-event)
     * @param {String} [eventName] The name of the event
     * @param {Number} [eventType] The eventType as seen [here](http://docs.mparticle.com/developers/sdk/javascript/event-tracking#event-type)
     * @param {Object} [eventInfo] Attributes for the event
     */ /**
     * Logs `submit` events
     * @method logForm
     * @param {String} selector The selector to add the event handler to (ex. #search-event)
     * @param {String} [eventName] The name of the event
     * @param {Number} [eventType] The eventType as seen [here](http://docs.mparticle.com/developers/sdk/javascript/event-tracking#event-type)
     * @param {Object} [eventInfo] Attributes for the event
     */ /**
     * Logs a page view
     * @method logPageView
     * @param {String} eventName The name of the event. Defaults to 'PageView'.
     * @param {Object} [attrs] Attributes for the event
     * @param {Object} [customFlags] Custom flags for the event
     * @param {Object} [eventOptions] For Event-level Configuration Options
     */ /**
     * Forces an upload of the batch
     * @method upload
     */ /**
     * Invoke these methods on the mParticle.Consent object.
     * Example: mParticle.Consent.createConsentState()
     *
     * @class mParticle.Consent
     */ /**
     * Invoke these methods on the mParticle.eCommerce object.
     * Example: mParticle.eCommerce.createImpresion(...)
     * @class mParticle.eCommerce
     */ /**
     * Sets a session attribute
     * @method setSessionAttribute
     * @param {String} key key for session attribute
     * @param {String or Number} value value for session attribute
     */ /**
     * Set opt out of logging
     * @method setOptOut
     * @param {Boolean} isOptingOut boolean to opt out or not. When set to true, opt out of logging.
     */ /**
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
     */ /**
     * Get integration attributes for a given integration ID.
     * @method getIntegrationAttributes
     * @param {Number} integrationId mParticle integration ID
     * @return {Object} an object map of the integrationId's attributes
     */ // Used by our forwarders
this._instanceName=a,this._NativeSdkHelpers=new NativeSdkHelpers(this),this._Migrations=new Migrations(this),this._SessionManager=new SessionManager(this),this._Persistence=new _Persistence(this),this._Helpers=new Helpers(this),this._Events=new Events(this),this._CookieSyncManager=new cookieSyncManager(this),this._ServerModel=new ServerModel(this),this._Ecommerce=new Ecommerce(this),this._ForwardingStatsUploader=new forwardingStatsUploader(this),this._Consent=new Consent(this),this._IdentityAPIClient=new IdentityAPIClient(this),this._preInit={readyQueue:[],integrationDelays:{},forwarderConstructors:[]},this.IdentityType=Types.IdentityType,this.EventType=Types.EventType,this.CommerceEventType=Types.CommerceEventType,this.PromotionType=Types.PromotionActionType,this.ProductActionType=Types.ProductActionType,this._Identity=new Identity(this),this.Identity=this._Identity.IdentityAPI,this.generateHash=this._Helpers.generateHash,this.getDeviceId=this._Persistence.getDeviceId,"undefined"!=typeof window&&window.mParticle&&window.mParticle.config&&window.mParticle.config.hasOwnProperty("rq")&&(this._preInit.readyQueue=window.mParticle.config.rq),this.init=function(a,b){// config code - Fetch config when requestConfig = true, otherwise, proceed with SDKInitialization
// Since fetching the configuration is asynchronous, we must pass completeSDKInitialization
// to it for it to be run after fetched
return b||console.warn("You did not pass a config object to init(). mParticle will not initialize properly"),runPreConfigFetchInitialization(this,a,b),b?void(!b.hasOwnProperty("requestConfig")||b.requestConfig?new ConfigAPIClient().getSDKConfiguration(a,b,completeSDKInitialization,this):completeSDKInitialization(a,b,this)):void console.error("No config available on the window, please pass a config object to mParticle.init()")},this.setLogLevel=function(a){b.Logger.setLogLevel(a);},this.reset=function(a){a._Persistence.resetPersistence(),a._Store&&delete a._Store;},this._resetForTests=function(a,b,c){c._Store&&delete c._Store,c._Store=new Store(a,c),c._Store.isLocalStorageAvailable=c._Persistence.determineLocalStorageAvailability(window.localStorage),c._Events.stopTracking(),b||c._Persistence.resetPersistence(),c._Persistence.forwardingStatsBatches.uploadsTable={},c._Persistence.forwardingStatsBatches.forwardingStatsEventQueue=[],c._preInit={readyQueue:[],pixelConfigurations:[],integrationDelays:{},forwarderConstructors:[],isDevelopmentMode:!1};},this.ready=function(a){b._Store.isInitialized&&"function"==typeof a?a():b._preInit.readyQueue.push(a);},this.getVersion=function(){return Constants.sdkVersion},this.setAppVersion=function(a){b._Store.SDKConfig.appVersion=a,b._Persistence.update();},this.getAppName=function(){return b._Store.SDKConfig.appName},this.setAppName=function(a){b._Store.SDKConfig.appName=a;},this.getAppVersion=function(){return b._Store.SDKConfig.appVersion},this.stopTrackingLocation=function(){b._SessionManager.resetSessionTimer(),b._Events.stopTracking();},this.startTrackingLocation=function(a){b._Helpers.Validators.isFunction(a)||b.Logger.warning("Warning: Location tracking is triggered, but not including a callback into the `startTrackingLocation` may result in events logged too quickly and not being associated with a location."),b._SessionManager.resetSessionTimer(),b._Events.startTracking(a);},this.setPosition=function(a,c){b._SessionManager.resetSessionTimer(),"number"==typeof a&&"number"==typeof c?b._Store.currentPosition={lat:a,lng:c}:b.Logger.error("Position latitude and/or longitude must both be of type number");},this.startNewSession=function(){b._SessionManager.startNewSession();},this.endSession=function(){// Sends true as an over ride vs when endSession is called from the setInterval
b._SessionManager.endSession(!0);},this.logBaseEvent=function(a,c){return b._Store.isInitialized?(b._SessionManager.resetSessionTimer(),"string"!=typeof a.name)?void b.Logger.error(Messages$9.ErrorMessages.EventNameInvalidType):(a.eventType||(a.eventType=Types.EventType.Unknown),b._Helpers.canLog()?void b._Events.logEvent(a,c):void b.Logger.error(Messages$9.ErrorMessages.LoggingDisabled)):void b.ready(function(){b.logBaseEvent(a,c);})},this.logEvent=function(a,c,d,e,f){return b._Store.isInitialized?(b._SessionManager.resetSessionTimer(),"string"!=typeof a)?void b.Logger.error(Messages$9.ErrorMessages.EventNameInvalidType):(c||(c=Types.EventType.Unknown),b._Helpers.isEventType(c)?b._Helpers.canLog()?void b._Events.logEvent({messageType:Types.MessageType.PageEvent,name:a,data:d,eventType:c,customFlags:e},f):void b.Logger.error(Messages$9.ErrorMessages.LoggingDisabled):void b.Logger.error("Invalid event type: "+c+", must be one of: \n"+JSON.stringify(Types.EventType))):void b.ready(function(){b.logEvent(a,c,d,e,f);})},this.logError=function(a,c){if(!b._Store.isInitialized)return void b.ready(function(){b.logError(a,c);});if(b._SessionManager.resetSessionTimer(),!!a){"string"==typeof a&&(a={message:a});var d={m:a.message?a.message:a,s:"Error",t:a.stack||null};if(c){var e=b._Helpers.sanitizeAttributes(c,d.m);for(var f in e)d[f]=e[f];}b._Events.logEvent({messageType:Types.MessageType.CrashReport,name:a.name?a.name:"Error",data:d,eventType:Types.EventType.Other});}},this.logLink=function(a,c,d,e){b._Events.addEventHandler("click",a,c,e,d);},this.logForm=function(a,c,d,e){b._Events.addEventHandler("submit",a,c,e,d);},this.logPageView=function(a,c,d,e){if(!b._Store.isInitialized)return void b.ready(function(){b.logPageView(a,c,d,e);});if(b._SessionManager.resetSessionTimer(),b._Helpers.canLog()){if(b._Helpers.Validators.isStringOrNumber(a)||(a="PageView"),!c)c={hostname:window.location.hostname,title:window.document.title};else if(!b._Helpers.isObject(c))return void b.Logger.error("The attributes argument must be an object. A "+_typeof_1(c)+" was entered. Please correct and retry.");if(d&&!b._Helpers.isObject(d))return void b.Logger.error("The customFlags argument must be an object. A "+_typeof_1(d)+" was entered. Please correct and retry.")}b._Events.logEvent({messageType:Types.MessageType.PageView,name:a,data:c,eventType:Types.EventType.Unknown,customFlags:d},e);},this.upload=function(){b._Helpers.canLog()&&(b._Store.webviewBridgeEnabled?b._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Upload):b._APIClient.uploader.prepareAndUpload(!1,!1));},this.Consent={/**
         * Creates a CCPA Opt Out Consent State.
         *
         * @method createCCPAConsent
         * @param {Boolean} optOut true represents a "data sale opt-out", false represents the user declining a "data sale opt-out"
         * @param {Number} timestamp Unix time (likely to be Date.now())
         * @param {String} consentDocument document version or experience that the user may have consented to
         * @param {String} location location where the user gave consent
         * @param {String} hardwareId hardware ID for the device or browser used to give consent. This property exists only to provide additional context and is not used to identify users
         * @return {Object} CCPA Consent State
         */createCCPAConsent:b._Consent.createPrivacyConsent,/**
         * Creates a GDPR Consent State.
         *
         * @method createGDPRConsent
         * @param {Boolean} consent true represents a "data sale opt-out", false represents the user declining a "data sale opt-out"
         * @param {Number} timestamp Unix time (likely to be Date.now())
         * @param {String} consentDocument document version or experience that the user may have consented to
         * @param {String} location location where the user gave consent
         * @param {String} hardwareId hardware ID for the device or browser used to give consent. This property exists only to provide additional context and is not used to identify users
         * @return {Object} GDPR Consent State
         */createGDPRConsent:b._Consent.createPrivacyConsent,/**
         * Creates a Consent State Object, which can then be used to set CCPA states, add multiple GDPR states, as well as get and remove these privacy states.
         *
         * @method createConsentState
         * @return {Object} ConsentState object
         */createConsentState:b._Consent.createConsentState},this.eCommerce={/**
         * Invoke these methods on the mParticle.eCommerce.Cart object.
         * Example: mParticle.eCommerce.Cart.add(...)
         * @class mParticle.eCommerce.Cart
         * @deprecated
         */Cart:{/**
             * Adds a product to the cart
             * @method add
             * @param {Object} product The product you want to add to the cart
             * @param {Boolean} [logEventBoolean] Option to log the event to mParticle's servers. If blank, no logging occurs.
             * @deprecated
             */add:function add(a,c){b.Logger.warning("Deprecated function eCommerce.Cart.add() will be removed in future releases");var d,e=b.Identity.getCurrentUser();e&&(d=e.getMPID()),b._Identity.mParticleUserCart(d).add(a,c);},/**
             * Removes a product from the cart
             * @method remove
             * @param {Object} product The product you want to add to the cart
             * @param {Boolean} [logEventBoolean] Option to log the event to mParticle's servers. If blank, no logging occurs.
             * @deprecated
             */remove:function remove(a,c){b.Logger.warning("Deprecated function eCommerce.Cart.remove() will be removed in future releases");var d,e=b.Identity.getCurrentUser();e&&(d=e.getMPID()),b._Identity.mParticleUserCart(d).remove(a,c);},/**
             * Clears the cart
             * @method clear
             * @deprecated
             */clear:function clear(){b.Logger.warning("Deprecated function eCommerce.Cart.clear() will be removed in future releases");var a,c=b.Identity.getCurrentUser();c&&(a=c.getMPID()),b._Identity.mParticleUserCart(a).clear();}},/**
         * Sets the currency code
         * @for mParticle.eCommerce
         * @method setCurrencyCode
         * @param {String} code The currency code
         */setCurrencyCode:function setCurrencyCode(a){return b._Store.isInitialized?"string"==typeof a?void(b._SessionManager.resetSessionTimer(),b._Store.currencyCode=a):void b.Logger.error("Code must be a string"):void b.ready(function(){b.eCommerce.setCurrencyCode(a);})},/**
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
         */createProduct:function createProduct(a,c,d,e,f,g,h,i,j,k){return b._Ecommerce.createProduct(a,c,d,e,f,g,h,i,j,k)},/**
         * Creates a promotion
         * @for mParticle.eCommerce
         * @method createPromotion
         * @param {String} id a unique promotion id
         * @param {String} [creative] promotion creative
         * @param {String} [name] promotion name
         * @param {Number} [position] promotion position
         */createPromotion:function createPromotion(a,c,d,e){return b._Ecommerce.createPromotion(a,c,d,e)},/**
         * Creates a product impression
         * @for mParticle.eCommerce
         * @method createImpression
         * @param {String} name impression name
         * @param {Object} product the product for which an impression is being created
         */createImpression:function createImpression(a,c){return b._Ecommerce.createImpression(a,c)},/**
         * Creates a transaction attributes object to be used with a checkout
         * @for mParticle.eCommerce
         * @method createTransactionAttributes
         * @param {String or Number} id a unique transaction id
         * @param {String} [affiliation] affilliation
         * @param {String} [couponCode] the coupon code for which you are creating transaction attributes
         * @param {Number} [revenue] total revenue for the product being purchased
         * @param {String} [shipping] the shipping method
         * @param {Number} [tax] the tax amount
         */createTransactionAttributes:function createTransactionAttributes(a,c,d,e,f,g){return b._Ecommerce.createTransactionAttributes(a,c,d,e,f,g)},/**
         * Logs a checkout action
         * @for mParticle.eCommerce
         * @method logCheckout
         * @param {Number} step checkout step number
         * @param {String} option
         * @param {Object} attrs
         * @param {Object} [customFlags] Custom flags for the event
         * @deprecated
         */logCheckout:function logCheckout(a,c,d,e){return b.Logger.warning("mParticle.logCheckout is deprecated, please use mParticle.logProductAction instead"),b._Store.isInitialized?void(b._SessionManager.resetSessionTimer(),b._Events.logCheckoutEvent(a,c,d,e)):void b.ready(function(){b.eCommerce.logCheckout(a,c,d,e);})},/**
         * Logs a product action
         * @for mParticle.eCommerce
         * @method logProductAction
         * @param {Number} productActionType product action type as found [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/src/types.js#L206-L218)
         * @param {Object} product the product for which you are creating the product action
         * @param {Object} [attrs] attributes related to the product action
         * @param {Object} [customFlags] Custom flags for the event
         * @param {Object} [transactionAttributes] Transaction Attributes for the event
         * @param {Object} [eventOptions] For Event-level Configuration Options
         */logProductAction:function logProductAction(a,c,d,e,f,g){return b._Store.isInitialized?void(b._SessionManager.resetSessionTimer(),b._Events.logProductActionEvent(a,c,d,e,f,g)):void b.ready(function(){b.eCommerce.logProductAction(a,c,d,e,f,g);})},/**
         * Logs a product purchase
         * @for mParticle.eCommerce
         * @method logPurchase
         * @param {Object} transactionAttributes transactionAttributes object
         * @param {Object} product the product being purchased
         * @param {Boolean} [clearCart] boolean to clear the cart after logging or not. Defaults to false
         * @param {Object} [attrs] other attributes related to the product purchase
         * @param {Object} [customFlags] Custom flags for the event
         * @deprecated
         */logPurchase:function logPurchase(a,c,d,e,f){return b.Logger.warning("mParticle.logPurchase is deprecated, please use mParticle.logProductAction instead"),b._Store.isInitialized?a&&c?void(b._SessionManager.resetSessionTimer(),b._Events.logPurchaseEvent(a,c,e,f)):void b.Logger.error(Messages$9.ErrorMessages.BadLogPurchase):void b.ready(function(){b.eCommerce.logPurchase(a,c,d,e,f);})},/**
         * Logs a product promotion
         * @for mParticle.eCommerce
         * @method logPromotion
         * @param {Number} type the promotion type as found [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/src/types.js#L275-L279)
         * @param {Object} promotion promotion object
         * @param {Object} [attrs] boolean to clear the cart after logging or not
         * @param {Object} [customFlags] Custom flags for the event
         * @param {Object} [eventOptions] For Event-level Configuration Options
         */logPromotion:function logPromotion(a,c,d,e,f){return b._Store.isInitialized?void(b._SessionManager.resetSessionTimer(),b._Events.logPromotionEvent(a,c,d,e,f)):void b.ready(function(){b.eCommerce.logPromotion(a,c,d,e,f);})},/**
         * Logs a product impression
         * @for mParticle.eCommerce
         * @method logImpression
         * @param {Object} impression product impression object
         * @param {Object} attrs attributes related to the impression log
         * @param {Object} [customFlags] Custom flags for the event
         * @param {Object} [eventOptions] For Event-level Configuration Options
         */logImpression:function logImpression(a,c,d,e){return b._Store.isInitialized?void(b._SessionManager.resetSessionTimer(),b._Events.logImpressionEvent(a,c,d,e)):void b.ready(function(){b.eCommerce.logImpression(a,c,d,e);})},/**
         * Logs a refund
         * @for mParticle.eCommerce
         * @method logRefund
         * @param {Object} transactionAttributes transaction attributes related to the refund
         * @param {Object} product product being refunded
         * @param {Boolean} [clearCart] boolean to clear the cart after refund is logged. Defaults to false.
         * @param {Object} [attrs] attributes related to the refund
         * @param {Object} [customFlags] Custom flags for the event
         * @deprecated
         */logRefund:function logRefund(a,c,d,e,f){return b.Logger.warning("mParticle.logRefund is deprecated, please use mParticle.logProductAction instead"),b._Store.isInitialized?void(b._SessionManager.resetSessionTimer(),b._Events.logRefundEvent(a,c,e,f)):void b.ready(function(){b.eCommerce.logRefund(a,c,d,e,f);})},expandCommerceEvent:function expandCommerceEvent(a){return b._Ecommerce.expandCommerceEvent(a)}},this.setSessionAttribute=function(a,c){if(!b._Store.isInitialized)return void b.ready(function(){b.setSessionAttribute(a,c);});// Logs to cookie
// And logs to in-memory object
// Example: mParticle.setSessionAttribute('location', '33431');
if(b._Helpers.canLog()){if(!b._Helpers.Validators.isValidAttributeValue(c))return void b.Logger.error(Messages$9.ErrorMessages.BadAttribute);if(!b._Helpers.Validators.isValidKeyValue(a))return void b.Logger.error(Messages$9.ErrorMessages.BadKey);if(b._Store.webviewBridgeEnabled)b._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetSessionAttribute,JSON.stringify({key:a,value:c}));else {var d=b._Helpers.findKeyInObject(b._Store.sessionAttributes,a);d&&(a=d),b._Store.sessionAttributes[a]=c,b._Persistence.update(),b._Forwarders.applyToForwarders("setSessionAttribute",[a,c]);}}},this.setOptOut=function(a){return b._Store.isInitialized?void(b._SessionManager.resetSessionTimer(),b._Store.isEnabled=!a,b._Events.logOptOut(),b._Persistence.update(),b._Store.activeForwarders.length&&b._Store.activeForwarders.forEach(function(c){if(c.setOptOut){var d=c.setOptOut(a);d&&b.Logger.verbose(d);}})):void b.ready(function(){b.setOptOut(a);})},this.setIntegrationAttribute=function(a,c){if(!b._Store.isInitialized)return void b.ready(function(){b.setIntegrationAttribute(a,c);});if("number"!=typeof a)return void b.Logger.error("integrationId must be a number");if(null===c)b._Store.integrationAttributes[a]={};else {if(!b._Helpers.isObject(c))return void b.Logger.error("Attrs must be an object with keys and values. You entered a "+_typeof_1(c));if(0===Object.keys(c).length)b._Store.integrationAttributes[a]={};else for(var d in c)if("string"!=typeof d){b.Logger.error("Keys must be strings, you entered a "+_typeof_1(d));continue}else if("string"==typeof c[d])b._Helpers.isObject(b._Store.integrationAttributes[a])?b._Store.integrationAttributes[a][d]=c[d]:(b._Store.integrationAttributes[a]={},b._Store.integrationAttributes[a][d]=c[d]);else {b.Logger.error("Values for integration attributes must be strings. You entered a "+_typeof_1(c[d]));continue}}b._Persistence.update();},this.getIntegrationAttributes=function(a){return b._Store.integrationAttributes[a]?b._Store.integrationAttributes[a]:{}},this.addForwarder=function(a){b._preInit.forwarderConstructors.push(a);},this.configurePixel=function(a){b._Forwarders.configurePixel(a);},this._getActiveForwarders=function(){return b._Store.activeForwarders},this._getIntegrationDelays=function(){return b._preInit.integrationDelays},this._setIntegrationDelay=function(a,c){b._preInit.integrationDelays[a]=c;};}// Some (server) config settings need to be returned before they are set on SDKConfig in a self hosted environment
function completeSDKInitialization(a,b,c){var d=createKitBlocker(b,c);if(c._APIClient=new APIClient(c,d),c._Forwarders=new Forwarders(c,d),b.flags&&(b.flags.hasOwnProperty(Constants.FeatureFlags.EventsV3)&&(c._Store.SDKConfig.flags[Constants.FeatureFlags.EventsV3]=b.flags[Constants.FeatureFlags.EventsV3]),b.flags.hasOwnProperty(Constants.FeatureFlags.EventBatchingIntervalMillis)&&(c._Store.SDKConfig.flags[Constants.FeatureFlags.EventBatchingIntervalMillis]=b.flags[Constants.FeatureFlags.EventBatchingIntervalMillis])),c._Store.storageName=c._Helpers.createMainStorageName(b.workspaceToken),c._Store.prodStorageName=c._Helpers.createProductStorageName(b.workspaceToken),b.hasOwnProperty("workspaceToken")?c._Store.SDKConfig.workspaceToken=b.workspaceToken:c.Logger.warning("You should have a workspaceToken on your config object for security purposes."),b.hasOwnProperty("requiredWebviewBridgeName")?c._Store.SDKConfig.requiredWebviewBridgeName=b.requiredWebviewBridgeName:b.hasOwnProperty("workspaceToken")&&(c._Store.SDKConfig.requiredWebviewBridgeName=b.workspaceToken),c._Store.webviewBridgeEnabled=c._NativeSdkHelpers.isWebviewEnabled(c._Store.SDKConfig.requiredWebviewBridgeName,c._Store.SDKConfig.minWebviewBridgeVersion),c._Store.configurationLoaded=!0,c._Store.webviewBridgeEnabled||(c._Migrations.migrate(),c._Persistence.initializeStorage()),c._Store.webviewBridgeEnabled)c._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetSessionAttribute,JSON.stringify({key:"$src_env",value:"webview"})),a&&c._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetSessionAttribute,JSON.stringify({key:"$src_key",value:a}));else {var e;// If no initialIdentityRequest is passed in, we set the user identities to what is currently in cookies for the identify request
if(c._Helpers.isObject(c._Store.SDKConfig.identifyRequest)&&c._Helpers.isObject(c._Store.SDKConfig.identifyRequest.userIdentities)&&0===Object.keys(c._Store.SDKConfig.identifyRequest.userIdentities).length||!c._Store.SDKConfig.identifyRequest){var f={};if(e=c.Identity.getCurrentUser(),e){var g=e.getUserIdentities().userIdentities||{};for(var h in g)g.hasOwnProperty(h)&&(f[h]=g[h]);}c._Store.SDKConfig.identifyRequest={userIdentities:f};}// If migrating from pre-IDSync to IDSync, a sessionID will exist and an identify request will not have been fired, so we need this check
c._Store.migratingToIDSyncCookies&&(c.Identity.identify(c._Store.SDKConfig.identifyRequest,c._Store.SDKConfig.identityCallback),c._Store.migratingToIDSyncCookies=!1),e=c.Identity.getCurrentUser(),c._Helpers.getFeatureFlag(Constants.FeatureFlags.ReportBatching)&&c._ForwardingStatsUploader.startForwardingStatsTimer(),c._Forwarders.processForwarders(b,c._APIClient.prepareForwardingStats),!c._Store.identifyCalled&&c._Store.SDKConfig.identityCallback&&e&&e.getMPID()&&c._Store.SDKConfig.identityCallback({httpCode:HTTPCodes$2.activeSession,getUser:function getUser(){return c._Identity.mParticleUser(e.getMPID())},getPreviousUser:function getPreviousUser(){var a=c.Identity.getUsers(),b=a.shift();return b&&e&&b.getMPID()===e.getMPID()&&(b=a.shift()),b||null},body:{mpid:e.getMPID(),is_logged_in:c._Store.isLoggedIn,matched_identities:e.getUserIdentities().userIdentities,context:null,is_ephemeral:!1}}),c._SessionManager.initialize(),c._Events.logAST();}c._Store.isInitialized=!0,c._preInit.readyQueue&&c._preInit.readyQueue.length&&(c._preInit.readyQueue.forEach(function(a){c._Helpers.Validators.isFunction(a)?a():Array.isArray(a)&&processPreloadedItem(a,c);}),c._preInit.readyQueue=[]),c._Store.isFirstRun&&(c._Store.isFirstRun=!1);}function createKitBlocker(a,b){var c,d,e,f;/*  There are three ways a data plan object for blocking can be passed to the SDK:
            1. Manually via config.dataPlanOptions (this takes priority)
            If not passed in manually, we user the server provided via either
            2. Snippet via /mparticle.js endpoint (config.dataPlan.document)
            3. Self hosting via /config endpoint (config.dataPlanResult)
    */return a.dataPlanOptions&&(b.Logger.verbose("Customer provided data plan found"),f=a.dataPlanOptions,d={document:{dtpn:{vers:f.dataPlanVersion,blok:{ev:f.blockEvents,ea:f.blockEventAttributes,ua:f.blockUserAttributes,id:f.blockUserIdentities}}}}),d||(a.dataPlan&&a.dataPlan.document?a.dataPlan.document.error_message?e=a.dataPlan.document.error_message:(b.Logger.verbose("Data plan found from mParticle.js"),d=a.dataPlan):a.dataPlanResult&&(a.dataPlanResult.error_message?e=a.dataPlanResult.error_message:(b.Logger.verbose("Data plan found from /config"),d={document:a.dataPlanResult}))),e&&b.Logger.error(e),d&&(c=new KitBlocker(d,b)),c}function runPreConfigFetchInitialization(a,b,c){a.Logger=new Logger(c),a._Store=new Store(c,a),window.mParticle.Store=a._Store,a._Store.devToken=b||null,a.Logger.verbose(Messages$9.InformationMessages.StartingInitialization);//check to see if localStorage is available for migrating purposes
try{a._Store.isLocalStorageAvailable=a._Persistence.determineLocalStorageAvailability(window.localStorage);}catch(b){a.Logger.warning("localStorage is not available, using cookies if available"),a._Store.isLocalStorageAvailable=!1;}}function processPreloadedItem(a,b){var c=a,d=c.splice(0,1)[0];// if the first argument is a method on the base mParticle object, run it
if(mParticle[c[0]])mParticle[d].apply(this,c);else {var e=d.split(".");try{for(var f,g=mParticle,h=0;h<e.length;h++)f=e[h],g=g[f];g.apply(this,c);}catch(a){b.Logger.verbose("Unable to compute proper mParticle function "+a);}}}

var _BatchValidator = /*#__PURE__*/ function () {
    function a() { classCallCheck(this, a); }
    return createClass(a, [{ key: "getMPInstance", value: function getMPInstance() {
                return {
                    _Helpers: { sanitizeAttributes: window.mParticle.getInstance()._Helpers.sanitizeAttributes, generateUniqueId: function generateUniqueId() { return "mockId"; }, extend: window.mParticle.getInstance()._Helpers.extend }, _Store: { sessionId: "mockSessionId", SDKConfig: {} }, Identity: { getCurrentUser: function getCurrentUser() { return null; } }, getAppVersion: function getAppVersion() { return null; }, getAppName: function getAppName() { return null; }
                };
            } }, { key: "returnBatch", value: function returnBatch(a) { var b = this.getMPInstance(), c = new ServerModel(b).createEventObject(a), d = convertEvents("0", [c], b); return d; } }]), a;
}();

Array.prototype.forEach||(Array.prototype.forEach=Polyfill.forEach),Array.prototype.map||(Array.prototype.map=Polyfill.map),Array.prototype.filter||(Array.prototype.filter=Polyfill.filter),Array.isArray||(Array.prototype.isArray=Polyfill.isArray);function mParticle$1(){var a=this;// Only leaving this here in case any clients are trying to access mParticle.Store, to prevent from throwing
/**
     * Initializes the mParticle instance. If no instanceName is provided, an instance name of `default_instance` will be used.
     * <p>
     * If you'd like to initiate multiple mParticle instances, first review our <a href="https://docs.mparticle.com/developers/sdk/web/multiple-instances/">doc site</a>, and ensure you pass a unique instance name as the third argument as shown below.
     * @method init
     * @param {String} apiKey your mParticle assigned API key
     * @param {Object} [config] an options object for additional configuration
     * @param {String} [instanceName] If you are self hosting the JS SDK and working with multiple instances, you would pass an instanceName to `init`. This instance will be selected when invoking other methods. See the above link to the doc site for more info and examples.
     */this.Store={},this._instances={},this.IdentityType=Types.IdentityType,this.EventType=Types.EventType,this.CommerceEventType=Types.CommerceEventType,this.PromotionType=Types.PromotionActionType,this.ProductActionType=Types.ProductActionType,"undefined"!=typeof window&&(this.isIOS=!!(window.mParticle&&window.mParticle.isIOS)&&window.mParticle.isIOS,this.config=window.mParticle&&window.mParticle.config?window.mParticle.config:{}),this.init=function(b,c,d){!c&&window.mParticle&&window.mParticle.config&&(console.warn("You did not pass a config object to mParticle.init(). Attempting to use the window.mParticle.config if it exists. Please note that in a future release, this may not work and mParticle will not initialize properly"),c=window.mParticle?window.mParticle.config:{}),d=(d&&0!==d.length?d:Constants.DefaultInstance).toLowerCase();var e=a._instances[d];e===void 0&&(e=new mParticleInstance(b,c,d),a._instances[d]=e),e.init(b,c,d);},this.getInstance=function(b){var c;return b?(c=a._instances[b.toLowerCase()],c?c:(console.log("You tried to initialize an instance named "+b+". This instance does not exist. Check your instance name or initialize a new instance with this name before calling it."),null)):(b=Constants.DefaultInstance,c=a._instances[b],c||(c=new mParticleInstance(b),a._instances[Constants.DefaultInstance]=c),c)},this.getDeviceId=function(){return a.getInstance().getDeviceId()},this.startNewSession=function(){a.getInstance().startNewSession();},this.endSession=function(){a.getInstance().endSession();},this.setLogLevel=function(b){a.getInstance().setLogLevel(b);},this.ready=function(b){a.getInstance().ready(b);},this.setAppVersion=function(b){a.getInstance().setAppVersion(b);},this.getAppName=function(){return a.getInstance().getAppName()},this.setAppName=function(b){a.getInstance().setAppName(b);},this.getAppVersion=function(){return a.getInstance().getAppVersion()},this.stopTrackingLocation=function(){a.getInstance().stopTrackingLocation();},this.startTrackingLocation=function(b){a.getInstance().startTrackingLocation(b);},this.setPosition=function(b,c){a.getInstance().setPosition(b,c);},this.startNewSession=function(){a.getInstance().startNewSession();},this.endSession=function(){a.getInstance().endSession();},this.logBaseEvent=function(b,c){a.getInstance().logBaseEvent(b,c);},this.logEvent=function(b,c,d,e,f){a.getInstance().logEvent(b,c,d,e,f);},this.logError=function(b,c){a.getInstance().logError(b,c);},this.logLink=function(b,c,d,e){a.getInstance().logLink(b,c,d,e);},this.logForm=function(b,c,d,e){a.getInstance().logForm(b,c,d,e);},this.logPageView=function(b,c,d,e){a.getInstance().logPageView(b,c,d,e);},this.upload=function(){a.getInstance().upload();},this.eCommerce={Cart:{add:function add(b,c){a.getInstance().eCommerce.Cart.add(b,c);},remove:function remove(b,c){a.getInstance().eCommerce.Cart.remove(b,c);},clear:function clear(){a.getInstance().eCommerce.Cart.clear();}},setCurrencyCode:function setCurrencyCode(b){a.getInstance().eCommerce.setCurrencyCode(b);},createProduct:function createProduct(b,c,d,e,f,g,h,i,j,k){return a.getInstance().eCommerce.createProduct(b,c,d,e,f,g,h,i,j,k)},createPromotion:function createPromotion(b,c,d,e){return a.getInstance().eCommerce.createPromotion(b,c,d,e)},createImpression:function createImpression(b,c){return a.getInstance().eCommerce.createImpression(b,c)},createTransactionAttributes:function createTransactionAttributes(b,c,d,e,f,g){return a.getInstance().eCommerce.createTransactionAttributes(b,c,d,e,f,g)},logCheckout:function logCheckout(b,c,d,e){a.getInstance().eCommerce.logCheckout(b,c,d,e);},logProductAction:function logProductAction(b,c,d,e,f,g){a.getInstance().eCommerce.logProductAction(b,c,d,e,f,g);},logPurchase:function logPurchase(b,c,d,e,f){a.getInstance().eCommerce.logPurchase(b,c,d,e,f);},logPromotion:function logPromotion(b,c,d,e,f){a.getInstance().eCommerce.logPromotion(b,c,d,e,f);},logImpression:function logImpression(b,c,d,e){a.getInstance().eCommerce.logImpression(b,c,d,e);},logRefund:function logRefund(b,c,d,e,f){a.getInstance().eCommerce.logRefund(b,c,d,e,f);},expandCommerceEvent:function expandCommerceEvent(b){return a.getInstance().eCommerce.expandCommerceEvent(b)}},this.setSessionAttribute=function(b,c){a.getInstance().setSessionAttribute(b,c);},this.setOptOut=function(b){a.getInstance().setOptOut(b);},this.setIntegrationAttribute=function(b,c){a.getInstance().setIntegrationAttribute(b,c);},this.getIntegrationAttributes=function(b){return a.getInstance().getIntegrationAttributes(b)},this.Identity={HTTPCodes:a.getInstance().Identity.HTTPCodes,aliasUsers:function aliasUsers(b,c){a.getInstance().Identity.aliasUsers(b,c);},createAliasRequest:function createAliasRequest(b,c){return a.getInstance().Identity.createAliasRequest(b,c)},getCurrentUser:function getCurrentUser(){return a.getInstance().Identity.getCurrentUser()},getUser:function getUser(b){return a.getInstance().Identity.getUser(b)},getUsers:function getUsers(){return a.getInstance().Identity.getUsers()},identify:function identify(b,c){a.getInstance().Identity.identify(b,c);},login:function login(b,c){a.getInstance().Identity.login(b,c);},logout:function logout(b,c){a.getInstance().Identity.logout(b,c);},modify:function modify(b,c){a.getInstance().Identity.modify(b,c);}},this.sessionManager={getSession:function getSession(){return a.getInstance()._SessionManager.getSession()}},this.Consent={createConsentState:function createConsentState(){return a.getInstance().Consent.createConsentState()},createGDPRConsent:function createGDPRConsent(b,c,d,e,f){return a.getInstance().Consent.createGDPRConsent(b,c,d,e,f)},createCCPAConsent:function createCCPAConsent(b,c,d,e,f){return a.getInstance().Consent.createGDPRConsent(b,c,d,e,f)}},this.reset=function(){a.getInstance().reset(a.getInstance());},this._resetForTests=function(b,c){"boolean"==typeof c?a.getInstance()._resetForTests(b,c,a.getInstance()):a.getInstance()._resetForTests(b,!1,a.getInstance());},this.configurePixel=function(b){a.getInstance().configurePixel(b);},this._setIntegrationDelay=function(b,c){a.getInstance()._setIntegrationDelay(b,c);},this._getIntegrationDelays=function(){return a.getInstance()._getIntegrationDelays()},this.getVersion=function(){return a.getInstance().getVersion()},this.generateHash=function(b){return a.getInstance().generateHash(b)},this.addForwarder=function(b){a.getInstance().addForwarder(b);},this._getActiveForwarders=function(){return a.getInstance()._getActiveForwarders()};}var mparticleInstance=new mParticle$1;"undefined"!=typeof window&&(window.mParticle=mparticleInstance,window.mParticle._BatchValidator=new _BatchValidator);

export default mparticleInstance;
