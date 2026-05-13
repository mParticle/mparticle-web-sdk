/**
 * Public types for @mparticle/web-sdk
 *
 * These types are part of the stable public API and are safe for customers
 * to import. Only add types here that are intended for external consumption.
 *
 * Usage:
 *   import type { SDKInitConfig, EventType } from '@mparticle/web-sdk';
 *
 * These declarations replace the legacy DefinitelyTyped surface. Keep this
 * file focused on customer-facing SDK types; kit and SDK implementation types
 * belong in internal-types.ts.
 */

// Re-export types from @mparticle/event-models
// Consumers should not need to install @mparticle/event-models directly
export type {
    Batch,
} from '@mparticle/event-models';

// Legacy DefinitelyTyped-owned public primitives now owned by this package
export type {
    AliasRequestScope,
    AliasUsersCallback,
    AllUserAttributes,
    Callback,
    Cart,
    CCPAConsentState,
    ConsentState,
    DataPlanConfig,
    DataPlanResult,
    Dictionary,
    GDPRConsentState,
    IdentityApiData,
    IdentityCallback,
    IdentityModifyResultBody,
    IdentityResult,
    IdentityResultBody,
    IdentifyRequest,
    Impression,
    Location,
    Logger,
    LogLevel,
    MPConfiguration,
    MPForwarder,
    MPID,
    OnCreateBatch,
    onCreateBatch,
    PrivacyConsentState,
    Product,
    Promotion,
    SDKEventAttrs,
    SDKEventAttrTypes,
    SDKEventCustomFlags,
    SDKEventOptions,
    TrackLocationCallback,
    TransactionAttributes,
    User,
    UserAliasRequest,
    UserAttributesValue,
    UserIdentities,
} from './publicSdkTypes';

// Enums / Constants (type-only to avoid runtime mismatch with entry point)
export type {
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
    BaseEvent,
    LogLevelType,
    MParticleWebSDK,
} from './sdkRuntimeModels';

// User & Identity
export type {
    IMParticleUser,
    ISDKUserIdentity,
    ISDKUserAttributes,
} from './identity-user-interfaces';

export type {
    SDKIdentityApi,
    IAliasRequest,
    IAliasCallback,
    IAliasResult,
    SDKIdentityTypeEnum,
    IIdentitySearchResult,
    IIdentitySearchResponseBody,
    IdentitySearchCallback,
    IUserIdentities,
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

// Consent API facade types
export type {
    SDKConsentApi,
    SDKConsentState,
    SDKConsentStateData,
    SDKGDPRConsentState,
    SDKCCPAConsentState,
} from './consent';

// Utilities
export type { valueof } from './utils';
