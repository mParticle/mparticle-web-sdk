function UserAttributeHandler(common) {
    this.common = common || {};
}

UserAttributeHandler.prototype.sendUserPropertiesToGA4 = function (
    userAttributes
) {
    gtag(
        'set',
        'user_properties',
        this.common.truncateUserAttributes(userAttributes)
    );
};

// `mParticleUser` was removed from the function signatures onRemoveUserAttribute, onSetUserAttribute, and onConsentStateUpload because they were not being used
// In the future if mParticleUser is ever required for an implementation of any of the below APIs, see https://github.com/mparticle-integrations/mparticle-javascript-integration-example/blob/master/src/user-attribute-handler.js
// for previous function signatures

UserAttributeHandler.prototype.onRemoveUserAttribute = function (key) {
    var userAttributes = {};
    userAttributes[key] = null;
    this.sendUserPropertiesToGA4(userAttributes);
};

UserAttributeHandler.prototype.onSetUserAttribute = function (key, value) {
    var userAttributes = {};
    userAttributes[key] = value;
    this.sendUserPropertiesToGA4(userAttributes);
};

// TODO: Commenting this out for now because Integrations PM still determining if this is in scope or not
// UserAttributeHandler.prototype.onConsentStateUpdated = function() // oldState,
// newState,
// mParticleUser
// {};

module.exports = UserAttributeHandler;
