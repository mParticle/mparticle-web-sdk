var mParticle = (function () {
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
	var Base64 = {
	  _keyStr: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
	  // Input must be a string
	  encode: function encode(input) {
	    try {
	      if (window.btoa && window.atob) {
	        return window.btoa(unescape(encodeURIComponent(input)));
	      }
	    } catch (e) {
	      window.console.log('Error encoding cookie values into Base64:' + e);
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

	      output = output + Base64._keyStr.charAt(enc1) + Base64._keyStr.charAt(enc2) + Base64._keyStr.charAt(enc3) + Base64._keyStr.charAt(enc4);
	    }

	    return output;
	  },
	  decode: function decode(input) {
	    try {
	      if (window.btoa && window.atob) {
	        return decodeURIComponent(escape(window.atob(input)));
	      }
	    } catch (e) {//log(e);
	    }

	    return Base64._decode(input);
	  },
	  _decode: function _decode(input) {
	    var output = '';
	    var chr1, chr2, chr3;
	    var enc1, enc2, enc3, enc4;
	    var i = 0;
	    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

	    while (i < input.length) {
	      enc1 = Base64._keyStr.indexOf(input.charAt(i++));
	      enc2 = Base64._keyStr.indexOf(input.charAt(i++));
	      enc3 = Base64._keyStr.indexOf(input.charAt(i++));
	      enc4 = Base64._keyStr.indexOf(input.charAt(i++));
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
	  filter: function filter(fun
	  /*, thisArg*/
	  ) {

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
	  Base64: Base64
	};

	var MessageType = {
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
	}; // Continuation of enum above, but in seperate object since we don't expose these to end user

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
	  Other4: 12
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

	    default:
	      return false;
	  }
	};

	IdentityType.getIdentityName = function (identityType) {
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
	}; // these are the action names used by server and mobile SDKs when expanding a CommerceEvent


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
	}; // these are the names that the server and mobile SDKs use while expanding CommerceEvent


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
	var ApplicationTransitionType = {
	  AppInit: 1
	};
	var Types = {
	  MessageType: MessageType,
	  EventType: EventType,
	  CommerceEventType: CommerceEventType,
	  IdentityType: IdentityType,
	  ProfileMessageType: ProfileMessageType,
	  ApplicationTransitionType: ApplicationTransitionType,
	  ProductActionType: ProductActionType,
	  PromotionActionType: PromotionActionType
	};

	var Constants = {
	  sdkVersion: '2.9.14',
	  sdkVendor: 'mparticle',
	  platform: 'web',
	  Messages: {
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
	      BadLogPurchase: 'Transaction attributes and a product are both required to log a purchase, https://docs.mparticle.com/?javascript#measuring-transactions'
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
	      OnUserAliasType: 'The onUserAlias value must be a function. The onUserAlias provided is of type',
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
	    Alias: 'aliasUsers'
	  },
	  StorageNames: {
	    localStorageName: 'mprtcl-api',
	    // Name of the mP localstorage, had cp and pb even if cookies were used, skipped v2
	    localStorageNameV3: 'mprtcl-v3',
	    // v3 Name of the mP localstorage, final version on SDKv1
	    cookieName: 'mprtcl-api',
	    // v1 Name of the cookie stored on the user's machine
	    cookieNameV2: 'mprtcl-v2',
	    // v2 Name of the cookie stored on the user's machine. Removed keys with no values, moved cartProducts and productBags to localStorage.
	    cookieNameV3: 'mprtcl-v3',
	    // v3 Name of the cookie stored on the user's machine. Base64 encoded keys in Base64CookieKeys object, final version on SDKv1
	    localStorageNameV4: 'mprtcl-v4',
	    // v4 Name of the mP localstorage, Current Version
	    localStorageProductsV4: 'mprtcl-prodv4',
	    // The name for mP localstorage that contains products for cartProducs and productBags
	    cookieNameV4: 'mprtcl-v4',
	    // v4 Name of the cookie stored on the user's machine. Base64 encoded keys in Base64CookieKeys object, current version on SDK v2
	    currentStorageName: 'mprtcl-v4',
	    currentStorageProductsName: 'mprtcl-prodv4'
	  },
	  DefaultConfig: {
	    cookieDomain: null,
	    // If null, defaults to current location.host
	    cookieExpiration: 365,
	    // Cookie expiration time in days
	    logLevel: null,
	    // What logging will be provided in the console
	    timeout: 300,
	    // timeout in milliseconds for logging functions
	    sessionTimeout: 30,
	    // Session timeout in minutes
	    maxProducts: 20,
	    // Number of products persisted in cartProducts and productBags
	    forwarderStatsTimeout: 5000,
	    // Milliseconds for forwarderStats timeout
	    integrationDelayTimeout: 5000,
	    // Milliseconds for forcing the integration delay to un-suspend event queueing due to integration partner errors
	    maxCookieSize: 3000,
	    // Number of bytes for cookie size to not exceed
	    aliasMaxWindow: 90,
	    // Max age of Alias request startTime, in days
	    uploadInterval: 0 // Maximum milliseconds in between batch uploads, below 500 will mean immediate upload

	  },
	  DefaultUrls: {
	    v1SecureServiceUrl: 'jssdks.mparticle.com/v1/JS/',
	    v2SecureServiceUrl: 'jssdks.mparticle.com/v2/JS/',
	    v3SecureServiceUrl: 'jssdks.mparticle.com/v3/JS/',
	    configUrl: 'jssdkcdns.mparticle.com/JS/v2/',
	    identityUrl: 'identity.mparticle.com/v1/',
	    aliasUrl: 'jssdks.mparticle.com/v1/identity/'
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
	    EventsV3: 'eventsV3',
	    EventBatchingIntervalMillis: 'eventBatchingIntervalMillis'
	  }
	};

	var StorageNames = Constants.StorageNames,
	    pluses = /\+/g;

	function canLog() {
	  if (mParticle.Store.isEnabled && (mParticle.Store.devToken || mParticle.Store.webviewBridgeEnabled)) {
	    return true;
	  }

	  return false;
	}

	function returnConvertedBoolean(data) {
	  if (data === 'false' || data === '0') {
	    return false;
	  } else {
	    return Boolean(data);
	  }
	}

	function getFeatureFlag(feature) {
	  if (mParticle.Store.SDKConfig.flags.hasOwnProperty(feature)) {
	    return mParticle.Store.SDKConfig.flags[feature];
	  }

	  return null;
	}
	/**
	 * Returns a value between 1-100 inclusive.
	 */


	function getRampNumber(deviceId) {
	  if (!deviceId) {
	    return 100;
	  }

	  var hash = generateHash(deviceId);
	  return Math.abs(hash % 100) + 1;
	}

	function invokeCallback(callback, code, body, mParticleUser, previousMpid) {
	  if (!callback) {
	    mParticle.Logger.warning('There is no callback provided');
	  }

	  try {
	    if (Validators.isFunction(callback)) {
	      callback({
	        httpCode: code,
	        body: body,
	        getUser: function getUser() {
	          if (mParticleUser) {
	            return mParticleUser;
	          } else {
	            return mParticle.Identity.getCurrentUser();
	          }
	        },
	        getPreviousUser: function getPreviousUser() {
	          if (!previousMpid) {
	            var users = mParticle.Identity.getUsers();
	            var mostRecentUser = users.shift();
	            var currentUser = mParticleUser || mParticle.Identity.getCurrentUser();

	            if (mostRecentUser && currentUser && mostRecentUser.getMPID() === currentUser.getMPID()) {
	              mostRecentUser = users.shift();
	            }

	            return mostRecentUser || null;
	          } else {
	            return mParticle.Identity.getUser(previousMpid);
	          }
	        }
	      });
	    }
	  } catch (e) {
	    mParticle.Logger.error('There was an error with your callback: ' + e);
	  }
	}

	function invokeAliasCallback(callback, code, message) {
	  if (!callback) {
	    mParticle.Logger.warning('There is no callback provided');
	  }

	  try {
	    if (Validators.isFunction(callback)) {
	      var callbackMessage = {
	        httpCode: code
	      };

	      if (message) {
	        callbackMessage.message = message;
	      }

	      callback(callbackMessage);
	    }
	  } catch (e) {
	    mParticle.Logger.error('There was an error with your callback: ' + e);
	  }
	} // Standalone version of jQuery.extend, from https://github.com/dansdom/extend


	function extend() {
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
	    target = arguments[1] || {}; // skip the boolean and the target

	    i = 2;
	  } // Handle case when target is a string or something (possible in deep copy)


	  if (_typeof_1(target) !== 'object' && !objectHelper.isFunction(target)) {
	    target = {};
	  } // If no second argument is used then this can extend an object that is using this method


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
	        copy = options[name]; // Prevent never-ending loop

	        if (target === copy) {
	          continue;
	        } // Recurse if we're merging plain objects or arrays


	        if (deep && copy && (objectHelper.isPlainObject(copy) || (copyIsArray = objectHelper.isArray(copy)))) {
	          if (copyIsArray) {
	            copyIsArray = false;
	            clone = src && objectHelper.isArray(src) ? src : [];
	          } else {
	            clone = src && objectHelper.isPlainObject(src) ? src : {};
	          } // Never move original objects, clone them


	          target[name] = extend(deep, clone, copy); // Don't bring in undefined values
	        } else if (copy !== undefined) {
	          target[name] = copy;
	        }
	      }
	    }
	  } // Return the modified object


	  return target;
	}

	function isObject(value) {
	  var objType = Object.prototype.toString.call(value);
	  return objType === '[object Object]' || objType === '[object Error]';
	}

	function inArray(items, name) {
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
	}

	function createServiceUrl(secureServiceUrl, devToken) {
	  var serviceScheme = window.mParticle && mParticle.Store.SDKConfig.forceHttps ? 'https://' : window.location.protocol + '//';
	  var baseUrl;

	  if (mParticle.Store.SDKConfig.forceHttps) {
	    baseUrl = 'https://' + secureServiceUrl;
	  } else {
	    baseUrl = serviceScheme + secureServiceUrl;
	  }

	  if (devToken) {
	    baseUrl = baseUrl + devToken;
	  }

	  return baseUrl;
	}

	function createXHR(cb) {
	  var xhr;

	  try {
	    xhr = new window.XMLHttpRequest();
	  } catch (e) {
	    mParticle.Logger.error('Error creating XMLHttpRequest object.');
	  }

	  if (xhr && cb && 'withCredentials' in xhr) {
	    xhr.onreadystatechange = cb;
	  } else if (typeof window.XDomainRequest !== 'undefined') {
	    mParticle.Logger.verbose('Creating XDomainRequest object');

	    try {
	      xhr = new window.XDomainRequest();
	      xhr.onload = cb;
	    } catch (e) {
	      mParticle.Logger.error('Error creating XDomainRequest object');
	    }
	  }

	  return xhr;
	}

	function generateRandomValue(a) {
	  var randomValue;

	  if (window.crypto && window.crypto.getRandomValues) {
	    randomValue = window.crypto.getRandomValues(new Uint8Array(1)); // eslint-disable-line no-undef
	  }

	  if (randomValue) {
	    return (a ^ randomValue[0] % 16 >> a / 4).toString(16);
	  }

	  return (a ^ Math.random() * 16 >> a / 4).toString(16);
	}

	function generateUniqueId(a) {
	  // https://gist.github.com/jed/982883
	  // Added support for crypto for better random
	  return a // if the placeholder was passed, return
	  ? generateRandomValue(a) // a random number
	  : // or otherwise a concatenated string:
	  ([1e7] + // 10000000 +
	  -1e3 + // -1000 +
	  -4e3 + // -4000 +
	  -8e3 + // -80000000 +
	  -1e11). // -100000000000,
	  replace( // replacing
	  /[018]/g, // zeroes, ones, and eights with
	  generateUniqueId // random hex digits
	  );
	}

	function filterUserIdentities(userIdentitiesObject, filterList) {
	  var filteredUserIdentities = [];

	  if (userIdentitiesObject && Object.keys(userIdentitiesObject).length) {
	    for (var userIdentityName in userIdentitiesObject) {
	      if (userIdentitiesObject.hasOwnProperty(userIdentityName)) {
	        var userIdentityType = Types.IdentityType.getIdentityType(userIdentityName);

	        if (!inArray(filterList, userIdentityType)) {
	          var identity = {
	            Type: userIdentityType,
	            Identity: userIdentitiesObject[userIdentityName]
	          };

	          if (userIdentityType === mParticle.IdentityType.CustomerId) {
	            filteredUserIdentities.unshift(identity);
	          } else {
	            filteredUserIdentities.push(identity);
	          }
	        }
	      }
	    }
	  }

	  return filteredUserIdentities;
	}

	function filterUserIdentitiesForForwarders(userIdentitiesObject, filterList) {
	  var filteredUserIdentities = {};

	  if (userIdentitiesObject && Object.keys(userIdentitiesObject).length) {
	    for (var userIdentityName in userIdentitiesObject) {
	      if (userIdentitiesObject.hasOwnProperty(userIdentityName)) {
	        var userIdentityType = Types.IdentityType.getIdentityType(userIdentityName);

	        if (!inArray(filterList, userIdentityType)) {
	          filteredUserIdentities[userIdentityName] = userIdentitiesObject[userIdentityName];
	        }
	      }
	    }
	  }

	  return filteredUserIdentities;
	}

	function filterUserAttributes(userAttributes, filterList) {
	  var filteredUserAttributes = {};

	  if (userAttributes && Object.keys(userAttributes).length) {
	    for (var userAttribute in userAttributes) {
	      if (userAttributes.hasOwnProperty(userAttribute)) {
	        var hashedUserAttribute = generateHash(userAttribute);

	        if (!inArray(filterList, hashedUserAttribute)) {
	          filteredUserAttributes[userAttribute] = userAttributes[userAttribute];
	        }
	      }
	    }
	  }

	  return filteredUserAttributes;
	}

	function findKeyInObject(obj, key) {
	  if (key && obj) {
	    for (var prop in obj) {
	      if (obj.hasOwnProperty(prop) && prop.toLowerCase() === key.toLowerCase()) {
	        return prop;
	      }
	    }
	  }

	  return null;
	}

	function decoded(s) {
	  return decodeURIComponent(s.replace(pluses, ' '));
	}

	function converted(s) {
	  if (s.indexOf('"') === 0) {
	    s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
	  }

	  return s;
	}

	function isEventType(type) {
	  for (var prop in Types.EventType) {
	    if (Types.EventType.hasOwnProperty(prop)) {
	      if (Types.EventType[prop] === type) {
	        return true;
	      }
	    }
	  }

	  return false;
	}

	function parseNumber(value) {
	  if (isNaN(value) || !isFinite(value)) {
	    return 0;
	  }

	  var floatValue = parseFloat(value);
	  return isNaN(floatValue) ? 0 : floatValue;
	}

	function parseStringOrNumber(value) {
	  if (Validators.isStringOrNumber(value)) {
	    return value;
	  } else {
	    return null;
	  }
	}

	function generateHash(name) {
	  var hash = 0,
	      i = 0,
	      character;

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

	  for (i = 0; i < name.length; i++) {
	    character = name.charCodeAt(i);
	    hash = (hash << 5) - hash + character;
	    hash = hash & hash;
	  }

	  return hash;
	}

	function sanitizeAttributes(attrs) {
	  if (!attrs || !isObject(attrs)) {
	    return null;
	  }

	  var sanitizedAttrs = {};

	  for (var prop in attrs) {
	    // Make sure that attribute values are not objects or arrays, which are not valid
	    if (attrs.hasOwnProperty(prop) && Validators.isValidAttributeValue(attrs[prop])) {
	      sanitizedAttrs[prop] = attrs[prop];
	    } else {
	      mParticle.Logger.warning('The corresponding attribute value of ' + prop + ' must be a string, number, boolean, or null.');
	    }
	  }

	  return sanitizedAttrs;
	}

	var Validators = {
	  isValidAttributeValue: function isValidAttributeValue(value) {
	    return value !== undefined && !isObject(value) && !Array.isArray(value);
	  },
	  // Neither null nor undefined can be a valid Key
	  isValidKeyValue: function isValidKeyValue(key) {
	    return Boolean(key && !isObject(key) && !Array.isArray(key));
	  },
	  isStringOrNumber: function isStringOrNumber(value) {
	    return typeof value === 'string' || typeof value === 'number';
	  },
	  isNumber: function isNumber(value) {
	    return typeof value === 'number';
	  },
	  isFunction: function isFunction(fn) {
	    return typeof fn === 'function';
	  },
	  validateIdentities: function validateIdentities(identityApiData, method) {
	    var validIdentityRequestKeys = {
	      userIdentities: 1,
	      onUserAlias: 1,
	      copyUserAttributes: 1
	    };

	    if (identityApiData) {
	      if (method === 'modify') {
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
	              error: Constants.Messages.ValidationMessages.OnUserAliasType + _typeof_1(identityApiData[key])
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
	          }; // identityApiData.userIdentities can be null, but if it isn't null or undefined (above conditional), it must be an object
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

	function isDelayedByIntegration(delayedIntegrations, timeoutStart, now) {
	  if (now - timeoutStart > mParticle.Store.SDKConfig.integrationDelayTimeout) {
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
	}

	function createMainStorageName(workspaceToken) {
	  if (workspaceToken) {
	    return StorageNames.currentStorageName + '_' + workspaceToken;
	  } else {
	    return StorageNames.currentStorageName;
	  }
	}

	function createProductStorageName(workspaceToken) {
	  if (workspaceToken) {
	    return StorageNames.currentStorageProductsName + '_' + workspaceToken;
	  } else {
	    return StorageNames.currentStorageProductsName;
	  }
	}

	var Helpers = {
	  canLog: canLog,
	  extend: extend,
	  isObject: isObject,
	  inArray: inArray,
	  createServiceUrl: createServiceUrl,
	  createXHR: createXHR,
	  generateUniqueId: generateUniqueId,
	  filterUserIdentities: filterUserIdentities,
	  filterUserIdentitiesForForwarders: filterUserIdentitiesForForwarders,
	  filterUserAttributes: filterUserAttributes,
	  findKeyInObject: findKeyInObject,
	  decoded: decoded,
	  converted: converted,
	  isEventType: isEventType,
	  parseNumber: parseNumber,
	  parseStringOrNumber: parseStringOrNumber,
	  generateHash: generateHash,
	  sanitizeAttributes: sanitizeAttributes,
	  returnConvertedBoolean: returnConvertedBoolean,
	  invokeCallback: invokeCallback,
	  invokeAliasCallback: invokeAliasCallback,
	  getFeatureFlag: getFeatureFlag,
	  isDelayedByIntegration: isDelayedByIntegration,
	  createMainStorageName: createMainStorageName,
	  createProductStorageName: createProductStorageName,
	  Validators: Validators,
	  getRampNumber: getRampNumber
	};

	var Messages = Constants.Messages;
	var androidBridgeNameBase = 'mParticleAndroid';
	var iosBridgeNameBase = 'mParticle';

	function isBridgeV2Available(bridgeName) {
	  if (!bridgeName) {
	    return false;
	  }

	  var androidBridgeName = androidBridgeNameBase + '_' + bridgeName + '_v2';
	  var iosBridgeName = iosBridgeNameBase + '_' + bridgeName + '_v2'; // iOS v2 bridge

	  if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.hasOwnProperty(iosBridgeName)) {
	    return true;
	  } // other iOS v2 bridge


	  if (window.mParticle.uiwebviewBridgeName === iosBridgeName) {
	    return true;
	  } // android


	  if (window.hasOwnProperty(androidBridgeName)) {
	    return true;
	  }

	  return false;
	}

	function isWebviewEnabled(requiredWebviewBridgeName, minWebviewBridgeVersion) {
	  mParticle.Store.bridgeV2Available = isBridgeV2Available(requiredWebviewBridgeName);
	  mParticle.Store.bridgeV1Available = isBridgeV1Available();

	  if (minWebviewBridgeVersion === 2) {
	    return mParticle.Store.bridgeV2Available;
	  } // iOS BridgeV1 can be available via mParticle.isIOS, but return false if uiwebviewBridgeName doesn't match requiredWebviewBridgeName


	  if (window.mParticle.uiwebviewBridgeName && window.mParticle.uiwebviewBridgeName !== iosBridgeNameBase + '_' + requiredWebviewBridgeName + '_v2') {
	    return false;
	  }

	  if (minWebviewBridgeVersion < 2) {
	    // ios
	    return mParticle.Store.bridgeV2Available || mParticle.Store.bridgeV1Available;
	  }

	  return false;
	}

	function isBridgeV1Available() {
	  if (mParticle.Store.SDKConfig.useNativeSdk || window.mParticleAndroid || mParticle.Store.SDKConfig.isIOS) {
	    return true;
	  }

	  return false;
	}

	function sendToNative(path, value) {
	  if (mParticle.Store.bridgeV2Available && mParticle.Store.SDKConfig.minWebviewBridgeVersion === 2) {
	    sendViaBridgeV2(path, value, mParticle.Store.SDKConfig.requiredWebviewBridgeName);
	    return;
	  }

	  if (mParticle.Store.bridgeV2Available && mParticle.Store.SDKConfig.minWebviewBridgeVersion < 2) {
	    sendViaBridgeV2(path, value, mParticle.Store.SDKConfig.requiredWebviewBridgeName);
	    return;
	  }

	  if (mParticle.Store.bridgeV1Available && mParticle.Store.SDKConfig.minWebviewBridgeVersion < 2) {
	    sendViaBridgeV1(path, value);
	    return;
	  }
	}

	function sendViaBridgeV1(path, value) {
	  if (window.mParticleAndroid && window.mParticleAndroid.hasOwnProperty(path)) {
	    mParticle.Logger.verbose(Messages.InformationMessages.SendAndroid + path);
	    window.mParticleAndroid[path](value);
	  } else if (mParticle.Store.SDKConfig.isIOS) {
	    mParticle.Logger.verbose(Messages.InformationMessages.SendIOS + path);
	    sendViaIframeToIOS(path, value);
	  }
	}

	function sendViaIframeToIOS(path, value) {
	  var iframe = document.createElement('IFRAME');
	  iframe.setAttribute('src', 'mp-sdk://' + path + '/' + encodeURIComponent(value));
	  document.documentElement.appendChild(iframe);
	  iframe.parentNode.removeChild(iframe);
	}

	function sendViaBridgeV2(path, value, requiredWebviewBridgeName) {
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

	  if (window.mParticle.uiwebviewBridgeName === iosBridgeName) {
	    iOSBridgeNonMessageHandler = window.mParticle[iosBridgeName];
	  }

	  if (androidBridge && androidBridge.hasOwnProperty(path)) {
	    mParticle.Logger.verbose(Messages.InformationMessages.SendAndroid + path);
	    androidBridge[path](value);
	    return;
	  } else if (iOSBridgeMessageHandler) {
	    mParticle.Logger.verbose(Messages.InformationMessages.SendIOS + path);
	    iOSBridgeMessageHandler.postMessage(JSON.stringify({
	      path: path,
	      value: value ? JSON.parse(value) : null
	    }));
	  } else if (iOSBridgeNonMessageHandler) {
	    mParticle.Logger.verbose(Messages.InformationMessages.SendIOS + path);
	    sendViaIframeToIOS(path, value);
	  }
	}

	var NativeSdkHelpers = {
	  isWebviewEnabled: isWebviewEnabled,
	  isBridgeV2Available: isBridgeV2Available,
	  sendToNative: sendToNative
	};

	function createGDPRConsent(consented, timestamp, consentDocument, location, hardwareId) {
	  if (typeof consented !== 'boolean') {
	    mParticle.Logger.error('Consented boolean is required when constructing a GDPR Consent object.');
	    return null;
	  }

	  if (timestamp && isNaN(timestamp)) {
	    mParticle.Logger.error('Timestamp must be a valid number when constructing a GDPR Consent object.');
	    return null;
	  }

	  if (consentDocument && typeof consentDocument !== 'string') {
	    mParticle.Logger.error('Document must be a valid string when constructing a GDPR Consent object.');
	    return null;
	  }

	  if (location && typeof location !== 'string') {
	    mParticle.Logger.error('Location must be a valid string when constructing a GDPR Consent object.');
	    return null;
	  }

	  if (hardwareId && typeof hardwareId !== 'string') {
	    mParticle.Logger.error('Hardware ID must be a valid string when constructing a GDPR Consent object.');
	    return null;
	  }

	  return {
	    Consented: consented,
	    Timestamp: timestamp || Date.now(),
	    ConsentDocument: consentDocument,
	    Location: location,
	    HardwareId: hardwareId
	  };
	}

	var ConsentSerialization = {
	  toMinifiedJsonObject: function toMinifiedJsonObject(state) {
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
	    }

	    return jsonObject;
	  },
	  fromMinifiedJsonObject: function fromMinifiedJsonObject(json) {
	    var state = createConsentState();

	    if (json.gdpr) {
	      for (var purpose in json.gdpr) {
	        if (json.gdpr.hasOwnProperty(purpose)) {
	          var gdprConsent = createGDPRConsent(json.gdpr[purpose].c, json.gdpr[purpose].ts, json.gdpr[purpose].d, json.gdpr[purpose].l, json.gdpr[purpose].h);
	          state.addGDPRConsentState(purpose, gdprConsent);
	        }
	      }
	    }

	    return state;
	  }
	};

	function createConsentState(consentState) {
	  var gdpr = {};

	  if (consentState) {
	    setGDPRConsentState(consentState.getGDPRConsentState());
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

	  function setGDPRConsentState(gdprConsentState) {
	    if (!gdprConsentState) {
	      gdpr = {};
	    } else if (Helpers.isObject(gdprConsentState)) {
	      gdpr = {};

	      for (var purpose in gdprConsentState) {
	        if (gdprConsentState.hasOwnProperty(purpose)) {
	          addGDPRConsentState(purpose, gdprConsentState[purpose]);
	        }
	      }
	    }

	    return this;
	  }

	  function addGDPRConsentState(purpose, gdprConsent) {
	    var normalizedPurpose = canonicalizeForDeduplication(purpose);

	    if (!normalizedPurpose) {
	      mParticle.Logger.error('addGDPRConsentState() invoked with bad purpose. Purpose must be a string.');
	      return this;
	    }

	    if (!Helpers.isObject(gdprConsent)) {
	      mParticle.Logger.error('addGDPRConsentState() invoked with bad or empty GDPR consent object.');
	      return this;
	    }

	    var gdprConsentCopy = createGDPRConsent(gdprConsent.Consented, gdprConsent.Timestamp, gdprConsent.ConsentDocument, gdprConsent.Location, gdprConsent.HardwareId);

	    if (gdprConsentCopy) {
	      gdpr[normalizedPurpose] = gdprConsentCopy;
	    }

	    return this;
	  }

	  function removeGDPRConsentState(purpose) {
	    var normalizedPurpose = canonicalizeForDeduplication(purpose);

	    if (!normalizedPurpose) {
	      return this;
	    }

	    delete gdpr[normalizedPurpose];
	    return this;
	  }

	  function getGDPRConsentState() {
	    return Helpers.extend({}, gdpr);
	  }

	  return {
	    setGDPRConsentState: setGDPRConsentState,
	    addGDPRConsentState: addGDPRConsentState,
	    getGDPRConsentState: getGDPRConsentState,
	    removeGDPRConsentState: removeGDPRConsentState
	  };
	}

	var Consent = {
	  createGDPRConsent: createGDPRConsent,
	  Serialization: ConsentSerialization,
	  createConsentState: createConsentState
	};

	var Base64$1 = Polyfill.Base64,
	    Messages$1 = Constants.Messages,
	    Base64CookieKeys = Constants.Base64CookieKeys,
	    SDKv2NonMPIDCookieKeys = Constants.SDKv2NonMPIDCookieKeys,
	    StorageNames$1 = Constants.StorageNames;

	function useLocalStorage() {
	  return !mParticle.Store.SDKConfig.useCookieStorage && mParticle.Store.isLocalStorageAvailable;
	}

	function initializeStorage() {
	  try {
	    var storage,
	        localStorageData = getLocalStorage(),
	        cookies = getCookie(),
	        allData; // Determine if there is any data in cookies or localStorage to figure out if it is the first time the browser is loading mParticle

	    if (!localStorageData && !cookies) {
	      mParticle.Store.isFirstRun = true;
	      mParticle.Store.mpid = 0;
	    } else {
	      mParticle.Store.isFirstRun = false;
	    }

	    if (!mParticle.Store.isLocalStorageAvailable) {
	      mParticle.Store.SDKConfig.useCookieStorage = true;
	    }

	    if (mParticle.Store.isLocalStorageAvailable) {
	      storage = window.localStorage;

	      if (mParticle.Store.SDKConfig.useCookieStorage) {
	        // For migrating from localStorage to cookies -- If an instance switches from localStorage to cookies, then
	        // no mParticle cookie exists yet and there is localStorage. Get the localStorage, set them to cookies, then delete the localStorage item.
	        if (localStorageData) {
	          if (cookies) {
	            allData = Helpers.extend(false, localStorageData, cookies);
	          } else {
	            allData = localStorageData;
	          }

	          storage.removeItem(mParticle.Store.storageName);
	        } else if (cookies) {
	          allData = cookies;
	        }

	        storeDataInMemory(allData);
	      } else {
	        // For migrating from cookie to localStorage -- If an instance is newly switching from cookies to localStorage, then
	        // no mParticle localStorage exists yet and there are cookies. Get the cookies, set them to localStorage, then delete the cookies.
	        if (cookies) {
	          if (localStorageData) {
	            allData = Helpers.extend(false, localStorageData, cookies);
	          } else {
	            allData = cookies;
	          }

	          storeDataInMemory(allData);
	          expireCookies(mParticle.Store.storageName);
	        } else {
	          storeDataInMemory(localStorageData);
	        }
	      }
	    } else {
	      storeDataInMemory(cookies);
	    }

	    try {
	      if (mParticle.Store.isLocalStorageAvailable) {
	        var encodedProducts = localStorage.getItem(mParticle.Store.prodStorageName);

	        if (encodedProducts) {
	          var decodedProducts = JSON.parse(Base64$1.decode(encodedProducts));
	        }

	        if (mParticle.Store.mpid) {
	          storeProductsInMemory(decodedProducts, mParticle.Store.mpid);
	        }
	      }
	    } catch (e) {
	      if (mParticle.Store.isLocalStorageAvailable) {
	        localStorage.removeItem(mParticle.Store.prodStorageName);
	      }

	      mParticle.Store.cartProducts = [];
	      mParticle.Logger.error('Error loading products in initialization: ' + e);
	    }

	    for (var key in allData) {
	      if (allData.hasOwnProperty(key)) {
	        if (!SDKv2NonMPIDCookieKeys[key]) {
	          mParticle.Store.nonCurrentUserMPIDs[key] = allData[key];
	        }
	      }
	    }

	    update();
	  } catch (e) {
	    if (useLocalStorage() && mParticle.Store.isLocalStorageAvailable) {
	      localStorage.removeItem(mParticle.Store.storageName);
	    } else {
	      expireCookies(mParticle.Store.storageName);
	    }

	    mParticle.Logger.error('Error initializing storage: ' + e);
	  }
	}

	function update() {
	  if (!mParticle.Store.webviewBridgeEnabled) {
	    if (mParticle.Store.SDKConfig.useCookieStorage) {
	      setCookie();
	    }

	    setLocalStorage();
	  }
	}

	function storeProductsInMemory(products, mpid) {
	  if (products) {
	    try {
	      mParticle.Store.cartProducts = products[mpid] && products[mpid].cp ? products[mpid].cp : [];
	    } catch (e) {
	      mParticle.Logger.error(Messages$1.ErrorMessages.CookieParseError);
	    }
	  }
	}

	function storeDataInMemory(obj, currentMPID) {
	  try {
	    if (!obj) {
	      mParticle.Logger.verbose(Messages$1.InformationMessages.CookieNotFound);
	      mParticle.Store.clientId = mParticle.Store.clientId || Helpers.generateUniqueId();
	      mParticle.Store.deviceId = mParticle.Store.deviceId || Helpers.generateUniqueId();
	    } else {
	      // Set MPID first, then change object to match MPID data
	      if (currentMPID) {
	        mParticle.Store.mpid = currentMPID;
	      } else {
	        mParticle.Store.mpid = obj.cu || 0;
	      }

	      obj.gs = obj.gs || {};
	      mParticle.Store.sessionId = obj.gs.sid || mParticle.Store.sessionId;
	      mParticle.Store.isEnabled = typeof obj.gs.ie !== 'undefined' ? obj.gs.ie : mParticle.Store.isEnabled;
	      mParticle.Store.sessionAttributes = obj.gs.sa || mParticle.Store.sessionAttributes;
	      mParticle.Store.serverSettings = obj.gs.ss || mParticle.Store.serverSettings;
	      mParticle.Store.devToken = mParticle.Store.devToken || obj.gs.dt;
	      mParticle.Store.SDKConfig.appVersion = mParticle.Store.SDKConfig.appVersion || obj.gs.av;
	      mParticle.Store.clientId = obj.gs.cgid || mParticle.Store.clientId || Helpers.generateUniqueId();
	      mParticle.Store.deviceId = obj.gs.das || mParticle.Store.deviceId || Helpers.generateUniqueId();
	      mParticle.Store.integrationAttributes = obj.gs.ia || {};
	      mParticle.Store.context = obj.gs.c || mParticle.Store.context;
	      mParticle.Store.currentSessionMPIDs = obj.gs.csm || mParticle.Store.currentSessionMPIDs;
	      mParticle.Store.isLoggedIn = obj.l === true;

	      if (obj.gs.les) {
	        mParticle.Store.dateLastEventSent = new Date(obj.gs.les);
	      }

	      if (obj.gs.ssd) {
	        mParticle.Store.sessionStartDate = new Date(obj.gs.ssd);
	      } else {
	        mParticle.Store.sessionStartDate = new Date();
	      }

	      if (currentMPID) {
	        obj = obj[currentMPID];
	      } else {
	        obj = obj[obj.cu];
	      }
	    }
	  } catch (e) {
	    mParticle.Logger.error(Messages$1.ErrorMessages.CookieParseError);
	  }
	}

	function determineLocalStorageAvailability(storage) {
	  var result;

	  if (mParticle._forceNoLocalStorage) {
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
	}

	function getUserProductsFromLS(mpid) {
	  if (!mParticle.Store.isLocalStorageAvailable) {
	    return [];
	  }

	  var decodedProducts,
	      userProducts,
	      parsedProducts,
	      encodedProducts = localStorage.getItem(mParticle.Store.prodStorageName);

	  if (encodedProducts) {
	    decodedProducts = Base64$1.decode(encodedProducts);
	  } // if there is an MPID, we are retrieving the user's products, which is an array


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
	}

	function getAllUserProductsFromLS() {
	  var decodedProducts,
	      encodedProducts = localStorage.getItem(mParticle.Store.prodStorageName),
	      parsedDecodedProducts;

	  if (encodedProducts) {
	    decodedProducts = Base64$1.decode(encodedProducts);
	  } // returns an object with keys of MPID and values of array of products


	  try {
	    parsedDecodedProducts = JSON.parse(decodedProducts);
	  } catch (e) {
	    parsedDecodedProducts = {};
	  }

	  return parsedDecodedProducts;
	}

	function setLocalStorage() {
	  if (!mParticle.Store.isLocalStorageAvailable) {
	    return;
	  }

	  var key = mParticle.Store.storageName,
	      allLocalStorageProducts = getAllUserProductsFromLS(),
	      localStorageData = getLocalStorage() || {},
	      currentUser = mParticle.Identity.getCurrentUser(),
	      mpid = currentUser ? currentUser.getMPID() : null,
	      currentUserProducts = {
	    cp: allLocalStorageProducts[mpid] ? allLocalStorageProducts[mpid].cp : []
	  };

	  if (mpid) {
	    allLocalStorageProducts = allLocalStorageProducts || {};
	    allLocalStorageProducts[mpid] = currentUserProducts;

	    try {
	      window.localStorage.setItem(encodeURIComponent(mParticle.Store.prodStorageName), Base64$1.encode(JSON.stringify(allLocalStorageProducts)));
	    } catch (e) {
	      mParticle.Logger.error('Error with setting products on localStorage.');
	    }
	  }

	  if (!mParticle.Store.SDKConfig.useCookieStorage) {
	    localStorageData.gs = localStorageData.gs || {};
	    localStorageData.l = mParticle.Store.isLoggedIn ? 1 : 0;

	    if (mParticle.Store.sessionId) {
	      localStorageData.gs.csm = mParticle.Store.currentSessionMPIDs;
	    }

	    localStorageData.gs.ie = mParticle.Store.isEnabled;

	    if (mpid) {
	      localStorageData.cu = mpid;
	    }

	    if (Object.keys(mParticle.Store.nonCurrentUserMPIDs).length) {
	      localStorageData = Helpers.extend({}, localStorageData, mParticle.Store.nonCurrentUserMPIDs);
	      mParticle.Store.nonCurrentUserMPIDs = {};
	    }

	    localStorageData = setGlobalStorageAttributes(localStorageData);

	    try {
	      window.localStorage.setItem(encodeURIComponent(key), encodeCookies(JSON.stringify(localStorageData)));
	    } catch (e) {
	      mParticle.Logger.error('Error with setting localStorage item.');
	    }
	  }
	}

	function setGlobalStorageAttributes(data) {
	  var store = mParticle.Store;
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
	  data.gs.ssd = store.sessionStartDate ? store.sessionStartDate.getTime() : null;
	  data.gs.ia = store.integrationAttributes;
	  return data;
	}

	function getLocalStorage() {
	  if (!mParticle.Store.isLocalStorageAvailable) {
	    return null;
	  }

	  var key = mParticle.Store.storageName,
	      localStorageData = decodeCookies(window.localStorage.getItem(key)),
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
	}

	function removeLocalStorage(localStorageName) {
	  localStorage.removeItem(localStorageName);
	}

	function retrieveDeviceId() {
	  if (mParticle.Store.deviceId) {
	    return mParticle.Store.deviceId;
	  } else {
	    return parseDeviceId(mParticle.Store.serverSettings);
	  }
	}

	function parseDeviceId(serverSettings) {
	  try {
	    var paramsObj = {},
	        parts;

	    if (serverSettings && serverSettings.uid && serverSettings.uid.Value) {
	      serverSettings.uid.Value.split('&').forEach(function (param) {
	        parts = param.split('=');
	        paramsObj[parts[0]] = parts[1];
	      });

	      if (paramsObj['g']) {
	        return paramsObj['g'];
	      }
	    }

	    return Helpers.generateUniqueId();
	  } catch (e) {
	    return Helpers.generateUniqueId();
	  }
	}

	function expireCookies(cookieName) {
	  var date = new Date(),
	      expires,
	      domain,
	      cookieDomain;
	  cookieDomain = getCookieDomain();

	  if (cookieDomain === '') {
	    domain = '';
	  } else {
	    domain = ';domain=' + cookieDomain;
	  }

	  date.setTime(date.getTime() - 24 * 60 * 60 * 1000);
	  expires = '; expires=' + date.toUTCString();
	  document.cookie = cookieName + '=' + '' + expires + '; path=/' + domain;
	}

	function getCookie() {
	  var cookies = window.document.cookie.split('; '),
	      key = mParticle.Store.storageName,
	      i,
	      l,
	      parts,
	      name,
	      cookie,
	      result = key ? undefined : {};
	  mParticle.Logger.verbose(Messages$1.InformationMessages.CookieSearch);

	  for (i = 0, l = cookies.length; i < l; i++) {
	    parts = cookies[i].split('=');
	    name = Helpers.decoded(parts.shift());
	    cookie = Helpers.decoded(parts.join('='));

	    if (key && key === name) {
	      result = Helpers.converted(cookie);
	      break;
	    }

	    if (!key) {
	      result[name] = Helpers.converted(cookie);
	    }
	  }

	  if (result) {
	    mParticle.Logger.verbose(Messages$1.InformationMessages.CookieFound);
	    return JSON.parse(decodeCookies(result));
	  } else {
	    return null;
	  }
	}

	function setCookie() {
	  var mpid,
	      currentUser = mParticle.Identity.getCurrentUser();

	  if (currentUser) {
	    mpid = currentUser.getMPID();
	  }

	  var date = new Date(),
	      key = mParticle.Store.storageName,
	      cookies = getCookie() || {},
	      expires = new Date(date.getTime() + mParticle.Store.SDKConfig.cookieExpiration * 24 * 60 * 60 * 1000).toGMTString(),
	      cookieDomain,
	      domain,
	      encodedCookiesWithExpirationAndPath;
	  cookieDomain = getCookieDomain();

	  if (cookieDomain === '') {
	    domain = '';
	  } else {
	    domain = ';domain=' + cookieDomain;
	  }

	  cookies.gs = cookies.gs || {};

	  if (mParticle.Store.sessionId) {
	    cookies.gs.csm = mParticle.Store.currentSessionMPIDs;
	  }

	  if (mpid) {
	    cookies.cu = mpid;
	  }

	  cookies.l = mParticle.Store.isLoggedIn ? 1 : 0;
	  cookies = setGlobalStorageAttributes(cookies);

	  if (Object.keys(mParticle.Store.nonCurrentUserMPIDs).length) {
	    cookies = Helpers.extend({}, cookies, mParticle.Store.nonCurrentUserMPIDs);
	    mParticle.Store.nonCurrentUserMPIDs = {};
	  }

	  encodedCookiesWithExpirationAndPath = reduceAndEncodeCookies(cookies, expires, domain, mParticle.Store.SDKConfig.maxCookieSize);
	  mParticle.Logger.verbose(Messages$1.InformationMessages.CookieSet);
	  window.document.cookie = encodeURIComponent(key) + '=' + encodedCookiesWithExpirationAndPath;
	}
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


	function reduceAndEncodeCookies(cookies, expires, domain, maxCookieSize) {
	  var encodedCookiesWithExpirationAndPath,
	      currentSessionMPIDs = cookies.gs.csm ? cookies.gs.csm : []; // Comment 1 above

	  if (!currentSessionMPIDs.length) {
	    for (var key in cookies) {
	      if (cookies.hasOwnProperty(key)) {
	        encodedCookiesWithExpirationAndPath = createFullEncodedCookie(cookies, expires, domain);

	        if (encodedCookiesWithExpirationAndPath.length > maxCookieSize) {
	          if (!SDKv2NonMPIDCookieKeys[key] && key !== cookies.cu) {
	            delete cookies[key];
	          }
	        }
	      }
	    }
	  } else {
	    // Comment 2 above - First create an object of all MPIDs on the cookie
	    var MPIDsOnCookie = {};

	    for (var potentialMPID in cookies) {
	      if (cookies.hasOwnProperty(potentialMPID)) {
	        if (!SDKv2NonMPIDCookieKeys[potentialMPID] && potentialMPID !== cookies.cu) {
	          MPIDsOnCookie[potentialMPID] = 1;
	        }
	      }
	    } // Comment 2a above


	    if (Object.keys(MPIDsOnCookie).length) {
	      for (var mpid in MPIDsOnCookie) {
	        encodedCookiesWithExpirationAndPath = createFullEncodedCookie(cookies, expires, domain);

	        if (encodedCookiesWithExpirationAndPath.length > maxCookieSize) {
	          if (MPIDsOnCookie.hasOwnProperty(mpid)) {
	            if (currentSessionMPIDs.indexOf(mpid) === -1) {
	              delete cookies[mpid];
	            }
	          }
	        }
	      }
	    } // Comment 2b above


	    for (var i = 0; i < currentSessionMPIDs.length; i++) {
	      encodedCookiesWithExpirationAndPath = createFullEncodedCookie(cookies, expires, domain);

	      if (encodedCookiesWithExpirationAndPath.length > maxCookieSize) {
	        var MPIDtoRemove = currentSessionMPIDs[i];

	        if (cookies[MPIDtoRemove]) {
	          mParticle.Logger.verbose('Size of new encoded cookie is larger than maxCookieSize setting of ' + maxCookieSize + '. Removing from cookie the earliest logged in MPID containing: ' + JSON.stringify(cookies[MPIDtoRemove], 0, 2));
	          delete cookies[MPIDtoRemove];
	        } else {
	          mParticle.Logger.error('Unable to save MPID data to cookies because the resulting encoded cookie is larger than the maxCookieSize setting of ' + maxCookieSize + '. We recommend using a maxCookieSize of 1500.');
	        }
	      } else {
	        break;
	      }
	    }
	  }

	  return encodedCookiesWithExpirationAndPath;
	}

	function createFullEncodedCookie(cookies, expires, domain) {
	  return encodeCookies(JSON.stringify(cookies)) + ';expires=' + expires + ';path=/' + domain;
	}

	function findPrevCookiesBasedOnUI(identityApiData) {
	  var cookies = getCookie() || getLocalStorage();
	  var matchedUser;

	  if (identityApiData) {
	    for (var requestedIdentityType in identityApiData.userIdentities) {
	      if (cookies && Object.keys(cookies).length) {
	        for (var key in cookies) {
	          // any value in cookies that has an MPID key will be an MPID to search through
	          // other keys on the cookie are currentSessionMPIDs and currentMPID which should not be searched
	          if (cookies[key].mpid) {
	            var cookieUIs = cookies[key].ui;

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
	    storeDataInMemory(cookies, matchedUser);
	  }
	}

	function encodeCookies(cookie) {
	  cookie = JSON.parse(cookie);

	  for (var key in cookie.gs) {
	    if (cookie.gs.hasOwnProperty(key)) {
	      if (Base64CookieKeys[key]) {
	        if (cookie.gs[key]) {
	          // base64 encode any value that is an object or Array in globalSettings
	          if (Array.isArray(cookie.gs[key]) && cookie.gs[key].length || Helpers.isObject(cookie.gs[key]) && Object.keys(cookie.gs[key]).length) {
	            cookie.gs[key] = Base64$1.encode(JSON.stringify(cookie.gs[key]));
	          } else {
	            delete cookie.gs[key];
	          }
	        } else {
	          delete cookie.gs[key];
	        }
	      } else if (key === 'ie') {
	        cookie.gs[key] = cookie.gs[key] ? 1 : 0;
	      } else if (!cookie.gs[key]) {
	        delete cookie.gs[key];
	      }
	    }
	  }

	  for (var mpid in cookie) {
	    if (cookie.hasOwnProperty(mpid)) {
	      if (!SDKv2NonMPIDCookieKeys[mpid]) {
	        for (key in cookie[mpid]) {
	          if (cookie[mpid].hasOwnProperty(key)) {
	            if (Base64CookieKeys[key]) {
	              if (Helpers.isObject(cookie[mpid][key]) && Object.keys(cookie[mpid][key]).length) {
	                cookie[mpid][key] = Base64$1.encode(JSON.stringify(cookie[mpid][key]));
	              } else {
	                delete cookie[mpid][key];
	              }
	            }
	          }
	        }
	      }
	    }
	  }

	  return createCookieString(JSON.stringify(cookie));
	}

	function decodeCookies(cookie) {
	  try {
	    if (cookie) {
	      cookie = JSON.parse(revertCookieString(cookie));

	      if (Helpers.isObject(cookie) && Object.keys(cookie).length) {
	        for (var key in cookie.gs) {
	          if (cookie.gs.hasOwnProperty(key)) {
	            if (Base64CookieKeys[key]) {
	              cookie.gs[key] = JSON.parse(Base64$1.decode(cookie.gs[key]));
	            } else if (key === 'ie') {
	              cookie.gs[key] = Boolean(cookie.gs[key]);
	            }
	          }
	        }

	        for (var mpid in cookie) {
	          if (cookie.hasOwnProperty(mpid)) {
	            if (!SDKv2NonMPIDCookieKeys[mpid]) {
	              for (key in cookie[mpid]) {
	                if (cookie[mpid].hasOwnProperty(key)) {
	                  if (Base64CookieKeys[key]) {
	                    if (cookie[mpid][key].length) {
	                      cookie[mpid][key] = JSON.parse(Base64$1.decode(cookie[mpid][key]));
	                    }
	                  }
	                }
	              }
	            } else if (mpid === 'l') {
	              cookie[mpid] = Boolean(cookie[mpid]);
	            }
	          }
	        }
	      }

	      return JSON.stringify(cookie);
	    }
	  } catch (e) {
	    mParticle.Logger.error('Problem with decoding cookie', e);
	  }
	}

	function replaceCommasWithPipes(string) {
	  return string.replace(/,/g, '|');
	}

	function replacePipesWithCommas(string) {
	  return string.replace(/\|/g, ',');
	}

	function replaceApostrophesWithQuotes(string) {
	  return string.replace(/\'/g, '"');
	}

	function replaceQuotesWithApostrophes(string) {
	  return string.replace(/\"/g, "'");
	}

	function createCookieString(string) {
	  return replaceCommasWithPipes(replaceQuotesWithApostrophes(string));
	}

	function revertCookieString(string) {
	  return replacePipesWithCommas(replaceApostrophesWithQuotes(string));
	}

	function getCookieDomain() {
	  if (mParticle.Store.SDKConfig.cookieDomain) {
	    return mParticle.Store.SDKConfig.cookieDomain;
	  } else {
	    var rootDomain = getDomain(document, location.hostname);

	    if (rootDomain === '') {
	      return '';
	    } else {
	      return '.' + rootDomain;
	    }
	  }
	} // This function loops through the parts of a full hostname, attempting to set a cookie on that domain. It will set a cookie at the highest level possible.
	// For example subdomain.domain.co.uk would try the following combinations:
	// "co.uk" -> fail
	// "domain.co.uk" -> success, return
	// "subdomain.domain.co.uk" -> skipped, because already found


	function getDomain(doc, locationHostname) {
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
	}

	function getUserIdentities(mpid) {
	  var cookies = getPersistence();

	  if (cookies && cookies[mpid] && cookies[mpid].ui) {
	    return cookies[mpid].ui;
	  } else {
	    return {};
	  }
	}

	function getAllUserAttributes(mpid) {
	  var cookies = getPersistence();

	  if (cookies && cookies[mpid] && cookies[mpid].ua) {
	    return cookies[mpid].ua;
	  } else {
	    return {};
	  }
	}

	function getCartProducts(mpid) {
	  var allCartProducts,
	      cartProductsString = localStorage.getItem(mParticle.Store.prodStorageName);

	  if (cartProductsString) {
	    allCartProducts = JSON.parse(Base64$1.decode(cartProductsString));

	    if (allCartProducts && allCartProducts[mpid] && allCartProducts[mpid].cp) {
	      return allCartProducts[mpid].cp;
	    }
	  }

	  return [];
	}

	function setCartProducts(allProducts) {
	  if (!mParticle.Store.isLocalStorageAvailable) {
	    return;
	  }

	  try {
	    window.localStorage.setItem(encodeURIComponent(mParticle.Store.prodStorageName), Base64$1.encode(JSON.stringify(allProducts)));
	  } catch (e) {
	    mParticle.Logger.error('Error with setting products on localStorage.');
	  }
	}

	function saveUserIdentitiesToCookies(mpid, userIdentities) {
	  if (userIdentities) {
	    var cookies = getPersistence();

	    if (cookies) {
	      if (cookies[mpid]) {
	        cookies[mpid].ui = userIdentities;
	      } else {
	        cookies[mpid] = {
	          ui: userIdentities
	        };
	      }

	      saveCookies(cookies);
	    }
	  }
	}

	function saveUserAttributesToCookies(mpid, userAttributes) {
	  var cookies = getPersistence();

	  if (userAttributes) {
	    if (cookies) {
	      if (cookies[mpid]) {
	        cookies[mpid].ui = userAttributes;
	      } else {
	        cookies[mpid] = {
	          ui: userAttributes
	        };
	      }
	    }

	    saveCookies(cookies);
	  }
	}

	function saveUserCookieSyncDatesToCookies(mpid, csd) {
	  if (csd) {
	    var cookies = getPersistence();

	    if (cookies) {
	      if (cookies[mpid]) {
	        cookies[mpid].csd = csd;
	      } else {
	        cookies[mpid] = {
	          csd: csd
	        };
	      }
	    }

	    saveCookies(cookies);
	  }
	}

	function saveUserConsentStateToCookies(mpid, consentState) {
	  //it's currently not supported to set persistence
	  //for any MPID that's not the current one.
	  if (consentState || consentState === null) {
	    var cookies = getPersistence();

	    if (cookies) {
	      if (cookies[mpid]) {
	        cookies[mpid].con = Consent.Serialization.toMinifiedJsonObject(consentState);
	      } else {
	        cookies[mpid] = {
	          con: Consent.Serialization.toMinifiedJsonObject(consentState)
	        };
	      }

	      saveCookies(cookies);
	    }
	  }
	}

	function saveCookies(cookies) {
	  var encodedCookies = encodeCookies(JSON.stringify(cookies)),
	      date = new Date(),
	      key = mParticle.Store.storageName,
	      expires = new Date(date.getTime() + mParticle.Store.SDKConfig.cookieExpiration * 24 * 60 * 60 * 1000).toGMTString(),
	      cookieDomain = getCookieDomain(),
	      domain;

	  if (cookieDomain === '') {
	    domain = '';
	  } else {
	    domain = ';domain=' + cookieDomain;
	  }

	  if (mParticle.Store.SDKConfig.useCookieStorage) {
	    var encodedCookiesWithExpirationAndPath = reduceAndEncodeCookies(cookies, expires, domain, mParticle.Store.SDKConfig.maxCookieSize);
	    window.document.cookie = encodeURIComponent(key) + '=' + encodedCookiesWithExpirationAndPath;
	  } else {
	    if (mParticle.Store.isLocalStorageAvailable) {
	      localStorage.setItem(mParticle.Store.storageName, encodedCookies);
	    }
	  }
	}

	function getPersistence() {
	  var cookies;

	  if (mParticle.Store.SDKConfig.useCookieStorage) {
	    cookies = getCookie();
	  } else {
	    cookies = getLocalStorage();
	  }

	  return cookies;
	}

	function getConsentState(mpid) {
	  var cookies = getPersistence();

	  if (cookies && cookies[mpid] && cookies[mpid].con) {
	    return Consent.Serialization.fromMinifiedJsonObject(cookies[mpid].con);
	  } else {
	    return null;
	  }
	}

	function getFirstSeenTime(mpid) {
	  if (!mpid) {
	    return null;
	  }

	  var cookies = getPersistence();

	  if (cookies && cookies[mpid] && cookies[mpid].fst) {
	    return cookies[mpid].fst;
	  } else {
	    return null;
	  }
	}
	/**
	 * set the "first seen" time for a user. the time will only be set once for a given
	 * mpid after which subsequent calls will be ignored
	 */


	function setFirstSeenTime(mpid, time) {
	  if (!mpid) {
	    return;
	  }

	  if (!time) {
	    time = new Date().getTime();
	  }

	  var cookies = getPersistence();

	  if (cookies) {
	    if (!cookies[mpid]) {
	      cookies[mpid] = {};
	    }

	    if (!cookies[mpid].fst) {
	      cookies[mpid].fst = time;
	      saveCookies(cookies);
	    }
	  }
	}
	/**
	 * returns the "last seen" time for a user. If the mpid represents the current user, the
	 * return value will always be the current time, otherwise it will be to stored "last seen"
	 * time
	 */


	function getLastSeenTime(mpid) {
	  if (!mpid) {
	    return null;
	  }

	  if (mpid === mParticle.Identity.getCurrentUser().getMPID()) {
	    //if the mpid is the current user, its last seen time is the current time
	    return new Date().getTime();
	  } else {
	    var cookies = getPersistence();

	    if (cookies && cookies[mpid] && cookies[mpid].lst) {
	      return cookies[mpid].lst;
	    }

	    return null;
	  }
	}

	function setLastSeenTime(mpid, time) {
	  if (!mpid) {
	    return;
	  }

	  if (!time) {
	    time = new Date().getTime();
	  }

	  var cookies = getPersistence();

	  if (cookies && cookies[mpid]) {
	    cookies[mpid].lst = time;
	    saveCookies(cookies);
	  }
	}

	function getDeviceId() {
	  return mParticle.Store.deviceId;
	}

	function resetPersistence() {
	  removeLocalStorage(StorageNames$1.localStorageName);
	  removeLocalStorage(StorageNames$1.localStorageNameV3);
	  removeLocalStorage(StorageNames$1.localStorageNameV4);
	  removeLocalStorage(mParticle.Store.prodStorageName);
	  removeLocalStorage(StorageNames$1.localStorageProductsV4);
	  expireCookies(StorageNames$1.cookieName);
	  expireCookies(StorageNames$1.cookieNameV2);
	  expireCookies(StorageNames$1.cookieNameV3);
	  expireCookies(StorageNames$1.cookieNameV4);

	  if (mParticle._isTestEnv) {
	    var testWorkspaceToken = 'abcdef';
	    removeLocalStorage(Helpers.createMainStorageName(testWorkspaceToken));
	    expireCookies(Helpers.createMainStorageName(testWorkspaceToken));
	    removeLocalStorage(Helpers.createProductStorageName(testWorkspaceToken));
	  }
	} // Forwarder Batching Code


	var forwardingStatsBatches = {
	  uploadsTable: {},
	  forwardingStatsEventQueue: []
	};
	var Persistence = {
	  useLocalStorage: useLocalStorage,
	  initializeStorage: initializeStorage,
	  update: update,
	  determineLocalStorageAvailability: determineLocalStorageAvailability,
	  getUserProductsFromLS: getUserProductsFromLS,
	  getAllUserProductsFromLS: getAllUserProductsFromLS,
	  setLocalStorage: setLocalStorage,
	  getLocalStorage: getLocalStorage,
	  storeDataInMemory: storeDataInMemory,
	  retrieveDeviceId: retrieveDeviceId,
	  parseDeviceId: parseDeviceId,
	  expireCookies: expireCookies,
	  getCookie: getCookie,
	  setCookie: setCookie,
	  reduceAndEncodeCookies: reduceAndEncodeCookies,
	  findPrevCookiesBasedOnUI: findPrevCookiesBasedOnUI,
	  replaceCommasWithPipes: replaceCommasWithPipes,
	  replacePipesWithCommas: replacePipesWithCommas,
	  replaceApostrophesWithQuotes: replaceApostrophesWithQuotes,
	  replaceQuotesWithApostrophes: replaceQuotesWithApostrophes,
	  createCookieString: createCookieString,
	  revertCookieString: revertCookieString,
	  decodeCookies: decodeCookies,
	  getCookieDomain: getCookieDomain,
	  getUserIdentities: getUserIdentities,
	  getAllUserAttributes: getAllUserAttributes,
	  getCartProducts: getCartProducts,
	  setCartProducts: setCartProducts,
	  saveCookies: saveCookies,
	  saveUserIdentitiesToCookies: saveUserIdentitiesToCookies,
	  saveUserAttributesToCookies: saveUserAttributesToCookies,
	  saveUserCookieSyncDatesToCookies: saveUserCookieSyncDatesToCookies,
	  saveUserConsentStateToCookies: saveUserConsentStateToCookies,
	  getPersistence: getPersistence,
	  getDeviceId: getDeviceId,
	  resetPersistence: resetPersistence,
	  getConsentState: getConsentState,
	  forwardingStatsBatches: forwardingStatsBatches,
	  getFirstSeenTime: getFirstSeenTime,
	  getLastSeenTime: getLastSeenTime,
	  setFirstSeenTime: setFirstSeenTime,
	  setLastSeenTime: setLastSeenTime
	};

	var Messages$2 = Constants.Messages;
	var cookieSyncManager = {
	  attemptCookieSync: function attemptCookieSync(previousMPID, mpid) {
	    var pixelConfig, lastSyncDateForModule, url, redirect, urlWithRedirect;

	    if (mpid && !mParticle.Store.webviewBridgeEnabled) {
	      mParticle.Store.pixelConfigurations.forEach(function (pixelSettings) {
	        pixelConfig = {
	          moduleId: pixelSettings.moduleId,
	          frequencyCap: pixelSettings.frequencyCap,
	          pixelUrl: cookieSyncManager.replaceAmp(pixelSettings.pixelUrl),
	          redirectUrl: pixelSettings.redirectUrl ? cookieSyncManager.replaceAmp(pixelSettings.redirectUrl) : null
	        };
	        url = cookieSyncManager.replaceMPID(pixelConfig.pixelUrl, mpid);
	        redirect = pixelConfig.redirectUrl ? cookieSyncManager.replaceMPID(pixelConfig.redirectUrl, mpid) : '';
	        urlWithRedirect = url + encodeURIComponent(redirect);
	        var cookies = Persistence.getPersistence();

	        if (previousMPID && previousMPID !== mpid) {
	          if (cookies && cookies[mpid]) {
	            if (!cookies[mpid].csd) {
	              cookies[mpid].csd = {};
	            }

	            performCookieSync(urlWithRedirect, pixelConfig.moduleId, mpid, cookies[mpid].csd);
	          }

	          return;
	        } else {
	          if (cookies[mpid]) {
	            if (!cookies[mpid].csd) {
	              cookies[mpid].csd = {};
	            }

	            lastSyncDateForModule = cookies[mpid].csd[pixelConfig.moduleId.toString()] ? cookies[mpid].csd[pixelConfig.moduleId.toString()] : null;

	            if (lastSyncDateForModule) {
	              // Check to see if we need to refresh cookieSync
	              if (new Date().getTime() > new Date(lastSyncDateForModule).getTime() + pixelConfig.frequencyCap * 60 * 1000 * 60 * 24) {
	                performCookieSync(urlWithRedirect, pixelConfig.moduleId, mpid, cookies[mpid].csd);
	              }
	            } else {
	              performCookieSync(urlWithRedirect, pixelConfig.moduleId, mpid, cookies[mpid].csd);
	            }
	          }
	        }
	      });
	    }
	  },
	  replaceMPID: function replaceMPID(string, mpid) {
	    return string.replace('%%mpid%%', mpid);
	  },
	  replaceAmp: function replaceAmp(string) {
	    return string.replace(/&amp;/g, '&');
	  }
	};

	function performCookieSync(url, moduleId, mpid, cookieSyncDates) {
	  var img = document.createElement('img');
	  mParticle.Logger.verbose(Messages$2.InformationMessages.CookieSync);
	  img.src = url;
	  cookieSyncDates[moduleId.toString()] = new Date().getTime();
	  Persistence.saveUserCookieSyncDatesToCookies(mpid, cookieSyncDates);
	}

	var MessageType$1 = Types.MessageType,
	    ApplicationTransitionType$1 = Types.ApplicationTransitionType,
	    parseNumber$1 = Helpers.parseNumber;

	function convertCustomFlags(event, dto) {
	  var valueArray = [];
	  dto.flags = {};

	  for (var prop in event.CustomFlags) {
	    valueArray = [];

	    if (event.CustomFlags.hasOwnProperty(prop)) {
	      if (Array.isArray(event.CustomFlags[prop])) {
	        event.CustomFlags[prop].forEach(function (customFlagProperty) {
	          if (typeof customFlagProperty === 'number' || typeof customFlagProperty === 'string' || typeof customFlagProperty === 'boolean') {
	            valueArray.push(customFlagProperty.toString());
	          }
	        });
	      } else if (typeof event.CustomFlags[prop] === 'number' || typeof event.CustomFlags[prop] === 'string' || typeof event.CustomFlags[prop] === 'boolean') {
	        valueArray.push(event.CustomFlags[prop].toString());
	      }

	      if (valueArray.length) {
	        dto.flags[prop] = valueArray;
	      }
	    }
	  }
	}

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

	  if (Helpers.isObject(dtoUserIdentities)) {
	    if (Object.keys(dtoUserIdentities).length) {
	      for (var key in dtoUserIdentities) {
	        var userIdentity = {};
	        userIdentity.Identity = dtoUserIdentities[key];
	        userIdentity.Type = Helpers.parseNumber(key);
	        validUserIdentities.push(userIdentity);
	      }
	    }
	  }

	  event.UserIdentities = validUserIdentities;
	}

	function convertProductListToDTO(productList) {
	  if (!productList) {
	    return [];
	  }

	  return productList.map(function (product) {
	    return convertProductToDTO(product);
	  });
	}

	function convertProductToDTO(product) {
	  return {
	    id: Helpers.parseStringOrNumber(product.Sku),
	    nm: Helpers.parseStringOrNumber(product.Name),
	    pr: parseNumber$1(product.Price),
	    qt: parseNumber$1(product.Quantity),
	    br: Helpers.parseStringOrNumber(product.Brand),
	    va: Helpers.parseStringOrNumber(product.Variant),
	    ca: Helpers.parseStringOrNumber(product.Category),
	    ps: parseNumber$1(product.Position),
	    cc: Helpers.parseStringOrNumber(product.CouponCode),
	    tpa: parseNumber$1(product.TotalAmount),
	    attrs: product.Attributes
	  };
	}

	function convertToConsentStateDTO(state) {
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

	  return jsonObject;
	}

	function createEventObject(event) {
	  var uploadObject = {};
	  var eventObject = {};
	  var optOut = event.messageType === Types.MessageType.OptOut ? !mParticle.Store.isEnabled : null;

	  if (mParticle.Store.sessionId || event.messageType == Types.MessageType.OptOut || mParticle.Store.webviewBridgeEnabled) {
	    if (event.hasOwnProperty('toEventAPIObject')) {
	      eventObject = event.toEventAPIObject();
	    } else {
	      eventObject = {
	        EventName: event.name || event.messageType,
	        EventCategory: event.eventType,
	        EventAttributes: Helpers.sanitizeAttributes(event.data),
	        EventDataType: event.messageType,
	        CustomFlags: event.customFlags || {},
	        UserAttributeChanges: event.userAttributeChanges,
	        UserIdentityChanges: event.userIdentityChanges
	      };
	    }

	    if (event.messageType !== Types.MessageType.SessionEnd) {
	      mParticle.Store.dateLastEventSent = new Date();
	    }

	    uploadObject = {
	      Store: mParticle.Store.serverSettings,
	      SDKVersion: Constants.sdkVersion,
	      SessionId: mParticle.Store.sessionId,
	      SessionStartDate: mParticle.Store.sessionStartDate ? mParticle.Store.sessionStartDate.getTime() : null,
	      Debug: mParticle.Store.SDKConfig.isDevelopmentMode,
	      Location: mParticle.Store.currentPosition,
	      OptOut: optOut,
	      ExpandedEventCount: 0,
	      AppVersion: mParticle.Store.SDKConfig.appVersion,
	      ClientGeneratedId: mParticle.Store.clientId,
	      DeviceId: mParticle.Store.deviceId,
	      IntegrationAttributes: mParticle.Store.integrationAttributes,
	      CurrencyCode: mParticle.Store.currencyCode
	    };
	    eventObject.CurrencyCode = mParticle.Store.currencyCode;
	    var currentUser = mParticle.Identity.getCurrentUser();
	    appendUserInfo(currentUser, eventObject);

	    if (event.messageType === Types.MessageType.SessionEnd) {
	      eventObject.SessionLength = mParticle.Store.dateLastEventSent.getTime() - mParticle.Store.sessionStartDate.getTime();
	      eventObject.currentSessionMPIDs = mParticle.Store.currentSessionMPIDs;
	      eventObject.EventAttributes = mParticle.Store.sessionAttributes;
	      mParticle.Store.currentSessionMPIDs = [];
	      mParticle.Store.sessionStartDate = null;
	    }

	    uploadObject.Timestamp = mParticle.Store.dateLastEventSent.getTime();
	    return Helpers.extend({}, eventObject, uploadObject);
	  }

	  return null;
	}

	function convertEventToDTO(event, isFirstRun) {
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
	  var consent = convertToConsentStateDTO(event.ConsentState);

	  if (consent) {
	    dto.con = consent;
	  }

	  if (event.EventDataType === MessageType$1.AppStateTransition) {
	    dto.fr = isFirstRun;
	    dto.iu = false;
	    dto.at = ApplicationTransitionType$1.AppInit;
	    dto.lr = window.location.href || null;
	    dto.attrs = null;
	  }

	  if (event.CustomFlags) {
	    convertCustomFlags(event, dto);
	  }

	  if (event.EventDataType === MessageType$1.Commerce) {
	    dto.cu = event.CurrencyCode;

	    if (event.ShoppingCart) {
	      dto.sc = {
	        pl: convertProductListToDTO(event.ShoppingCart.ProductList)
	      };
	    }

	    if (event.ProductAction) {
	      dto.pd = {
	        an: event.ProductAction.ProductActionType,
	        cs: parseNumber$1(event.ProductAction.CheckoutStep),
	        co: event.ProductAction.CheckoutOptions,
	        pl: convertProductListToDTO(event.ProductAction.ProductList),
	        ti: event.ProductAction.TransactionId,
	        ta: event.ProductAction.Affiliation,
	        tcc: event.ProductAction.CouponCode,
	        tr: parseNumber$1(event.ProductAction.TotalAmount),
	        ts: parseNumber$1(event.ProductAction.ShippingAmount),
	        tt: parseNumber$1(event.ProductAction.TaxAmount)
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
	          pl: convertProductListToDTO(impression.ProductList)
	        };
	      });
	    }
	  } else if (event.EventDataType === MessageType$1.Profile) {
	    dto.pet = event.ProfileMessageType;
	  }

	  return dto;
	}

	var ServerModel = {
	  createEventObject: createEventObject,
	  convertEventToDTO: convertEventToDTO,
	  convertToConsentStateDTO: convertToConsentStateDTO,
	  appendUserInfo: appendUserInfo
	};

	function getFilteredMparticleUser(mpid, forwarder) {
	  return {
	    getUserIdentities: function getUserIdentities() {
	      var currentUserIdentities = {};
	      var identities = Persistence.getUserIdentities(mpid);

	      for (var identityType in identities) {
	        if (identities.hasOwnProperty(identityType)) {
	          currentUserIdentities[Types.IdentityType.getIdentityName(Helpers.parseNumber(identityType))] = identities[identityType];
	        }
	      }

	      currentUserIdentities = Helpers.filterUserIdentitiesForForwarders(currentUserIdentities, forwarder.userIdentityFilters);
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
	      userAttributes = this.getAllUserAttributes();

	      for (var key in userAttributes) {
	        if (userAttributes.hasOwnProperty(key) && Array.isArray(userAttributes[key])) {
	          userAttributesLists[key] = userAttributes[key].slice();
	        }
	      }

	      userAttributesLists = Helpers.filterUserAttributes(userAttributesLists, forwarder.userAttributeFilters);
	      return userAttributesLists;
	    },
	    getAllUserAttributes: function getAllUserAttributes() {
	      var userAttributesCopy = {};
	      var userAttributes = Persistence.getAllUserAttributes(mpid);

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

	      userAttributesCopy = Helpers.filterUserAttributes(userAttributesCopy, forwarder.userAttributeFilters);
	      return userAttributesCopy;
	    }
	  };
	}

	function initForwarders(userIdentities, forwardingStatsCallback) {
	  var user = mParticle.Identity.getCurrentUser();

	  if (!mParticle.Store.webviewBridgeEnabled && mParticle.Store.configuredForwarders) {
	    // Some js libraries require that they be loaded first, or last, etc
	    mParticle.Store.configuredForwarders.sort(function (x, y) {
	      x.settings.PriorityValue = x.settings.PriorityValue || 0;
	      y.settings.PriorityValue = y.settings.PriorityValue || 0;
	      return -1 * (x.settings.PriorityValue - y.settings.PriorityValue);
	    });
	    mParticle.Store.activeForwarders = mParticle.Store.configuredForwarders.filter(function (forwarder) {
	      if (!isEnabledForUserConsent(forwarder.filteringConsentRuleValues, user)) {
	        return false;
	      }

	      if (!isEnabledForUserAttributes(forwarder.filteringUserAttributeValue, user)) {
	        return false;
	      }

	      if (!isEnabledForUnknownUser(forwarder.excludeAnonymousUser, user)) {
	        return false;
	      }

	      var filteredUserIdentities = Helpers.filterUserIdentities(userIdentities, forwarder.userIdentityFilters);
	      var filteredUserAttributes = Helpers.filterUserAttributes(user ? user.getAllUserAttributes() : {}, forwarder.userAttributeFilters);

	      if (!forwarder.initialized) {
	        forwarder.init(forwarder.settings, forwardingStatsCallback, false, null, filteredUserAttributes, filteredUserIdentities, mParticle.Store.SDKConfig.appVersion, mParticle.Store.SDKConfig.appName, mParticle.Store.SDKConfig.customFlags, mParticle.Store.clientId);
	        forwarder.initialized = true;
	      }

	      return true;
	    });
	  }
	}

	function isEnabledForUserConsent(consentRules, user) {
	  if (!consentRules || !consentRules.values || !consentRules.values.length) {
	    return true;
	  }

	  if (!user) {
	    return false;
	  }

	  var purposeHashes = {};
	  var GDPRConsentHashPrefix = '1';
	  var consentState = user.getConsentState();

	  if (consentState) {
	    var gdprConsentState = consentState.getGDPRConsentState();

	    if (gdprConsentState) {
	      for (var purpose in gdprConsentState) {
	        if (gdprConsentState.hasOwnProperty(purpose)) {
	          var purposeHash = Helpers.generateHash(GDPRConsentHashPrefix + purpose).toString();
	          purposeHashes[purposeHash] = gdprConsentState[purpose].Consented;
	        }
	      }
	    }
	  }

	  var isMatch = false;
	  consentRules.values.forEach(function (consentRule) {
	    if (!isMatch) {
	      var purposeHash = consentRule.consentPurpose;
	      var hasConsented = consentRule.hasConsented;

	      if (purposeHashes.hasOwnProperty(purposeHash) && purposeHashes[purposeHash] === hasConsented) {
	        isMatch = true;
	      }
	    }
	  });
	  return consentRules.includeOnMatch === isMatch;
	}

	function isEnabledForUserAttributes(filterObject, user) {
	  if (!filterObject || !Helpers.isObject(filterObject) || !Object.keys(filterObject).length) {
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
	    if (userAttributes && Helpers.isObject(userAttributes) && Object.keys(userAttributes).length) {
	      for (var attrName in userAttributes) {
	        if (userAttributes.hasOwnProperty(attrName)) {
	          attrHash = Helpers.generateHash(attrName).toString();
	          valueHash = Helpers.generateHash(userAttributes[attrName]).toString();

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
	}

	function isEnabledForUnknownUser(excludeAnonymousUserBoolean, user) {
	  if (!user || !user.isLoggedIn()) {
	    if (excludeAnonymousUserBoolean) {
	      return false;
	    }
	  }

	  return true;
	}

	function applyToForwarders(functionName, functionArgs) {
	  if (mParticle.Store.activeForwarders.length) {
	    mParticle.Store.activeForwarders.forEach(function (forwarder) {
	      var forwarderFunction = forwarder[functionName];

	      if (forwarderFunction) {
	        try {
	          var result = forwarder[functionName](functionArgs);

	          if (result) {
	            mParticle.Logger.verbose(result);
	          }
	        } catch (e) {
	          mParticle.Logger.verbose(e);
	        }
	      }
	    });
	  }
	}

	function sendEventToForwarders(event) {
	  var clonedEvent,
	      hashedEventName,
	      hashedEventType,
	      filterUserIdentities = function filterUserIdentities(event, filterList) {
	    if (event.UserIdentities && event.UserIdentities.length) {
	      event.UserIdentities.forEach(function (userIdentity, i) {
	        if (Helpers.inArray(filterList, userIdentity.Type)) {
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
	        hash = Helpers.generateHash(event.EventCategory + event.EventName + attrName);

	        if (Helpers.inArray(filterList, hash)) {
	          delete event.EventAttributes[attrName];
	        }
	      }
	    }
	  },
	      inFilteredList = function inFilteredList(filterList, hash) {
	    if (filterList && filterList.length) {
	      if (Helpers.inArray(filterList, hash)) {
	        return true;
	      }
	    }

	    return false;
	  },
	      forwardingRuleMessageTypes = [Types.MessageType.PageEvent, Types.MessageType.PageView, Types.MessageType.Commerce];

	  if (!mParticle.Store.webviewBridgeEnabled && mParticle.Store.activeForwarders) {
	    hashedEventName = Helpers.generateHash(event.EventCategory + event.EventName);
	    hashedEventType = Helpers.generateHash(event.EventCategory);

	    for (var i = 0; i < mParticle.Store.activeForwarders.length; i++) {
	      // Check attribute forwarding rule. This rule allows users to only forward an event if a
	      // specific attribute exists and has a specific value. Alternatively, they can specify
	      // that an event not be forwarded if the specified attribute name and value exists.
	      // The two cases are controlled by the "includeOnMatch" boolean value.
	      // Supported message types for attribute forwarding rules are defined in the forwardingRuleMessageTypes array
	      if (forwardingRuleMessageTypes.indexOf(event.EventDataType) > -1 && mParticle.Store.activeForwarders[i].filteringEventAttributeValue && mParticle.Store.activeForwarders[i].filteringEventAttributeValue.eventAttributeName && mParticle.Store.activeForwarders[i].filteringEventAttributeValue.eventAttributeValue) {
	        var foundProp = null; // Attempt to find the attribute in the collection of event attributes

	        if (event.EventAttributes) {
	          for (var prop in event.EventAttributes) {
	            var hashedEventAttributeName;
	            hashedEventAttributeName = Helpers.generateHash(prop).toString();

	            if (hashedEventAttributeName === mParticle.Store.activeForwarders[i].filteringEventAttributeValue.eventAttributeName) {
	              foundProp = {
	                name: hashedEventAttributeName,
	                value: Helpers.generateHash(event.EventAttributes[prop]).toString()
	              };
	            }

	            if (foundProp) {
	              break;
	            }
	          }
	        }

	        var isMatch = foundProp !== null && foundProp.value === mParticle.Store.activeForwarders[i].filteringEventAttributeValue.eventAttributeValue;
	        var shouldInclude = mParticle.Store.activeForwarders[i].filteringEventAttributeValue.includeOnMatch === true ? isMatch : !isMatch;

	        if (!shouldInclude) {
	          continue;
	        }
	      } // Clone the event object, as we could be sending different attributes to each forwarder


	      clonedEvent = {};
	      clonedEvent = Helpers.extend(true, clonedEvent, event); // Check event filtering rules

	      if (event.EventDataType === Types.MessageType.PageEvent && (inFilteredList(mParticle.Store.activeForwarders[i].eventNameFilters, hashedEventName) || inFilteredList(mParticle.Store.activeForwarders[i].eventTypeFilters, hashedEventType))) {
	        continue;
	      } else if (event.EventDataType === Types.MessageType.Commerce && inFilteredList(mParticle.Store.activeForwarders[i].eventTypeFilters, hashedEventType)) {
	        continue;
	      } else if (event.EventDataType === Types.MessageType.PageView && inFilteredList(mParticle.Store.activeForwarders[i].screenNameFilters, hashedEventName)) {
	        continue;
	      } // Check attribute filtering rules


	      if (clonedEvent.EventAttributes) {
	        if (event.EventDataType === Types.MessageType.PageEvent) {
	          filterAttributes(clonedEvent, mParticle.Store.activeForwarders[i].attributeFilters);
	        } else if (event.EventDataType === Types.MessageType.PageView) {
	          filterAttributes(clonedEvent, mParticle.Store.activeForwarders[i].pageViewAttributeFilters);
	        }
	      } // Check user identity filtering rules


	      filterUserIdentities(clonedEvent, mParticle.Store.activeForwarders[i].userIdentityFilters); // Check user attribute filtering rules

	      clonedEvent.UserAttributes = Helpers.filterUserAttributes(clonedEvent.UserAttributes, mParticle.Store.activeForwarders[i].userAttributeFilters);
	      mParticle.Logger.verbose('Sending message to forwarder: ' + mParticle.Store.activeForwarders[i].name);

	      if (mParticle.Store.activeForwarders[i].process) {
	        var result = mParticle.Store.activeForwarders[i].process(clonedEvent);

	        if (result) {
	          mParticle.Logger.verbose(result);
	        }
	      }
	    }
	  }
	}

	function callSetUserAttributeOnForwarders(key, value) {
	  if (mParticle.Store.activeForwarders.length) {
	    mParticle.Store.activeForwarders.forEach(function (forwarder) {
	      if (forwarder.setUserAttribute && forwarder.userAttributeFilters && !Helpers.inArray(forwarder.userAttributeFilters, Helpers.generateHash(key))) {
	        try {
	          var result = forwarder.setUserAttribute(key, value);

	          if (result) {
	            mParticle.Logger.verbose(result);
	          }
	        } catch (e) {
	          mParticle.Logger.error(e);
	        }
	      }
	    });
	  }
	}

	function setForwarderUserIdentities(userIdentities) {
	  mParticle.Store.activeForwarders.forEach(function (forwarder) {
	    var filteredUserIdentities = Helpers.filterUserIdentities(userIdentities, forwarder.userIdentityFilters);

	    if (forwarder.setUserIdentity) {
	      filteredUserIdentities.forEach(function (identity) {
	        var result = forwarder.setUserIdentity(identity.Identity, identity.Type);

	        if (result) {
	          mParticle.Logger.verbose(result);
	        }
	      });
	    }
	  });
	}

	function setForwarderOnUserIdentified(user) {
	  mParticle.Store.activeForwarders.forEach(function (forwarder) {
	    var filteredUser = getFilteredMparticleUser(user.getMPID(), forwarder);

	    if (forwarder.onUserIdentified) {
	      var result = forwarder.onUserIdentified(filteredUser);

	      if (result) {
	        mParticle.Logger.verbose(result);
	      }
	    }
	  });
	}

	function setForwarderOnIdentityComplete(user, identityMethod) {
	  var result;
	  mParticle.Store.activeForwarders.forEach(function (forwarder) {
	    var filteredUser = getFilteredMparticleUser(user.getMPID(), forwarder);

	    if (identityMethod === 'identify') {
	      if (forwarder.onIdentifyComplete) {
	        result = forwarder.onIdentifyComplete(filteredUser);

	        if (result) {
	          mParticle.Logger.verbose(result);
	        }
	      }
	    } else if (identityMethod === 'login') {
	      if (forwarder.onLoginComplete) {
	        result = forwarder.onLoginComplete(filteredUser);

	        if (result) {
	          mParticle.Logger.verbose(result);
	        }
	      }
	    } else if (identityMethod === 'logout') {
	      if (forwarder.onLogoutComplete) {
	        result = forwarder.onLogoutComplete(filteredUser);

	        if (result) {
	          mParticle.Logger.verbose(result);
	        }
	      }
	    } else if (identityMethod === 'modify') {
	      if (forwarder.onModifyComplete) {
	        result = forwarder.onModifyComplete(filteredUser);

	        if (result) {
	          mParticle.Logger.verbose(result);
	        }
	      }
	    }
	  });
	}

	function getForwarderStatsQueue() {
	  return Persistence.forwardingStatsBatches.forwardingStatsEventQueue;
	}

	function setForwarderStatsQueue(queue) {
	  Persistence.forwardingStatsBatches.forwardingStatsEventQueue = queue;
	}

	function configureForwarder(configuration) {
	  var newForwarder = null,
	      config = configuration,
	      forwarders = {}; // if there are kits inside of mParticle.Store.SDKConfig.kits, then mParticle is self hosted

	  if (Helpers.isObject(mParticle.Store.SDKConfig.kits) && Object.keys(mParticle.Store.SDKConfig.kits).length > 0) {
	    forwarders = mParticle.Store.SDKConfig.kits; // otherwise mParticle is loaded via script tag
	  } else if (mParticle.preInit.forwarderConstructors.length > 0) {
	    mParticle.preInit.forwarderConstructors.forEach(function (forwarder) {
	      forwarders[forwarder.name] = forwarder;
	    });
	  }

	  for (var name in forwarders) {
	    if (name === config.name) {
	      if (config.isDebug === mParticle.Store.SDKConfig.isDevelopmentMode || config.isSandbox === mParticle.Store.SDKConfig.isDevelopmentMode) {
	        newForwarder = new forwarders[name].constructor();
	        newForwarder.id = config.moduleId;
	        newForwarder.isSandbox = config.isDebug || config.isSandbox;
	        newForwarder.hasSandbox = config.hasDebugString === 'true';
	        newForwarder.isVisible = config.isVisible;
	        newForwarder.settings = config.settings;
	        newForwarder.eventNameFilters = config.eventNameFilters;
	        newForwarder.eventTypeFilters = config.eventTypeFilters;
	        newForwarder.attributeFilters = config.attributeFilters;
	        newForwarder.screenNameFilters = config.screenNameFilters;
	        newForwarder.screenNameFilters = config.screenNameFilters;
	        newForwarder.pageViewAttributeFilters = config.pageViewAttributeFilters;
	        newForwarder.userIdentityFilters = config.userIdentityFilters;
	        newForwarder.userAttributeFilters = config.userAttributeFilters;
	        newForwarder.filteringEventAttributeValue = config.filteringEventAttributeValue;
	        newForwarder.filteringUserAttributeValue = config.filteringUserAttributeValue;
	        newForwarder.eventSubscriptionId = config.eventSubscriptionId;
	        newForwarder.filteringConsentRuleValues = config.filteringConsentRuleValues;
	        newForwarder.excludeAnonymousUser = config.excludeAnonymousUser;
	        mParticle.Store.configuredForwarders.push(newForwarder);
	        break;
	      }
	    }
	  }
	}

	function configurePixel(settings) {
	  if (settings.isDebug === mParticle.Store.SDKConfig.isDevelopmentMode || settings.isProduction !== mParticle.Store.SDKConfig.isDevelopmentMode) {
	    mParticle.Store.pixelConfigurations.push(settings);
	  }
	}

	function processForwarders(config, forwardingStatsCallback) {
	  if (!config) {
	    mParticle.Logger.warning('No config was passed. Cannot process forwarders');
	  } else {
	    try {
	      if (Array.isArray(config.kitConfigs) && config.kitConfigs.length) {
	        config.kitConfigs.forEach(function (kitConfig) {
	          configureForwarder(kitConfig);
	        });
	      }

	      if (Array.isArray(config.pixelConfigs) && config.pixelConfigs.length) {
	        config.pixelConfigs.forEach(function (pixelConfig) {
	          configurePixel(pixelConfig);
	        });
	      }

	      initForwarders(mParticle.Store.SDKConfig.identifyRequest.userIdentities, forwardingStatsCallback);
	    } catch (e) {
	      mParticle.Logger.error('Config was not parsed propertly. Forwarders may not be initialized.');
	    }
	  }
	}

	var Forwarders = {
	  initForwarders: initForwarders,
	  applyToForwarders: applyToForwarders,
	  sendEventToForwarders: sendEventToForwarders,
	  callSetUserAttributeOnForwarders: callSetUserAttributeOnForwarders,
	  setForwarderUserIdentities: setForwarderUserIdentities,
	  setForwarderOnUserIdentified: setForwarderOnUserIdentified,
	  setForwarderOnIdentityComplete: setForwarderOnIdentityComplete,
	  getForwarderStatsQueue: getForwarderStatsQueue,
	  setForwarderStatsQueue: setForwarderStatsQueue,
	  isEnabledForUserConsent: isEnabledForUserConsent,
	  isEnabledForUserAttributes: isEnabledForUserAttributes,
	  configurePixel: configurePixel,
	  processForwarders: processForwarders
	};

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

	function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly)
	        symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; });
	    keys.push.apply(keys, symbols);
	} return keys; }
	function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};
	    if (i % 2) {
	        ownKeys(source, true).forEach(function (key) { defineProperty(target, key, source[key]); });
	    }
	    else if (Object.getOwnPropertyDescriptors) {
	        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    }
	    else {
	        ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); });
	    }
	} return target; }
	function convertEvents(mpid, sdkEvents) {
	    if (!mpid) {
	        return null;
	    }
	    if (!sdkEvents || sdkEvents.length < 1) {
	        return null;
	    }
	    var uploadEvents = [];
	    var lastEvent = null;
	    var _iteratorNormalCompletion = true;
	    var _didIteratorError = false;
	    var _iteratorError = undefined;
	    try {
	        for (var _iterator = sdkEvents[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	            var sdkEvent = _step.value;
	            if (sdkEvent) {
	                lastEvent = sdkEvent;
	                var baseEvent = convertEvent(sdkEvent);
	                if (baseEvent) {
	                    uploadEvents.push(baseEvent);
	                }
	            }
	        }
	    }
	    catch (err) {
	        _didIteratorError = true;
	        _iteratorError = err;
	    }
	    finally {
	        try {
	            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
	                _iterator["return"]();
	            }
	        }
	        finally {
	            if (_didIteratorError) {
	                throw _iteratorError;
	            }
	        }
	    }
	    if (!lastEvent) {
	        return null;
	    }
	    var upload = {
	        source_request_id: Helpers.generateUniqueId(),
	        mpid: mpid,
	        timestamp_unixtime_ms: new Date().getTime(),
	        environment: lastEvent.Debug ? 'development' : 'production',
	        events: uploadEvents,
	        mp_deviceid: lastEvent.DeviceId,
	        sdk_version: lastEvent.SDKVersion,
	        application_info: {
	            application_version: lastEvent.AppVersion
	        },
	        device_info: {
	            platform: 'web',
	            screen_width: window.screen.width,
	            screen_height: window.screen.height
	        },
	        user_attributes: lastEvent.UserAttributes,
	        user_identities: convertUserIdentities(lastEvent.UserIdentities),
	        consent_state: convertConsentState(lastEvent.ConsentState),
	        integration_attributes: lastEvent.IntegrationAttributes
	    };
	    return upload;
	}
	function convertConsentState(sdkConsentState) {
	    if (!sdkConsentState) {
	        return null;
	    }
	    var consentState = {
	        gdpr: convertGdprConsentState(sdkConsentState.getGDPRConsentState())
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
	function convertUserIdentities(sdkUserIdentities) {
	    if (!sdkUserIdentities || !sdkUserIdentities.length) {
	        return null;
	    }
	    var batchIdentities = {};
	    var _iteratorNormalCompletion2 = true;
	    var _didIteratorError2 = false;
	    var _iteratorError2 = undefined;
	    try {
	        for (var _iterator2 = sdkUserIdentities[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	            var identity = _step2.value;
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
	                default:
	                    break;
	            }
	        }
	    }
	    catch (err) {
	        _didIteratorError2 = true;
	        _iteratorError2 = err;
	    }
	    finally {
	        try {
	            if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
	                _iterator2["return"]();
	            }
	        }
	        finally {
	            if (_didIteratorError2) {
	                throw _iteratorError2;
	            }
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
	        default:
	            break;
	    }
	    return null;
	}
	function convertProductActionType(actionType) {
	    if (!actionType) {
	        return 'unknown';
	    }
	    switch (actionType) {
	        case SDKProductActionType.AddToCart:
	            return 'add_to_cart';
	        case SDKProductActionType.AddToWishlist:
	            return 'add_to_wishlist';
	        case SDKProductActionType.Checkout:
	            return 'checkout';
	        case SDKProductActionType.CheckoutOption:
	            return 'checkout_option';
	        case SDKProductActionType.Click:
	            return 'click';
	        case SDKProductActionType.Purchase:
	            return 'purchase';
	        case SDKProductActionType.Refund:
	            return 'refund';
	        case SDKProductActionType.RemoveFromCart:
	            return 'remove_from_cart';
	        case SDKProductActionType.RemoveFromWishlist:
	            return 'remove_from_wish_list';
	        case SDKProductActionType.ViewDetail:
	            return 'view_detail';
	        default:
	            return 'unknown';
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
	    var _iteratorNormalCompletion3 = true;
	    var _didIteratorError3 = false;
	    var _iteratorError3 = undefined;
	    try {
	        for (var _iterator3 = sdkProducts[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
	            var sdkProduct = _step3.value;
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
	    }
	    catch (err) {
	        _didIteratorError3 = true;
	        _iteratorError3 = err;
	    }
	    finally {
	        try {
	            if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
	                _iterator3["return"]();
	            }
	        }
	        finally {
	            if (_didIteratorError3) {
	                throw _iteratorError3;
	            }
	        }
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
	    var _iteratorNormalCompletion4 = true;
	    var _didIteratorError4 = false;
	    var _iteratorError4 = undefined;
	    try {
	        for (var _iterator4 = sdkPromotions[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
	            var sdkPromotion = _step4.value;
	            var promotion = {
	                id: sdkPromotion.Id,
	                name: sdkPromotion.Name,
	                creative: sdkPromotion.Creative,
	                position: sdkPromotion.Position
	            };
	            promotions.push(promotion);
	        }
	    }
	    catch (err) {
	        _didIteratorError4 = true;
	        _iteratorError4 = err;
	    }
	    finally {
	        try {
	            if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
	                _iterator4["return"]();
	            }
	        }
	        finally {
	            if (_didIteratorError4) {
	                throw _iteratorError4;
	            }
	        }
	    }
	    return promotions;
	}
	function convertImpressions(sdkEvent) {
	    if (!sdkEvent.ProductImpressions) {
	        return null;
	    }
	    var impressions = [];
	    var _iteratorNormalCompletion5 = true;
	    var _didIteratorError5 = false;
	    var _iteratorError5 = undefined;
	    try {
	        for (var _iterator5 = sdkEvent.ProductImpressions[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
	            var sdkImpression = _step5.value;
	            var impression = {
	                product_impression_list: sdkImpression.ProductImpressionList,
	                products: convertProducts(sdkImpression.ProductList)
	            };
	            impressions.push(impression);
	        }
	    }
	    catch (err) {
	        _didIteratorError5 = true;
	        _iteratorError5 = err;
	    }
	    finally {
	        try {
	            if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
	                _iterator5["return"]();
	            }
	        }
	        finally {
	            if (_didIteratorError5) {
	                throw _iteratorError5;
	            }
	        }
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
	        event_type: 'commerce_event',
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
	        event_type: 'crash_report',
	        data: crashReportEventData
	    };
	}
	function convertAST(sdkEvent) {
	    var commonEventData = convertBaseEventData(sdkEvent);
	    var astEventData = {
	        application_transition_type: 'application_initialized',
	        is_first_run: sdkEvent.IsFirstRun,
	        is_upgrade: false
	    };
	    astEventData = Object.assign(astEventData, commonEventData);
	    return {
	        event_type: 'application_state_transition',
	        data: astEventData
	    };
	}
	function convertSessionEndEvent(sdkEvent) {
	    var commonEventData = convertBaseEventData(sdkEvent);
	    var sessionEndEventData = {
	        session_duration_ms: sdkEvent.SessionLength //note: External Events DTO does not support the session mpids array as of this time.
	        //spanning_mpids: sdkEvent.SessionMpids
	    };
	    sessionEndEventData = Object.assign(sessionEndEventData, commonEventData);
	    return {
	        event_type: 'session_end',
	        data: sessionEndEventData
	    };
	}
	function convertSessionStartEvent(sdkEvent) {
	    var commonEventData = convertBaseEventData(sdkEvent);
	    var sessionStartEventData = {};
	    sessionStartEventData = Object.assign(sessionStartEventData, commonEventData);
	    return {
	        event_type: 'session_start',
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
	        event_type: 'screen_view',
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
	        event_type: 'opt_out',
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
	        event_type: 'custom_event',
	        data: customEventData
	    };
	}
	function convertSdkEventType(sdkEventType) {
	    switch (sdkEventType) {
	        case Types.EventType.Other:
	            return 'other';
	        case Types.EventType.Location:
	            return 'location';
	        case Types.EventType.Navigation:
	            return 'navigation';
	        case Types.EventType.Search:
	            return 'search';
	        case Types.EventType.Social:
	            return 'social';
	        case Types.EventType.Transaction:
	            return 'transaction';
	        case Types.EventType.UserContent:
	            return 'user_content';
	        case Types.EventType.UserPreference:
	            return 'user_preference';
	        case Types.CommerceEventType.ProductAddToCart:
	            return 'add_to_cart';
	        case Types.CommerceEventType.ProductAddToWishlist:
	            return 'add_to_wishlist';
	        case Types.CommerceEventType.ProductCheckout:
	            return 'checkout';
	        case Types.CommerceEventType.ProductCheckoutOption:
	            return 'checkout_option';
	        case Types.CommerceEventType.ProductClick:
	            return 'click';
	        case Types.CommerceEventType.ProductImpression:
	            return 'impression';
	        case Types.CommerceEventType.ProductPurchase:
	            return 'purchase';
	        case Types.CommerceEventType.ProductRefund:
	            return 'refund';
	        case Types.CommerceEventType.ProductRemoveFromCart:
	            return 'remove_from_cart';
	        case Types.CommerceEventType.ProductRemoveFromWishlist:
	            return 'remove_from_wishlist';
	        case Types.CommerceEventType.ProductViewDetail:
	            return 'view_detail';
	        case Types.CommerceEventType.PromotionClick:
	            return 'promotion_click';
	        case Types.CommerceEventType.PromotionView:
	            return 'promotion_view';
	        default:
	            return 'unknown';
	    }
	}
	function convertBaseEventData(sdkEvent) {
	    var commonEventData = {
	        timestamp_unixtime_ms: sdkEvent.Timestamp,
	        session_uuid: sdkEvent.SessionId,
	        session_start_unixtime_ms: sdkEvent.SessionStartDate,
	        custom_attributes: sdkEvent.EventAttributes,
	        location: sdkEvent.Location
	    };
	    return commonEventData;
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
	    userAttributeChangeEvent = _objectSpread({}, userAttributeChangeEvent, {}, commonEventData);
	    return {
	        event_type: 'user_attribute_change',
	        data: userAttributeChangeEvent
	    };
	}
	function convertUserIdentityChangeEvent(sdkEvent) {
	    var commonEventData = convertBaseEventData(sdkEvent);
	    var userIdentityChangeEvent = {
	        "new": {
	            identity_type: sdkEvent.UserIdentityChanges.New.IdentityType,
	            identity: sdkEvent.UserIdentityChanges.New.Identity || null,
	            timestamp_unixtime_ms: sdkEvent.Timestamp,
	            created_this_batch: sdkEvent.UserIdentityChanges.New.CreatedThisBatch
	        },
	        old: {
	            identity_type: sdkEvent.UserIdentityChanges.Old.IdentityType,
	            identity: sdkEvent.UserIdentityChanges.Old.Identity || null,
	            timestamp_unixtime_ms: sdkEvent.Timestamp,
	            created_this_batch: sdkEvent.UserIdentityChanges.Old.CreatedThisBatch
	        }
	    };
	    userIdentityChangeEvent = Object.assign(userIdentityChangeEvent, commonEventData);
	    return {
	        event_type: 'user_identity_change',
	        data: userIdentityChangeEvent
	    };
	}

	var BatchUploader = 
	/*#__PURE__*/
	function () {
	    //we upload JSON, but this content type is required to avoid a CORS preflight request
	    function BatchUploader(webSdk, uploadInterval) {
	        var _this2 = this;
	        classCallCheck(this, BatchUploader);
	        defineProperty(this, "uploadIntervalMillis", void 0);
	        defineProperty(this, "pendingEvents", void 0);
	        defineProperty(this, "pendingUploads", void 0);
	        defineProperty(this, "webSdk", void 0);
	        defineProperty(this, "uploadUrl", void 0);
	        defineProperty(this, "batchingEnabled", void 0);
	        this.webSdk = webSdk;
	        this.uploadIntervalMillis = uploadInterval;
	        this.batchingEnabled = uploadInterval >= BatchUploader.MINIMUM_INTERVAL_MILLIS;
	        if (this.uploadIntervalMillis < BatchUploader.MINIMUM_INTERVAL_MILLIS) {
	            this.uploadIntervalMillis = BatchUploader.MINIMUM_INTERVAL_MILLIS;
	        }
	        this.pendingEvents = [];
	        this.pendingUploads = [];
	        var _this$webSdk$Store = this.webSdk.Store, SDKConfig = _this$webSdk$Store.SDKConfig, devToken = _this$webSdk$Store.devToken;
	        var baseUrl = Helpers.createServiceUrl(SDKConfig.v3SecureServiceUrl, devToken);
	        this.uploadUrl = "".concat(baseUrl, "/events");
	        setTimeout(function () {
	            _this2.prepareAndUpload(true, false);
	        }, this.uploadIntervalMillis);
	        this.addEventListeners();
	    }
	    createClass(BatchUploader, [{
	            key: "addEventListeners",
	            value: function addEventListeners() {
	                var _this = this;
	                window.addEventListener('beforeunload', function () {
	                    _this.prepareAndUpload(false, _this.isBeaconAvailable());
	                });
	                window.addEventListener('pagehide', function () {
	                    _this.prepareAndUpload(false, _this.isBeaconAvailable());
	                });
	            }
	        }, {
	            key: "isBeaconAvailable",
	            value: function isBeaconAvailable() {
	                if (navigator.sendBeacon) {
	                    return true;
	                }
	                return false;
	            }
	        }, {
	            key: "queueEvent",
	            value: function queueEvent(event) {
	                if (event) {
	                    //add this for cleaner processing later
	                    event.IsFirstRun = this.webSdk.Store.isFirstRun;
	                    this.pendingEvents.push(event);
	                    this.webSdk.Logger.verbose("Queuing event: ".concat(JSON.stringify(event)));
	                    this.webSdk.Logger.verbose("Queued event count: ".concat(this.pendingEvents.length));
	                    if (!this.batchingEnabled) {
	                        this.prepareAndUpload(false, false);
	                    }
	                }
	            }
	            /**
	             * This implements crucial logic to:
	             * - bucket pending events by MPID, and then by Session, and upload individual batches for each bucket.
	             *
	             * In the future this should enforce other requirements such as maximum batch size.
	             *
	             * @param sdkEvents current pending events
	             * @param defaultUser the user to reference for events that are missing data
	             */
	        }, {
	            key: "prepareAndUpload",
	            /**
	             * This is the main loop function:
	             *  - take all pending events and turn them into batches
	             *  - attempt to upload each batch
	             *
	             * @param triggerFuture whether to trigger the loop again - for manual/forced uploads this should be false
	             * @param useBeacon whether to use the beacon API - used when the page is being unloaded
	             */
	            value: function () {
	                var _prepareAndUpload = asyncToGenerator(
	                /*#__PURE__*/
	                regenerator.mark(function _callee(triggerFuture, useBeacon) {
	                    var _this3 = this;
	                    var currentUser, currentEvents, newUploads, _this$pendingUploads, currentUploads, remainingUploads, _this$pendingUploads2;
	                    return regenerator.wrap(function _callee$(_context) {
	                        while (1) {
	                            switch (_context.prev = _context.next) {
	                                case 0:
	                                    currentUser = this.webSdk.Identity.getCurrentUser();
	                                    currentEvents = this.pendingEvents;
	                                    this.pendingEvents = [];
	                                    newUploads = BatchUploader.createNewUploads(currentEvents, currentUser);
	                                    if (newUploads && newUploads.length) {
	                                        (_this$pendingUploads = this.pendingUploads).push.apply(_this$pendingUploads, toConsumableArray(newUploads));
	                                    }
	                                    currentUploads = this.pendingUploads;
	                                    this.pendingUploads = [];
	                                    _context.next = 9;
	                                    return this.upload(this.webSdk.Logger, currentUploads, useBeacon);
	                                case 9:
	                                    remainingUploads = _context.sent;
	                                    if (remainingUploads && remainingUploads.length) {
	                                        (_this$pendingUploads2 = this.pendingUploads).unshift.apply(_this$pendingUploads2, toConsumableArray(remainingUploads));
	                                    }
	                                    if (triggerFuture) {
	                                        setTimeout(function () {
	                                            _this3.prepareAndUpload(true, false);
	                                        }, this.uploadIntervalMillis);
	                                    }
	                                case 12:
	                                case "end":
	                                    return _context.stop();
	                            }
	                        }
	                    }, _callee, this);
	                }));
	                function prepareAndUpload(_x, _x2) {
	                    return _prepareAndUpload.apply(this, arguments);
	                }
	                return prepareAndUpload;
	            }()
	        }, {
	            key: "upload",
	            value: function () {
	                var _upload = asyncToGenerator(
	                /*#__PURE__*/
	                regenerator.mark(function _callee2(logger, uploads, useBeacon) {
	                    var i, settings, blob, response;
	                    return regenerator.wrap(function _callee2$(_context2) {
	                        while (1) {
	                            switch (_context2.prev = _context2.next) {
	                                case 0:
	                                    if (!(!uploads || uploads.length < 1)) {
	                                        _context2.next = 2;
	                                        break;
	                                    }
	                                    return _context2.abrupt("return", null);
	                                case 2:
	                                    logger.verbose("Uploading batches: ".concat(JSON.stringify(uploads)));
	                                    logger.verbose("Batch count: ".concat(uploads.length));
	                                    i = 0;
	                                case 5:
	                                    if (!(i < uploads.length)) {
	                                        _context2.next = 37;
	                                        break;
	                                    }
	                                    settings = {
	                                        method: 'POST',
	                                        headers: {
	                                            Accept: BatchUploader.CONTENT_TYPE,
	                                            'Content-Type': 'text/plain;charset=UTF-8'
	                                        },
	                                        body: JSON.stringify(uploads[i])
	                                    };
	                                    _context2.prev = 7;
	                                    if (!useBeacon) {
	                                        _context2.next = 13;
	                                        break;
	                                    }
	                                    blob = new Blob([settings.body], {
	                                        type: 'text/plain;charset=UTF-8'
	                                    });
	                                    navigator.sendBeacon(this.uploadUrl, blob);
	                                    _context2.next = 28;
	                                    break;
	                                case 13:
	                                    logger.verbose("Uploading request ID: ".concat(uploads[i].source_request_id));
	                                    _context2.next = 16;
	                                    return fetch(this.uploadUrl, settings);
	                                case 16:
	                                    response = _context2.sent;
	                                    if (!response.ok) {
	                                        _context2.next = 21;
	                                        break;
	                                    }
	                                    logger.verbose("Upload success for request ID: ".concat(uploads[i].source_request_id));
	                                    _context2.next = 28;
	                                    break;
	                                case 21:
	                                    if (!(response.status >= 500 || response.status === 429)) {
	                                        _context2.next = 25;
	                                        break;
	                                    }
	                                    return _context2.abrupt("return", uploads.slice(i, uploads.length));
	                                case 25:
	                                    if (!(response.status >= 401)) {
	                                        _context2.next = 28;
	                                        break;
	                                    }
	                                    logger.error("HTTP error status ".concat(response.status, " while uploading - please verify your API key.")); //if we're getting a 401, assume we'll keep getting a 401 and clear the uploads.
	                                    return _context2.abrupt("return", null);
	                                case 28:
	                                    _context2.next = 34;
	                                    break;
	                                case 30:
	                                    _context2.prev = 30;
	                                    _context2.t0 = _context2["catch"](7);
	                                    logger.error("Exception while uploading: ".concat(_context2.t0));
	                                    return _context2.abrupt("return", uploads.slice(i, uploads.length));
	                                case 34:
	                                    i++;
	                                    _context2.next = 5;
	                                    break;
	                                case 37:
	                                    return _context2.abrupt("return", null);
	                                case 38:
	                                case "end":
	                                    return _context2.stop();
	                            }
	                        }
	                    }, _callee2, this, [[7, 30]]);
	                }));
	                function upload(_x3, _x4, _x5) {
	                    return _upload.apply(this, arguments);
	                }
	                return upload;
	            }()
	        }], [{
	            key: "createNewUploads",
	            value: function createNewUploads(sdkEvents, defaultUser) {
	                if (!defaultUser || !sdkEvents || !sdkEvents.length) {
	                    return null;
	                } //bucket by MPID, and then by session, ordered by timestamp
	                var newUploads = [];
	                var eventsByUser = new Map();
	                var _iteratorNormalCompletion = true;
	                var _didIteratorError = false;
	                var _iteratorError = undefined;
	                try {
	                    for (var _iterator = sdkEvents[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	                        var sdkEvent = _step.value;
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
	                }
	                catch (err) {
	                    _didIteratorError = true;
	                    _iteratorError = err;
	                }
	                finally {
	                    try {
	                        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
	                            _iterator["return"]();
	                        }
	                    }
	                    finally {
	                        if (_didIteratorError) {
	                            throw _iteratorError;
	                        }
	                    }
	                }
	                for (var _i = 0, _Array$from = Array.from(eventsByUser.entries()); _i < _Array$from.length; _i++) {
	                    var entry = _Array$from[_i];
	                    var _mpid = entry[0];
	                    var userEvents = entry[1];
	                    var eventsBySession = new Map();
	                    var _iteratorNormalCompletion2 = true;
	                    var _didIteratorError2 = false;
	                    var _iteratorError2 = undefined;
	                    try {
	                        for (var _iterator2 = userEvents[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	                            var _sdkEvent = _step2.value;
	                            var _events = eventsBySession.get(_sdkEvent.SessionId);
	                            if (!_events) {
	                                _events = [];
	                            }
	                            _events.push(_sdkEvent);
	                            eventsBySession.set(_sdkEvent.SessionId, _events);
	                        }
	                    }
	                    catch (err) {
	                        _didIteratorError2 = true;
	                        _iteratorError2 = err;
	                    }
	                    finally {
	                        try {
	                            if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
	                                _iterator2["return"]();
	                            }
	                        }
	                        finally {
	                            if (_didIteratorError2) {
	                                throw _iteratorError2;
	                            }
	                        }
	                    }
	                    for (var _i2 = 0, _Array$from2 = Array.from(eventsBySession.entries()); _i2 < _Array$from2.length; _i2++) {
	                        var _entry = _Array$from2[_i2];
	                        var upload = convertEvents(_mpid, _entry[1]);
	                        if (upload) {
	                            newUploads.push(upload);
	                        }
	                    }
	                }
	                return newUploads;
	            }
	        }]);
	    return BatchUploader;
	}();
	defineProperty(BatchUploader, "CONTENT_TYPE", 'text/plain;charset=UTF-8');
	defineProperty(BatchUploader, "MINIMUM_INTERVAL_MILLIS", 500);

	var HTTPCodes = Constants.HTTPCodes,
	    Messages$3 = Constants.Messages,
	    uploader = null;

	function queueEventForBatchUpload(event) {
	  if (!uploader) {
	    var millis = Helpers.getFeatureFlag(Constants.FeatureFlags.EventBatchingIntervalMillis);
	    uploader = new BatchUploader(mParticle, millis);
	  }

	  uploader.queueEvent(event);
	}

	function shouldEnableBatching() {
	  if (!window.fetch) {
	    return false;
	  }

	  var eventsV3Percentage = Helpers.getFeatureFlag(Constants.FeatureFlags.EventsV3);

	  if (!eventsV3Percentage || !Helpers.Validators.isNumber(eventsV3Percentage)) {
	    return false;
	  }

	  var rampNumber = Helpers.getRampNumber(mParticle.Store.deviceId);
	  return eventsV3Percentage >= rampNumber;
	}

	function processQueuedEvents() {
	  var mpid,
	      currentUser = mParticle.Identity.getCurrentUser();

	  if (currentUser) {
	    mpid = currentUser.getMPID();
	  }

	  if (mParticle.Store.eventQueue.length && mpid) {
	    var localQueueCopy = mParticle.Store.eventQueue;
	    mParticle.Store.eventQueue = [];
	    appendUserInfoToEvents(currentUser, localQueueCopy);
	    localQueueCopy.forEach(function (event) {
	      sendEventToServer(event);
	    });
	  }
	}

	function appendUserInfoToEvents(user, events) {
	  events.forEach(function (event) {
	    if (!event.MPID) {
	      ServerModel.appendUserInfo(user, event);
	    }
	  });
	}

	function sendEventToServer(event) {
	  if (mParticle.Store.webviewBridgeEnabled) {
	    NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.LogEvent, JSON.stringify(event));
	    return;
	  }

	  var mpid,
	      currentUser = mParticle.Identity.getCurrentUser();

	  if (currentUser) {
	    mpid = currentUser.getMPID();
	  }

	  mParticle.Store.requireDelay = Helpers.isDelayedByIntegration(mParticle.preInit.integrationDelays, mParticle.Store.integrationDelayTimeoutStart, Date.now()); // We queue events if there is no MPID (MPID is null, or === 0), or there are integrations that that require this to stall because integration attributes
	  // need to be set, or if we are still fetching the config (self hosted only), and so require delaying events

	  if (!mpid || mParticle.Store.requireDelay || !mParticle.Store.configurationLoaded) {
	    mParticle.Logger.verbose('Event was added to eventQueue. eventQueue will be processed once a valid MPID is returned or there is no more integration imposed delay.');
	    mParticle.Store.eventQueue.push(event);
	    return;
	  }

	  processQueuedEvents();

	  if (shouldEnableBatching()) {
	    queueEventForBatchUpload(event);
	  } else {
	    sendSingleEventToServer(event);
	  }

	  if (event && event.EventName !== Types.MessageType.AppStateTransition) {
	    Forwarders.sendEventToForwarders(event);
	  }
	}

	function sendSingleEventToServer(event) {
	  if (event.EventDataType === Types.MessageType.Media) {
	    return;
	  }

	  var xhr,
	      xhrCallback = function xhrCallback() {
	    if (xhr.readyState === 4) {
	      mParticle.Logger.verbose('Received ' + xhr.statusText + ' from server');
	      parseEventResponse(xhr.responseText);
	    }
	  };

	  if (!event) {
	    mParticle.Logger.error(Messages$3.ErrorMessages.EventEmpty);
	    return;
	  }

	  mParticle.Logger.verbose(Messages$3.InformationMessages.SendHttp);
	  xhr = Helpers.createXHR(xhrCallback);

	  if (xhr) {
	    try {
	      xhr.open('post', Helpers.createServiceUrl(mParticle.Store.SDKConfig.v2SecureServiceUrl, mParticle.Store.devToken) + '/Events');
	      xhr.send(JSON.stringify(ServerModel.convertEventToDTO(event, mParticle.Store.isFirstRun)));
	    } catch (e) {
	      mParticle.Logger.error('Error sending event to mParticle servers. ' + e);
	    }
	  }
	}

	function parseEventResponse(responseText) {
	  var now = new Date(),
	      settings,
	      prop,
	      fullProp;

	  if (!responseText) {
	    return;
	  }

	  try {
	    mParticle.Logger.verbose('Parsing response from server');
	    settings = JSON.parse(responseText);

	    if (settings && settings.Store) {
	      mParticle.Logger.verbose('Parsed store from response, updating local settings');

	      if (!mParticle.Store.serverSettings) {
	        mParticle.Store.serverSettings = {};
	      }

	      for (prop in settings.Store) {
	        if (!settings.Store.hasOwnProperty(prop)) {
	          continue;
	        }

	        fullProp = settings.Store[prop];

	        if (!fullProp.Value || new Date(fullProp.Expires) < now) {
	          // This setting should be deleted from the local store if it exists
	          if (mParticle.Store.serverSettings.hasOwnProperty(prop)) {
	            delete mParticle.Store.serverSettings[prop];
	          }
	        } else {
	          // This is a valid setting
	          mParticle.Store.serverSettings[prop] = fullProp;
	        }
	      }

	      Persistence.update();
	    }
	  } catch (e) {
	    mParticle.Logger.error('Error parsing JSON response from server: ' + e.name);
	  }
	}

	function sendAliasRequest(aliasRequest, callback) {
	  var xhr,
	      xhrCallback = function xhrCallback() {
	    if (xhr.readyState === 4) {
	      mParticle.Logger.verbose('Received ' + xhr.statusText + ' from server'); //only parse error messages from failing requests

	      if (xhr.status !== 200 && xhr.status !== 202) {
	        if (xhr.responseText) {
	          var response = JSON.parse(xhr.responseText);

	          if (response.hasOwnProperty('message')) {
	            var errorMessage = response.message;
	            Helpers.invokeAliasCallback(callback, xhr.status, errorMessage);
	            return;
	          }
	        }
	      }

	      Helpers.invokeAliasCallback(callback, xhr.status);
	    }
	  };

	  mParticle.Logger.verbose(Messages$3.InformationMessages.SendAliasHttp);
	  xhr = Helpers.createXHR(xhrCallback);

	  if (xhr) {
	    try {
	      xhr.open('post', Helpers.createServiceUrl(mParticle.Store.SDKConfig.aliasUrl, mParticle.Store.devToken) + '/Alias');
	      xhr.send(JSON.stringify(aliasRequest));
	    } catch (e) {
	      Helpers.invokeAliasCallback(callback, HTTPCodes.noHttpCoverage, e);
	      mParticle.Logger.error('Error sending alias request to mParticle servers. ' + e);
	    }
	  }
	}

	function sendIdentityRequest(identityApiRequest, method, callback, originalIdentityApiData, parseIdentityResponse, mpid) {
	  var xhr,
	      previousMPID,
	      xhrCallback = function xhrCallback() {
	    if (xhr.readyState === 4) {
	      mParticle.Logger.verbose('Received ' + xhr.statusText + ' from server');
	      parseIdentityResponse(xhr, previousMPID, callback, originalIdentityApiData, method);
	    }
	  };

	  mParticle.Logger.verbose(Messages$3.InformationMessages.SendIdentityBegin);

	  if (!identityApiRequest) {
	    mParticle.Logger.error(Messages$3.ErrorMessages.APIRequestEmpty);
	    return;
	  }

	  mParticle.Logger.verbose(Messages$3.InformationMessages.SendIdentityHttp);
	  xhr = Helpers.createXHR(xhrCallback);

	  if (xhr) {
	    try {
	      if (mParticle.Store.identityCallInFlight) {
	        Helpers.invokeCallback(callback, HTTPCodes.activeIdentityRequest, 'There is currently an Identity request processing. Please wait for this to return before requesting again');
	      } else {
	        previousMPID = mpid || null;

	        if (method === 'modify') {
	          xhr.open('post', Helpers.createServiceUrl(mParticle.Store.SDKConfig.identityUrl) + mpid + '/' + method);
	        } else {
	          xhr.open('post', Helpers.createServiceUrl(mParticle.Store.SDKConfig.identityUrl) + method);
	        }

	        xhr.setRequestHeader('Content-Type', 'application/json');
	        xhr.setRequestHeader('x-mp-key', mParticle.Store.devToken);
	        mParticle.Store.identityCallInFlight = true;
	        xhr.send(JSON.stringify(identityApiRequest));
	      }
	    } catch (e) {
	      mParticle.Store.identityCallInFlight = false;
	      Helpers.invokeCallback(callback, HTTPCodes.noHttpCoverage, e);
	      mParticle.Logger.error('Error sending identity request to servers with status code ' + xhr.status + ' - ' + e);
	    }
	  }
	}

	function sendBatchForwardingStatsToServer(forwardingStatsData, xhr) {
	  var url, data;

	  try {
	    url = Helpers.createServiceUrl(mParticle.Store.SDKConfig.v2SecureServiceUrl, mParticle.Store.devToken);
	    data = {
	      uuid: Helpers.generateUniqueId(),
	      data: forwardingStatsData
	    };

	    if (xhr) {
	      xhr.open('post', url + '/Forwarding');
	      xhr.send(JSON.stringify(data));
	    }
	  } catch (e) {
	    mParticle.Logger.error('Error sending forwarding stats to mParticle servers.');
	  }
	}

	function sendSingleForwardingStatsToServer(forwardingStatsData) {
	  var url, data;

	  try {
	    var xhrCallback = function xhrCallback() {
	      if (xhr.readyState === 4) {
	        if (xhr.status === 202) {
	          mParticle.Logger.verbose('Successfully sent  ' + xhr.statusText + ' from server');
	        }
	      }
	    };

	    var xhr = Helpers.createXHR(xhrCallback);
	    url = Helpers.createServiceUrl(mParticle.Store.SDKConfig.v1SecureServiceUrl, mParticle.Store.devToken);
	    data = forwardingStatsData;

	    if (xhr) {
	      xhr.open('post', url + '/Forwarding');
	      xhr.send(JSON.stringify(data));
	    }
	  } catch (e) {
	    mParticle.Logger.error('Error sending forwarding stats to mParticle servers.');
	  }
	}

	function getSDKConfiguration(apiKey, config, completeSDKInitialization) {
	  var url;

	  try {
	    var xhrCallback = function xhrCallback() {
	      if (xhr.readyState === 4) {
	        // when a 200 returns, merge current config with what comes back from config, prioritizing user inputted config
	        if (xhr.status === 200) {
	          config = Helpers.extend({}, config, JSON.parse(xhr.responseText));
	          completeSDKInitialization(apiKey, config);
	          mParticle.Logger.verbose('Successfully received configuration from server');
	        } else {
	          // if for some reason a 200 doesn't return, then we initialize with the just the passed through config
	          completeSDKInitialization(apiKey, config);
	          mParticle.Logger.verbose('Issue with receiving configuration from server, received HTTP Code of ' + xhr.status);
	        }
	      }
	    };

	    var xhr = Helpers.createXHR(xhrCallback);
	    url = 'https://' + mParticle.Store.SDKConfig.configUrl + apiKey + '/config?env=';

	    if (config.isDevelopmentMode) {
	      url = url + '1';
	    } else {
	      url = url + '0';
	    }

	    if (xhr) {
	      xhr.open('get', url);
	      xhr.send(null);
	    }
	  } catch (e) {
	    completeSDKInitialization(apiKey, config);
	    mParticle.Logger.error('Error getting forwarder configuration from mParticle servers.');
	  }
	}

	function prepareForwardingStats(forwarder, event) {
	  var forwardingStatsData,
	      queue = Forwarders.getForwarderStatsQueue();

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
	      eec: event.ExpandedEventCount
	    };

	    if (Helpers.getFeatureFlag(Constants.FeatureFlags.ReportBatching)) {
	      queue.push(forwardingStatsData);
	      Forwarders.setForwarderStatsQueue(queue);
	    } else {
	      sendSingleForwardingStatsToServer(forwardingStatsData);
	    }
	  }
	}

	var ApiClient = {
	  sendEventToServer: sendEventToServer,
	  sendIdentityRequest: sendIdentityRequest,
	  sendBatchForwardingStatsToServer: sendBatchForwardingStatsToServer,
	  sendSingleForwardingStatsToServer: sendSingleForwardingStatsToServer,
	  sendAliasRequest: sendAliasRequest,
	  getSDKConfiguration: getSDKConfiguration,
	  prepareForwardingStats: prepareForwardingStats,
	  processQueuedEvents: processQueuedEvents,
	  appendUserInfoToEvents: appendUserInfoToEvents,
	  shouldEnableBatching: shouldEnableBatching
	};

	var Validators$1 = Helpers.Validators,
	    Messages$4 = Constants.Messages;

	function convertTransactionAttributesToProductAction(transactionAttributes, productAction) {
	  productAction.TransactionId = transactionAttributes.Id;
	  productAction.Affiliation = transactionAttributes.Affiliation;
	  productAction.CouponCode = transactionAttributes.CouponCode;
	  productAction.TotalAmount = transactionAttributes.Revenue;
	  productAction.ShippingAmount = transactionAttributes.Shipping;
	  productAction.TaxAmount = transactionAttributes.Tax;
	}

	function getProductActionEventName(productActionType) {
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
	}

	function getPromotionActionEventName(promotionActionType) {
	  switch (promotionActionType) {
	    case Types.PromotionActionType.PromotionClick:
	      return 'PromotionClick';

	    case Types.PromotionActionType.PromotionView:
	      return 'PromotionView';

	    default:
	      return 'Unknown';
	  }
	}

	function convertProductActionToEventType(productActionType) {
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
	      mParticle.Logger.error('Could not convert product action type ' + productActionType + ' to event type');
	      return null;
	  }
	}

	function convertPromotionActionToEventType(promotionActionType) {
	  switch (promotionActionType) {
	    case Types.PromotionActionType.PromotionClick:
	      return Types.CommerceEventType.PromotionClick;

	    case Types.PromotionActionType.PromotionView:
	      return Types.CommerceEventType.PromotionView;

	    default:
	      mParticle.Logger.error('Could not convert promotion action type ' + promotionActionType + ' to event type');
	      return null;
	  }
	}

	function generateExpandedEcommerceName(eventName, plusOne) {
	  return 'eCommerce - ' + eventName + ' - ' + (plusOne ? 'Total' : 'Item');
	}

	function extractProductAttributes(attributes, product) {
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
	}

	function extractTransactionId(attributes, productAction) {
	  if (productAction.TransactionId) {
	    attributes['Transaction Id'] = productAction.TransactionId;
	  }
	}

	function extractActionAttributes(attributes, productAction) {
	  extractTransactionId(attributes, productAction);

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
	}

	function extractPromotionAttributes(attributes, promotion) {
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
	}

	function buildProductList(event, product) {
	  if (product) {
	    if (Array.isArray(product)) {
	      return product;
	    }

	    return [product];
	  }

	  return event.ShoppingCart.ProductList;
	}

	function createProduct(name, sku, price, quantity, variant, category, brand, position, couponCode, attributes) {
	  attributes = Helpers.sanitizeAttributes(attributes);

	  if (typeof name !== 'string') {
	    mParticle.Logger.error('Name is required when creating a product');
	    return null;
	  }

	  if (!Validators$1.isStringOrNumber(sku)) {
	    mParticle.Logger.error('SKU is required when creating a product, and must be a string or a number');
	    return null;
	  }

	  if (!Validators$1.isStringOrNumber(price)) {
	    mParticle.Logger.error('Price is required when creating a product, and must be a string or a number');
	    return null;
	  }

	  if (position && !Validators$1.isNumber(position)) {
	    mParticle.Logger.error('Position must be a number, it will be set to null.');
	    position = null;
	  }

	  if (!quantity) {
	    quantity = 1;
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
	}

	function createPromotion(id, creative, name, position) {
	  if (!Validators$1.isStringOrNumber(id)) {
	    mParticle.Logger.error(Messages$4.ErrorMessages.PromotionIdRequired);
	    return null;
	  }

	  return {
	    Id: id,
	    Creative: creative,
	    Name: name,
	    Position: position
	  };
	}

	function createImpression(name, product) {
	  if (typeof name !== 'string') {
	    mParticle.Logger.error('Name is required when creating an impression.');
	    return null;
	  }

	  if (!product) {
	    mParticle.Logger.error('Product is required when creating an impression.');
	    return null;
	  }

	  return {
	    Name: name,
	    Product: product
	  };
	}

	function createTransactionAttributes(id, affiliation, couponCode, revenue, shipping, tax) {
	  if (!Validators$1.isStringOrNumber(id)) {
	    mParticle.Logger.error(Messages$4.ErrorMessages.TransactionIdRequired);
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
	}

	function expandProductImpression(commerceEvent) {
	  var appEvents = [];

	  if (!commerceEvent.ProductImpressions) {
	    return appEvents;
	  }

	  commerceEvent.ProductImpressions.forEach(function (productImpression) {
	    if (productImpression.ProductList) {
	      productImpression.ProductList.forEach(function (product) {
	        var attributes = Helpers.extend(false, {}, commerceEvent.EventAttributes);

	        if (product.Attributes) {
	          for (var attribute in product.Attributes) {
	            attributes[attribute] = product.Attributes[attribute];
	          }
	        }

	        extractProductAttributes(attributes, product);

	        if (productImpression.ProductImpressionList) {
	          attributes['Product Impression List'] = productImpression.ProductImpressionList;
	        }

	        var appEvent = ServerModel.createEventObject({
	          messageType: Types.MessageType.PageEvent,
	          name: generateExpandedEcommerceName('Impression'),
	          data: attributes,
	          eventType: Types.EventType.Transaction
	        });
	        appEvents.push(appEvent);
	      });
	    }
	  });
	  return appEvents;
	}

	function expandCommerceEvent(event) {
	  if (!event) {
	    return null;
	  }

	  return expandProductAction(event).concat(expandPromotionAction(event)).concat(expandProductImpression(event));
	}

	function expandPromotionAction(commerceEvent) {
	  var appEvents = [];

	  if (!commerceEvent.PromotionAction) {
	    return appEvents;
	  }

	  var promotions = commerceEvent.PromotionAction.PromotionList;
	  promotions.forEach(function (promotion) {
	    var attributes = Helpers.extend(false, {}, commerceEvent.EventAttributes);
	    extractPromotionAttributes(attributes, promotion);
	    var appEvent = ServerModel.createEventObject({
	      messageType: Types.MessageType.PageEvent,
	      name: generateExpandedEcommerceName(Types.PromotionActionType.getExpansionName(commerceEvent.PromotionAction.PromotionActionType)),
	      data: attributes,
	      eventType: Types.EventType.Transaction
	    });
	    appEvents.push(appEvent);
	  });
	  return appEvents;
	}

	function expandProductAction(commerceEvent) {
	  var appEvents = [];

	  if (!commerceEvent.ProductAction) {
	    return appEvents;
	  }

	  var shouldExtractActionAttributes = false;

	  if (commerceEvent.ProductAction.ProductActionType === Types.ProductActionType.Purchase || commerceEvent.ProductAction.ProductActionType === Types.ProductActionType.Refund) {
	    var attributes = Helpers.extend(false, {}, commerceEvent.EventAttributes);
	    attributes['Product Count'] = commerceEvent.ProductAction.ProductList ? commerceEvent.ProductAction.ProductList.length : 0;
	    extractActionAttributes(attributes, commerceEvent.ProductAction);

	    if (commerceEvent.CurrencyCode) {
	      attributes['Currency Code'] = commerceEvent.CurrencyCode;
	    }

	    var plusOneEvent = ServerModel.createEventObject({
	      messageType: Types.MessageType.PageEvent,
	      name: generateExpandedEcommerceName(Types.ProductActionType.getExpansionName(commerceEvent.ProductAction.ProductActionType), true),
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
	    var attributes = Helpers.extend(false, commerceEvent.EventAttributes, product.Attributes);

	    if (shouldExtractActionAttributes) {
	      extractActionAttributes(attributes, commerceEvent.ProductAction);
	    } else {
	      extractTransactionId(attributes, commerceEvent.ProductAction);
	    }

	    extractProductAttributes(attributes, product);
	    var productEvent = ServerModel.createEventObject({
	      messageType: Types.MessageType.PageEvent,
	      name: generateExpandedEcommerceName(Types.ProductActionType.getExpansionName(commerceEvent.ProductAction.ProductActionType)),
	      data: attributes,
	      eventType: Types.EventType.Transaction
	    });
	    appEvents.push(productEvent);
	  });
	  return appEvents;
	}

	function createCommerceEventObject(customFlags) {
	  var baseEvent,
	      currentUser = mParticle.Identity.getCurrentUser();
	  mParticle.Logger.verbose(Messages$4.InformationMessages.StartingLogCommerceEvent);

	  if (Helpers.canLog()) {
	    baseEvent = ServerModel.createEventObject({
	      messageType: Types.MessageType.Commerce
	    });
	    baseEvent.EventName = 'eCommerce - ';
	    baseEvent.CurrencyCode = mParticle.Store.currencyCode;
	    baseEvent.ShoppingCart = {
	      ProductList: currentUser ? currentUser.getCart().getCartProducts() : []
	    };
	    baseEvent.CustomFlags = customFlags;
	    return baseEvent;
	  } else {
	    mParticle.Logger.verbose(Messages$4.InformationMessages.AbandonLogEvent);
	  }

	  return null;
	}

	var Ecommerce = {
	  convertTransactionAttributesToProductAction: convertTransactionAttributesToProductAction,
	  getProductActionEventName: getProductActionEventName,
	  getPromotionActionEventName: getPromotionActionEventName,
	  convertProductActionToEventType: convertProductActionToEventType,
	  convertPromotionActionToEventType: convertPromotionActionToEventType,
	  buildProductList: buildProductList,
	  createProduct: createProduct,
	  createPromotion: createPromotion,
	  createImpression: createImpression,
	  createTransactionAttributes: createTransactionAttributes,
	  expandCommerceEvent: expandCommerceEvent,
	  createCommerceEventObject: createCommerceEventObject
	};

	var Messages$5 = Constants.Messages,
	    sendEventToServer$1 = ApiClient.sendEventToServer;

	function logEvent(event) {
	  mParticle.Logger.verbose(Messages$5.InformationMessages.StartingLogEvent + ': ' + event.name);

	  if (Helpers.canLog()) {
	    if (event.data) {
	      event.data = Helpers.sanitizeAttributes(event.data);
	    }

	    var uploadObject = ServerModel.createEventObject(event);
	    sendEventToServer$1(uploadObject);
	    Persistence.update();
	  } else {
	    mParticle.Logger.verbose(Messages$5.InformationMessages.AbandonLogEvent);
	  }
	}

	function startTracking(callback) {
	  if (!mParticle.Store.isTracking) {
	    if ('geolocation' in navigator) {
	      mParticle.Store.watchPositionId = navigator.geolocation.watchPosition(successTracking, errorTracking);
	    }
	  } else {
	    var position = {
	      coords: {
	        latitude: mParticle.Store.currentPosition.lat,
	        longitude: mParticle.Store.currentPosition.lng
	      }
	    };
	    triggerCallback(callback, position);
	  }

	  function successTracking(position) {
	    mParticle.Store.currentPosition = {
	      lat: position.coords.latitude,
	      lng: position.coords.longitude
	    };
	    triggerCallback(callback, position); // prevents callback from being fired multiple times

	    callback = null;
	    mParticle.Store.isTracking = true;
	  }

	  function errorTracking() {
	    triggerCallback(callback); // prevents callback from being fired multiple times

	    callback = null;
	    mParticle.Store.isTracking = false;
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
	        mParticle.Logger.error('Error invoking the callback passed to startTrackingLocation.');
	        mParticle.Logger.error(e);
	      }
	    }
	  }
	}

	function stopTracking() {
	  if (mParticle.Store.isTracking) {
	    navigator.geolocation.clearWatch(mParticle.Store.watchPositionId);
	    mParticle.Store.currentPosition = null;
	    mParticle.Store.isTracking = false;
	  }
	}

	function logOptOut() {
	  mParticle.Logger.verbose(Messages$5.InformationMessages.StartingLogOptOut);
	  var event = ServerModel.createEventObject({
	    messageType: Types.MessageType.OptOut,
	    eventType: Types.EventType.Other
	  });
	  sendEventToServer$1(event);
	}

	function logAST() {
	  logEvent({
	    messageType: Types.MessageType.AppStateTransition
	  });
	}

	function logCheckoutEvent(step, options, attrs, customFlags) {
	  var event = Ecommerce.createCommerceEventObject(customFlags);

	  if (event) {
	    event.EventName += Ecommerce.getProductActionEventName(Types.ProductActionType.Checkout);
	    event.EventCategory = Types.CommerceEventType.ProductCheckout;
	    event.ProductAction = {
	      ProductActionType: Types.ProductActionType.Checkout,
	      CheckoutStep: step,
	      CheckoutOptions: options,
	      ProductList: event.ShoppingCart.ProductList
	    };
	    logCommerceEvent(event, attrs);
	  }
	}

	function logProductActionEvent(productActionType, product, attrs, customFlags) {
	  var event = Ecommerce.createCommerceEventObject(customFlags);

	  if (event) {
	    event.EventCategory = Ecommerce.convertProductActionToEventType(productActionType);
	    event.EventName += Ecommerce.getProductActionEventName(productActionType);
	    event.ProductAction = {
	      ProductActionType: productActionType,
	      ProductList: Array.isArray(product) ? product : [product]
	    };
	    logCommerceEvent(event, attrs);
	  }
	}

	function logPurchaseEvent(transactionAttributes, product, attrs, customFlags) {
	  var event = Ecommerce.createCommerceEventObject(customFlags);

	  if (event) {
	    event.EventName += Ecommerce.getProductActionEventName(Types.ProductActionType.Purchase);
	    event.EventCategory = Types.CommerceEventType.ProductPurchase;
	    event.ProductAction = {
	      ProductActionType: Types.ProductActionType.Purchase
	    };
	    event.ProductAction.ProductList = Ecommerce.buildProductList(event, product);
	    Ecommerce.convertTransactionAttributesToProductAction(transactionAttributes, event.ProductAction);
	    logCommerceEvent(event, attrs);
	  }
	}

	function logRefundEvent(transactionAttributes, product, attrs, customFlags) {
	  if (!transactionAttributes) {
	    mParticle.Logger.error(Messages$5.ErrorMessages.TransactionRequired);
	    return;
	  }

	  var event = Ecommerce.createCommerceEventObject(customFlags);

	  if (event) {
	    event.EventName += Ecommerce.getProductActionEventName(Types.ProductActionType.Refund);
	    event.EventCategory = Types.CommerceEventType.ProductRefund;
	    event.ProductAction = {
	      ProductActionType: Types.ProductActionType.Refund
	    };
	    event.ProductAction.ProductList = Ecommerce.buildProductList(event, product);
	    Ecommerce.convertTransactionAttributesToProductAction(transactionAttributes, event.ProductAction);
	    logCommerceEvent(event, attrs);
	  }
	}

	function logPromotionEvent(promotionType, promotion, attrs, customFlags) {
	  var event = Ecommerce.createCommerceEventObject(customFlags);

	  if (event) {
	    event.EventName += Ecommerce.getPromotionActionEventName(promotionType);
	    event.EventCategory = Ecommerce.convertPromotionActionToEventType(promotionType);
	    event.PromotionAction = {
	      PromotionActionType: promotionType,
	      PromotionList: [promotion]
	    };
	    logCommerceEvent(event, attrs);
	  }
	}

	function logImpressionEvent(impression, attrs, customFlags) {
	  var event = Ecommerce.createCommerceEventObject(customFlags);

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
	    logCommerceEvent(event, attrs);
	  }
	}

	function logCommerceEvent(commerceEvent, attrs) {
	  mParticle.Logger.verbose(Messages$5.InformationMessages.StartingLogCommerceEvent);
	  attrs = Helpers.sanitizeAttributes(attrs);

	  if (Helpers.canLog()) {
	    if (mParticle.Store.webviewBridgeEnabled) {
	      // Don't send shopping cart to parent sdks
	      commerceEvent.ShoppingCart = {};
	    }

	    if (attrs) {
	      commerceEvent.EventAttributes = attrs;
	    }

	    sendEventToServer$1(commerceEvent);
	    Persistence.update();
	  } else {
	    mParticle.Logger.verbose(Messages$5.InformationMessages.AbandonLogEvent);
	  }
	}

	function addEventHandler(domEvent, selector, eventName, data, eventType) {
	  var elements = [],
	      handler = function handler(e) {
	    var timeoutHandler = function timeoutHandler() {
	      if (element.href) {
	        window.location.href = element.href;
	      } else if (element.submit) {
	        element.submit();
	      }
	    };

	    mParticle.Logger.verbose('DOM event triggered, handling event');
	    logEvent({
	      messageType: Types.MessageType.PageEvent,
	      name: typeof eventName === 'function' ? eventName(element) : eventName,
	      data: typeof data === 'function' ? data(element) : data,
	      eventType: eventType || Types.EventType.Other
	    }); // TODO: Handle middle-clicks and special keys (ctrl, alt, etc)

	    if (element.href && element.target !== '_blank' || element.submit) {
	      // Give xmlhttprequest enough time to execute before navigating a link or submitting form
	      if (e.preventDefault) {
	        e.preventDefault();
	      } else {
	        e.returnValue = false;
	      }

	      setTimeout(timeoutHandler, mParticle.Store.SDKConfig.timeout);
	    }
	  },
	      element,
	      i;

	  if (!selector) {
	    mParticle.Logger.error("Can't bind event, selector is required");
	    return;
	  } // Handle a css selector string or a dom element


	  if (typeof selector === 'string') {
	    elements = document.querySelectorAll(selector);
	  } else if (selector.nodeType) {
	    elements = [selector];
	  }

	  if (elements.length) {
	    mParticle.Logger.verbose('Found ' + elements.length + ' element' + (elements.length > 1 ? 's' : '') + ', attaching event handlers');

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
	    mParticle.Logger.verbose('No elements found');
	  }
	}

	var Events = {
	  logEvent: logEvent,
	  startTracking: startTracking,
	  stopTracking: stopTracking,
	  logCheckoutEvent: logCheckoutEvent,
	  logProductActionEvent: logProductActionEvent,
	  logPurchaseEvent: logPurchaseEvent,
	  logRefundEvent: logRefundEvent,
	  logPromotionEvent: logPromotionEvent,
	  logImpressionEvent: logImpressionEvent,
	  logOptOut: logOptOut,
	  logAST: logAST,
	  addEventHandler: addEventHandler
	};

	var Messages$6 = Constants.Messages,
	    Validators$2 = Helpers.Validators,
	    HTTPCodes$1 = Constants.HTTPCodes,
	    sendIdentityRequest$1 = ApiClient.sendIdentityRequest,
	    sendEventToServer$2 = ApiClient.sendEventToServer;

	function checkIdentitySwap(previousMPID, currentMPID, currentSessionMPIDs) {
	  if (previousMPID && currentMPID && previousMPID !== currentMPID) {
	    var cookies = Persistence.useLocalStorage() ? Persistence.getLocalStorage() : Persistence.getCookie();
	    cookies.cu = currentMPID;
	    cookies.gs.csm = currentSessionMPIDs;
	    Persistence.saveCookies(cookies);
	  }
	}

	var IdentityRequest = {
	  createKnownIdentities: function createKnownIdentities(identityApiData, deviceId) {
	    var identitiesResult = {};

	    if (identityApiData && identityApiData.userIdentities && Helpers.isObject(identityApiData.userIdentities)) {
	      for (var identity in identityApiData.userIdentities) {
	        identitiesResult[identity] = identityApiData.userIdentities[identity];
	      }
	    }

	    identitiesResult.device_application_stamp = deviceId;
	    return identitiesResult;
	  },
	  preProcessIdentityRequest: function preProcessIdentityRequest(identityApiData, callback, method) {
	    mParticle.Logger.verbose(Messages$6.InformationMessages.StartingLogEvent + ': ' + method);
	    var identityValidationResult = Validators$2.validateIdentities(identityApiData, method);

	    if (!identityValidationResult.valid) {
	      mParticle.Logger.error('ERROR: ' + identityValidationResult.error);
	      return {
	        valid: false,
	        error: identityValidationResult.error
	      };
	    }

	    if (callback && !Validators$2.isFunction(callback)) {
	      var error = 'The optional callback must be a function. You tried entering a(n) ' + _typeof_1(callback);

	      mParticle.Logger.error(error);
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
	      environment: mParticle.Store.SDKConfig.isDevelopmentMode ? 'development' : 'production',
	      request_id: Helpers.generateUniqueId(),
	      request_timestamp_ms: new Date().getTime(),
	      previous_mpid: mpid || null,
	      known_identities: this.createKnownIdentities(identityApiData, deviceId)
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
	      environment: mParticle.Store.SDKConfig.isDevelopmentMode ? 'development' : 'production',
	      request_id: Helpers.generateUniqueId(),
	      request_timestamp_ms: new Date().getTime(),
	      identity_changes: this.createIdentityChanges(currentUserIdentities, newUserIdentities)
	    };
	  },
	  createIdentityChanges: function createIdentityChanges(previousIdentities, newIdentities) {
	    var identityChanges = [];
	    var key;

	    if (newIdentities && Helpers.isObject(newIdentities) && previousIdentities && Helpers.isObject(previousIdentities)) {
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
	  modifyUserIdentities: function modifyUserIdentities(previousUserIdentities, newUserIdentities) {
	    var modifiedUserIdentities = {};

	    for (var key in newUserIdentities) {
	      modifiedUserIdentities[Types.IdentityType.getIdentityType(key)] = newUserIdentities[key];
	    }

	    for (key in previousUserIdentities) {
	      if (!modifiedUserIdentities[key]) {
	        modifiedUserIdentities[key] = previousUserIdentities[key];
	      }
	    }

	    return modifiedUserIdentities;
	  },
	  createAliasNetworkRequest: function createAliasNetworkRequest(aliasRequest) {
	    return {
	      request_id: Helpers.generateUniqueId(),
	      request_type: 'alias',
	      environment: mParticle.Store.SDKConfig.isDevelopmentMode ? 'development' : 'production',
	      api_key: mParticle.Store.devToken,
	      data: {
	        destination_mpid: aliasRequest.destinationMpid,
	        source_mpid: aliasRequest.sourceMpid,
	        start_unixtime_ms: aliasRequest.startTime,
	        end_unixtime_ms: aliasRequest.endTime,
	        device_application_stamp: mParticle.Store.deviceId
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

	var IdentityAPI = {
	  HTTPCodes: HTTPCodes$1,

	  /**
	   * Initiate a logout request to the mParticle server
	   * @method identify
	   * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
	   * @param {Function} [callback] A callback function that is called when the identify request completes
	   */
	  identify: function identify(identityApiData, callback) {
	    var mpid,
	        currentUser = mParticle.Identity.getCurrentUser(),
	        preProcessResult = IdentityRequest.preProcessIdentityRequest(identityApiData, callback, 'identify');

	    if (currentUser) {
	      mpid = currentUser.getMPID();
	    }

	    if (preProcessResult.valid) {
	      var identityApiRequest = IdentityRequest.createIdentityRequest(identityApiData, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, mParticle.Store.deviceId, mParticle.Store.context, mpid);

	      if (Helpers.canLog()) {
	        if (mParticle.Store.webviewBridgeEnabled) {
	          NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Identify, JSON.stringify(IdentityRequest.convertToNative(identityApiData)));
	          Helpers.invokeCallback(callback, HTTPCodes$1.nativeIdentityRequest, 'Identify request sent to native sdk');
	        } else {
	          sendIdentityRequest$1(identityApiRequest, 'identify', callback, identityApiData, parseIdentityResponse, mpid);
	        }
	      } else {
	        Helpers.invokeCallback(callback, HTTPCodes$1.loggingDisabledOrMissingAPIKey, Messages$6.InformationMessages.AbandonLogEvent);
	        mParticle.Logger.verbose(Messages$6.InformationMessages.AbandonLogEvent);
	      }
	    } else {
	      Helpers.invokeCallback(callback, HTTPCodes$1.validationIssue, preProcessResult.error);
	      mParticle.Logger.verbose(preProcessResult);
	    }
	  },

	  /**
	   * Initiate a logout request to the mParticle server
	   * @method logout
	   * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
	   * @param {Function} [callback] A callback function that is called when the logout request completes
	   */
	  logout: function logout(identityApiData, callback) {
	    var mpid,
	        currentUser = mParticle.Identity.getCurrentUser(),
	        preProcessResult = IdentityRequest.preProcessIdentityRequest(identityApiData, callback, 'logout');

	    if (currentUser) {
	      mpid = currentUser.getMPID();
	    }

	    if (preProcessResult.valid) {
	      var evt,
	          identityApiRequest = IdentityRequest.createIdentityRequest(identityApiData, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, mParticle.Store.deviceId, mParticle.Store.context, mpid);

	      if (Helpers.canLog()) {
	        if (mParticle.Store.webviewBridgeEnabled) {
	          NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Logout, JSON.stringify(IdentityRequest.convertToNative(identityApiData)));
	          Helpers.invokeCallback(callback, HTTPCodes$1.nativeIdentityRequest, 'Logout request sent to native sdk');
	        } else {
	          sendIdentityRequest$1(identityApiRequest, 'logout', callback, identityApiData, parseIdentityResponse, mpid);
	          evt = ServerModel.createEventObject({
	            messageType: Types.MessageType.Profile
	          });
	          evt.ProfileMessageType = Types.ProfileMessageType.Logout;

	          if (mParticle.Store.activeForwarders.length) {
	            mParticle.Store.activeForwarders.forEach(function (forwarder) {
	              if (forwarder.logOut) {
	                forwarder.logOut(evt);
	              }
	            });
	          }
	        }
	      } else {
	        Helpers.invokeCallback(callback, HTTPCodes$1.loggingDisabledOrMissingAPIKey, Messages$6.InformationMessages.AbandonLogEvent);
	        mParticle.Logger.verbose(Messages$6.InformationMessages.AbandonLogEvent);
	      }
	    } else {
	      Helpers.invokeCallback(callback, HTTPCodes$1.validationIssue, preProcessResult.error);
	      mParticle.Logger.verbose(preProcessResult);
	    }
	  },

	  /**
	   * Initiate a login request to the mParticle server
	   * @method login
	   * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
	   * @param {Function} [callback] A callback function that is called when the login request completes
	   */
	  login: function login(identityApiData, callback) {
	    var mpid,
	        currentUser = mParticle.Identity.getCurrentUser(),
	        preProcessResult = IdentityRequest.preProcessIdentityRequest(identityApiData, callback, 'login');

	    if (currentUser) {
	      mpid = currentUser.getMPID();
	    }

	    if (preProcessResult.valid) {
	      var identityApiRequest = IdentityRequest.createIdentityRequest(identityApiData, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, mParticle.Store.deviceId, mParticle.Store.context, mpid);

	      if (Helpers.canLog()) {
	        if (mParticle.Store.webviewBridgeEnabled) {
	          NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Login, JSON.stringify(IdentityRequest.convertToNative(identityApiData)));
	          Helpers.invokeCallback(callback, HTTPCodes$1.nativeIdentityRequest, 'Login request sent to native sdk');
	        } else {
	          sendIdentityRequest$1(identityApiRequest, 'login', callback, identityApiData, parseIdentityResponse, mpid);
	        }
	      } else {
	        Helpers.invokeCallback(callback, HTTPCodes$1.loggingDisabledOrMissingAPIKey, Messages$6.InformationMessages.AbandonLogEvent);
	        mParticle.Logger.verbose(Messages$6.InformationMessages.AbandonLogEvent);
	      }
	    } else {
	      Helpers.invokeCallback(callback, HTTPCodes$1.validationIssue, preProcessResult.error);
	      mParticle.Logger.verbose(preProcessResult);
	    }
	  },

	  /**
	   * Initiate a modify request to the mParticle server
	   * @method modify
	   * @param {Object} identityApiData The identityApiData object as indicated [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/README.md#1-customize-the-sdk)
	   * @param {Function} [callback] A callback function that is called when the modify request completes
	   */
	  modify: function modify(identityApiData, callback) {
	    var mpid,
	        currentUser = mParticle.Identity.getCurrentUser(),
	        preProcessResult = IdentityRequest.preProcessIdentityRequest(identityApiData, callback, 'modify');

	    if (currentUser) {
	      mpid = currentUser.getMPID();
	    }

	    var newUserIdentities = identityApiData && identityApiData.userIdentities ? identityApiData.userIdentities : {};

	    if (preProcessResult.valid) {
	      var identityApiRequest = IdentityRequest.createModifyIdentityRequest(currentUser ? currentUser.getUserIdentities().userIdentities : {}, newUserIdentities, Constants.platform, Constants.sdkVendor, Constants.sdkVersion, mParticle.Store.context);

	      if (Helpers.canLog()) {
	        if (mParticle.Store.webviewBridgeEnabled) {
	          NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Modify, JSON.stringify(IdentityRequest.convertToNative(identityApiData)));
	          Helpers.invokeCallback(callback, HTTPCodes$1.nativeIdentityRequest, 'Modify request sent to native sdk');
	        } else {
	          sendIdentityRequest$1(identityApiRequest, 'modify', callback, identityApiData, parseIdentityResponse, mpid);
	        }
	      } else {
	        Helpers.invokeCallback(callback, HTTPCodes$1.loggingDisabledOrMissingAPIKey, Messages$6.InformationMessages.AbandonLogEvent);
	        mParticle.Logger.verbose(Messages$6.InformationMessages.AbandonLogEvent);
	      }
	    } else {
	      Helpers.invokeCallback(callback, HTTPCodes$1.validationIssue, preProcessResult.error);
	      mParticle.Logger.verbose(preProcessResult);
	    }
	  },

	  /**
	   * Returns a user object with methods to interact with the current user
	   * @method getCurrentUser
	   * @return {Object} the current user object
	   */
	  getCurrentUser: function getCurrentUser() {
	    var mpid = mParticle.Store.mpid;

	    if (mpid) {
	      mpid = mParticle.Store.mpid.slice();
	      return mParticleUser(mpid, mParticle.Store.isLoggedIn);
	    } else if (mParticle.Store.webviewBridgeEnabled) {
	      return mParticleUser();
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
	    var cookies = Persistence.getPersistence();

	    if (cookies) {
	      if (cookies[mpid] && !Constants.SDKv2NonMPIDCookieKeys.hasOwnProperty(mpid)) {
	        return mParticleUser(mpid);
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
	    var cookies = Persistence.getPersistence();
	    var users = [];

	    if (cookies) {
	      for (var key in cookies) {
	        if (!Constants.SDKv2NonMPIDCookieKeys.hasOwnProperty(key)) {
	          users.push(mParticleUser(key));
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
	      message = Messages$6.ValidationMessages.AliasMissingMpid;
	    }

	    if (aliasRequest.destinationMpid === aliasRequest.sourceMpid) {
	      message = Messages$6.ValidationMessages.AliasNonUniqueMpid;
	    }

	    if (!aliasRequest.startTime || !aliasRequest.endTime) {
	      message = Messages$6.ValidationMessages.AliasMissingTime;
	    }

	    if (aliasRequest.startTime > aliasRequest.endTime) {
	      message = Messages$6.ValidationMessages.AliasStartBeforeEndTime;
	    }

	    if (message) {
	      mParticle.Logger.warning(message);
	      Helpers.invokeAliasCallback(callback, HTTPCodes$1.validationIssue, message);
	      return;
	    }

	    if (Helpers.canLog()) {
	      if (mParticle.Store.webviewBridgeEnabled) {
	        NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.Alias, JSON.stringify(IdentityRequest.convertAliasToNative(aliasRequest)));
	        Helpers.invokeAliasCallback(callback, HTTPCodes$1.nativeIdentityRequest, 'Alias request sent to native sdk');
	      } else {
	        mParticle.Logger.verbose(Messages$6.InformationMessages.StartingAliasRequest + ': ' + aliasRequest.sourceMpid + ' -> ' + aliasRequest.destinationMpid);
	        var aliasRequestMessage = IdentityRequest.createAliasNetworkRequest(aliasRequest);
	        ApiClient.sendAliasRequest(aliasRequestMessage, callback);
	      }
	    } else {
	      Helpers.invokeAliasCallback(callback, HTTPCodes$1.loggingDisabledOrMissingAPIKey, Messages$6.InformationMessages.AbandonAliasUsers);
	      mParticle.Logger.verbose(Messages$6.InformationMessages.AbandonAliasUsers);
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
	        mParticle.Logger.error("'destinationUser' and 'sourceUser' must both be present");
	        return null;
	      }

	      var startTime = sourceUser.getFirstSeenTime();

	      if (!startTime) {
	        mParticle.Identity.getUsers().forEach(function (user) {
	          if (user.getFirstSeenTime() && (!startTime || user.getFirstSeenTime() < startTime)) {
	            startTime = user.getFirstSeenTime();
	          }
	        });
	      }

	      var minFirstSeenTimeMs = new Date().getTime() - mParticle.Store.SDKConfig.aliasMaxWindow * 24 * 60 * 60 * 1000;
	      var endTime = sourceUser.getLastSeenTime() || new Date().getTime(); //if the startTime is greater than $maxAliasWindow ago, adjust the startTime to the earliest allowed

	      if (startTime < minFirstSeenTimeMs) {
	        startTime = minFirstSeenTimeMs;

	        if (endTime < startTime) {
	          mParticle.Logger.warning('Source User has not been seen in the last ' + mParticle.Store.SDKConfig.maxAliasWindow + ' days, Alias Request will likely fail');
	        }
	      }

	      return {
	        destinationMpid: destinationUser.getMPID(),
	        sourceMpid: sourceUser.getMPID(),
	        startTime: startTime,
	        endTime: endTime
	      };
	    } catch (e) {
	      mParticle.Logger.error('There was a problem with creating an alias request: ' + e);
	      return null;
	    }
	  }
	};
	/**
	 * Invoke these methods on the mParticle.Identity.getCurrentUser() object.
	 * Example: mParticle.Identity.getCurrentUser().getAllUserAttributes()
	 * @class mParticle.Identity.getCurrentUser()
	 */

	function mParticleUser(mpid, _isLoggedIn) {
	  return {
	    /**
	     * Get user identities for current user
	     * @method getUserIdentities
	     * @return {Object} an object with userIdentities as its key
	     */
	    getUserIdentities: function getUserIdentities() {
	      var currentUserIdentities = {};
	      var identities = Persistence.getUserIdentities(mpid);

	      for (var identityType in identities) {
	        if (identities.hasOwnProperty(identityType)) {
	          currentUserIdentities[Types.IdentityType.getIdentityName(Helpers.parseNumber(identityType))] = identities[identityType];
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
	      if (!Validators$2.isValidKeyValue(tagName)) {
	        mParticle.Logger.error(Messages$6.ErrorMessages.BadKey);
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
	      if (!Validators$2.isValidKeyValue(tagName)) {
	        mParticle.Logger.error(Messages$6.ErrorMessages.BadKey);
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
	    setUserAttribute: function setUserAttribute(key, newValue) {
	      var cookies, userAttributes, previousUserAttributeValue, isNewAttribute;
	      mParticle.sessionManager.resetSessionTimer();

	      if (Helpers.canLog()) {
	        if (!Validators$2.isValidAttributeValue(newValue)) {
	          mParticle.Logger.error(Messages$6.ErrorMessages.BadAttribute);
	          return;
	        }

	        if (!Validators$2.isValidKeyValue(key)) {
	          mParticle.Logger.error(Messages$6.ErrorMessages.BadKey);
	          return;
	        }

	        if (mParticle.Store.webviewBridgeEnabled) {
	          NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetUserAttribute, JSON.stringify({
	            key: key,
	            value: newValue
	          }));
	        } else {
	          cookies = Persistence.getPersistence();
	          userAttributes = this.getAllUserAttributes();
	          var existingProp = Helpers.findKeyInObject(userAttributes, key);

	          if (existingProp) {
	            isNewAttribute = false;
	            previousUserAttributeValue = userAttributes[existingProp];
	            delete userAttributes[existingProp];
	          } else {
	            isNewAttribute = true;
	          }

	          sendUserAttributeChangeEvent(key, newValue, previousUserAttributeValue, isNewAttribute, false);
	          userAttributes[key] = newValue;

	          if (cookies && cookies[mpid]) {
	            cookies[mpid].ua = userAttributes;
	            Persistence.saveCookies(cookies, mpid);
	          }

	          Forwarders.initForwarders(IdentityAPI.getCurrentUser().getUserIdentities(), ApiClient.prepareForwardingStats);
	          Forwarders.callSetUserAttributeOnForwarders(key, newValue);
	        }
	      }
	    },

	    /**
	     * Set multiple user attributes
	     * @method setUserAttributes
	     * @param {Object} user attribute object with keys of the attribute type, and value of the attribute value
	     */
	    setUserAttributes: function setUserAttributes(userAttributes) {
	      mParticle.sessionManager.resetSessionTimer();

	      if (Helpers.isObject(userAttributes)) {
	        if (Helpers.canLog()) {
	          for (var key in userAttributes) {
	            if (userAttributes.hasOwnProperty(key)) {
	              this.setUserAttribute(key, userAttributes[key]);
	            }
	          }
	        }
	      } else {
	        mParticle.Logger.error('Must pass an object into setUserAttributes. You passed a ' + _typeof_1(userAttributes));
	      }
	    },

	    /**
	     * Removes a specific user attribute
	     * @method removeUserAttribute
	     * @param {String} key
	     */
	    removeUserAttribute: function removeUserAttribute(key) {
	      var cookies, userAttributes;
	      mParticle.sessionManager.resetSessionTimer();

	      if (!Validators$2.isValidKeyValue(key)) {
	        mParticle.Logger.error(Messages$6.ErrorMessages.BadKey);
	        return;
	      }

	      if (mParticle.Store.webviewBridgeEnabled) {
	        NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.RemoveUserAttribute, JSON.stringify({
	          key: key,
	          value: null
	        }));
	      } else {
	        cookies = Persistence.getPersistence();
	        userAttributes = this.getAllUserAttributes();
	        sendUserAttributeChangeEvent(key, null, userAttributes[key], false, true);
	        var existingProp = Helpers.findKeyInObject(userAttributes, key);

	        if (existingProp) {
	          key = existingProp;
	        }

	        delete userAttributes[key];

	        if (cookies && cookies[mpid]) {
	          cookies[mpid].ua = userAttributes;
	          Persistence.saveCookies(cookies, mpid);
	        }

	        Forwarders.initForwarders(IdentityAPI.getCurrentUser().getUserIdentities(), ApiClient.prepareForwardingStats);
	        Forwarders.applyToForwarders('removeUserAttribute', key);
	      }
	    },

	    /**
	     * Sets a list of user attributes
	     * @method setUserAttributeList
	     * @param {String} key
	     * @param {Array} value an array of values
	     */
	    setUserAttributeList: function setUserAttributeList(key, newValue) {
	      var cookies, userAttributes, previousUserAttributeValue, isNewAttribute, userAttributeChange;
	      mParticle.sessionManager.resetSessionTimer();

	      if (!Validators$2.isValidKeyValue(key)) {
	        mParticle.Logger.error(Messages$6.ErrorMessages.BadKey);
	        return;
	      }

	      if (!Array.isArray(newValue)) {
	        mParticle.Logger.error('The value you passed in to setUserAttributeList must be an array. You passed in a ' + (typeof value === "undefined" ? "undefined" : _typeof_1(value)));
	        return;
	      }

	      var arrayCopy = newValue.slice();

	      if (mParticle.Store.webviewBridgeEnabled) {
	        NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetUserAttributeList, JSON.stringify({
	          key: key,
	          value: arrayCopy
	        }));
	      } else {
	        cookies = Persistence.getPersistence();
	        userAttributes = this.getAllUserAttributes();
	        var existingProp = Helpers.findKeyInObject(userAttributes, key);

	        if (existingProp) {
	          isNewAttribute = false;
	          previousUserAttributeValue = userAttributes[existingProp];
	          delete userAttributes[existingProp];
	        } else {
	          isNewAttribute = true;
	        }

	        if (ApiClient.shouldEnableBatching()) {
	          // If the new attributeList length is different previous, then there is a change event.
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
	            sendUserAttributeChangeEvent(key, newValue, previousUserAttributeValue, isNewAttribute, false);
	          }
	        }

	        userAttributes[key] = arrayCopy;

	        if (cookies && cookies[mpid]) {
	          cookies[mpid].ua = userAttributes;
	          Persistence.saveCookies(cookies, mpid);
	        }

	        Forwarders.initForwarders(IdentityAPI.getCurrentUser().getUserIdentities(), ApiClient.prepareForwardingStats);
	        Forwarders.callSetUserAttributeOnForwarders(key, arrayCopy);
	      }
	    },

	    /**
	     * Removes all user attributes
	     * @method removeAllUserAttributes
	     */
	    removeAllUserAttributes: function removeAllUserAttributes() {
	      var userAttributes;
	      mParticle.sessionManager.resetSessionTimer();

	      if (mParticle.Store.webviewBridgeEnabled) {
	        NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.RemoveAllUserAttributes);
	      } else {
	        userAttributes = this.getAllUserAttributes();
	        Forwarders.initForwarders(IdentityAPI.getCurrentUser().getUserIdentities(), ApiClient.prepareForwardingStats);

	        if (userAttributes) {
	          for (var prop in userAttributes) {
	            if (userAttributes.hasOwnProperty(prop)) {
	              Forwarders.applyToForwarders('removeUserAttribute', prop);
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
	      var userAttributesCopy = {};
	      var userAttributes = Persistence.getAllUserAttributes(mpid);

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
	      return mParticleUserCart(mpid);
	    },

	    /**
	     * Returns the Consent State stored locally for this user.
	     * @method getConsentState
	     * @return a ConsentState object
	     */
	    getConsentState: function getConsentState() {
	      return Persistence.getConsentState(mpid);
	    },

	    /**
	     * Sets the Consent State stored locally for this user.
	     * @method setConsentState
	     * @param {Object} consent state
	     */
	    setConsentState: function setConsentState(state) {
	      Persistence.saveUserConsentStateToCookies(mpid, state);
	      Forwarders.initForwarders(this.getUserIdentities().userIdentities, ApiClient.prepareForwardingStats);
	    },
	    isLoggedIn: function isLoggedIn() {
	      return _isLoggedIn;
	    },
	    getLastSeenTime: function getLastSeenTime() {
	      return Persistence.getLastSeenTime(mpid);
	    },
	    getFirstSeenTime: function getFirstSeenTime() {
	      return Persistence.getFirstSeenTime(mpid);
	    }
	  };
	}
	/**
	 * Invoke these methods on the mParticle.Identity.getCurrentUser().getCart() object.
	 * Example: mParticle.Identity.getCurrentUser().getCart().add(...);
	 * @class mParticle.Identity.getCurrentUser().getCart()
	 */


	function mParticleUserCart(mpid) {
	  return {
	    /**
	     * Adds a cart product to the user cart
	     * @method add
	     * @param {Object} product the product
	     * @param {Boolean} [logEvent] a boolean to log adding of the cart object. If blank, no logging occurs.
	     */
	    add: function add(product, logEvent) {
	      var allProducts, userProducts, arrayCopy;
	      arrayCopy = Array.isArray(product) ? product.slice() : [product];
	      arrayCopy.forEach(function (product) {
	        product.Attributes = Helpers.sanitizeAttributes(product.Attributes);
	      });

	      if (mParticle.Store.webviewBridgeEnabled) {
	        NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.AddToCart, JSON.stringify(arrayCopy));
	      } else {
	        mParticle.sessionManager.resetSessionTimer();
	        userProducts = Persistence.getUserProductsFromLS(mpid);
	        userProducts = userProducts.concat(arrayCopy);

	        if (logEvent === true) {
	          Events.logProductActionEvent(Types.ProductActionType.AddToCart, arrayCopy);
	        }

	        var productsForMemory = {};
	        productsForMemory[mpid] = {
	          cp: userProducts
	        };

	        if (userProducts.length > mParticle.Store.SDKConfig.maxProducts) {
	          mParticle.Logger.verbose('The cart contains ' + userProducts.length + ' items. Only ' + mParticle.Store.SDKConfig.maxProducts + ' can currently be saved in cookies.');
	          userProducts = userProducts.slice(-mParticle.Store.SDKConfig.maxProducts);
	        }

	        allProducts = Persistence.getAllUserProductsFromLS();
	        allProducts[mpid].cp = userProducts;
	        Persistence.setCartProducts(allProducts);
	      }
	    },

	    /**
	     * Removes a cart product from the current user cart
	     * @method remove
	     * @param {Object} product the product
	     * @param {Boolean} [logEvent] a boolean to log adding of the cart object. If blank, no logging occurs.
	     */
	    remove: function remove(product, logEvent) {
	      var allProducts,
	          userProducts,
	          cartIndex = -1,
	          cartItem = null;

	      if (mParticle.Store.webviewBridgeEnabled) {
	        NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.RemoveFromCart, JSON.stringify(product));
	      } else {
	        mParticle.sessionManager.resetSessionTimer();
	        userProducts = Persistence.getUserProductsFromLS(mpid);

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
	              Events.logProductActionEvent(Types.ProductActionType.RemoveFromCart, cartItem);
	            }
	          }
	        }

	        var productsForMemory = {};
	        productsForMemory[mpid] = {
	          cp: userProducts
	        };
	        allProducts = Persistence.getAllUserProductsFromLS();
	        allProducts[mpid].cp = userProducts;
	        Persistence.setCartProducts(allProducts);
	      }
	    },

	    /**
	     * Clears the user's cart
	     * @method clear
	     */
	    clear: function clear() {
	      var allProducts;

	      if (mParticle.Store.webviewBridgeEnabled) {
	        NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.ClearCart);
	      } else {
	        mParticle.sessionManager.resetSessionTimer();
	        allProducts = Persistence.getAllUserProductsFromLS();

	        if (allProducts && allProducts[mpid] && allProducts[mpid].cp) {
	          allProducts[mpid].cp = [];
	          allProducts[mpid].cp = [];
	          Persistence.setCartProducts(allProducts);
	        }
	      }
	    },

	    /**
	     * Returns all cart products
	     * @method getCartProducts
	     * @return {Array} array of cart products
	     */
	    getCartProducts: function getCartProducts() {
	      return Persistence.getCartProducts(mpid);
	    }
	  };
	}

	function parseIdentityResponse(xhr, previousMPID, callback, identityApiData, method) {
	  var prevUser = mParticle.Identity.getCurrentUser(),
	      newUser,
	      identityApiResult,
	      indexOfMPID;
	  var userIdentitiesForModify = {},
	      userIdentities = prevUser ? prevUser.getUserIdentities().userIdentities : {};

	  for (var identityKey in userIdentities) {
	    userIdentitiesForModify[Types.IdentityType.getIdentityType(identityKey)] = userIdentities[identityKey];
	  }

	  var newIdentities = {};
	  mParticle.Store.identityCallInFlight = false;

	  try {
	    mParticle.Logger.verbose('Parsing "' + method + '" identity response from server');

	    if (xhr.responseText) {
	      identityApiResult = JSON.parse(xhr.responseText);
	      sendUserIdentityChange(identityApiData, method, identityApiResult.mpid);

	      if (identityApiResult.hasOwnProperty('is_logged_in')) {
	        mParticle.Store.isLoggedIn = identityApiResult.is_logged_in;
	      }
	    }

	    if (xhr.status === 200) {
	      if (method === 'modify') {
	        newIdentities = IdentityRequest.modifyUserIdentities(userIdentitiesForModify, identityApiData.userIdentities);
	        Persistence.saveUserIdentitiesToCookies(prevUser.getMPID(), newIdentities);
	      } else {
	        identityApiResult = JSON.parse(xhr.responseText);
	        mParticle.Logger.verbose('Successfully parsed Identity Response');

	        if (!prevUser || prevUser.getMPID() && identityApiResult.mpid && identityApiResult.mpid !== prevUser.getMPID()) {
	          mParticle.Store.mpid = identityApiResult.mpid;

	          if (prevUser) {
	            Persistence.setLastSeenTime(previousMPID);
	          }

	          Persistence.setFirstSeenTime(identityApiResult.mpid);
	        } //this covers an edge case where, users stored before "firstSeenTime" was introduced
	        //will not have a value for "fst" until the current MPID changes, and in some cases,
	        //the current MPID will never change


	        if (method === 'identify' && prevUser && identityApiResult.mpid === prevUser.getMPID()) {
	          Persistence.setFirstSeenTime(identityApiResult.mpid);
	        }

	        indexOfMPID = mParticle.Store.currentSessionMPIDs.indexOf(identityApiResult.mpid);

	        if (mParticle.Store.sessionId && identityApiResult.mpid && previousMPID !== identityApiResult.mpid && indexOfMPID < 0) {
	          mParticle.Store.currentSessionMPIDs.push(identityApiResult.mpid);
	        }

	        if (indexOfMPID > -1) {
	          mParticle.Store.currentSessionMPIDs = mParticle.Store.currentSessionMPIDs.slice(0, indexOfMPID).concat(mParticle.Store.currentSessionMPIDs.slice(indexOfMPID + 1, mParticle.Store.currentSessionMPIDs.length));
	          mParticle.Store.currentSessionMPIDs.push(identityApiResult.mpid);
	        }

	        Persistence.saveUserIdentitiesToCookies(identityApiResult.mpid, newIdentities);
	        cookieSyncManager.attemptCookieSync(previousMPID, identityApiResult.mpid);
	        checkIdentitySwap(previousMPID, identityApiResult.mpid, mParticle.Store.currentSessionMPIDs); //if there is any previous migration data

	        if (Object.keys(mParticle.Store.migrationData).length) {
	          newIdentities = mParticle.Store.migrationData.userIdentities || {};
	          var userAttributes = mParticle.Store.migrationData.userAttributes || {};
	          Persistence.saveUserAttributesToCookies(identityApiResult.mpid, userAttributes);
	        } else {
	          if (identityApiData && identityApiData.userIdentities && Object.keys(identityApiData.userIdentities).length) {
	            newIdentities = IdentityRequest.modifyUserIdentities(userIdentitiesForModify, identityApiData.userIdentities);
	          }
	        }

	        Persistence.saveUserIdentitiesToCookies(identityApiResult.mpid, newIdentities);
	        Persistence.update();
	        Persistence.findPrevCookiesBasedOnUI(identityApiData);
	        mParticle.Store.context = identityApiResult.context || mParticle.Store.context;
	      }

	      newUser = IdentityAPI.getCurrentUser();

	      if (identityApiData && identityApiData.onUserAlias && Helpers.Validators.isFunction(identityApiData.onUserAlias)) {
	        try {
	          mParticle.Logger.warning('Deprecated function onUserAlias will be removed in future releases');
	          identityApiData.onUserAlias(prevUser, newUser);
	        } catch (e) {
	          mParticle.Logger.error('There was an error with your onUserAlias function - ' + e);
	        }
	      }

	      var cookies = Persistence.getCookie() || Persistence.getLocalStorage();

	      if (newUser) {
	        Persistence.storeDataInMemory(cookies, newUser.getMPID());

	        if (!prevUser || newUser.getMPID() !== prevUser.getMPID() || prevUser.isLoggedIn() !== newUser.isLoggedIn()) {
	          Forwarders.initForwarders(newUser.getUserIdentities().userIdentities, ApiClient.prepareForwardingStats);
	        }

	        Forwarders.setForwarderUserIdentities(newUser.getUserIdentities().userIdentities);
	        Forwarders.setForwarderOnIdentityComplete(newUser, method);
	        Forwarders.setForwarderOnUserIdentified(newUser, method);
	      }

	      ApiClient.processQueuedEvents();
	    }

	    if (callback) {
	      if (xhr.status === 0) {
	        Helpers.invokeCallback(callback, HTTPCodes$1.noHttpCoverage, identityApiResult || null, newUser);
	      } else {
	        Helpers.invokeCallback(callback, xhr.status, identityApiResult || null, newUser);
	      }
	    } else {
	      if (identityApiResult && identityApiResult.errors && identityApiResult.errors.length) {
	        mParticle.Logger.error('Received HTTP response code of ' + xhr.status + ' - ' + identityApiResult.errors[0].message);
	      }
	    }
	  } catch (e) {
	    if (callback) {
	      Helpers.invokeCallback(callback, xhr.status, identityApiResult || null);
	    }

	    mParticle.Logger.error('Error parsing JSON response from Identity server: ' + e);
	  }
	} // send a user identity change request on identify, login, logout, modify when any values change.
	// compare what identities exist vs what it previously was for the specific user if they were in memory before.
	// if it's the first time the user is logging in, send a user identity change request with created_this_batch = true
	// created_this_batch is always false for old user


	function sendUserIdentityChange(newIdentityApiData, method, mpid) {
	  var userInMemory, userIdentitiesInMemory, userIdentityChangeEvent;

	  if (!ApiClient.shouldEnableBatching()) {
	    return;
	  }

	  if (!mpid) {
	    if (method !== 'modify') {
	      return;
	    }
	  }

	  userInMemory = method === 'modify' ? IdentityAPI.getCurrentUser() : IdentityAPI.getUser(mpid);
	  var newUserIdentities = newIdentityApiData.userIdentities; // if there is not a user in memory with this mpid, then it is a new user, and we send a user identity
	  // change for each identity on the identity api request

	  if (userInMemory) {
	    userIdentitiesInMemory = userInMemory.getUserIdentities() ? userInMemory.getUserIdentities().userIdentities : {};
	  } else {
	    for (var identityType in newUserIdentities) {
	      userIdentityChangeEvent = createUserIdentityChange(identityType, newUserIdentities[identityType], null, true);
	      sendEventToServer$2(userIdentityChangeEvent);
	    }

	    return;
	  }

	  for (identityType in newUserIdentities) {
	    if (userIdentitiesInMemory[identityType] !== newUserIdentities[identityType]) {
	      var isNewUserIdentityType = !userIdentitiesInMemory[identityType];
	      userIdentityChangeEvent = createUserIdentityChange(identityType, newUserIdentities[identityType], userIdentitiesInMemory[identityType], isNewUserIdentityType);
	      sendEventToServer$2(userIdentityChangeEvent);
	    }
	  }
	}

	function createUserIdentityChange(identityType, newIdentity, oldIdentity, newCreatedThisBatch) {
	  var userIdentityChangeEvent;
	  userIdentityChangeEvent = ServerModel.createEventObject({
	    messageType: Types.MessageType.UserIdentityChange,
	    userIdentityChanges: {
	      New: {
	        IdentityType: identityType,
	        Identity: newIdentity,
	        CreatedThisBatch: newCreatedThisBatch
	      },
	      Old: {
	        IdentityType: identityType,
	        Identity: oldIdentity,
	        CreatedThisBatch: false
	      }
	    }
	  });
	  return userIdentityChangeEvent;
	}

	function sendUserAttributeChangeEvent(attributeKey, newUserAttributeValue, previousUserAttributeValue, isNewAttribute, deleted) {
	  if (!ApiClient.shouldEnableBatching()) {
	    return;
	  }

	  var userAttributeChangeEvent = createUserAttributeChange(attributeKey, newUserAttributeValue, previousUserAttributeValue, isNewAttribute, deleted);

	  if (userAttributeChangeEvent) {
	    sendEventToServer$2(userAttributeChangeEvent);
	  }
	}

	function createUserAttributeChange(key, newValue, previousUserAttributeValue, isNewAttribute, deleted) {
	  if (!previousUserAttributeValue) {
	    previousUserAttributeValue = null;
	  }

	  var userAttributeChangeEvent;

	  if (newValue !== previousUserAttributeValue) {
	    userAttributeChangeEvent = ServerModel.createEventObject({
	      messageType: Types.MessageType.UserAttributeChange,
	      userAttributeChanges: {
	        UserAttributeName: key,
	        New: newValue,
	        Old: previousUserAttributeValue || null,
	        Deleted: deleted,
	        IsNewAttribute: isNewAttribute
	      }
	    });
	  }

	  return userAttributeChangeEvent;
	}

	var Identity = {
	  checkIdentitySwap: checkIdentitySwap,
	  IdentityRequest: IdentityRequest,
	  IdentityAPI: IdentityAPI,
	  mParticleUser: mParticleUser,
	  mParticleUserCart: mParticleUserCart
	};

	var IdentityAPI$1 = Identity.IdentityAPI,
	    Messages$7 = Constants.Messages,
	    logEvent$1 = Events.logEvent;

	function initialize() {
	  if (mParticle.Store.sessionId) {
	    var sessionTimeoutInMilliseconds = mParticle.Store.SDKConfig.sessionTimeout * 60000;

	    if (new Date() > new Date(mParticle.Store.dateLastEventSent.getTime() + sessionTimeoutInMilliseconds)) {
	      endSession();
	      startNewSession();
	    } else {
	      var cookies = Persistence.getPersistence();

	      if (cookies && !cookies.cu) {
	        IdentityAPI$1.identify(mParticle.Store.SDKConfig.identifyRequest, mParticle.Store.SDKConfig.identityCallback);
	        mParticle.Store.identifyCalled = true;
	        mParticle.Store.SDKConfig.identityCallback = null;
	      }
	    }
	  } else {
	    startNewSession();
	  }
	}

	function getSession() {
	  return mParticle.Store.sessionId;
	}

	function startNewSession() {
	  mParticle.Logger.verbose(Messages$7.InformationMessages.StartingNewSession);

	  if (Helpers.canLog()) {
	    mParticle.Store.sessionId = Helpers.generateUniqueId().toUpperCase();
	    var currentUser = mParticle.Identity.getCurrentUser(),
	        mpid = currentUser ? currentUser.getMPID() : null;

	    if (mpid) {
	      mParticle.Store.currentSessionMPIDs = [mpid];
	    }

	    if (!mParticle.Store.sessionStartDate) {
	      var date = new Date();
	      mParticle.Store.sessionStartDate = date;
	      mParticle.Store.dateLastEventSent = date;
	    }

	    setSessionTimer();

	    if (!mParticle.Store.identifyCalled) {
	      IdentityAPI$1.identify(mParticle.Store.SDKConfig.identifyRequest, mParticle.Store.SDKConfig.identityCallback);
	      mParticle.Store.identifyCalled = true;
	      mParticle.Store.SDKConfig.identityCallback = null;
	    }

	    logEvent$1({
	      messageType: Types.MessageType.SessionStart
	    });
	  } else {
	    mParticle.Logger.verbose(Messages$7.InformationMessages.AbandonStartSession);
	  }
	}

	function endSession(override) {
	  mParticle.Logger.verbose(Messages$7.InformationMessages.StartingEndSession);

	  if (override) {
	    logEvent$1({
	      messageType: Types.MessageType.SessionEnd
	    });
	    mParticle.Store.sessionId = null;
	    mParticle.Store.dateLastEventSent = null;
	    mParticle.Store.sessionAttributes = {};
	    Persistence.update();
	  } else if (Helpers.canLog()) {
	    var sessionTimeoutInMilliseconds, cookies, timeSinceLastEventSent;
	    cookies = Persistence.getCookie() || Persistence.getLocalStorage();

	    if (!cookies) {
	      return;
	    }

	    if (cookies.gs && !cookies.gs.sid) {
	      mParticle.Logger.verbose(Messages$7.InformationMessages.NoSessionToEnd);
	      return;
	    } // sessionId is not equal to cookies.sid if cookies.sid is changed in another tab


	    if (cookies.gs.sid && mParticle.Store.sessionId !== cookies.gs.sid) {
	      mParticle.Store.sessionId = cookies.gs.sid;
	    }

	    if (cookies.gs && cookies.gs.les) {
	      sessionTimeoutInMilliseconds = mParticle.Store.SDKConfig.sessionTimeout * 60000;
	      var newDate = new Date().getTime();
	      timeSinceLastEventSent = newDate - cookies.gs.les;

	      if (timeSinceLastEventSent < sessionTimeoutInMilliseconds) {
	        setSessionTimer();
	      } else {
	        logEvent$1({
	          messageType: Types.MessageType.SessionEnd
	        });
	        mParticle.Store.sessionId = null;
	        mParticle.Store.dateLastEventSent = null;
	        mParticle.Store.sessionStartDate = null;
	        mParticle.Store.sessionAttributes = {};
	        Persistence.update();
	      }
	    }
	  } else {
	    mParticle.Logger.verbose(Messages$7.InformationMessages.AbandonEndSession);
	  }
	}

	function setSessionTimer() {
	  var sessionTimeoutInMilliseconds = mParticle.Store.SDKConfig.sessionTimeout * 60000;
	  mParticle.Store.globalTimer = window.setTimeout(function () {
	    endSession();
	  }, sessionTimeoutInMilliseconds);
	}

	function resetSessionTimer() {
	  if (!mParticle.Store.webviewBridgeEnabled) {
	    if (!mParticle.Store.sessionId) {
	      startNewSession();
	    }

	    clearSessionTimeout();
	    setSessionTimer();
	  }

	  startNewSessionIfNeeded();
	}

	function clearSessionTimeout() {
	  clearTimeout(mParticle.Store.globalTimer);
	}

	function startNewSessionIfNeeded() {
	  if (!mParticle.Store.webviewBridgeEnabled) {
	    var cookies = Persistence.getCookie() || Persistence.getLocalStorage();

	    if (!mParticle.Store.sessionId && cookies) {
	      if (cookies.sid) {
	        mParticle.Store.sessionId = cookies.sid;
	      } else {
	        startNewSession();
	      }
	    }
	  }
	}

	var SessionManager = {
	  initialize: initialize,
	  getSession: getSession,
	  startNewSession: startNewSession,
	  endSession: endSession,
	  setSessionTimer: setSessionTimer,
	  resetSessionTimer: resetSessionTimer,
	  clearSessionTimeout: clearSessionTimeout
	};

	var Validators$3 = Helpers.Validators;

	function createSDKConfig(config) {
	  var sdkConfig = {};

	  for (var prop in Constants.DefaultConfig) {
	    if (Constants.DefaultConfig.hasOwnProperty(prop)) {
	      sdkConfig[prop] = Constants.DefaultConfig[prop];
	    }
	  }

	  if (config) {
	    for (prop in config) {
	      if (config.hasOwnProperty(prop)) {
	        sdkConfig[prop] = config[prop];
	      }
	    }
	  }

	  for (prop in Constants.DefaultUrls) {
	    sdkConfig[prop] = Constants.DefaultUrls[prop];
	  }

	  return sdkConfig;
	}

	function Store(config, logger) {
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
	    migrationData: {},
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
	    context: '',
	    configurationLoaded: false,
	    identityCallInFlight: false,
	    SDKConfig: {},
	    migratingToIDSyncCookies: false,
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
	    configuredForwarders: [],
	    pixelConfigurations: []
	  };

	  for (var key in defaultStore) {
	    this[key] = defaultStore[key];
	  }

	  this.storageName = Helpers.createMainStorageName(config.workspaceToken);
	  this.prodStorageName = Helpers.createProductStorageName(config.workspaceToken);
	  this.integrationDelayTimeoutStart = Date.now();
	  this.SDKConfig = createSDKConfig(config); // Set configuration to default settings

	  if (config) {
	    if (config.hasOwnProperty('isDevelopmentMode')) {
	      this.SDKConfig.isDevelopmentMode = Helpers.returnConvertedBoolean(config.isDevelopmentMode);
	    } else {
	      this.SDKConfig.isDevelopmentMode = false;
	    }

	    if (config.hasOwnProperty('serviceUrl')) {
	      this.SDKConfig.serviceUrl = config.serviceUrl;
	    }

	    if (config.hasOwnProperty('secureServiceUrl')) {
	      this.SDKConfig.secureServiceUrl = config.secureServiceUrl;
	    }

	    if (config.hasOwnProperty('v2ServiceUrl')) {
	      this.SDKConfig.v2ServiceUrl = config.v2ServiceUrl;
	    }

	    if (config.hasOwnProperty('v2SecureServiceUrl')) {
	      this.SDKConfig.v2SecureServiceUrl = config.v2SecureServiceUrl;
	    }

	    if (config.hasOwnProperty('identityUrl')) {
	      this.SDKConfig.identityUrl = config.identityUrl;
	    }

	    if (config.hasOwnProperty('aliasUrl')) {
	      this.SDKConfig.aliasUrl = config.aliasUrl;
	    }

	    if (config.hasOwnProperty('configUrl')) {
	      this.SDKConfig.configUrl = config.configUrl;
	    }

	    if (config.hasOwnProperty('logLevel')) {
	      this.SDKConfig.logLevel = config.logLevel;
	    }

	    if (config.hasOwnProperty('useNativeSdk')) {
	      this.SDKConfig.useNativeSdk = config.useNativeSdk;
	    } else {
	      this.SDKConfig.useNativeSdk = false;
	    }

	    if (config.hasOwnProperty('kits')) {
	      this.SDKConfig.kits = config.kits;
	    }

	    if (config.hasOwnProperty('isIOS')) {
	      this.SDKConfig.isIOS = config.isIOS;
	    } else {
	      this.SDKConfig.isIOS = mParticle.isIOS || false;
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

	      if (Validators$3.isFunction(callback)) {
	        this.SDKConfig.identityCallback = config.identityCallback;
	      } else {
	        logger.warning('The optional callback must be a function. You tried entering a(n) ' + _typeof_1(callback), ' . Callback not set. Please set your callback again.');
	      }
	    }

	    if (config.hasOwnProperty('appVersion')) {
	      this.SDKConfig.appVersion = config.appVersion;
	    }

	    if (config.hasOwnProperty('sessionTimeout')) {
	      this.SDKConfig.sessionTimeout = config.sessionTimeout;
	    }

	    if (config.hasOwnProperty('forceHttps')) {
	      this.SDKConfig.forceHttps = config.forceHttps;
	    } else {
	      this.SDKConfig.forceHttps = true;
	    } // Some forwarders require custom flags on initialization, so allow them to be set using config object


	    if (config.hasOwnProperty('customFlags')) {
	      this.SDKConfig.customFlags = config.customFlags;
	    }

	    if (config.hasOwnProperty('workspaceToken')) {
	      this.SDKConfig.workspaceToken = config.workspaceToken;
	    } else {
	      logger.warning('You should have a workspaceToken on your mParticle.config object for security purposes.');
	    }

	    if (config.hasOwnProperty('requiredWebviewBridgeName')) {
	      this.SDKConfig.requiredWebviewBridgeName = config.requiredWebviewBridgeName;
	    } else if (config.hasOwnProperty('workspaceToken')) {
	      this.SDKConfig.requiredWebviewBridgeName = config.workspaceToken;
	    }

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

	    if (!config.hasOwnProperty('flags')) {
	      this.SDKConfig.flags = {};
	    }

	    if (!this.SDKConfig.flags.hasOwnProperty(Constants.FeatureFlags.EventsV3)) {
	      this.SDKConfig.flags[Constants.FeatureFlags.EventsV3] = 0;
	    }

	    if (!this.SDKConfig.flags.hasOwnProperty(Constants.FeatureFlags.EventBatchingIntervalMillis)) {
	      this.SDKConfig.flags[Constants.FeatureFlags.EventBatchingIntervalMillis] = Constants.DefaultConfig.uploadInterval;
	    }

	    if (!this.SDKConfig.flags.hasOwnProperty(Constants.FeatureFlags.ReportBatching)) {
	      this.SDKConfig.flags[Constants.FeatureFlags.ReportBatching] = false;
	    }
	  }
	}

	function Logger(config) {
	  var logLevel = config.logLevel || 'warning';

	  if (config.hasOwnProperty('logger')) {
	    this.logger = config.logger;
	  } else {
	    this.logger = new ConsoleLogger();
	  }

	  this.verbose = function (msg) {
	    if (logLevel !== 'none') {
	      if (this.logger.verbose && logLevel === 'verbose') {
	        this.logger.verbose(msg);
	      }
	    }
	  };

	  this.warning = function (msg) {
	    if (logLevel !== 'none') {
	      if (this.logger.warning && (logLevel === 'verbose' || logLevel === 'warning')) {
	        this.logger.warning(msg);
	      }
	    }
	  };

	  this.error = function (msg) {
	    if (logLevel !== 'none') {
	      if (this.logger.error) {
	        this.logger.error(msg);
	      }
	    }
	  };

	  this.setLogLevel = function (newLogLevel) {
	    logLevel = newLogLevel;
	  };
	}

	function ConsoleLogger() {
	  this.verbose = function (msg) {
	    if (window.console && window.console.info) {
	      window.console.info(msg);
	    }
	  };

	  this.error = function (msg) {
	    if (window.console && window.console.error) {
	      window.console.error(msg);
	    }
	  };

	  this.warning = function (msg) {
	    if (window.console && window.console.warn) {
	      window.console.warn(msg);
	    }
	  };
	}

	var StorageNames$2 = Constants.StorageNames,
	    Base64$2 = Polyfill.Base64,
	    CookiesGlobalSettingsKeys = {
	  das: 1
	},
	    MPIDKeys = {
	  ui: 1
	}; //  if there is a cookie or localStorage:
	//  1. determine which version it is ('mprtcl-api', 'mprtcl-v2', 'mprtcl-v3', 'mprtcl-v4')
	//  2. return if 'mprtcl-v4', otherwise migrate to mprtclv4 schema
	// 3. if 'mprtcl-api', could be JSSDKv2 or JSSDKv1. JSSDKv2 cookie has a 'globalSettings' key on it

	function migrate() {
	  try {
	    migrateCookies();
	  } catch (e) {
	    Persistence.expireCookies(StorageNames$2.cookieNameV3);
	    Persistence.expireCookies(StorageNames$2.cookieNameV4);
	    mParticle.Logger.error('Error migrating cookie: ' + e);
	  }

	  if (mParticle.Store.isLocalStorageAvailable) {
	    try {
	      migrateLocalStorage();
	    } catch (e) {
	      localStorage.removeItem(StorageNames$2.localStorageNameV3);
	      localStorage.removeItem(StorageNames$2.localStorageNameV4);
	      mParticle.Logger.error('Error migrating localStorage: ' + e);
	    }
	  }
	}

	function migrateCookies() {
	  var cookies = window.document.cookie.split('; '),
	      foundCookie,
	      i,
	      l,
	      parts,
	      name,
	      cookie;
	  mParticle.Logger.verbose(Constants.Messages.InformationMessages.CookieSearch);

	  for (i = 0, l = cookies.length; i < l; i++) {
	    parts = cookies[i].split('=');
	    name = Helpers.decoded(parts.shift());
	    cookie = Helpers.decoded(parts.join('=')); //most recent version needs no migration

	    if (name === mParticle.Store.storageName) {
	      return;
	    }

	    if (name === StorageNames$2.cookieNameV4) {
	      // adds cookies to new namespace, removes previous cookie
	      finishCookieMigration(cookie, StorageNames$2.cookieNameV4);

	      if (mParticle.Store.isLocalStorageAvailable) {
	        migrateProductsToNameSpace();
	      }

	      return; // migration path for SDKv1CookiesV3, doesn't need to be encoded
	    }

	    if (name === StorageNames$2.cookieNameV3) {
	      foundCookie = convertSDKv1CookiesV3ToSDKv2CookiesV4(cookie);
	      finishCookieMigration(foundCookie, StorageNames$2.cookieNameV3);
	      break;
	    }
	  }
	}

	function finishCookieMigration(cookie, cookieName) {
	  var date = new Date(),
	      cookieDomain = Persistence.getCookieDomain(),
	      expires,
	      domain;
	  expires = new Date(date.getTime() + StorageNames$2.CookieExpiration * 24 * 60 * 60 * 1000).toGMTString();

	  if (cookieDomain === '') {
	    domain = '';
	  } else {
	    domain = ';domain=' + cookieDomain;
	  }

	  mParticle.Logger.verbose(Constants.Messages.InformationMessages.CookieSet);
	  window.document.cookie = encodeURIComponent(mParticle.Store.storageName) + '=' + cookie + ';expires=' + expires + ';path=/' + domain;
	  Persistence.expireCookies(cookieName);
	  mParticle.Store.migratingToIDSyncCookies = true;
	}

	function convertSDKv1CookiesV3ToSDKv2CookiesV4(SDKv1CookiesV3) {
	  SDKv1CookiesV3 = Persistence.replacePipesWithCommas(Persistence.replaceApostrophesWithQuotes(SDKv1CookiesV3));
	  var parsedSDKv1CookiesV3 = JSON.parse(SDKv1CookiesV3);
	  var parsedCookiesV4 = JSON.parse(restructureToV4Cookie(SDKv1CookiesV3));

	  if (parsedSDKv1CookiesV3.mpid) {
	    parsedCookiesV4.gs.csm.push(parsedSDKv1CookiesV3.mpid); // all other values are already encoded, so we have to encode any new values

	    parsedCookiesV4.gs.csm = Base64$2.encode(JSON.stringify(parsedCookiesV4.gs.csm));
	    migrateProductsFromSDKv1ToSDKv2CookiesV4(parsedSDKv1CookiesV3, parsedSDKv1CookiesV3.mpid);
	  }

	  return JSON.stringify(parsedCookiesV4);
	}

	function restructureToV4Cookie(cookies) {
	  try {
	    var cookiesV4Schema = {
	      gs: {
	        csm: []
	      }
	    };
	    cookies = JSON.parse(cookies);

	    for (var key in cookies) {
	      if (cookies.hasOwnProperty(key)) {
	        if (CookiesGlobalSettingsKeys[key]) {
	          cookiesV4Schema.gs[key] = cookies[key];
	        } else if (key === 'mpid') {
	          cookiesV4Schema.cu = cookies[key];
	        } else if (cookies.mpid) {
	          cookiesV4Schema[cookies.mpid] = cookiesV4Schema[cookies.mpid] || {};

	          if (MPIDKeys[key]) {
	            cookiesV4Schema[cookies.mpid][key] = cookies[key];
	          }
	        }
	      }
	    }

	    return JSON.stringify(cookiesV4Schema);
	  } catch (e) {
	    mParticle.Logger.error('Failed to restructure previous cookie into most current cookie schema');
	  }
	}

	function migrateProductsToNameSpace() {
	  var lsProdV4Name = StorageNames$2.localStorageProductsV4;
	  var products = localStorage.getItem(StorageNames$2.localStorageProductsV4);
	  localStorage.setItem(mParticle.Store.prodStorageName, products);
	  localStorage.removeItem(lsProdV4Name);
	}

	function migrateProductsFromSDKv1ToSDKv2CookiesV4(cookies, mpid) {
	  if (!mParticle.Store.isLocalStorageAvailable) {
	    return;
	  }

	  var localStorageProducts = {};
	  localStorageProducts[mpid] = {};

	  if (cookies.cp) {
	    try {
	      localStorageProducts[mpid].cp = JSON.parse(Base64$2.decode(cookies.cp));
	    } catch (e) {
	      localStorageProducts[mpid].cp = cookies.cp;
	    }

	    if (!Array.isArray(localStorageProducts[mpid].cp)) {
	      localStorageProducts[mpid].cp = [];
	    }
	  }

	  localStorage.setItem(mParticle.Store.prodStorageName, Base64$2.encode(JSON.stringify(localStorageProducts)));
	}

	function migrateLocalStorage() {
	  var cookies,
	      v3LSName = StorageNames$2.localStorageNameV3,
	      v4LSName = StorageNames$2.localStorageNameV4,
	      currentVersionLSData = window.localStorage.getItem(mParticle.Store.storageName),
	      v4LSData,
	      v3LSData,
	      v3LSDataStringCopy;

	  if (currentVersionLSData) {
	    return;
	  }

	  v4LSData = window.localStorage.getItem(v4LSName);

	  if (v4LSData) {
	    finishLSMigration(v4LSData, v4LSName);
	    migrateProductsToNameSpace();
	    return;
	  }

	  v3LSData = window.localStorage.getItem(v3LSName);

	  if (v3LSData) {
	    mParticle.Store.migratingToIDSyncCookies = true;
	    v3LSDataStringCopy = v3LSData.slice();
	    v3LSData = JSON.parse(Persistence.replacePipesWithCommas(Persistence.replaceApostrophesWithQuotes(v3LSData))); // localStorage may contain only products, or the full persistence
	    // when there is an MPID on the cookie, it is the full persistence

	    if (v3LSData.mpid) {
	      v3LSData = JSON.parse(convertSDKv1CookiesV3ToSDKv2CookiesV4(v3LSDataStringCopy));
	      finishLSMigration(JSON.stringify(v3LSData), v3LSName);
	      return; // if no MPID, it is only the products
	    } else if ((v3LSData.cp || v3LSData.pb) && !v3LSData.mpid) {
	      cookies = Persistence.getCookie();

	      if (cookies) {
	        migrateProductsFromSDKv1ToSDKv2CookiesV4(v3LSData, cookies.cu);
	        localStorage.removeItem(StorageNames$2.localStorageNameV3);
	        return;
	      } else {
	        localStorage.removeItem(StorageNames$2.localStorageNameV3);
	        return;
	      }
	    }
	  }

	  function finishLSMigration(data, lsName) {
	    try {
	      window.localStorage.setItem(encodeURIComponent(mParticle.Store.storageName), data);
	    } catch (e) {
	      mParticle.Logger.error('Error with setting localStorage item.');
	    }

	    window.localStorage.removeItem(encodeURIComponent(lsName));
	  }
	}

	var Migrations = {
	  migrate: migrate,
	  convertSDKv1CookiesV3ToSDKv2CookiesV4: convertSDKv1CookiesV3ToSDKv2CookiesV4
	};

	function startForwardingStatsTimer() {
	  mParticle._forwardingStatsTimer = setInterval(function () {
	    prepareAndSendForwardingStatsBatch();
	  }, mParticle.Store.SDKConfig.forwarderStatsTimeout);
	}

	function prepareAndSendForwardingStatsBatch() {
	  var forwarderQueue = Forwarders.getForwarderStatsQueue(),
	      uploadsTable = Persistence.forwardingStatsBatches.uploadsTable,
	      now = Date.now();

	  if (forwarderQueue.length) {
	    uploadsTable[now] = {
	      uploading: false,
	      data: forwarderQueue
	    };
	    Forwarders.setForwarderStatsQueue([]);
	  }

	  for (var date in uploadsTable) {
	    (function (date) {
	      if (uploadsTable.hasOwnProperty(date)) {
	        if (uploadsTable[date].uploading === false) {
	          var xhrCallback = function xhrCallback() {
	            if (xhr.readyState === 4) {
	              if (xhr.status === 200 || xhr.status === 202) {
	                mParticle.Logger.verbose('Successfully sent  ' + xhr.statusText + ' from server');
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

	          var xhr = Helpers.createXHR(xhrCallback);
	          var forwardingStatsData = uploadsTable[date].data;
	          uploadsTable[date].uploading = true;
	          ApiClient.sendBatchForwardingStatsToServer(forwardingStatsData, xhr);
	        }
	      }
	    })(date);
	  }
	}

	var getDeviceId$1 = Persistence.getDeviceId,
	    Messages$8 = Constants.Messages,
	    Validators$4 = Helpers.Validators,
	    mParticleUser$1 = Identity.mParticleUser,
	    IdentityAPI$2 = Identity.IdentityAPI,
	    mParticleUserCart$1 = Identity.mParticleUserCart,
	    HTTPCodes$2 = Constants.HTTPCodes;

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
	/**
	 * Invoke these methods on the mParticle object.
	 * Example: mParticle.endSession()
	 *
	 * @class mParticle
	 */


	var mParticle$1 = {
	  config: window.mParticle ? window.mParticle.config : {},
	  Store: {},
	  getDeviceId: getDeviceId$1,
	  generateHash: Helpers.generateHash,
	  sessionManager: SessionManager,
	  cookieSyncManager: cookieSyncManager,
	  persistence: Persistence,
	  isIOS: window.mParticle && window.mParticle.isIOS ? window.mParticle.isIOS : false,
	  Identity: IdentityAPI$2,
	  Validators: Validators$4,
	  _Identity: Identity,
	  _IdentityRequest: Identity.IdentityRequest,
	  IdentityType: Types.IdentityType,
	  EventType: Types.EventType,
	  CommerceEventType: Types.CommerceEventType,
	  PromotionType: Types.PromotionActionType,
	  ProductActionType: Types.ProductActionType,

	  /**
	   * Initializes the mParticle SDK
	   *
	   * @method init
	   * @param {String} apiKey your mParticle assigned API key
	   * @param {Object} [options] an options object for additional configuration
	   */
	  init: function init(apiKey, config) {
	    if (!config && window.mParticle.config) {
	      window.console.warn('You did not pass a config object to mParticle.init(). Attempting to use the window.mParticle.config if it exists. Please note that in a future release, this may not work and mParticle will not initialize properly');
	      config = window.mParticle.config;
	    }

	    runPreConfigFetchInitialization(apiKey, config); // /config code - Fetch config when requestConfig = true, otherwise, proceed with SDKInitialization
	    // Since fetching the configuration is asynchronous, we must pass completeSDKInitialization
	    // to it for it to be run after fetched

	    if (config) {
	      if (!config.hasOwnProperty('requestConfig') || config.requestConfig) {
	        ApiClient.getSDKConfiguration(apiKey, config, completeSDKInitialization);
	      } else {
	        completeSDKInitialization(apiKey, config);
	      }
	    } else {
	      window.console.error('No config available on the window, please pass a config object to mParticle.init()');
	      return;
	    }
	  },
	  setLogLevel: function setLogLevel(newLogLevel) {
	    mParticle$1.Logger.setLogLevel(newLogLevel);
	  },

	  /**
	   * Completely resets the state of the SDK. mParticle.init(apiKey, window.mParticle.config) will need to be called again.
	   * @method reset
	   * @param {Boolean} keepPersistence if passed as true, this method will only reset the in-memory SDK state.
	   */
	  reset: function reset(config, keepPersistence) {
	    if (mParticle$1.Store) {
	      delete mParticle$1.Store;
	    }

	    mParticle$1.Store = new Store(config);
	    mParticle$1.Store.isLocalStorageAvailable = Persistence.determineLocalStorageAvailability(window.localStorage);
	    Events.stopTracking();

	    if (!keepPersistence) {
	      Persistence.resetPersistence();
	    }

	    Persistence.forwardingStatsBatches.uploadsTable = {};
	    Persistence.forwardingStatsBatches.forwardingStatsEventQueue = [];
	    mParticle$1.preInit = {
	      readyQueue: [],
	      pixelConfigurations: [],
	      integrationDelays: {},
	      forwarderConstructors: [],
	      isDevelopmentMode: false
	    };
	  },
	  ready: function ready(f) {
	    if (mParticle$1.Store.isInitialized && typeof f === 'function') {
	      f();
	    } else {
	      mParticle$1.preInit.readyQueue.push(f);
	    }
	  },

	  /**
	   * Returns the mParticle SDK version number
	   * @method getVersion
	   * @return {String} mParticle SDK version number
	   */
	  getVersion: function getVersion() {
	    return Constants.sdkVersion;
	  },

	  /**
	   * Sets the app version
	   * @method setAppVersion
	   * @param {String} version version number
	   */
	  setAppVersion: function setAppVersion(version) {
	    mParticle$1.Store.SDKConfig.appVersion = version;
	    Persistence.update();
	  },

	  /**
	   * Gets the app name
	   * @method getAppName
	   * @return {String} App name
	   */
	  getAppName: function getAppName() {
	    return mParticle$1.Store.SDKConfig.appName;
	  },

	  /**
	   * Sets the app name
	   * @method setAppName
	   * @param {String} name App Name
	   */
	  setAppName: function setAppName(name) {
	    mParticle$1.Store.SDKConfig.appName = name;
	  },

	  /**
	   * Gets the app version
	   * @method getAppVersion
	   * @return {String} App version
	   */
	  getAppVersion: function getAppVersion() {
	    return mParticle$1.Store.SDKConfig.appVersion;
	  },

	  /**
	   * Stops tracking the location of the user
	   * @method stopTrackingLocation
	   */
	  stopTrackingLocation: function stopTrackingLocation() {
	    SessionManager.resetSessionTimer();
	    Events.stopTracking();
	  },

	  /**
	   * Starts tracking the location of the user
	   * @method startTrackingLocation
	   * @param {Function} [callback] A callback function that is called when the location is either allowed or rejected by the user. A position object of schema {coords: {latitude: number, longitude: number}} is passed to the callback
	   */
	  startTrackingLocation: function startTrackingLocation(callback) {
	    if (!Validators$4.isFunction(callback)) {
	      mParticle$1.Logger.warning('Warning: Location tracking is triggered, but not including a callback into the `startTrackingLocation` may result in events logged too quickly and not being associated with a location.');
	    }

	    SessionManager.resetSessionTimer();
	    Events.startTracking(callback);
	  },

	  /**
	   * Sets the position of the user
	   * @method setPosition
	   * @param {Number} lattitude lattitude digit
	   * @param {Number} longitude longitude digit
	   */
	  setPosition: function setPosition(lat, lng) {
	    SessionManager.resetSessionTimer();

	    if (typeof lat === 'number' && typeof lng === 'number') {
	      mParticle$1.Store.currentPosition = {
	        lat: lat,
	        lng: lng
	      };
	    } else {
	      mParticle$1.Logger.error('Position latitude and/or longitude must both be of type number');
	    }
	  },

	  /**
	   * Starts a new session
	   * @method startNewSession
	   */
	  startNewSession: function startNewSession() {
	    SessionManager.startNewSession();
	  },

	  /**
	   * Ends the current session
	   * @method endSession
	   */
	  endSession: function endSession() {
	    // Sends true as an over ride vs when endSession is called from the setInterval
	    SessionManager.endSession(true);
	  },

	  /**
	   * Logs a Base Event to mParticle's servers
	   * @param {Object} event Base Event Object
	   */
	  logBaseEvent: function logBaseEvent(event) {
	    SessionManager.resetSessionTimer();

	    if (typeof event.name !== 'string') {
	      mParticle$1.Logger.error(Messages$8.ErrorMessages.EventNameInvalidType);
	      return;
	    }

	    if (!event.eventType) {
	      event.eventType = Types.EventType.Unknown;
	    }

	    if (!Helpers.canLog()) {
	      mParticle$1.Logger.error(Messages$8.ErrorMessages.LoggingDisabled);
	      return;
	    }

	    Events.logEvent(event);
	  },

	  /**
	   * Logs an event to mParticle's servers
	   * @method logEvent
	   * @param {String} eventName The name of the event
	   * @param {Number} [eventType] The eventType as seen [here](http://docs.mparticle.com/developers/sdk/web/event-tracking#event-type)
	   * @param {Object} [eventInfo] Attributes for the event
	   * @param {Object} [customFlags] Additional customFlags
	   */
	  logEvent: function logEvent(eventName, eventType, eventInfo, customFlags) {
	    SessionManager.resetSessionTimer();

	    if (typeof eventName !== 'string') {
	      mParticle$1.Logger.error(Messages$8.ErrorMessages.EventNameInvalidType);
	      return;
	    }

	    if (!eventType) {
	      eventType = Types.EventType.Unknown;
	    }

	    if (!Helpers.isEventType(eventType)) {
	      mParticle$1.Logger.error('Invalid event type: ' + eventType + ', must be one of: \n' + JSON.stringify(Types.EventType));
	      return;
	    }

	    if (!Helpers.canLog()) {
	      mParticle$1.Logger.error(Messages$8.ErrorMessages.LoggingDisabled);
	      return;
	    }

	    Events.logEvent({
	      messageType: Types.MessageType.PageEvent,
	      name: eventName,
	      data: eventInfo,
	      eventType: eventType,
	      customFlags: customFlags
	    });
	  },

	  /**
	   * Used to log custom errors
	   *
	   * @method logError
	   * @param {String or Object} error The name of the error (string), or an object formed as follows {name: 'exampleName', message: 'exampleMessage', stack: 'exampleStack'}
	   * @param {Object} [attrs] Custom attrs to be passed along with the error event; values must be string, number, or boolean
	   */
	  logError: function logError(error, attrs) {
	    SessionManager.resetSessionTimer();

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
	      t: error.stack
	    };

	    if (attrs) {
	      var sanitized = Helpers.sanitizeAttributes(attrs);

	      for (var prop in sanitized) {
	        data[prop] = sanitized[prop];
	      }
	    }

	    Events.logEvent({
	      messageType: Types.MessageType.CrashReport,
	      name: error.name ? error.name : 'Error',
	      data: data,
	      eventType: Types.EventType.Other
	    });
	  },

	  /**
	   * Logs `click` events
	   * @method logLink
	   * @param {String} selector The selector to add a 'click' event to (ex. #purchase-event)
	   * @param {String} [eventName] The name of the event
	   * @param {Number} [eventType] The eventType as seen [here](http://docs.mparticle.com/developers/sdk/javascript/event-tracking#event-type)
	   * @param {Object} [eventInfo] Attributes for the event
	   */
	  logLink: function logLink(selector, eventName, eventType, eventInfo) {
	    SessionManager.resetSessionTimer();
	    Events.addEventHandler('click', selector, eventName, eventInfo, eventType);
	  },

	  /**
	   * Logs `submit` events
	   * @method logForm
	   * @param {String} selector The selector to add the event handler to (ex. #search-event)
	   * @param {String} [eventName] The name of the event
	   * @param {Number} [eventType] The eventType as seen [here](http://docs.mparticle.com/developers/sdk/javascript/event-tracking#event-type)
	   * @param {Object} [eventInfo] Attributes for the event
	   */
	  logForm: function logForm(selector, eventName, eventType, eventInfo) {
	    SessionManager.resetSessionTimer();
	    Events.addEventHandler('submit', selector, eventName, eventInfo, eventType);
	  },

	  /**
	   * Logs a page view
	   * @method logPageView
	   * @param {String} eventName The name of the event. Defaults to 'PageView'.
	   * @param {Object} [attrs] Attributes for the event
	   * @param {Object} [customFlags] Custom flags for the event
	   */
	  logPageView: function logPageView(eventName, attrs, customFlags) {
	    SessionManager.resetSessionTimer();

	    if (Helpers.canLog()) {
	      if (!Validators$4.isStringOrNumber(eventName)) {
	        eventName = 'PageView';
	      }

	      if (!attrs) {
	        attrs = {
	          hostname: window.location.hostname,
	          title: window.document.title
	        };
	      } else if (!Helpers.isObject(attrs)) {
	        mParticle$1.Logger.error('The attributes argument must be an object. A ' + _typeof_1(attrs) + ' was entered. Please correct and retry.');
	        return;
	      }

	      if (customFlags && !Helpers.isObject(customFlags)) {
	        mParticle$1.Logger.error('The customFlags argument must be an object. A ' + _typeof_1(customFlags) + ' was entered. Please correct and retry.');
	        return;
	      }
	    }

	    Events.logEvent({
	      messageType: Types.MessageType.PageView,
	      name: eventName,
	      data: attrs,
	      eventType: Types.EventType.Unknown,
	      customFlags: customFlags
	    });
	  },
	  Consent: {
	    createGDPRConsent: Consent.createGDPRConsent,
	    createConsentState: Consent.createConsentState
	  },

	  /**
	   * Invoke these methods on the mParticle.eCommerce object.
	   * Example: mParticle.eCommerce.createImpresion(...)
	   * @class mParticle.eCommerce
	   */
	  eCommerce: {
	    /**
	     * Invoke these methods on the mParticle.eCommerce.Cart object.
	     * Example: mParticle.eCommerce.Cart.add(...)
	     * @class mParticle.eCommerce.Cart
	     */
	    Cart: {
	      /**
	       * Adds a product to the cart
	       * @method add
	       * @param {Object} product The product you want to add to the cart
	       * @param {Boolean} [logEventBoolean] Option to log the event to mParticle's servers. If blank, no logging occurs.
	       */
	      add: function add(product, logEventBoolean) {
	        var mpid,
	            currentUser = mParticle$1.Identity.getCurrentUser();

	        if (currentUser) {
	          mpid = currentUser.getMPID();
	        }

	        mParticleUserCart$1(mpid).add(product, logEventBoolean);
	      },

	      /**
	       * Removes a product from the cart
	       * @method remove
	       * @param {Object} product The product you want to add to the cart
	       * @param {Boolean} [logEventBoolean] Option to log the event to mParticle's servers. If blank, no logging occurs.
	       */
	      remove: function remove(product, logEventBoolean) {
	        var mpid,
	            currentUser = mParticle$1.Identity.getCurrentUser();

	        if (currentUser) {
	          mpid = currentUser.getMPID();
	        }

	        mParticleUserCart$1(mpid).remove(product, logEventBoolean);
	      },

	      /**
	       * Clears the cart
	       * @method clear
	       */
	      clear: function clear() {
	        var mpid,
	            currentUser = mParticle$1.Identity.getCurrentUser();

	        if (currentUser) {
	          mpid = currentUser.getMPID();
	        }

	        mParticleUserCart$1(mpid).clear();
	      }
	    },

	    /**
	     * Sets the currency code
	     * @for mParticle.eCommerce
	     * @method setCurrencyCode
	     * @param {String} code The currency code
	     */
	    setCurrencyCode: function setCurrencyCode(code) {
	      if (typeof code !== 'string') {
	        mParticle$1.Logger.error('Code must be a string');
	        return;
	      }

	      SessionManager.resetSessionTimer();
	      mParticle$1.Store.currencyCode = code;
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
	      SessionManager.resetSessionTimer();
	      return Ecommerce.createProduct(name, sku, price, quantity, variant, category, brand, position, coupon, attributes);
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
	      SessionManager.resetSessionTimer();
	      return Ecommerce.createPromotion(id, creative, name, position);
	    },

	    /**
	     * Creates a product impression
	     * @for mParticle.eCommerce
	     * @method createImpression
	     * @param {String} name impression name
	     * @param {Object} product the product for which an impression is being created
	     */
	    createImpression: function createImpression(name, product) {
	      SessionManager.resetSessionTimer();
	      return Ecommerce.createImpression(name, product);
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
	      SessionManager.resetSessionTimer();
	      return Ecommerce.createTransactionAttributes(id, affiliation, couponCode, revenue, shipping, tax);
	    },

	    /**
	     * Logs a checkout action
	     * @for mParticle.eCommerce
	     * @method logCheckout
	     * @param {Number} step checkout step number
	     * @param {Object} options
	     * @param {Object} attrs
	     * @param {Object} [customFlags] Custom flags for the event
	     */
	    logCheckout: function logCheckout(step, options, attrs, customFlags) {
	      SessionManager.resetSessionTimer();
	      Events.logCheckoutEvent(step, options, attrs, customFlags);
	    },

	    /**
	     * Logs a product action
	     * @for mParticle.eCommerce
	     * @method logProductAction
	     * @param {Number} productActionType product action type as found [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/src/types.js#L206-L218)
	     * @param {Object} product the product for which you are creating the product action
	     * @param {Object} [attrs] attributes related to the product action
	     * @param {Object} [customFlags] Custom flags for the event
	     */
	    logProductAction: function logProductAction(productActionType, product, attrs, customFlags) {
	      SessionManager.resetSessionTimer();
	      Events.logProductActionEvent(productActionType, product, attrs, customFlags);
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
	     */
	    logPurchase: function logPurchase(transactionAttributes, product, clearCart, attrs, customFlags) {
	      if (!transactionAttributes || !product) {
	        mParticle$1.Logger.error(Messages$8.ErrorMessages.BadLogPurchase);
	        return;
	      }

	      SessionManager.resetSessionTimer();
	      Events.logPurchaseEvent(transactionAttributes, product, attrs, customFlags);

	      if (clearCart === true) {
	        mParticle$1.eCommerce.Cart.clear();
	      }
	    },

	    /**
	     * Logs a product promotion
	     * @for mParticle.eCommerce
	     * @method logPromotion
	     * @param {Number} type the promotion type as found [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/src/types.js#L275-L279)
	     * @param {Object} promotion promotion object
	     * @param {Object} [attrs] boolean to clear the cart after logging or not
	     * @param {Object} [customFlags] Custom flags for the event
	     */
	    logPromotion: function logPromotion(type, promotion, attrs, customFlags) {
	      SessionManager.resetSessionTimer();
	      Events.logPromotionEvent(type, promotion, attrs, customFlags);
	    },

	    /**
	     * Logs a product impression
	     * @for mParticle.eCommerce
	     * @method logImpression
	     * @param {Object} impression product impression object
	     * @param {Object} attrs attributes related to the impression log
	     * @param {Object} [customFlags] Custom flags for the event
	     */
	    logImpression: function logImpression(impression, attrs, customFlags) {
	      SessionManager.resetSessionTimer();
	      Events.logImpressionEvent(impression, attrs, customFlags);
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
	     */
	    logRefund: function logRefund(transactionAttributes, product, clearCart, attrs, customFlags) {
	      SessionManager.resetSessionTimer();
	      Events.logRefundEvent(transactionAttributes, product, attrs, customFlags);

	      if (clearCart === true) {
	        mParticle$1.eCommerce.Cart.clear();
	      }
	    },
	    expandCommerceEvent: function expandCommerceEvent(event) {
	      SessionManager.resetSessionTimer();
	      return Ecommerce.expandCommerceEvent(event);
	    }
	  },

	  /**
	   * Sets a session attribute
	   * @for mParticle
	   * @method setSessionAttribute
	   * @param {String} key key for session attribute
	   * @param {String or Number} value value for session attribute
	   */
	  setSessionAttribute: function setSessionAttribute(key, value) {
	    SessionManager.resetSessionTimer(); // Logs to cookie
	    // And logs to in-memory object
	    // Example: mParticle.setSessionAttribute('location', '33431');

	    if (Helpers.canLog()) {
	      if (!Validators$4.isValidAttributeValue(value)) {
	        mParticle$1.Logger.error(Messages$8.ErrorMessages.BadAttribute);
	        return;
	      }

	      if (!Validators$4.isValidKeyValue(key)) {
	        mParticle$1.Logger.error(Messages$8.ErrorMessages.BadKey);
	        return;
	      }

	      if (mParticle$1.Store.webviewBridgeEnabled) {
	        NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetSessionAttribute, JSON.stringify({
	          key: key,
	          value: value
	        }));
	      } else {
	        var existingProp = Helpers.findKeyInObject(mParticle$1.Store.sessionAttributes, key);

	        if (existingProp) {
	          key = existingProp;
	        }

	        mParticle$1.Store.sessionAttributes[key] = value;
	        Persistence.update();
	        Forwarders.applyToForwarders('setSessionAttribute', [key, value]);
	      }
	    }
	  },

	  /**
	   * Set opt out of logging
	   * @for mParticle
	   * @method setOptOut
	   * @param {Boolean} isOptingOut boolean to opt out or not. When set to true, opt out of logging.
	   */
	  setOptOut: function setOptOut(isOptingOut) {
	    SessionManager.resetSessionTimer();
	    mParticle$1.Store.isEnabled = !isOptingOut;
	    Events.logOptOut();
	    Persistence.update();

	    if (mParticle$1.Store.activeForwarders.length) {
	      mParticle$1.Store.activeForwarders.forEach(function (forwarder) {
	        if (forwarder.setOptOut) {
	          var result = forwarder.setOptOut(isOptingOut);

	          if (result) {
	            mParticle$1.Logger.verbose(result);
	          }
	        }
	      });
	    }
	  },

	  /**
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
	   */
	  setIntegrationAttribute: function setIntegrationAttribute(integrationId, attrs) {
	    if (typeof integrationId !== 'number') {
	      mParticle$1.Logger.error('integrationId must be a number');
	      return;
	    }

	    if (attrs === null) {
	      mParticle$1.Store.integrationAttributes[integrationId] = {};
	    } else if (Helpers.isObject(attrs)) {
	      if (Object.keys(attrs).length === 0) {
	        mParticle$1.Store.integrationAttributes[integrationId] = {};
	      } else {
	        for (var key in attrs) {
	          if (typeof key === 'string') {
	            if (typeof attrs[key] === 'string') {
	              if (Helpers.isObject(mParticle$1.Store.integrationAttributes[integrationId])) {
	                mParticle$1.Store.integrationAttributes[integrationId][key] = attrs[key];
	              } else {
	                mParticle$1.Store.integrationAttributes[integrationId] = {};
	                mParticle$1.Store.integrationAttributes[integrationId][key] = attrs[key];
	              }
	            } else {
	              mParticle$1.Logger.error('Values for integration attributes must be strings. You entered a ' + _typeof_1(attrs[key]));
	              continue;
	            }
	          } else {
	            mParticle$1.Logger.error('Keys must be strings, you entered a ' + _typeof_1(key));
	            continue;
	          }
	        }
	      }
	    } else {
	      mParticle$1.Logger.error('Attrs must be an object with keys and values. You entered a ' + _typeof_1(attrs));
	      return;
	    }

	    Persistence.update();
	  },

	  /**
	   * Get integration attributes for a given integration ID.
	   * @method getIntegrationAttributes
	   * @param {Number} integrationId mParticle integration ID
	   * @return {Object} an object map of the integrationId's attributes
	   */
	  getIntegrationAttributes: function getIntegrationAttributes(integrationId) {
	    if (mParticle$1.Store.integrationAttributes[integrationId]) {
	      return mParticle$1.Store.integrationAttributes[integrationId];
	    } else {
	      return {};
	    }
	  },
	  addForwarder: function addForwarder(forwarder) {
	    mParticle$1.preInit.forwarderConstructors.push(forwarder);
	  },
	  configurePixel: function configurePixel(settings) {
	    Forwarders.configurePixel(settings);
	  },
	  _getActiveForwarders: function _getActiveForwarders() {
	    return mParticle$1.Store.activeForwarders;
	  },
	  _getIntegrationDelays: function _getIntegrationDelays() {
	    return mParticle$1.preInit.integrationDelays;
	  },
	  _setIntegrationDelay: function _setIntegrationDelay(module, _boolean) {
	    mParticle$1.preInit.integrationDelays[module] = _boolean;
	  }
	};

	function completeSDKInitialization(apiKey, config) {
	  mParticle$1.Store.configurationLoaded = true;

	  if (mParticle$1.Store.webviewBridgeEnabled) {
	    NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetSessionAttribute, JSON.stringify({
	      key: '$src_env',
	      value: 'webview'
	    }));

	    if (apiKey) {
	      NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.SetSessionAttribute, JSON.stringify({
	        key: '$src_key',
	        value: apiKey
	      }));
	    }
	  } else {
	    var currentUser; // If no initialIdentityRequest is passed in, we set the user identities to what is currently in cookies for the identify request

	    if (Helpers.isObject(mParticle$1.Store.SDKConfig.identifyRequest) && Helpers.isObject(mParticle$1.Store.SDKConfig.identifyRequest.userIdentities) && Object.keys(mParticle$1.Store.SDKConfig.identifyRequest.userIdentities).length === 0 || !mParticle$1.Store.SDKConfig.identifyRequest) {
	      var modifiedUIforIdentityRequest = {};
	      currentUser = mParticle$1.Identity.getCurrentUser();

	      if (currentUser) {
	        var identities = currentUser.getUserIdentities().userIdentities || {};

	        for (var identityKey in identities) {
	          if (identities.hasOwnProperty(identityKey)) {
	            modifiedUIforIdentityRequest[identityKey] = identities[identityKey];
	          }
	        }
	      }

	      mParticle$1.Store.SDKConfig.identifyRequest = {
	        userIdentities: modifiedUIforIdentityRequest
	      };
	    } // If migrating from pre-IDSync to IDSync, a sessionID will exist and an identify request will not have been fired, so we need this check


	    if (mParticle$1.Store.migratingToIDSyncCookies) {
	      IdentityAPI$2.identify(mParticle$1.Store.SDKConfig.identifyRequest, mParticle$1.Store.SDKConfig.identityCallback);
	      mParticle$1.Store.migratingToIDSyncCookies = false;
	    }

	    currentUser = IdentityAPI$2.getCurrentUser();

	    if (Helpers.getFeatureFlag(Constants.FeatureFlags.ReportBatching)) {
	      startForwardingStatsTimer();
	    }

	    Forwarders.processForwarders(config, ApiClient.prepareForwardingStats); // Call mParticle.Store.SDKConfig.identityCallback when identify was not called due to a reload or a sessionId already existing

	    if (!mParticle$1.Store.identifyCalled && mParticle$1.Store.SDKConfig.identityCallback && currentUser && currentUser.getMPID()) {
	      mParticle$1.Store.SDKConfig.identityCallback({
	        httpCode: HTTPCodes$2.activeSession,
	        getUser: function getUser() {
	          return mParticleUser$1(currentUser.getMPID());
	        },
	        getPreviousUser: function getPreviousUser() {
	          var users = mParticle$1.Identity.getUsers();
	          var mostRecentUser = users.shift();

	          if (mostRecentUser && currentUser && mostRecentUser.getMPID() === currentUser.getMPID()) {
	            mostRecentUser = users.shift();
	          }

	          return mostRecentUser || null;
	        },
	        body: {
	          mpid: currentUser.getMPID(),
	          is_logged_in: mParticle$1.Store.isLoggedIn,
	          matched_identities: currentUser.getUserIdentities().userIdentities,
	          context: null,
	          is_ephemeral: false
	        }
	      });
	    }

	    mParticle$1.sessionManager.initialize();
	    Events.logAST();
	  } // Call any functions that are waiting for the library to be initialized


	  if (mParticle$1.preInit.readyQueue && mParticle$1.preInit.readyQueue.length) {
	    mParticle$1.preInit.readyQueue.forEach(function (readyQueueItem) {
	      if (Validators$4.isFunction(readyQueueItem)) {
	        readyQueueItem();
	      } else if (Array.isArray(readyQueueItem)) {
	        processPreloadedItem(readyQueueItem);
	      }
	    });
	    mParticle$1.preInit.readyQueue = [];
	  }

	  mParticle$1.Store.isInitialized = true;

	  if (mParticle$1.Store.isFirstRun) {
	    mParticle$1.Store.isFirstRun = false;
	  }
	}

	function runPreConfigFetchInitialization(apiKey, config) {
	  mParticle$1.Logger = new Logger(config);
	  mParticle$1.Store = new Store(config, mParticle$1.Logger);
	  mParticle$1.Store.devToken = apiKey || null;
	  mParticle$1.Logger.verbose(Messages$8.InformationMessages.StartingInitialization); //check to see if localStorage is available for migrating purposes

	  mParticle$1.Store.isLocalStorageAvailable = Persistence.determineLocalStorageAvailability(window.localStorage);
	  mParticle$1.Store.webviewBridgeEnabled = NativeSdkHelpers.isWebviewEnabled(mParticle$1.Store.SDKConfig.requiredWebviewBridgeName, mParticle$1.Store.SDKConfig.minWebviewBridgeVersion);

	  if (!mParticle$1.Store.webviewBridgeEnabled) {
	    // Migrate any cookies from previous versions to current cookie version
	    Migrations.migrate(); // Load any settings/identities/attributes from cookie or localStorage

	    Persistence.initializeStorage();
	  }
	}

	function processPreloadedItem(readyQueueItem) {
	  var args = readyQueueItem,
	      method = args.splice(0, 1)[0]; // if the first argument is a method on the base mParticle object, run it

	  if (mParticle$1[args[0]]) {
	    mParticle$1[method].apply(this, args); // otherwise, the method is on either eCommerce or Identity objects, ie. "eCommerce.setCurrencyCode", "Identity.login"
	  } else {
	    var methodArray = method.split('.');

	    try {
	      var computedMPFunction = mParticle$1;

	      for (var i = 0; i < methodArray.length; i++) {
	        var currentMethod = methodArray[i];
	        computedMPFunction = computedMPFunction[currentMethod];
	      }

	      computedMPFunction.apply(this, args);
	    } catch (e) {
	      mParticle$1.Logger.verbose('Unable to compute proper mParticle function ' + e);
	    }
	  }
	}

	mParticle$1.preInit = {
	  readyQueue: [],
	  integrationDelays: {},
	  forwarderConstructors: []
	};

	if (window.mParticle && window.mParticle.config) {
	  if (window.mParticle.config.hasOwnProperty('rq')) {
	    mParticle$1.preInit.readyQueue = window.mParticle.config.rq;
	  }
	}

	window.mParticle = mParticle$1;

	return mParticle$1;

}());
