//
//  Copyright 2017 mParticle, Inc.
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//
//  Uses portions of code from jQuery
//  jQuery v1.10.2 | (c) 2005, 2013 jQuery Foundation, Inc. | jquery.org/license

import { EventType, IdentityType, CommerceEventType, PromotionActionType, ProductActionType, MessageType } from './types';
import Constants from './constants';
import APIClient, { IAPIClient } from './apiClient';
import Helpers from './helpers';
import NativeSdkHelpers from './nativeSdkHelpers';
import CookieSyncManager, { ICookieSyncManager } from './cookieSyncManager';
import SessionManager, { ISessionManager } from './sessionManager';
import Ecommerce from './ecommerce';
import Store, { IStore } from './store';
import Logger from './logger';
import Persistence from './persistence';
import Events from './events';
import Forwarders from './forwarders';
import ServerModel, { IServerModel } from './serverModel';
import ForwardingStatsUploader from './forwardingStatsUploader';
import Identity from './identity';
import Consent, { IConsent } from './consent';
import KitBlocker from './kitBlocking';
import ConfigAPIClient, { IKitConfigs } from './configAPIClient';
import IdentityAPIClient from './identityApiClient';
import { isFunction, parseConfig, valueof } from './utils';
import { LocalStorageVault } from './vault';
import { removeExpiredIdentityCacheDates } from './identity-utils';
import IntegrationCapture from './integrationCapture';
import { IPreInit, processReadyQueue } from './pre-init-utils';
import { BaseEvent, MParticleWebSDK, SDKHelpersApi } from './sdkRuntimeModels';
import { Dictionary, SDKEventAttrs } from '@mparticle/web-sdk';
import { IIdentity } from './identity.interfaces';
import { IEvents } from './events.interfaces';
import { IECommerce } from './ecommerce.interfaces';
import { INativeSdkHelpers } from './nativeSdkHelpers.interfaces';
import { IPersistence } from './persistence.interfaces';
import ForegroundTimer from './foregroundTimeTracker';
import RoktManager, { IRoktOptions } from './roktManager';
import filteredMparticleUser from './filteredMparticleUser';

export interface IErrorLogMessage {
    message?: string;
    name?: string;
    stack?: string;
}

export interface IErrorLogMessageMinified {
    m?: string;
    s?: string;
    t?: string;
}

export type IntegrationDelays = Dictionary<boolean>;

// https://go.mparticle.com/work/SQDSDKS-6949
export interface IMParticleWebSDKInstance extends MParticleWebSDK {
    // Private Properties
    _APIClient: IAPIClient;
    _Consent: IConsent;
    _CookieSyncManager: ICookieSyncManager;
    _Ecommerce: IECommerce;
    _Events: IEvents;
    _Forwarders: any; // https://go.mparticle.com/work/SQDSDKS-5767
    _ForwardingStatsUploader: ForwardingStatsUploader;
    _Helpers: SDKHelpersApi;
    _Identity: IIdentity;
    _IdentityAPIClient: typeof IdentityAPIClient;
    _IntegrationCapture: IntegrationCapture;
    _NativeSdkHelpers: INativeSdkHelpers;
    _Persistence: IPersistence;
    _RoktManager: RoktManager;
    _SessionManager: ISessionManager;
    _ServerModel: IServerModel;
    _Store: IStore;
    _instanceName: string;
    _preInit: IPreInit;
    _timeOnSiteTimer: ForegroundTimer; 
}

const { Messages, HTTPCodes, FeatureFlags, CaptureIntegrationSpecificIdsV2Modes } = Constants;
const { ReportBatching, CaptureIntegrationSpecificIds, CaptureIntegrationSpecificIdsV2 } = FeatureFlags;
const { StartingInitialization } = Messages.InformationMessages;

/**
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
 */

export default function mParticleInstance(this: IMParticleWebSDKInstance, instanceName: string) {
    const self = this;
    // These classes are for internal use only. Not documented for public consumption
    this._instanceName = instanceName;
    this._NativeSdkHelpers = new NativeSdkHelpers(this);
    this._SessionManager = new SessionManager(this);
    this._Persistence = new Persistence(this);
    this._Helpers = new Helpers(this);
    this._Events = new Events(this);
    this._CookieSyncManager = new CookieSyncManager(this);
    this._ServerModel = new ServerModel(this);
    this._Ecommerce = new Ecommerce(this);
    this._ForwardingStatsUploader = new ForwardingStatsUploader(this);
    this._Consent = new Consent(this);
    this._IdentityAPIClient = new IdentityAPIClient(this);
    this._preInit = {
        readyQueue: [],
        integrationDelays: {},
        forwarderConstructors: [],
    };
    this._RoktManager = new RoktManager();

    // required for forwarders once they reference the mparticle instance
    this.IdentityType = IdentityType;
    this.EventType = EventType;
    this.CommerceEventType = CommerceEventType;
    this.PromotionType = PromotionActionType;
    this.ProductActionType = ProductActionType;


    this._Identity = new Identity(this);
    this.Identity = this._Identity.IdentityAPI;
    this.generateHash = this._Helpers.generateHash;

    // https://go.mparticle.com/work/SQDSDKS-6289
    // TODO: Replace this with Store once Store is moved earlier in the init process
    this.getDeviceId = this._Persistence.getDeviceId;

    if (typeof window !== 'undefined') {
        if (window.mParticle && window.mParticle.config) {
            if (window.mParticle.config.hasOwnProperty('rq')) {
                this._preInit.readyQueue = window.mParticle.config.rq;
            }
        }
    }
    this.init = function(apiKey, config) {
        if (!config) {
            console.warn(
                'You did not pass a config object to init(). mParticle will not initialize properly'
            );
        }

        runPreConfigFetchInitialization(this, apiKey, config);

        // config code - Fetch config when requestConfig = true, otherwise, proceed with SDKInitialization
        // Since fetching the configuration is asynchronous, we must pass completeSDKInitialization
        // to it for it to be run after fetched
        if (config) {
            if (
                !config.hasOwnProperty('requestConfig') ||
                config.requestConfig
            ) {
                const configApiClient = new ConfigAPIClient(
                    apiKey,
                    config,
                    this
                );

                configApiClient.getSDKConfiguration().then(result => {
                    const mergedConfig = this._Helpers.extend(
                        {},
                        config,
                        result
                    );

                    completeSDKInitialization(apiKey, mergedConfig, this);
                });
            } else {
                completeSDKInitialization(apiKey, config, this);
            }
        } else {
            console.error(
                'No config available on the window, please pass a config object to mParticle.init()'
            );
            return;
        }
    };
    /**
     * Resets the SDK to an uninitialized state and removes cookies/localStorage. You MUST call mParticle.init(apiKey, window.mParticle.config)
     * before any other mParticle methods or the SDK will not function as intended.
     * @method setLogLevel
     * @param {String} logLevel verbose, warning, or none. By default, `warning` is chosen.
     */
    this.setLogLevel = function(newLogLevel) {
        self.Logger.setLogLevel(newLogLevel);
    };

    /**
     * Resets the SDK to an uninitialized state and removes cookies/localStorage. You MUST call mParticle.init(apiKey, window.mParticle.config)
     * before any other mParticle methods or the SDK will not function as intended.
     * @method reset
     */
    this.reset = function(instance) {
        try {
            instance._Persistence.resetPersistence();
            if (instance._Store) {
                delete instance._Store;
            }
        } catch (error) {
            console.error('Cannot reset mParticle', error);
        }
    };

    this._resetForTests = function(config, keepPersistence, instance) {
        if (instance._Store) {
            delete instance._Store;
        }
        instance._Store = new Store(config, instance);
        instance._Store.isLocalStorageAvailable = instance._Persistence.determineLocalStorageAvailability(
            window.localStorage
        );
        instance._Events.stopTracking();
        if (!keepPersistence) {
            instance._Persistence.resetPersistence();
        }
        instance._Persistence.forwardingStatsBatches.uploadsTable = {};
        instance._Persistence.forwardingStatsBatches.forwardingStatsEventQueue = [];
        instance._preInit = {
            readyQueue: [],
            pixelConfigurations: [],
            integrationDelays: {},
            forwarderConstructors: [],
            isDevelopmentMode: false,
        };
    };
    /**
     * A callback method that is invoked after mParticle is initialized.
     * @method ready
     * @param {Function} function A function to be called after mParticle is initialized
     */
    this.ready = function(f) {
        if (self.isInitialized() && typeof f === 'function') {
            f();
        } else {
            self._preInit.readyQueue.push(f);
        }
    };
    /**
     * Returns the current mParticle environment setting
     * @method getEnvironment
     * @returns {String} mParticle environment setting
     */
    this.getEnvironment = function() {
        return self._Store.SDKConfig.isDevelopmentMode
            ? Constants.Environment.Development
            : Constants.Environment.Production;
    };
    /**
     * Returns the mParticle SDK version number
     * @method getVersion
     * @return {String} mParticle SDK version number
     */
    this.getVersion = function() {
        return Constants.sdkVersion;
    };
    /**
     * Sets the app version
     * @method setAppVersion
     * @param {String} version version number
     */
    this.setAppVersion = function(version) {
        const queued = queueIfNotInitialized(function() {
            self.setAppVersion(version);
        }, self);

        if (queued) return;

        self._Store.SDKConfig.appVersion = version;
        self._Persistence.update();
    };
    /**
     * Sets the device id
     * @method setDeviceId
     * @param {String} name device ID (UUIDv4-formatted string)
     */
    this.setDeviceId = function(guid) {
        const queued = queueIfNotInitialized(function() {
            self.setDeviceId(guid);
        }, self);
        if (queued) return;
        this._Store.setDeviceId(guid);
    };
    /**
     * Returns a boolean for whether or not the SDKhas been fully initialized
     * @method isInitialized
     * @return {Boolean} a boolean for whether or not the SDK has been fully initialized
     */
    this.isInitialized = function() {
        return self._Store ? self._Store.isInitialized : false;
    };

    /**
     * Gets the app name
     * @method getAppName
     * @return {String} App name
     */
    this.getAppName = function() {
        return self._Store.SDKConfig.appName;
    };
    /**
     * Sets the app name
     * @method setAppName
     * @param {String} name App Name
     */
    this.setAppName = function(name) {
        const queued = queueIfNotInitialized(function() {
            self.setAppName(name);
        }, self);

        if (queued) return;

        self._Store.SDKConfig.appName = name;
    };
    /**
     * Gets the app version
     * @method getAppVersion
     * @return {String} App version
     */
    this.getAppVersion = function() {
        return self._Store.SDKConfig.appVersion;
    };
    /**
     * Stops tracking the location of the user
     * @method stopTrackingLocation
     */
    this.stopTrackingLocation = function() {
        self._SessionManager.resetSessionTimer();
        self._Events.stopTracking();
    };
    /**
     * Starts tracking the location of the user
     * @method startTrackingLocation
     * @param {Function} [callback] A callback function that is called when the location is either allowed or rejected by the user. A position object of schema {coords: {latitude: number, longitude: number}} is passed to the callback
     */
    this.startTrackingLocation = function(callback) {
        if (!isFunction(callback)) {
            self.Logger.warning(
                'Warning: Location tracking is triggered, but not including a callback into the `startTrackingLocation` may result in events logged too quickly and not being associated with a location.'
            );
        }

        self._SessionManager.resetSessionTimer();
        self._Events.startTracking(callback);
    };
    /**
     * Sets the position of the user
     * @method setPosition
     * @param {Number} lattitude lattitude digit
     * @param {Number} longitude longitude digit
     */
    this.setPosition = function(lat, lng) {
        const queued = queueIfNotInitialized(function() {
            self.setPosition(lat, lng);
        }, self);

        if (queued) return;

        self._SessionManager.resetSessionTimer();
        if (typeof lat === 'number' && typeof lng === 'number') {
            self._Store.currentPosition = {
                lat: lat,
                lng: lng,
            };
        } else {
            self.Logger.error(
                'Position latitude and/or longitude must both be of type number'
            );
        }
    };
    /**
     * Starts a new session
     * @method startNewSession
     */
    this.startNewSession = function() {
        self._SessionManager.startNewSession();
    };
    /**
     * Ends the current session
     * @method endSession
     */
    this.endSession = function() {
        // Sends true as an over ride vs when endSession is called from the setInterval
        self._SessionManager.endSession(true);
    };

    /**
     * Logs a Base Event to mParticle's servers
     * @param {Object} event Base Event Object
     * @param {Object} [eventOptions] For Event-level Configuration Options
     */
    this.logBaseEvent = function(event, eventOptions) {
        const queued = queueIfNotInitialized(function() {
            self.logBaseEvent(event, eventOptions);
        }, self);

        if (queued) return;

        self._SessionManager.resetSessionTimer();
        if (typeof event.name !== 'string') {
            self.Logger.error(Messages.ErrorMessages.EventNameInvalidType);
            return;
        }

        if (!event.eventType) {
            event.eventType = EventType.Unknown;
        }

        if (!self._Helpers.canLog()) {
            self.Logger.error(Messages.ErrorMessages.LoggingDisabled);
            return;
        }

        self._Events.logEvent(event, eventOptions);
    };
    /**
     * Logs an event to mParticle's servers
     * @method logEvent
     * @param {String} eventName The name of the event
     * @param {Number} [eventType] The eventType as seen [here](http://docs.mparticle.com/developers/sdk/web/event-tracking#event-type)
     * @param {Object} [eventInfo] Attributes for the event
     * @param {Object} [customFlags] Additional customFlags
     * @param {Object} [eventOptions] For Event-level Configuration Options
     */
    this.logEvent = function(
        eventName,
        eventType,
        eventInfo,
        customFlags,
        eventOptions
    ) {
        const queued = queueIfNotInitialized(function() {
            self.logEvent(
                eventName,
                eventType,
                eventInfo,
                customFlags,
                eventOptions
            );
        }, self);

        if (queued) return;

        self._SessionManager.resetSessionTimer();
        if (typeof eventName !== 'string') {
            self.Logger.error(Messages.ErrorMessages.EventNameInvalidType);
            return;
        }

        if (!eventType) {
            eventType = EventType.Unknown;
        }

        if (!self._Helpers.isEventType(eventType)) {
            self.Logger.error(
                'Invalid event type: ' +
                    eventType +
                    ', must be one of: \n' +
                    JSON.stringify(EventType)
            );
            return;
        }

        if (!self._Helpers.canLog()) {
            self.Logger.error(Messages.ErrorMessages.LoggingDisabled);
            return;
        }

        self._Events.logEvent(
            {
                messageType: MessageType.PageEvent,
                name: eventName,
                data: eventInfo,
                eventType: eventType,
                customFlags: customFlags,
            } as BaseEvent,
            eventOptions
        );
    };
    /**
     * Used to log custom errors
     *
     * @method logError
     * @param {String or Object} error The name of the error (string), or an object formed as follows {name: 'exampleName', message: 'exampleMessage', stack: 'exampleStack'}
     * @param {Object} [attrs] Custom attrs to be passed along with the error event; values must be string, number, or boolean
     */
    this.logError = function(error, attrs) {
        const queued = queueIfNotInitialized(function() {
            self.logError(error, attrs);
        }, self);

        if (queued) return;

        self._SessionManager.resetSessionTimer();
        if (!error) {
            return;
        }

        if (typeof error === 'string') {
            error = {
                message: error,
            };
        }

        const data: IErrorLogMessageMinified = {
            m: error.message ? error.message : error as string,
            s: 'Error',
            t: error.stack || null,
        };

        if (attrs) {
            const sanitized = self._Helpers.sanitizeAttributes(attrs, data.m);
            for (const prop in sanitized) {
                data[prop] = sanitized[prop];
            }
        }

        self._Events.logEvent({
            messageType: MessageType.CrashReport,
            name: error.name ? error.name : 'Error',
            eventType: EventType.Other,
            data: data as SDKEventAttrs,
        });
    };
    /**
     * Logs `click` events
     * @method logLink
     * @param {String} selector The selector to add a 'click' event to (ex. #purchase-event)
     * @param {String} [eventName] The name of the event
     * @param {Number} [eventType] The eventType as seen [here](http://docs.mparticle.com/developers/sdk/web/event-tracking#event-type)
     * @param {Object} [eventInfo] Attributes for the event
     */
    this.logLink = function(selector, eventName, eventType, eventInfo) {
        self._Events.addEventHandler(
            'click',
            selector,
            eventName,
            eventInfo,
            eventType
        );
    };
    /**
     * Logs `submit` events
     * @method logForm
     * @param {String} selector The selector to add the event handler to (ex. #search-event)
     * @param {String} [eventName] The name of the event
     * @param {Number} [eventType] The eventType as seen [here](http://docs.mparticle.com/developers/sdk/web/event-tracking#event-type)
     * @param {Object} [eventInfo] Attributes for the event
     */
    this.logForm = function(selector, eventName, eventType, eventInfo) {
        self._Events.addEventHandler(
            'submit',
            selector,
            eventName,
            eventInfo,
            eventType
        );
    };
    /**
     * Logs a page view
     * @method logPageView
     * @param {String} eventName The name of the event. Defaults to 'PageView'.
     * @param {Object} [attrs] Attributes for the event
     * @param {Object} [customFlags] Custom flags for the event
     * @param {Object} [eventOptions] For Event-level Configuration Options
     */
    this.logPageView = function(eventName, attrs, customFlags, eventOptions) {
        const queued = queueIfNotInitialized(function() {
            self.logPageView(eventName, attrs, customFlags, eventOptions);
        }, self);

        if (queued) return;

        self._SessionManager.resetSessionTimer();

        if (self._Helpers.canLog()) {
            if (!self._Helpers.Validators.isStringOrNumber(eventName)) {
                eventName = 'PageView';
            }
            if (!attrs) {
                attrs = {
                    hostname: window.location.hostname,
                    title: window.document.title,
                };
            } else if (!self._Helpers.isObject(attrs)) {
                self.Logger.error(
                    'The attributes argument must be an object. A ' +
                        typeof attrs +
                        ' was entered. Please correct and retry.'
                );
                return;
            }
            if (customFlags && !self._Helpers.isObject(customFlags)) {
                self.Logger.error(
                    'The customFlags argument must be an object. A ' +
                        typeof customFlags +
                        ' was entered. Please correct and retry.'
                );
                return;
            }
        }

        self._Events.logEvent(
            {
                messageType: MessageType.PageView,
                name: eventName,
                data: attrs as SDKEventAttrs,
                eventType: EventType.Unknown,
                customFlags: customFlags,
            },
            eventOptions
        );
    };
    /**
     * Forces an upload of the batch
     * @method upload
     */
    this.upload = function() {
        if (self._Helpers.canLog()) {
            if (self._Store.webviewBridgeEnabled) {
                self._NativeSdkHelpers.sendToNative(
                    Constants.NativeSdkPaths.Upload
                );
            } else {
                self._APIClient?.uploader?.prepareAndUpload(false, false);
            }
        }
    };
    /**
     * Invoke these methods on the mParticle.Consent object.
     * Example: mParticle.Consent.createConsentState()
     *
     * @class mParticle.Consent
     */
    this.Consent = {
        /**
         * Creates a CCPA Opt Out Consent State.
         *
         * @method createCCPAConsent
         * @param {Boolean} optOut true represents a "data sale opt-out", false represents the user declining a "data sale opt-out"
         * @param {Number} timestamp Unix time (likely to be Date.now())
         * @param {String} consentDocument document version or experience that the user may have consented to
         * @param {String} location location where the user gave consent
         * @param {String} hardwareId hardware ID for the device or browser used to give consent. This property exists only to provide additional context and is not used to identify users
         * @return {Object} CCPA Consent State
         */
        createCCPAConsent: self._Consent.createPrivacyConsent,
        /**
         * Creates a GDPR Consent State.
         *
         * @method createGDPRConsent
         * @param {Boolean} consent true represents a "data sale opt-out", false represents the user declining a "data sale opt-out"
         * @param {Number} timestamp Unix time (likely to be Date.now())
         * @param {String} consentDocument document version or experience that the user may have consented to
         * @param {String} location location where the user gave consent
         * @param {String} hardwareId hardware ID for the device or browser used to give consent. This property exists only to provide additional context and is not used to identify users
         * @return {Object} GDPR Consent State
         */
        createGDPRConsent: self._Consent.createPrivacyConsent,
        /**
         * Creates a Consent State Object, which can then be used to set CCPA states, add multiple GDPR states, as well as get and remove these privacy states.
         *
         * @method createConsentState
         * @return {Object} ConsentState object
         */
        createConsentState: self._Consent.createConsentState,
    };
    /**
     * Invoke these methods on the mParticle.eCommerce object.
     * Example: mParticle.eCommerce.createImpresion(...)
     * @class mParticle.eCommerce
     */
    this.eCommerce = {
        /**
         * Invoke these methods on the mParticle.eCommerce.Cart object.
         * Example: mParticle.eCommerce.Cart.add(...)
         * @class mParticle.eCommerce.Cart
         * @deprecated
         */
        Cart: {
            /**
             * Adds a product to the cart
             * @method add
             * @param {Object} product The product you want to add to the cart
             * @param {Boolean} [logEventBoolean] Option to log the event to mParticle's servers. If blank, no logging occurs.
             * @deprecated
             */
            add: function(product, logEventBoolean) {
                self.Logger.warning(
                    'Deprecated function eCommerce.Cart.add() will be removed in future releases'
                );
                let mpid;
                const currentUser = self.Identity.getCurrentUser();
                if (currentUser) {
                    mpid = currentUser.getMPID();
                }
                self._Identity
                    .mParticleUserCart(mpid)
                    .add(product, logEventBoolean);
            },
            /**
             * Removes a product from the cart
             * @method remove
             * @param {Object} product The product you want to add to the cart
             * @param {Boolean} [logEventBoolean] Option to log the event to mParticle's servers. If blank, no logging occurs.
             * @deprecated
             */
            remove: function(product, logEventBoolean) {
                self.Logger.warning(
                    'Deprecated function eCommerce.Cart.remove() will be removed in future releases'
                );
                let mpid;
                const currentUser = self.Identity.getCurrentUser();
                if (currentUser) {
                    mpid = currentUser.getMPID();
                }
                self._Identity
                    .mParticleUserCart(mpid)
                    .remove(product, logEventBoolean);
            },
            /**
             * Clears the cart
             * @method clear
             * @deprecated
             */
            clear: function() {
                self.Logger.warning(
                    'Deprecated function eCommerce.Cart.clear() will be removed in future releases'
                );
                let mpid;
                const currentUser = self.Identity.getCurrentUser();
                if (currentUser) {
                    mpid = currentUser.getMPID();
                }
                self._Identity.mParticleUserCart(mpid).clear();
            },
        },
        /**
         * Sets the currency code
         * @for mParticle.eCommerce
         * @method setCurrencyCode
         * @param {String} code The currency code
         */
        setCurrencyCode: function(code) {
            const queued = queueIfNotInitialized(function() {
                self.eCommerce.setCurrencyCode(code);
            }, self);

            if (queued) return;

            if (typeof code !== 'string') {
                self.Logger.error('Code must be a string');
                return;
            }
            self._SessionManager.resetSessionTimer();
            self._Store.currencyCode = code;
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
            return self._Ecommerce.createProduct(
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
        /**
         * Creates a promotion
         * @for mParticle.eCommerce
         * @method createPromotion
         * @param {String} id a unique promotion id
         * @param {String} [creative] promotion creative
         * @param {String} [name] promotion name
         * @param {Number} [position] promotion position
         */
        createPromotion: function(id, creative, name, position) {
            return self._Ecommerce.createPromotion(
                id,
                creative,
                name,
                position
            );
        },
        /**
         * Creates a product impression
         * @for mParticle.eCommerce
         * @method createImpression
         * @param {String} name impression name
         * @param {Object} product the product for which an impression is being created
         */
        createImpression: function(name, product) {
            return self._Ecommerce.createImpression(name, product);
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
        createTransactionAttributes: function(
            id,
            affiliation,
            couponCode,
            revenue,
            shipping,
            tax
        ) {
            return self._Ecommerce.createTransactionAttributes(
                id,
                affiliation,
                couponCode,
                revenue,
                shipping,
                tax
            );
        },
        /**
         * Logs a checkout action
         * @for mParticle.eCommerce
         * @method logCheckout
         * @param {Number} step checkout step number
         * @param {String} checkout option string
         * @param {Object} attrs
         * @param {Object} [customFlags] Custom flags for the event
         * @deprecated
         */
        logCheckout: function(step, option, attrs, customFlags) {
            self.Logger.warning(
                'mParticle.logCheckout is deprecated, please use mParticle.logProductAction instead'
            );

            if (!self._Store.isInitialized) {
                self.ready(function() {
                    self.eCommerce.logCheckout(
                        step,
                        option,
                        attrs,
                        customFlags
                    );
                });

                return;
            }

            self._SessionManager.resetSessionTimer();
            self._Events.logCheckoutEvent(step, option, attrs, customFlags);
        },
        /**
         * Logs a product action
         * @for mParticle.eCommerce
         * @method logProductAction
         * @param {Number} productActionType product action type as found [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/src/types.js#L206-L218)
         * @param {Object} product the product for which you are creating the product action
         * @param {Object} [attrs] attributes related to the product action
         * @param {Object} [customFlags] Custom flags for the event
         * @param {Object} [transactionAttributes] Transaction Attributes for the event
         * @param {Object} [eventOptions] For Event-level Configuration Options
         */
        logProductAction: function(
            productActionType,
            product,
            attrs,
            customFlags,
            transactionAttributes,
            eventOptions
        ) {
            const queued = queueIfNotInitialized(function() {
                self.eCommerce.logProductAction(
                    productActionType,
                    product,
                    attrs,
                    customFlags,
                    transactionAttributes,
                    eventOptions
                );
            }, self);

            if (queued) return;

            self._SessionManager.resetSessionTimer();
            self._Events.logProductActionEvent(
                productActionType,
                product,
                attrs,
                customFlags,
                transactionAttributes,
                eventOptions
            );
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
         * @deprecated
         */
        logPurchase: function(
            transactionAttributes,
            product,
            clearCart,
            attrs,
            customFlags
        ) {
            self.Logger.warning(
                'mParticle.logPurchase is deprecated, please use mParticle.logProductAction instead'
            );
            if (!self._Store.isInitialized) {
                self.ready(function() {
                    self.eCommerce.logPurchase(
                        transactionAttributes,
                        product,
                        clearCart,
                        attrs,
                        customFlags
                    );
                });
                return;
            }
            if (!transactionAttributes || !product) {
                self.Logger.error(Messages.ErrorMessages.BadLogPurchase);
                return;
            }
            self._SessionManager.resetSessionTimer();
            self._Events.logPurchaseEvent(
                transactionAttributes,
                product,
                attrs,
                customFlags
            );
        },
        /**
         * Logs a product promotion
         * @for mParticle.eCommerce
         * @method logPromotion
         * @param {Number} type the promotion type as found [here](https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/src/types.js#L275-L279)
         * @param {Object} promotion promotion object
         * @param {Object} [attrs] boolean to clear the cart after logging or not
         * @param {Object} [customFlags] Custom flags for the event
         * @param {Object} [eventOptions] For Event-level Configuration Options
         */
        logPromotion: function(
            type,
            promotion,
            attrs,
            customFlags,
            eventOptions
        ) {
            const queued = queueIfNotInitialized(function() {
                self.eCommerce.logPromotion(
                    type,
                    promotion,
                    attrs,
                    customFlags,
                    eventOptions
                );
            }, self);

            if (queued) return;

            self._SessionManager.resetSessionTimer();
            self._Events.logPromotionEvent(
                type,
                promotion,
                attrs,
                customFlags,
                eventOptions
            );
        },
        /**
         * Logs a product impression
         * @for mParticle.eCommerce
         * @method logImpression
         * @param {Object} impression product impression object
         * @param {Object} attrs attributes related to the impression log
         * @param {Object} [customFlags] Custom flags for the event
         * @param {Object} [eventOptions] For Event-level Configuration Options
         */
        logImpression: function(impression, attrs, customFlags, eventOptions) {
            const queued = queueIfNotInitialized(function() {
                self.eCommerce.logImpression(
                    impression,
                    attrs,
                    customFlags,
                    eventOptions
                );
            }, self);

            if (queued) return;

            self._SessionManager.resetSessionTimer();
            self._Events.logImpressionEvent(
                impression,
                attrs,
                customFlags,
                eventOptions
            );
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
         * @deprecated
         */
        logRefund: function(
            transactionAttributes,
            product,
            clearCart,
            attrs,
            customFlags
        ) {
            self.Logger.warning(
                'mParticle.logRefund is deprecated, please use mParticle.logProductAction instead'
            );
            if (!self._Store.isInitialized) {
                self.ready(function() {
                    self.eCommerce.logRefund(
                        transactionAttributes,
                        product,
                        clearCart,
                        attrs,
                        customFlags
                    );
                });
                return;
            }
            self._SessionManager.resetSessionTimer();
            self._Events.logRefundEvent(
                transactionAttributes,
                product,
                attrs,
                customFlags
            );
        },
        expandCommerceEvent: function(event) {
            return self._Ecommerce.expandCommerceEvent(event);
        },
    };
    /**
     * Sets a session attribute
     * @method setSessionAttribute
     * @param {String} key key for session attribute
     * @param {String or Number} value value for session attribute
     */
    this.setSessionAttribute = function(key, value) {
        const queued = queueIfNotInitialized(function() {
            self.setSessionAttribute(key, value);
        }, self);

        if (queued) return;

        // Logs to cookie
        // And logs to in-memory object
        // Example: mParticle.setSessionAttribute('location', '33431');
        if (self._Helpers.canLog()) {
            if (!self._Helpers.Validators.isValidAttributeValue(value)) {
                self.Logger.error(Messages.ErrorMessages.BadAttribute);
                return;
            }

            if (!self._Helpers.Validators.isValidKeyValue(key)) {
                self.Logger.error(Messages.ErrorMessages.BadKey);
                return;
            }

            if (self._Store.webviewBridgeEnabled) {
                self._NativeSdkHelpers.sendToNative(
                    Constants.NativeSdkPaths.SetSessionAttribute,
                    JSON.stringify({ key: key, value: value })
                );
            } else {
                const existingProp = self._Helpers.findKeyInObject(
                    self._Store.sessionAttributes,
                    key
                );

                if (existingProp) {
                    key = existingProp;
                }

                self._Store.sessionAttributes[key] = value;
                self._Persistence.update();

                self._Forwarders.applyToForwarders('setSessionAttribute', [
                    key,
                    value,
                ]);
            }
        }
    };
    /**
     * Set opt out of logging
     * @method setOptOut
     * @param {Boolean} isOptingOut boolean to opt out or not. When set to true, opt out of logging.
     */
    this.setOptOut = function(isOptingOut) {
        const queued = queueIfNotInitialized(function() {
            self.setOptOut(isOptingOut);
        }, self);

        if (queued) return;

        self._SessionManager.resetSessionTimer();
        self._Store.isEnabled = !isOptingOut;

        self._Events.logOptOut();
        self._Persistence.update();

        if (self._Store.activeForwarders.length) {
            self._Store.activeForwarders.forEach(function(forwarder) {
                if (forwarder.setOptOut) {
                    const result = forwarder.setOptOut(isOptingOut);

                    if (result) {
                        self.Logger.verbose(result);
                    }
                }
            });
        }
    };
    /**
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
     */
    this.setIntegrationAttribute = function(integrationId, attrs) {
        const queued = queueIfNotInitialized(function() {
            self.setIntegrationAttribute(integrationId, attrs);
        }, self);

        if (queued) return;

        if (typeof integrationId !== 'number') {
            self.Logger.error('integrationId must be a number');
            return;
        }
        if (attrs === null) {
            self._Store.integrationAttributes[integrationId] = {};
        } else if (self._Helpers.isObject(attrs)) {
            if (Object.keys(attrs).length === 0) {
                self._Store.integrationAttributes[integrationId] = {};
            } else {
                for (const key in attrs) {
                    if (typeof key === 'string') {
                        if (typeof attrs[key] === 'string') {
                            if (
                                self._Helpers.isObject(
                                    self._Store.integrationAttributes[
                                        integrationId
                                    ]
                                )
                            ) {
                                self._Store.integrationAttributes[
                                    integrationId
                                ][key] = attrs[key];
                            } else {
                                self._Store.integrationAttributes[
                                    integrationId
                                ] = {};
                                self._Store.integrationAttributes[
                                    integrationId
                                ][key] = attrs[key];
                            }
                        } else {
                            self.Logger.error(
                                'Values for integration attributes must be strings. You entered a ' +
                                    typeof attrs[key]
                            );
                            continue;
                        }
                    } else {
                        self.Logger.error(
                            'Keys must be strings, you entered a ' + typeof key
                        );
                        continue;
                    }
                }
            }
        } else {
            self.Logger.error(
                'Attrs must be an object with keys and values. You entered a ' +
                    typeof attrs
            );
            return;
        }
        self._Persistence.update();
    };
    /**
     * Get integration attributes for a given integration ID.
     * @method getIntegrationAttributes
     * @param {Number} integrationId mParticle integration ID
     * @return {Object} an object map of the integrationId's attributes
     */
    this.getIntegrationAttributes = function(integrationId) {
        if (self._Store.integrationAttributes[integrationId]) {
            return self._Store.integrationAttributes[integrationId];
        } else {
            return {};
        }
    };
    // Used by our forwarders
    this.addForwarder = function(forwarder) {
        self._preInit.forwarderConstructors.push(forwarder);
    };
    this.configurePixel = function(settings) {
        self._Forwarders.configurePixel(settings);
    };
    this._getActiveForwarders = function() {
        return self._Store.activeForwarders;
    };
    this._getIntegrationDelays = function() {
        return self._preInit.integrationDelays;
    };
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
    */
    this._setIntegrationDelay = function(module, shouldDelayIntegration) {
        self._preInit.integrationDelays[module] = shouldDelayIntegration;

        // If the integration delay is set to true, no further action needed
        if (shouldDelayIntegration === true) {
            return;
        }
        // If the integration delay is set to false, check to see if there are any
        // other integration delays set to true.  It not, process the queued events/.

        const integrationDelaysKeys = Object.keys(
            self._preInit.integrationDelays
        );

        if (integrationDelaysKeys.length === 0) {
            return;
        }

        const hasIntegrationDelays = integrationDelaysKeys.some(function(
            integration
        ) {
            return self._preInit.integrationDelays[integration] === true;
        });

        if (!hasIntegrationDelays) {
            self._APIClient.processQueuedEvents();
        }
    };

    // Internal use only. Used by our wrapper SDKs to identify themselves during initialization.
    this._setWrapperSDKInfo = function(name, version) {
        const queued = queueIfNotInitialized(function() {
            self._setWrapperSDKInfo(name, version);
        }, self);

        if (queued) return;

        if (
            self._Store.wrapperSDKInfo === undefined ||
            !self._Store.wrapperSDKInfo.isInfoSet
        ) {
            self._Store.wrapperSDKInfo = {
                name: name,
                version: version,
                isInfoSet: true,
            };
        }
    };
}

// Some (server) config settings need to be returned before they are set on SDKConfig in a self hosted environment
function completeSDKInitialization(apiKey, config, mpInstance) {
    const kitBlocker = createKitBlocker(config, mpInstance);
    const { getFeatureFlag } = mpInstance._Helpers;

    mpInstance._APIClient = new APIClient(mpInstance, kitBlocker);
    mpInstance._Forwarders = new Forwarders(mpInstance, kitBlocker);
    mpInstance._Store.processConfig(config);

    mpInstance._Identity.idCache = createIdentityCache(mpInstance);
    removeExpiredIdentityCacheDates(mpInstance._Identity.idCache);

    // Web View Bridge is used for cases where the Web SDK is loaded within an iOS or Android device's
    // Web View.  The Web SDK simply acts as a passthrough to the mParticle Native SDK.  It is not
    // responsible for sending events directly to mParticle's servers.  The Web SDK will not initialize
    // persistence or Identity directly.
    if (mpInstance._Store.webviewBridgeEnabled) {
        mpInstance._NativeSdkHelpers.initializeSessionAttributes(apiKey);
    } else {
        // Main SDK initialization flow

        // Load any settings/identities/attributes from cookie or localStorage
        mpInstance._Persistence.initializeStorage();
        mpInstance._Store.syncPersistenceData();

        // Set up user identitiy variables for later use
        const currentUser = mpInstance.Identity.getCurrentUser();
        const currentUserMPID = currentUser ? currentUser.getMPID() : null;
        const currentUserIdentities = currentUser
            ? currentUser.getUserIdentities().userIdentities
            : {};

        mpInstance._Store.SDKConfig.identifyRequest = mpInstance._Store.hasInvalidIdentifyRequest()
            ? { userIdentities: currentUserIdentities }
            : mpInstance._Store.SDKConfig.identifyRequest;

        if (getFeatureFlag(ReportBatching)) {
            mpInstance._ForwardingStatsUploader.startForwardingStatsTimer();
        }
        // https://go.mparticle.com/work/SQDSDKS-7639
        const integrationSpecificIds = getFeatureFlag(CaptureIntegrationSpecificIds) as boolean;
        const integrationSpecificIdsV2 = getFeatureFlag(CaptureIntegrationSpecificIdsV2) as string;
        
        const isIntegrationCaptureEnabled = (integrationSpecificIdsV2 ? integrationSpecificIdsV2 !== CaptureIntegrationSpecificIdsV2Modes.None : false) || (integrationSpecificIds === true);

        if (!isIntegrationCaptureEnabled) {
            return;
        }

        let captureMode: valueof<typeof CaptureIntegrationSpecificIdsV2Modes> | undefined;
        if (integrationSpecificIds || integrationSpecificIdsV2 === CaptureIntegrationSpecificIdsV2Modes.All) {
            captureMode = 'all';
        } else if (integrationSpecificIdsV2 === CaptureIntegrationSpecificIdsV2Modes.RoktOnly) {
            captureMode = 'roktonly';
        }

        mpInstance._IntegrationCapture = new IntegrationCapture(captureMode);
        mpInstance._IntegrationCapture.capture();            

        // Configure Rokt Manager with user and filtered user
        const roktConfig: IKitConfigs = parseConfig(config, 'Rokt', 181);
        if (roktConfig) {
            const { userAttributeFilters } = roktConfig;
            const roktFilteredUser = filteredMparticleUser(
                currentUserMPID,
                { userAttributeFilters },
                mpInstance
            );
            const roktOptions: IRoktOptions = {
                sandbox: config?.isDevelopmentMode,
                launcherOptions: config?.launcherOptions,
                domain: config?.domain,
            };
            // https://go.mparticle.com/work/SQDSDKS-7339
            mpInstance._RoktManager.init(
                roktConfig,
                roktFilteredUser,
                mpInstance.Identity,
                mpInstance.Logger,
                roktOptions
            );
        }

        mpInstance._Forwarders.processForwarders(
            config,
            mpInstance._APIClient.prepareForwardingStats
        );
        mpInstance._Forwarders.processPixelConfigs(config);

        // Checks if session is created, resumed, or needs to be ended
        // Logs a session start or session end event accordingly
        mpInstance._SessionManager.initialize();
        mpInstance._Events.logAST();

        processIdentityCallback(
            mpInstance,
            currentUser,
            currentUserMPID,
            currentUserIdentities
        );
    }

    // We will continue to clear out the ready queue as part of the initial init flow
    // if an identify request is unnecessary, such as if there is an existing session
    if (
        (mpInstance._Store.mpid && !mpInstance._Store.identifyCalled) ||
        mpInstance._Store.webviewBridgeEnabled
    ) {
        mpInstance._Store.isInitialized = true;

        mpInstance._preInit.readyQueue = processReadyQueue(
            mpInstance._preInit.readyQueue
        );
    }

    // https://go.mparticle.com/work/SQDSDKS-6040
    if (mpInstance._Store.isFirstRun) {
        mpInstance._Store.isFirstRun = false;
    }
}

// https://go.mparticle.com/work/SQDSDKS-7061
function createKitBlocker(config, mpInstance) {
    let kitBlocker;
    let dataPlanForKitBlocker;
    let kitBlockError;
    let kitBlockOptions;

    /*  There are three ways a data plan object for blocking can be passed to the SDK:
            1. Manually via config.dataPlanOptions (this takes priority)
            If not passed in manually, we user the server provided via either
            2. Snippet via /mparticle.js endpoint (config.dataPlan.document)
            3. Self hosting via /config endpoint (config.dataPlanResult)
    */

    if (config.dataPlanOptions) {
        mpInstance.Logger.verbose('Customer provided data plan found');
        kitBlockOptions = config.dataPlanOptions;

        dataPlanForKitBlocker = {
            document: {
                dtpn: {
                    vers: kitBlockOptions.dataPlanVersion,
                    blok: {
                        ev: kitBlockOptions.blockEvents,
                        ea: kitBlockOptions.blockEventAttributes,
                        ua: kitBlockOptions.blockUserAttributes,
                        id: kitBlockOptions.blockUserIdentities,
                    },
                },
            },
        };
    }

    if (!dataPlanForKitBlocker) {
        // config.dataPlan.document returns on /mparticle.js endpoint
        if (config.dataPlan && config.dataPlan.document) {
            if (config.dataPlan.document.error_message) {
                kitBlockError = config.dataPlan.document.error_message;
            } else {
                mpInstance.Logger.verbose('Data plan found from mParticle.js');
                dataPlanForKitBlocker = config.dataPlan;
            }
        }
        // config.dataPlanResult returns on /config endpoint
        else if (config.dataPlanResult) {
            if (config.dataPlanResult.error_message) {
                kitBlockError = config.dataPlanResult.error_message;
            } else {
                mpInstance.Logger.verbose('Data plan found from /config');
                dataPlanForKitBlocker = { document: config.dataPlanResult };
            }
        }
    }

    if (kitBlockError) {
        mpInstance.Logger.error(kitBlockError);
    }

    if (dataPlanForKitBlocker) {
        kitBlocker = new KitBlocker(dataPlanForKitBlocker, mpInstance);
    }

    return kitBlocker;
}

function createIdentityCache(mpInstance) {
    return new LocalStorageVault(`${mpInstance._Store.storageName}-id-cache`, {
        logger: mpInstance.Logger,
    });
}

function runPreConfigFetchInitialization(mpInstance, apiKey, config) {
    mpInstance.Logger = new Logger(config);
    mpInstance._Store = new Store(config, mpInstance, apiKey);
    window.mParticle.Store = mpInstance._Store;
    mpInstance.Logger.verbose(StartingInitialization);

    // Check to see if localStorage is available before main configuration runs
    // since we will need this for the current implementation of user persistence
    // TODO: Refactor this when we refactor User Identity Persistence
    try {
        mpInstance._Store.isLocalStorageAvailable = mpInstance._Persistence.determineLocalStorageAvailability(
            window.localStorage
        );
    } catch (e) {
        mpInstance.Logger.warning(
            'localStorage is not available, using cookies if available'
        );
        mpInstance._Store.isLocalStorageAvailable = false;
    }
}

function processIdentityCallback(
    mpInstance,
    currentUser,
    currentUserMPID,
    currentUserIdentities
) {
    // https://go.mparticle.com/work/SQDSDKS-6323
    // Call mParticle._Store.SDKConfig.identityCallback when identify was not called
    // due to a reload or a sessionId already existing
    // Any identity callback should always be ran regardless if an identity call
    // is made
    if (
        !mpInstance._Store.identifyCalled &&
        mpInstance._Store.SDKConfig.identityCallback &&
        currentUser &&
        currentUserMPID
    ) {
        mpInstance._Store.SDKConfig.identityCallback({
            httpCode: HTTPCodes.activeSession,
            getUser: function() {
                return mpInstance._Identity.mParticleUser(currentUserMPID);
            },
            getPreviousUser: function() {
                const users = mpInstance.Identity.getUsers();
                let mostRecentUser = users.shift();
                const mostRecentUserMPID = mostRecentUser.getMPID();
                if (mostRecentUser && mostRecentUserMPID === currentUserMPID) {
                    mostRecentUser = users.shift();
                }
                return mostRecentUser || null;
            },
            body: {
                mpid: currentUserMPID,
                is_logged_in: mpInstance._Store.isLoggedIn,
                matched_identities: currentUserIdentities,
                context: null,
                is_ephemeral: false,
            },
        });
    }
}

function queueIfNotInitialized(func, self) {
    if (!self.isInitialized()) {
        self.ready(function() {
            func();
        });
        return true;
    }
    return false;
}

