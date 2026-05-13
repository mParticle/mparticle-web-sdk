import Types from './types';
import { IMParticleWebSDKInstance } from './mp-instance';
import { MPID } from '@mparticle/web-sdk';
import { Dictionary } from './utils';
import KitBlocker from './kitBlocking';
import { MPForwarder } from './forwarders.interfaces';

interface IFilteredMparticleUser {
    getUserIdentities(): { userIdentities: Dictionary<string> };
    getMPID(): MPID;
    getUserAttributesLists(forwarder: MPForwarder): Dictionary<string[]>;
    getAllUserAttributes(): Dictionary;
}

export default function filteredMparticleUser(
    mpid: MPID,
    forwarder: MPForwarder | { userAttributeFilters: number[] },
    mpInstance: IMParticleWebSDKInstance,
    kitBlocker?: KitBlocker
): IFilteredMparticleUser {
    return {
        getUserIdentities: function(): { userIdentities: Dictionary<string> } {
            let currentUserIdentities: Dictionary<string> = {};
            const identities = mpInstance._Store.getUserIdentities(mpid);

            for (const identityType in identities) {
                if (identities.hasOwnProperty(identityType)) {
                    const identityName = Types.IdentityType.getIdentityName(
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

            currentUserIdentities = (mpInstance._Helpers.filterUserIdentitiesForForwarders as Function)(
                currentUserIdentities,
                (forwarder as MPForwarder).userIdentityFilters
            );

            return {
                userIdentities: currentUserIdentities,
            };
        },
        getMPID: function(): MPID {
            return mpid;
        },
        getUserAttributesLists: function(forwarder: MPForwarder): Dictionary<string[]> {
            let userAttributes: Dictionary;
            let userAttributesLists: Dictionary<string[]> = {};

            userAttributes = getAllUserAttributes();
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

            userAttributesLists = (mpInstance._Helpers.filterUserAttributes as Function)(
                userAttributesLists,
                forwarder.userAttributeFilters
            );

            return userAttributesLists;
        },
        getAllUserAttributes: getAllUserAttributes,
    };

    function getAllUserAttributes(): Dictionary {
        let userAttributesCopy: Dictionary = {};
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
                            userAttributesCopy[prop] = (userAttributes[
                                prop
                            ] as string[]).slice();
                        } else {
                            userAttributesCopy[prop] = userAttributes[prop];
                        }
                    }
                }
            }
        }

        userAttributesCopy = (mpInstance._Helpers.filterUserAttributes as Function)(
            userAttributesCopy,
            (forwarder as MPForwarder).userAttributeFilters
        );

        return userAttributesCopy;
    }
}
