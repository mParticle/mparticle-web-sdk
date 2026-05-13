import type { AllUserAttributes, IdentityCallback, IdentityResultBody, User } from './publicSdkTypes';
import { SDKIdentityTypeEnum } from './identity.interfaces';
import { MessageType } from './types';
import { BaseEvent, SDKProduct } from './sdkRuntimeModels';
export type { IdentityCallback, IdentityModifyResultBody, IdentityResult, IdentityResultBody, } from './publicSdkTypes';
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
export interface IIdentityResponse {
    responseText: IdentityResultBody;
    status: number;
    cacheMaxAge?: number;
    expireTimestamp?: number;
}
export interface mParticleUserCart {
    add(): void;
    remove(): void;
    clear(): void;
    getCartProducts(): SDKProduct[];
}
export type UserAttributes = AllUserAttributes;
