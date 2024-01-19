import Constants from './constants';
import { Dictionary, parseNumber } from './utils';
import { LocalStorageVault } from './vault';
import Types from './types';
import { IdentityApiData, UserIdentities } from '@mparticle/web-sdk';
import { IdentityAPIMethod } from './validators';
import { isObject } from './utils';
const { Identify, Modify, Login, Logout } = Constants.IdentityMethods;
import { MParticleWebSDK } from './sdkRuntimeModels';

const CACHE_HEADER = 'x-mp-max-age';
const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
const MILLIS_IN_ONE_SEC = 1000;
export interface IKnownIdentities extends UserIdentities {
    device_application_stamp?: string;
}

export interface ICachedIdentityCall extends UserIdentities {
    responseText: string;
    status: number;
    expireTimestamp: number;
}

export const cacheOrClearIdCache = (
    method: string,
    knownIdentities: IKnownIdentities,
    idCache: LocalStorageVault<Dictionary>,
    xhr: XMLHttpRequest
): void => {
    // default the expire timestamp to one day in milliseconds unless a header comes back
    let expireTimestamp = new Date().getTime() + ONE_DAY_IN_SECONDS * MILLIS_IN_ONE_SEC;

    if (xhr.getAllResponseHeaders().includes(CACHE_HEADER)) {
        expireTimestamp =
            parseNumber(xhr.getResponseHeader(CACHE_HEADER)) * MILLIS_IN_ONE_SEC;
    }

    switch (method) {
        case Login: 
        case Identify: 
            cacheIdentityRequest(
                method,
                knownIdentities,
                expireTimestamp,
                idCache,
                xhr 
            );
            break;
        case Modify:
        case Logout:
            idCache.purge();
            break;
    }
}

export const cacheIdentityRequest = (
    method: IdentityAPIMethod,
    identities: IKnownIdentities,
    expireTimestamp: number,
    idCache: LocalStorageVault<Dictionary>,
    xhr: XMLHttpRequest
): void => {
    let cache: Dictionary<ICachedIdentityCall> = idCache.retrieve() || {};
    let cacheKey = concatenateIdentities(method, identities);

    cache[cacheKey] = { responseText: xhr.responseText, status: xhr.status, expireTimestamp};
    idCache.store(cache);
};

// We need to ensure that identities are concatenated in a deterministic way, so
// we sort the identities based on their enum.
// we create an array, set the user identity at the index of the user identity type
export const concatenateIdentities = (
    method: IdentityAPIMethod,
    userIdentities: IKnownIdentities
): string => {
    // set DAS first since it is not an official identity type
    let cacheKey: string = `${method}:device_application_stamp=${userIdentities.device_application_stamp};`;
    const idLength: number = Object.keys(userIdentities).length;
    let concatenatedIdentities: string = '';

    if (idLength) {
        let userIDArray: Array<string> = new Array();
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

export const hasValidCachedIdentity = (
    method: IdentityAPIMethod,
    proposedUserIdentities: IKnownIdentities,
    idCache?: LocalStorageVault<Dictionary>
): Boolean => {
    // There is an edge case where multiple identity calls are taking place 
    // before identify fires, so there may not be a cache.  See what happens when 
    // the ? in idCache is removed to the following test
    // "queued events contain login mpid instead of identify mpid when calling 
    // login immediately after mParticle initializes"
    const cache = idCache?.retrieve();

    // if there is no cache, then there is no valid cached identity
    if (!cache) {
        return false;
    }

    const cacheKey: string = concatenateIdentities(
        method,
        proposedUserIdentities
    );

    // if cache doesn't have the cacheKey, there is no valid cached identity
    if (!cache.hasOwnProperty(cacheKey)) {
        return false;
    }
    
    // If there is a valid cache key, compare the expireTimestamp to the current time.
    // If the current time is greater than the expireTimestamp, it is not a valid
    // cached identity.
    const expireTimestamp = cache[cacheKey].expireTimestamp;
    
    if (expireTimestamp < new Date().getTime()) {
        return false;
    } else {
        return true;
    }
};

export const getCachedIdentity = (
    method: IdentityAPIMethod,
    proposedUserIdentities: IKnownIdentities,
    idCache: LocalStorageVault<Dictionary>
): Dictionary<string | number | boolean> | null => {
    const cacheKey: string = concatenateIdentities(
        method,
        proposedUserIdentities
    );

    const cache = idCache.retrieve();
    const cachedIdentity = cache ? cache[cacheKey] : null;

    return cachedIdentity;
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

export const removeExpiredIdentityCacheDates = (idCache: LocalStorageVault<Dictionary>): void => {
    const cache: Dictionary<ICachedIdentityCall> = idCache.retrieve() || {};

    idCache.purge();
    
    const currentTime:number = new Date().getTime();

    // Iterate over the cache and remove any key/value pairs that are expired
    for (let key in cache) {
        if (cache[key].expireTimestamp < currentTime) {
            delete cache[key];
        }
    };

    idCache.store(cache);
}