var mpDoubleClickKit = (function (exports) {
    'use strict';

    var googleConsentValues = {
        // Server Integration uses 'Unspecified' as a value when the setting is 'not set'.
        // However, this is not used by Google's Web SDK. We are referencing it here as a comment
        // as a record of this distinction and for posterity.
        // If Google ever adds this for web, the line can just be uncommented to support this.
        //
        // Docs:
        // Web: https://developers.google.com/tag-platform/gtagjs/reference#consent
        // S2S: https://developers.google.com/google-ads/api/reference/rpc/v15/ConsentStatusEnum.ConsentStatus
        //
        // Unspecified: 'unspecified',
        Denied: 'denied',
        Granted: 'granted',
    };

    // Declares list of valid Google Consent Properties
    var googleConsentProperties = [
        'ad_storage',
        'ad_user_data',
        'ad_personalization',
        'analytics_storage',
    ];

    function ConsentHandler(common) {
        this.common = common || {};
    }

    ConsentHandler.prototype.getUserConsentState = function() {
        var userConsentState = {};

        if (mParticle.Identity && mParticle.Identity.getCurrentUser) {
            var currentUser = mParticle.Identity.getCurrentUser();

            if (!currentUser) {
                return {};
            }

            var consentState = mParticle.Identity.getCurrentUser().getConsentState();

            if (consentState && consentState.getGDPRConsentState) {
                userConsentState = consentState.getGDPRConsentState();
            }
        }

        return userConsentState;
    };

    ConsentHandler.prototype.getConsentSettings = function() {
        var consentSettings = {};

        var googleToMpConsentSettingsMapping = {
            ad_user_data: 'defaultAdUserDataConsent',
            ad_personalization: 'defaultAdPersonalizationConsent',
            ad_storage: 'defaultAdStorageConsentWeb',
            analytics_storage: 'defaultAnalyticsStorageConsentWeb',
        };

        var settings = this.common.settings;

        Object.keys(googleToMpConsentSettingsMapping).forEach(function(
            googleConsentKey
        ) {
            var mpConsentSettingKey =
                googleToMpConsentSettingsMapping[googleConsentKey];
            var googleConsentValuesKey = settings[mpConsentSettingKey];

            if (googleConsentValuesKey && mpConsentSettingKey) {
                consentSettings[googleConsentKey] =
                    googleConsentValues[googleConsentValuesKey];
            }
        });

        return consentSettings;
    };

    ConsentHandler.prototype.generateConsentStatePayloadFromMappings = function(
        consentState,
        mappings
    ) {
        if (!mappings) return {};

        var payload = this.common.cloneObject(this.common.consentPayloadDefaults);

        for (var i = 0; i <= mappings.length - 1; i++) {
            var mappingEntry = mappings[i];
            // Although consent purposes can be inputted into the UI in any casing
            // the SDK will automatically lowercase them to prevent pseudo-duplicate
            // consent purposes, so we call `toLowerCase` on the consentMapping purposes here
            var mpMappedConsentName = mappingEntry.map.toLowerCase();
            var googleMappedConsentName = mappingEntry.value;

            if (
                consentState[mpMappedConsentName] &&
                googleConsentProperties.indexOf(googleMappedConsentName) !== -1
            ) {
                payload[googleMappedConsentName] = consentState[mpMappedConsentName]
                    .Consented
                    ? googleConsentValues.Granted
                    : googleConsentValues.Denied;
            }
        }

        return payload;
    };

    var consent = ConsentHandler;

    function Common() {
        this.consentMappings = [];
        this.consentPayloadDefaults = {};
        this.consentPayloadAsString = '';

        this.consentHandler = new consent(this);
    }

    Common.prototype.eventMapping = {};
    Common.prototype.customVariablesMappings = {};
    Common.prototype.customFieldMappings = {};
    Common.prototype.settings = {};
    Common.prototype.setCustomVariables = function(event, gtagProperties) {
        for (var attribute in event.EventAttributes) {
            if (this.customVariablesMappings[attribute]) {
                gtagProperties[this.customVariablesMappings[attribute]] =
                    event.EventAttributes[attribute];
            }
        }
    };
    Common.prototype.setCustomFields = function(event, gtagProperties) {
        var dc_custom_params = {};
        var hasMappings = false;
        for (var attribute in event.EventAttributes) {
            if (this.customFieldMappings[attribute]) {
                dc_custom_params[this.customFieldMappings[attribute]] =
                    event.EventAttributes[attribute];
                hasMappings = true;
            }
        }
        if (hasMappings) {
            gtagProperties['dc_custom_params'] = dc_custom_params;
        }
    };
    Common.prototype.setSendTo = function(mapping, customFlags, gtagProperties) {
        var tags = mapping.value.split(';');
        var groupTag = tags[0];
        var activityTag = tags[1];
        gtagProperties.send_to =
            'DC-' + this.settings.advertiserId + '/' + groupTag + '/' + activityTag;
    };
    Common.prototype.getEventMapping = function(event) {
        var jsHash = calculateJSHash(
            event.EventDataType,
            event.EventCategory,
            event.EventName
        );
        return findValueInMapping(jsHash, this.eventMapping);
    };
    Common.prototype.sendGtag = function(type, properties, isInitialization) {
        function gtag() {
            window.dataLayer.push(arguments);
        }
        if (Array.isArray(window.dataLayer)) {
            if (isInitialization) {
                gtag(type, properties);
            } else {
                gtag('event', type, properties);
            }
        }
    };

    Common.prototype.sendGtagConsent = function(type, payload) {
        function gtag() {
            window.dataLayer.push(arguments);
        }
        gtag('consent', type, payload);
    };

    Common.prototype.getEventConsentState = function(eventConsentState) {
        return eventConsentState && eventConsentState.getGDPRConsentState
            ? eventConsentState.getGDPRConsentState()
            : {};
    };

    Common.prototype.maybeSendConsentUpdateToGoogle = function(consentState) {
        // If consent payload is empty,
        // we never sent an initial default consent state
        // so we shouldn't send an update.
        if (
            this.consentPayloadAsString &&
            this.consentMappings &&
            !this.isEmpty(consentState)
        ) {
            var updatedConsentPayload = this.consentHandler.generateConsentStatePayloadFromMappings(
                consentState,
                this.consentMappings
            );

            var eventConsentAsString = JSON.stringify(updatedConsentPayload);

            if (eventConsentAsString !== this.consentPayloadAsString) {
                this.sendGtagConsent('update', updatedConsentPayload);
                this.consentPayloadAsString = eventConsentAsString;
            }
        }
    };

    Common.prototype.sendDefaultConsentPayloadToGoogle = function(consentPayload) {
        this.consentPayloadAsString = JSON.stringify(consentPayload);

        this.sendGtagConsent('default', consentPayload);
    };

    Common.prototype.cloneObject = function(obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    Common.prototype.isEmpty = function isEmpty(value) {
        return value == null || !(Object.keys(value) || value).length;
    };

    var common = Common;

    function findValueInMapping(jsHash, mapping) {
        if (mapping) {
            var filteredArray = mapping.filter(function(mappingEntry) {
                if (
                    mappingEntry.jsmap &&
                    mappingEntry.maptype &&
                    mappingEntry.value
                ) {
                    return mappingEntry.jsmap === jsHash.toString();
                }

                return {
                    result: false,
                };
            });

            if (filteredArray && filteredArray.length > 0) {
                return {
                    result: true,
                    match: filteredArray[0],
                };
            }
        }
        return null;
    }

    function calculateJSHash(eventDataType, eventCategory, name) {
        var preHash = '' + eventDataType + ('' + eventCategory) + '' + (name || '');

        return mParticle.generateHash(preHash);
    }

    var salesCounterTypes = {
        transactions: 1,
        items_sold: 1,
    };
    var ITEMS_SOLD = 'items_sold';

    function CommerceHandler(common) {
        this.common = common || {};
    }

    CommerceHandler.prototype.logCommerceEvent = function(event) {
        if (event.EventDataType === mParticle.CommerceEventType.ProductPurchase) {
            var counter =
                event.CustomFlags && event.CustomFlags['DoubleClick.Counter']
                    ? event.CustomFlags['DoubleClick.Counter']
                    : null;
            if (!counter) {
                console.log(
                    "Event not sent. Sales conversions requires a custom flag of DoubleClick.Counter equal to 'transactions', or 'items_sold'. See https://support.google.com/dcm/partner/answer/2823400?hl=en for more info"
                );
                return false;
            } else if (!salesCounterTypes[counter]) {
                console.log(
                    "Counter type not valid. For sales conversions, use a custom flag of DoubleClick.Counter equal to 'transactions', or 'items_sold'. See https://support.google.com/dcm/partner/answer/2823400?hl=en for more info"
                );
                return false;
            }

            var eventMapping = this.common.getEventMapping(event);

            if (!eventMapping) {
                console.log('Event not mapped. Event not sent.');
                return false;
            }

            if (eventMapping.result && eventMapping.match) {
                var gtagProperties = {};
                this.common.setCustomVariables(event, gtagProperties);
                this.common.setSendTo(
                    eventMapping.match,
                    event.CustomFlags,
                    gtagProperties
                );
                gtagProperties.send_to += '+' + counter;
                //stringify number
                gtagProperties.value = '' + event.ProductAction.TotalAmount;
                gtagProperties.transaction_id = event.ProductAction.TransactionId;

                if (counter === ITEMS_SOLD) {
                    gtagProperties.quantity =
                        '' + event.ProductAction.ProductList.length;
                }
                this.common.sendGtag('purchase', gtagProperties);
                return true;
            }
        }
    };

    var commerceHandler = CommerceHandler;

    var eventCounterTypes = {
        standard: 1,
        unique: 1,
        per_session: 1,
    };

    function EventHandler(common) {
        this.common = common || {};
    }

    EventHandler.prototype.logEvent = function(event) {
        var eventConsentState = this.common.getEventConsentState(
            event.ConsentState
        );
        this.common.maybeSendConsentUpdateToGoogle(eventConsentState);

        var gtagProperties = {};
        this.common.setCustomVariables(event, gtagProperties);
        this.common.setCustomFields(event, gtagProperties);
        var eventMapping = this.common.getEventMapping(event);

        if (!eventMapping) {
            console.log('Event not mapped. Event not sent.');
            return false;
        }

        if (eventMapping.result && eventMapping.match) {
            var counter =
                event.CustomFlags && event.CustomFlags['DoubleClick.Counter']
                    ? event.CustomFlags['DoubleClick.Counter']
                    : null;
            if (!counter) {
                console.log(
                    "Event not sent. Event conversions requires a custom flag of DoubleClick.Counter equal to 'standard', 'unique, or 'per_session'. See https://support.google.com/dcm/partner/answer/2823400?hl=en for more info"
                );
                return false;
            }
            if (eventCounterTypes[counter]) {
                this.common.setSendTo(
                    eventMapping.match,
                    event.CustomFlags,
                    gtagProperties
                );
                gtagProperties.send_to += '+' + counter;
                this.common.sendGtag('conversion', gtagProperties);
            } else {
                console.log(
                    "Counter type not valid. For event conversions, use 'standard', 'unique, or 'per_session'. See https://support.google.com/dcm/partner/answer/2823400?hl=en for more info"
                );
                return false;
            }
        }
        return true;
    };
    EventHandler.prototype.logError = function() {};
    EventHandler.prototype.logPageView = function() {};

    var eventHandler = EventHandler;

    /*
    The 'mParticleUser' is an object with methods get user Identities and set/get user attributes
    Partners can determine what userIds are available to use in their SDK
    Call mParticleUser.getUserIdentities() to return an object of userIdentities --> { userIdentities: {customerid: '1234', email: 'email@gmail.com'} }
    For more identity types, see http://docs.mparticle.com/developers/sdk/javascript/identity#allowed-identity-types
    Call mParticleUser.getMPID() to get mParticle ID
    For any additional methods, see http://docs.mparticle.com/developers/sdk/javascript/apidocs/classes/mParticle.Identity.getCurrentUser().html
    */

    /*
    identityApiRequest has the schema:
    {
      userIdentities: {
        customerid: '123',
        email: 'abc'
      }
    }
    For more userIdentity types, see http://docs.mparticle.com/developers/sdk/javascript/identity#allowed-identity-types
    */

    function IdentityHandler(common) {
        this.common = common || {};
    }

    IdentityHandler.prototype.onUserIdentified = function(mParticleUser) {};
    IdentityHandler.prototype.onIdentifyComplete = function(
        mParticleUser,
        identityApiRequest
    ) {};
    IdentityHandler.prototype.onLoginComplete = function(
        mParticleUser,
        identityApiRequest
    ) {};
    IdentityHandler.prototype.onLogoutComplete = function(
        mParticleUser,
        identityApiRequest
    ) {};
    IdentityHandler.prototype.onModifyComplete = function(
        mParticleUser,
        identityApiRequest
    ) {};

    /*  In previous versions of the mParticle web SDK, setting user identities on
        kits is only reachable via the onSetUserIdentity method below. We recommend
        filling out `onSetUserIdentity` for maximum compatibility
    */
    IdentityHandler.prototype.onSetUserIdentity = function(
        forwarderSettings,
        id,
        type
    ) {};

    var identityHandler = IdentityHandler;

    var initialization = {
        name: 'DoubleclickDFP',
        moduleId: 41,
        initForwarder: function(
            settings,
            testMode,
            userAttributes,
            userIdentities,
            processEvent,
            eventQueue,
            isInitialized,
            common
        ) {
            common.settings = settings;

            if (common.settings.consentMappingWeb) {
                common.consentMappings = parseSettingsString(
                    common.settings.consentMappingWeb
                );
            } else {
                // Ensures consent mappings is an empty array
                // for future use
                common.consentMappings = [];
                common.consentPayloadDefaults = {};
                common.consentPayloadAsString = '';
            }

            window.dataLayer = window.dataLayer || [];
            if (!testMode) {
                var url =
                    'https://www.googletagmanager.com/gtag/js?id=' +
                    settings.advertiserId;

                var gTagScript = document.createElement('script');
                gTagScript.type = 'text/javascript';
                gTagScript.async = true;
                gTagScript.src = url;
                (
                    document.getElementsByTagName('head')[0] ||
                    document.getElementsByTagName('body')[0]
                ).appendChild(gTagScript);
                gTagScript.onload = function() {

                    initializeGoogleDFP(common, settings);

                    if (eventQueue.length > 0) {
                        // Process any events that may have been queued up while forwarder was being initialized.
                        for (var i = 0; i < eventQueue.length; i++) {
                            processEvent(eventQueue[i]);
                        }
                        // now that each queued event is processed, we empty the eventQueue
                        eventQueue = [];
                    }
                };
            } else {
                initializeGoogleDFP(common, settings);
            }

            common.consentPayloadDefaults = common.consentHandler.getConsentSettings();
            var defaultConsentPayload = common.cloneObject(
                common.consentPayloadDefaults
            );
            var updatedConsentState = common.consentHandler.getUserConsentState();
            var updatedDefaultConsentPayload = common.consentHandler.generateConsentStatePayloadFromMappings(
                updatedConsentState,
                common.consentMappings
            );

            // If a default consent payload exists (as selected in the mParticle UI), set it as the default
            if (!common.isEmpty(defaultConsentPayload)) {
                common.sendDefaultConsentPayloadToGoogle(defaultConsentPayload);
                // If a default consent payload does not exist, but the user currently has updated their consent,
                // send that as the default because a default must be sent
            } else if (!common.isEmpty(updatedDefaultConsentPayload)) {
                common.sendDefaultConsentPayloadToGoogle(
                    updatedDefaultConsentPayload
                );
            }

            common.maybeSendConsentUpdateToGoogle(updatedConsentState);
        },
    };

    function initializeGoogleDFP(common, settings, isInitialized) {
        common.eventMapping = parseSettingsString(settings.eventMapping);

        common.customVariablesMappings = parseSettingsString(
            settings.customVariables
        ).reduce(function(a, b) {
            a[b.map] = b.value;
            return a;
        }, {});
        common.customFieldMappings = parseSettingsString(
            settings.customParams
        ).reduce(function(a, b) {
            a[b.map] = b.value;
            return a;
        }, {});
        common.sendGtag('js', new Date(), true);
        common.sendGtag('allow_custom_scripts', true, true);
        common.sendGtag('config', settings.advertiserId, true);
    }

    function parseSettingsString(settingsString) {
        if (!settingsString) {
            return [];
        }
        try {
            return JSON.parse(settingsString.replace(/&quot;/g, '"'));
        } catch (error) {
            console.error('Settings string contains invalid JSON');
        }
        return [];
    }

    var initialization_1 = initialization;

    var sessionHandler = {
        onSessionStart: function(event) {},
        onSessionEnd: function(event) {},
    };

    var sessionHandler_1 = sessionHandler;

    /*
    The 'mParticleUser' is an object with methods on it to get user Identities and set/get user attributes
    Partners can determine what userIds are available to use in their SDK
    Call mParticleUser.getUserIdentities() to return an object of userIdentities --> { userIdentities: {customerid: '1234', email: 'email@gmail.com'} }
    For more identity types, see http://docs.mparticle.com/developers/sdk/javascript/identity#allowed-identity-types
    Call mParticleUser.getMPID() to get mParticle ID
    For any additional methods, see http://docs.mparticle.com/developers/sdk/javascript/apidocs/classes/mParticle.Identity.getCurrentUser().html
    */

    function UserAttributeHandler(common) {
        this.common = common = {};
    }

    UserAttributeHandler.prototype.onRemoveUserAttribute = function(
        key,
        mParticleUser
    ) {};
    UserAttributeHandler.prototype.onSetUserAttribute = function(
        key,
        value,
        mParticleUser
    ) {};
    UserAttributeHandler.prototype.onConsentStateUpdated = function(
        oldState,
        newState,
        mParticleUser
    ) {};

    var userAttributeHandler = UserAttributeHandler;

    // =============== REACH OUT TO MPARTICLE IF YOU HAVE ANY QUESTIONS ===============
    //
    //  Copyright 2018 mParticle, Inc.
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









    var name = initialization_1.name,
        moduleId = initialization_1.moduleId,
        MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            Commerce: 16,
            Media: 20,
        };

    var constructor = function() {
        var self = this,
            isInitialized = false,
            forwarderSettings,
            reportingService,
            eventQueue = [];

        self.name = initialization_1.name;
        self.moduleId = initialization_1.moduleId;
        self.common = new common();

        function initForwarder(
            settings,
            service,
            testMode,
            trackerId,
            userAttributes,
            userIdentities,
            appVersion,
            appName,
            customFlags,
            clientId
        ) {
            forwarderSettings = settings;

            if (
                typeof window !== 'undefined' &&
                window.mParticle.isTestEnvironment
            ) {
                reportingService = function() {};
            } else {
                reportingService = service;
            }

            try {
                initialization_1.initForwarder(
                    settings,
                    testMode,
                    userAttributes,
                    userIdentities,
                    processEvent,
                    eventQueue,
                    isInitialized,
                    self.common,
                    appVersion,
                    appName,
                    customFlags,
                    clientId
                );
                self.eventHandler = new eventHandler(self.common);
                self.identityHandler = new identityHandler(self.common);
                self.userAttributeHandler = new userAttributeHandler(self.common);
                self.commerceHandler = new commerceHandler(self.common);

                isInitialized = true;
            } catch (e) {
                console.log('Failed to initialize ' + name + ' - ' + e);
            }
        }

        function processEvent(event) {
            var reportEvent = false;
            if (isInitialized) {
                try {
                    if (event.EventDataType === MessageType.SessionStart) {
                        reportEvent = logSessionStart(event);
                    } else if (event.EventDataType === MessageType.SessionEnd) {
                        reportEvent = logSessionEnd(event);
                    } else if (event.EventDataType === MessageType.CrashReport) {
                        reportEvent = logError(event);
                    } else if (event.EventDataType === MessageType.PageView) {
                        reportEvent = logPageView(event);
                    } else if (event.EventDataType === MessageType.Commerce) {
                        reportEvent = logEcommerceEvent(event);
                    } else if (event.EventDataType === MessageType.PageEvent) {
                        reportEvent = logEvent(event);
                    } else if (event.EventDataType === MessageType.Media) {
                        // Kits should just treat Media Events as generic Events
                        reportEvent = logEvent(event);
                    }
                    if (reportEvent === true && reportingService) {
                        reportingService(self, event);
                        return 'Successfully sent to ' + name;
                    } else {
                        return (
                            'Error logging event or event type not supported on forwarder ' +
                            name
                        );
                    }
                } catch (e) {
                    return 'Failed to send to ' + name + ' ' + e;
                }
            } else {
                eventQueue.push(event);
                return (
                    "Can't send to forwarder " +
                    name +
                    ', not initialized. Event added to queue.'
                );
            }
        }

        function logSessionStart(event) {
            try {
                return sessionHandler_1.onSessionStart(event);
            } catch (e) {
                return {
                    error: 'Error starting session on forwarder ' + name + '; ' + e,
                };
            }
        }

        function logSessionEnd(event) {
            try {
                return sessionHandler_1.onSessionEnd(event);
            } catch (e) {
                return {
                    error: 'Error ending session on forwarder ' + name + '; ' + e,
                };
            }
        }

        function logError(event) {
            try {
                return self.eventHandler.logError(event);
            } catch (e) {
                return {
                    error: 'Error logging error on forwarder ' + name + '; ' + e,
                };
            }
        }

        function logPageView(event) {
            try {
                return self.eventHandler.logPageView(event);
            } catch (e) {
                return {
                    error:
                        'Error logging page view on forwarder ' + name + '; ' + e,
                };
            }
        }

        function logEvent(event) {
            try {
                return self.eventHandler.logEvent(event);
            } catch (e) {
                return {
                    error: 'Error logging event on forwarder ' + name + '; ' + e,
                };
            }
        }

        function logEcommerceEvent(event) {
            try {
                return self.commerceHandler.logCommerceEvent(event);
            } catch (e) {
                return {
                    error:
                        'Error logging purchase event on forwarder ' +
                        name +
                        '; ' +
                        e,
                };
            }
        }

        function setUserAttribute(key, value) {
            if (isInitialized) {
                try {
                    self.userAttributeHandler.onSetUserAttribute(
                        key,
                        value,
                        forwarderSettings
                    );
                    return 'Successfully set user attribute on forwarder ' + name;
                } catch (e) {
                    return (
                        'Error setting user attribute on forwarder ' +
                        name +
                        '; ' +
                        e
                    );
                }
            } else {
                return (
                    "Can't set user attribute on forwarder " +
                    name +
                    ', not initialized'
                );
            }
        }

        function removeUserAttribute(key) {
            if (isInitialized) {
                try {
                    self.userAttributeHandler.onRemoveUserAttribute(
                        key,
                        forwarderSettings
                    );
                    return (
                        'Successfully removed user attribute on forwarder ' + name
                    );
                } catch (e) {
                    return (
                        'Error removing user attribute on forwarder ' +
                        name +
                        '; ' +
                        e
                    );
                }
            } else {
                return (
                    "Can't remove user attribute on forwarder " +
                    name +
                    ', not initialized'
                );
            }
        }

        function setUserIdentity(id, type) {
            if (isInitialized) {
                try {
                    self.identityHandler.onSetUserIdentity(
                        forwarderSettings,
                        id,
                        type
                    );
                    return 'Successfully set user Identity on forwarder ' + name;
                } catch (e) {
                    return (
                        'Error removing user attribute on forwarder ' +
                        name +
                        '; ' +
                        e
                    );
                }
            } else {
                return (
                    "Can't call setUserIdentity on forwarder " +
                    name +
                    ', not initialized'
                );
            }
        }

        function onUserIdentified(user) {
            if (isInitialized) {
                try {
                    self.identityHandler.onUserIdentified(user);

                    return (
                        'Successfully called onUserIdentified on forwarder ' + name
                    );
                } catch (e) {
                    return {
                        error:
                            'Error calling onUserIdentified on forwarder ' +
                            name +
                            '; ' +
                            e,
                    };
                }
            } else {
                return (
                    "Can't set new user identities on forwader  " +
                    name +
                    ', not initialized'
                );
            }
        }

        function onIdentifyComplete(user, filteredIdentityRequest) {
            if (isInitialized) {
                try {
                    self.identityHandler.onIdentifyComplete(
                        user,
                        filteredIdentityRequest
                    );

                    return (
                        'Successfully called onIdentifyComplete on forwarder ' +
                        name
                    );
                } catch (e) {
                    return {
                        error:
                            'Error calling onIdentifyComplete on forwarder ' +
                            name +
                            '; ' +
                            e,
                    };
                }
            } else {
                return (
                    "Can't call onIdentifyCompleted on forwader  " +
                    name +
                    ', not initialized'
                );
            }
        }

        function onLoginComplete(user, filteredIdentityRequest) {
            if (isInitialized) {
                try {
                    self.identityHandler.onLoginComplete(
                        user,
                        filteredIdentityRequest
                    );

                    return (
                        'Successfully called onLoginComplete on forwarder ' + name
                    );
                } catch (e) {
                    return {
                        error:
                            'Error calling onLoginComplete on forwarder ' +
                            name +
                            '; ' +
                            e,
                    };
                }
            } else {
                return (
                    "Can't call onLoginComplete on forwader  " +
                    name +
                    ', not initialized'
                );
            }
        }

        function onLogoutComplete(user, filteredIdentityRequest) {
            if (isInitialized) {
                try {
                    self.identityHandler.onLogoutComplete(
                        user,
                        filteredIdentityRequest
                    );

                    return (
                        'Successfully called onLogoutComplete on forwarder ' + name
                    );
                } catch (e) {
                    return {
                        error:
                            'Error calling onLogoutComplete on forwarder ' +
                            name +
                            '; ' +
                            e,
                    };
                }
            } else {
                return (
                    "Can't call onLogoutComplete on forwader  " +
                    name +
                    ', not initialized'
                );
            }
        }

        function onModifyComplete(user, filteredIdentityRequest) {
            if (isInitialized) {
                try {
                    self.identityHandler.onModifyComplete(
                        user,
                        filteredIdentityRequest
                    );

                    return (
                        'Successfully called onModifyComplete on forwarder ' + name
                    );
                } catch (e) {
                    return {
                        error:
                            'Error calling onModifyComplete on forwarder ' +
                            name +
                            '; ' +
                            e,
                    };
                }
            } else {
                return (
                    "Can't call onModifyComplete on forwader  " +
                    name +
                    ', not initialized'
                );
            }
        }

        function setOptOut(isOptingOutBoolean) {
            if (isInitialized) {
                try {
                    self.initialization.setOptOut(isOptingOutBoolean);

                    return 'Successfully called setOptOut on forwarder ' + name;
                } catch (e) {
                    return {
                        error:
                            'Error calling setOptOut on forwarder ' +
                            name +
                            '; ' +
                            e,
                    };
                }
            } else {
                return (
                    "Can't call setOptOut on forwader  " +
                    name +
                    ', not initialized'
                );
            }
        }

        this.init = initForwarder;
        this.process = processEvent;
        this.setUserAttribute = setUserAttribute;
        this.removeUserAttribute = removeUserAttribute;
        this.onUserIdentified = onUserIdentified;
        this.setUserIdentity = setUserIdentity;
        this.onIdentifyComplete = onIdentifyComplete;
        this.onLoginComplete = onLoginComplete;
        this.onLogoutComplete = onLogoutComplete;
        this.onModifyComplete = onModifyComplete;
        this.setOptOut = setOptOut;
    };

    function getId() {
        return moduleId;
    }

    function isObject(val) {
        return (
            val != null && typeof val === 'object' && Array.isArray(val) === false
        );
    }

    function register(config) {
        if (!config) {
            console.log(
                'You must pass a config object to register the kit ' + name
            );
            return;
        }

        if (!isObject(config)) {
            console.log(
                "'config' must be an object. You passed in a " + typeof config
            );
            return;
        }

        if (isObject(config.kits)) {
            config.kits[name] = {
                constructor: constructor,
            };
        } else {
            config.kits = {};
            config.kits[name] = {
                constructor: constructor,
            };
        }
        console.log(
            'Successfully registered ' + name + ' to your mParticle configuration'
        );
    }

    if (typeof window !== 'undefined') {
        if (window && window.mParticle && window.mParticle.addForwarder) {
            window.mParticle.addForwarder({
                name: name,
                constructor: constructor,
                getId: getId,
            });
        }
    }

    var webKitWrapper = {
        register: register,
    };
    var webKitWrapper_1 = webKitWrapper.register;

    exports.default = webKitWrapper;
    exports.register = webKitWrapper_1;

    return exports;

}({}));
