import Types from './types';

export default function filteredMparticleUser(
    mpid,
    forwarder,
    mpInstance,
    kitBlocker
) {
    var self = this;
    return {
        getUserIdentities: function() {
            var currentUserIdentities = {};
            var identities = mpInstance._Persistence.getUserIdentities(mpid);

            for (var identityType in identities) {
                if (identities.hasOwnProperty(identityType)) {
                    var identityName = Types.IdentityType.getIdentityName(
                        mpInstance._Helpers.parseNumber(identityType)
                    );
                    if (
                        !kitBlocker ||
                        (kitBlocker &&
                            !kitBlocker.isIdentityBlocked(identityName))
                    )
                        //if identity type is not blocked
                        currentUserIdentities[identityName] =
                            identities[identityType];
                }
            }

            currentUserIdentities = mpInstance._Helpers.filterUserIdentitiesForForwarders(
                currentUserIdentities,
                forwarder.userIdentityFilters
            );

            return {
                userIdentities: currentUserIdentities,
            };
        },
        getMPID: function() {
            return mpid;
        },
        getUserAttributesLists: function(forwarder) {
            var userAttributes,
                userAttributesLists = {};

            userAttributes = self.getAllUserAttributes();
            for (var key in userAttributes) {
                if (
                    userAttributes.hasOwnProperty(key) &&
                    Array.isArray(userAttributes[key])
                ) {
                    if (
                        !kitBlocker ||
                        (kitBlocker && !kitBlocker.isAttributeKeyBlocked(key))
                    ) {
                        userAttributesLists[key] = userAttributes[key].slice();
                    }
                }
            }

            userAttributesLists = mpInstance._Helpers.filterUserAttributes(
                userAttributesLists,
                forwarder.userAttributeFilters
            );

            return userAttributesLists;
        },
        getAllUserAttributes: function() {
            var userAttributesCopy = {};
            var userAttributes = mpInstance._Persistence.getAllUserAttributes(
                mpid
            );

            if (userAttributes) {
                for (var prop in userAttributes) {
                    if (userAttributes.hasOwnProperty(prop)) {
                        if (
                            !kitBlocker ||
                            (kitBlocker &&
                                !kitBlocker.isAttributeKeyBlocked(prop))
                        ) {
                            if (Array.isArray(userAttributes[prop])) {
                                userAttributesCopy[prop] = userAttributes[
                                    prop
                                ].slice();
                            } else {
                                userAttributesCopy[prop] = userAttributes[prop];
                            }
                        }
                    }
                }
            }

            userAttributesCopy = mpInstance._Helpers.filterUserAttributes(
                userAttributesCopy,
                forwarder.userAttributeFilters
            );

            return userAttributesCopy;
        },
    };
}
