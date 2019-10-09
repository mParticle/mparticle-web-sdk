function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var _typeof_1 = createCommonjsModule(function (module) {
function _typeof2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

function _typeof(obj) {
  if (typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol") {
    module.exports = _typeof = function _typeof(obj) {
      return _typeof2(obj);
    };
  } else {
    module.exports = _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : _typeof2(obj);
    };
  }

  return _typeof(obj);
}

module.exports = _typeof;
});

// Base64 encoder/decoder - http://www.webtoolkit.info/javascript_base64.html
var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",// Input must be a string
encode:function(a){try{if(window.btoa&&window.atob)return window.btoa(unescape(encodeURIComponent(a)))}catch(a){window.console.log("Error encoding cookie values into Base64:"+a);}return this._encode(a)},_encode:function(a){var b,c,d,e,f,g,h,j="",k=0;for(a=UTF8.encode(a);k<a.length;)b=a.charCodeAt(k++),c=a.charCodeAt(k++),d=a.charCodeAt(k++),e=b>>2,f=(3&b)<<4|c>>4,g=(15&c)<<2|d>>6,h=63&d,isNaN(c)?g=h=64:isNaN(d)&&(h=64),j=j+Base64._keyStr.charAt(e)+Base64._keyStr.charAt(f)+Base64._keyStr.charAt(g)+Base64._keyStr.charAt(h);return j},decode:function(a){try{if(window.btoa&&window.atob)return decodeURIComponent(escape(window.atob(a)))}catch(a){//log(e);
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

var MessageType={SessionStart:1,SessionEnd:2,PageView:3,PageEvent:4,CrashReport:5,OptOut:6,AppStateTransition:10,Profile:14,Commerce:16,Media:20},EventType={Unknown:0,Navigation:1,Location:2,Search:3,Transaction:4,UserContent:5,UserPreference:6,Social:7,Other:8,getName:function getName(a){return a===EventType.Navigation?"Navigation":a===EventType.Location?"Location":a===EventType.Search?"Search":a===EventType.Transaction?"Transaction":a===EventType.UserContent?"User Content":a===EventType.UserPreference?"User Preference":a===EventType.Social?"Social":a===CommerceEventType.ProductAddToCart?"Product Added to Cart":a===CommerceEventType.ProductAddToWishlist?"Product Added to Wishlist":a===CommerceEventType.ProductCheckout?"Product Checkout":a===CommerceEventType.ProductCheckoutOption?"Product Checkout Options":a===CommerceEventType.ProductClick?"Product Click":a===CommerceEventType.ProductImpression?"Product Impression":a===CommerceEventType.ProductPurchase?"Product Purchased":a===CommerceEventType.ProductRefund?"Product Refunded":a===CommerceEventType.ProductRemoveFromCart?"Product Removed From Cart":a===CommerceEventType.ProductRemoveFromWishlist?"Product Removed from Wishlist":a===CommerceEventType.ProductViewDetail?"Product View Details":a===CommerceEventType.PromotionClick?"Promotion Click":a===CommerceEventType.PromotionView?"Promotion View":"Other"}},CommerceEventType={ProductAddToCart:10,ProductRemoveFromCart:11,ProductCheckout:12,ProductCheckoutOption:13,ProductClick:14,ProductViewDetail:15,ProductPurchase:16,ProductRefund:17,PromotionView:18,PromotionClick:19,ProductAddToWishlist:20,ProductRemoveFromWishlist:21,ProductImpression:22},IdentityType={Other:0,CustomerId:1,Facebook:2,Twitter:3,Google:4,Microsoft:5,Yahoo:6,Email:7,FacebookCustomAudienceId:9,Other2:10,Other3:11,Other4:12};IdentityType.isValid=function(a){if("number"==typeof a)for(var b in IdentityType)if(IdentityType.hasOwnProperty(b)&&IdentityType[b]===a)return !0;return !1},IdentityType.getName=function(a){return a===window.mParticle.IdentityType.CustomerId?"Customer ID":a===window.mParticle.IdentityType.Facebook?"Facebook ID":a===window.mParticle.IdentityType.Twitter?"Twitter ID":a===window.mParticle.IdentityType.Google?"Google ID":a===window.mParticle.IdentityType.Microsoft?"Microsoft ID":a===window.mParticle.IdentityType.Yahoo?"Yahoo ID":a===window.mParticle.IdentityType.Email?"Email":a===window.mParticle.IdentityType.FacebookCustomAudienceId?"Facebook App User ID":"Other ID"},IdentityType.getIdentityType=function(a){return "other"===a?IdentityType.Other:"customerid"===a?IdentityType.CustomerId:"facebook"===a?IdentityType.Facebook:"twitter"===a?IdentityType.Twitter:"google"===a?IdentityType.Google:"microsoft"===a?IdentityType.Microsoft:"yahoo"===a?IdentityType.Yahoo:"email"===a?IdentityType.Email:"facebookcustomaudienceid"===a?IdentityType.FacebookCustomAudienceId:"other2"===a?IdentityType.Other2:"other3"===a?IdentityType.Other3:!("other4"!=a)&&IdentityType.Other4},IdentityType.getIdentityName=function(a){return a===IdentityType.Other?"other":a===IdentityType.CustomerId?"customerid":a===IdentityType.Facebook?"facebook":a===IdentityType.Twitter?"twitter":a===IdentityType.Google?"google":a===IdentityType.Microsoft?"microsoft":a===IdentityType.Yahoo?"yahoo":a===IdentityType.Email?"email":a===IdentityType.FacebookCustomAudienceId?"facebookcustomaudienceid":a===IdentityType.Other2?"other2":a===IdentityType.Other3?"other3":a===IdentityType.Other4?"other4":void 0};var ProductActionType={Unknown:0,AddToCart:1,RemoveFromCart:2,Checkout:3,CheckoutOption:4,Click:5,ViewDetail:6,Purchase:7,Refund:8,AddToWishlist:9,RemoveFromWishlist:10};ProductActionType.getName=function(a){return a===ProductActionType.AddToCart?"Add to Cart":a===ProductActionType.RemoveFromCart?"Remove from Cart":a===ProductActionType.Checkout?"Checkout":a===ProductActionType.CheckoutOption?"Checkout Option":a===ProductActionType.Click?"Click":a===ProductActionType.ViewDetail?"View Detail":a===ProductActionType.Purchase?"Purchase":a===ProductActionType.Refund?"Refund":a===ProductActionType.AddToWishlist?"Add to Wishlist":a===ProductActionType.RemoveFromWishlist?"Remove from Wishlist":"Unknown"},ProductActionType.getExpansionName=function(a){return a===ProductActionType.AddToCart?"add_to_cart":a===ProductActionType.RemoveFromCart?"remove_from_cart":a===ProductActionType.Checkout?"checkout":a===ProductActionType.CheckoutOption?"checkout_option":a===ProductActionType.Click?"click":a===ProductActionType.ViewDetail?"view_detail":a===ProductActionType.Purchase?"purchase":a===ProductActionType.Refund?"refund":a===ProductActionType.AddToWishlist?"add_to_wishlist":a===ProductActionType.RemoveFromWishlist?"remove_from_wishlist":"unknown"};var PromotionActionType={Unknown:0,PromotionView:1,PromotionClick:2};PromotionActionType.getName=function(a){return a===PromotionActionType.PromotionView?"view":a===PromotionActionType.PromotionClick?"click":"unknown"},PromotionActionType.getExpansionName=function(a){return a===PromotionActionType.PromotionView?"view":a===PromotionActionType.PromotionClick?"click":"unknown"};var ProfileMessageType={Logout:3},ApplicationTransitionType={AppInit:1};var Types = {MessageType:MessageType,EventType:EventType,CommerceEventType:CommerceEventType,IdentityType:IdentityType,ProfileMessageType:ProfileMessageType,ApplicationTransitionType:ApplicationTransitionType,ProductActionType:ProductActionType,PromotionActionType:PromotionActionType};

var Constants={sdkVersion:"2.9.13",sdkVendor:"mparticle",platform:"web",Messages:{ErrorMessages:{NoToken:"A token must be specified.",EventNameInvalidType:"Event name must be a valid string value.",EventDataInvalidType:"Event data must be a valid object hash.",LoggingDisabled:"Event logging is currently disabled.",CookieParseError:"Could not parse cookie",EventEmpty:"Event object is null or undefined, cancelling send",APIRequestEmpty:"APIRequest is null or undefined, cancelling send",NoEventType:"Event type must be specified.",TransactionIdRequired:"Transaction ID is required",TransactionRequired:"A transaction attributes object is required",PromotionIdRequired:"Promotion ID is required",BadAttribute:"Attribute value cannot be object or array",BadKey:"Key value cannot be object or array",BadLogPurchase:"Transaction attributes and a product are both required to log a purchase, https://docs.mparticle.com/?javascript#measuring-transactions"},InformationMessages:{CookieSearch:"Searching for cookie",CookieFound:"Cookie found, parsing values",CookieNotFound:"Cookies not found",CookieSet:"Setting cookie",CookieSync:"Performing cookie sync",SendBegin:"Starting to send event",SendIdentityBegin:"Starting to send event to identity server",SendWindowsPhone:"Sending event to Windows Phone container",SendIOS:"Calling iOS path: ",SendAndroid:"Calling Android JS interface method: ",SendHttp:"Sending event to mParticle HTTP service",SendAliasHttp:"Sending alias request to mParticle HTTP service",SendIdentityHttp:"Sending event to mParticle HTTP service",StartingNewSession:"Starting new Session",StartingLogEvent:"Starting to log event",StartingLogOptOut:"Starting to log user opt in/out",StartingEndSession:"Starting to end session",StartingInitialization:"Starting to initialize",StartingLogCommerceEvent:"Starting to log commerce event",StartingAliasRequest:"Starting to Alias MPIDs",LoadingConfig:"Loading configuration options",AbandonLogEvent:"Cannot log event, logging disabled or developer token not set",AbandonAliasUsers:"Cannot Alias Users, logging disabled or developer token not set",AbandonStartSession:"Cannot start session, logging disabled or developer token not set",AbandonEndSession:"Cannot end session, logging disabled or developer token not set",NoSessionToEnd:"Cannot end session, no active session found"},ValidationMessages:{ModifyIdentityRequestUserIdentitiesPresent:"identityRequests to modify require userIdentities to be present. Request not sent to server. Please fix and try again",IdentityRequesetInvalidKey:"There is an invalid key on your identityRequest object. It can only contain a `userIdentities` object and a `onUserAlias` function. Request not sent to server. Please fix and try again.",OnUserAliasType:"The onUserAlias value must be a function. The onUserAlias provided is of type",UserIdentities:"The userIdentities key must be an object with keys of identityTypes and values of strings. Request not sent to server. Please fix and try again.",UserIdentitiesInvalidKey:"There is an invalid identity key on your `userIdentities` object within the identityRequest. Request not sent to server. Please fix and try again.",UserIdentitiesInvalidValues:"All user identity values must be strings or null. Request not sent to server. Please fix and try again.",AliasMissingMpid:"Alias Request must contain both a destinationMpid and a sourceMpid",AliasNonUniqueMpid:"Alias Request's destinationMpid and sourceMpid must be unique",AliasMissingTime:"Alias Request must have both a startTime and an endTime",AliasStartBeforeEndTime:"Alias Request's endTime must be later than its startTime"}},NativeSdkPaths:{LogEvent:"logEvent",SetUserTag:"setUserTag",RemoveUserTag:"removeUserTag",SetUserAttribute:"setUserAttribute",RemoveUserAttribute:"removeUserAttribute",SetSessionAttribute:"setSessionAttribute",AddToCart:"addToCart",RemoveFromCart:"removeFromCart",ClearCart:"clearCart",LogOut:"logOut",SetUserAttributeList:"setUserAttributeList",RemoveAllUserAttributes:"removeAllUserAttributes",GetUserAttributesLists:"getUserAttributesLists",GetAllUserAttributes:"getAllUserAttributes",Identify:"identify",Logout:"logout",Login:"login",Modify:"modify",Alias:"aliasUsers"},StorageNames:{localStorageName:"mprtcl-api",// Name of the mP localstorage, had cp and pb even if cookies were used, skipped v2
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
},DefaultUrls:{v1SecureServiceUrl:"jssdks.mparticle.com/v1/JS/",v2SecureServiceUrl:"jssdks.mparticle.com/v2/JS/",v3SecureServiceUrl:"jssdks.mparticle.com/v3/JS/",configUrl:"jssdkcdns.mparticle.com/JS/v2/",identityUrl:"identity.mparticle.com/v1/",aliasUrl:"jssdks.mparticle.com/v1/identity/"},Base64CookieKeys:{csm:1,sa:1,ss:1,ua:1,ui:1,csd:1,ia:1,con:1},SDKv2NonMPIDCookieKeys:{gs:1,cu:1,l:1,globalSettings:1,currentUserMPID:1},HTTPCodes:{noHttpCoverage:-1,activeIdentityRequest:-2,activeSession:-3,validationIssue:-4,nativeIdentityRequest:-5,loggingDisabledOrMissingAPIKey:-6,tooManyRequests:429},FeatureFlags:{ReportBatching:"reportBatching",EventsV3:"eventsV3",EventBatchingIntervalMillis:"eventBatchingIntervalMillis"}};

var StorageNames=Constants.StorageNames,pluses=/\+/g;function canLog(){return !!(mParticle.Store.isEnabled&&(mParticle.Store.devToken||mParticle.Store.webviewBridgeEnabled))}function returnConvertedBoolean(a){return "false"!==a&&"0"!==a&&!!a}function getFeatureFlag(a){return mParticle.Store.SDKConfig.flags.hasOwnProperty(a)?mParticle.Store.SDKConfig.flags[a]:null}/**
 * Returns a value between 1-100 inclusive.
 */function getRampNumber(a){if(!a)return 100;var b=generateHash(a);return Math.abs(b%100)+1}function invokeCallback(a,b,c,d,e){a||mParticle.Logger.warning("There is no callback provided");try{Validators.isFunction(a)&&a({httpCode:b,body:c,getUser:function getUser(){return d?d:mParticle.Identity.getCurrentUser()},getPreviousUser:function getPreviousUser(){if(!e){var a=mParticle.Identity.getUsers(),b=a.shift(),c=d||mParticle.Identity.getCurrentUser();return b&&c&&b.getMPID()===c.getMPID()&&(b=a.shift()),b||null}return mParticle.Identity.getUser(e)}});}catch(a){mParticle.Logger.error("There was an error with your callback: "+a);}}function invokeAliasCallback(a,b,c){a||mParticle.Logger.warning("There is no callback provided");try{if(Validators.isFunction(a)){var d={httpCode:b};c&&(d.message=c),a(d);}}catch(a){mParticle.Logger.error("There was an error with your callback: "+a);}}// Standalone version of jQuery.extend, from https://github.com/dansdom/extend
function extend(){var a,b,c,d,e,f,g=arguments[0]||{},h=1,j=arguments.length,k=!1,// helper which replicates the jquery internal functions
l={hasOwn:Object.prototype.hasOwnProperty,class2type:{},type:function type(a){return null==a?a+"":l.class2type[Object.prototype.toString.call(a)]||"object"},isPlainObject:function isPlainObject(a){if(!a||"object"!==l.type(a)||a.nodeType||l.isWindow(a))return !1;try{if(a.constructor&&!l.hasOwn.call(a,"constructor")&&!l.hasOwn.call(a.constructor.prototype,"isPrototypeOf"))return !1}catch(a){return !1}for(var b in a);// eslint-disable-line no-empty
return b===void 0||l.hasOwn.call(a,b)},isArray:Array.isArray||function(a){return "array"===l.type(a)},isFunction:function isFunction(a){return "function"===l.type(a)},isWindow:function isWindow(a){return null!=a&&a==a.window}};// end of objectHelper
// Handle a deep copy situation
for("boolean"==typeof g&&(k=g,g=arguments[1]||{},h=2),"object"===_typeof_1(g)||l.isFunction(g)||(g={}),j===h&&(g=this,--h);h<j;h++)// Only deal with non-null/undefined values
if(null!=(a=arguments[h]))// Extend the base object
for(b in a)// Prevent never-ending loop
(c=g[b],d=a[b],g!==d)&&(k&&d&&(l.isPlainObject(d)||(e=l.isArray(d)))?(e?(e=!1,f=c&&l.isArray(c)?c:[]):f=c&&l.isPlainObject(c)?c:{},g[b]=extend(k,f,d)):void 0!==d&&(g[b]=d));// Recurse if we're merging plain objects or arrays
// Return the modified object
return g}function isObject(a){var b=Object.prototype.toString.call(a);return "[object Object]"===b||"[object Error]"===b}function inArray(a,b){var c=0;if(Array.prototype.indexOf)return 0<=a.indexOf(b,0);for(var d=a.length;c<d;c++)if(c in a&&a[c]===b)return !0}function createServiceUrl(a,b){var c,d=window.mParticle&&mParticle.Store.SDKConfig.forceHttps?"https://":window.location.protocol+"//";return c=mParticle.Store.SDKConfig.forceHttps?"https://"+a:d+a,b&&(c+=b),c}function createXHR(a){var b;try{b=new window.XMLHttpRequest;}catch(a){mParticle.Logger.error("Error creating XMLHttpRequest object.");}if(b&&a&&"withCredentials"in b)b.onreadystatechange=a;else if("undefined"!=typeof window.XDomainRequest){mParticle.Logger.verbose("Creating XDomainRequest object");try{b=new window.XDomainRequest,b.onload=a;}catch(a){mParticle.Logger.error("Error creating XDomainRequest object");}}return b}function generateRandomValue(b){var a;return window.crypto&&window.crypto.getRandomValues&&(a=window.crypto.getRandomValues(new Uint8Array(1))),a?(b^a[0]%16>>b/4).toString(16):(b^16*Math.random()>>b/4).toString(16)}function generateUniqueId(b){// https://gist.github.com/jed/982883
// Added support for crypto for better random
return b// if the placeholder was passed, return
?generateRandomValue(b)// a random number
:// or otherwise a concatenated string:
"10000000-1000-4000-8000-100000000000".// -100000000000,
replace(// replacing
/[018]/g,// zeroes, ones, and eights with
generateUniqueId// random hex digits
)}function filterUserIdentities(a,b){var c=[];if(a&&Object.keys(a).length)for(var d in a)if(a.hasOwnProperty(d)){var e=Types.IdentityType.getIdentityType(d);if(!inArray(b,e)){var f={Type:e,Identity:a[d]};e===mParticle.IdentityType.CustomerId?c.unshift(f):c.push(f);}}return c}function filterUserIdentitiesForForwarders(a,b){var c={};if(a&&Object.keys(a).length)for(var d in a)if(a.hasOwnProperty(d)){var e=Types.IdentityType.getIdentityType(d);inArray(b,e)||(c[d]=a[d]);}return c}function filterUserAttributes(a,b){var c={};if(a&&Object.keys(a).length)for(var d in a)if(a.hasOwnProperty(d)){var e=generateHash(d);inArray(b,e)||(c[d]=a[d]);}return c}function findKeyInObject(a,b){if(b&&a)for(var c in a)if(a.hasOwnProperty(c)&&c.toLowerCase()===b.toLowerCase())return c;return null}function decoded(a){return decodeURIComponent(a.replace(pluses," "))}function converted(a){return 0===a.indexOf("\"")&&(a=a.slice(1,-1).replace(/\\"/g,"\"").replace(/\\\\/g,"\\")),a}function isEventType(a){for(var b in Types.EventType)if(Types.EventType.hasOwnProperty(b)&&Types.EventType[b]===a)return !0;return !1}function parseNumber(a){if(isNaN(a)||!isFinite(a))return 0;var b=parseFloat(a);return isNaN(b)?0:b}function parseStringOrNumber(a){return Validators.isStringOrNumber(a)?a:null}function generateHash(a){var b,c=0,d=0;if(void 0===a||null===a)return 0;if(a=a.toString().toLowerCase(),Array.prototype.reduce)return a.split("").reduce(function(c,d){return c=(c<<5)-c+d.charCodeAt(0),c&c},0);if(0===a.length)return c;for(d=0;d<a.length;d++)b=a.charCodeAt(d),c=(c<<5)-c+b,c&=c;return c}function sanitizeAttributes(a){if(!a||!isObject(a))return null;var b={};for(var c in a)// Make sure that attribute values are not objects or arrays, which are not valid
a.hasOwnProperty(c)&&Validators.isValidAttributeValue(a[c])?b[c]=a[c]:mParticle.Logger.warning("The corresponding attribute value of "+c+" must be a string, number, boolean, or null.");return b}var Validators={isValidAttributeValue:function isValidAttributeValue(a){return a!==void 0&&!isObject(a)&&!Array.isArray(a)},// Neither null nor undefined can be a valid Key
isValidKeyValue:function isValidKeyValue(a){return !(!a||isObject(a)||Array.isArray(a))},isStringOrNumber:function isStringOrNumber(a){return "string"==typeof a||"number"==typeof a},isNumber:function isNumber(a){return "number"==typeof a},isFunction:function isFunction(a){return "function"==typeof a},validateIdentities:function validateIdentities(a,b){var c={userIdentities:1,onUserAlias:1,copyUserAttributes:1};if(a){if("modify"===b&&(isObject(a.userIdentities)&&!Object.keys(a.userIdentities).length||!isObject(a.userIdentities)))return {valid:!1,error:Constants.Messages.ValidationMessages.ModifyIdentityRequestUserIdentitiesPresent};for(var d in a)if(a.hasOwnProperty(d)){if(!c[d])return {valid:!1,error:Constants.Messages.ValidationMessages.IdentityRequesetInvalidKey};if("onUserAlias"===d&&!Validators.isFunction(a[d]))return {valid:!1,error:Constants.Messages.ValidationMessages.OnUserAliasType+_typeof_1(a[d])}}if(0===Object.keys(a).length)return {valid:!0};// identityApiData.userIdentities can't be undefined
if(void 0===a.userIdentities)return {valid:!1,error:Constants.Messages.ValidationMessages.UserIdentities};// identityApiData.userIdentities can be null, but if it isn't null or undefined (above conditional), it must be an object
if(null!==a.userIdentities&&!isObject(a.userIdentities))return {valid:!1,error:Constants.Messages.ValidationMessages.UserIdentities};if(isObject(a.userIdentities)&&Object.keys(a.userIdentities).length)for(var e in a.userIdentities)if(a.userIdentities.hasOwnProperty(e)){if(!1===Types.IdentityType.getIdentityType(e))return {valid:!1,error:Constants.Messages.ValidationMessages.UserIdentitiesInvalidKey};if("string"!=typeof a.userIdentities[e]&&null!==a.userIdentities[e])return {valid:!1,error:Constants.Messages.ValidationMessages.UserIdentitiesInvalidValues}}}return {valid:!0}}};function isDelayedByIntegration(a,b,c){if(c-b>mParticle.Store.SDKConfig.integrationDelayTimeout)return !1;for(var d in a){if(!0===a[d])return !0;continue}return !1}function createMainStorageName(a){return a?StorageNames.currentStorageName+"_"+a:StorageNames.currentStorageName}function createProductStorageName(a){return a?StorageNames.currentStorageProductsName+"_"+a:StorageNames.currentStorageProductsName}var Helpers = {canLog:canLog,extend:extend,isObject:isObject,inArray:inArray,createServiceUrl:createServiceUrl,createXHR:createXHR,generateUniqueId:generateUniqueId,filterUserIdentities:filterUserIdentities,filterUserIdentitiesForForwarders:filterUserIdentitiesForForwarders,filterUserAttributes:filterUserAttributes,findKeyInObject:findKeyInObject,decoded:decoded,converted:converted,isEventType:isEventType,parseNumber:parseNumber,parseStringOrNumber:parseStringOrNumber,generateHash:generateHash,sanitizeAttributes:sanitizeAttributes,returnConvertedBoolean:returnConvertedBoolean,invokeCallback:invokeCallback,invokeAliasCallback:invokeAliasCallback,getFeatureFlag:getFeatureFlag,isDelayedByIntegration:isDelayedByIntegration,createMainStorageName:createMainStorageName,createProductStorageName:createProductStorageName,Validators:Validators,getRampNumber:getRampNumber};

var Messages=Constants.Messages,androidBridgeNameBase="mParticleAndroid",iosBridgeNameBase="mParticle";function isBridgeV2Available(a){if(!a)return !1;var b=iosBridgeNameBase+"_"+a+"_v2";// iOS v2 bridge
return !!(window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.hasOwnProperty(b))||!(window.mParticle.uiwebviewBridgeName!==b)||!!window.hasOwnProperty(androidBridgeNameBase+"_"+a+"_v2");// other iOS v2 bridge
// android
}function isWebviewEnabled(a,b){return mParticle.Store.bridgeV2Available=isBridgeV2Available(a),mParticle.Store.bridgeV1Available=isBridgeV1Available(),2===b?mParticle.Store.bridgeV2Available:!(window.mParticle.uiwebviewBridgeName&&window.mParticle.uiwebviewBridgeName!==iosBridgeNameBase+"_"+a+"_v2")&&!!(2>b)&&(mParticle.Store.bridgeV2Available||mParticle.Store.bridgeV1Available);// iOS BridgeV1 can be available via mParticle.isIOS, but return false if uiwebviewBridgeName doesn't match requiredWebviewBridgeName
}function isBridgeV1Available(){return !!(mParticle.Store.SDKConfig.useNativeSdk||window.mParticleAndroid||mParticle.Store.SDKConfig.isIOS)}function sendToNative(a,b){return mParticle.Store.bridgeV2Available&&2===mParticle.Store.SDKConfig.minWebviewBridgeVersion?void sendViaBridgeV2(a,b,mParticle.Store.SDKConfig.requiredWebviewBridgeName):mParticle.Store.bridgeV2Available&&2>mParticle.Store.SDKConfig.minWebviewBridgeVersion?void sendViaBridgeV2(a,b,mParticle.Store.SDKConfig.requiredWebviewBridgeName):mParticle.Store.bridgeV1Available&&2>mParticle.Store.SDKConfig.minWebviewBridgeVersion?void sendViaBridgeV1(a,b):void 0}function sendViaBridgeV1(a,b){window.mParticleAndroid&&window.mParticleAndroid.hasOwnProperty(a)?(mParticle.Logger.verbose(Messages.InformationMessages.SendAndroid+a),window.mParticleAndroid[a](b)):mParticle.Store.SDKConfig.isIOS&&(mParticle.Logger.verbose(Messages.InformationMessages.SendIOS+a),sendViaIframeToIOS(a,b));}function sendViaIframeToIOS(a,b){var c=document.createElement("IFRAME");c.setAttribute("src","mp-sdk://"+a+"/"+encodeURIComponent(b)),document.documentElement.appendChild(c),c.parentNode.removeChild(c);}function sendViaBridgeV2(a,b,c){if(c){var d,e,f=window[androidBridgeNameBase+"_"+c+"_v2"],g=iosBridgeNameBase+"_"+c+"_v2";return window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers[g]&&(d=window.webkit.messageHandlers[g]),window.mParticle.uiwebviewBridgeName===g&&(e=window.mParticle[g]),f&&f.hasOwnProperty(a)?(mParticle.Logger.verbose(Messages.InformationMessages.SendAndroid+a),void f[a](b)):void(d?(mParticle.Logger.verbose(Messages.InformationMessages.SendIOS+a),d.postMessage(JSON.stringify({path:a,value:b?JSON.parse(b):null}))):e&&(mParticle.Logger.verbose(Messages.InformationMessages.SendIOS+a),sendViaIframeToIOS(a,b)))}}var NativeSdkHelpers = {isWebviewEnabled:isWebviewEnabled,isBridgeV2Available:isBridgeV2Available,sendToNative:sendToNative};

function createGDPRConsent(a,b,c,d,e){return "boolean"==typeof a?b&&isNaN(b)?(mParticle.Logger.error("Timestamp must be a valid number when constructing a GDPR Consent object."),null):c&&"string"!=typeof c?(mParticle.Logger.error("Document must be a valid string when constructing a GDPR Consent object."),null):d&&"string"!=typeof d?(mParticle.Logger.error("Location must be a valid string when constructing a GDPR Consent object."),null):e&&"string"!=typeof e?(mParticle.Logger.error("Hardware ID must be a valid string when constructing a GDPR Consent object."),null):{Consented:a,Timestamp:b||Date.now(),ConsentDocument:c,Location:d,HardwareId:e}:(mParticle.Logger.error("Consented boolean is required when constructing a GDPR Consent object."),null)}var ConsentSerialization={toMinifiedJsonObject:function toMinifiedJsonObject(a){var b={};if(a){var c=a.getGDPRConsentState();if(c)for(var d in b.gdpr={},c)if(c.hasOwnProperty(d)){var e=c[d];b.gdpr[d]={},"boolean"==typeof e.Consented&&(b.gdpr[d].c=e.Consented),"number"==typeof e.Timestamp&&(b.gdpr[d].ts=e.Timestamp),"string"==typeof e.ConsentDocument&&(b.gdpr[d].d=e.ConsentDocument),"string"==typeof e.Location&&(b.gdpr[d].l=e.Location),"string"==typeof e.HardwareId&&(b.gdpr[d].h=e.HardwareId);}}return b},fromMinifiedJsonObject:function fromMinifiedJsonObject(a){var b=createConsentState();if(a.gdpr)for(var c in a.gdpr)if(a.gdpr.hasOwnProperty(c)){var d=createGDPRConsent(a.gdpr[c].c,a.gdpr[c].ts,a.gdpr[c].d,a.gdpr[c].l,a.gdpr[c].h);b.addGDPRConsentState(c,d);}return b}};function createConsentState(a){function b(a){if("string"!=typeof a)return null;var b=a.trim();return b.length?b.toLowerCase():null}function c(a){if(!a)g={};else if(Helpers.isObject(a))for(var b in g={},a)a.hasOwnProperty(b)&&d(b,a[b]);return this}function d(a,c){var d=b(a);if(!d)return mParticle.Logger.error("addGDPRConsentState() invoked with bad purpose. Purpose must be a string."),this;if(!Helpers.isObject(c))return mParticle.Logger.error("addGDPRConsentState() invoked with bad or empty GDPR consent object."),this;var e=createGDPRConsent(c.Consented,c.Timestamp,c.ConsentDocument,c.Location,c.HardwareId);return e&&(g[d]=e),this}function e(a){var c=b(a);return c?(delete g[c],this):this}function f(){return Helpers.extend({},g)}var g={};return a&&c(a.getGDPRConsentState()),{setGDPRConsentState:c,addGDPRConsentState:d,getGDPRConsentState:f,removeGDPRConsentState:e}}var Consent = {createGDPRConsent:createGDPRConsent,Serialization:ConsentSerialization,createConsentState:createConsentState};

var Base64$1=Polyfill.Base64,Messages$1=Constants.Messages,Base64CookieKeys=Constants.Base64CookieKeys,SDKv2NonMPIDCookieKeys=Constants.SDKv2NonMPIDCookieKeys,StorageNames$1=Constants.StorageNames;function useLocalStorage(){return !mParticle.Store.SDKConfig.useCookieStorage&&mParticle.Store.isLocalStorageAvailable}function initializeStorage(){try{var a,b,c=getLocalStorage(),d=getCookie();// Determine if there is any data in cookies or localStorage to figure out if it is the first time the browser is loading mParticle
c||d?mParticle.Store.isFirstRun=!1:(mParticle.Store.isFirstRun=!0,mParticle.Store.mpid=0),mParticle.Store.isLocalStorageAvailable||(mParticle.Store.SDKConfig.useCookieStorage=!0),mParticle.Store.isLocalStorageAvailable?(a=window.localStorage,mParticle.Store.SDKConfig.useCookieStorage?(c?(b=d?Helpers.extend(!1,c,d):c,a.removeItem(mParticle.Store.storageName)):d&&(b=d),storeDataInMemory(b)):d?(b=c?Helpers.extend(!1,c,d):d,storeDataInMemory(b),expireCookies(mParticle.Store.storageName)):storeDataInMemory(c)):storeDataInMemory(d);try{if(mParticle.Store.isLocalStorageAvailable){var e=localStorage.getItem(mParticle.Store.prodStorageName);if(e)var f=JSON.parse(Base64$1.decode(e));mParticle.Store.mpid&&storeProductsInMemory(f,mParticle.Store.mpid);}}catch(a){mParticle.Store.isLocalStorageAvailable&&localStorage.removeItem(mParticle.Store.prodStorageName),mParticle.Store.cartProducts=[],mParticle.Logger.error("Error loading products in initialization: "+a);}for(var g in b)b.hasOwnProperty(g)&&(SDKv2NonMPIDCookieKeys[g]||(mParticle.Store.nonCurrentUserMPIDs[g]=b[g]));update();}catch(a){useLocalStorage()&&mParticle.Store.isLocalStorageAvailable?localStorage.removeItem(mParticle.Store.storageName):expireCookies(mParticle.Store.storageName),mParticle.Logger.error("Error initializing storage: "+a);}}function update(){mParticle.Store.webviewBridgeEnabled||(mParticle.Store.SDKConfig.useCookieStorage&&setCookie(),setLocalStorage());}function storeProductsInMemory(a,b){if(a)try{mParticle.Store.cartProducts=a[b]&&a[b].cp?a[b].cp:[];}catch(a){mParticle.Logger.error(Messages$1.ErrorMessages.CookieParseError);}}function storeDataInMemory(a,b){try{a?(mParticle.Store.mpid=b?b:a.cu||0,a.gs=a.gs||{},mParticle.Store.sessionId=a.gs.sid||mParticle.Store.sessionId,mParticle.Store.isEnabled="undefined"==typeof a.gs.ie?mParticle.Store.isEnabled:a.gs.ie,mParticle.Store.sessionAttributes=a.gs.sa||mParticle.Store.sessionAttributes,mParticle.Store.serverSettings=a.gs.ss||mParticle.Store.serverSettings,mParticle.Store.devToken=mParticle.Store.devToken||a.gs.dt,mParticle.Store.SDKConfig.appVersion=mParticle.Store.SDKConfig.appVersion||a.gs.av,mParticle.Store.clientId=a.gs.cgid||mParticle.Store.clientId||Helpers.generateUniqueId(),mParticle.Store.deviceId=a.gs.das||mParticle.Store.deviceId||Helpers.generateUniqueId(),mParticle.Store.integrationAttributes=a.gs.ia||{},mParticle.Store.context=a.gs.c||mParticle.Store.context,mParticle.Store.currentSessionMPIDs=a.gs.csm||mParticle.Store.currentSessionMPIDs,mParticle.Store.isLoggedIn=!0===a.l,a.gs.les&&(mParticle.Store.dateLastEventSent=new Date(a.gs.les)),mParticle.Store.sessionStartDate=a.gs.ssd?new Date(a.gs.ssd):new Date,a=b?a[b]:a[a.cu]):(mParticle.Logger.verbose(Messages$1.InformationMessages.CookieNotFound),mParticle.Store.clientId=mParticle.Store.clientId||Helpers.generateUniqueId(),mParticle.Store.deviceId=mParticle.Store.deviceId||Helpers.generateUniqueId());}catch(a){mParticle.Logger.error(Messages$1.ErrorMessages.CookieParseError);}}function determineLocalStorageAvailability(a){var b;mParticle._forceNoLocalStorage&&(a=void 0);try{return a.setItem("mparticle","test"),b="test"===a.getItem("mparticle"),a.removeItem("mparticle"),b&&a}catch(a){return !1}}function getUserProductsFromLS(a){if(!mParticle.Store.isLocalStorageAvailable)return [];var b,c,d,e=localStorage.getItem(mParticle.Store.prodStorageName);// if there is an MPID, we are retrieving the user's products, which is an array
if(e&&(b=Base64$1.decode(e)),a)try{return b&&(d=JSON.parse(b)),c=b&&d[a]&&d[a].cp&&Array.isArray(d[a].cp)?d[a].cp:[],c}catch(a){return []}else return []}function getAllUserProductsFromLS(){var a,b,c=localStorage.getItem(mParticle.Store.prodStorageName);c&&(a=Base64$1.decode(c));// returns an object with keys of MPID and values of array of products
try{b=JSON.parse(a);}catch(a){b={};}return b}function setLocalStorage(){if(mParticle.Store.isLocalStorageAvailable){var a=mParticle.Store.storageName,b=getAllUserProductsFromLS(),c=getLocalStorage()||{},d=mParticle.Identity.getCurrentUser(),e=d?d.getMPID():null,f={cp:b[e]?b[e].cp:[]};if(e){b=b||{},b[e]=f;try{window.localStorage.setItem(encodeURIComponent(mParticle.Store.prodStorageName),Base64$1.encode(JSON.stringify(b)));}catch(a){mParticle.Logger.error("Error with setting products on localStorage.");}}if(!mParticle.Store.SDKConfig.useCookieStorage){c.gs=c.gs||{},c.l=mParticle.Store.isLoggedIn?1:0,mParticle.Store.sessionId&&(c.gs.csm=mParticle.Store.currentSessionMPIDs),c.gs.ie=mParticle.Store.isEnabled,e&&(c.cu=e),Object.keys(mParticle.Store.nonCurrentUserMPIDs).length&&(c=Helpers.extend({},c,mParticle.Store.nonCurrentUserMPIDs),mParticle.Store.nonCurrentUserMPIDs={}),c=setGlobalStorageAttributes(c);try{window.localStorage.setItem(encodeURIComponent(a),encodeCookies(JSON.stringify(c)));}catch(a){mParticle.Logger.error("Error with setting localStorage item.");}}}}function setGlobalStorageAttributes(a){var b=mParticle.Store;return a.gs.sid=b.sessionId,a.gs.ie=b.isEnabled,a.gs.sa=b.sessionAttributes,a.gs.ss=b.serverSettings,a.gs.dt=b.devToken,a.gs.les=b.dateLastEventSent?b.dateLastEventSent.getTime():null,a.gs.av=b.SDKConfig.appVersion,a.gs.cgid=b.clientId,a.gs.das=b.deviceId,a.gs.c=b.context,a.gs.ssd=b.sessionStartDate?b.sessionStartDate.getTime():null,a.gs.ia=b.integrationAttributes,a}function getLocalStorage(){if(!mParticle.Store.isLocalStorageAvailable)return null;var a,b=mParticle.Store.storageName,c=decodeCookies(window.localStorage.getItem(b)),d={};if(c)for(a in c=JSON.parse(c),c)c.hasOwnProperty(a)&&(d[a]=c[a]);return Object.keys(d).length?d:null}function removeLocalStorage(a){localStorage.removeItem(a);}function retrieveDeviceId(){return mParticle.Store.deviceId?mParticle.Store.deviceId:parseDeviceId(mParticle.Store.serverSettings)}function parseDeviceId(a){try{var b,c={};return a&&a.uid&&a.uid.Value&&(a.uid.Value.split("&").forEach(function(a){b=a.split("="),c[b[0]]=b[1];}),c.g)?c.g:Helpers.generateUniqueId()}catch(a){return Helpers.generateUniqueId()}}function expireCookies(a){var b,c,d,e=new Date;d=getCookieDomain(),c=""===d?"":";domain="+d,e.setTime(e.getTime()-86400000),b="; expires="+e.toUTCString(),document.cookie=a+"="+b+"; path=/"+c;}function getCookie(){var a,b,c,d,e,f=window.document.cookie.split("; "),g=mParticle.Store.storageName,h=g?void 0:{};for(mParticle.Logger.verbose(Messages$1.InformationMessages.CookieSearch),a=0,b=f.length;a<b;a++){if(c=f[a].split("="),d=Helpers.decoded(c.shift()),e=Helpers.decoded(c.join("=")),g&&g===d){h=Helpers.converted(e);break}g||(h[d]=Helpers.converted(e));}return h?(mParticle.Logger.verbose(Messages$1.InformationMessages.CookieFound),JSON.parse(decodeCookies(h))):null}function setCookie(){var a,b=mParticle.Identity.getCurrentUser();b&&(a=b.getMPID());var c,d,e,f=new Date,g=mParticle.Store.storageName,h=getCookie()||{},i=new Date(f.getTime()+1e3*(60*(60*(24*mParticle.Store.SDKConfig.cookieExpiration)))).toGMTString();c=getCookieDomain(),d=""===c?"":";domain="+c,h.gs=h.gs||{},mParticle.Store.sessionId&&(h.gs.csm=mParticle.Store.currentSessionMPIDs),a&&(h.cu=a),h.l=mParticle.Store.isLoggedIn?1:0,h=setGlobalStorageAttributes(h),Object.keys(mParticle.Store.nonCurrentUserMPIDs).length&&(h=Helpers.extend({},h,mParticle.Store.nonCurrentUserMPIDs),mParticle.Store.nonCurrentUserMPIDs={}),e=reduceAndEncodeCookies(h,i,d,mParticle.Store.SDKConfig.maxCookieSize),mParticle.Logger.verbose(Messages$1.InformationMessages.CookieSet),window.document.cookie=encodeURIComponent(g)+"="+e;}/*  This function determines if a cookie is greater than the configured maxCookieSize.
        - If it is, we remove an MPID and its associated UI/UA/CSD from the cookie.
        - Once removed, check size, and repeat.
        - Never remove the currentUser's MPID from the cookie.

    MPID removal priority:
    1. If there are no currentSessionMPIDs, remove a random MPID from the the cookie.
    2. If there are currentSessionMPIDs:
        a. Remove at random MPIDs on the cookie that are not part of the currentSessionMPIDs
        b. Then remove MPIDs based on order in currentSessionMPIDs array, which
        stores MPIDs based on earliest login.
*/function reduceAndEncodeCookies(a,b,c,d){var e,f=a.gs.csm?a.gs.csm:[];// Comment 1 above
if(!f.length)for(var g in a)a.hasOwnProperty(g)&&(e=createFullEncodedCookie(a,b,c),e.length>d&&!SDKv2NonMPIDCookieKeys[g]&&g!==a.cu&&delete a[g]);else{// Comment 2 above - First create an object of all MPIDs on the cookie
var h={};for(var j in a)a.hasOwnProperty(j)&&(SDKv2NonMPIDCookieKeys[j]||j===a.cu||(h[j]=1));// Comment 2a above
if(Object.keys(h).length)for(var k in h)e=createFullEncodedCookie(a,b,c),e.length>d&&h.hasOwnProperty(k)&&-1===f.indexOf(k)&&delete a[k];// Comment 2b above
for(var l,m=0;m<f.length&&(e=createFullEncodedCookie(a,b,c),e.length>d);m++)l=f[m],a[l]?(mParticle.Logger.verbose("Size of new encoded cookie is larger than maxCookieSize setting of "+d+". Removing from cookie the earliest logged in MPID containing: "+JSON.stringify(a[l],0,2)),delete a[l]):mParticle.Logger.error("Unable to save MPID data to cookies because the resulting encoded cookie is larger than the maxCookieSize setting of "+d+". We recommend using a maxCookieSize of 1500.");}return e}function createFullEncodedCookie(a,b,c){return encodeCookies(JSON.stringify(a))+";expires="+b+";path=/"+c}function findPrevCookiesBasedOnUI(a){var b,c=getCookie()||getLocalStorage();if(a)for(var d in a.userIdentities)if(c&&Object.keys(c).length)for(var e in c)// any value in cookies that has an MPID key will be an MPID to search through
// other keys on the cookie are currentSessionMPIDs and currentMPID which should not be searched
if(c[e].mpid){var f=c[e].ui;for(var g in f)if(d===g&&a.userIdentities[d]===f[g]){b=e;break}}b&&storeDataInMemory(c,b);}function encodeCookies(a){for(var b in a=JSON.parse(a),a.gs)a.gs.hasOwnProperty(b)&&(Base64CookieKeys[b]?a.gs[b]?Array.isArray(a.gs[b])&&a.gs[b].length||Helpers.isObject(a.gs[b])&&Object.keys(a.gs[b]).length?a.gs[b]=Base64$1.encode(JSON.stringify(a.gs[b])):delete a.gs[b]:delete a.gs[b]:"ie"===b?a.gs[b]=a.gs[b]?1:0:!a.gs[b]&&delete a.gs[b]);for(var c in a)if(a.hasOwnProperty(c)&&!SDKv2NonMPIDCookieKeys[c])for(b in a[c])a[c].hasOwnProperty(b)&&Base64CookieKeys[b]&&(Helpers.isObject(a[c][b])&&Object.keys(a[c][b]).length?a[c][b]=Base64$1.encode(JSON.stringify(a[c][b])):delete a[c][b]);return createCookieString(JSON.stringify(a))}function decodeCookies(a){try{if(a){if(a=JSON.parse(revertCookieString(a)),Helpers.isObject(a)&&Object.keys(a).length){for(var b in a.gs)a.gs.hasOwnProperty(b)&&(Base64CookieKeys[b]?a.gs[b]=JSON.parse(Base64$1.decode(a.gs[b])):"ie"===b&&(a.gs[b]=!!a.gs[b]));for(var c in a)if(a.hasOwnProperty(c))if(!SDKv2NonMPIDCookieKeys[c])for(b in a[c])a[c].hasOwnProperty(b)&&Base64CookieKeys[b]&&a[c][b].length&&(a[c][b]=JSON.parse(Base64$1.decode(a[c][b])));else"l"===c&&(a[c]=!!a[c]);}return JSON.stringify(a)}}catch(a){mParticle.Logger.error("Problem with decoding cookie",a);}}function replaceCommasWithPipes(a){return a.replace(/,/g,"|")}function replacePipesWithCommas(a){return a.replace(/\|/g,",")}function replaceApostrophesWithQuotes(a){return a.replace(/\'/g,"\"")}function replaceQuotesWithApostrophes(a){return a.replace(/\"/g,"'")}function createCookieString(a){return replaceCommasWithPipes(replaceQuotesWithApostrophes(a))}function revertCookieString(a){return replacePipesWithCommas(replaceApostrophesWithQuotes(a))}function getCookieDomain(){if(mParticle.Store.SDKConfig.cookieDomain)return mParticle.Store.SDKConfig.cookieDomain;var a=getDomain(document,location.hostname);return ""===a?"":"."+a}// This function loops through the parts of a full hostname, attempting to set a cookie on that domain. It will set a cookie at the highest level possible.
// For example subdomain.domain.co.uk would try the following combinations:
// "co.uk" -> fail
// "domain.co.uk" -> success, return
// "subdomain.domain.co.uk" -> skipped, because already found
function getDomain(a,b){var c,d,e=b.split(".");for(c=e.length-1;0<=c;c--)if(d=e.slice(c).join("."),a.cookie="mptest=cookie;domain=."+d+";",-1<a.cookie.indexOf("mptest=cookie"))return a.cookie="mptest=;domain=."+d+";expires=Thu, 01 Jan 1970 00:00:01 GMT;",d;return ""}function getUserIdentities(a){var b=getPersistence();return b&&b[a]&&b[a].ui?b[a].ui:{}}function getAllUserAttributes(a){var b=getPersistence();return b&&b[a]&&b[a].ua?b[a].ua:{}}function getCartProducts(a){var b,c=localStorage.getItem(mParticle.Store.prodStorageName);return c&&(b=JSON.parse(Base64$1.decode(c)),b&&b[a]&&b[a].cp)?b[a].cp:[]}function setCartProducts(a){if(mParticle.Store.isLocalStorageAvailable)try{window.localStorage.setItem(encodeURIComponent(mParticle.Store.prodStorageName),Base64$1.encode(JSON.stringify(a)));}catch(a){mParticle.Logger.error("Error with setting products on localStorage.");}}function saveUserIdentitiesToCookies(a,b){if(b){var c=getPersistence();c&&(c[a]?c[a].ui=b:c[a]={ui:b},saveCookies(c));}}function saveUserAttributesToCookies(a,b){var c=getPersistence();b&&(c&&(c[a]?c[a].ui=b:c[a]={ui:b}),saveCookies(c));}function saveUserCookieSyncDatesToCookies(a,b){if(b){var c=getPersistence();c&&(c[a]?c[a].csd=b:c[a]={csd:b}),saveCookies(c);}}function saveUserConsentStateToCookies(a,b){//it's currently not supported to set persistence
//for any MPID that's not the current one.
if(b||null===b){var c=getPersistence();c&&(c[a]?c[a].con=Consent.Serialization.toMinifiedJsonObject(b):c[a]={con:Consent.Serialization.toMinifiedJsonObject(b)},saveCookies(c));}}function saveCookies(a){var b,c=encodeCookies(JSON.stringify(a)),d=new Date,e=mParticle.Store.storageName,f=new Date(d.getTime()+1e3*(60*(60*(24*mParticle.Store.SDKConfig.cookieExpiration)))).toGMTString(),g=getCookieDomain();if(b=""===g?"":";domain="+g,mParticle.Store.SDKConfig.useCookieStorage){var h=reduceAndEncodeCookies(a,f,b,mParticle.Store.SDKConfig.maxCookieSize);window.document.cookie=encodeURIComponent(e)+"="+h;}else mParticle.Store.isLocalStorageAvailable&&localStorage.setItem(mParticle.Store.storageName,c);}function getPersistence(){var a;return a=mParticle.Store.SDKConfig.useCookieStorage?getCookie():getLocalStorage(),a}function getConsentState(a){var b=getPersistence();return b&&b[a]&&b[a].con?Consent.Serialization.fromMinifiedJsonObject(b[a].con):null}function getFirstSeenTime(a){if(!a)return null;var b=getPersistence();return b&&b[a]&&b[a].fst?b[a].fst:null}/**
 * set the "first seen" time for a user. the time will only be set once for a given
 * mpid after which subsequent calls will be ignored
 */function setFirstSeenTime(a,b){if(a){b||(b=new Date().getTime());var c=getPersistence();c&&(!c[a]&&(c[a]={}),!c[a].fst&&(c[a].fst=b,saveCookies(c)));}}/**
 * returns the "last seen" time for a user. If the mpid represents the current user, the
 * return value will always be the current time, otherwise it will be to stored "last seen"
 * time
 */function getLastSeenTime(a){if(!a)return null;if(a===mParticle.Identity.getCurrentUser().getMPID())//if the mpid is the current user, its last seen time is the current time
return new Date().getTime();var b=getPersistence();return b&&b[a]&&b[a].lst?b[a].lst:null}function setLastSeenTime(a,b){if(a){b||(b=new Date().getTime());var c=getPersistence();c&&c[a]&&(c[a].lst=b,saveCookies(c));}}function getDeviceId(){return mParticle.Store.deviceId}function resetPersistence(){if(removeLocalStorage(StorageNames$1.localStorageName),removeLocalStorage(StorageNames$1.localStorageNameV3),removeLocalStorage(StorageNames$1.localStorageNameV4),removeLocalStorage(mParticle.Store.prodStorageName),removeLocalStorage(StorageNames$1.localStorageProductsV4),expireCookies(StorageNames$1.cookieName),expireCookies(StorageNames$1.cookieNameV2),expireCookies(StorageNames$1.cookieNameV3),expireCookies(StorageNames$1.cookieNameV4),mParticle._isTestEnv){removeLocalStorage(Helpers.createMainStorageName("abcdef")),expireCookies(Helpers.createMainStorageName("abcdef")),removeLocalStorage(Helpers.createProductStorageName("abcdef"));}}// Forwarder Batching Code
var forwardingStatsBatches={uploadsTable:{},forwardingStatsEventQueue:[]};var Persistence = {useLocalStorage:useLocalStorage,initializeStorage:initializeStorage,update:update,determineLocalStorageAvailability:determineLocalStorageAvailability,getUserProductsFromLS:getUserProductsFromLS,getAllUserProductsFromLS:getAllUserProductsFromLS,setLocalStorage:setLocalStorage,getLocalStorage:getLocalStorage,storeDataInMemory:storeDataInMemory,retrieveDeviceId:retrieveDeviceId,parseDeviceId:parseDeviceId,expireCookies:expireCookies,getCookie:getCookie,setCookie:setCookie,reduceAndEncodeCookies:reduceAndEncodeCookies,findPrevCookiesBasedOnUI:findPrevCookiesBasedOnUI,replaceCommasWithPipes:replaceCommasWithPipes,replacePipesWithCommas:replacePipesWithCommas,replaceApostrophesWithQuotes:replaceApostrophesWithQuotes,replaceQuotesWithApostrophes:replaceQuotesWithApostrophes,createCookieString:createCookieString,revertCookieString:revertCookieString,decodeCookies:decodeCookies,getCookieDomain:getCookieDomain,getUserIdentities:getUserIdentities,getAllUserAttributes:getAllUserAttributes,getCartProducts:getCartProducts,setCartProducts:setCartProducts,saveCookies:saveCookies,saveUserIdentitiesToCookies:saveUserIdentitiesToCookies,saveUserAttributesToCookies:saveUserAttributesToCookies,saveUserCookieSyncDatesToCookies:saveUserCookieSyncDatesToCookies,saveUserConsentStateToCookies:saveUserConsentStateToCookies,getPersistence:getPersistence,getDeviceId:getDeviceId,resetPersistence:resetPersistence,getConsentState:getConsentState,forwardingStatsBatches:forwardingStatsBatches,getFirstSeenTime:getFirstSeenTime,getLastSeenTime:getLastSeenTime,setFirstSeenTime:setFirstSeenTime,setLastSeenTime:setLastSeenTime};

var Messages$2=Constants.Messages,cookieSyncManager={attemptCookieSync:function attemptCookieSync(a,b){var c,d,e,f,g;b&&!mParticle.Store.webviewBridgeEnabled&&mParticle.Store.pixelConfigurations.forEach(function(h){c={moduleId:h.moduleId,frequencyCap:h.frequencyCap,pixelUrl:cookieSyncManager.replaceAmp(h.pixelUrl),redirectUrl:h.redirectUrl?cookieSyncManager.replaceAmp(h.redirectUrl):null},e=cookieSyncManager.replaceMPID(c.pixelUrl,b),f=c.redirectUrl?cookieSyncManager.replaceMPID(c.redirectUrl,b):"",g=e+encodeURIComponent(f);var i=Persistence.getPersistence();return a&&a!==b?void(i&&i[b]&&(!i[b].csd&&(i[b].csd={}),performCookieSync(g,c.moduleId,b,i[b].csd))):void(i[b]&&(!i[b].csd&&(i[b].csd={}),d=i[b].csd[c.moduleId.toString()]?i[b].csd[c.moduleId.toString()]:null,d?new Date().getTime()>new Date(d).getTime()+24*(60*(1e3*(60*c.frequencyCap)))&&performCookieSync(g,c.moduleId,b,i[b].csd):performCookieSync(g,c.moduleId,b,i[b].csd)))});},replaceMPID:function replaceMPID(a,b){return a.replace("%%mpid%%",b)},replaceAmp:function replaceAmp(a){return a.replace(/&amp;/g,"&")}};function performCookieSync(a,b,c,d){var e=document.createElement("img");mParticle.Logger.verbose(Messages$2.InformationMessages.CookieSync),e.src=a,d[b.toString()]=new Date().getTime(),Persistence.saveUserCookieSyncDatesToCookies(c,d);}

var MessageType$1=Types.MessageType,ApplicationTransitionType$1=Types.ApplicationTransitionType,parseNumber$1=Helpers.parseNumber;function convertCustomFlags(a,b){var c=[];for(var d in b.flags={},a.CustomFlags)c=[],a.CustomFlags.hasOwnProperty(d)&&(Array.isArray(a.CustomFlags[d])?a.CustomFlags[d].forEach(function(a){("number"==typeof a||"string"==typeof a||"boolean"==typeof a)&&c.push(a.toString());}):("number"==typeof a.CustomFlags[d]||"string"==typeof a.CustomFlags[d]||"boolean"==typeof a.CustomFlags[d])&&c.push(a.CustomFlags[d].toString()),c.length&&(b.flags[d]=c));}function appendUserInfo(a,b){if(b){if(!a)return b.MPID=null,b.ConsentState=null,b.UserAttributes=null,void(b.UserIdentities=null);if(!(b.MPID&&b.MPID===a.getMPID())){b.MPID=a.getMPID(),b.ConsentState=a.getConsentState(),b.UserAttributes=a.getAllUserAttributes();var c=a.getUserIdentities().userIdentities,d={};for(var e in c){var f=Types.IdentityType.getIdentityType(e);!1!==f&&(d[f]=c[e]);}var g=[];if(Helpers.isObject(d)&&Object.keys(d).length)for(var h in d){var i={};i.Identity=d[h],i.Type=Helpers.parseNumber(h),g.push(i);}b.UserIdentities=g;}}}function convertProductListToDTO(a){return a?a.map(function(a){return convertProductToDTO(a)}):[]}function convertProductToDTO(a){return {id:Helpers.parseStringOrNumber(a.Sku),nm:Helpers.parseStringOrNumber(a.Name),pr:parseNumber$1(a.Price),qt:parseNumber$1(a.Quantity),br:Helpers.parseStringOrNumber(a.Brand),va:Helpers.parseStringOrNumber(a.Variant),ca:Helpers.parseStringOrNumber(a.Category),ps:parseNumber$1(a.Position),cc:Helpers.parseStringOrNumber(a.CouponCode),tpa:parseNumber$1(a.TotalAmount),attrs:a.Attributes}}function convertToConsentStateDTO(a){if(!a)return null;var b={},c=a.getGDPRConsentState();if(c){var d={};for(var e in b.gdpr=d,c)if(c.hasOwnProperty(e)){var f=c[e];b.gdpr[e]={},"boolean"==typeof f.Consented&&(d[e].c=f.Consented),"number"==typeof f.Timestamp&&(d[e].ts=f.Timestamp),"string"==typeof f.ConsentDocument&&(d[e].d=f.ConsentDocument),"string"==typeof f.Location&&(d[e].l=f.Location),"string"==typeof f.HardwareId&&(d[e].h=f.HardwareId);}}return b}function createEventObject(a){var b={},c={},d=a.messageType===Types.MessageType.OptOut?!mParticle.Store.isEnabled:null;if(mParticle.Store.sessionId||a.messageType==Types.MessageType.OptOut||mParticle.Store.webviewBridgeEnabled){c=a.hasOwnProperty("toEventAPIObject")?a.toEventAPIObject():{EventName:a.name||a.messageType,EventCategory:a.eventType,EventAttributes:Helpers.sanitizeAttributes(a.data),EventDataType:a.messageType,CustomFlags:a.customFlags||{}},a.messageType!==Types.MessageType.SessionEnd&&(mParticle.Store.dateLastEventSent=new Date),b={Store:mParticle.Store.serverSettings,SDKVersion:Constants.sdkVersion,SessionId:mParticle.Store.sessionId,SessionStartDate:mParticle.Store.sessionStartDate?mParticle.Store.sessionStartDate.getTime():null,Debug:mParticle.Store.SDKConfig.isDevelopmentMode,Location:mParticle.Store.currentPosition,OptOut:d,ExpandedEventCount:0,AppVersion:mParticle.Store.SDKConfig.appVersion,ClientGeneratedId:mParticle.Store.clientId,DeviceId:mParticle.Store.deviceId,IntegrationAttributes:mParticle.Store.integrationAttributes,CurrencyCode:mParticle.Store.currencyCode},c.CurrencyCode=mParticle.Store.currencyCode;var e=mParticle.Identity.getCurrentUser();return appendUserInfo(e,c),a.messageType===Types.MessageType.SessionEnd&&(c.SessionLength=mParticle.Store.dateLastEventSent.getTime()-mParticle.Store.sessionStartDate.getTime(),c.currentSessionMPIDs=mParticle.Store.currentSessionMPIDs,c.EventAttributes=mParticle.Store.sessionAttributes,mParticle.Store.currentSessionMPIDs=[],mParticle.Store.sessionStartDate=null),b.Timestamp=mParticle.Store.dateLastEventSent.getTime(),Helpers.extend({},c,b)}return null}function convertEventToDTO(a,b){var c={n:a.EventName,et:a.EventCategory,ua:a.UserAttributes,ui:a.UserIdentities,ia:a.IntegrationAttributes,str:a.Store,attrs:a.EventAttributes,sdk:a.SDKVersion,sid:a.SessionId,sl:a.SessionLength,ssd:a.SessionStartDate,dt:a.EventDataType,dbg:a.Debug,ct:a.Timestamp,lc:a.Location,o:a.OptOut,eec:a.ExpandedEventCount,av:a.AppVersion,cgid:a.ClientGeneratedId,das:a.DeviceId,mpid:a.MPID,smpids:a.currentSessionMPIDs},d=convertToConsentStateDTO(a.ConsentState);return d&&(c.con=d),a.EventDataType===MessageType$1.AppStateTransition&&(c.fr=b,c.iu=!1,c.at=ApplicationTransitionType$1.AppInit,c.lr=window.location.href||null,c.attrs=null),a.CustomFlags&&convertCustomFlags(a,c),a.EventDataType===MessageType$1.Commerce?(c.cu=a.CurrencyCode,a.ShoppingCart&&(c.sc={pl:convertProductListToDTO(a.ShoppingCart.ProductList)}),a.ProductAction?c.pd={an:a.ProductAction.ProductActionType,cs:parseNumber$1(a.ProductAction.CheckoutStep),co:a.ProductAction.CheckoutOptions,pl:convertProductListToDTO(a.ProductAction.ProductList),ti:a.ProductAction.TransactionId,ta:a.ProductAction.Affiliation,tcc:a.ProductAction.CouponCode,tr:parseNumber$1(a.ProductAction.TotalAmount),ts:parseNumber$1(a.ProductAction.ShippingAmount),tt:parseNumber$1(a.ProductAction.TaxAmount)}:a.PromotionAction?c.pm={an:a.PromotionAction.PromotionActionType,pl:a.PromotionAction.PromotionList.map(function(a){return {id:a.Id,nm:a.Name,cr:a.Creative,ps:a.Position?a.Position:0}})}:a.ProductImpressions&&(c.pi=a.ProductImpressions.map(function(a){return {pil:a.ProductImpressionList,pl:convertProductListToDTO(a.ProductList)}}))):a.EventDataType===MessageType$1.Profile&&(c.pet=a.ProfileMessageType),c}var ServerModel = {createEventObject:createEventObject,convertEventToDTO:convertEventToDTO,convertToConsentStateDTO:convertToConsentStateDTO,appendUserInfo:appendUserInfo};

function getFilteredMparticleUser(a,b){return {getUserIdentities:function getUserIdentities(){var c={},d=Persistence.getUserIdentities(a);for(var e in d)d.hasOwnProperty(e)&&(c[Types.IdentityType.getIdentityName(Helpers.parseNumber(e))]=d[e]);return c=Helpers.filterUserIdentitiesForForwarders(c,b.userIdentityFilters),{userIdentities:c}},getMPID:function getMPID(){return a},getUserAttributesLists:function getUserAttributesLists(a){var b,c={};for(var d in b=this.getAllUserAttributes(),b)b.hasOwnProperty(d)&&Array.isArray(b[d])&&(c[d]=b[d].slice());return c=Helpers.filterUserAttributes(c,a.userAttributeFilters),c},getAllUserAttributes:function getAllUserAttributes(){var c={},d=Persistence.getAllUserAttributes(a);if(d)for(var e in d)d.hasOwnProperty(e)&&(c[e]=Array.isArray(d[e])?d[e].slice():d[e]);return c=Helpers.filterUserAttributes(c,b.userAttributeFilters),c}}}

function initForwarders(a,b){var c=mParticle.Identity.getCurrentUser();!mParticle.Store.webviewBridgeEnabled&&mParticle.Store.configuredForwarders&&(mParticle.Store.configuredForwarders.sort(function(a,b){return a.settings.PriorityValue=a.settings.PriorityValue||0,b.settings.PriorityValue=b.settings.PriorityValue||0,-1*(a.settings.PriorityValue-b.settings.PriorityValue)}),mParticle.Store.activeForwarders=mParticle.Store.configuredForwarders.filter(function(d){if(!isEnabledForUserConsent(d.filteringConsentRuleValues,c))return !1;if(!isEnabledForUserAttributes(d.filteringUserAttributeValue,c))return !1;if(!isEnabledForUnknownUser(d.excludeAnonymousUser,c))return !1;var e=Helpers.filterUserIdentities(a,d.userIdentityFilters),f=Helpers.filterUserAttributes(c?c.getAllUserAttributes():{},d.userAttributeFilters);return d.initialized||(d.init(d.settings,b,!1,null,f,e,mParticle.Store.SDKConfig.appVersion,mParticle.Store.SDKConfig.appName,mParticle.Store.SDKConfig.customFlags,mParticle.Store.clientId),d.initialized=!0),!0}));}function isEnabledForUserConsent(a,b){if(!a||!a.values||!a.values.length)return !0;if(!b)return !1;var c={},d=b.getConsentState();if(d){var e=d.getGDPRConsentState();if(e)for(var f in e)if(e.hasOwnProperty(f)){var g=Helpers.generateHash("1"+f).toString();c[g]=e[f].Consented;}}var h=!1;return a.values.forEach(function(a){if(!h){var b=a.consentPurpose,d=a.hasConsented;c.hasOwnProperty(b)&&c[b]===d&&(h=!0);}}),a.includeOnMatch===h}function isEnabledForUserAttributes(a,b){if(!a||!Helpers.isObject(a)||!Object.keys(a).length)return !0;var c,d,e;if(!b)return !1;e=b.getAllUserAttributes();var f=!1;try{if(e&&Helpers.isObject(e)&&Object.keys(e).length)for(var g in e)if(e.hasOwnProperty(g)&&(c=Helpers.generateHash(g).toString(),d=Helpers.generateHash(e[g]).toString(),c===a.userAttributeName&&d===a.userAttributeValue)){f=!0;break}return !a||a.includeOnMatch===f}catch(a){// in any error scenario, err on side of returning true and forwarding event
return !0}}function isEnabledForUnknownUser(a,b){return !!(b&&b.isLoggedIn()||!a)}function applyToForwarders(a,b){mParticle.Store.activeForwarders.length&&mParticle.Store.activeForwarders.forEach(function(c){var d=c[a];if(d)try{var e=c[a](b);e&&mParticle.Logger.verbose(e);}catch(a){mParticle.Logger.verbose(a);}});}function sendEventToForwarders(a){var b,c,d,e=function(a,b){a.UserIdentities&&a.UserIdentities.length&&a.UserIdentities.forEach(function(c,d){Helpers.inArray(b,c.Type)&&(a.UserIdentities.splice(d,1),0<d&&d--);});},f=function(a,b){var c;if(b)for(var d in a.EventAttributes)a.EventAttributes.hasOwnProperty(d)&&(c=Helpers.generateHash(a.EventCategory+a.EventName+d),Helpers.inArray(b,c)&&delete a.EventAttributes[d]);},g=function(a,b){return !!(a&&a.length&&Helpers.inArray(a,b))},h=[Types.MessageType.PageEvent,Types.MessageType.PageView,Types.MessageType.Commerce];if(!mParticle.Store.webviewBridgeEnabled&&mParticle.Store.activeForwarders){c=Helpers.generateHash(a.EventCategory+a.EventName),d=Helpers.generateHash(a.EventCategory);for(var j=0;j<mParticle.Store.activeForwarders.length;j++){// Check attribute forwarding rule. This rule allows users to only forward an event if a
// specific attribute exists and has a specific value. Alternatively, they can specify
// that an event not be forwarded if the specified attribute name and value exists.
// The two cases are controlled by the "includeOnMatch" boolean value.
// Supported message types for attribute forwarding rules are defined in the forwardingRuleMessageTypes array
if(-1<h.indexOf(a.EventDataType)&&mParticle.Store.activeForwarders[j].filteringEventAttributeValue&&mParticle.Store.activeForwarders[j].filteringEventAttributeValue.eventAttributeName&&mParticle.Store.activeForwarders[j].filteringEventAttributeValue.eventAttributeValue){var k=null;// Attempt to find the attribute in the collection of event attributes
if(a.EventAttributes)for(var l in a.EventAttributes){var m;if(m=Helpers.generateHash(l).toString(),m===mParticle.Store.activeForwarders[j].filteringEventAttributeValue.eventAttributeName&&(k={name:m,value:Helpers.generateHash(a.EventAttributes[l]).toString()}),k)break}var n=null!==k&&k.value===mParticle.Store.activeForwarders[j].filteringEventAttributeValue.eventAttributeValue,o=!0===mParticle.Store.activeForwarders[j].filteringEventAttributeValue.includeOnMatch?n:!n;if(!o)continue}// Clone the event object, as we could be sending different attributes to each forwarder
// Check event filtering rules
if(b={},b=Helpers.extend(!0,b,a),a.EventDataType===Types.MessageType.PageEvent&&(g(mParticle.Store.activeForwarders[j].eventNameFilters,c)||g(mParticle.Store.activeForwarders[j].eventTypeFilters,d)))continue;else if(a.EventDataType===Types.MessageType.Commerce&&g(mParticle.Store.activeForwarders[j].eventTypeFilters,d))continue;else if(a.EventDataType===Types.MessageType.PageView&&g(mParticle.Store.activeForwarders[j].screenNameFilters,c))continue;// Check attribute filtering rules
if(b.EventAttributes&&(a.EventDataType===Types.MessageType.PageEvent?f(b,mParticle.Store.activeForwarders[j].attributeFilters):a.EventDataType===Types.MessageType.PageView&&f(b,mParticle.Store.activeForwarders[j].pageViewAttributeFilters)),e(b,mParticle.Store.activeForwarders[j].userIdentityFilters),b.UserAttributes=Helpers.filterUserAttributes(b.UserAttributes,mParticle.Store.activeForwarders[j].userAttributeFilters),mParticle.Logger.verbose("Sending message to forwarder: "+mParticle.Store.activeForwarders[j].name),mParticle.Store.activeForwarders[j].process){var p=mParticle.Store.activeForwarders[j].process(b);p&&mParticle.Logger.verbose(p);}}}}function callSetUserAttributeOnForwarders(a,b){mParticle.Store.activeForwarders.length&&mParticle.Store.activeForwarders.forEach(function(c){if(c.setUserAttribute&&c.userAttributeFilters&&!Helpers.inArray(c.userAttributeFilters,Helpers.generateHash(a)))try{var d=c.setUserAttribute(a,b);d&&mParticle.Logger.verbose(d);}catch(a){mParticle.Logger.error(a);}});}function setForwarderUserIdentities(a){mParticle.Store.activeForwarders.forEach(function(b){var c=Helpers.filterUserIdentities(a,b.userIdentityFilters);b.setUserIdentity&&c.forEach(function(a){var c=b.setUserIdentity(a.Identity,a.Type);c&&mParticle.Logger.verbose(c);});});}function setForwarderOnUserIdentified(a){mParticle.Store.activeForwarders.forEach(function(b){var c=getFilteredMparticleUser(a.getMPID(),b);if(b.onUserIdentified){var d=b.onUserIdentified(c);d&&mParticle.Logger.verbose(d);}});}function setForwarderOnIdentityComplete(a,b){var c;mParticle.Store.activeForwarders.forEach(function(d){var e=getFilteredMparticleUser(a.getMPID(),d);"identify"===b?d.onIdentifyComplete&&(c=d.onIdentifyComplete(e),c&&mParticle.Logger.verbose(c)):"login"===b?d.onLoginComplete&&(c=d.onLoginComplete(e),c&&mParticle.Logger.verbose(c)):"logout"===b?d.onLogoutComplete&&(c=d.onLogoutComplete(e),c&&mParticle.Logger.verbose(c)):"modify"==b&&d.onModifyComplete&&(c=d.onModifyComplete(e),c&&mParticle.Logger.verbose(c));});}function getForwarderStatsQueue(){return Persistence.forwardingStatsBatches.forwardingStatsEventQueue}function setForwarderStatsQueue(a){Persistence.forwardingStatsBatches.forwardingStatsEventQueue=a;}function configureForwarder(a){var b=null,c=a,d={};// if there are kits inside of mParticle.Store.SDKConfig.kits, then mParticle is self hosted
for(var e in Helpers.isObject(mParticle.Store.SDKConfig.kits)&&0<Object.keys(mParticle.Store.SDKConfig.kits).length?d=mParticle.Store.SDKConfig.kits:0<mParticle.preInit.forwarderConstructors.length&&mParticle.preInit.forwarderConstructors.forEach(function(a){d[a.name]=a;}),d)if(e===c.name&&(c.isDebug===mParticle.Store.SDKConfig.isDevelopmentMode||c.isSandbox===mParticle.Store.SDKConfig.isDevelopmentMode)){b=new d[e].constructor,b.id=c.moduleId,b.isSandbox=c.isDebug||c.isSandbox,b.hasSandbox="true"===c.hasDebugString,b.isVisible=c.isVisible,b.settings=c.settings,b.eventNameFilters=c.eventNameFilters,b.eventTypeFilters=c.eventTypeFilters,b.attributeFilters=c.attributeFilters,b.screenNameFilters=c.screenNameFilters,b.screenNameFilters=c.screenNameFilters,b.pageViewAttributeFilters=c.pageViewAttributeFilters,b.userIdentityFilters=c.userIdentityFilters,b.userAttributeFilters=c.userAttributeFilters,b.filteringEventAttributeValue=c.filteringEventAttributeValue,b.filteringUserAttributeValue=c.filteringUserAttributeValue,b.eventSubscriptionId=c.eventSubscriptionId,b.filteringConsentRuleValues=c.filteringConsentRuleValues,b.excludeAnonymousUser=c.excludeAnonymousUser,mParticle.Store.configuredForwarders.push(b);break}}function configurePixel(a){(a.isDebug===mParticle.Store.SDKConfig.isDevelopmentMode||a.isProduction!==mParticle.Store.SDKConfig.isDevelopmentMode)&&mParticle.Store.pixelConfigurations.push(a);}function processForwarders(a,b){if(!a)mParticle.Logger.warning("No config was passed. Cannot process forwarders");else try{Array.isArray(a.kitConfigs)&&a.kitConfigs.length&&a.kitConfigs.forEach(function(a){configureForwarder(a);}),Array.isArray(a.pixelConfigs)&&a.pixelConfigs.length&&a.pixelConfigs.forEach(function(a){configurePixel(a);}),initForwarders(mParticle.Store.SDKConfig.identifyRequest.userIdentities,b);}catch(a){mParticle.Logger.error("Config was not parsed propertly. Forwarders may not be initialized.");}}var Forwarders = {initForwarders:initForwarders,applyToForwarders:applyToForwarders,sendEventToForwarders:sendEventToForwarders,callSetUserAttributeOnForwarders:callSetUserAttributeOnForwarders,setForwarderUserIdentities:setForwarderUserIdentities,setForwarderOnUserIdentified:setForwarderOnUserIdentified,setForwarderOnIdentityComplete:setForwarderOnIdentityComplete,getForwarderStatsQueue:getForwarderStatsQueue,setForwarderStatsQueue:setForwarderStatsQueue,isEnabledForUserConsent:isEnabledForUserConsent,isEnabledForUserAttributes:isEnabledForUserAttributes,configurePixel:configurePixel,processForwarders:processForwarders};

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

  function AsyncIterator(generator) {
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
          return Promise.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function(unwrapped) {
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
        return new Promise(function(resolve, reject) {
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
  exports.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
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

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }
}

var arrayWithoutHoles = _arrayWithoutHoles;

function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

var iterableToArray = _iterableToArray;

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

var nonIterableSpread = _nonIterableSpread;

function _toConsumableArray(arr) {
  return arrayWithoutHoles(arr) || iterableToArray(arr) || nonIterableSpread();
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

var SDKProductActionType;
(function (a) { a[a.Unknown = 0] = "Unknown", a[a.AddToCart = 1] = "AddToCart", a[a.RemoveFromCart = 2] = "RemoveFromCart", a[a.Checkout = 3] = "Checkout", a[a.CheckoutOption = 4] = "CheckoutOption", a[a.Click = 5] = "Click", a[a.ViewDetail = 6] = "ViewDetail", a[a.Purchase = 7] = "Purchase", a[a.Refund = 8] = "Refund", a[a.AddToWishlist = 9] = "AddToWishlist", a[a.RemoveFromWishlist = 10] = "RemoveFromWishlist"; })(SDKProductActionType || (SDKProductActionType = {}));

function convertEvents(a, b) { if (!a)
    return null; if (!b || 1 > b.length)
    return null; var c = [], d = null, e = !0, f = !1, g = void 0; try {
    for (var h, i, j = b[Symbol.iterator](); !(e = (h = j.next()).done); e = !0)
        if (i = h.value, i) {
            d = i;
            var l = convertEvent(i);
            l && c.push(l);
        }
}
catch (a) {
    f = !0, g = a;
}
finally {
    try {
        e || null == j["return"] || j["return"]();
    }
    finally {
        if (f)
            throw g;
    }
} if (!d)
    return null; var k = { source_request_id: Helpers.generateUniqueId(), mpid: a, timestamp_unixtime_ms: new Date().getTime(), environment: d.Debug ? "development" : "production", events: c, mp_deviceid: d.DeviceId, sdk_version: d.SDKVersion, application_info: { application_version: d.AppVersion }, device_info: { platform: "web", screen_width: window.screen.width, screen_height: window.screen.height }, user_attributes: d.UserAttributes, user_identities: convertUserIdentities(d.UserIdentities), consent_state: convertConsentState(d.ConsentState), integration_attributes: d.IntegrationAttributes }; return k; }
function convertConsentState(a) { if (!a)
    return null; var b = { gdpr: convertGdprConsentState(a.getGDPRConsentState()) }; return b; }
function convertGdprConsentState(a) { if (!a)
    return null; var b = {}; for (var c in a)
    a.hasOwnProperty(c) && (b[c] = { consented: a[c].Consented, hardware_id: a[c].HardwareId, document: a[c].ConsentDocument, timestamp_unixtime_ms: a[c].Timestamp, location: a[c].Location }); return b; }
function convertUserIdentities(a) { if (!a || !a.length)
    return null; var b = {}, c = !0, d = !1, e = void 0; try {
    for (var f, g, h = a[Symbol.iterator](); !(c = (f = h.next()).done); c = !0)
        switch (g = f.value, g.Type) {
            case Types.IdentityType.CustomerId:
                b.customer_id = g.Identity;
                break;
            case Types.IdentityType.Email:
                b.email = g.Identity;
                break;
            case Types.IdentityType.Facebook:
                b.facebook = g.Identity;
                break;
            case Types.IdentityType.FacebookCustomAudienceId:
                b.facebook_custom_audience_id = g.Identity;
                break;
            case Types.IdentityType.Google:
                b.google = g.Identity;
                break;
            case Types.IdentityType.Microsoft:
                b.microsoft = g.Identity;
                break;
            case Types.IdentityType.Other:
                b.other = g.Identity;
                break;
            case Types.IdentityType.Other2:
                b.other_id_2 = g.Identity;
                break;
            case Types.IdentityType.Other3:
                b.other_id_3 = g.Identity;
                break;
            case Types.IdentityType.Other4:
                b.other_id_4 = g.Identity;
                break;
            default:
        }
}
catch (a) {
    d = !0, e = a;
}
finally {
    try {
        c || null == h["return"] || h["return"]();
    }
    finally {
        if (d)
            throw e;
    }
} return b; }
function convertEvent(a) {
    if (!a)
        return null;
    switch (a.EventDataType) {
        case Types.MessageType.AppStateTransition: return convertAST(a);
        case Types.MessageType.Commerce: return convertCommerceEvent(a);
        case Types.MessageType.CrashReport: return convertCrashReportEvent(a);
        case Types.MessageType.OptOut: return convertOptOutEvent(a);
        case Types.MessageType.PageEvent: return convertCustomEvent(a);
        case Types.MessageType.PageView: return convertPageViewEvent(a);
        case Types.MessageType.Profile: //deprecated and not supported by the web SDK
            return null;
        case Types.MessageType.SessionEnd: return convertSessionEndEvent(a);
        case Types.MessageType.SessionStart: return convertSessionStartEvent(a);
        default:
    }
    return null;
}
function convertProductActionType(a) { if (!a)
    return "unknown"; return a === SDKProductActionType.AddToCart ? "add_to_cart" : a === SDKProductActionType.AddToWishlist ? "add_to_wishlist" : a === SDKProductActionType.Checkout ? "checkout" : a === SDKProductActionType.CheckoutOption ? "checkout_option" : a === SDKProductActionType.Click ? "click" : a === SDKProductActionType.Purchase ? "purchase" : a === SDKProductActionType.Refund ? "refund" : a === SDKProductActionType.RemoveFromCart ? "remove_from_cart" : a === SDKProductActionType.RemoveFromWishlist ? "remove_from_wish_list" : a === SDKProductActionType.ViewDetail ? "view_detail" : "unknown"; }
function convertProductAction(a) { if (!a.ProductAction)
    return null; var b = { action: convertProductActionType(a.ProductAction.ProductActionType), checkout_step: a.ProductAction.CheckoutStep, checkout_options: a.ProductAction.CheckoutOptions, transaction_id: a.ProductAction.TransactionId, affiliation: a.ProductAction.Affiliation, total_amount: a.ProductAction.TotalAmount, tax_amount: a.ProductAction.TaxAmount, shipping_amount: a.ProductAction.ShippingAmount, coupon_code: a.ProductAction.CouponCode, products: convertProducts(a.ProductAction.ProductList) }; return b; }
function convertProducts(a) { if (!a || !a.length)
    return null; var b = [], c = !0, d = !1, e = void 0; try {
    for (var f, g = a[Symbol.iterator](); !(c = (f = g.next()).done); c = !0) {
        var h = f.value, i = { id: h.Sku, name: h.Name, brand: h.Brand, category: h.Category, variant: h.Variant, total_product_amount: h.TotalAmount, position: h.Position, price: h.Price, quantity: h.Quantity, coupon_code: h.CouponCode, custom_attributes: h.Attributes };
        b.push(i);
    }
}
catch (a) {
    d = !0, e = a;
}
finally {
    try {
        c || null == g["return"] || g["return"]();
    }
    finally {
        if (d)
            throw e;
    }
} return b; }
function convertPromotionAction(a) { if (!a.PromotionAction)
    return null; var b = { action: a.PromotionAction.PromotionActionType, promotions: convertPromotions(a.PromotionAction.PromotionList) }; return b; }
function convertPromotions(a) { if (!a || !a.length)
    return null; var b = [], c = !0, d = !1, e = void 0; try {
    for (var f, g = a[Symbol.iterator](); !(c = (f = g.next()).done); c = !0) {
        var h = f.value, i = { id: h.Id, name: h.Name, creative: h.Creative, position: h.Position };
        b.push(i);
    }
}
catch (a) {
    d = !0, e = a;
}
finally {
    try {
        c || null == g["return"] || g["return"]();
    }
    finally {
        if (d)
            throw e;
    }
} return b; }
function convertImpressions(a) { if (!a.ProductImpressions)
    return null; var b = [], c = !0, d = !1, e = void 0; try {
    for (var f, g = a.ProductImpressions[Symbol.iterator](); !(c = (f = g.next()).done); c = !0) {
        var h = f.value, i = { product_impression_list: h.ProductImpressionList, products: convertProducts(h.ProductList) };
        b.push(i);
    }
}
catch (a) {
    d = !0, e = a;
}
finally {
    try {
        c || null == g["return"] || g["return"]();
    }
    finally {
        if (d)
            throw e;
    }
} return b; }
function convertShoppingCart(a) { if (!a.ShoppingCart || !a.ShoppingCart.ProductList || !a.ShoppingCart.ProductList.length)
    return null; var b = { products: convertProducts(a.ShoppingCart.ProductList) }; return b; }
function convertCommerceEvent(a) { var b = convertBaseEventData(a), c = { custom_flags: a.CustomFlags, product_action: convertProductAction(a), promotion_action: convertPromotionAction(a), product_impressions: convertImpressions(a), shopping_cart: convertShoppingCart(a), currency_code: a.CurrencyCode }; return c = Object.assign(c, b), { event_type: "commerce_event", data: c }; }
function convertCrashReportEvent(a) { var b = convertBaseEventData(a), c = { message: a.EventName }; return c = Object.assign(c, b), { event_type: "crash_report", data: c }; }
function convertAST(a) { var b = convertBaseEventData(a), c = { application_transition_type: "application_initialized", is_first_run: a.IsFirstRun, is_upgrade: !1 }; return c = Object.assign(c, b), { event_type: "application_state_transition", data: c }; }
function convertSessionEndEvent(a) {
    var b = convertBaseEventData(a), c = { session_duration_ms: a.SessionLength //note: External Events DTO does not support the session mpids array as of this time.
        //spanning_mpids: sdkEvent.SessionMpids
    };
    return c = Object.assign(c, b), { event_type: "session_end", data: c };
}
function convertSessionStartEvent(a) { var b = convertBaseEventData(a), c = {}; return c = Object.assign(c, b), { event_type: "session_start", data: c }; }
function convertPageViewEvent(a) { var b = convertBaseEventData(a), c = { custom_flags: a.CustomFlags, screen_name: a.EventName }; return c = Object.assign(c, b), { event_type: "screen_view", data: c }; }
function convertOptOutEvent(a) { var b = convertBaseEventData(a), c = { is_opted_out: a.OptOut }; return c = Object.assign(c, b), { event_type: "opt_out", data: c }; }
function convertCustomEvent(a) { var b = convertBaseEventData(a), c = { custom_event_type: convertSdkEventType(a.EventCategory), custom_flags: a.CustomFlags, event_name: a.EventName }; return c = Object.assign(c, b), { event_type: "custom_event", data: c }; }
function convertSdkEventType(a) { return a === Types.EventType.Other ? "other" : a === Types.EventType.Location ? "location" : a === Types.EventType.Navigation ? "navigation" : a === Types.EventType.Search ? "search" : a === Types.EventType.Social ? "social" : a === Types.EventType.Transaction ? "transaction" : a === Types.EventType.UserContent ? "user_content" : a === Types.EventType.UserPreference ? "user_preference" : a === Types.CommerceEventType.ProductAddToCart ? "add_to_cart" : a === Types.CommerceEventType.ProductAddToWishlist ? "add_to_wishlist" : a === Types.CommerceEventType.ProductCheckout ? "checkout" : a === Types.CommerceEventType.ProductCheckoutOption ? "checkout_option" : a === Types.CommerceEventType.ProductClick ? "click" : a === Types.CommerceEventType.ProductImpression ? "impression" : a === Types.CommerceEventType.ProductPurchase ? "purchase" : a === Types.CommerceEventType.ProductRefund ? "refund" : a === Types.CommerceEventType.ProductRemoveFromCart ? "remove_from_cart" : a === Types.CommerceEventType.ProductRemoveFromWishlist ? "remove_from_wishlist" : a === Types.CommerceEventType.ProductViewDetail ? "view_detail" : a === Types.CommerceEventType.PromotionClick ? "promotion_click" : a === Types.CommerceEventType.PromotionView ? "promotion_view" : "unknown"; }
function convertBaseEventData(a) { var b = { timestamp_unixtime_ms: a.Timestamp, session_uuid: a.SessionId, session_start_unixtime_ms: a.SessionStartDate, custom_attributes: a.EventAttributes, location: a.Location }; return b; }

var BatchUploader = /*#__PURE__*/ function () {
    function a(b, c) { var d = this; classCallCheck(this, a), defineProperty(this, "uploadIntervalMillis", void 0), defineProperty(this, "pendingEvents", void 0), defineProperty(this, "pendingUploads", void 0), defineProperty(this, "webSdk", void 0), defineProperty(this, "uploadUrl", void 0), defineProperty(this, "batchingEnabled", void 0), this.webSdk = b, this.uploadIntervalMillis = c, this.batchingEnabled = c >= a.MINIMUM_INTERVAL_MILLIS, this.uploadIntervalMillis < a.MINIMUM_INTERVAL_MILLIS && (this.uploadIntervalMillis = a.MINIMUM_INTERVAL_MILLIS), this.pendingEvents = [], this.pendingUploads = []; var e = this.webSdk.Store, f = e.SDKConfig, g = e.devToken, h = Helpers.createServiceUrl(f.v3SecureServiceUrl, g); this.uploadUrl = "".concat(h, "/events"), setTimeout(function () { d.prepareAndUpload(!0, !1); }, this.uploadIntervalMillis), this.addEventListeners(); }
    return createClass(a, [{ key: "addEventListeners", value: function addEventListeners() { var a = this; window.addEventListener("beforeunload", function () { a.prepareAndUpload(!1, a.isBeaconAvailable()); }), window.addEventListener("pagehide", function () { a.prepareAndUpload(!1, a.isBeaconAvailable()); }); } }, { key: "isBeaconAvailable", value: function isBeaconAvailable() { return !!navigator.sendBeacon; } }, { key: "queueEvent", value: function queueEvent(a) { a && (a.IsFirstRun = this.webSdk.Store.isFirstRun, this.pendingEvents.push(a), this.webSdk.Logger.verbose("Queuing event: ".concat(JSON.stringify(a))), this.webSdk.Logger.verbose("Queued event count: ".concat(this.pendingEvents.length)), !this.batchingEnabled && this.prepareAndUpload(!1, !1)); } /**
                 * This implements crucial logic to:
                 * - bucket pending events by MPID, and then by Session, and upload individual batches for each bucket.
                 *
                 * In the future this should enforce other requirements such as maximum batch size.
                 *
                 * @param sdkEvents current pending events
                 * @param defaultUser the user to reference for events that are missing data
                 */
        }, { key: "prepareAndUpload",
            value: function () { var b = asyncToGenerator(/*#__PURE__*/ regenerator.mark(function b(c, d) { var e, f, g, h, i, j, k, l = this; return regenerator.wrap(function (b) { for (;;)
                switch (b.prev = b.next) {
                    case 0: return e = this.webSdk.Identity.getCurrentUser(), f = this.pendingEvents, this.pendingEvents = [], g = a.createNewUploads(f, e), g && g.length && (h = this.pendingUploads).push.apply(h, toConsumableArray(g)), i = this.pendingUploads, this.pendingUploads = [], b.next = 9, this.upload(this.webSdk.Logger, i, d);
                    case 9: j = b.sent, j && j.length && (k = this.pendingUploads).unshift.apply(k, toConsumableArray(j)), c && setTimeout(function () { l.prepareAndUpload(!0, !1); }, this.uploadIntervalMillis);
                    case 12:
                    case "end": return b.stop();
                } }, b, this); })); return function prepareAndUpload() { return b.apply(this, arguments); }; }() }, { key: "upload", value: function () { var b = asyncToGenerator(/*#__PURE__*/ regenerator.mark(function b(c, d, e) { var f, g, h, j; return regenerator.wrap(function (b) { for (;;)
                switch (b.prev = b.next) {
                    case 0:
                        if (d && !(1 > d.length)) {
                            b.next = 2;
                            break;
                        }
                        return b.abrupt("return", null);
                    case 2: c.verbose("Uploading batches: ".concat(JSON.stringify(d))), c.verbose("Batch count: ".concat(d.length)), f = 0;
                    case 5:
                        if (!(f < d.length)) {
                            b.next = 37;
                            break;
                        }
                        if (g = { method: "POST", headers: { Accept: a.CONTENT_TYPE, "Content-Type": "text/plain;charset=UTF-8" }, body: JSON.stringify(d[f]) }, b.prev = 7, !e) {
                            b.next = 13;
                            break;
                        }
                        h = new Blob([g.body], { type: "text/plain;charset=UTF-8" }), navigator.sendBeacon(this.uploadUrl, h), b.next = 28;
                        break;
                    case 13: return c.verbose("Uploading request ID: ".concat(d[f].source_request_id)), b.next = 16, fetch(this.uploadUrl, g);
                    case 16:
                        if (j = b.sent, !j.ok) {
                            b.next = 21;
                            break;
                        }
                        c.verbose("Upload success for request ID: ".concat(d[f].source_request_id)), b.next = 28;
                        break;
                    case 21:
                        if (!(500 <= j.status || 429 === j.status)) {
                            b.next = 25;
                            break;
                        }
                        return b.abrupt("return", d.slice(f, d.length));
                    case 25:
                        if (!(401 <= j.status)) {
                            b.next = 28;
                            break;
                        }
                        return c.error("HTTP error status ".concat(j.status, " while uploading - please verify your API key.")), b.abrupt("return", null);
                    case 28:
                        b.next = 34;
                        break;
                    case 30: return b.prev = 30, b.t0 = b["catch"](7), c.error("Exception while uploading: ".concat(b.t0)), b.abrupt("return", d.slice(f, d.length));
                    case 34:
                        f++, b.next = 5;
                        break;
                    case 37: return b.abrupt("return", null);
                    case 38:
                    case "end": return b.stop();
                } }, b, this, [[7, 30]]); })); return function upload() { return b.apply(this, arguments); }; }() }], [{ key: "createNewUploads", value: function createNewUploads(a, b) {
                if (!b || !a || !a.length)
                    return null; //bucket by MPID, and then by session, ordered by timestamp
                var c = [], d = new Map, e = !0, f = !1, g = void 0;
                try {
                    for (var h, i, j = a[Symbol.iterator](); !(e = (h = j.next()).done); e = !0) { //on initial startup, there may be events logged without an mpid.
                        if (i = h.value, !i.MPID) {
                            var B = b.getMPID();
                            i.MPID = B;
                        }
                        var C = d.get(i.MPID);
                        C || (C = []), C.push(i), d.set(i.MPID, C);
                    }
                }
                catch (a) {
                    f = !0, g = a;
                }
                finally {
                    try {
                        e || null == j["return"] || j["return"]();
                    }
                    finally {
                        if (f)
                            throw g;
                    }
                }
                for (var k = 0, l = Array.from(d.entries()); k < l.length; k++) {
                    var m = l[k], n = m[0], o = m[1], p = new Map, q = !0, r = !1, s = void 0;
                    try {
                        for (var t, u = o[Symbol.iterator](); !(q = (t = u.next()).done); q = !0) {
                            var v = t.value, w = p.get(v.SessionId);
                            w || (w = []), w.push(v), p.set(v.SessionId, w);
                        }
                    }
                    catch (a) {
                        r = !0, s = a;
                    }
                    finally {
                        try {
                            q || null == u["return"] || u["return"]();
                        }
                        finally {
                            if (r)
                                throw s;
                        }
                    }
                    for (var x = 0, y = Array.from(p.entries()); x < y.length; x++) {
                        var z = y[x], A = convertEvents(n, z[1]);
                        A && c.push(A);
                    }
                }
                return c;
            } }]), a;
}();
defineProperty(BatchUploader, "CONTENT_TYPE", "text/plain;charset=UTF-8"), defineProperty(BatchUploader, "MINIMUM_INTERVAL_MILLIS", 500);

var HTTPCodes=Constants.HTTPCodes,Messages$3=Constants.Messages,uploader=null;function queueEventForBatchUpload(a){if(!uploader){var b=Helpers.getFeatureFlag(Constants.FeatureFlags.EventBatchingIntervalMillis);uploader=new BatchUploader(mParticle,b);}uploader.queueEvent(a);}function shouldEnableBatching(){if(!window.fetch)return !1;var a=Helpers.getFeatureFlag(Constants.FeatureFlags.EventsV3);if(!a||!Helpers.Validators.isNumber(a))return !1;var b=Helpers.getRampNumber(mParticle.Store.deviceId);return a>=b}function processQueuedEvents(){var a,b=mParticle.Identity.getCurrentUser();if(b&&(a=b.getMPID()),mParticle.Store.eventQueue.length&&a){var c=mParticle.Store.eventQueue;mParticle.Store.eventQueue=[],appendUserInfoToEvents(b,c),c.forEach(function(a){sendEventToServer(a);});}}function appendUserInfoToEvents(a,b){b.forEach(function(b){b.MPID||ServerModel.appendUserInfo(a,b);});}function sendEventToServer(a){if(mParticle.Store.webviewBridgeEnabled)return void NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.LogEvent,JSON.stringify(a));var b,c=mParticle.Identity.getCurrentUser();// We queue events if there is no MPID (MPID is null, or === 0), or there are integrations that that require this to stall because integration attributes
// need to be set, or if we are still fetching the config (self hosted only), and so require delaying events
return c&&(b=c.getMPID()),mParticle.Store.requireDelay=Helpers.isDelayedByIntegration(mParticle.preInit.integrationDelays,mParticle.Store.integrationDelayTimeoutStart,Date.now()),b&&!mParticle.Store.requireDelay&&mParticle.Store.configurationLoaded?void(processQueuedEvents(),shouldEnableBatching()?queueEventForBatchUpload(a):sendSingleEventToServer(a),a&&a.EventName!==Types.MessageType.AppStateTransition&&Forwarders.sendEventToForwarders(a)):(mParticle.Logger.verbose("Event was added to eventQueue. eventQueue will be processed once a valid MPID is returned or there is no more integration imposed delay."),void mParticle.Store.eventQueue.push(a))}function sendSingleEventToServer(a){if(a.EventDataType!==Types.MessageType.Media){var b,c=function(){4===b.readyState&&(mParticle.Logger.verbose("Received "+b.statusText+" from server"),parseEventResponse(b.responseText));};if(!a)return void mParticle.Logger.error(Messages$3.ErrorMessages.EventEmpty);if(mParticle.Logger.verbose(Messages$3.InformationMessages.SendHttp),b=Helpers.createXHR(c),b)try{b.open("post",Helpers.createServiceUrl(mParticle.Store.SDKConfig.v2SecureServiceUrl,mParticle.Store.devToken)+"/Events"),b.send(JSON.stringify(ServerModel.convertEventToDTO(a,mParticle.Store.isFirstRun)));}catch(a){mParticle.Logger.error("Error sending event to mParticle servers. "+a);}}}function parseEventResponse(a){var b,c,d,e=new Date;if(a)try{if(mParticle.Logger.verbose("Parsing response from server"),b=JSON.parse(a),b&&b.Store){for(c in mParticle.Logger.verbose("Parsed store from response, updating local settings"),mParticle.Store.serverSettings||(mParticle.Store.serverSettings={}),b.Store)b.Store.hasOwnProperty(c)&&(d=b.Store[c],!d.Value||new Date(d.Expires)<e?mParticle.Store.serverSettings.hasOwnProperty(c)&&delete mParticle.Store.serverSettings[c]:mParticle.Store.serverSettings[c]=d);Persistence.update();}}catch(a){mParticle.Logger.error("Error parsing JSON response from server: "+a.name);}}function sendAliasRequest(a,b){var c,d=function(){if(4===c.readyState){//only parse error messages from failing requests
if(mParticle.Logger.verbose("Received "+c.statusText+" from server"),200!==c.status&&202!==c.status&&c.responseText){var a=JSON.parse(c.responseText);if(a.hasOwnProperty("message")){var d=a.message;return void Helpers.invokeAliasCallback(b,c.status,d)}}Helpers.invokeAliasCallback(b,c.status);}};if(mParticle.Logger.verbose(Messages$3.InformationMessages.SendAliasHttp),c=Helpers.createXHR(d),c)try{c.open("post",Helpers.createServiceUrl(mParticle.Store.SDKConfig.aliasUrl,mParticle.Store.devToken)+"/Alias"),c.send(JSON.stringify(a));}catch(a){Helpers.invokeAliasCallback(b,HTTPCodes.noHttpCoverage,a),mParticle.Logger.error("Error sending alias request to mParticle servers. "+a);}}function sendIdentityRequest(a,b,c,d,e,f){var g,h,i=function(){4===g.readyState&&(mParticle.Logger.verbose("Received "+g.statusText+" from server"),e(g,h,c,d,b));};if(mParticle.Logger.verbose(Messages$3.InformationMessages.SendIdentityBegin),!a)return void mParticle.Logger.error(Messages$3.ErrorMessages.APIRequestEmpty);if(mParticle.Logger.verbose(Messages$3.InformationMessages.SendIdentityHttp),g=Helpers.createXHR(i),g)try{mParticle.Store.identityCallInFlight?Helpers.invokeCallback(c,HTTPCodes.activeIdentityRequest,"There is currently an Identity request processing. Please wait for this to return before requesting again"):(h=f||null,"modify"===b?g.open("post",Helpers.createServiceUrl(mParticle.Store.SDKConfig.identityUrl)+f+"/"+b):g.open("post",Helpers.createServiceUrl(mParticle.Store.SDKConfig.identityUrl)+b),g.setRequestHeader("Content-Type","application/json"),g.setRequestHeader("x-mp-key",mParticle.Store.devToken),mParticle.Store.identityCallInFlight=!0,g.send(JSON.stringify(a)));}catch(a){mParticle.Store.identityCallInFlight=!1,Helpers.invokeCallback(c,HTTPCodes.noHttpCoverage,a),mParticle.Logger.error("Error sending identity request to servers with status code "+g.status+" - "+a);}}function sendBatchForwardingStatsToServer(a,b){var c,d;try{c=Helpers.createServiceUrl(mParticle.Store.SDKConfig.v2SecureServiceUrl,mParticle.Store.devToken),d={uuid:Helpers.generateUniqueId(),data:a},b&&(b.open("post",c+"/Forwarding"),b.send(JSON.stringify(d)));}catch(a){mParticle.Logger.error("Error sending forwarding stats to mParticle servers.");}}function sendSingleForwardingStatsToServer(a){var b,c;try{var d=function(){4===e.readyState&&202===e.status&&mParticle.Logger.verbose("Successfully sent  "+e.statusText+" from server");},e=Helpers.createXHR(d);b=Helpers.createServiceUrl(mParticle.Store.SDKConfig.v1SecureServiceUrl,mParticle.Store.devToken),c=a,e&&(e.open("post",b+"/Forwarding"),e.send(JSON.stringify(c)));}catch(a){mParticle.Logger.error("Error sending forwarding stats to mParticle servers.");}}function getSDKConfiguration(a,b,c){var d;try{var e=function(){4===f.readyState&&(200===f.status?(b=Helpers.extend({},b,JSON.parse(f.responseText)),c(a,b),mParticle.Logger.verbose("Successfully received configuration from server")):(c(a,b),mParticle.Logger.verbose("Issue with receiving configuration from server, received HTTP Code of "+f.status)));},f=Helpers.createXHR(e);d="https://"+mParticle.Store.SDKConfig.configUrl+a+"/config?env=",d+=b.isDevelopmentMode?"1":"0",f&&(f.open("get",d),f.send(null));}catch(d){c(a,b),mParticle.Logger.error("Error getting forwarder configuration from mParticle servers.");}}function prepareForwardingStats(a,b){var c,d=Forwarders.getForwarderStatsQueue();a&&a.isVisible&&(c={mid:a.id,esid:a.eventSubscriptionId,n:b.EventName,attrs:b.EventAttributes,sdk:b.SDKVersion,dt:b.EventDataType,et:b.EventCategory,dbg:b.Debug,ct:b.Timestamp,eec:b.ExpandedEventCount},Helpers.getFeatureFlag(Constants.FeatureFlags.ReportBatching)?(d.push(c),Forwarders.setForwarderStatsQueue(d)):sendSingleForwardingStatsToServer(c));}var ApiClient = {sendEventToServer:sendEventToServer,sendIdentityRequest:sendIdentityRequest,sendBatchForwardingStatsToServer:sendBatchForwardingStatsToServer,sendSingleForwardingStatsToServer:sendSingleForwardingStatsToServer,sendAliasRequest:sendAliasRequest,getSDKConfiguration:getSDKConfiguration,prepareForwardingStats:prepareForwardingStats,processQueuedEvents:processQueuedEvents,appendUserInfoToEvents:appendUserInfoToEvents,shouldEnableBatching:shouldEnableBatching};

var Validators$1=Helpers.Validators,Messages$4=Constants.Messages;function convertTransactionAttributesToProductAction(a,b){b.TransactionId=a.Id,b.Affiliation=a.Affiliation,b.CouponCode=a.CouponCode,b.TotalAmount=a.Revenue,b.ShippingAmount=a.Shipping,b.TaxAmount=a.Tax;}function getProductActionEventName(a){switch(a){case Types.ProductActionType.AddToCart:return "AddToCart";case Types.ProductActionType.AddToWishlist:return "AddToWishlist";case Types.ProductActionType.Checkout:return "Checkout";case Types.ProductActionType.CheckoutOption:return "CheckoutOption";case Types.ProductActionType.Click:return "Click";case Types.ProductActionType.Purchase:return "Purchase";case Types.ProductActionType.Refund:return "Refund";case Types.ProductActionType.RemoveFromCart:return "RemoveFromCart";case Types.ProductActionType.RemoveFromWishlist:return "RemoveFromWishlist";case Types.ProductActionType.ViewDetail:return "ViewDetail";case Types.ProductActionType.Unknown:default:return "Unknown";}}function getPromotionActionEventName(a){return a===Types.PromotionActionType.PromotionClick?"PromotionClick":a===Types.PromotionActionType.PromotionView?"PromotionView":"Unknown"}function convertProductActionToEventType(a){return a===Types.ProductActionType.AddToCart?Types.CommerceEventType.ProductAddToCart:a===Types.ProductActionType.AddToWishlist?Types.CommerceEventType.ProductAddToWishlist:a===Types.ProductActionType.Checkout?Types.CommerceEventType.ProductCheckout:a===Types.ProductActionType.CheckoutOption?Types.CommerceEventType.ProductCheckoutOption:a===Types.ProductActionType.Click?Types.CommerceEventType.ProductClick:a===Types.ProductActionType.Purchase?Types.CommerceEventType.ProductPurchase:a===Types.ProductActionType.Refund?Types.CommerceEventType.ProductRefund:a===Types.ProductActionType.RemoveFromCart?Types.CommerceEventType.ProductRemoveFromCart:a===Types.ProductActionType.RemoveFromWishlist?Types.CommerceEventType.ProductRemoveFromWishlist:a===Types.ProductActionType.Unknown?Types.EventType.Unknown:a===Types.ProductActionType.ViewDetail?Types.CommerceEventType.ProductViewDetail:(mParticle.Logger.error("Could not convert product action type "+a+" to event type"),null)}function convertPromotionActionToEventType(a){return a===Types.PromotionActionType.PromotionClick?Types.CommerceEventType.PromotionClick:a===Types.PromotionActionType.PromotionView?Types.CommerceEventType.PromotionView:(mParticle.Logger.error("Could not convert promotion action type "+a+" to event type"),null)}function generateExpandedEcommerceName(a,b){return "eCommerce - "+a+" - "+(b?"Total":"Item")}function extractProductAttributes(a,b){b.CouponCode&&(a["Coupon Code"]=b.CouponCode),b.Brand&&(a.Brand=b.Brand),b.Category&&(a.Category=b.Category),b.Name&&(a.Name=b.Name),b.Sku&&(a.Id=b.Sku),b.Price&&(a["Item Price"]=b.Price),b.Quantity&&(a.Quantity=b.Quantity),b.Position&&(a.Position=b.Position),b.Variant&&(a.Variant=b.Variant),a["Total Product Amount"]=b.TotalAmount||0;}function extractTransactionId(a,b){b.TransactionId&&(a["Transaction Id"]=b.TransactionId);}function extractActionAttributes(a,b){extractTransactionId(a,b),b.Affiliation&&(a.Affiliation=b.Affiliation),b.CouponCode&&(a["Coupon Code"]=b.CouponCode),b.TotalAmount&&(a["Total Amount"]=b.TotalAmount),b.ShippingAmount&&(a["Shipping Amount"]=b.ShippingAmount),b.TaxAmount&&(a["Tax Amount"]=b.TaxAmount),b.CheckoutOptions&&(a["Checkout Options"]=b.CheckoutOptions),b.CheckoutStep&&(a["Checkout Step"]=b.CheckoutStep);}function extractPromotionAttributes(a,b){b.Id&&(a.Id=b.Id),b.Creative&&(a.Creative=b.Creative),b.Name&&(a.Name=b.Name),b.Position&&(a.Position=b.Position);}function buildProductList(a,b){return b?Array.isArray(b)?b:[b]:a.ShoppingCart.ProductList}function createProduct(a,b,c,d,e,f,g,h,i,j){return (j=Helpers.sanitizeAttributes(j),"string"!=typeof a)?(mParticle.Logger.error("Name is required when creating a product"),null):Validators$1.isStringOrNumber(b)?Validators$1.isStringOrNumber(c)?(h&&!Validators$1.isNumber(h)&&(mParticle.Logger.error("Position must be a number, it will be set to null."),h=null),d||(d=1),{Name:a,Sku:b,Price:c,Quantity:d,Brand:g,Variant:e,Category:f,Position:h,CouponCode:i,TotalAmount:d*c,Attributes:j}):(mParticle.Logger.error("Price is required when creating a product, and must be a string or a number"),null):(mParticle.Logger.error("SKU is required when creating a product, and must be a string or a number"),null)}function createPromotion(a,b,c,d){return Validators$1.isStringOrNumber(a)?{Id:a,Creative:b,Name:c,Position:d}:(mParticle.Logger.error(Messages$4.ErrorMessages.PromotionIdRequired),null)}function createImpression(a,b){return "string"==typeof a?b?{Name:a,Product:b}:(mParticle.Logger.error("Product is required when creating an impression."),null):(mParticle.Logger.error("Name is required when creating an impression."),null)}function createTransactionAttributes(a,b,c,d,e,f){return Validators$1.isStringOrNumber(a)?{Id:a,Affiliation:b,CouponCode:c,Revenue:d,Shipping:e,Tax:f}:(mParticle.Logger.error(Messages$4.ErrorMessages.TransactionIdRequired),null)}function expandProductImpression(a){var b=[];return a.ProductImpressions?(a.ProductImpressions.forEach(function(c){c.ProductList&&c.ProductList.forEach(function(d){var e=Helpers.extend(!1,{},a.EventAttributes);if(d.Attributes)for(var f in d.Attributes)e[f]=d.Attributes[f];extractProductAttributes(e,d),c.ProductImpressionList&&(e["Product Impression List"]=c.ProductImpressionList);var g=ServerModel.createEventObject({messageType:Types.MessageType.PageEvent,name:generateExpandedEcommerceName("Impression"),data:e,eventType:Types.EventType.Transaction});b.push(g);});}),b):b}function expandCommerceEvent(a){return a?expandProductAction(a).concat(expandPromotionAction(a)).concat(expandProductImpression(a)):null}function expandPromotionAction(a){var b=[];if(!a.PromotionAction)return b;var c=a.PromotionAction.PromotionList;return c.forEach(function(c){var d=Helpers.extend(!1,{},a.EventAttributes);extractPromotionAttributes(d,c);var e=ServerModel.createEventObject({messageType:Types.MessageType.PageEvent,name:generateExpandedEcommerceName(Types.PromotionActionType.getExpansionName(a.PromotionAction.PromotionActionType)),data:d,eventType:Types.EventType.Transaction});b.push(e);}),b}function expandProductAction(a){var b=[];if(!a.ProductAction)return b;var c=!1;if(a.ProductAction.ProductActionType===Types.ProductActionType.Purchase||a.ProductAction.ProductActionType===Types.ProductActionType.Refund){var d=Helpers.extend(!1,{},a.EventAttributes);d["Product Count"]=a.ProductAction.ProductList?a.ProductAction.ProductList.length:0,extractActionAttributes(d,a.ProductAction),a.CurrencyCode&&(d["Currency Code"]=a.CurrencyCode);var e=ServerModel.createEventObject({messageType:Types.MessageType.PageEvent,name:generateExpandedEcommerceName(Types.ProductActionType.getExpansionName(a.ProductAction.ProductActionType),!0),data:d,eventType:Types.EventType.Transaction});b.push(e);}else c=!0;var f=a.ProductAction.ProductList;return f?(f.forEach(function(d){var e=Helpers.extend(!1,a.EventAttributes,d.Attributes);c?extractActionAttributes(e,a.ProductAction):extractTransactionId(e,a.ProductAction),extractProductAttributes(e,d);var f=ServerModel.createEventObject({messageType:Types.MessageType.PageEvent,name:generateExpandedEcommerceName(Types.ProductActionType.getExpansionName(a.ProductAction.ProductActionType)),data:e,eventType:Types.EventType.Transaction});b.push(f);}),b):b}function createCommerceEventObject(a){var b,c=mParticle.Identity.getCurrentUser();return (mParticle.Logger.verbose(Messages$4.InformationMessages.StartingLogCommerceEvent),Helpers.canLog())?(b=ServerModel.createEventObject({messageType:Types.MessageType.Commerce}),b.EventName="eCommerce - ",b.CurrencyCode=mParticle.Store.currencyCode,b.ShoppingCart={ProductList:c?c.getCart().getCartProducts():[]},b.CustomFlags=a,b):(mParticle.Logger.verbose(Messages$4.InformationMessages.AbandonLogEvent),null)}var Ecommerce = {convertTransactionAttributesToProductAction:convertTransactionAttributesToProductAction,getProductActionEventName:getProductActionEventName,getPromotionActionEventName:getPromotionActionEventName,convertProductActionToEventType:convertProductActionToEventType,convertPromotionActionToEventType:convertPromotionActionToEventType,buildProductList:buildProductList,createProduct:createProduct,createPromotion:createPromotion,createImpression:createImpression,createTransactionAttributes:createTransactionAttributes,expandCommerceEvent:expandCommerceEvent,createCommerceEventObject:createCommerceEventObject};

var Messages$5=Constants.Messages,sendEventToServer$1=ApiClient.sendEventToServer;function logEvent(a){if(mParticle.Logger.verbose(Messages$5.InformationMessages.StartingLogEvent+": "+a.name),Helpers.canLog()){a.data&&(a.data=Helpers.sanitizeAttributes(a.data));var b=ServerModel.createEventObject(a);sendEventToServer$1(b),Persistence.update();}else mParticle.Logger.verbose(Messages$5.InformationMessages.AbandonLogEvent);}function startTracking(a){function b(b){// prevents callback from being fired multiple times
mParticle.Store.currentPosition={lat:b.coords.latitude,lng:b.coords.longitude},d(a,b),a=null,mParticle.Store.isTracking=!0;}function c(){// prevents callback from being fired multiple times
d(a),a=null,mParticle.Store.isTracking=!1;}function d(a,b){if(a)try{b?a(b):a();}catch(a){mParticle.Logger.error("Error invoking the callback passed to startTrackingLocation."),mParticle.Logger.error(a);}}if(!mParticle.Store.isTracking)"geolocation"in navigator&&(mParticle.Store.watchPositionId=navigator.geolocation.watchPosition(b,c));else{var e={coords:{latitude:mParticle.Store.currentPosition.lat,longitude:mParticle.Store.currentPosition.lng}};d(a,e);}}function stopTracking(){mParticle.Store.isTracking&&(navigator.geolocation.clearWatch(mParticle.Store.watchPositionId),mParticle.Store.currentPosition=null,mParticle.Store.isTracking=!1);}function logOptOut(){mParticle.Logger.verbose(Messages$5.InformationMessages.StartingLogOptOut);var a=ServerModel.createEventObject({messageType:Types.MessageType.OptOut,eventType:Types.EventType.Other});sendEventToServer$1(a);}function logAST(){logEvent({messageType:Types.MessageType.AppStateTransition});}function logCheckoutEvent(a,b,c,d){var e=Ecommerce.createCommerceEventObject(d);e&&(e.EventName+=Ecommerce.getProductActionEventName(Types.ProductActionType.Checkout),e.EventCategory=Types.CommerceEventType.ProductCheckout,e.ProductAction={ProductActionType:Types.ProductActionType.Checkout,CheckoutStep:a,CheckoutOptions:b,ProductList:e.ShoppingCart.ProductList},logCommerceEvent(e,c));}function logProductActionEvent(a,b,c,d){var e=Ecommerce.createCommerceEventObject(d);e&&(e.EventCategory=Ecommerce.convertProductActionToEventType(a),e.EventName+=Ecommerce.getProductActionEventName(a),e.ProductAction={ProductActionType:a,ProductList:Array.isArray(b)?b:[b]},logCommerceEvent(e,c));}function logPurchaseEvent(a,b,c,d){var e=Ecommerce.createCommerceEventObject(d);e&&(e.EventName+=Ecommerce.getProductActionEventName(Types.ProductActionType.Purchase),e.EventCategory=Types.CommerceEventType.ProductPurchase,e.ProductAction={ProductActionType:Types.ProductActionType.Purchase},e.ProductAction.ProductList=Ecommerce.buildProductList(e,b),Ecommerce.convertTransactionAttributesToProductAction(a,e.ProductAction),logCommerceEvent(e,c));}function logRefundEvent(a,b,c,d){if(!a)return void mParticle.Logger.error(Messages$5.ErrorMessages.TransactionRequired);var e=Ecommerce.createCommerceEventObject(d);e&&(e.EventName+=Ecommerce.getProductActionEventName(Types.ProductActionType.Refund),e.EventCategory=Types.CommerceEventType.ProductRefund,e.ProductAction={ProductActionType:Types.ProductActionType.Refund},e.ProductAction.ProductList=Ecommerce.buildProductList(e,b),Ecommerce.convertTransactionAttributesToProductAction(a,e.ProductAction),logCommerceEvent(e,c));}function logPromotionEvent(a,b,c,d){var e=Ecommerce.createCommerceEventObject(d);e&&(e.EventName+=Ecommerce.getPromotionActionEventName(a),e.EventCategory=Ecommerce.convertPromotionActionToEventType(a),e.PromotionAction={PromotionActionType:a,PromotionList:[b]},logCommerceEvent(e,c));}function logImpressionEvent(a,b,c){var d=Ecommerce.createCommerceEventObject(c);d&&(d.EventName+="Impression",d.EventCategory=Types.CommerceEventType.ProductImpression,!Array.isArray(a)&&(a=[a]),d.ProductImpressions=[],a.forEach(function(a){d.ProductImpressions.push({ProductImpressionList:a.Name,ProductList:Array.isArray(a.Product)?a.Product:[a.Product]});}),logCommerceEvent(d,b));}function logCommerceEvent(a,b){mParticle.Logger.verbose(Messages$5.InformationMessages.StartingLogCommerceEvent),b=Helpers.sanitizeAttributes(b),Helpers.canLog()?(mParticle.Store.webviewBridgeEnabled&&(a.ShoppingCart={}),b&&(a.EventAttributes=b),sendEventToServer$1(a),Persistence.update()):mParticle.Logger.verbose(Messages$5.InformationMessages.AbandonLogEvent);}function addEventHandler(a,b,c,d,f){var g,h,e=[],j=function(a){var b=function(){g.href?window.location.href=g.href:g.submit&&g.submit();};mParticle.Logger.verbose("DOM event triggered, handling event"),logEvent({messageType:Types.MessageType.PageEvent,name:"function"==typeof c?c(g):c,data:"function"==typeof d?d(g):d,eventType:f||Types.EventType.Other}),(g.href&&"_blank"!==g.target||g.submit)&&(a.preventDefault?a.preventDefault():a.returnValue=!1,setTimeout(b,mParticle.Store.SDKConfig.timeout));};if(!b)return void mParticle.Logger.error("Can't bind event, selector is required");// Handle a css selector string or a dom element
if("string"==typeof b?e=document.querySelectorAll(b):b.nodeType&&(e=[b]),e.length)for(mParticle.Logger.verbose("Found "+e.length+" element"+(1<e.length?"s":"")+", attaching event handlers"),h=0;h<e.length;h++)g=e[h],g.addEventListener?g.addEventListener(a,j,!1):g.attachEvent?g.attachEvent("on"+a,j):g["on"+a]=j;else mParticle.Logger.verbose("No elements found");}var Events = {logEvent:logEvent,startTracking:startTracking,stopTracking:stopTracking,logCheckoutEvent:logCheckoutEvent,logProductActionEvent:logProductActionEvent,logPurchaseEvent:logPurchaseEvent,logRefundEvent:logRefundEvent,logPromotionEvent:logPromotionEvent,logImpressionEvent:logImpressionEvent,logOptOut:logOptOut,logAST:logAST,addEventHandler:addEventHandler};

var Messages$6=Constants.Messages,Validators$2=Helpers.Validators,HTTPCodes$1=Constants.HTTPCodes,sendIdentityRequest$1=ApiClient.sendIdentityRequest;function checkIdentitySwap(a,b,c){if(a&&b&&a!==b){var d=Persistence.useLocalStorage()?Persistence.getLocalStorage():Persistence.getCookie();d.cu=b,d.gs.csm=c,Persistence.saveCookies(d);}}var IdentityRequest={createKnownIdentities:function createKnownIdentities(a,b){var c={};if(a&&a.userIdentities&&Helpers.isObject(a.userIdentities))for(var d in a.userIdentities)c[d]=a.userIdentities[d];return c.device_application_stamp=b,c},preProcessIdentityRequest:function preProcessIdentityRequest(a,b,c){mParticle.Logger.verbose(Messages$6.InformationMessages.StartingLogEvent+": "+c);var d=Validators$2.validateIdentities(a,c);if(!d.valid)return mParticle.Logger.error("ERROR: "+d.error),{valid:!1,error:d.error};if(b&&!Validators$2.isFunction(b)){var e="The optional callback must be a function. You tried entering a(n) "+_typeof_1(b);return mParticle.Logger.error(e),{valid:!1,error:e}}return {valid:!0}},createIdentityRequest:function createIdentityRequest(a,b,c,d,e,f,g){var h={client_sdk:{platform:b,sdk_vendor:c,sdk_version:d},context:f,environment:mParticle.Store.SDKConfig.isDevelopmentMode?"development":"production",request_id:Helpers.generateUniqueId(),request_timestamp_ms:new Date().getTime(),previous_mpid:g||null,known_identities:this.createKnownIdentities(a,e)};return h},createModifyIdentityRequest:function createModifyIdentityRequest(a,b,c,d,e,f){return {client_sdk:{platform:c,sdk_vendor:d,sdk_version:e},context:f,environment:mParticle.Store.SDKConfig.isDevelopmentMode?"development":"production",request_id:Helpers.generateUniqueId(),request_timestamp_ms:new Date().getTime(),identity_changes:this.createIdentityChanges(a,b)}},createIdentityChanges:function createIdentityChanges(a,b){var c,d=[];if(b&&Helpers.isObject(b)&&a&&Helpers.isObject(a))for(c in b)d.push({old_value:a[c]||null,new_value:b[c],identity_type:c});return d},modifyUserIdentities:function modifyUserIdentities(a,b){var c={};for(var d in b)c[Types.IdentityType.getIdentityType(d)]=b[d];for(d in a)c[d]||(c[d]=a[d]);return c},createAliasNetworkRequest:function createAliasNetworkRequest(a){return {request_id:Helpers.generateUniqueId(),request_type:"alias",environment:mParticle.Store.SDKConfig.isDevelopmentMode?"development":"production",api_key:mParticle.Store.devToken,data:{destination_mpid:a.destinationMpid,source_mpid:a.sourceMpid,start_unixtime_ms:a.startTime,end_unixtime_ms:a.endTime,device_application_stamp:mParticle.Store.deviceId}}},convertAliasToNative:function convertAliasToNative(a){return {DestinationMpid:a.destinationMpid,SourceMpid:a.sourceMpid,StartUnixtimeMs:a.startTime,EndUnixtimeMs:a.endTime}},convertToNative:function convertToNative(a){var b=[];if(a&&a.userIdentities){for(var c in a.userIdentities)a.userIdentities.hasOwnProperty(c)&&b.push({Type:Types.IdentityType.getIdentityType(c),Identity:a.userIdentities[c]});return {UserIdentities:b}}}},IdentityAPI={HTTPCodes:HTTPCodes$1,/**
     * Initiate a logout request to the mParticle server
     * @method identify
     * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
     * @param {Function} [callback] A callback function that is called when the identify request completes
     */identify:function identify(a,b){var c,d=mParticle.Identity.getCurrentUser(),e=IdentityRequest.preProcessIdentityRequest(a,b,"identify");if(d&&(c=d.getMPID()),e.valid){var f=IdentityRequest.createIdentityRequest(a,Constants.platform,Constants.sdkVendor,Constants.sdkVersion,mParticle.Store.deviceId,mParticle.Store.context,c);Helpers.canLog()?mParticle.Store.webviewBridgeEnabled?(NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Identify,JSON.stringify(IdentityRequest.convertToNative(a))),Helpers.invokeCallback(b,HTTPCodes$1.nativeIdentityRequest,"Identify request sent to native sdk")):sendIdentityRequest$1(f,"identify",b,a,parseIdentityResponse,c):(Helpers.invokeCallback(b,HTTPCodes$1.loggingDisabledOrMissingAPIKey,Messages$6.InformationMessages.AbandonLogEvent),mParticle.Logger.verbose(Messages$6.InformationMessages.AbandonLogEvent));}else Helpers.invokeCallback(b,HTTPCodes$1.validationIssue,e.error),mParticle.Logger.verbose(e);},/**
     * Initiate a logout request to the mParticle server
     * @method logout
     * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
     * @param {Function} [callback] A callback function that is called when the logout request completes
     */logout:function logout(a,b){var c,d=mParticle.Identity.getCurrentUser(),e=IdentityRequest.preProcessIdentityRequest(a,b,"logout");if(d&&(c=d.getMPID()),e.valid){var f,g=IdentityRequest.createIdentityRequest(a,Constants.platform,Constants.sdkVendor,Constants.sdkVersion,mParticle.Store.deviceId,mParticle.Store.context,c);Helpers.canLog()?mParticle.Store.webviewBridgeEnabled?(NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Logout,JSON.stringify(IdentityRequest.convertToNative(a))),Helpers.invokeCallback(b,HTTPCodes$1.nativeIdentityRequest,"Logout request sent to native sdk")):(sendIdentityRequest$1(g,"logout",b,a,parseIdentityResponse,c),f=ServerModel.createEventObject({messageType:Types.MessageType.Profile}),f.ProfileMessageType=Types.ProfileMessageType.Logout,mParticle.Store.activeForwarders.length&&mParticle.Store.activeForwarders.forEach(function(a){a.logOut&&a.logOut(f);})):(Helpers.invokeCallback(b,HTTPCodes$1.loggingDisabledOrMissingAPIKey,Messages$6.InformationMessages.AbandonLogEvent),mParticle.Logger.verbose(Messages$6.InformationMessages.AbandonLogEvent));}else Helpers.invokeCallback(b,HTTPCodes$1.validationIssue,e.error),mParticle.Logger.verbose(e);},/**
     * Initiate a login request to the mParticle server
     * @method login
     * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
     * @param {Function} [callback] A callback function that is called when the login request completes
     */login:function login(a,b){var c,d=mParticle.Identity.getCurrentUser(),e=IdentityRequest.preProcessIdentityRequest(a,b,"login");if(d&&(c=d.getMPID()),e.valid){var f=IdentityRequest.createIdentityRequest(a,Constants.platform,Constants.sdkVendor,Constants.sdkVersion,mParticle.Store.deviceId,mParticle.Store.context,c);Helpers.canLog()?mParticle.Store.webviewBridgeEnabled?(NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Login,JSON.stringify(IdentityRequest.convertToNative(a))),Helpers.invokeCallback(b,HTTPCodes$1.nativeIdentityRequest,"Login request sent to native sdk")):sendIdentityRequest$1(f,"login",b,a,parseIdentityResponse,c):(Helpers.invokeCallback(b,HTTPCodes$1.loggingDisabledOrMissingAPIKey,Messages$6.InformationMessages.AbandonLogEvent),mParticle.Logger.verbose(Messages$6.InformationMessages.AbandonLogEvent));}else Helpers.invokeCallback(b,HTTPCodes$1.validationIssue,e.error),mParticle.Logger.verbose(e);},/**
     * Initiate a modify request to the mParticle server
     * @method modify
     * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
     * @param {Function} [callback] A callback function that is called when the modify request completes
     */modify:function modify(a,b){var c,d=mParticle.Identity.getCurrentUser(),e=IdentityRequest.preProcessIdentityRequest(a,b,"modify");d&&(c=d.getMPID());var f=a&&a.userIdentities?a.userIdentities:{};if(e.valid){var g=IdentityRequest.createModifyIdentityRequest(d?d.getUserIdentities().userIdentities:{},f,Constants.platform,Constants.sdkVendor,Constants.sdkVersion,mParticle.Store.context);Helpers.canLog()?mParticle.Store.webviewBridgeEnabled?(NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Modify,JSON.stringify(IdentityRequest.convertToNative(a))),Helpers.invokeCallback(b,HTTPCodes$1.nativeIdentityRequest,"Modify request sent to native sdk")):sendIdentityRequest$1(g,"modify",b,a,parseIdentityResponse,c):(Helpers.invokeCallback(b,HTTPCodes$1.loggingDisabledOrMissingAPIKey,Messages$6.InformationMessages.AbandonLogEvent),mParticle.Logger.verbose(Messages$6.InformationMessages.AbandonLogEvent));}else Helpers.invokeCallback(b,HTTPCodes$1.validationIssue,e.error),mParticle.Logger.verbose(e);},/**
     * Returns a user object with methods to interact with the current user
     * @method getCurrentUser
     * @return {Object} the current user object
     */getCurrentUser:function getCurrentUser(){var a=mParticle.Store.mpid;return a?(a=mParticle.Store.mpid.slice(),mParticleUser(a,mParticle.Store.isLoggedIn)):mParticle.Store.webviewBridgeEnabled?mParticleUser():null},/**
     * Returns a the user object associated with the mpid parameter or 'null' if no such
     * user exists
     * @method getUser
     * @param {String} mpid of the desired user
     * @return {Object} the user for  mpid
     */getUser:function getUser(a){var b=Persistence.getPersistence();return b?b[a]&&!Constants.SDKv2NonMPIDCookieKeys.hasOwnProperty(a)?mParticleUser(a):null:null},/**
     * Returns all users, including the current user and all previous users that are stored on the device.
     * @method getUsers
     * @return {Array} array of users
     */getUsers:function getUsers(){var a=Persistence.getPersistence(),b=[];if(a)for(var c in a)Constants.SDKv2NonMPIDCookieKeys.hasOwnProperty(c)||b.push(mParticleUser(c));return b.sort(function(c,a){var b=c.getLastSeenTime()||0,d=a.getLastSeenTime()||0;return b>d?-1:1}),b},/**
     * Initiate an alias request to the mParticle server
     * @method aliasUsers
     * @param {Object} aliasRequest  object representing an AliasRequest
     * @param {Function} [callback] A callback function that is called when the aliasUsers request completes
     */aliasUsers:function aliasUsers(a,b){var c;if(a.destinationMpid&&a.sourceMpid||(c=Messages$6.ValidationMessages.AliasMissingMpid),a.destinationMpid===a.sourceMpid&&(c=Messages$6.ValidationMessages.AliasNonUniqueMpid),a.startTime&&a.endTime||(c=Messages$6.ValidationMessages.AliasMissingTime),a.startTime>a.endTime&&(c=Messages$6.ValidationMessages.AliasStartBeforeEndTime),c)return mParticle.Logger.warning(c),void Helpers.invokeAliasCallback(b,HTTPCodes$1.validationIssue,c);if(!Helpers.canLog())Helpers.invokeAliasCallback(b,HTTPCodes$1.loggingDisabledOrMissingAPIKey,Messages$6.InformationMessages.AbandonAliasUsers),mParticle.Logger.verbose(Messages$6.InformationMessages.AbandonAliasUsers);else if(mParticle.Store.webviewBridgeEnabled)NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Alias,JSON.stringify(IdentityRequest.convertAliasToNative(a))),Helpers.invokeAliasCallback(b,HTTPCodes$1.nativeIdentityRequest,"Alias request sent to native sdk");else{mParticle.Logger.verbose(Messages$6.InformationMessages.StartingAliasRequest+": "+a.sourceMpid+" -> "+a.destinationMpid);var d=IdentityRequest.createAliasNetworkRequest(a);ApiClient.sendAliasRequest(d,b);}},/**
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
     */createAliasRequest:function createAliasRequest(a,b){try{if(!b||!a)return mParticle.Logger.error("'destinationUser' and 'sourceUser' must both be present"),null;var c=a.getFirstSeenTime();c||mParticle.Identity.getUsers().forEach(function(a){a.getFirstSeenTime()&&(!c||a.getFirstSeenTime()<c)&&(c=a.getFirstSeenTime());});var d=new Date().getTime()-1e3*(60*(60*(24*mParticle.Store.SDKConfig.aliasMaxWindow))),e=a.getLastSeenTime()||new Date().getTime();return c<d&&(c=d,e<c&&mParticle.Logger.warning("Source User has not been seen in the last "+mParticle.Store.SDKConfig.maxAliasWindow+" days, Alias Request will likely fail")),{destinationMpid:b.getMPID(),sourceMpid:a.getMPID(),startTime:c,endTime:e}}catch(a){return mParticle.Logger.error("There was a problem with creating an alias request: "+a),null}}};/**
 * Invoke these methods on the mParticle.Identity object.
 * Example: mParticle.Identity.getCurrentUser().
 * @class mParticle.Identity
 */ /**
 * Invoke these methods on the mParticle.Identity.getCurrentUser() object.
 * Example: mParticle.Identity.getCurrentUser().getAllUserAttributes()
 * @class mParticle.Identity.getCurrentUser()
 */function mParticleUser(a,b){return {/**
         * Get user identities for current user
         * @method getUserIdentities
         * @return {Object} an object with userIdentities as its key
         */getUserIdentities:function getUserIdentities(){var b={},c=Persistence.getUserIdentities(a);for(var d in c)c.hasOwnProperty(d)&&(b[Types.IdentityType.getIdentityName(Helpers.parseNumber(d))]=c[d]);return {userIdentities:b}},/**
         * Get the MPID of the current user
         * @method getMPID
         * @return {String} the current user MPID as a string
         */getMPID:function getMPID(){return a},/**
         * Sets a user tag
         * @method setUserTag
         * @param {String} tagName
         */setUserTag:function setUserTag(a){return Validators$2.isValidKeyValue(a)?void this.setUserAttribute(a,null):void mParticle.Logger.error(Messages$6.ErrorMessages.BadKey)},/**
         * Removes a user tag
         * @method removeUserTag
         * @param {String} tagName
         */removeUserTag:function removeUserTag(a){return Validators$2.isValidKeyValue(a)?void this.removeUserAttribute(a):void mParticle.Logger.error(Messages$6.ErrorMessages.BadKey)},/**
         * Sets a user attribute
         * @method setUserAttribute
         * @param {String} key
         * @param {String} value
         */setUserAttribute:function setUserAttribute(b,c){var d,e;if(mParticle.sessionManager.resetSessionTimer(),Helpers.canLog()){if(!Validators$2.isValidAttributeValue(c))return void mParticle.Logger.error(Messages$6.ErrorMessages.BadAttribute);if(!Validators$2.isValidKeyValue(b))return void mParticle.Logger.error(Messages$6.ErrorMessages.BadKey);if(mParticle.Store.webviewBridgeEnabled)NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetUserAttribute,JSON.stringify({key:b,value:c}));else{d=Persistence.getPersistence(),e=this.getAllUserAttributes();var f=Helpers.findKeyInObject(e,b);f&&delete e[f],e[b]=c,d&&d[a]&&(d[a].ua=e,Persistence.saveCookies(d,a)),Forwarders.initForwarders(IdentityAPI.getCurrentUser().getUserIdentities(),ApiClient.prepareForwardingStats),Forwarders.callSetUserAttributeOnForwarders(b,c);}}},/**
         * Set multiple user attributes
         * @method setUserAttributes
         * @param {Object} user attribute object with keys of the attribute type, and value of the attribute value
         */setUserAttributes:function setUserAttributes(a){if(mParticle.sessionManager.resetSessionTimer(),!Helpers.isObject(a))mParticle.Logger.error("Must pass an object into setUserAttributes. You passed a "+_typeof_1(a));else if(Helpers.canLog())for(var b in a)a.hasOwnProperty(b)&&this.setUserAttribute(b,a[b]);},/**
         * Removes a specific user attribute
         * @method removeUserAttribute
         * @param {String} key
         */removeUserAttribute:function removeUserAttribute(b){var c,d;if(mParticle.sessionManager.resetSessionTimer(),!Validators$2.isValidKeyValue(b))return void mParticle.Logger.error(Messages$6.ErrorMessages.BadKey);if(mParticle.Store.webviewBridgeEnabled)NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.RemoveUserAttribute,JSON.stringify({key:b,value:null}));else{c=Persistence.getPersistence(),d=this.getAllUserAttributes();var e=Helpers.findKeyInObject(d,b);e&&(b=e),delete d[b],c&&c[a]&&(c[a].ua=d,Persistence.saveCookies(c,a)),Forwarders.initForwarders(IdentityAPI.getCurrentUser().getUserIdentities(),ApiClient.prepareForwardingStats),Forwarders.applyToForwarders("removeUserAttribute",b);}},/**
         * Sets a list of user attributes
         * @method setUserAttributeList
         * @param {String} key
         * @param {Array} value an array of values
         */setUserAttributeList:function setUserAttributeList(b,c){var d,e;if(mParticle.sessionManager.resetSessionTimer(),!Validators$2.isValidKeyValue(b))return void mParticle.Logger.error(Messages$6.ErrorMessages.BadKey);if(!Array.isArray(c))return void mParticle.Logger.error("The value you passed in to setUserAttributeList must be an array. You passed in a "+_typeof_1(c));var f=c.slice();if(mParticle.Store.webviewBridgeEnabled)NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetUserAttributeList,JSON.stringify({key:b,value:f}));else{d=Persistence.getPersistence(),e=this.getAllUserAttributes();var g=Helpers.findKeyInObject(e,b);g&&delete e[g],e[b]=f,d&&d[a]&&(d[a].ua=e,Persistence.saveCookies(d,a)),Forwarders.initForwarders(IdentityAPI.getCurrentUser().getUserIdentities(),ApiClient.prepareForwardingStats),Forwarders.callSetUserAttributeOnForwarders(b,f);}},/**
         * Removes all user attributes
         * @method removeAllUserAttributes
         */removeAllUserAttributes:function removeAllUserAttributes(){var b,c;if(mParticle.sessionManager.resetSessionTimer(),mParticle.Store.webviewBridgeEnabled)NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.RemoveAllUserAttributes);else{if(b=Persistence.getPersistence(),c=this.getAllUserAttributes(),Forwarders.initForwarders(IdentityAPI.getCurrentUser().getUserIdentities(),ApiClient.prepareForwardingStats),c)for(var d in c)c.hasOwnProperty(d)&&Forwarders.applyToForwarders("removeUserAttribute",d);b&&b[a]&&(b[a].ua={},Persistence.saveCookies(b,a));}},/**
         * Returns all user attribute keys that have values that are arrays
         * @method getUserAttributesLists
         * @return {Object} an object of only keys with array values. Example: { attr1: [1, 2, 3], attr2: ['a', 'b', 'c'] }
         */getUserAttributesLists:function getUserAttributesLists(){var a,b={};for(var c in a=this.getAllUserAttributes(),a)a.hasOwnProperty(c)&&Array.isArray(a[c])&&(b[c]=a[c].slice());return b},/**
         * Returns all user attributes
         * @method getAllUserAttributes
         * @return {Object} an object of all user attributes. Example: { attr1: 'value1', attr2: ['a', 'b', 'c'] }
         */getAllUserAttributes:function getAllUserAttributes(){var b={},c=Persistence.getAllUserAttributes(a);if(c)for(var d in c)c.hasOwnProperty(d)&&(b[d]=Array.isArray(c[d])?c[d].slice():c[d]);return b},/**
         * Returns the cart object for the current user
         * @method getCart
         * @return a cart object
         */getCart:function getCart(){return mParticleUserCart(a)},/**
         * Returns the Consent State stored locally for this user.
         * @method getConsentState
         * @return a ConsentState object
         */getConsentState:function getConsentState(){return Persistence.getConsentState(a)},/**
         * Sets the Consent State stored locally for this user.
         * @method setConsentState
         * @param {Object} consent state
         */setConsentState:function setConsentState(b){Persistence.saveUserConsentStateToCookies(a,b),Forwarders.initForwarders(this.getUserIdentities().userIdentities,ApiClient.prepareForwardingStats);},isLoggedIn:function isLoggedIn(){return b},getLastSeenTime:function getLastSeenTime(){return Persistence.getLastSeenTime(a)},getFirstSeenTime:function getFirstSeenTime(){return Persistence.getFirstSeenTime(a)}}}/**
 * Invoke these methods on the mParticle.Identity.getCurrentUser().getCart() object.
 * Example: mParticle.Identity.getCurrentUser().getCart().add(...);
 * @class mParticle.Identity.getCurrentUser().getCart()
 */function mParticleUserCart(a){return {/**
         * Adds a cart product to the user cart
         * @method add
         * @param {Object} product the product
         * @param {Boolean} [logEvent] a boolean to log adding of the cart object. If blank, no logging occurs.
         */add:function add(b,c){var d,e,f;if(f=Array.isArray(b)?b.slice():[b],f.forEach(function(a){a.Attributes=Helpers.sanitizeAttributes(a.Attributes);}),mParticle.Store.webviewBridgeEnabled)NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.AddToCart,JSON.stringify(f));else{mParticle.sessionManager.resetSessionTimer(),e=Persistence.getUserProductsFromLS(a),e=e.concat(f),!0===c&&Events.logProductActionEvent(Types.ProductActionType.AddToCart,f);e.length>mParticle.Store.SDKConfig.maxProducts&&(mParticle.Logger.verbose("The cart contains "+e.length+" items. Only "+mParticle.Store.SDKConfig.maxProducts+" can currently be saved in cookies."),e=e.slice(-mParticle.Store.SDKConfig.maxProducts)),d=Persistence.getAllUserProductsFromLS(),d[a].cp=e,Persistence.setCartProducts(d);}},/**
         * Removes a cart product from the current user cart
         * @method remove
         * @param {Object} product the product
         * @param {Boolean} [logEvent] a boolean to log adding of the cart object. If blank, no logging occurs.
         */remove:function remove(b,c){var d,e,f=-1,g=null;if(mParticle.Store.webviewBridgeEnabled)NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.RemoveFromCart,JSON.stringify(b));else{mParticle.sessionManager.resetSessionTimer(),e=Persistence.getUserProductsFromLS(a),e&&(e.forEach(function(a,c){a.Sku===b.Sku&&(f=c,g=a);}),-1<f&&(e.splice(f,1),!0===c&&Events.logProductActionEvent(Types.ProductActionType.RemoveFromCart,g)));d=Persistence.getAllUserProductsFromLS(),d[a].cp=e,Persistence.setCartProducts(d);}},/**
         * Clears the user's cart
         * @method clear
         */clear:function clear(){var b;mParticle.Store.webviewBridgeEnabled?NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.ClearCart):(mParticle.sessionManager.resetSessionTimer(),b=Persistence.getAllUserProductsFromLS(),b&&b[a]&&b[a].cp&&(b[a].cp=[],b[a].cp=[],Persistence.setCartProducts(b)));},/**
         * Returns all cart products
         * @method getCartProducts
         * @return {Array} array of cart products
         */getCartProducts:function getCartProducts(){return Persistence.getCartProducts(a)}}}function parseIdentityResponse(a,b,c,d,e){var f,g,h,i=mParticle.Identity.getCurrentUser(),j={},k=i?i.getUserIdentities().userIdentities:{};for(var l in k)j[Types.IdentityType.getIdentityType(l)]=k[l];var m={};mParticle.Store.identityCallInFlight=!1;try{if(mParticle.Logger.verbose("Parsing \""+e+"\" identity response from server"),a.responseText&&(g=JSON.parse(a.responseText),g.hasOwnProperty("is_logged_in")&&(mParticle.Store.isLoggedIn=g.is_logged_in)),200===a.status){if("modify"===e)m=IdentityRequest.modifyUserIdentities(j,d.userIdentities),Persistence.saveUserIdentitiesToCookies(i.getMPID(),m);else{//if there is any previous migration data
if(g=JSON.parse(a.responseText),mParticle.Logger.verbose("Successfully parsed Identity Response"),(!i||i.getMPID()&&g.mpid&&g.mpid!==i.getMPID())&&(mParticle.Store.mpid=g.mpid,i&&Persistence.setLastSeenTime(b),Persistence.setFirstSeenTime(g.mpid)),"identify"==e&&i&&g.mpid===i.getMPID()&&Persistence.setFirstSeenTime(g.mpid),h=mParticle.Store.currentSessionMPIDs.indexOf(g.mpid),mParticle.Store.sessionId&&g.mpid&&b!==g.mpid&&0>h&&mParticle.Store.currentSessionMPIDs.push(g.mpid),-1<h&&(mParticle.Store.currentSessionMPIDs=mParticle.Store.currentSessionMPIDs.slice(0,h).concat(mParticle.Store.currentSessionMPIDs.slice(h+1,mParticle.Store.currentSessionMPIDs.length)),mParticle.Store.currentSessionMPIDs.push(g.mpid)),Persistence.saveUserIdentitiesToCookies(g.mpid,m),cookieSyncManager.attemptCookieSync(b,g.mpid),checkIdentitySwap(b,g.mpid,mParticle.Store.currentSessionMPIDs),Object.keys(mParticle.Store.migrationData).length){m=mParticle.Store.migrationData.userIdentities||{};var n=mParticle.Store.migrationData.userAttributes||{};Persistence.saveUserAttributesToCookies(g.mpid,n);}else d&&d.userIdentities&&Object.keys(d.userIdentities).length&&(m=IdentityRequest.modifyUserIdentities(j,d.userIdentities));Persistence.saveUserIdentitiesToCookies(g.mpid,m),Persistence.update(),Persistence.findPrevCookiesBasedOnUI(d),mParticle.Store.context=g.context||mParticle.Store.context;}if(f=IdentityAPI.getCurrentUser(),d&&d.onUserAlias&&Helpers.Validators.isFunction(d.onUserAlias))try{mParticle.Logger.warning("Deprecated function onUserAlias will be removed in future releases"),d.onUserAlias(i,f);}catch(a){mParticle.Logger.error("There was an error with your onUserAlias function - "+a);}var o=Persistence.getCookie()||Persistence.getLocalStorage();f&&(Persistence.storeDataInMemory(o,f.getMPID()),(!i||f.getMPID()!==i.getMPID()||i.isLoggedIn()!==f.isLoggedIn())&&Forwarders.initForwarders(f.getUserIdentities().userIdentities,ApiClient.prepareForwardingStats),Forwarders.setForwarderUserIdentities(f.getUserIdentities().userIdentities),Forwarders.setForwarderOnIdentityComplete(f,e),Forwarders.setForwarderOnUserIdentified(f,e)),ApiClient.processQueuedEvents();}c?0===a.status?Helpers.invokeCallback(c,HTTPCodes$1.noHttpCoverage,g||null,f):Helpers.invokeCallback(c,a.status,g||null,f):g&&g.errors&&g.errors.length&&mParticle.Logger.error("Received HTTP response code of "+a.status+" - "+g.errors[0].message);}catch(b){c&&Helpers.invokeCallback(c,a.status,g||null),mParticle.Logger.error("Error parsing JSON response from Identity server: "+b);}}var Identity = {checkIdentitySwap:checkIdentitySwap,IdentityRequest:IdentityRequest,IdentityAPI:IdentityAPI,mParticleUser:mParticleUser,mParticleUserCart:mParticleUserCart};

var IdentityAPI$1=Identity.IdentityAPI,Messages$7=Constants.Messages,logEvent$1=Events.logEvent;function initialize(){if(mParticle.Store.sessionId){var a=6e4*mParticle.Store.SDKConfig.sessionTimeout;if(new Date>new Date(mParticle.Store.dateLastEventSent.getTime()+a))endSession(),startNewSession();else{var b=Persistence.getPersistence();b&&!b.cu&&(IdentityAPI$1.identify(mParticle.Store.SDKConfig.identifyRequest,mParticle.Store.SDKConfig.identityCallback),mParticle.Store.identifyCalled=!0,mParticle.Store.SDKConfig.identityCallback=null);}}else startNewSession();}function getSession(){return mParticle.Store.sessionId}function startNewSession(){if(mParticle.Logger.verbose(Messages$7.InformationMessages.StartingNewSession),Helpers.canLog()){mParticle.Store.sessionId=Helpers.generateUniqueId().toUpperCase();var a=mParticle.Identity.getCurrentUser(),b=a?a.getMPID():null;if(b&&(mParticle.Store.currentSessionMPIDs=[b]),!mParticle.Store.sessionStartDate){var c=new Date;mParticle.Store.sessionStartDate=c,mParticle.Store.dateLastEventSent=c;}setSessionTimer(),mParticle.Store.identifyCalled||(IdentityAPI$1.identify(mParticle.Store.SDKConfig.identifyRequest,mParticle.Store.SDKConfig.identityCallback),mParticle.Store.identifyCalled=!0,mParticle.Store.SDKConfig.identityCallback=null),logEvent$1({messageType:Types.MessageType.SessionStart});}else mParticle.Logger.verbose(Messages$7.InformationMessages.AbandonStartSession);}function endSession(a){if(mParticle.Logger.verbose(Messages$7.InformationMessages.StartingEndSession),a)logEvent$1({messageType:Types.MessageType.SessionEnd}),mParticle.Store.sessionId=null,mParticle.Store.dateLastEventSent=null,mParticle.Store.sessionAttributes={},Persistence.update();else if(Helpers.canLog()){var b,c,d;if(c=Persistence.getCookie()||Persistence.getLocalStorage(),!c)return;if(c.gs&&!c.gs.sid)return void mParticle.Logger.verbose(Messages$7.InformationMessages.NoSessionToEnd);// sessionId is not equal to cookies.sid if cookies.sid is changed in another tab
if(c.gs.sid&&mParticle.Store.sessionId!==c.gs.sid&&(mParticle.Store.sessionId=c.gs.sid),c.gs&&c.gs.les){b=6e4*mParticle.Store.SDKConfig.sessionTimeout;var e=new Date().getTime();d=e-c.gs.les,d<b?setSessionTimer():(logEvent$1({messageType:Types.MessageType.SessionEnd}),mParticle.Store.sessionId=null,mParticle.Store.dateLastEventSent=null,mParticle.Store.sessionStartDate=null,mParticle.Store.sessionAttributes={},Persistence.update());}}else mParticle.Logger.verbose(Messages$7.InformationMessages.AbandonEndSession);}function setSessionTimer(){var a=6e4*mParticle.Store.SDKConfig.sessionTimeout;mParticle.Store.globalTimer=window.setTimeout(function(){endSession();},a);}function resetSessionTimer(){mParticle.Store.webviewBridgeEnabled||(!mParticle.Store.sessionId&&startNewSession(),clearSessionTimeout(),setSessionTimer()),startNewSessionIfNeeded();}function clearSessionTimeout(){clearTimeout(mParticle.Store.globalTimer);}function startNewSessionIfNeeded(){if(!mParticle.Store.webviewBridgeEnabled){var a=Persistence.getCookie()||Persistence.getLocalStorage();!mParticle.Store.sessionId&&a&&(a.sid?mParticle.Store.sessionId=a.sid:startNewSession());}}var SessionManager = {initialize:initialize,getSession:getSession,startNewSession:startNewSession,endSession:endSession,setSessionTimer:setSessionTimer,resetSessionTimer:resetSessionTimer,clearSessionTimeout:clearSessionTimeout};

var Validators$3=Helpers.Validators;function createSDKConfig(a){var b={};for(var c in Constants.DefaultConfig)Constants.DefaultConfig.hasOwnProperty(c)&&(b[c]=Constants.DefaultConfig[c]);if(a)for(c in a)a.hasOwnProperty(c)&&(b[c]=a[c]);for(c in Constants.DefaultUrls)b[c]=Constants.DefaultUrls[c];return b}function Store(a,b){var c={isEnabled:!0,sessionAttributes:{},currentSessionMPIDs:[],consentState:null,sessionId:null,isFirstRun:null,clientId:null,deviceId:null,devToken:null,migrationData:{},serverSettings:{},dateLastEventSent:null,sessionStartDate:null,currentPosition:null,isTracking:!1,watchPositionId:null,cartProducts:[],eventQueue:[],currencyCode:null,globalTimer:null,context:"",configurationLoaded:!1,identityCallInFlight:!1,SDKConfig:{},migratingToIDSyncCookies:!1,nonCurrentUserMPIDs:{},identifyCalled:!1,isLoggedIn:!1,cookieSyncDates:{},integrationAttributes:{},requireDelay:!0,isLocalStorageAvailable:null,storageName:null,prodStorageName:null,activeForwarders:[],kits:{},configuredForwarders:[],pixelConfigurations:[]};for(var d in c)this[d]=c[d];// Set configuration to default settings
if(this.storageName=Helpers.createMainStorageName(a.workspaceToken),this.prodStorageName=Helpers.createProductStorageName(a.workspaceToken),this.integrationDelayTimeoutStart=Date.now(),this.SDKConfig=createSDKConfig(a),a){if(this.SDKConfig.isDevelopmentMode=!!a.hasOwnProperty("isDevelopmentMode")&&Helpers.returnConvertedBoolean(a.isDevelopmentMode),a.hasOwnProperty("serviceUrl")&&(this.SDKConfig.serviceUrl=a.serviceUrl),a.hasOwnProperty("secureServiceUrl")&&(this.SDKConfig.secureServiceUrl=a.secureServiceUrl),a.hasOwnProperty("v2ServiceUrl")&&(this.SDKConfig.v2ServiceUrl=a.v2ServiceUrl),a.hasOwnProperty("v2SecureServiceUrl")&&(this.SDKConfig.v2SecureServiceUrl=a.v2SecureServiceUrl),a.hasOwnProperty("identityUrl")&&(this.SDKConfig.identityUrl=a.identityUrl),a.hasOwnProperty("aliasUrl")&&(this.SDKConfig.aliasUrl=a.aliasUrl),a.hasOwnProperty("configUrl")&&(this.SDKConfig.configUrl=a.configUrl),a.hasOwnProperty("logLevel")&&(this.SDKConfig.logLevel=a.logLevel),this.SDKConfig.useNativeSdk=!!a.hasOwnProperty("useNativeSdk")&&a.useNativeSdk,a.hasOwnProperty("kits")&&(this.SDKConfig.kits=a.kits),this.SDKConfig.isIOS=a.hasOwnProperty("isIOS")?a.isIOS:mParticle.isIOS||!1,this.SDKConfig.useCookieStorage=!!a.hasOwnProperty("useCookieStorage")&&a.useCookieStorage,this.SDKConfig.maxProducts=a.hasOwnProperty("maxProducts")?a.maxProducts:Constants.DefaultConfig.maxProducts,this.SDKConfig.maxCookieSize=a.hasOwnProperty("maxCookieSize")?a.maxCookieSize:Constants.DefaultConfig.maxCookieSize,a.hasOwnProperty("appName")&&(this.SDKConfig.appName=a.appName),this.SDKConfig.integrationDelayTimeout=a.hasOwnProperty("integrationDelayTimeout")?a.integrationDelayTimeout:Constants.DefaultConfig.integrationDelayTimeout,a.hasOwnProperty("identifyRequest")&&(this.SDKConfig.identifyRequest=a.identifyRequest),a.hasOwnProperty("identityCallback")){var e=a.identityCallback;Validators$3.isFunction(e)?this.SDKConfig.identityCallback=a.identityCallback:b.warning("The optional callback must be a function. You tried entering a(n) "+_typeof_1(e)," . Callback not set. Please set your callback again.");}a.hasOwnProperty("appVersion")&&(this.SDKConfig.appVersion=a.appVersion),a.hasOwnProperty("sessionTimeout")&&(this.SDKConfig.sessionTimeout=a.sessionTimeout),this.SDKConfig.forceHttps=!a.hasOwnProperty("forceHttps")||a.forceHttps,a.hasOwnProperty("customFlags")&&(this.SDKConfig.customFlags=a.customFlags),a.hasOwnProperty("workspaceToken")?this.SDKConfig.workspaceToken=a.workspaceToken:b.warning("You should have a workspaceToken on your mParticle.config object for security purposes."),a.hasOwnProperty("requiredWebviewBridgeName")?this.SDKConfig.requiredWebviewBridgeName=a.requiredWebviewBridgeName:a.hasOwnProperty("workspaceToken")&&(this.SDKConfig.requiredWebviewBridgeName=a.workspaceToken),this.SDKConfig.minWebviewBridgeVersion=a.hasOwnProperty("minWebviewBridgeVersion")?a.minWebviewBridgeVersion:1,this.SDKConfig.aliasMaxWindow=a.hasOwnProperty("aliasMaxWindow")?a.aliasMaxWindow:Constants.DefaultConfig.aliasMaxWindow,a.hasOwnProperty("flags")||(this.SDKConfig.flags={}),this.SDKConfig.flags.hasOwnProperty(Constants.FeatureFlags.EventsV3)||(this.SDKConfig.flags[Constants.FeatureFlags.EventsV3]=0),this.SDKConfig.flags.hasOwnProperty(Constants.FeatureFlags.EventBatchingIntervalMillis)||(this.SDKConfig.flags[Constants.FeatureFlags.EventBatchingIntervalMillis]=Constants.DefaultConfig.uploadInterval),this.SDKConfig.flags.hasOwnProperty(Constants.FeatureFlags.ReportBatching)||(this.SDKConfig.flags[Constants.FeatureFlags.ReportBatching]=!1);}}

function Logger(a){var b=a.logLevel||"warning";this.logger=a.hasOwnProperty("logger")?a.logger:new ConsoleLogger,this.verbose=function(a){"none"!==b&&this.logger.verbose&&"verbose"===b&&this.logger.verbose(a);},this.warning=function(a){"none"!==b&&this.logger.warning&&("verbose"===b||"warning"===b)&&this.logger.warning(a);},this.error=function(a){"none"!==b&&this.logger.error&&this.logger.error(a);},this.setLogLevel=function(a){b=a;};}function ConsoleLogger(){this.verbose=function(a){window.console&&window.console.info&&window.console.info(a);},this.error=function(a){window.console&&window.console.error&&window.console.error(a);},this.warning=function(a){window.console&&window.console.warn&&window.console.warn(a);};}

var StorageNames$2=Constants.StorageNames,Base64$2=Polyfill.Base64,CookiesGlobalSettingsKeys={das:1},MPIDKeys={ui:1};//  if there is a cookie or localStorage:
//  1. determine which version it is ('mprtcl-api', 'mprtcl-v2', 'mprtcl-v3', 'mprtcl-v4')
//  2. return if 'mprtcl-v4', otherwise migrate to mprtclv4 schema
// 3. if 'mprtcl-api', could be JSSDKv2 or JSSDKv1. JSSDKv2 cookie has a 'globalSettings' key on it
function migrate(){try{migrateCookies();}catch(a){Persistence.expireCookies(StorageNames$2.cookieNameV3),Persistence.expireCookies(StorageNames$2.cookieNameV4),mParticle.Logger.error("Error migrating cookie: "+a);}if(mParticle.Store.isLocalStorageAvailable)try{migrateLocalStorage();}catch(a){localStorage.removeItem(StorageNames$2.localStorageNameV3),localStorage.removeItem(StorageNames$2.localStorageNameV4),mParticle.Logger.error("Error migrating localStorage: "+a);}}function migrateCookies(){var a,b,c,d,e,f,g=window.document.cookie.split("; ");for(mParticle.Logger.verbose(Constants.Messages.InformationMessages.CookieSearch),b=0,c=g.length;b<c;b++){//most recent version needs no migration
if(d=g[b].split("="),e=Helpers.decoded(d.shift()),f=Helpers.decoded(d.join("=")),e===mParticle.Store.storageName)return;if(e===StorageNames$2.cookieNameV4)return finishCookieMigration(f,StorageNames$2.cookieNameV4),void(mParticle.Store.isLocalStorageAvailable&&migrateProductsToNameSpace());// migration path for SDKv1CookiesV3, doesn't need to be encoded
if(e===StorageNames$2.cookieNameV3){a=convertSDKv1CookiesV3ToSDKv2CookiesV4(f),finishCookieMigration(a,StorageNames$2.cookieNameV3);break}}}function finishCookieMigration(a,b){var c,d,e=new Date,f=Persistence.getCookieDomain();c=new Date(e.getTime()+1e3*(60*(60*(24*StorageNames$2.CookieExpiration)))).toGMTString(),d=""===f?"":";domain="+f,mParticle.Logger.verbose(Constants.Messages.InformationMessages.CookieSet),window.document.cookie=encodeURIComponent(mParticle.Store.storageName)+"="+a+";expires="+c+";path=/"+d,Persistence.expireCookies(b),mParticle.Store.migratingToIDSyncCookies=!0;}function convertSDKv1CookiesV3ToSDKv2CookiesV4(a){a=Persistence.replacePipesWithCommas(Persistence.replaceApostrophesWithQuotes(a));var b=JSON.parse(a),c=JSON.parse(restructureToV4Cookie(a));return b.mpid&&(c.gs.csm.push(b.mpid),c.gs.csm=Base64$2.encode(JSON.stringify(c.gs.csm)),migrateProductsFromSDKv1ToSDKv2CookiesV4(b,b.mpid)),JSON.stringify(c)}function restructureToV4Cookie(a){try{var b={gs:{csm:[]}};for(var c in a=JSON.parse(a),a)a.hasOwnProperty(c)&&(CookiesGlobalSettingsKeys[c]?b.gs[c]=a[c]:"mpid"===c?b.cu=a[c]:a.mpid&&(b[a.mpid]=b[a.mpid]||{},MPIDKeys[c]&&(b[a.mpid][c]=a[c])));return JSON.stringify(b)}catch(a){mParticle.Logger.error("Failed to restructure previous cookie into most current cookie schema");}}function migrateProductsToNameSpace(){var a=StorageNames$2.localStorageProductsV4,b=localStorage.getItem(StorageNames$2.localStorageProductsV4);localStorage.setItem(mParticle.Store.prodStorageName,b),localStorage.removeItem(a);}function migrateProductsFromSDKv1ToSDKv2CookiesV4(a,b){if(mParticle.Store.isLocalStorageAvailable){var c={};if(c[b]={},a.cp){try{c[b].cp=JSON.parse(Base64$2.decode(a.cp));}catch(d){c[b].cp=a.cp;}Array.isArray(c[b].cp)||(c[b].cp=[]);}localStorage.setItem(mParticle.Store.prodStorageName,Base64$2.encode(JSON.stringify(c)));}}function migrateLocalStorage(){function a(a,b){try{window.localStorage.setItem(encodeURIComponent(mParticle.Store.storageName),a);}catch(a){mParticle.Logger.error("Error with setting localStorage item.");}window.localStorage.removeItem(encodeURIComponent(b));}var b,c,d,e,f=StorageNames$2.localStorageNameV3,g=StorageNames$2.localStorageNameV4,h=window.localStorage.getItem(mParticle.Store.storageName);if(!h){if(c=window.localStorage.getItem(g),c)return a(c,g),void migrateProductsToNameSpace();if(d=window.localStorage.getItem(f),d){// localStorage may contain only products, or the full persistence
// when there is an MPID on the cookie, it is the full persistence
if(mParticle.Store.migratingToIDSyncCookies=!0,e=d.slice(),d=JSON.parse(Persistence.replacePipesWithCommas(Persistence.replaceApostrophesWithQuotes(d))),d.mpid)return d=JSON.parse(convertSDKv1CookiesV3ToSDKv2CookiesV4(e)),void a(JSON.stringify(d),f);// if no MPID, it is only the products
if((d.cp||d.pb)&&!d.mpid)return b=Persistence.getCookie(),b?(migrateProductsFromSDKv1ToSDKv2CookiesV4(d,b.cu),void localStorage.removeItem(StorageNames$2.localStorageNameV3)):void localStorage.removeItem(StorageNames$2.localStorageNameV3)}}}var Migrations = {migrate:migrate,convertSDKv1CookiesV3ToSDKv2CookiesV4:convertSDKv1CookiesV3ToSDKv2CookiesV4};

function startForwardingStatsTimer(){mParticle._forwardingStatsTimer=setInterval(function(){prepareAndSendForwardingStatsBatch();},mParticle.Store.SDKConfig.forwarderStatsTimeout);}function prepareAndSendForwardingStatsBatch(){var a=Forwarders.getForwarderStatsQueue(),b=Persistence.forwardingStatsBatches.uploadsTable,c=Date.now();for(var d in a.length&&(b[c]={uploading:!1,data:a},Forwarders.setForwarderStatsQueue([])),b)(function(a){if(b.hasOwnProperty(a)&&!1===b[a].uploading){var c=function(){4===d.readyState&&(200===d.status||202===d.status?(mParticle.Logger.verbose("Successfully sent  "+d.statusText+" from server"),delete b[a]):"4"===d.status.toString()[0]?429!==d.status&&delete b[a]:b[a].uploading=!1);},d=Helpers.createXHR(c),e=b[a].data;b[a].uploading=!0,ApiClient.sendBatchForwardingStatsToServer(e,d);}})(d);}

var getDeviceId$1=Persistence.getDeviceId,Messages$8=Constants.Messages,Validators$4=Helpers.Validators,mParticleUser$1=Identity.mParticleUser,IdentityAPI$2=Identity.IdentityAPI,mParticleUserCart$1=Identity.mParticleUserCart,HTTPCodes$2=Constants.HTTPCodes;Array.prototype.forEach||(Array.prototype.forEach=Polyfill.forEach),Array.prototype.map||(Array.prototype.map=Polyfill.map),Array.prototype.filter||(Array.prototype.filter=Polyfill.filter),Array.isArray||(Array.prototype.isArray=Polyfill.isArray);/**
 * Invoke these methods on the mParticle object.
 * Example: mParticle.endSession()
 *
 * @class mParticle
 */var mParticle$1={config:window.mParticle?window.mParticle.config:{},Store:{},getDeviceId:getDeviceId$1,generateHash:Helpers.generateHash,sessionManager:SessionManager,cookieSyncManager:cookieSyncManager,persistence:Persistence,isIOS:!!(window.mParticle&&window.mParticle.isIOS)&&window.mParticle.isIOS,Identity:IdentityAPI$2,Validators:Validators$4,_Identity:Identity,_IdentityRequest:Identity.IdentityRequest,IdentityType:Types.IdentityType,EventType:Types.EventType,CommerceEventType:Types.CommerceEventType,PromotionType:Types.PromotionActionType,ProductActionType:Types.ProductActionType,/**
     * Initializes the mParticle SDK
     *
     * @method init
     * @param {String} apiKey your mParticle assigned API key
     * @param {Object} [options] an options object for additional configuration
     */init:function init(a,b){// /config code - Fetch config when requestConfig = true, otherwise, proceed with SDKInitialization
// Since fetching the configuration is asynchronous, we must pass completeSDKInitialization
// to it for it to be run after fetched
return !b&&window.mParticle.config&&(window.console.warn("You did not pass a config object to mParticle.init(). Attempting to use the window.mParticle.config if it exists. Please note that in a future release, this may not work and mParticle will not initialize properly"),b=window.mParticle.config),runPreConfigFetchInitialization(a,b),b?void(!b.hasOwnProperty("requestConfig")||b.requestConfig?ApiClient.getSDKConfiguration(a,b,completeSDKInitialization):completeSDKInitialization(a,b)):void window.console.error("No config available on the window, please pass a config object to mParticle.init()")},setLogLevel:function setLogLevel(a){mParticle$1.Logger.setLogLevel(a);},/**
     * Completely resets the state of the SDK. mParticle.init(apiKey, window.mParticle.config) will need to be called again.
     * @method reset
     * @param {Boolean} keepPersistence if passed as true, this method will only reset the in-memory SDK state.
     */reset:function reset(a,b){mParticle$1.Store&&delete mParticle$1.Store,mParticle$1.Store=new Store(a),mParticle$1.Store.isLocalStorageAvailable=Persistence.determineLocalStorageAvailability(window.localStorage),Events.stopTracking(),b||Persistence.resetPersistence(),Persistence.forwardingStatsBatches.uploadsTable={},Persistence.forwardingStatsBatches.forwardingStatsEventQueue=[],mParticle$1.preInit={readyQueue:[],pixelConfigurations:[],integrationDelays:{},forwarderConstructors:[],isDevelopmentMode:!1};},ready:function ready(a){mParticle$1.Store.isInitialized&&"function"==typeof a?a():mParticle$1.preInit.readyQueue.push(a);},/**
     * Returns the mParticle SDK version number
     * @method getVersion
     * @return {String} mParticle SDK version number
     */getVersion:function getVersion(){return Constants.sdkVersion},/**
     * Sets the app version
     * @method setAppVersion
     * @param {String} version version number
     */setAppVersion:function setAppVersion(a){mParticle$1.Store.SDKConfig.appVersion=a,Persistence.update();},/**
     * Gets the app name
     * @method getAppName
     * @return {String} App name
     */getAppName:function getAppName(){return mParticle$1.Store.SDKConfig.appName},/**
     * Sets the app name
     * @method setAppName
     * @param {String} name App Name
     */setAppName:function setAppName(a){mParticle$1.Store.SDKConfig.appName=a;},/**
     * Gets the app version
     * @method getAppVersion
     * @return {String} App version
     */getAppVersion:function getAppVersion(){return mParticle$1.Store.SDKConfig.appVersion},/**
     * Stops tracking the location of the user
     * @method stopTrackingLocation
     */stopTrackingLocation:function stopTrackingLocation(){SessionManager.resetSessionTimer(),Events.stopTracking();},/**
     * Starts tracking the location of the user
     * @method startTrackingLocation
     * @param {Function} [callback] A callback function that is called when the location is either allowed or rejected by the user. A position object of schema {coords: {latitude: number, longitude: number}} is passed to the callback
     */startTrackingLocation:function startTrackingLocation(a){Validators$4.isFunction(a)||mParticle$1.Logger.warning("Warning: Location tracking is triggered, but not including a callback into the `startTrackingLocation` may result in events logged too quickly and not being associated with a location."),SessionManager.resetSessionTimer(),Events.startTracking(a);},/**
     * Sets the position of the user
     * @method setPosition
     * @param {Number} lattitude lattitude digit
     * @param {Number} longitude longitude digit
     */setPosition:function setPosition(a,b){SessionManager.resetSessionTimer(),"number"==typeof a&&"number"==typeof b?mParticle$1.Store.currentPosition={lat:a,lng:b}:mParticle$1.Logger.error("Position latitude and/or longitude must both be of type number");},/**
     * Starts a new session
     * @method startNewSession
     */startNewSession:function startNewSession(){SessionManager.startNewSession();},/**
     * Ends the current session
     * @method endSession
     */endSession:function endSession(){// Sends true as an over ride vs when endSession is called from the setInterval
SessionManager.endSession(!0);},/**
     * Logs a Base Event to mParticle's servers
     * @param {Object} event Base Event Object
     */logBaseEvent:function logBaseEvent(a){return (SessionManager.resetSessionTimer(),"string"!=typeof a.name)?void mParticle$1.Logger.error(Messages$8.ErrorMessages.EventNameInvalidType):(a.type||(a.type=Types.EventType.Unknown),Helpers.canLog()?void Events.logEvent(a):void mParticle$1.Logger.error(Messages$8.ErrorMessages.LoggingDisabled))},/**
     * Logs an event to mParticle's servers
     * @method logEvent
     * @param {String} eventName The name of the event
     * @param {Number} [eventType] The eventType as seen [here](http://docs.mparticle.com/developers/sdk/web/event-tracking#event-type)
     * @param {Object} [eventInfo] Attributes for the event
     * @param {Object} [customFlags] Additional customFlags
     */logEvent:function logEvent(a,b,c,d){return (SessionManager.resetSessionTimer(),"string"!=typeof a)?void mParticle$1.Logger.error(Messages$8.ErrorMessages.EventNameInvalidType):(b||(b=Types.EventType.Unknown),Helpers.isEventType(b)?Helpers.canLog()?void Events.logEvent({messageType:Types.MessageType.PageEvent,name:a,data:c,eventType:b,customFlags:d}):void mParticle$1.Logger.error(Messages$8.ErrorMessages.LoggingDisabled):void mParticle$1.Logger.error("Invalid event type: "+b+", must be one of: \n"+JSON.stringify(Types.EventType)))},/**
     * Used to log custom errors
     *
     * @method logError
     * @param {String or Object} error The name of the error (string), or an object formed as follows {name: 'exampleName', message: 'exampleMessage', stack: 'exampleStack'}
     * @param {Object} [attrs] Custom attrs to be passed along with the error event; values must be string, number, or boolean
     */logError:function logError(a,b){if(SessionManager.resetSessionTimer(),!!a){"string"==typeof a&&(a={message:a});var c={m:a.message?a.message:a,s:"Error",t:a.stack};if(b){var d=Helpers.sanitizeAttributes(b);for(var e in d)c[e]=d[e];}Events.logEvent({messageType:Types.MessageType.CrashReport,name:a.name?a.name:"Error",data:c,eventType:Types.EventType.Other});}},/**
     * Logs `click` events
     * @method logLink
     * @param {String} selector The selector to add a 'click' event to (ex. #purchase-event)
     * @param {String} [eventName] The name of the event
     * @param {Number} [eventType] The eventType as seen [here](http://docs.mparticle.com/developers/sdk/javascript/event-tracking#event-type)
     * @param {Object} [eventInfo] Attributes for the event
     */logLink:function logLink(a,b,c,d){SessionManager.resetSessionTimer(),Events.addEventHandler("click",a,b,d,c);},/**
     * Logs `submit` events
     * @method logForm
     * @param {String} selector The selector to add the event handler to (ex. #search-event)
     * @param {String} [eventName] The name of the event
     * @param {Number} [eventType] The eventType as seen [here](http://docs.mparticle.com/developers/sdk/javascript/event-tracking#event-type)
     * @param {Object} [eventInfo] Attributes for the event
     */logForm:function logForm(a,b,c,d){SessionManager.resetSessionTimer(),Events.addEventHandler("submit",a,b,d,c);},/**
     * Logs a page view
     * @method logPageView
     * @param {String} eventName The name of the event. Defaults to 'PageView'.
     * @param {Object} [attrs] Attributes for the event
     * @param {Object} [customFlags] Custom flags for the event
     */logPageView:function logPageView(a,b,c){if(SessionManager.resetSessionTimer(),Helpers.canLog()){if(Validators$4.isStringOrNumber(a)||(a="PageView"),!b)b={hostname:window.location.hostname,title:window.document.title};else if(!Helpers.isObject(b))return void mParticle$1.Logger.error("The attributes argument must be an object. A "+_typeof_1(b)+" was entered. Please correct and retry.");if(c&&!Helpers.isObject(c))return void mParticle$1.Logger.error("The customFlags argument must be an object. A "+_typeof_1(c)+" was entered. Please correct and retry.")}Events.logEvent({messageType:Types.MessageType.PageView,name:a,data:b,eventType:Types.EventType.Unknown,customFlags:c});},Consent:{createGDPRConsent:Consent.createGDPRConsent,createConsentState:Consent.createConsentState},/**
     * Invoke these methods on the mParticle.eCommerce object.
     * Example: mParticle.eCommerce.createImpresion(...)
     * @class mParticle.eCommerce
     */eCommerce:{/**
         * Invoke these methods on the mParticle.eCommerce.Cart object.
         * Example: mParticle.eCommerce.Cart.add(...)
         * @class mParticle.eCommerce.Cart
         */Cart:{/**
             * Adds a product to the cart
             * @method add
             * @param {Object} product The product you want to add to the cart
             * @param {Boolean} [logEventBoolean] Option to log the event to mParticle's servers. If blank, no logging occurs.
             */add:function add(a,b){var c,d=mParticle$1.Identity.getCurrentUser();d&&(c=d.getMPID()),mParticleUserCart$1(c).add(a,b);},/**
             * Removes a product from the cart
             * @method remove
             * @param {Object} product The product you want to add to the cart
             * @param {Boolean} [logEventBoolean] Option to log the event to mParticle's servers. If blank, no logging occurs.
             */remove:function remove(a,b){var c,d=mParticle$1.Identity.getCurrentUser();d&&(c=d.getMPID()),mParticleUserCart$1(c).remove(a,b);},/**
             * Clears the cart
             * @method clear
             */clear:function clear(){var a,b=mParticle$1.Identity.getCurrentUser();b&&(a=b.getMPID()),mParticleUserCart$1(a).clear();}},/**
         * Sets the currency code
         * @for mParticle.eCommerce
         * @method setCurrencyCode
         * @param {String} code The currency code
         */setCurrencyCode:function setCurrencyCode(a){return "string"==typeof a?void(SessionManager.resetSessionTimer(),mParticle$1.Store.currencyCode=a):void mParticle$1.Logger.error("Code must be a string")},/**
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
         */createProduct:function createProduct(a,b,c,d,e,f,g,h,i,j){return SessionManager.resetSessionTimer(),Ecommerce.createProduct(a,b,c,d,e,f,g,h,i,j)},/**
         * Creates a promotion
         * @for mParticle.eCommerce
         * @method createPromotion
         * @param {String} id a unique promotion id
         * @param {String} [creative] promotion creative
         * @param {String} [name] promotion name
         * @param {Number} [position] promotion position
         */createPromotion:function createPromotion(a,b,c,d){return SessionManager.resetSessionTimer(),Ecommerce.createPromotion(a,b,c,d)},/**
         * Creates a product impression
         * @for mParticle.eCommerce
         * @method createImpression
         * @param {String} name impression name
         * @param {Object} product the product for which an impression is being created
         */createImpression:function createImpression(a,b){return SessionManager.resetSessionTimer(),Ecommerce.createImpression(a,b)},/**
         * Creates a transaction attributes object to be used with a checkout
         * @for mParticle.eCommerce
         * @method createTransactionAttributes
         * @param {String or Number} id a unique transaction id
         * @param {String} [affiliation] affilliation
         * @param {String} [couponCode] the coupon code for which you are creating transaction attributes
         * @param {Number} [revenue] total revenue for the product being purchased
         * @param {String} [shipping] the shipping method
         * @param {Number} [tax] the tax amount
         */createTransactionAttributes:function createTransactionAttributes(a,b,c,d,e,f){return SessionManager.resetSessionTimer(),Ecommerce.createTransactionAttributes(a,b,c,d,e,f)},/**
         * Logs a checkout action
         * @for mParticle.eCommerce
         * @method logCheckout
         * @param {Number} step checkout step number
         * @param {Object} options
         * @param {Object} attrs
         * @param {Object} [customFlags] Custom flags for the event
         */logCheckout:function logCheckout(a,b,c,d){SessionManager.resetSessionTimer(),Events.logCheckoutEvent(a,b,c,d);},/**
         * Logs a product action
         * @for mParticle.eCommerce
         * @method logProductAction
         * @param {Number} productActionType product action type as found [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/src/types.js#L206-L218)
         * @param {Object} product the product for which you are creating the product action
         * @param {Object} [attrs] attributes related to the product action
         * @param {Object} [customFlags] Custom flags for the event
         */logProductAction:function logProductAction(a,b,c,d){SessionManager.resetSessionTimer(),Events.logProductActionEvent(a,b,c,d);},/**
         * Logs a product purchase
         * @for mParticle.eCommerce
         * @method logPurchase
         * @param {Object} transactionAttributes transactionAttributes object
         * @param {Object} product the product being purchased
         * @param {Boolean} [clearCart] boolean to clear the cart after logging or not. Defaults to false
         * @param {Object} [attrs] other attributes related to the product purchase
         * @param {Object} [customFlags] Custom flags for the event
         */logPurchase:function logPurchase(a,b,c,d,e){return a&&b?void(SessionManager.resetSessionTimer(),Events.logPurchaseEvent(a,b,d,e),!0===c&&mParticle$1.eCommerce.Cart.clear()):void mParticle$1.Logger.error(Messages$8.ErrorMessages.BadLogPurchase)},/**
         * Logs a product promotion
         * @for mParticle.eCommerce
         * @method logPromotion
         * @param {Number} type the promotion type as found [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/src/types.js#L275-L279)
         * @param {Object} promotion promotion object
         * @param {Object} [attrs] boolean to clear the cart after logging or not
         * @param {Object} [customFlags] Custom flags for the event
         */logPromotion:function logPromotion(a,b,c,d){SessionManager.resetSessionTimer(),Events.logPromotionEvent(a,b,c,d);},/**
         * Logs a product impression
         * @for mParticle.eCommerce
         * @method logImpression
         * @param {Object} impression product impression object
         * @param {Object} attrs attributes related to the impression log
         * @param {Object} [customFlags] Custom flags for the event
         */logImpression:function logImpression(a,b,c){SessionManager.resetSessionTimer(),Events.logImpressionEvent(a,b,c);},/**
         * Logs a refund
         * @for mParticle.eCommerce
         * @method logRefund
         * @param {Object} transactionAttributes transaction attributes related to the refund
         * @param {Object} product product being refunded
         * @param {Boolean} [clearCart] boolean to clear the cart after refund is logged. Defaults to false.
         * @param {Object} [attrs] attributes related to the refund
         * @param {Object} [customFlags] Custom flags for the event
         */logRefund:function logRefund(a,b,c,d,e){SessionManager.resetSessionTimer(),Events.logRefundEvent(a,b,d,e),!0===c&&mParticle$1.eCommerce.Cart.clear();},expandCommerceEvent:function expandCommerceEvent(a){return SessionManager.resetSessionTimer(),Ecommerce.expandCommerceEvent(a)}},/**
     * Sets a session attribute
     * @for mParticle
     * @method setSessionAttribute
     * @param {String} key key for session attribute
     * @param {String or Number} value value for session attribute
     */setSessionAttribute:function setSessionAttribute(a,b){// Logs to cookie
// And logs to in-memory object
// Example: mParticle.setSessionAttribute('location', '33431');
if(SessionManager.resetSessionTimer(),Helpers.canLog()){if(!Validators$4.isValidAttributeValue(b))return void mParticle$1.Logger.error(Messages$8.ErrorMessages.BadAttribute);if(!Validators$4.isValidKeyValue(a))return void mParticle$1.Logger.error(Messages$8.ErrorMessages.BadKey);if(mParticle$1.Store.webviewBridgeEnabled)NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetSessionAttribute,JSON.stringify({key:a,value:b}));else{var c=Helpers.findKeyInObject(mParticle$1.Store.sessionAttributes,a);c&&(a=c),mParticle$1.Store.sessionAttributes[a]=b,Persistence.update(),Forwarders.applyToForwarders("setSessionAttribute",[a,b]);}}},/**
     * Set opt out of logging
     * @for mParticle
     * @method setOptOut
     * @param {Boolean} isOptingOut boolean to opt out or not. When set to true, opt out of logging.
     */setOptOut:function setOptOut(a){SessionManager.resetSessionTimer(),mParticle$1.Store.isEnabled=!a,Events.logOptOut(),Persistence.update(),mParticle$1.Store.activeForwarders.length&&mParticle$1.Store.activeForwarders.forEach(function(b){if(b.setOptOut){var c=b.setOptOut(a);c&&mParticle$1.Logger.verbose(c);}});},/**
     * Set or remove the integration attributes for a given integration ID.
     * Integration attributes are keys and values specific to a given integration. For example,
     * many integrations have their own internal user/device ID. mParticle will store integration attributes
     * for a given device, and will be able to use these values for server-to-server communication to services.
     * This is often useful when used in combination with a server-to-server feed, allowing the feed to be enriched
     * with the necessary integration attributes to be properly forwarded to the given integration.
     * @for mParticle
     * @method setIntegrationAttribute
     * @param {Number} integrationId mParticle integration ID
     * @param {Object} attrs a map of attributes that will replace any current attributes. The keys are predefined by mParticle.
     * Please consult with the mParticle docs or your solutions consultant for the correct value. You may
     * also pass a null or empty map here to remove all of the attributes.
     */setIntegrationAttribute:function setIntegrationAttribute(a,b){if("number"!=typeof a)return void mParticle$1.Logger.error("integrationId must be a number");if(null===b)mParticle$1.Store.integrationAttributes[a]={};else{if(!Helpers.isObject(b))return void mParticle$1.Logger.error("Attrs must be an object with keys and values. You entered a "+_typeof_1(b));if(0===Object.keys(b).length)mParticle$1.Store.integrationAttributes[a]={};else for(var c in b)if("string"!=typeof c){mParticle$1.Logger.error("Keys must be strings, you entered a "+_typeof_1(c));continue}else if("string"==typeof b[c])Helpers.isObject(mParticle$1.Store.integrationAttributes[a])?mParticle$1.Store.integrationAttributes[a][c]=b[c]:(mParticle$1.Store.integrationAttributes[a]={},mParticle$1.Store.integrationAttributes[a][c]=b[c]);else{mParticle$1.Logger.error("Values for integration attributes must be strings. You entered a "+_typeof_1(b[c]));continue}}Persistence.update();},/**
     * Get integration attributes for a given integration ID.
     * @method getIntegrationAttributes
     * @param {Number} integrationId mParticle integration ID
     * @return {Object} an object map of the integrationId's attributes
     */getIntegrationAttributes:function getIntegrationAttributes(a){return mParticle$1.Store.integrationAttributes[a]?mParticle$1.Store.integrationAttributes[a]:{}},addForwarder:function addForwarder(a){mParticle$1.preInit.forwarderConstructors.push(a);},configurePixel:function configurePixel(a){Forwarders.configurePixel(a);},_getActiveForwarders:function _getActiveForwarders(){return mParticle$1.Store.activeForwarders},_getIntegrationDelays:function _getIntegrationDelays(){return mParticle$1.preInit.integrationDelays},_setIntegrationDelay:function _setIntegrationDelay(a,b){mParticle$1.preInit.integrationDelays[a]=b;}};function completeSDKInitialization(a,b){if(mParticle$1.Store.configurationLoaded=!0,mParticle$1.Store.webviewBridgeEnabled)NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetSessionAttribute,JSON.stringify({key:"$src_env",value:"webview"})),a&&NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetSessionAttribute,JSON.stringify({key:"$src_key",value:a}));else{var c;// If no initialIdentityRequest is passed in, we set the user identities to what is currently in cookies for the identify request
if(Helpers.isObject(mParticle$1.Store.SDKConfig.identifyRequest)&&Helpers.isObject(mParticle$1.Store.SDKConfig.identifyRequest.userIdentities)&&0===Object.keys(mParticle$1.Store.SDKConfig.identifyRequest.userIdentities).length||!mParticle$1.Store.SDKConfig.identifyRequest){var d={};if(c=mParticle$1.Identity.getCurrentUser(),c){var e=c.getUserIdentities().userIdentities||{};for(var f in e)e.hasOwnProperty(f)&&(d[f]=e[f]);}mParticle$1.Store.SDKConfig.identifyRequest={userIdentities:d};}// If migrating from pre-IDSync to IDSync, a sessionID will exist and an identify request will not have been fired, so we need this check
mParticle$1.Store.migratingToIDSyncCookies&&(IdentityAPI$2.identify(mParticle$1.Store.SDKConfig.identifyRequest,mParticle$1.Store.SDKConfig.identityCallback),mParticle$1.Store.migratingToIDSyncCookies=!1),c=IdentityAPI$2.getCurrentUser(),Helpers.getFeatureFlag(Constants.FeatureFlags.ReportBatching)&&startForwardingStatsTimer(),Forwarders.processForwarders(b,ApiClient.prepareForwardingStats),!mParticle$1.Store.identifyCalled&&mParticle$1.Store.SDKConfig.identityCallback&&c&&c.getMPID()&&mParticle$1.Store.SDKConfig.identityCallback({httpCode:HTTPCodes$2.activeSession,getUser:function getUser(){return mParticleUser$1(c.getMPID())},getPreviousUser:function getPreviousUser(){var a=mParticle$1.Identity.getUsers(),b=a.shift();return b&&c&&b.getMPID()===c.getMPID()&&(b=a.shift()),b||null},body:{mpid:c.getMPID(),is_logged_in:mParticle$1.Store.isLoggedIn,matched_identities:c.getUserIdentities().userIdentities,context:null,is_ephemeral:!1}}),mParticle$1.sessionManager.initialize(),Events.logAST();}// Call any functions that are waiting for the library to be initialized
mParticle$1.preInit.readyQueue&&mParticle$1.preInit.readyQueue.length&&(mParticle$1.preInit.readyQueue.forEach(function(a){Validators$4.isFunction(a)?a():Array.isArray(a)&&processPreloadedItem(a);}),mParticle$1.preInit.readyQueue=[]),mParticle$1.Store.isInitialized=!0,mParticle$1.Store.isFirstRun&&(mParticle$1.Store.isFirstRun=!1);}function runPreConfigFetchInitialization(a,b){//check to see if localStorage is available for migrating purposes
mParticle$1.Logger=new Logger(b),mParticle$1.Store=new Store(b,mParticle$1.Logger),mParticle$1.Store.devToken=a||null,mParticle$1.Logger.verbose(Messages$8.InformationMessages.StartingInitialization),mParticle$1.Store.isLocalStorageAvailable=Persistence.determineLocalStorageAvailability(window.localStorage),mParticle$1.Store.webviewBridgeEnabled=NativeSdkHelpers.isWebviewEnabled(mParticle$1.Store.SDKConfig.requiredWebviewBridgeName,mParticle$1.Store.SDKConfig.minWebviewBridgeVersion),mParticle$1.Store.webviewBridgeEnabled||(Migrations.migrate(),Persistence.initializeStorage());}function processPreloadedItem(a){var b,c=a,d=c.splice(0,1)[0];if(mParticle$1[c[0]])mParticle$1[d].apply(this,c);else{var e=d.split(".");try{for(var f,g=mParticle$1,h=0;h<e.length;h++)f=e[h],g=g[f];g.apply(b,c);}catch(a){mParticle$1.Logger.verbose("Unable to compute proper mParticle function "+a);}}}mParticle$1.preInit={readyQueue:[],integrationDelays:{},forwarderConstructors:[]},window.mParticle&&window.mParticle.config&&window.mParticle.config.hasOwnProperty("rq")&&(mParticle$1.preInit.readyQueue=window.mParticle.config.rq),window.mParticle=mParticle$1;

module.exports = mParticle$1;
