/*
The 'mParticleUser' is an object with methods on it to get user Identities and set/get user attributes
Partners can determine what userIds are available to use in their SDK
Call mParticleUser.getUserIdentities() to return an object of userIdentities --> { userIdentities: {customerid: '1234', email: 'email@gmail.com'} }
For more identity types, see http://docs.mparticle.com/developers/sdk/javascript/identity#allowed-identity-types
Call mParticleUser.getMPID() to get mParticle ID
For any additional methods, see http://docs.mparticle.com/developers/sdk/javascript/apidocs/classes/mParticle.Identity.getCurrentUser().html
*/

function UserAttributeHandler(common) {
    this.common = common = {};
}
UserAttributeHandler.prototype.onRemoveUserAttribute = function(
    key,
    mParticleUser
) {
    this.common.send({
        event: {
            EventName: 'Remove User Attribute'
        },
        options: {
            key: key
        }
    });
};
UserAttributeHandler.prototype.onSetUserAttribute = function(
    key,
    value,
    mParticleUser
) {
    this.common.send({
        event: {
            EventName: 'Set User Attribute'
        },
        options: {
            key: key,
            value: value
        }
    });
};
UserAttributeHandler.prototype.onConsentStateUpdated = function(
    oldState,
    newState,
    mParticleUser
) {
    this.common.send({
        event: {
            EventName: 'Consent State Update'
        },
        options: {
            old_state: oldState,
            new_state: newState
        }
    });
};

module.exports = UserAttributeHandler;
