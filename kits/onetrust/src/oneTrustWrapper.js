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
var Initialization = require('./integration-builder/initialization').initialization;

var name = Initialization.name,
    moduleId = Initialization.moduleId;

var constructor = function () {
    var self = this,
        isInitialized = false,
        forwarderSettings;

    self.name = Initialization.name;

    function initForwarder(settings) {
        forwarderSettings = settings;
        if (!isInitialized) {
            try {
                Initialization.initForwarder(forwarderSettings, isInitialized);
                isInitialized = true;
            } catch (e) {
                console.log('Failed to initialize ' + name + ' - ' + e);
            }

            Initialization.createConsentEvents();
            Initialization.createVendorConsentEvents();
        }
    }

    function onUserIdentified() {
        if (isInitialized) {
            try {
                Initialization.createConsentEvents();
                Initialization.createVendorConsentEvents();
            } catch (e) {
                return {error: 'Error setting user identity on forwarder ' + name + '; ' + e};
            }
        }
        else {
            return 'Can\'t set new user identities on forwader ' + name + ', not initialized';
        }
    }

    this.init = initForwarder;
    this.onUserIdentified = onUserIdentified;
    this.process = function() {

    };
};

function getId() {
    return moduleId;
}

function isObject(val) {
    return val != null && typeof val === 'object' && Array.isArray(val) === false;
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
