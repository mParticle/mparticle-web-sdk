import { version } from '../package.json';

var Constants = {
    sdkVersion: version,
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
            BadLogPurchase:
                'Transaction attributes and a product are both required to log a purchase, https://docs.mparticle.com/?javascript#measuring-transactions',
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
            AbandonLogEvent:
                'Cannot log event, logging disabled or developer token not set',
            AbandonAliasUsers:
                'Cannot Alias Users, logging disabled or developer token not set',
            AbandonStartSession:
                'Cannot start session, logging disabled or developer token not set',
            AbandonEndSession:
                'Cannot end session, logging disabled or developer token not set',
            NoSessionToEnd: 'Cannot end session, no active session found',
        },
        ValidationMessages: {
            ModifyIdentityRequestUserIdentitiesPresent:
                'identityRequests to modify require userIdentities to be present. Request not sent to server. Please fix and try again',
            IdentityRequesetInvalidKey:
                'There is an invalid key on your identityRequest object. It can only contain a `userIdentities` object and a `onUserAlias` function. Request not sent to server. Please fix and try again.',
            OnUserAliasType:
                'The onUserAlias value must be a function. The onUserAlias provided is of type',
            UserIdentities:
                'The userIdentities key must be an object with keys of identityTypes and values of strings. Request not sent to server. Please fix and try again.',
            UserIdentitiesInvalidKey:
                'There is an invalid identity key on your `userIdentities` object within the identityRequest. Request not sent to server. Please fix and try again.',
            UserIdentitiesInvalidValues:
                'All user identity values must be strings or null. Request not sent to server. Please fix and try again.',
            AliasMissingMpid:
                'Alias Request must contain both a destinationMpid and a sourceMpid',
            AliasNonUniqueMpid:
                "Alias Request's destinationMpid and sourceMpid must be unique",
            AliasMissingTime:
                'Alias Request must have both a startTime and an endTime',
            AliasStartBeforeEndTime:
                "Alias Request's endTime must be later than its startTime",
        },
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
        Upload: 'upload',
    },
    StorageNames: {
        localStorageName: 'mprtcl-api', // Name of the mP localstorage, had cp and pb even if cookies were used, skipped v2
        localStorageNameV3: 'mprtcl-v3', // v3 Name of the mP localstorage, final version on SDKv1
        cookieName: 'mprtcl-api', // v1 Name of the cookie stored on the user's machine
        cookieNameV2: 'mprtcl-v2', // v2 Name of the cookie stored on the user's machine. Removed keys with no values, moved cartProducts and productBags to localStorage.
        cookieNameV3: 'mprtcl-v3', // v3 Name of the cookie stored on the user's machine. Base64 encoded keys in Base64CookieKeys object, final version on SDKv1
        localStorageNameV4: 'mprtcl-v4', // v4 Name of the mP localstorage, Current Version
        localStorageProductsV4: 'mprtcl-prodv4', // The name for mP localstorage that contains products for cartProducs and productBags
        cookieNameV4: 'mprtcl-v4', // v4 Name of the cookie stored on the user's machine. Base64 encoded keys in Base64CookieKeys object, current version on SDK v2
        currentStorageName: 'mprtcl-v4',
        currentStorageProductsName: 'mprtcl-prodv4',
    },
    DefaultConfig: {
        cookieDomain: null, // If null, defaults to current location.host
        cookieExpiration: 365, // Cookie expiration time in days
        logLevel: null, // What logging will be provided in the console
        timeout: 300, // timeout in milliseconds for logging functions
        sessionTimeout: 30, // Session timeout in minutes
        maxProducts: 20, // Number of products persisted in cartProducts and productBags
        forwarderStatsTimeout: 5000, // Milliseconds for forwarderStats timeout
        integrationDelayTimeout: 5000, // Milliseconds for forcing the integration delay to un-suspend event queueing due to integration partner errors
        maxCookieSize: 3000, // Number of bytes for cookie size to not exceed
        aliasMaxWindow: 90, // Max age of Alias request startTime, in days
        uploadInterval: 0, // Maximum milliseconds in between batch uploads, below 500 will mean immediate upload
    },
    DefaultUrls: {
        v1SecureServiceUrl: 'jssdks.mparticle.com/v1/JS/',
        v2SecureServiceUrl: 'jssdks.mparticle.com/v2/JS/',
        v3SecureServiceUrl: 'jssdks.mparticle.com/v3/JS/',
        configUrl: 'jssdkcdns.mparticle.com/JS/v2/',
        identityUrl: 'identity.mparticle.com/v1/',
        aliasUrl: 'jssdks.mparticle.com/v1/identity/',
    },
    Base64CookieKeys: {
        csm: 1,
        sa: 1,
        ss: 1,
        ua: 1,
        ui: 1,
        csd: 1,
        ia: 1,
        con: 1,
    },
    SDKv2NonMPIDCookieKeys: {
        gs: 1,
        cu: 1,
        l: 1,
        globalSettings: 1,
        currentUserMPID: 1,
    },
    HTTPCodes: {
        noHttpCoverage: -1,
        activeIdentityRequest: -2,
        activeSession: -3,
        validationIssue: -4,
        nativeIdentityRequest: -5,
        loggingDisabledOrMissingAPIKey: -6,
        tooManyRequests: 429,
    },
    FeatureFlags: {
        ReportBatching: 'reportBatching',
        EventsV3: 'eventsV3',
        EventBatchingIntervalMillis: 'eventBatchingIntervalMillis',
    },
    DefaultInstance: 'default_instance',
};

export default Constants;
