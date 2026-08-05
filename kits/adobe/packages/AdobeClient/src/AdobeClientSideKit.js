// START OF ADOBE MPARTICLE JS INTEGRATION

/* eslint-disable no-undef */

//
//  Copyright 2018 mParticle, Inc.
//
//  Licensed under the Apache License, Version 2.0 (the 'License');
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an 'AS IS' BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

import { AdobeHbkConstructor } from '../../../HeartbeatKit/dist/AdobeHBKit.esm.js';

var name = 'Adobe',
    ADOBEMODULENUMBER = 124,
    MARKETINGCLOUDIDKEY = 'mid',
    MessageType = {
        SessionStart: 1,
        SessionEnd: 2,
        PageView: 3,
        PageEvent: 4,
        CrashReport: 5,
        OptOut: 6,
        Commerce: 16,
        Media: 20
    },
    //Custom Flag Names
    LINK_NAME = 'Adobe.LinkName',
    PAGE_NAME = 'Adobe.PageName';

var constructor = function() {
    var self = this,
        //one or more instances of AppMeasurement returned from s_gi()
        appMeasurement,
        settings,
        timestampOption,
        isAdobeClientKitInitialized = false,
        reportingService,
        contextVariableMapping,
        productIncrementorMapping,
        productMerchandisingMapping,
        propsMapping,
        eVarsMapping,
        hiersMapping,
        eventsMapping;

    (self.adobeMediaSDK = new AdobeHbkConstructor()), (self.name = name);

    function initForwarder(forwarderSettings, service, testMode) {
        settings = forwarderSettings;
        reportingService = service;
        try {
            loadMappings();
            timestampOption =
                settings.timestampOption === 'optional' ||
                settings.timestampOption === 'required';
            finishAdobeInitialization();
            if (settings.mediaTrackingServer) {
                self.adobeMediaSDK.init(forwarderSettings, service, testMode);
            }
            isAdobeClientKitInitialized = true;

            return 'ClientSDK successfully loaded';
        } catch (e) {
            return 'Failed to initialize: ' + e;
        }
    }

    function loadMappings() {
        eVarsMapping = settings.evars
            ? JSON.parse(settings.evars.replace(/&quot;/g, '"'))
            : [];
        propsMapping = settings.props
            ? JSON.parse(settings.props.replace(/&quot;/g, '"'))
            : [];
        productIncrementorMapping = settings.productIncrementor
            ? JSON.parse(settings.productIncrementor.replace(/&quot;/g, '"'))
            : [];
        productMerchandisingMapping = settings.productMerchandising
            ? JSON.parse(settings.productMerchandising.replace(/&quot;/g, '"'))
            : [];
        hiersMapping = settings.hvars
            ? JSON.parse(settings.hvars.replace(/&quot;/g, '"'))
            : [];
        eventsMapping = settings.events
            ? JSON.parse(settings.events.replace(/&quot;/g, '"'))
            : [];
        contextVariableMapping = settings.contextVariables
            ? JSON.parse(settings.contextVariables.replace(/&quot;/g, '"'))
            : [];
    }

    function finishAdobeInitialization() {
        var visitorOptions = {};
        if (settings.audienceManagerServer) {
            visitorOptions.audienceManagerServer =
                settings.audienceManagerServer;
        }
        try {
            appMeasurement = s_gi(settings.reportSuiteIDs);
            if (settings.setGlobalObject === 'True') {
                window.s = appMeasurement;
            }
            appMeasurement.visitor = Visitor.getInstance(
                settings.organizationID,
                visitorOptions
            );

            appMeasurement.trackingServer = settings.trackingServer;

            appMeasurement.trackDownloadLinks = true;
            appMeasurement.trackExternalLinks =
                settings.trackExternalLinks === 'True';
            appMeasurement.trackInlineStats = true;
            appMeasurement.linkDownloadFileTypes =
                'exe,zip,wav,mp3,mov,mpg,avi,wmv,pdf,doc,docx,xls,xlsx,ppt,pptx';
            appMeasurement.linkInternalFilters = 'javascript:';
            appMeasurement.linkLeaveQueryString = false;
            appMeasurement.linkTrackVars = 'None';
            appMeasurement.linkTrackEvents = 'None';
            appMeasurement.visitorNamespace = '';

            // On first load, adobe will call the callback correctly if no MCID exists
            // On subsequent loads, it does not, so we need to manually call setMCIDOnIntegrationAttributes
            var mcID = Visitor.getInstance(
                settings.organizationID,
                visitorOptions
            ).getMarketingCloudVisitorID(setMarketingCloudId);
            if (mcID && mcID.length > 0) {
                setMCIDOnIntegrationAttributes(mcID);
            }

            return true;
        } catch (e) {
            return 'error initializing adobe: ' + e;
        }
    }

    function setMarketingCloudId(mcid) {
        setMCIDOnIntegrationAttributes(mcid);
    }

    function setMCIDOnIntegrationAttributes(mcid) {
        var adobeIntegrationAttributes = {};
        adobeIntegrationAttributes[MARKETINGCLOUDIDKEY] = mcid;
        mParticle.setIntegrationAttribute(
            ADOBEMODULENUMBER,
            adobeIntegrationAttributes
        );
        mParticle._setIntegrationDelay(ADOBEMODULENUMBER, false);
    }

    // Get the mapped value for custom events
    function getEventMappingValue(event) {
        var jsHash = calculateJSHash(
            event.EventDataType,
            event.EventCategory,
            event.EventName
        );
        return findValueInMapping(jsHash, eventsMapping);
    }

    function calculateJSHash(eventDataType, eventCategory, name) {
        var preHash =
            '' + eventDataType + ('' + eventCategory) + '' + (name || '');

        return mParticle.generateHash(preHash);
    }

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
                    result: false
                };
            });

            if (filteredArray && filteredArray.length > 0) {
                return {
                    result: true,
                    matches: filteredArray
                };
            }
        }
        return null;
    }

    // for each type of event, we run setMappings which sets the eVars, props, hvars, and contextData values
    // after each event is sent to the server (either using t() for pageViews or tl() for non-pageview events), clearVars() is run to wipe out
    function resetVariables() {
        appMeasurement.clearVars();
        appMeasurement.contextData = {};
    }
    // any eVars, props, and hvars
    function processEvent(event) {
        var linkName,
            pageName,
            reportEvent = false,
            linkTrackVars = [];

        appMeasurement.timestamp = timestampOption
            ? Math.floor(new Date().getTime() / 1000)
            : null;
        appMeasurement.events = '';
        if (event.CustomFlags && event.CustomFlags.hasOwnProperty(LINK_NAME)) {
            linkName = event.CustomFlags[LINK_NAME];
        }
        if (event.CustomFlags && event.CustomFlags.hasOwnProperty(PAGE_NAME)) {
            pageName = event.CustomFlags[PAGE_NAME];
        }

        if (isAdobeClientKitInitialized) {
            try {
                // First determine if an eventName is mapped, if so, log it as an event as opposed to a pageview or commerceview
                // ex. If a pageview is mapped to an event, we logEvent instead of logging it as a pageview
                var eventMapping = getEventMappingValue(event);

                if (
                    eventMapping &&
                    eventMapping.result &&
                    eventMapping.matches
                ) {
                    setMappings(event, true, linkTrackVars);
                    reportEvent = logEvent(
                        event,
                        linkTrackVars,
                        eventMapping.matches,
                        linkName,
                        pageName
                    );
                } else if (event.EventDataType === MessageType.PageView) {
                    setMappings(event, false);
                    reportEvent = logPageView(event, pageName);
                } else if (event.EventDataType === MessageType.Commerce) {
                    setMappings(event, true, linkTrackVars);
                    reportEvent = processCommerceTransaction(
                        event,
                        linkTrackVars,
                        linkName,
                        pageName
                    );
                } else if (event.EventDataType === MessageType.Media) {
                    self.adobeMediaSDK.process(event);
                } else {
                    return 'event name not mapped, aborting event logging';
                }

                if (
                    reportEvent === true &&
                    reportingService &&
                    event.EventDataType
                ) {
                    reportingService(self, event);
                    return 'Successfully sent to ' + name;
                }
            } catch (e) {
                return 'Failed to send to: ' + name + ' ' + e;
            }
        }

        return 'Cannot send to forwarder ' + name + ', not initialized.';
    }

    function setMappings(event, includeTrackVars, linkTrackVars) {
        if (includeTrackVars) {
            setEvars(event, linkTrackVars);
            setProps(event, linkTrackVars);
            setHiers(event, linkTrackVars);
            setContextData(event, linkTrackVars);
        } else {
            setEvars(event);
            setProps(event);
            setHiers(event);
            setContextData(event);
        }
    }

    function processCommerceTransaction(
        event,
        linkTrackVars,
        linkName,
        pageName
    ) {
        if (
            event.EventCategory === mParticle.CommerceEventType.ProductPurchase
        ) {
            appMeasurement.events = 'purchase';
            appMeasurement.purchaseID = event.ProductAction.TransactionId;
            appMeasurement.transactionID = event.ProductAction.TransactionId;
            linkTrackVars.push('purchaseID', 'transactionID');
        } else if (
            event.EventCategory ===
            mParticle.CommerceEventType.ProductViewDetail
        ) {
            appMeasurement.events = 'prodView';
        } else if (
            event.EventCategory === mParticle.CommerceEventType.ProductAddToCart
        ) {
            appMeasurement.events = 'scAdd';
        } else if (
            event.EventCategory ===
            mParticle.CommerceEventType.ProductRemoveFromCart
        ) {
            appMeasurement.events = 'scRemove';
        } else if (
            event.EventCategory === mParticle.CommerceEventType.ProductCheckout
        ) {
            appMeasurement.events = 'scCheckout';
        }
        appMeasurement.linkTrackEvents = appMeasurement.events || null;
        processProductsAndSetEvents(event, linkTrackVars);

        linkTrackVars.push('products', 'events');
        setPageName(linkTrackVars, appMeasurement, pageName);
        appMeasurement.linkTrackVars = linkTrackVars;
        appMeasurement.tl(true, 'o', linkName);

        resetVariables();

        return true;
    }

    function processProductsAndSetEvents(event) {
        try {
            var productDetails,
                incrementor,
                merchandising,
                productBuilder,
                product,
                allProducts = [];

            var expandedEvents = mParticle.eCommerce.expandCommerceEvent(event);
            expandedEvents.forEach(function(expandedEvt) {
                productBuilder = [];
                productDetails = [];
                incrementor = [];
                merchandising = [];

                if (expandedEvt.EventName === 'eCommerce - purchase - Total') {
                    for (var eventAttributeKey in expandedEvt.EventAttributes) {
                        if (
                            expandedEvt.EventAttributes.hasOwnProperty(
                                eventAttributeKey
                            )
                        ) {
                            var jsHash = calculateJSHash(
                                event.EventDataType,
                                event.EventCategory,
                                eventAttributeKey
                            );
                            var mapping = findValueInMapping(
                                jsHash,
                                eventsMapping
                            );
                            if (mapping && mapping.result && mapping.matches) {
                                mapping.matches.forEach(function(mapping) {
                                    if (mapping.value) {
                                        if (
                                            appMeasurement.events.indexOf(
                                                mapping.value
                                            ) < 0
                                        ) {
                                            appMeasurement.events +=
                                                ',' +
                                                mapping.value +
                                                '=' +
                                                expandedEvt.EventAttributes[
                                                    eventAttributeKey
                                                ];
                                        }
                                    }
                                });
                            }
                        }
                    }
                } else {
                    var productAttributes = expandedEvt.EventAttributes;
                    productDetails.push(
                        productAttributes.Category || '',
                        productAttributes.Name,
                        productAttributes.Id,
                        productAttributes.Quantity || 1,
                        productAttributes['Item Price'] || 0
                    );
                    for (var productAttributeKey in expandedEvt.EventAttributes) {
                        if (
                            expandedEvt.EventAttributes.hasOwnProperty(
                                productAttributeKey
                            )
                        ) {
                            productIncrementorMapping.forEach(function(
                                productIncrementorMap
                            ) {
                                if (
                                    productIncrementorMap.map ===
                                    productAttributeKey
                                ) {
                                    incrementor.push(
                                        productIncrementorMap.value +
                                            '=' +
                                            productAttributes[
                                                productAttributeKey
                                            ]
                                    );
                                    if (
                                        appMeasurement.events.indexOf(
                                            productIncrementorMap.value
                                        ) < 0
                                    ) {
                                        appMeasurement.events +=
                                            ',' + productIncrementorMap.value;
                                    }
                                }
                            });
                            productMerchandisingMapping.forEach(function(
                                productMerchandisingMap
                            ) {
                                if (
                                    productMerchandisingMap.map ===
                                    productAttributeKey
                                ) {
                                    merchandising.push(
                                        productMerchandisingMap.value +
                                            '=' +
                                            productAttributes[
                                                productAttributeKey
                                            ]
                                    );
                                }
                            });
                        }
                    }
                    productBuilder.push(
                        productDetails.join(';'),
                        incrementor.join('|'),
                        merchandising.join('|')
                    );
                    product = productBuilder.join(';');
                    allProducts.push(product);
                }
            });

            appMeasurement.products = allProducts.join(',');
        } catch (e) {
            window.console.log(e);
        }
    }

    function logPageView(event, pageName) {
        try {
            appMeasurement.pageName =
                pageName || event.EventName || window.document.title;
            appMeasurement.t();
            resetVariables();
            return true;
        } catch (e) {
            resetVariables();
            return { error: 'logPageView not called, error ' + e };
        }
    }

    function logEvent(
        event,
        linkTrackVars,
        mappingMatches,
        linkName,
        pageName
    ) {
        try {
            if (mappingMatches) {
                mappingMatches.forEach(function(match) {
                    if (appMeasurement.events.length === 0) {
                        appMeasurement.events += match.value;
                    } else {
                        appMeasurement.events += ',' + match.value;
                    }
                });
                appMeasurement.linkTrackEvents = appMeasurement.events;

                linkTrackVars.push('events');
                setPageName(linkTrackVars, appMeasurement, pageName);

                appMeasurement.linkTrackVars = linkTrackVars;

                appMeasurement.tl(true, 'o', linkName);
                resetVariables();
                return true;
            } else {
                resetVariables();
                window.console.log(
                    'event name not mapped, aborting event logging'
                );
                return false;
            }
        } catch (e) {
            resetVariables();
            return { error: e };
        }
    }

    // .map is the attribute passed through, .value is the eVar value
    function setEvars(event, linkTrackVars) {
        var eventAttributes = event.EventAttributes;
        for (var eventAttributeKey in eventAttributes) {
            if (eventAttributes.hasOwnProperty(eventAttributeKey)) {
                eVarsMapping.forEach(function(eVarMap) {
                    if (eVarMap.map === eventAttributeKey) {
                        appMeasurement[eVarMap.value] =
                            eventAttributes[eventAttributeKey];
                        if (linkTrackVars) {
                            linkTrackVars.push(eVarMap.value);
                        }
                    }
                    if (event.EventName === eVarMap.map) {
                        appMeasurement[eVarMap.value] = event.EventName;
                    }
                });
            }
        }
    }

    // .map is the attribute passed through, .value is the prop value
    function setProps(event, linkTrackVars) {
        var eventAttributes = event.EventAttributes;
        for (var eventAttributeKey in eventAttributes) {
            if (eventAttributes.hasOwnProperty(eventAttributeKey)) {
                propsMapping.forEach(function(propMap) {
                    if (propMap.map === eventAttributeKey) {
                        appMeasurement[propMap.value] =
                            eventAttributes[eventAttributeKey];
                        if (linkTrackVars) {
                            linkTrackVars.push(propMap.value);
                        }
                    }
                });
            }
        }
    }

    // .map is the attribute passed through, .value is the hier value
    function setHiers(event, linkTrackVars) {
        var eventAttributes = event.EventAttributes;
        for (var eventAttributeKey in eventAttributes) {
            if (eventAttributes.hasOwnProperty(eventAttributeKey)) {
                var jsHash = calculateJSHash(
                    event.EventDataType,
                    event.EventCategory,
                    eventAttributeKey
                );
                var mapping = findValueInMapping(jsHash, hiersMapping);
                if (mapping && mapping.result && mapping.matches) {
                    mapping.matches.forEach(function(mapping) {
                        if (mapping.value) {
                            appMeasurement[mapping.value] =
                                eventAttributes[eventAttributeKey];
                            if (linkTrackVars) {
                                linkTrackVars.push(mapping.value);
                            }
                        }
                    });
                }
            }
        }
    }

    // .map is the attribute passed through, .value is the contextData value
    function setContextData(event, linkTrackVars) {
        var eventAttributes = event.EventAttributes;
        for (var eventAttributeKey in eventAttributes) {
            if (eventAttributes.hasOwnProperty(eventAttributeKey)) {
                contextVariableMapping.forEach(function(contextVariableMap) {
                    if (contextVariableMap.map === eventAttributeKey) {
                        appMeasurement.contextData[contextVariableMap.value] =
                            eventAttributes[eventAttributeKey];
                        if (linkTrackVars) {
                            linkTrackVars.push(
                                'contextData.' + contextVariableMap.value
                            );
                        }
                    }
                });
            }
        }
    }

    function onUserIdentified(mpUserObject) {
        if (isAdobeClientKitInitialized) {
            var userIdentities = mpUserObject.getUserIdentities()
                .userIdentities;

            var identitiesToSet = {};
            if (Object.keys(userIdentities).length) {
                for (var identity in userIdentities) {
                    identitiesToSet[identity] = {
                        id: userIdentities[identity]
                    };
                }
            } else {
                // no user identities means there was a logout, so set all current customer ids to null
                var currentAdobeCustomerIds = appMeasurement.visitor.getCustomerIDs();
                for (var currentIdentityKey in currentAdobeCustomerIds) {
                    identitiesToSet[currentIdentityKey] = null;
                }
            }

            try {
                appMeasurement.visitor.setCustomerIDs(identitiesToSet);
            } catch (e) {
                return 'Error calling setCustomerIDs on adobe';
            }
        } else {
            return (
                'Cannot call setUserIdentity on forwarder ' +
                name +
                ', not initialized'
            );
        }
    }

    function setPageName(linkTrackVars, appMeasurement, pageName) {
        if (settings.enablePageName === 'True') {
            appMeasurement.pageName = pageName || window.document.title;
            linkTrackVars.push('pageName');
        }
    }

    this.init = initForwarder;
    this.onUserIdentified = onUserIdentified;
    this.process = processEvent;
};

function getId() {
    return moduleId;
}

if (window && window.mParticle && window.mParticle.addForwarder) {
    window.mParticle.addForwarder({
        name: name,
        constructor: constructor,
        getId: getId
    });
}

function register(config) {
    if (!config) {
        window.console.log(
            'You must pass a config object to register the kit ' + name
        );
        return;
    }

    if (!isObject(config)) {
        window.console.log(
            '`config` must be an object. You passed in a ' + typeof config
        );
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
    window.console.log(
        'Successfully registered ' + name + ' to your mParticle configuration'
    );
}

function isObject(val) {
    return (
        val != null && typeof val === 'object' && Array.isArray(val) === false
    );
}

export default {
    register: register
};
