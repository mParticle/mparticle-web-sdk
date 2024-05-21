import { IdentityApiData, MPID, UserIdentities } from '@mparticle/web-sdk';
import AudienceManager from './audienceManager';
import { ICachedIdentityCall, IKnownIdentities } from './identity-utils';
import { BaseVault } from './vault';
import { Dictionary, Environment, valueof } from './utils';
import Constants from './constants';
import {
    IdentityCallback,
    IUserAttributeChangeEvent,
    IUserIdentityChangeEvent,
    IMParticleUser,
    mParticleUserCart,
} from './identity-user-interfaces';
const { platform, sdkVendor, sdkVersion, HTTPCodes } = Constants;

export type IdentityPreProcessResult = {
    valid: boolean;
    error?: string;
};

export type IdentityAPIMethod = valueof<typeof Constants.IdentityMethods>;

export enum SDKIdentityTypeEnum {
    other = 'other',
    customerId = 'customerid',
    facebook = 'facebook',
    twitter = 'twitter',
    google = 'google',
    microsoft = 'microsoft',
    yahoo = 'yahoo',
    email = 'email',
    alias = 'alias',
    facebookCustomAudienceId = 'facebookcustomaudienceid',
    otherId2 = 'other2',
    otherId3 = 'other3',
    otherId4 = 'other4',
    otherId5 = 'other5',
    otherId6 = 'other6',
    otherId7 = 'other7',
    otherId8 = 'other8',
    otherId9 = 'other9',
    otherId10 = 'other10',
    mobileNumber = 'mobile_number',
    phoneNumber2 = 'phone_number_2',
    phoneNumber3 = 'phone_number_3',
}

export interface IIdentityAPIRequestData {
    client_sdk: {
        platform: typeof platform;
        sdk_vendor: typeof sdkVendor;
        sdk_version: typeof sdkVersion;
    };
    context: string | null;
    environment: Environment;
    request_id: string;
    reqest_timestamp_unixtime_ms: number;
    previous_mpid: MPID | null;
    known_identities: IKnownIdentities;
}

export interface IIdentityAPIModifyRequestData
    extends Omit<
        IIdentityAPIRequestData,
        'known_identities' | 'previous_mpid'
    > {
    identity_changes: IIdentityAPIIdentityChangeData[];
}

export interface IIdentityAPIIdentityChangeData {
    identity_type: SDKIdentityTypeEnum;
    old_value: string;
    new_value: string;
}

export interface IIdentityRequest {
    combineUserIdentities(
        currentUserIdentities: UserIdentities,
        newUserIdentities: UserIdentities
    ): UserIdentities;
    createIdentityRequest(
        identityApiData: IdentityApiData,
        platform: string,
        sdkVendor: string,
        sdkVersion: string,
        deviceId: string,
        context: string | null,
        mpid: MPID
    ): IIdentityAPIRequestData;
    createModifyIdentityRequest(
        currentUserIdentities: UserIdentities,
        newUserIdentities: UserIdentities,
        platform: string,
        sdkVendor: string,
        sdkVersion: string,
        context: string | null
    ): IIdentityAPIModifyRequestData;
    createIdentityChanges(
        previousIdentities: UserIdentities,
        newIdentitie: UserIdentities
    ): IIdentityAPIIdentityChangeData;
    preProcessIdentityRequest(
        identityApiData: IdentityApiData,
        callback: IdentityCallback,
        method: IdentityAPIMethod
    ): IdentityPreProcessResult;
}

export interface IAliasRequest {
    destinationMpid: MPID;
    sourceMpid: MPID;
    startTime: number;
    endTime: number;
    scope?: string;
}

export interface SDKIdentityApi {
    HTTPCodes: typeof HTTPCodes;
    identify?(
        identityApiData?: IdentityApiData,
        callback?: IdentityCallback
    ): void;
    login?(
        identityApiData?: IdentityApiData,
        callback?: IdentityCallback
    ): void;
    logout?(
        identityApiData?: IdentityApiData,
        callback?: IdentityCallback
    ): void;
    modify?(
        identityApiData?: IdentityApiData,
        callback?: IdentityCallback
    ): void;
    getCurrentUser?(): IMParticleUser;
    getUser?(mpid: string): IMParticleUser;
    getUsers?(): IMParticleUser[];
    aliasUsers?(
        aliasRequest?: IAliasRequest,
        callback?: IdentityCallback
    ): void;
    createAliasRequest?(
        sourceUser: IMParticleUser,
        destinationUser: IMParticleUser
    ): IAliasRequest;
}

export interface IIdentity {
    audienceManager: AudienceManager;
    idCache: BaseVault<Dictionary<ICachedIdentityCall>>;

    IdentityAPI: SDKIdentityApi;
    IdentityRequest: IIdentityRequest;

    mParticleUser(mpid: MPID, IsLoggedIn: boolean): IMParticleUser;

    checkIdentitySwap(
        previousMPID: MPID,
        currentMPID: MPID,
        currentSessionMPIDs?: MPID[]
    ): void;
    createUserAttributeChange(
        key: string,
        newValue: string,
        previousUserAttributeValue: string,
        isNewAttribute: boolean,
        deleted: boolean,
        user: IMParticleUser
    ): IUserAttributeChangeEvent;
    createUserIdentityChange(
        identityType: SDKIdentityTypeEnum,
        newIdentity: string,
        oldIdentity: string,
        newCreatedThisBatch: boolean,
        userInMemory: IMParticleUser
    ): IUserIdentityChangeEvent;
    parseIdentityResponse(
        xhr: XMLHttpRequest,
        previousMPID: MPID,
        callback: IdentityCallback,
        identityApiData: IdentityApiData,
        method: IdentityAPIMethod,
        knownIdentities: UserIdentities,
        parsingCachedResponse: boolean
    ): void;
    sendUserAttributeChangeEvent(
        attributeKey: string,
        newUserAttributeValue: string,
        previousUserAttributeValue: string,
        isNewAttribute: boolean,
        deleted: boolean,
        user: IMParticleUser
    ): void;
    sendUserIdentityChangeEvent(
        newUserIdentities: UserIdentities,
        method: IdentityAPIMethod,
        mpid: MPID,
        prevUserIdentities: UserIdentities
    ): void;

    /**
     * @deprecated
     */
    mParticleUserCart(mpid: MPID): mParticleUserCart;
}
