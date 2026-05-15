import type {
    AllUserAttributes,
    MPID,
    User,
} from './publicSdkTypes';
import type { SDKIdentityTypeEnum } from './identity.interfaces';
import { MessageType } from './types';
import type { BaseEvent, SDKProduct } from './sdkRuntimeModels';

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

export type IdentityHTTPCode =
    | -1 // noHttpCoverage
    | -2 // activeIdentityRequest
    | -3 // activeSession
    | -4 // validationIssue
    | -5 // nativeIdentityRequest
    | -6 // loggingDisabledOrMissingAPIKey
    | 200
    | 202
    | 400
    | 429;

export interface IdentityResult {
    httpCode: IdentityHTTPCode;
    getPreviousUser(): User;
    getUser(): User;
    body: IdentityResultBody | IdentityModifyResultBody;
}

// https://go.mparticle.com/work/SQDSDKS-6460
export interface IdentityCallback {
    (result: IdentityResult): void;
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

export interface IIdentityResponse {
    // https://go.mparticle.com/work/SQDSDKS-6672
    responseText: IdentityResultBody;
    status: number;
    cacheMaxAge?: number; // Default: 86400
    expireTimestamp?: number;
}

export interface mParticleUserCart {
    add(): void;
    remove(): void;
    clear(): void;
    getCartProducts(): SDKProduct[];
}

// https://go.mparticle.com/work/SQDSDKS-5196
export type UserAttributes = AllUserAttributes;
