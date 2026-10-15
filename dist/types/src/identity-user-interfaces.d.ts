import { AllUserAttributes, MPID, User } from '@mparticle/web-sdk';
import { SDKIdentityTypeEnum } from './identity.interfaces';
import { MessageType } from './types';
import { BaseEvent, SDKProduct } from './sdkRuntimeModels';
declare const HTTPCodes: {
    readonly noHttpCoverage: -1;
    readonly activeIdentityRequest: -2;
    readonly activeSession: -3;
    readonly validationIssue: -4;
    readonly nativeIdentityRequest: -5;
    readonly loggingDisabledOrMissingAPIKey: -6;
    readonly tooManyRequests: 429;
};
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
export interface IMParticleUser extends User {
    getAllUserAttributes(): any;
    setUserTag(tagName: string, value?: any): void;
    setUserAttribute(key: string, value: any): void;
    getUserAudiences?(callback?: IdentityCallback): void;
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
export interface IdentityCallback {
    (result: IdentityResult): void;
}
export interface IIdentityResponse {
    responseText: IdentityResultBody;
    status: number;
    cacheMaxAge?: number;
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
    add(): void;
    remove(): void;
    clear(): void;
    getCartProducts(): SDKProduct[];
}
export type UserAttributes = AllUserAttributes;
export {};
