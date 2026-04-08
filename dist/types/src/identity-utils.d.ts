import { Dictionary } from './utils';
import { BaseVault } from './vault';
import { IdentityApiData, UserIdentities, IdentityCallback } from '@mparticle/web-sdk';
import { IdentityAPIMethod } from './identity.interfaces';
import { IIdentityResponse, IMParticleUser } from './identity-user-interfaces';
import { IStore } from './store';
export declare const CACHE_HEADER: "x-mp-max-age";
export type IdentityCache = BaseVault<Dictionary<ICachedIdentityCall>>;
export type IParseCachedIdentityResponse = (cachedIdentity: IIdentityResponse, mpid: string, callback: IdentityCallback, identityApiData: IdentityApiData, identityMethod: string, knownIdentities: IKnownIdentities, fromCachedIdentity: boolean) => void;
export interface IKnownIdentities extends UserIdentities {
    device_application_stamp?: string;
}
export interface ICachedIdentityCall {
    responseText: string;
    status: number;
    expireTimestamp: number;
}
export declare const cacheOrClearIdCache: (method: string, knownIdentities: IKnownIdentities, idCache: BaseVault<Dictionary<ICachedIdentityCall>>, identityResponse: IIdentityResponse, parsingCachedResponse: boolean) => void;
export declare const cacheIdentityRequest: (method: IdentityAPIMethod, identities: IKnownIdentities, expireTimestamp: number, idCache: IdentityCache, identityResponse: IIdentityResponse) => void;
export declare const concatenateIdentities: (method: IdentityAPIMethod, userIdentities: IKnownIdentities) => string;
export declare const hasValidCachedIdentity: (method: IdentityAPIMethod, proposedUserIdentities: IKnownIdentities, idCache?: IdentityCache) => boolean;
export declare const getCachedIdentity: (method: IdentityAPIMethod, proposedUserIdentities: IKnownIdentities, idCache: IdentityCache) => IIdentityResponse | null;
export declare const createKnownIdentities: (identityApiData: IdentityApiData, deviceId: string) => IKnownIdentities;
export declare const removeExpiredIdentityCacheDates: (idCache: BaseVault<Dictionary<ICachedIdentityCall>>) => void;
export declare const tryCacheIdentity: (knownIdentities: IKnownIdentities, idCache: IdentityCache, parseIdentityResponse: IParseCachedIdentityResponse, mpid: string, callback: IdentityCallback, identityApiData: IdentityApiData, identityMethod: IdentityAPIMethod) => boolean;
export declare const hasIdentityRequestChanged: (currentUser: IMParticleUser, newIdentityRequest: IdentityApiData) => boolean;
/**
 * Checks if deviceId or other user identifiers (like email) were explicitly provided
 * by the partner via config.deviceId or config.identifyRequest.userIdentities.
 * When noFunctional is true, then cookies are blocked, so the partner must explicitly
 * pass deviceId or other identifiers to prevent new users from being created on each page load.
 *
 * @param store - The SDK store (provides SDKConfig.deviceId and SDKConfig.identifyRequest.userIdentities)
 * @returns true if deviceId or other identifiers were explicitly provided in config, false otherwise
 */
export declare const hasExplicitIdentifier: (store: IStore | undefined | null) => boolean;
