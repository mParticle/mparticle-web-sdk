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
import { IdentityResultBody } from './identity-user-interfaces';

const { Identify, Modify, Login, Logout } = Constants.IdentityMethods;
const CACHE_HEADER = 'x-mp-max-age';

export interface IIdentityResponse {
    status: number;
    responseBody: IdentityResultBody;
    cacheMaxAge: number; // Default: 86400
}

export type IdentityCache = BaseVault<Dictionary<ICachedIdentityCall>>;

export type IParseCachedIdentityResponse = (
    cachedIdentity: ICachedIdentityCall,
    mpid: string,
    callback: IdentityCallback,
    identityApiData: IdentityApiData,
    identityMethod: string,
    knownIdentities: IKnownIdentities,
    fromCachedIdentity: boolean
) => void;

export interface IKnownIdentities extends UserIdentities {
    device_application_stamp?: string;
}

export interface ICachedIdentityCall {
    responseBody: string;
    status: number;
    expireTimestamp: number;
}

// https://go.mparticle.com/work/SQDSDKS-6568
// Temporary adapter to convert the xhr response to the IIdentityResponse interface
export const xhrIdentityResponseAdapter = (
    xhr: XMLHttpRequest
): IIdentityResponse => {
    return {
        status: xhr.status,
        responseBody: JSON.parse(xhr.responseText),
        cacheMaxAge: parseNumber(xhr.getResponseHeader(CACHE_HEADER)),
    };
};

// https://go.mparticle.com/work/SQDSDKS-6568
// Temporary adapter to convert the IIdentityResponse or xhr object to a response body
export const identityResponseXhrAdapter = (
    identityResponse: IIdentityResponse | XMLHttpRequest
): IdentityResultBody => {
    if ('responseText' in identityResponse) {
        // XHR object returns responseText as a string and must be parsed
        return JSON.parse(identityResponse.responseText);
    }
    if ('responseBody' in identityResponse) {
        // a cached response body will be a string and must be parsed
        return JSON.parse(
            identityResponse.responseBody as unknown as string
        ) as IdentityResultBody;
    }
    return null;
};

export const cacheOrClearIdCache = (
    method: string,
    knownIdentities: IKnownIdentities,
    idCache: BaseVault<Dictionary<ICachedIdentityCall>>,
    identityResponse: IIdentityResponse,
    parsingCachedResponse: boolean
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
                identityResponse
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
    identityResponse: IIdentityResponse
): void => {
    const { responseBody, status } = identityResponse;
    const cache: Dictionary<ICachedIdentityCall> =
        idCache.retrieve() || ({} as Dictionary<ICachedIdentityCall>);
    const cacheKey = concatenateIdentities(method, identities);
    const hashedKey = generateHash(cacheKey);

    const { mpid, is_logged_in } = responseBody;
    const cachedResponseBody = {
        mpid,
        is_logged_in,
    };

    cache[hashedKey] = {
        responseBody: JSON.stringify(cachedResponseBody),
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
    userIdentities: IKnownIdentities
): string => {
    const DEVICE_APPLICATION_STAMP = 'device_application_stamp';
    // set DAS first since it is not an official identity type
    let cacheKey: string = `${method}:${DEVICE_APPLICATION_STAMP}=${userIdentities.device_application_stamp};`;
    const idLength: number = Object.keys(userIdentities).length;
    let concatenatedIdentities: string = '';

    if (idLength) {
        let userIDArray: Array<string> = new Array();
        // create an array where each index is equal to the user identity type
        for (let key in userIdentities) {
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
            cacheKey
        );
    }

    return concatenatedIdentities;
};

export const hasValidCachedIdentity = (
    method: IdentityAPIMethod,
    proposedUserIdentities: IKnownIdentities,
    idCache?: IdentityCache
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
        proposedUserIdentities
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
    idCache: IdentityCache
): ICachedIdentityCall | null => {
    const cacheKey: string = concatenateIdentities(
        method,
        proposedUserIdentities
    );
    const hashedKey = generateHash(cacheKey);

    const cache = idCache.retrieve();
    const cachedIdentity = cache ? cache[hashedKey] : null;

    return cachedIdentity;
};

// https://go.mparticle.com/work/SQDSDKS-6079
export const createKnownIdentities = (
    identityApiData: IdentityApiData,
    deviceId: string
): IKnownIdentities => {
    const identitiesResult: IKnownIdentities = {};

    if (isObject(identityApiData?.userIdentities)) {
        for (let identity in identityApiData.userIdentities) {
            identitiesResult[identity] =
                identityApiData.userIdentities[identity];
        }
    }
    identitiesResult.device_application_stamp = deviceId;

    return identitiesResult;
};

export const removeExpiredIdentityCacheDates = (
    idCache: BaseVault<Dictionary<ICachedIdentityCall>>
) => {
    const cache: Dictionary<ICachedIdentityCall> =
        idCache.retrieve() || ({} as Dictionary<ICachedIdentityCall>);

    const currentTime: number = new Date().getTime();

    // Iterate over the cache and remove any key/value pairs that are expired
    for (let key in cache) {
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
    identityMethod: IdentityAPIMethod
): boolean => {
    // https://go.mparticle.com/work/SQDSDKS-6095
    const shouldReturnCachedIdentity = hasValidCachedIdentity(
        identityMethod,
        knownIdentities,
        idCache
    );

    // If Identity is cached, then immediately parse the identity response
    if (shouldReturnCachedIdentity) {
        const cachedIdentity = getCachedIdentity(
            identityMethod,
            knownIdentities,
            idCache
        );

        parseIdentityResponse(
            cachedIdentity,
            mpid,
            callback,
            identityApiData,
            identityMethod,
            knownIdentities,
            true
        );

        return true;
    }
    return false;
};

const getExpireTimestamp = (maxAge: number = ONE_DAY_IN_SECONDS): number =>
    new Date().getTime() + maxAge * MILLIS_IN_ONE_SEC;
