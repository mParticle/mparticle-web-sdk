var ConsentHandler = require('./consent');
function Common() {
    this.consentMappings = [];
    this.consentPayloadDefaults = {};
    this.consentPayloadAsString = '';

    this.consentHandler = new ConsentHandler(this);
}

Common.prototype.eventMapping = {};
Common.prototype.customVariablesMappings = {};
Common.prototype.customFieldMappings = {};
Common.prototype.settings = {};
Common.prototype.setCustomVariables = function(event, gtagProperties) {
    for (var attribute in event.EventAttributes) {
        if (this.customVariablesMappings[attribute]) {
            gtagProperties[this.customVariablesMappings[attribute]] =
                event.EventAttributes[attribute];
        }
    }
};
Common.prototype.setCustomFields = function(event, gtagProperties) {
    var dc_custom_params = {};
    var hasMappings = false;
    for (var attribute in event.EventAttributes) {
        if (this.customFieldMappings[attribute]) {
            dc_custom_params[this.customFieldMappings[attribute]] =
                event.EventAttributes[attribute];
            hasMappings = true;
        }
    }
    if (hasMappings) {
        gtagProperties["dc_custom_params"] = dc_custom_params;
    }
};
Common.prototype.setSendTo = function(mapping, customFlags, gtagProperties) {
    var tags = mapping.value.split(';');
    var groupTag = tags[0];
    var activityTag = tags[1];
    gtagProperties.send_to =
        'DC-' + this.settings.advertiserId + '/' + groupTag + '/' + activityTag;
};
Common.prototype.getEventMapping = function(event) {
    var jsHash = calculateJSHash(
        event.EventDataType,
        event.EventCategory,
        event.EventName
    );
    return findValueInMapping(jsHash, this.eventMapping);
};
Common.prototype.sendGtag = function(type, properties, isInitialization) {
    function gtag() {
        window.dataLayer.push(arguments);
    }
    if (Array.isArray(window.dataLayer)) {
        if (isInitialization) {
            gtag(type, properties);
        } else {
            gtag('event', type, properties);
        }
    }
};

Common.prototype.sendGtagConsent = function (type, payload) {
    function gtag() {
        window.dataLayer.push(arguments);
    }
    gtag('consent', type, payload);
};

Common.prototype.getEventConsentState = function (eventConsentState) {
    return eventConsentState && eventConsentState.getGDPRConsentState
        ? eventConsentState.getGDPRConsentState()
        : {};
};

Common.prototype.maybeSendConsentUpdateToGoogle = function (consentState) {
    // If consent payload is empty,
    // we never sent an initial default consent state
    // so we shouldn't send an update.
    if (
        this.consentPayloadAsString &&
        this.consentMappings &&
        !this.isEmpty(consentState)
    ) {
        var updatedConsentPayload =
            this.consentHandler.generateConsentStatePayloadFromMappings(
                consentState,
                this.consentMappings
            );

        var eventConsentAsString = JSON.stringify(updatedConsentPayload);

        if (eventConsentAsString !== this.consentPayloadAsString) {
            this.sendGtagConsent('update', updatedConsentPayload);
            this.consentPayloadAsString = eventConsentAsString;
        }
    }
};

Common.prototype.sendDefaultConsentPayloadToGoogle = function (consentPayload) {
    this.consentPayloadAsString = JSON.stringify(consentPayload);

    this.sendGtagConsent('default', consentPayload);
};

Common.prototype.cloneObject = function (obj) {
    return JSON.parse(JSON.stringify(obj));
};

Common.prototype.isEmpty = function isEmpty(value) {
    return value == null || !(Object.keys(value) || value).length;
};

module.exports = Common;

function findValueInMapping(jsHash, mapping) {
    if (mapping) {
        var filteredArray = mapping.filter(function(mappingEntry) {
            if (
                mappingEntry.jsmap &&
                mappingEntry.maptype &&
                mappingEntry.value
            ) {
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
    var preHash = '' + eventDataType + ('' + eventCategory) + '' + (name || '');

    return mParticle.generateHash(preHash);
}
