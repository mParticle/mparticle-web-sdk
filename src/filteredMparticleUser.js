import Persistence from './persistence';
import Types from './types';
import Helpers from './helpers';

export default function getFilteredMparticleUser(mpid, forwarder) {
    return {
        getUserIdentities: function() {
            var currentUserIdentities = {};
            var identities = Persistence.getUserIdentities(mpid);

            for (var identityType in identities) {
                if (identities.hasOwnProperty(identityType)) {
                    currentUserIdentities[
                        Types.IdentityType.getIdentityName(
                            Helpers.parseNumber(identityType)
                        )
                    ] = identities[identityType];
                }
            }

            currentUserIdentities = Helpers.filterUserIdentitiesForForwarders(
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

            userAttributes = this.getAllUserAttributes();
            for (var key in userAttributes) {
                if (
                    userAttributes.hasOwnProperty(key) &&
                    Array.isArray(userAttributes[key])
                ) {
                    userAttributesLists[key] = userAttributes[key].slice();
                }
            }

            userAttributesLists = Helpers.filterUserAttributes(
                userAttributesLists,
                forwarder.userAttributeFilters
            );

            return userAttributesLists;
        },
        getAllUserAttributes: function() {
            var userAttributesCopy = {};
            var userAttributes = Persistence.getAllUserAttributes(mpid);

            if (userAttributes) {
                for (var prop in userAttributes) {
                    if (userAttributes.hasOwnProperty(prop)) {
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

            userAttributesCopy = Helpers.filterUserAttributes(
                userAttributesCopy,
                forwarder.userAttributeFilters
            );

            return userAttributesCopy;
        },
    };
}
