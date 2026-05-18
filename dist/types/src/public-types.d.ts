/**
 * Public types for @mparticle/web-sdk
 *
 * These types are part of the stable public API and are safe for customers
 * to import. Only add types here that are intended for external consumption.
 *
 * Usage:
 *   import type { SDKInitConfig, EventType } from '@mparticle/web-sdk';
 *
 * Note: These native types replace the historical dependency on
 * @types/mparticle__web-sdk so monorepo packages can type-check against the
 * local SDK before a coordinated release is published.
 */
import type { MParticleWebSDK } from './sdkRuntimeModels';
declare global {
    interface Window {
        mParticle?: MParticleWebSDK & Record<string, any>;
    }
}
export type { Batch, } from '@mparticle/event-models';
export type { EventType, CommerceEventType, IdentityType, ProductActionType, PromotionActionType, MessageType, } from './types';
export type { SDKInitConfig, DataPlanConfig, BaseEvent, SDKEventCustomFlags, LogLevelType, MParticleWebSDK, } from './sdkRuntimeModels';
export type { AllUserAttributes, Callback, CCPAConsentState, ConsentState, GDPRConsentState, IdentityApiData, IdentifyRequest, MPConfiguration, MPID, PrivacyConsentState, Product, RoktAttributeValue, RoktAttributeValueArray, RoktAttributeValueType, RoktAttributes, RoktSelection, SDKEventAttrs, SDKEventOptions, TransactionAttributes, User, UserIdentities, } from './publicSdkTypes';
export type { IMParticleUser, IdentityCallback, IdentityResult, IdentityResultBody, IdentityModifyResultBody, ISDKUserIdentity, ISDKUserAttributes, } from './identity-user-interfaces';
export type { SDKIdentityApi, IAliasRequest, IAliasCallback, IAliasResult, SDKIdentityTypeEnum, IIdentitySearchResult, IIdentitySearchResponseBody, IdentitySearchCallback, IUserIdentities, } from './identity.interfaces';
export type { SDKECommerceAPI, SDKCart, } from './ecommerce.interfaces';
export type { SDKProduct, SDKPromotion, SDKImpression, SDKProductImpression, } from './sdkRuntimeModels';
export type { SDKConsentApi, SDKConsentState, SDKConsentStateData, SDKGDPRConsentState, SDKCCPAConsentState, } from './consent';
export type { Dictionary, valueof } from './utils';
