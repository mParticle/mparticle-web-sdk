var Constants = require('./constants'),
    Helpers = require('./helpers'),
    Validators = Helpers.Validators;

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

function Store(config, config2) {
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
        activeForwarders: []
    };

    for (var key in defaultStore) {
        this[key] = defaultStore[key];
    }

    this.storageName = Helpers.createMainStorageName(config.workspaceToken);
    this.prodStorageName = Helpers.createProductStorageName(config.workspaceToken);
    this.integrationDelayTimeoutStart = Date.now();

    var mergedConfigs = Helpers.mergeConfigs(config, config2);

    this.SDKConfig = createSDKConfig(mergedConfigs);
    // Set configuration to default settings
    if (mergedConfigs) {
        if (mergedConfigs.hasOwnProperty('secureServiceUrl')) {
            this.SDKConfig.secureServiceUrl = mergedConfigs.secureServiceUrl;
        }

        if (mergedConfigs.hasOwnProperty('v2SecureServiceUrl')) {
            this.SDKConfig.v2SecureServiceUrl = mergedConfigs.v2SecureServiceUrl;
        }
        if (mergedConfigs.hasOwnProperty('identityUrl')) {
            this.SDKConfig.identityUrl = mergedConfigs.identityUrl;
        }

        if (mergedConfigs.hasOwnProperty('aliasUrl')) {
            this.SDKConfig.aliasUrl = mergedConfigs.aliasUrl;
        }

        if (mergedConfigs.hasOwnProperty('logLevel')) {
            this.SDKConfig.logLevel = mergedConfigs.logLevel;
        }

        if (mergedConfigs.hasOwnProperty('useNativeSdk')) {
            this.SDKConfig.useNativeSdk = mergedConfigs.useNativeSdk;
        } else {
            this.SDKConfig.useNativeSdk = false;
        }

        if (mergedConfigs.hasOwnProperty('isIOS')) {
            this.SDKConfig.isIOS = mergedConfigs.isIOS;
        } else {
            this.SDKConfig.isIOS = mParticle.isIOS || false;
        }

        if (mergedConfigs.hasOwnProperty('useCookieStorage')) {
            this.SDKConfig.useCookieStorage = mergedConfigs.useCookieStorage;
        } else {
            this.SDKConfig.useCookieStorage = false;
        }

        if (mergedConfigs.hasOwnProperty('maxProducts')) {
            this.SDKConfig.maxProducts = mergedConfigs.maxProducts;
        } else {
            this.SDKConfig.maxProducts = Constants.DefaultConfig.maxProducts;
        }

        if (mergedConfigs.hasOwnProperty('maxCookieSize')) {
            this.SDKConfig.maxCookieSize = mergedConfigs.maxCookieSize;
        } else {
            this.SDKConfig.maxCookieSize = Constants.DefaultConfig.maxCookieSize;
        }

        if (mergedConfigs.hasOwnProperty('appName')) {
            this.SDKConfig.appName = mergedConfigs.appName;
        }

        if (mergedConfigs.hasOwnProperty('integrationDelayTimeout')) {
            this.SDKConfig.integrationDelayTimeout = mergedConfigs.integrationDelayTimeout;
        } else {
            this.SDKConfig.integrationDelayTimeout = Constants.DefaultConfig.integrationDelayTimeout;
        }

        if (mergedConfigs.hasOwnProperty('identifyRequest')) {
            this.SDKConfig.identifyRequest = mergedConfigs.identifyRequest;
        }

        if (mergedConfigs.hasOwnProperty('identityCallback')) {
            var callback = mergedConfigs.identityCallback;
            if (Validators.isFunction(callback)) {
                this.SDKConfig.identityCallback = mergedConfigs.identityCallback;
            } else {
                mParticle.Logger.warning('The optional callback must be a function. You tried entering a(n) ' + typeof callback, ' . Callback not set. Please set your callback again.');
            }
        }

        if (mergedConfigs.hasOwnProperty('appVersion')) {
            this.SDKConfig.appVersion = mergedConfigs.appVersion;
        }

        if (mergedConfigs.hasOwnProperty('sessionTimeout')) {
            this.SDKConfig.sessionTimeout = mergedConfigs.sessionTimeout;
        }

        if (mergedConfigs.hasOwnProperty('forceHttps')) {
            this.SDKConfig.forceHttps = mergedConfigs.forceHttps;
        } else {
            this.SDKConfig.forceHttps = true;
        }

        // Some forwarders require custom flags on initialization, so allow them to be set using mergedConfigs object
        if (mergedConfigs.hasOwnProperty('customFlags')) {
            this.SDKConfig.customFlags = mergedConfigs.customFlags;
        }

        if (mergedConfigs.hasOwnProperty('workspaceToken')) {
            this.SDKConfig.workspaceToken = mergedConfigs.workspaceToken;
        }

        if (mergedConfigs.hasOwnProperty('requiredWebviewBridgeName')) {
            this.SDKConfig.requiredWebviewBridgeName = mergedConfigs.requiredWebviewBridgeName;
        } else if (mergedConfigs.hasOwnProperty('workspaceToken')) {
            this.SDKConfig.requiredWebviewBridgeName = mergedConfigs.workspaceToken;
        }

        if (mergedConfigs.hasOwnProperty('minWebviewBridgeVersion')) {
            this.SDKConfig.minWebviewBridgeVersion = mergedConfigs.minWebviewBridgeVersion;
        }

        if (mergedConfigs.hasOwnProperty('aliasMaxWindow')) {
            this.SDKConfig.aliasMaxWindow = mergedConfigs.aliasMaxWindow;
        } else {
            this.SDKConfig.aliasMaxWindow = Constants.DefaultConfig.aliasMaxWindow;
        }
    }
}

module.exports = Store;
