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
IdentityHandler.prototype.onUserIdentified = function() {};
IdentityHandler.prototype.onIdentifyComplete = function() {};

//Must re-initialize ID5 with partner identities(pd) in the config to collect an updated ID5 ID
IdentityHandler.prototype.onLoginComplete = function(mParticleUser) {
    var partnerData = this.common.buildPartnerData(mParticleUser);

    if (partnerData) {
        var id5Instance = window.ID5.init({
            partnerId: this.common.partnerId,
            pd: partnerData,
            consentData: {
                allowedVendors: this.common.allowedVendors,
            },
        });
        var logId5Id = this.common.logId5Id;

        id5Instance.onAvailable(
            function(status) {
                logId5Id(status.getUserId());
            }.bind(logId5Id)
        );
    }
};

//Must re-initialize ID5 without partner identities (pd) in the config to revert to an anonymous ID5 ID
IdentityHandler.prototype.onLogoutComplete = function() {
    var id5Instance = window.ID5.init({
        partnerId: this.common.partnerId,
        consentData: {
            allowedVendors: this.common.allowedVendors,
        },
    });
    var logId5Id = this.common.logId5Id;

    id5Instance.onAvailable(
        function(status) {
            logId5Id(status.getUserId());
        }.bind(logId5Id)
    );
};

IdentityHandler.prototype.onModifyComplete = function() {};

/*  In previous versions of the mParticle web SDK, setting user identities on
    kits is only reachable via the onSetUserIdentity method below. We recommend
    filling out `onSetUserIdentity` for maximum compatibility
*/
IdentityHandler.prototype.onSetUserIdentity = function() {};

module.exports = IdentityHandler;
