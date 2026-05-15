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
export * from './public-types';
export type { KitInterface, } from './forwarders.interfaces';
export type { RoktAttributeValue, RoktAttributeValueType, RoktAttributeValueArray, RoktAttributes, IRoktPartnerExtensionData, IRoktSelectPlacementsOptions, IRoktSelection, IRoktLauncher, IRoktMessage, RoktKitFilterSettings, IRoktKitSettings, IRoktKit, IRoktOptions, IRoktLauncherOptions, } from './roktManager';
export type { ErrorCodes, WSDKErrorSeverity, } from './reporting/types';
export type { ISDKError, ISDKLogEntry, IErrorReportingService, ILoggingService, } from './reporting/types';
export type { SDKEvent, SDKProductAction, SDKProductActionType, SDKPromotionAction, SDKShoppingCart, SDKGeoLocation, SDKDataPlan, SDKLoggerApi, SDKConfigApi, IMParticleInstanceManager, } from './sdkRuntimeModels';
