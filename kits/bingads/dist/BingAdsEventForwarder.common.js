Object.defineProperty(exports, '__esModule', { value: true });

/*!
 * isobject <https://github.com/jonschlinkert/isobject>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */

function isObject(val) {
  return val != null && typeof val === 'object' && Array.isArray(val) === false;
}

//  Copyright 2016 mParticle, Inc.
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



var name = 'Bing';
var moduleId = 107;
var MessageType = {
    SessionStart: 1,
    SessionEnd: 2,
    PageView: 3,
    PageEvent: 4,
    CrashReport: 5,
    OptOut: 6,
    Profile: 14,
    Commerce: 16,
};

var bingConsentValues = { Denied: 'denied', Granted: 'granted' };
var bingConsentProperties = ['ad_storage'];
var bingToMpConsentSettingsMapping = {
    ad_storage: 'defaultAdStorageConsentWeb',
};

var constructor = function() {
    var self = this;
    var isInitialized = false;
    var forwarderSettings = null;
    var reportingService = null;

    self.consentMappings = [];
    self.consentPayloadAsString = '';
    self.consentPayloadDefaults = {};

    self.name = name;

    function initForwarder(settings, service, testMode) {
        forwarderSettings = settings;
        reportingService = service;

        if (forwarderSettings.consentMappingWeb) {
            self.consentMappings = parseSettingsString(
                forwarderSettings.consentMappingWeb
            );
        }
        self.consentPayloadDefaults = getConsentSettings(forwarderSettings);

        var initialConsentPayload = cloneObject(self.consentPayloadDefaults);
        var userConsentState = getUserConsentState();

        var updatedConsentPayload = generateConsentPayload(
            userConsentState,
            self.consentMappings
        );

        try {
            if (!testMode) {
                (function(window, document, tag, url, queue) {
                    var f;
                    var n;
                    var i;
                    (window[queue] = window[queue] || []),
                        (window.uetq = window.uetq || []),
                        sendConsentDefaultToBing(initialConsentPayload),
                        (f = function() {
                            var obj = {
                                ti: forwarderSettings.tagId,
                                q: window.uetq,
                            };
                            (obj.q = window[queue]),
                                (window[queue] = new UET(obj)),
                                maybeSendConsentUpdateToBing(
                                    updatedConsentPayload
                                );
                            window[queue].push('pageLoad');
                        }),
                        (n = document.createElement(tag)),
                        (n.src = url),
                        (n.async = 1),
                        (n.onload = n.onreadystatechange = function() {
                            var state = this.readyState;
                            (state &&
                                state !== 'loaded' &&
                                state !== 'complete') ||
                                (f(), (n.onload = n.onreadystatechange = null));
                        }),
                        (i = document.getElementsByTagName(tag)[0]),
                        i.parentNode.insertBefore(n, i);
                })(window, document, 'script', '//bat.bing.com/bat.js', 'uetq');

                if (window.uetq && window.queue && window.queue.length > 0) {
                    for (
                        var i = 0, length = window.queue.length;
                        i < length;
                        i++
                    ) {
                        processEvent(window.queue[i]);
                    }

                    window.queue.length = 0;
                }
            }

            isInitialized = true;
            return 'Successfully initialized: ' + name;
        } catch (e) {
            return "Can't initialize forwarder: " + name + ': ' + e;
        }
    }

    function processEvent(event) {
        if (!isInitialized) {
            return "Can't send to forwarder: " + name + ', not initialized';
        }

        var reportEvent = false;
        try {
            if (
                event.EventDataType == MessageType.PageEvent ||
                event.EventDataType == MessageType.PageView
            ) {
                reportEvent = true;
                logEvent(event);
            } else if (
                event.EventDataType == MessageType.Commerce &&
                event.ProductAction &&
                event.ProductAction.ProductActionType ==
                    mParticle.ProductActionType.Purchase
            ) {
                reportEvent = true;
                logPurchaseEvent(event);
            }

            if (reportEvent && reportingService) {
                reportingService(self, event);
                return 'Successfully sent to forwarder: ' + name;
            }
        } catch (e) {
            return "Can't send to forwarder: " + name + ' ' + e;
        }
    }

    function logEvent(event) {
        if (!isInitialized) {
            return (
                "Can't log event on forwarder: " + name + ', not initialized'
            );
        }
        try {
            var obj = createUetObject(event, 'pageLoad');

            var eventConsentState = getEventConsentState(event.ConsentState);

            maybeSendConsentUpdateToBing(eventConsentState);

            window.uetq.push(obj);
        } catch (e) {
            return "Can't log event on forwarder: " + name + ': ' + e;
        }

        return 'Successfully logged event from forwarder: ' + name;
    }

    function logPurchaseEvent(event) {
        if (!isInitialized) {
            return (
                "Can't log purchase event on forwarder: " +
                name +
                ', not initialized'
            );
        }

        if (
            event.ProductAction.TotalAmount === undefined ||
            event.ProductAction.TotalAmount === null
        ) {
            return "Can't log purchase event without a total amount on product action";
        }

        try {
            var obj = createUetObject(event, 'eCommerce');
            obj.gv = event.ProductAction.TotalAmount;

            window.uetq.push(obj);
        } catch (e) {
            return "Can't log commerce event on forwarder: " + name + ': ' + e;
        }
    }

    function createUetObject(event, action) {
        var obj = {
            ea: action,
            ec: window.mParticle.EventType.getName(event.EventCategory),
            el: event.EventName,
        };

        if (event.CustomFlags && event.CustomFlags['Bing.EventValue']) {
            obj.ev = event.CustomFlags['Bing.EventValue'];
        }

        return obj;
    }

    function getEventConsentState(eventConsentState) {
        return eventConsentState && eventConsentState.getGDPRConsentState
            ? eventConsentState.getGDPRConsentState()
            : {};
    }

    function generateConsentPayload(consentState, mappings) {
        if (!mappings) {
            return {};
        }

        var payload = cloneObject(self.consentPayloadDefaults);
        if (mappings && mappings.length > 0) {
            for (var i = 0; i < mappings.length; i++) {
                var mappingEntry = mappings[i];
                var mpMappedConsentName = mappingEntry.map.toLowerCase();
                var bingMappedConsentName = mappingEntry.value;

                if (
                    consentState[mpMappedConsentName] &&
                    bingConsentProperties.indexOf(bingMappedConsentName) !== -1
                ) {
                    payload[bingMappedConsentName] = consentState[
                        mpMappedConsentName
                    ].Consented
                        ? bingConsentValues.Granted
                        : bingConsentValues.Denied;
                }
            }
        }

        return payload;
    }

    function maybeSendConsentUpdateToBing(consentState) {
        if (
            self.consentPayloadAsString &&
            self.consentMappings &&
            !isEmpty(consentState)
        ) {
            var updatedConsentPayload = generateConsentPayload(
                consentState,
                self.consentMappings
            );

            var eventConsentAsString = JSON.stringify(updatedConsentPayload);

            if (eventConsentAsString !== self.consentPayloadAsString) {
                window.uetq.push('consent', 'update', updatedConsentPayload);
                self.consentPayloadAsString = JSON.stringify(
                    updatedConsentPayload
                );
            }
        }
    }

    function sendConsentDefaultToBing(consentPayload) {
        self.consentPayloadAsString = JSON.stringify(consentPayload);

        window.uetq.push('consent', 'default', consentPayload);
    }

    this.init = initForwarder;
    this.process = processEvent;
};

function getUserConsentState() {
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
}

function getConsentSettings(settings) {
    var consentSettings = {};

    Object.keys(bingToMpConsentSettingsMapping).forEach(function(
        bingConsentKey
    ) {
        var mpConsentSettingKey =
            bingToMpConsentSettingsMapping[bingConsentKey];
        var bingConsentValuesKey = settings[mpConsentSettingKey];

        // Microsoft recommends that for most countries, we should default to 'Granted'
        // if a default value is not provided
        // https://help.ads.microsoft.com/apex/index/3/en/60119
        if (bingConsentValuesKey && mpConsentSettingKey) {
            consentSettings[bingConsentKey] = bingConsentValues[
                bingConsentValuesKey
            ]
                ? bingConsentValues[bingConsentValuesKey]
                : bingConsentValues.Granted;
        } else {
            consentSettings[bingConsentKey] = bingConsentValues.Granted;
        }
    });

    return consentSettings;
}

function parseSettingsString(settingsString) {
    return JSON.parse(settingsString.replace(/&quot;/g, '"'));
}

function getId() {
    return moduleId;
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

function isEmpty(value) {
    return value == null || !(Object.keys(value) || value).length;
}

function cloneObject(obj) {
    return JSON.parse(JSON.stringify(obj));
}

var BingAdsEventForwarder = {
    register: register,
};
var BingAdsEventForwarder_1 = BingAdsEventForwarder.register;

exports.default = BingAdsEventForwarder;
exports.register = BingAdsEventForwarder_1;
