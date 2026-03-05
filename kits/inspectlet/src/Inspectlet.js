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

    var isobject = require('isobject');

    var MessageType = {
        SessionStart: 1,
        SessionEnd: 2,
        PageView: 3,
        PageEvent: 4,
        CrashReport: 5,
        OptOut: 6,
        Commerce: 16
    },
        name = 'Inspectlet',
        moduleId = 61;

    var constructor = function () {
        var self = this,
            isInitialized = false,
            forwarderSettings,
            reportingService,
            isTesting = false;

        self.name = name;

        function getIdentityTypeName(identityType) {
            return mParticle.IdentityType.getName(identityType);
        }

        function reportEvent(event) {
            if (reportingService) {
                reportingService(self, event);
            }
        }

        function processEvent(event) {
            if (isInitialized) {
                try {
                    if (event.EventDataType == MessageType.PageEvent) {
                        if (event.EventCategory == window.mParticle.EventType.Transaction) {
                            logTransaction(event);
                            reportEvent(event);
                            return 'Successfully sent to ' + name;
                        }
                        else if (event.EventCategory == window.mParticle.EventType.Navigation) {
                            __insp.push(["virtualPage"]);
                            reportEvent(event);

                            return 'Successfully sent virtual page view to ' + name;
                        }
                    }
                    else if (event.EventDataType == MessageType.Commerce) {
                        logTransaction(event);
                    }

                    return 'Ignoring non-transaction event for ' + name;
                }
                catch (e) {
                    return 'Failed to send to: ' + name + ' ' + e;
                }
            }

            return 'Can\'t send to forwarder ' + name + ', not initialized';
        }

        function logTransaction(data) {
            __insp.push(['tagSession', "purchase"]);
        }

        function setUserAttribute(key, value) {
            var attributeDict;

            if (isInitialized) {
                if (value) {
                    attributeDict = {};
                    attributeDict[key] = value;
                    __insp.push(['tagSession', attributeDict]);
                }
                else {
                    __insp.push(['tagSession', key]);
                }
            }
            else {
                return 'Can\'t call setUserAttribute on forwarder ' + name + ', not initialized';
            }
        }

        function setUserIdentity(id, type) {
            if (isInitialized) {
                setUserAttribute(getIdentityTypeName(type), id);
            }
            else {
                return 'Can\'t call setUserIdentity on forwarder ' + name + ', not initialized';
            }
        }

        function initForwarder(settings, service, testMode) {
            forwarderSettings = settings;
            reportingService = service;
            isTesting = testMode;

            try {
                function addInspectlet() {
                    function __ldinsp() {
                        var insp = document.createElement('script');
                        insp.type = 'text/javascript';
                        insp.async = true;
                        insp.id = "inspsync";
                        insp.src = ('https:' == document.location.protocol ? 'https' : 'http') + '://cdn.inspectlet.com/inspectlet.js';
                        var head = document.getElementsByTagName('head')[0];
                        head.appendChild(insp);
                    }

                    if (window.attachEvent) {
                        window.attachEvent('onload', __ldinsp);
                    }
                    else {
                        window.addEventListener('load', __ldinsp, false);
                    }
                }

                window.__insp = window.__insp || [];
                __insp.push(['wid', forwarderSettings.wId]);

                if (isTesting === false) {
                    addInspectlet();
                }

                isInitialized = true;

                return 'Successfully initialized: ' + name;
            }
            catch (e) {
                return 'Failed to initialize: ' + name;
            }
        }

        this.init = initForwarder;
        this.process = processEvent;
        this.setUserAttribute = setUserAttribute;
        this.setUserIdentity = setUserIdentity;
    };
    function getId() {
        return moduleId;
    }

    function register(config) {
        if (!config) {
            console.log('You must pass a config object to register the kit ' + name);
            return;
        }

        if (!isobject(config)) {
            console.log('\'config\' must be an object. You passed in a ' + typeof config);
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
        console.log('Successfully registered ' + name + ' to your mParticle configuration');
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

