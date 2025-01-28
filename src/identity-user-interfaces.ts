import { AllUserAttributes, MPID, Product, User } from '@mparticle/web-sdk';
import { SDKIdentityTypeEnum } from './identity.interfaces';
import { MessageType } from './types';
import { BaseEvent, SDKProduct } from './sdkRuntimeModels';
import Constants from './constants';
const { HTTPCodes } = Constants;

// Cart is Deprecated and private to mParticle user in @mparticle/web-sdk
// but we need to expose it here for type safety in some of our tests
interface ICart {
    /**
     * @deprecated Cart persistence in mParticle has been deprecated. Please use mParticle.eCommerce.logProductAction(mParticle.ProductActionType.AddToCart, [products])
     */
    add: (product: SDKProduct, logEventBoolean?: boolean) => void;
    /**
     * @deprecated Cart persistence in mParticle has been deprecated. Please use mParticle.eCommerce.logProductAction(mParticle.ProductActionType.RemoveFromCart, [products])
     */
    remove: (product: SDKProduct, logEventBoolean?: boolean) => void;
    /**
     * @deprecated Cart persistence in mParticle has been deprecated.
     */
    clear: () => void;
    /**
     * @deprecated Cart Products have been deprecated
     */
    getCartProducts: () => SDKProduct[];
}

// https://go.mparticle.com/work/SQDSDKS-5033
// https://go.mparticle.com/work/SQDSDKS-6354
export interface IMParticleUser extends User {
    getAllUserAttributes(): any;
    setUserTag(tagName: string, value?: any): void;
    setUserAttribute(key: string, value: any): void;
    getUserAudiences?(callback?: IdentityCallback): void;
    /*
     * @deprecated
     */
    getCart(): ICart;
}

export interface ISDKUserIdentity {
    Identity: string;
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
    // https://go.mparticle.com/work/SQDSDKS-6438
    Timestamp?: number;
}

export interface IUserIdentityChangeEvent extends BaseEvent {
    messageType: typeof MessageType.UserIdentityChange;
    userIdentityChanges: ISDKUserIdentityChanges;
}

export interface ISDKUserAttributes {
    [key: string]: string | string[] | null;
}

export interface ISDKUserAttributeChangeData {
    UserAttributeName: string;
    New: string;
    Old: string;
    Deleted: boolean;
    IsNewAttribute: boolean;
}

export interface IUserAttributeChangeEvent extends BaseEvent {
    messageType: typeof MessageType.UserAttributeChange;
    userAttributeChanges: ISDKUserAttributeChangeData;
}

// https://go.mparticle.com/work/SQDSDKS-6460
export interface IdentityCallback {
    (result: IdentityResult): void;
}

export interface IIdentityResponse {
    // https://go.mparticle.com/work/SQDSDKS-6672
    responseText: IdentityResultBody;
    status: number;
    cacheMaxAge?: number; // Default: 86400
    expireTimestamp?: number;
}

export interface IdentityResult {
    httpCode: typeof HTTPCodes;
    getPreviousUser(): User;
    getUser(): User;
    body: IdentityResultBody | IdentityModifyResultBody;
}

export interface IdentityResultBody {
    context: string | null;
    is_ephemeral: boolean;
    is_logged_in: boolean;
    matched_identities: Record<string, unknown>;
    mpid?: MPID;
}

export interface IdentityModifyResultBody {
    change_results?: {
        identity_type: SDKIdentityTypeEnum;
        modified_mpid: MPID;
    };
}

export interface mParticleUserCart {
    add(product: SDKProduct | SDKProduct[], logEvent: boolean): void;
    remove(product: SDKProduct | SDKProduct[], logEvent: boolean): void;
    clear(): void;
    getCartProducts(): SDKProduct[];
}

// https://go.mparticle.com/work/SQDSDKS-5196
export type UserAttributes = AllUserAttributes;
