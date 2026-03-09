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

var isobject = require('isobject');

var name = 'LocalyticsEventForwarder',
    moduleId = 84,
    maxAllowedDimensions = 10,
    trackerCount = 1,
    MessageType = {
        PageView: 3,
        PageEvent: 4,
        Commerce: 16,
    },
    EventType = {
        Unknown: 0,
        Navigation: 1,
        Location: 2,
        Search: 3,
        Transaction: 4,
        UserContent: 5,
        UserPreference: 6,
        Social: 7,
        Other: 8,
        Media: 9,
    };

var constructor = function() {
    var self = this,
        isInitialized = false,
        forwarderSettings = null,
        reportingService = null,
        customDimensions = [],
        initOptions = {},
        isTesting = false,
        trackerId = null;

    self.name = name;

    function createTrackerId() {
        return 'mpllTracker' + trackerCount++;
    }

    function createCmd(cmd) {
        // Prepends the specified command with the tracker id
        return cmd + '.' + trackerId;
    }

    function initForwarder(settings, service, testMode, tid) {
        forwarderSettings = settings;
        reportingService = service;
        isTesting = testMode;
        initOptions = getInitOptions();
        customDimensions = getOrderedCustomDimensions();

        if (!tid) {
            trackerId = createTrackerId();
        } else {
            trackerId = tid;
        }

        try {
            if (!testMode) {
                !(function(l, y, t, i, c, s) {
                    l['LocalyticsGlobal'] = i;
                    l[i] = function() {
                        (l[i].q = l[i].q || []).push(arguments);
                    };
                    l[i].t = +new Date();
                    (s = y.createElement(t)).type = 'text/javascript';
                    s.src = '//web.localytics.com/v4/localytics.min.js';
                    (c = y.getElementsByTagName(t)[0]).parentNode.insertBefore(
                        s,
                        c
                    );
                })(window, document, 'script', 'll');

                window.ll(createCmd('init'), settings.appKey, initOptions);
            }

            isInitialized = true;

            return 'Successfully initialized: ' + name;
        } catch (e) {
            return "Can't initialize forwarder: " + name + ':' + e;
        }
    }

    function getInitOptions() {
        var options = {};

        if (forwarderSettings.appVersion) {
            options.appVersion = forwarderSettings.appVersion;
        }

        if (forwarderSettings.sessionTimeout) {
            options.sessionTimeout = forwarderSettings.sessionTimeout;
        }

        if (forwarderSettings.domain) {
            options.domain = forwarderSettings.domain;
        }

        options.trackPageView =
            forwarderSettings.hasOwnProperty('trackPageView') &&
            forwarderSettings.trackPageView.toLowerCase() === 'true';

        return options;
    }

    function processEvent(event) {
        var reportEvent = false;

        if (!isInitialized) {
            return "Can't send forwarder " + name + ', not initialized';
        }

        try {
            if (event.EventDataType == MessageType.PageView) {
                reportEvent = true;
                logScreenViewEvent(event);
            } else if (event.EventDataType == MessageType.Commerce) {
                logCommerce(event);
                reportEvent = true;
            } else if (event.EventDataType == MessageType.PageEvent) {
                reportEvent = true;
                logEvent(event);
            }

            if (reportEvent && reportingService) {
                reportingService(self, event);
            }

            return 'Successfully sent to forwarder ' + name;
        } catch (e) {
            return "Can't send to forwarder: " + name + ' ' + e;
        }
    }

    function logScreenViewEvent(event) {
        var screenName = event.EventName;

        if (
            event.hasOwnProperty('CustomFlags') &&
            event.CustomFlags.hasOwnProperty('Localytics.ScreenName')
        ) {
            screenName = event.CustomFlags['Localytics.ScreenName'];
        }

        window.ll(createCmd('tagScreen'), screenName);
    }

    function logEvent(event) {
        var ltv = null;
        if (
            event.hasOwnProperty('EventCategory') &&
            event.EventCategory === EventType.Transaction
        ) {
            if (
                event.hasOwnProperty('EventAttributes') &&
                event.EventAttributes.hasOwnProperty('$Amount')
            ) {
                var ltvVal = event.EventAttributes['$Amount'];
                if (!isNaN(parseFloat(ltvVal, 10))) {
                    ltv = parseFloat(ltvVal, 10).toFixed(2);
                }
            }
        }

        if (ltv !== null) {
            var multiplier = forwarderSettings.trackClvAsRawValue ? 1 : 100;
            window.ll(
                createCmd('tagEvent'),
                event.EventName,
                event.EventAttributes,
                ltv * multiplier
            );
        } else {
            window.ll(
                createCmd('tagEvent'),
                event.EventName,
                event.EventAttributes
            );
        }
    }

    function logCommerce(data) {
        if (!data.ProductAction)
            return "Can't forward commerce event: No production action found";

        switch (data.ProductAction.ProductActionType) {
            case mParticle.ProductActionType.Purchase:
            case mParticle.ProductActionType.Refund:
                var total = null,
                    multiplier = forwarderSettings.trackClvAsRawValue ? 1 : 100;

                if (
                    data.ProductAction.ProductActionType ==
                    mParticle.ProductActionType.Refund
                ) {
                    multiplier *= -1;
                }

                if (!isNaN(parseFloat(data.ProductAction.TotalAmount, 10))) {
                    total = parseFloat(
                        data.ProductAction.TotalAmount,
                        10
                    ).toFixed(2);
                }

                if (total != null) {
                    window.ll(
                        createCmd('tagEvent'),
                        data.EventName,
                        data.EventAttributes,
                        total * multiplier
                    );
                } else {
                    return "Can't forward commerce event: TotalAmount is set incorrectly";
                }
                break;

            default:
                logEvent(data);
                break;
        }
    }

    function setUserAttribute(key, value) {
        if (!key) {
            return "Can't call setUserAttribute on forwarder: No key provided";
        }

        if (key === 'Localytics.CustomerName') {
            try {
                window.ll(createCmd('setCustomerName'), value);
            } catch (e) {
                return (
                    "Can't call setCustomerName on forwarder: " +
                    name +
                    ': ' +
                    e
                );
            }
        } else {
            if (customDimensions.length > 0) {
                updateCustomDimension(key, value);
            }
        }
    }

    function removeUserAttribute(key) {
        if (customDimensions.length > 0) {
            updateCustomDimension(key, null);
        }
    }

    function setUserIdentity(id, type) {
        if (!id) {
            return (
                "Can't call setUserIdentity on forwarder: " +
                name +
                ' without ID'
            );
        }

        if (!isInitialized) {
            return (
                "Can't call setUserIdentity on forwarder: " +
                name +
                ', not initialized'
            );
        }

        try {
            if (window.mParticle.IdentityType.Email == type) {
                window.ll(createCmd('setCustomerEmail'), id);
            } else {
                window.ll(createCmd('setCustomerId'), id);
            }

            return 'Successfully called identify on forwarder: ' + name;
        } catch (e) {
            return "Can't call identify on forwarder: " + name + ': ' + e;
        }
    }

    function updateCustomDimension(key, value) {
        if (customDimensions.length === 0) return;

        var index = -1,
            keyLower = key.toLowerCase();

        for (var i = 0; i < customDimensions.length; i++) {
            if (customDimensions[i].toLowerCase() === keyLower) {
                index = i;
            }
        }

        if (index >= 0) {
            window.ll(createCmd('setCustomDimension'), index, value);
        }
    }

    function getOrderedCustomDimensions() {
        var dimensions = null,
            orderedDimensions = [];

        try {
            dimensions = JSON.parse(
                forwarderSettings.customDimensions.replace(/&quot;/g, '"')
            );
        } catch (e) {
            return orderedDimensions;
        }

        if (dimensions.length > 0) {
            for (var index = 0; index < maxAllowedDimensions; index++) {
                for (var j = 0; j < dimensions.length; j++) {
                    if (
                        dimensions[j].maptype.toLowerCase() !==
                            'userattributeclass.name' ||
                        !dimensions[j].value ||
                        !dimensions[j].map
                    )
                        continue;

                    if (
                        dimensions[j].value.toLowerCase() ===
                        'dimension ' + index
                    ) {
                        orderedDimensions.push(dimensions[j].map);
                    }
                }
            }
        }

        return orderedDimensions;
    }

    this.init = initForwarder;
    this.process = processEvent;
    this.setUserAttribute = setUserAttribute;
    this.setUserIdentity = setUserIdentity;
    this.removeUserAttribute = removeUserAttribute;
};

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

    if (!isobject(config)) {
        console.log(
            "'config' must be an object. You passed in a " + typeof config
        );
        return;
    }

    if (isobject(config.kits)) {
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
