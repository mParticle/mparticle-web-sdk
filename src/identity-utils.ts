import { Dictionary } from './utils';
import { LocalStorageVault } from './vault';
import Types from './types';
import { IdentityApiData, UserIdentities } from '@mparticle/web-sdk';
import { isObject } from './utils';
import { MParticleWebSDK } from './sdkRuntimeModels';

export interface IKnownIdentities extends UserIdentities {
    device_application_stamp?: string;
}

export interface ICachedIdentityCall extends UserIdentities {
    responseText: string;
    status: number;
    expireTimestamp: number;
}

export const cacheIdentityRequest = (
    method: string,
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
    method: string,
    userIdentities: IKnownIdentities
): string => {
    // set DAS first since it is not an official identity type
    let cacheKey: string = `${method}:device_application_stamp=${userIdentities.device_application_stamp};`;
    const idLength: number = Object.keys(userIdentities).length;
    let concatenatedIdentities: string = '';

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

export const getCachedIdentity = (
    method: string,
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

// export const parseCachedIdentityResponse = (
//     cachedIdentity: ICachedIdentityCall,
//     previousMPID: string,
//     callback,
//     // identityApiData,
//     // method,
//     // knownIdentities,
//     mpInstance: MParticleWebSDK
// ) {
//     var prevUser = mpInstance.Identity.getUser(previousMPID),
//         newUser,
//         mpidIsNotInCookies,
//         identityApiResult,
//         indexOfMPID,
//         newIdentitiesByType = {},
//         previousUIByName = prevUser
//             ? prevUser.getUserIdentities().userIdentities
//             : {},
//         previousUIByNameCopy = mpInstance._Helpers.extend(
//             {},
//             previousUIByName
//         );
//     // mpInstance._Store.identityCallInFlight = false;

//     mpInstance._Store.isLoggedIn = cachedIdentity.isLoggedIn;

//         // set currentUser
//         if (
//             !prevUser ||
//             (prevUser.getMPID() &&
//                 identityApiResult.mpid &&
//                 identityApiResult.mpid !== prevUser.getMPID())
//         ) {
//             mpInstance._Store.mpid = identityApiResult.mpid;

//             if (prevUser) {
//                 mpInstance._Persistence.setLastSeenTime(previousMPID);
//             }

//             if (
//                 !mpInstance._Persistence.getFirstSeenTime(
//                     identityApiResult.mpid
//                 )
//             )
//                 mpidIsNotInCookies = true;
//             mpInstance._Persistence.setFirstSeenTime(
//                 identityApiResult.mpid
//             );
//         }

//         if (xhr.status === 200) {
//             // const CACHE_HEADER = 'X-MP-Max-Age';
//             // const idCacheTimeout = xhr.getAllResponseHeaders();
//             // magic code to get CACHE_HEADER
//             const oneDayInMS = 86400 * 60 * 60 * 24;
//             const timeout = new Date().getTime() + oneDayInMS;

//             if (method === 'login' || method === 'identify') {
//                 cacheIdentityRequest(
//                     method,
//                     knownIdentities,
//                     identityApiResult.mpid,
//                     timeout,
//                     self.idCache
//                 );
//             }

//             if (method === 'modify') {
//                 newIdentitiesByType = mpInstance._Identity.IdentityRequest.combineUserIdentities(
//                     previousUIByName,
//                     identityApiData.userIdentities
//                 );

//                 mpInstance._Persistence.saveUserIdentitiesToPersistence(
//                     previousMPID,
//                     newIdentitiesByType
//                 );
//             } else {
//                 var incomingUser = self.IdentityAPI.getUser(
//                     identityApiResult.mpid
//                 );

//                 var incomingMpidUIByName = incomingUser
//                     ? incomingUser.getUserIdentities().userIdentities
//                     : {};

//                 var incomingMpidUIByNameCopy = mpInstance._Helpers.extend(
//                     {},
//                     incomingMpidUIByName
//                 );
//                 mpInstance.Logger.verbose(
//                     'Successfully parsed Identity Response'
//                 );

//                 //this covers an edge case where, users stored before "firstSeenTime" was introduced
//                 //will not have a value for "fst" until the current MPID changes, and in some cases,
//                 //the current MPID will never change
//                 if (
//                     method === 'identify' &&
//                     prevUser &&
//                     identityApiResult.mpid === prevUser.getMPID()
//                 ) {
//                     mpInstance._Persistence.setFirstSeenTime(
//                         identityApiResult.mpid
//                     );
//                 }

//                 indexOfMPID = mpInstance._Store.currentSessionMPIDs.indexOf(
//                     identityApiResult.mpid
//                 );

//                 if (
//                     mpInstance._Store.sessionId &&
//                     identityApiResult.mpid &&
//                     previousMPID !== identityApiResult.mpid &&
//                     indexOfMPID < 0
//                 ) {
//                     mpInstance._Store.currentSessionMPIDs.push(
//                         identityApiResult.mpid
//                     );
//                 }

//                 if (indexOfMPID > -1) {
//                     mpInstance._Store.currentSessionMPIDs = mpInstance._Store.currentSessionMPIDs
//                         .slice(0, indexOfMPID)
//                         .concat(
//                             mpInstance._Store.currentSessionMPIDs.slice(
//                                 indexOfMPID + 1,
//                                 mpInstance._Store.currentSessionMPIDs
//                                     .length
//                             )
//                         );
//                     mpInstance._Store.currentSessionMPIDs.push(
//                         identityApiResult.mpid
//                     );
//                 }

//                 mpInstance._CookieSyncManager.attemptCookieSync(
//                     previousMPID,
//                     identityApiResult.mpid,
//                     mpidIsNotInCookies
//                 );

//                 self.checkIdentitySwap(
//                     previousMPID,
//                     identityApiResult.mpid,
//                     mpInstance._Store.currentSessionMPIDs
//                 );

//                 if (
//                     identityApiData &&
//                     identityApiData.userIdentities &&
//                     Object.keys(identityApiData.userIdentities).length
//                 ) {
//                     newIdentitiesByType = self.IdentityRequest.combineUserIdentities(
//                         incomingMpidUIByName,
//                         identityApiData.userIdentities
//                     );
//                 }

//                 mpInstance._Persistence.saveUserIdentitiesToPersistence(
//                     identityApiResult.mpid,
//                     newIdentitiesByType
//                 );
//                 mpInstance._Persistence.update();

//                 mpInstance._Persistence.findPrevCookiesBasedOnUI(
//                     identityApiData
//                 );

//                 mpInstance._Store.context =
//                     identityApiResult.context ||
//                     mpInstance._Store.context;
//             }

//             newUser = mpInstance.Identity.getCurrentUser();

//             if (
//                 identityApiData &&
//                 identityApiData.onUserAlias &&
//                 mpInstance._Helpers.Validators.isFunction(
//                     identityApiData.onUserAlias
//                 )
//             ) {
//                 try {
//                     mpInstance.Logger.warning(
//                         'Deprecated function onUserAlias will be removed in future releases'
//                     );
//                     identityApiData.onUserAlias(prevUser, newUser);
//                 } catch (e) {
//                     mpInstance.Logger.error(
//                         'There was an error with your onUserAlias function - ' +
//                             e
//                     );
//                 }
//             }
//             var persistence = mpInstance._Persistence.getPersistence();

//             if (newUser) {
//                 mpInstance._Persistence.storeDataInMemory(
//                     persistence,
//                     newUser.getMPID()
//                 );
//                 if (
//                     !prevUser ||
//                     newUser.getMPID() !== prevUser.getMPID() ||
//                     prevUser.isLoggedIn() !== newUser.isLoggedIn()
//                 ) {
//                     mpInstance._Forwarders.initForwarders(
//                         newUser.getUserIdentities().userIdentities,
//                         mpInstance._APIClient.prepareForwardingStats
//                     );
//                 }
//                 mpInstance._Forwarders.setForwarderUserIdentities(
//                     newUser.getUserIdentities().userIdentities
//                 );
//                 mpInstance._Forwarders.setForwarderOnIdentityComplete(
//                     newUser,
//                     method
//                 );
//                 mpInstance._Forwarders.setForwarderOnUserIdentified(
//                     newUser,
//                     method
//                 );
//             }
//             var newIdentitiesByName = {};

//             for (var key in newIdentitiesByType) {
//                 newIdentitiesByName[
//                     Types.IdentityType.getIdentityName(
//                         mpInstance._Helpers.parseNumber(key)
//                     )
//                 ] = newIdentitiesByType[key];
//             }

//             self.sendUserIdentityChangeEvent(
//                 newIdentitiesByName,
//                 method,
//                 identityApiResult.mpid,
//                 method === 'modify'
//                     ? previousUIByNameCopy
//                     : incomingMpidUIByNameCopy
//             );
//         }

//         if (callback) {
//             if (xhr.status === 0) {
//                 mpInstance._Helpers.invokeCallback(
//                     callback,
//                     HTTPCodes.noHttpCoverage,
//                     identityApiResult || null,
//                     newUser
//                 );
//             } else {
//                 mpInstance._Helpers.invokeCallback(
//                     callback,
//                     xhr.status,
//                     identityApiResult || null,
//                     newUser
//                 );
//             }
//         } else {
//             if (
//                 identityApiResult &&
//                 identityApiResult.errors &&
//                 identityApiResult.errors.length
//             ) {
//                 mpInstance.Logger.error(
//                     'Received HTTP response code of ' +
//                         xhr.status +
//                         ' - ' +
//                         identityApiResult.errors[0].message
//                 );
//             }
//         }

//         mpInstance._APIClient.processQueuedEvents();
//     } catch (e) {
//         if (callback) {
//             mpInstance._Helpers.invokeCallback(
//                 callback,
//                 xhr.status,
//                 identityApiResult || null
//             );
//         }
//         mpInstance.Logger.error(
//             'Error parsing JSON response from Identity server: ' + e
//         );
//     }
// };
