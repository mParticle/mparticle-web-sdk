var ConsentHandler = require('./consent');
function Common() {
    this.customDataLayerName = null;

    this.consentMappings = [];
    this.consentPayloadDefaults = {};
    this.consentPayloadAsString = '';

    this.consentHandler = new ConsentHandler(this);
}

Common.prototype.buildMPID = function(event, user) {
    // Normally we expect event to contain the MPID, but in some cases
    // like onLoginComplete and other Identity aware functions,
    // we would need to pass in a user instead.

    var mpid = '';

    if (event && event.hasOwnProperty('MPID')) {
        mpid = event.MPID;
    } else if (user && user.hasOwnProperty('getMPID')) {
        mpid = user.getMPID();
    }

    return mpid;
};

Common.prototype.buildUserAttributes = function(event, user) {
    // Normally we expect event to contain the attributes, but in some cases
    // like onLoginComplete and other Identity aware functions,
    // we would need to pass in a user instead.
    var userAttributes = {};

    if (event && event.hasOwnProperty('UserAttributes')) {
        userAttributes = event.UserAttributes;
    } else if (user && user.hasOwnProperty('getAllUserAttributes')) {
        userAttributes = user.getAllUserAttributes();
    }

    return userAttributes;
};

Common.prototype.buildUserIdentities = function(event, user) {
    // Normally we expect event to contain the identities, but in some cases
    // like onLoginComplete and other Identity aware functions,
    // we would need to pass in a user instead.
    var userIdentities = {};

    if (event.hasOwnProperty('UserIdentities')) {
        event.UserIdentities.forEach(function(identity) {
            var identityKey = mParticle.IdentityType.getIdentityName(
                identity.Type
            );
            userIdentities[identityKey] = identity.Identity;
        });
    } else if (
        user.hasOwnProperty('getUserIdentities') &&
        user.getUserIdentities().userIdentities
    ) {
        userIdentities = user.getUserIdentities().userIdentities;
    }

    return userIdentities;
};
Common.prototype.buildConsentObject = function(event) {
    var gdpr = {};
    var consentState =
        event.ConsentState ||
        mParticle.Identity.getCurrentUser().getConsentState();

    if (
        consentState &&
        consentState.getGDPRConsentState &&
        consentState.getGDPRConsentState()
    ) {
        gdpr = consentState.getGDPRConsentState();
    }

    return {
        gdpr: gdpr
    };
};

Common.prototype.send = function(_attributes) {
    var payload = {};
    var mpData = {};
    var attributes = _attributes || {};
    var event = attributes.event || {};
    var user = attributes.user || {};

    var eventName = event.EventName || 'Custom Event';

    var mpUser = {
        mpid: this.buildMPID(event, user),
        consent_state: this.buildConsentObject(event),
        attributes: this.buildUserAttributes(event, user),
        identities: this.buildUserIdentities(event, user)
    };

    var mpEvent = {
        name: eventName,
        type: attributes.eventType || 'custom_event',
        attributes: event.EventAttributes || {}
    };

    payload.event = eventName;

    mpData = {
        device_application_stamp:
            event.DeviceId || mParticle.getDeviceId() || '',
        user: mpUser,
        event: mpEvent
    };

    payload.mp_data = mpData;

    if (attributes.eventPayload) {
        for (var payloadKey in attributes.eventPayload) {
            if (attributes.eventPayload.hasOwnProperty(payloadKey)) {
                payload[payloadKey] = attributes.eventPayload[payloadKey];
            }
        }
    }

    window[this.customDataLayerName].push(payload);
};

Common.prototype.sendConsent = function (type, payload) {
    // Google Tag Manager doesn't directly use the gtag function
    // but recommends pushing directly into the dataLayer
    // https://developers.google.com/tag-manager/devguide
    var customDataLayerName = this.customDataLayerName;
    function customDataLayer() {
        window[customDataLayerName].push(arguments);
    }

    customDataLayer('consent', type, payload);
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
            this.sendConsent('update', updatedConsentPayload);
            this.consentPayloadAsString = eventConsentAsString;
        }
    }
};

Common.prototype.sendDefaultConsentPayloadToGoogle = function (consentPayload) {
    this.consentPayloadAsString = JSON.stringify(
        consentPayload
    );

    this.sendConsent('default', consentPayload);
}

Common.prototype.cloneObject = function (obj) {
    return JSON.parse(JSON.stringify(obj));
};

Common.prototype.isEmpty = function isEmpty(value) {
    return value == null || !(Object.keys(value) || value).length;
};

module.exports = Common;
