import Types from './types';

export default function filteredMparticleUser(
    mpid,
    forwarder,
    mpInstance,
    kitBlocker,
) {
    const self = this;
    return {
        getUserIdentities: function () {
            let currentUserIdentities = {};
            const identities = mpInstance._Store.getUserIdentities(mpid);

            for (const identityType in identities) {
                if (identities.hasOwnProperty(identityType)) {
                    const identityName = Types.IdentityType.getIdentityName(
                        mpInstance._Helpers.parseNumber(identityType),
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

            currentUserIdentities =
                mpInstance._Helpers.filterUserIdentitiesForForwarders(
                    currentUserIdentities,
                    forwarder.userIdentityFilters,
                );

            return {
                userIdentities: currentUserIdentities,
            };
        },
        getMPID: function () {
            return mpid;
        },
        getUserAttributesLists: function (forwarder) {
            let userAttributesLists = {};

            const userAttributes = self.getAllUserAttributes();
            for (const key in userAttributes) {
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
                forwarder.userAttributeFilters,
            );

            return userAttributesLists;
        },
        getAllUserAttributes: function () {
            let userAttributesCopy = {};
            const userAttributes = mpInstance._Store.getUserAttributes(mpid);

            if (userAttributes) {
                for (const prop in userAttributes) {
                    if (userAttributes.hasOwnProperty(prop)) {
                        if (
                            !kitBlocker ||
                            (kitBlocker &&
                                !kitBlocker.isAttributeKeyBlocked(prop))
                        ) {
                            if (Array.isArray(userAttributes[prop])) {
                                userAttributesCopy[prop] =
                                    userAttributes[prop].slice();
                            } else {
                                userAttributesCopy[prop] = userAttributes[prop];
                            }
                        }
                    }
                }
            }

            userAttributesCopy = mpInstance._Helpers.filterUserAttributes(
                userAttributesCopy,
                forwarder.userAttributeFilters,
            );

            return userAttributesCopy;
        },
    };
}
