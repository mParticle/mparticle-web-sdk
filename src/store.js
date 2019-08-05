import Constants from './constants';
import Helpers from './helpers';

var Validators = Helpers.Validators;

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

export default function Store(config, logger) {
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

    this.SDKConfig = createSDKConfig(config);
    // Set configuration to default settings
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
            if (Validators.isFunction(callback)) {
                this.SDKConfig.identityCallback = config.identityCallback;
            } else {
                logger.warning('The optional callback must be a function. You tried entering a(n) ' + typeof callback, ' . Callback not set. Please set your callback again.');
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
        }

        // Some forwarders require custom flags on initialization, so allow them to be set using config object
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
    }
}