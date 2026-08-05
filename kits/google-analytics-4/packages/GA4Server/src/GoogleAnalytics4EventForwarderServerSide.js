/* eslint-disable no-undef */

//
//  Copyright 2022 mParticle, Inc.
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


// This GA4 server side kit loads gtag, gets the client id, and sets it as an integration attribute on the core sdk.
// This kit does not have a `processEvent` method because no events should be sent client side.

var name = 'GoogleAnalytics4',
    GA4MODULENUMBER = 160,
    suffix = 'Server';

var constructor = function() {
    var self = this;
    self.name = name;
    self.suffix = suffix;

    function initForwarder(forwarderSettings, service, testMode) {
        mParticle._setIntegrationDelay(GA4MODULENUMBER, true);

        var measurementId = forwarderSettings.measurementId;
        window.dataLayer = window.dataLayer || [];

        window.gtag = function() {
            window.dataLayer.push(arguments);
        };

        gtag('js', new Date());

        gtag('get', measurementId, 'client_id', function(clientId) {
            setClientId(clientId, GA4MODULENUMBER);
        });

        if (!testMode) {
            var clientScript = document.createElement('script');
            clientScript.type = 'text/javascript';
            clientScript.async = true;
            clientScript.src =
                'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
            (
                document.getElementsByTagName('head')[0] ||
                document.getElementsByTagName('body')[0]
            ).appendChild(clientScript);
        }
    }

    this.init = initForwarder;
};

function setClientId(clientId, GA4MODULENUMBER) {
    var GA4CLIENTID = 'client_id';
    var ga4IntegrationAttributes = {};
    ga4IntegrationAttributes[GA4CLIENTID] = clientId;
    mParticle.setIntegrationAttribute(
        GA4MODULENUMBER,
        ga4IntegrationAttributes
    );
    mParticle._setIntegrationDelay(GA4MODULENUMBER, false);
}

function getId() {
    return GA4MODULENUMBER;
}

if (window && window.mParticle && window.mParticle.addForwarder) {
    window.mParticle.addForwarder({
        name: name,
        constructor: constructor,
        getId: getId,
        // A suffix is added if there are multiple different versions of
        // a client kit.  This matches the suffix in the DB.
        suffix: suffix,
    });
}

function register(config) {
    var forwarderNameWithSuffix = [name, suffix].join('-');
    if (!config) {
        window.console.log(
            'You must pass a config object to register the kit ' +
                forwarderNameWithSuffix
        );
        return;
    }

    if (!isObject(config)) {
        window.console.log(
            "'config' must be an object. You passed in a " + typeof config
        );
        return;
    }

    if (isObject(config.kits)) {
        config.kits[forwarderNameWithSuffix] = {
            constructor: constructor,
        };
    } else {
        config.kits = {};
        config.kits[forwarderNameWithSuffix] = {
            constructor: constructor,
        };
    }
    window.console.log(
        'Successfully registered ' +
            forwarderNameWithSuffix +
            ' to your mParticle configuration'
    );
}

function isObject(val) {
    return (
        val != null && typeof val === 'object' && Array.isArray(val) === false
    );
}

export default {
    register: register,
};
