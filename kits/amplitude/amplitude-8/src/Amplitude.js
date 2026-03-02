/* eslint-disable no-undef*/
//
//  Copyright 2015 mParticle, Inc.
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

var name = 'Amplitude',
    moduleId = 53,
    MessageType = {
        SessionStart: 1,
        SessionEnd: 2,
        PageView: 3,
        PageEvent: 4,
        CrashReport: 5,
        OptOut: 6,
        Commerce: 16,
    };

var constants = {
    MPID: 'mpId',
    customerId: 'customerId',
    email: 'email',
    other: 'other',
    other2: 'other2',
    other3: 'other3',
    other4: 'other4',
    other5: 'other5',
    other6: 'other6',
    other7: 'other7',
    other8: 'other8',
    other9: 'other9',
    other10: 'other10',
};

var MP_AMP_SPLIT = 'mparticle_amplitude_should_split',
    TOTAL_AMOUNT = 'Total Amount',
    TOTAL = 'Total',
    PRODUCTS = 'products',
    REFUND = 'Refund',
    PURCHASE = 'Purchase',
    TOTAL_PRODUCT_AMOUNT = 'Total Product Amount';

var includeIndividualProductEvents,
    shouldSendSeparateAmplitudeRevenueEvent,
    enableTempAmplitudeEcommerce;

/* eslint-disable */
// prettier-ignore
var renderSnippet = function() {
        (function(e,t){var n=e.amplitude||{_q:[],_iq:{}};var r=t.createElement("script")
        r.type="text/javascript";
        r.integrity="sha384-QahB0HKETlcqjneomU3Ohs+UgJTinhUNFIKJitEl2Vo7DjvphO2jei64ZP5J2GA5"
        r.crossOrigin="anonymous";r.async=true;
        r.src="https://cdn.amplitude.com/libs/amplitude-8.21.8-min.gz.js";
        r.onload=function(){if(!e.amplitude.runQueuedFunctions){console.log(
        "[Amplitude] Error: could not load SDK")}};var s=t.getElementsByTagName("script"
        )[0];s.parentNode.insertBefore(r,s);function i(e,t){e.prototype[t]=function(){
        this._q.push([t].concat(Array.prototype.slice.call(arguments,0)));return this}}
        var o=function(){this._q=[];return this};var a=["add","append","clearAll",
        "prepend","set","setOnce","unset","preInsert","postInsert","remove"];for(
        var c=0;c<a.length;c++){i(o,a[c])}n.Identify=o;var l=function(){this._q=[];
        return this};var p=["setProductId","setQuantity","setPrice","setRevenueType",
        "setEventProperties"];for(var u=0;u<p.length;u++){i(l,p[u])}n.Revenue=l;var d=[
        "init","logEvent","logRevenue","setUserId","setUserProperties","setOptOut",
        "setVersionName","setDomain","setDeviceId","enableTracking",
        "setGlobalUserProperties","identify","clearUserProperties","setGroup",
        "logRevenueV2","regenerateDeviceId","groupIdentify","onInit","onNewSessionStart"
        ,"logEventWithTimestamp","logEventWithGroups","setSessionId","resetSessionId",
        "getDeviceId","getUserId","setMinTimeBetweenSessionsMillis",
        "setEventUploadThreshold","setUseDynamicConfig","setServerZone","setServerUrl",
        "sendEvents","setLibrary","setTransport"];function v(t){function e(e){t[e
        ]=function(){t._q.push([e].concat(Array.prototype.slice.call(arguments,0)))}}
        for(var n=0;n<d.length;n++){e(d[n])}}v(n);n.getInstance=function(e){e=(
        !e||e.length===0?"$default_instance":e).toLowerCase();if(
        !Object.prototype.hasOwnProperty.call(n._iq,e)){n._iq[e]={_q:[]};v(n._iq[e])}
        return n._iq[e]};e.amplitude=n})(window,document);
        /* eslint-enable */
};

var constructor = function () {
    var self = this,
        isInitialized = false,
        forwarderSettings,
        reportingService,
        isDefaultInstance;

    self.name = name;

    function getInstance() {
        if (isDefaultInstance) {
            return window.amplitude.getInstance();
        } else {
            return window.amplitude.getInstance(forwarderSettings.instanceName);
        }
    }

    function getIdentityTypeName(identityType) {
        return mParticle.IdentityType.getName(identityType);
    }

    function processEvent(event) {
        var reportEvent = false;

        if (isInitialized) {
            try {
                if (event.EventDataType === MessageType.PageView) {
                    reportEvent = true;
                    logPageView(event);
                } else if (event.EventDataType === MessageType.Commerce) {
                    reportEvent = logCommerce(event);
                } else if (event.EventDataType === MessageType.PageEvent) {
                    reportEvent = true;

                    if (
                        event.EventCategory ===
                        window.mParticle.EventType.Transaction
                    ) {
                        logTransaction(event);
                    } else {
                        logEvent(event);
                    }
                }

                if (reportEvent && reportingService) {
                    reportingService(self, event);
                }

                return 'Successfully sent to ' + name;
            } catch (e) {
                return 'Failed to send to: ' + name + ' ' + e;
            }
        }

        return 'Cannot send to forwarder ' + name + ', not initialized';
    }

    function setUserIdentity(id, type) {
        if (window.mParticle.getVersion()[0] !== '1') {
            return;
        }
        if (isInitialized) {
            if (type === window.mParticle.IdentityType.CustomerId) {
                getInstance().setUserId(id);
            } else {
                setUserAttribute(getIdentityTypeName(type), id);
            }
        } else {
            return (
                'Cannot call setUserIdentity on forwarder ' +
                name +
                ', not initialized'
            );
        }
    }

    function onUserIdentified(user) {
        var userId;

        if (isInitialized) {
            var userIdentities = user.getUserIdentities().userIdentities;

            // Additional check for email to match server
            if (forwarderSettings.includeEmailAsUserProperty === 'True') {
                setUserAttribute('email', userIdentities.email);
            }

            try {
                switch (forwarderSettings.userIdentification) {
                    case constants.MPID:
                        userId = user.getMPID();
                        break;
                    // server returns `customerId` whereas key on userIdentities object is `customerid`
                    case constants.customerId:
                        userId = userIdentities.customerid;
                        break;
                    case constants.email:
                        userId = userIdentities.email;
                        break;
                    case constants.other:
                        userId = userIdentities.other;
                        break;
                    case constants.other2:
                        userId = userIdentities.other2;
                        break;
                    case constants.other3:
                        userId = userIdentities.other3;
                        break;
                    case constants.other4:
                        userId = userIdentities.other4;
                        break;
                    case constants.other5:
                        userId = userIdentities.other5;
                        break;
                    case constants.other6:
                        userId = userIdentities.other6;
                        break;
                    case constants.other7:
                        userId = userIdentities.other7;
                        break;
                    case constants.other8:
                        userId = userIdentities.other8;
                        break;
                    case constants.other9:
                        userId = userIdentities.other9;
                        break;
                    case constants.other10:
                        userId = userIdentities.other10;
                        break;
                    default:
                        userId = null;
                }
                if (userId) {
                    return getInstance().setUserId(userId);
                } else {
                    console.warn(
                        'A user identification type of ' +
                            forwarderSettings.userIdentification +
                            ' was selected in mParticle dashboard, but was not passed to the identity call. Please check your implementation.'
                    );
                }
            } catch (e) {
                console.error(
                    'Error calling onUserIdentified on forwarder ' + name
                );
            }
        } else {
            return (
                'Cannot call onUserIdentified on forwarder ' +
                name +
                ', not initialized'
            );
        }
    }

    function removeUserAttribute(key) {
        if (isInitialized) {
            if (
                forwarderSettings.allowUnsetUserAttributes &&
                forwarderSettings.allowUnsetUserAttributes === 'True'
            ) {
                try {
                    var identify = new window.amplitude.Identify().unset(key);
                    getInstance().identify(identify);

                    return 'Successfully unset Amplitude user property: ' + key;
                } catch (e) {
                    return 'Failed to call unset on ' + name + ' ' + e;
                }
            }
        } else {
            return (
                'Cannot call removeUserAttribute on forwarder ' +
                name +
                ', not initialized'
            );
        }
    }

    function setUserAttribute(key, value) {
        if (isInitialized) {
            try {
                var attributeDict = {};
                attributeDict[key] = value;
                getInstance().setUserProperties(attributeDict);

                return 'Successfully called setUserProperties API on ' + name;
            } catch (e) {
                return (
                    'Failed to call SET setUserProperties on ' + name + ' ' + e
                );
            }
        } else {
            return (
                'Cannot call setUserAttribute on forwarder ' +
                name +
                ', not initialized'
            );
        }
    }

    function setOptOut(isOptingOut) {
        if (isInitialized) {
            getInstance().setOptOut(isOptingOut);
        } else {
            return (
                'Cannot call setOptOut on forwarder ' +
                name +
                ', not initialized'
            );
        }
    }

    function logPageView(data) {
        if (data.EventAttributes) {
            data.EventAttributes = convertJsonAttrs(data.EventAttributes);
            getInstance().logEvent(
                'Viewed ' + data.EventName,
                data.EventAttributes
            );
        } else {
            getInstance().logEvent('Viewed ' + data.EventName);
        }
    }

    function logEvent(data) {
        if (data.EventAttributes) {
            data.EventAttributes = convertJsonAttrs(data.EventAttributes);
            getInstance().logEvent(data.EventName, data.EventAttributes);
        } else {
            getInstance().logEvent(data.EventName);
        }
    }

    function logTransaction(data) {
        if (
            !data.EventAttributes ||
            !data.EventAttributes.$MethodName ||
            !data.EventAttributes.$MethodName === 'LogEcommerceTransaction'
        ) {
            // User didn't use logTransaction method, so just log normally
            logEvent(data);
            return;
        }

        getInstance().logRevenue(
            data.EventAttributes.RevenueAmount,
            data.EventAttributes.ProductQuantity,
            data.EventAttributes.ProductSKU.toString()
        );
    }

    function createEcommerceAttributes(attributes) {
        var updatedAttributes = {};
        for (var key in attributes) {
            if (key !== TOTAL_AMOUNT && key !== TOTAL_PRODUCT_AMOUNT) {
                updatedAttributes[key] = attributes[key];
            }
        }

        return convertJsonAttrs(updatedAttributes);
    }

    function logCommerce(event) {
        var expandedEvents = mParticle.eCommerce.expandCommerceEvent(event);
        // if Product Action exists, it's a regular product action commerce event
        if (event.ProductAction) {
            if (enableTempAmplitudeEcommerce) {
                return processTemporaryProductAction(event, expandedEvents);
            } else {
                // TODO: Remove this old code path when Amplitude is ready
                var isRefund, isPurchase, logRevenue;
                isRefund =
                    event.ProductAction.ProductActionType ===
                    mParticle.ProductActionType.Refund;
                isPurchase =
                    event.ProductAction.ProductActionType ===
                    mParticle.ProductActionType.Purchase;
                logRevenue = isRefund || isPurchase;
                expandedEvents.forEach(function (expandedEvt) {
                    // Exclude Totals from the attributes as we log it in the revenue call
                    var updatedAttributes = createEcommerceAttributes(
                        expandedEvt.EventAttributes
                    );

                    // Purchase and Refund events generate an additional 'Total' event
                    if (
                        logRevenue &&
                        expandedEvt.EventName.indexOf('Total') > -1
                    ) {
                        var revenueAmount =
                            (expandedEvt.EventAttributes['Total Amount'] || 0) *
                            (isRefund ? -1 : 1);
                        var revenue = new window.amplitude.Revenue()
                            .setPrice(revenueAmount)
                            .setEventProperties(updatedAttributes);
                        getInstance().logRevenueV2(revenue);
                    } else {
                        getInstance().logEvent(
                            expandedEvt.EventName,
                            updatedAttributes
                        );
                    }
                });

                return true;
            }
        }

        // if it is not a product action, it is an impression or promotion commerce event
        if (isNotProductAction(event)) {
            expandedEvents.forEach(function (expandedEvt) {
                // Exclude Totals from the attributes as we log it in the revenue call
                var updatedAttributes = createEcommerceAttributes(
                    expandedEvt.EventAttributes
                );

                getInstance().logEvent(
                    expandedEvt.EventName,
                    updatedAttributes
                );
            });

            return true;
        }

        console.warn(
            'Commerce event does not conform to our expectations and was not forwarded to Amplitude. Please double-check your code.'
        );

        return false;
    }

    /*
    When we process a product action event, Amplitude has a very specific way of
    sending events to them:

    1.  Send a summary event with event attributes from the MP event.
        a.  Add a key of `products` with a value of JSON.stringify(productArray).
        b.  Add a key of mparticle_amplitude_should_split with a value of `false`.

    2.  Determine if we send product level events or not.
        a.  If includeIndividualProductEvents === true, send product level events
        b.  If includeIndividualProductEvents === false, do not send product level events

    3.  Determine if we send an Amplitude revenue event or not.
        a.  If shouldSendSeparateAmplitudeRevenueEvent === true, send an Amplitude revenue event.
        b.  If shouldSendSeparateAmplitudeRevenueEvent === true, the summary event attribute should be `revenue`.
        c.  If shouldSendSeparateAmplitudeRevenueEvent === false, the summary event attribute should be `$revenue`

    See test/AmplitudeCommerceEvent.MD for examples of what the expectations of the payload are.

     */
    function processTemporaryProductAction(
        unexpandedCommerceEvent,
        expandedEvents
    ) {
        var summaryEvent, isRefund, isPurchase, isMPRevenueEvent;

        isRefund =
            unexpandedCommerceEvent.ProductAction.ProductActionType ===
            mParticle.ProductActionType.Refund;
        isPurchase =
            unexpandedCommerceEvent.ProductAction.ProductActionType ===
            mParticle.ProductActionType.Purchase;
        isMPRevenueEvent = isRefund || isPurchase;

        // if the event is a revenue event, then we set it to the expanded `Total` event for backwards compatibility
        if (
            isMPRevenueEvent &&
            expandedEvents[0].EventName.indexOf(TOTAL) > -1
        ) {
            summaryEvent = expandedEvents[0];
            sendMPRevenueSummaryEvent(
                summaryEvent,
                unexpandedCommerceEvent.ProductAction.ProductList,
                isRefund,
                shouldSendSeparateAmplitudeRevenueEvent
            );
        }

        if (!isMPRevenueEvent) {
            sendSummaryEvent(unexpandedCommerceEvent);
        }

        if (includeIndividualProductEvents) {
            sendIndividualProductEvents(
                expandedEvents,
                isMPRevenueEvent,
                shouldSendSeparateAmplitudeRevenueEvent,
                isRefund
            );
        }

        return true;
    }

    // If event.ProductAction does not exist, the commerce event is a promotion or impression event
    function isNotProductAction(event) {
        return (
            event.EventCategory ===
                mParticle.CommerceEventType.ProductImpression ||
            event.EventCategory === mParticle.CommerceEventType.PromotionView ||
            event.EventCategory === mParticle.CommerceEventType.PromotionClick
        );
    }

    // this function does not use Amplitude's logRevenueV2, but rather sends custom event names
    function sendMPRevenueSummaryEvent(
        summaryEvent,
        products,
        isRefund,
        shouldSendSeparateAmplitudeRevenueEvent
    ) {
        // send the ecommerce - purchase event
        var updatedAttributes = createMPRevenueEcommerceAttributes(
            summaryEvent.EventAttributes,
            shouldSendSeparateAmplitudeRevenueEvent,
            isRefund
        );
        updatedAttributes[MP_AMP_SPLIT] = false;

        updatedAttributes[PRODUCTS] = products;
        var revenueEventLabel = isRefund ? REFUND : PURCHASE;
        getInstance().logEvent(
            'eCommerce - ' + revenueEventLabel,
            updatedAttributes
        );
    }

    // revenue summary event will either have $price/price or $revenue/revenue depending on if
    function createMPRevenueEcommerceAttributes(
        attributes,
        shouldSendSeparateAmplitudeRevenueEvent,
        isRefund
    ) {
        var updatedAttributes = {};
        for (var key in attributes) {
            if (key === TOTAL_AMOUNT) {
                // A purchase is a positive amount and a refund is negative
                var revenueAmount = attributes[key] * (isRefund ? -1 : 1);
                // If we send a separate Amplitude Revenue Event, Amplitude's
                // SDK prefixes price/revenue with a $ for calculating things
                // like LTV, so we do not want to prepend it as part of the
                // summary event to avoid double counting
                var revenueKey = shouldSendSeparateAmplitudeRevenueEvent
                    ? 'revenue'
                    : '$revenue';

                updatedAttributes[revenueKey] = revenueAmount;
            } else if (key !== TOTAL_AMOUNT) {
                updatedAttributes[key] = attributes[key];
            }
        }

        return convertJsonAttrs(updatedAttributes);
    }

    function createAttrsForAmplitudeRevenueEvent(attributes) {
        var updatedAttributes = {};
        for (var key in attributes) {
            if (key !== TOTAL_AMOUNT) {
                updatedAttributes[key] = attributes[key];
            }
        }

        return convertJsonAttrs(updatedAttributes);
    }

    function sendSummaryEvent(summaryEvent) {
        var updatedAttributes = createEcommerceAttributes(
            summaryEvent.EventAttributes
        );
        updatedAttributes[MP_AMP_SPLIT] = false;
        try {
            updatedAttributes[PRODUCTS] =
                summaryEvent.ProductAction.ProductList;
        } catch (e) {
            console.error('error adding Product List to summary event');
        }

        getInstance().logEvent(summaryEvent.EventName, updatedAttributes);
    }

    function sendIndividualProductEvents(
        expandedEvents,
        isMPRevenueEvent,
        shouldSendSeparateAmplitudeRevenueEvent,
        isRefund
    ) {
        expandedEvents.forEach(function (expandedEvt) {
            var updatedAttributes;
            // `Total` exists on an expanded event if it is part of a revenue/purchase event
            // but not on other commerce events. This only needs to be fired if shouldSendSeparateAmplitudeRevenueEvent === True
            if (
                isMPRevenueEvent &&
                // A purchase is a positive amount and a refund is negative
                (expandedEvt.EventName.indexOf(TOTAL) > -1) &
                    shouldSendSeparateAmplitudeRevenueEvent
            ) {
                var revenueAmount =
                    // A purchase is a positive amount and a refund is negative
                    (expandedEvt.EventAttributes[TOTAL_AMOUNT] || 0) *
                    (isRefund ? -1 : 1);
                updatedAttributes = createAttrsForAmplitudeRevenueEvent(
                    expandedEvt.EventAttributes
                );

                var revenue = new window.amplitude.Revenue()
                    .setPrice(revenueAmount)
                    .setEventProperties(updatedAttributes);
                getInstance().logRevenueV2(revenue);
            } else if (expandedEvt.EventName.indexOf(TOTAL) === -1) {
                updatedAttributes = createEcommerceAttributes(
                    expandedEvt.EventAttributes
                );
                getInstance().logEvent(
                    expandedEvt.EventName,
                    updatedAttributes
                );
            }
        });
    }

    function convertJsonAttrs(customAttributes) {
        if (forwarderSettings.sendEventAttributesAsObjects === 'True') {
            for (var key in customAttributes) {
                if (typeof customAttributes[key] === 'string') {
                    try {
                        var parsed = JSON.parse(customAttributes[key]);
                        if (typeof parsed === 'object') {
                            customAttributes[key] = parsed;
                        }
                    } catch (e) {
                        // if parsing fails, don't update the customAttribute object
                    }
                }
            }
        }

        return customAttributes;
    }

    function initForwarder(settings, service, testMode) {
        var ampSettings;

        forwarderSettings = settings;
        reportingService = service;

        // Changing this setting from a negative action to a positive action for readability
        includeIndividualProductEvents =
            forwarderSettings.excludeIndividualProductEvents === 'False';
        // Only send separate amplitude revenue events when we includeIndividualProductEvents,
        // so create this variable for clarity
        shouldSendSeparateAmplitudeRevenueEvent = includeIndividualProductEvents;

        enableTempAmplitudeEcommerce =
            forwarderSettings.enableTempAmplitudeEcommerce === 'True';
        try {
            if (!window.amplitude) {
                if (testMode !== true) {
                    renderSnippet();
                }
            }

            ampSettings = {};

            // allow the client to set custom amplitude init properties
            if (
                typeof window.AmplitudeInitSettings === 'object' &&
                window.AmplitudeInitSettings !== null
            ) {
                ampSettings = window.AmplitudeInitSettings;
            }

            if (forwarderSettings.saveEvents) {
                ampSettings.saveEvents =
                    forwarderSettings.saveEvents === 'True';
            }

            if (forwarderSettings.savedMaxCount) {
                ampSettings.savedMaxCount = parseInt(
                    forwarderSettings.savedMaxCount,
                    10
                );
            }

            if (forwarderSettings.uploadBatchSize) {
                ampSettings.uploadBatchSize = parseInt(
                    forwarderSettings.uploadBatchSize,
                    10
                );
            }

            if (forwarderSettings.includeUtm) {
                ampSettings.includeUtm =
                    forwarderSettings.includeUtm === 'True';
            }

            if (forwarderSettings.includeReferrer) {
                ampSettings.includeReferrer =
                    forwarderSettings.includeReferrer === 'True';
            }

            if (forwarderSettings.forceHttps) {
                ampSettings.forceHttps =
                    forwarderSettings.forceHttps === 'True';
            }

            if (forwarderSettings.baseUrl) {
                ampSettings.apiEndpoint = forwarderSettings.baseUrl;
            }

            isDefaultInstance =
                !forwarderSettings.instanceName ||
                forwarderSettings.instanceName === 'default';

            getInstance().init(forwarderSettings.apiKey, null, ampSettings);
            isInitialized = true;

            if (forwarderSettings.userIdentification === constants.MPID) {
                if (window.mParticle && window.mParticle.Identity) {
                    var user = window.mParticle.Identity.getCurrentUser();
                    if (user) {
                        var userId = user.getMPID();
                        getInstance().setUserId(userId);
                    }
                }
            }

            return 'Successfully initialized: ' + name;
        } catch (e) {
            return 'Failed to initialize: ' + name;
        }
    }

    this.init = initForwarder;
    this.process = processEvent;
    this.setUserIdentity = setUserIdentity;
    this.onUserIdentified = onUserIdentified;
    this.setUserAttribute = setUserAttribute;
    this.setOptOut = setOptOut;
    this.removeUserAttribute = removeUserAttribute;
};

function getId() {
    return moduleId;
}

function isObject(val) {
    return (
        val != null &&
        typeof val === 'object' &&
        Array.isArray(val) === false
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
            'The "config" must be an object. You passed in a ' + typeof config
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

module.exports = {
    register: register,
};
