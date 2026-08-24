import Types from './types';
import { IMParticleWebSDKInstance } from './mp-instance';
import { MPID, UserIdentities } from '@mparticle/web-sdk';
import { Dictionary } from './utils';
import KitBlocker from './kitBlocking';
import { MPForwarder } from './forwarders.interfaces';

export interface IFilteredMparticleUser {
    getUserIdentities(): { userIdentities: Dictionary<string> };
    getMPID(): MPID;
    getUserAttributesLists(forwarder: MPForwarder): Dictionary<string[]>;
    getAllUserAttributes(): Dictionary;
}

function isAttributeKeyAllowed(
    kitBlocker?: KitBlocker,
    key: string
): boolean {
    return !kitBlocker?.isAttributeKeyBlocked(key);
}

function isIdentityAllowed(
    kitBlocker: KitBlocker | undefined,
    identityName: string
): boolean {
    return !kitBlocker?.isIdentityBlocked(identityName);
}

function copyUserAttributeValue(value: unknown): unknown {
    return Array.isArray(value) ? (value as string[]).slice() : value;
}

function buildUserAttributesCopy(
    userAttributes: Dictionary | null | undefined,
    kitBlocker: KitBlocker | undefined
): Dictionary {
    const userAttributesCopy: Dictionary = {};

    if (!userAttributes) {
        return userAttributesCopy;
    }

    for (const prop in userAttributes) {
        if (
            !userAttributes.hasOwnProperty(prop) ||
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
    kitBlocker: KitBlocker | undefined
): Dictionary<string[]> {
    const userAttributesLists: Dictionary<string[]> = {};

    for (const key in userAttributes) {
        if (
            !userAttributes.hasOwnProperty(key) ||
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
    kitBlocker: KitBlocker | undefined,
    parseNumber: (value: string | number) => number
): Dictionary<string> {
    const currentUserIdentities: Dictionary<string> = {};
    const identitiesByType = identities as Dictionary<string>;

    for (const identityType in identitiesByType) {
        if (!identitiesByType.hasOwnProperty(identityType)) {
            continue;
        }

        const identityName = Types.IdentityType.getIdentityName(
            parseNumber(identityType)
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
                kitBlocker,
                mpInstance._Helpers.parseNumber
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
