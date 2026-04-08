/**
 * Internal types for @mparticle/web-sdk
 *
 * These types are shared between mParticle and Rokt SDKs but are NOT part of
 * the public API. They may change without notice between minor versions.
 *
 * Usage:
 *   import type { IKitFilterSettings, IRoktKit, SDKProduct } from '@mparticle/web-sdk/internal';
 *
 * This entry point re-exports all public types so that internal consumers
 * only need a single import path.
 *
 * Customers should NOT import from this path.
 */

// Re-export all public types so internal consumers have a single import path
export * from './public-types';

// Kit / Forwarder types
export type {
    IKitConfigs,
    IKitFilterSettings,
    IFilteringEventAttributeValue,
    IFilteringUserAttributeValue,
    IFilteringConsentRuleValues,
    IConsentRuleValue,
} from './configAPIClient';

export type {
    UnregisteredKit,
    RegisteredKit,
    KitRegistrationConfig,
    ConfiguredKit,
    MPForwarder,
    UserIdentityId,
    UserIdentityType,
    UserAttributeFilters,
    UserIdentityFilters,
    forwardingStatsCallback,
} from './forwarders.interfaces';

// Rokt integration types
export type {
    RoktAttributeValue,
    RoktAttributeValueType,
    RoktAttributeValueArray,
    RoktAttributes,
    IRoktPartnerExtensionData,
    IRoktSelectPlacementsOptions,
    IRoktSelection,
    IRoktLauncher,
    IRoktMessage,
    RoktKitFilterSettings,
    IRoktKitSettings,
    IRoktKit,
    IRoktOptions,
    IRoktLauncherOptions,
} from './roktManager';

// Reporting / Error types
export {
    ErrorCodes,
    WSDKErrorSeverity,
} from './reporting/types';

export type {
    ISDKError,
    ISDKLogEntry,
    IErrorReportingService,
    ILoggingService,
} from './reporting/types';

// SDK internals shared between kits
export type {
    SDKEvent,
    SDKProductAction,
    SDKProductActionType,
    SDKPromotionAction,
    SDKShoppingCart,
    SDKGeoLocation,
    SDKDataPlan,
    SDKHelpersApi,
    SDKLoggerApi,
    SDKStoreApi,
    SDKConfigApi,
    KitBlockerOptions,
    IMParticleInstanceManager,
} from './sdkRuntimeModels';

// Events interface (kit forwarding contract)
export type { IEvents } from './events.interfaces';

// eCommerce internals
export type { IECommerce } from './ecommerce.interfaces';

// Identity internals
export type {
    IIdentity,
    IIdentityRequest,
    IIdentityAPIRequestData,
    IIdentityAPIModifyRequestData,
    IdentityAPIMethod,
} from './identity.interfaces';

// Consent internals
export type {
    IConsentRules,
    IConsentRulesValues,
    IConsentSerialization,
    IMinifiedConsentJSONObject,
    IConsentState,
    IConsent,
} from './consent';
