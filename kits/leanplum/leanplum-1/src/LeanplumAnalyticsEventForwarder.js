/* eslint-disable no-undef */

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

    var isobject = require('isobject');

    var name = 'Leanplum',
        moduleId = 98,
        MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            Commerce: 16
        },
        Environment = {
            Production: 'production',
            Development: 'development',
        };

    var constructor = function () {
        var self = this,
            isInitialized = false,
            forwarderSettings,
            reportingService,
            isTesting,
            constants = {
                customerId: 'customerId',
                mpid: 'mpid',
                email: 'email'
            },
            eventQueue = [];

        self.name = name;

        function processEvent(event) {
            var reportEvent = false;
            if (isInitialized) {
                try {
                    if (event.EventDataType === MessageType.PageView) {
                        reportEvent = logPageView(event);
                    }
                    else if (event.EventDataType === MessageType.Commerce && event.EventCategory === mParticle.CommerceEventType.ProductPurchase) {
                        reportEvent = logPurchaseEvent(event);
                    }
                    else if (event.EventDataType === MessageType.Commerce) {
                        var listOfPageEvents = mParticle.eCommerce.expandCommerceEvent(event);
                        if (listOfPageEvents !== null) {
                            for (var i = 0; i < listOfPageEvents.length; i++) {
                                try {
                                    logEvent(listOfPageEvents[i]);
                                }
                                catch (err) {
                                    return 'Error logging page event' + err.message;
                                }
                            }
                        }
                    }
                    else if (event.EventDataType === MessageType.PageEvent) {
                        reportEvent = logEvent(event);
                    }

                    if (reportEvent === true && reportingService) {
                        reportingService(self, event);
                        return 'Successfully sent to ' + name;
                    }
                    else {
                        return 'Error logging event or event type not supported - ' + reportEvent.error;
                    }
                }
                catch (e) {
                    return 'Failed to send to: ' + name + ' ' + e;
                }
            }
            else {
                eventQueue.push(event);
            }

            return 'Can\'t send to forwarder ' + name + ', not initialized. Event added to queue.';
        }

        function setUserIdentity(id, type) {
            var leanPlumConfigType = forwarderSettings.userIdField;
            if (isInitialized) {
                try {
                    if ((type === window.mParticle.IdentityType.CustomerId && leanPlumConfigType === constants.customerId) || (type === window.mParticle.IdentityType.Email && leanPlumConfigType === constants.email)) {
                        Leanplum.setUserId(id);
                    }
                    else {
                        return 'User Identity type not supported on forwarder ' + name + '. Use only CustomerId or Email';
                    }
                }
                catch (e) {
                    return 'Failed to call setUserIdentity on ' + name + ' ' + e;
                }
            }
            else {
                return 'Can\'t call setUserIdentity on forwarder ' + name + ', not initialized';
            }
        }
        function onUserIdentified(user) {
            if (isInitialized) {
                if (forwarderSettings.userIdField === constants.mpid) {
                    Leanplum.setUserId(user.getMPID());
                }
            }
            else {
                return 'Can\'t call onUserIdentified on forwarder ' + name + ', not initialized';
            }
        }

        function setUserAttribute(key, value) {
            if (isInitialized) {
                try {
                    var attributeDict = {};
                    attributeDict[key] = value;
                    Leanplum.setUserAttributes(attributeDict);

                    return 'Successfully called setUserAttribute API on ' + name;
                }
                catch (e) {
                    return 'Failed to call SET setUserAttribute on ' + name + ' ' + e;
                }
            }
            else {
                return 'Can\'t call setUserAttribute on forwarder ' + name + ', not initialized';
            }
        }

        function removeUserAttribute(key) {
            setUserAttribute(key, null);
        }

        function logPageView(data) {
            try {
                if (data.EventAttributes) {
                    Leanplum.advanceTo(data.EventName, data.EventAttributes);
                }
                else {
                    Leanplum.advanceTo(data.EventName);
                }
                return true;
            }
            catch (e) {
                return {error: e};
            }
        }

        function logPurchaseEvent(event) {
            var reportEvent = false;
            if (event.ProductAction.ProductList) {
                try {
                    event.ProductAction.ProductList.forEach(function(product) {
                        Leanplum.track('Purchase', parseFloat(product.TotalAmount), product);
                    });
                    return true;
                }
                catch (e) {
                    return {error: e};
                }
            }

            return reportEvent;
        }

        function logEvent(data) {
            try {
                if (data.EventAttributes) {
                    Leanplum.track(data.EventName, data.EventAttributes);
                }
                else {
                    Leanplum.track(data.EventName);
                }
                return true;
            }
            catch (e) {
                return {error: e};
            }
        }

        function initForwarder(settings, service, testMode, trackerId, userAttributes, userIdentities) {
            forwarderSettings = settings;
            reportingService = service;
            isTesting = testMode;

            try {
                function initialize() {
                    completeLeanPlumInitialization(userAttributes, userIdentities);
                    isInitialized = true;
                    if (Leanplum && eventQueue.length > 0) {
                        // Process any events that may have been queued up while forwarder was being initialized.
                        for (var i = 0; i < eventQueue.length; i++) {
                            processEvent(eventQueue[i]);
                        }

                        eventQueue = [];
                    }
                }

                if (isTesting || window.Leanplum) {
                    initialize();
                } else {
                    var leanplumScript = document.createElement('script');
                    leanplumScript.type = 'text/javascript';
                    leanplumScript.async = true;
                    leanplumScript.src = 'https://cdn.jsdelivr.net/npm/leanplum-sdk@1';

                    leanplumScript.onload = initialize;
                    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(leanplumScript);
                }

                return 'Leanplum successfully loaded';
            }
            catch (e) {
                return 'Failed to initialize: ' + e;
            }
        }

        function completeLeanPlumInitialization(userAttributes, userIdentities) {
            setLeanPlumEnvironment();
            initializeUserId(userAttributes, userIdentities);
        }

        function setLeanPlumEnvironment() {
            var TWO_HOURS = 2*60*60;
            Leanplum.useSessionLength(forwarderSettings.sessionLength || TWO_HOURS);

            if (forwarderSettings.enableRichInAppMessages === 'True') {
                Leanplum.enableRichInAppMessages(true);
            }

            if (window.mParticle.getEnvironment() === Environment.Development) {
                Leanplum.setAppIdForDevelopmentMode(forwarderSettings.appId, forwarderSettings.clientKey);
            } else {
                Leanplum.setAppIdForProductionMode(forwarderSettings.appId, forwarderSettings.clientKey);
            }
        }

        function initializeUserId(userAttributes, userIdentities) {
            var user,
                userId = null;

            // if Identity object exists on mParticle, it is on V2 of SDK and we prioritize MPID
            if (window.mParticle && window.mParticle.Identity) {
                if (forwarderSettings.userIdField === constants.mpid) {
                    user = window.mParticle.Identity.getCurrentUser();
                    if (user) {
                        userId = user.getMPID();
                        Leanplum.start(userId);
                        return;
                    }
                }
            }

            if (userIdentities.length) {
                if (forwarderSettings.userIdField === constants.customerId) {
                    userId = userIdentities.filter(function(identity) {
                        return (identity.Type === window.mParticle.IdentityType.CustomerId);
                    })[0];
                }
                else if (forwarderSettings.userIdField === constants.email) {
                    userId = userIdentities.filter(function(identity) {
                        return (identity.Type === window.mParticle.IdentityType.Email);
                    })[0];
                }

                if (userId && userId.Identity && Object.keys(userAttributes).length) {
                    Leanplum.start(userId.Identity, userAttributes);
                }
                else if (userId && userId.Identity) {
                    Leanplum.start(userId.Identity);
                }
                return;
            }

            Leanplum.start();
        }

        this.init = initForwarder;
        this.process = processEvent;
        this.setUserIdentity = setUserIdentity;
        this.setUserAttribute = setUserAttribute;
        this.removeUserAttribute = removeUserAttribute;
        this.onUserIdentified = onUserIdentified;
    };

    function getId() {
        return moduleId;
    }

    function register(config) {
        if (!config) {
            window.console.log('You must pass a config object to register the kit ' + name);
            return;
        }

        if (!isobject(config)) {
            window.console.log('\'config\' must be an object. You passed in a ' + typeof config);
            return;
        }

        if (isobject(config.kits)) {
            config.kits[name] = {
                constructor: constructor
            };
        } else {
            config.kits = {};
            config.kits[name] = {
                constructor: constructor
            };
        }
        window.console.log('Successfully registered ' + name + ' to your mParticle configuration');
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

    module.exports = {
        register: register
    };
