var v1ServiceUrl = 'jssdk.mparticle.com/v1/JS/',
    v1SecureServiceUrl = 'jssdks.mparticle.com/v1/JS/',
    v2ServiceUrl = 'jssdk.mparticle.com/v2/JS/',
    v2SecureServiceUrl = 'jssdks.mparticle.com/v2/JS/',
    identityUrl = 'https://identity.mparticle.com/v1/', //prod
    sdkVersion = '2.2.3',
    sdkVendor = 'mparticle',
    platform = 'web',
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
        LocalStorageName: 'mprtcl-api',             // Name of the mP localstorage, had cp and pb even if cookies were used, skipped v2
        LocalStorageNameV3: 'mprtcl-v3',            // v3 Name of the mP localstorage, final version on SDKv1
        LocalStorageNameV4: 'mprtcl-v4',            // v4 Name of the mP localstorage, Current Version
        LocalStorageProductsV4: 'mprtcl-prodv4',    // The name for mP localstorage that contains products for cartProducs and productBags
        CookieName: 'mprtcl-api',                   // v1 Name of the cookie stored on the user's machine
        CookieNameV2: 'mprtcl-v2',                  // v2 Name of the cookie stored on the user's machine. Removed keys with no values, moved cartProducts and productBags to localStorage.
        CookieNameV3: 'mprtcl-v3',                  // v3 Name of the cookie stored on the user's machine. Base64 encoded keys in Base64CookieKeys object, final version on SDKv1
        CookieNameV4: 'mprtcl-v4',                  // v4 Name of the cookie stored on the user's machine. Base64 encoded keys in Base64CookieKeys object, current version on SDK v2
        CookieDomain: null, 			            // If null, defaults to current location.host
        Debug: false,					            // If true, will print debug messages to browser console
        CookieExpiration: 365,			            // Cookie expiration time in days
        Verbose: false,					            // Whether the server will return verbose responses
        IncludeReferrer: true,			            // Include user's referrer
        IncludeGoogleAdwords: true,		            // Include utm_source and utm_properties
        Timeout: 300,					            // Timeout in milliseconds for logging functions
        SessionTimeout: 30,				            // Session timeout in minutes
        Sandbox: false,                             // Events are marked as debug and only forwarded to debug forwarders,
        Version: null,                              // The version of this website/app
        MaxProducts: 20                             // Number of products persisted in cartProducts and productBags
    },
    Base64CookieKeys = {
        csm: 1,
        sa: 1,
        ss: 1,
        ua: 1,
        ui: 1,
        csd: 1
    },
    SDKv2NonMPIDCookieKeys = {
        gs: 1,
        cu: 1,
        globalSettings: 1,
        currentUserMPID: 1
    };

module.exports = {
    v1ServiceUrl: v1ServiceUrl,
    v1SecureServiceUrl: v1SecureServiceUrl,
    v2ServiceUrl: v2ServiceUrl,
    v2SecureServiceUrl: v2SecureServiceUrl,
    identityUrl: identityUrl,
    sdkVersion: sdkVersion,
    sdkVendor: sdkVendor,
    platform: platform,
    Messages: Messages,
    NativeSdkPaths: NativeSdkPaths,
    DefaultConfig: DefaultConfig,
    Base64CookieKeys:Base64CookieKeys,
    SDKv2NonMPIDCookieKeys: SDKv2NonMPIDCookieKeys
};
