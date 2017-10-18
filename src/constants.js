var serviceUrl = 'jssdk.mparticle.com/v2/JS/',
    secureServiceUrl = 'jssdks.mparticle.com/v2/JS/',
    identityUrl = 'https://identity.mparticle.com/v1/', //prod
    sdkVersion = '2.0.9',
    sdkVendor = 'mparticle',
    platform = 'web',
    METHOD_NAME = '$MethodName',
    LOG_LTV = 'LogLTVIncrease',
    RESERVED_KEY_LTV = '$Amount',
    Messages = {
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
            SendIdentityHttp: 'Sending event to mParticle HTTP service',
            StartingNewSession: 'Starting new Session',
            StartingLogEvent: 'Starting to log event',
            StartingLogOptOut: 'Starting to log user opt in/out',
            StartingEndSession: 'Starting to end session',
            StartingInitialization: 'Starting to initialize',
            StartingLogCommerceEvent: 'Starting to log commerce event',
            LoadingConfig: 'Loading configuration options',
            AbandonLogEvent: 'Cannot log event, logging disabled or developer token not set',
            AbandonStartSession: 'Cannot start session, logging disabled or developer token not set',
            AbandonEndSession: 'Cannot end session, logging disabled or developer token not set',
            NoSessionToEnd: 'Cannot end session, no active session found'
        }
    },

    NativeSdkPaths = {
        LogEvent: 'logEvent',
        SetUserTag: 'setUserTag',
        RemoveUserTag: 'removeUserTag',
        SetUserAttribute: 'setUserAttribute',
        RemoveUserAttribute: 'removeUserAttribute',
        SetSessionAttribute: 'setSessionAttribute',
        AddToProductBag: 'addToProductBag',
        RemoveFromProductBag: 'removeFromProductBag',
        ClearProductBag: 'clearProductBag',
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
        Modify: 'modify'
    },

    DefaultConfig = {
        LocalStorageName: 'mprtcl-api', // Name of the mP localstorage data stored on the user's machine
        CookieName: 'mprtcl-api',       // Name of the cookie stored on the user's machine
        CookieDomain: null, 			// If null, defaults to current location.host
        Debug: false,					// If true, will print debug messages to browser console
        CookieExpiration: 365,			// Cookie expiration time in days
        Verbose: false,					// Whether the server will return verbose responses
        IncludeReferrer: true,			// Include user's referrer
        IncludeGoogleAdwords: true,		// Include utm_source and utm_properties
        Timeout: 300,					// Timeout in milliseconds for logging functions
        SessionTimeout: 30,				// Session timeout in minutes
        Sandbox: false,                 // Events are marked as debug and only forwarded to debug forwarders,
        Version: null,                  // The version of this website/app
        MaxProducts: 20                 // Number of products persisted in
    };

module.exports = {
    serviceUrl: serviceUrl,
    secureServiceUrl: secureServiceUrl,
    identityUrl: identityUrl,
    sdkVersion: sdkVersion,
    sdkVendor: sdkVendor,
    platform: platform,
    METHOD_NAME: METHOD_NAME,
    LOG_LTV: LOG_LTV,
    RESERVED_KEY_LTV: RESERVED_KEY_LTV,
    Messages: Messages,
    NativeSdkPaths: NativeSdkPaths,
    DefaultConfig: DefaultConfig
};
