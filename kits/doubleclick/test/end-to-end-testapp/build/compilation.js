(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
require('@mparticle/web-kit-wrapper/index.js');
require('@mparticle/web-kit-wrapper/end-to-end-testapp/kitConfiguration.js');

},{"@mparticle/web-kit-wrapper/end-to-end-testapp/kitConfiguration.js":2,"@mparticle/web-kit-wrapper/index.js":3}],2:[function(require,module,exports){
var SDKSettings = require('../../../../test/end-to-end-testapp/settings.js');
var name = require('../../../../src/initialization.js').name;

var config = {
    name: name,
    moduleId: 100, // when published, you will receive a new moduleID
    isDebug: true,
    isSandbox: true,
    settings: SDKSettings,
    userIdentityFilters: [],
    hasDebugString: [],
    isVisible: [],
    eventNameFilters: [],
    eventTypeFilters: [],
    attributeFilters: [],
    screenNameFilters: [],
    pageViewAttributeFilters: [],
    userAttributeFilters: [],
    filteringEventAttributeValue: 'null',
    filteringUserAttributeValue: 'null',
    eventSubscriptionId: 123,
    filteringConsentRuleValues: 'null',
    excludeAnonymousUser: false
};

mParticle.configureForwarder(config);

},{"../../../../src/initialization.js":8,"../../../../test/end-to-end-testapp/settings.js":11}],3:[function(require,module,exports){
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
var CommerceHandler = require('../../../src/commerce-handler');
var EventHandler = require('../../../src/event-handler');
var IdentityHandler = require('../../../src/identity-handler');
var Initialization = require('../../../src/initialization');
var SessionHandler = require('../../../src/session-handler');
var UserAttributeHandler = require('../../../src/user-attribute-handler');

(function (window) {
    var name = Initialization.name,
        MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            Commerce: 16
        };

    var constructor = function () {
        var self = this,
            isInitialized = false,
            forwarderSettings,
            reportingService,
            eventQueue = [];

        self.name = Initialization.name;

        function initForwarder(settings, service, testMode, trackerId, userAttributes, userIdentities) {
            forwarderSettings = settings;
            if (window.mParticle.isTestEnvironment) {
                reportingService = function() {
                };
            } else {
                reportingService = service;
            }

            try {
                Initialization.initForwarder(settings, testMode, userAttributes, userIdentities, processEvent, eventQueue, isInitialized);
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
                    }
                    else if (event.EventDataType === MessageType.Commerce) {
                        reportEvent = logEcommerceEvent(event);
                    }
                    else if (event.EventDataType === MessageType.PageEvent) {
                        reportEvent = logEvent(event);
                    }
                    if (reportEvent === true && reportingService) {
                        reportingService(self, event);
                        return 'Successfully sent to ' + name;
                    }
                    else {
                        return 'Error logging event or event type not supported on forwarder ' + name;
                    }
                }
                catch (e) {
                    return 'Failed to send to ' + name + ' ' + e;
                }
            } else {
                eventQueue.push(event);
                return 'Can\'t send to forwarder ' + name + ', not initialized. Event added to queue.';
            }
        }

        function logSessionStart(event) {
            try {
                SessionHandler.onSessionStart(event);
                return true;
            } catch (e) {
                return {error: 'Error starting session on forwarder ' + name + '; ' + e};
            }
        }

        function logSessionEnd(event) {
            try {
                SessionHandler.onSessionEnd(event);
                return true;
            } catch (e) {
                return {error: 'Error ending session on forwarder ' + name + '; ' + e};
            }
        }

        function logError(event) {
            try {
                EventHandler.logError(event);
                return true;
            } catch (e) {
                return {error: 'Error logging error on forwarder ' + name + '; ' + e};
            }
        }

        function logPageView(event) {
            try {
                EventHandler.logPageView(event);
                return true;
            } catch (e) {
                return {error: 'Error logging page view on forwarder ' + name + '; ' + e};
            }
        }

        function logEvent(event) {
            try {
                EventHandler.logEvent(event);
                return true;
            } catch (e) {
                return {error: 'Error logging event on forwarder ' + name + '; ' + e};
            }
        }

        function logEcommerceEvent(event) {
            try {
                CommerceHandler.logCommerceEvent(event);
                return true;
            } catch (e) {
                return {error: 'Error logging purchase event on forwarder ' + name + '; ' + e};
            }
        }

        function setUserAttribute(key, value) {
            if (isInitialized) {
                try {
                    UserAttributeHandler.onSetUserAttribute(key, value, forwarderSettings);
                    return 'Successfully set user attribute on forwarder ' + name;
                } catch (e) {
                    return 'Error setting user attribute on forwarder ' + name + '; ' + e;
                }
            } else {
                return 'Can\'t set user attribute on forwarder ' + name + ', not initialized';
            }
        }

        function removeUserAttribute(key) {
            if (isInitialized) {
                try {
                    UserAttributeHandler.onRemoveUserAttribute(key, forwarderSettings);
                    return 'Successfully removed user attribute on forwarder ' + name;
                } catch (e) {
                    return 'Error removing user attribute on forwarder ' + name + '; ' + e;
                }
            } else {
                return 'Can\'t remove user attribute on forwarder ' + name + ', not initialized';
            }
        }

        function setUserIdentity(id, type) {
            if (isInitialized) {
                try {
                    IdentityHandler.onSetUserIdentity(forwarderSettings, id, type);
                    return 'Successfully set user Identity on forwarder ' + name;
                } catch (e) {
                    return 'Error removing user attribute on forwarder ' + name + '; ' + e;
                }
            } else {
                return 'Can\'t call setUserIdentity on forwarder ' + name + ', not initialized';
            }

        }

        function onUserIdentified(user) {
            if (isInitialized) {
                try {
                    IdentityHandler.onUserIdentified(user);

                    return 'Successfully called onUserIdentified on forwarder ' + name;
                } catch (e) {
                    return {error: 'Error calling onUserIdentified on forwarder ' + name + '; ' + e};
                }
            }
            else {
                return 'Can\'t set new user identities on forwader  ' + name + ', not initialized';
            }
        }

        function onIdentifyComplete(user, filteredIdentityRequest) {
            if (isInitialized) {
                try {
                    IdentityHandler.onIdentifyCompleted(user, filteredIdentityRequest);

                    return 'Successfully called onIdentifyCompleted on forwarder ' + name;
                } catch (e) {
                    return {error: 'Error calling onIdentifyCompleted on forwarder ' + name + '; ' + e};
                }
            }
            else {
                return 'Can\'t call onIdentifyCompleted on forwader  ' + name + ', not initialized';
            }
        }

        function onLoginComplete(user, filteredIdentityRequest) {
            if (isInitialized) {
                try {
                    IdentityHandler.onLoginComplete(user, filteredIdentityRequest);

                    return 'Successfully called onLoginComplete on forwarder ' + name;
                } catch (e) {
                    return {error: 'Error calling onLoginComplete on forwarder ' + name + '; ' + e};
                }
            }
            else {
                return 'Can\'t call onLoginComplete on forwader  ' + name + ', not initialized';
            }
        }

        function onLogoutComplete(user, filteredIdentityRequest) {
            if (isInitialized) {
                try {
                    IdentityHandler.onLogoutComplete(user, filteredIdentityRequest);

                    return 'Successfully called onLogoutComplete on forwarder ' + name;
                } catch (e) {
                    return {error: 'Error calling onLogoutComplete on forwarder ' + name + '; ' + e};
                }
            }
            else {
                return 'Can\'t call onLogoutComplete on forwader  ' + name + ', not initialized';
            }
        }

        function onModifyComplete(user, filteredIdentityRequest) {
            if (isInitialized) {
                try {
                    IdentityHandler.onModifyComplete(user, filteredIdentityRequest);

                    return 'Successfully called onModifyComplete on forwarder ' + name;
                } catch (e) {
                    return {error: 'Error calling onModifyComplete on forwarder ' + name + '; ' + e};
                }
            }
            else {
                return 'Can\'t call onModifyComplete on forwader  ' + name + ', not initialized';
            }
        }

        function setOptOut(isOptingOutBoolean) {
            if (isInitialized) {
                try {
                    Initialization.setOptOut(isOptingOutBoolean);

                    return 'Successfully called setOptOut on forwarder ' + name;
                } catch (e) {
                    return {error: 'Error calling setOptOut on forwarder ' + name + '; ' + e};
                }
            }
            else {
                return 'Can\'t call setOptOut on forwader  ' + name + ', not initialized';
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

    if (!window || !window.mParticle || !window.mParticle.addForwarder) {
        return;
    }

    window.mParticle.addForwarder({
        name: name,
        constructor: constructor
    });
})(window);

},{"../../../src/commerce-handler":4,"../../../src/event-handler":6,"../../../src/identity-handler":7,"../../../src/initialization":8,"../../../src/session-handler":9,"../../../src/user-attribute-handler":10}],4:[function(require,module,exports){
var common = require('./common'),
    salesCounterTypes = {
        transactions: 1,
        items_sold: 1
    },
    ITEMS_SOLD = 'items_sold';

var commerceHandler = {
    logCommerceEvent: function(event) {
        if (event.EventDataType === mParticle.CommerceEventType.ProductPurchase) {
            var counter = event.CustomFlags && event.CustomFlags['DoubleClick.Counter'] ? event.CustomFlags['DoubleClick.Counter'] : null;
            if (!counter) {
                console.log('Event not sent. Sales conversions requires a custom flag of DoubleClick.Counter equal to \'transactions\', or \'items_sold\'. See https://support.google.com/dcm/partner/answer/2823400?hl=en for more info')
                return false;
            } else if (!salesCounterTypes[counter]) {
                console.log('Counter type not valid. For sales conversions, use a custom flag of DoubleClick.Counter equal to \'transactions\', or \'items_sold\'. See https://support.google.com/dcm/partner/answer/2823400?hl=en for more info')
                return false;
            }

            var eventMapping = common.getEventMapping(event);

            if (!eventMapping) {
                console.log('Event not mapped. Event not sent.');
                return false;
            }

            if (eventMapping.result && eventMapping.match) {
                var gtagProperties = {};
                common.setCustomVariables(event, gtagProperties);
                common.setSendTo(eventMapping.match, event.CustomFlags, gtagProperties);
                gtagProperties.send_to += ('+' + counter);
                //stringify number
                gtagProperties.value = '' + event.ProductAction.TotalAmount;
                gtagProperties.transaction_id = event.ProductAction.TransactionId;

                if (counter === ITEMS_SOLD) {
                    gtagProperties.quantity = '' + event.ProductAction.ProductList.length;
                }
                common.sendGtag('purchase', gtagProperties);
                return true;
            }
        }
    }
};

module.exports = commerceHandler;

},{"./common":5}],5:[function(require,module,exports){
module.exports = {
    eventMapping: {},
    customVariablesMappings: {},
    settings: {},
    setCustomVariables: function(event, gtagProperties) {
        for (var attribute in event.EventAttributes) {
            if (this.customVariablesMappings[attribute]) {
                gtagProperties[this.customVariablesMappings[attribute]] = event.EventAttributes[attribute];
            }
        }
    },
    setSendTo: function(mapping, customFlags, gtagProperties) {
        var tags = mapping.value.split(';');
        var groupTag = tags[0];
        var activityTag = tags[1];
        gtagProperties.send_to = 'DC-' + this.settings.advertiserId + '/' + groupTag + '/' + activityTag;
    },
    getEventMapping: function (event) {
        var jsHash = calculateJSHash(event.EventDataType, event.EventCategory, event.EventName);
        return findValueInMapping(jsHash, this.eventMapping);
    },
    sendGtag: function(type, properties, isInitialization) {
        function gtag() {
            window.dataLayer.push(arguments);
        }
        if (Array.isArray(window.dataLayer)) {
            if (isInitialization) {
                gtag(type, properties);
                // window.dataLayer.push([]);
            } else {
                gtag('event', type, properties);
                // window.dataLayer.push(['event', type, properties]);
            }
        }
    }
};

function findValueInMapping(jsHash, mapping) {
    if (mapping) {
        var filteredArray = mapping.filter(function(mappingEntry) {
            if (mappingEntry.jsmap && mappingEntry.maptype && mappingEntry.value) {
                return mappingEntry.jsmap === jsHash.toString();
            }

            return {
                result: false
            };
        });

        if (filteredArray && filteredArray.length > 0) {
            return {
                result: true,
                match: filteredArray[0]
            };
        }
    }
    return null;
}

function calculateJSHash(eventDataType, eventCategory, name) {
    var preHash =
        ('' + eventDataType) +
        ('' + eventCategory) + '' +
        (name || '');

    return mParticle.generateHash(preHash);
}

},{}],6:[function(require,module,exports){
var common = require('./common');

var eventCounterTypes = {
    standard: 1,
    unique: 1,
    per_session: 1
};

var eventHandler = {
    logEvent: function(event) {
        var gtagProperties = {};
        common.setCustomVariables(event, gtagProperties);
        var eventMapping = common.getEventMapping(event);

        if (!eventMapping) {
            console.log('Event not mapped. Event not sent.');
            return false;
        }

        if (eventMapping.result && eventMapping.match) {
            var counter = event.CustomFlags && event.CustomFlags['DoubleClick.Counter'] ? event.CustomFlags['DoubleClick.Counter'] : null;
            if (!counter) {
                console.log('Event not sent. Event conversions requires a custom flag of DoubleClick.Counter equal to \'standard\', \'unique\, or \'per_session\'. See https://support.google.com/dcm/partner/answer/2823400?hl=en for more info')
                return false;
            }
            if (eventCounterTypes[counter]) {
                common.setSendTo(eventMapping.match, event.CustomFlags, gtagProperties);
                gtagProperties.send_to += ('+' + counter);
                common.sendGtag('conversion', gtagProperties);
            } else {
                console.log('Counter type not valid. For event conversions, use \'standard\', \'unique\, or \'per_session\'. See https://support.google.com/dcm/partner/answer/2823400?hl=en for more info')
                return false;
            }
        }
        return true;
    },
    logError: function() {
    },
    logPageView: function() {
    }
};

module.exports = eventHandler;

},{"./common":5}],7:[function(require,module,exports){
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

var identityHandler = {
    onUserIdentified: function(mParticleUser) {

    },
    onIdentifyCompleted: function(mParticleUser, identityApiRequest) {

    },
    onLoginCompleted: function(mParticleUser, identityApiRequest) {

    },
    onLogoutCompleted: function(mParticleUser, identityApiRequest) {

    },
    onModifyCompleted: function(mParticleUser, identityApiRequest) {

    },

/*  In previous versions of the mParticle web SDK, setting user identities on
    kits is only reachable via the onSetUserIdentity method below. We recommend
    filling out `onSetUserIdentity` for maximum compatibility
*/
    onSetUserIdentity: function(forwarderSettings, id, type) {

    }
};

module.exports = identityHandler;

},{}],8:[function(require,module,exports){
var common = require('./common');

var initialization = {
    name: 'DoubleclickDFP',
    initForwarder: function(settings, testMode, userAttributes, userIdentities, processEvent, eventQueue, isInitialized) {
        common.settings = settings;

        window.dataLayer = window.dataLayer || [];
        if (!testMode) {
            var url = 'https://www.googletagmanager.com/gtag/js?id=' + settings.advertiserId;

            var gTagScript = document.createElement('script');
            gTagScript.type = 'text/javascript';
            gTagScript.async = true;
            gTagScript.src = url;
            (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(gTagScript);
            gTagScript.onload = function() {
                isInitialized = true;

                initializeGoogleDFP(settings);

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
            initializeGoogleDFP(settings, isInitialized);
        }
    }
};

function initializeGoogleDFP(settings, isInitialized) {
    common.eventMapping = JSON.parse(settings.eventMapping.replace(/&quot;/g, '\"'));

    common.customVariablesMappings = JSON.parse(settings.customVariables.replace(/&quot;/g, '\"')).reduce(function(a, b) {
        a[b.map] = b.value;
        return a;
    }, {});
    common.sendGtag('js', new Date(), isInitialized);
    common.sendGtag('allow_custom_scripts', true, isInitialized);
    common.sendGtag('config', settings.advertiserId, isInitialized);
    isInitialized = true;
}

module.exports = initialization;

},{"./common":5}],9:[function(require,module,exports){
var sessionHandler = {
    onSessionStart: function(event) {
        
    },
    onSessionEnd: function(event) {

    }
};

module.exports = sessionHandler;

},{}],10:[function(require,module,exports){
/*
The 'mParticleUser' is an object with methods on it to get user Identities and set/get user attributes
Partners can determine what userIds are available to use in their SDK
Call mParticleUser.getUserIdentities() to return an object of userIdentities --> { userIdentities: {customerid: '1234', email: 'email@gmail.com'} }
For more identity types, see http://docs.mparticle.com/developers/sdk/javascript/identity#allowed-identity-types
Call mParticleUser.getMPID() to get mParticle ID
For any additional methods, see http://docs.mparticle.com/developers/sdk/javascript/apidocs/classes/mParticle.Identity.getCurrentUser().html
*/

var userAttributeHandler = {
    onRemoveUserAttribute: function(key, mParticleUser) {

    },
    onSetUserAttribute: function(key, value, mParticleUser) {

    },
    onConsentStateUpdated: function(oldState, newState, mParticleUser) {

    }
};

module.exports = userAttributeHandler;

},{}],11:[function(require,module,exports){
var SDKsettings = {
    apiKey: 'testAPIKey'
    /* fill in SDKsettings with any particular settings or options your sdk requires in order to
    initialize, this may be apiKey, projectId, primaryCustomerType, etc. These are passed
    into the src/initialization.js file as the
    */
};

// Do not edit below:
module.exports = SDKsettings;

},{}]},{},[1]);
