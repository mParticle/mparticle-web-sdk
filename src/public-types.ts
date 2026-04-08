/**
 * Public types for @mparticle/web-sdk
 *
 * These types are part of the stable public API and are safe for customers
 * to import. Only add types here that are intended for external consumption.
 *
 * Usage:
 *   import type { MPConfiguration, EventType } from '@mparticle/web-sdk';
 */

// Re-export types from @mparticle/web-sdk (DefinitelyTyped)
// These will eventually be defined natively once the DT package is deprecated
export type {
    AllUserAttributes,
    Callback,
    CCPAConsentState,
    ConsentState,
    GDPRConsentState,
    IdentityApiData,
    MPConfiguration,
    MPID,
    PrivacyConsentState,
    SDKEventAttrs,
    SDKEventOptions,
    TransactionAttributes,
    User,
    UserIdentities,
} from '@mparticle/web-sdk';

// Re-export types from @mparticle/event-models
// Consumers should not need to install @mparticle/event-models directly
export type {
    Batch,
    CommerceEvent,
    CustomEvent,
    ScreenViewEvent,
} from '@mparticle/event-models';

// Re-export types from @mparticle/data-planning-models
export type { DataPlanVersion } from '@mparticle/data-planning-models';

// Enums / Constants
export {
    EventType,
    CommerceEventType,
    IdentityType,
    ProductActionType,
    PromotionActionType,
    MessageType,
} from './types';

// Configuration
export type {
    SDKInitConfig,
    DataPlanConfig,
    BaseEvent,
    SDKEventCustomFlags,
    LogLevelType,
    MParticleWebSDK,
} from './sdkRuntimeModels';

// User & Identity
export type {
    IMParticleUser,
    IdentityCallback,
    IdentityResult,
    IdentityResultBody,
    IdentityModifyResultBody,
    ISDKUserIdentity,
    ISDKUserAttributes,
} from './identity-user-interfaces';

export type {
    SDKIdentityApi,
    IAliasRequest,
    IAliasCallback,
    IAliasResult,
    SDKIdentityTypeEnum,
} from './identity.interfaces';

// eCommerce
export type {
    SDKECommerceAPI,
    SDKCart,
} from './ecommerce.interfaces';

export type {
    SDKProduct,
    SDKPromotion,
    SDKImpression,
    SDKProductImpression,
} from './sdkRuntimeModels';

// Consent
export type {
    SDKConsentApi,
    SDKConsentState,
    SDKConsentStateData,
    SDKGDPRConsentState,
    SDKCCPAConsentState,
} from './consent';

// Utilities
export type { Dictionary, valueof } from './utils';
