import Polyfill from './polyfill';
import Types from './types';
import Constants from './constants';
import mParticleInstance from './mp-instance.js';
import _BatchValidator from './mockBatchCreator';

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

function mParticle() {
    var self = this;
    // Only leaving this here in case any clients are trying to access mParticle.Store, to prevent from throwing
    this.Store = {};
    this._instances = {};
    this.IdentityType = Types.IdentityType;
    this.EventType = Types.EventType;
    this.CommerceEventType = Types.CommerceEventType;
    this.PromotionType = Types.PromotionActionType;
    this.ProductActionType = Types.ProductActionType;
    if (typeof window !== 'undefined') {
        this.isIOS =
            window.mParticle && window.mParticle.isIOS
                ? window.mParticle.isIOS
                : false;
        this.config =
            window.mParticle && window.mParticle.config
                ? window.mParticle.config
                : {};
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
    this.init = function(apiKey, config, instanceName) {
        if (!config && (window.mParticle && window.mParticle.config)) {
            console.warn(
                'You did not pass a config object to mParticle.init(). Attempting to use the window.mParticle.config if it exists. Please note that in a future release, this may not work and mParticle will not initialize properly'
            );
            config = window.mParticle ? window.mParticle.config : {};
        }

        instanceName = (!instanceName || instanceName.length === 0
            ? Constants.DefaultInstance
            : instanceName
        ).toLowerCase();
        var client = self._instances[instanceName];
        if (client === undefined) {
            client = new mParticleInstance(apiKey, config, instanceName);
            self._instances[instanceName] = client;
        }

        client.init(apiKey, config, instanceName);
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
                console.log(
                    'You tried to initialize an instance named ' +
                        instanceName +
                        '. This instance does not exist. Check your instance name or initialize a new instance with this name before calling it.'
                );
                return null;
            }
            return client;
        }
    };
    this.getDeviceId = function() {
        return self.getInstance().getDeviceId();
    };
    this.startNewSession = function() {
        self.getInstance().startNewSession();
    };
    this.endSession = function() {
        self.getInstance().endSession();
    };
    this.setLogLevel = function(newLogLevel) {
        self.getInstance().setLogLevel(newLogLevel);
    };
    this.ready = function(argument) {
        self.getInstance().ready(argument);
    };
    this.setAppVersion = function(version) {
        self.getInstance().setAppVersion(version);
    };

    this.getAppName = function() {
        return self.getInstance().getAppName();
    };
    this.setAppName = function(name) {
        self.getInstance().setAppName(name);
    };
    this.getAppVersion = function() {
        return self.getInstance().getAppVersion();
    };
    this.stopTrackingLocation = function() {
        self.getInstance().stopTrackingLocation();
    };
    this.startTrackingLocation = function(callback) {
        self.getInstance().startTrackingLocation(callback);
    };
    this.setPosition = function(lat, lng) {
        self.getInstance().setPosition(lat, lng);
    };
    this.startNewSession = function() {
        self.getInstance().startNewSession();
    };
    this.endSession = function() {
        self.getInstance().endSession();
    };
    this.logBaseEvent = function(event) {
        self.getInstance().logBaseEvent(event);
    };
    this.logEvent = function(eventName, eventType, eventInfo, customFlags) {
        self.getInstance().logEvent(
            eventName,
            eventType,
            eventInfo,
            customFlags
        );
    };
    this.logError = function(error, attrs) {
        self.getInstance().logError(error, attrs);
    };
    this.logLink = function(selector, eventName, eventType, eventInfo) {
        self.getInstance().logLink(selector, eventName, eventType, eventInfo);
    };
    this.logForm = function(selector, eventName, eventType, eventInfo) {
        self.getInstance().logForm(selector, eventName, eventType, eventInfo);
    };
    this.logPageView = function(eventName, attrs, customFlags) {
        self.getInstance().logPageView(eventName, attrs, customFlags);
    };
    this.upload = function() {
        self.getInstance().upload();
    };
    this.eCommerce = {
        Cart: {
            add: function(product, logEventBoolean) {
                self.getInstance().eCommerce.Cart.add(product, logEventBoolean);
            },
            remove: function(product, logEventBoolean) {
                self.getInstance().eCommerce.Cart.remove(
                    product,
                    logEventBoolean
                );
            },
            clear: function() {
                self.getInstance().eCommerce.Cart.clear();
            },
        },
        setCurrencyCode: function(code) {
            self.getInstance().eCommerce.setCurrencyCode(code);
        },
        createProduct: function(
            name,
            sku,
            price,
            quantity,
            variant,
            category,
            brand,
            position,
            coupon,
            attributes
        ) {
            return self
                .getInstance()
                .eCommerce.createProduct(
                    name,
                    sku,
                    price,
                    quantity,
                    variant,
                    category,
                    brand,
                    position,
                    coupon,
                    attributes
                );
        },
        createPromotion: function(id, creative, name, position) {
            return self
                .getInstance()
                .eCommerce.createPromotion(id, creative, name, position);
        },
        createImpression: function(name, product) {
            return self.getInstance().eCommerce.createImpression(name, product);
        },
        createTransactionAttributes: function(
            id,
            affiliation,
            couponCode,
            revenue,
            shipping,
            tax
        ) {
            return self
                .getInstance()
                .eCommerce.createTransactionAttributes(
                    id,
                    affiliation,
                    couponCode,
                    revenue,
                    shipping,
                    tax
                );
        },
        logCheckout: function(step, options, attrs, customFlags) {
            self.getInstance().eCommerce.logCheckout(
                step,
                options,
                attrs,
                customFlags
            );
        },
        logProductAction: function(
            productActionType,
            product,
            attrs,
            customFlags,
            transactionAttributes
        ) {
            self.getInstance().eCommerce.logProductAction(
                productActionType,
                product,
                attrs,
                customFlags,
                transactionAttributes
            );
        },
        logPurchase: function(
            transactionAttributes,
            product,
            clearCart,
            attrs,
            customFlags
        ) {
            self.getInstance().eCommerce.logPurchase(
                transactionAttributes,
                product,
                clearCart,
                attrs,
                customFlags
            );
        },
        logPromotion: function(type, promotion, attrs, customFlags) {
            self.getInstance().eCommerce.logPromotion(
                type,
                promotion,
                attrs,
                customFlags
            );
        },
        logImpression: function(impression, attrs, customFlags) {
            self.getInstance().eCommerce.logImpression(
                impression,
                attrs,
                customFlags
            );
        },
        logRefund: function(
            transactionAttributes,
            product,
            clearCart,
            attrs,
            customFlags
        ) {
            self.getInstance().eCommerce.logRefund(
                transactionAttributes,
                product,
                clearCart,
                attrs,
                customFlags
            );
        },
        expandCommerceEvent: function(event) {
            return self.getInstance().eCommerce.expandCommerceEvent(event);
        },
    };
    this.setSessionAttribute = function(key, value) {
        self.getInstance().setSessionAttribute(key, value);
    };
    this.setOptOut = function(isOptingOut) {
        self.getInstance().setOptOut(isOptingOut);
    };
    this.setIntegrationAttribute = function(integrationId, attrs) {
        self.getInstance().setIntegrationAttribute(integrationId, attrs);
    };
    this.getIntegrationAttributes = function(moduleId) {
        return self.getInstance().getIntegrationAttributes(moduleId);
    };

    this.Identity = {
        HTTPCodes: self.getInstance().Identity.HTTPCodes,
        aliasUsers: function(aliasRequest, callback) {
            self.getInstance().Identity.aliasUsers(aliasRequest, callback);
        },
        createAliasRequest: function(sourceUser, destinationUser) {
            return self
                .getInstance()
                .Identity.createAliasRequest(sourceUser, destinationUser);
        },
        getCurrentUser: function() {
            return self.getInstance().Identity.getCurrentUser();
        },
        getUser: function(mpid) {
            return self.getInstance().Identity.getUser(mpid);
        },
        getUsers: function() {
            return self.getInstance().Identity.getUsers();
        },
        identify: function(identityApiData, callback) {
            self.getInstance().Identity.identify(identityApiData, callback);
        },
        login: function(identityApiData, callback) {
            self.getInstance().Identity.login(identityApiData, callback);
        },
        logout: function(identityApiData, callback) {
            self.getInstance().Identity.logout(identityApiData, callback);
        },
        modify: function(identityApiData, callback) {
            self.getInstance().Identity.modify(identityApiData, callback);
        },
    };

    this.sessionManager = {
        getSession: function() {
            return self.getInstance()._SessionManager.getSession();
        },
    };

    this.Consent = {
        createConsentState: function() {
            return self.getInstance().Consent.createConsentState();
        },
        createGDPRConsent: function(
            consented,
            timestamp,
            consentDocument,
            location,
            hardwareId
        ) {
            return self
                .getInstance()
                .Consent.createGDPRConsent(
                    consented,
                    timestamp,
                    consentDocument,
                    location,
                    hardwareId
                );
        },
        createCCPAConsent: function(
            consented,
            timestamp,
            consentDocument,
            location,
            hardwareId
        ) {
            return self
                .getInstance()
                .Consent.createGDPRConsent(
                    consented,
                    timestamp,
                    consentDocument,
                    location,
                    hardwareId
                );
        },
    };

    this.reset = function() {
        self.getInstance().reset(self.getInstance());
    };

    this._resetForTests = function(MPConfig, keepPersistence) {
        if (typeof keepPersistence === 'boolean') {
            self.getInstance()._resetForTests(
                MPConfig,
                keepPersistence,
                self.getInstance()
            );
        } else {
            self.getInstance()._resetForTests(
                MPConfig,
                false,
                self.getInstance()
            );
        }
    };

    this.configurePixel = function(settings) {
        self.getInstance().configurePixel(settings);
    };

    this._setIntegrationDelay = function(moduleId, boolean) {
        self.getInstance()._setIntegrationDelay(moduleId, boolean);
    };
    this._getIntegrationDelays = function() {
        return self.getInstance()._getIntegrationDelays();
    };
    this.getVersion = function() {
        return self.getInstance().getVersion();
    };
    this.generateHash = function(string) {
        return self.getInstance().generateHash(string);
    };
    this.addForwarder = function(forwarder) {
        self.getInstance().addForwarder(forwarder);
    };
    this._getActiveForwarders = function() {
        return self.getInstance()._getActiveForwarders();
    };
}

var mparticleInstance = new mParticle();

if (typeof window !== 'undefined') {
    window.mParticle = mparticleInstance;
    window.mParticle._BatchValidator = new _BatchValidator();
}

export default mparticleInstance;
