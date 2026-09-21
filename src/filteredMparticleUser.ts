import Types, { getIdentityTypeFromStoredKey } from './types';
import { IMParticleWebSDKInstance } from './mp-instance';
import { MPID, UserIdentities } from '@mparticle/web-sdk';
import { Dictionary, hasOwnProp, isUncopyablePropertyName } from './utils';
import KitBlocker from './kitBlocking';
import { MPForwarder } from './forwarders.interfaces';

export interface IFilteredMparticleUser {
    getUserIdentities(): { userIdentities: Dictionary<string> };
    getMPID(): MPID;
    getUserAttributesLists(forwarder: MPForwarder): Dictionary<string[]>;
    getAllUserAttributes(): Dictionary;
}

function isAttributeKeyAllowed(
    kitBlocker: KitBlocker | undefined,
    key: string
): boolean {
    return !kitBlocker?.isAttributeKeyBlocked(key);
}

export function isIdentityAllowed(
    kitBlocker: KitBlocker | undefined,
    identityName: string
): boolean {
    return !kitBlocker?.isIdentityBlocked(identityName);
}

function copyUserAttributeValue(value: unknown): unknown {
    return Array.isArray(value) ? (value as string[]).slice() : value;
}

function buildUserAttributesCopy(
    userAttributes?: Dictionary,
    kitBlocker?: KitBlocker
): Dictionary {
    const userAttributesCopy: Dictionary = {};

    if (!userAttributes) {
        return userAttributesCopy;
    }

    for (const prop in userAttributes) {
        if (
            !hasOwnProp(userAttributes, prop) ||
            isUncopyablePropertyName(prop) ||
            !isAttributeKeyAllowed(kitBlocker, prop)
        ) {
            continue;
        }

        userAttributesCopy[prop] = copyUserAttributeValue(
            userAttributes[prop]
        );
    }

    return userAttributesCopy;
}

function buildUserAttributeLists(
    userAttributes: Dictionary,
    kitBlocker?: KitBlocker
): Dictionary<string[]> {
    const userAttributesLists: Dictionary<string[]> = {};

    for (const key in userAttributes) {
        if (
            !hasOwnProp(userAttributes, key) ||
            isUncopyablePropertyName(key) ||
            !Array.isArray(userAttributes[key]) ||
            !isAttributeKeyAllowed(kitBlocker, key)
        ) {
            continue;
        }

        userAttributesLists[key] = userAttributes[key].slice();
    }

    return userAttributesLists;
}

function buildFilteredUserIdentities(
    identities: UserIdentities,
    kitBlocker: KitBlocker | undefined
): Dictionary<string> {
    const currentUserIdentities: Dictionary<string> = {};
    const identitiesByType = identities as Dictionary<string>;

    for (const identityType in identitiesByType) {
        if (!hasOwnProp(identitiesByType, identityType)) {
            continue;
        }

        const storedIdentityType = getIdentityTypeFromStoredKey(identityType);

        // Must be `=== null`: IdentityType.Other is 0, so a falsy check would
        // drop a valid stored Other identity.
        if (storedIdentityType === null) {
            continue;
        }

        const identityName = Types.IdentityType.getIdentityName(
            storedIdentityType
        );

        if (!isIdentityAllowed(kitBlocker, identityName)) {
            continue;
        }

        currentUserIdentities[identityName] = identitiesByType[identityType];
    }

    return currentUserIdentities;
}

export default function filteredMparticleUser(
    mpid: MPID,
    forwarder: MPForwarder | { userAttributeFilters: number[] },
    mpInstance: IMParticleWebSDKInstance,
    kitBlocker?: KitBlocker
): IFilteredMparticleUser {
    function getAllUserAttributes(): Dictionary {
        const userAttributesCopy = buildUserAttributesCopy(
            mpInstance._Store.getUserAttributes(mpid),
            kitBlocker
        );

        return mpInstance._Helpers.filterUserAttributes(
            userAttributesCopy,
            (forwarder as MPForwarder).userAttributeFilters
        );
    }

    return {
        getUserIdentities: function(): { userIdentities: Dictionary<string> } {
            let currentUserIdentities = buildFilteredUserIdentities(
                mpInstance._Store.getUserIdentities(mpid),
                kitBlocker
            );

            currentUserIdentities = mpInstance._Helpers.filterUserIdentitiesForForwarders(
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
        getUserAttributesLists: function(
            forwarder: MPForwarder
        ): Dictionary<string[]> {
            const userAttributesLists = buildUserAttributeLists(
                getAllUserAttributes(),
                kitBlocker
            );

            return mpInstance._Helpers.filterUserAttributes(
                userAttributesLists,
                forwarder.userAttributeFilters
            ) as Dictionary<string[]>;
        },
        getAllUserAttributes: getAllUserAttributes,
    };
}
