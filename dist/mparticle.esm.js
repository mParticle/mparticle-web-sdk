if (typeof globalThis !== 'undefined') {globalThis.regeneratorRuntime = undefined}

// Base64 encoder/decoder - http://www.webtoolkit.info/javascript_base64.html
var Base64$1={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",// Input must be a string
encode:function(a){try{if(window.btoa&&window.atob)return window.btoa(unescape(encodeURIComponent(a)))}catch(a){console.error("Error encoding cookie values into Base64:"+a);}return this._encode(a)},_encode:function(a){var b,c,d,e,f,g,h,j="",k=0;for(a=UTF8.encode(a);k<a.length;)b=a.charCodeAt(k++),c=a.charCodeAt(k++),d=a.charCodeAt(k++),e=b>>2,f=(3&b)<<4|c>>4,g=(15&c)<<2|d>>6,h=63&d,isNaN(c)?g=h=64:isNaN(d)&&(h=64),j=j+Base64$1._keyStr.charAt(e)+Base64$1._keyStr.charAt(f)+Base64$1._keyStr.charAt(g)+Base64$1._keyStr.charAt(h);return j},decode:function(a){try{if(window.btoa&&window.atob)return decodeURIComponent(escape(window.atob(a)))}catch(a){//log(e);
}return Base64$1._decode(a)},_decode:function(a){var b,c,d,e,f,g,h,j="",k=0;for(a=a.replace(/[^A-Za-z0-9\+\/\=]/g,"");k<a.length;)e=Base64$1._keyStr.indexOf(a.charAt(k++)),f=Base64$1._keyStr.indexOf(a.charAt(k++)),g=Base64$1._keyStr.indexOf(a.charAt(k++)),h=Base64$1._keyStr.indexOf(a.charAt(k++)),b=e<<2|f>>4,c=(15&f)<<4|g>>2,d=(3&g)<<6|h,j+=String.fromCharCode(b),64!==g&&(j+=String.fromCharCode(c)),64!==h&&(j+=String.fromCharCode(d));return j=UTF8.decode(j),j}},UTF8={encode:function(a){for(var b,d="",e=0;e<a.length;e++)b=a.charCodeAt(e),128>b?d+=String.fromCharCode(b):127<b&&2048>b?(d+=String.fromCharCode(192|b>>6),d+=String.fromCharCode(128|63&b)):(d+=String.fromCharCode(224|b>>12),d+=String.fromCharCode(128|63&b>>6),d+=String.fromCharCode(128|63&b));return d},decode:function(a){for(var b="",d=0,e=0,f=0,g=0;d<a.length;)e=a.charCodeAt(d),128>e?(b+=String.fromCharCode(e),d++):191<e&&224>e?(f=a.charCodeAt(d+1),b+=String.fromCharCode((31&e)<<6|63&f),d+=2):(f=a.charCodeAt(d+1),g=a.charCodeAt(d+2),b+=String.fromCharCode((15&e)<<12|(63&f)<<6|63&g),d+=3);return b}};var Polyfill = {// forEach polyfill
// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.io/#x15.4.4.18
forEach:function forEach(a,b){var c,d;if(null==this)throw new TypeError(" this is null or not defined");var e=Object(this),f=e.length>>>0;if("function"!=typeof a)throw new TypeError(a+" is not a function");for(1<arguments.length&&(c=b),d=0;d<f;){var g;d in e&&(g=e[d],a.call(c,g,d,e)),d++;}},// map polyfill
// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.io/#x15.4.4.19
map:function map(a,b){var c,d,e;if(null===this)throw new TypeError(" this is null or not defined");var f=Object(this),g=f.length>>>0;if("function"!=typeof a)throw new TypeError(a+" is not a function");for(1<arguments.length&&(c=b),d=Array(g),e=0;e<g;){var h,i;e in f&&(h=f[e],i=a.call(c,h,e,f),d[e]=i),e++;}return d},// filter polyfill
// Prodcution steps of ECMA-262, Edition 5
// Reference: http://es5.github.io/#x15.4.4.20
filter:function filter(a/*, thisArg*/){if(void 0===this||null===this)throw new TypeError;var b=Object(this),c=b.length>>>0;if("function"!=typeof a)throw new TypeError;for(var d=[],e=2<=arguments.length?arguments[1]:void 0,f=0;f<c;f++)if(f in b){var g=b[f];a.call(e,g,f,b)&&d.push(g);}return d},// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
isArray:function isArray(a){return "[object Array]"===Object.prototype.toString.call(a)},Base64:Base64$1};

function _typeof(o) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, _typeof(o);
}

function _toPrimitive(input, hint) {
  if (_typeof(input) !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (_typeof(res) !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}

function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, "string");
  return _typeof(key) === "symbol" ? key : String(key);
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

var _TriggerUploadType,MessageType$2={SessionStart:1,SessionEnd:2,PageView:3,PageEvent:4,CrashReport:5,OptOut:6,AppStateTransition:10,Profile:14,Commerce:16,Media:20,UserAttributeChange:17,UserIdentityChange:18},TriggerUploadType=(_TriggerUploadType={},_defineProperty(_TriggerUploadType,MessageType$2.Commerce,1),_defineProperty(_TriggerUploadType,MessageType$2.UserAttributeChange,1),_defineProperty(_TriggerUploadType,MessageType$2.UserIdentityChange,1),_TriggerUploadType),EventType={Unknown:0,Navigation:1,Location:2,Search:3,Transaction:4,UserContent:5,UserPreference:6,Social:7,Other:8,Media:9,getName:function getName(a){return a===EventType.Unknown?"Unknown":a===EventType.Navigation?"Navigation":a===EventType.Location?"Location":a===EventType.Search?"Search":a===EventType.Transaction?"Transaction":a===EventType.UserContent?"User Content":a===EventType.UserPreference?"User Preference":a===EventType.Social?"Social":a===CommerceEventType.ProductAddToCart?"Product Added to Cart":a===CommerceEventType.ProductAddToWishlist?"Product Added to Wishlist":a===CommerceEventType.ProductCheckout?"Product Checkout":a===CommerceEventType.ProductCheckoutOption?"Product Checkout Options":a===CommerceEventType.ProductClick?"Product Click":a===CommerceEventType.ProductImpression?"Product Impression":a===CommerceEventType.ProductPurchase?"Product Purchased":a===CommerceEventType.ProductRefund?"Product Refunded":a===CommerceEventType.ProductRemoveFromCart?"Product Removed From Cart":a===CommerceEventType.ProductRemoveFromWishlist?"Product Removed from Wishlist":a===CommerceEventType.ProductViewDetail?"Product View Details":a===CommerceEventType.PromotionClick?"Promotion Click":a===CommerceEventType.PromotionView?"Promotion View":"Other"}},CommerceEventType={ProductAddToCart:10,ProductRemoveFromCart:11,ProductCheckout:12,ProductCheckoutOption:13,ProductClick:14,ProductViewDetail:15,ProductPurchase:16,ProductRefund:17,PromotionView:18,PromotionClick:19,ProductAddToWishlist:20,ProductRemoveFromWishlist:21,ProductImpression:22},IdentityType$1={Other:0,CustomerId:1,Facebook:2,Twitter:3,Google:4,Microsoft:5,Yahoo:6,Email:7,FacebookCustomAudienceId:9,Other2:10,Other3:11,Other4:12,Other5:13,Other6:14,Other7:15,Other8:16,Other9:17,Other10:18,MobileNumber:19,PhoneNumber2:20,PhoneNumber3:21};// Dictionary that contains MessageTypes that will
// trigger an immediate upload.
// Continuation of enum above, but in seperate object since we don't expose these to end user
IdentityType$1.isValid=function(a){if("number"==typeof a)for(var b in IdentityType$1)if(IdentityType$1.hasOwnProperty(b)&&IdentityType$1[b]===a)return !0;return !1},IdentityType$1.getName=function(a){return a===window.mParticle.IdentityType.CustomerId?"Customer ID":a===window.mParticle.IdentityType.Facebook?"Facebook ID":a===window.mParticle.IdentityType.Twitter?"Twitter ID":a===window.mParticle.IdentityType.Google?"Google ID":a===window.mParticle.IdentityType.Microsoft?"Microsoft ID":a===window.mParticle.IdentityType.Yahoo?"Yahoo ID":a===window.mParticle.IdentityType.Email?"Email":a===window.mParticle.IdentityType.FacebookCustomAudienceId?"Facebook App User ID":"Other ID"},IdentityType$1.getIdentityType=function(a){return "other"===a?IdentityType$1.Other:"customerid"===a?IdentityType$1.CustomerId:"facebook"===a?IdentityType$1.Facebook:"twitter"===a?IdentityType$1.Twitter:"google"===a?IdentityType$1.Google:"microsoft"===a?IdentityType$1.Microsoft:"yahoo"===a?IdentityType$1.Yahoo:"email"===a?IdentityType$1.Email:"facebookcustomaudienceid"===a?IdentityType$1.FacebookCustomAudienceId:"other2"===a?IdentityType$1.Other2:"other3"===a?IdentityType$1.Other3:"other4"===a?IdentityType$1.Other4:"other5"===a?IdentityType$1.Other5:"other6"===a?IdentityType$1.Other6:"other7"===a?IdentityType$1.Other7:"other8"===a?IdentityType$1.Other8:"other9"===a?IdentityType$1.Other9:"other10"===a?IdentityType$1.Other10:"mobile_number"===a?IdentityType$1.MobileNumber:"phone_number_2"===a?IdentityType$1.PhoneNumber2:!("phone_number_3"!=a)&&IdentityType$1.PhoneNumber3},IdentityType$1.getIdentityName=function(a){return a===IdentityType$1.Other?"other":a===IdentityType$1.CustomerId?"customerid":a===IdentityType$1.Facebook?"facebook":a===IdentityType$1.Twitter?"twitter":a===IdentityType$1.Google?"google":a===IdentityType$1.Microsoft?"microsoft":a===IdentityType$1.Yahoo?"yahoo":a===IdentityType$1.Email?"email":a===IdentityType$1.FacebookCustomAudienceId?"facebookcustomaudienceid":a===IdentityType$1.Other2?"other2":a===IdentityType$1.Other3?"other3":a===IdentityType$1.Other4?"other4":a===IdentityType$1.Other5?"other5":a===IdentityType$1.Other6?"other6":a===IdentityType$1.Other7?"other7":a===IdentityType$1.Other8?"other8":a===IdentityType$1.Other9?"other9":a===IdentityType$1.Other10?"other10":a===IdentityType$1.MobileNumber?"mobile_number":a===IdentityType$1.PhoneNumber2?"phone_number_2":a===IdentityType$1.PhoneNumber3?"phone_number_3":void 0};var ProductActionType={Unknown:0,AddToCart:1,RemoveFromCart:2,Checkout:3,CheckoutOption:4,Click:5,ViewDetail:6,Purchase:7,Refund:8,AddToWishlist:9,RemoveFromWishlist:10};ProductActionType.getName=function(a){return a===ProductActionType.AddToCart?"Add to Cart":a===ProductActionType.RemoveFromCart?"Remove from Cart":a===ProductActionType.Checkout?"Checkout":a===ProductActionType.CheckoutOption?"Checkout Option":a===ProductActionType.Click?"Click":a===ProductActionType.ViewDetail?"View Detail":a===ProductActionType.Purchase?"Purchase":a===ProductActionType.Refund?"Refund":a===ProductActionType.AddToWishlist?"Add to Wishlist":a===ProductActionType.RemoveFromWishlist?"Remove from Wishlist":"Unknown"},ProductActionType.getExpansionName=function(a){return a===ProductActionType.AddToCart?"add_to_cart":a===ProductActionType.RemoveFromCart?"remove_from_cart":a===ProductActionType.Checkout?"checkout":a===ProductActionType.CheckoutOption?"checkout_option":a===ProductActionType.Click?"click":a===ProductActionType.ViewDetail?"view_detail":a===ProductActionType.Purchase?"purchase":a===ProductActionType.Refund?"refund":a===ProductActionType.AddToWishlist?"add_to_wishlist":a===ProductActionType.RemoveFromWishlist?"remove_from_wishlist":"unknown"};var PromotionActionType={Unknown:0,PromotionView:1,PromotionClick:2};PromotionActionType.getName=function(a){return a===PromotionActionType.PromotionView?"view":a===PromotionActionType.PromotionClick?"click":"unknown"},PromotionActionType.getExpansionName=function(a){return a===PromotionActionType.PromotionView?"view":a===PromotionActionType.PromotionClick?"click":"unknown"};var ProfileMessageType={Logout:3},ApplicationTransitionType$1={AppInit:1},Environment={Production:"production",Development:"development"};var Types = {MessageType:MessageType$2,EventType:EventType,CommerceEventType:CommerceEventType,IdentityType:IdentityType$1,ProfileMessageType:ProfileMessageType,ApplicationTransitionType:ApplicationTransitionType$1,ProductActionType:ProductActionType,PromotionActionType:PromotionActionType,TriggerUploadType:TriggerUploadType,Environment:Environment};

var version = "2.23.6";

var Constants={sdkVersion:version,sdkVendor:"mparticle",platform:"web",Messages:{DeprecationMessages:{MethodIsDeprecatedPostfix:"is a deprecated method and will be removed in future releases",AlternativeMethodPrefix:"Please use the alternate method:"},ErrorMessages:{NoToken:"A token must be specified.",EventNameInvalidType:"Event name must be a valid string value.",EventDataInvalidType:"Event data must be a valid object hash.",LoggingDisabled:"Event logging is currently disabled.",CookieParseError:"Could not parse cookie",EventEmpty:"Event object is null or undefined, cancelling send",APIRequestEmpty:"APIRequest is null or undefined, cancelling send",NoEventType:"Event type must be specified.",TransactionIdRequired:"Transaction ID is required",TransactionRequired:"A transaction attributes object is required",PromotionIdRequired:"Promotion ID is required",BadAttribute:"Attribute value cannot be object or array",BadKey:"Key value cannot be object or array",BadLogPurchase:"Transaction attributes and a product are both required to log a purchase, https://docs.mparticle.com/?javascript#measuring-transactions"},InformationMessages:{CookieSearch:"Searching for cookie",CookieFound:"Cookie found, parsing values",CookieNotFound:"Cookies not found",CookieSet:"Setting cookie",CookieSync:"Performing cookie sync",SendBegin:"Starting to send event",SendIdentityBegin:"Starting to send event to identity server",SendWindowsPhone:"Sending event to Windows Phone container",SendIOS:"Calling iOS path: ",SendAndroid:"Calling Android JS interface method: ",SendHttp:"Sending event to mParticle HTTP service",SendAliasHttp:"Sending alias request to mParticle HTTP service",SendIdentityHttp:"Sending event to mParticle HTTP service",StartingNewSession:"Starting new Session",StartingLogEvent:"Starting to log event",StartingLogOptOut:"Starting to log user opt in/out",StartingEndSession:"Starting to end session",StartingInitialization:"Starting to initialize",StartingLogCommerceEvent:"Starting to log commerce event",StartingAliasRequest:"Starting to Alias MPIDs",LoadingConfig:"Loading configuration options",AbandonLogEvent:"Cannot log event, logging disabled or developer token not set",AbandonAliasUsers:"Cannot Alias Users, logging disabled or developer token not set",AbandonStartSession:"Cannot start session, logging disabled or developer token not set",AbandonEndSession:"Cannot end session, logging disabled or developer token not set",NoSessionToEnd:"Cannot end session, no active session found"},ValidationMessages:{ModifyIdentityRequestUserIdentitiesPresent:"identityRequests to modify require userIdentities to be present. Request not sent to server. Please fix and try again",IdentityRequesetInvalidKey:"There is an invalid key on your identityRequest object. It can only contain a `userIdentities` object and a `onUserAlias` function. Request not sent to server. Please fix and try again.",OnUserAliasType:"The onUserAlias value must be a function.",UserIdentities:"The userIdentities key must be an object with keys of identityTypes and values of strings. Request not sent to server. Please fix and try again.",UserIdentitiesInvalidKey:"There is an invalid identity key on your `userIdentities` object within the identityRequest. Request not sent to server. Please fix and try again.",UserIdentitiesInvalidValues:"All user identity values must be strings or null. Request not sent to server. Please fix and try again.",AliasMissingMpid:"Alias Request must contain both a destinationMpid and a sourceMpid",AliasNonUniqueMpid:"Alias Request's destinationMpid and sourceMpid must be unique",AliasMissingTime:"Alias Request must have both a startTime and an endTime",AliasStartBeforeEndTime:"Alias Request's endTime must be later than its startTime"}},NativeSdkPaths:{LogEvent:"logEvent",SetUserTag:"setUserTag",RemoveUserTag:"removeUserTag",SetUserAttribute:"setUserAttribute",RemoveUserAttribute:"removeUserAttribute",SetSessionAttribute:"setSessionAttribute",AddToCart:"addToCart",RemoveFromCart:"removeFromCart",ClearCart:"clearCart",LogOut:"logOut",SetUserAttributeList:"setUserAttributeList",RemoveAllUserAttributes:"removeAllUserAttributes",GetUserAttributesLists:"getUserAttributesLists",GetAllUserAttributes:"getAllUserAttributes",Identify:"identify",Logout:"logout",Login:"login",Modify:"modify",Alias:"aliasUsers",Upload:"upload"},StorageNames:{localStorageName:"mprtcl-api",localStorageNameV3:"mprtcl-v3",cookieName:"mprtcl-api",cookieNameV2:"mprtcl-v2",cookieNameV3:"mprtcl-v3",localStorageNameV4:"mprtcl-v4",localStorageProductsV4:"mprtcl-prodv4",cookieNameV4:"mprtcl-v4",currentStorageName:"mprtcl-v4",currentStorageProductsName:"mprtcl-prodv4"},DefaultConfig:{cookieDomain:null,cookieExpiration:365,logLevel:null,timeout:300,sessionTimeout:30,maxProducts:20,forwarderStatsTimeout:5e3,integrationDelayTimeout:5e3,maxCookieSize:3e3,aliasMaxWindow:90,uploadInterval:0// Maximum milliseconds in between batch uploads, below 500 will mean immediate upload
},DefaultUrls:{v1SecureServiceUrl:"jssdks.mparticle.com/v1/JS/",v2SecureServiceUrl:"jssdks.mparticle.com/v2/JS/",v3SecureServiceUrl:"jssdks.mparticle.com/v3/JS/",configUrl:"jssdkcdns.mparticle.com/JS/v2/",identityUrl:"identity.mparticle.com/v1/",aliasUrl:"jssdks.mparticle.com/v1/identity/"},Base64CookieKeys:{csm:1,sa:1,ss:1,ua:1,ui:1,csd:1,ia:1,con:1},SDKv2NonMPIDCookieKeys:{gs:1,cu:1,l:1,globalSettings:1,currentUserMPID:1},HTTPCodes:{noHttpCoverage:-1,activeIdentityRequest:-2,activeSession:-3,validationIssue:-4,nativeIdentityRequest:-5,loggingDisabledOrMissingAPIKey:-6,tooManyRequests:429},FeatureFlags:{ReportBatching:"reportBatching",EventBatchingIntervalMillis:"eventBatchingIntervalMillis",OfflineStorage:"offlineStorage"},DefaultInstance:"default_instance",CCPAPurpose:"data_sale_opt_out"};

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

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

var SDKProductActionType;(function(a){a[a.Unknown=0]="Unknown",a[a.AddToCart=1]="AddToCart",a[a.RemoveFromCart=2]="RemoveFromCart",a[a.Checkout=3]="Checkout",a[a.CheckoutOption=4]="CheckoutOption",a[a.Click=5]="Click",a[a.ViewDetail=6]="ViewDetail",a[a.Purchase=7]="Purchase",a[a.Refund=8]="Refund",a[a.AddToWishlist=9]="AddToWishlist",a[a.RemoveFromWishlist=10]="RemoveFromWishlist";})(SDKProductActionType||(SDKProductActionType={}));var SDKIdentityTypeEnum;(function(a){a.other="other",a.customerId="customerid",a.facebook="facebook",a.twitter="twitter",a.google="google",a.microsoft="microsoft",a.yahoo="yahoo",a.email="email",a.alias="alias",a.facebookCustomAudienceId="facebookcustomaudienceid",a.otherId2="other2",a.otherId3="other3",a.otherId4="other4",a.otherId5="other5",a.otherId6="other6",a.otherId7="other7",a.otherId8="other8",a.otherId9="other9",a.otherId10="other10",a.mobileNumber="mobile_number",a.phoneNumber2="phone_number_2",a.phoneNumber3="phone_number_3";})(SDKIdentityTypeEnum||(SDKIdentityTypeEnum={}));

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

var Messages$9=Constants.Messages,createCookieString=function(a){return replaceCommasWithPipes(replaceQuotesWithApostrophes(a))},revertCookieString=function(a){return replacePipesWithCommas(replaceApostrophesWithQuotes(a))},inArray=function(a,b){var c=0;if(Array.prototype.indexOf)return 0<=a.indexOf(b,0);for(var d=a.length;c<d;c++)if(c in a&&a[c]===b)return !0;return !1},findKeyInObject=function(a,b){if(b&&a)for(var c in a)if(a.hasOwnProperty(c)&&c.toLowerCase()===b.toLowerCase())return c;return null},generateDeprecationMessage=function(a,b){var c=[a,Messages$9.DeprecationMessages.MethodIsDeprecatedPostfix];return b&&(c.push(b),c.push(Messages$9.DeprecationMessages.MethodIsDeprecatedPostfix)),c.join(" ")};function generateHash(a){var b,c=0;if(void 0===a||null===a)return 0;if(a=a.toString().toLowerCase(),Array.prototype.reduce)return a.split("").reduce(function(c,d){return c=(c<<5)-c+d.charCodeAt(0),c&c},0);if(0===a.length)return c;for(var d=0;d<a.length;d++)b=a.charCodeAt(d),c=(c<<5)-c+b,c&=c;return c}var generateRandomValue=function(){var b,c;return window.crypto&&window.crypto.getRandomValues&&(b=window.crypto.getRandomValues(new Uint8Array(1))),b?(c^b[0]%16>>c/4).toString(16):(c^16*Math.random()>>c/4).toString(16)},generateUniqueId=function(b){return void 0===b&&(b=""),b// if the placeholder was passed, return
?generateRandomValue()// if the placeholder was passed, return
:// [1e7] -> // 10000000 +
// -1e3  -> // -1000 +
// -4e3  -> // -4000 +
// -8e3  -> // -80000000 +
// -1e11 -> //-100000000000,
"".concat(1e7,"-").concat(1e3,"-").concat(4e3,"-").concat(8e3,"-").concat(1e11).replace(/[018]/g,// zeroes, ones, and eights with
generateUniqueId// random hex digits
)},getRampNumber=function(a){if(!a)return 100;var b=generateHash(a);return Math.abs(b%100)+1},isObject=function(a){var b=Object.prototype.toString.call(a);return "[object Object]"===b||"[object Error]"===b},parseNumber=function(a){if(isNaN(a)||!isFinite(a))return 0;var b=parseFloat(a);return isNaN(b)?0:b},parseStringOrNumber=function(a){return isStringOrNumber(a)?a:null},replaceCommasWithPipes=function(a){return a.replace(/,/g,"|")},replacePipesWithCommas=function(a){return a.replace(/\|/g,",")},replaceApostrophesWithQuotes=function(a){return a.replace(/\'/g,"\"")},replaceQuotesWithApostrophes=function(a){return a.replace(/\"/g,"'")},returnConvertedBoolean=function(a){return "false"!==a&&"0"!==a&&!!a},decoded=function(a){return decodeURIComponent(a.replace(/\+/g," "))},converted=function(a){return 0===a.indexOf("\"")&&(a=a.slice(1,-1).replace(/\\"/g,"\"").replace(/\\\\/g,"\\")),a},isString=function(a){return "string"==typeof a},isNumber=function(a){return "number"==typeof a},isFunction=function(a){return "function"==typeof a},toDataPlanSlug=function(a){// Make sure we are only acting on strings or numbers
return isStringOrNumber(a)?a.toString().toLowerCase().replace(/[^0-9a-zA-Z]+/g,"_"):""},isDataPlanSlug=function(a){return a===toDataPlanSlug(a)},isStringOrNumber=function(a){return isString(a)||isNumber(a)},isEmpty=function(a){return null==a||!(Object.keys(a)||a).length};/**
 * Returns a value between 1-100 inclusive.
 */ // FIXME: REFACTOR for V3

function convertEvents(a,b,c){if(!a)return null;if(!b||1>b.length)return null;for(var d,e=c.Identity.getCurrentUser(),f=[],g=null,h=0,i=b;h<i.length;h++)if(d=i[h],d){g=d;var j=convertEvent(d);j&&f.push(j);}if(!g)return null;var k=null;// Add the consent state from either the Last Event or the user
isEmpty(g.ConsentState)?!isEmpty(e)&&(k=e.getConsentState()):k=g.ConsentState;var l={source_request_id:c._Helpers.generateUniqueId(),mpid:a,timestamp_unixtime_ms:new Date().getTime(),environment:g.Debug?dist.BatchEnvironmentEnum.development:dist.BatchEnvironmentEnum.production,events:f,mp_deviceid:g.DeviceId,sdk_version:g.SDKVersion,// TODO: Refactor this to read from _Store or a global config
application_info:{application_version:g.AppVersion,application_name:g.AppName,package:g.Package,sideloaded_kits_count:c._Store.sideloadedKitsCount},device_info:{platform:dist.DeviceInformationPlatformEnum.web,screen_width:window.screen.width,screen_height:window.screen.height},user_attributes:g.UserAttributes,user_identities:convertUserIdentities(g.UserIdentities),consent_state:convertConsentState(k),integration_attributes:g.IntegrationAttributes};return g.DataPlan&&g.DataPlan.PlanId&&(l.context={data_plan:{plan_id:g.DataPlan.PlanId,plan_version:g.DataPlan.PlanVersion||void 0}}),l}function convertConsentState(a){if(isEmpty(a))return null;var b={gdpr:convertGdprConsentState(a.getGDPRConsentState()),ccpa:convertCcpaConsentState(a.getCCPAConsentState())};return b}function convertGdprConsentState(a){if(!a)return null;var b={};for(var c in a)a.hasOwnProperty(c)&&(b[c]={consented:a[c].Consented,hardware_id:a[c].HardwareId,document:a[c].ConsentDocument,timestamp_unixtime_ms:a[c].Timestamp,location:a[c].Location});return b}function convertCcpaConsentState(a){if(!a)return null;var b={data_sale_opt_out:{consented:a.Consented,hardware_id:a.HardwareId,document:a.ConsentDocument,timestamp_unixtime_ms:a.Timestamp,location:a.Location}};return b}function convertUserIdentities(a){if(!a||!a.length)return null;for(var b,c={},d=0,e=a;d<e.length;d++)switch(b=e[d],b.Type){case Types.IdentityType.CustomerId:c.customer_id=b.Identity;break;case Types.IdentityType.Email:c.email=b.Identity;break;case Types.IdentityType.Facebook:c.facebook=b.Identity;break;case Types.IdentityType.FacebookCustomAudienceId:c.facebook_custom_audience_id=b.Identity;break;case Types.IdentityType.Google:c.google=b.Identity;break;case Types.IdentityType.Microsoft:c.microsoft=b.Identity;break;case Types.IdentityType.Other:c.other=b.Identity;break;case Types.IdentityType.Other2:c.other_id_2=b.Identity;break;case Types.IdentityType.Other3:c.other_id_3=b.Identity;break;case Types.IdentityType.Other4:c.other_id_4=b.Identity;break;case Types.IdentityType.Other5:c.other_id_5=b.Identity;break;case Types.IdentityType.Other6:c.other_id_6=b.Identity;break;case Types.IdentityType.Other7:c.other_id_7=b.Identity;break;case Types.IdentityType.Other8:c.other_id_8=b.Identity;break;case Types.IdentityType.Other9:c.other_id_9=b.Identity;break;case Types.IdentityType.Other10:c.other_id_10=b.Identity;break;case Types.IdentityType.MobileNumber:c.mobile_number=b.Identity;break;case Types.IdentityType.PhoneNumber2:c.phone_number_2=b.Identity;break;case Types.IdentityType.PhoneNumber3:c.phone_number_3=b.Identity;break;}return c}function convertEvent(a){if(!a)return null;switch(a.EventDataType){case Types.MessageType.AppStateTransition:return convertAST(a);case Types.MessageType.Commerce:return convertCommerceEvent(a);case Types.MessageType.CrashReport:return convertCrashReportEvent(a);case Types.MessageType.OptOut:return convertOptOutEvent(a);case Types.MessageType.PageEvent:// Note: Media Events are also sent as PageEvents/CustomEvents
return convertCustomEvent(a);case Types.MessageType.PageView:return convertPageViewEvent(a);case Types.MessageType.Profile://deprecated and not supported by the web SDK
return null;case Types.MessageType.SessionEnd:return convertSessionEndEvent(a);case Types.MessageType.SessionStart:return convertSessionStartEvent(a);case Types.MessageType.UserAttributeChange:return convertUserAttributeChangeEvent(a);case Types.MessageType.UserIdentityChange:return convertUserIdentityChangeEvent(a);}return null}function convertProductActionType(a){if(!a)return dist.ProductActionActionEnum.unknown;return a===SDKProductActionType.AddToCart?dist.ProductActionActionEnum.addToCart:a===SDKProductActionType.AddToWishlist?dist.ProductActionActionEnum.addToWishlist:a===SDKProductActionType.Checkout?dist.ProductActionActionEnum.checkout:a===SDKProductActionType.CheckoutOption?dist.ProductActionActionEnum.checkoutOption:a===SDKProductActionType.Click?dist.ProductActionActionEnum.click:a===SDKProductActionType.Purchase?dist.ProductActionActionEnum.purchase:a===SDKProductActionType.Refund?dist.ProductActionActionEnum.refund:a===SDKProductActionType.RemoveFromCart?dist.ProductActionActionEnum.removeFromCart:a===SDKProductActionType.RemoveFromWishlist?dist.ProductActionActionEnum.removeFromWishlist:a===SDKProductActionType.ViewDetail?dist.ProductActionActionEnum.viewDetail:dist.ProductActionActionEnum.unknown}function convertProductAction(a){if(!a.ProductAction)return null;var b={action:convertProductActionType(a.ProductAction.ProductActionType),checkout_step:a.ProductAction.CheckoutStep,checkout_options:a.ProductAction.CheckoutOptions,transaction_id:a.ProductAction.TransactionId,affiliation:a.ProductAction.Affiliation,total_amount:a.ProductAction.TotalAmount,tax_amount:a.ProductAction.TaxAmount,shipping_amount:a.ProductAction.ShippingAmount,coupon_code:a.ProductAction.CouponCode,products:convertProducts(a.ProductAction.ProductList)};return b}function convertProducts(a){if(!a||!a.length)return null;for(var b=[],c=0,d=a;c<d.length;c++){var e=d[c],f={id:e.Sku,name:e.Name,brand:e.Brand,category:e.Category,variant:e.Variant,total_product_amount:e.TotalAmount,position:e.Position,price:e.Price,quantity:e.Quantity,coupon_code:e.CouponCode,custom_attributes:e.Attributes};b.push(f);}return b}function convertPromotionAction(a){if(!a.PromotionAction)return null;var b={action:a.PromotionAction.PromotionActionType,promotions:convertPromotions(a.PromotionAction.PromotionList)};return b}function convertPromotions(a){if(!a||!a.length)return null;for(var b=[],c=0,d=a;c<d.length;c++){var e=d[c],f={id:e.Id,name:e.Name,creative:e.Creative,position:e.Position};b.push(f);}return b}function convertImpressions(a){if(!a.ProductImpressions)return null;for(var b=[],c=0,d=a.ProductImpressions;c<d.length;c++){var e=d[c],f={product_impression_list:e.ProductImpressionList,products:convertProducts(e.ProductList)};b.push(f);}return b}function convertShoppingCart(a){if(!a.ShoppingCart||!a.ShoppingCart.ProductList||!a.ShoppingCart.ProductList.length)return null;var b={products:convertProducts(a.ShoppingCart.ProductList)};return b}function convertCommerceEvent(a){var b=convertBaseEventData(a),c={custom_flags:a.CustomFlags,product_action:convertProductAction(a),promotion_action:convertPromotionAction(a),product_impressions:convertImpressions(a),shopping_cart:convertShoppingCart(a),currency_code:a.CurrencyCode};return c=Object.assign(c,b),{event_type:dist.EventTypeEnum.commerceEvent,data:c}}function convertCrashReportEvent(a){var b=convertBaseEventData(a),c={message:a.EventName};return c=Object.assign(c,b),{event_type:dist.EventTypeEnum.crashReport,data:c}}function convertAST(a){var b=convertBaseEventData(a),c={application_transition_type:dist.ApplicationStateTransitionEventDataApplicationTransitionTypeEnum.applicationInitialized,is_first_run:a.IsFirstRun,is_upgrade:!1,launch_referral:a.LaunchReferral};return c=Object.assign(c,b),{event_type:dist.EventTypeEnum.applicationStateTransition,data:c}}function convertSessionEndEvent(a){var b=convertBaseEventData(a),c={session_duration_ms:a.SessionLength//note: External Events DTO does not support the session mpids array as of this time.
//spanning_mpids: sdkEvent.SessionMpids
};return c=Object.assign(c,b),{event_type:dist.EventTypeEnum.sessionEnd,data:c}}function convertSessionStartEvent(a){var b=convertBaseEventData(a),c={};return c=Object.assign(c,b),{event_type:dist.EventTypeEnum.sessionStart,data:c}}function convertPageViewEvent(a){var b=convertBaseEventData(a),c={custom_flags:a.CustomFlags,screen_name:a.EventName};return c=Object.assign(c,b),{event_type:dist.EventTypeEnum.screenView,data:c}}function convertOptOutEvent(a){var b=convertBaseEventData(a),c={is_opted_out:a.OptOut};return c=Object.assign(c,b),{event_type:dist.EventTypeEnum.optOut,data:c}}function convertCustomEvent(a){var b=convertBaseEventData(a),c={custom_event_type:convertSdkEventType(a.EventCategory),custom_flags:a.CustomFlags,event_name:a.EventName};return c=Object.assign(c,b),{event_type:dist.EventTypeEnum.customEvent,data:c}}function convertSdkEventType(a){return a===Types.EventType.Other?dist.CustomEventDataCustomEventTypeEnum.other:a===Types.EventType.Location?dist.CustomEventDataCustomEventTypeEnum.location:a===Types.EventType.Navigation?dist.CustomEventDataCustomEventTypeEnum.navigation:a===Types.EventType.Search?dist.CustomEventDataCustomEventTypeEnum.search:a===Types.EventType.Social?dist.CustomEventDataCustomEventTypeEnum.social:a===Types.EventType.Transaction?dist.CustomEventDataCustomEventTypeEnum.transaction:a===Types.EventType.UserContent?dist.CustomEventDataCustomEventTypeEnum.userContent:a===Types.EventType.UserPreference?dist.CustomEventDataCustomEventTypeEnum.userPreference:a===Types.EventType.Media?dist.CustomEventDataCustomEventTypeEnum.media:a===Types.CommerceEventType.ProductAddToCart?dist.CommerceEventDataCustomEventTypeEnum.addToCart:a===Types.CommerceEventType.ProductAddToWishlist?dist.CommerceEventDataCustomEventTypeEnum.addToWishlist:a===Types.CommerceEventType.ProductCheckout?dist.CommerceEventDataCustomEventTypeEnum.checkout:a===Types.CommerceEventType.ProductCheckoutOption?dist.CommerceEventDataCustomEventTypeEnum.checkoutOption:a===Types.CommerceEventType.ProductClick?dist.CommerceEventDataCustomEventTypeEnum.click:a===Types.CommerceEventType.ProductImpression?dist.CommerceEventDataCustomEventTypeEnum.impression:a===Types.CommerceEventType.ProductPurchase?dist.CommerceEventDataCustomEventTypeEnum.purchase:a===Types.CommerceEventType.ProductRefund?dist.CommerceEventDataCustomEventTypeEnum.refund:a===Types.CommerceEventType.ProductRemoveFromCart?dist.CommerceEventDataCustomEventTypeEnum.removeFromCart:a===Types.CommerceEventType.ProductRemoveFromWishlist?dist.CommerceEventDataCustomEventTypeEnum.removeFromWishlist:a===Types.CommerceEventType.ProductViewDetail?dist.CommerceEventDataCustomEventTypeEnum.viewDetail:a===Types.CommerceEventType.PromotionClick?dist.CommerceEventDataCustomEventTypeEnum.promotionClick:a===Types.CommerceEventType.PromotionView?dist.CommerceEventDataCustomEventTypeEnum.promotionView:dist.CustomEventDataCustomEventTypeEnum.unknown}function convertBaseEventData(a){var b={timestamp_unixtime_ms:a.Timestamp,session_uuid:a.SessionId,session_start_unixtime_ms:a.SessionStartDate,custom_attributes:a.EventAttributes,location:convertSDKLocation(a.Location),source_message_id:a.SourceMessageId};return b}function convertSDKLocation(a){return a&&Object.keys(a).length?{latitude:a.lat,longitude:a.lng}:null}function convertUserAttributeChangeEvent(a){var b=convertBaseEventData(a),c={user_attribute_name:a.UserAttributeChanges.UserAttributeName,new:a.UserAttributeChanges.New,old:a.UserAttributeChanges.Old,deleted:a.UserAttributeChanges.Deleted,is_new_attribute:a.UserAttributeChanges.IsNewAttribute};return c=__assign(__assign({},c),b),{event_type:dist.EventTypeEnum.userAttributeChange,data:c}}function convertUserIdentityChangeEvent(a){var b=convertBaseEventData(a),c={new:{identity_type:convertUserIdentityTypeToServerIdentityType(a.UserIdentityChanges.New.IdentityType),identity:a.UserIdentityChanges.New.Identity||null,timestamp_unixtime_ms:a.Timestamp,created_this_batch:a.UserIdentityChanges.New.CreatedThisBatch},old:{identity_type:convertUserIdentityTypeToServerIdentityType(a.UserIdentityChanges.Old.IdentityType),identity:a.UserIdentityChanges.Old.Identity||null,timestamp_unixtime_ms:a.Timestamp,created_this_batch:a.UserIdentityChanges.Old.CreatedThisBatch}};return c=Object.assign(c,b),{event_type:dist.EventTypeEnum.userIdentityChange,data:c}}function convertUserIdentityTypeToServerIdentityType(a){return a===SDKIdentityTypeEnum.other?dist.IdentityTypeEnum.other:a===SDKIdentityTypeEnum.customerId?dist.IdentityTypeEnum.customerId:a===SDKIdentityTypeEnum.facebook?dist.IdentityTypeEnum.facebook:a===SDKIdentityTypeEnum.twitter?dist.IdentityTypeEnum.twitter:a===SDKIdentityTypeEnum.google?dist.IdentityTypeEnum.google:a===SDKIdentityTypeEnum.microsoft?dist.IdentityTypeEnum.microsoft:a===SDKIdentityTypeEnum.yahoo?dist.IdentityTypeEnum.yahoo:a===SDKIdentityTypeEnum.email?dist.IdentityTypeEnum.email:a===SDKIdentityTypeEnum.alias?dist.IdentityTypeEnum.alias:a===SDKIdentityTypeEnum.facebookCustomAudienceId?dist.IdentityTypeEnum.facebookCustomAudienceId:a===SDKIdentityTypeEnum.otherId2?dist.IdentityTypeEnum.otherId2:a===SDKIdentityTypeEnum.otherId3?dist.IdentityTypeEnum.otherId3:a===SDKIdentityTypeEnum.otherId4?dist.IdentityTypeEnum.otherId4:a===SDKIdentityTypeEnum.otherId5?dist.IdentityTypeEnum.otherId5:a===SDKIdentityTypeEnum.otherId6?dist.IdentityTypeEnum.otherId6:a===SDKIdentityTypeEnum.otherId7?dist.IdentityTypeEnum.otherId7:a===SDKIdentityTypeEnum.otherId8?dist.IdentityTypeEnum.otherId8:a===SDKIdentityTypeEnum.otherId9?dist.IdentityTypeEnum.otherId9:a===SDKIdentityTypeEnum.otherId10?dist.IdentityTypeEnum.otherId10:a===SDKIdentityTypeEnum.mobileNumber?dist.IdentityTypeEnum.mobileNumber:a===SDKIdentityTypeEnum.phoneNumber2?dist.IdentityTypeEnum.phoneNumber2:a===SDKIdentityTypeEnum.phoneNumber3?dist.IdentityTypeEnum.phoneNumber3:void 0}

var BaseVault=/** @class */function(){/**
     *
     * @param {string} storageKey the local storage key string
     * @param {Storage} Web API Storage object that is being used
     * @param {IVaultOptions} options A Dictionary of IVaultOptions
     */function a(a,b,c){this._storageKey=a,this.storageObject=b,this.logger=(null===c||void 0===c?void 0:c.logger)||{verbose:function verbose(){},warning:function warning(){},error:function error(){}},this.contents=this.retrieve();}/**
     * Stores a StorableItem to Storage
     * @method store
     * @param item {StorableItem}
     */return a.prototype.store=function(a){this.contents=a;var b=isEmpty(a)?"":JSON.stringify(a);try{this.storageObject.setItem(this._storageKey,b),this.logger.verbose("Saving item to Storage: ".concat(b));}catch(a){this.logger.error("Cannot Save items to Storage: ".concat(b)),this.logger.error(a);}},a.prototype.retrieve=function(){// TODO: Handle cases where Local Storage is unavailable
// https://go.mparticle.com/work/SQDSDKS-5022
var a=this.storageObject.getItem(this._storageKey);return this.contents=a?JSON.parse(a):null,this.logger.verbose("Retrieving item from Storage: ".concat(a)),this.contents},a.prototype.purge=function(){this.logger.verbose("Purging Storage"),this.contents=null,this.storageObject.removeItem(this._storageKey);},a}();var LocalStorageVault=/** @class */function(a){function b(b,c){return a.call(this,b,window.localStorage,c)||this}return __extends(b,a),b}(BaseVault);var SessionStorageVault=/** @class */function(a){function b(b,c){return a.call(this,b,window.sessionStorage,c)||this}return __extends(b,a),b}(BaseVault);

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
 */var BatchUploader=/** @class */function(){/**
     * Creates an instance of a BatchUploader
     * @param {MParticleWebSDK} mpInstance - the mParticle SDK instance
     * @param {number} uploadInterval - the desired upload interval in milliseconds
     */function a(b,c){var d;this.offlineStorageEnabled=!1,this.mpInstance=b,this.uploadIntervalMillis=c,this.batchingEnabled=c>=a.MINIMUM_INTERVAL_MILLIS,this.uploadIntervalMillis<a.MINIMUM_INTERVAL_MILLIS&&(this.uploadIntervalMillis=a.MINIMUM_INTERVAL_MILLIS),this.eventsQueuedForProcessing=[],this.batchesQueuedForProcessing=[],this.offlineStorageEnabled=this.isOfflineStorageAvailable(),this.offlineStorageEnabled&&(this.eventVault=new SessionStorageVault("".concat(b._Store.storageName,"-events"),{logger:b.Logger}),this.batchVault=new LocalStorageVault("".concat(b._Store.storageName,"-batches"),{logger:b.Logger}),(d=this.eventsQueuedForProcessing).push.apply(d,this.eventVault.retrieve()));var e=this.mpInstance._Store,f=e.SDKConfig,g=e.devToken,h=this.mpInstance._Helpers.createServiceUrl(f.v3SecureServiceUrl,g);this.uploadUrl="".concat(h,"/events"),this.uploader=window.fetch?new FetchUploader(this.uploadUrl):new XHRUploader(this.uploadUrl),this.triggerUploadInterval(!0,!1),this.addEventListeners();}return a.prototype.isOfflineStorageAvailable=function(){var a=this.mpInstance,b=a._Helpers.getFeatureFlag,c=a._Store.deviceId,d=b(Constants.FeatureFlags.OfflineStorage),e=parseInt(d,10),f=getRampNumber(c);// TODO: Handle cases where Local Storage is unavailable
//       Potentially shared between Vault and Persistence as well
//       https://go.mparticle.com/work/SQDSDKS-5022
return e>=f},a.prototype.addEventListeners=function(){var a=this;// visibility change is a document property, not window
document.addEventListener("visibilitychange",function(){a.prepareAndUpload(!1,a.isBeaconAvailable());}),window.addEventListener("beforeunload",function(){a.prepareAndUpload(!1,a.isBeaconAvailable());}),window.addEventListener("pagehide",function(){a.prepareAndUpload(!1,a.isBeaconAvailable());});},a.prototype.isBeaconAvailable=function(){return !!navigator.sendBeacon},a.prototype.triggerUploadInterval=function(a,b){var c=this;void 0===a&&(a=!1),void 0===b&&(b=!1),setTimeout(function(){c.prepareAndUpload(a,b);},this.uploadIntervalMillis);},a.prototype.queueEvent=function(a){isEmpty(a)||(this.eventsQueuedForProcessing.push(a),this.offlineStorageEnabled&&this.eventVault&&this.eventVault.store(this.eventsQueuedForProcessing),this.mpInstance.Logger.verbose("Queuing event: ".concat(JSON.stringify(a))),this.mpInstance.Logger.verbose("Queued event count: ".concat(this.eventsQueuedForProcessing.length)),(!this.batchingEnabled||Types.TriggerUploadType[a.EventDataType])&&this.prepareAndUpload(!1,!1));},a.createNewBatches=function(a,b,c){if(!b||!a||!a.length)return null;//bucket by MPID, and then by session, ordered by timestamp
for(var d,e=[],f=new Map,g=0,h=a;g<h.length;g++){//on initial startup, there may be events logged without an mpid.
if(d=h[g],!d.MPID){var i=b.getMPID();d.MPID=i;}var j=f.get(d.MPID);j||(j=[]),j.push(d),f.set(d.MPID,j);}for(var k=0,l=Array.from(f.entries());k<l.length;k++){for(var m=l[k],i=m[0],n=m[1],o=new Map,p=0,q=n;p<q.length;p++){var d=q[p],j=o.get(d.SessionId);j||(j=[]),j.push(d),o.set(d.SessionId,j);}for(var r=0,s=Array.from(o.entries());r<s.length;r++){var t=s[r],u=convertEvents(i,t[1],c),v=c._Store.SDKConfig.onCreateBatch;v&&(u=v(u),u?u.modified=!0:c.Logger.warning("Skiping batch upload because no batch was returned from onCreateBatch callback")),u&&e.push(u);}}return e},a.prototype.prepareAndUpload=function(b,c){return __awaiter(this,void 0,void 0,function(){var d,e,f,g,h,i,j,k;return __generator(this,function(l){switch(l.label){case 0:return d=this.mpInstance.Identity.getCurrentUser(),e=this.eventsQueuedForProcessing,this.eventsQueuedForProcessing=[],this.offlineStorageEnabled&&this.eventVault&&this.eventVault.store([]),f=[],isEmpty(e)||(f=a.createNewBatches(e,d,this.mpInstance)),this.offlineStorageEnabled&&this.batchVault&&((i=this.batchesQueuedForProcessing).unshift.apply(i,this.batchVault.retrieve()),this.batchVault.purge()),isEmpty(f)||(j=this.batchesQueuedForProcessing).push.apply(j,f),g=this.batchesQueuedForProcessing,this.batchesQueuedForProcessing=[],[4/*yield*/,this.uploadBatches(this.mpInstance.Logger,g,c)];case 1:return h=l.sent(),isEmpty(h)||(k=this.batchesQueuedForProcessing).unshift.apply(k,h),!c&&this.offlineStorageEnabled&&this.batchVault&&(this.batchVault.store(this.batchesQueuedForProcessing),this.batchesQueuedForProcessing=[]),b&&this.triggerUploadInterval(b,!1),[2/*return*/]}})})},a.prototype.uploadBatches=function(b,c,d){return __awaiter(this,void 0,void 0,function(){var e,f,g,h,j,k;return __generator(this,function(i){switch(i.label){case 0:if(e=c.filter(function(a){return !isEmpty(a.events)}),isEmpty(e))return [2/*return*/,null];b.verbose("Uploading batches: ".concat(JSON.stringify(e))),b.verbose("Batch count: ".concat(e.length)),f=0,i.label=1;case 1:return f<e.length?(g={method:"POST",headers:{Accept:a.CONTENT_TYPE,"Content-Type":"text/plain;charset=UTF-8"},body:JSON.stringify(e[f])},!(d&&this.isBeaconAvailable()))?[3/*break*/,2]:(h=new Blob([g.body],{type:"text/plain;charset=UTF-8"}),navigator.sendBeacon(this.uploadUrl,h),[3/*break*/,5]):[3/*break*/,6];case 2:return i.trys.push([2,4,,5]),[4/*yield*/,this.uploader.upload(g)];case 3:if(j=i.sent(),200<=j.status&&300>j.status)b.verbose("Upload success for request ID: ".concat(e[f].source_request_id));else {if(500<=j.status||429===j.status)// Server error, add back current batches and try again later
return b.error("HTTP error status ".concat(j.status," received")),[2/*return*/,e.slice(f,e.length)];if(401<=j.status)//if we're getting a 401, assume we'll keep getting a 401 and clear the uploads.
return b.error("HTTP error status ".concat(j.status," while uploading - please verify your API key.")),[2/*return*/,null];throw console.error("HTTP error status ".concat(j.status," while uploading events."),j),new Error("Uncaught HTTP Error ".concat(j.status,".  Batch upload will be re-attempted."))}return [3/*break*/,5];case 4:return k=i.sent(),b.error("Error sending event to mParticle servers. ".concat(k)),[2/*return*/,e.slice(f,e.length)];case 5:return f++,[3/*break*/,1];case 6:return [2/*return*/,null]}})})},a.CONTENT_TYPE="text/plain;charset=UTF-8",a.MINIMUM_INTERVAL_MILLIS=500,a}();var AsyncUploader=/** @class */function(){function a(a){this.url=a;}return a}(),FetchUploader=/** @class */function(a){function b(){return null!==a&&a.apply(this,arguments)||this}return __extends(b,a),b.prototype.upload=function(a){return __awaiter(this,void 0,void 0,function(){var b;return __generator(this,function(c){switch(c.label){case 0:return [4/*yield*/,fetch(this.url,a)];case 1:return b=c.sent(),[2/*return*/,b]}})})},b}(AsyncUploader),XHRUploader=/** @class */function(a){function b(){return null!==a&&a.apply(this,arguments)||this}return __extends(b,a),b.prototype.upload=function(a){return __awaiter(this,void 0,void 0,function(){var b;return __generator(this,function(c){switch(c.label){case 0:return [4/*yield*/,this.makeRequest(this.url,a.body)];case 1:return b=c.sent(),[2/*return*/,b]}})})},b.prototype.makeRequest=function(a,b){return __awaiter(this,void 0,void 0,function(){var c;return __generator(this,function(){return c=new XMLHttpRequest,[2/*return*/,new Promise(function(d,e){c.onreadystatechange=function(){4!==c.readyState||(200<=c.status&&300>c.status?d(c):e(c));},c.open("post",a),c.send(b);})]})})},b}(AsyncUploader);

function APIClient(a,b){this.uploader=null;var c=this;this.queueEventForBatchUpload=function(b){if(!this.uploader){var c=a._Helpers.getFeatureFlag(Constants.FeatureFlags.EventBatchingIntervalMillis);this.uploader=new BatchUploader(a,c);}this.uploader.queueEvent(b),a._Persistence.update();},this.processQueuedEvents=function(){var b,d=a.Identity.getCurrentUser();if(d&&(b=d.getMPID()),a._Store.eventQueue.length&&b){var e=a._Store.eventQueue;a._Store.eventQueue=[],this.appendUserInfoToEvents(d,e),e.forEach(function(a){c.sendEventToServer(a);});}},this.appendUserInfoToEvents=function(b,c){c.forEach(function(c){c.MPID||a._ServerModel.appendUserInfo(b,c);});},this.sendEventToServer=function(c,d){var e=a._Helpers.extend({shouldUploadEvent:!0},d);if(a._Store.webviewBridgeEnabled)return void a._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.LogEvent,JSON.stringify(c));var f,g=a.Identity.getCurrentUser();// We queue events if there is no MPID (MPID is null, or === 0), or there are integrations that that require this to stall because integration attributes
// need to be set, or if we are still fetching the config (self hosted only), and so require delaying events
return (g&&(f=g.getMPID()),a._Store.requireDelay=a._Helpers.isDelayedByIntegration(a._preInit.integrationDelays,a._Store.integrationDelayTimeoutStart,Date.now()),!f||a._Store.requireDelay||!a._Store.configurationLoaded)?(a.Logger.verbose("Event was added to eventQueue. eventQueue will be processed once a valid MPID is returned or there is no more integration imposed delay."),void a._Store.eventQueue.push(c)):void(this.processQueuedEvents(),isEmpty(c)||(e.shouldUploadEvent&&this.queueEventForBatchUpload(c),c.EventName!==Types.MessageType.AppStateTransition&&(b&&b.kitBlockingEnabled&&(c=b.createBlockedEvent(c)),c&&a._Forwarders.sendEventToForwarders(c))))},this.sendBatchForwardingStatsToServer=function(b,c){var d,e;try{d=a._Helpers.createServiceUrl(a._Store.SDKConfig.v2SecureServiceUrl,a._Store.devToken),e={uuid:a._Helpers.generateUniqueId(),data:b},c&&(c.open("post",d+"/Forwarding"),c.send(JSON.stringify(e)));}catch(b){a.Logger.error("Error sending forwarding stats to mParticle servers.");}},this.sendSingleForwardingStatsToServer=function(b){var c,d;try{var e=function(){4===f.readyState&&202===f.status&&a.Logger.verbose("Successfully sent  "+f.statusText+" from server");},f=a._Helpers.createXHR(e);c=a._Helpers.createServiceUrl(a._Store.SDKConfig.v1SecureServiceUrl,a._Store.devToken),d=b,f&&(f.open("post",c+"/Forwarding"),f.send(JSON.stringify(d)));}catch(b){a.Logger.error("Error sending forwarding stats to mParticle servers.");}},this.prepareForwardingStats=function(b,d){var e,f=a._Forwarders.getForwarderStatsQueue();b&&b.isVisible&&(e={mid:b.id,esid:b.eventSubscriptionId,n:d.EventName,attrs:d.EventAttributes,sdk:d.SDKVersion,dt:d.EventDataType,et:d.EventCategory,dbg:d.Debug,ct:d.Timestamp,eec:d.ExpandedEventCount,dp:d.DataPlan},a._Helpers.getFeatureFlag(Constants.FeatureFlags.ReportBatching)?(f.push(e),a._Forwarders.setForwarderStatsQueue(f)):c.sendSingleForwardingStatsToServer(e));};}

var Validators={// From ./utils
// Utility Functions for backwards compatability
isNumber:isNumber,isFunction:isFunction,isStringOrNumber:isStringOrNumber,// Validator Functions
isValidAttributeValue:function isValidAttributeValue(a){return a!==void 0&&!isObject(a)&&!Array.isArray(a)},// Validator Functions
// Neither null nor undefined can be a valid Key
isValidKeyValue:function isValidKeyValue(a){return !(!a||isObject(a)||Array.isArray(a)||this.isFunction(a))},validateIdentities:function validateIdentities(a,b){var c={userIdentities:1,onUserAlias:1,copyUserAttributes:1};if(a){if("modify"===b&&(isObject(a.userIdentities)&&!Object.keys(a.userIdentities).length||!isObject(a.userIdentities)))return {valid:!1,error:Constants.Messages.ValidationMessages.ModifyIdentityRequestUserIdentitiesPresent};for(var d in a)if(a.hasOwnProperty(d)){if(!c[d])return {valid:!1,error:Constants.Messages.ValidationMessages.IdentityRequesetInvalidKey};if("onUserAlias"===d&&!Validators.isFunction(a[d]))return {valid:!1,error:Constants.Messages.ValidationMessages.OnUserAliasType}}if(0===Object.keys(a).length)return {valid:!0};// identityApiData.userIdentities can't be undefined
if(void 0===a.userIdentities)return {valid:!1,error:Constants.Messages.ValidationMessages.UserIdentities};// identityApiData.userIdentities can be null, but if it isn't null or undefined (above conditional), it must be an object
if(null!==a.userIdentities&&!isObject(a.userIdentities))return {valid:!1,error:Constants.Messages.ValidationMessages.UserIdentities};if(isObject(a.userIdentities)&&Object.keys(a.userIdentities).length)for(var e in a.userIdentities)if(a.userIdentities.hasOwnProperty(e)){if(!1===Types.IdentityType.getIdentityType(e))return {valid:!1,error:Constants.Messages.ValidationMessages.UserIdentitiesInvalidKey};if("string"!=typeof a.userIdentities[e]&&null!==a.userIdentities[e])return {valid:!1,error:Constants.Messages.ValidationMessages.UserIdentitiesInvalidValues}}}return {valid:!0}}};

var KitFilterHelper=/** @class */function(){function a(){}return a.hashEventType=function(a){return generateHash(a)},a.hashEventName=function(a,b){return generateHash(b+a)},(a.hashEventAttributeKey=function(a,b,c){return generateHash(a+b+c)},a.hashUserAttribute=function(a){return generateHash(a)},a.hashUserIdentity=function(a){return a},a.hashConsentPurpose=function(a,b){return generateHash(a+b)},a.hashAttributeConditionalForwarding=function(a){return generateHash(a).toString()},a.hashConsentPurposeConditionalForwarding=function(a,b){return this.hashConsentPurpose(a,b).toString()},a)}();

var StorageNames$1=Constants.StorageNames;function Helpers(a){var b=this;// Standalone version of jQuery.extend, from https://github.com/dansdom/extend
// TODO: Refactor SDK to directly use these methods
// https://go.mparticle.com/work/SQDSDKS-5239
// Utility Functions
// Imported Validators
this.canLog=function(){return !!(a._Store.isEnabled&&(a._Store.devToken||a._Store.webviewBridgeEnabled))},this.getFeatureFlag=function(b){return a._Store.SDKConfig.flags.hasOwnProperty(b)?a._Store.SDKConfig.flags[b]:null},this.invokeCallback=function(c,d,e,f,g){c||a.Logger.warning("There is no callback provided");try{b.Validators.isFunction(c)&&c({httpCode:d,body:e,getUser:function getUser(){return f?f:a.Identity.getCurrentUser()},getPreviousUser:function getPreviousUser(){if(!g){var b=a.Identity.getUsers(),c=b.shift(),d=f||a.Identity.getCurrentUser();return c&&d&&c.getMPID()===d.getMPID()&&(c=b.shift()),c||null}return a.Identity.getUser(g)}});}catch(b){a.Logger.error("There was an error with your callback: "+b);}},this.invokeAliasCallback=function(c,d,e){c||a.Logger.warning("There is no callback provided");try{if(b.Validators.isFunction(c)){var f={httpCode:d};e&&(f.message=e),c(f);}}catch(b){a.Logger.error("There was an error with your callback: "+b);}},this.extend=function(){var a,c,d,e,f,g,h=arguments[0]||{},j=1,k=arguments.length,l=!1,// helper which replicates the jquery internal functions
m={hasOwn:Object.prototype.hasOwnProperty,class2type:{},type:function type(a){return null==a?a+"":m.class2type[Object.prototype.toString.call(a)]||"object"},isPlainObject:function isPlainObject(a){if(!a||"object"!==m.type(a)||a.nodeType||m.isWindow(a))return !1;try{if(a.constructor&&!m.hasOwn.call(a,"constructor")&&!m.hasOwn.call(a.constructor.prototype,"isPrototypeOf"))return !1}catch(a){return !1}for(var b in a);// eslint-disable-line no-empty
return b===void 0||m.hasOwn.call(a,b)},isArray:Array.isArray||function(a){return "array"===m.type(a)},isFunction:function isFunction(a){return "function"===m.type(a)},isWindow:function isWindow(a){return null!=a&&a==a.window}};// end of objectHelper
// Handle a deep copy situation
for("boolean"==typeof h&&(l=h,h=arguments[1]||{},j=2),"object"===_typeof(h)||m.isFunction(h)||(h={}),k===j&&(h=this,--j);j<k;j++)// Only deal with non-null/undefined values
if(null!=(a=arguments[j]))// Extend the base object
for(c in a)// Prevent never-ending loop
(d=h[c],e=a[c],h!==e)&&(l&&e&&(m.isPlainObject(e)||(f=m.isArray(e)))?(f?(f=!1,g=d&&m.isArray(d)?d:[]):g=d&&m.isPlainObject(d)?d:{},h[c]=b.extend(l,g,e)):void 0!==e&&(h[c]=e));// Recurse if we're merging plain objects or arrays
// Return the modified object
return h},this.createServiceUrl=function(b,c){var d,e=window.mParticle&&a._Store.SDKConfig.forceHttps?"https://":window.location.protocol+"//";return d=a._Store.SDKConfig.forceHttps?"https://"+b:e+b,c&&(d+=c),d},this.createXHR=function(b){var c;try{c=new window.XMLHttpRequest;}catch(b){a.Logger.error("Error creating XMLHttpRequest object.");}if(c&&b&&"withCredentials"in c)c.onreadystatechange=b;else if("undefined"!=typeof window.XDomainRequest){a.Logger.verbose("Creating XDomainRequest object");try{c=new window.XDomainRequest,c.onload=b;}catch(b){a.Logger.error("Error creating XDomainRequest object");}}return c},this.filterUserIdentities=function(a,c){var d=[];if(a&&Object.keys(a).length)for(var e in a)if(a.hasOwnProperty(e)){var f=Types.IdentityType.getIdentityType(e);if(!b.inArray(c,f)){var g={Type:f,Identity:a[e]};f===Types.IdentityType.CustomerId?d.unshift(g):d.push(g);}}return d},this.filterUserIdentitiesForForwarders=function(a,c){var d={};if(a&&Object.keys(a).length)for(var e in a)if(a.hasOwnProperty(e)){var f=KitFilterHelper.hashUserIdentity(Types.IdentityType.getIdentityType(e));b.inArray(c,f)||(d[e]=a[e]);}return d},this.filterUserAttributes=function(a,c){var d={};if(a&&Object.keys(a).length)for(var e in a)if(a.hasOwnProperty(e)){var f=KitFilterHelper.hashUserAttribute(e);b.inArray(c,f)||(d[e]=a[e]);}return d},this.isFilteredUserAttribute=function(a,c){var d=KitFilterHelper.hashUserAttribute(a);return c&&b.inArray(c,d)},this.isEventType=function(a){for(var b in Types.EventType)if(Types.EventType.hasOwnProperty(b)&&Types.EventType[b]===a)return !0;return !1},this.sanitizeAttributes=function(c,d){if(!c||!b.isObject(c))return null;var e={};for(var f in c)// Make sure that attribute values are not objects or arrays, which are not valid
c.hasOwnProperty(f)&&b.Validators.isValidAttributeValue(c[f])?e[f]=c[f]:a.Logger.warning("For '"+d+"', the corresponding attribute value of '"+f+"' must be a string, number, boolean, or null.");return e},this.isDelayedByIntegration=function(b,c,d){if(d-c>a._Store.SDKConfig.integrationDelayTimeout)return !1;for(var e in b){if(!0===b[e])return !0;continue}return !1},this.createMainStorageName=function(a){return a?StorageNames$1.currentStorageName+"_"+a:StorageNames$1.currentStorageName},this.createProductStorageName=function(a){return a?StorageNames$1.currentStorageProductsName+"_"+a:StorageNames$1.currentStorageProductsName},this.converted=converted,this.findKeyInObject=findKeyInObject,this.parseNumber=parseNumber,this.inArray=inArray,this.isObject=isObject,this.decoded=decoded,this.returnConvertedBoolean=returnConvertedBoolean,this.parseStringOrNumber=parseStringOrNumber,this.generateHash=generateHash,this.generateUniqueId=generateUniqueId,this.Validators=Validators;}

var Messages$8=Constants.Messages,androidBridgeNameBase="mParticleAndroid",iosBridgeNameBase="mParticle";function NativeSdkHelpers(a){var b=this;this.isBridgeV2Available=function(a){if(!a)return !1;var b=iosBridgeNameBase+"_"+a+"_v2";// iOS v2 bridge
return !!(window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.hasOwnProperty(b))||!!(window.mParticle&&window.mParticle.uiwebviewBridgeName&&window.mParticle.uiwebviewBridgeName===b)||!!window.hasOwnProperty(androidBridgeNameBase+"_"+a+"_v2");// other iOS v2 bridge
// TODO: what to do about people setting things on mParticle itself?
// android
},this.isWebviewEnabled=function(c,d){return a._Store.bridgeV2Available=b.isBridgeV2Available(c),a._Store.bridgeV1Available=b.isBridgeV1Available(),2===d?a._Store.bridgeV2Available:!(window.mParticle&&window.mParticle.uiwebviewBridgeName&&window.mParticle.uiwebviewBridgeName!==iosBridgeNameBase+"_"+c+"_v2")&&!!(2>d)&&(a._Store.bridgeV2Available||a._Store.bridgeV1Available);// iOS BridgeV1 can be available via mParticle.isIOS, but return false if uiwebviewBridgeName doesn't match requiredWebviewBridgeName
},this.isBridgeV1Available=function(){return !!(a._Store.SDKConfig.useNativeSdk||window.mParticleAndroid||a._Store.SDKConfig.isIOS)},this.sendToNative=function(c,d){return a._Store.bridgeV2Available&&2===a._Store.SDKConfig.minWebviewBridgeVersion?void b.sendViaBridgeV2(c,d,a._Store.SDKConfig.requiredWebviewBridgeName):a._Store.bridgeV2Available&&2>a._Store.SDKConfig.minWebviewBridgeVersion?void b.sendViaBridgeV2(c,d,a._Store.SDKConfig.requiredWebviewBridgeName):a._Store.bridgeV1Available&&2>a._Store.SDKConfig.minWebviewBridgeVersion?void b.sendViaBridgeV1(c,d):void 0},this.sendViaBridgeV1=function(c,d){window.mParticleAndroid&&window.mParticleAndroid.hasOwnProperty(c)?(a.Logger.verbose(Messages$8.InformationMessages.SendAndroid+c),window.mParticleAndroid[c](d)):a._Store.SDKConfig.isIOS&&(a.Logger.verbose(Messages$8.InformationMessages.SendIOS+c),b.sendViaIframeToIOS(c,d));},this.sendViaIframeToIOS=function(a,b){var c=document.createElement("IFRAME");c.setAttribute("src","mp-sdk://"+a+"/"+encodeURIComponent(b)),document.documentElement.appendChild(c),c.parentNode.removeChild(c);},this.sendViaBridgeV2=function(c,d,e){if(e){var f,g,h=window[androidBridgeNameBase+"_"+e+"_v2"],i=iosBridgeNameBase+"_"+e+"_v2";return window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers[i]&&(f=window.webkit.messageHandlers[i]),a.uiwebviewBridgeName===i&&(g=a[i]),h&&h.hasOwnProperty(c)?(a.Logger.verbose(Messages$8.InformationMessages.SendAndroid+c),void h[c](d)):void(f?(a.Logger.verbose(Messages$8.InformationMessages.SendIOS+c),f.postMessage(JSON.stringify({path:c,value:d?JSON.parse(d):null}))):g&&(a.Logger.verbose(Messages$8.InformationMessages.SendIOS+c),b.sendViaIframeToIOS(c,d)))}};}

var Messages$7=Constants.Messages;function cookieSyncManager(a){var b=this;// Public
// Private
// Private
// TODO: Rename function to replaceAmpWithAmpersand
// Private
this.attemptCookieSync=function(c,d,e){// TODO: These should move inside the for loop
var f,g,h,i,j,k;// TODO: Make this exit quicker instead of nested
d&&!a._Store.webviewBridgeEnabled&&a._Store.pixelConfigurations.forEach(function(l){k=!1,l.filteringConsentRuleValues&&l.filteringConsentRuleValues.values&&l.filteringConsentRuleValues.values.length&&(k=!0),f={// Kit Module ID
moduleId:l.moduleId,// Tells you how often we should do a cookie sync (in days)
frequencyCap:l.frequencyCap,// Url for cookie sync pixel
pixelUrl:b.replaceAmp(l.pixelUrl),// TODO: Document requirements for redirectUrl
redirectUrl:l.redirectUrl?b.replaceAmp(l.redirectUrl):null,// Filtering rules as defined in UI
filteringConsentRuleValues:l.filteringConsentRuleValues},h=b.replaceMPID(f.pixelUrl,d),i=f.redirectUrl?b.replaceMPID(f.redirectUrl,d):"",j=h+encodeURIComponent(i);// TODO: Refactor so that Persistence is only called once
//       outside of the loop
var m=a._Persistence.getPersistence();// TODO: Is there a historic reason for checking for previousMPID?
//       it does not appear to be passed in anywhere
return c&&c!==d?void(m&&m[d]&&(!m[d].csd&&(m[d].csd={}),b.performCookieSync(j,f.moduleId,d,m[d].csd,f.filteringConsentRuleValues,e,k))):void(m[d]&&(!m[d].csd&&(m[d].csd={}),g=m[d].csd[f.moduleId.toString()]?m[d].csd[f.moduleId.toString()]:null,g?// TODO: Turn this into a convenience method for readability?
//       We use similar comparisons elsewhere in the SDK,
//       so perhaps we can make a time comparison convenience method
new Date().getTime()>new Date(g).getTime()+24*(60*(1e3*(// TODO: Turn these numbers into a constant so
//       we can remember what this number is for
60*f.frequencyCap)))&&b.performCookieSync(j,f.moduleId,d,m[d].csd,f.filteringConsentRuleValues,e,k):b.performCookieSync(j,f.moduleId,d,m[d].csd,f.filteringConsentRuleValues,e,k)))});},this.replaceMPID=function(a,b){return a.replace("%%mpid%%",b)},this.replaceAmp=function(a){return a.replace(/&amp;/g,"&")},this.performCookieSync=function(b,c,d,e,f,g,h){// if MPID is new to cookies, we should not try to perform the cookie sync
// because a cookie sync can only occur once a user either consents or doesn't
// we should not check if its enabled if the user has a blank consent
// TODO: We should do this check outside of this function
if(!(h&&g)&&a._Consent.isEnabledForUserConsent(f,a.Identity.getCurrentUser()))// TODO: Refactor so that check is made outside of the function.
//       Cache or store the boolean so that it only gets called once per
//       cookie sync attempt per module.
//       Currently, attemptCookieSync is called as a loop and therefore this
//       function polls the user object and consent multiple times.
{var i=document.createElement("img");a.Logger.verbose(Messages$7.InformationMessages.CookieSync),i.onload=function(){e[c.toString()]=new Date().getTime(),a._Persistence.saveUserCookieSyncDatesToPersistence(d,e);},i.src=b;}};}

var Messages$6=Constants.Messages;function SessionManager(a){function b(){a._Store.sessionId=null,a._Store.dateLastEventSent=null,a._Store.sessionAttributes={},a._Persistence.update();}var c=this;this.initialize=function(){if(a._Store.sessionId){var b=6e4*a._Store.SDKConfig.sessionTimeout;if(new Date>new Date(a._Store.dateLastEventSent.getTime()+b))c.endSession(),c.startNewSession();else {var d=a._Persistence.getPersistence();d&&!d.cu&&(a.Identity.identify(a._Store.SDKConfig.identifyRequest,a._Store.SDKConfig.identityCallback),a._Store.identifyCalled=!0,a._Store.SDKConfig.identityCallback=null);}}else c.startNewSession();},this.getSession=function(){return a.Logger.warning(generateDeprecationMessage("SessionManager.getSession()","SessionManager.getSessionId()")),this.getSessionId()},this.getSessionId=function(){return a._Store.sessionId},this.startNewSession=function(){if(a.Logger.verbose(Messages$6.InformationMessages.StartingNewSession),a._Helpers.canLog()){a._Store.sessionId=a._Helpers.generateUniqueId().toUpperCase();var b=a.Identity.getCurrentUser(),d=b?b.getMPID():null;if(d&&(a._Store.currentSessionMPIDs=[d]),!a._Store.sessionStartDate){var e=new Date;a._Store.sessionStartDate=e,a._Store.dateLastEventSent=e;}c.setSessionTimer(),a._Store.identifyCalled||(a.Identity.identify(a._Store.SDKConfig.identifyRequest,a._Store.SDKConfig.identityCallback),a._Store.identifyCalled=!0,a._Store.SDKConfig.identityCallback=null),a._Events.logEvent({messageType:Types.MessageType.SessionStart});}else a.Logger.verbose(Messages$6.InformationMessages.AbandonStartSession);},this.endSession=function(d){var e;if(a.Logger.verbose(Messages$6.InformationMessages.StartingEndSession),d)return a._Events.logEvent({messageType:Types.MessageType.SessionEnd}),void b();if(!a._Helpers.canLog())return void a.Logger.verbose(Messages$6.InformationMessages.AbandonEndSession);var f,g,h=a._Persistence.getPersistence();// TODO: https://go.mparticle.com/work/SQDSDKS-5684
if(h){if(h.gs&&!h.gs.sid)return void a.Logger.verbose(Messages$6.InformationMessages.NoSessionToEnd);// sessionId is not equal to cookies.sid if cookies.sid is changed in another tab
if(h.gs.sid&&a._Store.sessionId!==h.gs.sid&&(a._Store.sessionId=h.gs.sid),null===(e=null===h||void 0===h?void 0:h.gs)||void 0===e?void 0:e.les){f=6e4*a._Store.SDKConfig.sessionTimeout;var i=new Date().getTime();g=i-h.gs.les,g<f?c.setSessionTimer():(a._Events.logEvent({messageType:Types.MessageType.SessionEnd}),a._Store.sessionStartDate=null,b());}}},this.setSessionTimer=function(){var b=6e4*a._Store.SDKConfig.sessionTimeout;a._Store.globalTimer=window.setTimeout(function(){c.endSession();},b);},this.resetSessionTimer=function(){a._Store.webviewBridgeEnabled||(!a._Store.sessionId&&c.startNewSession(),c.clearSessionTimeout(),c.setSessionTimer()),c.startNewSessionIfNeeded();},this.clearSessionTimeout=function(){clearTimeout(a._Store.globalTimer);},this.startNewSessionIfNeeded=function(){if(!a._Store.webviewBridgeEnabled){var b=a._Persistence.getPersistence();!a._Store.sessionId&&b&&(b.sid?a._Store.sessionId=b.sid:c.startNewSession());}};}

var Messages$5=Constants.Messages;function Ecommerce(a){var b=this;// sanitizes any non number, non string value to 0
this.convertTransactionAttributesToProductAction=function(a,b){a.hasOwnProperty("Id")&&(b.TransactionId=a.Id),a.hasOwnProperty("Affiliation")&&(b.Affiliation=a.Affiliation),a.hasOwnProperty("CouponCode")&&(b.CouponCode=a.CouponCode),a.hasOwnProperty("Revenue")&&(b.TotalAmount=this.sanitizeAmount(a.Revenue,"Revenue")),a.hasOwnProperty("Shipping")&&(b.ShippingAmount=this.sanitizeAmount(a.Shipping,"Shipping")),a.hasOwnProperty("Tax")&&(b.TaxAmount=this.sanitizeAmount(a.Tax,"Tax")),a.hasOwnProperty("Step")&&(b.CheckoutStep=a.Step),a.hasOwnProperty("Option")&&(b.CheckoutOptions=a.Option);},this.getProductActionEventName=function(a){switch(a){case Types.ProductActionType.AddToCart:return "AddToCart";case Types.ProductActionType.AddToWishlist:return "AddToWishlist";case Types.ProductActionType.Checkout:return "Checkout";case Types.ProductActionType.CheckoutOption:return "CheckoutOption";case Types.ProductActionType.Click:return "Click";case Types.ProductActionType.Purchase:return "Purchase";case Types.ProductActionType.Refund:return "Refund";case Types.ProductActionType.RemoveFromCart:return "RemoveFromCart";case Types.ProductActionType.RemoveFromWishlist:return "RemoveFromWishlist";case Types.ProductActionType.ViewDetail:return "ViewDetail";case Types.ProductActionType.Unknown:default:return "Unknown"}},this.getPromotionActionEventName=function(a){return a===Types.PromotionActionType.PromotionClick?"PromotionClick":a===Types.PromotionActionType.PromotionView?"PromotionView":"Unknown"},this.convertProductActionToEventType=function(b){return b===Types.ProductActionType.AddToCart?Types.CommerceEventType.ProductAddToCart:b===Types.ProductActionType.AddToWishlist?Types.CommerceEventType.ProductAddToWishlist:b===Types.ProductActionType.Checkout?Types.CommerceEventType.ProductCheckout:b===Types.ProductActionType.CheckoutOption?Types.CommerceEventType.ProductCheckoutOption:b===Types.ProductActionType.Click?Types.CommerceEventType.ProductClick:b===Types.ProductActionType.Purchase?Types.CommerceEventType.ProductPurchase:b===Types.ProductActionType.Refund?Types.CommerceEventType.ProductRefund:b===Types.ProductActionType.RemoveFromCart?Types.CommerceEventType.ProductRemoveFromCart:b===Types.ProductActionType.RemoveFromWishlist?Types.CommerceEventType.ProductRemoveFromWishlist:b===Types.ProductActionType.Unknown?Types.EventType.Unknown:b===Types.ProductActionType.ViewDetail?Types.CommerceEventType.ProductViewDetail:(a.Logger.error("Could not convert product action type "+b+" to event type"),null)},this.convertPromotionActionToEventType=function(b){return b===Types.PromotionActionType.PromotionClick?Types.CommerceEventType.PromotionClick:b===Types.PromotionActionType.PromotionView?Types.CommerceEventType.PromotionView:(a.Logger.error("Could not convert promotion action type "+b+" to event type"),null)},this.generateExpandedEcommerceName=function(a,b){return "eCommerce - "+a+" - "+(b?"Total":"Item")},this.extractProductAttributes=function(a,b){b.CouponCode&&(a["Coupon Code"]=b.CouponCode),b.Brand&&(a.Brand=b.Brand),b.Category&&(a.Category=b.Category),b.Name&&(a.Name=b.Name),b.Sku&&(a.Id=b.Sku),b.Price&&(a["Item Price"]=b.Price),b.Quantity&&(a.Quantity=b.Quantity),b.Position&&(a.Position=b.Position),b.Variant&&(a.Variant=b.Variant),a["Total Product Amount"]=b.TotalAmount||0;},this.extractTransactionId=function(a,b){b.TransactionId&&(a["Transaction Id"]=b.TransactionId);},this.extractActionAttributes=function(a,c){b.extractTransactionId(a,c),c.Affiliation&&(a.Affiliation=c.Affiliation),c.CouponCode&&(a["Coupon Code"]=c.CouponCode),c.TotalAmount&&(a["Total Amount"]=c.TotalAmount),c.ShippingAmount&&(a["Shipping Amount"]=c.ShippingAmount),c.TaxAmount&&(a["Tax Amount"]=c.TaxAmount),c.CheckoutOptions&&(a["Checkout Options"]=c.CheckoutOptions),c.CheckoutStep&&(a["Checkout Step"]=c.CheckoutStep);},this.extractPromotionAttributes=function(a,b){b.Id&&(a.Id=b.Id),b.Creative&&(a.Creative=b.Creative),b.Name&&(a.Name=b.Name),b.Position&&(a.Position=b.Position);},this.buildProductList=function(a,b){return b?Array.isArray(b)?b:[b]:a.ShoppingCart.ProductList},this.createProduct=function(b,c,d,e,f,g,h,i,j,k){return (k=a._Helpers.sanitizeAttributes(k,b),"string"!=typeof b)?(a.Logger.error("Name is required when creating a product"),null):a._Helpers.Validators.isStringOrNumber(c)?a._Helpers.Validators.isStringOrNumber(d)?(d=a._Helpers.parseNumber(d),i&&!a._Helpers.Validators.isNumber(i)&&(a.Logger.error("Position must be a number, it will be set to null."),i=null),e=a._Helpers.Validators.isStringOrNumber(e)?a._Helpers.parseNumber(e):1,{Name:b,Sku:c,Price:d,Quantity:e,Brand:h,Variant:f,Category:g,Position:i,CouponCode:j,TotalAmount:e*d,Attributes:k}):(a.Logger.error("Price is required when creating a product, and must be a string or a number"),null):(a.Logger.error("SKU is required when creating a product, and must be a string or a number"),null)},this.createPromotion=function(b,c,d,e){return a._Helpers.Validators.isStringOrNumber(b)?{Id:b,Creative:c,Name:d,Position:e}:(a.Logger.error(Messages$5.ErrorMessages.PromotionIdRequired),null)},this.createImpression=function(b,c){return "string"==typeof b?c?{Name:b,Product:c}:(a.Logger.error("Product is required when creating an impression."),null):(a.Logger.error("Name is required when creating an impression."),null)},this.createTransactionAttributes=function(b,c,d,e,f,g){return a._Helpers.Validators.isStringOrNumber(b)?{Id:b,Affiliation:c,CouponCode:d,Revenue:e,Shipping:f,Tax:g}:(a.Logger.error(Messages$5.ErrorMessages.TransactionIdRequired),null)},this.expandProductImpression=function(c){var d=[];return c.ProductImpressions?(c.ProductImpressions.forEach(function(e){e.ProductList&&e.ProductList.forEach(function(f){var g=a._Helpers.extend(!1,{},c.EventAttributes);if(f.Attributes)for(var h in f.Attributes)g[h]=f.Attributes[h];b.extractProductAttributes(g,f),e.ProductImpressionList&&(g["Product Impression List"]=e.ProductImpressionList);var i=a._ServerModel.createEventObject({messageType:Types.MessageType.PageEvent,name:b.generateExpandedEcommerceName("Impression"),data:g,eventType:Types.EventType.Transaction});d.push(i);});}),d):d},this.expandCommerceEvent=function(a){return a?b.expandProductAction(a).concat(b.expandPromotionAction(a)).concat(b.expandProductImpression(a)):null},this.expandPromotionAction=function(c){var d=[];if(!c.PromotionAction)return d;var e=c.PromotionAction.PromotionList;return e.forEach(function(e){var f=a._Helpers.extend(!1,{},c.EventAttributes);b.extractPromotionAttributes(f,e);var g=a._ServerModel.createEventObject({messageType:Types.MessageType.PageEvent,name:b.generateExpandedEcommerceName(Types.PromotionActionType.getExpansionName(c.PromotionAction.PromotionActionType)),data:f,eventType:Types.EventType.Transaction});d.push(g);}),d},this.expandProductAction=function(c){var d=[];if(!c.ProductAction)return d;var e=!1;if(c.ProductAction.ProductActionType===Types.ProductActionType.Purchase||c.ProductAction.ProductActionType===Types.ProductActionType.Refund){var f=a._Helpers.extend(!1,{},c.EventAttributes);f["Product Count"]=c.ProductAction.ProductList?c.ProductAction.ProductList.length:0,b.extractActionAttributes(f,c.ProductAction),c.CurrencyCode&&(f["Currency Code"]=c.CurrencyCode);var g=a._ServerModel.createEventObject({messageType:Types.MessageType.PageEvent,name:b.generateExpandedEcommerceName(Types.ProductActionType.getExpansionName(c.ProductAction.ProductActionType),!0),data:f,eventType:Types.EventType.Transaction});d.push(g);}else e=!0;var h=c.ProductAction.ProductList;return h?(h.forEach(function(f){var g=a._Helpers.extend(!1,c.EventAttributes,f.Attributes);e?b.extractActionAttributes(g,c.ProductAction):b.extractTransactionId(g,c.ProductAction),b.extractProductAttributes(g,f);var h=a._ServerModel.createEventObject({messageType:Types.MessageType.PageEvent,name:b.generateExpandedEcommerceName(Types.ProductActionType.getExpansionName(c.ProductAction.ProductActionType)),data:g,eventType:Types.EventType.Transaction});d.push(h);}),d):d},this.createCommerceEventObject=function(b){var c;return (a.Logger.verbose(Messages$5.InformationMessages.StartingLogCommerceEvent),a._Helpers.canLog())?(c=a._ServerModel.createEventObject({messageType:Types.MessageType.Commerce}),c.EventName="eCommerce - ",c.CurrencyCode=a._Store.currencyCode,c.ShoppingCart=[],c.CustomFlags=b,c):(a.Logger.verbose(Messages$5.InformationMessages.AbandonLogEvent),null)},this.sanitizeAmount=function(b,c){if(!a._Helpers.Validators.isStringOrNumber(b)){var d=[c,"must be of type number. A",_typeof(b),"was passed. Converting to 0"].join(" ");return a.Logger.warning(d),0}// if amount is a string, it will be parsed into a number if possible, or set to 0
return a._Helpers.parseNumber(b)};}

function createSDKConfig(a){// TODO: Refactor to create a default config object
var b={};for(var c in Constants.DefaultConfig)Constants.DefaultConfig.hasOwnProperty(c)&&(b[c]=Constants.DefaultConfig[c]);if(a)for(var c in a)a.hasOwnProperty(c)&&(b[c]=a[c]);for(var c in Constants.DefaultUrls)b[c]=Constants.DefaultUrls[c];return b}// TODO: Merge this with SDKStoreApi in sdkRuntimeModels
function Store(a,b){var c={isEnabled:!0,sessionAttributes:{},currentSessionMPIDs:[],consentState:null,sessionId:null,isFirstRun:null,clientId:null,deviceId:null,devToken:null,serverSettings:{},dateLastEventSent:null,sessionStartDate:null,currentPosition:null,isTracking:!1,watchPositionId:null,cartProducts:[],eventQueue:[],currencyCode:null,globalTimer:null,context:null,configurationLoaded:!1,identityCallInFlight:!1,SDKConfig:{},nonCurrentUserMPIDs:{},identifyCalled:!1,isLoggedIn:!1,cookieSyncDates:{},integrationAttributes:{},requireDelay:!0,isLocalStorageAvailable:null,storageName:null,prodStorageName:null,activeForwarders:[],kits:{},sideloadedKits:[],configuredForwarders:[],pixelConfigurations:[],wrapperSDKInfo:{name:"none",version:null,isInfoSet:!1}};for(var d in c)this[d]=c[d];// Set configuration to default settings
if(this.integrationDelayTimeoutStart=Date.now(),this.SDKConfig=createSDKConfig(a),a){if(a.deviceId&&(this.deviceId=a.deviceId),this.SDKConfig.isDevelopmentMode=!!a.hasOwnProperty("isDevelopmentMode")&&b._Helpers.returnConvertedBoolean(a.isDevelopmentMode),a.hasOwnProperty("v1SecureServiceUrl")&&(this.SDKConfig.v1SecureServiceUrl=a.v1SecureServiceUrl),a.hasOwnProperty("v2SecureServiceUrl")&&(this.SDKConfig.v2SecureServiceUrl=a.v2SecureServiceUrl),a.hasOwnProperty("v3SecureServiceUrl")&&(this.SDKConfig.v3SecureServiceUrl=a.v3SecureServiceUrl),a.hasOwnProperty("identityUrl")&&(this.SDKConfig.identityUrl=a.identityUrl),a.hasOwnProperty("aliasUrl")&&(this.SDKConfig.aliasUrl=a.aliasUrl),a.hasOwnProperty("configUrl")&&(this.SDKConfig.configUrl=a.configUrl),a.hasOwnProperty("logLevel")&&(this.SDKConfig.logLevel=a.logLevel),this.SDKConfig.useNativeSdk=!!a.useNativeSdk,this.SDKConfig.kits=a.kits||{},this.SDKConfig.sideloadedKits=a.sideloadedKits||[],this.SDKConfig.isIOS=a.hasOwnProperty("isIOS")?a.isIOS:!!(window.mParticle&&window.mParticle.isIOS)&&window.mParticle.isIOS,this.SDKConfig.useCookieStorage=!!a.hasOwnProperty("useCookieStorage")&&a.useCookieStorage,this.SDKConfig.maxProducts=a.hasOwnProperty("maxProducts")?a.maxProducts:Constants.DefaultConfig.maxProducts,this.SDKConfig.maxCookieSize=a.hasOwnProperty("maxCookieSize")?a.maxCookieSize:Constants.DefaultConfig.maxCookieSize,a.hasOwnProperty("appName")&&(this.SDKConfig.appName=a.appName),a.hasOwnProperty("package")&&(this.SDKConfig["package"]=a["package"]),this.SDKConfig.integrationDelayTimeout=a.hasOwnProperty("integrationDelayTimeout")?a.integrationDelayTimeout:Constants.DefaultConfig.integrationDelayTimeout,a.hasOwnProperty("identifyRequest")&&(this.SDKConfig.identifyRequest=a.identifyRequest),a.hasOwnProperty("identityCallback")){var e=a.identityCallback;b._Helpers.Validators.isFunction(e)?this.SDKConfig.identityCallback=a.identityCallback:b.Logger.warning("The optional callback must be a function. You tried entering a(n) "+_typeof(e)+" . Callback not set. Please set your callback again.");}if(a.hasOwnProperty("appVersion")&&(this.SDKConfig.appVersion=a.appVersion),a.hasOwnProperty("appName")&&(this.SDKConfig.appName=a.appName),a.hasOwnProperty("sessionTimeout")&&(this.SDKConfig.sessionTimeout=a.sessionTimeout),a.hasOwnProperty("dataPlan")){this.SDKConfig.dataPlan={PlanVersion:null,PlanId:null};var f=a.dataPlan;f.planId&&(isDataPlanSlug(f.planId)?this.SDKConfig.dataPlan.PlanId=f.planId:b.Logger.error("Your data plan id must be a string and match the data plan slug format (i.e. under_case_slug)")),f.planVersion&&(isNumber(f.planVersion)?this.SDKConfig.dataPlan.PlanVersion=f.planVersion:b.Logger.error("Your data plan version must be a number"));}else this.SDKConfig.dataPlan={};if(this.SDKConfig.forceHttps=!a.hasOwnProperty("forceHttps")||a.forceHttps,this.SDKConfig.customFlags=a.customFlags||{},this.SDKConfig.minWebviewBridgeVersion=a.hasOwnProperty("minWebviewBridgeVersion")?a.minWebviewBridgeVersion:1,this.SDKConfig.aliasMaxWindow=a.hasOwnProperty("aliasMaxWindow")?a.aliasMaxWindow:Constants.DefaultConfig.aliasMaxWindow,a.hasOwnProperty("dataPlanOptions")){var g=a.dataPlanOptions;g.hasOwnProperty("dataPlanVersion")&&g.hasOwnProperty("blockUserAttributes")&&g.hasOwnProperty("blockEventAttributes")&&g.hasOwnProperty("blockEvents")&&g.hasOwnProperty("blockUserIdentities")||b.Logger.error("Ensure your config.dataPlanOptions object has the following keys: a \"dataPlanVersion\" object, and \"blockUserAttributes\", \"blockEventAttributes\", \"blockEvents\", \"blockUserIdentities\" booleans");}a.hasOwnProperty("onCreateBatch")&&("function"==typeof a.onCreateBatch?this.SDKConfig.onCreateBatch=a.onCreateBatch:(b.Logger.error("config.onCreateBatch must be a function"),this.SDKConfig.onCreateBatch=void 0)),a.hasOwnProperty("flags")||(this.SDKConfig.flags={}),this.SDKConfig.flags.hasOwnProperty(Constants.FeatureFlags.EventBatchingIntervalMillis)||(this.SDKConfig.flags[Constants.FeatureFlags.EventBatchingIntervalMillis]=Constants.DefaultConfig.uploadInterval),this.SDKConfig.flags.hasOwnProperty(Constants.FeatureFlags.ReportBatching)||(this.SDKConfig.flags[Constants.FeatureFlags.ReportBatching]=!1),this.SDKConfig.flags.hasOwnProperty(Constants.FeatureFlags.OfflineStorage)||(this.SDKConfig.flags[Constants.FeatureFlags.OfflineStorage]=0);}}

function Logger(a){var b=this,c=a.logLevel||"warning";this.logger=a.hasOwnProperty("logger")?a.logger:new ConsoleLogger,this.verbose=function(a){"none"!==c&&b.logger.verbose&&"verbose"===c&&b.logger.verbose(a);},this.warning=function(a){"none"!==c&&b.logger.warning&&("verbose"===c||"warning"===c)&&b.logger.warning(a);},this.error=function(a){"none"!==c&&b.logger.error&&b.logger.error(a);},this.setLogLevel=function(a){c=a;};}function ConsoleLogger(){this.verbose=function(a){console&&console.info&&console.info(a);},this.error=function(a){console&&console.error&&console.error(a);},this.warning=function(a){console&&console.warn&&console.warn(a);};}

var Base64=Polyfill.Base64,Messages$4=Constants.Messages,Base64CookieKeys=Constants.Base64CookieKeys,SDKv2NonMPIDCookieKeys=Constants.SDKv2NonMPIDCookieKeys,StorageNames=Constants.StorageNames;function _Persistence(a){function b(b){var c=a._Store;return b.gs.sid=c.sessionId,b.gs.ie=c.isEnabled,b.gs.sa=c.sessionAttributes,b.gs.ss=c.serverSettings,b.gs.dt=c.devToken,b.gs.les=c.dateLastEventSent?c.dateLastEventSent.getTime():null,b.gs.av=c.SDKConfig.appVersion,b.gs.cgid=c.clientId,b.gs.das=c.deviceId,b.gs.c=c.context,b.gs.ssd=c.sessionStartDate?c.sessionStartDate.getTime():0,b.gs.ia=c.integrationAttributes,b}function c(a){localStorage.removeItem(a);}function d(a,b,c){return f.encodePersistence(JSON.stringify(a))+";expires="+b+";path=/"+c}var f=this;// only used in persistence
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
*/ // TODO: This should actually be decodePersistenceString or
//       we should refactor this to take a string and return an object
// This function loops through the parts of a full hostname, attempting to set a cookie on that domain. It will set a cookie at the highest level possible.
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
d||e?a._Store.isFirstRun=!1:(a._Store.isFirstRun=!0,a._Store.mpid=0),a._Store.isLocalStorageAvailable||(a._Store.SDKConfig.useCookieStorage=!0),a._Store.isLocalStorageAvailable?(b=window.localStorage,a._Store.SDKConfig.useCookieStorage?(d?(c=e?a._Helpers.extend(!1,d,e):d,b.removeItem(a._Store.storageName)):e&&(c=e),f.storeDataInMemory(c)):e?(c=d?a._Helpers.extend(!1,d,e):e,f.storeDataInMemory(c),f.expireCookies(a._Store.storageName)):f.storeDataInMemory(d)):f.storeDataInMemory(e);try{if(a._Store.isLocalStorageAvailable){var g=localStorage.getItem(a._Store.prodStorageName);if(g)var h=JSON.parse(Base64.decode(g));a._Store.mpid&&f.storeProductsInMemory(h,a._Store.mpid);}}catch(b){a._Store.isLocalStorageAvailable&&localStorage.removeItem(a._Store.prodStorageName),a._Store.cartProducts=[],a.Logger.error("Error loading products in initialization: "+b);}for(var i in c)c.hasOwnProperty(i)&&(SDKv2NonMPIDCookieKeys[i]||(a._Store.nonCurrentUserMPIDs[i]=c[i]));f.update();}catch(b){f.useLocalStorage()&&a._Store.isLocalStorageAvailable?localStorage.removeItem(a._Store.storageName):f.expireCookies(a._Store.storageName),a.Logger.error("Error initializing storage: "+b);}},this.update=function(){a._Store.webviewBridgeEnabled||(a._Store.SDKConfig.useCookieStorage&&f.setCookie(),f.setLocalStorage());},this.storeProductsInMemory=function(b,c){if(b)try{a._Store.cartProducts=b[c]&&b[c].cp?b[c].cp:[];}catch(b){a.Logger.error(Messages$4.ErrorMessages.CookieParseError);}},this.storeDataInMemory=function(b,c){try{b?(a._Store.mpid=c?c:b.cu||0,b.gs=b.gs||{},a._Store.sessionId=b.gs.sid||a._Store.sessionId,a._Store.isEnabled="undefined"==typeof b.gs.ie?a._Store.isEnabled:b.gs.ie,a._Store.sessionAttributes=b.gs.sa||a._Store.sessionAttributes,a._Store.serverSettings=b.gs.ss||a._Store.serverSettings,a._Store.devToken=a._Store.devToken||b.gs.dt,a._Store.SDKConfig.appVersion=a._Store.SDKConfig.appVersion||b.gs.av,a._Store.clientId=b.gs.cgid||a._Store.clientId||a._Helpers.generateUniqueId(),a._Store.deviceId=a._Store.deviceId||b.gs.das||a._Helpers.generateUniqueId(),a._Store.integrationAttributes=b.gs.ia||{},a._Store.context=b.gs.c||a._Store.context,a._Store.currentSessionMPIDs=b.gs.csm||a._Store.currentSessionMPIDs,a._Store.isLoggedIn=!0===b.l,b.gs.les&&(a._Store.dateLastEventSent=new Date(b.gs.les)),a._Store.sessionStartDate=b.gs.ssd?new Date(b.gs.ssd):new Date,b=c?b[c]:b[b.cu]):(a.Logger.verbose(Messages$4.InformationMessages.CookieNotFound),a._Store.clientId=a._Store.clientId||a._Helpers.generateUniqueId(),a._Store.deviceId=a._Store.deviceId||a._Helpers.generateUniqueId());}catch(b){a.Logger.error(Messages$4.ErrorMessages.CookieParseError);}},this.determineLocalStorageAvailability=function(a){var b;window.mParticle&&window.mParticle._forceNoLocalStorage&&(a=void 0);try{return a.setItem("mparticle","test"),b="test"===a.getItem("mparticle"),a.removeItem("mparticle"),b&&a}catch(a){return !1}},this.getUserProductsFromLS=function(b){if(!a._Store.isLocalStorageAvailable)return [];var c,d,e,f=localStorage.getItem(a._Store.prodStorageName);// if there is an MPID, we are retrieving the user's products, which is an array
if(f&&(c=Base64.decode(f)),b)try{return c&&(e=JSON.parse(c)),d=c&&e[b]&&e[b].cp&&Array.isArray(e[b].cp)?e[b].cp:[],d}catch(a){return []}else return []},this.getAllUserProductsFromLS=function(){var b,c,d=localStorage.getItem(a._Store.prodStorageName);d&&(b=Base64.decode(d));// returns an object with keys of MPID and values of array of products
try{c=JSON.parse(b);}catch(a){c={};}return c},this.setLocalStorage=function(){if(a._Store.isLocalStorageAvailable){var c=a._Store.storageName,d=f.getAllUserProductsFromLS(),e=f.getLocalStorage()||{},g=a.Identity.getCurrentUser(),h=g?g.getMPID():null,i={cp:d[h]?d[h].cp:[]};if(h){d=d||{},d[h]=i;try{window.localStorage.setItem(encodeURIComponent(a._Store.prodStorageName),Base64.encode(JSON.stringify(d)));}catch(b){a.Logger.error("Error with setting products on localStorage.");}}if(!a._Store.SDKConfig.useCookieStorage){e.gs=e.gs||{},e.l=a._Store.isLoggedIn?1:0,a._Store.sessionId&&(e.gs.csm=a._Store.currentSessionMPIDs),e.gs.ie=a._Store.isEnabled,h&&(e.cu=h),Object.keys(a._Store.nonCurrentUserMPIDs).length&&(e=a._Helpers.extend({},e,a._Store.nonCurrentUserMPIDs),a._Store.nonCurrentUserMPIDs={}),e=b(e);try{window.localStorage.setItem(encodeURIComponent(c),f.encodePersistence(JSON.stringify(e)));}catch(b){a.Logger.error("Error with setting localStorage item.");}}}},this.getLocalStorage=function(){if(!a._Store.isLocalStorageAvailable)return null;var b,c=a._Store.storageName,d=f.decodePersistence(window.localStorage.getItem(c)),e={};if(d)for(b in d=JSON.parse(d),d)d.hasOwnProperty(b)&&(e[b]=d[b]);return Object.keys(e).length?e:null},this.expireCookies=function(a){var b,c,d,e=new Date;d=f.getCookieDomain(),c=""===d?"":";domain="+d,e.setTime(e.getTime()-86400000),b="; expires="+e.toUTCString(),document.cookie=a+"="+b+"; path=/"+c;},this.getCookie=function(){var b,c,d,g,h,j=window.document.cookie.split("; "),k=a._Store.storageName,m=k?void 0:{};for(a.Logger.verbose(Messages$4.InformationMessages.CookieSearch),b=0,c=j.length;b<c;b++){try{d=j[b].split("="),g=d.shift(),h=d.join("=");}catch(b){a.Logger.verbose("Unable to parse cookie: "+g+". Skipping.");}if(k&&k===g){m=a._Helpers.converted(h);break}k||(m[g]=a._Helpers.converted(h));}return m?(a.Logger.verbose(Messages$4.InformationMessages.CookieFound),JSON.parse(f.decodePersistence(m))):null},this.setCookie=function(){var c,d=a.Identity.getCurrentUser();d&&(c=d.getMPID());var e,g,h,i=new Date,j=a._Store.storageName,k=f.getCookie()||{},l=new Date(i.getTime()+1e3*(60*(60*(24*a._Store.SDKConfig.cookieExpiration)))).toGMTString();e=f.getCookieDomain(),g=""===e?"":";domain="+e,k.gs=k.gs||{},a._Store.sessionId&&(k.gs.csm=a._Store.currentSessionMPIDs),c&&(k.cu=c),k.l=a._Store.isLoggedIn?1:0,k=b(k),Object.keys(a._Store.nonCurrentUserMPIDs).length&&(k=a._Helpers.extend({},k,a._Store.nonCurrentUserMPIDs),a._Store.nonCurrentUserMPIDs={}),h=f.reduceAndEncodePersistence(k,l,g,a._Store.SDKConfig.maxCookieSize),a.Logger.verbose(Messages$4.InformationMessages.CookieSet),window.document.cookie=encodeURIComponent(j)+"="+h;},this.reduceAndEncodePersistence=function(b,c,e,f){var g,h=b.gs.csm?b.gs.csm:[];// Comment 1 above
if(!h.length)for(var j in b)b.hasOwnProperty(j)&&(g=d(b,c,e),g.length>f&&!SDKv2NonMPIDCookieKeys[j]&&j!==b.cu&&delete b[j]);else {// Comment 2 above - First create an object of all MPIDs on the cookie
var k={};for(var l in b)b.hasOwnProperty(l)&&(SDKv2NonMPIDCookieKeys[l]||l===b.cu||(k[l]=1));// Comment 2a above
if(Object.keys(k).length)for(var m in k)g=d(b,c,e),g.length>f&&k.hasOwnProperty(m)&&-1===h.indexOf(m)&&delete b[m];// Comment 2b above
for(var n,o=0;o<h.length&&(g=d(b,c,e),g.length>f);o++)n=h[o],b[n]?(a.Logger.verbose("Size of new encoded cookie is larger than maxCookieSize setting of "+f+". Removing from cookie the earliest logged in MPID containing: "+JSON.stringify(b[n],0,2)),delete b[n]):a.Logger.error("Unable to save MPID data to cookies because the resulting encoded cookie is larger than the maxCookieSize setting of "+f+". We recommend using a maxCookieSize of 1500.");}return g},this.findPrevCookiesBasedOnUI=function(b){var c,d=a._Persistence.getPersistence();if(b)for(var e in b.userIdentities)if(d&&Object.keys(d).length)for(var g in d)// any value in persistence that has an MPID key will be an MPID to search through
// other keys on the cookie are currentSessionMPIDs and currentMPID which should not be searched
if(d[g].mpid){var h=d[g].ui;for(var i in h)if(e===i&&b.userIdentities[e]===h[i]){c=g;break}}c&&f.storeDataInMemory(d,c);},this.encodePersistence=function(b){for(var c in b=JSON.parse(b),b.gs)b.gs.hasOwnProperty(c)&&(Base64CookieKeys[c]?b.gs[c]?Array.isArray(b.gs[c])&&b.gs[c].length||a._Helpers.isObject(b.gs[c])&&Object.keys(b.gs[c]).length?b.gs[c]=Base64.encode(JSON.stringify(b.gs[c])):delete b.gs[c]:delete b.gs[c]:"ie"===c?b.gs[c]=b.gs[c]?1:0:!b.gs[c]&&delete b.gs[c]);for(var d in b)if(b.hasOwnProperty(d)&&!SDKv2NonMPIDCookieKeys[d])for(c in b[d])b[d].hasOwnProperty(c)&&Base64CookieKeys[c]&&(a._Helpers.isObject(b[d][c])&&Object.keys(b[d][c]).length?b[d][c]=Base64.encode(JSON.stringify(b[d][c])):delete b[d][c]);return createCookieString(JSON.stringify(b))},this.decodePersistence=function(b){try{if(b){if(b=JSON.parse(revertCookieString(b)),a._Helpers.isObject(b)&&Object.keys(b).length){for(var c in b.gs)b.gs.hasOwnProperty(c)&&(Base64CookieKeys[c]?b.gs[c]=JSON.parse(Base64.decode(b.gs[c])):"ie"===c&&(b.gs[c]=!!b.gs[c]));for(var d in b)if(b.hasOwnProperty(d))if(!SDKv2NonMPIDCookieKeys[d])for(c in b[d])b[d].hasOwnProperty(c)&&Base64CookieKeys[c]&&b[d][c].length&&(b[d][c]=JSON.parse(Base64.decode(b[d][c])));else "l"===d&&(b[d]=!!b[d]);}return JSON.stringify(b)}}catch(b){a.Logger.error("Problem with decoding cookie",b);}},this.getCookieDomain=function(){if(a._Store.SDKConfig.cookieDomain)return a._Store.SDKConfig.cookieDomain;var b=f.getDomain(document,location.hostname);return ""===b?"":"."+b},this.getDomain=function(a,b){var c,d,e=b.split(".");for(c=e.length-1;0<=c;c--)if(d=e.slice(c).join("."),a.cookie="mptest=cookie;domain=."+d+";",-1<a.cookie.indexOf("mptest=cookie"))return a.cookie="mptest=;domain=."+d+";expires=Thu, 01 Jan 1970 00:00:01 GMT;",d;return ""},this.getUserIdentities=function(a){var b=f.getPersistence();return b&&b[a]&&b[a].ui?b[a].ui:{}},this.getAllUserAttributes=function(a){var b=f.getPersistence();return b&&b[a]&&b[a].ua?b[a].ua:{}},this.getCartProducts=function(b){var c,d=localStorage.getItem(a._Store.prodStorageName);return d&&(c=JSON.parse(Base64.decode(d)),c&&c[b]&&c[b].cp)?c[b].cp:[]},this.setCartProducts=function(b){if(a._Store.isLocalStorageAvailable)try{window.localStorage.setItem(encodeURIComponent(a._Store.prodStorageName),Base64.encode(JSON.stringify(b)));}catch(b){a.Logger.error("Error with setting products on localStorage.");}},this.saveUserIdentitiesToPersistence=function(a,b){if(b){var c=f.getPersistence();c&&(c[a]?c[a].ui=b:c[a]={ui:b},f.savePersistence(c));}},this.saveUserAttributesToPersistence=function(a,b){var c=f.getPersistence();b&&(c&&(c[a]?c[a].ui=b:c[a]={ui:b}),f.savePersistence(c));},this.saveUserCookieSyncDatesToPersistence=function(a,b){if(b){var c=f.getPersistence();c&&(c[a]?c[a].csd=b:c[a]={csd:b}),f.savePersistence(c);}},this.saveUserConsentStateToCookies=function(b,c){//it's currently not supported to set persistence
//for any MPID that's not the current one.
if(c||null===c){var d=f.getPersistence();d&&(d[b]?d[b].con=a._Consent.ConsentSerialization.toMinifiedJsonObject(c):d[b]={con:a._Consent.ConsentSerialization.toMinifiedJsonObject(c)},f.savePersistence(d));}},this.savePersistence=function(b){var c,d=f.encodePersistence(JSON.stringify(b)),e=new Date,g=a._Store.storageName,h=new Date(e.getTime()+1e3*(60*(60*(24*a._Store.SDKConfig.cookieExpiration)))).toGMTString(),i=f.getCookieDomain();if(c=""===i?"":";domain="+i,a._Store.SDKConfig.useCookieStorage){var j=f.reduceAndEncodePersistence(b,h,c,a._Store.SDKConfig.maxCookieSize);window.document.cookie=encodeURIComponent(g)+"="+j;}else a._Store.isLocalStorageAvailable&&localStorage.setItem(a._Store.storageName,d);},this.getPersistence=function(){var a=this.useLocalStorage()?this.getLocalStorage():this.getCookie();return a},this.getConsentState=function(b){var c=f.getPersistence();return c&&c[b]&&c[b].con?a._Consent.ConsentSerialization.fromMinifiedJsonObject(c[b].con):null},this.getFirstSeenTime=function(a){if(!a)return null;var b=f.getPersistence();return b&&b[a]&&b[a].fst?b[a].fst:null},this.setFirstSeenTime=function(a,b){if(a){b||(b=new Date().getTime());var c=f.getPersistence();c&&(!c[a]&&(c[a]={}),!c[a].fst&&(c[a].fst=b,f.savePersistence(c)));}},this.getLastSeenTime=function(b){if(!b)return null;if(b===a.Identity.getCurrentUser().getMPID())//if the mpid is the current user, its last seen time is the current time
return new Date().getTime();var c=f.getPersistence();return c&&c[b]&&c[b].lst?c[b].lst:null},this.setLastSeenTime=function(a,b){if(a){b||(b=new Date().getTime());var c=f.getPersistence();c&&c[a]&&(c[a].lst=b,f.savePersistence(c));}},this.getDeviceId=function(){return a._Store.deviceId},this.setDeviceId=function(b){a._Store.deviceId=b,f.update();},this.resetPersistence=function(){if(c(StorageNames.localStorageName),c(StorageNames.localStorageNameV3),c(StorageNames.localStorageNameV4),c(a._Store.prodStorageName),c(a._Store.storageName),c(StorageNames.localStorageProductsV4),f.expireCookies(StorageNames.cookieName),f.expireCookies(StorageNames.cookieNameV2),f.expireCookies(StorageNames.cookieNameV3),f.expireCookies(StorageNames.cookieNameV4),f.expireCookies(a._Store.prodStorageName),f.expireCookies(a._Store.storageName),mParticle._isTestEnv){c(a._Helpers.createMainStorageName("abcdef")),f.expireCookies(a._Helpers.createMainStorageName("abcdef")),c(a._Helpers.createProductStorageName("abcdef"));}},this.forwardingStatsBatches={uploadsTable:{},forwardingStatsEventQueue:[]};}

var Messages$3=Constants.Messages;function Events(a){var b=this;this.logEvent=function(b,c){if(a.Logger.verbose(Messages$3.InformationMessages.StartingLogEvent+": "+b.name),a._Helpers.canLog()){var d=a._ServerModel.createEventObject(b);a._APIClient.sendEventToServer(d,c);}else a.Logger.verbose(Messages$3.InformationMessages.AbandonLogEvent);},this.startTracking=function(b){function c(b,c){if(b)try{c?b(c):b();}catch(b){a.Logger.error("Error invoking the callback passed to startTrackingLocation."),a.Logger.error(b);}}if(!a._Store.isTracking)"geolocation"in navigator&&(a._Store.watchPositionId=navigator.geolocation.watchPosition(function e(d){// prevents callback from being fired multiple times
a._Store.currentPosition={lat:d.coords.latitude,lng:d.coords.longitude},c(b,d),b=null,a._Store.isTracking=!0;},function d(){// prevents callback from being fired multiple times
c(b),b=null,a._Store.isTracking=!1;}));else {var d={coords:{latitude:a._Store.currentPosition.lat,longitude:a._Store.currentPosition.lng}};c(b,d);}},this.stopTracking=function(){a._Store.isTracking&&(navigator.geolocation.clearWatch(a._Store.watchPositionId),a._Store.currentPosition=null,a._Store.isTracking=!1);},this.logOptOut=function(){a.Logger.verbose(Messages$3.InformationMessages.StartingLogOptOut);var b=a._ServerModel.createEventObject({messageType:Types.MessageType.OptOut,eventType:Types.EventType.Other});a._APIClient.sendEventToServer(b);},this.logAST=function(){b.logEvent({messageType:Types.MessageType.AppStateTransition});},this.logCheckoutEvent=function(c,d,e,f){var g=a._Ecommerce.createCommerceEventObject(f);g&&(g.EventName+=a._Ecommerce.getProductActionEventName(Types.ProductActionType.Checkout),g.EventCategory=Types.CommerceEventType.ProductCheckout,g.ProductAction={ProductActionType:Types.ProductActionType.Checkout,CheckoutStep:c,CheckoutOptions:d,ProductList:[]},b.logCommerceEvent(g,e));},this.logProductActionEvent=function(c,d,e,f,g,h){var i=a._Ecommerce.createCommerceEventObject(f),j=Array.isArray(d)?d:[d];j.forEach(function(b){b.TotalAmount&&(b.TotalAmount=a._Ecommerce.sanitizeAmount(b.TotalAmount,"TotalAmount")),b.Position&&(b.Position=a._Ecommerce.sanitizeAmount(b.Position,"Position")),b.Price&&(b.Price=a._Ecommerce.sanitizeAmount(b.Price,"Price")),b.Quantity&&(b.Quantity=a._Ecommerce.sanitizeAmount(b.Quantity,"Quantity"));}),i&&(i.EventCategory=a._Ecommerce.convertProductActionToEventType(c),i.EventName+=a._Ecommerce.getProductActionEventName(c),i.ProductAction={ProductActionType:c,ProductList:j},a._Helpers.isObject(g)&&a._Ecommerce.convertTransactionAttributesToProductAction(g,i.ProductAction),b.logCommerceEvent(i,e,h));},this.logPurchaseEvent=function(c,d,e,f){var g=a._Ecommerce.createCommerceEventObject(f);g&&(g.EventName+=a._Ecommerce.getProductActionEventName(Types.ProductActionType.Purchase),g.EventCategory=Types.CommerceEventType.ProductPurchase,g.ProductAction={ProductActionType:Types.ProductActionType.Purchase},g.ProductAction.ProductList=a._Ecommerce.buildProductList(g,d),a._Ecommerce.convertTransactionAttributesToProductAction(c,g.ProductAction),b.logCommerceEvent(g,e));},this.logRefundEvent=function(c,d,e,f){if(!c)return void a.Logger.error(Messages$3.ErrorMessages.TransactionRequired);var g=a._Ecommerce.createCommerceEventObject(f);g&&(g.EventName+=a._Ecommerce.getProductActionEventName(Types.ProductActionType.Refund),g.EventCategory=Types.CommerceEventType.ProductRefund,g.ProductAction={ProductActionType:Types.ProductActionType.Refund},g.ProductAction.ProductList=a._Ecommerce.buildProductList(g,d),a._Ecommerce.convertTransactionAttributesToProductAction(c,g.ProductAction),b.logCommerceEvent(g,e));},this.logPromotionEvent=function(c,d,e,f,g){var h=a._Ecommerce.createCommerceEventObject(f);h&&(h.EventName+=a._Ecommerce.getPromotionActionEventName(c),h.EventCategory=a._Ecommerce.convertPromotionActionToEventType(c),h.PromotionAction={PromotionActionType:c,PromotionList:Array.isArray(d)?d:[d]},b.logCommerceEvent(h,e,g));},this.logImpressionEvent=function(c,d,e,f){var g=a._Ecommerce.createCommerceEventObject(e);g&&(g.EventName+="Impression",g.EventCategory=Types.CommerceEventType.ProductImpression,!Array.isArray(c)&&(c=[c]),g.ProductImpressions=[],c.forEach(function(a){g.ProductImpressions.push({ProductImpressionList:a.Name,ProductList:Array.isArray(a.Product)?a.Product:[a.Product]});}),b.logCommerceEvent(g,d,f));},this.logCommerceEvent=function(b,c,d){// If a developer typos the ProductActionType, the event category will be
// null, resulting in kit forwarding errors on the server.
// The check for `ProductAction` is required to denote that these are
// ProductAction events, and not impression or promotions
return a.Logger.verbose(Messages$3.InformationMessages.StartingLogCommerceEvent),b.ProductAction&&null===b.EventCategory?void a.Logger.error("Commerce event not sent.  The mParticle.ProductActionType you passed was invalid. Re-check your code."):void(c=a._Helpers.sanitizeAttributes(c,b.EventName),a._Helpers.canLog()?(a._Store.webviewBridgeEnabled&&(b.ShoppingCart={}),c&&(b.EventAttributes=c),a._APIClient.sendEventToServer(b,d),a._Persistence.update()):a.Logger.verbose(Messages$3.InformationMessages.AbandonLogEvent))},this.addEventHandler=function(c,d,f,g,h){var j,k,e=[],l=function handler(c){var d=function timeoutHandler(){j.href?window.location.href=j.href:j.submit&&j.submit();};a.Logger.verbose("DOM event triggered, handling event"),b.logEvent({messageType:Types.MessageType.PageEvent,name:"function"==typeof f?f(j):f,data:"function"==typeof g?g(j):g,eventType:h||Types.EventType.Other}),(j.href&&"_blank"!==j.target||j.submit)&&(c.preventDefault?c.preventDefault():c.returnValue=!1,setTimeout(d,a._Store.SDKConfig.timeout));};if(!d)return void a.Logger.error("Can't bind event, selector is required");// Handle a css selector string or a dom element
if("string"==typeof d?e=document.querySelectorAll(d):d.nodeType&&(e=[d]),e.length)for(a.Logger.verbose("Found "+e.length+" element"+(1<e.length?"s":"")+", attaching event handlers"),k=0;k<e.length;k++)j=e[k],j.addEventListener?j.addEventListener(c,l,!1):j.attachEvent?j.attachEvent("on"+c,l):j["on"+c]=l;else a.Logger.verbose("No elements found");};}

function filteredMparticleUser(a,b,c,d){var e=this;return {getUserIdentities:function getUserIdentities(){var e={},f=c._Persistence.getUserIdentities(a);for(var g in f)if(f.hasOwnProperty(g)){var h=Types.IdentityType.getIdentityName(c._Helpers.parseNumber(g));d&&(!d||d.isIdentityBlocked(h))||(//if identity type is not blocked
e[h]=f[g]);}return e=c._Helpers.filterUserIdentitiesForForwarders(e,b.userIdentityFilters),{userIdentities:e}},getMPID:function getMPID(){return a},getUserAttributesLists:function getUserAttributesLists(a){var b,f={};for(var g in b=e.getAllUserAttributes(),b)b.hasOwnProperty(g)&&Array.isArray(b[g])&&(d&&(!d||d.isAttributeKeyBlocked(g))||(f[g]=b[g].slice()));return f=c._Helpers.filterUserAttributes(f,a.userAttributeFilters),f},getAllUserAttributes:function getAllUserAttributes(){var e={},f=c._Persistence.getAllUserAttributes(a);if(f)for(var g in f)f.hasOwnProperty(g)&&(d&&(!d||d.isAttributeKeyBlocked(g))||(Array.isArray(f[g])?e[g]=f[g].slice():e[g]=f[g]));return e=c._Helpers.filterUserAttributes(e,b.userAttributeFilters),e}}}

function Forwarders(a,b){var c=this,d={setUserAttribute:"setUserAttribute",removeUserAttribute:"removeUserAttribute"};// Processing forwarders is a 2 step process:
//   1. Configure the kit
//   2. Initialize the kit
// There are 2 types of kits:
//   1. UI-enabled kits
//   2. Sideloaded kits.
// These are kits that are enabled via the mParticle UI.
// A kit that is UI-enabled will have a kit configuration that returns from
// the server, or in rare cases, is passed in by the developer.
// The kit configuration will be compared with the kit constructors to determine
// if there is a match before being initialized.
// Only kits that are configured properly can be active and used for kit forwarding.
// Sideloaded kits are not configured in the UI and do not have kit configurations
// They are automatically added to active forwarders.
// TODO: Sideloading kits currently requires the use of a register method
// which requires an object on which to be registered.
// In the future, when all kits are moved to the config rather than
// there being a separate process for MP configured kits and
// sideloaded kits, this will need to be refactored.
// kits can be included via mParticle UI, or via sideloaded kit config API
this.initForwarders=function(b,d){var e=a.Identity.getCurrentUser();!a._Store.webviewBridgeEnabled&&a._Store.configuredForwarders&&(a._Store.configuredForwarders.sort(function(a,b){return a.settings.PriorityValue=a.settings.PriorityValue||0,b.settings.PriorityValue=b.settings.PriorityValue||0,-1*(a.settings.PriorityValue-b.settings.PriorityValue)}),a._Store.activeForwarders=a._Store.configuredForwarders.filter(function(f){if(!a._Consent.isEnabledForUserConsent(f.filteringConsentRuleValues,e))return !1;if(!c.isEnabledForUserAttributes(f.filteringUserAttributeValue,e))return !1;if(!c.isEnabledForUnknownUser(f.excludeAnonymousUser,e))return !1;var g=a._Helpers.filterUserIdentities(b,f.userIdentityFilters),h=a._Helpers.filterUserAttributes(e?e.getAllUserAttributes():{},f.userAttributeFilters);return f.initialized||(f.logger=a.Logger,f.init(f.settings,d,!1,null,h,g,a._Store.SDKConfig.appVersion,a._Store.SDKConfig.appName,a._Store.SDKConfig.customFlags,a._Store.clientId),f.initialized=!0),!0}));},this.isEnabledForUserAttributes=function(b,c){if(!b||!a._Helpers.isObject(b)||!Object.keys(b).length)return !0;var d,e,f;if(!c)return !1;f=c.getAllUserAttributes();var g=!1;try{if(f&&a._Helpers.isObject(f)&&Object.keys(f).length)for(var h in f)if(f.hasOwnProperty(h)&&(d=KitFilterHelper.hashAttributeConditionalForwarding(h),e=KitFilterHelper.hashAttributeConditionalForwarding(f[h]),d===b.userAttributeName&&e===b.userAttributeValue)){g=!0;break}return !b||b.includeOnMatch===g}catch(a){// in any error scenario, err on side of returning true and forwarding event
return !0}},this.isEnabledForUnknownUser=function(a,b){return !!(b&&b.isLoggedIn()||!a)},this.applyToForwarders=function(b,c){a._Store.activeForwarders.length&&a._Store.activeForwarders.forEach(function(d){var e=d[b];if(e)try{var f=d[b](c);f&&a.Logger.verbose(f);}catch(b){a.Logger.verbose(b);}});},this.sendEventToForwarders=function(b){var c,d,e,f=function(b,c){b.UserIdentities&&b.UserIdentities.length&&b.UserIdentities.forEach(function(d,e){a._Helpers.inArray(c,KitFilterHelper.hashUserIdentity(d.Type))&&(b.UserIdentities.splice(e,1),0<e&&e--);});},g=function(b,c){var d;if(c)for(var e in b.EventAttributes)b.EventAttributes.hasOwnProperty(e)&&(d=KitFilterHelper.hashEventAttributeKey(b.EventCategory,b.EventName,e),a._Helpers.inArray(c,d)&&delete b.EventAttributes[e]);},h=function(b,c){return !!(b&&b.length&&a._Helpers.inArray(b,c))},j=[Types.MessageType.PageEvent,Types.MessageType.PageView,Types.MessageType.Commerce];if(!a._Store.webviewBridgeEnabled&&a._Store.activeForwarders){d=KitFilterHelper.hashEventName(b.EventName,b.EventCategory),e=KitFilterHelper.hashEventType(b.EventCategory);for(var k=0;k<a._Store.activeForwarders.length;k++){// Check attribute forwarding rule. This rule allows users to only forward an event if a
// specific attribute exists and has a specific value. Alternatively, they can specify
// that an event not be forwarded if the specified attribute name and value exists.
// The two cases are controlled by the "includeOnMatch" boolean value.
// Supported message types for attribute forwarding rules are defined in the forwardingRuleMessageTypes array
if(-1<j.indexOf(b.EventDataType)&&a._Store.activeForwarders[k].filteringEventAttributeValue&&a._Store.activeForwarders[k].filteringEventAttributeValue.eventAttributeName&&a._Store.activeForwarders[k].filteringEventAttributeValue.eventAttributeValue){var l=null;// Attempt to find the attribute in the collection of event attributes
if(b.EventAttributes)for(var m in b.EventAttributes){var n;if(n=KitFilterHelper.hashAttributeConditionalForwarding(m),n===a._Store.activeForwarders[k].filteringEventAttributeValue.eventAttributeName&&(l={name:n,value:KitFilterHelper.hashAttributeConditionalForwarding(b.EventAttributes[m])}),l)break}var o=null!==l&&l.value===a._Store.activeForwarders[k].filteringEventAttributeValue.eventAttributeValue,p=!0===a._Store.activeForwarders[k].filteringEventAttributeValue.includeOnMatch?o:!o;if(!p)continue}// Clone the event object, as we could be sending different attributes to each forwarder
// Check event filtering rules
if(c={},c=a._Helpers.extend(!0,c,b),b.EventDataType===Types.MessageType.PageEvent&&(h(a._Store.activeForwarders[k].eventNameFilters,d)||h(a._Store.activeForwarders[k].eventTypeFilters,e)))continue;else if(b.EventDataType===Types.MessageType.Commerce&&h(a._Store.activeForwarders[k].eventTypeFilters,e))continue;else if(b.EventDataType===Types.MessageType.PageView&&h(a._Store.activeForwarders[k].screenNameFilters,d))continue;// Check attribute filtering rules
if(c.EventAttributes&&(b.EventDataType===Types.MessageType.PageEvent?g(c,a._Store.activeForwarders[k].attributeFilters):b.EventDataType===Types.MessageType.PageView&&g(c,a._Store.activeForwarders[k].screenAttributeFilters)),f(c,a._Store.activeForwarders[k].userIdentityFilters),c.UserAttributes=a._Helpers.filterUserAttributes(c.UserAttributes,a._Store.activeForwarders[k].userAttributeFilters),a._Store.activeForwarders[k].process){a.Logger.verbose("Sending message to forwarder: "+a._Store.activeForwarders[k].name);var q=a._Store.activeForwarders[k].process(c);q&&a.Logger.verbose(q);}}}},this.handleForwarderUserAttributes=function(c,e,f){b&&b.isAttributeKeyBlocked(e)||!a._Store.activeForwarders.length||a._Store.activeForwarders.forEach(function(b){var g=b[c];if(g&&!a._Helpers.isFilteredUserAttribute(e,b.userAttributeFilters))try{var h;c===d.setUserAttribute?h=b.setUserAttribute(e,f):c===d.removeUserAttribute&&(h=b.removeUserAttribute(e)),h&&a.Logger.verbose(h);}catch(b){a.Logger.error(b);}});},this.setForwarderUserIdentities=function(b){a._Store.activeForwarders.forEach(function(c){var d=a._Helpers.filterUserIdentities(b,c.userIdentityFilters);c.setUserIdentity&&d.forEach(function(b){var d=c.setUserIdentity(b.Identity,b.Type);d&&a.Logger.verbose(d);});});},this.setForwarderOnUserIdentified=function(c){a._Store.activeForwarders.forEach(function(d){var e=filteredMparticleUser(c.getMPID(),d,a,b);if(d.onUserIdentified){var f=d.onUserIdentified(e);f&&a.Logger.verbose(f);}});},this.setForwarderOnIdentityComplete=function(c,d){var e;a._Store.activeForwarders.forEach(function(f){var g=filteredMparticleUser(c.getMPID(),f,a,b);"identify"===d?f.onIdentifyComplete&&(e=f.onIdentifyComplete(g),e&&a.Logger.verbose(e)):"login"===d?f.onLoginComplete&&(e=f.onLoginComplete(g),e&&a.Logger.verbose(e)):"logout"===d?f.onLogoutComplete&&(e=f.onLogoutComplete(g),e&&a.Logger.verbose(e)):"modify"==d&&f.onModifyComplete&&(e=f.onModifyComplete(g),e&&a.Logger.verbose(e));});},this.getForwarderStatsQueue=function(){return a._Persistence.forwardingStatsBatches.forwardingStatsEventQueue},this.setForwarderStatsQueue=function(b){a._Persistence.forwardingStatsBatches.forwardingStatsEventQueue=b;},this.processForwarders=function(b,d){b?(this.processUIEnabledKits(b),this.processSideloadedKits(b),c.initForwarders(a._Store.SDKConfig.identifyRequest.userIdentities,d)):a.Logger.warning("No config was passed. Cannot process forwarders");},this.processUIEnabledKits=function(b){var d=this.returnKitConstructors();try{Array.isArray(b.kitConfigs)&&b.kitConfigs.length&&b.kitConfigs.forEach(function(a){c.configureUIEnabledKit(a,d);});}catch(b){a.Logger.error("MP Kits not configured propertly. Kits may not be initialized. "+b);}},this.returnKitConstructors=function(){var b={};// If there are kits inside of mpInstance._Store.SDKConfig.kits, then mParticle is self hosted
return isEmpty(a._Store.SDKConfig.kits)?!isEmpty(a._preInit.forwarderConstructors)&&a._preInit.forwarderConstructors.forEach(function(a){// A suffix is added to a kitConstructor and kit config if there are multiple different
// versions of a client kit.  This matches the suffix in the DB.  As an example
// the GA4 kit has a client kit and a server side kit which has a client side
// component.  They share the same name/module ID in the DB, so we include a
// suffix to distinguish them in the kits object.
// If a customer wanted simultaneous GA4 client and server connections,
// a suffix allows the SDK to distinguish the two.
if(a.suffix){var c="".concat(a.name,"-").concat(a.suffix);b[c]=a;}else b[a.name]=a;}):b=a._Store.SDKConfig.kits,b},this.configureUIEnabledKit=function(b,c){var d=null,e=b;for(var f in c){// Configs are returned with suffixes also. We need to consider the
// config suffix here to match the constructor suffix
var g=void 0;if(e.suffix&&(g="".concat(e.name,"-").concat(e.suffix)),(f===g||f===e.name)&&(e.isDebug===a._Store.SDKConfig.isDevelopmentMode||e.isSandbox===a._Store.SDKConfig.isDevelopmentMode)){d=this.returnConfiguredKit(c[f],e),a._Store.configuredForwarders.push(d);break}}},this.processSideloadedKits=function(b){try{if(Array.isArray(b.sideloadedKits)){var d={kits:{}};// First register each kit's constructor onto sideloadedKits,
// which is typed { kits: Dictionary<constructor> }.
// The constructors are keyed by the name of the kit.
// Then configure each kit
for(var e in b.sideloadedKits.forEach(function(a){try{a.kitInstance.register(d);}catch(b){console.error("Error registering sideloaded kit "+a.kitInstance.name);}}),d.kits){var f=d.kits[e];c.configureSideloadedKit(f);}// If Sideloaded Kits are successfully registered,
// record this in the Store.
if(!isEmpty(d.kits)){var g=Object.keys(d.kits);a._Store.sideloadedKitsCount=g.length;}}}catch(b){a.Logger.error("Sideloaded Kits not configured propertly. Kits may not be initialized. "+b);}},this.configureSideloadedKit=function(b){a._Store.configuredForwarders.push(this.returnConfiguredKit(b));},this.returnConfiguredKit=function(a){var b=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{},c=new a.constructor;return c.id=b.moduleId,c.isSandbox=b.isDebug||b.isSandbox,c.hasSandbox="true"===b.hasDebugString,c.isVisible=b.isVisible||!0,c.settings=b.settings||{},c.eventNameFilters=b.eventNameFilters||[],c.eventTypeFilters=b.eventTypeFilters||[],c.attributeFilters=b.attributeFilters||[],c.screenNameFilters=b.screenNameFilters||[],c.screenAttributeFilters=b.screenAttributeFilters||[],c.userIdentityFilters=b.userIdentityFilters||[],c.userAttributeFilters=b.userAttributeFilters||[],c.filteringEventAttributeValue=b.filteringEventAttributeValue||{},c.filteringUserAttributeValue=b.filteringUserAttributeValue||{},c.eventSubscriptionId=b.eventSubscriptionId||null,c.filteringConsentRuleValues=b.filteringConsentRuleValues||{},c.excludeAnonymousUser=b.excludeAnonymousUser||!1,c},this.configurePixel=function(b){(b.isDebug===a._Store.SDKConfig.isDevelopmentMode||b.isProduction!==a._Store.SDKConfig.isDevelopmentMode)&&a._Store.pixelConfigurations.push(b);},this.processPixelConfigs=function(b){try{isEmpty(b.pixelConfigs)||b.pixelConfigs.forEach(function(a){c.configurePixel(a);});}catch(b){a.Logger.error("Cookie Sync configs not configured propertly. Cookie Sync may not be initialized. "+b);}};}

// TODO: This file is no longer the server model because the web SDK payload
var MessageType$1=Types.MessageType,ApplicationTransitionType=Types.ApplicationTransitionType;// TODO: Make this a pure function that returns a new object
function convertCustomFlags(a,b){var c=[];for(var d in b.flags={},a.CustomFlags)c=[],a.CustomFlags.hasOwnProperty(d)&&(Array.isArray(a.CustomFlags[d])?a.CustomFlags[d].forEach(function(a){("number"==typeof a||"string"==typeof a||"boolean"==typeof a)&&c.push(a.toString());}):(// TODO: Can we use our utility functions here?
"number"==typeof a.CustomFlags[d]||"string"==typeof a.CustomFlags[d]||"boolean"==typeof a.CustomFlags[d])&&c.push(a.CustomFlags[d].toString()),c.length&&(b.flags[d]=c));}function convertProductToV2DTO(a){return {id:parseStringOrNumber(a.Sku),nm:parseStringOrNumber(a.Name),pr:parseNumber(a.Price),qt:parseNumber(a.Quantity),br:parseStringOrNumber(a.Brand),va:parseStringOrNumber(a.Variant),ca:parseStringOrNumber(a.Category),ps:parseNumber(a.Position),cc:parseStringOrNumber(a.CouponCode),tpa:parseNumber(a.TotalAmount),attrs:a.Attributes}}function convertProductListToV2DTO(a){return a?a.map(function(a){return convertProductToV2DTO(a)}):[]}function ServerModel(a){var b=this;// TODO: Can we refactor this to not mutate the event?
this.appendUserInfo=function(b,c){if(c){if(!b)return c.MPID=null,c.ConsentState=null,c.UserAttributes=null,void(c.UserIdentities=null);if(!(c.MPID&&c.MPID===b.getMPID())){c.MPID=b.getMPID(),c.ConsentState=b.getConsentState(),c.UserAttributes=b.getAllUserAttributes();var d=b.getUserIdentities().userIdentities,e={};for(var f in d){var g=Types.IdentityType.getIdentityType(f);!1!==g&&(e[g]=d[f]);}var h=[];if(a._Helpers.isObject(e)&&Object.keys(e).length)for(var i in e){var j={};j.Identity=e[i],j.Type=a._Helpers.parseNumber(i),h.push(j);}c.UserIdentities=h;}}},this.convertToConsentStateV2DTO=function(a){if(!a)return null;var b={},c=a.getGDPRConsentState();if(c){var d={};for(var e in b.gdpr=d,c)if(c.hasOwnProperty(e)){var f=c[e];b.gdpr[e]={},"boolean"==typeof f.Consented&&(d[e].c=f.Consented),"number"==typeof f.Timestamp&&(d[e].ts=f.Timestamp),"string"==typeof f.ConsentDocument&&(d[e].d=f.ConsentDocument),"string"==typeof f.Location&&(d[e].l=f.Location),"string"==typeof f.HardwareId&&(d[e].h=f.HardwareId);}}var g=a.getCCPAConsentState();return g&&(b.ccpa={data_sale_opt_out:{c:g.Consented,ts:g.Timestamp,d:g.ConsentDocument,l:g.Location,h:g.HardwareId}}),b},this.createEventObject=function(c,d){var e={},f={},g=c.messageType===Types.MessageType.OptOut?!a._Store.isEnabled:null;//  The `optOut` variable is passed later in this method to the `uploadObject`
//  so that it can be used to denote whether or not a user has "opted out" of being
//  tracked. If this is an `optOut` Event, we set `optOut` to the inverse of the SDK's
// `isEnabled` boolean which is controlled via `MPInstanceManager.setOptOut`.
// TODO: Why is Webview Bridge Enabled or Opt Out necessary here?
if(a._Store.sessionId||c.messageType===Types.MessageType.OptOut||a._Store.webviewBridgeEnabled){f=c.hasOwnProperty("toEventAPIObject")?c.toEventAPIObject():{// This is an artifact from v2 events where SessionStart/End and AST event
//  names are numbers (1, 2, or 10), but going forward with v3, these lifecycle
//  events do not have names, but are denoted by their `event_type`
EventName:c.name||c.messageType,EventCategory:c.eventType,EventAttributes:a._Helpers.sanitizeAttributes(c.data,c.name),SourceMessageId:c.sourceMessageId||a._Helpers.generateUniqueId(),EventDataType:c.messageType,CustomFlags:c.customFlags||{},UserAttributeChanges:c.userAttributeChanges,UserIdentityChanges:c.userIdentityChanges},c.messageType!==Types.MessageType.SessionEnd&&(a._Store.dateLastEventSent=new Date),e={// FIXME: Deprecate when we get rid of V2
Store:a._Store.serverSettings,SDKVersion:Constants.sdkVersion,SessionId:a._Store.sessionId,SessionStartDate:a._Store.sessionStartDate?a._Store.sessionStartDate.getTime():0,Debug:a._Store.SDKConfig.isDevelopmentMode,Location:a._Store.currentPosition,OptOut:g,ExpandedEventCount:0,AppVersion:a.getAppVersion(),AppName:a.getAppName(),Package:a._Store.SDKConfig["package"],ClientGeneratedId:a._Store.clientId,DeviceId:a._Store.deviceId,IntegrationAttributes:a._Store.integrationAttributes,CurrencyCode:a._Store.currencyCode,DataPlan:a._Store.SDKConfig.dataPlan?a._Store.SDKConfig.dataPlan:{}},f.EventDataType===MessageType$1.AppStateTransition&&(f.IsFirstRun=a._Store.isFirstRun,f.LaunchReferral=window.location.href||null),f.CurrencyCode=a._Store.currencyCode;var h=d||a.Identity.getCurrentUser();return b.appendUserInfo(h,f),c.messageType===Types.MessageType.SessionEnd&&(f.SessionLength=a._Store.dateLastEventSent.getTime()-a._Store.sessionStartDate.getTime(),f.currentSessionMPIDs=a._Store.currentSessionMPIDs,f.EventAttributes=a._Store.sessionAttributes,a._Store.currentSessionMPIDs=[],a._Store.sessionStartDate=null),e.Timestamp=a._Store.dateLastEventSent.getTime(),a._Helpers.extend({},f,e)}return null},this.convertEventToV2DTO=function(c){var d={n:c.EventName,et:c.EventCategory,ua:c.UserAttributes,ui:c.UserIdentities,ia:c.IntegrationAttributes,str:c.Store,attrs:c.EventAttributes,sdk:c.SDKVersion,sid:c.SessionId,sl:c.SessionLength,ssd:c.SessionStartDate,dt:c.EventDataType,dbg:c.Debug,ct:c.Timestamp,lc:c.Location,o:c.OptOut,eec:c.ExpandedEventCount,av:c.AppVersion,cgid:c.ClientGeneratedId,das:c.DeviceId,mpid:c.MPID,smpids:c.currentSessionMPIDs};c.DataPlan&&c.DataPlan.PlanId&&(d.dp_id=c.DataPlan.PlanId,c.DataPlan.PlanVersion&&(d.dp_v=c.DataPlan.PlanVersion));var e=b.convertToConsentStateV2DTO(c.ConsentState);return e&&(d.con=e),c.EventDataType===MessageType$1.AppStateTransition&&(d.fr=c.IsFirstRun,d.iu=!1,d.at=ApplicationTransitionType.AppInit,d.lr=c.LaunchReferral,d.attrs=null),c.CustomFlags&&convertCustomFlags(c,d),c.EventDataType===MessageType$1.Commerce?(d.cu=c.CurrencyCode,c.ShoppingCart&&(d.sc={pl:convertProductListToV2DTO(c.ShoppingCart.ProductList)}),c.ProductAction?d.pd={an:c.ProductAction.ProductActionType,cs:a._Helpers.parseNumber(c.ProductAction.CheckoutStep),co:c.ProductAction.CheckoutOptions,pl:convertProductListToV2DTO(c.ProductAction.ProductList),ti:c.ProductAction.TransactionId,ta:c.ProductAction.Affiliation,tcc:c.ProductAction.CouponCode,tr:a._Helpers.parseNumber(c.ProductAction.TotalAmount),ts:a._Helpers.parseNumber(c.ProductAction.ShippingAmount),tt:a._Helpers.parseNumber(c.ProductAction.TaxAmount)}:c.PromotionAction?d.pm={an:c.PromotionAction.PromotionActionType,pl:c.PromotionAction.PromotionList.map(function(a){return {id:a.Id,nm:a.Name,cr:a.Creative,ps:a.Position?a.Position:0}})}:c.ProductImpressions&&(d.pi=c.ProductImpressions.map(function(a){return {pil:a.ProductImpressionList,pl:convertProductListToV2DTO(a.ProductList)}}))):c.EventDataType===MessageType$1.Profile&&(d.pet=c.ProfileMessageType),d};}

function forwardingStatsUploader(a){function b(){var b=a._Forwarders.getForwarderStatsQueue(),c=a._Persistence.forwardingStatsBatches.uploadsTable,d=Date.now();for(var e in b.length&&(c[d]={uploading:!1,data:b},a._Forwarders.setForwarderStatsQueue([])),c)(function(b){if(c.hasOwnProperty(b)&&!1===c[b].uploading){var d=function(){4===e.readyState&&(200===e.status||202===e.status?(a.Logger.verbose("Successfully sent  "+e.statusText+" from server"),delete c[b]):"4"===e.status.toString()[0]?429!==e.status&&delete c[b]:c[b].uploading=!1);},e=a._Helpers.createXHR(d),f=c[b].data;c[b].uploading=!0,a._APIClient.sendBatchForwardingStatsToServer(f,e);}})(e);}this.startForwardingStatsTimer=function(){mParticle._forwardingStatsTimer=setInterval(function(){b();},a._Store.SDKConfig.forwarderStatsTimeout);};}

var Messages$2=Constants.Messages,HTTPCodes$2=Constants.HTTPCodes;function Identity(t){var s=this;/**
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
this.checkIdentitySwap=function(e,s,r){if(e&&s&&e!==s){var i=t._Persistence.getPersistence();i&&(i.cu=s,i.gs.csm=r,t._Persistence.savePersistence(i));}},this.IdentityRequest={createKnownIdentities:function createKnownIdentities(e,s){var r={};if(e&&e.userIdentities&&t._Helpers.isObject(e.userIdentities))for(var i in e.userIdentities)r[i]=e.userIdentities[i];return r.device_application_stamp=s,r},preProcessIdentityRequest:function preProcessIdentityRequest(e,s,r){t.Logger.verbose(Messages$2.InformationMessages.StartingLogEvent+": "+r);var i=t._Helpers.Validators.validateIdentities(e,r);if(!i.valid)return t.Logger.error("ERROR: "+i.error),{valid:!1,error:i.error};if(s&&!t._Helpers.Validators.isFunction(s)){var n="The optional callback must be a function. You tried entering a(n) "+_typeof(s);return t.Logger.error(n),{valid:!1,error:n}}return {valid:!0}},createIdentityRequest:function createIdentityRequest(e,s,r,i,n,o,d){var a={client_sdk:{platform:s,sdk_vendor:r,sdk_version:i},context:o,environment:t._Store.SDKConfig.isDevelopmentMode?"development":"production",request_id:t._Helpers.generateUniqueId(),request_timestamp_ms:new Date().getTime(),previous_mpid:d||null,known_identities:this.createKnownIdentities(e,n)};return a},createModifyIdentityRequest:function createModifyIdentityRequest(e,s,r,i,n,o){return {client_sdk:{platform:r,sdk_vendor:i,sdk_version:n},context:o,environment:t._Store.SDKConfig.isDevelopmentMode?"development":"production",request_id:t._Helpers.generateUniqueId(),request_timestamp_ms:new Date().getTime(),identity_changes:this.createIdentityChanges(e,s)}},createIdentityChanges:function createIdentityChanges(e,s){var r,i=[];if(s&&t._Helpers.isObject(s)&&e&&t._Helpers.isObject(e))for(r in s)i.push({old_value:e[r]||null,new_value:s[r],identity_type:r});return i},// takes 2 UI objects keyed by name, combines them, returns them keyed by type
combineUserIdentities:function combineUserIdentities(e,s){var r={},i=t._Helpers.extend(e,s);for(var n in i){var o=Types.IdentityType.getIdentityType(n);// this check removes anything that is not whitelisted as an identity type
!1!==o&&0<=o&&(r[Types.IdentityType.getIdentityType(n)]=i[n]);}return r},createAliasNetworkRequest:function createAliasNetworkRequest(e){return {request_id:t._Helpers.generateUniqueId(),request_type:"alias",environment:t._Store.SDKConfig.isDevelopmentMode?"development":"production",api_key:t._Store.devToken,data:{destination_mpid:e.destinationMpid,source_mpid:e.sourceMpid,start_unixtime_ms:e.startTime,end_unixtime_ms:e.endTime,scope:e.scope,device_application_stamp:t._Store.deviceId}}},convertAliasToNative:function convertAliasToNative(e){return {DestinationMpid:e.destinationMpid,SourceMpid:e.sourceMpid,StartUnixtimeMs:e.startTime,EndUnixtimeMs:e.endTime}},convertToNative:function convertToNative(e){var t=[];if(e&&e.userIdentities){for(var s in e.userIdentities)e.userIdentities.hasOwnProperty(s)&&t.push({Type:Types.IdentityType.getIdentityType(s),Identity:e.userIdentities[s]});return {UserIdentities:t}}}},this.IdentityAPI={HTTPCodes:HTTPCodes$2,/**
         * Initiate a logout request to the mParticle server
         * @method identify
         * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
         * @param {Function} [callback] A callback function that is called when the identify request completes
         */identify:function identify(e,r){var i,n=t.Identity.getCurrentUser(),o=t._Identity.IdentityRequest.preProcessIdentityRequest(e,r,"identify");if(n&&(i=n.getMPID()),o.valid){var d=t._Identity.IdentityRequest.createIdentityRequest(e,Constants.platform,Constants.sdkVendor,Constants.sdkVersion,t._Store.deviceId,t._Store.context,i);t._Helpers.canLog()?t._Store.webviewBridgeEnabled?(t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Identify,JSON.stringify(t._Identity.IdentityRequest.convertToNative(e))),t._Helpers.invokeCallback(r,HTTPCodes$2.nativeIdentityRequest,"Identify request sent to native sdk")):t._IdentityAPIClient.sendIdentityRequest(d,"identify",r,e,s.parseIdentityResponse,i):(t._Helpers.invokeCallback(r,HTTPCodes$2.loggingDisabledOrMissingAPIKey,Messages$2.InformationMessages.AbandonLogEvent),t.Logger.verbose(Messages$2.InformationMessages.AbandonLogEvent));}else t._Helpers.invokeCallback(r,HTTPCodes$2.validationIssue,o.error),t.Logger.verbose(o);},/**
         * Initiate a logout request to the mParticle server
         * @method logout
         * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
         * @param {Function} [callback] A callback function that is called when the logout request completes
         */logout:function logout(e,r){var i,n=t.Identity.getCurrentUser(),o=t._Identity.IdentityRequest.preProcessIdentityRequest(e,r,"logout");if(n&&(i=n.getMPID()),o.valid){var d,a=t._Identity.IdentityRequest.createIdentityRequest(e,Constants.platform,Constants.sdkVendor,Constants.sdkVersion,t._Store.deviceId,t._Store.context,i);t._Helpers.canLog()?t._Store.webviewBridgeEnabled?(t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Logout,JSON.stringify(t._Identity.IdentityRequest.convertToNative(e))),t._Helpers.invokeCallback(r,HTTPCodes$2.nativeIdentityRequest,"Logout request sent to native sdk")):(t._IdentityAPIClient.sendIdentityRequest(a,"logout",r,e,s.parseIdentityResponse,i),d=t._ServerModel.createEventObject({messageType:Types.MessageType.Profile}),d.ProfileMessageType=Types.ProfileMessageType.Logout,t._Store.activeForwarders.length&&t._Store.activeForwarders.forEach(function(e){e.logOut&&e.logOut(d);})):(t._Helpers.invokeCallback(r,HTTPCodes$2.loggingDisabledOrMissingAPIKey,Messages$2.InformationMessages.AbandonLogEvent),t.Logger.verbose(Messages$2.InformationMessages.AbandonLogEvent));}else t._Helpers.invokeCallback(r,HTTPCodes$2.validationIssue,o.error),t.Logger.verbose(o);},/**
         * Initiate a login request to the mParticle server
         * @method login
         * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
         * @param {Function} [callback] A callback function that is called when the login request completes
         */login:function login(e,r){var i,n=t.Identity.getCurrentUser(),o=t._Identity.IdentityRequest.preProcessIdentityRequest(e,r,"login");if(n&&(i=n.getMPID()),o.valid){var d=t._Identity.IdentityRequest.createIdentityRequest(e,Constants.platform,Constants.sdkVendor,Constants.sdkVersion,t._Store.deviceId,t._Store.context,i);t._Helpers.canLog()?t._Store.webviewBridgeEnabled?(t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Login,JSON.stringify(t._Identity.IdentityRequest.convertToNative(e))),t._Helpers.invokeCallback(r,HTTPCodes$2.nativeIdentityRequest,"Login request sent to native sdk")):t._IdentityAPIClient.sendIdentityRequest(d,"login",r,e,s.parseIdentityResponse,i):(t._Helpers.invokeCallback(r,HTTPCodes$2.loggingDisabledOrMissingAPIKey,Messages$2.InformationMessages.AbandonLogEvent),t.Logger.verbose(Messages$2.InformationMessages.AbandonLogEvent));}else t._Helpers.invokeCallback(r,HTTPCodes$2.validationIssue,o.error),t.Logger.verbose(o);},/**
         * Initiate a modify request to the mParticle server
         * @method modify
         * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
         * @param {Function} [callback] A callback function that is called when the modify request completes
         */modify:function modify(e,r){var i,n=t.Identity.getCurrentUser(),o=t._Identity.IdentityRequest.preProcessIdentityRequest(e,r,"modify");n&&(i=n.getMPID());var d=e&&e.userIdentities?e.userIdentities:{};if(o.valid){var a=t._Identity.IdentityRequest.createModifyIdentityRequest(n?n.getUserIdentities().userIdentities:{},d,Constants.platform,Constants.sdkVendor,Constants.sdkVersion,t._Store.context);t._Helpers.canLog()?t._Store.webviewBridgeEnabled?(t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Modify,JSON.stringify(t._Identity.IdentityRequest.convertToNative(e))),t._Helpers.invokeCallback(r,HTTPCodes$2.nativeIdentityRequest,"Modify request sent to native sdk")):t._IdentityAPIClient.sendIdentityRequest(a,"modify",r,e,s.parseIdentityResponse,i):(t._Helpers.invokeCallback(r,HTTPCodes$2.loggingDisabledOrMissingAPIKey,Messages$2.InformationMessages.AbandonLogEvent),t.Logger.verbose(Messages$2.InformationMessages.AbandonLogEvent));}else t._Helpers.invokeCallback(r,HTTPCodes$2.validationIssue,o.error),t.Logger.verbose(o);},/**
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
         */aliasUsers:function aliasUsers(e,s){var r;if(e.destinationMpid&&e.sourceMpid||(r=Messages$2.ValidationMessages.AliasMissingMpid),e.destinationMpid===e.sourceMpid&&(r=Messages$2.ValidationMessages.AliasNonUniqueMpid),e.startTime&&e.endTime||(r=Messages$2.ValidationMessages.AliasMissingTime),e.startTime>e.endTime&&(r=Messages$2.ValidationMessages.AliasStartBeforeEndTime),r)return t.Logger.warning(r),void t._Helpers.invokeAliasCallback(s,HTTPCodes$2.validationIssue,r);if(!t._Helpers.canLog())t._Helpers.invokeAliasCallback(s,HTTPCodes$2.loggingDisabledOrMissingAPIKey,Messages$2.InformationMessages.AbandonAliasUsers),t.Logger.verbose(Messages$2.InformationMessages.AbandonAliasUsers);else if(t._Store.webviewBridgeEnabled)t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Alias,JSON.stringify(t._Identity.IdentityRequest.convertAliasToNative(e))),t._Helpers.invokeAliasCallback(s,HTTPCodes$2.nativeIdentityRequest,"Alias request sent to native sdk");else {t.Logger.verbose(Messages$2.InformationMessages.StartingAliasRequest+": "+e.sourceMpid+" -> "+e.destinationMpid);var i=t._Identity.IdentityRequest.createAliasNetworkRequest(e);t._IdentityAPIClient.sendAliasRequest(i,s);}},/**
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
        */createAliasRequest:function createAliasRequest(e,s){try{if(!s||!e)return t.Logger.error("'destinationUser' and 'sourceUser' must both be present"),null;var r=e.getFirstSeenTime();r||t.Identity.getUsers().forEach(function(e){e.getFirstSeenTime()&&(!r||e.getFirstSeenTime()<r)&&(r=e.getFirstSeenTime());});var i=new Date().getTime()-1e3*(60*(60*(24*t._Store.SDKConfig.aliasMaxWindow))),n=e.getLastSeenTime()||new Date().getTime();//if the startTime is greater than $maxAliasWindow ago, adjust the startTime to the earliest allowed
return r<i&&(r=i,n<r&&t.Logger.warning("Source User has not been seen in the last "+t._Store.SDKConfig.maxAliasWindow+" days, Alias Request will likely fail")),{destinationMpid:s.getMPID(),sourceMpid:e.getMPID(),startTime:r,endTime:n}}catch(s){return t.Logger.error("There was a problem with creating an alias request: "+s),null}}},this.mParticleUser=function(e,s){var r=this;return {/**
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
             */setUserTag:function setUserTag(e){return t._Helpers.Validators.isValidKeyValue(e)?void this.setUserAttribute(e,null):void t.Logger.error(Messages$2.ErrorMessages.BadKey)},/**
             * Removes a user tag
             * @method removeUserTag
             * @param {String} tagName
             */removeUserTag:function removeUserTag(e){return t._Helpers.Validators.isValidKeyValue(e)?void this.removeUserAttribute(e):void t.Logger.error(Messages$2.ErrorMessages.BadKey)},/**
             * Sets a user attribute
             * @method setUserAttribute
             * @param {String} key
             * @param {String} value
             */setUserAttribute:function setUserAttribute(s,i){var n,o,d,a;if(t._SessionManager.resetSessionTimer(),t._Helpers.canLog()){if(!t._Helpers.Validators.isValidAttributeValue(i))return void t.Logger.error(Messages$2.ErrorMessages.BadAttribute);if(!t._Helpers.Validators.isValidKeyValue(s))return void t.Logger.error(Messages$2.ErrorMessages.BadKey);if(t._Store.webviewBridgeEnabled)t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetUserAttribute,JSON.stringify({key:s,value:i}));else {n=t._Persistence.getPersistence(),o=this.getAllUserAttributes();var g=t._Helpers.findKeyInObject(o,s);g?(a=!1,d=o[g],delete o[g]):a=!0,o[s]=i,n&&n[e]&&(n[e].ua=o,t._Persistence.savePersistence(n,e)),r.sendUserAttributeChangeEvent(s,i,d,a,!1,this),t._Forwarders.initForwarders(r.IdentityAPI.getCurrentUser().getUserIdentities(),t._APIClient.prepareForwardingStats),t._Forwarders.handleForwarderUserAttributes("setUserAttribute",s,i);}}},/**
             * Set multiple user attributes
             * @method setUserAttributes
             * @param {Object} user attribute object with keys of the attribute type, and value of the attribute value
             */setUserAttributes:function setUserAttributes(e){if(t._SessionManager.resetSessionTimer(),!t._Helpers.isObject(e))t.Logger.error("Must pass an object into setUserAttributes. You passed a "+_typeof(e));else if(t._Helpers.canLog())for(var s in e)e.hasOwnProperty(s)&&this.setUserAttribute(s,e[s]);},/**
             * Removes a specific user attribute
             * @method removeUserAttribute
             * @param {String} key
             */removeUserAttribute:function removeUserAttribute(s){var i,n;if(t._SessionManager.resetSessionTimer(),!t._Helpers.Validators.isValidKeyValue(s))return void t.Logger.error(Messages$2.ErrorMessages.BadKey);if(t._Store.webviewBridgeEnabled)t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.RemoveUserAttribute,JSON.stringify({key:s,value:null}));else {i=t._Persistence.getPersistence(),n=this.getAllUserAttributes();var o=t._Helpers.findKeyInObject(n,s);o&&(s=o);var d=n[s]?n[s].toString():null;delete n[s],i&&i[e]&&(i[e].ua=n,t._Persistence.savePersistence(i,e)),r.sendUserAttributeChangeEvent(s,null,d,!1,!0,this),t._Forwarders.initForwarders(r.IdentityAPI.getCurrentUser().getUserIdentities(),t._APIClient.prepareForwardingStats),t._Forwarders.handleForwarderUserAttributes("removeUserAttribute",s,null);}},/**
             * Sets a list of user attributes
             * @method setUserAttributeList
             * @param {String} key
             * @param {Array} value an array of values
             */setUserAttributeList:function setUserAttributeList(s,n){var o,d,a,g,l;if(t._SessionManager.resetSessionTimer(),!t._Helpers.Validators.isValidKeyValue(s))return void t.Logger.error(Messages$2.ErrorMessages.BadKey);if(!Array.isArray(n))return void t.Logger.error("The value you passed in to setUserAttributeList must be an array. You passed in a "+("undefined"==typeof value?"undefined":_typeof(value)));var u=n.slice();if(t._Store.webviewBridgeEnabled)t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetUserAttributeList,JSON.stringify({key:s,value:u}));else {o=t._Persistence.getPersistence(),d=this.getAllUserAttributes();var p=t._Helpers.findKeyInObject(d,s);// If the new attributeList length is different previous, then there is a change event.
// Loop through new attributes list, see if they are all in the same index as previous user attributes list
// If there are any changes, break, and immediately send a userAttributeChangeEvent with full array as a value
if(p?(g=!1,a=d[p],delete d[p]):g=!0,d[s]=u,o&&o[e]&&(o[e].ua=d,t._Persistence.savePersistence(o,e)),!a||!Array.isArray(a))l=!0;else if(n.length!==a.length)l=!0;else for(var c=0;c<n.length;c++)if(a[c]!==n[c]){l=!0;break}l&&r.sendUserAttributeChangeEvent(s,n,a,g,!1,this),t._Forwarders.initForwarders(r.IdentityAPI.getCurrentUser().getUserIdentities(),t._APIClient.prepareForwardingStats),t._Forwarders.handleForwarderUserAttributes("setUserAttribute",s,u);}},/**
             * Removes all user attributes
             * @method removeAllUserAttributes
             */removeAllUserAttributes:function removeAllUserAttributes(){var e;if(t._SessionManager.resetSessionTimer(),t._Store.webviewBridgeEnabled)t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.RemoveAllUserAttributes);else if(e=this.getAllUserAttributes(),t._Forwarders.initForwarders(r.IdentityAPI.getCurrentUser().getUserIdentities(),t._APIClient.prepareForwardingStats),e)for(var s in e)e.hasOwnProperty(s)&&t._Forwarders.handleForwarderUserAttributes("removeUserAttribute",s,null),this.removeUserAttribute(s);},/**
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
             */remove:function remove(s,r){t.Logger.warning("Deprecated function Identity.getCurrentUser().getCart().remove() will be removed in future releases");var i,n,o=-1,d=null;if(t._Store.webviewBridgeEnabled)t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.RemoveFromCart,JSON.stringify(s));else {t._SessionManager.resetSessionTimer(),n=t._Persistence.getUserProductsFromLS(e),n&&(n.forEach(function(e,t){e.Sku===s.Sku&&(o=t,d=e);}),-1<o&&(n.splice(o,1),!0===r&&t._Events.logProductActionEvent(Types.ProductActionType.RemoveFromCart,d)));i=t._Persistence.getAllUserProductsFromLS(),i[e].cp=n,t._Persistence.setCartProducts(i);}},/**
             * Clears the user's cart
             * @method clear
             * @deprecated
             */clear:function clear(){t.Logger.warning("Deprecated function Identity.getCurrentUser().getCart().clear() will be removed in future releases");var s;t._Store.webviewBridgeEnabled?t._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.ClearCart):(t._SessionManager.resetSessionTimer(),s=t._Persistence.getAllUserProductsFromLS(),s&&s[e]&&s[e].cp&&(s[e].cp=[],s[e].cp=[],t._Persistence.setCartProducts(s)));},/**
             * Returns all cart products
             * @method getCartProducts
             * @return {Array} array of cart products
             * @deprecated
             */getCartProducts:function getCartProducts(){return t.Logger.warning("Deprecated function Identity.getCurrentUser().getCart().getCartProducts() will be removed in future releases"),t._Persistence.getCartProducts(e)}}},this.parseIdentityResponse=function(r,i,n,o,d){var a,g,l,u,p=t.Identity.getUser(i),c={},y=p?p.getUserIdentities().userIdentities:{},I=t._Helpers.extend({},y);t._Store.identityCallInFlight=!1;try{if(t.Logger.verbose("Parsing \""+d+"\" identity response from server"),r.responseText&&(l=JSON.parse(r.responseText),l.hasOwnProperty("is_logged_in")&&(t._Store.isLoggedIn=l.is_logged_in)),(!p||p.getMPID()&&l.mpid&&l.mpid!==p.getMPID())&&(t._Store.mpid=l.mpid,p&&t._Persistence.setLastSeenTime(i),!t._Persistence.getFirstSeenTime(l.mpid)&&(g=!0),t._Persistence.setFirstSeenTime(l.mpid)),200===r.status){if("modify"===d)c=t._Identity.IdentityRequest.combineUserIdentities(y,o.userIdentities),t._Persistence.saveUserIdentitiesToPersistence(i,c);else {var _=s.IdentityAPI.getUser(l.mpid),v=_?_.getUserIdentities().userIdentities:{},m=t._Helpers.extend({},v);t.Logger.verbose("Successfully parsed Identity Response"),"identify"==d&&p&&l.mpid===p.getMPID()&&t._Persistence.setFirstSeenTime(l.mpid),u=t._Store.currentSessionMPIDs.indexOf(l.mpid),t._Store.sessionId&&l.mpid&&i!==l.mpid&&0>u&&t._Store.currentSessionMPIDs.push(l.mpid),-1<u&&(t._Store.currentSessionMPIDs=t._Store.currentSessionMPIDs.slice(0,u).concat(t._Store.currentSessionMPIDs.slice(u+1,t._Store.currentSessionMPIDs.length)),t._Store.currentSessionMPIDs.push(l.mpid)),t._CookieSyncManager.attemptCookieSync(i,l.mpid,g),s.checkIdentitySwap(i,l.mpid,t._Store.currentSessionMPIDs),o&&o.userIdentities&&Object.keys(o.userIdentities).length&&(c=s.IdentityRequest.combineUserIdentities(v,o.userIdentities)),t._Persistence.saveUserIdentitiesToPersistence(l.mpid,c),t._Persistence.update(),t._Persistence.findPrevCookiesBasedOnUI(o),t._Store.context=l.context||t._Store.context;}if(a=t.Identity.getCurrentUser(),o&&o.onUserAlias&&t._Helpers.Validators.isFunction(o.onUserAlias))try{t.Logger.warning("Deprecated function onUserAlias will be removed in future releases"),o.onUserAlias(p,a);}catch(s){t.Logger.error("There was an error with your onUserAlias function - "+s);}var S=t._Persistence.getPersistence();a&&(t._Persistence.storeDataInMemory(S,a.getMPID()),(!p||a.getMPID()!==p.getMPID()||p.isLoggedIn()!==a.isLoggedIn())&&t._Forwarders.initForwarders(a.getUserIdentities().userIdentities,t._APIClient.prepareForwardingStats),t._Forwarders.setForwarderUserIdentities(a.getUserIdentities().userIdentities),t._Forwarders.setForwarderOnIdentityComplete(a,d),t._Forwarders.setForwarderOnUserIdentified(a,d));var P={};for(var b in c)P[Types.IdentityType.getIdentityName(t._Helpers.parseNumber(b))]=c[b];s.sendUserIdentityChangeEvent(P,d,l.mpid,"modify"===d?I:m);}n?0===r.status?t._Helpers.invokeCallback(n,HTTPCodes$2.noHttpCoverage,l||null,a):t._Helpers.invokeCallback(n,r.status,l||null,a):l&&l.errors&&l.errors.length&&t.Logger.error("Received HTTP response code of "+r.status+" - "+l.errors[0].message),t._APIClient.processQueuedEvents();}catch(s){n&&t._Helpers.invokeCallback(n,r.status,l||null),t.Logger.error("Error parsing JSON response from Identity server: "+s);}},this.sendUserIdentityChangeEvent=function(e,r,i,n){var o,d;if(i||"modify"===r)for(var a in o=this.IdentityAPI.getUser(i),e)if(n[a]!==e[a]){var g=!n[a];d=s.createUserIdentityChange(a,e[a],n[a],g,o),t._APIClient.sendEventToServer(d);}},this.createUserIdentityChange=function(e,s,r,i,n){var o;return o=t._ServerModel.createEventObject({messageType:Types.MessageType.UserIdentityChange,userIdentityChanges:{New:{IdentityType:e,Identity:s,CreatedThisBatch:i},Old:{IdentityType:e,Identity:r,CreatedThisBatch:!1}},userInMemory:n}),o},this.sendUserAttributeChangeEvent=function(e,r,i,n,o,d){var a=s.createUserAttributeChange(e,r,i,n,o,d);a&&t._APIClient.sendEventToServer(a);},this.createUserAttributeChange=function(e,s,r,i,n,o){"undefined"==typeof r&&(r=null);var d;return s!==r&&(d=t._ServerModel.createEventObject({messageType:Types.MessageType.UserAttributeChange,userAttributeChanges:{UserAttributeName:e,New:s,Old:r,Deleted:n,IsNewAttribute:i}},o)),d};}

var CCPAPurpose=Constants.CCPAPurpose;function Consent(a){var b=this;// this function is called when consent is required to
// determine if a cookie sync should happen, or a
// forwarder should be initialized
// TODO: Refactor this method into a constructor
this.isEnabledForUserConsent=function(a,b){if(!a||!a.values||!a.values.length)return !0;if(!b)return !1;var c,d={},e=b.getConsentState();if(e){// the server hashes consent purposes in the following way:
// GDPR - '1' + purpose name
// CCPA - '2data_sale_opt_out' (there is only 1 purpose of data_sale_opt_out for CCPA)
var f=e.getGDPRConsentState();if(f)for(var g in f)f.hasOwnProperty(g)&&(c=KitFilterHelper.hashConsentPurposeConditionalForwarding("1",g),d[c]=f[g].Consented);var h=e.getCCPAConsentState();h&&(c=KitFilterHelper.hashConsentPurposeConditionalForwarding("2",CCPAPurpose),d[c]=h.Consented);}var i=a.values.some(function(a){var b=a.consentPurpose,c=a.hasConsented;return !!d.hasOwnProperty(b)&&d[b]===c});return a.includeOnMatch===i},this.createPrivacyConsent=function(b,c,d,e,f){return "boolean"==typeof b?c&&isNaN(c)?(a.Logger.error("Timestamp must be a valid number when constructing a Consent object."),null):d&&"string"!=typeof d?(a.Logger.error("Document must be a valid string when constructing a Consent object."),null):e&&"string"!=typeof e?(a.Logger.error("Location must be a valid string when constructing a Consent object."),null):f&&"string"!=typeof f?(a.Logger.error("Hardware ID must be a valid string when constructing a Consent object."),null):{Consented:b,Timestamp:c||Date.now(),ConsentDocument:d,Location:e,HardwareId:f}:(a.Logger.error("Consented boolean is required when constructing a Consent object."),null)},this.ConsentSerialization={toMinifiedJsonObject:function toMinifiedJsonObject(a){var b,c={};if(a){var d=a.getGDPRConsentState();if(d)for(var e in c.gdpr={},d)if(d.hasOwnProperty(e)){var f=d[e];c.gdpr[e]={},"boolean"==typeof f.Consented&&(c.gdpr[e].c=f.Consented),"number"==typeof f.Timestamp&&(c.gdpr[e].ts=f.Timestamp),"string"==typeof f.ConsentDocument&&(c.gdpr[e].d=f.ConsentDocument),"string"==typeof f.Location&&(c.gdpr[e].l=f.Location),"string"==typeof f.HardwareId&&(c.gdpr[e].h=f.HardwareId);}var g=a.getCCPAConsentState();g&&(c.ccpa=(b={},b[CCPAPurpose]={},b),"boolean"==typeof g.Consented&&(c.ccpa[CCPAPurpose].c=g.Consented),"number"==typeof g.Timestamp&&(c.ccpa[CCPAPurpose].ts=g.Timestamp),"string"==typeof g.ConsentDocument&&(c.ccpa[CCPAPurpose].d=g.ConsentDocument),"string"==typeof g.Location&&(c.ccpa[CCPAPurpose].l=g.Location),"string"==typeof g.HardwareId&&(c.ccpa[CCPAPurpose].h=g.HardwareId));}return c},fromMinifiedJsonObject:function fromMinifiedJsonObject(a){var c=b.createConsentState();if(a.gdpr)for(var d in a.gdpr)if(a.gdpr.hasOwnProperty(d)){var e=b.createPrivacyConsent(a.gdpr[d].c,a.gdpr[d].ts,a.gdpr[d].d,a.gdpr[d].l,a.gdpr[d].h);c.addGDPRConsentState(d,e);}if(a.ccpa&&a.ccpa.hasOwnProperty(CCPAPurpose)){var f=b.createPrivacyConsent(a.ccpa[CCPAPurpose].c,a.ccpa[CCPAPurpose].ts,a.ccpa[CCPAPurpose].d,a.ccpa[CCPAPurpose].l,a.ccpa[CCPAPurpose].h);c.setCCPAConsentState(f);}return c}},this.createConsentState=function(c){function d(a){if("string"!=typeof a)return null;var b=a.trim();return b.length?b.toLowerCase():null}/**
         * Invoke these methods on a consent state object.
         * <p>
         * Usage: const consent = mParticle.Consent.createConsentState()
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
         */function e(c,e){var f=d(c);if(!f)return a.Logger.error("Purpose must be a string."),this;if(!isObject(e))return a.Logger.error("Invoked with a bad or empty consent object."),this;var g=b.createPrivacyConsent(e.Consented,e.Timestamp,e.ConsentDocument,e.Location,e.HardwareId);return g&&(k[f]=g),this}function f(a){if(!a)k={};else if(isObject(a))for(var b in k={},a)a.hasOwnProperty(b)&&this.addGDPRConsentState(b,a[b]);return this}/**
         * Remove a GDPR Consent State to the consent state object
         *
         * @method removeGDPRConsentState
         * @param purpose [String] Data processing purpose that describes the type of processing done on the data subject’s data
         */function g(a){var b=d(a);return b?(delete k[b],this):this}/**
         * Gets the GDPR Consent State
         *
         * @method getGDPRConsentState
         * @return {Object} A GDPR Consent State
         */function h(){return Object.assign({},k)}/**
         * Sets a CCPA Consent state (has a single purpose of 'data_sale_opt_out')
         *
         * @method setCCPAConsentState
         * @param {Object} ccpaConsent CCPA Consent State
         */function i(c){if(!isObject(c))return a.Logger.error("Invoked with a bad or empty CCPA consent object."),this;var d=b.createPrivacyConsent(c.Consented,c.Timestamp,c.ConsentDocument,c.Location,c.HardwareId);return d&&(l[CCPAPurpose]=d),this}/**
         * Gets the CCPA Consent State
         *
         * @method getCCPAConsentStatensent
         * @return {Object} A CCPA Consent State
         */ /**
         * Removes CCPA from the consent state object
         *
         * @method removeCCPAConsentState
         */function j(){return delete l[CCPAPurpose],this}// TODO: Can we remove this? It is deprecated.
var k={},l={};if(c){var m=b.createConsentState();// TODO: Remove casting once `removeCCPAState` is removed;
return m.setGDPRConsentState(c.getGDPRConsentState()),m.setCCPAConsentState(c.getCCPAConsentState()),m}return {setGDPRConsentState:f,addGDPRConsentState:e,setCCPAConsentState:i,getCCPAConsentState:function a(){return l[CCPAPurpose]},getGDPRConsentState:h,removeGDPRConsentState:g,removeCCPAState:function b(){// @ts-ignore
return a.Logger.warning("removeCCPAState is deprecated and will be removed in a future release; use removeCCPAConsentState instead"),j()},removeCCPAConsentState:j}};}

/*
    TODO: Including this as a workaround because attempting to import it from
    @mparticle/data-planning-models directly creates a build error.
 */var DataPlanMatchType={ScreenView:"screen_view",CustomEvent:"custom_event",Commerce:"commerce",UserAttributes:"user_attributes",UserIdentities:"user_identities",ProductAction:"product_action",PromotionAction:"promotion_action",ProductImpression:"product_impression"},KitBlocker=/** @class */function(){function a(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r=this;// if data plan is not requested, the data plan is {document: null}
if(this.dataPlanMatchLookups={},this.blockEvents=!1,this.blockEventAttributes=!1,this.blockUserAttributes=!1,this.blockUserIdentities=!1,this.kitBlockingEnabled=!1,a&&!a.document)return void(this.kitBlockingEnabled=!1);this.kitBlockingEnabled=!0,this.mpInstance=b,this.blockEvents=null===(e=null===(d=null===(c=null===a||void 0===a?void 0:a.document)||void 0===c?void 0:c.dtpn)||void 0===d?void 0:d.blok)||void 0===e?void 0:e.ev,this.blockEventAttributes=null===(h=null===(g=null===(f=null===a||void 0===a?void 0:a.document)||void 0===f?void 0:f.dtpn)||void 0===g?void 0:g.blok)||void 0===h?void 0:h.ea,this.blockUserAttributes=null===(k=null===(j=null===(i=null===a||void 0===a?void 0:a.document)||void 0===i?void 0:i.dtpn)||void 0===j?void 0:j.blok)||void 0===k?void 0:k.ua,this.blockUserIdentities=null===(n=null===(m=null===(l=null===a||void 0===a?void 0:a.document)||void 0===l?void 0:l.dtpn)||void 0===m?void 0:m.blok)||void 0===n?void 0:n.id;var s=null===(q=null===(p=null===(o=null===a||void 0===a?void 0:a.document)||void 0===o?void 0:o.dtpn)||void 0===p?void 0:p.vers)||void 0===q?void 0:q.version_document,t=null===s||void 0===s?void 0:s.data_points;if(s)try{0<(null===t||void 0===t?void 0:t.length)&&t.forEach(function(a){return r.addToMatchLookups(a)});}catch(a){this.mpInstance.Logger.error("There was an issue with the data plan: "+a);}}return a.prototype.addToMatchLookups=function(a){var b,c,d;if(!a.match||!a.validator)return void this.mpInstance.Logger.warning("Data Plan Point is not valid' + ".concat(a));// match keys for non product custom attribute related data points
var e=this.generateMatchKey(a.match),f=this.getPlannedProperties(a.match.type,a.validator);this.dataPlanMatchLookups[e]=f,((null===(b=null===a||void 0===a?void 0:a.match)||void 0===b?void 0:b.type)===DataPlanMatchType.ProductImpression||(null===(c=null===a||void 0===a?void 0:a.match)||void 0===c?void 0:c.type)===DataPlanMatchType.ProductAction||(null===(d=null===a||void 0===a?void 0:a.match)||void 0===d?void 0:d.type)===DataPlanMatchType.PromotionAction)&&(e=this.generateProductAttributeMatchKey(a.match),f=this.getProductProperties(a.match.type,a.validator),this.dataPlanMatchLookups[e]=f);},a.prototype.generateMatchKey=function(a){var b=a.criteria||"";switch(a.type){case DataPlanMatchType.CustomEvent:var c=b;return [DataPlanMatchType.CustomEvent,c.custom_event_type,c.event_name].join(":");case DataPlanMatchType.ScreenView:return [DataPlanMatchType.ScreenView,"",b.screen_name].join(":");case DataPlanMatchType.ProductAction:return [a.type,b.action].join(":");case DataPlanMatchType.PromotionAction:return [a.type,b.action].join(":");case DataPlanMatchType.ProductImpression:return [a.type,b.action].join(":");case DataPlanMatchType.UserIdentities:case DataPlanMatchType.UserAttributes:return [a.type].join(":");default:return null}},a.prototype.generateProductAttributeMatchKey=function(a){var b=a.criteria||"";switch(a.type){case DataPlanMatchType.ProductAction:return [a.type,b.action,"ProductAttributes"].join(":");case DataPlanMatchType.PromotionAction:return [a.type,b.action,"ProductAttributes"].join(":");case DataPlanMatchType.ProductImpression:return [a.type,"ProductAttributes"].join(":");default:return null}},a.prototype.getPlannedProperties=function(a,b){var c,d,e,f,g,h,i,j,k,l;switch(a){case DataPlanMatchType.CustomEvent:case DataPlanMatchType.ScreenView:case DataPlanMatchType.ProductAction:case DataPlanMatchType.PromotionAction:case DataPlanMatchType.ProductImpression:if(k=null===(f=null===(e=null===(d=null===(c=null===b||void 0===b?void 0:b.definition)||void 0===c?void 0:c.properties)||void 0===d?void 0:d.data)||void 0===e?void 0:e.properties)||void 0===f?void 0:f.custom_attributes,k){if(!0===k.additionalProperties||void 0===k.additionalProperties)return !0;for(var m,n={},o=0,p=Object.keys(k.properties);o<p.length;o++)m=p[o],n[m]=!0;return n}return !1!==(null===(i=null===(h=null===(g=null===b||void 0===b?void 0:b.definition)||void 0===g?void 0:g.properties)||void 0===h?void 0:h.data)||void 0===i?void 0:i.additionalProperties)||{};case DataPlanMatchType.UserAttributes:case DataPlanMatchType.UserIdentities:if(l=null===(j=null===b||void 0===b?void 0:b.definition)||void 0===j?void 0:j.additionalProperties,!0===l||void 0===l)return !0;for(var m,n={},q=b.definition.properties,r=0,s=Object.keys(q);r<s.length;r++)m=s[r],n[m]=!0;return n;default:return null}},a.prototype.getProductProperties=function(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v;switch(a){case DataPlanMatchType.ProductImpression://product item attributes
if(v=null===(l=null===(k=null===(j=null===(i=null===(h=null===(g=null===(f=null===(e=null===(d=null===(c=null===b||void 0===b?void 0:b.definition)||void 0===c?void 0:c.properties)||void 0===d?void 0:d.data)||void 0===e?void 0:e.properties)||void 0===f?void 0:f.product_impressions)||void 0===g?void 0:g.items)||void 0===h?void 0:h.properties)||void 0===i?void 0:i.products)||void 0===j?void 0:j.items)||void 0===k?void 0:k.properties)||void 0===l?void 0:l.custom_attributes,!1===(null===v||void 0===v?void 0:v.additionalProperties)){for(var w,x={},y=0,z=Object.keys(null===v||void 0===v?void 0:v.properties);y<z.length;y++)w=z[y],x[w]=!0;return x}return !0;case DataPlanMatchType.ProductAction:case DataPlanMatchType.PromotionAction://product item attributes
if(v=null===(u=null===(t=null===(s=null===(r=null===(q=null===(p=null===(o=null===(n=null===(m=null===b||void 0===b?void 0:b.definition)||void 0===m?void 0:m.properties)||void 0===n?void 0:n.data)||void 0===o?void 0:o.properties)||void 0===p?void 0:p.product_action)||void 0===q?void 0:q.properties)||void 0===r?void 0:r.products)||void 0===s?void 0:s.items)||void 0===t?void 0:t.properties)||void 0===u?void 0:u.custom_attributes,v&&!1===v.additionalProperties){for(var w,x={},A=0,B=Object.keys(null===v||void 0===v?void 0:v.properties);A<B.length;A++)w=B[A],x[w]=!0;return x}return !0;default:return null}},a.prototype.getMatchKey=function(a){switch(a.event_type){case dist.EventTypeEnum.screenView:var b=a;return b.data?["screen_view","",b.data.screen_name].join(":"):null;case dist.EventTypeEnum.commerceEvent:var c=a,d=[];if(c&&c.data){var e=c.data,f=e.product_action,g=e.product_impressions,h=e.promotion_action;f?(d.push(DataPlanMatchType.ProductAction),d.push(f.action)):h?(d.push(DataPlanMatchType.PromotionAction),d.push(h.action)):g&&d.push(DataPlanMatchType.ProductImpression);}return d.join(":");case dist.EventTypeEnum.customEvent:var i=a;return i.data?["custom_event",i.data.custom_event_type,i.data.event_name].join(":"):null;default:return null}},a.prototype.getProductAttributeMatchKey=function(a){switch(a.event_type){case dist.EventTypeEnum.commerceEvent:var b=[],c=a.data,d=c.product_action,e=c.product_impressions,f=c.promotion_action;return d?(b.push(DataPlanMatchType.ProductAction),b.push(d.action),b.push("ProductAttributes")):f?(b.push(DataPlanMatchType.PromotionAction),b.push(f.action),b.push("ProductAttributes")):e&&(b.push(DataPlanMatchType.ProductImpression),b.push("ProductAttributes")),b.join(":");default:return null}},a.prototype.createBlockedEvent=function(a){/*
            return a transformed event based on event/event attributes,
            then product attributes if applicable, then user attributes,
            then the user identities
        */try{return a&&(a=this.transformEventAndEventAttributes(a)),a&&a.EventDataType===Types.MessageType.Commerce&&(a=this.transformProductAttributes(a)),a&&(a=this.transformUserAttributes(a),a=this.transformUserIdentities(a)),a}catch(b){return a}},a.prototype.transformEventAndEventAttributes=function(a){var b=__assign({},a),c=convertEvent(b),d=this.getMatchKey(c),e=this.dataPlanMatchLookups[d];if(this.blockEvents&&!e)/*
                If the event is not planned, it doesn't exist in dataPlanMatchLookups
                and should be blocked (return null to not send anything to forwarders)
            */return null;if(this.blockEventAttributes){/*
                matchedEvent is set to `true` if additionalProperties is `true`
                otherwise, delete attributes that exist on event.EventAttributes
                that aren't on
            */if(!0===e)return b;if(e){for(var f,g=0,h=Object.keys(b.EventAttributes);g<h.length;g++)f=h[g],e[f]||delete b.EventAttributes[f];return b}return b}return b},a.prototype.transformProductAttributes=function(a){function b(a,b){b.forEach(function(b){for(var c,d=0,e=Object.keys(b.Attributes);d<e.length;d++)c=e[d],a[c]||delete b.Attributes[c];});}var c,d=__assign({},a),e=convertEvent(d),f=this.getProductAttributeMatchKey(e),g=this.dataPlanMatchLookups[f];if(this.blockEvents&&!g)/*
                If the event is not planned, it doesn't exist in dataPlanMatchLookups
                and should be blocked (return null to not send anything to forwarders)
            */return null;if(this.blockEventAttributes){/*
                matchedEvent is set to `true` if additionalProperties is `true`
                otherwise, delete attributes that exist on event.EventAttributes
                that aren't on
            */if(!0===g)return d;if(g){switch(a.EventCategory){case Types.CommerceEventType.ProductImpression:d.ProductImpressions.forEach(function(a){b(g,null===a||void 0===a?void 0:a.ProductList);});break;case Types.CommerceEventType.ProductPurchase:b(g,null===(c=d.ProductAction)||void 0===c?void 0:c.ProductList);break;default:this.mpInstance.Logger.warning("Product Not Supported ");}return d}return d}return d},a.prototype.transformUserAttributes=function(a){var b=__assign({},a);if(this.blockUserAttributes){/*
                If the user attribute is not found in the matchedAttributes
                then remove it from event.UserAttributes as it is blocked
            */var c=this.dataPlanMatchLookups.user_attributes;if(this.mpInstance._Helpers.isObject(c))for(var d,e=0,f=Object.keys(b.UserAttributes);e<f.length;e++)d=f[e],c[d]||delete b.UserAttributes[d];}return b},a.prototype.isAttributeKeyBlocked=function(a){/* used when an attribute is added to the user */if(!this.blockUserAttributes)return !1;if(this.blockUserAttributes){var b=this.dataPlanMatchLookups.user_attributes;if(!0===b)return !1;if(!b[a])return !0}return !1},a.prototype.isIdentityBlocked=function(a){/* used when an attribute is added to the user */if(!this.blockUserIdentities)return !1;if(this.blockUserIdentities){var b=this.dataPlanMatchLookups.user_identities;if(!0===b)return !1;if(!b[a])return !0}else return !1;return !1},a.prototype.transformUserIdentities=function(a){var b,c=this,d=__assign({},a);/*
            If the user identity is not found in matchedIdentities
            then remove it from event.UserIdentities as it is blocked.
            event.UserIdentities is of type [{Identity: 'id1', Type: 7}, ...]
            and so to compare properly in matchedIdentities, each Type needs
            to be converted to an identityName
        */if(this.blockUserIdentities){var e=this.dataPlanMatchLookups.user_identities;this.mpInstance._Helpers.isObject(e)&&(null===(b=null===d||void 0===d?void 0:d.UserIdentities)||void 0===b?void 0:b.length)&&d.UserIdentities.forEach(function(a,b){var f=Types.IdentityType.getIdentityName(c.mpInstance._Helpers.parseNumber(a.Type));e[f]||d.UserIdentities.splice(b,1);});}return d},a}();

function ConfigAPIClient(){this.getSDKConfiguration=function(a,b,c,d){var e;try{var f=function xhrCallback(){4===g.readyState&&(200===g.status?(b=d._Helpers.extend({},b,JSON.parse(g.responseText)),c(a,b,d),d.Logger.verbose("Successfully received configuration from server")):(c(a,b,d),d.Logger.verbose("Issue with receiving configuration from server, received HTTP Code of "+g.status)));},g=d._Helpers.createXHR(f);e="https://"+d._Store.SDKConfig.configUrl+a+"/config?env=",e+=b.isDevelopmentMode?"1":"0";var h=b.dataPlan;h&&(h.planId&&(e=e+"&plan_id="+h.planId||""),h.planVersion&&(e=e+"&plan_version="+h.planVersion||"")),g&&(g.open("get",e),g.send(null));}catch(f){c(a,b,d),d.Logger.error("Error getting forwarder configuration from mParticle servers.");}};}

var HTTPCodes$1=Constants.HTTPCodes,Messages$1=Constants.Messages;function IdentityAPIClient(a){this.sendAliasRequest=function(b,c){var d,e=function xhrCallback(){if(4===d.readyState){//only parse error messages from failing requests
if(a.Logger.verbose("Received "+d.statusText+" from server"),200!==d.status&&202!==d.status&&d.responseText){var b=JSON.parse(d.responseText);if(b.hasOwnProperty("message")){var e=b.message;return void a._Helpers.invokeAliasCallback(c,d.status,e)}}a._Helpers.invokeAliasCallback(c,d.status);}};if(a.Logger.verbose(Messages$1.InformationMessages.SendAliasHttp),d=a._Helpers.createXHR(e),d)try{d.open("post",a._Helpers.createServiceUrl(a._Store.SDKConfig.aliasUrl,a._Store.devToken)+"/Alias"),d.send(JSON.stringify(b));}catch(b){a._Helpers.invokeAliasCallback(c,HTTPCodes$1.noHttpCoverage,b),a.Logger.error("Error sending alias request to mParticle servers. "+b);}},this.sendIdentityRequest=function(b,c,d,e,f,g){var h,i,j=function xhrCallback(){4===h.readyState&&(a.Logger.verbose("Received "+h.statusText+" from server"),f(h,i,d,e,c));};if(a.Logger.verbose(Messages$1.InformationMessages.SendIdentityBegin),!b)return void a.Logger.error(Messages$1.ErrorMessages.APIRequestEmpty);if(a.Logger.verbose(Messages$1.InformationMessages.SendIdentityHttp),h=a._Helpers.createXHR(j),h)try{a._Store.identityCallInFlight?a._Helpers.invokeCallback(d,HTTPCodes$1.activeIdentityRequest,"There is currently an Identity request processing. Please wait for this to return before requesting again"):(i=g||null,"modify"===c?h.open("post",a._Helpers.createServiceUrl(a._Store.SDKConfig.identityUrl)+g+"/"+c):h.open("post",a._Helpers.createServiceUrl(a._Store.SDKConfig.identityUrl)+c),h.setRequestHeader("Content-Type","application/json"),h.setRequestHeader("x-mp-key",a._Store.devToken),a._Store.identityCallInFlight=!0,h.send(JSON.stringify(b)));}catch(b){a._Store.identityCallInFlight=!1,a._Helpers.invokeCallback(d,HTTPCodes$1.noHttpCoverage,b),a.Logger.error("Error sending identity request to servers with status code "+h.status+" - "+b);}};}

var Messages=Constants.Messages,HTTPCodes=Constants.HTTPCodes;/**
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
     * Returns the current mParticle environment setting
     * @method getEnvironment
     * @returns {String} mParticle environment setting
     */ /**
     * Returns the mParticle SDK version number
     * @method getVersion
     * @return {String} mParticle SDK version number
     */ /**
     * Sets the app version
     * @method setAppVersion
     * @param {String} version version number
     */ /**
     * Sets the device id
     * @method setDeviceId
     * @param {String} name device ID (UUIDv4-formatted string)
     */ /**
     * Returns a boolean for whether or not the SDKhas been fully initialized
     * @method isInitialized
     * @return {Boolean} a boolean for whether or not the SDK has been fully initialized
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
     * @param {Number} [eventType] The eventType as seen [here](http://docs.mparticle.com/developers/sdk/web/event-tracking#event-type)
     * @param {Object} [eventInfo] Attributes for the event
     */ /**
     * Logs `submit` events
     * @method logForm
     * @param {String} selector The selector to add the event handler to (ex. #search-event)
     * @param {String} [eventName] The name of the event
     * @param {Number} [eventType] The eventType as seen [here](http://docs.mparticle.com/developers/sdk/web/event-tracking#event-type)
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
    */ // Internal use only. Used by our wrapper SDKs to identify themselves during initialization.
this._instanceName=a,this._NativeSdkHelpers=new NativeSdkHelpers(this),this._SessionManager=new SessionManager(this),this._Persistence=new _Persistence(this),this._Helpers=new Helpers(this),this._Events=new Events(this),this._CookieSyncManager=new cookieSyncManager(this),this._ServerModel=new ServerModel(this),this._Ecommerce=new Ecommerce(this),this._ForwardingStatsUploader=new forwardingStatsUploader(this),this._Consent=new Consent(this),this._IdentityAPIClient=new IdentityAPIClient(this),this._preInit={readyQueue:[],integrationDelays:{},forwarderConstructors:[]},this.IdentityType=Types.IdentityType,this.EventType=Types.EventType,this.CommerceEventType=Types.CommerceEventType,this.PromotionType=Types.PromotionActionType,this.ProductActionType=Types.ProductActionType,this._Identity=new Identity(this),this.Identity=this._Identity.IdentityAPI,this.generateHash=this._Helpers.generateHash,this.getDeviceId=this._Persistence.getDeviceId,"undefined"!=typeof window&&window.mParticle&&window.mParticle.config&&window.mParticle.config.hasOwnProperty("rq")&&(this._preInit.readyQueue=window.mParticle.config.rq),this.init=function(a,b){// config code - Fetch config when requestConfig = true, otherwise, proceed with SDKInitialization
// Since fetching the configuration is asynchronous, we must pass completeSDKInitialization
// to it for it to be run after fetched
return b||console.warn("You did not pass a config object to init(). mParticle will not initialize properly"),runPreConfigFetchInitialization(this,a,b),b?void(!b.hasOwnProperty("requestConfig")||b.requestConfig?new ConfigAPIClient().getSDKConfiguration(a,b,completeSDKInitialization,this):completeSDKInitialization(a,b,this)):void console.error("No config available on the window, please pass a config object to mParticle.init()")},this.setLogLevel=function(a){b.Logger.setLogLevel(a);},this.reset=function(a){try{a._Persistence.resetPersistence(),a._Store&&delete a._Store;}catch(a){console.error("Cannot reset mParticle",a);}},this._resetForTests=function(a,b,c){c._Store&&delete c._Store,c._Store=new Store(a,c),c._Store.isLocalStorageAvailable=c._Persistence.determineLocalStorageAvailability(window.localStorage),c._Events.stopTracking(),b||c._Persistence.resetPersistence(),c._Persistence.forwardingStatsBatches.uploadsTable={},c._Persistence.forwardingStatsBatches.forwardingStatsEventQueue=[],c._preInit={readyQueue:[],pixelConfigurations:[],integrationDelays:{},forwarderConstructors:[],isDevelopmentMode:!1};},this.ready=function(a){b.isInitialized()&&"function"==typeof a?a():b._preInit.readyQueue.push(a);},this.getEnvironment=function(){return b._Store.SDKConfig.isDevelopmentMode?Types.Environment.Development:Types.Environment.Production},this.getVersion=function(){return Constants.sdkVersion},this.setAppVersion=function(a){var c=queueIfNotInitialized(function(){b.setAppVersion(a);},b);c||(b._Store.SDKConfig.appVersion=a,b._Persistence.update());},this.setDeviceId=function(a){var c=queueIfNotInitialized(function(){b.setDeviceId(a);},b);c||this._Persistence.setDeviceId(a);},this.isInitialized=function(){return !!b._Store&&b._Store.isInitialized},this.getAppName=function(){return b._Store.SDKConfig.appName},this.setAppName=function(a){var c=queueIfNotInitialized(function(){b.setAppName(a);},b);c||(b._Store.SDKConfig.appName=a);},this.getAppVersion=function(){return b._Store.SDKConfig.appVersion},this.stopTrackingLocation=function(){b._SessionManager.resetSessionTimer(),b._Events.stopTracking();},this.startTrackingLocation=function(a){b._Helpers.Validators.isFunction(a)||b.Logger.warning("Warning: Location tracking is triggered, but not including a callback into the `startTrackingLocation` may result in events logged too quickly and not being associated with a location."),b._SessionManager.resetSessionTimer(),b._Events.startTracking(a);},this.setPosition=function(a,c){var d=queueIfNotInitialized(function(){b.setPosition(a,c);},b);d||(b._SessionManager.resetSessionTimer(),"number"==typeof a&&"number"==typeof c?b._Store.currentPosition={lat:a,lng:c}:b.Logger.error("Position latitude and/or longitude must both be of type number"));},this.startNewSession=function(){b._SessionManager.startNewSession();},this.endSession=function(){// Sends true as an over ride vs when endSession is called from the setInterval
b._SessionManager.endSession(!0);},this.logBaseEvent=function(a,c){var d=queueIfNotInitialized(function(){b.logBaseEvent(a,c);},b);if(!d)return (b._SessionManager.resetSessionTimer(),"string"!=typeof a.name)?void b.Logger.error(Messages.ErrorMessages.EventNameInvalidType):(a.eventType||(a.eventType=Types.EventType.Unknown),b._Helpers.canLog()?void b._Events.logEvent(a,c):void b.Logger.error(Messages.ErrorMessages.LoggingDisabled))},this.logEvent=function(a,c,d,e,f){var g=queueIfNotInitialized(function(){b.logEvent(a,c,d,e,f);},b);if(!g)return (b._SessionManager.resetSessionTimer(),"string"!=typeof a)?void b.Logger.error(Messages.ErrorMessages.EventNameInvalidType):(c||(c=Types.EventType.Unknown),b._Helpers.isEventType(c)?b._Helpers.canLog()?void b._Events.logEvent({messageType:Types.MessageType.PageEvent,name:a,data:d,eventType:c,customFlags:e},f):void b.Logger.error(Messages.ErrorMessages.LoggingDisabled):void b.Logger.error("Invalid event type: "+c+", must be one of: \n"+JSON.stringify(Types.EventType)))},this.logError=function(a,c){var d=queueIfNotInitialized(function(){b.logError(a,c);},b);if(!d&&(b._SessionManager.resetSessionTimer(),!!a)){"string"==typeof a&&(a={message:a});var e={m:a.message?a.message:a,s:"Error",t:a.stack||null};if(c){var f=b._Helpers.sanitizeAttributes(c,e.m);for(var g in f)e[g]=f[g];}b._Events.logEvent({messageType:Types.MessageType.CrashReport,name:a.name?a.name:"Error",data:e,eventType:Types.EventType.Other});}},this.logLink=function(a,c,d,e){b._Events.addEventHandler("click",a,c,e,d);},this.logForm=function(a,c,d,e){b._Events.addEventHandler("submit",a,c,e,d);},this.logPageView=function(a,c,d,e){var f=queueIfNotInitialized(function(){b.logPageView(a,c,d,e);},b);if(!f){if(b._SessionManager.resetSessionTimer(),b._Helpers.canLog()){if(b._Helpers.Validators.isStringOrNumber(a)||(a="PageView"),!c)c={hostname:window.location.hostname,title:window.document.title};else if(!b._Helpers.isObject(c))return void b.Logger.error("The attributes argument must be an object. A "+_typeof(c)+" was entered. Please correct and retry.");if(d&&!b._Helpers.isObject(d))return void b.Logger.error("The customFlags argument must be an object. A "+_typeof(d)+" was entered. Please correct and retry.")}b._Events.logEvent({messageType:Types.MessageType.PageView,name:a,data:c,eventType:Types.EventType.Unknown,customFlags:d},e);}},this.upload=function(){b._Helpers.canLog()&&(b._Store.webviewBridgeEnabled?b._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Upload):b._APIClient.uploader.prepareAndUpload(!1,!1));},this.Consent={/**
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
         */setCurrencyCode:function setCurrencyCode(a){var c=queueIfNotInitialized(function(){b.eCommerce.setCurrencyCode(a);},b);return c?void 0:"string"==typeof a?void(b._SessionManager.resetSessionTimer(),b._Store.currencyCode=a):void b.Logger.error("Code must be a string")},/**
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
         */logProductAction:function logProductAction(a,c,d,e,f,g){var h=queueIfNotInitialized(function(){b.eCommerce.logProductAction(a,c,d,e,f,g);},b);h||(b._SessionManager.resetSessionTimer(),b._Events.logProductActionEvent(a,c,d,e,f,g));},/**
         * Logs a product purchase
         * @for mParticle.eCommerce
         * @method logPurchase
         * @param {Object} transactionAttributes transactionAttributes object
         * @param {Object} product the product being purchased
         * @param {Boolean} [clearCart] boolean to clear the cart after logging or not. Defaults to false
         * @param {Object} [attrs] other attributes related to the product purchase
         * @param {Object} [customFlags] Custom flags for the event
         * @deprecated
         */logPurchase:function logPurchase(a,c,d,e,f){return b.Logger.warning("mParticle.logPurchase is deprecated, please use mParticle.logProductAction instead"),b._Store.isInitialized?a&&c?void(b._SessionManager.resetSessionTimer(),b._Events.logPurchaseEvent(a,c,e,f)):void b.Logger.error(Messages.ErrorMessages.BadLogPurchase):void b.ready(function(){b.eCommerce.logPurchase(a,c,d,e,f);})},/**
         * Logs a product promotion
         * @for mParticle.eCommerce
         * @method logPromotion
         * @param {Number} type the promotion type as found [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/src/types.js#L275-L279)
         * @param {Object} promotion promotion object
         * @param {Object} [attrs] boolean to clear the cart after logging or not
         * @param {Object} [customFlags] Custom flags for the event
         * @param {Object} [eventOptions] For Event-level Configuration Options
         */logPromotion:function logPromotion(a,c,d,e,f){var g=queueIfNotInitialized(function(){b.eCommerce.logPromotion(a,c,d,e,f);},b);g||(b._SessionManager.resetSessionTimer(),b._Events.logPromotionEvent(a,c,d,e,f));},/**
         * Logs a product impression
         * @for mParticle.eCommerce
         * @method logImpression
         * @param {Object} impression product impression object
         * @param {Object} attrs attributes related to the impression log
         * @param {Object} [customFlags] Custom flags for the event
         * @param {Object} [eventOptions] For Event-level Configuration Options
         */logImpression:function logImpression(a,c,d,e){var f=queueIfNotInitialized(function(){b.eCommerce.logImpression(a,c,d,e);},b);f||(b._SessionManager.resetSessionTimer(),b._Events.logImpressionEvent(a,c,d,e));},/**
         * Logs a refund
         * @for mParticle.eCommerce
         * @method logRefund
         * @param {Object} transactionAttributes transaction attributes related to the refund
         * @param {Object} product product being refunded
         * @param {Boolean} [clearCart] boolean to clear the cart after refund is logged. Defaults to false.
         * @param {Object} [attrs] attributes related to the refund
         * @param {Object} [customFlags] Custom flags for the event
         * @deprecated
         */logRefund:function logRefund(a,c,d,e,f){return b.Logger.warning("mParticle.logRefund is deprecated, please use mParticle.logProductAction instead"),b._Store.isInitialized?void(b._SessionManager.resetSessionTimer(),b._Events.logRefundEvent(a,c,e,f)):void b.ready(function(){b.eCommerce.logRefund(a,c,d,e,f);})},expandCommerceEvent:function expandCommerceEvent(a){return b._Ecommerce.expandCommerceEvent(a)}},this.setSessionAttribute=function(a,c){var d=queueIfNotInitialized(function(){b.setSessionAttribute(a,c);},b);if(!d&&b._Helpers.canLog())// Logs to cookie
// And logs to in-memory object
// Example: mParticle.setSessionAttribute('location', '33431');
{if(!b._Helpers.Validators.isValidAttributeValue(c))return void b.Logger.error(Messages.ErrorMessages.BadAttribute);if(!b._Helpers.Validators.isValidKeyValue(a))return void b.Logger.error(Messages.ErrorMessages.BadKey);if(b._Store.webviewBridgeEnabled)b._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetSessionAttribute,JSON.stringify({key:a,value:c}));else {var e=b._Helpers.findKeyInObject(b._Store.sessionAttributes,a);e&&(a=e),b._Store.sessionAttributes[a]=c,b._Persistence.update(),b._Forwarders.applyToForwarders("setSessionAttribute",[a,c]);}}},this.setOptOut=function(a){var c=queueIfNotInitialized(function(){b.setOptOut(a);},b);c||(b._SessionManager.resetSessionTimer(),b._Store.isEnabled=!a,b._Events.logOptOut(),b._Persistence.update(),b._Store.activeForwarders.length&&b._Store.activeForwarders.forEach(function(c){if(c.setOptOut){var d=c.setOptOut(a);d&&b.Logger.verbose(d);}}));},this.setIntegrationAttribute=function(a,c){var d=queueIfNotInitialized(function(){b.setIntegrationAttribute(a,c);},b);if(!d){if("number"!=typeof a)return void b.Logger.error("integrationId must be a number");if(null===c)b._Store.integrationAttributes[a]={};else {if(!b._Helpers.isObject(c))return void b.Logger.error("Attrs must be an object with keys and values. You entered a "+_typeof(c));if(0===Object.keys(c).length)b._Store.integrationAttributes[a]={};else for(var e in c)if("string"!=typeof e){b.Logger.error("Keys must be strings, you entered a "+_typeof(e));continue}else if("string"==typeof c[e])b._Helpers.isObject(b._Store.integrationAttributes[a])?b._Store.integrationAttributes[a][e]=c[e]:(b._Store.integrationAttributes[a]={},b._Store.integrationAttributes[a][e]=c[e]);else {b.Logger.error("Values for integration attributes must be strings. You entered a "+_typeof(c[e]));continue}}b._Persistence.update();}},this.getIntegrationAttributes=function(a){return b._Store.integrationAttributes[a]?b._Store.integrationAttributes[a]:{}},this.addForwarder=function(a){b._preInit.forwarderConstructors.push(a);},this.configurePixel=function(a){b._Forwarders.configurePixel(a);},this._getActiveForwarders=function(){return b._Store.activeForwarders},this._getIntegrationDelays=function(){return b._preInit.integrationDelays},this._setIntegrationDelay=function(a,c){// If the integration delay is set to true, no further action needed
if(b._preInit.integrationDelays[a]=c,!0!==c){// If the integration delay is set to false, check to see if there are any
// other integration delays set to true.  It not, process the queued events/.
var d=Object.keys(b._preInit.integrationDelays);if(0!==d.length){var e=d.some(function(a){return !0===b._preInit.integrationDelays[a]});e||b._APIClient.processQueuedEvents();}}},this._setWrapperSDKInfo=function(a,c){var d=queueIfNotInitialized(function(){b._setWrapperSDKInfo(a,c);},b);d||(b._Store.wrapperSDKInfo===void 0||!b._Store.wrapperSDKInfo.isInfoSet)&&(b._Store.wrapperSDKInfo={name:a,version:c,isInfoSet:!0});};}// Some (server) config settings need to be returned before they are set on SDKConfig in a self hosted environment
function completeSDKInitialization(a,b,c){var d=createKitBlocker(b,c);if(c._APIClient=new APIClient(c,d),c._Forwarders=new Forwarders(c,d),b.flags&&b.flags.hasOwnProperty(Constants.FeatureFlags.EventBatchingIntervalMillis)&&(c._Store.SDKConfig.flags[Constants.FeatureFlags.EventBatchingIntervalMillis]=b.flags[Constants.FeatureFlags.EventBatchingIntervalMillis]),c._Store.storageName=c._Helpers.createMainStorageName(b.workspaceToken),c._Store.prodStorageName=c._Helpers.createProductStorageName(b.workspaceToken),b.hasOwnProperty("workspaceToken")?c._Store.SDKConfig.workspaceToken=b.workspaceToken:c.Logger.warning("You should have a workspaceToken on your config object for security purposes."),b.hasOwnProperty("requiredWebviewBridgeName")?c._Store.SDKConfig.requiredWebviewBridgeName=b.requiredWebviewBridgeName:b.hasOwnProperty("workspaceToken")&&(c._Store.SDKConfig.requiredWebviewBridgeName=b.workspaceToken),c._Store.webviewBridgeEnabled=c._NativeSdkHelpers.isWebviewEnabled(c._Store.SDKConfig.requiredWebviewBridgeName,c._Store.SDKConfig.minWebviewBridgeVersion),c._Store.configurationLoaded=!0,c._Store.webviewBridgeEnabled||c._Persistence.initializeStorage(),c._Store.webviewBridgeEnabled)c._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetSessionAttribute,JSON.stringify({key:"$src_env",value:"webview"})),a&&c._NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetSessionAttribute,JSON.stringify({key:"$src_key",value:a}));else {var e;// If no initialIdentityRequest is passed in, we set the user identities to what is currently in cookies for the identify request
if(c._Helpers.isObject(c._Store.SDKConfig.identifyRequest)&&c._Helpers.isObject(c._Store.SDKConfig.identifyRequest.userIdentities)&&0===Object.keys(c._Store.SDKConfig.identifyRequest.userIdentities).length||!c._Store.SDKConfig.identifyRequest){var f={};if(e=c.Identity.getCurrentUser(),e){var g=e.getUserIdentities().userIdentities||{};for(var h in g)g.hasOwnProperty(h)&&(f[h]=g[h]);}c._Store.SDKConfig.identifyRequest={userIdentities:f};}e=c.Identity.getCurrentUser(),c._Helpers.getFeatureFlag(Constants.FeatureFlags.ReportBatching)&&c._ForwardingStatsUploader.startForwardingStatsTimer(),c._Forwarders.processForwarders(b,c._APIClient.prepareForwardingStats),c._Forwarders.processPixelConfigs(b),c._SessionManager.initialize(),c._Events.logAST(),!c._Store.identifyCalled&&c._Store.SDKConfig.identityCallback&&e&&e.getMPID()&&c._Store.SDKConfig.identityCallback({httpCode:HTTPCodes.activeSession,getUser:function getUser(){return c._Identity.mParticleUser(e.getMPID())},getPreviousUser:function getPreviousUser(){var a=c.Identity.getUsers(),b=a.shift();return b&&e&&b.getMPID()===e.getMPID()&&(b=a.shift()),b||null},body:{mpid:e.getMPID(),is_logged_in:c._Store.isLoggedIn,matched_identities:e.getUserIdentities().userIdentities,context:null,is_ephemeral:!1}});}c._Store.isInitialized=!0,c._preInit.readyQueue&&c._preInit.readyQueue.length&&(c._preInit.readyQueue.forEach(function(a){c._Helpers.Validators.isFunction(a)?a():Array.isArray(a)&&processPreloadedItem(a,c);}),c._preInit.readyQueue=[]),c._Store.isFirstRun&&(c._Store.isFirstRun=!1);}function createKitBlocker(a,b){var c,d,e,f;/*  There are three ways a data plan object for blocking can be passed to the SDK:
            1. Manually via config.dataPlanOptions (this takes priority)
            If not passed in manually, we user the server provided via either
            2. Snippet via /mparticle.js endpoint (config.dataPlan.document)
            3. Self hosting via /config endpoint (config.dataPlanResult)
    */return a.dataPlanOptions&&(b.Logger.verbose("Customer provided data plan found"),f=a.dataPlanOptions,d={document:{dtpn:{vers:f.dataPlanVersion,blok:{ev:f.blockEvents,ea:f.blockEventAttributes,ua:f.blockUserAttributes,id:f.blockUserIdentities}}}}),d||(a.dataPlan&&a.dataPlan.document?a.dataPlan.document.error_message?e=a.dataPlan.document.error_message:(b.Logger.verbose("Data plan found from mParticle.js"),d=a.dataPlan):a.dataPlanResult&&(a.dataPlanResult.error_message?e=a.dataPlanResult.error_message:(b.Logger.verbose("Data plan found from /config"),d={document:a.dataPlanResult}))),e&&b.Logger.error(e),d&&(c=new KitBlocker(d,b)),c}function runPreConfigFetchInitialization(a,b,c){a.Logger=new Logger(c),a._Store=new Store(c,a),window.mParticle.Store=a._Store,a._Store.devToken=b||null,a.Logger.verbose(Messages.InformationMessages.StartingInitialization);// Check to see if localStorage is available before main configuration runs
// since we will need this for the current implementation of user persistence
// TODO: Refactor this when we refactor User Identity Persistence
try{a._Store.isLocalStorageAvailable=a._Persistence.determineLocalStorageAvailability(window.localStorage);}catch(b){a.Logger.warning("localStorage is not available, using cookies if available"),a._Store.isLocalStorageAvailable=!1;}}function processPreloadedItem(a,b){var c=a,d=c.splice(0,1)[0];// if the first argument is a method on the base mParticle object, run it
if(mParticle[c[0]])mParticle[d].apply(this,c);else {var e=d.split(".");try{for(var f,g=mParticle,h=0;h<e.length;h++)f=e[h],g=g[f];g.apply(this,c);}catch(a){b.Logger.verbose("Unable to compute proper mParticle function "+a);}}}function queueIfNotInitialized(a,b){return !b.isInitialized()&&(b.ready(function(){a();}),!0)}

// This file is used ONLY for the mParticle ESLint plugin. It should NOT be used otherwise!
var mockFunction=function(){return null},_BatchValidator=/** @class */function(){function a(){}return a.prototype.getMPInstance=function(){return {// Certain Helper, Store, and Identity properties need to be mocked to be used in the `returnBatch` method
_Helpers:{sanitizeAttributes:window.mParticle.getInstance()._Helpers.sanitizeAttributes,generateHash:function generateHash(){return "mockHash"},generateUniqueId:function generateUniqueId(){return "mockId"},extend:window.mParticle.getInstance()._Helpers.extend,createServiceUrl:mockFunction,parseNumber:mockFunction,isObject:mockFunction,returnConvertedBoolean:mockFunction,Validators:null},_resetForTests:mockFunction,_APIClient:null,MPSideloadedKit:null,_Consent:null,_Events:null,_Forwarders:null,_NativeSdkHelpers:null,_Persistence:null,_preInit:null,Consent:null,_ServerModel:null,_SessionManager:null,_Store:{sessionId:"mockSessionId",sideloadedKits:[],devToken:"test_dev_token",isFirstRun:!0,isEnabled:!0,sessionAttributes:{},currentSessionMPIDs:[],consentState:null,clientId:null,deviceId:null,serverSettings:{},dateLastEventSent:null,sessionStartDate:null,currentPosition:null,isTracking:!1,watchPositionId:null,cartProducts:[],eventQueue:[],currencyCode:null,globalTimer:null,context:null,configurationLoaded:!1,identityCallInFlight:!1,nonCurrentUserMPIDs:{},identifyCalled:!1,isLoggedIn:!1,cookieSyncDates:{},integrationAttributes:{},requireDelay:!0,isLocalStorageAvailable:null,integrationDelayTimeoutStart:null,storageName:null,prodStorageName:null,activeForwarders:[],kits:{},configuredForwarders:[],pixelConfigurations:[],wrapperSDKInfo:{name:"none",version:null,isInfoSet:!1},SDKConfig:{isDevelopmentMode:!1,onCreateBatch:mockFunction}},config:null,eCommerce:null,Identity:{getCurrentUser:mockFunction,IdentityAPI:{},identify:mockFunction,login:mockFunction,logout:mockFunction,modify:mockFunction},Logger:{verbose:mockFunction,error:mockFunction,warning:mockFunction},ProductActionType:null,ServerModel:null,addForwarder:mockFunction,generateHash:mockFunction,getAppVersion:mockFunction,getAppName:mockFunction,getInstance:mockFunction,getDeviceId:mockFunction,init:mockFunction,logBaseEvent:mockFunction,logEvent:mockFunction,logLevel:"none",setPosition:mockFunction,upload:mockFunction}},a.prototype.createSDKEventFunction=function(a){return new ServerModel(this.getMPInstance()).createEventObject(a)},a.prototype.returnBatch=function(a){var b=this,c=this.getMPInstance(),d=Array.isArray(a)?a.map(function(a){return b.createSDKEventFunction(a)}):[this.createSDKEventFunction(a)],e=convertEvents("0",d,c);return e},a}();

var EventTypeEnum;(function(a){a[a.Unknown=0]="Unknown",a[a.Navigation=1]="Navigation",a[a.Location=2]="Location",a[a.Search=3]="Search",a[a.Transaction=4]="Transaction",a[a.UserContent=5]="UserContent",a[a.UserPreference=6]="UserPreference",a[a.Social=7]="Social",a[a.Other=8]="Other",a[a.Media=9]="Media";})(EventTypeEnum||(EventTypeEnum={}));// TODO: https://mparticle-eng.atlassian.net/browse/SQDSDKS-5403
var MessageType;(function(a){a[a.SessionStart=1]="SessionStart",a[a.SessionEnd=2]="SessionEnd",a[a.PageView=3]="PageView",a[a.PageEvent=4]="PageEvent",a[a.CrashReport=5]="CrashReport",a[a.OptOut=6]="OptOut",a[a.AppStateTransition=10]="AppStateTransition",a[a.Profile=14]="Profile",a[a.Commerce=16]="Commerce",a[a.UserAttributeChange=17]="UserAttributeChange",a[a.UserIdentityChange=18]="UserIdentityChange",a[a.Media=20]="Media";})(MessageType||(MessageType={}));var IdentityType;(function(a){a[a.Other=0]="Other",a[a.CustomerId=1]="CustomerId",a[a.Facebook=2]="Facebook",a[a.Twitter=3]="Twitter",a[a.Google=4]="Google",a[a.Microsoft=5]="Microsoft",a[a.Yahoo=6]="Yahoo",a[a.Email=7]="Email",a[a.FacebookCustomAudienceId=9]="FacebookCustomAudienceId",a[a.Other2=10]="Other2",a[a.Other3=11]="Other3",a[a.Other4=12]="Other4",a[a.Other5=13]="Other5",a[a.Other6=14]="Other6",a[a.Other7=15]="Other7",a[a.Other8=16]="Other8",a[a.Other9=17]="Other9",a[a.Other10=18]="Other10",a[a.MobileNumber=19]="MobileNumber",a[a.PhoneNumber2=20]="PhoneNumber2",a[a.PhoneNumber3=21]="PhoneNumber3";})(IdentityType||(IdentityType={}));

var MPSideloadedKit=/** @class */function(){function a(a){this.filterDictionary={eventTypeFilters:[],eventNameFilters:[],screenNameFilters:[],screenAttributeFilters:[],userIdentityFilters:[],userAttributeFilters:[],attributeFilters:[],consentRegulationFilters:[],consentRegulationPurposeFilters:[],messageTypeFilters:[],messageTypeStateFilters:[],// The below filtering members are optional, but we instantiate them
// to simplify public method assignment
filteringEventAttributeValue:{},filteringUserAttributeValue:{},filteringConsentRuleValues:{}},this.kitInstance=a;}return a.prototype.addEventTypeFilter=function(a){var b=KitFilterHelper.hashEventType(a);this.filterDictionary.eventTypeFilters.push(b);},a.prototype.addEventNameFilter=function(a,b){var c=KitFilterHelper.hashEventName(b,a);this.filterDictionary.eventNameFilters.push(c);},a.prototype.addEventAttributeFilter=function(a,b,c){var d=KitFilterHelper.hashEventAttributeKey(a,b,c);this.filterDictionary.attributeFilters.push(d);},a.prototype.addScreenNameFilter=function(a){var b=KitFilterHelper.hashEventName(a,EventTypeEnum.Unknown);this.filterDictionary.screenNameFilters.push(b);},a.prototype.addScreenAttributeFilter=function(a,b){var c=KitFilterHelper.hashEventAttributeKey(EventTypeEnum.Unknown,a,b);this.filterDictionary.screenAttributeFilters.push(c);},a.prototype.addUserIdentityFilter=function(a){var b=KitFilterHelper.hashUserIdentity(a);this.filterDictionary.userIdentityFilters.push(b);},a.prototype.addUserAttributeFilter=function(a){var b=KitFilterHelper.hashUserAttribute(a);this.filterDictionary.userAttributeFilters.push(b);},a}();

Array.prototype.forEach||(Array.prototype.forEach=Polyfill.forEach),Array.prototype.map||(Array.prototype.map=Polyfill.map),Array.prototype.filter||(Array.prototype.filter=Polyfill.filter),Array.isArray||(Array.prototype.isArray=Polyfill.isArray);function mParticle$1(){var a=this;// Only leaving this here in case any clients are trying to access mParticle.Store, to prevent from throwing
/**
     * Initializes the mParticle instance. If no instanceName is provided, an instance name of `default_instance` will be used.
     * <p>
     * If you'd like to initiate multiple mParticle instances, first review our <a href="https://docs.mparticle.com/developers/sdk/web/multiple-instances/">doc site</a>, and ensure you pass a unique instance name as the third argument as shown below.
     * @method init
     * @param {String} apiKey your mParticle assigned API key
     * @param {Object} [config] an options object for additional configuration
     * @param {String} [instanceName] If you are self hosting the JS SDK and working with multiple instances, you would pass an instanceName to `init`. This instance will be selected when invoking other methods. See the above link to the doc site for more info and examples.
     */this.Store={},this._instances={},this.IdentityType=Types.IdentityType,this.EventType=Types.EventType,this.CommerceEventType=Types.CommerceEventType,this.PromotionType=Types.PromotionActionType,this.ProductActionType=Types.ProductActionType,this.MPSideloadedKit=MPSideloadedKit,"undefined"!=typeof window&&(this.isIOS=!!(window.mParticle&&window.mParticle.isIOS)&&window.mParticle.isIOS,this.config=window.mParticle&&window.mParticle.config?window.mParticle.config:{}),this.init=function(b,c,d){!c&&window.mParticle&&window.mParticle.config&&(console.warn("You did not pass a config object to mParticle.init(). Attempting to use the window.mParticle.config if it exists. Please note that in a future release, this may not work and mParticle will not initialize properly"),c=window.mParticle?window.mParticle.config:{}),d=(d&&0!==d.length?d:Constants.DefaultInstance).toLowerCase();var e=a._instances[d];e===void 0&&(e=new mParticleInstance(b),a._instances[d]=e),e.init(b,c,d);},this.getInstance=function(b){var c;return b?(c=a._instances[b.toLowerCase()],c?c:(console.log("You tried to initialize an instance named "+b+". This instance does not exist. Check your instance name or initialize a new instance with this name before calling it."),null)):(b=Constants.DefaultInstance,c=a._instances[b],c||(c=new mParticleInstance(b),a._instances[Constants.DefaultInstance]=c),c)},this.getDeviceId=function(){return a.getInstance().getDeviceId()},this.setDeviceId=function(b){return a.getInstance().setDeviceId(b)},this.isInitialized=function(){return a.getInstance().isInitialized()},this.startNewSession=function(){a.getInstance().startNewSession();},this.endSession=function(){a.getInstance().endSession();},this.setLogLevel=function(b){a.getInstance().setLogLevel(b);},this.ready=function(b){a.getInstance().ready(b);},this.setAppVersion=function(b){a.getInstance().setAppVersion(b);},this.getAppName=function(){return a.getInstance().getAppName()},this.setAppName=function(b){a.getInstance().setAppName(b);},this.getAppVersion=function(){return a.getInstance().getAppVersion()},this.getEnvironment=function(){return a.getInstance().getEnvironment()},this.stopTrackingLocation=function(){a.getInstance().stopTrackingLocation();},this.startTrackingLocation=function(b){a.getInstance().startTrackingLocation(b);},this.setPosition=function(b,c){a.getInstance().setPosition(b,c);},this.startNewSession=function(){a.getInstance().startNewSession();},this.endSession=function(){a.getInstance().endSession();},this.logBaseEvent=function(b,c){a.getInstance().logBaseEvent(b,c);},this.logEvent=function(b,c,d,e,f){a.getInstance().logEvent(b,c,d,e,f);},this.logError=function(b,c){a.getInstance().logError(b,c);},this.logLink=function(b,c,d,e){a.getInstance().logLink(b,c,d,e);},this.logForm=function(b,c,d,e){a.getInstance().logForm(b,c,d,e);},this.logPageView=function(b,c,d,e){a.getInstance().logPageView(b,c,d,e);},this.upload=function(){a.getInstance().upload();},this.eCommerce={Cart:{add:function add(b,c){a.getInstance().eCommerce.Cart.add(b,c);},remove:function remove(b,c){a.getInstance().eCommerce.Cart.remove(b,c);},clear:function clear(){a.getInstance().eCommerce.Cart.clear();}},setCurrencyCode:function setCurrencyCode(b){a.getInstance().eCommerce.setCurrencyCode(b);},createProduct:function createProduct(b,c,d,e,f,g,h,i,j,k){return a.getInstance().eCommerce.createProduct(b,c,d,e,f,g,h,i,j,k)},createPromotion:function createPromotion(b,c,d,e){return a.getInstance().eCommerce.createPromotion(b,c,d,e)},createImpression:function createImpression(b,c){return a.getInstance().eCommerce.createImpression(b,c)},createTransactionAttributes:function createTransactionAttributes(b,c,d,e,f,g){return a.getInstance().eCommerce.createTransactionAttributes(b,c,d,e,f,g)},logCheckout:function logCheckout(b,c,d,e){a.getInstance().eCommerce.logCheckout(b,c,d,e);},logProductAction:function logProductAction(b,c,d,e,f,g){a.getInstance().eCommerce.logProductAction(b,c,d,e,f,g);},logPurchase:function logPurchase(b,c,d,e,f){a.getInstance().eCommerce.logPurchase(b,c,d,e,f);},logPromotion:function logPromotion(b,c,d,e,f){a.getInstance().eCommerce.logPromotion(b,c,d,e,f);},logImpression:function logImpression(b,c,d,e){a.getInstance().eCommerce.logImpression(b,c,d,e);},logRefund:function logRefund(b,c,d,e,f){a.getInstance().eCommerce.logRefund(b,c,d,e,f);},expandCommerceEvent:function expandCommerceEvent(b){return a.getInstance().eCommerce.expandCommerceEvent(b)}},this.setSessionAttribute=function(b,c){a.getInstance().setSessionAttribute(b,c);},this.setOptOut=function(b){a.getInstance().setOptOut(b);},this.setIntegrationAttribute=function(b,c){a.getInstance().setIntegrationAttribute(b,c);},this.getIntegrationAttributes=function(b){return a.getInstance().getIntegrationAttributes(b)},this.Identity={HTTPCodes:a.getInstance().Identity.HTTPCodes,aliasUsers:function aliasUsers(b,c){a.getInstance().Identity.aliasUsers(b,c);},createAliasRequest:function createAliasRequest(b,c){return a.getInstance().Identity.createAliasRequest(b,c)},getCurrentUser:function getCurrentUser(){return a.getInstance().Identity.getCurrentUser()},getUser:function getUser(b){return a.getInstance().Identity.getUser(b)},getUsers:function getUsers(){return a.getInstance().Identity.getUsers()},identify:function identify(b,c){a.getInstance().Identity.identify(b,c);},login:function login(b,c){a.getInstance().Identity.login(b,c);},logout:function logout(b,c){a.getInstance().Identity.logout(b,c);},modify:function modify(b,c){a.getInstance().Identity.modify(b,c);}},this.sessionManager={getSession:function getSession(){return a.getInstance()._SessionManager.getSession()}},this.Consent={createConsentState:function createConsentState(){return a.getInstance().Consent.createConsentState()},createGDPRConsent:function createGDPRConsent(b,c,d,e,f){return a.getInstance().Consent.createGDPRConsent(b,c,d,e,f)},createCCPAConsent:function createCCPAConsent(b,c,d,e,f){return a.getInstance().Consent.createGDPRConsent(b,c,d,e,f)}},this.reset=function(){a.getInstance().reset(a.getInstance());},this._resetForTests=function(b,c){"boolean"==typeof c?a.getInstance()._resetForTests(b,c,a.getInstance()):a.getInstance()._resetForTests(b,!1,a.getInstance());},this.configurePixel=function(b){a.getInstance().configurePixel(b);},this._setIntegrationDelay=function(b,c){a.getInstance()._setIntegrationDelay(b,c);},this._getIntegrationDelays=function(){return a.getInstance()._getIntegrationDelays()},this.getVersion=function(){return a.getInstance().getVersion()},this.generateHash=function(b){return a.getInstance().generateHash(b)},this.addForwarder=function(b){a.getInstance().addForwarder(b);},this._getActiveForwarders=function(){return a.getInstance()._getActiveForwarders()},this._setWrapperSDKInfo=function(b,c){a.getInstance()._setWrapperSDKInfo(b,c);};}var mparticleInstance=new mParticle$1;"undefined"!=typeof window&&(window.mParticle=mparticleInstance,window.mParticle._BatchValidator=new _BatchValidator);

export { mparticleInstance as default };
