var OptimizelyKit = (function (exports) {
    'use strict';

    function Common() {}

    var common = Common;

    var optimizelyXDefinedEvents = {
        pages: {},
        events: {},
    };

    var optimizelyFsDefinedEvents = {
        events: {},
    };

    var helpers = {
        arrayToObject: function(array, keyField) {
            var newObj = array.reduce(function(obj, item) {
                obj[item[keyField]] = item;
                return obj;
            }, {});
            return newObj;
        },
        loadScript: function(src, callback) {
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.onload = callback;
            script.src = src;
            document.head.appendChild(script);
        },
        getUserId: function(userIdField) {
            var identities = window.mParticle.Identity.getCurrentUser().getUserIdentities();
            var userIdentities = identities['userIdentities'];
            var userId;
            switch (userIdField) {
                // The server returns `customerId` as part of the `userIdField` setting
                // but the API for identity requies it to be cased as `customerid`
                case 'customerId':
                    userId = userIdentities['customerid'];
                    break;
                case 'email':
                    userId = userIdentities['email'];
                    break;
                case 'mpid':
                    userId = window.mParticle.Identity.getCurrentUser().getMPID();
                    break;
                case 'other':
                    userId = userIdentities['other'];
                    break;
                case 'other2':
                    userId = userIdentities['other2'];
                    break;
                case 'other3':
                    userId = userIdentities['other3'];
                    break;
                case 'other4':
                    userId = userIdentities['other4'];
                    break;
                case 'deviceApplicationStamp':
                    userId = window.mParticle.getDeviceId();
                    break;
                default:
                    // this should never hit, since a user is required to select from a userId type from the userIdField dropdown
                    userId = null;
            }

            if (!userId) {
                userId = window.mParticle.getDeviceId();
            }
            return userId;
        },
    };

    var helpers_1 = helpers;

    function CommerceHandler(common) {
        this.common = common || {};
    }

    CommerceHandler.prototype.logCommerceEvent = function(event) {
        var self = this;

        var expandedEcommerceEvents = mParticle.eCommerce.expandCommerceEvent(
            event
        );

        expandedEcommerceEvents.forEach(function(expandedEvent) {
            if (
                !self.common.useFullStack &&
                optimizelyXDefinedEvents.events[expandedEvent.EventName]
            ) {
                var optimizelyWebXEvent = {
                    type: 'event',
                    eventName: event.EventName,
                    tags: {},
                };
                optimizelyWebXEvent.tags = expandedEvent.EventAttributes || {};
                if (
                    event.EventCategory ===
                        mParticle.CommerceEventType.ProductPurchase ||
                    event.EventCategory ===
                        mParticle.CommerceEventType.ProductRefund
                ) {
                    if (expandedEvent.EventName.indexOf('Total') > -1) {
                        if (
                            event.CustomFlags &&
                            event.CustomFlags['Optimizely.EventName']
                        ) {
                            optimizelyWebXEvent.eventName =
                                event.CustomFlags['Optimizely.EventName'];
                        } else {
                            optimizelyWebXEvent.eventName = expandedEvent.EventName;
                        }
                        // Overall purchase event
                        if (
                            expandedEvent.EventAttributes &&
                            expandedEvent.EventAttributes['Total Amount']
                        ) {
                            optimizelyWebXEvent.tags.revenue =
                                expandedEvent.EventAttributes['Total Amount'] * 100;
                        }
                        // other individual product events should not have revenue tags
                        // which are added via the expandCommerceEvent method above
                    } else {
                        optimizelyWebXEvent.eventName = expandedEvent.EventName;
                        if (optimizelyWebXEvent.tags.revenue) {
                            delete optimizelyWebXEvent.tags.revenue;
                        }
                        if (optimizelyWebXEvent.tags.Revenue) {
                            delete optimizelyWebXEvent.tags.Revenue;
                        }
                    }
                } else {
                    optimizelyWebXEvent.eventName = expandedEvent.EventName;
                    if (
                        event.CustomFlags &&
                        event.CustomFlags['Optimizely.EventName']
                    ) {
                        optimizelyWebXEvent.eventName =
                            event.CustomFlags['Optimizely.EventName'];
                    }
                }

                // Events that are added to the OptimizelyUI will be available on optimizelyWebXEvents.events
                // Ignore events not included in the Optimizely UI
                if (optimizelyXDefinedEvents.events[optimizelyWebXEvent.eventName]) {
                    var eventCopy = {};
                    for (var key in optimizelyWebXEvent) {
                        eventCopy[key] = optimizelyWebXEvent[key];
                    }
                    window['optimizely'].push(eventCopy);
                }
            }

            // if optimizely full stack is being used
            if (self.common.useFullStack && window.optimizelyClientInstance) {
                if (
                    optimizelyFsDefinedEvents.events[expandedEvent.EventName] ||
                    optimizelyFsDefinedEvents.events[
                        event.CustomFlags['OptimizelyFullStack.EventName']
                    ]
                ) {
                    var eventKey = expandedEvent.EventName,
                        userId,
                        userAttributes = self.common.userAttributes,
                        eventTags = {};

                    eventTags = expandedEvent.EventAttributes || {};

                    if (window.mParticle && window.mParticle.Identity) {
                        userId = helpers_1.getUserId(self.common.userIdField);
                    }

                    if (
                        event.EventCategory ===
                            mParticle.CommerceEventType.ProductPurchase ||
                        event.EventCategory ===
                            mParticle.CommerceEventType.ProductRefund
                    ) {
                        if (expandedEvent.EventName.indexOf('Total') > -1) {
                            if (
                                event.CustomFlags &&
                                event.CustomFlags['OptimizelyFullStack.EventName']
                            ) {
                                eventKey =
                                    event.CustomFlags[
                                        'OptimizelyFullStack.EventName'
                                    ];
                            } else {
                                eventKey = expandedEvent.EventName;
                            }

                            // Overall purchase event
                            if (
                                expandedEvent.EventAttributes &&
                                expandedEvent.EventAttributes['Total Amount']
                            ) {
                                eventTags.revenue =
                                    expandedEvent.EventAttributes['Total Amount'] *
                                    100;
                            }
                            // other individual product events should not have revenue tags
                            // which are added via the expandCommerceEvent method above
                        } else {
                            if (
                                event.CustomFlags &&
                                event.CustomFlags['OptimizelyFullStack.EventName']
                            ) {
                                eventKey =
                                    event.CustomFlags[
                                        'OptimizelyFullStack.EventName'
                                    ];
                            }
                            if (eventTags.revenue) {
                                delete eventTags.revenue;
                            }
                        }
                    } else {
                        eventKey = expandedEvent.EventName;
                        if (
                            event.CustomFlags &&
                            event.CustomFlags['OptimizelyFullStack.EventName']
                        ) {
                            eventKey =
                                event.CustomFlags['OptimizelyFullStack.EventName'];
                        }
                    }
                    window['optimizelyClientInstance'].track(
                        eventKey,
                        userId,
                        userAttributes,
                        eventTags
                    );
                }
            }
        });
    };

    var commerceHandler = CommerceHandler;

    function EventHandler(common) {
        this.common = common || {};
    }

    EventHandler.prototype.logEvent = function(event) {
        if (
            !this.common.useFullStack &&
            optimizelyXDefinedEvents.events[event.EventName]
        ) {
            var optimizelyWebXEvent = {
                type: 'event',
                eventName: event.EventName,
            };

            if (event.EventAttributes) {
                optimizelyWebXEvent.tags = event.EventAttributes;
            }

            if (event.CustomFlags && event.CustomFlags['Optimizely.Value']) {
                optimizelyWebXEvent.tags.value =
                    event.CustomFlags['Optimizely.Value'];
            }
            window['optimizely'].push(optimizelyWebXEvent);
        }

        // if optimizely full stack is being used
        if (
            this.common.useFullStack &&
            window.optimizelyClientInstance &&
            optimizelyFsDefinedEvents.events[event.EventName]
        ) {
            var eventKey = event.EventName,
                userId,
                userAttributes = this.common.userAttributes,
                eventTags = {};

            if (window.mParticle && window.mParticle.Identity) {
                userId = helpers_1.getUserId(this.common.userIdField);
            }

            if (event.EventAttributes) {
                eventTags = event.EventAttributes;
            }

            if (
                event.CustomFlags &&
                event.CustomFlags['OptimizelyFullStack.Value']
            ) {
                eventTags.value = event.CustomFlags['OptimizelyFullStack.Value'];
            }

            window['optimizelyClientInstance'].track(
                eventKey,
                userId,
                userAttributes,
                eventTags
            );
        }
    };

    EventHandler.prototype.logPageView = function(event) {
        var self = this;

        if (
            !self.common.useFullStack &&
            optimizelyXDefinedEvents.pages[event.EventName]
        ) {
            var optimizelyWebXEvent = {
                type: 'page',
                pageName: event.EventName,
            };

            if (event.EventAttributes) {
                optimizelyWebXEvent.tags = event.EventAttributes;
            }
            window['optimizely'].push(optimizelyWebXEvent);
        }
    };

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
    IdentityHandler.prototype.onUserIdentified = function(
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

    var optimizelyFsSdkUrl =
            'https://unpkg.com/@optimizely/optimizely-sdk@3.5.0/dist/optimizely.browser.umd.min.js',
        dataFilePrefix = 'https://cdn.optimizely.com/datafiles/',
        dataFileURLending = '.json/tag.js';

    var initialization = {
        name: 'Optimizely',
        moduleId: 54,
        initForwarder: function(
            settings,
            testMode,
            userAttributes,
            userIdentities,
            processEvent,
            eventQueue,
            isInitialized,
            common,
            appVersion,
            appName,
            customFlags,
            clientId
        ) {
            common.useFullStack = settings.useFullStack === 'True';

            if (!testMode) {
                if (!window.optimizely && !common.useFullStack) {
                    var optimizelyScript = document.createElement('script');
                    optimizelyScript.type = 'text/javascript';
                    optimizelyScript.async = true;
                    optimizelyScript.src =
                        'https://cdn.optimizely.com/js/' +
                        settings.projectId +
                        '.js';
                    (
                        document.getElementsByTagName('head')[0] ||
                        document.getElementsByTagName('body')[0]
                    ).appendChild(optimizelyScript);
                    optimizelyScript.onload = function() {

                        loadWebXEventsAndPages();

                        if (window['optimizely'] && eventQueue.length > 0) {
                            for (var i = 0; i < eventQueue.length; i++) {
                                processEvent(eventQueue[i]);
                            }
                            eventQueue = [];
                        }
                    };
                } else {
                    loadWebXEventsAndPages();
                }

                if (!window.optimizelyClientInstance && common.useFullStack) {
                    common.userIdField = settings.userIdField;
                    common.userAttributes = userAttributes;
                    var errorHandler = function() {};

                    if (
                        customFlags &&
                        customFlags['OptimizelyFullStack.ErrorHandler']
                    ) {
                        errorHandler =
                            customFlags['OptimizelyFullStack.ErrorHandler'];
                    }

                    var instantiateFSClient = function() {
                        window.optimizelyClientInstance = window.optimizelySdk.createInstance(
                            {
                                datafile: window.optimizelyDatafile,
                                errorHandler: { handleError: errorHandler },
                            }
                        );

                        window.optimizelyClientInstance.onReady().then(function() {
                            loadFullStackEvents();
                        });
                    };

                    helpers_1.loadScript(optimizelyFsSdkUrl, function() {
                        helpers_1.loadScript(
                            dataFilePrefix + settings.projectId + dataFileURLending,
                            instantiateFSClient
                        );
                    });
                } else {
                    common.userIdField = settings.userIdField;
                    common.userAttributes = userAttributes;
                    loadFullStackEvents();
                }
            } else {
                if (!common.useFullStack) {
                    loadWebXEventsAndPages();
                }
                if (common.useFullStack) {
                    common.userIdField = settings.userIdField;
                    common.userAttributes = userAttributes;
                    loadFullStackEvents();
                }
            }
        },
    };

    function loadWebXEventsAndPages() {
        var data,
            events = {},
            pages = {};

        if (window.optimizely) {
            data = window.optimizely.get('data');

            for (var event in data.events) {
                events[data.events[event].apiName] = 1;
            }

            for (var page in data.pages) {
                pages[data.pages[page].apiName] = 1;
            }

            optimizelyXDefinedEvents.events = events;
            optimizelyXDefinedEvents.pages = pages;
        }
    }

    function loadFullStackEvents() {
        var fullStackData,
            fullStackEvents = {};

        if (window.optimizelyDatafile) {
            fullStackData = helpers_1.arrayToObject(
                window.optimizelyDatafile.events,
                'id'
            );

            for (var event in fullStackData) {
                fullStackEvents[fullStackData[event].key] = 1;
            }

            optimizelyFsDefinedEvents.events = fullStackEvents;
        }
    }

    var initialization_1 = initialization;

    var sessionHandler = {
        onSessionStart: function(event) {},
        onSessionEnd: function(event) {},
    };

    var sessionHandler_1 = sessionHandler;

    function UserAttributeHandler(common) {
        this.common = common || {};
    }

    UserAttributeHandler.prototype.onRemoveUserAttribute = function(key) {
        if (!this.common.useFullStack && window.optimizely) {
            var attribute = {};
            attribute[key] = null;
            window['optimizely'].push({
                type: 'user',
                attributes: attribute,
            });
        }
        if (this.common.useFullStack && window.optimizelyClientInstance) {
            if (this.common.userAttributes[key]) {
                delete this.common.userAttributes[key];
            }
        }
    };
    UserAttributeHandler.prototype.onSetUserAttribute = function(key, value) {
        if (!this.common.useFullStack && window.optimizely) {
            var attribute = {};
            attribute[key] = value;
            window['optimizely'].push({
                type: 'user',
                attributes: attribute,
            });
        }
        if (this.common.useFullStack && window.optimizelyClientInstance) {
            var self = this;
            self.common.userAttributes[key] = value;
        }
    };

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
                sessionHandler_1.onSessionStart(event);
                return true;
            } catch (e) {
                return {
                    error: 'Error starting session on forwarder ' + name + '; ' + e,
                };
            }
        }

        function logSessionEnd(event) {
            try {
                sessionHandler_1.onSessionEnd(event);
                return true;
            } catch (e) {
                return {
                    error: 'Error ending session on forwarder ' + name + '; ' + e,
                };
            }
        }

        function logError(event) {
            try {
                self.eventHandler.logError(event);
                return true;
            } catch (e) {
                return {
                    error: 'Error logging error on forwarder ' + name + '; ' + e,
                };
            }
        }

        function logPageView(event) {
            try {
                self.eventHandler.logPageView(event);
                return true;
            } catch (e) {
                return {
                    error:
                        'Error logging page view on forwarder ' + name + '; ' + e,
                };
            }
        }

        function logEvent(event) {
            try {
                self.eventHandler.logEvent(event);
                return true;
            } catch (e) {
                return {
                    error: 'Error logging event on forwarder ' + name + '; ' + e,
                };
            }
        }

        function logEcommerceEvent(event) {
            try {
                self.commerceHandler.logCommerceEvent(event);
                return true;
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
