import Constants, { ONE_DAY_IN_SECONDS, MILLIS_IN_ONE_SEC } from './constants';
import { Dictionary, parseNumber, isObject, generateHash } from './utils';
import { BaseVault } from './vault';
import Types from './types';
import {
    IdentityApiData,
    UserIdentities,
    IdentityCallback,
} from '@mparticle/web-sdk';
import { IdentityAPIMethod } from './identity.interfaces';
import {
    IdentityResultBody,
    IIdentityResponse,
} from './identity-user-interfaces';

const { Identify, Modify, Login, Logout } = Constants.IdentityMethods;
export const CACHE_HEADER = 'x-mp-max-age' as const;

export type IdentityCache = BaseVault<Dictionary<ICachedIdentityCall>>;

// https://go.mparticle.com/work/SQDSDKS-6675
export type IParseCachedIdentityResponse = (
    cachedIdentity: IIdentityResponse,
    mpid: string,
    callback: IdentityCallback,
    identityApiData: IdentityApiData,
    identityMethod: string,
    knownIdentities: IKnownIdentities,
    fromCachedIdentity: boolean,
) => void;

export interface IKnownIdentities extends UserIdentities {
    device_application_stamp?: string;
}

export interface ICachedIdentityCall {
    // https://go.mparticle.com/work/SQDSDKS-6672
    responseText: string;
    status: number;
    expireTimestamp: number;
}

export const cacheOrClearIdCache = (
    method: string,
    knownIdentities: IKnownIdentities,
    idCache: BaseVault<Dictionary<ICachedIdentityCall>>,
    identityResponse: IIdentityResponse,
    parsingCachedResponse: boolean,
): void => {
    // when parsing a response that has already been cached, simply return instead of attempting another cache
    if (parsingCachedResponse) {
        return;
    }

    // default the expire timestamp to one day in milliseconds unless a header comes back
    const expireTimestamp = getExpireTimestamp(identityResponse?.cacheMaxAge);

    switch (method) {
        case Login:
        case Identify:
            cacheIdentityRequest(
                method,
                knownIdentities,
                expireTimestamp,
                idCache,
                identityResponse,
            );
            break;
        case Modify:
        case Logout:
            idCache.purge();
            break;
    }
};

export const cacheIdentityRequest = (
    method: IdentityAPIMethod,
    identities: IKnownIdentities,
    expireTimestamp: number,
    idCache: IdentityCache,
    identityResponse: IIdentityResponse,
): void => {
    const { responseText, status } = identityResponse;
    const cache: Dictionary<ICachedIdentityCall> =
        idCache.retrieve() || ({} as Dictionary<ICachedIdentityCall>);
    const cacheKey = concatenateIdentities(method, identities);
    const hashedKey = generateHash(cacheKey);

    const { mpid, is_logged_in } = responseText;
    const cachedResponseBody = {
        mpid,
        is_logged_in,
    };

    cache[hashedKey] = {
        responseText: JSON.stringify(cachedResponseBody),
        status,
        expireTimestamp,
    };
    idCache.store(cache);
};

// We need to ensure that identities are concatenated in a deterministic way, so
// we sort the identities based on their enum.
// we create an array, set the user identity at the index of the user identity type
export const concatenateIdentities = (
    method: IdentityAPIMethod,
    userIdentities: IKnownIdentities,
): string => {
    const DEVICE_APPLICATION_STAMP = 'device_application_stamp';
    // set DAS first since it is not an official identity type
    const cacheKey = `${method}:${DEVICE_APPLICATION_STAMP}=${userIdentities.device_application_stamp};`;
    const idLength: number = Object.keys(userIdentities).length;
    let concatenatedIdentities = '';

    if (idLength) {
        const userIDArray: Array<string> = [];
        // create an array where each index is equal to the user identity type
        for (const key in userIdentities) {
            if (key === DEVICE_APPLICATION_STAMP) {
                continue;
            } else {
                userIDArray[Types.IdentityType.getIdentityType(key)] =
                    userIdentities[key];
            }
        }

        concatenatedIdentities = userIDArray.reduce(
            (prevValue: string, currentValue: string, index: number) => {
                const idName: string =
                    Types.IdentityType.getIdentityName(index);
                return `${prevValue}${idName}=${currentValue};`;
            },
            cacheKey,
        );
    }

    return concatenatedIdentities;
};

export const hasValidCachedIdentity = (
    method: IdentityAPIMethod,
    proposedUserIdentities: IKnownIdentities,
    idCache?: IdentityCache,
): boolean => {
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
        proposedUserIdentities,
    );
    const hashedKey = generateHash(cacheKey);

    // if cache doesn't have the cacheKey, there is no valid cached identity
    if (!cache.hasOwnProperty(hashedKey)) {
        return false;
    }

    // If there is a valid cache key, compare the expireTimestamp to the current time.
    // If the current time is greater than the expireTimestamp, it is not a valid
    // cached identity.
    const expireTimestamp = cache[hashedKey].expireTimestamp;

    if (expireTimestamp < new Date().getTime()) {
        return false;
    } else {
        return true;
    }
};

export const getCachedIdentity = (
    method: IdentityAPIMethod,
    proposedUserIdentities: IKnownIdentities,
    idCache: IdentityCache,
): IIdentityResponse | null => {
    const cacheKey: string = concatenateIdentities(
        method,
        proposedUserIdentities,
    );
    const hashedKey = generateHash(cacheKey);

    const cache = idCache.retrieve();
    const cachedIdentity = cache ? cache[hashedKey] : null;

    return {
        responseText: parseIdentityResponse(cachedIdentity.responseText),
        expireTimestamp: cachedIdentity.expireTimestamp,
        status: cachedIdentity.status,
    };
};

// https://go.mparticle.com/work/SQDSDKS-6079
export const createKnownIdentities = (
    identityApiData: IdentityApiData,
    deviceId: string,
): IKnownIdentities => {
    const identitiesResult: IKnownIdentities = {};

    if (isObject(identityApiData?.userIdentities)) {
        for (const identity in identityApiData.userIdentities) {
            identitiesResult[identity] =
                identityApiData.userIdentities[identity];
        }
    }
    identitiesResult.device_application_stamp = deviceId;

    return identitiesResult;
};

export const removeExpiredIdentityCacheDates = (
    idCache: BaseVault<Dictionary<ICachedIdentityCall>>,
) => {
    const cache: Dictionary<ICachedIdentityCall> =
        idCache.retrieve() || ({} as Dictionary<ICachedIdentityCall>);

    const currentTime: number = new Date().getTime();

    // Iterate over the cache and remove any key/value pairs that are expired
    for (const key in cache) {
        if (cache[key].expireTimestamp < currentTime) {
            delete cache[key];
        }
    }

    idCache.store(cache);
};

export const tryCacheIdentity = (
    knownIdentities: IKnownIdentities,
    idCache: IdentityCache,
    parseIdentityResponse: IParseCachedIdentityResponse,
    mpid: string,
    callback: IdentityCallback,
    identityApiData: IdentityApiData,
    identityMethod: IdentityAPIMethod,
): boolean => {
    // https://go.mparticle.com/work/SQDSDKS-6095
    const shouldReturnCachedIdentity = hasValidCachedIdentity(
        identityMethod,
        knownIdentities,
        idCache,
    );

    // If Identity is cached, then immediately parse the identity response
    if (shouldReturnCachedIdentity) {
        const cachedIdentity = getCachedIdentity(
            identityMethod,
            knownIdentities,
            idCache,
        );

        parseIdentityResponse(
            cachedIdentity,
            mpid,
            callback,
            identityApiData,
            identityMethod,
            knownIdentities,
            true,
        );

        return true;
    }
    return false;
};

const getExpireTimestamp = (maxAge: number = ONE_DAY_IN_SECONDS): number =>
    new Date().getTime() + maxAge * MILLIS_IN_ONE_SEC;

const parseIdentityResponse = (responseText: string): IdentityResultBody =>
    responseText ? JSON.parse(responseText) : ({} as IdentityResultBody);
