import { Dictionary, Environment } from './utils';
import { BaseVault } from './vault';
import { IdentityApiData, UserIdentities, IdentityCallback } from '@mparticle/web-sdk';
import { IdentityAPIMethod } from './identity.interfaces';
import { IIdentityResponse, IMParticleUser } from './identity-user-interfaces';
import { IStore } from './store';
import type { IMParticleWebSDKInstance } from './mp-instance';
import { IIdentitySearchRequestBody, IdentitySearchCallback } from './identity/search';
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
/**
 * Builds the /v1/identify-style envelope (client_sdk, environment,
 * request_id, request_timestamp_ms) used to correlate IDSync requests
 * across endpoints. `known_identities` is omitted so the caller can
 * fold in the search-specific identifiers alongside the envelope.
 */
export declare const buildIdentitySearchEnvelope: (environment: Environment) => Omit<IIdentitySearchRequestBody, 'known_identities'>;
/**
 * Wires the SDK instance into `sendSearchRequest`: gates on `canLog`,
 * builds the `/v1/search` URL and request envelope, and dispatches.
 * Lives here so the SDK glue (URL building, opt-out gate, dispatcher
 * plumbing) is type-checked instead of being expressed in plain JS.
 */
export declare const executeSearchRequest: (mpInstance: IMParticleWebSDKInstance, workspaceApiKey: string, knownIdentities: UserIdentities, callback: IdentitySearchCallback) => void;
