/**
 * Public types for @mparticle/web-sdk
 *
 * These types are part of the stable public API and are safe for customers
 * to import. Only add types here that are intended for external consumption.
 *
 * Usage:
 *   import type { SDKInitConfig } from '@mparticle/web-sdk';
 *
 * These declarations replace the legacy DefinitelyTyped surface. Keep this
 * file focused on customer-facing SDK types; kit and SDK implementation types
 * belong in internal-types.ts.
 */

import type { MParticleWebSDKManager } from './sdkRuntimeModels';
import type { IMPSideloadedKit } from './sideloadedKit';

declare const mParticle: MParticleWebSDKManager;

export default mParticle;

interface WindowMParticle extends MParticleWebSDKManager {
    [key: string]: any;
    getInstance(): any;
    getInstance(instanceName: string): any;
}

declare global {
    interface Window {
        mParticle: WindowMParticle;
    }
}

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
    GDPRConsentState,
    IdentityApiData,
    IdentifyRequest,
    Impression,
    LauncherOptions,
    Location,
    Logger,
    LogLevel,
    MPConfiguration,
    MPForwarder,
    MPID,
    OnCreateBatch,
    OnUserAlias,
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
    UserIdentityValue,
    UserIdentities,
} from './publicSdkTypes';

export type MPSideloadedKit = IMPSideloadedKit;

export type {
    IFilteringConsentRuleValues as FilteringConsentRuleValues,
    IFilteringEventAttributeValue as FilteringEventAttributeValue,
    IFilteringUserAttributeValue as FilteringUserAttributeValue,
    IKitFilterSettings as KitFilterSettings,
} from './configAPIClient';

// Configuration
export type {
    SDKInitConfig,
    BaseEvent,
    DataPlanConfig,
    LogLevelType,
    MParticleWebSDKInstance,
    MParticleWebSDKManager,
    MParticleWebSDK,
} from './sdkRuntimeModels';

// User & Identity
export type {
    IdentityCallback,
    IdentityHTTPCode,
    IdentityModifyResultBody,
    IdentityResult,
    IdentityResultBody,
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
    RoktAttributes,
    RoktAttributeValue,
    RoktAttributeValueArray,
    RoktAttributeValueType,
    IRoktPartnerExtensionData as RoktPartnerExtensionData,
    RoktPlacement,
    RoktPlacementEvent,
    IRoktSelectPlacementsOptions as RoktSelectPlacementsOptions,
    RoktSelection,
    RoktSubscriber,
    RoktUnsubscriber,
} from './roktManager';

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
export type { Dictionary, valueof } from './utils';
