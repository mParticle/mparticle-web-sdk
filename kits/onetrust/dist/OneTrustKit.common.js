Object.defineProperty(exports, '__esModule', { value: true });

/* eslint-disable no-undef */
var CONSENT_REGULATIONS = {
    GDPR: 'gdpr',
    CCPA: 'ccpa',
};
var CCPA_PURPOSE = 'data_sale_opt_out';

var initialization = {
    name: 'OneTrust',
    moduleId: 134,
    consentMapping: {},
    googleVendorConsentMapping: {},
    iabVendorConsentMapping: {},
    generalVendorConsentMapping: {},
    getConsentGroupIds: function() {
        return window.OnetrustActiveGroups
            ? window.OnetrustActiveGroups.split(',')
            : [];
    },

    parseConsentMapping: function(rawConsentMapping) {
        var _consentMapping = {};
        if (rawConsentMapping) {
            var parsedMapping = JSON.parse(
                rawConsentMapping.replace(/&quot;/g, '"')
            );

            // TODO: [67837] Revise this to use an actual 'regulation' mapping if UI ever returns this
            parsedMapping.forEach(function(mapping) {
                var purpose = mapping.map;
                _consentMapping[mapping.value] = {
                    purpose: purpose,
                    regulation:
                        purpose === CCPA_PURPOSE
                            ? CONSENT_REGULATIONS.CCPA
                            : CONSENT_REGULATIONS.GDPR,
                };
            });
        }

        return _consentMapping;
    },

    initForwarder: function(forwarderSettings) {
        var self = this;
        self.consentMapping = self.parseConsentMapping(
            forwarderSettings.consentGroups
        );

        self.googleVendorConsentMapping = self.parseConsentMapping(
            forwarderSettings.vendorGoogleConsentGroups
        );
        self.iabVendorConsentMapping = self.parseConsentMapping(
            forwarderSettings.vendorIABConsentGroups
        );
        self.generalVendorConsentMapping = self.parseConsentMapping(
            forwarderSettings.vendorGeneralConsentGroups
        );
        // Wrap exisitng OptanonWrapper in case customer is using
        // it for something custom so we can hijack
        var OptanonWrapperCopy = window.OptanonWrapper;

        window.OptanonWrapper = function() {
            if (window.Optanon && window.Optanon.OnConsentChanged) {
                window.Optanon.OnConsentChanged(function() {
                    self.createConsentEvents();
                    self.createVendorConsentEvents();
                });
            }

            // Run original OptanonWrapper()
            OptanonWrapperCopy();
        };
    },
    createConsentEvents: function() {
        var user = mParticle.Identity.getCurrentUser();
        if (!window.Optanon || !user) {
            return;
        }

        var location = window.location.href;
        var consentState =
            user.getConsentState() || mParticle.Consent.createConsentState();

        for (var key in this.consentMapping) {
            // removes all non-digits
            // 1st version of OneTrust required a selection from group1, group2, etc
            if (key.indexOf('group') >= 0) {
                key = key.replace(/\D/g, '');
            }

            // Although consent purposes can be inputted into the UI in any casing
            // the SDK will automatically lowercase them to prevent pseudo-duplicate
            // consent purposes, so we call `toLowerCase` on the consentMapping purposes here
            var consentPurpose = this.consentMapping[key].purpose.toLowerCase();
            var regulation = this.consentMapping[key].regulation;

            var latestOTConsentBoolean =
                this.getConsentGroupIds().indexOf(key) > -1;

            // At present, only CCPA and GDPR are known regulations
            // Using a switch in case a new regulation is added in the future
            switch (regulation) {
                case CONSENT_REGULATIONS.CCPA:
                    var ccpaConsent = mParticle.Consent.createCCPAConsent(
                        latestOTConsentBoolean,
                        Date.now(),
                        consentPurpose,
                        location
                    );
                    consentState.setCCPAConsentState(ccpaConsent);
                    break;

                case CONSENT_REGULATIONS.GDPR:
                    var GDPRConsentState =
                        consentState.getGDPRConsentState() || {};

                    // if the consent boolean exists, and the current users consent
                    // is the same as the latest OT consent (consent hasn't changed)
                    // then don't update the consent state
                    if (GDPRConsentState[consentPurpose]) {
                        var currentConsentBoolean =
                            GDPRConsentState[consentPurpose].Consented;
                        if (currentConsentBoolean === latestOTConsentBoolean) {
                            break;
                        }
                    }

                    var gdprConsent = mParticle.Consent.createGDPRConsent(
                        latestOTConsentBoolean,
                        Date.now(),
                        consentPurpose,
                        location
                    );
                    consentState.addGDPRConsentState(
                        consentPurpose,
                        gdprConsent
                    );
                    break;

                default:
                    console.error('Unknown Consent Regulation', regulation);
            }
        }

        user.setConsentState(consentState);
    },

    createVendorConsentEvents: function() {
        var self = this;
        if (window.OneTrust && window.OneTrust.getVendorConsentsRequestV2) {
            var location = window.location.href,
                consentState,
                user = mParticle.Identity.getCurrentUser();

            if (user) {
                consentState = user.getConsentState();

                if (!consentState) {
                    consentState = mParticle.Consent.createConsentState();
                }

                OneTrust.getVendorConsentsRequestV2(function(
                    oneTrustVendorConsent
                ) {
                    // oneTrustVendorConsent object is in the shape of
                    // {
                    //     ...
                    //     addtlConsent:
                    //         '1~39.43.46.55.61.70.83.89.93.108.117.122.124.131',
                    //     vendor: {
                    //         consents: '10100111011'  //
                    //     },
                    //     ...
                    // };
                    //
                    // Google Vendors are in addtlConsent - to the right of
                    // "1~" are ids for which Google Vendor the user has consented,
                    // ie. 39, 43, 46, etc, but not 1, 2, 3 which are not in this list
                    //
                    // IAB Vendors are in vendor.consents
                    // 1 = consented, 0 = rejected. The index+1 is the IAB Vendor ID
                    // ie. If IAB ID is 5, the index is 4 in the consent string
                    // to the left, or 0 (rejected))
                    setGoogleVendorRequests(
                        oneTrustVendorConsent,
                        self.googleVendorConsentMapping,
                        consentState,
                        location
                    );

                    setIABVendorRequests(
                        oneTrustVendorConsent,
                        self.iabVendorConsentMapping,
                        consentState,
                        location
                    );

                    setGeneralVendorRequests(
                        // general vendor consent is on the OptAnonActiveGroups string, similar to GDPR consent
                        self.getConsentGroupIds(),
                        self.generalVendorConsentMapping,
                        consentState,
                        location
                    );
                });

                user.setConsentState(consentState);
            }
        }
    },
};

function setGoogleVendorRequests(
    oneTrustVendorConsent,
    googleVendorConsentMapping,
    consentState,
    location
) {
    try {
        // turn Google Vendor Consent string into an array of IDs
        var googleConsentedVendors = oneTrustVendorConsent
            ? oneTrustVendorConsent.addtlConsent
                  .slice()
                  .split('~')[1]
                  .split('.')
            : null;

        if (googleConsentedVendors && googleConsentedVendors.length) {
            for (var vendorId in googleVendorConsentMapping) {
                var consentPurpose =
                    googleVendorConsentMapping[vendorId].purpose;
                // consent is true if the vendor id is in the array of consented IDs
                var consentBoolean =
                    googleConsentedVendors.indexOf(vendorId) > -1;
                var consent = mParticle.Consent.createGDPRConsent(
                    consentBoolean,
                    Date.now(),
                    consentPurpose,
                    location
                );
                consentState.addGDPRConsentState(consentPurpose, consent);
            }
        }
    } catch (e) {
        console.error(
            'There was a problem setting Google Vendor Consents: ',
            e
        );
    }
}

function setIABVendorRequests(
    oneTrustVendorConsent,
    IABVendorConsentMappings,
    consentState,
    location
) {
    try {
        var IABConsentedVendors = oneTrustVendorConsent
            ? oneTrustVendorConsent.vendor.consents
            : null;
        for (var vendorIndex in IABVendorConsentMappings) {
            var consentPurpose = IABVendorConsentMappings[vendorIndex].purpose;
            // consent is true if the (vendorIndex - 1) is 1
            var consentBoolean =
                IABConsentedVendors[parseInt(vendorIndex) - 1] === '1';
            var consent = mParticle.Consent.createGDPRConsent(
                consentBoolean,
                Date.now(),
                consentPurpose,
                location
            );
            consentState.addGDPRConsentState(consentPurpose, consent);
        }
    } catch (e) {
        console.error('There was a problem setting IAB Vendor Consents: ', e);
    }
}

function setGeneralVendorRequests(
    oneTrustVendorConsent,
    generalVendorConsentMapping,
    consentState,
    location
) {
    try {
        if (window.Optanon) {
            for (var vendorId in generalVendorConsentMapping) {
                var consentPurpose =
                    generalVendorConsentMapping[vendorId].purpose;
                // consent is true if the vendorId is in the oneTrustVendorConsent array
                var consentBoolean =
                    oneTrustVendorConsent.indexOf(vendorId) > -1;
                var consent = mParticle.Consent.createGDPRConsent(
                    consentBoolean,
                    Date.now(),
                    consentPurpose,
                    location
                );

                consentState.addGDPRConsentState(consentPurpose, consent);
            }
        }
    } catch (e) {
        console.error(
            'There was a problem setting General Vendor Consents: ',
            e
        );
    }
}

var initialization_1 = {
    initialization: initialization,
};

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
var Initialization = initialization_1
    .initialization;

var name = Initialization.name,
    moduleId = Initialization.moduleId;

var constructor = function() {
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
                return {
                    error:
                        'Error setting user identity on forwarder ' +
                        name +
                        '; ' +
                        e,
                };
            }
        } else {
            return (
                "Can't set new user identities on forwader " +
                name +
                ', not initialized'
            );
        }
    }

    this.init = initForwarder;
    this.onUserIdentified = onUserIdentified;
    this.process = function() {};
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

var oneTrustWrapper = {
    register: register,
};
var oneTrustWrapper_1 = oneTrustWrapper.register;

exports.default = oneTrustWrapper;
exports.register = oneTrustWrapper_1;
