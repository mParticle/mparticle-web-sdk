import { Dictionary } from './utils';
import { LocalStorageVault } from './vault';
import Types from './types';
import { IdentityApiData, UserIdentities } from '@mparticle/web-sdk';
import { isObject } from './utils';

export interface IKnownIdentities extends UserIdentities {
    device_application_stamp?: string;
}

export const cacheIdentityRequest = (
    method: string,
    identities: IKnownIdentities,
    mpid: string,
    expireTimestamp: number,
    idCache: LocalStorageVault<Dictionary>
): void => {
    let cache = idCache.retrieve() || {};

    let cacheKey = concatenateIdentities(method, identities);

    cache[cacheKey] = { mpid, expireTimestamp };
    idCache.store(cache);
};

// We need to ensure that identities are concatenated in a deterministic way, so
// we sort the identities based on their enum.
// we create an array, set the user identity at the index of the user identity type
export const concatenateIdentities = (
    method: string,
    userIdentities: IKnownIdentities
): string => {
    // set DAS first since it is not an official identity type
    let cacheKey: string = `${method}:device_application_stamp=${userIdentities.device_application_stamp};`;
    const idLength: number = Object.keys(userIdentities).length;
    let concatenatedIdentities: string;

    if (idLength) {
        let userIDArray: Array<string> = new Array(idLength);
        // create an array where each index is equal to the user identity type
        for (let key in userIdentities) {
            if (key === 'device_application_stamp') {
                continue;
            } else {
                userIDArray[Types.IdentityType.getIdentityType(key)] =
                    userIdentities[key];
            }
        }

        concatenatedIdentities = userIDArray.reduce(
            (prevValue: string, currentValue: string, index: number) => {
                let idName: string = Types.IdentityType.getIdentityName(index);
                return `${prevValue}${idName}=${currentValue};`;
            },
            cacheKey
        );
    }

    return concatenatedIdentities;
};

export const shouldCallIdentity = (
    method: string,
    proposedUserIdentities: IKnownIdentities,
    idCache: LocalStorageVault<Dictionary>
): Boolean => {
    const cache = idCache.retrieve();

    if (!cache) {
        return true;
    }

    const cacheKey: string = concatenateIdentities(
        method,
        proposedUserIdentities
    );

    if (cache.hasOwnProperty(cacheKey)) {
        const expireTimestamp = cache[cacheKey].expireTimestamp;
        if (expireTimestamp > new Date().getTime()) return false;
    }

    return true;
};

export const createKnownIdentities = (
    identityApiData: IdentityApiData,
    deviceId: string
): IKnownIdentities => {
    var identitiesResult: IKnownIdentities = {};

    if (
        identityApiData &&
        identityApiData.userIdentities &&
        isObject(identityApiData.userIdentities)
    ) {
        for (var identity in identityApiData.userIdentities) {
            identitiesResult[identity] =
                identityApiData.userIdentities[identity];
        }
    }
    identitiesResult.device_application_stamp = deviceId;

    return identitiesResult;
};
