import {
    AllUserAttributes,
    ConsentState,
    IdentityApiData,
    IdentityCallback,
    Product,
} from '@mparticle/web-sdk';
import { SDKIdentityTypeEnum } from './identity.interfaces';
import { MessageType } from './types.interfaces';
import { BaseEvent } from './sdkRuntimeModels';

// https://go.mparticle.com/work/SQDSDKS-5033
// https://go.mparticle.com/work/SQDSDKS-6354
export interface MParticleUser {
    getMPID?(): string;
    getConsentState?(): ConsentState;
    setConsentState?(consentState: ConsentState): void;
    getAllUserAttributes?(): any;
    setUserAttribute?(key: string, value: any): void;
    setUserAttributeList?(key: string, value: any): void;
    setUserAttributes?(userAttributes: UserAttributes): void;
    getUserAudiences?(callback?: IdentityCallback): void;
    getUserIdentities?(): IdentityApiData;
    setUserTag?(tagName: string, value?: any): void;
}

export interface SDKUserIdentity {
    Identity?: string;
    Type: number;
}

export interface ISDKUserIdentityChanges {
    New: ISDKUserIdentityChangeData;
    Old: ISDKUserIdentityChangeData;
}

export interface ISDKUserIdentityChangeData {
    IdentityType: SDKIdentityTypeEnum;
    Identity: string;
    CreatedThisBatch: boolean;
    Timestamp?: number;
}

export interface IUserIdentityChangeEvent extends BaseEvent {
    messageType: MessageType.UserIdentityChange;
    userIdentityChanges: ISDKUserIdentityChanges;
}

export interface ISDKUserAttributeChangeData {
    UserAttributeName: string;
    New: string;
    Old: string;
    Deleted: boolean;
    IsNewAttribute: boolean;
}

export interface IUserAttributeChangeEvent extends BaseEvent {
    messageType: MessageType.UserAttributeChange;
    userAttributeChanges: ISDKUserAttributeChangeData;
}

export interface mParticleUserCart {
    add(product: Product, logEvent: boolean): void;
    remove(product: Product, logEvent: boolean): void;
    clear(): void;
    getCartProducts(): Product[];
}

export interface SDKUserIdentity {
    Identity?: string;
    Type: number;
}

// https://go.mparticle.com/work/SQDSDKS-5196
export type UserAttributes = AllUserAttributes;
