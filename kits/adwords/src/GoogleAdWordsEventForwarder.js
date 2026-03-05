/* eslint-disable no-undef*/

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

    var name = 'GoogleAdWords',
        moduleId = 82,
        MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            Commerce: 16
        },
        ENHANCED_CONVERSION_DATA = "GoogleAds.ECData";

    // Declares valid Google consent values
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

    var constructor = function () {
        var self = this,
            isInitialized = false,
            forwarderSettings,
            labels,
            customAttributeMappings,
            consentMappings = [],
            consentPayloadDefaults = {},
            consentPayloadAsString = '',
            reportingService,
            eventQueue = [],
            gtagSiteId;

        self.name = name;

        function processEvent(event) {
            var reportEvent = false;
            var sendEventFunction = function() {};
            var generateEventFunction = function () {};
            var conversionLabel;
            var eventPayload;

            if (isInitialized) {
                // First, process anything in the queue
                processQueue(eventQueue);

                try {
                    if (window.gtag && forwarderSettings.enableGtag == 'True') {
                        // If consent payload is empty,
                        // we never sent an initial default consent state
                        // so we shouldn't send an update.
                        var eventConsentState = getEventConsentState(event.ConsentState);
                        maybeSendConsentUpdateToGoogle(eventConsentState)

                        if (
                            forwarderSettings.enableEnhancedConversions ===
                                'True' &&
                            hasEnhancedConversionData(event.CustomFlags)
                        ) {
                            window.enhanced_conversion_data =
                                parseEnhancedConversionData(
                                    event.CustomFlags[ENHANCED_CONVERSION_DATA]
                                );
                        }

                        sendEventFunction = sendGtagEvent;
                        generateEventFunction = generateGtagEvent;
                        generateCommerceEvent = generateGtagCommerceEvent;

                    } else if (window.google_trackConversion) {
                        // window.google_trackConversion is a legacy API and will be deprecated
                        sendEventFunction = sendAdwordsEvent;
                        generateEventFunction = generateAdwordsEvent;
                        generateCommerceEvent = generateAdwordsCommerceEvent;

                    } else {
                        eventQueue.push({
                            action: processEvent,
                            data: event
                        })

                        return 'Can\'t send to forwarder ' + name + ', not initialized. Event added to queue.';
                    }

                    // Get conversionLabel to be used for event generation
                    var conversionLabel = getConversionLabel(event);
                    var customProps = getCustomProps(event);

                    if (conversionLabel) {
                        // Determines the proper event to fire
                        if (event.EventDataType == MessageType.PageView || event.EventDataType == MessageType.PageEvent) {
                            eventPayload = generateEventFunction(event, conversionLabel, customProps);
                        } else if (event.EventDataType == MessageType.Commerce && event.ProductAction) {
                            eventPayload = generateCommerceEvent(event, conversionLabel, customProps);
                        }
    
                        if (eventPayload) {
                           reportEvent = sendEventFunction(eventPayload);
                        }
    
                        if (reportEvent && reportingService) {
                            reportingService(self, event);
    
                            return 'Successfully sent to ' + name;
                        }
                    }

                    return 'Can\'t send to forwarder: ' + name + '. Event not mapped';
                } catch (e) {
                    console.error('Can\t send to forwarder', e);
                    return 'Can\'t send to forwarder: ' + name + ' ' + e;
                }
            } else {
                eventQueue.push({
                    action: processEvent,
                    data: event
                })
            }

            return 'Can\'t send to forwarder ' + name + ', not initialized. Event added to queue.';
        }

        function hasEnhancedConversionData(customFlags) {
            return customFlags && Object.keys(customFlags).length && customFlags[ENHANCED_CONVERSION_DATA];
        }

        function parseEnhancedConversionData(conversionData) {
            // Checks if conversion data in custom flags is a stringified object
            // Conversion data should only be a stringified object or a JS object 
            if (typeof conversionData === 'string') {
                try {
                    return JSON.parse(conversionData);
                } catch (error) {
                    console.warn('Unrecognized Enhanced Conversion Data Format', conversionData, error);
                    return {};
                }
            } else if (typeof conversionData === 'object') {
                // Not a stringified object so it can be used as-is. However,
                // we want to avoid mutating the original state, so we make a copy.
                return cloneObject(conversionData);
            } else {
                console.warn('Unrecognized Enhanced Conversion Data Format', conversionData);
                return {};
            }

        }

        // Converts an mParticle Commerce Event into either Legacy or gtag Event
        function generateCommerceEvent(mPEvent, conversionLabel, isPageEvent) {
            if (mPEvent.ProductAction
                && mPEvent.ProductAction.ProductList
                && mPEvent.ProductAction.ProductActionType) {

                if (window.gtag && forwarderSettings.enableGtag == 'True') {
                    return generateGtagCommerceEvent(mPEvent, conversionLabel, isPageEvent);
                } else if (window.google_trackConversion) {
                    return generateAdwordsCommerceEvent(mPEvent, conversionLabel, isPageEvent);
                } else {
                    console.error('Unrecognized Commerce Event', mPEvent);
                    return false;
                }
                    
            } else {
                return false;
            }
        }

        function getUserConsentState() {
            var userConsentState = {};

            if (window.mParticle && window.mParticle.Identity && window.mParticle.Identity.getCurrentUser) {
                var currentUser = window.mParticle.Identity.getCurrentUser();

                if (!currentUser) {
                    return {};
                }

                var consentState =
                    window.mParticle.Identity.getCurrentUser().getConsentState();

                if (consentState && consentState.getGDPRConsentState) {
                    userConsentState = consentState.getGDPRConsentState();
                }
            }

            return userConsentState;
        }

        function getEventConsentState(eventConsentState) {
            return eventConsentState && eventConsentState.getGDPRConsentState
                ? eventConsentState.getGDPRConsentState()
                : {};
        };

        // ** Adwords Events
        function getBaseAdWordEvent() {
            var adWordEvent = {};
            adWordEvent.google_conversion_value = 0;
            adWordEvent.google_conversion_language = 'en';
            adWordEvent.google_conversion_format = '3';
            adWordEvent.google_conversion_color = 'ffffff';
            adWordEvent.google_remarketing_only = forwarderSettings.remarketingOnly == 'True';
            adWordEvent.google_conversion_id = forwarderSettings.conversionId;
            return adWordEvent;
        }

        function generateAdwordsEvent(mPEvent, conversionLabel, customProps) {
            var adWordEvent = getBaseAdWordEvent();
            adWordEvent.google_conversion_label = conversionLabel;
            adWordEvent.google_custom_params = customProps;

            return adWordEvent;
        }

        function generateAdwordsCommerceEvent(mPEvent, conversionLabel, customProps) {
            var adWordEvent = getBaseAdWordEvent();
            adWordEvent.google_conversion_label = conversionLabel;

            if (mPEvent.ProductAction.ProductActionType === mParticle.ProductActionType.Purchase
                && mPEvent.ProductAction.TransactionId) {
                adWordEvent.google_conversion_order_id = mPEvent.ProductAction.TransactionId;
            }

            if (mPEvent.CurrencyCode) {
                adWordEvent.google_conversion_currency = mPEvent.CurrencyCode;
            }

            if (mPEvent.ProductAction.TotalAmount) {
                adWordEvent.google_conversion_value = mPEvent.ProductAction.TotalAmount;
            }

            adWordEvent.google_custom_params = customProps;
            return adWordEvent;
        }

        function getConsentSettings() {
            var consentSettings = {};

            var googleToMpConsentSettingsMapping = {
                // Inherited from S2S Integration Settings
                ad_user_data: 'defaultAdUserDataConsent',
                ad_personalization: 'defaultAdPersonalizationConsent',

                // Unique to Web Kits
                ad_storage: 'defaultAdStorageConsentWeb',
                analytics_storage: 'defaultAnalyticsStorageConsentWeb'
            }

            Object.keys(googleToMpConsentSettingsMapping).forEach(function (googleConsentKey) {
                var mpConsentSettingKey = googleToMpConsentSettingsMapping[googleConsentKey];
                var googleConsentValuesKey = forwarderSettings[mpConsentSettingKey]

                if (googleConsentValuesKey && mpConsentSettingKey){
                    consentSettings[googleConsentKey] = googleConsentValues[googleConsentValuesKey];
                }
            });
    
            return consentSettings;
        }

        // gtag Events
        function getBaseGtagEvent(conversionLabel) {
            return {
                'send_to': gtagSiteId + '/' + conversionLabel,
                'value': 0,
                'language': 'en',
                'remarketing_only': forwarderSettings.remarketingOnly == 'True'
            }
        }

        function generateGtagEvent(mPEvent, conversionLabel, customProps) {
            if (!conversionLabel) { return null; };

            var conversionPayload = getBaseGtagEvent(conversionLabel);
            conversionPayload.transaction_id = mPEvent.SourceMessageId;
            return mergeObjects(conversionPayload, customProps);
        }

        function generateGtagCommerceEvent(mPEvent, conversionLabel, customProps) {
            if (!conversionLabel) { return null; };

            var conversionPayload = getBaseGtagEvent(conversionLabel);

            if (mPEvent.ProductAction.ProductActionType === mParticle.ProductActionType.Purchase
                && mPEvent.ProductAction.TransactionId) {
                conversionPayload.transaction_id = mPEvent.ProductAction.TransactionId;
            } else {
                conversionPayload.transaction_id = mPEvent.SourceMessageId;
            }

            if (mPEvent.CurrencyCode) {
                conversionPayload.currency = mPEvent.CurrencyCode;
            }

            if (mPEvent.ProductAction.TotalAmount) {
                conversionPayload.value = mPEvent.ProductAction.TotalAmount;
            }

            return mergeObjects(conversionPayload, customProps);
        }

        function sendGtagEvent(payload) {
            // https://go.mparticle.com/work/SQDSDKS-6165
            try {
                gtag('event', 'conversion', payload);
            } catch (e) {
                console.error('gtag is not available to send payload: ', payload, e);
                return false;
            }
            return true;
        }

        function maybeSendConsentUpdateToGoogle(consentState) {
            if (
                consentPayloadAsString && 
                forwarderSettings.consentMappingWeb &&
                !isEmpty(consentState)
            ) {
                var updatedConsentPayload = generateConsentStatePayloadFromMappings(
                    consentState,
                    consentMappings,
                );

                var eventConsentAsString =
                    JSON.stringify(updatedConsentPayload);

                if (eventConsentAsString !== consentPayloadAsString) {
                    sendGtagConsentUpdate(updatedConsentPayload);
                    consentPayloadAsString = eventConsentAsString;
                }
            }
        }

        function sendGtagConsentDefaults(payload) {
            // https://go.mparticle.com/work/SQDSDKS-6165
            consentPayloadAsString = JSON.stringify(
                payload
            );

            try {
                gtag('consent', 'default', payload);
            } catch (e) {
                console.error('gtag is not available to send consent defaults: ', payload, e);
                return false;
            }
            return true;
        }

        function sendGtagConsentUpdate(payload) {
            // https://go.mparticle.com/work/SQDSDKS-6165
            try {
                gtag('consent', 'update', payload);
            } catch (e) {
                console.error('gtag is not available to send consent update: ', payload, e);
                return false;
            }
            return true;
        }

        function sendAdwordsEvent(payload) {
            try {
                window.google_trackConversion(payload);
            } catch (e) {
                console.error('google_trackConversion is not available to send payload: ', payload, e);
                return false;
            }
            return true;
        }

        // Creates a new Consent State Payload based on Consent State and Mapping
        function generateConsentStatePayloadFromMappings(consentState, mappings) {
            if (!mappings) return {};
            var payload = cloneObject(consentPayloadDefaults);
    
            for (var i = 0; i <= mappings.length - 1; i++) {
                var mappingEntry = mappings[i];
                // Although consent purposes can be inputted into the UI in any casing
                // the SDK will automatically lowercase them to prevent pseudo-duplicate
                // consent purposes, so we call `toLowerCase` on the consentMapping purposes here
                var mpMappedConsentName = mappingEntry.map.toLowerCase();
                // var mpMappedConsentName = mappingEntry.map;
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
        }

        // Looks up an Event's conversionLabel from customAttributeMappings based on computed jsHash value
        function getConversionLabel(event) {
            var jsHash = calculateJSHash(event.EventDataType, event.EventCategory, event.EventName);
            var type = event.EventDataType === MessageType.PageEvent ? 'EventClass.Id' : 'EventClassDetails.Id';
            var conversionLabel = null;
            var mappingEntry = findValueInMapping(jsHash, type, labels);

            if (mappingEntry) {
                conversionLabel = mappingEntry.value;
            }

            return conversionLabel;
        }

        // Filters Event.EventAttributes for attributes that are in customAttributeMappings
        function getCustomProps(event) {
            var customProps = {};
            var attributes = event.EventAttributes;
            var type = event.EventDataType === MessageType.PageEvent ? 'EventAttributeClass.Id' : 'EventAttributeClassDetails.Id';

            if (attributes) {
                for (var attributeKey in attributes) {
                    if (attributes.hasOwnProperty(attributeKey)) {
                        var jsHash = calculateJSHash(event.EventDataType, event.EventCategory, attributeKey);
                        var mappingEntry = findValueInMapping(jsHash, type, customAttributeMappings);
                        if (mappingEntry) {
                            customProps[mappingEntry.value] = attributes[attributeKey];
                        }
                    }
                }
            }

            return customProps;
        }

        function findValueInMapping(jsHash, type, mapping) {
            if (mapping) {
                var filteredArray = mapping.filter(function (mappingEntry) {

                    if (mappingEntry.jsmap && mappingEntry.maptype && mappingEntry.value) {
                        return mappingEntry.jsmap == jsHash && mappingEntry.maptype == type;
                    }

                    return false;
                });

                if (filteredArray && filteredArray.length > 0) {
                    return filteredArray[0];
                }
            }
            return null;
        }

        function calculateJSHash(eventDataType, eventCategory, name) {
            var preHash = [eventDataType, eventCategory, name].join('');

            return mParticle.generateHash(preHash);
        }

        function loadGtagSnippet() {
            (function () {
                window.dataLayer = window.dataLayer || [];
                window.gtag = function(){dataLayer.push(arguments);}

                var gTagScript = document.createElement('script');
                gTagScript.async = true;
                gTagScript.onload = function () {
                    gtag('js', new Date());
                    if (forwarderSettings.enableEnhancedConversions === 'True') {
                        gtag('config', gtagSiteId, {
                            allow_enhanced_conversions: true
                        });
                    } else {
                        gtag('config', gtagSiteId);
                    }
                    isInitialized = true;
                    processQueue(eventQueue);
                };
                gTagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + gtagSiteId;
                document.getElementsByTagName('head')[0].appendChild(gTagScript);
            })();
        }

        function loadLegacySnippet() {
            (function () {
                var googleAdwords = document.createElement('script');
                googleAdwords.type = 'text/javascript';
                googleAdwords.async = true;
                googleAdwords.onload = function() {
                    isInitialized = true;
                    processQueue(eventQueue);
                };
                googleAdwords.src = ('https:' == document.location.protocol ? 'https' : 'http') + '://www.googleadservices.com/pagead/conversion_async.js';
                document.getElementsByTagName('head')[0].appendChild(googleAdwords);
            })();
        }

        // https://go.mparticle.com/work/SQDSDKS-6166
        function initForwarder(settings, service, testMode) {
            window.enhanced_conversion_data = {};
            forwarderSettings = settings;
            reportingService = service;

            try {
                if (!forwarderSettings.conversionId) {
                    return 'Can\'t initialize forwarder: ' + name + ', conversionId is not defined';
                }

                gtagSiteId = "AW-" + forwarderSettings.conversionId;

                if (testMode !== true) {
                    if (forwarderSettings.enableGtag == 'True') {
                        loadGtagSnippet();
                    } else {
                        loadLegacySnippet();
                    }
                } else {
                    isInitialized = true;
                    processQueue(eventQueue);
                }

                if (!forwarderSettings.conversionId) {
                    return 'Can\'t initialize forwarder: ' + name + ', conversionId is not defined';
                }

                // https://go.mparticle.com/work/SQDSDKS-6165
                if (window.gtag && forwarderSettings.enableGtag === 'True') {
                    if (forwarderSettings.consentMappingWeb) {
                        consentMappings = parseSettingsString(
                            forwarderSettings.consentMappingWeb
                        );
                    } else {
                        // Ensures consent mappings is an empty array
                        // for future use
                        consentMappings = [];
                    }
    
                    consentPayloadDefaults = getConsentSettings();
                    var defaultConsentPayload = cloneObject(consentPayloadDefaults);
                    var updatedConsentState = getUserConsentState();
                    var updatedDefaultConsentPayload =
                        generateConsentStatePayloadFromMappings(
                            updatedConsentState,
                            consentMappings
                        );
                    
                    if (!isEmpty(defaultConsentPayload)) {
                        sendGtagConsentDefaults(defaultConsentPayload)
                    } else if (!isEmpty(updatedDefaultConsentPayload)) {
                        sendGtagConsentDefaults(updatedDefaultConsentPayload)
                    }

                    maybeSendConsentUpdateToGoogle(updatedConsentState)

                }

                forwarderSettings.remarketingOnly = forwarderSettings.remarketingOnly == 'True';

                try {
                    if (forwarderSettings.labels) {
                        labels = JSON.parse(forwarderSettings.labels.replace(/&quot;/g, '"'));
                    }

                    if (forwarderSettings.customParameters) {
                        customAttributeMappings = JSON.parse(forwarderSettings.customParameters.replace(/&quot;/g, '"'));
                    }
                } catch (e) {
                    return 'Can\'t initialize forwarder: ' + name + ', Could not process event to label mapping';
                }

                return 'Successfully initialized: ' + name;
            }
            catch (e) {
                return 'Failed to initialize: ' + name;
            }
        }

        function processQueue(queue) {
            var item;
            
            if ((window.gtag || window.google_trackConversion) && queue.length > 0) {
                try {
                    while (queue.length > 0) {
                        item = queue.shift()
                        item.action(item.data);
                    }
                } catch (e) {
                    console.error('Error on mParticle Adwords Kit', e);
                }
            }
        }

        this.init = initForwarder;
        this.process = processEvent;
        this.processQueue = processQueue;
    };

    function getId() {
        return moduleId;
    }

    function register(config) {
        if (!config) {
            console.log('You must pass a config object to register the kit ' + name);
            return;
        }

        if (!isObject(config)) {
            console.log('\'config\' must be an object. You passed in a ' + typeof config);
            return;
        }

        if (isObject(config.kits)) {
            config.kits[name] = {
                constructor: constructor
            };
        } else {
            config.kits = {};
            config.kits[name] = {
                constructor: constructor
            };
        }
        console.log('Successfully registered ' + name + ' to your mParticle configuration');
    }

    function parseSettingsString(settingsString) {
        return JSON.parse(settingsString.replace(/&quot;/g, '"'));
    }

    function isObject(val) {
        return val != null && typeof val === 'object' && Array.isArray(val) === false;
    }

    function isEmpty(value) {
        return value == null || !(Object.keys(value) || value).length;
    }

    function mergeObjects() {
        var resObj = {};
        for(var i=0; i < arguments.length; i += 1) {
             var obj = arguments[i],
                 keys = Object.keys(obj);
             for(var j=0; j < keys.length; j += 1) {
                 resObj[keys[j]] = obj[keys[j]];
             }
        }
        return resObj;
    }

    function cloneObject(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    if (typeof window !== 'undefined') {
        if (window && window.mParticle && window.mParticle.addForwarder) {
            window.mParticle.addForwarder({
                name: name,
                constructor: constructor,
                getId: getId
            });
        }
    }

    export default {
        register: register
    };
