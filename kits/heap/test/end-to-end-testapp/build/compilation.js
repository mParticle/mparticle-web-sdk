var HeapKit = (function (exports) {
    'use strict';

    function Common() {}

    Common.prototype.exampleMethod = function () {
        return 'I am an example';
    };

    var common = Common;

    function CommerceHandler(common) {
        this.common = common || {};
    }

    CommerceHandler.prototype.logCommerceEvent = function(event) {
        /*
            Sample ecommerce event schema:
            {
                CurrencyCode: 'USD',
                DeviceId:'a80eea1c-57f5-4f84-815e-06fe971b6ef2', // MP generated
                EventAttributes: { key1: 'value1', key2: 'value2' },
                EventType: 16,
                EventCategory: 10, // (This is an add product to cart event, see below for additional ecommerce EventCategories)
                EventName: "eCommerce - AddToCart",
                MPID: "8278431810143183490",
                ProductAction: {
                    Affiliation: 'aff1',
                    CouponCode: 'coupon',
                    ProductActionType: 7,
                    ProductList: [
                        {
                            Attributes: { prodKey1: 'prodValue1', prodKey2: 'prodValue2' },
                            Brand: 'Apple',
                            Category: 'phones',
                            CouponCode: 'coupon1',
                            Name: 'iPhone',
                            Price: '600',
                            Quantity: 2,
                            Sku: "SKU123",
                            TotalAmount: 1200,
                            Variant: '64GB'
                        }
                    ],
                    TransactionId: "tid1",
                    ShippingAmount: 10,
                    TaxAmount: 5,
                    TotalAmount: 1215,
                },
                UserAttributes: { userKey1: 'userValue1', userKey2: 'userValue2' }
                UserIdentities: [
                    {
                        Identity: 'test@gmail.com', Type: 7
                    }
                ]
            }

            If your SDK has specific ways to log different eCommerce events, see below for
            mParticle's additional ecommerce EventCategory types:

                10: ProductAddToCart, (as shown above)
                11: ProductRemoveFromCart,
                12: ProductCheckout,
                13: ProductCheckoutOption,
                14: ProductClick,
                15: ProductViewDetail,
                16: ProductPurchase,
                17: ProductRefund,
                18: PromotionView,
                19: PromotionClick,
                20: ProductAddToWishlist,
                21: ProductRemoveFromWishlist,
                22: ProductImpression
            */
    };

    var commerceHandler = CommerceHandler;

    /*
    A non-ecommerce event has the following schema:

    {
        DeviceId: "a80eea1c-57f5-4f84-815e-06fe971b6ef2",
        EventAttributes: {test: "Error", t: 'stack trace in string form'},
        EventName: "Error",
        MPID: "123123123123",
        UserAttributes: {userAttr1: 'value1', userAttr2: 'value2'},
        UserIdentities: [{Identity: 'email@gmail.com', Type: 7}]
        User Identity Types can be found here:
    }

    */

    function EventHandler(common) {
        this.common = common || {};
    }
    EventHandler.prototype.logEvent = function(event) {};
    EventHandler.prototype.logError = function(event) {
        // The schema for a logError event is the same, but noteworthy differences are as follows:
        // {
        //     EventAttributes: {m: 'name of error passed into MP', s: "Error", t: 'stack trace in string form if applicable'},
        //     EventName: "Error"
        // }
    };
    EventHandler.prototype.logPageView = function(event) {
        /* The schema for a logPagView event is the same, but noteworthy differences are as follows:
            {
                EventAttributes: {hostname: "www.google.com", title: 'Test Page'},  // These are event attributes only if no additional event attributes are explicitly provided to mParticle.logPageView(...)
            }
            */
    };

    var eventHandler = EventHandler;

    /*
    The 'mParticleUser' is an object with methods get user Identities and set/get user attributes
    Partners can determine what userIds are available to use in their SDK
    Call mParticleUser.getUserIdentities() to return an object of userIdentities --> { userIdentities: {customerid: '1234', email: 'email@gmail.com'} }
    For more identity types, see https://docs.mparticle.com/developers/sdk/web/idsync/#supported-identity-types
    Call mParticleUser.getMPID() to get mParticle ID
    For any additional methods, see https://docs.mparticle.com/developers/sdk/web/core-apidocs/classes/mParticle.Identity.getCurrentUser().html
    */

    /*
    identityApiRequest has the schema:
    {
      userIdentities: {
        customerid: '123',
        email: 'abc'
      }
    }
    For more userIdentity types, see https://docs.mparticle.com/developers/sdk/web/idsync/#supported-identity-types
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
        name: 'Heap',
    /*  ****** Fill out initForwarder to load your SDK ******
        Note that not all arguments may apply to your SDK initialization.
        These are passed from mParticle, but leave them even if they are not being used.
        forwarderSettings contain settings that your SDK requires in order to initialize
        userAttributes example: {gender: 'male', age: 25}
        userIdentities example: { 1: 'customerId', 2: 'facebookId', 7: 'emailid@email.com' }
        additional identityTypes can be found at https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/src/types.js#L88-L101
    */
        initForwarder: function(forwarderSettings, testMode, userAttributes, userIdentities, processEvent, eventQueue, isInitialized, common, appVersion, appName, customFlags, clientId) {
            /* `forwarderSettings` contains your SDK specific settings such as apiKey that your customer needs in order to initialize your SDK properly */
            if (!testMode) {
                /* Load your Web SDK here using a variant of your snippet from your readme that your customers would generally put into their <head> tags
                   Generally, our integrations create script tags and append them to the <head>. Please follow the following format as a guide:
                */

                if (!window.heap) {
                    var heapScript = document.createElement('script');
                    heapScript.type = 'text/javascript';
                    heapScript.async = true;
                    heapScript.src = 'https://cdn.heapanalytics.com/js/heap-' + forwarderSettings.appId + '.js';
                    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(heapScript);
                    heapScript.onload = function() {

                        if (window.heap && eventQueue.length > 0) {
                            // Process any events that may have been queued up while forwarder was being initialized.
                            for (var i = 0; i < eventQueue.length; i++) {
                                processEvent(eventQueue[i]);
                            }
                             // now that each queued event is processed, we empty the eventQueue
                            eventQueue = [];
                        }
                       window.heap.load(forwarderSettings.appId);
                    };
                }



            }
        }
    };

    var initialization_1 = initialization;

    var sessionHandler = {
        onSessionStart: function(event) {
            
        },
        onSessionEnd: function(event) {

        }
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
        this.common = common || {};
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

    if (typeof window !== 'undefined') {
        if (window && window.mParticle && window.mParticle.addForwarder) {
            window.mParticle.addForwarder({
                name: name,
                constructor: constructor,
                getId: getId,
            });
        }
    }

    var SDKsettings = {
        apiKey: 'testAPIKey'
        /* fill in SDKsettings with any particular settings or options your sdk requires in order to
        initialize, this may be apiKey, projectId, primaryCustomerType, etc. These are passed
        into the src/initialization.js file as the
        */
    };

    // Do not edit below:
    var settings = SDKsettings;

    var name$1 = initialization_1.name;

    var config = {
        name: name$1,
        moduleId: 100, // when published, you will receive a new moduleID
        isDebug: true,
        isSandbox: true,
        settings: settings,
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

    window.mParticle.config = window.mParticle.config || {};
    window.mParticle.config.workspaceToken = 'testkit';
    window.mParticle.config.requestConfig = false;
    window.mParticle.config.kitConfigs = [config];

    var endToEndTestapp = {

    };

    exports.default = endToEndTestapp;

    return exports;

}({}));
