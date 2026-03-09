// START OF ADOBEKIT SERVERSIDE MPARTICLE JS INTEGRATION

/* eslint-disable no-undef */

//
//  Copyright 2018 mParticle, Inc.
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

import { AdobeHbkConstructor } from '../../../HeartbeatKit/dist/AdobeHBKit.esm.js';

var MessageType = {
    Media: 20
};
var name = 'Adobe',
    MARKETINGCLOUDIDKEY = 'mid',
    ADOBEMODULENUMBER = 124,
    suffix = 'Server';

var constructor = function() {
    var self = this,
        isAdobeServerKitInitialized;
    self.name = name;
    self.suffix = suffix;
    self.adobeMediaSDK = new AdobeHbkConstructor();

    function initForwarder(forwarderSettings, service, testMode) {
        mParticle._setIntegrationDelay(ADOBEMODULENUMBER, true);
        try {
            // On first load, adobe will call the callback correctly if no MCID exists
            // On subsequent loads, it does not, so we need to manually call setMCIDOnIntegrationAttributes
            var visitorOptions = {};
            if (forwarderSettings.audienceManagerServer) {
                visitorOptions.audienceManagerServer =
                    forwarderSettings.audienceManagerServer;
            }

            var mcID = Visitor.getInstance(
                forwarderSettings.organizationID,
                visitorOptions
            ).getMarketingCloudVisitorID(setMarketingCloudId);
            if (mcID && mcID.length > 0) {
                setMCIDOnIntegrationAttributes(mcID);
            }

            if (forwarderSettings.mediaTrackingServer) {
                self.adobeMediaSDK.init(forwarderSettings, service, testMode);
            }
            isAdobeServerKitInitialized = true;
            return 'Adobe Server Side Integration Ready';
        } catch (e) {
            return 'Failed to initialize: ' + e;
        }
    }

    function setMarketingCloudId(mcid) {
        setMCIDOnIntegrationAttributes(mcid);
    }

    function processEvent(event) {
        if (isAdobeServerKitInitialized) {
            try {
                if (event.EventDataType === MessageType.Media) {
                    self.adobeMediaSDK.process(event);
                }
            } catch (e) {
                return 'Failed to send to: ' + name + ' ' + e;
            }
        } else {
            return "Can't send to forwarder " + name + ', not initialized.';
        }
    }

    this.init = initForwarder;
    this.process = processEvent;
};

function setMCIDOnIntegrationAttributes(mcid) {
    var adobeIntegrationAttributes = {};
    adobeIntegrationAttributes[MARKETINGCLOUDIDKEY] = mcid;
    mParticle.setIntegrationAttribute(
        ADOBEMODULENUMBER,
        adobeIntegrationAttributes
    );
    mParticle._setIntegrationDelay(ADOBEMODULENUMBER, false);
}

function getId() {
    return moduleId;
}

if (window && window.mParticle && window.mParticle.addForwarder) {
    window.mParticle.addForwarder({
        name: name,
        suffix: suffix,
        constructor: constructor,
        getId: getId
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
            constructor: constructor
        };
    } else {
        config.kits = {};
        config.kits[forwarderNameWithSuffix] = {
            constructor: constructor
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
    register: register
};
