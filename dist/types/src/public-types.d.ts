/**
 * Public types for @mparticle/web-sdk
 *
 * These types are part of the stable public API and are safe for customers
 * to import. Only add types here that are intended for external consumption.
 *
 * Usage:
 *   import type { SDKInitConfig, EventType } from '@mparticle/web-sdk';
 *
 * Note: Types from @types/mparticle__web-sdk (e.g., MPConfiguration, MPID,
 * ConsentState) are NOT re-exported here to avoid circular references.
 * Consumers get those automatically via DefinitelyTyped until they are
 * natively defined in this SDK and the DT package is deprecated.
 */
export type { Batch, } from '@mparticle/event-models';
export type { EventType, CommerceEventType, IdentityType, ProductActionType, PromotionActionType, MessageType, } from './types';
export type { SDKInitConfig, DataPlanConfig, BaseEvent, SDKEventCustomFlags, LogLevelType, MParticleWebSDK, } from './sdkRuntimeModels';
export type { IMParticleUser, IdentityCallback, IdentityResult, IdentityResultBody, IdentityModifyResultBody, ISDKUserIdentity, ISDKUserAttributes, } from './identity-user-interfaces';
export type { SDKIdentityApi, IAliasRequest, IAliasCallback, IAliasResult, SDKIdentityTypeEnum, } from './identity.interfaces';
export type { SDKECommerceAPI, SDKCart, } from './ecommerce.interfaces';
export type { SDKProduct, SDKPromotion, SDKImpression, SDKProductImpression, } from './sdkRuntimeModels';
export type { SDKConsentApi, SDKConsentState, SDKConsentStateData, SDKGDPRConsentState, SDKCCPAConsentState, } from './consent';
export type { Dictionary, valueof } from './utils';
