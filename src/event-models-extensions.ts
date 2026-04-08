/**
 * Module augmentation to align @mparticle/event-models with the mParticle
 * Events API JSON Schema.
 *
 * Schema source:
 *   https://docs.mparticle.com/schema/mparticle.inbound.eventsapi.schema.json
 *
 * -----------------------------------------------------------------------
 * Section 1 — Fields present in the schema but missing from TypeScript
 * -----------------------------------------------------------------------
 * These are added via interface merging so every existing import of the
 * affected interface picks them up automatically.
 *
 * -----------------------------------------------------------------------
 * Section 2 — Fields present in TypeScript but absent from the schema
 * -----------------------------------------------------------------------
 * The following properties exist in @mparticle/event-models but are NOT in
 * the JSON schema.  They are SDK-specific additions and cannot be removed
 * from the upstream package here:
 *
 *   Batch.modified
 *   ApplicationInformation.sideloaded_kits_count
 *   CommonEventData.custom_flags
 *   CommonEventData.active_time_on_site_ms
 *
 * -----------------------------------------------------------------------
 * Section 3 — Enum value mismatches
 * -----------------------------------------------------------------------
 * TypeScript enums are closed and cannot be augmented.  Where the schema
 * defines values absent from a TS enum we export companion const objects
 * so consuming code can reference the additional values.
 *
 * -----------------------------------------------------------------------
 * Section 4 — Required-vs-optional mismatches
 * -----------------------------------------------------------------------
 * The schema marks `data` as required on all event types, but the TS
 * interfaces declare it optional (`data?`).  We export strict variants
 * of each event interface that enforce the requirement.
 */

import {
    GeoLocation,
    ApplicationStateTransitionEvent,
    ApplicationStateTransitionEventData,
    BreadcrumbEvent,
    BreakcrumbEventData,
    CommerceEvent,
    CommerceEventData,
    CrashReportEvent,
    CrashReportEventData,
    CustomEvent,
    CustomEventData,
    NetworkPerformanceEvent,
    NetworkPerformanceEventData,
    OptOutEvent,
    OptOutEventData,
    ProfileEvent,
    ProfileEventData,
    PushMessageEvent,
    PushMessageEventData,
    PushRegistrationEvent,
    PushRegistrationEventData,
    ScreenViewEvent,
    ScreenViewEventData,
    SessionEndEvent,
    SessionEndEventData,
    SessionStartEvent,
    SessionStartEventData,
    UserAttributeChangeEvent,
    UserAttributeChangeEventData,
    UserIdentityChangeEvent,
    UserIdentityChangeEventData,
} from '@mparticle/event-models';

// -----------------------------------------------------------------------
// Section 1 — Interface augmentation
// -----------------------------------------------------------------------
declare module '@mparticle/event-models' {
    interface Batch {
        /** MPID that originated the batch (schema field) */
        origin_mpid?: string | number;
    }

    interface DeviceInformation {
        /** Apple App Tracking Transparency authorization status */
        att_authorization_status?: string;
        /** Unix timestamp (ms) of ATT prompt */
        att_timestamp_unixtime_ms?: number;
    }

    interface GeoLocation {
        dma_code?: number;
        country_code?: string;
        region_code?: string;
        postal_code?: string;
        location_source?: string;
        city_name?: string;
    }

    interface Context {
        location?: GeoLocation;
    }

    interface GDPRConsentState {
        regulation?: string;
    }
}

// -----------------------------------------------------------------------
// Section 3 — Extended enum values
// -----------------------------------------------------------------------

/**
 * DeviceInformationPlatformEnum values present in the schema but missing
 * from the TypeScript enum.  The schema also does NOT include "desktop",
 * which the TS enum does include.
 */
export const DeviceInformationPlatformEnumExtensions = {
    alexa: 'alexa',
    fireTV: 'fire_tv',
} as const;

/**
 * CommerceEventDataCustomEventTypeEnum values present in the schema but
 * missing from the TypeScript enum.
 *
 * The first nine values already exist in CustomEventDataCustomEventTypeEnum
 * but are absent from the commerce-specific enum.  The last three
 * (attribution, consent_granted, consent_denied) are absent from ALL TS
 * enums.
 */
export const CommerceEventDataCustomEventTypeEnumExtensions = {
    navigation: 'navigation',
    location: 'location',
    search: 'search',
    transaction: 'transaction',
    userContent: 'user_content',
    userPreference: 'user_preference',
    social: 'social',
    other: 'other',
    media: 'media',
    attribution: 'attribution',
    consentGranted: 'consent_granted',
    consentDenied: 'consent_denied',
} as const;

/**
 * Custom event type values present in the schema but missing from ALL
 * TypeScript enums (both CustomEventData and CommerceEventData).
 */
export const CustomEventTypeEnumExtensions = {
    attribution: 'attribution',
    consentGranted: 'consent_granted',
    consentDenied: 'consent_denied',
} as const;

/**
 * Note: The following TS enums include an "Unknown" / "unknown" member that
 * is NOT present in the schema:
 *   - BatchEnvironmentEnum
 *   - ApplicationInformationOsEnum
 *   - CustomEventDataCustomEventTypeEnum
 *   - ProductActionActionEnum
 *
 * These cannot be removed from the upstream package here.
 */

// -----------------------------------------------------------------------
// Section 4 — Strict event types (data required, per schema)
// -----------------------------------------------------------------------

export type StrictApplicationStateTransitionEvent = Omit<ApplicationStateTransitionEvent, 'data'> & { data: ApplicationStateTransitionEventData };
export type StrictBreadcrumbEvent = Omit<BreadcrumbEvent, 'data'> & { data: BreakcrumbEventData };
export type StrictCommerceEvent = Omit<CommerceEvent, 'data'> & { data: CommerceEventData };
export type StrictCrashReportEvent = Omit<CrashReportEvent, 'data'> & { data: CrashReportEventData };
export type StrictCustomEvent = Omit<CustomEvent, 'data'> & { data: CustomEventData };
export type StrictNetworkPerformanceEvent = Omit<NetworkPerformanceEvent, 'data'> & { data: NetworkPerformanceEventData };
export type StrictOptOutEvent = Omit<OptOutEvent, 'data'> & { data: OptOutEventData };
export type StrictProfileEvent = Omit<ProfileEvent, 'data'> & { data: ProfileEventData };
export type StrictPushMessageEvent = Omit<PushMessageEvent, 'data'> & { data: PushMessageEventData };
export type StrictPushRegistrationEvent = Omit<PushRegistrationEvent, 'data'> & { data: PushRegistrationEventData };
export type StrictScreenViewEvent = Omit<ScreenViewEvent, 'data'> & { data: ScreenViewEventData };
export type StrictSessionEndEvent = Omit<SessionEndEvent, 'data'> & { data: SessionEndEventData };
export type StrictSessionStartEvent = Omit<SessionStartEvent, 'data'> & { data: SessionStartEventData };
export type StrictUserAttributeChangeEvent = Omit<UserAttributeChangeEvent, 'data'> & { data: UserAttributeChangeEventData };
export type StrictUserIdentityChangeEvent = Omit<UserIdentityChangeEvent, 'data'> & { data: UserIdentityChangeEventData };
